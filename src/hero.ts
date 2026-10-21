// The player's live state in a fight: HP, MP, shield, buffs, skill cooldowns, death.

import { computeStats } from "./stats";
import type { Stats } from "./stats";
import type { Progress, StatBag } from "./progression";

export interface Buff {
  id: string;
  name: string;
  stats: StatBag;
  t: number;
  duration: number;
}

export const RESPAWN_TIME = 4;

export class Hero {
  progress: Progress;
  weapon: () => string | null;
  offhand: () => string | null;
  buffs: Buff[] = [];
  shield: { amount: number; max: number; t: number } | null = null;
  cooldowns = new Map<string, number>();  // skill id -> seconds left
  cdTotal = new Map<string, number>();    // skill id -> the cooldown it started with
  dead = 0;  // seconds until respawn while dead
  hurt = 0;  // red flash after being hit
  stats!: Stats;
  hp = Infinity;
  mp = Infinity;

  // weapon(), offhand(): what each hand holds
  constructor(progress: Progress, weapon: () => string | null, offhand: () => string | null = () => null) {
    this.progress = progress;
    this.weapon = weapon;
    this.offhand = offhand;
    this.recompute();
    this.hp = this.stats.maxHp;
    this.mp = this.stats.maxMp;
  }

  get alive(): boolean {
    return this.dead <= 0;
  }

  recompute(): void {
    this.stats = computeStats(this.progress, this.weapon(), this.buffs, this.offhand());
    this.hp = Math.min(this.hp, this.stats.maxHp);
    this.mp = Math.min(this.mp, this.stats.maxMp);
  }

  refill(): void {
    this.recompute();
    this.hp = this.stats.maxHp;
    this.mp = this.stats.maxMp;
  }

  // Returns "respawn" on the frame the hero comes back.
  update(dt: number): "respawn" | null {
    this.hurt = Math.max(0, this.hurt - dt);
    for (const [id, t] of this.cooldowns) {
      if (t - dt <= 0) this.cooldowns.delete(id);
      else this.cooldowns.set(id, t - dt);
    }
    if (this.dead > 0) {
      this.dead -= dt;
      if (this.dead <= 0) {
        this.buffs = [];
        this.shield = null;
        this.refill();
        return "respawn";
      }
      return null;
    }
    const before = this.buffs.length;
    this.buffs = this.buffs.filter((b) => (b.t -= dt) > 0);
    if (this.buffs.length !== before) this.recompute();
    if (this.shield && (this.shield.t -= dt) <= 0) this.shield = null;
    this.hp = Math.min(this.stats.maxHp, this.hp + this.stats.hpRegen * dt);
    this.mp = Math.min(this.stats.maxMp, this.mp + this.stats.mpRegen * dt);
    return null;
  }

  // Returns the HP actually lost; "died" is set on the hit that kills.
  takeDamage(amount: number): { lost: number; absorbed: number; died?: boolean } {
    if (!this.alive) return { lost: 0, absorbed: 0 };
    let absorbed = 0;
    if (this.shield) {
      absorbed = Math.min(this.shield.amount, amount);
      this.shield.amount -= absorbed;
      if (this.shield.amount <= 0) this.shield = null;
    }
    const lost = amount - absorbed;
    this.hp -= lost;
    if (lost > 0) this.hurt = 0.25;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = RESPAWN_TIME;
      return { lost, absorbed, died: true };
    }
    return { lost, absorbed };
  }

  heal(amount: number): number {
    const before = this.hp;
    this.hp = Math.min(this.stats.maxHp, this.hp + amount);
    return this.hp - before;
  }

  spend(mp: number): boolean {
    if (this.mp < mp) return false;
    this.mp -= mp;
    return true;
  }

  addBuff(id: string, name: string, stats: StatBag, duration: number): void {
    this.buffs = this.buffs.filter((b) => b.id !== id);
    this.buffs.push({ id, name, stats, t: duration, duration });
    this.recompute();
  }

  addShield(amount: number, duration: number): void {
    const cur = this.shield?.amount ?? 0;
    this.shield = { amount: Math.max(cur, amount), max: Math.max(cur, amount), t: duration };
  }
}

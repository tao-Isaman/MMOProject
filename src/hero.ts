// The player's live state in a fight: HP, MP, shield, buffs, skill cooldowns, death. Besides the
// buffs, three things go into the stats here: the third job's bonus and growth (job3Stats),
// whatever the kind of map underfoot gives (terrain passives and buffs, src/terrain.ts) and the
// element orbs she holds (an orb skill's buff for each). The shape she is in (a druid's form) is
// a buff of her own that marks it; falling takes it and the orbs away.

import { computeStats } from "./stats";
import type { Stats } from "./stats";
import { ACTIVES, TREES, job3Stats, needMet, offKind } from "./progression";
import type { ElementId, FormId, Progress, StatBag } from "./progression";
import { ITEMS } from "./items";
import type { TerrainKind } from "./terrain";

export interface Buff {
  id: string;
  name: string;
  stats: StatBag;
  t: number;
  duration: number;
  enchant?: ElementId; // the weapon hits in this element while it lasts
  // a terrain buff: its own stats, and more by the kind of map (stats is the sum for the one now)
  terrain?: { base: StatBag; by: Partial<Record<TerrainKind, StatBag>> };
  form?: FormId; // the shape she is in while it lasts (its id: the form skill's)
}

// An element orb held (SkillDef type "orb"): the skill that called it and its element.
export interface Orb {
  id: string;
  el: ElementId;
}
export const MAX_ORBS = 3;

// Two bags of stats added up.
function plus(a: StatBag, b: StatBag | undefined): StatBag {
  const out: StatBag = { ...a };
  for (const [k, v = 0] of Object.entries(b ?? {})) out[k] = (out[k] ?? 0) + v;
  return out;
}

export const RESPAWN_TIME = 4;

// HP and MP regen arrive every this many seconds (potions are what heals at once).
export const REGEN_TICK = 5;

export class Hero {
  progress: Progress;
  weapon: () => string | null;
  offhand: () => string | null;
  worn: () => (string | null)[];
  buffs: Buff[] = [];
  shield: { amount: number; max: number; t: number } | null = null;
  cooldowns = new Map<string, number>();  // skill id -> seconds left
  cdTotal = new Map<string, number>();    // skill id -> the cooldown it started with
  dead = 0;  // seconds until respawn while dead
  hurt = 0;  // red flash after being hit
  stats!: Stats;
  hp = Infinity;
  regenClock = 0; // seconds since the last regen tick
  regenHp = 0;    // what has built up since then
  regenMp = 0;
  mp = Infinity;
  terrain: TerrainKind = "town"; // the kind of map she stands on (main.ts sets it on every map)
  orbs: Orb[] = [];               // oldest first

  // weapon(), offhand(): what each hand holds; worn(): the hat, shoes, rings and trinkets
  constructor(progress: Progress, weapon: () => string | null, offhand: () => string | null = () => null, worn: () => (string | null)[] = () => []) {
    this.progress = progress;
    this.weapon = weapon;
    this.offhand = offhand;
    this.worn = worn;
    this.recompute();
    this.hp = this.stats.maxHp;
    this.mp = this.stats.maxMp;
  }

  get alive(): boolean {
    return this.dead <= 0;
  }

  recompute(): void {
    const more = [{ stats: job3Stats(this.progress) }, { stats: this.terrainPassives() }];
    // each orb its skill's buff at that skill's rank (two of one element: twice)
    const orbs = this.orbs.map((o) => ({ stats: ACTIVES[o.id]?.skill.buff?.(this.progress.skillRank(o.id)) ?? {} }));
    this.stats = computeStats(this.progress, this.weapon(), [...this.buffs, ...more, ...orbs], this.offhand(), this.worn(), this.form?.form ?? null);
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
    // HP and MP come back in a lump every REGEN_TICK seconds: what the rates added up to since
    // the last tick (a regen buff that ends between ticks still pays in full at the next)
    this.regenHp += this.stats.hpRegen * dt;
    this.regenMp += this.stats.mpRegen * dt;
    if ((this.regenClock += dt) >= REGEN_TICK) {
      this.regenClock -= REGEN_TICK;
      this.hp = Math.min(this.stats.maxHp, this.hp + this.regenHp);
      this.mp = Math.min(this.stats.maxMp, this.mp + this.regenMp);
      this.regenHp = this.regenMp = 0;
    }
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
      // she falls as herself, and her orbs go
      this.orbs = [];
      this.buffs = this.buffs.filter((b) => !b.form);
      this.recompute();
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

  // A buff (the same one again starts over); an enchant replaces any other enchant. terrain: more
  // stats by the kind of map, which follow her from map to map.
  addBuff(id: string, name: string, stats: StatBag, duration: number, enchant?: ElementId, terrain?: Partial<Record<TerrainKind, StatBag>>): void {
    this.buffs = this.buffs.filter((b) => b.id !== id && !(enchant && b.enchant));
    const t = terrain ? { base: stats, by: terrain } : undefined;
    this.buffs.push({ id, name, stats: t ? plus(stats, terrain![this.terrain]) : stats, t: duration, duration, enchant, terrain: t });
    this.recompute();
  }

  // The shape she is in (a form skill's buff), if any.
  get form(): Buff | undefined {
    return this.buffs.find((b) => b.form);
  }

  // Into a shape for `duration` s with its stats (out of any other first).
  takeForm(id: string, name: string, form: FormId, stats: StatBag, duration: number): void {
    this.buffs = this.buffs.filter((b) => !b.form);
    this.buffs.push({ id, name, stats, t: duration, duration, form });
    this.recompute();
  }

  // Herself again. Whether she was in a shape.
  endForm(): boolean {
    if (!this.form) return false;
    this.buffs = this.buffs.filter((b) => !b.form);
    this.recompute();
    return true;
  }

  // An orb of `el` from orb skill `id`: a fourth sends the oldest away.
  addOrb(id: string, el: ElementId): void {
    this.orbs.push({ id, el });
    if (this.orbs.length > MAX_ORBS) this.orbs.shift();
    this.recompute();
  }

  // What an invoke reads the orbs as: their elements sorted and joined by "+" ("fire+fire+ice"),
  // or null while fewer than three are held.
  get orbKey(): string | null {
    return this.orbs.length < MAX_ORBS ? null : this.orbs.map((o) => o.el).sort().join("+");
  }

  // On to another kind of map: the terrain buffs and passives change with it.
  setTerrain(kind: TerrainKind): void {
    this.terrain = kind;
    for (const b of this.buffs) if (b.terrain) b.stats = plus(b.terrain.base, b.terrain.by[kind]);
    this.recompute();
  }

  // What the learned passives with terrain stats give on this kind of map (while their need is met).
  terrainPassives(): StatBag {
    let out: StatBag = {};
    const main = this.weapon(), w = (main && ITEMS[main]?.weapon) ?? null, off = offKind(this.offhand()), form = this.form?.form ?? null;
    for (const tree of this.progress.trees()) {
      for (const n of TREES[tree]?.nodes ?? []) {
        const r = this.progress.ranks[n.id];
        if (r && n.terrain && needMet(n.need, w, off, form)) out = plus(out, n.terrain(r)[this.terrain]);
      }
    }
    return out;
  }

  // Hidden from monsters (a hide buff); the first blow from hiding ends it.
  get hidden(): boolean {
    return this.stats.stealth > 0;
  }

  reveal(): void {
    const before = this.buffs.length;
    this.buffs = this.buffs.filter((b) => !b.stats.stealth);
    if (this.buffs.length !== before) this.recompute();
  }

  // The element the weapon hits in (an enchant buff), or null.
  get enchant(): ElementId | null {
    return this.buffs.find((b) => b.enchant)?.enchant ?? null;
  }

  // Ailments are buffs whose id starts with "ail_" (stats that hurt, from elemental bites).
  cleanse(): void {
    const before = this.buffs.length;
    this.buffs = this.buffs.filter((b) => !b.id.startsWith("ail_"));
    if (this.buffs.length !== before) this.recompute();
  }

  addShield(amount: number, duration: number): void {
    const cur = this.shield?.amount ?? 0;
    this.shield = { amount: Math.max(cur, amount), max: Math.max(cur, amount), t: duration };
  }
}

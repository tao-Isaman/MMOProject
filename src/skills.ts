// Active skills: checks (learned, weapon, MP, cooldown), the caster's animation, and the effect
// of each skill type, with element bonuses (progression.ts ELEMENTS, milestones in brackets):
//   fire       +1% skill damage per level [50: +15% more]; [10: hits burn for 20% over 3 s, 35: 40%]
//   water      +2% healing per level; [10: hits heal 5% of the damage, 50: 10%;
//              35: every skill heals 3% max HP]
//   wind       cooldown (in stats); [10: +25% move speed for 2 s after a skill;
//              35: 15% chance a skill's cooldown is skipped]
//   earth      shield of 0.4% max HP per level on every skill [35: twice that];
//              [10: stuns, slows and freezes last 30% longer]
//   lightning  +0.3% physical skill crit (spells: +0.3% damage) per level; [10: hits jump to one more monster for 30%;
//              35: to two; 50: for 60%]
// and the elements that work through their own hits (SkillDef.element; elementHit), besides
// that element's attack against the target's defence in it (stats.ts):
//   ice    chills: bites 10% + 0.6%/level slower for 3 s [10: 5 s; 35: 10% freeze 1.5 s; 50: twice]
//   light  goes through 20% + 1.6%/level of the armour [35: 20% more] (stats.ts lightPierce)
//   dark   10% + 0.6%/level: blind, weaken or poison for 4 s [10: 6 s; 35: two at once]
//   stone  4% + 0.3%/level: turned to stone 2 s [10: 3 s; 35: half as likely again;
//          50: stone takes 25% more, combat.ts]
//   mud    20% + 0.8%/level slower for 3 s [10: 5 s; 35: held 0.5 s; 50: half as slow again]
//   lava   burns 15% + 0.7%/level of the hit over 3 s [20: 5 s; 50: twice]
//   plant  (any skill) heals 0.1% max HP a level [35: twice]; [10: clears the player's ailments]
//   metal  (bitten) sends part of the bite back (stats reflect; main.ts)
//
// Skill types: bolt, fan (projectiles) · blast (at the aimed point, `hits` times) · nova, storm
// (around the caster) · cone (in front) · beam (a line) · dash (no `mult`: a teleport) · heal ·
// shield · buff · flower.
//
// A spell with a cast time (SkillDef.cast, shortened by the castRed stat) is read out first: the
// caster stands still under a cast bar, and it goes off when the bar fills, only then costing its
// MP and starting its cooldown. Walking off (or falling) lets it go for nothing. The monsters it
// is aimed at feel it coming and turn on the caster, so the heavy spells cost a risk as well; a
// spell aimed at a monster (or at a spot with monsters in it) follows that one when it moves.

import { ACTIVES, MASTERIES } from "./progression";
import type { ElementId, Progress, SkillDef } from "./progression";
import { skillDamage } from "./stats";
import { shapeTargets } from "./combat";
import type { Combat, Floaters } from "./combat";
import { AIR_GLOW, GROUND_GLOW, rand } from "./particles";
import type { Particles } from "./particles";
import { FlowerSpell, CAST_TIME, HOVER_END } from "./spell";
import { WEAPON_TYPES } from "./items";
import type { WeaponId } from "./items";
import type { Hero } from "./hero";
import type { Player, AttackWeapon } from "./player";
import type { Monster } from "./monsters";
import type { Img, Textures, Vec2 } from "./types";

interface SkillDeps {
  progress: Progress;
  hero: Hero;
  player: Player;
  combat: Combat;
  monsters: Monster[];
  fx: Particles;
  tex: Textures;
  floaters: Floaters;
  spells: FlowerSpell[];
  weapon: () => string | null;
}

// The unit vector from a to b (null when they stand on each other).
function toward(a: Vec2, b: Vec2): Vec2 | null {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
  return d > 1 ? { x: dx / d, y: dy / d } : null;
}

// A rank-scaled number of a skill (missing ones count as 0).
const at = (f: ((r: number) => number) | undefined, rank: number) => f?.(rank) ?? 0;

const LEAD = 0.22; // s from the start of the animation to the hit
const RELEASE = 0.45; // s the caster's hands come down after a cast

// A spell being cast: what it was aimed at, and the monster it follows (its mark).
interface Casting {
  id: string;
  s: SkillDef;
  rank: number;
  dir: Vec2;
  aim: Vec2 | null;
  mark: Monster | null;
  locked: boolean; // the mark is a single-target skill's lock (it comes to nothing without it)
  left: number;    // s until it goes off
}

// One target, locked on (a shot that homes in, a blow at the one in front); the other damage
// skills reach an area (aimed at a spot on the ground, along a line or round the player).
export function singleTarget(s: SkillDef): boolean {
  return (s.type === "bolt" && !s.pierce) || (s.type === "cone" && (s.arc ?? 90) <= 50);
}
// Skills placed on a spot of the ground (aimed with a disc before they go, src/main.ts); the
// rest of the area skills go round the player or along the line it faces.
export function groundTarget(s: SkillDef): boolean {
  return s.type === "blast";
}

export class Skills {
  progress: Progress;
  hero: Hero;
  player: Player;
  combat: Combat;
  monsters: Monster[];
  fx: Particles;
  tex: Textures;
  floaters: Floaters;
  spells: FlowerSpell[];
  weapon: () => string | null;
  timers: { t: number; fn: () => void }[] = [];
  pending: Casting | null = null;

  constructor(deps: SkillDeps) {
    this.progress = deps.progress;
    this.hero = deps.hero;
    this.player = deps.player;
    this.combat = deps.combat;
    this.monsters = deps.monsters;
    this.fx = deps.fx;
    this.tex = deps.tex;
    this.floaters = deps.floaters;
    this.spells = deps.spells;
    this.weapon = deps.weapon;
  }

  get el(): Record<string, number> {
    return this.progress.elements;
  }

  // Why a skill can't go off now, or null.
  why(id: string): string | null {
    const a = ACTIVES[id];
    if (!a) return "ช่องว่าง";
    if (!this.progress.skillRank(id)) return "ยังไม่ได้เรียนสกิลนี้";
    if (!this.hero.alive) return "ล้มอยู่";
    const weapons = a.source.weapons;
    if (weapons && !weapons.includes(this.weapon() as WeaponId)) return `ต้องถือ${MASTERIES[a.source.mastery!].name}`;
    if (this.pending || this.player.casting || this.player.dashing) return "กำลังใช้สกิลอื่น";
    if (this.hero.cooldowns.has(id)) return "ยังติดคูลดาวน์";
    if (this.hero.mp < a.skill.mp) return "MP ไม่พอ";
    return null;
  }

  // The monster a single-target skill locks on to: the player's target, else the one nearest
  // the aimed spot, else the nearest in front, within its reach.
  lockFor(s: SkillDef, aim: Vec2 | null, dir: Vec2): Monster | null {
    const p = this.player, reach = s.type === "bolt" ? s.range ?? 500 : (s.reach ?? 150) + 40;
    const t = p.target as Monster | null;
    if (t?.alive && this.monsters.includes(t) && Math.hypot(t.x - p.x, t.y - p.y) - t.radius <= reach) return t;
    if (aim) {
      let best: Monster | null = null, bd = 240;
      for (const m of this.monsters) {
        if (!m.alive || Math.hypot(m.x - p.x, m.y - p.y) - m.radius > reach) continue;
        const d = Math.hypot(m.x - aim.x, m.y - aim.y) - m.radius;
        if (d < bd) [best, bd] = [m, d];
      }
      if (best) return best;
    }
    return this.combat.lockOn({ x: p.x, y: p.y, target: null }, dir, reach);
  }

  // How long a skill takes to cast for this hero (0: it goes off at once). The flower field keeps
  // its own timing (its carpet is drawn to it, spell.ts).
  castTime(s: SkillDef): number {
    if (!s.cast || s.type === "flower") return 0;
    return s.cast * (1 - this.hero.stats.castRed);
  }

  // Try a skill toward a world point. Returns null when it goes off (or its cast starts), or why
  // not.
  use(id: string, aim: Vec2 | null): string | null {
    const no = this.why(id);
    if (no) return no;
    const a = ACTIVES[id], rank = this.progress.skillRank(id), s = a.skill;
    // a single-target skill needs one in reach (before any MP goes)
    let dir0 = this.player.facing();
    if (aim) {
      const dx = aim.x - this.player.x, dy = aim.y - this.player.y, d = Math.hypot(dx, dy);
      if (d > 1) dir0 = { x: dx / d, y: dy / d };
    }
    const lock = singleTarget(s) ? this.lockFor(s, aim, dir0) : null;
    if (singleTarget(s) && !lock) return "ไม่มีเป้าหมายในระยะ";
    const p = this.player;
    const dir = lock ? toward(p, lock) ?? dir0 : dir0;
    const time = this.castTime(s);
    if (time > 0) {
      const mark = lock ?? this.markFor(s, dir, aim);
      this.pending = { id, s, rank, dir, aim, mark, locked: !!lock, left: time };
      p.startCast(time, time + RELEASE, dir);
      p.target = lock;
      this.notice(s, dir, aim, lock);
      return null;
    }
    if (!this.hero.spend(s.mp)) return "MP ไม่พอ";
    this.goOff(id, s, rank, dir, aim, lock);
    return null;
  }

  // A skill going off (at once, or when its cast bar fills: `cast`): its cooldown, the animation
  // of an instant one, its effect.
  goOff(id: string, s: SkillDef, rank: number, dir: Vec2, aim: Vec2 | null, lock: Monster | null, cast = false): void {
    const cd = s.cd * (1 - this.hero.stats.cdr);
    this.hero.cooldowns.set(id, cd);
    this.hero.cdTotal.set(id, cd);
    if ((this.el.wind ?? 0) >= 35 && Math.random() < 0.15) {
      this.hero.cooldowns.delete(id);
      this.floaters.add(this.player.x, this.player.y, 170, "พายุหมุน!", "info");
    }
    const p = this.player;
    // a locked skill keeps its target for the attacks after it
    p.target = lock;
    if (s.type === "flower") p.startCast(s.cast ?? CAST_TIME, HOVER_END);
    else if (!cast) p.startMotion(s.motion, dir, this.weaponStats());
    this.effect(id, s, rank, dir, aim, lock);
    this.afterCast();
  }

  // The monster an area spell being cast follows: the target, else the one nearest the aimed
  // spot within the spell's reach.
  markFor(s: SkillDef, dir: Vec2, aim: Vec2 | null): Monster | null {
    const t = this.player.target as Monster | null;
    const hit = this.noticed(s, dir, aim);
    if (t?.alive && hit.includes(t)) return t;
    const c = aim ?? this.player;
    return hit.sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))[0] ?? null;
  }

  // The monsters a spell is aimed at: what its area would catch as it stands.
  noticed(s: SkillDef, dir: Vec2, aim: Vec2 | null): Monster[] {
    const p = this.player, me = { x: p.x, y: p.y };
    switch (s.type) {
      case "blast": {
        const range = s.range ?? 500, dist = aim ? Math.min(range, Math.hypot(aim.x - p.x, aim.y - p.y)) : range * 0.6;
        return shapeTargets({ x: p.x + dir.x * dist, y: p.y + dir.y * dist }, dir, { hit: "circle", reach: s.radius ?? 150 }, this.monsters);
      }
      case "nova":
      case "storm":
        return shapeTargets(me, dir, { hit: "circle", reach: s.radius ?? 200 }, this.monsters);
      case "beam":
        return shapeTargets(me, dir, { hit: "line", reach: s.length ?? 500, width: s.width }, this.monsters);
      case "fan":
      case "bolt":
        return shapeTargets(me, dir, { hit: "arc", reach: s.range ?? 500, arc: s.spread ?? 40 }, this.monsters);
      case "cone":
        return shapeTargets(me, dir, { hit: "arc", reach: s.reach ?? 150, arc: s.arc }, this.monsters);
      default:
        return [];
    }
  }

  // The monsters a cast is aimed at feel it and come for the caster (with their pack).
  notice(s: SkillDef, dir: Vec2, aim: Vec2 | null, lock: Monster | null): void {
    const p = this.player;
    for (const m of lock ? [lock] : this.noticed(s, dir, aim)) {
      if (!m.alive) continue;
      const fresh = m.angry <= 0;
      m.provoke(toward(p, m) ?? dir);
      if (fresh) this.floaters.add(m.x, m.y, m.height + 10, "!", "hurt");
    }
  }

  // Let a cast go (walked off, fell, changed map): nothing is spent.
  interrupt(why: string | null = "ยกเลิกการร่าย"): void {
    if (!this.pending) return;
    this.pending = null;
    const c = this.player.cast;
    if (c && c.t < c.duration) this.player.cast = null;
    if (why) this.floaters.add(this.player.x, this.player.y, 150, why, "info");
  }

  // A cast whose bar has filled: it goes off at its mark (where that has moved to), if the MP
  // is still there; a single-target spell whose target is gone comes to nothing.
  release(c: Casting): void {
    this.pending = null;
    const p = this.player, m = c.mark?.alive && this.monsters.includes(c.mark) ? c.mark : null;
    if (c.locked && !m) return void this.floaters.add(p.x, p.y, 150, "เป้าหมายหายไป", "info");
    if (!this.hero.spend(c.s.mp)) return void this.floaters.add(p.x, p.y, 150, "MP ไม่พอ", "info");
    let { dir, aim } = c;
    if (m) {
      dir = toward(p, m) ?? dir;
      if (c.s.type === "blast") aim = { x: m.x, y: m.y };
    }
    this.goOff(c.id, c.s, c.rank, dir, aim, c.locked ? m : null, true);
  }

  weaponStats(): AttackWeapon {
    return WEAPON_TYPES[this.weapon() as WeaponId] ?? { motion: "thrust" };
  }

  later(t: number, fn: () => void): void {
    this.timers.push({ t, fn });
  }

  update(dt: number): void {
    const c = this.pending;
    if (c) {
      if (!this.hero.alive) this.interrupt(null);
      else if (!this.player.cast) this.interrupt();
      else if ((c.left -= dt) <= 0) this.release(c);
    }
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i];
      tm.t -= dt;
      if (tm.t <= 0) {
        this.timers.splice(i, 1);
        tm.fn();
      }
    }
  }

  // Element effects that follow any skill.
  afterCast(): void {
    const earth = this.el.earth ?? 0, wind = this.el.wind ?? 0, water = this.el.water ?? 0;
    if (earth) {
      this.hero.addShield(this.hero.stats.maxHp * 0.004 * earth * (earth >= 35 ? 2 : 1), 4);
      this.ring(this.player.x, this.player.y, "#d6a35c", 90, 0.5);
    }
    if (wind >= 10) this.hero.addBuff("wind_rush", "สายลม", { move: 0.25 }, 2);
    if (water >= 35) this.hero.heal(this.hero.stats.maxHp * 0.03);
    const plant = this.el.plant ?? 0;
    if (plant) {
      this.hero.heal(this.hero.stats.maxHp * 0.001 * plant * (plant >= 35 ? 2 : 1));
      if (plant >= 10) this.hero.cleanse();
    }
  }

  // Damage a monster with a skill, then the element riders.
  hit(m: Monster, s: SkillDef, rank: number, dir: Vec2, knock = 0, chained = false): void {
    if (!m.alive) return;
    const r = skillDamage(this.hero.stats, this.el, s, rank, m, WEAPON_TYPES[this.weapon() as WeaponId]);
    // a physical skill that misses does nothing but anger it: no status, no riders
    if (r.miss) return void this.combat.apply(m, r, dir);
    if (chained) r.dmg = Math.max(1, Math.round(r.dmg * ((this.el.lightning ?? 0) >= 50 ? 0.6 : 0.3)));
    const earth = (this.el.earth ?? 0) >= 10 ? 1.3 : 1;
    if (s.stun) m.stun = Math.max(m.stun, s.stun(rank) * earth);
    if (s.freeze) m.freeze = Math.max(m.freeze, s.freeze(rank) * earth);
    if (s.slow) m.slowFor(s.slow(rank) * earth, 0.5);
    if (s.blind) m.blind = Math.max(m.blind, s.blind(rank) * earth);
    if (s.weaken) m.weaken((s.debuff ?? 6) * earth, s.weaken(rank));
    if (s.expose) m.exposeTo((s.debuff ?? 6) * earth, s.expose(rank));
    if (s.poison) m.burns.push({ dps: (r.dmg * s.poison(rank)) / 4, t: 4, poison: true });
    this.combat.apply(m, r, dir, knock);
    if (s.element) this.elementHit(m, s.element, r.dmg, earth);
    const fire = this.el.fire ?? 0, water = this.el.water ?? 0, lightning = this.el.lightning ?? 0;
    if (fire >= 10) m.burns.push({ dps: (r.dmg * (fire >= 35 ? 0.4 : 0.2)) / 3, t: 3 });
    if (water >= 10) this.hero.heal(r.dmg * (water >= 50 ? 0.1 : 0.05));
    if (!chained && lightning >= 10) {
      const next = this.monsters.filter((o) => o !== m && o.alive && Math.hypot(o.x - m.x, o.y - m.y) < 260)
        .sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))
        .slice(0, lightning >= 35 ? 2 : 1);
      for (const o of next) {
        this.zap(m, o);
        this.hit(o, s, rank, dir, 0, true);
      }
    }
  }

  // What a hit of an element does besides its damage, by that element's level (progression.ts
  // ELEMENTS, the line and its milestones). earth: how much longer holds last.
  elementHit(m: Monster, el: ElementId, dmg: number, earth: number): void {
    const lv = this.el[el] ?? 0;
    if (!lv || !m.alive) return;
    switch (el) {
      case "ice":
        m.chillFor(lv >= 10 ? 5 : 3, Math.min(0.8, (0.1 + 0.006 * lv) * (lv >= 50 ? 2 : 1)));
        if (lv >= 35 && Math.random() < 0.1) m.freeze = Math.max(m.freeze, 1.5 * earth);
        break;
      case "dark": {
        if (Math.random() >= 0.1 + 0.006 * lv) break;
        const t = lv >= 10 ? 6 : 4;
        const ails = [() => (m.blind = Math.max(m.blind, t)), () => m.weaken(t, 0.2), () => m.burns.push({ dps: (dmg * 0.3) / t, t, poison: true })];
        for (const i of [...ails.keys()].sort(() => Math.random() - 0.5).slice(0, lv >= 35 ? 2 : 1)) ails[i]();
        break;
      }
      case "stone":
        if (Math.random() < (0.04 + 0.003 * lv) * (lv >= 35 ? 1.5 : 1)) m.petrify = Math.max(m.petrify, (lv >= 10 ? 3 : 2) * earth);
        break;
      case "mud":
        m.slowFor((lv >= 10 ? 5 : 3) * earth, Math.min(0.8, (0.2 + 0.008 * lv) * (lv >= 50 ? 1.5 : 1)));
        if (lv >= 35) m.stun = Math.max(m.stun, 0.5);
        break;
      case "lava": {
        const t = lv >= 20 ? 5 : 3;
        m.burns.push({ dps: (dmg * (0.15 + 0.007 * lv) * (lv >= 50 ? 2 : 1)) / t, t });
        break;
      }
    }
  }

  healAmount(raw: number): number {
    return raw * (1 + 0.02 * (this.el.water ?? 0)) * (1 + this.hero.stats.healPct);
  }

  effect(id: string, s: SkillDef, rank: number, dir: Vec2, aim: Vec2 | null, lock: Monster | null = null): void {
    const p = this.player, origin = { x: p.x, y: p.y };
    const hitAll = (list: Monster[], knock?: number) => list.forEach((m) => this.hit(m, s, rank, dir, knock));
    switch (s.type) {
      case "bolt":
        // `hits` shots one after another (a volley of arrows)
        for (let i = 0; i < (s.hits ?? 1); i++) {
          this.later(LEAD + i * (s.every ?? 0.12), () => this.combat.shoot({ x: p.x, y: p.y }, dir, {
            kind: s.arrow ? "arrow" : s.pierce ? "wave" : "skill", speed: s.speed ?? 900, range: s.range ?? 500, radius: s.radius ?? 30, pierce: s.pierce,
            target: lock, onHit: (m, d) => this.hit(m, s, rank, d, s.knock),
          }));
        }
        break;
      case "fan":
        this.later(LEAD, () => {
          const base = Math.atan2(dir.y, dir.x), spread = ((s.spread ?? 40) * Math.PI) / 180, count = s.count ?? 3;
          for (let i = 0; i < count; i++) {
            const a = base + (i / (count - 1) - 0.5) * spread;
            this.combat.shoot({ x: p.x, y: p.y }, { x: Math.cos(a), y: Math.sin(a) }, {
              kind: s.arrow ? "arrow" : "bolt", speed: s.speed ?? 900, range: s.range ?? 500, radius: s.radius ?? 28,
              onHit: (m, d) => this.hit(m, s, rank, d),
            });
          }
        });
        break;
      case "blast": {
        const range = s.range ?? 500, radius = s.radius ?? 150, delay = s.delay ?? 0.3;
        const dist = aim ? Math.min(range, Math.hypot(aim.x - p.x, aim.y - p.y)) : range * 0.6;
        const spot = { x: p.x + dir.x * dist, y: p.y + dir.y * dist };
        const strikes = s.hits ?? 1;
        this.ring(spot.x, spot.y, s.color, radius * 2, delay + LEAD + (strikes - 1) * (s.every ?? 0.3), true);
        for (let i = 0; i < strikes; i++) {
          this.later(delay + LEAD + i * (s.every ?? 0.3), () => {
            hitAll(shapeTargets(spot, dir, { hit: "circle", reach: radius }, this.monsters), s.knock);
            this.burst(spot.x, spot.y, s.color, radius);
          });
        }
        break;
      }
      case "nova": {
        const radius = s.radius ?? 200;
        this.later(LEAD * 0.8, () => {
          for (const m of shapeTargets({ x: p.x, y: p.y }, dir, { hit: "circle", reach: radius }, this.monsters)) {
            const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy) || 1;
            this.hit(m, s, rank, { x: dx / d, y: dy / d }, s.knock);
          }
          this.ring(p.x, p.y, s.color, radius * 2, 0.45);
          this.burst(p.x, p.y, s.color, radius * 0.7);
        });
        break;
      }
      case "storm": {
        const radius = s.radius ?? 200, pulses = s.pulses ?? 3;
        for (let i = 0; i < pulses; i++) {
          this.later(LEAD * 0.5 + i * (s.every ?? 0.2), () => {
            for (const m of shapeTargets({ x: p.x, y: p.y }, dir, { hit: "circle", reach: radius }, this.monsters)) {
              const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy) || 1;
              this.hit(m, s, rank, { x: dx / d, y: dy / d });
            }
            this.ring(p.x, p.y, s.color, radius * 2, 0.25);
            if (i < pulses - 1) p.startMotion(i % 2 ? "swing" : "thrust", dir, this.weaponStats(), 0.2);
          });
        }
        break;
      }
      case "cone":
        for (let i = 0; i < (s.hits ?? 1); i++) {
          this.later(LEAD + i * 0.16, () => {
            // a narrow blow lands on its locked target only (if it is still in reach)
            if (lock) {
              if (lock.alive && Math.hypot(lock.x - p.x, lock.y - p.y) - lock.radius <= (s.reach ?? 150) + 40) hitAll([lock], s.knock);
            } else hitAll(shapeTargets(origin, dir, { hit: "arc", reach: s.reach ?? 150, arc: s.arc }, this.monsters), s.knock);
            this.fan(origin, dir, s.reach ?? 150, s.arc ?? 90, s.color);
            if (i > 0) p.startMotion(s.motion, dir, this.weaponStats(), 0.25);
          });
        }
        break;
      case "beam":
        this.later(LEAD, () => {
          hitAll(shapeTargets({ x: p.x, y: p.y }, dir, { hit: "line", reach: s.length ?? 500, width: s.width }, this.monsters), 20);
          this.line({ x: p.x, y: p.y }, dir, s.length ?? 500, s.color);
        });
        break;
      case "dash": {
        const hit = new Set<Monster>();
        p.startDash(dir, s.distance ?? 200, 0.2, () => {
          // a dash without a multiplier is a teleport: it hits nothing
          if (s.mult) for (const m of shapeTargets({ x: p.x, y: p.y }, dir, { hit: "circle", reach: s.width ?? 60 }, this.monsters)) {
            if (hit.has(m)) continue;
            hit.add(m);
            this.hit(m, s, rank, dir, 30);
          }
          this.fx.add({ x: p.x, y: p.y, z: 50, layer: AIR_GLOW, tex: this.tex.sparkle, life: 0.35,
            size: [[0, 40], [1, 8]], alpha: [[0, 0.8], [1, 0]] });
        });
        break;
      }
      case "heal":
        this.later(LEAD, () => {
          const got = this.hero.heal(this.healAmount(this.hero.stats.maxHp * at(s.heal, rank) + this.hero.stats[s.stat ?? "matk"] * at(s.mult, rank)));
          this.floaters.add(p.x, p.y, 130, `+${Math.round(got)}`, "heal");
          this.sparkleUp(p.x, p.y, this.tex.mint, 26);
        });
        break;
      case "shield":
        this.later(LEAD, () => {
          const amount = this.hero.stats.maxMp * at(s.base, rank) + this.hero.stats.matk * at(s.mult, rank);
          this.hero.addShield(amount, s.duration ?? 8);
          this.floaters.add(p.x, p.y, 130, `โล่ ${Math.round(amount)}`, "shield");
          this.ring(p.x, p.y, s.color, 140, 0.6);
        });
        break;
      case "buff":
        this.later(LEAD, () => {
          this.hero.addBuff(id, ACTIVES[id].name, s.buff?.(rank) ?? {}, (s.duration ?? 8) * (1 + this.hero.stats.buffTime));
          if (s.heal) {
            const got = this.hero.heal(this.healAmount(this.hero.stats.maxHp * at(s.heal, rank)));
            if (got >= 1) this.floaters.add(p.x, p.y, 130, `+${Math.round(got)}`, "heal");
          }
          this.floaters.add(p.x, p.y, 150, ACTIVES[id].name, "level");
          this.ring(p.x, p.y, s.color, 180, 0.5);
          this.sparkleUp(p.x, p.y, this.tex.flash, 16);
        });
        break;
      case "flower": {
        const spot = { x: p.x, y: p.y };
        this.spells.push(new FlowerSpell(this.fx, this.tex, spot.x, spot.y, p));
        this.later(CAST_TIME, () => {
          const got = this.hero.heal(this.healAmount(this.hero.stats.maxHp * at(s.heal, rank)));
          if (got >= 1) this.floaters.add(p.x, p.y, 130, `+${Math.round(got)}`, "heal");
        });
        const radius = s.radius ?? 450;
        for (let i = 0; i < (s.ticks ?? 4); i++) {
          this.later(CAST_TIME + 0.4 + i * 1, () => {
            for (const m of shapeTargets(spot, dir, { hit: "circle", reach: radius }, this.monsters)) {
              const dx = m.x - spot.x, dy = m.y - spot.y, d = Math.hypot(dx, dy) || 1;
              this.hit(m, s, rank, { x: dx / d, y: dy / d }, 5);
            }
          });
        }
        break;
      }
    }
  }

  // ---- effects ----
  ring(x: number, y: number, color: string, size: number, life: number, ground = false): void {
    this.fx.add({ x, y, z: 2, layer: GROUND_GLOW, tex: this.tex.ringFor(color), flat: true, life,
      size: ground ? [[0, size * 0.9], [1, size]] : [[0, size * 0.3], [1, size]], alpha: [[0, 0.9], [0.7, 0.6], [1, 0]] });
  }

  burst(x: number, y: number, color: string, radius: number): void {
    const tex = this.tex.glowFor(color);
    for (let i = 0; i < 18; i++) {
      const a = rand(0, Math.PI * 2), r = rand(0, radius);
      this.fx.add({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, z: rand(10, 60), layer: AIR_GLOW, tex, life: rand(0.35, 0.6),
        size: [[0, rand(30, 60)], [1, 6]], alpha: [[0, 0.9], [1, 0]], vz: rand(60, 180) });
    }
    this.fx.add({ x, y, z: 30, layer: AIR_GLOW, tex: this.tex.flash, life: 0.3, size: [[0, radius], [1, radius * 1.8]], alpha: [[0, 0.8], [1, 0]] });
  }

  fan(origin: Vec2, dir: Vec2, reach: number, arc: number, color: string): void {
    const tex = this.tex.glowFor(color), n = 10;
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(dir.y, dir.x) + (i / (n - 1) - 0.5) * ((arc * Math.PI) / 180);
      this.fx.add({ x: origin.x + Math.cos(a) * reach * 0.8, y: origin.y + Math.sin(a) * reach * 0.8, z: 50, layer: AIR_GLOW, tex,
        life: 0.3 + i * 0.01, size: [[0, 34], [1, 6]], alpha: [[0, 0.9], [1, 0]] });
    }
  }

  line(origin: Vec2, dir: Vec2, length: number, color: string): void {
    const tex = this.tex.glowFor(color);
    for (let d = 40; d < length; d += 22) {
      this.fx.add({ x: origin.x + dir.x * d, y: origin.y + dir.y * d, z: 55, layer: AIR_GLOW, tex, life: 0.45,
        size: [[0, 46], [1, 10]], alpha: [[0, 0.95], [1, 0]] });
    }
  }

  zap(a: Vec2, b: Vec2): void {
    for (let i = 0; i <= 8; i++) {
      const f = i / 8;
      this.fx.add({ x: a.x + (b.x - a.x) * f + rand(-10, 10), y: a.y + (b.y - a.y) * f + rand(-10, 10), z: 50, layer: AIR_GLOW,
        tex: this.tex.glowFor("#fff27a"), life: 0.25, size: [[0, 26], [1, 6]], alpha: [[0, 1], [1, 0]] });
    }
  }

  sparkleUp(x: number, y: number, tex: Img, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), r = rand(10, 60);
      this.fx.add({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, z: rand(0, 40), layer: AIR_GLOW, tex, life: rand(0.6, 1),
        size: [[0, 18], [1, 4]], alpha: [[0, 0.9], [1, 0]], vz: rand(80, 160) });
    }
  }
}

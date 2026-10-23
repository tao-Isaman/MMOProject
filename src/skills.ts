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
//   poison poisons for 30% + 1%/level of the hit over 4 s [10: 6 s; 35: twice; 50: all poison
//          twice as strong, stats.ts poisonScale]
//
// Second-job riders on a skill's hit (progression.ts SkillDef): `vs` more on some kinds of
// monster, `masteryScale` more per level of the held weapon's mastery, `detonate` sets off the
// poison already on the target, `drain` heals from the damage; a physical skill without an
// element of its own hits in the element an enchant buff gave the weapon. trap: laid on the ground,
// set off by the first monster in it (Trap below). falcon: the falcon dives at the target (and
// after a normal hit now and then, falconChance: falconStrike).
//
// Skill types: bolt, fan (projectiles) · blast (at the aimed point, `hits` times) · nova, storm
// (around the caster) · cone (in front) · beam (a line) · dash (no `mult`: a teleport) · heal ·
// shield · buff · flower. bolt, cone, blast, nova, beam and dash land `hits` times.
//
// The third jobs' (progression.ts SkillDef, where every field is told):
//   summon  an ally (src/allies.ts) on the aimed spot or in front; decoy is one too
//   mimic   copies the locked monster's attack; the same slot then fires the copy (Copy below)
//   smoke   a cloud the player hides in while she stays inside (clouds below)
//   make    turns materials from the bag into an item (main.ts does the bag)
//   autocast_<id>  a stat: a normal hit may cast that skill for free (autocast)
//   combo   more damage right after another skill (the chain: casts below)
//   manaBurn  more on casters, and the monster's casting and shooting stop (`silence`)
//   terrain on a buff: stats by the kind of map (hero.ts)
//   coin    a coin flipped on every hit, as `dice` rolls a die: heads more, tails as much less
//
// A spell with a cast time (SkillDef.cast, shortened by the castRed stat) is read out first: the
// caster stands still under a cast bar, and it goes off when the bar fills, only then costing its
// MP and starting its cooldown. Walking off (or falling) lets it go for nothing. The monsters it
// is aimed at feel it coming and turn on the caster, so the heavy spells cost a risk as well; a
// spell aimed at a monster (or at a spot with monsters in it) follows that one when it moves.

import { ACTIVES, AUTOCAST, MASTERIES, mpCost, needMet, needText } from "./progression";
import type { ElementId, Progress, SkillDef } from "./progression";
import type { Allies } from "./allies";
import { mitigate, poisonScale, skillDamage, lucky, rollDie, flipCoin } from "./stats";
import { shapeTargets } from "./combat";
import type { Combat, Floaters } from "./combat";
import { AIR_GLOW, GROUND_GLOW, SORTED, rand } from "./particles";
import type { Particles } from "./particles";
import { FlowerSpell, CAST_TIME, HOVER_END } from "./spell";
import type { Spell } from "./spell";
import { CastCircle } from "./castfx";
import type { CastTarget } from "./castfx";
import { lookFor } from "./circles";
import { WEAPON_TYPES, offhandKind } from "./items";
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
  spells: Spell[];
  weapon: () => string | null;
  steal?: (m: Monster, what: "gold" | "item") => void; // a stealing hit took something
  allies?: Allies; // summons and the decoy
  workshop?: (bench: { tab: "craft" | "refine"; craft: string }) => void; // a craft's skill opens it
  // a make skill: why the bag can't (dry), or takes the materials and gives the item (its words)
  make?: (make: NonNullable<SkillDef["make"]>, rank: number, dry: boolean) => string | null;
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
  circle: CastCircle;
}

// One target, locked on (a shot that homes in, a blow at the one in front); the other damage
// skills reach an area (aimed at a spot on the ground, along a line or round the player).
export function singleTarget(s: SkillDef): boolean {
  return (s.type === "bolt" && !s.pierce) || (s.type === "cone" && (s.arc ?? 90) <= 50) || s.type === "falcon" || s.type === "mimic";
}
// Skills placed on a spot of the ground (aimed with a disc before they go, src/main.ts); the
// rest of the area skills go round the player or along the line it faces. A summon or a smoke
// with a range is placed too.
export function groundTarget(s: SkillDef): boolean {
  return s.type === "blast" || s.type === "trap" || ((s.type === "summon" || s.type === "smoke") && !!s.range);
}

// A monster's attack copied by a mimic: its shot (and element) or its bite, for `uses` uses
// until `until` (game clock), fired by the mimic's own slot.
interface Copy {
  id: string;      // the mimic skill
  rank: number;
  from: string;    // the monster's name
  shot: string | null;
  element?: ElementId;
  magic: boolean;
  uses: number;
  until: number;
}

// A smoke cloud on the ground.
interface Cloud {
  id: string;
  s: SkillDef;
  rank: number;
  x: number;
  y: number;
  r: number;
  t: number;
  puff: number;
}

const AUTOCAST_GAP = 0.6; // s between two autocasts, whatever their chances
const SHOT_TINT: Record<string, string> = {
  water: "#5ab4ff", snow: "#f2f8ff", frost: "#9fe0ff", fire: "#ff8a2a", rock: "#a08c6c", arrow: "#e8d8b0", musket: "#ffe9a0",
  cannon: "#7a7068", shuriken: "#d8dce4", foxfire: "#7ad8ff", curse: "#b070ff", tongue: "#ff7aa0", vine: "#6fcf5a", spark: "#fff27a", venom: "#8fdc4a", web: "#f4f4ee",
};

// A trap waiting on the ground: the skill it goes off with, armed after half a second.
interface Trap {
  x: number;
  y: number;
  s: SkillDef;
  rank: number;
  left: number;
  armed: number;
  pulse: number;
}
const MAX_TRAPS = 3;

// The falcon as it dives: a dark bird with its wings spread, drawn once.
let falconTex: HTMLCanvasElement | null = null;
function falconArt(): HTMLCanvasElement {
  if (falconTex) return falconTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  g.translate(32, 34);
  g.fillStyle = "#3b2a1c";
  g.strokeStyle = "#f2d9a0";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, -6);
  g.quadraticCurveTo(-14, -18, -30, -10);
  g.quadraticCurveTo(-16, -6, -8, 4);
  g.lineTo(-4, 16);
  g.lineTo(0, 12);
  g.lineTo(4, 16);
  g.lineTo(8, 4);
  g.quadraticCurveTo(16, -6, 30, -10);
  g.quadraticCurveTo(14, -18, 0, -6);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = "#f2c94c";
  g.fillRect(-1.5, -10, 3, 4);
  return (falconTex = c);
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
  spells: Spell[];
  weapon: () => string | null;
  steal?: (m: Monster, what: "gold" | "item") => void;
  allies?: Allies;
  workshop?: (bench: { tab: "craft" | "refine"; craft: string }) => void;
  make?: SkillDeps["make"];
  timers: { t: number; fn: () => void }[] = [];
  pending: Casting | null = null;
  traps: Trap[] = [];
  clock = 0;                                  // s of play (combos, copies)
  casts: { id: string; t: number }[] = [];    // the latest casts, for combos
  copy: Copy | null = null;                   // a mimic's copy
  clouds: Cloud[] = [];
  smokeHid = false;                           // the smoke has her hidden
  rehide = 0;                                 // s until the smoke hides her again after a blow
  autoCd = 0;                                 // s until the next autocast

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
    this.steal = deps.steal;
    this.allies = deps.allies;
    this.workshop = deps.workshop;
    this.make = deps.make;
  }

  get el(): Record<string, number> {
    return this.progress.elements;
  }

  // The weapon type in the off hand (null: empty, or not a weapon).
  offWeapon(): string | null {
    return offhandKind(this.hero.offhand());
  }

  // Whether the hands hold what a skill needs.
  wields(id: string): boolean {
    return needMet(ACTIVES[id]?.need, this.weapon(), this.offWeapon());
  }

  // Why a skill can't go off now, or null.
  why(id: string): string | null {
    const a = ACTIVES[id];
    if (!a) return "ช่องว่าง";
    if (!this.progress.skillRank(id)) return "ยังไม่ได้เรียนสกิลนี้";
    if (!this.hero.alive) return "ล้มอยู่";
    if (!this.wields(id)) return `ต้องถือ${needText(a.need, (w) => WEAPON_TYPES[w].name)}`;
    if (this.pending || this.player.casting || this.player.dashing) return "กำลังใช้สกิลอื่น";
    if (this.hero.cooldowns.has(id)) return "ยังติดคูลดาวน์";
    if (this.copy?.id === id) return null; // the copy costs no MP
    if (this.hero.mp < mpCost(id, this.progress.skillRank(id))) return "MP ไม่พอ";
    if (a.skill.type === "make" && a.skill.make && this.make) return this.make(a.skill.make, this.progress.skillRank(id), true);
    return null;
  }

  // The monster a single-target skill locks on to: the player's target, else the one nearest
  // the aimed spot, else the nearest in front, within its reach.
  lockFor(s: SkillDef, aim: Vec2 | null, dir: Vec2): Monster | null {
    const p = this.player, reach = s.type === "bolt" ? s.range ?? 500 : s.type === "falcon" || s.type === "mimic" ? s.range ?? 600 : (s.reach ?? 150) + 40;
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
    if (this.copy?.id === id) return this.fireCopy(aim);
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
      // the circle under the caster (as wide as a spell round the caster reaches), and a sigil
      // under what it is aimed at
      const look = lookFor(id, s.color);
      const size = s.type === "nova" || s.type === "storm" ? Math.max(look.size, (s.radius ?? 200) * 2) : look.size;
      const circle = new CastCircle(this.fx, this.tex, look, p, time, size, this.sigilFor(s, dir, aim, mark, lock));
      this.spells.push(circle);
      this.pending = { id, s, rank, dir, aim, mark, locked: !!lock, left: time, circle };
      p.startCast(time, time + RELEASE, dir);
      p.target = lock;
      this.notice(s, dir, aim, lock);
      return null;
    }
    if (!this.hero.spend(mpCost(id, rank))) return "MP ไม่พอ";
    this.goOff(id, s, rank, dir, aim, lock);
    return null;
  }

  // A skill going off (at once, or when its cast bar fills: `cast`): its cooldown, the animation
  // of an instant one, its effect.
  goOff(id: string, s: SkillDef, rank: number, dir: Vec2, aim: Vec2 | null, lock: Monster | null, cast = false): void {
    // (a mimic waits its short gap while it holds the copy; its cooldown starts when that runs out)
    const cd = (s.type === "mimic" ? s.every ?? 0.8 : s.cd) * (1 - this.hero.stats.cdr);
    this.hero.cooldowns.set(id, cd);
    this.hero.cdTotal.set(id, cd);
    // a combo: right after one of the skills it follows, it hits harder
    const more = this.comboMore(s, rank);
    if (more) {
      const base = s.mult;
      s = { ...s, mult: base && ((r: number) => base(r) * (1 + more)) };
      this.floaters.add(this.player.x, this.player.y, 190, `คอมโบ! +${Math.round(more * 100)}%`, "level");
    }
    this.casts.push({ id, t: this.clock });
    if (this.casts.length > 8) this.casts.shift();
    if ((this.el.wind ?? 0) >= 35 && lucky(0.15, this.hero.stats)) {
      this.hero.cooldowns.delete(id);
      this.floaters.add(this.player.x, this.player.y, 170, "พายุหมุน!", "info");
    }
    const p = this.player;
    // a locked skill keeps its target for the attacks after it
    p.target = lock;
    if (s.type === "flower") p.startCast(s.cast ?? CAST_TIME, HOVER_END);
    else if (!cast) p.startMotion(s.motion, dir, this.weaponStats());
    this.effect(id, s, rank, dir, aim, lock);
    if (s.type !== "workshop") this.afterCast();
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

  // Where a cast's sigil lies: under a single-target spell's target, or on the spot a ground
  // spell will land (following its mark, as release() does); none for the rest.
  sigilFor(s: SkillDef, dir: Vec2, aim: Vec2 | null, mark: Monster | null, lock: Monster | null): CastTarget | null {
    const p = this.player;
    if (lock) return { at: () => (lock.alive ? lock : null), size: lock.radius * 2.4 + 50 };
    if (s.type !== "blast" && s.type !== "trap") return null;
    const range = s.range ?? 500;
    const reach = (to: Vec2): Vec2 => {
      const d = Math.min(range, Math.hypot(to.x - p.x, to.y - p.y)), u = toward(p, to) ?? dir;
      return { x: p.x + u.x * d, y: p.y + u.y * d };
    };
    const fixed = reach(aim ?? { x: p.x + dir.x * range * 0.6, y: p.y + dir.y * range * 0.6 });
    return { at: () => (mark?.alive ? reach(mark) : fixed), size: (s.radius ?? 150) * 2 };
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
    this.pending.circle.cancel();
    this.pending = null;
    const c = this.player.cast;
    if (c && c.t < c.duration) this.player.cast = null;
    if (why) this.floaters.add(this.player.x, this.player.y, 150, why, "info");
  }

  // A cast whose bar has filled: it goes off at its mark (where that has moved to), if the MP
  // is still there; a single-target spell whose target is gone comes to nothing.
  release(c: Casting): void {
    this.pending = null;
    c.circle.release();
    const p = this.player, m = c.mark?.alive && this.monsters.includes(c.mark) ? c.mark : null;
    if (c.locked && !m) return void this.floaters.add(p.x, p.y, 150, "เป้าหมายหายไป", "info");
    if (!this.hero.spend(mpCost(c.id, c.rank))) return void this.floaters.add(p.x, p.y, 150, "MP ไม่พอ", "info");
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
    this.clock += dt;
    this.autoCd = Math.max(0, this.autoCd - dt);
    if (this.copy && (this.clock > this.copy.until || !this.hero.alive)) this.endCopy();
    this.updateClouds(dt);
    const c = this.pending;
    if (c) {
      if (!this.hero.alive) this.interrupt(null);
      else if (!this.player.cast) this.interrupt();
      else if ((c.left -= dt) <= 0) this.release(c);
    }
    this.updateTraps(dt);
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
      this.hero.addShield(this.hero.stats.maxHp * Math.min(0.6, 0.004 * earth * (earth >= 35 ? 2 : 1)), 4);
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
  hit(m: Monster, skill: SkillDef, rank: number, dir: Vec2, knock = 0, chained = false): void {
    if (!m.alive) return;
    // an enchanted weapon lends its element to a physical skill that has none
    const ench = this.hero.enchant;
    const s = ench && !skill.element && (skill.stat ?? "atk") === "atk" ? { ...skill, element: ench } : skill;
    const r = skillDamage(this.hero.stats, this.el, s, rank, m, WEAPON_TYPES[this.weapon() as WeaponId]);
    // a physical skill that misses does nothing but anger it: no status, no riders
    if (r.miss) return void this.combat.apply(m, r, dir);
    if (chained) r.dmg = Math.max(1, Math.round(r.dmg * ((this.el.lightning ?? 0) >= 50 ? 0.6 : 0.3)));
    let more = 1 + (s.vs?.[m.race] ?? 0);
    if (s.masteryScale) more *= 1 + s.masteryScale * this.masteryLevel();
    if (s.detonate) {
      // the poison it carries goes off at once
      const left = m.burns.filter((b) => b.poison).reduce((a, b) => a + b.dps * b.t, 0);
      if (left > 0) {
        m.burns = m.burns.filter((b) => !b.poison);
        r.dmg += left * s.detonate(rank);
        this.burst(m.x, m.y, "#8fdc4a", 70);
      }
    }
    // a die on every hit: die / 3.5 of the damage
    if (s.dice) {
      const die = rollDie(this.hero.stats);
      more *= die / 3.5;
      this.floaters.add(m.x, m.y, m.height + 50, `เต๋า ${die}`, die >= 5 ? "level" : "info");
    }
    // a coin on every hit: heads, `coin` more; tails, as much less
    if (s.coin) {
      const heads = flipCoin(this.hero.stats);
      more *= heads ? 1 + s.coin(rank) : 1 - s.coin(rank);
      this.floaters.add(m.x, m.y, m.height + (s.dice ? 75 : 50), heads ? "หัว!" : "ก้อย", heads ? "level" : "info");
    }
    // a mana burn: harder on a caster, and whatever casts or shoots stops for a moment
    if (s.manaBurn) {
      if (m.magical) more *= 1 + s.manaBurn(rank);
      if (m.magical || m.ranged) {
        if (m.silence <= 0) this.floaters.add(m.x, m.y, m.height + 50, "เผามานา!", "magic");
        m.silence = Math.max(m.silence, s.silence ?? 3);
      }
    }
    r.dmg = Math.max(1, Math.round(r.dmg * more));
    const earth = (this.el.earth ?? 0) >= 10 ? 1.3 : 1;
    if (s.stun) m.stun = Math.max(m.stun, s.stun(rank) * earth);
    if (s.freeze) m.freeze = Math.max(m.freeze, s.freeze(rank) * earth);
    if (s.slow) m.slowFor(s.slow(rank) * earth, 0.5);
    if (s.blind) m.blind = Math.max(m.blind, s.blind(rank) * earth);
    if (s.weaken) m.weaken((s.debuff ?? 6) * earth, s.weaken(rank));
    if (s.expose) m.exposeTo((s.debuff ?? 6) * earth, s.expose(rank));
    if (s.poison) m.burns.push({ dps: (r.dmg * s.poison(rank) * poisonScale(this.hero.stats, this.el)) / 4, t: 4, poison: true });
    this.combat.apply(m, r, dir, knock);
    // a stealing blow: once a monster, gold or one of its drops
    if (s.steal && !m.stolen && lucky(at(s.stealChance, rank) ?? 0, this.hero.stats)) {
      m.stolen = true;
      this.steal?.(m, s.steal);
    }
    if (s.drain && this.hero.alive) {
      const got = this.hero.heal(r.dmg * s.drain(rank));
      if (got >= 1) this.floaters.add(this.player.x, this.player.y, 130, `+${Math.round(got)}`, "heal");
    }
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
        if (lv >= 35 && lucky(0.1, this.hero.stats)) m.freeze = Math.max(m.freeze, 1.5 * earth);
        break;
      case "dark": {
        if (!lucky(Math.min(0.6, 0.1 + 0.006 * lv), this.hero.stats)) break;
        const t = lv >= 10 ? 6 : 4;
        const ails = [() => (m.blind = Math.max(m.blind, t)), () => m.weaken(t, 0.2), () => m.burns.push({ dps: (dmg * 0.3 * poisonScale(this.hero.stats, this.el)) / t, t, poison: true })];
        for (const i of [...ails.keys()].sort(() => Math.random() - 0.5).slice(0, lv >= 35 ? 2 : 1)) ails[i]();
        break;
      }
      case "stone":
        if (lucky(Math.min(0.4, (0.04 + 0.003 * lv) * (lv >= 35 ? 1.5 : 1)), this.hero.stats)) m.petrify = Math.max(m.petrify, (lv >= 10 ? 3 : 2) * earth);
        break;
      case "mud":
        m.slowFor((lv >= 10 ? 5 : 3) * earth, Math.min(0.8, (0.2 + 0.008 * lv) * (lv >= 50 ? 1.5 : 1)));
        if (lv >= 35) m.stun = Math.max(m.stun, 0.5);
        break;
      case "poison": {
        const t = lv >= 10 ? 6 : 4, dps = (dmg * (0.3 + 0.01 * lv) * poisonScale(this.hero.stats, this.el)) / t;
        for (let i = 0; i < (lv >= 35 ? 2 : 1); i++) m.burns.push({ dps, t, poison: true });
        break;
      }
      case "lava": {
        const t = lv >= 20 ? 5 : 3;
        m.burns.push({ dps: (dmg * (0.15 + 0.007 * lv) * (lv >= 50 ? 2 : 1)) / t, t });
        break;
      }
    }
  }

  // The attack stat a skill's numbers are on (both: 0.6 of attack and magic attack each).
  power(s: SkillDef): number {
    const st = this.hero.stats;
    return s.stat === "both" ? 0.6 * (st.atk + st.matk) : st[s.stat ?? "matk"];
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
        for (let i = 0; i < (s.hits ?? 1); i++) {
          this.later(LEAD * 0.8 + i * 0.2, () => {
            for (const m of shapeTargets({ x: p.x, y: p.y }, dir, { hit: "circle", reach: radius }, this.monsters)) {
              const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy) || 1;
              this.hit(m, s, rank, { x: dx / d, y: dy / d }, s.knock);
            }
            this.ring(p.x, p.y, s.color, radius * 2, 0.45);
            this.burst(p.x, p.y, s.color, radius * 0.7);
            if (i > 0) p.startMotion(s.motion, dir, this.weaponStats(), 0.25);
          });
        }
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
        for (let i = 0; i < (s.hits ?? 1); i++) {
          this.later(LEAD + i * 0.18, () => {
            hitAll(shapeTargets({ x: p.x, y: p.y }, dir, { hit: "line", reach: s.length ?? 500, width: s.width }, this.monsters), 20);
            this.line({ x: p.x, y: p.y }, dir, s.length ?? 500, s.color);
          });
        }
        break;
      case "dash": {
        const hit = new Set<Monster>();
        p.startDash(dir, s.distance ?? 200, 0.2, () => {
          // a dash without a multiplier is a teleport: it hits nothing; with `hits`, each one it
          // passes is struck that many times
          if (s.mult) for (const m of shapeTargets({ x: p.x, y: p.y }, dir, { hit: "circle", reach: s.width ?? 60 }, this.monsters)) {
            if (hit.has(m)) continue;
            hit.add(m);
            this.hit(m, s, rank, dir, 30);
            for (let i = 1; i < (s.hits ?? 1); i++) this.later(i * 0.12, () => this.hit(m, s, rank, dir));
          }
          this.fx.add({ x: p.x, y: p.y, z: 50, layer: AIR_GLOW, tex: this.tex.sparkle, life: 0.35,
            size: [[0, 40], [1, 8]], alpha: [[0, 0.8], [1, 0]] });
        });
        break;
      }
      case "heal":
        this.later(LEAD, () => {
          const got = this.hero.heal(this.healAmount(this.hero.stats.maxHp * at(s.heal, rank) + this.power(s) * at(s.mult, rank)));
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
          // a dice buff adds its roll, times (die - 3) / 3: a 1 takes away, a 6 gives it all
          const stats = { ...(s.buff?.(rank) ?? {}) };
          if (s.dice && s.roll) {
            const die = rollDie(this.hero.stats), k = (die - 3) / 3;
            for (const [key, v = 0] of Object.entries(s.roll(rank))) stats[key] = (stats[key] ?? 0) + v * k;
            this.floaters.add(p.x, p.y, 190, `เต๋า ${die}${k > 0 ? " โชคดี!" : k < 0 ? " ซวยแล้ว" : ""}`, k > 0 ? "level" : "info");
          }
          this.hero.addBuff(id, ACTIVES[id].name, stats, (s.duration ?? 8) * (1 + this.hero.stats.buffTime), s.enchant, s.terrain?.(rank));
          if (s.heal) {
            const got = this.hero.heal(this.healAmount(this.hero.stats.maxHp * at(s.heal, rank)));
            if (got >= 1) this.floaters.add(p.x, p.y, 130, `+${Math.round(got)}`, "heal");
          }
          this.floaters.add(p.x, p.y, 150, ACTIVES[id].name, "level");
          this.ring(p.x, p.y, s.color, 180, 0.5);
          this.sparkleUp(p.x, p.y, this.tex.flash, 16);
        });
        break;
      case "trap": {
        const range = s.range ?? 400;
        const dist = aim ? Math.min(range, Math.hypot(aim.x - p.x, aim.y - p.y)) : Math.min(range, 120);
        const spot = { x: p.x + dir.x * dist, y: p.y + dir.y * dist };
        this.later(LEAD, () => {
          if (this.traps.length >= MAX_TRAPS) this.traps.shift();
          this.traps.push({ ...spot, s, rank, left: s.duration ?? 20, armed: 0.5, pulse: 0 });
          this.ring(spot.x, spot.y, s.color, (s.radius ?? 90) * 2, 0.5, true);
        });
        break;
      }
      case "workshop":
        if (s.bench) this.workshop?.(s.bench);
        break;
      case "decoy":
      case "summon": {
        // on the aimed spot within its range, else just in front
        const range = s.range ?? 0, d = aim && range ? Math.min(range, Math.hypot(aim.x - p.x, aim.y - p.y)) : 70;
        this.later(LEAD, () => this.allies?.summon(id, s, rank, { x: p.x + dir.x * d, y: p.y + dir.y * d }, dir));
        break;
      }
      case "mimic":
        if (lock) this.later(LEAD, () => this.startCopy(id, s, rank, lock));
        break;
      case "smoke": {
        const range = s.range ?? 0, d = aim && range ? Math.min(range, Math.hypot(aim.x - p.x, aim.y - p.y)) : 0;
        this.later(LEAD, () => {
          this.clouds.push({ id, s, rank, x: p.x + dir.x * d, y: p.y + dir.y * d, r: s.radius ?? 220, t: s.duration ?? 10, puff: 0 });
          this.ring(p.x + dir.x * d, p.y + dir.y * d, s.color, (s.radius ?? 220) * 2, 0.6, true);
        });
        break;
      }
      case "make":
        if (s.make) {
          const said = this.make?.(s.make, rank, false);
          if (said) this.floaters.add(p.x, p.y, 170, said, "loot");
        }
        break;
      case "falcon":
        if (!lock) break;
        for (let i = 0; i < (s.hits ?? 1); i++) {
          this.later(LEAD + i * 0.25, () => {
            if (!lock.alive) return;
            this.dive(lock, () => this.hit(lock, s, rank, toward(p, lock) ?? dir));
          });
        }
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

  // ---- the third jobs' ----
  // How much more a combo cast does now: one of the skills it follows went off lately.
  comboMore(s: SkillDef, rank: number): number {
    const c = s.combo;
    if (!c) return 0;
    return this.casts.some((x) => c.after.includes(x.id) && this.clock - x.t <= (c.within ?? 3)) ? c.more(rank) : 0;
  }

  // A normal hit landed on m: now and then it casts a skill by itself (the autocast_<id> stats),
  // free of MP and cooldown, at that skill's rank, if the hands hold what it needs.
  autocast(m: Monster): void {
    if (this.autoCd > 0 || !m.alive || !this.hero.alive) return;
    const st = this.hero.stats as unknown as Record<string, number>;
    for (const key of Object.keys(st)) {
      if (!key.startsWith(AUTOCAST) || !(st[key] > 0)) continue;
      const id = key.slice(AUTOCAST.length), a = ACTIVES[id], rank = this.progress.skillRank(id);
      if (!a || !rank || !this.wields(id) || !lucky(st[key], this.hero.stats)) continue;
      this.autoCd = AUTOCAST_GAP;
      const dir = toward(this.player, m) ?? this.player.facing();
      this.floaters.add(this.player.x, this.player.y, 175, `${a.name}!`, "magic");
      this.effect(id, a.skill, rank, dir, { x: m.x, y: m.y }, singleTarget(a.skill) || groundTarget(a.skill) ? m : null);
      return;
    }
  }

  // A mimic took a monster's attack: a shot (in its element) if it shoots, else its bite.
  startCopy(id: string, s: SkillDef, rank: number, m: Monster): void {
    const copy: Copy = { id, rank, from: m.variant.name, shot: m.ranged, element: m.element, magic: m.magical, uses: s.uses ?? 5, until: this.clock + (s.duration ?? 20) };
    this.copy = copy;
    this.hero.addBuff(`copy_${id}`, `ก๊อป${copy.from}`, {}, s.duration ?? 20);
    this.floaters.add(this.player.x, this.player.y, 175, `ก๊อป${copy.shot ? "การยิง" : "การโจมตี"}ของ${copy.from}!`, "level");
    this.burst(m.x, m.y, s.color, 50);
  }

  // The copy as a skill of its own: a bolt like the monster's shot, or a bite at the one in front.
  copySkill(c: Copy): SkillDef {
    const s = ACTIVES[c.id].skill, stat = c.magic ? "matk" : "atk";
    return c.shot
      ? { type: "bolt", stat, element: c.element, mult: s.mult, mp: 0, cd: 0, motion: c.magic ? "cast" : "shoot", speed: 800, range: 650, radius: 30, arrow: c.shot === "arrow", color: SHOT_TINT[c.shot] ?? s.color }
      : { type: "cone", stat, element: c.element, mult: s.mult, mp: 0, cd: 0, motion: "thrust", reach: 170, arc: 50, color: s.color };
  }

  // The slot fires the copy: no MP, a short gap, one use less.
  fireCopy(aim: Vec2 | null): string | null {
    const c = this.copy!, s = ACTIVES[c.id].skill, cs = this.copySkill(c), p = this.player;
    let dir0 = p.facing();
    if (aim) dir0 = toward(p, aim) ?? dir0;
    const lock = this.lockFor(cs, aim, dir0);
    if (!lock) return "ไม่มีเป้าหมายในระยะ";
    const dir = toward(p, lock) ?? dir0, gap = (s.every ?? 0.8) * (1 - this.hero.stats.cdr);
    this.hero.cooldowns.set(c.id, gap);
    this.hero.cdTotal.set(c.id, gap);
    p.target = lock;
    p.startMotion(cs.motion, dir, this.weaponStats());
    this.effect(c.id, cs, c.rank, dir, aim, lock);
    if (--c.uses <= 0) this.endCopy();
    else this.floaters.add(p.x, p.y, 160, `${c.from} เหลือ ${c.uses} ครั้ง`, "info");
    return null;
  }

  // The copy is used up or its time is up: the mimic's own cooldown starts.
  endCopy(): void {
    const c = this.copy;
    if (!c) return;
    this.copy = null;
    const cd = ACTIVES[c.id].skill.cd * (1 - this.hero.stats.cdr);
    this.hero.cooldowns.set(c.id, cd);
    this.hero.cdTotal.set(c.id, cd);
    const before = this.hero.buffs.length;
    this.hero.buffs = this.hero.buffs.filter((b) => b.id !== `copy_${c.id}`);
    if (this.hero.buffs.length !== before) this.hero.recompute();
  }

  // The smoke clouds: they puff and thin out; while she stands in one she is hidden, unless she
  // has just struck from it (rehide).
  updateClouds(dt: number): void {
    const p = this.player, hero = this.hero;
    this.rehide = Math.max(0, this.rehide - dt);
    let inside: Cloud | null = null;
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const c = this.clouds[i];
      if ((c.t -= dt) <= 0) {
        this.clouds.splice(i, 1);
        continue;
      }
      if ((c.puff -= dt) <= 0) {
        c.puff = 0.12;
        const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * c.r;
        this.fx.add({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r, z: rand(10, 70), layer: SORTED, tex: this.tex.glowFor("#b9bcc8"), life: rand(1.2, 2),
          size: [[0, 60], [0.5, 120], [1, 150]], alpha: [[0, 0], [0.25, 0.55], [1, 0]], vz: rand(5, 25) });
      }
      if (Math.hypot(p.x - c.x, p.y - c.y) <= c.r) inside = c;
    }
    const id = inside ? `smoke_${inside.id}` : null, on = id ? hero.buffs.find((b) => b.id === id) : null;
    if (!inside || !hero.alive) this.smokeHid = false;
    else if (on) on.t = Math.max(on.t, 0.3);
    else if (this.smokeHid) {
      // a blow from the smoke showed her: a moment before it hides her again
      this.smokeHid = false;
      this.rehide = 1.2;
    } else if (this.rehide <= 0) {
      hero.addBuff(id!, ACTIVES[inside.id]?.name ?? "ควัน", { ...(inside.s.buff?.(inside.rank) ?? {}), stealth: 1 }, 0.3);
      this.smokeHid = true;
    }
  }

  // A map change: what was laid on the old map stays there.
  leaveMap(): void {
    this.clouds = [];
    this.traps = [];
    this.smokeHid = false;
  }

  // The level of the mastery of the weapon in the main hand (0 without one).
  masteryLevel(): number {
    const w = this.weapon();
    const id = Object.keys(MASTERIES).find((k) => MASTERIES[k].weapons?.includes(w as WeaponId));
    return id ? this.progress.mastery[id] ?? 0 : 0;
  }

  // Traps tick down and pulse; the first monster to step into an armed one sets it off.
  updateTraps(dt: number): void {
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const t = this.traps[i], radius = t.s.radius ?? 90;
      t.left -= dt;
      t.armed -= dt;
      if ((t.pulse -= dt) <= 0) {
        t.pulse = 0.6;
        this.ring(t.x, t.y, t.s.color, radius * 2, 0.7, true);
      }
      const caught = t.armed <= 0 ? shapeTargets(t, { x: 1, y: 0 }, { hit: "circle", reach: radius }, this.monsters) : [];
      if (caught.length) {
        for (const m of caught) {
          const dx = m.x - t.x, dy = m.y - t.y, d = Math.hypot(dx, dy) || 1;
          this.hit(m, t.s, t.rank, { x: dx / d, y: dy / d }, t.s.knock);
        }
        this.burst(t.x, t.y, t.s.color, radius);
      }
      if (caught.length || t.left <= 0 || !this.hero.alive) this.traps.splice(i, 1);
    }
  }

  // The falcon swoops from high behind the player onto a monster; `then` when it strikes.
  dive(m: Monster, then: () => void): void {
    const p = this.player, from = { x: p.x - 60, y: p.y - 40 }, time = 0.25;
    this.fx.add({ x: from.x, y: from.y, z: 260, layer: AIR_GLOW, tex: falconArt(), life: time,
      vx: (m.x - from.x) / time, vy: (m.y - from.y) / time, vz: (m.height * 0.6 - 260) / time,
      size: [[0, 46], [1, 58]], alpha: [[0, 0.2], [0.2, 1], [1, 1]] });
    this.later(time, () => {
      if (!m.alive) return;
      then();
      this.burst(m.x, m.y, "#f2d9a0", 40);
    });
  }

  // The falcon dives in after a normal hit (falconChance): falconPower x attack, through the
  // armour as a blow, never missing.
  falconStrike(m: Monster): void {
    const st = this.hero.stats;
    this.dive(m, () => {
      const dmg = Math.max(1, Math.round(mitigate(st.atk * (st.falconPower || 1), m.def)));
      const dx = m.x - this.player.x, dy = m.y - this.player.y, d = Math.hypot(dx, dy) || 1;
      this.combat.apply(m, { dmg, crit: false, magic: false, miss: false }, { x: dx / d, y: dy / d });
    });
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

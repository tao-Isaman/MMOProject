// Allies: what the third jobs' summons call (progression.ts SkillDef type "summon") and the
// jester's decoy. Each stands for its `duration`, has HP of its own (a share of the player's) and
// falls when the monsters' blows use it up:
//   wolf    follows the player and bites what she attacks, or what attacks her or it; a pack
//           strike (pounce) sends every wolf leaping at her target at once
//   clone   the player's look (a Player driven like hers, the decoy's picture), fights her target
//           with her weapon
//   golem   a stone figure that walks to the nearest monster, hits it and draws the monsters to it
//   statue  a carved figure that stands still: whoever stands within its radius has its buff
//   wall    a stone block: monsters can't walk through it (monsters.ts walls) and hit it when it
//           stands in their way
//   decoy   the jester's copy: every monster goes for it while it stands
//   spirit  floats by the player's shoulder and shoots at her target, or at what goes for her,
//           from up to SPIRIT_RANGE: each shot a skill hit of hers, one every `every` s
//   familiar  follows her; while she is within its `radius` she has its `buff`, and every `every`
//           s it heals her `heal` of her max HP
// A summon may give a `look` (a bestiary monster's sheet, or "slime:<hue>"): the ally is drawn
// as that instead of its kind's own look (lookSheet below; the decoy always looks like her).
// Monsters pick whom they go for here (foeFor): the decoy first, else whoever is nearest of the
// player and the allies, a golem counting as much nearer, a statue as farther, and an ally that
// has just hit the monster nearer again; a wall between it and that one comes first. Allies'
// blows are skill hits of the player's (her stats, the summon's `mult`); what they defeat is hers.
// Her allyPct stat makes every ally's HP and blows that much stronger.

import { mapX, mapY, yaw } from "./projection";
import { sound } from "./audio";
import { resolve } from "./world";
import { loadImage } from "./assets";
import { rand, AIR_GLOW, GROUND_GLOW } from "./particles";
import { skillDamage, basicDamage, monsterDamage, isMagic } from "./stats";
import { walls } from "./monsters";
import { MONSTER_BY_ID, behaviour } from "./bestiary";
import { hueShift } from "./recolor";
import { Player } from "./player";
import { ACTIVES } from "./progression";
import type { AllyKind, SkillDef } from "./progression";
import type { Stats } from "./stats";
import type { Particles } from "./particles";
import type { Combat, Floaters } from "./combat";
import type { Hero } from "./hero";
import type { Monster } from "./monsters";
import type { WeaponType } from "./items";
import type { Img, Textures, Vec2, View } from "./types";

// How each kind lives: its size (cm), speed (cm/s), share of the player's max HP and defence and
// evasion by default, how long between its blows, how long it stays.
const KIND: Record<AllyKind, { radius: number; speed: number; hp: number; def: number; flee: number; every: number; life: number; name: string }> = {
  wolf: { radius: 30, speed: 430, hp: 0.3, def: 0.6, flee: 0.8, every: 1, life: 30, name: "หมาป่า" },
  clone: { radius: 24, speed: 380, hp: 0.3, def: 0.8, flee: 1, every: 0, life: 15, name: "ร่างแยก" },
  golem: { radius: 42, speed: 150, hp: 0.6, def: 1.3, flee: 0, every: 1.5, life: 30, name: "หุ่นปูน" },
  statue: { radius: 30, speed: 0, hp: 0.5, def: 1, flee: 0, every: 0, life: 30, name: "รูปปั้น" },
  wall: { radius: 70, speed: 0, hp: 0.8, def: 1.5, flee: 0, every: 0, life: 20, name: "กำแพง" },
  decoy: { radius: 24, speed: 0, hp: 0.3, def: 1, flee: 1, every: 0, life: 10, name: "ร่างแยก" }, // (as hard to hit as the player, as before)
  // v0.5 (docs/v05_jobs.md): a shooter that floats after the player, a helper that heals her
  spirit: { radius: 24, speed: 400, hp: 0.25, def: 0.6, flee: 1, every: 1.2, life: 30, name: "วิญญาณ" },
  familiar: { radius: 24, speed: 400, hp: 0.3, def: 0.8, flee: 1, every: 3, life: 40, name: "ผู้ช่วย" },
};
// How much nearer (under 1) or farther a monster counts each kind when it picks whom to go for.
const DRAW: Record<AllyKind, number> = { wolf: 1, clone: 1, golem: 0.45, statue: 1.6, wall: Infinity, decoy: 0, spirit: 1.2, familiar: 1.4 };
const FOLLOW = 150;   // cm a wolf or clone keeps from the player when there's nothing to fight
const LEASH = 1300;   // farther than this from her, it gives up the fight and comes back
const RECHECK = 0.4;  // s a monster keeps its choice of foe
const MEMORY = 5;     // s a monster remembers which ally hit it
const SPIRIT_RANGE = 520; // cm a spirit shoots from
const SPIRIT_LIFT = 55;   // cm a spirit floats over the ground

export class Ally {
  kind: AllyKind;
  skill: string;     // the summon that called it
  s: SkillDef;
  rank: number;
  blow: SkillDef;    // its blows, as a skill hit of the player's
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  t: number;         // s it has left
  def: number;
  flee: number;
  target: Monster | null = null;
  cd = 0;            // s to its next blow
  swing = 0;         // s left of its blow (drawn as a lunge)
  hurt = 0;          // red flash after being hit
  dir: Vec2 = { x: 1, y: 0 };
  moving = false;
  walked = 0;
  age = 0;
  gone = false;
  body: Player | null = null; // a clone: the player's look
  look: string | null;        // the sheet it is drawn with (lookSheet), null: its kind's picture
  filter: string;             // and how that is recoloured
  size: number | null;        // cm tall it is drawn (null: the look's own size)

  constructor(kind: AllyKind, skill: string, s: SkillDef, rank: number, at: Vec2, hp: number, def: number, flee: number) {
    this.kind = kind;
    this.skill = skill;
    this.s = s;
    this.rank = rank;
    this.x = at.x;
    this.y = at.y;
    this.radius = kind === "wall" ? s.radius ?? KIND.wall.radius : KIND[kind].radius;
    this.hp = this.maxHp = Math.max(1, Math.round(hp));
    this.t = s.duration ?? KIND[kind].life;
    this.def = def;
    this.flee = flee;
    this.blow = { type: "cone", stat: s.stat ?? "atk", element: s.element, mult: s.mult, mp: 0, cd: 0, motion: "swing", color: s.color };
    const own = OWN_LOOK[kind];
    this.look = lookOf(kind, s);
    this.filter = s.look ? "" : own?.filter ?? "";
    this.size = s.look ? null : own?.size ?? null;
  }

  get alive(): boolean {
    return !this.gone && this.hp > 0 && this.t > 0;
  }

  get name(): string {
    return ACTIVES[this.skill]?.name ?? KIND[this.kind].name;
  }
}

interface AllyDeps {
  hero: Hero;
  player: Player;
  monsters: Monster[];
  combat: Combat;
  fx: Particles;
  tex: Textures;
  floaters: Floaters;
  weapon: () => WeaponType; // what the player swings, with her stats (a clone swings it too)
}

const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);

// The looks the kinds have of their own (a summon's `look` takes their place): bestiary monsters'
// sheets recoloured so they read as the player's: the wolf a warmer coat, the golem pale worked
// stone (the basalt golem, its lava cooled), the spirit a pale ghost of the brook spirit, the
// familiar a little oak sprite. The clone and the decoy are her figure; the statue and the wall
// are drawn below.
const OWN_LOOK: Partial<Record<AllyKind, { look: string; size: number; filter: string }>> = {
  wolf: { look: "pine_wolf", size: 100, filter: "sepia(0.35) brightness(1.15)" },
  golem: { look: "basalt_golem", size: 175, filter: "grayscale(0.9) sepia(0.15) brightness(1.7)" },
  spirit: { look: "brook_spirit", size: 95, filter: "saturate(0.45) brightness(1.4)" },
  familiar: { look: "oak_sprite", size: 80, filter: "saturate(1.2) brightness(1.1)" },
};

// A picture to draw an ally with (or the player in a form, main.ts): a bestiary monster's sheet
// (public/assets/monsters: a standing frame, its walk, its attack) or a slime's hop tinted to a
// hue, four directions a row like the monsters'. size: cm tall it stands (the bestiary's, within
// LOOK_SIZE); fly: it floats (the bestiary's "fly").
export interface Clip {
  img: Img;
  at: number; // its first column
  frames: number;
}
export interface Sheet {
  cell: number;
  foot: number;
  top: number;
  idle: Clip;
  move: Clip;
  attack: Clip;
  size: number;
  fly: boolean;
}
const LOOK_SIZE = [60, 200];
// What an ally of a summon looks like: the summon's look, else its kind's own (the decoy is
// always her: none).
function lookOf(kind: AllyKind, s: SkillDef): string | null {
  return kind === "decoy" ? null : s.look ?? OWN_LOOK[kind]?.look ?? null;
}
const SLIME_HUE = 150; // the hue of the slime sheet's own green (monsters.ts VARIANTS turn it from there)
function recolour(img: Img, filter: string): Img {
  if (!filter) return img;
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d")!;
  g.filter = filter;
  g.drawImage(img, 0, 0);
  return c;
}
let meta: Promise<Record<string, { cell: number; foot: number; top: number; walk: number; attack: number }>> | null = null;
async function loadSheet(look: string, filter: string): Promise<Sheet | null> {
  const slime = /^slime:(\d+)$/.exec(look);
  if (slime) {
    const turn = Number(slime[1]) - SLIME_HUE;
    const [idle, hop] = (await Promise.all([loadImage("assets/slime_idle.png"), loadImage("assets/slime_hop.png")])).map((img) => recolour(hueShift(img, turn, 1.1), filter));
    const move = { img: hop, at: 0, frames: hop.width / 64 };
    return { cell: 64, foot: 0, top: 64 * 0.82, idle: { img: idle, at: 0, frames: 1 }, move, attack: move, size: 70, fly: false };
  }
  meta ??= fetch("assets/monsters/index.json").then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  const info = (await meta)[look], def = MONSTER_BY_ID[look];
  if (!info) return null;
  const img = recolour(await loadImage(`assets/monsters/${look}.png`), filter);
  return {
    cell: info.cell, foot: info.foot, top: info.top,
    idle: { img, at: 0, frames: 1 }, move: { img, at: 1, frames: info.walk }, attack: { img, at: 1 + info.walk, frames: info.attack },
    size: Math.min(LOOK_SIZE[1], Math.max(LOOK_SIZE[0], def?.size ?? 120)), fly: !!def && behaviour(def, "fly") !== null,
  };
}
const sheets = new Map<string, Sheet | "loading" | "none">();
// The sheet of a look ("<monster id>" or "slime:<hue>"), recoloured by a canvas filter: null
// until it has loaded (the first ask starts it), or when there is no such sheet.
export function lookSheet(look: string, filter = ""): Sheet | null {
  const key = `${look}|${filter}`, known = sheets.get(key);
  if (known) return typeof known === "string" ? null : known;
  sheets.set(key, "loading");
  loadSheet(look, filter).then((sh) => sheets.set(key, sh ?? "none")).catch((err) => {
    console.warn(err);
    sheets.set(key, "none");
  });
  return null;
}

// A carved wooden figure (the statue) and a block of stone (the wall), drawn once.
let statueArt: HTMLCanvasElement | null = null;
function statuePicture(): HTMLCanvasElement {
  if (statueArt) return statueArt;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 120;
  const g = c.getContext("2d")!;
  // the plinth
  g.fillStyle = "#6b4a2a";
  g.fillRect(10, 100, 44, 18);
  g.fillStyle = "#8a6238";
  g.fillRect(10, 100, 44, 5);
  // the body: an owl with its wings folded, carved from one trunk
  const body = g.createLinearGradient(12, 0, 52, 0);
  body.addColorStop(0, "#7a4f2a");
  body.addColorStop(0.5, "#c08a52");
  body.addColorStop(1, "#7a4f2a");
  g.fillStyle = body;
  g.beginPath();
  g.moveTo(16, 100);
  g.quadraticCurveTo(8, 58, 18, 28);
  g.lineTo(14, 8);
  g.lineTo(26, 20);
  g.quadraticCurveTo(32, 16, 38, 20);
  g.lineTo(50, 8);
  g.lineTo(46, 28);
  g.quadraticCurveTo(56, 58, 48, 100);
  g.closePath();
  g.fill();
  g.strokeStyle = "#4a2e16";
  g.lineWidth = 2;
  g.stroke();
  // the folded wings and the grain
  g.beginPath();
  g.moveTo(18, 52);
  g.quadraticCurveTo(22, 80, 20, 96);
  g.moveTo(46, 52);
  g.quadraticCurveTo(42, 80, 44, 96);
  for (const y of [60, 70, 80]) {
    g.moveTo(26, y);
    g.quadraticCurveTo(32, y + 5, 38, y);
  }
  g.stroke();
  // the eyes, lit
  for (const x of [25, 39]) {
    g.fillStyle = "#3a2410";
    g.beginPath();
    g.arc(x, 36, 6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#ffe27a";
    g.beginPath();
    g.arc(x, 36, 3.2, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#e0a040";
  g.beginPath();
  g.moveTo(29, 42);
  g.lineTo(35, 42);
  g.lineTo(32, 49);
  g.closePath();
  g.fill();
  return (statueArt = c);
}
let wallArt: HTMLCanvasElement | null = null;
function wallPicture(): HTMLCanvasElement {
  if (wallArt) return wallArt;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 100;
  const g = c.getContext("2d")!;
  // the top, seen from above at an angle, then the face with its courses of stone
  g.fillStyle = "#c9c3b4";
  g.beginPath();
  g.moveTo(8, 26);
  g.lineTo(28, 6);
  g.lineTo(120, 6);
  g.lineTo(100, 26);
  g.closePath();
  g.fill();
  g.fillStyle = "#8f887a";
  g.beginPath();
  g.moveTo(100, 26);
  g.lineTo(120, 6);
  g.lineTo(120, 78);
  g.lineTo(100, 98);
  g.closePath();
  g.fill();
  g.fillStyle = "#a59e8e";
  g.fillRect(8, 26, 92, 72);
  g.strokeStyle = "#6a6457";
  g.lineWidth = 2;
  for (let row = 0; row < 4; row++) {
    const y = 26 + row * 18;
    g.beginPath();
    g.moveTo(8, y);
    g.lineTo(100, y);
    g.stroke();
    for (let x = 8 + (row % 2 ? 23 : 0); x < 100; x += 46) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y + 18);
      g.stroke();
    }
  }
  g.strokeRect(8, 26, 92, 72);
  return (wallArt = c);
}

export class Allies {
  d: AllyDeps;
  list: Ally[] = [];
  clock = 0;
  private chosen = new WeakMap<Monster, { foe: Ally | null; t: number }>();
  private hitBy = new WeakMap<Monster, { by: Ally; t: number }>();
  private pulse = 0;

  constructor(deps: AllyDeps) {
    this.d = deps;
  }

  // How many of a kind stand now.
  count(kind: AllyKind): number {
    return this.list.filter((a) => a.alive && a.kind === kind).length;
  }

  // Those standing now of the creature a summon calls: its kind with its look (two summons of
  // one kind in different looks, a ghost and a demon, count apart).
  same(s: SkillDef): Ally[] {
    const kind = s.type === "decoy" ? "decoy" : s.ally ?? "wolf", look = lookOf(kind, s);
    return this.list.filter((a) => a.alive && a.kind === kind && a.look === look);
  }

  // Call one of a summon's allies at a spot (the decoy's copy too): `count` of that creature at
  // most, the oldest goes for the new one.
  summon(skill: string, s: SkillDef, rank: number, at: Vec2, dir: Vec2): Ally {
    const kind = s.type === "decoy" ? "decoy" : s.ally ?? "wolf";
    const same = this.same(s);
    for (const old of same.slice(0, Math.max(0, same.length - (s.count ?? 1) + 1))) this.dismiss(old);
    const st = this.d.hero.stats, k = KIND[kind];
    const spot = { ...at };
    if (k.speed) resolve(spot, k.radius);
    const a = new Ally(kind, skill, s, rank, spot, st.maxHp * (s.base?.(rank) ?? k.hp) * (1 + st.allyPct), st.def * k.def, st.flee * k.flee);
    if (a.look) lookSheet(a.look, a.filter); // (its picture starts loading now)
    a.dir = dir;
    if (kind === "clone") {
      const p = this.d.player;
      a.body = new Player(spot.x, spot.y, p.sheets, p.anchors, p.gemGlow);
      a.body.builtin = p.builtin;
      a.body.dir = p.dir;
    }
    this.list.push(a);
    this.ring(a.x, a.y, s.color, kind === "statue" ? (s.radius ?? 300) * 2 : 160, 0.6);
    this.sparkle(a.x, a.y, s.color, 18);
    return a;
  }

  // It goes (its time is up, or a new one takes its place).
  dismiss(a: Ally): void {
    if (a.gone) return;
    a.gone = true;
    this.sparkle(a.x, a.y, a.s.color, 12);
  }

  // The pack at a monster on the player's word (a falcon-type skill with ally "wolf", skills.ts):
  // every wolf standing leaps to its side and bites at once (`bite`: the skill's hit, once a
  // wolf), then goes on at it. How many leapt.
  pounce(m: Monster, bite: () => void): number {
    const pack = this.list.filter((a) => a.alive && a.kind === "wolf");
    pack.forEach((a, i) => {
      const gap = a.radius + m.radius + 10;
      if (dist(a, m) > gap) {
        // they land round it side by side, from the way they came
        const from = { x: a.x, y: a.y }, turn = Math.atan2(a.y - m.y, a.x - m.x) + (i - (pack.length - 1) / 2) * 0.9;
        a.x = m.x + Math.cos(turn) * gap;
        a.y = m.y + Math.sin(turn) * gap;
        resolve(a, a.radius);
        this.leap(from, a, a.s.color);
      }
      a.target = m;
      a.dir = this.toward(a, m);
      a.swing = 0.35;
      this.hitBy.set(m, { by: a, t: this.clock });
      bite();
    });
    return pack.length;
  }

  // A map change: everyone is left behind.
  clear(): void {
    for (const a of this.list) a.gone = true;
    this.list.length = 0;
    walls.length = 0;
  }

  update(dt: number): void {
    this.clock += dt;
    const p = this.d.player, hero = this.d.hero;
    for (const a of this.list) {
      if (!a.alive) continue;
      a.age += dt;
      a.t -= dt;
      a.cd = Math.max(0, a.cd - dt);
      a.swing = Math.max(0, a.swing - dt);
      a.hurt = Math.max(0, a.hurt - dt);
      if (!hero.alive && a.kind !== "statue" && a.kind !== "wall") a.t = 0; // the fallen player's allies go
      if (a.t <= 0) {
        this.dismiss(a);
        continue;
      }
      if (a.kind === "wolf") this.hunt(a, dt, true);
      else if (a.kind === "golem") this.hunt(a, dt, false);
      else if (a.kind === "clone") this.duel(a, dt);
      else if (a.kind === "spirit") this.float(a, dt);
      else if (a.kind === "familiar") this.tend(a, dt);
      else if (a.kind === "statue" && dist(a, p) <= (a.s.radius ?? 300) && hero.alive) this.bless(a);
    }
    for (let i = this.list.length - 1; i >= 0; i--) if (!this.list[i].alive) this.list.splice(i, 1);
    // the walls stand in the monsters' way; the statues' circles glow now and then
    walls.length = 0;
    for (const a of this.list) if (a.kind === "wall") walls.push({ x: a.x, y: a.y, r: a.radius });
    if ((this.pulse -= dt) <= 0) {
      this.pulse = 1.2;
      for (const a of this.list) if (a.kind === "statue") this.ring(a.x, a.y, a.s.color, (a.s.radius ?? 300) * 2, 1.1, true);
    }
  }

  // The statue's blessing on the player while she stands by it (one buff a summon, kept fresh).
  private bless(a: Ally): void {
    const hero = this.d.hero, id = `ally_${a.skill}`;
    const b = hero.buffs.find((x) => x.id === id);
    if (b) b.t = Math.max(b.t, 0.6);
    else hero.addBuff(id, a.name, a.s.buff?.(a.rank) ?? {}, 0.6);
  }

  // A spirit: it keeps by the player's shoulder (floating over whatever stands there; several
  // spirits take turns at either side, each farther out) and shoots at her target, or at one going
  // for her or for it, within SPIRIT_RANGE.
  private float(a: Ally, dt: number): void {
    const p = this.d.player, f = p.facing();
    const i = this.list.filter((x) => x.alive && x.kind === "spirit").indexOf(a), side = (i % 2 ? -1 : 1) * (55 + 50 * Math.floor(i / 2));
    const spot = { x: p.x - f.x * 60 + f.y * side, y: p.y - f.y * 60 - f.x * side };
    const d = dist(a, spot);
    if (d > LEASH * 1.8) Object.assign(a, spot);
    else if (d > 10) {
      const step = Math.min(d, Math.max(KIND.spirit.speed, d * 3) * dt), was = { x: a.x, y: a.y };
      a.x += ((spot.x - a.x) / d) * step;
      a.y += ((spot.y - a.y) / d) * step;
      a.walked += dist(a, was);
    }
    a.moving = d > 10;
    const m = (a.target = this.pick(a, true));
    if (!m || dist(a, m) - m.radius > SPIRIT_RANGE) return;
    a.dir = this.toward(a, m);
    if (a.cd > 0) return;
    a.cd = a.s.every ?? KIND.spirit.every;
    a.swing = 0.35;
    this.d.combat.shoot({ x: a.x, y: a.y }, a.dir, {
      kind: "skill", speed: 900, range: SPIRIT_RANGE + 100, radius: 26, color: a.s.color, target: m,
      onHit: (hit) => this.strike(a, hit, this.skillHit(a, hit)),
    });
  }

  // A familiar: it follows the player; while she is within its radius she has its buff, and every
  // `every` s it heals her its `heal` of her max HP.
  private tend(a: Ally, dt: number): void {
    const p = this.d.player, hero = this.d.hero;
    if (dist(a, p) > LEASH * 1.8) {
      a.x = p.x - p.facing().x * 90;
      a.y = p.y - p.facing().y * 90;
    }
    if (dist(a, p) > FOLLOW) this.walk(a, p, KIND.familiar.speed, dt, FOLLOW * 0.7);
    else a.moving = false;
    if (!hero.alive || dist(a, p) > (a.s.radius ?? 300)) return;
    if (a.s.buff) this.bless(a);
    if (a.cd > 0 || !a.s.heal) return;
    a.cd = a.s.every ?? KIND.familiar.every;
    a.swing = 0.35;
    const got = hero.heal(hero.stats.maxHp * a.s.heal(a.rank) * (1 + hero.stats.healPct));
    if (got >= 1) this.d.floaters.add(p.x, p.y, 130, `+${Math.round(got)}`, "heal");
    this.sparkle(p.x, p.y, a.s.color, 10);
  }

  // What a wolf or golem goes for: a wolf the player's target, or one going for her or for it;
  // a golem the nearest monster round it (one already angry first).
  private pick(a: Ally, wolf: boolean): Monster | null {
    const p = this.d.player, mons = this.d.monsters;
    const t = p.target as Monster | null;
    if (wolf && t?.alive && mons.includes(t) && dist(t, a) < LEASH) return t;
    if (a.target?.alive && mons.includes(a.target) && dist(a.target, p) < LEASH) return a.target;
    let best: Monster | null = null, score = Infinity;
    for (const m of mons) {
      if (!m.alive) continue;
      if (wolf) {
        // what is coming for her or for it
        if (m.angry <= 0 || (m.foe !== null && m.foe !== a) || dist(m, p) > 600) continue;
        const d = dist(m, a);
        if (d < score) [best, score] = [m, d];
      } else {
        const d = dist(m, a) * (m.angry > 0 ? 0.6 : 1);
        if (dist(m, a) < 800 && d < score) [best, score] = [m, d];
      }
    }
    return best;
  }

  // A wolf or a golem: to its prey and at it, else back to the player's side.
  private hunt(a: Ally, dt: number, wolf: boolean): void {
    const p = this.d.player, k = KIND[a.kind];
    if (dist(a, p) > LEASH * 1.8) {
      // left far behind: it catches up at once
      a.x = p.x - p.facing().x * 90;
      a.y = p.y - p.facing().y * 90;
      a.target = null;
    }
    a.target = this.pick(a, wolf);
    const m = a.target;
    if (!m) {
      if (wolf && dist(a, p) > FOLLOW) this.walk(a, p, k.speed, dt, FOLLOW * 0.7);
      else if (!wolf && dist(a, p) > LEASH * 0.6) this.walk(a, p, k.speed, dt, 200);
      else a.moving = false;
      return;
    }
    const reach = a.radius + m.radius + 35;
    if (dist(a, m) > reach) return this.walk(a, m, k.speed, dt, reach * 0.8);
    a.moving = false;
    a.dir = this.toward(a, m);
    if (a.cd <= 0) {
      a.cd = a.s.every ?? k.every;
      a.swing = 0.35;
      this.strike(a, m, this.skillHit(a, m));
    }
  }

  // A clone: the player's own way of fighting, at her target (or one going for her or for it).
  private duel(a: Ally, dt: number): void {
    const b = a.body!, p = this.d.player, w = this.d.weapon();
    b.speedMul = p.speedMul;
    if (dist(a, p) > LEASH * 1.8) {
      b.x = p.x;
      b.y = p.y;
    }
    const t = p.target as Monster | null;
    const want = t?.alive && this.d.monsters.includes(t) ? t : this.d.monsters.find((m) => m.alive && m.angry > 0 && (m.foe === null || m.foe === a) && dist(m, p) < 500) ?? null;
    b.target = want;
    let move = { x: 0, y: 0 };
    if (!want && dist(b, p) > FOLLOW) move = { x: p.x - b.x, y: p.y - b.y };
    const hit = b.update(dt, move, w);
    a.x = b.x;
    a.y = b.y;
    // (a clone drawn in a look turns and steps with its body)
    a.moving = b.moving;
    a.walked = b.walked;
    a.dir = b.facing();
    if (hit && want?.alive && dist(b, want) - want.radius <= (w.projectile ? w.projectile.range : w.reach) + 40) {
      // her weapon's blow, `mult` of it
      const st = this.d.hero.stats, r = basicDamage(st, w, want, isMagic(w) ? null : this.d.hero.enchant);
      if (!r.miss) r.dmg = Math.max(1, Math.round(r.dmg * (a.s.mult?.(a.rank) ?? 0.5)));
      a.swing = 0.35;
      this.strike(a, want, r);
    }
  }

  // Its blow as one of the player's skill hits.
  private skillHit(a: Ally, m: Monster): ReturnType<typeof skillDamage> {
    return skillDamage(this.d.hero.stats, this.d.hero.progress.elementLevels(), a.blow, a.rank, m, null);
  }

  private strike(a: Ally, m: Monster, r: ReturnType<typeof skillDamage>): void {
    this.hitBy.set(m, { by: a, t: this.clock });
    if (!r.miss) r.dmg = Math.max(1, Math.round(r.dmg * (1 + this.d.hero.stats.allyPct)));
    this.d.combat.apply(m, r, this.toward(a, m), 0, true);
    if (!r.miss) this.sparkle(m.x, m.y, a.s.color, 5);
  }

  private toward(a: Vec2, b: Vec2): Vec2 {
    const d = dist(a, b) || 1;
    return { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
  }

  // A step toward `to`, stopping `stop` short of it, round what stands in the way.
  private walk(a: Ally, to: Vec2, speed: number, dt: number, stop: number): void {
    const d = dist(a, to);
    if (d <= stop) {
      a.moving = false;
      return;
    }
    a.dir = this.toward(a, to);
    const step = Math.min(d - stop, speed * dt);
    const q = { x: a.x + a.dir.x * step, y: a.y + a.dir.y * step };
    resolve(q, a.radius);
    a.walked += dist(a, q);
    a.moving = dist(a, q) > 0.5;
    a.x = q.x;
    a.y = q.y;
  }

  // ---- the monsters' side ----
  // Whom a monster goes for (null: the player), kept a moment so it doesn't dither. seen: whether
  // the player can be seen (she hides: only the allies are left to go for).
  foeFor(m: Monster, seen: boolean): Ally | null {
    if (!this.list.length) return null;
    const memo = this.chosen.get(m);
    if (memo && this.clock - memo.t < RECHECK && (!memo.foe || memo.foe.alive)) return memo.foe;
    const foe = this.choose(m, seen);
    this.chosen.set(m, { foe, t: this.clock });
    return foe;
  }

  private choose(m: Monster, seen: boolean): Ally | null {
    const live = this.list.filter((a) => a.alive);
    const decoy = live.find((a) => a.kind === "decoy");
    if (decoy) return decoy;
    const p = this.d.player, hit = this.hitBy.get(m);
    let best: Ally | null = null, score = seen && this.d.hero.alive ? dist(m, p) : Infinity;
    for (const a of live) {
      let sc = dist(m, a) * DRAW[a.kind];
      if (hit?.by === a && this.clock - hit.t < MEMORY) sc *= 0.6;
      if (m.foe === a) sc *= 0.85;
      if (sc < score) [best, score] = [a, sc];
    }
    const goal: Vec2 | null = best ?? (score < Infinity ? p : null);
    return (goal && this.wallBetween(m, goal)) || best;
  }

  // A wall standing between a monster and where it goes, close to it.
  private wallBetween(m: Monster, goal: Vec2): Ally | null {
    const far = dist(m, goal);
    for (const w of this.list) {
      if (w.kind !== "wall" || !w.alive) continue;
      const dw = dist(m, w);
      if (dw >= far || dw - w.radius - m.radius > 240) continue;
      // how far the wall's centre is from the line it walks along
      const ux = (goal.x - m.x) / (far || 1), uy = (goal.y - m.y) / (far || 1);
      const along = (w.x - m.x) * ux + (w.y - m.y) * uy;
      const side = Math.abs(-(w.x - m.x) * uy + (w.y - m.y) * ux);
      if (along > 0 && side < w.radius + m.radius + 10) return w;
    }
    return null;
  }

  // A monster's blow lands on an ally: it dodges by its evasion, its defence takes some off (of
  // spells too: an ally has the one defence).
  hurt(a: Ally, m: Monster): void {
    if (!a.alive) return;
    const st = { ...this.d.hero.stats, def: a.def, mdef: a.def, flee: a.flee, dmgRed: a.kind === "wall" ? 0.2 : 0 } as Stats;
    const r = monsterDamage(m, st);
    if (!r) sound.play("miss", a.name.length);
    if (!r) return void this.d.floaters.add(a.x, a.y, 110, "พลาด", "miss");
    sound.playHit({ kind: "enemy", theme: "", weapon: "" });
    a.hp -= r.dmg;
    a.hurt = 0.25;
    this.d.floaters.add(a.x, a.y, 100, `-${r.dmg}`, "hurt");
    if (a.hp <= 0) {
      sound.play("enemy-death", a.name.length);
      a.hp = 0;
      this.ring(a.x, a.y, a.s.color, 160, 0.4);
      this.d.floaters.add(a.x, a.y, 140, `${a.name} ล้มแล้ว`, "info");
    }
  }

  // ---- drawing ----
  // The board an ally is drawn into (World3D.actor): room for its picture, its float and its HP.
  box(a: Ally): { x: number; y: number; w: number; h: number; foot: number } {
    if (a.look) {
      const size = a.size ?? lookSheet(a.look, a.filter)?.size ?? 120;
      return { x: a.x, y: a.y, w: Math.max(260, size * 1.4), h: Math.max(200, size * 0.8 + this.lift(a) + 90), foot: 50 };
    }
    const h = a.kind === "clone" || a.kind === "decoy" ? 300 : a.kind === "statue" ? 240 : 200;
    return { x: a.x, y: a.y, w: a.kind === "clone" || a.kind === "decoy" ? 340 : 260, h, foot: 50 };
  }

  // How high it floats (map px): a spirit always, a look of a monster that flies.
  private lift(a: Ally): number {
    const fly = a.kind === "spirit" || (!!a.look && !!lookSheet(a.look, a.filter)?.fly);
    return fly ? SPIRIT_LIFT + Math.sin(a.age * 2.6) * 8 : 0;
  }

  // An ally on its board. person: the player's own figure drawn at a spot (a clone, a decoy).
  draw(ctx: CanvasRenderingContext2D, view: View, a: Ally, person: (ctx: CanvasRenderingContext2D, view: View, body: Player | null, at: Vec2) => void): void {
    const { k, ox, oy } = view;
    const gx = mapX(a.x, a.y) * k + ox, gy = mapY(a.x, a.y) * k + oy;
    const fade = Math.min(1, a.t / 0.6, a.age / 0.3);
    // a friendly ring under its feet
    ctx.globalAlpha = 0.85 * fade;
    ctx.strokeStyle = "#7dffb0";
    ctx.lineWidth = 2.5 * k;
    ctx.beginPath();
    ctx.ellipse(gx, gy, (a.radius + 14) * k, (a.radius + 14) * k * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = fade;
    let top = 120;
    if (a.look) {
      const sh = lookSheet(a.look, a.filter);
      if (sh) {
        const size = a.size ?? sh.size, lift = this.lift(a);
        const s = (size * 0.8 * k) / sh.top, c = sh.cell;
        const row = ((Math.round(Math.atan2(a.dir.y, -a.dir.x) / (Math.PI / 2)) % 4) + 4 + Math.round(yaw / (Math.PI / 2))) % 4;
        const clip = a.swing > 0 ? sh.attack : a.moving ? sh.move : sh.idle;
        const col = a.swing > 0 ? Math.min(clip.frames - 1, Math.floor((0.35 - a.swing) * 12)) : a.moving ? Math.floor(a.walked / 25) % clip.frames : 0;
        ctx.drawImage(clip.img, (clip.at + col) * c, row * c, c, c, gx - (c * s) / 2, gy - (c - sh.foot) * s - lift * k, c * s, c * s);
        top = size * 0.8 + lift + 10;
      } else {
        // its sheet still on its way: a glow where it stands
        ctx.drawImage(this.d.tex.glowFor(a.s.color), gx - 30 * k, gy - 70 * k, 60 * k, 60 * k);
      }
    } else if (a.kind === "clone" || a.kind === "decoy") {
      person(ctx, view, a.body, a);
      // a copy: see-through, a little blue (the decoy fainter)
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = `rgba(0, 0, 0, ${(a.kind === "decoy" ? 0.55 : 0.78) * fade})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = "rgba(120, 200, 255, 0.18)";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalCompositeOperation = "source-over";
      top = 135;
    } else if (a.kind === "statue" || a.kind === "wall") {
      const img = a.kind === "statue" ? statuePicture() : wallPicture();
      const w = (a.kind === "statue" ? 70 : a.radius * 2.1) * k, h = w * (img.height / img.width);
      ctx.drawImage(img, gx - w / 2, gy - h + 8 * k, w, h);
      if (a.hurt > 0) {
        ctx.globalAlpha = 0.4 * (a.hurt / 0.25);
        ctx.fillStyle = "#ff4030";
        ctx.fillRect(gx - w / 2, gy - h + 8 * k, w, h);
      }
      top = h / k - 4;
    }
    // its HP, green, over it
    if (a.kind !== "decoy") {
      const w = 64 * k, h = 7 * k, y = gy - top * k - 10 * k;
      ctx.globalAlpha = fade;
      ctx.fillStyle = "rgba(10, 14, 8, 0.85)";
      ctx.fillRect(gx - w / 2 - k, y - k, w + 2 * k, h + 2 * k);
      ctx.fillStyle = "#1d3a24";
      ctx.fillRect(gx - w / 2, y, w, h);
      ctx.fillStyle = "#6ee08a";
      ctx.fillRect(gx - w / 2, y, (w * Math.max(0, a.hp)) / a.maxHp, h);
    }
    ctx.globalAlpha = 1;
  }

  // ---- effects ----
  private ring(x: number, y: number, color: string, size: number, life: number, ground = false): void {
    this.d.fx.add({ x, y, z: 2, layer: GROUND_GLOW, tex: this.d.tex.ringFor(color), flat: true, life,
      size: ground ? [[0, size * 0.9], [1, size]] : [[0, size * 0.3], [1, size]], alpha: [[0, 0.9], [0.7, 0.6], [1, 0]] });
  }

  // A wolf's leap: an arc of glow from where it sprang to where it lands.
  private leap(from: Vec2, to: Vec2, color: string): void {
    const tex = this.d.tex.glowFor(color), d = dist(from, to);
    for (let s = 0; s < d; s += 30) {
      const f = s / d;
      this.d.fx.add({ x: from.x + (to.x - from.x) * f, y: from.y + (to.y - from.y) * f, z: 30 + Math.sin(f * Math.PI) * 70, layer: AIR_GLOW,
        tex, life: 0.3, size: [[0, 26], [1, 6]], alpha: [[0, 0.8], [1, 0]] });
    }
  }

  private sparkle(x: number, y: number, color: string, n: number): void {
    const tex = this.d.tex.glowFor(color);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), r = rand(10, 50);
      this.d.fx.add({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, z: rand(10, 60), layer: AIR_GLOW, tex, life: rand(0.4, 0.8),
        size: [[0, 22], [1, 4]], alpha: [[0, 0.9], [1, 0]], vz: rand(60, 140) });
    }
  }
}

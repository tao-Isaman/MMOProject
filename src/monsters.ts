// The monsters: they wander round their spot, flinch when hit (a skill made to push knocks them back), chase and
// strike back once angered (some attack on sight), fall when defeated, drop loot and come back
// after a while. Skills can stun, freeze, slow and burn them.
//
// The first field keeps its jelly slimes (VARIANTS); every other field has its own monsters
// from the bestiary (src/bestiary.ts), each with its ways of fighting: charging, shooting,
// slamming the ground, healing, calling for help...
//
// Sheets: four directions per sheet row (front, then clockwise seen from above: south, west,
// north, east), one column per frame. The slimes come from the Oriverse sprite `jelly_slime`,
// colour variants hue-rotated copies, and hop. Every other monster has one sheet
// (public/assets/monsters/<id>.png, listed in index.json): a standing frame, then its walk,
// then its attack; it walks. One whose sheet isn't drawn yet stands in as a slime of its
// element, grown to its size. The bandits, raiders and ninjas are people: dressed through the
// wardrobe (src/look.ts) and drawn like the player, weapon in hand.

import { icon } from "./icons";
import { mapX, mapY, yaw, heightAt } from "./projection";
import { resolve, SOLIDS, BOUNDS } from "./world";
import { hueShift, silhouette } from "./recolor";
import { loadImage } from "./assets";
import { rand } from "./particles";
import { behaviour, statsFor, PEOPLE } from "./bestiary";
import type { MonsterDef, MonsterKind } from "./bestiary";
import { Player, directionIndex, directionVector } from "./player";
import type { Hands } from "./look";
import type { WeaponArt } from "./weapons";
import type { Img, Vec2, View } from "./types";
import type { Hero } from "./hero";
import type { ElementId } from "./progression";

export interface Variant {
  id: string;
  name: string;
  hue: number;
  level: number;
  hp: number;
  atk: number;
  def: number;
  mdef: number;
  accuracy?: number; // against the player's evasion (default: from its level)
  flee?: number;     // evasion against the player's accuracy (default: from its level)
  crit?: number;     // chance its bite crits (default: from its level)
  element?: ElementId;                         // what its bite is made of (none: no element)
  eleDef?: Partial<Record<ElementId, number>>; // its defence in each element (stats.ts elemental)
  xp: number;
  aggro: number;
  weight: number;
  drops: [string, number][];
  entry?: MonsterDef; // a bestiary monster (the slimes have none)
}

interface Clip {
  img: Img;
  flash: Img;
  ice: Img;
  stone: Img;
  frames: number;
  at: number; // its first column
}

// A monster's sheets and how to draw them.
export interface Look {
  cell: number;      // sprite px a side
  scale: number;     // map px per sprite px
  foot: number;      // sprite px from the cell's bottom up to its feet
  top: number;       // sprite px from its feet up to the top of its head
  fps: number;       // walking (hopping)
  attackFps: number;
  strike: number;    // s into its attack that the blow lands
  swing: number;     // s its attack takes
  hurtT: number;     // s it flinches
  dieT: number;      // s it takes to fall and fade
  hop: boolean;      // moves only in the air (the slimes)
  idle: Clip;
  move: Clip;
  attack: Clip;
  hurt: Clip;
  die: Clip;
}

// What a monster needs from the game each frame.
export interface MonsterCtx {
  player: Vec2;
  hero: Hero;
  bite: (m: Monster) => void; // a bite, shot, slam or burst lands (m.boost: how much harder)
  note?: (m: Monster, text: string) => void;            // it healed itself
  summon?: (m: Monster, id: string, n: number) => void; // a boss calls for help
}

const CELL = 64;
const SCALE = 1.25;      // map px per sprite px
const HOP_SPEED = 95;    // cm/s while hopping
const HOP_FPS = 10;
const PX_PER_CM = 0.8;   // how tall a monster of `size` cm stands on screen (the player: 128 px)
const BLANK = document.createElement("canvas"); // a person has no staff gem to light

// level, hp, atk, def, mdef and xp feed stats.js; aggro: radius (cm) in which it attacks first
const BOOK_DROPS: [string, number][] = [["book_survivor", 0.015], ["book_gathering", 0.015], ["book_lightning", 0.015]];
export const VARIANTS: Variant[] = [
  { id: "green", name: "สไลม์เขียว", hue: 0, level: 1, hp: 60, atk: 8, def: 2, mdef: 2, xp: 8, aggro: 0, weight: 6,
    element: "plant", eleDef: { plant: 30, mud: 20, water: 10 },
    drops: [["jelly", 0.9], ["sprout", 0.08], ["top_mint", 0.03], ["bottom_forest", 0.03], ["top_priestess_forest", 0.02], ["bottom_priestess_forest", 0.02], ...BOOK_DROPS] },
  { id: "pink", name: "สไลม์ชมพู", hue: 185, level: 3, hp: 110, atk: 13, def: 5, mdef: 4, xp: 15, aggro: 0, weight: 4,
    eleDef: { light: 20, wind: 20, plant: 10 },
    drops: [["jelly", 1], ["top_rose", 0.05], ["bottom_wine", 0.05], ["top_priestess_wine", 0.03], ["bottom_priestess_wine", 0.03], ["bottom_adventurer_wine", 0.03], ...BOOK_DROPS] },
  { id: "blue", name: "สไลม์ฟ้า", hue: 70, level: 5, hp: 170, atk: 18, def: 8, mdef: 10, xp: 24, aggro: 0, weight: 3,
    element: "ice", eleDef: { ice: 35, water: 30 },
    drops: [["jelly", 1], ["jelly", 0.5], ["top_sky", 0.06], ["bottom_navy", 0.06], ["top_adventurer_navy", 0.03], ["bottom_adventurer_sand", 0.03], ["top_warrior_navy", 0.03], ...BOOK_DROPS] },
  { id: "violet", name: "สไลม์ม่วง", hue: 125, level: 9, hp: 320, atk: 28, def: 12, mdef: 12, xp: 48, aggro: 260, weight: 1,
    element: "dark", eleDef: { dark: 40, metal: 15, stone: 10 },
    drops: [["sprout", 0.6], ["top_lilac", 0.12], ["bottom_cocoa", 0.12], ["jelly", 1], ["top_priestess_black", 0.06], ["bottom_priestess_black", 0.06],
      ["top_adventurer_plum", 0.06], ["bottom_adventurer_black", 0.06], ["top_adventurer_ochre", 0.04], ["top_warrior_forest", 0.04], ["bottom_warrior_black", 0.04],
      ["book_survivor", 0.08], ["book_gathering", 0.08], ["book_lightning", 0.08]] },
];
const BITE_REACH = 95;   // cm between centres
const BITE_TIME = 1.6;   // s between bites
const CHASE_LEASH = 900; // gives up past this far from home
const ANGER = 12;        // s it stays angry after being hit
const RARE_SPOTS = 2;
const RANGE = 480;       // cm a shooter shoots from
const SHOT_SPEED = 560;  // cm/s
const STEP_UP = 30;      // cm the ground may rise or fall over a 20 cm step (more: a cliff)

// How often each kind turns up on its field (a rare one: on RARE_SPOTS spots, a boss on one),
// how fast it walks (cm/s) and how long it stays gone after it falls (s).
const KINDS: Record<MonsterKind, { weight: number; speed: number; respawn: number }> = {
  normal: { weight: 4, speed: 120, respawn: 9 },
  tank: { weight: 3, speed: 90, respawn: 12 },
  fast: { weight: 3, speed: 170, respawn: 9 },
  caster: { weight: 2.5, speed: 105, respawn: 10 },
  rare: { weight: 0, speed: 130, respawn: 120 },
  boss: { weight: 0, speed: 120, respawn: 3600 },
};

// Spawn spots on open ground (world cm), clear of the house, well and hedges.
const SPAWNS: Vec2[] = [
  { x: 700, y: 350 }, { x: 600, y: -300 }, { x: 1300, y: -250 }, { x: 1450, y: 400 },
  { x: 1500, y: 1050 }, { x: 800, y: 1300 }, { x: 350, y: 750 }, { x: 2400, y: -400 },
];
const LEASH = 260;

// World vector -> facing (south, west, north, east as seen from the yaw-0 camera); the sheet
// row on screen adds the camera yaw.
function row4(dx: number, dy: number): number {
  const a = Math.atan2(dy, -dx); // 0 = towards the camera, +90 = screen left
  return ((Math.round(a / (Math.PI / 2)) % 4) + 4) % 4;
}

function clip(img: Img, frames: number, at = 0, copies?: Pick<Clip, "flash" | "ice" | "stone">): Clip {
  return { img, ...(copies ?? { flash: silhouette(img), ice: silhouette(img, "#9fd8ff"), stone: silhouette(img, "#9b958b") }), frames, at };
}

// Load-time: a look per slime colour, each with its white flash copies.
export function slimeSheets(images: Record<"idle" | "hop" | "hurt" | "die", Img>): Record<string, Look> {
  const out: Record<string, Look> = {};
  for (const v of VARIANTS) {
    const c = {} as Record<"idle" | "hop" | "hurt" | "die", Clip>;
    for (const name of ["idle", "hop", "hurt", "die"] as const) {
      const img = v.hue ? hueShift(images[name], v.hue, 1.1) : images[name];
      c[name] = clip(img, img.width / CELL);
    }
    out[v.id] = {
      cell: CELL, scale: SCALE, foot: 0, top: CELL * 0.82, fps: HOP_FPS, attackFps: HOP_FPS * 2, strike: 0.3, swing: 0.55,
      hurtT: c.hurt.frames / HOP_FPS, dieT: c.die.frames / HOP_FPS + 0.2, hop: true,
      idle: c.idle, move: c.hop, attack: c.hop, hurt: c.hurt, die: c.die,
    };
  }
  return out;
}

// What public/assets/monsters/index.json says of each sheet: its cell, where its feet are and
// how tall it stands in it (px), its walk and attack frames.
interface SheetMeta {
  cell: number;
  foot: number;
  top: number;
  walk: number;
  attack: number;
}

// A monster's own sheet: columns standing, walk, attack; scaled so it stands `size` cm tall.
function spriteLook(img: Img, m: SheetMeta, size: number): Look {
  const copies = { flash: silhouette(img), ice: silhouette(img, "#9fd8ff"), stone: silhouette(img, "#9b958b") };
  const idle = clip(img, 1, 0, copies);
  return {
    cell: m.cell, scale: (size * PX_PER_CM) / m.top, foot: m.foot, top: m.top, fps: 8, attackFps: 10, strike: 0.22, swing: 0.45,
    hurtT: 0.3, dieT: 1.1, hop: false,
    idle, move: clip(img, m.walk, 1, copies), attack: clip(img, m.attack, 1 + m.walk, copies), hurt: idle, die: idle,
  };
}

// A person's sheets from the wardrobe (8 directions: idle, walk and its attack motion) and the
// weapon it holds.
export interface Person {
  sheets: Record<string, Img>;
  hands?: Hands;
  builtin: Record<string, boolean>;
  weapon: { img: Img; art: WeaponArt } | null;
  motion: string;
}

// A person's timing and size (it stands as tall as the player: 128 px).
function personLook(p: Person): Look {
  const img = p.sheets.idle, cell = img.height / 8, idle = clip(img, 1);
  return {
    cell, scale: 128 / (cell * 0.92), foot: 0, top: cell * 0.92, fps: 8, attackFps: 10, strike: 0.25, swing: 0.5,
    hurtT: 0.3, dieT: 1.1, hop: false, idle, move: idle, attack: idle, hurt: idle, die: idle,
  };
}

// Which slime stands in for a monster of each element until its own sheet is drawn.
const STAND_IN: Partial<Record<ElementId, string>> = {
  plant: "green", earth: "green", wind: "green", mud: "green",
  water: "blue", ice: "blue", lightning: "blue", light: "blue",
  dark: "violet", metal: "violet", stone: "violet",
};

// Every monster's look: the slimes', and the bestiary's sheets loaded a field at a time.
export class MonsterLooks {
  private meta: Promise<Record<string, SheetMeta>> | null = null;
  private sheets = new Map<string, Look>();
  private standIns = new Map<string, Look>();
  private people = new Map<string, { person: Person; look: Look }>();

  // dress: a person's sheets, built from its look in PEOPLE (src/bestiary.ts)
  constructor(readonly slimes: Record<string, Look>, private dress?: (d: MonsterDef) => Promise<Person | null>) {}

  // Load these monsters' sheets (those drawn so far; the rest stand in as slimes) and dress the
  // people among them.
  async prepare(defs: MonsterDef[]): Promise<void> {
    this.meta ??= fetch("assets/monsters/index.json").then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    await Promise.all(defs.filter((d) => PEOPLE[d.id] && this.dress && !this.people.has(d.id)).map(async (d) => {
      try {
        const person = await this.dress!(d);
        if (person) this.people.set(d.id, { person, look: personLook(person) });
      } catch (err) {
        console.warn(err);
      }
    }));
    const meta = await this.meta;
    await Promise.all(defs.filter((d) => meta[d.id] && !this.sheets.has(d.id)).map(async (d) => {
      try {
        this.sheets.set(d.id, spriteLook(await loadImage(`assets/monsters/${d.id}.png`), meta[d.id], d.size));
      } catch (err) {
        console.warn(err);
      }
    }));
  }

  person(v: Variant): Person | null {
    return (v.entry && this.people.get(v.entry.id)?.person) ?? null;
  }

  of(v: Variant): Look {
    const d = v.entry;
    if (!d) return this.slimes[v.id];
    const own = this.sheets.get(d.id) ?? this.people.get(d.id)?.look;
    if (own) return own;
    let s = this.standIns.get(d.id);
    if (!s) {
      const slime = this.slimes[(d.element && STAND_IN[d.element]) ?? "pink"];
      s = { ...slime, scale: SCALE * Math.min(4, Math.max(0.8, (d.size * PX_PER_CM) / (slime.top * SCALE))) };
      this.standIns.set(d.id, s);
    }
    return s;
  }
}

type State = "idle" | "hop" | "hurt" | "die" | "gone" | "bite";
type Blow = "bite" | "shot" | "slam";

// Status badges: when each shows, its glyph and colour.
const STATUS: [(m: Monster) => boolean, string, string][] = [
  [(m) => m.burns.some((b) => b.poison), "drop", "#6fcf5a"],
  [(m) => m.slow > 0, "swirl", "#6fb4ff"],
  [(m) => m.chill > 0, "freeze", "#bfe8ff"],
  [(m) => m.weak > 0, "down", "#b58aff"],
  [(m) => m.expose > 0, "target", "#ff7a5a"],
  [(m) => m.blind > 0, "eye", "#7d7690"],
];

export class Monster {
  variant: Variant;
  home: Vec2;
  look: Look;
  entry: MonsterDef | null;
  radius = 30;
  height = 70;
  speed = HOP_SPEED;
  x = 0;
  y = 0;
  hp = 0;
  maxHp = 0;
  level = 1;
  atk = 0;
  def = 0;
  mdef = 0;
  accuracy = 0;
  flee = 0;
  crit = 0;
  element: ElementId | undefined = undefined;
  eleAtk = 0;   // its attack in its bite's element
  eleDef: Partial<Record<ElementId, number>> = {};
  angry = 0;   // s left chasing the player
  biteCd = 0;
  stun = 0;
  freeze = 0;
  slow = 0;
  slowPct = 0;   // how much slower it moves while slowed
  chill = 0;     // s left biting chillPct slower (ice)
  chillPct = 0;
  petrify = 0;   // s left turned to stone (stone)
  burns: { dps: number; t: number; poison?: boolean }[] = []; // fire and poison, ticked by combat.ts
  weak = 0;      // s left dealing weakPct less damage
  weakPct = 0;
  expose = 0;    // s left taking exposePct more damage
  exposePct = 0;
  blind = 0;     // s left missing half its bites
  alive = true;
  state: State = "idle";
  t = 0;
  age = 0;     // s since it came (for floating and breathing)
  wait = 0;
  goal: Vec2 | null = null;
  row = 0;     // facing, see row4
  dir8 = 0;    // and as one of 8 (a person), see directionIndex
  walked = 0;  // cm walked (a person's steps)
  vx = 0;
  vy = 0;
  flash = 0;
  respawn = 0;
  respawnT = 9;
  spawnFade = 0;
  bitten = false;
  blow: Blow = "bite";
  boost = 1;     // how much harder the blow now landing hits
  // its ways of fighting (src/bestiary.ts)
  fly = false;
  ranged: string | null = null;
  charges = false;
  slams = false;
  heals = false;
  flees = false;
  explodes = false;
  summons: string | null = null;
  reflect = 0;   // share of the damage it takes that goes back at the attacker
  ails: string[] = []; // what its bite may leave: slow, burn, petrify
  steals = false;
  packs = false;
  kin: Monster[] | null = null; // the others on its field (its pack comes when it's hit)
  temp = false;  // called up by a boss: doesn't come back
  rush = 0;      // s left charging
  chargeCd = 0;
  slamCd = 0;
  healCd = 0;
  fleeT = 0;     // s left running off
  fled = false;
  called = 0;    // how many calls for help so far
  burst = false;
  person: Person | null;
  body: Player | null = null; // a person is drawn as the player is

  constructor(variant: Variant, home: Vec2, look: Look, person: Person | null = null) {
    this.variant = variant;
    this.home = home;
    this.look = look;
    this.person = person;
    if (person) {
      this.body = new Player(home.x, home.y, person.sheets, person.hands, BLANK);
      this.body.setSheets(person.sheets, person.hands, person.builtin);
    }
    const d = (this.entry = variant.entry ?? null);
    if (d) {
      const has = (b: string) => behaviour(d, b) !== null;
      this.radius = Math.min(110, Math.max(24, d.size * 0.3));
      this.height = d.size;
      this.speed = KINDS[d.kind].speed * (has("slowwalk") ? 0.55 : 1);
      this.respawnT = KINDS[d.kind].respawn;
      this.fly = has("fly");
      this.ranged = behaviour(d, "ranged");
      this.charges = has("charge");
      this.slams = has("slam");
      this.heals = has("heal");
      this.flees = has("flee");
      this.explodes = has("explode");
      this.summons = behaviour(d, "summon");
      this.reflect = has("reflect") ? 0.15 : 0;
      this.ails = ["slow", "burn", "petrify"].filter(has);
      this.steals = has("steal");
      this.packs = has("pack");
    }
    this.spawn();
  }

  // Turn to face along a world vector.
  face(dx: number, dy: number): void {
    this.row = row4(dx, dy);
    this.dir8 = directionIndex(dx, dy);
  }

  get reach(): number {
    return Math.max(BITE_REACH, this.radius + 65);
  }

  get boss(): boolean {
    return this.entry?.kind === "boss";
  }

  spawn(): void {
    // a spot by its home on the same level as home (not up on a ledge beside it)
    const h0 = heightAt(this.home.x, this.home.y);
    let p = { x: this.home.x, y: this.home.y };
    for (let i = 0; i < 6; i++) {
      const q = { x: this.home.x + rand(-120, 120), y: this.home.y + rand(-120, 120) };
      resolve(q, this.radius);
      if (Math.abs(heightAt(q.x, q.y) - h0) < STEP_UP) {
        p = q;
        break;
      }
    }
    this.x = p.x;
    this.y = p.y;
    this.hp = this.variant.hp;
    this.maxHp = this.variant.hp;
    this.level = this.variant.level;
    this.atk = this.variant.atk;
    this.def = this.variant.def;
    this.mdef = this.variant.mdef;
    this.accuracy = this.variant.accuracy ?? 10 + 1.4 * this.level;
    this.flee = this.variant.flee ?? 2 + 1.5 * this.level;
    this.crit = this.variant.crit ?? 0.03 + 0.0002 * this.level;
    this.element = this.variant.element;
    this.eleAtk = 10 + this.level;
    this.eleDef = this.variant.eleDef ?? {};
    this.angry = 0;
    this.biteCd = 0;
    this.stun = 0;
    this.freeze = 0;
    this.slow = this.slowPct = this.chill = this.chillPct = this.petrify = 0;
    this.burns = [];
    this.weak = this.weakPct = this.expose = this.exposePct = this.blind = 0;
    this.alive = true;
    this.state = "idle";
    this.t = 0;
    this.age = rand(0, 10);
    this.wait = rand(0.5, 2.5);
    this.goal = null;
    this.face(Math.cos(rand(0, 6.3)), Math.sin(rand(0, 6.3)));
    this.vx = this.vy = 0;
    this.flash = 0;
    this.respawn = 0;
    this.spawnFade = 0.6;
    this.rush = this.chargeCd = this.slamCd = this.healCd = this.fleeT = 0;
    this.fled = this.burst = false;
    this.called = 0;
    this.boost = 1;
  }

  // Returns true when this hit defeats it.
  hit(damage: number, dir: Vec2, knock: number): boolean {
    if (!this.alive) return false;
    this.hp -= damage;
    this.flash = 0.12;
    this.anger();
    // pushed (only some skills push): the big ones barely budge; a blow that doesn't push
    // leaves a push already sliding it alone
    if (knock > 0) {
      const heavy = Math.min(1, 40 / this.radius);
      this.vx = dir.x * knock * 6 * heavy;
      this.vy = dir.y * knock * 6 * heavy;
    }
    this.face(-dir.x, -dir.y); // turn to face the attacker
    if (this.hp <= 0) {
      this.alive = false;
      this.state = "die";
      this.t = 0;
      return true;
    }
    // bosses don't flinch
    if (this.state !== "bite" && !this.boss) {
      this.state = "hurt";
      this.t = 0;
    }
    return false;
  }

  // Angered: and its pack with it.
  anger(): void {
    this.angry = ANGER;
    if (!this.packs || !this.kin) return;
    for (const o of this.kin)
      if (o !== this && o.alive && o.entry === this.entry && Math.hypot(o.x - this.x, o.y - this.y) < 700) o.angry = Math.max(o.angry, ANGER);
  }

  // Attacked but missed: no harm, but it turns on the attacker all the same.
  provoke(dir: Vec2): void {
    if (!this.alive) return;
    this.anger();
    this.face(-dir.x, -dir.y);
  }

  get held(): boolean {
    return this.stun > 0 || this.freeze > 0 || this.petrify > 0;
  }

  // Its blow after weakening.
  get power(): number {
    return this.atk * this.boost * (this.weak > 0 ? 1 - this.weakPct : 1);
  }

  // Under any status (for the hunter's bonus).
  get afflicted(): boolean {
    return this.held || this.slow > 0 || this.chill > 0 || this.weak > 0 || this.expose > 0 || this.blind > 0 || this.burns.some((b) => b.poison);
  }

  // Weaken or expose for t s: the stronger one wins while one is on.
  weaken(t: number, pct: number): void {
    this.weakPct = this.weak > 0 ? Math.max(this.weakPct, pct) : pct;
    this.weak = Math.max(this.weak, t);
  }

  // Slow it for t s (pct slower), chill it (bites pct slower): the stronger one wins while on.
  slowFor(t: number, pct: number): void {
    this.slowPct = this.slow > 0 ? Math.max(this.slowPct, pct) : pct;
    this.slow = Math.max(this.slow, t);
  }

  chillFor(t: number, pct: number): void {
    this.chillPct = this.chill > 0 ? Math.max(this.chillPct, pct) : pct;
    this.chill = Math.max(this.chill, t);
  }

  exposeTo(t: number, pct: number): void {
    this.exposePct = this.expose > 0 ? Math.max(this.exposePct, pct) : pct;
    this.expose = Math.max(this.expose, t);
  }

  // A blow lands on the player, `boost` times as hard.
  land(ctx: MonsterCtx, boost = 1): void {
    this.boost = boost;
    ctx.bite(this);
    this.boost = 1;
  }

  private begin(blow: Blow, pl: Vec2): void {
    this.state = "bite";
    this.blow = blow;
    this.t = 0;
    this.bitten = false;
    this.face(pl.x - this.x, pl.y - this.y);
  }

  update(dt: number, ctx: MonsterCtx): void {
    this.t += dt;
    this.age += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.freeze = Math.max(0, this.freeze - dt);
    this.slow = Math.max(0, this.slow - dt);
    this.chill = Math.max(0, this.chill - dt);
    this.petrify = Math.max(0, this.petrify - dt);
    this.weak = Math.max(0, this.weak - dt);
    this.expose = Math.max(0, this.expose - dt);
    this.blind = Math.max(0, this.blind - dt);
    this.biteCd = Math.max(0, this.biteCd - dt);
    this.angry = Math.max(0, this.angry - dt);
    this.chargeCd = Math.max(0, this.chargeCd - dt);
    this.slamCd = Math.max(0, this.slamCd - dt);
    this.healCd = Math.max(0, this.healCd - dt);
    this.fleeT = Math.max(0, this.fleeT - dt);
    this.rush = Math.max(0, this.rush - dt);
    const pl = ctx.player, alive = ctx.hero.alive;
    const toPlayer = Math.hypot(pl.x - this.x, pl.y - this.y);
    if (!this.alive) {
      // some burst as they fall
      if (this.state === "die" && this.explodes && !this.burst && this.t >= 0.2) {
        this.burst = true;
        shots.push({ x: this.x, y: this.y, z: 0, vx: 0, vy: 0, left: 0.45, t: 0, kind: "burst", owner: this, ring: this.radius + 170 });
        if (alive && toPlayer < this.radius + 170) this.land(ctx, 1.5);
      }
      this.slide(dt);
      this.step(dt);
      return;
    }
    if (this.held) {
      // frozen or stunned: only knockback still slides it
      this.slide(dt);
      this.rush = 0;
      if (this.state === "hop" || this.state === "bite") {
        this.state = "idle";
        this.wait = 0.2;
      }
      return;
    }
    const fromHome = Math.hypot(this.x - this.home.x, this.y - this.home.y);
    if (alive && this.variant.aggro && toPlayer < this.variant.aggro) this.angry = Math.max(this.angry, 2);
    if (!alive || fromHome > CHASE_LEASH + this.radius * 2) this.angry = this.rush = 0;
    // hurt: heal up, call for help, run off
    if (this.heals && this.healCd <= 0 && this.hp < this.maxHp * 0.45) {
      const n = Math.round(this.maxHp * 0.3);
      this.hp = Math.min(this.maxHp, this.hp + n);
      this.healCd = 12;
      ctx.note?.(this, `+${n}`);
    }
    const calls = [0.7, 0.35];
    while (this.summons && ctx.summon && this.called < calls.length && this.hp < this.maxHp * calls[this.called]) {
      this.called++;
      ctx.summon(this, this.summons, 2);
    }
    if (this.flees && !this.fled && this.hp < this.maxHp * 0.2) {
      this.fled = true;
      this.fleeT = 3;
    }
    const free = this.state === "idle" || this.state === "hop";
    if (free && this.fleeT > 0) {
      const d = toPlayer || 1;
      this.goal = { x: this.x - ((pl.x - this.x) / d) * 300, y: this.y - ((pl.y - this.y) / d) * 300 };
      this.rush = 0;
      this.go();
    } else if (free && this.angry > 0) {
      const reach = this.reach;
      if (this.rush > 0) {
        // charging: straight at the player, the blow lands harder
        if (toPlayer < reach) {
          this.rush = 0;
          this.begin("bite", pl);
          this.boost = 1.5;
        } else {
          this.goal = { x: pl.x, y: pl.y };
          this.go();
        }
      } else if (this.slams && this.slamCd <= 0 && toPlayer < this.radius + 160) {
        this.begin("slam", pl);
      } else if (toPlayer < reach && this.biteCd <= 0) {
        this.begin("bite", pl);
      } else if (this.ranged && toPlayer < RANGE && this.biteCd <= 0) {
        this.begin("shot", pl);
      } else if (this.charges && this.chargeCd <= 0 && toPlayer > 300 && toPlayer < 800) {
        this.rush = 1.4;
        this.chargeCd = 9;
        this.goal = { x: pl.x, y: pl.y };
        this.go();
      } else if (this.ranged && toPlayer < RANGE * 0.85 && toPlayer > reach) {
        // a shooter keeps its distance
        this.face(pl.x - this.x, pl.y - this.y);
        if (this.state === "hop") {
          this.state = "idle";
          this.wait = 0.3;
        }
      } else if (toPlayer >= reach * 0.8) {
        this.goal = { x: pl.x, y: pl.y };
        this.go();
      } else if (this.state === "hop") {
        this.state = "idle";
        this.wait = 0.3;
      }
    }
    if (this.state === "bite") this.swing(dt, ctx, toPlayer);
    this.slide(dt);
    this.step(dt);
  }

  private go(): void {
    if (this.state !== "hop") {
      this.state = "hop";
      this.t = 0;
    }
  }

  // Its attack under way: the slimes lunge; the blow lands partway through.
  private swing(dt: number, ctx: MonsterCtx, toPlayer: number): void {
    const L = this.look, pl = ctx.player;
    if (L.hop && this.blow === "bite" && this.t < 0.3 && toPlayer > 60) {
      const d = toPlayer || 1;
      this.moveBy(((pl.x - this.x) / d) * 160 * dt, ((pl.y - this.y) / d) * 160 * dt);
    }
    if (!this.bitten && this.t >= L.strike) {
      this.bitten = true;
      const alive = ctx.hero.alive;
      if (this.blow === "bite") {
        if (toPlayer < this.reach + 30 && alive) this.land(ctx, this.boost);
      } else if (this.blow === "shot") {
        const d = toPlayer || 1, dx = (pl.x - this.x) / d, dy = (pl.y - this.y) / d;
        shots.push({ x: this.x + dx * this.radius, y: this.y + dy * this.radius, z: this.height * 0.55 + (this.fly ? 50 : 0),
          vx: dx * SHOT_SPEED, vy: dy * SHOT_SPEED, left: (d + 120) / SHOT_SPEED, t: 0, kind: this.ranged ?? "rock", owner: this });
      } else {
        shots.push({ x: this.x, y: this.y, z: 0, vx: 0, vy: 0, left: 0.45, t: 0, kind: "slam", owner: this, ring: this.radius + 180 });
        if (toPlayer < this.radius + 180 && alive) this.land(ctx, 1.4);
        this.slamCd = 7;
      }
      this.boost = 1;
    }
    if (this.t >= L.swing) {
      this.state = "idle";
      this.wait = 0.15;
      this.biteCd = (BITE_TIME * (this.blow === "shot" ? 1.4 : 1)) / (this.chill > 0 ? 1 - this.chillPct : 1);
    }
  }

  // Move by (dx, dy) in short steps, each pushed out of the solids, and never onto ground much
  // higher or lower than where it stands (a cliff: up on a ledge or down off one; a ramp rises
  // gently and is fine). Returns false when it was stopped short.
  moveBy(dx: number, dy: number): boolean {
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 20));
    for (let i = 0; i < n; i++) {
      const p = { x: this.x + dx / n, y: this.y + dy / n };
      resolve(p, this.radius);
      if (Math.abs(heightAt(p.x, p.y) - heightAt(this.x, this.y)) > STEP_UP * Math.max(1, Math.hypot(p.x - this.x, p.y - this.y) / 20)) return false;
      this.x = p.x;
      this.y = p.y;
    }
    return true;
  }

  // knockback slides and decays
  slide(dt: number): void {
    this.spawnFade = Math.max(0, this.spawnFade - dt);
    if (this.vx || this.vy) {
      if (!this.moveBy(this.vx * dt, this.vy * dt)) this.vx = this.vy = 0; // knocked against a cliff: it stops
      const decay = Math.exp(-dt * 9);
      this.vx *= decay;
      this.vy *= decay;
      if (Math.hypot(this.vx, this.vy) < 4) this.vx = this.vy = 0;
    }
  }

  step(dt: number): void {
    const L = this.look;
    switch (this.state) {
      case "gone":
        this.respawn -= dt;
        if (this.respawn <= 0) this.spawn();
        break;
      case "die":
        if (this.t >= L.dieT) {
          this.state = "gone";
          this.respawn = this.temp ? Infinity : this.respawnT;
        }
        break;
      case "hurt":
        if (this.t >= L.hurtT) {
          this.state = "idle";
          this.t = 0;
          this.wait = rand(0.2, 0.8);
        }
        break;
      case "idle":
        this.wait -= dt;
        if (this.wait <= 0 && this.angry <= 0) {
          // calm again: wander, healing up if it was hurt
          this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.25);
          const a = rand(0, Math.PI * 2), r = rand(60, LEASH + this.radius * 2);
          this.goal = { x: this.home.x + Math.cos(a) * r, y: this.home.y + Math.sin(a) * r };
          this.state = "hop";
          this.t = 0;
        }
        break;
      case "hop": {
        const goal = this.goal ?? this.home;
        const dx = goal.x - this.x, dy = goal.y - this.y, d = Math.hypot(dx, dy);
        if ((d < 12 || this.t > 6) && this.angry <= 0 && this.fleeT <= 0) {
          this.state = "idle";
          this.wait = rand(1, 3.5);
          break;
        }
        if (d < 12) break;
        this.face(dx, dy);
        const slowed = this.slow > 0 ? 1 - this.slowPct : 1;
        let v: number;
        if (L.hop) {
          // only move while airborne: the middle of each hop cycle
          const phase = ((this.t * L.fps) % L.move.frames) / L.move.frames;
          if (phase <= 0.25 || phase >= 0.75) break;
          v = HOP_SPEED * 2 * slowed * (this.angry > 0 ? 1.25 : 1);
        } else {
          v = this.speed * slowed * (this.rush > 0 ? 2.6 : this.fleeT > 0 ? 1.2 : this.angry > 0 ? 1.3 : 1);
        }
        const was = { x: this.x, y: this.y };
        if (!this.moveBy((dx / d) * v * dt, (dy / d) * v * dt)) {
          // a cliff in the way: give up this walk (a chase picks a new line next frame)
          this.rush = 0;
          if (this.angry <= 0) {
            this.state = "idle";
            this.wait = rand(0.5, 1.5);
          }
        }
        this.walked += Math.hypot(this.x - was.x, this.y - was.y);
        break;
      }
    }
  }

  get depth(): number {
    return mapY(this.x, this.y);
  }

  frame(): { clip: Clip; col: number } {
    const L = this.look;
    switch (this.state) {
      case "hop": return { clip: L.move, col: Math.floor(this.t * L.fps * (this.rush > 0 ? 1.8 : 1)) % L.move.frames };
      case "bite": return { clip: L.attack, col: Math.min(L.attack.frames - 1, Math.floor(this.t * L.attackFps)) };
      case "hurt": return { clip: L.hurt, col: Math.min(L.hurt.frames - 1, Math.floor(this.t * L.fps)) };
      case "die": return { clip: L.die, col: Math.min(L.die.frames - 1, Math.floor(this.t * L.fps)) };
      default: return { clip: L.idle, col: 0 };
    }
  }

  // How high it floats (map px).
  private lift(): number {
    return this.fly ? 40 + Math.sin(this.age * 2.6) * 7 : 0;
  }

  // The billboard it is drawn into (map px): room for its sheet, the HP bar and badges.
  get board(): { w: number; h: number; foot: number } {
    const L = this.look;
    return {
      w: Math.max(210, L.cell * L.scale * 1.3),
      h: Math.max(170, (L.cell - L.foot) * L.scale + (this.fly ? 130 : 80)),
      foot: Math.max(30, L.foot * L.scale + 12),
    };
  }

  draw(ctx: CanvasRenderingContext2D, view: View): void {
    if (this.state === "gone") return;
    const { k, ox, oy } = view, L = this.look;
    const gx = mapX(this.x, this.y) * k + ox, gy = mapY(this.x, this.y) * k + oy;
    const fade = this.state === "die" ? Math.max(0, 1 - Math.max(0, this.t - L.dieT * 0.45) / (L.dieT * 0.55)) : 1 - this.spawnFade / 0.6;
    if (this.body && this.person) {
      this.drawPerson(ctx, view, this.body, this.person, fade);
      this.drawOver(ctx, gx, gy - L.top * L.scale * k - 8 * k, k);
      return;
    }
    ctx.globalAlpha = fade;
    ctx.fillStyle = "rgba(16, 30, 10, 0.3)";
    const sw = Math.max(26, this.radius * 0.85) * k * (this.fly ? 0.8 : 1);
    ctx.beginPath();
    ctx.ellipse(gx, gy, sw, sw * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    const { clip, col } = this.frame();
    const s = L.scale * k, c = L.cell, lift = this.lift() * k;
    // walkers breathe while they stand and shake when hit
    const breathe = !L.hop && this.state === "idle" ? 1 + 0.018 * Math.sin(this.age * 2.4) : 1;
    const shake = !L.hop && this.state === "hurt" ? Math.sin(this.t * 70) * 3 * k * (1 - this.t / L.hurtT) : 0;
    const sx = (clip.at + col) * c, sy = ((this.row + Math.round(yaw / (Math.PI / 2))) % 4) * c;
    const dw = c * s, dh = c * s * breathe;
    const dx = gx - dw / 2 + shake, dy = gy - (c - L.foot) * s * breathe - lift;
    ctx.drawImage(clip.img, sx, sy, c, c, dx, dy, dw, dh);
    if (this.flash > 0) {
      ctx.globalAlpha = fade * Math.min(1, this.flash / 0.08) * 0.85;
      ctx.drawImage(clip.flash, sx, sy, c, c, dx, dy, dw, dh);
    }
    if ((this.freeze > 0 || this.petrify > 0) && this.alive) {
      ctx.globalAlpha = fade * (this.petrify > 0 ? 0.8 : 0.55);
      ctx.drawImage(this.petrify > 0 ? clip.stone : clip.ice, sx, sy, c, c, dx, dy, dw, dh);
    }
    ctx.globalAlpha = 1;
    this.drawOver(ctx, gx, gy - L.top * s - lift - 8 * k, k);
  }

  // Stars, HP bar and badges over its head (top: where its head ends on the canvas).
  private drawOver(ctx: CanvasRenderingContext2D, gx: number, top: number, k: number): void {
    if (this.stun > 0 && this.alive) this.drawStars(ctx, gx, top - 6 * k, k);
    if (this.alive && (this.hp < this.maxHp || this.angry > 0)) this.drawHp(ctx, gx, top, k);
    if (this.alive) this.drawStatus(ctx, gx, top - 18 * k, k);
  }

  // A person: its wardrobe body posed as the player's would be (walking, its attack motion with
  // the weapon in hand), flashing when hit, turning to stone or ice.
  private drawPerson(ctx: CanvasRenderingContext2D, view: View, b: Player, p: Person, fade: number): void {
    b.x = this.x;
    b.y = this.y;
    b.dir = this.dir8;
    b.time = this.age;
    b.walked = this.walked;
    b.moving = this.state === "hop";
    b.hurtFlash = this.flash > 0 ? 0.3 : 0;
    const sheet = p.sheets[p.motion] ?? p.sheets.idle;
    b.attack = this.state === "bite"
      ? { t: this.t, motion: p.motion, dur: this.look.swing, frames: sheet.width / b.cell, hit: true, w: { motion: p.motion, builtin: p.builtin[p.motion] }, aim: directionVector(this.dir8) }
      : null;
    ctx.globalAlpha = fade * (this.freeze > 0 || this.petrify > 0 ? 0.75 : 1);
    b.draw(ctx, view, p.weapon);
    ctx.globalAlpha = 1;
  }

  // A row of small badges over the HP bar: poisoned, slowed, weakened, exposed, blinded.
  drawStatus(ctx: CanvasRenderingContext2D, cx: number, y: number, k: number): void {
    const on = STATUS.filter(([test]) => test(this));
    const size = 15 * k, gap = 2 * k;
    let x = cx - (on.length * (size + gap) - gap) / 2;
    for (const [, glyph, color] of on) {
      ctx.drawImage(icon(glyph, color), x, y - size, size, size);
      x += size + gap;
    }
  }

  drawStars(ctx: CanvasRenderingContext2D, cx: number, y: number, k: number): void {
    ctx.fillStyle = "#ffe27a";
    for (let i = 0; i < 3; i++) {
      const a = this.t * 5 + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 16 * k, y + Math.sin(a) * 5 * k, 3.2 * k, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawHp(ctx: CanvasRenderingContext2D, cx: number, y: number, k: number): void {
    const w = (this.boss ? 110 : 52) * k, h = (this.boss ? 8 : 6) * k;
    ctx.fillStyle = "rgba(10, 12, 8, 0.8)";
    ctx.fillRect(cx - w / 2 - k, y - k, w + 2 * k, h + 2 * k);
    ctx.fillStyle = "#4b1c18";
    ctx.fillRect(cx - w / 2, y, w, h);
    ctx.fillStyle = this.angry > 0 ? "#ff6a5a" : "#e0a090";
    ctx.fillRect(cx - w / 2, y, (w * Math.max(0, this.hp)) / this.maxHp, h);
    ctx.font = `600 ${11 * k}px Kanit, system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.lineWidth = 3 * k;
    ctx.strokeStyle = "rgba(10, 12, 8, 0.85)";
    // rare ones and bosses show their level in gold
    ctx.fillStyle = this.boss || this.entry?.kind === "rare" ? "#ffd27a" : "#fff6d8";
    ctx.strokeText(`Lv ${this.level}`, cx - w / 2 - 4 * k, y + h);
    ctx.fillText(`Lv ${this.level}`, cx - w / 2 - 4 * k, y + h);
    ctx.textAlign = "start";
  }

  // Screen-space pick test for clicks (map px): an oval over its body.
  contains(mx: number, my: number): boolean {
    if (!this.alive) return false;
    const H = this.look.top * this.look.scale, rx = Math.max(52, H * 0.42), ry = Math.max(40, H * 0.55);
    const gx = mapX(this.x, this.y), gy = mapY(this.x, this.y) - H * 0.45 - this.lift();
    return Math.hypot((mx - gx) / rx, (my - gy) / ry) < 1;
  }
}

// What monsters throw, in flight, and the rings of their slams and bursts.
export interface Shot {
  x: number;
  y: number;
  z: number;     // cm above the ground
  vx: number;
  vy: number;
  left: number;  // s until it's spent
  t: number;
  kind: string;  // what it is (ranged:<kind>), or "slam" / "burst"
  owner: Monster;
  ring?: number; // a ring: how wide it grows (cm)
}
export const shots: Shot[] = [];

const SHOT_COLOR: Record<string, string> = {
  water: "#5ab4ff", snow: "#f2f8ff", frost: "#9fe0ff", fire: "#ff8a2a", rock: "#a08c6c", arrow: "#e8d8b0",
  musket: "#ffe9a0", cannon: "#3a3530", shuriken: "#d8dce4", foxfire: "#7ad8ff", curse: "#b070ff",
  tongue: "#ff7aa0", vine: "#6fcf5a", slam: "#d8c8a0", burst: "#ffb05a",
};

// Move the shots on; one that comes within reach of the player hits.
export function updateShots(dt: number, ctx: MonsterCtx): void {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.t += dt;
    s.left -= dt;
    if (!s.ring) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (ctx.hero.alive && Math.hypot(ctx.player.x - s.x, ctx.player.y - s.y) < 55) {
        s.owner.land(ctx);
        s.left = 0;
      }
    }
    if (s.left <= 0) shots.splice(i, 1);
  }
}

export function drawShots(ctx: CanvasRenderingContext2D, view: View): void {
  const { k, ox, oy } = view;
  for (const s of shots) {
    const color = SHOT_COLOR[s.kind] ?? "#ffffff";
    if (s.ring) {
      // a ring on the ground, growing and fading
      const u = Math.min(1, s.t / 0.45), r = s.ring * (0.3 + 0.7 * Math.sqrt(u));
      const gx = mapX(s.x, s.y) * k + ox, gy = mapY(s.x, s.y) * k + oy;
      ctx.globalAlpha = 1 - u;
      ctx.strokeStyle = color;
      ctx.lineWidth = 7 * k * (1 - u * 0.6);
      ctx.beginPath();
      ctx.ellipse(gx, gy, r * k, r * k * Math.SQRT1_2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      continue;
    }
    const gx = mapX(s.x, s.y) * k + ox, gy = mapY(s.x, s.y, s.z) * k + oy;
    if (s.kind === "arrow") {
      const bx = s.x - s.vx * 0.06, by = s.y - s.vy * 0.06;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 * k;
      ctx.beginPath();
      ctx.moveTo(mapX(bx, by) * k + ox, mapY(bx, by, s.z) * k + oy);
      ctx.lineTo(gx, gy);
      ctx.stroke();
      continue;
    }
    // a glowing ball (dark and solid for cannonballs and rocks)
    const r = (s.kind === "cannon" ? 12 : s.kind === "musket" || s.kind === "shuriken" ? 5 : 8) * 2.2 * k;
    const solid = s.kind === "cannon" || s.kind === "rock";
    ctx.globalCompositeOperation = solid ? "source-over" : "lighter";
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
    g.addColorStop(0, solid ? color : "#ffffff");
    g.addColorStop(0.35, color);
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
}

// A bestiary monster at a level: its numbers from its kind (statsFor), its temper, a dodger
// harder to hit.
export function variantOf(def: MonsterDef, level: number): Variant {
  const s = statsFor(level, def.kind);
  return {
    id: def.id, name: def.name, hue: 0, level, ...s,
    element: def.element, eleDef: def.eleDef,
    aggro: def.aggro ? (def.kind === "boss" ? 650 : 320 + def.size * 0.4) : 0,
    flee: behaviour(def, "dodge") !== null ? (2 + 1.5 * level) * 1.6 : undefined,
    weight: KINDS[def.kind].weight, drops: [], entry: def,
  };
}

// A variant grown (or shrunk) to another level: its HP, attack, defences and experience follow
// the level the way a character's do, so a slime of a far field is a fair fight there.
export function atLevel(v: Variant, level: number): Variant {
  const r = (level + 4) / (v.level + 4);
  return {
    ...v, level,
    hp: Math.round(v.hp * r ** 1.6), atk: Math.round(v.atk * r ** 1.1),
    def: Math.round(v.def * r), mdef: Math.round(v.mdef * r), xp: Math.round(v.xp * r ** 1.65),
  };
}

// Where a map's monsters live: spots on open ground, the range of their levels (none: the
// variants' own), its own monsters from the bestiary (none: slimes) and where players come in
// (its boss lives as far from there as it can). The first field (the courtyard) has its own
// spots.
export interface Spawns {
  spots?: Vec2[];
  levels?: [number, number];
  pool?: MonsterDef[];
  spawn?: Vec2;
}

function pickBy<T>(list: T[], weight: (t: T) => number): T {
  let r = rand(0, list.reduce((a, t) => a + weight(t), 0));
  for (const t of list) if ((r -= weight(t)) <= 0) return t;
  return list[0];
}

// One monster per spawn spot (and a green slime beside each on the first field). On a field
// with its own monsters: the boss on the spot farthest from the way in, each rare one on a few
// spots, the rest picked by how common their kind is, at a level in their range, a pack one
// with a second beside it. On a field
// without: slime colours by weight, the weaker colours at the low end of its range and the
// violet at the top.
export function spawnMonsters(looks: MonsterLooks, where: Spawns = {}): Monster[] {
  const list: Monster[] = [];
  const make = (v: Variant, home: Vec2) => list.push(new Monster(v, home, looks.of(v), looks.person(v)));
  const pool = where.pool ?? [];
  const common = pool.filter((d) => KINDS[d.kind].weight > 0);
  if (common.length) {
    const spots = [...(where.spots ?? SPAWNS)];
    const from = where.spawn ?? { x: 0, y: 0 };
    const far = (p: Vec2) => Math.hypot(p.x - from.x, p.y - from.y);
    const at = (d: MonsterDef) => variantOf(d, d.levels[0] + Math.floor(rand(0, d.levels[1] - d.levels[0] + 1)));
    for (const d of pool.filter((b) => b.kind === "boss")) {
      if (!spots.length) break;
      const i = spots.reduce((best, p, j) => (far(p) > far(spots[best]) ? j : best), 0);
      make(at(d), spots.splice(i, 1)[0]);
    }
    for (const d of pool.filter((r) => r.kind === "rare"))
      for (let i = 0; i < RARE_SPOTS && spots.length; i++) make(at(d), spots.splice(Math.floor(rand(0, spots.length)), 1)[0]);
    for (const home of spots) {
      const d = pickBy(common, (m) => KINDS[m.kind].weight);
      make(at(d), home);
      if (behaviour(d, "pack") !== null) make(at(d), { x: home.x + 90, y: home.y - 80 });
    }
    for (const m of list) m.kin = list;
    return list;
  }
  const pick = () => pickBy(VARIANTS, (v) => v.weight);
  const lv = where.levels;
  if (!lv) {
    for (const home of where.spots ?? SPAWNS) {
      make(pick(), home);
      make(VARIANTS[0], { x: home.x + 80, y: home.y - 90 });
    }
    return list;
  }
  const ranked = VARIANTS.length - 1;
  for (const home of where.spots ?? SPAWNS) {
    const v = pick(), at = VARIANTS.indexOf(v) / ranked;
    const level = Math.round(lv[0] + (lv[1] - lv[0]) * Math.min(1, Math.max(0, at * 0.75 + rand(0, 0.25))));
    make(atLevel(v, level), home);
  }
  return list;
}

// Roll a variant's drop table.
export function rollDrops(variant: Variant, bonus = 0): string[] {
  return variant.drops.filter(([, chance]) => Math.random() < chance * (1 + bonus)).map(([id]) => id);
}

export { SOLIDS, BOUNDS };

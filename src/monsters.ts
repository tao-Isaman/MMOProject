// The monsters: they wander round their spot, shake when hit without stopping (a skill made to
// push knocks them back), chase and strike back once angered (some attack on sight, and those
// chase the player as long as they can see her), fall when defeated, drop loot and come back
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
import { sound } from "./audio";
import { mapX, mapY, yaw, heightAt } from "./projection";
import { resolve, SOLIDS, BOUNDS } from "./world";
import { hueShift, silhouette } from "./recolor";
import { loadImage } from "./assets";
import { rand } from "./particles";
import { behaviour, statsFor, monsterMight, PEOPLE } from "./bestiary";
import type { MonsterDef, MonsterKind } from "./bestiary";
import { fieldDrops } from "./drops";
import type { Drop } from "./drops";
import { Player, directionIndex, directionVector } from "./player";
import type { Hands } from "./look";
import type { WeaponArt } from "./weapons";
import type { Img, Vec2, View } from "./types";
import type { Hero } from "./hero";
import { RACE_ICONS } from "./progression";
import type { ElementId, Race } from "./progression";

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
  eleDef?: Partial<Record<ElementId, number>>; // its defence in each element (stats.ts elementBonus)
  xp: number;
  aggro: number;
  weight: number;
  drops: Drop[];      // [item, chance, how many when more than one]
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
  hurtT: number;     // s it shakes when hit
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
  // a bite, shot, slam or burst lands (m.boost: how much harder) on the player, or on `foe`
  bite: (m: Monster, foe?: Vec2 | null) => void;
  note?: (m: Monster, text: string) => void;            // it healed itself
  summon?: (m: Monster, id: string, n: number) => void; // a boss calls for help
  unseen?: () => boolean; // the player hides: no monster goes for it
  // one of the player's allies it goes for instead of her (src/allies.ts), or null
  foe?: (m: Monster) => Foe | null;
}

// One of the player's allies (src/allies.ts), as a monster sees it: a big one (a wall) is
// within reach sooner.
export type Foe = Vec2 & { alive: boolean; radius: number };

// Allies' walls (src/allies.ts): no monster walks through them.
export const walls: { x: number; y: number; r: number }[] = [];

const CELL = 64;
const SCALE = 1.25;      // map px per sprite px
const HOP_SPEED = 95;    // cm/s while hopping
const HOP_FPS = 10;
const PX_PER_CM = 0.8;   // how tall a monster of `size` cm stands on screen (the player: 128 px)
const BLANK = document.createElement("canvas"); // a person has no staff gem to light

// level, hp, atk, def, mdef and xp feed stats.js; aggro: radius (cm) in which it attacks first.
// The slimes round Eden are the first fights: a jelly now and then, books seldom, no clothes.
const BOOK_DROPS: [string, number][] = [["book_survivor", 0.0003], ["book_gathering", 0.0003], ["book_lightning", 0.0003]];
export const VARIANTS: Variant[] = [
  { id: "green", name: "สไลม์เขียว", hue: 0, level: 1, hp: 60, atk: 8, def: 2, mdef: 2, xp: 8, aggro: 0, weight: 6,
    element: "plant", eleDef: { plant: 30, mud: 20, water: 10 },
    drops: [["jelly", 0.4], ["sprout", 0.03], ...BOOK_DROPS] },
  { id: "pink", name: "สไลม์ชมพู", hue: 185, level: 3, hp: 110, atk: 13, def: 5, mdef: 4, xp: 15, aggro: 0, weight: 4,
    eleDef: { light: 20, wind: 20, plant: 10 },
    drops: [["jelly", 0.45], ...BOOK_DROPS] },
  { id: "blue", name: "สไลม์ฟ้า", hue: 70, level: 5, hp: 170, atk: 18, def: 8, mdef: 10, xp: 24, aggro: 0, weight: 3,
    element: "ice", eleDef: { ice: 35, water: 30 },
    drops: [["jelly", 0.5], ...BOOK_DROPS] },
  { id: "violet", name: "สไลม์ม่วง", hue: 125, level: 9, hp: 320, atk: 28, def: 12, mdef: 12, xp: 48, aggro: 260, weight: 1,
    element: "dark", eleDef: { dark: 40, metal: 15, stone: 10 },
    drops: [["sprout", 0.2], ["jelly", 0.6], ["book_survivor", 0.002], ["book_gathering", 0.002], ["book_lightning", 0.002]] },
];
// The slimes get stronger with their level like every bestiary monster (bestiary.ts
// monsterMight): their numbers above are the curve's, the might goes on top here.
for (const v of VARIANTS) {
  const k = monsterMight(v.level);
  v.hp = Math.round(v.hp * k);
  v.atk = Math.round(v.atk * k);
  v.def = Math.round(v.def * k);
  v.mdef = Math.round(v.mdef * k);
}
const BITE_REACH = 95;   // cm between centres
const BITE_TIME = 1.6;   // s between bites
const CHASE_LEASH = 900; // gives up past this far from home (one that doesn't attack first)
// v0.5 (docs/v05_jobs.md 2): one that attacks first notices the player SEE_MORE farther than its
// aggro radius, and once after her doesn't let go while she is within SIGHT of it, however far
// from home. It chases CHASE_PACE faster than it walks (the fastest kind 255 cm/s, still slower
// than her 380): she can drag a train of them. Losing her, it walks home healing HOME_HEAL of its
// HP a second.
const SIGHT = 1500;
const SEE_MORE = 1.3;
const CHASE_PACE = 1.5;
const HOME_HEAL = 0.08;
const ANGER = 12;        // s it stays angry after being hit
const SHOWN = 8;         // s its name and HP stay under it after the player last hurt it
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
  dark: "violet", metal: "violet", stone: "violet", shadow: "violet",
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
        // (a person whose clothes don't arrive within 10 s stands in as a slime)
        const person = await Promise.race([this.dress!(d), new Promise<null>((r) => setTimeout(() => r(null), 10000))]);
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

type State = "idle" | "hop" | "die" | "gone" | "bite";
type Blow = "bite" | "shot" | "slam";

// Status badges: when each shows, its glyph and colour.
const STATUS: [(m: Monster) => boolean, string, string][] = [
  [(m) => m.burns.some((b) => b.poison), "drop", "#6fcf5a"],
  [(m) => m.slow > 0, "swirl", "#6fb4ff"],
  [(m) => m.chill > 0, "freeze", "#bfe8ff"],
  [(m) => m.weak > 0, "down", "#b58aff"],
  [(m) => m.expose > 0, "target", "#ff7a5a"],
  [(m) => m.blind > 0, "eye", "#7d7690"],
  [(m) => m.silence > 0, "cry", "#9fb4ff"],
];

// Shots that are things thrown or fired, not spells.
const PHYSICAL_SHOTS = new Set(["", "arrow", "cannon", "musket", "rock", "shuriken", "tongue", "vine", "spear", "web"]);

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
  shake = 0; // s left of the shake a hit gives it (a hit doesn't stop it)
  shown = 0; // s its name and HP still show under it (the player hurt it)
  focus = false; // the player's (or the bot's) target: its name and HP show (set each frame)
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
  homing = false; // lost the player far from home: walking back there
  rush = 0;      // s left charging
  chargeCd = 0;
  slamCd = 0;
  healCd = 0;
  fleeT = 0;     // s left running off
  fled = false;
  stolen = false; // a thief has taken something from it already
  called = 0;    // how many calls for help so far
  burst = false;
  person: Person | null;
  body: Player | null = null; // a person is drawn as the player is
  race: Race = "formless";    // what it is (bestiary.ts; slimes are formless)
  foe: Foe | null = null; // an ally of the player's it goes for (null: her)
  silence = 0;   // s left it can't cast or shoot (a mana burn)

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
      this.race = d.race ?? "brute";
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

  // It attacks first (and chases as long as it sees the player).
  get fierce(): boolean {
    return this.variant.aggro > 0;
  }

  // Its attacks are spells (a caster, or a shot of fire, frost, water, snow, a curse, foxfire):
  // smoke can dodge them.
  get magical(): boolean {
    return this.entry?.kind === "caster" || (!!this.ranged && !PHYSICAL_SHOTS.has(this.ranged));
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
    this.weak = this.weakPct = this.expose = this.exposePct = this.blind = this.silence = 0;
    this.foe = null;
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
    this.fled = this.burst = this.homing = false;
    this.called = 0;
    this.boost = 1;
  }

  // Returns true when this hit defeats it.
  hit(damage: number, dir: Vec2, knock: number): boolean {
    if (!this.alive) return false;
    this.hp -= damage;
    this.flash = 0.12;
    this.shown = SHOWN;
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
    // it shakes but keeps going: a monster stopped by every blow would never reach anyone
    this.shake = this.look.hurtT;
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

  // A blow lands on the player (or the ally it goes for), `boost` times as hard.
  land(ctx: MonsterCtx, boost = 1, foe = this.foe): void {
    this.boost = boost;
    ctx.bite(this, foe);
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
    this.shake = Math.max(0, this.shake - dt);
    this.shown = Math.max(0, this.shown - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.freeze = Math.max(0, this.freeze - dt);
    this.slow = Math.max(0, this.slow - dt);
    this.chill = Math.max(0, this.chill - dt);
    this.petrify = Math.max(0, this.petrify - dt);
    this.weak = Math.max(0, this.weak - dt);
    this.expose = Math.max(0, this.expose - dt);
    this.blind = Math.max(0, this.blind - dt);
    this.silence = Math.max(0, this.silence - dt);
    this.biteCd = Math.max(0, this.biteCd - dt);
    this.angry = Math.max(0, this.angry - dt);
    this.chargeCd = Math.max(0, this.chargeCd - dt);
    this.slamCd = Math.max(0, this.slamCd - dt);
    this.healCd = Math.max(0, this.healCd - dt);
    this.fleeT = Math.max(0, this.fleeT - dt);
    this.rush = Math.max(0, this.rush - dt);
    // whom it goes for: the player, or one of her allies (a wall in its way, a golem that draws
    // it); "the player" below is whichever
    const foe = this.alive ? ctx.foe?.(this) ?? null : null;
    this.foe = foe;
    const pl = foe ?? ctx.player, alive = foe ? foe.alive : ctx.hero.alive;
    // (an ally wider than the player is that much nearer)
    const toPlayer = Math.hypot(pl.x - this.x, pl.y - this.y) - (foe ? Math.max(0, foe.radius - 24) : 0);
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
    const unseen = !foe && (ctx.unseen?.() ?? false);
    // a mana burn: no spells, no shots, no healing or calling for help for a moment
    const mute = this.silence > 0;
    // one that attacks first comes for her within its sight and keeps on while she stays within
    // SIGHT; the rest give up past their leash
    const fierce = this.fierce;
    if (alive && !unseen && fierce && toPlayer < (this.angry > 0 ? SIGHT : this.variant.aggro * SEE_MORE)) this.angry = Math.max(this.angry, 2);
    if (!alive || unseen || (fierce ? toPlayer > SIGHT : fromHome > CHASE_LEASH + this.radius * 2)) this.angry = this.rush = 0;
    if (fierce && this.angry > 0) this.rouse(pl);
    // hurt: heal up, call for help, run off
    if (this.heals && !mute && this.healCd <= 0 && this.hp < this.maxHp * 0.45) {
      const n = Math.round(this.maxHp * 0.3);
      this.hp = Math.min(this.maxHp, this.hp + n);
      this.healCd = 12;
      ctx.note?.(this, `+${n}`);
    }
    const calls = [0.7, 0.35];
    while (this.summons && !mute && ctx.summon && this.called < calls.length && this.hp < this.maxHp * calls[this.called]) {
      this.called++;
      ctx.summon(this, this.summons, 2);
    }
    if (this.flees && !this.fled && this.hp < this.maxHp * 0.2) {
      this.fled = true;
      this.fleeT = 3;
    }
    const free = this.state === "idle" || this.state === "hop";
    if (free && this.fleeT > 0) {
      const d = Math.hypot(pl.x - this.x, pl.y - this.y) || 1;
      this.goal = { x: this.x - ((pl.x - this.x) / d) * 300, y: this.y - ((pl.y - this.y) / d) * 300 };
      this.rush = 0;
      this.go();
    } else if (free && this.angry > 0) {
      this.homing = false;
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
      } else if (toPlayer < reach && this.biteCd <= 0 && !(mute && this.magical)) {
        this.begin("bite", pl);
      } else if (this.ranged && !mute && toPlayer < RANGE && this.biteCd <= 0) {
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
    } else if (free && fierce && !this.homing && fromHome > LEASH + this.radius * 2) {
      // lost her far from home: back there, healing on the way (step)
      this.homing = true;
      this.goal = this.home;
      this.go();
    }
    if (this.state === "bite") this.swing(dt, ctx, toPlayer);
    this.slide(dt);
    this.step(dt);
  }

  // Its kind near it that sees it after the player (`pl`), and has her in SIGHT too, comes too
  // (each then rouses its own).
  private rouse(pl: Vec2): void {
    for (const o of this.kin ?? []) {
      if (o.angry > 0 || !o.alive || o.variant.id !== this.variant.id) continue;
      if (Math.hypot(o.x - this.x, o.y - this.y) < o.variant.aggro * SEE_MORE && Math.hypot(o.x - pl.x, o.y - pl.y) < SIGHT) o.angry = 2;
    }
  }

  private go(): void {
    if (this.state !== "hop") {
      this.state = "hop";
      this.t = 0;
    }
  }

  // Its attack under way: the slimes lunge; the blow lands partway through.
  private swing(dt: number, ctx: MonsterCtx, toPlayer: number): void {
    const L = this.look, pl = this.foe ?? ctx.player;
    const far = Math.hypot(pl.x - this.x, pl.y - this.y) || 1; // (toPlayer: less a wide ally's girth)
    if (L.hop && this.blow === "bite" && this.t < 0.3 && toPlayer > 60) {
      const d = far;
      this.moveBy(((pl.x - this.x) / d) * 160 * dt, ((pl.y - this.y) / d) * 160 * dt);
    }
    if (!this.bitten && this.t >= L.strike) {
      this.bitten = true;
      const alive = this.foe ? this.foe.alive : ctx.hero.alive;
      if (this.blow === "bite") {
        if (toPlayer < this.reach + 30 && alive) {
          sound.play("enemy-swipe", this.variant.level);
          this.land(ctx, this.boost);
        }
      } else if (this.blow === "shot") {
        const d = far, dx = (pl.x - this.x) / d, dy = (pl.y - this.y) / d;
        sound.play("enemy-shot", this.variant.level);
        shots.push({ x: this.x + dx * this.radius, y: this.y + dy * this.radius, z: this.height * 0.55 + (this.fly ? 50 : 0),
          vx: dx * SHOT_SPEED, vy: dy * SHOT_SPEED, left: (d + 120) / SHOT_SPEED, t: 0, kind: this.ranged ?? "rock", owner: this, foe: this.foe });
      } else {
        sound.play("enemy-swipe", this.variant.level);
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
      for (const w of walls) {
        // pushed out of an ally's wall
        const ox = p.x - w.x, oy = p.y - w.y, d = Math.hypot(ox, oy), min = w.r + this.radius;
        if (d < min) {
          p.x = w.x + (ox / (d || 1)) * min;
          p.y = w.y + (oy / (d || 1)) * min;
        }
      }
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
        // (a walk gives up after 6 s, the walk home not till it gets there)
        if ((d < 12 || (this.t > 6 && !this.homing)) && this.angry <= 0 && this.fleeT <= 0) {
          this.state = "idle";
          this.wait = rand(1, 3.5);
          this.homing = false;
          break;
        }
        if (d < 12) break;
        if (this.homing) this.hp = Math.min(this.maxHp, this.hp + this.maxHp * HOME_HEAL * dt);
        this.face(dx, dy);
        const slowed = this.slow > 0 ? 1 - this.slowPct : 1;
        // chasing: a little faster, one that attacks first faster still
        const chase = this.angry <= 0 ? 1 : this.fierce ? CHASE_PACE : L.hop ? 1.25 : 1.3;
        let v: number;
        if (L.hop) {
          // only move while airborne: the middle of each hop cycle
          const phase = ((this.t * L.fps) % L.move.frames) / L.move.frames;
          if (phase <= 0.25 || phase >= 0.75) break;
          v = HOP_SPEED * 2 * slowed * chase;
        } else {
          v = this.speed * slowed * (this.rush > 0 ? 2.6 : this.fleeT > 0 ? 1.2 : chase);
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
      case "die": return { clip: L.die, col: Math.min(L.die.frames - 1, Math.floor(this.t * L.fps)) };
      default: return { clip: L.idle, col: 0 };
    }
  }

  // How high it floats (map px).
  private lift(): number {
    return this.fly ? 40 + Math.sin(this.age * 2.6) * 7 : 0;
  }

  // The billboard it is drawn into (map px): room for its sheet and the badges over it (its name
  // and HP are drawn over the scene, main.ts: under its feet they would sink into the ground).
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
    const shake = !L.hop && this.shake > 0 ? Math.sin(this.age * 70) * 3 * k * (this.shake / L.hurtT) : 0;
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

  // Stars and status badges over its head (top: where its head ends on the canvas).
  private drawOver(ctx: CanvasRenderingContext2D, gx: number, top: number, k: number): void {
    if (this.stun > 0 && this.alive) this.drawStars(ctx, gx, top - 6 * k, k);
    if (this.alive) this.drawStatus(ctx, gx, top, k);
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

  // Under its feet while it is the target or the player has hurt it lately: its level and name,
  // and its HP as a bar with the numbers on it.
  drawPlate(ctx: CanvasRenderingContext2D, cx: number, feet: number, k: number): void {
    if (!this.alive || !(this.focus || this.shown > 0)) return;
    const w = (this.boss ? 150 : 104) * k, h = (this.boss ? 14 : 12) * k;
    const gold = this.boss || this.entry?.kind === "rare";
    ctx.lineJoin = "round";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = `600 ${19 * k}px Kanit, system-ui, sans-serif`;
    ctx.lineWidth = 4.5 * k;
    ctx.strokeStyle = "rgba(10, 12, 8, 0.9)";
    ctx.fillStyle = gold ? "#ffd27a" : this.focus ? "#fff6d8" : "#e8e2cc";
    // the level and name, and before them the badge of what kind of monster it is
    const label = `Lv ${this.level} ${this.variant.name}`;
    const ty = feet + 27 * k, badge = 22 * k, tw = ctx.measureText(label).width;
    const tx = cx + (badge + 4 * k) / 2;
    ctx.strokeText(label, tx, ty);
    ctx.fillText(label, tx, ty);
    const [glyph, color] = RACE_ICONS[this.race];
    ctx.drawImage(icon(glyph, color), tx - tw / 2 - badge - 4 * k, ty - badge + 4 * k, badge, badge);
    const y = ty + 6 * k;
    ctx.fillStyle = "rgba(10, 12, 8, 0.85)";
    ctx.fillRect(cx - w / 2 - k, y - k, w + 2 * k, h + 2 * k);
    ctx.fillStyle = "#4b1c18";
    ctx.fillRect(cx - w / 2, y, w, h);
    ctx.fillStyle = this.angry > 0 ? "#ff6a5a" : "#e0a090";
    ctx.fillRect(cx - w / 2, y, (w * Math.max(0, this.hp)) / this.maxHp, h);
    ctx.font = `600 ${11 * k}px Kanit, system-ui, sans-serif`;
    ctx.lineWidth = 3 * k;
    ctx.textBaseline = "middle";
    const hp = `${Math.max(0, Math.ceil(this.hp))} / ${this.maxHp}`;
    ctx.strokeText(hp, cx, y + h / 2 + 0.5 * k);
    ctx.fillStyle = "#fff6d8";
    ctx.fillText(hp, cx, y + h / 2 + 0.5 * k);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
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
  h?: number;    // a shot: cm over the map's zero, where it really flies (z follows from it)
  lift?: number; // and how high over the ground it was let go
  vx: number;
  vy: number;
  left: number;  // s until it's spent
  t: number;
  kind: string;  // what it is (ranged:<kind>), or "slam" / "burst"
  owner: Monster;
  ring?: number; // a ring: how wide it grows (cm)
  foe?: Foe | null; // shot at one of the player's allies (null: at her)
}
export const shots: Shot[] = [];

const SHOT_COLOR: Record<string, string> = {
  water: "#5ab4ff", snow: "#f2f8ff", frost: "#9fe0ff", fire: "#ff8a2a", rock: "#a08c6c", arrow: "#e8d8b0",
  musket: "#ffe9a0", cannon: "#3a3530", shuriken: "#d8dce4", foxfire: "#7ad8ff", curse: "#b070ff",
  tongue: "#ff7aa0", vine: "#6fcf5a", slam: "#d8c8a0", burst: "#ffb05a", spark: "#fff27a", venom: "#8fdc4a", web: "#f4f4ee",
};

// Move the shots on; one that comes within reach of the player (or the ally it was shot at) hits.
export function updateShots(dt: number, ctx: MonsterCtx): void {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.t += dt;
    s.left -= dt;
    if (!s.ring) {
      const at = s.foe ?? ctx.player, there = s.foe ? s.foe.alive : ctx.hero.alive;
      // on a straight line from as high as it left to as high over her ground: thrown up onto a
      // ledge or down off one, it climbs or drops on the way, not at the edge
      const toGo = Math.hypot(at.x - s.x, at.y - s.y), step = Math.hypot(s.vx, s.vy) * dt;
      s.lift ??= s.z;
      s.h ??= heightAt(s.x, s.y) + s.z;
      s.h += (heightAt(at.x, at.y) + s.lift - s.h) * Math.min(1, step / Math.max(toGo, 1));
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z = s.h - heightAt(s.x, s.y);
      if (there && Math.hypot(at.x - s.x, at.y - s.y) < 55) {
        s.owner.land(ctx, 1, s.foe ?? null);
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
    weight: KINDS[def.kind].weight, drops: fieldDrops(def), entry: def,
  };
}

// Where a map's monsters live: spots on open ground, its own monsters from the bestiary (none:
// slimes) and where players come in (its boss lives as far from there as it can). The first
// field (the courtyard) has its own spots. Every monster is its kind's one level.
export interface Spawns {
  spots?: Vec2[];
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
// spots, the rest picked by how common their kind is, each at its kind's level, a pack one
// with a second beside it. On a field without: slime colours by weight.
export function spawnMonsters(looks: MonsterLooks, where: Spawns = {}): Monster[] {
  const list: Monster[] = [];
  const make = (v: Variant, home: Vec2) => list.push(new Monster(v, home, looks.of(v), looks.person(v)));
  const pool = where.pool ?? [];
  const common = pool.filter((d) => KINDS[d.kind].weight > 0);
  if (common.length) {
    const spots = [...(where.spots ?? SPAWNS)];
    const from = where.spawn ?? { x: 0, y: 0 };
    const far = (p: Vec2) => Math.hypot(p.x - from.x, p.y - from.y);
    const at = (d: MonsterDef) => variantOf(d, d.level);
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
  } else {
    const pick = () => pickBy(VARIANTS, (v) => v.weight);
    for (const home of where.spots ?? SPAWNS) {
      make(pick(), home);
      make(VARIANTS[0], { x: home.x + 80, y: home.y - 90 });
    }
  }
  // the others on the field: a pack comes when one is hit, its kind when one goes after the player
  for (const m of list) m.kin = list;
  return list;
}

// Roll a variant's drop table (a line that leaves several: how many, picked between its fewest
// and most).
export function rollDrops(variant: Variant, bonus = 0): string[] {
  const out: string[] = [];
  for (const [id, chance, count] of variant.drops) {
    if (Math.random() >= chance * (1 + bonus)) continue;
    const n = count ? count[0] + Math.floor(Math.random() * (count[1] - count[0] + 1)) : 1;
    for (let i = 0; i < n; i++) out.push(id);
  }
  return out;
}

export { SOLIDS, BOUNDS };

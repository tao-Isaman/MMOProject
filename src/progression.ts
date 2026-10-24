// Character progression: class, level and experience, and the skill points earned by levelling
// (one per level, the first one at level 1). Points go into three things:
//   skill trees  sets of actives and passives; each class starts with three, more come from
//                skill books. Deeper nodes open once enough points are in the tree.
//   masteries    straight lines: each level is a bonus, set levels grant a skill or passive.
//                Weapon masteries are open from the start; others come from mastery books.
//   elements     straight lines: attack and defence in that element, a little of its strong
//                side, and its effect. Twelve to start, more from element books.
// stats.js turns this into numbers, skills.js runs the actives.

import { saveKey } from "./save";
import { ITEMS } from "./items";
import type { WeaponId } from "./items";
import { pct, lin } from "./trees/util";
import { RANGER_TREES } from "./trees/ranger";
import { BLADE_TREES } from "./trees/blades";
import { CASTER_TREES } from "./trees/casters";
import { BATTLEMAGE_TREES } from "./trees/battlemage";
import { BOOK_TREES } from "./trees/books";
import { V02_JOB_TREES } from "./trees/v02jobs";
import { V03_JOB_TREES } from "./trees/v03";
import { V05_TREES } from "./trees/v05";
import { TERRAIN_KINDS } from "./terrain";
import type { TerrainKind } from "./terrain";

export const MAX_LEVEL = 200;

// Stat changes keyed by stat name (stats.ts lists them).
export type StatBag = Partial<Record<string, number>>;
type ByRank<T> = (rank: number) => T;

// Every element: the first five came first, the rest with element attack and defence, poison
// with the second jobs, smoke later, shadow and gold with the third jobs.
export const ELEMENT_IDS = ["earth", "water", "wind", "fire", "lightning", "ice", "light", "dark", "plant", "stone", "mud", "lava", "metal", "poison", "smoke", "shadow", "gold"] as const;
export type ElementId = (typeof ELEMENT_IDS)[number];

// What a monster is (bestiary.ts): some skills and passives hit one kind harder.
export const RACES = ["formless", "undead", "brute", "plant", "insect", "fish", "demon", "human", "angel", "dragon"] as const;
export type Race = (typeof RACES)[number];
export const RACE_NAMES: Record<Race, string> = {
  formless: "ไร้รูป", undead: "อันเดด", brute: "สัตว์", plant: "พืช", insect: "แมลง",
  fish: "สัตว์น้ำ", demon: "ปีศาจ", human: "มนุษย์", angel: "เทวะ", dragon: "มังกร",
};
// Each kind's badge on a monster's nameplate (an icons.ts glyph and the gem's colour).
export const RACE_ICONS: Record<Race, [string, string]> = {
  formless: ["drop", "#5aa8dc"], undead: ["skull", "#8f86b8"], brute: ["paw", "#b98a50"], plant: ["leaf", "#5aae4a"],
  insect: ["bug", "#a6b532"], fish: ["fish", "#3f97bd"], demon: ["horns", "#b8384e"], human: ["person", "#c9a37a"],
  angel: ["wing", "#d9c56e"], dragon: ["dragon", "#c4662e"],
};

// What a skill or passive needs in hand: `weapons` one of these in the main hand; `dual` a
// one-handed weapon in each hand (true: any, a list: each one of those). A passive counts only
// while it is met; an active can't be used without it.
export interface Need {
  weapons?: WeaponId[];
  dual?: true | WeaponId[];
  shield?: boolean; // a shield (buckler, kite shield) in the off hand
  offEmpty?: boolean; // nothing in the off hand (the wuxia's lone sword)
  form?: FormId;      // only in this shape (the druid's; skills.ts)
}

export type SkillType = "bolt" | "fan" | "blast" | "nova" | "storm" | "cone" | "beam" | "dash" | "heal" | "shield" | "buff" | "flower" | "trap" | "falcon" | "decoy" | "workshop"
  | "summon" | "mimic" | "smoke" | "make"
  | "orb" | "invoke" | "form" | "stall";

// The allies a summon calls (src/allies.ts): wolf, clone and golem fight, the statue blesses
// whoever stands by it, the wall stands in the monsters' way; the decoy is the jester's copy.
// v0.5: the spirit floats after the player and shoots at her target; the familiar follows her,
// heals her and gives its buff while she is near it.
export const ALLY_KINDS = ["wolf", "clone", "statue", "wall", "golem", "decoy", "spirit", "familiar"] as const;
export type AllyKind = (typeof ALLY_KINDS)[number];
// The druid's shapes (SkillDef type "form").
export const FORM_IDS = ["bear", "bird", "deer"] as const;
export type FormId = (typeof FORM_IDS)[number];
export { TERRAIN_KINDS };
export type { TerrainKind };

// A passive or buff stat that casts a skill by itself: `autocast_<skill id>` is the chance a
// normal hit that lands casts that skill for free at what it hit (skills.ts autocast).
export const AUTOCAST = "autocast_";

// An active skill's numbers; which fields matter depends on `type` (skills.ts).
//   trap    laid at the aimed spot (`range` at most, `radius` wide); the first monster to step in
//           sets it off (its hit, with stun, slow, poison...). It waits `duration` s (default
//           20); three at most at a time, the oldest goes.
//   falcon  the falcon dives at the locked target `hits` times. With `ally: "wolf"` (the hunter's
//           pack strike) the player's wolves leap at it instead, each wolf standing landing every
//           hit; with none standing it can't be used (nor cast by itself).
//   decoy   a copy of the player in front of it for `duration` s, with `base` of the player's HP:
//           monsters go for it instead of the player while it stands.
//   workshop  opens the workshop on the spot (`bench`: its tab and the craft it serves), free of
//           the smiths' fees.
// The third jobs' (src/allies.ts, skills.ts):
//   summon  calls an ally of kind `ally` (ALLY_KINDS) for `duration` s (default 30), at most
//           `count` of that kind at a time (default 1; one more sends the oldest away). `base`: its
//           HP as a share of the player's max HP; `mult` (with `stat`): each of its blows, as a
//           skill hit of the player's (a clone: of the player's normal attack), one every `every`
//           s; `range`: placed on the aimed spot up to that far (else in front of the player);
//           a statue's `buff` is the player's while within its `radius` (default 300); a wall's
//           `radius` is its size (default 70). wolf: follows, bites what the player attacks or
//           what attacks the player; clone: the player's look, fights the player's target; golem:
//           walks to the nearest monster and draws the monsters to it; wall: monsters can't
//           walk through it and hit it when it is in their way.
//   mimic   copies the locked monster's attack (its shot and element, or its bite) for `uses`
//           uses (default 5) or `duration` s (default 20): the same slot then fires the copy,
//           `mult` of the player's attack (magic attack for a spell), no MP, `every` s apart
//           (default 0.8); when it runs out the skill's own cooldown starts.
//   smoke   a cloud of `radius` (default 220) for `duration` s (default 10), on the aimed spot
//           (`range`) or round the player: she is hidden while she stays in it (stealth, its
//           `buff` on top); a blow from it shows her for a moment, then the smoke hides her again.
//   make    turns materials into an item: `make.from` taken from the bag, `make.count(rank)` of
//           `make.item` given (poison vials, src/poisons.ts).
// Riders any skill can carry: `combo` (stronger right after another skill), `manaBurn` (more on
// casters, `silence` s of no casting or shooting), `hits` on nova, beam and dash too (bolt, cone
// and blast had it), `terrain` on a buff (stats by the kind of map, src/terrain.ts).
// stat "both": attack and magic attack together (0.6 of each), a spell's sure hit.
export interface SkillDef {
  type: SkillType;
  stat?: "atk" | "matk" | "both";
  element?: ElementId; // what its hits are made of (none: no element)
  mult?: ByRank<number>;
  mp: number;
  cd: number;
  motion: string;
  cast?: number;
  color: string;
  speed?: number;
  range?: number;
  radius?: number;
  pierce?: boolean;
  delay?: number;
  length?: number;
  width?: number;
  knock?: number;
  stun?: ByRank<number>;
  slow?: ByRank<number>;
  freeze?: ByRank<number>;
  heal?: ByRank<number>;
  base?: ByRank<number>;
  duration?: number;
  buff?: ByRank<StatBag>;
  hits?: number;
  pulses?: number;
  every?: number;
  reach?: number;
  arc?: number;
  count?: number;
  spread?: number;
  arrow?: boolean;
  distance?: number;
  ticks?: number;
  poison?: ByRank<number>;   // poison for this much of the hit's damage over 4 s
  weaken?: ByRank<number>;   // the target deals this much less damage for `debuff` s
  expose?: ByRank<number>;   // the target takes this much more damage for `debuff` s
  blind?: ByRank<number>;    // s the target misses half its bites
  debuff?: number;           // how long weaken and expose last (s, default 6)
  vs?: Partial<Record<Race, number>>; // this much more damage to these kinds of monster (0.5: +50%)
  drain?: ByRank<number>;    // heals this share of the damage done
  masteryScale?: number;     // +this much damage per level of the held weapon's mastery
  detonate?: ByRank<number>; // sets off the poison on the target: this much of what it had left at once
  enchant?: ElementId;       // buff: the weapon hits in this element for the buff's time (normal attacks
                             // and physical skills without an element of their own)
  steal?: "gold" | "item";   // a hit may take gold, or one of the monster's drops (once a monster)
  stealChance?: ByRank<number>;
  dice?: boolean;            // a die is rolled (rollDie): a hit does die / 3.5 of its damage; a buff
                             // adds `roll` times (die - 3) / 3 (a 1 takes away, a 6 gives it all)
  roll?: ByRank<StatBag>;
  bench?: { tab: "craft" | "refine"; craft: string };
  // ---- the third jobs' ----
  ally?: AllyKind;           // summon: what it calls (see above); falcon: "wolf", the wolves strike
  uses?: number;             // mimic: how many times the copy can be used
  // a chain: within `within` s (default 3) of casting one of `after`, this cast does `more`
  // more damage (0.4: +40%) and says so
  combo?: { after: string[]; within?: number; more: ByRank<number> };
  manaBurn?: ByRank<number>; // this much more damage to a caster (Monster.magical), and its casting
  silence?: number;          // and shooting stop for this many s (default 3), any monster's
  // a buff whose stats depend on where the player stands: these on top of `buff` for the kind
  // of map she is on (they change as she goes from map to map)
  terrain?: ByRank<Partial<Record<TerrainKind, StatBag>>>;
  make?: { item: string; count: ByRank<number>; from: [string, number][] };
  // a coin is flipped on every hit (flipCoin; luck helps it come up heads): heads, the hit does
  // this much more (0.5: +50%); tails, as much less
  coin?: ByRank<number>;
  // ---- the fourth jobs' (docs/v05_jobs.md) ----
  // orb     adds an orb of element `orb` to the three the player holds (a fourth sends the oldest
  //         away); each orb held gives `buff` at this skill's rank for as long as it is held (two
  //         of one element give it twice). Orbs stay from map to map and go when she falls.
  orb?: ElementId;
  // invoke  casts the spell `invoke` holds for the three orbs held: their elements sorted and
  //         joined by "+" ("fire+fire+ice"), at this skill's rank, with that spell's own MP,
  //         cooldown and cast time. Not three orbs held, or no spell for them: it can't be used.
  invoke?: Record<string, { name: string; skill: SkillDef }>;
  // form    turns the player into `form` for `duration` s (default 60; used again, she is herself
  //         again), drawn as the monster `look` (a bestiary id). She has `buff` while in it, and
  //         her normal attack is `formAttack`: a blow in front of her (`reach`, default 130) or a
  //         shot (`range`, default 560), `mult` of her attack (stat "matk": magic attack), healing
  //         her `heal` of the damage it does. Skills that need a weapon can't be used in a form.
  form?: FormId;
  formAttack?: { kind: "melee" | "ranged"; mult: ByRank<number>; stat?: "atk" | "matk"; element?: ElementId; heal?: ByRank<number>; reach?: number; range?: number; every?: number };
  // summon: the ally drawn as this monster's sheet (a bestiary id) or a slime of a hue
  // ("slime:<degrees>") instead of its kind's own look
  look?: string;
  // a heal over time: `heal` (the heal type's amount) given in `ticks` parts, one a second
  hot?: boolean;
}

export interface TreeNode {
  id: string;
  name: string;
  kind: "active" | "passive";
  max: number;
  pos: [number, number];          // column (0-3) and row in the tree drawing
  req?: [string, number][];       // nodes of the same tree that need these ranks first
  glyph: string;
  desc: ByRank<string>;
  stats?: ByRank<StatBag>;
  terrain?: ByRank<Partial<Record<TerrainKind, StatBag>>>; // a passive: these too, on that kind of map
  skill?: SkillDef;
  need?: Need;
}

export interface Tree {
  name: string;
  cls: ClassId | null;
  job?: JobId;      // a second job's branch: learned on taking the job, no book
  job3?: Job3Id;    // a third job's branch, the same way
  job4?: Job4Id;    // a fourth job's branch, the same way
  stub?: boolean;   // not written yet: its job isn't offered (job3Open), tree_check lets it be
  opens?: string;   // a mastery the branch teaches on taking it (an inventor's craft)
  book?: string;
  color: string;
  glyph: string;
  note: string;
  nodes: TreeNode[];
}

export interface MasteryReward {
  at: number;
  kind: "passive" | "active";
  name: string;
  desc: string;
  stats?: StatBag;
  id?: string;
  glyph?: string;
  skill?: SkillDef;
}

export interface Mastery {
  name: string;
  kind: "weapon" | "life";
  weapons?: WeaponId[];
  glyph: string;
  max: number;
  max2?: number;    // where the line ends once the mastery's second book is read
  per: StatBag;
  perDesc: string;
  rewards: MasteryReward[];
  book?: string;
}

// A milestone on an element's line: stats it adds, or an effect skills.ts checks by level.
export interface ElementMark {
  at: number;
  name: string;
  desc: string;
  stats?: StatBag;
}

export interface ElementDef {
  name: string;
  color: string;
  glyph: string;
  max: number;
  max2?: number;    // where the line ends once the element's second book is read
  side: string;
  per: StatBag;
  skill: string;
  marks: ElementMark[];
  book?: string;
}

export type ClassId = "mage" | "warrior" | "archer" | "priest";
export type JobId = "ranger" | "swordsman" | "wizard" | "bishop" | "battlemage" | "warlord" | "thief" | "jester" | "mercenary" | "inventor" | "merchant";

// Whether the hands hold what `need` asks for (main: the main-hand weapon type, off: the off
// hand's, null when empty or not a weapon).
export function needMet(need: Need | undefined, main: string | null, off: string | null): boolean {
  if (!need) return true;
  if (need.weapons && !need.weapons.includes(main as WeaponId)) return false;
  if (need.dual) {
    const ok = (w: string | null) => !!w && w !== "shield" && (need.dual === true || (need.dual as WeaponId[]).includes(w as WeaponId));
    if (!ok(main) || !ok(off)) return false;
  }
  if (need.shield && off !== "shield") return false;
  return true;
}

// "ดาบมือเดียว หรือ ดาบสองมือ", "ดาบมือเดียวทั้งสองมือ", for the skill window and the bar.
export function needText(need: Need | undefined, weaponName: (w: WeaponId) => string): string {
  if (!need) return "";
  const parts: string[] = [];
  if (need.weapons) parts.push(need.weapons.map(weaponName).join(" หรือ "));
  if (need.dual === true) parts.push("อาวุธมือเดียวทั้งสองมือ");
  else if (need.dual) parts.push(`${need.dual.map(weaponName).join(" หรือ ")} ทั้งสองมือ`);
  if (need.shield) parts.push("โล่ในมือรอง");
  return parts.join(" และ ");
}

export interface ClassDef {
  name: string;
  note: string;
  trees: string[];
  base: StatBag;
  growth: StatBag;
  weapon: WeaponId;
}

export interface Active {
  id: string;
  name: string;
  glyph: string;
  color: string;
  max: number;
  skill: SkillDef;
  desc: string | ByRank<string>;
  source: { tree?: string; mastery?: string; at?: number };
  need?: Need;
}

// Experience to go from `level` to the next.
export function xpToNext(level: number): number {
  return Math.round(25 * level ** 1.55 + 15);
}

// Stats every character has (see stats.js for what they do). crit, critDmg, aspd, move, cdr,
// castRed and dmgRed are fractions.
export const STAT_NAMES: Record<string, string> = {
  maxHp: "HP สูงสุด", maxMp: "MP สูงสุด", atk: "พลังโจมตี", matk: "พลังเวท", def: "ป้องกัน", mdef: "ต้านเวท",
  hit: "ความแม่นยำ", flee: "หลบหลีก", crit: "โอกาสคริติคอล", critDmg: "แรงคริติคอล", aspd: "ความเร็วโจมตี", move: "ความเร็วเดิน",
  hpRegen: "ฟื้น HP/วิ", mpRegen: "ฟื้น MP/วิ", cdr: "ลดคูลดาวน์", castRed: "ลดเวลาร่าย", dmgRed: "ลดความเสียหาย", reflect: "สะท้อนความเสียหาย",
  luck: "โชคดี", magicDodge: "หลบเวท", statusRes: "ต้านสถานะ", doubleHit: "โอกาสตีซ้ำ", ambush: "โจมตีจากที่ซ่อน", stealth: "ซ่อนตัว",
  // v0.5: attack from max HP (hpToAtk: that share of max HP), a blow back when hit (counter: the
  // chance, the blow 150% of attack), allies stronger and tougher (allyPct)
  hpToAtk: "HP เป็นพลังโจมตี", counter: "โอกาสสวนกลับ", allyPct: "พลังผู้ช่วย",
};
export const PERCENT_STATS = new Set(["crit", "critDmg", "aspd", "move", "cdr", "castRed", "dmgRed", "reflect", "magicDodge", "statusRes", "doubleHit", "ambush",
  "hpToAtk", "counter", "allyPct"]);

export const CLASSES: Record<ClassId, ClassDef> = {
  mage: {
    name: "นักเวท",
    note: "พลังเวทสูง ตีจากระยะไกล HP น้อย",
    trees: ["arcane", "flora", "ward"],
    base: { maxHp: 80, maxMp: 110, atk: 6, matk: 16, def: 3, mdef: 8, hit: 10, flee: 8, crit: 0.05, critDmg: 0.5, hpRegen: 1, mpRegen: 3 },
    growth: { maxHp: 12, maxMp: 9, atk: 0.6, matk: 2.2, def: 0.5, mdef: 1, hit: 1, flee: 0.8, hpRegen: 0.05, mpRegen: 0.06 },
    weapon: "staff",
  },
  warrior: {
    name: "นักรบ",
    note: "HP และป้องกันสูง ตีระยะประชิด",
    trees: ["berserker", "guardian", "duelist"],
    base: { maxHp: 140, maxMp: 50, atk: 15, matk: 4, def: 8, mdef: 4, hit: 15, flee: 6, crit: 0.05, critDmg: 0.5, hpRegen: 2, mpRegen: 1.2 },
    growth: { maxHp: 22, maxMp: 4, atk: 2.2, matk: 0.5, def: 1.1, mdef: 0.6, hit: 1.5, flee: 0.8, hpRegen: 0.1, mpRegen: 0.03 },
    weapon: "sword_1h",
  },
  archer: {
    name: "นักธนู",
    note: "ยิงธนูจากระยะไกล ตีเร็ว คริติคอลสูง ยิงติดดีบัฟได้",
    trees: ["marksman", "rapid", "hunter"],
    base: { maxHp: 100, maxMp: 70, atk: 13, matk: 5, def: 5, mdef: 5, hit: 20, flee: 14, crit: 0.08, critDmg: 0.5, hpRegen: 1.5, mpRegen: 1.6 },
    growth: { maxHp: 16, maxMp: 5, atk: 2, matk: 0.6, def: 0.7, mdef: 0.7, hit: 2, flee: 1.4, hpRegen: 0.07, mpRegen: 0.04 },
    weapon: "bow",
  },
  priest: {
    name: "นักบวช",
    note: "ฮีลและบัฟตัวเอง ต้านเวทสูง ต่อสู้ด้วยเวทศักดิ์สิทธิ์และกระบอง",
    trees: ["restore", "blessing", "crusade"],
    base: { maxHp: 105, maxMp: 100, atk: 10, matk: 12, def: 6, mdef: 9, hit: 12, flee: 9, crit: 0.04, critDmg: 0.5, hpRegen: 1.6, mpRegen: 2.6 },
    growth: { maxHp: 17, maxMp: 7, atk: 1.4, matk: 1.7, def: 0.8, mdef: 1.1, hit: 1.5, flee: 1, hpRegen: 0.08, mpRegen: 0.05 },
    weapon: "mace",
  },
};

// ---- second jobs ----
// At level 30 (JOB_LEVEL; a job every 30 levels) a character can take a second job from that
// job's master, by the master's quest (quests.ts). Before handing it in they pick one of the
// job's branches: a skill tree learned on the spot, with JOB_POINTS skill points. A job adds
// its bonus at once and its growth on every level after JOB_LEVEL; `from` is the classes that
// may take it (null: any).
export const JOB_LEVEL = 30;
export const JOB_POINTS = 5;

export interface JobDef {
  name: string;
  from: ClassId[] | null;
  branches: string[];
  note: string;
  bonus: StatBag;
  growth: StatBag;
  skill?: string;   // an active the job itself teaches, whatever the branch (the merchant's stall)
}

export const JOBS: Record<JobId, JobDef> = {
  ranger: {
    name: "นายพราน", from: ["archer", "warrior"], branches: ["falconer", "trapper", "venomer"],
    note: "นักล่าแห่งป่า ใช้เหยี่ยว กับดัก และยาพิษ",
    bonus: { atk: 8.4, hit: 10.5, flee: 7, crit: 0.01 }, growth: { atk: 0.48, hit: 0.36, flee: 0.3, maxHp: 2.4 },
  },
  swordsman: {
    name: "นักดาบ", from: null, branches: ["twin_blade", "greatsword"],
    note: "ผู้ใช้ดาบ ถือดาบคู่หรือดาบสองมือ",
    bonus: { atk: 10.5, maxHp: 105, def: 5.6 }, growth: { atk: 0.6, maxHp: 4.8, def: 0.24 },
  },
  wizard: {
    name: "จอมเวท", from: ["mage", "priest"], branches: ["elementalist", "shadowcraft"],
    note: "ผู้ใช้เวทขั้นสูง เวทธาตุหรือเวทมืด",
    bonus: { matk: 14, maxMp: 56, mdef: 4.2 }, growth: { matk: 0.72, maxMp: 2.4, mdef: 0.18 },
  },
  bishop: {
    name: "บาทหลวง", from: ["priest"], branches: ["radiance", "mercy"],
    note: "ผู้รับใช้แสงศักดิ์สิทธิ์ ขับไล่อันเดดหรือรักษาและสนับสนุน",
    bonus: { matk: 8.4, maxMp: 42, mdef: 7, healPct: 0.07 }, growth: { matk: 0.48, maxMp: 1.8, mdef: 0.3, maxHp: 2.4 },
  },
  battlemage: {
    name: "จอมเวทนักสู้", from: null, branches: ["equilibrium", "arcanist", "runeblade"],
    note: "นักสู้ที่ใช้ทั้งดาบและเวท",
    bonus: { atk: 7, matk: 7, maxHp: 56, maxMp: 28 }, growth: { atk: 0.36, matk: 0.36, maxHp: 3, maxMp: 1.2 },
  },
  warlord: {
    name: "นักรบคลั่ง", from: ["warrior"], branches: ["armsmaster", "bloodrage"],
    note: "นักรบที่บ้าคลั่งในสนามรบ ชำนาญอาวุธหรือเลือดเดือด",
    bonus: { atk: 10.5, maxHp: 140, hpRegen: 1.4 }, growth: { atk: 0.6, maxHp: 6, hpRegen: 0.03 },
  },
  // v0.2: four more, open to every class
  thief: {
    name: "หัวขโมย", from: null, branches: ["dagger_art", "shadow"],
    note: "มือไวใจกล้า ขโมยเงินและของจากมอนสเตอร์ด้วยมีดสั้น หรือซ่อนตัวในเงาแล้วแทงทีเดียวจอด",
    bonus: { atk: 8.4, flee: 10.5, aspd: 0.05, luck: 3 }, growth: { atk: 0.48, flee: 0.42, maxHp: 2.4 },
  },
  jester: {
    name: "ตัวตลก", from: null, branches: ["trickster", "gambler"],
    note: "นักแสดงผู้เล่นกับโชค ได้ค่าโชคดีที่ทำให้ทุกอย่างที่สุ่มเข้าทาง หลอกล่อศัตรูด้วยร่างแยก หรือฝากชีวิตไว้กับลูกเต๋า",
    bonus: { luck: 10, flee: 7, maxHp: 56, atk: 5.6, matk: 5.6 }, growth: { luck: 0.3, flee: 0.3, maxHp: 2.4, atk: 0.3, matk: 0.3 },
  },
  mercenary: {
    name: "ทหารรับจ้าง", from: null, branches: ["lancer", "breaker", "scout"],
    note: "นักสู้รับจ้างผู้ช่ำชองอาวุธ ทหารหอก (หอกยาว หรือหอกกับโล่) นักบุกทะลวงอาวุธสองมือ หรือนักลาดตระเวนธนู",
    bonus: { atk: 9.8, maxHp: 98, def: 4.2, hit: 7 }, growth: { atk: 0.54, maxHp: 4.2, def: 0.2, hit: 0.24 },
  },
  inventor: {
    name: "นักประดิษฐ์", from: null, branches: ["weaponsmith", "armorsmith", "jeweler"],
    note: "ช่างผู้สร้างอุปกรณ์ได้เอง แต่ละสายได้ความเชี่ยวชาญการสร้างของตัวเองทันที (อาวุธ ชุด หรือประดับ) พร้อมสกิลต่อสู้และบัฟ",
    bonus: { atk: 7, matk: 7, def: 4.2, maxHp: 70 }, growth: { atk: 0.36, matk: 0.36, def: 0.18, maxHp: 3 },
  },
  // v0.5: open to every class; whatever the branch, the job sets up a stall in town
  merchant: {
    name: "พ่อค้า", from: null, branches: ["merchant_trade", "merchant_cart"],
    note: "พ่อค้าผู้เดินทางไปทั่ว ตั้งร้านขายของในเมืองได้ ค้าขายเก่งจนเงินทองไหลมาเทมา หรือเข็นเกวียนสินค้าลุยศัตรูและทุ่มทุนโจมตี",
    bonus: { atk: 7, maxHp: 84, def: 4.2, luck: 3 }, growth: { atk: 0.4, maxHp: 3.6, def: 0.2 },
  },
};

// A second job that can be taken: every branch written (none a stub).
export function jobOpen(id: JobId): boolean {
  return JOBS[id].branches.every((b) => TREES[b] && !TREES[b].stub);
}

// ---- third jobs ----
// At level 60 (THIRD_JOB_LEVEL) a character with a second job can take a third, from its master
// (src/jobmasters.ts) by the master's quest (src/quests_job3.ts), the same way: a branch picked at
// the hand-in, learned on the spot with JOB_POINTS points, its first skill on the bar. `from`: the
// second jobs that may take it (null: any). The second job and its branch stay; the third adds
// its bonus at once and its growth on every level after THIRD_JOB_LEVEL (job3Stats), a little
// over a second job's. Its branches have TREE_SKILLS[3] skills; a branch still being written is a
// stub, and a job with a stub branch isn't offered yet (job3Open).
export const THIRD_JOB_LEVEL = 60;
export type Job3Id = "knight" | "hunter" | "archmage" | "assassin" | "high_bishop" | "monk" | "spellblade" | "sculptor" | "magician" | "historian" | "shinobi";

export interface Job3Def {
  name: string;
  from: JobId[] | null;
  branches: string[];
  note: string;
  bonus: StatBag;
  growth: StatBag;
  glyph: string;  // its emblem until it has a picture (icons.ts glyph)
  color: string;
}

export const JOBS3: Record<Job3Id, Job3Def> = {
  knight: {
    name: "อัศวิน", from: ["swordsman", "warlord", "mercenary"], branches: ["knight_lance", "knight_blade", "knight_axe"],
    note: "นักรบเกราะหนักผู้ภักดี ใช้หอกกวาดศัตรูหลายตัวและยืนระยะ ดาบที่เร็วทั้งมือและเท้า หรือขวานที่ผ่าเกราะและคริติคอลหนัก",
    bonus: { atk: 12, maxHp: 140, def: 7 }, growth: { atk: 0.66, maxHp: 5.4, def: 0.28 }, glyph: "shield", color: "#c8d8f0",
  },
  hunter: {
    name: "นักล่า", from: ["ranger", "thief", "jester", "mercenary"], branches: ["hunter_bow", "hunter_beast"],
    note: "นักล่าตัวจริง ยิงธนูแรงใส่เป้าเดียวพร้อมทำให้มันวิ่งไม่ได้ หรือออกล่ากับฝูงหมาป่าที่กัดทุกตัวที่เราตี",
    bonus: { atk: 10.5, hit: 12, flee: 8, crit: 0.012 }, growth: { atk: 0.56, hit: 0.42, flee: 0.34, maxHp: 2.8 }, glyph: "paw", color: "#b9d08a",
  },
  archmage: {
    name: "จอมเวทชั้นสูง", from: ["wizard", "battlemage", "inventor", "jester"], branches: ["archmage_elements", "archmage_metal"],
    note: "ปราชญ์แห่งเวท ร่ายเวทหลายธาตุเป็นวงกว้าง หรือเวทโลหะที่ป้องกันหนา ถือโล่ และสะท้อนการโจมตี",
    bonus: { matk: 16, maxMp: 70, mdef: 5 }, growth: { matk: 0.8, maxMp: 2.8, mdef: 0.22 }, glyph: "star", color: "#a8b8ff",
  },
  assassin: {
    name: "นักฆ่า", from: ["ranger", "thief", "swordsman", "warlord", "mercenary"], branches: ["assassin_blade", "assassin_venom", "assassin_spell"],
    note: "เงาที่ไม่มีใครเห็น ฆ่าเร็วด้วยกรงเล็บและคริติคอล ทำยาพิษเคลือบอาวุธ หรือเผามานาของพวกร่ายเวทด้วยมีด",
    bonus: { atk: 10.5, flee: 12, aspd: 0.06, crit: 0.012 }, growth: { atk: 0.56, flee: 0.48, maxHp: 2.8 }, glyph: "skull", color: "#9a7cc8",
  },
  high_bishop: {
    name: "บาทหลวงชั้นสูง", from: ["bishop"], branches: ["high_bishop_grace", "high_bishop_restore", "high_bishop_exorcist"],
    note: "ผู้นำแห่งศรัทธา ให้พรและปกป้อง รักษาแรงและเป็นหมู่ หรือล่าปีศาจและอันเดดด้วยกระบองที่ร่ายเวทเองเมื่อตี",
    bonus: { matk: 10, maxMp: 56, mdef: 8, healPct: 0.08 }, growth: { matk: 0.56, maxMp: 2.2, mdef: 0.34, maxHp: 2.8 }, glyph: "cross", color: "#fff0b0",
  },
  monk: {
    name: "พระนักรบ", from: ["bishop", "wizard", "battlemage", "thief"], branches: ["monk_nature", "monk_martial"],
    note: "นักบวชผู้ฝึกกาย ตีปกติผสานพลังธรรมชาติและร่ายสกิลเองเมื่อตี หรือศิลปะการต่อสู้หลายฮิตด้วยสนับมือ",
    bonus: { atk: 9, matk: 9, maxHp: 84, aspd: 0.04 }, growth: { atk: 0.44, matk: 0.44, maxHp: 3.6 }, glyph: "bash", color: "#ffcf8a",
  },
  spellblade: {
    name: "จอมเวทนักสู้ขั้นสูง", from: ["battlemage", "wizard", "swordsman"], branches: ["spellblade_rift", "spellblade_empower"],
    note: "ดาบกับเวทเป็นหนึ่งเดียว ดาบผ่ามิติแห่งความมืด หรือดาบเสริมเวทที่เปลี่ยนธาตุและกระบวนท่าได้ตามศัตรู",
    bonus: { atk: 8.5, matk: 8.5, maxHp: 70, maxMp: 35 }, growth: { atk: 0.42, matk: 0.42, maxHp: 3.6, maxMp: 1.4 }, glyph: "twin", color: "#b8a0ff",
  },
  sculptor: {
    name: "นักประติมากรรม", from: ["inventor"], branches: ["sculptor_wood", "sculptor_stone"],
    note: "ช่างผู้ปลุกงานสลักให้มีชีวิต รูปปั้นไม้ที่ให้พรแก่ผู้ยืนใกล้ หรือกำแพงและหุ่นปูนที่ขวางและช่วยสู้",
    bonus: { atk: 8.5, matk: 8.5, def: 5, maxHp: 84 }, growth: { atk: 0.42, matk: 0.42, def: 0.22, maxHp: 3.6 }, glyph: "earth", color: "#d8c09a",
  },
  magician: {
    name: "นักมายากล", from: null, branches: ["magician_gambler", "magician_copycat", "magician_illusion"],
    note: "นักแสดงผู้เล่นกลกับทุกสิ่ง ทอยเต๋าและโยนเหรียญเสี่ยงดวง ก๊อปท่าของมอนสเตอร์มาใช้ หรือหลอกตาด้วยร่างปลอมและควัน",
    bonus: { luck: 12, flee: 8, maxHp: 70, atk: 7, matk: 7 }, growth: { luck: 0.36, flee: 0.34, maxHp: 2.8, atk: 0.36, matk: 0.36 }, glyph: "swirl", color: "#ff9ad8",
  },
  historian: {
    name: "นักประวัติศาสตร์", from: null, branches: ["historian_nature", "historian_archaeo"],
    note: "ผู้รู้แห่งโลก รู้จุดอ่อนของมอนสเตอร์ทุกเผ่าและหาของได้มากขึ้น หรือรู้จักดินแดนจนได้พลังจากภูมิประเทศที่ยืนอยู่",
    bonus: { atk: 7, matk: 7, hit: 8, drop: 0.05, maxHp: 70 }, growth: { atk: 0.36, matk: 0.36, hit: 0.3, maxHp: 2.8 }, glyph: "scroll", color: "#d8c08a",
  },
  shinobi: {
    name: "ชิโนบิ", from: null, branches: ["shinobi_spy", "shinobi_combat"],
    note: "นินจาแห่งเกาะตะวันออก สายลับที่ซ่อนตัว เคลื่อนไหว และลอบโจมตีจากระยะไกล หรือนักสู้มีดและดาบที่แยกร่างโจมตี",
    bonus: { atk: 10, flee: 10, move: 0.04, aspd: 0.04 }, growth: { atk: 0.54, flee: 0.42, maxHp: 2.8 }, glyph: "eye", color: "#8aa0c8",
  },
};

// A third job that can be taken: every branch written (none a stub).
export function job3Open(id: Job3Id): boolean {
  return JOBS3[id].branches.every((b) => TREES[b] && !TREES[b].stub);
}

// The third job's bonus and its growth since THIRD_JOB_LEVEL (hero.ts adds them with the buffs).
export function job3Stats(p: { job3: Job3Id | null; level: number }): StatBag {
  const j = p.job3 ? JOBS3[p.job3] : null;
  if (!j) return {};
  const out: StatBag = { ...j.bonus };
  const k = Math.max(0, p.level - THIRD_JOB_LEVEL);
  for (const [key, v = 0] of Object.entries(j.growth)) out[key] = (out[key] ?? 0) + v * k;
  return out;
}

// ---- fourth jobs (docs/v05_jobs.md) ----
// At level 90 (FOURTH_JOB_LEVEL) a character with a third job can take a fourth, from its master
// by a longer quest, the same way as the third: a branch picked at the hand-in, learned on the
// spot with JOB_POINTS points. `from`: the third jobs that may take it (null: any). Its bonus
// and growth are a little over a third job's; its branches have TREE_SKILLS[4] skills.
export const FOURTH_JOB_LEVEL = 90;
export type Job4Id = "high_knight" | "sniper" | "warlock" | "druid" | "slayer" | "royal_guard" | "alchemist" | "wuxia" | "viking" | "samurai" | "shaman";

export interface Job4Def {
  name: string;
  from: Job3Id[] | null;
  branches: string[];
  note: string;
  bonus: StatBag;
  growth: StatBag;
  glyph: string;  // its emblem until it has a picture (icons.ts glyph)
  color: string;
}

export const JOBS4: Record<Job4Id, Job4Def> = {
  high_knight: {
    name: "อัศวินชั้นสูง", from: ["knight", "sculptor", "shinobi", "monk"], branches: ["high_knight_lance", "high_knight_arms"],
    note: "ยอดอัศวินแห่งราชสำนัก หอกที่บุทะลวงทั้งใกล้และไกลจนถึงขว้างหอก หรือเทพศาสตราผู้ใช้อาวุธได้ทุกชนิดทั้งรุกและรับ",
    bonus: { atk: 14, maxHp: 170, def: 8 }, growth: { atk: 0.74, maxHp: 6, def: 0.3 }, glyph: "shield", color: "#d8e4ff",
  },
  sniper: {
    name: "สไนเปอร์", from: ["hunter", "assassin", "shinobi"], branches: ["sniper_gun", "sniper_bow"],
    note: "มือปืนและพลธนูที่แม่นที่สุด ปืนที่ยิงเร็ว หลายนัด และกวาดเป็นวง หรือธนูที่ยิงเป้าเดียวแรงจนทะลุเกราะ",
    bonus: { atk: 12, hit: 14, crit: 0.015, flee: 8 }, growth: { atk: 0.62, hit: 0.46, flee: 0.34, maxHp: 3 }, glyph: "target", color: "#c8d8a0",
  },
  warlock: {
    name: "พ่อมด", from: ["archmage", "high_bishop", "spellblade", "historian"], branches: ["warlock_invoker", "warlock_curse"],
    note: "ผู้ควบคุมพลังเวทสูงสุด อัญเชิญลูกแก้วธาตุสามลูกแล้วผสานเป็นเวทได้สิบแบบ หรือสาปศัตรูด้วยความมืด พิษ และลาวาจนเปื่อยยุ่ย",
    bonus: { matk: 18, maxMp: 80, mdef: 6 }, growth: { matk: 0.88, maxMp: 3, mdef: 0.24 }, glyph: "swirl", color: "#b49cff",
  },
  druid: {
    name: "ดรูอิด", from: ["archmage", "high_bishop", "monk", "magician"], branches: ["druid_nature", "druid_wild"],
    note: "ผู้พิทักษ์ป่าโบราณ ใช้พลังพืชและหินพร้อมฟื้นฟูต่อเนื่อง หรือแปลงร่างเป็นหมี นก และกวางตามที่ศึกต้องการ",
    bonus: { atk: 8, matk: 12, maxHp: 120, hpRegen: 2 }, growth: { atk: 0.4, matk: 0.6, maxHp: 4.6 }, glyph: "leaf", color: "#9ad08a",
  },
  slayer: {
    name: "มือสังหาร", from: ["assassin", "shinobi"], branches: ["slayer_dagger", "slayer_claw"],
    note: "เงาแห่งความตายที่ไม่มีใครรอด มีดที่แทงต่อเนื่องเป็นกระบวนท่า หรือกรงเล็บที่คริติคอลจนขาดใจ",
    bonus: { atk: 12, flee: 14, aspd: 0.07, crit: 0.015 }, growth: { atk: 0.62, flee: 0.52, maxHp: 3 }, glyph: "skull", color: "#a88cd8",
  },
  royal_guard: {
    name: "ราชองครักษ์", from: ["knight", "spellblade"], branches: ["royal_guard_shield", "royal_guard_hunt", "royal_guard_strike"],
    note: "องครักษ์เสื้อแพรแห่งราชสำนัก คุ้มกันด้วยโล่และระเบิดพลังใส่คู่ต่อสู้ ไล่ล่า จับกุม และปลดเกราะปลดอาวุธ หรือจู่โจมจากไกลด้วยปืนและธนู",
    bonus: { atk: 13, maxHp: 150, def: 7, hit: 6 }, growth: { atk: 0.7, maxHp: 5.6, def: 0.28 }, glyph: "person", color: "#e8c070",
  },
  alchemist: {
    name: "นักเล่นแร่แปรธาตุ", from: null, branches: ["alchemist_homunculus", "alchemist_bomb", "alchemist_synth"],
    note: "ผู้แปรสภาพสสาร สร้างโฮมุนครุสหลายแบบมาช่วยสู้ ปาระเบิดโลหะ หิน และโคลน หรือสังเคราะห์ธาตุเสริมพลังให้ทั้งทีม",
    bonus: { atk: 9, matk: 9, maxHp: 110, def: 5 }, growth: { atk: 0.46, matk: 0.46, maxHp: 4.2, def: 0.22 }, glyph: "drop", color: "#8ad8c8",
  },
  wuxia: {
    name: "จอมยุทธ์", from: null, branches: ["wuxia_sword", "wuxia_fist"],
    note: "ยอดฝีมือแห่งยุทธภพ กระบี่พเนจรที่ถือกระบี่เล่มเดียวแข็งแกร่งรอบด้าน หรือหมัดเปล่าที่เร็ว เคลื่อนไหวว่องไว และสวนกลับ",
    bonus: { atk: 11, flee: 10, maxHp: 110, aspd: 0.05 }, growth: { atk: 0.58, flee: 0.4, maxHp: 4.2 }, glyph: "sword", color: "#f0b080",
  },
  viking: {
    name: "นักรบไวกิ้ง", from: null, branches: ["viking_axe", "viking_mace"],
    note: "นักรบแห่งทะเลเหนือ ขวานที่คริติคอลหนักไม่สนเกราะและเปลี่ยนเลือดเป็นพลัง หรือกระบองที่ทุบให้มึนพร้อม HP และป้องกันสูง",
    bonus: { atk: 13, maxHp: 200, hpRegen: 2 }, growth: { atk: 0.68, maxHp: 7.2, def: 0.2 }, glyph: "rage", color: "#c8b8a0",
  },
  samurai: {
    name: "ซามูไร", from: null, branches: ["samurai_blade", "samurai_vanguard", "samurai_ranged"],
    note: "นักรบผู้ถือคติบูชิโด ดาบสองมือที่ฟันเร็วและฟื้นตัวไว แนวหน้าที่ยืนหยัดไม่ถอย หรือนักสู้ยืดหยุ่นที่ใช้ธนูและปืนรักษาระยะ",
    bonus: { atk: 12, maxHp: 140, hit: 8, crit: 0.01 }, growth: { atk: 0.64, maxHp: 5.2, hit: 0.3 }, glyph: "sword", color: "#e89a9a",
  },
  shaman: {
    name: "หมอผี", from: null, branches: ["shaman_consecrate", "shaman_summon"],
    note: "ผู้รู้แห่งโลกวิญญาณ ปลุกเสกตัวเองเข้าตะลุมบอนกับอันเดด ปีศาจ และผี หรืออัญเชิญผีและปีศาจมาช่วยสู้ด้วยเวทควันและเงา",
    bonus: { atk: 9, matk: 11, maxHp: 100, mdef: 6 }, growth: { atk: 0.46, matk: 0.56, maxHp: 3.8, mdef: 0.2 }, glyph: "cloud", color: "#c0a0d8",
  },
};

// A fourth job that can be taken: every branch written (none a stub).
export function job4Open(id: Job4Id): boolean {
  return JOBS4[id].branches.every((b) => TREES[b] && !TREES[b].stub);
}

// The fourth job's bonus and its growth since FOURTH_JOB_LEVEL (hero.ts adds them with the buffs).
export function job4Stats(p: { job4: Job4Id | null; level: number }): StatBag {
  const j = p.job4 ? JOBS4[p.job4] : null;
  if (!j) return {};
  const out: StatBag = { ...j.bonus };
  const k = Math.max(0, p.level - FOURTH_JOB_LEVEL);
  for (const [key, v = 0] of Object.entries(j.growth)) out[key] = (out[key] ?? 0) + v * k;
  return out;
}

// What to call a character: its third job, else its second, else its class.
export function jobName(p: { cls: ClassId | null; job: JobId | null; job3?: Job3Id | null }): string {
  return p.job3 ? JOBS3[p.job3].name : p.job ? JOBS[p.job].name : p.cls ? CLASSES[p.cls].name : "-";
}

// The emblem shown with that name: assets/skills/job_<id>.png for a job drawn already (JOB_ART),
// else class_<id>.png (null: no class). A third job not drawn yet has no picture: null, and
// jobGlyph gives the glyph to draw instead.
const JOB_ART = new Set<JobId | Job3Id>(["ranger", "swordsman", "wizard", "bishop", "battlemage", "warlord", "thief", "jester", "mercenary", "inventor",
  "knight", "hunter", "archmage", "assassin", "high_bishop", "monk", "spellblade", "sculptor", "magician", "historian", "shinobi"]);
export function jobIcon(p: { cls: ClassId | null; job: JobId | null; job3?: Job3Id | null }): string | null {
  if (p.job3) return JOB_ART.has(p.job3) ? `assets/skills/job_${p.job3}.png` : null;
  if (p.job && JOB_ART.has(p.job)) return `assets/skills/job_${p.job}.png`;
  return p.cls ? `assets/skills/class_${p.cls}.png` : null;
}
export function jobGlyph(p: { job3?: Job3Id | null }): [string, string] | null {
  return p.job3 && !JOB_ART.has(p.job3) ? [JOBS3[p.job3].glyph, JOBS3[p.job3].color] : null;
}

// The four elements a new character picks one of (the rest are found in the game).
export const FIRST_ELEMENTS = ["earth", "water", "wind", "fire"];

// ---- skill trees ----
// node: { id, name, kind: active|passive, max, pos (where it sits in the tree drawing),
//         req (nodes and ranks it needs first), glyph, desc(rank), stats(rank) for
//         passives, skill for actives (skills.ts) }
// skill: { type, stat: atk|matk, mult(rank), mp, cd, motion, cast?, ... } — see skills.js.

// Laid out like Ragnarok's skill windows: several starting skills per tree, each opening its own
// line, lines that need points in a neighbour, and levels of 1, 5 or 10.
// Few skills to a tree, more with every class: the rest of a character's strength comes from its
// masteries, elements and gear. TREE_SKILLS[n]: the skills in each tree of the n-th class (1: the
// class picked at the start, 2: the second job, 3: the third; 4 and 5 are the classes still to come).
export const TREE_SKILLS: Record<number, number> = { 1: 5, 2: 6, 3: 7, 4: 8, 5: 9 };
export const TREES: Record<string, Tree> = {
  arcane: {
    name: "เวทโจมตี", cls: "mage", color: "#8fb6ff", glyph: "bolt",
    note: "ยิงเวทใส่ศัตรูจากระยะไกล ลูกศรเวท ศรเพลิง ลูกไฟระเบิดเป็นวง ปิดท้ายด้วยอุกกาบาต",
    nodes: [
      { id: "arcane_focus", name: "สมาธิเวท", kind: "passive", max: 10, pos: [2, 0], glyph: "up",
        stats: (r) => ({ matkPct: 0.02 * r }), desc: (r) => `พลังเวท +${pct(0.02 * r)}` },
      { id: "magic_bolt", name: "ลูกศรเวท", kind: "active", max: 10, pos: [0, 0], glyph: "bolt",
        skill: { type: "bolt", stat: "matk", mult: lin(1.5, 0.15), mp: 6, cd: 1.2, motion: "cast", speed: 1100, range: 620, radius: 30, color: "#9cc4ff" },
        desc: (r) => `ยิงลูกเวทไปทางที่เล็ง ดาเมจ ${pct(lin(1.5, 0.15)(r))} ของพลังเวท` },
      { id: "fire_bolt", name: "ศรเพลิง", kind: "active", max: 10, pos: [1, 0], glyph: "flame",
        skill: { type: "bolt", stat: "matk", mult: lin(3.6, 0.36), mp: 12, cd: 2, cast: 1, motion: "cast", speed: 950, range: 560, radius: 36, color: "#ffb27a" },
        desc: (r) => `ร่ายลูกไฟแล้วยิงใส่เป้าหมาย ดาเมจ ${pct(lin(3.6, 0.36)(r))} ของพลังเวท` },
      { id: "fire_ball", name: "ลูกไฟระเบิด", kind: "active", max: 10, pos: [1, 1], req: [["fire_bolt", 4]], glyph: "burst",
        skill: { type: "blast", stat: "matk", mult: lin(4.2, 0.42), mp: 20, cd: 6, cast: 1.6, motion: "cast", range: 520, radius: 150, delay: 0.35, color: "#ff9a5a" },
        desc: (r) => `ระเบิดไฟตรงจุดที่เล็ง รัศมี 1.5 ม. ดาเมจ ${pct(lin(4.2, 0.42)(r))} ของพลังเวท` },
      { id: "meteor", name: "พายุอุกกาบาต", kind: "active", max: 5, pos: [1, 2], req: [["fire_ball", 5], ["magic_bolt", 5]], glyph: "burst",
        skill: { type: "blast", stat: "matk", mult: lin(3.8, 0.45), hits: 3, every: 0.3, mp: 45, cd: 18, cast: 3, motion: "cast", range: 560, radius: 200, delay: 0.6, stun: lin(0.5, 0.1), color: "#ff8a4a" },
        desc: (r) => `อุกกาบาต 3 ลูกตกใส่จุดที่เล็ง รัศมี 2 ม. ลูกละ ${pct(lin(3.8, 0.45)(r))} ของพลังเวท มึน ${lin(0.5, 0.1)(r).toFixed(1)} วิ` },
    ],
  },
  flora: {
    name: "เวทพฤกษา", cls: "mage", color: "#9df0b4", glyph: "flower",
    note: "เมล็ดพืช ฮีล ทุ่งดอกไม้ และพายุกลีบดอก ทนและเล่นได้นาน",
    nodes: [
      { id: "seed_shot", name: "เมล็ดพุ่ง", kind: "active", max: 10, pos: [0, 0], glyph: "leaf",
        skill: { type: "bolt", stat: "matk", mult: lin(1.3, 0.13), mp: 6, cd: 1.3, motion: "cast", speed: 1000, range: 580, radius: 28, color: "#a8f0a0" },
        desc: (r) => `ดีดเมล็ดพืชไปทางที่เล็ง ดาเมจ ${pct(lin(1.3, 0.13)(r))} ของพลังเวท` },
      { id: "bloom_heal", name: "พรแห่งพฤกษา", kind: "active", max: 10, pos: [1, 0], glyph: "heal",
        skill: { type: "heal", stat: "matk", mult: lin(0.8, 0.1), heal: lin(0.12, 0.015), mp: 16, cd: 6, motion: "cast", color: "#b9ffd0" },
        desc: (r) => `ฟื้น HP ${pct(lin(0.12, 0.015)(r))} ของ HP สูงสุด + ${pct(lin(0.8, 0.1)(r))} ของพลังเวท` },
      { id: "flower_field", name: "ทุ่งดอกไม้", kind: "active", max: 10, pos: [1, 1], req: [["bloom_heal", 3]], glyph: "flower",
        skill: { type: "flower", stat: "matk", mult: lin(0.6, 0.07), heal: lin(0.1, 0.012), mp: 25, cd: 9, cast: 1.5, motion: "cast", radius: 450, ticks: 4, color: "#b9ffd0" },
        desc: (r) => `ดอกไม้บานรอบตัวรัศมี 4.5 ม. ดาเมจ ${pct(lin(0.6, 0.07)(r))} ของพลังเวท 4 ครั้ง และฟื้น HP ${pct(lin(0.1, 0.012)(r))}` },
      { id: "deep_roots", name: "รากหยั่งลึก", kind: "passive", max: 10, pos: [2, 0], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.025 * r }), desc: (r) => `HP สูงสุด +${pct(0.025 * r)}` },
      { id: "petal_storm", name: "พายุกลีบดอก", kind: "active", max: 5, pos: [1, 2], req: [["flower_field", 5], ["seed_shot", 5]], glyph: "storm",
        skill: { type: "storm", stat: "matk", mult: lin(1.7, 0.2), pulses: 5, every: 0.25, mp: 40, cd: 18, cast: 1.5, motion: "cast", radius: 260, color: "#ffc8e8" },
        desc: (r) => `กลีบดอกหมุนรอบตัวรัศมี 2.6 ม. 5 ครั้ง ครั้งละ ${pct(lin(1.7, 0.2)(r))} ของพลังเวท` },
    ],
  },
  ward: {
    name: "เวทผนึก", cls: "mage", color: "#c9b8ff", glyph: "shield",
    note: "โล่ ผลักศัตรู หยุดเวลา เทเลพอร์ต เอาตัวรอดเก่ง",
    nodes: [
      { id: "mana_shield", name: "โล่มานา", kind: "active", max: 10, pos: [0, 0], glyph: "shield",
        skill: { type: "shield", stat: "matk", mult: lin(0.5, 0.08), base: lin(0.2, 0.03), mp: 15, cd: 12, motion: "cast", duration: 8, color: "#c9b8ff" },
        desc: (r) => `โล่ดูดซับ ${pct(lin(0.2, 0.03)(r))} ของ MP สูงสุด + ${pct(lin(0.5, 0.08)(r))} ของพลังเวท นาน 8 วิ` },
      { id: "repulse", name: "คลื่นผลัก", kind: "active", max: 10, pos: [1, 0], glyph: "wave",
        skill: { type: "nova", stat: "matk", mult: lin(1, 0.1), mp: 14, cd: 6, motion: "cast", radius: 220, knock: 160, color: "#d8ccff" },
        desc: (r) => `คลื่นรอบตัวรัศมี 2.2 ม. ผลักศัตรูกระเด็น ดาเมจ ${pct(lin(1, 0.1)(r))} ของพลังเวท` },
      { id: "mind_armor", name: "เกราะจิต", kind: "passive", max: 10, pos: [2, 0], glyph: "up",
        stats: (r) => ({ defPct: 0.03 * r, mdefPct: 0.03 * r }), desc: (r) => `ป้องกันและต้านเวท +${pct(0.03 * r)}` },
      { id: "blink", name: "เทเลพอร์ต", kind: "active", max: 1, pos: [3, 0], glyph: "dash",
        skill: { type: "dash", mp: 10, cd: 8, motion: "cast", distance: 320, color: "#e8e0ff" },
        desc: () => "หายตัวไปโผล่ทางที่เล็ง 3.2 ม. ผ่านศัตรูได้" },
      { id: "time_stop", name: "ผนึกกาลเวลา", kind: "active", max: 5, pos: [1, 1], req: [["repulse", 4], ["mana_shield", 3]], glyph: "freeze",
        skill: { type: "nova", stat: "matk", mult: lin(0.8, 0.1), mp: 30, cd: 16, motion: "cast", radius: 320, freeze: lin(2, 0.3), color: "#e2f0ff" },
        desc: (r) => `หยุดศัตรูรอบตัวรัศมี 3.2 ม. ${lin(2, 0.3)(r).toFixed(1)} วิ ดาเมจ ${pct(lin(0.8, 0.1)(r))} ของพลังเวท` },
    ],
  },
  berserker: {
    name: "ผู้ทำลาย", cls: "warrior", color: "#ff9a7a", glyph: "spin",
    note: "ฟันหนัก ฟันรอบตัว โทสะเพิ่มพลังโจมตี ปิดท้ายด้วยฟันประหาร",
    nodes: [
      { id: "bash", name: "ฟันกระแทก", kind: "active", max: 10, pos: [0, 0], glyph: "bash",
        skill: { type: "cone", stat: "atk", mult: lin(1.6, 0.2), mp: 6, cd: 1.5, motion: "swing", reach: 160, arc: 50, color: "#ffd0b8" },
        desc: (r) => `ฟันแรง ๆ ใส่ตัวข้างหน้า ดาเมจ ${pct(lin(1.6, 0.2)(r))} ของพลังโจมตี` },
      { id: "hot_blood", name: "เลือดเดือด", kind: "passive", max: 10, pos: [1, 0], glyph: "up",
        stats: (r) => ({ atkPct: 0.02 * r }), desc: (r) => `พลังโจมตี +${pct(0.02 * r)}` },
      { id: "whirlwind", name: "ฟันหมุน", kind: "active", max: 10, pos: [0, 1], req: [["bash", 3]], glyph: "spin",
        skill: { type: "nova", stat: "atk", mult: lin(1.6, 0.18), mp: 10, cd: 4, motion: "swing", radius: 190, color: "#ffd0b8" },
        desc: (r) => `ฟันรอบตัวรัศมี 1.9 ม. ดาเมจ ${pct(lin(1.6, 0.18)(r))} ของพลังโจมตี` },
      { id: "rage", name: "โทสะ", kind: "active", max: 5, pos: [1, 1], req: [["hot_blood", 5]], glyph: "rage",
        skill: { type: "buff", mp: 25, cd: 25, motion: "swing", duration: 8, buff: (r) => ({ atkPct: 0.2 + 0.05 * r, aspd: 0.15 }), color: "#ff8a6a" },
        desc: (r) => `8 วิ: พลังโจมตี +${pct(0.2 + 0.05 * r)} ความเร็วโจมตี +15%` },
      { id: "execute", name: "ฟันประหาร", kind: "active", max: 5, pos: [0, 2], req: [["whirlwind", 5], ["rage", 1]], glyph: "sword",
        skill: { type: "cone", stat: "atk", mult: lin(5, 0.7), mp: 30, cd: 15, motion: "swing", reach: 180, arc: 40, color: "#ff6a5a" },
        desc: (r) => `ฟันเต็มแรงใส่ตัวข้างหน้า ดาเมจ ${pct(lin(5, 0.7)(r))} ของพลังโจมตี` },
    ],
  },
  guardian: {
    name: "ผู้พิทักษ์", cls: "warrior", color: "#ffd98a", glyph: "shield",
    note: "ป้องกันหนา ฟื้นตัวเร็ว ทำให้ศัตรูมึน ใช้โล่เป็นอาวุธ",
    nodes: [
      { id: "fortify", name: "ยืนหยัด", kind: "active", max: 10, pos: [0, 0], glyph: "shield",
        skill: { type: "buff", mp: 12, cd: 14, motion: "thrust", duration: 8, heal: lin(0.04, 0.006), buff: (r) => ({ defPct: 0.2 + 0.04 * r, mdefPct: 0.1 + 0.03 * r }), color: "#ffe2a0" },
        desc: (r) => `8 วิ: ป้องกัน +${pct(0.2 + 0.04 * r)} ต้านเวท +${pct(0.1 + 0.03 * r)} และฟื้น HP ${pct(lin(0.04, 0.006)(r))}` },
      { id: "iron_skin", name: "ผิวเหล็ก", kind: "passive", max: 10, pos: [1, 0], glyph: "up",
        stats: (r) => ({ defPct: 0.03 * r, maxHpPct: 0.02 * r }), desc: (r) => `ป้องกัน +${pct(0.03 * r)} HP สูงสุด +${pct(0.02 * r)}` },
      { id: "shield_bash", name: "กระแทกโล่", kind: "active", max: 10, pos: [2, 0], glyph: "bash",
        skill: { type: "cone", stat: "atk", mult: lin(1.5, 0.15), mp: 10, cd: 6, motion: "thrust", reach: 140, arc: 70, stun: lin(1, 0.1), color: "#ffe9b8" },
        desc: (r) => `กระแทกด้านหน้า ดาเมจ ${pct(lin(1.5, 0.15)(r))} ของพลังโจมตี มึน ${lin(1, 0.1)(r).toFixed(1)} วิ` },
      { id: "war_cry", name: "คำรามศึก", kind: "active", max: 5, pos: [1, 1], req: [["iron_skin", 3]], glyph: "cry",
        skill: { type: "buff", mp: 30, cd: 30, motion: "swing", duration: 10, heal: lin(0.15, 0.02), buff: (r) => ({ dmgRed: 0.15 + 0.03 * r }), color: "#ffd070" },
        desc: (r) => `10 วิ: ลดความเสียหายที่ได้รับ ${pct(0.15 + 0.03 * r)} และฟื้น HP ${pct(lin(0.15, 0.02)(r))}` },
      { id: "guardian_cross", name: "กางเขนผู้พิทักษ์", kind: "active", max: 5, pos: [2, 1], req: [["shield_bash", 5]], glyph: "star",
        skill: { type: "nova", stat: "atk", mult: lin(3, 0.4), stun: lin(1, 0.1), mp: 40, cd: 18, motion: "thrust", radius: 240, color: "#fff0b0" },
        desc: (r) => `แสงกางเขนรอบตัวรัศมี 2.4 ม. ดาเมจ ${pct(lin(3, 0.4)(r))} ของพลังโจมตี มึน ${lin(1, 0.1)(r).toFixed(1)} วิ` },
    ],
  },
  duelist: {
    name: "นักดาบพริ้ว", cls: "warrior", color: "#9ff0ff", glyph: "dash",
    note: "พุ่งเข้าออกเร็ว ฟันหลายครั้ง คริติคอลถี่ ลอบสังหาร",
    nodes: [
      { id: "dash_strike", name: "พุ่งแทง", kind: "active", max: 10, pos: [0, 0], glyph: "dash",
        skill: { type: "dash", stat: "atk", mult: lin(1.6, 0.15), mp: 10, cd: 5, motion: "thrust", distance: 260, width: 70, color: "#c8f8ff" },
        desc: (r) => `พุ่งไปทางที่เล็ง 2.6 ม. ฟันทุกตัวที่ผ่าน ดาเมจ ${pct(lin(1.6, 0.15)(r))} ของพลังโจมตี` },
      { id: "twin_slash", name: "ฟันคู่", kind: "active", max: 10, pos: [1, 0], glyph: "twin",
        skill: { type: "cone", stat: "atk", mult: lin(1.2, 0.1), hits: 2, mp: 8, cd: 3, motion: "swing", reach: 150, arc: 110, color: "#d8fbff" },
        desc: (r) => `ฟันด้านหน้า 2 ครั้ง ครั้งละ ${pct(lin(1.2, 0.1)(r))} ของพลังโจมตี` },
      { id: "vital_point", name: "จุดตาย", kind: "passive", max: 10, pos: [2, 0], glyph: "pierce",
        stats: (r) => ({ crit: 0.01 * r }), desc: (r) => `โอกาสคริติคอล +${pct(0.01 * r)}` },
      { id: "assassinate", name: "ลอบสังหาร", kind: "active", max: 5, pos: [0, 1], req: [["dash_strike", 5], ["vital_point", 3]], glyph: "pierce",
        skill: { type: "dash", stat: "atk", mult: lin(4, 0.5), mp: 28, cd: 14, motion: "thrust", distance: 220, width: 60, color: "#d0c0ff" },
        desc: (r) => `พุ่งทะลุไปทางที่เล็ง 2.2 ม. ดาเมจ ${pct(lin(4, 0.5)(r))} ของพลังโจมตี` },
      { id: "blade_storm", name: "พายุดาบ", kind: "active", max: 5, pos: [1, 1], req: [["twin_slash", 5]], glyph: "storm",
        skill: { type: "storm", stat: "atk", mult: lin(0.9, 0.12), pulses: 5, every: 0.2, mp: 30, cd: 18, motion: "swing", radius: 200, color: "#e0fbff" },
        desc: (r) => `ฟันรอบตัว 5 ครั้งใน 1 วิ ครั้งละ ${pct(lin(0.9, 0.12)(r))} ของพลังโจมตี` },
    ],
  },
  // ---- archer: arrows from afar, atk based ----
  marksman: {
    name: "ธนูทำลาย", cls: "archer", color: "#ffcf7a", glyph: "arrow",
    note: "สายโจมตีด้วยสกิล ยิงแรงจากระยะไกล ยิงสองดอก ศรทะลวง ห่าธนู และศรพิฆาต",
    nodes: [
      { id: "aim_focus", name: "สมาธินักแม่นธนู", kind: "passive", max: 10, pos: [2, 0], glyph: "up",
        stats: (r) => ({ atkPct: 0.02 * r, hit: 3 * r }), desc: (r) => `พลังโจมตี +${pct(0.02 * r)} ความแม่นยำ +${3 * r}` },
      { id: "double_strafe", name: "ยิงสองดอก", kind: "active", max: 10, pos: [0, 0], glyph: "arrow",
        skill: { type: "bolt", stat: "atk", mult: lin(1, 0.1), hits: 2, every: 0.12, arrow: true, mp: 6, cd: 1.5, motion: "shoot", speed: 1500, range: 700, radius: 26, color: "#fff2c8" },
        desc: (r) => `ยิงลูกธนู 2 ดอกติดกันไปทางที่เล็ง ดอกละ ${pct(lin(1, 0.1)(r))} ของพลังโจมตี` },
      { id: "piercing_arrow", name: "ศรทะลวง", kind: "active", max: 10, pos: [0, 1], req: [["double_strafe", 3]], glyph: "pierce",
        skill: { type: "bolt", stat: "atk", mult: lin(1.6, 0.16), arrow: true, pierce: true, mp: 10, cd: 3, motion: "shoot", speed: 1600, range: 760, radius: 30, color: "#ffe6a0" },
        desc: (r) => `ยิงศรทะลุทุกตัวในแนว 7.6 ม. ดาเมจ ${pct(lin(1.6, 0.16)(r))} ของพลังโจมตี` },
      { id: "arrow_shower", name: "ห่าธนู", kind: "active", max: 10, pos: [1, 0], glyph: "burst",
        skill: { type: "blast", stat: "atk", mult: lin(1.2, 0.12), mp: 14, cd: 5, motion: "shoot", range: 650, radius: 170, delay: 0.3, color: "#ffd890" },
        desc: (r) => `ลูกธนูโปรยลงตรงจุดที่เล็ง รัศมี 1.7 ม. ดาเมจ ${pct(lin(1.2, 0.12)(r))} ของพลังโจมตี` },
      { id: "sharp_shooting", name: "ศรพิฆาต", kind: "active", max: 5, pos: [0, 2], req: [["piercing_arrow", 5], ["aim_focus", 5]], glyph: "beam",
        skill: { type: "beam", stat: "atk", mult: lin(4, 0.5), mp: 40, cd: 15, motion: "shoot", length: 900, width: 70, color: "#fff0b0" },
        desc: (r) => `ศรแสงยาว 9 ม. ทะลุทุกตัว ดาเมจ ${pct(lin(4, 0.5)(r))} ของพลังโจมตี` },
    ],
  },
  rapid: {
    name: "ธนูพายุ", cls: "archer", color: "#a8f0c8", glyph: "wing",
    note: "สายโจมตีเร็ว ยิงรัว ยิงซ้อน ตีปกติถี่ขึ้น เคลื่อนที่ไว",
    nodes: [
      { id: "quick_draw", name: "ง้างไว", kind: "passive", max: 10, pos: [0, 0], glyph: "up",
        stats: (r) => ({ aspd: 0.015 * r }), desc: (r) => `ความเร็วโจมตี +${pct(0.015 * r)}` },
      { id: "double_shot", name: "ยิงซ้อน", kind: "passive", max: 10, pos: [1, 0], glyph: "twin",
        stats: (r) => ({ multiShot: 0.03 * r }), desc: (r) => `ยิงธนูปกติมีโอกาส ${pct(0.03 * r)} ยิงซ้อนอีกดอก` },
      { id: "rapid_fire", name: "ยิงรัว", kind: "active", max: 10, pos: [2, 0], glyph: "arrow",
        skill: { type: "bolt", stat: "atk", mult: lin(0.8, 0.08), hits: 3, every: 0.1, arrow: true, mp: 8, cd: 2.5, motion: "shoot", speed: 1700, range: 700, radius: 26, color: "#e0fff0" },
        desc: (r) => `ยิงรัว 3 ดอก ดอกละ ${pct(lin(0.8, 0.08)(r))} ของพลังโจมตี` },
      { id: "focus_fire", name: "สมาธิยิงรัว", kind: "active", max: 10, pos: [0, 1], req: [["quick_draw", 3]], glyph: "eye",
        skill: { type: "buff", mp: 15, cd: 30, motion: "shoot", duration: 15, buff: (r) => ({ aspd: 0.1 + 0.02 * r, atkPct: 0.02 * r }), color: "#c8ffe0" },
        desc: (r) => `15 วิ: ความเร็วโจมตี +${pct(0.1 + 0.02 * r)} พลังโจมตี +${pct(0.02 * r)}` },
      { id: "arrow_ring", name: "ศรรอบทิศ", kind: "active", max: 5, pos: [1, 1], req: [["rapid_fire", 5], ["double_shot", 3]], glyph: "spin",
        skill: { type: "fan", stat: "atk", mult: lin(0.9, 0.12), count: 12, spread: 330, arrow: true, mp: 36, cd: 14, motion: "shoot", speed: 1500, range: 600, radius: 28, color: "#e0fff0" },
        desc: (r) => `ยิง 12 ดอกออกรอบตัว ดอกละ ${pct(lin(0.9, 0.12)(r))} ของพลังโจมตี` },
    ],
  },
  hunter: {
    name: "ธนูพราน", cls: "archer", color: "#c8a8ff", glyph: "target",
    note: "สายสนับสนุน ยิงติดดีบัฟ: พิษ ถ่วง ทำลายเกราะ หมอกพิษ และศรพิพากษา",
    nodes: [
      { id: "poison_arrow", name: "ศรพิษ", kind: "active", max: 10, pos: [0, 0], glyph: "drop",
        skill: { type: "bolt", stat: "atk", mult: lin(1, 0.1), poison: lin(0.6, 0.06), arrow: true, mp: 8, cd: 3, motion: "shoot", speed: 1500, range: 700, radius: 26, color: "#9ee870" },
        desc: (r) => `ยิงศรอาบพิษ ดาเมจ ${pct(lin(1, 0.1)(r))} ของพลังโจมตี แล้วพิษกัดอีก ${pct(lin(0.6, 0.06)(r))} ของดาเมจใน 4 วิ` },
      { id: "slow_arrow", name: "ศรถ่วง", kind: "active", max: 10, pos: [1, 0], glyph: "swirl",
        skill: { type: "bolt", stat: "atk", mult: lin(1.1, 0.1), slow: lin(2, 0.25), arrow: true, mp: 7, cd: 3, motion: "shoot", speed: 1500, range: 700, radius: 26, color: "#9ccfff" },
        desc: (r) => `ยิงศรถ่วงขา ดาเมจ ${pct(lin(1.1, 0.1)(r))} ของพลังโจมตี ศัตรูช้าลง ${lin(2, 0.25)(r).toFixed(1)} วิ` },
      { id: "toxic_cloud", name: "หมอกพิษ", kind: "active", max: 5, pos: [0, 1], req: [["poison_arrow", 4]], glyph: "storm",
        skill: { type: "blast", stat: "atk", mult: lin(0.6, 0.08), poison: lin(0.5, 0.08), hits: 3, every: 0.5, mp: 22, cd: 10, motion: "shoot", range: 650, radius: 200, delay: 0.3, color: "#8ee070" },
        desc: (r) => `ศรระเบิดเป็นหมอกพิษรัศมี 2 ม. 3 ระลอก ระลอกละ ${pct(lin(0.6, 0.08)(r))} ของพลังโจมตี และพิษ ${pct(lin(0.5, 0.08)(r))} ของดาเมจ` },
      { id: "armor_break", name: "ศรทำลายเกราะ", kind: "active", max: 10, pos: [2, 0], glyph: "target",
        skill: { type: "bolt", stat: "atk", mult: lin(1.2, 0.12), expose: lin(0.12, 0.02), debuff: 8, arrow: true, mp: 12, cd: 6, motion: "shoot", speed: 1500, range: 700, radius: 26, color: "#ff9a7a" },
        desc: (r) => `ยิงเจาะเกราะ ดาเมจ ${pct(lin(1.2, 0.12)(r))} ของพลังโจมตี ศัตรูโดนแรงขึ้น ${pct(lin(0.12, 0.02)(r))} 8 วิ` },
      { id: "doom_arrow", name: "ศรพิพากษา", kind: "active", max: 5, pos: [2, 1], req: [["armor_break", 5], ["slow_arrow", 3]], glyph: "arrow",
        skill: { type: "bolt", stat: "atk", mult: lin(2.6, 0.35), expose: () => 0.25, weaken: () => 0.2, stun: () => 1, debuff: 10, arrow: true, pierce: true, mp: 36, cd: 16, motion: "shoot", speed: 1700, range: 760, radius: 34, color: "#ff8a6a" },
        desc: (r) => `ศรทะลุทุกตัวในแนว ดาเมจ ${pct(lin(2.6, 0.35)(r))} ของพลังโจมตี มึน 1 วิ โดนแรงขึ้น 25% ตีเบาลง 20% นาน 10 วิ` },
    ],
  },
  // ---- priest: heals and blessings with holy magic, a mace for the fight ----
  restore: {
    name: "เวทฟื้นฟู", cls: "priest", color: "#fff0a8", glyph: "heal",
    note: "สายฮีล ฟื้น HP แรง ฟื้นฟูต่อเนื่อง และปาฏิหาริย์ ยืนระยะได้นานที่สุด",
    nodes: [
      { id: "holy_heal", name: "ฮีล", kind: "active", max: 10, pos: [0, 0], glyph: "heal",
        skill: { type: "heal", stat: "matk", mult: lin(1.2, 0.15), heal: lin(0.1, 0.012), mp: 12, cd: 3, motion: "cast", color: "#fff6c8" },
        desc: (r) => `ฟื้น HP ${pct(lin(0.1, 0.012)(r))} ของ HP สูงสุด + ${pct(lin(1.2, 0.15)(r))} ของพลังเวท` },
      { id: "devotion", name: "ศรัทธาแรงกล้า", kind: "passive", max: 10, pos: [1, 0], glyph: "heart",
        stats: (r) => ({ healPct: 0.04 * r }), desc: (r) => `สกิลรักษาแรงขึ้น ${pct(0.04 * r)}` },
      { id: "renew", name: "ฟื้นฟูต่อเนื่อง", kind: "active", max: 10, pos: [2, 0], glyph: "leaf",
        skill: { type: "buff", mp: 14, cd: 15, motion: "cast", duration: 12, buff: (r) => ({ hpRegen: 3 + 2.5 * r }), color: "#f8ffd0" },
        desc: (r) => `12 วิ: ฟื้น HP +${(3 + 2.5 * r).toFixed(1)}/วิ` },
      { id: "greater_heal", name: "ฮีลใหญ่", kind: "active", max: 5, pos: [0, 1], req: [["holy_heal", 5]], glyph: "heal",
        skill: { type: "heal", stat: "matk", mult: lin(2.5, 0.3), heal: lin(0.25, 0.03), mp: 30, cd: 10, motion: "cast", color: "#fffbe0" },
        desc: (r) => `ฟื้น HP ${pct(lin(0.25, 0.03)(r))} ของ HP สูงสุด + ${pct(lin(2.5, 0.3)(r))} ของพลังเวท` },
      { id: "miracle", name: "ปาฏิหาริย์", kind: "active", max: 5, pos: [0, 2], req: [["greater_heal", 3], ["devotion", 5]], glyph: "star",
        skill: { type: "buff", mp: 50, cd: 45, motion: "cast", duration: 6, heal: lin(0.5, 0.1), buff: (r) => ({ dmgRed: 0.2 + 0.04 * r, hpRegen: 20 }), color: "#fffbe0" },
        desc: (r) => `ฟื้น HP ทันที ${pct(lin(0.5, 0.1)(r))} แล้ว 6 วิ: ลดความเสียหาย ${pct(0.2 + 0.04 * r)} ฟื้น HP +20/วิ` },
    ],
  },
  blessing: {
    name: "เวทสนับสนุน", cls: "priest", color: "#a8d8ff", glyph: "up",
    note: "สายบัฟ เพิ่มพลังโจมตี ความเร็ว และเกราะ บัฟอยู่ได้นาน ปิดท้ายด้วยพรสูงสุด",
    nodes: [
      { id: "bless", name: "อวยพร", kind: "active", max: 10, pos: [0, 0], glyph: "up",
        skill: { type: "buff", mp: 15, cd: 40, motion: "cast", duration: 180, buff: (r) => ({ atkPct: 0.02 * r, matkPct: 0.02 * r }), color: "#d8ecff" },
        desc: (r) => `3 นาที: พลังโจมตีและพลังเวท +${pct(0.02 * r)}` },
      { id: "agility_up", name: "เพิ่มความคล่อง", kind: "active", max: 10, pos: [1, 0], glyph: "wing",
        skill: { type: "buff", mp: 15, cd: 40, motion: "cast", duration: 180, buff: (r) => ({ aspd: 0.015 * r, move: 0.02 * r, flee: 2 * r }), color: "#d8ffe8" },
        desc: (r) => `3 นาที: ความเร็วโจมตี +${pct(0.015 * r)} ความเร็วเดิน +${pct(0.02 * r)} หลบหลีก +${2 * r}` },
      { id: "angelus", name: "เกราะเทวา", kind: "active", max: 10, pos: [2, 0], glyph: "shield",
        skill: { type: "buff", mp: 18, cd: 40, motion: "cast", duration: 180, buff: (r) => ({ defPct: 0.04 * r, mdefPct: 0.03 * r }), color: "#e8f0ff" },
        desc: (r) => `3 นาที: ป้องกัน +${pct(0.04 * r)} ต้านเวท +${pct(0.03 * r)}` },
      { id: "buff_lore", name: "ผู้รู้แห่งพร", kind: "passive", max: 5, pos: [3, 0], glyph: "star",
        stats: (r) => ({ buffTime: 0.1 * r }), desc: (r) => `บัฟทุกอย่างอยู่นานขึ้น ${pct(0.1 * r)}` },
      { id: "benediction", name: "พรสูงสุด", kind: "active", max: 5, pos: [1, 1], req: [["bless", 5], ["agility_up", 3]], glyph: "star",
        skill: { type: "buff", mp: 60, cd: 90, motion: "cast", duration: 120, heal: () => 0.2, buff: (r) => ({ atkPct: 0.1 + 0.03 * r, matkPct: 0.1 + 0.03 * r, aspd: 0.1, move: 0.1, dmgRed: 0.1 }), color: "#fffbe0" },
        desc: (r) => `2 นาที: พลังโจมตีและพลังเวท +${pct(0.1 + 0.03 * r)} ความเร็วโจมตีและเดิน +10% ลดความเสียหาย 10% และฟื้น HP ทันที 20%` },
    ],
  },
  crusade: {
    name: "นักบวชนักรบ", cls: "priest", color: "#ffd890", glyph: "cross",
    note: "สายต่อสู้ ทุบด้วยกระบอง ลงทัณฑ์ด้วยเวทศักดิ์สิทธิ์ ทำให้ศัตรูมึน",
    nodes: [
      { id: "holy_strike", name: "ทุบศักดิ์สิทธิ์", kind: "active", max: 10, pos: [0, 0], glyph: "bash",
        skill: { type: "cone", stat: "atk", mult: lin(1.6, 0.18), mp: 7, cd: 1.6, motion: "thrust", reach: 160, arc: 70, color: "#fff0b0" },
        desc: (r) => `ทุบตัวข้างหน้าด้วยกระบองอาบแสง ดาเมจ ${pct(lin(1.6, 0.18)(r))} ของพลังโจมตี` },
      { id: "holy_light", name: "แสงศักดิ์สิทธิ์", kind: "active", max: 10, pos: [1, 0], glyph: "bolt",
        skill: { type: "bolt", stat: "matk", mult: lin(1.5, 0.15), mp: 7, cd: 1.4, motion: "cast", speed: 1100, range: 620, radius: 30, color: "#fff8d0" },
        desc: (r) => `ยิงลูกแสงไปทางที่เล็ง ดาเมจ ${pct(lin(1.5, 0.15)(r))} ของพลังเวท` },
      { id: "mace_training", name: "ชำนาญกระบอง", kind: "passive", max: 10, pos: [2, 0], glyph: "up",
        stats: (r) => ({ atkPct: 0.02 * r, defPct: 0.01 * r }), desc: (r) => `พลังโจมตี +${pct(0.02 * r)} ป้องกัน +${pct(0.01 * r)}` },
      { id: "smite", name: "ทุบลงทัณฑ์", kind: "active", max: 10, pos: [0, 1], req: [["holy_strike", 4]], glyph: "slam",
        skill: { type: "cone", stat: "atk", mult: lin(2.2, 0.25), stun: lin(1, 0.1), mp: 14, cd: 6, motion: "thrust", reach: 170, arc: 80, color: "#ffe8a0" },
        desc: (r) => `ทุบหนักด้านหน้า ดาเมจ ${pct(lin(2.2, 0.25)(r))} ของพลังโจมตี มึน ${lin(1, 0.1)(r).toFixed(1)} วิ` },
      { id: "divine_wrath", name: "พิโรธสวรรค์", kind: "active", max: 5, pos: [1, 2], req: [["smite", 5], ["mace_training", 5]], glyph: "storm",
        skill: { type: "storm", stat: "atk", mult: lin(1.4, 0.2), pulses: 4, every: 0.3, mp: 38, cd: 16, motion: "thrust", radius: 230, color: "#ffe8a0" },
        desc: (r) => `ฟาดกระบองแสงรอบตัวรัศมี 2.3 ม. 4 ครั้ง ครั้งละ ${pct(lin(1.4, 0.2)(r))} ของพลังโจมตี` },
    ],
  },
  // opened by a skill book, for any class
  survivor: {
    name: "ผู้รอดชีวิต", cls: null, book: "book_survivor", color: "#e6d3a3", glyph: "heart",
    note: "สายเอาตัวรอดของนักเดินทาง ใช้ได้ทุกคลาส",
    nodes: [
      { id: "first_aid", name: "ปฐมพยาบาล", kind: "active", max: 5, pos: [0, 0], glyph: "heal",
        skill: { type: "heal", stat: "atk", mult: lin(0.4, 0.1), heal: lin(0.15, 0.03), mp: 10, cd: 10, motion: "cast", color: "#f4e6bf" },
        desc: (r) => `ฟื้น HP ${pct(lin(0.15, 0.03)(r))} ของ HP สูงสุด` },
      { id: "tough", name: "ทรหด", kind: "passive", max: 10, pos: [1, 0], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.02 * r, maxMpPct: 0.02 * r }), desc: (r) => `HP และ MP สูงสุด +${pct(0.02 * r)}` },
      { id: "keen_eye", name: "สายตานักเดินทาง", kind: "passive", max: 5, pos: [2, 0], glyph: "eye",
        stats: (r) => ({ xpPct: 0.05 * r }), desc: (r) => `ค่าประสบการณ์ที่ได้ +${pct(0.05 * r)}` },
      { id: "camping", name: "ตั้งแคมป์", kind: "passive", max: 5, pos: [0, 1], req: [["first_aid", 3]], glyph: "leaf",
        stats: (r) => ({ hpRegen: 1 * r, mpRegen: 0.5 * r }), desc: (r) => `ฟื้น HP +${r}/วิ ฟื้น MP +${(0.5 * r).toFixed(1)}/วิ` },
      { id: "sprint", name: "วิ่งสุดแรง", kind: "active", max: 1, pos: [1, 1], req: [["tough", 3]], glyph: "dash",
        skill: { type: "buff", mp: 10, cd: 20, motion: "cast", duration: 6, buff: () => ({ move: 0.35 }), color: "#f4e6bf" },
        desc: () => "6 วิ: ความเร็วเดิน +35%" },
      { id: "scavenger", name: "นักเก็บของ", kind: "passive", max: 5, pos: [2, 1], req: [["keen_eye", 3]], glyph: "star",
        stats: (r) => ({ drop: 0.05 * r }), desc: (r) => `โอกาสได้ของ +${pct(0.05 * r)}` },
    ],
  },
};

// ---- masteries ----
// Weapon masteries cover weapon types (items.js). Each weapon grows its own way: every level adds
// its own stats (the ones the profile shows: attack, aim, defence...), and set levels open
// passives (5, 10, 20, 30) and an active (15) that need that weapon in hand. The line stops at
// MASTERY_MAX until the mastery's second book (MASTERY_MAX2) opens 40, 50 and 60. The active
// grows with the mastery: 3% more damage for every level.
export const MASTERY_MAX = 30;
export const MASTERY_MAX2 = 60;
type RewardSpec = Omit<MasteryReward, "at" | "kind">;
interface WeaponLine {
  per: StatBag;
  perDesc: string;
  p5: RewardSpec;
  p10: RewardSpec;
  s15: RewardSpec;
  p20: RewardSpec;
  p30: RewardSpec;
  p40: RewardSpec;
  p50: RewardSpec;
  p60: RewardSpec;
}
const weaponMastery = (name: string, weapons: WeaponId[], glyph: string, w: WeaponLine): Mastery => ({
  name, kind: "weapon", weapons, glyph, max: MASTERY_MAX, max2: MASTERY_MAX2, per: w.per, perDesc: `${w.perDesc} ต่อระดับ เมื่อถือ${name}`,
  rewards: [
    { at: 5, kind: "passive", ...w.p5 },
    { at: 10, kind: "passive", glyph: "up", ...w.p10 },
    { at: 15, kind: "active", ...w.s15, skill: { ...w.s15.skill!, masteryScale: 0.03 }, desc: `${w.s15.desc} แรงขึ้น 3% ต่อระดับความเชี่ยวชาญ` },
    { at: 20, kind: "passive", glyph: "swirl", ...w.p20 },
    { at: 30, kind: "passive", glyph: "star", ...w.p30 },
    { at: 40, kind: "passive", glyph: "up", ...w.p40 },
    { at: 50, kind: "passive", glyph: "swirl", ...w.p50 },
    { at: 60, kind: "passive", glyph: "star", ...w.p60 },
  ],
});

// A craft (workshop.ts): its levels open the gear tiers it makes (CRAFT_TIER_AT: tier 30 at level 1,
// 60 at 5 ... 180 at 25), and every level makes a piece likelier to come out +1 and refining what
// it makes surer. Level 1 brings a skill that opens the workshop's crafting anywhere, level 3 one
// that refines what the craft makes anywhere, both without the smiths' fees.
export const CRAFT_MAX = 30;
export const CRAFT_TIER_AT: Record<number, number> = { 30: 1, 60: 5, 90: 10, 120: 15, 150: 20, 180: 25 };
export const CRAFT_BONUS = 0.01;   // a level: the chance a made piece comes out +1
export const CRAFT_REFINE = 0.005; // a level: the chance refining what the craft makes succeeds
function craftMastery(id: string, name: string, glyph: string, what: string, make: string, refine: string): Mastery {
  const bench = (tab: "craft" | "refine"): SkillDef => ({ type: "workshop", mp: 0, cd: 2, motion: "cast", bench: { tab, craft: id }, color: "#ffd8a0" });
  return {
    name, kind: "life", glyph, max: CRAFT_MAX, per: {},
    perDesc: `ของที่สร้างออกมาเป็น +1 ได้ 1% ต่อระดับ · ตีบวก${what}สำเร็จง่ายขึ้น 0.5% ต่อระดับ`,
    rewards: [
      { at: 1, kind: "active", id: `${id}_make`, name: make, glyph, skill: bench("craft"),
        desc: `เปิดโรงช่างได้ทุกที่ สร้าง${what}จากวัตถุดิบโดยไม่เสียค่าจ้างช่าง (เลเวล 30 ก่อน ได้เลเวลสูงขึ้นตามระดับ) ของที่สร้างมีชื่อเจ้า` },
      { at: 3, kind: "active", id: `${id}_refine`, name: refine, glyph: "up", skill: bench("refine"),
        desc: `ตีบวก${what}ได้ทุกที่ ใช้แค่หิน ไม่เสียค่าจ้างช่าง` },
      ...Object.entries(CRAFT_TIER_AT).filter(([, at]) => at > 1).map(([tier, at]) =>
        ({ at, kind: "passive" as const, name: `ช่างเลเวล ${tier}`, glyph: "up", desc: `สร้าง${what}เลเวล ${tier} ได้` })),
    ],
  };
}

export const MASTERIES: Record<string, Mastery> = {
  // all round: damage, aim and a little of everything
  sword: weaponMastery("ดาบ", ["sword_1h", "sword_2h"], "sword", {
    per: { atk: 2.2, hit: 1.5, crit: 0.0015 }, perDesc: "พลังโจมตี +2.2 ความแม่นยำ +1.5 โอกาสคริติคอล +0.15%",
    p5: { name: "คมดาบ", stats: { crit: 0.04 }, desc: "โอกาสคริติคอล +4% เมื่อถือดาบ" },
    p10: { name: "ฝีมือดาบ", stats: { atkPct: 0.08, hit: 15 }, desc: "พลังโจมตี +8% ความแม่นยำ +15 เมื่อถือดาบ" },
    s15: { id: "sword_wave", name: "คลื่นดาบ", glyph: "wave",
      skill: { type: "bolt", stat: "atk", mult: () => 3.2, pierce: true, mp: 12, cd: 6, motion: "swing", speed: 900, range: 520, radius: 50, color: "#e6f4ff" },
      desc: "ฟันคลื่นดาบทะลุทุกตัว ดาเมจ 320% ของพลังโจมตี" },
    p20: { name: "ดาบคู่กาย", stats: { aspd: 0.08, crit: 0.03 }, desc: "ความเร็วโจมตี +8% โอกาสคริติคอล +3% เมื่อถือดาบ" },
    p30: { name: "ปรมาจารย์ดาบ", stats: { atkPct: 0.12, critDmg: 0.25 }, desc: "พลังโจมตี +12% แรงคริติคอล +25% เมื่อถือดาบ" },
    p40: { name: "ดาบไร้เงา", stats: { aspd: 0.06, hit: 20 }, desc: "ความเร็วโจมตี +6% ความแม่นยำ +20 เมื่อถือดาบ" },
    p50: { name: "จิตแห่งดาบ", stats: { crit: 0.03, critDmg: 0.2 }, desc: "โอกาสคริติคอล +3% แรงคริติคอล +20% เมื่อถือดาบ" },
    p60: { name: "เทพดาบ", stats: { atkPct: 0.15, critDmg: 0.3, dmg: 0.1 }, desc: "พลังโจมตี +15% แรงคริติคอล +30% ดาเมจ +10% เมื่อถือดาบ" },
  }),
  // slow and brutal: the hardest criticals, and cuts through armour
  axe: weaponMastery("ขวาน", ["axe", "axe_2h"], "axe", {
    per: { atk: 3, critDmg: 0.015 }, perDesc: "พลังโจมตี +3 แรงคริติคอล +1.5%",
    p5: { name: "น้ำหนักขวาน", stats: { critDmg: 0.3 }, desc: "แรงคริติคอล +30% เมื่อถือขวาน" },
    p10: { name: "ผ่าฟืน", stats: { crit: 0.03 }, desc: "โอกาสคริติคอล +3% เมื่อถือขวาน" },
    s15: { id: "axe_spin", name: "ขวานพายุ", glyph: "spin",
      skill: { type: "nova", stat: "atk", mult: () => 3.8, mp: 15, cd: 7, motion: "swing", radius: 180, color: "#ffd9b0" },
      desc: "หมุนขวานรอบตัว ดาเมจ 380% ของพลังโจมตี" },
    p20: { name: "ขวานผ่าเกราะ", stats: { pierce: 0.15 }, desc: "เจาะเกราะ +15% เมื่อถือขวาน" },
    p30: { name: "เจ้าแห่งขวาน", stats: { atkPct: 0.15, critDmg: 0.35 }, desc: "พลังโจมตี +15% แรงคริติคอล +35% เมื่อถือขวาน" },
    p40: { name: "แขนเหล็ก", stats: { atkPct: 0.06, critDmg: 0.2 }, desc: "พลังโจมตี +6% แรงคริติคอล +20% เมื่อถือขวาน" },
    p50: { name: "ผ่าภูผา", stats: { pierce: 0.1, crit: 0.02 }, desc: "เจาะเกราะ +10% โอกาสคริติคอล +2% เมื่อถือขวาน" },
    p60: { name: "ราชันขวาน", stats: { atkPct: 0.15, critDmg: 0.4 }, desc: "พลังโจมตี +15% แรงคริติคอล +40% เมื่อถือขวาน" },
  }),
  // sturdy: stuns, toughness and blows that go through
  mace: weaponMastery("ค้อน", ["mace"], "mace", {
    per: { atk: 1.8, def: 1.2 }, perDesc: "พลังโจมตี +1.8 ป้องกัน +1.2",
    p5: { name: "แรงกระแทก", stats: { stunHit: 0.15 }, desc: "ตีปกติมีโอกาส 15% ทำให้มึน 1 วิ เมื่อถือค้อน" },
    p10: { name: "มือหนัก", stats: { stunHit: 0.08, maxHpPct: 0.05 }, desc: "โอกาสตีให้มึน +8% HP สูงสุด +5% เมื่อถือค้อน" },
    s15: { id: "mace_quake", name: "ทุบสะเทือน", glyph: "slam",
      skill: { type: "cone", stat: "atk", mult: () => 3.5, mp: 15, cd: 8, motion: "thrust", reach: 200, arc: 120, stun: () => 1.5, color: "#ffe4b0" },
      desc: "ทุบพื้นด้านหน้า ดาเมจ 350% ของพลังโจมตี มึน 1.5 วิ" },
    p20: { name: "ศรัทธาเหล็ก", stats: { maxHpPct: 0.08, dmgRed: 0.05 }, desc: "HP สูงสุด +8% ลดความเสียหาย 5% เมื่อถือค้อน" },
    p30: { name: "ค้อนพิฆาต", stats: { atkPct: 0.15, pierce: 0.2 }, desc: "พลังโจมตี +15% เจาะเกราะ +20% เมื่อถือค้อน" },
    p40: { name: "กายเหล็ก", stats: { defPct: 0.15, mdefPct: 0.1 }, desc: "ป้องกัน +15% ต้านเวท +10% เมื่อถือค้อน" },
    p50: { name: "ทุบสะท้าน", stats: { stunHit: 0.07, pierce: 0.1 }, desc: "โอกาสตีให้มึน +7% เจาะเกราะ +10% เมื่อถือค้อน" },
    p60: { name: "ค้อนเทพ", stats: { atkPct: 0.15, maxHpPct: 0.1, dmgRed: 0.05 }, desc: "พลังโจมตี +15% HP สูงสุด +10% ลดความเสียหาย 5% เมื่อถือค้อน" },
  }),
  // keeps its distance: reach and aim
  spear: weaponMastery("หอก", ["spear_1h", "spear_2h"], "spear", {
    per: { atk: 2.2, hit: 2.2 }, perDesc: "พลังโจมตี +2.2 ความแม่นยำ +2.2",
    p5: { name: "ระยะหอก", stats: { reach: 0.2 }, desc: "ระยะโจมตี +20% เมื่อถือหอก" },
    p10: { name: "แทงแม่น", stats: { pierce: 0.08, hit: 15 }, desc: "เจาะเกราะ +8% ความแม่นยำ +15 เมื่อถือหอก" },
    s15: { id: "spear_lance", name: "แทงทะลวง", glyph: "pierce",
      skill: { type: "beam", stat: "atk", mult: () => 4, mp: 14, cd: 7, motion: "thrust", length: 420, width: 60, color: "#f0f6ff" },
      desc: "แทงทะลุแนวยาว 4.2 ม. ดาเมจ 400% ของพลังโจมตี" },
    p20: { name: "รักษาระยะ", stats: { reach: 0.15, flee: 15 }, desc: "ระยะโจมตี +15% หลบหลีก +15 เมื่อถือหอก" },
    p30: { name: "เทพหอก", stats: { atkPct: 0.15, pierce: 0.15 }, desc: "พลังโจมตี +15% เจาะเกราะ +15% เมื่อถือหอก" },
    p40: { name: "หอกพายุ", stats: { aspd: 0.06, reach: 0.1 }, desc: "ความเร็วโจมตี +6% ระยะโจมตี +10% เมื่อถือหอก" },
    p50: { name: "ทะลวงฟ้า", stats: { pierce: 0.1, critDmg: 0.2 }, desc: "เจาะเกราะ +10% แรงคริติคอล +20% เมื่อถือหอก" },
    p60: { name: "มังกรหอก", stats: { atkPct: 0.15, pierce: 0.15, hit: 30 }, desc: "พลังโจมตี +15% เจาะเกราะ +15% ความแม่นยำ +30 เมื่อถือหอก" },
  }),
  // quick and slippery: speed, criticals, dodging and poison
  dagger: weaponMastery("มีด", ["dagger"], "dagger", {
    per: { atk: 1.2, aspd: 0.012, crit: 0.002, flee: 0.9 }, perDesc: "พลังโจมตี +1.2 ความเร็วโจมตี +1.2% โอกาสคริติคอล +0.2% หลบหลีก +0.9",
    p5: { name: "มือไว", stats: { aspd: 0.15 }, desc: "ความเร็วโจมตี +15% เมื่อถือมีด" },
    p10: { name: "แทงจุดตาย", stats: { critDmg: 0.15 }, desc: "แรงคริติคอล +15% เมื่อถือมีด" },
    s15: { id: "shadow_step", name: "เงาจู่โจม", glyph: "dash",
      skill: { type: "dash", stat: "atk", mult: () => 3.5, mp: 12, cd: 6, motion: "thrust", distance: 200, width: 60, color: "#c8b8ff" },
      desc: "พุ่งผ่านศัตรู ดาเมจ 350% ของพลังโจมตี" },
    p20: { name: "ฝีเท้าเงา", stats: { move: 0.08, flee: 22 }, desc: "ความเร็วเดิน +8% หลบหลีก +22 เมื่อถือมีด" },
    p30: { name: "นักฆ่า", stats: { crit: 0.06, poisonHit: 0.15 }, desc: "โอกาสคริติคอล +6% ตีปกติมีโอกาส 15% ติดพิษ เมื่อถือมีด" },
    p40: { name: "เงาสายฟ้า", stats: { aspd: 0.08, flee: 20 }, desc: "ความเร็วโจมตี +8% หลบหลีก +20 เมื่อถือมีด" },
    p50: { name: "จุดตายพันจุด", stats: { critDmg: 0.3, crit: 0.03 }, desc: "แรงคริติคอล +30% โอกาสคริติคอล +3% เมื่อถือมีด" },
    p60: { name: "เงามรณะ", stats: { crit: 0.05, critDmg: 0.3, poisonHit: 0.1 }, desc: "โอกาสคริติคอล +5% แรงคริติคอล +30% โอกาสตีติดพิษ +10% เมื่อถือมีด" },
  }),
  // the caster's: magic power, mana and quicker spells
  staff: weaponMastery("ไม้เท้า", ["staff"], "staff", {
    per: { matk: 3, mpRegen: 0.08 }, perDesc: "พลังเวท +3 ฟื้น MP +0.08/วิ",
    p5: { name: "สื่อมานา", stats: { matkPct: 0.12 }, desc: "พลังเวท +12% เมื่อถือไม้เท้า" },
    p10: { name: "สมาธิ", stats: { maxMpPct: 0.12 }, desc: "MP สูงสุด +12% เมื่อถือไม้เท้า" },
    s15: { id: "staff_scatter", name: "เวทกระจาย", glyph: "fan",
      skill: { type: "fan", stat: "matk", mult: () => 1.45, count: 5, spread: 50, mp: 16, cd: 6, motion: "cast", speed: 950, range: 520, radius: 28, color: "#b8ffd8" },
      desc: "ยิงลูกเวท 5 ลูกเป็นรูปพัด ลูกละ 145% ของพลังเวท" },
    p20: { name: "ร่ายคล่อง", stats: { cdr: 0.08, castRed: 0.12 }, desc: "ลดคูลดาวน์ 8% ลดเวลาร่าย 12% เมื่อถือไม้เท้า" },
    p30: { name: "จอมเวทไม้เท้า", stats: { matkPct: 0.12, mpRegenPct: 0.22 }, desc: "พลังเวท +12% ฟื้น MP +22% เมื่อถือไม้เท้า" },
    p40: { name: "ทะเลมานา", stats: { matkPct: 0.06, maxMpPct: 0.1 }, desc: "พลังเวท +6% MP สูงสุด +10% เมื่อถือไม้เท้า" },
    p50: { name: "ร่ายพริบตา", stats: { castRed: 0.1, cdr: 0.05 }, desc: "ลดเวลาร่าย 10% ลดคูลดาวน์ 5% เมื่อถือไม้เท้า" },
    p60: { name: "ปราชญ์ไม้เท้า", stats: { matkPct: 0.15, mpRegenPct: 0.25, castRed: 0.05 }, desc: "พลังเวท +15% ฟื้น MP +25% ลดเวลาร่าย 5% เมื่อถือไม้เท้า" },
  }),
  // the marksman's: aim, a steady rate and a second arrow
  bow: weaponMastery("ธนู", ["bow"], "bow", {
    per: { atk: 2.2, hit: 1.8, crit: 0.0015 }, perDesc: "พลังโจมตี +2.2 ความแม่นยำ +1.8 โอกาสคริติคอล +0.15%",
    p5: { name: "สายตาเหยี่ยว", stats: { reach: 0.2 }, desc: "ระยะยิง +20% เมื่อถือธนู" },
    p10: { name: "ยิงต่อเนื่อง", stats: { aspd: 0.08 }, desc: "ความเร็วโจมตี +8% เมื่อถือธนู" },
    s15: { id: "arrow_rain", name: "ยิงกระจาย", glyph: "fan",
      skill: { type: "fan", stat: "atk", mult: () => 1.35, count: 5, spread: 40, arrow: true, mp: 14, cd: 6, motion: "shoot", speed: 1400, range: 700, radius: 26, color: "#fff2c8" },
      desc: "ยิงลูกธนู 5 ดอกเป็นรูปพัด ดอกละ 135% ของพลังโจมตี" },
    p20: { name: "ศรซ้อน", stats: { multiShot: 0.15 }, desc: "ยิงปกติมีโอกาส 15% ยิงซ้อนอีกดอก เมื่อถือธนู" },
    p30: { name: "นักแม่นธนู", stats: { atkPct: 0.12, critDmg: 0.3 }, desc: "พลังโจมตี +12% แรงคริติคอล +30% เมื่อถือธนู" },
    p40: { name: "สายลมนำศร", stats: { aspd: 0.06, hit: 20 }, desc: "ความเร็วโจมตี +6% ความแม่นยำ +20 เมื่อถือธนู" },
    p50: { name: "ศรพันดอก", stats: { multiShot: 0.1, crit: 0.02 }, desc: "โอกาสยิงซ้อน +10% โอกาสคริติคอล +2% เมื่อถือธนู" },
    p60: { name: "เทพธนู", stats: { atkPct: 0.15, critDmg: 0.3, reach: 0.1 }, desc: "พลังโจมตี +15% แรงคริติคอล +30% ระยะยิง +10% เมื่อถือธนู" },
  }),
  // v0.5: pistols and rifles, quick shots that go through armour and long ones
  gun: weaponMastery("ปืน", ["pistol", "rifle"], "target", {
    per: { atk: 2.2, hit: 2, crit: 0.0012 }, perDesc: "พลังโจมตี +2.2 ความแม่นยำ +2 โอกาสคริติคอล +0.12%",
    p5: { name: "ศูนย์เล็งนิ่ง", stats: { reach: 0.15 }, desc: "ระยะยิง +15% เมื่อถือปืน" },
    p10: { name: "บรรจุเร็ว", stats: { aspd: 0.08 }, desc: "ความเร็วโจมตี +8% เมื่อถือปืน" },
    s15: { id: "gun_buckshot", name: "ยิงลูกปราย", glyph: "fan",
      skill: { type: "fan", stat: "atk", mult: () => 1.3, count: 5, spread: 36, mp: 14, cd: 6, motion: "thrust", speed: 1900, range: 560, radius: 20, color: "#ffe0a0" },
      desc: "ยิงกระสุน 5 นัดเป็นรูปพัด นัดละ 130% ของพลังโจมตี" },
    p20: { name: "กระสุนเจาะเกราะ", stats: { pierce: 0.1 }, desc: "ทะลุเกราะ +10% เมื่อถือปืน" },
    p30: { name: "มือปืน", stats: { atkPct: 0.12, critDmg: 0.3 }, desc: "พลังโจมตี +12% แรงคริติคอล +30% เมื่อถือปืน" },
    p40: { name: "ลั่นไกไว", stats: { aspd: 0.06, hit: 20 }, desc: "ความเร็วโจมตี +6% ความแม่นยำ +20 เมื่อถือปืน" },
    p50: { name: "นัดเดียวจอด", stats: { pierce: 0.08, crit: 0.02 }, desc: "ทะลุเกราะ +8% โอกาสคริติคอล +2% เมื่อถือปืน" },
    p60: { name: "เทพปืน", stats: { atkPct: 0.15, critDmg: 0.3, reach: 0.1 }, desc: "พลังโจมตี +15% แรงคริติคอล +30% ระยะยิง +10% เมื่อถือปืน" },
  }),
  // the fist fighter's: quick blunt blows that daze and go through armour, a sturdy body
  knuckle: weaponMastery("สนับมือ", ["knuckle"], "slam", {
    per: { atk: 1.6, aspd: 0.01, def: 0.6 }, perDesc: "พลังโจมตี +1.6 ความเร็วโจมตี +1% ป้องกัน +0.6",
    p5: { name: "หมัดหนัก", stats: { stunHit: 0.1 }, desc: "ตีปกติมีโอกาส 10% ทำให้มึน 1 วิ เมื่อถือสนับมือ" },
    p10: { name: "หมัดต่อเนื่อง", stats: { aspd: 0.1 }, desc: "ความเร็วโจมตี +10% เมื่อถือสนับมือ" },
    s15: { id: "knuckle_barrage", name: "หมัดพายุ", glyph: "bash",
      skill: { type: "cone", stat: "atk", mult: () => 1.3, hits: 3, mp: 14, cd: 6, motion: "thrust", reach: 140, arc: 60, color: "#ffd9a0" },
      desc: "ต่อยรัวใส่ด้านหน้า 3 ครั้ง ครั้งละ 130% ของพลังโจมตี" },
    p20: { name: "กำปั้นเหล็ก", stats: { pierce: 0.15, maxHpPct: 0.05 }, desc: "เจาะเกราะ +15% HP สูงสุด +5% เมื่อถือสนับมือ" },
    p30: { name: "ปรมาจารย์หมัด", stats: { atkPct: 0.12, stunHit: 0.05 }, desc: "พลังโจมตี +12% โอกาสตีให้มึน +5% เมื่อถือสนับมือ" },
    p40: { name: "หมัดสายฟ้า", stats: { aspd: 0.06, hit: 20 }, desc: "ความเร็วโจมตี +6% ความแม่นยำ +20 เมื่อถือสนับมือ" },
    p50: { name: "หมัดทะลวง", stats: { pierce: 0.1, critDmg: 0.2 }, desc: "เจาะเกราะ +10% แรงคริติคอล +20% เมื่อถือสนับมือ" },
    p60: { name: "เทพหมัด", stats: { atkPct: 0.15, aspd: 0.06, dmgRed: 0.05 }, desc: "พลังโจมตี +15% ความเร็วโจมตี +6% ลดความเสียหาย 5% เมื่อถือสนับมือ" },
  }),
  // the beast's: quick slashes, criticals that tear, wounds that bleed, a light step
  claw: weaponMastery("กรงเล็บ", ["claw"], "twin", {
    per: { atk: 1.5, aspd: 0.006, crit: 0.002 }, perDesc: "พลังโจมตี +1.5 ความเร็วโจมตี +0.6% โอกาสคริติคอล +0.2%",
    p5: { name: "เล็บคม", stats: { critDmg: 0.2 }, desc: "แรงคริติคอล +20% เมื่อถือกรงเล็บ" },
    p10: { name: "ข่วนรัว", stats: { aspd: 0.1 }, desc: "ความเร็วโจมตี +10% เมื่อถือกรงเล็บ" },
    s15: { id: "claw_rend", name: "กรงเล็บฉีก", glyph: "twin",
      skill: { type: "cone", stat: "atk", mult: () => 1.8, hits: 2, poison: () => 0.3, mp: 13, cd: 6, motion: "thrust", reach: 150, arc: 100, color: "#ffc8c0" },
      desc: "ตะปบด้านหน้า 2 ครั้ง ครั้งละ 180% ของพลังโจมตี แผลเลือดไหลอีก 30% ของดาเมจใน 4 วิ" },
    p20: { name: "สัญชาตญาณนักล่า", stats: { flee: 15, move: 0.05 }, desc: "หลบหลีก +15 ความเร็วเดิน +5% เมื่อถือกรงเล็บ" },
    p30: { name: "นักล่ากรงเล็บ", stats: { atkPct: 0.12, crit: 0.04 }, desc: "พลังโจมตี +12% โอกาสคริติคอล +4% เมื่อถือกรงเล็บ" },
    p40: { name: "เงากรงเล็บ", stats: { aspd: 0.06, flee: 15 }, desc: "ความเร็วโจมตี +6% หลบหลีก +15 เมื่อถือกรงเล็บ" },
    p50: { name: "ฉีกจุดตาย", stats: { critDmg: 0.25, crit: 0.02 }, desc: "แรงคริติคอล +25% โอกาสคริติคอล +2% เมื่อถือกรงเล็บ" },
    p60: { name: "ราชสีห์", stats: { atkPct: 0.15, critDmg: 0.3, poisonHit: 0.1 }, desc: "พลังโจมตี +15% แรงคริติคอล +30% ตีปกติมีโอกาส 10% ติดพิษ (เลือดไหล) เมื่อถือกรงเล็บ" },
  }),
  // opened by a mastery book
  gathering: {
    name: "เก็บเกี่ยว", kind: "life", book: "book_gathering", glyph: "leaf", max: 20,
    per: { drop: 0.03 }, perDesc: "โอกาสได้ของดรอป +3% ต่อระดับ",
    rewards: [
      { at: 5, kind: "passive", name: "มือคล่อง", glyph: "leaf", stats: { drop: 0.05 }, desc: "โอกาสได้ของดรอป +5%" },
      { at: 10, kind: "passive", name: "ตาไว", glyph: "eye", stats: { xpPct: 0.1 }, desc: "ค่าประสบการณ์ +10%" },
      { at: 15, kind: "passive", name: "รู้แหล่ง", glyph: "leaf", stats: { drop: 0.1 }, desc: "โอกาสได้ของดรอป +10%" },
      { at: 20, kind: "passive", name: "นักเดินทาง", glyph: "dash", stats: { move: 0.05 }, desc: "ความเร็วเดิน +5%" },
    ],
  },
  // the crafts, opened by an inventor's branch or a book
  weaponcraft: craftMastery("weaponcraft", "สร้างอาวุธ", "sword", "อาวุธ", "เตาหลอมพกพา", "ทั่งตีบวก"),
  armorcraft: craftMastery("armorcraft", "สร้างชุด", "shield", "ชุด หมวก และรองเท้า", "โต๊ะช่างเกราะ", "ตีบวกเกราะ"),
  jewelcraft: craftMastery("jewelcraft", "สร้างประดับ", "ring", "แหวนและจี้", "โต๊ะเจียระไน", "ตีบวกอัญมณี"),
};

// ---- elements ----
// Each level adds that element's attack and defence (every hit adds the attacker's attack in each
// element over the target's defence in it, and a hit in an element swings with half again its
// attack in it: stats.ts elementBonus), a little of both attack and defence, and the line's
// effect (skill line); milestones along the line add stats or effects (skills.ts, stats.ts).
// The first five (and plant) strengthen every skill; ice, light, dark, stone, mud, lava and poison
// work through the hits of their own element (SkillDef.element); metal, smoke, shadow and gold
// through stats of their own (reflect, magicDodge, flee and attack, magic defence and statusRes).
//
// Balance (README "ธาตุ"; tools/tree_check.cjs weighs every line with ELEMENT_WORTH): every element
// is worth about the same. Its own attack and defence are 2 and 1.5 a level for all. The rest of a
// level is weighed in points (1 point: 1 attack, 10 HP, 0.4% attack...), split between attack and
// defence with at least 30% on the lesser side: 2 points for the elements whose effect works on
// every skill, 2.6 for those that need their own element's hits, 2.2 plus about 1 point of their
// own stat for the four whose speciality is a stat. Milestones: 20 is the element's defence +15
// and about 12 points; 50 about 30 points with 10 or more on each side (and its effect, if any);
// 80 about 25 points of its strong side.
export const ELEMENT_MAX = 50;
export const ELEMENT_MAX2 = 100;
const ea = (id: string, atk = 2, def = 1.5): StatBag => ({ [`${id}Atk`]: atk, [`${id}Def`]: def });
export const ELEMENTS: Record<string, ElementDef> = {
  earth: {
    name: "ดิน", color: "#d6a35c", glyph: "earth", max: ELEMENT_MAX, side: "ป้องกัน",
    per: { ...ea("earth"), atk: 0.4, matk: 0.4, def: 0.8, mdef: 0.3, maxHp: 3 },
    skill: "สกิลสร้างโล่ 0.4% ของ HP สูงสุดต่อระดับตอนใช้ (นาน 4 วิ สูงสุด 60%)",
    marks: [
      { at: 10, name: "หินผา", desc: "สกิลที่ทำให้มึน ช้า หรือแช่แข็ง นานขึ้น 30%" },
      { at: 20, name: "เปลือกหิน", desc: "ป้องกันธาตุดิน +15 ลดความเสียหายที่ได้รับ 4%", stats: { earthDef: 15, dmgRed: 0.04 } },
      { at: 35, name: "ภูผามั่น", desc: "โล่จากธาตุดินตอนใช้สกิลหนาขึ้นเท่าตัว" },
      { at: 50, name: "แก่นพสุธา", desc: "HP สูงสุด +5% ป้องกัน +3% พลังโจมตีและพลังเวท +3%", stats: { maxHpPct: 0.05, defPct: 0.03, atkPct: 0.03, matkPct: 0.03 } },
    ],
  },
  water: {
    name: "น้ำ", color: "#6fc3ff", glyph: "drop", max: ELEMENT_MAX, side: "ฟื้นฟู",
    per: { ...ea("water"), atk: 0.4, matk: 0.4, hpRegen: 0.1, mpRegen: 0.07, maxMp: 2, maxHp: 2 },
    skill: "สกิลรักษาแรงขึ้น 2% ต่อระดับ",
    marks: [
      { at: 10, name: "สายน้ำ", desc: "สกิลที่ตีโดนดูด HP 5% ของดาเมจ" },
      { at: 20, name: "ธารใส", desc: "ป้องกันธาตุน้ำ +15 ฟื้น MP +12%", stats: { waterDef: 15, mpRegenPct: 0.12 } },
      { at: 35, name: "คลื่นชุบชีวิต", desc: "ใช้สกิลแล้วฟื้น HP 3% ของ HP สูงสุด" },
      { at: 50, name: "มหาสมุทร", desc: "ดูด HP จากสกิลเพิ่มเป็น 10% HP สูงสุด +7% พลังโจมตีและพลังเวท +3%", stats: { maxHpPct: 0.07, atkPct: 0.03, matkPct: 0.03 } },
    ],
  },
  wind: {
    name: "ลม", color: "#9ef0c0", glyph: "swirl", max: ELEMENT_MAX, side: "ความเร็ว",
    per: { ...ea("wind"), aspd: 0.003, atk: 0.15, matk: 0.15, flee: 0.75, move: 0.0025, cdr: 0.003 },
    skill: "คูลดาวน์สกิลลดลง 0.3% ต่อระดับ (รวมในค่าลดคูลดาวน์)",
    marks: [
      { at: 10, name: "สายลม", desc: "หลังใช้สกิล เดินเร็วขึ้น 25% นาน 2 วิ" },
      { at: 20, name: "ลมหนุน", desc: "ป้องกันธาตุลม +15 ความเร็วโจมตี +5%", stats: { windDef: 15, aspd: 0.05 } },
      { at: 35, name: "พายุหมุน", desc: "ใช้สกิลแล้วมีโอกาส 15% ที่คูลดาวน์ของสกิลนั้นหายทันที" },
      { at: 50, name: "เจ้าแห่งลม", desc: "ลดคูลดาวน์ +5% ความเร็วเดิน +5% หลบหลีก +9", stats: { cdr: 0.05, move: 0.05, flee: 9 } },
    ],
  },
  fire: {
    name: "ไฟ", color: "#ff8a5c", glyph: "flame", max: ELEMENT_MAX, side: "โจมตี",
    per: { ...ea("fire"), atk: 0.7, matk: 0.7, maxHp: 4, def: 0.3, mdef: 0.25 },
    skill: "ดาเมจสกิลแรงขึ้น 1% ต่อระดับ",
    marks: [
      { at: 10, name: "เผาไหม้", desc: "สกิลที่ตีโดนเผาศัตรู 20% ของดาเมจใน 3 วิ" },
      { at: 20, name: "เปลวร้อน", desc: "ป้องกันธาตุไฟ +15 HP สูงสุด +5%", stats: { fireDef: 15, maxHpPct: 0.05 } },
      { at: 35, name: "ไฟลามทุ่ง", desc: "การเผาแรงขึ้นเป็น 40% ของดาเมจ" },
      { at: 50, name: "อัคนี", desc: "ดาเมจสกิลแรงขึ้นอีก 15% พลังโจมตีและพลังเวท +4% HP สูงสุด +6%", stats: { atkPct: 0.04, matkPct: 0.04, maxHpPct: 0.06 } },
    ],
  },
  ice: {
    name: "น้ำแข็ง", color: "#9fe0ff", glyph: "freeze", max: ELEMENT_MAX, side: "ลดความเร็วโจมตีและร่ายของศัตรู",
    per: { ...ea("ice"), matk: 0.7, atk: 0.5, mdef: 0.7, maxMp: 3, maxHp: 4.5 },
    skill: "การโจมตีธาตุน้ำแข็งทำให้ศัตรูหนาวสั่น โจมตีและร่ายช้าลง 10% +0.6% ต่อระดับ นาน 3 วิ",
    marks: [
      { at: 10, name: "ลมหนาว", desc: "หนาวสั่นนานขึ้นเป็น 5 วิ" },
      { at: 20, name: "ผิวน้ำแข็ง", desc: "ป้องกันธาตุน้ำแข็ง +15 ต้านเวท +5%", stats: { iceDef: 15, mdefPct: 0.05 } },
      { at: 35, name: "เยือกแข็ง", desc: "การโจมตีธาตุน้ำแข็งมีโอกาส 10% แช่แข็งศัตรู 1.5 วิ" },
      { at: 50, name: "ยุคน้ำแข็ง", desc: "หนาวสั่นแรงขึ้นเท่าตัว พลังเวท +4% พลังโจมตี +3% ต้านเวท +4% MP สูงสุด +3%", stats: { matkPct: 0.04, atkPct: 0.03, mdefPct: 0.04, maxMpPct: 0.03 } },
    ],
  },
  light: {
    name: "แสง", color: "#fff1a8", glyph: "star", max: ELEMENT_MAX, side: "ความเสียหายจริง",
    per: { ...ea("light"), matk: 0.7, atk: 0.4, hit: 0.75, mdef: 0.5, maxHp: 7 },
    skill: "การโจมตีธาตุแสงไม่สนเกราะ 20% +1.6% ต่อระดับ (ระดับ 50: ไม่สนเกราะเลย)",
    marks: [
      { at: 10, name: "แสงนำทาง", desc: "ความแม่นยำ +10", stats: { hit: 10 } },
      { at: 20, name: "รัศมี", desc: "ป้องกันธาตุแสง +15 ต้านเวท +5%", stats: { lightDef: 15, mdefPct: 0.05 } },
      { at: 35, name: "แสงทะลวง", desc: "การโจมตีธาตุแสงไม่สนเกราะเพิ่มอีก 20%" },
      { at: 50, name: "สุริยะ", desc: "พลังเวท +4% พลังโจมตี +3% ความแม่นยำ +10 HP สูงสุด +4%", stats: { matkPct: 0.04, atkPct: 0.03, hit: 10, maxHpPct: 0.04 } },
    ],
  },
  dark: {
    name: "ความมืด", color: "#a98cff", glyph: "eye", max: ELEMENT_MAX, side: "สถานะผิดปกติ",
    per: { ...ea("dark"), matk: 0.7, atk: 0.5, crit: 0.001, flee: 0.6, mdef: 0.5, maxHp: 5 },
    skill: "การโจมตีธาตุความมืดมีโอกาส 10% +0.6% ต่อระดับ (สูงสุด 60%) ทำให้ศัตรูติดสถานะ (ตาบอด อ่อนแรง หรือพิษ) 4 วิ",
    marks: [
      { at: 10, name: "เงามืด", desc: "สถานะจากธาตุความมืดนานขึ้นเป็น 6 วิ" },
      { at: 20, name: "ม่านเงา", desc: "ป้องกันธาตุความมืด +15 หลบหลีก +10 ต้านเวท +2%", stats: { darkDef: 15, flee: 10, mdefPct: 0.02 } },
      { at: 35, name: "คำสาป", desc: "ติดสถานะทีละ 2 อย่าง" },
      { at: 50, name: "ราตรีนิรันดร์", desc: "ดาเมจใส่ศัตรูที่ติดสถานะ +12% HP สูงสุด +4%", stats: { huntDmg: 0.12, maxHpPct: 0.04 } },
    ],
  },
  plant: {
    name: "พืช", color: "#8ee06a", glyph: "leaf", max: ELEMENT_MAX, side: "รักษาสถานะ",
    per: { ...ea("plant"), atk: 0.4, matk: 0.4, hpRegen: 0.12, maxHp: 6, mdef: 0.3 },
    skill: "ใช้สกิลแล้วฟื้น HP 0.1% ของ HP สูงสุดต่อระดับ · สถานะผิดปกติบนตัวหมดเร็วขึ้น 1% ต่อระดับ",
    marks: [
      { at: 10, name: "รากแก้ว", desc: "ใช้สกิลแล้วล้างสถานะผิดปกติบนตัวทั้งหมด" },
      { at: 20, name: "ใบเขียว", desc: "ป้องกันธาตุพืช +15 พลังรักษา +10%", stats: { plantDef: 15, healPct: 0.1 } },
      { at: 35, name: "ผลิใบ", desc: "ฟื้น HP จากธาตุพืชตอนใช้สกิลแรงขึ้นเท่าตัว" },
      { at: 50, name: "พฤกษาพิทักษ์", desc: "ไม่ติดสถานะผิดปกติ HP สูงสุด +6% พลังโจมตีและพลังเวท +3% ฟื้น HP +1/วิ", stats: { maxHpPct: 0.06, atkPct: 0.03, matkPct: 0.03, hpRegen: 1 } },
    ],
  },
  stone: {
    name: "หิน", color: "#b4ada2", glyph: "slam", max: ELEMENT_MAX, side: "สาปเป็นหิน",
    per: { ...ea("stone"), atk: 0.6, matk: 0.4, def: 0.8, maxHp: 7, mdef: 0.3 },
    skill: "การโจมตีธาตุหินมีโอกาส 4% +0.3% ต่อระดับ (สูงสุด 40%) สาปศัตรูเป็นหิน 2 วิ (ขยับและโจมตีไม่ได้)",
    marks: [
      { at: 10, name: "ศิลาสาป", desc: "เป็นหินนานขึ้นเป็น 3 วิ" },
      { at: 20, name: "ผิวศิลา", desc: "ป้องกันธาตุหิน +15 ป้องกัน +5%", stats: { stoneDef: 15, defPct: 0.05 } },
      { at: 35, name: "เมดูซ่า", desc: "โอกาสสาปเป็นหินเพิ่มขึ้นครึ่งหนึ่ง" },
      { at: 50, name: "รูปสลัก", desc: "ศัตรูที่เป็นหินโดนแรงขึ้น 25% ป้องกัน +4% พลังโจมตี +4% พลังเวท +2% HP สูงสุด +3%", stats: { defPct: 0.04, atkPct: 0.04, matkPct: 0.02, maxHpPct: 0.03 } },
    ],
  },
  mud: {
    name: "โคลน", color: "#b08860", glyph: "down", max: ELEMENT_MAX, side: "ลดความเร็วเคลื่อนที่",
    per: { ...ea("mud"), atk: 0.5, matk: 0.5, hit: 0.3, maxHp: 8, hpRegen: 0.1, def: 0.45 },
    skill: "การโจมตีธาตุโคลนทำให้ศัตรูเดินช้าลง 20% +0.8% ต่อระดับ นาน 3 วิ",
    marks: [
      { at: 10, name: "หล่มลึก", desc: "เดินช้านานขึ้นเป็น 5 วิ" },
      { at: 20, name: "เกราะโคลน", desc: "ป้องกันธาตุโคลน +15 HP สูงสุด +5%", stats: { mudDef: 15, maxHpPct: 0.05 } },
      { at: 35, name: "โคลนดูด", desc: "การโจมตีธาตุโคลนตรึงศัตรูอยู่กับที่ 0.5 วิ" },
      { at: 50, name: "บึงมรณะ", desc: "เดินช้าแรงขึ้นอีกครึ่งหนึ่ง HP สูงสุด +5% ลดความเสียหาย 2% พลังโจมตีและพลังเวท +3%", stats: { maxHpPct: 0.05, dmgRed: 0.02, atkPct: 0.03, matkPct: 0.03 } },
    ],
  },
  lava: {
    name: "ลาวา", color: "#ff7438", glyph: "burst", max: ELEMENT_MAX, side: "เผาต่อเนื่องและป้องกัน",
    per: { ...ea("lava"), matk: 0.5, atk: 0.45, def: 0.7, maxHp: 4, mdef: 0.3 },
    skill: "การโจมตีธาตุลาวาเผาศัตรู 15% +0.7% ต่อระดับของดาเมจ ใน 3 วิ",
    marks: [
      { at: 10, name: "เปลือกลาวา", desc: "ป้องกัน +5%", stats: { defPct: 0.05 } },
      { at: 20, name: "หินหนืด", desc: "การเผาจากธาตุลาวานานขึ้นเป็น 5 วิ ป้องกันธาตุลาวา +15 HP สูงสุด +5%", stats: { lavaDef: 15, maxHpPct: 0.05 } },
      { at: 35, name: "ภูเขาไฟ", desc: "ลดความเสียหายที่ได้รับ 5%", stats: { dmgRed: 0.05 } },
      { at: 50, name: "แกนโลก", desc: "การเผาจากธาตุลาวาแรงขึ้นเท่าตัว พลังโจมตีและพลังเวท +3% HP สูงสุด +4% ป้องกัน +3%", stats: { atkPct: 0.03, matkPct: 0.03, maxHpPct: 0.04, defPct: 0.03 } },
    ],
  },
  metal: {
    name: "โลหะ", color: "#cdd6e2", glyph: "shield", max: ELEMENT_MAX, side: "HP สูงสุดและสะท้อน",
    per: { ...ea("metal"), atk: 0.45, matk: 0.35, maxHp: 7, def: 0.4, mdef: 0.2, reflect: 0.005 },
    skill: "สะท้อนความเสียหายที่โดนโจมตีกลับไป 0.5% ต่อระดับ (รวมในค่าสะท้อน สูงสุด 60%)",
    marks: [
      { at: 10, name: "ผิวเหล็ก", desc: "สะท้อนความเสียหาย +5%", stats: { reflect: 0.05 } },
      { at: 20, name: "เกราะเหล็ก", desc: "ป้องกันธาตุโลหะ +15 HP สูงสุด +5%", stats: { metalDef: 15, maxHpPct: 0.05 } },
      { at: 35, name: "หนามเหล็ก", desc: "สะท้อนความเสียหาย +10%", stats: { reflect: 0.1 } },
      { at: 50, name: "ป้อมปราการ", desc: "HP สูงสุด +4% ป้องกันทุกธาตุ +10 พลังโจมตีและพลังเวท +3%", stats: { maxHpPct: 0.04, atkPct: 0.03, matkPct: 0.03, ...Object.fromEntries(ELEMENT_IDS.map((e) => [`${e}Def`, 10])) } },
    ],
  },
  // opened by an element book
  poison: {
    name: "พิษ", color: "#8fdc4a", glyph: "drop", max: ELEMENT_MAX, side: "ติดพิษ", book: "book_poison",
    per: { ...ea("poison"), poisonPct: 0.008, atk: 0.4, matk: 0.4, hit: 0.2, maxHp: 4, def: 0.3, mdef: 0.3, hpRegen: 0.04 },
    skill: "การโจมตีธาตุพิษทำให้ติดพิษ 30% +1% ต่อระดับของดาเมจ ใน 4 วิ (ติดซ้อนได้)",
    marks: [
      { at: 10, name: "พิษซึม", desc: "พิษจากธาตุพิษนานขึ้นเป็น 6 วิ" },
      { at: 20, name: "ภูมิต้านพิษ", desc: "ป้องกันธาตุพิษ +15 HP สูงสุด +5%", stats: { poisonDef: 15, maxHpPct: 0.05 } },
      { at: 35, name: "พิษสองชั้น", desc: "การโจมตีธาตุพิษติดพิษสองชั้นในครั้งเดียว" },
      { at: 50, name: "พิษร้ายแรง", desc: "พิษทุกอย่างแรงขึ้นเท่าตัว พลังโจมตีและพลังเวท +3% HP สูงสุด +4% ความแม่นยำ +10", stats: { atkPct: 0.03, matkPct: 0.03, maxHpPct: 0.04, hit: 10 } },
    ],
  },
  lightning: {
    name: "สายฟ้า", color: "#fff27a", glyph: "bolt", max: ELEMENT_MAX, side: "คริติคอล", book: "book_lightning",
    per: { ...ea("lightning"), crit: 0.001, critDmg: 0.004, aspd: 0.0015, atk: 0.3, matk: 0.3, flee: 0.6, maxHp: 3 },
    skill: "สกิลกายภาพ: โอกาสคริติคอล +0.1% ต่อระดับ · สกิลเวท: ดาเมจ +0.3% ต่อระดับ",
    marks: [
      { at: 10, name: "ฟ้าผ่า", desc: "สกิลที่ตีโดนกระโดดไปโดนอีก 1 ตัวใกล้ๆ 30%" },
      { at: 20, name: "ประจุไฟฟ้า", desc: "ป้องกันธาตุสายฟ้า +15 แรงคริติคอล +10% หลบหลีก +8", stats: { lightningDef: 15, critDmg: 0.1, flee: 8 } },
      { at: 35, name: "สายฟ้าแตกแขนง", desc: "กระโดดไปโดน 2 ตัว" },
      { at: 50, name: "อสุนีบาต", desc: "ดาเมจที่กระโดดแรงขึ้นเป็น 60% โอกาสคริติคอล +2% แรงคริติคอล +10% HP สูงสุด +7%", stats: { crit: 0.02, critDmg: 0.1, maxHpPct: 0.07 } },
    ],
  },
  smoke: {
    name: "ควัน", color: "#b9b2cc", glyph: "cloud", max: ELEMENT_MAX, side: "หลบหลีก",
    per: { ...ea("smoke"), magicDodge: 0.004, flee: 0.75, move: 0.002, maxHp: 3, atk: 0.45, matk: 0.45 },
    skill: "หลบหลีกเวทมนตร์ได้ 0.4% ต่อระดับ (ระดับ 50: 20%) เวทที่หลบได้ไม่โดนเลย",
    marks: [
      { at: 10, name: "ม่านหมอก", desc: "หลบหลีก +10", stats: { flee: 10 } },
      { at: 20, name: "ร่างควัน", desc: "ป้องกันธาตุควัน +15 ความเร็วเดิน +5%", stats: { smokeDef: 15, move: 0.05 } },
      { at: 35, name: "หมอกลวงตา", desc: "หลบเวทอีก +10%", stats: { magicDodge: 0.1 } },
      { at: 50, name: "จ้าวแห่งควัน", desc: "หลบหลีก +10 พลังโจมตีและพลังเวท +3% HP สูงสุด +4%", stats: { flee: 10, atkPct: 0.03, matkPct: 0.03, maxHpPct: 0.04 } },
    ],
  },
  // v0.3: slipping physical blows and striking back hard; shrugging off spells and ailments
  shadow: {
    name: "เงา", color: "#7c86b4", glyph: "dash", max: ELEMENT_MAX, side: "หลบหลีกและโจมตีกายภาพ",
    per: { ...ea("shadow"), flee: 1.5, atk: 0.9, crit: 0.001, maxHp: 4, mdef: 0.3 },
    skill: "หลบหลีก +1.5 และพลังโจมตี +0.9 ต่อระดับ: มอนสเตอร์กัดพลาดบ่อยขึ้น และตีแรงขึ้น",
    marks: [
      { at: 10, name: "เงาพราง", desc: "หลบหลีก +10", stats: { flee: 10 } },
      { at: 20, name: "ร่างเงา", desc: "ป้องกันธาตุเงา +15 หลบหลีก +8 HP สูงสุด +3%", stats: { shadowDef: 15, flee: 8, maxHpPct: 0.03 } },
      { at: 35, name: "เงาจู่โจม", desc: "พลังโจมตี +6%", stats: { atkPct: 0.06 } },
      { at: 50, name: "เจ้าแห่งเงา", desc: "หลบหลีก +15 พลังโจมตี +4% โอกาสคริติคอล +2% HP สูงสุด +2%", stats: { flee: 15, atkPct: 0.04, crit: 0.02, maxHpPct: 0.02 } },
    ],
  },
  gold: {
    name: "ทอง", color: "#e8b84a", glyph: "coin", max: ELEMENT_MAX, side: "ต้านเวทและต้านสถานะ",
    per: { ...ea("gold"), mdef: 0.4, statusRes: 0.004, atk: 0.45, matk: 0.45, def: 0.4, maxHp: 5, hpRegen: 0.05 },
    skill: "ต้านสถานะ 0.4% ต่อระดับ: โอกาสไม่ติดสถานะผิดปกติจากมอนสเตอร์ (ช้า ไฟลวก หิน หนาวสั่น โคลน ตาพร่า) และต้านเวท +0.4 ต่อระดับ",
    marks: [
      { at: 10, name: "ผิวทอง", desc: "ต้านสถานะ +5%", stats: { statusRes: 0.05 } },
      { at: 20, name: "เกราะทอง", desc: "ป้องกันธาตุทอง +15 ต้านเวท +5%", stats: { goldDef: 15, mdefPct: 0.05 } },
      { at: 35, name: "ทองแท้", desc: "ต้านสถานะ +10%", stats: { statusRes: 0.1 } },
      { at: 50, name: "ราชันทองคำ", desc: "ต้านเวท +4% พลังโจมตีและพลังเวท +3% HP สูงสุด +4%", stats: { mdefPct: 0.04, atkPct: 0.03, matkPct: 0.03, maxHpPct: 0.04 } },
    ],
  },
};

// Past the first book's 50 (ELEMENT_MAX) the second book opens up to 100 (ELEMENT_MAX2), with three
// more milestones: 65 more attack and defence in the element, 80 more of its strong side (about
// 25 points), 100 the crown. Every level keeps adding what it did.
const ELEMENT_TOP: Record<string, [string, string, string, StatBag, string]> = {
  earth: ["แผ่นดินตื่น", "ขุนเขา", "พระแม่ธรณี", { defPct: 0.06, maxHpPct: 0.04 }, "ป้องกัน +6% HP สูงสุด +4%"],
  water: ["น้ำวน", "ธารชีวา", "เจ้าสมุทร", { mpRegenPct: 0.15, healPct: 0.1 }, "ฟื้น MP +15% พลังรักษา +10%"],
  wind: ["ลมกรด", "พายุคลั่ง", "เทพวายุ", { aspd: 0.06, move: 0.05 }, "ความเร็วโจมตี +6% ความเร็วเดิน +5%"],
  fire: ["เพลิงโหม", "ไฟบรรลัย", "เทพอัคคี", { atkPct: 0.07, matkPct: 0.07 }, "พลังโจมตีและพลังเวท +7%"],
  ice: ["หิมะกัด", "ธารน้ำแข็ง", "ราชินีหิมะ", { mdefPct: 0.06, maxMpPct: 0.05 }, "ต้านเวท +6% MP สูงสุด +5%"],
  light: ["แสงเจิดจ้า", "รุ่งอรุณ", "บุตรแห่งสุริยะ", { hit: 15, matkPct: 0.06 }, "ความแม่นยำ +15 พลังเวท +6%"],
  dark: ["เงาลึก", "จันทร์ดับ", "เจ้าแห่งราตรี", { huntDmg: 0.1, flee: 15 }, "ดาเมจใส่ศัตรูที่ติดสถานะ +10% หลบหลีก +15"],
  plant: ["ไม้เลื้อย", "ป่าดึกดำบรรพ์", "ต้นไม้แห่งโลก", { healPct: 0.1, maxHpPct: 0.05 }, "พลังรักษา +10% HP สูงสุด +5%"],
  stone: ["หินผาแกร่ง", "ศิลาอาถรรพ์", "เทพศิลา", { defPct: 0.06, maxHpPct: 0.04 }, "ป้องกัน +6% HP สูงสุด +4%"],
  mud: ["ดินโคลนหนา", "หล่มมรณะ", "เจ้าแห่งบึง", { maxHpPct: 0.06, dmgRed: 0.03 }, "HP สูงสุด +6% ลดความเสียหาย 3%"],
  lava: ["หินหลอมเหลว", "ปล่องภูเขาไฟ", "หัวใจโลก", { defPct: 0.06, dmgRed: 0.03 }, "ป้องกัน +6% ลดความเสียหาย 3%"],
  metal: ["เหล็กกล้า", "ปราการเหล็ก", "เทพโลหะ", { reflect: 0.08, maxHpPct: 0.05 }, "สะท้อนความเสียหาย +8% HP สูงสุด +5%"],
  poison: ["พิษกัดกร่อน", "พิษมรณะ", "ราชาอสรพิษ", { poisonPct: 0.15, atkPct: 0.03, matkPct: 0.03 }, "พิษแรงขึ้น 15% พลังโจมตีและพลังเวท +3%"],
  lightning: ["ฟ้าคำราม", "พายุสายฟ้า", "เทพอสนี", { crit: 0.03, critDmg: 0.25 }, "โอกาสคริติคอล +3% แรงคริติคอล +25%"],
  smoke: ["หมอกหนา", "ควันมายา", "เงาไร้ร่าง", { flee: 20, magicDodge: 0.05 }, "หลบหลีก +20 หลบเวท +5%"],
  shadow: ["เงาซ้อน", "ราตรีไร้เงา", "เงาสังหาร", { flee: 20, atkPct: 0.05 }, "หลบหลีก +20 พลังโจมตี +5%"],
  gold: ["ทองคำเปลว", "หีบสมบัติ", "เทพแห่งทองคำ", { mdefPct: 0.06, statusRes: 0.06 }, "ต้านเวท +6% ต้านสถานะ +6%"],
};
for (const [id, e] of Object.entries(ELEMENTS)) {
  const [n65, n80, n100, side, sideDesc] = ELEMENT_TOP[id];
  e.max2 = ELEMENT_MAX2;
  e.marks.push(
    { at: 65, name: n65, desc: `พลังโจมตีธาตุ${e.name} +20 ป้องกันธาตุ${e.name} +20`, stats: ea(id, 20, 20) },
    { at: 80, name: n80, desc: sideDesc, stats: side },
    { at: 100, name: n100, desc: `ดาเมจ +10% พลังโจมตีธาตุ${e.name} +50`, stats: { dmg: 0.1, [`${id}Atk`]: 50 } },
  );
}

// The element each damaging skill hits with (the rest have none: the arcane spells, most
// weapon skills). Spells mostly; some weapon skills too, where the skill is made of something.
const SKILL_ELEMENTS: Record<string, ElementId> = {
  fire_bolt: "fire", fire_ball: "fire",
  meteor: "lava",
  doom_arrow: "dark",
  poison_arrow: "poison", toxic_cloud: "poison",
  seed_shot: "plant", flower_field: "plant", petal_storm: "plant",
  repulse: "wind",
  slow_arrow: "mud",
  shield_bash: "metal",
  holy_light: "light", guardian_cross: "light", holy_strike: "light", smite: "light", divine_wrath: "light",
};

// Element stats as shown to the player.
export const ELEMENT_STAT_NAMES: Record<string, string> = Object.fromEntries(
  ELEMENT_IDS.flatMap((e) => [[`${e}Atk`, `พลังโจมตีธาตุ${ELEMENTS[e].name}`], [`${e}Def`, `ป้องกันธาตุ${ELEMENTS[e].name}`]]),
);

// The second and third jobs' branches and the later books (src/trees/).
for (const more of [RANGER_TREES, BLADE_TREES, CASTER_TREES, BATTLEMAGE_TREES, V02_JOB_TREES, V03_JOB_TREES, BOOK_TREES, V05_TREES]) {
  for (const [id, t] of Object.entries(more)) {
    if (TREES[id]) throw new Error(`tree ${id} twice`);
    TREES[id] = t;
  }
}

// Every tree node by id, with its tree.
export const NODES: Record<string, { tree: string; node: TreeNode }> = {};
for (const [tree, t] of Object.entries(TREES)) {
  for (const node of t.nodes) {
    if (NODES[node.id]) throw new Error(`skill ${node.id} in ${NODES[node.id].tree} and ${tree}`);
    NODES[node.id] = { tree, node };
  }
}
for (const [id, element] of Object.entries(SKILL_ELEMENTS)) {
  const skill = NODES[id]?.node.skill;
  if (!skill) throw new Error(`SKILL_ELEMENTS: no skill ${id}`);
  skill.element = element;
}

// Books are items (items.ts) that teach a tree, mastery or element when read: a new character
// knows one of each (picked when it was made, see Progress.start); the rest are books found in
// the game. Every tree, mastery and element has one: its own `book` id if it names one, else
// book_<kind>_<id>, added to ITEMS here. Each weapon mastery and element also has a second book
// (book_mastery2_<id>, book_element2_<id>) that takes its line on from MASTERY_MAX to
// MASTERY_MAX2, or ELEMENT_MAX to ELEMENT_MAX2, once the first is learned; only monsters of
// level TIER2_DROP_LEVEL and up leave those.
export type BookKind = "tree" | "mastery" | "element" | "mastery2" | "element2";
export const BOOKS: Record<string, { kind: BookKind; id: string }> = {};
export const TIER2_DROP_LEVEL = 40;
// How often a field monster leaves a book (one the player can still learn): every book is a rare
// find, a boss's one time in four.
export const BOOK_CHANCE = { normal: 0.0004, rare: 0.02, boss: 0.25 };
const BOOK_WORD: Record<BookKind, string> = { tree: "ตำราสกิล", mastery: "ตำราความเชี่ยวชาญ", element: "ตำราธาตุ", mastery2: "ตำราความเชี่ยวชาญ", element2: "ตำราธาตุ" };
function addBook(kind: BookKind, id: string, own: string | undefined, name: string, glyph: string, color: string, cls: ClassId | null, note?: string): void {
  const bookId = own ?? `book_${kind}_${id}`;
  BOOKS[bookId] = { kind, id };
  const who = cls ? `เฉพาะ${CLASSES[cls].name}` : "ใช้ได้ทุกอาชีพ";
  ITEMS[bookId] = {
    kind: "book", name: name.startsWith("ตำรา") ? name : `${BOOK_WORD[kind]}: ${name}`, stack: 5,
    price: kind === "tree" ? 2400 : kind === "mastery" || kind === "element" ? 3000 : 9000,
    // a second book wears its first book's picture with a "II" on it
    icon: { glyph, color, art: `${kind.replace("2", "")}_${id}`, badge: kind.endsWith("2") ? "II" : undefined },
    note: note ?? `อ่านเพื่อเรียน${name.startsWith("ตำรา") ? name : BOOK_WORD[kind] + name} (${who})`,
  };
}
for (const [id, t] of Object.entries(TREES)) if (!t.job && !t.job3 && !t.job4) addBook("tree", id, t.book, t.name, t.glyph, t.color, t.cls);
for (const [id, m] of Object.entries(MASTERIES)) addBook("mastery", id, m.book, m.name, m.glyph, "#e8c98a", null);
for (const [id, e] of Object.entries(ELEMENTS)) addBook("element", id, e.book, e.name, e.glyph, e.color, null);
for (const [id, m] of Object.entries(MASTERIES)) {
  if (m.max2) addBook("mastery2", id, undefined, `${m.name} ขั้นสอง`, m.glyph, "#ffd36b", null,
    `อ่านเพื่อขยายความเชี่ยวชาญ${m.name}ถึงระดับ ${m.max2} (ต้องเรียนความเชี่ยวชาญ${m.name}ก่อน)`);
}
for (const [id, e] of Object.entries(ELEMENTS)) {
  if (e.max2) addBook("element2", id, undefined, `${e.name} ขั้นสอง`, e.glyph, e.color, null,
    `อ่านเพื่อขยายธาตุ${e.name}ถึงระดับ ${e.max2} (ต้องเรียนธาตุ${e.name}ก่อน)`);
}

// The first active skill of a tree (one that needs nothing before it).
export function firstActive(treeId: string): string | null {
  return TREES[treeId].nodes.find((n) => n.kind === "active" && !n.req?.length)?.id ?? null;
}

// Every active skill by id: { name, glyph, color, skill, rankOf(progress) }.
export const ACTIVES: Record<string, Active> = {};
for (const [treeId, tree] of Object.entries(TREES)) {
  for (const n of tree.nodes) {
    if (n.kind === "active" && n.skill) ACTIVES[n.id] = { ...n, skill: n.skill, source: { tree: treeId }, color: tree.color };
  }
}
for (const [mid, m] of Object.entries(MASTERIES)) {
  for (const r of m.rewards) {
    if (r.kind === "active" && r.id && r.skill) {
      ACTIVES[r.id] = { id: r.id, name: r.name, glyph: r.glyph ?? "star", skill: r.skill, max: 1, source: { mastery: mid, at: r.at }, need: m.weapons && { weapons: m.weapons }, color: "#ffe6a8", desc: r.desc };
    }
  }
}

// What a skill costs in MP at a rank: the cost it is written with is rank 1's, and each rank
// after costs more, up to MP_GROWTH more at its top rank (a one-rank skill stays as written).
export const MP_GROWTH = 0.8;
export function mpCost(id: string, rank: number): number {
  const a = ACTIVES[id];
  if (!a) return 0;
  const r = Math.min(Math.max(1, rank), a.max);
  return a.max > 1 ? Math.round(a.skill.mp * (1 + (MP_GROWTH * (r - 1)) / (a.max - 1))) : a.skill.mp;
}


interface SaveData {
  cls?: ClassId | null;
  level?: number;
  xp?: number;
  ranks?: Record<string, number>;
  mastery?: Record<string, number>;
  elements?: Record<string, number>;
  unlocked?: { trees?: string[]; masteries?: string[]; elements?: string[] };
  extended?: string[];
  hotbar?: (string | null)[];
  bonus?: number;
  job?: JobId | null;
  branch?: string | null;
  job3?: Job3Id | null;
  branch3?: string | null;
  treesV?: number;
  learnV?: number;
}

// Bumped when the trees are redrawn: older saves get their tree points back once.
const TREES_VERSION = 3;
// Saves from before characters learned their trees, masteries and elements one at a time knew
// their class's three trees, every weapon mastery and every element without a book.
const LEARN_VERSION = 1;

export class Progress {
  listeners = new Set<(p: Progress) => void>();
  cls: ClassId | null = null;
  level = 1;
  xp = 0;
  ranks: Record<string, number> = {};    // tree node id -> rank
  mastery: Record<string, number> = {};  // mastery id -> level
  elements: Record<string, number> = {}; // element id -> level
  unlocked: { trees: string[]; masteries: string[]; elements: string[] } = { trees: [], masteries: [], elements: [] }; // learned: picked at the start, or from books
  extended: string[] = [];               // second books read: "mastery:<id>", "element:<id>"
  hotbar: (string | null)[] = new Array(10).fill(null);
  bonus = 0;                             // skill points from quests and jobs, on top of one a level
  job: JobId | null = null;              // the second job, and the branch picked with it
  branch: string | null = null;
  job3: Job3Id | null = null;            // the third job, and its branch
  branch3: string | null = null;

  constructor() {
    if (!this.load()) this.reset(null);
  }

  // A fresh character of a class (null: not chosen yet).
  reset(cls: ClassId | null): void {
    this.cls = cls;
    this.level = 1;
    this.xp = 0;
    this.ranks = {};
    this.mastery = {};
    this.elements = {};
    this.unlocked = { trees: [], masteries: [], elements: [] };
    this.extended = [];
    this.hotbar = new Array(10).fill(null);
    this.bonus = 0;
    this.job = null;
    this.branch = null;
    this.job3 = null;
    this.branch3 = null;
    this.changed();
  }

  // Why it can't take a job yet, or null.
  jobBlock(id: JobId): string | null {
    const j = JOBS[id];
    if (this.job) return `เปลี่ยนเป็น${JOBS[this.job].name}ไปแล้ว`;
    if (!jobOpen(id)) return `${j.name}ยังไม่เปิดให้เปลี่ยน รออีกไม่นาน`;
    if (j.from && !j.from.includes(this.cls as ClassId)) return `ต้องเป็น${j.from.map((c) => CLASSES[c].name).join(" หรือ ")}`;
    if (this.level < JOB_LEVEL) return `ต้องเลเวล ${JOB_LEVEL} ขึ้นไป`;
    return null;
  }

  // Take a job with one of its branches: the branch's tree, JOB_POINTS points and its first
  // skill on the bar. False when it can't.
  takeJob(id: JobId, branch: string): boolean {
    if (this.jobBlock(id) || !JOBS[id].branches.includes(branch) || !TREES[branch]) return false;
    this.job = id;
    this.branch = branch;
    if (!this.unlocked.trees.includes(branch)) this.unlocked.trees.push(branch);
    const craft = TREES[branch].opens;
    if (craft && !this.unlocked.masteries.includes(craft)) this.unlocked.masteries.push(craft);
    this.bonus += JOB_POINTS;
    this.changed();
    return true;
  }

  // Why it can't take a third job yet, or null.
  job3Block(id: Job3Id): string | null {
    const j = JOBS3[id];
    if (this.job3) return `เปลี่ยนเป็น${JOBS3[this.job3].name}ไปแล้ว`;
    if (!job3Open(id)) return `${j.name}ยังไม่เปิดให้เปลี่ยน รออีกไม่นาน`;
    if (!this.job) return "ต้องเปลี่ยนอาชีพที่ 2 ก่อน";
    if (j.from && !j.from.includes(this.job)) return `ต้องเป็น${j.from.map((c) => JOBS[c].name).join(" หรือ ")}`;
    if (this.level < THIRD_JOB_LEVEL) return `ต้องเลเวล ${THIRD_JOB_LEVEL} ขึ้นไป`;
    return null;
  }

  // Take a third job with one of its branches, as takeJob does a second: the branch's tree,
  // JOB_POINTS points and its first skill on the bar if there's room. False when it can't.
  takeJob3(id: Job3Id, branch: string): boolean {
    if (this.job3Block(id) || !JOBS3[id].branches.includes(branch) || !TREES[branch]) return false;
    this.job3 = id;
    this.branch3 = branch;
    if (!this.unlocked.trees.includes(branch)) this.unlocked.trees.push(branch);
    const craft = TREES[branch].opens;
    if (craft && !this.unlocked.masteries.includes(craft)) this.unlocked.masteries.push(craft);
    this.bonus += JOB_POINTS;
    const first = firstActive(branch);
    if (first) this.autoSlot(first);
    this.changed();
    return true;
  }

  // What a new character knows: one of its class's trees, one element and one weapon mastery;
  // the tree's first skill waits in the first slot of the skill bar.
  start(tree: string, element: string, mastery: string): void {
    this.unlocked = { trees: [tree], masteries: [mastery], elements: [element] };
    this.hotbar = new Array(10).fill(null);
    this.hotbar[0] = firstActive(tree);
    this.changed();
  }

  // Keep the level and books, give every point back.
  refund(): void {
    this.ranks = {};
    this.mastery = {};
    this.elements = {};
    this.changed();
  }

  onChange(fn: (p: Progress) => void): void {
    this.listeners.add(fn);
  }

  // A copy to plan points on (the skill window): it saves nothing and tells no one.
  draft(): Progress {
    const d = Object.create(Progress.prototype) as Progress;
    Object.assign(d, structuredClone({
      cls: this.cls, level: this.level, xp: this.xp, ranks: this.ranks, mastery: this.mastery,
      elements: this.elements, unlocked: this.unlocked, extended: this.extended, hotbar: this.hotbar, bonus: this.bonus,
      job: this.job, branch: this.branch, job3: this.job3, branch3: this.branch3,
    }));
    d.listeners = new Set();
    d.save = () => {};
    return d;
  }

  changed(): void {
    this.save();
    for (const fn of this.listeners) fn(this);
  }

  get points() {
    return this.level + this.bonus;
  }

  get spent() {
    const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
    return sum(this.ranks) + sum(this.mastery) + sum(this.elements);
  }

  get free() {
    return this.points - this.spent;
  }

  get xpNeed() {
    return this.level >= MAX_LEVEL ? Infinity : xpToNext(this.level);
  }

  // Add experience; returns how many levels were gained.
  addXp(amount: number): number {
    if (this.level >= MAX_LEVEL) return 0;
    this.xp += amount;
    let gained = 0;
    while (this.level < MAX_LEVEL && this.xp >= xpToNext(this.level)) {
      this.xp -= xpToNext(this.level);
      this.level++;
      gained++;
    }
    if (this.level >= MAX_LEVEL) this.xp = 0;
    this.changed();
    return gained;
  }

  // What it has learned (the windows show nothing else).
  trees(): string[] {
    return this.unlocked.trees;
  }

  masteries(): string[] {
    return this.unlocked.masteries;
  }

  elementsOpen(): string[] {
    return this.unlocked.elements;
  }

  pointsIn(treeId: string): number {
    return TREES[treeId].nodes.reduce((a, n) => a + (this.ranks[n.id] ?? 0), 0);
  }

  // Why a node can't take a point, or null when it can.
  blockNode(treeId: string, node: TreeNode): string | null {
    if (!this.trees().includes(treeId)) return "ยังไม่ได้เรียนตำราสกิลนี้";
    if ((this.ranks[node.id] ?? 0) >= node.max) return "เต็มแล้ว";
    const miss = this.missing(node);
    if (miss.length) return `ต้องอัพ ${miss.map(([id, n]) => `${NODES[id].node.name} ถึงระดับ ${n}`).join(" และ ")} ก่อน`;
    if (this.free <= 0) return "แต้มสกิลไม่พอ";
    return null;
  }

  // Prerequisites of a node that aren't met yet: [node id, rank needed].
  missing(node: TreeNode): [string, number][] {
    return (node.req ?? []).filter(([id, n]) => (this.ranks[id] ?? 0) < n);
  }

  raiseNode(treeId: string, nodeId: string): boolean {
    const node = TREES[treeId].nodes.find((n) => n.id === nodeId);
    if (!node || this.blockNode(treeId, node)) return false;
    this.ranks[nodeId] = (this.ranks[nodeId] ?? 0) + 1;
    // a newly learned active goes into the first empty hotbar slot
    if (node.kind === "active" && this.ranks[nodeId] === 1) this.autoSlot(nodeId);
    this.changed();
    return true;
  }

  // Where a mastery's or element's line ends for it now: further once its second book is read.
  masteryMax(id: string): number {
    const m = MASTERIES[id];
    return m.max2 && this.extended.includes(`mastery:${id}`) ? m.max2 : m.max;
  }

  elementMax(id: string): number {
    const e = ELEMENTS[id];
    return e.max2 && this.extended.includes(`element:${id}`) ? e.max2 : e.max;
  }

  raiseMastery(id: string): boolean {
    const m = MASTERIES[id];
    if (!m || !this.masteries().includes(id) || (this.mastery[id] ?? 0) >= this.masteryMax(id) || this.free <= 0) return false;
    this.mastery[id] = (this.mastery[id] ?? 0) + 1;
    for (const r of m.rewards) if (r.kind === "active" && r.id && r.at === this.mastery[id]) this.autoSlot(r.id);
    this.changed();
    return true;
  }

  raiseElement(id: string): boolean {
    const e = ELEMENTS[id];
    if (!e || !this.elementsOpen().includes(id) || (this.elements[id] ?? 0) >= this.elementMax(id) || this.free <= 0) return false;
    this.elements[id] = (this.elements[id] ?? 0) + 1;
    this.changed();
    return true;
  }

  // Whether a book teaches something new it can learn (another class's tree it can't; a second
  // book only once the first is learned).
  canRead(bookId: string): boolean {
    const b = BOOKS[bookId];
    if (!b) return false;
    if (b.kind === "mastery2" || b.kind === "element2") {
      const base = b.kind === "mastery2" ? "mastery" : "element";
      return (base === "mastery" ? this.unlocked.masteries : this.unlocked.elements).includes(b.id) && !this.extended.includes(`${base}:${b.id}`);
    }
    if (b.kind === "tree" && TREES[b.id].cls && TREES[b.id].cls !== this.cls) return false;
    return !{ tree: this.unlocked.trees, mastery: this.unlocked.masteries, element: this.unlocked.elements }[b.kind].includes(b.id);
  }

  // Read a book item: returns what it taught, or why it taught nothing (ok: false).
  readBook(bookId: string): { ok: boolean; text: string } {
    const b = BOOKS[bookId];
    if (!b) return { ok: false, text: "อ่านไม่ได้" };
    if (b.kind === "mastery2" || b.kind === "element2") {
      const mastery = b.kind === "mastery2";
      const name = mastery ? `ความเชี่ยวชาญ${MASTERIES[b.id].name}` : `ธาตุ${ELEMENTS[b.id].name}`;
      const key = `${mastery ? "mastery" : "element"}:${b.id}`;
      if (!(mastery ? this.unlocked.masteries : this.unlocked.elements).includes(b.id)) return { ok: false, text: `ต้องเรียน${name}ก่อน` };
      if (this.extended.includes(key)) return { ok: false, text: `ขยาย${name}ไปแล้ว` };
      this.extended.push(key);
      this.changed();
      return { ok: true, text: `${name}ขยายได้ถึงระดับ ${mastery ? this.masteryMax(b.id) : this.elementMax(b.id)} แล้ว` };
    }
    const tree = b.kind === "tree" ? TREES[b.id] : null;
    if (tree?.cls && tree.cls !== this.cls) return { ok: false, text: `ตำรานี้สำหรับ${CLASSES[tree.cls].name}เท่านั้น` };
    const list = { tree: this.unlocked.trees, mastery: this.unlocked.masteries, element: this.unlocked.elements }[b.kind];
    if (list.includes(b.id)) return { ok: false, text: "เรียนตำรานี้ไปแล้ว" };
    list.push(b.id);
    this.changed();
    const name = tree ? tree.name : b.kind === "mastery" ? MASTERIES[b.id].name : ELEMENTS[b.id].name;
    return { ok: true, text: `เรียน${name.startsWith("ตำรา") ? name : BOOK_WORD[b.kind] + name}แล้ว` };
  }

  autoSlot(skillId: string): void {
    if (this.hotbar.includes(skillId)) return;
    const i = this.hotbar.indexOf(null);
    if (i >= 0) this.hotbar[i] = skillId;
  }

  setSlot(i: number, skillId: string): void {
    const j = this.hotbar.indexOf(skillId);
    if (j >= 0) this.hotbar[j] = this.hotbar[i];
    this.hotbar[i] = skillId;
    this.changed();
  }

  // Rank of an active skill (mastery skills are rank 1 once their level is reached).
  skillRank(id: string): number {
    const a = ACTIVES[id];
    if (!a) return 0;
    if (a.source.tree) return this.trees().includes(a.source.tree) ? this.ranks[id] ?? 0 : 0;
    return (this.mastery[a.source.mastery!] ?? 0) >= a.source.at! ? 1 : 0;
  }

  save(): void {
    try {
      localStorage.setItem(saveKey("character.v1"), JSON.stringify({
        cls: this.cls, level: this.level, xp: this.xp, ranks: this.ranks, mastery: this.mastery,
        elements: this.elements, unlocked: this.unlocked, extended: this.extended, hotbar: this.hotbar, bonus: this.bonus, job: this.job, branch: this.branch,
        job3: this.job3, branch3: this.branch3, treesV: TREES_VERSION, learnV: LEARN_VERSION,
      }));
    } catch {
      // not persisted
    }
  }

  load(): boolean {
    let d: SaveData | null = null;
    try {
      d = JSON.parse(localStorage.getItem(saveKey("character.v1")) || "null");
    } catch {
      return false;
    }
    if (!d || (d.cls && !CLASSES[d.cls])) return false;
    const saved = d;
    this.cls = d.cls ?? null;
    this.level = Math.max(1, Math.min(MAX_LEVEL, (d.level ?? 1) | 0 || 1));
    this.xp = Math.max(0, Number(d.xp) || 0);
    this.bonus = Math.max(0, Number(d.bonus) || 0) | 0;
    this.job = d.job && JOBS[d.job] ? d.job : null;
    this.branch = this.job && d.branch && JOBS[this.job].branches.includes(d.branch) ? d.branch : null;
    // (a save from before the third jobs has none)
    this.job3 = this.job && d.job3 && JOBS3[d.job3] ? d.job3 : null;
    this.branch3 = this.job3 && d.branch3 && JOBS3[this.job3].branches.includes(d.branch3) ? d.branch3 : null;
    const known = (o: Record<string, number> | undefined, ok: (k: string) => boolean) => Object.fromEntries(Object.entries(o ?? {}).filter(([k, v]) => ok(k) && v > 0));
    const nodes = new Set(Object.values(TREES).flatMap((t) => t.nodes.map((n) => n.id)));
    this.ranks = known(d.ranks, (k) => nodes.has(k));
    this.mastery = known(d.mastery, (k) => !!MASTERIES[k]);
    this.elements = known(d.elements, (k) => !!ELEMENTS[k]);
    this.unlocked = {
      trees: (d.unlocked?.trees ?? []).filter((t) => TREES[t]),
      masteries: (d.unlocked?.masteries ?? []).filter((m) => MASTERIES[m]),
      elements: (d.unlocked?.elements ?? []).filter((e) => ELEMENTS[e]),
    };
    this.extended = (d.extended ?? []).filter((x) => {
      const [kind, id] = x.split(":");
      return kind === "mastery" ? !!MASTERIES[id]?.max2 : kind === "element" && !!ELEMENTS[id]?.max2;
    });
    // an older character keeps everything it could use before
    if (d.learnV !== LEARN_VERSION) {
      const add = (list: string[], more: string[]) => list.push(...more.filter((x) => !list.includes(x)));
      add(this.unlocked.trees, this.cls ? CLASSES[this.cls].trees : []);
      add(this.unlocked.masteries, Object.keys(MASTERIES).filter((m) => MASTERIES[m].kind === "weapon"));
      add(this.unlocked.elements, Object.keys(ELEMENTS).filter((e) => !ELEMENTS[e].book));
    }
    this.hotbar = Array.from({ length: 10 }, (_, i) => {
      const id = saved.hotbar?.[i];
      return id && ACTIVES[id] ? id : null;
    });
    // a save from before the current trees, or one that doesn't fit them, gets its tree points back
    if (d.treesV !== TREES_VERSION || Object.keys(this.ranks).some((id) => this.missing(NODES[id].node).length || this.ranks[id] > NODES[id].node.max)) this.ranks = {};
    if (this.spent > this.points) this.refund();
    return true;
  }
}

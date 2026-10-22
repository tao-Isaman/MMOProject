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

export const MAX_LEVEL = 200;

// Stat changes keyed by stat name (stats.ts lists them).
export type StatBag = Partial<Record<string, number>>;
type ByRank<T> = (rank: number) => T;

// Every element: the first five came first, the rest with element attack and defence, poison
// with the second jobs.
export const ELEMENT_IDS = ["earth", "water", "wind", "fire", "lightning", "ice", "light", "dark", "plant", "stone", "mud", "lava", "metal", "poison"] as const;
export type ElementId = (typeof ELEMENT_IDS)[number];

// What a monster is (bestiary.ts): some skills and passives hit one kind harder.
export const RACES = ["formless", "undead", "brute", "plant", "insect", "fish", "demon", "human", "angel", "dragon"] as const;
export type Race = (typeof RACES)[number];
export const RACE_NAMES: Record<Race, string> = {
  formless: "ไร้รูป", undead: "อันเดด", brute: "สัตว์", plant: "พืช", insect: "แมลง",
  fish: "สัตว์น้ำ", demon: "ปีศาจ", human: "มนุษย์", angel: "เทวะ", dragon: "มังกร",
};

// What a skill or passive needs in hand: `weapons` one of these in the main hand; `dual` a
// one-handed weapon in each hand (true: any, a list: each one of those). A passive counts only
// while it is met; an active can't be used without it.
export interface Need {
  weapons?: WeaponId[];
  dual?: true | WeaponId[];
}

export type SkillType = "bolt" | "fan" | "blast" | "nova" | "storm" | "cone" | "beam" | "dash" | "heal" | "shield" | "buff" | "flower" | "trap" | "falcon";

// An active skill's numbers; which fields matter depends on `type` (skills.ts).
//   trap    laid at the aimed spot (`range` at most, `radius` wide); the first monster to step in
//           sets it off (its hit, with stun, slow, poison...). It waits `duration` s (default
//           20); three at most at a time, the oldest goes.
//   falcon  the falcon dives at the locked target `hits` times.
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
  skill?: SkillDef;
  need?: Need;
}

export interface Tree {
  name: string;
  cls: ClassId | null;
  job?: JobId;      // a second job's branch: learned on taking the job, no book
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
  side: string;
  per: StatBag;
  skill: string;
  marks: ElementMark[];
  book?: string;
}

export type ClassId = "mage" | "warrior" | "archer" | "priest";
export type JobId = "ranger" | "swordsman" | "wizard" | "bishop" | "battlemage" | "warlord";

// Whether the hands hold what `need` asks for (main: the main-hand weapon type, off: the off
// hand's, null when empty or not a weapon).
export function needMet(need: Need | undefined, main: string | null, off: string | null): boolean {
  if (!need) return true;
  if (need.weapons && !need.weapons.includes(main as WeaponId)) return false;
  if (need.dual) {
    const ok = (w: string | null) => !!w && (need.dual === true || (need.dual as WeaponId[]).includes(w as WeaponId));
    if (!ok(main) || !ok(off)) return false;
  }
  return true;
}

// "ดาบมือเดียว หรือ ดาบสองมือ", "ดาบมือเดียวทั้งสองมือ", for the skill window and the bar.
export function needText(need: Need | undefined, weaponName: (w: WeaponId) => string): string {
  if (!need) return "";
  const parts: string[] = [];
  if (need.weapons) parts.push(need.weapons.map(weaponName).join(" หรือ "));
  if (need.dual === true) parts.push("อาวุธมือเดียวทั้งสองมือ");
  else if (need.dual) parts.push(`${need.dual.map(weaponName).join(" หรือ ")} ทั้งสองมือ`);
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
};
export const PERCENT_STATS = new Set(["crit", "critDmg", "aspd", "move", "cdr", "castRed", "dmgRed", "reflect"]);

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
}

export const JOBS: Record<JobId, JobDef> = {
  ranger: {
    name: "นายพราน", from: ["archer", "warrior"], branches: ["falconer", "trapper", "venomer"],
    note: "นักล่าแห่งป่า ใช้เหยี่ยว กับดัก และยาพิษ",
    bonus: { atk: 12, hit: 15, flee: 10, crit: 0.03 }, growth: { atk: 0.8, hit: 0.6, flee: 0.5, maxHp: 4 },
  },
  swordsman: {
    name: "นักดาบ", from: null, branches: ["twin_blade", "greatsword"],
    note: "ผู้ใช้ดาบ ถือดาบคู่หรือดาบสองมือ",
    bonus: { atk: 15, maxHp: 150, def: 8 }, growth: { atk: 1, maxHp: 8, def: 0.4 },
  },
  wizard: {
    name: "จอมเวท", from: ["mage", "priest"], branches: ["elementalist", "shadowcraft"],
    note: "ผู้ใช้เวทขั้นสูง เวทธาตุหรือเวทมืด",
    bonus: { matk: 20, maxMp: 80, mdef: 6 }, growth: { matk: 1.2, maxMp: 4, mdef: 0.3 },
  },
  bishop: {
    name: "บาทหลวง", from: ["priest"], branches: ["radiance", "mercy"],
    note: "ผู้รับใช้แสงศักดิ์สิทธิ์ ขับไล่อันเดดหรือรักษาและสนับสนุน",
    bonus: { matk: 12, maxMp: 60, mdef: 10, healPct: 0.1 }, growth: { matk: 0.8, maxMp: 3, mdef: 0.5, maxHp: 4 },
  },
  battlemage: {
    name: "จอมเวทนักสู้", from: null, branches: ["equilibrium", "arcanist", "runeblade"],
    note: "นักสู้ที่ใช้ทั้งดาบและเวท",
    bonus: { atk: 10, matk: 10, maxHp: 80, maxMp: 40 }, growth: { atk: 0.6, matk: 0.6, maxHp: 5, maxMp: 2 },
  },
  warlord: {
    name: "นักรบคลั่ง", from: ["warrior"], branches: ["armsmaster", "bloodrage"],
    note: "นักรบที่บ้าคลั่งในสนามรบ ชำนาญอาวุธหรือเลือดเดือด",
    bonus: { atk: 15, maxHp: 200, hpRegen: 2 }, growth: { atk: 1, maxHp: 10, hpRegen: 0.05 },
  },
};

// What to call a character: its job, else its class.
export function jobName(p: { cls: ClassId | null; job: JobId | null }): string {
  return p.job ? JOBS[p.job].name : p.cls ? CLASSES[p.cls].name : "-";
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
export const TREES: Record<string, Tree> = {
  arcane: {
    name: "เวทโจมตี", cls: "mage", color: "#8fb6ff", glyph: "bolt",
    note: "ยิงเวทใส่ศัตรูจากระยะไกล แยกสายศร สายไฟ สายน้ำแข็ง",
    nodes: [
      { id: "arcane_focus", name: "สมาธิเวท", kind: "passive", max: 10, pos: [0, 0], glyph: "up",
        stats: (r) => ({ matkPct: 0.02 * r }), desc: (r) => `พลังเวท +${pct(0.02 * r)}` },
      { id: "magic_bolt", name: "ลูกศรเวท", kind: "active", max: 10, pos: [1, 0], glyph: "bolt",
        skill: { type: "bolt", stat: "matk", mult: lin(1.5, 0.15), mp: 6, cd: 1.2, motion: "cast", speed: 1100, range: 620, radius: 30, color: "#9cc4ff" },
        desc: (r) => `ยิงลูกเวทไปทางที่เล็ง ดาเมจ ${pct(lin(1.5, 0.15)(r))} ของพลังเวท` },
      { id: "fire_bolt", name: "ศรเพลิง", kind: "active", max: 10, pos: [2, 0], glyph: "flame",
        skill: { type: "bolt", stat: "matk", mult: lin(3.6, 0.36), mp: 12, cd: 2, cast: 1, motion: "cast", speed: 950, range: 560, radius: 36, color: "#ffb27a" },
        desc: (r) => `ร่ายลูกไฟแล้วยิงใส่เป้าหมาย ดาเมจ ${pct(lin(3.6, 0.36)(r))} ของพลังเวท` },
      { id: "cold_bolt", name: "ศรน้ำแข็ง", kind: "active", max: 10, pos: [3, 0], glyph: "freeze",
        skill: { type: "bolt", stat: "matk", mult: lin(2.6, 0.26), slow: lin(1.2, 0.15), mp: 10, cd: 2, cast: 0.8, motion: "cast", speed: 1000, range: 600, radius: 30, color: "#bfe6ff" },
        desc: (r) => `ยิงเกล็ดน้ำแข็ง ดาเมจ ${pct(lin(2.6, 0.26)(r))} ของพลังเวท ศัตรูช้าลง ${lin(1.2, 0.15)(r).toFixed(1)} วิ` },
      { id: "mana_well", name: "บ่อมานา", kind: "passive", max: 10, pos: [0, 1], req: [["arcane_focus", 3]], glyph: "drop",
        stats: (r) => ({ maxMpPct: 0.03 * r, mpRegen: 0.3 * r }), desc: (r) => `MP สูงสุด +${pct(0.03 * r)} ฟื้น MP +${(0.3 * r).toFixed(1)}/วิ` },
      { id: "soul_volley", name: "ห่าศรวิญญาณ", kind: "active", max: 10, pos: [1, 1], req: [["magic_bolt", 5]], glyph: "fan",
        skill: { type: "fan", stat: "matk", mult: lin(1.6, 0.16), count: 5, spread: 36, mp: 18, cd: 4, cast: 1, motion: "cast", speed: 1050, range: 560, radius: 26, color: "#b9c8ff" },
        desc: (r) => `ยิงลูกเวท 5 ลูกเป็นรูปพัด ลูกละ ${pct(lin(1.6, 0.16)(r))} ของพลังเวท` },
      { id: "fire_ball", name: "ลูกไฟระเบิด", kind: "active", max: 10, pos: [2, 1], req: [["fire_bolt", 4]], glyph: "burst",
        skill: { type: "blast", stat: "matk", mult: lin(4.2, 0.42), mp: 20, cd: 6, cast: 1.6, motion: "cast", range: 520, radius: 150, delay: 0.35, color: "#ff9a5a" },
        desc: (r) => `ระเบิดไฟตรงจุดที่เล็ง รัศมี 1.5 ม. ดาเมจ ${pct(lin(4.2, 0.42)(r))} ของพลังเวท` },
      { id: "frost_nova", name: "วงแหวนเยือกแข็ง", kind: "active", max: 10, pos: [3, 1], req: [["cold_bolt", 5]], glyph: "swirl",
        skill: { type: "nova", stat: "matk", mult: lin(1, 0.1), freeze: lin(1.2, 0.12), mp: 22, cd: 10, motion: "cast", radius: 240, color: "#d8f0ff" },
        desc: (r) => `แช่แข็งศัตรูรอบตัวรัศมี 2.4 ม. ${lin(1.2, 0.12)(r).toFixed(1)} วิ ดาเมจ ${pct(lin(1, 0.1)(r))} ของพลังเวท` },
      { id: "quick_cast", name: "ร่ายไว", kind: "passive", max: 5, pos: [0, 2], req: [["mana_well", 5]], glyph: "swirl",
        stats: (r) => ({ castRed: 0.04 * r }), desc: (r) => `ลดเวลาร่าย ${pct(0.04 * r)}` },
      { id: "arcane_pierce", name: "เวทเจาะเกราะ", kind: "passive", max: 5, pos: [1, 2], req: [["mana_well", 3], ["soul_volley", 3]], glyph: "pierce",
        stats: (r) => ({ pierce: 0.05 * r }), desc: (r) => `ไม่สนการป้องกันของศัตรู ${pct(0.05 * r)}` },
      { id: "ice_lance", name: "หอกน้ำแข็ง", kind: "active", max: 5, pos: [3, 2], req: [["frost_nova", 3]], glyph: "beam",
        skill: { type: "beam", stat: "matk", mult: lin(6.5, 0.9), slow: lin(2, 0.3), mp: 28, cd: 9, cast: 1.8, motion: "cast", length: 620, width: 60, color: "#cfefff" },
        desc: (r) => `พุ่งหอกน้ำแข็งยาว 6.2 ม. ทะลุทุกตัว ดาเมจ ${pct(lin(6.5, 0.9)(r))} ของพลังเวท ช้าลง ${lin(2, 0.3)(r).toFixed(1)} วิ` },
      { id: "ruin_beam", name: "ลำแสงทำลายล้าง", kind: "active", max: 5, pos: [1, 3], req: [["arcane_pierce", 3], ["quick_cast", 1]], glyph: "beam",
        skill: { type: "beam", stat: "matk", mult: lin(9, 1.2), mp: 40, cd: 14, cast: 2.5, motion: "cast", length: 700, width: 70, color: "#cfe0ff" },
        desc: (r) => `ยิงลำแสงยาว 7 ม. ทะลุทุกตัว ดาเมจ ${pct(lin(9, 1.2)(r))} ของพลังเวท` },
      { id: "meteor", name: "พายุอุกกาบาต", kind: "active", max: 5, pos: [2, 3], req: [["fire_ball", 7], ["ice_lance", 1]], glyph: "burst",
        skill: { type: "blast", stat: "matk", mult: lin(3.8, 0.45), hits: 4, every: 0.3, mp: 45, cd: 18, cast: 3, motion: "cast", range: 560, radius: 200, delay: 0.6, stun: lin(0.5, 0.1), color: "#ff8a4a" },
        desc: (r) => `อุกกาบาต 4 ลูกตกใส่จุดที่เล็ง รัศมี 2 ม. ลูกละ ${pct(lin(3.8, 0.45)(r))} ของพลังเวท มึน ${lin(0.5, 0.1)(r).toFixed(1)} วิ` },
    ],
  },
  flora: {
    name: "เวทพฤกษา", cls: "mage", color: "#9df0b4", glyph: "flower",
    note: "สายหนาม สายรักษา สายทุ่งดอกไม้ เล่นได้นาน",
    nodes: [
      { id: "seed_shot", name: "เมล็ดพุ่ง", kind: "active", max: 10, pos: [0, 0], glyph: "leaf",
        skill: { type: "bolt", stat: "matk", mult: lin(1.3, 0.13), mp: 6, cd: 1.3, motion: "cast", speed: 1000, range: 580, radius: 28, color: "#a8f0a0" },
        desc: (r) => `ดีดเมล็ดพืชไปทางที่เล็ง ดาเมจ ${pct(lin(1.3, 0.13)(r))} ของพลังเวท` },
      { id: "bloom_heal", name: "พรแห่งพฤกษา", kind: "active", max: 10, pos: [1, 0], glyph: "heal",
        skill: { type: "heal", stat: "matk", mult: lin(0.8, 0.1), heal: lin(0.12, 0.015), mp: 16, cd: 6, motion: "cast", color: "#b9ffd0" },
        desc: (r) => `ฟื้น HP ${pct(lin(0.12, 0.015)(r))} ของ HP สูงสุด + ${pct(lin(0.8, 0.1)(r))} ของพลังเวท` },
      { id: "flower_field", name: "ทุ่งดอกไม้", kind: "active", max: 10, pos: [2, 0], glyph: "flower",
        skill: { type: "flower", stat: "matk", mult: lin(0.6, 0.07), heal: lin(0.1, 0.012), mp: 25, cd: 9, cast: 1.5, motion: "cast", radius: 450, ticks: 4, color: "#b9ffd0" },
        desc: (r) => `ดอกไม้บานรอบตัวรัศมี 4.5 ม. ดาเมจ ${pct(lin(0.6, 0.07)(r))} ของพลังเวท 4 ครั้ง และฟื้น HP ${pct(lin(0.1, 0.012)(r))}` },
      { id: "deep_roots", name: "รากหยั่งลึก", kind: "passive", max: 10, pos: [3, 0], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.025 * r }), desc: (r) => `HP สูงสุด +${pct(0.025 * r)}` },
      { id: "thorn_bind", name: "หนามพันธนาการ", kind: "active", max: 10, pos: [0, 1], req: [["seed_shot", 4]], glyph: "thorn",
        skill: { type: "blast", stat: "matk", mult: lin(3.2, 0.32), slow: lin(2, 0.2), mp: 22, cd: 9, cast: 1.2, motion: "cast", range: 520, radius: 200, delay: 0.3, color: "#8fe0a0" },
        desc: (r) => `หนามโผล่ตรงจุดที่เล็ง ดาเมจ ${pct(lin(3.2, 0.32)(r))} ของพลังเวท ศัตรูช้าลง ${lin(2, 0.2)(r).toFixed(1)} วิ` },
      { id: "morning_dew", name: "น้ำค้างยามเช้า", kind: "passive", max: 10, pos: [1, 1], req: [["bloom_heal", 3]], glyph: "drop",
        stats: (r) => ({ hpRegen: 0.8 * r, mpRegen: 0.4 * r }), desc: (r) => `ฟื้น HP +${(0.8 * r).toFixed(1)}/วิ ฟื้น MP +${(0.4 * r).toFixed(1)}/วิ` },
      { id: "bark_skin", name: "ผิวเปลือกไม้", kind: "passive", max: 5, pos: [3, 1], req: [["deep_roots", 4]], glyph: "shield",
        stats: (r) => ({ defPct: 0.04 * r, mdefPct: 0.04 * r, dmgRed: 0.01 * r }), desc: (r) => `ป้องกันและต้านเวท +${pct(0.04 * r)} ลดความเสียหาย ${pct(0.01 * r)}` },
      { id: "vine_whip", name: "แส้เถาวัลย์", kind: "active", max: 5, pos: [0, 2], req: [["thorn_bind", 3]], glyph: "twin",
        skill: { type: "cone", stat: "matk", mult: lin(2.6, 0.35), hits: 2, slow: lin(1.5, 0.2), mp: 18, cd: 5, cast: 0.8, motion: "cast", reach: 230, arc: 80, color: "#7fd890" },
        desc: (r) => `ฟาดเถาวัลย์ด้านหน้า 2 ครั้ง ครั้งละ ${pct(lin(2.6, 0.35)(r))} ของพลังเวท ศัตรูช้าลง ${lin(1.5, 0.2)(r).toFixed(1)} วิ` },
      { id: "sanctuary", name: "สวนศักดิ์สิทธิ์", kind: "active", max: 5, pos: [2, 2], req: [["morning_dew", 3], ["flower_field", 5]], glyph: "leaf",
        skill: { type: "buff", mp: 35, cd: 25, motion: "cast", duration: 10, heal: lin(0.1, 0.02), buff: (r) => ({ hpRegen: 8 + 4 * r, dmgRed: 0.05 + 0.02 * r }), color: "#c8ffd8" },
        desc: (r) => `10 วิ: ฟื้น HP +${8 + 4 * r}/วิ ลดความเสียหาย ${pct(0.05 + 0.02 * r)} และฟื้น HP ทันที ${pct(lin(0.1, 0.02)(r))}` },
      { id: "spring", name: "ฤดูใบไม้ผลิ", kind: "passive", max: 5, pos: [3, 2], req: [["bark_skin", 3]], glyph: "flower",
        stats: (r) => ({ mpRegenPct: 0.06 * r, cdr: 0.01 * r }), desc: (r) => `ฟื้น MP +${pct(0.06 * r)} ลดคูลดาวน์ ${pct(0.01 * r)}` },
      { id: "petal_storm", name: "พายุกลีบดอก", kind: "active", max: 5, pos: [1, 3], req: [["vine_whip", 1], ["sanctuary", 3]], glyph: "storm",
        skill: { type: "storm", stat: "matk", mult: lin(1.7, 0.2), pulses: 6, every: 0.25, mp: 40, cd: 18, cast: 1.5, motion: "cast", radius: 260, color: "#ffc8e8" },
        desc: (r) => `กลีบดอกหมุนรอบตัวรัศมี 2.6 ม. 6 ครั้ง ครั้งละ ${pct(lin(1.7, 0.2)(r))} ของพลังเวท` },
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
      { id: "haste", name: "เร่งกาล", kind: "active", max: 5, pos: [3, 0], glyph: "dash",
        skill: { type: "buff", mp: 18, cd: 25, motion: "cast", duration: 15, buff: (r) => ({ move: 0.1 + 0.03 * r, aspd: 0.05 + 0.02 * r }), color: "#e0d4ff" },
        desc: (r) => `15 วิ: ความเร็วเดิน +${pct(0.1 + 0.03 * r)} ความเร็วโจมตี +${pct(0.05 + 0.02 * r)}` },
      { id: "spell_ward", name: "ม่านกันเวท", kind: "passive", max: 5, pos: [0, 1], req: [["mana_shield", 4]], glyph: "shield",
        stats: (r) => ({ mdefPct: 0.06 * r, dmgRed: 0.015 * r }), desc: (r) => `ต้านเวท +${pct(0.06 * r)} ลดความเสียหาย ${pct(0.015 * r)}` },
      { id: "gravity", name: "แรงโน้มถ่วง", kind: "active", max: 5, pos: [1, 1], req: [["repulse", 4]], glyph: "earth",
        skill: { type: "blast", stat: "matk", mult: lin(3.2, 0.4), hits: 3, every: 0.4, slow: lin(2.5, 0.3), mp: 30, cd: 14, cast: 1.8, motion: "cast", range: 520, radius: 220, delay: 0.5, color: "#a890ff" },
        desc: (r) => `บีบอากาศตรงจุดที่เล็ง 3 ครั้ง รัศมี 2.2 ม. ครั้งละ ${pct(lin(3.2, 0.4)(r))} ของพลังเวท ช้าลง ${lin(2.5, 0.3)(r).toFixed(1)} วิ` },
      { id: "mana_flow", name: "กระแสมานา", kind: "passive", max: 10, pos: [2, 1], req: [["mind_armor", 3]], glyph: "swirl",
        stats: (r) => ({ mpRegenPct: 0.04 * r, cdr: 0.01 * r }), desc: (r) => `ฟื้น MP +${pct(0.04 * r)} ลดคูลดาวน์ ${pct(0.01 * r)}` },
      { id: "blink", name: "เทเลพอร์ต", kind: "active", max: 1, pos: [3, 1], req: [["haste", 3]], glyph: "dash",
        skill: { type: "dash", mp: 10, cd: 8, motion: "cast", distance: 320, color: "#e8e0ff" },
        desc: () => "หายตัวไปโผล่ทางที่เล็ง 3.2 ม. ผ่านศัตรูได้" },
      { id: "time_stop", name: "ผนึกกาลเวลา", kind: "active", max: 5, pos: [1, 2], req: [["spell_ward", 3], ["gravity", 3]], glyph: "freeze",
        skill: { type: "nova", stat: "matk", mult: lin(0.8, 0.1), mp: 30, cd: 16, motion: "cast", radius: 320, freeze: lin(2, 0.3), color: "#e2f0ff" },
        desc: (r) => `หยุดศัตรูรอบตัวรัศมี 3.2 ม. ${lin(2, 0.3)(r).toFixed(1)} วิ ดาเมจ ${pct(lin(0.8, 0.1)(r))} ของพลังเวท` },
      { id: "fleet_mind", name: "จิตว่องไว", kind: "passive", max: 5, pos: [3, 2], req: [["blink", 1]], glyph: "up",
        stats: (r) => ({ move: 0.02 * r, aspd: 0.02 * r }), desc: (r) => `ความเร็วเดินและความเร็วโจมตี +${pct(0.02 * r)}` },
      { id: "singularity", name: "หลุมดำ", kind: "active", max: 5, pos: [2, 3], req: [["time_stop", 1], ["mana_flow", 5]], glyph: "burst",
        skill: { type: "blast", stat: "matk", mult: lin(7.5, 0.9), stun: lin(1.5, 0.2), mp: 50, cd: 22, cast: 2.8, motion: "cast", range: 560, radius: 260, delay: 0.8, color: "#9a80ff" },
        desc: (r) => `เปิดหลุมดำตรงจุดที่เล็ง รัศมี 2.6 ม. ดาเมจ ${pct(lin(7.5, 0.9)(r))} ของพลังเวท มึน ${lin(1.5, 0.2)(r).toFixed(1)} วิ` },
    ],
  },
  berserker: {
    name: "ผู้ทำลาย", cls: "warrior", color: "#ff9a7a", glyph: "spin",
    note: "ฟันหนัก ฟันรอบตัว คริติคอลสูง ยิ่งเจ็บยิ่งแรง",
    nodes: [
      { id: "bash", name: "ฟันกระแทก", kind: "active", max: 10, pos: [0, 0], glyph: "bash",
        skill: { type: "cone", stat: "atk", mult: lin(1.6, 0.2), mp: 6, cd: 1.5, motion: "swing", reach: 160, arc: 50, color: "#ffd0b8" },
        desc: (r) => `ฟันแรง ๆ ใส่ตัวข้างหน้า ดาเมจ ${pct(lin(1.6, 0.2)(r))} ของพลังโจมตี` },
      { id: "hot_blood", name: "เลือดเดือด", kind: "passive", max: 10, pos: [1, 0], glyph: "up",
        stats: (r) => ({ atkPct: 0.02 * r }), desc: (r) => `พลังโจมตี +${pct(0.02 * r)}` },
      { id: "provoke", name: "ท้าทาย", kind: "active", max: 10, pos: [2, 0], glyph: "cry",
        skill: { type: "buff", mp: 8, cd: 20, motion: "swing", duration: 20, buff: (r) => ({ atkPct: 0.03 * r, defPct: -0.04 * r }), color: "#ff8a6a" },
        desc: (r) => `20 วิ: พลังโจมตี +${pct(0.03 * r)} แต่ป้องกัน −${pct(0.04 * r)}` },
      { id: "endure", name: "อดทน", kind: "passive", max: 10, pos: [3, 0], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.02 * r, hpRegen: 0.5 * r }), desc: (r) => `HP สูงสุด +${pct(0.02 * r)} ฟื้น HP +${(0.5 * r).toFixed(1)}/วิ` },
      { id: "magnum_break", name: "ระเบิดดาบ", kind: "active", max: 10, pos: [0, 1], req: [["bash", 5]], glyph: "burst",
        skill: { type: "nova", stat: "atk", mult: lin(1.8, 0.2), mp: 15, cd: 5, motion: "swing", radius: 200, knock: 80, color: "#ffb070" },
        desc: (r) => `ระเบิดรอบตัวรัศมี 2 ม. ผลักศัตรูออก ดาเมจ ${pct(lin(1.8, 0.2)(r))} ของพลังโจมตี` },
      { id: "whirlwind", name: "ฟันหมุน", kind: "active", max: 10, pos: [1, 1], req: [["bash", 3], ["hot_blood", 3]], glyph: "spin",
        skill: { type: "nova", stat: "atk", mult: lin(1.6, 0.18), mp: 10, cd: 4, motion: "swing", radius: 190, color: "#ffd0b8" },
        desc: (r) => `ฟันรอบตัวรัศมี 1.9 ม. ดาเมจ ${pct(lin(1.6, 0.18)(r))} ของพลังโจมตี` },
      { id: "frenzy", name: "บ้าคลั่ง", kind: "passive", max: 5, pos: [2, 1], req: [["hot_blood", 5], ["provoke", 3]], glyph: "rage",
        stats: (r) => ({ crit: 0.03 * r, critDmg: 0.06 * r }), desc: (r) => `โอกาสคริติคอล +${pct(0.03 * r)} แรงคริติคอล +${pct(0.06 * r)}` },
      { id: "blood_lust", name: "กระหายเลือด", kind: "passive", max: 5, pos: [3, 1], req: [["endure", 5]], glyph: "drop",
        stats: (r) => ({ atkPct: 0.02 * r, hpRegen: 1 * r }), desc: (r) => `พลังโจมตี +${pct(0.02 * r)} ฟื้น HP +${r}/วิ` },
      { id: "ground_slam", name: "ทุบแผ่นดิน", kind: "active", max: 5, pos: [0, 2], req: [["magnum_break", 5]], glyph: "slam",
        skill: { type: "cone", stat: "atk", mult: lin(2.6, 0.35), mp: 18, cd: 8, motion: "thrust", reach: 230, arc: 100, stun: lin(1, 0.15), color: "#ffcf9a" },
        desc: (r) => `ทุบพื้นด้านหน้า ดาเมจ ${pct(lin(2.6, 0.35)(r))} ของพลังโจมตี มึน ${lin(1, 0.15)(r).toFixed(1)} วิ` },
      { id: "rage", name: "โทสะ", kind: "active", max: 5, pos: [2, 2], req: [["frenzy", 3]], glyph: "rage",
        skill: { type: "buff", mp: 25, cd: 25, motion: "swing", duration: 8, buff: (r) => ({ atkPct: 0.2 + 0.05 * r, aspd: 0.15 }), color: "#ff8a6a" },
        desc: (r) => `8 วิ: พลังโจมตี +${pct(0.2 + 0.05 * r)} ความเร็วโจมตี +15%` },
      { id: "earthquake", name: "แผ่นดินไหว", kind: "active", max: 5, pos: [1, 3], req: [["ground_slam", 3], ["whirlwind", 5]], glyph: "earth",
        skill: { type: "storm", stat: "atk", mult: lin(1.2, 0.15), pulses: 4, every: 0.3, mp: 35, cd: 16, motion: "thrust", radius: 260, color: "#e8b070" },
        desc: (r) => `ทุบพื้นรอบตัวรัศมี 2.6 ม. 4 ครั้ง ครั้งละ ${pct(lin(1.2, 0.15)(r))} ของพลังโจมตี` },
      { id: "execute", name: "ฟันประหาร", kind: "active", max: 5, pos: [3, 3], req: [["rage", 1], ["blood_lust", 3]], glyph: "sword",
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
      { id: "taunt", name: "ยั่วยุ", kind: "active", max: 5, pos: [3, 0], glyph: "cry",
        skill: { type: "nova", stat: "atk", mult: lin(0.6, 0.1), slow: lin(1.5, 0.3), mp: 8, cd: 8, motion: "swing", radius: 300, color: "#ffd890" },
        desc: (r) => `ตะโกนรอบตัวรัศมี 3 ม. ศัตรูช้าลง ${lin(1.5, 0.3)(r).toFixed(1)} วิ ดาเมจ ${pct(lin(0.6, 0.1)(r))} ของพลังโจมตี` },
      { id: "holy_faith", name: "ศรัทธา", kind: "passive", max: 10, pos: [0, 1], req: [["fortify", 3]], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.03 * r, mdefPct: 0.03 * r }), desc: (r) => `HP สูงสุด +${pct(0.03 * r)} ต้านเวท +${pct(0.03 * r)}` },
      { id: "second_wind", name: "ฟื้นตัว", kind: "passive", max: 10, pos: [1, 1], req: [["iron_skin", 3]], glyph: "drop",
        stats: (r) => ({ hpRegen: 1.5 * r }), desc: (r) => `ฟื้น HP +${(1.5 * r).toFixed(1)}/วิ` },
      { id: "shield_charge", name: "พุ่งชนด้วยโล่", kind: "active", max: 5, pos: [2, 1], req: [["shield_bash", 4]], glyph: "dash",
        skill: { type: "dash", stat: "atk", mult: lin(1.6, 0.2), stun: lin(0.8, 0.15), mp: 14, cd: 8, motion: "thrust", distance: 240, width: 80, color: "#ffe9b8" },
        desc: (r) => `พุ่งชนไปทางที่เล็ง 2.4 ม. ดาเมจ ${pct(lin(1.6, 0.2)(r))} ของพลังโจมตี มึน ${lin(0.8, 0.15)(r).toFixed(1)} วิ` },
      { id: "war_cry", name: "คำรามศึก", kind: "active", max: 5, pos: [1, 2], req: [["holy_faith", 3], ["second_wind", 3]], glyph: "cry",
        skill: { type: "buff", mp: 30, cd: 30, motion: "swing", duration: 10, heal: lin(0.15, 0.02), buff: (r) => ({ dmgRed: 0.15 + 0.03 * r }), color: "#ffd070" },
        desc: (r) => `10 วิ: ลดความเสียหายที่ได้รับ ${pct(0.15 + 0.03 * r)} และฟื้น HP ${pct(lin(0.15, 0.02)(r))}` },
      { id: "shield_boomerang", name: "โล่บูมเมอแรง", kind: "active", max: 5, pos: [2, 2], req: [["shield_charge", 3]], glyph: "shield",
        skill: { type: "bolt", stat: "atk", mult: lin(2, 0.25), pierce: true, mp: 16, cd: 5, motion: "thrust", speed: 900, range: 520, radius: 40, color: "#ffe2a0" },
        desc: (r) => `ขว้างโล่ทะลุทุกตัวในแนว 5.2 ม. ดาเมจ ${pct(lin(2, 0.25)(r))} ของพลังโจมตี` },
      { id: "iron_wall", name: "กำแพงเหล็ก", kind: "passive", max: 5, pos: [3, 2], req: [["taunt", 3]], glyph: "earth",
        stats: (r) => ({ def: 4 * r, dmgRed: 0.02 * r }), desc: (r) => `ป้องกัน +${4 * r} ลดความเสียหาย ${pct(0.02 * r)}` },
      { id: "last_stand", name: "ยืนหยัดครั้งสุดท้าย", kind: "active", max: 5, pos: [1, 3], req: [["war_cry", 3]], glyph: "heart",
        skill: { type: "buff", mp: 40, cd: 60, motion: "thrust", duration: 6, heal: lin(0.3, 0.05), buff: (r) => ({ dmgRed: 0.3 + 0.05 * r, atkPct: 0.1 }), color: "#ffeab0" },
        desc: (r) => `6 วิ: ลดความเสียหาย ${pct(0.3 + 0.05 * r)} พลังโจมตี +10% และฟื้น HP ทันที ${pct(lin(0.3, 0.05)(r))}` },
      { id: "guardian_cross", name: "กางเขนผู้พิทักษ์", kind: "active", max: 5, pos: [2, 3], req: [["shield_boomerang", 3], ["iron_wall", 2]], glyph: "star",
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
      { id: "light_feet", name: "ฝีเท้าเบา", kind: "passive", max: 10, pos: [2, 0], glyph: "up",
        stats: (r) => ({ move: 0.02 * r, aspd: 0.015 * r }), desc: (r) => `ความเร็วเดิน +${pct(0.02 * r)} ความเร็วโจมตี +${pct(0.015 * r)}` },
      { id: "vital_point", name: "จุดตาย", kind: "passive", max: 10, pos: [3, 0], glyph: "pierce",
        stats: (r) => ({ crit: 0.02 * r }), desc: (r) => `โอกาสคริติคอล +${pct(0.02 * r)}` },
      { id: "sonic_blade", name: "คลื่นดาบ", kind: "active", max: 10, pos: [0, 1], req: [["dash_strike", 3]], glyph: "wave",
        skill: { type: "beam", stat: "atk", mult: lin(1.8, 0.2), mp: 14, cd: 5, motion: "swing", length: 450, width: 60, color: "#b8f0ff" },
        desc: (r) => `ฟันคลื่นดาบยาว 4.5 ม. ทะลุทุกตัว ดาเมจ ${pct(lin(1.8, 0.2)(r))} ของพลังโจมตี` },
      { id: "triple_slash", name: "ฟันสามจังหวะ", kind: "active", max: 5, pos: [1, 1], req: [["twin_slash", 5]], glyph: "twin",
        skill: { type: "cone", stat: "atk", mult: lin(1.3, 0.15), hits: 3, mp: 16, cd: 5, motion: "swing", reach: 160, arc: 120, color: "#e0fbff" },
        desc: (r) => `ฟันด้านหน้า 3 ครั้ง ครั้งละ ${pct(lin(1.3, 0.15)(r))} ของพลังโจมตี` },
      { id: "evasion", name: "หลบหลีก", kind: "passive", max: 5, pos: [2, 1], req: [["light_feet", 3]], glyph: "dash",
        stats: (r) => ({ flee: 4 * r, dmgRed: 0.02 * r, move: 0.01 * r }), desc: (r) => `หลบหลีก +${4 * r} ลดความเสียหาย ${pct(0.02 * r)} ความเร็วเดิน +${pct(0.01 * r)}` },
      { id: "phantom_step", name: "ร่างเงา", kind: "active", max: 5, pos: [0, 2], req: [["sonic_blade", 3]], glyph: "eye",
        skill: { type: "buff", mp: 20, cd: 25, motion: "thrust", duration: 8, buff: (r) => ({ aspd: 0.1 + 0.03 * r, move: 0.1 + 0.02 * r, crit: 0.05 }), color: "#a8e8ff" },
        desc: (r) => `8 วิ: ความเร็วโจมตี +${pct(0.1 + 0.03 * r)} ความเร็วเดิน +${pct(0.1 + 0.02 * r)} โอกาสคริติคอล +5%` },
      { id: "assassinate", name: "ลอบสังหาร", kind: "active", max: 5, pos: [3, 2], req: [["vital_point", 5], ["evasion", 3]], glyph: "pierce",
        skill: { type: "dash", stat: "atk", mult: lin(4, 0.5), mp: 28, cd: 14, motion: "thrust", distance: 220, width: 60, color: "#d0c0ff" },
        desc: (r) => `พุ่งทะลุไปทางที่เล็ง 2.2 ม. ดาเมจ ${pct(lin(4, 0.5)(r))} ของพลังโจมตี` },
      { id: "blade_storm", name: "พายุดาบ", kind: "active", max: 5, pos: [1, 3], req: [["triple_slash", 5], ["phantom_step", 1]], glyph: "storm",
        skill: { type: "storm", stat: "atk", mult: lin(0.9, 0.12), pulses: 5, every: 0.2, mp: 30, cd: 18, motion: "swing", radius: 200, color: "#e0fbff" },
        desc: (r) => `ฟันรอบตัว 5 ครั้งใน 1 วิ ครั้งละ ${pct(lin(0.9, 0.12)(r))} ของพลังโจมตี` },
    ],
  },
  // ---- archer: arrows from afar, atk based ----
  marksman: {
    name: "ธนูทำลาย", cls: "archer", color: "#ffcf7a", glyph: "arrow",
    note: "สายโจมตีด้วยสกิล ยิงแรงจากระยะไกล ศรทะลวง ศรระเบิด ฝนธนู",
    nodes: [
      { id: "aim_focus", name: "สมาธินักแม่นธนู", kind: "passive", max: 10, pos: [0, 0], glyph: "up",
        stats: (r) => ({ atkPct: 0.02 * r, hit: 3 * r }), desc: (r) => `พลังโจมตี +${pct(0.02 * r)} ความแม่นยำ +${3 * r}` },
      { id: "double_strafe", name: "ยิงสองดอก", kind: "active", max: 10, pos: [1, 0], glyph: "arrow",
        skill: { type: "bolt", stat: "atk", mult: lin(1, 0.1), hits: 2, every: 0.12, arrow: true, mp: 6, cd: 1.5, motion: "shoot", speed: 1500, range: 700, radius: 26, color: "#fff2c8" },
        desc: (r) => `ยิงลูกธนู 2 ดอกติดกันไปทางที่เล็ง ดอกละ ${pct(lin(1, 0.1)(r))} ของพลังโจมตี` },
      { id: "piercing_arrow", name: "ศรทะลวง", kind: "active", max: 10, pos: [2, 0], glyph: "pierce",
        skill: { type: "bolt", stat: "atk", mult: lin(1.6, 0.16), arrow: true, pierce: true, mp: 10, cd: 3, motion: "shoot", speed: 1600, range: 760, radius: 30, color: "#ffe6a0" },
        desc: (r) => `ยิงศรทะลุทุกตัวในแนว 7.6 ม. ดาเมจ ${pct(lin(1.6, 0.16)(r))} ของพลังโจมตี` },
      { id: "arrow_shower", name: "ห่าธนู", kind: "active", max: 10, pos: [3, 0], glyph: "burst",
        skill: { type: "blast", stat: "atk", mult: lin(1.2, 0.12), mp: 14, cd: 5, motion: "shoot", range: 650, radius: 170, delay: 0.3, color: "#ffd890" },
        desc: (r) => `ลูกธนูโปรยลงตรงจุดที่เล็ง รัศมี 1.7 ม. ดาเมจ ${pct(lin(1.2, 0.12)(r))} ของพลังโจมตี` },
      { id: "hawk_eye", name: "ตาเหยี่ยว", kind: "passive", max: 10, pos: [0, 1], req: [["aim_focus", 3]], glyph: "eye",
        stats: (r) => ({ crit: 0.01 * r, critDmg: 0.04 * r }), desc: (r) => `โอกาสคริติคอล +${pct(0.01 * r)} แรงคริติคอล +${pct(0.04 * r)}` },
      { id: "charge_arrow", name: "ศรผลักกระเด็น", kind: "active", max: 5, pos: [1, 1], req: [["double_strafe", 4]], glyph: "wave",
        skill: { type: "bolt", stat: "atk", mult: lin(1.8, 0.2), arrow: true, knock: 150, mp: 12, cd: 6, motion: "shoot", speed: 1400, range: 650, radius: 34, color: "#fff0b8" },
        desc: (r) => `ยิงศรหนักผลักศัตรูกระเด็น ดาเมจ ${pct(lin(1.8, 0.2)(r))} ของพลังโจมตี` },
      { id: "blast_arrow", name: "ศรระเบิด", kind: "active", max: 10, pos: [2, 1], req: [["piercing_arrow", 3]], glyph: "flame",
        skill: { type: "blast", stat: "atk", mult: lin(2, 0.2), mp: 18, cd: 6, motion: "shoot", range: 650, radius: 140, delay: 0.25, color: "#ffb070" },
        desc: (r) => `ศรระเบิดตรงจุดที่เล็ง รัศมี 1.4 ม. ดาเมจ ${pct(lin(2, 0.2)(r))} ของพลังโจมตี` },
      { id: "long_shot", name: "ยิงไกล", kind: "passive", max: 5, pos: [3, 1], req: [["arrow_shower", 3]], glyph: "eye",
        stats: (r) => ({ reach: 0.04 * r, dmg: 0.02 * r }), desc: (r) => `ระยะยิงปกติ +${pct(0.04 * r)} ดาเมจ +${pct(0.02 * r)}` },
      { id: "deadly_aim", name: "เล็งจุดตาย", kind: "passive", max: 5, pos: [0, 2], req: [["hawk_eye", 5]], glyph: "target",
        stats: (r) => ({ pierce: 0.05 * r }), desc: (r) => `ไม่สนการป้องกันของศัตรู ${pct(0.05 * r)}` },
      { id: "arrow_vulcan", name: "ศรพันดอก", kind: "active", max: 5, pos: [1, 2], req: [["charge_arrow", 3], ["double_strafe", 7]], glyph: "fan",
        skill: { type: "bolt", stat: "atk", mult: lin(0.7, 0.08), hits: 6, every: 0.08, arrow: true, mp: 26, cd: 9, motion: "shoot", speed: 1700, range: 720, radius: 26, color: "#fff2c8" },
        desc: (r) => `ยิงรัว 6 ดอกในพริบตา ดอกละ ${pct(lin(0.7, 0.08)(r))} ของพลังโจมตี` },
      { id: "arrow_storm", name: "ฝนธนูมรณะ", kind: "active", max: 5, pos: [3, 2], req: [["arrow_shower", 5], ["long_shot", 2]], glyph: "storm",
        skill: { type: "blast", stat: "atk", mult: lin(0.9, 0.1), hits: 5, every: 0.25, mp: 32, cd: 14, motion: "shoot", range: 700, radius: 220, delay: 0.4, color: "#ffe0a0" },
        desc: (r) => `ฝนธนูตกใส่จุดที่เล็ง 5 ระลอก รัศมี 2.2 ม. ระลอกละ ${pct(lin(0.9, 0.1)(r))} ของพลังโจมตี` },
      { id: "sharp_shooting", name: "ศรพิฆาต", kind: "active", max: 5, pos: [1, 3], req: [["arrow_vulcan", 1], ["deadly_aim", 3]], glyph: "beam",
        skill: { type: "beam", stat: "atk", mult: lin(4, 0.5), mp: 40, cd: 15, motion: "shoot", length: 900, width: 70, color: "#fff0b0" },
        desc: (r) => `ศรแสงยาว 9 ม. ทะลุทุกตัว ดาเมจ ${pct(lin(4, 0.5)(r))} ของพลังโจมตี` },
      { id: "falling_star", name: "ศรดาวตก", kind: "active", max: 5, pos: [2, 3], req: [["blast_arrow", 5], ["arrow_storm", 1]], glyph: "star",
        skill: { type: "blast", stat: "atk", mult: lin(3, 0.4), stun: lin(1, 0.1), mp: 45, cd: 18, motion: "shoot", range: 700, radius: 260, delay: 0.6, color: "#ffd070" },
        desc: (r) => `ยิงศรขึ้นฟ้าตกลงเป็นดาวตกรัศมี 2.6 ม. ดาเมจ ${pct(lin(3, 0.4)(r))} ของพลังโจมตี มึน ${lin(1, 0.1)(r).toFixed(1)} วิ` },
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
      { id: "swift_feet", name: "ฝีเท้าพราน", kind: "passive", max: 10, pos: [3, 0], glyph: "dash",
        stats: (r) => ({ move: 0.015 * r }), desc: (r) => `ความเร็วเดิน +${pct(0.015 * r)}` },
      { id: "focus_fire", name: "สมาธิยิงรัว", kind: "active", max: 10, pos: [0, 1], req: [["quick_draw", 3]], glyph: "eye",
        skill: { type: "buff", mp: 15, cd: 30, motion: "shoot", duration: 15, buff: (r) => ({ aspd: 0.1 + 0.02 * r, atkPct: 0.02 * r }), color: "#c8ffe0" },
        desc: (r) => `15 วิ: ความเร็วโจมตี +${pct(0.1 + 0.02 * r)} พลังโจมตี +${pct(0.02 * r)}` },
      { id: "triple_shot", name: "ยิงสามทาง", kind: "active", max: 10, pos: [1, 1], req: [["double_shot", 3]], glyph: "fan",
        skill: { type: "fan", stat: "atk", mult: lin(1.1, 0.1), count: 3, spread: 24, arrow: true, mp: 10, cd: 3, motion: "shoot", speed: 1600, range: 700, radius: 26, color: "#e0fff0" },
        desc: (r) => `ยิง 3 ดอกเป็นรูปพัด ดอกละ ${pct(lin(1.1, 0.1)(r))} ของพลังโจมตี` },
      { id: "flurry", name: "ยิงกระหน่ำ", kind: "active", max: 5, pos: [2, 1], req: [["rapid_fire", 5]], glyph: "storm",
        skill: { type: "bolt", stat: "atk", mult: lin(0.45, 0.05), hits: 8, every: 0.07, arrow: true, mp: 20, cd: 8, motion: "shoot", speed: 1800, range: 700, radius: 26, color: "#e0fff0" },
        desc: (r) => `ยิงกระหน่ำ 8 ดอกในครึ่งวินาที ดอกละ ${pct(lin(0.45, 0.05)(r))} ของพลังโจมตี` },
      { id: "hunter_dash", name: "วิ่งหลบ", kind: "active", max: 1, pos: [3, 1], req: [["swift_feet", 3]], glyph: "dash",
        skill: { type: "dash", mp: 8, cd: 7, motion: "shoot", distance: 300, color: "#d8ffe8" },
        desc: () => "วิ่งพรวดไปทางที่เล็ง 3 ม. ผ่านศัตรูได้ ใช้เปิดระยะยิง" },
      { id: "wind_walk", name: "ร่างลม", kind: "active", max: 5, pos: [0, 2], req: [["focus_fire", 3]], glyph: "wing",
        skill: { type: "buff", mp: 20, cd: 30, motion: "shoot", duration: 12, buff: (r) => ({ move: 0.15 + 0.03 * r, aspd: 0.05 + 0.02 * r }), color: "#d8ffe8" },
        desc: (r) => `12 วิ: ความเร็วเดิน +${pct(0.15 + 0.03 * r)} ความเร็วโจมตี +${pct(0.05 + 0.02 * r)}` },
      { id: "fan_volley", name: "ห่าพัด", kind: "active", max: 5, pos: [1, 2], req: [["triple_shot", 5]], glyph: "fan",
        skill: { type: "fan", stat: "atk", mult: lin(0.75, 0.08), count: 7, spread: 60, arrow: true, mp: 24, cd: 7, motion: "shoot", speed: 1600, range: 680, radius: 26, color: "#e0fff0" },
        desc: (r) => `ยิง 7 ดอกเป็นรูปพัดกว้าง ดอกละ ${pct(lin(0.75, 0.08)(r))} ของพลังโจมตี` },
      { id: "kite", name: "ยิงพลางถอย", kind: "passive", max: 5, pos: [3, 2], req: [["hunter_dash", 1]], glyph: "shield",
        stats: (r) => ({ dmgRed: 0.02 * r, move: 0.01 * r }), desc: (r) => `ลดความเสียหาย ${pct(0.02 * r)} ความเร็วเดิน +${pct(0.01 * r)}` },
      { id: "arrow_ring", name: "ศรรอบทิศ", kind: "active", max: 5, pos: [1, 3], req: [["fan_volley", 3], ["wind_walk", 1]], glyph: "spin",
        skill: { type: "fan", stat: "atk", mult: lin(0.9, 0.12), count: 12, spread: 330, arrow: true, mp: 36, cd: 14, motion: "shoot", speed: 1500, range: 600, radius: 28, color: "#e0fff0" },
        desc: (r) => `ยิง 12 ดอกออกรอบตัว ดอกละ ${pct(lin(0.9, 0.12)(r))} ของพลังโจมตี` },
      { id: "hyper_speed", name: "เหนือมนุษย์", kind: "passive", max: 5, pos: [2, 3], req: [["flurry", 3], ["kite", 2]], glyph: "wing",
        stats: (r) => ({ aspd: 0.03 * r, multiShot: 0.03 * r }), desc: (r) => `ความเร็วโจมตี +${pct(0.03 * r)} โอกาสยิงซ้อน +${pct(0.03 * r)}` },
    ],
  },
  hunter: {
    name: "ธนูพราน", cls: "archer", color: "#c8a8ff", glyph: "target",
    note: "สายสนับสนุน ยิงติดดีบัฟ: พิษ ถ่วง ตรึง อ่อนแรง ทำลายเกราะ ตาบอด",
    nodes: [
      { id: "poison_arrow", name: "ศรพิษ", kind: "active", max: 10, pos: [0, 0], glyph: "drop",
        skill: { type: "bolt", stat: "atk", mult: lin(1, 0.1), poison: lin(0.6, 0.06), arrow: true, mp: 8, cd: 3, motion: "shoot", speed: 1500, range: 700, radius: 26, color: "#9ee870" },
        desc: (r) => `ยิงศรอาบพิษ ดาเมจ ${pct(lin(1, 0.1)(r))} ของพลังโจมตี แล้วพิษกัดอีก ${pct(lin(0.6, 0.06)(r))} ของดาเมจใน 4 วิ` },
      { id: "slow_arrow", name: "ศรถ่วง", kind: "active", max: 10, pos: [1, 0], glyph: "swirl",
        skill: { type: "bolt", stat: "atk", mult: lin(1.1, 0.1), slow: lin(2, 0.25), arrow: true, mp: 7, cd: 3, motion: "shoot", speed: 1500, range: 700, radius: 26, color: "#9ccfff" },
        desc: (r) => `ยิงศรถ่วงขา ดาเมจ ${pct(lin(1.1, 0.1)(r))} ของพลังโจมตี ศัตรูช้าลง ${lin(2, 0.25)(r).toFixed(1)} วิ` },
      { id: "weaken_arrow", name: "ศรอ่อนแรง", kind: "active", max: 10, pos: [2, 0], glyph: "down",
        skill: { type: "bolt", stat: "atk", mult: lin(1, 0.1), weaken: lin(0.15, 0.02), debuff: 8, arrow: true, mp: 9, cd: 5, motion: "shoot", speed: 1500, range: 700, radius: 26, color: "#d0a0ff" },
        desc: (r) => `ยิงศรสลายแรง ดาเมจ ${pct(lin(1, 0.1)(r))} ของพลังโจมตี ศัตรูตีเบาลง ${pct(lin(0.15, 0.02)(r))} 8 วิ` },
      { id: "venom_coat", name: "เคลือบพิษ", kind: "passive", max: 10, pos: [3, 0], glyph: "drop",
        stats: (r) => ({ poisonHit: 0.02 * r }), desc: (r) => `ตีปกติมีโอกาส ${pct(0.02 * r)} ทำให้ติดพิษ (40% ของดาเมจใน 3 วิ)` },
      { id: "toxic_cloud", name: "หมอกพิษ", kind: "active", max: 5, pos: [0, 1], req: [["poison_arrow", 4]], glyph: "storm",
        skill: { type: "blast", stat: "atk", mult: lin(0.6, 0.08), poison: lin(0.5, 0.08), hits: 3, every: 0.5, mp: 22, cd: 10, motion: "shoot", range: 650, radius: 200, delay: 0.3, color: "#8ee070" },
        desc: (r) => `ศรระเบิดเป็นหมอกพิษรัศมี 2 ม. 3 ระลอก ระลอกละ ${pct(lin(0.6, 0.08)(r))} ของพลังโจมตี และพิษ ${pct(lin(0.5, 0.08)(r))} ของดาเมจ` },
      { id: "pin_arrow", name: "ศรตรึง", kind: "active", max: 5, pos: [1, 1], req: [["slow_arrow", 4]], glyph: "pierce",
        skill: { type: "bolt", stat: "atk", mult: lin(1.4, 0.15), stun: lin(1.2, 0.15), arrow: true, mp: 14, cd: 8, motion: "shoot", speed: 1500, range: 700, radius: 28, color: "#c8e0ff" },
        desc: (r) => `ยิงตรึงศัตรูกับพื้น ดาเมจ ${pct(lin(1.4, 0.15)(r))} ของพลังโจมตี ขยับไม่ได้ ${lin(1.2, 0.15)(r).toFixed(1)} วิ` },
      { id: "armor_break", name: "ศรทำลายเกราะ", kind: "active", max: 10, pos: [2, 1], req: [["weaken_arrow", 3]], glyph: "target",
        skill: { type: "bolt", stat: "atk", mult: lin(1.2, 0.12), expose: lin(0.12, 0.02), debuff: 8, arrow: true, mp: 12, cd: 6, motion: "shoot", speed: 1500, range: 700, radius: 26, color: "#ff9a7a" },
        desc: (r) => `ยิงเจาะเกราะ ดาเมจ ${pct(lin(1.2, 0.12)(r))} ของพลังโจมตี ศัตรูโดนแรงขึ้น ${pct(lin(0.12, 0.02)(r))} 8 วิ` },
      { id: "snare_trap", name: "กับดักบ่วง", kind: "active", max: 5, pos: [3, 1], req: [["venom_coat", 3]], glyph: "thorn",
        skill: { type: "blast", stat: "atk", mult: lin(0.8, 0.1), stun: lin(1.5, 0.2), mp: 16, cd: 12, motion: "shoot", range: 600, radius: 160, delay: 0.6, color: "#d8c8a0" },
        desc: (r) => `วางบ่วงตรงจุดที่เล็ง รัศมี 1.6 ม. ดาเมจ ${pct(lin(0.8, 0.1)(r))} ของพลังโจมตี ติดบ่วง ${lin(1.5, 0.2)(r).toFixed(1)} วิ` },
      { id: "blind_arrow", name: "ศรมืดบอด", kind: "active", max: 5, pos: [0, 2], req: [["toxic_cloud", 3]], glyph: "eye",
        skill: { type: "bolt", stat: "atk", mult: lin(1.2, 0.1), blind: lin(3, 0.5), arrow: true, mp: 14, cd: 9, motion: "shoot", speed: 1500, range: 700, radius: 28, color: "#8a8494" },
        desc: (r) => `ยิงผงควันใส่ตา ดาเมจ ${pct(lin(1.2, 0.1)(r))} ของพลังโจมตี ศัตรูตาบอด กัดพลาดครึ่งหนึ่ง ${lin(3, 0.5)(r).toFixed(1)} วิ` },
      { id: "hunter_mark", name: "ตราล่าเหยื่อ", kind: "active", max: 5, pos: [2, 2], req: [["armor_break", 5]], glyph: "target",
        skill: { type: "blast", stat: "atk", mult: lin(0.3, 0.05), expose: lin(0.2, 0.04), weaken: lin(0.1, 0.02), debuff: 10, mp: 20, cd: 14, motion: "shoot", range: 650, radius: 220, delay: 0.2, color: "#ff8a6a" },
        desc: (r) => `ประทับตราศัตรูรัศมี 2.2 ม. 10 วิ: โดนแรงขึ้น ${pct(lin(0.2, 0.04)(r))} ตีเบาลง ${pct(lin(0.1, 0.02)(r))}` },
      { id: "predator", name: "สัญชาตญาณนักล่า", kind: "passive", max: 5, pos: [3, 2], req: [["snare_trap", 3]], glyph: "rage",
        stats: (r) => ({ huntDmg: 0.05 * r }), desc: (r) => `ดาเมจใส่ศัตรูที่ติดสถานะผิดปกติ +${pct(0.05 * r)}` },
      { id: "plague_rain", name: "ฝนพิษ", kind: "active", max: 5, pos: [1, 3], req: [["blind_arrow", 3], ["pin_arrow", 3]], glyph: "storm",
        skill: { type: "blast", stat: "atk", mult: lin(0.8, 0.1), poison: lin(0.6, 0.1), slow: lin(2, 0.2), hits: 4, every: 0.3, mp: 40, cd: 18, motion: "shoot", range: 700, radius: 240, delay: 0.4, color: "#a0e080" },
        desc: (r) => `ฝนศรพิษ 4 ระลอก รัศมี 2.4 ม. ระลอกละ ${pct(lin(0.8, 0.1)(r))} ของพลังโจมตี พิษ ${pct(lin(0.6, 0.1)(r))} ของดาเมจ และช้าลง` },
      { id: "doom_arrow", name: "ศรพิพากษา", kind: "active", max: 5, pos: [2, 3], req: [["hunter_mark", 3], ["predator", 1]], glyph: "arrow",
        skill: { type: "bolt", stat: "atk", mult: lin(2.6, 0.35), expose: () => 0.25, weaken: () => 0.2, stun: () => 1, debuff: 10, arrow: true, pierce: true, mp: 36, cd: 16, motion: "shoot", speed: 1700, range: 760, radius: 34, color: "#ff8a6a" },
        desc: (r) => `ศรทะลุทุกตัวในแนว ดาเมจ ${pct(lin(2.6, 0.35)(r))} ของพลังโจมตี มึน 1 วิ โดนแรงขึ้น 25% ตีเบาลง 20% นาน 10 วิ` },
    ],
  },
  // ---- priest: heals and blessings with holy magic, a mace for the fight ----
  restore: {
    name: "เวทฟื้นฟู", cls: "priest", color: "#fff0a8", glyph: "heal",
    note: "สายฮีล ฟื้น HP แรง ฟื้นฟูต่อเนื่อง โล่ศักดิ์สิทธิ์ ยืนระยะได้นานที่สุด",
    nodes: [
      { id: "holy_heal", name: "ฮีล", kind: "active", max: 10, pos: [0, 0], glyph: "heal",
        skill: { type: "heal", stat: "matk", mult: lin(1.2, 0.15), heal: lin(0.1, 0.012), mp: 12, cd: 3, motion: "cast", color: "#fff6c8" },
        desc: (r) => `ฟื้น HP ${pct(lin(0.1, 0.012)(r))} ของ HP สูงสุด + ${pct(lin(1.2, 0.15)(r))} ของพลังเวท` },
      { id: "meditation", name: "สมาธิภาวนา", kind: "passive", max: 10, pos: [1, 0], glyph: "drop",
        stats: (r) => ({ mpRegen: 0.4 * r, maxMpPct: 0.02 * r }), desc: (r) => `ฟื้น MP +${(0.4 * r).toFixed(1)}/วิ MP สูงสุด +${pct(0.02 * r)}` },
      { id: "devotion", name: "ศรัทธาแรงกล้า", kind: "passive", max: 10, pos: [2, 0], glyph: "heart",
        stats: (r) => ({ healPct: 0.04 * r }), desc: (r) => `สกิลรักษาแรงขึ้น ${pct(0.04 * r)}` },
      { id: "renew", name: "ฟื้นฟูต่อเนื่อง", kind: "active", max: 10, pos: [3, 0], glyph: "leaf",
        skill: { type: "buff", mp: 14, cd: 15, motion: "cast", duration: 12, buff: (r) => ({ hpRegen: 3 + 2.5 * r }), color: "#f8ffd0" },
        desc: (r) => `12 วิ: ฟื้น HP +${(3 + 2.5 * r).toFixed(1)}/วิ` },
      { id: "greater_heal", name: "ฮีลใหญ่", kind: "active", max: 5, pos: [0, 1], req: [["holy_heal", 5]], glyph: "heal",
        skill: { type: "heal", stat: "matk", mult: lin(2.5, 0.3), heal: lin(0.25, 0.03), mp: 30, cd: 10, motion: "cast", color: "#fffbe0" },
        desc: (r) => `ฟื้น HP ${pct(lin(0.25, 0.03)(r))} ของ HP สูงสุด + ${pct(lin(2.5, 0.3)(r))} ของพลังเวท` },
      { id: "blessed_body", name: "กายศักดิ์สิทธิ์", kind: "passive", max: 10, pos: [1, 1], req: [["meditation", 3]], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.025 * r, hpRegen: 0.5 * r }), desc: (r) => `HP สูงสุด +${pct(0.025 * r)} ฟื้น HP +${(0.5 * r).toFixed(1)}/วิ` },
      { id: "holy_ground", name: "เขตศักดิ์สิทธิ์", kind: "active", max: 5, pos: [2, 1], req: [["devotion", 3]], glyph: "flower",
        skill: { type: "buff", mp: 28, cd: 25, motion: "cast", duration: 10, heal: lin(0.08, 0.02), buff: (r) => ({ hpRegen: 10 + 5 * r, dmgRed: 0.05 + 0.02 * r }), color: "#fff6c0" },
        desc: (r) => `10 วิ: ฟื้น HP +${10 + 5 * r}/วิ ลดความเสียหาย ${pct(0.05 + 0.02 * r)} และฟื้น HP ทันที ${pct(lin(0.08, 0.02)(r))}` },
      { id: "holy_shield", name: "โล่แห่งศรัทธา", kind: "active", max: 10, pos: [3, 1], req: [["renew", 3]], glyph: "shield",
        skill: { type: "shield", stat: "matk", mult: lin(0.8, 0.1), base: lin(0.15, 0.02), mp: 18, cd: 14, motion: "cast", duration: 10, color: "#fff2b0" },
        desc: (r) => `โล่ดูดซับ ${pct(lin(0.15, 0.02)(r))} ของ MP สูงสุด + ${pct(lin(0.8, 0.1)(r))} ของพลังเวท นาน 10 วิ` },
      { id: "quick_prayer", name: "สวดเร็ว", kind: "passive", max: 5, pos: [0, 2], req: [["greater_heal", 3]], glyph: "swirl",
        stats: (r) => ({ cdr: 0.02 * r }), desc: (r) => `ลดคูลดาวน์ ${pct(0.02 * r)}` },
      { id: "grace", name: "พระคุณ", kind: "passive", max: 5, pos: [2, 2], req: [["holy_ground", 3], ["blessed_body", 5]], glyph: "star",
        stats: (r) => ({ healPct: 0.05 * r, mdefPct: 0.03 * r }), desc: (r) => `สกิลรักษาแรงขึ้น ${pct(0.05 * r)} ต้านเวท +${pct(0.03 * r)}` },
      { id: "aegis", name: "เกราะสวรรค์", kind: "passive", max: 5, pos: [3, 2], req: [["holy_shield", 5]], glyph: "shield",
        stats: (r) => ({ defPct: 0.03 * r, dmgRed: 0.015 * r }), desc: (r) => `ป้องกัน +${pct(0.03 * r)} ลดความเสียหาย ${pct(0.015 * r)}` },
      { id: "miracle", name: "ปาฏิหาริย์", kind: "active", max: 5, pos: [1, 3], req: [["quick_prayer", 3], ["grace", 3]], glyph: "star",
        skill: { type: "buff", mp: 50, cd: 45, motion: "cast", duration: 6, heal: lin(0.5, 0.1), buff: (r) => ({ dmgRed: 0.2 + 0.04 * r, hpRegen: 20 }), color: "#fffbe0" },
        desc: (r) => `ฟื้น HP ทันที ${pct(lin(0.5, 0.1)(r))} แล้ว 6 วิ: ลดความเสียหาย ${pct(0.2 + 0.04 * r)} ฟื้น HP +20/วิ` },
    ],
  },
  blessing: {
    name: "เวทสนับสนุน", cls: "priest", color: "#a8d8ff", glyph: "up",
    note: "สายบัฟ เพิ่มพลังโจมตี ความเร็ว เกราะ MP และประทับตราให้ศัตรูโดนแรงขึ้น",
    nodes: [
      { id: "bless", name: "อวยพร", kind: "active", max: 10, pos: [0, 0], glyph: "up",
        skill: { type: "buff", mp: 15, cd: 40, motion: "cast", duration: 40, buff: (r) => ({ atkPct: 0.02 * r, matkPct: 0.02 * r }), color: "#d8ecff" },
        desc: (r) => `40 วิ: พลังโจมตีและพลังเวท +${pct(0.02 * r)}` },
      { id: "agility_up", name: "เพิ่มความคล่อง", kind: "active", max: 10, pos: [1, 0], glyph: "wing",
        skill: { type: "buff", mp: 15, cd: 40, motion: "cast", duration: 40, buff: (r) => ({ aspd: 0.015 * r, move: 0.02 * r, flee: 2 * r }), color: "#d8ffe8" },
        desc: (r) => `40 วิ: ความเร็วโจมตี +${pct(0.015 * r)} ความเร็วเดิน +${pct(0.02 * r)} หลบหลีก +${2 * r}` },
      { id: "angelus", name: "เกราะเทวา", kind: "active", max: 10, pos: [2, 0], glyph: "shield",
        skill: { type: "buff", mp: 18, cd: 40, motion: "cast", duration: 40, buff: (r) => ({ defPct: 0.04 * r, mdefPct: 0.03 * r }), color: "#e8f0ff" },
        desc: (r) => `40 วิ: ป้องกัน +${pct(0.04 * r)} ต้านเวท +${pct(0.03 * r)}` },
      { id: "buff_lore", name: "ผู้รู้แห่งพร", kind: "passive", max: 5, pos: [3, 0], glyph: "star",
        stats: (r) => ({ buffTime: 0.1 * r }), desc: (r) => `บัฟทุกอย่างอยู่นานขึ้น ${pct(0.1 * r)}` },
      { id: "magnificat", name: "บทสวดมานา", kind: "active", max: 5, pos: [0, 1], req: [["bless", 3]], glyph: "drop",
        skill: { type: "buff", mp: 20, cd: 45, motion: "cast", duration: 30, buff: (r) => ({ mpRegen: 2 + 1.5 * r, mpRegenPct: 0.1 * r }), color: "#c8e0ff" },
        desc: (r) => `30 วิ: ฟื้น MP +${(2 + 1.5 * r).toFixed(1)}/วิ และ +${pct(0.1 * r)}` },
      { id: "gloria", name: "กลอเรีย", kind: "active", max: 5, pos: [1, 1], req: [["agility_up", 3]], glyph: "star",
        skill: { type: "buff", mp: 25, cd: 40, motion: "cast", duration: 20, buff: (r) => ({ crit: 0.03 * r, critDmg: 0.05 * r }), color: "#fff0c0" },
        desc: (r) => `20 วิ: โอกาสคริติคอล +${pct(0.03 * r)} แรงคริติคอล +${pct(0.05 * r)}` },
      { id: "assumptio", name: "อัสสัมชัญ", kind: "active", max: 5, pos: [2, 1], req: [["angelus", 5]], glyph: "shield",
        skill: { type: "buff", mp: 35, cd: 45, motion: "cast", duration: 15, buff: (r) => ({ dmgRed: 0.15 + 0.03 * r }), color: "#f0f4ff" },
        desc: (r) => `15 วิ: ลดความเสียหายที่ได้รับ ${pct(0.15 + 0.03 * r)}` },
      { id: "inner_peace", name: "ใจสงบ", kind: "passive", max: 10, pos: [3, 1], req: [["buff_lore", 2]], glyph: "swirl",
        stats: (r) => ({ mpRegen: 0.3 * r, cdr: 0.01 * r }), desc: (r) => `ฟื้น MP +${(0.3 * r).toFixed(1)}/วิ ลดคูลดาวน์ ${pct(0.01 * r)}` },
      { id: "lex_aeterna", name: "ตราบาป", kind: "active", max: 5, pos: [0, 2], req: [["bless", 5]], glyph: "target",
        skill: { type: "blast", stat: "matk", mult: lin(0.3, 0.05), expose: lin(0.2, 0.04), debuff: 8, mp: 18, cd: 10, motion: "cast", range: 600, radius: 200, delay: 0.25, color: "#ffd890" },
        desc: (r) => `ประทับตราบาปบนศัตรูรัศมี 2 ม. 8 วิ: ศัตรูโดนแรงขึ้น ${pct(lin(0.2, 0.04)(r))}` },
      { id: "divine_favor", name: "พรสวรรค์", kind: "passive", max: 5, pos: [1, 2], req: [["magnificat", 3], ["gloria", 1]], glyph: "up",
        stats: (r) => ({ atkPct: 0.02 * r, matkPct: 0.02 * r, crit: 0.01 * r }), desc: (r) => `พลังโจมตีและพลังเวท +${pct(0.02 * r)} โอกาสคริติคอล +${pct(0.01 * r)}` },
      { id: "impositio", name: "พลังศักดิ์สิทธิ์", kind: "active", max: 5, pos: [2, 2], req: [["assumptio", 1]], glyph: "rage",
        skill: { type: "buff", mp: 25, cd: 35, motion: "cast", duration: 20, buff: (r) => ({ dmg: 0.05 + 0.03 * r }), color: "#fff0b0" },
        desc: (r) => `20 วิ: ดาเมจทุกอย่าง +${pct(0.05 + 0.03 * r)}` },
      { id: "benediction", name: "พรสูงสุด", kind: "active", max: 5, pos: [1, 3], req: [["divine_favor", 3], ["impositio", 3]], glyph: "star",
        skill: { type: "buff", mp: 60, cd: 90, motion: "cast", duration: 20, heal: () => 0.2, buff: (r) => ({ atkPct: 0.1 + 0.03 * r, matkPct: 0.1 + 0.03 * r, aspd: 0.1, move: 0.1, dmgRed: 0.1 }), color: "#fffbe0" },
        desc: (r) => `20 วิ: พลังโจมตีและพลังเวท +${pct(0.1 + 0.03 * r)} ความเร็วโจมตีและเดิน +10% ลดความเสียหาย 10% และฟื้น HP ทันที 20%` },
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
      { id: "zeal", name: "ศรัทธาเร่าร้อน", kind: "passive", max: 10, pos: [3, 0], glyph: "flame",
        stats: (r) => ({ matkPct: 0.02 * r, mdefPct: 0.01 * r }), desc: (r) => `พลังเวท +${pct(0.02 * r)} ต้านเวท +${pct(0.01 * r)}` },
      { id: "smite", name: "ทุบลงทัณฑ์", kind: "active", max: 10, pos: [0, 1], req: [["holy_strike", 4]], glyph: "slam",
        skill: { type: "cone", stat: "atk", mult: lin(2.2, 0.25), stun: lin(1, 0.1), mp: 14, cd: 6, motion: "thrust", reach: 170, arc: 80, color: "#ffe8a0" },
        desc: (r) => `ทุบหนักด้านหน้า ดาเมจ ${pct(lin(2.2, 0.25)(r))} ของพลังโจมตี มึน ${lin(1, 0.1)(r).toFixed(1)} วิ` },
      { id: "holy_cross", name: "กางเขนแสง", kind: "active", max: 10, pos: [1, 1], req: [["holy_light", 4]], glyph: "cross",
        skill: { type: "nova", stat: "matk", mult: lin(1.6, 0.18), mp: 16, cd: 6, motion: "cast", radius: 220, knock: 60, color: "#fff6c0" },
        desc: (r) => `กางเขนแสงรอบตัวรัศมี 2.2 ม. ผลักศัตรูออก ดาเมจ ${pct(lin(1.6, 0.18)(r))} ของพลังเวท` },
      { id: "judgement", name: "ลำแสงพิพากษา", kind: "active", max: 5, pos: [2, 1], req: [["holy_light", 5], ["zeal", 3]], glyph: "beam",
        skill: { type: "beam", stat: "matk", mult: lin(2.6, 0.35), mp: 24, cd: 9, motion: "cast", length: 650, width: 70, color: "#fff8d0" },
        desc: (r) => `ลำแสงยาว 6.5 ม. ทะลุทุกตัว ดาเมจ ${pct(lin(2.6, 0.35)(r))} ของพลังเวท` },
      { id: "battle_prayer", name: "สวดก่อนรบ", kind: "active", max: 5, pos: [3, 1], req: [["mace_training", 5]], glyph: "cry",
        skill: { type: "buff", mp: 20, cd: 30, motion: "cast", duration: 12, buff: (r) => ({ atkPct: 0.1 + 0.03 * r, aspd: 0.05 + 0.02 * r }), color: "#ffe8a0" },
        desc: (r) => `12 วิ: พลังโจมตี +${pct(0.1 + 0.03 * r)} ความเร็วโจมตี +${pct(0.05 + 0.02 * r)}` },
      { id: "hammer_of_god", name: "ค้อนสวรรค์", kind: "active", max: 5, pos: [0, 2], req: [["smite", 5]], glyph: "earth",
        skill: { type: "blast", stat: "atk", mult: lin(2, 0.25), stun: lin(1.5, 0.2), mp: 26, cd: 10, motion: "thrust", range: 500, radius: 180, delay: 0.45, color: "#ffe090" },
        desc: (r) => `ค้อนแสงฟาดลงตรงจุดที่เล็ง รัศมี 1.8 ม. ดาเมจ ${pct(lin(2, 0.25)(r))} ของพลังโจมตี มึน ${lin(1.5, 0.2)(r).toFixed(1)} วิ` },
      { id: "holy_aura", name: "รัศมีศักดิ์สิทธิ์", kind: "passive", max: 5, pos: [2, 2], req: [["judgement", 3]], glyph: "star",
        stats: (r) => ({ pierce: 0.04 * r, hpRegen: 0.5 * r }), desc: (r) => `ไม่สนการป้องกันของศัตรู ${pct(0.04 * r)} ฟื้น HP +${(0.5 * r).toFixed(1)}/วิ` },
      { id: "exorcism", name: "เวทขับไล่มาร", kind: "active", max: 5, pos: [1, 3], req: [["holy_cross", 5], ["hammer_of_god", 1]], glyph: "cross",
        skill: { type: "blast", stat: "matk", mult: lin(1.3, 0.18), hits: 5, every: 0.3, mp: 45, cd: 18, motion: "cast", range: 560, radius: 240, delay: 0.5, color: "#fff6b0" },
        desc: (r) => `วงเวทศักดิ์สิทธิ์ตรงจุดที่เล็ง รัศมี 2.4 ม. 5 ครั้ง ครั้งละ ${pct(lin(1.3, 0.18)(r))} ของพลังเวท` },
      { id: "divine_wrath", name: "พิโรธสวรรค์", kind: "active", max: 5, pos: [2, 3], req: [["holy_aura", 3], ["battle_prayer", 3]], glyph: "storm",
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
// passives (5, 10, 20, 30) and an active (15) that need that weapon in hand.
type RewardSpec = Omit<MasteryReward, "at" | "kind">;
interface WeaponLine {
  per: StatBag;
  perDesc: string;
  p5: RewardSpec;
  p10: RewardSpec;
  s15: RewardSpec;
  p20: RewardSpec;
  p30: RewardSpec;
}
const weaponMastery = (name: string, weapons: WeaponId[], glyph: string, w: WeaponLine): Mastery => ({
  name, kind: "weapon", weapons, glyph, max: 30, per: w.per, perDesc: `${w.perDesc} ต่อระดับ เมื่อถือ${name}`,
  rewards: [
    { at: 5, kind: "passive", ...w.p5 },
    { at: 10, kind: "passive", glyph: "up", ...w.p10 },
    { at: 15, kind: "active", ...w.s15 },
    { at: 20, kind: "passive", glyph: "swirl", ...w.p20 },
    { at: 30, kind: "passive", glyph: "star", ...w.p30 },
  ],
});

export const MASTERIES: Record<string, Mastery> = {
  // all round: damage, aim and a little of everything
  sword: weaponMastery("ดาบ", ["sword_1h", "sword_2h"], "sword", {
    per: { atk: 1.5, hit: 1, crit: 0.002 }, perDesc: "พลังโจมตี +1.5 ความแม่นยำ +1 โอกาสคริติคอล +0.2%",
    p5: { name: "คมดาบ", stats: { crit: 0.05 }, desc: "โอกาสคริติคอล +5% เมื่อถือดาบ" },
    p10: { name: "ฝีมือดาบ", stats: { atkPct: 0.05, hit: 10 }, desc: "พลังโจมตี +5% ความแม่นยำ +10 เมื่อถือดาบ" },
    s15: { id: "sword_wave", name: "คลื่นดาบ", glyph: "wave",
      skill: { type: "bolt", stat: "atk", mult: () => 2, pierce: true, mp: 12, cd: 6, motion: "swing", speed: 900, range: 520, radius: 50, color: "#e6f4ff" },
      desc: "ฟันคลื่นดาบทะลุทุกตัว ดาเมจ 200% ของพลังโจมตี" },
    p20: { name: "ดาบคู่กาย", stats: { aspd: 0.05, crit: 0.03 }, desc: "ความเร็วโจมตี +5% โอกาสคริติคอล +3% เมื่อถือดาบ" },
    p30: { name: "ปรมาจารย์ดาบ", stats: { atkPct: 0.08, critDmg: 0.15 }, desc: "พลังโจมตี +8% แรงคริติคอล +15% เมื่อถือดาบ" },
  }),
  // slow and brutal: the hardest criticals, and cuts through armour
  axe: weaponMastery("ขวาน", ["axe"], "axe", {
    per: { atk: 2, critDmg: 0.01 }, perDesc: "พลังโจมตี +2 แรงคริติคอล +1%",
    p5: { name: "น้ำหนักขวาน", stats: { critDmg: 0.2 }, desc: "แรงคริติคอล +20% เมื่อถือขวาน" },
    p10: { name: "ผ่าฟืน", stats: { crit: 0.03 }, desc: "โอกาสคริติคอล +3% เมื่อถือขวาน" },
    s15: { id: "axe_spin", name: "ขวานพายุ", glyph: "spin",
      skill: { type: "nova", stat: "atk", mult: () => 2.4, mp: 15, cd: 7, motion: "swing", radius: 180, color: "#ffd9b0" },
      desc: "หมุนขวานรอบตัว ดาเมจ 240% ของพลังโจมตี" },
    p20: { name: "ขวานผ่าเกราะ", stats: { pierce: 0.1 }, desc: "เจาะเกราะ +10% เมื่อถือขวาน" },
    p30: { name: "เจ้าแห่งขวาน", stats: { atkPct: 0.1, critDmg: 0.25 }, desc: "พลังโจมตี +10% แรงคริติคอล +25% เมื่อถือขวาน" },
  }),
  // sturdy: stuns, toughness and blows that go through
  mace: weaponMastery("ค้อน", ["mace"], "mace", {
    per: { atk: 1.2, def: 0.8 }, perDesc: "พลังโจมตี +1.2 ป้องกัน +0.8",
    p5: { name: "แรงกระแทก", stats: { stunHit: 0.1 }, desc: "ตีปกติมีโอกาส 10% ทำให้มึน 1 วิ เมื่อถือค้อน" },
    p10: { name: "มือหนัก", stats: { stunHit: 0.05, maxHpPct: 0.03 }, desc: "โอกาสตีให้มึน +5% HP สูงสุด +3% เมื่อถือค้อน" },
    s15: { id: "mace_quake", name: "ทุบสะเทือน", glyph: "slam",
      skill: { type: "cone", stat: "atk", mult: () => 2.2, mp: 15, cd: 8, motion: "thrust", reach: 200, arc: 120, stun: () => 1.5, color: "#ffe4b0" },
      desc: "ทุบพื้นด้านหน้า ดาเมจ 220% ของพลังโจมตี มึน 1.5 วิ" },
    p20: { name: "ศรัทธาเหล็ก", stats: { maxHpPct: 0.05, dmgRed: 0.03 }, desc: "HP สูงสุด +5% ลดความเสียหาย 3% เมื่อถือค้อน" },
    p30: { name: "ค้อนพิฆาต", stats: { atkPct: 0.1, pierce: 0.15 }, desc: "พลังโจมตี +10% เจาะเกราะ +15% เมื่อถือค้อน" },
  }),
  // keeps its distance: reach and aim
  spear: weaponMastery("หอก", ["spear_1h", "spear_2h"], "spear", {
    per: { atk: 1.5, hit: 1.5 }, perDesc: "พลังโจมตี +1.5 ความแม่นยำ +1.5",
    p5: { name: "ระยะหอก", stats: { reach: 0.15 }, desc: "ระยะโจมตี +15% เมื่อถือหอก" },
    p10: { name: "แทงแม่น", stats: { pierce: 0.05, hit: 10 }, desc: "เจาะเกราะ +5% ความแม่นยำ +10 เมื่อถือหอก" },
    s15: { id: "spear_lance", name: "แทงทะลวง", glyph: "pierce",
      skill: { type: "beam", stat: "atk", mult: () => 2.5, mp: 14, cd: 7, motion: "thrust", length: 420, width: 60, color: "#f0f6ff" },
      desc: "แทงทะลุแนวยาว 4.2 ม. ดาเมจ 250% ของพลังโจมตี" },
    p20: { name: "รักษาระยะ", stats: { reach: 0.1, flee: 10 }, desc: "ระยะโจมตี +10% หลบหลีก +10 เมื่อถือหอก" },
    p30: { name: "เทพหอก", stats: { atkPct: 0.1, pierce: 0.1 }, desc: "พลังโจมตี +10% เจาะเกราะ +10% เมื่อถือหอก" },
  }),
  // quick and slippery: speed, criticals, dodging and poison
  dagger: weaponMastery("มีด", ["dagger"], "dagger", {
    per: { atk: 0.8, aspd: 0.008, crit: 0.003, flee: 0.6 }, perDesc: "พลังโจมตี +0.8 ความเร็วโจมตี +0.8% โอกาสคริติคอล +0.3% หลบหลีก +0.6",
    p5: { name: "มือไว", stats: { aspd: 0.1 }, desc: "ความเร็วโจมตี +10% เมื่อถือมีด" },
    p10: { name: "แทงจุดตาย", stats: { critDmg: 0.1 }, desc: "แรงคริติคอล +10% เมื่อถือมีด" },
    s15: { id: "shadow_step", name: "เงาจู่โจม", glyph: "dash",
      skill: { type: "dash", stat: "atk", mult: () => 2.2, mp: 12, cd: 6, motion: "thrust", distance: 200, width: 60, color: "#c8b8ff" },
      desc: "พุ่งผ่านศัตรู ดาเมจ 220% ของพลังโจมตี" },
    p20: { name: "ฝีเท้าเงา", stats: { move: 0.05, flee: 15 }, desc: "ความเร็วเดิน +5% หลบหลีก +15 เมื่อถือมีด" },
    p30: { name: "นักฆ่า", stats: { crit: 0.08, poisonHit: 0.1 }, desc: "โอกาสคริติคอล +8% ตีปกติมีโอกาส 10% ติดพิษ เมื่อถือมีด" },
  }),
  // the caster's: magic power, mana and quicker spells
  staff: weaponMastery("ไม้เท้า", ["staff"], "staff", {
    per: { matk: 2, mpRegen: 0.05 }, perDesc: "พลังเวท +2 ฟื้น MP +0.05/วิ",
    p5: { name: "สื่อมานา", stats: { matkPct: 0.08 }, desc: "พลังเวท +8% เมื่อถือไม้เท้า" },
    p10: { name: "สมาธิ", stats: { maxMpPct: 0.08 }, desc: "MP สูงสุด +8% เมื่อถือไม้เท้า" },
    s15: { id: "staff_scatter", name: "เวทกระจาย", glyph: "fan",
      skill: { type: "fan", stat: "matk", mult: () => 0.9, count: 5, spread: 50, mp: 16, cd: 6, motion: "cast", speed: 950, range: 520, radius: 28, color: "#b8ffd8" },
      desc: "ยิงลูกเวท 5 ลูกเป็นรูปพัด ลูกละ 90% ของพลังเวท" },
    p20: { name: "ร่ายคล่อง", stats: { cdr: 0.05, castRed: 0.08 }, desc: "ลดคูลดาวน์ 5% ลดเวลาร่าย 8% เมื่อถือไม้เท้า" },
    p30: { name: "จอมเวทไม้เท้า", stats: { matkPct: 0.08, mpRegenPct: 0.15 }, desc: "พลังเวท +8% ฟื้น MP +15% เมื่อถือไม้เท้า" },
  }),
  // the marksman's: aim, a steady rate and a second arrow
  bow: weaponMastery("ธนู", ["bow"], "bow", {
    per: { atk: 1.5, hit: 1.2, crit: 0.002 }, perDesc: "พลังโจมตี +1.5 ความแม่นยำ +1.2 โอกาสคริติคอล +0.2%",
    p5: { name: "สายตาเหยี่ยว", stats: { reach: 0.15 }, desc: "ระยะยิง +15% เมื่อถือธนู" },
    p10: { name: "ยิงต่อเนื่อง", stats: { aspd: 0.05 }, desc: "ความเร็วโจมตี +5% เมื่อถือธนู" },
    s15: { id: "arrow_rain", name: "ยิงกระจาย", glyph: "fan",
      skill: { type: "fan", stat: "atk", mult: () => 0.85, count: 5, spread: 40, arrow: true, mp: 14, cd: 6, motion: "shoot", speed: 1400, range: 700, radius: 26, color: "#fff2c8" },
      desc: "ยิงลูกธนู 5 ดอกเป็นรูปพัด ดอกละ 85% ของพลังโจมตี" },
    p20: { name: "ศรซ้อน", stats: { multiShot: 0.1 }, desc: "ยิงปกติมีโอกาส 10% ยิงซ้อนอีกดอก เมื่อถือธนู" },
    p30: { name: "นักแม่นธนู", stats: { atkPct: 0.08, critDmg: 0.2 }, desc: "พลังโจมตี +8% แรงคริติคอล +20% เมื่อถือธนู" },
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
};

// ---- elements ----
// Each level adds that element's attack and defence (a point each a percent: after a hit's
// normal damage, the attacker's attack in its element against the target's defence in it, no
// element beating another; stats.ts elemental), a little of the element's strong side, and the
// line's effect (skill line); milestones along the line add stats or effects (skills.ts, stats.ts).
// The first five also strengthen every skill (their old effects); the rest work through the
// hits of their own element (SkillDef.element), or on their own (plant, lava, metal).
const ea = (id: string, atk = 2, def = 1.5): StatBag => ({ [`${id}Atk`]: atk, [`${id}Def`]: def });
export const ELEMENTS: Record<string, ElementDef> = {
  earth: {
    name: "ดิน", color: "#d6a35c", glyph: "earth", max: 50, side: "ป้องกัน",
    per: { ...ea("earth"), def: 0.7, mdef: 0.4, maxHp: 5 },
    skill: "สกิลสร้างโล่ 0.4% ของ HP สูงสุดต่อระดับตอนใช้ (นาน 4 วิ)",
    marks: [
      { at: 10, name: "หินผา", desc: "สกิลที่ทำให้มึน ช้า หรือแช่แข็ง นานขึ้น 30%" },
      { at: 20, name: "เปลือกหิน", desc: "ลดความเสียหายที่ได้รับ 5%", stats: { dmgRed: 0.05 } },
      { at: 35, name: "ภูผามั่น", desc: "โล่จากธาตุดินตอนใช้สกิลหนาขึ้นเท่าตัว" },
      { at: 50, name: "แก่นพสุธา", desc: "HP สูงสุด +10% ป้องกัน +10%", stats: { maxHpPct: 0.1, defPct: 0.1 } },
    ],
  },
  water: {
    name: "น้ำ", color: "#6fc3ff", glyph: "drop", max: 50, side: "ฟื้นฟู",
    per: { ...ea("water"), hpRegen: 0.15, mpRegen: 0.12, maxMp: 3, maxHp: 2 },
    skill: "สกิลรักษาแรงขึ้น 2% ต่อระดับ",
    marks: [
      { at: 10, name: "สายน้ำ", desc: "สกิลที่ตีโดนดูด HP 5% ของดาเมจ" },
      { at: 20, name: "ธารใส", desc: "ฟื้น MP +15%", stats: { mpRegenPct: 0.15 } },
      { at: 35, name: "คลื่นชุบชีวิต", desc: "ใช้สกิลแล้วฟื้น HP 3% ของ HP สูงสุด" },
      { at: 50, name: "มหาสมุทร", desc: "ดูด HP จากสกิลเพิ่มเป็น 10% และ HP สูงสุด +8%", stats: { maxHpPct: 0.08 } },
    ],
  },
  wind: {
    name: "ลม", color: "#9ef0c0", glyph: "swirl", max: 50, side: "ความเร็ว",
    per: { ...ea("wind"), move: 0.003, aspd: 0.004, crit: 0.0008, cdr: 0.003, flee: 0.3 },
    skill: "คูลดาวน์สกิลลดลง 0.3% ต่อระดับ (รวมในค่าลดคูลดาวน์)",
    marks: [
      { at: 10, name: "สายลม", desc: "หลังใช้สกิล เดินเร็วขึ้น 25% นาน 2 วิ" },
      { at: 20, name: "ลมหนุน", desc: "ความเร็วโจมตี +6%", stats: { aspd: 0.06 } },
      { at: 35, name: "พายุหมุน", desc: "ใช้สกิลแล้วมีโอกาส 15% ที่คูลดาวน์ของสกิลนั้นหายทันที" },
      { at: 50, name: "เจ้าแห่งลม", desc: "ลดคูลดาวน์ +8% ความเร็วเดิน +8%", stats: { cdr: 0.08, move: 0.08 } },
    ],
  },
  fire: {
    name: "ไฟ", color: "#ff8a5c", glyph: "flame", max: 50, side: "โจมตี",
    per: { ...ea("fire"), atk: 0.55, matk: 0.55, critDmg: 0.005, maxHp: 1 },
    skill: "ดาเมจสกิลแรงขึ้น 1% ต่อระดับ",
    marks: [
      { at: 10, name: "เผาไหม้", desc: "สกิลที่ตีโดนเผาศัตรู 20% ของดาเมจใน 3 วิ" },
      { at: 20, name: "เปลวร้อน", desc: "พลังโจมตีและพลังเวท +5%", stats: { atkPct: 0.05, matkPct: 0.05 } },
      { at: 35, name: "ไฟลามทุ่ง", desc: "การเผาแรงขึ้นเป็น 40% ของดาเมจ" },
      { at: 50, name: "อัคนี", desc: "ดาเมจสกิลแรงขึ้นอีก 15%" },
    ],
  },
  ice: {
    name: "น้ำแข็ง", color: "#9fe0ff", glyph: "freeze", max: 50, side: "ลดความเร็วโจมตีและร่ายของศัตรู",
    per: { ...ea("ice"), mdef: 0.3, maxMp: 2 },
    skill: "การโจมตีธาตุน้ำแข็งทำให้ศัตรูหนาวสั่น โจมตีและร่ายช้าลง 10% +0.6% ต่อระดับ นาน 3 วิ",
    marks: [
      { at: 10, name: "ลมหนาว", desc: "หนาวสั่นนานขึ้นเป็น 5 วิ" },
      { at: 20, name: "ผิวน้ำแข็ง", desc: "ป้องกันธาตุน้ำแข็ง +15 ต้านเวท +5%", stats: { iceDef: 15, mdefPct: 0.05 } },
      { at: 35, name: "เยือกแข็ง", desc: "การโจมตีธาตุน้ำแข็งมีโอกาส 10% แช่แข็งศัตรู 1.5 วิ" },
      { at: 50, name: "ยุคน้ำแข็ง", desc: "หนาวสั่นแรงขึ้นเท่าตัว พลังโจมตีธาตุน้ำแข็ง +20", stats: { iceAtk: 20 } },
    ],
  },
  light: {
    name: "แสง", color: "#fff1a8", glyph: "star", max: 50, side: "ความเสียหายจริง",
    per: { ...ea("light"), matk: 0.3, hit: 0.4 },
    skill: "การโจมตีธาตุแสงไม่สนเกราะ 20% +1.6% ต่อระดับ (ระดับ 50: ไม่สนเกราะเลย)",
    marks: [
      { at: 10, name: "แสงนำทาง", desc: "ความแม่นยำ +10", stats: { hit: 10 } },
      { at: 20, name: "รัศมี", desc: "ป้องกันธาตุแสง +15 ต้านเวท +5%", stats: { lightDef: 15, mdefPct: 0.05 } },
      { at: 35, name: "แสงทะลวง", desc: "การโจมตีธาตุแสงไม่สนเกราะเพิ่มอีก 20%" },
      { at: 50, name: "สุริยะ", desc: "พลังโจมตีธาตุแสง +30", stats: { lightAtk: 30 } },
    ],
  },
  dark: {
    name: "ความมืด", color: "#a98cff", glyph: "eye", max: 50, side: "สถานะผิดปกติ",
    per: { ...ea("dark"), matk: 0.3, atk: 0.2 },
    skill: "การโจมตีธาตุความมืดมีโอกาส 10% +0.6% ต่อระดับ ทำให้ศัตรูติดสถานะ (ตาบอด อ่อนแรง หรือพิษ) 4 วิ",
    marks: [
      { at: 10, name: "เงามืด", desc: "สถานะจากธาตุความมืดนานขึ้นเป็น 6 วิ" },
      { at: 20, name: "ม่านเงา", desc: "ป้องกันธาตุความมืด +15 หลบหลีก +10", stats: { darkDef: 15, flee: 10 } },
      { at: 35, name: "คำสาป", desc: "ติดสถานะทีละ 2 อย่าง" },
      { at: 50, name: "ราตรีนิรันดร์", desc: "ดาเมจใส่ศัตรูที่ติดสถานะ +15%", stats: { huntDmg: 0.15 } },
    ],
  },
  plant: {
    name: "พืช", color: "#8ee06a", glyph: "leaf", max: 50, side: "รักษาสถานะ",
    per: { ...ea("plant"), hpRegen: 0.15, maxHp: 2 },
    skill: "ใช้สกิลแล้วฟื้น HP 0.1% ของ HP สูงสุดต่อระดับ · สถานะผิดปกติบนตัวหมดเร็วขึ้น 1% ต่อระดับ",
    marks: [
      { at: 10, name: "รากแก้ว", desc: "ใช้สกิลแล้วล้างสถานะผิดปกติบนตัวทั้งหมด" },
      { at: 20, name: "ใบเขียว", desc: "ป้องกันธาตุพืช +15 พลังรักษา +10%", stats: { plantDef: 15, healPct: 0.1 } },
      { at: 35, name: "ผลิใบ", desc: "ฟื้น HP จากธาตุพืชตอนใช้สกิลแรงขึ้นเท่าตัว" },
      { at: 50, name: "พฤกษาพิทักษ์", desc: "ไม่ติดสถานะผิดปกติ HP สูงสุด +5%", stats: { maxHpPct: 0.05 } },
    ],
  },
  stone: {
    name: "หิน", color: "#b4ada2", glyph: "slam", max: 50, side: "สาปเป็นหิน",
    per: { ...ea("stone"), def: 0.4, maxHp: 3 },
    skill: "การโจมตีธาตุหินมีโอกาส 4% +0.3% ต่อระดับ สาปศัตรูเป็นหิน 2 วิ (ขยับและโจมตีไม่ได้)",
    marks: [
      { at: 10, name: "ศิลาสาป", desc: "เป็นหินนานขึ้นเป็น 3 วิ" },
      { at: 20, name: "ผิวศิลา", desc: "ป้องกันธาตุหิน +15 ป้องกัน +5%", stats: { stoneDef: 15, defPct: 0.05 } },
      { at: 35, name: "เมดูซ่า", desc: "โอกาสสาปเป็นหินเพิ่มขึ้นครึ่งหนึ่ง" },
      { at: 50, name: "รูปสลัก", desc: "ศัตรูที่เป็นหินโดนแรงขึ้น 25%" },
    ],
  },
  mud: {
    name: "โคลน", color: "#b08860", glyph: "down", max: 50, side: "ลดความเร็วเคลื่อนที่",
    per: { ...ea("mud"), maxHp: 4, hpRegen: 0.05 },
    skill: "การโจมตีธาตุโคลนทำให้ศัตรูเดินช้าลง 20% +0.8% ต่อระดับ นาน 3 วิ",
    marks: [
      { at: 10, name: "หล่มลึก", desc: "เดินช้านานขึ้นเป็น 5 วิ" },
      { at: 20, name: "เกราะโคลน", desc: "ป้องกันธาตุโคลน +15 HP สูงสุด +3%", stats: { mudDef: 15, maxHpPct: 0.03 } },
      { at: 35, name: "โคลนดูด", desc: "การโจมตีธาตุโคลนตรึงศัตรูอยู่กับที่ 0.5 วิ" },
      { at: 50, name: "บึงมรณะ", desc: "เดินช้าแรงขึ้นอีกครึ่งหนึ่ง" },
    ],
  },
  lava: {
    name: "ลาวา", color: "#ff7438", glyph: "burst", max: 50, side: "เผาต่อเนื่องและป้องกัน",
    per: { ...ea("lava"), def: 0.6, matk: 0.2 },
    skill: "การโจมตีธาตุลาวาเผาศัตรู 15% +0.7% ต่อระดับของดาเมจ ใน 3 วิ",
    marks: [
      { at: 10, name: "เปลือกลาวา", desc: "ป้องกัน +5%", stats: { defPct: 0.05 } },
      { at: 20, name: "หินหนืด", desc: "การเผาจากธาตุลาวานานขึ้นเป็น 5 วิ ป้องกันธาตุลาวา +15", stats: { lavaDef: 15 } },
      { at: 35, name: "ภูเขาไฟ", desc: "ลดความเสียหายที่ได้รับ 5%", stats: { dmgRed: 0.05 } },
      { at: 50, name: "แกนโลก", desc: "การเผาจากธาตุลาวาแรงขึ้นเท่าตัว" },
    ],
  },
  metal: {
    name: "โลหะ", color: "#cdd6e2", glyph: "shield", max: 50, side: "HP สูงสุดและสะท้อน",
    per: { ...ea("metal"), maxHp: 6, maxHpPct: 0.002, reflect: 0.004 },
    skill: "สะท้อนความเสียหายที่โดนโจมตีกลับไป 0.4% ต่อระดับ (รวมในค่าสะท้อน)",
    marks: [
      { at: 10, name: "ผิวเหล็ก", desc: "สะท้อนความเสียหาย +5%", stats: { reflect: 0.05 } },
      { at: 20, name: "เกราะเหล็ก", desc: "ป้องกันธาตุโลหะ +15 HP สูงสุด +5%", stats: { metalDef: 15, maxHpPct: 0.05 } },
      { at: 35, name: "หนามเหล็ก", desc: "สะท้อนความเสียหาย +10%", stats: { reflect: 0.1 } },
      { at: 50, name: "ป้อมปราการ", desc: "HP สูงสุด +10% ป้องกันทุกธาตุ +10", stats: { maxHpPct: 0.1, ...Object.fromEntries(ELEMENT_IDS.map((e) => [`${e}Def`, 10])) } },
    ],
  },
  // opened by an element book
  poison: {
    name: "พิษ", color: "#8fdc4a", glyph: "drop", max: 50, side: "ติดพิษ", book: "book_poison",
    per: { ...ea("poison"), poisonPct: 0.01, atk: 0.2, matk: 0.2 },
    skill: "การโจมตีธาตุพิษทำให้ติดพิษ 30% +1% ต่อระดับของดาเมจ ใน 4 วิ (ติดซ้อนได้)",
    marks: [
      { at: 10, name: "พิษซึม", desc: "พิษจากธาตุพิษนานขึ้นเป็น 6 วิ" },
      { at: 20, name: "ภูมิต้านพิษ", desc: "ป้องกันธาตุพิษ +15 พิษแรงขึ้น 10%", stats: { poisonDef: 15, poisonPct: 0.1 } },
      { at: 35, name: "พิษสองชั้น", desc: "การโจมตีธาตุพิษติดพิษสองชั้นในครั้งเดียว" },
      { at: 50, name: "พิษร้ายแรง", desc: "พิษทุกอย่างแรงขึ้นเท่าตัว" },
    ],
  },
  lightning: {
    name: "สายฟ้า", color: "#fff27a", glyph: "bolt", max: 50, side: "คริติคอล", book: "book_lightning",
    per: { ...ea("lightning"), crit: 0.002, critDmg: 0.006, aspd: 0.002, atk: 0.25, matk: 0.25 },
    skill: "สกิลกายภาพ: โอกาสคริติคอล +0.3% ต่อระดับ · สกิลเวท: ดาเมจ +0.3% ต่อระดับ",
    marks: [
      { at: 10, name: "ฟ้าผ่า", desc: "สกิลที่ตีโดนกระโดดไปโดนอีก 1 ตัวใกล้ๆ 30%" },
      { at: 20, name: "ประจุไฟฟ้า", desc: "แรงคริติคอล +15%", stats: { critDmg: 0.15 } },
      { at: 35, name: "สายฟ้าแตกแขนง", desc: "กระโดดไปโดน 2 ตัว" },
      { at: 50, name: "อสุนีบาต", desc: "ดาเมจที่กระโดดแรงขึ้นเป็น 60% โอกาสคริติคอล +5%", stats: { crit: 0.05 } },
    ],
  },
};

// The element each damaging skill hits with (the rest have none: the arcane spells, most
// weapon skills). Spells mostly; some weapon skills too, where the skill is made of something.
const SKILL_ELEMENTS: Record<string, ElementId> = {
  fire_bolt: "fire", fire_ball: "fire", magnum_break: "fire",
  cold_bolt: "ice", frost_nova: "ice", ice_lance: "ice",
  meteor: "lava",
  soul_volley: "dark", singularity: "dark", blind_arrow: "dark", doom_arrow: "dark",
  poison_arrow: "poison", toxic_cloud: "poison", plague_rain: "poison",
  seed_shot: "plant", flower_field: "plant", thorn_bind: "plant", vine_whip: "plant", petal_storm: "plant",
  repulse: "wind", sonic_blade: "wind",
  ground_slam: "stone", pin_arrow: "stone",
  earthquake: "earth",
  slow_arrow: "mud", snare_trap: "mud",
  shield_bash: "metal", shield_charge: "metal", shield_boomerang: "metal",
  holy_light: "light", holy_cross: "light", judgement: "light", exorcism: "light", lex_aeterna: "light", guardian_cross: "light",
  falling_star: "light", holy_strike: "light", smite: "light", hammer_of_god: "light", divine_wrath: "light",
};

// Element stats as shown to the player.
export const ELEMENT_STAT_NAMES: Record<string, string> = Object.fromEntries(
  ELEMENT_IDS.flatMap((e) => [[`${e}Atk`, `พลังโจมตีธาตุ${ELEMENTS[e].name}`], [`${e}Def`, `ป้องกันธาตุ${ELEMENTS[e].name}`]]),
);

// The second jobs' branches and the later books (src/trees/).
for (const more of [RANGER_TREES, BLADE_TREES, CASTER_TREES, BATTLEMAGE_TREES, BOOK_TREES]) {
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
// book_<kind>_<id>, added to ITEMS here.
export type BookKind = "tree" | "mastery" | "element";
export const BOOKS: Record<string, { kind: BookKind; id: string }> = {};
const BOOK_WORD: Record<BookKind, string> = { tree: "ตำราสกิล", mastery: "ตำราความเชี่ยวชาญ", element: "ตำราธาตุ" };
function addBook(kind: BookKind, id: string, own: string | undefined, name: string, glyph: string, color: string, cls: ClassId | null): void {
  const bookId = own ?? `book_${kind}_${id}`;
  BOOKS[bookId] = { kind, id };
  const who = cls ? `เฉพาะ${CLASSES[cls].name}` : "ใช้ได้ทุกอาชีพ";
  ITEMS[bookId] = {
    kind: "book", name: name.startsWith("ตำรา") ? name : `${BOOK_WORD[kind]}: ${name}`, stack: 5, price: kind === "tree" ? 2400 : 3000, icon: { glyph, color, art: `${kind}_${id}` },
    note: `อ่านเพื่อเรียน${name.startsWith("ตำรา") ? name : BOOK_WORD[kind] + name} (${who})`,
  };
}
for (const [id, t] of Object.entries(TREES)) if (!t.job) addBook("tree", id, t.book, t.name, t.glyph, t.color, t.cls);
for (const [id, m] of Object.entries(MASTERIES)) addBook("mastery", id, m.book, m.name, m.glyph, "#e8c98a", null);
for (const [id, e] of Object.entries(ELEMENTS)) addBook("element", id, e.book, e.name, e.glyph, e.color, null);

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


interface SaveData {
  cls?: ClassId | null;
  level?: number;
  xp?: number;
  ranks?: Record<string, number>;
  mastery?: Record<string, number>;
  elements?: Record<string, number>;
  unlocked?: { trees?: string[]; masteries?: string[]; elements?: string[] };
  hotbar?: (string | null)[];
  bonus?: number;
  job?: JobId | null;
  branch?: string | null;
  treesV?: number;
  learnV?: number;
}

// Bumped when the trees are redrawn: older saves get their tree points back once.
const TREES_VERSION = 2;
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
  hotbar: (string | null)[] = new Array(10).fill(null);
  bonus = 0;                             // skill points from quests and jobs, on top of one a level
  job: JobId | null = null;              // the second job, and the branch picked with it
  branch: string | null = null;

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
    this.hotbar = new Array(10).fill(null);
    this.bonus = 0;
    this.job = null;
    this.branch = null;
    this.changed();
  }

  // Why it can't take a job yet, or null.
  jobBlock(id: JobId): string | null {
    const j = JOBS[id];
    if (this.job) return `เปลี่ยนเป็น${JOBS[this.job].name}ไปแล้ว`;
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
    this.bonus += JOB_POINTS;
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
      elements: this.elements, unlocked: this.unlocked, hotbar: this.hotbar, bonus: this.bonus,
      job: this.job, branch: this.branch,
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

  raiseMastery(id: string): boolean {
    const m = MASTERIES[id];
    if (!m || !this.masteries().includes(id) || (this.mastery[id] ?? 0) >= m.max || this.free <= 0) return false;
    this.mastery[id] = (this.mastery[id] ?? 0) + 1;
    for (const r of m.rewards) if (r.kind === "active" && r.id && r.at === this.mastery[id]) this.autoSlot(r.id);
    this.changed();
    return true;
  }

  raiseElement(id: string): boolean {
    const e = ELEMENTS[id];
    if (!e || !this.elementsOpen().includes(id) || (this.elements[id] ?? 0) >= e.max || this.free <= 0) return false;
    this.elements[id] = (this.elements[id] ?? 0) + 1;
    this.changed();
    return true;
  }

  // Whether a book teaches something new it can learn (another class's tree it can't).
  canRead(bookId: string): boolean {
    const b = BOOKS[bookId];
    if (!b) return false;
    if (b.kind === "tree" && TREES[b.id].cls && TREES[b.id].cls !== this.cls) return false;
    return !{ tree: this.unlocked.trees, mastery: this.unlocked.masteries, element: this.unlocked.elements }[b.kind].includes(b.id);
  }

  // Read a book item: returns what it taught, or why it taught nothing (ok: false).
  readBook(bookId: string): { ok: boolean; text: string } {
    const b = BOOKS[bookId];
    if (!b) return { ok: false, text: "อ่านไม่ได้" };
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
        elements: this.elements, unlocked: this.unlocked, hotbar: this.hotbar, bonus: this.bonus, job: this.job, branch: this.branch,
        treesV: TREES_VERSION, learnV: LEARN_VERSION,
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

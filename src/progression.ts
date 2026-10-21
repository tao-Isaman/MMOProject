// Character progression: class, level and experience, and the skill points earned by levelling
// (one per level, the first one at level 1). Points go into three things:
//   skill trees  sets of actives and passives; each class starts with three, more come from
//                skill books. Deeper nodes open once enough points are in the tree.
//   masteries    straight lines: each level is a bonus, set levels grant a skill or passive.
//                Weapon masteries are open from the start; others come from mastery books.
//   elements     straight lines of base stats with one strong side each; element levels also
//                strengthen every active skill. Four to start, more from element books.
// stats.js turns this into numbers, skills.js runs the actives.

import type { WeaponId } from "./items";

export const MAX_LEVEL = 200;

// Stat changes keyed by stat name (stats.ts lists them).
export type StatBag = Partial<Record<string, number>>;
type ByRank<T> = (rank: number) => T;

export type SkillType = "bolt" | "fan" | "blast" | "nova" | "storm" | "cone" | "beam" | "dash" | "heal" | "shield" | "buff" | "flower";

// An active skill's numbers; which fields matter depends on `type` (skills.ts).
export interface SkillDef {
  type: SkillType;
  stat?: "atk" | "matk";
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
}

export interface TreeNode {
  id: string;
  name: string;
  kind: "active" | "passive";
  max: number;
  pos: [number, number];          // column (0-2) and row in the tree drawing
  req?: [string, number][];       // nodes of the same tree that need these ranks first
  glyph: string;
  desc: ByRank<string>;
  stats?: ByRank<StatBag>;
  skill?: SkillDef;
}

export interface Tree {
  name: string;
  cls: ClassId | null;
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

export type ClassId = "mage" | "warrior";

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
  source: { tree?: string; mastery?: string; at?: number; weapons?: WeaponId[] };
}

// Experience to go from `level` to the next.
export function xpToNext(level: number): number {
  return Math.round(25 * level ** 1.55 + 15);
}

// Stats every character has (see stats.js for what they do). crit, critDmg, aspd, move, cdr
// and dmgRed are fractions.
export const STAT_NAMES: Record<string, string> = {
  maxHp: "HP สูงสุด", maxMp: "MP สูงสุด", atk: "พลังโจมตี", matk: "พลังเวท", def: "ป้องกัน", mdef: "ต้านเวท",
  crit: "โอกาสคริติคอล", critDmg: "แรงคริติคอล", aspd: "ความเร็วโจมตี", move: "ความเร็วเดิน",
  hpRegen: "ฟื้น HP/วิ", mpRegen: "ฟื้น MP/วิ", cdr: "ลดคูลดาวน์", dmgRed: "ลดความเสียหาย",
};
export const PERCENT_STATS = new Set(["crit", "critDmg", "aspd", "move", "cdr", "dmgRed"]);

export const CLASSES: Record<ClassId, ClassDef> = {
  mage: {
    name: "จอมเวท",
    note: "พลังเวทสูง ตีจากระยะไกล HP น้อย",
    trees: ["arcane", "flora", "ward"],
    base: { maxHp: 80, maxMp: 110, atk: 6, matk: 16, def: 3, mdef: 8, crit: 0.05, critDmg: 0.5, hpRegen: 1, mpRegen: 3 },
    growth: { maxHp: 12, maxMp: 9, atk: 0.6, matk: 2.2, def: 0.5, mdef: 1, hpRegen: 0.05, mpRegen: 0.06 },
    weapon: "staff",
  },
  warrior: {
    name: "นักรบ",
    note: "HP และป้องกันสูง ตีระยะประชิด",
    trees: ["berserker", "guardian", "duelist"],
    base: { maxHp: 140, maxMp: 50, atk: 15, matk: 4, def: 8, mdef: 4, crit: 0.05, critDmg: 0.5, hpRegen: 2, mpRegen: 1.2 },
    growth: { maxHp: 22, maxMp: 4, atk: 2.2, matk: 0.5, def: 1.1, mdef: 0.6, hpRegen: 0.1, mpRegen: 0.03 },
    weapon: "sword_1h",
  },
};

// ---- skill trees ----
// node: { id, name, kind: active|passive, max, pos (where it sits in the tree drawing),
//         req (nodes and ranks it needs first), glyph, desc(rank), stats(rank) for
//         passives, skill for actives (skills.ts) }
// skill: { type, stat: atk|matk, mult(rank), mp, cd, motion, cast?, ... } — see skills.js.
const pct = (v: number) => `${Math.round(v * 100)}%`;
const lin = (a: number, b: number) => (r: number) => a + b * (r - 1);

export const TREES: Record<string, Tree> = {
  arcane: {
    name: "เวทโจมตี", cls: "mage", color: "#8fb6ff", glyph: "bolt",
    note: "ยิงเวทใส่ศัตรูจากระยะไกล ดาเมจสูง",
    nodes: [
      { id: "magic_bolt", name: "ลูกศรเวท", kind: "active", max: 5, pos: [0, 0], glyph: "bolt",
        skill: { type: "bolt", stat: "matk", mult: lin(1.6, 0.25), mp: 8, cd: 1.4, motion: "cast", speed: 1100, range: 620, radius: 30, color: "#9cc4ff" },
        desc: (r) => `ยิงลูกเวทไปทางที่เล็ง ดาเมจ ${pct(lin(1.6, 0.25)(r))} ของพลังเวท` },
      { id: "arcane_focus", name: "สมาธิเวท", kind: "passive", max: 5, pos: [2, 0], glyph: "up",
        stats: (r) => ({ matkPct: 0.04 * r }), desc: (r) => `พลังเวท +${pct(0.04 * r)}` },
      { id: "arcane_burst", name: "ระเบิดเวท", kind: "active", max: 5, pos: [0, 1], req: [["magic_bolt", 3]], glyph: "burst",
        skill: { type: "blast", stat: "matk", mult: lin(2.2, 0.3), mp: 22, cd: 7, motion: "cast", range: 520, radius: 150, delay: 0.35, color: "#a9c8ff" },
        desc: (r) => `ระเบิดตรงจุดที่เล็ง รัศมี 1.5 ม. ดาเมจ ${pct(lin(2.2, 0.3)(r))} ของพลังเวท` },
      { id: "arcane_pierce", name: "เวทเจาะเกราะ", kind: "passive", max: 5, pos: [2, 1], req: [["arcane_focus", 3]], glyph: "pierce",
        stats: (r) => ({ pierce: 0.06 * r }), desc: (r) => `ไม่สนการป้องกันของศัตรู ${pct(0.06 * r)}` },
      { id: "ruin_beam", name: "ลำแสงทำลายล้าง", kind: "active", max: 5, pos: [1, 2], req: [["arcane_burst", 3], ["arcane_pierce", 2]], glyph: "beam",
        skill: { type: "beam", stat: "matk", mult: lin(3.8, 0.45), mp: 40, cd: 14, motion: "cast", length: 700, width: 70, color: "#cfe0ff" },
        desc: (r) => `ยิงลำแสงยาว 7 ม. ทะลุทุกตัว ดาเมจ ${pct(lin(3.8, 0.45)(r))} ของพลังเวท` },
    ],
  },
  flora: {
    name: "เวทพฤกษา", cls: "mage", color: "#9df0b4", glyph: "flower",
    note: "ทุ่งดอกไม้ รักษา และพันธนาการ เล่นได้นาน",
    nodes: [
      { id: "flower_field", name: "ทุ่งดอกไม้", kind: "active", max: 5, pos: [0, 0], glyph: "flower",
        skill: { type: "flower", stat: "matk", mult: lin(0.7, 0.12), heal: lin(0.12, 0.02), mp: 25, cd: 9, cast: 1.5, motion: "cast", radius: 450, ticks: 4, color: "#b9ffd0" },
        desc: (r) => `ร่าย 1.5 วิ ดอกไม้บานรอบตัวรัศมี 4.5 ม. ดาเมจ ${pct(lin(0.7, 0.12)(r))} ของพลังเวท 4 ครั้ง และฟื้น HP ${pct(lin(0.12, 0.02)(r))}` },
      { id: "deep_roots", name: "รากหยั่งลึก", kind: "passive", max: 5, pos: [2, 0], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.05 * r }), desc: (r) => `HP สูงสุด +${pct(0.05 * r)}` },
      { id: "bloom_heal", name: "พรแห่งพฤกษา", kind: "active", max: 5, pos: [0, 1], req: [["flower_field", 3]], glyph: "heal",
        skill: { type: "heal", stat: "matk", mult: lin(1, 0.2), heal: lin(0.22, 0.03), mp: 18, cd: 6, motion: "cast", color: "#b9ffd0" },
        desc: (r) => `ฟื้น HP ${pct(lin(0.22, 0.03)(r))} ของ HP สูงสุด + ${pct(lin(1, 0.2)(r))} ของพลังเวท` },
      { id: "morning_dew", name: "น้ำค้างยามเช้า", kind: "passive", max: 5, pos: [2, 1], req: [["deep_roots", 3]], glyph: "drop",
        stats: (r) => ({ hpRegen: 1.2 * r, mpRegen: 0.6 * r }), desc: (r) => `ฟื้น HP +${(1.2 * r).toFixed(1)}/วิ ฟื้น MP +${(0.6 * r).toFixed(1)}/วิ` },
      { id: "thorn_bind", name: "หนามพันธนาการ", kind: "active", max: 5, pos: [1, 2], req: [["bloom_heal", 3], ["morning_dew", 2]], glyph: "thorn",
        skill: { type: "blast", stat: "matk", mult: lin(1.8, 0.25), mp: 30, cd: 12, motion: "cast", range: 520, radius: 200, delay: 0.3, slow: lin(2.5, 0.3), color: "#8fe0a0" },
        desc: (r) => `หนามโผล่ตรงจุดที่เล็ง ดาเมจ ${pct(lin(1.8, 0.25)(r))} ของพลังเวท ศัตรูช้าลงครึ่งหนึ่ง ${lin(2.5, 0.3)(r).toFixed(1)} วิ` },
    ],
  },
  ward: {
    name: "เวทผนึก", cls: "mage", color: "#c9b8ff", glyph: "shield",
    note: "โล่ ผลักศัตรู หยุดเวลา เอาตัวรอดเก่ง",
    nodes: [
      { id: "mana_shield", name: "โล่มานา", kind: "active", max: 5, pos: [0, 0], glyph: "shield",
        skill: { type: "shield", stat: "matk", mult: lin(0.6, 0.15), base: lin(0.3, 0.05), mp: 15, cd: 12, motion: "cast", duration: 8, color: "#c9b8ff" },
        desc: (r) => `โล่ดูดซับ ${pct(lin(0.3, 0.05)(r))} ของ MP สูงสุด + ${pct(lin(0.6, 0.15)(r))} ของพลังเวท นาน 8 วิ` },
      { id: "mind_armor", name: "เกราะจิต", kind: "passive", max: 5, pos: [2, 0], glyph: "up",
        stats: (r) => ({ defPct: 0.06 * r, mdefPct: 0.06 * r }), desc: (r) => `ป้องกันและต้านเวท +${pct(0.06 * r)}` },
      { id: "repulse", name: "คลื่นผลัก", kind: "active", max: 5, pos: [0, 1], req: [["mana_shield", 3]], glyph: "wave",
        skill: { type: "nova", stat: "matk", mult: lin(1.2, 0.2), mp: 14, cd: 6, motion: "cast", radius: 220, knock: 160, color: "#d8ccff" },
        desc: (r) => `คลื่นรอบตัวรัศมี 2.2 ม. ผลักศัตรูกระเด็น ดาเมจ ${pct(lin(1.2, 0.2)(r))} ของพลังเวท` },
      { id: "mana_flow", name: "กระแสมานา", kind: "passive", max: 5, pos: [2, 1], req: [["mind_armor", 3]], glyph: "swirl",
        stats: (r) => ({ mpRegenPct: 0.08 * r, cdr: 0.03 * r }), desc: (r) => `ฟื้น MP +${pct(0.08 * r)} ลดคูลดาวน์ ${pct(0.03 * r)}` },
      { id: "time_stop", name: "ผนึกกาลเวลา", kind: "active", max: 5, pos: [1, 2], req: [["repulse", 3], ["mana_flow", 2]], glyph: "freeze",
        skill: { type: "nova", stat: "matk", mult: lin(0.8, 0.1), mp: 30, cd: 16, motion: "cast", radius: 320, freeze: lin(2, 0.3), color: "#e2f0ff" },
        desc: (r) => `หยุดศัตรูรอบตัวรัศมี 3.2 ม. ${lin(2, 0.3)(r).toFixed(1)} วิ ดาเมจ ${pct(lin(0.8, 0.1)(r))} ของพลังเวท` },
    ],
  },
  berserker: {
    name: "ผู้ทำลาย", cls: "warrior", color: "#ff9a7a", glyph: "spin",
    note: "ฟันรอบตัว ดาเมจแรง คริติคอลสูง",
    nodes: [
      { id: "whirlwind", name: "ฟันหมุน", kind: "active", max: 5, pos: [0, 0], glyph: "spin",
        skill: { type: "nova", stat: "atk", mult: lin(2, 0.3), mp: 10, cd: 5, motion: "swing", radius: 190, knock: 40, color: "#ffd0b8" },
        desc: (r) => `ฟันรอบตัวรัศมี 1.9 ม. ดาเมจ ${pct(lin(2, 0.3)(r))} ของพลังโจมตี` },
      { id: "hot_blood", name: "เลือดเดือด", kind: "passive", max: 5, pos: [2, 0], glyph: "up",
        stats: (r) => ({ atkPct: 0.04 * r }), desc: (r) => `พลังโจมตี +${pct(0.04 * r)}` },
      { id: "ground_slam", name: "ทุบแผ่นดิน", kind: "active", max: 5, pos: [0, 1], req: [["whirlwind", 3]], glyph: "slam",
        skill: { type: "cone", stat: "atk", mult: lin(2.6, 0.35), mp: 18, cd: 8, motion: "thrust", reach: 230, arc: 100, stun: lin(1, 0.15), color: "#ffcf9a" },
        desc: (r) => `ทุบพื้นด้านหน้า ดาเมจ ${pct(lin(2.6, 0.35)(r))} ของพลังโจมตี มึน ${lin(1, 0.15)(r).toFixed(1)} วิ` },
      { id: "frenzy", name: "บ้าคลั่ง", kind: "passive", max: 5, pos: [2, 1], req: [["hot_blood", 3]], glyph: "rage",
        stats: (r) => ({ crit: 0.03 * r, critDmg: 0.05 * r }), desc: (r) => `โอกาสคริติคอล +${pct(0.03 * r)} แรงคริติคอล +${pct(0.05 * r)}` },
      { id: "rage", name: "โทสะ", kind: "active", max: 5, pos: [1, 2], req: [["ground_slam", 3], ["frenzy", 2]], glyph: "rage",
        skill: { type: "buff", mp: 25, cd: 25, motion: "swing", duration: 8, buff: (r) => ({ atkPct: 0.25 + 0.05 * r, aspd: 0.15 }), color: "#ff8a6a" },
        desc: (r) => `8 วิ: พลังโจมตี +${pct(0.25 + 0.05 * r)} ความเร็วโจมตี +15%` },
    ],
  },
  guardian: {
    name: "ผู้พิทักษ์", cls: "warrior", color: "#ffd98a", glyph: "shield",
    note: "ป้องกันหนา ฟื้นตัวเร็ว ทำให้ศัตรูมึน",
    nodes: [
      { id: "fortify", name: "ยืนหยัด", kind: "active", max: 5, pos: [0, 0], glyph: "shield",
        skill: { type: "buff", mp: 12, cd: 14, motion: "thrust", duration: 8, heal: lin(0.06, 0.01), buff: (r) => ({ defPct: 0.3 + 0.06 * r, mdefPct: 0.2 + 0.04 * r }), color: "#ffe2a0" },
        desc: (r) => `8 วิ: ป้องกัน +${pct(0.3 + 0.06 * r)} ต้านเวท +${pct(0.2 + 0.04 * r)} และฟื้น HP ${pct(lin(0.06, 0.01)(r))}` },
      { id: "iron_skin", name: "ผิวเหล็ก", kind: "passive", max: 5, pos: [2, 0], glyph: "up",
        stats: (r) => ({ defPct: 0.06 * r, maxHpPct: 0.04 * r }), desc: (r) => `ป้องกัน +${pct(0.06 * r)} HP สูงสุด +${pct(0.04 * r)}` },
      { id: "shield_bash", name: "กระแทกโล่", kind: "active", max: 5, pos: [0, 1], req: [["fortify", 3]], glyph: "bash",
        skill: { type: "cone", stat: "atk", mult: lin(1.8, 0.25), mp: 10, cd: 6, motion: "thrust", reach: 140, arc: 70, stun: lin(1.5, 0.2), knock: 90, color: "#ffe9b8" },
        desc: (r) => `กระแทกด้านหน้า ดาเมจ ${pct(lin(1.8, 0.25)(r))} ของพลังโจมตี มึน ${lin(1.5, 0.2)(r).toFixed(1)} วิ` },
      { id: "second_wind", name: "ฟื้นตัว", kind: "passive", max: 5, pos: [2, 1], req: [["iron_skin", 3]], glyph: "heart",
        stats: (r) => ({ hpRegen: 2.5 * r }), desc: (r) => `ฟื้น HP +${(2.5 * r).toFixed(1)}/วิ` },
      { id: "war_cry", name: "คำรามศึก", kind: "active", max: 5, pos: [1, 2], req: [["shield_bash", 3], ["second_wind", 2]], glyph: "cry",
        skill: { type: "buff", mp: 30, cd: 30, motion: "swing", duration: 10, heal: lin(0.15, 0.02), buff: (r) => ({ dmgRed: 0.2 + 0.04 * r }), color: "#ffd070" },
        desc: (r) => `10 วิ: ลดความเสียหายที่ได้รับ ${pct(0.2 + 0.04 * r)} และฟื้น HP ${pct(lin(0.15, 0.02)(r))}` },
    ],
  },
  duelist: {
    name: "นักดาบพริ้ว", cls: "warrior", color: "#9ff0ff", glyph: "dash",
    note: "พุ่งเข้าออกเร็ว ฟันหลายครั้ง คริติคอลถี่",
    nodes: [
      { id: "dash_strike", name: "พุ่งแทง", kind: "active", max: 5, pos: [0, 0], glyph: "dash",
        skill: { type: "dash", stat: "atk", mult: lin(1.8, 0.25), mp: 10, cd: 5, motion: "thrust", distance: 260, width: 70, color: "#c8f8ff" },
        desc: (r) => `พุ่งไปทางที่เล็ง 2.6 ม. ฟันทุกตัวที่ผ่าน ดาเมจ ${pct(lin(1.8, 0.25)(r))} ของพลังโจมตี` },
      { id: "light_feet", name: "ฝีเท้าเบา", kind: "passive", max: 5, pos: [2, 0], glyph: "up",
        stats: (r) => ({ move: 0.04 * r, aspd: 0.02 * r }), desc: (r) => `ความเร็วเดิน +${pct(0.04 * r)} ความเร็วโจมตี +${pct(0.02 * r)}` },
      { id: "twin_slash", name: "ฟันคู่", kind: "active", max: 5, pos: [0, 1], req: [["dash_strike", 3]], glyph: "twin",
        skill: { type: "cone", stat: "atk", mult: lin(1.3, 0.18), hits: 2, mp: 8, cd: 3, motion: "swing", reach: 150, arc: 110, color: "#d8fbff" },
        desc: (r) => `ฟันด้านหน้า 2 ครั้ง ครั้งละ ${pct(lin(1.3, 0.18)(r))} ของพลังโจมตี` },
      { id: "vital_point", name: "จุดตาย", kind: "passive", max: 5, pos: [2, 1], req: [["light_feet", 3]], glyph: "pierce",
        stats: (r) => ({ crit: 0.04 * r }), desc: (r) => `โอกาสคริติคอล +${pct(0.04 * r)}` },
      { id: "blade_storm", name: "พายุดาบ", kind: "active", max: 5, pos: [1, 2], req: [["twin_slash", 3], ["vital_point", 2]], glyph: "storm",
        skill: { type: "storm", stat: "atk", mult: lin(0.9, 0.12), pulses: 5, every: 0.2, mp: 30, cd: 18, motion: "swing", radius: 200, color: "#e0fbff" },
        desc: (r) => `ฟันรอบตัว 5 ครั้งใน 1 วิ ครั้งละ ${pct(lin(0.9, 0.12)(r))} ของพลังโจมตี` },
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
      { id: "tough", name: "ทรหด", kind: "passive", max: 5, pos: [2, 0], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.04 * r, maxMpPct: 0.04 * r }), desc: (r) => `HP และ MP สูงสุด +${pct(0.04 * r)}` },
      { id: "keen_eye", name: "สายตานักเดินทาง", kind: "passive", max: 5, pos: [1, 1], req: [["first_aid", 1], ["tough", 3]], glyph: "eye",
        stats: (r) => ({ xpPct: 0.05 * r }), desc: (r) => `ค่าประสบการณ์ที่ได้ +${pct(0.05 * r)}` },
    ],
  },
};

// ---- masteries ----
// Weapon masteries cover weapon types (items.js); each level adds damage and attack speed with
// them, and set levels open a passive or an active that needs that weapon in hand.
type RewardSpec = Omit<MasteryReward, "at" | "kind">;
const weaponMastery = (name: string, weapons: WeaponId[], glyph: string, p5: RewardSpec, s15: RewardSpec): Mastery => ({
  name, kind: "weapon", weapons, glyph, max: 30,
  per: { dmg: 0.02, aspd: 0.005 },
  perDesc: "ดาเมจ +2% ความเร็วโจมตี +0.5% ต่อระดับ เมื่อถืออาวุธนี้",
  rewards: [
    { at: 5, kind: "passive", ...p5 },
    { at: 10, kind: "passive", name: "ชำนาญ", glyph: "up", stats: { dmg: 0.05 }, desc: "ดาเมจ +5% เมื่อถืออาวุธนี้" },
    { at: 15, kind: "active", ...s15 },
    { at: 20, kind: "passive", name: "เชี่ยวชาญ", glyph: "swirl", stats: { aspd: 0.05, crit: 0.03 }, desc: "ความเร็วโจมตี +5% โอกาสคริติคอล +3% เมื่อถืออาวุธนี้" },
    { at: 30, kind: "passive", name: "ปรมาจารย์", glyph: "star", stats: { dmg: 0.1, crit: 0.05 }, desc: "ดาเมจ +10% โอกาสคริติคอล +5% เมื่อถืออาวุธนี้" },
  ],
});

export const MASTERIES: Record<string, Mastery> = {
  sword: weaponMastery("ดาบ", ["sword_1h", "sword_2h"], "sword",
    { name: "คมดาบ", stats: { crit: 0.05 }, desc: "โอกาสคริติคอล +5% เมื่อถือดาบ" },
    { id: "sword_wave", name: "คลื่นดาบ", glyph: "wave",
      skill: { type: "bolt", stat: "atk", mult: () => 2, pierce: true, mp: 12, cd: 6, motion: "swing", speed: 900, range: 520, radius: 50, color: "#e6f4ff" },
      desc: "ฟันคลื่นดาบทะลุทุกตัว ดาเมจ 200% ของพลังโจมตี" }),
  axe: weaponMastery("ขวาน", ["axe"], "axe",
    { name: "น้ำหนักขวาน", stats: { critDmg: 0.2 }, desc: "แรงคริติคอล +20% เมื่อถือขวาน" },
    { id: "axe_spin", name: "ขวานพายุ", glyph: "spin",
      skill: { type: "nova", stat: "atk", mult: () => 2.4, mp: 15, cd: 7, motion: "swing", radius: 180, knock: 60, color: "#ffd9b0" },
      desc: "หมุนขวานรอบตัว ดาเมจ 240% ของพลังโจมตี" }),
  mace: weaponMastery("ค้อน", ["mace"], "mace",
    { name: "แรงกระแทก", stats: { stunHit: 0.1 }, desc: "ตีปกติมีโอกาส 10% ทำให้มึน 1 วิ เมื่อถือค้อน" },
    { id: "mace_quake", name: "ทุบสะเทือน", glyph: "slam",
      skill: { type: "cone", stat: "atk", mult: () => 2.2, mp: 15, cd: 8, motion: "thrust", reach: 200, arc: 120, stun: () => 1.5, color: "#ffe4b0" },
      desc: "ทุบพื้นด้านหน้า ดาเมจ 220% ของพลังโจมตี มึน 1.5 วิ" }),
  spear: weaponMastery("หอก", ["spear_1h", "spear_2h"], "spear",
    { name: "ระยะหอก", stats: { reach: 0.15 }, desc: "ระยะโจมตี +15% เมื่อถือหอก" },
    { id: "spear_lance", name: "แทงทะลวง", glyph: "pierce",
      skill: { type: "beam", stat: "atk", mult: () => 2.5, mp: 14, cd: 7, motion: "thrust", length: 420, width: 60, color: "#f0f6ff" },
      desc: "แทงทะลุแนวยาว 4.2 ม. ดาเมจ 250% ของพลังโจมตี" }),
  dagger: weaponMastery("มีด", ["dagger", "dual_daggers"], "dagger",
    { name: "มือไว", stats: { aspd: 0.1 }, desc: "ความเร็วโจมตี +10% เมื่อถือมีด" },
    { id: "shadow_step", name: "เงาจู่โจม", glyph: "dash",
      skill: { type: "dash", stat: "atk", mult: () => 2.2, mp: 12, cd: 6, motion: "thrust", distance: 200, width: 60, color: "#c8b8ff" },
      desc: "พุ่งผ่านศัตรู ดาเมจ 220% ของพลังโจมตี" }),
  staff: weaponMastery("ไม้เท้า", ["staff"], "staff",
    { name: "สื่อมานา", stats: { matkPct: 0.08 }, desc: "พลังเวท +8% เมื่อถือไม้เท้า" },
    { id: "staff_scatter", name: "เวทกระจาย", glyph: "fan",
      skill: { type: "fan", stat: "matk", mult: () => 0.9, count: 5, spread: 50, mp: 16, cd: 6, motion: "cast", speed: 950, range: 520, radius: 28, color: "#b8ffd8" },
      desc: "ยิงลูกเวท 5 ลูกเป็นรูปพัด ลูกละ 90% ของพลังเวท" }),
  bow: weaponMastery("ธนู", ["bow"], "bow",
    { name: "สายตาเหยี่ยว", stats: { reach: 0.15 }, desc: "ระยะยิง +15% เมื่อถือธนู" },
    { id: "arrow_rain", name: "ยิงกระจาย", glyph: "fan",
      skill: { type: "fan", stat: "atk", mult: () => 0.85, count: 5, spread: 40, arrow: true, mp: 14, cd: 6, motion: "shoot", speed: 1400, range: 700, radius: 26, color: "#fff2c8" },
      desc: "ยิงลูกธนู 5 ดอกเป็นรูปพัด ดอกละ 85% ของพลังโจมตี" }),
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
// Each level adds base stats (the element's strong side most); levels also strengthen every
// active skill (skill line), and milestones along the line add stats or skill effects
// (the effects are in skills.ts and stats.ts skillPower).
export const ELEMENTS: Record<string, ElementDef> = {
  earth: {
    name: "ดิน", color: "#d6a35c", glyph: "earth", max: 50, side: "ป้องกัน",
    per: { def: 1.4, mdef: 0.8, maxHp: 10, atk: 0.3, matk: 0.3 },
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
    per: { hpRegen: 0.3, mpRegen: 0.25, maxMp: 6, maxHp: 4, matk: 0.4 },
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
    per: { move: 0.006, aspd: 0.008, crit: 0.0015, cdr: 0.003, atk: 0.3 },
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
    per: { atk: 1.1, matk: 1.1, critDmg: 0.01, maxHp: 2 },
    skill: "ดาเมจสกิลแรงขึ้น 1% ต่อระดับ",
    marks: [
      { at: 10, name: "เผาไหม้", desc: "สกิลที่ตีโดนเผาศัตรู 20% ของดาเมจใน 3 วิ" },
      { at: 20, name: "เปลวร้อน", desc: "พลังโจมตีและพลังเวท +5%", stats: { atkPct: 0.05, matkPct: 0.05 } },
      { at: 35, name: "ไฟลามทุ่ง", desc: "การเผาแรงขึ้นเป็น 40% ของดาเมจ" },
      { at: 50, name: "อัคนี", desc: "ดาเมจสกิลแรงขึ้นอีก 15%" },
    ],
  },
  // opened by an element book
  lightning: {
    name: "สายฟ้า", color: "#fff27a", glyph: "bolt", max: 50, side: "คริติคอล", book: "book_lightning",
    per: { crit: 0.004, critDmg: 0.012, aspd: 0.004, atk: 0.5, matk: 0.5 },
    skill: "โอกาสคริติคอลของสกิล +0.3% ต่อระดับ",
    marks: [
      { at: 10, name: "ฟ้าผ่า", desc: "สกิลที่ตีโดนกระโดดไปโดนอีก 1 ตัวใกล้ๆ 30%" },
      { at: 20, name: "ประจุไฟฟ้า", desc: "แรงคริติคอล +15%", stats: { critDmg: 0.15 } },
      { at: 35, name: "สายฟ้าแตกแขนง", desc: "กระโดดไปโดน 2 ตัว" },
      { at: 50, name: "อสุนีบาต", desc: "ดาเมจที่กระโดดแรงขึ้นเป็น 60% โอกาสคริติคอล +5%", stats: { crit: 0.05 } },
    ],
  },
};

// Every tree node by id, with its tree.
export const NODES: Record<string, { tree: string; node: TreeNode }> = {};
for (const [tree, t] of Object.entries(TREES)) for (const node of t.nodes) NODES[node.id] = { tree, node };

// Books are items (items.js) that open a tree, mastery or element when read.
export const BOOKS: Record<string, { kind: "tree" | "mastery" | "element"; id: string }> = {
  book_survivor: { kind: "tree", id: "survivor" },
  book_gathering: { kind: "mastery", id: "gathering" },
  book_lightning: { kind: "element", id: "lightning" },
};

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
      ACTIVES[r.id] = { id: r.id, name: r.name, glyph: r.glyph ?? "star", skill: r.skill, max: 1, source: { mastery: mid, at: r.at, weapons: m.weapons }, color: "#ffe6a8", desc: r.desc };
    }
  }
}

const SAVE_KEY = "mmoproject.character.v1";

interface SaveData {
  cls?: ClassId | null;
  level?: number;
  xp?: number;
  ranks?: Record<string, number>;
  mastery?: Record<string, number>;
  elements?: Record<string, number>;
  unlocked?: { trees?: string[]; masteries?: string[]; elements?: string[] };
  hotbar?: (string | null)[];
}

export class Progress {
  listeners = new Set<(p: Progress) => void>();
  cls: ClassId | null = null;
  level = 1;
  xp = 0;
  ranks: Record<string, number> = {};    // tree node id -> rank
  mastery: Record<string, number> = {};  // mastery id -> level
  elements: Record<string, number> = {}; // element id -> level
  unlocked: { trees: string[]; masteries: string[]; elements: string[] } = { trees: [], masteries: [], elements: [] }; // from books
  hotbar: (string | null)[] = new Array(10).fill(null);

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
    if (cls === "mage") this.hotbar[0] = "magic_bolt";
    if (cls === "warrior") this.hotbar[0] = "whirlwind";
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

  changed(): void {
    this.save();
    for (const fn of this.listeners) fn(this);
  }

  get points() {
    return this.level;
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

  trees(): string[] {
    const own = this.cls ? CLASSES[this.cls].trees : [];
    return [...own, ...this.unlocked.trees.filter((t) => !own.includes(t))];
  }

  lockedTrees(): string[] {
    return Object.keys(TREES).filter((t) => !this.trees().includes(t) && TREES[t].book);
  }

  masteries(): string[] {
    return Object.keys(MASTERIES).filter((m) => MASTERIES[m].kind === "weapon" || this.unlocked.masteries.includes(m));
  }

  elementsOpen(): string[] {
    return Object.keys(ELEMENTS).filter((e) => !ELEMENTS[e].book || this.unlocked.elements.includes(e));
  }

  pointsIn(treeId: string): number {
    return TREES[treeId].nodes.reduce((a, n) => a + (this.ranks[n.id] ?? 0), 0);
  }

  // Why a node can't take a point, or null when it can.
  blockNode(treeId: string, node: TreeNode): string | null {
    if (!this.trees().includes(treeId)) return "ยังไม่ได้ปลดล็อคต้นสกิลนี้";
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

  // Read a book item: returns a message, or null if it was already known.
  readBook(bookId: string): string | null {
    const b = BOOKS[bookId];
    if (!b) return null;
    const list = { tree: this.unlocked.trees, mastery: this.unlocked.masteries, element: this.unlocked.elements }[b.kind];
    if (list.includes(b.id)) return null;
    list.push(b.id);
    this.changed();
    const name = b.kind === "tree" ? TREES[b.id].name : b.kind === "mastery" ? MASTERIES[b.id].name : ELEMENTS[b.id].name;
    return { tree: "ต้นสกิล", mastery: "ความเชี่ยวชาญ", element: "ธาตุ" }[b.kind] + name;
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
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        cls: this.cls, level: this.level, xp: this.xp, ranks: this.ranks, mastery: this.mastery,
        elements: this.elements, unlocked: this.unlocked, hotbar: this.hotbar,
      }));
    } catch {
      // not persisted
    }
  }

  load(): boolean {
    let d: SaveData | null = null;
    try {
      d = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    } catch {
      return false;
    }
    if (!d || (d.cls && !CLASSES[d.cls])) return false;
    const saved = d;
    this.cls = d.cls ?? null;
    this.level = Math.max(1, Math.min(MAX_LEVEL, (d.level ?? 1) | 0 || 1));
    this.xp = Math.max(0, Number(d.xp) || 0);
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
    this.hotbar = Array.from({ length: 10 }, (_, i) => {
      const id = saved.hotbar?.[i];
      return id && ACTIVES[id] ? id : null;
    });
    // a save from before the trees had prerequisites gets its tree points back
    if (Object.keys(this.ranks).some((id) => this.missing(NODES[id].node).length)) this.ranks = {};
    if (this.spent > this.points) this.refund();
    return true;
  }
}

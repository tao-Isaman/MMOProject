// Item and weapon tables.
//
// Every weapon type swings with one of the character's Oriverse attack clips (motion) and
// differs in reach, speed and damage. Distances are world centimetres, times are seconds.

import type { Dye } from "./recolor";

export type Motion = "swing" | "thrust" | "shoot";
export const MOTIONS: Motion[] = ["swing", "thrust", "shoot"];

export interface WeaponType {
  name: string;
  motion: Motion;
  builtin?: boolean;  // the Oriverse clip draws this weapon itself
  hit?: "arc" | "line";
  reach: number;
  arc?: number;       // degrees, arc hits
  width?: number;     // cm, line hits
  interval: number;   // s between attacks
  damage: [number, number];
  crit?: number;
  pierce?: boolean;
  hits?: number;
  projectile?: { kind: "bolt" | "arrow" | "bullet"; speed: number; range: number; radius: number };
  twoHanded?: boolean; // takes the off hand too
  note?: string;
}

export type WeaponId = "sword_1h" | "sword_2h" | "axe" | "axe_2h" | "mace" | "spear_1h" | "spear_2h" | "dagger" | "staff" | "bow" | "knuckle" | "claw"
  | "pistol" | "rifle";

// A one-handed weapon in the off hand adds a second hit for this much of its damage to whatever
// the main hand hit, and every attack takes this much longer.
export const OFFHAND_DAMAGE = 0.5;
export const DUAL_WIELD_SLOWDOWN = 1.15;

// The bow uses the shoot clip, where Oriverse drew the bow and arrow in, so nothing is drawn over
// it (builtin). Every other weapon has its art drawn into the hand, in an empty-handed clip (a
// swing with a sword drawn in plays the thrust instead: see Player.clipFor), held still in the
// hand (src/weapons.ts heldAngle). hit: "arc" (in front) or "line" (straight ahead).

export const WEAPON_TYPES: Record<WeaponId, WeaponType> = {
  sword_1h: {
    name: "ดาบมือเดียว", motion: "swing", hit: "arc", reach: 125, arc: 110, interval: 0.62, damage: [18, 24],
    note: "ฟันเป็นแนวโค้งหน้าตัว",
  },
  sword_2h: {
    name: "ดาบสองมือ", motion: "swing", hit: "arc", reach: 155, arc: 150, interval: 1.0, damage: [32, 42], twoHanded: true,
    note: "ฟันกว้าง ช้าแต่แรง",
  },
  axe: {
    name: "ขวาน", motion: "thrust", hit: "arc", reach: 120, arc: 95, interval: 0.82, damage: [26, 34], crit: 0.12,
    note: "โอกาสคริติคอลสูง",
  },
  axe_2h: {
    name: "ขวานสองมือ", motion: "thrust", hit: "arc", reach: 145, arc: 130, interval: 1.1, damage: [38, 50], crit: 0.12, twoHanded: true,
    note: "ฟันหนักเป็นวงกว้าง โอกาสคริติคอลสูง",
  },
  mace: {
    name: "ค้อน", motion: "thrust", hit: "arc", reach: 110, arc: 90, interval: 0.9, damage: [28, 36],
    note: "ตีหนัก",
  },
  spear_1h: {
    name: "หอกมือเดียว", motion: "thrust", hit: "line", reach: 185, width: 46, interval: 0.7, damage: [20, 26],
    note: "แทงไกล",
  },
  spear_2h: {
    name: "หอกสองมือ", motion: "thrust", hit: "line", reach: 235, width: 56, interval: 1.0, damage: [30, 40], pierce: true, twoHanded: true,
    note: "แทงทะลุทุกตัวในแนว",
  },
  dagger: {
    name: "มีดสั้น", motion: "thrust", hit: "line", reach: 95, width: 40, interval: 0.4, damage: [11, 15], crit: 0.1,
    note: "แทงเร็ว",
  },
  staff: {
    name: "ไม้เท้า", motion: "thrust", reach: 0, interval: 1.1, damage: [26, 34],
    projectile: { kind: "bolt", speed: 900, range: 520, radius: 34 },
    note: "ยิงลูกเวทระยะกลาง",
  },
  bow: {
    name: "ธนู", motion: "shoot", builtin: true, reach: 0, interval: 0.9, damage: [16, 22], twoHanded: true,
    projectile: { kind: "arrow", speed: 1400, range: 780, radius: 26 },
    note: "ยิงไกลที่สุด",
  },
  // worn on the fist: punches thrown with the empty-handed thrust (the monk's weapon)
  knuckle: {
    name: "สนับมือ", motion: "thrust", hit: "line", reach: 85, width: 46, interval: 0.45, damage: [13, 17],
    note: "ต่อยเร็ว ระยะสั้น อาวุธทุบ",
  },
  // blades over the knuckles: quick slashes, a little likelier to crit (the assassin's weapon)
  claw: {
    name: "กรงเล็บ", motion: "thrust", hit: "arc", reach: 100, arc: 80, interval: 0.42, damage: [12, 16], crit: 0.08,
    note: "ข่วนเร็ว ระยะสั้น อาวุธฟัน",
  },
  // v0.5 (docs/v05_jobs.md): guns, fired with the arm held out (the empty-handed thrust). A
  // pistol is one-handed (one in each hand fires both); a rifle takes both hands and outranges
  // the bow. They need no shot in the bag.
  pistol: {
    name: "ปืนสั้น", motion: "thrust", reach: 0, interval: 0.6, damage: [12, 16],
    projectile: { kind: "bullet", speed: 1900, range: 560, radius: 20 },
    note: "ยิงเร็ว ระยะกลาง ถือคู่ได้",
  },
  rifle: {
    name: "ปืนยาว", motion: "thrust", reach: 0, interval: 1.2, damage: [28, 36], twoHanded: true,
    projectile: { kind: "bullet", speed: 2400, range: 880, radius: 22 },
    note: "ยิงช้าแต่แรง ไกลที่สุดในเกม",
  },
};

// Dyes. On a body region a dye keeps each pixel's shading and moves the region to its hue,
// saturation and average lightness (target). A dye on the region it was drawn in (the region's
// "natural" dye, e.g. white on the mage coat) leaves it untouched.
export interface NamedDye extends Dye {
  name: string;
}

export const DYES: Record<string, NamedDye> = {
  white: { name: "ขาว", hue: 222, sat: 0.3, target: 0.93 },
  sky: { name: "ฟ้า", hue: 205, sat: 0.62, target: 0.86 },
  rose: { name: "ชมพู", hue: 340, sat: 0.6, target: 0.86 },
  mint: { name: "เขียวมิ้นต์", hue: 150, sat: 0.5, target: 0.85 },
  lilac: { name: "ม่วง", hue: 270, sat: 0.5, target: 0.85 },
  black: { name: "ดำ", hue: 245, sat: 0.2, target: 0.17 },
  navy: { name: "กรมท่า", hue: 225, sat: 0.6, target: 0.29 },
  wine: { name: "แดงไวน์", hue: 350, sat: 0.62, target: 0.29 },
  forest: { name: "เขียวเข้ม", hue: 140, sat: 0.5, target: 0.28 },
  cocoa: { name: "น้ำตาล", hue: 28, sat: 0.5, target: 0.31 },
  crimson: { name: "แดงเลือดนก", hue: 352, sat: 0.62, target: 0.42 },
  ochre: { name: "เหลืองมัสตาร์ด", hue: 42, sat: 0.62, target: 0.55 },
  teal: { name: "เขียวหัวเป็ด", hue: 178, sat: 0.5, target: 0.4 },
  plum: { name: "ม่วงพลัม", hue: 290, sat: 0.4, target: 0.33 },
  sand: { name: "ทราย", hue: 38, sat: 0.4, target: 0.74 },
};

// Tops and bottoms each come in a shape (the half of one Oriverse body sprite: tops from the
// head down to the waist with the arms, bottoms from the waist to the feet) and a colour. Any
// top goes with any bottom of the same build (src/look.ts joins the halves at the waist).
// dye null keeps the shape's own colours; a dye recolours the shape's main cloth region
// (bodies.json `cloth`).
export type Gender = "female" | "male";
export interface Shape {
  name: string;
  body: string;
  gender: Gender;
  note: string;
  bare?: boolean; // what a character wears with the slot empty; no item has this shape
  job?: boolean;  // a job's own outfit (src/outfits.ts); no item has this shape either
}

export const SHAPES: Record<"top" | "bottom", Record<string, Shape>> = {
  top: {
    mage: { name: "เสื้อคลุมจอมเวท", body: "mageb", gender: "female", note: "เสื้อคลุมยาวขลิบทอง แขนกว้าง เสื้อกั๊กคาดเข็มขัด" },
    priestess: { name: "เสื้อนักบวช", body: "priestess", gender: "female", note: "เสื้อแขนยาว ปกสูง ผ้าคลุมไหล่สีขาว" },
    adventurer: { name: "เสื้อกั๊กนักผจญภัย", body: "adventurer", gender: "female", note: "เสื้อกั๊กหนัง เกราะไหล่ สายสะพาย ผ้าพันแขน" },
    warrior: { name: "แจ็กเก็ตนักรบ", body: "warrior", gender: "male", note: "แจ็กเก็ตแขนพับ เสื้อด้านในสีดำ" },
    plain: { name: "เสื้อยืดผ้าฝ้าย", body: "plainf", gender: "female", note: "เสื้อยืดแขนสั้นสีน้ำตาลอ่อน", bare: true },
    plain_m: { name: "เสื้อยืดผ้าฝ้าย", body: "plainm", gender: "male", note: "เสื้อยืดแขนสั้นสีน้ำตาลอ่อน", bare: true },
    swordsman_f: { name: "เสื้อนักดาบ", body: "swordsman_f", gender: "female", note: "ทูนิกสีกรมท่า ผ้าคลุมไหล่ เข็มขัดหนัง ปลอกแขนหนัง", job: true },
    swordsman_m: { name: "เสื้อนักดาบ", body: "swordsman_m", gender: "male", note: "ทูนิกสีกรมท่า ผ้าคลุมไหล่ เกราะไหล่เหล็ก เข็มขัดและปลอกแขนหนัง", job: true },
    ranger_m: { name: "เสื้อนายพราน", body: "ranger_m", gender: "male", note: "เสื้อสีเขียวหัวเป็ด เสื้อกั๊กหนัง ปลอกแขนหนัง กระบอกลูกธนูสะพายหลัง", job: true },
    knight_f: { name: "เกราะอัศวิน", body: "knight_f", gender: "female", note: "เกราะเหล็กเต็มตัว ตรากางเขนที่อก ผ้าคลุมยาวสีกรมท่า ถุงมือหนัง", job: true },
    knight_m: { name: "เกราะอัศวิน", body: "knight_m", gender: "male", note: "เกราะเหล็ก เสื้อคลุมสีขาวตรากางเขน ผ้าคลุมยาวสีกรมท่า", job: true },
    bishop_f: { name: "เสื้อคลุมบาทหลวง", body: "bishop_f", gender: "female", note: "เสื้อคลุมยาวสีขาว ขลิบทอง ผ้าสโตลปักทอง", job: true },
    bishop_m: { name: "เสื้อคลุมบาทหลวง", body: "bishop_m", gender: "male", note: "เสื้อคลุมยาวสีขาว ขลิบทอง ผ้าคลุมไหล่ ผ้าสโตลปักทอง", job: true },
    wizard_f: { name: "เสื้อคลุมจอมเวท", body: "wizard_f", gender: "female", note: "เสื้อคลุมยาวมีฮู้ดสีม่วง ขลิบทอง เข็มกลัดทอง ผ้าคาดเอวสีกรมท่า", job: true },
    wizard_m: { name: "เสื้อคลุมจอมเวท", body: "wizard_m", gender: "male", note: "เสื้อคลุมยาวมีฮู้ดสีม่วง ขลิบทอง ตราทองที่หลัง ผ้าคาดเอวสีเข้ม", job: true },
    ranger_f: { name: "เสื้อนายพราน", body: "ranger_f", gender: "female", note: "เสื้อสีเขียวหัวเป็ด ปลอกแขนหนัง เข็มขัดหนัง กระบอกลูกธนูสะพายหลัง", job: true },
    warlord_m: { name: "เสื้อนักรบคลั่ง", body: "warlord_m", gender: "male", note: "ทูนิกสีดำขลิบทองแดง ผ้าคลุมยาวขนสัตว์สีเทา ปลอกแขนเหล็ก เข็มขัดหนัง", job: true },
    thief_f: { name: "เสื้อหัวขโมย", body: "thief_f", gender: "female", note: "เสื้อสีม่วงพลัม ผ้าพันคอสีดำ ถุงมือดำ มีดสั้นที่เอว", job: true },
    thief_m: { name: "เสื้อหัวขโมย", body: "thief_m", gender: "male", note: "เสื้อฮู้ดสีม่วงพลัม ผ้าพันคอสีดำ ถุงมือดำ มีดสั้นที่เอว", job: true },
    battlemage_f: { name: "เสื้อคลุมจอมเวทนักสู้", body: "battlemage_f", gender: "female", note: "เสื้อคลุมยาวสีฟ้า ข้อมือขาว เข็มขัดหนัง กระเป๋าสะพาย", job: true },
    jester_f: { name: "เสื้อตัวตลก", body: "jester_f", gender: "female", note: "เสื้อลายตารางสีชมพู ปกระบายสีขาว กระดิ่งทอง", job: true },
    jester_m: { name: "เสื้อตัวตลก", body: "jester_m", gender: "male", note: "เสื้อลายทางสีม่วงแดง ปกระบายสีขาว กระดุมทอง", job: true },
  },
  bottom: {
    mage: { name: "กางเกงจอมเวท", body: "mageb", gender: "female", note: "กางเกงขายาว บูทหนัง ใส่กับเสื้อคลุมจอมเวทมีชายเสื้อคลุมยาวคลุมทับ" },
    priestess: { name: "กระโปรงยาวนักบวช", body: "priestess", gender: "female", note: "กระโปรงยาวถึงข้อเท้า ผ้าคาดหน้าตราอาทิตย์" },
    adventurer: { name: "กระโปรงจีบนักผจญภัย", body: "adventurer", gender: "female", note: "กระโปรงจีบสั้น เลกกิ้ง บูทผูกเชือกสูง" },
    warrior: { name: "กางเกงนักรบ", body: "warrior", gender: "male", note: "กางเกงขายาว บูทหนัง" },
    plain: { name: "กางเกงผ้าฝ้าย", body: "plainf", gender: "female", note: "กางเกงขายาวสีน้ำตาลเข้ม รองเท้าผ้า", bare: true },
    plain_m: { name: "กางเกงผ้าฝ้าย", body: "plainm", gender: "male", note: "กางเกงขายาวสีน้ำตาลเข้ม รองเท้าผ้า", bare: true },
    swordsman_f: { name: "กางเกงนักดาบ", body: "swordsman_f", gender: "female", note: "กางเกงสีทราย บูทหนังสูง", job: true },
    swordsman_m: { name: "กางเกงนักดาบ", body: "swordsman_m", gender: "male", note: "กางเกงสีทราย บูทหนัง", job: true },
    ranger_m: { name: "กางเกงนายพราน", body: "ranger_m", gender: "male", note: "กางเกงหนังสีน้ำตาล บูทหนัง กระเป๋าคาดเอว", job: true },
    knight_f: { name: "เกราะขาอัศวิน", body: "knight_f", gender: "female", note: "เกราะขาเหล็ก รองเท้าเหล็ก", job: true },
    knight_m: { name: "เกราะขาอัศวิน", body: "knight_m", gender: "male", note: "เกราะขาเหล็ก รองเท้าเหล็ก", job: true },
    bishop_f: { name: "ชายเสื้อคลุมบาทหลวง", body: "bishop_f", gender: "female", note: "ชายเสื้อคลุมยาวสีขาว ขลิบทอง", job: true },
    bishop_m: { name: "ชายเสื้อคลุมบาทหลวง", body: "bishop_m", gender: "male", note: "ชายเสื้อคลุมยาวสีขาว ขลิบทอง รองเท้าสีเงิน", job: true },
    wizard_f: { name: "ชายเสื้อคลุมจอมเวท", body: "wizard_f", gender: "female", note: "ชายเสื้อคลุมยาวสีม่วง ขลิบทอง กางเกงกรมท่า บูทหนัง", job: true },
    wizard_m: { name: "ชายเสื้อคลุมจอมเวท", body: "wizard_m", gender: "male", note: "ชายเสื้อคลุมยาวสีม่วง ขลิบทอง บูทหนัง", job: true },
    ranger_f: { name: "กางเกงนายพราน", body: "ranger_f", gender: "female", note: "กางเกงสีเขียวเข้ม บูทหนัง", job: true },
    warlord_m: { name: "กางเกงนักรบคลั่ง", body: "warlord_m", gender: "male", note: "กางเกงสีดำ บูทหนัง", job: true },
    thief_f: { name: "กางเกงหัวขโมย", body: "thief_f", gender: "female", note: "กางเกงสีดำ บูทหนัง", job: true },
    thief_m: { name: "กางเกงหัวขโมย", body: "thief_m", gender: "male", note: "กางเกงสีดำ บูทหนัง", job: true },
    battlemage_f: { name: "กางเกงจอมเวทนักสู้", body: "battlemage_f", gender: "female", note: "ชายเสื้อคลุมสีฟ้า กางเกงสีขาว บูทหนัง", job: true },
    jester_f: { name: "กางเกงตัวตลก", body: "jester_f", gender: "female", note: "กระโปรงพองกระดิ่งทอง ถุงน่องลายทาง รองเท้าปลายงอน", job: true },
    jester_m: { name: "กางเกงตัวตลก", body: "jester_m", gender: "male", note: "กางเกงพองลายทางสีม่วงแดง รองเท้าสีม่วง", job: true },
  },
};

// The shape worn when a slot is empty (or holds something for the other build): a plain brown
// T-shirt and trousers, which new characters start in too. Until those bodies are in, the
// build's first outfit stands in.
export const DEFAULT_SHAPE: Record<Gender, string> = { female: "plain", male: "plain_m" };
export const FALLBACK_SHAPE: Record<Gender, string> = { female: "mage", male: "warrior" };

export type ItemKind = "weapon" | "offhand" | "top" | "bottom" | "hat" | "shoes" | "ring" | "trinket" | "potion" | "book" | "style" | "material";
export type EquipSlot = "weapon" | "offhand" | "top" | "bottom" | "hat" | "shoes" | "ring1" | "ring2" | "trinket1" | "trinket2";
// The slots that only add stats (nothing of them is drawn on the character).
export const GEAR_SLOTS: EquipSlot[] = ["hat", "shoes", "ring1", "ring2", "trinket1", "trinket2"];

// Off-hand gear (shields, flasks, tomes): stats while held, and how it is drawn (src/main.ts
// paints the art). The stat bag uses the same keys as passives (stats.ts).
export type OffhandArt = "buckler" | "kite" | "flask" | "tome" | "grimoire";

export interface Item {
  kind: ItemKind;
  name: string;
  weapon?: WeaponId;
  shape?: string;
  dye?: string | null;
  stack?: number;
  note?: string;
  price?: number;                       // shop price in gold; selling pays 40%
  sell?: number;                        // what the shop pays, when not 40% of price
  restore?: { hp?: number; mp?: number }; // potions: HP / MP points
  stats?: Partial<Record<string, number>>; // off-hand gear while held
  art?: OffhandArt;
  style?: string;                       // a hairstyle item: the hairstyle it teaches
  lv?: number;                          // worn from this level up (tier gear)
  tier?: number;                        // its gear tier (GEAR_TIERS), 0 for the shop's
  male?: { shape: string; dye: string | null }; // a garment for both builds: the male build's shape
  base?: string;                        // a refined or made item (variants below): the item it is
  refine?: number;                      // its refine level (+1 to +10)
  maker?: string;                       // who made it
  icon: { weapon?: WeaponId; sheet?: string; glyph?: string; color?: string; art?: string; badge?: string };
}

const weapon = (type: WeaponId): Item => ({
  kind: "weapon", weapon: type, name: WEAPON_TYPES[type].name, icon: { weapon: type }, price: 300,
  note: `${WEAPON_TYPES[type].note} · ${WEAPON_TYPES[type].twoHanded ? "สองมือ" : "มือเดียว"}`,
});
const garment = (kind: "top" | "bottom", shape: string, dye: string | null = null): Item =>
  ({ kind, shape, dye, name: `${SHAPES[kind][shape].name}${dye ? `สี${DYES[dye].name}` : ""}`, icon: {}, price: dye ? 240 : 160 });
const offhand = (name: string, art: OffhandArt, stats: Partial<Record<string, number>>, price: number, note: string): Item =>
  ({ kind: "offhand", name, art, stats, price, icon: {}, note });
// Hats, shoes, rings and trinkets: stats while worn.
const quest = (name: string, glyph: string, color: string, note: string): Item =>
  ({ kind: "material", name, stack: 99, sell: 1, icon: { glyph, color }, note: `${note}<br>ของเควส` });
const gear = (kind: "hat" | "shoes" | "ring" | "trinket", name: string, stats: Partial<Record<string, number>>, price: number, color: string, note: string): Item =>
  ({ kind, name, stats, price, icon: { glyph: kind, color }, note });
// A hairstyle: read to learn it, then pick it in the profile window.
const style = (id: string, name: string, price: number): Item =>
  ({ kind: "style", name: `ตำราทำผม: ${name}`, style: id, stack: 5, price, icon: { glyph: "style", color: "#d9b3e8" }, note: `อ่านเพื่อเรียนทรงผม${name} แล้วเปลี่ยนทรงได้ที่หน้าโปรไฟล์ (เฉพาะตัวละครหญิง)` });
const potion = (name: string, restore: { hp?: number; mp?: number }, color: string, price: number, note: string): Item =>
  ({ kind: "potion", name, restore, stack: 50, price, icon: { glyph: "drop", color }, note });

const BASE: Record<string, Item> = {
  ...Object.fromEntries((Object.keys(WEAPON_TYPES) as WeaponId[]).map((t) => [t, weapon(t)])),
  // mage shape (the ids from before shapes: white and black are its own colours)
  top_white: garment("top", "mage"),
  top_sky: garment("top", "mage", "sky"),
  top_rose: garment("top", "mage", "rose"),
  top_mint: garment("top", "mage", "mint"),
  top_lilac: garment("top", "mage", "lilac"),
  bottom_black: garment("bottom", "mage"),
  bottom_navy: garment("bottom", "mage", "navy"),
  bottom_wine: garment("bottom", "mage", "wine"),
  bottom_forest: garment("bottom", "mage", "forest"),
  bottom_cocoa: garment("bottom", "mage", "cocoa"),
  top_priestess: garment("top", "priestess"),
  top_priestess_wine: garment("top", "priestess", "wine"),
  top_priestess_forest: garment("top", "priestess", "forest"),
  top_priestess_black: garment("top", "priestess", "black"),
  top_priestess_white: garment("top", "priestess", "white"),
  bottom_priestess: garment("bottom", "priestess"),
  bottom_priestess_wine: garment("bottom", "priestess", "wine"),
  bottom_priestess_forest: garment("bottom", "priestess", "forest"),
  bottom_priestess_black: garment("bottom", "priestess", "black"),
  bottom_priestess_white: garment("bottom", "priestess", "white"),
  top_adventurer: garment("top", "adventurer"),
  top_adventurer_navy: garment("top", "adventurer", "navy"),
  top_adventurer_teal: garment("top", "adventurer", "teal"),
  top_adventurer_plum: garment("top", "adventurer", "plum"),
  top_adventurer_ochre: garment("top", "adventurer", "ochre"),
  bottom_adventurer: garment("bottom", "adventurer"),
  bottom_adventurer_sand: garment("bottom", "adventurer", "sand"),
  bottom_adventurer_cocoa: garment("bottom", "adventurer", "cocoa"),
  bottom_adventurer_black: garment("bottom", "adventurer", "black"),
  bottom_adventurer_wine: garment("bottom", "adventurer", "wine"),
  top_warrior: garment("top", "warrior"),
  top_warrior_navy: garment("top", "warrior", "navy"),
  top_warrior_forest: garment("top", "warrior", "forest"),
  bottom_warrior: garment("bottom", "warrior"),
  bottom_warrior_cocoa: garment("bottom", "warrior", "cocoa"),
  bottom_warrior_black: garment("bottom", "warrior", "black"),
  buckler: offhand("โล่ไม้กลม", "buckler", { def: 6, mdef: 2 }, 300, "โล่ไม้เบา ๆ กันได้นิดหน่อย"),
  kite_shield: offhand("โล่อัศวิน", "kite", { def: 14, mdef: 4, maxHpPct: 0.05, move: -0.03 }, 900, "โล่เหล็กยาว หนักแต่กันได้มาก"),
  alchemy_flask: offhand("ขวดแปรธาตุ", "flask", { potion: 0.25, mpRegen: 1.5 }, 700, "ยาที่ดื่มฟื้นมากขึ้น ฟื้น MP เร็วขึ้น"),
  spell_tome: offhand("สมุดเวท", "tome", { matkPct: 0.08, cdr: 0.04, castRed: 0.05 }, 650, "สมุดคาถาของนักเวทฝึกหัด"),
  grimoire: offhand("คัมภีร์โบราณ", "grimoire", { matkPct: 0.14, maxMpPct: 0.1, cdr: 0.06, castRed: 0.1 }, 1800, "คัมภีร์เวทเล่มหนา พลังเวทสูง"),
  // weak and dear on purpose: healing comes mostly from skills, the potions only tide you over
  potion_red: potion("ยาแดง", { hp: 45 }, "#ff6a5a", 50, "ฟื้น HP 45"),
  potion_red_big: potion("ยาแดงเข้มข้น", { hp: 150 }, "#d8343a", 160, "ฟื้น HP 150"),
  potion_blue: potion("ยาฟ้า", { mp: 18 }, "#6ab4ff", 60, "ฟื้น MP 18"),
  potion_blue_big: potion("ยาฟ้าเข้มข้น", { mp: 60 }, "#2f6fd0", 180, "ฟื้น MP 60"),
  // the strong draughts, orange to yellow to white: dear in the high towns' shops (shop.ts
  // TOWN_STOCK), brewed for far less by who knows how (workshop.ts BREWS)
  potion_orange: potion("ยาส้ม", { hp: 300 }, "#ff9a3c", 500, "ฟื้น HP 300"),
  potion_yellow: potion("ยาเหลือง", { hp: 550 }, "#ffd23c", 1100, "ฟื้น HP 550"),
  potion_white: potion("ยาขาว", { hp: 1000 }, "#fbf6e6", 2400, "ฟื้น HP 1000"),
  // (the books, one per skill tree, mastery and element, are added by src/progression.ts)
  style_twintail: style("twintail", "ทวินเทลยาว", 1500),
  style_hime: style("hime", "ยาวหน้าม้าตรง", 1500),
  hat_straw: gear("hat", "หมวกฟาง", { def: 3, mdef: 1 }, 180, "#e2c46a", "หมวกสานกันแดด"),
  hat_leather: gear("hat", "หมวกหนัง", { def: 6, maxHp: 20 }, 520, "#a8743f", "หมวกหนังสัตว์บุนวม"),
  hat_wizard: gear("hat", "หมวกพ่อมด", { matk: 6, maxMp: 20, castRed: 0.05 }, 680, "#6a5acd", "หมวกปลายแหลมของนักเวท"),
  hat_feather: gear("hat", "หมวกขนนก", { hit: 6, flee: 6 }, 640, "#5fb08a", "หมวกประดับขนนกของนักล่า"),
  shoes_sandals: gear("shoes", "รองเท้าแตะ", { move: 0.03 }, 150, "#c99a5b", "เดินเร็วขึ้นนิดหน่อย"),
  shoes_boots: gear("shoes", "รองเท้าบูทหนัง", { def: 4, move: 0.04 }, 480, "#7b5232", "บูทหนังทนทาน"),
  shoes_swift: gear("shoes", "รองเท้าลมเร็ว", { move: 0.08, flee: 5 }, 1400, "#7ad0e8", "เบาราวกับขนนก"),
  ring_power: gear("ring", "แหวนพลัง", { atk: 5 }, 600, "#e86a5a", "แหวนทองแดงฝังทับทิม"),
  ring_mind: gear("ring", "แหวนปัญญา", { matk: 5 }, 600, "#6a9ae8", "แหวนเงินฝังไพลิน"),
  ring_life: gear("ring", "แหวนชีวิต", { maxHp: 40, hpRegen: 0.5 }, 700, "#6fcf6a", "แหวนไม้หอมจากป่าใหญ่"),
  ring_focus: gear("ring", "แหวนแม่นยำ", { hit: 8, crit: 0.02 }, 800, "#e8d06a", "แหวนตาเหยี่ยว"),
  ring_chant: gear("ring", "แหวนบทร่าย", { castRed: 0.08 }, 950, "#b48ae8", "แหวนสลักบทร่ายย่อ ร่ายเวทเสร็จไวขึ้น"),
  trinket_clover: gear("trinket", "จี้ใบโคลเวอร์", { drop: 0.05 }, 900, "#5fbf5a", "นำโชค ของตกบ่อยขึ้น"),
  trinket_fang: gear("trinket", "สร้อยเขี้ยวสัตว์", { atk: 3, critDmg: 0.1 }, 750, "#e8e0c8", "เขี้ยวสัตว์ร้อยเชือก"),
  trinket_moon: gear("trinket", "จี้พระจันทร์", { maxMp: 25, mpRegen: 0.5 }, 750, "#c8d8ff", "จี้เงินรูปจันทร์เสี้ยว"),
  trinket_charm: gear("trinket", "เครื่องรางกันภัย", { mdef: 6, dmgRed: 0.02 }, 950, "#e89a6a", "ผ้ายันต์ห่อหินศักดิ์สิทธิ์"),
  jelly: { kind: "material", name: "เยลลี่", stack: 99, sell: 3, icon: { sheet: "jelly" }, note: "หยดเยลลี่จากสไลม์ ขายให้ร้านค้าได้" },
  sprout: { kind: "material", name: "ใบอ่อน", stack: 99, sell: 20, icon: { sheet: "sprout" }, note: "ใบไม้บนหัวสไลม์ หายาก ขายให้ร้านค้าได้" },
  // things carried or gathered for quests (src/quests.ts); the monster ones drop only while a
  // quest wants them
  quest_letter: quest("จดหมายปิดผนึก", "letter", "#e8d7a8", "จดหมายจากทอม ส่งให้กัปตันมาร์โกที่ท่าเรืออีเดน"),
  boar_tusk: quest("งาหมูป่า", "pierce", "#efe4c8", "งาโค้งของหมูป่าโอ๊ก ซิสเตอร์มาเรียใช้ทำยาสมานแผล"),
  ice_core: quest("แกนน้ำแข็ง", "freeze", "#8fd4ff", "แกนน้ำแข็งที่ไม่ยอมละลาย จากโกเลมน้ำแข็ง"),
  polar_pelt: quest("ขนหมีขั้วโลก", "shield", "#f2f6fa", "ขนหนานุ่มของหมีขั้วโลก อิงกริดใช้ถักเสื้อกันหนาว"),
  bison_hide: quest("หนังควายป่า", "shield", "#9a6a3e", "หนังหนาของควายป่าขนยาว ใช้ทำผ้ากระโจม"),
  dark_shard: quest("เศษผลึกมืด", "star", "#7a52b8", "เศษผลึกที่เต้นตุบเหมือนหัวใจ จากอสูรผลึกมืด"),
  old_bandage: quest("ผ้าพันศพเก่า", "wave", "#d8c9a0", "ผ้าพันแผลเก่าแก่ของมัมมี่ทาส"),
  fox_tail: quest("หางจิ้งจอกเก้าหาง", "flame", "#ffb060", "หางที่เรืองแสงอุ่น ๆ ของจิ้งจอกเก้าหาง"),
  // the merchant's test (quests.ts job_merchant)
  cloud_wool: quest("ขนแกะเมฆ", "cloud", "#f2f6fa", "ขนนุ่มฟูของแกะขนเมฆที่ทุ่งหญ้าโนอา นายห้างซาอีดรับซื้อไปทอผ้า"),
  wool_bale: quest("ห่อผ้าขนแกะ", "bag", "#e8dcc0", "ผ้าขนแกะเมฆม้วนใหญ่จากโนอา ส่งให้มาริน่าที่ร้านเครื่องมือเวนิชเซีย"),
  trade_order: quest("ใบสั่งซื้อ", "letter", "#e8d7a8", "ใบสั่งซื้อผ้ารอบหน้าจากมาริน่า ส่งคืนนายห้างซาอีดที่โนอา"),
};

// ---- materials and refining stones ----
// Monsters leave materials by what they are (drops.ts) for the inventors' crafting; the two stones
// refine gear: sky stone weapons and rings, star stone clothes, hats, shoes, trinkets and off-hand
// gear.
const material = (name: string, glyph: string, color: string, sell: number, note: string): Item =>
  ({ kind: "material", name, stack: 99, sell, icon: { glyph, color }, note });
Object.assign(BASE, {
  iron_ore: material("แร่เหล็ก", "earth", "#9aa3b5", 12, "ก้อนแร่จากโกเลม วิญญาณหิน และของที่คนพกติดตัว ใช้สร้างอาวุธ"),
  beast_hide: material("หนังสัตว์", "paw", "#b98a50", 12, "หนังเหนียวจากสัตว์ แมลง และสัตว์น้ำ ใช้สร้างชุด หมวก และรองเท้า"),
  gem_shard: material("เศษอัญมณี", "star", "#e07ad6", 20, "เศษผลึกจากพืชวิเศษ ปีศาจ เทวะ และมังกร ใช้สร้างแหวนและเครื่องประดับ"),
  monster_core: material("แก่นอสูร", "burst", "#e8604a", 45, "แก่นพลังในตัวมอนสเตอร์ ตัวเลเวลสูงมีบ่อยกว่า ใช้สร้างของทุกอย่าง"),
  sky_stone: material("หินนภา", "cloud", "#7ab8ff", 250, "หินสีฟ้าใสจากฟากฟ้า ใช้ตีบวกอาวุธและแหวน"),
  star_stone: material("หินดารา", "star", "#ffd36b", 250, "หินประกายดาว ใช้ตีบวกชุด หมวก รองเท้า เครื่องประดับ และของมือรอง"),
});

// ---- gear tiers ----
// Gear of levels 30 to 180, every 30: every weapon, armour for the top and the bottom (each build
// its own shape), a hat, shoes, a ring and a trinket. A little stronger than the shop's and
// nothing more: no special abilities. Worn from its level up; found on monsters of its level band
// (drops.ts) or made by an inventor.
export const GEAR_TIERS = [30, 60, 90, 120, 150, 180] as const;
export const TIER_NAMES: Record<number, string> = { 30: "เหล็ก", 60: "เงินยวง", 90: "ทองคำขาว", 120: "มิธริล", 150: "อดามันต์", 180: "ดารา" };
// each tier's armour: the female build's shape (top and bottom alike) and the colour both wear
const TIER_LOOK: Record<number, [string, string]> = {
  30: ["adventurer", "cocoa"], 60: ["priestess", "forest"], 90: ["mage", "navy"],
  120: ["adventurer", "crimson"], 150: ["priestess", "black"], 180: ["mage", "ochre"],
};
// tier slots, and the gear art the stat-only ones borrow (the level is in the description only)
export const TIER_SLOTS = [...(Object.keys(WEAPON_TYPES) as WeaponId[]), "top", "bottom", "hat", "shoes", "ring", "trinket"] as const;
const TIER_ART: Record<string, string> = { hat: "hat_leather", shoes: "shoes_boots", ring: "ring_focus", trinket: "trinket_charm" };
const TIER_GLYPH_COLOR: Record<string, string> = { hat: "#a8743f", shoes: "#7b5232", ring: "#e8d06a", trinket: "#e89a6a" };
export function tierStats(slot: string, tier: number): Partial<Record<string, number>> {
  const r = (v: number) => Math.round(v);
  if (slot in WEAPON_TYPES) {
    const w = WEAPON_TYPES[slot as WeaponId];
    return { [slot === "staff" ? "matk" : "atk"]: r(tier * 0.3 * (w.twoHanded ? 1.5 : 1)) };
  }
  switch (slot) {
    case "top": return { def: r(3 + tier * 0.1), mdef: r(2 + tier * 0.06) };
    case "bottom": return { def: r(2 + tier * 0.08), maxHp: r(tier * 1.2) };
    case "hat": return { def: r(2 + tier * 0.06), mdef: r(1 + tier * 0.05) };
    case "shoes": return { def: r(1 + tier * 0.05), flee: r(tier * 0.05), move: 0.04 };
    case "ring": return { atk: r(2 + tier * 0.08), matk: r(2 + tier * 0.08) };
    default: return { maxHp: r(tier * 1), maxMp: r(tier * 0.4) };
  }
}
export const tierId = (tier: number, slot: string) => `t${tier}_${slot}`;
for (const tier of GEAR_TIERS) {
  const tn = TIER_NAMES[tier], price = 500 * (tier / 30);
  const [shape, dye] = TIER_LOOK[tier];
  for (const slot of TIER_SLOTS) {
    const common = { tier, lv: tier, price, stats: tierStats(slot, tier) };
    let item: Item;
    if (slot in WEAPON_TYPES) {
      const w = weapon(slot as WeaponId);
      item = { ...w, ...common, name: `${w.name}${tn}`, icon: { weapon: slot as WeaponId } };
    } else if (slot === "top" || slot === "bottom") {
      item = { ...garment(slot, shape, dye), ...common, name: `${slot === "top" ? "เสื้อเกราะ" : "เกราะท่อนล่าง"}${tn}`, male: { shape: "warrior", dye } };
      item.icon = {};
    } else {
      const kind = slot as "hat" | "shoes" | "ring" | "trinket";
      const name = { hat: "หมวก", shoes: "รองเท้า", ring: "แหวน", trinket: "จี้" }[kind];
      item = { ...gear(kind, `${name}${tn}`, common.stats, price, TIER_GLYPH_COLOR[kind], `${name}${tn} ของนักผจญภัยเลเวล ${tier}`), ...common };
      item.icon = { glyph: kind, color: TIER_GLYPH_COLOR[kind], art: TIER_ART[kind] };
    }
    item.note = `${item.note ? `${item.note} · ` : ""}อุปกรณ์เลเวล ${tier} (หาได้จากมอนสเตอร์หรือการสร้างเท่านั้น)`;
    BASE[tierId(tier, slot)] = item;
  }
}

// Items drawn as a glyph, and potions, show their own picture where there is one
// (assets/skills/<item id>.png, src/icons.ts); the glyph stays as the fallback.
for (const [id, item] of Object.entries(BASE)) if ((item.icon.glyph || item.kind === "potion") && !item.icon.art) item.icon.art = id;

// ---- refined and made gear ----
// A piece of gear can carry a refine level and its maker's name in its id, "<base>~<plus>^<maker>"
// (either part left out when there is none): "t60_sword_1h~3^มิร่า" is a +3 silver sword made by
// มิร่า. ITEMS builds such an item from its base the first time it is looked up: the base's
// name with "+3" before it and the maker after it, and the refine's stats on top of the base's.
export const REFINE_MAX = 10;
const WEARABLE = new Set<ItemKind>(["weapon", "offhand", "top", "bottom", "hat", "shoes", "ring", "trinket"]);
export function splitId(id: string): { base: string; plus: number; maker: string | null } {
  const m = /^([^~^]+)(?:~(\d+))?(?:\^(.+))?$/.exec(id);
  return m ? { base: m[1], plus: +(m[2] ?? 0), maker: m[3] ?? null } : { base: id, plus: 0, maker: null };
}
export function joinId(base: string, plus: number, maker: string | null): string {
  return base + (plus > 0 ? `~${plus}` : "") + (maker ? `^${maker}` : "");
}
// What each refine level adds, by what the piece is and its tier.
export function refineStats(item: Item, plus: number): Partial<Record<string, number>> {
  if (plus <= 0) return {};
  const t = item.tier ?? 0, step = Math.round(1 + t / 90);
  switch (item.kind) {
    case "weapon": return { [item.weapon === "staff" ? "matk" : "atk"]: plus * Math.round(2 + t / 45) };
    case "ring": return { atk: plus * step, matk: plus * step };
    case "trinket": return { maxHp: plus * Math.round(8 + t / 9) };
    case "offhand": return item.art === "buckler" || item.art === "kite" ? { def: plus * step, mdef: plus } : { matk: plus * 2 };
    default: return { def: plus * step };
  }
}
// The stone that refines a piece of gear.
export function stoneFor(id: string): "sky_stone" | "star_stone" | null {
  const item = ITEMS[id];
  if (!item || !WEARABLE.has(item.kind)) return null;
  return item.kind === "weapon" || item.kind === "ring" ? "sky_stone" : "star_stone";
}
const derived = new Map<string, Item | null>();
function derive(id: string): Item | undefined {
  if (!id.includes("~") && !id.includes("^")) return undefined;
  let item = derived.get(id);
  if (item === undefined) {
    const { base, plus, maker } = splitId(id);
    const b = BASE[base];
    item = b && WEARABLE.has(b.kind) && plus <= REFINE_MAX && joinId(base, plus, maker) === id
      ? {
        ...b, base, refine: plus || undefined, maker: maker ?? undefined,
        name: `${plus ? `+${plus} ` : ""}${b.name}${maker ? ` ของ${maker}` : ""}`,
        stats: addStats(b.stats, refineStats(b, plus)),
        price: Math.round((b.price ?? 0) * (1 + 0.25 * plus)),
        icon: { ...b.icon },
      }
      : null;
    derived.set(id, item);
  }
  return item ?? undefined;
}
function addStats(a: Partial<Record<string, number>> | undefined, b: Partial<Record<string, number>>): Partial<Record<string, number>> {
  const out = { ...a };
  for (const [k, v = 0] of Object.entries(b)) out[k] = (out[k] ?? 0) + v;
  return out;
}
// The base item of an id (itself for a plain item).
export function baseOf(id: string): string {
  return ITEMS[id]?.base ?? id;
}

// Every item: the table above, the books progression.ts adds, and refined and made gear.
export const ITEMS: Record<string, Item> = new Proxy(BASE, {
  get: (t, k) => (typeof k !== "string" || k in t ? t[k as string] : derive(k)),
  has: (t, k) => k in t || (typeof k === "string" && !!derive(k)),
});

// What the off hand holds, for the skills that need something there: a weapon type, "shield" for
// a shield, null for anything else or nothing.
export function offhandKind(id: string | null | undefined): string | null {
  const item = id ? ITEMS[id] : undefined;
  if (!item) return null;
  return item.weapon ?? (item.art === "buckler" || item.art === "kite" ? "shield" : null);
}

// The weapon type an item is (null: not a weapon, or nothing).
export function weaponType(id: string | null | undefined): WeaponId | null {
  return (id && ITEMS[id]?.weapon) || null;
}
// The shape and colour a top or bottom has on a build: a garment for both builds has the male
// build's own.
export function garmentLook(item: Item, gender: Gender): { shape?: string; dye: string | null } {
  return gender === "male" && item.male ? item.male : { shape: item.shape, dye: item.dye ?? null };
}

export const EQUIP_SLOTS: { slot: EquipSlot; name: string }[] = [
  { slot: "weapon", name: "มือหลัก" },
  { slot: "offhand", name: "มือรอง" },
  { slot: "hat", name: "หมวก" },
  { slot: "top", name: "เสื้อ" },
  { slot: "bottom", name: "กางเกง" },
  { slot: "shoes", name: "รองเท้า" },
  { slot: "ring1", name: "แหวน" },
  { slot: "ring2", name: "แหวน" },
  { slot: "trinket1", name: "ประดับ" },
  { slot: "trinket2", name: "ประดับ" },
];

// Where an item usually goes (a ring or a trinket: the first of its two slots).
export function itemSlot(id: string | null | undefined): EquipSlot | null {
  const kind = id ? ITEMS[id]?.kind : undefined;
  if (kind === "ring") return "ring1";
  if (kind === "trinket") return "trinket1";
  return kind === "weapon" || kind === "offhand" || kind === "top" || kind === "bottom" || kind === "hat" || kind === "shoes" ? kind : null;
}

// Whether an item may go in a slot: one-handed weapons fit the off hand too.
export function fitsSlot(id: string | null | undefined, slot: EquipSlot): boolean {
  const item = id ? ITEMS[id] : undefined;
  if (!item) return false;
  if (slot === "offhand") return item.kind === "offhand" || (item.kind === "weapon" && !WEAPON_TYPES[item.weapon!].twoHanded);
  if (slot === "ring1" || slot === "ring2") return item.kind === "ring";
  if (slot === "trinket1" || slot === "trinket2") return item.kind === "trinket";
  return itemSlot(id) === slot;
}

// Fashion clothes: tops and bottoms that only change the look (no tier, no stats). Out of the
// game for now (no way to come by them; what saves held was sold back, src/inventory.ts): the
// look follows the job (src/outfits.ts). The items stay for the people among the monsters,
// who are dressed in them.
export function isFashion(id: string | null | undefined): boolean {
  const item = id ? ITEMS[id] : undefined;
  return !!item && (item.kind === "top" || item.kind === "bottom") && !item.tier;
}

export function isTwoHanded(id: string | null | undefined): boolean {
  const item = id ? ITEMS[id] : undefined;
  return item?.kind === "weapon" && !!WEAPON_TYPES[item.weapon!].twoHanded;
}

// The weapon held in the off hand, if any.
export function offhandWeapon(id: string | null | undefined): WeaponId | null {
  const item = id ? ITEMS[id] : undefined;
  return item?.kind === "weapon" ? item.weapon! : null;
}

// How many of an item one bag slot holds: whatever stacks at all stacks up to STACK_MAX (the
// `stack` of an item only says that it stacks); gear and the rest lie one to a slot.
export const STACK_MAX = 9999;
export function stackLimit(id: string): number {
  return (ITEMS[id]?.stack ?? 1) > 1 ? STACK_MAX : 1;
}

// One line of stats for tooltips.
export function describe(id: string): string {
  const item = ITEMS[id];
  if (!item) return "";
  const extra = [item.lv ? `ต้องการเลเวล ${item.lv}` : "", item.maker ? `สร้างโดย ${item.maker}` : ""].filter(Boolean).join(" · ");
  const text = describeBase(item);
  return extra ? `${text}<br>${extra}` : text;
}
function describeBase(item: Item): string {
  if (item.kind === "weapon") {
    const w = WEAPON_TYPES[item.weapon!];
    const reach = w.projectile ? w.projectile.range : w.reach;
    const hits = w.hits ? ` × ${w.hits}` : "";
    const hands = w.twoHanded ? "อาวุธสองมือ (ใช้มือรองด้วย)" : "มือเดียว · ใส่มือรองได้ (ตีซ้ำ 50%, ค่าสถานะครึ่งหนึ่ง)";
    const stats = item.stats && Object.keys(item.stats).length ? `<br>${statText(item.stats)}` : "";
    return `ดาเมจ ${w.damage[0]}–${w.damage[1]}${hits} · ระยะ ${(reach / 100).toFixed(1)} ม. · ตีทุก ${w.interval} วิ${stats}<br>${w.note}<br>${hands}`;
  }
  if (item.kind === "book" || item.kind === "style") return `${item.note}<br>ดับเบิลคลิกเพื่ออ่าน`;
  if (item.kind === "offhand") return `${item.note}<br>${statText(item.stats)}<br>ใส่มือรอง (ใช้กับอาวุธสองมือไม่ได้)`;
  if (GEAR_WHERE[item.kind]) return `${item.note}<br>${statText(item.stats)}<br>${GEAR_WHERE[item.kind]}`;
  if (item.kind === "potion") return `${item.note}<br>ดับเบิลคลิกเพื่อดื่ม (บอทดื่มเองได้)`;
  if (item.kind === "top" || item.kind === "bottom") {
    // armour: stats only, the outfit seen is the job's (src/outfits.ts)
    if (!item.tier) return `${SHAPES[item.kind][item.shape!].note}<br>ชุดแฟชั่น ยังใช้ไม่ได้`;
    return `${statText(item.stats)}<br>${item.note ?? ""}<br>เพิ่มค่าสถานะอย่างเดียว ชุดที่เห็นเปลี่ยนตามอาชีพ`;
  }
  return item.note ?? "";
}

// Where a hat, shoes, ring or trinket goes.
const GEAR_WHERE: Partial<Record<ItemKind, string>> = { hat: "ใส่ช่องหมวก", shoes: "ใส่ช่องรองเท้า", ring: "ใส่ช่องแหวน (มี 2 ช่อง)", trinket: "ใส่ช่องประดับ (มี 2 ช่อง)" };

// A stat bag as the player reads it ("ป้องกัน +6 · ความเร็วเดิน +4%").
const STAT_WORDS: Record<string, string> = {
  def: "ป้องกัน", mdef: "ต้านเวท", atk: "พลังโจมตี", matk: "พลังเวท", maxHp: "HP สูงสุด", maxMp: "MP สูงสุด", maxHpPct: "HP สูงสุด",
  maxMpPct: "MP สูงสุด", move: "ความเร็วเดิน", luck: "โชคดี", potion: "ยาฟื้นแรงขึ้น", hpRegen: "ฟื้น HP/วิ", mpRegen: "ฟื้น MP/วิ", matkPct: "พลังเวท",
  cdr: "ลดคูลดาวน์", castRed: "ลดเวลาร่าย", hit: "ความแม่นยำ", flee: "หลบหลีก", crit: "โอกาสคริติคอล", critDmg: "แรงคริติคอล", drop: "โอกาสได้ของ", dmgRed: "ลดความเสียหาย",
  statusRes: "ต้านสถานะ",
};
const STAT_PCT = new Set(["maxHpPct", "maxMpPct", "move", "potion", "matkPct", "cdr", "castRed", "crit", "critDmg", "drop", "dmgRed", "statusRes"]);
export function statText(stats: Partial<Record<string, number>> | undefined): string {
  return Object.entries(stats ?? {}).map(([k, v = 0]) => `${STAT_WORDS[k] ?? k} ${v < 0 ? "" : "+"}${STAT_PCT.has(k) ? `${Math.round(v * 100)}%` : v}`).join(" · ");
}

// What the shop pays for one.
export function sellPrice(id: string): number {
  const item = ITEMS[id];
  return item?.sell ?? Math.floor((item?.price ?? 0) * 0.4);
}

// Bag order for sorting: kind first, then shape, colour and name.
const KIND_ORDER: ItemKind[] = ["weapon", "offhand", "hat", "top", "bottom", "shoes", "ring", "trinket", "potion", "book", "style", "material"];
export function sortKey(id: string): string {
  const item = ITEMS[id];
  return `${KIND_ORDER.indexOf(item.kind)}|${item.shape ?? ""}|${item.dye ? 1 : 0}|${id}`;
}

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
  chop?: boolean;     // swung down from overhead
  hit?: "arc" | "line";
  reach: number;
  arc?: number;       // degrees, arc hits
  width?: number;     // cm, line hits
  interval: number;   // s between attacks
  damage: [number, number];
  crit?: number;
  pierce?: boolean;
  hits?: number;
  projectile?: { kind: "bolt" | "arrow"; speed: number; range: number; radius: number };
  twoHanded?: boolean; // takes the off hand too
  note?: string;
}

export type WeaponId = "sword_1h" | "sword_2h" | "axe" | "mace" | "spear_1h" | "spear_2h" | "dagger" | "staff" | "bow";

// A one-handed weapon in the off hand adds a second hit for this much of its damage to whatever
// the main hand hit, and every attack takes this much longer.
export const OFFHAND_DAMAGE = 0.5;
export const DUAL_WIELD_SLOWDOWN = 1.15;

// Swords and the bow use clips where Oriverse drew the weapon in (swing: a sword and its slash,
// shoot: a bow and arrow), so nothing is drawn over them (builtin). Every other weapon uses the
// empty-handed thrust clip with its art drawn into the hand; "chop" swings that art down from
// overhead instead of pointing it along the arm. hit: "arc" (in front) or "line" (straight ahead).

export const WEAPON_TYPES: Record<WeaponId, WeaponType> = {
  sword_1h: {
    name: "ดาบมือเดียว", motion: "swing", builtin: true, hit: "arc", reach: 125, arc: 110, interval: 0.62, damage: [18, 24],
    note: "ฟันเป็นแนวโค้งหน้าตัว",
  },
  sword_2h: {
    name: "ดาบสองมือ", motion: "swing", builtin: true, hit: "arc", reach: 155, arc: 150, interval: 1.0, damage: [32, 42], twoHanded: true,
    note: "ฟันกว้าง ช้าแต่แรง",
  },
  axe: {
    name: "ขวาน", motion: "thrust", chop: true, hit: "arc", reach: 120, arc: 95, interval: 0.82, damage: [26, 34], crit: 0.18,
    note: "โอกาสคริติคอลสูง",
  },
  mace: {
    name: "ค้อน", motion: "thrust", chop: true, hit: "arc", reach: 110, arc: 90, interval: 0.9, damage: [28, 36],
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
    name: "มีดสั้น", motion: "thrust", hit: "line", reach: 95, width: 40, interval: 0.4, damage: [11, 15], crit: 0.15,
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
}

export const SHAPES: Record<"top" | "bottom", Record<string, Shape>> = {
  top: {
    mage: { name: "เสื้อคลุมจอมเวท", body: "mageb", gender: "female", note: "เสื้อคลุมยาวขลิบทอง แขนกว้าง เสื้อกั๊กคาดเข็มขัด" },
    priestess: { name: "เสื้อนักบวช", body: "priestess", gender: "female", note: "เสื้อแขนยาว ปกสูง ผ้าคลุมไหล่สีขาว" },
    adventurer: { name: "เสื้อกั๊กนักผจญภัย", body: "adventurer", gender: "female", note: "เสื้อกั๊กหนัง เกราะไหล่ สายสะพาย ผ้าพันแขน" },
    warrior: { name: "แจ็กเก็ตนักรบ", body: "warrior", gender: "male", note: "แจ็กเก็ตแขนพับ เสื้อด้านในสีดำ" },
    plain: { name: "เสื้อยืดผ้าฝ้าย", body: "plainf", gender: "female", note: "เสื้อยืดแขนสั้นสีน้ำตาลอ่อน", bare: true },
    plain_m: { name: "เสื้อยืดผ้าฝ้าย", body: "plainm", gender: "male", note: "เสื้อยืดแขนสั้นสีน้ำตาลอ่อน", bare: true },
  },
  bottom: {
    mage: { name: "กางเกงจอมเวท", body: "mageb", gender: "female", note: "กางเกงขายาว บูทหนัง ใส่กับเสื้อคลุมจอมเวทมีชายเสื้อคลุมยาวคลุมทับ" },
    priestess: { name: "กระโปรงยาวนักบวช", body: "priestess", gender: "female", note: "กระโปรงยาวถึงข้อเท้า ผ้าคาดหน้าตราอาทิตย์" },
    adventurer: { name: "กระโปรงจีบนักผจญภัย", body: "adventurer", gender: "female", note: "กระโปรงจีบสั้น เลกกิ้ง บูทผูกเชือกสูง" },
    warrior: { name: "กางเกงนักรบ", body: "warrior", gender: "male", note: "กางเกงขายาว บูทหนัง" },
    plain: { name: "กางเกงผ้าฝ้าย", body: "plainf", gender: "female", note: "กางเกงขายาวสีน้ำตาลเข้ม รองเท้าผ้า", bare: true },
    plain_m: { name: "กางเกงผ้าฝ้าย", body: "plainm", gender: "male", note: "กางเกงขายาวสีน้ำตาลเข้ม รองเท้าผ้า", bare: true },
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
  restore?: { hp?: number; mp?: number }; // potions: fraction of max HP / MP
  stats?: Partial<Record<string, number>>; // off-hand gear while held
  art?: OffhandArt;
  style?: string;                       // a hairstyle item: the hairstyle it teaches
  icon: { weapon?: WeaponId; sheet?: string; glyph?: string; color?: string; art?: string };
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

export const ITEMS: Record<string, Item> = {
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
  potion_red: potion("ยาแดง", { hp: 0.25 }, "#ff6a5a", 25, "ฟื้น HP 25% ของ HP สูงสุด"),
  potion_red_big: potion("ยาแดงเข้มข้น", { hp: 0.5 }, "#d8343a", 80, "ฟื้น HP 50% ของ HP สูงสุด"),
  potion_blue: potion("ยาฟ้า", { mp: 0.25 }, "#6ab4ff", 30, "ฟื้น MP 25% ของ MP สูงสุด"),
  potion_blue_big: potion("ยาฟ้าเข้มข้น", { mp: 0.5 }, "#2f6fd0", 90, "ฟื้น MP 50% ของ MP สูงสุด"),
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
};

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

export function isTwoHanded(id: string | null | undefined): boolean {
  const item = id ? ITEMS[id] : undefined;
  return item?.kind === "weapon" && !!WEAPON_TYPES[item.weapon!].twoHanded;
}

// The weapon held in the off hand, if any.
export function offhandWeapon(id: string | null | undefined): WeaponId | null {
  const item = id ? ITEMS[id] : undefined;
  return item?.kind === "weapon" ? item.weapon! : null;
}

export function stackLimit(id: string): number {
  return ITEMS[id]?.stack ?? 1;
}

// One line of stats for tooltips.
export function describe(id: string): string {
  const item = ITEMS[id];
  if (!item) return "";
  if (item.kind === "weapon") {
    const w = WEAPON_TYPES[item.weapon!];
    const reach = w.projectile ? w.projectile.range : w.reach;
    const hits = w.hits ? ` × ${w.hits}` : "";
    const hands = w.twoHanded ? "อาวุธสองมือ (ใช้มือรองด้วย)" : "มือเดียว · ใส่มือรองได้ (ตีซ้ำ 50%)";
    return `ดาเมจ ${w.damage[0]}–${w.damage[1]}${hits} · ระยะ ${(reach / 100).toFixed(1)} ม. · ตีทุก ${w.interval} วิ<br>${w.note}<br>${hands}`;
  }
  if (item.kind === "book" || item.kind === "style") return `${item.note}<br>ดับเบิลคลิกเพื่ออ่าน`;
  if (item.kind === "offhand") return `${item.note}<br>${statText(item.stats)}<br>ใส่มือรอง (ใช้กับอาวุธสองมือไม่ได้)`;
  if (GEAR_WHERE[item.kind]) return `${item.note}<br>${statText(item.stats)}<br>${GEAR_WHERE[item.kind]}`;
  if (item.kind === "potion") return `${item.note}<br>ดับเบิลคลิกเพื่อดื่ม (บอทดื่มเองได้)`;
  if (item.kind === "top" || item.kind === "bottom") {
    const sh = SHAPES[item.kind][item.shape!];
    return `${sh.note}<br>${sh.gender === "male" ? "สำหรับตัวละครชาย" : "สำหรับตัวละครหญิง"} · ใส่คู่กับ${item.kind === "top" ? "กางเกงหรือกระโปรง" : "เสื้อ"}ทรงไหนก็ได้`;
  }
  return item.note ?? "";
}

// Where a hat, shoes, ring or trinket goes.
const GEAR_WHERE: Partial<Record<ItemKind, string>> = { hat: "ใส่ช่องหมวก", shoes: "ใส่ช่องรองเท้า", ring: "ใส่ช่องแหวน (มี 2 ช่อง)", trinket: "ใส่ช่องประดับ (มี 2 ช่อง)" };

// A stat bag as the player reads it ("ป้องกัน +6 · ความเร็วเดิน +4%").
const STAT_WORDS: Record<string, string> = {
  def: "ป้องกัน", mdef: "ต้านเวท", atk: "พลังโจมตี", matk: "พลังเวท", maxHp: "HP สูงสุด", maxMp: "MP สูงสุด", maxHpPct: "HP สูงสุด",
  maxMpPct: "MP สูงสุด", move: "ความเร็วเดิน", potion: "ยาฟื้นแรงขึ้น", hpRegen: "ฟื้น HP/วิ", mpRegen: "ฟื้น MP/วิ", matkPct: "พลังเวท",
  cdr: "ลดคูลดาวน์", castRed: "ลดเวลาร่าย", hit: "ความแม่นยำ", flee: "หลบหลีก", crit: "โอกาสคริติคอล", critDmg: "แรงคริติคอล", drop: "โอกาสได้ของ", dmgRed: "ลดความเสียหาย",
};
const STAT_PCT = new Set(["maxHpPct", "maxMpPct", "move", "potion", "matkPct", "cdr", "castRed", "crit", "critDmg", "drop", "dmgRed"]);
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

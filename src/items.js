// Item and weapon tables.
//
// Every weapon type swings with one of the character's Oriverse attack clips (motion) and
// differs in reach, speed and damage. Distances are world centimetres, times are seconds.

export const MOTIONS = ["swing", "thrust", "shoot"];

export const WEAPON_TYPES = {
  sword_1h: {
    name: "ดาบมือเดียว", motion: "swing", reach: 125, arc: 110, interval: 0.62, damage: [18, 24],
    note: "ฟันเป็นแนวโค้งหน้าตัว",
  },
  sword_2h: {
    name: "ดาบสองมือ", motion: "swing", reach: 155, arc: 150, interval: 1.0, damage: [32, 42], knock: 60,
    note: "ฟันกว้าง ช้าแต่แรง",
  },
  axe: {
    name: "ขวาน", motion: "swing", reach: 120, arc: 95, interval: 0.82, damage: [26, 34], crit: 0.18,
    note: "โอกาสคริติคอลสูง",
  },
  mace: {
    name: "ค้อน", motion: "swing", reach: 110, arc: 90, interval: 0.9, damage: [28, 36], knock: 110,
    note: "กระแทกจนกระเด็น",
  },
  spear_1h: {
    name: "หอกมือเดียว", motion: "thrust", reach: 185, width: 46, interval: 0.7, damage: [20, 26],
    note: "แทงไกล",
  },
  spear_2h: {
    name: "หอกสองมือ", motion: "thrust", reach: 235, width: 56, interval: 1.0, damage: [30, 40], pierce: true,
    note: "แทงทะลุทุกตัวในแนว",
  },
  dagger: {
    name: "มีดสั้น", motion: "thrust", reach: 95, width: 40, interval: 0.4, damage: [11, 15], crit: 0.15,
    note: "แทงเร็ว",
  },
  dual_daggers: {
    name: "มีดคู่", motion: "thrust", reach: 95, width: 44, interval: 0.55, damage: [9, 12], hits: 2,
    note: "แทงสองครั้งต่อการโจมตี",
  },
  staff: {
    name: "ไม้เท้า", motion: "swing", interval: 1.1, damage: [26, 34],
    projectile: { kind: "bolt", speed: 900, range: 520, radius: 34 },
    note: "ยิงลูกเวทระยะกลาง",
  },
  bow: {
    name: "ธนู", motion: "shoot", interval: 0.9, damage: [16, 22],
    projectile: { kind: "arrow", speed: 1400, range: 780, radius: 26 },
    note: "ยิงไกลที่สุด",
  },
};

// Outfit dyes: tops recolour the coat, bottoms the skirt.
export const DYES = {
  white: { name: "ขาว", hue: null, sat: 0, light: 0 },
  sky: { name: "ฟ้า", hue: 205, sat: 0.55, light: -0.02 },
  rose: { name: "ชมพู", hue: 340, sat: 0.5, light: -0.02 },
  mint: { name: "เขียวมิ้นต์", hue: 150, sat: 0.42, light: -0.03 },
  lilac: { name: "ม่วง", hue: 270, sat: 0.4, light: -0.03 },
  black: { name: "ดำ", hue: null, sat: 0, light: 0 },
  navy: { name: "กรมท่า", hue: 225, sat: 0.55, light: 0.06 },
  wine: { name: "แดงไวน์", hue: 350, sat: 0.6, light: 0.06 },
  forest: { name: "เขียวเข้ม", hue: 140, sat: 0.45, light: 0.05 },
  cocoa: { name: "น้ำตาล", hue: 28, sat: 0.45, light: 0.08 },
};

const weapon = (type) => ({ kind: "weapon", weapon: type, name: WEAPON_TYPES[type].name, icon: { weapon: type } });
const top = (dye) => ({ kind: "top", dye, name: `เสื้อคลุม${DYES[dye].name}`, icon: { top: dye } });
const bottom = (dye) => ({ kind: "bottom", dye, name: `กระโปรง${DYES[dye].name}`, icon: { bottom: dye } });

export const ITEMS = {
  ...Object.fromEntries(Object.keys(WEAPON_TYPES).map((t) => [t, weapon(t)])),
  top_white: top("white"),
  top_sky: top("sky"),
  top_rose: top("rose"),
  top_mint: top("mint"),
  top_lilac: top("lilac"),
  bottom_black: bottom("black"),
  bottom_navy: bottom("navy"),
  bottom_wine: bottom("wine"),
  bottom_forest: bottom("forest"),
  bottom_cocoa: bottom("cocoa"),
  jelly: { kind: "material", name: "เยลลี่", stack: 99, icon: { sheet: "jelly" }, note: "หยดเยลลี่จากสไลม์" },
  sprout: { kind: "material", name: "ใบอ่อน", stack: 99, icon: { sheet: "sprout" }, note: "ใบไม้บนหัวสไลม์ หายาก" },
};

export const EQUIP_SLOTS = [
  { slot: "weapon", name: "อาวุธ" },
  { slot: "top", name: "เสื้อ" },
  { slot: "bottom", name: "กระโปรง" },
];

export function itemSlot(id) {
  const kind = ITEMS[id]?.kind;
  return kind === "weapon" || kind === "top" || kind === "bottom" ? kind : null;
}

export function stackLimit(id) {
  return ITEMS[id]?.stack ?? 1;
}

// One line of stats for tooltips.
export function describe(id) {
  const item = ITEMS[id];
  if (!item) return "";
  if (item.kind === "weapon") {
    const w = WEAPON_TYPES[item.weapon];
    const reach = w.projectile ? w.projectile.range : w.reach;
    const hits = w.hits ? ` × ${w.hits}` : "";
    return `ดาเมจ ${w.damage[0]}–${w.damage[1]}${hits} · ระยะ ${(reach / 100).toFixed(1)} ม. · ตีทุก ${w.interval} วิ<br>${w.note}`;
  }
  if (item.kind === "top" || item.kind === "bottom") return "ใส่แล้วเปลี่ยนสีชุด";
  return item.note ?? "";
}

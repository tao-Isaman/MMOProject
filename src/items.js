// Item and weapon tables.
//
// Every weapon type swings with one of the character's Oriverse attack clips (motion) and
// differs in reach, speed and damage. Distances are world centimetres, times are seconds.

export const MOTIONS = ["swing", "thrust", "shoot"];

// Swords and the bow use clips where Oriverse drew the weapon in (swing: a sword and its slash,
// shoot: a bow and arrow), so nothing is drawn over them (builtin). Every other weapon uses the
// empty-handed thrust clip with its art drawn into the hand; "chop" swings that art down from
// overhead instead of pointing it along the arm. hit: "arc" (in front) or "line" (straight ahead).

export const WEAPON_TYPES = {
  sword_1h: {
    name: "ดาบมือเดียว", motion: "swing", builtin: true, hit: "arc", reach: 125, arc: 110, interval: 0.62, damage: [18, 24],
    note: "ฟันเป็นแนวโค้งหน้าตัว",
  },
  sword_2h: {
    name: "ดาบสองมือ", motion: "swing", builtin: true, hit: "arc", reach: 155, arc: 150, interval: 1.0, damage: [32, 42], knock: 60,
    note: "ฟันกว้าง ช้าแต่แรง",
  },
  axe: {
    name: "ขวาน", motion: "thrust", chop: true, hit: "arc", reach: 120, arc: 95, interval: 0.82, damage: [26, 34], crit: 0.18,
    note: "โอกาสคริติคอลสูง",
  },
  mace: {
    name: "ค้อน", motion: "thrust", chop: true, hit: "arc", reach: 110, arc: 90, interval: 0.9, damage: [28, 36], knock: 110,
    note: "กระแทกจนกระเด็น",
  },
  spear_1h: {
    name: "หอกมือเดียว", motion: "thrust", hit: "line", reach: 185, width: 46, interval: 0.7, damage: [20, 26],
    note: "แทงไกล",
  },
  spear_2h: {
    name: "หอกสองมือ", motion: "thrust", hit: "line", reach: 235, width: 56, interval: 1.0, damage: [30, 40], pierce: true,
    note: "แทงทะลุทุกตัวในแนว",
  },
  dagger: {
    name: "มีดสั้น", motion: "thrust", hit: "line", reach: 95, width: 40, interval: 0.4, damage: [11, 15], crit: 0.15,
    note: "แทงเร็ว",
  },
  dual_daggers: {
    name: "มีดคู่", motion: "thrust", hit: "line", reach: 95, width: 44, interval: 0.55, damage: [9, 12], hits: 2,
    note: "แทงสองครั้งต่อการโจมตี",
  },
  staff: {
    name: "ไม้เท้า", motion: "thrust", interval: 1.1, damage: [26, 34],
    projectile: { kind: "bolt", speed: 900, range: 520, radius: 34 },
    note: "ยิงลูกเวทระยะกลาง",
  },
  bow: {
    name: "ธนู", motion: "shoot", builtin: true, interval: 0.9, damage: [16, 22],
    projectile: { kind: "arrow", speed: 1400, range: 780, radius: 26 },
    note: "ยิงไกลที่สุด",
  },
};

// Dyes. On a body region a dye keeps each pixel's shading and moves the region to its hue,
// saturation and average lightness (target). A dye on the region it was drawn in (the region's
// "natural" dye, e.g. white on the mage coat) leaves it untouched.
export const DYES = {
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

// Costumes pick the body shape (each one is its own Oriverse sprite) and its colours: top and
// bottom are the body's two main cloth regions (bodies.json says which ones). An equipped
// top or bottom item dyes over the costume.
export const COSTUMES = {
  mage: { name: "ชุดจอมเวท", body: "mage", top: null, bottom: null, note: "เสื้อคลุมขาวขลิบทอง มาพร้อมผมทวินเทล" },
  priestess_navy: { name: "ชุดนักบวชกรมท่า", body: "priestess", top: null, bottom: null, note: "เสื้อคลุมยาวกับผ้าคาดหน้า" },
  priestess_wine: { name: "ชุดนักบวชแดงไวน์", body: "priestess", top: "wine", bottom: null },
  priestess_forest: { name: "ชุดนักบวชป่าลึก", body: "priestess", top: "forest", bottom: "sand" },
  priestess_black: { name: "ชุดนักบวชรัตติกาล", body: "priestess", top: "black", bottom: "lilac" },
  priestess_white: { name: "ชุดนักบวชหิมะ", body: "priestess", top: "white", bottom: "sky" },
  adventurer_red: { name: "ชุดนักผจญภัย", body: "adventurer", top: null, bottom: null, note: "เสื้อกั๊กหนัง สายสะพาย ผ้าพันแขน" },
  adventurer_navy: { name: "ชุดนักผจญภัยทะเล", body: "adventurer", top: "navy", bottom: "sand" },
  adventurer_teal: { name: "ชุดพรานป่า", body: "adventurer", top: "teal", bottom: "cocoa" },
  adventurer_plum: { name: "ชุดนักผจญภัยพลบค่ำ", body: "adventurer", top: "plum", bottom: "black" },
  adventurer_ochre: { name: "ชุดนักผจญภัยทะเลทราย", body: "adventurer", top: "ochre", bottom: "wine" },
};

const weapon = (type) => ({ kind: "weapon", weapon: type, name: WEAPON_TYPES[type].name, icon: { weapon: type } });
const top = (dye) => ({ kind: "top", dye, name: `เสื้อสี${DYES[dye].name}`, icon: { top: dye } });
const bottom = (dye) => ({ kind: "bottom", dye, name: `กางเกงสี${DYES[dye].name}`, icon: { bottom: dye } });
const costume = (id) => ({ kind: "costume", costume: id, name: COSTUMES[id].name, icon: { costume: id } });

export const ITEMS = {
  ...Object.fromEntries(Object.keys(WEAPON_TYPES).map((t) => [t, weapon(t)])),
  ...Object.fromEntries(Object.keys(COSTUMES).map((c) => [`costume_${c}`, costume(c)])),
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
  { slot: "costume", name: "ชุด" },
  { slot: "top", name: "เสื้อ" },
  { slot: "bottom", name: "กางเกง" },
];

export function itemSlot(id) {
  const kind = ITEMS[id]?.kind;
  return kind === "weapon" || kind === "costume" || kind === "top" || kind === "bottom" ? kind : null;
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
  if (item.kind === "costume") {
    const c = COSTUMES[item.costume];
    return `${c.note ? `${c.note}<br>` : ""}ตัวละครชายใส่แล้วได้สีของชุด`;
  }
  if (item.kind === "top") return "ย้อมท่อนบนของชุดที่ใส่อยู่<br>ถอดออกเพื่อกลับเป็นสีของชุด";
  if (item.kind === "bottom") return "ย้อมท่อนล่างของชุดที่ใส่อยู่<br>ถอดออกเพื่อกลับเป็นสีของชุด";
  return item.note ?? "";
}

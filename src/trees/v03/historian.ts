// The historian's branches (third job, from any second job): the naturalist and the
// archaeologist. A historian may have been anything before, so nothing here asks for a weapon and
// every blow is on attack and magic attack together (stat "both"). The naturalist knows where a
// monster is weak: a pin that opens it up, spores that weaken and blind a crowd, field notes
// that make every blow on the kinds they cover land harder (the monster races, <race>Dmg) for
// three minutes, and more drops from what falls. The archaeologist
// knows the land (src/terrain.ts): a passive and two buffs whose stats change with the kind of map
// underfoot (the ruins most of all), the land's own element to guard with and the one its
// monsters don't guard against to hit with, a dig, a quicksand pit and an ancient inscription
// that falls from the sky; and an eye for old things that buys cheap and sells dear. The field
// notes and the land buffs last three minutes (a party will share them later), on short
// cooldowns. Seven skills a branch, two of them passives: both work through what they do
// (pins, spores, notes, digs, readings of the land), not through a way of being.
import type { StatBag, TerrainKind, Tree } from "../../progression";
import { pct, lin } from "../util";

const n1 = (v: number) => +v.toFixed(1);

// The same stats on several kinds of map (the archaeologist's lands come in pairs).
function lands(groups: [TerrainKind[], StatBag][]): Partial<Record<TerrainKind, StatBag>> {
  const out: Partial<Record<TerrainKind, StatBag>> = {};
  for (const [kinds, stats] of groups) for (const k of kinds) out[k] = { ...stats };
  return out;
}

// What the archaeologist reads in each land: the element its monsters are made of (to guard with)
// and one they don't guard against (to hit with), in the words the description uses.
const LAND_ELEMENTS: [TerrainKind, string, string, string][] = [
  ["grassland", "ทุ่งหญ้า", "fire", "wind"],
  ["forest", "ป่า", "fire", "plant"],
  ["jungle", "ป่าดิบ", "lightning", "mud"],
  ["snow", "หิมะ", "fire", "ice"],
  ["desert", "ทะเลทราย", "water", "earth"],
  ["coast", "ชายฝั่ง", "lightning", "water"],
  ["volcano", "ภูเขาไฟ", "ice", "lava"],
  ["ruins", "ซากโบราณ", "light", "dark"],
  ["mountain", "ภูเขา", "wind", "stone"],
];
const ELEMENT_WORDS: Record<string, string> = {
  fire: "ไฟ", wind: "ลม", plant: "พืช", lightning: "สายฟ้า", mud: "โคลน", ice: "น้ำแข็ง", water: "น้ำ", earth: "ดิน", lava: "ลาวา",
  light: "แสง", dark: "ความมืด", stone: "หิน",
};

export const HISTORIAN_TREES: Record<string, Tree> = {
  // ---- the naturalist: weak spots, weakening spores, field notes on the monster kinds, drops ----
  historian_nature: {
    name: "ธรรมชาติวิทยา", cls: null, job3: "historian", color: "#a8d890", glyph: "leaf",
    note: "นักธรรมชาติวิทยา ปักหมุดจุดอ่อนให้ศัตรูรับดาเมจเพิ่ม โปรยสปอร์ให้ศัตรูตีเบาลงและตาพร่า จดบันทึกสัตว์ป่าและสิ่งเร้นลับจนตีมอนสเตอร์เผ่านั้นแรงขึ้นนาน 3 นาที ตีศัตรูที่ติดสถานะแรงขึ้นและได้ของดรอปมากขึ้น ใช้ได้กับทุกอาวุธ สกิลใช้ทั้งพลังโจมตีและพลังเวท",
    nodes: [
      { id: "historian_nature_collector", name: "นักสะสมตัวอย่าง", kind: "passive", max: 10, pos: [0, 0], glyph: "bag",
        stats: (r) => ({ drop: 0.025 * r, huntDmg: 0.015 * r }),
        desc: (r) => `โอกาสได้ของ +${pct(0.025 * r)} ดาเมจใส่ศัตรูที่ติดสถานะ +${pct(0.015 * r)}` },
      { id: "historian_nature_pin", name: "ปักหมุดจุดอ่อน", kind: "active", max: 10, pos: [1, 0], glyph: "pierce",
        skill: { type: "bolt", stat: "both", mult: lin(2.0, 0.2), expose: (r) => 0.08 + 0.012 * r, debuff: 9, mp: 14, cd: 5, motion: "cast", speed: 1000, range: 620, radius: 30, color: "#c8f0a8" },
        desc: (r) => `ปักหมุดใส่จุดอ่อนของตัวที่ล็อกไว้ ${pct(lin(2.0, 0.2)(r))} ของพลังโจมตีและพลังเวท เป้ารับดาเมจเพิ่ม ${pct(0.08 + 0.012 * r)} 9 วิ` },
      { id: "historian_nature_spores", name: "ละอองสปอร์", kind: "active", max: 10, pos: [2, 0], glyph: "cloud",
        skill: { type: "blast", stat: "both", mult: lin(1.1, 0.11), hits: 2, every: 0.5, weaken: (r) => 0.1 + 0.015 * r, blind: (r) => 3 + 0.3 * r, debuff: 12,
          mp: 18, cd: 8, motion: "cast", range: 520, radius: 200, delay: 0.2, color: "#b8e070" },
        desc: (r) => `โปรยละอองสปอร์ลงจุดที่เล็ง รัศมี 2 ม. 2 ครั้ง ครั้งละ ${pct(lin(1.1, 0.11)(r))} ของพลังโจมตีและพลังเวท ศัตรูตีเบาลง ${pct(0.1 + 0.015 * r)} 12 วิ ตาพร่า ${n1(3 + 0.3 * r)} วิ (กัดพลาดครึ่งหนึ่ง)` },
      { id: "historian_nature_bestiary", name: "บันทึกสัตว์ป่า", kind: "active", max: 5, pos: [0, 1], req: [["historian_nature_collector", 3]], glyph: "paw",
        skill: { type: "buff", mp: 30, cd: 20, motion: "cast", duration: 180, color: "#c0e098",
          buff: (r) => { const v = 0.05 + 0.03 * r; return { bruteDmg: v, insectDmg: v, fishDmg: v, plantDmg: v }; } },
        desc: (r) => `3 นาที: ดาเมจใส่สัตว์ แมลง สัตว์น้ำ และพืช +${pct(0.05 + 0.03 * r)}` },
      { id: "historian_nature_occult", name: "บันทึกสิ่งเร้นลับ", kind: "active", max: 5, pos: [2, 1], req: [["historian_nature_spores", 3]], glyph: "horns",
        skill: { type: "buff", mp: 30, cd: 20, motion: "cast", duration: 180, color: "#b8a0d8",
          buff: (r) => { const v = 0.05 + 0.03 * r; return { undeadDmg: v, demonDmg: v, formlessDmg: v, dragonDmg: v, angelDmg: v }; } },
        desc: (r) => `3 นาที: ดาเมจใส่อันเดด ปีศาจ ไร้รูป มังกร และเทวะ +${pct(0.05 + 0.03 * r)}` },
      { id: "historian_nature_anatomy", name: "ตำรากายวิภาค", kind: "passive", max: 10, pos: [3, 1], req: [["historian_nature_spores", 3]], glyph: "target",
        stats: (r) => ({ crit: 0.004 * r, critDmg: 0.015 * r }),
        desc: (r) => `โอกาสคริติคอล +${pct(0.004 * r)} แรงคริติคอล +${pct(0.015 * r)}` },
      { id: "historian_nature_fang", name: "เขี้ยวดึกดำบรรพ์", kind: "active", max: 5, pos: [1, 2], req: [["historian_nature_pin", 5], ["historian_nature_bestiary", 1]], glyph: "dragon",
        skill: { type: "bolt", stat: "both", mult: lin(5.2, 0.65), expose: (r) => 0.1 + 0.02 * r, weaken: (r) => 0.1 + 0.02 * r, debuff: 12, mp: 48, cd: 15, motion: "cast",
          speed: 1100, range: 650, radius: 40, combo: { after: ["historian_nature_pin"], within: 4, more: () => 0.35 }, color: "#e8f0c0" },
        desc: (r) => `ปล่อยวิญญาณสัตว์ดึกดำบรรพ์ขย้ำตัวที่ล็อกไว้ ${pct(lin(5.2, 0.65)(r))} ของพลังโจมตีและพลังเวท เป้ารับดาเมจเพิ่ม ${pct(0.1 + 0.02 * r)} และตีเบาลง ${pct(0.1 + 0.02 * r)} 12 วิ ใช้ต่อจากปักหมุดจุดอ่อนภายใน 4 วิ แรงขึ้น 35%` },
    ],
  },
  // ---- the archaeologist: the land underfoot, old things, an inscription from the past ----
  historian_archaeo: {
    name: "โบราณคดี", cls: null, job3: "historian", color: "#d8c08a", glyph: "scroll",
    note: "นักโบราณคดี รู้จักทุกดินแดน ติดตัวและบัฟให้ค่าต่างกันตามชนิดพื้นที่ที่ยืน (ซากโบราณได้มากที่สุด) ป้องกันด้วยธาตุของแผ่นดินและตีด้วยธาตุที่มอนสเตอร์แถวนั้นไม่ทน ขุด ขุดหลุมทรายดูด แล้วปิดท้ายด้วยศิลาจารึกที่ตกจากฟ้า ตาถึงของเก่าจนซื้อของถูกขายได้ราคา ใช้ได้กับทุกอาวุธ สกิลใช้ทั้งพลังโจมตีและพลังเวท",
    nodes: [
      { id: "historian_archaeo_appraise", name: "ตาประเมินของเก่า", kind: "passive", max: 10, pos: [0, 0], glyph: "coin",
        stats: (r) => ({ buyDisc: 0.02 * r, sellBonus: 0.03 * r }),
        desc: (r) => `ซื้อของจากร้านค้า NPC ถูกลง ${pct(0.02 * r)} ขายของให้ร้านค้า NPC ได้ราคาเพิ่ม ${pct(0.03 * r)}` },
      { id: "historian_archaeo_pick", name: "จอบขุดค้น", kind: "active", max: 10, pos: [1, 0], glyph: "earth",
        skill: { type: "cone", stat: "both", mult: lin(2.0, 0.2), mp: 14, cd: 4, motion: "swing", reach: 180, arc: 110, color: "#e0c890" },
        desc: (r) => `ฟาดจอบขุดค้นด้านหน้า 1.8 ม. ${pct(lin(2.0, 0.2)(r))} ของพลังโจมตีและพลังเวท` },
      { id: "historian_archaeo_survey", name: "อ่านภูมิประเทศ", kind: "active", max: 5, pos: [2, 0], glyph: "eye",
        skill: { type: "buff", mp: 30, cd: 30, motion: "cast", duration: 180, color: "#e8d090",
          buff: (r) => ({ atkPct: 0.02 * r, matkPct: 0.02 * r }),
          terrain: (r) => lands([
            [["ruins"], { atkPct: 0.02 * r, matkPct: 0.02 * r }],
            [["grassland", "coast"], { aspd: 0.016 * r, castRed: 0.016 * r }],
            [["forest", "jungle"], { cdr: 0.016 * r }],
            [["snow", "mountain"], { pierce: 0.03 * r }],
            [["desert", "volcano"], { dmg: 0.02 * r }],
          ]) },
        desc: (r) => `3 นาที: พลังโจมตีและพลังเวท +${pct(0.02 * r)} และตามพื้นที่ที่ยืน: ซากโบราณ พลังโจมตีและพลังเวทอีก +${pct(0.02 * r)}`
          + ` · ทุ่งหญ้าและชายฝั่ง ความเร็วโจมตี +${pct(0.016 * r)} ลดเวลาร่าย ${pct(0.016 * r)} · ป่าและป่าดิบ ลดคูลดาวน์ ${pct(0.016 * r)}`
          + ` · หิมะและภูเขา เจาะเกราะ +${pct(0.03 * r)} · ทะเลทรายและภูเขาไฟ ดาเมจ +${pct(0.02 * r)}` },
      { id: "historian_archaeo_scout", name: "เท้านักสำรวจ", kind: "passive", max: 5, pos: [3, 0], glyph: "shoes",
        stats: (r) => ({ maxHpPct: 0.012 * r }),
        terrain: (r) => lands([
          [["town"], { buyDisc: 0.01 * r, sellBonus: 0.02 * r }],
          [["grassland", "coast"], { move: 0.012 * r, flee: 2 * r }],
          [["forest", "jungle"], { hpRegen: 1.5 * r, statusRes: 0.015 * r }],
          [["snow", "mountain"], { defPct: 0.03 * r }],
          [["desert", "volcano"], { mdefPct: 0.03 * r }],
          [["ruins"], { dmgRed: 0.01 * r }],
        ]),
        desc: (r) => `HP สูงสุด +${pct(0.012 * r)} และตามพื้นที่ที่ยืน: ในเมือง ซื้อของถูกลงอีก ${pct(0.01 * r)} ขายได้ราคาเพิ่มอีก ${pct(0.02 * r)}`
          + ` · ทุ่งหญ้าและชายฝั่ง ความเร็วเดิน +${pct(0.012 * r)} หลบหลีก +${2 * r} · ป่าและป่าดิบ ฟื้น HP +${n1(1.5 * r)}/วิ ต้านสถานะ +${pct(0.015 * r)}`
          + ` · หิมะและภูเขา ป้องกัน +${pct(0.03 * r)} · ทะเลทรายและภูเขาไฟ ต้านเวท +${pct(0.03 * r)} · ซากโบราณ ลดความเสียหาย ${pct(0.01 * r)}` },
      { id: "historian_archaeo_quicksand", name: "หลุมทรายดูด", kind: "active", max: 10, pos: [1, 1], req: [["historian_archaeo_pick", 4]], glyph: "swirl",
        skill: { type: "blast", stat: "both", mult: lin(1.0, 0.1), hits: 3, every: 0.5, slow: (r) => 3 + 0.3 * r, mp: 20, cd: 8, motion: "cast", range: 500, radius: 200, delay: 0.2, color: "#d8b878" },
        desc: (r) => `ขุดหลุมทรายดูดตรงจุดที่เล็ง รัศมี 2 ม. ดูด 3 ครั้ง ครั้งละ ${pct(lin(1.0, 0.1)(r))} ของพลังโจมตีและพลังเวท ศัตรูช้าลง ${n1(3 + 0.3 * r)} วิ` },
      { id: "historian_archaeo_wisdom", name: "ภูมิปัญญาท้องถิ่น", kind: "active", max: 5, pos: [2, 1], req: [["historian_archaeo_survey", 3]], glyph: "scroll",
        skill: { type: "buff", mp: 26, cd: 30, motion: "cast", duration: 180, color: "#c8b080",
          terrain: (r) => Object.fromEntries(LAND_ELEMENTS.map(([kind, , hit, guard]) => [kind, { [`${hit}Atk`]: 12 * r, [`${guard}Def`]: 10 * r }])) },
        desc: (r) => `3 นาที: พลังโจมตีธาตุที่มอนสเตอร์แถวนั้นไม่ทน +${12 * r} และป้องกันธาตุของแผ่นดิน +${10 * r} ตามพื้นที่ที่ยืน (โจมตี/ป้องกัน): `
          + LAND_ELEMENTS.map(([, words, hit, guard]) => `${words} ${ELEMENT_WORDS[hit]}/${ELEMENT_WORDS[guard]}`).join(" · ") + " (ในเมืองไม่มีผล)" },
      { id: "historian_archaeo_epoch", name: "จารึกแห่งกาลเวลา", kind: "active", max: 5, pos: [1, 2], req: [["historian_archaeo_quicksand", 5], ["historian_archaeo_wisdom", 1]], glyph: "letter",
        skill: { type: "blast", stat: "both", mult: lin(5.0, 0.62), stun: () => 1.5, mp: 50, cd: 16, motion: "cast", range: 520, radius: 220, delay: 0.5,
          combo: { after: ["historian_archaeo_quicksand"], within: 4, more: () => 0.3 }, color: "#f0dca0" },
        desc: (r) => `ศิลาจารึกยักษ์จากอดีตตกลงจุดที่เล็ง รัศมี 2.2 ม. ${pct(lin(5.0, 0.62)(r))} ของพลังโจมตีและพลังเวท มึน 1.5 วิ ใช้ต่อจากหลุมทรายดูดภายใน 4 วิ แรงขึ้น 30%` },
    ],
  },
};

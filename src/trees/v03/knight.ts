// The knight's branches (third job, from the swordsman, the warlord or the mercenary): the lance
// (spears, many at a time, a long life), the blade (swords, quick hands and feet, chains of
// cuts) and the axe (axes, through the armour, heavy criticals, a sunder-crush-execute chain).
// Nine skills a branch (four of them passives), a little stronger than the second jobs'. The model for the other
// third-job trees: the new riders show here as data (combo, manaBurn, hits on a nova).
import type { Need, Tree } from "../../progression";
import { pct, lin } from "../util";

const SPEARS: Need = { weapons: ["spear_1h", "spear_2h"] };
const SWORDS: Need = { weapons: ["sword_1h", "sword_2h"] };
const AXES: Need = { weapons: ["axe", "axe_2h"] };
const n1 = (v: number) => +v.toFixed(1);

export const KNIGHT_TREES: Record<string, Tree> = {
  // ---- the lance: sweeps that reach many, a body that lasts, a spear that breaks spells ----
  knight_lance: {
    name: "หอกต่อสู้", cls: null, job3: "knight", color: "#a8c4f0", glyph: "pierce",
    note: "ถือหอกยาวหรือหอกมือเดียว กวาดศัตรูทีละหลายตัว HP สูงและฟื้นตัวเร็ว ยืนแนวหน้าได้นาน หอกทะลวงเวทเผามานาพวกร่ายเวทจนร่ายไม่ได้",
    nodes: [
      { id: "knight_lance_vigor", name: "หัวใจอัศวิน", kind: "passive", max: 10, pos: [0, 0], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.016 * r, hpRegen: 0.8 * r }),
        desc: (r) => `HP สูงสุด +${pct(0.016 * r)} ฟื้น HP +${n1(0.8 * r)}/วิ` },
      { id: "knight_lance_sweep", name: "กวาดหอก", kind: "active", max: 10, pos: [1, 0], glyph: "fan", need: SPEARS,
        skill: { type: "cone", stat: "atk", mult: lin(2.0, 0.2), mp: 14, cd: 4, motion: "swing", reach: 240, arc: 150, color: "#d0e2ff" },
        desc: (r) => `กวาดหอกเป็นวงกว้างด้านหน้า 2.4 ม. ${pct(lin(2.0, 0.2)(r))} ของพลังโจมตี ใช้ได้เมื่อถือหอก` },
      { id: "knight_lance_spellbreak", name: "หอกทะลวงเวท", kind: "active", max: 10, pos: [2, 0], glyph: "bolt", need: SPEARS,
        skill: { type: "cone", stat: "atk", mult: lin(2.2, 0.22), manaBurn: lin(0.3, 0.04), silence: 4.5, mp: 16, cd: 6, motion: "thrust", reach: 230, arc: 40, color: "#b8c8ff" },
        desc: (r) => `แทงตัวที่ล็อกไว้ ${pct(lin(2.2, 0.22)(r))} ของพลังโจมตี ใส่พวกร่ายเวทแรงขึ้นอีก ${pct(lin(0.3, 0.04)(r))} และตัวที่โดนร่ายเวทหรือยิงไม่ได้ 4.5 วิ ใช้ได้เมื่อถือหอก` },
      { id: "knight_lance_bulwark", name: "ร่างเหล็ก", kind: "passive", max: 5, pos: [0, 1], req: [["knight_lance_vigor", 3]], glyph: "shield",
        stats: (r) => ({ defPct: 0.03 * r, dmgRed: 0.008 * r }),
        desc: (r) => `ป้องกัน +${pct(0.03 * r)} ลดความเสียหาย ${pct(0.008 * r)}` },
      { id: "knight_lance_whirl", name: "พายุหอกหมุน", kind: "active", max: 10, pos: [1, 1], req: [["knight_lance_sweep", 4]], glyph: "spin", need: SPEARS,
        skill: { type: "nova", stat: "atk", mult: lin(1.15, 0.115), hits: 2, mp: 22, cd: 6, motion: "swing", radius: 260, color: "#c0d8ff" },
        desc: (r) => `หมุนหอกรอบตัว 2.6 ม. 2 รอบ รอบละ ${pct(lin(1.15, 0.115)(r))} ของพลังโจมตี ใช้ได้เมื่อถือหอก` },
      { id: "knight_lance_oath", name: "ปณิธานอัศวิน", kind: "active", max: 5, pos: [2, 1], req: [["knight_lance_spellbreak", 3]], glyph: "up",
        skill: { type: "buff", mp: 30, cd: 40, motion: "cast", duration: 30, buff: (r) => ({ maxHpPct: 0.08 + 0.02 * r, hpRegen: 4 + 2 * r, mdefPct: 0.05 + 0.02 * r }), color: "#e0e8ff" },
        desc: (r) => `30 วิ: HP สูงสุด +${pct(0.08 + 0.02 * r)} ฟื้น HP +${4 + 2 * r}/วิ ต้านเวท +${pct(0.05 + 0.02 * r)}` },
      { id: "knight_lance_skyfall", name: "หอกสวรรค์ทลายทัพ", kind: "active", max: 5, pos: [1, 2], req: [["knight_lance_whirl", 5], ["knight_lance_oath", 1]], glyph: "burst", need: SPEARS,
        skill: { type: "blast", stat: "atk", mult: lin(1.9, 0.24), hits: 3, every: 0.25, mp: 48, cd: 16, motion: "thrust", range: 450, radius: 230,
          combo: { after: ["knight_lance_whirl"], within: 4, more: () => 0.3 }, color: "#e8f0ff" },
        desc: (r) => `พุ่งหอกลงจุดที่เล็ง รัศมี 2.3 ม. 3 ครั้ง ครั้งละ ${pct(lin(1.9, 0.24)(r))} ของพลังโจมตี ใช้ต่อจากพายุหอกหมุนภายใน 4 วิ แรงขึ้น 30% ใช้ได้เมื่อถือหอก` },
      { id: "knight_lance_steadfast", name: "ใจมั่นไม่หวั่นเวท", kind: "passive", max: 10, pos: [0, 2], req: [["knight_lance_bulwark", 3]], glyph: "ring",
        stats: (r) => ({ statusRes: 0.015 * r, mdefPct: 0.015 * r }),
        desc: (r) => `ต้านสถานะ +${pct(0.015 * r)} ต้านเวท +${pct(0.015 * r)}` },
      { id: "knight_lance_reach", name: "ปลายหอกพิทักษ์", kind: "passive", max: 5, pos: [2, 2], req: [["knight_lance_spellbreak", 3]], glyph: "pierce", need: SPEARS,
        stats: (r) => ({ reach: 0.03 * r, counter: 0.02 * r }),
        desc: (r) => `ระยะตีปกติ +${pct(0.03 * r)} ศัตรูที่ตีโดนเราจากระยะประชิด (ราว 2 ม.) มีโอกาส ${pct(0.02 * r)} โดนสวนกลับทันที 150% ของพลังโจมตี เมื่อถือหอก` },
    ],
  },
  // ---- the blade: fast hands, fast feet, cuts that chain ----
  knight_blade: {
    name: "ดาบฟาดฟัน", cls: null, job3: "knight", color: "#ffd8a0", glyph: "sword",
    note: "ถือดาบมือเดียวหรือดาบสองมือ ฟันเร็วหลายจังหวะ เพิ่มความเร็วโจมตีและความเร็วเดิน กระบวนท่าแรงขึ้นเมื่อใช้ต่อกัน: ฟันสามจังหวะหรือพุ่งดาบ → ฟันตามจังหวะ → ดาบอัศวินพันคม",
    nodes: [
      { id: "knight_blade_stride", name: "ฝีเท้าอัศวิน", kind: "passive", max: 10, pos: [0, 0], glyph: "dash", need: SWORDS,
        stats: (r) => ({ move: 0.008 * r, aspd: 0.01 * r }),
        desc: (r) => `ความเร็วเดิน +${pct(0.008 * r)} ความเร็วโจมตี +${pct(0.01 * r)} เมื่อถือดาบ` },
      { id: "knight_blade_triple", name: "ฟันสามจังหวะ", kind: "active", max: 10, pos: [1, 0], glyph: "storm", need: SWORDS,
        skill: { type: "cone", stat: "atk", mult: lin(0.8, 0.08), hits: 3, mp: 14, cd: 4, motion: "swing", reach: 170, arc: 100, color: "#ffe8c0" },
        desc: (r) => `ฟันด้านหน้า 1.7 ม. 3 ครั้งรวด ครั้งละ ${pct(lin(0.8, 0.08)(r))} ของพลังโจมตี ใช้ได้เมื่อถือดาบ` },
      { id: "knight_blade_charge", name: "พุ่งดาบ", kind: "active", max: 10, pos: [2, 0], glyph: "dash", need: SWORDS,
        skill: { type: "dash", stat: "atk", mult: lin(1.9, 0.19), mp: 16, cd: 7, motion: "thrust", distance: 320, width: 80, color: "#ffd8a0" },
        desc: (r) => `พุ่งไปข้างหน้า 3.2 ม. ฟันทุกตัวที่ผ่าน ${pct(lin(1.9, 0.19)(r))} ของพลังโจมตี ใช้ได้เมื่อถือดาบ` },
      { id: "knight_blade_tempo", name: "จังหวะดาบ", kind: "passive", max: 5, pos: [0, 1], req: [["knight_blade_stride", 3]], glyph: "up", need: SWORDS,
        stats: (r) => ({ aspd: 0.02 * r, crit: 0.005 * r }),
        desc: (r) => `ความเร็วโจมตี +${pct(0.02 * r)} โอกาสคริติคอล +${pct(0.005 * r)} เมื่อถือดาบ` },
      { id: "knight_blade_follow", name: "ฟันตามจังหวะ", kind: "active", max: 10, pos: [1, 1], req: [["knight_blade_triple", 4]], glyph: "twin", need: SWORDS,
        skill: { type: "cone", stat: "atk", mult: lin(1.25, 0.125), hits: 2, mp: 18, cd: 5, motion: "swing", reach: 180, arc: 50,
          combo: { after: ["knight_blade_triple", "knight_blade_charge"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#fff0d0" },
        desc: (r) => `ฟันตัวที่ล็อกไว้ 2 ครั้ง ครั้งละ ${pct(lin(1.25, 0.125)(r))} ของพลังโจมตี ใช้ต่อจากฟันสามจังหวะหรือพุ่งดาบภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือดาบ` },
      { id: "knight_blade_haste", name: "เร่งศึก", kind: "active", max: 5, pos: [2, 1], req: [["knight_blade_charge", 3]], glyph: "wing", need: SWORDS,
        skill: { type: "buff", mp: 28, cd: 35, motion: "swing", duration: 23, buff: (r) => ({ aspd: 0.1 + 0.025 * r, move: 0.08 + 0.02 * r }), color: "#ffe0a0" },
        desc: (r) => `23 วิ: ความเร็วโจมตี +${pct(0.1 + 0.025 * r)} ความเร็วเดิน +${pct(0.08 + 0.02 * r)} ใช้ได้เมื่อถือดาบ` },
      { id: "knight_blade_myriad", name: "ดาบอัศวินพันคม", kind: "active", max: 5, pos: [1, 2], req: [["knight_blade_follow", 5], ["knight_blade_haste", 1]], glyph: "star", need: SWORDS,
        skill: { type: "cone", stat: "atk", mult: lin(1.0, 0.13), hits: 5, mp: 45, cd: 16, motion: "swing", reach: 200, arc: 60,
          combo: { after: ["knight_blade_follow"], within: 3, more: () => 0.3 }, color: "#fff4e0" },
        desc: (r) => `ฟันรัว 5 ครั้งใส่ศัตรูด้านหน้า 2 ม. ครั้งละ ${pct(lin(1.0, 0.13)(r))} ของพลังโจมตี ใช้ต่อจากฟันตามจังหวะภายใน 3 วิ แรงขึ้น 30% ใช้ได้เมื่อถือดาบ` },
      { id: "knight_blade_parry", name: "ปัดป้องคมดาบ", kind: "passive", max: 5, pos: [0, 2], req: [["knight_blade_tempo", 3]], glyph: "sword", need: SWORDS,
        stats: (r) => ({ flee: 3 * r, counter: 0.015 * r }),
        desc: (r) => `หลบหลีก +${3 * r} ศัตรูที่ตีโดนเราจากระยะประชิด (ราว 2 ม.) มีโอกาส ${pct(0.015 * r)} โดนสวนกลับทันที 150% ของพลังโจมตี เมื่อถือดาบ` },
      { id: "knight_blade_flow", name: "สายธารกระบวนท่า", kind: "passive", max: 10, pos: [2, 2], req: [["knight_blade_haste", 1]], glyph: "wave", need: SWORDS,
        stats: (r) => ({ cdr: 0.006 * r, mpRegen: n1(0.2 * r) }),
        desc: (r) => `ลดคูลดาวน์ ${pct(0.006 * r)} ฟื้น MP +${n1(0.2 * r)}/วิ เมื่อถือดาบ` },
    ],
  },
  // ---- the axe: open the armour, crush, execute ----
  knight_axe: {
    name: "ขวานบุกทะลวง", cls: null, job3: "knight", color: "#ffa47a", glyph: "bash",
    note: "ถือขวานหรือขวานสองมือ ทะลุเกราะ คริติคอลแรง ผ่าเกราะให้ศัตรูรับดาเมจเพิ่ม แล้วต่อด้วยทุบทะลวงเกราะและขวานประหารที่แรงขึ้นเมื่อใช้ต่อกัน",
    nodes: [
      { id: "knight_axe_edge", name: "คมขวานผ่าเกราะ", kind: "passive", max: 10, pos: [0, 0], glyph: "up", need: AXES,
        stats: (r) => ({ pierce: 0.012 * r, critDmg: 0.025 * r }),
        desc: (r) => `เจาะเกราะ +${pct(0.012 * r)} แรงคริติคอล +${pct(0.025 * r)} เมื่อถือขวาน` },
      { id: "knight_axe_sunder", name: "ผ่าเกราะ", kind: "active", max: 10, pos: [1, 0], glyph: "pierce", need: AXES,
        skill: { type: "cone", stat: "atk", mult: lin(2.1, 0.21), expose: (r) => 0.08 + 0.012 * r, debuff: 9, mp: 14, cd: 5, motion: "swing", reach: 170, arc: 50, color: "#ffc0a0" },
        desc: (r) => `ผ่าเกราะตัวที่ล็อกไว้ ${pct(lin(2.1, 0.21)(r))} ของพลังโจมตี เป้ารับดาเมจเพิ่ม ${pct(0.08 + 0.012 * r)} 9 วิ ใช้ได้เมื่อถือขวาน` },
      { id: "knight_axe_whirl", name: "ขวานหมุนพายุ", kind: "active", max: 10, pos: [2, 0], glyph: "spin", need: AXES,
        skill: { type: "nova", stat: "atk", mult: lin(1.9, 0.19), mp: 18, cd: 6, motion: "swing", radius: 230, color: "#ffb090" },
        desc: (r) => `เหวี่ยงขวานรอบตัว 2.3 ม. ${pct(lin(1.9, 0.19)(r))} ของพลังโจมตี ใช้ได้เมื่อถือขวาน` },
      { id: "knight_axe_instinct", name: "สัญชาตญาณนักล่าหัว", kind: "passive", max: 5, pos: [0, 1], req: [["knight_axe_edge", 3]], glyph: "eye", need: AXES,
        stats: (r) => ({ crit: 0.008 * r, critDmg: 0.04 * r }),
        desc: (r) => `โอกาสคริติคอล +${pct(0.008 * r)} แรงคริติคอล +${pct(0.04 * r)} เมื่อถือขวาน` },
      { id: "knight_axe_crush", name: "ทุบทะลวงเกราะ", kind: "active", max: 10, pos: [1, 1], req: [["knight_axe_sunder", 4]], glyph: "slam", need: AXES,
        skill: { type: "cone", stat: "atk", mult: lin(2.4, 0.24), stun: () => 0.5, mp: 20, cd: 6, motion: "swing", reach: 180, arc: 40,
          combo: { after: ["knight_axe_sunder"], within: 4, more: (r) => 0.4 + 0.02 * r }, color: "#ff9a70" },
        desc: (r) => `ทุบตัวที่ล็อกไว้ ${pct(lin(2.4, 0.24)(r))} ของพลังโจมตี มึน 0.5 วิ ใช้ต่อจากผ่าเกราะภายใน 4 วิ แรงขึ้น ${pct(0.4 + 0.02 * r)} ใช้ได้เมื่อถือขวาน` },
      { id: "knight_axe_fury", name: "โลหิตนักรบขวาน", kind: "active", max: 5, pos: [2, 1], req: [["knight_axe_whirl", 3]], glyph: "rage", need: AXES,
        skill: { type: "buff", mp: 30, cd: 35, motion: "swing", duration: 18, buff: (r) => ({ crit: 0.03 + 0.006 * r, pierce: 0.08 + 0.02 * r, critDmg: 0.1 + 0.03 * r }), color: "#ff8a60" },
        desc: (r) => `18 วิ: โอกาสคริติคอล +${pct(0.03 + 0.006 * r)} เจาะเกราะ +${pct(0.08 + 0.02 * r)} แรงคริติคอล +${pct(0.1 + 0.03 * r)} ใช้ได้เมื่อถือขวาน` },
      { id: "knight_axe_execution", name: "ขวานประหารทะลวงฟ้า", kind: "active", max: 5, pos: [1, 2], req: [["knight_axe_crush", 5], ["knight_axe_fury", 1]], glyph: "skull", need: AXES,
        skill: { type: "cone", stat: "atk", mult: lin(5.4, 0.68), mp: 48, cd: 15, motion: "swing", reach: 200, arc: 40,
          combo: { after: ["knight_axe_crush"], within: 4, more: () => 0.4 }, color: "#ff8a60" },
        desc: (r) => `ฟันประหารตัวที่ล็อกไว้ ${pct(lin(5.4, 0.68)(r))} ของพลังโจมตี ใช้ต่อจากทุบทะลวงเกราะภายใน 4 วิ แรงขึ้น 40% ใช้ได้เมื่อถือขวาน` },
      { id: "knight_axe_bloodlust", name: "กระหายเลือด", kind: "passive", max: 5, pos: [0, 2], req: [["knight_axe_instinct", 3]], glyph: "rage", need: AXES,
        stats: (r) => ({ lowHpDmg: 0.03 * r, lifesteal: 0.004 * r }),
        desc: (r) => `ยิ่ง HP เหลือน้อยยิ่งแรง ดาเมจเพิ่มได้ถึง +${pct(0.03 * r)} เมื่อ HP ใกล้หมด ดูด HP ${pct(0.004 * r)} ของดาเมจที่ทำ เมื่อถือขวาน` },
      { id: "knight_axe_hide", name: "หนังหนานักรบ", kind: "passive", max: 10, pos: [2, 2], req: [["knight_axe_fury", 1]], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.012 * r, hpRegen: n1(0.6 * r) }),
        desc: (r) => `HP สูงสุด +${pct(0.012 * r)} ฟื้น HP +${n1(0.6 * r)}/วิ` },
    ],
  },
};

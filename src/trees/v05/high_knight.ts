// The high knight's branches (fourth job, docs/v05_jobs.md, from the knight, the sculptor, the
// shinobi or the monk): the lance (spears made harder and through the armour, a thrust and a storm
// of thrusts up close, the spear thrown at one far off or through a whole line, and a rain of
// spears to end on) and the divine arms (any weapon: no skill asks for one, and the blows grow
// with the mastery of whatever is held; a body as hard as it hits, armour that turns blows, a
// parry that leaves the monsters hitting softer, one target or many). Eight skills a branch, a
// little stronger than the third jobs' (the knight's are the measure).
import type { Need, Tree } from "../../progression";
import { pct, lin } from "../util";

const SPEARS: Need = { weapons: ["spear_1h", "spear_2h"] };
// What the divine arms' blows gain from the held weapon's mastery (SkillDef.masteryScale).
const ARMS_SCALE = 0.01;
const BY_MASTERY = `แรงขึ้น ${pct(ARMS_SCALE)} ต่อระดับความเชี่ยวชาญของอาวุธที่ถือ`;

export const HIGH_KNIGHT_TREES: Record<string, Tree> = {
  // ---- the lance: a harder spear, thrust and storm up close, thrown far and through ----
  high_knight_lance: {
    name: "หอกบุทะลวง", cls: null, job4: "high_knight", color: "#c0d4ff", glyph: "pierce",
    note: "ถือหอกยาวหรือหอกมือเดียว หอกแรงขึ้นและเจาะเกราะ แทงเป้าเดียวไกลถึง 2.6 ม. หรือแทงรัวเป็นพายุใส่ทั้งกลุ่ม ขว้างหอกใส่ตัวที่อยู่ไกล หรือขว้างทะลุทั้งแนว แล้วปิดท้ายด้วยห่าฝนหอกเทวา: แทงทะลวงใจ → พายุพันหอก หรือขว้างหอกพิฆาต → หอกทะลุทัพ แล้วต่อด้วยห่าฝนหอกเทวาที่แรงขึ้น",
    nodes: [
      { id: "high_knight_lance_edge", name: "คมหอกราชันย์", kind: "passive", max: 10, pos: [0, 0], glyph: "up", need: SPEARS,
        stats: (r) => ({ atkPct: 0.013 * r, pierce: 0.01 * r }),
        desc: (r) => `พลังโจมตี +${pct(0.013 * r)} เจาะเกราะ +${pct(0.01 * r)} เมื่อถือหอก` },
      { id: "high_knight_lance_thrust", name: "แทงทะลวงใจ", kind: "active", max: 10, pos: [1, 0], glyph: "pierce", need: SPEARS,
        skill: { type: "cone", stat: "atk", mult: lin(2.3, 0.23), mp: 16, cd: 4, motion: "thrust", reach: 260, arc: 40, color: "#d8e4ff" },
        desc: (r) => `แทงตัวที่ล็อกไว้ไกลถึง 2.6 ม. ${pct(lin(2.3, 0.23)(r))} ของพลังโจมตี ใช้ได้เมื่อถือหอก` },
      // the spear thrown: it homes in on one far off and pins its leg
      { id: "high_knight_lance_throw", name: "ขว้างหอกพิฆาต", kind: "active", max: 10, pos: [2, 0], glyph: "arrow", need: SPEARS,
        skill: { type: "bolt", stat: "atk", mult: lin(2.2, 0.22), slow: () => 2, mp: 16, cd: 5, motion: "thrust", speed: 1400, range: 800, radius: 30, color: "#c8dcff" },
        desc: (r) => `ขว้างหอกใส่ตัวที่ล็อกไว้ระยะ 8 ม. ${pct(lin(2.2, 0.22)(r))} ของพลังโจมตี หอกปักขาให้มันเดินช้าลงครึ่งหนึ่ง 2 วิ ใช้ได้เมื่อถือหอก` },
      { id: "high_knight_lance_form", name: "ท่วงท่าทวนเทพ", kind: "passive", max: 5, pos: [0, 1], req: [["high_knight_lance_edge", 3]], glyph: "wing", need: SPEARS,
        stats: (r) => ({ aspd: 0.022 * r, reach: 0.03 * r }),
        desc: (r) => `ความเร็วโจมตี +${pct(0.022 * r)} ระยะแทงปกติ +${pct(0.03 * r)} เมื่อถือหอก` },
      { id: "high_knight_lance_storm", name: "พายุพันหอก", kind: "active", max: 10, pos: [1, 1], req: [["high_knight_lance_thrust", 4]], glyph: "storm", need: SPEARS,
        skill: { type: "cone", stat: "atk", mult: lin(0.9, 0.09), hits: 3, mp: 22, cd: 6, motion: "thrust", reach: 270, arc: 110,
          combo: { after: ["high_knight_lance_thrust"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#e0eaff" },
        desc: (r) => `แทงรัวเป็นพายุใส่ทุกตัวด้านหน้า 2.7 ม. 3 ครั้ง ครั้งละ ${pct(lin(0.9, 0.09)(r))} ของพลังโจมตี ใช้ต่อจากแทงทะลวงใจภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือหอก` },
      { id: "high_knight_lance_rend", name: "หอกทะลุทัพ", kind: "active", max: 10, pos: [2, 1], req: [["high_knight_lance_throw", 4]], glyph: "beam", need: SPEARS,
        skill: { type: "bolt", stat: "atk", mult: lin(2.2, 0.22), pierce: true, mp: 20, cd: 6, motion: "thrust", speed: 1300, range: 850, radius: 40,
          combo: { after: ["high_knight_lance_throw"], within: 4, more: (r) => 0.2 + 0.03 * r }, color: "#b8ccff" },
        desc: (r) => `ขว้างหอกสุดแรงพุ่งทะลุทุกตัวในแนวยาว 8.5 ม. ตัวละ ${pct(lin(2.2, 0.22)(r))} ของพลังโจมตี ใช้ต่อจากขว้างหอกพิฆาตภายใน 4 วิ แรงขึ้น ${pct(0.2 + 0.03 * r)} ใช้ได้เมื่อถือหอก` },
      { id: "high_knight_lance_valor", name: "ปณิธานทวนเหล็ก", kind: "active", max: 5, pos: [3, 1], req: [["high_knight_lance_throw", 3]], glyph: "rage", need: SPEARS,
        skill: { type: "buff", mp: 30, cd: 40, motion: "thrust", duration: 15, buff: (r) => ({ atkPct: 0.1 + 0.022 * r, pierce: 0.06 + 0.02 * r }), color: "#d0dcff" },
        desc: (r) => `15 วิ: พลังโจมตี +${pct(0.1 + 0.022 * r)} เจาะเกราะ +${pct(0.06 + 0.02 * r)} ใช้ได้เมื่อถือหอก` },
      { id: "high_knight_lance_rain", name: "ห่าฝนหอกเทวา", kind: "active", max: 5, pos: [2, 2], req: [["high_knight_lance_storm", 5], ["high_knight_lance_valor", 1]], glyph: "burst", need: SPEARS,
        skill: { type: "blast", stat: "atk", mult: lin(1.6, 0.2), hits: 4, every: 0.25, mp: 55, cd: 16, motion: "thrust", range: 650, radius: 240, delay: 0.3,
          combo: { after: ["high_knight_lance_storm", "high_knight_lance_rend"], within: 4, more: () => 0.3 }, color: "#eef4ff" },
        desc: (r) => `ขว้างหอกขึ้นฟ้าให้ตกเป็นห่าฝนลงจุดที่เล็ง (ไกลสุด 6.5 ม.) รัศมี 2.4 ม. 4 ระลอก ระลอกละ ${pct(lin(1.6, 0.2)(r))} ของพลังโจมตี ใช้ต่อจากพายุพันหอกหรือหอกทะลุทัพภายใน 4 วิ แรงขึ้น 30% ใช้ได้เมื่อถือหอก` },
    ],
  },
  // ---- the divine arms: any weapon, its mastery in every blow, attack and defence alike ----
  high_knight_arms: {
    name: "เทพศาสตรา", cls: null, job4: "high_knight", color: "#ffe0a8", glyph: "sword",
    note: "ถืออาวุธอะไรก็ได้ ไม่มีสกิลไหนจำกัดอาวุธ และท่าโจมตีแรงขึ้นตามความเชี่ยวชาญของอาวุธที่ถืออยู่ เก่งทั้งรุกและรับ: กายที่ทั้งแรงและแกร่ง เกราะเทพศาสตราลดความเสียหาย ปัดป้องให้ศัตรูตีเบาลง ตีได้ทั้งเป้าเดียวและทั้งกลุ่ม ต่อกันเป็นกระบวนท่า: ฟันเทพศาสตรา → คลื่นศาสตราสะท้านฟ้า → เทพศาสตราพันเล่ม",
    nodes: [
      { id: "high_knight_arms_body", name: "กายาเทพศาสตรา", kind: "passive", max: 10, pos: [0, 0], glyph: "shield",
        stats: (r) => ({ atkPct: 0.01 * r, defPct: 0.015 * r }),
        desc: (r) => `พลังโจมตี +${pct(0.01 * r)} ป้องกัน +${pct(0.015 * r)}` },
      { id: "high_knight_arms_strike", name: "ฟันเทพศาสตรา", kind: "active", max: 10, pos: [1, 0], glyph: "sword",
        skill: { type: "cone", stat: "atk", mult: lin(1.8, 0.18), masteryScale: ARMS_SCALE, mp: 16, cd: 4, motion: "swing", reach: 180, arc: 45, color: "#fff0c8" },
        desc: (r) => `ฟันตัวที่ล็อกไว้ ${pct(lin(1.8, 0.18)(r))} ของพลังโจมตี ${BY_MASTERY}` },
      { id: "high_knight_arms_wheel", name: "วงล้อร้อยศาสตรา", kind: "active", max: 10, pos: [2, 0], glyph: "spin",
        skill: { type: "nova", stat: "atk", mult: lin(1.0, 0.1), hits: 2, masteryScale: ARMS_SCALE, mp: 22, cd: 6, motion: "swing", radius: 240, color: "#ffe8b8" },
        desc: (r) => `หมุนอาวุธฟันรอบตัวรัศมี 2.4 ม. 2 รอบ รอบละ ${pct(lin(1.0, 0.1)(r))} ของพลังโจมตี ${BY_MASTERY}` },
      { id: "high_knight_arms_aegis", name: "เกราะเทพศาสตรา", kind: "active", max: 5, pos: [3, 0], glyph: "shield",
        skill: { type: "buff", mp: 28, cd: 35, motion: "cast", duration: 15, buff: (r) => ({ defPct: 0.08 + 0.03 * r, dmgRed: 0.04 + 0.012 * r, mdefPct: 0.05 + 0.02 * r }), color: "#fff4d8" },
        desc: (r) => `15 วิ: ป้องกัน +${pct(0.08 + 0.03 * r)} ลดความเสียหาย ${pct(0.04 + 0.012 * r)} ต้านเวท +${pct(0.05 + 0.02 * r)}` },
      { id: "high_knight_arms_mastery", name: "ปรมาจารย์ร้อยศาสตรา", kind: "passive", max: 5, pos: [0, 1], req: [["high_knight_arms_body", 3]], glyph: "star",
        stats: (r) => ({ maxHpPct: 0.02 * r, aspd: 0.015 * r }),
        desc: (r) => `HP สูงสุด +${pct(0.02 * r)} ความเร็วโจมตี +${pct(0.015 * r)}` },
      { id: "high_knight_arms_wave", name: "คลื่นศาสตราสะท้านฟ้า", kind: "active", max: 10, pos: [1, 1], req: [["high_knight_arms_strike", 4]], glyph: "wave",
        skill: { type: "beam", stat: "atk", mult: lin(1.8, 0.18), masteryScale: ARMS_SCALE, mp: 20, cd: 6, motion: "swing", length: 520, width: 90,
          combo: { after: ["high_knight_arms_strike"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#ffe6a8" },
        desc: (r) => `ฟาดคลื่นพลังศาสตราเป็นแนวยาว 5.2 ม. ทุกตัวในแนว ${pct(lin(1.8, 0.18)(r))} ของพลังโจมตี ${BY_MASTERY} ใช้ต่อจากฟันเทพศาสตราภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)}` },
      // defence that strikes: the parried monsters hit softer for a while
      { id: "high_knight_arms_parry", name: "ปัดป้องสะท้านศาสตรา", kind: "active", max: 10, pos: [2, 1], req: [["high_knight_arms_wheel", 4]], glyph: "down",
        skill: { type: "cone", stat: "atk", mult: lin(1.8, 0.18), weaken: lin(0.12, 0.012), debuff: 6, mp: 18, cd: 7, motion: "swing", reach: 200, arc: 160, color: "#f8e0b0" },
        desc: (r) => `ปัดอาวุธศัตรูทุกตัวด้านหน้า 2 ม. ${pct(lin(1.8, 0.18)(r))} ของพลังโจมตี แล้วพวกมันตีเบาลง ${pct(lin(0.12, 0.012)(r))} 6 วิ` },
      { id: "high_knight_arms_myriad", name: "เทพศาสตราพันเล่ม", kind: "active", max: 5, pos: [1, 2], req: [["high_knight_arms_wave", 5], ["high_knight_arms_aegis", 1]], glyph: "burst",
        skill: { type: "cone", stat: "atk", mult: lin(0.96, 0.12), hits: 5, masteryScale: ARMS_SCALE, mp: 55, cd: 16, motion: "swing", reach: 200, arc: 40,
          combo: { after: ["high_knight_arms_wave"], within: 4, more: () => 0.35 }, color: "#fff6dc" },
        desc: (r) => `เรียกศาสตรานับพันฟันใส่ตัวที่ล็อกไว้ 5 ครั้งรวด ครั้งละ ${pct(lin(0.96, 0.12)(r))} ของพลังโจมตี ${BY_MASTERY} ใช้ต่อจากคลื่นศาสตราสะท้านฟ้าภายใน 4 วิ แรงขึ้น 35%` },
    ],
  },
};

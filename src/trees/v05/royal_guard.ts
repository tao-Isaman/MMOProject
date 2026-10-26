// The royal guard's branches (fourth job, docs/v05_jobs.md, from the knight or the spellblade),
// the emperor's guard in embroidered silk: the shield (a shield in the off hand, damage turned
// aside and sent back, a duelling stance that strikes back when struck, one-on-one cuts that end
// in a single great blow), the hunt (any weapon, the attacker: armour stripped so the quarry takes
// more, its weapon struck away so it hits softer, chained and pounced on to arrest it, harder on
// whatever is held or stripped) and the strike (bows, pistols and rifles: long shots, heavy
// criticals, a fan, a line and a barrage). Eleven skills a branch (five of them passives, v0.6),
// a little stronger than the third jobs'.
import type { Need, Tree } from "../../progression";
import { pct, lin } from "../util";

const SHIELD: Need = { shield: true };
const RANGED: Need = { weapons: ["bow", "pistol", "rifle"] };
const n1 = (v: number) => +v.toFixed(1);

export const ROYAL_GUARD_TREES: Record<string, Tree> = {
  // ---- the shield: guard, send back, duel, then one great blow ----
  royal_guard_shield: {
    name: "ทหารคุ้มกัน", cls: null, job4: "royal_guard", color: "#e8d090", glyph: "shield",
    note: "องครักษ์เสื้อแพรผู้คุ้มกันองค์ฮ่องเต้ ถือโล่ในมือรองให้ป้องกันสูงและลดความเสียหาย สะท้อนความเสียหายกลับไปที่ตัวที่ตี ตั้งท่าประลองยุทธ์สวนกลับเมื่อโดนตี สู้ตัวต่อตัวเป็นกระบวนท่าแล้วระเบิดพลังทั้งหมดในดาบเดียว: ฟันพิทักษ์ราชันย์หรือกระแทกโล่มังกร → สามกระบวนดาบเสื้อแพร → ดาบอาญาสิทธิ์ ท่าฟันใช้อาวุธใดก็ได้",
    nodes: [
      { id: "royal_guard_shield_bulwark", name: "โล่องครักษ์หลวง", kind: "passive", max: 10, pos: [0, 0], glyph: "shield", need: SHIELD,
        stats: (r) => ({ defPct: 0.02 * r, dmgRed: 0.006 * r }),
        desc: (r) => `ป้องกัน +${pct(0.02 * r)} ลดความเสียหาย ${pct(0.006 * r)} เมื่อถือโล่` },
      { id: "royal_guard_shield_guard", name: "ฟันพิทักษ์ราชันย์", kind: "active", max: 10, pos: [1, 0], glyph: "sword",
        skill: { type: "cone", stat: "atk", mult: lin(2.3, 0.23), drain: lin(0.03, 0.003), mp: 16, cd: 4, motion: "swing", reach: 170, arc: 40, color: "#f8e4a8" },
        desc: (r) => `ฟันตัวที่ล็อกไว้ ${pct(lin(2.3, 0.23)(r))} ของพลังโจมตี ฟื้น HP ${pct(lin(0.03, 0.003)(r))} ของดาเมจที่ทำ` },
      { id: "royal_guard_shield_bash", name: "กระแทกโล่มังกร", kind: "active", max: 10, pos: [2, 0], glyph: "slam", need: SHIELD,
        skill: { type: "cone", stat: "atk", mult: lin(2.1, 0.21), stun: () => 1, knock: 40, mp: 16, cd: 6, motion: "thrust", reach: 150, arc: 40, color: "#e8c878" },
        desc: (r) => `กระแทกโล่ใส่ตัวที่ล็อกไว้ ${pct(lin(2.1, 0.21)(r))} ของพลังโจมตี มึน 1 วิ ใช้ได้เมื่อถือโล่` },
      // one on one: every blow that lands on her may be struck straight back (the counter stat)
      { id: "royal_guard_shield_duel", name: "ท่าประลองยุทธ์", kind: "active", max: 5, pos: [3, 0], glyph: "eye",
        skill: { type: "buff", mp: 28, cd: 35, motion: "swing", duration: 23, buff: (r) => ({ counter: 0.1 + 0.03 * r, crit: 0.02 + 0.006 * r, dmgRed: 0.03 + 0.01 * r }), color: "#ffe8a0" },
        desc: (r) => `23 วิ: ตั้งท่าประลองตัวต่อตัว โดนตีจากระยะประชิดแล้วมีโอกาส ${pct(0.1 + 0.03 * r)} สวนกลับทันที 150% ของพลังโจมตี โอกาสคริติคอล +${pct(0.02 + 0.006 * r)} ลดความเสียหาย ${pct(0.03 + 0.01 * r)}` },
      { id: "royal_guard_shield_mirror", name: "เกราะสะท้อนพยัคฆ์", kind: "passive", max: 5, pos: [0, 1], req: [["royal_guard_shield_bulwark", 3]], glyph: "thorn",
        stats: (r) => ({ reflect: 0.025 * r, mdefPct: 0.03 * r }),
        desc: (r) => `สะท้อนความเสียหาย ${pct(0.025 * r)} กลับไปที่ตัวที่ตีเรา ต้านเวท +${pct(0.03 * r)}` },
      { id: "royal_guard_shield_forms", name: "สามกระบวนดาบเสื้อแพร", kind: "active", max: 10, pos: [1, 1], req: [["royal_guard_shield_guard", 4]], glyph: "storm",
        skill: { type: "cone", stat: "atk", mult: lin(0.95, 0.095), hits: 3, mp: 20, cd: 6, motion: "swing", reach: 170, arc: 40,
          combo: { after: ["royal_guard_shield_guard", "royal_guard_shield_bash"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#fff0c0" },
        desc: (r) => `ฟันตัวที่ล็อกไว้ 3 กระบวนท่ารวด ครั้งละ ${pct(lin(0.95, 0.095)(r))} ของพลังโจมตี ใช้ต่อจากฟันพิทักษ์ราชันย์หรือกระแทกโล่มังกรภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)}` },
      { id: "royal_guard_shield_wall", name: "กำแพงโล่ทองแดง", kind: "active", max: 5, pos: [2, 1], req: [["royal_guard_shield_bash", 3]], glyph: "shield", need: SHIELD,
        skill: { type: "buff", mp: 30, cd: 35, motion: "thrust", duration: 15, buff: (r) => ({ dmgRed: 0.08 + 0.025 * r, defPct: 0.1 + 0.03 * r, reflect: 0.1 + 0.02 * r }), color: "#d8b060" },
        desc: (r) => `15 วิ: ตั้งโล่เป็นกำแพง ลดความเสียหาย ${pct(0.08 + 0.025 * r)} ป้องกัน +${pct(0.1 + 0.03 * r)} สะท้อนความเสียหาย ${pct(0.1 + 0.02 * r)} ใช้ได้เมื่อถือโล่` },
      // the burst: everything in one blow, hardest after the three forms
      { id: "royal_guard_shield_edict", name: "ดาบอาญาสิทธิ์", kind: "active", max: 5, pos: [1, 2], req: [["royal_guard_shield_forms", 5], ["royal_guard_shield_duel", 1]], glyph: "burst",
        skill: { type: "cone", stat: "atk", mult: lin(6.4, 0.8), stun: () => 1, mp: 56, cd: 18, motion: "swing", reach: 190, arc: 40,
          combo: { after: ["royal_guard_shield_forms"], within: 4, more: () => 0.4 }, color: "#fff8d8" },
        desc: (r) => `ระเบิดพลังทั้งหมดในดาบเดียวใส่ตัวที่ล็อกไว้ ${pct(lin(6.4, 0.8)(r))} ของพลังโจมตี มึน 1 วิ ใช้ต่อจากสามกระบวนดาบเสื้อแพรภายใน 4 วิ แรงขึ้น 40%` },
      // v0.6: three more passives (the branch's five)
      { id: "royal_guard_shield_riposte", name: "สวนดาบเสื้อแพร", kind: "passive", max: 5, pos: [3, 1], req: [["royal_guard_shield_duel", 1]], glyph: "swirl",
        stats: (r) => ({ counter: 0.02 * r, critDmg: 0.03 * r }),
        desc: (r) => `ศัตรูที่ตีโดนจากระยะใกล้มีโอกาส ${pct(0.02 * r)} โดนสวนกลับ 150% ของพลังโจมตี แรงคริติคอล +${pct(0.03 * r)}` },
      { id: "royal_guard_shield_iron", name: "ใจเหล็กองครักษ์", kind: "passive", max: 5, pos: [0, 2], req: [["royal_guard_shield_mirror", 3]], glyph: "heart",
        stats: (r) => ({ statusRes: 0.03 * r, hpRegen: 2 * r }),
        desc: (r) => `ต้านสถานะ +${pct(0.03 * r)} ฟื้น HP +${2 * r}/วิ` },
      { id: "royal_guard_shield_oath", name: "คำสัตย์ผู้พิทักษ์", kind: "passive", max: 5, pos: [2, 2], req: [["royal_guard_shield_wall", 1]], glyph: "shield", need: SHIELD,
        stats: (r) => ({ maxHpPct: 0.02 * r, cdr: 0.01 * r }),
        desc: (r) => `HP สูงสุด +${pct(0.02 * r)} ลดคูลดาวน์ ${pct(0.01 * r)} เมื่อถือโล่` },
    ],
  },
  // ---- the hunt: strip the armour, strike the weapon away, chain and pounce ----
  royal_guard_hunt: {
    name: "ทหารไล่ล่า", cls: null, job4: "royal_guard", color: "#e8a070", glyph: "target",
    note: "มือปราบแห่งราชสำนัก เก่งด้านการโจมตี ใช้อาวุธใดก็ได้ ปลดเกราะให้ศัตรูรับดาเมจเพิ่ม ปลดอาวุธให้ศัตรูตีเบาลง จับกุมด้วยโซ่ตรวนจากระยะไกลหรือพุ่งตะครุบให้มึน ยิ่งเป้าติดสถานะยิ่งโดนแรง ปิดท้ายด้วยตาข่ายสวรรค์ที่จับกุม ปลดเกราะ และปลดอาวุธทั้งฝูง: ดาบปลดเกราะหรือโซ่ตรวนราชทัณฑ์ → ดาบปลดอาวุธ → ตาข่ายสวรรค์",
    nodes: [
      { id: "royal_guard_hunt_instinct", name: "สัญชาตญาณมือปราบ", kind: "passive", max: 10, pos: [0, 0], glyph: "eye",
        stats: (r) => ({ atkPct: 0.01 * r, huntDmg: 0.012 * r }),
        desc: (r) => `พลังโจมตี +${pct(0.01 * r)} ดาเมจใส่ศัตรูที่ติดสถานะผิดปกติ (มึน ช้า ปลดเกราะ ปลดอาวุธ ฯลฯ) +${pct(0.012 * r)}` },
      { id: "royal_guard_hunt_strip", name: "ดาบปลดเกราะ", kind: "active", max: 10, pos: [1, 0], glyph: "pierce",
        skill: { type: "cone", stat: "atk", mult: lin(2.2, 0.22), expose: lin(0.1, 0.012), debuff: 12, mp: 16, cd: 5, motion: "swing", reach: 170, arc: 40, color: "#f0b890" },
        desc: (r) => `ฟันปลดเกราะตัวที่ล็อกไว้ ${pct(lin(2.2, 0.22)(r))} ของพลังโจมตี แล้ว 12 วิ: มันรับดาเมจทุกอย่างเพิ่ม ${pct(lin(0.1, 0.012)(r))}` },
      // the arrest from afar: chained where it stands, then dragging its feet
      { id: "royal_guard_hunt_chain", name: "โซ่ตรวนราชทัณฑ์", kind: "active", max: 10, pos: [2, 0], glyph: "target",
        skill: { type: "bolt", stat: "atk", mult: lin(1.9, 0.19), stun: lin(1.0, 0.05), slow: () => 4.5, mp: 18, cd: 8, motion: "thrust", speed: 1200, range: 650, radius: 32, color: "#d8c0a0" },
        desc: (r) => `เหวี่ยงโซ่ตรวนใส่ตัวที่ล็อกไว้ระยะ 6.5 ม. ${pct(lin(1.9, 0.19)(r))} ของพลังโจมตี ล่ามไว้กับที่ (มึน) ${n1(lin(1.0, 0.05)(r))} วิ และเดินช้าลงครึ่งหนึ่ง 4.5 วิ` },
      { id: "royal_guard_hunt_warrant", name: "หมายจับราชโองการ", kind: "active", max: 5, pos: [3, 0], glyph: "scroll",
        skill: { type: "buff", mp: 30, cd: 35, motion: "cast", duration: 23, buff: (r) => ({ atkPct: 0.08 + 0.02 * r, huntDmg: 0.05 + 0.02 * r, crit: 0.02 + 0.004 * r }), color: "#ffc890" },
        desc: (r) => `23 วิ: พลังโจมตี +${pct(0.08 + 0.02 * r)} ดาเมจใส่ศัตรูที่ติดสถานะผิดปกติ +${pct(0.05 + 0.02 * r)} โอกาสคริติคอล +${pct(0.02 + 0.004 * r)}` },
      { id: "royal_guard_hunt_stride", name: "ฝีเท้ามือปราบ", kind: "passive", max: 5, pos: [0, 1], req: [["royal_guard_hunt_instinct", 3]], glyph: "dash",
        stats: (r) => ({ move: 0.02 * r, aspd: 0.02 * r }),
        desc: (r) => `ความเร็วเดิน +${pct(0.02 * r)} ความเร็วโจมตี +${pct(0.02 * r)}` },
      { id: "royal_guard_hunt_disarm", name: "ดาบปลดอาวุธ", kind: "active", max: 10, pos: [1, 1], req: [["royal_guard_hunt_strip", 3]], glyph: "down",
        skill: { type: "cone", stat: "atk", mult: lin(2.4, 0.24), weaken: lin(0.12, 0.012), debuff: 12, mp: 18, cd: 6, motion: "swing", reach: 170, arc: 40,
          combo: { after: ["royal_guard_hunt_strip", "royal_guard_hunt_chain"], within: 4, more: (r) => 0.2 + 0.03 * r }, color: "#f8c8a0" },
        desc: (r) => `ฟันปัดอาวุธหลุดจากมือตัวที่ล็อกไว้ ${pct(lin(2.4, 0.24)(r))} ของพลังโจมตี แล้ว 12 วิ: มันตีเบาลง ${pct(lin(0.12, 0.012)(r))} ใช้ต่อจากดาบปลดเกราะหรือโซ่ตรวนราชทัณฑ์ภายใน 4 วิ แรงขึ้น ${pct(0.2 + 0.03 * r)}` },
      { id: "royal_guard_hunt_pounce", name: "พุ่งตะครุบ", kind: "active", max: 10, pos: [2, 1], req: [["royal_guard_hunt_chain", 3]], glyph: "dash",
        skill: { type: "dash", stat: "atk", mult: lin(2.0, 0.2), stun: () => 0.8, mp: 18, cd: 7, motion: "thrust", distance: 340, width: 80, color: "#e89860" },
        desc: (r) => `พุ่งไล่ล่าไปข้างหน้า 3.4 ม. ตะครุบทุกตัวที่ผ่าน ${pct(lin(2.0, 0.2)(r))} ของพลังโจมตี มึน 0.8 วิ` },
      // the net of heaven: the whole pack arrested, stripped and disarmed at once
      { id: "royal_guard_hunt_net", name: "ตาข่ายสวรรค์", kind: "active", max: 5, pos: [1, 2], req: [["royal_guard_hunt_disarm", 5], ["royal_guard_hunt_warrant", 1]], glyph: "storm",
        skill: { type: "blast", stat: "atk", mult: lin(2.0, 0.25), hits: 3, every: 0.3, stun: lin(1.0, 0.1), expose: () => 0.15, weaken: () => 0.15, debuff: 12,
          mp: 55, cd: 18, motion: "swing", range: 520, radius: 250, delay: 0.3,
          combo: { after: ["royal_guard_hunt_disarm", "royal_guard_hunt_pounce"], within: 4, more: () => 0.3 }, color: "#ffd8b0" },
        desc: (r) => `ทอดตาข่ายสวรรค์ลงจุดที่เล็ง (ไกลสุด 5.2 ม.) รัศมี 2.5 ม. รัดแน่น 3 ครั้ง ครั้งละ ${pct(lin(2.0, 0.25)(r))} ของพลังโจมตี ทุกตัวในวงมึน ${n1(lin(1.0, 0.1)(r))} วิ แล้ว 12 วิ: รับดาเมจเพิ่ม 15% และตีเบาลง 15% ใช้ต่อจากดาบปลดอาวุธหรือพุ่งตะครุบภายใน 4 วิ แรงขึ้น 30%` },
      // v0.6: three more passives (the branch's five)
      { id: "royal_guard_hunt_dossier", name: "บัญชีดำราชสำนัก", kind: "passive", max: 5, pos: [3, 1], req: [["royal_guard_hunt_warrant", 1]], glyph: "scroll",
        stats: (r) => ({ cdr: 0.012 * r, mpRegen: n1(0.3 * r) }),
        desc: (r) => `ลดคูลดาวน์ ${pct(0.012 * r)} ฟื้น MP +${n1(0.3 * r)}/วิ` },
      { id: "royal_guard_hunt_tracker", name: "แกะรอยมือปราบ", kind: "passive", max: 5, pos: [0, 2], req: [["royal_guard_hunt_stride", 3]], glyph: "eye",
        stats: (r) => ({ hit: 3 * r, statusRes: 0.03 * r }),
        desc: (r) => `ความแม่นยำ +${3 * r} ต้านสถานะ +${pct(0.03 * r)}` },
      { id: "royal_guard_hunt_hardened", name: "กายเหล็กผู้จับกุม", kind: "passive", max: 5, pos: [2, 2], req: [["royal_guard_hunt_pounce", 3]], glyph: "shield",
        stats: (r) => ({ maxHpPct: 0.015 * r, dmgRed: 0.006 * r }),
        desc: (r) => `พุ่งเข้าจับกุมกลางฝูงได้ไม่หวั่น: HP สูงสุด +${pct(0.015 * r)} ลดความเสียหาย ${pct(0.006 * r)}` },
    ],
  },
  // ---- the strike: bows and guns, far and heavy ----
  royal_guard_strike: {
    name: "ทหารจู่โจม", cls: null, job4: "royal_guard", color: "#d8b880", glyph: "arrow",
    note: "พลแม่นแห่งกองรักษาพระองค์ ถือธนู ปืนสั้น หรือปืนยาว ยิงไกลและแรง คริติคอลหนัก ยิงสกัดเป้าเดียว ยิงกระจายเป็นพัด ยิงทะลุทั้งแนว และระดมยิงถล่มจุดที่เล็ง ปิดท้ายด้วยนัดพิฆาตไกลถึง 11.5 ม.: ยิงสกัดทัพ → ยิงทะลวงแนว หรือระดมยิงถล่ม → นัดพิฆาตองครักษ์",
    nodes: [
      { id: "royal_guard_strike_aim", name: "เล็งมั่นองครักษ์", kind: "passive", max: 10, pos: [0, 0], glyph: "target", need: RANGED,
        stats: (r) => ({ atkPct: 0.013 * r, reach: 0.02 * r }),
        desc: (r) => `พลังโจมตี +${pct(0.013 * r)} ระยะยิงปกติ +${pct(0.02 * r)} เมื่อถือธนูหรือปืน` },
      { id: "royal_guard_strike_shot", name: "ยิงสกัดทัพ", kind: "active", max: 10, pos: [1, 0], glyph: "arrow", need: RANGED,
        skill: { type: "bolt", stat: "atk", mult: lin(2.3, 0.23), mp: 16, cd: 4, motion: "shoot", speed: 1800, range: 900, radius: 28, color: "#f0d8a0" },
        desc: (r) => `ยิงตัวที่ล็อกไว้ระยะ 9 ม. ${pct(lin(2.3, 0.23)(r))} ของพลังโจมตี ใช้ได้เมื่อถือธนูหรือปืน` },
      { id: "royal_guard_strike_spread", name: "ยิงกระจายพัด", kind: "active", max: 10, pos: [2, 0], glyph: "fan", need: RANGED,
        skill: { type: "fan", stat: "atk", mult: lin(1.15, 0.115), count: 5, spread: 40, mp: 18, cd: 6, motion: "shoot", speed: 1700, range: 750, radius: 26, color: "#e8c890" },
        desc: (r) => `ยิง 5 นัดกระจายเป็นรูปพัดไกล 7.5 ม. นัดละ ${pct(lin(1.15, 0.115)(r))} ของพลังโจมตี ใช้ได้เมื่อถือธนูหรือปืน` },
      { id: "royal_guard_strike_post", name: "ประจำป้อมซุ่มยิง", kind: "active", max: 5, pos: [3, 0], glyph: "eye", need: RANGED,
        skill: { type: "buff", mp: 30, cd: 40, motion: "shoot", duration: 23, buff: (r) => ({ atkPct: 0.1 + 0.022 * r, crit: 0.02 + 0.005 * r, reach: 0.05 + 0.01 * r }), color: "#f8e0b0" },
        desc: (r) => `23 วิ: พลังโจมตี +${pct(0.1 + 0.022 * r)} โอกาสคริติคอล +${pct(0.02 + 0.005 * r)} ระยะยิงปกติ +${pct(0.05 + 0.01 * r)} ใช้ได้เมื่อถือธนูหรือปืน` },
      { id: "royal_guard_strike_eye", name: "ตาเหยี่ยวราชสำนัก", kind: "passive", max: 5, pos: [0, 1], req: [["royal_guard_strike_aim", 3]], glyph: "star", need: RANGED,
        stats: (r) => ({ crit: 0.008 * r, critDmg: 0.05 * r }),
        desc: (r) => `โอกาสคริติคอล +${pct(0.008 * r)} แรงคริติคอล +${pct(0.05 * r)} เมื่อถือธนูหรือปืน` },
      { id: "royal_guard_strike_pierce", name: "ยิงทะลวงแนว", kind: "active", max: 10, pos: [1, 1], req: [["royal_guard_strike_shot", 4]], glyph: "beam", need: RANGED,
        skill: { type: "bolt", stat: "atk", mult: lin(2.4, 0.24), pierce: true, mp: 20, cd: 6, motion: "shoot", speed: 1900, range: 1000, radius: 34,
          combo: { after: ["royal_guard_strike_shot"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#fff0c0" },
        desc: (r) => `ยิงนัดเจาะทะลุทุกตัวในแนวยาว 10 ม. ตัวละ ${pct(lin(2.4, 0.24)(r))} ของพลังโจมตี ใช้ต่อจากยิงสกัดทัพภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือธนูหรือปืน` },
      { id: "royal_guard_strike_barrage", name: "ระดมยิงถล่ม", kind: "active", max: 10, pos: [2, 1], req: [["royal_guard_strike_spread", 4]], glyph: "storm", need: RANGED,
        skill: { type: "blast", stat: "atk", mult: lin(0.95, 0.095), hits: 3, every: 0.25, mp: 26, cd: 9, motion: "shoot", range: 850, radius: 220, delay: 0.3, color: "#ffd890" },
        desc: (r) => `ระดมยิงถล่มจุดที่เล็ง (ไกลสุด 8.5 ม.) รัศมี 2.2 ม. 3 ชุด ชุดละ ${pct(lin(0.95, 0.095)(r))} ของพลังโจมตี ใช้ได้เมื่อถือธนูหรือปืน` },
      { id: "royal_guard_strike_kill", name: "นัดพิฆาตองครักษ์", kind: "active", max: 5, pos: [1, 2], req: [["royal_guard_strike_pierce", 5], ["royal_guard_strike_post", 1]], glyph: "skull", need: RANGED,
        skill: { type: "bolt", stat: "atk", mult: lin(6.2, 0.78), stun: () => 1, mp: 55, cd: 16, motion: "shoot", speed: 2200, range: 1150, radius: 32,
          combo: { after: ["royal_guard_strike_pierce", "royal_guard_strike_barrage"], within: 4, more: () => 0.35 }, color: "#fffbe8" },
        desc: (r) => `ยิงนัดพิฆาตใส่ตัวที่ล็อกไว้ระยะ 11.5 ม. ${pct(lin(6.2, 0.78)(r))} ของพลังโจมตี มึน 1 วิ ใช้ต่อจากยิงทะลวงแนวหรือระดมยิงถล่มภายใน 4 วิ แรงขึ้น 35% ใช้ได้เมื่อถือธนูหรือปืน` },
      // v0.6: three more passives (the branch's five)
      { id: "royal_guard_strike_vigil", name: "เวรยามป้อมปราการ", kind: "passive", max: 5, pos: [3, 1], req: [["royal_guard_strike_post", 1]], glyph: "shield", need: RANGED,
        stats: (r) => ({ cdr: 0.012 * r, statusRes: 0.03 * r }),
        desc: (r) => `ลดคูลดาวน์ ${pct(0.012 * r)} ต้านสถานะ +${pct(0.03 * r)} เมื่อถือธนูหรือปืน` },
      { id: "royal_guard_strike_calm", name: "ใจนิ่งพลแม่น", kind: "passive", max: 5, pos: [0, 2], req: [["royal_guard_strike_eye", 3]], glyph: "eye", need: RANGED,
        stats: (r) => ({ hit: 3 * r, mpRegen: n1(0.3 * r) }),
        desc: (r) => `ความแม่นยำ +${3 * r} ฟื้น MP +${n1(0.3 * r)}/วิ เมื่อถือธนูหรือปืน` },
      { id: "royal_guard_strike_volley", name: "ห่ากระสุนไม่ขาดสาย", kind: "passive", max: 5, pos: [2, 2], req: [["royal_guard_strike_barrage", 3]], glyph: "wing", need: RANGED,
        stats: (r) => ({ aspd: 0.015 * r, move: 0.01 * r }),
        desc: (r) => `ความเร็วโจมตี +${pct(0.015 * r)} ความเร็วเดิน +${pct(0.01 * r)} เมื่อถือธนูหรือปืน` },
    ],
  },
};

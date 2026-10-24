// The samurai's branches (fourth job, docs/v05_jobs.md, from any third job): the blade (a
// two-handed sword above all, or any two-handed weapon: quick draws and cuts, and a body that
// heals fast, from its breath, from what it cuts and from a moment's stillness that heals over
// time), the vanguard (a two-handed weapon on the front line: a great deal of HP and defence,
// blows that leave the monsters hitting weaker, guards that stand fast for a long fight) and
// the ranged (a bow or a gun, near and far: a shot that pushes back, a blast at close quarters
// that throws them off, a step like the wind and quick feet to keep the distance). The ranged
// skills shoot plain shots in their colour, the same with a bow or a gun. Eight skills a
// branch, a little stronger than the third jobs' (the knight's is the measure).
import type { Need, Tree } from "../../progression";
import { pct, lin } from "../util";

// the melee two-handers (the bow and the rifle take both hands too, but they're the ranged branch's)
const TWO_HANDED: Need = { weapons: ["sword_2h", "axe_2h", "spear_2h"] };
const KATANA: Need = { weapons: ["sword_2h"] };
const RANGED: Need = { weapons: ["bow", "pistol", "rifle"] };
const n1 = (v: number) => +v.toFixed(1);

export const SAMURAI_TREES: Record<string, Tree> = {
  // ---- the blade: quick cuts, a body that heals ----
  samurai_blade: {
    name: "ทะลวงฟัน", cls: null, job4: "samurai", color: "#f0a0a0", glyph: "sword",
    note: "ถือดาบ ขวาน หรือหอกสองมือ (ดาบสองมือได้โบนัสเพิ่ม) ชักดาบและฟันรวดเร็วหลายจังหวะ ฟื้น HP สูง: ลมหายใจที่ฟื้น HP ตลอดเวลา ดาบที่ดูดเลือดคืนจากทุกครั้งที่ฟัน และสมาธิที่ค่อย ๆ ฟื้น HP ฟันต่อกันแรงขึ้น: ชักดาบพริบตา → ฟันลมกรดสามจังหวะ → ซากุระร่วงพันกลีบ",
    nodes: [
      { id: "samurai_blade_breath", name: "ลมหายใจบูชิโด", kind: "passive", max: 10, pos: [0, 0], glyph: "heart",
        stats: (r) => ({ hpRegen: n1(1.2 * r), maxHpPct: 0.012 * r }),
        desc: (r) => `ฟื้น HP +${n1(1.2 * r)}/วิ HP สูงสุด +${pct(0.012 * r)}` },
      { id: "samurai_blade_iai", name: "ชักดาบพริบตา", kind: "active", max: 10, pos: [1, 0], glyph: "sword", need: TWO_HANDED,
        skill: { type: "cone", stat: "atk", mult: lin(1.1, 0.11), hits: 2, drain: () => 0.04, mp: 15, cd: 3.5, motion: "swing", reach: 190, arc: 120, color: "#ffd0d0" },
        desc: (r) => `ชักอาวุธฟันฉับเป็นวงด้านหน้า 1.9 ม. 2 ครั้งรวด ครั้งละ ${pct(lin(1.1, 0.11)(r))} ของพลังโจมตี ฟื้น HP 4% ของดาเมจที่ทำ ใช้ได้เมื่อถือดาบ ขวาน หรือหอกสองมือ` },
      { id: "samurai_blade_way", name: "วิถีคาตานะ", kind: "passive", max: 10, pos: [2, 0], glyph: "up", need: KATANA,
        stats: (r) => ({ aspd: 0.015 * r, crit: 0.004 * r }),
        desc: (r) => `ความเร็วโจมตี +${pct(0.015 * r)} โอกาสคริติคอล +${pct(0.004 * r)} เมื่อถือดาบสองมือ` },
      // a heal over time and a little regeneration, open to every weapon
      { id: "samurai_blade_zen", name: "สมาธิเยียวยากาย", kind: "active", max: 10, pos: [3, 0], glyph: "heal",
        skill: { type: "buff", mp: 20, cd: 18, motion: "cast", duration: 10, heal: lin(0.12, 0.015), hot: true, buff: (r) => ({ hpRegen: 4 + 2 * r }), color: "#ffe0e0" },
        desc: (r) => `ทำสมาธิชั่วอึดใจ ฟื้น HP ${pct(lin(0.12, 0.015)(r))} ของ HP สูงสุดทีละส่วนใน 5 วิ และ 10 วิ: ฟื้น HP +${4 + 2 * r}/วิ` },
      { id: "samurai_blade_thirst", name: "ดาบกระหายเลือด", kind: "passive", max: 5, pos: [0, 1], req: [["samurai_blade_breath", 3]], glyph: "drop", need: TWO_HANDED,
        stats: (r) => ({ lifesteal: 0.007 * r, atkPct: 0.01 * r }),
        desc: (r) => `ฟื้น HP ${pct(0.007 * r)} ของดาเมจที่ทำทุกครั้ง ทั้งตีปกติและสกิล พลังโจมตี +${pct(0.01 * r)} เมื่อถือดาบ ขวาน หรือหอกสองมือ` },
      { id: "samurai_blade_gale", name: "ฟันลมกรดสามจังหวะ", kind: "active", max: 10, pos: [1, 1], req: [["samurai_blade_iai", 4]], glyph: "storm", need: TWO_HANDED,
        skill: { type: "cone", stat: "atk", mult: lin(0.92, 0.092), hits: 3, drain: () => 0.04, mp: 18, cd: 4.5, motion: "swing", reach: 180, arc: 60,
          combo: { after: ["samurai_blade_iai"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#ffe0e0" },
        desc: (r) => `ฟันเร็วดั่งลมกรดด้านหน้า 1.8 ม. 3 จังหวะ ครั้งละ ${pct(lin(0.92, 0.092)(r))} ของพลังโจมตี ฟื้น HP 4% ของดาเมจที่ทำ ใช้ต่อจากชักดาบพริบตาภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือดาบ ขวาน หรือหอกสองมือ` },
      { id: "samurai_blade_stillwater", name: "ใจนิ่งดั่งผิวน้ำ", kind: "active", max: 5, pos: [2, 1], req: [["samurai_blade_way", 3]], glyph: "wing", need: TWO_HANDED,
        skill: { type: "buff", mp: 28, cd: 35, motion: "cast", duration: 15, buff: (r) => ({ aspd: 0.1 + 0.025 * r, hpRegen: 6 + 3 * r, crit: 0.02 + 0.005 * r }), color: "#f8d0d8" },
        desc: (r) => `15 วิ: ความเร็วโจมตี +${pct(0.1 + 0.025 * r)} ฟื้น HP +${6 + 3 * r}/วิ โอกาสคริติคอล +${pct(0.02 + 0.005 * r)} ใช้ได้เมื่อถือดาบ ขวาน หรือหอกสองมือ` },
      { id: "samurai_blade_sakura", name: "ซากุระร่วงพันกลีบ", kind: "active", max: 5, pos: [1, 2], req: [["samurai_blade_gale", 5], ["samurai_blade_stillwater", 1]], glyph: "flower", need: TWO_HANDED,
        skill: { type: "storm", stat: "atk", mult: lin(0.85, 0.105), pulses: 6, every: 0.18, drain: () => 0.05, mp: 52, cd: 16, motion: "swing", radius: 260,
          combo: { after: ["samurai_blade_gale"], within: 4, more: () => 0.35 }, color: "#ffc8dc" },
        desc: (r) => `ฟันรอบตัวรัศมี 2.6 ม. 6 ครั้งรวดดั่งกลีบซากุระร่วง ครั้งละ ${pct(lin(0.85, 0.105)(r))} ของพลังโจมตี ฟื้น HP 5% ของดาเมจที่ทำ ใช้ต่อจากฟันลมกรดสามจังหวะภายใน 4 วิ แรงขึ้น 35% ใช้ได้เมื่อถือดาบ ขวาน หรือหอกสองมือ` },
    ],
  },
  // ---- the vanguard: the front line, a wall of HP and armour ----
  samurai_vanguard: {
    name: "ปะทะแนวหน้า", cls: null, job4: "samurai", color: "#d8b0b0", glyph: "shield",
    note: "ถือดาบ ขวาน หรือหอกสองมือยืนแนวหน้า HP และป้องกันสูง ฟันปะทะให้ศัตรูทั้งแถวตีเบาลง บัฟป้องกันที่อยู่นาน และท่ายืนหยัดเมื่อจวนตัวที่ลดความเสียหายและฟื้น HP ยืนสู้ได้นานที่สุด ฟันต่อกันแรงขึ้น: ฟันปะทะแนวหน้า → กระแทกด้ามดาบ → ทลายทัพกลางสมรภูมิ",
    nodes: [
      { id: "samurai_vanguard_body", name: "กายเหล็กกล้า", kind: "passive", max: 10, pos: [0, 0], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.018 * r, defPct: 0.015 * r }),
        desc: (r) => `HP สูงสุด +${pct(0.018 * r)} ป้องกัน +${pct(0.015 * r)}` },
      { id: "samurai_vanguard_clash", name: "ฟันปะทะแนวหน้า", kind: "active", max: 10, pos: [1, 0], glyph: "slam", need: TWO_HANDED,
        skill: { type: "cone", stat: "atk", mult: lin(2.2, 0.22), weaken: (r) => 0.06 + 0.008 * r, debuff: 6, mp: 16, cd: 4, motion: "swing", reach: 200, arc: 130, color: "#f0d0c8" },
        desc: (r) => `ฟันปะทะศัตรูเป็นวงกว้างด้านหน้า 2 ม. ${pct(lin(2.2, 0.22)(r))} ของพลังโจมตี ทุกตัวที่โดนตีเบาลง ${pct(0.06 + 0.008 * r)} 6 วิ ใช้ได้เมื่อถือดาบ ขวาน หรือหอกสองมือ` },
      { id: "samurai_vanguard_bulwark", name: "ปราการเกราะซามูไร", kind: "active", max: 5, pos: [2, 0], glyph: "shield",
        skill: { type: "buff", mp: 28, cd: 35, motion: "cast", duration: 20, buff: (r) => ({ defPct: 0.12 + 0.03 * r, mdefPct: 0.08 + 0.025 * r, maxHpPct: 0.04 + 0.012 * r }), color: "#f0e0d0" },
        desc: (r) => `20 วิ: ป้องกัน +${pct(0.12 + 0.03 * r)} ต้านเวท +${pct(0.08 + 0.025 * r)} HP สูงสุด +${pct(0.04 + 0.012 * r)}` },
      { id: "samurai_vanguard_resolve", name: "ใจไม่หวั่นไหว", kind: "passive", max: 10, pos: [3, 0], glyph: "up",
        stats: (r) => ({ dmgRed: 0.006 * r, statusRes: 0.01 * r }),
        desc: (r) => `ลดความเสียหาย ${pct(0.006 * r)} ต้านสถานะ ${pct(0.01 * r)}` },
      { id: "samurai_vanguard_root", name: "รากหยั่งแผ่นดิน", kind: "passive", max: 5, pos: [0, 1], req: [["samurai_vanguard_body", 3]], glyph: "earth",
        stats: (r) => ({ hpRegen: n1(1.5 * r), mdefPct: 0.03 * r }),
        desc: (r) => `ฟื้น HP +${n1(1.5 * r)}/วิ ต้านเวท +${pct(0.03 * r)}` },
      { id: "samurai_vanguard_hilt", name: "กระแทกด้ามดาบ", kind: "active", max: 10, pos: [1, 1], req: [["samurai_vanguard_clash", 4]], glyph: "bash", need: TWO_HANDED,
        skill: { type: "cone", stat: "atk", mult: lin(2.4, 0.24), stun: () => 1, mp: 20, cd: 6, motion: "thrust", reach: 170, arc: 40,
          combo: { after: ["samurai_vanguard_clash"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#f8e0d0" },
        desc: (r) => `กระแทกด้ามอาวุธใส่ตัวที่ล็อกไว้ ${pct(lin(2.4, 0.24)(r))} ของพลังโจมตี มึน 1 วิ ใช้ต่อจากฟันปะทะแนวหน้าภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือดาบ ขวาน หรือหอกสองมือ` },
      // the last stand: when the fight turns, less of every blow gets through and HP comes back
      { id: "samurai_vanguard_laststand", name: "ยืนหยัดลมหายใจสุดท้าย", kind: "active", max: 5, pos: [2, 1], req: [["samurai_vanguard_bulwark", 3]], glyph: "cry",
        skill: { type: "buff", mp: 32, cd: 45, motion: "swing", duration: 10, heal: lin(0.1, 0.02), buff: (r) => ({ dmgRed: 0.15 + 0.03 * r, hpRegen: 10 + 5 * r, statusRes: 0.1 + 0.03 * r }), color: "#ffd0b0" },
        desc: (r) => `ฟื้น HP ทันที ${pct(lin(0.1, 0.02)(r))} ของ HP สูงสุด แล้ว 10 วิ: ลดความเสียหาย ${pct(0.15 + 0.03 * r)} ฟื้น HP +${10 + 5 * r}/วิ ต้านสถานะ ${pct(0.1 + 0.03 * r)}` },
      { id: "samurai_vanguard_breaker", name: "ทลายทัพกลางสมรภูมิ", kind: "active", max: 5, pos: [1, 2], req: [["samurai_vanguard_hilt", 5], ["samurai_vanguard_laststand", 1]], glyph: "burst", need: TWO_HANDED,
        skill: { type: "nova", stat: "atk", mult: lin(1.8, 0.22), hits: 3, stun: () => 1, weaken: () => 0.2, debuff: 8, mp: 54, cd: 18, motion: "swing", radius: 270,
          combo: { after: ["samurai_vanguard_hilt"], within: 4, more: () => 0.3 }, color: "#fff0e0" },
        desc: (r) => `ฟาดอาวุธทลายทัพรอบตัวรัศมี 2.7 ม. 3 ระลอก ระลอกละ ${pct(lin(1.8, 0.22)(r))} ของพลังโจมตี ทุกตัวมึน 1 วิ และตีเบาลง 20% 8 วิ ใช้ต่อจากกระแทกด้ามดาบภายใน 4 วิ แรงขึ้น 30% ใช้ได้เมื่อถือดาบ ขวาน หรือหอกสองมือ` },
    ],
  },
  // ---- the ranged: near and far with a bow or a gun, the distance kept ----
  samurai_ranged: {
    name: "ต่อสู้ยืดหยุ่น", cls: null, job4: "samurai", color: "#e8c0a0", glyph: "arrow",
    note: "ถือธนู ปืนสั้น หรือปืนยาว สู้ได้ทั้งใกล้และไกล ยิงไกลแล้วแรงยิงผลักศัตรูถอย ระยะประชิดยิงกวาดให้กระเด็นออกไปและเดินช้า รักษาระยะด้วยก้าวเท้าลมและฝีเท้าที่ไว ยิงต่อกันแรงขึ้น: ยิงผลักระยะหรือยิงประชิดกระเด็น → ยิงตรึงเงา → ฝนเหล็กกลางสมรภูมิ",
    nodes: [
      { id: "samurai_ranged_eye", name: "ตาเหยี่ยวรักษาระยะ", kind: "passive", max: 10, pos: [0, 0], glyph: "eye", need: RANGED,
        stats: (r) => ({ atkPct: 0.01 * r, reach: 0.015 * r }),
        desc: (r) => `พลังโจมตี +${pct(0.01 * r)} ระยะยิงปกติ +${pct(0.015 * r)} เมื่อถือธนูหรือปืน` },
      { id: "samurai_ranged_shot", name: "ยิงผลักระยะ", kind: "active", max: 10, pos: [1, 0], glyph: "arrow", need: RANGED,
        skill: { type: "bolt", stat: "atk", mult: lin(2.3, 0.23), knock: 90, mp: 16, cd: 4, motion: "shoot", speed: 1800, range: 850, radius: 28, color: "#ffe0c0" },
        desc: (r) => `ยิงใส่ตัวที่ล็อกไว้ระยะ 8.5 ม. ${pct(lin(2.3, 0.23)(r))} ของพลังโจมตี แรงยิงผลักมันถอยหลัง ใช้ได้เมื่อถือธนูหรือปืน` },
      // near: a shot at point-blank that throws them off and slows them, to get the distance back
      { id: "samurai_ranged_blast", name: "ยิงประชิดกระเด็น", kind: "active", max: 10, pos: [2, 0], glyph: "fan", need: RANGED,
        skill: { type: "cone", stat: "atk", mult: lin(2.2, 0.22), knock: 200, slow: lin(2, 0.2), mp: 18, cd: 6, motion: "shoot", reach: 220, arc: 120, color: "#ffd0a0" },
        desc: (r) => `ยิงกวาดระยะประชิดด้านหน้า 2.2 ม. ${pct(lin(2.2, 0.22)(r))} ของพลังโจมตี ศัตรูกระเด็นออกไปและเดินช้าลงครึ่งหนึ่ง ${n1(lin(2, 0.2)(r))} วิ ใช้ได้เมื่อถือธนูหรือปืน` },
      // a step like the wind, whatever is in her hands
      { id: "samurai_ranged_step", name: "ก้าวเท้าลม", kind: "active", max: 1, pos: [3, 0], glyph: "dash",
        skill: { type: "dash", mp: 12, cd: 7, motion: "thrust", distance: 400, color: "#fff0e0" },
        desc: () => "ก้าวไปทางที่เล็งเร็วดั่งลม 4 ม. ผ่านศัตรูได้ ใช้ถอยออกมาตั้งหลักหรือหลบเข้าที่ปลอดภัย" },
      { id: "samurai_ranged_feet", name: "ฝีเท้าพลิ้วไหว", kind: "passive", max: 5, pos: [0, 1], req: [["samurai_ranged_eye", 3]], glyph: "shoes",
        stats: (r) => ({ move: 0.012 * r, flee: 4 * r }),
        desc: (r) => `ความเร็วเดิน +${pct(0.012 * r)} หลบหลีก +${4 * r}` },
      { id: "samurai_ranged_pin", name: "ยิงตรึงเงา", kind: "active", max: 10, pos: [1, 1], req: [["samurai_ranged_shot", 4]], glyph: "pierce", need: RANGED,
        skill: { type: "bolt", stat: "atk", mult: lin(2.55, 0.255), stun: () => 0.8, mp: 20, cd: 6, motion: "shoot", speed: 1900, range: 850, radius: 28,
          combo: { after: ["samurai_ranged_shot", "samurai_ranged_blast"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#fff0d0" },
        desc: (r) => `ยิงตรึงเงาตัวที่ล็อกไว้ระยะ 8.5 ม. ${pct(lin(2.55, 0.255)(r))} ของพลังโจมตี มึน 0.8 วิ ใช้ต่อจากยิงผลักระยะหรือยิงประชิดกระเด็นภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือธนูหรือปืน` },
      { id: "samurai_ranged_flow", name: "สายน้ำไหลไม่หยุด", kind: "active", max: 5, pos: [2, 1], req: [["samurai_ranged_blast", 3]], glyph: "wing", need: RANGED,
        skill: { type: "buff", mp: 28, cd: 35, motion: "cast", duration: 15, buff: (r) => ({ move: 0.08 + 0.02 * r, aspd: 0.06 + 0.02 * r, flee: 8 + 4 * r }), color: "#ffe8d0" },
        desc: (r) => `15 วิ: ความเร็วเดิน +${pct(0.08 + 0.02 * r)} ความเร็วโจมตี +${pct(0.06 + 0.02 * r)} หลบหลีก +${8 + 4 * r} ใช้ได้เมื่อถือธนูหรือปืน` },
      { id: "samurai_ranged_rain", name: "ฝนเหล็กกลางสมรภูมิ", kind: "active", max: 5, pos: [1, 2], req: [["samurai_ranged_pin", 5], ["samurai_ranged_flow", 1]], glyph: "burst", need: RANGED,
        skill: { type: "blast", stat: "atk", mult: lin(2.1, 0.26), hits: 3, every: 0.25, mp: 54, cd: 16, motion: "shoot", range: 800, radius: 240, delay: 0.3,
          combo: { after: ["samurai_ranged_pin"], within: 4, more: () => 0.35 }, color: "#fff4e0" },
        desc: (r) => `ยิงขึ้นฟ้าให้ห่าเหล็กตกลงจุดที่เล็ง (ไกลสุด 8 ม.) รัศมี 2.4 ม. 3 ระลอก ระลอกละ ${pct(lin(2.1, 0.26)(r))} ของพลังโจมตี ใช้ต่อจากยิงตรึงเงาภายใน 4 วิ แรงขึ้น 35% ใช้ได้เมื่อถือธนูหรือปืน` },
    ],
  },
};

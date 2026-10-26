// The monk's branches (third job, from the bishop, the wizard, the battle mage or the thief):
// nature (a stance of wind or of earth turns the normal hits and the palm into that element, and
// the hits call that element's spell by themselves: a blade of wind, stone from the ground) and
// the martial art (knuckles, hits by the handful, a chain of blows from the jab to the asura
// fist). A stance is one enchant: taking the other one ends it. Ten skills on nature and nine on
// the martial art (four passives each), a little stronger than the second jobs'.
import type { Need, Tree } from "../../progression";
import { pct, lin } from "../util";

const KNUCKLE: Need = { weapons: ["knuckle"] };
// What a "both" skill's number is a share of (stat: "both": 0.6 of attack and of magic attack).
const MIX = "พลังผสม (60% ของพลังโจมตี + 60% ของพลังเวท)";
const n1 = (v: number) => +v.toFixed(1);

export const MONK_TREES: Record<string, Tree> = {
  // ---- nature: stances of wind and earth, spells the hits call ----
  monk_nature: {
    name: "พลังธรรมชาติ", cls: null, job3: "monk", color: "#a8e0a0", glyph: "leaf",
    note: "ตั้งท่าวายุหรือท่าปฐพี (ทีละท่า) ตีปกติ ฝ่ามือ และสกิลกายภาพกลายเป็นธาตุของท่า ตีโดนแล้วมีโอกาสร่ายฝ่ามือธาตุ คมลมฝ่ามือ หรือหินผุดเองฟรี เสริมพลังโจมตีธาตุดิน น้ำ ลม และไฟ ปิดท้ายด้วยพิโรธธรรมชาติรอบตัว",
    nodes: [
      // (the palm first: the branch's first skill on the bar)
      { id: "monk_nature_palm", name: "ฝ่ามือธาตุ", kind: "active", max: 10, pos: [1, 0], glyph: "bash",
        skill: { type: "cone", stat: "atk", mult: lin(2.0, 0.2), mp: 14, cd: 4, motion: "thrust", reach: 160, arc: 50, color: "#c8f0c0" },
        desc: (r) => `ส่งพลังฝ่ามือใส่ตัวที่ล็อกไว้ ดาเมจ ${pct(lin(2.0, 0.2)(r))} ของพลังโจมตี เป็นธาตุของท่าที่ตั้งอยู่` },
      { id: "monk_nature_wind", name: "ท่าวายุ", kind: "active", max: 5, pos: [0, 0], glyph: "wing",
        skill: { type: "buff", mp: 20, cd: 15, motion: "cast", duration: 90, enchant: "wind",
          buff: (r) => ({ windAtk: 5 + 3 * r, aspd: 0.04 + 0.02 * r, move: 0.03 + 0.01 * r, autocast_monk_nature_gust: 0.02 + 0.01 * r }), color: "#c8fff0" },
        desc: (r) => `90 วิ: ตั้งท่าแห่งสายลม ตีปกติและสกิลกายภาพที่ไม่มีธาตุกลายเป็นธาตุลม พลังโจมตีธาตุลม +${5 + 3 * r} ความเร็วโจมตี +${pct(0.04 + 0.02 * r)} ความเร็วเดิน +${pct(0.03 + 0.01 * r)} ตีปกติโดนแล้วมีโอกาส ${pct(0.02 + 0.01 * r)} ร่ายคมลมฝ่ามือเองฟรี (ตั้งได้ทีละท่า)` },
      { id: "monk_nature_breath", name: "ลมปราณธรรมชาติ", kind: "passive", max: 10, pos: [2, 0], glyph: "swirl",
        stats: (r) => ({ earthAtk: n1(1.2 * r), waterAtk: n1(1.2 * r), windAtk: n1(1.2 * r), fireAtk: n1(1.2 * r), autocast_monk_nature_palm: 0.01 * r }),
        desc: (r) => `พลังโจมตีธาตุดิน น้ำ ลม และไฟ +${n1(1.2 * r)} ตีปกติโดนแล้วมีโอกาส ${pct(0.01 * r)} ร่ายฝ่ามือธาตุเองฟรี` },
      { id: "monk_nature_earth", name: "ท่าปฐพี", kind: "active", max: 5, pos: [3, 0], glyph: "earth",
        skill: { type: "buff", mp: 20, cd: 15, motion: "cast", duration: 90, enchant: "earth",
          buff: (r) => ({ earthAtk: 5 + 3 * r, defPct: 0.05 + 0.02 * r, maxHpPct: 0.03 + 0.01 * r, autocast_monk_nature_quake: 0.02 + 0.01 * r }), color: "#e0c890" },
        desc: (r) => `90 วิ: ตั้งท่าแห่งผืนดิน ตีปกติและสกิลกายภาพที่ไม่มีธาตุกลายเป็นธาตุดิน พลังโจมตีธาตุดิน +${5 + 3 * r} ป้องกัน +${pct(0.05 + 0.02 * r)} HP สูงสุด +${pct(0.03 + 0.01 * r)} ตีปกติโดนแล้วมีโอกาส ${pct(0.02 + 0.01 * r)} ร่ายหินผุดสะท้านเองฟรี (ตั้งได้ทีละท่า)` },
      { id: "monk_nature_gust", name: "คมลมฝ่ามือ", kind: "active", max: 10, pos: [0, 1], req: [["monk_nature_wind", 1]], glyph: "wave",
        skill: { type: "bolt", stat: "both", element: "wind", mult: lin(2.1, 0.21), pierce: true, mp: 16, cd: 5, motion: "thrust", speed: 1150, range: 600, radius: 40, color: "#d0fff2" },
        desc: (r) => `ผลักฝ่ามือส่งคมลมทะลุทุกตัวในแนว 6 ม. ดาเมจ ${pct(lin(2.1, 0.21)(r))} ของ${MIX}` },
      { id: "monk_nature_quake", name: "หินผุดสะท้าน", kind: "active", max: 10, pos: [3, 1], req: [["monk_nature_earth", 1]], glyph: "slam",
        skill: { type: "blast", stat: "both", element: "earth", mult: lin(1.1, 0.11), hits: 2, every: 0.3, stun: () => 0.6, mp: 18, cd: 6, motion: "thrust", range: 450, radius: 170, delay: 0.2, color: "#d8b880" },
        desc: (r) => `กระทืบพื้นให้หินผุดตรงจุดที่เล็ง รัศมี 1.7 ม. 2 ครั้ง ครั้งละ ${pct(lin(1.1, 0.11)(r))} ของ${MIX} มึน 0.6 วิ` },
      { id: "monk_nature_wrath", name: "พิโรธธรรมชาติ", kind: "active", max: 5, pos: [1, 2], req: [["monk_nature_gust", 4], ["monk_nature_quake", 4]], glyph: "storm",
        skill: { type: "nova", stat: "atk", mult: lin(1.75, 0.22), hits: 3, mp: 46, cd: 15, motion: "thrust", radius: 260,
          combo: { after: ["monk_nature_gust", "monk_nature_quake"], within: 4, more: () => 0.35 }, color: "#b8f0b0" },
        desc: (r) => `ปลดพลังธรรมชาติระเบิดรอบตัวรัศมี 2.6 ม. 3 ระลอก ระลอกละ ${pct(lin(1.75, 0.22)(r))} ของพลังโจมตี เป็นธาตุของท่าที่ตั้งอยู่ ใช้ต่อจากคมลมฝ่ามือหรือหินผุดสะท้านภายใน 4 วิ แรงขึ้น 35%` },
      { id: "monk_nature_harmony", name: "สมดุลธาตุ", kind: "passive", max: 10, pos: [2, 1], req: [["monk_nature_breath", 3]], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.01 * r, hpRegen: n1(0.5 * r) }),
        desc: (r) => `HP สูงสุด +${pct(0.01 * r)} ฟื้น HP +${n1(0.5 * r)}/วิ` },
      { id: "monk_nature_zephyr", name: "กายเบาดั่งลม", kind: "passive", max: 5, pos: [0, 2], req: [["monk_nature_gust", 3]], glyph: "wing",
        stats: (r) => ({ flee: 3 * r, move: 0.01 * r }),
        desc: (r) => `หลบหลีก +${3 * r} ความเร็วเดิน +${pct(0.01 * r)}` },
      { id: "monk_nature_rooted", name: "รากหยั่งปฐพี", kind: "passive", max: 5, pos: [3, 2], req: [["monk_nature_quake", 3]], glyph: "earth",
        stats: (r) => ({ defPct: 0.03 * r, statusRes: 0.02 * r }),
        desc: (r) => `ป้องกัน +${pct(0.03 * r)} ต้านสถานะ +${pct(0.02 * r)}` },
    ],
  },
  // ---- the martial art: knuckles, many hits, a chain to the asura fist ----
  monk_martial: {
    name: "ศิลปะการต่อสู้", cls: null, job3: "monk", color: "#ffc890", glyph: "bash",
    note: "ถือสนับมือ ทุกท่าตีหลายฮิต ตีปกติมีโอกาสโดนซ้ำ กระบวนท่าต่อกันเป็นสาย: ชุดหมัดเปิดทางหรือเตะหมุนพายุ → หมัดคู่ทลายหิน → ร้อยหมัดพายุคลั่ง → หมัดอสุราสะท้านฟ้า ท่าสังหารที่รวมปราณทั้งหมดเป็นหมัดเดียว",
    nodes: [
      { id: "monk_martial_triple", name: "สามหมัดประสาน", kind: "passive", max: 10, pos: [0, 0], glyph: "twin", need: KNUCKLE,
        stats: (r) => ({ doubleHit: 0.015 * r, atkPct: 0.01 * r }),
        desc: (r) => `ตีปกติมีโอกาส ${pct(0.015 * r)} โดนซ้ำอีกครั้ง พลังโจมตี +${pct(0.01 * r)} เมื่อถือสนับมือ` },
      { id: "monk_martial_jab", name: "ชุดหมัดเปิดทาง", kind: "active", max: 10, pos: [1, 0], glyph: "bash", need: KNUCKLE,
        skill: { type: "cone", stat: "atk", mult: lin(0.6, 0.06), hits: 4, mp: 14, cd: 4, motion: "thrust", reach: 140, arc: 50, color: "#ffe0b8" },
        desc: (r) => `ต่อยรัวใส่ตัวที่ล็อกไว้ 4 ครั้ง ครั้งละ ${pct(lin(0.6, 0.06)(r))} ของพลังโจมตี ใช้ได้เมื่อถือสนับมือ` },
      { id: "monk_martial_kick", name: "เตะหมุนพายุ", kind: "active", max: 10, pos: [2, 0], glyph: "spin", need: KNUCKLE,
        skill: { type: "nova", stat: "atk", mult: lin(1.1, 0.11), hits: 2, mp: 16, cd: 5, motion: "swing", radius: 200, color: "#ffd8a8" },
        desc: (r) => `หมุนตัวเตะรอบตัวรัศมี 2 ม. 2 รอบ รอบละ ${pct(lin(1.1, 0.11)(r))} ของพลังโจมตี ใช้ได้เมื่อถือสนับมือ` },
      { id: "monk_martial_spirit", name: "ปลุกปราณวัชระ", kind: "active", max: 5, pos: [0, 1], req: [["monk_martial_triple", 3]], glyph: "rage", need: KNUCKLE,
        skill: { type: "buff", mp: 26, cd: 35, motion: "thrust", duration: 23, buff: (r) => ({ atkPct: 0.06 + 0.02 * r, crit: 0.02 + 0.006 * r, dmgRed: 0.04 + 0.01 * r }), color: "#ffb870" },
        desc: (r) => `23 วิ: พลังโจมตี +${pct(0.06 + 0.02 * r)} โอกาสคริติคอล +${pct(0.02 + 0.006 * r)} ลดความเสียหาย ${pct(0.04 + 0.01 * r)} ใช้ได้เมื่อถือสนับมือ` },
      { id: "monk_martial_twin", name: "หมัดคู่ทลายหิน", kind: "active", max: 10, pos: [1, 1], req: [["monk_martial_jab", 4]], glyph: "slam", need: KNUCKLE,
        skill: { type: "cone", stat: "atk", mult: lin(1.25, 0.125), hits: 2, stun: () => 0.5, mp: 18, cd: 5, motion: "thrust", reach: 150, arc: 50,
          combo: { after: ["monk_martial_jab", "monk_martial_kick"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#ffcf98" },
        desc: (r) => `กระแทกหมัดคู่ใส่ตัวที่ล็อกไว้ 2 ครั้ง ครั้งละ ${pct(lin(1.25, 0.125)(r))} ของพลังโจมตี มึน 0.5 วิ ใช้ต่อจากชุดหมัดเปิดทางหรือเตะหมุนพายุภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือสนับมือ` },
      { id: "monk_martial_hundred", name: "ร้อยหมัดพายุคลั่ง", kind: "active", max: 5, pos: [1, 2], req: [["monk_martial_twin", 4]], glyph: "storm", need: KNUCKLE,
        skill: { type: "cone", stat: "atk", mult: lin(0.5, 0.06), hits: 6, mp: 30, cd: 9, motion: "thrust", reach: 150, arc: 50,
          combo: { after: ["monk_martial_twin"], within: 3, more: () => 0.3 }, color: "#ffe8c8" },
        desc: (r) => `ต่อยรัวจนเห็นเป็นร้อยหมัดใส่ตัวที่ล็อกไว้ 6 ครั้ง ครั้งละ ${pct(lin(0.5, 0.06)(r))} ของพลังโจมตี ใช้ต่อจากหมัดคู่ทลายหินภายใน 3 วิ แรงขึ้น 30% ใช้ได้เมื่อถือสนับมือ` },
      { id: "monk_martial_asura", name: "หมัดอสุราสะท้านฟ้า", kind: "active", max: 5, pos: [1, 3], req: [["monk_martial_hundred", 3], ["monk_martial_spirit", 1]], glyph: "burst", need: KNUCKLE,
        skill: { type: "cone", stat: "atk", mult: lin(5.4, 0.68), mp: 50, cd: 16, motion: "thrust", reach: 180, arc: 40,
          combo: { after: ["monk_martial_hundred"], within: 4, more: () => 0.4 }, color: "#ffa860" },
        desc: (r) => `รวมปราณทั้งหมดเป็นหมัดเดียวใส่ตัวที่ล็อกไว้ ดาเมจ ${pct(lin(5.4, 0.68)(r))} ของพลังโจมตี ใช้ต่อจากร้อยหมัดพายุคลั่งภายใน 4 วิ แรงขึ้น 40% ใช้ได้เมื่อถือสนับมือ` },
      { id: "monk_martial_iron", name: "กายเหล็กวัชระ", kind: "passive", max: 10, pos: [0, 2], req: [["monk_martial_spirit", 1]], glyph: "shield",
        stats: (r) => ({ maxHpPct: 0.012 * r, defPct: 0.012 * r }),
        desc: (r) => `HP สูงสุด +${pct(0.012 * r)} ป้องกัน +${pct(0.012 * r)}` },
      { id: "monk_martial_counter", name: "หมัดสวนกลับ", kind: "passive", max: 5, pos: [2, 1], req: [["monk_martial_kick", 3]], glyph: "bash", need: KNUCKLE,
        stats: (r) => ({ counter: 0.02 * r, dmgRed: 0.006 * r }),
        desc: (r) => `ศัตรูที่ตีโดนเราจากระยะประชิด (ราว 2 ม.) มีโอกาส ${pct(0.02 * r)} โดนสวนกลับทันที 150% ของพลังโจมตี ลดความเสียหาย ${pct(0.006 * r)} เมื่อถือสนับมือ` },
      { id: "monk_martial_breath", name: "ลมปราณหมุนเวียน", kind: "passive", max: 5, pos: [2, 2], req: [["monk_martial_twin", 3]], glyph: "swirl",
        stats: (r) => ({ mpRegen: n1(0.4 * r), cdr: 0.01 * r }),
        desc: (r) => `ฟื้น MP +${n1(0.4 * r)}/วิ ลดคูลดาวน์ ${pct(0.01 * r)}` },
    ],
  },
};

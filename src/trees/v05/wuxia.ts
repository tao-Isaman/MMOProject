// The wuxia's branches (fourth job, docs/v05_jobs.md, from any third job): the wandering sword (a
// one-handed sword and nothing in the other hand: the lone swordsman's stances and his passive
// count only while the off hand is empty, need.offEmpty; quick cuts, a step through the enemy, a
// wave of sword qi from afar, a parry and a stance that give him attack and defence in turn) and
// the bare fist (knuckles: quick flurries, two dashes that carry him through and past the enemy,
// and the counter: a blow that lands on him from close by may be struck straight back, the
// counter stat, a passive and a stance). Eight skills a branch, a little stronger than the third
// jobs' (the knight's blade and the monk's martial art are the measure).
import type { Need, Tree } from "../../progression";
import { pct, lin } from "../util";

const SWORD: Need = { weapons: ["sword_1h"] };
const LONE: Need = { weapons: ["sword_1h"], offEmpty: true };
const KNUCKLE: Need = { weapons: ["knuckle"] };
const n1 = (v: number) => +v.toFixed(1);

export const WUXIA_TREES: Record<string, Tree> = {
  // ---- the wandering sword: one blade, the other hand free ----
  wuxia_sword: {
    name: "กระบี่พเนจร", cls: null, job4: "wuxia", color: "#f0c890", glyph: "sword",
    note: "ถือดาบมือเดียว ยิ่งมือรองว่างยิ่งเก่ง: กระบี่เดียวดาย ท่าปัดป้อง และท่ากระบี่ท่องยุทธภพใช้ได้เฉพาะเมื่อมือรองว่าง แข็งแกร่งรอบด้าน ทั้งฟันใกล้ พุ่งผ่าน และส่งปราณกระบี่ไปไกล สลับรุกรับได้ตามศึก ฟันต่อกันเป็นกระบวนท่า: กระบี่สามประกายหรือก้าวเงาพเนจร → ปราณกระบี่พันลี้ → กระบี่ไร้เทียมทาน",
    nodes: [
      { id: "wuxia_sword_lone", name: "กระบี่เดียวดาย", kind: "passive", max: 10, pos: [0, 0], glyph: "sword", need: LONE,
        stats: (r) => ({ atkPct: 0.012 * r, crit: 0.004 * r, flee: 2 * r }),
        desc: (r) => `พลังโจมตี +${pct(0.012 * r)} โอกาสคริติคอล +${pct(0.004 * r)} หลบหลีก +${2 * r} เมื่อถือดาบมือเดียวและมือรองว่าง` },
      { id: "wuxia_sword_triple", name: "กระบี่สามประกาย", kind: "active", max: 10, pos: [1, 0], glyph: "storm", need: SWORD,
        skill: { type: "cone", stat: "atk", mult: lin(0.9, 0.09), hits: 3, mp: 14, cd: 4, motion: "swing", reach: 180, arc: 90, color: "#fff0d0" },
        desc: (r) => `วาดกระบี่เป็นประกายสามสายใส่ศัตรูด้านหน้า 1.8 ม. 3 ครั้งรวด ครั้งละ ${pct(lin(0.9, 0.09)(r))} ของพลังโจมตี ใช้ได้เมื่อถือดาบมือเดียว` },
      { id: "wuxia_sword_step", name: "ก้าวเงาพเนจร", kind: "active", max: 10, pos: [2, 0], glyph: "dash", need: SWORD,
        skill: { type: "dash", stat: "atk", mult: lin(2.1, 0.21), mp: 16, cd: 7, motion: "thrust", distance: 350, width: 80, color: "#ffe0b0" },
        desc: (r) => `ก้าวผ่านศัตรูดั่งเงาไปข้างหน้า 3.5 ม. ฟันทุกตัวที่ผ่าน ${pct(lin(2.1, 0.21)(r))} ของพลังโจมตี ใช้ได้เมื่อถือดาบมือเดียว` },
      { id: "wuxia_sword_parry", name: "กระบี่ไร้รูปปัดป้อง", kind: "active", max: 5, pos: [3, 0], glyph: "shield", need: LONE,
        skill: { type: "buff", mp: 26, cd: 30, motion: "swing", duration: 15, buff: (r) => ({ defPct: 0.06 + 0.02 * r, mdefPct: 0.06 + 0.02 * r, dmgRed: 0.04 + 0.01 * r, flee: 4 * r }), color: "#f8e8c0" },
        desc: (r) => `15 วิ: กระบี่หมุนปัดป้องจนไม่เห็นรูป ป้องกันและต้านเวท +${pct(0.06 + 0.02 * r)} ลดความเสียหาย ${pct(0.04 + 0.01 * r)} หลบหลีก +${4 * r} ใช้ได้เมื่อถือดาบมือเดียวและมือรองว่าง` },
      { id: "wuxia_sword_heart", name: "ใจกระบี่รุกรับ", kind: "passive", max: 5, pos: [0, 1], req: [["wuxia_sword_lone", 3]], glyph: "up", need: SWORD,
        stats: (r) => ({ aspd: 0.02 * r, defPct: 0.02 * r, mdefPct: 0.02 * r }),
        desc: (r) => `ความเร็วโจมตี +${pct(0.02 * r)} ป้องกันและต้านเวท +${pct(0.02 * r)} เมื่อถือดาบมือเดียว` },
      { id: "wuxia_sword_qi", name: "ปราณกระบี่พันลี้", kind: "active", max: 10, pos: [1, 1], req: [["wuxia_sword_triple", 4]], glyph: "wave", need: SWORD,
        skill: { type: "beam", stat: "atk", mult: lin(2.3, 0.23), mp: 18, cd: 6, motion: "swing", length: 600, width: 80,
          combo: { after: ["wuxia_sword_triple", "wuxia_sword_step"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#fff4d8" },
        desc: (r) => `ฟันส่งปราณกระบี่พุ่งเป็นแนวยาว 6 ม. ทุกตัวในแนว ${pct(lin(2.3, 0.23)(r))} ของพลังโจมตี ใช้ต่อจากกระบี่สามประกายหรือก้าวเงาพเนจรภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือดาบมือเดียว` },
      { id: "wuxia_sword_wander", name: "กระบี่ท่องยุทธภพ", kind: "active", max: 5, pos: [2, 1], req: [["wuxia_sword_step", 3]], glyph: "wing", need: LONE,
        skill: { type: "buff", mp: 28, cd: 35, motion: "swing", duration: 15, buff: (r) => ({ atkPct: 0.06 + 0.02 * r, aspd: 0.06 + 0.02 * r, move: 0.05 + 0.01 * r }), color: "#ffd8a0" },
        desc: (r) => `15 วิ: ตั้งท่ากระบี่ท่องยุทธภพ พลังโจมตี +${pct(0.06 + 0.02 * r)} ความเร็วโจมตี +${pct(0.06 + 0.02 * r)} ความเร็วเดิน +${pct(0.05 + 0.01 * r)} ใช้ได้เมื่อถือดาบมือเดียวและมือรองว่าง` },
      { id: "wuxia_sword_peerless", name: "กระบี่ไร้เทียมทาน", kind: "active", max: 5, pos: [1, 2], req: [["wuxia_sword_qi", 5], ["wuxia_sword_wander", 1]], glyph: "star", need: SWORD,
        skill: { type: "cone", stat: "atk", mult: lin(1.13, 0.15), hits: 5, mp: 48, cd: 16, motion: "swing", reach: 200, arc: 70,
          combo: { after: ["wuxia_sword_qi"], within: 3, more: () => 0.35 }, color: "#fffbe8" },
        desc: (r) => `ร่ายกระบวนท่ากระบี่ไร้เทียมทาน ฟัน 5 ครั้งใส่ศัตรูด้านหน้า 2 ม. ครั้งละ ${pct(lin(1.13, 0.15)(r))} ของพลังโจมตี ใช้ต่อจากปราณกระบี่พันลี้ภายใน 3 วิ แรงขึ้น 35% ใช้ได้เมื่อถือดาบมือเดียว` },
    ],
  },
  // ---- the bare fist: flurries, dashes, and the blow struck back ----
  wuxia_fist: {
    name: "ต่อสู้มือเปล่า", cls: null, job4: "wuxia", color: "#f0a070", glyph: "bash",
    note: "ถือสนับมือ ต่อยเร็วรัวหลายหมัด พุ่งเข้าออกได้สองท่า และสวนกลับ: ศัตรูที่ตีโดนเราจากระยะประชิดมีโอกาสโดนสวนกลับทันที (150% ของพลังโจมตี) ตั้งท่าสวนกลับให้โอกาสสูงขึ้นอีก ต่อยต่อกันเป็นกระบวนท่า: หมัดพายุสายฟ้าหรือก้าวพริบตา → หมัดมังกรผงาดฟ้า → หมัดพิฆาตพันลี้",
    nodes: [
      { id: "wuxia_fist_counter", name: "ท่าสวนกลับ", kind: "passive", max: 10, pos: [0, 0], glyph: "twin", need: KNUCKLE,
        stats: (r) => ({ counter: 0.02 * r, flee: n1(1.5 * r) }),
        desc: (r) => `ศัตรูที่ตีโดนเราจากระยะประชิด (ราว 2 ม.) มีโอกาส ${pct(0.02 * r)} โดนสวนกลับทันที 150% ของพลังโจมตี (โอกาสสวนกลับรวมสูงสุด 60%) หลบหลีก +${n1(1.5 * r)} เมื่อถือสนับมือ` },
      { id: "wuxia_fist_flurry", name: "หมัดพายุสายฟ้า", kind: "active", max: 10, pos: [1, 0], glyph: "bash", need: KNUCKLE,
        skill: { type: "cone", stat: "atk", mult: lin(0.66, 0.066), hits: 4, mp: 14, cd: 4, motion: "thrust", reach: 140, arc: 50, color: "#ffe0c0" },
        desc: (r) => `ต่อยรัวเร็วดั่งสายฟ้าใส่ตัวที่ล็อกไว้ 4 ครั้ง ครั้งละ ${pct(lin(0.66, 0.066)(r))} ของพลังโจมตี ใช้ได้เมื่อถือสนับมือ` },
      { id: "wuxia_fist_blink", name: "ก้าวพริบตา", kind: "active", max: 10, pos: [2, 0], glyph: "dash", need: KNUCKLE,
        skill: { type: "dash", stat: "atk", mult: lin(1.05, 0.105), hits: 2, mp: 14, cd: 5, motion: "thrust", distance: 360, width: 80, color: "#ffd0a0" },
        desc: (r) => `พุ่งไปข้างหน้า 3.6 ม. ในพริบตา ต่อยทุกตัวที่ผ่าน 2 ครั้ง ครั้งละ ${pct(lin(1.05, 0.105)(r))} ของพลังโจมตี ใช้ได้เมื่อถือสนับมือ` },
      { id: "wuxia_fist_swift", name: "หมัดไร้เงา", kind: "passive", max: 10, pos: [3, 0], glyph: "wing", need: KNUCKLE,
        stats: (r) => ({ aspd: 0.015 * r, move: 0.008 * r }),
        desc: (r) => `ความเร็วโจมตี +${pct(0.015 * r)} ความเร็วเดิน +${pct(0.008 * r)} เมื่อถือสนับมือ` },
      { id: "wuxia_fist_stance", name: "ตั้งท่าสวนกลับ", kind: "active", max: 5, pos: [0, 1], req: [["wuxia_fist_counter", 3]], glyph: "shield", need: KNUCKLE,
        skill: { type: "buff", mp: 26, cd: 30, motion: "thrust", duration: 15, buff: (r) => ({ counter: 0.1 + 0.03 * r, dmgRed: 0.03 + 0.01 * r, flee: 3 * r }), color: "#ffc890" },
        desc: (r) => `15 วิ: ตั้งท่ารอรับ โอกาสสวนกลับ +${pct(0.1 + 0.03 * r)} (รวมสูงสุด 60%) ลดความเสียหาย ${pct(0.03 + 0.01 * r)} หลบหลีก +${3 * r} ใช้ได้เมื่อถือสนับมือ` },
      { id: "wuxia_fist_dragon", name: "หมัดมังกรผงาดฟ้า", kind: "active", max: 10, pos: [1, 1], req: [["wuxia_fist_flurry", 4]], glyph: "slam", need: KNUCKLE,
        skill: { type: "cone", stat: "atk", mult: lin(1.4, 0.14), hits: 2, stun: () => 0.5, mp: 18, cd: 5, motion: "thrust", reach: 150, arc: 50,
          combo: { after: ["wuxia_fist_flurry", "wuxia_fist_blink"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#ffcf98" },
        desc: (r) => `ชกเสยดั่งมังกรผงาดฟ้าใส่ตัวที่ล็อกไว้ 2 ครั้ง ครั้งละ ${pct(lin(1.4, 0.14)(r))} ของพลังโจมตี มึน 0.5 วิ ใช้ต่อจากหมัดพายุสายฟ้าหรือก้าวพริบตาภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือสนับมือ` },
      { id: "wuxia_fist_cloud", name: "ก้าวเมฆาเตะพายุ", kind: "active", max: 10, pos: [2, 1], req: [["wuxia_fist_blink", 3]], glyph: "spin", need: KNUCKLE,
        skill: { type: "dash", stat: "atk", mult: lin(0.8, 0.08), hits: 3, mp: 20, cd: 7, motion: "swing", distance: 420, width: 100, color: "#ffe8c8" },
        desc: (r) => `เหยียบเมฆาพุ่งไปข้างหน้า 4.2 ม. หมุนตัวเตะทุกตัวที่ผ่าน 3 ครั้ง ครั้งละ ${pct(lin(0.8, 0.08)(r))} ของพลังโจมตี ใช้ได้เมื่อถือสนับมือ` },
      { id: "wuxia_fist_ultimate", name: "หมัดพิฆาตพันลี้", kind: "active", max: 5, pos: [1, 2], req: [["wuxia_fist_dragon", 5], ["wuxia_fist_stance", 1]], glyph: "burst", need: KNUCKLE,
        skill: { type: "cone", stat: "atk", mult: lin(6.1, 0.77), mp: 50, cd: 16, motion: "thrust", reach: 180, arc: 40,
          combo: { after: ["wuxia_fist_dragon"], within: 4, more: () => 0.4 }, color: "#ffa860" },
        desc: (r) => `รวมลมปราณทั้งร่างเป็นหมัดเดียวใส่ตัวที่ล็อกไว้ ${pct(lin(6.1, 0.77)(r))} ของพลังโจมตี ใช้ต่อจากหมัดมังกรผงาดฟ้าภายใน 4 วิ แรงขึ้น 40% ใช้ได้เมื่อถือสนับมือ` },
    ],
  },
};

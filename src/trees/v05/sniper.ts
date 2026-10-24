// The sniper's branches (fourth job, docs/v05_jobs.md, from the hunter, the assassin or the
// shinobi): the gun (a pistol or a rifle: quick bursts, shots that hit many times, bullets that
// sweep a wide area, and the gunner's own drill for rate of fire, aim and criticals; two pistols
// at once fire a burst of their own) and the bow (one prey at a time, shots heavy enough to break
// its armour, and a draw that makes the normal shots and the skills alike go through the armour
// and hit harder; a normal shot now and then lets the armour-piercing arrow fly by itself).
// Eight skills a branch, a little stronger than the third jobs' (the hunter's bow is the measure).
import type { Need, Tree } from "../../progression";
import { pct, lin } from "../util";

const GUNS: Need = { weapons: ["pistol", "rifle"] };
const PISTOLS: Need = { dual: ["pistol"] };
const BOW: Need = { weapons: ["bow"] };

export const SNIPER_TREES: Record<string, Tree> = {
  // ---- the gun: bursts, bullets by the handful, a wide sweep ----
  sniper_gun: {
    name: "สายปืน", cls: null, job4: "sniper", color: "#d0d8b0", glyph: "target",
    note: "ถือปืนสั้นหรือปืนยาว ยิงเร็วหลายนัดต่อครั้ง กระสุนกระจายและกราดยิงเป็นวงกว้าง ยิงปกติมีโอกาสโดนซ้ำ เสริมปืนด้วยความเร็วยิง ความแม่นยำ และคริติคอล ถือปืนสั้นสองกระบอกยิงสลับมือได้อีกท่า กราดยิงต่อกันแรงขึ้น: ยิงรัวสามนัดหรือกระสุนกระจาย → กราดยิงถล่ม → พายุกระสุนรอบทิศ",
    nodes: [
      { id: "sniper_gun_sight", name: "ศูนย์เล็งสไนเปอร์", kind: "passive", max: 10, pos: [0, 0], glyph: "eye", need: GUNS,
        stats: (r) => ({ hit: 2 * r, crit: 0.005 * r }),
        desc: (r) => `ความแม่นยำ +${2 * r} โอกาสคริติคอล +${pct(0.005 * r)} เมื่อถือปืน` },
      { id: "sniper_gun_burst", name: "ยิงรัวสามนัด", kind: "active", max: 10, pos: [1, 0], glyph: "target", need: GUNS,
        skill: { type: "bolt", stat: "atk", mult: lin(0.9, 0.09), hits: 3, every: 0.09, mp: 15, cd: 3.5, motion: "thrust", speed: 2000, range: 650, radius: 22, color: "#ffe6a8" },
        desc: (r) => `ยิงรัว 3 นัดติดกันใส่ตัวที่ล็อกไว้ระยะ 6.5 ม. นัดละ ${pct(lin(0.9, 0.09)(r))} ของพลังโจมตี ใช้ได้เมื่อถือปืน` },
      { id: "sniper_gun_scatter", name: "กระสุนกระจาย", kind: "active", max: 10, pos: [2, 0], glyph: "fan", need: GUNS,
        skill: { type: "fan", stat: "atk", mult: lin(0.95, 0.095), count: 7, spread: 70, mp: 18, cd: 6, motion: "thrust", speed: 1900, range: 580, radius: 22, color: "#ffdc90" },
        desc: (r) => `ยิงกระสุน 7 นัดกระจายเป็นรูปพัดกว้างด้านหน้า นัดละ ${pct(lin(0.95, 0.095)(r))} ของพลังโจมตี ใช้ได้เมื่อถือปืน` },
      // two pistols: one gun in each hand firing in turn, a burst only they can give
      { id: "sniper_gun_twin", name: "ปืนคู่ระห่ำ", kind: "active", max: 10, pos: [3, 0], glyph: "twin", need: PISTOLS,
        skill: { type: "bolt", stat: "atk", mult: lin(0.55, 0.055), hits: 6, every: 0.07, mp: 18, cd: 5, motion: "thrust", speed: 2000, range: 560, radius: 20, color: "#fff0c0" },
        desc: (r) => `ยิงปืนสั้นสองกระบอกสลับมือ 6 นัดรวดใส่ตัวที่ล็อกไว้ระยะ 5.6 ม. นัดละ ${pct(lin(0.55, 0.055)(r))} ของพลังโจมตี ใช้ได้เมื่อถือปืนสั้นทั้งสองมือ` },
      { id: "sniper_gun_trigger", name: "ลั่นไกสายฟ้า", kind: "passive", max: 5, pos: [0, 1], req: [["sniper_gun_sight", 3]], glyph: "bolt", need: GUNS,
        stats: (r) => ({ aspd: 0.02 * r, doubleHit: 0.03 * r }),
        desc: (r) => `ความเร็วยิง +${pct(0.02 * r)} ยิงปกติมีโอกาส ${pct(0.03 * r)} โดนซ้ำอีกนัดทันที เมื่อถือปืน` },
      { id: "sniper_gun_sweep", name: "กราดยิงถล่ม", kind: "active", max: 10, pos: [1, 1], req: [["sniper_gun_burst", 4]], glyph: "burst", need: GUNS,
        skill: { type: "blast", stat: "atk", mult: lin(0.68, 0.068), hits: 4, every: 0.15, mp: 22, cd: 6, motion: "thrust", range: 620, radius: 190, delay: 0.15,
          combo: { after: ["sniper_gun_burst", "sniper_gun_scatter", "sniper_gun_twin"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#ffd890" },
        desc: (r) => `กราดยิงลงจุดที่เล็ง (ไกลสุด 6.2 ม.) รัศมี 1.9 ม. 4 ระลอก ระลอกละ ${pct(lin(0.68, 0.068)(r))} ของพลังโจมตี ใช้ต่อจากยิงรัวสามนัด กระสุนกระจาย หรือปืนคู่ระห่ำภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือปืน` },
      { id: "sniper_gun_drill", name: "จังหวะมือปืน", kind: "active", max: 5, pos: [2, 1], req: [["sniper_gun_scatter", 3]], glyph: "up", need: GUNS,
        skill: { type: "buff", mp: 28, cd: 35, motion: "cast", duration: 15, buff: (r) => ({ aspd: 0.08 + 0.025 * r, hit: 8 + 4 * r, crit: 0.02 + 0.006 * r }), color: "#f0f0b0" },
        desc: (r) => `15 วิ: ความเร็วยิง +${pct(0.08 + 0.025 * r)} ความแม่นยำ +${8 + 4 * r} โอกาสคริติคอล +${pct(0.02 + 0.006 * r)} ใช้ได้เมื่อถือปืน` },
      { id: "sniper_gun_storm", name: "พายุกระสุนรอบทิศ", kind: "active", max: 5, pos: [1, 2], req: [["sniper_gun_sweep", 5], ["sniper_gun_drill", 1]], glyph: "storm", need: GUNS,
        skill: { type: "storm", stat: "atk", mult: lin(0.85, 0.105), pulses: 6, every: 0.18, mp: 52, cd: 16, motion: "thrust", radius: 300,
          combo: { after: ["sniper_gun_sweep"], within: 4, more: () => 0.35 }, color: "#fff2c8" },
        desc: (r) => `หมุนตัวกราดยิงรอบทิศรัศมี 3 ม. 6 ระลอก ระลอกละ ${pct(lin(0.85, 0.105)(r))} ของพลังโจมตี ใช้ต่อจากกราดยิงถล่มภายใน 4 วิ แรงขึ้น 35% ใช้ได้เมื่อถือปืน` },
    ],
  },
  // ---- the bow: one prey, through its armour, the normal shots as strong as the skills ----
  sniper_bow: {
    name: "สายธนู", cls: null, job4: "sniper", color: "#b8d090", glyph: "arrow",
    note: "ถือธนูยิงเป้าเดียวแรงจากระยะไกลสุดตา ศรทะลุเกราะทำให้เป้ารับดาเมจเพิ่ม เสริมทั้งยิงปกติและสกิลให้เจาะเกราะและแรงขึ้น ยิงปกติแล้วศรเจาะเกราะยิงตามออกไปเองได้ ยิงต่อกันแรงขึ้น: ศรเจาะเกราะหรือศรทะลวงแนว → ศรทลายเกราะ → ศรสังหารสุดขอบฟ้า ยิงได้ไกลถึง 12 ม.",
    nodes: [
      { id: "sniper_bow_weakpoint", name: "เล็งช่องเกราะ", kind: "passive", max: 10, pos: [0, 0], glyph: "eye", need: BOW,
        stats: (r) => ({ pierce: 0.013 * r, critDmg: 0.03 * r }),
        desc: (r) => `เจาะเกราะ +${pct(0.013 * r)} แรงคริติคอล +${pct(0.03 * r)} ทั้งยิงปกติและสกิล เมื่อถือธนู` },
      { id: "sniper_bow_pierce", name: "ศรเจาะเกราะ", kind: "active", max: 10, pos: [1, 0], glyph: "pierce", need: BOW,
        skill: { type: "bolt", stat: "atk", mult: lin(2.3, 0.23), expose: (r) => 0.05 + 0.007 * r, debuff: 6, arrow: true, mp: 16, cd: 4, motion: "shoot", speed: 1800, range: 900, radius: 26, color: "#e8f0c0" },
        desc: (r) => `ยิงศรหัวเหล็กกล้าใส่ตัวที่ล็อกไว้ระยะ 9 ม. ${pct(lin(2.3, 0.23)(r))} ของพลังโจมตี เกราะของมันร้าวจนรับดาเมจเพิ่ม ${pct(0.05 + 0.007 * r)} 6 วิ ใช้ได้เมื่อถือธนู` },
      { id: "sniper_bow_draw", name: "ง้างสุดคันศร", kind: "passive", max: 10, pos: [2, 0], glyph: "up", need: BOW,
        stats: (r) => ({ atkPct: 0.008 * r, dmg: 0.008 * r }),
        desc: (r) => `พลังโจมตี +${pct(0.008 * r)} ดาเมจ +${pct(0.008 * r)} ทั้งยิงปกติและสกิล เมื่อถือธนู` },
      { id: "sniper_bow_lance", name: "ศรทะลวงแนว", kind: "active", max: 10, pos: [3, 0], glyph: "beam", need: BOW,
        skill: { type: "bolt", stat: "atk", mult: lin(2.3, 0.23), pierce: true, arrow: true, mp: 18, cd: 6, motion: "shoot", speed: 1900, range: 1000, radius: 34, color: "#f0f8d0" },
        desc: (r) => `ยิงศรทะลุทุกตัวในแนวยาว 10 ม. ตัวละ ${pct(lin(2.3, 0.23)(r))} ของพลังโจมตี ใช้ได้เมื่อถือธนู` },
      // the normal shot looses the armour-piercing arrow by itself now and then (autocast)
      { id: "sniper_bow_follow", name: "ศรตามติดเงา", kind: "passive", max: 5, pos: [0, 1], req: [["sniper_bow_weakpoint", 3], ["sniper_bow_pierce", 1]], glyph: "swirl", need: BOW,
        stats: (r) => ({ autocast_sniper_bow_pierce: 0.025 * r, crit: 0.006 * r }),
        desc: (r) => `ยิงปกติโดนแล้วมีโอกาส ${pct(0.025 * r)} ที่ศรเจาะเกราะยิงตามออกไปเองฟรี (ระดับที่เรียนไว้ ไม่เสีย MP ไม่ติดคูลดาวน์) โอกาสคริติคอล +${pct(0.006 * r)} เมื่อถือธนู` },
      { id: "sniper_bow_shatter", name: "ศรทลายเกราะ", kind: "active", max: 10, pos: [1, 1], req: [["sniper_bow_pierce", 4]], glyph: "target", need: BOW,
        skill: { type: "bolt", stat: "atk", mult: lin(2.5, 0.25), stun: () => 0.5, expose: (r) => 0.08 + 0.012 * r, debuff: 8, arrow: true, mp: 20, cd: 6, motion: "shoot", speed: 1900, range: 950, radius: 28,
          combo: { after: ["sniper_bow_pierce", "sniper_bow_lance"], within: 4, more: (r) => 0.25 + 0.03 * r }, color: "#fff4c0" },
        desc: (r) => `ยิงศรหนักใส่ตัวที่ล็อกไว้ระยะ 9.5 ม. ${pct(lin(2.5, 0.25)(r))} ของพลังโจมตี มึน 0.5 วิ เกราะแตกจนรับดาเมจเพิ่ม ${pct(0.08 + 0.012 * r)} 8 วิ ใช้ต่อจากศรเจาะเกราะหรือศรทะลวงแนวภายใน 4 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือธนู` },
      { id: "sniper_bow_focus", name: "สมาธิพลซุ่มยิง", kind: "active", max: 5, pos: [2, 1], req: [["sniper_bow_draw", 3]], glyph: "eye", need: BOW,
        skill: { type: "buff", mp: 28, cd: 35, motion: "cast", duration: 15, buff: (r) => ({ pierce: 0.08 + 0.02 * r, atkPct: 0.06 + 0.02 * r, critDmg: 0.1 + 0.03 * r }), color: "#e0f0a8" },
        desc: (r) => `15 วิ: เจาะเกราะ +${pct(0.08 + 0.02 * r)} พลังโจมตี +${pct(0.06 + 0.02 * r)} แรงคริติคอล +${pct(0.1 + 0.03 * r)} ทั้งยิงปกติและสกิล ใช้ได้เมื่อถือธนู` },
      { id: "sniper_bow_horizon", name: "ศรสังหารสุดขอบฟ้า", kind: "active", max: 5, pos: [1, 2], req: [["sniper_bow_shatter", 5], ["sniper_bow_focus", 1]], glyph: "skull", need: BOW,
        skill: { type: "bolt", stat: "atk", mult: lin(6.0, 0.75), stun: () => 1, arrow: true, mp: 54, cd: 15, motion: "shoot", speed: 2200, range: 1200, radius: 30,
          combo: { after: ["sniper_bow_shatter"], within: 4, more: () => 0.4 }, color: "#fffbe0" },
        desc: (r) => `ยิงศรสุดแรงใส่ตัวที่ล็อกไว้ระยะ 12 ม. ${pct(lin(6.0, 0.75)(r))} ของพลังโจมตี มึน 1 วิ ใช้ต่อจากศรทลายเกราะภายใน 4 วิ แรงขึ้น 40% ใช้ได้เมื่อถือธนู` },
    ],
  },
};

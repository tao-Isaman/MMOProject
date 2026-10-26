// The ranger's branches (นายพราน, taken by archers and warriors at level 30): the falconer with
// a falcon at their side and the longest bow shots, the trapper with traps, tracking and a
// hunting knife, and the venomer who fights with poison close and far.
import type { Tree } from "../progression";
import { pct, lin } from "./util";

export const RANGER_TREES: Record<string, Tree> = {
  // ---- falconer: the falcon helps every hit, falcon dives and storms, bow shots from far off ----
  falconer: {
    name: "สายนักล่า", cls: null, job: "ranger", color: "#f0a860", glyph: "wing",
    note: "เหยี่ยวคู่ใจโฉบช่วยตี สั่งเหยี่ยวโฉบ พายุเหยี่ยว ราชันเหยี่ยว และยิงธนูจากระยะไกลสุดสายตา",
    nodes: [
      { id: "falcon_bond", name: "เหยี่ยวคู่ใจ", kind: "passive", max: 10, pos: [0, 0], glyph: "wing",
        stats: (r) => ({ falconChance: 0.021 * r, falconPower: 0.35 + 0.035 * r }),
        desc: (r) => `เหยี่ยวคู่ใจบินตาม ตีปกติมีโอกาส ${pct(0.021 * r)} ให้เหยี่ยวโฉบลงมาช่วยตี 5 ครั้ง ครั้งละ ${pct(0.35 + 0.035 * r)} ของพลังโจมตี` },
      { id: "falcon_dive", name: "เหยี่ยวโฉบ", kind: "active", max: 10, pos: [1, 0], glyph: "wing",
        skill: { type: "falcon", stat: "atk", mult: lin(0.91, 0.091), hits: 2, range: 650, mp: 12, cd: 3, motion: "thrust", color: "#ffd8a8" },
        desc: (r) => `สั่งเหยี่ยวโฉบใส่เป้าหมายที่ล็อกไว้ (ระยะ 6.5 ม.) 2 ครั้ง ครั้งละ ${pct(lin(0.91, 0.091)(r))} ของพลังโจมตี` },
      { id: "skyline_shot", name: "ศรเส้นขอบฟ้า", kind: "active", max: 10, pos: [2, 0], glyph: "arrow", need: { weapons: ["bow"] },
        skill: { type: "bolt", stat: "atk", mult: lin(1.68, 0.154), arrow: true, mp: 12, cd: 3, motion: "shoot", speed: 2000, range: 1050, radius: 28, color: "#fff0c8" },
        desc: (r) => `เมื่อถือธนู: ยิงศรเล็งไกลใส่เป้าหมายได้ถึง 10.5 ม. ดาเมจ ${pct(lin(1.68, 0.154)(r))} ของพลังโจมตี` },
      { id: "falcon_storm", name: "พายุเหยี่ยว", kind: "active", max: 5, pos: [1, 1], req: [["falcon_dive", 3]], glyph: "storm",
        skill: { type: "blast", stat: "atk", mult: lin(0.91, 0.098), hits: 5, every: 0.25, mp: 36, cd: 14, motion: "thrust", range: 700, radius: 230, delay: 0.3, color: "#ffc890" },
        desc: (r) => `ปล่อยฝูงเหยี่ยวโฉบวนใส่จุดที่เล็ง (ไกลสุด 7 ม.) รัศมี 2.3 ม. 5 ระลอก ระลอกละ ${pct(lin(0.91, 0.098)(r))} ของพลังโจมตี` },
      { id: "falcon_sovereign", name: "ราชันเหยี่ยว", kind: "active", max: 5, pos: [1, 2], req: [["falcon_dive", 5], ["falcon_bond", 5]], glyph: "star",
        skill: { type: "falcon", stat: "atk", mult: lin(0.91, 0.105), hits: 6, expose: () => 0.2, debuff: 12, range: 750, mp: 50, cd: 18, motion: "thrust", color: "#ffc070" },
        desc: (r) => `เหยี่ยวราชันโฉบใส่เป้าหมาย (ระยะ 7.5 ม.) 6 ครั้ง ครั้งละ ${pct(lin(0.91, 0.105)(r))} ของพลังโจมตี ศัตรูโดนแรงขึ้น 20% 12 วิ` },
      { id: "falcon_training", name: "ฝึกเหยี่ยว", kind: "passive", max: 5, pos: [0, 1], req: [["falcon_bond", 3]], glyph: "wing",
        stats: (r) => ({ falconChance: 0.01 * r }),
        desc: (r) => `โอกาสที่เหยี่ยวคู่ใจโฉบลงมาช่วยตีเมื่อตีปกติ +${pct(0.01 * r)}` },
    ],
  },
  // ---- trapper: traps that hold, blow up, freeze and poison; marking prey; the hunting knife ----
  trapper: {
    name: "สายวางกับดัก", cls: null, job: "ranger", color: "#c8b48a", glyph: "thorn",
    note: "วางกับดักบ่วง ระเบิด และน้ำแข็ง แกะรอยเหยื่อ ปิดท้ายด้วยกับดักระเบิดลูกใหญ่",
    nodes: [
      { id: "ankle_snare", name: "บ่วงรัดข้อเท้า", kind: "active", max: 10, pos: [0, 0], glyph: "thorn",
        skill: { type: "trap", stat: "atk", mult: lin(0.84, 0.084), stun: lin(1.8, 0.2), range: 450, radius: 110, duration: 25, mp: 10, cd: 5, motion: "thrust", color: "#e0d0a8" },
        desc: (r) => `วางบ่วงที่จุดที่เล็ง (ไกลสุด 4.5 ม.) ตัวแรกที่เหยียบทำให้บ่วงรัดทุกตัวในรัศมี 1.1 ม. ดาเมจ ${pct(lin(0.84, 0.084)(r))} ของพลังโจมตี ขยับไม่ได้ ${lin(1.8, 0.2)(r).toFixed(1)} วิ · กับดักรอ 25 วิ วางได้พร้อมกัน 3 อัน` },
      { id: "powder_trap", name: "กับดักดินระเบิด", kind: "active", max: 10, pos: [1, 0], glyph: "flame",
        skill: { type: "trap", stat: "atk", element: "fire", mult: lin(1.96, 0.182), knock: 120, range: 450, radius: 150, duration: 20, mp: 16, cd: 7, motion: "thrust", color: "#ffa060" },
        desc: (r) => `วางกับดักดินระเบิด (ไกลสุด 4.5 ม.) ตัวแรกที่เหยียบจุดระเบิดรัศมี 1.5 ม. ดาเมจ ${pct(lin(1.96, 0.182)(r))} ของพลังโจมตี (ธาตุไฟ) ผลักกระเด็น · รอ 20 วิ` },
      { id: "prey_tracking", name: "แกะรอยเหยื่อ", kind: "passive", max: 10, pos: [2, 0], glyph: "eye",
        stats: (r) => ({ huntDmg: 0.021 * r, hit: 2.1 * r }),
        desc: (r) => `ดาเมจใส่ศัตรูที่ติดสถานะผิดปกติ +${pct(0.021 * r)} ความแม่นยำ +${+(2.1 * r).toFixed(1)}` },
      { id: "rime_trap", name: "กับดักน้ำแข็ง", kind: "active", max: 10, pos: [0, 1], req: [["ankle_snare", 3]], glyph: "freeze",
        skill: { type: "trap", stat: "atk", element: "ice", mult: lin(1.12, 0.105), freeze: lin(1.5, 0.1), range: 450, radius: 130, duration: 20, mp: 18, cd: 10, motion: "thrust", color: "#a8e0ff" },
        desc: (r) => `วางกับดักน้ำแข็ง (ไกลสุด 4.5 ม.) ตัวแรกที่เหยียบทำให้ทุกตัวในรัศมี 1.3 ม. โดน ${pct(lin(1.12, 0.105)(r))} ของพลังโจมตี (ธาตุน้ำแข็ง) แช่แข็ง ${lin(1.5, 0.1)(r).toFixed(1)} วิ · รอ 20 วิ` },
      { id: "trap_artisan", name: "ช่างกับดัก", kind: "passive", max: 5, pos: [2, 1], req: [["prey_tracking", 3]], glyph: "up",
        stats: (r) => ({ dmg: 0.021 * r, cdr: 0.014 * r }),
        desc: (r) => `ดาเมจ +${pct(0.021 * r)} ลดคูลดาวน์ ${pct(0.014 * r)}` },
      { id: "chain_blast_trap", name: "กับดักระเบิดลูกใหญ่", kind: "active", max: 5, pos: [1, 2], req: [["powder_trap", 5], ["rime_trap", 3]], glyph: "burst",
        skill: { type: "trap", stat: "atk", element: "fire", mult: lin(3.15, 0.42), stun: () => 1.5, knock: 150, range: 450, radius: 230, duration: 20, mp: 45, cd: 18, motion: "thrust", color: "#ff8a50" },
        desc: (r) => `วางกับดักระเบิดลูกใหญ่ (ไกลสุด 4.5 ม.) ตัวแรกที่เหยียบจุดระเบิดรัศมี 2.3 ม. ดาเมจ ${pct(lin(3.15, 0.42)(r))} ของพลังโจมตี (ธาตุไฟ) มึน 1.5 วิ ผลักกระเด็น · รอ 20 วิ` },
    ],
  },
  // ---- venomer: poison element blows and darts, stronger and easier poison, setting it off ----
  venomer: {
    name: "สายวางยาพิษ", cls: null, job: "ranger", color: "#a6e65a", glyph: "drop",
    note: "โจมตีธาตุพิษทั้งระยะประชิดและระยะไกล พิษแรงและติดง่าย หมอกพิษ และจุดพิษให้ระเบิด",
    nodes: [
      { id: "venom_fang", name: "เขี้ยวพิษ", kind: "active", max: 10, pos: [0, 0], glyph: "pierce",
        skill: { type: "cone", stat: "atk", element: "poison", mult: lin(1.12, 0.105), poison: lin(0.8, 0.08), mp: 8, cd: 2, motion: "thrust", reach: 150, arc: 45, color: "#b8f080" },
        desc: (r) => `แทงอาบพิษใส่ตัวข้างหน้า ดาเมจ ${pct(lin(1.12, 0.105)(r))} ของพลังโจมตี (ธาตุพิษ) แล้วพิษกัดอีก ${pct(lin(0.8, 0.08)(r))} ของดาเมจใน 4 วิ` },
      { id: "venom_dart", name: "ลูกดอกพิษ", kind: "active", max: 10, pos: [1, 0], glyph: "arrow",
        skill: { type: "bolt", stat: "atk", element: "poison", mult: lin(0.98, 0.091), poison: lin(0.9, 0.09), mp: 9, cd: 2.5, motion: "thrust", speed: 1400, range: 700, radius: 24, color: "#a6e65a" },
        desc: (r) => `ปาลูกดอกพิษใส่เป้าหมาย (ระยะ 7 ม.) ดาเมจ ${pct(lin(0.98, 0.091)(r))} ของพลังโจมตี (ธาตุพิษ) แล้วพิษกัดอีก ${pct(lin(0.9, 0.09)(r))} ของดาเมจใน 4 วิ` },
      { id: "venom_lore", name: "ตำรายาพิษ", kind: "passive", max: 10, pos: [2, 0], glyph: "scroll",
        stats: (r) => ({ poisonPct: 0.035 * r, poisonAtk: 1.4 * r }),
        desc: (r) => `ดาเมจพิษ +${pct(0.035 * r)} พลังโจมตีธาตุพิษ +${+(1.4 * r).toFixed(1)}` },
      { id: "miasma_flask", name: "ขวดหมอกพิษ", kind: "active", max: 10, pos: [1, 1], req: [["venom_dart", 3]], glyph: "swirl",
        skill: { type: "blast", stat: "atk", element: "poison", mult: lin(0.56, 0.056), poison: lin(0.56, 0.056), hits: 3, every: 0.5, mp: 22, cd: 9, motion: "thrust", range: 600, radius: 190, delay: 0.3, color: "#98d860" },
        desc: (r) => `ปาขวดหมอกพิษใส่จุดที่เล็ง (ไกลสุด 6 ม.) รัศมี 1.9 ม. 3 ระลอก ระลอกละ ${pct(lin(0.56, 0.056)(r))} ของพลังโจมตี (ธาตุพิษ) และพิษ ${pct(lin(0.56, 0.056)(r))} ของดาเมจ` },
      { id: "toxic_eruption", name: "พิษปะทุ", kind: "active", max: 5, pos: [1, 2], req: [["miasma_flask", 5], ["venom_lore", 3]], glyph: "earth",
        skill: { type: "blast", stat: "atk", element: "poison", mult: lin(2.52, 0.315), detonate: lin(1, 0.12), mp: 50, cd: 18, motion: "thrust", range: 700, radius: 240, delay: 0.5, color: "#c0f050" },
        desc: (r) => `พิษปะทุใส่ทุกตัวรอบจุดที่เล็ง (ไกลสุด 7 ม.) รัศมี 2.4 ม. ดาเมจ ${pct(lin(2.52, 0.315)(r))} ของพลังโจมตี (ธาตุพิษ) แล้วพิษที่ค้างในตัวมันระเบิดทันที แรง ${pct(lin(1, 0.12)(r))} ของพิษที่เหลือ` },
      { id: "venom_predator", name: "นักล่าอาบพิษ", kind: "passive", max: 5, pos: [0, 1], req: [["venom_fang", 3]], glyph: "pierce",
        stats: (r) => ({ huntDmg: 0.02 * r, move: 0.01 * r }),
        desc: (r) => `ดาเมจใส่ศัตรูที่ติดสถานะผิดปกติ +${pct(0.02 * r)} ความเร็วเดิน +${pct(0.01 * r)}` },
    ],
  },
};

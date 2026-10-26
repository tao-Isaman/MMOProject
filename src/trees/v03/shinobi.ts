// The shinobi's branches (third job, from any second job): the spy (kunai and shuriken thrown
// from the belt, quick feet and a shadow's dash, hiding in a smoke bomb, and the first throw
// from hiding landing far harder) and the blade (a dagger or a one-handed sword, fast cuts in
// forms that chain, shadow clones that fight beside her). Seven skills a branch, two of them
// passives: both fight with many moves. The spy asks for no weapon, so a shinobi from any
// second job can throw; the blade's cuts ask for the dagger or the one-handed sword, its clones swing
// whatever she holds.
import type { Need, Tree } from "../../progression";
import { pct, lin } from "../util";

const BLADES: Need = { weapons: ["dagger", "sword_1h"] };

export const SHINOBI_TREES: Record<string, Tree> = {
  // ---- the spy: thrown steel, quick feet, a blow from hiding ----
  shinobi_spy: {
    name: "นินจาสายลับ", cls: null, job3: "shinobi", color: "#8aa0c8", glyph: "eye",
    note: "ไม่ต้องใช้อาวุธเฉพาะ ซัดคุไนและดาวกระจายจากระยะไกล เดินเร็ว พุ่งเป็นเงาผ่านศัตรู ปาระเบิดควันลงเท้าซ่อนตัวแล้วลอบโจมตีจากที่ซ่อนให้แรงเป็นพิเศษ ท่าซัดต่อกันแรงขึ้น: ซัดคุไนหรือวิชาก้าวเงา → ดาวกระจายห้าแฉก → คุไนสังหารเงาจันทร์",
    nodes: [
      { id: "shinobi_spy_kunai", name: "ซัดคุไน", kind: "active", max: 10, pos: [1, 0], glyph: "pierce",
        skill: { type: "bolt", stat: "atk", mult: lin(2.0, 0.2), mp: 12, cd: 4, motion: "thrust", speed: 1500, range: 700, radius: 24, color: "#d8dce4" },
        desc: (r) => `ซัดคุไนใส่ตัวที่ล็อกไว้ระยะ 7 ม. ${pct(lin(2.0, 0.2)(r))} ของพลังโจมตี ใช้ได้กับทุกอาวุธ` },
      { id: "shinobi_spy_steps", name: "ฝีเท้าไร้เสียง", kind: "passive", max: 10, pos: [0, 0], glyph: "shoes",
        stats: (r) => ({ move: 0.006 * r, ambush: 0.03 * r }),
        desc: (r) => `ความเร็วเดิน +${pct(0.006 * r)} การโจมตีจากที่ซ่อนแรงขึ้น ${pct(0.03 * r)}` },
      { id: "shinobi_spy_step", name: "วิชาก้าวเงา", kind: "active", max: 10, pos: [2, 0], glyph: "dash",
        skill: { type: "dash", stat: "atk", mult: lin(1.9, 0.19), mp: 14, cd: 6, motion: "thrust", distance: 380, width: 70, color: "#9ab0d8" },
        desc: (r) => `พุ่งเป็นเงาไปทางที่เล็ง 3.8 ม. ฟันทุกตัวที่ผ่าน ${pct(lin(1.9, 0.19)(r))} ของพลังโจมตี` },
      // a small cloud at her feet, quick to throw again: away from a fight, or back into hiding
      { id: "shinobi_spy_smoke", name: "ระเบิดควันนินจา", kind: "active", max: 5, pos: [0, 1], req: [["shinobi_spy_steps", 3]], glyph: "cloud",
        skill: { type: "smoke", radius: 200, duration: 8, buff: (r) => ({ crit: 0.01 * r, ambush: 0.06 * r }), mp: 16, cd: 16, motion: "cast", color: "#9aa4b8" },
        desc: (r) => `ปาระเบิดควันลงเท้า รัศมี 2 ม. อยู่ 8 วิ ยืนในควันคือซ่อนตัว โอกาสคริติคอล +${pct(0.01 * r)} การโจมตีจากที่ซ่อนแรงขึ้น ${pct(0.06 * r)} ตีออกไปแล้วโผล่ให้เห็นครู่หนึ่ง แล้วควันซ่อนให้อีก` },
      { id: "shinobi_spy_shuriken", name: "ดาวกระจายห้าแฉก", kind: "active", max: 10, pos: [1, 1], req: [["shinobi_spy_kunai", 4]], glyph: "fan",
        skill: { type: "fan", stat: "atk", mult: lin(1.0, 0.1), count: 5, spread: 50, mp: 18, cd: 6, motion: "thrust", speed: 1300, range: 620, radius: 26,
          combo: { after: ["shinobi_spy_kunai", "shinobi_spy_step"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#c8d0e0" },
        desc: (r) => `ซัดดาวกระจาย 5 ดอกเป็นรูปพัด ดอกละ ${pct(lin(1.0, 0.1)(r))} ของพลังโจมตี ใช้ต่อจากซัดคุไนหรือวิชาก้าวเงาภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)}` },
      { id: "shinobi_spy_wrist", name: "ข้อมือซัดแม่น", kind: "passive", max: 10, pos: [2, 1], req: [["shinobi_spy_kunai", 3]], glyph: "target",
        stats: (r) => ({ hit: 2 * r, critDmg: 0.02 * r }),
        desc: (r) => `ความแม่นยำ +${2 * r} แรงคริติคอล +${pct(0.02 * r)}` },
      { id: "shinobi_spy_moon", name: "คุไนสังหารเงาจันทร์", kind: "active", max: 5, pos: [1, 2], req: [["shinobi_spy_shuriken", 5], ["shinobi_spy_smoke", 1]], glyph: "skull",
        skill: { type: "bolt", stat: "atk", mult: lin(5.2, 0.65), mp: 42, cd: 15, motion: "thrust", speed: 1700, range: 800, radius: 30,
          combo: { after: ["shinobi_spy_shuriken", "shinobi_spy_step"], within: 3, more: () => 0.35 }, color: "#e8ecff" },
        desc: (r) => `ซัดคุไนเงาจันทร์ใส่ตัวที่ล็อกไว้ระยะ 8 ม. ${pct(lin(5.2, 0.65)(r))} ของพลังโจมตี ใช้ต่อจากดาวกระจายห้าแฉกหรือวิชาก้าวเงาภายใน 3 วิ แรงขึ้น 35% (ซัดจากที่ซ่อนได้โบนัสซ่อนตัวด้วย)` },
    ],
  },
  // ---- the blade: dagger or sword, forms that chain, shadow clones ----
  shinobi_combat: {
    name: "นินจาต่อสู้", cls: null, job3: "shinobi", color: "#a0b8e0", glyph: "twin",
    note: "ถือมีดสั้นหรือดาบมือเดียว ฟันเร็วหลายจังหวะเป็นกระบวนท่าที่แรงขึ้นเมื่อใช้ต่อกัน: จันทร์เสี้ยวหรือพริบตาฟันผ่าน → ลมหวนกรีด → พันเงาพิฆาต และแยกเงาเป็นร่างแยกที่ฟันตามเรา",
    nodes: [
      { id: "shinobi_combat_crescent", name: "จันทร์เสี้ยว", kind: "active", max: 10, pos: [1, 0], glyph: "fan", need: BLADES,
        skill: { type: "cone", stat: "atk", mult: lin(1.0, 0.1), hits: 2, mp: 12, cd: 3, motion: "swing", reach: 160, arc: 110, color: "#c8d8f8" },
        desc: (r) => `ฟันเป็นรูปจันทร์เสี้ยวด้านหน้า 1.6 ม. 2 ครั้งรวด ครั้งละ ${pct(lin(1.0, 0.1)(r))} ของพลังโจมตี ใช้ได้เมื่อถือมีดสั้นหรือดาบมือเดียว` },
      { id: "shinobi_combat_way", name: "วิถีคมสั้น", kind: "passive", max: 10, pos: [2, 0], glyph: "up", need: BLADES,
        stats: (r) => ({ aspd: 0.012 * r, crit: 0.003 * r }),
        desc: (r) => `ความเร็วโจมตี +${pct(0.012 * r)} โอกาสคริติคอล +${pct(0.003 * r)} เมื่อถือมีดสั้นหรือดาบมือเดียว` },
      { id: "shinobi_combat_flash", name: "พริบตาฟันผ่าน", kind: "active", max: 10, pos: [0, 1], req: [["shinobi_combat_crescent", 1]], glyph: "dash", need: BLADES,
        skill: { type: "dash", stat: "atk", mult: lin(0.95, 0.095), hits: 2, mp: 14, cd: 6, motion: "thrust", distance: 300, width: 70, color: "#b0c4f0" },
        desc: (r) => `พุ่งผ่านไปทางที่เล็ง 3 ม. ทุกตัวที่ผ่านโดนฟัน 2 ครั้ง ครั้งละ ${pct(lin(0.95, 0.095)(r))} ของพลังโจมตี ใช้ได้เมื่อถือมีดสั้นหรือดาบมือเดียว` },
      { id: "shinobi_combat_whirl", name: "ลมหวนกรีด", kind: "active", max: 10, pos: [1, 1], req: [["shinobi_combat_crescent", 4]], glyph: "storm", need: BLADES,
        skill: { type: "cone", stat: "atk", mult: lin(0.8, 0.08), hits: 3, mp: 16, cd: 5, motion: "swing", reach: 170, arc: 50,
          combo: { after: ["shinobi_combat_crescent", "shinobi_combat_flash"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#d0e0ff" },
        desc: (r) => `ฟันวนกลับใส่ตัวที่ล็อกไว้ 3 ครั้ง ครั้งละ ${pct(lin(0.8, 0.08)(r))} ของพลังโจมตี ใช้ต่อจากจันทร์เสี้ยวหรือพริบตาฟันผ่านภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือมีดสั้นหรือดาบมือเดียว` },
      // her look, cutting at her target with whatever she holds (`mult` of her normal hit)
      { id: "shinobi_combat_clones", name: "วิชาแยกเงา", kind: "active", max: 10, pos: [2, 1], req: [["shinobi_combat_way", 1]], glyph: "person",
        skill: { type: "summon", ally: "clone", mult: lin(0.45, 0.045), base: lin(0.25, 0.025), count: 2, duration: 18, mp: 26, cd: 14, motion: "cast", color: "#8aa0d8" },
        desc: (r) => `แยกเงาออกมาเป็นร่างแยก อยู่ 18 วิ (มีได้ 2 ร่าง) ฟันตัวที่เราตีด้วยอาวุธที่ถืออยู่ แรง ${pct(lin(0.45, 0.045)(r))} ของการตีปกติ HP ${pct(lin(0.25, 0.025)(r))} ของ HP สูงสุด` },
      { id: "shinobi_combat_kinship", name: "เงาร่วมใจ", kind: "passive", max: 5, pos: [2, 2], req: [["shinobi_combat_clones", 3]], glyph: "twin",
        stats: (r) => ({ allyPct: 0.03 * r }),
        desc: (r) => `ร่างแยก (ผู้ช่วยทุกแบบ) HP และแรงตี +${pct(0.03 * r)}` },
      { id: "shinobi_combat_thousand", name: "พันเงาพิฆาต", kind: "active", max: 5, pos: [1, 2], req: [["shinobi_combat_whirl", 5], ["shinobi_combat_clones", 1]], glyph: "star", need: BLADES,
        skill: { type: "cone", stat: "atk", mult: lin(0.9, 0.11), hits: 6, mp: 45, cd: 15, motion: "swing", reach: 180, arc: 50,
          combo: { after: ["shinobi_combat_whirl"], within: 3, more: () => 0.35 }, color: "#e0e8ff" },
        desc: (r) => `ร่างเงานับพันฟันตัวที่ล็อกไว้ 6 ครั้งรวด ครั้งละ ${pct(lin(0.9, 0.11)(r))} ของพลังโจมตี ใช้ต่อจากลมหวนกรีดภายใน 3 วิ แรงขึ้น 35% ใช้ได้เมื่อถือมีดสั้นหรือดาบมือเดียว` },
    ],
  },
};

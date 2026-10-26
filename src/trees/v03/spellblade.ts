// The spellblade's branches (third job, from the battlemage, the wizard or the swordsman): the
// rift (a sword of darkness on attack and magic attack together, sure to land like a spell:
// cuts that tear space open where they aim, a step through it, a wave down a line and a
// collapse all round, each a little harder right after the one before) and the empowered blade
// (lightning or earth laid on the weapon, every element's attack raised, and three sword forms
// in no set order: each lands harder right after either of the others, and a flurry closes
// after any of them, in whatever element the weapon holds). Ten skills a branch, four of them passives, a little
// stronger than the second jobs'.
import type { Need, Tree } from "../../progression";
import { ELEMENT_IDS } from "../../progression";
import { pct, lin } from "../util";

const SWORDS: Need = { weapons: ["sword_1h", "sword_2h"] };
// What a "both" skill's number is a share of (stat: "both": 0.6 of attack and of magic attack).
const MIX = "พลังผสม (60% ของพลังโจมตี + 60% ของพลังเวท)";
const n1 = (v: number) => +v.toFixed(1);
// The same attack in every element (read when a rank is asked for: progression.ts imports the
// trees, so ELEMENT_IDS isn't there yet while this module loads).
const EVERY_ELEMENT = (v: number) => Object.fromEntries(ELEMENT_IDS.map((e) => [`${e}Atk`, v]));
// The empowered blade's three forms: each one follows either of the other two.
const FORMS = ["spellblade_empower_imprint", "spellblade_empower_burst", "spellblade_empower_wave"];
const others = (id: string) => FORMS.filter((f) => f !== id);

export const SPELLBLADE_TREES: Record<string, Tree> = {
  // ---- the rift: sword and spell as one, darkness, space cut open ----
  spellblade_rift: {
    name: "ดาบผ่ามิติ", cls: null, job3: "spellblade", color: "#b090ff", glyph: "wave",
    note: "ถือดาบ ฟันด้วยพลังโจมตีและพลังเวทรวมกัน (โดนแน่นอนเหมือนเวท) เป็นธาตุความมืด ฉีกรอยแยกมิติตรงจุดที่เล็งให้ศัตรูรับดาเมจเพิ่ม ก้าวข้ามมิติฟันทุกตัวที่ผ่าน ม่านมิติหลบทั้งกายภาพและเวท ฟันรอยแยก → รอยแยกกลืนกิน → คลื่นดาบทะลุมิติ → มิติล่มสลาย แรงขึ้นเมื่อใช้ต่อกัน",
    nodes: [
      { id: "spellblade_rift_insight", name: "ญาณมิติ", kind: "passive", max: 10, pos: [0, 0], glyph: "eye", need: SWORDS,
        stats: (r) => ({ atkPct: 0.012 * r, matkPct: 0.012 * r, darkAtk: r, shadowAtk: r }),
        desc: (r) => `พลังโจมตีและพลังเวท +${pct(0.012 * r)} พลังโจมตีธาตุความมืดและธาตุเงา +${r} เมื่อถือดาบ` },
      { id: "spellblade_rift_slash", name: "ฟันรอยแยก", kind: "active", max: 10, pos: [1, 0], glyph: "sword", need: SWORDS,
        skill: { type: "cone", stat: "both", element: "dark", mult: lin(2.0, 0.2), mp: 14, cd: 4, motion: "swing", reach: 190, arc: 50, color: "#c0a0ff" },
        desc: (r) => `ฟันดาบอาบความมืดใส่ตัวที่ล็อกไว้จนมิติปริ ${pct(lin(2.0, 0.2)(r))} ของ${MIX} โดนแน่นอนเหมือนเวท ใช้ได้เมื่อถือดาบ` },
      { id: "spellblade_rift_step", name: "ก้าวข้ามมิติ", kind: "active", max: 10, pos: [2, 0], glyph: "dash", need: SWORDS,
        skill: { type: "dash", stat: "both", element: "shadow", mult: lin(1.9, 0.19), mp: 16, cd: 7, motion: "thrust", distance: 360, width: 80, color: "#9a80e8" },
        desc: (r) => `ฉีกมิติก้าวไปทางที่เล็ง 3.6 ม. ฟันทุกตัวที่ผ่านด้วยธาตุเงา ${pct(lin(1.9, 0.19)(r))} ของ${MIX} ใช้ได้เมื่อถือดาบ` },
      { id: "spellblade_rift_tear", name: "รอยแยกกลืนกิน", kind: "active", max: 10, pos: [1, 1], req: [["spellblade_rift_slash", 4]], glyph: "swirl", need: SWORDS,
        skill: { type: "blast", stat: "both", element: "dark", mult: lin(1.0, 0.1), hits: 3, every: 0.3, expose: (r) => 0.06 + 0.01 * r, debuff: 9, mp: 20, cd: 6, motion: "swing", range: 450, radius: 200, delay: 0.25,
          combo: { after: ["spellblade_rift_slash"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#8a60ff" },
        desc: (r) => `ฟันเปิดรอยแยกตรงจุดที่เล็ง รัศมี 2 ม. กลืนศัตรู 3 ครั้ง ครั้งละ ${pct(lin(1.0, 0.1)(r))} ของ${MIX} ศัตรูรับดาเมจเพิ่ม ${pct(0.06 + 0.01 * r)} 9 วิ ใช้ต่อจากฟันรอยแยกภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือดาบ` },
      { id: "spellblade_rift_veil", name: "ม่านมิติ", kind: "active", max: 5, pos: [2, 1], req: [["spellblade_rift_step", 3]], glyph: "wing", need: SWORDS,
        skill: { type: "buff", mp: 28, cd: 35, motion: "cast", duration: 23, buff: (r) => ({ flee: 8 + 3 * r, magicDodge: 0.05 + 0.015 * r, dmg: 0.04 + 0.012 * r }), color: "#a890f0" },
        desc: (r) => `23 วิ: ร่างครึ่งหนึ่งหลบไปอยู่อีกมิติ หลบหลีก +${8 + 3 * r} หลบเวท +${pct(0.05 + 0.015 * r)} ดาเมจ +${pct(0.04 + 0.012 * r)} ใช้ได้เมื่อถือดาบ` },
      { id: "spellblade_rift_wave", name: "คลื่นดาบทะลุมิติ", kind: "active", max: 10, pos: [1, 2], req: [["spellblade_rift_tear", 4]], glyph: "wave", need: SWORDS,
        skill: { type: "beam", stat: "both", element: "dark", mult: lin(2.3, 0.23), mp: 22, cd: 7, motion: "swing", length: 620, width: 80,
          combo: { after: ["spellblade_rift_tear", "spellblade_rift_step"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#b090ff" },
        desc: (r) => `ฟันคลื่นดาบมืดยาว 6.2 ม. ทะลุทุกตัว ${pct(lin(2.3, 0.23)(r))} ของ${MIX} ใช้ต่อจากรอยแยกกลืนกินหรือก้าวข้ามมิติภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือดาบ` },
      { id: "spellblade_rift_void_mind", name: "ใจว่างข้ามมิติ", kind: "passive", max: 10, pos: [0, 1], req: [["spellblade_rift_insight", 3]], glyph: "swirl", need: SWORDS,
        stats: (r) => ({ cdr: 0.006 * r, maxMpPct: 0.01 * r }),
        desc: (r) => `ลดคูลดาวน์ +${pct(0.006 * r)} MP สูงสุด +${pct(0.01 * r)} เมื่อถือดาบ` },
      { id: "spellblade_rift_abyss", name: "ห้วงมิติกลืนกิน", kind: "passive", max: 10, pos: [0, 2], req: [["spellblade_rift_void_mind", 3]], glyph: "pierce", need: SWORDS,
        stats: (r) => ({ huntDmg: 0.008 * r, pierce: 0.01 * r }),
        desc: (r) => `ดาเมจใส่ศัตรูที่ติดสถานะ +${pct(0.008 * r)} (รวมศัตรูที่รอยแยกเปิดจุดอ่อน) เจาะเกราะ +${pct(0.01 * r)} เมื่อถือดาบ` },
      { id: "spellblade_rift_phase", name: "กายเหลื่อมมิติ", kind: "passive", max: 5, pos: [2, 2], req: [["spellblade_rift_veil", 1]], glyph: "wing", need: SWORDS,
        stats: (r) => ({ magicDodge: 0.01 * r, flee: 2 * r }),
        desc: (r) => `หลบเวท +${pct(0.01 * r)} หลบหลีก +${2 * r} เมื่อถือดาบ` },
      { id: "spellblade_rift_collapse", name: "มิติล่มสลาย", kind: "active", max: 5, pos: [1, 3], req: [["spellblade_rift_wave", 5], ["spellblade_rift_veil", 1]], glyph: "burst", need: SWORDS,
        skill: { type: "nova", stat: "both", element: "dark", mult: lin(2.6, 0.33), hits: 2, mp: 46, cd: 16, motion: "swing", radius: 260,
          combo: { after: ["spellblade_rift_wave"], within: 3, more: () => 0.35 }, color: "#d0b8ff" },
        desc: (r) => `ปักดาบให้มิติรอบตัวพังทลาย รัศมี 2.6 ม. 2 ครั้ง ครั้งละ ${pct(lin(2.6, 0.33)(r))} ของ${MIX} ใช้ต่อจากคลื่นดาบทะลุมิติภายใน 3 วิ แรงขึ้น 35% ใช้ได้เมื่อถือดาบ` },
    ],
  },
  // ---- the empowered blade: an element on the weapon, forms in any order ----
  spellblade_empower: {
    name: "ดาบเสริมพลัง", cls: null, job3: "spellblade", color: "#a8d8ff", glyph: "sword",
    note: "ร่ายเวทเสริมอาวุธ อาบด้วยสายฟ้า (คริติคอล) หรือดิน (ป้องกัน) แล้วเปลี่ยนตามศัตรูได้ (อาบได้ทีละธาตุ) พลังโจมตีทุกธาตุเพิ่มขึ้น กระบวนท่าดาบสามท่าเป็นธาตุที่อาบไว้ ใช้ต่อกันลำดับไหนก็ได้ แต่ละท่าแรงขึ้นเมื่อใช้ต่อจากอีกสองท่า และปิดด้วยดาบธาตุพันแปรต่อจากท่าใดก็ได้",
    nodes: [
      { id: "spellblade_empower_imprint", name: "ฟันประทับธาตุ", kind: "active", max: 10, pos: [0, 0], glyph: "sword", need: SWORDS,
        skill: { type: "cone", stat: "atk", mult: lin(1.9, 0.19), mp: 14, cd: 4, motion: "swing", reach: 180, arc: 50,
          combo: { after: others("spellblade_empower_imprint"), within: 3, more: (r) => 0.2 + 0.01 * r }, color: "#c8e8ff" },
        desc: (r) => `ฟันตัวที่ล็อกไว้ ${pct(lin(1.9, 0.19)(r))} ของพลังโจมตี เป็นธาตุที่อาบอาวุธไว้ ใช้ต่อจากระเบิดธาตุรอบกายหรือคลื่นดาบธาตุภายใน 3 วิ แรงขึ้น ${pct(0.2 + 0.01 * r)} ใช้ได้เมื่อถือดาบ` },
      { id: "spellblade_empower_resonance", name: "คมดาบสถิตธาตุ", kind: "passive", max: 10, pos: [1, 0], glyph: "up", need: SWORDS,
        stats: (r) => ({ atkPct: 0.008 * r, ...EVERY_ELEMENT(0.5 * r) }),
        desc: (r) => `พลังโจมตี +${pct(0.008 * r)} พลังโจมตีทุกธาตุ +${n1(0.5 * r)} เมื่อถือดาบ` },
      { id: "spellblade_empower_thunder", name: "ดาบอัสนี", kind: "active", max: 5, pos: [2, 0], glyph: "bolt",
        skill: { type: "buff", mp: 22, cd: 20, motion: "cast", duration: 90, enchant: "lightning", buff: (r) => ({ lightningAtk: 8 + 3 * r, crit: 0.004 * r, critDmg: 0.03 * r }), color: "#fff0a0" },
        desc: (r) => `90 วิ: อาบอาวุธด้วยสายฟ้า ตีปกติและสกิลกายภาพที่ไม่มีธาตุกลายเป็นธาตุสายฟ้า พลังโจมตีธาตุสายฟ้า +${8 + 3 * r} โอกาสคริติคอล +${pct(0.004 * r)} แรงคริติคอล +${pct(0.03 * r)} (อาบได้ทีละธาตุ)` },
      { id: "spellblade_empower_earth", name: "ดาบปฐพี", kind: "active", max: 5, pos: [3, 0], glyph: "earth",
        skill: { type: "buff", mp: 22, cd: 20, motion: "cast", duration: 90, enchant: "earth", buff: (r) => ({ earthAtk: 8 + 3 * r, defPct: 0.03 * r, maxHpPct: 0.01 * r }), color: "#e0c890" },
        desc: (r) => `90 วิ: อาบอาวุธด้วยพลังดิน ตีปกติและสกิลกายภาพที่ไม่มีธาตุกลายเป็นธาตุดิน พลังโจมตีธาตุดิน +${8 + 3 * r} ป้องกัน +${pct(0.03 * r)} HP สูงสุด +${pct(0.01 * r)} (อาบได้ทีละธาตุ)` },
      { id: "spellblade_empower_burst", name: "ระเบิดธาตุรอบกาย", kind: "active", max: 10, pos: [0, 1], req: [["spellblade_empower_imprint", 4]], glyph: "burst", need: SWORDS,
        skill: { type: "nova", stat: "atk", mult: lin(1.0, 0.1), hits: 2, mp: 20, cd: 6, motion: "swing", radius: 220,
          combo: { after: others("spellblade_empower_burst"), within: 3, more: (r) => 0.2 + 0.01 * r }, color: "#d8f0ff" },
        desc: (r) => `ปลดธาตุที่อาบอาวุธให้ระเบิดรอบตัวรัศมี 2.2 ม. 2 ครั้ง ครั้งละ ${pct(lin(1.0, 0.1)(r))} ของพลังโจมตี ใช้ต่อจากฟันประทับธาตุหรือคลื่นดาบธาตุภายใน 3 วิ แรงขึ้น ${pct(0.2 + 0.01 * r)} ใช้ได้เมื่อถือดาบ` },
      { id: "spellblade_empower_wave", name: "คลื่นดาบธาตุ", kind: "active", max: 10, pos: [1, 1], req: [["spellblade_empower_resonance", 3]], glyph: "wave", need: SWORDS,
        skill: { type: "beam", stat: "atk", mult: lin(2.1, 0.21), mp: 18, cd: 6, motion: "swing", length: 520, width: 80,
          combo: { after: others("spellblade_empower_wave"), within: 3, more: (r) => 0.2 + 0.01 * r }, color: "#b8e0ff" },
        desc: (r) => `ฟันคลื่นดาบยาว 5.2 ม. ทะลุทุกตัว ${pct(lin(2.1, 0.21)(r))} ของพลังโจมตี เป็นธาตุที่อาบอาวุธไว้ ใช้ต่อจากฟันประทับธาตุหรือระเบิดธาตุรอบกายภายใน 3 วิ แรงขึ้น ${pct(0.2 + 0.01 * r)} ใช้ได้เมื่อถือดาบ` },
      { id: "spellblade_empower_static", name: "ไฟฟ้าสถิตคมดาบ", kind: "passive", max: 5, pos: [2, 1], req: [["spellblade_empower_thunder", 1]], glyph: "bolt", need: SWORDS,
        stats: (r) => ({ critDmg: 0.03 * r, lightningAtk: 2 * r }),
        desc: (r) => `แรงคริติคอล +${pct(0.03 * r)} พลังโจมตีธาตุสายฟ้า +${2 * r} เมื่อถือดาบ` },
      { id: "spellblade_empower_bedrock", name: "ศิลารองดาบ", kind: "passive", max: 5, pos: [3, 1], req: [["spellblade_empower_earth", 1]], glyph: "shield", need: SWORDS,
        stats: (r) => ({ maxHpPct: 0.012 * r, defPct: 0.012 * r, earthDef: 2 * r }),
        desc: (r) => `HP สูงสุด +${pct(0.012 * r)} ป้องกัน +${pct(0.012 * r)} ป้องกันธาตุดิน +${2 * r} เมื่อถือดาบ` },
      { id: "spellblade_empower_attune", name: "ร่ายเสริมคล่องมือ", kind: "passive", max: 10, pos: [1, 2], req: [["spellblade_empower_wave", 3]], glyph: "spin",
        stats: (r) => ({ buffTime: 0.02 * r, mpRegen: 0.2 * r }),
        desc: (r) => `บัฟทุกอย่างอยู่นานขึ้น ${pct(0.02 * r)} (รวมดาบอัสนีและดาบปฐพี) ฟื้น MP +${n1(0.2 * r)}/วิ` },
      { id: "spellblade_empower_myriad", name: "ดาบธาตุพันแปร", kind: "active", max: 5, pos: [0, 2], req: [["spellblade_empower_burst", 5], ["spellblade_empower_wave", 3]], glyph: "star", need: SWORDS,
        skill: { type: "cone", stat: "atk", mult: lin(1.3, 0.165), hits: 4, mp: 45, cd: 15, motion: "swing", reach: 200, arc: 100,
          combo: { after: FORMS, within: 3, more: () => 0.3 }, color: "#e8f6ff" },
        desc: (r) => `ฟันรัวด้วยดาบที่อาบธาตุ 4 ครั้งใส่ศัตรูด้านหน้า 2 ม. ครั้งละ ${pct(lin(1.3, 0.165)(r))} ของพลังโจมตี ใช้ต่อจากกระบวนท่าใดก็ได้ของสายนี้ภายใน 3 วิ แรงขึ้น 30% ใช้ได้เมื่อถือดาบ` },
    ],
  },
};

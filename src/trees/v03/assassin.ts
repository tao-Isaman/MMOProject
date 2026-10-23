// The assassin's branches (third job, from the ranger, the thief, the swordsman, the warlord or the
// mercenary): the blade (claws, quick and critical, a four-step kill where each cut is stronger
// right after the one before: rake, rend, a dash through, a thousand cuts), the venom (poison
// vials brewed from monster hides and refined, used from the bag to coat the weapon so its
// cuts turn to poison; stings, a blow that sets the poison off, a poisoned dance round her) and
// the spell (a dagger against casters: it slips their spells, burns their mana, silences them,
// and cuts with attack and magic together). Seven skills a branch, a little stronger than the
// second jobs'.
import type { Need, Tree } from "../../progression";
import { pct, lin } from "../util";

const CLAW: Need = { weapons: ["claw"] };
const SHORT: Need = { weapons: ["dagger", "claw"] };
const DAGGER: Need = { weapons: ["dagger"] };

export const ASSASSIN_TREES: Record<string, Tree> = {
  // ---- the blade: claws, criticals, a kill in four strokes ----
  assassin_blade: {
    name: "นักลอบสังหาร", cls: null, job3: "assassin", color: "#a890d8", glyph: "skull",
    note: "ถือกรงเล็บ เร็วและคริติคอลหนัก ทุกท่าตีหลายครั้ง ฆ่าเป็นกระบวนท่าสี่จังหวะที่แต่ละท่าแรงขึ้นเมื่อใช้ต่อจากท่าก่อน: ตะปบสามเงา → ฉีกเงาสี่คม → พุ่งทะลุเงา → พันเล็บพิฆาต",
    nodes: [
      { id: "assassin_blade_edge", name: "คมเล็บมัจจุราช", kind: "passive", max: 10, pos: [0, 0], glyph: "thorn", need: CLAW,
        stats: (r) => ({ crit: 0.005 * r, critDmg: 0.025 * r }),
        desc: (r) => `โอกาสคริติคอล +${pct(0.005 * r)} แรงคริติคอล +${pct(0.025 * r)} เมื่อถือกรงเล็บ` },
      { id: "assassin_blade_rake", name: "ตะปบสามเงา", kind: "active", max: 10, pos: [1, 0], glyph: "twin", need: CLAW,
        skill: { type: "cone", stat: "atk", mult: lin(0.7, 0.07), hits: 3, mp: 14, cd: 4, motion: "thrust", reach: 130, arc: 50, color: "#c8b0f0" },
        desc: (r) => `ตะปบตัวที่ล็อกไว้ 3 ครั้งรวด ครั้งละ ${pct(lin(0.7, 0.07)(r))} ของพลังโจมตี ใช้ได้เมื่อถือกรงเล็บ` },
      { id: "assassin_blade_intent", name: "จิตสังหาร", kind: "active", max: 5, pos: [2, 0], glyph: "rage", need: CLAW,
        skill: { type: "buff", mp: 28, cd: 35, motion: "cast", duration: 12, buff: (r) => ({ crit: 0.03 + 0.006 * r, critDmg: 0.1 + 0.03 * r, aspd: 0.05 + 0.01 * r }), color: "#9a70e0" },
        desc: (r) => `12 วิ: โอกาสคริติคอล +${pct(0.03 + 0.006 * r)} แรงคริติคอล +${pct(0.1 + 0.03 * r)} ความเร็วโจมตี +${pct(0.05 + 0.01 * r)} ใช้ได้เมื่อถือกรงเล็บ` },
      { id: "assassin_blade_quick", name: "เงาเล็บพริ้ว", kind: "passive", max: 5, pos: [0, 1], req: [["assassin_blade_edge", 3]], glyph: "wing", need: CLAW,
        stats: (r) => ({ aspd: 0.02 * r, flee: 3 * r }),
        desc: (r) => `ความเร็วโจมตี +${pct(0.02 * r)} หลบหลีก +${3 * r} เมื่อถือกรงเล็บ` },
      { id: "assassin_blade_rend", name: "ฉีกเงาสี่คม", kind: "active", max: 10, pos: [1, 1], req: [["assassin_blade_rake", 3]], glyph: "storm", need: CLAW,
        skill: { type: "cone", stat: "atk", mult: lin(0.58, 0.058), hits: 4, mp: 18, cd: 5, motion: "thrust", reach: 130, arc: 50,
          combo: { after: ["assassin_blade_rake"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#d4c0ff" },
        desc: (r) => `ข่วนฉีกตัวที่ล็อกไว้ 4 ครั้ง ครั้งละ ${pct(lin(0.58, 0.058)(r))} ของพลังโจมตี ใช้ต่อจากตะปบสามเงาภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือกรงเล็บ` },
      { id: "assassin_blade_phantom", name: "พุ่งทะลุเงา", kind: "active", max: 10, pos: [1, 2], req: [["assassin_blade_rend", 4]], glyph: "dash", need: CLAW,
        skill: { type: "dash", stat: "atk", mult: lin(1.15, 0.115), hits: 2, mp: 20, cd: 6, motion: "thrust", distance: 240, width: 70,
          combo: { after: ["assassin_blade_rend"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#b098e8" },
        desc: (r) => `พุ่งทะลุไปข้างหน้า 2.4 ม. ข่วนทุกตัวที่ผ่าน 2 ครั้ง ครั้งละ ${pct(lin(1.15, 0.115)(r))} ของพลังโจมตี ใช้ต่อจากฉีกเงาสี่คมภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือกรงเล็บ` },
      { id: "assassin_blade_finale", name: "พันเล็บพิฆาต", kind: "active", max: 5, pos: [1, 3], req: [["assassin_blade_phantom", 5], ["assassin_blade_intent", 1]], glyph: "skull", need: CLAW,
        skill: { type: "cone", stat: "atk", mult: lin(0.9, 0.11), hits: 6, mp: 48, cd: 15, motion: "thrust", reach: 160, arc: 50,
          combo: { after: ["assassin_blade_phantom"], within: 3, more: () => 0.35 }, color: "#e0d0ff" },
        desc: (r) => `ฉีกกระหน่ำตัวที่ล็อกไว้ 6 ครั้ง ครั้งละ ${pct(lin(0.9, 0.11)(r))} ของพลังโจมตี ใช้ต่อจากพุ่งทะลุเงาภายใน 3 วิ แรงขึ้น 35% ใช้ได้เมื่อถือกรงเล็บ` },
    ],
  },
  // ---- the venom: brew the vials, coat the blade, poison and set it off ----
  assassin_venom: {
    name: "นักวางยาพิษ", cls: null, job3: "assassin", color: "#8fdc6a", glyph: "drop",
    note: "ปรุงขวดยาพิษจากหนังสัตว์และกลั่นเป็นยาพิษเข้มข้น ใช้จากกระเป๋าเคลือบอาวุธ แล้วท่าแทงทุกท่าของสายนี้ (ถือมีดสั้นหรือกรงเล็บ) ตีเป็นธาตุพิษ แทงติดพิษ บีบพิษให้ระเบิดในตัวเหยื่อ และระบำอสรพิษรอบตัวให้ศัตรูทั้งกลุ่มติดพิษและอ่อนแรง",
    nodes: [
      { id: "assassin_venom_brew", name: "ปรุงยาพิษ", kind: "active", max: 5, pos: [0, 0], glyph: "drop",
        skill: { type: "make", make: { item: "poison_vial", count: (r) => 1 + Math.floor(r / 2), from: [["beast_hide", 2]] }, mp: 10, cd: 3, motion: "cast", color: "#8fdc4a" },
        desc: (r) => `ปรุงขวดยาพิษ ${1 + Math.floor(r / 2)} ขวดจากหนังสัตว์ 2 ผืน ใช้จากกระเป๋าแล้วเคลือบอาวุธ 60 วิ: ตีเป็นธาตุพิษ ตีปกติมีโอกาส 20% ติดพิษ พลังโจมตีธาตุพิษ +12` },
      { id: "assassin_venom_lore", name: "เภสัชอสรพิษ", kind: "passive", max: 10, pos: [1, 0], glyph: "leaf",
        stats: (r) => ({ poisonPct: 0.03 * r, poisonHit: 0.01 * r }),
        desc: (r) => `พิษแรงขึ้น ${pct(0.03 * r)} ตีปกติมีโอกาสติดพิษ +${pct(0.01 * r)}` },
      { id: "assassin_venom_sting", name: "เขี้ยวงูเห่า", kind: "active", max: 10, pos: [2, 0], glyph: "pierce", need: SHORT,
        skill: { type: "cone", stat: "atk", mult: lin(2.0, 0.2), poison: lin(0.6, 0.06), mp: 14, cd: 4, motion: "thrust", reach: 130, arc: 45, color: "#a6e65a" },
        desc: (r) => `แทงตัวที่ล็อกไว้ ${pct(lin(2.0, 0.2)(r))} ของพลังโจมตี แล้วพิษกัดอีก ${pct(lin(0.6, 0.06)(r))} ของดาเมจใน 4 วิ ใช้ได้เมื่อถือมีดสั้นหรือกรงเล็บ` },
      { id: "assassin_venom_distill", name: "กลั่นพิษร้าย", kind: "active", max: 5, pos: [0, 1], req: [["assassin_venom_brew", 3]], glyph: "swirl",
        skill: { type: "make", make: { item: "poison_vial_strong", count: (r) => 1 + Math.floor(r / 3), from: [["poison_vial", 2], ["gem_shard", 1]] }, mp: 14, cd: 3, motion: "cast", color: "#5fb82e" },
        desc: (r) => `กลั่นขวดยาพิษ 2 ขวดกับเศษอัญมณี 1 ชิ้นเป็นขวดยาพิษเข้มข้น ${1 + Math.floor(r / 3)} ขวด ใช้จากกระเป๋าแล้วเคลือบอาวุธ 90 วิ: ตีเป็นธาตุพิษ ตีปกติมีโอกาส 30% ติดพิษ พลังโจมตีธาตุพิษ +30 พิษแรงขึ้น 15%` },
      { id: "assassin_venom_frenzy", name: "พิษเดือดพล่าน", kind: "active", max: 5, pos: [1, 1], req: [["assassin_venom_lore", 3]], glyph: "up",
        skill: { type: "buff", mp: 26, cd: 35, motion: "cast", duration: 15, buff: (r) => ({ poisonPct: 0.1 + 0.03 * r, poisonHit: 0.05 + 0.02 * r, huntDmg: 0.04 + 0.012 * r }), color: "#b0f070" },
        desc: (r) => `15 วิ: พิษแรงขึ้น ${pct(0.1 + 0.03 * r)} ตีปกติมีโอกาสติดพิษ +${pct(0.05 + 0.02 * r)} ดาเมจใส่ศัตรูที่ติดสถานะผิดปกติ +${pct(0.04 + 0.012 * r)}` },
      { id: "assassin_venom_rupture", name: "บีบพิษเข้าหัวใจ", kind: "active", max: 10, pos: [2, 1], req: [["assassin_venom_sting", 4]], glyph: "burst", need: SHORT,
        skill: { type: "cone", stat: "atk", mult: lin(2.3, 0.23), detonate: lin(0.8, 0.08), mp: 18, cd: 6, motion: "thrust", reach: 130, arc: 45,
          combo: { after: ["assassin_venom_sting"], within: 3, more: (r) => 0.2 + 0.03 * r }, color: "#d0ff70" },
        desc: (r) => `แทงตัวที่ล็อกไว้ ${pct(lin(2.3, 0.23)(r))} ของพลังโจมตี แล้วพิษที่ค้างในตัวมันระเบิดทันที แรง ${pct(lin(0.8, 0.08)(r))} ของพิษที่เหลือ (พิษหมดไป) ใช้ต่อจากเขี้ยวงูเห่าภายใน 3 วิ แรงขึ้น ${pct(0.2 + 0.03 * r)} ใช้ได้เมื่อถือมีดสั้นหรือกรงเล็บ` },
      { id: "assassin_venom_dance", name: "ระบำอสรพิษ", kind: "active", max: 5, pos: [2, 2], req: [["assassin_venom_rupture", 5], ["assassin_venom_frenzy", 1]], glyph: "spin", need: SHORT,
        skill: { type: "storm", stat: "atk", mult: lin(0.9, 0.11), pulses: 5, every: 0.25, poison: lin(0.2, 0.04), weaken: () => 0.2, debuff: 8, mp: 45, cd: 16, motion: "swing", radius: 230,
          combo: { after: ["assassin_venom_rupture"], within: 4, more: () => 0.3 }, color: "#98e060" },
        desc: (r) => `หมุนตัวกรีดพิษรอบตัว 2.3 ม. 5 ครั้ง ครั้งละ ${pct(lin(0.9, 0.11)(r))} ของพลังโจมตี พิษกัดอีก ${pct(lin(0.2, 0.04)(r))} ของดาเมจทุกครั้ง ศัตรูตีเบาลง 20% 8 วิ ใช้ต่อจากบีบพิษเข้าหัวใจภายใน 4 วิ แรงขึ้น 30% ใช้ได้เมื่อถือมีดสั้นหรือกรงเล็บ` },
    ],
  },
  // ---- the spell: a dagger for the casters, sure hits of attack and magic ----
  assassin_spell: {
    name: "มือสังหารเวท", cls: null, job3: "assassin", color: "#9aa8ff", glyph: "bolt",
    note: "ถือมีดสั้นล่าพวกร่ายเวท หลบเวทเก่ง ท่าแทงและมีดบินใช้ทั้งพลังโจมตีและพลังเวท (โดนแน่นอนแบบเวท) เผามานา: ใส่พวกร่ายเวทแรงขึ้นและทำให้ร่ายเวทหรือยิงไม่ได้ วงผนึกมนตร์ปิดปากทั้งกลุ่ม ปิดท้ายด้วยปลิดชีพจอมเวท เหมาะกับหัวขโมยที่มาจากสายเวทเป็นพิเศษ",
    nodes: [
      { id: "assassin_spell_veil", name: "กายลวงมนตร์", kind: "passive", max: 10, pos: [0, 0], glyph: "cloud",
        stats: (r) => ({ magicDodge: 0.012 * r, mdefPct: 0.015 * r }),
        desc: (r) => `หลบเวท +${pct(0.012 * r)} ต้านเวท +${pct(0.015 * r)}` },
      { id: "assassin_spell_sever", name: "มีดตัดมนตรา", kind: "active", max: 10, pos: [1, 0], glyph: "bolt", need: DAGGER,
        skill: { type: "cone", stat: "both", mult: lin(2.0, 0.2), manaBurn: lin(0.3, 0.04), silence: 3, mp: 14, cd: 5, motion: "thrust", reach: 120, arc: 45, color: "#9aa8ff" },
        desc: (r) => `แทงตัวที่ล็อกไว้ ${pct(lin(2.0, 0.2)(r))} ของพลังโจมตีและพลังเวท ใส่พวกร่ายเวทแรงขึ้นอีก ${pct(lin(0.3, 0.04)(r))} และตัวที่โดนร่ายเวทหรือยิงไม่ได้ 3 วิ ใช้ได้เมื่อถือมีดสั้น` },
      { id: "assassin_spell_hexblade", name: "มีดบินผนึกเวท", kind: "active", max: 10, pos: [2, 0], glyph: "star", need: DAGGER,
        skill: { type: "bolt", stat: "both", mult: lin(1.9, 0.19), manaBurn: lin(0.25, 0.03), silence: 2, mp: 14, cd: 5, motion: "thrust", speed: 1300, range: 650, radius: 26, color: "#b8c0ff" },
        desc: (r) => `ขว้างมีดอาคมใส่ตัวที่ล็อกไว้ระยะ 6.5 ม. ${pct(lin(1.9, 0.19)(r))} ของพลังโจมตีและพลังเวท ใส่พวกร่ายเวทแรงขึ้นอีก ${pct(lin(0.25, 0.03)(r))} และตัวที่โดนร่ายเวทหรือยิงไม่ได้ 2 วิ ใช้ได้เมื่อถือมีดสั้น` },
      { id: "assassin_spell_mirage", name: "เงาลวงเวท", kind: "active", max: 5, pos: [0, 1], req: [["assassin_spell_veil", 3]], glyph: "swirl",
        skill: { type: "buff", mp: 24, cd: 30, motion: "cast", duration: 10, buff: (r) => ({ magicDodge: 0.1 + 0.03 * r, statusRes: 0.05 + 0.02 * r, mdefPct: 0.1 + 0.02 * r }), color: "#c0c8ff" },
        desc: (r) => `10 วิ: หลบเวท +${pct(0.1 + 0.03 * r)} ต้านสถานะ +${pct(0.05 + 0.02 * r)} ต้านเวท +${pct(0.1 + 0.02 * r)}` },
      { id: "assassin_spell_twin", name: "สองคมกายเวท", kind: "passive", max: 10, pos: [1, 1], req: [["assassin_spell_sever", 3]], glyph: "twin", need: DAGGER,
        stats: (r) => ({ atkPct: 0.01 * r, matkPct: 0.015 * r }),
        desc: (r) => `พลังโจมตี +${pct(0.01 * r)} พลังเวท +${pct(0.015 * r)} เมื่อถือมีดสั้น` },
      { id: "assassin_spell_seal", name: "วงผนึกมนตร์", kind: "active", max: 10, pos: [2, 1], req: [["assassin_spell_hexblade", 4]], glyph: "target", need: DAGGER,
        skill: { type: "blast", stat: "both", mult: lin(1.1, 0.11), hits: 2, every: 0.4, manaBurn: lin(0.25, 0.03), silence: 3, mp: 22, cd: 8, motion: "thrust", range: 550, radius: 170, delay: 0.3, color: "#a0b0ff" },
        desc: (r) => `ปามีดอาคมปักเป็นวงผนึกที่จุดที่เล็ง (ไกลสุด 5.5 ม.) รัศมี 1.7 ม. 2 ครั้ง ครั้งละ ${pct(lin(1.1, 0.11)(r))} ของพลังโจมตีและพลังเวท ใส่พวกร่ายเวทแรงขึ้นอีก ${pct(lin(0.25, 0.03)(r))} และทุกตัวในวงร่ายเวทหรือยิงไม่ได้ 3 วิ ใช้ได้เมื่อถือมีดสั้น` },
      { id: "assassin_spell_magekiller", name: "ปลิดชีพจอมเวท", kind: "active", max: 5, pos: [1, 2], req: [["assassin_spell_twin", 5], ["assassin_spell_mirage", 1]], glyph: "burst", need: DAGGER,
        skill: { type: "cone", stat: "both", mult: lin(5.3, 0.66), manaBurn: lin(0.4, 0.06), silence: 4, mp: 48, cd: 15, motion: "thrust", reach: 140, arc: 40,
          combo: { after: ["assassin_spell_sever", "assassin_spell_hexblade"], within: 4, more: () => 0.35 }, color: "#d0d8ff" },
        desc: (r) => `แทงทะลุร่างตัวที่ล็อกไว้ ${pct(lin(5.3, 0.66)(r))} ของพลังโจมตีและพลังเวท ใส่พวกร่ายเวทแรงขึ้นอีก ${pct(lin(0.4, 0.06)(r))} และตัวที่โดนร่ายเวทหรือยิงไม่ได้ 4 วิ ใช้ต่อจากมีดตัดมนตราหรือมีดบินผนึกเวทภายใน 4 วิ แรงขึ้น 35% ใช้ได้เมื่อถือมีดสั้น` },
    ],
  },
};

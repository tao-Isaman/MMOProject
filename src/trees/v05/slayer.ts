// The slayer's branches (fourth job, docs/v05_jobs.md, from the assassin or the shinobi): the
// dagger (heavy stabs in an unbroken chain, each stronger right after the one before: three
// vital points or a shadow's dash, cuts that never stop, a stab through the heart, a hundred
// knives; and the dagger's own strength, normal stabs that land twice) and the claw (the
// heaviest criticals, and buffs for the normal blows: a claw dance that strikes faster and twice,
// a panther's eye whose normal blows rip by themselves). The assassin's claw chain and its spell
// dagger are the cousins to stay apart from: the slayer's dagger is all attack, its claw all
// criticals and normal blows. Eleven skills a branch (five of them passives, v0.6), a little
// stronger than the third jobs'.
import type { Need, Tree } from "../../progression";
import { pct, lin } from "../util";

const DAGGER: Need = { weapons: ["dagger"] };
const CLAW: Need = { weapons: ["claw"] };
const n1 = (v: number) => +v.toFixed(1);

export const SLAYER_TREES: Record<string, Tree> = {
  // ---- the dagger: a chain of stabs from the vital points to the hundred knives ----
  slayer_dagger: {
    name: "สายมีด", cls: null, job4: "slayer", color: "#c8a8e8", glyph: "pierce",
    note: "ถือมีดสั้น แทงหนักและแทงต่อเนื่องเป็นกระบวนท่าสี่จังหวะที่แต่ละท่าแรงขึ้นเมื่อใช้ต่อจากท่าก่อน: แทงสามจุดตายหรือเงามีดพุ่งผ่าน → เชือดไม่ขาดสาย → แทงทะลวงหัวใจ → ร้อยมีดส่งวิญญาณ เสริมพลังมีดสั้น ตีปกติเร็วและแทงซ้ำได้",
    nodes: [
      { id: "slayer_dagger_edge", name: "คมมีดมัจจุราช", kind: "passive", max: 10, pos: [0, 0], glyph: "thorn", need: DAGGER,
        stats: (r) => ({ atkPct: 0.012 * r, crit: 0.004 * r }),
        desc: (r) => `พลังโจมตี +${pct(0.012 * r)} โอกาสคริติคอล +${pct(0.004 * r)} เมื่อถือมีดสั้น` },
      { id: "slayer_dagger_triple", name: "แทงสามจุดตาย", kind: "active", max: 10, pos: [1, 0], glyph: "pierce", need: DAGGER,
        skill: { type: "cone", stat: "atk", mult: lin(0.9, 0.09), hits: 3, mp: 15, cd: 4, motion: "thrust", reach: 130, arc: 45, color: "#dcc8f8" },
        desc: (r) => `แทงจุดตายของตัวที่ล็อกไว้ 3 ครั้งรวด ครั้งละ ${pct(lin(0.9, 0.09)(r))} ของพลังโจมตี ใช้ได้เมื่อถือมีดสั้น` },
      { id: "slayer_dagger_shade", name: "เงามีดพุ่งผ่าน", kind: "active", max: 10, pos: [2, 0], glyph: "dash", need: DAGGER,
        skill: { type: "dash", stat: "atk", mult: lin(1.05, 0.105), hits: 2, mp: 16, cd: 6, motion: "thrust", distance: 300, width: 70, color: "#b8a0e8" },
        desc: (r) => `พุ่งเป็นเงาไปทางที่เล็ง 3 ม. แทงทุกตัวที่ผ่าน 2 ครั้ง ครั้งละ ${pct(lin(1.05, 0.105)(r))} ของพลังโจมตี ใช้ได้เมื่อถือมีดสั้น` },
      { id: "slayer_dagger_flow", name: "สายเลือดมือสังหาร", kind: "passive", max: 5, pos: [0, 1], req: [["slayer_dagger_edge", 3]], glyph: "twin", need: DAGGER,
        stats: (r) => ({ aspd: 0.02 * r, doubleHit: 0.025 * r }),
        desc: (r) => `ความเร็วโจมตี +${pct(0.02 * r)} ตีปกติมีโอกาส ${pct(0.025 * r)} แทงซ้ำอีกครั้งทันที เมื่อถือมีดสั้น` },
      { id: "slayer_dagger_chain", name: "เชือดไม่ขาดสาย", kind: "active", max: 10, pos: [1, 1], req: [["slayer_dagger_triple", 4]], glyph: "storm", need: DAGGER,
        skill: { type: "cone", stat: "atk", mult: lin(0.66, 0.066), hits: 4, mp: 20, cd: 5, motion: "thrust", reach: 130, arc: 45,
          combo: { after: ["slayer_dagger_triple", "slayer_dagger_shade"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#e4d4ff" },
        desc: (r) => `เชือดตัวที่ล็อกไว้ต่อเนื่อง 4 ครั้ง ครั้งละ ${pct(lin(0.66, 0.066)(r))} ของพลังโจมตี ใช้ต่อจากแทงสามจุดตายหรือเงามีดพุ่งผ่านภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือมีดสั้น` },
      { id: "slayer_dagger_instinct", name: "ปลุกสัญชาตญาณสังหาร", kind: "active", max: 5, pos: [2, 1], req: [["slayer_dagger_shade", 3]], glyph: "rage", need: DAGGER,
        skill: { type: "buff", mp: 28, cd: 35, motion: "cast", duration: 23, buff: (r) => ({ atkPct: 0.06 + 0.02 * r, aspd: 0.05 + 0.015 * r, crit: 0.02 + 0.006 * r }), color: "#a080e0" },
        desc: (r) => `23 วิ: พลังโจมตี +${pct(0.06 + 0.02 * r)} ความเร็วโจมตี +${pct(0.05 + 0.015 * r)} โอกาสคริติคอล +${pct(0.02 + 0.006 * r)} ใช้ได้เมื่อถือมีดสั้น` },
      { id: "slayer_dagger_heart", name: "แทงทะลวงหัวใจ", kind: "active", max: 10, pos: [1, 2], req: [["slayer_dagger_chain", 4]], glyph: "burst", need: DAGGER,
        skill: { type: "cone", stat: "atk", mult: lin(2.6, 0.26), stun: () => 0.5, mp: 22, cd: 6, motion: "thrust", reach: 140, arc: 40,
          combo: { after: ["slayer_dagger_chain"], within: 3, more: (r) => 0.3 + 0.03 * r }, color: "#f0e0ff" },
        desc: (r) => `แทงทะลวงหัวใจตัวที่ล็อกไว้ ${pct(lin(2.6, 0.26)(r))} ของพลังโจมตี มึน 0.5 วิ ใช้ต่อจากเชือดไม่ขาดสายภายใน 3 วิ แรงขึ้น ${pct(0.3 + 0.03 * r)} ใช้ได้เมื่อถือมีดสั้น` },
      { id: "slayer_dagger_requiem", name: "ร้อยมีดส่งวิญญาณ", kind: "active", max: 5, pos: [1, 3], req: [["slayer_dagger_heart", 5], ["slayer_dagger_instinct", 1]], glyph: "skull", need: DAGGER,
        skill: { type: "cone", stat: "atk", mult: lin(0.88, 0.11), hits: 7, mp: 52, cd: 15, motion: "thrust", reach: 150, arc: 45,
          combo: { after: ["slayer_dagger_heart"], within: 3, more: () => 0.4 }, color: "#f4ecff" },
        desc: (r) => `แทงกระหน่ำตัวที่ล็อกไว้ 7 ครั้งจนเห็นเป็นร้อยมีด ครั้งละ ${pct(lin(0.88, 0.11)(r))} ของพลังโจมตี ใช้ต่อจากแทงทะลวงหัวใจภายใน 3 วิ แรงขึ้น 40% ใช้ได้เมื่อถือมีดสั้น` },
      // v0.6: three more passives (the branch's five)
      { id: "slayer_dagger_shadowstep", name: "ย่างเงามัจจุราช", kind: "passive", max: 5, pos: [3, 1], req: [["slayer_dagger_shade", 3]], glyph: "dash", need: DAGGER,
        stats: (r) => ({ move: 0.015 * r, flee: 3 * r }),
        desc: (r) => `ความเร็วเดิน +${pct(0.015 * r)} หลบหลีก +${3 * r} เมื่อถือมีดสั้น` },
      { id: "slayer_dagger_vein", name: "ปาดเส้นชีพจร", kind: "passive", max: 5, pos: [0, 2], req: [["slayer_dagger_flow", 3]], glyph: "drop", need: DAGGER,
        stats: (r) => ({ huntDmg: 0.02 * r, statusRes: 0.03 * r }),
        desc: (r) => `ดาเมจใส่ศัตรูที่ติดสถานะผิดปกติ (มึน ช้า ฯลฯ) +${pct(0.02 * r)} ต้านสถานะ +${pct(0.03 * r)} เมื่อถือมีดสั้น` },
      { id: "slayer_dagger_breath", name: "ลมหายใจเพชฌฆาต", kind: "passive", max: 5, pos: [2, 2], req: [["slayer_dagger_instinct", 1]], glyph: "swirl", need: DAGGER,
        stats: (r) => ({ cdr: 0.012 * r, mpRegen: n1(0.3 * r) }),
        desc: (r) => `ลดคูลดาวน์ ${pct(0.012 * r)} ฟื้น MP +${n1(0.3 * r)}/วิ เมื่อถือมีดสั้น` },
    ],
  },
  // ---- the claw: criticals that tear, normal blows made deadly ----
  slayer_claw: {
    name: "สายกรงเล็บ", cls: null, job4: "slayer", color: "#9878c8", glyph: "twin",
    note: "ถือกรงเล็บ คริติคอลถี่และหนักที่สุด บัฟเสริมการตีปกติ: ระบำกรงเล็บให้ตีเร็วขึ้นและข่วนซ้ำ เนตรเสือดำให้คริติคอลหนักขึ้นและตีปกติแล้วตะปบตามเอง ตะปบต่อกันแรงขึ้น: ตะปบฉีกจุดตายหรือพายุกรงเล็บ → ฉีกร่างสี่คม → พันเล็บมัจจุราช",
    nodes: [
      { id: "slayer_claw_fang", name: "เขี้ยวเล็บมรณะ", kind: "passive", max: 10, pos: [0, 0], glyph: "thorn", need: CLAW,
        stats: (r) => ({ crit: 0.006 * r, critDmg: 0.03 * r }),
        desc: (r) => `โอกาสคริติคอล +${pct(0.006 * r)} แรงคริติคอล +${pct(0.03 * r)} เมื่อถือกรงเล็บ` },
      { id: "slayer_claw_rip", name: "ตะปบฉีกจุดตาย", kind: "active", max: 10, pos: [1, 0], glyph: "twin", need: CLAW,
        skill: { type: "cone", stat: "atk", mult: lin(1.15, 0.115), hits: 2, mp: 15, cd: 3.5, motion: "thrust", reach: 130, arc: 45, color: "#c8b0f0" },
        desc: (r) => `ตะปบฉีกจุดตายของตัวที่ล็อกไว้ 2 ครั้งรวด ครั้งละ ${pct(lin(1.15, 0.115)(r))} ของพลังโจมตี ใช้ได้เมื่อถือกรงเล็บ` },
      // a buff for the normal blows, long enough to keep up through a whole fight
      { id: "slayer_claw_dance", name: "ระบำกรงเล็บ", kind: "active", max: 10, pos: [2, 0], glyph: "wing", need: CLAW,
        skill: { type: "buff", mp: 24, cd: 20, motion: "cast", duration: 90, buff: (r) => ({ aspd: 0.03 + 0.012 * r, doubleHit: 0.02 + 0.01 * r, critDmg: 0.05 + 0.015 * r }), color: "#b098f0" },
        desc: (r) => `90 วิ: ความเร็วโจมตี +${pct(0.03 + 0.012 * r)} ตีปกติมีโอกาส ${pct(0.02 + 0.01 * r)} ข่วนซ้ำอีกครั้งทันที แรงคริติคอล +${pct(0.05 + 0.015 * r)} ใช้ได้เมื่อถือกรงเล็บ` },
      { id: "slayer_claw_whirl", name: "พายุกรงเล็บ", kind: "active", max: 10, pos: [3, 0], glyph: "spin", need: CLAW,
        skill: { type: "nova", stat: "atk", mult: lin(1.25, 0.125), hits: 2, mp: 20, cd: 6, motion: "swing", radius: 210, color: "#a890e0" },
        desc: (r) => `หมุนตัวข่วนรอบตัวรัศมี 2.1 ม. 2 รอบ รอบละ ${pct(lin(1.25, 0.125)(r))} ของพลังโจมตี ใช้ได้เมื่อถือกรงเล็บ` },
      { id: "slayer_claw_vital", name: "จุดตายนับพัน", kind: "passive", max: 5, pos: [0, 1], req: [["slayer_claw_fang", 3]], glyph: "eye", need: CLAW,
        stats: (r) => ({ crit: 0.008 * r, critDmg: 0.05 * r }),
        desc: (r) => `โอกาสคริติคอล +${pct(0.008 * r)} แรงคริติคอล +${pct(0.05 * r)} เมื่อถือกรงเล็บ` },
      { id: "slayer_claw_rend", name: "ฉีกร่างสี่คม", kind: "active", max: 10, pos: [1, 1], req: [["slayer_claw_rip", 4]], glyph: "storm", need: CLAW,
        skill: { type: "cone", stat: "atk", mult: lin(0.66, 0.066), hits: 4, mp: 20, cd: 5, motion: "thrust", reach: 130, arc: 45,
          combo: { after: ["slayer_claw_rip", "slayer_claw_whirl"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#d4c0ff" },
        desc: (r) => `ฉีกร่างตัวที่ล็อกไว้ 4 ครั้ง ครั้งละ ${pct(lin(0.66, 0.066)(r))} ของพลังโจมตี ใช้ต่อจากตะปบฉีกจุดตายหรือพายุกรงเล็บภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือกรงเล็บ` },
      // the panther's eye: while it lasts a normal blow now and then rips by itself (autocast)
      { id: "slayer_claw_panther", name: "เนตรเสือดำ", kind: "active", max: 5, pos: [2, 1], req: [["slayer_claw_dance", 3]], glyph: "rage", need: CLAW,
        skill: { type: "buff", mp: 30, cd: 35, motion: "cast", duration: 23,
          buff: (r) => ({ crit: 0.03 + 0.008 * r, critDmg: 0.12 + 0.04 * r, autocast_slayer_claw_rip: 0.04 + 0.02 * r }), color: "#8a68d8" },
        desc: (r) => `23 วิ: โอกาสคริติคอล +${pct(0.03 + 0.008 * r)} แรงคริติคอล +${pct(0.12 + 0.04 * r)} ตีปกติโดนแล้วมีโอกาส ${pct(0.04 + 0.02 * r)} ตะปบฉีกจุดตายตามเองฟรี ใช้ได้เมื่อถือกรงเล็บ` },
      { id: "slayer_claw_finale", name: "พันเล็บมัจจุราช", kind: "active", max: 5, pos: [1, 2], req: [["slayer_claw_rend", 5], ["slayer_claw_panther", 1]], glyph: "skull", need: CLAW,
        skill: { type: "cone", stat: "atk", mult: lin(1.0, 0.125), hits: 6, mp: 52, cd: 15, motion: "thrust", reach: 160, arc: 45,
          combo: { after: ["slayer_claw_rend"], within: 3, more: () => 0.4 }, color: "#e8dcff" },
        desc: (r) => `ฉีกกระหน่ำตัวที่ล็อกไว้ 6 ครั้ง ครั้งละ ${pct(lin(1.0, 0.125)(r))} ของพลังโจมตี ใช้ต่อจากฉีกร่างสี่คมภายใน 3 วิ แรงขึ้น 40% ใช้ได้เมื่อถือกรงเล็บ` },
      // v0.6: three more passives (the branch's five)
      { id: "slayer_claw_prowl", name: "ย่องเงาเสือดำ", kind: "passive", max: 5, pos: [3, 1], req: [["slayer_claw_whirl", 3]], glyph: "paw", need: CLAW,
        stats: (r) => ({ move: 0.015 * r, statusRes: 0.03 * r }),
        desc: (r) => `ความเร็วเดิน +${pct(0.015 * r)} ต้านสถานะ +${pct(0.03 * r)} เมื่อถือกรงเล็บ` },
      { id: "slayer_claw_bloodlust", name: "กระหายเลือด", kind: "passive", max: 5, pos: [0, 2], req: [["slayer_claw_vital", 3]], glyph: "rage", need: CLAW,
        stats: (r) => ({ lowHpDmg: 0.02 * r, hpRegen: 2 * r }),
        desc: (r) => `ยิ่ง HP เหลือน้อยยิ่งแรง ดาเมจเพิ่มได้ถึง +${pct(0.02 * r)} เมื่อ HP ใกล้หมด ฟื้น HP +${2 * r}/วิ เมื่อถือกรงเล็บ` },
      { id: "slayer_claw_stalk", name: "สมาธินักล่า", kind: "passive", max: 5, pos: [2, 2], req: [["slayer_claw_panther", 1]], glyph: "eye", need: CLAW,
        stats: (r) => ({ cdr: 0.012 * r, mpRegen: n1(0.3 * r) }),
        desc: (r) => `ลดคูลดาวน์ ${pct(0.012 * r)} ฟื้น MP +${n1(0.3 * r)}/วิ เมื่อถือกรงเล็บ` },
    ],
  },
};

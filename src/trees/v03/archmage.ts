// The archmage's branches (third job, from the wizard, the battlemage, the inventor or the
// jester): the high elements (six elements in wide, heavy spells with long casts, chained one
// into the next: fire fanned by wind, water struck by lightning, and either of those into the
// convergence of them all; the earth's quake, cast at once, keeps the monsters off while the
// others are read out) and metal (a caster who stands in front: a staff and a shield, steel
// spells round herself, a guard and a mirror that hold while the shield is in hand, the bites
// she takes sent back at the biter). Seven skills a branch, a little stronger than the wizard's;
// the spells carry cast times like the mage trees', the defences are instant.
import type { Need, Tree } from "../../progression";
import { pct, lin } from "../util";

const SHIELD: Need = { shield: true };
// The six elements of the high spells, and what the sage's passive raises.
const SIX = (v: number) => ({ fireAtk: v, iceAtk: v, waterAtk: v, windAtk: v, lightningAtk: v, earthAtk: v });

export const ARCHMAGE_TREES: Record<string, Tree> = {
  // ---- the high elements: wide spells of many elements, each a step towards the next ----
  archmage_elements: {
    name: "เวทธาตุขั้นสูง", cls: null, job3: "archmage", color: "#a8c0ff", glyph: "burst",
    note: "เวทหลายธาตุวงกว้าง ร่ายนานแต่แรง และส่งต่อกันเป็นทอด: ฝนอัคคีกัลป์ → วายุอัคคี วังวนมหาสมุทร → อัสนีผ่าสมุทร แล้วปิดด้วยธาตุบรรจบ ธรณีสะท้านร่ายได้ทันทีไว้ผลักศัตรูที่เข้าประชิด",
    nodes: [
      { id: "archmage_elements_sage", name: "ปราชญ์หกธาตุ", kind: "passive", max: 10, pos: [0, 0], glyph: "star",
        stats: (r) => ({ matkPct: 0.012 * r, ...SIX(r) }),
        desc: (r) => `พลังเวท +${pct(0.012 * r)} พลังโจมตีธาตุไฟ น้ำแข็ง น้ำ ลม สายฟ้า และดิน +${r}` },
      { id: "archmage_elements_firerain", name: "ฝนอัคคีกัลป์", kind: "active", max: 10, pos: [1, 0], glyph: "flame",
        skill: { type: "blast", stat: "matk", element: "fire", mult: lin(1.5, 0.15), hits: 3, every: 0.4, mp: 30, cd: 8, cast: 1.5, motion: "cast", range: 580, radius: 250, delay: 0.4, color: "#ff8a4a" },
        desc: (r) => `ร่ายฝนไฟตกลงจุดที่เล็ง รัศมี 2.5 ม. 3 ระลอก ระลอกละ ${pct(lin(1.5, 0.15)(r))} ของพลังเวท` },
      { id: "archmage_elements_maelstrom", name: "วังวนมหาสมุทร", kind: "active", max: 10, pos: [2, 0], glyph: "swirl",
        skill: { type: "storm", stat: "matk", element: "water", mult: lin(0.95, 0.095), pulses: 4, every: 0.4, slow: lin(1.5, 0.1), mp: 28, cd: 8, cast: 1, motion: "cast", radius: 280, color: "#5ab4ff" },
        desc: (r) => `ร่ายวังน้ำวนรอบตัวรัศมี 2.8 ม. 4 ระลอก ระลอกละ ${pct(lin(0.95, 0.095)(r))} ของพลังเวท ศัตรูช้าลง ${lin(1.5, 0.1)(r).toFixed(1)} วิ` },
      { id: "archmage_elements_quake", name: "ธรณีสะท้าน", kind: "active", max: 10, pos: [3, 0], glyph: "earth",
        skill: { type: "nova", stat: "matk", element: "earth", mult: lin(1.9, 0.19), stun: lin(0.8, 0.06), mp: 22, cd: 10, motion: "cast", radius: 240, knock: 110, color: "#d0a060" },
        desc: (r) => `ให้แผ่นดินรอบตัวสะท้าน รัศมี 2.4 ม. ผลักศัตรูออก ${pct(lin(1.9, 0.19)(r))} ของพลังเวท มึน ${lin(0.8, 0.06)(r).toFixed(1)} วิ ร่ายได้ทันที` },
      { id: "archmage_elements_firestorm", name: "วายุอัคคี", kind: "active", max: 10, pos: [1, 1], req: [["archmage_elements_firerain", 4]], glyph: "storm",
        skill: { type: "blast", stat: "matk", element: "wind", mult: lin(0.95, 0.095), hits: 5, every: 0.3, mp: 34, cd: 10, cast: 1.8, motion: "cast", range: 560, radius: 230, delay: 0.3,
          combo: { after: ["archmage_elements_firerain"], within: 5, more: (r) => 0.25 + 0.03 * r }, color: "#ffc070" },
        desc: (r) => `ร่ายลมกรดหอบเปลวไฟเป็นพายุหมุนตรงจุดที่เล็ง รัศมี 2.3 ม. 5 ครั้ง ครั้งละ ${pct(lin(0.95, 0.095)(r))} ของพลังเวท ใช้ต่อจากฝนอัคคีกัลป์ภายใน 5 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)}` },
      { id: "archmage_elements_thunder", name: "อัสนีผ่าสมุทร", kind: "active", max: 10, pos: [2, 1], req: [["archmage_elements_maelstrom", 4]], glyph: "bolt",
        skill: { type: "beam", stat: "matk", element: "lightning", mult: lin(2.0, 0.2), hits: 2, stun: () => 0.5, mp: 32, cd: 9, cast: 1.4, motion: "cast", length: 720, width: 90,
          combo: { after: ["archmage_elements_maelstrom"], within: 5, more: (r) => 0.25 + 0.03 * r }, color: "#fff07a" },
        desc: (r) => `ร่ายสายฟ้าฟาดเป็นแนวยาว 7.2 ม. ทะลุทุกตัว 2 ครั้ง ครั้งละ ${pct(lin(2.0, 0.2)(r))} ของพลังเวท มึน 0.5 วิ ใช้ต่อจากวังวนมหาสมุทรภายใน 5 วิ (ศัตรูเปียกน้ำนำไฟฟ้า) แรงขึ้น ${pct(0.25 + 0.03 * r)}` },
      { id: "archmage_elements_convergence", name: "ธาตุบรรจบ", kind: "active", max: 5, pos: [1, 2], req: [["archmage_elements_firestorm", 5], ["archmage_elements_thunder", 3]], glyph: "burst",
        skill: { type: "blast", stat: "matk", mult: lin(10.0, 1.25), stun: lin(1, 0.15), mp: 50, cd: 16, cast: 2.6, motion: "cast", range: 600, radius: 300, delay: 0.8,
          combo: { after: ["archmage_elements_firestorm", "archmage_elements_thunder"], within: 5, more: () => 0.35 }, color: "#f0e0ff" },
        desc: (r) => `ร่ายให้ทุกธาตุบรรจบกันตรงจุดที่เล็ง รัศมี 3 ม. ${pct(lin(10.0, 1.25)(r))} ของพลังเวท มึน ${lin(1, 0.15)(r).toFixed(1)} วิ ใช้ต่อจากวายุอัคคีหรืออัสนีผ่าสมุทรภายใน 5 วิ แรงขึ้น 35%` },
    ],
  },
  // ---- metal: a caster in the front line, a shield in the off hand, the blows sent back ----
  archmage_metal: {
    name: "จอมเวทโลหะ", cls: null, job3: "archmage", color: "#b8c4d4", glyph: "shield",
    note: "จอมเวทแนวหน้า ถือไม้เท้าคู่โล่ ป้องกันและ HP สูง ร่ายเวทธาตุโลหะกลางฝูงศัตรู เกราะปรอทดูดซับความเสียหาย ปราการโลหะกับโล่กระจกเงินได้ผลเมื่อถือโล่ และสะท้อนความเสียหายกลับไปหาศัตรูที่โจมตี หอกปรอท → พายุใบมีดเหล็ก → หนามเหล็กพันเล่ม แรงขึ้นเมื่อใช้ต่อกัน",
    nodes: [
      { id: "archmage_metal_body", name: "กายาโลหะ", kind: "passive", max: 10, pos: [0, 0], glyph: "shield",
        stats: (r) => ({ defPct: 0.016 * r, maxHpPct: 0.012 * r }),
        desc: (r) => `ป้องกัน +${pct(0.016 * r)} HP สูงสุด +${pct(0.012 * r)}` },
      { id: "archmage_metal_spike", name: "หอกปรอท", kind: "active", max: 10, pos: [1, 0], glyph: "pierce",
        skill: { type: "bolt", stat: "matk", element: "metal", mult: lin(3.0, 0.3), pierce: true, mp: 16, cd: 3, cast: 0.8, motion: "cast", speed: 1000, range: 600, radius: 34, color: "#cfd6e0" },
        desc: (r) => `ร่ายปรอทให้แข็งเป็นหอกเหล็ก พุ่งทะลุทุกตัวในแนว 6 ม. ${pct(lin(3.0, 0.3)(r))} ของพลังเวท` },
      { id: "archmage_metal_quicksilver", name: "เกราะปรอท", kind: "active", max: 10, pos: [2, 0], glyph: "drop",
        skill: { type: "shield", stat: "matk", mult: lin(0.92, 0.115), base: lin(0.17, 0.023), mp: 24, cd: 14, motion: "cast", duration: 12, color: "#d8e0ea" },
        desc: (r) => `ปรอทไหลห่อตัวเป็นเกราะ ดูดซับ ${pct(lin(0.17, 0.023)(r))} ของ MP สูงสุด + ${pct(lin(0.92, 0.115)(r))} ของพลังเวท นาน 12 วิ` },
      { id: "archmage_metal_mirror", name: "โล่กระจกเงิน", kind: "passive", max: 5, pos: [0, 1], req: [["archmage_metal_body", 3]], glyph: "ring", need: SHIELD,
        stats: (r) => ({ reflect: 0.02 * r, mdefPct: 0.03 * r }),
        desc: (r) => `สะท้อนความเสียหาย +${pct(0.02 * r)} ต้านเวท +${pct(0.03 * r)} เมื่อถือโล่` },
      { id: "archmage_metal_bladestorm", name: "พายุใบมีดเหล็ก", kind: "active", max: 10, pos: [1, 1], req: [["archmage_metal_spike", 4]], glyph: "spin",
        skill: { type: "storm", stat: "matk", element: "metal", mult: lin(0.8, 0.08), pulses: 5, every: 0.25, mp: 28, cd: 8, cast: 0.8, motion: "cast", radius: 230,
          combo: { after: ["archmage_metal_spike"], within: 5, more: (r) => 0.25 + 0.03 * r }, color: "#e0e6ee" },
        desc: (r) => `ร่ายใบมีดเหล็กให้หมุนรอบตัวรัศมี 2.3 ม. 5 ครั้ง ครั้งละ ${pct(lin(0.8, 0.08)(r))} ของพลังเวท ใช้ต่อจากหอกปรอทภายใน 5 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)}` },
      { id: "archmage_metal_bulwark", name: "ปราการโลหะ", kind: "active", max: 5, pos: [2, 1], req: [["archmage_metal_quicksilver", 3]], glyph: "shield", need: SHIELD,
        skill: { type: "buff", mp: 28, cd: 35, motion: "cast", duration: 20, buff: (r) => ({ defPct: 0.1 + 0.03 * r, mdefPct: 0.06 + 0.02 * r, reflect: 0.03 + 0.01 * r }), color: "#c0ccdc" },
        desc: (r) => `20 วิ: ป้องกัน +${pct(0.1 + 0.03 * r)} ต้านเวท +${pct(0.06 + 0.02 * r)} สะท้อนความเสียหาย +${pct(0.03 + 0.01 * r)} ใช้ได้เมื่อถือโล่` },
      { id: "archmage_metal_thorns", name: "หนามเหล็กพันเล่ม", kind: "active", max: 5, pos: [1, 2], req: [["archmage_metal_bladestorm", 5], ["archmage_metal_bulwark", 1]], glyph: "thorn",
        skill: { type: "nova", stat: "matk", element: "metal", mult: lin(8.8, 1.1), stun: lin(1, 0.15), mp: 48, cd: 16, cast: 2, motion: "cast", radius: 260,
          combo: { after: ["archmage_metal_bladestorm"], within: 5, more: () => 0.35 }, color: "#eef2f8" },
        desc: (r) => `ร่ายให้หนามเหล็กนับพันพุ่งจากพื้นรอบตัว รัศมี 2.6 ม. ${pct(lin(8.8, 1.1)(r))} ของพลังเวท มึน ${lin(1, 0.15)(r).toFixed(1)} วิ ใช้ต่อจากพายุใบมีดเหล็กภายใน 5 วิ แรงขึ้น 35%` },
    ],
  },
};

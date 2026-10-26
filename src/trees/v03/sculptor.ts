// The sculptor's branches (third job, from the inventor): the woodcarver and the stonemason, the
// inventor's hands turned to works that stand by themselves. The woodcarver plants carved statues
// (allies.ts "statue") that bless whoever stands in their ring, three kinds for three blessings
// (a guardian's defence, a warrior's might, the wind's quickness), and fights between them with a
// mace in a strike and wake-the-forest chain. The stonemason raises walls that the monsters
// must break before they pass and stone figures that walk up, hit and draw the blows (a golem and
// a heavier giant), hardens the player's own body (the works take their HP and defence from it),
// and throws stone from behind the walls. Both fight on attack and magic attack together, like
// the inventor. A statue lasts two minutes (a party will stand in it later), on a short cooldown
// so it can be planted again wherever the fight moves. Seven skills a branch: the woodcarver's
// two passives leave room for its three statues and its mace, the stonemason's three (a body
// and works that last) are the way it holds the line.
//
// Allies of one kind share their `count` (allies.ts summon): every statue skill says 3, so any
// three statues stand at a time, and both golems say 2.
import type { Need, Tree } from "../../progression";
import { pct, lin } from "../util";

const MACE: Need = { weapons: ["mace"] };

// The woodcarver's statues: planted on the aimed spot, two minutes, three of them at most.
const STATUE = { type: "summon", ally: "statue", range: 400, radius: 300, base: lin(0.4, 0.05), count: 3, duration: 120, cd: 20, motion: "cast" } as const;
const statueText = (what: string, r: number, blessing: string) =>
  `ตั้ง${what}ตรงจุดที่เล็ง (ไกลสุด 4 ม.) อยู่ 2 นาที HP ${pct(STATUE.base(r))} ของ HP สูงสุด ผู้ที่ยืนในวง 3 ม. รอบรูปสลักได้: ${blessing} (รูปสลักทุกแบบตั้งพร้อมกันได้ 3 ต้น)`;

export const SCULPTOR_TREES: Record<string, Tree> = {
  // ---- the woodcarver: statues that bless the ring round them, a mace between them ----
  sculptor_wood: {
    name: "รูปสลักงานไม้", cls: null, job3: "sculptor", color: "#d8b080", glyph: "person",
    note: "ช่างแกะสลักไม้ ตั้งรูปสลักไม้ตรงจุดที่เล็งได้สามแบบ ผู้ที่ยืนในวงได้พรนาน 2 นาที (ผู้พิทักษ์: ป้องกันและฟื้น HP · นักรบ: พลังโจมตีและพลังเวท · วายุ: ความเร็วโจมตี ร่ายไวและลดคูลดาวน์) ตั้งพร้อมกันได้ 3 ต้น ระหว่างนั้นถือค้อนทุบด้วยพลังโจมตีและพลังเวท ค้อนสลักไม้ → ค้อนปลุกพนาไพร แรงขึ้นเมื่อใช้ต่อกัน",
    nodes: [
      { id: "sculptor_wood_chisel", name: "แรงตอกสิ่ว", kind: "passive", max: 10, pos: [0, 0], glyph: "up", need: MACE,
        stats: (r) => ({ atkPct: 0.012 * r, matkPct: 0.012 * r, defPct: 0.01 * r }),
        desc: (r) => `พลังโจมตีและพลังเวท +${pct(0.012 * r)} ป้องกัน +${pct(0.01 * r)} เมื่อถือค้อน` },
      { id: "sculptor_wood_strike", name: "ค้อนสลักไม้", kind: "active", max: 10, pos: [1, 0], glyph: "bash", need: MACE,
        skill: { type: "cone", stat: "both", mult: lin(2.0, 0.2), mp: 14, cd: 4, motion: "thrust", reach: 170, arc: 100, color: "#e8c898" },
        desc: (r) => `ทุบค้อนด้านหน้า 1.7 ม. ${pct(lin(2.0, 0.2)(r))} ของพลังโจมตีและพลังเวท ใช้ได้เมื่อถือค้อน` },
      { id: "sculptor_wood_guardian", name: "รูปสลักผู้พิทักษ์", kind: "active", max: 5, pos: [2, 0], glyph: "shield",
        skill: { ...STATUE, mp: 30, color: "#c89a68", buff: (r) => ({ defPct: 0.06 + 0.03 * r, mdefPct: 0.06 + 0.03 * r, hpRegen: 2 + 2 * r }) },
        desc: (r) => statueText("รูปสลักไม้ผู้พิทักษ์", r, `ป้องกัน +${pct(0.06 + 0.03 * r)} ต้านเวท +${pct(0.06 + 0.03 * r)} ฟื้น HP +${2 + 2 * r}/วิ`) },
      { id: "sculptor_wood_warrior", name: "รูปสลักนักรบ", kind: "active", max: 5, pos: [2, 1], req: [["sculptor_wood_guardian", 3]], glyph: "sword",
        skill: { ...STATUE, mp: 34, color: "#e0a060", buff: (r) => ({ atkPct: 0.05 + 0.03 * r, matkPct: 0.05 + 0.03 * r, critDmg: 0.05 + 0.03 * r }) },
        desc: (r) => statueText("รูปสลักไม้นักรบ", r, `พลังโจมตีและพลังเวท +${pct(0.05 + 0.03 * r)} แรงคริติคอล +${pct(0.05 + 0.03 * r)}`) },
      { id: "sculptor_wood_heartwood", name: "แก่นไม้ทนแดดฝน", kind: "passive", max: 5, pos: [3, 0], glyph: "heart",
        stats: (r) => ({ allyPct: 0.02 * r, mdefPct: 0.02 * r }),
        desc: (r) => `HP ของรูปสลัก (และ HP กับแรงตีของผู้ช่วยทุกแบบ) +${pct(0.02 * r)} ต้านเวท +${pct(0.02 * r)}` },
      { id: "sculptor_wood_grove", name: "ค้อนปลุกพนาไพร", kind: "active", max: 5, pos: [1, 2], req: [["sculptor_wood_strike", 5], ["sculptor_wood_warrior", 1]], glyph: "thorn", need: MACE,
        skill: { type: "nova", stat: "both", mult: lin(1.8, 0.22), hits: 3, stun: () => 1, mp: 48, cd: 16, motion: "thrust", radius: 260,
          combo: { after: ["sculptor_wood_strike"], within: 4, more: () => 0.3 }, color: "#f0d8a8" },
        desc: (r) => `ทุบค้อนลงพื้น รากไม้แกะสลักผุดรอบตัว 2.6 ม. 3 ครั้ง ครั้งละ ${pct(lin(1.8, 0.22)(r))} ของพลังโจมตีและพลังเวท มึน 1 วิ ใช้ต่อจากค้อนสลักไม้ภายใน 4 วิ แรงขึ้น 30% ใช้ได้เมื่อถือค้อน` },
      { id: "sculptor_wood_wind", name: "รูปสลักวายุ", kind: "active", max: 5, pos: [2, 2], req: [["sculptor_wood_warrior", 3]], glyph: "wing",
        skill: { ...STATUE, mp: 34, color: "#d8e0a0", buff: (r) => ({ aspd: 0.04 + 0.02 * r, castRed: 0.04 + 0.02 * r, cdr: 0.02 + 0.01 * r }) },
        desc: (r) => statueText("รูปสลักไม้วายุ", r, `ความเร็วโจมตี +${pct(0.04 + 0.02 * r)} ลดเวลาร่าย ${pct(0.04 + 0.02 * r)} ลดคูลดาวน์ ${pct(0.02 + 0.01 * r)}`) },
    ],
  },
  // ---- the stonemason: walls in the way, stone figures that fight and draw the blows ----
  sculptor_stone: {
    name: "รูปสลักงานปูน", cls: null, job3: "sculptor", color: "#c8c0b0", glyph: "earth",
    note: "ช่างปูน ตั้งกำแพงปูนขวางทางให้มอนสเตอร์ต้องทุบก่อนผ่าน ปั้นหุ่นปูนและยักษ์ศิลาที่เดินไปตีและดึงมอนสเตอร์ให้มาตีมันแทน ตัวเองทนทานขึ้น (กำแพงและหุ่นได้ HP กับป้องกันตามตัวเรา) แล้วขว้างหินจากหลังกำแพง ใช้ได้กับทุกอาวุธ สกิลใช้ทั้งพลังโจมตีและพลังเวท",
    nodes: [
      { id: "sculptor_stone_body", name: "เนื้อปูนแกร่ง", kind: "passive", max: 10, pos: [0, 0], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.015 * r, defPct: 0.015 * r }),
        desc: (r) => `HP สูงสุด +${pct(0.015 * r)} ป้องกัน +${pct(0.015 * r)} (กำแพงและหุ่นปูนได้ HP กับป้องกันตามตัวเรา จึงทนขึ้นด้วย)` },
      { id: "sculptor_stone_hurl", name: "ขว้างก้อนศิลา", kind: "active", max: 10, pos: [1, 0], glyph: "earth",
        skill: { type: "bolt", stat: "both", mult: lin(2.0, 0.2), mp: 14, cd: 4, motion: "cast", speed: 950, range: 620, radius: 34, knock: 30, color: "#c8c0b0" },
        desc: (r) => `ขว้างก้อนศิลาใส่ตัวที่ล็อกไว้ ${pct(lin(2.0, 0.2)(r))} ของพลังโจมตีและพลังเวท` },
      { id: "sculptor_stone_wall", name: "กำแพงปูน", kind: "active", max: 5, pos: [2, 0], glyph: "shield",
        skill: { type: "summon", ally: "wall", range: 450, radius: 70, base: lin(0.8, 0.15), count: 3, duration: 15, mp: 16, cd: 5, motion: "cast", color: "#b8b0a0" },
        desc: (r) => `ตั้งกำแพงปูนตรงจุดที่เล็ง (ไกลสุด 4.5 ม.) อยู่ 15 วิ HP ${pct(lin(0.8, 0.15)(r))} ของ HP สูงสุด มอนสเตอร์เดินผ่านไม่ได้ ต้องทุบให้พังก่อน ตั้งพร้อมกันได้ 3 ก้อน` },
      { id: "sculptor_stone_golem", name: "หุ่นปูนมีชีวิต", kind: "active", max: 10, pos: [0, 1], req: [["sculptor_stone_body", 3]], glyph: "person",
        skill: { type: "summon", ally: "golem", stat: "both", mult: lin(1.2, 0.12), base: lin(0.6, 0.06), every: 1.5, count: 2, duration: 30, range: 300, mp: 28, cd: 18, motion: "cast", color: "#d8d0c0" },
        desc: (r) => `ปั้นหุ่นปูนตรงจุดที่เล็ง (ไกลสุด 3 ม.) อยู่ 30 วิ HP ${pct(lin(0.6, 0.06)(r))} ของ HP สูงสุด เดินไปตีมอนสเตอร์ตัวที่ใกล้ที่สุดทุก 1.5 วิ ครั้งละ ${pct(lin(1.2, 0.12)(r))} ของพลังโจมตีและพลังเวท และดึงมอนสเตอร์ให้มาตีมันแทน (หุ่นปูนทุกแบบอยู่พร้อมกันได้ 2 ตัว)` },
      { id: "sculptor_stone_giant", name: "ยักษ์ศิลา", kind: "active", max: 5, pos: [0, 2], req: [["sculptor_stone_golem", 3]], glyph: "slam",
        skill: { type: "summon", ally: "golem", stat: "both", mult: lin(2.2, 0.25), base: lin(1.0, 0.15), every: 2, count: 2, duration: 25, range: 300, mp: 40, cd: 30, motion: "cast", color: "#e0d8c8" },
        desc: (r) => `ปลุกยักษ์ศิลาตรงจุดที่เล็ง (ไกลสุด 3 ม.) อยู่ 25 วิ HP ${pct(lin(1.0, 0.15)(r))} ของ HP สูงสุด ทุบมอนสเตอร์ตัวที่ใกล้ที่สุดทุก 2 วิ ครั้งละ ${pct(lin(2.2, 0.25)(r))} ของพลังโจมตีและพลังเวท และดึงมอนสเตอร์ให้มาตีมันแทน (หุ่นปูนทุกแบบอยู่พร้อมกันได้ 2 ตัว)` },
      { id: "sculptor_stone_sculpt", name: "ปั้นปูนชำนาญ", kind: "passive", max: 10, pos: [2, 1], req: [["sculptor_stone_wall", 3]], glyph: "person",
        stats: (r) => ({ allyPct: 0.015 * r }),
        desc: (r) => `HP ของกำแพง หุ่นปูน และยักษ์ศิลา และแรงตีของหุ่น (ผู้ช่วยทุกแบบ) +${pct(0.015 * r)}` },
      { id: "sculptor_stone_cure", name: "ปูนบ่มแกร่ง", kind: "passive", max: 10, pos: [2, 2], req: [["sculptor_stone_sculpt", 3]], glyph: "shield",
        stats: (r) => ({ mdefPct: 0.015 * r, statusRes: 0.01 * r }),
        desc: (r) => `ต้านเวท +${pct(0.015 * r)} ต้านสถานะ +${pct(0.01 * r)}` },
    ],
  },
};

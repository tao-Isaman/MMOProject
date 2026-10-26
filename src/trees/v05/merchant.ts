// The merchant's branches (second job, docs/v05_jobs.md): merchant_trade and merchant_cart.
// Six skills a branch (TREE_SKILLS[2]), two to four of them passives (TREE_PASSIVES) as the branch's
// idea asks: trade is mostly passive (four), the cart a fighter (two). The stall comes with the job
// itself (JOBS.merchant.skill), not with a branch.
//   trade  the wandering merchant's book made stronger (shop prices, a bigger bag, more gold),
//          a stall that draws customers sooner and sells dearer, and coins thrown at a cost
//   cart   a cart pushed through the fight: sweeps and rams that hit harder the fuller the bag
//          (`bag`), cover and a sturdy body, and an all-in blow paid for in gold (`gold`)
import type { Tree } from "../../progression";
import { pct, lin } from "../util";

const n1 = (v: number) => +v.toFixed(1);

export const MERCHANT_TREES: Record<string, Tree> = {
  // ---- trade: buying, selling, the stall, gold coins ----
  merchant_trade: {
    name: "ค้าขาย", cls: null, job: "merchant", color: "#e8c36a", glyph: "coin",
    note: "เซียนการค้าเหนือตำราพ่อค้าพเนจร ซื้อถูก ขายแพง กระเป๋าใหญ่ ทองจากมอนสเตอร์มากขึ้น ร้านที่ตั้งมีลูกค้าแวะถี่และขายได้แพง สู้ด้วยเหรียญทองที่ต้องจ่ายทองทุกครั้ง",
    nodes: [
      { id: "trade_bargain", name: "ค้าขายคล่อง", kind: "passive", max: 10, pos: [0, 0], glyph: "coin",
        stats: (r) => ({ buyDisc: 0.025 * r, sellBonus: 0.04 * r }),
        desc: (r) => `ซื้อของจากร้านค้า NPC ถูกลง ${pct(0.025 * r)} ขายให้ร้านได้ราคาเพิ่ม ${pct(0.04 * r)}` },
      { id: "trade_coin", name: "ดีดเหรียญทอง", kind: "active", max: 10, pos: [1, 0], glyph: "coin",
        skill: { type: "bolt", stat: "atk", element: "gold", mult: lin(1.8, 0.18), gold: () => 0.5, mp: 8, cd: 2.5, motion: "thrust", speed: 1300, range: 600, radius: 26, color: "#ffd84a" },
        desc: (r) => `ดีดเหรียญทองใส่ตัวที่ล็อกไว้ ${pct(lin(1.8, 0.18)(r))} ของพลังโจมตี ธาตุทอง เสียทองครั้งละ เลเวล × 0.5` },
      { id: "trade_crier", name: "ป่าวร้องเรียกลูกค้า", kind: "passive", max: 5, pos: [2, 0], glyph: "cry",
        stats: (r) => ({ stallRate: 0.12 * r, stallSlots: r }),
        desc: (r) => `ร้านที่ตั้งมีลูกค้าแวะมาถี่ขึ้น ${pct(0.12 * r)} วางของได้เพิ่ม ${r} ช่อง` },
      { id: "trade_ledger", name: "บัญชีกำไร", kind: "passive", max: 10, pos: [0, 1], req: [["trade_bargain", 3]], glyph: "bag",
        stats: (r) => ({ bagSlots: 3 * r, goldPct: 0.05 * r }),
        desc: (r) => `ช่องกระเป๋า +${3 * r} ช่อง ทองที่ได้จากมอนสเตอร์ +${pct(0.05 * r)}` },
      { id: "trade_appraiser", name: "ตาเซียน", kind: "passive", max: 5, pos: [2, 1], req: [["trade_crier", 3]], glyph: "eye",
        stats: (r) => ({ stallMarkup: 0.1 * r, sellBonus: 0.02 * r }),
        desc: (r) => `ลูกค้าที่ร้านยอมจ่ายแพงกว่าราคากลางได้อีก ${pct(0.1 * r)} ขายให้ร้านค้า NPC ได้ราคาเพิ่มอีก ${pct(0.02 * r)}` },
      { id: "trade_gold_rain", name: "ฝนเหรียญทอง", kind: "active", max: 5, pos: [1, 2], req: [["trade_coin", 5], ["trade_ledger", 3]], glyph: "storm",
        skill: { type: "blast", stat: "atk", element: "gold", mult: lin(1.4, 0.18), hits: 3, every: 0.3, gold: () => 2, mp: 30, cd: 12, motion: "cast", range: 520, radius: 180, delay: 0.3, color: "#ffe27a" },
        desc: (r) => `โปรยเหรียญทองลงจุดที่เล็ง รัศมี 1.8 ม. 3 ครั้ง ครั้งละ ${pct(lin(1.4, 0.18)(r))} ของพลังโจมตี ธาตุทอง เสียทองครั้งละ เลเวล × 2` },
    ],
  },
  // ---- cart: a loaded cart as a weapon and a wall ----
  merchant_cart: {
    name: "เกวียนสินค้า", cls: null, job: "merchant", color: "#c8a070", glyph: "bag",
    note: "เข็นเกวียนสินค้าลุยศัตรู กวาดรอบตัว พุ่งชน และตั้งเป็นกำบัง ยิ่งของในกระเป๋าเต็มยิ่งตีแรง ทุ่มทุนจ่ายทองเพื่อตีแรงมาก HP และป้องกันสูง",
    nodes: [
      { id: "cart_ironclad", name: "เกวียนหุ้มเหล็ก", kind: "passive", max: 10, pos: [0, 0], glyph: "shield",
        stats: (r) => ({ maxHpPct: 0.025 * r, defPct: 0.02 * r }),
        desc: (r) => `HP สูงสุด +${pct(0.025 * r)} ป้องกัน +${pct(0.02 * r)}` },
      { id: "cart_sweep", name: "เข็นเกวียนกวาด", kind: "active", max: 10, pos: [1, 0], glyph: "spin",
        skill: { type: "nova", stat: "atk", mult: lin(1.5, 0.15), bag: lin(0.3, 0.03), mp: 14, cd: 5, motion: "swing", radius: 220, color: "#d8b07a" },
        desc: (r) => `เข็นเกวียนกวาดรอบตัว 2.2 ม. ${pct(lin(1.5, 0.15)(r))} ของพลังโจมตี แรงขึ้นอีกถึง ${pct(lin(0.3, 0.03)(r))} ตามของในกระเป๋า (เต็มกระเป๋าได้เต็มที่)` },
      { id: "cart_ram", name: "เกวียนพุ่งชน", kind: "active", max: 10, pos: [2, 0], glyph: "dash",
        skill: { type: "dash", stat: "atk", mult: lin(1.8, 0.18), bag: lin(0.3, 0.03), stun: (r) => 0.6 + 0.06 * r, mp: 18, cd: 8, motion: "thrust", distance: 260, width: 80, color: "#c89a60" },
        desc: (r) => `เข็นเกวียนพุ่งไปข้างหน้า 2.6 ม. ${pct(lin(1.8, 0.18)(r))} ของพลังโจมตี มึน ${n1(0.6 + 0.06 * r)} วิ แรงขึ้นอีกถึง ${pct(lin(0.3, 0.03)(r))} ตามของในกระเป๋า` },
      { id: "cart_barricade", name: "ตั้งเกวียนกำบัง", kind: "active", max: 5, pos: [0, 1], req: [["cart_ironclad", 3]], glyph: "shield",
        skill: { type: "buff", mp: 20, cd: 30, motion: "cast", duration: 23, buff: (r) => ({ defPct: 0.1 + 0.03 * r, dmgRed: 0.05 + 0.02 * r, move: -0.2 }), color: "#b89060" },
        desc: (r) => `23 วิ: ป้องกัน +${pct(0.1 + 0.03 * r)} ลดความเสียหาย ${pct(0.05 + 0.02 * r)} เดินช้าลง 20%` },
      { id: "cart_overload", name: "บรรทุกเต็มคัน", kind: "passive", max: 5, pos: [2, 1], req: [["cart_ram", 3]], glyph: "bag",
        stats: (r) => ({ bagSlots: 4 * r, atkPct: 0.02 * r }),
        desc: (r) => `ช่องกระเป๋า +${4 * r} ช่อง พลังโจมตี +${pct(0.02 * r)}` },
      { id: "cart_invest", name: "ทุ่มทุน", kind: "active", max: 5, pos: [1, 2], req: [["cart_sweep", 5]], glyph: "coin",
        skill: { type: "cone", stat: "atk", mult: lin(6.5, 0.9), gold: lin(6, 1), mp: 30, cd: 14, motion: "thrust", reach: 160, arc: 40, color: "#ffd84a" },
        desc: (r) => `ทุ่มทุนทุบตัวที่ล็อกไว้ด้วยเกวียนเต็มแรง ${pct(lin(6.5, 0.9)(r))} ของพลังโจมตี เสียทองครั้งละ เลเวล × ${lin(6, 1)(r)}` },
    ],
  },
};

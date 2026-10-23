// The hunter's branches (third job, from the ranger, the thief, the jester or the mercenary): the
// bow (one prey at a time from far off: an arrow that cuts its tendons, one that freezes it where
// it stands, harder on whatever is crippled, and a hunting chain down to the last shot) and the
// beast (a pack of up to three wolves that follow her and bite what she hits, leap at her prey on
// her word, and now and then on a normal hit by themselves; a bow or any weapon in hand will do).
// Seven skills a branch, a little stronger than the second jobs'. The pack's strike is a falcon-
// type skill with `ally: "wolf"`: the wolves standing land it instead of the falcon (skills.ts).
import type { Need, Tree } from "../../progression";
import { pct, lin } from "../util";

const BOW: Need = { weapons: ["bow"] };
const n1 = (v: number) => +v.toFixed(1);

export const HUNTER_TREES: Record<string, Tree> = {
  // ---- the bow: cripple the prey from afar, then the chain that ends it ----
  hunter_bow: {
    name: "ธนูนักล่า", cls: null, job3: "hunter", color: "#c8e08a", glyph: "arrow",
    note: "ถือธนูยิงเหยื่อทีละตัวจากระยะไกลสุดตา ศรตัดเอ็นให้มันเดินช้า ศรเยือกแข็งตรึงมันไว้กับที่ ยิ่งเหยื่อติดสถานะยิ่งโดนแรง แล้วไล่ล่าเป็นกระบวนท่า: ศรตัดเอ็นหรือศรเยือกแข็ง → ศรล่าเหยื่อ → ศรปลิดลมหายใจ ยิงได้ไกลถึง 11 ม.",
    nodes: [
      { id: "hunter_bow_draw", name: "แรงง้างพราน", kind: "passive", max: 10, pos: [0, 0], glyph: "up", need: BOW,
        stats: (r) => ({ atkPct: 0.012 * r, reach: 0.02 * r }),
        desc: (r) => `พลังโจมตี +${pct(0.012 * r)} ระยะยิงปกติ +${pct(0.02 * r)} เมื่อถือธนู` },
      { id: "hunter_bow_hamstring", name: "ศรตัดเอ็น", kind: "active", max: 10, pos: [1, 0], glyph: "arrow", need: BOW,
        skill: { type: "bolt", stat: "atk", mult: lin(2.0, 0.2), slow: lin(2.5, 0.25), arrow: true, mp: 14, cd: 4, motion: "shoot", speed: 1700, range: 900, radius: 26, color: "#e8f0b0" },
        desc: (r) => `ยิงศรตัดเอ็นตัวที่ล็อกไว้ระยะ 9 ม. ${pct(lin(2.0, 0.2)(r))} ของพลังโจมตี มันเดินช้าลงครึ่งหนึ่ง ${n1(lin(2.5, 0.25)(r))} วิ ใช้ได้เมื่อถือธนู` },
      { id: "hunter_bow_frost", name: "ศรเยือกแข็ง", kind: "active", max: 10, pos: [2, 0], glyph: "freeze", need: BOW,
        skill: { type: "bolt", stat: "atk", element: "ice", mult: lin(1.8, 0.18), freeze: lin(1.0, 0.1), arrow: true, mp: 16, cd: 7, motion: "shoot", speed: 1700, range: 850, radius: 26, color: "#bfe8ff" },
        desc: (r) => `ยิงศรเยือกแข็งใส่ตัวที่ล็อกไว้ระยะ 8.5 ม. ${pct(lin(1.8, 0.18)(r))} ของพลังโจมตี (ธาตุน้ำแข็ง) แช่แข็งตรึงไว้กับที่ ${n1(lin(1.0, 0.1)(r))} วิ ใช้ได้เมื่อถือธนู` },
      { id: "hunter_bow_trail", name: "ตามรอยบาดแผล", kind: "passive", max: 5, pos: [0, 1], req: [["hunter_bow_draw", 3]], glyph: "eye", need: BOW,
        stats: (r) => ({ huntDmg: 0.03 * r, critDmg: 0.04 * r }),
        desc: (r) => `ดาเมจใส่ศัตรูที่ติดสถานะผิดปกติ (ช้า แช่แข็ง มึน พิษ ฯลฯ) +${pct(0.03 * r)} แรงคริติคอล +${pct(0.04 * r)} เมื่อถือธนู` },
      { id: "hunter_bow_stare", name: "จ้องเหยื่อ", kind: "active", max: 5, pos: [2, 1], req: [["hunter_bow_frost", 3]], glyph: "target", need: BOW,
        skill: { type: "buff", mp: 28, cd: 35, motion: "cast", duration: 15, buff: (r) => ({ atkPct: 0.08 + 0.02 * r, crit: 0.02 + 0.004 * r }), color: "#e0f0a0" },
        desc: (r) => `15 วิ: พลังโจมตี +${pct(0.08 + 0.02 * r)} โอกาสคริติคอล +${pct(0.02 + 0.004 * r)} ใช้ได้เมื่อถือธนู` },
      { id: "hunter_bow_quarry", name: "ศรล่าเหยื่อ", kind: "active", max: 10, pos: [1, 2], req: [["hunter_bow_hamstring", 4]], glyph: "pierce", need: BOW,
        skill: { type: "bolt", stat: "atk", mult: lin(2.3, 0.23), stun: () => 0.5, arrow: true, mp: 20, cd: 6, motion: "shoot", speed: 1800, range: 950, radius: 28,
          combo: { after: ["hunter_bow_hamstring", "hunter_bow_frost"], within: 4, more: (r) => 0.25 + 0.03 * r }, color: "#f0ffc0" },
        desc: (r) => `ยิงศรเจาะตัวที่ล็อกไว้ระยะ 9.5 ม. ${pct(lin(2.3, 0.23)(r))} ของพลังโจมตี มึน 0.5 วิ ใช้ต่อจากศรตัดเอ็นหรือศรเยือกแข็งภายใน 4 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)} ใช้ได้เมื่อถือธนู` },
      { id: "hunter_bow_last_breath", name: "ศรปลิดลมหายใจ", kind: "active", max: 5, pos: [1, 3], req: [["hunter_bow_quarry", 5], ["hunter_bow_stare", 1]], glyph: "skull", need: BOW,
        skill: { type: "bolt", stat: "atk", mult: lin(5.3, 0.66), stun: () => 1, arrow: true, mp: 48, cd: 15, motion: "shoot", speed: 2100, range: 1100, radius: 30,
          combo: { after: ["hunter_bow_quarry"], within: 4, more: () => 0.35 }, color: "#fffbe0" },
        desc: (r) => `ยิงศรสุดแรงใส่ตัวที่ล็อกไว้ระยะ 11 ม. ${pct(lin(5.3, 0.66)(r))} ของพลังโจมตี มึน 1 วิ ใช้ต่อจากศรล่าเหยื่อภายใน 4 วิ แรงขึ้น 35% ใช้ได้เมื่อถือธนู` },
    ],
  },
  // ---- the beast: the pack follows, bites what she hits, leaps on her word ----
  hunter_beast: {
    name: "สัตว์ล่าเหยื่อ", cls: null, job3: "hunter", color: "#d0b080", glyph: "paw",
    note: "ออกล่ากับฝูงหมาป่าได้ทั้งถือธนูและอาวุธระยะประชิด หมาป่ามีพร้อมกันได้ 3 ตัว ตามตัวและกัดตัวที่เราตี สั่งฝูงขย้ำให้ทุกตัวกระโจนใส่เหยื่อพร้อมกัน ตีปกติแล้วฝูงขย้ำตามเอง ลูกดอกกลิ่นเลือดทำให้เหยื่อโดนแรงขึ้น ปิดท้ายด้วยฝูงหมาป่าทึ้งเหยื่อ หมาป่าแรงและทนตามพลังโจมตีและ HP ของเรา",
    nodes: [
      { id: "hunter_beast_call", name: "เรียกฝูงหมาป่า", kind: "active", max: 10, pos: [0, 0], glyph: "paw",
        skill: { type: "summon", ally: "wolf", stat: "atk", mult: lin(0.4, 0.04), base: lin(0.25, 0.03), count: 3, duration: 45, every: 1, mp: 18, cd: 4, motion: "cast", color: "#d0b080" },
        desc: (r) => `เรียกหมาป่ามาร่วมล่าครั้งละตัว มีพร้อมกันได้ 3 ตัว อยู่ 45 วิ HP ${pct(lin(0.25, 0.03)(r))} ของ HP สูงสุด เดินตามเรา กัดตัวที่เราตีหรือตัวที่ไล่เรา ทุก 1 วิ ครั้งละ ${pct(lin(0.4, 0.04)(r))} ของพลังโจมตี` },
      { id: "hunter_beast_scent", name: "ลูกดอกกลิ่นเลือด", kind: "active", max: 10, pos: [1, 0], glyph: "target",
        skill: { type: "bolt", stat: "atk", mult: lin(2.0, 0.2), expose: (r) => 0.08 + 0.012 * r, debuff: 8, mp: 14, cd: 5, motion: "shoot", speed: 1400, range: 700, radius: 26, color: "#e07a5a" },
        desc: (r) => `ปาลูกดอกชุบเลือดใส่ตัวที่ล็อกไว้ระยะ 7 ม. ${pct(lin(2.0, 0.2)(r))} ของพลังโจมตี กลิ่นเลือดทำให้มันโดนแรงขึ้น ${pct(0.08 + 0.012 * r)} 8 วิ ทั้งจากเราและหมาป่า` },
      { id: "hunter_beast_blood", name: "สายเลือดจ่าฝูง", kind: "passive", max: 10, pos: [2, 0], glyph: "heart",
        stats: (r) => ({ atkPct: 0.012 * r, maxHpPct: 0.012 * r }),
        desc: (r) => `พลังโจมตี +${pct(0.012 * r)} HP สูงสุด +${pct(0.012 * r)} (หมาป่ากัดแรงและทนขึ้นตามไปด้วย)` },
      { id: "hunter_beast_pounce", name: "สั่งฝูงขย้ำ", kind: "active", max: 10, pos: [0, 1], req: [["hunter_beast_call", 3]], glyph: "dash",
        skill: { type: "falcon", ally: "wolf", stat: "atk", mult: lin(0.6, 0.06), range: 700, mp: 16, cd: 5, motion: "thrust", color: "#e8c890" },
        desc: (r) => `สั่งหมาป่าทุกตัวกระโจนขย้ำตัวที่ล็อกไว้ (ระยะ 7 ม.) ตัวละ ${pct(lin(0.6, 0.06)(r))} ของพลังโจมตี ต้องมีหมาป่าอยู่ด้วย` },
      { id: "hunter_beast_howl", name: "หอนนำฝูง", kind: "active", max: 5, pos: [2, 1], req: [["hunter_beast_blood", 3]], glyph: "cry",
        skill: { type: "buff", mp: 28, cd: 35, motion: "cast", duration: 20, buff: (r) => ({ atkPct: 0.08 + 0.02 * r, aspd: 0.04 + 0.012 * r, move: 0.05 + 0.01 * r }), color: "#f0d090" },
        desc: (r) => `20 วิ: พลังโจมตี +${pct(0.08 + 0.02 * r)} ความเร็วโจมตี +${pct(0.04 + 0.012 * r)} ความเร็วเดิน +${pct(0.05 + 0.01 * r)} (หมาป่ากัดแรงขึ้นตามพลังโจมตีของเรา)` },
      { id: "hunter_beast_pack", name: "ล่าเป็นฝูง", kind: "passive", max: 5, pos: [0, 2], req: [["hunter_beast_pounce", 3]], glyph: "twin",
        stats: (r) => ({ autocast_hunter_beast_pounce: 0.03 * r, huntDmg: 0.02 * r }),
        desc: (r) => `ตีปกติโดนแล้วมีโอกาส ${pct(0.03 * r)} ที่หมาป่าทุกตัวกระโจนขย้ำตาม (สั่งฝูงขย้ำระดับที่เรียนไว้ ไม่เสีย MP) ดาเมจใส่ศัตรูที่ติดสถานะผิดปกติ +${pct(0.02 * r)}` },
      { id: "hunter_beast_feast", name: "ฝูงหมาป่าทึ้งเหยื่อ", kind: "active", max: 5, pos: [1, 2], req: [["hunter_beast_pounce", 5], ["hunter_beast_howl", 1]], glyph: "rage",
        skill: { type: "falcon", ally: "wolf", stat: "atk", mult: lin(0.6, 0.075), hits: 3, range: 700, mp: 45, cd: 15, motion: "thrust",
          combo: { after: ["hunter_beast_pounce"], within: 4, more: () => 0.3 }, color: "#ffd8a0" },
        desc: (r) => `หมาป่าทุกตัวรุมทึ้งตัวที่ล็อกไว้ (ระยะ 7 ม.) ตัวละ 3 ครั้ง ครั้งละ ${pct(lin(0.6, 0.075)(r))} ของพลังโจมตี ใช้ต่อจากสั่งฝูงขย้ำภายใน 4 วิ แรงขึ้น 30% ต้องมีหมาป่าอยู่ด้วย` },
    ],
  },
};

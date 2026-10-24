// The viking's branches (fourth job, docs/v05_jobs.md, from any third job): the axe (axes, heavy
// criticals that go through the armour, a great deal of HP, and that HP turned into attack: the
// hpToAtk stat, a share of max HP added to attack, on a passive and on the berserker's rage) and
// the mace (maces, heavy blows that daze, normal hits that daze now and then, a body with the HP
// and the defence of a glacier). Eight skills a branch, a little stronger than the third jobs'
// (the knight's axe is the measure).
import type { Need, Tree } from "../../progression";
import { pct, lin } from "../util";

const AXES: Need = { weapons: ["axe", "axe_2h"] };
const MACE: Need = { weapons: ["mace"] };
const n1 = (v: number) => +v.toFixed(1);

export const VIKING_TREES: Record<string, Tree> = {
  // ---- the axe: through the armour, heavy criticals, blood into might ----
  viking_axe: {
    name: "สายขวาน", cls: null, job4: "viking", color: "#d8a888", glyph: "rage",
    note: "ถือขวานหรือขวานสองมือ คริติคอลหนักและไม่สนเกราะ HP สูง และเปลี่ยนพลังชีวิตเป็นพลังโจมตี: ยิ่ง HP สูงสุดมากยิ่งตีแรง คลั่งแบบเบอร์เซิร์กเกอร์แล้วฟันต่อกันเป็นกระบวนท่า: ผ่ากะโหลก → ขวานทลายโล่ → ขวานวัลฮัลลา",
    nodes: [
      { id: "viking_axe_blood", name: "เลือดนักรบเหนือ", kind: "passive", max: 10, pos: [0, 0], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.018 * r, hpRegen: r }),
        desc: (r) => `HP สูงสุด +${pct(0.018 * r)} ฟื้น HP +${r}/วิ` },
      { id: "viking_axe_cleave", name: "ผ่ากะโหลก", kind: "active", max: 10, pos: [1, 0], glyph: "bash", need: AXES,
        skill: { type: "cone", stat: "atk", mult: lin(2.3, 0.23), mp: 16, cd: 4, motion: "swing", reach: 170, arc: 45, color: "#f0c0a0" },
        desc: (r) => `จามขวานลงกลางกะโหลกตัวที่ล็อกไว้ ${pct(lin(2.3, 0.23)(r))} ของพลังโจมตี ใช้ได้เมื่อถือขวาน` },
      { id: "viking_axe_whirl", name: "ขวานหมุนพายุเหนือ", kind: "active", max: 10, pos: [2, 0], glyph: "spin", need: AXES,
        skill: { type: "nova", stat: "atk", mult: lin(1.1, 0.11), hits: 2, mp: 22, cd: 6, motion: "swing", radius: 240, color: "#e8b090" },
        desc: (r) => `เหวี่ยงขวานหมุนรอบตัวรัศมี 2.4 ม. 2 รอบ รอบละ ${pct(lin(1.1, 0.11)(r))} ของพลังโจมตี ใช้ได้เมื่อถือขวาน` },
      { id: "viking_axe_bite", name: "คมขวานไม่สนเกราะ", kind: "passive", max: 10, pos: [3, 0], glyph: "up", need: AXES,
        stats: (r) => ({ pierce: 0.012 * r, critDmg: 0.03 * r }),
        desc: (r) => `เจาะเกราะ +${pct(0.012 * r)} แรงคริติคอล +${pct(0.03 * r)} เมื่อถือขวาน` },
      // the HP turned into attack: hpToAtk, a share of max HP on top of attack
      { id: "viking_axe_fury", name: "โลหิตเป็นคมขวาน", kind: "passive", max: 5, pos: [0, 1], req: [["viking_axe_blood", 3]], glyph: "drop", need: AXES,
        stats: (r) => ({ hpToAtk: 0.003 * r, crit: 0.006 * r }),
        desc: (r) => `พลังโจมตีเพิ่มเท่ากับ ${pct(0.003 * r)} ของ HP สูงสุด โอกาสคริติคอล +${pct(0.006 * r)} เมื่อถือขวาน` },
      { id: "viking_axe_split", name: "ขวานทลายโล่", kind: "active", max: 10, pos: [1, 1], req: [["viking_axe_cleave", 4]], glyph: "slam", need: AXES,
        skill: { type: "cone", stat: "atk", mult: lin(2.7, 0.27), mp: 20, cd: 6, motion: "swing", reach: 180, arc: 40,
          combo: { after: ["viking_axe_cleave"], within: 4, more: (r) => 0.4 + 0.02 * r }, color: "#ffb088" },
        desc: (r) => `ฟันทลายโล่และเกราะของตัวที่ล็อกไว้ ${pct(lin(2.7, 0.27)(r))} ของพลังโจมตี ใช้ต่อจากผ่ากะโหลกภายใน 4 วิ แรงขึ้น ${pct(0.4 + 0.02 * r)} ใช้ได้เมื่อถือขวาน` },
      { id: "viking_axe_berserk", name: "เบอร์เซิร์กเกอร์", kind: "active", max: 5, pos: [2, 1], req: [["viking_axe_whirl", 3]], glyph: "cry", need: AXES,
        skill: { type: "buff", mp: 30, cd: 40, motion: "swing", duration: 15, buff: (r) => ({ hpToAtk: 0.008 + 0.0025 * r, crit: 0.03 + 0.006 * r, critDmg: 0.1 + 0.03 * r }), color: "#ff9a70" },
        desc: (r) => `15 วิ: คลั่งแบบเบอร์เซิร์กเกอร์ พลังโจมตีเพิ่มเท่ากับ ${pct(0.008 + 0.0025 * r)} ของ HP สูงสุด โอกาสคริติคอล +${pct(0.03 + 0.006 * r)} แรงคริติคอล +${pct(0.1 + 0.03 * r)} ใช้ได้เมื่อถือขวาน` },
      { id: "viking_axe_valhalla", name: "ขวานวัลฮัลลา", kind: "active", max: 5, pos: [1, 2], req: [["viking_axe_split", 5], ["viking_axe_berserk", 1]], glyph: "skull", need: AXES,
        skill: { type: "cone", stat: "atk", mult: lin(6.2, 0.78), mp: 55, cd: 16, motion: "swing", reach: 200, arc: 40,
          combo: { after: ["viking_axe_split"], within: 4, more: () => 0.4 }, color: "#ffd0b0" },
        desc: (r) => `ฟันขวานสุดแรงส่งตัวที่ล็อกไว้ไปวัลฮัลลา ${pct(lin(6.2, 0.78)(r))} ของพลังโจมตี ใช้ต่อจากขวานทลายโล่ภายใน 4 วิ แรงขึ้น 40% ใช้ได้เมื่อถือขวาน` },
    ],
  },
  // ---- the mace: blows that daze, a body like a glacier ----
  viking_mace: {
    name: "สายกระบอง", cls: null, job4: "viking", color: "#b8b0a0", glyph: "slam",
    note: "ถือค้อน ทุบหนักจนศัตรูมึน ตีปกติก็ทำให้มึนได้ HP และป้องกันสูง ทนทานดั่งภูผาน้ำแข็ง ทุบต่อกันเป็นกระบวนท่า: ทุบสะท้านหรือทุบพื้นสั่นปฐพี → ค้อนทลายหัว → ค้อนอัสนีทลายพิภพ",
    nodes: [
      { id: "viking_mace_hide", name: "กายาภูผาน้ำแข็ง", kind: "passive", max: 10, pos: [0, 0], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.015 * r, defPct: 0.015 * r }),
        desc: (r) => `HP สูงสุด +${pct(0.015 * r)} ป้องกัน +${pct(0.015 * r)}` },
      { id: "viking_mace_smash", name: "ทุบสะท้าน", kind: "active", max: 10, pos: [1, 0], glyph: "bash", need: MACE,
        skill: { type: "cone", stat: "atk", mult: lin(2.3, 0.23), stun: () => 0.5, mp: 16, cd: 4, motion: "thrust", reach: 160, arc: 45, color: "#d8d0c0" },
        desc: (r) => `ทุบตัวที่ล็อกไว้ ${pct(lin(2.3, 0.23)(r))} ของพลังโจมตี มึน 0.5 วิ ใช้ได้เมื่อถือค้อน` },
      { id: "viking_mace_quake", name: "ทุบพื้นสั่นปฐพี", kind: "active", max: 10, pos: [2, 0], glyph: "earth", need: MACE,
        skill: { type: "nova", stat: "atk", mult: lin(2.0, 0.2), stun: () => 1, mp: 22, cd: 7, motion: "thrust", radius: 230, color: "#c8b898" },
        desc: (r) => `ทุบพื้นให้สั่นสะเทือนรอบตัวรัศมี 2.3 ม. ${pct(lin(2.0, 0.2)(r))} ของพลังโจมตี ทุกตัวมึน 1 วิ ใช้ได้เมื่อถือค้อน` },
      { id: "viking_mace_weight", name: "ค้อนหนักพันชั่ง", kind: "passive", max: 10, pos: [3, 0], glyph: "up", need: MACE,
        stats: (r) => ({ stunHit: 0.01 * r, atkPct: 0.01 * r }),
        desc: (r) => `ตีปกติมีโอกาส ${pct(0.01 * r)} ทำให้มึน 1 วิ พลังโจมตี +${pct(0.01 * r)} เมื่อถือค้อน` },
      { id: "viking_mace_bear", name: "หนังหมีขาวเกราะเหล็ก", kind: "passive", max: 5, pos: [0, 1], req: [["viking_mace_hide", 3]], glyph: "shield",
        stats: (r) => ({ dmgRed: 0.01 * r, mdefPct: 0.03 * r }),
        desc: (r) => `ลดความเสียหาย ${pct(0.01 * r)} ต้านเวท +${pct(0.03 * r)}` },
      { id: "viking_mace_skull", name: "ค้อนทลายหัว", kind: "active", max: 10, pos: [1, 1], req: [["viking_mace_smash", 4]], glyph: "slam", need: MACE,
        skill: { type: "cone", stat: "atk", mult: lin(2.7, 0.27), stun: () => 1, mp: 20, cd: 6, motion: "thrust", reach: 170, arc: 40,
          combo: { after: ["viking_mace_smash", "viking_mace_quake"], within: 3, more: (r) => 0.3 + 0.02 * r }, color: "#e8e0d0" },
        desc: (r) => `ฟาดค้อนลงหัวตัวที่ล็อกไว้ ${pct(lin(2.7, 0.27)(r))} ของพลังโจมตี มึน 1 วิ ใช้ต่อจากทุบสะท้านหรือทุบพื้นสั่นปฐพีภายใน 3 วิ แรงขึ้น ${pct(0.3 + 0.02 * r)} ใช้ได้เมื่อถือค้อน` },
      { id: "viking_mace_glacier", name: "ใจธารน้ำแข็ง", kind: "active", max: 5, pos: [2, 1], req: [["viking_mace_quake", 3]], glyph: "freeze", need: MACE,
        skill: { type: "buff", mp: 30, cd: 40, motion: "thrust", duration: 20, buff: (r) => ({ defPct: 0.1 + 0.03 * r, maxHpPct: 0.05 + 0.015 * r, statusRes: 0.1 + 0.03 * r }), color: "#d8ecff" },
        desc: (r) => `20 วิ: ป้องกัน +${pct(0.1 + 0.03 * r)} HP สูงสุด +${pct(0.05 + 0.015 * r)} ต้านสถานะ ${pct(0.1 + 0.03 * r)} ใช้ได้เมื่อถือค้อน` },
      { id: "viking_mace_thunder", name: "ค้อนอัสนีทลายพิภพ", kind: "active", max: 5, pos: [1, 2], req: [["viking_mace_skull", 5], ["viking_mace_glacier", 1]], glyph: "bolt", need: MACE,
        skill: { type: "nova", stat: "atk", mult: lin(1.95, 0.24), hits: 3, stun: lin(1.5, 0.1), mp: 55, cd: 18, motion: "thrust", radius: 280,
          combo: { after: ["viking_mace_skull"], within: 4, more: () => 0.3 }, color: "#fff4c0" },
        desc: (r) => `ทุบค้อนอัสนีลงพื้นสะท้านรอบตัวรัศมี 2.8 ม. 3 ระลอก ระลอกละ ${pct(lin(1.95, 0.24)(r))} ของพลังโจมตี ทุกตัวมึน ${n1(lin(1.5, 0.1)(r))} วิ ใช้ต่อจากค้อนทลายหัวภายใน 4 วิ แรงขึ้น 30% ใช้ได้เมื่อถือค้อน` },
    ],
  },
};

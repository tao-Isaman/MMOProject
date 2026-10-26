// The druid's branches (fourth job, from the archmage, the high bishop, the monk or the
// magician): nature (plant and stone spells, heals that come a part a second, a little oak sprite
// that heals her, a body of old roots with far more HP) and the wild (three shapes: the pine
// bear's close blows with HP and defence, the steppe eagle's quick shots from afar, the crimson
// stag's blows that heal; each shape has its own skill, and each of those hits far harder right
// after another shape's, so the way to fight is to change shape). The druid comes from casters:
// every blow and spell of hers is on magic attack, the shapes' too. Eleven skills a branch (five
// of them passives, v0.6), a little stronger than the third jobs' at the same rank.
import type { Need, Tree } from "../../progression";
import { pct, lin } from "../util";

const BEAR: Need = { form: "bear" };
const BIRD: Need = { form: "bird" };
const DEER: Need = { form: "deer" };
const n1 = (v: number) => +v.toFixed(1);
// What every shape's desc ends with: how she gets out of it, and what she can't do in it.
const SHAPE = "ใช้ซ้ำเพื่อคืนร่าง ใช้ร่างอื่นเพื่อสลับร่าง ระหว่างแปลงร่างร่ายเวท ฮีล และบัฟได้ แต่สกิลที่ต้องถืออาวุธใช้ไม่ได้";
// Each shape's skill right after another shape's: the reason to change shape mid-fight.
const SWITCH = (others: string[]) => ({ after: others, within: 6, more: (r: number) => 0.2 + 0.03 * r });
const switchText = (others: string, r: number) => `ใช้ภายใน 6 วิ หลัง${others} (สลับร่างมา) แรงขึ้น ${pct(0.2 + 0.03 * r)}`;

export const DRUID_TREES: Record<string, Tree> = {
  // ---- nature: plant and stone, heals over time, a body of roots ----
  druid_nature: {
    name: "พลังธรรมชาติ", cls: null, job4: "druid", color: "#90d080", glyph: "leaf",
    note: "เวทธาตุพืชและหิน: หนามพฤกษาที่รัดให้ช้า ศิลาผุดพสุธาที่ทำให้มึน และพายุพงไพรพิโรธที่ดูดชีวิตคืน ฟื้นฟูแห่งพงไพรค่อย ๆ ฟื้น HP ทีละวิ ภูตพฤกษาตามติดคอยฟื้น HP และเสริมพลัง HP สูงและป้องกันหนาด้วยรากแก้วและผิวเปลือกไม้ศิลา",
    nodes: [
      { id: "druid_nature_thorn", name: "หนามพฤกษา", kind: "active", max: 10, pos: [1, 0], glyph: "thorn",
        skill: { type: "bolt", stat: "matk", element: "plant", mult: lin(3.3, 0.33), slow: lin(1.5, 0.15), mp: 15, cd: 2.5, cast: 0.6, motion: "cast", speed: 1050, range: 620, radius: 32, color: "#7ad060" },
        desc: (r) => `ร่ายหนามไม้พุ่งใส่ตัวที่ล็อกไว้ ${pct(lin(3.3, 0.33)(r))} ของพลังเวท เถาวัลย์รัดให้ช้าลง ${n1(lin(1.5, 0.15)(r))} วิ` },
      { id: "druid_nature_roots", name: "รากแก้วโบราณ", kind: "passive", max: 10, pos: [0, 0], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.02 * r, hpRegen: r }),
        desc: (r) => `HP สูงสุด +${pct(0.02 * r)} ฟื้น HP +${r}/วิ` },
      { id: "druid_nature_rejuv", name: "ฟื้นฟูแห่งพงไพร", kind: "active", max: 10, pos: [2, 0], glyph: "heal",
        skill: { type: "heal", stat: "matk", heal: lin(0.22, 0.026), mult: lin(2.0, 0.2), hot: true, mp: 24, cd: 8, motion: "cast", color: "#a0f0a0" },
        desc: (r) => `ฟื้น HP ${pct(lin(0.22, 0.026)(r))} ของ HP สูงสุด + ${pct(lin(2.0, 0.2)(r))} ของพลังเวท ค่อย ๆ ฟื้นทีละส่วนตลอด 5 วิ` },
      { id: "druid_nature_heart", name: "ใจพฤกษาศิลา", kind: "passive", max: 10, pos: [3, 0], glyph: "leaf",
        stats: (r) => ({ matkPct: 0.012 * r, plantAtk: n1(1.5 * r), stoneAtk: n1(1.5 * r) }),
        desc: (r) => `พลังเวท +${pct(0.012 * r)} พลังโจมตีธาตุพืชและหิน +${n1(1.5 * r)}` },
      { id: "druid_nature_bark", name: "ผิวเปลือกไม้ศิลา", kind: "active", max: 5, pos: [0, 1], req: [["druid_nature_roots", 3]], glyph: "shield",
        skill: { type: "buff", mp: 28, cd: 35, motion: "cast", duration: 30, heal: lin(0.06, 0.015), hot: true,
          buff: (r) => ({ defPct: 0.08 + 0.025 * r, dmgRed: 0.02 + 0.01 * r, maxHpPct: 0.04 + 0.02 * r }), color: "#b8a070" },
        desc: (r) => `30 วิ: ผิวกายกลายเป็นเปลือกไม้หุ้มหิน ป้องกัน +${pct(0.08 + 0.025 * r)} ลดความเสียหาย ${pct(0.02 + 0.01 * r)} HP สูงสุด +${pct(0.04 + 0.02 * r)} และค่อย ๆ ฟื้น HP ${pct(lin(0.06, 0.015)(r))} ของ HP สูงสุดใน 5 วิ` },
      { id: "druid_nature_stone", name: "ศิลาผุดพสุธา", kind: "active", max: 10, pos: [1, 1], req: [["druid_nature_thorn", 4]], glyph: "earth",
        skill: { type: "blast", stat: "matk", element: "stone", mult: lin(1.7, 0.17), hits: 2, every: 0.35, stun: () => 0.6, mp: 24, cd: 7, cast: 0.8, motion: "cast", range: 560, radius: 200, delay: 0.3,
          combo: { after: ["druid_nature_thorn"], within: 4, more: (r) => 0.2 + 0.03 * r }, color: "#c8a878" },
        desc: (r) => `ให้หินแหลมผุดจากพื้นตรงจุดที่เล็ง รัศมี 2 ม. 2 ครั้ง ครั้งละ ${pct(lin(1.7, 0.17)(r))} ของพลังเวท มึน 0.6 วิ ใช้ต่อจากหนามพฤกษาภายใน 4 วิ แรงขึ้น ${pct(0.2 + 0.03 * r)}` },
      // the familiar's own look: the little oak sprite (allies.ts)
      { id: "druid_nature_sprite", name: "ภูตพฤกษาผู้เยียวยา", kind: "active", max: 5, pos: [2, 1], req: [["druid_nature_rejuv", 3]], glyph: "flower",
        skill: { type: "summon", ally: "familiar", heal: lin(0.02, 0.004), every: 3, radius: 300, base: lin(0.4, 0.06), duration: 45,
          buff: (r) => ({ hpRegen: 2 + 2 * r, matkPct: 0.03 + 0.01 * r }), mp: 30, cd: 30, motion: "cast", color: "#b0f090" },
        desc: (r) => `เรียกภูตต้นโอ๊กมาติดตาม 45 วิ HP ${pct(lin(0.4, 0.06)(r))} ของ HP สูงสุด ทุก 3 วิ ฟื้น HP ให้เรา ${pct(lin(0.02, 0.004)(r))} ของ HP สูงสุด และเมื่อเราอยู่ในวง 3 ม. รอบมัน: ฟื้น HP +${2 + 2 * r}/วิ พลังเวท +${pct(0.03 + 0.01 * r)}` },
      { id: "druid_nature_wrath", name: "พายุพงไพรพิโรธ", kind: "active", max: 5, pos: [1, 2], req: [["druid_nature_stone", 5], ["druid_nature_sprite", 1]], glyph: "storm",
        skill: { type: "storm", stat: "matk", element: "plant", mult: lin(1.9, 0.24), pulses: 5, every: 0.35, drain: () => 0.04, slow: () => 2.3, mp: 50, cd: 16, cast: 1.6, motion: "cast", radius: 300,
          combo: { after: ["druid_nature_stone", "druid_nature_thorn"], within: 4, more: () => 0.35 }, color: "#90e070" },
        desc: (r) => `ร่ายพายุใบไม้และหนามหมุนรอบตัวรัศมี 3 ม. 5 ระลอก ระลอกละ ${pct(lin(1.9, 0.24)(r))} ของพลังเวท ศัตรูช้าลง 2.3 วิ ฟื้น HP 4% ของดาเมจที่ทำ ใช้ต่อจากศิลาผุดพสุธาหรือหนามพฤกษาภายใน 4 วิ แรงขึ้น 35%` },
      // v0.6: three more passives (the branch's five)
      { id: "druid_nature_grove", name: "ป่าศักดิ์สิทธิ์", kind: "passive", max: 5, pos: [3, 1], req: [["druid_nature_heart", 3]], glyph: "leaf",
        stats: (r) => ({ castRed: 0.015 * r, cdr: 0.01 * r }),
        desc: (r) => `ลดเวลาร่าย ${pct(0.015 * r)} ลดคูลดาวน์ ${pct(0.01 * r)}` },
      { id: "druid_nature_moss", name: "พรมตะไคร่ชุ่มชื้น", kind: "passive", max: 5, pos: [0, 2], req: [["druid_nature_bark", 1]], glyph: "drop",
        stats: (r) => ({ healPct: 0.03 * r, mpRegen: n1(0.3 * r) }),
        desc: (r) => `สกิลรักษาแรงขึ้น ${pct(0.03 * r)} ฟื้น MP +${n1(0.3 * r)}/วิ` },
      { id: "druid_nature_seed", name: "เมล็ดพันธุ์ผูกพัน", kind: "passive", max: 5, pos: [2, 2], req: [["druid_nature_sprite", 1]], glyph: "flower",
        stats: (r) => ({ allyPct: 0.03 * r, statusRes: 0.03 * r }),
        desc: (r) => `ผู้ช่วยทุกตัว (ภูตพฤกษาด้วย) HP และแรงตี +${pct(0.03 * r)} ต้านสถานะ +${pct(0.03 * r)}` },
    ],
  },
  // ---- the wild: three shapes, a skill for each, and the change between them ----
  druid_wild: {
    name: "พลังสัตว์ป่า", cls: null, job4: "druid", color: "#c8a878", glyph: "paw",
    note: "แปลงร่างเป็นหมีสน (ตีประชิด HP และป้องกันสูง) นกอินทรีทุ่งหญ้า (ยิงจากระยะไกล เร็ว) หรือกวางเขาแดง (ตีแล้วฟื้น HP) ตีปกติเปลี่ยนไปตามร่าง แต่ละร่างมีสกิลของตัวเอง และสกิลของแต่ละร่างแรงขึ้นมากเมื่อใช้ไม่นานหลังสกิลของร่างอื่น: ตะปบหมีคำราม ↔ พายุขนนกคม ↔ เขากวางชุบชีวา สลับร่างไปมาจึงได้เปรียบ ตีและร่ายด้วยพลังเวท",
    nodes: [
      { id: "druid_wild_bear", name: "ร่างหมีสน", kind: "active", max: 10, pos: [0, 0], glyph: "paw",
        skill: { type: "form", form: "bear", look: "pine_bear", duration: 135, mp: 16, cd: 3, motion: "cast", color: "#b08050",
          buff: (r) => ({ maxHpPct: 0.1 + 0.015 * r, defPct: 0.12 + 0.02 * r, dmgRed: 0.01 + 0.003 * r }),
          formAttack: { kind: "melee", stat: "matk", mult: lin(1.25, 0.08), reach: 150, every: 1.1 } },
        desc: (r) => `แปลงร่างเป็นหมีสน 135 วิ: HP สูงสุด +${pct(0.1 + 0.015 * r)} ป้องกัน +${pct(0.12 + 0.02 * r)} ลดความเสียหาย ${pct(0.01 + 0.003 * r)} ตีปกติเป็นตะปบระยะประชิด ${pct(lin(1.25, 0.08)(r))} ของพลังเวท ทุก 1.1 วิ (${SHAPE})` },
      { id: "druid_wild_bird", name: "ร่างนกอินทรี", kind: "active", max: 10, pos: [1, 0], glyph: "wing",
        skill: { type: "form", form: "bird", look: "steppe_eagle", duration: 135, mp: 16, cd: 3, motion: "cast", color: "#d8e0f0",
          buff: (r) => ({ move: 0.06 + 0.01 * r, aspd: 0.05 + 0.015 * r, flee: 4 + 2 * r }),
          formAttack: { kind: "ranged", stat: "matk", element: "wind", mult: lin(0.7, 0.04), range: 620, every: 0.7 } },
        desc: (r) => `แปลงร่างเป็นนกอินทรีทุ่งหญ้า 135 วิ: ความเร็วเดิน +${pct(0.06 + 0.01 * r)} ความเร็วโจมตี +${pct(0.05 + 0.015 * r)} หลบหลีก +${4 + 2 * r} ตีปกติเป็นขนนกคมธาตุลมยิงไกล 6.2 ม. ${pct(lin(0.7, 0.04)(r))} ของพลังเวท ทุก 0.7 วิ (${SHAPE})` },
      { id: "druid_wild_deer", name: "ร่างกวางเขาแดง", kind: "active", max: 10, pos: [2, 0], glyph: "leaf",
        skill: { type: "form", form: "deer", look: "crimson_stag", duration: 135, mp: 16, cd: 3, motion: "cast", color: "#e07060",
          buff: (r) => ({ hpRegen: n1(4 + 1.6 * r), healPct: 0.05 + 0.015 * r, mdefPct: 0.06 + 0.012 * r }),
          formAttack: { kind: "melee", stat: "matk", element: "plant", mult: lin(0.95, 0.06), heal: lin(0.08, 0.008), reach: 140, every: 1.0 } },
        desc: (r) => `แปลงร่างเป็นกวางเขาแดง 135 วิ: ฟื้น HP +${n1(4 + 1.6 * r)}/วิ สกิลรักษาแรงขึ้น ${pct(0.05 + 0.015 * r)} ต้านเวท +${pct(0.06 + 0.012 * r)} ตีปกติเป็นขวิดธาตุพืช ${pct(lin(0.95, 0.06)(r))} ของพลังเวท ทุก 1 วิ ฟื้น HP ${pct(lin(0.08, 0.008)(r))} ของดาเมจที่ทำ (${SHAPE})` },
      { id: "druid_wild_spirit", name: "วิญญาณสัตว์ป่า", kind: "passive", max: 10, pos: [3, 0], glyph: "up",
        stats: (r) => ({ matkPct: 0.012 * r, maxHpPct: 0.012 * r }),
        desc: (r) => `พลังเวท +${pct(0.012 * r)} HP สูงสุด +${pct(0.012 * r)} ทั้งในร่างเดิมและทุกร่าง` },
      { id: "druid_wild_maul", name: "ตะปบหมีคำราม", kind: "active", max: 10, pos: [0, 1], req: [["druid_wild_bear", 3]], glyph: "slam", need: BEAR,
        skill: { type: "nova", stat: "matk", mult: lin(1.3, 0.13), hits: 2, weaken: lin(0.1, 0.01), debuff: 12, knock: 60, mp: 20, cd: 6, motion: "swing", radius: 230,
          combo: SWITCH(["druid_wild_gale", "druid_wild_antler"]), color: "#c89060" },
        desc: (r) => `หมีคำรามแล้วตะปบรอบตัวรัศมี 2.3 ม. 2 ครั้ง ครั้งละ ${pct(lin(1.3, 0.13)(r))} ของพลังเวท ผลักออก แล้ว 12 วิ: ศัตรูตีเบาลง ${pct(lin(0.1, 0.01)(r))} ${switchText("พายุขนนกคมหรือเขากวางชุบชีวา", r)} ใช้ได้ในร่างหมี` },
      { id: "druid_wild_gale", name: "พายุขนนกคม", kind: "active", max: 10, pos: [1, 1], req: [["druid_wild_bird", 3]], glyph: "fan", need: BIRD,
        skill: { type: "fan", stat: "matk", element: "wind", mult: lin(1.3, 0.13), count: 5, spread: 50, expose: lin(0.08, 0.008), debuff: 12, mp: 18, cd: 5, motion: "cast", speed: 1100, range: 650, radius: 28,
          combo: SWITCH(["druid_wild_maul", "druid_wild_antler"]), color: "#d8e8ff" },
        desc: (r) => `กระพือปีกส่งขนนกคม 5 เส้นเป็นรูปพัด ไกล 6.5 ม. เส้นละ ${pct(lin(1.3, 0.13)(r))} ของพลังเวท ตัวที่โดนถูกหมายตา 12 วิ: รับดาเมจเพิ่ม ${pct(lin(0.08, 0.008)(r))} ${switchText("ตะปบหมีคำรามหรือเขากวางชุบชีวา", r)} ใช้ได้ในร่างนก` },
      { id: "druid_wild_antler", name: "เขากวางชุบชีวา", kind: "active", max: 10, pos: [2, 1], req: [["druid_wild_deer", 3]], glyph: "heal", need: DEER,
        skill: { type: "cone", stat: "matk", element: "plant", mult: lin(1.15, 0.115), hits: 2, drain: lin(0.1, 0.01), mp: 18, cd: 6, motion: "thrust", reach: 200, arc: 120,
          combo: SWITCH(["druid_wild_maul", "druid_wild_gale"]), color: "#f08070" },
        desc: (r) => `กวางสะบัดเขาเรืองแสงกวาดด้านหน้า 2 ม. 2 ครั้ง ครั้งละ ${pct(lin(1.15, 0.115)(r))} ของพลังเวท ฟื้น HP ${pct(lin(0.1, 0.01)(r))} ของดาเมจที่ทำ ${switchText("ตะปบหมีคำรามหรือพายุขนนกคม", r)} ใช้ได้ในร่างกวาง` },
      // each shape's blows may call that shape's skill by themselves (an autocast needs the shape
      // as the skill does, so only the one she is in fires)
      { id: "druid_wild_instinct", name: "สัญชาตญาณป่าดิบ", kind: "passive", max: 5, pos: [1, 2],
        req: [["druid_wild_maul", 3], ["druid_wild_gale", 3], ["druid_wild_antler", 3]], glyph: "star",
        stats: (r) => ({ autocast_druid_wild_maul: 0.025 * r, autocast_druid_wild_gale: 0.025 * r, autocast_druid_wild_antler: 0.025 * r, aspd: 0.02 * r }),
        desc: (r) => `ตีปกติในร่างใดโดนแล้วมีโอกาส ${pct(0.025 * r)} ใช้สกิลของร่างนั้นเองฟรี (หมี: ตะปบหมีคำราม · นก: พายุขนนกคม · กวาง: เขากวางชุบชีวา) ความเร็วโจมตี +${pct(0.02 * r)}` },
      // v0.6: three more passives (the branch's five), one for each shape: each counts only in it
      { id: "druid_wild_sky", name: "เนตรเหนือเมฆา", kind: "passive", max: 5, pos: [3, 1], req: [["druid_wild_spirit", 3]], glyph: "wing", need: BIRD,
        stats: (r) => ({ crit: 0.006 * r, flee: 3 * r }),
        desc: (r) => `โอกาสคริติคอล +${pct(0.006 * r)} หลบหลีก +${3 * r} เมื่ออยู่ในร่างนก` },
      { id: "druid_wild_hide", name: "หนังหมีหนา", kind: "passive", max: 5, pos: [0, 2], req: [["druid_wild_maul", 3]], glyph: "paw", need: BEAR,
        stats: (r) => ({ mdefPct: 0.02 * r, statusRes: 0.03 * r }),
        desc: (r) => `ต้านเวท +${pct(0.02 * r)} ต้านสถานะ +${pct(0.03 * r)} เมื่ออยู่ในร่างหมี` },
      { id: "druid_wild_herd", name: "สายใยฝูงกวาง", kind: "passive", max: 5, pos: [2, 2], req: [["druid_wild_antler", 3]], glyph: "heart", need: DEER,
        stats: (r) => ({ maxHpPct: 0.02 * r, mpRegen: n1(0.3 * r) }),
        desc: (r) => `HP สูงสุด +${pct(0.02 * r)} ฟื้น MP +${n1(0.3 * r)}/วิ เมื่ออยู่ในร่างกวาง` },
    ],
  },
};

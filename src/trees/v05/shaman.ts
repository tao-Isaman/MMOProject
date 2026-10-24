// The shaman's branches (fourth job, docs/v05_jobs.md, from any third job): consecration (white
// spells on her own body and blows: yantras inked into the skin that harden it, a weapon blessed
// with light, an open palm, a takrut that seals a spirit and a palm that drives it out, every one
// of them far harder on the undead, ghosts among them, and on demons) and the summoning (black
// spells from afar, smoke that blinds and shadow that cuts, with the dead and the damned called up
// to fight beside her: ghosts that float at her shoulder and shoot, shadow imps that bite like a
// pack, a demon knight that walks up and draws the blows). Eight skills a branch, a little
// stronger than the third jobs' (the high bishop's exorcist, the sculptor's giant and the hunter's
// wolves are the measure). Coming from any third job, no skill asks for a weapon; the blows are on
// attack and magic attack together (stat "both"), the spells and the summoned on magic attack.
import type { Tree } from "../../progression";
import { pct, lin } from "../util";

const n1 = (v: number) => +v.toFixed(1);
// What she calls up (allies.ts looks): the ghost rancher's ghost and the shadow imp, as the spec
// has them, and the demon knight. Each is counted apart from the others.
const GHOST = "ghost_rancher", IMP = "shadow_imp", KNIGHT = "demon_knight";

export const SHAMAN_TREES: Record<string, Tree> = {
  // ---- consecration: yantras, a blessed weapon, blows that undo the dead and the damned ----
  shaman_consecrate: {
    name: "ปลุกเสก", cls: null, job4: "shaman", color: "#e0c8a0", glyph: "cross",
    note: "ปลุกเสกตัวเองแล้วเข้าตะลุมบอน สักยันต์เกราะเพชรให้หนังเหนียว ปลุกเสกอาวุธให้ตีเป็นธาตุแสง ยันต์และคาถากันภูตผีปีศาจ ทุกท่าแรงเป็นพิเศษกับอันเดด (ผีทุกตนนับเป็นอันเดด) และปีศาจ ตีต่อกันเป็นพิธี: ฝ่ามือปลุกเสก → ตะกรุดสะกดวิญญาณ → ฝ่ามือปัดรังควาน ใช้ได้กับทุกอาวุธ ท่าตีใช้ทั้งพลังโจมตีและพลังเวท",
    nodes: [
      { id: "shaman_consecrate_ward", name: "ยันต์กันภูตผี", kind: "passive", max: 10, pos: [0, 0], glyph: "scroll",
        stats: (r) => ({ undeadDmg: 0.025 * r, demonDmg: 0.025 * r, mdefPct: 0.01 * r }),
        desc: (r) => `ดาเมจใส่อันเดดและปีศาจ +${pct(0.025 * r)} ต้านเวท +${pct(0.01 * r)}` },
      { id: "shaman_consecrate_palm", name: "ฝ่ามือปลุกเสก", kind: "active", max: 10, pos: [1, 0], glyph: "bash",
        skill: { type: "cone", stat: "both", element: "light", mult: lin(2.2, 0.22), vs: { undead: 0.5, demon: 0.5 }, mp: 14, cd: 4, motion: "thrust", reach: 170, arc: 60, color: "#fff0c0" },
        desc: (r) => `ตบฝ่ามือที่ลงอาคมใส่ศัตรูด้านหน้า 1.7 ม. ${pct(lin(2.2, 0.22)(r))} ของพลังโจมตีและพลังเวท (ธาตุแสง) อันเดดและปีศาจโดนแรงขึ้น 50%` },
      { id: "shaman_consecrate_yantra", name: "สักยันต์เกราะเพชร", kind: "active", max: 5, pos: [2, 0], glyph: "shield",
        skill: { type: "buff", mp: 26, cd: 30, motion: "cast", duration: 60, buff: (r) => ({ defPct: 0.08 + 0.03 * r, dmgRed: 0.02 + 0.01 * r, maxHpPct: 0.04 + 0.015 * r }), color: "#f0d890" },
        desc: (r) => `60 วิ: ปลุกยันต์เกราะเพชรที่สักไว้ หนังเหนียวดั่งเพชร ป้องกัน +${pct(0.08 + 0.03 * r)} ลดความเสียหาย ${pct(0.02 + 0.01 * r)} HP สูงสุด +${pct(0.04 + 0.015 * r)}` },
      { id: "shaman_consecrate_blade", name: "ปลุกเสกศาสตรา", kind: "active", max: 10, pos: [3, 0], glyph: "sword",
        skill: { type: "buff", mp: 18, cd: 20, motion: "cast", duration: 180, enchant: "light", buff: (r) => ({ lightAtk: n1(2.7 * r), hit: 2 * r }), color: "#fff6d0" },
        desc: (r) => `3 นาที: ปลุกเสกอาวุธในมือ ตีปกติและสกิลกายภาพที่ไม่มีธาตุกลายเป็นธาตุแสง พลังโจมตีธาตุแสง +${n1(2.7 * r)} ความแม่นยำ +${2 * r} (อาบได้ทีละธาตุ)` },
      { id: "shaman_consecrate_charm", name: "คาถาคงกระพัน", kind: "passive", max: 5, pos: [0, 1], req: [["shaman_consecrate_ward", 3]], glyph: "ring",
        stats: (r) => ({ darkDef: 6 * r, shadowDef: 6 * r, maxHpPct: 0.012 * r }),
        desc: (r) => `ภูตผีปีศาจทำร้ายได้ยาก: ป้องกันธาตุมืดและธาตุเงา +${6 * r} HP สูงสุด +${pct(0.012 * r)}` },
      { id: "shaman_consecrate_takrut", name: "ตะกรุดสะกดวิญญาณ", kind: "active", max: 10, pos: [1, 1], req: [["shaman_consecrate_palm", 4]], glyph: "slam",
        skill: { type: "cone", stat: "both", element: "light", mult: lin(2.6, 0.26), vs: { undead: 0.6, demon: 0.6 }, stun: () => 0.8, expose: lin(0.1, 0.01), debuff: 6, mp: 18, cd: 6, motion: "thrust", reach: 180, arc: 40,
          combo: { after: ["shaman_consecrate_palm"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#ffe8a8" },
        desc: (r) => `กดตะกรุดลงบนตัวที่ล็อกไว้ ${pct(lin(2.6, 0.26)(r))} ของพลังโจมตีและพลังเวท (ธาตุแสง) อันเดดและปีศาจโดนแรงขึ้น 60% มึน 0.8 วิ แล้ว 6 วิ: รับดาเมจเพิ่ม ${pct(lin(0.1, 0.01)(r))} ใช้ต่อจากฝ่ามือปลุกเสกภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)}` },
      { id: "shaman_consecrate_thread", name: "วงสายสิญจน์", kind: "active", max: 10, pos: [3, 1], req: [["shaman_consecrate_blade", 3]], glyph: "spin",
        skill: { type: "nova", stat: "both", element: "light", mult: lin(1.2, 0.12), hits: 2, vs: { undead: 0.6, demon: 0.6 }, slow: () => 2, mp: 22, cd: 7, motion: "cast", radius: 240, color: "#fff8e0" },
        desc: (r) => `โยงสายสิญจน์เป็นวงรอบตัวรัศมี 2.4 ม. 2 ครั้ง ครั้งละ ${pct(lin(1.2, 0.12)(r))} ของพลังโจมตีและพลังเวท (ธาตุแสง) อันเดดและปีศาจโดนแรงขึ้น 60% ศัตรูในวงเดินช้าลงครึ่งหนึ่ง 2 วิ` },
      { id: "shaman_consecrate_exorcism", name: "ฝ่ามือปัดรังควาน", kind: "active", max: 5, pos: [1, 2], req: [["shaman_consecrate_takrut", 5], ["shaman_consecrate_yantra", 1]], glyph: "burst",
        skill: { type: "cone", stat: "both", element: "light", mult: lin(6.0, 0.75), vs: { undead: 1, demon: 1 }, stun: () => 1, mp: 50, cd: 16, motion: "thrust", reach: 190, arc: 40,
          combo: { after: ["shaman_consecrate_takrut"], within: 4, more: () => 0.4 }, color: "#fffbe8" },
        desc: (r) => `ปัดรังควานด้วยฝ่ามือที่ปลุกเสกเต็มกำลังใส่ตัวที่ล็อกไว้ ${pct(lin(6.0, 0.75)(r))} ของพลังโจมตีและพลังเวท (ธาตุแสง) อันเดดและปีศาจโดนแรงเป็นสองเท่า มึน 1 วิ ใช้ต่อจากตะกรุดสะกดวิญญาณภายใน 4 วิ แรงขึ้น 40%` },
    ],
  },
  // ---- the summoning: ghosts, imps and a demon knight beside her, smoke and shadow from afar ----
  shaman_summon: {
    name: "อัญเชิญ", cls: null, job4: "shaman", color: "#a890c8", glyph: "cloud",
    note: "ร่ายเวทควันและเงาจากระยะไกล แล้วอัญเชิญผีและปีศาจมาช่วยสู้ (นับแยกกันจึงอยู่พร้อมกันได้ทุกแบบ): ผีพรายลอยข้างไหล่และยิงเงาจากระยะไกล ฝูงอิมป์เงาตามตัวและรุมกัดตัวที่เราตี อัศวินอสูรเดินไปฟันและดึงมอนสเตอร์ให้มาตีมันแทน ผีและปีศาจแรงและทนตามพลังเวทและ HP ของเรา ร่ายต่อกันเป็นทอด: ศรเงาสาป → หมอกควันทมิฬ → ประตูยมโลก",
    nodes: [
      { id: "shaman_summon_pact", name: "พันธะโลกวิญญาณ", kind: "passive", max: 10, pos: [0, 0], glyph: "eye",
        stats: (r) => ({ allyPct: 0.02 * r, matkPct: 0.008 * r }),
        desc: (r) => `ผีและปีศาจที่อัญเชิญมา (ผู้ช่วยทุกตัว) HP และแรงตี +${pct(0.02 * r)} พลังเวท +${pct(0.008 * r)}` },
      // (the ghost first: the branch's first skill on the bar)
      { id: "shaman_summon_ghost", name: "อัญเชิญผีพราย", kind: "active", max: 10, pos: [1, 0], glyph: "skull",
        skill: { type: "summon", ally: "spirit", look: GHOST, stat: "matk", element: "shadow", mult: lin(0.6, 0.06), base: lin(0.25, 0.025), every: 1.2, count: 2, duration: 40, mp: 20, cd: 5, motion: "cast", color: "#b8a8e0" },
        desc: (r) => `อัญเชิญผีพราย (ผีคนเลี้ยงม้า) มาลอยตามข้างไหล่เรา อยู่ 40 วิ มีพร้อมกันได้ 2 ตน HP ${pct(lin(0.25, 0.025)(r))} ของ HP สูงสุด ยิงเงาใส่ตัวที่เราตีหรือตัวที่เข้าหาเรา ระยะ 5.2 ม. ทุก 1.2 วิ ครั้งละ ${pct(lin(0.6, 0.06)(r))} ของพลังเวท (ธาตุเงา)` },
      { id: "shaman_summon_shade", name: "ศรเงาสาป", kind: "active", max: 10, pos: [2, 0], glyph: "arrow",
        skill: { type: "bolt", stat: "matk", element: "shadow", mult: lin(3.3, 0.33), mp: 14, cd: 3, cast: 0.7, motion: "cast", speed: 1050, range: 650, radius: 30, color: "#9080d0" },
        desc: (r) => `ร่ายศรเงาสาปใส่ตัวที่ล็อกไว้ระยะ 6.5 ม. ${pct(lin(3.3, 0.33)(r))} ของพลังเวท (ธาตุเงา)` },
      { id: "shaman_summon_lore", name: "ศาสตร์ควันและเงา", kind: "passive", max: 10, pos: [3, 0], glyph: "swirl",
        stats: (r) => ({ shadowAtk: n1(1.5 * r), smokeAtk: n1(1.5 * r), castRed: 0.01 * r }),
        desc: (r) => `พลังโจมตีธาตุเงาและธาตุควัน +${n1(1.5 * r)} ลดเวลาร่าย ${pct(0.01 * r)}` },
      { id: "shaman_summon_imp", name: "อัญเชิญอิมป์เงา", kind: "active", max: 10, pos: [0, 1], req: [["shaman_summon_ghost", 3]], glyph: "horns",
        skill: { type: "summon", ally: "wolf", look: IMP, stat: "matk", element: "shadow", mult: lin(0.45, 0.045), base: lin(0.25, 0.03), every: 1, count: 3, duration: 40, mp: 22, cd: 5, motion: "cast", color: "#8a6ac0" },
        desc: (r) => `อัญเชิญอิมป์เงามาครั้งละตน มีพร้อมกันได้ 3 ตน อยู่ 40 วิ HP ${pct(lin(0.25, 0.03)(r))} ของ HP สูงสุด ตามตัวเรา รุมกัดตัวที่เราตีหรือตัวที่ไล่เรา ทุก 1 วิ ครั้งละ ${pct(lin(0.45, 0.045)(r))} ของพลังเวท (ธาตุเงา)` },
      { id: "shaman_summon_smog", name: "หมอกควันทมิฬ", kind: "active", max: 10, pos: [2, 1], req: [["shaman_summon_shade", 4]], glyph: "cloud",
        skill: { type: "blast", stat: "matk", element: "smoke", mult: lin(1.05, 0.105), hits: 4, every: 0.35, blind: lin(1.5, 0.1), mp: 28, cd: 8, cast: 1, motion: "cast", range: 600, radius: 230, delay: 0.3,
          combo: { after: ["shaman_summon_shade"], within: 4, more: (r) => 0.25 + 0.03 * r }, color: "#787088" },
        desc: (r) => `ร่ายหมอกควันทมิฬลงจุดที่เล็ง รัศมี 2.3 ม. 4 ระลอก ระลอกละ ${pct(lin(1.05, 0.105)(r))} ของพลังเวท (ธาตุควัน) ควันเข้าตาให้ศัตรูกัดพลาดครึ่งหนึ่ง ${n1(lin(1.5, 0.1)(r))} วิ ใช้ต่อจากศรเงาสาปภายใน 4 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)}` },
      { id: "shaman_summon_knight", name: "อัญเชิญอัศวินอสูร", kind: "active", max: 5, pos: [0, 2], req: [["shaman_summon_imp", 3]], glyph: "person",
        skill: { type: "summon", ally: "golem", look: KNIGHT, stat: "matk", element: "shadow", mult: lin(2.4, 0.28), base: lin(1.1, 0.15), every: 2, duration: 25, range: 300, mp: 40, cd: 30, motion: "cast", color: "#a04870" },
        desc: (r) => `อัญเชิญอัศวินอสูรขึ้นจากยมโลกตรงจุดที่เล็ง (ไกลสุด 3 ม.) อยู่ 25 วิ HP ${pct(lin(1.1, 0.15)(r))} ของ HP สูงสุด ป้องกันหนา เดินไปฟันมอนสเตอร์ตัวที่ใกล้ที่สุดทุก 2 วิ ครั้งละ ${pct(lin(2.4, 0.28)(r))} ของพลังเวท (ธาตุเงา) และดึงมอนสเตอร์ให้มาตีมันแทนเรา` },
      { id: "shaman_summon_gate", name: "ประตูยมโลก", kind: "active", max: 5, pos: [2, 2], req: [["shaman_summon_smog", 5], ["shaman_summon_lore", 3]], glyph: "burst",
        skill: { type: "blast", stat: "matk", element: "shadow", mult: lin(2.2, 0.28), hits: 3, every: 0.35, mp: 50, cd: 18, cast: 2, motion: "cast", range: 600, radius: 280, delay: 0.6,
          combo: { after: ["shaman_summon_smog"], within: 4, more: () => 0.35 }, color: "#c0a0ff" },
        desc: (r) => `ร่ายเปิดประตูยมโลกตรงจุดที่เล็ง รัศมี 2.8 ม. เงาจากยมโลกฉุดกระชาก 3 ครั้ง ครั้งละ ${pct(lin(2.2, 0.28)(r))} ของพลังเวท (ธาตุเงา) ใช้ต่อจากหมอกควันทมิฬภายใน 4 วิ แรงขึ้น 35%` },
    ],
  },
};

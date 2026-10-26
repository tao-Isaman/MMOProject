// The alchemist's branches (fourth job, docs/v05_jobs.md, from any third job): the homunculus
// (life made in a flask: slimes of three hues that fight beside her, a shooter that floats by her
// shoulder, a guard that walks up and draws the blows, a healer that follows and mends her; an
// elixir that makes every ally fiercer; acid and a stream of pure matter from afar), the bomb
// (heavy bombs of metal that tears the armour, stone that stuns and mud that holds, a powder that
// makes them burn hotter, down to the great transmutation blast) and the synthesis (the four
// elements of alchemy made into crystals: four-and-a-half-minute blessings of elemental attack and defence
// a team can be given later, a draught that heals over time, a made body with a great deal of HP
// and blows of matter at close quarters). Eleven skills a branch, five of them passives (v0.6:
// three passives added to each), a little stronger than the third
// jobs' (the sculptor's golems, the hunter's wolves and the knight's blows are the measure).
// Coming from any third job, the alchemist fights with whatever she holds, on attack and magic
// attack together (stat "both"), and no skill asks for a weapon.
import type { Tree } from "../../progression";
import { pct, lin } from "../util";

const n1 = (v: number) => +v.toFixed(1);
// The homunculi: slimes of one hue a kind (allies.ts looks). A creature is its kind and its look,
// so the three are counted apart and stand together.
const SHOOTER = "slime:220", GUARD = "slime:30", HEALER = "slime:335";
// The bombs' three elements, and the four elements of alchemy the synthesis makes crystals of.
const BOMBS = (v: number) => ({ metalAtk: v, stoneAtk: v, mudAtk: v });
const FOUR = (side: "Atk" | "Def", v: number) => ({ [`fire${side}`]: v, [`water${side}`]: v, [`wind${side}`]: v, [`earth${side}`]: v });

export const ALCHEMIST_TREES: Record<string, Tree> = {
  // ---- the homunculus: a shooter, a guard and a healer of her own making ----
  alchemist_homunculus: {
    name: "ชีวิตประดิษฐ์", cls: null, job4: "alchemist", color: "#90e0d0", glyph: "heart",
    note: "ปั้นโฮมุนครุสจากขวดแก้วได้สามแบบ เป็นสไลม์คนละสี นับแยกกันจึงอยู่พร้อมกันได้ทุกแบบ: พลยิง (สีฟ้า) ลอยข้างไหล่และยิงจากระยะไกล ผู้พิทักษ์ (สีส้ม) เดินไปตีและดึงมอนสเตอร์ให้มาตีมันแทน ผู้เยียวยา (สีชมพู) เดินตามและฟื้น HP ให้เรา ยาปลุกพลังชีวิตทำให้ผู้ช่วยทุกตัวตีแรงขึ้น ส่วนตัวเราปาขวดกรดจากระยะไกลให้ศัตรูรับดาเมจเพิ่ม แล้วปิดด้วยสายธารสสารบริสุทธิ์ ใช้ได้กับทุกอาวุธ สกิลใช้ทั้งพลังโจมตีและพลังเวท",
    nodes: [
      { id: "alchemist_homunculus_formula", name: "ตำราชีวิตประดิษฐ์", kind: "passive", max: 10, pos: [0, 0], glyph: "scroll",
        stats: (r) => ({ allyPct: 0.02 * r, atkPct: 0.006 * r, matkPct: 0.006 * r }),
        desc: (r) => `ผู้ช่วยที่อัญเชิญทุกตัว (โฮมุนครุสด้วย) HP และแรงตี +${pct(0.02 * r)} พลังโจมตีและพลังเวท +${pct(0.006 * r)}` },
      // (the shooter first: the branch's first skill on the bar)
      { id: "alchemist_homunculus_shooter", name: "โฮมุนครุสพลยิง", kind: "active", max: 10, pos: [1, 0], glyph: "target",
        skill: { type: "summon", ally: "spirit", look: SHOOTER, stat: "both", mult: lin(0.55, 0.055), base: lin(0.25, 0.025), every: 1.2, count: 2, duration: 40, mp: 20, cd: 5, motion: "cast", color: "#7ab8ff" },
        desc: (r) => `ปั้นโฮมุนครุสพลยิง (สไลม์สีฟ้า) ลอยตามข้างไหล่เรา อยู่ 40 วิ มีพร้อมกันได้ 2 ตัว HP ${pct(lin(0.25, 0.025)(r))} ของ HP สูงสุด ยิงก้อนสสารใส่ตัวที่เราตีหรือตัวที่เข้าหาเรา ระยะ 5.2 ม. ทุก 1.2 วิ ครั้งละ ${pct(lin(0.55, 0.055)(r))} ของพลังโจมตีและพลังเวท` },
      { id: "alchemist_homunculus_acid", name: "ขวดกรดสังเคราะห์", kind: "active", max: 10, pos: [2, 0], glyph: "drop",
        skill: { type: "bolt", stat: "both", mult: lin(2.2, 0.22), expose: (r) => 0.09 + 0.013 * r, debuff: 12, mp: 14, cd: 5, motion: "cast", speed: 1100, range: 650, radius: 30, color: "#b8f070" },
        desc: (r) => `ปาขวดกรดใส่ตัวที่ล็อกไว้ระยะ 6.5 ม. ${pct(lin(2.2, 0.22)(r))} ของพลังโจมตีและพลังเวท กรดกัดกร่อนให้มันรับดาเมจเพิ่ม ${pct(0.09 + 0.013 * r)} 12 วิ ทั้งจากเราและโฮมุนครุส` },
      { id: "alchemist_homunculus_healer", name: "โฮมุนครุสผู้เยียวยา", kind: "active", max: 5, pos: [0, 1], req: [["alchemist_homunculus_formula", 3]], glyph: "heal",
        skill: { type: "summon", ally: "familiar", look: HEALER, heal: (r) => 0.015 + 0.003 * r, every: 4, radius: 350, base: lin(0.3, 0.04), duration: 60,
          buff: (r) => ({ defPct: 0.04 + 0.015 * r, mdefPct: 0.04 + 0.015 * r }), mp: 26, cd: 20, motion: "cast", color: "#ffa8d0" },
        desc: (r) => `ปั้นโฮมุนครุสผู้เยียวยา (สไลม์สีชมพู) เดินตามเรา อยู่ 60 วิ HP ${pct(lin(0.3, 0.04)(r))} ของ HP สูงสุด ขณะเราอยู่ห่างมันไม่เกิน 3.5 ม.: ฟื้น HP ${pct(0.015 + 0.003 * r)} ของ HP สูงสุดทุก 4 วิ ป้องกันและต้านเวท +${pct(0.04 + 0.015 * r)}` },
      { id: "alchemist_homunculus_guard", name: "โฮมุนครุสผู้พิทักษ์", kind: "active", max: 10, pos: [1, 1], req: [["alchemist_homunculus_shooter", 3]], glyph: "shield",
        skill: { type: "summon", ally: "golem", look: GUARD, stat: "both", mult: lin(1.4, 0.14), base: lin(0.9, 0.1), every: 1.5, duration: 30, range: 300, mp: 28, cd: 16, motion: "cast", color: "#ffb070" },
        desc: (r) => `ปั้นโฮมุนครุสผู้พิทักษ์ (สไลม์สีส้ม) ตรงจุดที่เล็ง (ไกลสุด 3 ม.) อยู่ 30 วิ HP ${pct(lin(0.9, 0.1)(r))} ของ HP สูงสุด ป้องกันหนา เดินไปตีมอนสเตอร์ตัวที่ใกล้ที่สุดทุก 1.5 วิ ครั้งละ ${pct(lin(1.4, 0.14)(r))} ของพลังโจมตีและพลังเวท และดึงมอนสเตอร์ให้มาตีมันแทนเรา` },
      { id: "alchemist_homunculus_elixir", name: "ยาปลุกพลังชีวิต", kind: "active", max: 5, pos: [2, 1], req: [["alchemist_homunculus_acid", 3]], glyph: "up",
        skill: { type: "buff", mp: 30, cd: 40, motion: "cast", duration: 45, buff: (r) => ({ allyPct: 0.1 + 0.03 * r, atkPct: 0.04 + 0.015 * r, matkPct: 0.04 + 0.015 * r }), color: "#a8ffe0" },
        desc: (r) => `45 วิ: สาดยาปลุกพลังชีวิตใส่ผู้ช่วยและตัวเอง ผู้ช่วยทุกตัวตีแรงขึ้น ${pct(0.1 + 0.03 * r)} (ตัวที่สร้างระหว่างนี้ HP มากขึ้นเท่ากัน) พลังโจมตีและพลังเวท +${pct(0.04 + 0.015 * r)}` },
      { id: "alchemist_homunculus_bond", name: "สายใยผู้สร้าง", kind: "passive", max: 5, pos: [0, 2], req: [["alchemist_homunculus_healer", 3]], glyph: "heart",
        stats: (r) => ({ allyPct: 0.03 * r, maxHpPct: 0.012 * r }),
        desc: (r) => `ผู้ช่วยทุกตัว HP และแรงตี +${pct(0.03 * r)} HP สูงสุด +${pct(0.012 * r)} (โฮมุนครุสได้ HP ตาม HP สูงสุดของเรา จึงทนขึ้นอีก)` },
      { id: "alchemist_homunculus_stream", name: "สายธารสสารบริสุทธิ์", kind: "active", max: 5, pos: [2, 2], req: [["alchemist_homunculus_acid", 5], ["alchemist_homunculus_elixir", 1]], glyph: "beam",
        skill: { type: "beam", stat: "both", mult: lin(1.9, 0.24), hits: 3, mp: 48, cd: 16, motion: "cast", length: 650, width: 90,
          combo: { after: ["alchemist_homunculus_acid"], within: 4, more: () => 0.35 }, color: "#c8fff0" },
        desc: (r) => `เทสสารบริสุทธิ์จากขวดพุ่งเป็นสายยาว 6.5 ม. ทะลุทุกตัวในแนว 3 ครั้ง ครั้งละ ${pct(lin(1.9, 0.24)(r))} ของพลังโจมตีและพลังเวท ใช้ต่อจากขวดกรดสังเคราะห์ภายใน 4 วิ แรงขึ้น 35%` },
      // v0.6: three more passives (sustain for the maker, a sturdier guard, a coat against the acid)
      { id: "alchemist_homunculus_flask", name: "มือชำนาญหลอมขวด", kind: "passive", max: 5, pos: [3, 0], glyph: "drop",
        stats: (r) => ({ mpRegen: n1(0.4 * r), cdr: 0.01 * r }),
        desc: (r) => `ฟื้น MP +${n1(0.4 * r)}/วิ ลดคูลดาวน์ ${pct(0.01 * r)} (ปั้นโฮมุนครุสได้ถี่ขึ้น)` },
      { id: "alchemist_homunculus_kin", name: "สายเลือดสไลม์", kind: "passive", max: 5, pos: [1, 2], req: [["alchemist_homunculus_guard", 3]], glyph: "shield",
        stats: (r) => ({ allyPct: 0.02 * r, defPct: 0.02 * r }),
        desc: (r) => `ผู้ช่วยทุกตัว HP และแรงตี +${pct(0.02 * r)} ป้องกัน +${pct(0.02 * r)}` },
      { id: "alchemist_homunculus_coat", name: "น้ำยาเคลือบกาย", kind: "passive", max: 5, pos: [3, 1], req: [["alchemist_homunculus_acid", 3]], glyph: "ring",
        stats: (r) => ({ statusRes: 0.02 * r, mdefPct: 0.02 * r }),
        desc: (r) => `ทาน้ำยาเคลือบผิวกันกรดและพิษ ต้านสถานะ ${pct(0.02 * r)} ต้านเวท +${pct(0.02 * r)}` },
    ],
  },
  // ---- the bomb: metal that tears, stone that stuns, mud that holds ----
  alchemist_bomb: {
    name: "ระเบิดทำลายล้าง", cls: null, job4: "alchemist", color: "#e8a060", glyph: "burst",
    note: "ปาระเบิดหนักลงจุดที่เล็งได้สามธาตุ: ระเบิดเหล็กที่สะเก็ดฉีกเกราะ ระเบิดหินที่ทำให้มึน และระเบิดโคลนที่ทำให้ช้า ผงเร่งปฏิกิริยาเสริมพลังให้ระเบิดทุกลูก แล้วปาต่อกันเป็นทอด: ระเบิดหินหรือระเบิดโคลน → ระเบิดพวงสามลูก → มหาระเบิดแปรธาตุ ใช้ได้กับทุกอาวุธ สกิลใช้ทั้งพลังโจมตีและพลังเวท",
    nodes: [
      { id: "alchemist_bomb_powder", name: "ดินระเบิดสามธาตุ", kind: "passive", max: 10, pos: [0, 0], glyph: "earth",
        stats: (r) => ({ ...BOMBS(n1(1.5 * r)), atkPct: 0.006 * r, matkPct: 0.006 * r }),
        desc: (r) => `พลังโจมตีธาตุโลหะ หิน และโคลน +${n1(1.5 * r)} พลังโจมตีและพลังเวท +${pct(0.006 * r)}` },
      { id: "alchemist_bomb_shrapnel", name: "ระเบิดสะเก็ดเหล็ก", kind: "active", max: 10, pos: [1, 0], glyph: "burst",
        skill: { type: "blast", stat: "both", element: "metal", mult: lin(2.2, 0.22), expose: (r) => 0.06 + 0.01 * r, debuff: 9, mp: 16, cd: 6, motion: "cast", range: 550, radius: 180, delay: 0.4, color: "#c8d0dc" },
        desc: (r) => `ปาระเบิดเหล็กลงจุดที่เล็ง (ไกลสุด 5.5 ม.) รัศมี 1.8 ม. ${pct(lin(2.2, 0.22)(r))} ของพลังโจมตีและพลังเวท (ธาตุโลหะ) สะเก็ดเหล็กฉีกเกราะ ศัตรูรับดาเมจเพิ่ม ${pct(0.06 + 0.01 * r)} 9 วิ` },
      { id: "alchemist_bomb_stone", name: "ระเบิดหินถล่ม", kind: "active", max: 10, pos: [2, 0], glyph: "slam",
        skill: { type: "blast", stat: "both", element: "stone", mult: lin(2.3, 0.23), stun: () => 0.8, knock: 40, mp: 18, cd: 7, motion: "cast", range: 550, radius: 200, delay: 0.4, color: "#c8b090" },
        desc: (r) => `ปาระเบิดหินลงจุดที่เล็ง (ไกลสุด 5.5 ม.) รัศมี 2 ม. ${pct(lin(2.3, 0.23)(r))} ของพลังโจมตีและพลังเวท (ธาตุหิน) ศัตรูมึน 0.8 วิ` },
      { id: "alchemist_bomb_mud", name: "ระเบิดโคลนดูด", kind: "active", max: 10, pos: [3, 0], glyph: "down",
        skill: { type: "blast", stat: "both", element: "mud", mult: lin(2.0, 0.2), slow: lin(3.75, 0.3), mp: 16, cd: 7, motion: "cast", range: 550, radius: 240, delay: 0.4, color: "#a08058" },
        desc: (r) => `ปาระเบิดโคลนลงจุดที่เล็ง (ไกลสุด 5.5 ม.) รัศมี 2.4 ม. ${pct(lin(2.0, 0.2)(r))} ของพลังโจมตีและพลังเวท (ธาตุโคลน) โคลนดูดเท้าให้ศัตรูเดินช้าลงครึ่งหนึ่ง ${n1(lin(3.75, 0.3)(r))} วิ` },
      { id: "alchemist_bomb_recipe", name: "สูตรระเบิดหนัก", kind: "passive", max: 5, pos: [0, 1], req: [["alchemist_bomb_powder", 3]], glyph: "up",
        stats: (r) => ({ atkPct: 0.015 * r, matkPct: 0.015 * r, cdr: 0.01 * r }),
        desc: (r) => `พลังโจมตีและพลังเวท +${pct(0.015 * r)} ลดคูลดาวน์ ${pct(0.01 * r)}` },
      { id: "alchemist_bomb_catalyst", name: "ผงเร่งปฏิกิริยา", kind: "active", max: 5, pos: [1, 1], req: [["alchemist_bomb_shrapnel", 3]], glyph: "rage",
        skill: { type: "buff", mp: 30, cd: 35, motion: "cast", duration: 30, buff: (r) => ({ atkPct: 0.06 + 0.02 * r, matkPct: 0.06 + 0.02 * r, ...BOMBS(4 + 2 * r) }), color: "#ffc070" },
        desc: (r) => `30 วิ: โรยผงเร่งปฏิกิริยาลงในระเบิดทุกลูก พลังโจมตีและพลังเวท +${pct(0.06 + 0.02 * r)} พลังโจมตีธาตุโลหะ หิน และโคลน +${4 + 2 * r}` },
      { id: "alchemist_bomb_cluster", name: "ระเบิดพวงสามลูก", kind: "active", max: 10, pos: [2, 1], req: [["alchemist_bomb_stone", 4]], glyph: "storm",
        skill: { type: "blast", stat: "both", element: "metal", mult: lin(1.0, 0.1), hits: 3, every: 0.3, mp: 22, cd: 8, motion: "cast", range: 550, radius: 220, delay: 0.4,
          combo: { after: ["alchemist_bomb_stone", "alchemist_bomb_mud"], within: 4, more: (r) => 0.25 + 0.03 * r }, color: "#e0d0b8" },
        desc: (r) => `ปาระเบิดสามลูกผูกเป็นพวงลงจุดที่เล็ง รัศมี 2.2 ม. ระเบิดทีละลูก 3 ครั้ง ครั้งละ ${pct(lin(1.0, 0.1)(r))} ของพลังโจมตีและพลังเวท (ธาตุโลหะ) ใช้ต่อจากระเบิดหินถล่มหรือระเบิดโคลนดูดภายใน 4 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)}` },
      { id: "alchemist_bomb_cataclysm", name: "มหาระเบิดแปรธาตุ", kind: "active", max: 5, pos: [1, 2], req: [["alchemist_bomb_cluster", 5], ["alchemist_bomb_catalyst", 1]], glyph: "burst",
        skill: { type: "blast", stat: "both", mult: lin(6.2, 0.78), stun: lin(1, 0.15), mp: 50, cd: 16, cast: 1, motion: "cast", range: 550, radius: 300, delay: 0.8,
          combo: { after: ["alchemist_bomb_cluster"], within: 4, more: () => 0.35 }, color: "#fff0c8" },
        desc: (r) => `ร่ายแล้วปาระเบิดที่ผสานเหล็ก หิน และโคลนลงจุดที่เล็ง รัศมี 3 ม. ${pct(lin(6.2, 0.78)(r))} ของพลังโจมตีและพลังเวท มึน ${n1(lin(1, 0.15)(r))} วิ ใช้ต่อจากระเบิดพวงสามลูกภายใน 4 วิ แรงขึ้น 35%` },
      // v0.6: three more passives (a quicker fuse, an apron against the blasts, the same spot again)
      { id: "alchemist_bomb_fuse", name: "ชนวนสั้น", kind: "passive", max: 5, pos: [3, 1], req: [["alchemist_bomb_mud", 3]], glyph: "flame",
        stats: (r) => ({ castRed: 0.03 * r, mpRegen: n1(0.3 * r) }),
        desc: (r) => `ลดเวลาร่าย ${pct(0.03 * r)} ฟื้น MP +${n1(0.3 * r)}/วิ` },
      { id: "alchemist_bomb_apron", name: "ผ้ากันสะเก็ด", kind: "passive", max: 5, pos: [0, 2], req: [["alchemist_bomb_recipe", 3]], glyph: "shield",
        stats: (r) => ({ dmgRed: 0.006 * r, maxHpPct: 0.012 * r }),
        desc: (r) => `ลดความเสียหาย ${pct(0.006 * r)} HP สูงสุด +${pct(0.012 * r)}` },
      { id: "alchemist_bomb_demolish", name: "ช่างรื้อถอน", kind: "passive", max: 5, pos: [2, 2], req: [["alchemist_bomb_cluster", 3]], glyph: "burst",
        stats: (r) => ({ critDmg: 0.04 * r, ...BOMBS(r) }),
        desc: (r) => `แรงคริติคอล +${pct(0.04 * r)} พลังโจมตีธาตุโลหะ หิน และโคลน +${r}` },
    ],
  },
  // ---- the synthesis: crystals of the four elements, a draught, a made body that fights close ----
  alchemist_synth: {
    name: "ธาตุสังเคราะห์", cls: null, job4: "alchemist", color: "#a0c8e8", glyph: "drop",
    note: "สังเคราะห์ธาตุทั้งสี่ของการแปรธาตุ (ดิน น้ำ ลม ไฟ) เป็นผลึก บัฟพลังโจมตีธาตุและป้องกันธาตุนาน 4 นาที 30 วิที่ให้ทั้งทีมได้ ยาสังเคราะห์ชีวิตที่ค่อย ๆ ฟื้น HP กายสังเคราะห์ที่ HP สูงและทนทาน แล้วเข้าตีประชิดด้วยสสารที่สังเคราะห์ไว้ (ได้โบนัสธาตุจากผลึกทุกครั้ง): ฟาดสสารสังเคราะห์ → คลื่นสสารแปรธาตุ → มหาสังเคราะห์ ใช้ได้กับทุกอาวุธ สกิลใช้ทั้งพลังโจมตีและพลังเวท",
    nodes: [
      { id: "alchemist_synth_flesh", name: "กายสังเคราะห์", kind: "passive", max: 10, pos: [0, 0], glyph: "heart",
        stats: (r) => ({ maxHpPct: 0.018 * r, hpRegen: n1(0.8 * r) }),
        desc: (r) => `HP สูงสุด +${pct(0.018 * r)} ฟื้น HP +${n1(0.8 * r)}/วิ` },
      { id: "alchemist_synth_strike", name: "ฟาดสสารสังเคราะห์", kind: "active", max: 10, pos: [1, 0], glyph: "bash",
        skill: { type: "cone", stat: "both", mult: lin(2.3, 0.23), mp: 14, cd: 4, motion: "swing", reach: 170, arc: 70, color: "#c0e0f8" },
        desc: (r) => `ฟาดก้อนสสารที่สังเคราะห์ไว้ใส่ศัตรูด้านหน้า 1.7 ม. ${pct(lin(2.3, 0.23)(r))} ของพลังโจมตีและพลังเวท` },
      { id: "alchemist_synth_edge", name: "ผลึกธาตุโจมตี", kind: "active", max: 5, pos: [2, 0], glyph: "flame",
        skill: { type: "buff", mp: 24, cd: 20, motion: "cast", duration: 270, buff: (r) => ({ ...FOUR("Atk", 4 + 3 * r), atkPct: 0.02 + 0.01 * r, matkPct: 0.02 + 0.01 * r }), color: "#ffb890" },
        desc: (r) => `4 นาที 30 วิ: พกผลึกธาตุทั้งสี่ พลังโจมตีธาตุดิน น้ำ ลม และไฟ +${4 + 3 * r} (ตีอะไรก็ได้โบนัสธาตุที่ศัตรูไม่ได้ต้านไว้) พลังโจมตีและพลังเวท +${pct(0.02 + 0.01 * r)}` },
      { id: "alchemist_synth_ward", name: "ผลึกธาตุป้องกัน", kind: "active", max: 5, pos: [3, 0], glyph: "shield",
        skill: { type: "buff", mp: 24, cd: 20, motion: "cast", duration: 270, buff: (r) => ({ ...FOUR("Def", 5 + 4 * r), defPct: 0.03 + 0.015 * r, mdefPct: 0.03 + 0.015 * r }), color: "#a8d8ff" },
        desc: (r) => `4 นาที 30 วิ: ผลึกธาตุทั้งสี่คุ้มกาย ป้องกันธาตุดิน น้ำ ลม และไฟ +${5 + 4 * r} ป้องกันและต้านเวท +${pct(0.03 + 0.015 * r)}` },
      { id: "alchemist_synth_blood", name: "โลหิตแปรธาตุ", kind: "passive", max: 5, pos: [0, 1], req: [["alchemist_synth_flesh", 3]], glyph: "drop",
        stats: (r) => ({ maxHpPct: 0.012 * r, dmgRed: 0.008 * r }),
        desc: (r) => `HP สูงสุด +${pct(0.012 * r)} ลดความเสียหาย ${pct(0.008 * r)}` },
      { id: "alchemist_synth_wave", name: "คลื่นสสารแปรธาตุ", kind: "active", max: 10, pos: [1, 1], req: [["alchemist_synth_strike", 4]], glyph: "spin",
        skill: { type: "nova", stat: "both", mult: lin(1.2, 0.12), hits: 2, mp: 20, cd: 6, motion: "swing", radius: 240,
          combo: { after: ["alchemist_synth_strike"], within: 3, more: (r) => 0.25 + 0.03 * r }, color: "#d0ecff" },
        desc: (r) => `แปรสสารเป็นคลื่นซัดรอบตัวรัศมี 2.4 ม. 2 ระลอก ระลอกละ ${pct(lin(1.2, 0.12)(r))} ของพลังโจมตีและพลังเวท ใช้ต่อจากฟาดสสารสังเคราะห์ภายใน 3 วิ แรงขึ้น ${pct(0.25 + 0.03 * r)}` },
      // heals over five seconds (hot): a draught, not a light
      { id: "alchemist_synth_elixir", name: "ยาสังเคราะห์ชีวิต", kind: "active", max: 5, pos: [2, 1], req: [["alchemist_synth_edge", 3]], glyph: "heal",
        skill: { type: "heal", stat: "matk", mult: lin(1.2, 0.15), heal: lin(0.16, 0.025), hot: true, ticks: 5, mp: 28, cd: 12, motion: "cast", color: "#b8ffd8" },
        desc: (r) => `ดื่มยาสังเคราะห์ชีวิต ฟื้น HP รวม ${pct(lin(0.16, 0.025)(r))} ของ HP สูงสุด + ${pct(lin(1.2, 0.15)(r))} ของพลังเวท ค่อย ๆ ฟื้นทีละส่วนตลอด 5 วิ` },
      { id: "alchemist_synth_grand", name: "มหาสังเคราะห์", kind: "active", max: 5, pos: [1, 2], req: [["alchemist_synth_wave", 5], ["alchemist_synth_elixir", 1]], glyph: "star",
        skill: { type: "cone", stat: "both", mult: lin(6.1, 0.76), stun: () => 1, mp: 50, cd: 16, motion: "swing", reach: 190, arc: 50,
          combo: { after: ["alchemist_synth_wave"], within: 4, more: () => 0.4 }, color: "#f0f8ff" },
        desc: (r) => `สังเคราะห์ธาตุทั้งสี่เป็นก้อนเดียวแล้วฟาดใส่ตัวที่ล็อกไว้ ${pct(lin(6.1, 0.76)(r))} ของพลังโจมตีและพลังเวท มึน 1 วิ ใช้ต่อจากคลื่นสสารแปรธาตุภายใน 4 วิ แรงขึ้น 40%` },
      // v0.6: three more passives (crystals set in the skin, a made heart, dense matter)
      { id: "alchemist_synth_inlay", name: "ผลึกฝังกาย", kind: "passive", max: 5, pos: [3, 1], req: [["alchemist_synth_ward", 3]], glyph: "ring",
        stats: (r) => ({ ...FOUR("Def", 2 * r), mdefPct: 0.015 * r }),
        desc: (r) => `ป้องกันธาตุดิน น้ำ ลม และไฟ +${2 * r} ต้านเวท +${pct(0.015 * r)}` },
      { id: "alchemist_synth_heart", name: "หัวใจสังเคราะห์", kind: "passive", max: 5, pos: [0, 2], req: [["alchemist_synth_blood", 3]], glyph: "heal",
        stats: (r) => ({ hpRegen: r, healPct: 0.03 * r }),
        desc: (r) => `ฟื้น HP +${r}/วิ สกิลรักษาแรงขึ้น ${pct(0.03 * r)}` },
      { id: "alchemist_synth_dense", name: "สสารหนาแน่น", kind: "passive", max: 5, pos: [2, 2], req: [["alchemist_synth_wave", 3]], glyph: "bash",
        stats: (r) => ({ aspd: 0.015 * r, ...FOUR("Atk", r) }),
        desc: (r) => `ความเร็วโจมตี +${pct(0.015 * r)} พลังโจมตีธาตุดิน น้ำ ลม และไฟ +${r}` },
    ],
  },
};

// The warlock's branches (fourth job, from the archmage, the high bishop, the spellblade or the
// historian): the invoker (three element orbs called one at a time, each a lasting buff while it
// is held, and an invoke that reads the three held as a recipe: ten spells for the ten mixes of
// fire, ice and lightning, after Dota's Invoker; a grand invoke for three orbs of one element) and
// the curse (dark that weakens, poison that eats on, lava that melts the armour; wide spells, a
// blood rite that lifts magic attack far at the cost of defence). Eight skills a branch (three
// passives on the invoker, two on the curse: a caster's are its spells), a little stronger than
// the archmage's at the same rank.
import type { SkillDef, Tree } from "../../progression";
import { pct, lin } from "../util";

const n1 = (v: number) => +v.toFixed(1);

// An invoked spell: what the invoke casts for one recipe, and how its desc tells it at a rank.
type Spell = { name: string; skill: SkillDef; text: (r: number) => string };
// The spells of a table one after another. (The skill window and the tooltip list each one's
// orbs in their colours, with its MP and cooldown, over this.)
const spellsText = (table: Record<string, Spell>, r: number) => Object.values(table).map((sp) => `${sp.name}: ${sp.text(r)}`).join(" · ");

// The invoke's ten spells, keyed by the orbs held (sorted, joined by "+"). Each keeps its own MP,
// cooldown and cast time; its numbers grow with the invoke's rank.
const INVOKED: Record<string, Spell> = {
  "fire+fire+fire": { name: "ตะวันพิพากษา",
    skill: { type: "blast", stat: "matk", element: "fire", mult: lin(5.0, 0.5), mp: 30, cd: 10, cast: 0.6, motion: "cast", range: 650, radius: 180, delay: 0.5, color: "#ffb04a" },
    text: (r) => `ลำแสงตะวันผ่าลงจุดที่เล็ง รัศมี 1.8 ม. ${pct(lin(5.0, 0.5)(r))}` },
  "ice+ice+ice": { name: "สะบั้นเยือกแข็ง",
    skill: { type: "bolt", stat: "matk", element: "ice", mult: lin(3.0, 0.3), freeze: lin(1.5, 0.1), mp: 22, cd: 9, cast: 0.5, motion: "cast", speed: 1100, range: 640, radius: 34, color: "#9fe0ff" },
    text: (r) => `ยิงน้ำแข็งใส่ตัวที่ล็อกไว้ ${pct(lin(3.0, 0.3)(r))} แช่แข็ง ${n1(lin(1.5, 0.1)(r))} วิ` },
  "lightning+lightning+lightning": { name: "คลื่นอัสนีสลายมนตร์",
    skill: { type: "blast", stat: "matk", element: "lightning", mult: lin(1.6, 0.16), hits: 2, every: 0.4, manaBurn: lin(0.3, 0.04), silence: 6,
      mp: 28, cd: 12, cast: 0.8, motion: "cast", range: 600, radius: 260, delay: 0.8, color: "#fff07a" },
    text: (r) => `สายฟ้าระเบิดตรงจุดที่เล็ง รัศมี 2.6 ม. 2 ครั้ง ครั้งละ ${pct(lin(1.6, 0.16)(r))} พวกร่ายเวทโดนแรงขึ้น ${pct(lin(0.3, 0.04)(r))} ตัวที่ร่ายเวทหรือยิงได้หยุด 6 วิ` },
  "fire+fire+ice": { name: "หอกไอระอุ",
    skill: { type: "beam", stat: "matk", element: "fire", mult: lin(2.1, 0.21), hits: 2, mp: 26, cd: 8, cast: 0.9, motion: "cast", length: 720, width: 90, color: "#ffc8a0" },
    text: (r) => `ไอน้ำเดือดพุ่งเป็นแนว 7.2 ม. ทะลุทุกตัว 2 ครั้ง ครั้งละ ${pct(lin(2.1, 0.21)(r))}` },
  "fire+fire+lightning": { name: "อุกกาบาตโกลาหล",
    skill: { type: "blast", stat: "matk", element: "fire", mult: lin(1.05, 0.105), hits: 5, every: 0.35, mp: 34, cd: 12, cast: 1.4, motion: "cast", range: 600, radius: 230, delay: 0.6, color: "#ff7a3a" },
    text: (r) => `อุกกาบาตตกใส่จุดที่เล็ง รัศมี 2.3 ม. 5 ครั้ง ครั้งละ ${pct(lin(1.05, 0.105)(r))}` },
  "fire+ice+ice": { name: "กำแพงลมเยือกแข็ง",
    skill: { type: "cone", stat: "matk", element: "ice", mult: lin(2.0, 0.2), slow: lin(4.5, 0.3), mp: 22, cd: 8, motion: "cast", reach: 280, arc: 140, color: "#c8ecff" },
    text: (r) => `ลมเยือกแข็งกวาดด้านหน้า 2.8 ม. ${pct(lin(2.0, 0.2)(r))} ช้าลง ${n1(lin(4.5, 0.3)(r))} วิ ร่ายทันที` },
  "ice+ice+lightning": { name: "เกราะธาราอัสนี",
    skill: { type: "shield", stat: "matk", mult: lin(1.0, 0.13), base: lin(0.19, 0.026), mp: 26, cd: 16, motion: "cast", duration: 18, color: "#b8d8ff" },
    text: (r) => `โล่ดูดซับ ${pct(lin(0.19, 0.026)(r))} ของ MP สูงสุด + ${pct(lin(1.0, 0.13)(r))} นาน 18 วิ` },
  "ice+lightning+lightning": { name: "พายุหิมะสายฟ้า",
    skill: { type: "storm", stat: "matk", element: "lightning", mult: lin(1.0, 0.1), pulses: 5, every: 0.35, slow: lin(2.25, 0.15), mp: 30, cd: 10, cast: 0.8, motion: "cast", radius: 280, color: "#e0f0ff" },
    text: (r) => `พายุรอบตัวรัศมี 2.8 ม. 5 ระลอก ระลอกละ ${pct(lin(1.0, 0.1)(r))} ช้าลง ${n1(lin(2.25, 0.15)(r))} วิ` },
  "fire+lightning+lightning": { name: "เร่งพลังธาตุ",
    skill: { type: "buff", mp: 30, cd: 35, motion: "cast", duration: 30, buff: (r) => ({ matkPct: 0.06 + 0.012 * r, castRed: 0.05 + 0.01 * r, cdr: 0.02 + 0.005 * r }), color: "#ffd870" },
    text: (r) => `30 วิ: พลังเวท +${pct(0.06 + 0.012 * r)} ลดเวลาร่าย ${pct(0.05 + 0.01 * r)} ลดคูลดาวน์ ${pct(0.02 + 0.005 * r)}` },
  "fire+ice+lightning": { name: "คลื่นธาตุคำราม",
    skill: { type: "cone", stat: "matk", mult: lin(2.4, 0.24), stun: lin(0.6, 0.06), knock: 140, mp: 30, cd: 12, cast: 0.5, motion: "cast", reach: 340, arc: 110, color: "#f0e0ff" },
    text: (r) => `คลื่นไร้ธาตุกวาดด้านหน้า 3.4 ม. ${pct(lin(2.4, 0.24)(r))} ผลักกระเด็นและมึน ${n1(lin(0.6, 0.06)(r))} วิ` },
};

// The grand invoke: only three orbs of one element, each a spell far beyond the ten.
const PURE: Record<string, Spell> = {
  "fire+fire+fire": { name: "สุริยะดับสูญ",
    skill: { type: "blast", stat: "matk", element: "fire", mult: lin(11.0, 1.4), stun: lin(1, 0.15), mp: 55, cd: 30, cast: 2.4, motion: "cast", range: 620, radius: 300, delay: 0.6, color: "#ffd060" },
    text: (r) => `ดวงตะวันดวงเล็กตกใส่จุดที่เล็ง รัศมี 3 ม. ${pct(lin(11.0, 1.4)(r))} มึน ${n1(lin(1, 0.15)(r))} วิ` },
  "ice+ice+ice": { name: "ศูนย์สัมบูรณ์",
    skill: { type: "nova", stat: "matk", element: "ice", mult: lin(8.0, 1.0), freeze: lin(2, 0.25), mp: 55, cd: 30, cast: 1.8, motion: "cast", radius: 340, color: "#e8f8ff" },
    text: (r) => `ความเย็นสุดขั้วรอบตัวรัศมี 3.4 ม. ${pct(lin(8.0, 1.0)(r))} แช่แข็ง ${n1(lin(2, 0.25)(r))} วิ` },
  "lightning+lightning+lightning": { name: "ทัณฑ์เทพอัสนี",
    skill: { type: "beam", stat: "matk", element: "lightning", mult: lin(3.8, 0.48), hits: 3, stun: () => 0.5, mp: 55, cd: 30, cast: 2.0, motion: "cast", length: 820, width: 130, color: "#fffab0" },
    text: (r) => `สายฟ้าเทพฟาดเป็นแนวยาว 8.2 ม. ทะลุทุกตัว 3 ครั้ง ครั้งละ ${pct(lin(3.8, 0.48)(r))} มึน 0.5 วิ` },
};

// An orb: a stance, quick and cheap; its buff counts once for every orb of it held.
const orb = (element: "fire" | "ice" | "lightning", color: string, buff: (r: number) => Record<string, number>): SkillDef =>
  ({ type: "orb", orb: element, buff, mp: 3, cd: 0.4, motion: "cast", color });
const HOLD = "(ถือได้ 3 ลูก ลูกที่ 4 แทนลูกเก่าสุด ลูกแก้วอยู่ข้ามแผนที่จนกว่าจะล้ม ลูกธาตุเดียวกันได้บัฟซ้อนกัน)";
// The curse's three elements, and what the lore and the rite raise.
const CURSED = (v: number) => ({ darkAtk: v, poisonAtk: v, lavaAtk: v });

export const WARLOCK_TREES: Record<string, Tree> = {
  // ---- the invoker: three orbs held, ten spells from their mixes ----
  warlock_invoker: {
    name: "เจ้าแห่งพลังธาตุ", cls: null, job4: "warlock", color: "#a8b8ff", glyph: "swirl",
    note: "อัญเชิญลูกแก้วธาตุไฟ น้ำแข็ง และสายฟ้า ถือได้ 3 ลูก แต่ละลูกให้บัฟตลอดที่ถืออยู่ (ไฟ: พลังเวท · น้ำแข็ง: ฟื้นฟูและต้านเวท · สายฟ้า: ร่ายไวและความเร็ว) แล้วผสานธาตุร่ายเวทตามลูกแก้วที่ถือ 10 แบบ ตั้งแต่ตะวันพิพากษา หอกไอระอุ อุกกาบาตโกลาหล จนถึงเกราะและบัฟ เปลี่ยนลูกแก้วตามสถานการณ์ ปิดท้ายด้วยมหาเวทธาตุแท้เมื่อถือลูกแก้วธาตุเดียวกันครบ 3 ลูก",
    nodes: [
      // (the invoke first: the branch's first skill on the bar; the orbs join it as they are learned)
      { id: "warlock_invoker_invoke", name: "ผสานธาตุ", kind: "active", max: 10, pos: [1, 0], glyph: "burst",
        skill: { type: "invoke", invoke: INVOKED, mp: 0, cd: 0, motion: "cast", color: "#c8b8ff" },
        desc: (r) => `ร่ายเวทตามลูกแก้ว 3 ลูกที่ถืออยู่ (ลำดับไม่สำคัญ) ได้ 10 แบบ แต่ละแบบมี MP คูลดาวน์ และเวลาร่ายของตัวเอง จึงเปลี่ยนลูกแก้วแล้วร่ายแบบอื่นต่อได้ทันที (ตัวเลขเป็น % ของพลังเวท): ${spellsText(INVOKED, r)}` },
      { id: "warlock_invoker_fire", name: "ลูกแก้วเพลิง", kind: "active", max: 10, pos: [0, 0], glyph: "flame",
        skill: orb("fire", "#ff8a4a", (r) => ({ matkPct: 0.005 * r, fireAtk: r })),
        desc: (r) => `อัญเชิญลูกแก้วธาตุไฟ 1 ลูก ทุกลูกที่ถืออยู่ให้ พลังเวท +${pct(0.005 * r)} พลังโจมตีธาตุไฟ +${r} ${HOLD}` },
      { id: "warlock_invoker_ice", name: "ลูกแก้วน้ำแข็ง", kind: "active", max: 10, pos: [2, 0], glyph: "freeze",
        skill: orb("ice", "#9fe0ff", (r) => ({ hpRegen: r, mpRegen: n1(0.15 * r), mdefPct: 0.01 * r })),
        desc: (r) => `อัญเชิญลูกแก้วธาตุน้ำแข็ง 1 ลูก ทุกลูกที่ถืออยู่ให้ ฟื้น HP +${r}/วิ ฟื้น MP +${n1(0.15 * r)}/วิ ต้านเวท +${pct(0.01 * r)} ${HOLD}` },
      { id: "warlock_invoker_lightning", name: "ลูกแก้วอัสนี", kind: "active", max: 10, pos: [3, 0], glyph: "bolt",
        skill: orb("lightning", "#fff07a", (r) => ({ castRed: 0.008 * r, aspd: 0.01 * r, move: 0.005 * r })),
        desc: (r) => `อัญเชิญลูกแก้วธาตุสายฟ้า 1 ลูก ทุกลูกที่ถืออยู่ให้ ลดเวลาร่าย ${pct(0.008 * r)} ความเร็วโจมตี +${pct(0.01 * r)} ความเร็วเดิน +${pct(0.005 * r)} ${HOLD}` },
      { id: "warlock_invoker_sage", name: "ปราชญ์สามธาตุ", kind: "passive", max: 10, pos: [0, 1], req: [["warlock_invoker_fire", 3]], glyph: "star",
        stats: (r) => ({ matkPct: 0.012 * r, fireAtk: n1(1.2 * r), iceAtk: n1(1.2 * r), lightningAtk: n1(1.2 * r) }),
        desc: (r) => `เวทที่ผสานออกมาแรงขึ้น: พลังเวท +${pct(0.012 * r)} พลังโจมตีธาตุไฟ น้ำแข็ง และสายฟ้า +${n1(1.2 * r)}` },
      { id: "warlock_invoker_well", name: "บ่อธาราแห่งปัญญา", kind: "passive", max: 5, pos: [2, 1], req: [["warlock_invoker_ice", 3]], glyph: "drop",
        stats: (r) => ({ maxMpPct: 0.03 * r, mpRegen: n1(0.5 * r) }),
        desc: (r) => `มานาพอสำหรับอัญเชิญและผสานไม่ขาดมือ: MP สูงสุด +${pct(0.03 * r)} ฟื้น MP +${n1(0.5 * r)}/วิ` },
      { id: "warlock_invoker_quick", name: "ความคิดเร็วกว่าคำ", kind: "passive", max: 5, pos: [3, 1], req: [["warlock_invoker_lightning", 3]], glyph: "wing",
        stats: (r) => ({ castRed: 0.02 * r, cdr: 0.01 * r }),
        desc: (r) => `ผสานธาตุได้ถี่ขึ้น: ลดเวลาร่าย ${pct(0.02 * r)} ลดคูลดาวน์ ${pct(0.01 * r)}` },
      { id: "warlock_invoker_pure", name: "มหาเวทธาตุแท้", kind: "active", max: 5, pos: [1, 2], req: [["warlock_invoker_invoke", 5], ["warlock_invoker_sage", 5]], glyph: "storm",
        skill: { type: "invoke", invoke: PURE, mp: 0, cd: 0, motion: "cast", color: "#f0e8ff" },
        desc: (r) => `ร่ายมหาเวทเมื่อถือลูกแก้วธาตุเดียวกันครบ 3 ลูก (ได้บัฟของธาตุนั้น 3 เท่าด้วย) แต่ละแบบมีคูลดาวน์ของตัวเอง (ตัวเลขเป็น % ของพลังเวท): ${spellsText(PURE, r)}` },
    ],
  },
  // ---- the curse: dark, poison and lava; weaken, expose, slow, and what eats on ----
  warlock_curse: {
    name: "พ่อมดคำสาป", cls: null, job4: "warlock", color: "#a080c0", glyph: "skull",
    note: "สาปศัตรูด้วยธาตุมืด พิษ และลาวา: ศรสาปทมิฬทำให้อ่อนแรง หมอกพิษกัดกินต่อเนื่องและทำให้ช้า ลาวาหลอมเกราะจนเปราะ คำสาปเปราะสลายลงทั้งฝูง สกิลส่วนใหญ่เป็นวงกว้าง พิธีโลหิตทมิฬเสริมพลังเวทรุนแรงแลกกับป้องกัน แล้วปิดด้วยฝนนรกาสามคำสาป แรงขึ้นเมื่อใช้ต่อจากคำสาปอื่น",
    nodes: [
      { id: "warlock_curse_lore", name: "ตำราต้องห้าม", kind: "passive", max: 10, pos: [0, 0], glyph: "scroll",
        stats: (r) => ({ matkPct: 0.013 * r, ...CURSED(n1(1.2 * r)) }),
        desc: (r) => `พลังเวท +${pct(0.013 * r)} พลังโจมตีธาตุมืด พิษ และลาวา +${n1(1.2 * r)}` },
      { id: "warlock_curse_hex", name: "ศรสาปทมิฬ", kind: "active", max: 10, pos: [1, 0], glyph: "skull",
        skill: { type: "bolt", stat: "matk", element: "dark", mult: lin(3.3, 0.33), weaken: lin(0.12, 0.012), debuff: 12, mp: 16, cd: 3, cast: 0.6, motion: "cast", speed: 1050, range: 640, radius: 32, color: "#9a6ad0" },
        desc: (r) => `ร่ายศรคำสาปใส่ตัวที่ล็อกไว้ ${pct(lin(3.3, 0.33)(r))} ของพลังเวท แล้ว 12 วิ: มันตีเบาลง ${pct(lin(0.12, 0.012)(r))}` },
      { id: "warlock_curse_miasma", name: "หมอกพิษกัดกร่อน", kind: "active", max: 10, pos: [2, 0], glyph: "cloud",
        skill: { type: "blast", stat: "matk", element: "poison", mult: lin(0.7, 0.07), hits: 4, every: 0.5, poison: lin(0.4, 0.04), slow: lin(2.25, 0.15),
          mp: 26, cd: 9, cast: 1.0, motion: "cast", range: 560, radius: 240, delay: 0.3, color: "#8fdc4a" },
        desc: (r) => `ปล่อยหมอกพิษลงจุดที่เล็ง รัศมี 2.4 ม. กัด 4 ครั้ง ครั้งละ ${pct(lin(0.7, 0.07)(r))} ของพลังเวท ทุกครั้งติดพิษอีก ${pct(lin(0.4, 0.04)(r))} ของดาเมจใน 4 วิ และช้าลง ${n1(lin(2.25, 0.15)(r))} วิ` },
      { id: "warlock_curse_eruption", name: "ลาวาทะลักพสุธา", kind: "active", max: 10, pos: [3, 0], glyph: "burst",
        skill: { type: "blast", stat: "matk", element: "lava", mult: lin(1.55, 0.155), hits: 3, every: 0.4, expose: lin(0.1, 0.012), debuff: 12,
          mp: 32, cd: 10, cast: 1.4, motion: "cast", range: 580, radius: 230, delay: 0.4, color: "#ff6a2a" },
        desc: (r) => `ลาวาพุ่งจากพื้นตรงจุดที่เล็ง รัศมี 2.3 ม. 3 ครั้ง ครั้งละ ${pct(lin(1.55, 0.155)(r))} ของพลังเวท หลอมเกราะ 12 วิ: รับดาเมจเพิ่ม ${pct(lin(0.1, 0.012)(r))}` },
      { id: "warlock_curse_linger", name: "คำสาปซึมลึก", kind: "passive", max: 5, pos: [0, 1], req: [["warlock_curse_lore", 3]], glyph: "drop",
        stats: (r) => ({ poisonPct: 0.06 * r, huntDmg: 0.02 * r }),
        desc: (r) => `พิษแรงขึ้น ${pct(0.06 * r)} ดาเมจใส่ศัตรูที่ติดสถานะผิดปกติ (พิษ ช้า อ่อนแรง เปราะ...) +${pct(0.02 * r)}` },
      { id: "warlock_curse_frailty", name: "คำสาปเปราะสลาย", kind: "active", max: 10, pos: [1, 1], req: [["warlock_curse_hex", 4]], glyph: "down",
        skill: { type: "blast", stat: "matk", element: "dark", mult: lin(1.0, 0.1), weaken: lin(0.1, 0.01), expose: lin(0.1, 0.012), slow: lin(3, 0.225), debuff: 15,
          mp: 28, cd: 12, cast: 0.8, motion: "cast", range: 600, radius: 270, delay: 0.3, color: "#7a50b0" },
        desc: (r) => `สาปทั้งฝูงตรงจุดที่เล็ง รัศมี 2.7 ม. ${pct(lin(1.0, 0.1)(r))} ของพลังเวท แล้ว 15 วิ: ตีเบาลง ${pct(lin(0.1, 0.01)(r))} รับดาเมจเพิ่ม ${pct(lin(0.1, 0.012)(r))} และช้าลง ${n1(lin(3, 0.225)(r))} วิ` },
      { id: "warlock_curse_pact", name: "พิธีโลหิตทมิฬ", kind: "active", max: 5, pos: [3, 1], req: [["warlock_curse_eruption", 3]], glyph: "rage",
        skill: { type: "buff", mp: 36, cd: 40, motion: "cast", duration: 30,
          buff: (r) => ({ matkPct: 0.14 + 0.03 * r, castRed: 0.04 + 0.01 * r, ...CURSED(6 + 3 * r), defPct: -0.1, mdefPct: -0.1 }), color: "#c03050" },
        desc: (r) => `30 วิ: สละเลือดให้พลังมืด พลังเวท +${pct(0.14 + 0.03 * r)} ลดเวลาร่าย ${pct(0.04 + 0.01 * r)} พลังโจมตีธาตุมืด พิษ และลาวา +${6 + 3 * r} แต่ป้องกันและต้านเวท −10%` },
      { id: "warlock_curse_doom", name: "ฝนนรกาสามคำสาป", kind: "active", max: 5, pos: [2, 2], req: [["warlock_curse_frailty", 5], ["warlock_curse_pact", 1]], glyph: "storm",
        skill: { type: "blast", stat: "matk", element: "lava", mult: lin(2.0, 0.25), hits: 4, every: 0.35, poison: lin(0.2, 0.03), weaken: () => 0.2, expose: lin(0.12, 0.02), debuff: 15,
          mp: 52, cd: 18, cast: 2.2, motion: "cast", range: 600, radius: 300, delay: 0.5,
          combo: { after: ["warlock_curse_frailty", "warlock_curse_miasma", "warlock_curse_eruption"], within: 5, more: () => 0.35 }, color: "#d04040" },
        desc: (r) => `ฝนลาวาดำปนพิษตกใส่จุดที่เล็ง รัศมี 3 ม. 4 ครั้ง ครั้งละ ${pct(lin(2.0, 0.25)(r))} ของพลังเวท ทุกครั้งติดพิษอีก ${pct(lin(0.2, 0.03)(r))} ของดาเมจ แล้ว 15 วิ: ตีเบาลง 20% รับดาเมจเพิ่ม ${pct(lin(0.12, 0.02)(r))} ใช้ต่อจากคำสาปเปราะสลาย หมอกพิษกัดกร่อน หรือลาวาทะลักพสุธาภายใน 5 วิ แรงขึ้น 35%` },
    ],
  },
};

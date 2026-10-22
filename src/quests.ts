// Quests: errands the townsfolk give. Some are done once, some can be taken again after a while
// (`repeat`, minutes); some are one step, some a chain of steps, each handed in to someone
// before the next begins. A step's goal is one of:
//   kill     defeat so many of some monsters (bestiary ids, or the slime colours)
//   collect  bring so many of an item (taken when the step is handed in); `from` monsters drop
//            it, but only while the step is on (quest items)
//   talk     go and talk to someone (the step's `to`)
//   visit    set foot on a map (goes on to the next step by itself)
//   level    reach a level
// Rewards come at the end: gold, experience, skill points (on top of a point a level) and items.
// A step can also hand the player something to carry (`gives`, a letter) and take it back.
// Job quests (`job`) come from each second job's master; the master tells what it takes (the
// level, the classes) and, at the last hand-in, lets the player pick a branch of the job.
//
// The state is per character (save.ts saveKey): the quests on, their step and count, how many
// times each was finished, and when a repeatable one may be taken again.

import { saveKey } from "./save";
import type { MapId } from "./maps";
import type { JobId } from "./progression";

export interface Who {
  map: MapId;
  npc: string;  // the townsperson's id (the town's NpcSpec)
  name: string; // shown in the log
}

export type Goal =
  | { kind: "kill"; what: string[]; count: number }
  | { kind: "collect"; item: string; count: number; from?: string[]; chance?: number }
  | { kind: "talk" }
  | { kind: "visit"; map: MapId }
  | { kind: "level"; level: number };

export interface Step {
  goal: Goal;
  to: Who;                     // who it is handed in to (for talk: who to talk to)
  task: string;                // the objective, as the log reads it
  say: string;                 // what `to` says when it is handed in
  gives?: [string, number][];  // handed over when the step begins
  takes?: [string, number][];  // taken back when it is handed in
}

export interface Reward {
  gold?: number;
  xp?: number;
  points?: number;
  items?: [string, number][];
}

export interface QuestDef {
  id: string;
  name: string;
  giver: Who;
  repeat?: number;   // minutes before it can be taken again (none: once only)
  level?: number;    // the least level to be offered it
  after?: string[];  // quests to have finished first
  offer: string;     // what the giver says
  steps: Step[];
  reward: Reward;
  job?: JobId;       // a job change: offered only to who may take that job; on the last hand-in
                     // the player picks one of its branches and takes the job (progression.ts)
}

// Who's who (the townsfolk the quests go through).
const W = (map: MapId, npc: string, name: string): Who => ({ map, npc, name });
const KARA = W("eden", "adventurer", "คาร่า"), MARIA = W("eden", "healer", "ซิสเตอร์มาเรีย"), LILIA = W("eden", "shop", "ลิเลีย");
const TOM = W("eden", "merchant_boy", "ทอม"), MARCO = W("eden", "sailor", "กัปตันมาร์โก"), BRUNO = W("eden", "guard_s", "ทหารยามบรูโน");
const ROLAND = W("eden", "guard_n1", "ทหารยามโรแลนด์"), HENRIK = W("eden", "guard_w1", "ทหารยามเฮนริก"), LENA = W("eden", "guide", "ลีน่า");
const TORVALD = W("iceberg", "ice_elder", "ผู้เฒ่าทอร์วัลด์"), BJORN = W("iceberg", "ice_smith", "บียอร์น"), LEIF = W("iceberg", "ice_fisher", "ไลฟ์");
const INGRID = W("iceberg", "ice_netmender", "อิงกริด"), HARALD = W("iceberg", "ice_captain", "กัปตันฮาราลด์");
const BATU = W("trunrada", "trunrada_chief", "หัวหน้าเผ่าบาตู"), TUYA = W("trunrada", "trunrada_girl", "ทูยา");
const SOLONGO = W("trunrada", "trunrada_tanner", "ซอลองโก"), ALTAN = W("trunrada", "trunrada_herder", "อัลตัน");
const REINHARDT = W("kradia", "kradia_knight", "เซอร์ไรน์ฮาร์ท"), NADIA = W("kradia", "kradia_scout", "นาเดีย");
const GRISELDA = W("kradia", "kradia_witch", "ยายกริเซลดา"), KRA_MINER = W("kradia", "kradia_miner", "ทอร์วัลด์");
const SALIM = W("bahamas", "bh_caravan", "ซาลิม"), AMINA = W("bahamas", "bh_water", "อามีนา"), NADEEM = W("bahamas", "bh_story", "ท่านนาดีม");
const UMAR = W("bahamas", "bh_potter", "อุมัร");
const TALEK = W("yodia", "yodia_elder", "ตาเหล็ก"), PRATEEP = W("yodia", "yodia_keeper", "ลุงประทีป"), JAMPEE = W("yodia", "yodia_fishwife", "ป้าจำปี");
const RYOKAN = W("osaki", "osaki_monk", "หลวงพี่เรียวคัง"), AOI = W("osaki", "osaki_aoi", "อาโออิ"), TOKUBE = W("osaki", "osaki_brewer", "โทคุเบ");
// the job masters
const TEMUR = W("trunrada", "job_ranger", "นายพรานเตมูร์"), LEON = W("kradia", "job_swordsman", "ปรมาจารย์ลีออน");
const ZAHARA = W("bahamas", "job_wizard", "จอมเวทซาฮาร่า"), CELESTE = W("eden", "job_bishop", "มารดาเซเลสต์");
const KENSHIN = W("osaki", "job_battlemage", "อาจารย์เคนชิน"), RAGNAR = W("iceberg", "job_warlord", "ราโกนาร์ผู้คลั่ง");

const kill = (what: string | string[], count: number): Goal => ({ kind: "kill", what: typeof what === "string" ? [what] : what, count });
const collect = (item: string, count: number, from?: string, chance = 0.5): Goal => ({ kind: "collect", item, count, from: from ? [from] : undefined, chance });
const talk: Goal = { kind: "talk" };
const visit = (map: MapId): Goal => ({ kind: "visit", map });
const SLIMES = ["green", "pink", "blue", "violet"];

export const QUESTS: QuestDef[] = [
  // ---- Eden: the first steps, the roads and woods round the capital ----
  { id: "eden_first_steps", name: "ก้าวแรกของนักผจญภัย", giver: KARA,
    offer: "มือใหม่ใช่ไหม? ข้าจะสอนวิธีเอาตัวรอดให้ เริ่มจากออกไปจัดการสไลม์เขียวที่ทุ่งหญ้าตะวันตกสัก 5 ตัวก่อน",
    steps: [
      { goal: kill("green", 5), to: KARA, task: "ปราบสไลม์เขียวที่ทุ่งหญ้าตะวันตก (นอกประตูตะวันตก)", say: "เก่งนี่! ทีนี้ไปรับพรจากซิสเตอร์มาเรียที่ยืนอยู่ใกล้สี่แยกกลางเมืองนะ" },
      { goal: talk, to: MARIA, task: "ไปหาซิสเตอร์มาเรีย นักบวชใกล้สี่แยกกลางเมือง", say: "ขอพรจงคุ้มครองเจ้า... ช่วยเอาเยลลี่ไปให้ลิเลียที่ร้านเครื่องมือด้วยนะ เธอใช้มันทำยา" },
      { goal: collect("jelly", 5), to: LILIA, task: "นำเยลลี่ 5 ก้อนไปให้ลิเลียที่ร้านเครื่องมือ", say: "ขอบใจจ้ะ! นี่ยาแดงไว้ใช้ระหว่างทาง แล้วแวะมาซื้อของกันอีกนะ" },
    ],
    reward: { gold: 300, xp: 400, points: 1, items: [["potion_red", 5]] } },
  { id: "eden_letter", name: "จดหมายถึงกัปตัน", giver: TOM, level: 3,
    offer: "พี่ ๆ ช่วยเอาจดหมายนี้ไปให้กัปตันมาร์โกที่ท่าเรือหน่อยได้ไหม ผมต้องเฝ้าของอยู่ตรงนี้",
    steps: [
      { goal: talk, to: MARCO, task: "ส่งจดหมายให้กัปตันมาร์โกที่ท่าเรือฝั่งตะวันออก", gives: [["quest_letter", 1]], takes: [["quest_letter", 1]],
        say: "จดหมายจากบ้าน! ขอบใจมาก ฝากบอกทอมด้วยว่าข้าได้รับแล้ว" },
      { goal: talk, to: TOM, task: "กลับไปบอกทอมว่าส่งจดหมายแล้ว", say: "ส่งถึงแล้วเหรอ! ขอบคุณนะพี่ นี่ค่าจ้างครับ" },
    ],
    reward: { gold: 250, xp: 300, items: [["potion_blue", 3]] } },
  { id: "eden_patrol", name: "ลาดตระเวนทุ่งหญ้าตะวันตก", giver: BRUNO, repeat: 5,
    offer: "สไลม์ที่ทุ่งตะวันตกเพิ่มขึ้นทุกวัน ช่วยลดจำนวนมันลงสัก 10 ตัว แล้วมารับค่าจ้างได้เลย",
    steps: [{ goal: kill(SLIMES, 10), to: BRUNO, task: "ปราบสไลม์สีไหนก็ได้ที่ทุ่งหญ้าตะวันตก", say: "ทุ่งสงบลงแล้ว รับค่าจ้างไป พรุ่งนี้... เอ่อ อีกสักพักมาช่วยอีกนะ" }],
    reward: { gold: 150, xp: 200 } },
  { id: "eden_jelly", name: "เยลลี่สำหรับปรุงยา", giver: LILIA, repeat: 3,
    offer: "ร้านต้องใช้เยลลี่ทำยาเยอะมาก ถ้าเก็บมาได้ 10 ก้อน ข้าแลกยาให้นะ",
    steps: [{ goal: collect("jelly", 10), to: LILIA, task: "นำเยลลี่ 10 ก้อนมาให้ลิเลีย", say: "ครบพอดี! นี่ยากับค่าแรงจ้ะ" }],
    reward: { gold: 120, items: [["potion_red", 2]] } },
  { id: "eden_explorer", name: "เปิดโลกกว้าง", giver: LENA, level: 5,
    offer: "อยากเป็นนักผจญภัยต้องรู้จักทาง ลองไปเดินให้ทั่วทุ่งหญ้าตะวันตก ป่าใหญ่ตะวันตก และถนนหลวง แล้วกลับมาเล่าให้ฟังนะ",
    steps: [
      { goal: visit("field"), to: LENA, task: "ไปที่ทุ่งหญ้าตะวันตก", say: "" },
      { goal: visit("west_woods"), to: LENA, task: "ไปที่ป่าใหญ่ตะวันตก", say: "" },
      { goal: visit("royal_road"), to: LENA, task: "ไปที่ถนนหลวง (ประตูเหนือ)", say: "" },
      { goal: talk, to: LENA, task: "กลับไปเล่าให้ลีน่าฟัง", say: "ไปมาครบแล้วสินะ! ทีนี้เจ้าก็รู้ทางรอบเมืองหลวงแล้ว" },
    ],
    reward: { gold: 500, xp: 800, points: 1 } },
  { id: "eden_woods", name: "เห็ดพิษในป่าใหญ่", giver: HENRIK, level: 8,
    offer: "เห็ดสปอร์ในป่าใหญ่ตะวันตกปล่อยสปอร์มาถึงประตูแล้ว ไปจัดการมันสัก 10 ต้นที",
    steps: [{ goal: kill("spore_mushroom", 10), to: HENRIK, task: "ปราบเห็ดสปอร์ที่ป่าใหญ่ตะวันตก", say: "อากาศสดชื่นขึ้นทันตา ขอบใจมาก นี่ยาแดงเข้มข้นจากคลังทหาร" }],
    reward: { gold: 600, xp: 1500, items: [["potion_red_big", 3]] } },
  { id: "eden_guardian", name: "ผู้พิทักษ์ศาลป่า", giver: HENRIK, level: 18, after: ["eden_woods"],
    offer: "ลึกเข้าไปในป่ามีผู้พิทักษ์ศาลป่าที่คลั่งไปแล้ว ก่อนจะเข้าใกล้มันได้ ต้องฝ่ากระรอกเขี้ยวดาบไปก่อน",
    steps: [
      { goal: kill("fang_squirrel", 10), to: HENRIK, task: "ปราบกระรอกเขี้ยวดาบที่ป่าใหญ่ตะวันตก", say: "ทางเข้าศาลป่าเปิดแล้ว ระวังตัวด้วย มันแข็งแกร่งกว่าที่เห็น" },
      { goal: kill("grove_guardian", 1), to: HENRIK, task: "ปราบผู้พิทักษ์ศาลป่า (บอสป่าใหญ่ตะวันตก)", say: "เจ้าทำได้จริง ๆ! ป่าคงกลับมาสงบ รับรางวัลนี้ไปเถิด" },
    ],
    reward: { gold: 4000, xp: 6000, points: 2, items: [["ring_life", 1]] } },
  { id: "eden_road", name: "ภัยบนถนนหลวง", giver: ROLAND, level: 10,
    offer: "ถนนหลวงไปปราสาทไม่ปลอดภัยแล้ว ทั้งตั๊กแตน หนู และโจร ช่วยกวาดล้างให้ทีเถอะ",
    steps: [
      { goal: kill("wheat_locust", 8), to: ROLAND, task: "ปราบตั๊กแตนทุ่งข้าวที่ถนนหลวง", say: "ดี! แต่หนูโรงสีก็กัดกระสอบข้าวของกองทัพจนพรุนหมดแล้ว" },
      { goal: kill("mill_rat", 8), to: ROLAND, task: "ปราบหนูโรงสีที่ถนนหลวง", say: "เหลือตัวการใหญ่ โจรดักปล้นที่ซุ่มอยู่ริมถนน จัดการมันซะ" },
      { goal: kill("highway_bandit", 1), to: ROLAND, task: "ปราบโจรดักปล้นที่ถนนหลวง", say: "ถนนหลวงปลอดภัยแล้ว ในนามกองทหารแห่งอีเดน ขอบคุณเจ้ามาก" },
    ],
    reward: { gold: 2000, xp: 4000, points: 1, items: [["ring_power", 1]] } },
  { id: "eden_tusks", name: "งาหมูป่าทำยา", giver: MARIA, level: 12, repeat: 10,
    offer: "งาหมูป่าโอ๊กบดผสมยาแล้วช่วยสมานแผลได้ดีนัก ช่วยหามาให้ข้า 5 อันได้ไหม",
    steps: [{ goal: collect("boar_tusk", 5, "oak_boar"), to: MARIA, task: "เก็บงาหมูป่า 5 อัน (จากหมูป่าโอ๊ก ป่าใหญ่ตะวันตก)", say: "ขอบใจนะลูก ข้าจะทำยาแจกผู้บาดเจ็บ นี่ส่วนของเจ้า" }],
    reward: { gold: 300, xp: 1200, items: [["potion_red_big", 2]] } },

  // ---- Iceberg: the snow that will not melt ----
  { id: "ice_frost", name: "หิมะที่ไม่ยอมละลาย", giver: TORVALD, level: 35,
    offer: "หิมะปีนี้ไม่ยอมละลายแม้ถึงหน้าร้อน ข้าสงสัยว่ามนุษย์หิมะที่เชิงเขาคือต้นเหตุ ไปดูให้ทีเถิด",
    steps: [
      { goal: kill("snowman", 10), to: TORVALD, task: "ปราบมนุษย์หิมะน้อยที่เชิงเขาหิมะ", say: "ในตัวพวกมันมีแกนน้ำแข็งที่ไม่ละลาย ไปถามบียอร์นช่างตีเหล็กดูว่ามันคืออะไร" },
      { goal: talk, to: BJORN, task: "ไปหาบียอร์น ช่างตีเหล็ก", say: "แกนน้ำแข็งพวกนี้มาจากโกเลมน้ำแข็งที่ช่องเขา เอามาให้ข้า 5 แกน ข้าจะหลอมมันทิ้ง" },
      { goal: collect("ice_core", 5, "ice_golem"), to: BJORN, task: "เก็บแกนน้ำแข็ง 5 แกน (จากโกเลมน้ำแข็ง ช่องเขาน้ำแข็ง)", say: "หลอมเสร็จแล้ว ความหนาวผิดธรรมชาติจะจางลง ไปบอกท่านผู้เฒ่าเถิด" },
      { goal: talk, to: TORVALD, task: "กลับไปรายงานผู้เฒ่าทอร์วัลด์", say: "เจ้าได้ช่วยไอซ์เบิร์กไว้ ตำราเล่มนี้ข้าเก็บไว้นานแล้ว มันควรเป็นของผู้กล้าเช่นเจ้า" },
    ],
    reward: { gold: 6000, xp: 25000, points: 2, items: [["grimoire", 1]] } },
  { id: "ice_wolves", name: "หมาป่าหิมะบนเส้นทางขนส่ง", giver: HARALD, level: 38, repeat: 10,
    offer: "หมาป่าหิมะดักกินเสบียงที่ขนมาทางเชิงเขา ช่วยไล่มันสัก 10 ตัว",
    steps: [{ goal: kill("snow_wolf", 10), to: HARALD, task: "ปราบหมาป่าหิมะที่เชิงเขาหิมะ", say: "เกวียนผ่านไปได้แล้ว รับค่าจ้างไป" }],
    reward: { gold: 1800, xp: 6000 } },
  { id: "ice_seals", name: "แมวน้ำขโมยปลา", giver: LEIF, level: 55, repeat: 10,
    offer: "แมวน้ำเขี้ยวดาบขโมยปลาจากอวนข้าทุกวัน ไล่มันไปสัก 8 ตัวที",
    steps: [{ goal: kill("sabre_seal", 8), to: LEIF, task: "ปราบแมวน้ำเขี้ยวดาบที่ทุ่งน้ำแข็งเหนือ", say: "อวนข้าเต็มอีกครั้งแล้ว ขอบใจมาก" }],
    reward: { gold: 2500, xp: 9000 } },
  { id: "ice_pelts", name: "ขนหมีขั้วโลก", giver: INGRID, level: 60,
    offer: "ข้าจะถักเสื้อกันหนาวให้ชาวประมง แต่ต้องใช้ขนหมีขั้วโลก 3 ผืน ช่วยหามาได้ไหม",
    steps: [{ goal: collect("polar_pelt", 3, "polar_bear"), to: INGRID, task: "เก็บขนหมีขั้วโลก 3 ผืน (จากหมีขั้วโลก ทุ่งน้ำแข็งเหนือ)", say: "ขนนุ่มดีจริง ๆ นี่เครื่องรางที่ข้าทำไว้ มันจะคุ้มครองเจ้า" }],
    reward: { gold: 4000, xp: 15000, items: [["trinket_charm", 1]] } },

  // ---- Trunrada: the clan's trials ----
  { id: "trun_trial", name: "พิสูจน์ตนต่อเผ่า", giver: BATU, level: 30,
    offer: "คนนอกที่อยากได้รับการยอมรับจากเผ่าต้องผ่านบททดสอบสามขั้น เจ้าพร้อมไหม",
    steps: [
      { goal: kill("horned_hare", 10), to: BATU, task: "ปราบกระต่ายเขาเดียวที่สเตปป์ตะวันตก", say: "ว่องไวดี ขั้นต่อไป ควายป่าขนยาว มันจะทดสอบความอดทนของเจ้า" },
      { goal: kill("shaggy_bison", 6), to: BATU, task: "ปราบควายป่าขนยาวที่สเตปป์ตะวันตก", say: "แข็งแกร่งดี ขั้นสุดท้าย โจรม้าเร่ร่อนที่ปล้นฝูงสัตว์ของเรา" },
      { goal: kill("nomad_raider", 1), to: BATU, task: "ปราบโจรม้าเร่ร่อนที่สเตปป์ตะวันตก", say: "จากนี้เจ้าคือมิตรของทรุนราดา รองเท้าคู่นี้ทำจากหนังม้าศึก สวมมันด้วยความภูมิใจ" },
    ],
    reward: { gold: 5000, xp: 18000, points: 2, items: [["shoes_swift", 1]] } },
  { id: "trun_eagles", name: "อินทรีโฉบลูกแกะ", giver: TUYA, level: 36, repeat: 10,
    offer: "นกอินทรีทุ่งโฉบลูกแกะของหนูไปอีกแล้ว ช่วยไล่มันไปสัก 6 ตัวได้ไหมคะ",
    steps: [{ goal: kill("steppe_eagle", 6), to: TUYA, task: "ปราบนกอินทรีทุ่งที่สเตปป์ตะวันตก", say: "ลูกแกะปลอดภัยแล้ว! ขอบคุณค่ะ" }],
    reward: { gold: 1500, xp: 5000 } },
  { id: "trun_hides", name: "หนังควายป่าขนยาว", giver: SOLONGO, level: 33, repeat: 15,
    offer: "หนังควายป่าขนยาวทำกระโจมได้ดีที่สุด เอามาให้ข้า 4 ผืน ข้าจ่ายให้งาม",
    steps: [{ goal: collect("bison_hide", 4, "shaggy_bison"), to: SOLONGO, task: "เก็บหนังควายป่า 4 ผืน (จากควายป่าขนยาว สเตปป์ตะวันตก)", say: "หนังดีมาก! รับค่าแรงไป" }],
    reward: { gold: 1800, xp: 5000, items: [["potion_red_big", 3]] } },
  { id: "trun_horses", name: "ม้าป่ากับวิญญาณคนเลี้ยงม้า", giver: ALTAN, level: 40,
    offer: "ม้าป่าแผงคอไฟที่ทุ่งเลี้ยงม้าคลุ้มคลั่ง ข้าเชื่อว่าผีคนเลี้ยงม้าต้อนพวกมันอยู่ ช่วยข้าด้วย",
    steps: [
      { goal: kill("flame_mane", 8), to: ALTAN, task: "ปราบม้าป่าแผงคอไฟที่ทุ่งเลี้ยงม้า", say: "ม้าสงบลงบ้างแล้ว แต่ต้นเหตุยังอยู่ ไปจัดการผีคนเลี้ยงม้าเถิด" },
      { goal: kill("ghost_rancher", 5), to: ALTAN, task: "ปราบผีคนเลี้ยงม้าที่ทุ่งเลี้ยงม้า", say: "วิญญาณพวกนั้นคงได้ไปสู่สุคติแล้ว ขอบใจเจ้ามาก" },
    ],
    reward: { gold: 6000, xp: 22000, points: 1 } },

  // ---- Kradia: the frontier ----
  { id: "kra_front", name: "แนวหน้าชายแดน", giver: REINHARDT, level: 70,
    offer: "กองทัพอสูรกำลังรวมพลที่แนวชายแดน ป้อมต้องการนักรบทุกคน เจ้าจะสู้เคียงข้างเราไหม",
    steps: [
      { goal: kill("skeleton_soldier", 15), to: REINHARDT, task: "ปราบทหารโครงกระดูกที่แนวชายแดน", say: "แนวแรกแตกแล้ว ต่อไปคืออสูรหัวแพะที่คอยปลุกพวกมันขึ้นมา" },
      { goal: kill("goat_demon", 8), to: REINHARDT, task: "ปราบอสูรหัวแพะที่แนวชายแดน", say: "เหลือโกเลมเครื่องยิงหินที่ถล่มกำแพงเรา ทำลายมันซะ" },
      { goal: kill("siege_golem", 5), to: REINHARDT, task: "ปราบโกเลมเครื่องยิงหินที่แนวชายแดน", say: "ป้อมคราเดียจะจดจำชื่อเจ้าไว้ วีรชนแห่งแนวหน้า" },
    ],
    reward: { gold: 25000, xp: 80000, points: 3 } },
  { id: "kra_imps", name: "ลาดตระเวนป่าชายแดน", giver: NADIA, level: 63, repeat: 15,
    offer: "อิมป์เงาแอบตามหน่วยสอดแนมของเรา ช่วยกำจัดมันสัก 10 ตัว",
    steps: [{ goal: kill("shadow_imp", 10), to: NADIA, task: "ปราบอิมป์เงาที่ป่าชายแดน", say: "ทางสะดวกแล้ว นี่ค่าตอบแทน" }],
    reward: { gold: 5000, xp: 22000 } },
  { id: "kra_wolves", name: "หมาป่าหุบผา", giver: KRA_MINER, level: 50, repeat: 15,
    offer: "หมาป่าหุบผาดักทำร้ายคนขุดผลึกระหว่างทาง ช่วยไล่มันสัก 10 ตัวที",
    steps: [{ goal: kill("canyon_wolf", 10), to: KRA_MINER, task: "ปราบหมาป่าหุบผาที่ทุ่งหินตั้ง", say: "พวกเราออกไปขุดผลึกได้แล้ว ขอบคุณมาก" }],
    reward: { gold: 3500, xp: 14000 } },
  { id: "kra_crystal", name: "ผงผลึกมืด", giver: GRISELDA, level: 85,
    offer: "หึ ๆ ข้าต้องการเศษผลึกมืดจากอสูรผลึกที่ดินแดนอสูร 5 ชิ้น ทำยาที่เจ้าไม่อยากรู้หรอก",
    steps: [{ goal: collect("dark_shard", 5, "dark_crystal_fiend"), to: GRISELDA, task: "เก็บเศษผลึกมืด 5 ชิ้น (จากอสูรผลึกมืด ดินแดนอสูร)", say: "ดีมาก ดีมาก... นี่รางวัลของเจ้า อย่าถามว่ายายจะเอาไปทำอะไร" }],
    reward: { gold: 20000, xp: 70000, points: 2, items: [["potion_blue_big", 10]] } },

  // ---- Bahamas: the desert roads ----
  { id: "bh_caravan", name: "คาราวานที่หายไป", giver: SALIM, level: 20,
    offer: "กองคาราวานของข้าติดอยู่ที่ชายทะเลทราย ถูกแมงป่องกับแร้งรุมล้อม ช่วยเปิดทางให้ที",
    steps: [
      { goal: kill("red_scorpion", 10), to: SALIM, task: "ปราบแมงป่องทรายแดงที่ชายทะเลทราย", say: "ดี! ยังเหลือฝูงแร้งที่บินวนอยู่เหนือกองคาราวาน" },
      { goal: kill("desert_vulture", 6), to: SALIM, task: "ปราบนกแร้งทะเลทรายที่ชายทะเลทราย", say: "กองคาราวานกลับมาได้แล้ว ช่วยไปบอกอามีนาที่บ่อน้ำด้วย น้องสาวข้าเป็นห่วงมาก" },
      { goal: talk, to: AMINA, task: "ไปบอกอามีนาที่บ่อน้ำว่ากองคาราวานปลอดภัย", say: "พี่ซาลิมปลอดภัยแล้วเหรอ! ขอบคุณมากนะคะ นี่สิ่งที่พี่ฝากไว้ให้" },
    ],
    reward: { gold: 3000, xp: 9000, points: 1 } },
  { id: "bh_bandages", name: "ผ้าพันศพเก่า", giver: UMAR, level: 30, repeat: 10,
    offer: "ผ้าพันศพของมัมมี่เผาแล้วได้สีเคลือบหม้อที่สวยที่สุด หามาให้ข้า 5 ผืนสิ",
    steps: [{ goal: collect("old_bandage", 5, "mummy_slave"), to: UMAR, task: "เก็บผ้าพันศพเก่า 5 ผืน (จากมัมมี่ทาส ทะเลทรายใหญ่)", say: "พอทำได้อีกหลายใบเลย ขอบใจนะ" }],
    reward: { gold: 2000, xp: 7000 } },
  { id: "bh_pharaoh", name: "คำสาปฟาโรห์", giver: NADEEM, level: 45,
    offer: "ในนิทานเก่า ฟาโรห์ที่ถูกสาปจะคืนชีพทุกพันปี... และตอนนี้มันตื่นขึ้นแล้วจริง ๆ ที่ทะเลทรายใหญ่",
    steps: [{ goal: kill("risen_pharaoh", 1), to: NADEEM, task: "ปราบฟาโรห์คืนชีพ (บอสทะเลทรายใหญ่)", say: "เจ้าได้เขียนนิทานบทใหม่แล้ว และข้าจะเล่ามันไปอีกพันปี" }],
    reward: { gold: 12000, xp: 35000, points: 2, items: [["hat_feather", 1]] } },

  // ---- Yodia: the jungle and the coast ----
  { id: "yo_frogs", name: "กบพิษในป่า", giver: TALEK, level: 25, repeat: 10,
    offer: "กบพิษลายเสือลงมาถึงหมู่บ้านแล้ว เด็ก ๆ ออกไปเล่นไม่ได้ ช่วยปราบสัก 8 ตัว",
    steps: [{ goal: kill("tiger_frog", 8), to: TALEK, task: "ปราบกบพิษลายเสือที่ป่าดิบใต้", say: "เด็ก ๆ ออกมาวิ่งเล่นได้แล้ว ขอบใจเจ้านะ" }],
    reward: { gold: 1200, xp: 4500 } },
  { id: "yo_crabs", name: "ปูก้ามเหล็กหนีบอวน", giver: JAMPEE, level: 35,
    offer: "ปูก้ามเหล็กที่ป่าชายเลนหนีบอวนป้าขาดหมดแล้ว ไปจัดการมันให้ป้าทีสัก 10 ตัว",
    steps: [{ goal: kill("iron_crab", 10), to: JAMPEE, task: "ปราบปูก้ามเหล็กที่ป่าชายเลน", say: "ป้าออกเรือได้อีกแล้ว เอานี่ไป ยาดีจากเจ๊กิมหงษ์เลยนะ" }],
    reward: { gold: 2500, xp: 9000, items: [["potion_red_big", 5]] } },
  { id: "yo_ghost_ship", name: "เรือผีแห่งป่าชายเลน", giver: PRATEEP, level: 40,
    offer: "ทุกคืนข้าเห็นแสงเขียวจากเรือผีที่ป่าชายเลน โจรสลัดผีกับกัปตันของมันทำให้เรือของเราหลงทาง",
    steps: [
      { goal: kill("ghost_pirate", 3), to: PRATEEP, task: "ปราบโจรสลัดผีที่ป่าชายเลน", say: "แสงเขียวจางลงแล้ว แต่กัปตันของมันยังอยู่" },
      { goal: kill("ghost_captain", 1), to: PRATEEP, task: "ปราบกัปตันโจรสลัดผี (บอสป่าชายเลน)", say: "ประภาคารส่องทางได้อีกครั้ง เรือทุกลำจะกลับบ้านได้ ขอบใจเจ้ามาก" },
    ],
    reward: { gold: 10000, xp: 30000, points: 2 } },

  // ---- Osaki: the island ----
  { id: "os_lanterns", name: "โคมที่หลงทาง", giver: RYOKAN, level: 54,
    offer: "วิญญาณโคมกระดาษที่เนินซากุระคือโคมที่ถูกลืมในเทศกาล ช่วยปลดปล่อยพวกมันด้วยเถิด",
    steps: [
      { goal: kill("paper_lantern", 10), to: RYOKAN, task: "ปลดปล่อยวิญญาณโคมกระดาษที่เนินซากุระ", say: "ขอบใจ... อาโออิช่างทำโคมรู้วิธีทำโคมใหม่ให้วิญญาณได้พัก ไปหาเธอเถิด" },
      { goal: talk, to: AOI, task: "ไปหาอาโออิ ช่างทำโคม", say: "โคมใหม่ต้องใช้หางจิ้งจอกเก้าหางเป็นไส้ ได้ยินว่ามันซ่อนอยู่ที่เนินซากุระ" },
      { goal: collect("fox_tail", 1, "nine_tail_fox", 1), to: AOI, task: "นำหางจิ้งจอกเก้าหางมาให้อาโออิ (จากจิ้งจอกเก้าหาง เนินซากุระ)", say: "โคมดวงนี้จะนำทางวิญญาณทั้งหมดกลับบ้าน ขอบคุณนะคะ" },
    ],
    reward: { gold: 15000, xp: 45000, points: 2 } },
  { id: "os_tanuki", name: "ทานุกิขโมยสาเก", giver: TOKUBE, level: 45, repeat: 10,
    offer: "ทานุกิแปลงกายมาขโมยสาเกในโรงเหล้าทุกคืน! ไล่มันไปสัก 8 ตัวเถอะ",
    steps: [{ goal: kill("tanuki", 8), to: TOKUBE, task: "ปราบทานุกิแปลงกายที่เนินซากุระ", say: "ไหสาเกปลอดภัยแล้ว นี่ค่าจ้าง กับสาเกหนึ่งจอก... ล้อเล่น เงินดีกว่า" }],
    reward: { gold: 3000, xp: 11000 } },

  // ---- second jobs: one master each, level 30; the last hand-in picks the branch ----
  { id: "job_ranger", name: "บททดสอบนายพราน", giver: TEMUR, level: 30, job: "ranger",
    offer: "อยากเป็นนายพรานงั้นหรือ ต้องเป็นนักธนูหรือนักรบ เลเวล 30 ขึ้นไป แล้วพิสูจน์ฝีมือการล่าให้ข้าดู",
    steps: [
      { goal: kill("horned_hare", 10), to: TEMUR, task: "ล่ากระต่ายเขาเดียว 10 ตัวที่สเตปป์ตะวันตก", say: "ไวพอใช้ได้ ไปขอพรจากหัวหน้าเผ่าบาตูก่อน นายพรานทุกคนต้องได้รับพรจากเขา" },
      { goal: talk, to: BATU, task: "ไปรับพรจากหัวหน้าเผ่าบาตู", say: "เตมูร์ส่งเจ้ามาหรือ ขอให้สายลมแห่งทุ่งหญ้านำทางเจ้า กลับไปหาเขาได้แล้ว" },
      { goal: talk, to: TEMUR, task: "กลับไปหานายพรานเตมูร์ แล้วเลือกสายของนายพราน", say: "ตั้งแต่วันนี้ เจ้าคือนายพรานแห่งทรุนราดา" },
    ],
    reward: { gold: 3000, xp: 8000, items: [["potion_red", 10]] } },
  { id: "job_swordsman", name: "บททดสอบนักดาบ", giver: LEON, level: 30, job: "swordsman",
    offer: "ดาบไม่เลือกว่าเจ้ามาจากอาชีพไหน ขอแค่เลเวล 30 ขึ้นไป ไปพิสูจน์คมดาบของเจ้าที่เชิงเขาหิมะ",
    steps: [
      { goal: kill("snow_wolf", 10), to: LEON, task: "ปราบหมาป่าหิมะ 10 ตัวที่เชิงเขาหิมะ", say: "ไม่เลว ไปหาเซอร์ไรน์ฮาร์ทที่ป้อม เขาจะรับรองฝีมือเจ้า" },
      { goal: talk, to: REINHARDT, task: "ไปให้เซอร์ไรน์ฮาร์ทรับรองฝีมือ", say: "ข้าเห็นแววตาของนักดาบในตัวเจ้า กลับไปบอกลีออนว่าข้ารับรอง" },
      { goal: talk, to: LEON, task: "กลับไปหาปรมาจารย์ลีออน แล้วเลือกสายของนักดาบ", say: "จงใช้ดาบปกป้องผู้อื่น ไม่ใช่เพื่อโอ้อวด" },
    ],
    reward: { gold: 3000, xp: 8000, items: [["potion_red", 10]] } },
  { id: "job_wizard", name: "บททดสอบจอมเวท", giver: ZAHARA, level: 30, job: "wizard",
    offer: "เวทขั้นสูงไม่ใช่ของทุกคน ต้องเป็นนักเวทหรือนักบวช เลเวล 30 ขึ้นไป ไปปราบมัมมี่ในทะเลทรายใหญ่ให้ข้าดูก่อน",
    steps: [
      { goal: kill("mummy_slave", 10), to: ZAHARA, task: "ปราบมัมมี่ทาส 10 ตัวที่ทะเลทรายใหญ่", say: "พลังเวทของเจ้าใช้ได้ ไปฟังเรื่องเล่าเวทโบราณจากท่านนาดีมก่อน" },
      { goal: talk, to: NADEEM, task: "ไปฟังตำนานเวทโบราณจากท่านนาดีม", say: "ครั้งหนึ่งจอมเวทเคยหยุดพายุทรายได้ด้วยมือเปล่า... ไปเถิด ซาฮาร่ารอเจ้าอยู่" },
      { goal: talk, to: ZAHARA, task: "กลับไปหาจอมเวทซาฮาร่า แล้วเลือกสายของจอมเวท", say: "ยินดีต้อนรับสู่วงจอมเวท จงใช้พลังด้วยปัญญา" },
    ],
    reward: { gold: 3000, xp: 8000, items: [["potion_blue", 10]] } },
  { id: "job_bishop", name: "บททดสอบบาทหลวง", giver: CELESTE, level: 30, job: "bishop",
    offer: "บาทหลวงต้องเป็นนักบวชที่เลเวล 30 ขึ้นไป ไปชำระวิญญาณมัมมี่ที่ทะเลทรายใหญ่ให้สงบเสียก่อน",
    steps: [
      { goal: kill("mummy_slave", 8), to: CELESTE, task: "ชำระมัมมี่ทาส 8 ตัวที่ทะเลทรายใหญ่", say: "วิญญาณเหล่านั้นสงบแล้ว ไปรับพรจากซิสเตอร์มาเรียที่สี่แยกกลางเมือง" },
      { goal: talk, to: MARIA, task: "ไปรับพรจากซิสเตอร์มาเรีย", say: "แสงศักดิ์สิทธิ์จงอยู่กับท่าน กลับไปหามารดาเซเลสต์เถิด" },
      { goal: talk, to: CELESTE, task: "กลับไปหามารดาเซเลสต์ แล้วเลือกสายของบาทหลวง", say: "จงเป็นแสงสว่างให้ผู้ที่หลงทาง" },
    ],
    reward: { gold: 3000, xp: 8000, items: [["potion_blue", 10]] } },
  { id: "job_battlemage", name: "บททดสอบจอมเวทนักสู้", giver: KENSHIN, level: 30, job: "battlemage",
    offer: "ดาบและเวทเรียนได้ทุกคน ขอแค่เลเวล 30 ขึ้นไป ไปปราบปูก้ามเหล็กที่ชายฝั่งป่าชายเลน เปลือกแข็งของมันจะสอนให้เจ้าใช้ทั้งดาบและเวท",
    steps: [
      { goal: kill("iron_crab", 10), to: KENSHIN, task: "ปราบปูก้ามเหล็ก 10 ตัวที่ชายฝั่งป่าชายเลน", say: "เจ้าเริ่มเข้าใจแล้ว ไปนั่งสมาธิกับหลวงพี่เรียวคังที่วัดสักครู่" },
      { goal: talk, to: RYOKAN, task: "ไปนั่งสมาธิกับหลวงพี่เรียวคัง", say: "ใจนิ่ง ดาบจึงนิ่ง เวทจึงคม กลับไปหาอาจารย์เคนชินเถิด" },
      { goal: talk, to: KENSHIN, task: "กลับไปหาอาจารย์เคนชิน แล้วเลือกสายของจอมเวทนักสู้", say: "ดาบในมือ เวทในใจ เจ้าคือจอมเวทนักสู้แล้ว" },
    ],
    reward: { gold: 3000, xp: 8000, items: [["potion_red", 5], ["potion_blue", 5]] } },
  { id: "job_warlord", name: "บททดสอบนักรบคลั่ง", giver: RAGNAR, level: 30, job: "warlord",
    offer: "ความคลั่งเป็นของนักรบเท่านั้น เลเวล 30 ขึ้นไป ไปล้มแพะภูเขาที่เชิงเขาหิมะให้ข้าดูว่าเลือดเจ้าร้อนพอ",
    steps: [
      { goal: kill("ram_goat", 12), to: RAGNAR, task: "ล้มแพะภูเขาเขาวง 12 ตัวที่เชิงเขาหิมะ", say: "ฮ่า! เลือดเจ้าร้อนดี ไปให้ผู้เฒ่าทอร์วัลด์ดูหน้าก่อน เขาไม่ชอบคนบ้าเลือดนัก" },
      { goal: talk, to: TORVALD, task: "ไปพบผู้เฒ่าทอร์วัลด์ที่โถงใหญ่", say: "ความคลั่งที่ไร้ใจคุมคือหายนะ จำไว้ แล้วกลับไปหาราโกนาร์เถิด" },
      { goal: talk, to: RAGNAR, task: "กลับไปหาราโกนาร์ แล้วเลือกสายของนักรบคลั่ง", say: "สนามรบรอเจ้าอยู่ นักรบคลั่ง!" },
    ],
    reward: { gold: 3000, xp: 8000, items: [["potion_red", 10]] } },
];

export const QUEST_BY_ID: Record<string, QuestDef> = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

interface Active {
  step: number;
  n: number; // kills so far (kill steps)
}

interface QuestSave {
  active: Record<string, Active>;
  done: Record<string, number>; // times finished
  next: Record<string, number>; // epoch ms a repeatable one may be taken again
}

// What the quests need from the game: the bag, the level, and who pays the rewards.
export interface QuestDeps {
  count(item: string): number;
  take(item: string, n: number): void;
  give(item: string, n: number): void;
  level(): number;
  reward(r: Reward, q: QuestDef): void;
  note(text: string): void; // a line over the player ("สไลม์เขียว 3/5")
  jobBlock(job: JobId): string | null;            // why the player can't take a job, or null
  takeJob(job: JobId, branch: string): boolean;   // take it with that branch
}

export class Quests {
  s: QuestSave = { active: {}, done: {}, next: {} };
  deps: QuestDeps;
  listeners = new Set<() => void>();
  private key = saveKey("quests.v1");

  constructor(deps: QuestDeps) {
    this.deps = deps;
    this.load();
  }

  onChange(fn: () => void): void {
    this.listeners.add(fn);
  }

  changed(): void {
    this.save();
    for (const fn of this.listeners) fn();
  }

  // ---- what can be done ----
  isActive(id: string): boolean {
    return !!this.s.active[id];
  }

  timesDone(id: string): number {
    return this.s.done[id] ?? 0;
  }

  // ms until a repeatable one can be taken again (0: now)
  wait(id: string): number {
    return Math.max(0, (this.s.next[id] ?? 0) - Date.now());
  }

  // Whether its giver offers it now (and why not, for the log).
  why(q: QuestDef): string | null {
    if (this.isActive(q.id)) return "กำลังทำอยู่";
    if (!q.repeat && this.timesDone(q.id)) return "ทำสำเร็จแล้ว";
    if (q.repeat && this.wait(q.id) > 0) return `รับได้อีกใน ${Math.ceil(this.wait(q.id) / 60000)} นาที`;
    if ((q.level ?? 1) > this.deps.level()) return `ต้องเลเวล ${q.level}`;
    if (q.job) {
      const no = this.deps.jobBlock(q.job);
      if (no) return no;
    }
    const missing = (q.after ?? []).filter((a) => !this.timesDone(a));
    if (missing.length) return `ต้องทำ "${missing.map((a) => QUEST_BY_ID[a]?.name ?? a).join(", ")}" ก่อน`;
    return null;
  }

  available(q: QuestDef): boolean {
    return !this.why(q);
  }

  step(id: string): Step | null {
    const a = this.s.active[id];
    return a ? QUEST_BY_ID[id].steps[a.step] ?? null : null;
  }

  // How far the current step's goal has got: have of need.
  progress(id: string): { have: number; need: number } {
    const a = this.s.active[id], st = this.step(id);
    if (!a || !st) return { have: 0, need: 1 };
    const g = st.goal;
    switch (g.kind) {
      case "kill": return { have: Math.min(a.n, g.count), need: g.count };
      case "collect": return { have: Math.min(this.deps.count(g.item), g.count), need: g.count };
      case "level": return { have: Math.min(this.deps.level(), g.level), need: g.level };
      case "visit": return { have: a.n ? 1 : 0, need: 1 };
      case "talk": return { have: 1, need: 1 };
    }
  }

  // The current step's goal is met (it only waits to be handed in).
  ready(id: string): boolean {
    const p = this.progress(id);
    return this.isActive(id) && p.have >= p.need;
  }

  // ---- townsfolk ----
  private is(w: Who, map: MapId, npc: string): boolean {
    return w.map === map && w.npc === npc;
  }

  // What a townsperson has: quests to offer, steps to hand in to them, ones under way they gave,
  // and the job quests they would give once the player qualifies (to tell what it takes).
  optionsFor(map: MapId, npc: string): { offers: QuestDef[]; ready: QuestDef[]; busy: QuestDef[]; locked: QuestDef[] } {
    const offers = QUESTS.filter((q) => this.is(q.giver, map, npc) && this.available(q));
    const locked = QUESTS.filter((q) => q.job && this.is(q.giver, map, npc) && !this.isActive(q.id) && !this.timesDone(q.id) && !this.available(q));
    const ready: QuestDef[] = [], busy: QuestDef[] = [];
    for (const id of Object.keys(this.s.active)) {
      const q = QUEST_BY_ID[id], st = this.step(id);
      if (!q || !st) continue;
      if (this.is(st.to, map, npc) && st.goal.kind !== "visit") (this.ready(id) ? ready : busy).push(q);
      else if (this.is(q.giver, map, npc)) busy.push(q);
    }
    return { offers, ready, busy, locked };
  }

  // ---- doing them ----
  accept(id: string): boolean {
    const q = QUEST_BY_ID[id];
    if (!q || !this.available(q)) return false;
    const a = this.s.active[id] = { step: 0, n: 0 };
    this.begin(q, 0);
    this.deps.note(`รับเควส: ${q.name}`);
    // a first step to go where the player already stands is done at once
    const g = q.steps[0].goal;
    if (g.kind === "visit" && g.map === this.visited) this.advance(q, a);
    this.changed();
    return true;
  }

  private begin(q: QuestDef, i: number): void {
    for (const [item, n] of q.steps[i].gives ?? []) this.deps.give(item, n);
  }

  // Hand the current step in to its `to` (the caller checked who it is): the next step, or the
  // reward at the end. Returns what they say.
  // Hand in the current step; the last step of a job quest takes the branch picked (null when it
  // can't be handed in, or the job can't be taken).
  handIn(id: string, branch?: string): string | null {
    const q = QUEST_BY_ID[id], a = this.s.active[id], st = this.step(id);
    if (!q || !a || !st || !this.ready(id)) return null;
    const last = a.step === q.steps.length - 1;
    if (q.job && last && (!branch || this.deps.jobBlock(q.job) || !this.deps.takeJob(q.job, branch))) return null;
    if (st.goal.kind === "collect") this.deps.take(st.goal.item, st.goal.count);
    for (const [item, n] of st.takes ?? []) this.deps.take(item, Math.min(n, this.deps.count(item)));
    this.advance(q, a);
    return st.say;
  }

  // On to the next step (visit steps pass by themselves), or finished.
  private advance(q: QuestDef, a: Active): void {
    a.step++;
    a.n = 0;
    while (a.step < q.steps.length && q.steps[a.step].goal.kind === "visit" && this.visited === (q.steps[a.step].goal as { map: MapId }).map) a.step++;
    if (a.step >= q.steps.length) return this.finish(q);
    this.begin(q, a.step);
    this.deps.note(q.steps[a.step].task);
    this.changed();
  }

  private finish(q: QuestDef): void {
    delete this.s.active[q.id];
    this.s.done[q.id] = this.timesDone(q.id) + 1;
    if (q.repeat) this.s.next[q.id] = Date.now() + q.repeat * 60000;
    this.deps.reward(q.reward, q);
    this.changed();
  }

  abandon(id: string): void {
    const q = QUEST_BY_ID[id];
    if (!q || !this.isActive(id)) return;
    // what it handed over to carry goes back
    for (const st of q.steps) for (const [item] of st.gives ?? []) this.deps.take(item, this.deps.count(item));
    delete this.s.active[id];
    this.deps.note(`ยกเลิกเควส: ${q.name}`);
    this.changed();
  }

  // ---- what happens in the world ----
  onKill(monster: string, name: string): void {
    let any = false;
    for (const [id, a] of Object.entries(this.s.active)) {
      const g = this.step(id)?.goal;
      if (g?.kind !== "kill" || !g.what.includes(monster) || a.n >= g.count) continue;
      a.n++;
      any = true;
      this.deps.note(`${name} ${a.n}/${g.count}${a.n >= g.count ? " ครบแล้ว" : ""}`);
    }
    if (any) this.changed();
  }

  visited: MapId | null = null;
  onEnter(map: MapId): void {
    this.visited = map;
    let any = false;
    for (const [id, a] of Object.entries(this.s.active)) {
      const g = this.step(id)?.goal;
      if (g?.kind !== "visit" || g.map !== map) continue;
      any = true;
      this.advance(QUEST_BY_ID[id], a);
    }
    if (any) this.changed();
  }

  // An item picked up or used: the log and tracker may change (collect steps count the bag).
  onBag(): void {
    for (const fn of this.listeners) fn();
  }

  // Items a monster drops for the quests that want them (only while they still do).
  drops(monster: string): [string, number][] {
    const out: [string, number][] = [];
    for (const id of Object.keys(this.s.active)) {
      const g = this.step(id)?.goal;
      if (g?.kind === "collect" && g.from?.includes(monster) && this.deps.count(g.item) < g.count) out.push([g.item, g.chance ?? 0.5]);
    }
    return out;
  }

  // ---- saving ----
  save(): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.s));
    } catch {
      // not kept
    }
  }

  load(): void {
    try {
      const d = JSON.parse(localStorage.getItem(this.key) || "null") as QuestSave | null;
      if (!d) return;
      // quests that no longer exist, or a step past the end, are dropped
      for (const [id, a] of Object.entries(d.active ?? {})) if (QUEST_BY_ID[id] && a.step < QUEST_BY_ID[id].steps.length) this.s.active[id] = { step: a.step | 0, n: a.n | 0 };
      this.s.done = d.done ?? {};
      this.s.next = d.next ?? {};
    } catch {
      // a fresh log
    }
  }
}

// A reward as one line ("500 ทอง · 800 EXP · แต้มสกิล +1 · ยาแดง ×5").
export function rewardText(r: Reward, itemName: (id: string) => string): string {
  const parts: string[] = [];
  if (r.gold) parts.push(`${r.gold.toLocaleString()} ทอง`);
  if (r.xp) parts.push(`${r.xp.toLocaleString()} EXP`);
  if (r.points) parts.push(`แต้มสกิล +${r.points}`);
  for (const [id, n] of r.items ?? []) parts.push(`${itemName(id)}${n > 1 ? ` ×${n}` : ""}`);
  return parts.join(" · ");
}

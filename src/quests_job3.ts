// The third jobs' quests: one a job, from its master (src/jobmasters.ts), offered from level 60
// (THIRD_JOB_LEVEL) to whoever holds one of the second jobs it takes (progression.ts JOBS3). Like
// the second jobs' quests: a task that fits the job, a word with someone of the town, and back to
// the master, who tells of the branches and lets the player pick one at the hand-in. A job whose
// branches are still stubs shows here as "not yet" (Progress.job3Block). quests.ts adds these to
// the quest list; the tree writers can tune them here without touching it.

import { ITEMS } from "./items";
import { THIRD_JOB_LEVEL } from "./progression";
import type { MapId } from "./maps";
import type { Goal, QuestDef, Who } from "./quests";

const W = (map: MapId, npc: string, name: string): Who => ({ map, npc, name });
const kill = (what: string, count: number): Goal => ({ kind: "kill", what: [what], count });
const collect = (item: string, count: number, from: string, chance = 0.4): Goal => ({ kind: "collect", item, count, from: [from], chance });
const talk: Goal = { kind: "talk" };
const visit = (map: MapId): Goal => ({ kind: "visit", map });

// the masters (src/jobmasters.ts)
const GAWAIN = W("eden", "job3_knight", "เซอร์กาเวน"), SOPHIA = W("eden", "job3_high_bishop", "มหาบาทหลวงโซฟีอา");
const MERLINDA = W("kradia", "job3_archmage", "จอมเวทเมอร์ลินดา"), KAIUS = W("kradia", "job3_spellblade", "ไคอัสดาบมิติ");
const BORJIGIN = W("trunrada", "job3_hunter", "บอร์จิกินนักล่า"), TENGIS = W("trunrada", "job3_historian", "ผู้เฒ่าเทงกิส");
const NAMELESS = W("yodia", "job3_assassin", "เงาไร้นาม");
const JIKAKU = W("osaki", "job3_monk", "หลวงพ่อจิกากุ"), HANZO = W("osaki", "job3_shinobi", "ฮันโซเงาจันทร์");
const ULF = W("iceberg", "job3_sculptor", "อูลฟ์ช่างสลัก"), SAFIR = W("bahamas", "job3_magician", "ซาฟีร์นักมายากล");
// and the townsfolk they send the player to (the towns' own)
const ROLAND = W("eden", "guard_n1", "ทหารยามโรแลนด์"), CELESTE = W("eden", "job_bishop", "มารดาเซเลสต์");
const GRISELDA = W("kradia", "kradia_witch", "ยายกริเซลดา"), LEON = W("kradia", "job_swordsman", "ปรมาจารย์ลีออน");
const TEMUR = W("trunrada", "job_ranger", "นายพรานเตมูร์"), BATU = W("trunrada", "trunrada_chief", "หัวหน้าเผ่าบาตู");
const RAWEE = W("yodia", "job_thief", "ราวีจิ้งจอกเงา"), RYOKAN = W("osaki", "osaki_monk", "หลวงพี่เรียวคัง");
const AOI = W("osaki", "osaki_aoi", "อาโออิ"), BJORN = W("iceberg", "ice_smith", "บียอร์น"), NADEEM = W("bahamas", "bh_story", "ท่านนาดีม");

// What the quests ask to bring: quest items, dropped only while the step is on.
// (its picture, when drawn, is assets/skills/<id>.png like the other items')
const questItem = (id: string, name: string, glyph: string, color: string, note: string) =>
  ({ kind: "material" as const, name, stack: 99, sell: 1, icon: { glyph, color, art: id }, note: `${note}<br>ของเควส` });
Object.assign(ITEMS, {
  druid_tablet: questItem("druid_tablet", "แผ่นศิลาจารึกดรูอิด", "scroll", "#b8a878", "แผ่นหินสลักอักษรโบราณที่วิญญาณดรูอิดเฝ้าไว้"),
});

const REWARD = { gold: 8000, xp: 30000 };

export const JOB3_QUESTS: QuestDef[] = [
  { id: "job3_knight", name: "บททดสอบอัศวิน", giver: GAWAIN, level: THIRD_JOB_LEVEL, job3: "knight",
    offer: "อัศวินคือโล่ของอาณาจักร นักดาบ นักรบคลั่ง หรือทหารรับจ้างที่เลเวล 75 ขึ้นไปเท่านั้นที่ข้ารับ ไปล้มผู้พิทักษ์หินตั้งที่ที่ราบหินโบราณ พวกมันแข็งเหมือนกำแพงที่เจ้าต้องฝ่า",
    steps: [
      { goal: kill("menhir_warden", 10), to: GAWAIN, task: "ล้มผู้พิทักษ์หินตั้ง 10 ตัวที่ที่ราบหินโบราณ", say: "แขนเจ้ายังไม่สั่นเลยหรือ ดี ไปรายงานตัวกับทหารยามโรแลนด์ที่ประตูเหนือ อัศวินต้องรู้จักคนที่เฝ้าเมืองเคียงข้าง" },
      { goal: talk, to: ROLAND, task: "ไปรายงานตัวกับทหารยามโรแลนด์ที่ประตูเหนือ", say: "อัศวินคนใหม่หรือ! ประตูนี้ฝากชีวิตไว้กับคนอย่างเจ้า กลับไปหาเซอร์กาเวนเถิด" },
      { goal: talk, to: GAWAIN, task: "กลับไปหาเซอร์กาเวน แล้วเลือกสายของอัศวิน", say: "คุกเข่าลง... ลุกขึ้นเถิด อัศวินแห่งอีเดน" },
    ],
    reward: { ...REWARD, items: [["potion_red_big", 10]] } },
  { id: "job3_high_bishop", name: "บททดสอบบาทหลวงชั้นสูง", giver: SOPHIA, level: THIRD_JOB_LEVEL, job3: "high_bishop",
    offer: "บาทหลวงที่เลเวล 75 ขึ้นไปผู้ศรัทธาไม่สั่นคลอน วิญญาณคนเลี้ยงม้ายังเร่ร่อนอยู่ที่ทุ่งเลี้ยงม้า ไปส่งพวกเขาสู่ความสงบ",
    steps: [
      { goal: kill("ghost_rancher", 12), to: SOPHIA, task: "ส่งวิญญาณผีคนเลี้ยงม้า 12 ดวงสู่ความสงบที่ทุ่งเลี้ยงม้า", say: "แสงของเจ้าสว่างพอ ไปขอพรจากมารดาเซเลสต์ นางเป็นผู้นำทางเจ้ามาตั้งแต่แรก" },
      { goal: talk, to: CELESTE, task: "ไปขอพรจากมารดาเซเลสต์", say: "ลูกเติบโตขึ้นมากแล้ว แสงศักดิ์สิทธิ์จงนำทาง กลับไปหาท่านมหาบาทหลวงเถิด" },
      { goal: talk, to: SOPHIA, task: "กลับไปหามหาบาทหลวงโซฟีอา แล้วเลือกสายของบาทหลวงชั้นสูง", say: "จงเป็นทั้งพรและดาบของศรัทธา บาทหลวงชั้นสูง" },
    ],
    reward: { ...REWARD, items: [["potion_blue_big", 10]] } },
  { id: "job3_archmage", name: "บททดสอบจอมเวทชั้นสูง", giver: MERLINDA, level: THIRD_JOB_LEVEL, job3: "archmage",
    offer: "หอเวทรับเฉพาะจอมเวท จอมเวทนักสู้ นักประดิษฐ์ หรือตัวตลกที่เลเวล 75 ขึ้นไป ไปปราบซาลาแมนเดอร์ลาวาที่ยอดภูเขาไฟ ไฟของมันจะบอกว่าเวทเจ้าแท้หรือไม่",
    steps: [
      { goal: kill("lava_salamander", 10), to: MERLINDA, task: "ปราบซาลาแมนเดอร์ลาวา 10 ตัวที่ยอดภูเขาไฟ", say: "เวทของเจ้าไม่ละลายในไฟ ไปให้ยายกริเซลดาดูหน่อย นางรู้จักเวททุกสายในคราเดีย" },
      { goal: talk, to: GRISELDA, task: "ไปให้ยายกริเซลดาดูพลังเวท", say: "หึ ๆ ไม่เลว ไม่เลวเลย บอกยัยเมอร์ลินดาว่ายายรับรอง" },
      { goal: talk, to: MERLINDA, task: "กลับไปหาจอมเวทเมอร์ลินดา แล้วเลือกสายของจอมเวทชั้นสูง", say: "ยินดีต้อนรับสู่หอเวทชั้นบน จอมเวทชั้นสูง" },
    ],
    reward: { ...REWARD, items: [["potion_blue_big", 10]] } },
  { id: "job3_spellblade", name: "บททดสอบจอมเวทนักสู้ขั้นสูง", giver: KAIUS, level: THIRD_JOB_LEVEL, job3: "spellblade",
    offer: "จอมเวทนักสู้ จอมเวท หรือนักดาบที่เลเวล 75 ขึ้นไป อิมป์เงาที่ป่าชายแดนเดินทางผ่านรอยแยกมิติได้ ไปฟันมันให้ได้ทั้งตัวและเงา",
    steps: [
      { goal: kill("shadow_imp", 12), to: KAIUS, task: "ปราบอิมป์เงา 12 ตัวที่ป่าชายแดน", say: "เจ้าฟันโดนเงาได้แล้ว ไปให้ปรมาจารย์ลีออนลองดาบสักกระบวน" },
      { goal: talk, to: LEON, task: "ไปลองดาบกับปรมาจารย์ลีออน", say: "ดาบเจ้ามีเวทแฝงอยู่ น่าสนใจ ไปบอกไคอัสว่าข้ายอมรับ" },
      { goal: talk, to: KAIUS, task: "กลับไปหาไคอัสดาบมิติ แล้วเลือกสายของจอมเวทนักสู้ขั้นสูง", say: "ดาบและเวทเป็นหนึ่งเดียวในตัวเจ้าแล้ว" },
    ],
    reward: { ...REWARD, items: [["potion_red_big", 5], ["potion_blue_big", 5]] } },
  { id: "job3_hunter", name: "บททดสอบนักล่า", giver: BORJIGIN, level: THIRD_JOB_LEVEL, job3: "hunter",
    offer: "นายพราน หัวขโมย ตัวตลก หรือทหารรับจ้างที่เลเวล 75 ขึ้นไป นักล่าตัวจริงตามรอยเหยื่อได้ทุกแห่ง ไปล่ากวางเขาแดงที่ป่าชายแดนมาให้ข้าดู",
    steps: [
      { goal: kill("crimson_stag", 10), to: BORJIGIN, task: "ล่ากวางเขาแดง 10 ตัวที่ป่าชายแดน", say: "รอยเท้าเจ้าเงียบดี ไปเล่าให้เตมูร์ฟัง เขาสอนข้ามาเหมือนที่สอนเจ้า" },
      { goal: talk, to: TEMUR, task: "ไปเล่าการล่าให้นายพรานเตมูร์ฟัง", say: "ลูกศิษย์ข้าโตแล้ว! หมาป่าของบอร์จิกินจะรู้จักกลิ่นเจ้า กลับไปเถิด" },
      { goal: talk, to: BORJIGIN, task: "กลับไปหาบอร์จิกินนักล่า แล้วเลือกสายของนักล่า", say: "ทุ่งหญ้าทั้งผืนคือป่าล่าของเจ้าแล้ว นักล่า" },
    ],
    reward: { ...REWARD, items: [["potion_red_big", 10]] } },
  { id: "job3_historian", name: "บททดสอบนักประวัติศาสตร์", giver: TENGIS, level: THIRD_JOB_LEVEL, job3: "historian",
    offer: "ใครก็ได้ที่มีอาชีพที่ 2 และเลเวล 75 ขึ้นไป ที่ราบหินโบราณมีจารึกที่เผ่าเราอ่านไม่ออก วิญญาณดรูอิดเฝ้ามันไว้ ไปดูด้วยตาตัวเองแล้วนำแผ่นจารึกมาให้ข้า",
    steps: [
      { goal: visit("stone_plain"), to: TENGIS, task: "ไปสำรวจที่ราบหินโบราณ", say: "" },
      { goal: collect("druid_tablet", 5, "druid_shade"), to: TENGIS, task: "นำแผ่นศิลาจารึก 5 แผ่นมา (จากวิญญาณดรูอิด ที่ราบหินโบราณ)", say: "อักษรพวกนี้เก่ากว่าเผ่าเราเสียอีก ไปเล่าให้หัวหน้าเผ่าบาตูฟังว่าเจ้าพบอะไร" },
      { goal: talk, to: BATU, task: "ไปเล่าเรื่องจารึกให้หัวหน้าเผ่าบาตูฟัง", say: "ประวัติของแผ่นดินนี้อยู่ในมือเจ้าแล้ว กลับไปหาผู้เฒ่าเทงกิสเถิด" },
      { goal: talk, to: TENGIS, task: "กลับไปหาผู้เฒ่าเทงกิส แล้วเลือกสายของนักประวัติศาสตร์", say: "จงบันทึกโลกนี้ให้คนรุ่นหลัง นักประวัติศาสตร์" },
    ],
    reward: { ...REWARD, items: [["potion_red_big", 5], ["potion_blue_big", 5]] } },
  { id: "job3_assassin", name: "บททดสอบนักฆ่า", giver: NAMELESS, level: THIRD_JOB_LEVEL, job3: "assassin",
    offer: "นายพราน หัวขโมย นักดาบ นักรบคลั่ง หรือทหารรับจ้างที่เลเวล 75 ขึ้นไป ทหารหนีทัพต้องสาปซ่อนอยู่ในป่าชายแดน กำจัดมันสองคนโดยไม่ให้ใครเห็น",
    steps: [
      { goal: kill("cursed_deserter", 2), to: NAMELESS, task: "กำจัดทหารหนีทัพต้องสาป 2 คนที่ป่าชายแดน", say: "เงียบและแม่น ไปหาราวี บอกเขาว่าเงาไร้นามส่งเจ้ามา" },
      { goal: talk, to: RAWEE, task: "ไปหาราวีจิ้งจอกเงา", say: "เงาไร้นาม... ข้านึกว่าเขาตายไปแล้ว รีบกลับไปเถอะ ก่อนข้าจะเปลี่ยนใจ" },
      { goal: talk, to: NAMELESS, task: "กลับไปหาเงาไร้นาม แล้วเลือกสายของนักฆ่า", say: "จากนี้เจ้าไม่มีชื่อ มีแต่เงา นักฆ่า" },
    ],
    reward: { ...REWARD, items: [["potion_red_big", 10]] } },
  { id: "job3_monk", name: "บททดสอบพระนักรบ", giver: JIKAKU, level: THIRD_JOB_LEVEL, job3: "monk",
    offer: "บาทหลวง จอมเวท จอมเวทนักสู้ หรือหัวขโมยที่เลเวล 75 ขึ้นไป วิญญาณโคมกระดาษที่เนินซากุระหลงทาง จงส่งพวกมันกลับด้วยมือเปล่าและใจที่นิ่ง",
    steps: [
      { goal: kill("paper_lantern", 10), to: JIKAKU, task: "ส่งวิญญาณโคมกระดาษ 10 ดวงกลับที่เนินซากุระ", say: "ใจเจ้านิ่งพอแล้ว ไปนั่งสมาธิกับเรียวคังสักครู่" },
      { goal: talk, to: RYOKAN, task: "ไปนั่งสมาธิกับหลวงพี่เรียวคัง", say: "ลมหายใจเดียวกับหมัด ใจเดียวกับธรรมชาติ กลับไปหาหลวงพ่อเถิด" },
      { goal: talk, to: JIKAKU, task: "กลับไปหาหลวงพ่อจิกากุ แล้วเลือกสายของพระนักรบ", say: "กายคือวัด หมัดคือบทสวด พระนักรบ" },
    ],
    reward: { ...REWARD, items: [["potion_red_big", 5], ["potion_blue_big", 5]] } },
  { id: "job3_shinobi", name: "บททดสอบชิโนบิ", giver: HANZO, level: THIRD_JOB_LEVEL, job3: "shinobi",
    offer: "ใครก็ได้ที่มีอาชีพที่ 2 และเลเวล 75 ขึ้นไป นินจาไผ่ที่เนินซากุระทรยศหมู่บ้าน ไปจัดการพวกมันให้ไวกว่าที่มันจะหนีทัน",
    steps: [
      { goal: kill("bamboo_ninja", 15), to: HANZO, task: "จัดการนินจาไผ่ 15 คนที่เนินซากุระ", say: "ไวพอใช้ ไปส่งข่าวให้อาโออิ เด็กคนนั้นคือหูตาของหมู่บ้าน" },
      { goal: talk, to: AOI, task: "ไปส่งข่าวให้อาโออิ", say: "รับทราบค่ะ! บอกท่านฮันโซว่าเส้นทางปลอดภัยแล้ว" },
      { goal: talk, to: HANZO, task: "กลับไปหาฮันโซเงาจันทร์ แล้วเลือกสายของชิโนบิ", say: "เงาแห่งจันทร์รับเจ้าแล้ว ชิโนบิ" },
    ],
    reward: { ...REWARD, items: [["potion_red_big", 10]] } },
  { id: "job3_sculptor", name: "บททดสอบนักประติมากรรม", giver: ULF, level: THIRD_JOB_LEVEL, job3: "sculptor",
    offer: "นักประดิษฐ์ที่เลเวล 75 ขึ้นไป ข้าสลักไม้และหินให้มีชีวิตได้ แต่ต้องใช้แกนน้ำแข็งที่ไม่ละลาย ไปเอาจากโกเลมน้ำแข็งที่ช่องเขามาให้ข้า",
    steps: [
      { goal: collect("ice_core", 5, "ice_golem"), to: ULF, task: "นำแกนน้ำแข็ง 5 แกนมา (จากโกเลมน้ำแข็ง ช่องเขาน้ำแข็ง)", say: "ยังเย็นเฉียบอยู่เลย เอาไปให้บียอร์นตีเป็นสิ่วให้ข้าที" },
      { goal: talk, to: BJORN, task: "ไปให้บียอร์นช่างตีเหล็กทำสิ่วจากแกนน้ำแข็ง", say: "สิ่วแกนน้ำแข็ง คมไม่มีวันทื่อ ฝากไปให้อูลฟ์ด้วย" },
      { goal: talk, to: ULF, task: "กลับไปหาอูลฟ์ช่างสลัก แล้วเลือกสายของนักประติมากรรม", say: "มือเจ้าปลุกไม้และหินให้ตื่นได้แล้ว นักประติมากรรม" },
    ],
    reward: { ...REWARD, items: [["potion_red_big", 5], ["potion_blue_big", 5]] } },
  { id: "job3_magician", name: "บททดสอบนักมายากล", giver: SAFIR, level: THIRD_JOB_LEVEL, job3: "magician",
    offer: "ใครก็ได้ที่มีอาชีพที่ 2 และเลเวล 75 ขึ้นไป จิ้งจอกเก้าหางที่เนินซากุระหลอกตาได้แนบเนียนกว่าข้า ไปเอาชนะมัน แล้วเราจะได้รู้ว่าใครคือนักมายากลตัวจริง",
    steps: [
      { goal: kill("nine_tail_fox", 1), to: SAFIR, task: "เอาชนะจิ้งจอกเก้าหางที่เนินซากุระ", say: "เจ้าไม่หลงกลมัน! ไปเล่าให้ท่านนาดีมฟัง เรื่องนี้ควรเป็นนิทานเล่าต่อ" },
      { goal: talk, to: NADEEM, task: "ไปเล่าเรื่องจิ้งจอกเก้าหางให้ท่านนาดีมฟัง", say: "เรื่องเล่าที่ดีที่สุดคือเรื่องที่เป็นจริง... กลับไปหาซาฟีร์เถิด" },
      { goal: talk, to: SAFIR, task: "กลับไปหาซาฟีร์นักมายากล แล้วเลือกสายของนักมายากล", say: "ม่านเปิดแล้ว! เวทีเป็นของเจ้า นักมายากล" },
    ],
    reward: { ...REWARD, items: [["potion_red_big", 5], ["potion_blue_big", 5]] } },
];

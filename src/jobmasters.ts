// The job masters who aren't a town's own people: the third and fourth jobs' masters and the
// merchant's (a second job of v0.5). The towns get them by this list instead of in their own files
// (src/world3d/town_*.ts belong to the towns), merged into a town's people when it loads (main.ts
// townsfolk). Each stands where its town's plan puts it, in that plan's pixels (u right, v down,
// as the town file reads them; Plan and TOWN_SCALE in src/world3d/town.ts), and faces a plan
// point; the palace has no plan, its file lays out its people in world centimetres before
// TOWN_SCALE, and so do its masters here. The spots were checked open and reachable from the
// town's way in (tools/town_check.cjs).
//
// Their quests are in src/quests_job3.ts and src/quests_job4.ts (the merchant's with the
// merchant's own); a job whose branches are still stubs isn't offered.

import { Plan, TOWN_SCALE } from "./world3d/town";
import type { NpcSpec } from "./npcs";

// Each town's plan: cm a pixel and the pixel at the world origin, as its town file has them (null:
// none, the spots are world centimetres).
const PLANS: Record<string, Plan | null> = {
  eden: new Plan(18, 625, 565),
  kradia: new Plan(28, 395, 410),
  trunrada: new Plan(27, 435, 440),
  yodia: new Plan(26, 425, 405),
  osaki: new Plan(20, 520, 450),
  iceberg: new Plan(28, 440, 400),
  bahamas: new Plan(26, 420, 420),
  noa: new Plan(20, 425, 367.5),
  suzhou: new Plan(20, 560, 325),
  highland: new Plan(26, 350, 350),
  venezia: new Plan(100, 112, 100),
  palace: null,
};

type UV = [number, number];
interface Master {
  town: string;
  at: UV;     // where it stands (plan pixels, or the palace's centimetres)
  look: UV;   // the point it faces
  spec: Omit<NpcSpec, "x" | "y" | "face">;
}

const male = (top: string, bottom: string, hairColor = "ink", eyes = "amber") => ({ gender: "male", hair: "", hairColor, eyes, top, bottom });
const female = (hair: string, hairColor: string, eyes: string, top: string, bottom: string) => ({ gender: "female", hair, hairColor, eyes, top, bottom });

// (the plan point each town's way in comes to, for those who face whoever arrives)
const EDEN_IN: UV = [787, 718], OSAKI_IN: UV = [240, 452], ICEBERG_IN: UV = [404, 418], BAHAMAS_IN: UV = [420, 352];

export const JOB_MASTERS: Master[] = [
  // ---- Eden: the knight on the square up the north road, the high bishop by the cathedral ----
  { town: "eden", at: [477.9, 202], look: EDEN_IN, spec: {
    id: "job3_knight", name: "เซอร์กาเวน", title: "อัศวินหลวง · เปลี่ยนอาชีพอัศวิน", role: "talk", look: male("top_warrior_navy", "bottom_warrior_black", "gold", "blue"),
    lines: ["ทุกเช้าข้าเดินตรวจถนนหลวงจากประตูเหนือ อัศวินต้องเห็นอาณาจักรด้วยตาตัวเอง", "นักดาบ นักรบคลั่ง หรือทหารรับจ้างที่เลเวล 60 แล้ว มาสาบานตนเป็นอัศวินกับข้าได้"] } },
  { town: "eden", at: [234.3, 259.7], look: EDEN_IN, spec: {
    id: "job3_high_bishop", name: "มหาบาทหลวงโซฟีอา", title: "มหาบาทหลวงแห่งมหาวิหาร · เปลี่ยนอาชีพบาทหลวงชั้นสูง", role: "talk",
    look: female("hime", "gold", "blue", "top_priestess_white", "bottom_priestess_white"),
    lines: ["ศรัทธาที่แท้ไม่ได้อยู่ในบทสวด แต่อยู่ในมือที่ยื่นไปช่วยผู้อื่น", "บาทหลวงที่เลเวล 60 แล้ว มหาวิหารพร้อมรับเจ้าเป็นบาทหลวงชั้นสูง"] } },
  // ---- Kradia: the archmage at the tower's door, the spellblade by the master of the sword ----
  { town: "kradia", at: [395, 441.5], look: [395, 470], spec: {
    id: "job3_archmage", name: "จอมเวทเมอร์ลินดา", title: "อาจารย์หอเวท · เปลี่ยนอาชีพจอมเวทชั้นสูง", role: "talk",
    look: female("hime", "violet", "violet", "top_priestess_black", "bottom_priestess_black"),
    lines: ["หอนี้เก็บเวทไว้ทุกธาตุ แม้แต่เวทโลหะที่ลืมกันไปแล้ว", "จอมเวท จอมเวทนักสู้ นักประดิษฐ์ หรือตัวตลกที่เลเวล 60 มาเรียนเวทชั้นสูงได้"] } },
  { town: "kradia", at: [291.6, 397.4], look: [395, 410], spec: {
    id: "job3_spellblade", name: "ไคอัสดาบมิติ", title: "ดาบเวทแห่งรอยแยก · เปลี่ยนอาชีพจอมเวทนักสู้ขั้นสูง", role: "talk", look: male("top_warrior_forest", "bottom_warrior_black", "violet", "violet"),
    lines: ["ดาบของข้าฟันได้ทั้งเนื้อและเงา", "จอมเวทนักสู้ จอมเวท หรือนักดาบที่เลเวล 60 ลองมาฟันมิติกับข้าดู"] } },
  // ---- Trunrada: the hunter by the master of the hunt, the historian by the chief ----
  { town: "trunrada", at: [465, 240.6], look: [455, 240.6], spec: {
    id: "job3_hunter", name: "บอร์จิกินนักล่า", title: "นักล่าแห่งสเตปป์ · เปลี่ยนอาชีพนักล่า", role: "talk", look: male("top_warrior_forest", "bottom_warrior_cocoa", "auburn", "amber"),
    lines: ["หมาป่าของข้าไม่เคยปล่อยเหยื่อหลุด", "นายพราน หัวขโมย ตัวตลก หรือทหารรับจ้างที่เลเวล 60 มาออกล่ากับข้า"] } },
  { town: "trunrada", at: [449, 265.5], look: [439, 265.5], spec: {
    id: "job3_historian", name: "ผู้เฒ่าเทงกิส", title: "ผู้บันทึกเผ่า · เปลี่ยนอาชีพนักประวัติศาสตร์", role: "talk", look: male("top_warrior_navy", "bottom_warrior_cocoa", "silver", "teal"),
    lines: ["ทุกก้อนหินบนทุ่งนี้มีเรื่องเล่า ถ้ารู้จักฟัง", "ใครก็ตามที่มีอาชีพที่ 2 และเลเวล 60 มาเรียนวิชาประวัติศาสตร์กับข้าได้"] } },
  // ---- Yodia: the assassin in the shadows by the thieves' master ----
  { town: "yodia", at: [266.5, 620.7], look: [256.5, 620.7], spec: {
    id: "job3_assassin", name: "เงาไร้นาม", title: "นักฆ่าไร้ชื่อ · เปลี่ยนอาชีพนักฆ่า", role: "talk", look: male("top_warrior_navy", "bottom_warrior_black", "ink", "violet"),
    lines: ["...", "นายพราน หัวขโมย นักดาบ นักรบคลั่ง หรือทหารรับจ้างที่เลเวล 60 ถ้าไม่กลัวเงา มาคุยกัน"] } },
  // ---- Osaki: the monk by the temple, the shinobi in the village ----
  { town: "osaki", at: [749.6, 260.4], look: OSAKI_IN, spec: {
    id: "job3_monk", name: "หลวงพ่อจิกากุ", title: "เจ้าอาวาส · เปลี่ยนอาชีพพระนักรบ", role: "talk", look: male("top_warrior_forest", "bottom_warrior_cocoa", "ink", "amber"),
    lines: ["หมัดที่ดีที่สุดคือหมัดที่ไม่ต้องปล่อย... แต่ถ้าต้องปล่อย ก็ปล่อยให้สุด", "บาทหลวง จอมเวท จอมเวทนักสู้ หรือหัวขโมยที่เลเวล 60 มาฝึกเป็นพระนักรบได้"] } },
  { town: "osaki", at: [513.6, 426.4], look: OSAKI_IN, spec: {
    id: "job3_shinobi", name: "ฮันโซเงาจันทร์", title: "หัวหน้านินจา · เปลี่ยนอาชีพชิโนบิ", role: "talk", look: male("top_warrior_navy", "bottom_warrior_black", "ink", "teal"),
    lines: ["เจ้าเห็นข้า เพราะข้าอยากให้เห็น", "ใครก็ตามที่มีอาชีพที่ 2 และเลเวล 60 มาเป็นชิโนบิแห่งเงาจันทร์ได้"] } },
  // ---- Iceberg: the sculptor by the smithy ----
  { town: "iceberg", at: [457.4, 432.6], look: ICEBERG_IN, spec: {
    id: "job3_sculptor", name: "อูลฟ์ช่างสลัก", title: "ช่างสลักน้ำแข็งและหิน · เปลี่ยนอาชีพนักประติมากรรม", role: "talk", look: male("top_warrior", "bottom_warrior_cocoa", "auburn", "blue"),
    lines: ["รูปสลักน้ำแข็งหน้าโถงใหญ่นั่นฝีมือข้าเอง", "นักประดิษฐ์ที่เลเวล 60 มาเรียนปลุกไม้และหินให้มีชีวิตกับข้า"] } },
  // ---- Bahamas: the magician by the storyteller ----
  { town: "bahamas", at: [304.6, 192.5], look: BAHAMAS_IN, spec: {
    id: "job3_magician", name: "ซาฟีร์นักมายากล", title: "นักมายากลแห่งโอเอซิส · เปลี่ยนอาชีพนักมายากล", role: "talk",
    look: female("twintail", "crimson", "amber", "top_adventurer_plum", "bottom_adventurer_black"),
    lines: ["เลือกไพ่มาหนึ่งใบ... อ๊ะ ไพ่ใบนั้นอยู่ในกระเป๋าเจ้าแล้ว", "ใครก็ตามที่มีอาชีพที่ 2 และเลเวล 60 มาขึ้นเวทีเป็นนักมายากลกับข้าได้"] } },

  // ---- the fourth jobs (docs/v05_jobs.md 3), level 90 ----
  // the palace: the high knight in the throne hall, by the king (world centimetres)
  { town: "palace", at: [4130, 1100], look: [3600, 0], spec: {
    id: "job4_high_knight", name: "เซอร์เพอร์ซิวาล", title: "ผู้ถือหอกหลวง · เปลี่ยนอาชีพอัศวินชั้นสูง", role: "talk", look: male("top_warrior_navy", "bottom_warrior_black", "gold", "blue"),
    lines: ["หอกเล่มนี้เคยเป็นของกษัตริย์องค์แรก ข้าเพียงถือมันไว้รอผู้ที่คู่ควร", "อัศวิน นักประติมากรรม ชิโนบิ หรือพระนักรบที่เลเวล 90 แล้ว มาถือหอกหลวงกับข้าได้"] } },
  // Venezia: the sniper by the column on the waterfront of the piazzetta
  { town: "venezia", at: [140, 153], look: [140, 170], spec: {
    id: "job4_sniper", name: "เชซาเรตาเหยี่ยว", title: "มือปืนแห่งลากูน · เปลี่ยนอาชีพสไนเปอร์", role: "talk", look: male("top_warrior_forest", "bottom_warrior_black", "ink", "amber"),
    lines: ["นกนางนวลบนยอดเสากระโดงตัวนั้น... ปัง! เห็นไหม ไม่ต้องเล็งนาน", "นักล่า นักฆ่า หรือชิโนบิที่เลเวล 90 แล้ว มาลองจับปืนหรือธนูกับข้าดู"] } },
  // Kradia: the warlock on the tower's square
  { town: "kradia", at: [366, 364], look: [395, 410], spec: {
    id: "job4_warlock", name: "พ่อมดโวลันด์", title: "พ่อมดแห่งหอคอยดำ · เปลี่ยนอาชีพพ่อมด", role: "talk", look: male("top_warrior_navy", "bottom_warrior_black", "silver", "violet"),
    lines: ["ลูกแก้วสามลูกนี้คือไฟ น้ำแข็ง และสายฟ้า ผสมให้ถูกก็เป็นเวทที่ไม่มีตำราไหนเขียน", "จอมเวทชั้นสูง บาทหลวงชั้นสูง จอมเวทนักสู้ขั้นสูง หรือนักประวัติศาสตร์ที่เลเวล 90 แล้ว มาเป็นพ่อมดกับข้า"] } },
  // Highland Hill: the druid on the square, by the way to the east gate
  { town: "highland", at: [405, 380], look: [340, 382], spec: {
    id: "job4_druid", name: "ดรูอิดบริจิด", title: "ผู้พิทักษ์ป่าโบราณ · เปลี่ยนอาชีพดรูอิด", role: "talk",
    look: female("wavy", "auburn", "teal", "top_priestess_forest", "bottom_priestess_forest"),
    lines: ["หมีบนเขา นกบนฟ้า กวางในป่า... ข้าเคยเป็นมาแล้วทุกอย่าง", "จอมเวทชั้นสูง บาทหลวงชั้นสูง พระนักรบ หรือนักมายากลที่เลเวล 90 แล้ว มาฟังเสียงของป่ากับข้า"] } },
  // Yodia: the slayer in the lane by the fish market, the shaman among the huts of the forest
  // village
  { town: "yodia", at: [308, 560], look: [266.5, 600], spec: {
    id: "job4_slayer", name: "พรายกระซิบ", title: "มือสังหารไร้เงา · เปลี่ยนอาชีพมือสังหาร", role: "talk", look: male("top_warrior_navy", "bottom_warrior_black", "ink", "crimson"),
    lines: ["เจ้าได้ยินเสียงข้า แต่หาข้าไม่เจอ ใช่ไหมล่ะ", "นักฆ่าหรือชิโนบิที่เลเวล 90 แล้ว ถ้าอยากเป็นความตายที่ไม่มีใครเห็น มาหาข้า"] } },
  { town: "yodia", at: [204, 283], look: [240, 300], spec: {
    id: "job4_shaman", name: "ปู่ทองดีหมอผี", title: "หมอผีแห่งป่าดิบใต้ · เปลี่ยนอาชีพหมอผี", role: "talk", look: male("top_warrior_forest", "bottom_warrior_cocoa", "silver", "amber"),
    lines: ["ผีป่าผีเรือนข้ารู้จักหมด บางตนยังมากินข้าวกับข้าทุกค่ำ", "ใครก็ตามที่มีอาชีพที่ 3 และเลเวล 90 แล้ว ถ้าใจไม่กลัวผี มาเรียนวิชากับปู่"] } },
  // Suzhou: the royal guard by the governor's mansion, the wuxia by the canal-side teahouse
  { town: "suzhou", at: [690, 296], look: [600, 330], spec: {
    id: "job4_royal_guard", name: "ผู้กองเหยียนหลง", title: "องครักษ์เสื้อแพร · เปลี่ยนอาชีพราชองครักษ์", role: "talk", look: male("top_warrior_navy", "bottom_warrior_black", "ink", "amber"),
    lines: ["องครักษ์เสื้อแพรไม่ได้เฝ้าแค่วัง แต่ตามล่าทุกคนที่คิดร้ายต่อแผ่นดิน", "อัศวินหรือจอมเวทนักสู้ขั้นสูงที่เลเวล 90 แล้ว มาสาบานเป็นองครักษ์กับข้า"] } },
  { town: "suzhou", at: [505, 330], look: [470, 305], spec: {
    id: "job4_wuxia", name: "ไป๋อวิ๋น", title: "จอมยุทธ์พเนจร · เปลี่ยนอาชีพจอมยุทธ์", role: "talk", look: female("ponytail", "ink", "teal", "top_white", "bottom_navy"),
    lines: ["กระบี่เล่มเดียว มืออีกข้างว่างไว้... เผื่อจับจอกชา", "ใครก็ตามที่มีอาชีพที่ 3 และเลเวล 90 แล้ว มาเดินบนเส้นทางยุทธภพกับข้า"] } },
  // Noa: the alchemist by the archives
  { town: "noa", at: [440, 298], look: [420, 367.5], spec: {
    id: "job4_alchemist", name: "อาจารย์เอเบอร์ฮาร์ท", title: "นักเล่นแร่แปรธาตุแห่งหอจดหมายเหตุ · เปลี่ยนอาชีพนักเล่นแร่แปรธาตุ", role: "talk", look: male("top_warrior_forest", "bottom_warrior_black", "silver", "teal"),
    lines: ["ตะกั่วเป็นทองยังไม่สำเร็จ แต่ทองเป็นระเบิดน่ะ สำเร็จมาหลายครั้งแล้ว", "ใครก็ตามที่มีอาชีพที่ 3 และเลเวล 90 แล้ว มาช่วยข้าทดลองได้"] } },
  // Iceberg: the viking on the quay by the boats
  { town: "iceberg", at: [606, 485], look: [660, 485], spec: {
    id: "job4_viking", name: "ยาร์ลทอร์สไตน์", title: "เจ้าแห่งทะเลเหนือ · เปลี่ยนอาชีพนักรบไวกิ้ง", role: "talk", look: male("top_warrior", "bottom_warrior_cocoa", "gold", "blue"),
    lines: ["เรือมังกรของข้าล่องมาแล้วทุกทะเล ยกเว้นทะเลที่ไม่มีศัตรู", "ใครก็ตามที่มีอาชีพที่ 3 และเลเวล 90 แล้ว ขึ้นเรือมากับข้า"] } },
  // Osaki: the samurai between the halls by the mountain gate
  { town: "osaki", at: [858, 645], look: [858, 600], spec: {
    id: "job4_samurai", name: "ท่านอิซึรุงิ", title: "ปรมาจารย์บูชิโด · เปลี่ยนอาชีพซามูไร", role: "talk", look: male("top_warrior_navy", "bottom_warrior_black", "silver", "amber"),
    lines: ["ดาบที่ไม่เคยออกจากฝัก คือดาบที่ชนะโดยไม่ต้องสู้", "ใครก็ตามที่มีอาชีพที่ 3 และเลเวล 90 แล้ว มาเดินตามวิถีบูชิโดกับข้า"] } },

  // ---- the merchant (a second job, level 30): by the old market at the crossroads of trade ----
  { town: "noa", at: [600, 425], look: [420, 418], spec: {
    id: "job_merchant", name: "นายห้างซาอีด", title: "นายห้างแห่งชุมทาง · เปลี่ยนอาชีพพ่อค้า", role: "talk", look: male("top_warrior", "bottom_warrior_cocoa", "ink", "amber"),
    lines: ["ของทุกชิ้นมีราคาของมัน ที่เหลือคือหาคนที่อยากได้มันที่สุดให้เจอ", "ใครก็ได้ที่เลเวล 30 แล้ว มาเรียนวิชาค้าขายและตั้งร้านของตัวเองกับข้า"] } },
];

// The masters standing in a map, in world centimetres (none: not a town of theirs).
export function jobMasters(map: string): NpcSpec[] {
  if (!(map in PLANS)) return [];
  const plan = PLANS[map];
  const P = (u: number, v: number): [number, number] => (plan ? plan.P(u, v) : [u, v]);
  return JOB_MASTERS.filter((m) => m.town === map).map((m) => {
    const [x, y] = P(m.at[0], m.at[1]), [lx, ly] = P(m.look[0], m.look[1]);
    return { ...m.spec, x: x * TOWN_SCALE, y: y * TOWN_SCALE, face: (Math.atan2(ly - y, lx - x) * 180) / Math.PI };
  });
}

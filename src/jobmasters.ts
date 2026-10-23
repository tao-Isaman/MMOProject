// The third jobs' masters: extra townsfolk the towns get by this list instead of in their own
// files (src/world3d/town_*.ts belong to the towns), merged into a town's people when it loads
// (main.ts townsfolk). Each stands where its town's plan puts it, in that plan's pixels (u right,
// v down, as the town file reads them; Plan and TOWN_SCALE in src/world3d/town.ts), and faces a
// plan point. The spots were checked open and reachable from the town's way in
// (tools/town_check.cjs). They stay in the old towns until the west lands' towns are built.
//
// Their quests are in src/quests_job3.ts; a job whose branches are still stubs isn't offered.

import { Plan, TOWN_SCALE } from "./world3d/town";
import type { NpcSpec } from "./npcs";

// Each town's plan: cm a pixel and the pixel at the world origin, as its town file has them.
const PLANS: Record<string, Plan> = {
  eden: new Plan(18, 625, 565),
  kradia: new Plan(28, 395, 410),
  trunrada: new Plan(27, 435, 440),
  yodia: new Plan(26, 425, 405),
  osaki: new Plan(20, 520, 450),
  iceberg: new Plan(28, 440, 400),
  bahamas: new Plan(26, 420, 420),
};

type UV = [number, number];
interface Master {
  town: string;
  at: UV;     // where it stands (plan pixels)
  look: UV;   // the plan point it faces
  spec: Omit<NpcSpec, "x" | "y" | "face">;
}

const male = (top: string, bottom: string, hairColor = "ink", eyes = "amber") => ({ gender: "male", hair: "", hairColor, eyes, top, bottom });
const female = (hair: string, hairColor: string, eyes: string, top: string, bottom: string) => ({ gender: "female", hair, hairColor, eyes, top, bottom });

// (the plan point each town's way in comes to, for those who face whoever arrives)
const EDEN_IN: UV = [787, 718], KRADIA_IN: UV = [446, 436], OSAKI_IN: UV = [240, 452], ICEBERG_IN: UV = [404, 418], BAHAMAS_IN: UV = [420, 352];

export const JOB_MASTERS: Master[] = [
  // ---- Eden: the knight by the heroes' garden, the high bishop by the cathedral ----
  { town: "eden", at: [266.6, 748.4], look: EDEN_IN, spec: {
    id: "job3_knight", name: "เซอร์กาเวน", title: "อัศวินหลวง · เปลี่ยนอาชีพอัศวิน", role: "talk", look: male("top_warrior_navy", "bottom_warrior_black", "gold", "blue"),
    lines: ["สวนนี้เป็นที่ระลึกถึงอัศวินที่ล้มลงเพื่ออาณาจักร", "นักดาบ นักรบคลั่ง หรือทหารรับจ้างที่เลเวล 60 แล้ว มาสาบานตนเป็นอัศวินกับข้าได้"] } },
  { town: "eden", at: [234.3, 259.7], look: EDEN_IN, spec: {
    id: "job3_high_bishop", name: "มหาบาทหลวงโซฟีอา", title: "มหาบาทหลวงแห่งมหาวิหาร · เปลี่ยนอาชีพบาทหลวงชั้นสูง", role: "talk",
    look: female("hime", "gold", "blue", "top_priestess_white", "bottom_priestess_white"),
    lines: ["ศรัทธาที่แท้ไม่ได้อยู่ในบทสวด แต่อยู่ในมือที่ยื่นไปช่วยผู้อื่น", "บาทหลวงที่เลเวล 60 แล้ว มหาวิหารพร้อมรับเจ้าเป็นบาทหลวงชั้นสูง"] } },
  // ---- Kradia: the archmage on the tower's plaza, the spellblade by the master of the sword ----
  { town: "kradia", at: [380.3, 435.5], look: KRADIA_IN, spec: {
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
];

// The masters standing in a map, in world centimetres (none: not a town of theirs).
export function jobMasters(map: string): NpcSpec[] {
  const plan = PLANS[map];
  if (!plan) return [];
  return JOB_MASTERS.filter((m) => m.town === map).map((m) => {
    const [x, y] = plan.P(m.at[0], m.at[1]), [lx, ly] = plan.P(m.look[0], m.look[1]);
    return { ...m.spec, x: x * TOWN_SCALE, y: y * TOWN_SCALE, face: (Math.atan2(ly - y, lx - x) * 180) / Math.PI };
  });
}

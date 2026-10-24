// The king's quest that breaks the level-99 limit (docs/v05_jobs.md 1): offered at LIMIT_LEVEL to
// whoever is held there, longer than any job quest. It goes round the kingdom after the first
// king, who broke the limit the same way: the palace's chronicles, the sage of the old capital,
// the ancestors' stone in the highlands, the witch of the frontier; storm cores, the dead of the
// burnt villages and the thorns of the demon lands (levels 95-115), and the cloud qilin at the
// end. Its reward (`limit`) takes the character to level 100 (Progress.breakLimit).

import { ITEMS } from "./items";
import { LIMIT_LEVEL } from "./progression";
import { questItem } from "./quests_job4";
import type { MapId } from "./maps";
import type { Goal, QuestDef, Who } from "./quests";

const W = (map: MapId, npc: string, name: string): Who => ({ map, npc, name });
const KING = W("palace", "palace_king", "พระเจ้าอาร์เธอร์ที่ห้า"), ELEANOR = W("palace", "palace_librarian", "บรรณารักษ์เอเลนอร์");
const ALBRICH = W("noa", "noa_archivist", "ท่านอัลบริช"), ALDRIC = W("highland", "highland_elder", "ผู้เฒ่าอัลดริก");
const GRISELDA = W("kradia", "kradia_witch", "ยายกริเซลดา");
const talk: Goal = { kind: "talk" };

Object.assign(ITEMS, {
  storm_core: questItem("storm_core", "แก่นพายุ", "bolt", "#b8c8ff", "ใจกลางของภูตพายุหมุน สายฟ้ายังเต้นอยู่ข้างใน"),
  thorn_spine: questItem("thorn_spine", "หนามดำอสูร", "thorn", "#9a6ad8", "หนามจากหนอนหนามอสูร ปลายเรืองม่วง แทงทะลุได้ทุกเกราะ"),
  limit_seal: questItem("limit_seal", "ตราผนึกขีดจำกัด", "star", "#ffd36b", "ตราที่หลอมจากแก่นพายุ กษัตริย์องค์แรกเคยถือตราแบบนี้กลับมาหาผู้รู้ทั้งหลาย"),
});

export const LIMIT_QUESTS: QuestDef[] = [
  { id: "limit_break", name: "ทลายขีดจำกัด", giver: KING, level: LIMIT_LEVEL,
    offer: "เจ้าแกร่งถึงขีดที่มนุษย์จะไปถึงได้แล้ว พงศาวดารว่ากษัตริย์องค์แรกเคยทลายขีดนั้นได้ ด้วยการเดินทางรอบแผ่นดินและพิสูจน์ตนต่อผู้รู้ทั้งหลาย จงเดินตามรอยท่าน เริ่มจากหอสมุดหลวงของเรา",
    steps: [
      { goal: talk, to: ELEANOR, task: "ไปค้นพงศาวดารกับบรรณารักษ์เอเลนอร์ที่หอสมุดหลวง",
        say: "พงศาวดารเล่มนี้... กษัตริย์องค์แรกไปขอคำชี้แนะจากผู้รู้แห่งโนอา เมืองหลวงเก่า ไปหาท่านอัลบริชที่หอจดหมายเหตุเถิด" },
      { goal: talk, to: ALBRICH, task: "ไปหาท่านอัลบริชที่หอจดหมายเหตุ โนอา",
        say: "ขีดจำกัด... บันทึกโบราณว่าต้องหลอมตราผนึกจากพลังฟ้า ภูตพายุหมุนที่แหลมพายุกักพลังนั้นไว้ในตัว เก็บแก่นของมันมาให้ข้า" },
      { goal: { kind: "collect", item: "storm_core", count: 5, from: ["storm_elemental"], chance: 0.4 }, to: ALBRICH,
        task: "นำแก่นพายุ 5 ดวงไปให้ท่านอัลบริช (จากภูตพายุหมุน แหลมพายุ)",
        say: "สายฟ้าในนี้ยังเต้นอยู่เลย ข้าหลอมเป็นตราผนึกให้แล้ว แต่ตราต้องได้พรจากหินบรรพบุรุษ นำมันไปให้ผู้เฒ่าอัลดริกที่ไฮแลนด์ ฮิล" },
      { goal: talk, to: ALDRIC, task: "นำตราผนึกขีดจำกัดไปให้ผู้เฒ่าอัลดริกที่ไฮแลนด์ ฮิล", gives: [["limit_seal", 1]],
        say: "หินบรรพบุรุษจำชื่อทุกคนที่ผ่านขีดนั้นไป ก่อนจะจารึกชื่อเจ้า เจ้าต้องพิสูจน์ว่าไม่หวั่นความตาย ศพชาวบ้านที่หมู่บ้านร้างชายแดนยังเดินอยู่ ไปปลดปล่อยพวกเขา" },
      { goal: { kind: "kill", what: ["village_ghoul"], count: 20 }, to: ALDRIC, task: "ปลดปล่อยชาวบ้านซากศพ 20 ร่างที่หมู่บ้านร้างชายแดน",
        say: "วิญญาณพวกนั้นได้พักแล้ว หินบรรพบุรุษรับรู้ ตราของเจ้าได้พรแล้ว แต่ยังต้องจารึก ยายกริเซลดาที่คราเดียจารึกได้ด้วยหนามที่แทงทะลุทุกสิ่ง" },
      { goal: { kind: "collect", item: "thorn_spine", count: 6, from: ["thorn_crawler"], chance: 0.4 }, to: GRISELDA,
        task: "นำหนามดำอสูร 6 อันไปให้ยายกริเซลดาที่คราเดีย (จากหนอนหนามอสูร ทุ่งหนามอสูร)",
        say: "หึ ๆ หนามอสูรแท้ ๆ ยายจารึกตราให้แล้ว อักษรสุดท้ายต้องเขียนด้วยเมฆ กิเลนเมฆที่ภูผาหินปูนคือผู้ที่กษัตริย์องค์แรกเอาชนะเป็นตัวสุดท้าย" },
      { goal: { kind: "visit", map: "karst_peaks" }, to: KING, task: "ไปที่ภูผาหินปูน", say: "" },
      { goal: { kind: "kill", what: ["cloud_qilin"], count: 1 }, to: KING, task: "ล้มกิเลนเมฆที่ภูผาหินปูน แล้วนำตราผนึกกลับไปถวายพระราชา", takes: [["limit_seal", 1]],
        say: "ตรานี้... เหมือนในพงศาวดารทุกอย่าง เจ้าเดินตามรอยกษัตริย์องค์แรกครบแล้ว จงก้าวข้ามขีดจำกัดของมนุษย์เถิด" },
    ],
    reward: { limit: true, items: [["potion_red_big", 20], ["potion_blue_big", 10]] } },
];

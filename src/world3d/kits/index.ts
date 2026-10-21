// Every kit, in the order the gallery lists them (the towns', then the fields'). Each loads on its own, so one kit's mistake
// never stops the others from showing; a sample scene may use its own items and the shared
// kits' ("common:bench", "flora:Palm").
import type { Kit } from "./types";

export interface KitEntry {
  id: string;
  name: string;
  load: () => Promise<Kit>;
}

export const KIT_LIST: KitEntry[] = [
  { id: "eden", name: "อีเดน", load: () => import("./eden").then((m) => m.KIT) },
  { id: "bahamas", name: "บาฮามัส", load: () => import("./bahamas").then((m) => m.KIT) },
  { id: "yodia", name: "โยเดีย", load: () => import("./yodia").then((m) => m.KIT) },
  { id: "kradia", name: "คราเดีย", load: () => import("./kradia").then((m) => m.KIT) },
  { id: "iceberg", name: "ไอซ์เบิร์ก", load: () => import("./iceberg").then((m) => m.KIT) },
  { id: "trunrada", name: "ทรุนราดา", load: () => import("./trunrada").then((m) => m.KIT) },
  { id: "osaki", name: "โอซากิ", load: () => import("./osaki").then((m) => m.KIT) },
  { id: "plains", name: "ทุ่งราบภาคกลาง", load: () => import("./plains").then((m) => m.KIT) },
  { id: "snowland", name: "เทือกเขาหิมะ", load: () => import("./snowland").then((m) => m.KIT) },
  { id: "steppe", name: "ทุ่งสเตปป์", load: () => import("./steppe").then((m) => m.KIT) },
  { id: "frontier", name: "ชายแดนและดินแดนอสูร", load: () => import("./frontier").then((m) => m.KIT) },
  { id: "desert", name: "ทะเลทราย", load: () => import("./desert").then((m) => m.KIT) },
  { id: "jungle", name: "ป่าดิบและชายฝั่ง", load: () => import("./jungle").then((m) => m.KIT) },
  { id: "volcanic", name: "ภูเขาไฟโอซากิ", load: () => import("./volcanic").then((m) => m.KIT) },
  { id: "common", name: "ของใช้ทั่วไป", load: () => import("./common").then((m) => m.COMMON) },
  { id: "flora", name: "ต้นไม้และพืช", load: () => import("./common").then((m) => m.FLORA) },
];

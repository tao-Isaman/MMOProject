// Shared kits: the courtyard's props (any town can use them) and every tree and plant.
import * as THREE from "three";
import type { Kit } from "./types";
import { bench, crate, fenceBroken, signPost, gazebo, marketCart, house, flatStone, rockSmall } from "../courtyard";
import { plant, PLANTS } from "../flora";

export const COMMON: Kit = {
  id: "common",
  name: "ของใช้ทั่วไป",
  region: "ทุกเมือง",
  desc: "ของจากลานหมู่บ้านแรก ใช้ได้ทุกเมือง",
  ground: "grass",
  items: [
    { id: "house", name: "บ้านโครงไม้", make: house, tags: ["building"] },
    { id: "gazebo", name: "ศาลาบ่อน้ำ", make: gazebo, tags: ["building"] },
    { id: "market_cart", name: "รถเข็นขายของ", make: marketCart, tags: ["market"] },
    { id: "bench", name: "ม้านั่ง", make: bench, tags: ["decor"] },
    { id: "crate", name: "ลังไม้", make: crate, tags: ["decor"] },
    { id: "fence_broken", name: "รั้วพัง", make: fenceBroken, tags: ["decor"] },
    { id: "sign_post", name: "เสาป้าย", make: signPost, tags: ["decor"] },
    { id: "flat_stone", name: "หินปูทาง", make: () => flatStone(4), tags: ["ground"] },
    { id: "rock_small", name: "หินก้อนเล็ก", make: () => rockSmall(3), tags: ["decor"] },
  ],
};

const PLANT_NAMES: Record<string, string> = {
  BigOak: "ต้นโอ๊กใหญ่", RoundTree: "ต้นไม้พุ่มกลม", SmallTree: "ต้นไม้เล็ก", Bush: "พุ่มไม้",
  Cherry: "ซากุระ", Birch: "ต้นเบิร์ช", JungleTree: "ต้นไม้ป่าดิบ", FrostOak: "โอ๊กเหมันต์", AutumnTree: "ต้นไม้ใบแดง", JungleBush: "พุ่มไม้ป่าดิบ",
  Palm: "ต้นมะพร้าว", PalmTall: "ต้นมะพร้าวสูง", PalmBent: "ต้นมะพร้าวเอน", Pine: "ต้นสน", PineSmall: "ต้นสนเล็ก",
  SnowPine: "ต้นสนหิมะ", SnowPineSmall: "ต้นสนหิมะเล็ก", Bamboo: "กอไผ่", Cactus: "กระบองเพชร", CactusRound: "กระบองเพชรกลม",
};

export const FLORA: Kit = {
  id: "flora",
  name: "ต้นไม้และพืช",
  region: "ทุกภูมิภาค",
  desc: "ต้นไม้แต่ละถิ่น ใบไหวตามลม",
  ground: "grass",
  items: PLANTS.map((p) => ({ id: p, name: PLANT_NAMES[p] ?? p, make: (): THREE.Object3D => plant(p), tags: ["plant"] })),
};

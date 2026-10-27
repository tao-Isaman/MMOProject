// The maps: the city of Eden (where everyone starts, no monsters), the field west of it (the
// courtyard of courtyard.weave, with its slimes), the other towns of the world map and the
// fields between them, each in its own module loaded the first time it is entered
// (src/world3d/town_<id>.ts, src/world3d/field_<id>.ts). A map is built once and kept; entering
// makes its solids and its ground's height current (src/world.ts, src/projection.ts) and hands
// back its scenery, townsfolk, warps and shut gates.
//
// Warps join the maps both ways: a warp to map B lands at B's gates[A], A being the map it
// leaves (each map says where its own ways in are).

import { setMap } from "./world";
import { setHeights } from "./projection";
import type { SolidSpec } from "./world";
import { buildEden } from "./world3d/town_eden";
import type { Town } from "./world3d/town";
import { fieldLevel } from "./world3d/levels";
import { MERCHANT } from "./shop";
import type { NpcSpec } from "./npcs";
import type { Level } from "./world3d/view";
import type { Vec2 } from "./types";

export type TownId = "eden" | "iceberg" | "trunrada" | "kradia" | "bahamas" | "yodia" | "osaki" | "noa" | "suzhou" | "highland" | "venezia" | "palace";

// The fields: name and the builder (src/world3d/field_<id>.ts). Their monsters and levels:
// fieldMonsters and fieldLevels in src/bestiary.ts.
export const FIELDS = {
  west_woods: { name: "ป่าใหญ่ตะวันตก", load: () => import("./world3d/field_west_woods") },
  royal_road: { name: "ถนนหลวง", load: () => import("./world3d/field_royal_road") },
  snow_foothills: { name: "เชิงเขาหิมะ", load: () => import("./world3d/field_snow_foothills") },
  ice_pass: { name: "ช่องเขาน้ำแข็ง", load: () => import("./world3d/field_ice_pass") },
  north_icefield: { name: "ทุ่งน้ำแข็งเหนือ", load: () => import("./world3d/field_north_icefield") },
  pine_river: { name: "ป่าสนริมแม่น้ำ", load: () => import("./world3d/field_pine_river") },
  west_steppe: { name: "สเตปป์ตะวันตก", load: () => import("./world3d/field_west_steppe") },
  horse_meadow: { name: "ทุ่งเลี้ยงม้า", load: () => import("./world3d/field_horse_meadow") },
  stone_plain: { name: "ที่ราบหินโบราณ", load: () => import("./world3d/field_stone_plain") },
  border_woods: { name: "ป่าชายแดน", load: () => import("./world3d/field_border_woods") },
  border_line: { name: "แนวป้องกันชายแดน", load: () => import("./world3d/field_border_line") },
  demon_land: { name: "ดินแดนอสูร", load: () => import("./world3d/field_demon_land") },
  south_savanna: { name: "ทุ่งสะวันนาใต้", load: () => import("./world3d/field_south_savanna") },
  desert_edge: { name: "ขอบทะเลทราย", load: () => import("./world3d/field_desert_edge") },
  great_desert: { name: "ทะเลทรายใหญ่", load: () => import("./world3d/field_great_desert") },
  south_jungle: { name: "ป่าดิบแดนใต้", load: () => import("./world3d/field_south_jungle") },
  mangrove_coast: { name: "ชายฝั่งป่าชายเลน", load: () => import("./world3d/field_mangrove_coast") },
  sakura_hills: { name: "เนินซากุระและป่าไผ่", load: () => import("./world3d/field_sakura_hills") },
  volcano: { name: "ยอดภูเขาไฟ", load: () => import("./world3d/field_volcano") },
  // the west lands (docs/west_lands.md): fields next door to each other far apart in level
  noa_meadow: { name: "ทุ่งหญ้าโนอา", load: () => import("./world3d/field_noa_meadow") },
  noa_plains: { name: "ที่ราบใต้โนอา", load: () => import("./world3d/field_noa_plains") },
  dry_plains: { name: "ที่ราบแห้งแล้ง", load: () => import("./world3d/field_dry_plains") },
  elder_forest: { name: "ป่าโบราณ", load: () => import("./world3d/field_elder_forest") },
  rice_terraces: { name: "นาขั้นบันได", load: () => import("./world3d/field_rice_terraces") },
  highland_downs: { name: "ที่ราบเนินเขา", load: () => import("./world3d/field_highland_downs") },
  karst_peaks: { name: "ภูผาหินปูน", load: () => import("./world3d/field_karst_peaks") },
  ancient_plain: { name: "ที่ราบโบราณ", load: () => import("./world3d/field_ancient_plain") },
  frozen_river: { name: "แม่น้ำเยือกแข็ง", load: () => import("./world3d/field_frozen_river") },
  west_pass: { name: "ช่องเขาตะวันตก", load: () => import("./world3d/field_west_pass") },
  tangled_hills: { name: "เนินเขาวงกต", load: () => import("./world3d/field_tangled_hills") },
  lagoon_marsh: { name: "บึงลากูน", load: () => import("./world3d/field_lagoon_marsh") },
  royal_necropolis: { name: "สุสานหลวงโบราณ", load: () => import("./world3d/field_royal_necropolis") },
  north_cliffs: { name: "หน้าผาทะเลเหนือ", load: () => import("./world3d/field_north_cliffs") },
  west_cape: { name: "แหลมทะเลตะวันตก", load: () => import("./world3d/field_west_cape") },
  // the rest of the land (docs/v04_lands.md): the squares of the world map no map filled before
  windmill_fields: { name: "ทุ่งกังหันลม", load: () => import("./world3d/field_windmill_fields") },
  flower_fields: { name: "ทุ่งดอกไม้หลวง", load: () => import("./world3d/field_flower_fields") },
  royal_hunt: { name: "ป่าล่าสัตว์หลวง", load: () => import("./world3d/field_royal_hunt") },
  salt_dunes: { name: "เนินทรายริมทะเลใน", load: () => import("./world3d/field_salt_dunes") },
  lavender_hills: { name: "ทุ่งลาเวนเดอร์", load: () => import("./world3d/field_lavender_hills") },
  inner_sea_cliffs: { name: "ทุ่งผาริมทะเลใน", load: () => import("./world3d/field_inner_sea_cliffs") },
  waterfall_gorge: { name: "หุบผาน้ำตก", load: () => import("./world3d/field_waterfall_gorge") },
  frozen_falls: { name: "หุบน้ำตกเยือกแข็ง", load: () => import("./world3d/field_frozen_falls") },
  caravan_road: { name: "ถนนคาราวานตะวันออก", load: () => import("./world3d/field_caravan_road") },
  windswept_heights: { name: "ที่ราบสูงลมแรง", load: () => import("./world3d/field_windswept_heights") },
  old_royal_mine: { name: "เหมืองหลวงเก่า", load: () => import("./world3d/field_old_royal_mine") },
  west_glacier: { name: "ธารน้ำแข็งตะวันตก", load: () => import("./world3d/field_west_glacier") },
  golden_maples: { name: "ป่าเมเปิลทอง", load: () => import("./world3d/field_golden_maples") },
  glass_desert: { name: "ทะเลทรายแก้ว", load: () => import("./world3d/field_glass_desert") },
  aurora_field: { name: "ทุ่งแสงเหนือ", load: () => import("./world3d/field_aurora_field") },
  witch_cape: { name: "แหลมแม่มด", load: () => import("./world3d/field_witch_cape") },
  floating_rocks: { name: "ทุ่งหินลอย", load: () => import("./world3d/field_floating_rocks") },
  storm_cape: { name: "แหลมพายุ", load: () => import("./world3d/field_storm_cape") },
  burnt_villages: { name: "หมู่บ้านร้างชายแดน", load: () => import("./world3d/field_burnt_villages") },
  thornland: { name: "ทุ่งหนามอสูร", load: () => import("./world3d/field_thornland") },
  demon_camp: { name: "ค่ายทัพอสูร", load: () => import("./world3d/field_demon_camp") },
  royal_peaks: { name: "สันเขาหลวง", load: () => import("./world3d/field_royal_peaks") },
  primeval_forest: { name: "ป่าดึกดำบรรพ์", load: () => import("./world3d/field_primeval_forest") },
  dragon_summit: { name: "ยอดเขามังกรฟ้า", load: () => import("./world3d/field_dragon_summit") },
  ice_queen_hollow: { name: "หุบวังน้ำแข็ง", load: () => import("./world3d/field_ice_queen_hollow") },
  snow_abbey: { name: "ผาอารามหิมะ", load: () => import("./world3d/field_snow_abbey") },
  humming_stones: { name: "หุบหินร้องเพลง", load: () => import("./world3d/field_humming_stones") },
  frostfang_ridge: { name: "สันเขาเขี้ยวน้ำแข็ง", load: () => import("./world3d/field_frostfang_ridge") },
  sunken_temple_woods: { name: "ป่าวิหารจม", load: () => import("./world3d/field_sunken_temple_woods") },
  sacred_banyan: { name: "ป่าไทรศักดิ์สิทธิ์", load: () => import("./world3d/field_sacred_banyan") },
  first_tree: { name: "ป่าต้นไม้แรก", load: () => import("./world3d/field_first_tree") },
} satisfies Record<string, { name: string; load: () => Promise<{ build: (quality: { flowers: number }) => Town }> }>;
export type FieldId = keyof typeof FIELDS;
export type MapId = TownId | FieldId | "field";

export const MAP_NAMES = {
  eden: "อีเดน", field: "ทุ่งหญ้าตะวันตก", iceberg: "ไอซ์เบิร์ก", trunrada: "ทรุนราดา", kradia: "คราเดีย",
  bahamas: "บาฮามัส", yodia: "โยเดีย", osaki: "โอซากิ", noa: "โนอา", suzhou: "ซูโจว", highland: "ไฮแลนด์ ฮิล", venezia: "เวนิชเซีย", palace: "พระราชวังหลวง",
  ...(Object.fromEntries(Object.entries(FIELDS).map(([id, f]) => [id, f.name])) as Record<FieldId, string>),
} as Record<MapId, string>;
// the towns a travel guide can send you to (every town)
export const TOWNS: TownId[] = ["eden", "iceberg", "trunrada", "kradia", "bahamas", "yodia", "osaki", "noa", "suzhou", "highland", "venezia", "palace"];

// Each town's builder; all but Eden load with their kits when first entered.
const BUILDERS: Record<TownId, () => Promise<(quality: { flowers: number }) => Town>> = {
  eden: async () => buildEden,
  iceberg: () => import("./world3d/town_iceberg").then((m) => m.buildIceberg),
  trunrada: () => import("./world3d/town_trunrada").then((m) => m.buildTrunrada),
  kradia: () => import("./world3d/town_kradia").then((m) => m.buildKradia),
  bahamas: () => import("./world3d/town_bahamas").then((m) => m.buildBahamas),
  yodia: () => import("./world3d/town_yodia").then((m) => m.buildYodia),
  osaki: () => import("./world3d/town_osaki").then((m) => m.buildOsaki),
  noa: () => import("./world3d/town_noa").then((m) => m.buildNoa),
  suzhou: () => import("./world3d/town_suzhou").then((m) => m.buildSuzhou),
  highland: () => import("./world3d/town_highland").then((m) => m.buildHighland),
  venezia: () => import("./world3d/town_venezia").then((m) => m.buildVenezia),
  palace: () => import("./world3d/town_palace").then((m) => m.buildPalace),
};

// A name written on the map window: a place (big), a corner of it (small) or a gate.
export interface MapLabel {
  x: number;
  y: number;
  text: string;
  kind?: "small" | "gate";
}

export interface Warp {
  x: number;
  y: number;
  r: number;
  to: string;
  arrive?: Vec2; // where it lands, when the map it goes to has no gate for this one
}

export interface GameMap {
  id: MapId;
  name: string;
  town: boolean;      // no monsters
  spawn: Vec2;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  solids: SolidSpec[];
  level: Level;
  npcs: NpcSpec[];
  warps: Warp[];
  closed: { x: number; y: number; r: number; text: string }[];
  labels: MapLabel[];
  gates: Record<string, Vec2>; // where you arrive from each map next door (by its id)
  height?: (x: number, y: number) => number; // ground that is not flat (world cm)
  top?: number;
  spots?: Vec2[];             // where monsters live (a field)
}

// The courtyard's footprints (from the Oriverse world), in sim centimetres.
const FIELD_SOLIDS: SolidSpec[] = [
  { kind: "house", x: 1910, y: 1440, w: 810, d: 910, rot: 0 },
  { kind: "well", x: 1100, y: 820, w: 190, d: 190, rot: 8 },
  { kind: "box", x: 792, y: 771, w: 156, d: 116, rot: -10 },   // cart
  { kind: "box", x: 1864, y: 178, w: 50, d: 170, rot: 24 },    // bench
  { kind: "box", x: 2051, y: -22, w: 50, d: 170, rot: 20 },    // bench
  { kind: "box", x: 1070, y: -470, w: 56, d: 56, rot: 8 },     // crates
  { kind: "box", x: 1100, y: -540, w: 56, d: 56, rot: -12 },
  { kind: "box", x: 1642, y: 965, w: 56, d: 56, rot: 0 },
  { kind: "box", x: 1735, y: 950, w: 56, d: 56, rot: 15 },
  { kind: "box", x: 854, y: -689, w: 150, d: 14, rot: 48 },    // fence
  { kind: "post", x: 978, y: -416, r: 12 },
  { kind: "tree", x: 1000, y: -600, r: 50 },
  { kind: "tree", x: 960, y: 1020, r: 35 },
  { kind: "tree", x: 2380, y: 120, r: 45 },
  { kind: "hedge", x: 2050, y: 680, r: 110 },
  { kind: "hedge", x: 1960, y: 440, r: 110 },
  { kind: "hedge", x: 2120, y: 240, r: 110 },
  { kind: "bush", x: 919, y: -570, r: 45 },
  { kind: "bush", x: 968, y: -684, r: 45 },
  { kind: "bush", x: 422, y: 265, r: 45 },
  { kind: "bush", x: 488, y: -75, r: 45 },
  { kind: "bush", x: 433, y: -195, r: 45 },
  { kind: "bush", x: 668, y: 806, r: 45 },
  { kind: "rock", x: 948, y: -452, r: 25 },
  { kind: "rock", x: 427, y: 56, r: 25 },
  { kind: "rock", x: 612, y: 731, r: 25 },
  { kind: "npc", x: MERCHANT.x, y: MERCHANT.y, r: 26 },
];
const FIELD_BOUNDS = { minX: 60, maxX: 2650, minY: -760, maxY: 2050 };
// where Eden's west gate leads out, and where the way back in stands
const FIELD_WARP = { x: 1355, y: -680, r: 150, to: "eden" };
// and the way on west into the great forest
const FIELD_WOODS = { x: 760, y: 1990, r: 150, to: "west_woods" };

const built = new Map<MapId, GameMap>();

export async function loadMap(id: MapId, quality: { flowers: number }): Promise<GameMap> {
  let map = built.get(id);
  if (!map) {
    if (id in FIELDS) {
      const f = FIELDS[id as FieldId];
      const t = (await f.load()).build(quality);
      map = { id, name: f.name, town: false, gates: {}, ...t };
    } else if (id !== "field") {
      const t = (await BUILDERS[id as TownId]())(quality);
      map = { id, name: MAP_NAMES[id], town: true, gates: {}, ...t };
    } else {
      // the flowers keep off the solids, so they must be current before the scenery is built
      setMap(FIELD_SOLIDS, FIELD_BOUNDS, { x: 1000, y: 250 });
      map = {
        id, name: MAP_NAMES.field, town: false, spawn: { x: 1000, y: 250 }, bounds: FIELD_BOUNDS, solids: FIELD_SOLIDS,
        level: fieldLevel(quality, [FIELD_WARP, FIELD_WOODS]),
        npcs: [{ id: "mira", x: MERCHANT.x, y: MERCHANT.y, face: 180, name: MERCHANT.name, title: MERCHANT.title, role: "shop", sprite: "merchant", lines: ["ยินดีต้อนรับจ้า"] }],
        warps: [FIELD_WARP, FIELD_WOODS],
        gates: { eden: { x: 1330, y: -440 }, west_woods: { x: 850, y: 1700 } },
        closed: [],
        labels: [{ x: 1910, y: 1440, text: "บ้านไร่" }, { x: 1100, y: 820, text: "บ่อน้ำ", kind: "small" }],
      };
    }
    built.set(id, map);
  }
  setMap(map.solids, map.bounds, map.spawn);
  setHeights(map.height ?? null, map.top ?? 0);
  return map;
}

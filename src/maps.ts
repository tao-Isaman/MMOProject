// The maps: the city of Eden (where everyone starts, no monsters) and the field west of it (the
// courtyard of courtyard.weave, with its slimes). A map is built the first time it is entered
// and kept; entering makes its solids current (src/world.ts) and hands back its scenery,
// townsfolk, warps and shut gates.

import { setMap } from "./world";
import type { SolidSpec } from "./world";
import { buildEden, TOWN_SCALE } from "./world3d/town_eden";
import { fieldLevel } from "./world3d/levels";
import { MERCHANT } from "./shop";
import type { NpcSpec } from "./npcs";
import type { Level } from "./world3d/view";
import type { Vec2 } from "./types";

export type MapId = "eden" | "field";
export const MAP_NAMES: Record<MapId, string> = { eden: "อีเดน", field: "ทุ่งหญ้าตะวันตก" };

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
  arrive: Vec2;
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
const FIELD_WARP = { x: 400, y: -680, r: 150, to: "eden", arrive: { x: 54 * TOWN_SCALE, y: 8550 * TOWN_SCALE } };

const built = new Map<MapId, GameMap>();

export function loadMap(id: MapId, quality: { flowers: number }): GameMap {
  let map = built.get(id);
  if (!map) {
    if (id === "eden") {
      const t = buildEden(quality);
      map = { id, name: MAP_NAMES.eden, town: true, ...t, warps: t.warps };
    } else {
      // the flowers keep off the solids, so they must be current before the scenery is built
      setMap(FIELD_SOLIDS, FIELD_BOUNDS, { x: 1000, y: 250 });
      map = {
        id, name: MAP_NAMES.field, town: false, spawn: { x: 1000, y: 250 }, bounds: FIELD_BOUNDS, solids: FIELD_SOLIDS,
        level: fieldLevel(quality, [FIELD_WARP]),
        npcs: [{ id: "mira", x: MERCHANT.x, y: MERCHANT.y, face: 180, name: MERCHANT.name, title: MERCHANT.title, role: "shop", sprite: "merchant", lines: ["ยินดีต้อนรับจ้า"] }],
        warps: [FIELD_WARP],
        closed: [],
        labels: [{ x: 1910, y: 1440, text: "บ้านไร่" }, { x: 1100, y: 820, text: "บ่อน้ำ", kind: "small" }],
      };
    }
    built.set(id, map);
  }
  setMap(map.solids, map.bounds, map.spawn);
  return map;
}

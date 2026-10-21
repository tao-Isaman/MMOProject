// อีเดน (Eden), the starting city, laid out from the player's own plan (a hand-drawn map:
// a walled city cut into four quarters by two avenues that cross in the middle, a stone plaza
// in each quarter with houses round it, three gates, and a harbour quarter by the sea on the
// east). Ragnarok's Prontera and Alberta set the scale: wide tree-lined avenues, a cathedral,
// a market, a fountain plaza, piers with ships.
//
// The plan is read in its own pixels (u right, v down, as drawn) and turned into the world:
// north (up the page) is +X, east (right) is -Y, so the starting camera sees it as drawn.
// One plan pixel is 18 cm, which makes the walled city about 176 x 150 m.
//
// Everything placed here comes from the town kits (src/world3d/kits); repeated pieces are drawn
// as instanced meshes in 50 m blocks, so a block off screen costs nothing.

import * as THREE from "three";
import { toThree } from "./geo";
import type { Geo } from "./geo";
import { material, defineMaterial } from "./textures";
import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import { flowerFields } from "./courtyard";
import { KIT as EDEN } from "./kits/eden";
import { KIT as YODIA } from "./kits/yodia";
import { COMMON, FLORA } from "./kits/common";
import type { Kit, KitItem } from "./kits/types";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import type { Level } from "./view";

const KITS: Record<string, Kit> = { eden: EDEN, yodia: YODIA, common: COMMON, flora: FLORA };

// Pieces the Eden kit may not have yet stand in for each other.
const FALLBACK: Record<string, string> = {
  "eden:corner_house": "eden:townhouse", "eden:row_houses": "eden:townhouse", "eden:weapon_shop": "eden:townhouse_narrow",
  "eden:tool_shop": "eden:townhouse_narrow", "eden:guild_hall": "eden:inn", "eden:warehouse": "yodia:warehouse",
  "eden:cafe": "eden:townhouse_narrow", "eden:cafe_table": "common:bench", "eden:hedge": "flora:Bush", "eden:topiary": "flora:Bush",
  "eden:flower_bed": "eden:flower_planter", "eden:pergola": "common:bench", "eden:park_bench": "common:bench",
  "eden:kiosk": "eden:market_stall_cloth", "eden:notice_board": "common:sign_post", "eden:public_well": "common:gazebo",
  "eden:cargo_stack": "yodia:cargo_pile", "eden:guard_post": "eden:street_lamp",
};

// Colourways: the same houses with Prontera's red roofs, slate roofs, cream or yellow walls.
defineMaterial("EdenTown_PlasterCream", { map: "plaster", tint: "#f3e6c8", bump: 0.6 });
defineMaterial("EdenTown_PlasterYellow", { map: "plaster", tint: "#f4dfa0", bump: 0.6 });
defineMaterial("EdenTown_ShutterGreen", { map: "wood", tint: "#4f7d4a", bump: 1 });
defineMaterial("EdenTown_ShutterRed", { map: "wood", tint: "#a8453a", bump: 1 });
const COLOURS: Record<string, Record<string, string>> = {
  red: { RoofBlue: "RoofTerracotta", Eden_Shutter: "EdenTown_ShutterGreen", FabricBlue: "FabricRed" },
  slate: { RoofBlue: "RoofSlate", Eden_Plaster: "EdenTown_PlasterCream", Eden_Shutter: "EdenTown_ShutterRed" },
  cream: { RoofBlue: "RoofTerracotta", Eden_Plaster: "EdenTown_PlasterCream", Eden_Shutter: "EdenTown_ShutterRed", FabricBlue: "FabricGreen" },
  yellow: { Eden_Plaster: "EdenTown_PlasterYellow", FabricBlue: "FabricGold" },
};

// ---- the plan's pixels -> the world ----
const S = 18; // cm per plan pixel
const CU = 625, CV = 565; // the crossroads, the world origin
const P = (u: number, v: number): [number, number] => [(CV - v) * S, (CU - u) * S];
const rect = (u0: number, v0: number, u1: number, v1: number): Poly => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
// a quarter ellipse with its corner at (cu, cv), reaching ru along u (signed) and rv along v (signed)
function quarter(cu: number, cv: number, ru: number, rv: number, n = 16): Poly {
  const pts: Poly = [P(cu, cv)];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * (Math.PI / 2);
    pts.push(P(cu + ru * Math.cos(t), cv + rv * Math.sin(t)));
  }
  return pts;
}
// the heading (degrees) that turns an item's front (-X) toward plan direction (du, dv)
const facing = (du: number, dv: number) => (Math.atan2(du, dv) * 180) / Math.PI;
const FACE = { e: 90, w: -90, n: 180, s: 0 } as const;
type Side = keyof typeof FACE;

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// ---- placements ----
interface Placement {
  ref: string;       // "kit:item"
  x: number;
  y: number;
  z: number;
  h: number;         // heading, degrees
  s: number;         // scale
  sy: number;        // extra stretch along the item's own Y (wall pieces cut to length)
  colours?: string;
  solid: "auto" | "none" | SolidSpec[]; // explicit shapes are in the item's own frame
}

interface Proto {
  obj: THREE.Object3D;
  foot: { x0: number; x1: number; y0: number; y1: number };
  tags: string[];
  kit: string;
}

const protos = new Map<string, Proto>();
function protoOf(ref: string, colours?: string): Proto {
  const key = `${ref}|${colours ?? ""}`;
  let p = protos.get(key);
  if (p) return p;
  const find = (r: string): [string, KitItem] | null => {
    const [kit, id] = r.split(":");
    const item = KITS[kit]?.items.find((i) => i.id === id);
    return item ? [kit, item] : null;
  };
  const found = find(ref) ?? find(FALLBACK[ref] ?? "") ?? find("common:crate")!;
  const [kit, item] = found;
  const made = item.make();
  let obj: THREE.Object3D;
  if (made instanceof THREE.Object3D) obj = made;
  else {
    const map = colours ? COLOURS[colours] : null;
    const geo: Geo = map ? made.map((part) => ({ geo: part.geo, mat: map[part.mat] ?? part.mat })) : made;
    obj = toThree(geo, material);
  }
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  p = { obj, foot: { x0: box.min.x, x1: box.max.x, y0: -box.max.z, y1: -box.min.z }, tags: item.tags ?? [], kit };
  protos.set(key, p);
  return p;
}

// The shapes a placed item blocks, in the world.
function solidsOf(pl: Placement, proto: Proto): SolidSpec[] {
  const a = (pl.h * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const toWorld = (lx: number, ly: number): [number, number] => [pl.x + (lx * c - ly * s) * pl.s, pl.y + (lx * s + ly * c) * pl.s];
  if (pl.solid === "none") return [];
  if (Array.isArray(pl.solid))
    return pl.solid.map((sp) => {
      const [x, y] = toWorld(sp.x, sp.y);
      return "r" in sp ? { ...sp, x, y, r: sp.r * pl.s } : { ...sp, x, y, w: sp.w * pl.s, d: sp.d * pl.s, rot: sp.rot + pl.h };
    });
  const t = proto.tags, f = proto.foot;
  if (t.includes("ground") || t.includes("boat")) return [];
  const w = f.x1 - f.x0, d = (f.y1 - f.y0) * pl.sy;
  if (proto.kit === "flora") {
    const [x, y] = toWorld(0, 0);
    return [{ kind: "tree", x, y, r: (w < 200 ? 35 : 42) * pl.s }];
  }
  const [x, y] = toWorld((f.x0 + f.x1) / 2, ((f.y0 + f.y1) / 2) * pl.sy);
  if (w < 130 && d < 130) return [{ kind: "post", x, y, r: (Math.max(w, d) / 2) * 0.7 * pl.s }];
  const k = t.includes("building") || t.includes("landmark") ? 0.94 : 1;
  return [{ kind: proto.tags[0] ?? "box", x, y, w: w * k * pl.s, d: d * k * pl.s, rot: pl.h }];
}

// ---- the city ----
export interface Town {
  level: Level;
  solids: SolidSpec[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  spawn: { x: number; y: number };
  npcs: NpcSpec[];
  warps: { x: number; y: number; r: number; to: string; arrive: { x: number; y: number } }[];
  closed: { x: number; y: number; r: number; text: string }[];
}

export function buildEden(quality: { flowers: number }): Town {
  const puts: Placement[] = [];
  const extra: SolidSpec[] = [];
  const put = (ref: string, at: [number, number], h = 0, o: Partial<Placement> = {}) =>
    puts.push({ ref, x: at[0], y: at[1], z: 0, h, s: 1, sy: 1, solid: "auto", ...o });
  const rnd = seeded(11);

  // ---- ground: roads (cobbles) and plazas (flagstones) ----
  const roads: Poly[] = [
    rect(70, 520, 610, 605),    // the west avenue, from the west gate to the crossroads
    rect(585, 75, 655, 560),    // the north avenue, from the north gate
    rect(585, 520, 680, 615),   // the crossroads
    rect(610, 560, 680, 1045),  // the south avenue, to the south gate
    rect(610, 560, 920, 615),   // round the fountain plaza
    rect(610, 920, 920, 1005),
    rect(860, 560, 920, 1005),
    rect(920, 560, 1085, 615),  // out to the harbour
    rect(905, 1000, 1085, 1050),
    rect(-200, 520, 70, 605),   // outside the gates
    rect(585, -200, 655, 75),
    rect(610, 1045, 680, 1300),
  ];
  const P1 = quarter(175, 145, 310, 255);   // the cathedral plaza
  const P2 = rect(695, 150, 835, 515);      // the market
  const P3 = quarter(150, 900, 280, -200);  // the hero's garden
  const P4 = rect(680, 655, 865, 915);      // the fountain plaza
  const plazas: Poly[] = [P1, P2, P3, P4, rect(1080, 20, 1140, 1095)]; // and the quay
  const SHORE = P(1140, 0)[1];
  const area = { x0: -15000, x1: 15500, y0: SHORE, y1: 17000 };
  const ground = buildPaved({ area, roads, plazas });

  // ---- the city wall: 8 m pieces between towers, gates cut into it ----
  const NORTH = P(0, 75)[0], SOUTH = P(0, 1045)[0], WEST = P(75, 0)[1], EAST = P(905, 0)[1];
  const GATE_N: [number, number] = [NORTH, P(620, 0)[1]];
  const GATE_S: [number, number] = [SOUTH, P(645, 0)[1]];
  const GATE_W: [number, number] = [P(0, 562)[0], WEST];
  // a straight run of wall from a to b (world), its outside facing `out`, skipping gaps
  const run = (a: [number, number], b: [number, number], out: Side, gaps: number[] = []) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
    const spans: [number, number][] = [];
    let from = 0;
    for (const g of [...gaps].sort((p, q) => p - q)) {
      spans.push([from, g - 790]);
      from = g + 790;
    }
    spans.push([from, L]);
    for (const [s0, s1] of spans) {
      for (let t = s0; t < s1 - 20; t += 800) {
        const len = Math.min(800, s1 - t), mid = t + len / 2;
        put("eden:city_wall", [a[0] + ux * mid, a[1] + uy * mid], FACE[out], { sy: len / 800 });
      }
    }
  };
  const corner = (x: number, y: number) => put("eden:wall_tower", [x, y], 0, { solid: [{ kind: "tower", x: 0, y: 0, r: 330 }] });
  run([NORTH, WEST], [NORTH, EAST], "n", [GATE_N[1] < WEST ? WEST - GATE_N[1] : 0]);
  run([NORTH, EAST], [P(0, 590)[0], EAST], "e");
  run([NORTH, WEST], [SOUTH, WEST], "w", [NORTH - GATE_W[0]]);
  run([SOUTH, WEST], [SOUTH, EAST], "s", [WEST - GATE_S[1]]);
  for (const [x, y] of [[NORTH, WEST], [NORTH, EAST], [SOUTH, WEST], [SOUTH, EAST], [P(0, 590)[0], EAST]] as [number, number][]) corner(x, y);
  // towers between: every 48 m or so along the long runs
  for (const y of [WEST - 4000, WEST - 8000, GATE_N[1] - 4000]) if (y > EAST + 1500) corner(NORTH, y);
  for (const x of [NORTH - 4400, GATE_W[0] - 4400]) corner(x, WEST);
  for (const y of [WEST - 4000, GATE_S[1] - 3000]) if (y > EAST + 1500) corner(SOUTH, y);
  corner((NORTH + P(0, 590)[0]) / 2, EAST);
  // gates: towers either side of an open passage along the gate's own X
  const gateSolid: SolidSpec[] = [
    { kind: "gate", x: 0, y: -470, w: 640, d: 580, rot: 0 },
    { kind: "gate", x: 0, y: 470, w: 640, d: 580, rot: 0 },
  ];
  put("eden:city_gate", GATE_N, 180, { solid: gateSolid });
  put("eden:city_gate", GATE_S, 0, { solid: gateSolid });
  put("eden:city_gate", GATE_W, -90, { solid: gateSolid });

  // ---- houses, as drawn: [u, v, facing, piece, colourway] ----
  const HOUSES: [number, number, Side, string, string?][] = [
    // north-west quarter: down the north avenue, along the west avenue
    [537, 160, "e", "corner_house"], [525, 237, "e", "townhouse"], [514, 312, "e", "tool_shop"],
    [525, 397, "e", "townhouse_narrow", "red"], [537, 487, "e", "corner_house", "red"], [477, 467, "s", "townhouse_narrow", "yellow"],
    [200, 460, "s", "row_houses"], [267, 465, "s", "townhouse", "red"], [328, 467, "s", "townhouse_narrow", "slate"],
    // north-east quarter: shop houses facing the north avenue
    [674, 207, "w", "townhouse_narrow", "cream"], [672, 265, "w", "cafe"], [668, 330, "w", "townhouse_narrow", "red"],
    [668, 395, "w", "townhouse_narrow", "yellow"], [668, 465, "w", "townhouse_narrow", "slate"],
    // south-west quarter: along the west avenue and down the south avenue
    [202, 632, "n", "row_houses", "red"], [325, 645, "n", "guild_hall"], [445, 650, "n", "townhouse", "cream"],
    [492, 648, "n", "townhouse_narrow"], [535, 655, "n", "corner_house", "slate"],
    [532, 735, "e", "weapon_shop"], [530, 822, "e", "townhouse", "red"], [535, 900, "e", "house"], [462, 915, "w", "townhouse_narrow", "cream"],
    // the fountain plaza
    [714, 690, "s", "inn"],
    // the harbour quarter
    [982, 247, "e", "yodia:customs_house"], [1052, 290, "e", "warehouse"], [992, 350, "e", "yodia:warehouse"],
    [1055, 402, "e", "house"], [990, 460, "e", "warehouse", "red"],
    [955, 712, "e", "warehouse"], [965, 835, "e", "townhouse_narrow", "red"], [968, 935, "e", "house"], [968, 1028, "e", "townhouse", "cream"],
  ];
  for (const [u, v, side, piece, colours] of HOUSES) {
    const ref = piece.includes(":") ? piece : piece === "house" ? "common:house" : `eden:${piece}`;
    put(ref, P(u, v), FACE[side], { colours });
  }
  put("eden:notice_board", P(381, 498), FACE.s);

  // ---- avenues: trees and lamps down both sides ----
  const avenue = (a: [number, number], b: [number, number], step: number, skip: (u: number, v: number) => boolean = () => false) => {
    const n = Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / step);
    for (let i = 0; i <= n; i++) {
      const u = a[0] + ((b[0] - a[0]) * i) / n, v = a[1] + ((b[1] - a[1]) * i) / n;
      if (skip(u, v)) continue;
      if (i % 2) put("eden:street_lamp", P(u, v), 0, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
      else put(rnd() < 0.5 ? "flora:RoundTree" : "flora:SmallTree", P(u, v), rnd() * 360, { s: 0.75 + rnd() * 0.2 });
    }
  };
  avenue([130, 528], [565, 528], 55);
  avenue([130, 597], [565, 597], 55);
  avenue([592, 130], [592, 500], 55);
  avenue([648, 130], [648, 500], 55);
  avenue([617, 650], [617, 1000], 55);
  avenue([673, 650], [673, 880], 55);
  // the crossroads: a lamp on each corner and banners
  for (const [u, v] of [[592, 528], [673, 528], [592, 608], [673, 608]]) put("eden:street_lamp", P(u, v), 45, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
  for (const [u, v] of [[575, 612], [690, 515]]) put("eden:banner_pole", P(u, v), facing(625 - u, 565 - v));

  // ---- the cathedral plaza (north-west) ----
  put("eden:cathedral", P(262, 232), facing(1, 1));
  for (const t of [0.12, 0.35, 0.6, 0.85]) {
    const a = t * (Math.PI / 2);
    put("eden:street_lamp", P(175 + 0.9 * 310 * Math.cos(a), 145 + 0.9 * 255 * Math.sin(a)), 0, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
    put(t < 0.5 ? "eden:park_bench" : "eden:flower_bed", P(175 + 0.75 * 310 * Math.cos(a + 0.2), 145 + 0.75 * 255 * Math.sin(a + 0.2)), facing(-Math.cos(a), -Math.sin(a)));
  }
  for (const [u, v] of [[310, 250], [270, 300]]) put("eden:banner_pole", P(u, v), facing(1, 1));
  put("eden:hero_statue", P(330, 300), facing(1, 1));
  // trees along the wall behind it
  for (const [u, v] of [[150, 150], [150, 260], [150, 370], [250, 120], [360, 120], [460, 120], [430, 300], [400, 360]])
    put(rnd() < 0.6 ? "flora:BigOak" : "flora:RoundTree", P(u, v), rnd() * 360, { s: 0.7 + rnd() * 0.2 });
  // the green between the plaza and the houses
  for (const [u, v] of [[380, 420], [450, 400], [300, 420]]) put("eden:flower_bed", P(u, v), 0);
  for (const [u, v] of [[470, 230], [470, 330], [415, 440]]) put("eden:topiary", P(u, v), 0);

  // ---- the market (north-east) ----
  for (let v = 180; v <= 490; v += 32) {
    put(v % 64 === 52 ? "eden:market_stall_fruit" : "eden:market_stall_cloth", P(722, v), FACE.e);
    put(v % 64 === 52 ? "eden:market_stall_cloth" : "eden:market_stall_fruit", P(808, v), FACE.w);
  }
  for (const v of [260, 420]) put("common:market_cart", P(765, v), FACE.s);
  for (const v of [210, 340, 470]) put("eden:street_lamp", P(765, v), 90, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
  put("eden:public_well", P(765, 168), 0);
  for (const u of [712, 818]) put("eden:banner_pole", P(u, 505), FACE.s);
  for (const v of [120, 200, 280, 360, 440, 520]) put(rnd() < 0.5 ? "flora:RoundTree" : "flora:SmallTree", P(855, v), rnd() * 360, { s: 0.8 });
  for (const [u, v] of [[700, 535], [745, 540], [790, 535], [835, 540]]) put("eden:flower_bed", P(u, v), 0);

  // ---- the hero's garden (south-west) ----
  put("eden:pergola", P(205, 760), FACE.e);
  for (const [u, v, f] of [[260, 790, "s"], [330, 840, "w"], [220, 860, "e"], [300, 760, "n"]] as [number, number, Side][]) put("eden:park_bench", P(u, v), FACE[f]);
  for (const [u, v] of [[190, 820], [360, 870], [280, 880]]) put("eden:flower_bed", P(u, v), 0);
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    put("eden:hedge", P(150 + 300 * Math.cos(a), 900 - 220 * Math.sin(a)), facing(Math.cos(a), -Math.sin(a)) + 90);
  }
  for (const [u, v] of [[175, 700], [400, 760], [430, 860], [160, 930], [300, 940]]) put(rnd() < 0.5 ? "flora:RoundTree" : "flora:Cherry", P(u, v), rnd() * 360, { s: 0.75 });
  for (const [u, v] of [[240, 720], [330, 720], [400, 700]]) put("eden:topiary", P(u, v), 0);
  for (const [u, v] of [[130, 1000], [250, 1010], [380, 1010], [500, 990]]) put("flora:BigOak", P(u, v), rnd() * 360, { s: 0.7 });

  // ---- the fountain plaza (south-east) ----
  put("eden:fountain", P(780, 800), 0, { solid: [{ kind: "fountain", x: 0, y: 0, r: 320 }] });
  for (const [u, v] of [[700, 670], [855, 670], [700, 905], [855, 905]]) put("eden:street_lamp", P(u, v), 45, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
  for (const [du, dv] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) put("eden:park_bench", P(780 + du * 48, 800 + dv * 42), facing(-du, -dv));
  for (const [u, v] of [[700, 760], [700, 860], [855, 760], [855, 860]]) put("eden:flower_bed", P(u, v), 0);
  for (const [u, v] of [[760, 680], [800, 680], [840, 690]]) put("eden:cafe_table", P(u, v), rnd() * 90);
  put("eden:kiosk", P(700, 632), FACE.w);
  for (const [u, v] of [[890, 640], [890, 980], [635, 1030]]) put("flora:RoundTree", P(u, v), rnd() * 360, { s: 0.8 });

  // ---- gates: guard posts, banners ----
  put("eden:guard_post", P(570, 100), FACE.s);
  put("eden:guard_post", P(670, 100), FACE.s);
  put("eden:guard_post", P(100, 500), FACE.e);
  put("eden:guard_post", P(100, 625), FACE.e);
  put("eden:guard_post", P(600, 1020), FACE.n);
  put("eden:guard_post", P(690, 1020), FACE.n);

  // ---- the harbour: quay, piers, ships, cargo, the lighthouse ----
  for (let v = 30; v < 1095; v += 800 / S) put("eden:quay_wall", [P(0, v + 400 / S)[0], SHORE + 210], 90, { solid: "none" });
  const PIERS = [160, 300, 455];
  for (const v of PIERS) for (let i = 0; i < 6; i++) put("eden:pier", [P(0, v)[0], SHORE - 200 - 400 * i], 90, { z: -30, solid: "none" });
  put("yodia:ship", [P(0, 300)[0] - 470, SHORE - 1500], 90, { z: -12 });
  put("eden:sailboat", [P(0, 160)[0] + 380, SHORE - 900], 90, { z: -42 });
  put("eden:sailboat", [P(0, 455)[0] - 380, SHORE - 1300], -90, { z: -42 });
  put("eden:rowboat", [P(0, 455)[0] + 260, SHORE - 500], 80, { z: -30 });
  put("eden:rowboat", [P(0, 160)[0] - 260, SHORE - 700], 100, { z: -30 });
  put("eden:rowboat", [P(0, 700)[0], SHORE - 400], 30, { z: -30 });
  put("eden:lighthouse", [P(0, 30)[0] - 300, SHORE - 900], 0, { z: -60 });
  put("yodia:crane", [P(0, 340)[0], SHORE + 300], 90);
  for (let v = 60; v < 1090; v += 110) put("yodia:harbour_lamp", P(1128, v), 90, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
  for (const [u, v] of [[1095, 200], [1100, 330], [1095, 520], [1000, 600], [1100, 760], [1095, 990]]) put("eden:cargo_stack", P(u, v), rnd() * 90);
  for (const [u, v] of [[1110, 250], [1110, 600], [1110, 880]]) put("common:crate", P(u, v), rnd() * 90);
  // the sea is solid except along the piers
  const seaX0 = P(0, 1100)[0], seaX1 = P(0, 10)[0];
  const cuts = PIERS.map((v) => P(0, v)[0]).sort((p, q) => p - q);
  let x = seaX0;
  for (const cx of [...cuts, seaX1 + 200]) {
    const x1 = Math.min(cx - 150, seaX1);
    if (x1 > x) extra.push({ kind: "sea", x: (x + x1) / 2, y: SHORE - 1400, w: x1 - x, d: 2800, rot: 0 });
    x = cx + 150;
  }
  // the pier ends
  for (const cx of cuts) extra.push({ kind: "sea", x: cx, y: SHORE - 2700, w: 400, d: 200, rot: 0 });

  // ---- outside the walls: woods ----
  const WOODS = ["RoundTree", "BigOak", "SmallTree", "RoundTree", "Pine"];
  const woods: [number, number][] = [];
  for (let i = 0; i < 2600 && woods.length < 150; i++) {
    const x = -14000 + rnd() * 28500, y = SHORE + 200 + rnd() * (17000 - SHORE - 200);
    const inside = x > SOUTH - 900 && x < NORTH + 900 && y < WEST + 900;
    const harbour = y < EAST + 300 && x > SOUTH - 1500;
    const road = (Math.abs(y - GATE_N[1]) < 900 && x > NORTH) || (Math.abs(y - GATE_S[1]) < 900 && x < SOUTH) || (Math.abs(x - GATE_W[0]) < 900 && y > WEST);
    if (inside || harbour || road || woods.some(([ox, oy]) => Math.hypot(ox - x, oy - y) < 450)) continue;
    woods.push([x, y]);
    put(`flora:${WOODS[Math.floor(rnd() * WOODS.length)]}`, [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.4, solid: "none" });
  }

  // ---- build: one instanced mesh per piece, material and 50 m block ----
  const root = new THREE.Group();
  root.add(ground.mesh);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(40000, 12000).rotateX(-Math.PI / 2), material("WaterSea"));
  sea.position.set(0, -12, -(SHORE - 6000));
  sea.receiveShadow = true;
  root.add(sea);
  const groups = new Map<string, Placement[]>();
  for (const pl of puts) {
    const key = `${pl.ref}|${pl.colours ?? ""}|${Math.floor(pl.x / 5000)},${Math.floor(pl.y / 5000)}`;
    const list = groups.get(key);
    if (list) list.push(pl);
    else groups.set(key, [pl]);
  }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  for (const list of groups.values()) {
    const proto = protoOf(list[0].ref, list[0].colours);
    const mats = list.map((pl) => m.clone().compose(new THREE.Vector3(pl.x, pl.z, -pl.y), q.setFromAxisAngle(up, (pl.h * Math.PI) / 180).clone(), new THREE.Vector3(pl.s, pl.s, pl.s * pl.sy)));
    proto.obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const inst = new THREE.InstancedMesh(mesh.geometry, mesh.material, mats.length);
      mats.forEach((M, i) => inst.setMatrixAt(i, M.clone().multiply(mesh.matrixWorld)));
      inst.castShadow = mesh.castShadow;
      inst.receiveShadow = mesh.receiveShadow;
      if (mesh.customDepthMaterial) inst.customDepthMaterial = mesh.customDepthMaterial;
      inst.computeBoundingSphere();
      root.add(inst);
    });
  }
  // flowers on the open grass inside the walls
  const solids: SolidSpec[] = [...extra];
  for (const pl of puts) solids.push(...solidsOf(pl, protoOf(pl.ref, pl.colours)));
  const open = (x: number, y: number) => ground.kind(x, y) === 0 && x < NORTH - 500 && x > SOUTH + 500 && y < WEST - 500 && y > EAST - 3000;
  root.add(flowerFields(open, { x: SOUTH, y: SHORE, w: NORTH - SOUTH, h: WEST - SHORE }, 0.35 * quality.flowers));

  // the north and south gates are shut for now: a bar across the far end of each passage
  solids.push({ kind: "closed", x: GATE_N[0] + 420, y: GATE_N[1], w: 200, d: 520, rot: 0 });
  solids.push({ kind: "closed", x: GATE_S[0] - 420, y: GATE_S[1], w: 200, d: 520, rot: 0 });

  const bounds = { minX: SOUTH - 700, maxX: NORTH + 700, minY: SHORE - 2800, maxY: WEST + 1400 };
  const spawn = { x: P(780, 740)[0], y: P(780, 740)[1] };
  const warps = [{ x: GATE_W[0], y: WEST + 1050, r: 160, to: "field", arrive: { x: 420, y: -520 } }];
  return {
    level: { root, sky: "#4f6e36", warps },
    solids,
    bounds,
    spawn,
    npcs: edenNpcs(),
    warps,
    closed: [
      { x: GATE_N[0] + 250, y: GATE_N[1], r: 260, text: "ประตูเหนือปิดซ่อมอยู่ ทางไปปราสาทยังไม่เปิด" },
      { x: GATE_S[0] - 250, y: GATE_S[1], r: 260, text: "ประตูใต้ยังไม่เปิด ทางไปทะเลทรายบาฮามัสกำลังสำรวจ" },
    ],
  };
}

// ---- townsfolk, where the plan put its red dots ----
function edenNpcs(): NpcSpec[] {
  const at = (u: number, v: number) => {
    const [x, y] = P(u, v);
    return { x, y };
  };
  const guard = (top: string) => ({ gender: "male", hair: "", hairColor: "ink", eyes: "blue", top, bottom: "bottom_warrior_black" });
  return [
    { id: "guard_n1", ...at(578, 125), face: 180, name: "ทหารยามโรแลนด์", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_navy"),
      lines: ["ประตูเหนือปิดซ่อมอยู่ ทางไปปราสาทยังไม่เปิดนะ", "ถ้าจะออกไปล่ามอนสเตอร์ ใช้ประตูตะวันตกสิ"] },
    { id: "guard_n2", ...at(662, 125), face: 180, name: "ทหารยามเกรเกอร์", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_navy"),
      lines: ["อีเดนเป็นเมืองหลวงของอาณาจักร ยินดีต้อนรับ", "เดินตรงลงไปจะเจอสี่แยกกลางเมือง"] },
    { id: "guard_w1", ...at(150, 515), face: -90, name: "ทหารยามเฮนริก", title: "ทหารยามประตูตะวันตก", role: "talk", look: guard("top_warrior"),
      lines: ["ออกประตูนี้ไปเป็นทุ่งหญ้าตะวันตก มีสไลม์อยู่เยอะ", "เดินเข้าวงแสงสีฟ้าตรงหน้าประตูเพื่อออกไปข้างนอก"] },
    { id: "guard_w2", ...at(150, 610), face: -90, name: "ทหารยามอลัน", title: "ทหารยามประตูตะวันตก", role: "talk", look: guard("top_warrior"),
      lines: ["สไลม์สีม่วงแรงกว่าสีอื่นนะ ระวังด้วย", "ถ้าบาดเจ็บ กลับมาหานักบวชที่สี่แยกได้"] },
    { id: "guide", ...at(560, 535), face: -135, name: "ลีน่า", title: "ผู้นำทาง", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "gold", eyes: "blue", top: "top_adventurer_teal", bottom: "bottom_adventurer_sand" },
      lines: ["ที่นี่คือสี่แยกกลางเมืองอีเดน", "มหาวิหารอยู่ทางตะวันตกเฉียงเหนือ ตลาดอยู่ตะวันออกเฉียงเหนือ", "ลานน้ำพุกับร้านเครื่องมืออยู่ทางตะวันออกเฉียงใต้ ท่าเรืออยู่ริมทะเลฝั่งตะวันออก", "ทุ่งล่าสไลม์ออกทางประตูตะวันตก"] },
    { id: "healer", ...at(545, 625), face: -45, name: "ซิสเตอร์มาเรีย", title: "นักบวช · รักษาฟรี", role: "heal",
      look: { gender: "female", hair: "twintail", hairColor: "silver", eyes: "teal", top: "top_priestess_white", bottom: "bottom_priestess_white" },
      lines: ["ขอพรแห่งแสงจงคุ้มครองท่าน", "หายเหนื่อยแล้วนะ ไปผจญภัยต่อได้"] },
    { id: "adventurer", ...at(662, 515), face: 135, name: "คาร่า", title: "นักผจญภัย", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "rose", eyes: "amber", top: "top_adventurer", bottom: "bottom_adventurer" },
      lines: ["ได้ยินว่าโยเดียทางใต้มีเรือสินค้าลำใหญ่มาก", "ฉันกำลังรอเรือไปเกาะโอซากิ แต่ยังไม่ออกสักที"] },
    { id: "merchant_boy", ...at(672, 560), face: 90, name: "ทอม", title: "เด็กส่งของ", role: "talk", look: guard("top_warrior_forest"),
      lines: ["ร้านอาวุธอยู่ถนนใต้ ร้านเครื่องมืออยู่ลานน้ำพุ", "ตลาดทางเหนือมีผ้ากับผลไม้ขายเยอะเลย"] },
    { id: "guard_s", ...at(590, 690), face: -90, name: "ทหารยามบรูโน", title: "ทหารยามลาดตระเวน", role: "talk", look: guard("top_warrior_navy"),
      lines: ["ประตูใต้ยังไม่เปิด ทางไปทะเลทรายกำลังสำรวจอยู่", "ระวังของหายนะ ตลาดคนเยอะ"] },
    { id: "shop", ...at(676, 640), face: 90, name: "ลิเลีย", title: "ร้านเครื่องมือ", role: "shop", sprite: "merchant",
      lines: ["ยา เสื้อผ้า คัมภีร์ มีครบ เข้ามาดูก่อนได้"] },
    { id: "sailor", ...at(1112, 455), face: 90, name: "กัปตันมาร์โก", title: "กะลาสี", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "amber", top: "top_warrior", bottom: "bottom_warrior" },
      lines: ["ท่าเรืออีเดนรับเรือจากทุกทิศ", "เรือไปโยเดีย ไอซ์เบิร์ก และโอซากิ ยังไม่เปิดให้บริการนะ รออีกหน่อย"] },
  ];
}

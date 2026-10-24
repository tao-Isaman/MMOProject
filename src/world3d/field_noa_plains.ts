// ที่ราบใต้โนอา (the plain south of Noa), monsters Lv 40-50: the farmland between Noa and Venezia,
// down to the shore of Venezia's lagoon. The old royal road, still paved with its cobbles and lined
// with milestones and cypresses, comes down from Noa at the middle of the north side, sweeps
// south-west across the wheat to a humpbacked stone bridge over the river, and runs on down to the
// lagoon's shore and along it out of the south-east corner for Venezia. Where a farm road turns
// off west for the lagoon marsh a wayside shrine stands at the fork. The river crosses the whole
// plain from east to west on its way to the marsh. The whole south side is the lagoon's shore: a
// strip of sand with reeds, the lagoon beyond with its channel markers, and the land comes round
// to the edge only at the south-east corner, where the road goes. Over the east of the plain
// strides the old aqueduct that fed Noa: a double arcade on the flat, a gap where it has fallen at
// each end of a long ridge it runs along on a single tier, and a bay straddling the river; a ramp
// climbs the ridge to walk beside it. In the north-west the land steps up onto a terrace of
// vineyards, and the farmstead looks out over the road from its edge.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: north -> noa, south-east corner -> venezia, west -> lagoon_marsh

import * as THREE from "three";
import { FieldBuilder } from "./field";
import { buildPaved } from "./paved";
import type { Town } from "./town";
import { useKits } from "./town";
import { KIT as WESTFARM, BRIDGE, smooth, band, dense, inPoly, toLine, nearestOn, towards, lengthwise, along, wallRun } from "./kits/westfarm";
import type { XY } from "./kits/westfarm";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as VENEZIA } from "./kits/venezia";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(WESTFARM, PLAINS, TRUNRADA, VENEZIA);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the royal road, north to south-east, and the bridge on it ----
const BR: XY = [-1900, -1450];
const ROYAL: XY[] = smooth([[A, 300], [7400, 250], [5150, 250], [3700, 500], [2200, 250], [800, -250], [-500, -950], [-1150, -1340], BR, [-2650, -1580], [-3600, -2300], [-4300, -3400], [-4800, -4200], [-5150, -4900], [-5700, -5900], [-6600, -7200], [-A, -8200]]);
const RW = 560; // its width
const BRIDGE_DIR = nearestOn(ROYAL, BR).dir;
// the river, east to west, square to the road at the bridge
const RIVER_DIR: XY = [BRIDGE_DIR[1], -BRIDGE_DIR[0]];
const RIVER: XY[] = smooth([[-2600, -A], [-2300, -6500], [-1600, -4900], [-1500, -3500], [BR[0] - RIVER_DIR[0] * 800, BR[1] - RIVER_DIR[1] * 800], BR, [BR[0] + RIVER_DIR[0] * 800, BR[1] + RIVER_DIR[1] * 800], [-2000, 700], [-2500, 2300], [-2000, 4000], [-2400, 5800], [-2100, A]], 150);
const SW = BRIDGE.river;

// ---- the aqueduct: a straight line from past the south-east corner to past the north edge ----
const AQ0: XY = [-6600, -6500], AQ1: XY = [7600, -1500];
const AQL = Math.hypot(AQ1[0] - AQ0[0], AQ1[1] - AQ0[1]);
const AU: XY = [(AQ1[0] - AQ0[0]) / AQL, (AQ1[1] - AQ0[1]) / AQL], AN: XY = [-AU[1], AU[0]]; // along it; across it (west)
const aqAt = (s: number, off = 0): XY => [AQ0[0] + AU[0] * s + AN[0] * off, AQ0[1] + AU[1] * s + AN[1] * off];
// the ridge it runs along: from SR0 to SR1 along the line, wide on the west side
const SR0 = 6700, SR1 = 9950, SRM = (SR0 + SR1) / 2;
const RIDGE: XY[] = [aqAt(SR0, -260), aqAt(SR0 + 350, -340), aqAt(SRM, -330), aqAt(SR1 - 350, -340), aqAt(SR1, -260), aqAt(SR1 + 120, 300), aqAt(SR1 - 150, 900), aqAt(SRM + 600, 1000), aqAt(SRM - 600, 1000), aqAt(SR0 + 200, 950), aqAt(SR0 - 150, 420)];
const RR = { top: aqAt(SRM, 1000), bottom: aqAt(SRM, 2250), width: 460 };

// ---- the lagoon: its shore from past the south-east corner (beside the road) along the whole
// south side and round past the south-west corner; the water south of it ----
const SHORE: XY[] = [
  [-A - 400, -8600], [-7300, -6700], [-6600, -6100], [-6100, -5550], [-5650, -4900], [-5300, -4300], [-4900, -3650], [-4500, -3050],
  [-4350, -2300], [-4450, -1500], [-4300, -500], [-4450, 500], [-4300, 1600], [-4450, 2700], [-4350, 3800], [-4500, 4800],
  [-4900, 5500], [-5600, 5900], [-6600, 6100], [-A - 400, 6200],
];
const SEA: XY[] = [...SHORE, [-A - 400, -A - 400]];

// ---- the vineyard terrace in the north-west, the farmstead on its edge ----
const VT: XY[] = [[1500, 2200], [3300, 1600], [4800, 2000], [6000, 1800], [A, 2000], [A, A], [3000, A], [2500, 6400], [1600, 4600], [1200, 3300]];
const RV = { top: [2400, 1900] as XY, bottom: [2154, 1160] as XY, width: 460 };
const FARM: XY = [2500, 3050];

// ---- the farm roads ----
const FORK: XY = [800, -250];
const WEST: XY[] = smooth([FORK, [400, 600], [-150, 1900], [-650, 3200], [-1000, 4300], [-1100, 5150], [-1200, 7600]]);
const VINE_WAY: XY[] = [...smooth([[2650, 330], [2350, 700], along(RV.bottom, RV.top, -400)]), RV.bottom, RV.top, ...smooth([along(RV.bottom, RV.top, 1150), [2150, 2500], [FARM[0] - 650, FARM[1] - 350]])];
const RIDGE_WAY: XY[] = [...smooth([[-150, -700], [150, -1050], along(RR.bottom, RR.top, -400)]), RR.bottom, RR.top, ...smooth([along(RR.bottom, RR.top, 1600), aqAt(SRM + 400, 600), aqAt(SRM + 1100, 520)])];
const TRACKS = [WEST, VINE_WAY, RIDGE_WAY];

const WAY_N: XY = [5150, 250], WAY_S: XY = [-5150, -4900], WAY_W: XY = [-1100, 5150];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(302, {
    hills: [
      // the rise the bridge stands on (its deck follows it)
      { x: BR[0], y: BR[1], r: BRIDGE.R, h: BRIDGE.H },
      { x: 3800, y: -400, r: 1100, h: 90 }, { x: -3000, y: 1500, r: 1100, h: 110 }, { x: -3300, y: 4300, r: 900, h: 90 },
      { x: 300, y: 3300, r: 900, h: 70 }, { x: -3500, y: -4700, r: 900, h: 90 }, { x: 4400, y: -4400, r: 1100, h: 110 },
      { x: 600, y: -3800, r: 800, h: -50 },
      // the land rolling on past the edge (the lagoon past the south one)
      { x: -7800, y: 8400, r: 2000, h: 220 }, { x: 2000, y: -7500, r: 2200, h: 280 }, { x: -1500, y: 7600, r: 1800, h: 200 },
    ],
    plateaus: [
      { poly: dense(VT), h: 240, ramps: [RV] },
      { poly: dense(RIDGE, 500), h: 400, ramps: [RR] },
    ],
    rock: "CliffMoss",
  });
  const { put, rnd } = f;
  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const water = [band(RIVER, SW), SEA];
  // the farm roads are earth; the royal road is laid over them on its own ground of cobbles
  // (shown only along the road: the rest of that layer is cut away either side of it)
  const ground = f.ground({ area, roads: [...TRACKS.map((t) => band(t, 400)), band(ROYAL, RW - 160)], plazas: [], water, base: "grass", road: [0.94, 0.87, 0.78] });
  const edge = (side: number): XY[] => {
    const out: XY[] = [];
    for (let i = 0; i < ROYAL.length; i++) {
      const a = ROYAL[Math.max(0, i - 1)], b = ROYAL[Math.min(ROYAL.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      out.push([ROYAL[i][0] - ((b[1] - a[1]) / L) * side * (RW / 2 + 70), ROYAL[i][1] + ((b[0] - a[0]) / L) * side * (RW / 2 + 70)]);
    }
    return out;
  };
  const cobbles = buildPaved({
    area, roads: [band(ROYAL, RW)], plazas: [], track: false, base: "grass", road: [0.8, 0.76, 0.69],
    height: (x, y) => f.h(x, y) + 3,
    // (edge(-1) runs along the road's west side, edge(1) its east)
    water: [[...edge(-1), [-A, A], [A, A]], [...edge(1), [-A, -A], [A, -A]], ...water],
  });
  cobbles.mesh.renderOrder = 1;

  // ---- placing things: clear of the roads, the water, the cliffs and each other ----
  const taken: [number, number, number][] = [];
  const nearRoad = (x: number, y: number, d: number) => toLine(x, y, ROYAL) < d + RW / 2 - 200 || TRACKS.some((t) => toLine(x, y, t) < d);
  // (the river, the lagoon, and its beach)
  const wet = (x: number, y: number, d: number) => toLine(x, y, RIVER) < SW / 2 + d || inPoly(SEA, x, y) || toLine(x, y, SHORE) < d + 450;
  const free = (x: number, y: number, r: number, gap = 0) =>
    !nearRoad(x, y, r + 230) && !wet(x, y, r + 60) && f.level(x, y, Math.min(r, 220)) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    taken.push([at[0], at[1], r]);
  };

  // ---- the ways out ----
  f.exit("noa", WAY_N, [4450, 330]);
  f.exit("venezia", WAY_S, [-4550, -3800]);
  f.exit("lagoon_marsh", WAY_W, [-1050, 4450]);
  prop("plains:signpost", [4700, -230], 0, 80);
  prop("plains:signpost", [-4600, -4700], 50, 80);
  prop("plains:signpost", [-650, 4800], -90, 80);

  // ---- the lagoon's shore: sand along it (laid over the grass between the shore and a line a few
  // metres in), the water closed off, reeds and stones on the sand, channel markers and a moored
  // gondola out on the water ----
  const inland = SHORE.map(([x, y], i): XY => {
    const a = SHORE[Math.max(0, i - 1)], b = SHORE[Math.min(SHORE.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    if (inPoly(SEA, x + nx * 150, y + ny * 150)) [nx, ny] = [-nx, -ny];
    return [nx, ny];
  });
  const BEACH_IN: XY[] = SHORE.map(([x, y], i) => {
    const w = 380 + 150 * Math.sin(i * 2.3);
    return [x + inland[i][0] * w, y + inland[i][1] * w];
  });
  const beach = buildPaved({
    area: { x0: -A, x1: -2000, y0: -A, y1: A }, roads: [], plazas: [], base: "sand", cell: 100, height: (x, y) => f.h(x, y) + 3,
    water: [SEA, [...BEACH_IN, [-A - 400, A + 400], [-2000, A + 400], [-2000, -A - 400], [-A - 400, -A - 400]], band(ROYAL, RW)],
  });
  beach.mesh.renderOrder = 1;
  const SHORE_IN = SHORE.filter(([x, y]) => Math.abs(x) < R + 600 && Math.abs(y) < R + 600);
  f.blockBand(SHORE_IN.map(([x, y]) => {
    const i = SHORE.findIndex((p) => p[0] === x && p[1] === y);
    return [x - inland[i][0] * 260, y - inland[i][1] * 260] as XY;
  }), 520, { kind: "sea" });
  for (let i = 0; i + 1 < SHORE.length; i++) {
    const [ax, ay] = SHORE[i], [bx, by] = SHORE[i + 1], n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 420));
    for (let k = 0; k < n; k++) {
      const t = (k + rnd()) / n, w = 60 + rnd() * 220, x = ax + (bx - ax) * t + inland[i][0] * w, y = ay + (by - ay) * t + inland[i][1] * w;
      if (Math.abs(x) > A - 300 || Math.abs(y) > A - 300 || nearRoad(x, y, 120)) continue;
      const k2 = rnd();
      put(k2 < 0.55 ? "plains:reeds" : k2 < 0.8 ? "plains:tall_grass" : "plains:flat_rock", [x, y], rnd() * 360, { s: k2 < 0.8 ? 0.9 + rnd() * 0.5 : 0.45 + rnd() * 0.2, solid: "none" });
    }
  }
  for (const at of [[-5900, -2600], [-6200, 400], [-5900, 3200], [-6200, -4200]] as XY[]) put("venezia:mooring_poles", at, rnd() * 360, { solid: "none" });
  put("venezia:gondola", [-5320, -3850], 58, { z: -14, solid: "none" });
  put("venezia:mooring_pole", [-4850, -3200], 0, { solid: "none" });

  // ---- the river and the bridge ----
  const scenery: THREE.Object3D[] = [cobbles.mesh, beach.mesh, f.waterSheet({ x0: -A - 2500, x1: 1000, y0: -A - 2500, y1: A + 2500 }, -14, "WaterSea")];
  const cut = 300;
  const parts: XY[][] = [[]];
  for (const p of RIVER) {
    if (Math.hypot(p[0] - BR[0], p[1] - BR[1]) < cut) {
      if (parts[parts.length - 1].length) parts.push([]);
    } else parts[parts.length - 1].push(p);
  }
  for (const part of parts) if (part.length > 1) f.blockBand(part, SW + 60, { step: 220 });
  const bh = (Math.atan2(BRIDGE_DIR[1], BRIDGE_DIR[0]) * 180) / Math.PI;
  prop("westfarm:stone_bridge", BR, bh, 700, {
    z: BRIDGE.sink - BRIDGE.H,
    solid: [
      { kind: "rail", x: 0, y: -255, w: 1300, d: 30, rot: 0 }, { kind: "rail", x: 0, y: 255, w: 1300, d: 30, rot: 0 },
      { kind: "post", x: -626, y: -255, r: 34 }, { kind: "post", x: 626, y: -255, r: 34 }, { kind: "post", x: -626, y: 255, r: 34 }, { kind: "post", x: 626, y: 255, r: 34 },
    ],
  });
  // reeds, stones and willows-to-be along the banks
  for (let i = 2; i < RIVER.length - 2; i += 2) {
    const [ax, ay] = RIVER[i], [bx, by] = RIVER[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / L, ny = (bx - ax) / L;
    for (const s of [-1, 1]) {
      const off = SW / 2 + 70 + rnd() * 80, x = ax + nx * s * off, y = ay + ny * s * off;
      if (Math.hypot(x - BR[0], y - BR[1]) < 1300 || Math.abs(y) > A - 300 || nearRoad(x, y, 250) || !f.level(x, y, 90)) continue;
      const k = rnd();
      put(k < 0.6 ? "plains:reeds" : k < 0.85 ? "plains:tall_grass" : "plains:flat_rock", [x, y], rnd() * 360, { s: k < 0.85 ? 0.9 + rnd() * 0.4 : 0.5, solid: "none" });
    }
  }
  // by the bridge, close to the water: reeds and rocks hiding the banks' rise
  for (const s of [-1, 1])
    for (const e of [-1, 1])
      for (const d of [700, 950]) {
        const x = BR[0] + BRIDGE_DIR[0] * e * 330 + RIVER_DIR[0] * s * d, y = BR[1] + BRIDGE_DIR[1] * e * 330 + RIVER_DIR[1] * s * d;
        put(d > 800 ? "plains:reeds" : "plains:flat_rock", [x, y], rnd() * 360, { s: d > 800 ? 1.1 : 0.55, solid: "none" });
      }

  // ---- the aqueduct: bays every 8 m from a bay that straddles the river ----
  let sx = 0, best = Infinity;
  for (let s = 3000; s < 7000; s += 10) {
    const [x, y] = aqAt(s), d = toLine(x, y, RIVER);
    if (d < best) [best, sx] = [d, s];
  }
  const ah = lengthwise(AU[0], AU[1]);
  const tallSolid: SolidSpec[] = [{ kind: "pier", x: 0, y: -355, w: 300, d: 92, rot: 0 }, { kind: "pier", x: 0, y: 355, w: 300, d: 92, rot: 0 }];
  const lowSolid: SolidSpec[] = [{ kind: "wall", x: 0, y: 0, w: 260, d: 800, rot: 0 }];
  const ruinSolid: SolidSpec[] = [{ kind: "pier", x: 0, y: -355, w: 290, d: 92, rot: 0 }, { kind: "pier", x: 0, y: 355, w: 290, d: 92, rot: 0 }, { kind: "rubble", x: 0, y: 40, r: 150 }];
  // bays (counted from the one over the river) that have fallen, and which way their standing
  // pier is (toward the arcade that goes on)
  const RUINS = new Map([[-3, ah], [7, ah + 180], [12, ah]]);
  for (let k = -12; k <= 20; k++) {
    const s = sx + k * 800, at = aqAt(s);
    if (Math.abs(at[0]) > A - 300 || Math.abs(at[1]) > A - 300) continue;
    if (s > SR0 + 560 && s < SR1 - 560) {
      prop("westfarm:aqueduct_low", at, ah, 450, { solid: lowSolid });
    } else if (s > SR0 - 760 && s < SR1 + 760) {
      // the cliff at each end of the ridge: the arcade has fallen there
      if (s < SR0 - 380 || s > SR1 + 380) prop("westfarm:aqueduct_ruin", at, s < SR0 ? ah : ah + 180, 450, { solid: ruinSolid });
    } else if (RUINS.has(k)) {
      prop("westfarm:aqueduct_ruin", at, RUINS.get(k)!, 450, { solid: ruinSolid });
    } else prop("westfarm:aqueduct", at, ah, 450, { solid: tallSolid });
  }

  // ---- the shrine at the fork, milestones and cypresses along the royal road ----
  const SHRINE: XY = [FORK[0] + 500, FORK[1] + 650];
  prop("westfarm:wayside_shrine", SHRINE, towards(-0.6, -0.8), 160, { solid: [{ kind: "shrine", x: 0, y: 0, w: 140, d: 140, rot: 0 }] });
  prop("common:bench", [SHRINE[0] + 230, SHRINE[1] + 140], 200, 100);
  prop("flora:BigOak", [SHRINE[0] + 700, SHRINE[1] + 500], 30, 280, { s: 1.1, solid: [{ kind: "tree", x: 0, y: 0, r: 48 }] });
  {
    let walked = 0, next = 900, side = 1, k = 0;
    for (let i = 1; i < ROYAL.length; i++) {
      const [ax, ay] = ROYAL[i - 1], [bx, by] = ROYAL[i], L = Math.hypot(bx - ax, by - ay);
      walked += L;
      if (walked < next) continue;
      next += 1100;
      const ux = (bx - ax) / L, uy = (by - ay) / L, nx = -uy, ny = ux;
      if (Math.abs(bx) > R + 1500 || Math.abs(by) > R + 1500) continue;
      if (Math.hypot(bx - BR[0], by - BR[1]) < 1200 || Math.hypot(bx - FORK[0], by - FORK[1]) < 900) continue;
      k++;
      // a milestone every other stop, the cypresses in pairs at the rest
      if (k % 2) {
        const at: XY = [bx + nx * side * (RW / 2 + 110), by + ny * side * (RW / 2 + 110)];
        if (free(at[0], at[1], 40) || (Math.abs(bx) > R && !wet(at[0], at[1], 0))) prop("plains:milestone", at, towards(-nx * side, -ny * side), 60);
        side = -side;
      } else
        for (const s of [-1, 1]) {
          const at: XY = [bx + nx * s * (RW / 2 + 230), by + ny * s * (RW / 2 + 230)];
          if (!wet(at[0], at[1], 120) && f.level(at[0], at[1], 100) && !TRACKS.some((t) => toLine(at[0], at[1], t) < 320) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - at[0], ty - at[1]) < tr + 60))
            prop("westfarm:cypress", at, rnd() * 360, 90, { s: 0.85 + rnd() * 0.3, solid: [{ kind: "tree", x: 0, y: 0, r: 34 }] });
        }
    }
  }

  // ---- the vineyard terrace and the farmstead ----
  prop("westfarm:farmhouse", FARM, towards(-1, -0.25), 900, {
    solid: [{ kind: "building", x: 0, y: -210, w: 660, d: 840, rot: 0 }, { kind: "building", x: 10, y: 520, w: 620, d: 660, rot: 0 }, { kind: "box", x: -375, y: -330, w: 120, d: 560, rot: 0 }],
  });
  prop("trunrada:cart", [FARM[0] - 450, FARM[1] + 1000], 30, 230);
  prop("plains:hay_bales", [FARM[0] - 300, FARM[1] + 1350], 70, 240);
  prop("common:crate", [FARM[0] - 650, FARM[1] - 800], 20, 60);
  prop("common:crate", [FARM[0] - 700, FARM[1] - 720], 50, 60);
  prop("trunrada:haystack", [FARM[0] + 900, FARM[1] + 1300], 0, 200);
  prop("westfarm:cypress", [FARM[0] + 300, FARM[1] - 800], 0, 90, { solid: [{ kind: "tree", x: 0, y: 0, r: 34 }] });
  prop("westfarm:cypress", [FARM[0] + 900, FARM[1] - 700], 0, 90, { s: 1.1, solid: [{ kind: "tree", x: 0, y: 0, r: 34 }] });
  // rows of vines across the terrace in blocks, a lane between
  const vines = (c: XY, rows: number, pieces: number, h = 0) => {
    const a = (h * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a); // across the rows
    for (let r = 0; r < rows; r++)
      for (let p = 0; p < pieces; p++) {
        const across = (r - (rows - 1) / 2) * 260, alongRow = (p - (pieces - 1) / 2) * 800;
        const x = c[0] + ux * across - uy * alongRow, y = c[1] + uy * across + ux * alongRow;
        if (!inPoly(VT, x, y) || !f.level(x, y, 160) || nearRoad(x, y, 300) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + 200)) continue;
        put("westfarm:vineyard_row", [x, y], h, { solid: [{ kind: "fence", x: 0, y: 0, w: 60, d: 800, rot: 0 }] });
      }
  };
  vines([3700, 3900], 6, 3);
  vines([4800, 2900], 4, 2);
  vines([2700, 4900], 5, 2, 15);
  vines([4200, 5500], 6, 2);
  vines([1900, 3900], 3, 1);
  // more of them past the edge
  vines([6800, 3500], 8, 3);
  vines([4300, 7200], 9, 3);
  for (const at of [[3300, 2300], [4700, 4800]] as XY[]) prop("flora:RoundTree", at, rnd() * 360, 200, { s: 0.8, solid: [{ kind: "tree", x: 0, y: 0, r: 40 }] });

  // ---- wheat on the plain, both sides of the road, a scarecrow and hay ----
  const wheat = (c: XY, nx: number, ny: number) => {
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < ny; j++) {
        const at: XY = [c[0] + (i - (nx - 1) / 2) * 620, c[1] + (j - (ny - 1) / 2) * 820];
        if (!free(at[0], at[1], 420)) continue;
        put("plains:wheat_field", at, 90, { solid: "none" });
        taken.push([at[0], at[1], 380]);
      }
  };
  wheat([1500, -1700], 3, 3);
  wheat([-700, -2900], 2, 3);
  wheat([-200, 1300], 3, 2);
  wheat([-1000, 2700], 2, 2);
  wheat([3300, -1400], 2, 2);
  wheat([-3400, -600], 2, 3);
  wheat([-3600, 1900], 2, 2);
  prop("plains:scarecrow", [1500, -1100], 180, 40);
  prop("plains:scarecrow", [-200, 1900], 0, 40);
  for (const at of [[2400, -2500], [-1500, 2000], [-3200, 300], [600, -2300]] as XY[]) if (free(at[0], at[1], 220)) prop("plains:hay_bales", at, rnd() * 360, 230);
  // the fields' old walls
  const gapAt = (x: number, y: number) => nearRoad(x, y, 330) || wet(x, y, 150) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + 120);
  for (const w of [
    [[-2600, 3600], [-1500, 1300], [-900, -300]], [[300, -4200], [-300, -2000], [600, -1300]], [[-3900, -1700], [-3000, -1100]],
    [[-3900, 900], [-3000, 2700], [-2700, 5900]], [[3200, -3000], [4900, -2900]], [[700, 2200], [1100, 4500], [600, 5900]],
  ] as XY[][]) wallRun(f, w, { skip: gapAt, broken: 0.2 });

  // ---- trees: oaks and cypresses in the corners of the fields, groves by the river ----
  const grove = (c: XY, r: number, n: number, kinds: string[]) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (Math.abs(x) > R - 150 || Math.abs(y) > R - 150 || !free(x, y, 170, 120)) continue;
      const kind = kinds[Math.floor(rnd() * kinds.length)], s = 0.8 + rnd() * 0.35;
      prop(kind.includes(":") ? kind : `flora:${kind}`, [x, y], rnd() * 360, 170, { s, solid: [{ kind: "tree", x: 0, y: 0, r: kind.includes("cypress") ? 34 : 42 }] });
      made++;
    }
  };
  grove([-3500, 1500], 800, 5, ["BigOak", "RoundTree"]);
  grove([-3500, 4300], 800, 6, ["RoundTree", "westfarm:cypress", "BigOak"]);
  grove([-3000, -3300], 900, 4, ["RoundTree", "Birch"]);
  grove([-500, -4600], 900, 5, ["BigOak", "RoundTree", "Birch"]);
  grove([4400, -4400], 1000, 6, ["BigOak", "RoundTree", "westfarm:cypress"]);
  grove([4500, -800], 700, 3, ["RoundTree", "westfarm:cypress"]);
  grove([-2900, 4600], 700, 4, ["Birch", "RoundTree"]);
  grove([300, 3300], 500, 2, ["BigOak"]);
  grove([-3800, -1800], 600, 3, ["RoundTree", "BigOak"]);
  grove(aqAt(SRM - 200, 500), 900, 4, ["RoundTree", "westfarm:cypress"]);
  // an orchard in rows below the terrace, a hay rick at its corner
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const at: XY = [150 + i * 430 + (rnd() - 0.5) * 60, 3150 + j * 430 + (rnd() - 0.5) * 60];
      if (free(at[0], at[1], 120)) prop("flora:RoundTree", at, rnd() * 360, 150, { s: 0.5 + rnd() * 0.1, solid: [{ kind: "tree", x: 0, y: 0, r: 30 }] });
    }
  if (free(-250, 3000, 200)) prop("trunrada:haystack", [-250, 3000], 0, 200);
  // rocks and the odd bush
  for (const [ref, at, r] of [
    ["plains:boulder", [-3800, 2900], 230], ["plains:rock_cluster", [3600, -4500], 260], ["plains:flat_rock", [-4500, -5000], 230], ["plains:boulder", [4900, 1100], 230],
    ["plains:rock_cluster", [-200, 4900], 260], ["plains:boulder", [1900, -4900], 230], ["plains:flat_rock", [2600, -300], 230], ["plains:stump", [-2900, -2300], 100],
  ] as [string, XY, number][]) if (free(at[0], at[1], r)) prop(ref, at, rnd() * 360, r, { s: 0.8 });
  for (let i = 0; i < 170; i++) {
    const x = -R + 200 + rnd() * (2 * R - 400), y = -R + 200 + rnd() * (2 * R - 400);
    if (!free(x, y, 70)) continue;
    const k = rnd();
    put(k < 0.55 ? "plains:tall_grass" : k < 0.8 ? "westfarm:wildflowers" : "flora:Bush", [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.4, solid: "none" });
    taken.push([x, y, 50]);
  }

  // ---- past the edge: fields and groves running on, the lagoon to the south ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const keepOut = (x: number, y: number) => inside(x, y) || nearRoad(x, y, 380) || wet(x, y, 150) || toLine(x, y, [aqAt(0), aqAt(AQL)]) < 450;
  for (const at of [[6800, -3800], [7500, -3800]] as XY[])
    if (!keepOut(at[0], at[1])) put("plains:wheat_field", at, 90, { solid: "none" });
  f.woods(area, ["RoundTree", "BigOak", "westfarm:cypress", "RoundTree", "Birch"].map((k) => k.replace("westfarm:", "")), keepOut, { count: 340, spacing: 520, tries: 5000 });
  f.woods(area, ["cypress", "cypress", "wildflowers"], keepOut, { count: 90, spacing: 600, tries: 2000, kit: "westfarm" });

  // ---- monsters: the fields, the riverside, the ridge and the terrace ----
  const busy = (x: number, y: number) => Math.hypot(x - FARM[0], y - FARM[1]) < 1300 || Math.hypot(x - SHRINE[0], y - SHRINE[1]) < 700 || Math.hypot(x - BR[0], y - BR[1]) < 900;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 860, keepOut: (x, y) => busy(x, y) || nearRoad(x, y, 120), max: 54 });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "noa_plains_vintner", x: FARM[0] - 850, y: FARM[1] - 150, face: 190, name: "ปู่จูเซปเป้", title: "เจ้าของไร่องุ่น", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ไวน์จากลานองุ่นนี้ส่งไปขายถึงเวนิชเซีย พ่อค้าที่นั่นยกให้เป็นของดีของที่ราบใต้โนอา",
        "ท่อส่งน้ำเก่านั่นเคยพาน้ำจากเขาตะวันออกไปถึงโนอา เดี๋ยวนี้แห้งไปนานแล้ว เหลือแต่ซุ้มโค้งให้คนชม",
        "ช่วงเก็บองุ่นพวกตัวประหลาดชอบลงมากินผล ถ้าเจอก็ช่วยไล่ให้ทีนะ",
      ],
    },
    {
      id: "noa_plains_pilgrim", x: SHRINE[0] - 260, y: SHRINE[1] - 120, face: 60, name: "ซิสเตอร์คาเทรีนา", title: "นักแสวงบุญ", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "gold", eyes: "blue", top: "top_priestess_white", bottom: "bottom_priestess_white" },
      lines: [
        "ถนนหลวงสายนี้ปูหินมาตั้งแต่โนอายังเป็นเมืองหลวง หลักไมล์ทุกต้นนับระยะจากประตูวังเก่า",
        "เดินตามถนนลงไปข้ามสะพานหินโค้ง แล้วเลี้ยวตะวันออกเฉียงใต้จะถึงเวนิชเซีย ส่วนทางแยกนี้ไปบึงลากูน",
        "ขอพรที่ศาลริมทางก่อนออกเดินทาง คนเดินทางสมัยก่อนเขาทำกันทุกคน",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery,
    sky: "#7d8f52",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && !wet(x, y, 60) && !nearRoad(x, y, 80), density: 0.26 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4300, y: 320 },
    npcs,
    labels: [
      { x: WAY_N[0] - 250, y: WAY_N[1], text: "ทางไปโนอา", kind: "gate" },
      { x: WAY_S[0] + 250, y: WAY_S[1] + 150, text: "ทางไปเวนิชเซีย", kind: "gate" },
      { x: WAY_W[0], y: WAY_W[1] - 250, text: "ทางไปบึงลากูน", kind: "gate" },
      { x: 1800, y: 50, text: "ถนนหลวงโบราณ" },
      { x: aqAt(SRM)[0], y: aqAt(SRM)[1] + 350, text: "ท่อส่งน้ำโบราณ" },
      { x: 3800, y: 4300, text: "ลานไร่องุ่น" },
      { x: FARM[0] - 700, y: FARM[1], text: "บ้านไร่", kind: "small" },
      { x: BR[0] + 300, y: BR[1] - 700, text: "สะพานหินโค้ง", kind: "small" },
      { x: SHRINE[0], y: SHRINE[1] + 250, text: "ศาลพระริมทาง", kind: "small" },
      { x: 1500, y: -1700, text: "ทุ่งข้าวสาลี", kind: "small" },
      { x: -2300, y: 2300, text: "ลำน้ำสู่บึง", kind: "small" },
      { x: -4000, y: 800, text: "ชายฝั่งลากูน", kind: "small" },
    ],
  });
}

// ถนนหลวง (the royal road), monsters Lv 10-18: the paved road from Eden's north gate up through
// the wheat fields to the royal castle, which stands just past the north edge with its gate
// shut. Before it the road forks: left (west), bending round north to leave at the north-west
// corner (the snowy foothills touch this map only there, the castle between), to the snowy
// foothills; right (east) to the pine forest by the river. A soldiers' checkpoint stands across the road; a stream comes in from
// the west to a water mill and its mill pond; a windmill and a watchtower on a hill in the
// south-east; a lookout with the founding king's statue on a two-step bluff in the north-west.
// The mill's lane runs on past it, north of the stream, out of the middle of the west side to the
// royal flower fields (n 0.44, where their east way out is).
//
// Full size in its own centimetres (north +X, east -Y), scaled by TOWN_SCALE in finishField.

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Poly } from "./paved";
import { useKits } from "./town";
import type { Town } from "./town";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as EDEN } from "./kits/eden";
import { KIT as TRUNRADA } from "./kits/trunrada";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(PLAINS, EDEN, TRUNRADA);

type XY = [number, number];

// ---- polylines ----
function smooth(pts: XY[], n = 6): XY[] {
  const out: XY[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function band(pts: XY[], w: number): Poly {
  const left: XY[] = [], right: XY[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    left.push([pts[i][0] - (dy / L) * (w / 2), pts[i][1] + (dx / L) * (w / 2)]);
    right.push([pts[i][0] + (dy / L) * (w / 2), pts[i][1] - (dx / L) * (w / 2)]);
  }
  return [...left, ...right.reverse()];
}
// a polygon with no side longer than `max` (each cliff side is one solid, and long ones crowd
// everything near them out of the monsters' spots)
function dense(poly: Poly, max = 700): Poly {
  const out: Poly = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / max));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}
const dist = (a: XY, b: XY) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// the polyline cut into pieces, leaving out `half` either side of each point in `cuts`
function pieces(pts: XY[], cuts: XY[], half: number): XY[][] {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const at = (s: number): XY => {
    let i = 1;
    while (i < pts.length - 1 && cum[i] < s) i++;
    const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
  };
  const proj = (p: XY): number => {
    let best = 0, bd = Infinity;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = cum[i] - cum[i - 1] || 1;
      const t = Math.max(0, Math.min(1, ((p[0] - ax) * (bx - ax) + (p[1] - ay) * (by - ay)) / (L * L)));
      const d = Math.hypot(ax + (bx - ax) * t - p[0], ay + (by - ay) * t - p[1]);
      if (d < bd) [bd, best] = [d, cum[i - 1] + t * L];
    }
    return best;
  };
  const L = cum[cum.length - 1], keep: [number, number][] = [];
  let from = 0;
  for (const s of cuts.map(proj).sort((a, b) => a - b)) {
    if (s - half > from) keep.push([from, s - half]);
    from = s + half;
  }
  if (from < L) keep.push([from, L]);
  return keep.map(([a, b]) => [at(a), ...pts.filter((_, i) => cum[i] > a && cum[i] < b), at(b)]);
}
function toLine(p: XY, pts: XY[]): number {
  let d = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * (bx - ax) + (p[1] - ay) * (by - ay)) / L2));
    d = Math.min(d, Math.hypot(ax + (bx - ax) * t - p[0], ay + (by - ay) * t - p[1]));
  }
  return d;
}
// the point of a polyline nearest `guess` and the line's direction there
function nearest(line: XY[], guess: XY): { at: XY; dir: XY } {
  let best = { d: Infinity, at: guess, dir: [1, 0] as XY };
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1], [bx, by] = line[i], L = Math.hypot(bx - ax, by - ay) || 1;
    const t = Math.max(0, Math.min(1, ((guess[0] - ax) * (bx - ax) + (guess[1] - ay) * (by - ay)) / (L * L)));
    const p: XY = [ax + (bx - ax) * t, ay + (by - ay) * t], d = dist(p, guess);
    if (d < best.d) best = { d, at: p, dir: [(bx - ax) / L, (by - ay) / L] };
  }
  return { at: best.at, dir: best.dir };
}
const deg = (v: XY) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
// an ellipse-ish polygon, a little uneven
function blob(c: XY, rx: number, ry: number, seed: number, n = 18): Poly {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, k = 0.88 + rnd() * 0.2;
    return [c[0] + Math.cos(a) * rx * k, c[1] + Math.sin(a) * ry * k] as XY;
  });
}

// ---- the layout ----
const B = { minX: -5500, maxX: 5500, minY: -5000, maxY: 5000 };
const AREA = { x0: -9000, x1: 9600, y0: -8500, y1: 8500 };

// the royal road, south to north, and its two branches from the fork
const FORK: XY = [3200, 0];
const ROAD: XY[] = smooth([[-9000, 380], [-5600, 260], [-3900, -220], [-2500, 0], [-1200, 0], [-150, 0], [1500, 240], FORK, [4400, 0], [6300, 0]]);
// (the left branch runs up beside the bluff and out at the north-west corner, on past the
// castle's west wall)
const NW: XY[] = smooth([FORK, [3950, 800], [4550, 2000], [4900, 3200], [5100, 4200], [5200, 4700], [5900, 5650], [7500, 7300], [9600, 8800]]);
const NE: XY[] = smooth([FORK, [3750, -1000], [3550, -2500], [3200, -3900], [3100, -4700], [3000, -8500]]);
const CHECK: XY = [-1200, 0];
const GATE_X = 6000; // the castle's gatehouse, just past the north edge

// the stream from the west to the mill pond, and on out to the south
const POND_C: XY = [-1700, 2850];
const POND: Poly = blob(POND_C, 900, 720, 7);
const INFLOW: XY[] = smooth([[-2200, 8600], [-2000, 6600], [-2400, 5200], [-2000, 4200], [-1750, 3300]], 5);
const OUTFLOW: XY[] = smooth([[-2350, 2600], [-3300, 2100], [-4500, 2300], [-5800, 1900], [-9000, 2200]], 5);
const SW = 540;
// a plank bridge over the outflow to the meadow beyond it
function crossing(line: XY[], guess: XY): { at: XY; ax: XY; h: number } {
  const n = nearest(line, guess);
  let ax: XY = [-n.dir[1], n.dir[0]];
  if (ax[1] < 0) ax = [-ax[0], -ax[1]];
  return { at: n.at, ax, h: deg(ax) };
}
const C2 = crossing(OUTFLOW, [-3900, 2200]);
const off2 = (k: number): XY => [C2.at[0] + C2.ax[0] * k, C2.at[1] + C2.ax[1] * k];

// a hill in the south-east with a windmill and a watchtower (P1), a bluff in the north-west
// (P2) with a higher step (P3) where the founding king stands looking over the land
const P1: Poly = [[-4300, -3900], [-2200, -4100], [-1800, -2400], [-3600, -2000], [-4500, -2700]];
const R1 = { top: [-2700, -2200] as XY, bottom: [-2750, -1250] as XY, width: 440 };
const P2: Poly = [[800, 1800], [2900, 1600], [3700, 2700], [3600, 7200], [600, 7200]];
const R2 = { top: [3300, 2150] as XY, bottom: [4077, 1585] as XY, width: 460 };
const P3: Poly = [[1400, 3000], [2900, 2900], [3000, 6000], [1300, 6000]];
const R3 = { top: [2150, 2950] as XY, bottom: [2150, 2000] as XY, width: 440 };

// side tracks: to the hill, to the farm, to the mill, up the bluff
const T_HILL: XY[] = smooth([[-2550, -60], [-2700, -700], R1.bottom]);
const T_HILL_TOP: XY[] = [R1.bottom, R1.top, [-3000, -2750]];
const T_FARM: XY[] = smooth([[-700, -150], [-760, -1300], [-650, -2400], [-600, -3100]]);
const T_MILL: XY[] = smooth([[-1450, 150], [-1250, 1300], [-500, 2100], [-450, 3500], [-1000, 4300], [-1450, 4600]]);
const T_BLUFF: XY[] = [R2.bottom, R2.top, [2700, 2300], R3.bottom, R3.top, [2200, 3500]];
const T_MEADOW: XY[] = smooth([[-1350, 1350], [-2300, 1520], [-3200, 1480], off2(-650), C2.at, off2(650), [-4000, 3300], [-3500, 3900]]);

const WAY_EDEN: XY = [-5150, 250], ARRIVE_EDEN: XY = [-4450, 140];
const WAY_SNOW: XY = [5200, 4700], ARRIVE_SNOW: XY = [5060, 4000];
const WAY_PINE: XY = [3110, -4650], ARRIVE_PINE: XY = [3200, -3950];
// ---- (v0.4) the way west to the royal flower fields: the mill's lane on past the mill, north of
// the stream, out of the middle of the west side ----
const WAY_FLOWER: XY = [-720, 4650], ARRIVE_FLOWER: XY = [-740, 3980];
const T_FLOWER: XY[] = smooth([[-700, 3880], [-760, 4300], WAY_FLOWER, [-680, 5400], [-640, 7000], [-600, 8500]]);

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(223, {
    hills: [
      { x: 1500, y: -3800, r: 1300, h: 170 },
      { x: -4700, y: 4200, r: 1300, h: 150 },
      { x: -200, y: 4400, r: 1000, h: 130 },
      { x: 4300, y: -4300, r: 900, h: 120 },
      { x: -4300, y: -4650, r: 800, h: -70 },
      { x: 4700, y: 1000, r: 700, h: 90 },
    ],
    plateaus: [
      { poly: dense(P1), h: 300, ramps: [R1] },
      { poly: dense(P2), h: 320, ramps: [R2] },
      { poly: dense(P3), h: 640, ramps: [R3] },
    ],
    rock: "CliffRock",
  });
  const { put, rnd } = f;
  const tracks = [T_HILL, T_HILL_TOP, T_FARM, T_MILL, T_BLUFF, T_MEADOW, T_FLOWER];
  const roads = [ROAD, NW, NE];
  // the castle's courtyard inside its walls, paved
  const COURT: Poly = [[GATE_X + 150, -2600], [AREA.x1, -2600], [AREA.x1, 2600], [GATE_X + 150, 2600]];
  const ground = f.ground({
    area: AREA,
    roads: tracks.map((t) => band(t, 400)),
    plazas: [...roads.map((r, i) => band(r, i ? 520 : 620)), COURT],
    plaza: [0.8, 0.77, 0.71],
    water: [band(INFLOW, SW), band(OUTFLOW, SW), POND],
    base: "grass",
  });

  const taken: { x: number; y: number; r: number }[] = [];
  const mark = (x: number, y: number, r: number) => taken.push({ x, y, r });
  const free = (x: number, y: number, r: number) => taken.every((t) => Math.hypot(t.x - x, t.y - y) > t.r + r);
  const nearRoad = (x: number, y: number, d: number) => roads.some((r) => toLine([x, y], r) < d) || tracks.some((t) => toLine([x, y], t) < d - 60);
  const wet = (x: number, y: number, d: number) => toLine([x, y], INFLOW) < SW / 2 + d || toLine([x, y], OUTFLOW) < SW / 2 + d || dist([x, y], POND_C) < 950 + d;
  const P = (ref: string, at: XY, h = 0, r = 200, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    mark(at[0], at[1], r);
  };

  // ---- the castle past the north edge: its shut gatehouse, walls and keep ----
  P("plains:castle_gatehouse", [GATE_X, 0], 0, 1100);
  f.wall([GATE_X, -2600], [GATE_X, -1150], "s", "eden:city_wall");
  f.wall([GATE_X, 1150], [GATE_X, 2600], "s", "eden:city_wall");
  f.wall([GATE_X, -2600], [AREA.x1 + 400, -2600], "e", "eden:city_wall");
  f.wall([GATE_X, 2600], [AREA.x1 + 400, 2600], "w", "eden:city_wall");
  for (const y of [-2600, 2600]) P("eden:wall_tower", [GATE_X, y], 0, 350, { solid: [{ kind: "tower", x: 0, y: 0, r: 330 }] });
  for (const y of [-2600, 2600]) P("eden:wall_tower", [GATE_X + 2600, y], 0, 350, { solid: [{ kind: "tower", x: 0, y: 0, r: 330 }] });
  P("plains:castle_keep", [8150, 0], 0, 1200);
  for (const y of [-1700, 1700]) P("eden:banner_pole", [GATE_X + 700, y], 180, 60);
  for (const [x, y] of [[7000, -2000], [7000, 2000], [9000, -1900], [9000, 1900]] as XY[]) P("flora:RoundTree", [x, y], x, 200, { s: 0.8 });
  // before the gate: banners and lamps where the road ends, a guard post
  for (const s of [-1, 1]) {
    P("eden:banner_pole", [5250, s * 520], 0, 50);
    P("eden:street_lamp", [4500, s * 420], 0, 40, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
    P("eden:street_lamp", [5050, s * 420], 0, 40, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
  }
  P("plains:signpost", [3050, 520], 180, 80);

  // ---- the way back to Eden in the south ----
  f.exit("eden", WAY_EDEN, ARRIVE_EDEN);
  P("plains:signpost", [-4950, -380], 0, 80);
  P("plains:milestone", [-4600, 650], -90, 60);
  // the other ways out
  f.exit("snow_foothills", WAY_SNOW, ARRIVE_SNOW);
  P("plains:signpost", [4650, 4450], 160, 80);
  f.exit("pine_river", WAY_PINE, ARRIVE_PINE);
  P("plains:signpost", [3650, -4500], -90, 80);
  // (v0.4) the way to the flower fields
  f.exit("flower_fields", WAY_FLOWER, ARRIVE_FLOWER);
  P("plains:signpost", [-1150, 4450], 180, 80);

  // ---- the checkpoint across the road, a soldier at it ----
  const cpSolid: SolidSpec[] = [
    { kind: "tower", x: 0, y: -430, w: 330, d: 330, rot: 0 }, { kind: "tower", x: 0, y: 430, w: 330, d: 330, rot: 0 },
    { kind: "post", x: -232, y: -290, r: 22 }, { kind: "post", x: -232, y: 290, r: 16 },
    { kind: "box", x: -232, y: 425, w: 50, d: 170, rot: 0 }, { kind: "box", x: -210, y: -410, w: 80, d: 140, rot: 0 },
    { kind: "box", x: 213, y: -440, w: 56, d: 250, rot: 0 },
  ];
  P("plains:checkpoint_gate", CHECK, 0, 640, { solid: cpSolid });
  P("plains:watchtower", [CHECK[0] + 100, 1100], 90, 230);
  for (const s of [-1, 1]) P("eden:banner_pole", [CHECK[0] - 600, s * 420], 0, 50);
  P("common:crate", [CHECK[0] + 300, 820], 20, 50);
  P("common:crate", [CHECK[0] + 360, 760], 60, 50);

  // ---- milestones and trees along the road ----
  for (const x of [-3600, -100, 2200]) {
    const n = nearest(ROAD, [x, 0]);
    P("plains:milestone", [n.at[0], n.at[1] + 430], deg(n.dir) + 90, 60);
  }
  for (let x = 1800; x <= 4600; x += 700) {
    if (Math.abs(x - FORK[0]) < 400) continue;
    for (const s of [-1, 1]) {
      const n = nearest(ROAD, [x, 0]), at: XY = [n.at[0], n.at[1] + s * 560];
      if ([NW, NE].some((r) => toLine(at, r) < 450)) continue;
      P("flora:RoundTree", at, rnd() * 360, 200, { s: 0.65 + rnd() * 0.15 });
    }
  }

  // ---- the wheat fields, fenced along the road, a scarecrow in each ----
  const wheat = (pcs: XY[], fence: number, scare: XY) => {
    for (const at of pcs) P("plains:wheat_field", at, 0, 520);
    const xs = pcs.map((p) => p[0]), x0 = Math.min(...xs) - 400, x1 = Math.max(...xs) + 400;
    // a fence along the road side, a gap in its middle
    for (let x = x0 + 200; x < x1; x += 400) if (Math.abs(x - (x0 + x1) / 2) > 250) put("plains:rail_fence", [x, fence], 90);
    P("plains:scarecrow", scare, 180, 40);
  };
  wheat([[-4700, -1000], [-3800, -1000], [-4700, -1700]], -560, [-4250, -1350]);
  wheat([[0, -1100], [900, -1100], [1800, -1100], [0, -1800], [900, -1800], [1800, -1800]], -600, [450, -1450]);
  wheat([[-4700, 950], [-3800, 950], [-2900, 950]], 560, [-3350, 950]);
  wheat([[-400, 950], [500, 950]], 560, [50, 950]);
  P("plains:hay_bales", [-3200, -1500], 30, 250);
  P("plains:hay_bales", [2550, -1500], -40, 250);
  P("plains:hay_bales", [-2350, 1050], 80, 250);
  P("plains:hay_bales", [1100, 1200], 10, 250);

  // ---- a farmstead off the road ----
  P("common:house", [-1100, -3400], 90, 520);
  P("common:house", [-50, -3700], 180, 520);
  P("common:gazebo", [-600, -3350], 0, 160);
  P("common:market_cart", [-300, -3050], 30, 120);
  P("plains:hay_bales", [-1150, -4250], 0, 250);
  P("trunrada:haystack", [300, -4300], 0, 200);
  for (const y of [-4500, -4100]) put("plains:rail_fence", [-1700, y], 0);
  for (const x of [-1500, -1100, -700]) put("plains:rail_fence", [x, -4700], 90);
  P("flora:BigOak", [-1700, -3000], 20, 220, { s: 0.9 });

  // ---- the windmill and the watchtower on the hill ----
  P("trunrada:windmill", [-3450, -3150], 45, 520);
  P("plains:watchtower", [-2600, -3500], 0, 230);
  P("trunrada:campfire", [-2550, -2950], 0, 150);
  P("plains:hay_bales", [-3900, -2500], 120, 250, { s: 0.8 });
  P("eden:banner_pole", [-2150, -2750], 90, 50);
  P("common:crate", [-2300, -3200], 10, 50);

  // ---- the stream, the mill and its pond ----
  const scenery: THREE.Object3D[] = [f.waterSheet({ x0: AREA.x0, x1: 0, y0: 1300, y1: AREA.y1 }, -14, "WaterSea")];
  f.blockBand(INFLOW, SW + 60, { step: 220 });
  for (const part of pieces(OUTFLOW, [C2.at], 200)) f.blockBand(part, SW + 60, { step: 220 });
  P("plains:wood_bridge", C2.at, C2.h, 520, { solid: [{ kind: "rail", x: 0, y: -190, w: 940, d: 26, rot: 0 }, { kind: "rail", x: 0, y: 190, w: 940, d: 26, rot: 0 }] });
  // the meadow over the bridge
  P("trunrada:haystack", [-4300, 3500], 0, 200);
  P("plains:fallen_log", [-3000, 3300], 120, 330);
  P("plains:flat_rock", [-4800, 2800], 30, 230, { s: 0.8 });
  // a ring of solids round the pond's shore keeps everyone off it
  f.blockBand([...POND, POND[0]], 170, { step: 200 });
  {
    // the mill on the stream's north bank, its wheel in the water
    const n = nearest(INFLOW, [-2200, 4700]);
    const toBank: XY = [n.dir[1], -n.dir[0]]; // the stream's left: north
    const side: XY = toBank[0] > 0 ? toBank : [-toBank[0], -toBank[1]];
    const c: XY = [n.at[0] + side[0] * 450, n.at[1] + side[1] * 450];
    // the mill's +Y (its wheel) toward the water
    const h = (Math.atan2(side[0], -side[1]) * 180) / Math.PI;
    P("plains:water_mill", c, h, 600);
    const front: XY = [-Math.cos((h * Math.PI) / 180), -Math.sin((h * Math.PI) / 180)];
    MILL.at = c;
    MILL.front = [c[0] + front[0] * 650, c[1] + front[1] * 650];
    MILL.face = deg(front);
  }
  // the pond's jetty and boat, reeds and stones round it
  for (let i = 0; i < 2; i++) put("eden:pier", [POND_C[0] - 750 + i * 400, POND_C[1] - 100], 0, { z: -30, solid: "none" });
  put("eden:rowboat", [POND_C[0] - 300, POND_C[1] + 300], 60, { z: -30 });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rnd() * 0.3, x = POND_C[0] + Math.cos(a) * 1080, y = POND_C[1] + Math.sin(a) * 880;
    if (nearRoad(x, y, 380) || wet(x, y, -60) || Math.abs(a - Math.PI) < 0.35) continue;
    P(i % 3 === 0 ? "plains:flat_rock" : "plains:reeds", [x, y], rnd() * 360, i % 3 === 0 ? 200 : 80, { s: i % 3 === 0 ? 0.6 : 1 });
  }
  for (const line of [INFLOW, OUTFLOW])
    for (let i = 1; i < line.length - 1; i += 2) {
      const [ax, ay] = line[i], [bx, by] = line[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
      const s = i % 4 === 1 ? 1 : -1, x = ax + (-(by - ay) / L) * s * (SW / 2 + 90), y = ay + ((bx - ax) / L) * s * (SW / 2 + 90);
      if (!f.level(x, y, 100) || !free(x, y, 120) || nearRoad(x, y, 360)) continue;
      P(rnd() < 0.7 ? "plains:reeds" : "plains:tall_grass", [x, y], rnd() * 360, 80);
    }

  // ---- the founding king on the bluff, looking over his land ----
  P("eden:hero_statue", [2200, 4000], 90, 300);
  for (const [x, y] of [[1750, 3500], [2650, 3500]] as XY[]) P("eden:banner_pole", [x, y], 90, 50);
  for (const [x, y] of [[1700, 4400], [2700, 4400]] as XY[]) P("eden:flower_bed", [x, y], 0, 170);
  for (const [x, y, h] of [[2200, 3300, -90], [1650, 3900, 180], [2750, 3900, 0]] as [number, number, number][]) P("eden:park_bench", [x, y], h, 110);
  P("flora:BigOak", [2500, 5300], 30, 250, { s: 1.1 });
  P("flora:RoundTree", [1700, 5200], 80, 220, { s: 0.9 });
  P("plains:boulder", [3200, 2500], 30, 230, { s: 0.8 });
  P("plains:rock_cluster", [1100, 2600], 0, 260, { s: 0.8 });
  P("plains:fallen_log", [1300, 6400], 90, 330);

  // ---- woods and rocks on the open ground left ----
  for (const [ref, at, h, r] of [
    ["plains:boulder", [2700, -4600], 30, 230], ["plains:rock_cluster", [4600, -3400], 100, 260], ["plains:fallen_log", [2300, -2600], 60, 330],
    ["plains:stump", [4200, -2000], 0, 100], ["plains:boulder", [-4800, 3600], 0, 230], ["plains:rock_cluster", [-3600, 4600], 0, 260],
    ["plains:stump", [-200, 3200], 0, 100], ["plains:flat_rock", [4600, 1700], 40, 230], ["plains:boulder", [-5000, -3300], 90, 230],
    ["plains:fallen_log", [-4400, -4200], 20, 330], ["plains:stump", [1200, -4700], 0, 100], ["plains:rock_cluster", [4900, -1200], 0, 260],
  ] as [string, XY, number, number][]) if (f.level(at[0], at[1], r * 0.6) && free(at[0], at[1], r)) P(ref, at, h, r);
  const grove = (c: XY, r: number, n: number, kinds: string[]) => {
    for (let i = 0; i < n * 4 && n > 0; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (x < B.minX + 150 || x > B.maxX - 150 || y < B.minY + 150 || y > B.maxY - 150) continue;
      if (nearRoad(x, y, 450) || wet(x, y, 150) || !f.level(x, y, 170) || !free(x, y, 200)) continue;
      P(`flora:${kinds[Math.floor(rnd() * kinds.length)]}`, [x, y], rnd() * 360, 220, { s: 0.75 + rnd() * 0.35 });
      n--;
    }
  };
  grove([1600, -3700], 1300, 14, ["BigOak", "RoundTree", "SmallTree"]);
  grove([4300, -3300], 1100, 9, ["RoundTree", "Birch", "SmallTree"]);
  grove([-4600, 4000], 1300, 12, ["BigOak", "RoundTree", "SmallTree"]);
  grove([-300, 4200], 900, 7, ["RoundTree", "Cherry", "SmallTree"]);
  grove([1900, 5400], 900, 6, ["BigOak", "RoundTree"]);
  grove([1400, 2400], 700, 4, ["RoundTree", "SmallTree"]);
  grove([-4900, -3800], 900, 6, ["BigOak", "RoundTree"]);
  grove([4800, 1800], 800, 5, ["RoundTree", "Birch"]);
  grove([-3100, 3800], 700, 4, ["SmallTree", "RoundTree"]);
  for (let i = 0; i < 260; i++) {
    const x = B.minX + rnd() * (B.maxX - B.minX), y = B.minY + rnd() * (B.maxY - B.minY);
    if (nearRoad(x, y, 330) || wet(x, y, 40) || !f.level(x, y, 90) || !free(x, y, 70)) continue;
    P(rnd() < 0.7 ? "plains:tall_grass" : "flora:Bush", [x, y], rnd() * 360, 60, { solid: "none" });
  }

  // ---- the rim: woods and farmland running on ----
  const inside = (x: number, y: number) => x > B.minX - 250 && x < B.maxX + 250 && y > B.minY - 250 && y < B.maxY + 250;
  const castle = (x: number, y: number) => x > GATE_X - 900 && Math.abs(y) < 3100;
  const FARM_RIM: XY[] = [[-7600, -1500], [-7600, -2500], [-6700, -1500], [-6700, -2500], [-7600, 1050], [-6700, 1050]];
  const farm = (x: number, y: number) => FARM_RIM.some(([fx, fy]) => Math.abs(x - fx) < 650 && Math.abs(y - fy) < 550);
  f.woods(AREA, ["BigOak", "RoundTree", "RoundTree", "SmallTree", "BigOak", "Birch"], (x, y) =>
    inside(x, y) || castle(x, y) || farm(x, y) || wet(x, y, 120) || roads.some((r) => toLine([x, y], r) < 520) || toLine([x, y], T_FLOWER) < 420, { count: 760, tries: 8000, spacing: 430 });
  // farmland on past the edge, south-west and south-east
  for (const at of FARM_RIM) put("plains:wheat_field", at, 0);

  // ---- monsters ----
  f.monsterSpots(ground, { x0: B.minX + 400, x1: B.maxX - 400, y0: B.minY + 400, y1: B.maxY - 400 }, {
    step: 560,
    keepOut: (x, y) => dist([x, y], CHECK) < 1300 || dist([x, y], MILL.at) < 1100 || x > 4700 && Math.abs(y) < 1500 || dist([x, y], [-600, -3500]) < 1100,
  });

  const guard = (top: string) => ({ gender: "male", hair: "", hairColor: "ink", eyes: "blue", top, bottom: "bottom_warrior_black" });
  const npcs: NpcSpec[] = [
    {
      id: "royal_road_soldier", x: CHECK[0] - 420, y: -150, face: 180, name: "ทหารยามคาร์ล", title: "ทหารประจำด่านถนนหลวง", role: "talk", look: guard("top_warrior_navy"),
      lines: [
        "ด่านนี้ตรวจทุกคนที่จะขึ้นไปทางปราสาท แต่ตอนนี้ปราสาทปิดซ่อมอยู่",
        "ถึงทางแยกหน้าปราสาท แยกซ้ายไปเชิงเขาหิมะ แยกขวาไปป่าสนริมแม่น้ำ",
        "ทางใต้กลับเมืองอีเดน ถ้าบาดเจ็บก็กลับไปหานักบวชที่สี่แยกนะ",
      ],
    },
    {
      id: "royal_road_miller", x: MILL.front[0], y: MILL.front[1], face: MILL.face, name: "ลุงฮันส์", title: "คนสีข้าวโรงสีน้ำ", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ข้าวสาลีทุ่งนี้ส่งเข้าวังทุกฤดูเก็บเกี่ยว แป้งของข้าขึ้นโต๊ะเสวยเชียวนะ",
        "กังหันน้ำหมุนทั้งวันทั้งคืน ตราบใดที่ลำธารยังไหลมาจากทางตะวันตก",
        "ระวังพวกมอนสเตอร์แถวบ่อน้ำด้วย ช่วงนี้มันชอบมาขโมยข้าว",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery,
    sky: "#4f6e36",
    flowers: { box: { x: B.minX, y: B.minY, w: B.maxX - B.minX, h: B.maxY - B.minY }, open: (x, y) => ground.kind(x, y) === 0, density: 0.32 * quality.flowers },
    // the castle gate is shut: a bar across the road's end
    late: [{ kind: "closed", x: B.maxX - 80, y: 0, w: 100, d: 1200, rot: 0 }],
    closed: [{ x: B.maxX - 260, y: 0, r: 320, text: "ปราสาทหลวงปิดซ่อมอยู่ ยังเข้าไม่ได้" }],
    bounds: B,
    spawn: { x: -4250, y: 120 },
    npcs,
    labels: [
      { x: 4950, y: -1150, text: "ปราสาทหลวง" },
      { x: B.maxX - 200, y: 0, text: "ประตูปราสาท (ปิด)", kind: "gate" },
      { x: CHECK[0] - 700, y: 0, text: "ด่านตรวจถนนหลวง" },
      { x: MILL.front[0], y: MILL.front[1], text: "โรงสีน้ำ" },
      { x: POND_C[0] + 1150, y: POND_C[1], text: "บ่อน้ำโรงสี", kind: "small" },
      { x: -2900, y: -2900, text: "เนินกังหันลม" },
      { x: 2200, y: 3500, text: "ผาชมปราสาท" },
      { x: -3900, y: -350, text: "ทุ่งข้าวสาลี", kind: "small" },
      { x: FORK[0], y: FORK[1], text: "ทางแยกหน้าปราสาท", kind: "small" },
      { x: -600, y: -2900, text: "ไร่ริมถนน", kind: "small" },
      { x: -3600, y: 3600, text: "ทุ่งริมธาร", kind: "small" },
      { x: WAY_EDEN[0], y: WAY_EDEN[1], text: "ทางไปอีเดน", kind: "gate" },
      { x: WAY_SNOW[0], y: WAY_SNOW[1], text: "ทางไปเชิงเขาหิมะ", kind: "gate" },
      { x: WAY_PINE[0], y: WAY_PINE[1], text: "ทางไปป่าสนริมแม่น้ำ", kind: "gate" },
      { x: WAY_FLOWER[0], y: WAY_FLOWER[1], text: "ทางไปทุ่งดอกไม้หลวง", kind: "gate" },
    ],
  });
}

// where the mill ended up (set while building)
const MILL: { at: XY; front: XY; face: number } = { at: [-1800, 4700], front: [-1500, 4300], face: 0 };

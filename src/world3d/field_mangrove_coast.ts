// ชายฝั่งป่าชายเลน (the mangrove coast), monsters Lv 35-45: the shore east of Yodia where the
// jungle runs down to the sea. The way in from Yodia's east gate (the north end of the west
// side, under the ridge's south-west foot) comes down through coastal jungle to a fork: south-west a boardwalk winds out over the mangrove lagoon past a fisherman's stilt
// house; south-east the track comes down to a beach where a junk lies wrecked in the shallows,
// salvagers camped beside it; north-east a rocky headland rises in sea cliffs, its tip a higher
// step with an old beacon tower still smouldering; north-west a jungle ridge with a lookout
// tower and a hilltop pavilion. The sea runs along the east and the south.
//
// Full size in the field's own centimetres (north +X, east -Y), scaled by TOWN_SCALE in finish.

import * as THREE from "three";
import { FieldBuilder } from "./field";
import { material } from "./textures";
import { useKits } from "./town";
import type { Town } from "./town";
import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import type { SolidSpec } from "../world";
import { KIT as JUNGLE } from "./kits/jungle";
import { KIT as YODIA } from "./kits/yodia";

useKits(JUNGLE, YODIA);

type XY = [number, number];

// ---- shapes ----
// a Catmull-Rom curve through the points, `per` steps a span
function smooth(pts: XY[], per = 4): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const c = (j: 0 | 1) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      out.push([c(0), c(1)]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// a strip `w` wide along a polyline
function band(pts: XY[], w: number): Poly {
  const left: XY[] = [], right: XY[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    left.push([pts[i][0] + (nx * w) / 2, pts[i][1] + (ny * w) / 2]);
    right.push([pts[i][0] - (nx * w) / 2, pts[i][1] - (ny * w) / 2]);
  }
  return [...left, ...right.reverse()];
}
// a wobbly ellipse
function blob(cx: number, cy: number, rx: number, ry: number, seed: number, n = 22): Poly {
  const out: Poly = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = 1 + 0.08 * Math.sin(a * 3 + seed) + 0.05 * Math.cos(a * 5 + seed * 2);
    out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return out;
}
// Cut the sharp corners off a plateau's outline (a turn over `maxTurn` degrees becomes two
// gentler ones), so the rock faces of its two edges meet without a gap at the corner.
function bevel(poly: Poly, maxTurn = 35, cut = 260): Poly {
  const out: Poly = [], n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[(i + n - 1) % n], c = poly[i], q = poly[(i + 1) % n];
    const ax = c[0] - p[0], ay = c[1] - p[1], bx = q[0] - c[0], by = q[1] - c[1], la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    const turn = (Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb)))) * 180) / Math.PI;
    if (turn <= maxTurn) {
      out.push(c);
      continue;
    }
    const d = Math.min(cut, la * 0.3, lb * 0.3);
    out.push([c[0] - (ax / la) * d, c[1] - (ay / la) * d], [c[0] + (bx / lb) * d, c[1] + (by / lb) * d]);
  }
  return out;
}
function inside(poly: Poly, x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// a point `d` along a polyline and the direction of the line there
function along(pts: XY[], d: number): { p: XY; dir: XY } {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    if (d <= L || i + 2 === pts.length) {
      const t = Math.min(1, d / L);
      return { p: [ax + (bx - ax) * t, ay + (by - ay) * t], dir: [(bx - ax) / L, (by - ay) / L] };
    }
    d -= L;
  }
  return { p: pts[0], dir: [1, 0] };
}
const lengthOf = (pts: XY[]) => pts.slice(1).reduce((t, p, i) => t + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
// how far a point lies from a polyline
function distTo(pts: XY[], x: number, y: number): number {
  let best = Infinity;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2));
    best = Math.min(best, Math.hypot(ax + dx * t - x, ay + dy * t - y));
  }
  return best;
}
// a polyline every `step` along a polygon's edges (closed)
function ring(poly: Poly, step: number): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}

export function build(quality: { flowers: number }): Town {
  // ---- the coast: the shoreline from the far north-east round the headland, down the beach to the
  // south-east corner and west along the mangrove shore; the sea beyond it ----
  const SHORE = smooth([
    [9500, -6200], [7600, -6300], [6800, -6250], [5200, -6450], [4000, -6000], [3000, -5250], [2400, -4350], [1500, -4050], [500, -4150],
    [-500, -4000], [-1500, -3950], [-2600, -4150], [-3600, -4050], [-4300, -3500], [-4450, -2300], [-4250, -1000], [-4500, 300],
    [-4300, 1700], [-4500, 3000], [-4350, 4300], [-4550, 5600], [-4400, 7000], [-4500, 9500],
  ], 4);
  const SEA: Poly = [...SHORE, [-9500, 9500], [-9500, -9500], [9500, -9500]];
  // the headland (its sea face a little inside the shore) and its tip, the coastal ridge
  const L1: Poly = bevel([[2500, -4150], [3100, -5050], [4050, -5780], [5200, -6230], [6800, -6030], [7700, -5000], [7500, -2600], [5600, -1800], [3700, -1600], [2300, -2400], [1900, -3500]]);
  const L1b: Poly = bevel([[4400, -5500], [6400, -5700], [7000, -4500], [6000, -3600], [4600, -3900], [4000, -4700]]);
  // (its south-west foot drawn back from the west edge, where the Yodia way comes in under it)
  const L2: Poly = bevel([[1500, 1800], [3000, 1300], [4800, 1600], [5900, 2600], [6000, 4800], [4600, 6000], [3300, 5900], [2600, 4300], [1800, 3800], [1100, 3000]]);
  const RIM_N: Poly = bevel([[6500, 600], [7600, -1400], [9500, -1000], [9500, 5000], [7000, 5600], [6600, 3200]]);
  const f = new FieldBuilder(116, {
    hills: [
      { x: 3000, y: 500, r: 1000, h: 120 }, { x: -900, y: 1150, r: 550, h: 80 }, { x: 1800, y: -800, r: 700, h: 60 },
      { x: 4200, y: -700, r: 900, h: 110 }, { x: 900, y: 4400, r: 600, h: 90 }, { x: -2500, y: 6500, r: 900, h: 150 },
    ],
    plateaus: [
      { poly: L1, h: 450, ramps: [{ top: [2100, -2950], bottom: [831, -2488], width: 450 }] },
      { poly: L1b, h: 800, ramps: [{ top: [5300, -3750], bottom: [5070, -2674], width: 400 }] },
      { poly: L2, h: 320, ramps: [{ top: [1300, 2400], bottom: [351, 2084], width: 420 }] },
      { poly: RIM_N, h: 700 },
    ],
    rock: "CliffRock",
  });
  const R = 5500, AREA = { x0: -9000, x1: 9000, y0: -9000, y1: 9000 };

  // ---- the mangrove lagoons and the boardwalk across the big one ----
  const LA: Poly = [[-1900, 1300], [-1600, 2300], [-1800, 3300], [-1500, 4300], [-2200, 4900], [-3300, 4700], [-3900, 3900], [-3700, 2800], [-3900, 1700], [-3500, 800], [-2600, 600]];
  const LB = blob(-2700, -1600, 600, 500, 4);
  const BW = smooth([[-1450, 3680], [-2300, 4050], [-3000, 3800], [-3400, 3100], [-3350, 2300], [-2900, 1600], [-2300, 1050], [-1700, 640]], 6);

  // ---- paths: from the Yodia way down to the beach; branches to the headland, the ridge and both
  // ends of the boardwalk ----
  const MAIN = smooth([[1980, 7200], [1980, 5150], [1850, 4500], [1350, 4150], [600, 3950], [-100, 3800], [-300, 3600], [-400, 2600], [-200, 1700], [200, 800], [300, -300], [0, -1400], [-400, -2300], [-700, -2800]]);
  const HEAD = smooth([[250, 250], [800, -600], [950, -1600], [831, -2488], [1465, -2719], [2100, -2950], [2900, -3050], [3900, -2900], [4700, -2700], [5070, -2674], [5185, -3212], [5300, -3750], [5300, -4300]], 3);
  const RIDGE = smooth([[-300, 2300], [0, 2150], [351, 2084], [825, 2242], [1300, 2400], [1900, 2650], [2400, 2750], [2900, 3250], [3050, 3600]], 3);
  const BWN = smooth([[-350, 3500], [-900, 3650], [-1450, 3680]], 3);
  const BWS = smooth([[-1700, 640], [-1100, 380], [-400, 100], [250, 0]], 3);
  const roads: Poly[] = [band(MAIN, 440), band(HEAD, 400), band(RIDGE, 380), band(BWN, 300), band(BWS, 320)];
  const ground = f.ground({ area: AREA, cell: 60, roads, plazas: [], water: [SEA, LA, LB], base: "jungle", road: [0.62, 0.5, 0.4] });

  // ---- the beach: a lens of sand between the shore and the jungle, laid over the ground (a layer
  // of its own that shows only between the two lines) ----
  const XA = -3700, XB = 1800;
  const BEACH_SHORE = SHORE.filter(([x, y]) => x > XA && x < XB && y < -3000).sort((a, b) => a[0] - b[0]);
  const widthAt = (x: number) => 1300 * Math.pow(Math.max(0, Math.sin((Math.PI * (x - BEACH_SHORE[0][0])) / (BEACH_SHORE[BEACH_SHORE.length - 1][0] - BEACH_SHORE[0][0]))), 0.6);
  const INNER: XY[] = BEACH_SHORE.map(([x, y]) => [x, y + widthAt(x)]);
  const BEACH: Poly = [...BEACH_SHORE, ...[...INNER].reverse()];
  const SB = { x0: XA - 200, x1: XB + 200, y0: -4700, y1: -2300 };
  const first = BEACH_SHORE[0], last = BEACH_SHORE[BEACH_SHORE.length - 1];
  const sand = buildPaved({
    area: SB, roads: [], plazas: [], base: "sand", height: (x, y) => f.h(x, y) + 3,
    water: [
      [...INNER, [SB.x1, last[1]], [SB.x1, SB.y1], [SB.x0, SB.y1], [SB.x0, first[1]]],
      [...BEACH_SHORE, [SB.x1, last[1]], [SB.x1, SB.y0], [SB.x0, SB.y0], [SB.x0, first[1]]],
    ],
  });
  sand.mesh.renderOrder = 1;

  // ---- what keeps everyone out of the water: a band along the shore, the headland's foot, the
  // lagoons filled with discs except along the boardwalk ----
  const seaward = (p: XY, d: number): XY => {
    for (const s of [1, -1]) {
      const i = SHORE.findIndex((q) => q === p), a = SHORE[Math.max(0, i - 1)], b = SHORE[Math.min(SHORE.length - 1, i + 1)];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, n: XY = [(-(b[1] - a[1]) / L) * s, ((b[0] - a[0]) / L) * s];
      if (inside(SEA, p[0] + n[0] * 120, p[1] + n[1] * 120)) return [p[0] + n[0] * d, p[1] + n[1] * d];
    }
    return p;
  };
  const SHORE_IN = SHORE.filter(([x, y]) => Math.abs(x) < R + 600 && Math.abs(y) < R + 600);
  f.blockBand(SHORE_IN.map((p) => seaward(p, 280)), 520, { kind: "sea" });
  f.blockBand([[2500, -4150], [3100, -5050], [4050, -5780], [5200, -6230]].map(([x, y]) => [x - 60, y - 140] as XY), 300, { kind: "sea" });
  const BW_FREE = 290;
  for (let x = -4000; x < -1400; x += 300)
    for (let y = 500; y < 5000; y += 300) if (inside(LA, x, y) && distTo(BW, x, y) > BW_FREE + 20) f.blockDisc([x, y], 180);
  const cLA: XY = [-2700, 2800];
  for (const [x, y] of ring(LA, 240)) {
    const p: XY = [x + (cLA[0] - x) * 0.04, y + (cLA[1] - y) * 0.04];
    if (distTo(BW, p[0], p[1]) > BW_FREE) f.blockDisc(p, 140);
  }
  f.blockDisc([-2700, -1600], 420);
  for (const [x, y] of ring(LB, 220)) f.blockDisc([x + (-2700 - x) * 0.1, y + (-1600 - y) * 0.1], 140);

  const seaShape = new THREE.Shape();
  [...SHORE.map((p) => seaward(p, -200)), [-20000, 9500], [-20000, -20000], [9500, -20000]].forEach(([x, y], i) => (i ? seaShape.lineTo(x, y) : seaShape.moveTo(x, y)));
  const seaSheet = new THREE.Mesh(new THREE.ShapeGeometry(seaShape).applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)), material("WaterSea"));
  seaSheet.position.y = -14;
  seaSheet.receiveShadow = true;
  const scenery = [
    seaSheet,
    f.waterSheet({ x0: -4000, x1: -1400, y0: 500, y1: 5000 }, -10, "Jungle_Brackish"),
    f.waterSheet({ x0: -3400, x1: -2000, y0: -2200, y1: -1000 }, -10, "Jungle_Brackish"),
    sand.mesh,
  ];

  // ---- the way out ----
  f.exit("yodia", [1980, 5150], [1900, 4500]);

  // ---- placing: every thing remembered (x, y, r) so the plants keep clear ----
  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number) => taken.every(([px, py, pr]) => Math.hypot(px - x, py - y) > pr + r);
  const open = (x: number, y: number, r: number) => [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0);
  const put = (ref: string, at: XY, h = 0, o: { s?: number; solid?: "auto" | "none" | SolidSpec[]; r?: number; z?: number } = {}) => {
    f.put(ref.includes(":") ? ref : `jungle:${ref}`, at, h, { s: o.s ?? 1, solid: o.solid ?? "auto", z: o.z ?? 0 });
    taken.push([at[0], at[1], o.r ?? 120]);
  };
  const box = (w: number, d: number, x = 0, y = 0, kind = "ruin"): SolidSpec => ({ kind, x, y, w, d, rot: 0 });
  const disc = (r: number, x = 0, y = 0, kind = "tree"): SolidSpec => ({ kind, x, y, r });
  const onBeach = (x: number, y: number) => inside(BEACH, x, y);

  // the boardwalk: 4 m pieces turned along its curve, the rails solid
  const bwLen = lengthOf(BW), bwN = Math.ceil(bwLen / 385);
  for (let i = 0; i < bwN; i++) {
    const { p, dir } = along(BW, ((i + 0.5) * bwLen) / bwN);
    put("boardwalk", p, (Math.atan2(-dir[0], dir[1]) * 180) / Math.PI, { solid: [box(16, 400, -112, 0, "fence"), box(16, 400, 112, 0, "fence")], r: 200 });
  }
  // the fisherman's stilt house beside it, his canoe, his fish stakes out in the sea
  put("yodia:stilt_house", [-2770, 2700], 0, { solid: "none", r: 420 });
  put("yodia:outrigger_canoe", [-2650, 3250], 20, { solid: "none", r: 300, z: -14 });
  put("fish_stakes", [-5000, 2200], 0, { solid: "none", r: 500 });
  put("fish_stakes", [-3200, -4900], 80, { solid: "none", r: 500 });
  put("yodia:fishing_boat", [-1800, -4950], 15, { solid: "none", r: 400, z: -16 });

  // the Yodia way: carved posts, torches, a sign
  put("yodia:guardian_post", [1610, 4950], -90, { r: 80 });
  put("yodia:guardian_post", [2270, 4950], -90, { r: 80 });
  for (const x of [1520, 2230]) put("yodia:tiki_torch", [x, 4650], 0, { solid: [disc(14, 0, 0, "post")], r: 60 });
  put("trail_sign", [600, 3650], -60, { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("trail_sign", [650, 700], 120, { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("trail_sign", [560, -2350], 200, { solid: [disc(20, 0, 0, "post")], r: 90 });

  // the beach: the wreck in the shallows, the salvagers' camp, flotsam, canoes drawn up, palms
  put("shipwreck", [-600, -3750], -90, { solid: [box(560, 1700, -60, 0, "wreck")], r: 900 });
  put("explorer_camp", [1000, -3620], 0, { solid: [box(320, 280, 150, 140, "camp"), box(270, 270, -180, -160, "camp"), disc(60, -200, 170, "camp")], r: 420 });
  put("wreck_debris", [-2000, -3350], 40, { solid: "none", r: 300 });
  put("wreck_debris", [1600, -3850], 160, { solid: "none", r: 300 });
  put("wreck_debris", [-400, -2950], 260, { s: 0.7, solid: "none", r: 220 });
  put("yodia:outrigger_canoe", [-2700, -3550], 70, { solid: [box(520, 90, 0, 0, "boat")], r: 300 });
  put("yodia:outrigger_canoe", [-3100, -3300], 95, { solid: [box(520, 90, 0, 0, "boat")], r: 300 });
  put("rock_cluster", [2050, -3900], 20, { solid: [disc(170, 0, 0, "rock")], r: 230 });
  put("boulder_mossy", [-3500, -3700], 100, { s: 0.8, solid: [disc(130, 0, 0, "rock")], r: 200 });
  for (let i = 0; i < INNER.length; i += 2) {
    const [x, y] = INNER[i], w = widthAt(x);
    if (w < 300 || Math.abs(x - -600) < 1100 || Math.abs(x - 1000) < 450 || Math.abs(x + 2000) < 300) continue;
    const py = y - 120 - f.rnd() * Math.min(500, w * 0.4);
    put(f.rnd() < 0.6 ? "flora:PalmBent" : "flora:Palm", [x + (f.rnd() - 0.5) * 200, py], -90 + (f.rnd() - 0.5) * 60, { s: 0.85 + f.rnd() * 0.3, r: 160 });
  }
  // the headland's foot: boulders along the sea; stacks out in the water
  for (let d = 300, L = lengthOf(SHORE); d < L; d += 420) {
    const { p, dir } = along(SHORE, d);
    if (p[0] < 2350 || p[0] > 6300 || p[1] < -6400) continue;
    let n: XY = [-dir[1], dir[0]];
    if (!inside(SEA, p[0] + n[0] * 150, p[1] + n[1] * 150)) n = [dir[1], -dir[0]];
    put("yodia:shore_rocks", [p[0] - n[0] * 40, p[1] - n[1] * 40], (Math.atan2(-n[1], -n[0]) * 180) / Math.PI, { solid: "none", r: 150 });
  }
  put("sea_stack", [-200, -6900], 20, { solid: "none", r: 500, z: -10 });
  put("sea_stack", [3700, -7200], 120, { s: 0.9, solid: "none", r: 500, z: -10 });
  put("sea_stack", [-6100, -2600], 70, { s: 1.1, solid: "none", r: 500, z: -10 });
  put("sea_stack", [-5900, 1800], 200, { s: 0.75, solid: "none", r: 400, z: -10 });

  // the headland: weathered rocks, wind-bent palms; the beacon tower on the tip
  put("beacon_ruin", [5300, -4800], -90, { solid: [disc(215, 0, 0, "tower")], r: 420 });
  put("rock_cluster", [6000, -4200], 140, { s: 0.8, solid: [disc(140, 0, 0, "rock")], r: 220 });
  put("boulder_mossy", [3300, -3800], 30, { solid: [disc(160, 0, 0, "rock")], r: 230 });
  put("rock_cluster", [4300, -2000], 250, { solid: [disc(170, 0, 0, "rock")], r: 230 });
  put("boulder_mossy", [2800, -4300], 200, { s: 0.75, solid: [disc(120, 0, 0, "rock")], r: 200 });
  for (const [x, y, h] of [[3500, -4600, -60], [2700, -3600, -100], [4400, -3400, -80], [3800, -2300, -120], [5000, -2200, -90], [4600, -4500, -70]] as [number, number, number][])
    put("flora:PalmBent", [x, y], h, { s: 0.9, r: 160 });
  put("trail_sign", [4850, -2400], 30, { solid: [disc(20, 0, 0, "post")], r: 90 });

  // the ridge: the lookout tower, a hilltop pavilion with a spirit house, a broken wall
  put("yodia:watchtower", [2600, 2250], 30, { solid: [box(240, 240, 0, 0, "tower")], r: 260 });
  put("yodia:sala", [3600, 3600], 0, { solid: [box(640, 440, 0, 0, "sala")], r: 420 });
  put("yodia:spirit_house", [3100, 3150], 0, { solid: [disc(35, 0, 0, "post")], r: 80 });
  put("ruin_wall", [4600, 4300], 30, { solid: [box(130, 600)], r: 320 });
  put("rock_cluster", [5200, 3200], 60, { s: 0.8, solid: [disc(140, 0, 0, "rock")], r: 220 });

  // inland: logs, stumps, a mossy boulder or two
  put("fallen_log", [1700, 900], 30, { solid: [box(110, 620, 0, 0, "log")], r: 330 });
  put("fallen_log", [-1100, -800], 110, { s: 0.9, solid: [box(100, 560, 0, 0, "log")], r: 300 });
  put("stump", [3600, -900], 0, { solid: [disc(60, 0, 0, "log")], r: 110 });
  put("stump", [-1000, 2600], 80, { solid: [disc(60, 0, 0, "log")], r: 110 });
  put("boulder_mossy", [4700, 300], 60, { solid: [disc(160, 0, 0, "rock")], r: 230 });
  put("rock_cluster", [-1300, 4700], 10, { s: 0.7, solid: [disc(130, 0, 0, "rock")], r: 200 });

  // ---- the mangroves: in the lagoons (clear of the boardwalk), round their shores, along the
  // south shore and out into its shallows; nipa palms between ----
  const rnd = f.rnd;
  for (let x = -4000; x < -1300; x += 330)
    for (let y = 400; y < 5100; y += 330) {
      const px = x + (rnd() - 0.5) * 260, py = y + (rnd() - 0.5) * 260;
      const wet = inside(LA, px, py), shoreDist = wet ? 0 : Math.min(...LA.map(([lx, ly]) => Math.hypot(lx - px, ly - py)));
      if ((!wet && shoreDist > 450) || distTo(BW, px, py) < 300 || !free(px, py, 150) || rnd() > (wet ? 0.3 : 0.5)) continue;
      if (!wet && (ground.kind(px, py) === 1 || f.warps.some((w) => Math.hypot(w.x - px, w.y - py) < 900))) continue;
      put(rnd() < 0.78 ? "mangrove" : "nipa_palm", [px, py], rnd() * 360, { s: 0.75 + rnd() * 0.4, solid: "none", r: 170 });
    }
  for (const [x, y] of ring(LB, 260)) if (free(x, y, 120)) put(rnd() < 0.7 ? "mangrove" : "nipa_palm", [x, y], rnd() * 360, { s: 0.7 + rnd() * 0.3, solid: "none", r: 150 });
  for (let d = 0, L = lengthOf(SHORE); d < L; d += 300) {
    const { p, dir } = along(SHORE, d);
    if (p[0] > -3900 || p[1] < -3700) continue;
    let n: XY = [-dir[1], dir[0]];
    if (!inside(SEA, p[0] + n[0] * 150, p[1] + n[1] * 150)) n = [dir[1], -dir[0]];
    const off = -250 + rnd() * 650, x = p[0] + n[0] * off, y = p[1] + n[1] * off;
    if (!free(x, y, 130) || ground.kind(x, y) === 1) continue;
    put(rnd() < 0.8 ? "mangrove" : "nipa_palm", [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.4, solid: "none", r: 160 });
  }

  // ---- the coastal jungle: thick along the edges and in thickets, a tree here and there between;
  // ferns and bushes under it ----
  const THICKETS: [number, number, number][] = [
    [-900, -800, 500], [1600, 600, 700], [3500, 500, 600], [4800, -800, 600], [-1300, 5100, 500], [1000, 4600, 600], [4500, 4500, 800],
    [2500, 5000, 600], [5000, 3000, 600], [-1300, -2000, 500], [2300, -1500, 500], [500, 3100, 450], [-800, -2200, 400], [1700, -2000, 400],
  ];
  // round a landmark, and the stretch south of it where tall crowns would hide it from the camera
  const view = (x: number, y: number, cx: number, cy: number, r: number) => Math.hypot(x - cx, y - cy) < r || (x < cx && x > cx - r * 1.8 && Math.abs(y - cy) < r * 0.9);
  const keepOut = (x: number, y: number) =>
    onBeach(x, y) || inside(L1b, x, y) || view(x, y, 3600, 3600, 700) || view(x, y, 2600, 2250, 400) || view(x, y, 3100, 3150, 300) ||
    f.warps.some((w) => Math.hypot(w.x - x, w.y - y) < 700) || distTo(SHORE, x, y) < 400;
  const KINDS = ["flora:JungleTree", "flora:PalmTall", "flora:JungleTree", "flora:Palm", "vine_tree", "flora:Bamboo", "flora:JungleTree", "flora:JungleTree"];
  for (let x = -R + 150; x < R; x += 330)
    for (let y = -R + 150; y < R; y += 330) {
      const px = x + (rnd() - 0.5) * 260, py = y + (rnd() - 0.5) * 260;
      const edge = Math.min(R - Math.abs(px), R - Math.abs(py));
      const thick = THICKETS.some(([cx, cy, r]) => Math.hypot(px - cx, py - cy) < r);
      const headland = inside(L1, px, py);
      const want = headland ? 0.06 : edge < 700 ? 0.85 : edge < 1200 ? 0.5 : thick ? 0.65 : 0.1;
      if (rnd() > want || !open(px, py, 260) || !f.level(px, py, 170) || !free(px, py, 230) || keepOut(px, py)) continue;
      const kind = headland ? "flora:PalmBent" : KINDS[Math.floor(rnd() * KINDS.length)];
      const big = kind.endsWith("vine_tree");
      put(kind, [px, py], headland ? -90 + (rnd() - 0.5) * 80 : rnd() * 360, { s: 0.8 + rnd() * 0.35, solid: kind.includes("Bamboo") ? [disc(45)] : big ? [disc(50)] : "auto", r: big ? 260 : 180 });
    }
  const UNDER = ["giant_fern", "flora:JungleBush", "giant_fern", "elephant_ear", "flora:JungleBush", "tree_fern", "giant_fern", "flora:JungleBush", "elephant_ear", "giant_fern", "flora:JungleBush"];
  for (let x = -R + 100; x < R; x += 230)
    for (let y = -R + 100; y < R; y += 230) {
      const px = x + (rnd() - 0.5) * 200, py = y + (rnd() - 0.5) * 200;
      if (onBeach(px, py) || distTo(SHORE, px, py) < 250) continue;
      const edge = Math.min(R - Math.abs(px), R - Math.abs(py));
      const headland = inside(L1, px, py);
      const nearTree = taken.some(([tx, ty, tr]) => tr >= 180 && tr <= 260 && Math.hypot(tx - px, ty - py) < 420);
      const want = headland ? 0.12 : edge < 900 ? 0.6 : nearTree ? 0.55 : !open(px, py, 420) ? 0.45 : 0.28;
      if (rnd() > want || !open(px, py, 170) || !f.level(px, py, 100) || !free(px, py, 90) || keepOut(px, py)) continue;
      const kind = headland ? (rnd() < 0.6 ? "flora:JungleBush" : "giant_fern") : UNDER[Math.floor(rnd() * UNDER.length)];
      put(kind, [px, py], rnd() * 360, { s: 0.75 + rnd() * 0.4, solid: kind === "tree_fern" ? [disc(22, 0, 0, "post")] : "none", r: 80 });
    }
  // past the edge: jungle on the land, nothing on the sea
  const rimOut = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) !== 0 || distTo(SHORE, x, y) < 300;
  f.woods(AREA, ["JungleTree", "JungleTree", "PalmTall", "Bamboo", "JungleTree", "JungleBush", "Palm", "JungleTree"], rimOut, { count: 620, spacing: 330, tries: 12000 });
  f.woods(AREA, ["vine_tree", "giant_fern", "mangrove"], (x, y) => rimOut(x, y) || (Math.abs(x) < R + 500 && Math.abs(y) < R + 500), { count: 120, spacing: 600, tries: 4000, kit: "jungle" });

  // ---- monsters: the jungle glades, the beach, the headland and its tip, the ridge ----
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 720 });

  // the fisherman stands on the boardwalk by his house
  let fi = 0;
  BW.forEach((p, i) => { if (Math.hypot(p[0] + 2770, p[1] - 2700) < Math.hypot(BW[fi][0] + 2770, BW[fi][1] - 2700)) fi = i; });
  const fisher = BW[fi], hut = BW[Math.min(BW.length - 1, fi + 3)];
  const bwMid = along(BW, bwLen * 0.3).p;
  return f.finishField({
    ground,
    scenery,
    sky: "#4d7f8f",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && !onBeach(x, y) && distTo(SHORE, x, y) > 300, density: 0.1 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 1860, y: 4400 },
    npcs: [
      {
        id: "mc_fisher", x: fisher[0], y: fisher[1], face: 0, name: "ลุงเทียม", title: "ชาวประมงป่าชายเลน", role: "talk",
        look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
        lines: [
          "ป่าโกงกางนี่เป็นบ้านของปูกับปลาตีน เดินบนสะพานไม้ไว้นะ ลงไปในเลนแล้วจะติดหล่ม",
          "ซากเรือสำเภาที่หาดทางตะวันออกเกยตื้นมาตั้งแต่พายุใหญ่เมื่อสิบปีก่อน",
          "บนแหลมมีหอไฟเก่า ใครกันยังจุดไฟอยู่ทุกคืน ข้าก็ไม่เคยเห็นตัว",
        ],
      },
      {
        id: "mc_salvager", x: 700, y: -3150, face: -150, name: "นาวี", title: "นักงมซากเรือ", role: "talk",
        look: { gender: "female", hair: "hime", hairColor: "teal", eyes: "blue", top: "top_adventurer_navy", bottom: "bottom_adventurer_sand" },
        lines: [
          "ในท้องเรือลำนั้นยังมีหีบสินค้าจากโอซากิค้างอยู่ แต่ตอนน้ำขึ้นพวกสัตว์ทะเลมันมาเฝ้าเต็มไปหมด",
          "อยากชมวิวก็ขึ้นไปบนแหลมสิ จากหอไฟมองเห็นเกาะหินกลางทะเลเลยล่ะ",
        ],
      },
    ],
    labels: [
      { x: 1980, y: 4900, text: "ทางไปโยเดีย", kind: "gate" },
      { x: bwMid[0], y: bwMid[1], text: "ป่าชายเลน" },
      { x: -600, y: -3150, text: "หาดซากเรือ" },
      { x: 5300, y: -4300, text: "แหลมหอไฟเก่า" },
      { x: 3000, y: -3100, text: "หน้าผาริมทะเล", kind: "small" },
      { x: 3050, y: 3600, text: "เนินศาลาชมวิว" },
      { x: 2350, y: 2750, text: "หอสังเกตการณ์", kind: "small" },
      { x: hut[0], y: hut[1], text: "กระท่อมชาวประมง", kind: "small" },
      { x: 550, y: -3080, text: "ค่ายนักงมซากเรือ", kind: "small" },
    ],
  });
}

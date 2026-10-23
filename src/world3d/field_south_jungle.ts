// ป่าดิบแดนใต้ (the southern jungle), monsters Lv 25-35: the rainforest between the desert town of
// Bahamas (north) and the port of Yodia (south). A track of red earth winds through it from the
// Yodia gate in the south, past an explorers' camp and a mound where a great stone face looks
// out of the trees, over a stream by a plank bridge, and on north between two heights to the way
// to Bahamas. To the west the ruins of an old city stand on a plateau: a gate and broken walls,
// fallen columns, and on a higher step the temple mountain with its fig-split prang. To the east
// a ridge carries a giant strangler fig. In the south-east, mud pools ringed with reeds. A side
// track runs on west past the stream to the way out to the royal necropolis, where two of the
// necropolis's stone guardians stand overgrown on either side of it.
//
// Full size in the field's own centimetres (north +X, east -Y), scaled by TOWN_SCALE in finish.

import { FieldBuilder } from "./field";
import { useKits } from "./town";
import type { Town } from "./town";
import type { Poly } from "./paved";
import type { SolidSpec } from "../world";
import { KIT as JUNGLE } from "./kits/jungle";
import { KIT as YODIA } from "./kits/yodia";
import { KIT as OLD_RUINS } from "./kits/ruins";

useKits(JUNGLE, YODIA, OLD_RUINS);

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
// a point `d` along a polyline and the heading of the line there
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

export function build(quality: { flowers: number }): Town {
  // ---- the land: the ruin plateau and its temple step (north-west), the fig ridge (north-east),
  // the face mound (south-west), mountain walls past the edge, low hills and a hollow ----
  const P1: Poly = bevel([[600, 1500], [1600, 900], [3300, 1000], [4700, 1300], [5300, 2600], [5300, 4600], [4000, 5600], [2000, 5600], [700, 4700], [300, 3000]]);
  const P1b: Poly = bevel([[1900, 2400], [3800, 2200], [4500, 3300], [4300, 4700], [2700, 4900], [1700, 3800]]);
  const P2: Poly = bevel([[800, -2200], [2200, -1700], [3800, -2000], [4600, -2900], [4400, -4300], [3000, -5000], [1400, -4700], [600, -3500]]);
  const P3: Poly = bevel([[-4300, 1900], [-3000, 1500], [-2000, 2000], [-1900, 3400], [-2800, 4300], [-4200, 4000], [-4700, 3000]]);
  const RIM_E: Poly = bevel([[-300, -6000], [1500, -6300], [3200, -5800], [4800, -6300], [6200, -6000], [6500, -9300], [-500, -9300]]);
  const RIM_W: Poly = bevel([[-5600, 5900], [-3800, 6300], [-1900, 6000], [-1700, 9300], [-5800, 9300]]);
  const RIM_N: Poly = bevel([[6300, 1200], [7200, 600], [9300, 900], [9300, 6500], [6000, 6600], [5800, 4000]]);
  const f = new FieldBuilder(115, {
    hills: [
      { x: -3300, y: -700, r: 1100, h: 110 }, { x: 100, y: 3300, r: 900, h: 130 }, { x: -4700, y: -1000, r: 900, h: -80 },
      { x: 3600, y: -1000, r: 800, h: 90 }, { x: -100, y: -3400, r: 700, h: 120 }, { x: -2600, y: 4800, r: 700, h: 100 },
      { x: 5000, y: 300, r: 900, h: 120 }, { x: -5200, y: -4200, r: 900, h: 140 },
    ],
    plateaus: [
      { poly: P1, h: 380, ramps: [{ top: [2500, 953], bottom: [2570, -245], width: 450 }] },
      { poly: P1b, h: 760, ramps: [{ top: [1800, 3100], bottom: [612, 2930], width: 420 }] },
      { poly: P2, h: 320, ramps: [{ top: [1500, -1950], bottom: [1164, -1008], width: 420 }] },
      { poly: P3, h: 260, ramps: [{ top: [-3650, 1700], bottom: [-3900, 887], width: 420 }] },
      { poly: RIM_E, h: 650 }, { poly: RIM_W, h: 600 }, { poly: RIM_N, h: 700 },
    ],
    rock: "Jungle_CliffMoss",
  });
  const R = 5500, AREA = { x0: -9000, x1: 9000, y0: -9000, y1: 9000 };

  // ---- paths: the main track from the Yodia way (south) to the Bahamas way (north), straight over
  // the bridge; branches up the three heights and down to the mud pools ----
  const MAIN = smooth([
    [-5800, 400], [-5100, 420], [-4400, 520], [-3900, 820], [-3200, 650], [-2600, 250], [-2000, -170], [-1320, -200], [-650, -200],
    [0, -380], [600, -700], [1150, -950], [1700, -700], [2550, -280], [3300, -520], [4100, -900], [4700, -720], [5150, -660], [5800, -650],
  ]);
  const POOLS = smooth([[-2600, 250], [-2900, -600], [-3200, -1500], [-3250, -2400], [-3250, -3350], [-3250, -3850]]);
  const RUINS = smooth([[2560, -300], [2540, 300], [2510, 900], [2480, 1180]], 3);
  // on the plateau the old flagstone causeway, through the gate to the temple step and up it
  const CAUSEWAY = smooth([[2490, 1060], [2440, 1300], [2200, 1650], [1800, 1950], [1300, 2350], [900, 2700], [612, 2930]]);
  const TEMPLE = smooth([[612, 2930], [1200, 3010], [1800, 3100], [2100, 3300], [2250, 3500]], 3);
  const FIG = smooth([[1160, -1000], [1330, -1480], [1500, -1950], [1800, -2400], [2150, -2800], [2300, -2950]], 3);
  const FACE = smooth([[-3900, 840], [-3780, 1300], [-3650, 1700], [-3500, 2150], [-3420, 2450]], 3);
  const WEST = smooth([[-650, -200], [-400, 600], [-350, 1500], [-250, 2300], [-450, 3000]]);
  // on from the west track's end to the way out to the necropolis
  const NECRO = smooth([[-450, 3000], [-350, 3800], [-180, 4500], [-250, 5150], [-320, 7000]]);
  const roads: Poly[] = [band(MAIN, 440), band(POOLS, 360), band(RUINS, 420), band(FIG, 380), band(FACE, 380), band(WEST, 320), band(NECRO, 380)];
  // the old flagstone court before the temple stair
  const COURT: Poly = [[2050, 2950], [2650, 2850], [2700, 4150], [2080, 4050]];

  // ---- water: a stream across from west to east (the bridge carries the track over it), three
  // mud pools in the south-east ----
  const STREAM = smooth([[-1200, 9500], [-1000, 7000], [-1500, 5300], [-1100, 3600], [-1500, 2000], [-1300, 600], [-1340, -1000], [-900, -2600], [-1400, -4300], [-1100, -6500], [-1300, -9500]], 5);
  const M1 = blob(-2300, -2300, 620, 520, 1), M2 = blob(-4000, -3000, 520, 600, 2), M3 = blob(-2650, -4250, 480, 380, 3);
  const ground = f.ground({ area: AREA, cell: 60, roads, plazas: [COURT, band(CAUSEWAY, 360), band(TEMPLE, 340)], water: [band(STREAM, 470), M1, M2, M3], base: "jungle", road: [0.6, 0.47, 0.37], plaza: [0.7, 0.72, 0.6] });
  const BRIDGE: XY = [-1320, -200];
  f.blockBand(STREAM.filter((p) => Math.abs(p[1]) < 6200), 430, { gaps: [BRIDGE], gapR: 175, step: 125 });
  for (const [m, c, r] of [[M1, [-2300, -2300], 470], [M2, [-4000, -3000], 450], [M3, [-2650, -4250], 360]] as [Poly, XY, number][]) {
    f.blockDisc(c, r, "mud");
    for (let i = 0; i < m.length; i += 2) {
      const [x, y] = m[i];
      f.blockDisc([c[0] + (x - c[0]) * 0.86, c[1] + (y - c[1]) * 0.86], 150, "mud");
    }
  }
  const scenery = [
    f.waterSheet({ x0: -2000, x1: -400, y0: -9000, y1: 9000 }, -14, "Jungle_Stream"),
    f.waterSheet({ x0: -3000, x1: -1600, y0: -2950, y1: -1650 }, -9, "Jungle_Mud"),
    f.waterSheet({ x0: -4600, x1: -3400, y0: -3700, y1: -2300 }, -9, "Jungle_Mud"),
    f.waterSheet({ x0: -3200, x1: -2100, y0: -4700, y1: -3800 }, -9, "Jungle_Mud"),
  ];

  // ---- the ways out ----
  f.exit("yodia", [-5150, 420], [-4450, 510]);
  f.exit("bahamas", [5150, -660], [4450, -780]);
  f.exit("royal_necropolis", [-250, 5150], [-280, 4450]);

  // ---- what stands where: every placement is remembered (x, y, r) so the forest keeps clear ----
  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number) => taken.every(([px, py, pr]) => Math.hypot(px - x, py - y) > pr + r);
  const open = (x: number, y: number, r: number) => [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0);
  const put = (ref: string, at: XY, h = 0, o: { s?: number; solid?: "auto" | "none" | SolidSpec[]; r?: number } = {}) => {
    f.put(ref.includes(":") ? ref : `jungle:${ref}`, at, h, { s: o.s ?? 1, solid: o.solid ?? "auto" });
    taken.push([at[0], at[1], o.r ?? 120]);
  };
  const box = (w: number, d: number, x = 0, y = 0, kind = "ruin"): SolidSpec => ({ kind, x, y, w, d, rot: 0 });
  const disc = (r: number, x = 0, y = 0, kind = "tree"): SolidSpec => ({ kind, x, y, r });

  // the bridge over the stream, its rails solid
  put("plank_bridge", BRIDGE, 0, { solid: [box(1040, 18, 0, -178, "fence"), box(1040, 18, 0, 178, "fence")], r: 560 });
  for (const [x, y] of [[-1950, -470], [-700, 120], [-1900, 160], [-720, -520]] as XY[]) put("rock_cluster", [x, y], x + y, { s: 0.55, solid: [disc(80, 0, 0, "rock")], r: 150 });

  // the Yodia way: carved guardian posts and torches, a trail sign, the explorers' camp
  put("yodia:guardian_post", [-4950, 90], 0, { r: 80 });
  put("yodia:guardian_post", [-4950, 760], 0, { r: 80 });
  for (const y of [-20, 870]) put("yodia:tiki_torch", [-4700, y], 0, { solid: [disc(14, 0, 0, "post")], r: 60 });
  put("trail_sign", [-4550, 220], 200, { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("explorer_camp", [-4720, 1300], 90, { solid: [box(320, 280, 150, 140, "camp"), box(270, 270, -180, -160, "camp"), disc(60, -200, 170, "camp")], r: 420 });
  put("boulder_mossy", [-5100, 1900], 30, { s: 0.9, solid: [disc(150, 0, 0, "rock")], r: 220 });
  put("fallen_log", [-3000, 1150], 60, { solid: [box(110, 620, 0, 0, "log")], r: 330 });

  // the face mound (south-west): the stone face looking down the path, columns and a broken wall
  put("stone_face", [-3100, 2900], 53, { solid: [box(320, 360), box(80, 70, -170, 0)], r: 330 });
  put("ruin_pillars", [-3950, 3250], 20, { solid: [disc(45, -60, -150, "post"), disc(45, 80, 60, "post"), box(70, 220, -120, 250, "ruin")], r: 300 });
  put("ruin_wall", [-2550, 3750], 45, { solid: [box(130, 600)], r: 320 });
  put("ruin_wall", [-4200, 2300], -60, { solid: [box(130, 600)], r: 320 });
  put("rock_cluster", [-2400, 2200], 80, { s: 0.8, solid: [disc(140, 0, 0, "rock")], r: 220 });
  put("trail_sign", [-3550, 420], 150, { solid: [disc(20, 0, 0, "post")], r: 90 });

  // the mud pools: reeds round them, stones, logs, a sign at the fork
  const reedsRound = (poly: Poly, every: number) => poly.forEach(([x, y], i) => { if (i % every === 0) put("reeds", [x, y], i * 47, { s: 0.8 + (i % 3) * 0.15, solid: "none", r: 60 }); });
  reedsRound(M1, 2);
  reedsRound(M2, 2);
  reedsRound(M3, 3);
  put("fallen_log", [-2250, -2450], 140, { s: 0.8, solid: "none", r: 200 });
  put("rock_cluster", [-4050, -2850], 70, { s: 0.45, solid: "none", r: 120 });
  put("stump", [-2600, -4200], 30, { s: 0.9, solid: "none", r: 80 });
  put("rock_cluster", [-3550, -3550], 30, { s: 0.7, solid: [disc(120, 0, 0, "rock")], r: 200 });
  put("fallen_log", [-1700, -3300], 20, { solid: [box(110, 620, 0, 0, "log")], r: 330 });
  put("fallen_log", [-4450, -2000], 100, { s: 0.85, solid: [box(100, 540, 0, 0, "log")], r: 300 });
  put("stump", [-2950, -1300], 0, { solid: [disc(60, 0, 0, "log")], r: 110 });
  put("stump", [-3900, -4300], 70, { solid: [disc(60, 0, 0, "log")], r: 110 });
  put("trail_sign", [-2380, -250], 40, { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("boulder_mossy", [-1850, -4900], 100, { solid: [disc(160, 0, 0, "rock")], r: 230 });

  // the stream banks: reeds, rocks, a fallen trunk across the water upstream
  for (let d = 400; d < lengthOf(STREAM); d += 520) {
    const { p, dir } = along(STREAM, d), s = Math.floor(d / 520) % 2 ? 1 : -1;
    const x = p[0] - dir[1] * s * 300, y = p[1] + dir[0] * s * 300;
    if (Math.abs(x) > R + 2000 || Math.abs(y) > R + 2000 || Math.hypot(x - BRIDGE[0], y - BRIDGE[1]) < 900) continue;
    if (Math.abs(x) < R && Math.abs(y) < R) put("reeds", [x, y], d, { s: 0.9, solid: "none", r: 70 });
  }
  put("fallen_log", [-1350, 4300], 90, { s: 1.1, solid: "none", r: 360 });

  // the ruin plateau: a gate on the old road with walls either side, columns, walls by the temple step
  put("ruin_gate", [1800, 1950], -38, { solid: [box(270, 130, 0, -215), box(270, 130, 0, 215)], r: 360 });
  put("ruin_wall", [1435, 1484], -38, { solid: [box(130, 600)], r: 320 });
  put("rock_cluster", [2150, 2250], 40, { s: 0.6, solid: [disc(100, 0, 0, "rock")], r: 160 });
  for (const [d, side, h] of [[700, 1, 20], [2100, -1, 140]] as [number, number, number][]) {
    const { p, dir } = along(CAUSEWAY, d);
    put("ruin_pillars", [p[0] - dir[1] * side * 560, p[1] + dir[0] * side * 560], h, { s: 0.85, solid: [disc(45, -60, -150, "post"), disc(45, 80, 60, "post"), box(70, 220, -120, 250, "ruin")], r: 300 });
  }
  put("ruin_pillars", [3700, 1650], 10, { solid: [disc(45, -60, -150, "post"), disc(45, 80, 60, "post"), box(70, 220, -120, 250, "ruin")], r: 300 });
  put("ruin_pillars", [4700, 2500], 110, { solid: [disc(45, -60, -150, "post"), disc(45, 80, 60, "post"), box(70, 220, -120, 250, "ruin")], r: 300 });
  put("ruin_wall", [1300, 3900], 80, { solid: [box(130, 600)], r: 320 });
  put("ruin_wall", [4900, 3500], 0, { solid: [box(130, 600)], r: 320 });
  put("ruin_wall", [3400, 5150], 90, { solid: [box(130, 600)], r: 320 });
  put("stone_face", [1100, 4600], -150, { s: 0.75, solid: [box(320, 360)], r: 280 });
  put("trail_sign", [2900, -750], 120, { solid: [disc(20, 0, 0, "post")], r: 90 });
  // the temple mountain on its step, its court, trees at the corners
  put("ruin_temple", [3200, 3500], 0, { solid: [box(1400, 1340, -40, 0), box(220, 360, -760, 0)], r: 900 });
  for (const [x, y, h] of [[4250, 3200, 30], [4000, 4500, 120], [2650, 4500, 200]] as [number, number, number][]) put("vine_tree", [x, y], h, { s: 0.85, solid: [disc(50)], r: 200 });
  put("rock_cluster", [2300, 2700], 0, { s: 0.6, solid: [disc(100, 0, 0, "rock")], r: 160 });

  // the fig ridge (north-east): the giant fig over a clearing, rocks, a camp's cold fire
  put("strangler_fig", [2900, -3450], 20, { solid: [disc(320)], r: 600 });
  put("boulder_mossy", [3900, -2700], 200, { solid: [disc(160, 0, 0, "rock")], r: 230 });
  put("rock_cluster", [1600, -4200], 60, { solid: [disc(160, 0, 0, "rock")], r: 230 });
  put("trail_sign", [900, -520], 300, { solid: [disc(20, 0, 0, "post")], r: 90 });

  // the necropolis way: two of its stone guardians either side of the track, a trail sign
  put("ruins:guardian_statue", [-760, 4920], 90, { solid: [box(170, 170, 0, 0, "statue")], r: 160 });
  put("ruins:guardian_statue", [260, 4880], 90, { solid: [box(170, 170, 0, 0, "statue")], r: 160 });
  put("trail_sign", [-650, 4350], -60, { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("rock_cluster", [500, 4400], 20, { s: 0.6, solid: [disc(100, 0, 0, "rock")], r: 160 });

  // the Bahamas way: torches and a sign
  for (const y of [-1000, -330]) put("yodia:tiki_torch", [4900, y], 0, { solid: [disc(14, 0, 0, "post")], r: 60 });
  put("trail_sign", [4500, -1150], 30, { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("boulder_mossy", [5000, -1700], 300, { s: 0.8, solid: [disc(130, 0, 0, "rock")], r: 200 });
  put("fallen_log", [3600, -1450], 100, { s: 0.9, solid: [box(100, 560, 0, 0, "log")], r: 300 });
  put("stump", [600, -1500], 20, { solid: [disc(60, 0, 0, "log")], r: 110 });
  put("stump", [-900, 1300], 140, { solid: [disc(60, 0, 0, "log")], r: 110 });

  // ---- the forest: thick along the edges and in thickets, a tree here and there between, so
  // glades open where the monsters roam; ferns, bushes and elephant ears under it all ----
  const THICKETS: [number, number, number][] = [
    [-2500, 1000, 600], [-4900, 4600, 800], [-2300, 5000, 600], [-4800, -2000, 700], [-1900, -3400, 500], [-4300, -4700, 800],
    [400, 900, 650], [-300, 2100, 500], [1300, -4000, 650], [3800, -4300, 550], [4900, -2200, 650], [1800, 5000, 700],
    [5000, 4000, 700], [-500, -2300, 600], [-400, -4700, 700], [2100, -5000, 600], [4900, 1600, 500],
    [-3800, -5000, 600], [-1300, 1500, 500], [3300, -1700, 400], [-2000, 3600, 500], [600, 4300, 500], [-4800, 3300, 500],
  ];
  // round a landmark, and the stretch south of it where tall crowns would hide it from the camera
  const view = (x: number, y: number, cx: number, cy: number, r: number) => Math.hypot(x - cx, y - cy) < r || (x < cx && x > cx - r * 1.8 && Math.abs(y - cy) < r * 0.9);
  const keepOut = (x: number, y: number) =>
    Math.hypot(x - 3200, y - 3500) < 1050 || Math.hypot(x - 2900, y - 3450) < 750 || Math.hypot(x - BRIDGE[0], y - BRIDGE[1]) < 700 ||
    view(x, y, -3100, 2900, 750) || view(x, y, 1800, 1950, 600) || view(x, y, -4720, 1300, 600) || view(x, y, 1100, 4600, 500) ||
    inside(COURT, x, y) || f.warps.some((w) => Math.hypot(w.x - x, w.y - y) < 700);
  const KINDS = ["flora:JungleTree", "flora:JungleTree", "flora:JungleTree", "vine_tree", "flora:Bamboo", "flora:JungleTree", "flora:PalmTall", "vine_tree", "flora:Bamboo"];
  const rnd = f.rnd;
  for (let x = -R + 150; x < R; x += 330)
    for (let y = -R + 150; y < R; y += 330) {
      const px = x + (rnd() - 0.5) * 260, py = y + (rnd() - 0.5) * 260;
      const edge = Math.min(R - Math.abs(px), R - Math.abs(py));
      const thick = THICKETS.some(([cx, cy, r]) => Math.hypot(px - cx, py - cy) < r);
      const want = edge < 700 ? 0.85 : edge < 1200 ? 0.5 : thick ? 0.65 : 0.1;
      if (rnd() > want || !open(px, py, 260) || !f.level(px, py, 170) || !free(px, py, 230) || keepOut(px, py)) continue;
      const kind = KINDS[Math.floor(rnd() * KINDS.length)];
      const big = kind.endsWith("vine_tree");
      put(kind, [px, py], rnd() * 360, { s: 0.8 + rnd() * 0.35, solid: kind.includes("Bamboo") ? [disc(45)] : big ? [disc(50)] : "auto", r: big ? 260 : 180 });
    }
  // the understory: thick near trees and paths, never on them
  const UNDER = ["giant_fern", "giant_fern", "flora:JungleBush", "elephant_ear", "giant_fern", "flora:JungleBush", "tree_fern", "flora:JungleBush", "elephant_ear", "giant_fern", "flora:JungleBush", "giant_fern"];
  for (let x = -R + 100; x < R; x += 230)
    for (let y = -R + 100; y < R; y += 230) {
      const px = x + (rnd() - 0.5) * 200, py = y + (rnd() - 0.5) * 200;
      const edge = Math.min(R - Math.abs(px), R - Math.abs(py));
      const nearTree = taken.some(([tx, ty, tr]) => tr >= 180 && tr <= 260 && Math.hypot(tx - px, ty - py) < 420);
      const nearPath = !open(px, py, 420);
      const want = edge < 900 ? 0.65 : nearTree ? 0.6 : nearPath ? 0.5 : 0.36;
      if (rnd() > want || !open(px, py, 170) || !f.level(px, py, 100) || !free(px, py, 90) || keepOut(px, py)) continue;
      const kind = UNDER[Math.floor(rnd() * UNDER.length)];
      put(kind, [px, py], rnd() * 360, { s: 0.75 + rnd() * 0.4, solid: kind === "tree_fern" ? [disc(22, 0, 0, "post")] : "none", r: 80 });
    }
  // past the edge: deep jungle all round (and on the mountain walls)
  const rimOut = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) === 3 || ground.kind(x, y) === 1;
  f.woods(AREA, ["JungleTree", "JungleTree", "Bamboo", "PalmTall", "JungleTree", "JungleBush", "JungleTree", "Palm"], rimOut, { count: 720, spacing: 330, tries: 12000 });
  f.woods(AREA, ["vine_tree", "giant_fern", "tree_fern"], (x, y) => rimOut(x, y) || Math.abs(x) < R + 500 && Math.abs(y) < R + 500, { count: 160, spacing: 600, tries: 4000, kit: "jungle" });

  // ---- monsters: the glades, the ruins, the ridge, the mound ----
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 680, keepOut: (x, y) => inside(COURT, x, y) || Math.hypot(x - BRIDGE[0], y - BRIDGE[1]) < 800 });

  const SPAWN: XY = [-4150, 600];
  return f.finishField({
    ground,
    scenery,
    sky: "#2c4724",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0, density: 0.12 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: SPAWN[0], y: SPAWN[1] },
    npcs: [
      {
        id: "sj_explorer", x: -4300, y: 1020, face: -60, name: "เมย์ลิน", title: "นักสำรวจซากโบราณ", role: "talk",
        look: { gender: "female", hair: "twintail", hairColor: "amber", eyes: "teal", top: "top_adventurer_ochre", bottom: "bottom_adventurer_cocoa" },
        lines: [
          "ทางตะวันตกเฉียงเหนือมีซากเมืองเก่าบนที่ราบสูง ปราสาทหินบนยอดยังมีต้นไทรขึ้นทะลุหลังคาอยู่เลย",
          "เศียรหินบนเนินนั่นยิ้มอยู่อย่างนั้นมาเป็นพันปีแล้ว ใครสร้างก็ไม่มีใครรู้",
          "ระวังบ่อโคลนทางตะวันออกเฉียงใต้นะ ตกลงไปแล้วขึ้นยาก",
        ],
      },
      {
        id: "sj_hunter", x: -2050, y: 120, face: 0, name: "พรานบุญ", title: "พรานป่าแห่งโยเดีย", role: "talk",
        look: { gender: "male", hair: "", hairColor: "ink", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
        lines: [
          "ข้ามสะพานไปทางเหนือ ทางจะพาไปถึงบาฮามัสกลางทะเลทราย",
          "ไทรยักษ์บนเนินฝั่งตะวันออกเป็นที่สิงของสัตว์ป่าตัวใหญ่ ข้าไม่ขึ้นไปคนเดียวหรอก",
        ],
      },
    ],
    labels: [
      { x: -4900, y: 420, text: "ทางไปโยเดีย", kind: "gate" },
      { x: 4900, y: -660, text: "ทางไปบาฮามัส", kind: "gate" },
      { x: -250, y: 4900, text: "ทางไปสุสานหลวงโบราณ", kind: "gate" },
      { x: 2250, y: 3500, text: "ปราสาทหินร้าง" },
      { x: 1600, y: 2150, text: "ซากเมืองโบราณ" },
      { x: 2300, y: -2950, text: "ไทรยักษ์บนเนิน" },
      { x: -3420, y: 2450, text: "เนินเศียรหิน" },
      { x: -3200, y: -2400, text: "บ่อโคลน" },
      { x: -1900, y: -200, text: "สะพานข้ามลำธาร", kind: "small" },
      { x: -4300, y: 900, text: "ค่ายนักสำรวจ", kind: "small" },
    ],
  });
}

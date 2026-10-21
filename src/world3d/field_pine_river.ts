// ป่าสนริมแม่น้ำ (the pine forest by the river), monsters Lv 20-30: a river comes off the
// mountains in the north over a 5 m waterfall, foams through rapids and winds south through a
// pine forest. The way in from the royal road is on the west side; a track runs down past an
// old ridge with a fire lookout, over the river on a long plank bridge and out the east side
// toward the steppe, where the pines thin into dry grass and old standing stones crown a
// two-step rise. Lumberjacks work the west bank below the falls, their logs piled by the water.
//
// Full size in its own centimetres (north +X, east -Y), scaled by TOWN_SCALE in finishField.

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Poly } from "./paved";
import { useKits } from "./town";
import type { Town } from "./town";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as TRUNRADA } from "./kits/trunrada";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(PLAINS, TRUNRADA);

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
function toLine(p: XY, pts: XY[]): number {
  let d = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * (bx - ax) + (p[1] - ay) * (by - ay)) / L2));
    d = Math.min(d, Math.hypot(ax + (bx - ax) * t - p[0], ay + (by - ay) * t - p[1]));
  }
  return d;
}
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
function blob(c: XY, rx: number, ry: number, seed: number, n = 18): Poly {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, k = 0.9 + rnd() * 0.12;
    return [c[0] + Math.cos(a) * rx * k, c[1] + Math.sin(a) * ry * k] as XY;
  });
}

// ---- the layout ----
const B = { minX: -5500, maxX: 5000, minY: -5500, maxY: 5500 };
const AREA = { x0: -9000, x1: 8500, y0: -9000, y1: 9000 };

// the mountains' edge in the north (a 5 m cliff, no way up) and the falls off it
const PN: Poly = [[4500, -9000], [4400, -3000], [4250, -1200], [4300, 1800], [4600, 4000], [4400, 9000], [8500, 9000], [8500, -9000]];
const FALLS_Y = 300;
const LIP_X = 4250 + (50 * (FALLS_Y + 1200)) / 3000;
const FALLS: XY = [LIP_X - 150, FALLS_Y];
// the river from the falls' pool south, and the pool
const POOL_C: XY = [3700, 320];
const POOL: Poly = blob(POOL_C, 470, 680, 5);
const RIVER: XY[] = smooth([[3900, 320], [3300, 520], [2300, 100], [1000, -500], [-300, -350], [-1500, 250], [-2800, 350], [-4100, -350], [-5600, -150], [-9000, 150]], 5);
const RW = 760;
// the bridge
function crossing(line: XY[], guess: XY): { at: XY; ax: XY; h: number } {
  const n = nearest(line, guess);
  let ax: XY = [-n.dir[1], n.dir[0]];
  if (ax[1] < 0) ax = [-ax[0], -ax[1]];
  return { at: n.at, ax, h: deg(ax) };
}
const C = crossing(RIVER, [-1000, -50]);
const off = (k: number): XY => [C.at[0] + C.ax[0] * k, C.at[1] + C.ax[1] * k];
const BRIDGE_S = 1.25;

// the old ridge on the west bank (PW) and the rise of standing stones on the east (PE, with its
// higher step PE2)
const PW: Poly = [[-4800, 1600], [-2600, 1500], [-2300, 3300], [-3000, 4700], [-4900, 4500]];
const RW1 = { top: [-2450, 2400] as XY, bottom: [-1500, 2450] as XY, width: 440 };
const PE: Poly = [[-4700, -1200], [-2600, -1100], [-2100, -3300], [-2600, -4700], [-4800, -4600]];
const RE1 = { top: [-2236, -2700] as XY, bottom: [-1300, -2700] as XY, width: 460 };
const PE2: Poly = [[-4400, -2400], [-2900, -2300], [-2800, -4300], [-4500, -4300]];
const RE2 = { top: [-3650, -2350] as XY, bottom: [-3650, -1400] as XY, width: 440 };
const CIRCLE: XY = [-3650, -3350];

// the tracks: west to east over the bridge, up to the lookout, to the lumber camp and the falls,
// a loop over the dry hill in the east, up to the stones
const T1: XY[] = smooth([[0, 5900], [-100, 5000], [-500, 3700], [-1400, 2550], [-1300, 1300], off(900), C.at, off(-900), [-500, -1500], RE1.bottom, [-1000, -3900], [-900, -4700], [-850, -5900]]);
const T_RIDGE: XY[] = [RW1.bottom, RW1.top, [-3100, 2700], [-3600, 3000]];
const T_CAMP: XY[] = smooth([[-1320, 1600], [0, 1700], [1300, 1850], [2100, 1750], [3000, 1450], [3450, 1150]]);
const T_EAST: XY[] = smooth([[-500, -1500], [800, -2300], [2000, -3150], [1300, -4300], [-1000, -3900]]);
const T_STONES: XY[] = [RE1.bottom, RE1.top, [-2900, -2000], RE2.bottom, RE2.top, [-3650, -2650]];

const WAY_W: XY = [-85, 5150], ARRIVE_W: XY = [-270, 4450];
const WAY_E: XY = [-881, -5150], ARRIVE_E: XY = [-931, -4450];
const CAMP: XY = [2000, 1750];
const LOOKOUT: XY = [-3800, 3200];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(239, {
    hills: [
      { x: 1200, y: 3800, r: 1400, h: 150 },
      { x: 2600, y: -3900, r: 1300, h: 170 },
      { x: 3200, y: -1900, r: 1100, h: 130 },
      { x: 3100, y: 3700, r: 800, h: -80 },
      { x: -1900, y: 4400, r: 900, h: 110 },
      { x: 600, y: -4700, r: 800, h: -60 },
    ],
    plateaus: [
      { poly: dense(PN), h: 500 },
      { poly: dense(PW), h: 300, ramps: [RW1] },
      { poly: dense(PE), h: 340, ramps: [RE1] },
      { poly: dense(PE2), h: 660, ramps: [RE2] },
    ],
    rock: "CliffRock",
  });
  const { put, rnd } = f;
  const tracks = [T1, T_RIDGE, T_CAMP, T_EAST, T_STONES];
  const ground = f.ground({
    area: AREA,
    roads: tracks.map((t, i) => band(t, i === 0 ? 480 : 400)),
    plazas: [],
    water: [band(RIVER, RW), POOL],
    base: "grass",
  });

  const taken: { x: number; y: number; r: number }[] = [];
  const mark = (x: number, y: number, r: number) => taken.push({ x, y, r });
  const free = (x: number, y: number, r: number) => taken.every((t) => Math.hypot(t.x - x, t.y - y) > t.r + r);
  const nearTrack = (x: number, y: number, d: number) => tracks.some((t) => toLine([x, y], t) < d);
  const wet = (x: number, y: number, d: number) => toLine([x, y], RIVER) < RW / 2 + d || dist([x, y], POOL_C) < 700 + d;
  const P = (ref: string, at: XY, h = 0, r = 200, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    mark(at[0], at[1], r);
  };

  // ---- the river: water, the falls, rapids, the bridge ----
  const scenery: THREE.Object3D[] = [f.waterSheet({ x0: AREA.x0, x1: 4300, y0: -1400, y1: 1600 }, -14, "WaterSea")];
  for (const part of pieces(RIVER, [C.at], 190 * BRIDGE_S + 10)) f.blockBand(part, RW + 60, { step: 220 });
  f.blockBand([...POOL, POOL[0]], 200, { step: 200 });
  f.extra.push({ kind: "water", x: POOL_C[0], y: POOL_C[1], r: 380 });
  P("plains:waterfall", FALLS, -0.96, 500);
  P("plains:wood_bridge", C.at, C.h, 700, { s: BRIDGE_S, solid: [{ kind: "rail", x: 0, y: -190, w: 940, d: 26, rot: 0 }, { kind: "rail", x: 0, y: 190, w: 940, d: 26, rot: 0 }] });
  for (const g of [[3050, 450], [1750, -250], [-2200, 330]] as XY[]) {
    const n = nearest(RIVER, g);
    put("plains:rapids", n.at, deg([-n.dir[0], -n.dir[1]]), { s: 1.1 });
  }
  // rocks at the pool, reeds and birches along the banks, driftwood
  for (const [ref, at, h, r] of [
    ["plains:rock_cluster", [3700, 1350], 20, 260], ["plains:boulder", [3550, -650], 80, 230], ["plains:flat_rock", [3300, 1150], 0, 230],
    ["plains:fallen_log", [2700, -700], 20, 330], ["plains:flat_rock", [-2300, 900], 60, 230], ["plains:fallen_log", [-3500, -1000], 160, 330],
  ] as [string, XY, number, number][]) if (f.level(at[0], at[1], r * 0.5) && !wet(at[0], at[1], 40)) P(ref, at, h, r);
  for (let i = 1; i < RIVER.length - 1; i++) {
    const [ax, ay] = RIVER[i], [bx, by] = RIVER[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
    for (const s of [-1, 1]) {
      if (rnd() < 0.35) continue;
      const t = rnd(), o = RW / 2 + 70 + rnd() * 120;
      const x = ax + (bx - ax) * t - ((by - ay) / L) * s * o, y = ay + (by - ay) * t + ((bx - ax) / L) * s * o;
      if (dist([x, y], C.at) < 900 || nearTrack(x, y, 300) || !f.level(x, y, 110) || !free(x, y, 90) || x > 4000) continue;
      const k = rnd();
      if (k < 0.45) P("plains:reeds", [x, y], rnd() * 360, 80);
      else if (k < 0.65) P("plains:flat_rock", [x, y], rnd() * 360, 200, { s: 0.55 + rnd() * 0.3 });
      else if (k < 0.85) P("flora:Birch", [x, y], rnd() * 360, 180, { s: 0.8 + rnd() * 0.3 });
      else P("plains:tall_grass", [x, y], rnd() * 360, 70);
    }
  }

  // ---- the ways out ----
  f.exit("royal_road", WAY_W, ARRIVE_W);
  P("plains:signpost", [350, 4950], 180, 80);
  P("plains:milestone", [-500, 5000], 0, 60);
  f.exit("west_steppe", WAY_E, ARRIVE_E);
  P("plains:signpost", [-1350, -5000], 0, 80);
  P("trunrada:standing_stone", [-400, -5050], 20, 90);

  // ---- the lumberjacks' camp on the west bank below the falls ----
  P("plains:hunter_lodge", [2400, 2750], 90, 560);
  P("plains:lumber_camp", [1500, 2350], 0, 280);
  P("plains:watchtower", [3150, 2350], 0, 230);
  P("trunrada:campfire", [2000, 2350], 0, 150);
  P("trunrada:cart", [1200, 1250], 80, 160);
  for (const [x, y] of [[2700, 1000], [1900, 850], [1100, 750]] as XY[]) {
    const n = nearest(RIVER, [x, y]);
    const side: XY = [-n.dir[1], n.dir[0]];
    const s = side[1] > 0 ? 1 : -1;
    P("plains:log_pile", [n.at[0] + side[0] * s * 720, n.at[1] + side[1] * s * 720], deg(n.dir) + 90, 300);
  }
  for (let i = 0; i < 16; i++) {
    const x = 900 + rnd() * 2600, y = 1300 + rnd() * 2400;
    if (nearTrack(x, y, 300) || wet(x, y, 150) || !free(x, y, 120) || !f.level(x, y, 100)) continue;
    P("plains:stump", [x, y], rnd() * 360, 100, { s: 0.7 + rnd() * 0.4 });
  }
  P("common:crate", [2250, 2050], 15, 50);
  P("common:crate", [2320, 1980], 50, 50);

  // ---- the old ridge on the west bank and its fire lookout ----
  P("plains:watchtower", LOOKOUT, 30, 230);
  P("trunrada:campfire", [-3300, 3500], 0, 150);
  P("plains:fallen_log", [-4200, 2200], 70, 330);
  P("plains:boulder", [-2900, 4200], 30, 230);
  P("plains:rock_cluster", [-4400, 3900], 0, 260, { s: 0.8 });
  for (const [x, y] of [[-3200, 1900], [-4300, 1900], [-2900, 3700], [-4500, 3000], [-3800, 4300]] as XY[]) P("flora:Pine", [x, y], rnd() * 360, 200, { s: 1.35 + rnd() * 0.2 });

  // ---- the rise of standing stones in the east ----
  const circle: SolidSpec[] = [{ kind: "altar", x: 0, y: 0, r: 250 }];
  for (const a of [60, 100, 140, 220, 260, 300, 157, 203]) circle.push({ kind: "stone", x: Math.cos((a * Math.PI) / 180) * 590, y: Math.sin((a * Math.PI) / 180) * 590, r: 70 });
  circle.push({ kind: "stone", x: 590, y: 0, w: 90, d: 320, rot: 0 });
  P("trunrada:stone_circle", CIRCLE, -90, 640, { s: 0.8, solid: circle });
  P("trunrada:cairn", [-2600, -2000], 0, 140);
  for (const [x, y, h] of [[-4200, -1600, 10], [-2700, -3900, -30], [-4300, -4300, 60], [-1500, -3400, 0], [1900, -3100, 20], [2300, -3500, -40]] as [number, number, number][]) P("trunrada:standing_stone", [x, y], h, 90);
  P("plains:rock_cluster", [-3300, -1500], 30, 260, { s: 0.8 });
  P("plains:boulder", [-2500, -4300], 0, 230, { s: 0.8 });

  // ---- the dry hill in the east: rocks, grass, few trees ----
  for (const [ref, at, h, r] of [
    ["plains:boulder", [2700, -4400], 30, 230], ["plains:rock_cluster", [3600, -3400], 100, 260], ["plains:flat_rock", [1200, -2700], 0, 230],
    ["plains:rock_cluster", [500, -4900], 60, 260], ["plains:boulder", [3700, -1300], 120, 230], ["plains:fallen_log", [1600, -1100], 30, 330],
    ["plains:stump", [400, -2000], 0, 100], ["plains:boulder", [-2000, -5000], 0, 230],
  ] as [string, XY, number, number][]) if (f.level(at[0], at[1], r * 0.5) && free(at[0], at[1], r)) P(ref, at, h, r);

  // ---- the pine forest: thick in the west and by the river, thinning east into dry grass ----
  const glades: [XY, number][] = [[CAMP, 1100], [[2400, 2750], 650], [LOOKOUT, 800], [CIRCLE, 900], [[2000, -3200], 900], [[600, 3000], 800], [[-1200, -2200], 700], [[-3500, -2700], 700], [ARRIVE_W, 600], [[3200, -3000], 700]];
  const inGlade = (x: number, y: number, k = 1) => glades.some(([c, r]) => dist([x, y], c) < r * k);
  for (let x = B.minX + 150; x < B.maxX; x += 500)
    for (let y = B.minY + 150; y < B.maxY; y += 500) {
      const px = x + (rnd() - 0.5) * 360, py = y + (rnd() - 0.5) * 360;
      // west of the river thick; east of it thinning out toward the steppe
      const east = Math.max(0, Math.min(1, (-py - 500) / 4500));
      if (rnd() < 0.15 + east * 0.72) continue;
      if (inGlade(px, py) || nearTrack(px, py, 400) || wet(px, py, 170) || !f.level(px, py, 170) || !free(px, py, 170)) continue;
      const kinds = east > 0.5 ? ["PineSmall", "Birch", "PineSmall"] : ["Pine", "Pine", "PineSmall", "Pine", "Birch"];
      const onTop = f.h(px, py) > 450;
      P(`flora:${kinds[Math.floor(rnd() * kinds.length)]}`, [px, py], rnd() * 360, 180, { s: 0.85 + rnd() * 0.45, ...(onTop ? { solid: "none" as const } : {}) });
    }
  for (let i = 0; i < 520; i++) {
    const px = B.minX + rnd() * (B.maxX - B.minX), py = B.minY + rnd() * (B.maxY - B.minY);
    if (nearTrack(px, py, 260) || wet(px, py, 50) || !f.level(px, py, 90) || !free(px, py, 70) || inGlade(px, py, 0.5)) continue;
    const east = Math.max(0, Math.min(1, (-py - 500) / 4500));
    const k = rnd();
    if (k < 0.4 - east * 0.3) P("plains:fern_clump", [px, py], rnd() * 360, 70, { s: 0.8 + rnd() * 0.3 });
    else if (k < 0.85) P("plains:tall_grass", [px, py], rnd() * 360, 60, { s: 0.9 + east * 0.4 });
    else P("flora:Bush", [px, py], rnd() * 360, 60, { solid: "none", s: 1.1 });
  }

  // ---- the rim: pines all round, thinning to the steppe in the east; the mountains' top ----
  const inside = (x: number, y: number) => x > B.minX - 250 && x < B.maxX + 250 && y > B.minY - 250 && y < B.maxY + 250;
  f.woods(AREA, ["Pine", "Pine", "PineSmall", "Pine", "Birch"], (x, y) => inside(x, y) || y < -6200 || wet(x, y, 120) || toLine([x, y], T1) < 320 || (x > 4200 && Math.abs(y - FALLS_Y) < 500 && x < 5400), { count: 820, tries: 9000, spacing: 400 });
  f.woods({ ...AREA, y1: -5800 }, ["PineSmall", "Birch", "Bush", "Bush"], (x, y) => inside(x, y) || toLine([x, y], T1) < 320 || wet(x, y, 120), { count: 120, tries: 2000, spacing: 700 });
  for (let i = 0; i < 70; i++) {
    const x = AREA.x0 + rnd() * (AREA.x1 - AREA.x0), y = AREA.y0 + rnd() * (-5800 - AREA.y0);
    if (inside(x, y) || toLine([x, y], T1) < 300 || wet(x, y, 80)) continue;
    put(rnd() < 0.85 ? "plains:tall_grass" : "trunrada:standing_stone", [x, y], rnd() * 360, { solid: "none", s: 1.2 });
  }

  // ---- monsters ----
  f.monsterSpots(ground, { x0: B.minX + 400, x1: B.maxX - 400, y0: B.minY + 400, y1: B.maxY - 400 }, {
    step: 800,
    keepOut: (x, y) => dist([x, y], CAMP) < 1300 || dist([x, y], [2400, 2750]) < 900 || x > 4100,
  });

  const npcs: NpcSpec[] = [
    {
      id: "pine_river_lumberjack", x: 1850, y: 1650, face: -135, name: "ลุงบียอร์น", title: "หัวหน้าคนตัดไม้", role: "talk",
      look: { gender: "male", hair: "", hairColor: "crimson", eyes: "blue", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ซุงสนจากป่านี้ล่องแม่น้ำลงไปถึงอีเดนเลยนะ ใช้สร้างเรือกับบ้านทั้งเมือง",
        "อย่าเข้าใกล้แก่งหินใต้น้ำตกล่ะ น้ำเชี่ยวมาก ตกลงไปไม่รอดแน่",
        "ข้ามสะพานไปฝั่งตะวันออก ป่าจะโปร่งลงเรื่อยๆ จนกลายเป็นทุ่งสเตปป์",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery,
    sky: "#3a5631",
    flowers: { box: { x: B.minX, y: B.minY, w: B.maxX - B.minX, h: B.maxY - B.minY }, open: (x, y) => ground.kind(x, y) === 0 && y > -3000, density: 0.2 * quality.flowers },
    bounds: B,
    spawn: { x: -330, y: 4250 },
    npcs,
    labels: [
      { x: 3350, y: 1250, text: "น้ำตกผาสน" },
      { x: CAMP[0], y: CAMP[1], text: "ค่ายคนตัดไม้" },
      { x: 2250, y: 700, text: "แก่งหิน", kind: "small" },
      { x: C.at[0] + C.ax[0] * 800 + 300, y: C.at[1] + C.ax[1] * 800, text: "สะพานข้ามแม่น้ำ", kind: "small" },
      { x: -3300, y: 3100, text: "หอระวังไฟป่า" },
      { x: -3650, y: -2700, text: "เนินหินตั้ง" },
      { x: 2000, y: -3150, text: "เนินหญ้าแห้ง", kind: "small" },
      { x: -3000, y: 1000, text: "แม่น้ำสน", kind: "small" },
      { x: WAY_W[0], y: WAY_W[1] - 250, text: "ทางไปถนนหลวง", kind: "gate" },
      { x: WAY_E[0], y: WAY_E[1] + 250, text: "ทางไปสเตปป์ตะวันตก", kind: "gate" },
    ],
  });
}

// ป่าใหญ่ตะวันตก (the great western wood), monsters Lv 8-15: an old oak forest west of the first
// field. The way in from Eden's side is on its east (from the western meadow, `field`); a track
// winds west through the trees, over a stream on a plank bridge, past a hunter's lodge on its
// knoll, and up onto a wooded plateau whose higher step holds the reward: an old shrine of the
// forest spirits. From the foot of that plateau's ramp the old road to Noa goes on west, between
// the knoll and the plateau and over a wooded rise, out of the wood's west side. A second track
// loops north over another bridge to a clearing of mossy stones on a rise. A high mossy bluff
// walls the north-west; thick woods ring the rest.
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

useKits(PLAINS, TRUNRADA);

type XY = [number, number];

// ---- polylines ----
// a smooth curve through control points (Catmull-Rom, n steps a span)
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
// a strip `w` wide along a polyline
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
  const proj = ([x, y]: XY): number => {
    let best = 0, bd = Infinity;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = cum[i] - cum[i - 1] || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / (L * L)));
      const d = Math.hypot(ax + (bx - ax) * t - x, ay + (by - ay) * t - y);
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
// the distance from a point to a polyline
function toLine(p: XY, pts: XY[]): number {
  let d = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * (bx - ax) + (p[1] - ay) * (by - ay)) / L2));
    d = Math.min(d, Math.hypot(ax + (bx - ax) * t - p[0], ay + (by - ay) * t - p[1]));
  }
  return d;
}

// ---- the layout ----
const B = { minX: -5000, maxX: 5000, minY: -5500, maxY: 5500 };
const AREA = { x0: -8500, x1: 8500, y0: -9000, y1: 9000 };

// the stream, north to south across the middle, and where the tracks bridge it
const STREAM: XY[] = smooth([[8600, -1700], [6000, -1500], [4200, -1150], [2700, -1500], [1100, -1000], [-400, -1250], [-1900, -750], [-3400, -1050], [-5000, -650], [-8600, -900]], 5);
const SW = 520;
// where a track crosses a line square to it near `guess`: the point, the way across (pointing
// west, +Y) and the heading that turns a bridge's length (its X) along it
function crossing(line: XY[], guess: XY): { at: XY; ax: XY; h: number } {
  let best = { d: Infinity, at: guess, dir: [1, 0] as XY };
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1], [bx, by] = line[i], L = Math.hypot(bx - ax, by - ay) || 1;
    const t = Math.max(0, Math.min(1, ((guess[0] - ax) * (bx - ax) + (guess[1] - ay) * (by - ay)) / (L * L)));
    const p: XY = [ax + (bx - ax) * t, ay + (by - ay) * t], d = dist(p, guess);
    if (d < best.d) best = { d, at: p, dir: [(bx - ax) / L, (by - ay) / L] };
  }
  let ax: XY = [-best.dir[1], best.dir[0]];
  if (ax[1] < 0) ax = [-ax[0], -ax[1]];
  return { at: best.at, ax, h: (Math.atan2(ax[1], ax[0]) * 180) / Math.PI };
}
const C1 = crossing(STREAM, [-1000, -1060]), C2 = crossing(STREAM, [1900, -1250]);
const BR1 = C1.at, BR2 = C2.at;
const off = (c: { at: XY; ax: XY }, k: number): XY => [c.at[0] + c.ax[0] * k, c.at[1] + c.ax[1] * k];

// the ground: a hunter's knoll (P1), the shrine plateau (P2) and its higher step (P3), a mossy
// bluff along the north-west (P4, no way up), and rolling ground
const P1: Poly = [[-3900, 300], [-1900, 150], [-1700, 2300], [-3700, 2500]];
const P2: Poly = [[-2600, 3300], [1300, 3000], [3700, 3400], [4200, 7500], [-3000, 7500]];
const P3: Poly = [[100, 4000], [2700, 3850], [3000, 7000], [-100, 7000]];
const P4: Poly = [[4500, -400], [4800, 1200], [4400, 2900], [8500, 2900], [8500, -400]];
const R1 = { top: [-1798, 1250] as XY, bottom: [-900, 1300] as XY, width: 440 };
const R2 = { top: [-500, 3138] as XY, bottom: [-450, 2060] as XY, width: 460 };
const R3 = { top: [40, 4900] as XY, bottom: [-900, 4900] as XY, width: 440 };

// the tracks: the main one from the way in (east) to the shrine, a branch up to the lodge, and a
// loop north over the second bridge to the mossy stones
const T1: XY[] = smooth([[-400, -5900], [-350, -4600], [150, -3700], [-250, -2700], off(C1, -700), BR1, off(C1, 700), [-1200, 400], [-700, 800], [-250, 1350], R2.bottom]);
const T1b: XY[] = smooth([R2.bottom, R2.top, [-650, 3800], [-900, 4500], R3.bottom]);
const T1c: XY[] = [R3.bottom, R3.top, [900, 4900]];
const T2: XY[] = smooth([[-700, 800], [-950, 1050], R1.bottom]);
const T2b: XY[] = [R1.bottom, R1.top, [-2500, 1300]];
const T3: XY[] = smooth([[-700, 800], [500, 450], [1500, 0], off(C2, 700), BR2, off(C2, -700), [2000, -2700], [2550, -3250], [2300, -3800], [1500, -3950], [600, -3800], [150, -3700]]);
// the road to Noa: from the foot of the shrine plateau's ramp, west between the knoll and the
// plateau, over the rise in the south-west and out of the wood's west side
const T4: XY[] = smooth([R2.bottom, [-1100, 2450], [-2000, 2800], [-3100, 3000], [-3700, 3650], [-3850, 4450], [-3800, 5150], [-3750, 6900]]);

const SHRINE: XY = [1550, 4900];
const LODGE: XY = [-3000, 1300];
const STONES: XY = [2650, -3600];
const WAY_IN: XY = [-380, -5150], ARRIVE: XY = [-270, -4450];
const WAY_NOA: XY = [-3800, 5150], ARRIVE_NOA: XY = [-3830, 4430];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(211, {
    hills: [
      { x: 2650, y: -3650, r: 1700, h: 170 },
      { x: -3300, y: -3300, r: 1500, h: 130 },
      { x: 1800, y: 1500, r: 1500, h: 150 },
      { x: -3400, y: 4200, r: 1300, h: 110 },
      { x: -600, y: -3300, r: 1100, h: -80 },
      { x: 3600, y: 1500, r: 900, h: -70 },
    ],
    plateaus: [
      { poly: dense(P1), h: 280, ramps: [R1] },
      { poly: dense(P2), h: 320, ramps: [R2] },
      { poly: dense(P3), h: 640, ramps: [R3] },
      { poly: dense(P4), h: 600 },
    ],
    rock: "CliffMoss",
  });
  const { put, rnd } = f;
  const tracks = [T1, T1b, T1c, T2, T2b, T3, T4];
  const ground = f.ground({
    area: AREA,
    roads: tracks.map((t, i) => band(t, i === 0 || t === T4 ? 470 : 400)),
    plazas: [],
    water: [band(STREAM, SW)],
    base: "grass",
  });

  // what is placed, for keeping the trees and the undergrowth off it
  const taken: { x: number; y: number; r: number }[] = [];
  const mark = (x: number, y: number, r: number) => taken.push({ x, y, r });
  const free = (x: number, y: number, r: number) => taken.every((t) => Math.hypot(t.x - x, t.y - y) > t.r + r);
  const nearTrack = (x: number, y: number, d: number) => tracks.some((t) => toLine([x, y], t) < d);
  const nearWater = (x: number, y: number, d: number) => toLine([x, y], STREAM) < SW / 2 + d;
  const P = (ref: string, at: XY, h = 0, r = 200, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    mark(at[0], at[1], r);
  };

  // ---- the stream: water, the bridges, its banks ----
  const scenery: THREE.Object3D[] = [f.waterSheet({ x0: AREA.x0, x1: AREA.x1, y0: -2400, y1: 200 }, -14, "WaterSea")];
  for (const part of pieces(STREAM, [BR1, BR2], 190)) f.blockBand(part, SW + 60, { step: 220 });
  const rail = [{ kind: "rail", x: 0, y: -190, w: 940, d: 26, rot: 0 }, { kind: "rail", x: 0, y: 190, w: 940, d: 26, rot: 0 }];
  P("plains:wood_bridge", BR1, C1.h, 520, { solid: rail });
  P("plains:wood_bridge", BR2, C2.h, 520, { solid: rail });
  // reeds, flat stones and the odd fallen trunk along the banks
  for (let i = 2; i < STREAM.length - 2; i += 1) {
    const [ax, ay] = STREAM[i], [bx, by] = STREAM[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / L, ny = (bx - ax) / L;
    for (const s of [-1, 1]) {
      const t = rnd(), off = SW / 2 + 60 + rnd() * 90;
      const x = ax + (bx - ax) * t + nx * s * off, y = ay + (by - ay) * t + ny * s * off;
      if (dist([x, y], BR1) < 900 || dist([x, y], BR2) < 900 || nearTrack(x, y, 300) || !f.level(x, y, 120)) continue;
      if (Math.abs(x) > B.maxX + 2500) continue;
      const k = rnd();
      if (k < 0.55) P("plains:reeds", [x, y], rnd() * 360, 90, { s: 0.9 + rnd() * 0.4 });
      else if (k < 0.8) P("plains:flat_rock", [x + nx * s * 60, y + ny * s * 60], rnd() * 360, 230, { s: 0.6 + rnd() * 0.3 });
      else P("plains:tall_grass", [x, y], rnd() * 360, 90);
    }
  }
  P("plains:fallen_log", [-2600, -260], 60, 330);
  P("plains:fallen_log", [3300, -620], -20, 330);
  P("plains:rock_cluster", [-3200, -1800], 30, 260);

  // ---- the way in: a signpost at the edge of the wood ----
  f.exit("field", WAY_IN, ARRIVE);
  P("plains:signpost", [-760, -4850], 90, 80);
  P("plains:boulder", [380, -4900], 20, 230);
  P("plains:stump", [-900, -4300], 0, 100);
  P("plains:tall_grass", [-750, -4600], 0, 60);
  P("plains:tall_grass", [150, -4500], 0, 60);

  // ---- the way out west to Noa: a signpost and a cairn where the road leaves the wood ----
  f.exit("noa", WAY_NOA, ARRIVE_NOA);
  P("plains:signpost", [-3420, 4880], 180, 80);
  P("trunrada:cairn", [-4250, 4750], 0, 140);
  P("plains:boulder", [-4300, 5200], 60, 230, { s: 0.8 });
  P("plains:stump", [-3350, 4350], 0, 100);

  // ---- the hunter's lodge on its knoll ----
  P("plains:hunter_lodge", LODGE, 180, 560);
  P("trunrada:campfire", [-2300, 800], 0, 150);
  P("trunrada:drying_rack", [-2350, 1900], 90, 220);
  P("plains:log_pile", [-3300, 2200], 0, 280, { s: 0.7 });
  P("plains:stump", [-2450, 600], 0, 100);
  P("plains:lumber_camp", [-3500, 500], 90, 280, { s: 0.8 });
  for (const y of [500, 900]) P("plains:rail_fence", [-2150, y], 0, 210);
  for (const y of [1700, 2100]) P("plains:rail_fence", [-2150, y], 0, 210);
  P("plains:tall_grass", [-2000, 400], 0, 60);
  P("plains:fern_clump", [-3700, 1500], 0, 60);

  // ---- the shrine plateau and the shrine on its step ----
  P("plains:forest_shrine", SHRINE, 0, 720);
  P("flora:BigOak", [2500, 4300], 40, 300, { s: 1.45 });
  P("flora:BigOak", [2450, 5500], 160, 300, { s: 1.3 });
  P("plains:boulder", [700, 4250], 50, 230, { s: 0.8 });
  P("plains:rock_cluster", [2300, 3950], 10, 260, { s: 0.7 });
  P("plains:stump", [500, 5500], 0, 100);
  for (const [x, y] of [[600, 5300], [2100, 3950], [800, 4500], [2650, 4850]] as XY[]) P("plains:fern_clump", [x, y], rnd() * 360, 70);
  // the lower plateau: a clearing among the trees, old stones
  P("plains:boulder", [-1900, 4300], 120, 230);
  P("plains:fallen_log", [-1500, 3600], 100, 330);
  P("trunrada:standing_stone", [-2100, 3700], 30, 90);
  P("trunrada:standing_stone", [-1500, 5200], -20, 90);
  P("plains:rock_cluster", [3400, 4400], 80, 260);
  P("plains:fallen_log", [3500, 5800], 10, 330);

  // ---- the mossy stones on their rise, north of the loop ----
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4;
    P(i % 2 ? "plains:boulder" : "plains:rock_cluster", [STONES[0] + Math.cos(a) * 750, STONES[1] + Math.sin(a) * 750], rnd() * 360, 240, { s: 0.75 + rnd() * 0.3 });
  }
  P("trunrada:standing_stone", [STONES[0] + 120, STONES[1] + 80], 15, 90);
  P("trunrada:cairn", [STONES[0] - 250, STONES[1] - 200], 0, 140);
  P("plains:stump", [1200, -3100], 0, 100);
  P("plains:fallen_log", [3600, -2500], 140, 330);

  // ---- along the tracks: logs, stumps, rocks, mushrooms, ferns ----
  for (const [ref, at, h, r] of [
    ["plains:fallen_log", [700, -2600], 15, 330], ["plains:boulder", [-1200, -3000], 70, 230], ["plains:stump", [-1150, -2100], 0, 100],
    ["plains:rock_cluster", [900, -4700], 200, 260], ["plains:fallen_log", [-4400, 2500], 80, 330], ["plains:boulder", [600, 1700], 10, 230],
    ["plains:stump", [1300, 900], 0, 100], ["plains:flat_rock", [-3800, -2300], 40, 230], ["plains:fallen_log", [-4100, -3700], 130, 330],
    ["plains:boulder", [3800, -4300], 160, 230], ["plains:rock_cluster", [-4200, 3100], 0, 260], ["plains:stump", [3100, 2300], 0, 100],
    ["plains:fallen_log", [2800, 900], 45, 330], ["plains:boulder", [-3800, -600], 0, 230],
  ] as [string, XY, number, number][]) if (f.level(at[0], at[1], r * 0.6)) P(ref, at, h, r);

  // ---- the oak wood: thick, with glades left open; ferns, grass and bushes under it ----
  const glades: [XY, number][] = [[STONES, 900], [SHRINE, 900], [LODGE, 700], [[-2400, 1300], 600], [[-300, -3300], 1000], [[1800, 1500], 1100], [[-1400, 4300], 900], [[-3300, -3200], 900], [[3400, -1800], 700], [[-3600, 4300], 700], [[3500, 4600], 600], [ARRIVE, 700], [ARRIVE_NOA, 600]];
  const inGlade = (x: number, y: number, k = 1) => glades.some(([c, r]) => dist([x, y], c) < r * k);
  const OAKS = ["BigOak", "RoundTree", "BigOak", "SmallTree", "RoundTree", "BigOak"];
  for (let x = B.minX + 150; x < B.maxX; x += 480)
    for (let y = B.minY + 150; y < B.maxY; y += 480) {
      const px = x + (rnd() - 0.5) * 360, py = y + (rnd() - 0.5) * 360;
      if (inGlade(px, py) || nearTrack(px, py, 380) || nearWater(px, py, 170) || !f.level(px, py, 170) || !free(px, py, 170)) continue;
      if (rnd() < 0.07) continue;
      const kind = OAKS[Math.floor(rnd() * OAKS.length)];
      P(`flora:${kind}`, [px, py], rnd() * 360, 190, { s: 0.75 + rnd() * 0.4 });
    }
  for (let i = 0; i < 520; i++) {
    const px = B.minX + rnd() * (B.maxX - B.minX), py = B.minY + rnd() * (B.maxY - B.minY);
    if (nearTrack(px, py, 260) || nearWater(px, py, 60) || !f.level(px, py, 90) || !free(px, py, 70) || inGlade(px, py, 0.6)) continue;
    const k = rnd();
    P(k < 0.45 ? "plains:fern_clump" : k < 0.75 ? "plains:tall_grass" : k < 0.93 ? "flora:Bush" : "plains:stump", [px, py], rnd() * 360, k < 0.93 ? 70 : 100, k >= 0.75 && k < 0.93 ? { s: 1 + rnd() * 0.5, solid: "none" } : {});
  }

  // ---- the rim: thick woods all round, the land going on ----
  const inside = (x: number, y: number) => x > B.minX - 250 && x < B.maxX + 250 && y > B.minY - 250 && y < B.maxY + 250;
  f.woods(AREA, ["BigOak", "RoundTree", "BigOak", "SmallTree", "RoundTree", "Pine"], (x, y) => inside(x, y) || nearWater(x, y, 150) || toLine([x, y], T1) < 300 || toLine([x, y], T4) < 330, { count: 900, tries: 9000, spacing: 400 });
  f.woods(AREA, ["Bush", "SmallTree"], (x, y) => inside(x, y) || nearWater(x, y, 60), { count: 160, tries: 2000, spacing: 300 });

  // ---- monsters: the glades, the plateaus, the loop ----
  f.monsterSpots(ground, { x0: B.minX + 400, x1: B.maxX - 400, y0: B.minY + 400, y1: B.maxY - 400 }, {
    step: 640,
    keepOut: (x, y) => dist([x, y], LODGE) < 1100 || dist([x, y], SHRINE) < 800 || dist([x, y], [-2300, 800]) < 400,
  });

  const npcs: NpcSpec[] = [
    {
      id: "west_woods_hunter", x: -2350, y: 1150, face: 0, name: "พรานเบิร์น", title: "นายพรานแห่งป่าตะวันตก", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ป่านี้กว้างกว่าที่เห็นนะ หลงเมื่อไหร่ให้เดินตามลำธารกลับไปทางตะวันออก",
        "หมาป่ากับหมูป่าแถวนี้ดุขึ้นทุกปี ระวังตัวด้วยล่ะ",
        "ศาลเจ้าเก่าบนผาทางตะวันตกน่ะ คนแก่ว่ามีวิญญาณป่าคุ้มครองอยู่",
      ],
    },
    {
      id: "west_woods_keeper", x: 820, y: 4650, face: 180, name: "ยายเอลวีน", title: "ผู้เฝ้าศาลป่า", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "teal", top: "top_priestess_forest", bottom: "bottom_priestess_forest" },
      lines: [
        "มาถึงศาลเจ้าป่าโบราณแล้วสินะ แสงสีเขียวนั่นคือดวงวิญญาณของป่า",
        "ป่านี้แก่กว่าเมืองอีเดนเสียอีก ต้นโอ๊กพวกนี้เห็นกษัตริย์มาแล้วหลายองค์",
        "พักให้หายเหนื่อยก่อนเถิด ทางกลับยังอีกไกล",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery,
    sky: "#34502a",
    flowers: { box: { x: B.minX, y: B.minY, w: B.maxX - B.minX, h: B.maxY - B.minY }, open: (x, y) => ground.kind(x, y) === 0, density: 0.22 * quality.flowers },
    bounds: B,
    spawn: { x: -130, y: -4150 },
    npcs,
    labels: [
      { x: SHRINE[0] - 700, y: SHRINE[1], text: "ศาลเจ้าป่าโบราณ" },
      { x: LODGE[0] + 650, y: LODGE[1], text: "กระท่อมนายพราน" },
      { x: STONES[0], y: STONES[1], text: "ลานหินมอส", kind: "small" },
      { x: 3300, y: -1100, text: "ลำธารป่าโอ๊ก", kind: "small" },
      { x: BR1[0] + 150, y: BR1[1] - 700, text: "สะพานไม้", kind: "small" },
      { x: -1500, y: 4200, text: "ที่ราบศาลเจ้า", kind: "small" },
      { x: WAY_IN[0], y: WAY_IN[1] + 250, text: "ทางไปทุ่งหญ้าตะวันตก", kind: "gate" },
      { x: WAY_NOA[0], y: WAY_NOA[1] - 250, text: "ทางไปโนอา", kind: "gate" },
    ],
  });
}

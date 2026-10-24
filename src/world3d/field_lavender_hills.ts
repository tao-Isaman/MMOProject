// ทุ่งลาเวนเดอร์ (the lavender hills), monsters Lv 34-44: rolling country between the great western
// wood and Venezia, planted in rows of lavender, lines of cypress along its tracks, old stone walls
// between the fields. The river that leaves the wood at the north edge crosses the whole field to
// the south-west, hooks back north-west and goes on west across the plain below Noa; one stone
// bridge carries the road over it in the middle. North of the river: the road from the wood (the
// middle of the north side) and the road from the plain below Noa (the north end of the west side)
// meet beyond the bridge; the cypress hill stands between them, a ramp up its south side, lavender
// on its top round an old shrine and the racks where the cut bundles dry. South of the river the
// road runs on to the windmill fields (the middle of the east side), and from it a road branches
// south-west to Venezia's north gate (on the south side, where the gate is); by the bridge stands
// the perfume distillery, its copper still under a lean-to. In the south-east the lavender climbs
// two terraces, a ramp off the Venezia road to the first and another to the second, where a
// wayside shrine looks out over the purple; the stone farmhouse keeps the east with its vineyard
// (the grapes draw the wasps). In the south-west corner the old aqueduct of the plain below Noa
// comes in over the edge and ends at the spring that fed it.
//
// What lies next door: north the great western wood (its oaks thicken over the last fifth towards
// the north edge, the river coming out of them), west the plain below Noa's fields and groves (the
// aqueduct striding in at its south-east corner), south the woods and grass outside Venezia's
// walls, east the windmill fields' wheat and oaks.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: north -> west_woods (e 0.50), east -> windmill_fields (n 0.50), south -> venezia
//   (e 0.60, its north gate), west -> noa_plains (n 0.83)

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { KIT as HEART } from "./kits/heartland";
import { KIT as WESTFARM, BRIDGE, smooth, band, dense, blob, inPoly, toLine, towards, along, lengthwise, wallRun } from "./kits/westfarm";
import type { XY } from "./kits/westfarm";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as RUINS } from "./kits/ruins";
import { rampOff } from "./kits/ruins";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(HEART, WESTFARM, PLAINS, TRUNRADA, RUINS);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the ways out ----
const N_EXIT: XY = [5150, 0], N_BACK: XY = [4450, 330];
const E_EXIT: XY = [0, -5150], E_BACK: XY = [-80, -4430];
const S_EXIT: XY = [-5150, -1120], S_BACK: XY = [-4430, -1090];
const W_EXIT: XY = [3600, 5150], W_BACK: XY = [3080, 4700];

// ---- the bridge, and the river square to the road there ----
const BR: XY = [50, 1250];
const RDIR: XY = [0.357, 0.934]; // the road over the bridge, south-east to north-west
const UP: XY = [RDIR[1], -RDIR[0]]; // the river there, upstream
const RIVER: XY[] = smooth([
  [A + 400, -720], [5500, -650], [4300, -450], [3100, -50], [1900, 450], [BR[0] + UP[0] * 800, BR[1] + UP[1] * 800], BR, [BR[0] - UP[0] * 800, BR[1] - UP[1] * 800],
  [-1900, 1900], [-2550, 2700], [-2500, 3700], [-2250, 4600], [-1866, 5500], [-1600, 6150], [-1500, 7200], [-1500, A + 400],
], 150);
const SW = BRIDGE.river;

// ---- the levels ----
// NWH: the cypress hill (300) north of the river; LT1, LT2: the lavender terraces (240, 480) in the
// south-east.
const NWH: XY[] = [[3300, 2100], [4200, 1600], [4900, 1700], [5000, 3300], [4500, 4200], [3600, 4300], [3100, 3300]];
const LT1: XY[] = [[-1800, -2600], [-1700, -4200], [-2400, -5000], [-3800, -5300], [-4700, -4600], [-4800, -3000], [-4100, -2200], [-2900, -2100]];
const LT2: XY[] = [[-3100, -3400], [-3200, -4400], [-3800, -4600], [-4300, -4100], [-4200, -3300], [-3700, -3100]];
const RNWH = rampOff(NWH, 6, 0.5, 850, 440);
const RLT1 = rampOff(LT1, 6, 0.5, 850, 460);
const RLT2 = rampOff(LT2, 0, 0.5, 700, 420);

// ---- the tracks ----
const X1: XY = [-450, -1500], X2: XY = [900, 2500];
const MAIN: XY[] = smooth([[0, -A], [0, -7000], E_EXIT, [-150, -4000], [-350, -2700], X1, [-300, -200], along(BR, [BR[0] - RDIR[0], BR[1] - RDIR[1]], 750), BR, along(BR, [BR[0] + RDIR[0], BR[1] + RDIR[1]], 750), X2]);
const NORTH: XY[] = smooth([X2, [1900, 2100], [2900, 1500], [3800, 800], [4500, 300], N_EXIT, [6500, 0], [A, 0]]);
const WEST: XY[] = smooth([X2, [1600, 3300], [2500, 4200], W_EXIT, [4000, 6500], [4200, A]]);
const SOUTH: XY[] = smooth([X1, [-1600, -1350], [-2800, -1150], [-3900, -1080], S_EXIT, [-6500, -1150], [-A, -1150]]);
const HILL_WAY: XY[] = [...smooth([[2000, 2050], [2150, 2350], along(RNWH.bottom, RNWH.top, -250)]), RNWH.bottom, RNWH.top, ...smooth([along(RNWH.bottom, RNWH.top, 1150), [3800, 2950], [4250, 3300]])];
const TERRACE_WAY: XY[] = [
  along(RLT1.bottom, RLT1.top, -250), RLT1.bottom, RLT1.top,
  ...smooth([along(RLT1.bottom, RLT1.top, 1100), [-2700, -2700], [-2250, -3400], along(RLT2.bottom, RLT2.top, -300)]), RLT2.bottom, RLT2.top,
  ...smooth([along(RLT2.bottom, RLT2.top, 1000), [-3650, -3880]]),
];
const FARM_LANE: XY[] = smooth([[-220, -3400], [700, -3350], [1450, -3150]]);
const TRACKS = [MAIN, NORTH, WEST, SOUTH, HILL_WAY, TERRACE_WAY, FARM_LANE];

// ---- the places ----
const DISTILLERY: XY = [-1500, 600];
const FARM: XY = [2150, -3300];
const SHRINE: XY = [-3750, -3800];
const HILLTOP: XY = [4300, 2900];
// the aqueduct of the plain below Noa, its line continued (that map's own line, moved by the width
// of a map: its east edge is this one's west edge), and the spring at its head
const AQ0: XY = [-6600, 4500], AU: XY = [0.943, 0.332], AN: XY = [-0.332, 0.943];
const aqAt = (s: number, off = 0): XY => [AQ0[0] + AU[0] * s + AN[0] * off, AQ0[1] + AU[1] * s + AN[1] * off];
const AQ_BAY = (k: number) => 5340 + k * 800; // the bays as they stand there, counted from the one over its river
const SPRING: XY = aqAt(AQ_BAY(-5) - 80);

// ---- what lies next door: the wood's oaks thicken towards the north edge ----
const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const woody = (x: number) => ss(3600, 5700, x);

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(516, {
    hills: [
      // the rise the bridge stands on (its deck follows it)
      { x: BR[0], y: BR[1], r: BRIDGE.R, h: BRIDGE.H },
      // rolling ground, clear of the river
      { x: 1700, y: -1900, r: 900, h: 100 }, { x: 4300, y: -1700, r: 800, h: 100 }, { x: -1100, y: -3800, r: 800, h: 70 },
      { x: 1900, y: 4300, r: 900, h: 100 }, { x: -3800, y: 1200, r: 1000, h: 90 }, { x: -4200, y: 3600, r: 700, h: 60 },
      // past the edge
      { x: 7600, y: 3200, r: 2200, h: 260 }, { x: 7400, y: -3400, r: 2000, h: 240 }, { x: -7600, y: -3600, r: 2000, h: 200 },
      { x: 2600, y: -7600, r: 1800, h: 180 },
    ],
    plateaus: [
      { poly: dense(NWH), h: 300, ramps: [RNWH] },
      { poly: dense(LT1), h: 240, ramps: [RLT1] },
      { poly: dense(LT2), h: 480, ramps: [RLT2] },
    ],
    rock: "CliffMoss",
  });
  const { put, rnd } = f;

  // ---- the ground: tracks of pale earth, the river, the aqueduct's spring ----
  const roads = [band(MAIN, 470), band(NORTH, 440), band(WEST, 440), band(SOUTH, 440), band(HILL_WAY, 400), band(TERRACE_WAY, 400), band(FARM_LANE, 340)];
  const POOL = blob(SPRING, 340, 300, 9, 16, 0.12);
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: [band(RIVER, SW), POOL], base: "grass", road: [0.98, 0.9, 0.78] });

  // ---- placing things: clear of the tracks, the water, the cliffs and each other ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine(x, y, t) < d);
  const wet = (x: number, y: number, d: number) => toLine(x, y, RIVER) < SW / 2 + d || Math.hypot(x - SPRING[0], y - SPRING[1]) < 360 + d;
  const free = (x: number, y: number, r: number, gap = 0) =>
    !nearTrack(x, y, r + 230) && !wet(x, y, r) && f.level(x, y, Math.min(r, 220)) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    taken.push([at[0], at[1], r]);
  };
  const inside = (x: number, y: number, m = 0) => Math.abs(x) < R - m && Math.abs(y) < R - m;
  const scatter = (refs: string[], n: number, box: { x0: number; x1: number; y0: number; y1: number }, rad: number, o: { s?: [number, number]; solid?: SolidSpec[] | "none"; keep?: (x: number, y: number) => boolean; gap?: number } = {}) => {
    for (let i = 0, made = 0; i < n * 30 && made < n; i++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (!free(x, y, rad, o.gap ?? 40) || (o.keep && !o.keep(x, y))) continue;
      const s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      prop(refs[Math.floor(rnd() * refs.length)], [x, y], rnd() * 360, rad * s, { s, ...(o.solid ? { solid: o.solid } : {}) });
      made++;
    }
  };
  const IN = { x0: -R + 250, x1: R - 250, y0: -R + 250, y1: R - 250 };
  const cypress = (at: XY, s = 1) => prop("westfarm:cypress", at, rnd() * 360, 90 * s, { s, solid: [{ kind: "tree", x: 0, y: 0, r: 34 * s }] });
  const tree = (kind: string, at: XY, s = 1, r = 42) => prop(`flora:${kind}`, at, rnd() * 360, 190 * s, { s, solid: [{ kind: "tree", x: 0, y: 0, r: r * s }] });

  // ---- the ways out ----
  f.exit("west_woods", N_EXIT, N_BACK);
  f.exit("windmill_fields", E_EXIT, E_BACK);
  f.exit("venezia", S_EXIT, S_BACK);
  f.exit("noa_plains", W_EXIT, W_BACK);
  prop("plains:signpost", [4800, 450], 180, 80);
  prop("plains:signpost", [400, -4800], 90, 80);
  prop("plains:milestone", [-400, -4700], 0, 60);
  prop("plains:signpost", [-4800, -700], 0, 80);
  prop("plains:signpost", [3150, 5000], -90, 80);
  prop("plains:milestone", [3900, 4750], -90, 60);
  // where the roads part
  prop("westfarm:wayside_shrine", [X1[0] - 450, X1[1] + 500], towards(1, -0.4), 160, { solid: [{ kind: "shrine", x: 0, y: 0, w: 140, d: 140, rot: 0 }] });
  prop("plains:signpost", [X2[0] + 400, X2[1] + 300], -150, 80);

  // ---- the river: the bridge on its rise, the banks closed, reeds and stones along them ----
  const bh = (Math.atan2(RDIR[1], RDIR[0]) * 180) / Math.PI;
  prop("westfarm:stone_bridge", BR, bh, 700, {
    z: BRIDGE.sink - BRIDGE.H,
    solid: [
      { kind: "rail", x: 0, y: -255, w: 1300, d: 30, rot: 0 }, { kind: "rail", x: 0, y: 255, w: 1300, d: 30, rot: 0 },
      { kind: "post", x: -626, y: -255, r: 34 }, { kind: "post", x: 626, y: -255, r: 34 }, { kind: "post", x: -626, y: 255, r: 34 }, { kind: "post", x: 626, y: 255, r: 34 },
    ],
  });
  const parts: XY[][] = [[]];
  for (const p of RIVER) {
    if (Math.hypot(p[0] - BR[0], p[1] - BR[1]) < 300) {
      if (parts[parts.length - 1].length) parts.push([]);
    } else parts[parts.length - 1].push(p);
  }
  for (const part of parts) if (part.length > 1) f.blockBand(part.filter(([x, y]) => Math.abs(x) < R + 900 && Math.abs(y) < R + 900), SW + 60, { step: 220 });
  for (let i = 2; i < RIVER.length - 2; i += 2) {
    const [ax, ay] = RIVER[i], [bx, by] = RIVER[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
    if (Math.abs(ax) > R + 2000 || Math.abs(ay) > R + 2000) continue;
    for (const sd of [-1, 1]) {
      const o = SW / 2 + 70 + rnd() * 80, x = ax - ((by - ay) / L) * sd * o, y = ay + ((bx - ax) / L) * sd * o;
      if (Math.hypot(x - BR[0], y - BR[1]) < 1300 || nearTrack(x, y, 260) || !f.level(x, y, 90) || rnd() < 0.3) continue;
      const k = rnd();
      put(k < 0.55 ? "plains:reeds" : k < 0.8 ? "heartland:lavender_clump" : "plains:flat_rock", [x, y], rnd() * 360, { s: k < 0.8 ? 0.8 + rnd() * 0.4 : 0.5, solid: "none" });
    }
  }
  for (const s of [-1, 1])
    for (const e of [-1, 1]) put("plains:reeds", [BR[0] + RDIR[0] * e * 330 + UP[0] * s * 900, BR[1] + RDIR[1] * e * 330 + UP[1] * s * 900], rnd() * 360, { s: 1.1, solid: "none" });

  // ---- the distillery by the bridge: the still's shed, barrels, the cart in from the fields ----
  prop("heartland:distillery", DISTILLERY, 90, 650, {
    solid: [{ kind: "building", x: -12, y: -200, w: 640, d: 640, rot: 0 }, { kind: "shed", x: 0, y: 330, w: 640, d: 430, rot: 0 }],
  });
  prop("heartland:flower_cart", [DISTILLERY[0] + 900, DISTILLERY[1] - 700], 120, 230);
  prop("heartland:drying_rack", [DISTILLERY[0] - 1000, DISTILLERY[1] - 300], 0, 220, { solid: [{ kind: "rack", x: 0, y: 0, w: 160, d: 360, rot: 0 }] });
  for (const at of [[DISTILLERY[0] + 500, DISTILLERY[1] + 700], [DISTILLERY[0] - 650, DISTILLERY[1] + 750]] as XY[]) cypress(at, 1.1);
  prop("common:bench", [DISTILLERY[0] + 700, DISTILLERY[1] + 300], 180, 100);

  // ---- the stone farmhouse in the east, its yard, the vineyard behind it ----
  prop("westfarm:farmhouse", FARM, 0, 900, {
    solid: [{ kind: "building", x: 0, y: -210, w: 660, d: 840, rot: 0 }, { kind: "building", x: 10, y: 520, w: 620, d: 660, rot: 0 }, { kind: "box", x: -375, y: -330, w: 120, d: 560, rot: 0 }],
  });
  prop("trunrada:cart", [FARM[0] - 750, FARM[1] + 900], 40, 230);
  prop("trunrada:haystack", [FARM[0] + 200, FARM[1] + 1350], 0, 200);
  prop("heartland:village_well", [FARM[0] - 900, FARM[1] - 600], 0, 200, { solid: [{ kind: "well", x: 0, y: 0, r: 100 }, { kind: "box", x: 0, y: 180, w: 130, d: 90, rot: 0 }] });
  for (const at of [[FARM[0] - 600, FARM[1] - 1100], [FARM[0] + 500, FARM[1] + 1100]] as XY[]) cypress(at, 1.15);
  // the vines in rows east of the house
  for (let k = 0; k < 7; k++)
    for (let j = 0; j < 3; j++) {
      const at: XY = [2900 + k * 260, -3200 - j * 800];
      if (!f.level(at[0], at[1], 160) || nearTrack(at[0], at[1], 300) || !inside(at[0], at[1], 350)) continue;
      put("westfarm:vineyard_row", at, 0, { solid: [{ kind: "fence", x: 0, y: 0, w: 60, d: 800, rot: 0 }] });
      taken.push([at[0], at[1] - 300, 120], [at[0], at[1], 120], [at[0], at[1] + 300, 120]);
    }

  // ---- the cypress hill: the old shrine on its top, lavender round it, the drying racks ----
  prop("westfarm:wayside_shrine", HILLTOP, towards(-1, -0.4), 160, { solid: [{ kind: "shrine", x: 0, y: 0, w: 140, d: 140, rot: 0 }] });
  prop("common:bench", [HILLTOP[0] - 350, HILLTOP[1] - 250], 200, 100);
  for (const at of [[3800, 3600], [4300, 2200]] as XY[]) prop("heartland:drying_rack", at, rnd() * 180, 220, { solid: [{ kind: "rack", x: 0, y: 0, w: 160, d: 360, rot: 0 }] });
  // cypresses up the hill's path
  for (let i = 1; i < HILL_WAY.length - 1; i += 3) {
    const [ax, ay] = HILL_WAY[i], [bx, by] = HILL_WAY[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
    for (const sd of [-1, 1]) {
      const at: XY = [ax - ((by - ay) / L) * sd * 330, ay + ((bx - ax) / L) * sd * 330];
      if (inPoly(NWH, at[0], at[1]) && f.level(at[0], at[1], 90) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - at[0], ty - at[1]) < tr + 90)) cypress(at, 0.9 + rnd() * 0.2);
    }
  }

  // ---- the terraces: the wayside shrine on the upper one, looking out over the lavender ----
  prop("westfarm:wayside_shrine", SHRINE, towards(1, 0.2), 160, { solid: [{ kind: "shrine", x: 0, y: 0, w: 140, d: 140, rot: 0 }] });
  tree("BigOak", [SHRINE[0] - 300, SHRINE[1] - 500], 1.15, 48);
  prop("common:bench", [SHRINE[0] + 300, SHRINE[1] + 250], 0, 100);
  prop("heartland:flower_cart", [-2400, -2600], 200, 230);

  // ---- the aqueduct's last bays over the edge and the spring at its head ----
  const ah = lengthwise(AU[0], AU[1]);
  const tallSolid: SolidSpec[] = [{ kind: "pier", x: 0, y: -355, w: 300, d: 92, rot: 0 }, { kind: "pier", x: 0, y: 355, w: 300, d: 92, rot: 0 }];
  const ruinSolid: SolidSpec[] = [{ kind: "pier", x: 0, y: -355, w: 290, d: 92, rot: 0 }, { kind: "pier", x: 0, y: 355, w: 290, d: 92, rot: 0 }, { kind: "rubble", x: 0, y: 40, r: 150 }];
  prop("westfarm:aqueduct", aqAt(AQ_BAY(-1)), ah, 450, { solid: tallSolid });
  prop("westfarm:aqueduct", aqAt(AQ_BAY(-2)), ah, 450, { solid: tallSolid });
  prop("westfarm:aqueduct_ruin", aqAt(AQ_BAY(-3)), ah, 450, { solid: ruinSolid });
  prop("westfarm:aqueduct", aqAt(AQ_BAY(-4)), ah, 450, { solid: tallSolid });
  f.blockDisc(SPRING, 320);
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2, at: XY = [SPRING[0] + Math.cos(a) * 400, SPRING[1] + Math.sin(a) * 360];
    if (inside(at[0], at[1], 120)) put(k % 3 ? "plains:reeds" : "plains:flat_rock", at, rnd() * 360, { s: k % 3 ? 1 : 0.5, solid: "none" });
  }
  taken.push([SPRING[0], SPRING[1], 600]);

  // ---- the lavender: each block a region filled with rows of 8 m pieces end to end along `dir`
  // (degrees), `gap` apart; a piece only where it lies whole on level open ground ----
  const fits = (a: XY, b: XY, region: XY[]) => {
    for (let t = 0.02; t <= 0.99; t += 0.24) {
      const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
      if (!inPoly(region, x, y) || !inside(x, y, 250) || !f.level(x, y, 150) || nearTrack(x, y, 340) || wet(x, y, 150) || Math.abs(f.h(x, y) - f.h(a[0], a[1])) > 10) return false;
      if (taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + 100)) return false;
    }
    return true;
  };
  const fillRows = (region: XY[], dir: number, gap: number) => {
    const ux = Math.cos((dir * Math.PI) / 180), uy = Math.sin((dir * Math.PI) / 180), vx = -uy, vy = ux;
    let a0 = Infinity, a1 = -Infinity, c0 = Infinity, c1 = -Infinity;
    for (const [x, y] of region) {
      const a = x * ux + y * uy, c = x * vx + y * vy;
      [a0, a1, c0, c1] = [Math.min(a0, a), Math.max(a1, a), Math.min(c0, c), Math.max(c1, c)];
    }
    const laid: XY[][] = [];
    for (let c = c0 + gap / 2; c < c1; c += gap)
      for (let a = a0; a + 800 <= a1; ) {
        const p0: XY = [ux * a + vx * c, uy * a + vy * c], p1: XY = [ux * (a + 800) + vx * c, uy * (a + 800) + vy * c];
        if (!fits(p0, p1, region)) {
          a += 100;
          continue;
        }
        put("heartland:lavender_row", [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], lengthwise(ux, uy), { solid: "none" });
        laid.push([p0, p1]);
        a += 800;
      }
    for (const [p0, p1] of laid) for (let t = 0.1; t < 1; t += 0.2) taken.push([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, 100]);
  };
  // on the terraces and the hill, rows across their tops
  fillRows(LT2, 0, 220);
  fillRows(LT1, 90, 220);
  fillRows(NWH, 20, 220);
  // north of the river: between the north road and the river; round the west road
  fillRows([[1300, 1300], [3000, 300], [4500, -300], [4600, 900], [3200, 1300], [2100, 1900]], 70, 220);
  fillRows([[700, 2200], [2900, 2800], [3000, 3400], [2300, 5300], [700, 5300], [500, 3200]], 0, 220);
  // south of the river: the strip by the river's bend, the east beyond the farm, by the roads
  fillRows([[-800, -900], [-2900, -800], [-3200, 1900], [-2200, 1700], [-800, 600]], 90, 220);
  fillRows([[-3000, 2900], [-4800, 2900], [-4800, 4700], [-3000, 4700]], 0, 220);
  fillRows([[700, -1000], [4300, -900], [5000, -1600], [5000, -5000], [700, -5000]], 0, 220);
  fillRows([[-700, -1900], [-1650, -2400], [-1650, -5100], [-700, -5100]], 90, 220);

  // ---- cypresses along the roads, stone walls between the fields ----
  for (const line of [WEST, SOUTH, NORTH])
    for (let i = 3; i < line.length - 3; i += 6) {
      const [ax, ay] = line[i], [bx, by] = line[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
      for (const sd of [-1, 1]) {
        const at: XY = [ax - ((by - ay) / L) * sd * 380, ay + ((bx - ax) / L) * sd * 380];
        if (inside(at[0], at[1], 250) && f.level(at[0], at[1], 90) && !wet(at[0], at[1], 120) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - at[0], ty - at[1]) < tr + 60)) cypress(at, 0.9 + rnd() * 0.25);
      }
    }
  const gapAt = (x: number, y: number) => nearTrack(x, y, 330) || wet(x, y, 120) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + 60);
  for (const w of [
    [[600, -1100], [600, -5300]], [[2600, -1000], [2600, -2700]], [[-700, -1900], [-1700, -1900]], [[1200, 2300], [2900, 2900]],
    [[-3000, 2800], [-4900, 2800]], [[-800, -800], [-2900, -700]], [[600, 5300], [600, 2200]],
  ] as XY[][]) wallRun(f, w, { skip: gapAt, broken: 0.2 });

  // ---- trees, rocks and the meadow's growth ----
  scatter(["flora:BigOak", "flora:RoundTree", "westfarm:cypress", "flora:RoundTree"], 18, IN, 220, { s: [0.85, 1.15], solid: [{ kind: "tree", x: 0, y: 0, r: 44 }], gap: 250 });
  scatter(["ruins:olive_tree"], 6, IN, 240, { s: [0.75, 1], solid: [{ kind: "tree", x: 0, y: 0, r: 40 }] });
  scatter(["heartland:meadow_boulder", "heartland:field_stones"], 6, IN, 200, { s: [0.6, 0.9], solid: [{ kind: "rock", x: 0, y: 0, r: 110 }] });
  scatter(["heartland:flower_bush"], 8, IN, 110, { s: [0.7, 1], solid: [{ kind: "bush", x: 0, y: 0, r: 60 }] });
  // the great wood's oaks coming in on the north
  scatter(["flora:BigOak", "flora:RoundTree", "flora:BigOak", "flora:SmallTree"], 34, { x0: 3500, x1: R - 150, y0: -R + 150, y1: R - 150 }, 210, { s: [0.85, 1.25], solid: [{ kind: "tree", x: 0, y: 0, r: 44 }], keep: (x) => rnd() < woody(x) + 0.1 });
  const grassOut = (x: number, y: number) => nearTrack(x, y, 60) || wet(x, y, 40) || !f.level(x, y, 90) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr * 0.8);
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["tall_grass", "tall_grass", "fern_clump"], grassOut, { count: 150, tries: 4000, spacing: 420, kit: "plains" });
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["lavender_clump", "lavender_clump", "poppy_patch"], grassOut, { count: 80, tries: 2500, spacing: 520, kit: "heartland" });
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["wildflowers"], grassOut, { count: 50, tries: 2000, spacing: 650, kit: "westfarm" });

  // ---- past the edge: the great wood north, oaks and fields round the rest, Venezia's woods south ----
  const rim = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || nearTrack(x, y, 330) || wet(x, y, 150) || toLine(x, y, [aqAt(AQ_BAY(-5)), aqAt(AQ_BAY(1))]) < 450;
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["BigOak", "RoundTree", "BigOak", "SmallTree", "RoundTree", "Pine"], (x, y) => rim(x, y) || (x < 5600 && rnd() < 0.45), { count: 520, tries: 8000, spacing: 420 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["cypress", "cypress", "wildflowers", "vineyard_row"], (x, y) => rim(x, y) || x > 5600, { count: 70, tries: 2000, spacing: 600, kit: "westfarm" });

  // ---- monsters: the lavender, the hill, the terraces, the meadows ----
  const busy = (x: number, y: number) => Math.hypot(x - DISTILLERY[0], y - DISTILLERY[1]) < 1100 || Math.hypot(x - FARM[0], y - FARM[1]) < 1200 || Math.hypot(x - SHRINE[0], y - SHRINE[1]) < 450;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 820, keepOut: busy, max: 50 });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "lavender_perfumer", x: DISTILLERY[0] + 300, y: DISTILLERY[1] - 750, face: 270, name: "มาดามโรซาลี", title: "ช่างกลั่นน้ำหอม", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "violet", eyes: "violet", top: "top_lilac", bottom: "bottom_wine" },
      lines: [
        "น้ำมันลาเวนเดอร์จากหม้อกลั่นนี้ส่งลงไปขายที่เวนิชเซีย พ่อค้าที่นั่นขนลงเรือไปทุกเมืองท่า",
        "ดอกต้องตัดตอนเช้าก่อนแดดแรง แล้วตากให้แห้งบนราวสามวันถึงจะหอมที่สุด",
        "ตกค่ำระวังผีเสื้อราตรีตัวใหญ่ด้วยนะ ผงสีม่วงจากปีกมันทำให้ง่วงจนเดินไม่ไหว",
      ],
    },
    {
      id: "lavender_vintner", x: FARM[0] - 600, y: FARM[1] + 300, face: 200, name: "ลุงปิแอร์", title: "เจ้าของบ้านไร่หิน", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "บ้านหินหลังนี้ปู่ทวดข้าสร้างไว้ ข้างหลังเป็นไร่องุ่น ข้างหน้าเป็นลาเวนเดอร์สุดสายตา",
        "ปีนี้องุ่นหวานจัด พวกตัวต่อกินจนเมาบินโซเซไปทั่ว แต่อย่าประมาท มันต่อยแรงกว่าปกติ",
        "ท่อส่งน้ำเก่าทางตะวันตกเฉียงใต้เริ่มจากตาน้ำในเนินของเรานี่แหละ สมัยก่อนส่งน้ำไปถึงโนอา",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery: [f.waterSheet({ x0: -A, x1: A, y0: -A, y1: A + 400 }, -14, "WaterSea")] as THREE.Object3D[],
    sky: "#7b8f5a",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && !wet(x, y, 60), density: 0.3 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 150, y: -4350 },
    npcs,
    labels: [
      { x: N_EXIT[0] - 250, y: N_EXIT[1], text: "ทางไปป่าใหญ่ตะวันตก", kind: "gate" },
      { x: E_EXIT[0], y: E_EXIT[1] + 250, text: "ทางไปทุ่งกังหันลม", kind: "gate" },
      { x: S_EXIT[0] + 250, y: S_EXIT[1], text: "ทางไปเวนิชเซีย", kind: "gate" },
      { x: W_EXIT[0], y: W_EXIT[1] - 250, text: "ทางไปที่ราบใต้โนอา", kind: "gate" },
      { x: DISTILLERY[0] + 700, y: DISTILLERY[1], text: "โรงกลั่นน้ำหอม" },
      { x: FARM[0] - 700, y: FARM[1], text: "บ้านไร่หิน" },
      { x: 3500, y: -4000, text: "ไร่องุ่น", kind: "small" },
      { x: HILLTOP[0] - 400, y: HILLTOP[1], text: "เนินไซเปรส" },
      { x: -3000, y: -3200, text: "ลานลาเวนเดอร์ขั้นบันได" },
      { x: SHRINE[0] + 350, y: SHRINE[1], text: "ศาลบนลานบน", kind: "small" },
      { x: BR[0] + 300, y: BR[1] - 600, text: "สะพานหิน", kind: "small" },
      { x: SPRING[0] + 600, y: SPRING[1], text: "ตาน้ำหัวท่อส่งน้ำ", kind: "small" },
      { x: 2600, y: 800, text: "ทุ่งลาเวนเดอร์" },
    ],
  });
}

// แม่น้ำเยือกแข็ง (the frozen river), monsters Lv 122-134: the great river between Noa's plains
// and the snow country, here 25-30 m wide and running east to west across the field. The south
// bank is still grass, gone pale with cold: birches and pines, reeds frozen into the shore ice,
// a knoll with an old beacon tower. The north bank is snow and rises out of the river as a cliff
// in two steps, snow-laden pines climbing both.
//
// In the middle the river has frozen right across: a broad stretch of ice you can walk over, the
// way marked with poles, the ferryman's landing and his ferry frozen fast at its south side,
// rowboats caught in the ice. Upstream and downstream it is still open, dark water carrying
// floes, the frozen stretch ending in a ragged edge of heaved-up ice. Downstream (east) the old
// stone bridge of three arches still stands, but its middle arch fell long ago: you can walk out
// from either bank to the barriers at the broken ends and look across the gap.
//
// The bridge's two halves are narrow plateaus as high as its deck: one is a step on the south
// bank with the bridge's ramp up to it, the other a tongue of the north bank's first step; the
// rock faces the ground would hang down their sides are taken out, the stone of the bridge stands
// in their place.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: south -> noa, north -> highland

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { defineMaterial, material } from "./textures";
import { KIT as SNOW, densify, smooth, band, blobPoly, inPoly, towards, flatSheet } from "./kits/snowland";
import type { XY } from "./kits/snowland";
import { KIT as ICEBERG } from "./kits/iceberg";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as NORTHCOLD, BRIDGE } from "./kits/northcold";
import type { NpcSpec } from "../npcs";

useKits(SNOW, ICEBERG, PLAINS, NORTHCOLD);

defineMaterial("Northcold_RiverWater", { tint: "#1d4054", rough: 0.05, opacity: 0.95 });

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the river: its middle line and width along it (y), and the two banks ----
const BY = -3400; // the bridge crosses here
const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// near the bridge the banks are drawn straight and exactly three spans apart
const atBridge = (y: number) => 1 - ss(400, 1500, Math.abs(y - BY));
const mid = (y: number) => -100 - 0.09 * y + 260 * Math.sin(y / 2300 + 0.7);
const wide = (y: number) => 2700 + 0.03 * y + 200 * Math.sin(y / 1700);
const xs = (y: number) => mid(y) - wide(y) / 2 + (-1500 - (mid(y) - wide(y) / 2)) * atBridge(y); // the south bank
const xn = (y: number) => mid(y) + wide(y) / 2 + (1500 - (mid(y) + wide(y) / 2)) * atBridge(y); // the north bank (the cliff)
// where the ice ends: upstream (west) and downstream (east), each a ragged line across
const ICE_W = 2600, ICE_E = -1500;
const iceEdge = (y0: number, x: number) => y0 + 160 * Math.sin(x / 260) + 90 * Math.sin(x / 97 + 1);
// along the frozen stretch the north bank's cliff stands back from the river: a beach of snow
const bay = (y: number) => 1100 * ss(-1700, -700, y) * (1 - ss(1800, 2800, y));
// under the cliff along the open water a strip of rocky shore; none at the bridge
const strip = (y: number) => 520 * (1 - atBridge(y));

const YS: number[] = [];
for (let y = -A; y <= A; y += 250) YS.push(y);
const SOUTH: XY[] = YS.map((y) => [xs(y), y]);
const NORTH_EDGE: XY[] = YS.map((y) => [xn(y) + bay(y), y]); // the first step's edge (before the bridge's tongue)

// the water: west of the ice and east of it, between the south bank and the shore under the cliff
const WATER_W: XY[] = (() => {
  const ys = YS.filter((y) => y > ICE_W + 300);
  const edge: XY[] = [];
  for (let k = 0; k <= 16; k++) {
    const x = xs(ICE_W) - 40 + ((xn(ICE_W) - strip(ICE_W) + 80 - xs(ICE_W)) * k) / 16;
    edge.push([x, iceEdge(ICE_W, x)]);
  }
  return [...edge, ...ys.map((y) => [xn(y) - strip(y), y] as XY), [xn(A) - strip(A), A + 400], [xs(A), A + 400], ...ys.map((y) => [xs(y), y] as XY).reverse()];
})();
const WATER_E: XY[] = (() => {
  const ys = YS.filter((y) => y < ICE_E - 300);
  const edge: XY[] = [];
  for (let k = 0; k <= 16; k++) {
    const x = xs(ICE_E) - 40 + ((xn(ICE_E) - strip(ICE_E) + 80 - xs(ICE_E)) * k) / 16;
    edge.push([x, iceEdge(ICE_E, x)]);
  }
  return [...edge, ...ys.map((y) => [xn(y) - strip(y), y] as XY).reverse(), [xn(-A) - strip(-A), -A - 400], [xs(-A), -A - 400], ...ys.map((y) => [xs(y), y] as XY)];
})();
// the frozen stretch between them, its ends a little over the water's ragged edges
const ICE: XY[] = (() => {
  const ys = YS.filter((y) => y > ICE_E + 250 && y < ICE_W - 250);
  const end = (y0: number, out: number): XY[] => {
    const pts: XY[] = [];
    for (let k = 0; k <= 16; k++) {
      const x = xs(y0) - 30 + ((xn(y0) + 50 - xs(y0)) * k) / 16;
      pts.push([x, iceEdge(y0, x) + out]);
    }
    return pts;
  };
  return [...ys.map((y) => [xs(y) - 30, y] as XY), ...end(ICE_W, 40), ...ys.map((y) => [xn(y) + 20, y] as XY).reverse(), ...end(ICE_E, -40).reverse()];
})();

// ---- the levels ----
// N1: the north bank's first step (286, as high as the bridge's deck), its tongue out over the
// river the bridge's north half; N2: the second step (580) where the way goes on to Highland Hill;
// SB: the bridge's south half (286), up its ramp from the bank; S1: the beacon knoll on the south
// bank (220). Past the edge: ridges on the north (scenery).
const DECK = BRIDGE.deck - BRIDGE.bank; // 286
const GAP0 = -250, GAP1 = 300; // the broken span's ends, from its middle (x = 0 at the bridge)
const BW = BRIDGE.clear / 2;
const N1: XY[] = (() => {
  const west = NORTH_EDGE.filter(([, y]) => y > BY + 400).reverse(); // y from A down
  const east = NORTH_EDGE.filter(([, y]) => y < BY - 400).reverse();
  return [[A, A], ...west, [1500, BY + BW], [GAP1, BY + BW], [GAP1, BY - BW], [1500, BY - BW], ...east, [A, -A]];
})();
const N2: XY[] = [[A, -A], [A, A], [4600, A], [4400, 6000], [4000, 4200], [4300, 2700], [4200, 1500], [4500, 200], [4100, -1200], [4300, -2800], [4000, -4300], [4400, -6000], [4600, -A]];
const RAMP_TOP = -1500 - (BRIDGE.rampLen / 2 - BRIDGE.rampTop); // where the ramp's slope meets the deck
const SB: XY[] = [[RAMP_TOP, BY - BW], [GAP0, BY - BW], [GAP0, BY + BW], [RAMP_TOP, BY + BW]];
const S1: XY[] = [[-5300, 2300], [-3700, 2000], [-3100, 2900], [-3300, 4200], [-4100, 4900], [-5300, 4600]];
const M1: XY[] = [[6600, -A], [6400, -5000], [6900, -2000], [6600, 200], [8000, 600], [8100, 2000], [6800, 2700], [7000, 4500], [6600, A], [A, A], [A, -A]];

// ramps: top on the edge, bottom out below
const RN1 = { top: [xn(400) + bay(400), 400] as XY, bottom: [1600, 300] as XY, width: 460 };
const RN2 = { top: [4200, 1500] as XY, bottom: [3250, 1250] as XY, width: 440 };
const RSB = { top: [RAMP_TOP, BY] as XY, bottom: [RAMP_TOP - BRIDGE.run, BY] as XY, width: BRIDGE.clear, straight: true };
const RS1 = { top: [-3200, 3300] as XY, bottom: [-2400, 3420] as XY, width: 420 };
// the cliffs stay as drawn along the bridge's two halves (no scree, the faces plain)
const KEEP: XY[] = [[RAMP_TOP + 60, BY], [-1300, BY], [-900, BY], [-500, BY], [GAP0 - 60, BY], [GAP1 + 60, BY], [700, BY], [1100, BY], [1450, BY], [1500, BY - BW], [1500, BY + BW]];

const along = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};
const len = (r: { top: XY; bottom: XY }) => Math.hypot(r.top[0] - r.bottom[0], r.top[1] - r.bottom[1]);
const dz = (p: XY[]) => densify(p, (x, y) => Math.abs(x) < R + 1500 && Math.abs(y) < R + 1500);

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(309, {
    hills: [
      { x: -3600, y: -1500, r: 1500, h: 120 },
      { x: -4300, y: 600, r: 1100, h: -60 },
      { x: -2900, y: -4800, r: 1300, h: 110 },
      { x: -4600, y: -4000, r: 1100, h: 90 },
      { x: 2900, y: -2000, r: 1100, h: 80 },
      { x: 3000, y: 4000, r: 1200, h: 90 },
      { x: 5200, y: -3000, r: 900, h: 70 },
      { x: -7200, y: 0, r: 2500, h: 200 },
    ],
    plateaus: [
      { poly: dz(N1), h: DECK, ramps: [RN1] },
      { poly: dz(N2), h: 580, ramps: [RN2] },
      { poly: SB, h: DECK, ramps: [RSB] },
      { poly: dz(S1), h: 220, ramps: [RS1] },
      { poly: dz(M1), h: 1100 },
    ],
    rock: "CliffSnow",
    keep: KEEP,
  });
  const { put, rnd } = f;

  // ---- tracks: from Noa over the ice and up both steps to the way to Highland Hill; to the
  // bridge from both banks, to the beacon knoll ----
  const S_EXIT: XY = [-5150, 0], N_EXIT: XY = [5150, 1300];
  const n1in = along(RN1.bottom, RN1.top, -500), n1out = along(RN1.bottom, RN1.top, len(RN1) + 450);
  const n2in = along(RN2.bottom, RN2.top, -380), n2out = along(RN2.bottom, RN2.top, len(RN2) + 450);
  const MAIN: XY[] = [
    ...smooth([[-7600, 100], S_EXIT, [-4300, 120], [-3400, -80], [-2500, 150], [-1700, 330], [-900, 380], [0, 420], [700, 330], n1in]),
    RN1.bottom, RN1.top,
    ...smooth([n1out, [3050, 900], n2in]),
    RN2.bottom, RN2.top,
    ...smooth([n2out, [4700, 1420], N_EXIT, [7600, 1300]]),
  ];
  const BRIDGE_S: XY[] = [...smooth([[-3400, -80], [-3150, -1100], [-3250, -2300], [-3350, -3050], [RSB.bottom[0] - 350, BY]]), RSB.bottom, RSB.top, [GAP0 - 150, BY]];
  const BRIDGE_N: XY[] = smooth([[3050, 900], [3000, -500], [2700, -1800], [2300, -2800], [1900, -3300], [1500, BY], [GAP1 + 150, BY]]);
  const s1in = along(RS1.bottom, RS1.top, -450);
  const KNOLL: XY[] = [...smooth([[-2500, 150], [-2300, 1200], [-2000, 2400], s1in]), RS1.bottom, RS1.top, ...smooth([along(RS1.bottom, RS1.top, len(RS1) + 350), [-4000, 3500], [-4300, 3500]])];
  const ROAD: [number, number, number] = [0.74, 0.76, 0.86];
  const roads = [band(MAIN, 470), band(BRIDGE_S, 420), band(BRIDGE_N, 400), band(KNOLL, 380)];

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ground = f.ground({ area, roads, plazas: [], water: [WATER_W, WATER_E], base: "snow", road: ROAD });
  // the south bank's grass: a second ground a hair over the snow, cut away north of the bank
  const NORTH_OF_BANK: XY[] = [...SOUTH, [A + 500, A], [A + 500, -A]];
  const grass = f.ground({ area: { x0: -A, y0: -A, x1: 0, y1: A }, roads, plazas: [], water: [NORTH_OF_BANK], base: "steppe", road: ROAD, tint: "#e2e6da" });
  grass.mesh.position.y += 3;
  grass.mesh.renderOrder = 1;

  // ---- ways out ----
  f.exit("noa", S_EXIT, [-4400, 80]);
  f.exit("highland", N_EXIT, [4450, 1360]);

  // ---- placing things: clear of tracks, water, cliffs and each other ----
  const taken: [number, number, number][] = [];
  const onIce = (x: number, y: number) => inPoly(ICE, x, y);
  const free = (x: number, y: number, r: number, gap = 0) =>
    Math.abs(x) < A - 200 && Math.abs(y) < A - 200 &&
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    take(at[0], at[1], r);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] });
  const inBox = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  const north = (x: number, y: number) => x > xn(y) - 600;
  const treeKind = (x: number, y: number): string => {
    const k = rnd();
    if (north(x, y)) return k < 0.55 ? "SnowPine" : k < 0.85 ? "SnowPineSmall" : "FrostOak";
    return k < 0.35 ? "Pine" : k < 0.55 ? "PineSmall" : k < 0.9 ? "Birch" : "SnowPineSmall";
  };
  const grove = (c: XY, r: number, n: number, kinds?: string[]) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inBox(x, y) || onIce(x, y) || !free(x, y, 170, 180)) continue;
      put(`flora:${kinds ? kinds[Math.floor(rnd() * kinds.length)] : treeKind(x, y)}`, [x, y], rnd() * 360, { s: 0.75 + rnd() * 0.45 });
      take(x, y, 170);
      made++;
    }
  };
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, o: { solid?: number; ice?: boolean; z?: number } = {}) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (Math.abs(x) > R + 2500 || Math.abs(y) > R + 2500 || (o.ice === false && onIce(x, y)) || !free(x, y, rad, 40)) continue;
      put(ref, [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.4, ...(o.solid ? ring(o.solid) : {}), ...(o.z !== undefined ? { z: o.z } : {}) });
      take(x, y, rad);
      made++;
    }
  };

  // ---- the river: dark water, its banks closed to walkers, floes on it ----
  const water = f.waterSheet({ x0: -3200, x1: 2600, y0: -A - 400, y1: A + 400 }, -14, "Northcold_RiverWater");
  // the water's edges: boxes along each, none across the bridge's south half (its own sides wall
  // it) - the north bank's cliff closes the water itself where there is no shore under it
  const edge = (pts: XY[], width: number, skip: (x: number, y: number) => boolean = () => false) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L / 120));
      const rot = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
        if (Math.abs(y) > R + 400 || skip(x, y)) continue;
        f.extra.push({ kind: "water", x, y, w: L / n + 40, d: width, rot });
      }
    }
  };
  const SHORE_S = YS.filter((y) => y < ICE_E + 100 || y > ICE_W - 100).map((y) => [xs(y) + 60, y] as XY);
  edge(SHORE_S.filter(([, y]) => y < 0), 160, (_x, y) => Math.abs(y - BY) < BW + 60);
  edge(SHORE_S.filter(([, y]) => y > 0), 160);
  edge(YS.filter((y) => y < ICE_E && atBridge(y) < 0.4).map((y) => [xn(y) - strip(y) - 60, y] as XY), 160);
  edge(YS.filter((y) => y > ICE_W).map((y) => [xn(y) - strip(y) - 60, y] as XY), 160);
  for (const y0 of [ICE_W, ICE_E]) {
    const pts: XY[] = [];
    for (let k = 0; k <= 16; k++) {
      const x = xs(y0) + ((xn(y0) - strip(y0) - xs(y0)) * k) / 16;
      pts.push([x, iceEdge(y0, x) + (y0 > 0 ? -70 : 70)]);
    }
    edge(pts, 180);
  }
  // floes in the open water
  for (const [x, y, h, s] of [
    [-600, 3600, 20, 1], [400, 4300, 140, 0.8], [-900, 5200, 250, 1.1], [200, 6200, 60, 0.9], [-300, 3200, 300, 0.6],
    [-200, -2200, 100, 0.9], [600, -2700, 200, 0.7], [-700, -4300, 30, 1], [500, -5000, 160, 0.8], [-400, -6200, 280, 1.1], [300, -1900, 330, 0.6],
  ] as [number, number, number, number][]) put("northcold:drift_floes", [x, y], h, { z: -14, s, solid: "none" });
  const floeMat = material("Northcold_Floe"), floes: THREE.Object3D[] = [];
  for (const [x, y, r, s] of [[-1100, 4000, 150, 61], [700, 3400, 120, 62], [-200, 4800, 180, 63], [900, -2400, 140, 64], [-1000, -2900, 110, 65], [100, -4600, 160, 66], [-300, -5700, 130, 67], [800, 5600, 140, 68]] as number[][])
    floes.push(flatSheet(blobPoly([x, y], r, r * 0.7, s, 0.25, 10), -11, floeMat));

  // ---- the frozen stretch: a skin of white ice over it, plates of darker ice, heaved ridges at
  // its edges, the ice road marked with poles ----
  const iceSheet = flatSheet(ICE, 3, material("Northcold_ShoreIce"));
  iceSheet.renderOrder = 2;
  const plates: [number, number, number][] = [];
  for (let i = 0; i < 400 && plates.length < 26; i++) {
    const px = xs(0) + rnd() * (xn(0) - xs(0)), py = ICE_E + rnd() * (ICE_W - ICE_E), s = 0.5 + rnd() * 0.5, r = 430 * s;
    if (![[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => onIce(px + dx, py + dy) && ground.kind(px + dx, py + dy) === 0)) continue;
    if (plates.some(([qx, qy, qr]) => Math.hypot(qx - px, qy - py) < (qr + r) * 0.95)) continue;
    plates.push([px, py, r]);
    put("northcold:river_ice", [px, py], rnd() * 360, { s, z: 1.5, solid: "none" });
  }
  for (const y0 of [ICE_W, ICE_E])
    for (let k = 0; k < 4; k++) {
      const x = xs(y0) + 450 + k * ((xn(y0) - xs(y0) - 900) / 3), y = iceEdge(y0, x) + (y0 > 0 ? -260 : 260);
      prop("northcold:ice_ridge", [x, y], -6 + (rnd() - 0.5) * 30, 200, { solid: [{ kind: "ice", x: 0, y: 0, w: 220, d: 700, rot: 0 }] });
    }
  for (const [at, h] of [[[-400, 1700], 70], [[900, -700], -40], [[300, 2300], 20], [[-900, -900], 100]] as [XY, number][])
    if (free(at[0], at[1], 300)) prop("northcold:ice_ridge", at, h, 330, { s: 0.8, solid: [{ kind: "ice", x: 0, y: 0, w: 200, d: 600, rot: 0 }] });
  // the poles both sides of the way over the ice
  for (let x = xs(400) + 250; x < xn(400) - 100; x += 650)
    for (const s of [-1, 1]) {
      const y = 380 + (x / 900) * 20 + s * 330;
      prop("northcold:ice_marker", [x, y], rnd() * 360, 40, ring(20, "post"));
    }
  scatter("snowland:snow_drift", [0, 600], 1300, 5, 230, { ice: true });
  scatter("northcold:iced_rocks", [600, -800], 900, 1, 200, { solid: 150 });

  // ---- the ferry: the ferryman's hut on the south bank, his landing out onto the ice and the
  // ferry frozen in at its end, boats caught in the ice, reeds along the shore ----
  const HUT: XY = [-2350, 1650];
  prop("northcold:ferry_hut", HUT, 180, 520, { solid: [{ kind: "house", x: 0, y: 0, w: 640, d: 540, rot: 0 }, { kind: "house", x: -70, y: 0, w: 140, d: 520, rot: 0 }] });
  const LAND: XY = [xs(1750) - 60 + 840, 1750];
  prop("northcold:ferry_landing", LAND, 0, 600, { solid: [{ kind: "dock", x: -520, y: 0, w: 720, d: 280, rot: 0 }, { kind: "boat", x: 230, y: 0, w: 680, d: 420, rot: 0 }, { kind: "post", x: 670, y: 160, r: 40 }] });
  for (const [at, h] of [[[-800, 2450], 30], [[-1150, 1050], 160], [[-150, 2150], 290], [[200, 1200], 60]] as [XY, number][])
    prop("northcold:icebound_boat", at, h, 280, { solid: [{ kind: "boat", x: 0, y: 0, w: 480, d: 200, rot: 0 }] });
  prop("iceberg:woodpile", [-2500, 2350], 90, 170);
  prop("iceberg:snowy_barrels", [-1950, 1150], 20, 110);
  prop("common:crate", [-1900, 2200], 30, 60);
  prop("plains:signpost", [-1850, 1300], 200, 70);
  // reeds frozen into the shore all along the south bank
  for (const y of YS) {
    if (Math.abs(y) > R + 1500 || Math.abs(y - BY) < 600 || Math.abs(y - 400) < 500 || Math.abs(y - 1750) < 500 || rnd() < 0.35) continue;
    const x = xs(y) - 90 - rnd() * 140;
    if (free(x, y, 90)) prop("northcold:frozen_reeds", [x, y + (rnd() - 0.5) * 120], rnd() * 360, 110, { s: 0.8 + rnd() * 0.4, solid: "none" });
  }
  for (const y of YS) {
    if (y < ICE_E || y > ICE_W || Math.abs(y - 400) < 500 || Math.abs(y - 1750) < 450 || rnd() < 0.4) continue;
    const x = xs(y) + 60 + rnd() * 120;
    if (free(x, y, 90)) prop("northcold:frozen_reeds", [x, y], rnd() * 360, 110, { s: 0.7 + rnd() * 0.4, solid: "none" });
  }

  // ---- the old bridge: the ramp on the south bank, a span, the fallen span, the span into the
  // north bank; each stands on the water (or the bank) whatever ground is under its middle ----
  const onBank = (x: number) => -f.h(x, BY);
  const water0 = (x: number) => -BRIDGE.bank - f.h(x, BY);
  put("northcold:bridge_ramp", [RAMP_TOP - BRIDGE.rampTop, BY], 0, { z: onBank(RAMP_TOP - BRIDGE.rampTop), solid: "none" });
  put("northcold:bridge_span", [-1000, BY], 0, { z: water0(-1000), solid: "none" });
  put("northcold:bridge_broken", [0, BY], 0, { z: water0(0), solid: [{ kind: "rail", x: -275, y: 0, w: 60, d: 2 * BW, rot: 0 }, { kind: "rail", x: 320, y: 0, w: 60, d: 2 * BW, rot: 0 }] });
  put("northcold:bridge_span", [1000, BY], 0, { z: water0(1000), solid: "none" });
  take(-1000, BY, 1200);
  take(0, BY, 800);
  take(1000, BY, 900);
  take(RAMP_TOP - BRIDGE.rampTop, BY, 900);
  // its newel posts and the walls at the foot of the ramp
  prop("snowland:trail_sign", [RSB.bottom[0] - 250, BY + 420], 180, 80, ring(30, "post"));
  prop("plains:milestone", [RSB.bottom[0] - 200, BY - 420], 0, 60);
  // on the north bank: the bridge's head, a cairn and lanterns where the way meets it
  prop("iceberg:lantern_post", [1750, BY + 330], 0, 50, ring(25, "post"));
  prop("iceberg:lantern_post", [1750, BY - 330], 0, 50, ring(25, "post"));
  prop("snowland:cairn", [2050, BY - 520], 0, 70, ring(45));

  // ---- the beacon knoll on the south bank ----
  const BEACON: XY = [-4300, 3800];
  prop("iceberg:beacon_tower", BEACON, 120, 420, { solid: [{ kind: "tower", x: 0, y: 0, w: 520, d: 520, rot: 0 }] });
  prop("snowland:cairn", [-3600, 3000], 0, 70, ring(45));
  prop("plains:rock_cluster", [-4800, 2800], 40, 260, { s: 0.8 });
  grove([-4900, 4200], 500, 3, ["Pine", "Birch", "PineSmall"]);

  // ---- up on the north bank: the watchtower ruin over the bridge, a hunter's camp, cairns ----
  const RUIN: XY = [4900, -2700];
  prop("snowland:watch_ruin", RUIN, 160, 560, { solid: [{ kind: "tower", x: 0, y: 0, r: 340 }] });
  prop("snowland:snow_boulder", [4400, -1800], 30, 170, ring(130));
  const CAMP: XY = [2700, 2600];
  prop("snowland:lean_to", CAMP, towards(1, -0.4), 330, { solid: [{ kind: "camp", x: 80, y: 0, w: 360, d: 400, rot: 0 }, { kind: "camp", x: -105, y: -255, w: 160, d: 20, rot: 0 }] });
  prop("snowland:cold_campfire", [2300, 2350], 0, 150, ring(70));
  prop("snowland:log_pile", [3100, 3200], 100, 230);
  for (const at of [[2300, 300], [3050, 1650], [4150, 2400], [4700, 1950], [4600, 600], [2600, -1400], [2200, -2400]] as XY[]) if (free(at[0], at[1], 70)) prop("snowland:cairn", at, rnd() * 90, 70, ring(45));
  prop("snowland:trail_sign", [4900, 950], -90, 80, ring(30, "post"));
  prop("snowland:trail_sign", [3050, 450], 160, 80, ring(30, "post"));
  // the way out to Noa: a sign, a milestone
  prop("plains:signpost", [-4950, -420], 90, 80);
  prop("plains:milestone", [-4950, 450], 0, 60);
  prop("plains:milestone", [-2200, -380], 0, 60);

  // ---- rocks over both banks and the shore under the cliffs ----
  const ROCKS: [string, XY, number][] = [
    ["snowland:snow_boulder", [-4300, -2600], 130], ["plains:rock_cluster", [-2700, -4600], 190], ["snowland:flat_slabs", [-4900, -1200], 150], ["plains:boulder", [-3600, 1000], 150],
    ["snowland:flat_slabs", [-2100, 4200], 150], ["plains:boulder", [-4700, -4600], 150], ["snowland:rock_cluster", [2000, 2000], 190], ["snowland:snow_boulder", [3600, -3200], 130],
    ["snowland:flat_slabs", [3300, 3800], 150], ["snowland:rock_cluster", [4800, -4500], 190], ["snowland:snow_boulder", [5000, 4400], 130], ["snowland:snow_boulder", [2400, -4600], 130],
    ["snowland:rock_cluster", [3900, 4900], 190], ["snowland:flat_slabs", [2100, 900], 150], ["snowland:snow_boulder", [3700, 300], 130],
  ];
  for (const [id, at, r] of ROCKS) if (free(at[0], at[1], r)) prop(id, at, rnd() * 360, r + 40, ring(r));
  // the rocky shore under the cliffs: iced rocks, slabs, the odd floe washed up
  for (const y of YS) {
    if (Math.abs(y) > R || (y > ICE_E - 300 && y < ICE_W + 300) || strip(y) < 400 || rnd() < 0.55) continue;
    const x = xn(y) - strip(y) / 2 + 40;
    const k = rnd();
    if (free(x, y, 110)) prop(k < 0.5 ? "northcold:iced_rocks" : "snowland:flat_slabs", [x, y], rnd() * 360, 160, { s: 0.6 + rnd() * 0.2, solid: [{ kind: "rock", x: 0, y: 0, r: 110 }] });
  }

  // ---- trees: birches and pines on the south bank, snow-laden pines climbing the north ----
  for (const [c, r, n] of [
    [[-4800, -2900], 800, 6], [[-3400, -4400], 700, 5], [[-2300, -2100], 500, 3], [[-4600, 1800], 600, 4], [[-3200, 4600], 600, 4], [[-2600, 3000], 400, 2],
    [[-4000, -900], 500, 3], [[-2200, -4800], 500, 3], [[-3800, 2100], 400, 2], [[-1900, 5000], 400, 2], [[-5000, 600], 400, 2],
    [[2400, -3800], 700, 6], [[3200, -2500], 800, 7], [[2300, -1000], 500, 4], [[3600, -900], 500, 3], [[2400, 3600], 600, 5], [[3400, 4700], 700, 6],
    [[2100, 4900], 500, 4], [[3800, 2400], 400, 2], [[4800, -1000], 500, 4], [[5000, 3000], 500, 4], [[4900, -4200], 500, 4], [[4700, 4900], 500, 4], [[1900, -1800], 400, 3],
  ] as [XY, number, number][]) grove(c, r, n);
  // pines along the tops of the north bank's steps, a few metres back from the drop
  for (const poly of [N1, N2]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 1) continue;
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (!inPoly(poly, mx + nx * 50, my + ny * 50)) [nx, ny] = [-nx, -ny];
      for (let t = 120; t < L; t += 480) {
        const back = 320 + rnd() * 260, x = a[0] + ((b[0] - a[0]) * t) / L + nx * back, y = a[1] + ((b[1] - a[1]) * t) / L + ny * back;
        if (rnd() < 0.3 || !inBox(x, y) || Math.abs(y - BY) < 700 || !free(x, y, 170, 150)) continue;
        put(`flora:${treeKind(x, y)}`, [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.4 });
        take(x, y, 170);
      }
    }
  }
  // fallen rock at the foot of the cliffs on land
  for (const poly of [N1, N2, S1]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 1) continue;
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (inPoly(poly, mx + nx * 50, my + ny * 50)) [nx, ny] = [-nx, -ny];
      for (let t = 200; t < L; t += 700) {
        const out = 260 + rnd() * 150, x = a[0] + ((b[0] - a[0]) * t) / L + nx * out, y = a[1] + ((b[1] - a[1]) * t) / L + ny * out;
        if (rnd() < 0.55 || !inBox(x, y) || onIce(x, y) || !free(x, y, 110, 60)) continue;
        const s = 0.55 + rnd() * 0.3;
        prop(rnd() < 0.6 ? "snowland:snow_boulder" : "snowland:flat_slabs", [x, y], rnd() * 360, 140 * s, { s, solid: [{ kind: "rock", x: 0, y: 0, r: 110 }] });
      }
    }
  }

  // ---- ground cover: dry grass and snow patches on the south bank, drifts and shrubs north ----
  const southBank = (c: XY) => c[0] < xs(c[1]) - 300;
  for (let i = 0; i < 26; i++) {
    const c: XY = [-5200 + rnd() * 3600, -5200 + rnd() * 10400];
    if (!southBank(c)) continue;
    scatter(rnd() < 0.5 ? "snowland:dry_grass" : "snowland:snow_patch", c, 300, 1, rnd() < 0.5 ? 90 : 260, { ice: false });
  }
  scatter("plains:tall_grass", [-3600, 0], 2500, 8, 70, { ice: false });
  scatter("snowland:frost_shrub", [-3800, -2000], 1800, 4, 90, { ice: false, solid: 50 });
  scatter("snowland:snow_drift", [3000, -2500], 1800, 5, 230, { ice: false });
  scatter("snowland:snow_drift", [3200, 2800], 1800, 5, 230, { ice: false });
  scatter("snowland:snow_drift", [4800, 0], 1500, 3, 230, { ice: false });
  scatter("snowland:frost_shrub", [3000, 0], 2500, 6, 90, { ice: false, solid: 50 });
  scatter("snowland:dead_branches", [3000, 0], 3000, 6, 120, { ice: false });
  scatter("snowland:snow_drift", [2000, 600], 500, 2, 230, { ice: false });

  // ---- past the edge: woods all round, the river running on east and west ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const wet = (x: number, y: number) => x > xs(y) - 250 && x < xn(y) + 150;
  const onTrack = (x: number, y: number) => [[0, 0], [250, 0], [-250, 0], [0, 250], [0, -250]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  f.woods({ x0: -A, x1: 0, y0: -A, y1: A }, ["Pine", "Pine", "PineSmall", "Birch", "Birch"], (x, y) => inside(x, y) || onTrack(x, y) || wet(x, y) || x > xs(y), { count: 220, spacing: 400, tries: 5000 });
  f.woods({ x0: 0, x1: A, y0: -A, y1: A }, ["SnowPine", "SnowPine", "SnowPineSmall", "FrostOak"], (x, y) => inside(x, y) || onTrack(x, y) || wet(x, y) || x < xn(y) - 200, { count: 300, spacing: 430, tries: 6000 });

  // ---- monsters ----
  const quiet = (x: number, y: number) => Math.hypot(x - HUT[0], y - HUT[1]) < 1200 || Math.hypot(x - CAMP[0], y - CAMP[1]) < 700 || (Math.abs(y - BY) < 700 && x < -1500 && x > -3500);
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 900, keepOut: quiet });

  // ---- people ----
  const npcs: NpcSpec[] = [
    { id: "frozen_river_ferryman", x: HUT[0] + 600, y: HUT[1] + 330, face: 10, name: "ลุงอาร์เน", title: "คนแจวแพข้ามฟาก", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "blue", top: "top_warrior_navy", bottom: "bottom_warrior_cocoa" },
      lines: [
        "แม่น้ำแข็งตัวแบบนี้มาสามหนาวแล้ว แพของข้าติดอยู่กลางน้ำแข็งนั่น ใช้การไม่ได้เลย",
        "จะข้ามไปฝั่งเหนือก็เดินตามหลักที่ข้าปักไว้บนน้ำแข็ง นอกแนวหลักน้ำแข็งบาง ตกลงไปไม่มีใครช่วยทัน",
        "สะพานหินทางตะวันออกพังลงตั้งแต่รุ่นปู่ข้า ช่วงกลางหายไปทั้งช่วง เดินไปได้แค่ครึ่งทาง",
      ] },
    { id: "frozen_river_warden", x: RSB.bottom[0] - 400, y: BY + 150, face: 0, name: "ทหารยามเฮลกา", title: "ยามสะพานเก่า · โนอา", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "auburn", eyes: "amber", top: "top_adventurer_navy", bottom: "bottom_adventurer_black" },
      lines: [
        "โนอาส่งข้ามาเฝ้าสะพานนี้ ไม่ให้ใครปีนข้ามช่วงที่พังไป ข้างล่างเป็นน้ำเชี่ยวใต้แผ่นน้ำแข็ง",
        "สมัยที่โนอายังเป็นเมืองหลวง กองคาราวานข้ามสะพานนี้ขึ้นไปไฮแลนด์ ฮิลทุกเดือน",
        "สัตว์ประหลาดฝั่งเหนือดุร้ายนัก ถ้าจะข้ามไปทางน้ำแข็งก็เตรียมตัวให้ดี",
      ] },
  ];

  const town = f.finishField({
    ground,
    scenery: [grass.mesh, water, iceSheet, ...floes],
    sky: "#b7c6d3",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -4300, y: 140 },
    npcs,
    labels: [
      { x: S_EXIT[0] + 150, y: S_EXIT[1], text: "ทางไปโนอา", kind: "gate" },
      { x: N_EXIT[0] - 150, y: N_EXIT[1], text: "ทางไปไฮแลนด์ ฮิล", kind: "gate" },
      { x: 300, y: 900, text: "ทางข้ามน้ำแข็ง" },
      { x: RAMP_TOP - 600, y: BY - 350, text: "สะพานหินเก่า" },
      { x: GAP1 + 500, y: BY + 350, text: "ปลายสะพานฝั่งเหนือ", kind: "small" },
      { x: HUT[0] + 500, y: HUT[1] + 300, text: "ท่าแพข้ามฟาก" },
      { x: BEACON[0] + 500, y: BEACON[1] - 400, text: "เนินหอไฟ", kind: "small" },
      { x: -3500, y: -1800, text: "ฝั่งหญ้าใต้" },
      { x: 3000, y: -1000, text: "ป่าสนฝั่งเหนือ" },
      { x: RUIN[0] - 600, y: RUIN[1], text: "ซากหอเฝ้าสะพาน", kind: "small" },
      { x: CAMP[0] - 500, y: CAMP[1], text: "ค่ายนักล่า", kind: "small" },
      { x: 4700, y: 3400, text: "ลานหิมะชั้นบน" },
      { x: 700, y: -900, text: "แม่น้ำเยือกแข็ง", kind: "small" },
    ],
  });

  // Under the bridge there is only water: the rock faces the ground would hang down each side of
  // its two halves (and at their broken ends) are taken out, the bridge's stone stands there.
  town.level.root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh || !m.geometry.index) return;
    const mat = m.material as THREE.Material;
    if (Array.isArray(mat) || mat.side !== THREE.DoubleSide) return;
    const P = m.geometry.getAttribute("position"), idx = m.geometry.index!, keep: number[] = [];
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
      const x = (P.getX(a) + P.getX(b) + P.getX(c)) / 3, y = -(P.getZ(a) + P.getZ(b) + P.getZ(c)) / 3;
      if (x > RAMP_TOP - 20 && x < 1480 && Math.abs(y - BY) < BW + 80) continue;
      keep.push(a, b, c);
    }
    m.geometry.setIndex(keep);
  });
  return town;
}

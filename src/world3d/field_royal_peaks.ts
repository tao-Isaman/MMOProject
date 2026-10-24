// สันเขาหลวง (the royal peaks), monsters Lv 114-124: the high ridge of the king's mountains
// between the old royal mine and the sky dragon's summit, the northern sea under the coast range
// beyond it. A knife-edge ridge runs west to east through the middle, a deep snowy valley either
// side of it: the north valley between the ridge and the coast range, the frost giants' country
// round the foot of the cliffs, a tarn frozen hard in it and a pinnacle the rocs nest on; the
// south valley thick with snow pines toward the hunting forest below.
//
// The way in from the mine comes over the west edge into the basin where the two valleys meet.
// There the kings built a gate of white stone where the ridge road begins: it climbs a ramp onto
// the ridge's west shoulder (the first step), where the stone shelter for travellers stands and
// looks back over the basin, and a second ramp onto the crest. Along the crest the road keeps to
// a spine of rock with drops either side, wind-scoured to the stone in streaks. On the crest's
// height stands the kingdom's boundary pillar under its gilt crown; farther on a spur of the
// crest juts out over the north valley and the crag rocs' great nest sits at its end; past it the
// spine narrows, chains along both its edges, and a cleft splits the crest across, so deep its
// bottom is lost: the old stone arch bridge carries the road over it. Past the bridge the road
// comes down a ramp to the ridge's east shoulder, by the ruin of the kingdom's last watch post,
// and runs on along the ridge over the east edge toward the summit. A lower way goes round by the
// south valley from the west basin, past the frost giants' camp, and climbs onto the east
// shoulder by a ramp of its own.
//
// The coast range (no way up) stands along the whole north and falls sheer into the sea, as the
// mine's mountains do next door; to the south the pine woods run on toward the hunting forest.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: west -> old_royal_mine (middle of the edge), east -> dragon_summit (middle of the
//   edge, up on the ridge, which goes on into the summit's ground)

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, seeded } from "./town";
import { material } from "./textures";
import { KIT as SKY, PAVILION_SOLIDS, PILLAR_SOLIDS, CHASM_BRIDGE_SOLIDS, RIDGE_GATE_SOLIDS, NEST_ROC_SOLIDS } from "./kits/skypeaks";
import { KIT as WESTMOUNT, CHASM_DEPTH, smooth, band, inPoly, toLine, nearestOn, pieces, dense, towards, runAlong, rampOff, beyond, sheet } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import { KIT as SNOW, blobPoly, flatSheet } from "./kits/snowland";
import { KIT as NORTHCOLD } from "./kits/northcold";
import { KIT as STEPPE } from "./kits/steppe";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(SKY, WESTMOUNT, SNOW, NORTHCOLD, STEPPE);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the northern sea under the coast range, its shore where the mine's comes over the west
// edge and on to the summit's ----
const SHORE: XY[] = smooth([[5420, A + 400], [5420, 6676], [5330, 5200], [5420, 3700], [5300, 2200], [5400, 700], [5280, -800], [5380, -2300], [5300, -3800], [5380, -5300], [5320, -6676], [5320, -A - 400]], 4);
const SEA: XY[] = [...SHORE, [A + 400, -A - 400], [A + 400, A + 400]];

// ---- the levels ----
// the coast range (1100, no way up) along the north, its north face in the sea; the ridge (450)
// through the middle with the crest (850) along it, the crest's spur jutting north over the north
// valley; pinnacles (scenery) standing out of the valleys
const N_WALL: XY[] = [[4380, A], [4300, 5200], [4420, 3800], [4280, 2300], [4450, 900], [4300, -600], [4460, -2000], [4300, -3500], [4420, -5000], [4350, -A], [5150, -A], [5180, -5300], [5100, -3800], [5180, -2300], [5080, -800], [5200, 700], [5100, 2200], [5220, 3700], [5130, 5200], [5220, A]];
const RIDGE: XY[] = [[-150, 3750], [800, 3600], [1450, 2950], [1800, 1950], [1850, 900], [1700, -150], [1950, -1150], [1800, -2200], [1500, -3300], [1650, -4500], [1500, -5500], [1550, -6676], [1550, -A], [-1550, -A], [-1550, -6676], [-1500, -5500], [-1650, -4400], [-1500, -3250], [-1800, -2400], [-1650, -1300], [-1850, -200], [-1700, 900], [-1800, 2000], [-1450, 2900], [-850, 3500]];
const CREST: XY[] = [[600, 2000], [1050, 1550], [1200, 800], [1050, 350], [1600, 150], [2350, 120], [2750, -200], [2600, -650], [1900, -800], [800, -950], [500, -1300], [1050, -1500], [1250, -1900], [1050, -2250], [500, -2450], [-150, -2450], [-950, -2200], [-1150, -1850], [-850, -1450], [-380, -1300], [-500, -900], [-750, -300], [-800, 500], [-650, 1300], [-250, 1950]];
const SPIRES: [XY, number, number, number][] = [
  [[3450, -1750], 430, 1450, 41], [[3450, 2950], 380, 1200, 42], [[-4350, 3000], 440, 1250, 43], [[-4550, -1900], 400, 1100, 44],
];
// ramps: up from the west basin onto the shoulder, the shoulder onto the crest; the crest down to
// the east shoulder (the ridge runs on over the edge there); the south valley up onto it
const R1 = rampOff([800, 3600], [1450, 2950], [0, 2500], 1300, 460);
const R2 = rampOff([-250, 1950], [600, 2000], [175, 1000], 1200, 440);
const R3 = rampOff([500, -2450], [-150, -2450], [175, -1800], 1150, 440);
const R4 = rampOff([-1500, -3250], [-1650, -4400], [0, -3800], 1250, 460);

// ---- the cleft across the crest, its bridge ----
const GORGE: XY[] = smooth([[-760, -1900], [-300, -1850], [250, -1900], [820, -1860]], 4);
const GW = 600;

// ---- the places ----
const W_EXIT: XY = [0, 5150], E_EXIT: XY = [0, -5150];
const GATE: XY = [1350, 4400];
const PAVILION: XY = [-650, 3050];
const PILLAR: XY = [-250, 700];
const NEST: XY = [2250, -330];
const TARN_C: XY = [3050, 1300];
const TARN = blobPoly(TARN_C, 600, 900, 61, 0.1, 30);
const CAMP: XY = [-3700, 350];

// the track leading to a ramp's foot, up it, and on past its top (or down it, `down`)
const climb = (r: { top: XY; bottom: XY }, inn = 400, out = 350): XY[] => [beyond(r.top, r.bottom, inn), r.bottom, r.top, beyond(r.bottom, r.top, out)];
const descend = (r: { top: XY; bottom: XY }, inn = 350, out = 400): XY[] => [beyond(r.bottom, r.top, inn), r.top, r.bottom, beyond(r.top, r.bottom, out)];

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(506, {
    hills: [
      { x: 2900, y: 3900, r: 900, h: 80 }, { x: -3000, y: 4300, r: 1100, h: 110 }, { x: -4300, y: -800, r: 1200, h: 120 }, { x: -2600, y: -4300, r: 900, h: 90 },
      { x: 3000, y: -3600, r: 800, h: 70 }, { x: 3300, y: 300, r: 600, h: -50 }, { x: -2900, y: 1500, r: 700, h: -60 }, { x: 1700, y: 5000, r: 700, h: 60 },
      { x: -7600, y: 0, r: 2800, h: 280 }, { x: 0, y: 7700, r: 2600, h: 220 }, { x: 0, y: -7700, r: 2400, h: 200 },
    ],
    plateaus: [
      { poly: dense(RIDGE, 500), h: 450, ramps: [R1, R4] },
      { poly: dense(CREST, 500), h: 850, ramps: [R2, R3] },
      { poly: dense(N_WALL, 700), h: 1100 },
      ...SPIRES.map(([c, r, h, s]) => ({ poly: dense(blobPoly(c, r, r * 0.85, s, 0.18, 18), 450), h })),
    ],
    rock: "Skypeaks_CliffPeak",
  });
  const { put, rnd } = f;

  // ---- the tracks ----
  // the ridge road: in from the mine, through the gate, up onto the shoulder and the crest,
  // along the crest over the bridge, down to the east shoulder and the east basin
  const BR = nearestOn(GORGE, [100, -1880]);
  const bax: XY = [0, -1]; // the bridge runs east along the road
  const ROAD: XY[] = [
    ...smooth([[0, 9400], [0, 6676], W_EXIT, [0, 4500], [350, 4250], [900, 4300], GATE, [2000, 4560], climb(R1)[0]]), ...climb(R1).slice(1),
    ...smooth([climb(R1)[3], [700, 3420], [300, 3560], climb(R2, 380)[0]]), ...climb(R2, 380).slice(1),
    ...smooth([climb(R2)[3], [150, 1200], [80, 400], [60, -200], [60, -800], [70, -1150], [BR.at[0], BR.at[1] + 760]]),
    [BR.at[0], BR.at[1] - 760],
    ...smooth([[BR.at[0], BR.at[1] - 900], [140, -2150], descend(R3)[0]]), ...descend(R3, 350, 250).slice(1),
    ...smooth([descend(R3, 350, 250)[3], [60, -4300], E_EXIT, [0, -6676], [0, -9400]]),
  ];
  // out along the spur to the nest
  const SPUR: XY[] = smooth([[60, -200], [700, -420], [1400, -480], [NEST[0] - 450, NEST[1] - 60]]);
  // round by the south valley, past the giants' camp, and up onto the ridge's east shoulder
  const SOUTH: XY[] = [...smooth([[0, 4500], [-700, 4350], [-1500, 4500], [-2400, 4000], [-2700, 3100], [-3300, 2300], [-3000, 1500], [-2950, 900], [CAMP[0] + 800, CAMP[1] - 200], [-3200, -900], [-2600, -1600], [-2900, -2400], [-3500, -3000], climb(R4, 380)[0]]), ...climb(R4, 380, 300).slice(1), ...smooth([climb(R4, 380, 300)[3], [-800, -4150], [60, -4300]])];
  // into the north valley to the frozen tarn and under the rocs' pinnacle
  const NORTH: XY[] = smooth([[2000, 4560], [2900, 3600], [3000, 2400], [2550, 1600], [2500, 600], [2750, -400], [2950, -1100], [2800, -2300]]);
  const TRACKS = [ROAD, SPUR, SOUTH, NORTH];
  const roads = TRACKS.map((t, i) => band(t, i === 0 ? 460 : 380));

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const gorgeHole = band(GORGE, GW + 50);
  const ROAD_TINT: [number, number, number] = [0.74, 0.76, 0.86];
  const ground = f.ground({ area, roads, plazas: [], water: [SEA, gorgeHole, TARN], base: "snow", road: ROAD_TINT });
  const nearRoad = (x: number, y: number) => TRACKS.some((t) => toLine([x, y], t) < 420);

  // ---- the wind scours the crest and the shoulders down to the rock in long streaks: a second
  // ground of bare stone a hair over the snow, cut away everywhere but those streaks ----
  const streaks: XY[][] = [];
  {
    const r2 = seeded(5061);
    for (let x = -1700; x < 2700; x += 330)
      for (let y = -6000; y < 3700; y += 520) {
        const cx = x + (r2() - 0.5) * 260, cy = y + (r2() - 0.5) * 400, hgt = f.h(cx, cy);
        if (hgt < 440 || r2() < (hgt > 840 ? 0.3 : 0.7) || !f.level(cx, cy, hgt > 840 ? 180 : 260) || nearRoad(cx, cy)) continue;
        const k = 0.55 + r2() * 0.5;
        streaks.push(blobPoly([cx, cy], 110 * k, 320 * k, 5070 + streaks.length, 0.3, 14));
      }
  }
  const BOX: XY[] = [[-2000, -A], [2900, -A], [2900, 4000], [-2000, 4000]];
  let OUT: XY[] = [...BOX, BOX[0]];
  for (const st of streaks) OUT = [...OUT, ...[...st].reverse(), [...st].reverse()[0], BOX[0]];
  const scoured = f.ground({ area: { x0: -2000, y0: -A, x1: 2900, y1: 4000 }, roads, plazas: [], water: [OUT, gorgeHole], base: "rock", road: ROAD_TINT, tint: "#d3d9e1" });
  scoured.mesh.position.y += 3;
  scoured.mesh.renderOrder = 1;

  // ---- the ways out ----
  f.exit("old_royal_mine", W_EXIT, [0, 4450]);
  f.exit("dragon_summit", E_EXIT, [0, -4450]);

  // ---- the sea: dark cold water out to the edge, floes on it, the shore closed ----
  const sea = sheet(SEA, -14, "Skypeaks_SeaNorth"); // (over the sea only: the hollows inland stay dry)
  f.blockBand(SHORE.filter(([x, y]) => Math.abs(x) < A && Math.abs(y) < R + 1500).map(([x, y]) => [x - 60, y] as XY), 220, { kind: "sea" });
  for (const [x, y, h, s] of [[6200, 3600, 30, 1], [7400, -1200, 150, 1.2], [6300, -4300, 250, 0.9], [7600, 4800, 80, 1.1], [6700, 900, 200, 0.8]] as number[][])
    put("northcold:sea_stack", [x, y], h, { z: -14, s, solid: "none" });
  for (const [x, y, h, s] of [[5800, 1800, 20, 0.9], [6000, -2600, 130, 1], [5700, 5600, 240, 0.8], [7000, 2600, 60, 1.1], [5800, -5600, 300, 0.9]] as number[][])
    put("northcold:drift_floes", [x, y], h, { z: -14, s, solid: "none" });

  // ---- the frozen tarn in the north valley: walked on, pale at its edge, clear dark ice in it ----
  const tarnEdge = flatSheet(blobPoly(TARN_C, 660, 960, 61, 0.1, 30), -4, material("Snowland_LakeIce"));
  const tarnMid = flatSheet(blobPoly([TARN_C[0] - 40, TARN_C[1] + 60], 400, 620, 63, 0.14, 26), -3, material("Snowland_IceDeep"));

  // ---- the cleft: its walls going down out of sight, darkness and mist below, the bridge ----
  const abyss = sheet(band(GORGE, GW + 80), 850 - 640, "Skypeaks_Dark");
  const sunk = { solid: "none" as const, z: -CHASM_DEPTH };
  {
    const cum = [0];
    for (let i = 1; i < GORGE.length; i++) cum.push(cum[i - 1] + Math.hypot(GORGE[i][0] - GORGE[i - 1][0], GORGE[i][1] - GORGE[i - 1][1]));
    const L = cum[cum.length - 1];
    // the bridge's place along the cleft; the walls from its deck's edges outward each way
    let sB = 0, bd = Infinity;
    for (let i = 1; i < GORGE.length; i++) {
      const [ax, ay] = GORGE[i - 1], [bx, by] = GORGE[i], l = cum[i] - cum[i - 1] || 1;
      const t = Math.max(0, Math.min(1, ((BR.at[0] - ax) * (bx - ax) + (BR.at[1] - ay) * (by - ay)) / (l * l)));
      const d = Math.hypot(ax + (bx - ax) * t - BR.at[0], ay + (by - ay) * t - BR.at[1]);
      if (d < bd) [bd, sB] = [d, cum[i - 1] + t * l];
    }
    // (a wall's lip stones lie within 2.7 m of its middle: 4.6 m off keeps them clear of the deck)
    const along: number[] = [];
    for (let c = sB + 460; ; c = Math.min(c + 500, L - 300)) {
      along.push(c);
      if (c + 330 >= L - 30) break;
    }
    for (let c = sB - 460; ; c = Math.max(c - 500, 300)) {
      along.push(c);
      if (c - 330 <= 30) break;
    }
    for (const s of along) {
      let i = 1;
      while (i < GORGE.length - 1 && cum[i] < s) i++;
      const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1), a = GORGE[i - 1], b = GORGE[i];
      const p: XY = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const n: XY = [-(b[1] - a[1]) / dl, (b[0] - a[0]) / dl];
      for (const sg of [-1, 1]) put("westmount:chasm_wall", [p[0] + n[0] * sg * GW / 2, p[1] + n[1] * sg * GW / 2], towards(-n[0] * sg, -n[1] * sg), sunk);
    }
    const n = GORGE.length, e0 = GORGE[0], e1 = GORGE[n - 1];
    const d0 = [GORGE[1][0] - e0[0], GORGE[1][1] - e0[1]], d1 = [e1[0] - GORGE[n - 2][0], e1[1] - GORGE[n - 2][1]];
    const l0 = Math.hypot(d0[0], d0[1]), l1 = Math.hypot(d1[0], d1[1]);
    put("westmount:chasm_wall", [e0[0] - (d0[0] / l0) * 30, e0[1] - (d0[1] / l0) * 30], towards(d0[0], d0[1]), sunk);
    put("westmount:chasm_wall", [e1[0] + (d1[0] / l1) * 30, e1[1] + (d1[1] / l1) * 30], towards(-d1[0], -d1[1]), sunk);
    const ends = [beyond(GORGE[1], e0, 300), ...GORGE, beyond(GORGE[n - 2], e1, 300)];
    for (const part of pieces(ends, [BR.at], 220)) f.blockBand(part, GW + 120, { step: 200, kind: "chasm" });
  }
  put("skypeaks:chasm_bridge", BR.at, runAlong(bax[0], bax[1]), { solid: CHASM_BRIDGE_SOLIDS });
  for (const [dx, h, s] of [[-200, 30, 0.5], [250, 120, 0.45]] as number[][]) put("skypeaks:cloud_wisp", [BR.at[0] + dx, BR.at[1]], h, { z: -560, s, solid: "none" });

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const deep = (x: number, y: number, d: number) => toLine([x, y], GORGE) < GW / 2 + 140 + d;
  const free = (x: number, y: number, r: number, gap = 0) =>
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    !deep(x, y, r) && f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    take(at[0], at[1], r);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });
  const inBox = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, o: (s: number) => Parameters<typeof put>[3] = () => ({}), where = inBox) => {
    for (let i = 0, made = 0; i < n * 12 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!where(x, y) || nearTrack(x, y, rad + 200) || !free(x, y, rad, 40)) continue;
      const s = 0.8 + rnd() * 0.4;
      put(ref, [x, y], rnd() * 360, { s, ...o(s) });
      take(x, y, rad * s);
      made++;
    }
  };
  for (const t of TRACKS) for (let i = 0; i < t.length; i += 2) take(t[i][0], t[i][1], 180);
  take(BR.at[0], BR.at[1], 900);

  // ---- the ways out: the trail signs, cairns ----
  prop("snowland:trail_sign", [-380, 4800], 90, 80, ring(30, "post"));
  prop("snowland:cairn", [420, 5000], 0, 70, ring(45));
  prop("snowland:trail_sign", [-420, -4780], -90, 80, ring(30, "post"));
  prop("snowland:cairn", [430, -4950], 0, 70, ring(45));
  // and round the arrivals, close by the road
  for (const [ref, at, s] of [
    ["snowland:snow_drift", [-480, 4300], 0.7], ["common:rock_small", [430, 4620], 1], ["snowland:dry_grass", [-420, 4050], 1], ["skypeaks:crag_cluster", [-620, 4650], 0.4],
    ["snowland:dry_grass", [380, 3950], 0.9], ["snowland:snow_drift", [450, -4500], 0.6], ["common:rock_small", [-420, -4300], 1], ["skypeaks:peak_boulder", [-650, -4600], 0.4],
  ] as [string, XY, number][]) if (free(at[0], at[1], 60)) prop(ref, at, rnd() * 360, 90, { s, solid: ref.includes("crag") || ref.includes("boulder") ? ring(80 * s + 30).solid : "none" });

  // ---- the gate where the ridge road begins, braziers at it ----
  const gd = nearestOn(ROAD, GATE);
  prop("skypeaks:ridge_gate", gd.at, runAlong(gd.dir[0], gd.dir[1]), 650, { solid: RIDGE_GATE_SOLIDS });
  prop("snowland:cairn", [gd.at[0] - 520, gd.at[1] + 560], 0, 70, ring(45));

  // ---- the shoulder: the travellers' shelter looking back over the basin, a wind-bent pine ----
  prop("skypeaks:rest_pavilion", PAVILION, towards(0.2, 1), 520, { solid: PAVILION_SOLIDS });
  prop("snowland:log_pile", [PAVILION[0] + 420, PAVILION[1] - 360], 30, 110, ring(70, "box"));
  prop("westmount:wind_pine", [PAVILION[0] - 520, PAVILION[1] - 520], 160, 200, { s: 0.75, ...ring(40, "tree") });
  prop("westmount:wind_pine", [900, 2600], 210, 200, { s: 0.7, ...ring(40, "tree") });
  prop("skypeaks:frost_tor", [-1150, 2150], 40, 260, { s: 0.75, ...ring(170) });

  // ---- the crest: the boundary pillar, chains along the narrowest of it, the nest on the spur ----
  prop("skypeaks:boundary_pillar", PILLAR, towards(1, -0.4), 260, { solid: PILLAR_SOLIDS });
  prop("snowland:cairn", [PILLAR[0] + 500, PILLAR[1] + 420], 0, 70, ring(45));
  // chains along both edges of the spine where it narrows to the bridge
  for (const side of [-1, 1]) {
    for (let y = -1000; y > -1620; y -= 400) {
      const x0 = side < 0 ? -330 : 470, at: XY = [x0 + side * 20 * Math.sin(y / 300), y];
      if (f.level(at[0], at[1], 40)) put("skypeaks:cliff_rail", at, 0, { solid: [{ kind: "rail", x: 0, y: 0, w: 30, d: 400, rot: 0 }] });
    }
  }
  prop("skypeaks:roc_nest", NEST, 20, 330, { s: 0.8, solid: NEST_ROC_SOLIDS });
  for (const [dx, dy, h] of [[-350, 420, 30], [300, -380, 200], [-420, -300, 120]] as number[][]) if (free(NEST[0] + dx, NEST[1] + dy, 60)) prop("skypeaks:crag_cluster", [NEST[0] + dx, NEST[1] + dy], h, 200, { s: 0.55, ...ring(110) });
  // and a second nest on the pinnacle beside the spur, out of reach
  put("skypeaks:roc_nest", SPIRES[0][0], 200, { s: 0.6, solid: "none" });
  put("skypeaks:frost_tor", [SPIRES[2][0][0] + 60, SPIRES[2][0][1] - 40], 70, { s: 0.7, solid: "none" });
  put("skypeaks:crag_cluster", SPIRES[1][0], 30, { s: 0.7, solid: "none" });
  put("skypeaks:frost_tor", SPIRES[3][0], 140, { s: 0.65, solid: "none" });
  // the bridge's ends: cairns
  for (const k of [-1, 1]) {
    const at: XY = [BR.at[0] + 380, BR.at[1] + k * 900];
    if (free(at[0], at[1], 60)) prop("snowland:cairn", at, rnd() * 90, 70, ring(45));
  }
  // rocks along the crest and the shoulders, cornices on the windward edges
  const CREST_ROCKS: [string, XY, number, number][] = [
    ["skypeaks:frost_tor", [700, 1000], 0.6, 170], ["skypeaks:crag_cluster", [-500, -100], 0.6, 140], ["skypeaks:peak_boulder", [600, 300], 0.55, 140],
    ["skypeaks:crag_cluster", [-450, 1500], 0.55, 130], ["skypeaks:peak_boulder", [-400, -2150], 0.5, 120], ["skypeaks:crag_cluster", [500, -2250], 0.5, 120],
    ["skypeaks:frost_tor", [1300, -2700], 0.6, 170], ["skypeaks:peak_boulder", [-1100, -2700], 0.6, 140], ["skypeaks:crag_cluster", [-1300, 600], 0.6, 140],
    ["skypeaks:peak_boulder", [1350, 1600], 0.6, 140], ["skypeaks:frost_tor", [-1300, -900], 0.6, 170], ["skypeaks:crag_cluster", [1400, -1700], 0.55, 130],
    ["skypeaks:peak_boulder", [400, -3500], 0.55, 130],
  ];
  for (const [id, at, s, r] of CREST_ROCKS) if (free(at[0], at[1], r)) prop(id, at, rnd() * 360, r + 40, { s, ...ring(r) });
  for (const [at, h, s] of [[[-1350, 1200], 80, 0.8], [[1450, 400], 260, 0.8], [[-1300, -2000], 100, 0.7], [[1500, -2400], 250, 0.75], [[-200, 2600], 100, 0.7], [[1150, -3400], 230, 0.7]] as [XY, number, number][])
    if (free(at[0], at[1], 200)) prop("skypeaks:snow_cornice", at, h, 260, { s, solid: "none" });
  for (const at of [[-1300, 2400], [1500, 2000], [-1400, -1600], [1500, -900], [-900, -3200]] as XY[]) if (free(at[0], at[1], 100)) prop("westmount:wind_pine", at, rnd() * 360, 200, { s: 0.6 + rnd() * 0.15, ...ring(36, "tree") });

  // ---- the east shoulder: the kingdom's last watch post before the dragon's land, in ruin ----
  prop("snowland:watch_ruin", [800, -4200], 100, 420, { s: 0.9, solid: [{ kind: "tower", x: 0, y: 0, r: 260 }] });
  prop("snowland:cairn", [-500, -4700], 0, 70, ring(45));
  prop("skypeaks:crag_cluster", [-900, -3900], 50, 200, { s: 0.6, ...ring(120) });
  prop("skypeaks:peak_boulder", [1100, -3600], 160, 200, { s: 0.6, ...ring(120) });
  prop("westmount:wind_pine", [1150, -4800], 230, 200, { s: 0.7, ...ring(36, "tree") });
  if (free(-1050, -5000, 200)) prop("skypeaks:snow_cornice", [-1050, -5000], 90, 260, { s: 0.7, solid: "none" });

  // ---- the north valley: the frozen tarn, the giants' prints of boulders, drifts ----
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2, at: XY = [TARN_C[0] + Math.cos(a) * 760, TARN_C[1] + Math.sin(a) * 1060];
    if (nearTrack(at[0], at[1], 300) || !free(at[0], at[1], 70)) continue;
    put(k % 3 ? "northcold:frozen_reeds" : "northcold:iced_rocks", at, rnd() * 360, { s: 0.6 + rnd() * 0.3, solid: k % 3 ? "none" : [{ kind: "rock", x: 0, y: 0, r: 110 }] });
  }
  put("snowland:ice_hole", [TARN_C[0] + 200, TARN_C[1] - 250], 30, { solid: "none" });

  // ---- the south valley: the frost giants' camp ----
  prop("snowland:cold_campfire", CAMP, 30, 260, { s: 1.8, ...ring(120) });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3, at: XY = [CAMP[0] + Math.cos(a) * 620, CAMP[1] + Math.sin(a) * 620];
    if (nearTrack(at[0], at[1], 280)) continue;
    prop(k % 2 ? "skypeaks:peak_boulder" : "skypeaks:crag_cluster", at, (a * 180) / Math.PI, 220, { s: 0.55, ...ring(140) });
  }
  prop("snowland:fallen_log", [CAMP[0] - 350, CAMP[1] - 750], 70, 200, { s: 1.4, solid: [{ kind: "log", x: 0, y: 0, w: 120, d: 520, rot: 0 }] });
  prop("steppe:bones", [CAMP[0] + 450, CAMP[1] - 1200], 140, 140, { s: 1.6, solid: "none" });
  prop("steppe:bones", [CAMP[0] - 750, CAMP[1] + 100], 20, 140, { s: 1.4, solid: "none" });
  prop("snowland:snow_drift", [CAMP[0] - 900, CAMP[1] + 650], 60, 220);

  // ---- fallen rock at the cliffs' feet, boulders over the valleys ----
  for (const poly of [RIDGE, N_WALL]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (inPoly(poly, mx + nx * 50, my + ny * 50)) [nx, ny] = [-nx, -ny];
      for (let t = 300; t < L - 200; t += 700) {
        const out = 330 + rnd() * 160, x = a[0] + ((b[0] - a[0]) * t) / L + nx * out, y = a[1] + ((b[1] - a[1]) * t) / L + ny * out;
        if (rnd() < 0.45 || !inBox(x, y) || nearTrack(x, y, 260) || !free(x, y, 110, 60)) continue;
        const s = 0.5 + rnd() * 0.3;
        prop(rnd() < 0.5 ? "skypeaks:crag_cluster" : "skypeaks:peak_boulder", [x, y], rnd() * 360, 170 * s, { s, solid: [{ kind: "rock", x: 0, y: 0, r: 130 * s + 20 }] });
      }
    }
  }
  scatter("skypeaks:peak_boulder", [3000, 0], 2600, 6, 170, (s) => ({ s: s * 0.7, ...ring(120 * s) }), (x, y) => inBox(x, y) && x > 1900);
  scatter("skypeaks:frost_tor", [3100, -500], 2600, 3, 220, (s) => ({ s: s * 0.65, ...ring(150 * s) }), (x, y) => inBox(x, y) && x > 2000);
  scatter("skypeaks:peak_boulder", [-3500, 0], 3000, 7, 170, (s) => ({ s: s * 0.7, ...ring(120 * s) }), (x, y) => inBox(x, y) && x < -1900);
  scatter("skypeaks:crag_cluster", [-3500, 0], 3000, 6, 170, (s) => ({ s: s * 0.65, ...ring(120 * s) }), (x, y) => inBox(x, y) && x < -1900);
  scatter("snowland:snow_drift", [3000, 0], 2500, 6, 230, () => ({}), (x, y) => inBox(x, y) && x > 1900);
  scatter("snowland:snow_drift", [-3500, 0], 3000, 7, 230, () => ({}), (x, y) => inBox(x, y) && x < -1900);
  scatter("skypeaks:snow_cornice", [3100, 0], 2500, 4, 260, () => ({ solid: "none" }), (x, y) => inBox(x, y) && x > 2000);
  scatter("snowland:dead_branches", [-3000, 0], 3500, 5, 120, () => ({ solid: "none" }));
  scatter("snowland:frost_shrub", [-3200, 0], 3400, 8, 90, () => ({ solid: [{ kind: "bush", x: 0, y: 0, r: 50 }] }), (x, y) => inBox(x, y) && x < -1900);
  scatter("snowland:snowy_stump", [-3600, 0], 3000, 5, 80, () => ({ solid: [{ kind: "post", x: 0, y: 0, r: 40 }] }), (x, y) => inBox(x, y) && x < -2200);
  scatter("snowland:fallen_log", [-3800, 0], 3000, 3, 220, () => ({ solid: [{ kind: "log", x: 0, y: 0, w: 90, d: 380, rot: 0 }] }), (x, y) => inBox(x, y) && x < -2400);
  // grass flattened under the snow and dry tufts in the valleys, stones over the ridge
  scatter("northcold:flattened_grass", [-3300, 0], 3200, 18, 170, () => ({ solid: "none" }), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  scatter("northcold:flattened_grass", [3000, 300], 2600, 10, 170, () => ({ solid: "none" }), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  scatter("snowland:dry_grass", [-3000, 0], 3500, 14, 90, () => ({ solid: "none" }), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  scatter("snowland:dry_grass", [3000, 0], 2600, 8, 90, () => ({ solid: "none" }), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  scatter("snowland:flat_slabs", [0, -500], 2400, 8, 150, (s) => ring(110 * s), (x, y) => inBox(x, y) && f.h(x, y) > 400);
  scatter("common:rock_small", [0, -500], 2400, 16, 60, () => ({ solid: "none" }), (x, y) => inBox(x, y) && f.h(x, y) > 400);
  scatter("snowland:flat_slabs", [0, 0], 5000, 6, 150, (s) => ring(110 * s), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  // the basins: a few rocks either side of the road
  for (const at of [[-1300, 4700], [1100, 5100], [2700, 4900], [-2400, -4800], [1200, -4700], [2400, -4500]] as XY[]) if (free(at[0], at[1], 140)) prop("skypeaks:peak_boulder", at, rnd() * 360, 160, { s: 0.6, ...ring(110) });

  // ---- the pines: in groves over the valleys, thickening south toward the hunting forest and
  // west toward the mine's woods, few on the ridge ----
  const grove = (c: XY, r: number, n: number, kinds = ["SnowPine", "SnowPineSmall", "SnowPineSmall", "PineSmall"]) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inBox(x, y) || nearTrack(x, y, 330) || !free(x, y, 160, 160)) continue;
      put(`flora:${kinds[Math.floor(rnd() * kinds.length)]}`, [x, y], rnd() * 360, { s: 0.7 + rnd() * 0.35 });
      take(x, y, 160);
      made++;
    }
  };
  for (const [c, r, n] of [
    [[-4600, 4300], 800, 7], [[-4700, 1800], 800, 7], [[-4600, -900], 800, 7], [[-4700, -3500], 800, 7], [[-3200, -4700], 700, 5],
    [[-2600, 2600], 600, 4], [[-2400, -1600], 600, 4], [[-3900, 3500], 500, 4], [[-4000, -2000], 500, 4], [[-1800, 4800], 600, 5],
    [[1800, 5000], 500, 3], [[3500, 4600], 600, 4], [[3400, 600], 400, 2], [[3800, -2800], 500, 3], [[2500, -4600], 600, 4], [[-1800, -4700], 500, 3],
  ] as [XY, number, number][]) grove(c, r, n);

  for (let y = -4800; y <= 4800; y += 900) grove([-4900, y], 650, 5);
  for (let x = -4200; x <= 3800; x += 900) if (Math.abs(x) > 600) grove([x, 5000], 550, 4);
  for (let x = -4200; x <= 3800; x += 1100) if (x < -1900 || x > 1900) grove([x, -5000], 500, 3);
  for (let y = -4600; y <= 4600; y += 800) grove([-4300, y], 500, 3);

  // ---- past the edges: pine woods to the south and west and east, bare rock on the coast range
  // and the pinnacles ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => [[0, 0], [300, 0], [-300, 0], [0, 300], [0, -300]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  f.woods(area, ["SnowPine", "SnowPine", "SnowPineSmall", "PineSmall"], (x, y) => inside(x, y) || onTrack(x, y) || f.h(x, y) > 350 || x > 4000, { count: 620, spacing: 360, tries: 12000 });
  f.woods(area, ["wind_pine"], (x, y) => onTrack(x, y) || f.h(x, y) < 1000 || inside(x, y) || inPoly(SEA, x, y), { count: 30, spacing: 700, tries: 2000, kit: "westmount" });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["crag_cluster", "peak_boulder", "frost_tor"], (x, y) => onTrack(x, y) || inside(x, y) || inPoly(SEA, x, y) || f.h(x, y) < 1000, { count: 40, spacing: 900, tries: 2000, kit: "skypeaks" });
  // mist lying in the valleys under the ridge
  for (const [at, h, s] of [[[2600, 2600], 30, 0.8], [[3000, -2900], 120, 0.9], [[-2700, -2600], 60, 0.9], [[-2400, 2100], 200, 0.8], [[3600, 4200], 10, 0.7], [[-4000, 600], 150, 0.8]] as [XY, number, number][])
    put("skypeaks:cloud_wisp", at, h, { s, solid: "none" });

  // ---- monsters: the rocs on the crest, the spur and the shoulders; the giants down in the
  // valleys under the cliffs ----
  const quiet = (x: number, y: number) => Math.hypot(x - PAVILION[0], y - PAVILION[1]) < 700 || Math.hypot(x - GATE[0], y - GATE[1]) < 800 || Math.hypot(x - PILLAR[0], y - PILLAR[1]) < 450 || inPoly(N_WALL, x, y);
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 760, keepOut: quiet, max: 52 });

  // ---- people ----
  const npcs: NpcSpec[] = [
    { id: "royal_peaks_warden", x: PAVILION[0] - 380, y: PAVILION[1] + 120, face: 300, name: "ตาเบรน", title: "ผู้เฝ้าศาลาพักสันเขาหลวง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "blue", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "ศาลานี้กษัตริย์องค์แรกสร้างไว้ให้คนเดินทางขึ้นไปยอดเขามังกรฟ้าได้พักหลบลม ข้าจุดไฟไว้ให้ทุกคืน",
        "บนสันเขาลมแรงจนคนปลิวได้ เดินให้ชิดกลางทางไว้ โซ่ตรงช่วงแคบนั่นกันคนตกเหวมาหลายรุ่นแล้ว",
        "นกรอคมันเห็นอะไรเคลื่อนไหวบนสันเขาเป็นต้องโฉบลงมา ส่วนยักษ์น้ำแข็งชอบนอนอยู่ใต้หน้าผา อย่าไปปลุกมัน",
      ] },
    { id: "royal_peaks_pilgrim", x: PILLAR[0] + 330, y: PILLAR[1] - 260, face: 160, name: "ซิสเตอร์อิลวา", title: "นักบวชผู้จาริกสู่ยอดเขา", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "amber", top: "top_priestess_white", bottom: "bottom_priestess_wine" },
      lines: [
        "เสาต้นนี้ปักไว้ตรงที่อาณาจักรเริ่มต้น เลยไปทางตะวันออกคือแผ่นดินของมังกรฟ้า ไม่ใช่ของมนุษย์",
        "ตำนานว่ามังกรฟ้าสวมมงกุฎให้กษัตริย์องค์แรกบนยอดเขานั้น ฉันจะไปภาวนาที่แท่นพิธีให้ได้สักครั้ง",
        "สะพานหินข้างหน้าสร้างข้ามเหวที่ฟ้าผ่าจนสันเขาแยก มองลงไปไม่เห็นก้นเหวเลยนะ",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [scoured.mesh, sea, tarnEdge, tarnMid, abyss],
    sky: "#a7b8cb",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 0, y: 4450 },
    npcs,
    labels: [
      { x: W_EXIT[0] - 250, y: W_EXIT[1], text: "ทางไปเหมืองหลวงเก่า", kind: "gate" },
      { x: E_EXIT[0] - 250, y: E_EXIT[1], text: "ทางไปยอดเขามังกรฟ้า", kind: "gate" },
      { x: gd.at[0] - 500, y: gd.at[1], text: "ประตูสันเขาหลวง", kind: "small" },
      { x: PAVILION[0] - 600, y: PAVILION[1], text: "ศาลาพักทางขึ้นเขา" },
      { x: PILLAR[0] - 500, y: PILLAR[1], text: "เสาหินหลักเขตอาณาจักร" },
      { x: NEST[0] - 550, y: NEST[1], text: "รังนกรอคยักษ์" },
      { x: BR.at[0] - 250, y: BR.at[1] + 850, text: "สะพานหินข้ามเหว" },
      { x: TARN_C[0], y: TARN_C[1] - 300, text: "ทะเลสาบน้ำแข็งเชิงผา", kind: "small" },
      { x: CAMP[0] + 600, y: CAMP[1], text: "ค่ายยักษ์น้ำแข็ง" },
      { x: 2600, y: 2900, text: "หุบหิมะเหนือ", kind: "small" },
      { x: -2700, y: -800, text: "หุบหิมะใต้", kind: "small" },
      { x: 100, y: -500, text: "สันเขาหลวง" },
    ],
  });
}

// นาขั้นบันได (the rice terraces), monsters Lv 74-86: the coast south of Suzhou, where a round hill
// stands over the western sea, stepped into terraces. The hill is cut into four curving steps that
// run right round it, each a flat terrace 2 m above the one below, its outer edge an earthen bank;
// on every step the paddies lie end to end round the curve, flooded, the young rice in rows, the
// bunds between them. Toward the valley on the north and east the steps are broad; toward the sea
// on the west and south they are narrower, the hill falling in tighter steps to a beach of sand
// and shingle, the open sea beyond it. A stairway of stone climbs straight up the north face from
// step to step; earth ramps go up on the north-west and north-east, and on the south-west down
// toward the beach. On the top step, under the crag that crowns the hill, the village's shrine to
// the earth god looks out over it all. Round the foot of the hill on the land side runs the stream,
// out of the woods past the east edge and into the sea in the north-west, and on it the bamboo
// water wheel lifts water into a channel that carries it over the lowest step to the second.
// Beyond the stream lies the valley: the road from Suzhou (north), the farmers' houses, the buffalo
// and their pen, paddies along the stream bank, bamboo; woods on the land past the east edge.
//
// The terraces are laid out round the hill's crown C: step k's edge lies at r_k(θ) from C, θ the
// bearing from C (0 north, 90 east), the steps sharing out what lies between the hill's foot
// (R0, by bearing) and the top step's edge.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   way out: north -> suzhou

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { material } from "./textures";
import { KIT as WEST, PADDY, STAIRS, WHEEL, CHANNEL_Z } from "./kits/westhills";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as SUZHOU } from "./kits/suzhou";
import { smooth, band, towards, inPoly, flatSheet } from "./kits/snowland";
import type { XY } from "./kits/snowland";
import { distToPath } from "./kits/frontier";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(WEST, PLAINS, SUZHOU);

const R = 5500; // the walkable box
const A = 9000; // the ground
const D = Math.PI / 180;

// ---- the coast: the water's edge from the north edge (where Suzhou's harbour shore comes down)
// south along the west, round the south-west and east along the south to the south-east corner;
// the sea beyond it ----
const SHORE: XY[] = smooth([
  [A + 400, 4000], [6000, 4030], [5000, 4200], [4000, 4450], [3000, 4700], [2000, 4800], [1000, 4850], [0, 4900], [-1000, 4880], [-2000, 4800],
  [-3000, 4650], [-3900, 4300], [-4500, 3600], [-4850, 2700], [-5000, 1600], [-5050, 400], [-5100, -800], [-5100, -2000], [-5150, -3100], [-5300, -4200],
  [-5650, -5200], [-6200, -6000], [-7200, -7000], [-A - 400, -A - 400],
], 2);
const SEA: XY[] = [...SHORE, [-A - 400, A + 400], [A + 400, A + 400]];

// ---- the terraces ----
const C: XY = [-800, 300];
const STEPS = 4, STEP_H = 200;
const at = (th: number, r: number): XY => [C[0] + Math.cos(th) * r, C[1] - Math.sin(th) * r];
const out = (th: number): XY => [Math.cos(th), -Math.sin(th)]; // away from C
// a value by bearing (degrees) from a table round the compass, eased between its entries
const byBearing = (table: [number, number][]) => (th: number): number => {
  const d = (((th / D) % 360) + 360) % 360;
  for (let i = 0; i + 1 < table.length; i++) {
    const [a, va] = table[i], [b, vb] = table[i + 1];
    if (d >= a && d <= b) {
      const t = (d - a) / (b - a);
      return va + (vb - va) * t * t * (3 - 2 * t);
    }
  }
  return table[0][1];
};
// the hill's foot (step 0's edge): broad toward the valley (north, east), drawn in toward the sea
// (south, west) so a beach is left below it
const FOOT = byBearing([[0, 3950], [30, 4050], [60, 4250], [90, 4300], [120, 4250], [150, 4000], [180, 3350], [210, 3700], [225, 3950], [240, 3900], [270, 3600], [300, 3650], [330, 3700], [360, 3950]]);
const R0 = (th: number) => FOOT(th) * (1 + 0.02 * Math.sin(3 * th + 1));
// the top step's edge: wider on the north, where the shrine stands
const TOP = byBearing([[0, 1300], [30, 1250], [60, 1050], [120, 950], [200, 900], [280, 950], [330, 1200], [360, 1300]]);
const rk = (th: number, k: number) => {
  const w = Array.from({ length: STEPS - 1 }, (_, j) => 1 + 0.1 * Math.sin(2.3 * th + 1.7 * j));
  const all = w.reduce((s, v) => s + v, 0), part = w.slice(0, k).reduce((s, v) => s + v, 0);
  return R0(th) - (R0(th) - TOP(th)) * (part / all);
};
// the stream round the foot of the hill on the land side (from the east, past the north-east, to
// the north-west), leaving it on the north-west as it runs down to the sea
const rs = (th: number) => {
  const d = ((((th / D) % 360) + 540) % 360) - 180; // (-180, 180]: the north-west negative
  return R0(th) + 900 + (d < 0 ? Math.min(1, -d / 45) ** 1.5 * 1500 : 0);
};
const TH_S0 = -62, TH_S1 = 108; // its ends, degrees

// where the ways up are: the stone stairway up the north face (every step), earth ramps either
// side of it and one on the south-west, down toward the beach (each short enough to leave room
// to walk on round the step it comes down onto)
const TH_STAIR = 10 * D, TH_NW = 332 * D, TH_NE = 62 * D, TH_SW = 218 * D;
const RAMPS: { th: number; ks: number[]; stairs: boolean }[] = [
  { th: TH_STAIR, ks: [0, 1, 2, 3], stairs: true },
  { th: TH_NW, ks: [0, 1], stairs: false },
  { th: TH_NE, ks: [1, 2], stairs: false },
  { th: TH_SW, ks: [0, 1], stairs: false },
];
type Ramp = { top: XY; bottom: XY; width: number; straight?: boolean };
function rampAt(th: number, k: number, stairs: boolean): Ramp {
  const top = at(th, rk(th, k)), e = 0.002, a = at(th - e, rk(th - e, k)), b = at(th + e, rk(th + e, k));
  let nx = -(b[1] - a[1]), ny = b[0] - a[0];
  const L = Math.hypot(nx, ny);
  nx /= L;
  ny /= L;
  if (nx * (top[0] - C[0]) + ny * (top[1] - C[1]) < 0) [nx, ny] = [-nx, -ny];
  const len = stairs ? STAIRS.run : 520;
  return { top, bottom: [top[0] + nx * len, top[1] + ny * len], width: stairs ? 440 : 420, ...(stairs ? { straight: true } : {}) };
}
// each step's outline: points every 3 degrees right round C, the ramps' tops among them
function stepPoly(k: number): XY[] {
  const ths: number[] = [];
  for (let d = 0; d < 360; d += 3) ths.push(d * D);
  for (const r of RAMPS) if (r.ks.includes(k) && !ths.some((t) => Math.abs(t - r.th) < 0.2 * D)) ths.push(r.th);
  ths.sort((a, b) => a - b);
  return ths.map((t) => at(t, rk(t, k)));
}
const STEP_POLYS = Array.from({ length: STEPS }, (_, k) => stepPoly(k));
const STEP_RAMPS = Array.from({ length: STEPS }, (_, k) => RAMPS.filter((r) => r.ks.includes(k)).map((r) => rampAt(r.th, k, r.stairs)));
// the crag that crowns the hill (scenery)
const CRAG: XY[] = Array.from({ length: 24 }, (_, i) => at((i / 24) * Math.PI * 2, 400 * (1 + 0.12 * Math.sin(i * 1.9))));

// a point d along a -> b
const along = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(305, {
    hills: [
      { x: 4600, y: -4400, r: 1300, h: 120 },
      { x: 2600, y: -4900, r: 900, h: 80 },
      { x: -3900, y: -4700, r: 900, h: 70 },
      // past the edge
      { x: 8200, y: -1500, r: 2600, h: 420 },
      { x: 7600, y: -7400, r: 3000, h: 460 },
      { x: 1500, y: -8200, r: 2600, h: 360 },
    ],
    plateaus: [
      ...STEP_POLYS.map((poly, k) => ({ poly, h: STEP_H * (k + 1), ramps: STEP_RAMPS[k] })),
      { poly: CRAG, h: STEP_H * STEPS + 500 },
    ],
    rock: "Westhills_TerraceBank",
  });
  const { put, rnd } = f;

  // ---- the stream: out of the woods past the east edge, round the hill, into the sea ----
  const STREAM: XY[] = [[-3200, -A - 400], [-3000, -7000], [-2700, -5600]];
  for (let d = TH_S1; d >= TH_S0; d -= 2) STREAM.push(at(d * D, rs(d * D)));
  const mouth = STREAM[STREAM.length - 1], mdir = out(TH_S0 * D);
  STREAM.push([mouth[0] + mdir[0] * 1500, mouth[1] + mdir[1] * 1500]);
  const STREAM_W = 520;

  // ---- tracks ----
  const N_EXIT: XY = [5150, -770];
  const stair0 = STEP_RAMPS[0].find((r) => r.straight)!;
  const nw0 = rampAt(TH_NW, 0, false);
  const BR_STAIR: XY = at(TH_STAIR, rs(TH_STAIR)), BR_NW: XY = at(TH_NW, rs(TH_NW));
  const MAIN = [...smooth([[7600, -830], N_EXIT, [4800, -720], at(TH_STAIR, rs(TH_STAIR) + 650)]), BR_STAIR, at(TH_STAIR, rs(TH_STAIR) - 560), along(stair0.bottom, stair0.top, -60)];
  const NW_WAY = [...smooth([[4850, -650], [5000, 600], [4850, 1900], at(TH_NW, rs(TH_NW) + 650)]), BR_NW, at(TH_NW, rs(TH_NW) - 560), along(nw0.bottom, nw0.top, -60)];
  // the village lane, off the road to the houses and the pen
  const HOUSES: { at: XY; th: number }[] = [{ at: at(24 * D, rs(24 * D) + 1050), th: 24 }, { at: at(36 * D, rs(36 * D) + 1050), th: 36 }, { at: at(48 * D, rs(48 * D) + 1050), th: 48 }];
  const PEN: XY = at(58 * D, rs(58 * D) + 1050);
  const LANE = smooth([[4750, -900], at(22 * D, rs(22 * D) + 1950), at(36 * D, rs(36 * D) + 2000), at(50 * D, rs(50 * D) + 1950), at(60 * D, rs(60 * D) + 1800)]);
  const roads = [band(MAIN, 470), band(NW_WAY, 380), band(LANE, 360)];
  const tracks = [MAIN, NW_WAY, LANE];

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ROAD: [number, number, number] = [0.86, 0.8, 0.72];
  const streamPoly = band(STREAM, STREAM_W);
  const atSea = (x: number, y: number) => inPoly(SEA, x, y);
  const shoreDist = (x: number, y: number) => distToPath(SHORE, x, y);
  const ground = f.ground({ area, roads, plazas: [], water: [streamPoly, SEA], road: ROAD });
  f.blockBand(STREAM.filter(([x, y]) => Math.abs(x) < R + 900 && Math.abs(y) < R + 900), STREAM_W - 60, { gaps: [BR_STAIR, BR_NW], gapR: 300 });

  // ---- the beach: a second ground of sand between the water's edge and a line 6 m inland; the sea
  // out to the edge, nobody walking into it ----
  const inland: XY[] = SHORE.map((p, i) => {
    const a = SHORE[Math.max(0, i - 1)], b = SHORE[Math.min(SHORE.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const L = Math.hypot(nx, ny) || 1;
    nx /= L;
    ny /= L;
    if (inPoly(SEA, p[0] + nx * 60, p[1] + ny * 60)) [nx, ny] = [-nx, -ny];
    return [p[0] + nx * 600, p[1] + ny * 600] as XY;
  });
  const LAND_IN: XY[] = [...inland, [A + 400, -A - 400]];
  const beach = f.ground({ area, roads, plazas: [], water: [SEA, LAND_IN, streamPoly], base: "sand", road: ROAD, tint: "#e8e0cc" });
  beach.mesh.position.y += 2;
  beach.mesh.renderOrder = 1;
  const seaward = SHORE.map((p, i) => {
    const q = inland[i], L = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1;
    return [p[0] + ((p[0] - q[0]) / L) * 180, p[1] + ((p[1] - q[1]) / L) * 180] as XY;
  });
  f.blockBand(seaward.filter(([x, y]) => Math.abs(x) < R + 900 && Math.abs(y) < R + 900), 360, { kind: "sea" });
  // (the stream's own water only as far as the sea, so it never shows through the sea's)
  const inSea = STREAM.findIndex(([x, y]) => x > 0 && inPoly(SEA, x, y));
  const streamSheet = flatSheet(band(STREAM.slice(0, inSea + 1), STREAM_W), -15, material("Westhills_Stream"));
  const seaSheet = flatSheet([...SHORE, [-30000, -30000], [-30000, 30000], [30000, 30000], [30000, 4000]], -13, material("WaterSea"));

  // ---- the way out ----
  f.exit("suzhou", N_EXIT, [4450, -760]);

  // ---- placing things: clear of tracks, water, cliffs and each other ----
  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number, gap = 0) =>
    Math.abs(x) < A - 200 && Math.abs(y) < A - 200 &&
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, p: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, p, h, o);
    take(p[0], p[1], r);
  };
  const disc = (r: number, kind = "post", x = 0, y = 0): SolidSpec => ({ kind, x, y, r });
  const onTrack = (x: number, y: number, m = 0) => tracks.some((t) => distToPath(t, x, y) < 230 + m);
  const allRamps = STEP_RAMPS.flat();
  const nearRamp = (x: number, y: number, m = 200) => allRamps.some((r) => distToPath([along(r.top, r.bottom, -250), along(r.bottom, r.top, -250)], x, y) < r.width / 2 + m);
  const onBeach = (x: number, y: number, m = 0) => atSea(x, y) || shoreDist(x, y) < 600 + m;
  // the heading that turns a piece's front (-X) away from C at bearing th, its Y along the terrace
  const facingOut = (th: number) => 180 - th / D;
  // the paddies laid so far: middle, half their length (for nearness), the way their X runs, scale
  const paddies: [number, number, number, number, number][] = [];
  const inPaddy = (x: number, y: number, m = 0) => paddies.some(([px, py, r]) => Math.hypot(px - x, py - y) < r * 1.25 + m);
  // whether a paddy at p (its X along the bearing th, scale s) would lie over one laid already
  const overlaps = (p: XY, th: number, s: number) => {
    const ux = Math.cos(th), uy = -Math.sin(th);
    return paddies.some(([px, py, , , ps]) => {
      const dx = px - p[0], dy = py - p[1], a = Math.abs(dx * ux + dy * uy), b = Math.abs(-dx * uy + dy * ux);
      return a < (PADDY.x / 2) * (s + ps) * 0.97 && b < (PADDY.y / 2) * (s + ps) * 0.97;
    });
  };

  // ---- the way out: signposts ----
  prop("plains:signpost", [4800, -170], 180, 90, { solid: [disc(25)] });
  prop("plains:signpost", [4500, -1250], 140, 90, { solid: [disc(25)] });

  // ---- the stone stairway: steps on every straight ramp, from the stream to the top ----
  for (const rr of allRamps) {
    if (!rr.straight) continue;
    const h = (Math.atan2(rr.top[1] - rr.bottom[1], rr.top[0] - rr.bottom[0]) * 180) / Math.PI;
    put("westhills:terrace_stairs", [(rr.top[0] + rr.bottom[0]) / 2, (rr.top[1] + rr.bottom[1]) / 2], h, { solid: "none" });
    take((rr.top[0] + rr.bottom[0]) / 2, (rr.top[1] + rr.bottom[1]) / 2, 320);
  }
  // the bridges over the stream
  for (const [p, th] of [[BR_STAIR, TH_STAIR], [BR_NW, TH_NW]] as [XY, number][]) {
    put("plains:wood_bridge", p, -th / D, { solid: [{ kind: "rail", x: 0, y: -190, w: 940, d: 26, rot: 0 }, { kind: "rail", x: 0, y: 190, w: 940, d: 26, rot: 0 }] });
    take(p[0], p[1], 520);
  }

  // ---- the shrine on the top step, under the crag; its old tree, cherries ----
  const SHRINE = at(TH_STAIR, rk(TH_STAIR, STEPS - 1) - 380);
  prop("westhills:village_shrine", SHRINE, facingOut(TH_STAIR), 360, { solid: [{ kind: "shrine", x: 30, y: 0, w: 330, d: 300, rot: 0 }, disc(30, "post", -240, 0)] });
  // (the old tree stands west of it, so it never hides the shrine from below)
  prop("flora:BigOak", at(-34 * D, rk(-34 * D, STEPS - 1) - 330), rnd() * 360, 260, { s: 1.05 });
  for (const dth of [-14, 26, 40]) {
    const p = at(TH_STAIR + dth * D, rk(TH_STAIR + dth * D, STEPS - 1) - 320);
    if (free(p[0], p[1], 150)) prop("flora:Cherry", p, rnd() * 360, 200, { s: 0.85 });
  }

  // ---- the water wheel on the stream and its channel up over the lowest step ----
  const TH_W = 30 * D, wr = rs(TH_W), WPOS = at(TH_W, wr);
  // its X along the stream, its +Y (the trough) toward C
  const wheelH = 90 - TH_W / D;
  put("westhills:bamboo_waterwheel", WPOS, wheelH, { solid: [disc(60, "post", 0, -130), disc(60, "post", 0, 130), disc(90, "post", -40, 160)] });
  take(WPOS[0], WPOS[1], 420);
  {
    // the channel: level with the trough's water, in pieces whose middles stand on flat ground
    // (each step's cliff falls between two pieces), stretched to span it
    const water = WHEEL.troughZ + 10 - 4 - (CHANNEL_Z + 8);
    const r0 = wr - WHEEL.troughY - 10, rEnd = rk(TH_W, 1) - 380;
    const cuts = [r0, rk(TH_W, 0), rk(TH_W, 1), rEnd];
    for (let i = 0; i + 1 < cuts.length; i++) {
      const a = cuts[i], b = cuts[i + 1], n = Math.max(1, Math.floor((a - b) / 480)), len = (a - b) / n;
      for (let j = 0; j < n; j++) {
        const rc = a - len * (j + 0.5), p = at(TH_W, rc), sy = len / 400;
        put("westhills:bamboo_channel", p, -TH_W / D + 90, { z: water - f.h(p[0], p[1]), sy, solid: [disc(26, "post", 0, -160 * sy), disc(26, "post", 0, 160 * sy)] });
        take(p[0], p[1], 120);
      }
    }
  }
  const channelLine = [at(TH_W, wr), at(TH_W, rk(TH_W, 1) - 380)];

  // ---- the village: farmhouses facing the lane, the buffalo pen, the buffalo ----
  for (const hs of HOUSES) {
    prop("westhills:farm_house", hs.at, facingOut(hs.th * D), 560);
  }
  // a house up on the terraces, on the lowest step by the north-west ramps
  const TH_TH = 346 * D, thouse = at(TH_TH, (rk(TH_TH, 0) + rk(TH_TH, 1)) / 2 + 40);
  if (free(thouse[0], thouse[1], 300)) prop("westhills:farm_house", thouse, facingOut(TH_TH), 560);
  prop("westhills:buffalo_pen", PEN, facingOut(58 * D), 520, {
    solid: [
      { kind: "fence", x: 400, y: 0, w: 30, d: 660, rot: 0 }, { kind: "fence", x: 0, y: 320, w: 820, d: 30, rot: 0 }, { kind: "fence", x: 0, y: -320, w: 820, d: 30, rot: 0 },
      { kind: "fence", x: -400, y: 240, w: 30, d: 170, rot: 0 }, { kind: "fence", x: -400, y: -240, w: 30, d: 170, rot: 0 },
    ],
  });
  const penA = (facingOut(58 * D) * Math.PI) / 180;
  const inPen = (dx: number, dy: number): XY => [PEN[0] + dx * Math.cos(penA) - dy * Math.sin(penA), PEN[1] + dx * Math.sin(penA) + dy * Math.cos(penA)];
  put("westhills:water_buffalo", inPen(-120, 140), facingOut(58 * D) + 150, { solid: [{ kind: "animal", x: 0, y: 0, w: 260, d: 110, rot: 0 }] });
  put("westhills:water_buffalo", inPen(150, -150), facingOut(58 * D) + 260, { solid: [{ kind: "animal", x: 0, y: 0, w: 260, d: 110, rot: 0 }] });
  for (const p of [at(42 * D, rs(42 * D) + 2300), at(16 * D, rs(16 * D) + 900), at(66 * D, rs(66 * D) + 700), at(140 * D, R0(140 * D) + 700)] as XY[])
    if (free(p[0], p[1], 150, 100) && !inPaddy(p[0], p[1], 120)) prop("westhills:water_buffalo", p, rnd() * 360, 170, { solid: [{ kind: "animal", x: 0, y: 0, w: 260, d: 110, rot: 0 }] });
  // the yard things round the houses
  for (const hs of HOUSES) {
    const o = out(hs.th * D), t: XY = [-o[1], o[0]];
    for (const [a, b, ref, r] of [[-650, 380, "plains:hay_bales", 160], [-600, -420, "common:crate", 80], [420, 520, "flora:Bamboo", 140], [420, -520, "flora:Bamboo", 140]] as [number, number, string, number][]) {
      const p: XY = [hs.at[0] - o[0] * a + t[0] * b, hs.at[1] - o[1] * a + t[1] * b];
      if (free(p[0], p[1], r, 30) && !inPaddy(p[0], p[1], 60)) prop(ref, p, rnd() * 360, r + 20, ref.startsWith("flora") ? { s: 0.9 } : {});
    }
  }

  // ---- the paddies: end to end round every step, in the middle of its flat ----
  const flatAt = (p: XY, th: number, s: number, h: number) => {
    const o = out(th), t: XY = [-o[1], o[0]], hx = (PADDY.x / 2) * s + 10, hy = (PADDY.y / 2) * s;
    return [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]].every(([a, b]) => {
      const x = p[0] + o[0] * hx * a + t[0] * hy * b, y = p[1] + o[1] * hx * a + t[1] * hy * b;
      return Math.abs(f.h(x, y) - h) < 5 && ground.kind(x, y) === 0;
    });
  };
  // paddies end to end round a row, each turned to the curve; where the flat is narrower or the
  // edge wanders, one nudged in or out, or a smaller one
  const paddyRow = (rOf: (th: number) => number, h: number, th0: number, th1: number) => {
    for (let th = th0; th < th1; ) {
      let placed = false;
      for (const dr of [0, -90, 90, -180, 180]) {
        const rc = rOf(th) + dr, p = at(th, rc);
        if (Math.abs(p[0]) > A - 500 || Math.abs(p[1]) > A - 500 || nearRamp(p[0], p[1], 90) || distToPath(channelLine, p[0], p[1]) < 330 || onTrack(p[0], p[1], 280) || onBeach(p[0], p[1], 200) ||
          taken.some(([tx, ty, tr]) => Math.hypot(tx - p[0], ty - p[1]) < tr + 140))
          continue;
        for (const s of [1, 0.9, 0.8, 0.7])
          if (flatAt(p, th, s, h) && !overlaps(p, th, s)) {
            put("westhills:paddy", p, -th / D, { s, solid: "none" });
            paddies.push([p[0], p[1], (PADDY.y / 2) * s, th, s]);
            placed = true;
            th += ((PADDY.y + 6) * s) / rOf(th);
            break;
          }
        if (placed) break;
      }
      if (!placed) th += 90 / rOf(th);
    }
  };
  for (let k = 0; k < STEPS - 1; k++) {
    // between the lip of this step's edge and the scree at the foot of the next
    const mid = (th: number) => (rk(th, k) - 150 + rk(th, k + 1) + 200) / 2;
    paddyRow(mid, STEP_H * (k + 1), 0, 360 * D);
  }
  // the valley: two rows along the stream's far bank
  for (const dr of [STREAM_W / 2 + 130 + PADDY.x / 2, STREAM_W / 2 + 190 + PADDY.x * 1.5]) paddyRow((th) => rs(th) + dr, 0, -50 * D, 104 * D);

  // ---- the threshing floor by the lane: haystacks, a scarecrow ----
  for (const [x, y, h] of [[4300, -4300, 20], [4700, -4000, 70], [4500, -4700, 140]] as [number, number, number][]) if (free(x, y, 160, 40)) prop("plains:hay_bales", [x, y], h, 170);
  prop("plains:scarecrow", [4950, -3500], 200, 60, { solid: [disc(14)] });

  // ---- scarecrows in the paddies, a bunch of seedlings waiting on a bund ----
  for (let i = 0, made = 0; i < 60 && made < 10; i++) {
    const [px, py] = paddies[Math.floor(rnd() * paddies.length)];
    if (Math.abs(px) > R - 300 || Math.abs(py) > R - 300 || taken.some(([tx, ty]) => Math.hypot(tx - px, ty - py) < 1500)) continue;
    put("westhills:rice_scarecrow", [px + (rnd() - 0.5) * 100, py + (rnd() - 0.5) * 100], rnd() * 360, { solid: [disc(14)] });
    take(px, py, 60);
    made++;
  }

  // ---- bamboo groves and trees: along the stream, round the village, up the backs of the steps ----
  const grove = (c: XY, r: number, n: number, kinds: string[]) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (Math.abs(x) > A - 400 || Math.abs(y) > A - 400 || inPaddy(x, y, 120) || onTrack(x, y, 200) || nearRamp(x, y, 260) || onBeach(x, y, 150) || !free(x, y, 150, 120)) continue;
      const kind = kinds[Math.floor(rnd() * kinds.length)];
      put(`flora:${kind}`, [x, y], rnd() * 360, { s: 0.75 + rnd() * 0.4, ...(kind === "Bamboo" ? { solid: [disc(45, "tree")] } : {}) });
      take(x, y, 160);
      made++;
    }
  };
  for (const [th, dr, r, n] of [[-20, 900, 600, 5], [5, 1500, 500, 4], [20, 2200, 700, 5], [44, 2600, 700, 5], [56, 2300, 700, 5], [70, 800, 700, 5], [84, 900, 600, 4], [100, 600, 600, 4], [-40, 600, 500, 3]] as [number, number, number, number][])
    grove(at(th * D, rs(th * D) + dr), r, n, ["Bamboo", "Bamboo", "Bamboo", "RoundTree", "BigOak"]);
  // on the hill's foot by the beach, and on the plain past its south-east
  for (const [c, r, n] of [[at(150 * D, R0(150 * D) + 500), 600, 4], [at(122 * D, R0(122 * D) + 700), 700, 5], [[-4300, -4600], 700, 5], [at(250 * D, R0(250 * D) + 250), 300, 2]] as [XY, number, number][])
    grove(c, r, n, ["Bamboo", "RoundTree", "Pine", "Bamboo"]);
  // a clump at the back of a step here and there, where the paddies leave room
  for (let i = 0; i < 40; i++) {
    const k = Math.floor(rnd() * (STEPS - 1)), th = rnd() * 360 * D;
    grove(at(th, rk(th, k + 1) + 330), 120, 1, ["Bamboo", "Bamboo", "SmallTree"]);
  }

  // ---- rocks and reeds by the stream, stumps, logs ----
  for (let i = 0; i < 24; i++) {
    const th = (TH_S0 + rnd() * (TH_S1 - TH_S0)) * D, side = rnd() < 0.5 ? -1 : 1, p = at(th, rs(th) + side * (STREAM_W / 2 + 60 + rnd() * 120));
    if (!free(p[0], p[1], 100, 40) || inPaddy(p[0], p[1], 60) || nearRamp(p[0], p[1]) || onBeach(p[0], p[1])) continue;
    const ref = rnd() < 0.6 ? "plains:reeds" : rnd() < 0.5 ? "plains:flat_rock" : "plains:boulder";
    prop(ref, p, rnd() * 360, 110, ref.endsWith("reeds") ? { solid: "none" } : { s: 0.6, solid: [disc(70, "rock")] });
  }

  // ---- the beach: rocks and shingle along the water, the fishermen's boats pulled up on the sand ----
  for (let i = 0; i < SHORE.length; i++) {
    const [x, y] = inland[i], q = SHORE[i];
    if (Math.abs(x) > R - 100 || Math.abs(y) > R - 100 || rnd() < 0.55) continue;
    const t = 0.25 + rnd() * 0.45, p: XY = [q[0] + (x - q[0]) * t, q[1] + (y - q[1]) * t];
    if (!free(p[0], p[1], 90, 60) || onTrack(p[0], p[1], 60)) continue;
    const ref = rnd() < 0.45 ? "plains:flat_rock" : rnd() < 0.6 ? "plains:boulder" : "plains:rock_cluster";
    const s = 0.5 + rnd() * 0.35;
    prop(ref, p, rnd() * 360, 150 * s, { s, solid: [disc(110 * s, "rock")] });
  }
  for (const [x, y, h] of [[-4650, 1900, 100], [-4720, 1350, 80], [-3300, 4250, 150], [-4650, -2600, 95]] as [number, number, number][])
    if (free(x, y, 120, 60)) prop("suzhou:sampan", [x, y], h, 260, { z: -6, s: 0.9 });

  // ---- past the edge: bamboo and broadleaf woods over the hills on the land side ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const busy = (x: number, y: number) => inside(x, y) || onTrack(x, y, 220) || inPaddy(x, y, 100) || distToPath(STREAM, x, y) < STREAM_W / 2 + 120 || nearRamp(x, y, 200) || onBeach(x, y, 300);
  f.woods(area, ["Bamboo", "Bamboo", "RoundTree", "BigOak", "Pine", "SmallTree"], busy, { count: 300, spacing: 420, tries: 7000 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: -R - 200 }, ["BigOak", "RoundTree", "Bamboo", "SmallTree"], busy, { count: 120, spacing: 400, tries: 3000 });

  // ---- monsters: the valley, the terraces' flats, the beach ----
  const quiet = (x: number, y: number) => HOUSES.some((hs) => Math.hypot(hs.at[0] - x, hs.at[1] - y) < 900) || Math.hypot(SHRINE[0] - x, SHRINE[1] - y) < 900 || Math.hypot(PEN[0] - x, PEN[1] - y) < 700 || Math.hypot(WPOS[0] - x, WPOS[1] - y) < 1300;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 820, keepOut: quiet });

  // ---- people ----
  const wo = out(TH_W), wt: XY = [-wo[1], wo[0]];
  const farmer: XY = [WPOS[0] + wo[0] * 620 + wt[0] * 250, WPOS[1] + wo[1] * 620 + wt[1] * 250];
  const sh = out(TH_STAIR), st: XY = [-sh[1], sh[0]];
  const keeper: XY = [SHRINE[0] + sh[0] * 150 + st[0] * 330, SHRINE[1] + sh[1] * 150 + st[1] * 330];
  const npcs: NpcSpec[] = [
    { id: "terraces_farmer", x: farmer[0], y: farmer[1], face: towards(WPOS[0] - farmer[0], WPOS[1] - farmer[1]) + 180, name: "ลุงหลี่", title: "ชาวนาขั้นบันได", role: "talk",
      look: { gender: "male", hair: "", hairColor: "ink", eyes: "amber", top: "top_warrior_navy", bottom: "bottom_warrior_cocoa" },
      lines: [
        "กังหันไม้ไผ่ตัวนี้วิดน้ำจากลำธารขึ้นไปถึงนาชั้นสอง ไม่ต้องใช้แรงคนสักนิด",
        "นาขั้นบันไดพวกนี้ปู่ย่าตายายขุดไว้ทีละขั้น รอบเนินทั้งลูกตั้งแต่ริมลำธารลงไปจนถึงชายหาด ใช้เวลาหลายร้อยปี",
        "ช่วงนี้พวกสัตว์ร้ายลงมาเหยียบต้นข้าวบ่อยนัก ใครช่วยไล่ไปได้ ข้าจะขอบคุณมาก",
      ] },
    { id: "terraces_keeper", x: keeper[0], y: keeper[1], face: TH_STAIR / D + 180, name: "ป้าหวัง", title: "ผู้ดูแลศาลเจ้าที่", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "teal", top: "top_priestess_wine", bottom: "bottom_priestess_black" },
      lines: [
        "ศาลนี้ตั้งไว้บูชาเจ้าที่ ขอให้น้ำท่าบริบูรณ์ ข้าวในนาทุกขั้นเติบโตงาม",
        "ปีไหนฝนแล้ง ชาวบ้านจะขึ้นมาจุดธูปที่นี่กันทั้งหมู่บ้าน ส่วนชาวประมงริมหาดก็ขึ้นมาขอให้ทะเลสงบ",
        "เดินลงบันไดหินไปทางเหนือข้ามลำธาร ก็จะถึงทางกลับซูโจว",
      ] },
  ];

  const mid2 = at(28 * D, (rk(28 * D, 2) + rk(28 * D, 3)) / 2);
  return f.finishField({
    ground,
    scenery: [beach.mesh, streamSheet, seaSheet],
    sky: "#9fc3c9",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && !inPaddy(x, y, 60) && distToPath(STREAM, x, y) > STREAM_W / 2 + 80 && !onBeach(x, y, 100), density: 0.14 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4720, y: -400 },
    npcs,
    labels: [
      { x: N_EXIT[0] - 150, y: N_EXIT[1], text: "ทางไปซูโจว", kind: "gate" },
      { x: mid2[0], y: mid2[1], text: "นาขั้นบันได" },
      { x: SHRINE[0] + sh[0] * 600, y: SHRINE[1] + sh[1] * 600, text: "ศาลเจ้าที่บนยอดนา" },
      { x: WPOS[0] + wo[0] * 700, y: WPOS[1] + wo[1] * 700, text: "กังหันน้ำไม้ไผ่" },
      { x: HOUSES[1].at[0] + 600, y: HOUSES[1].at[1] - 400, text: "หมู่บ้านชาวนา" },
      { x: PEN[0] + out(58 * D)[0] * 700, y: PEN[1] + out(58 * D)[1] * 700, text: "คอกควาย", kind: "small" },
      { x: (stair0.top[0] + stair0.bottom[0]) / 2 + 300, y: (stair0.top[1] + stair0.bottom[1]) / 2 - 300, text: "บันไดหินขึ้นนา", kind: "small" },
      { x: -4500, y: 2300, text: "หาดริมนา", kind: "small" },
    ],
  });
}

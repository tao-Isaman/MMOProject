// นาขั้นบันได (the rice terraces), monsters Lv 74-86: the hillsides south of Suzhou, stepped into
// terraces. The whole south-west of the field is one great hill cut into five curving steps, each
// a flat terrace 2 m above the one below, its outer edge an earthen bank; on every step the paddies
// lie end to end round the curve, flooded, the young rice in rows, the bunds between them. A
// stairway of stone climbs straight up the middle of the hill from step to step; earth ramps go
// up at either side. On the top step, under the mountain, the village's shrine to the earth god
// looks out over it all. Round the foot of the hill runs the stream, and on it the bamboo water
// wheel lifts water into a channel that carries it over the lower steps to the second. Beyond the
// stream lies the valley: the road from Suzhou (north) to the lagoon marsh (the east side's north
// end), the farmers' houses, the buffalo and their pen, paddies along the stream bank, bamboo.
//
// The terraces are laid out round a centre C past the south-west corner: step k's edge lies at
// r_k(θ) from C, θ the bearing from C (0 north, 90 east).
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: north -> suzhou, east (its north end) -> lagoon_marsh

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { KIT as WEST, PADDY, STAIRS, WHEEL, CHANNEL_Z } from "./kits/westhills";
import { KIT as PLAINS } from "./kits/plains";
import { smooth, band, towards } from "./kits/snowland";
import type { XY } from "./kits/snowland";
import { distToPath } from "./kits/frontier";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(WEST, PLAINS);

const R = 5500; // the walkable box
const A = 9000; // the ground
const D = Math.PI / 180;

// ---- the terraces ----
const C: XY = [-6400, 6400];
const STEPS = 5, STEP_H = 200;
const at = (th: number, r: number): XY => [C[0] + Math.cos(th) * r, C[1] - Math.sin(th) * r];
const out = (th: number): XY => [Math.cos(th), -Math.sin(th)]; // away from C
const R0 = (th: number) => 8600 * (1 + 0.035 * Math.sin(3 * th + 1));
const W = (th: number, k: number) => 1250 * (1 + 0.16 * Math.sin(2.3 * th + 1.7 * k));
const rk = (th: number, k: number) => {
  let r = R0(th);
  for (let j = 0; j < k; j++) r -= W(th, j);
  return r;
};
// the stream round the foot of the hill
const rs = (th: number) => R0(th) + 1400;

// where the ways up are: the stone stairway up the middle (every step), earth ramps either side
const TH_STAIR = 40 * D, TH_NW = 15 * D, TH_SE = 64 * D;
const RAMPS: { th: number; ks: number[]; stairs: boolean }[] = [
  { th: TH_STAIR, ks: [0, 1, 2, 3, 4], stairs: true },
  { th: TH_NW, ks: [0, 1, 2], stairs: false },
  { th: TH_SE, ks: [1, 2, 3], stairs: false },
];
type Ramp = { top: XY; bottom: XY; width: number; straight?: boolean };
function rampAt(th: number, k: number, stairs: boolean): Ramp {
  const top = at(th, rk(th, k)), e = 0.002, a = at(th - e, rk(th - e, k)), b = at(th + e, rk(th + e, k));
  let nx = -(b[1] - a[1]), ny = b[0] - a[0];
  const L = Math.hypot(nx, ny);
  nx /= L;
  ny /= L;
  if (nx * (top[0] - C[0]) + ny * (top[1] - C[1]) < 0) [nx, ny] = [-nx, -ny];
  const len = stairs ? STAIRS.run : 640;
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
// the mountain behind the top step (scenery)
const M_TOP: XY[] = Array.from({ length: 24 }, (_, i) => at((i / 24) * Math.PI * 2, 1150 * (1 + 0.12 * Math.sin(i * 1.9))));

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
      // past the edge
      { x: 8200, y: -1500, r: 2600, h: 420 },
      { x: 7600, y: -7400, r: 3000, h: 460 },
      { x: 1500, y: -8200, r: 2600, h: 360 },
      { x: 8000, y: 4800, r: 2200, h: 380 },
    ],
    plateaus: [
      ...STEP_POLYS.map((poly, k) => ({ poly, h: STEP_H * (k + 1), ramps: STEP_RAMPS[k] })),
      { poly: M_TOP, h: STEP_H * STEPS + 900 },
    ],
    rock: "Westhills_TerraceBank",
  });
  const { put, rnd } = f;

  // ---- the stream ----
  const STREAM: XY[] = [];
  for (let d = -16; d <= 106; d += 2) STREAM.push(at(d * D, rs(d * D)));
  const STREAM_W = 520;

  // ---- tracks ----
  const N_EXIT: XY = [5150, 0], E_EXIT: XY = [3900, -5150];
  const MAIN = smooth([[7600, 150], N_EXIT, [4350, -500], [3750, -1700], [3350, -2900], [3450, -4100], [3800, -4700], E_EXIT, [3950, -7600]]);
  const stair0 = STEP_RAMPS[0].find((r) => r.straight)!;
  const nw0 = rampAt(TH_NW, 0, false);
  const BR_STAIR: XY = at(TH_STAIR, rs(TH_STAIR)), BR_NW: XY = at(TH_NW, rs(TH_NW));
  const STAIR_WAY = [...smooth([[3700, -1850], [2600, -1050], at(TH_STAIR, rs(TH_STAIR) + 650)]), BR_STAIR, at(TH_STAIR, rs(TH_STAIR) - 560), along(stair0.bottom, stair0.top, -60)];
  const NW_WAY = [...smooth([[4380, -350], [4800, 900], [4650, 2300], at(TH_NW, rs(TH_NW) + 650)]), BR_NW, at(TH_NW, rs(TH_NW) - 560), along(nw0.bottom, nw0.top, -60)];
  // the village lane, off the road to the houses and the pen
  const HOUSES: { at: XY; th: number }[] = [{ at: at(45 * D, 11850), th: 45 }, { at: at(52.5 * D, 11900), th: 52.5 }, { at: at(34.5 * D, 11800), th: 34.5 }];
  const PEN: XY = at(59 * D, 12000);
  const LANE = smooth([[3400, -3300], at(52 * D, 12900), at(58 * D, 12950), at(62 * D, 12500)]);
  const roads = [band(MAIN, 470), band(STAIR_WAY, 400), band(NW_WAY, 380), band(LANE, 360)];
  const tracks = [MAIN, STAIR_WAY, NW_WAY, LANE];

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ROAD: [number, number, number] = [0.86, 0.8, 0.72];
  const streamPoly = band(STREAM, STREAM_W);
  const ground = f.ground({ area, roads, plazas: [], water: [streamPoly], road: ROAD });
  const streamSheet = f.waterSheet(area, -14, "Westhills_Stream");
  f.blockBand(STREAM, STREAM_W - 60, { gaps: [BR_STAIR, BR_NW], gapR: 300 });

  // ---- ways out ----
  f.exit("suzhou", N_EXIT, [4450, -50]);
  f.exit("lagoon_marsh", E_EXIT, [3700, -4450]);

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

  // ---- the ways out: signposts, lanterns ----
  prop("plains:signpost", [4750, 450], 180, 90, { solid: [disc(25)] });
  prop("plains:signpost", [3450, -4800], 90, 90, { solid: [disc(25)] });
  prop("plains:signpost", [3250, -1500], 140, 90, { solid: [disc(25)] });

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

  // ---- the shrine on the top step, under the mountain; its old tree, lanterns ----
  const SHRINE = at(TH_STAIR, rk(TH_STAIR, STEPS - 1) - 800);
  prop("westhills:village_shrine", SHRINE, facingOut(TH_STAIR), 360, { solid: [{ kind: "shrine", x: 30, y: 0, w: 330, d: 300, rot: 0 }, disc(30, "post", -240, 0)] });
  // (the old tree stands north of it, so it never hides the shrine from below)
  prop("flora:BigOak", at(25 * D, 2900), rnd() * 360, 260, { s: 1.1 });
  for (const dth of [-14, 15, 24]) {
    const p = at(TH_STAIR + dth * D, rk(TH_STAIR + dth * D, STEPS - 1) - 700);
    if (free(p[0], p[1], 150)) prop("flora:Cherry", p, rnd() * 360, 200, { s: 0.85 });
  }

  // ---- the water wheel on the stream and its channel up over the lower steps ----
  const TH_W = 30 * D, wr = rs(TH_W), WPOS = at(TH_W, wr);
  // its X along the stream, its +Y (the trough) toward C
  const wheelH = 90 - TH_W / D;
  put("westhills:bamboo_waterwheel", WPOS, wheelH, { solid: [disc(60, "post", 0, -130), disc(60, "post", 0, 130), disc(90, "post", -40, 160)] });
  take(WPOS[0], WPOS[1], 420);
  {
    // the channel: level with the trough's water, in pieces whose middles stand on flat ground
    // (each step's cliff falls between two pieces), stretched to span it
    const water = WHEEL.troughZ + 10 - 4 - (CHANNEL_Z + 8);
    const r0 = wr - WHEEL.troughY - 10, rEnd = rk(TH_W, 1) - 520;
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
  const channelLine = [at(TH_W, wr), at(TH_W, rk(TH_W, 1) - 520)];

  // ---- the village: farmhouses facing the road, the buffalo pen, the buffalo ----
  for (const hs of HOUSES) {
    prop("westhills:farm_house", hs.at, facingOut(hs.th * D), 560);
  }
  // a house up on the terraces, on the second step by the north-west ramps
  const TH_TH = 22 * D, thouse = at(TH_TH, (rk(TH_TH, 1) + rk(TH_TH, 2)) / 2 + 40);
  if (free(thouse[0], thouse[1], 300)) prop("westhills:farm_house", thouse, facingOut(TH_TH), 560);
  prop("westhills:buffalo_pen", PEN, facingOut(59 * D), 520, {
    solid: [
      { kind: "fence", x: 400, y: 0, w: 30, d: 660, rot: 0 }, { kind: "fence", x: 0, y: 320, w: 820, d: 30, rot: 0 }, { kind: "fence", x: 0, y: -320, w: 820, d: 30, rot: 0 },
      { kind: "fence", x: -400, y: 240, w: 30, d: 170, rot: 0 }, { kind: "fence", x: -400, y: -240, w: 30, d: 170, rot: 0 },
    ],
  });
  const penA = (facingOut(59 * D) * Math.PI) / 180;
  const inPen = (dx: number, dy: number): XY => [PEN[0] + dx * Math.cos(penA) - dy * Math.sin(penA), PEN[1] + dx * Math.sin(penA) + dy * Math.cos(penA)];
  put("westhills:water_buffalo", inPen(-120, 140), facingOut(59 * D) + 150, { solid: [{ kind: "animal", x: 0, y: 0, w: 260, d: 110, rot: 0 }] });
  put("westhills:water_buffalo", inPen(150, -150), facingOut(59 * D) + 260, { solid: [{ kind: "animal", x: 0, y: 0, w: 260, d: 110, rot: 0 }] });
  for (const p of [at(48 * D, 13300), at(26 * D, 11500), at(68 * D, 11600), at(33 * D, 12900)] as XY[])
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
      for (const dr of [0, -110, 110, -220, 220]) {
        const rc = rOf(th) + dr, p = at(th, rc);
        if (Math.abs(p[0]) > A - 500 || Math.abs(p[1]) > A - 500 || nearRamp(p[0], p[1], 90) || distToPath(channelLine, p[0], p[1]) < 330 || onTrack(p[0], p[1], 280) ||
          taken.some(([tx, ty, tr]) => Math.hypot(tx - p[0], ty - p[1]) < tr + 140))
          continue;
        for (const s of [1, 0.9, 0.8])
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
  for (let k = 0; k < STEPS; k++) {
    // between the lip of this step's edge and the scree at the foot of the next
    const mid = (th: number) => (k < STEPS - 1 ? (rk(th, k) - 170 + rk(th, k + 1) + 220) / 2 : rk(th, k) - 520);
    paddyRow(mid, STEP_H * (k + 1), -14 * D, 104 * D);
  }
  // the top step: a second row inside the first, round the shrine
  paddyRow((th) => rk(th, STEPS - 1) - 520 - PADDY.x - 40, STEP_H * STEPS, -10 * D, 100 * D);
  // the valley: two rows along the stream's far bank
  for (const dr of [STREAM_W / 2 + 130 + PADDY.x / 2, STREAM_W / 2 + 190 + PADDY.x * 1.5]) paddyRow((th) => rs(th) + dr, 0, 16 * D, 104 * D);

  // the far side of the road: a block of paddies square to it, a threshing floor of haystacks
  {
    const a: XY = [4700, -1500], u: XY = [-0.32, -0.95], v: XY = [0.95, -0.32]; // along the road, away from it
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 2; j++) {
        const p: XY = [a[0] + u[0] * i * (PADDY.y + 6) + v[0] * (j * (PADDY.x + 6)), a[1] + u[1] * i * (PADDY.y + 6) + v[1] * (j * (PADDY.x + 6))];
        if (Math.abs(p[0]) > R - 350 || onTrack(p[0], p[1], 300) || !f.level(p[0], p[1], 300)) continue;
        put("westhills:paddy", p, (Math.atan2(v[1], v[0]) * 180) / Math.PI, { solid: "none" });
        paddies.push([p[0], p[1], PADDY.y / 2, Math.atan2(-v[1], v[0]), 1]);
      }
    for (const [x, y, h] of [[4300, -4300, 20], [4700, -4000, 70], [4500, -4700, 140]] as [number, number, number][]) if (free(x, y, 160, 40)) prop("plains:hay_bales", [x, y], h, 170);
    prop("plains:scarecrow", [4950, -3500], 200, 60, { solid: [disc(14)] });
  }

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
      if (Math.abs(x) > A - 400 || Math.abs(y) > A - 400 || inPaddy(x, y, 120) || onTrack(x, y, 200) || nearRamp(x, y, 260) || !free(x, y, 150, 120)) continue;
      const kind = kinds[Math.floor(rnd() * kinds.length)];
      put(`flora:${kind}`, [x, y], rnd() * 360, { s: 0.75 + rnd() * 0.4, ...(kind === "Bamboo" ? { solid: [disc(45, "tree")] } : {}) });
      take(x, y, 160);
      made++;
    }
  };
  for (const [th, dr, r, n] of [[20, 900, 700, 5], [42, 2400, 800, 6], [55, 2000, 700, 5], [70, 800, 700, 5], [80, 2200, 900, 6], [30, 2600, 700, 4], [62, 3000, 800, 5], [10, 1600, 600, 4], [33, 4600, 900, 7], [52, 5600, 900, 6], [43, 5200, 600, 4]] as [number, number, number, number][])
    grove(at(th * D, rs(th * D) + dr), r, n, ["Bamboo", "Bamboo", "Bamboo", "RoundTree", "BigOak"]);
  // a clump at the back of a step here and there, where the paddies leave room
  for (let i = 0; i < 40; i++) {
    const k = Math.floor(rnd() * STEPS), th = (-8 + rnd() * 108) * D;
    grove(at(th, (k < STEPS - 1 ? rk(th, k + 1) : rk(th, k) - 1300) + 400), 120, 1, ["Bamboo", "Bamboo", "SmallTree"]);
  }

  // ---- rocks and reeds by the stream, stumps, logs ----
  for (let i = 0; i < 24; i++) {
    const th = (-10 + rnd() * 112) * D, side = rnd() < 0.5 ? -1 : 1, p = at(th, rs(th) + side * (STREAM_W / 2 + 60 + rnd() * 120));
    if (!free(p[0], p[1], 100, 40) || inPaddy(p[0], p[1], 60) || nearRamp(p[0], p[1])) continue;
    const ref = rnd() < 0.6 ? "plains:reeds" : rnd() < 0.5 ? "plains:flat_rock" : "plains:boulder";
    prop(ref, p, rnd() * 360, 110, ref.endsWith("reeds") ? { solid: "none" } : { s: 0.6, solid: [disc(70, "rock")] });
  }

  // ---- past the edge: bamboo and broadleaf woods over the hills; pines up the mountain ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const busy = (x: number, y: number) => inside(x, y) || onTrack(x, y, 220) || inPaddy(x, y, 100) || distToPath(STREAM, x, y) < STREAM_W / 2 + 120 || nearRamp(x, y, 200);
  f.woods(area, ["Bamboo", "Bamboo", "RoundTree", "BigOak", "Pine", "SmallTree"], busy, { count: 360, spacing: 420, tries: 7000 });

  // ---- monsters: the valley, the terraces' flats ----
  const quiet = (x: number, y: number) => HOUSES.some((hs) => Math.hypot(hs.at[0] - x, hs.at[1] - y) < 900) || Math.hypot(SHRINE[0] - x, SHRINE[1] - y) < 900 || Math.hypot(PEN[0] - x, PEN[1] - y) < 700 || Math.hypot(WPOS[0] - x, WPOS[1] - y) < 1300;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 820, keepOut: quiet });

  // ---- people ----
  const wo = out(TH_W), wt: XY = [-wo[1], wo[0]];
  const farmer: XY = [WPOS[0] + wo[0] * 620 + wt[0] * 250, WPOS[1] + wo[1] * 620 + wt[1] * 250];
  const sh = out(TH_STAIR);
  const keeper: XY = [SHRINE[0] + sh[0] * 420 + sh[1] * 160, SHRINE[1] + sh[1] * 420 - sh[0] * 160];
  const npcs: NpcSpec[] = [
    { id: "terraces_farmer", x: farmer[0], y: farmer[1], face: towards(WPOS[0] - farmer[0], WPOS[1] - farmer[1]) + 180, name: "ลุงหลี่", title: "ชาวนาขั้นบันได", role: "talk",
      look: { gender: "male", hair: "", hairColor: "ink", eyes: "amber", top: "top_warrior_navy", bottom: "bottom_warrior_cocoa" },
      lines: [
        "กังหันไม้ไผ่ตัวนี้วิดน้ำจากลำธารขึ้นไปถึงนาชั้นสอง ไม่ต้องใช้แรงคนสักนิด",
        "นาขั้นบันไดพวกนี้ปู่ย่าตายายขุดไว้ทีละขั้น ใช้เวลาหลายร้อยปีกว่าจะเต็มทั้งภูเขา",
        "ช่วงนี้พวกสัตว์ร้ายลงมาเหยียบต้นข้าวบ่อยนัก ใครช่วยไล่ไปได้ ข้าจะขอบคุณมาก",
      ] },
    { id: "terraces_keeper", x: keeper[0], y: keeper[1], face: TH_STAIR / D + 180, name: "ป้าหวัง", title: "ผู้ดูแลศาลเจ้าที่", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "teal", top: "top_priestess_wine", bottom: "bottom_priestess_black" },
      lines: [
        "ศาลนี้ตั้งไว้บูชาเจ้าที่ ขอให้น้ำท่าบริบูรณ์ ข้าวในนาทุกขั้นเติบโตงาม",
        "ปีไหนฝนแล้ง ชาวบ้านจะขึ้นมาจุดธูปที่นี่กันทั้งหมู่บ้าน",
        "เดินลงบันไดหินไปทางเหนือข้ามลำธาร ก็จะถึงทางกลับซูโจว",
      ] },
  ];

  const mid2 = at(28 * D, (rk(28 * D, 2) + rk(28 * D, 3)) / 2);
  return f.finishField({
    ground,
    scenery: [streamSheet],
    sky: "#9fc3c9",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && !inPaddy(x, y, 60) && distToPath(STREAM, x, y) > STREAM_W / 2 + 80, density: 0.14 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4720, y: -270 },
    npcs,
    labels: [
      { x: N_EXIT[0] - 150, y: N_EXIT[1], text: "ทางไปซูโจว", kind: "gate" },
      { x: E_EXIT[0], y: E_EXIT[1] + 150, text: "ทางไปบึงลากูน", kind: "gate" },
      { x: mid2[0], y: mid2[1], text: "นาขั้นบันได" },
      { x: SHRINE[0] + sh[0] * 600, y: SHRINE[1] + sh[1] * 600, text: "ศาลเจ้าที่บนยอดนา" },
      { x: WPOS[0] + wo[0] * 700, y: WPOS[1] + wo[1] * 700, text: "กังหันน้ำไม้ไผ่" },
      { x: HOUSES[0].at[0] + 600, y: HOUSES[0].at[1] - 400, text: "หมู่บ้านชาวนา" },
      { x: PEN[0] + out(59 * D)[0] * 700, y: PEN[1] + out(59 * D)[1] * 700, text: "คอกควาย", kind: "small" },
      { x: (stair0.top[0] + stair0.bottom[0]) / 2 + 300, y: (stair0.top[1] + stair0.bottom[1]) / 2 - 300, text: "บันไดหินขึ้นนา", kind: "small" },
    ],
  });
}


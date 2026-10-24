// ป่าไทรศักดิ์สิทธิ์ (the sacred banyan woods), monsters Lv 180-190: the funeral woods of the first
// kings, on the south-western shore west of Yodia. The sea runs along the west and the south and
// comes up the south-east to Yodia's harbour; the woods' great banyans are hung with offerings,
// brick chedis stand in their roots half swallowed, and the spirits of the white elephants that
// carried the kings walk the glades, the stone guardians of the shrines with them.
//
// The way in from Yodia's forest gate (east) is the old royal avenue: past lantern posts, between
// two white elephants in gold, to the stairs up the banyan court (3 m), where the sacred banyan
// stands wound in silk with its offerings, two more banyans hung with cloths by it. From the
// north, out of a gap in the high woods below the royal necropolis, a track comes down to the
// avenue. North of the court the royal mound (4 m) carries the oldest chedi, a banyan grown out
// of its bell. West of the court stairs go down to the landing on the river of lanterns, which
// rises in a sacred pool in the north-west and runs west into the sea, floating lanterns on it;
// over a stone bridge the shore woods, where more chedis stand among the roots above the sea.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: north -> royal_necropolis, east -> yodia

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, seeded } from "./town";
import { KIT as OLDGROWTH, seaSheet } from "./kits/oldgrowth";
import { KIT as WESTMOUNT, SLAB_BRIDGE_SOLIDS, smooth, band, blob, inPoly, toLine, nearestOn, pieces, dense, towards, runAlong, rampOff, beyond, sheet } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import { KIT as JUNGLE } from "./kits/jungle";
import { KIT as RUINS } from "./kits/ruins";
import { KIT as YODIA } from "./kits/yodia";
import { blobPoly } from "./kits/snowland";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(OLDGROWTH, WESTMOUNT, JUNGLE, RUINS, YODIA);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the sea: the shore from the north edge down the west, round the south-west and along the
// south, then up the south-east to the east edge, where Yodia's harbour water comes in ----
const SHORE: XY[] = smooth([
  [A + 400, 5900], [6676, 5850], [5500, 5650], [4500, 5350], [3500, 5150], [2000, 5050], [500, 4950], [-1000, 4800], [-2300, 4500],
  [-3400, 3900], [-4300, 3000], [-4900, 1900], [-5150, 600], [-5100, -800], [-4800, -2100], [-4300, -3200], [-3700, -4200],
  [-3250, -5200], [-3120, -6676], [-3100, -A - 400],
], 3);
const SEA: XY[] = [...SHORE, [-A - 400, -A - 400], [-A - 400, A + 400], [A + 400, A + 400]];

// ---- the river of lanterns: out of the sacred pool, west into the sea ----
const POOL_C: XY = [2700, 2900];
const POOL = blob(POOL_C, 700, 560, 7, 22);
const RIVER: XY[] = smooth([[2300, 3100], [1500, 3350], [500, 3350], [-500, 3200], [-1500, 2950], [-2500, 2800], [-3300, 2950], [-3900, 3400], [-4500, 3900]], 5);
const RW = 560;

// ---- the levels: C the banyan court (its stairs up from the avenue, and down to the landing),
// M the royal mound; past the north edge the high woods under the necropolis, a gap left for the
// track down from it ----
const C: XY[] = [[1000, -1400], [1200, 0], [1000, 1400], [0, 1700], [-1300, 1500], [-1700, 200], [-1400, -1200], [-200, -1500]];
const RC_E = { top: [500, -1450] as XY, bottom: [500, -2350] as XY, width: 480, straight: true };
const RC_W = rampOff([0, 1700], [-1300, 1500], [0, 0], 900, 440, true);
const M: XY[] = [[2900, -300], [3900, -600], [4600, 200], [4500, 1500], [3700, 2000], [3000, 1700], [2700, 700]];
const RM = rampOff([3900, -600], [2900, -300], [3700, 700], 1200, 440);
const N_RIM_E: XY[] = [[6000, -A], [A, -A], [A, -4300], [7600, -4250], [6100, -4300]];
const N_RIM_W: XY[] = [[6100, -2500], [7600, -2550], [A, -2500], [A, 6000], [6400, 5800], [6200, 4500], [6000, 2000], [6200, -500]];

const BANYAN: XY = [-200, 200];
const MOUND_TOP: XY = [3700, 800];
const LANDING: XY = [-480, 2620];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(520, {
    hills: [
      { x: 1600, y: -3800, r: 900, h: 70 }, { x: -2600, y: -1800, r: 1000, h: 90 }, { x: 4300, y: -1800, r: 800, h: 60 },
      { x: -2600, y: 1300, r: 800, h: 70 }, { x: 4600, y: 3400, r: 800, h: 80 }, { x: 900, y: 4300, r: 700, h: 60 }, { x: -1500, y: -3600, r: 700, h: -40 },
    ],
    plateaus: [
      { poly: dense(C), h: 300, ramps: [RC_E, RC_W] },
      { poly: dense(M), h: 400, ramps: [RM] },
      { poly: dense(N_RIM_E, 700), h: 900 },
      { poly: dense(N_RIM_W, 700), h: 900 },
    ],
    rock: "Oldgrowth_CliffTemple",
  });
  const { put, rnd } = f;

  // ---- the tracks: the royal avenue from Yodia to the court's stairs, the way down from the
  // necropolis, up the mound, from the court down to the landing, over the river to the shore woods ----
  const E_EXIT: XY = [1965, -5150], N_EXIT: XY = [5150, -3400];
  const AVENUE: XY[] = smooth([[1965, -7600], E_EXIT, [1800, -4500], [1300, -3800], [700, -3200], [520, -2700], RC_E.bottom]);
  const NORTH_WAY: XY[] = smooth([[7600, -3400], N_EXIT, [4300, -3300], [3300, -3100], [2300, -3300], [1500, -3700]]);
  const MOUND_WAY: XY[] = [...smooth([[2300, -3300], [2600, -2600], beyond(RM.top, RM.bottom, 350)]), RM.bottom, RM.top, ...smooth([beyond(RM.bottom, RM.top, 400), [MOUND_TOP[0] - 450, MOUND_TOP[1] - 450]])];
  const COURT: XY[] = [RC_E.bottom, RC_E.top, ...smooth([[480, -1000], [300, -500], [BANYAN[0] + 600, BANYAN[1] - 400]])];
  const LANDING_WAY: XY[] = [...smooth([[BANYAN[0] + 200, BANYAN[1] + 700], [-300, 1300], beyond(RC_W.bottom, RC_W.top, 250)]), RC_W.top, RC_W.bottom, LANDING];
  const nb = nearestOn(RIVER, [800, 3360]);
  let bax: XY = [-nb.dir[1], nb.dir[0]];
  if (bax[1] < 0) bax = [-bax[0], -bax[1]]; // (from the south bank to the north)
  const BR = { at: nb.at, off: (k: number): XY => [nb.at[0] + bax[0] * k, nb.at[1] + bax[1] * k] };
  const SHORE_WAY: XY[] = [...smooth([[RC_W.bottom[0] + 300, RC_W.bottom[1] - 100], [300, 2500], BR.off(-760)]), ...smooth([BR.off(760), [600, 4100], [-200, 4300], [-1300, 4100]])];
  const TRACKS = [AVENUE, NORTH_WAY, MOUND_WAY, COURT, LANDING_WAY, SHORE_WAY];
  const roads = TRACKS.map((t, i) => band(t, i === 0 ? 480 : i === 1 ? 460 : 400));

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const riverBand = band(RIVER, RW);
  const WATER = [SEA, riverBand, POOL];
  const ground = f.ground({ area, roads, plazas: [], water: WATER, base: "jungle", road: [0.62, 0.55, 0.44], tint: "#c2cfb0" });
  const prnd = seeded(5201), mossy: XY[][] = [];
  for (let x = -A; x < A; x += 650)
    for (let y = -A; y < A; y += 650) if (prnd() < 0.4) mossy.push(blobPoly([x + prnd() * 650, y + prnd() * 650], 240 + prnd() * 200, 200 + prnd() * 150, 5202 + mossy.length, 0.25, 14));
  const moss = f.ground({ area, roads, plazas: [], water: [...WATER, ...mossy], base: "moss", road: [0.62, 0.55, 0.44], tint: "#bcc8a4" });
  moss.mesh.position.y += 3;
  moss.mesh.renderOrder = 1;
  // a beach of pale sand along the shore
  const SAND_IN: XY[] = SHORE.map(([x, y], i) => {
    const a = SHORE[Math.max(0, i - 1)], b = SHORE[Math.min(SHORE.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    if (inPoly(SEA, x + nx * 80, y + ny * 80)) [nx, ny] = [-nx, -ny];
    const w = 420 + 220 * Math.sin(i * 0.7);
    return [x + nx * w, y + ny * w];
  });
  const INLAND: XY[] = [...SAND_IN, [A + 400, -A - 400]];
  const sand = f.ground({ area, roads, plazas: [], water: [SEA, INLAND, riverBand], base: "sand", road: [0.62, 0.55, 0.44], tint: "#efe4c8" });
  sand.mesh.position.y += 5;
  sand.mesh.renderOrder = 2;

  // ---- the water ----
  const sea = seaSheet(SHORE, [[-A - 400, -A - 400], [-A - 400, A + 400], [A + 400, A + 400]], 250, -15, "Oldgrowth_Sea"); // (over the sea only, so the hollows inland stay dry)
  // (the river's own water only as far as the sea, so it never shows over the sea's)
  const RIVER_IN = RIVER.slice(0, RIVER.findIndex(([x, y]) => inPoly(SEA, x, y)) + 1);
  const riverSheet = sheet(band(RIVER_IN, RW + 100), -13, "Oldgrowth_Stream");
  const riverBed = sheet(band(RIVER_IN, RW + 160), -60, "Oldgrowth_RockDark");
  const pool = sheet(blob(POOL_C, 740, 600, 7, 22), -13, "Oldgrowth_Stream");
  const poolBed = sheet(blob(POOL_C, 780, 640, 7, 22), -60, "Oldgrowth_RockDark");
  const seaward = (p: XY, d: number): XY => {
    const i = SHORE.indexOf(p), a = SHORE[Math.max(0, i - 1)], b = SHORE[Math.min(SHORE.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    for (const s of [1, -1]) {
      const n: XY = [(-(b[1] - a[1]) / L) * s, ((b[0] - a[0]) / L) * s];
      if (inPoly(SEA, p[0] + n[0] * 120, p[1] + n[1] * 120)) return [p[0] + n[0] * d, p[1] + n[1] * d];
    }
    return p;
  };
  const nearShore = SHORE.filter(([x, y]) => Math.abs(x) < R + 1200 && Math.abs(y) < R + 1200);
  f.blockBand(nearShore.map((p) => seaward(p, 160)), 340, { kind: "sea", step: 220 });
  for (const part of pieces(RIVER, [BR.at], 170)) f.blockBand(part, RW - 40, { step: 220 });
  f.blockBand([...POOL, POOL[0]], 170, { step: 200 });
  f.blockDisc(POOL_C, 480);

  // ---- ways out ----
  f.exit("yodia", E_EXIT, [1800, -4400]);
  f.exit("royal_necropolis", N_EXIT, [4400, -3320]);

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const wet = (x: number, y: number, d: number) => inPoly(SEA, x, y) || toLine([x, y], SHORE) < d + 120 || toLine([x, y], RIVER) < RW / 2 + d || Math.hypot(x - POOL_C[0], y - POOL_C[1]) < 720 + d;
  const free = (x: number, y: number, r: number, gap = 0) =>
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    !wet(x, y, r * 0.5) && f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    take(at[0], at[1], r);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });
  const inBox = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, o: (s: number) => Parameters<typeof put>[3] = () => ({}), where = inBox, gap = 40) => {
    for (let i = 0, made = 0; i < n * 12 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!where(x, y) || nearTrack(x, y, rad + 230) || !free(x, y, rad, gap)) continue;
      const s = 0.8 + rnd() * 0.4;
      put(ref, [x, y], rnd() * 360, { s, ...o(s) });
      take(x, y, rad * s);
      made++;
    }
  };
  for (const t of TRACKS) for (let i = 0; i < t.length; i++) take(t[i][0], t[i][1], 200);
  take(BR.at[0], BR.at[1], 800);

  // ---- the royal avenue: lantern posts, the white elephants, the court's stairs ----
  const along = (pts: XY[], t: number): { at: XY; dir: XY } => {
    const i = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1))), a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return { at: a, dir: [(b[0] - a[0]) / L, (b[1] - a[1]) / L] };
  };
  for (let k = 1; k < 7; k++) {
    const { at, dir } = along(AVENUE, 0.12 + k * 0.1);
    for (const s of [-1, 1]) {
      const p: XY = [at[0] - dir[1] * s * 380, at[1] + dir[0] * s * 380];
      if (free(p[0], p[1], 40)) prop("yodia:lantern_post", p, rnd() * 360, 60, ring(18, "post"));
    }
  }
  prop("oldgrowth:white_elephant", [1150, -3050], 90, 320, { solid: [{ kind: "statue", x: 0, y: 0, w: 470, d: 224, rot: 0 }] });
  prop("oldgrowth:white_elephant", [-150, -3000], 90, 320, { solid: [{ kind: "statue", x: 0, y: 0, w: 470, d: 224, rot: 0 }] });
  put("ruins:temple_stairs", [(RC_E.top[0] + RC_E.bottom[0]) / 2, (RC_E.top[1] + RC_E.bottom[1]) / 2], runAlong(RC_E.top[0] - RC_E.bottom[0], RC_E.top[1] - RC_E.bottom[1]), { solid: "none" });
  put("ruins:temple_stairs", [(RC_W.top[0] + RC_W.bottom[0]) / 2, (RC_W.top[1] + RC_W.bottom[1]) / 2], runAlong(RC_W.top[0] - RC_W.bottom[0], RC_W.top[1] - RC_W.bottom[1]), { solid: "none" });
  for (const s of [-1, 1]) prop("ruins:guardian_statue", [RC_E.bottom[0] + s * 330, RC_E.bottom[1] - 200], 90, 120, { s: 0.95 });

  // ---- the banyan court: the sacred banyan, two more hung with cloths, offerings, a spirit house ----
  prop("oldgrowth:sacred_banyan", BANYAN, 0, 900, { s: 0.75, solid: [{ kind: "tree", x: 0, y: 0, r: 170 }] });
  prop("oldgrowth:sacred_banyan", [700, 1100], 140, 600, { s: 0.45, solid: [{ kind: "tree", x: 0, y: 0, r: 90 }] });
  prop("oldgrowth:sacred_banyan", [-1100, -800], 250, 600, { s: 0.45, solid: [{ kind: "tree", x: 0, y: 0, r: 90 }] });
  prop("oldgrowth:offering_shrine", [BANYAN[0] + 500, BANYAN[1] - 650], 30, 180, { solid: [{ kind: "table", x: 0, y: 0, w: 160, d: 220, rot: 0 }] });
  prop("oldgrowth:offering_shrine", [BANYAN[0] - 300, BANYAN[1] + 850], 200, 180, { solid: [{ kind: "table", x: 0, y: 0, w: 160, d: 220, rot: 0 }] });
  prop("yodia:spirit_house", [800, -700], 60, 100, ring(40, "post"));
  prop("oldgrowth:root_chedi", [-1100, 900], 30, 380, { s: 0.6, solid: [{ kind: "chedi", x: 0, y: 0, w: 520, d: 520, rot: 0 }] });

  // ---- the royal mound: the old chedi in the roots, offerings ----
  prop("oldgrowth:root_chedi", MOUND_TOP, 10, 500, { solid: [{ kind: "chedi", x: 0, y: 0, w: 520, d: 520, rot: 0 }] });
  prop("oldgrowth:offering_shrine", [MOUND_TOP[0] - 550, MOUND_TOP[1] - 300], 0, 180, { s: 0.9, solid: [{ kind: "table", x: 0, y: 0, w: 160, d: 220, rot: 0 }] });
  prop("oldgrowth:white_elephant", [MOUND_TOP[0] - 400, MOUND_TOP[1] + 600], 150, 300, { s: 0.7, solid: [{ kind: "statue", x: 0, y: 0, w: 470, d: 224, rot: 0 }] });

  // ---- the river of lanterns: the landing with its sala, lanterns floating down to the sea, the
  // sacred pool, the stone bridge ----
  prop("yodia:sala", [LANDING[0] - 500, LANDING[1] - 300], 90, 400, { solid: [{ kind: "sala", x: 0, y: 0, w: 640, d: 440, rot: 0 }] });
  prop("oldgrowth:offering_shrine", [LANDING[0] + 350, LANDING[1] - 350], 90, 150, { s: 0.8, solid: [{ kind: "table", x: 0, y: 0, w: 160, d: 220, rot: 0 }] });
  for (const g of [[-450, 3100], [400, 3330], [1700, 3280], [-1500, 2970], [-2600, 2820], [-3500, 3050]] as XY[]) put("oldgrowth:lantern_float", nearestOn(RIVER, g).at, rnd() * 360, { z: -13, s: 0.8 + rnd() * 0.3, solid: "none" });
  for (const g of [[2600, 2700], [2900, 3150]] as XY[]) put("oldgrowth:lantern_float", g, rnd() * 360, { z: -13, s: 0.9, solid: "none" });
  put("westmount:slab_bridge", BR.at, runAlong(bax[0], bax[1]), { solid: SLAB_BRIDGE_SOLIDS });
  prop("oldgrowth:banyan", [3500, 3600], 40, 500, { s: 0.8, solid: [{ kind: "tree", x: 0, y: 0, r: 70 }] });
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2, at: XY = [POOL_C[0] + Math.cos(a) * 820, POOL_C[1] + Math.sin(a) * 680];
    if (nearTrack(at[0], at[1], 280)) continue;
    put(k % 3 === 0 ? "plains:flat_rock" : "jungle:reeds", at, rnd() * 360, { s: 0.7 + rnd() * 0.3, solid: "none" });
  }

  // ---- the shore woods: chedis in the roots above the sea ----
  for (const [at, h, s] of [[[-800, 4300], 40, 0.75], [[1800, 4500], 200, 0.65], [[-2600, 3900], 110, 0.6]] as [XY, number, number][])
    if (free(at[0], at[1], 280 * s)) prop("oldgrowth:root_chedi", at, h, 420 * s, { s, solid: [{ kind: "chedi", x: 0, y: 0, w: 520, d: 520, rot: 0 }] });
  for (const [at, h, s] of [[[-3200, -1200], 60, 0.7], [[3300, -4300], 150, 0.6], [[-1900, -4000], 230, 0.55], [[4200, 4300], 20, 0.6]] as [XY, number, number][])
    if (free(at[0], at[1], 280 * s)) prop("oldgrowth:root_chedi", at, h, 420 * s, { s, solid: [{ kind: "chedi", x: 0, y: 0, w: 520, d: 520, rot: 0 }] });

  // ---- the ways out ----
  prop("jungle:trail_sign", [2350, -4700], towards(0.3, -1), 90, ring(20, "post"));
  prop("jungle:trail_sign", [4700, -3800], towards(1, 0), 90, ring(20, "post"));
  for (const s of [-1, 1]) prop("yodia:guardian_post", [1965 + s * 420, -4800], -90, 80, ring(30, "post"));

  // ---- the woods: banyans on their root pillars, palms toward the shore, jungle toward Yodia,
  // stone guardians fallen among the roots, glowing caps ----
  const BANYANS: [XY, number, number][] = [[[-2600, -1800], 30, 0.9], [[2200, -1700], 150, 0.8], [[-2800, 1300], 300, 0.85], [[4300, -1600], 80, 0.75], [[-3800, -500], 200, 0.7], [[1600, 2200], 10, 0.75], [[-600, -4200], 120, 0.75], [[3200, 4300], 260, 0.7]];
  for (const [at, h, s] of BANYANS) if (free(at[0], at[1], 300)) prop("oldgrowth:banyan", at, h, 650 * s, { s, solid: [{ kind: "tree", x: 0, y: 0, r: 90 * s }] });
  scatter("oldgrowth:banyan", [0, 0], 5200, 5, 300, (s) => ({ s: s * 0.7, solid: [{ kind: "tree", x: 0, y: 0, r: 60 * s }] }), inBox, 250);
  scatter("jungle:strangler_fig", [0, 0], 5200, 3, 400, (s) => ({ s: s * 0.8, solid: [{ kind: "tree", x: 0, y: 0, r: 120 * s }] }), inBox, 200);
  scatter("ruins:root_tangle", [0, 0], 5200, 8, 180, () => ({ solid: [{ kind: "ruin", x: 0, y: 0, w: 260, d: 150, rot: 0 }] }));
  scatter("jungle:ruin_pillars", [0, 0], 5000, 6, 200, () => ({}));
  scatter("oldgrowth:glow_shrooms", [0, 0], 5200, 6, 150, () => ({ solid: "none" }));
  scatter("oldgrowth:moss_boulders", [0, 0], 5200, 4, 230, (s) => ring(170 * s));
  scatter("jungle:giant_fern", [0, 0], 5300, 34, 90, () => ({ solid: "none" }));
  scatter("jungle:elephant_ear", [0, 0], 5300, 26, 80, () => ({ solid: "none" }));
  scatter("flora:JungleBush", [0, 0], 5300, 30, 80, () => ({ solid: "none" }));
  scatter("jungle:vine_tree", [0, 0], 5200, 10, 260, () => ({ solid: [{ kind: "tree", x: 0, y: 0, r: 50 }] }));
  scatter("flora:PalmBent", [-3500, 1200], 1800, 8, 160, () => ({}));
  scatter("flora:Palm", [-1000, 4300], 1500, 6, 160, () => ({}));
  for (let i = 0; i < 900; i++) {
    const x = (rnd() - 0.5) * 2 * (R - 150), y = (rnd() - 0.5) * 2 * (R - 150), edge = Math.min(R - Math.abs(x), R - Math.abs(y));
    if (rnd() > (edge < 700 ? 0.85 : edge < 1300 ? 0.35 : 0.06) || nearTrack(x, y, 420) || !free(x, y, 180, 140)) continue;
    const k = rnd(), kind = y < -3800 ? (k < 0.5 ? "flora:JungleTree" : k < 0.75 ? "flora:PalmTall" : "flora:Bamboo") : x > 3800 ? (k < 0.5 ? "flora:JungleTree" : k < 0.8 ? "flora:BigOak" : "jungle:vine_tree") : k < 0.55 ? "flora:JungleTree" : k < 0.8 ? "jungle:vine_tree" : "flora:PalmTall";
    prop(kind, [x, y], rnd() * 360, 200, { s: 0.8 + rnd() * 0.35, solid: kind === "jungle:vine_tree" ? [{ kind: "tree", x: 0, y: 0, r: 50 }] : "auto" });
  }
  const MIST: [XY, number, number][] = [[[2700, 2900], 30, 0.8], [[-1500, -3600], 60, 0.8], [[-2600, 1300], 0, 0.7], [[4300, -1800], 100, 0.7], [[200, 4300], 20, 0.7]];
  for (const [at, h, s] of MIST) put("westmount:mist_bank", at, h, { solid: "none", s });

  // ---- past the edge: the jungle toward Yodia and on the high woods under the necropolis, palms on
  // the shore, nothing on the sea ----
  const onTrack = (x: number, y: number) => [[0, 0], [300, 0], [-300, 0], [0, 300], [0, -300]].some(([dx, dy]) => ground.kind(x + dx, y + dy) === 1);
  const inside = (x: number, y: number) => Math.abs(x) < R + 300 && Math.abs(y) < R + 300;
  const atSea = (x: number, y: number) => inPoly(SEA, x, y) || toLine([x, y], SHORE) < 250;
  f.woods(area, ["JungleTree", "JungleTree", "PalmTall", "Bamboo", "JungleTree", "BigOak", "JungleBush"], (x, y) => inside(x, y) || onTrack(x, y) || atSea(x, y) || f.h(x, y) > 100, { count: 420, spacing: 380, tries: 8000 });
  f.woods(area, ["Pine", "JungleTree", "BigOak", "JungleTree"], (x, y) => onTrack(x, y) || atSea(x, y) || f.h(x, y) < 600, { count: 200, spacing: 420, tries: 5000 });
  f.woods(area, ["banyan"], (x, y) => inside(x, y) || onTrack(x, y) || atSea(x, y) || f.h(x, y) > 100 || Math.abs(x) > 7000 || Math.abs(y) > 7000 || (Math.abs(x) < R + 900 && Math.abs(y) < R + 900), { count: 6, spacing: 2000, tries: 2000, kit: "oldgrowth" });
  f.woods(area, ["PalmBent", "Palm"], (x, y) => inside(x, y) || atSea(x, y) || toLine([x, y], SHORE) > 900, { count: 60, spacing: 420, tries: 3000 });

  // ---- monsters: the glades, the court, the mound ----
  const KEEPER: XY = [BANYAN[0] + 700, BANYAN[1] + 100], MOURNER: XY = [LANDING[0] + 150, LANDING[1] - 150];
  const quiet = (x: number, y: number) => Math.hypot(x - KEEPER[0], y - KEEPER[1]) < 700 || Math.hypot(x - MOURNER[0], y - MOURNER[1]) < 600;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 820, max: 50, keepOut: quiet });

  const npcs: NpcSpec[] = [
    { id: "banyan_keeper", x: KEEPER[0], y: KEEPER[1], face: -60, name: "ยายเพ็ญ", title: "ผู้เฝ้าลานไทรศักดิ์สิทธิ์", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "amber", top: "top_priestess_white", bottom: "bottom_priestess_white" },
      lines: [
        "ไทรต้นนี้ปลูกในวันที่กษัตริย์องค์แรกสวรรคต ผ้าแพรสามสีพันไว้ทุกปีไม่เคยขาด",
        "ช้างเผือกที่เคยทรงพระองค์ยังเดินอยู่ในป่านี้ ร่างโปร่งแสงอย่างกับหมอก อย่าขวางทางมันเชียว",
        "ทางตะวันออกกลับไปโยเดีย ทางเหนือขึ้นไปสุสานหลวงโบราณ ที่ที่พระองค์ทรงบรรทมอยู่",
      ] },
    { id: "banyan_mourner", x: MOURNER[0], y: MOURNER[1], face: 90, name: "แก้วตา", title: "หญิงสาวผู้ลอยโคม", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "ink", eyes: "violet", top: "top_lilac", bottom: "bottom_wine" },
      lines: [
        "ทุกคืนเดือนเพ็ญ คนจากโยเดียจะมาลอยกระทงที่ท่านี้ ให้แสงเทียนนำทางดวงวิญญาณลงทะเล",
        "ทวารบาลหินเฝ้าเจดีย์ในรากไทร ใครเข้าใกล้มันจะยกกระบองขึ้นทันที",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [moss.mesh, sand.mesh, sea, riverBed, riverSheet, poolBed, pool],
    sky: "#7e9a86",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && moss.kind(x, y) !== 0 && sand.kind(x, y) !== 0 && f.h(x, y) < 120 && !wet(x, y, 250), density: 0.08 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 1800, y: -4500 },
    npcs,
    labels: [
      { x: E_EXIT[0], y: E_EXIT[1] + 250, text: "ทางไปโยเดีย", kind: "gate" },
      { x: N_EXIT[0] - 200, y: N_EXIT[1], text: "ทางไปสุสานหลวงโบราณ", kind: "gate" },
      { x: BANYAN[0] - 900, y: BANYAN[1], text: "ลานไทรศักดิ์สิทธิ์" },
      { x: 500, y: -3400, text: "ช้างเผือกคู่", kind: "small" },
      { x: 1500, y: -4100, text: "ถนนหลวงโบราณ", kind: "small" },
      { x: MOUND_TOP[0] - 700, y: MOUND_TOP[1], text: "เนินเจดีย์หลวง" },
      { x: LANDING[0] - 200, y: LANDING[1] + 300, text: "ท่าลอยโคม", kind: "small" },
      { x: -1500, y: 3300, text: "แม่น้ำลอยโคม" },
      { x: POOL_C[0] - 900, y: POOL_C[1] - 300, text: "สระน้ำศักดิ์สิทธิ์", kind: "small" },
      { x: -800, y: 4500, text: "เจดีย์ริมทะเล", kind: "small" },
    ],
  });
}

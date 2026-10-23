// ป่าโบราณ (the ancient forest), monsters Lv 62-74: the old wood west of Noa, where the elder
// trees have stood since before Noa was a capital. Trunks two to five metres through rise on
// plank buttresses out of a floor of thick moss, their canopies far overhead; fallen giants lie
// where they came down and the tracks wind round them; glowing mushrooms light the shade.
//
// A clear stream runs through the middle from north to south. The road from Noa comes in on the
// east side, crosses it by a log bridge and goes on west to the mountain pass; a path follows the
// east bank north to the way up into the limestone country, with a second log bridge over to the
// west bank. Three rises stand out of the forest floor: in the north-east a hill with a higher
// step on it, where a mossy stone shrine of the Noa era stands under a giant; in the north-west a
// knoll carrying the greatest elder of all; in the south-west a rise where a ring of standing
// stones, gripped by the roots of an old hollow giant, keeps watch. In the south-east the ground
// sinks into a hollow that is never free of mist.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: east -> noa, west -> west_pass, north -> karst_peaks

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { KIT as WESTMOUNT, smooth, band, sheet, toLine, nearestOn, pieces, dense, towards, runAlong, rampOff, beyond } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as JUNGLE } from "./kits/jungle";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(WESTMOUNT, PLAINS, JUNGLE);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the stream: from the north edge down the middle to the south edge ----
const STREAM: XY[] = smooth([[A, 700], [5800, 300], [4200, 900], [2600, 600], [1200, -200], [-200, 300], [-1700, 900], [-3200, 500], [-4600, -300], [-6200, 200], [-A, -200]], 6);
const SW = 520; // its width

// ---- the rises ----
// the shrine hill (320) in the north-east and its top step (640) with the shrine
const HILL: XY[] = [[1800, -1500], [3000, -1150], [4400, -1500], [5600, -1600], [6200, -2600], [6000, -4400], [5200, -5600], [3600, -5900], [2200, -5300], [1500, -4000], [1300, -2600]];
const HILL_TOP: XY[] = [[3000, -2600], [4300, -2400], [5000, -3200], [4800, -4500], [3700, -4900], [2800, -4200]];
const R_HILL = rampOff([1300, -2600], [1800, -1500], [3000, -3000], 1000, 440);
const R_TOP = rampOff([2800, -4200], [3000, -2600], [4000, -3600], 960, 420);
// the knoll of the greatest elder (360) in the north-west
const KNOLL: XY[] = [[2300, 2300], [3300, 1900], [4600, 2200], [5600, 2000], [6400, 3000], [6300, 5000], [5200, 6000], [3600, 5900], [2400, 5000], [1900, 3700]];
const R_KNOLL = rampOff([1900, 3700], [2300, 2300], [4000, 3800], 1100, 440);
// the rise of the standing stones (300) in the south-west
const STONES: XY[] = [[-1700, 1700], [-1500, 3000], [-2100, 4400], [-3300, 4800], [-4600, 4300], [-4900, 3000], [-4300, 1800], [-3000, 1400]];
const R_STONES = rampOff([-1700, 1700], [-1500, 3000], [-3200, 3200], 1000, 440);
// ridges past the edge (scenery)
const RIDGES: { poly: XY[]; h: number }[] = [
  { poly: [[-A, -A], [-5900, -A], [-6100, -6200], [-6500, -4200], [-6100, -2000], [-A, -1700]], h: 650 },
  { poly: [[-A, A], [-A, 1500], [-6300, 2000], [-6000, 4300], [-6300, 6300], [-5000, A]], h: 720 },
  { poly: [[6900, -A], [A, -A], [A, -1700], [7300, -2100], [6700, -4500]], h: 820 },
  { poly: [[A, A], [6900, A], [6700, 6200], [7200, 3600], [A, 2500]], h: 900 },
];

const SHRINE: XY = [4000, -3550];
const GIANT: XY = [4250, 3850];
const CIRCLE: XY = [-3200, 3150];
const HOLLOW: XY = [-2700, -2400];

// the giants' solids (their trunks and the tall part of their buttresses)
const ELDER_SOLID = (r: number): { solid: SolidSpec[] } => ({ solid: [{ kind: "tree", x: 0, y: 0, r }] });
const FALLEN_SOLID: SolidSpec[] = [{ kind: "log", x: -15, y: 60, w: 300, d: 1700, rot: 0 }, { kind: "log", x: -50, y: -880, r: 320 }];
const SHRINE_SOLID: SolidSpec[] = [{ kind: "shrine", x: 0, y: 0, w: 760, d: 600, rot: 0 }, { kind: "post", x: -440, y: -250, r: 40 }, { kind: "post", x: -440, y: 250, r: 40 }];

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(304, {
    hills: [
      { x: HOLLOW[0], y: HOLLOW[1], r: 1600, h: -170 },
      { x: 1800, y: 1800, r: 800, h: -100 },
      { x: -4300, y: -3900, r: 1100, h: 110 },
      { x: -500, y: 4500, r: 1000, h: 90 },
      { x: 600, y: -3700, r: 700, h: 70 },
    ],
    plateaus: [
      { poly: dense(HILL), h: 320, ramps: [R_HILL] },
      { poly: dense(HILL_TOP), h: 640, ramps: [R_TOP] },
      { poly: dense(KNOLL), h: 360, ramps: [R_KNOLL] },
      { poly: dense(STONES), h: 300, ramps: [R_STONES] },
      ...RIDGES.map((r) => ({ poly: dense(r.poly, 900), h: r.h })),
    ],
    rock: "Westmount_CliffMoss",
  });
  const { put, rnd } = f;

  // ---- the crossings of the stream ----
  const cross = (guess: XY) => {
    const n = nearestOn(STREAM, guess);
    let ax: XY = [-n.dir[1], n.dir[0]];
    if (ax[1] < 0) ax = [-ax[0], -ax[1]];
    return { at: n.at, ax, off: (k: number): XY => [n.at[0] + ax[0] * k, n.at[1] + ax[1] * k] };
  };
  const B1 = cross([500, 50]), B2 = cross([3400, 760]);

  // ---- tracks ----
  const E_EXIT: XY = [-300, -5150], W_EXIT: XY = [800, 5150], N_EXIT: XY = [5150, -500];
  const MAIN: XY[] = [
    ...smooth([[-300, -7600], E_EXIT, [-700, -4200], [-300, -3000], [300, -2000], [200, -1200], B1.off(-750)]),
    ...smooth([B1.off(750), [700, 1500], [350, 2600], [700, 3800], W_EXIT, [900, 7600]]),
  ];
  const NORTH: XY[] = smooth([[200, -1200], [1200, -900], [2200, -700], [3400, -300], [4400, -500], N_EXIT, [7600, -400]]);
  const LOOP: XY[] = [...smooth([[3400, -300], B2.off(-650)]), ...smooth([B2.off(650), [3200, 1650], [2300, 2100], [1500, 2150], [800, 2350], beyond(R_KNOLL.top, R_KNOLL.bottom, 450)])];
  const SHRINE_WAY: XY[] = [
    beyond(R_HILL.top, R_HILL.bottom, 450), R_HILL.bottom, R_HILL.top,
    ...smooth([beyond(R_HILL.bottom, R_HILL.top, 350), [1750, -2700], beyond(R_TOP.top, R_TOP.bottom, 300)]), R_TOP.bottom, R_TOP.top,
    ...smooth([beyond(R_TOP.bottom, R_TOP.top, 350), [3400, -3500]]),
  ];
  const KNOLL_WAY: XY[] = [...smooth([[400, 2450], beyond(R_KNOLL.top, R_KNOLL.bottom, 450)]), R_KNOLL.bottom, R_KNOLL.top, ...smooth([beyond(R_KNOLL.bottom, R_KNOLL.top, 400), [3000, 3500], [3550, 3700]])];
  const STONES_WAY: XY[] = [...smooth([[450, 2150], beyond(R_STONES.top, R_STONES.bottom, 400)]), R_STONES.bottom, R_STONES.top, ...smooth([beyond(R_STONES.bottom, R_STONES.top, 350), [-2300, 2700], [-2750, 2950]])];
  const HOLLOW_WAY: XY[] = smooth([[-300, -3000], [-1300, -2950], [-2300, -2500], [-2900, -1600], [-2400, -800]]);
  const TRACKS = [MAIN, NORTH, LOOP, SHRINE_WAY, KNOLL_WAY, STONES_WAY, HOLLOW_WAY];
  const roads = TRACKS.map((t, i) => band(t, i === 0 ? 470 : i === 1 ? 430 : 380));

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const water = band(STREAM, SW);
  const ground = f.ground({ area, roads, plazas: [], water: [water], base: "jungle", road: [0.64, 0.53, 0.44], tint: "#e4ead8" });

  // ---- the stream: clear water over a dark bed, solids along it but at the bridges ----
  const bed = sheet(band(STREAM, SW + 160), -60, "Westmount_Soil");
  const stream = sheet(band(STREAM, SW + 120), -14, "Westmount_Stream");
  for (const part of pieces(STREAM, [B1.at, B2.at], 150)) f.blockBand(part, SW + 60, { step: 230 });
  const bridgeSolid: { solid: SolidSpec[] } = { solid: [{ kind: "rail", x: 0, y: -128, w: 1000, d: 16, rot: 0 }, { kind: "rail", x: 0, y: 128, w: 1000, d: 16, rot: 0 }] };
  put("westmount:log_bridge", B1.at, runAlong(B1.ax[0], B1.ax[1]), bridgeSolid);
  put("westmount:log_bridge", B2.at, runAlong(B2.ax[0], B2.ax[1]), bridgeSolid);

  // ---- ways out ----
  f.exit("noa", E_EXIT, [-450, -4400]);
  f.exit("west_pass", W_EXIT, [750, 4450]);
  f.exit("karst_peaks", N_EXIT, [4450, -470]);

  // ---- placing things: clear of tracks, water, cliffs and each other ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const wet = (x: number, y: number, d: number) => toLine([x, y], STREAM) < SW / 2 + d;
  const free = (x: number, y: number, r: number, gap = 0) =>
    Math.abs(x) < A - 300 && Math.abs(y) < A - 300 &&
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    !wet(x, y, r * 0.5) && f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    take(at[0], at[1], r);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] });
  const inBox = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  // a few of a piece within r of c
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, o: (s: number) => Parameters<typeof put>[3] = () => ({}), inside = inBox) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inside(x, y) || nearTrack(x, y, rad + 230) || !free(x, y, rad, 40)) continue;
      const s = 0.8 + rnd() * 0.4;
      put(ref, [x, y], rnd() * 360, { s, ...o(s) });
      take(x, y, rad * s);
      made++;
    }
  };
  for (const t of TRACKS) for (let i = 0; i < t.length; i += 2) take(t[i][0], t[i][1], 180);
  take(B1.at[0], B1.at[1], 600);
  take(B2.at[0], B2.at[1], 600);

  // ---- the shrine on the hill's top step, a giant behind it ----
  const shrineH = towards(R_TOP.top[0] - SHRINE[0], R_TOP.top[1] - SHRINE[1]);
  prop("westmount:noa_shrine", SHRINE, shrineH, 560, { solid: SHRINE_SOLID });
  prop("westmount:elder_tree", [4550, -4450], 200, 600, ELDER_SOLID(520));
  for (const [at, h] of [[[3300, -2900], 30], [[3400, -4300], -40]] as [XY, number][]) prop("westmount:root_stone", at, h, 110, { s: 0.75, ...ring(70) });
  prop("westmount:glow_mushrooms", [4700, -3100], 40, 180, ring(90, "plant"));
  prop("westmount:moss_mound", [3900, -4500], 70, 220, ring(150));
  prop("westmount:mist_bank", [3600, -3000], 30, 0, { solid: "none", s: 0.6 });

  // ---- the greatest elder on its knoll ----
  prop("westmount:elder_tree", GIANT, 60, 900, { s: 1.3, ...ELDER_SOLID(520) });
  for (const [at, h] of [[[3200, 4400], 0], [[5200, 3300], 120]] as [XY, number][]) prop("westmount:glow_mushrooms", at, h, 180, ring(90, "plant"));
  prop("westmount:moss_mound", [3100, 2900], 20, 220, ring(150));
  prop("westmount:fallen_giant", [5000, 4700], 120, 0, { solid: FALLEN_SOLID, s: 0.8 });
  take(5000, 4700, 900);

  // ---- the ring of standing stones about a great rune stone, the old hollow giant over them ----
  prop("westmount:root_stone", CIRCLE, 200, 200, { s: 1.45, ...ring(90) });
  prop("westmount:glow_mushrooms", [CIRCLE[0] - 450, CIRCLE[1] + 250], 30, 0, { solid: "none", s: 0.7 });
  prop("westmount:elder_tree_old", [-2650, 4150], -60, 900, { s: 0.95, ...ELDER_SOLID(560) });
  for (let k = 0; k < 8; k++) {
    if (k === 1 || k === 7) continue; // (where the giant stands in the ring, and the gap where the path comes in)
    const a = (k / 8) * Math.PI * 2 + 0.35, at: XY = [CIRCLE[0] + Math.cos(a) * 1150, CIRCLE[1] + Math.sin(a) * 1150];
    put("westmount:root_stone", at, (a * 180) / Math.PI + 180, { s: 0.85 + (k % 3) * 0.08, ...ring(70) });
  }
  take(CIRCLE[0], CIRCLE[1], 1300);
  prop("westmount:mist_bank", [-3800, 2600], 70, 0, { solid: "none", s: 0.7 });

  // ---- the misty hollow: a fallen giant, mushrooms, mist ----
  prop("westmount:fallen_giant", [-2300, -3400], 20, 0, { solid: FALLEN_SOLID });
  take(-2300, -3400, 1000);
  for (const [at, h, s] of [[[-2600, -2200], 10, 1.1], [[-3300, -1600], 60, 0.9], [[-3100, -3000], 160, 1], [[-3800, -2500], 90, 0.8]] as [XY, number, number][])
    put("westmount:mist_bank", at, h, { solid: "none", s });
  for (const at of [[-2000, -2300], [-3500, -2000], [-2900, -2700], [-1700, -1900]] as XY[]) if (free(at[0], at[1], 160)) prop("westmount:glow_mushrooms", at, rnd() * 360, 180, ring(90, "plant"));

  // ---- the fallen giant by the road ----
  prop("westmount:fallen_giant", [-2200, -4250], 20, 0, { solid: FALLEN_SOLID, s: 0.9 });
  take(-2200, -4250, 900);

  // ---- the elders over the forest floor ----
  const ELDERS: [XY, string, number][] = [
    [[-2100, -1700], "elder_tree", 1.0], [[-3800, -3700], "elder_tree_old", 0.95], [[-1100, -1500], "elder_tree", 0.85],
    [[700, -3900], "elder_tree", 0.9], [[5100, 1250], "elder_tree", 0.9], [[-4600, -1600], "elder_tree", 1.0],
    [[-4700, 700], "elder_tree_old", 0.9], [[-300, 4300], "elder_tree", 1.0], [[-1000, 1700], "elder_tree", 0.8],
    [[2700, -4600], "elder_tree", 0.9], [[1800, 900], "elder_tree", 0.8],
  ];
  for (const [at, kind, s] of ELDERS) {
    if (!f.level(at[0], at[1], 450) || nearTrack(at[0], at[1], 650) || wet(at[0], at[1], 500) || taken.some(([tx, ty, tr]) => Math.hypot(tx - at[0], ty - at[1]) < tr + 400)) continue;
    prop(`westmount:${kind}`, at, rnd() * 360, 700 * s, { s, ...ELDER_SOLID(kind === "elder_tree" ? 520 : 560) });
  }

  // ---- the stream's banks: ferns, reeds, flat rocks, mist over the water ----
  for (let i = 2; i < STREAM.length - 2; i += 2) {
    const [ax, ay] = STREAM[i], [bx, by] = STREAM[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
    for (const s of [-1, 1]) {
      if (rnd() < 0.3) continue;
      const o = SW / 2 + 60 + rnd() * 120, x = ax - ((by - ay) / L) * s * o, y = ay + ((bx - ax) / L) * s * o;
      if (!inBox(x, y) || nearTrack(x, y, 300) || !f.level(x, y, 100) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + 80)) continue;
      const k = rnd();
      if (k < 0.35) prop("plains:reeds", [x, y], rnd() * 360, 80);
      else if (k < 0.6) prop("plains:flat_rock", [x, y], rnd() * 360, 160, { s: 0.6 + rnd() * 0.3 });
      else prop("plains:fern_clump", [x, y], rnd() * 360, 80, { s: 1 + rnd() * 0.3 });
    }
  }
  for (const [at, h, s] of [[[-3900, 0], 70, 0.8], [[2000, 400], 110, 0.7], [[4800, 600], 80, 0.7], [[-5200, -100], 100, 0.9]] as [XY, number, number][]) put("westmount:mist_bank", at, h, { solid: "none", s });
  prop("westmount:mist_bank", [1800, 1800], 40, 0, { solid: "none", s: 0.8 });

  // ---- the ways out: signs ----
  prop("plains:signpost", [-650, -4800], 0, 80, ring(30, "post"));
  prop("westmount:root_stone", [100, -4900], 30, 110, { s: 0.6, ...ring(55) });
  prop("plains:signpost", [1150, 4800], 180, 80, ring(30, "post"));
  prop("westmount:prayer_cairn", [350, 4850], 20, 140, { s: 0.6, solid: [{ kind: "rock", x: 0, y: 0, r: 80 }] });
  prop("plains:signpost", [4900, -900], -90, 80, ring(30, "post"));
  prop("plains:milestone", [4900, -100], 90, 60, ring(30, "post"));

  // ---- rocks, stumps, fallen logs over the floor ----
  const ROCKS: [string, XY, number][] = [
    ["plains:boulder", [-4400, -4600], 170], ["jungle:boulder_mossy", [-900, -3700], 170], ["plains:rock_cluster", [1400, -500], 200],
    ["jungle:boulder_mossy", [-4100, 1300], 170], ["plains:boulder", [-1800, 4800], 170], ["plains:rock_cluster", [2300, 4300], 200],
    ["jungle:boulder_mossy", [4800, 2600], 170], ["plains:boulder", [3700, 1200], 170], ["plains:rock_cluster", [-4900, -2900], 200],
    ["plains:boulder", [2000, -3400], 170], ["jungle:boulder_mossy", [-3100, 4300], 170], ["plains:boulder", [-500, 3300], 170],
    ["plains:rock_cluster", [5000, -2800], 200], ["jungle:boulder_mossy", [-1300, -4900], 170],
  ];
  for (const [ref, at, r] of ROCKS) if (free(at[0], at[1], r * 0.7)) prop(ref, at, rnd() * 360, r, ring(r * 0.75));
  for (const [ref, at, h] of [["plains:fallen_log", [-4200, 3600], 30], ["jungle:fallen_log", [2900, 5000], 100], ["plains:fallen_log", [-4900, -700], 160], ["jungle:fallen_log", [4400, -2000], 60], ["plains:fallen_log", [1200, 3300], 10]] as [string, XY, number][])
    if (free(at[0], at[1], 200)) prop(ref, at, h, 300);
  scatter("jungle:stump", [0, 0], 5000, 10, 100, () => ring(55, "stump"));
  scatter("plains:stump", [0, 0], 5000, 6, 100, () => ring(55, "stump"));

  // ---- the old forest's lesser trees, in groves between the giants ----
  const KINDS = ["BigOak", "BigOak", "RoundTree", "JungleTree", "RoundTree"];
  const grove = (c: XY, r: number, n: number) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inBox(x, y) || nearTrack(x, y, 420) || !free(x, y, 200, 160)) continue;
      put(`flora:${KINDS[Math.floor(rnd() * KINDS.length)]}`, [x, y], rnd() * 360, { s: 0.95 + rnd() * 0.45 });
      take(x, y, 220);
      made++;
    }
  };
  for (const [c, r, n] of [
    [[-4300, -4500], 900, 5], [[-1200, -3600], 700, 3], [[1500, -4900], 600, 3], [[-3600, -900], 800, 4], [[-1500, 400], 600, 2],
    [[-4700, 1800], 600, 3], [[-2600, 5000], 600, 3], [[-800, 2600], 500, 2], [[1800, 2900], 500, 2], [[2600, 1700], 400, 2],
    [[3400, 5200], 600, 3], [[5000, 5000], 500, 2], [[2500, -1900], 500, 2], [[4700, -1700], 400, 2], [[-4800, 4600], 500, 3],
    [[5100, -5000], 500, 2], [[1600, 4800], 500, 2], [[-2400, 1200], 400, 2], [[3900, 2600], 400, 2], [[-5000, -2200], 500, 3],
  ] as [XY, number, number][]) grove(c, r, n);

  // ---- the floor: moss mounds, ferns, glowing mushrooms ----
  scatter("westmount:moss_mound", [0, 0], 5200, 22, 200, (s) => ring(150 * s));
  scatter("westmount:glow_mushrooms", [0, 0], 5200, 12, 160, () => ring(90, "plant"));
  scatter("jungle:giant_fern", [0, 0], 5200, 26, 110, () => ({ solid: "none" }));
  scatter("jungle:tree_fern", [0, 0], 5200, 10, 90, () => ring(30, "plant"));
  scatter("plains:fern_clump", [0, 0], 5300, 70, 70, () => ({ solid: "none" }));
  scatter("flora:Bush", [0, 0], 5200, 16, 90, () => ({ solid: "none" }));

  // ---- past the edge: elders standing over thick woods, on the ridges too ----
  const onTrack = (x: number, y: number) => [[0, 0], [300, 0], [-300, 0], [0, 300], [0, -300]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const outside = (x: number, y: number) => !(Math.abs(x) < R + 300 && Math.abs(y) < R + 300);
  for (let i = 0, made = 0; i < 400 && made < 18; i++) {
    const x = (rnd() - 0.5) * 2 * (A - 600), y = (rnd() - 0.5) * 2 * (A - 600);
    if (!outside(x, y) || Math.max(Math.abs(x), Math.abs(y)) < R + 1200 || onTrack(x, y) || wet(x, y, 400) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + 1200)) continue;
    put(`westmount:${rnd() < 0.7 ? "elder_tree" : "elder_tree_old"}`, [x, y], rnd() * 360, { solid: "none", s: 0.9 + rnd() * 0.35 });
    take(x, y, 600);
    made++;
  }
  f.woods(area, ["BigOak", "BigOak", "RoundTree", "JungleTree", "RoundTree", "SmallTree"], (x, y) => !outside(x, y) || onTrack(x, y) || wet(x, y, 150) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr), { count: 420, spacing: 430, tries: 7000 });
  for (let i = 0; i < 160; i++) {
    const x = (rnd() - 0.5) * 2 * A, y = (rnd() - 0.5) * 2 * A;
    if (!outside(x, y) || onTrack(x, y) || wet(x, y, 80) || !f.level(x, y, 80)) continue;
    put(rnd() < 0.6 ? "plains:fern_clump" : "jungle:giant_fern", [x, y], rnd() * 360, { solid: "none", s: 1.2 });
  }

  // ---- monsters ----
  const quiet = (x: number, y: number) => Math.hypot(x - SHRINE[0], y - SHRINE[1]) < 800 || Math.hypot(x - B1.at[0], y - B1.at[1]) < 700;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 780, keepOut: quiet });

  // ---- people ----
  const npcs: NpcSpec[] = [
    { id: "elder_forest_keeper", x: SHRINE[0] - 800, y: SHRINE[1] + 250, face: 20, name: "อีเลียน่า", title: "ผู้เฝ้าศาลป่าโบราณ", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "mint", eyes: "teal", top: "top_priestess_forest", bottom: "bottom_priestess_forest" },
      lines: [
        "ศาลนี้สร้างไว้ตั้งแต่โนอายังเป็นเมืองหลวง ตอนนั้นต้นไม้พวกนี้ยังไม่สูงเท่าวันนี้เลย",
        "อักษรรูนบนหินตั้งยังเรืองแสงอยู่ทุกคืน คนโบราณเชื่อว่ามันเฝ้าป่านี้ไว้แทนพวกเขา",
        "เห็ดเรืองแสงพวกนั้นงามก็จริง แต่อย่าเก็บไปกินเชียวนะ",
      ] },
    { id: "elder_forest_herbalist", x: 900, y: -1500, face: -60, name: "ลุงโทมัส", title: "คนเก็บสมุนไพรแห่งป่าโบราณ", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "หมอกในแอ่งทางใต้ไม่เคยจางเลยสักวัน เข้าไปแล้วจำทางกลับให้ดี",
        "ทางตะวันตกขึ้นช่องเขาไปซูโจว ทางเหนือเลียบลำธารขึ้นไปภูผาหินปูน สองทางนั้นอันตรายกว่าป่านี้มาก",
        "ต้นไม้ยักษ์บนเนินฝั่งตะวันตกว่ากันว่าอายุพันปี แก่กว่าโนอาเสียอีก",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [bed, stream],
    sky: "#2c4330",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -500, y: -4250 },
    npcs,
    labels: [
      { x: E_EXIT[0] + 150, y: E_EXIT[1] + 200, text: "ทางไปโนอา", kind: "gate" },
      { x: W_EXIT[0] - 150, y: W_EXIT[1] - 200, text: "ทางไปช่องเขาตะวันตก", kind: "gate" },
      { x: N_EXIT[0] - 200, y: N_EXIT[1], text: "ทางไปภูผาหินปูน", kind: "gate" },
      { x: SHRINE[0] - 600, y: SHRINE[1], text: "ศาลหินยุคโนอา" },
      { x: GIANT[0] - 900, y: GIANT[1], text: "ต้นไม้ยักษ์พันปี" },
      { x: CIRCLE[0] + 1400, y: CIRCLE[1], text: "วงหินรากไม้" },
      { x: HOLLOW[0], y: HOLLOW[1], text: "แอ่งหมอก" },
      { x: B1.at[0] - 300, y: B1.at[1] - 400, text: "สะพานซุง", kind: "small" },
      { x: -3700, y: 700, text: "ลำธารใส", kind: "small" },
      { x: -2200, y: -3800, text: "ซากต้นไม้ยักษ์ล้ม", kind: "small" },
    ],
  });
}


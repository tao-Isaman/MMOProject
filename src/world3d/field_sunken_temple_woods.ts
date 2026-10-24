// ป่าวิหารจม (the sunken temple woods), monsters Lv 170-180: banyan woods on the sea south of the
// lagoon marsh that have swallowed a temple of the old kingdom and are taking it down into the
// brackish water. The banyans stand on pillars of their own roots, strands of root hang from them
// into the pools, glowing mushrooms grow in their shade; the sea runs along the south and the east,
// the wraiths of the banyan roots drift low over the water and great red octopuses crawl up out of
// it over the roots.
//
// The way in from the lagoon (north) comes down through the woods, under an arch of roots, to the
// temple's gate. From the gate a stone causeway runs south across the flooded court, its pillars
// standing in the water either side, to the stairs up the temple terrace (3 m), where the old
// sanctuary stands with a banyan grown over its tower. West of the court, up a mound (3 m), a great
// stone face gripped by roots looks out over the woods. The lagoon's drainage channel comes in over
// the north edge and runs down the east side to the sea, a plank bridge over it to the marsh of
// banyans and brackish pools between it and the shore, where a drowned shrine stands; the court
// drains west in a brook that winds out over the west edge to the rice terraces' stream. A path
// runs from the court down to the mud flats of the south-east shore, where a stone barge lies
// stranded in the shallows.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   way out: north -> lagoon_marsh

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, seeded } from "./town";
import { KIT as OLDGROWTH, seaSheet } from "./kits/oldgrowth";
import { KIT as WESTMOUNT, smooth, band, blob, inPoly, toLine, nearestOn, pieces, dense, towards, runAlong, rampOff, beyond, sheet } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import { KIT as JUNGLE } from "./kits/jungle";
import { KIT as RUINS } from "./kits/ruins";
import { blobPoly } from "./kits/snowland";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(OLDGROWTH, WESTMOUNT, JUNGLE, RUINS);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the sea: the shore from the west edge (where the rice terraces' beach comes round) east
// along the south, round the south-east and north up the east side to the north edge ----
const SHORE: XY[] = smooth([
  [-6200, A + 400], [-6050, 6676], [-5400, 5500], [-4900, 4200], [-4600, 2800], [-4500, 1200], [-4600, -300], [-4300, -1600],
  [-3600, -2800], [-2600, -3700], [-1200, -4300], [500, -4600], [2200, -4800], [3800, -4900], [5000, -5100], [5800, -5400], [6676, -5600], [A + 400, -5700],
], 3);
const SEA: XY[] = [...SHORE, [A + 400, -A - 400], [-A - 400, -A - 400], [-A - 400, A + 400]];

// ---- the water inland: the lagoon's channel down the east side, the flooded court either side of
// the causeway, the brook west to the rice terraces, brackish pools ----
const CHANNEL: XY[] = smooth([[A + 400, -1750], [6676, -1760], [5600, -1800], [4500, -2200], [3300, -2900], [2300, -3700], [1700, -4700]], 5);
const CW = 420;
const COURT_E: XY[] = [[100, -300], [1900, -300], [1900, 400], [100, 400]];
const COURT_W: XY[] = [[100, 900], [1900, 900], [1900, 1600], [100, 1600]];
const BROOK: XY[] = smooth([[700, 1600], [550, 2300], [150, 3000], [-600, 3650], [-1500, 4250], [-2400, 4850], [-2950, 5600], [-3050, 6676], [-3150, A + 400]], 5);
const BW = 360;
const POOLS: XY[][] = [blob([4400, -3600], 650, 480, 1), blob([2900, -4100], 420, 380, 2), blob([4700, 2600], 600, 480, 3), blob([4200, 4300], 480, 420, 4), blob([-3400, 3300], 620, 470, 5), blob([-2600, -1900], 520, 420, 6)];

// ---- the levels ----
// T: the temple terrace, its stairs up from the causeway's south end; F: the face mound. Past
// the edges: the lagoon's wooded banks run on beyond the north edge, east of the channel.
const T: XY[] = [[-1200, -500], [-1150, 1800], [-2200, 2100], [-3300, 1800], [-3550, 650], [-3300, -600], [-2200, -800]];
const RT = { top: [-1170, 650] as XY, bottom: [-270, 650] as XY, width: 480, straight: true };
const F: XY[] = [[1600, 2600], [2900, 2500], [3600, 3200], [3400, 4300], [2400, 4600], [1500, 4000]];
const RF = rampOff([1600, 2600], [2900, 2500], [2400, 3500], 900, 440);
const RIM_N: XY[] = [[6200, -2300], [7200, -2500], [A, -2400], [A, -5200], [6900, -5400], [6200, -4200]];

const TEMPLE: XY = [-2250, 650];
const FACE: XY = [2550, 3500];
const BOAT: XY = [-3750, -3150];
const SHRINE: XY = [4400, -3600];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(515, {
    hills: [
      { x: 3600, y: 1200, r: 800, h: 60 }, { x: -800, y: 2800, r: 900, h: 70 }, { x: 600, y: 4400, r: 900, h: 80 },
      { x: -3700, y: 1500, r: 700, h: 50 }, { x: 4400, y: -900, r: 700, h: 60 }, { x: 1200, y: -2600, r: 800, h: -40 },
    ],
    plateaus: [
      { poly: dense(T), h: 300, ramps: [RT] },
      { poly: dense(F), h: 300, ramps: [RF] },
      { poly: dense(RIM_N, 700), h: 380 },
    ],
    rock: "Oldgrowth_CliffTemple",
  });
  const { put, rnd } = f;

  // ---- the tracks: down from the lagoon to the temple gate, the causeway across the court and the
  // stairs, up the face mound, east over the channel to the marsh, down to the barge's shore ----
  const N_EXIT: XY = [5150, -150];
  const GATE: XY = [2450, 650]; // the court's gate, at the causeway's north end
  const NORTH_WAY: XY[] = smooth([[7600, -150], N_EXIT, [4400, -20], [3700, 250], [3100, 600], GATE]);
  const CAUSEWAY: XY[] = [[GATE[0], 650], [-300, 650]];
  const TERRACE: XY[] = [RT.bottom, RT.top, [-1450, 650]];
  const FACE_WAY: XY[] = [...smooth([[3200, 600], [2700, 1100], beyond(RF.top, RF.bottom, 300)]), RF.bottom, RF.top, ...smooth([beyond(RF.bottom, RF.top, 350), [FACE[0] - 150, FACE[1] - 500]])];
  const nb = nearestOn(CHANNEL, [3900, -2550]);
  let bax: XY = [-nb.dir[1], nb.dir[0]];
  if (bax[1] > 0) bax = [-bax[0], -bax[1]]; // (from the west bank to the east)
  const BR = { at: nb.at, off: (k: number): XY => [nb.at[0] + bax[0] * k, nb.at[1] + bax[1] * k] };
  const EAST_WAY: XY[] = [...smooth([[4000, -50], [3900, -900], [4100, -1700], BR.off(-650)]), ...smooth([BR.off(650), [3800, -3200], [SHRINE[0] - 300, SHRINE[1] + 650]])];
  const SHORE_WAY: XY[] = smooth([[-300, 650], [-450, 100], [-700, -800], [-1500, -1500], [-2400, -2050], [-3100, -2450]]);
  const BROOK_WAY: XY[] = smooth([[GATE[0] - 300, 650], [2300, 1800], [1500, 2300], [600, 3500], [-300, 4300], [-1300, 4900]]);
  const TRACKS = [NORTH_WAY, FACE_WAY, EAST_WAY, SHORE_WAY, BROOK_WAY];
  const roads = TRACKS.map((t, i) => band(t, i === 0 ? 460 : 400));
  const plazas = [band(CAUSEWAY, 480), band(TERRACE, 480), band([[-1450, 650], [-1540, 650]], 480)];

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const channelBand = band(CHANNEL, CW), brookBand = band(BROOK, BW);
  const WATER = [SEA, channelBand, brookBand, COURT_E, COURT_W, ...POOLS];
  const ground = f.ground({ area, roads, plazas, water: WATER, base: "jungle", road: [0.56, 0.48, 0.38], plaza: [0.74, 0.72, 0.62], tint: "#b9c7aa" });
  // moss in patches over the forest floor, mud along the shore and round the pools
  const prnd = seeded(5151), mossy: XY[][] = [];
  for (let x = -A; x < A; x += 650)
    for (let y = -A; y < A; y += 650) if (prnd() < 0.42) mossy.push(blobPoly([x + prnd() * 650, y + prnd() * 650], 240 + prnd() * 200, 200 + prnd() * 150, 5152 + mossy.length, 0.25, 14));
  const moss = f.ground({ area, roads, plazas, water: [...WATER, ...mossy], base: "moss", road: [0.56, 0.48, 0.38], plaza: [0.74, 0.72, 0.62], tint: "#b7c4a0" });
  moss.mesh.position.y += 3;
  moss.mesh.renderOrder = 1;
  const MUD_IN: XY[] = SHORE.map(([x, y], i) => {
    const a = SHORE[Math.max(0, i - 1)], b = SHORE[Math.min(SHORE.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    if (inPoly(SEA, x + nx * 80, y + ny * 80)) [nx, ny] = [-nx, -ny];
    const w = 650 + 350 * Math.sin(i * 0.9);
    return [x + nx * w, y + ny * w];
  });
  const MUD_OFF: XY[] = [...MUD_IN, [A + 400, A + 400], [-A - 400, A + 400]];
  const mud = f.ground({ area, roads, plazas, water: [SEA, MUD_OFF, channelBand], base: "sand", road: [0.56, 0.48, 0.38], tint: "#9e9a86" });
  mud.mesh.position.y += 5;
  mud.mesh.renderOrder = 2;

  // ---- the water: the sea, brackish water inland, the court's dark water ----
  const sea = seaSheet(SHORE, [[A + 400, -A - 400], [-A - 400, -A - 400], [-A - 400, A + 400]], 250, -15, "Oldgrowth_Sea"); // (over the sea only, so the hollows inland stay dry)
  const inland = [channelBand, brookBand, ...POOLS].map((p) => sheet(p, -13, "Oldgrowth_Brackish"));
  const court = [COURT_E, COURT_W].map((p) => sheet(p, -13, "Oldgrowth_Brackish"));
  // closed: the shore within reach, the channel (a gap at its bridge), the brook, the pools and the
  // court (its rim right up to the causeway's kerbs)
  const nearShore = SHORE.filter(([x, y]) => Math.abs(x) < R + 1200 && Math.abs(y) < R + 1200);
  const seaward = (p: XY, d: number): XY => {
    for (const s of [1, -1]) {
      const i = SHORE.indexOf(p), a = SHORE[Math.max(0, i - 1)], b = SHORE[Math.min(SHORE.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const n: XY = [(-(b[1] - a[1]) / L) * s, ((b[0] - a[0]) / L) * s];
      if (inPoly(SEA, p[0] + n[0] * 120, p[1] + n[1] * 120)) return [p[0] + n[0] * d, p[1] + n[1] * d];
    }
    return p;
  };
  f.blockBand(nearShore.map((p) => seaward(p, 160)), 340, { kind: "sea", step: 220 });
  for (const part of pieces(CHANNEL.filter(([x]) => x < R + 1500), [BR.at], 170)) f.blockBand(part, CW - 30, { step: 220 });
  f.blockBand(BROOK.filter(([x, y]) => x < R && y < R + 1500), BW - 30, { step: 200 });
  for (const p of POOLS) {
    f.blockBand([...p, p[0]], 170, { step: 200 });
    const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
    for (let x = Math.min(...xs) + 200; x < Math.max(...xs); x += 360) for (let y = Math.min(...ys) + 200; y < Math.max(...ys); y += 360) if (inPoly(p, x, y)) f.blockDisc([x, y], 220);
  }
  for (const c of [COURT_E, COURT_W]) {
    f.blockBand([...c, c[0]], 120, { step: 200 });
    f.extra.push({ kind: "water", x: (c[0][0] + c[1][0]) / 2, y: (c[0][1] + c[2][1]) / 2, w: 1700, d: 600, rot: 0 });
  }

  // ---- the way out ----
  f.exit("lagoon_marsh", N_EXIT, [4450, -30]);

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d) || toLine([x, y], CAUSEWAY) < d + 40 || toLine([x, y], TERRACE) < d + 40;
  const wet = (x: number, y: number, d: number) =>
    inPoly(SEA, x, y) || toLine([x, y], SHORE) < d + 120 || toLine([x, y], CHANNEL) < CW / 2 + d || toLine([x, y], BROOK) < BW / 2 + d ||
    [COURT_E, COURT_W].some((c) => x > c[0][0] - d && x < c[1][0] + d && y > c[0][1] - d && y < c[2][1] + d) || POOLS.some((p) => inPoly(p, x, y) || toLine([x, y], [...p, p[0]]) < d);
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
  for (const t of [...TRACKS, CAUSEWAY, TERRACE]) for (let i = 0; i < t.length; i++) take(t[i][0], t[i][1], 200);
  take(BR.at[0], BR.at[1], 750);

  // ---- the court: its gate, the pillars standing in the water, the causeway's kerbs and lanterns
  // of glowing caps, the stairs up the terrace, the temple on it ----
  prop("jungle:ruin_gate", GATE, 90, 420, { solid: [{ kind: "gate", x: 0, y: -215, w: 260, d: 130, rot: 0 }, { kind: "gate", x: 0, y: 215, w: 260, d: 130, rot: 0 }] });
  for (const [x, y, s] of [[1000, -120, 1], [1000, 1420, 1], [400, 200, 0.6], [1650, 1100, 0.6]] as [number, number, number][]) put("oldgrowth:sunken_pillars", [x, y], 90, { z: -13, s, solid: "none" });
  for (const y of [400, 900]) f.blockBand([[1900, y], [100, y]], 30, { kind: "kerb", step: 220 });
  for (const x of [1700, 1000, 300]) for (const y of [380, 920]) put("ruins:ghost_brazier", [x, y], 0, { solid: [{ kind: "post", x: 0, y: 0, r: 30 }], s: 0.8, z: 0 });
  put("ruins:temple_stairs", [(RT.top[0] + RT.bottom[0]) / 2, RT.top[1]], runAlong(RT.top[0] - RT.bottom[0], RT.top[1] - RT.bottom[1]), { solid: "none" });
  prop("oldgrowth:banyan_temple", TEMPLE, 180, 900, { solid: [{ kind: "temple", x: 0, y: 0, w: 1320, d: 1320, rot: 0 }] });
  prop("ruins:guardian_statue", [-1350, 330], 180, 120, { s: 0.9 });
  prop("ruins:guardian_statue", [-1350, 970], 180, 120, { s: 0.9 });
  for (const [x, y, h] of [[-3100, -300, 30], [-3000, 1500, 200], [-1500, -300, 90]] as [number, number, number][]) if (free(x, y, 180)) prop("oldgrowth:glow_shrooms", [x, y], h, 200, { s: 0.7, solid: "none" });

  // ---- the face on its mound ----
  prop("oldgrowth:root_face", FACE, 25, 420, { solid: [{ kind: "ruin", x: 0, y: 0, w: 440, d: 440, rot: 0 }] });
  prop("oldgrowth:banyan", [3100, 4000], 120, 500, { s: 0.7, solid: [{ kind: "tree", x: 0, y: 0, r: 60 }] });
  prop("oldgrowth:glow_shrooms", [1900, 3300], 80, 180, { s: 0.8, solid: "none" });
  prop("jungle:ruin_pillars", [2000, 4000], 40, 200);

  // ---- the way in: the arch of roots, the sign ----
  prop("oldgrowth:root_arch", [4300, 0], 4, 600, { solid: [{ kind: "root", x: 0, y: -460, w: 520, d: 260, rot: 0 }, { kind: "root", x: 0, y: 460, w: 520, d: 260, rot: 0 }] });
  prop("jungle:trail_sign", [4700, 450], towards(-1, 0.5), 90, ring(20, "post"));
  prop("jungle:trail_sign", [3100, 1050], towards(-0.5, -1), 90, ring(20, "post"));

  // ---- the channel's bridge, the marsh beyond it, the drowned shrine ----
  put("jungle:plank_bridge", BR.at, runAlong(bax[0], bax[1]), { solid: [{ kind: "fence", x: 0, y: -135, w: 1000, d: 20, rot: 0 }, { kind: "fence", x: 0, y: 135, w: 1000, d: 20, rot: 0 }] });
  put("ruins:sunken_shrine", SHRINE, 40, { solid: "none" });
  put("ruins:sunken_shrine", [-3400, 3300], 200, { solid: "none", s: 0.8 });
  for (const p of POOLS)
    p.forEach(([x, y], i) => {
      if (i % 3 || !inBox(x, y) || nearTrack(x, y, 300)) return;
      put(rnd() < 0.5 ? "ruins:cattails" : "jungle:reeds", [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.3, solid: "none" });
    });
  for (const p of POOLS) for (let k = 0; k < 2; k++) {
    const c = p[Math.floor(rnd() * p.length)], m = p[(Math.floor(rnd() * p.length) + 9) % p.length], t = 0.3 + rnd() * 0.3;
    const at: XY = [c[0] + (m[0] - c[0]) * t, c[1] + (m[1] - c[1]) * t];
    if (inPoly(p, at[0], at[1])) put(rnd() < 0.5 ? "ruins:drowned_tree" : "jungle:mangrove", at, rnd() * 360, { s: 0.8 + rnd() * 0.3, solid: "none" });
  }

  // ---- the shore: the stone barge in the shallows, mangroves along the mud, sea stacks ----
  put("oldgrowth:stone_boat", BOAT, -35, { z: -13, solid: "none" });
  f.blockDisc([BOAT[0] + 250, BOAT[1] + 120], 260, "boat");
  put("oldgrowth:sunken_pillars", [-3200, -3500], 30, { z: -13, s: 0.7, solid: "none" });
  put("jungle:sea_stack", [-5600, -1200], 40, { z: -12, solid: "none" });
  put("jungle:sea_stack", [-1500, -5900], 160, { z: -12, s: 0.9, solid: "none" });
  put("jungle:sea_stack", [3500, -6200], 260, { z: -12, s: 1.1, solid: "none" });
  put("jungle:sea_stack", [-6400, 3200], 100, { z: -12, s: 0.8, solid: "none" });
  for (let i = 0; i < SHORE.length; i++) {
    const [x, y] = SHORE[i];
    if (i % 2 || Math.abs(x) > R + 800 || Math.abs(y) > R + 800 || rnd() < 0.35) continue;
    const off = -120 + rnd() * 500, p = seaward(SHORE[i], -off);
    if (toLine(p, SHORE_WAY) < 400 || Math.hypot(p[0] - BOAT[0], p[1] - BOAT[1]) < 700) continue;
    put(rnd() < 0.75 ? "jungle:mangrove" : "jungle:nipa_palm", p, rnd() * 360, { s: 0.8 + rnd() * 0.35, solid: "none" });
    take(p[0], p[1], 150);
  }

  // ---- the woods: banyans on their root pillars, strangler figs, vines, glowing caps; thick at
  // the edges, the north edge's drowned trees and cattails like the lagoon's, the west's broadleaves
  // like the rice valley's ----
  const BANYANS: [XY, number, number][] = [[[-3800, -1200], 30, 0.9], [[3000, -1500], 150, 0.85], [[-500, 2400], 200, 0.8], [[600, -2200], 80, 0.85], [[-2000, 3500], 300, 0.8], [[3800, 3200], 60, 0.75], [[-3700, 2400], 10, 0.75], [[1900, -3300], 250, 0.7]];
  for (const [at, h, s] of BANYANS) if (free(at[0], at[1], 300)) prop("oldgrowth:banyan", at, h, 650 * s, { s, solid: [{ kind: "tree", x: 0, y: 0, r: 90 * s }] });
  scatter("oldgrowth:banyan", [0, 0], 5200, 6, 300, (s) => ({ s: s * 0.7, solid: [{ kind: "tree", x: 0, y: 0, r: 60 * s }] }), inBox, 250);
  scatter("jungle:strangler_fig", [0, 0], 5200, 4, 400, (s) => ({ s: s * 0.8, solid: [{ kind: "tree", x: 0, y: 0, r: 120 * s }] }), inBox, 200);
  scatter("oldgrowth:glow_shrooms", [0, 0], 5200, 10, 150, () => ({ solid: "none" }));
  scatter("westmount:glow_mushrooms", [0, 0], 5200, 8, 140, () => ({ solid: "none" }));
  scatter("jungle:vine_tree", [0, 0], 5200, 14, 260, () => ({ solid: [{ kind: "tree", x: 0, y: 0, r: 50 }] }));
  scatter("jungle:ruin_pillars", [0, 0], 4800, 5, 200, () => ({}));
  scatter("jungle:ruin_wall", [-500, 500], 3500, 4, 330, () => ({ solid: [{ kind: "wall", x: 0, y: 0, w: 130, d: 600, rot: 0 }] }));
  scatter("oldgrowth:moss_boulders", [0, 0], 5200, 5, 230, (s) => ring(170 * s));
  scatter("jungle:giant_fern", [0, 0], 5300, 40, 90, () => ({ solid: "none" }));
  scatter("jungle:elephant_ear", [0, 0], 5300, 30, 80, () => ({ solid: "none" }));
  scatter("jungle:tree_fern", [0, 0], 5300, 16, 110, () => ({ solid: [{ kind: "post", x: 0, y: 0, r: 22 }] }));
  scatter("ruins:root_tangle", [0, 0], 5200, 8, 180, () => ({ solid: [{ kind: "ruin", x: 0, y: 0, w: 260, d: 150, rot: 0 }] }));
  scatter("ruins:drowned_tree", [4300, 1500], 1400, 7, 200, () => ({ solid: [{ kind: "tree", x: 0, y: 0, r: 40 }] }));
  scatter("ruins:cattails", [4600, 1500], 1100, 14, 70, () => ({ solid: "none" }));
  scatter("flora:RoundTree", [-1000, 4600], 1300, 8, 200, () => ({}));
  scatter("flora:Bamboo", [500, 4800], 1000, 6, 120, () => ({}));
  scatter("flora:PalmBent", [-3800, 0], 1500, 7, 160, () => ({}));
  for (let i = 0; i < 900; i++) {
    const x = (rnd() - 0.5) * 2 * (R - 150), y = (rnd() - 0.5) * 2 * (R - 150), edge = Math.min(R - Math.abs(x), R - Math.abs(y));
    if (rnd() > (edge < 700 ? 0.8 : edge < 1300 ? 0.35 : 0.06) || nearTrack(x, y, 420) || !free(x, y, 180, 140)) continue;
    const k = rnd(), kind = y > 3800 ? (k < 0.4 ? "flora:RoundTree" : k < 0.7 ? "flora:BigOak" : "flora:Bamboo") : x > 4200 ? (k < 0.5 ? "ruins:drowned_tree" : "flora:Birch") : k < 0.5 ? "flora:JungleTree" : k < 0.75 ? "jungle:vine_tree" : "flora:PalmTall";
    prop(kind, [x, y], rnd() * 360, 200, { s: 0.8 + rnd() * 0.35, solid: kind === "jungle:vine_tree" ? [{ kind: "tree", x: 0, y: 0, r: 50 }] : kind === "ruins:drowned_tree" ? [{ kind: "tree", x: 0, y: 0, r: 40 }] : "auto" });
  }
  const MIST: [XY, number, number][] = [[[1000, 30], 0, 0.8], [[1000, 1300], 0, 0.8], [[4400, -3500], 30, 0.8], [[-3400, 3300], 80, 0.8], [[1800, -2600], 20, 0.7], [[-1800, -1800], 120, 0.7], [[4300, 2600], 60, 0.8]];
  for (const [at, h, s] of MIST) put("westmount:mist_bank", at, h, { solid: "none", s });

  // ---- past the edge: the lagoon's woods north, the rice valley's west, nothing on the sea ----
  const onTrack = (x: number, y: number) => [[0, 0], [300, 0], [-300, 0], [0, 300], [0, -300]].some(([dx, dy]) => ground.kind(x + dx, y + dy) === 1);
  const inside = (x: number, y: number) => Math.abs(x) < R + 300 && Math.abs(y) < R + 300;
  const atSea = (x: number, y: number) => inPoly(SEA, x, y) || toLine([x, y], SHORE) < 250;
  const water = (x: number, y: number) => ground.kind(x, y) === 3;
  f.woods(area, ["JungleTree", "BigOak", "JungleTree", "RoundTree", "PalmTall", "Bamboo"], (x, y) => inside(x, y) || onTrack(x, y) || atSea(x, y) || water(x, y) || x > 5800, { count: 380, spacing: 400, tries: 8000 });
  f.woods(area, ["banyan"], (x, y) => inside(x, y) || onTrack(x, y) || atSea(x, y) || water(x, y) || Math.abs(x) > 7000 || Math.abs(y) > 7000 || (Math.abs(x) < R + 900 && Math.abs(y) < R + 900), { count: 8, spacing: 1800, tries: 2000, kit: "oldgrowth" });
  f.woods(area, ["RoundTree", "SmallTree", "Birch", "RoundTree", "Bush"], (x, y) => inside(x, y) || onTrack(x, y) || atSea(x, y) || water(x, y) || x < 5800, { count: 180, spacing: 380, tries: 5000 });
  f.woods(area, ["drowned_tree", "cattails"], (x, y) => inside(x, y) || atSea(x, y) || water(x, y) || x < 5800, { count: 50, spacing: 600, tries: 2000, kit: "ruins" });
  f.woods(area, ["mangrove", "nipa_palm"], (x, y) => inside(x, y) || !atSea(x, y) || toLine([x, y], SHORE) > 700, { count: 60, spacing: 420, tries: 3000, kit: "jungle" });

  // ---- monsters: by the water everywhere (the court, the pools, the channel and the shore), on
  // the terrace and the mound ----
  const MONK: XY = [-700, 1050], DIVER: XY = [-2950, -2700];
  const quiet = (x: number, y: number) => Math.hypot(x - MONK[0], y - MONK[1]) < 700 || Math.hypot(x - DIVER[0], y - DIVER[1]) < 700;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 800, max: 50, keepOut: quiet });

  const npcs: NpcSpec[] = [
    { id: "sunken_monk", x: MONK[0], y: MONK[1], face: 0, name: "หลวงตาจันทร์", title: "ผู้เฝ้าวิหารจม", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_priestess_wine", bottom: "bottom_priestess_wine" },
      lines: [
        "วิหารนี้สร้างก่อนเมืองท่าทุกเมือง ไทรต้นนั้นงอกบนหลังคามาตั้งแต่สมัยปู่ของปู่อาตมา",
        "ทุกปีน้ำทะเลขึ้นมาท่วมลานอีกคืบหนึ่ง อีกไม่นานวิหารก็จะจมทั้งหลัง",
        "นางพรายรากไทรลอยอยู่เหนือน้ำตอนพลบค่ำ อย่าไปตอบเสียงเรียกของนางเชียว",
      ] },
    { id: "sunken_diver", x: DIVER[0], y: DIVER[1], face: 220, name: "นาวา", title: "นักงมโบราณวัตถุ", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "teal", eyes: "blue", top: "top_adventurer_navy", bottom: "bottom_adventurer_sand" },
      lines: [
        "เรือลำนั้นสลักจากหินก้อนเดียวทั้งลำ ไม่รู้ว่าคนโบราณลอยมันขึ้นได้อย่างไร",
        "หมึกยักษ์ขึ้นมาจากทะเลตามรากไทรตอนน้ำขึ้น หนวดของมันหนักกว่าท่อนซุงอีก",
        "ทางเหนือกลับไปบึงลากูน ลำรางน้ำจากบึงไหลลงมาทางตะวันออก ข้ามสะพานไม้ไปได้",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [moss.mesh, mud.mesh, sea, ...inland, ...court],
    sky: "#6f8f80",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && moss.kind(x, y) !== 0 && mud.kind(x, y) !== 0 && !wet(x, y, 250), density: 0.05 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4400, y: -250 },
    npcs,
    labels: [
      { x: N_EXIT[0] - 200, y: N_EXIT[1], text: "ทางไปบึงลากูน", kind: "gate" },
      { x: TEMPLE[0] - 900, y: TEMPLE[1], text: "วิหารที่ไทรกลืน" },
      { x: 1000, y: 650, text: "ลานวิหารจมน้ำ" },
      { x: FACE[0] - 500, y: FACE[1], text: "ใบหน้าหินรากรัด" },
      { x: BOAT[0] + 400, y: BOAT[1] + 300, text: "เรือหินโบราณ" },
      { x: SHRINE[0] + 500, y: SHRINE[1], text: "ศาลจมในบึงไทร", kind: "small" },
      { x: 4800, y: -2000, text: "ลำรางจากบึงลากูน", kind: "small" },
      { x: -1500, y: 4400, text: "ลำธารสู่นาขั้นบันได", kind: "small" },
      { x: GATE[0] + 300, y: GATE[1], text: "ซุ้มประตูวิหาร", kind: "small" },
      { x: -4000, y: -1800, text: "หาดเลนริมทะเล", kind: "small" },
    ],
  });
}

// หุบผาน้ำตก (the waterfall gorge), monsters Lv 42-52: where the southern jungle's stream, come
// east out of the jungle, cuts its way down to the sea through a deep gorge. The way in from the
// jungle (the west side, by the stream) follows the north bank under the cliffs of a tableland;
// the stream winds east across the jungle floor, a plank bridge takes the track over it and on
// south to the way out to the mangrove coast (the south side), past mud pools ringed with
// mangroves toward that edge. Up the tableland's south face a ramp climbs out of the jungle; on
// top the jungle thins north into dry grass and then sand toward the great desert (the way out
// there is on the north side). In the tableland's middle a higher step carries a stepped pyramid
// under its vines; a stream runs off that step in a waterfall, across the tableland and over its
// edge in a second fall into a pool beside the stream below. East of it the stream runs into a
// narrow gorge between the tableland's cliffs and a headland's, wall to wall water, and out into
// the sea; a rope bridge crosses the gorge high over it to the headland, where carved stelae of
// the pyramid's builders look out over the sea. Giant rafflesias bloom over the jungle floor.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: west -> south_jungle, north -> great_desert, south -> mangrove_coast

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Poly } from "./paved";
import type { Town } from "./town";
import { useKits } from "./town";
import { material } from "./textures";
import { smooth, band, dense, blob, inPoly, toLine, nearestOn, towards, along } from "./kits/westfarm";
import type { XY } from "./kits/westfarm";
import { KIT as SOUTHSANDS } from "./kits/southsands";
import { KIT as JUNGLE } from "./kits/jungle";
import { KIT as DESERT } from "./kits/desert";
import { KIT as YODIA } from "./kits/yodia";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(SOUTHSANDS, JUNGLE, DESERT, YODIA);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the coast: from past the north-east corner along the tableland's sea cliffs to the gorge's
// mouth, then along the headland's down past the south-east corner; the sea east of it ----
const SHORE: XY[] = smooth([
  [A + 600, -6600], [5500, -5300], [4300, -4800], [3000, -4700], [1700, -4600], [700, -4500], [300, -4300], [150, -3950],
  [-1350, -3950], [-1700, -4300], [-3000, -4950], [-4300, -5300], [-5600, -5900], [-A - 600, -6500],
], 220);
const SEA: Poly = [...SHORE, [-A - 600, -A - 600], [A + 600, -A - 600]];

// ---- the levels ----
// N1: the tableland (500) over the north half, its south face the gorge's north wall, its east
// face sea cliffs, running on past the west and north edges; N2 the pyramid's step on it (850);
// S1: the headland (499) in the south-east, its north face the gorge's south wall, running on
// past the south edge (the mangrove coast's headland). The two are a hair apart in height so the
// rope bridge is a level way across from either side.
const N1: XY[] = [
  [-100, A + 600], [-50, 6600], [100, 5600], [500, 4600], [800, 3500], [1000, 2200], [950, 900], [850, -200], [500, -1000], [100, -2200],
  [100, -3700], [300, -4050], [1600, -4350], [3000, -4450], [4300, -4550], [5500, -5050], [A + 600, -5900], [A + 600, A + 600],
];
const N2: XY[] = [[3700, 2700], [3600, 500], [2900, -800], [1900, -600], [1600, 1000], [2100, 2600]];
const S1: XY[] = [
  [-1300, -2000], [-1300, -3700], [-1650, -4050], [-3000, -4700], [-4300, -5050], [-5600, -5650], [-A - 600, -6250], [-A - 600, -1800],
  [-5500, -1800], [-4300, -1650], [-3000, -1900], [-2000, -1700],
];
const RN1 = { top: [950, 900] as XY, bottom: [-550, 960] as XY, width: 460 };
const RN2 = { top: [2900, 2650] as XY, bottom: [2900, 3700] as XY, width: 440 };
const RS1 = { top: [-3600, -1785] as XY, bottom: [-3317, -312] as XY, width: 460 };
// the rope bridge across the gorge: a level way from each side's edge onto the other
const BY = -2950, N_EDGE = 100, S_EDGE = -1300;
const BRIDGE_N = { top: [N_EDGE, BY] as XY, bottom: [S_EDGE - 300, BY] as XY, width: 300 };
const BRIDGE_S = { top: [S_EDGE, BY] as XY, bottom: [N_EDGE + 300, BY] as XY, width: 300 };
const len = (r: { top: XY; bottom: XY }) => Math.hypot(r.top[0] - r.bottom[0], r.top[1] - r.bottom[1]);
const climb = (r: { top: XY; bottom: XY }, inn = 400, out = 400): XY[] => [along(r.bottom, r.top, -inn), r.bottom, r.top, along(r.bottom, r.top, len(r) + out)];

// ---- the water: the stream from the jungle's edge to the gorge, the pool under the lower falls,
// the gorge wall to wall, and the sea ----
const RIVER: XY[] = smooth([[-1250, A + 600], [-1240, 6500], [-1300, 5000], [-1700, 4000], [-2100, 3000], [-2000, 1800], [-1600, 700], [-1300, -400], [-1000, -1400], [-700, -1900], [-600, -2300]], 200);
const RW = 520;
const POOL = blob([-200, -1450], 600, 520, 4, 18, 0.08);
const GORGE: Poly = [[S_EDGE + 130, -2150], [N_EDGE - 130, -2150], [N_EDGE - 130, -4000], [S_EDGE + 130, -4000]];
const MUD: Poly[] = [blob([-4700, 1700], 520, 640, 1, 18, 0.12), blob([-4950, 3500], 440, 520, 2, 16, 0.12), blob([-4300, 4700], 380, 460, 3, 16, 0.12)];

// ---- the falls: the upper off the pyramid's step onto the tableland, the lower off the tableland
// into the pool (each item's origin 150 out from its lip, at its scale; its stream runs back
// along its own +X onto the higher ground) ----
const edgeFall = (lip: XY, out: XY, s: number) => {
  const L = Math.hypot(out[0], out[1]), n: XY = [out[0] / L, out[1] / L];
  return { at: [lip[0] + n[0] * 150 * s, lip[1] + n[1] * 150 * s] as XY, h: (Math.atan2(n[1], n[0]) * 180) / Math.PI + 180, s, back: (d: number): XY => [lip[0] - n[0] * d, lip[1] - n[1] * d] };
};
const FALL1 = edgeFall([1825, -200], [-1600, -300], 0.7);
const FALL2 = edgeFall([333, -1500], [-1200, 400], 1);
// the stream across the tableland from the upper falls' foot to the lower falls' own run
const STREAM: XY[] = smooth([[FALL1.at[0] - 150, FALL1.at[1] - 40], [1350, -600], [1150, -1150], FALL2.back(780)], 150);

// ---- the places ----
const W_EXIT: XY = [-550, 5150], N_EXIT: XY = [5150, 2200], S_EXIT: XY = [-5150, -600];
const PYRAMID: XY = [2750, 1200];
const STELAE: XY = [-3350, -3850];
const PLANK: XY = [-1300, -420]; // the plank bridge over the stream

// ---- the tracks ----
const T_W: XY[] = smooth([[-550, 7600], W_EXIT, [-500, 4300], [-350, 3300], [-250, 2300], [-300, 1500], [-500, 800], [-700, 0], [-950, -350], PLANK, [-1700, -520], [-2400, -650], [-3100, -650], [-3800, -600], [-4450, -600], S_EXIT, [-7600, -600]]);
const T_N: XY[] = [...smooth([[-450, 1250], climb(RN1)[0]]), ...climb(RN1).slice(1), ...smooth([climb(RN1)[3], [1500, 1700], [1600, 2900], [2300, 3500], [3200, 3450], [4200, 2700], N_EXIT, [7600, 2200]])];
const T_N2: XY[] = [...smooth([[2700, 3450], climb(RN2, 250)[0]]), ...climb(RN2, 250).slice(1), [PYRAMID[0] + 150, PYRAMID[1] + 950]];
const T_GORGE: XY[] = smooth([[1450, 1500], [1350, 400], [1300, -500], [1250, -1300], [1000, -2000], [600, -2650], [N_EDGE + 250, BY]]);
const T_S1: XY[] = [
  ...smooth([[-3100, -640], climb(RS1)[0]]), ...climb(RS1).slice(1),
  ...smooth([climb(RS1)[3], [-3200, -2600], [-2700, -3150], [-2000, -3050], [S_EDGE - 250, BY]]),
];

// ---- the tableland drying north toward the desert: how far into it a point is, 0 in the jungle
// to 1 on the sand by the north edge, along a line that wanders ----
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => t * t * (3 - 2 * t);
const dryLine = (y: number) => 220 * Math.sin(y / 700 + 0.4) + 130 * Math.sin(y / 300 + 1.9) + 60 * Math.sin(y / 130 + 0.3);
const dry = (x: number, y: number) => ease(clamp01((x + dryLine(y) - 3000) / 2300));
// everything south of the line where the ground at `x` turns
const southOf = (x: number): Poly => [...Array.from({ length: 191 }, (_, i) => -9500 + i * 100).map((y): XY => [x - 1.3 * dryLine(y), y]), [-9500, 9500], [-9500, -9500]];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(519, {
    hills: [
      // the jungle floor rolling, low swells on the tableland and the headland
      { x: -3300, y: 2600, r: 900, h: 110 }, { x: -2600, y: 4800, r: 700, h: 90 }, { x: -3800, y: -1000, r: 600, h: 70 },
      { x: -2600, y: 1300, r: 600, h: 60 }, { x: 3600, y: 4600, r: 900, h: 120 }, { x: 4600, y: -1800, r: 1000, h: 130 },
      { x: 1500, y: -3200, r: 800, h: 90 }, { x: -3700, y: -3600, r: 900, h: 110 },
      // the desert's dunes past the north edge
      { x: 7300, y: 2500, r: 2000, h: 260 }, { x: 7200, y: -2400, r: 1800, h: 220 },
    ],
    // S1 before N1: over the gorge the way from N1's edge (listed last) is the one that counts
    plateaus: [
      { poly: dense(S1), h: 499, ramps: [RS1, BRIDGE_S] },
      { poly: dense(N1), h: 500, ramps: [RN1, BRIDGE_N] },
      { poly: dense(N2), h: 850, ramps: [RN2] },
    ],
    rock: "Jungle_CliffMoss",
    keep: [FALL1.at, FALL2.at],
  });
  const { rnd } = f;

  const roads: Poly[] = [band(T_W, 450), band(T_N, 440), band(T_N2, 400), band(T_GORGE, 400), band(T_S1, 400)];
  const COURT: Poly = blob([PYRAMID[0], PYRAMID[1] + 1100], 380, 420, 6, 14, 0.06); // flagstones before the stair
  const water: Poly[] = [band(RIVER, RW), POOL, GORGE, SEA, ...MUD];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, cell: 60, roads, plazas: [COURT], water, base: "jungle", road: [0.6, 0.47, 0.37], plaza: [0.7, 0.72, 0.6] });
  // the dry ground on the tableland: dry grass a hair over the jungle's north of one wandering line,
  // sand over that north of another (the tracks paler on each)
  const dryGround = (line: number, base: string, road: [number, number, number], lift: number) => {
    const x0 = Math.floor((line - 600 + A) / 60) * 60 - A; // (on the jungle ground's own grid)
    const g = f.ground({ area: { x0, y0: -A, x1: A, y1: A }, cell: 60, roads, plazas: [COURT], water: [southOf(line), ...water], base, road, plaza: [0.7, 0.72, 0.6] });
    g.mesh.position.y += lift;
    g.mesh.renderOrder = lift;
    return g.mesh;
  };
  const dryGrass = dryGround(3200, "steppe", [0.74, 0.6, 0.46], 2), drySand = dryGround(4400, "sand", [0.84, 0.74, 0.6], 4);

  // ---- the water: the stream (the jungle's own colour), the gorge and the sea; what keeps everyone
  // out of it (gaps where the plank bridge crosses) ----
  const seaward = (i: number, d: number): XY => {
    const a = SHORE[Math.max(0, i - 1)], b = SHORE[Math.min(SHORE.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let n: XY = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
    if (!inPoly(SEA, SHORE[i][0] + n[0] * 120, SHORE[i][1] + n[1] * 120)) n = [-n[0], -n[1]];
    return [SHORE[i][0] + n[0] * d, SHORE[i][1] + n[1] * d];
  };
  const seaShape = new THREE.Shape();
  [...SHORE.map((_, i) => seaward(i, -220)), [-20000, -A - 600], [-20000, -20000], [20000, -20000], [20000, -A - 600]].forEach(([x, y], i) => (i ? seaShape.lineTo(x, y) : seaShape.moveTo(x, y)));
  const seaSheet = new THREE.Mesh(new THREE.ShapeGeometry(seaShape).applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)), material("WaterSea"));
  seaSheet.position.y = -14;
  seaSheet.receiveShadow = true;
  f.blockBand(RIVER.filter((p) => Math.abs(p[1]) < R + 700), RW - 60, { gaps: [PLANK], gapR: 200, step: 140 });
  f.blockDisc([-200, -1450], 470);
  for (let i = 0; i < POOL.length; i += 2) f.blockDisc([-200 + (POOL[i][0] + 200) * 0.85, -1450 + (POOL[i][1] + 1450) * 0.85], 160);
  f.blockBand([[(S_EDGE + N_EDGE) / 2, -2050], [(S_EDGE + N_EDGE) / 2, -3900]], N_EDGE - S_EDGE - 60, { step: 200 });
  for (const [m, c, r] of [[MUD[0], [-4700, 1700], 460], [MUD[1], [-4950, 3500], 380], [MUD[2], [-4300, 4700], 330]] as [Poly, XY, number][]) {
    f.blockDisc(c, r, "mud");
    for (let i = 0; i < m.length; i += 2) f.blockDisc([c[0] + (m[i][0] - c[0]) * 0.86, c[1] + (m[i][1] - c[1]) * 0.86], 150, "mud");
  }
  const scenery: THREE.Object3D[] = [
    dryGrass, drySand, seaSheet,
    f.waterSheet({ x0: -2600, x1: 400, y0: -2400, y1: 9500 }, -15, "Jungle_Stream"),
    f.waterSheet({ x0: S_EDGE - 100, x1: N_EDGE + 100, y0: -3900, y1: -2300 }, -15, "Jungle_Stream"),
    f.waterSheet({ x0: -5400, x1: -3800, y0: 1000, y1: 5300 }, -9, "Jungle_Mud"),
  ];

  // ---- the ways out ----
  f.exit("south_jungle", W_EXIT, [-500, 4450]);
  f.exit("great_desert", N_EXIT, [4450, 2250]);
  f.exit("mangrove_coast", S_EXIT, [-4450, -600]);

  // ---- placing things: every placement remembered (x, y, r) so the forest keeps clear ----
  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number) => taken.every(([px, py, pr]) => Math.hypot(px - x, py - y) > pr + r);
  const open = (x: number, y: number, r: number) => [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0);
  const put = (ref: string, at: XY, h = 0, o: { s?: number; solid?: "auto" | "none" | SolidSpec[]; r?: number; z?: number } = {}) => {
    f.put(ref.includes(":") ? ref : `jungle:${ref}`, at, h, { s: o.s ?? 1, solid: o.solid ?? "auto", z: o.z ?? 0 });
    taken.push([at[0], at[1], o.r ?? 120]);
  };
  const box = (w: number, d: number, x = 0, y = 0, kind = "ruin"): SolidSpec => ({ kind, x, y, w, d, rot: 0 });
  const disc = (r: number, x = 0, y = 0, kind = "tree"): SolidSpec => ({ kind, x, y, r });
  const onStream = (x: number, y: number, d = 260) => toLine(x, y, STREAM) < d;

  // ---- the ways out: carved posts and a trail sign at the jungle's way, the desert's signpost
  // on the tableland, a sign at the mangroves' ----
  put("yodia:guardian_post", [W_EXIT[0] + 320, W_EXIT[1] - 250], 90, { r: 80 });
  put("yodia:guardian_post", [W_EXIT[0] - 340, W_EXIT[1] - 250], 90, { r: 80 });
  put("trail_sign", [-150, 4300], 220, { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("desert:signpost", [N_EXIT[0] - 450, N_EXIT[1] + 380], 180, { solid: [disc(30, 0, 0, "post")], r: 80 });
  put("desert:boulder_big", [N_EXIT[0] - 200, N_EXIT[1] - 650], 40, { s: 0.6, solid: [disc(130, 0, 0, "rock")], r: 220 });
  put("trail_sign", [S_EXIT[0] + 380, S_EXIT[1] - 380], 20, { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("trail_sign", [-1900, -200], 120, { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("trail_sign", [1650, 1350], 280, { solid: [disc(20, 0, 0, "post")], r: 90 });

  // ---- the plank bridge over the stream, rocks at its ends ----
  {
    const n = nearestOn(RIVER, PLANK), ax: XY = [-n.dir[1], n.dir[0]];
    put("plank_bridge", PLANK, (Math.atan2(ax[1], ax[0]) * 180) / Math.PI, { solid: [box(1040, 18, 0, -178, "fence"), box(1040, 18, 0, 178, "fence")], r: 560 });
    for (const s of [-1, 1]) put("rock_cluster", [PLANK[0] + ax[0] * 640 * s + n.dir[0] * 330, PLANK[1] + ax[1] * 640 * s + n.dir[1] * 330], s * 70, { s: 0.55, solid: [disc(80, 0, 0, "rock")], r: 150 });
  }

  // ---- the falls: the upper off the pyramid's step, the stream across the tableland (a plank over
  // it where the gorge track crosses), the lower into the pool, rocks in the stream below ----
  put("southsands:waterfall", FALL1.at, FALL1.h, { s: FALL1.s, solid: [box(140, 440, 120, 0, "rock")], r: 300 });
  put("southsands:spring_pool", FALL1.back(700), 20, { s: 0.8, solid: [disc(170, 0, 0, "water")], r: 260 });
  put("southsands:waterfall", FALL2.at, FALL2.h, { s: FALL2.s, solid: [box(160, 440, 150, 0, "rock")], r: 340 });
  const SL = STREAM.slice(1).reduce((t, p, i) => t + Math.hypot(p[0] - STREAM[i][0], p[1] - STREAM[i][1]), 0), pieces = Math.ceil(SL / 380);
  let bridged = false;
  for (let i = 0; i < pieces; i++) {
    const d = ((i + 0.5) * SL) / pieces;
    let acc = 0, at: XY = STREAM[0], dir: XY = [1, 0];
    for (let k = 0; k + 1 < STREAM.length; k++) {
      const a = STREAM[k], b = STREAM[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (acc + L >= d) { const t = (d - acc) / L; at = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; dir = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; break; }
      acc += L;
    }
    f.put("southsands:stream_run", at, (Math.atan2(dir[1], dir[0]) * 180) / Math.PI, { sy: 0.85, solid: "none" });
    taken.push([at[0], at[1], 220]);
    if (!bridged && toLine(at[0], at[1], T_GORGE) < 250) {
      put("plank_bridge", at, (Math.atan2(dir[1], dir[0]) * 180) / Math.PI + 90, { s: 0.45, solid: "none", r: 260 });
      bridged = true;
    }
  }
  put("southsands:river_rocks", [-650, -1250], 30, { solid: "none", r: 200 });
  put("southsands:river_rocks", [-1500, 1100], 200, { s: 0.8, solid: "none", r: 200 });
  put("southsands:river_rocks", [-1950, 3300], 100, { s: 0.7, solid: "none", r: 200 });
  put("southsands:river_rocks", [-650, -2700], 0, { s: 1.1, solid: "none", r: 200 });
  put("southsands:river_rocks", [-500, -3500], 80, { s: 0.9, solid: "none", r: 200 });

  // ---- the rope bridge across the gorge, its two heads ----
  put("southsands:rope_bridge", [(S_EDGE + N_EDGE) / 2, BY], 0, {
    solid: [-1, 1].flatMap((sx) => [-1, 1].map((sy) => ({ kind: "post", x: sx * 715, y: sy * 131, r: 16 }))),
    r: 300,
  });
  taken.push([N_EDGE + 150, BY, 260], [S_EDGE - 150, BY, 260]);

  // ---- the pyramid on its step, the court before its stair, stelae and fallen blocks ----
  put("southsands:step_pyramid", PYRAMID, -90, {
    s: 0.75, r: 900,
    solid: [box(1360, 1360, 0, 0, "temple"), box(300, 260, 0, -820, "temple"), { kind: "statue", x: -175, y: -820, r: 50 }, { kind: "statue", x: 175, y: -820, r: 50 }],
  });
  put("southsands:carved_stela", [PYRAMID[0] - 400, PYRAMID[1] + 1300], -90, { solid: [box(110, 130, 0, 0, "statue")], r: 140 });
  put("southsands:carved_stela", [PYRAMID[0] + 600, PYRAMID[1] + 1300], -90, { solid: [box(110, 130, 0, 0, "statue")], r: 140 });
  put("ruin_pillars", [PYRAMID[0] - 900, PYRAMID[1] - 500], 30, { s: 0.8, solid: [disc(40, -60, -150, "post"), disc(40, 80, 60, "post")], r: 260 });
  put("explorer_camp", [3550, 4050], towards(-0.3, -1), { solid: [box(320, 280, 150, 140, "camp"), box(270, 270, -180, -160, "camp"), disc(60, -200, 170, "camp")], r: 400 });

  // ---- the headland: the stelae of the pyramid's builders in a ring looking out to sea, an altar,
  // the rafflesias' garden round them ----
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 1.4 + 1.2, at: XY = [STELAE[0] + Math.cos(a) * 520, STELAE[1] + Math.sin(a) * 520];
    put("southsands:carved_stela", at, (Math.atan2(STELAE[1] - at[1], STELAE[0] - at[0]) * 180) / Math.PI + 180, { s: 0.9, solid: [box(100, 120, 0, 0, "statue")], r: 120 });
  }
  put("stone_face", [STELAE[0] - 150, STELAE[1] - 150], towards(-0.3, -1), { s: 0.6, solid: [box(200, 220)], r: 220 });
  for (const [dx, dy, s] of [[700, 500, 1], [-500, 650, 0.8], [900, -300, 0.9]] as number[][]) put("southsands:rafflesia_bloom", [STELAE[0] + dx, STELAE[1] + dy], rnd() * 360, { s, solid: [disc(110 * s, 0, 0, "plant")], r: 200 * s });

  // ---- the gorge's walls: vines hanging over the edges of the tableland and the headland ----
  for (const [x, y, h] of [[860, 300, -175], [700, -500, -160], [380, -1250, -160], [N_EDGE + 30, -2500, 180], [N_EDGE + 30, -3400, 180], [S_EDGE - 30, -2500, 0], [S_EDGE - 30, -3400, 0], [960, 1600, -180], [880, 2900, -175]] as [number, number, number][])
    f.put("southsands:cliff_vines", [x, y], h + 180, { solid: "none" });

  // ---- the jungle floor: rafflesias in bloom, fallen logs, stumps, mossy boulders; the mud pools
  // toward the mangroves, ringed with mangroves and nipa palms ----
  const blooms: XY[] = [[-2600, 2300], [-3400, 3700], [-3000, 600], [-1000, 3300], [-200, -800], [100, -1900], [-2600, -1300], [-4300, 600], [1600, 2400], [-3900, -2700]];
  for (const at of blooms) if (open(at[0], at[1], 300) && f.level(at[0], at[1], 200) && free(at[0], at[1], 220)) put("southsands:rafflesia_bloom", at, rnd() * 360, { s: 0.8 + rnd() * 0.35, solid: [disc(100, 0, 0, "plant")], r: 220 });
  for (const [x, y, h, s] of [[-3300, 1600, 40, 1], [-2300, 4000, 110, 0.9], [-4100, -1300, 20, 0.85], [1400, 3900, 70, 1], [-1000, 2300, 150, 0.8]] as number[][])
    if (open(x, y, 350) && f.level(x, y, 300)) put("fallen_log", [x, y], h, { s, solid: [box(110 * s, 620 * s, 0, 0, "log")], r: 330 * s });
  for (const [x, y] of [[-3700, 2500], [-2000, -1400], [2000, 3900], [-4400, 3000], [-2400, 1900]] as XY[]) if (open(x, y, 150)) put("stump", [x, y], x, { solid: [disc(60, 0, 0, "log")], r: 110 });
  for (const [x, y, s] of [[-3600, 4400, 1], [-2900, -900, 0.8], [400, 3300, 0.9], [2300, -2400, 1], [4000, -3600, 0.85], [-2400, -2600, 0.9], [3800, 300, 0.8]] as number[][])
    if (open(x, y, 200) && f.level(x, y, 160)) put("boulder_mossy", [x, y], x + y, { s, solid: [disc(150 * s, 0, 0, "rock")], r: 220 * s });
  for (const [m, every] of [[MUD[0], 1], [MUD[1], 1], [MUD[2], 2]] as [Poly, number][])
    m.forEach(([x, y], i) => { if (i % every === 0 && free(x, y, 100)) put(i % 3 ? "mangrove" : "nipa_palm", [x, y], i * 47, { s: 0.75 + (i % 3) * 0.12, solid: "none", r: 150 }); });
  for (const [x, y] of [[-5200, 2500], [-4500, 2700], [-5300, 4300], [-3900, 3800]] as XY[]) if (free(x, y, 150) && open(x, y, 150)) put("mangrove", [x, y], x, { s: 0.8, solid: "none", r: 160 });
  // reeds and rocks along the stream's banks
  for (let d = 300, k = 0; k < 40; d += 480, k++) {
    let acc = 0, p: XY | null = null, dir: XY = [1, 0];
    for (let i = 0; i + 1 < RIVER.length; i++) {
      const a = RIVER[i], b = RIVER[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (acc + L >= d) { const t = (d - acc) / L; p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; dir = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; break; }
      acc += L;
    }
    if (!p) break;
    const s = k % 2 ? 1 : -1, x = p[0] - dir[1] * s * 330, y = p[1] + dir[0] * s * 330;
    if (Math.abs(x) > R || Math.abs(y) > R || Math.hypot(x - PLANK[0], y - PLANK[1]) < 800 || !open(x, y, 60)) continue;
    put(k % 3 ? "reeds" : "rock_cluster", [x, y], d, { s: k % 3 ? 0.9 : 0.45, solid: "none", r: 70 });
  }

  // ---- the forest: thick along the edges and in thickets, a tree here and there between, so glades
  // open where the monsters roam; ferns, bushes and elephant ears under it. On the tableland it thins
  // northward, and acacias, palms and thorn bushes take over ----
  const THICKETS: [number, number, number][] = [
    [-2800, 3200, 700], [-4300, 2200, 500], [-1200, 2800, 500], [-3300, -300, 600], [-2000, -2200, 500], [-4700, -1000, 500],
    [1800, 4200, 600], [500, 2600, 400], [2300, -1600, 600], [3600, -2800, 700], [1200, -3500, 500], [3400, 3700, 500],
    [-3800, -3800, 600], [-2400, -4200, 500], [-4800, -3200, 500], [4300, 400, 500],
  ];
  const view = (x: number, y: number, cx: number, cy: number, r: number) => Math.hypot(x - cx, y - cy) < r || (x < cx && x > cx - r * 1.8 && Math.abs(y - cy) < r * 0.9);
  const keepOut = (x: number, y: number) =>
    view(x, y, PYRAMID[0], PYRAMID[1], 1300) || Math.abs(y - BY) < 500 && x > S_EDGE - 600 && x < N_EDGE + 600 || view(x, y, STELAE[0], STELAE[1], 800) ||
    view(x, y, FALL1.at[0], FALL1.at[1], 600) || view(x, y, FALL2.at[0], FALL2.at[1], 700) || onStream(x, y) || inPoly(COURT, x, y) ||
    f.warps.some((w) => Math.hypot(w.x - x, w.y - y) < 700) || toLine(x, y, SHORE) < 350;
  const KINDS = ["flora:JungleTree", "flora:JungleTree", "vine_tree", "flora:Bamboo", "flora:JungleTree", "flora:PalmTall", "vine_tree", "flora:JungleTree"];
  const DRY_KINDS = ["desert:acacia", "flora:Palm", "desert:acacia", "flora:PalmTall", "desert:acacia", "desert:dead_tree"];
  const R2 = R;
  for (let x = -R2 + 150; x < R2; x += 330)
    for (let y = -R2 + 150; y < R2; y += 330) {
      const px = x + (rnd() - 0.5) * 260, py = y + (rnd() - 0.5) * 260;
      const edge = Math.min(R2 - Math.abs(px), R2 - Math.abs(py));
      const thick = THICKETS.some(([cx, cy, r]) => Math.hypot(px - cx, py - cy) < r);
      const d = dry(px, py), want = (edge < 700 ? 0.8 : edge < 1200 ? 0.45 : thick ? 0.65 : 0.1) * (1 - 0.8 * d);
      if (rnd() > want || !open(px, py, 260) || !f.level(px, py, 170) || !free(px, py, 230) || keepOut(px, py)) continue;
      const kind = rnd() < d ? DRY_KINDS[Math.floor(rnd() * DRY_KINDS.length)] : KINDS[Math.floor(rnd() * KINDS.length)];
      const big = kind.endsWith("vine_tree");
      put(kind, [px, py], rnd() * 360, { s: 0.8 + rnd() * 0.35, solid: kind.includes("Bamboo") ? [disc(45)] : big ? [disc(50)] : kind.startsWith("desert:") ? [disc(40)] : "auto", r: big ? 260 : 180 });
    }
  const UNDER = ["giant_fern", "giant_fern", "flora:JungleBush", "elephant_ear", "giant_fern", "flora:JungleBush", "tree_fern", "flora:JungleBush", "elephant_ear", "giant_fern"];
  const DRY_UNDER = ["desert:dry_bush", "desert:grass_tuft", "desert:dry_bush", "desert:grass_patch", "desert:grass_tuft"];
  for (let x = -R2 + 100; x < R2; x += 230)
    for (let y = -R2 + 100; y < R2; y += 230) {
      const px = x + (rnd() - 0.5) * 200, py = y + (rnd() - 0.5) * 200;
      const edge = Math.min(R2 - Math.abs(px), R2 - Math.abs(py));
      const nearTree = taken.some(([tx, ty, tr]) => tr >= 180 && tr <= 260 && Math.hypot(tx - px, ty - py) < 420);
      const d = dry(px, py), want = (edge < 900 ? 0.6 : nearTree ? 0.55 : !open(px, py, 420) ? 0.45 : 0.3) * (1 - 0.55 * d);
      if (rnd() > want || !open(px, py, 170) || !f.level(px, py, 100) || !free(px, py, 90) || keepOut(px, py)) continue;
      const kind = rnd() < d * 1.2 ? DRY_UNDER[Math.floor(rnd() * DRY_UNDER.length)] : UNDER[Math.floor(rnd() * UNDER.length)];
      put(kind, [px, py], rnd() * 360, { s: 0.75 + rnd() * 0.4, solid: kind === "tree_fern" ? [disc(22, 0, 0, "post")] : "none", r: 80 });
    }
  // past the edges: deep jungle west and south (on the tableland and the headland too), the dry
  // country and its sand to the north, nothing on the sea
  const rimOut = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) !== 0 || toLine(x, y, SHORE) < 350;
  const wetRim = (x: number, y: number) => rimOut(x, y) || dry(x, y) > 0.55 || (dry(x, y) > 0.25 && rnd() < 0.5);
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["JungleTree", "JungleTree", "Bamboo", "PalmTall", "JungleTree", "JungleBush", "JungleTree", "Palm"], wetRim, { count: 650, spacing: 340, tries: 12000 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["vine_tree", "giant_fern", "tree_fern"], (x, y) => wetRim(x, y) || (Math.abs(x) < R + 500 && Math.abs(y) < R + 500), { count: 140, spacing: 600, tries: 4000, kit: "jungle" });
  const sandy = (x: number, y: number) => rimOut(x, y) || dry(x, y) < 0.55;
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["acacia", "dry_bush", "dry_bush", "acacia", "grass_tuft", "dune_ridge", "boulder_big"], sandy, { count: 130, spacing: 520, tries: 5000, kit: "desert" });

  // ---- monsters: the jungle floor on both banks, below the falls, the tableland and its dry north,
  // the pyramid's step, the headland ----
  const busy = (x: number, y: number) => inPoly(COURT, x, y) || Math.hypot(x - PLANK[0], y - PLANK[1]) < 800 || onStream(x, y, 300) || (Math.abs(y - BY) < 400 && x > S_EDGE - 500 && x < N_EDGE + 500);
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 700, keepOut: busy, max: 52 });

  const npcs: NpcSpec[] = [
    {
      id: "waterfall_gorge_scholar", x: PYRAMID[0] - 300, y: PYRAMID[1] + 1000, face: 60, name: "ดร.วรินทร์", title: "นักโบราณคดีแห่งเมืองหลวง", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "amber", eyes: "teal", top: "top_adventurer_ochre", bottom: "bottom_adventurer_cocoa" },
      lines: [
        "พีระมิดนี้เก่ากว่าซากเมืองในป่าดิบ คนที่สร้างมันบูชาน้ำ ลำธารบนลานนี้จึงไหลผ่านหน้าวิหารก่อนตกลงหุบ",
        "บนแหลมฝั่งใต้มีศิลาสลักหันหน้าออกทะเลเป็นวง ข้ามสะพานเชือกไปดูได้ แต่อย่ามองลงข้างล่างนะ",
        "ดอกบัวผุดยักษ์ที่นี่บางดอกเดินได้ ถ้ามันหันปากมาทางเจ้า ให้รีบกลั้นหายใจแล้วหนี",
      ],
    },
    {
      id: "waterfall_gorge_hunter", x: N_EDGE + 650, y: BY + 350, face: 180, name: "พรานคำ", title: "พรานผู้เฝ้าสะพานเชือก", role: "talk",
      look: { gender: "male", hair: "", hairColor: "ink", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_black" },
      lines: [
        "สะพานเชือกนี้ข้าซ่อมเองทุกฤดูฝน ไม้กระดานหายไปแผ่นสองแผ่นก็ก้าวข้ามไปเถอะ",
        "เสือดำในหุบนี้ซ่อนตัวในเงาไม้เก่ง เห็นตาเหลืองวาบเมื่อไหร่ก็ตั้งท่าไว้เลย",
        "ขึ้นเหนือไปบนลานผาจะเริ่มเป็นทราย เดินต่อไปก็ถึงทะเลทรายใหญ่ ส่วนทางลงใต้ข้ามสะพานไม้ไปป่าชายเลน",
      ],
    },
  ];

  const town = f.finishField({
    ground,
    scenery,
    sky: "#2f4a2c",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && dry(x, y) < 0.35 && !onStream(x, y), density: 0.1 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -500, y: 4300 },
    npcs,
    labels: [
      { x: W_EXIT[0], y: W_EXIT[1] - 250, text: "ทางไปป่าดิบแดนใต้", kind: "gate" },
      { x: N_EXIT[0] - 250, y: N_EXIT[1], text: "ทางไปทะเลทรายใหญ่", kind: "gate" },
      { x: S_EXIT[0] + 250, y: S_EXIT[1], text: "ทางไปชายฝั่งป่าชายเลน", kind: "gate" },
      { x: PYRAMID[0] - 300, y: PYRAMID[1], text: "พีระมิดใต้เถาวัลย์" },
      { x: FALL2.at[0] - 500, y: FALL2.at[1], text: "น้ำตกสองชั้น" },
      { x: (S_EDGE + N_EDGE) / 2, y: BY, text: "สะพานเชือกข้ามหุบ" },
      { x: STELAE[0] + 300, y: STELAE[1], text: "แหลมศิลาสลัก" },
      { x: -2600, y: 2000, text: "หุบผาน้ำตก" },
      { x: -4700, y: 2600, text: "บึงโคลนชายเลน", kind: "small" },
      { x: PLANK[0] - 300, y: PLANK[1], text: "สะพานไม้ข้ามลำธาร", kind: "small" },
      { x: 4300, y: 3500, text: "ลานผาทรายขอบทะเลทราย", kind: "small" },
    ],
  });

  // Under the rope bridge there is only air: the rock faces the ground would hang down each side of
  // the way across are taken out between the two edges (a stub is left at each end).
  town.level.root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh || !m.geometry.index) return;
    const mat = m.material as THREE.Material;
    if (Array.isArray(mat) || mat.side !== THREE.DoubleSide) return;
    const P = m.geometry.getAttribute("position"), idx = m.geometry.index!, keep: number[] = [];
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
      const x = (P.getX(a) + P.getX(b) + P.getX(c)) / 3, y = -(P.getZ(a) + P.getZ(b) + P.getZ(c)) / 3;
      if (x > S_EDGE + 100 && x < N_EDGE - 100 && Math.abs(y - BY) < 330) continue;
      keep.push(a, b, c);
    }
    m.geometry.setIndex(keep);
  });
  return town;
}

// ทะเลทรายใหญ่ (the great desert) and the ruins of the old city, monsters Lv 30-45: east of
// Bahamas, dunes roll up to a plateau where a city older than any kingdom lies half under the
// sand. A processional way climbs from the dunes through the old city gate onto the lower city
// (a terrace of broken houses, columns and obelisks, where scholars from Bahamas dig), and up
// again to the high terrace of the temple. Among the dunes before it: a colossal stone head, a
// rock with an obelisk to watch the sand from, and an oasis of palms where the caravans water.
// A mesa wall closes the east, dunes roll away on every other side. From the oasis a caravan
// track runs east past the camp and round the north of the old city to a fork: north over the
// dunes to the red dunes on the inner sea, east out through a cut in the mesa wall to the glass
// desert; and from the foot of the watch rock another runs south down to the waterfall gorge.
//
// Laid out at full size in centimetres (north +X, east -Y) and scaled by TOWN_SCALE in finish.
// Ways out: west to Bahamas' east gate, north (the middle) to the salt dunes, east (the north
// end) to the glass desert, south (west of the middle) to the waterfall gorge.

import { FieldBuilder } from "./field";
import type { Poly } from "./paved";
import { useKits } from "./town";
import type { Town } from "./town";
import type { SolidSpec } from "../world";
import { KIT as DESERT } from "./kits/desert";
import { KIT as BAHAMAS } from "./kits/bahamas";
import { KIT as TRUNRADA } from "./kits/trunrada";
import type { NpcSpec } from "../npcs";
import type { MapLabel } from "../maps";

useKits(DESERT, BAHAMAS, TRUNRADA);

type XY = [number, number];

// the same outline with no side longer than `step` (the solids along a cliff are one per side,
// and the monsters keep their distance from each solid's whole length)
function dense(poly: Poly, step = 700): Poly {
  const out: Poly = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}

// a smooth curve through the points (Catmull-Rom), n steps a span
function smooth(pts: XY[], n = 6): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const c = (j: number) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      out.push([c(0), c(1)]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// a strip `w` wide along a polyline (a track), its width breathing a little
function band(pts: XY[], w: number, breathe = 0.08): Poly {
  const left: XY[] = [], right: XY[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const hw = (w / 2) * (1 + breathe * Math.sin(i * 0.9));
    left.push([pts[i][0] - (dy / L) * hw, pts[i][1] + (dx / L) * hw]);
    right.push([pts[i][0] + (dy / L) * hw, pts[i][1] - (dx / L) * hw]);
  }
  return [...left, ...right.reverse()];
}
// the x of a track that runs east-west, at y
function xAt(path: XY[], y: number): number {
  for (let i = 0; i + 1 < path.length; i++) {
    const [ax, ay] = path[i], [bx, by] = path[i + 1];
    if ((y - ay) * (y - by) <= 0 && ay !== by) return ax + ((bx - ax) * (y - ay)) / (by - ay);
  }
  return path[0][0];
}
const ellipse = (cx: number, cy: number, rx: number, ry: number, n = 22, wob = 0.06): Poly =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, k = 1 + wob * Math.sin(a * 3 + 1) + wob * 0.6 * Math.sin(a * 5);
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k] as XY;
  });

// the old city gate's two pylons (its own frame: the passage runs along X between them)
// (and the sand drifted against their outer sides)
const GATE_SOLID: SolidSpec[] = [
  { kind: "gate", x: 0, y: -560, w: 320, d: 760, rot: 0 },
  { kind: "gate", x: 0, y: 560, w: 320, d: 760, rot: 0 },
];
// the temple (its own frame, front -X): the podium in quarters, the stair, the guardians and the
// dunes over its back and west side
const TEMPLE_SOLID: SolidSpec[] = [
  ...[[-350, -450], [350, -450], [-350, 450], [350, 450]].map(([x, y]) => ({ kind: "temple", x, y, w: 700, d: 900, rot: 0 })),
  { kind: "temple", x: -760, y: 0, w: 240, d: 720, rot: 0 },
  { kind: "statue", x: -990, y: -480, w: 340, d: 150, rot: 0 }, { kind: "statue", x: -990, y: 480, w: 340, d: 150, rot: 0 },
  { kind: "dune", x: 870, y: -450, w: 340, d: 900, rot: 0 }, { kind: "dune", x: 870, y: 450, w: 340, d: 900, rot: 0 },
  { kind: "dune", x: -360, y: 1060, w: 720, d: 320, rot: 0 }, { kind: "dune", x: 360, y: 1060, w: 720, d: 320, rot: 0 },
  { kind: "dune", x: -560, y: -1060, r: 220 },
];
// the colossal head and the sand round it (its own frame)
const HEAD_SOLID: SolidSpec[] = [
  { kind: "statue", x: 20, y: 0, r: 360 }, { kind: "dune", x: 260, y: 0, r: 380 }, { kind: "dune", x: 60, y: -380, r: 220 }, { kind: "dune", x: 200, y: 380, r: 220 },
];

// a ruined wall's masonry (not the sand drifted against it)
const WALL_SOLID: SolidSpec[] = [{ kind: "wall", x: 0, y: 0, w: 220, d: 600, rot: 0 }];

// a dune crest (its own frame), so nobody wades through the sand
const DUNE_SOLID: SolidSpec[] = [{ kind: "dune", x: 20, y: 0, r: 230 }, { kind: "dune", x: 90, y: -270, r: 190 }, { kind: "dune", x: 90, y: 270, r: 190 }];

export function build(_quality: { flowers: number }): Town {
  const R = 5500, A = 9000;

  // ---- the ground: the lower city's terrace with the temple's terrace on it, the watch rock,
  // dunes everywhere else ----
  const L1: Poly = [[-1300, 1350], [1300, 1300], [2500, 600], [2800, -1800], [2600, -4300], [1900, -5000], [-2000, -5050], [-2800, -3800], [-2700, -1200], [-2100, 700]];
  const L2: Poly = [[-1500, -1300], [1600, -1250], [2050, -2400], [2000, -4000], [1400, -4650], [-1600, -4700], [-2050, -3800], [-2000, -2300]];
  const P3: Poly = [[-3300, 3000], [-3100, 4100], [-3700, 4900], [-4900, 4800], [-5100, 3700], [-4500, 2900]];
  const RAMP_L1 = { top: [0, 1325] as XY, bottom: [0, 2075] as XY, width: 520 };
  const RAMP_L2 = { top: [0, -1276] as XY, bottom: [0, -376] as XY, width: 500 };
  const RAMP_P3 = { top: [-3200, 3550] as XY, bottom: [-2265, 3380] as XY, width: 440 };
  const OASIS: XY = [3600, 3000];
  const f = new FieldBuilder(114, {
    hills: [
      // dunes on the open sand (none on the tracks, the ramps' feet or the oasis)
      { x: -2200, y: 4700, r: 900, h: 170 }, { x: 1500, y: 4800, r: 800, h: 150 }, { x: -3900, y: 1500, r: 1100, h: 200 },
      { x: 4800, y: 1000, r: 800, h: 160 }, { x: 4300, y: -1500, r: 1100, h: 200 },
      { x: 4200, y: -4300, r: 1000, h: 190 }, { x: 3600, y: -3000, r: 500, h: 90 }, { x: -4300, y: -800, r: 1100, h: 210 },
      { x: -4200, y: -3800, r: 1200, h: 220 }, { x: 3300, y: 4900, r: 600, h: -80 }, { x: -1000, y: 4900, r: 600, h: 120 },
      { x: -4500, y: -5300, r: 900, h: 170 },
      // the great dunes beyond
      { x: 7000, y: 2000, r: 2500, h: 450 }, { x: 7200, y: -3000, r: 2400, h: 500 }, { x: -7200, y: 2500, r: 2400, h: 480 },
      { x: -7000, y: -2500, r: 2600, h: 520 }, { x: -6800, y: -6800, r: 2200, h: 400 }, { x: 2500, y: 7400, r: 2300, h: 420 },
      { x: -3000, y: 7300, r: 2300, h: 450 }, { x: 6500, y: 6500, r: 2000, h: 380 }, { x: -6500, y: 6500, r: 2000, h: 400 },
    ],
    plateaus: [
      { poly: dense(L1), h: 220, ramps: [RAMP_L1] },
      { poly: dense(L2), h: 480, ramps: [RAMP_L2] },
      { poly: dense(P3), h: 300, ramps: [RAMP_P3] },
      // the mesa wall closing the east (a cut through it where the track to the glass desert goes on)
      { poly: dense([[-8700, -6300], [-4000, -6650], [0, -6200], [3050, -6580], [3100, -8200], [3900, -8200], [3950, -6690], [8700, -6300], [8700, -8700], [-8700, -8700]]), h: 700 },
    ],
    rock: "CliffSand",
  });

  // ---- the tracks: in from Bahamas to the foot of the old city, spurs to the oasis and the
  // watch rock; the processional way paved up through the gate to the temple ----
  const MAIN = smooth([[0, 5900], [0, 5150], [350, 4300], [100, 3400], [-150, 2750], [0, 2075], [0, 1325]]);
  const SPUR_O = smooth([[150, 3450], [1100, 3380], [2000, 3220], [2780, 3040]]);
  const SPUR_P = smooth([[-80, 3050], [-1000, 3300], [-1700, 3330], [-2265, 3380], [-3200, 3550], [-3850, 3800]]);
  // the caravan track from the oasis east round the north of the old city, forking north to the
  // salt dunes and east to the glass desert; the track south from the foot of the watch rock
  const WAY_NE = smooth([[2780, 3040], [3100, 2400], [3350, 1300], [3800, 600], [4200, 250]]);
  const WAY_N = smooth([[4200, 250], [4700, 80], [5150, 0], [7600, 0]]);
  const WAY_E = smooth([[4200, 250], [4500, -600], [4650, -1600], [4600, -2600], [4350, -3600], [3900, -4500], [3500, -5150], [3500, -7600]]);
  const WAY_S = smooth([[-2265, 3380], [-2700, 2950], [-3300, 2450], [-4100, 2250], [-5150, 2200], [-7600, 2200]]);
  const WAY = band([[0, 1400], [0, 700], [0, -400], [0, -1276], [0, -2060]], 520, 0);
  const COURT: Poly = [[-1350, -1500], [1350, -1500], [1350, -2080], [-1350, -2080]];
  const POND = ellipse(OASIS[0], OASIS[1], 700, 520);
  const ground = f.ground({
    area: { x0: -A, x1: A, y0: -A, y1: A },
    roads: [band(MAIN, 500), band(SPUR_O, 400), band(SPUR_P, 420), band(WAY_NE, 420), band(WAY_N, 420), band(WAY_E, 420), band(WAY_S, 420)],
    plazas: [WAY, COURT],
    plaza: [0.92, 0.82, 0.64],
    water: [POND],
    base: "sand",
  });
  const scenery = [f.waterSheet({ x0: OASIS[0] - 950, x1: OASIS[0] + 950, y0: OASIS[1] - 750, y1: OASIS[1] + 750 }, -14, "Desert_Water")];
  for (const [dx, r] of [[-330, 470], [0, 520], [330, 470]] as XY[]) f.blockDisc([OASIS[0] + dx, OASIS[1]], r);

  // ---- the ways out: west to Bahamas, north to the salt dunes, east to the glass desert, south to
  // the waterfall gorge ----
  const W: XY = [xAt(MAIN, 5150), 5150], N: XY = [5150, 0], E: XY = [3500, -5150], S: XY = [-5150, 2200];
  f.exit("bahamas", W, [xAt(MAIN, 4450), 4450]);
  f.exit("salt_dunes", N, [4450, 120]);
  f.exit("glass_desert", E, [3800, -4450]);
  f.exit("waterfall_gorge", S, [-4450, 2250]);

  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number) => taken.every(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) > tr + r);
  const open = (x: number, y: number, r: number) =>
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) && f.level(x, y, Math.max(60, r * 0.7));
  const put = (ref: string, at: XY, h: number, r: number, o: { s?: number; solid?: "none" | SolidSpec[] } = {}) => {
    f.put(ref, at, h, { s: o.s ?? 1, ...(o.solid ? { solid: o.solid } : {}) });
    taken.push([at[0], at[1], r]);
  };
  const tree = (ref: string, at: XY, h: number, s = 1, trunk = 30) => {
    f.put(ref, at, h, { s, solid: [{ kind: "tree", x: 0, y: 0, r: trunk }] });
    taken.push([at[0], at[1], 120 * s]);
  };
  const rnd = f.rnd;
  const scatter = (refs: string[], n: number, box: { x0: number; x1: number; y0: number; y1: number }, r: number, o: { s?: [number, number]; keep?: (x: number, y: number) => boolean; tree?: number; solid?: SolidSpec[] } = {}) => {
    let left = n;
    for (let i = 0; i < n * 40 && left > 0; i++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (!open(x, y, r) || !free(x, y, r) || (o.keep && !o.keep(x, y))) continue;
      const ref = refs[Math.floor(rnd() * refs.length)], s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      if (o.tree) tree(ref, [x, y], rnd() * 360, s, o.tree);
      else put(ref, [x, y], rnd() * 360, r, { s, ...(o.solid ? { solid: o.solid } : {}) });
      left--;
    }
  };
  const nearExit = (x: number, y: number) => [W, N, E, S].some((p) => Math.hypot(x - p[0], y - p[1]) < 1000);
  const IN = { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 };
  const onL1 = (x: number, y: number) => Math.abs(f.h(x, y) - 220) < 1;

  // ---- the way out: a signpost, palms and a ruined column for a marker ----
  put("desert:signpost", [W[0] - 450, W[1] - 150], -90, 80);
  put("desert:ruin_column", [W[0] + 520, W[1] - 300], 30, 100, { s: 0.8 });
  tree("flora:PalmBent", [W[0] - 700, W[1] - 700], 200, 0.9);
  // the new ways out: signposts at the fork and at each, rocks for markers
  put("desert:signpost", [4500, 600], 120, 80);
  put("desert:signpost", [N[0] - 350, N[1] + 400], 180, 80);
  put("desert:boulder_flat", [N[0] - 500, N[1] - 600], 30, 250, { s: 0.7 });
  put("desert:signpost", [E[0] + 450, E[1] + 450], 90, 80);
  put("desert:rock_cluster", [E[0] - 600, E[1] + 300], 60, 220, { s: 0.7 });
  put("desert:signpost", [S[0] + 400, S[1] - 380], 0, 80);
  put("desert:boulder_big", [S[0] + 600, S[1] + 650], 20, 260, { s: 0.6 });

  // ---- the oasis: palms round the water, reeds, a well, a trough and a caravan resting ----
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + 0.25, k = 1.25 + rnd() * 0.35;
    const p: XY = [OASIS[0] + Math.cos(a) * 700 * k, OASIS[1] + Math.sin(a) * 520 * k];
    if (ground.kind(p[0], p[1]) !== 0 || Math.abs(a - Math.PI) < 0.35) continue; // the shore where the track comes down
    tree(["flora:Palm", "flora:PalmTall", "flora:PalmBent"][i % 3], p, rnd() * 360, 0.85 + rnd() * 0.3, 28);
  }
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + rnd() * 0.2, k = 1.0 + rnd() * 0.12;
    if (Math.abs(a - Math.PI) < 0.35) continue;
    f.put("desert:reeds", [OASIS[0] + Math.cos(a) * 700 * k, OASIS[1] + Math.sin(a) * 520 * k], rnd() * 360, { s: 0.8 + rnd() * 0.4 });
  }
  put("bahamas:well", [2650, 3950], 0, 140);
  put("bahamas:camel_trough", [2700, 2250], 90, 140);
  put("bahamas:caravan_tent", [4600, 2100], 120, 380);
  put("bahamas:caravan_tent", [4700, 3900], 60, 380);
  put("bahamas:rug_pile", [4300, 1550], 20, 160);
  put("trunrada:campfire", [3900, 1800], 0, 170);
  put("bahamas:pottery_set", [2400, 4250], 30, 90);
  put("common:crate", [4150, 4300], 10, 60);
  put("common:crate", [4230, 4360], 35, 60);
  put("trunrada:cart", [2100, 2500], 60, 160);

  // ---- the colossal head in the dunes north of the track, its face turned up to the south ----
  put("desert:colossus_head", [1600, 2250], -20, 560, { s: 0.85, solid: HEAD_SOLID });
  put("desert:dune_ridge", [-2900, 1900], 200, 480, { s: 0.8, solid: DUNE_SOLID });
  // a caravan that never arrived
  put("desert:cart_wreck", [-1500, 2250], 70, 330);
  put("desert:bones", [-1950, 2700], 20, 200);
  put("desert:bones", [-1100, 1800], 140, 200, { s: 0.8 });
  put("common:crate", [-1250, 2750], 30, 60);

  // ---- the old city spilled past its terrace: walls and columns half under the dunes ----
  for (const [x, y, h, ref] of [[3300, -1000, 0, "ruin_wall"], [3350, -2450, 6, "ruin_wall"], [3250, -3750, -4, "ruin_wall"], [3550, -1700, 0, "ruin_column"],
    [3650, -3150, 0, "ruin_column"], [3950, -2250, 80, "column_fallen"], [-3350, -1600, 4, "ruin_wall"], [-3300, -3000, -6, "ruin_wall"], [-3600, -2300, 0, "ruin_column"],
    [-3500, -200, 70, "column_fallen"], [4100, -600, 0, "ruin_column"], [-3150, -4400, 0, "ruin_column"]] as [number, number, number, string][])
    if (free(x, y, 300)) put(`desert:${ref}`, [x, y], h, 330, { s: 0.85, ...(ref === "ruin_wall" ? { solid: WALL_SOLID } : {}) });

  // ---- the watch rock: an obelisk over the sand, bones, rocks ----
  put("bahamas:obelisk", [-4150, 4000], 0, 130);
  put("desert:bones", [-4300, 3200], 60, 200);
  put("desert:boulder_big", [-4600, 4450], 30, 260, { s: 0.8 });
  put("desert:rock_cluster", [-3600, 4500], 0, 220, { s: 0.8 });
  put("desert:hoodoo", [-4700, 3400], 40, 180, { s: 0.8 });

  // ---- the old city gate at the head of the ramp ----
  put("desert:ruin_gate", [0, 700], -90, 0, { solid: GATE_SOLID });
  taken.push([-410, 700, 360], [410, 700, 360], [0, 700, 260]);
  // the processional way: columns either side, obelisks at the foot of the temple's ramp
  for (const y of [250, -150]) for (const s of [-1, 1]) put("desert:ruin_column", [s * 500, y], (y + s * 40) % 360, 110, { s: y > 0 ? 1 : 0.85 });
  for (const s of [-1, 1]) put("bahamas:obelisk", [s * 820, -230], 0, 130);
  // the scholars' dig by the gate
  put("bahamas:caravan_tent", [1500, -300], 70, 360);
  put("common:crate", [1050, -620], 15, 60);
  put("common:crate", [1110, -700], 50, 60);
  put("trunrada:cart", [900, 300], 100, 160);
  put("bahamas:pottery_set", [1950, 250], 0, 90);
  put("desert:signpost", [700, 1050], -90, 80);
  // the lower city: houses in ruins, fallen columns, sand drifting over them
  const house = (cx: number, cy: number, rot: number, skip: number) => {
    const sides: [number, number, number][] = [[-250, 0, 0], [250, 0, 0], [0, -250, 90], [0, 250, 90]];
    const c = Math.cos((rot * Math.PI) / 180), s = Math.sin((rot * Math.PI) / 180);
    sides.forEach(([dx, dy, h], i) => {
      if (i === skip) return;
      f.put("desert:ruin_wall", [cx + dx * c - dy * s, cy + dx * s + dy * c], h + rot, { s: 0.83, solid: WALL_SOLID });
    });
    taken.push([cx, cy, 380]);
  };
  house(-1650, 300, 8, 1);
  house(-1800, -750, -6, 2);
  house(2050, -950, 12, 0);
  house(-1500, -2950, 90, 3);
  put("desert:column_fallen", [-950, 950], 60, 330, { s: 0.85 });
  put("desert:column_fallen", [1150, -1050], 10, 330, { s: 0.8 });
  put("desert:ruin_column", [-900, -900], 0, 110);
  put("desert:ruin_column", [2250, -2300], 0, 110, { s: 0.9 });
  put("desert:ruin_column", [-2350, -2000], 0, 110, { s: 0.75 });
  put("desert:ruin_wall", [2300, -3500], 0, 330, { s: 0.83, solid: WALL_SOLID });
  put("desert:ruin_wall", [-2300, -4300], 20, 330, { s: 0.83, solid: WALL_SOLID });
  put("desert:dune_ridge", [-2050, 1000], 130, 450, { s: 0.7, solid: DUNE_SOLID });
  put("desert:dune_ridge", [2200, -4300], 250, 450, { s: 0.6, solid: DUNE_SOLID });
  put("desert:bones", [1700, 900], 100, 200);

  // ---- the temple on its terrace, columns in the court before it ----
  put("desert:temple_ruin", [0, -3200], -90, 1400, { solid: TEMPLE_SOLID });
  for (const y of [-1650, -1950]) for (const s of [-1, 1]) put("desert:ruin_column", [s * 1050, y], y % 90, 110, { s: y < -1700 ? 0.7 : 1 });
  put("desert:column_fallen", [1500, -2150], 0, 250, { s: 0.6 });
  put("desert:rock_cluster", [-1650, -2400], 30, 180, { s: 0.6 });

  // ---- the open sand: dune crests, rocks, a few cacti and dead trees, bones ----
  scatter(["desert:dune_ridge"], 13, IN, 480, { s: [0.7, 1.1], keep: (x, y) => !nearExit(x, y) && !onL1(x, y), solid: DUNE_SOLID });
  scatter(["desert:rock_cluster", "desert:boulder_flat", "desert:boulder_big"], 18, IN, 240, { s: [0.5, 0.9], keep: (x, y) => !nearExit(x, y) });
  scatter(["flora:Cactus", "flora:CactusRound"], 14, IN, 90, { s: [0.7, 1.1], keep: (x, y) => f.h(x, y) < 210 });
  scatter(["desert:dead_tree"], 5, IN, 150, { s: [0.8, 1.1], tree: 26, keep: (x, y) => f.h(x, y) < 210 });
  scatter(["desert:bones", "desert:dry_bush"], 10, IN, 160, { keep: (x, y) => !nearExit(x, y) });
  scatter(["desert:ruin_column", "desert:boulder_flat"], 8, IN, 160, { s: [0.6, 0.9], keep: onL1 });
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["grass_tuft"], (x, y) => !open(x, y, 100) || !free(x, y, 60) || Math.hypot(x - OASIS[0], y - OASIS[1]) > 1600, { count: 40, tries: 2000, spacing: 260, kit: "desert" });

  // ---- the land beyond: dune crests, buttes and rocks on the great dunes, palms west ----
  const rim = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) !== 0;
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["dune_ridge", "dune_ridge", "dune_ridge", "boulder_big", "rock_cluster", "butte", "hoodoo"], rim, { count: 110, tries: 3000, spacing: 800, kit: "desert" });
  f.woods({ x0: -A, x1: A, y0: R, y1: A }, ["PalmBent", "Cactus", "CactusRound", "Palm"], rim, { count: 30, tries: 1500, spacing: 700 });

  // ---- where the monsters live: the dunes, the lower city and the temple terrace ----
  f.monsterSpots(ground, { x0: -R + 400, x1: R - 400, y0: -R + 400, y1: R - 400 }, { step: 690 });

  const npcs: NpcSpec[] = [
    {
      id: "great_desert_scholar", x: 850, y: 0, face: 180, name: "ศาสตราจารย์โอมาร์", title: "นักโบราณคดีแห่งบาฮามัส", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "teal", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "นครนี้เก่ากว่าอาณาจักรใดที่เรารู้จัก อักษรบนกำแพงยังไม่มีใครอ่านออกเลยสักตัว",
        "วิหารบนลานชั้นบนหันหน้าไปทางตะวันตก รับแสงอาทิตย์ตกทุกวัน คงบูชาดวงอาทิตย์กันมาก่อน",
        "ระวังตัวด้วย ยิ่งขุดลึกยิ่งเจอสิ่งที่ไม่อยากเจอ พวกที่เฝ้าซากนี้ไม่ชอบแขกเท่าไร",
      ],
    },
    {
      id: "great_desert_waterkeeper", x: 2900, y: 3800, face: -50, name: "ซาร่า", title: "ผู้ดูแลโอเอซิส", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "amber", top: "top_adventurer_teal", bottom: "bottom_adventurer_sand" },
      lines: [
        "โอเอซิสนี้เป็นน้ำแหล่งเดียวระหว่างบาฮามัสกับซากเมือง ดื่มได้ แต่อย่าทิ้งขยะลงน้ำนะ",
        "เศียรยักษ์ในเนินทรายนั่น ลมพัดทรายออกทีละนิดทุกปี ปีก่อนยังเห็นแค่หน้าผากเอง",
        "กลับบาฮามัสให้เดินตามรอยเกวียนไปทางตะวันตก ประตูตะวันออกเปิดรอคาราวานทั้งวัน",
      ],
    },
  ];
  const labels: MapLabel[] = [
    { x: 0, y: -1800, text: "วิหารโบราณครึ่งจม" },
    { x: -1400, y: 0, text: "ซากนครโบราณ" },
    { x: 0, y: 1100, text: "ประตูนครโบราณ", kind: "small" },
    { x: 1500, y: 200, text: "ค่ายขุดค้น", kind: "small" },
    { x: OASIS[0], y: OASIS[1], text: "โอเอซิสกลางทราย" },
    { x: 1050, y: 2300, text: "เศียรเทพยักษ์" },
    { x: -1500, y: 1800, text: "กองคาราวานที่หายไป", kind: "small" },
    { x: -4100, y: 3600, text: "ผาเฝ้าทราย", kind: "small" },
    { x: W[0], y: W[1], text: "ทางไปบาฮามัส", kind: "gate" },
    { x: N[0] - 250, y: N[1], text: "ทางไปเนินทรายริมทะเลใน", kind: "gate" },
    { x: E[0], y: E[1] + 250, text: "ทางไปทะเลทรายแก้ว", kind: "gate" },
    { x: S[0] + 250, y: S[1], text: "ทางไปหุบผาน้ำตก", kind: "gate" },
  ];

  return f.finishField({
    ground, scenery, sky: "#e3c48e",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: xAt(MAIN, 4300), y: 4300 },
    npcs, labels,
  });
}

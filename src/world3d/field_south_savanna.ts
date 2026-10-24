// ทุ่งสะวันนาใต้ (the southern savanna), monsters Lv 12-20: the open country south of Eden's south
// gate, where the caravan track runs down towards the desert and Bahamas. Tall golden grass, lone
// flat-topped acacias, a waystation on the track, a waterhole where the herds drink; on the east
// a rocky plateau crowned by a giant baobab (with a knoll of boulders on it), on the west a mesa
// with the ruins of an old shrine of the people whose city lies under the great desert. The inner
// sea washes the whole east side: a beach of sand along it, the baobab's plateau standing over the
// water in cliffs. Towards the north the savanna greens into the grass round Eden; rolling ground
// and woods of acacias close the west and south.
//
// Laid out at full size in centimetres (north +X, east -Y) and scaled by TOWN_SCALE in finish.
// Ways out: north to Eden's south gate, south to the desert's edge, and west to the windmill fields
// (n 0.62, where their east way out is) by a farm track off the caravan road at the waystation's
// yard, past the waterhole and between the hills.

import { FieldBuilder } from "./field";
import type { SolidSpec } from "../world";
import type { Poly } from "./paved";
import { useKits } from "./town";
import type { Town } from "./town";
import { KIT as DESERT } from "./kits/desert";
import { KIT as BAHAMAS } from "./kits/bahamas";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as PLAINS } from "./kits/plains";
import type { NpcSpec } from "../npcs";
import type { MapLabel } from "../maps";

useKits(DESERT, BAHAMAS, TRUNRADA, PLAINS);

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
function band(pts: XY[], w: number): Poly {
  const left: XY[] = [], right: XY[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const hw = (w / 2) * (1 + 0.08 * Math.sin(i * 0.9));
    left.push([pts[i][0] - (dy / L) * hw, pts[i][1] + (dx / L) * hw]);
    right.push([pts[i][0] + (dy / L) * hw, pts[i][1] - (dx / L) * hw]);
  }
  return [...left, ...right.reverse()];
}
// the y of a track that runs north-south, at x
function yAt(path: XY[], x: number): number {
  for (let i = 0; i + 1 < path.length; i++) {
    const [ax, ay] = path[i], [bx, by] = path[i + 1];
    if ((x - ax) * (x - bx) <= 0 && ax !== bx) return ay + ((by - ay) * (x - ax)) / (bx - ax);
  }
  return path[0][1];
}
// a polygon with holes, as one outline: each hole wound the other way and joined to the outline's
// first point, so the ground's mask leaves it out when it fills the outline
function withHoles(outer: Poly, holes: Poly[]): Poly {
  const area = (p: Poly) => p.reduce((t, [x, y], i) => t + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0);
  const out: Poly = [...outer, outer[0]];
  for (const h of holes) {
    const ring = Math.sign(area(h)) === Math.sign(area(outer)) ? [...h].reverse() : h;
    out.push(...ring, ring[0], outer[0]);
  }
  return out;
}
const ellipse = (cx: number, cy: number, rx: number, ry: number, n = 20, wob = 0.06): Poly =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, k = 1 + wob * Math.sin(a * 3 + 1) + wob * 0.6 * Math.sin(a * 5);
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k] as XY;
  });

// a ruined wall's masonry (not the sand drifted against it)
const WALL_SOLID: SolidSpec[] = [{ kind: "wall", x: 0, y: 0, w: 220, d: 600, rot: 0 }];

// the inner sea along the east: its shore from past the north edge (where Eden's harbour lies) to
// past the south-east corner, out round the cliffs of the baobab's plateau
const SHORE: XY[] = smooth([
  [9500, -4300], [7000, -4350], [5800, -4400], [5100, -4400], [4800, -4480], [4300, -4870], [3800, -5300], [3200, -5420], [2400, -5300],
  [1800, -5100], [1300, -4750], [700, -4350], [0, -4200], [-1000, -4150], [-2200, -4250], [-3300, -4350], [-4300, -4550], [-5000, -4850],
  [-5500, -5250], [-5800, -5700], [-6000, -6500], [-6100, -9500],
], 4);
const SEA: Poly = [...SHORE, [9500, -9500]];
// the shore's y at x (it runs north to south), and how deep the sand is behind it there (less
// at the plateau's cliffs)
function shoreY(x: number): number {
  for (let i = 1; i < SHORE.length; i++) {
    const [ax, ay] = SHORE[i - 1], [bx, by] = SHORE[i];
    if ((x - ax) * (x - bx) <= 0 && ax !== bx) return ay + ((by - ay) * (x - ax)) / (bx - ax);
  }
  return SHORE[SHORE.length - 1][1];
}
const sandW = (x: number) => 520 - 300 * Math.max(0, 1 - Math.abs(x - 3000) / 1900);
const SAND_IN: XY[] = SHORE.map(([x, y]) => [x, y + sandW(x)]);
const onBeach = (x: number, y: number) => y < shoreY(x) + sandW(x);

export function build(_quality: { flowers: number }): Town {
  const R = 5500, A = 9000;

  // ---- the ground: plateaus with cliffs, ramps up them, hills and hollows ----
  const PLAT_A: Poly = [[1600, -2400], [3000, -2100], [4300, -2700], [4600, -4200], [3600, -5100], [2000, -4900], [1300, -3800]];
  const KNOLL: Poly = [[3600, -3900], [4100, -3750], [4150, -4300], [3800, -4600], [3350, -4350]];
  const PLAT_B: Poly = [[-1200, 2300], [-300, 3400], [-800, 4800], [-2600, 5100], [-4200, 4400], [-4400, 3000], [-3000, 2200]];
  const RAMP_A = { top: [2300, -2255] as XY, bottom: [2080, -1215] as XY, width: 480 };
  const RAMP_B = { top: [-2100, 2245] as XY, bottom: [-2030, 945] as XY, width: 480 };
  const f = new FieldBuilder(112, {
    hills: [
      // (none reaching the shore: the land runs down level to the sand)
      { x: -600, y: -2700, r: 1500, h: 190 }, { x: -3300, y: -2600, r: 1700, h: 240 }, { x: 4300, y: 4200, r: 1250, h: 160 },
      { x: 300, y: 4000, r: 1400, h: 130 }, { x: 2000, y: 4700, r: 900, h: 110 }, { x: -3600, y: -1700, r: 900, h: -90 },
      { x: 400, y: -3300, r: 900, h: 140 }, { x: -4800, y: 1900, r: 900, h: 120 },
      // the rolling land beyond
      { x: 7000, y: 4000, r: 2500, h: 350 }, { x: 7600, y: -1300, r: 2200, h: 300 }, { x: -7300, y: 3200, r: 2400, h: 380 },
      { x: -7600, y: -3300, r: 2500, h: 300 }, { x: 0, y: 7700, r: 2600, h: 320 }, { x: 4500, y: 7300, r: 2000, h: 260 },
    ],
    plateaus: [
      { poly: dense(PLAT_A), h: 350, ramps: [RAMP_A] },
      { poly: dense(KNOLL), h: 620 },
      { poly: dense(PLAT_B), h: 420, ramps: [RAMP_B] },
      // a low mesa in the south-west
      { poly: dense([[-6200, 6700], [-2500, 6950], [-300, 6600], [400, 8700], [-6200, 8700]]), h: 480 },
    ],
    rock: "CliffSand",
  });

  // ---- the tracks: the caravan road north to south, spurs to the baobab, the shrine and the
  // waterhole; a yard before the waystation ----
  const MAIN = smooth([[5900, 650], [5150, 700], [4400, 900], [3500, 700], [2600, 250], [1700, -250], [800, -450], [-200, -250], [-1100, 300], [-2000, 850], [-3000, 950], [-3900, 550], [-4600, 50], [-5150, -250], [-5900, -300]]);
  const SPUR_A = smooth([[2250, 60], [2150, -600], [2090, -1150], [2190, -1700], [2310, -2300], [2500, -2750], [2850, -3050]]);
  const SPUR_B = smooth([[-2010, 820], [-2040, 1300], [-2075, 1800], [-2110, 2300], [-2300, 2800], [-2650, 3250]]);
  const SPUR_W = smooth([[3300, 600], [3150, 1150], [2900, 1650], [2650, 1950]]);
  const YARD: Poly = [[700, -860], [1750, -860], [1800, -420], [650, -560]];
  // ---- (v0.4) the farm track west to the windmill fields, off the caravan road by the yard ----
  const W_WAY: XY = [1350, 5150];
  const WEST_WAY = smooth([[900, -430], [950, 800], [1150, 2100], [1300, 3600], W_WAY, [1400, 6500], [1450, A]]);
  const POND = ellipse(2600, 2650, 650, 480, 22);
  const roads = [band(MAIN, 500), band(SPUR_A, 420), band(SPUR_B, 420), band(SPUR_W, 380), YARD, band(WEST_WAY, 420)];
  const ground = f.ground({
    area: { x0: -A, x1: A, y0: -A, y1: A },
    roads,
    plazas: [],
    water: [POND, SEA],
    base: "steppe",
  });
  // the beach: a second ground a hair over the grass, cut away inland of the sand's line and on
  // the plateau's top
  const sand = f.ground({ area: { x0: -A, x1: A, y0: -A, y1: -3500 }, roads: [], plazas: [], water: [SEA, [...SAND_IN, [-9500, 9500], [9500, 9500]], dense(PLAT_A)], base: "sand" });
  sand.mesh.position.y += 3;
  sand.mesh.renderOrder = 1;
  // the green round Eden coming in from the north: a second ground of grass a hair over the
  // savanna over the last fifth or so: north of a ragged line, patches of it out in the savanna
  // south of the line and patches of the savanna in it north of the line, both thinning away
  // from the line
  const greenLine = (y: number) => 3900 + 250 * Math.sin(y / 1000 + 0.4) + 130 * Math.sin(y / 410 + 1.3);
  const DRY_SIDE: Poly = [];
  for (let y = -A - 400; y <= A + 400; y += 200) DRY_SIDE.push([greenLine(y), y]);
  DRY_SIDE.push([-A - 400, A + 400], [-A - 400, -A - 400]);
  const greenPatches: { c: XY; r: number; p: Poly }[] = [], dryPatches: { c: XY; r: number; p: Poly }[] = [];
  {
    let sd = 5113;
    const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const clear = (c: XY, rr: number, list: { c: XY; r: number }[], gap = 60) => list.every((o) => Math.hypot(o.c[0] - c[0], o.c[1] - c[1]) > o.r + rr + gap);
    for (let i = 0; i < 900 && (greenPatches.length < 70 || dryPatches.length < 70); i++) {
      const out = i % 2 === 0, y = -A + r() * 2 * A, d = r() * 1300, k = 1 - d / 1300;
      if (r() > Math.pow(k, 1.4)) continue;
      const rx = 150 + r() * 430 * k, ry = 170 + r() * 480 * k, rr = Math.max(rx, ry) * 1.1;
      if (out) {
        // a patch of grass in the savanna: wholly south of the line, clear of the others
        const c: XY = [greenLine(y) - d - 40, y];
        const p = ellipse(c[0], c[1], rx, ry, 14, 0.15);
        if (greenPatches.length >= 70 || !p.every(([px, py]) => px < greenLine(py) - 30) || !clear(c, rr, greenPatches)) continue;
        greenPatches.push({ c, r: rr, p });
      } else {
        // a patch of the savanna in the grass, clear of the grass's patches south of the line
        const c: XY = [greenLine(y) + d, y];
        if (dryPatches.length >= 70 || !clear(c, rr, greenPatches, 40)) continue;
        dryPatches.push({ c, r: rr, p: ellipse(c[0], c[1], rx, ry, 14, 0.15) });
      }
    }
  }
  const green = f.ground({
    area: { x0: 2000, x1: A, y0: -A, y1: A },
    roads,
    plazas: [],
    water: [SEA, POND, withHoles(DRY_SIDE, greenPatches.map((g) => g.p)), ...dryPatches.map((d) => d.p)],
    base: "grass",
  });
  green.mesh.position.y += 3;
  green.mesh.renderOrder = 1;
  // how green the land round a point is: nothing a little south of the line, all at the north edge
  const greenness = (x: number, y: number) => Math.max(0, Math.min(1, (x - greenLine(y) + 800) / 2400));
  const scenery = [
    f.waterSheet({ x0: 1700, x1: 3500, y0: 1950, y1: 3350 }, -14, "Desert_Water"),
    // the sea, out past the ground's end
    f.waterSheet({ x0: -A, x1: A + 6000, y0: -20000, y1: -4050 }, -14, "WaterSea"),
    sand.mesh,
    green.mesh,
  ];
  // nobody walks into the sea: a band along the shore's seaward side (it runs north to south,
  // the sea on its left)
  {
    const sea: XY[] = SHORE.map((p, i) => {
      const a = SHORE[Math.max(0, i - 1)], b = SHORE[Math.min(SHORE.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [p[0] - ((b[1] - a[1]) / L) * 280, p[1] + ((b[0] - a[0]) / L) * 280];
    });
    f.blockBand(sea.filter(([x, y]) => Math.abs(x) < R + 800 && y > -R - 1500), 520, { kind: "sea" });
  }
  for (const [x, r] of [[-300, 440], [0, 480], [300, 440]] as XY[]) f.blockDisc([2600 + x, 2650], r);

  // ---- the ways out: north to Eden, south to the desert's edge ----
  const N: XY = [5150, yAt(MAIN, 5150)], S: XY = [-5150, yAt(MAIN, -5150)];
  f.exit("eden", N, [4450, yAt(MAIN, 4450)]);
  f.exit("desert_edge", S, [-4450, yAt(MAIN, -4450)]);
  f.exit("windmill_fields", W_WAY, [1320, 4450]);

  // what stands where, so nothing is put in anything else
  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number) => taken.every(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) > tr + r);
  const open = (x: number, y: number, r: number) =>
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) && !onBeach(x, y - r) && f.level(x, y, Math.max(60, r * 0.7));
  const put = (ref: string, at: XY, h: number, r: number, o: { s?: number; solid?: "none" | SolidSpec[] } = {}) => {
    f.put(ref, at, h, { s: o.s ?? 1, ...(o.solid ? { solid: o.solid } : {}) });
    taken.push([at[0], at[1], r]);
  };
  // a tree with a trunk to bump into (not its whole crown)
  const tree = (ref: string, at: XY, h: number, s = 1, trunk = 42) => {
    f.put(ref, at, h, { s, solid: [{ kind: "tree", x: 0, y: 0, r: trunk }] });
    taken.push([at[0], at[1], 160 * s]);
  };
  const rnd = f.rnd;
  const scatter = (refs: string[], n: number, box: { x0: number; x1: number; y0: number; y1: number }, r: number, o: { s?: [number, number]; keep?: (x: number, y: number) => boolean; tree?: number } = {}) => {
    let left = n;
    for (let i = 0; i < n * 40 && left > 0; i++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (!open(x, y, r) || !free(x, y, r) || (o.keep && !o.keep(x, y))) continue;
      const ref = refs[Math.floor(rnd() * refs.length)], s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      if (o.tree) tree(ref, [x, y], rnd() * 360, s, o.tree);
      else put(ref, [x, y], rnd() * 360, r, { s });
      left--;
    }
  };
  const nearExit = (x: number, y: number) => Math.hypot(x - N[0], y - N[1]) < 900 || Math.hypot(x - S[0], y - S[1]) < 900;
  const IN = { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 };

  // ---- the ways out: a signpost and boulders either side of the track ----
  put("desert:signpost", [N[0] - 150, N[1] - 420], 180, 80);
  put("desert:boulder_flat", [N[0] + 150, N[1] + 520], 30, 260, { s: 0.7 });
  put("desert:rock_cluster", [N[0] - 500, N[1] + 560], 0, 200, { s: 0.7 });
  put("desert:signpost", [S[0] + 150, S[1] + 420], 0, 80);
  put("desert:boulder_big", [S[0] - 100, S[1] - 600], 60, 260, { s: 0.7 });
  put("desert:rock_cluster", [S[0] + 450, S[1] - 520], 20, 200, { s: 0.6 });
  // (v0.4) the way west to the windmill fields
  put("desert:signpost", [W_WAY[0] + 420, W_WAY[1] - 150], -90, 80);
  put("desert:boulder_flat", [W_WAY[0] - 520, W_WAY[1] - 300], 40, 200, { s: 0.6 });

  // ---- the waystation by the track, its yard, carts and camp ----
  put("desert:waystation", [1250, -1300], -90, 520);
  put("trunrada:cart", [1650, -650], 70, 160);
  put("bahamas:camel_trough", [700, -700], 90, 140);
  put("trunrada:campfire", [600, -1300], 0, 170);
  put("bahamas:caravan_tent", [400, -2150], -60, 330);
  put("bahamas:pottery_set", [1900, -1050], 0, 90);
  put("common:crate", [1820, -1250], 20, 60);
  put("common:crate", [1880, -1330], 50, 60);
  put("desert:signpost", [1950, -150], 200, 80);
  tree("desert:acacia", [-100, -1500], 40, 1.1);

  // ---- the waterhole: reeds round the water, a drinking acacia, the bones of an old kill ----
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rnd() * 0.2, k = 1.02 + rnd() * 0.12;
    if (Math.abs(a - (3 * Math.PI) / 2) < 0.4) continue; // the shore where the trail comes down
    f.put("desert:reeds", [2600 + Math.cos(a) * 650 * k, 2650 + Math.sin(a) * 480 * k], rnd() * 360, { s: 0.8 + rnd() * 0.4 });
  }
  tree("desert:acacia", [3550, 3150], 120, 1.15);
  tree("desert:dead_tree", [1650, 2950], 30, 1);
  put("desert:bones", [3500, 2150], 50, 200);
  put("desert:boulder_flat", [1800, 2300], 10, 230, { s: 0.8 });
  put("desert:dry_bush", [2100, 3350], 0, 90);

  // ---- plateau A: the giant baobab, a knoll of boulders, the lookout over the track ----
  tree("desert:baobab", [3150, -3450], 30, 1, 225);
  taken.push([3150, -3450, 450]);
  put("desert:rock_cluster", [2300, -3900], 20, 230);
  put("desert:boulder_big", [3800, -4250], 40, 260, { s: 0.9 });
  put("desert:boulder_flat", [3650, -3950], 0, 230, { s: 0.6 });
  put("desert:rock_cluster", [4000, -4450], 70, 200, { s: 0.7 });
  put("desert:boulder_big", [4250, -3050], 80, 230, { s: 0.7 });
  put("desert:bones", [2650, -4300], 120, 200);
  put("trunrada:cairn", [2700, -2600], 0, 90);
  tree("desert:acacia", [1900, -4300], 200, 0.9);
  tree("desert:dead_tree", [3900, -2850], 60, 0.9);

  // ---- plateau B: the old shrine, four columns round an altar stone, a broken wall ----
  const SH: XY = [-2750, 3550];
  for (const [dx, dy, hh] of [[-380, -380, 1], [-380, 380, 0.75], [380, -380, 0.6], [380, 380, 1]] as [number, number, number][]) put("desert:ruin_column", [SH[0] + dx, SH[1] + dy], (dx + dy) % 90, 120, { s: hh });
  put("desert:ruin_wall", [SH[0] + 820, SH[1]], 0, 360, { s: 0.85, solid: WALL_SOLID });
  put("desert:column_fallen", [SH[0] - 600, SH[1] + 900], 70, 330, { s: 0.85 });
  put("trunrada:standing_stone", [SH[0], SH[1]], 90, 90);
  put("desert:bones", [-1700, 3500], -20, 180);
  put("desert:boulder_big", [-3700, 4200], 10, 260, { s: 0.8 });
  tree("desert:acacia", [-1700, 4200], 70, 1);
  tree("desert:acacia", [-3700, 3000], 160, 0.8);

  // ---- along the track: the wreck of a cart, lone acacias, a few dead trees, rocks ----
  put("desert:cart_wreck", [-500, -1250], 25, 330);
  put("trunrada:cart", [-3200, 1700], 140, 160);
  for (const [x, y, h, s] of [[4100, -1100, 20, 1.1], [3300, 2100, 200, 0.9], [-900, 1800, 80, 1.2], [-3000, -1000, 150, 1], [500, 1500, 300, 1.05], [-4200, 2600, 40, 0.9], [4700, 2500, 110, 1], [-1800, -3600, 250, 1.15], [2000, -5000, 10, 0.9], [-4600, -2400, 90, 1]] as [number, number, number, number][])
    if (open(x, y, 200) && free(x, y, 200)) tree("desert:acacia", [x, y], h, s);
  scatter(["desert:acacia"], 12, IN, 260, { s: [0.75, 1.15], tree: 42, keep: (x, y) => !nearExit(x, y) && rnd() > greenness(x, y) });
  scatter(["desert:dead_tree"], 6, IN, 200, { s: [0.8, 1.1], tree: 26 });
  scatter(["desert:dry_bush"], 30, IN, 110, { s: [0.7, 1.2] });
  scatter(["desert:rock_cluster", "desert:boulder_flat", "desert:boulder_big"], 12, IN, 250, { s: [0.5, 0.9], keep: (x, y) => !nearExit(x, y) });
  scatter(["desert:stump", "desert:fallen_log"], 6, IN, 170, { s: [0.8, 1.1] });

  // the green towards Eden: round trees and bushes like those outside its walls
  scatter(["flora:RoundTree", "flora:SmallTree", "flora:RoundTree", "flora:BigOak"], 9, { ...IN, x0: 3200 }, 240, { s: [0.7, 1], tree: 40, keep: (x, y) => !nearExit(x, y) && rnd() < greenness(x, y) * 1.4 });
  scatter(["flora:Bush"], 14, { ...IN, x0: 3200 }, 110, { s: [0.8, 1.2], keep: (x, y) => rnd() < greenness(x, y) * 1.5 });

  // ---- grass: tall golden patches over the open savanna, tufts between; green tall grass in the
  // north, thickening towards Eden as the golden thins ----
  const grassOk = (x: number, y: number) => !open(x, y, 120) || !free(x, y, 60);
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["grass_patch"], (x, y) => grassOk(x, y) || rnd() < greenness(x, y) * 1.2, { count: 560, tries: 9000, spacing: 330, kit: "desert" });
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["grass_tuft", "grass_tuft", "dry_bush"], (x, y) => grassOk(x, y) || rnd() < greenness(x, y) * 1.2, { count: 240, tries: 5000, spacing: 260, kit: "desert" });
  f.woods({ x0: 2800, x1: R, y0: -R, y1: R }, ["tall_grass"], (x, y) => grassOk(x, y) || rnd() > greenness(x, y) * 1.3, { count: 150, tries: 4000, spacing: 300, kit: "plains" });

  // ---- the shore: rocks at the cliffs' feet and in the surf, driftwood on the sand ----
  for (let i = 1; i < SHORE.length - 1; i += 2) {
    const [x, y] = SHORE[i];
    if (Math.abs(x) > R + 1500 || rnd() < (x > 1100 && x < 4900 ? 0.15 : 0.7)) continue;
    const a = SHORE[i - 1], b = SHORE[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, o = -40 + rnd() * 200;
    f.put(rnd() < 0.5 ? "desert:boulder_flat" : "desert:rock_cluster", [x - ((b[1] - a[1]) / L) * o, y + ((b[0] - a[0]) / L) * o], rnd() * 360, { s: 0.45 + rnd() * 0.4, solid: "none" });
  }
  for (const [x, h] of [[-600, 20], [-2600, 140], [5200, 70], [-4200, 100]] as XY[]) put("desert:fallen_log", [x, shoreY(x) + 200], h, 200, { s: 0.8 });

  // ---- the land beyond the edge: acacias and golden grass on rolling ground, the mesa; green
  // grass and round trees on towards Eden in the north ----
  const rim = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) !== 0 || onBeach(x, y);
  const savanna = (x: number, y: number) => rim(x, y) || x > greenLine(y) + 300;
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["acacia", "acacia", "acacia", "dead_tree", "baobab"], savanna, { count: 75, tries: 4000, spacing: 950, kit: "desert" });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["grass_patch", "grass_patch", "grass_patch", "dry_bush", "boulder_flat", "rock_cluster"], savanna, { count: 430, tries: 7000, spacing: 320, kit: "desert" });
  const northRim = (x: number, y: number) => rim(x, y) || x < greenLine(y) + 300;
  f.woods({ x0: R, x1: A, y0: -A, y1: A }, ["RoundTree", "SmallTree", "RoundTree", "BigOak", "Bush"], northRim, { count: 60, tries: 3000, spacing: 650 });
  f.woods({ x0: R - 500, x1: A, y0: -A, y1: A }, ["tall_grass"], northRim, { count: 120, tries: 3000, spacing: 380, kit: "plains" });

  // ---- where the monsters live: the open grass and the plateau tops ----
  f.monsterSpots(ground, { x0: -R + 400, x1: R - 400, y0: -R + 400, y1: R - 400 }, { step: 1050 });

  const npcs: NpcSpec[] = [
    {
      id: "south_savanna_keeper", x: 1350, y: -760, face: 90, name: "ลุงฮาซัน", title: "ผู้ดูแลศาลาพัก", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ศาลานี้ให้กองคาราวานพักเติมน้ำก่อนลงใต้ไปบาฮามัส เติมกระติกให้เต็มก่อนออกเดินทางนะ",
        "ทางเหนือกลับอีเดน ทางใต้หญ้าจะบางลงจนเหลือแต่ทรายกับหิน ระวังพวกที่ซุ่มอยู่ในหญ้าสูงด้วย",
        "ต้นเบาบับบนผาตะวันออกอายุหลายร้อยปีแล้ว คาราวานใช้มันดูทางกันมาแต่ไหนแต่ไร",
      ],
    },
    {
      id: "south_savanna_ranger", x: 3150, y: 1850, face: 125, name: "นาเดีย", title: "พรานทุ่งหญ้า", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "amber", eyes: "teal", top: "top_adventurer_ochre", bottom: "bottom_adventurer_sand" },
      lines: [
        "แอ่งน้ำนี้เป็นที่เดียวในทุ่งที่มีน้ำทั้งปี ตกเย็นสัตว์ทุกตัวจะลงมากินน้ำที่นี่",
        "ศาลเก่าบนผาตะวันตกเป็นของคนโบราณรุ่นเดียวกับซากเมืองใต้ทะเลทรายใหญ่ ไม่มีใครรู้ว่าพวกเขาหายไปไหน",
        "ถ้าจะลงใต้ไปขอบทะเลทราย แดดที่นั่นแรงกว่านี้มาก พกน้ำไปเยอะ ๆ",
      ],
    },
  ];
  const labels: MapLabel[] = [
    { x: 1250, y: -650, text: "ศาลาพักกองคาราวาน" },
    { x: 3150, y: -2950, text: "ต้นเบาบับยักษ์" },
    { x: 2600, y: 1900, text: "แอ่งน้ำสัตว์ป่า" },
    { x: -2600, y: 3000, text: "ศาลเก่าบนผา" },
    { x: 3800, y: -4300, text: "เนินหินกลางผา", kind: "small" },
    { x: -500, y: -900, text: "ซากเกวียน", kind: "small" },
    { x: -1000, y: -5000, text: "ทะเลใน" },
    { x: N[0], y: N[1], text: "ทางไปอีเดน", kind: "gate" },
    { x: S[0], y: S[1], text: "ทางไปขอบทะเลทราย", kind: "gate" },
    { x: W_WAY[0], y: W_WAY[1], text: "ทางไปทุ่งกังหันลม", kind: "gate" },
  ];

  return f.finishField({
    ground, scenery, sky: "#cdb77c",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4300, y: yAt(MAIN, 4300) },
    npcs, labels,
  });
}

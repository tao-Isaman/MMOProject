// ทุ่งสะวันนาใต้ (the southern savanna), monsters Lv 12-20: the open country south of Eden's south
// gate, where the caravan track runs down towards the desert and Bahamas. Tall golden grass, lone
// flat-topped acacias, a waystation on the track, a waterhole where the herds drink; on the east
// a rocky plateau crowned by a giant baobab (with a knoll of boulders on it), on the west a mesa
// with the ruins of an old shrine of the people whose city lies under the great desert. A mesa
// wall closes the east, rolling ground and woods of acacias the rest.
//
// Laid out at full size in centimetres (north +X, east -Y) and scaled by TOWN_SCALE in finish.
// Ways out: north to Eden's south gate, south to the desert's edge.

import { FieldBuilder } from "./field";
import type { SolidSpec } from "../world";
import type { Poly } from "./paved";
import { useKits } from "./town";
import type { Town } from "./town";
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
const ellipse = (cx: number, cy: number, rx: number, ry: number, n = 20, wob = 0.06): Poly =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, k = 1 + wob * Math.sin(a * 3 + 1) + wob * 0.6 * Math.sin(a * 5);
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k] as XY;
  });

// a ruined wall's masonry (not the sand drifted against it)
const WALL_SOLID: SolidSpec[] = [{ kind: "wall", x: 0, y: 0, w: 220, d: 600, rot: 0 }];

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
      { x: -600, y: -2800, r: 1700, h: 190 }, { x: -3600, y: -3400, r: 2000, h: 240 }, { x: 4300, y: 4200, r: 1250, h: 160 },
      { x: 300, y: 4000, r: 1400, h: 130 }, { x: 2000, y: 4700, r: 900, h: 110 }, { x: -3600, y: -1700, r: 900, h: -90 },
      { x: 400, y: -4700, r: 1000, h: 140 }, { x: -4800, y: 1900, r: 900, h: 120 },
      // the rolling land beyond
      { x: 7000, y: 4000, r: 2500, h: 350 }, { x: 7600, y: -2700, r: 2200, h: 300 }, { x: -7300, y: 3200, r: 2400, h: 380 },
      { x: -7000, y: -4200, r: 2500, h: 300 }, { x: 0, y: 7700, r: 2600, h: 320 }, { x: 4500, y: 7300, r: 2000, h: 260 },
    ],
    plateaus: [
      { poly: dense(PLAT_A), h: 350, ramps: [RAMP_A] },
      { poly: dense(KNOLL), h: 620 },
      { poly: dense(PLAT_B), h: 420, ramps: [RAMP_B] },
      // a mesa wall closing the east, a lower one in the south-west
      { poly: dense([[-6800, -6300], [-3000, -6650], [500, -6250], [3500, -6750], [6800, -6350], [8700, -8700], [-8700, -8700]]), h: 650 },
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
  const POND = ellipse(2600, 2650, 650, 480, 22);
  const ground = f.ground({
    area: { x0: -A, x1: A, y0: -A, y1: A },
    roads: [band(MAIN, 500), band(SPUR_A, 420), band(SPUR_B, 420), band(SPUR_W, 380), YARD],
    plazas: [],
    water: [POND],
    base: "steppe",
  });
  const scenery = [f.waterSheet({ x0: 1700, x1: 3500, y0: 1950, y1: 3350 }, -14, "Desert_Water")];
  for (const [x, r] of [[-300, 440], [0, 480], [300, 440]] as XY[]) f.blockDisc([2600 + x, 2650], r);

  // ---- the ways out: north to Eden, south to the desert's edge ----
  const N: XY = [5150, yAt(MAIN, 5150)], S: XY = [-5150, yAt(MAIN, -5150)];
  f.exit("eden", N, [4450, yAt(MAIN, 4450)]);
  f.exit("desert_edge", S, [-4450, yAt(MAIN, -4450)]);

  // what stands where, so nothing is put in anything else
  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number) => taken.every(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) > tr + r);
  const open = (x: number, y: number, r: number) =>
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) && f.level(x, y, Math.max(60, r * 0.7));
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
  scatter(["desert:acacia"], 12, IN, 260, { s: [0.75, 1.15], tree: 42, keep: (x, y) => !nearExit(x, y) });
  scatter(["desert:dead_tree"], 6, IN, 200, { s: [0.8, 1.1], tree: 26 });
  scatter(["desert:dry_bush"], 30, IN, 110, { s: [0.7, 1.2] });
  scatter(["desert:rock_cluster", "desert:boulder_flat", "desert:boulder_big"], 12, IN, 250, { s: [0.5, 0.9], keep: (x, y) => !nearExit(x, y) });
  scatter(["desert:stump", "desert:fallen_log"], 6, IN, 170, { s: [0.8, 1.1] });

  // ---- grass: tall golden patches over all the open ground, tufts between ----
  const grassOk = (x: number, y: number) => !open(x, y, 120) || !free(x, y, 60);
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["grass_patch"], grassOk, { count: 620, tries: 9000, spacing: 330, kit: "desert" });
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["grass_tuft", "grass_tuft", "dry_bush"], grassOk, { count: 260, tries: 5000, spacing: 260, kit: "desert" });

  // ---- the land beyond the edge: acacias and grass on rolling ground, the mesas ----
  const rim = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) !== 0;
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["acacia", "acacia", "acacia", "dead_tree", "baobab"], rim, { count: 85, tries: 4000, spacing: 950, kit: "desert" });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["grass_patch", "grass_patch", "grass_patch", "dry_bush", "boulder_flat", "rock_cluster"], rim, { count: 480, tries: 7000, spacing: 320, kit: "desert" });

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
    { x: N[0], y: N[1], text: "ทางไปอีเดน", kind: "gate" },
    { x: S[0], y: S[1], text: "ทางไปขอบทะเลทราย", kind: "gate" },
  ];

  return f.finishField({
    ground, scenery, sky: "#cdb77c",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4300, y: yAt(MAIN, 4300) },
    npcs, labels,
  });
}

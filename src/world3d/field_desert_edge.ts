// ขอบทะเลทราย (the desert's edge), monsters Lv 20-30: where the savanna's last grass gives out to
// sand and red rock on the caravan track down to Bahamas. The track winds between two mesas and
// passes under a great natural arch the wind has cut through the rock; cacti, hoodoos and
// boulders stand about the sand. The west mesa climbs in two steps to a summit where the bones of
// a giant beast lie (a smaller arch, a "window in the rock", on its lower step); bandits camp on
// the east mesa above the track; Bahamas keeps a checkpoint by the south way out. Taller mesas
// wall the east and west, dunes roll away to the south.
//
// Laid out at full size in centimetres (north +X, east -Y) and scaled by TOWN_SCALE in finish.
// Ways out: north to the southern savanna, south to Bahamas' north gate.

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

// the great arch's feet (its own frame: the passage runs along X between them)
const ARCH_SOLID: SolidSpec[] = [
  { kind: "rock", x: -10, y: -560, w: 420, d: 440, rot: 0 },
  { kind: "rock", x: 10, y: 560, w: 420, d: 440, rot: 0 },
  { kind: "rock", x: -260, y: -470, r: 110 },
  { kind: "rock", x: 240, y: 470, r: 115 },
  { kind: "rock", x: 230, y: -520, r: 80 },
  { kind: "rock", x: -250, y: 520, r: 65 },
];

// a dune crest (its own frame), so nobody wades through the sand
const DUNE_SOLID: SolidSpec[] = [{ kind: "dune", x: 20, y: 0, r: 230 }, { kind: "dune", x: 90, y: -270, r: 190 }, { kind: "dune", x: 90, y: 270, r: 190 }];

export function build(_quality: { flowers: number }): Town {
  const R = 5500, A = 9000;

  // ---- the ground: two mesas (the west one with a summit step), a rock tower, dunes ----
  const M1: Poly = [[3600, 1300], [2400, 1800], [1200, 1500], [200, 2000], [-600, 3000], [-200, 4400], [1400, 4900], [3300, 4600], [4400, 3500], [4500, 2100]];
  const M1B: Poly = [[1600, 3000], [2600, 2700], [3300, 3300], [2900, 4100], [1800, 4200], [1300, 3600]];
  const M2: Poly = [[-800, -1900], [-2000, -1500], [-3400, -1700], [-4300, -2800], [-3800, -4500], [-2000, -4900], [-500, -4200], [0, -2900]];
  const TOWER: Poly = [[-2700, 3350], [-2050, 3150], [-1700, 3750], [-2150, 4300], [-2850, 4050]];
  const RAMP_M1 = { top: [1800, 1650] as XY, bottom: [2190, 98] as XY, width: 480 };
  const RAMP_M1B = { top: [2100, 2850] as XY, bottom: [1842, 1988] as XY, width: 440 };
  const RAMP_M2 = { top: [-1400, -1700] as XY, bottom: [-1005, -514] as XY, width: 480 };
  const f = new FieldBuilder(113, {
    hills: [
      { x: 3500, y: -3300, r: 1600, h: 230 }, { x: 4600, y: -1700, r: 700, h: 90 }, { x: -3300, y: 2300, r: 900, h: 170 },
      { x: -4400, y: 4000, r: 1000, h: 170 }, { x: 1300, y: -3300, r: 1100, h: 160 },
      { x: -2700, y: 1100, r: 600, h: -80 }, { x: 4600, y: 1300, r: 600, h: 80 },
      // dunes and rolling sand beyond
      { x: -7400, y: 0, r: 2600, h: 450 }, { x: -7200, y: -4300, r: 2400, h: 380 }, { x: -7000, y: 4600, r: 2300, h: 400 },
      { x: 7300, y: 3000, r: 2200, h: 260 }, { x: 7400, y: -3500, r: 2300, h: 280 }, { x: 7700, y: 300, r: 1500, h: 150 },
    ],
    plateaus: [
      { poly: dense(M1), h: 520, ramps: [RAMP_M1] },
      { poly: dense(M1B), h: 800, ramps: [RAMP_M1B] },
      { poly: dense(M2), h: 400, ramps: [RAMP_M2] },
      { poly: dense(TOWER), h: 680 },
      // mesa walls east and west
      { poly: dense([[6000, -6200], [3000, -6650], [0, -6250], [-3500, -6700], [-6500, -6250], [-8700, -8700], [8700, -8700]]), h: 850 },
      { poly: dense([[-6000, 6450], [-2000, 6750], [1500, 6300], [5200, 6700], [8700, 8700], [-8700, 8700]]), h: 760 },
    ],
    rock: "CliffRed",
  });

  // ---- the tracks: the caravan road (under the great arch), up the west mesa to the summit,
  // up the east mesa to the bandits' camp; a yard at the checkpoint ----
  const MAIN = smooth([[5900, -350], [5150, -300], [4300, -150], [3300, -450], [2300, -800], [1600, -650], [600, -600], [-300, -200], [-1200, 150], [-2200, -100], [-3200, -300], [-4200, 50], [-5150, 300], [-5900, 300]]);
  const SPUR_M1 = smooth([[2420, -760], [2300, -320], [2190, 100], [1995, 880], [1800, 1650], [1840, 1990], [1970, 2420], [2100, 2850], [2350, 3350]]);
  const SPUR_M2 = smooth([[-1100, 130], [-1040, -230], [-1005, -514], [-1203, -1110], [-1400, -1700], [-1700, -2200], [-2000, -2650]]);
  const YARD: Poly = [[-3700, 250], [-3700, 1250], [-4700, 1250], [-4800, 450]];
  const ground = f.ground({
    area: { x0: -A, x1: A, y0: -A, y1: A },
    roads: [band(MAIN, 500), band(SPUR_M1, 420), band(SPUR_M2, 420), YARD],
    plazas: [],
    base: "sand",
  });

  // ---- the ways out: north to the savanna, south to Bahamas ----
  const N: XY = [5150, yAt(MAIN, 5150)], S: XY = [-5150, yAt(MAIN, -5150)];
  f.exit("south_savanna", N, [4450, yAt(MAIN, 4450)]);
  f.exit("bahamas", S, [-4450, yAt(MAIN, -4450)]);

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
    taken.push([at[0], at[1], 130 * s]);
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
  const nearExit = (x: number, y: number) => Math.hypot(x - N[0], y - N[1]) < 900 || Math.hypot(x - S[0], y - S[1]) < 900;
  const IN = { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 };

  // ---- the ways out: a signpost and rocks at the north, Bahamas' checkpoint at the south ----
  put("desert:signpost", [N[0] - 200, N[1] - 420], 180, 80);
  put("desert:boulder_big", [N[0] + 100, N[1] + 560], 20, 260, { s: 0.7 });
  put("desert:rock_cluster", [N[0] - 450, N[1] - 900], 50, 200, { s: 0.7 });
  put("bahamas:watchtower", [-4150, 1700], -90, 300);
  put("bahamas:shade_sail", [-4250, 900], -90, 260);
  put("bahamas:brazier", [-4900, 600], 0, 60);
  put("bahamas:brazier", [-4900, -650], 0, 60);
  put("bahamas:camel_trough", [-3850, 1050], 0, 140);
  put("bahamas:pottery_set", [-4600, 1350], 20, 90);
  put("common:crate", [-3800, 1400], 10, 60);
  put("common:crate", [-3720, 1460], 40, 60);
  put("desert:signpost", [S[0] + 250, S[1] - 450], 0, 80);
  put("desert:boulder_flat", [S[0] + 300, S[1] - 1100], 40, 250, { s: 0.7 });

  // ---- the great arch over the track, a painter's easel of rocks beside it ----
  const ARCH: XY = [1100, yAt(MAIN, 1100)];
  put("desert:rock_arch_big", ARCH, 0, 0, { solid: ARCH_SOLID });
  taken.push([ARCH[0], ARCH[1] - 560, 330], [ARCH[0], ARCH[1] + 560, 330]);
  put("desert:boulder_flat", [ARCH[0] + 200, ARCH[1] + 1250], 70, 240, { s: 0.6 });
  put("desert:hoodoo", [ARCH[0] - 900, ARCH[1] - 1300], 30, 180);
  put("desert:hoodoo", [ARCH[0] - 500, ARCH[1] - 1750], 80, 150, { s: 0.7 });
  put("desert:bones", [ARCH[0] - 1200, ARCH[1] + 1100], 40, 200);

  // ---- the west mesa: the window in the rock, hoodoos; the summit: the bones of a giant beast ----
  put("desert:rock_arch_big", [3250, 2350], 70, 0, { s: 0.55, solid: ARCH_SOLID });
  taken.push([3250, 2350, 480]);
  put("desert:hoodoo", [800, 2600], 10, 180);
  put("desert:hoodoo", [500, 3500], 50, 150, { s: 0.8 });
  put("desert:hoodoo", [3800, 3500], 120, 180, { s: 1.1 });
  put("desert:rock_cluster", [100, 4000], 0, 230);
  put("desert:boulder_big", [3300, 1800], 50, 250, { s: 0.7 });
  put("desert:bones", [2350, 3550], 30, 430, { s: 1.9 });
  put("trunrada:cairn", [2950, 3500], 0, 90);
  put("desert:boulder_flat", [1750, 3850], 20, 220, { s: 0.7 });
  put("desert:dead_tree", [2700, 3950], 70, 130, { s: 1.1, solid: [{ kind: "tree", x: 0, y: 0, r: 26 }] });

  // ---- the east mesa: the bandits' camp, a butte behind it ----
  put("bahamas:caravan_tent", [-2350, -3050], 20, 330);
  put("trunrada:campfire", [-2200, -2400], 0, 170);
  put("desert:cart_wreck", [-1500, -3000], 100, 330);
  put("common:crate", [-2750, -2400], 30, 60);
  put("common:crate", [-2830, -2470], 60, 60);
  put("bahamas:rug_pile", [-2700, -2700], 80, 120);
  put("trunrada:banner_pole", [-1700, -2050], 0, 60);
  put("desert:butte", [-3050, -3900], 20, 560, { s: 0.75 });
  put("desert:hoodoo", [-800, -3600], 0, 180, { s: 0.9 });
  put("desert:boulder_big", [-3600, -2500], 70, 260, { s: 0.8 });

  // ---- the open sand: cacti, rocks, scrub, a few dead trees, dune crests; the last of the
  // grass along the north ----
  scatter(["flora:Cactus", "flora:Cactus", "flora:CactusRound"], 62, IN, 90, { s: [0.75, 1.2], keep: (x, y) => !nearExit(x, y) });
  scatter(["desert:rock_cluster", "desert:boulder_flat", "desert:boulder_big"], 30, IN, 250, { s: [0.5, 1], keep: (x, y) => !nearExit(x, y) });
  scatter(["desert:hoodoo"], 4, IN, 180, { s: [0.6, 1] });
  scatter(["desert:dead_tree"], 7, IN, 150, { s: [0.8, 1.1], tree: 26 });
  scatter(["desert:dry_bush"], 34, IN, 110, { s: [0.7, 1.1] });
  scatter(["desert:dune_ridge"], 7, { x0: -R + 600, x1: 1500, y0: -R + 600, y1: R - 600 }, 480, { s: [0.7, 1], solid: DUNE_SOLID });
  scatter(["desert:bones", "desert:fallen_log", "desert:stump"], 5, IN, 200);
  const grassOk = (x: number, y: number) => !open(x, y, 120) || !free(x, y, 60) || x < 1800 + rnd() * 1800;
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["grass_tuft", "grass_tuft", "grass_patch"], grassOk, { count: 150, tries: 4000, spacing: 380, kit: "desert" });
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["grass_tuft"], (x, y) => !open(x, y, 100) || !free(x, y, 50), { count: 60, tries: 2000, spacing: 600, kit: "desert" });

  // ---- the land beyond: rocks, cacti, buttes on the dunes; the savanna's grass to the north ----
  const rim = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) !== 0;
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["Cactus", "Cactus", "CactusRound", "PalmBent"], rim, { count: 110, tries: 3000, spacing: 600 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["boulder_big", "rock_cluster", "boulder_flat", "hoodoo", "dune_ridge", "dry_bush", "butte"], rim, { count: 120, tries: 3000, spacing: 700, kit: "desert" });
  f.woods({ x0: R, x1: A, y0: -A, y1: A }, ["grass_patch", "grass_tuft", "acacia"], (x, y) => rim(x, y) || (x < R + 1200 && rnd() < 0.5), { count: 160, tries: 3000, spacing: 380, kit: "desert" });

  // ---- where the monsters live ----
  f.monsterSpots(ground, { x0: -R + 400, x1: R - 400, y0: -R + 400, y1: R - 400 }, { step: 760 });

  const npcs: NpcSpec[] = [
    {
      id: "desert_edge_guard", x: -4250, y: 650, face: 0, name: "ราชิด", title: "ทหารด่านบาฮามัส", role: "talk",
      look: { gender: "male", hair: "", hairColor: "ink", eyes: "amber", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "ด่านนี้เฝ้าทางเข้าบาฮามัสจากทางเหนือ เดินต่อไปอีกนิดก็ถึงประตูเมืองแล้ว",
        "ระวังค่ายโจรบนผาตะวันออก พวกมันชอบดักปล้นกองคาราวานตรงซุ้มหินโค้ง",
        "ถ้าเจอพายุทราย ให้หลบหลังหินก้อนใหญ่ แล้วรอจนลมสงบค่อยเดินต่อ",
      ],
    },
    {
      id: "desert_edge_painter", x: 1350, y: 650, face: -100, name: "ลีน่า", title: "จิตรกรพเนจร", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "rose", eyes: "violet", top: "top_lilac", bottom: "bottom_cocoa" },
      lines: [
        "ซุ้มหินโค้งนี้ลมทรายกัดเซาะมาเป็นหมื่นปีกว่าจะทะลุอย่างนี้ ฉันวาดมันมาสามฤดูแล้วยังไม่เบื่อเลย",
        "บนยอดผาตะวันตกมีโครงกระดูกอสูรยักษ์นอนอยู่ ขึ้นไปดูวิวตอนเย็นสวยที่สุด",
        "ทางใต้คือบาฮามัส เมืองโดมสีฟ้าคราม ไปถึงแล้วอย่าลืมชิมอินทผลัมที่ตลาดนะ",
      ],
    },
  ];
  const labels: MapLabel[] = [
    { x: ARCH[0], y: ARCH[1], text: "ซุ้มหินโค้งใหญ่" },
    { x: 2300, y: 3100, text: "ซากอสูรยักษ์" },
    { x: 1200, y: 2500, text: "ผาลมหวน" },
    { x: 3250, y: 2000, text: "หน้าต่างหิน", kind: "small" },
    { x: -2200, y: -2600, text: "ค่ายโจรทะเลทราย" },
    { x: -4250, y: 1000, text: "ด่านบาฮามัส", kind: "small" },
    { x: -2300, y: 2850, text: "หอหินแดง", kind: "small" },
    { x: N[0], y: N[1], text: "ทางไปทุ่งสะวันนาใต้", kind: "gate" },
    { x: S[0], y: S[1], text: "ทางไปบาฮามัส", kind: "gate" },
  ];

  return f.finishField({
    ground, sky: "#dcc08c",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4300, y: yAt(MAIN, 4300) },
    npcs, labels,
  });
}

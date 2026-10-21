// ยอดภูเขาไฟ (volcano): the volcano at the heart of Osaki's island. The track comes up from the
// sakura hills on the south, over black lava ground: hot springs steaming in a basin of white
// sinter on the west (the survey party from Osaki camps by them), a lake of lava fed by a
// glowing river on the east. Then the mountain climbs in three steps of basalt cliff, a ramp up
// each: the lower flank (sulphur vents on the west, a field of basalt columns on the east), the
// upper flank (a dead forest, obsidian, lava seeping from cracks) and the summit, where the
// crater glows round its lake of lava.
//
// Laid out at full size in centimetres around the origin (north +X, west +Y); finishField
// scales it by TOWN_SCALE.

import { FieldBuilder } from "./field";
import { useKits } from "./town";
import type { Town } from "./town";
import type { Poly } from "./paved";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import { defineMaterial } from "./textures";
import { KIT as VOLCANIC } from "./kits/volcanic";

useKits(VOLCANIC);
// the lava under the river and the lake (a sheet below the ground, glowing through its holes)
defineMaterial("VolcanoField_Lava", { map: "crag", tint: "#e0561c", rough: 0.6, bump: 2, glow: "#ff3a00", glowI: 0.95 });

type XY = [number, number];

const R = 5500; // the walkable bounds, +-R
const A = 9000; // the ground's area, +-A
// the three steps of the mountain, each inside the one below; the summit holds the crater
const V1: Poly = [[-1300, 9500], [-1300, 5000], [-700, 3600], [-1200, 2200], [-600, 900], [-900, -600], [-400, -2000], [-1100, -3400], [-700, -5000], [-900, -9500], [9500, -9500], [9500, 9500]];
const V2: Poly = [[1300, 9500], [1000, 4600], [1600, 3200], [1100, 1800], [1500, 300], [1000, -1200], [1600, -2600], [1200, -4200], [1500, -9500], [9500, -9500], [9500, 9500]];
const V3: Poly = [[2500, -2000], [2300, -300], [2500, 1600], [3500, 2500], [4900, 2200], [5300, 600], [5200, -1500], [4100, -2500]];
// the volcano's shoulders past the west and east edges of the low ground (scenery)
const W1: Poly = [[-9500, 6000], [-5000, 5900], [-3000, 6300], [-1300, 6000], [-1300, 9500], [-9500, 9500]];
const E1: Poly = [[-9500, -6000], [-4500, -5900], [-2500, -6300], [-900, -6000], [-900, -9500], [-9500, -9500]];
// and a higher crest above the upper flank beyond the north edge
const N1: Poly = [[6200, -9500], [6000, -3500], [6400, 0], [6000, 3800], [6300, 9500], [9500, 9500], [9500, -9500]];

const RAMP1 = { top: [-750, 150] as XY, bottom: [-1829, 366] as XY, width: 460 };
const RAMP2 = { top: [1300, -1900] as XY, bottom: [289, -2333] as XY, width: 440 };
const RAMP3 = { top: [3000, 2050] as XY, bottom: [2264, 2868] as XY, width: 440 };

const CRATER: XY = [3800, 0];
const LAKE: XY = [-3600, -3900];

function smooth(pts: XY[], n = 5): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function band(pts: XY[], w: number): Poly {
  const L: XY[] = [], Rr: XY[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    L.push([pts[i][0] + (nx * w) / 2, pts[i][1] + (ny * w) / 2]);
    Rr.push([pts[i][0] - (nx * w) / 2, pts[i][1] - (ny * w) / 2]);
  }
  return [...L, ...Rr.reverse()];
}
function inPoly(poly: Poly, x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const faceDir = (dx: number, dy: number) => (Math.atan2(-dy, -dx) * 180) / Math.PI;

// the track: up from the sakura hills, up each ramp in turn, to the crater
const MAIN = smooth([[-9000, 700], [-7000, 500], [-5900, 600], [-5150, 600], [-4300, 650], [-3500, 1100], [-2700, 900], [-2250, 480], [-1829, 366], [-750, 150], [-300, -400], [0, -1300], [150, -2050], [289, -2333], [1300, -1900], [1750, -1250], [1850, 0], [1950, 1300], [2130, 2450], [2264, 2868], [3000, 2050], [3150, 1500], [2900, 900]], 4);
const SPRINGS = smooth([[-3450, 1120], [-3200, 1700], [-3450, 2300], [-3250, 2800]]);
const LAKESIDE = smooth([[-2700, 900], [-2500, 0], [-3000, -900], [-2750, -1900], [-3050, -2800]]);
const BASALT = smooth([[0, -1300], [-150, -2200], [150, -3000], [-100, -3700], [400, -4400]]);
const VENTS = smooth([[-300, -400], [100, 600], [-200, 1600], [200, 2600], [0, 3500], [250, 4100]]);
const RIVER = smooth([[-2830, -6150], [-2900, -5600], [-3100, -5000], [-3350, -4500]]);

// the scattered pieces block only their heart (a trunk, a rock's bulk), not their whole box
const SOLIDS: Record<string, SolidSpec[]> = {
  "volcanic:dead_tree": [{ kind: "tree", x: 0, y: 0, r: 40 }],
  "volcanic:lava_boulder": [{ kind: "rock", x: 0, y: 0, r: 150 }],
  "volcanic:lava_rocks": [{ kind: "rock", x: 0, y: 0, r: 150 }],
  "volcanic:obsidian": [{ kind: "rock", x: 0, y: 0, r: 60 }],
  "volcanic:sulphur_vent": [{ kind: "vent", x: 0, y: 0, r: 130 }],
  "volcanic:basalt_columns": [{ kind: "rock", x: 0, y: 0, r: 190 }],
  "volcanic:boulder_moss": [{ kind: "rock", x: 0, y: 0, r: 120 }],
  "volcanic:stump": [{ kind: "tree", x: 0, y: 0, r: 50 }],
  "volcanic:lantern_toppled": [{ kind: "post", x: 80, y: 15, r: 55 }],
  "volcanic:waymarker": [{ kind: "post", x: 0, y: 0, r: 40 }],
};

// Plateau edges in short pieces near the walkable ground: each cliff edge becomes its own thin
// solid, and short ones leave the ground beside them free for monsters (FieldBuilder.monsterSpots
// keeps clear of a solid's whole length).
function fine(poly: Poly, step = 380): Poly {
  const out: Poly = [];
  const near = (p: XY) => Math.abs(p[0]) < R + 600 && Math.abs(p[1]) < R + 600;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], m: XY = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    out.push(a);
    if (!near(a) && !near(b) && !near(m)) continue;
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step);
    for (let k = 1; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(118, {
    hills: [
      { x: -4200, y: -1000, r: 1200, h: 120 },
      { x: -2000, y: 3300, r: 1000, h: 110 },
      { x: -4600, y: 3300, r: 900, h: -70 },
      { x: -7500, y: 2500, r: 2600, h: 260 },
      { x: -7600, y: -4000, r: 2400, h: 220 },
    ],
    plateaus: [
      { poly: fine(V1), h: 350, ramps: [RAMP1] },
      { poly: fine(V2), h: 700, ramps: [RAMP2] },
      { poly: fine(V3), h: 1050, ramps: [RAMP3] },
      { poly: W1, h: 850 },
      { poly: E1, h: 850 },
      { poly: N1, h: 1100 },
    ],
    rock: "CliffBasalt",
  });
  const { put, rnd } = f;

  // ---- the ground: ash tracks, the lava river and its lake (holes over glowing lava) ----
  const lakePoly: Poly = Array.from({ length: 26 }, (_, k): XY => {
    const a = (k / 26) * Math.PI * 2, r = 720 + Math.sin(k * 2.3) * 70 + Math.cos(k * 1.1) * 40;
    return [LAKE[0] + Math.cos(a) * r, LAKE[1] + Math.sin(a) * r * 1.2];
  });
  const ground = f.ground({
    area: { x0: -A, y0: -A, x1: A, y1: A },
    base: "rock",
    roads: [band(MAIN, 460), band(SPRINGS, 400), band(LAKESIDE, 380), band(BASALT, 380), band(VENTS, 380)],
    plazas: [],
    water: [lakePoly, band(RIVER, 380)],
    road: [0.48, 0.56, 0.78],
  });
  f.blockDisc(LAKE, 820, "lava");
  f.blockBand(RIVER, 440, { kind: "lava" });

  // ---- placing things clear of each other, the tracks and the cliffs ----
  const taken: [number, number, number][] = [];
  const onTrack = (x: number, y: number, m: number) => [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const free = (x: number, y: number, r: number) => !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r);
  const fits = (x: number, y: number, r: number, m = r) => f.level(x, y, r) && !onTrack(x, y, m) && free(x, y, r);
  const place = (ref: string, at: XY, h: number, r: number, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, SOLIDS[ref] && !o.solid ? { solid: SOLIDS[ref], ...o } : o);
    taken.push([at[0], at[1], r]);
  };
  const tryPlace = (ref: string, at: XY, h: number, r: number, o: Parameters<typeof put>[3] = {}) => {
    if (!fits(at[0], at[1], r)) return false;
    place(ref, at, h, r, o);
    return true;
  };
  const scatter = (box: { x0: number; x1: number; y0: number; y1: number }, n: number, refs: string[], r: number, where: (x: number, y: number) => boolean, o: { s?: [number, number]; solid?: "none"; tries?: number } = {}) => {
    let placed = 0;
    for (let t = 0; t < (o.tries ?? n * 30) && placed < n; t++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (!where(x, y) || !fits(x, y, r)) continue;
      const s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      place(refs[Math.floor(rnd() * refs.length)], [x, y], rnd() * 360, r, { s, ...(o.solid ? { solid: o.solid } : {}) });
      placed++;
    }
  };
  const inside = (x: number, y: number, m = 0) => Math.abs(x) < R - m && Math.abs(y) < R - m;
  const level = (x: number, y: number) => (inPoly(V3, x, y) ? 3 : inPoly(V2, x, y) ? 2 : inPoly(V1, x, y) ? 1 : 0);
  const nearLava = (x: number, y: number, m: number) => Math.hypot(x - LAKE[0], y - LAKE[1]) < 900 + m || (y < -4300 && Math.abs(x - -3000) < 300 + m);

  // ---- the way out, back down to the sakura hills ----
  const SOUTH: XY = [-5150, 600], SOUTH_BACK: XY = [-4420, 640];
  f.exit("sakura_hills", SOUTH, SOUTH_BACK);
  place("volcanic:waymarker", [-4750, 1000], faceDir(-0.2, -1), 70);
  place("volcanic:dead_tree", [-4900, 150], 40, 140);

  // ---- the hot springs on the west, the survey camp beside them ----
  const springs: XY[] = [[-3300, 3350], [-2500, 4300], [-4100, 4250], [-2350, 2700]];
  springs.forEach((p, i) => place("volcanic:hot_spring", p, [10, 120, 250, 60][i], 420));
  for (const [x, y, h] of [[-3900, 2550, 30], [-2950, 5000, 100], [-1900, 3900, 200]] as const) tryPlace("volcanic:sulphur_vent", [x, y], h, 200);
  const CAMP: XY = [-4350, 1950];
  place("volcanic:survey_camp", CAMP, faceDir(1, 0.1), 430);
  for (const [x, y] of [[-4300, 3000], [-2000, 5000], [-4700, 4700], [-1700, 2300]] as const) tryPlace("volcanic:dead_tree", [x, y], rnd() * 360, 150);

  // ---- the lava lake on the east, its river coming down from the shoulder ----
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2 + 0.15, r = 960 + rnd() * 140;
    const at: XY = [LAKE[0] + Math.cos(a) * r, LAKE[1] + Math.sin(a) * r * 1.2];
    if (!inside(at[0], at[1], 200)) continue;
    tryPlace(k % 3 ? "volcanic:lava_rocks" : "volcanic:obsidian", at, rnd() * 360, 120, { s: 0.6 + rnd() * 0.3 });
  }
  for (const [x, y, h] of [[-2500, -3600, 70], [-4600, -2700, 120], [-2300, -2100, 15], [-4300, -1500, 160]] as const) tryPlace("volcanic:lava_crack", [x, y], h, 300);
  // crust floating on the lake, ash crusted along its shore
  for (const [dx, dy, s] of [[-200, 150, 0.8], [250, -300, 0.7], [100, 450, 0.6], [-350, -350, 0.65], [380, 250, 0.55]] as const) put("volcanic:scree", [LAKE[0] + dx, LAKE[1] + dy], rnd() * 360, { z: -15, s });
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2, r = 730 + Math.sin(k * 2.3) * 50;
    put("volcanic:scree", [LAKE[0] + Math.cos(a) * r, LAKE[1] + Math.sin(a) * r * 1.2], rnd() * 360, { s: 0.8 });
  }

  // ---- the lower flank (V1): sulphur vents on the west, basalt columns on the east ----
  for (const [x, y, h] of [[650, 3100, 0], [-300, 4300, 80], [700, 4600, 150], [-550, 2300, 40], [600, 1300, 200], [-500, 5100, 300]] as const) tryPlace("volcanic:sulphur_vent", [x, y], h, 200);
  for (const [x, y, h] of [[700, -3900, 0], [-200, -4700, 60], [900, -4900, 200], [400, -5200, 120], [-560, -3550, 300], [900, -3000, 30]] as const) tryPlace("volcanic:basalt_columns", [x, y], h, 260);
  scatter({ x0: -1300, x1: 1600, y0: -R, y1: R }, 14, ["volcanic:lava_boulder", "volcanic:lava_rocks", "volcanic:dead_tree", "volcanic:obsidian"], 200, (x, y) => level(x, y) === 1 && inside(x, y, 250));
  scatter({ x0: -1300, x1: 1600, y0: -R, y1: R }, 16, ["volcanic:scree"], 230, (x, y) => level(x, y) === 1 && inside(x, y, 250), { solid: "none" });

  // ---- the upper flank (V2): a dead forest on the west, obsidian and lava cracks ----
  scatter({ x0: 1000, x1: R, y0: 2200, y1: R }, 26, ["volcanic:dead_tree"], 230, (x, y) => level(x, y) === 2 && inside(x, y, 250), { s: [0.85, 1.25] });
  scatter({ x0: 1000, x1: R, y0: -R, y1: -2000 }, 10, ["volcanic:obsidian", "volcanic:obsidian", "volcanic:lava_boulder"], 200, (x, y) => level(x, y) === 2 && inside(x, y, 250), { s: [0.8, 1.3] });
  scatter({ x0: 1000, x1: R, y0: -R, y1: R }, 10, ["volcanic:lava_crack"], 300, (x, y) => level(x, y) === 2 && inside(x, y, 300));
  scatter({ x0: 1000, x1: R, y0: -R, y1: R }, 14, ["volcanic:lava_rocks", "volcanic:dead_tree", "volcanic:basalt_columns"], 220, (x, y) => level(x, y) === 2 && inside(x, y, 250));
  scatter({ x0: 1000, x1: R, y0: -R, y1: R }, 18, ["volcanic:scree"], 230, (x, y) => level(x, y) === 2 && inside(x, y, 250), { solid: "none" });

  // ---- the summit (V3): the crater, its lava spilling out of the breach ----
  place("volcanic:crater", CRATER, 0, 900, { solid: [{ kind: "rock", x: 0, y: 0, r: 790 }] });
  const breach = (205 * Math.PI) / 180;
  place("volcanic:lava_crack", [CRATER[0] + Math.cos(breach) * 1150, CRATER[1] + Math.sin(breach) * 1150], 25, 200);
  scatter({ x0: 2300, x1: 5300, y0: -2500, y1: 2500 }, 10, ["volcanic:lava_rocks", "volcanic:obsidian", "volcanic:lava_boulder"], 160, (x, y) => level(x, y) === 3 && Math.hypot(x - CRATER[0], y - CRATER[1]) > 1050, { s: [0.6, 1] });
  scatter({ x0: 2300, x1: 5300, y0: -2500, y1: 2500 }, 8, ["volcanic:scree"], 230, (x, y) => level(x, y) === 3 && Math.hypot(x - CRATER[0], y - CRATER[1]) > 1000, { solid: "none" });

  // ---- the low ground: rocks, scree, dead trees ----
  scatter({ x0: -R, x1: -700, y0: -R, y1: R }, 22, ["volcanic:lava_boulder", "volcanic:lava_rocks", "volcanic:lava_rocks", "volcanic:dead_tree", "volcanic:obsidian"], 230, (x, y) => level(x, y) === 0 && inside(x, y, 250) && !nearLava(x, y, 200));
  scatter({ x0: -R, x1: -700, y0: -R, y1: R }, 26, ["volcanic:scree"], 230, (x, y) => level(x, y) === 0 && inside(x, y, 250) && !nearLava(x, y, 100), { solid: "none" });
  scatter({ x0: -R, x1: -700, y0: -R, y1: R }, 10, ["flora:PineSmall", "flora:Pine"], 260, (x, y) => level(x, y) === 0 && inside(x, y, 300) && !nearLava(x, y, 400) && y > -2000, { s: [0.7, 1] });

  // ---- the rim: rock, dead trees and a few pines on every side, nobody gets there ----
  const rimOut = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) !== 0 || Math.abs(x) > A - 200 || Math.abs(y) > A - 200;
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["dead_tree", "dead_tree", "lava_boulder", "lava_rocks", "basalt_columns", "dead_tree"], rimOut, { count: 300, spacing: 520, tries: 9000, kit: "volcanic" });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["Pine", "PineSmall", "Pine"], (x, y) => rimOut(x, y) || x > 2000, { count: 160, spacing: 480, tries: 6000 });

  // ---- monsters on every level ----
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 660, keepOut: (x, y) => nearLava(x, y, 150) || Math.hypot(x - CRATER[0], y - CRATER[1]) < 1000 });

  const npcs: NpcSpec[] = [
    {
      id: "volcano_scout", x: CAMP[0] + 520, y: CAMP[1] - 350, face: 0, name: "มิซึกิ", title: "หน่วยสำรวจโอซากิ", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "crimson", eyes: "amber", top: "top_adventurer_ochre", bottom: "bottom_adventurer_black" },
      lines: ["หน่วยสำรวจของเราตั้งค่ายที่บ่อน้ำร้อนนี้ คอยดูว่าภูเขาไฟจะปะทุอีกเมื่อไร", "ขึ้นไปทางลาดสามชั้นจะถึงปากปล่อง ลาวาในนั้นเดือดไม่หยุดเลย", "อย่าเดินใกล้ทะเลสาบลาวาทางตะวันออก ความร้อนแผดเผาจนหายใจไม่ออก"],
    },
    {
      id: "volcano_bathkeeper", x: -2830, y: 2950, face: 180, name: "ยายโอฮะรุ", title: "ผู้ดูแลบ่อน้ำร้อน", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "teal", top: "top_priestess_white", bottom: "bottom_priestess_wine" },
      lines: ["น้ำพุร้อนตรงนี้รักษาได้ทุกโรค ชาวโอซากิขึ้นมาแช่กันตั้งแต่สมัยปู่ย่า", "แต่ช่วงนี้ไอกำมะถันแรงขึ้นทุกวัน กลิ่นฉุนไปทั้งเนิน"],
    },
  ];

  return f.finishField({
    ground,
    scenery: [f.waterSheet({ x0: -A, x1: -1500, y0: -A, y1: -1800 }, -16, "VolcanoField_Lava")],
    sky: "#3b302d",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -4250, y: 640 },
    npcs,
    labels: [
      { x: SOUTH[0] + 250, y: SOUTH[1] - 450, text: "ทางไปเนินซากุระ", kind: "gate" },
      { x: CRATER[0] - 1100, y: CRATER[1] + 300, text: "ปากปล่องภูเขาไฟ" },
      { x: -3000, y: 3700, text: "บ่อน้ำพุร้อน" },
      { x: CAMP[0] - 300, y: CAMP[1] - 600, text: "ค่ายหน่วยสำรวจ", kind: "small" },
      { x: LAKE[0] + 1100, y: LAKE[1] + 200, text: "ทะเลสาบลาวา" },
      { x: 200, y: -4000, text: "ลานเสาหินบะซอลต์" },
      { x: 300, y: 3700, text: "ปล่องกำมะถัน" },
      { x: 3000, y: 3900, text: "ป่าไม้ตาย" },
      { x: 2200, y: -3600, text: "ไหล่เขาหินออบซิเดียน", kind: "small" },
      { x: RAMP3.bottom[0] - 200, y: RAMP3.bottom[1] + 350, text: "ทางขึ้นยอด", kind: "small" },
    ],
  });
}

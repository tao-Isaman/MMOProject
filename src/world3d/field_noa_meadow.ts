// ทุ่งหญ้าโนอา (the Noa downs), monsters Lv 30-40: wide windy grassland north-east of Noa, a dead
// end. The road up from Noa comes in at the south-west corner and climbs gently north-east over
// rolling pasture cut up by old dry-stone walls, past a lone oak on its hill, to the mouth of a
// valley between two raised downs. Off it a lane loops south through the sheep pastures: the
// shepherd's hut, two round sheepfolds, a dew pond. The north-west down carries the old stone
// windmill, its sails turning over the whole field; the far down in the east is the reward for the
// climb: a wide high pasture with its own walls and flocks, and on its higher step the ruined
// watchtower that once guarded Noa's border, old relics round its foot and the best view of the
// downs. Higher downs close the valley's end and the east; past the south and west the pasture
// runs on, walled and wooded.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   way out: south-west -> noa

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { KIT as WESTFARM, smooth, band, dense, blob, inPoly, toLine, towards, along, wallRun } from "./kits/westfarm";
import type { XY } from "./kits/westfarm";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as STEPPE } from "./kits/steppe";
import { KIT as FRONTIER } from "./kits/frontier";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(WESTFARM, PLAINS, TRUNRADA, STEPPE, FRONTIER);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the levels ----
// P1: the windmill down (280) in the north-west; P2: the far down (300) over the whole north-east,
// its higher step P3 (580) with the watchtower; past the edge, higher downs close the valley
// between them (MV) and the south-east (ME).
const P1: XY[] = [[1700, 2700], [2500, 1500], [3600, 1150], [5000, 1500], [6300, 1300], [A, 1600], [A, A], [3800, A], [3300, 6800], [2300, 5800], [1500, 4200]];
const P2: XY[] = [[700, -900], [1900, -900], [3500, -800], [5600, -1000], [A, -1300], [A, -A], [300, -A], [400, -5600], [700, -4000], [1000, -2400]];
const P3: XY[] = [[2400, -2400], [3900, -2000], [4800, -2900], [4600, -4400], [3300, -4700], [2300, -3700]];
const MV: XY[] = [[6100, -1700], [6500, 0], [6200, 1900], [A, 2100], [A, -1900]];
const ME: XY[] = [[-A, -6300], [-4500, -6100], [-1500, -6500], [200, -6200], [600, -A], [-A, -A]];
const R1 = { top: [2100, 2100] as XY, bottom: [1351, 1600] as XY, width: 460 };
const R2 = { top: [1300, -900] as XY, bottom: [1300, 0] as XY, width: 460 };
const R3 = { top: [2350, -3050] as XY, bottom: [1453, -2981] as XY, width: 440 };

// ---- the places ----
const WAY: XY = [-3700, 5150], ARRIVE: XY = [-3480, 4420];
const JUNCTION: XY = [900, 500];
const MILL: XY = [3300, 2950];
const TOWER: XY = [3700, -3300];
const HUT: XY = [-3100, -1700];
const FOLD_A: XY = [-3300, -2750], FOLD_B: XY = [-1700, -4700];
const POND_C: XY = [-3300, -450];
const POND = blob(POND_C, 430, 520, 3, 18, 0.08);

// ---- the tracks ----
const MAIN: XY[] = [
  ...smooth([[-3950, 7400], WAY, [-3400, 4300], [-2850, 3050], [-2250, 1950], [-1450, 1000], [-600, 620], [250, 420], JUNCTION, along(R2.bottom, R2.top, -450)]),
  R2.bottom, R2.top,
  ...smooth([along(R2.bottom, R2.top, 1350), [1500, -1700], [1480, -2400], along(R3.bottom, R3.top, -450)]),
  R3.bottom, R3.top,
  ...smooth([along(R3.bottom, R3.top, 1350), [3050, -3250], [3150, -3300]]),
];
const MILL_WAY: XY[] = [...smooth([JUNCTION, [1050, 1050], along(R1.bottom, R1.top, -450)]), R1.bottom, R1.top, ...smooth([along(R1.bottom, R1.top, 1350), [2650, 2500], [2850, 2650]])];
const PASTURE: XY[] = smooth([[-1450, 1000], [-2150, 150], [-2500, -800], [-2450, -1700], [-2150, -2550], [-1500, -3250], [-650, -3050], [-50, -1900], [200, -600], [250, 420]]);
const TRACKS = [MAIN, MILL_WAY, PASTURE];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(301, {
    hills: [
      { x: -1600, y: 3300, r: 1500, h: 150 }, { x: -4300, y: 2100, r: 1200, h: 110 }, { x: -200, y: -3600, r: 1400, h: 140 },
      { x: -4000, y: -3900, r: 1100, h: 110 }, { x: -900, y: 900, r: 900, h: -60 }, { x: 2700, y: 300, r: 800, h: 80 },
      { x: 4300, y: 0, r: 900, h: 110 }, { x: 300, y: 4400, r: 1200, h: 130 }, { x: -5000, y: 3600, r: 1000, h: 90 },
      { x: -1800, y: -1300, r: 700, h: 70 }, { x: -4800, y: 600, r: 900, h: 80 },
      // the downs rolling on past the edge
      { x: -7200, y: 0, r: 2500, h: 300 }, { x: -7000, y: 5000, r: 2000, h: 240 }, { x: -7000, y: -4300, r: 2200, h: 280 },
      { x: -2500, y: 7600, r: 2000, h: 250 }, { x: 600, y: 7400, r: 1600, h: 200 },
    ],
    plateaus: [
      { poly: dense(P1), h: 280, ramps: [R1] },
      { poly: dense(P2), h: 300, ramps: [R2] },
      { poly: dense(P3), h: 580, ramps: [R3] },
      { poly: dense(MV), h: 640 },
      { poly: dense(ME), h: 520 },
    ],
    rock: "CliffMoss",
  });
  const { put, rnd } = f;
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads: [band(MAIN, 460), band(MILL_WAY, 400), band(PASTURE, 380)], plazas: [], water: [POND], base: "grass", road: [0.94, 0.88, 0.8] });

  // ---- placing things: clear of the tracks, the water, the cliffs and each other ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine(x, y, t) < d);
  const wet = (x: number, y: number, d: number) => Math.hypot(x - POND_C[0], y - POND_C[1]) < 560 + d;
  const free = (x: number, y: number, r: number, gap = 0) =>
    !nearTrack(x, y, r + 230) && !wet(x, y, r) && f.level(x, y, Math.min(r, 220)) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    taken.push([at[0], at[1], r]);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });
  // a few of something within r of c, wherever they fit
  const scatter = (ref: string, c: XY, r: number, n: number, rad: number, o: { s?: [number, number]; solid?: SolidSpec[] | "none"; inside?: boolean } = {}) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if ((o.inside !== false && (Math.abs(x) > R - 150 || Math.abs(y) > R - 150)) || !free(x, y, rad, 30)) continue;
      const s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      prop(ref, [x, y], rnd() * 360, rad * s, { s, ...(o.solid ? { solid: o.solid } : {}) });
      made++;
    }
  };

  // ---- the way out to Noa: a signpost, a milestone, a cairn ----
  f.exit("noa", WAY, ARRIVE);
  prop("plains:signpost", [-3000, 4700], 160, 80);
  prop("plains:milestone", [-4180, 4500], -80, 60);
  prop("trunrada:cairn", [-4300, 5100], 0, 120);
  // where the lanes meet: a signpost at the valley's mouth
  prop("plains:signpost", [600, 1000], 200, 80);

  // ---- the windmill on its down ----
  prop("westfarm:stone_windmill", MILL, towards(-1, -0.35), 520, ring(350, "tower"));
  prop("trunrada:cart", [2700, 3500], 120, 230);
  prop("plains:hay_bales", [3900, 2300], 30, 240);
  prop("common:crate", [2650, 3050], 10, 60);
  prop("common:crate", [2600, 3130], 50, 60);
  prop("trunrada:haystack", [4200, 3700], 0, 200);
  prop("flora:BigOak", [4500, 2700], 40, 300, { s: 1.15 });

  // ---- the far down: the ruined watchtower on its step, the old border stones, relics ----
  prop("westfarm:watchtower_ruin", TOWER, towards(-1, 0.2), 640, {
    solid: [
      { kind: "tower", x: -244, y: 145, w: 72, d: 270, rot: 0 }, { kind: "tower", x: -244, y: -205, w: 72, d: 150, rot: 0 },
      { kind: "tower", x: 244, y: 0, w: 72, d: 560, rot: 0 }, { kind: "tower", x: 0, y: 244, w: 560, d: 72, rot: 0 }, { kind: "tower", x: 0, y: -244, w: 560, d: 72, rot: 0 },
    ],
  });
  for (const [at, h] of [[[3000, -2600], 20], [[4400, -2500], 70], [[4300, -4000], 120]] as [XY, number][]) prop("trunrada:standing_stone", at, h, 100, ring(55, "stone"));
  prop("frontier:battle_relics", [3150, -3900], 40, 200, { solid: "none" });
  prop("frontier:rubble_pile", [4300, -3500], 10, 220, { s: 0.8 });
  prop("trunrada:cairn", [2800, -3700], 0, 120);
  prop("flora:BigOak", [4200, -1800], 120, 300, { s: 1.2 });
  prop("trunrada:standing_stone", [2400, -1800], 0, 100, ring(55, "stone"));
  prop("trunrada:standing_stone", [3800, -5100], 90, 100, ring(55, "stone"));

  // ---- the pastures: the shepherd's hut, two sheepfolds, the dew pond ----
  prop("westfarm:shepherd_hut", HUT, towards(1, 0.15), 420);
  prop("plains:hay_bales", [-3600, -1100], 60, 240);
  prop("steppe:water_trough", [-2700, -2200], 30, 140);
  prop("plains:log_pile", [-3550, -2050], 80, 260, { s: 0.6 });
  const foldSolid = (): SolidSpec[] => {
    const out: SolidSpec[] = [];
    for (let k = 0; k < 22; k++) {
      const a = Math.PI + 0.3 + (k / 21) * (Math.PI * 2 - 0.6);
      out.push({ kind: "wall", x: Math.cos(a) * 420, y: Math.sin(a) * 420, r: 62 });
    }
    return out;
  };
  prop("westfarm:sheepfold", FOLD_A, towards(1, 0.5), 520, { solid: foldSolid() });
  prop("westfarm:sheepfold", FOLD_B, towards(1, 0.2), 520, { solid: foldSolid() });
  prop("westfarm:sheep_flock", [FOLD_A[0] + 120, FOLD_A[1] + 60], 30, 10, { solid: "none" });
  const scenery: THREE.Object3D[] = [f.waterSheet({ x0: POND_C[0] - 700, x1: POND_C[0] + 700, y0: POND_C[1] - 800, y1: POND_C[1] + 800 }, -14, "WaterSea")];
  f.blockDisc(POND_C, 470);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rnd() * 0.3, x = POND_C[0] + Math.cos(a) * 520, y = POND_C[1] + Math.sin(a) * 620;
    if (nearTrack(x, y, 300)) continue;
    put(i % 3 ? "plains:reeds" : "plains:flat_rock", [x, y], rnd() * 360, { s: i % 3 ? 0.9 + rnd() * 0.3 : 0.5, solid: "none" });
  }
  taken.push([POND_C[0], POND_C[1], 650]);

  // ---- lone oaks on the hills, a few birches and bushes ----
  for (const [at, s] of [[[-1600, 3350], 1.35], [[-200, -3650], 1.25], [[-4300, 2150], 1.1], [[300, 4450], 1.2], [[4300, 30], 1.15], [[-4000, -3950], 1.05], [[2700, 350], 0.95], [[4300, 4400], 1.2], [[2200, -4600], 1.1]] as [XY, number][]) {
    if (free(at[0], at[1], 200)) prop("flora:BigOak", at, rnd() * 360, 280 * s, { s, solid: [{ kind: "tree", x: 0, y: 0, r: 45 * s }] });
  }

  // ---- the dry-stone walls: old field boundaries, gaps where the lanes go through ----
  const gapAt = (x: number, y: number) => nearTrack(x, y, 330) || wet(x, y, 120) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + 150);
  const WALLS: XY[][] = [
    [[-5900, 3700], [-4500, 3250], [-2900, 2400], [-1900, 2000], [-600, 2650], [900, 3350], [1250, 3900]],
    [[-5900, 300], [-4400, 500], [-2900, 1000], [-1600, 1500]],
    [[-5900, -1300], [-4300, -1250], [-3800, -1950], [-4000, -3400], [-4400, -5900]],
    [[-2700, -3800], [-1900, -3450], [-500, -2900], [300, -2700]],
    [[-1600, -5900], [-1900, -4900], [-2700, -3800]],
    [[1800, -1600], [2600, -1750], [4100, -1450], [5900, -1650]],
    [[1900, -4200], [1500, -5000], [1400, -5900]],
    [[5000, -2500], [5900, -2900]],
    [[2500, 4300], [3600, 3900], [4800, 4300], [5900, 4000]],
    [[2900, 5900], [3300, 4700]],
    [[-700, -900], [-400, -1700], [-1200, -2200]],
    [[400, 1800], [-300, 1300]],
  ];
  for (const w of WALLS) wallRun(f, w, { skip: gapAt, broken: 0.14 });
  // and on past the edge
  for (const w of [[[-5800, 6000], [-3000, 6400], [-500, 7400], [1200, 8600]], [[-6200, -5800], [-5800, -2000], [-6600, 1500], [-6000, 5400]], [[-5600, -6000], [-2400, -6000]]] as XY[][]) wallRun(f, w, { broken: 0.25 });

  // ---- flocks over the pastures and the downs ----
  for (const at of [[-2200, -900], [-3900, -400], [-1300, -3900], [-600, -2300], [-4400, 3000], [-1500, 2500], [-200, 3300], [2500, -2300], [4300, -2700], [2900, -1400], [3900, 2000], [4300, 3300], [-4700, -2400]] as XY[])
    scatter("westfarm:sheep_flock", at, 450, 1, 180, { solid: "none" });

  // ---- rocks: mossy boulders, clusters, slabs ----
  const ROCKS: [string, XY, number][] = [
    ["plains:boulder", [-2300, 4300], 230], ["plains:rock_cluster", [-4800, 1500], 260], ["plains:flat_rock", [-800, 2000], 230], ["steppe:boulder", [600, -1700], 200],
    ["plains:rock_cluster", [-4900, -4600], 260], ["plains:boulder", [-2500, -4800], 230], ["plains:flat_rock", [-200, -4900], 230], ["steppe:boulder_flat", [1700, 2400], 180],
    ["plains:boulder", [4900, 800], 230], ["plains:rock_cluster", [3400, 700], 260], ["steppe:rock_cluster", [5000, -3900], 230], ["plains:boulder", [2000, -5200], 230],
    ["plains:flat_rock", [4600, 5000], 230], ["steppe:boulder", [-5000, 4900], 200], ["plains:rock_cluster", [1900, 4900], 260], ["plains:boulder", [-1000, 5000], 230],
  ];
  for (const [ref, at, r] of ROCKS) if (free(at[0], at[1], r)) prop(ref, at, rnd() * 360, r, { s: 0.75 + rnd() * 0.3 });
  // boulders at the foot of the downs' cliffs, birches and bushes along their tops
  for (const poly of [P1, P2, P3]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (inPoly(poly, mx + nx * 60, my + ny * 60)) [nx, ny] = [-nx, -ny];
      for (let t = 300; t < L - 300; t += 650) {
        const px = a[0] + ((b[0] - a[0]) * t) / L, py = a[1] + ((b[1] - a[1]) * t) / L;
        const out = 300 + rnd() * 150, x = px + nx * out, y = py + ny * out;
        if (rnd() < 0.5 && Math.abs(x) < R - 200 && Math.abs(y) < R - 200 && free(x, y, 110, 40)) {
          const s = 0.45 + rnd() * 0.3;
          prop(rnd() < 0.6 ? "plains:boulder" : "plains:flat_rock", [x, y], rnd() * 360, 160 * s, { s, solid: [{ kind: "rock", x: 0, y: 0, r: 120 * s }] });
        }
        const back = 380 + rnd() * 250, bx2 = px - nx * back, by2 = py - ny * back;
        if (rnd() < 0.35 && Math.abs(bx2) < R - 200 && Math.abs(by2) < R - 200 && free(bx2, by2, 160, 80)) {
          const kind = rnd() < 0.5 ? "Birch" : "RoundTree";
          prop(`flora:${kind}`, [bx2, by2], rnd() * 360, 170, { s: 0.7 + rnd() * 0.3 });
        }
      }
    }
  }

  // ---- ground cover: meadow flowers in drifts, tall grass, bushes along the walls ----
  const IN = { x0: -R + 200, x1: R - 200, y0: -R + 200, y1: R - 200 };
  for (let i = 0; i < 140; i++) {
    const x = IN.x0 + rnd() * (IN.x1 - IN.x0), y = IN.y0 + rnd() * (IN.y1 - IN.y0);
    if (!free(x, y, 90)) continue;
    put("westfarm:wildflowers", [x, y], rnd() * 360, { s: 0.7 + rnd() * 0.6, solid: "none" });
    taken.push([x, y, 60]);
  }
  for (let i = 0; i < 160; i++) {
    const x = IN.x0 + rnd() * (IN.x1 - IN.x0), y = IN.y0 + rnd() * (IN.y1 - IN.y0);
    if (!free(x, y, 70)) continue;
    const k = rnd();
    put(k < 0.7 ? "plains:tall_grass" : "flora:Bush", [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.5, solid: "none" });
    taken.push([x, y, 50]);
  }

  // ---- past the edge: the downs roll on, walled, with trees in their hollows and on the higher
  // downs; more flowers ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const keepOut = (x: number, y: number) => inside(x, y) || nearTrack(x, y, 330);
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["BigOak", "RoundTree", "RoundTree", "Birch", "SmallTree"], keepOut, { count: 380, spacing: 520, tries: 6000 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["Bush", "Bush", "SmallTree"], keepOut, { count: 120, spacing: 420, tries: 2000 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["wildflowers", "sheep_flock"], keepOut, { count: 70, spacing: 700, tries: 2000, kit: "westfarm" });

  // ---- monsters: the pastures, the valley, both downs ----
  const busy = (x: number, y: number) => Math.hypot(x - HUT[0], y - HUT[1]) < 900 || Math.hypot(x - MILL[0], y - MILL[1]) < 800 || Math.hypot(x - TOWER[0], y - TOWER[1]) < 650;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 880, keepOut: busy, max: 52 });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "noa_meadow_shepherd", x: HUT[0] + 420, y: HUT[1] + 330, face: 0, name: "ลุงโทมัส", title: "คนเลี้ยงแกะแห่งทุ่งโนอา", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ลมบนทุ่งโนอาไม่เคยหยุดพัด แกะของข้าเลยขนหนากว่าที่ไหน ๆ",
        "กำแพงหินพวกนี้คนรุ่นปู่ทวดเรียงไว้ทีละก้อน ไม่มีปูนสักนิด แต่ยืนมาได้ร้อยปี",
        "เนินฝั่งตะวันออกมีซากหอยามสมัยโนอายังเป็นเมืองหลวง ช่วงนี้มีตัวอะไรไม่รู้ไปทำรังอยู่แถวนั้น",
      ],
    },
    {
      id: "noa_meadow_miller", x: MILL[0] - 520, y: MILL[1] - 200, face: 200, name: "ป้าเบียทริซ", title: "คนเฝ้ากังหันลมเก่า", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "auburn", eyes: "teal", top: "top_adventurer_teal", bottom: "bottom_adventurer_cocoa" },
      lines: [
        "กังหันลมนี้บดแป้งส่งเข้าเมืองโนอามาตั้งแต่สมัยยังเป็นเมืองหลวง",
        "ใบพัดหักไปใบหนึ่งแล้ว ยังหาช่างขึ้นไปซ่อมไม่ได้ ลมแรงขนาดนี้ใครจะกล้า",
        "ยืนตรงนี้มองเห็นทั้งทุ่ง ทางลงไปโนอาอยู่มุมตะวันตกเฉียงใต้นะจ๊ะ",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery,
    sky: "#6f8f4c",
    flowers: {
      box: { x: -R, y: -R, w: 2 * R, h: 2 * R },
      open: (x, y) => ground.kind(x, y) === 0 && !wet(x, y, 60),
      density: 0.42 * quality.flowers,
    },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -3360, y: 4150 },
    npcs,
    labels: [
      { x: WAY[0] + 50, y: WAY[1] - 300, text: "ทางไปโนอา", kind: "gate" },
      { x: -1800, y: 1300, text: "ทุ่งหญ้าโนอา" },
      { x: MILL[0] - 450, y: MILL[1], text: "เนินกังหันลม" },
      { x: TOWER[0] - 600, y: TOWER[1], text: "ซากหอยามโบราณ" },
      { x: 3200, y: -1800, text: "เนินหญ้าฝั่งตะวันออก" },
      { x: HUT[0] + 450, y: HUT[1], text: "กระท่อมคนเลี้ยงแกะ", kind: "small" },
      { x: FOLD_A[0], y: FOLD_A[1], text: "คอกแกะ", kind: "small" },
      { x: POND_C[0] - 700, y: POND_C[1], text: "บ่อน้ำค้าง", kind: "small" },
      { x: 3600, y: 200, text: "หุบลม", kind: "small" },
    ],
  });
}

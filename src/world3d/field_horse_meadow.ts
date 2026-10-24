// ทุ่งเลี้ยงม้า (the horse meadow), monsters Lv 40-50: rolling grass north of Trunrada, where
// the clans once kept their herds. The way in is from the town's north gate (south edge). In
// the middle-west stands the abandoned ranch: its barn with the roof fallen in, a paddock, a
// round pen, troughs and a well sweep round a trampled yard, the stone walls of the
// rancher's house. Wild horses graze the hills. To the north the land rises to grassy bluffs
// that end in cliffs over the North Sea, which fills the whole north of the map past them, sea
// stacks out in the surf; on a headland step jutting out from the bluffs burns the old beacon
// tower. A low mesa in the south-east keeps a horse
// shrine. Woods close the east, west and south.
//
// The way west to the frozen falls: a track leaves the one up to the bluffs and runs west over
// the hill north of the paddock and out through the woods.
//
// The way east to the windswept heights: a track runs on from the foot of the shrine mesa's ramp,
// east over the shoulder of the hill beside it and out through the woods.
//
// Full size around the origin (north +X, east -Y), scaled by TOWN_SCALE in finishField.

import * as THREE from "three";
import { FieldBuilder } from "./field";
import { useKits } from "./town";
import type { Town } from "./town";
import type { Poly } from "./paved";
import { KIT as STEPPE, SHAPES, smooth, band, ellipse, densify, fenceRun, fieldReport } from "./kits/steppe";
import { KIT as TRUNRADA } from "./kits/trunrada";
import type { NpcSpec } from "../npcs";

useKits(STEPPE, TRUNRADA);

type XY = [number, number];

const R = 5500;
const AREA = 9300;

// ---- the ground's heights: the bluffs along the coast, the headland step, the shrine mesa ----
// (the cliffs' top edge, east to west: a narrow bluff over a broad sea, the headland jutting out)
const COAST: XY[] = [
  [4250, -9800], [4100, -7600], [4200, -6000], [4500, -4600], [4850, -3800], [5050, -2900], [4750, -2000], [4700, -1300], [4600, -500],
  [4600, 300], [4450, 1200], [4450, 2200], [4250, 2900], [4400, 3600], [4200, 4300], [4100, 5200], [4300, 5800], [4150, 7400], [4250, 9800],
];
const BLUFF_S: XY[] = [[3300, 9800], [3500, 7000], [3100, 5200], [3600, 3600], [3200, 2200], [3700, 600], [3400, -900], [3450, -2400], [3300, -3800], [3600, -5300], [3300, -7200], [3500, -9800]];
const BLUFF: XY[] = [...BLUFF_S, ...COAST];
const HEADLAND: XY[] = [[3850, -1900], [3700, -3000], [4100, -3850], [4650, -3650], [4780, -2900], [4300, -1900]];
const MESA: XY[] = [[-1900, -2700], [-2700, -2400], [-3700, -2700], [-4100, -3600], [-3800, -4600], [-2800, -4900], [-2000, -4500], [-1700, -3600]];
const RAMP_W = { top: [3400, 2900] as XY, bottom: [2150, 3257] as XY, width: 460 };
const RAMP_E = { top: [3550, -150] as XY, bottom: [2276, 105] as XY, width: 460 };
const RAMP_HEAD = { top: [4075, -1900] as XY, bottom: [4075, -1100] as XY, width: 400 };
const RAMP_MESA = { top: [-1800, -3150] as XY, bottom: [-800, -3150] as XY, width: 440 };
// the rim: hills and woods east, west and south, a low mesa among them
const RIM_S: XY[] = [[-6300, -3800], [-6000, -2200], [-6600, -1300], [-7800, -1500], [-8800, -2600], [-8400, -3900], [-7200, -4500]];
const RIM_SW: XY[] = [[-6000, 3600], [-6400, 5400], [-7800, 5900], [-8600, 4200], [-7400, 2900]];

const TERRAIN = {
  rock: "CliffRock",
  hills: [
    { x: -3500, y: -1000, r: 1700, h: 220 },
    { x: -800, y: -1500, r: 1700, h: 200 },
    { x: 1200, y: -3000, r: 2100, h: 300 },
    { x: 1400, y: -1200, r: 1000, h: 130 },
    { x: -4300, y: 3700, r: 1400, h: 200 },
    { x: 900, y: 4700, r: 1300, h: 190 },
    { x: -4500, y: 1100, r: 1100, h: -120 },
    { x: 2400, y: -4600, r: 1300, h: 220 },
    { x: -1000, y: -4700, r: 1000, h: 150 },
    { x: 1300, y: 1700, r: 900, h: 110 },
    { x: -2800, y: 600, r: 900, h: 90 },
    // the rim rolls on
    { x: -7800, y: -1800, r: 2600, h: 300 }, { x: 0, y: 7800, r: 2600, h: 320 }, { x: 0, y: -7800, r: 2600, h: 300 },
    { x: -7200, y: 6800, r: 2400, h: 260 }, { x: -7200, y: -6800, r: 2400, h: 260 },
  ],
  plateaus: [
    { poly: densify(BLUFF), h: 420, ramps: [RAMP_W, RAMP_E] },
    { poly: densify(HEADLAND), h: 640, ramps: [RAMP_HEAD] },
    { poly: densify(MESA), h: 320, ramps: [RAMP_MESA] },
    { poly: densify(RIM_S), h: 520 },
    { poly: densify(RIM_SW), h: 460 },
  ],
};

// ---- the tracks ----
const MAIN: XY[] = smooth([[-AREA - 200, -350], [-6200, -320], [-5150, -300], [-4300, -150], [-3300, 300], [-2400, 1200], [-1900, 2200], [-1500, 3150]]);
// (along the bluff's top it keeps near the landward edge, clear of the drop to the sea)
const TO_BLUFF_W: XY[] = smooth([[-1700, 2550], [-700, 2200], [300, 2000], [1200, 2550], [2150, 3257], [3400, 2900], [3700, 2300], [3920, 1200], [4050, 300], [3900, -500], [3950, -850], [4075, -1100], [4075, -1900], [4150, -2500]]);
const TO_BLUFF_E: XY[] = smooth([[-2950, 600], [-1700, 900], [-300, 650], [1000, 250], [2276, 105], [3550, -150], [3950, -300]]);
const TO_MESA: XY[] = smooth([[-3900, 0], [-2900, -700], [-1700, -1900], [-800, -3150], [-1800, -3150], [-2450, -3300]]);
const YARD: Poly = ellipse([-1800, 3050], 700, 650, 22, 0.08, 2);

// ---- the way west to the frozen falls: off the track up to the bluffs, west over the hill north
// of the paddock, out over the west edge (where the frozen falls' own way east meets it, n 0.61) ----
const WEST_WAY: XY[] = smooth([[1200, 2550], [1180, 3400], [1150, 4400], [1150, 5150], [1150, 6400], [1150, AREA + 200]]);
const W_EXIT: XY = [1150, 5150], W_BACK: XY = [1150, 4450];
// its track joins the ground's others
const withWestWay = <T extends { roads: Poly[] }>(spec: T): T => ({ ...spec, roads: [...spec.roads, band(WEST_WAY, 420)] });

// ---- the way east to the windswept heights: on from the foot of the shrine mesa's ramp, east over
// the hill's shoulder, out over the east edge (where the heights' own way west meets it, n 0.47) ----
const EAST_WAY: XY[] = smooth([[-800, -3150], [-700, -3700], [-550, -4400], [-450, -5150], [-450, -6300], [-450, -AREA - 200]]);
const E_EXIT: XY = [-450, -5150], E_BACK: XY = [-500, -4450];
// its track joins the ground's others
const withEastWay = <T extends { roads: Poly[] }>(spec: T): T => ({ ...spec, roads: [...spec.roads, band(EAST_WAY, 420)] });

// the last build's own check (see fieldReport), for building the field; the game never calls it
export let REPORT: () => string[] = () => [];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(107, TERRAIN);
  // the sea: from a strip of stony shore under the cliffs out past the edge
  const sea: Poly = [...COAST.map(([x, y]) => [x + 260, y] as XY).reverse(), [AREA + 400, -AREA - 600], [AREA + 400, AREA + 600]].reverse() as Poly;
  const ground = f.ground(withEastWay(withWestWay({
    area: { x0: -AREA, y0: -AREA, x1: AREA, y1: AREA },
    base: "steppe",
    roads: [band(MAIN, 520), band(TO_BLUFF_W, 420), band(TO_BLUFF_E, 420), band(TO_MESA, 400), YARD],
    plazas: [],
    water: [sea],
    road: [0.9, 0.82, 0.7],
  })));

  // ---- placing, with a record of what stands where ----
  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number) => taken.every(([a, b, rr]) => Math.hypot(a - x, b - y) > r + rr);
  const open = (x: number, y: number, r: number) =>
    f.level(x, y, r) && [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0);
  const put = (ref: string, at: XY, h = 0, r = 150, s = 1) => {
    const id = ref.split(":")[1];
    f.put(ref, at, h, { s, ...(ref.startsWith("steppe:") && SHAPES[id] ? { solid: SHAPES[id] } : {}) });
    taken.push([at[0], at[1], r * s]);
  };
  const deco = (ref: string, at: XY, h = 0, s = 1) => f.put(ref, at, h, { s, solid: "none" });
  const scatter = (refs: string[], box: { x0: number; x1: number; y0: number; y1: number }, n: number, r: number, o: { solid?: boolean; s?: [number, number]; keep?: (x: number, y: number) => boolean } = {}) => {
    let placed = 0;
    for (let i = 0; i < n * 30 && placed < n; i++) {
      const x = box.x0 + f.rnd() * (box.x1 - box.x0), y = box.y0 + f.rnd() * (box.y1 - box.y0);
      if (!open(x, y, r) || !free(x, y, r) || (o.keep && !o.keep(x, y))) continue;
      const s = o.s ? o.s[0] + f.rnd() * (o.s[1] - o.s[0]) : 1;
      const ref = refs[Math.floor(f.rnd() * refs.length)];
      if (o.solid === false) deco(ref, [x, y], f.rnd() * 360, s);
      else put(ref, [x, y], f.rnd() * 360, r, s);
      taken.push([x, y, r * s]);
      placed++;
    }
  };
  const lineTaken = (a: XY, b: XY, r: number) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let t = 0; t <= L; t += r) taken.push([a[0] + ((b[0] - a[0]) * t) / L, a[1] + ((b[1] - a[1]) * t) / L, r]);
  };

  // ---- the way out: south to Trunrada's north gate ----
  f.exit("trunrada", [-5150, -300], [-4450, -250]);
  put("trunrada:banner_pole", [-4900, -850], 0, 80);
  put("trunrada:banner_pole", [-4900, 250], 0, 80);
  put("steppe:signpost", [-4500, 450], 180, 60);
  put("trunrada:cairn", [-4300, -950], 0, 150);
  taken.push([-5150, -300, 500]);

  // ---- the abandoned ranch round its yard ----
  put("steppe:barn_ruin", [-300, 3200], 0, 0);
  taken.push([-300, 3200, 760]);
  put("steppe:well_sweep", [-2100, 3500], 30, 0);
  taken.push([-2400, 3330, 130], [-2080, 3510, 60], [-1760, 3700, 80]);
  put("steppe:water_trough", [-1300, 3650], 90, 180);
  put("steppe:water_trough", [-2450, 2550], 20, 180);
  put("trunrada:cart", [-2300, 2300], 150, 200);
  put("steppe:hay_bales", [-1250, 3950], 0, 200);
  put("trunrada:haystack", [400, 4200], 0, 200);
  put("trunrada:hitching_post", [-2350, 2900], 90, 200);
  put("common:crate", [-1050, 2800], 20, 50);
  put("common:crate", [-1000, 2860], -15, 50);
  // the paddock west of the yard and the round pen east of it
  fenceRun(f, [-2700, 4200], [-200, 4200], [-1450, 4900], { gates: [0.3], broken: [2] });
  fenceRun(f, [-200, 4200], [-200, 5200], [-1450, 4900]);
  fenceRun(f, [-200, 5200], [-2700, 5200], [-1450, 4900], { broken: [1] });
  fenceRun(f, [-2700, 5200], [-2700, 4200], [-1450, 4900]);
  lineTaken([-2700, 4200], [-200, 4200], 120);
  lineTaken([-200, 4200], [-200, 5200], 120);
  lineTaken([-200, 5200], [-2700, 5200], 120);
  lineTaken([-2700, 5200], [-2700, 4200], 120);
  put("trunrada:horse_grazing", [-1900, 4700], 70, 120);
  put("trunrada:horse", [-900, 4850], 200, 120);
  put("trunrada:horse_grazing", [-600, 4550], -20, 120);
  const PEN: XY = [-3300, 2300];
  for (let k = 0; k < 8; k++) {
    if (k === 6) continue;
    const a0 = (k / 8) * Math.PI * 2 + 0.2, a1 = ((k + 1) / 8) * Math.PI * 2 + 0.2;
    const A: XY = [PEN[0] + Math.cos(a0) * 720, PEN[1] + Math.sin(a0) * 720], B: XY = [PEN[0] + Math.cos(a1) * 720, PEN[1] + Math.sin(a1) * 720];
    if (k === 7) put("steppe:corral_gate", [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], (Math.atan2(-(B[0] - A[0]), B[1] - A[1]) * 180) / Math.PI + 180, 0);
    else fenceRun(f, A, B, PEN, { broken: k === 3 ? [0] : [] });
    lineTaken(A, B, 120);
  }
  put("steppe:fallen_log", [-3450, 600], 60, 200);
  put("trunrada:horse", [PEN[0] + 150, PEN[1] - 200], 30, 120);
  // the rancher's house: its stone walls tumbled, the hearth still there
  const HX = -4100, HY = 3700;
  for (const s of [-1, 1]) {
    f.put("steppe:ruined_wall", [HX + s * 300, HY - 200], 0);
    f.put("steppe:ruined_wall", [HX + s * 300, HY + 200], 0);
  }
  f.put("steppe:ruined_wall", [HX, HY - 400], 90, { sy: 1.5 });
  f.put("steppe:ruined_wall", [HX - 150, HY + 400], 90, { sy: 0.75 });
  taken.push([HX, HY, 520]);
  put("trunrada:campfire", [HX, HY], 20, 0);
  put("common:crate", [HX + 180, HY - 250], 10, 0);
  put("steppe:hay_bales", [HX + 900, HY + 200], 80, 200);

  // ---- the way west to the frozen falls: the warp, a signpost and a cairn ----
  f.exit("frozen_falls", W_EXIT, W_BACK);
  put("steppe:signpost", [750, 4800], -90, 60);
  put("trunrada:cairn", [1650, 4950], 0, 150);
  lineTaken([1150, 2900], [1150, 5300], 260);

  // ---- the way east to the windswept heights: the warp, a signpost and a cairn ----
  f.exit("windswept_heights", E_EXIT, E_BACK);
  put("steppe:signpost", [-1000, -4750], 90, 60);
  put("trunrada:cairn", [100, -4900], 0, 150);
  lineTaken([-750, -3400], [-450, -5300], 260);

  // ---- the bluffs, the headland and the beacon ----
  put("steppe:beacon_tower", [4200, -2850], -90, 0);
  taken.push([4200, -2850, 420], [4560, -2850, 200], [3880, -2810, 120]);
  put("steppe:signpost", [3700, -1150], 90, 60);
  put("trunrada:cairn", [3950, 3350], 0, 150);
  put("steppe:stone_idol", [3750, 4650], 160, 70);
  put("steppe:stone_idol", [4200, 2100], 200, 70);
  put("steppe:rock_cluster", [4050, -4550], 30, 230);
  put("steppe:boulder", [3700, 4000], 70, 160);
  put("steppe:dead_tree", [4300, 600], 250, 120);
  put("steppe:bones", [4250, -650], 60, 120);
  put("trunrada:standing_stone", [4000, -3500], 20, 80);

  // ---- the horse shrine on the mesa ----
  put("trunrada:cairn", [-3150, -3350], 0, 160);
  put("trunrada:totem", [-3250, -4000], 0, 100);
  put("trunrada:banner_pole", [-2700, -2950], 0, 60);
  put("trunrada:banner_pole", [-2700, -3750], 0, 60);
  for (const [x, y, h] of [[-2300, -4100, 30], [-3600, -4100, -20], [-2450, -2850, 80]] as [number, number, number][]) put("steppe:stone_idol", [x, y], h, 70);
  put("trunrada:horse_grazing", [-3400, -2800], 150, 120);

  // ---- wild horses on the hills ----
  for (const [x, y, h] of [[1300, -2700, 30], [1700, -3200, 200], [900, -3400, 110], [-600, -1600, 300], [-300, -1250, 10], [2200, -1200, 250], [-3700, -1400, 90], [700, 3700, 160], [1600, 4600, 40]] as [number, number, number][])
    put(f.rnd() < 0.7 ? "trunrada:horse_grazing" : "trunrada:horse", [x, y], h, 140);

  // ---- the meadow: old fence lines, stones, scrub and grass ----
  for (const [a, b] of [[[2000, 2700], [2450, 900]]] as [XY, XY][]) {
    fenceRun(f, a, b, [a[0] + 2000, a[1]], { broken: [1, 3] });
    lineTaken(a, b, 120);
  }
  put("steppe:ruined_wall", [2900, -3500], 20, 0);
  put("steppe:ruined_wall", [2700, -3880], 15, 0);
  put("steppe:fallen_log", [-1500, -500], 120, 200);
  // a birch copse in the middle of the meadow, a cairn where the tracks part
  for (const [x, y, s] of [[300, -1700, 1], [650, -2100, 0.85], [-50, -2150, 0.9], [450, -2500, 1.1], [900, -1650, 0.8]] as [number, number, number][]) {
    f.put("flora:Birch", [x, y], f.rnd() * 360, { s });
    taken.push([x, y, 150]);
  }
  put("steppe:fallen_log", [100, -1250], 40, 200);
  put("trunrada:cairn", [-3100, 1000], 0, 150);
  put("trunrada:haystack", [1500, 800], 0, 200);
  put("steppe:hay_bales", [1900, 750], 70, 200);
  put("steppe:dead_tree", [-4300, 2400], 30, 120);
  put("steppe:dead_tree", [2700, -2300], 140, 120);
  const all = { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 };
  scatter(["steppe:boulder"], all, 7, 160);
  scatter(["steppe:rock_cluster"], all, 4, 230);
  scatter(["steppe:boulder_flat"], all, 7, 180);
  scatter(["steppe:bones"], all, 3, 120, { solid: false });
  scatter(["steppe:scrub"], all, 30, 100, { solid: false, s: [0.7, 1.2] });
  scatter(["steppe:grass_tuft"], all, 320, 60, { solid: false, s: [0.7, 1.4] });
  scatter(["flora:Birch"], all, 8, 130);
  scatter(["flora:Bush"], all, 8, 110);

  // ---- the shore under the cliffs and the sea stacks ----
  for (let i = 0; i + 1 < COAST.length; i++) {
    const [ax, ay] = COAST[i], [bx, by] = COAST[i + 1];
    const L = Math.hypot(bx - ax, by - ay);
    for (let t = 120; t < L; t += 260 + f.rnd() * 200) {
      const x = ax + ((bx - ax) * t) / L + 140 + f.rnd() * 90, y = ay + ((by - ay) * t) / L;
      deco(f.rnd() < 0.6 ? "steppe:boulder" : "steppe:rock_cluster", [x, y], f.rnd() * 360, 0.45 + f.rnd() * 0.45);
    }
  }
  for (const [x, y, s] of [[6600, -3400, 1.1], [7600, -900, 1.4], [6900, 1800, 0.9], [8200, 3600, 1.5], [6500, 4900, 0.8], [7300, -6000, 1.2], [8600, -2600, 1], [6200, 7600, 1.1], [7400, 6400, 0.7],
    [5400, 3800, 0.8], [5700, -700, 1], [5300, -6300, 0.9], [5500, 1500, 0.6], [5900, -4600, 0.7]] as [number, number, number][])
    deco("steppe:sea_stack", [x, y], f.rnd() * 360, s);

  // ---- the rim: woods east, west and south ----
  const rim = (x: number, y: number) => x > R - 600 || (Math.abs(x) < R + 300 && Math.abs(y) < R + 300);
  f.woods({ x0: -AREA, x1: R, y0: -AREA, y1: AREA }, ["Birch", "Birch", "Pine", "PineSmall", "AutumnTree"], (x, y) => rim(x, y) || ground.kind(x, y) !== 0 || ground.kind(x, y + 260) !== 0 || ground.kind(x, y - 260) !== 0, { count: 320, spacing: 430 });
  for (let i = 0; i < 300; i++) {
    const x = (f.rnd() * 2 - 1) * AREA, y = (f.rnd() * 2 - 1) * AREA;
    if ((Math.abs(x) < R + 300 && Math.abs(y) < R + 300) || ground.kind(x, y) !== 0 || !f.level(x, y, 60)) continue;
    deco(i % 6 ? "steppe:grass_tuft" : "steppe:scrub", [x, y], f.rnd() * 360, 0.8 + f.rnd() * 0.6);
  }

  // ---- monsters: the meadow, the bluffs, the headland, the mesa; not in the ranch yard ----
  f.monsterSpots(ground, { x0: -R + 400, x1: R - 200, y0: -R + 400, y1: R - 400 }, {
    step: 820,
    keepOut: (x, y) => Math.hypot(x + 1800, y - 3050) < 1000,
  });

  const water = f.waterSheet({ x0: 4000, x1: AREA + 400, y0: -AREA - 600, y1: AREA + 600 });
  const npcs: NpcSpec[] = [
    { id: "horse_meadow_rancher", x: -1600, y: 2750, face: 180, name: "ผู้เฒ่าทูเมน", title: "เจ้าของคอกม้าเก่า", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ที่นี่เคยเป็นคอกม้าที่ใหญ่ที่สุดของทรุนราดา ตอนนี้เหลือแต่ข้ากับโรงนาหลังคาโหว่",
        "ม้าที่เคยเลี้ยงไว้กลายเป็นม้าป่าไปหมดแล้ว ยังวิ่งอยู่บนเนินพวกนั้น",
        "ขึ้นไปบนผาริมทะเลจะเห็นหอไฟสัญญาณ ไฟนั้นไม่เคยดับมาร้อยปี",
      ] },
    { id: "horse_meadow_keeper", x: 4000, y: -2400, face: 90, name: "เอนค์", title: "คนเฝ้าหอไฟ", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "blue", top: "top_adventurer_navy", bottom: "bottom_adventurer_black" },
      lines: [
        "ไฟบนหอนี้บอกเรือในทะเลเหนือว่าตรงนี้มีหน้าผา",
        "คืนที่หมอกลงหนา ข้าต้องขนฟืนขึ้นไปทั้งคืน",
      ] },
  ];

  REPORT = () => fieldReport(f, ground);
  return f.finishField({
    ground,
    scenery: [water as THREE.Object3D],
    sky: "#7f8a5a",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && x < 3000, density: 0.18 * quality.flowers },
    bounds: { minX: -R, maxX: 5350, minY: -R, maxY: R },
    spawn: { x: -4200, y: -150 },
    npcs,
    labels: [
      { x: W_EXIT[0] + 250, y: W_EXIT[1] - 250, text: "ทางไปหุบน้ำตกเยือกแข็ง", kind: "gate" },
      { x: E_EXIT[0] + 250, y: E_EXIT[1] + 250, text: "ทางไปที่ราบสูงลมแรง", kind: "gate" },
      { x: -1700, y: 3000, text: "คอกม้าร้าง" },
      { x: -1200, y: 3200, text: "โรงนาร้าง", kind: "small" },
      { x: -3300, y: 2300, text: "คอกกลม", kind: "small" },
      { x: 4050, y: -2300, text: "หอไฟสัญญาณ" },
      { x: 4050, y: 2400, text: "หน้าผาทะเลเหนือ" },
      { x: -2600, y: -3500, text: "ศาลเจ้าม้า", kind: "small" },
      { x: -4900, y: -300, text: "ทางไปทรุนราดา", kind: "gate" },
    ],
  });
}

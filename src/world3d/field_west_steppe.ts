// สเตปป์ตะวันตก (the west steppe), monsters Lv 30-40: the dry grassland west of Trunrada,
// between the pine woods by the river (west) and the town's west gate (east). One winding
// track crosses it west to east. North of the track a broad mesa carries an old chieftain's
// burial mound (the kurgan) with its stone idols; south-east a lower mesa with an avenue of
// standing stones climbs to a higher step and the herders' lookout tower. A herders' camp of
// felt yurts round a well sweep and a pond lies south-west, haystacks on a rise north-east, a
// dry hollow with bleaching bones in the middle. Mesas wall the north and south; birch and
// pine woods close the west and east past the ways out.
//
// Full size around the origin (north +X, east -Y), scaled by TOWN_SCALE in finishField.

import * as THREE from "three";
import { FieldBuilder } from "./field";
import { useKits } from "./town";
import type { Town } from "./town";
import { KIT as STEPPE, SHAPES, smooth, band, ellipse, densify, fenceRun, fieldReport } from "./kits/steppe";
import { KIT as TRUNRADA } from "./kits/trunrada";
import type { NpcSpec } from "../npcs";

useKits(STEPPE, TRUNRADA);

type XY = [number, number];

const R = 5500;          // the walkable bounds, full size
const AREA = 9300;       // the ground reaches this far

// ---- the ground's heights ----
const MESA_A: XY[] = [[1500, 1400], [2200, 1100], [3300, 1150], [4300, 1500], [4750, 2400], [4650, 3600], [4100, 4450], [3000, 4700], [2000, 4400], [1400, 3500], [1300, 2400]];
const MESA_B: XY[] = [[-1600, -1300], [-2600, -1100], [-3700, -1300], [-4500, -2000], [-4700, -3200], [-4300, -4300], [-3200, -4700], [-2100, -4400], [-1500, -3500], [-1300, -2400]];
const STEP_B: XY[] = [[-3300, -2700], [-4150, -2600], [-4350, -3300], [-4000, -4050], [-3300, -4250], [-2900, -3600]];
const MESA_C: XY[] = [[3400, -3300], [4400, -3150], [4900, -3900], [4600, -4800], [3700, -5000], [3100, -4400]];
const RAMP_A = { top: [1350, 2950] as XY, bottom: [50, 3000] as XY, width: 460 };
const RAMP_B = { top: [-1400, -2950] as XY, bottom: [-400, -2950] as XY, width: 440 };
const RAMP_STEP = { top: [-3100, -3150] as XY, bottom: [-2323, -2805] as XY, width: 420 };
// the rim: mesa walls north and south, lower mesas among the woods east and west
const WALL_N: XY[] = [[5900, -9800], [6300, -7400], [5800, -5900], [6400, -4300], [6000, -2700], [6500, -1000], [5900, 600], [6300, 2300], [5800, 3900], [6400, 5600], [6000, 7300], [6200, 9800], [9800, 9800], [9800, -9800]];
const WALL_S: XY[] = [[-5900, -9800], [-6400, -7600], [-5900, -6000], [-6300, -4200], [-5800, -2500], [-6400, -800], [-6000, 900], [-6500, 2600], [-5900, 4300], [-6300, 6000], [-5900, 7700], [-6200, 9800], [-9800, 9800], [-9800, -9800]];
const RIM_E: XY[] = [[1300, -6300], [3000, -6000], [3700, -7300], [2900, -8700], [1100, -8600], [600, -7300]];
const RIM_W: XY[] = [[-1500, 6200], [-3100, 6300], [-3800, 7600], [-2700, 8900], [-1000, 8600], [-700, 7300]];
const RIM_E2: XY[] = [[-2300, -6600], [-3800, -6200], [-4900, -7100], [-4300, -8600], [-2600, -8900], [-1900, -7700]];

const TERRAIN = {
  rock: "CliffRock",
  hills: [
    { x: 500, y: -900, r: 1700, h: 150 },
    { x: 2600, y: -1900, r: 1900, h: 210 },
    { x: 3800, y: 200, r: 1500, h: 170 },
    { x: -1900, y: -600, r: 1200, h: -110 },
    { x: -4500, y: -900, r: 1200, h: 140 },
    { x: -900, y: 3900, r: 1300, h: 130 },
    { x: 1600, y: -4300, r: 1400, h: 160 },
    { x: -4400, y: 4400, r: 1500, h: 180 },
    { x: 4800, y: -1800, r: 1200, h: 150 },
    { x: 1200, y: 5000, r: 1200, h: 120 },
    { x: -1300, y: -4800, r: 1100, h: 110 },
    // the rim rolls on
    { x: 0, y: 7600, r: 2200, h: 220 }, { x: -200, y: -7600, r: 2200, h: 200 },
  ],
  plateaus: [
    { poly: densify(MESA_A), h: 380, ramps: [RAMP_A] },
    { poly: densify(MESA_B), h: 300, ramps: [RAMP_B] },
    { poly: densify(STEP_B), h: 560, ramps: [RAMP_STEP] },
    { poly: densify(MESA_C), h: 480 },
    { poly: densify(WALL_N), h: 680 },
    { poly: densify(WALL_S), h: 620 },
    { poly: densify(RIM_E), h: 430 },
    { poly: densify(RIM_W), h: 400 },
    { poly: densify(RIM_E2), h: 360 },
  ],
};

// ---- the tracks ----
const MAIN: XY[] = smooth([[350, AREA + 200], [250, 6200], [250, 5150], [-200, 4300], [-800, 3250], [-750, 2050], [-100, 1000], [400, -300], [150, -1500], [500, -2700], [250, -3900], [-300, -4700], [-300, -5150], [-250, -6200], [-150, -AREA - 200]]);
const TO_KURGAN: XY[] = smooth([[-780, 2700], [-300, 2960], [50, 3000], [1350, 2950], [1900, 2900], [2350, 2900]]);
const TO_LOOKOUT: XY[] = smooth([[480, -2620], [-400, -2950], [-1400, -2950], [-2000, -2870], [-2323, -2805], [-3100, -3150], [-3450, -3330]]);
const TO_CAMP: XY[] = smooth([[-720, 2050], [-1500, 2250], [-2300, 2700], [-2800, 2850], [-3300, 2900]]);
const TO_HAY: XY[] = smooth([[380, -350], [1300, -1050], [2200, -1700], [2700, -2300]]);

// the last build's own check (see fieldReport), for building the field; the game never calls it
export let REPORT: () => string[] = () => [];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(106, TERRAIN);
  const pond = ellipse([-3700, 1150], 650, 480, 28, 0.07, 3);
  const ground = f.ground({
    area: { x0: -AREA, y0: -AREA, x1: AREA, y1: AREA },
    base: "steppe",
    roads: [band(MAIN, 520), band(TO_KURGAN, 420), band(TO_LOOKOUT, 420), band(TO_CAMP, 400), band(TO_HAY, 380)],
    plazas: [],
    water: [pond],
    road: [0.9, 0.82, 0.7],
  });
  f.blockDisc([-3700, 1150], 470);
  for (const [x, y] of [[-3700, 1500], [-3700, 800], [-3350, 1150], [-4050, 1150]] as XY[]) f.blockDisc([x, y], 330);

  // ---- placing, with a record of what stands where ----
  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number) => taken.every(([a, b, rr]) => Math.hypot(a - x, b - y) > r + rr);
  const open = (x: number, y: number, r: number) =>
    Math.abs(x) < R + 2500 && Math.abs(y) < R + 2500 && f.level(x, y, r) &&
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0);
  const put = (ref: string, at: XY, h = 0, r = 150, s = 1) => {
    const id = ref.split(":")[1];
    f.put(ref, at, h, { s, ...(ref.startsWith("steppe:") && SHAPES[id] ? { solid: SHAPES[id] } : {}) });
    taken.push([at[0], at[1], r * s]);
  };
  const deco = (ref: string, at: XY, h = 0, s = 1) => f.put(ref, at, h, { s, solid: "none" });
  const tree = (kind: string, at: XY, s = 1) => {
    f.put(`flora:${kind}`, at, f.rnd() * 360, { s });
    taken.push([at[0], at[1], 120]);
  };
  // scatter `n` of something over a box where it is open, level and free
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
  const inside = (x: number, y: number) => Math.abs(x) < R && Math.abs(y) < R;

  // ---- the ways out: east to Trunrada's west gate, west to the pine woods by the river ----
  f.exit("trunrada", [-300, -5150], [-260, -4450]);
  f.exit("pine_river", [250, 5150], [180, 4450]);
  put("trunrada:banner_pole", [-850, -5000], 90, 80);
  put("trunrada:banner_pole", [250, -5000], 90, 80);
  put("steppe:signpost", [-900, -4500], 90, 60);
  put("trunrada:cairn", [350, -4300], 30, 150);
  put("steppe:signpost", [800, 4700], -90, 60);
  put("trunrada:cairn", [-500, 4950], 0, 150);
  taken.push([-300, -5150, 500], [250, 5150, 500]);

  // ---- mesa A: the kurgan and its idols ----
  put("steppe:kurgan", [3150, 2900], 0, 700);
  for (const [y, h] of [[2250, 4], [2550, -3], [3250, 6], [3550, -5]] as [number, number][]) put("steppe:stone_idol", [2150, y], h, 70);
  put("steppe:stone_idol", [3150, 1900], 90, 70);
  put("steppe:stone_idol", [3150, 3950], -90, 70);
  put("steppe:fallen_menhir", [4000, 1900], 60, 260);
  put("steppe:rock_cluster", [4200, 3800], 20, 230);
  put("steppe:boulder", [2000, 1600], 50, 160);
  put("steppe:boulder_flat", [4300, 2700], 80, 180);
  put("trunrada:standing_stone", [1800, 4000], 30, 80);
  put("trunrada:standing_stone", [4400, 1900], -20, 80);

  // ---- mesa B: an avenue of standing stones up to the step and the lookout ----
  for (const [x, y] of [[-1700, -2650], [-1700, -3250], [-2050, -2550], [-2050, -3150]] as XY[]) put("trunrada:standing_stone", [x, y], 0, 80);
  put("trunrada:cairn", [-2700, -2250], 0, 150);
  put("steppe:rock_spire", [-2500, -4100], 30, 170);
  put("steppe:boulder", [-3900, -1900], 10, 160);
  put("steppe:boulder_flat", [-2400, -1700], 40, 180);
  put("steppe:bones", [-3000, -1700], 120, 120);
  put("trunrada:watchtower", [-3700, -3500], 30, 260);
  put("trunrada:campfire", [-3500, -3950], 0, 160);
  put("steppe:signpost", [-3300, -3000], 120, 60);
  put("trunrada:banner_pole", [-3950, -3050], 0, 60);

  // ---- mesa C (no way up): a granite tor and a lone stone ----
  put("steppe:rock_spire", [4000, -4000], 0, 170);
  put("trunrada:standing_stone", [3700, -3500], 40, 80);
  put("steppe:rock_cluster", [4300, -4500], 60, 230);

  // ---- the herders' camp by the pond: yurts round the fire, the corral south of it ----
  const FIRE: XY = [-2250, 3200];
  const yurt = (at: XY) => put("trunrada:yurt_small", at, (Math.atan2(-(FIRE[1] - at[1]), -(FIRE[0] - at[0])) * 180) / Math.PI, 380);
  yurt([-1650, 3550]);
  yurt([-2250, 4100]);
  yurt([-3000, 3900]);
  put("trunrada:campfire", FIRE, 20, 200);
  put("trunrada:drying_rack", [-1550, 2950], 70, 150);
  put("trunrada:cart", [-1150, 3350], 60, 220);
  put("trunrada:hitching_post", [-1100, 2700], 90, 120);
  put("steppe:well_sweep", [-2650, 1550], 120, 0);
  taken.push([-2650 - 345 * Math.cos((120 * Math.PI) / 180), 1550 - 345 * Math.sin((120 * Math.PI) / 180), 150], [-2650, 1550, 80], [-2650 + 390 * Math.cos((120 * Math.PI) / 180), 1550 + 390 * Math.sin((120 * Math.PI) / 180), 90]);
  put("steppe:hay_bales", [-1000, 3900], 20, 200);
  put("trunrada:haystack", [-1500, 4300], 0, 200);
  put("trunrada:haystack", [-1900, 4650], 0, 200);
  const CA: XY = [-3300, 2300], CB: XY = [-4500, 3500], CM: XY = [-3900, 2900];
  fenceRun(f, [CA[0], CA[1]], [CA[0], CB[1]], CM, { gates: [0.5] });
  fenceRun(f, [CA[0], CB[1]], [CB[0], CB[1]], CM);
  fenceRun(f, [CB[0], CB[1]], [CB[0], CA[1]], CM, { broken: [1] });
  fenceRun(f, [CB[0], CA[1]], [CA[0], CA[1]], CM);
  taken.push([CM[0], CM[1], 900]);
  put("trunrada:horse_grazing", [-3700, 3200], 40, 0);
  put("trunrada:horse_grazing", [-4150, 2700], 200, 0);
  put("trunrada:horse", [-3600, 2650], 120, 0);
  put("steppe:water_trough", [-4200, 3250], 90, 0);
  for (const [x, y] of [[-4300, 1800], [-4400, 650], [-3200, 500], [-4700, 1250]] as XY[]) tree("Birch", [x, y], 0.9 + f.rnd() * 0.3);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + f.rnd() * 0.2, k = 1.08 + f.rnd() * 0.12;
    const at: XY = [-3700 + Math.cos(a) * 650 * k, 1150 + Math.sin(a) * 480 * k];
    if (ground.kind(at[0], at[1]) !== 0) continue;
    deco(i % 5 === 0 ? "common:rock_small" : "steppe:grass_tuft", at, f.rnd() * 360, i % 5 === 0 ? 1.6 : 1 + f.rnd() * 0.5);
  }

  // ---- the hay meadow on the rise ----
  for (const [x, y] of [[2300, -1300], [3000, -1600], [2500, -2400], [3300, -2500], [1900, -2200]] as XY[]) put("trunrada:haystack", [x, y], f.rnd() * 90, 200);
  put("steppe:hay_bales", [2900, -900], 60, 200);
  put("trunrada:cart", [3300, -1150], -30, 220);
  for (let i = 0; i < 4; i++) put("steppe:ruined_wall", [3700 + i * 50, -800 - i * 400], 90 + 10, 0);

  // ---- the dry hollow: bones and stones ----
  put("steppe:bones", [-1800, -700], 30, 130);
  put("steppe:bones", [-2200, -300], 160, 130);
  put("steppe:fallen_menhir", [-1450, -150], -30, 260);
  put("steppe:rock_cluster", [-2600, -450], 80, 230);
  put("steppe:dead_tree", [-1500, -1000], 200, 120);

  // ---- landmarks along the track and the open steppe ----
  put("steppe:stone_idol", [900, 1600], 150, 70);
  put("steppe:stone_idol", [-1300, -800], 60, 70);
  put("trunrada:standing_stone", [1500, 300], 10, 80);
  put("trunrada:standing_stone", [-600, -3700], 50, 80);
  put("steppe:trilithon", [-4600, 2700], 70, 260);
  put("steppe:dead_tree", [1100, 3900], 40, 120);
  put("steppe:dead_tree", [-4300, -4900], 160, 120);
  put("steppe:dead_tree", [4400, -2800], 300, 120);
  put("steppe:dead_tree", [-1000, 1700], 20, 120);
  put("steppe:fallen_log", [1700, -3400], 30, 200);
  put("steppe:fallen_log", [-4000, 3600], 100, 200);

  // ---- birch copses and a few free horses ----
  for (const [cx, cy] of [[1900, -300], [-3600, -600]] as XY[])
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + f.rnd(), d = 200 + f.rnd() * 300, at: XY = [cx + Math.cos(a) * d, cy + Math.sin(a) * d];
      if (open(at[0], at[1], 100) && free(at[0], at[1], 120)) tree(i % 4 ? "Birch" : "PineSmall", at, 0.8 + f.rnd() * 0.35);
    }
  put("steppe:fallen_log", [1950, -800], 70, 200);
  for (const [x, y, h] of [[1000, -2600, 30], [1350, -3050, 200], [-4100, -150, 120]] as [number, number, number][]) put("trunrada:horse_grazing", [x, y], h, 140);

  // ---- the land itself: boulders, scrub and grass everywhere ----
  const all = { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 };
  scatter(["steppe:boulder"], all, 9, 160);
  scatter(["steppe:rock_cluster"], all, 6, 230);
  scatter(["steppe:boulder_flat"], all, 9, 180);
  scatter(["steppe:rock_spire"], all, 2, 170);
  scatter(["steppe:bones"], all, 3, 120, { solid: false });
  scatter(["steppe:scrub"], all, 34, 100, { solid: false, s: [0.7, 1.2] });
  scatter(["steppe:grass_tuft"], all, 300, 60, { solid: false, s: [0.7, 1.4] });
  scatter(["flora:Birch"], { x0: -R + 400, x1: R - 400, y0: -R + 400, y1: R - 400 }, 6, 130, { keep: (x, y) => !inside(x / 1.25, y / 1.25) });

  // ---- the rim: woods west and east, scrub and grass on the mesas ----
  const rim = (x: number, y: number) => Math.abs(x) < R + 300 && Math.abs(y) < R + 300;
  f.woods({ x0: -AREA, x1: AREA, y0: R - 200, y1: AREA }, ["Pine", "Pine", "PineSmall", "Birch"], (x, y) => rim(x, y) || ground.kind(x, y) !== 0 || ground.kind(x + 250, y) !== 0 || ground.kind(x - 250, y) !== 0, { count: 170, spacing: 420 });
  f.woods({ x0: -AREA, x1: AREA, y0: -AREA, y1: -R + 200 }, ["Birch", "Birch", "PineSmall", "Pine", "AutumnTree"], (x, y) => rim(x, y) || ground.kind(x, y) !== 0 || ground.kind(x + 250, y) !== 0 || ground.kind(x - 250, y) !== 0, { count: 150, spacing: 440 });
  f.woods({ x0: R + 200, x1: AREA, y0: -AREA, y1: AREA }, ["PineSmall", "Birch"], rim, { count: 40, spacing: 700 });
  f.woods({ x0: -AREA, x1: -R - 200, y0: -AREA, y1: AREA }, ["PineSmall", "Birch", "AutumnTree"], rim, { count: 40, spacing: 700 });
  for (let i = 0; i < 260; i++) {
    const x = (f.rnd() * 2 - 1) * AREA, y = (f.rnd() * 2 - 1) * AREA;
    if (rim(x, y) || ground.kind(x, y) !== 0 || !f.level(x, y, 60)) continue;
    deco(i % 7 ? "steppe:grass_tuft" : "steppe:scrub", [x, y], f.rnd() * 360, 0.8 + f.rnd() * 0.6);
  }
  for (let i = 0; i < 24; i++) {
    const x = (f.rnd() * 2 - 1) * AREA, y = (f.rnd() * 2 - 1) * AREA;
    if (rim(x, y) || ground.kind(x, y) !== 0 || !f.level(x, y, 200)) continue;
    deco(i % 3 ? "steppe:boulder" : "steppe:rock_cluster", [x, y], f.rnd() * 360, 0.8 + f.rnd() * 0.5);
  }

  // ---- monsters: the open steppe and the mesa tops, not in the camp ----
  f.monsterSpots(ground, { x0: -R + 400, x1: R - 400, y0: -R + 400, y1: R - 400 }, {
    step: 720,
    keepOut: (x, y) => Math.hypot(x + 2400, y - 3300) < 1600 || Math.hypot(x + 3900, y - 2900) < 900 || Math.hypot(x + 3700, y - 1150) < 800,
  });

  const water = f.waterSheet({ x0: -4450, x1: -2950, y0: 550, y1: 1750 });
  const npcs: NpcSpec[] = [
    { id: "west_steppe_herder", x: -2000, y: 2850, face: 200, name: "ดอร์จ", title: "คนเลี้ยงม้า", role: "talk",
      look: { gender: "male", hair: "", hairColor: "amber", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ค่ายของพวกเราย้ายตามหญ้าไปทั้งปี ฤดูนี้มาตั้งริมแอ่งน้ำตรงนี้",
        "เนินบนผาทางเหนือคือสุสานหัวหน้าเผ่าโบราณ อย่าไปขุดเชียวนะ วิญญาณเขายังเฝ้าอยู่",
        "ตามทางไปทางตะวันออกก็ถึงประตูตะวันตกของทรุนราดา ทางตะวันตกเป็นป่าสนริมแม่น้ำ",
      ] },
    { id: "west_steppe_lookout", x: -3300, y: -3700, face: 30, name: "ซาราน", title: "คนเฝ้าหอดูทุ่ง", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "ink", eyes: "teal", top: "top_adventurer_teal", bottom: "bottom_adventurer_sand" },
      lines: [
        "จากบนนี้มองเห็นทั้งทุ่ง ฝูงหมาป่ามาทางไหนข้าเห็นก่อนใคร",
        "หินตั้งที่เรียงขึ้นมาตามทางนั่น คนโบราณวางไว้ชี้ทางขึ้นผานี้",
      ] },
  ];

  REPORT = () => fieldReport(f, ground);
  return f.finishField({
    ground,
    scenery: [water as THREE.Object3D],
    sky: "#8d955f",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0, density: 0.12 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -260, y: -4300 },
    npcs,
    labels: [
      { x: 2200, y: 2900, text: "เนินสุสานโบราณ" },
      { x: -2300, y: 2600, text: "ค่ายคนเลี้ยงม้า" },
      { x: -2300, y: -3000, text: "ผาหินตั้ง" },
      { x: -3500, y: -3250, text: "หอดูทุ่ง", kind: "small" },
      { x: 2500, y: -1900, text: "ทุ่งกองฟาง", kind: "small" },
      { x: -3700, y: 1150, text: "แอ่งน้ำ", kind: "small" },
      { x: -1900, y: -550, text: "แอ่งกระดูก", kind: "small" },
      { x: -300, y: -4900, text: "ทางไปทรุนราดา", kind: "gate" },
      { x: 250, y: 4900, text: "ทางไปป่าสนริมแม่น้ำ", kind: "gate" },
    ],
  });
}

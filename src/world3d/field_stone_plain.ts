// ที่ราบหินโบราณ (the plain of old stones), monsters Lv 50-60: stony ground east of Trunrada,
// between the town's east gate (west edge) and the road down to Kradia (south edge). A river
// comes down out of the north through a canyon cut between two plateaus and wanders off south-
// east across the plain. On the western plateau stands the great henge, the ring of standing
// stones older than any clan; on a high step of the eastern plateau a lone trilithon looks
// back at it over the canyon. A plank bridge crosses the river at the canyon's mouth to the
// ruins of an old camp. Rock, scrub and fallen stones everywhere; woods and plateaus close the
// edges.
//
// Full size around the origin (north +X, east -Y), scaled by TOWN_SCALE in finishField.

import * as THREE from "three";
import { FieldBuilder } from "./field";
import { useKits } from "./town";
import type { Town } from "./town";
import { KIT as STEPPE, SHAPES, smooth, band, densify, fieldReport } from "./kits/steppe";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as KRADIA } from "./kits/kradia";
import type { NpcSpec } from "../npcs";

useKits(STEPPE, TRUNRADA, KRADIA);

type XY = [number, number];

const R = 5500;
const AREA = 9300;

// ---- the ground's heights: the henge plateau (north-west), the east plateau and its high
// step, the canyon between them; scenery plateaus in the rim ----
const PLAT_H: XY[] = [[900, -300], [2000, -100], [3200, -350], [4400, -150], [5600, -350], [7000, -100], [8400, -300], [9900, -200], [9900, 9900], [1000, 9900], [700, 8000], [1100, 6400], [700, 5000], [1000, 3600], [800, 2000], [1100, 800]];
const PLAT_E: XY[] = [[600, -2400], [700, -3600], [500, -4700], [800, -5800], [500, -7200], [700, -9900], [9900, -9900], [9900, -2300], [8400, -2200], [7000, -2450], [5600, -2250], [4300, -2500], [3000, -2250], [1800, -2450]];
const STEP_E: XY[] = [[3000, -3300], [3100, -4500], [4000, -5100], [4900, -4600], [4800, -3500], [3900, -3100]];
const RIM_S: XY[] = [[-6000, 1400], [-6400, 2900], [-7800, 3500], [-9000, 2400], [-8200, 1200]];
const RIM_S2: XY[] = [[-6200, -900], [-7400, -700], [-8800, -1300], [-8600, -2800], [-7300, -3000], [-6100, -2200]];
const RIM_W: XY[] = [[-2000, 6300], [-3600, 6000], [-4600, 7000], [-4000, 8800], [-2400, 9100], [-1700, 7800]];
const RIM_SE: XY[] = [[-5000, -6300], [-6600, -5800], [-7800, -7000], [-7000, -8800], [-5200, -8900], [-4400, -7600]];
const RAMP_H = { top: [850, 2400] as XY, bottom: [-588, 2580] as XY, width: 480 };
const RAMP_E = { top: [627, -4000] as XY, bottom: [-1046, -3696] as XY, width: 480 };
const RAMP_STEP = { top: [3050, -3900] as XY, bottom: [2232, -3968] as XY, width: 420 };

const TERRAIN = {
  rock: "CliffSand",
  hills: [
    { x: -3000, y: 3200, r: 1600, h: 200 },
    { x: -3000, y: -1000, r: 1000, h: 150 },
    { x: -4300, y: 2000, r: 1100, h: -100 },
    { x: -200, y: 4300, r: 1100, h: 150 },
    { x: -4300, y: -3000, r: 1200, h: 180 },
    { x: -4700, y: -4700, r: 1100, h: 200 },
    { x: -1800, y: 3000, r: 800, h: 90 },
    { x: -4900, y: 4600, r: 1100, h: 170 },
    // the rim rolls on
    { x: -7600, y: -4000, r: 2400, h: 280 }, { x: -7600, y: 5600, r: 2400, h: 260 }, { x: -1200, y: 7800, r: 2000, h: 240 },
  ],
  plateaus: [
    { poly: densify(PLAT_H), h: 450, ramps: [RAMP_H] },
    { poly: densify(PLAT_E), h: 550, ramps: [RAMP_E] },
    { poly: densify(STEP_E), h: 800, ramps: [RAMP_STEP] },
    { poly: densify(RIM_S), h: 520 },
    { poly: densify(RIM_S2), h: 480 },
    { poly: densify(RIM_W), h: 480 },
    { poly: densify(RIM_SE), h: 460 },
  ],
};

// ---- the river and the tracks ----
const RIVER: XY[] = smooth([[AREA + 600, -1400], [8000, -1350], [6500, -1500], [5000, -1350], [3500, -1450], [2000, -1350], [900, -1450], [0, -1600], [-900, -2050], [-1800, -2900], [-2400, -4200], [-2800, -5600], [-3200, -7000], [-3500, -AREA - 600]], 250);
const BRIDGE: XY = [450, -1520];
const BRIDGE_H = -80.5; // the bridge's own X (its length) runs across the river
const MAIN: XY[] = smooth([[-1100, AREA + 200], [-1050, 6300], [-1000, 5150], [-1300, 4000], [-900, 3000], [-760, 2400], [-1500, 1500], [-2600, 1000], [-3500, 600], [-4400, 300], [-5150, 300], [-6300, 250], [-AREA - 200, 300]]);
const TO_HENGE: XY[] = smooth([[-780, 2600], [-588, 2580], [850, 2400], [1500, 2550], [2000, 2700], [2560, 2700]]);
const TO_CANYON: XY[] = smooth([[-1500, 1500], [-900, 600], [-200, -300], [300, -720], [1500, -760], [3000, -800], [4500, -720], [5700, -760], [AREA + 200, -760]]);
const TO_BRIDGE: XY[] = smooth([[300, -720], [360, -978]]);
const EAST_SIDE: XY[] = smooth([[540, -2062], [0, -2650], [-600, -3150], [-950, -3520]]);
const UP_EAST: XY[] = smooth([[-1350, -3640], [-1046, -3696], [627, -4000], [1500, -3950], [2232, -3968], [3050, -3900], [3550, -4000]]);
const TO_RUINS: XY[] = smooth([[-1150, -3750], [-1300, -4300], [-1450, -4650]]);

// the last build's own check (see fieldReport), for building the field; the game never calls it
export let REPORT: () => string[] = () => [];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(108, TERRAIN);
  const river = band(RIVER, 620);
  const ground = f.ground({
    area: { x0: -AREA, y0: -AREA, x1: AREA, y1: AREA },
    base: "steppe",
    roads: [band(MAIN, 520), band(TO_HENGE, 380), band(TO_CANYON, 400), band(TO_BRIDGE, 400), band(EAST_SIDE, 420), band(UP_EAST, 420), band(TO_RUINS, 380)],
    plazas: [],
    water: [river],
    road: [0.88, 0.8, 0.7],
  });
  f.blockBand(RIVER, 700, { gaps: [BRIDGE], gapR: 200 });

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
  const lineTaken = (pts: XY[], r: number) => {
    for (const p of pts) taken.push([p[0], p[1], r]);
  };
  lineTaken(RIVER, 380);

  // ---- the ways out: west to Trunrada's east gate, south to Kradia's north gate ----
  f.exit("trunrada", [-1000, 5150], [-1100, 4450]);
  f.exit("kradia", [-5150, 300], [-4450, 300]);
  put("trunrada:banner_pole", [-400, 4950], 0, 80);
  put("trunrada:banner_pole", [-1600, 4950], 0, 80);
  put("steppe:signpost", [-1700, 4350], 0, 60);
  put("trunrada:cairn", [-300, 4100], 0, 150);
  // Kradia's checkpoint by the road south
  put("kradia:banner_pole", [-4900, -250], 0, 80);
  put("kradia:banner_pole", [-4900, 850], 0, 80);
  put("kradia:arcane_lamp", [-4300, -200], 0, 60);
  put("kradia:arcane_lamp", [-4300, 800], 0, 60);
  put("kradia:barricade", [-4700, -900], 90, 180);
  put("kradia:barricade", [-4700, 1500], 90, 180);
  put("kradia:supplies", [-4000, 1300], 30, 180);
  put("steppe:signpost", [-3800, -300], 180, 60);
  taken.push([-1000, 5150, 500], [-5150, 300, 500]);

  // ---- the henge plateau ----
  put("steppe:great_henge", [3500, 2700], 0, 0);
  taken.push([3500, 2700, 1300], [2250, 3060, 120]);
  for (const [x, y] of [[1200, 1300], [1300, 3800], [4900, 1000], [4800, 4500], [2500, 4700], [2000, 600]] as XY[]) put("trunrada:standing_stone", [x, y], f.rnd() * 90, 80);
  put("steppe:fallen_menhir", [1800, 4200], 40, 260);
  put("steppe:stone_idol", [1700, 2050], 150, 70);
  put("steppe:stone_idol", [1700, 3250], 210, 70);
  put("steppe:rock_spire", [5000, 300], 30, 170);
  put("steppe:rock_cluster", [4900, 5000], 30, 230);
  // the scholar's camp by the henge
  put("trunrada:yurt_small", [1700, 1100], 200, 380);
  put("kradia:arcane_lamp", [1950, 1700], 0, 60);
  put("kradia:supplies", [1350, 1600], 60, 160);
  put("common:crate", [2150, 1350], 20, 50);

  // ---- the canyon: the west bank path, rocks on the east bank ----
  for (const [x, y, s] of [[1800, -1950, 0.8], [3300, -2000, 1], [4600, -1900, 0.7], [5200, -1950, 0.9]] as [number, number, number][]) put("steppe:boulder", [x, y], f.rnd() * 360, 160, s);
  put("steppe:rock_cluster", [3900, -1950], 20, 230, 0.8);
  put("steppe:fallen_log", [2200, -1950], 80, 200, 0.9);
  put("steppe:bones", [4000, -1000], 40, 0);

  // ---- the bridge at the canyon's mouth ----
  put("steppe:plank_bridge", BRIDGE, BRIDGE_H, 0);
  put("steppe:signpost", [-200, -1000], 100, 60);

  // ---- the east plateau and the gate of the sky on its step ----
  put("steppe:trilithon", [4100, -4150], -90, 260);
  put("steppe:stone_idol", [3600, -3550], -60, 70);
  put("steppe:stone_idol", [3600, -4650], -120, 70);
  put("steppe:rock_spire", [4600, -3600], 0, 170);
  put("trunrada:cairn", [4300, -4400], 0, 150);
  put("steppe:fallen_menhir", [1800, -3200], 80, 260);
  put("steppe:rock_spire", [1500, -5000], 60, 170);
  put("steppe:rock_cluster", [2700, -5100], 0, 230);
  put("trunrada:standing_stone", [1200, -4600], 0, 80);
  put("steppe:dead_tree", [2400, -2900], 300, 120);

  // ---- the old camp's ruins beyond the river ----
  const RX = -1500, RY = -4850;
  for (const [dx, dy, h, sy] of [[-400, -200, 0, 1], [-400, 200, 0, 1], [400, -200, 0, 1], [400, 250, 0, 0.75], [0, -400, 90, 2], [-250, 400, 90, 0.75]] as [number, number, number, number][])
    f.put("steppe:ruined_wall", [RX + dx, RY + dy], h, { sy });
  taken.push([RX, RY, 520]);
  put("steppe:fallen_menhir", [-250, -4650], 120, 260);
  put("steppe:stone_idol", [-600, -4300], 70, 70);
  put("trunrada:campfire", [RX - 50, RY - 50], 0, 0);
  put("steppe:trilithon", [-700, -5250], 100, 260);
  put("steppe:bones", [-1200, -5400], 60, 0);

  // ---- the plain: stones along the road, an avenue of idols ----
  for (const [x, y, h] of [[-2200, 1600, 30], [-2400, 700, 200], [-3300, 1250, 100], [-3600, -150, 260]] as [number, number, number][]) put("steppe:stone_idol", [x, y], h, 70);
  put("steppe:trilithon", [-3200, 3600], 60, 260);
  put("steppe:fallen_menhir", [-2600, 4200], 10, 260);
  put("steppe:fallen_menhir", [-4300, -1500], 130, 260);
  put("trunrada:standing_stone", [-1900, -200], 0, 80);
  put("trunrada:standing_stone", [-3800, 3400], 0, 80);
  put("steppe:ruined_wall", [-4500, 4000], 70, 0);
  put("steppe:ruined_wall", [-4300, 4370], 75, 0);
  put("steppe:dead_tree", [-1600, 3400], 60, 120);
  put("steppe:dead_tree", [-3800, -3800], 200, 120);
  put("steppe:dead_tree", [-900, -600], 120, 120);

  // ---- rock everywhere ----
  const all = { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 };
  scatter(["steppe:boulder"], all, 14, 160, { s: [0.7, 1.2] });
  scatter(["steppe:rock_cluster"], all, 10, 230, { s: [0.7, 1.1] });
  scatter(["steppe:boulder_flat"], all, 14, 180, { s: [0.7, 1.2] });
  scatter(["steppe:rock_spire"], all, 4, 170, { s: [0.8, 1.1] });
  scatter(["steppe:bones"], all, 3, 120, { solid: false });
  scatter(["steppe:scrub"], all, 30, 100, { solid: false, s: [0.6, 1.1] });
  scatter(["steppe:grass_tuft"], all, 240, 60, { solid: false, s: [0.6, 1.2] });
  scatter(["common:rock_small"], all, 60, 40, { solid: false, s: [1.2, 2.4] });

  // ---- the rim: pines and birches south, west and east of the river; rock on the plateaus ----
  const rim = (x: number, y: number) => Math.abs(x) < R + 300 && Math.abs(y) < R + 300;
  f.woods({ x0: -AREA, x1: AREA, y0: -AREA, y1: AREA }, ["Pine", "PineSmall", "Birch", "Pine", "AutumnTree"], (x, y) =>
    rim(x, y) || ground.kind(x, y) !== 0 || ground.kind(x + 250, y) !== 0 || ground.kind(x - 250, y) !== 0 || ground.kind(x, y + 250) !== 0 || ground.kind(x, y - 250) !== 0 || (x > 600 && f.h(x, y) > 300 && f.rnd() < 0.6), { count: 300, spacing: 440 });
  for (let i = 0; i < 300; i++) {
    const x = (f.rnd() * 2 - 1) * AREA, y = (f.rnd() * 2 - 1) * AREA;
    if (rim(x, y) || ground.kind(x, y) !== 0 || !f.level(x, y, 80)) continue;
    const r = f.rnd();
    deco(r < 0.55 ? "steppe:grass_tuft" : r < 0.75 ? "steppe:scrub" : r < 0.9 ? "steppe:boulder" : "steppe:rock_cluster", [x, y], f.rnd() * 360, 0.7 + f.rnd() * 0.6);
  }

  // ---- monsters: the plain, the canyon, both plateaus and the ruins ----
  f.monsterSpots(ground, { x0: -R + 400, x1: R - 400, y0: -R + 400, y1: R - 400 }, {
    step: 880,
    keepOut: (x, y) => Math.hypot(x + 4600, y - 300) < 1400,
  });

  const water = f.waterSheet({ x0: -AREA - 600, x1: AREA + 600, y0: -AREA - 600, y1: 0 }, -14, "WaterSea");
  const npcs: NpcSpec[] = [
    { id: "stone_plain_scholar", x: 1900, y: 2300, face: 0, name: "อาร์เซน", title: "นักปราชญ์จากคราเดีย", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "violet", eyes: "violet", top: "top_priestess_black", bottom: "bottom_priestess_black" },
      lines: [
        "วงหินนี้เก่ากว่าทรุนราดา เก่ากว่าคราเดีย อักษรบนหินยังเรืองแสงอยู่เลย",
        "ข้าว่าคนโบราณใช้วงหินนี้นับฤดูกาล หรือไม่ก็เรียกอะไรบางอย่างลงมาจากฟ้า",
        "ซุ้มหินบนผาฝั่งโน้นหันหน้ามาทางนี้พอดี ข้ายังข้ามไปดูไม่ได้เพราะมอนสเตอร์ชุม",
      ] },
    { id: "stone_plain_scout", x: -4250, y: 950, face: -90, name: "ไคลน์", title: "ทหารลาดตระเวนคราเดีย", role: "talk",
      look: { gender: "male", hair: "", hairColor: "blue", eyes: "violet", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "ทางนี้ลงใต้ไปถึงประตูเหนือของคราเดีย",
        "ข้ามสะพานที่ปากหุบผาไปแล้วระวังด้วย ซากค่ายเก่าฝั่งนั้นมีของไม่ดีอยู่",
      ] },
  ];

  REPORT = () => fieldReport(f, ground);
  return f.finishField({
    ground,
    scenery: [water as THREE.Object3D],
    sky: "#8d8a68",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0, density: 0.08 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -1150, y: 4300 },
    npcs,
    labels: [
      { x: 2100, y: 2700, text: "วงหินมหึมาโบราณ" },
      { x: 3000, y: -750, text: "หุบผาแม่น้ำ" },
      { x: 300, y: -1300, text: "สะพานไม้", kind: "small" },
      { x: 3500, y: -4000, text: "ประตูหินแห่งฟ้า" },
      { x: -1500, y: -4450, text: "ซากค่ายโบราณ", kind: "small" },
      { x: -4300, y: 300, text: "ด่านคราเดีย", kind: "small" },
      { x: -1000, y: 4900, text: "ทางไปทรุนราดา", kind: "gate" },
      { x: -4900, y: 300, text: "ทางไปคราเดีย", kind: "gate" },
    ],
  });
}

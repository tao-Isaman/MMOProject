// แนวป้องกันชายแดน (the border line), east of Kradia: the old battlefield where Kradia's army
// held the demons back (monsters Lv 70-85). A wide valley between two mountain walls (north and
// south), crossed from west to east by the road from Kradia's east gate to the demon lands:
//   - in the west, Kradia's line: two earthen ramparts (2.6 m) with a breach between them where
//     the road runs through a checkpoint of barricades, tents and a veteran; ballistae and
//     stakes along the ramparts, ramps up their backs;
//   - an old trench (a ditch of hollows) across the valley in front of it;
//   - the battlefield proper: scorched ground, wrecked catapults, stakes and broken weapons;
//     on the north side the bastion (4.6 m) with the ruined watchtower, on the south side the
//     old forward line (2.3 m), both with ramps;
//   - in the east the ground turns black and purple: blight, dead trees, the first dark
//     crystals and glowing cracks, the way on to the demon lands;
//   - (v0.4) a track south off the one to the old forward line, over the battlefield's west end
//     and through a pass in the south wall to the burnt villages.
// Full size, north +X, west +Y; finishField scales it by TOWN_SCALE.

import * as THREE from "three";
import { FieldBuilder } from "./field";
import { useKits, colourways } from "./town";
import type { Town } from "./town";
import type { Poly } from "./paved";
import { KIT as FRONTIER, subdiv, BLIGHT, DARK_ROCK, chaikin, bandPoly, distToPath, rampOff, nearRamp, insidePoly } from "./kits/frontier";
import type { XY } from "./kits/frontier";
import { KIT as KRADIA } from "./kits/kradia";
import type { NpcSpec } from "../npcs";

useKits(FRONTIER, KRADIA);
colourways({ frontier_blight: BLIGHT, frontier_dark: DARK_ROCK });

const R = 5500;
const A = 9000;

// ---- the raised ground ----
// the mountain walls either side of the valley (scenery: no way up)
const NWALL: XY[] = [[4700, A], [4950, 3800], [4800, 2400], [5150, 1200], [4650, 0], [4900, -1400], [5250, -3000], [4800, -4500], [4900, -A], [A, -A], [A, A]];
// (v0.4: the south wall cut by the pass to the burnt villages, its part east of it on its own,
// SWALL_E below)
const SWALL: XY[] = [[-4800, A], [-A, A], [-A, 1350], [-4912, 1350], [-5150, 2300], [-4850, 3900]];
// Kradia's line: two ramparts with a bastion bump each, the breach between them
const WLN: XY[] = [[1000, 2500], [2500, 2420], [2700, 2100], [3300, 2100], [3500, 2420], [4300, 2450], [4350, 3400], [1000, 3450]];
const WLS: XY[] = [[-600, 2500], [-600, 3450], [-4300, 3400], [-4350, 2450], [-2900, 2450], [-2700, 2150], [-2100, 2150], [-1900, 2450]];
// the bastion with the ruined tower, and the old forward line
const BASTION: XY[] = [[4150, 900], [4250, -900], [3100, -1550], [1950, -1000], [1700, 250], [2400, 1150], [3500, 1250]];
const FWD: XY[] = [[-1150, -800], [-1050, -2050], [-2000, -2350], [-3300, -2150], [-4200, -2250], [-4300, -1300], [-3200, -650]];

const R_WLN = rampOff([4350, 3400], [1000, 3450], 0.45, 860, 440, [2600, 2900]);
const R_WLS = rampOff([-4300, 3400], [-600, 3450], 0.55, 860, 440, [-2400, 2900]);
const R_BASTION = rampOff([1950, -1000], [1700, 250], 0.55, 1450, 460, [3000, 0]);
const R_FWD = rampOff([-1150, -800], [-1050, -2050], 0.5, 820, 440, [-2500, -1500]);
const R_FWD2 = rampOff([-3200, -650], [-1150, -800], 0.4, 820, 420, [-2500, -1500]);
const RAMPS = [R_WLN, R_WLS, R_BASTION, R_FWD, R_FWD2];

const TOWER: XY = [3150, 0];
const CHECK: XY = [200, 3900]; // the checkpoint behind the breach
const WEST_EXIT: XY = [300, 5150], WEST_BACK: XY = [270, 4450];
const EAST_EXIT: XY = [-200, -5150], EAST_BACK: XY = [-160, -4450];

// ---- v0.4: the way south to the burnt villages, through a pass in the south wall, where the
// villages' own way out is ----
const SWALL_E: XY[] = [[-A, 450], [-4797, 450], [-5050, -900], [-4700, -2400], [-5200, -3600], [-4900, -A], [-A, -A]];
const SOUTH_EXIT: XY = [-5150, 900], SOUTH_BACK: XY = [-4450, 900];
const TO_VILLAGES: XY[] = chaikin([[-1500, 250], [-2200, 600], [-3100, 750], [-4000, 850], [-4600, 900], SOUTH_EXIT, [-A - 200, 900]], 3);

export function build(_quality: { flowers: number }): Town {
  // the old trench: a ditch of hollows across the valley in front of the line
  const trench = Array.from({ length: 16 }, (_, i) => {
    const x = -4300 + i * 573;
    return { x, y: 1800 + 90 * Math.sin(x / 700), r: 430, h: -120 };
  });
  const f = new FieldBuilder(110, {
    hills: [
      ...trench,
      { x: -2600, y: 400, r: 1300, h: 150 }, { x: 3000, y: -3200, r: 1500, h: 190 }, { x: -3000, y: -3800, r: 1400, h: 160 },
      { x: 1300, y: -2300, r: 900, h: -130 }, { x: -800, y: 600, r: 600, h: -110 }, { x: 2600, y: 4300, r: 1100, h: 140 },
      { x: -2600, y: 4500, r: 1000, h: 120 }, { x: 900, y: -4300, r: 900, h: -100 }, { x: -1500, y: -3500, r: 700, h: -90 },
      { x: 3900, y: 1700, r: 600, h: -90 },
    ],
    plateaus: [
      { poly: subdiv(NWALL), h: 650 },
      { poly: subdiv(SWALL), h: 600 },
      { poly: subdiv(WLN), h: 260, ramps: [R_WLN] },
      { poly: subdiv(WLS), h: 260, ramps: [R_WLS] },
      { poly: subdiv(BASTION), h: 460, ramps: [R_BASTION] },
      { poly: subdiv(FWD), h: 230, ramps: [R_FWD, R_FWD2] },
      { poly: subdiv(SWALL_E), h: 600 }, // v0.4
    ],
    rock: "Frontier_CliffEarth",
  });
  const { put, rnd } = f;

  // ---- tracks ----
  const MAIN = chaikin([[300, A], [300, 5300], [260, 4600], [120, 3900], [80, 3200], [200, 2500], [0, 1800], [250, 1100], [150, 300], [-100, -400],
    [80, -1200], [-150, -2100], [200, -3000], [100, -3900], [-150, -4600], [-200, -5300], [-200, -A]], 3);
  const TO_WLN = chaikin([[250, 4550], [1000, 4500], [2000, 4400], R_WLN.bottom], 2);
  const ON_WLN = chaikin([R_WLN.top, [2850, 3000], [2900, 2850]], 1);
  const TO_WLS = chaikin([[200, 4500], [-800, 4420], [-1600, 4380], R_WLS.bottom], 2);
  const ON_WLS = chaikin([R_WLS.top, [-2300, 3000], [-2350, 2900]], 1);
  const TO_BASTION = chaikin([[-60, -360], [200, -500], R_BASTION.bottom], 1);
  const ON_BASTION = chaikin([R_BASTION.top, [2300, -250], [2700, -150]], 1);
  const TO_FWD = chaikin([[60, -1250], R_FWD.bottom], 1);
  const ON_FWD = chaikin([R_FWD.top, [-1800, -1450], [-2500, -1450], [-3300, -1350], R_FWD2.top], 2);
  const TO_FWD2 = chaikin([[150, 300], [-700, 350], [-1500, 250], R_FWD2.bottom], 2);
  const RAMP_PATHS: XY[][] = RAMPS.map((r) => [r.bottom, r.top]);
  const PATHS = [MAIN, TO_WLN, ON_WLN, TO_WLS, ON_WLS, TO_BASTION, ON_BASTION, TO_FWD, ON_FWD, TO_FWD2, ...RAMP_PATHS, TO_VILLAGES];
  const roads: Poly[] = [
    bandPoly(MAIN, 500, 70), bandPoly(TO_WLN, 400, 40), bandPoly(ON_WLN, 380), bandPoly(TO_WLS, 400, 40), bandPoly(ON_WLS, 380),
    bandPoly(TO_BASTION, 420), bandPoly(ON_BASTION, 400), bandPoly(TO_FWD, 400), bandPoly(ON_FWD, 380, 40), bandPoly(TO_FWD2, 400, 40),
    ...RAMPS.map((r) => bandPoly([r.bottom, r.top], r.width - 40)),
    bandPoly(TO_VILLAGES, 420, 50),
  ];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], base: "steppe", road: [0.8, 0.7, 0.6] });
  // trampled, burnt grass: the steppe browned and greyed
  (ground.mesh.material as THREE.MeshStandardMaterial).color.set("#b6a892");

  const onTrack = (x: number, y: number, m: number) => PATHS.some((p) => distToPath(p, x, y) < m);
  const near = (p: XY, x: number, y: number, r: number) => Math.hypot(p[0] - x, p[1] - y) < r;
  const raised = [WLN, WLS, BASTION, FWD];
  const onRaised = (x: number, y: number) => raised.some((p) => insidePoly(p, x, y));
  // a prop only where the ground is level for it (never across a cliff edge)
  const at = (ref: string, p: XY, h: number, r: number, o: Parameters<typeof put>[3] = {}) => {
    if (f.level(p[0], p[1], r)) put(ref, p, h, o);
  };
  const deadTree = (p: XY, s: number) => put("frontier:dead_tree", p, rnd() * 360, { s, solid: [{ kind: "tree", x: 0, y: 0, r: 40 }] });

  // ---- the ways out ----
  f.exit("kradia", WEST_EXIT, WEST_BACK);
  put("kradia:banner_pole", [-120, 5000], -90);
  put("kradia:banner_pole", [720, 5000], -90);
  put("frontier:signpost", [780, 4650], -90);
  f.exit("demon_land", EAST_EXIT, EAST_BACK);
  put("frontier:dark_crystal", [-800, -5050], 30, { s: 0.6 });
  put("frontier:dark_crystal", [450, -5100], 200, { s: 0.55 });
  put("frontier:signpost", [400, -4650], 90);
  put("frontier:dead_tree", [-1100, -4700], 40, { s: 0.9, solid: [{ kind: "tree", x: 0, y: 0, r: 40 }] });
  // v0.4: the way out south to the burnt villages
  f.exit("burnt_villages", SOUTH_EXIT, SOUTH_BACK);
  put("frontier:signpost", [-4650, 1500], 0);

  // ---- the checkpoint behind the breach ----
  for (const [x, y] of [[-450, 2380], [-450, 2100], [780, 2380], [820, 2100]] as XY[]) put("kradia:barricade", [x, y], 90 + (rnd() - 0.5) * 10);
  put("kradia:banner_pole", [-250, 3350], -90);
  put("kradia:banner_pole", [560, 3350], -90);
  put("kradia:brazier", [-260, 3700], 0);
  put("kradia:brazier", [580, 3700], 0);
  put("frontier:army_tent", [-450, 4250], 0);
  put("frontier:army_tent", [-400, 3750], 0);
  put("kradia:supplies", [850, 4150], 30);
  put("kradia:weapon_rack", [880, 3800], -90);
  put("frontier:campfire", [-1100, 3950], 0, { solid: [{ kind: "fire", x: 0, y: 0, r: 95 }] });
  put("kradia:catapult", [1350, 4000], 90);

  // ---- the ramparts: ballistae on the bumps, stakes along the east lips ----
  at("kradia:ballista", [3000, 2650], 90, 200);
  at("kradia:ballista", [-2400, 2680], 90, 200);
  for (const x of [1350, 1750, 2150, 3800, 4150]) at("frontier:stake_row", [x, 2790], 90 + (rnd() - 0.5) * 6, 180);
  for (const x of [-850, -1250, -1650, -3150, -3550, -3950]) at("frontier:stake_row", [x, 2790], 90 + (rnd() - 0.5) * 6, 180);
  for (const x of [2850, 3150]) at("frontier:stake_row", [x, 2310], 90, 160, { s: 0.75 });
  for (const x of [-2250, -2550]) at("frontier:stake_row", [x, 2360], 90, 160, { s: 0.75 });
  at("kradia:brazier", [3300, 2600], 0, 100);
  at("kradia:brazier", [-2100, 2600], 0, 100);
  at("kradia:banner_pole", [1300, 3200], -90, 80);
  at("kradia:banner_pole", [-3900, 3200], -90, 80);
  at("kradia:supplies", [3700, 3150], 0, 140);
  at("kradia:supplies", [-1100, 3150], 90, 140);

  // ---- the bastion and its ruined tower ----
  put("frontier:ruined_tower", TOWER, 14);
  at("frontier:catapult_wreck", [2450, 700], 120, 280);
  at("kradia:ballista", [3800, -700], 90, 200);
  at("frontier:battle_relics", [2350, -850], 30, 200);
  at("frontier:rubble_pile", [3700, 600], 60, 200);
  at("frontier:rubble_pile", [2700, -1100], 200, 200);
  at("frontier:scorch_mark", [3300, -900], 40, 260);
  at("frontier:stake_row", [3400, -1250], 120, 230);
  at("frontier:grass_tuft", [2200, 400], 0, 80);
  at("frontier:grass_tuft", [3900, 200], 0, 80);

  // ---- the old forward line ----
  for (const [x, y, h] of [[-1500, -1800, 80], [-2400, -1850, 96], [-3200, -1750, 88], [-3900, -1800, 94]] as number[][]) at("frontier:stake_row", [x, y], h, 200);
  at("frontier:catapult_wreck", [-2700, -1000], 250, 280);
  at("frontier:battle_relics", [-3700, -1100], 0, 200);
  at("frontier:beast_bones", [-1900, -1150], 30, 330, { s: 0.85 });
  at("frontier:scorch_mark", [-2200, -1700], 0, 260);
  at("frontier:rubble_pile", [-3900, -1600], 40, 200);
  at("kradia:barricade", [-1500, -1100], 70, 160);

  // ---- no man's land: scorch, wrecks, broken stakes and weapons, the odd burnt tree ----
  const field: [string, XY, number, number][] = [
    ["frontier:catapult_wreck", [1500, 1100], 30, 1], ["frontier:catapult_wreck", [-1800, 1200], 160, 1], ["frontier:catapult_wreck", [1200, -3300], 300, 0.9],
    ["frontier:battle_relics", [-1000, 1300], 0, 1], ["frontier:battle_relics", [1300, 300], 120, 1], ["frontier:battle_relics", [-3800, 900], 60, 1],
    ["frontier:battle_relics", [-600, -2900], 200, 1], ["frontier:rubble_pile", [-3300, 1500], 0, 1], ["frontier:rubble_pile", [800, -1900], 90, 0.9],
    ["frontier:stake_row", [-2200, 1300], 80, 1], ["frontier:stake_row", [-3000, 2100], 100, 1], ["frontier:stake_row", [1700, 2050], 95, 1],
    ["frontier:stake_row", [-1300, -300], 70, 1], ["kradia:barricade", [-3600, 300], 30, 1], ["kradia:barricade", [1100, -700], 100, 1],
    ["kradia:barricade", [3700, 1800], 80, 1], ["frontier:beast_bones", [-3400, -300], 200, 0.9], ["frontier:rock_cluster", [3800, 3800], 30, 0.9],
    ["frontier:boulder", [-3700, 4300], 0, 0.9], ["frontier:flat_rocks", [-4200, -400], 60, 1], ["frontier:boulder", [4100, -2400], 100, 0.8],
  ];
  for (const [ref, p, h, s] of field) if (distToPath(TO_VILLAGES, p[0], p[1]) > 400) at(ref, p, h, 220, { s }); // (v0.4: none left on the track south)
  for (let i = 0; i < 26; i++) {
    const x = -4300 + rnd() * 8600, y = -2600 + rnd() * 4800;
    if (onTrack(x, y, 400) || nearRamp(RAMPS, x, y, 200) || near(TOWER, x, y, 800)) continue;
    at("frontier:scorch_mark", [x, y], rnd() * 360, 240, { s: 0.7 + rnd() * 0.6 });
  }
  for (const p of [[-500, 2000], [2200, 1800], [-2800, -400], [600, -1500], [3400, 1700], [-4100, 1900]] as XY[]) if (!onTrack(p[0], p[1], 400) && f.level(p[0], p[1], 150)) deadTree(p, 0.7 + rnd() * 0.3);

  // ---- behind the line in the west: groves of red trees ----
  for (let x = -4600; x < 4600; x += 520)
    for (let y = 3600; y < R - 200; y += 520) {
      const px = x + (rnd() - 0.5) * 360, py = y + (rnd() - 0.5) * 360;
      if (onTrack(px, py, 450) || nearRamp(RAMPS, px, py, 260) || near(CHECK, px, py, 1300) || near(WEST_EXIT, px, py, 900) || !f.level(px, py, 200) || onRaised(px, py) || rnd() < 0.4) continue;
      const k = rnd();
      if (k < 0.4) put("frontier:red_maple", [px, py], rnd() * 360, { s: 0.7 + rnd() * 0.3, solid: [{ kind: "tree", x: 0, y: 0, r: 46 }] });
      else if (k < 0.8) put("flora:AutumnTree", [px, py], rnd() * 360, { s: 0.7 + rnd() * 0.3 });
      else put("frontier:red_bush", [px, py], rnd() * 360, { s: 0.7, solid: [{ kind: "bush", x: 0, y: 0, r: 60 }] });
    }

  // ---- the blighted east: dark patches thickening towards the demon lands, dead trees, the
  // first crystals and cracks ----
  for (let i = 0; i < 90; i++) {
    const x = -4600 + rnd() * 9200, y = -1800 - Math.pow(rnd(), 0.6) * 3900;
    if (onTrack(x, y, 200) || nearRamp(RAMPS, x, y, 150) || !f.level(x, y, 200) || onRaised(x, y)) continue;
    put("frontier:scorch_mark", [x, y], rnd() * 360, { s: 0.9 + rnd() * 0.8, colours: "frontier_blight" });
  }
  const east: [string, XY, number, number][] = [
    ["frontier:dark_crystal", [2400, -4300], 0, 0.6], ["frontier:dark_crystal", [-2700, -4600], 120, 0.5], ["frontier:dark_crystal", [3600, -2300], 60, 0.4],
    ["frontier:dark_crystal", [-3800, -3200], 200, 0.45], ["frontier:glow_crack", [1700, -4000], 20, 0.8], ["frontier:glow_crack", [-1500, -4300], 70, 0.7],
    ["frontier:glow_crack", [2600, -2900], 110, 0.6], ["frontier:beast_bones", [-2200, -3200], 140, 0.8], ["frontier:rock_cluster", [3700, -4300], 40, 0.7],
    ["frontier:boulder", [-3700, -4300], 0, 0.8], ["frontier:rubble_pile", [1100, -4700], 30, 0.9],
  ];
  for (const [ref, p, h, s] of east) at(ref, p, h, 260, { s, colours: ref.includes("rock") || ref.includes("boulder") ? "frontier_dark" : undefined });
  for (const p of [[2900, -3700], [-900, -3500], [1600, -2800], [-3300, -2700], [3900, -4800], [-4100, -4900], [700, -4500], [-2300, -5000], [2200, -5100], [3300, -1800]] as XY[]) {
    if (!onTrack(p[0], p[1], 400) && f.level(p[0], p[1], 150)) deadTree(p, 0.75 + rnd() * 0.35);
  }

  // ---- fallen rock and wreckage along the feet of the valley walls ----
  for (let y = -4800; y < 4800; y += 900) {
    for (const side of [1, -1]) {
      const x = side * (4250 + rnd() * 250), py = y + (rnd() - 0.5) * 500;
      if (onTrack(x, py, 400) || nearRamp(RAMPS, x, py, 200) || onRaised(x, py)) continue;
      const k = rnd(), ref = k < 0.45 ? "frontier:rock_cluster" : k < 0.75 ? "frontier:boulder" : k < 0.88 ? "frontier:rubble_pile" : "frontier:fallen_log";
      at(ref, [x, py], rnd() * 360, 200, { s: 0.6 + rnd() * 0.4, colours: py < -2500 && ref !== "frontier:fallen_log" ? "frontier_dark" : undefined });
    }
  }

  // ---- dry grass over the open ground ----
  for (let i = 0; i < 320; i++) {
    const x = -4700 + rnd() * 9400, y = -5300 + rnd() * 10600;
    if (onTrack(x, y, 300) || nearRamp(RAMPS, x, y, 120) || !f.level(x, y, 100)) continue;
    put("frontier:grass_tuft", [x, y], rnd() * 360, { s: 0.7 + rnd() * 0.6 });
  }

  // ---- the rim: red woods west, sparse trees on the mountain walls, dead woods east ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const road = (x: number, y: number) => distToPath(MAIN, x, y) < 480;
  f.woods({ x0: -A, x1: A, y0: R, y1: A }, ["red_maple"], (x, y) => inside(x, y) || road(x, y), { count: 90, spacing: 480, kit: "frontier" });
  f.woods({ x0: -A, x1: A, y0: R, y1: A }, ["AutumnTree", "AutumnTree", "Pine"], (x, y) => inside(x, y) || road(x, y), { count: 110, spacing: 420 });
  const south = (x: number, y: number) => distToPath(TO_VILLAGES, x, y) < 520; // v0.4: the pass kept clear
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["AutumnTree", "PineSmall", "Pine"], (x, y) => inside(x, y) || Math.abs(x) < 4700 || y < -2500 || south(x, y), { count: 160, spacing: 650 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: -2500 }, ["dead_tree", "dead_tree", "dark_crystal"], (x, y) => inside(x, y) || road(x, y), { count: 170, spacing: 520, kit: "frontier" });
  f.woods({ x0: 4800, x1: A, y0: -A, y1: A }, ["rock_cluster", "boulder"], inside, { count: 40, spacing: 900, kit: "frontier" });
  f.woods({ x0: -A, x1: -4800, y0: -A, y1: A }, ["rock_cluster", "boulder"], (x, y) => inside(x, y) || south(x, y), { count: 40, spacing: 900, kit: "frontier" });
  for (let i = 0; i < 70; i++) {
    const x = -A + rnd() * 2 * A, y = -A + rnd() * (A - R);
    if (road(x, y) || !f.level(x, y, 200)) continue;
    put("frontier:scorch_mark", [x, y], rnd() * 360, { s: 1.2 + rnd(), colours: "frontier_blight" });
  }

  // ---- monsters ----
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, {
    step: 760,
    keepOut: (x, y) => near(CHECK, x, y, 1500) || nearRamp(RAMPS, x, y, 120) || x > 4500 || x < -4500,
  });

  const veteran: NpcSpec = {
    id: "border_line_veteran", x: 640, y: 3480, face: -90, name: "โกรัน", title: "ทหารผ่านศึก · ผู้คุมด่านแนวหลัง", role: "talk",
    look: { gender: "male", hair: "", hairColor: "silver", eyes: "teal", top: "top_warrior", bottom: "bottom_warrior_cocoa" },
    lines: [
      "ยี่สิบปีก่อน กองทัพคราเดียยันพวกอสูรไว้ที่ทุ่งนี้สามวันสามคืน ซากเครื่องยิงหินพวกนั้นคือของฝ่ายเรา",
      "แนวหน้าเก่าทางใต้แตกในคืนที่สอง ทหารที่รอดถอยมาตั้งหลักที่กำแพงดินตรงนี้",
      "เลยหอคอยที่พังไปทางตะวันออก ดินจะเริ่มดำ อย่าเดินเข้าไปถ้ายังไม่พร้อม",
    ],
  };
  const scout: NpcSpec = {
    id: "border_line_scout", x: 2350, y: -420, face: -60, name: "ไอริส", title: "นักธนูสอดแนม", role: "talk",
    look: { gender: "female", hair: "twintail", hairColor: "gold", eyes: "amber", top: "top_adventurer_teal", bottom: "bottom_adventurer_cocoa" },
    lines: [
      "จากบนป้อมนี้ มองเห็นแสงม่วงของดินแดนอสูรได้ทุกคืน",
      "ผลึกมืดงอกออกมาไกลกว่าเมื่อปีก่อนอีกนะ มันกำลังกินแผ่นดินเข้ามาเรื่อยๆ",
      "ถ้าเจอรอยแยกเรืองแสง อย่าเข้าไปใกล้ ข้างล่างนั่นไม่มีก้น",
    ],
  };

  return f.finishField({
    ground,
    sky: "#463c36",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 280, y: 4250 },
    npcs: [veteran, scout],
    labels: [
      { x: 300, y: 4750, text: "ทางไปคราเดีย", kind: "gate" },
      { x: -180, y: -4750, text: "ทางไปดินแดนอสูร", kind: "gate" },
      { x: SOUTH_EXIT[0] + 250, y: SOUTH_EXIT[1], text: "ทางไปหมู่บ้านร้างชายแดน", kind: "gate" },
      { x: 150, y: 3000, text: "แนวป้องกันคราเดีย" },
      { x: 2600, y: 100, text: "ซากหอคอยรักษาการณ์" },
      { x: -2600, y: -1350, text: "แนวหน้าเก่า" },
      { x: -1400, y: 600, text: "สนามรบเก่า" },
      { x: -2400, y: 1700, text: "คูสนามเพลาะ", kind: "small" },
      { x: 600, y: -3700, text: "ผืนดินต้องสาป", kind: "small" },
    ],
  });
}

// แหลมแม่มด (witch_cape), monsters Lv 84-94: the cape that runs out into the sea south of the
// border woods, where nobody goes but the witch. The way in from the border woods (the middle
// of the north edge) comes down out of the red maples into a wood of twisted trees with the fog
// lying low between them, the sea closing in on both sides as the land narrows southward:
//   - west of the track, beside a black pool, the witch's crooked hut with her cauldron bubbling
//     green before it, dead trees hung with charms all round, pumpkins at her door;
//   - east, a rocky knoll (3.2 m) where the three-eyed crows roost in the dead trees over bones;
//   - south, a ramp up onto the cape itself (4 m), cliffs falling to the sea all round it, the
//     fog thick among its twisted trees, and on its tip a higher step (7.2 m) where a ring of
//     standing stones looks out over the sea from the edge of the cliffs.
// There is no way on from here: the sea east, south and west. Northward the twisted trees give
// way to the border woods' red maples.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   way out: north (the middle, where the border woods' south way out is) -> border_woods

import * as THREE from "three";
import { FieldBuilder } from "./field";
import { useKits } from "./town";
import type { Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import { KIT as EAST, smooth, band, inPoly, distTo, every, blob, inland, faceDir, faceTo, bevel, seaSheet, COAST, CIRCLE_STONES } from "./kits/eastcoast";
import type { XY, Poly } from "./kits/eastcoast";
import { KIT as FRONTIER } from "./kits/frontier";
import { KIT as KRADIA } from "./kits/kradia";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as STEPPE } from "./kits/steppe";
import { KIT as WESTMOUNT } from "./kits/westmount";
import { KIT as PLAINS } from "./kits/plains";

useKits(EAST, FRONTIER, KRADIA, TRUNRADA, STEPPE, WESTMOUNT, PLAINS);

const R = 5500; // the walkable bounds, +-R
const A = 9000; // the ground's area, +-A

// ---- the coast: from the far north-west down the west side, round the tip, up the east side
// (the land on its left) ----
const SHORE: XY[] = smooth([
  [9500, 5600], [7000, 5450], [5500, 5000], [4000, 4500], [2500, 3900], [1000, 3300], [-500, 2700], [-2000, 2200], [-3200, 1700], [-4200, 1100],
  [-4800, 300], [-4700, -600], [-4000, -1400], [-2800, -2000], [-1500, -2600], [0, -3200], [1500, -3800], [3000, -4400], [4500, -5000],
  [5500, -5300], [7000, -5600], [9500, -5750],
], 4);
const SEA: Poly = [...SHORE, [9500, -9500], [-9500, -9500], [-9500, 9500], [9500, 9500]];

// ---- the levels: C1 the cape (4 m) and C2 its tip (7.2 m); the crows' knoll (3.2 m) ----
const C1: Poly = bevel([
  [-200, 2350], [300, 1200], [0, 0], [400, -1300], [300, -2650], [-1400, -2250], [-2700, -1650], [-3800, -1100], [-4450, -550], [-4550, 300],
  [-3950, 900], [-3000, 1400], [-1900, 1900], [-900, 2250],
]);
const C2: Poly = [[-2950, 450], [-3500, 1000], [-4150, 550], [-4150, -300], [-3650, -900], [-3000, -550]];
const KNOLL: Poly = bevel([[4300, -1800], [3300, -1600], [2500, -2300], [2700, -3300], [3700, -3600], [4500, -2900]]);
const RAMP_C1 = { top: [150, 600] as XY, bottom: [1217, 336] as XY, width: 460 };
const RAMP_C2 = { top: [-2975, -50] as XY, bottom: [-1975, -100] as XY, width: 420 };
const RAMP_K = { top: [3800, -1700] as XY, bottom: [4020, -622] as XY, width: 420 };

// ---- the tracks ----
const N_EXIT: XY = [5150, 0];
const J: XY = [2500, 250];
const NROAD = smooth([[A + 200, 0], N_EXIT, [4300, -100], [3300, 100], J]);
const HUT: XY = [2150, 2650];
const TO_HUT = smooth([J, [2350, 1100], [2250, 1800], [2200, 2100]]);
const TO_CAPE = [...smooth([J, [1800, 420], RAMP_C1.bottom]), RAMP_C1.top, ...smooth([[-700, 650], [-1500, 300], RAMP_C2.bottom]), RAMP_C2.top, ...smooth([[-3250, -30], [-3350, -20]])];
const TO_KNOLL = [...smooth([[3300, 100], [3900, -150], RAMP_K.bottom]), RAMP_K.top, ...smooth([[3500, -2300], [3350, -2650]])];

const POOL: XY = [3350, 2200];
const CIRCLE: XY = [-3600, 50];

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(525, {
    hills: [
      { x: 1500, y: -1600, r: 1100, h: 120 }, { x: 4400, y: 2600, r: 1000, h: 110 }, { x: 900, y: 2200, r: 700, h: 80 },
      { x: -1800, y: -600, r: 700, h: 60 }, { x: 3600, y: 1000, r: 600, h: -60 },
      // the border woods' ground rolling on past the north edge
      { x: 7600, y: 0, r: 3000, h: 220 },
    ],
    plateaus: [
      { poly: C1, h: 400, ramps: [RAMP_C1] },
      { poly: C2, h: 720, ramps: [RAMP_C2] },
      { poly: KNOLL, h: 320, ramps: [RAMP_K] },
    ],
    rock: COAST.cliffDark,
  });
  const { put, rnd } = f;

  // ---- the ground: dark moss, tracks, the black pool, the sea ----
  const POOLP = blob(POOL, 600, 440, 7, 22);
  const roads = [band(NROAD, 460), band(TO_HUT, 380), band(TO_CAPE, 400), band(TO_KNOLL, 360)];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: [SEA, POOLP], base: "moss", road: [0.7, 0.64, 0.58] });
  (ground.mesh.material as THREE.MeshStandardMaterial).color.set("#d9b48c");

  // ---- the water: the sea out past the horizon, the black pool; both closed ----
  const sea = seaSheet([...inland(SHORE, 200), [9500, -30000], [-30000, -30000], [-30000, 30000], [9500, 30000]]);
  const pool = f.waterSheet({ x0: POOL[0] - 800, x1: POOL[0] + 800, y0: POOL[1] - 700, y1: POOL[1] + 700 }, -16, "Eastcoast_BlackWater");
  f.blockBand(inland(SHORE.filter(([x, y]) => Math.abs(x) < R + 900 && Math.abs(y) < R + 900), -280), 520, { kind: "sea" });
  f.blockDisc(POOL, 420);
  for (const [x, y] of POOLP) f.blockDisc([x + (POOL[0] - x) * 0.15, y + (POOL[1] - y) * 0.15], 150);

  // ---- the way out ----
  f.exit("border_woods", N_EXIT, [4450, -20]);

  // ---- placing things clear of each other, the tracks and the water ----
  const taken: [number, number, number][] = [[N_EXIT[0], N_EXIT[1], 650]];
  const onTrack = (x: number, y: number, m: number) => [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const free = (x: number, y: number, r: number) => !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r);
  const wet = (x: number, y: number, m: number) => inPoly(SEA, x, y) || distTo(SHORE, x, y) < m || Math.hypot((x - POOL[0]) / 1.2, y - POOL[1]) < 560 + m;
  const fits = (x: number, y: number, r: number, m = r) => f.level(x, y, r) && !onTrack(x, y, m) && free(x, y, r) && !wet(x, y, r + 100);
  const place = (ref: string, at: XY, h: number, r: number, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    taken.push([at[0], at[1], r]);
  };
  const tryPlace = (ref: string, at: XY, h: number, r: number, o: Parameters<typeof put>[3] = {}) => {
    if (!fits(at[0], at[1], r)) return false;
    place(ref, at, h, r, o);
    return true;
  };
  const ring = (r: number, kind = "rock"): SolidSpec[] => [{ kind, x: 0, y: 0, r }];
  const inBox = (x: number, y: number, m = 0) => Math.abs(x) < R - m && Math.abs(y) < R - m;

  // ---- the way out: Kradia's patrol left a warning ----
  place("kradia:banner_pole", [5000, -600], 180, 60, { solid: ring(20, "post") });
  place("frontier:signpost", [4650, 560], faceDir(-1, 0), 60, { solid: ring(25, "post") });
  place("kradia:barricade", [4700, -1150], 100, 260);

  // ---- the witch's hut by the black pool, her cauldron, her charms ----
  const hutH = faceTo(HUT, [2200, 1700]);
  place("eastcoast:witch_hut", HUT, hutH, 480, { solid: [{ kind: "building", x: 0, y: 0, w: 500, d: 440, rot: 0 }, { kind: "porch", x: -300, y: 0, w: 160, d: 260, rot: 0 }] });
  const front = (d: number, side: number): XY => {
    const a = ((hutH + 180) * Math.PI) / 180;
    return [HUT[0] + Math.cos(a) * d - Math.sin(a) * side, HUT[1] + Math.sin(a) * d + Math.cos(a) * side];
  };
  place("eastcoast:cauldron", front(650, 260), 0, 130, { solid: ring(80, "fire") });
  place("eastcoast:charm_tree", front(500, -420), rnd() * 360, 150, { solid: ring(30, "tree") });
  place("eastcoast:charm_tree", [3000, 3200], rnd() * 360, 150, { s: 0.9, solid: ring(30, "tree") });
  place("eastcoast:charm_tree", [2650, 1350], rnd() * 360, 150, { s: 0.85, solid: ring(30, "tree") });
  place("eastcoast:charm_tree", [1450, 2200], rnd() * 360, 150, { solid: ring(30, "tree") });
  place("eastcoast:low_fog", [3400, 2900], 30, 1, { solid: "none" });
  place("eastcoast:low_fog", [1500, 3000], 120, 1, { s: 0.8, solid: "none" });
  for (const at of [front(800, -150), [2900, 2650], [1700, 2900]] as XY[]) tryPlace("westmount:glow_mushrooms", at, rnd() * 360, 90, { solid: "none" });
  // reeds and dead branches round the pool
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2, at: XY = [POOL[0] + Math.cos(a) * 760, POOL[1] + Math.sin(a) * 570];
    if (!onTrack(at[0], at[1], 120) && f.level(at[0], at[1], 80) && free(at[0], at[1], 60)) put(k % 3 ? "plains:reeds" : "frontier:dead_tree", at, rnd() * 360, { s: k % 3 ? 0.8 : 0.5, solid: k % 3 ? "none" : ring(30, "tree") });
  }

  // ---- the crows' knoll: dead trees, bones, a cairn of skulls ----
  for (const [at, h, s] of [[[3700, -2600], 20, 1.1], [[3100, -2200], 160, 0.9], [[3300, -3100], 280, 0.8]] as [XY, number, number][]) tryPlace("frontier:dead_tree", at, h, 160, { s, solid: ring(40, "tree") });
  for (const [ref, at, h] of [["frontier:beast_bones", [3900, -2200], 30], ["steppe:bones", [2900, -2700], 120], ["trunrada:cairn", [4000, -3000], 0], ["eastcoast:charm_tree", [3500, -3400], 90]] as [string, XY, number][])
    tryPlace(ref, at, h, 200, { solid: ref.includes("bones") ? "none" : ring(60) });

  // ---- the cape: twisted trees in the fog, old stones; the ring of stones on the tip ----
  place("eastcoast:sea_stone_circle", CIRCLE, faceTo(CIRCLE, RAMP_C2.top), 520, {
    s: 0.82,
    solid: CIRCLE_STONES.map(([x, y]): SolidSpec => ({ kind: "rock", x, y, r: 70 })).concat([{ kind: "rock", x: -490, y: -130, r: 55 }, { kind: "rock", x: -490, y: 130, r: 55 }, { kind: "altar", x: 0, y: 0, w: 240, d: 150, rot: 0 }]),
  });
  for (const at of [[-1200, 900], [-2300, -900], [-600, -1700], [-2600, 1200]] as XY[]) tryPlace("eastcoast:low_fog", at, rnd() * 360, 1, { solid: "none" });
  for (const [ref, at, h] of [["trunrada:standing_stone", [-1000, -400], 20], ["trunrada:standing_stone", [-1300, 1400], -30], ["frontier:dead_tree", [-2200, 1400], 80], ["eastcoast:charm_tree", [-2600, -800], 0], ["eastcoast:shore_rocks", [-200, -2000], 60]] as [string, XY, number][])
    tryPlace(ref, at, h, 200, { solid: ring(ref.endsWith("rocks") ? 150 : 50) });

  // ---- the twisted wood all over, thicker in the north where the border woods' maples still
  // stand among them; dead leaves, bushes and rocks beneath ----
  const GLADES: [number, number, number][] = [[HUT[0], HUT[1], 1000], [POOL[0], POOL[1], 900], [-1600, 300, 800], [700, -1900, 700], [3600, -2600, 700], [CIRCLE[0], CIRCLE[1], 800], [1700, 1100, 600], [-2600, -300, 600]];
  const keep = (x: number, y: number) => onTrack(x, y, 400) || wet(x, y, 280) || Math.hypot(x - HUT[0], y - HUT[1]) < 850 || inPoly(C2, x, y) || (x < HUT[0] && x > HUT[0] - 1500 && Math.abs(y - HUT[1]) < 700);
  for (let x = -R + 260; x < R; x += 540)
    for (let y = -R + 260; y < R; y += 540) {
      const px = x + (rnd() - 0.5) * 380, py = y + (rnd() - 0.5) * 380;
      if (!inBox(px, py, 150) || keep(px, py) || !f.level(px, py, 200) || !free(px, py, 200)) continue;
      const glade = GLADES.some(([gx, gy, gr]) => Math.hypot(gx - px, gy - py) < gr);
      if (glade ? rnd() < 0.85 : rnd() < 0.3) continue;
      const north = Math.max(0, Math.min(1, (px - 2500) / 2600)), k = rnd();
      const kind = k < north * 0.5 ? "frontier:red_maple" : k < north * 0.65 ? "flora:AutumnTree" : k < 0.85 ? "eastcoast:twisted_tree" : "frontier:dead_tree";
      place(kind, [px, py], rnd() * 360, 200, { s: 0.75 + rnd() * 0.35, solid: kind.startsWith("flora:") ? "auto" : ring(kind.endsWith("red_maple") ? 48 : 40, "tree") });
    }
  for (let x = -R + 200; x < R; x += 440)
    for (let y = -R + 200; y < R; y += 440) {
      const px = x + (rnd() - 0.5) * 340, py = y + (rnd() - 0.5) * 340;
      if (!inBox(px, py, 100) || onTrack(px, py, 260) || wet(px, py, 180) || !f.level(px, py, 150) || !free(px, py, 70)) continue;
      const k = rnd();
      if (k < 0.32) put("frontier:leaf_litter", [px, py], rnd() * 360, { s: 0.7 + rnd() * 0.5, solid: "none" });
      else if (k < 0.48) put("frontier:grass_tuft", [px, py], rnd() * 360, { s: 0.8 + rnd() * 0.5, solid: "none" });
      else if (k < 0.56 && !onTrack(px, py, 420)) put(px > 3000 ? "frontier:red_bush" : "steppe:scrub", [px, py], rnd() * 360, { s: 0.6 + rnd() * 0.4, solid: "none" });
      else if (k < 0.61 && !onTrack(px, py, 480)) put("frontier:boulder", [px, py], rnd() * 360, { s: 0.4 + rnd() * 0.35, solid: ring(55) });
      else if (k < 0.64 && !onTrack(px, py, 520) && f.level(px, py, 260)) put("frontier:fallen_log", [px, py], rnd() * 360, { s: 0.8 + rnd() * 0.3, solid: [{ kind: "log", x: 0, y: 0, w: 90, d: 480, rot: 0 }] });
      else if (k < 0.66) put("steppe:bones", [px, py], rnd() * 360, { s: 0.7, solid: "none" });
      else continue;
      taken.push([px, py, 70]);
    }

  // ---- the shore: dark rocks along the water, stacks out at sea ----
  for (const { p, d } of every(SHORE, 380)) {
    if (Math.abs(p[0]) > R + 1500 || Math.abs(p[1]) > R + 1500 || rnd() < 0.3) continue;
    put("eastcoast:shore_rocks", [p[0] + d[1] * 120, p[1] - d[0] * 120], faceDir(d[1], -d[0]) + rnd() * 40, { s: 0.6 + rnd() * 0.5, solid: "none", z: -6 });
  }
  for (const [x, y, h, s] of [[-6200, 1500, 20, 1], [-5900, -2200, 140, 0.85], [-2500, -4400, 80, 1.1], [1500, -5600, 200, 0.8], [-1800, 4300, 260, 0.9], [2200, 5600, 60, 0.85], [-6800, -400, 300, 0.7]] as number[][])
    put("eastcoast:sea_stack", [x, y], h, { s, solid: "none", z: -14 });

  // ---- past the edge: the border woods' red maples to the north ----
  const outside = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || onTrack(x, y, 300) || wet(x, y, 350);
  f.woods({ x0: R, x1: A, y0: -A, y1: A }, ["red_maple", "red_maple", "red_bush"], outside, { count: 110, spacing: 500, tries: 4000, kit: "frontier" });
  f.woods({ x0: R - 1500, x1: A, y0: -A, y1: A }, ["AutumnTree", "AutumnTree", "Pine"], outside, { count: 70, spacing: 500, tries: 3000 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["twisted_tree"], (x, y) => outside(x, y) || x > R + 1500, { count: 40, spacing: 600, tries: 3000, kit: "eastcoast" });

  // ---- monsters: the twisted wood, the knoll, the cape and its tip (not at the witch's door) ----
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, {
    step: 700, max: 50,
    keepOut: (x, y) => Math.hypot(x - HUT[0], y - HUT[1]) < 1100 || Math.hypot(x - CIRCLE[0], y - CIRCLE[1]) < 380,
  });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "wc_witch", ...xy(front(420, 120)), face: hutH + 180, name: "ยายมอร์กานา", title: "แม่มดแห่งแหลม", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "violet", top: "top_priestess_black", bottom: "bottom_priestess_black" },
      lines: [
        "หึๆ มาถึงนี่ได้ก็แปลว่าเจ้าไม่ใช่ไก่อ่อนแล้ว นั่งก่อนสิ ข้าต้มน้ำแกงอยู่พอดี ไม่ใช่สำหรับเจ้าหรอกนะ",
        "ตุ๊กตาพวกนั้นข้าไม่ได้ทำ มันคลานขึ้นมาจากทะเลเองทุกคืนเดือนมืด ข้าแค่แขวนเครื่องรางไว้กันมันเข้าบ้าน",
        "อีกาสามตามันขโมยทองไปซ่อนไว้บนเนินหิน ถ้าเจ้าล่ามันได้ ก็เก็บไปเถอะ ข้าไม่ต้องการ",
      ],
    },
    {
      id: "wc_mage", x: CIRCLE[0] + 700, y: CIRCLE[1] + 250, face: 180, name: "จอมเวทอีวาน", title: "นักวิจัยเวทจากคราเดีย", role: "talk",
      look: { gender: "male", hair: "", hairColor: "ink", eyes: "teal", top: "top_priestess_wine", bottom: "bottom_priestess_black" },
      lines: [
        "วงหินนี้เก่ากว่าคราเดียเสียอีก อักษรบนแท่นเรืองแสงทุกครั้งที่หมอกลง",
        "หอคอยจอมเวทส่งข้ามาบันทึกว่าคำสาปบนแหลมนี้มาจากไหน ข้าว่ามันมาจากทะเล ไม่ใช่จากแม่มด",
        "ระวังตุ๊กตาสาปไว้ให้ดี มันสาปให้เท้าหนักจนก้าวไม่ออก แล้วอีกาก็จะรุมจิกทันที",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery: [sea, pool],
    sky: "#4e4a56",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4300, y: -40 },
    npcs,
    labels: [
      { x: N_EXIT[0] - 250, y: N_EXIT[1], text: "ทางไปป่าชายแดน", kind: "gate" },
      { x: HUT[0] + 600, y: HUT[1] + 300, text: "กระท่อมแม่มด" },
      { x: POOL[0] + 700, y: POOL[1], text: "บึงน้ำดำ", kind: "small" },
      { x: 3600, y: -2400, text: "เนินอีกาสามตา" },
      { x: -1200, y: 300, text: "ป่าต้นไม้บิดเบี้ยว" },
      { x: CIRCLE[0] + 700, y: CIRCLE[1] - 400, text: "วงหินริมทะเล" },
      { x: -2300, y: -1500, text: "หน้าผาแหลมแม่มด", kind: "small" },
    ],
  });
}

const xy = (p: XY) => ({ x: p[0], y: p[1] });

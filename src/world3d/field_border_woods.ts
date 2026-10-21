// ป่าชายแดน (the border woods), south of Kradia: a forest of crimson maples and autumn trees on
// rolling ground, where Kradia's patrols keep watch (monsters Lv 60-70). The track comes in
// from Kradia's south gate at the north edge and winds south through the woods:
//   - west of it, on a high bluff (3.2 m), the patrol outpost: a palisade with a gate, a
//     watchtower, tents round a campfire, supplies and a soldier at the gate (ramp up its
//     north face);
//   - north-west, a rocky knoll (2.6 m) crowned by the thousand-year maple (ramp on its east);
//   - east, the ward hill: a broad rise (3 m) and on it a higher crag (6.4 m) where an old
//     rune circle of Kradia's mages still holds a seal, its keeper beside it (ramps up both);
//   - a pond in a glade by the bluff, an old lumber clearing in the south-east, hills and a
//     hollow between.
// Full size, north +X, west +Y; finishField scales it by TOWN_SCALE.

import * as THREE from "three";
import { FieldBuilder } from "./field";
import { useKits } from "./town";
import type { Town } from "./town";
import type { Poly } from "./paved";
import { KIT as FRONTIER, subdiv, chaikin, bandPoly, distToPath, rampOff, nearRamp } from "./kits/frontier";
import type { XY } from "./kits/frontier";
import { KIT as KRADIA } from "./kits/kradia";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(FRONTIER, KRADIA);

const R = 5500;            // the walkable bounds, +-R
const A = 9000;            // the ground's area, +-A

// ---- the raised ground ----
// the outpost bluff in the south-west (it runs on out of the bounds into the rim)
const BLUFF: XY[] = [[-1700, 2100], [-1500, 3300], [-1900, 4600], [-2600, 5600], [-3600, A], [-A, A], [-A, 2400], [-5800, 1500], [-4400, 1200], [-3000, 1100], [-2050, 1350]];
// the maple knoll in the north-west
const KNOLL: XY[] = [[4600, 2300], [4900, 3600], [4300, 4700], [3000, 4900], [2100, 4200], [2000, 2900], [2800, 2200], [3800, 2000]];
// the ward hill in the east (on out into the rim) and the crag on it
const WARD: XY[] = [[3000, -1800], [3600, -2800], [3700, -4400], [3300, -A], [-1000, -A], [-1300, -4800], [-900, -3200], [0, -2300], [1300, -1800]];
const CRAG: XY[] = [[2200, -3700], [2400, -4700], [1800, -5400], [500, -5300], [100, -4400], [600, -3600]];

const R_BLUFF = rampOff([-2050, 1350], [-1700, 2100], 0.5, 1100, 460, [-3000, 3000]);
const R_KNOLL = rampOff([2800, 2200], [3800, 2000], 0.5, 950, 440, [3400, 3500]);
const R_WARD = rampOff([-900, -3200], [0, -2300], 0.5, 1050, 460, [1000, -4000]);
const R_CRAG = rampOff([600, -3600], [2200, -3700], 0.5, 1080, 420, [1300, -4500]);
const RAMPS = [R_BLUFF, R_KNOLL, R_WARD, R_CRAG];

// the camp on the bluff (a palisade box, its gate in the north side) and the other places
const CAMP = { x0: -4500, x1: -2450, y0: 2200, y1: 4200 };
const GATE: XY = [-2450, 2700];
const WARD_CIRCLE: XY = [1300, -4500];
const OLD_MAPLE: XY = [3650, 3550];
const POND_C: XY = [-150, 2350];
const CLEARING: XY = [-3600, -2600];
const EXIT: XY = [5150, 300], BACK: XY = [4450, 330];

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(109, {
    hills: [
      { x: 1800, y: 2700, r: 1200, h: 160 }, { x: -3300, y: -1700, r: 2000, h: 230 }, { x: 2400, y: 600, r: 1100, h: 110 },
      { x: -1300, y: -800, r: 1200, h: -150 }, { x: 4400, y: -1300, r: 1500, h: 170 }, { x: -4500, y: -4400, r: 1700, h: 260 },
      { x: 900, y: 4400, r: 900, h: 140 }, { x: -3800, y: 500, r: 800, h: -100 }, { x: 4700, y: -4500, r: 1400, h: 200 },
      { x: -2000, y: -4300, r: 1300, h: 150 }, { x: 600, y: -900, r: 800, h: 90 },
    ],
    plateaus: [
      { poly: subdiv(BLUFF), h: 320, ramps: [R_BLUFF] },
      { poly: subdiv(KNOLL), h: 260, ramps: [R_KNOLL] },
      { poly: subdiv(WARD), h: 300, ramps: [R_WARD] },
      { poly: subdiv(CRAG), h: 640, ramps: [R_CRAG] },
    ],
    rock: "CliffRock",
  });
  const { put, rnd } = f;

  // ---- tracks: from Kradia down to the outpost, branches to the knoll, the ward hill and the
  // lumber clearing; straight up every ramp ----
  const MAIN = chaikin([[A, 300], [5600, 300], [4700, 260], [3900, 560], [3200, 320], [2400, -150], [1500, -250], [700, 150], [0, 600], [-500, 950], R_BLUFF.bottom], 3);
  const CAMP_PATH = chaikin([R_BLUFF.top, [-2000, 2150], [-2150, 2550], [-2300, 2700], [-2700, 2750], [-3100, 3050]], 2);
  const TO_KNOLL = chaikin([[3200, 320], [3170, 700], R_KNOLL.bottom], 2);
  const ON_KNOLL = chaikin([R_KNOLL.top, [3450, 2600], [3550, 3100], [3600, 3300]], 2);
  const TO_WARD = chaikin([[1500, -250], [1000, -700], [300, -1100], [-500, -1500], R_WARD.bottom], 2);
  const ON_WARD = chaikin([R_WARD.top, [200, -2900], [900, -2650], R_CRAG.bottom], 2);
  const ON_CRAG = chaikin([R_CRAG.top, [1350, -3900], [1300, -3980]], 1);
  const TO_CLEARING = chaikin([[700, 150], [-200, -150], [-1300, -250], [-2300, -600], [-3100, -1200], [-3500, -2100], CLEARING], 2);
  const TO_POND = chaikin([[0, 600], [-50, 1100], [-150, 1650]], 1);
  const RAMP_PATHS: XY[][] = RAMPS.map((r) => [r.bottom, r.top]);
  const PATHS = [MAIN, CAMP_PATH, TO_KNOLL, ON_KNOLL, TO_WARD, ON_WARD, ON_CRAG, TO_CLEARING, TO_POND, ...RAMP_PATHS];
  const roads: Poly[] = [
    bandPoly(MAIN, 470, 60), bandPoly(CAMP_PATH, 430, 40), bandPoly(TO_KNOLL, 420, 40), bandPoly(ON_KNOLL, 400, 40),
    bandPoly(TO_WARD, 440, 50), bandPoly(ON_WARD, 420, 40), bandPoly(ON_CRAG, 400), bandPoly(TO_CLEARING, 400, 50), bandPoly(TO_POND, 360, 30),
    ...RAMPS.map((r) => bandPoly([r.bottom, r.top], r.width - 40)),
  ];
  // the pond: a ragged oval in the glade under the bluff
  const POND: XY[] = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2, k = 1 + 0.12 * Math.sin(i * 2.3) + 0.08 * Math.cos(i * 3.7);
    POND.push([POND_C[0] + Math.cos(a) * 560 * k, POND_C[1] + Math.sin(a) * 430 * k]);
  }
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: [POND], base: "moss", road: [0.72, 0.68, 0.62] });
  // an autumn floor: the moss warmed towards olive and rust
  (ground.mesh.material as THREE.MeshStandardMaterial).color.set("#d9b48c");
  const water = f.waterSheet({ x0: POND_C[0] - 700, x1: POND_C[0] + 700, y0: POND_C[1] - 600, y1: POND_C[1] + 600 });
  for (const t of [-0.55, 0, 0.55]) f.blockDisc([POND_C[0] + t * 520, POND_C[1]], 380 - Math.abs(t) * 160);

  const onTrack = (x: number, y: number, m: number) => PATHS.some((p) => distToPath(p, x, y) < m);
  const inCamp = (x: number, y: number, m = 0) => x > CAMP.x0 - m && x < CAMP.x1 + m && y > CAMP.y0 - m && y < CAMP.y1 + m;
  const near = (p: XY, x: number, y: number, r: number) => Math.hypot(p[0] - x, p[1] - y) < r;
  const tree = (ref: string, at: XY, s: number) => {
    const r = ref === "frontier:red_maple" ? 48 : ref === "frontier:red_bush" ? 70 : 40;
    put(ref, at, rnd() * 360, ref.startsWith("flora:") ? { s } : { s, solid: [{ kind: "tree", x: 0, y: 0, r }] });
  };

  // ---- the way out to Kradia: banners either side, a signpost, a lamp ----
  f.exit("kradia", EXIT, BACK);
  put("kradia:banner_pole", [5000, -60], 180);
  put("kradia:banner_pole", [5000, 680], 180);
  put("frontier:signpost", [4650, 760], 180);
  put("kradia:arcane_lamp", [4250, 0], 0);
  put("kradia:barricade", [5150, -500], 90);
  put("kradia:barricade", [5150, 1150], 90);

  // ---- the outpost on the bluff ----
  f.wall([CAMP.x1, CAMP.y0], [CAMP.x1, CAMP.y1], "n", "frontier:palisade", { gaps: [GATE[1] - CAMP.y0], len: 400, gap: 560 });
  f.wall([CAMP.x0, CAMP.y0], [CAMP.x0, CAMP.y1], "s", "frontier:palisade", { len: 400 });
  f.wall([CAMP.x0, CAMP.y0], [CAMP.x1, CAMP.y0], "e", "frontier:palisade", { len: 400 });
  f.wall([CAMP.x0, CAMP.y1], [CAMP.x1, CAMP.y1], "w", "frontier:palisade", { len: 400 });
  const gateSolid: SolidSpec[] = [
    { kind: "post", x: 0, y: -250, r: 44 }, { kind: "post", x: 0, y: 250, r: 44 },
    { kind: "gate", x: 124, y: -212, w: 210, d: 26, rot: 0 }, { kind: "gate", x: 124, y: 212, w: 210, d: 26, rot: 0 },
  ];
  put("frontier:outpost_gate", GATE, 180, { solid: gateSolid });
  put("frontier:watchtower", [-2870, 3780], 0);
  for (const y of [2650, 3100, 3550]) put("frontier:army_tent", [-4000, y], 180);
  put("frontier:campfire", [-3400, 3250], 0, { solid: [{ kind: "fire", x: 0, y: 0, r: 95 }] });
  put("kradia:supplies", [-3950, 3980], 0);
  put("common:crate", [-3650, 4020], 15);
  put("kradia:training_dummy", [-3200, 2420], -20);
  put("kradia:banner_pole", [-3500, 3700], 0);
  put("kradia:weapon_rack", [-2950, 2480], -90);
  put("kradia:supplies", [-3300, 2480], 0);
  put("kradia:training_dummy", [-2740, 2400], 30);
  put("frontier:stump", [-2800, 3150], 0);
  put("kradia:brazier", [-2280, 2420], 0);
  put("kradia:brazier", [-2280, 2990], 0);
  put("kradia:banner_pole", [-2150, 2330], -90);
  put("kradia:banner_pole", [-2150, 3080], -90);
  put("frontier:signpost", [-2240, 1540], -60);
  put("frontier:leaf_litter", [-3000, 3550], 0);
  put("frontier:leaf_litter", [-3700, 2450], 90);

  // ---- the thousand-year maple on the knoll ----
  put("frontier:red_maple", OLD_MAPLE, 30, { s: 1.6, solid: [{ kind: "tree", x: 0, y: 0, r: 75 }] });
  for (const [x, y, h] of [[3200, 3650, 0], [3700, 3050, 90], [4000, 3800, 200]] as number[][]) put("frontier:leaf_litter", [x, y], h, { s: 1.2 });
  put("common:bench", [3250, 3300], 120);
  put("frontier:boulder", [4250, 3100], 30);
  put("frontier:fallen_log", [3100, 4250], 70);
  put("frontier:rock_cluster", [2550, 3400], 200, { s: 0.8 });

  // ---- the seal on the crag ----
  put("kradia:rune_circle", WARD_CIRCLE, 0);
  for (const [dx, dy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) put("kradia:crystal_obelisk", [WARD_CIRCLE[0] + dx * 480, WARD_CIRCLE[1] + dy * 480], 45 + dx * 90);
  put("kradia:arcane_lamp", [R_CRAG.top[0] - 250, R_CRAG.top[1] - 260], 0);
  put("kradia:arcane_lamp", [R_CRAG.top[0] + 250, R_CRAG.top[1] - 260], 0);
  put("frontier:flat_rocks", [700, -4950], 40, { s: 0.8 });
  put("frontier:rock_cluster", [2000, -5100], 120, { s: 0.8 });

  // ---- the lumber clearing ----
  for (const [x, y] of [[-3300, -2300], [-3900, -2350], [-3450, -2950], [-4000, -2900], [-3700, -2050], [-3150, -2800]] as XY[]) put("frontier:stump", [x, y], rnd() * 360);
  put("frontier:fallen_log", [-4300, -2550], 10);
  put("frontier:fallen_log", [-3600, -3300], 95);
  put("common:market_cart", [-3200, -2000], 120);
  put("common:crate", [-3000, -2150], 20);

  // ---- the pond's shore ----
  put("frontier:flat_rocks", [POND_C[0] + 520, POND_C[1] + 420], 20, { s: 0.7 });
  put("frontier:boulder", [POND_C[0] - 650, POND_C[1] + 380], 80, { s: 0.7 });
  put("frontier:red_bush", [POND_C[0] + 640, POND_C[1] - 300], 0, { s: 0.8, solid: [{ kind: "bush", x: 0, y: 0, r: 60 }] });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.2, d = 1 + 0.25 + (i % 3) * 0.08;
    const p: XY = [POND_C[0] + Math.cos(a) * 560 * d, POND_C[1] + Math.sin(a) * 430 * d];
    if (!onTrack(p[0], p[1], 260)) put(i % 3 === 0 ? "frontier:leaf_litter" : "frontier:grass_tuft", p, i * 47, { s: 0.8 + (i % 4) * 0.15 });
  }

  // ---- the woods: trees over the walkable ground, thinner in the glades where monsters roam ----
  const GLADES: [number, number, number][] = [
    [2300, -1100, 900], [-1300, -800, 900], [-500, -3800, 900], [3800, -800, 800], [-2600, -4400, 900], [-4400, -800, 800],
    [1700, 2000, 800], [600, 3900, 700], [-4600, 4800, 900], [2200, -3200, 700], [4300, 1300, 600], [-1000, 4500, 600],
  ];
  const keep = (x: number, y: number) =>
    onTrack(x, y, 430) || nearRamp(RAMPS, x, y, 260) || inCamp(x, y, 450) || near(GATE, x, y, 900) || near(POND_C, x, y, 900) ||
    near(WARD_CIRCLE, x, y, 1000) || near(OLD_MAPLE, x, y, 650) || near(CLEARING, x, y, 1000) || near(EXIT, x, y, 900);
  const KINDS = ["frontier:red_maple", "frontier:red_maple", "frontier:red_maple", "flora:AutumnTree", "flora:AutumnTree", "flora:AutumnTree", "flora:PineSmall", "flora:Pine", "flora:Birch", "frontier:red_bush"];
  for (let x = -R + 260; x < R; x += 540)
    for (let y = -R + 260; y < R; y += 540) {
      const px = x + (rnd() - 0.5) * 380, py = y + (rnd() - 0.5) * 380;
      if (Math.abs(px) > R - 150 || Math.abs(py) > R - 150 || keep(px, py) || !f.level(px, py, 200)) continue;
      const glade = GLADES.some(([gx, gy, gr]) => Math.hypot(gx - px, gy - py) < gr);
      if (glade ? rnd() < 0.85 : rnd() < 0.28) continue;
      tree(KINDS[Math.floor(rnd() * KINDS.length)], [px, py], 0.72 + rnd() * 0.36);
    }
  // undergrowth and stones in between (no solids for the low cover)
  for (let x = -R + 200; x < R; x += 430)
    for (let y = -R + 200; y < R; y += 430) {
      const px = x + (rnd() - 0.5) * 340, py = y + (rnd() - 0.5) * 340;
      if (Math.abs(px) > R - 100 || Math.abs(py) > R - 100 || onTrack(px, py, 300) || nearRamp(RAMPS, px, py, 200) || inCamp(px, py, 250) || near(POND_C, px, py, 750) || near(WARD_CIRCLE, px, py, 800)) continue;
      if (!f.level(px, py, 160)) continue;
      const k = rnd();
      if (k < 0.4) put("frontier:leaf_litter", [px, py], rnd() * 360, { s: 0.9 + rnd() * 0.7 });
      else if (k < 0.54) put("frontier:grass_tuft", [px, py], rnd() * 360, { s: 0.8 + rnd() * 0.5 });
      else if (k < 0.63 && !onTrack(px, py, 450)) put("frontier:red_bush", [px, py], rnd() * 360, { s: 0.55 + rnd() * 0.3, solid: "none" });
      else if (k < 0.67 && !onTrack(px, py, 500)) put("frontier:boulder", [px, py], rnd() * 360, { s: 0.45 + rnd() * 0.35 });
      else if (k < 0.7 && !onTrack(px, py, 520)) put("frontier:rock_cluster", [px, py], rnd() * 360, { s: 0.5 + rnd() * 0.3 });
      else if (k < 0.73 && !onTrack(px, py, 550) && f.level(px, py, 260)) put("frontier:fallen_log", [px, py], rnd() * 360, { s: 0.8 + rnd() * 0.3 });
      else if (k < 0.76) put("frontier:stump", [px, py], rnd() * 360, { s: 0.8 + rnd() * 0.3 });
    }

  // ---- the rim: thick woods all round outside the bounds (on the bluff and the ward hill too),
  // the road on north to Kradia left open ----
  const rimOut = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || distToPath(MAIN, x, y) < 450;
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["red_maple"], rimOut, { count: 260, tries: 5000, spacing: 520, kit: "frontier" });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["AutumnTree", "AutumnTree", "Pine", "PineSmall"], rimOut, { count: 300, tries: 5000, spacing: 430 });

  // ---- monsters: the glades, the woods' open ground, the hilltops (not in the camp) ----
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, {
    step: 880,
    keepOut: (x, y) => inCamp(x, y, 700) || near(GATE, x, y, 1100) || near(WARD_CIRCLE, x, y, 700) || nearRamp(RAMPS, x, y, 120),
  });

  const soldier: NpcSpec = {
    id: "border_woods_soldier", x: -2250, y: 2560, face: 30, name: "สิบโทอาร์มิน", title: "หน่วยลาดตระเวนชายแดน", role: "talk",
    look: { gender: "male", hair: "", hairColor: "auburn", eyes: "amber", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
    lines: [
      "ค่ายนี้เป็นฐานของหน่วยลาดตระเวนคราเดีย เราเฝ้าป่าใบแดงทั้งกลางวันกลางคืน",
      "ช่วงนี้สัตว์ในป่าดุร้ายขึ้นทุกวัน เหมือนมีอะไรจากทางตะวันออกปลุกมันขึ้นมา",
      "ถ้าจะไปผนึกเวทบนเนินตะวันออก ระวังตัวด้วย พวกมันชอบวนเวียนอยู่แถวนั้น",
    ],
  };
  const keeper: NpcSpec = {
    id: "border_woods_keeper", x: 1420, y: -3990, face: 90, name: "เมลิสซา", title: "ผู้เฝ้าผนึกเวท", role: "talk",
    look: { gender: "female", hair: "hime", hairColor: "violet", eyes: "violet", top: "top_priestess_black", bottom: "bottom_priestess_black" },
    lines: [
      "วงเวทนี้จอมเวทรุ่นแรกของคราเดียสร้างไว้ ผนึกพลังอสูรไม่ให้ไหลซึมเข้าป่า",
      "ผลึกยังส่องแสงอยู่ แต่อ่อนลงทุกปี ฉันต้องเติมพลังให้มันทุกคืน",
      "ใบไม้ที่นี่แดงทั้งปี บางคนว่าเพราะดินดูดพลังเวทเอาไว้",
    ],
  };

  return f.finishField({
    ground,
    scenery: [water],
    sky: "#4a3a2c",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4200, y: 420 },
    npcs: [soldier, keeper],
    labels: [
      { x: 4600, y: 300, text: "ทางไปคราเดีย", kind: "gate" },
      { x: -3200, y: 2650, text: "ค่ายลาดตระเวนชายแดน" },
      { x: 1300, y: -3800, text: "ผนึกเวทโบราณ" },
      { x: 3500, y: 3100, text: "ต้นเมเปิลพันปี" },
      { x: 600, y: -300, text: "ป่าใบแดง" },
      { x: POND_C[0] - 200, y: POND_C[1] - 700, text: "บึงใบไม้", kind: "small" },
      { x: -3500, y: -2250, text: "ลานตัดไม้เก่า", kind: "small" },
    ],
  });
}

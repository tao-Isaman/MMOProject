// ช่องเขาน้ำแข็ง (the ice pass): the one way through the mountains between the foothills and
// Iceberg. A corridor of snow between mountain walls that rise in steps on both sides, bays in
// them full of ice crystals. From the south floor the trail climbs onto a ledge, where a higher
// shelf carries the giant ice crystal; then a gorge cuts straight across the pass, an icy river at
// its bottom fed by a frozen waterfall, and the only way over is the rope bridge. Past it the
// trail drops to the north floor, where Iceberg keeps a watch post above the road down to the
// town's south gate.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: south -> snow_foothills, north -> iceberg (its south gate)

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { KIT as SNOW, densify, smooth, band, towards, inPoly } from "./kits/snowland";
import type { XY } from "./kits/snowland";
import { KIT as ICEBERG } from "./kits/iceberg";
import type { NpcSpec } from "../npcs";

useKits(SNOW, ICEBERG);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the walls: each side rises in three steps, the first one's inner edge is the pass ----
const EW_IN: XY[] = [[A, -1500], [5500, -2000], [5200, -3300], [4300, -3200], [3200, -1900], [2100, -1600], [1300, -900], [0, -900], [-400, -2100], [-800, -3600], [-1800, -3700], [-2400, -2600], [-3500, -2400], [-4400, -2900], [-5500, -2400], [-A, -2500]];
const WW_IN: XY[] = [[A, 2600], [5500, 2900], [4500, 2500], [3900, 3300], [3000, 3100], [2200, 1900], [1300, 1100], [0, 1100], [-1000, 2500], [-2000, 2300], [-2700, 2800], [-3000, 3800], [-3900, 3900], [-4600, 3200], [-5500, 2800], [-A, 2900]];
const EW1: XY[] = [[-A, -A], [A, -A], ...EW_IN];
const WW1: XY[] = [[A, A], [-A, A], ...[...WW_IN].reverse()];
const EW2: XY[] = [[-A, -A], [A, -A], [A, -3000], [5500, -4000], [3800, -3900], [2800, -2800], [1500, -2500], [200, -2600], [-600, -4600], [-2000, -4700], [-3000, -3600], [-5000, -3700], [-A, -3800]];
const WW2: XY[] = [[A, A], [-A, A], [-A, 4200], [-4000, 4900], [-2500, 4800], [-1500, 3600], [0, 2800], [1500, 2700], [2600, 3900], [4000, 4200], [5500, 3600], [A, 4000]];
const EW3: XY[] = [[-A, -A], [A, -A], [A, -5000], [5000, -5800], [2000, -5000], [-1000, -6200], [-3000, -5200], [-A, -5500]];
const WW3: XY[] = [[A, A], [-A, A], [-A, 6000], [-2000, 6400], [1000, 5500], [4000, 6200], [A, 5800]];

// ---- the ledges: A south of the gorge (400) with the crystal shelf A2 (700) on it, B north of the
// gorge (399, a hair lower: the bridge runs from A's edge down onto it) ----
const GORGE = { x0: 0, x1: 1300 };
const BRIDGE_Y = 100;
const A1: XY[] = [[GORGE.x0, -4500], [GORGE.x0, 4500], [-2500, 4500], [-2300, 1200], [-2700, 300], [-2350, -900], [-2700, -4500]];
const A2: XY[] = [[-2100, 700], [-700, 500], [-550, 1350], [-1000, 1850], [-1750, 1600], [-2150, 1250]];
const B1: XY[] = [[GORGE.x1, -4500], [GORGE.x1, 4500], [2700, 4500], [3000, 700], [2600, -500], [2900, -4500]];

// ramps
const RA = { top: [-2525, -300] as XY, bottom: [-3725, -650] as XY, width: 460 };
const RA2 = { top: [-1400, 600] as XY, bottom: [-1534, -340] as XY, width: 420 };
const RB = { top: [2800, 100] as XY, bottom: [3986, -295] as XY, width: 460 };
// the bridge: a level way from A's edge onto B and back (each ledge's edge open where it lands)
const BRIDGE_A = { top: [GORGE.x0, BRIDGE_Y] as XY, bottom: [GORGE.x1 + 300, BRIDGE_Y] as XY, width: 300 };
const BRIDGE_B = { top: [GORGE.x1, BRIDGE_Y] as XY, bottom: [GORGE.x0 - 300, BRIDGE_Y] as XY, width: 300 };

const along = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};
const len = (r: { top: XY; bottom: XY }) => Math.hypot(r.top[0] - r.bottom[0], r.top[1] - r.bottom[1]);

// the plateaus' edges in short pieces near the walkable box
const dz = (p: XY[]) => densify(p, (x, y) => Math.abs(x) < R + 1500 && Math.abs(y) < R + 1500, 350);

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(203, {
    hills: [
      { x: -4300, y: 600, r: 900, h: 70 },
      { x: -4900, y: -1000, r: 700, h: -40 },
      { x: 4800, y: 1100, r: 800, h: 80 },
      { x: 4700, y: -1900, r: 700, h: 60 },
      { x: -7000, y: 300, r: 1600, h: 160 },
      { x: 7000, y: 600, r: 1600, h: -120 },
    ],
    // B before A: over the gorge the way from A's edge (listed last) is the one that counts
    plateaus: [
      { poly: dz(B1), h: 399, ramps: [BRIDGE_B, RB] },
      { poly: dz(A1), h: 400, ramps: [RA, BRIDGE_A] },
      { poly: dz(A2), h: 700, ramps: [RA2] },
      { poly: dz(EW1), h: 650 }, { poly: dz(WW1), h: 700 },
      { poly: dz(EW2), h: 1150 }, { poly: dz(WW2), h: 1200 },
      { poly: dz(EW3), h: 1650 }, { poly: dz(WW3), h: 1700 },
    ],
    rock: "Snowland_GlacierCliff",
  });
  const { put, rnd } = f;

  // ---- the trail ----
  const S_EXIT: XY = [-5150, 400], N_EXIT: XY = [5150, -250];
  const MAIN: XY[] = [
    ...smooth([[-7600, 300], S_EXIT, [-4500, 250], along(RA.bottom, RA.top, -600)]),
    RA.bottom, RA.top,
    ...smooth([along(RA.bottom, RA.top, len(RA) + 400), [-1600, -150], [-700, 80], [-250, BRIDGE_Y]]),
    [GORGE.x1 + 250, BRIDGE_Y],
    ...smooth([[GORGE.x1 + 650, BRIDGE_Y + 30], [2200, 150], along(RB.top, RB.bottom, -450)]),
    RB.top, RB.bottom,
    ...smooth([along(RB.top, RB.bottom, len(RB) + 400), [4700, -330], N_EXIT, [7600, -150]]),
  ];
  const SHELF_WAY: XY[] = [...smooth([[-1700, -200], along(RA2.bottom, RA2.top, -250)]), RA2.bottom, RA2.top, ...smooth([along(RA2.bottom, RA2.top, len(RA2) + 300), [-1250, 1250]])];
  const roads = [band(MAIN, 440), band(SHELF_WAY, 380)];

  // the river at the bottom of the gorge (its ends run in under the walls)
  const RIVER: XY[] = [[GORGE.x0 + 130, -980], [GORGE.x1 - 130, -980], [GORGE.x1 - 130, 1180], [GORGE.x0 + 130, 1180]];
  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ground = f.ground({ area, roads, plazas: [], water: [RIVER], base: "snow", road: [0.7, 0.76, 1.05] });

  // ---- ways out ----
  f.exit("snow_foothills", S_EXIT, [-4400, 260]);
  f.exit("iceberg", N_EXIT, [4450, -320]);

  // the river: dark cold water down in the gorge
  const river = f.waterSheet({ x0: GORGE.x0 - 200, x1: GORGE.x1 + 200, y0: -1600, y1: 1800 }, -14, "Snowland_RiverWater");

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number, gap = 0) =>
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    take(at[0], at[1], r);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] });
  const inPass = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  const grove = (c: XY, r: number, n: number, kinds = ["SnowPine", "SnowPineSmall", "SnowPine"]) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inPass(x, y) || !free(x, y, 170, 180)) continue;
      put(`flora:${kinds[Math.floor(rnd() * kinds.length)]}`, [x, y], rnd() * 360, { s: 0.7 + rnd() * 0.4 });
      take(x, y, 170);
      made++;
    }
  };
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, solid?: number) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inPass(x, y) || !free(x, y, rad, 40)) continue;
      put(ref, [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.4, ...(solid ? ring(solid) : {}) });
      take(x, y, rad);
      made++;
    }
  };

  // ---- the rope bridge, the frozen falls at the gorge's head ----
  put("snowland:rope_bridge", [(GORGE.x0 + GORGE.x1) / 2, BRIDGE_Y], 0, {
    solid: [-1, 1].flatMap((sx) => [-1, 1].map((sy) => ({ kind: "post", x: sx * 745, y: sy * 143, r: 16 }))),
  });
  take(-150, BRIDGE_Y, 260);
  take(GORGE.x1 + 150, BRIDGE_Y, 260);
  put("snowland:frozen_falls", [(GORGE.x0 + GORGE.x1) / 2, 1100 - 165 - 190], 90, { solid: "none" });
  put("snowland:ice_crystals", [GORGE.x0 + 250, -650], 30, { solid: "none" });
  put("snowland:snow_boulder", [GORGE.x1 - 260, -700], 0, { solid: "none", s: 0.8 });
  for (const at of [[-260, -520], [-240, 720], [GORGE.x1 + 230, -560], [GORGE.x1 + 250, 640]] as XY[]) prop("snowland:cairn", at, rnd() * 90, 70, ring(45));

  // ---- the giant crystal on its shelf ----
  const SPIRE: XY = [-1350, 1150];
  prop("snowland:ice_spire", SPIRE, 30, 380, ring(300, "crystal"));
  scatter("snowland:ice_crystals", [-1350, 1150], 650, 3, 110, 60);

  // ---- the crystal grotto: the bay in the east wall on the ledge ----
  const GROTTO: XY = [-1300, -2600];
  for (const [at, s, h] of [[[-1500, -3000], 1.4, 20], [[-900, -2900], 1.1, 200], [[-1900, -2700], 0.9, 120], [[-1100, -2400], 0.7, 300], [[-600, -2300], 0.8, 60]] as [XY, number, number][])
    prop("snowland:ice_crystals", at, h, 140 * s, { s, solid: [{ kind: "crystal", x: 0, y: 0, r: 80 }] });
  prop("snowland:snow_drift", [-1700, -2200], 30, 200);

  // ---- the south floor: a lost sled in the west bay, rocks, a trail sign at the way in ----
  prop("snowland:trail_sign", [-4950, -50], 90, 80, ring(30, "post"));
  prop("snowland:cairn", [-4950, 860], 0, 70, ring(45));
  prop("snowland:supply_cache", [-3600, 2900], 60, 220, { solid: [{ kind: "box", x: -10, y: 0, w: 330, d: 140, rot: 0 }] });
  prop("snowland:cold_campfire", [-3300, 2500], 0, 150, ring(70));
  prop("snowland:dead_branches", [-4000, 3100], 20, 120);

  // ---- the north floor: Iceberg's watch post over the road down to the town ----
  const POST: XY = [4700, -1700];
  prop("iceberg:watch_tower", POST, towards(-1, 1), 330);
  prop("iceberg:brazier", [4400, -1000], 0, 60, ring(40, "post"));
  prop("iceberg:brazier", [4400, 500], 0, 60, ring(40, "post"));
  prop("iceberg:snowy_barrels", [5100, -1250], 30, 120);
  prop("iceberg:woodpile", [3950, -1850], 40, 170);
  prop("iceberg:sled", [3700, 1300], -60, 130);
  prop("snowland:trail_sign", [4900, 150], -90, 80, ring(30, "post"));
  prop("iceberg:lantern_post", [4900, -650], 0, 50, ring(25, "post"));

  // ---- rocks along the walls and in the open ----
  const ROCKS: [string, XY, number][] = [
    ["rock_cluster", [-4900, 1700], 190], ["snow_boulder", [-4300, -1300], 130], ["flat_slabs", [-3000, -1100], 150], ["snow_boulder", [-2900, 1700], 130],
    ["rock_cluster", [-2200, -1700], 190], ["snow_boulder", [-500, -1400], 130], ["flat_slabs", [-2100, 300], 150], ["rock_cluster", [2000, -1100], 190],
    ["snow_boulder", [2300, 1100], 130], ["flat_slabs", [1700, 700], 150], ["rock_cluster", [3500, 2100], 190], ["snow_boulder", [3300, -1100], 130],
    ["flat_slabs", [5000, 1600], 150], ["snow_boulder", [-5200, -1100], 130], ["rock_cluster", [-1700, 1100], 170],
  ];
  for (const [id, at, r] of ROCKS) if (free(at[0], at[1], r)) prop(`snowland:${id}`, at, rnd() * 360, r + 40, ring(r));
  // crystals grow where the walls meet the floor
  for (const c of [[-5200, 2000], [-3800, -1500], [-2500, 1900], [-700, -1700], [2000, 1300], [2600, -1300], [3900, 2400], [4200, -2300], [5100, 2000]] as XY[]) scatter("snowland:ice_crystals", c, 450, 1, 110, 60);

  // ---- trees in the bays and along the walls ----
  for (const [c, r, n] of [
    [[-4200, 3100], 700, 5], [[-5100, -1400], 500, 3], [[-3300, -1400], 400, 2], [[-2600, 2000], 400, 2], [[-1900, -3100], 400, 2],
    [[2000, -1250], 300, 2], [[2300, 1300], 300, 2], [[4100, 2300], 600, 4], [[3600, -1700], 400, 2], [[5100, 2000], 400, 3], [[5100, -2300], 400, 2],
  ] as [XY, number, number][]) grove(c, r, n);

  // ---- ground cover ----
  scatter("snowland:snow_drift", [-4000, 500], 1500, 4, 230);
  scatter("snowland:snow_drift", [-1300, -300], 1300, 3, 230);
  scatter("snowland:snow_drift", [2000, 0], 800, 2, 230);
  scatter("snowland:snow_drift", [4300, 800], 1200, 3, 230);
  scatter("snowland:frost_shrub", [-3500, 0], 2000, 5, 90, 50);
  scatter("snowland:frost_shrub", [4200, 0], 1500, 3, 90, 50);
  scatter("snowland:dead_branches", [0, 0], 4500, 5, 120);
  scatter("snowland:dry_grass", [-4200, 0], 1500, 4, 90);

  // ---- past the edge: woods on the steps of the walls and down the trail both ways ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => [[0, 0], [250, 0], [-250, 0], [0, 250], [0, -250]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  f.woods(area, ["SnowPine", "SnowPine", "SnowPineSmall", "FrostOak"], (x, y) => inside(x, y) || onTrack(x, y), { count: 380, spacing: 430, tries: 6000 });
  // and a few on the walls' steps inside the box, where nobody walks
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["SnowPine", "SnowPineSmall"], (x, y) => f.h(x, y) < 640 || inPoly(A2, x, y) || onTrack(x, y), { count: 90, spacing: 520, tries: 3000 });

  // ---- monsters ----
  const quiet = (x: number, y: number) => inPoly(EW1, x, y) || inPoly(WW1, x, y) || Math.hypot(x - POST[0], y - POST[1]) < 900 || (x > GORGE.x0 - 400 && x < GORGE.x1 + 400 && Math.abs(y - BRIDGE_Y) < 600);
  f.monsterSpots(ground, { x0: -R + 200, x1: R - 200, y0: -R + 200, y1: R - 200 }, { step: 560, keepOut: quiet });

  const npcs: NpcSpec[] = [
    { id: "pass_guard", x: 4500, y: -1250, face: 180, name: "ทหารยามโอลาฟ", title: "ยามด่านช่องเขา · ไอซ์เบิร์ก", role: "talk",
      look: { gender: "male", hair: "", hairColor: "ink", eyes: "blue", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "ทางลงเขาเส้นนี้ตรงไปประตูใต้ของไอซ์เบิร์ก เดินอีกไม่ไกลก็ถึงแล้ว",
        "สะพานเชือกข้ามหุบเหวนั่นเราซ่อมทุกฤดูหนาว อย่าวิ่งบนมันก็พอ",
        "ผลึกน้ำแข็งยักษ์บนชะง่อนผานั่นเรืองแสงตลอดคืน พวกสัตว์ประหลาดชอบไปรวมกันแถวนั้น",
      ] },
  ];

  const town = f.finishField({
    ground,
    scenery: [river],
    sky: "#b9c8d6",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -4300, y: 320 },
    npcs,
    labels: [
      { x: S_EXIT[0] + 150, y: S_EXIT[1], text: "ทางไปเชิงเขาหิมะ", kind: "gate" },
      { x: N_EXIT[0] - 150, y: N_EXIT[1], text: "ทางไปไอซ์เบิร์ก", kind: "gate" },
      { x: (GORGE.x0 + GORGE.x1) / 2, y: BRIDGE_Y, text: "สะพานเชือกข้ามหุบเหว" },
      { x: SPIRE[0] - 500, y: SPIRE[1], text: "เสาผลึกน้ำแข็งยักษ์" },
      { x: GROTTO[0] + 300, y: GROTTO[1], text: "ซอกผลึกน้ำแข็ง", kind: "small" },
      { x: GORGE.x0 - 350, y: 750, text: "น้ำตกน้ำแข็ง", kind: "small" },
      { x: POST[0] - 300, y: POST[1] + 300, text: "ป้อมยามช่องเขา", kind: "small" },
      { x: -3900, y: 1200, text: "ลานหิมะใต้ช่องเขา" },
      { x: -3500, y: 2900, text: "ที่พักคาราวานร้าง", kind: "small" },
    ],
  });

  // Under the bridge there is only air: the rock faces the ground would hang down each side of
  // the way across are taken out between the two ledges' edges (a stub is left at each end).
  town.level.root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh || !m.geometry.index) return;
    const mat = m.material as THREE.Material;
    if (Array.isArray(mat) || mat.side !== THREE.DoubleSide) return;
    const P = m.geometry.getAttribute("position"), idx = m.geometry.index!, keep: number[] = [];
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
      const x = (P.getX(a) + P.getX(b) + P.getX(c)) / 3, y = -(P.getZ(a) + P.getZ(b) + P.getZ(c)) / 3;
      if (x > GORGE.x0 + 100 && x < GORGE.x1 - 100 && Math.abs(y - BRIDGE_Y) < 330) continue;
      keep.push(a, b, c);
    }
    m.geometry.setIndex(keep);
  });
  return town;
}

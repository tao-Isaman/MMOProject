// ทุ่งน้ำแข็งเหนือ (the north ice field): the wide white country north of Iceberg, down to the
// shore of the North Sea. A frozen lake in the middle that you can walk out on (Iceberg's old
// fishermen cut their holes in it), a glacier along the west edge rising in two steps with a
// frozen waterfall at its back, an ice shelf in the east looking out over the sea, and on the
// shore below it the camp an expedition abandoned when their ship froze into the ice: tents
// half buried, their flag still flying, the fire long cold, the sleds left where they stood.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   way out: south -> iceberg (its north gate)

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { material } from "./textures";
import { KIT as SNOW, densify, smooth, band, blobPoly, inPoly, towards, flatSheet } from "./kits/snowland";
import type { XY } from "./kits/snowland";
import { KIT as ICEBERG } from "./kits/iceberg";
import type { NpcSpec } from "../npcs";

useKits(SNOW, ICEBERG);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the shore of the North Sea (land south of it, x below) ----
const SHORE: XY[] = [[4600, -5850], [4400, -5000], [4700, -4200], [4300, -3200], [4600, -2200], [4900, -1400], [4400, -500], [4200, 600], [4500, 1600], [4100, 2600], [4300, 3600], [4000, 4600], [3700, 5500], [3600, 6500], [3500, A]];
const SEA: XY[] = [...SHORE, [A, A], [A, -5850]];

// ---- the levels: the glacier in the west (G1 350, G2 650 on it, G3 1050 beyond the edge), the
// ice shelf by the sea (S1 280), the glacier wall past the east edge (GE 900) ----
const G1: XY[] = [[-A, 3700], [-5000, 3500], [-3600, 2900], [-2100, 3300], [-700, 4400], [1200, 4200], [2600, 4800], [3300, 4700], [3400, A], [-A, A]];
const G2: XY[] = [[-A, 4500], [-4400, 4200], [-3300, 4400], [-2700, 5000], [-2600, A], [-A, A]];
const G3: XY[] = [[-A, 6200], [-3000, 5900], [0, 6400], [3200, 6000], [3300, A], [-A, A]];
const S1: XY[] = [[1500, -4300], [2800, -4600], [3700, -3900], [3800, -3200], [2900, -3000], [1900, -3300]];
const GE: XY[] = [[-A, -6000], [-3000, -6400], [0, -6100], [2500, -6600], [4200, -6300], [A, -6100], [A, -A], [-A, -A]];

const RG1 = { top: [-2850, 3100] as XY, bottom: [-2566, 2037] as XY, width: 460 };
const RG2 = { top: [-3000, 4700] as XY, bottom: [-2328, 4028] as XY, width: 420 };
const RS1 = { top: [2400, -3150] as XY, bottom: [2142, -2288] as XY, width: 440 };

// the frozen lake
const LAKE_C: XY = [-300, 1500];
const LAKE = blobPoly(LAKE_C, 1800, 1400, 41, 0.1, 36);

const along = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};
const len = (r: { top: XY; bottom: XY }) => Math.hypot(r.top[0] - r.bottom[0], r.top[1] - r.bottom[1]);

// the plateaus' edges in short pieces near the walkable box
const dz = (p: XY[]) => densify(p, (x, y) => Math.abs(x) < R + 1500 && Math.abs(y) < R + 1500);

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(204, {
    hills: [
      { x: -3800, y: -1800, r: 1600, h: 140 },
      { x: -1200, y: -3600, r: 1500, h: 120 },
      { x: 1800, y: 600, r: 1100, h: 90 },
      { x: -4400, y: 1400, r: 1000, h: 80 },
      { x: 600, y: -4800, r: 1100, h: 100 },
      { x: 2800, y: 2600, r: 900, h: 70 },
      { x: -7000, y: 0, r: 2400, h: 260 },
    ],
    plateaus: [
      { poly: dz(G1), h: 350, ramps: [RG1] },
      { poly: dz(G2), h: 650, ramps: [RG2] },
      { poly: dz(G3), h: 1050 },
      { poly: dz(S1), h: 280, ramps: [RS1] },
      { poly: dz(GE), h: 900 },
    ],
    rock: "Snowland_GlacierCliff",
  });
  const { put, rnd } = f;

  // ---- tracks: in from Iceberg, round the lake's south to the camp, the shore and the shelf;
  // a branch west up onto the glacier ----
  const S_EXIT: XY = [-5150, 300];
  const CAMP: XY = [700, -2200];
  const MAIN: XY[] = smooth([[-7600, 200], S_EXIT, [-4100, 150], [-3000, -300], [-1700, -900], [-300, -1300], [900, -1100], [1900, -1300], [3000, -1150], [3950, -1000]]);
  const SHELF_WAY: XY[] = [...smooth([[1900, -1300], along(RS1.bottom, RS1.top, -450)]), RS1.bottom, RS1.top, ...smooth([along(RS1.bottom, RS1.top, len(RS1) + 350), [2800, -3700], [3200, -3800]])];
  const GLACIER_WAY: XY[] = [
    ...smooth([[-3000, -300], [-3500, 700], [-3100, 1500], along(RG1.bottom, RG1.top, -500)]), RG1.bottom, RG1.top,
    ...smooth([along(RG1.bottom, RG1.top, len(RG1) + 300), [-2500, 3900], along(RG2.bottom, RG2.top, -300)]), RG2.bottom, RG2.top,
    ...smooth([along(RG2.bottom, RG2.top, len(RG2) + 300), [-3800, 5000], [-4500, 5050]]),
  ];
  const roads = [band(MAIN, 460), band(SHELF_WAY, 380), band(GLACIER_WAY, 400)];

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ground = f.ground({ area, roads, plazas: [], water: [SEA, LAKE], base: "snow", road: [0.72, 0.77, 1.04] });

  // ---- the way out ----
  f.exit("iceberg", S_EXIT, [-4400, 230]);

  // ---- the sea: cold water, the shore solid, ice floating off it ----
  const sea = f.waterSheet({ x0: 3000, x1: A + 2000, y0: -A - 2000, y1: A + 2000 }, -14, "Snowland_SeaCold");
  const seaLine: XY[] = SHORE.map(([x, y]) => [x + 90, y] as XY);
  f.blockBand(seaLine, 200, { kind: "sea" });
  for (const [x, y, h, s] of [[5600, -4300, 20, 1], [6300, -1200, 140, 0.8], [5800, 1800, 300, 0.6], [6800, 3800, 60, 1.1], [5400, 4200, 200, 0.5], [7300, -3200, 100, 0.7], [5300, -300, 40, 0.45], [5050, 2500, 250, 0.4]] as [number, number, number, number][])
    put("iceberg:ice_floe", [x, y], h, { z: -20 - 25 * s, s, solid: "none" });
  const seaIce = material("Snowland_Ice");
  const floes: THREE.Object3D[] = [];
  for (const [x, y, r, s] of [[4900, -3600, 380, 51], [4750, 900, 300, 52], [4500, 4000, 340, 53], [5250, -5000, 420, 54], [4900, 2100, 260, 55], [5600, 600, 300, 56]] as [number, number, number, number][])
    floes.push(flatSheet(blobPoly([x, y], r, r * 0.75, s, 0.25, 12), -10, seaIce));

  // ---- the frozen lake: pale snowy ice round its edge, clear dark ice in the middle ----
  const lakeEdge = flatSheet(blobPoly(LAKE_C, 1900, 1500, 41, 0.1, 36), -4, material("Snowland_LakeIce"));
  const lakeMid = flatSheet(blobPoly([LAKE_C[0] + 100, LAKE_C[1] - 80], 1250, 900, 43, 0.14, 30), -3, material("Snowland_IceDeep"));

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const onLake = (x: number, y: number) => inPoly(LAKE, x, y);
  const free = (x: number, y: number, r: number, gap = 0) =>
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    take(at[0], at[1], r);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] });
  const inBox = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  const grove = (c: XY, r: number, n: number, kinds = ["SnowPine", "SnowPineSmall", "SnowPine", "FrostOak"]) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inBox(x, y) || !free(x, y, 170, 200)) continue;
      put(`flora:${kinds[Math.floor(rnd() * kinds.length)]}`, [x, y], rnd() * 360, { s: 0.7 + rnd() * 0.4 });
      take(x, y, 170);
      made++;
    }
  };
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, solid?: number, lake = false) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inBox(x, y)) continue;
      if (lake ? !onLake(x, y) || !onLake(x + rad, y) || !onLake(x - rad, y) || !onLake(x, y + rad) || !onLake(x, y - rad) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + rad + 40) : !free(x, y, rad, 40)) continue;
      put(ref, [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.4, ...(solid ? ring(solid) : {}) });
      take(x, y, rad);
      made++;
    }
  };

  // ---- the way out: a sign, cairns ----
  prop("snowland:trail_sign", [-4950, -150], 90, 80, ring(30, "post"));
  prop("snowland:cairn", [-4950, 780], 0, 70, ring(45));
  for (const at of [[-3400, -820], [-2100, -1300], [2950, -1800], [-3900, 1100]] as XY[]) prop("snowland:cairn", at, rnd() * 90, 70, ring(45));

  // ---- the explorers' camp: three tents round their flag, the cold fire, sleds and stores ----
  const at = (dx: number, dy: number): XY => [CAMP[0] + dx, CAMP[1] + dy];
  const tent = { solid: [{ kind: "tent", x: 0, y: 0, w: 320, d: 290, rot: 0 }] };
  const cache = { solid: [{ kind: "box", x: -10, y: 0, w: 330, d: 140, rot: 0 }] };
  prop("snowland:expedition_flag", CAMP, 0, 120, ring(40, "post"));
  prop("snowland:cold_campfire", at(-300, 200), 0, 150, ring(75));
  prop("snowland:explorer_tent", at(450, 550), towards(-0.6, -0.7), 260, tent);
  prop("snowland:explorer_tent", at(-550, 250), towards(1, -0.4), 260, tent);
  prop("snowland:explorer_tent", at(200, -750), towards(-0.3, 1), 260, tent);
  prop("snowland:supply_cache", at(-800, -500), 30, 210, cache);
  prop("snowland:supply_cache", at(800, -300), 120, 210, cache);
  prop("iceberg:snowy_barrels", at(-300, -800), 40, 110);
  prop("iceberg:sled", at(1000, 500), 70, 130);
  prop("snowland:snow_drift", at(-1250, 0), 80, 220);
  prop("snowland:snow_drift", at(900, -1050), 10, 220);

  // ---- the frozen ship at the shore ----
  const WRECK: XY = [4520, -2150];
  prop("snowland:frozen_wreck", WRECK, 80, 900, { solid: [{ kind: "wreck", x: -60, y: 0, w: 1600, d: 640, rot: 0 }] });
  prop("snowland:supply_cache", [3700, -1800], 200, 210, { solid: [{ kind: "box", x: -10, y: 0, w: 330, d: 140, rot: 0 }] });
  prop("snowland:snow_drift", [3800, -3100], 20, 220);

  // ---- the ice shelf: a lookout over the sea ----
  prop("snowland:expedition_flag", [3300, -3900], 0, 120, ring(40, "post"));
  prop("snowland:cairn", [2700, -4100], 0, 70, ring(45));
  prop("snowland:ice_crystals", [3400, -3300], 60, 120, ring(70, "crystal"));
  prop("snowland:snow_boulder", [2100, -3900], 0, 160, ring(120));

  // ---- the glacier: the frozen falls at the back of the upper step, crystals, a cairn ----
  prop("snowland:frozen_falls", [-4300, 5680], 90, 300, { solid: [{ kind: "rock", x: 60, y: 0, w: 300, d: 700, rot: 0 }] });
  prop("snowland:ice_crystals", [-3300, 5300], 20, 120, ring(70, "crystal"));
  prop("snowland:ice_crystals", [-5000, 4800], 200, 120, ring(70, "crystal"));
  prop("snowland:cairn", [-2600, 4300], 0, 70, ring(45));
  scatter("snowland:ice_crystals", [-500, 4800], 1600, 3, 110, 60);
  scatter("snowland:ice_crystals", [1800, 4700], 1200, 2, 110, 60);
  // the explorers hauled stores up onto the glacier too
  prop("snowland:supply_cache", [-1600, 4750], 250, 210, { solid: [{ kind: "box", x: -10, y: 0, w: 330, d: 140, rot: 0 }] });
  prop("snowland:explorer_tent", [-4600, 4900], towards(1, -0.6), 260, { solid: [{ kind: "tent", x: 0, y: 0, w: 320, d: 290, rot: 0 }] });
  for (const at of [[-2200, 2400], [-3300, 2500], [-1500, 2700]] as XY[]) if (free(at[0], at[1], 120)) prop("snowland:snow_boulder", at, rnd() * 360, 150, { s: 0.7, ...ring(95) });

  // ---- on the lake: the fishermen's holes, a sled, snow lying on the ice ----
  const FISH: XY = [600, 2300];
  for (const at of [FISH, [-900, 700], [-1300, 2600], [1000, 1100]] as XY[]) {
    put("snowland:ice_hole", at, rnd() * 360);
    take(at[0], at[1], 120);
  }
  prop("iceberg:sled", [FISH[0] + 200, FISH[1] - 260], 100, 120);
  prop("iceberg:snowy_barrels", [FISH[0] - 240, FISH[1] + 200], 0, 100);
  scatter("snowland:snow_patch", LAKE_C, 1500, 5, 260, undefined, true);

  // ---- the shore: drifts, rocks and ice pushed up along the beach ----
  for (let i = 0; i + 1 < SHORE.length; i++) {
    const [ax, ay] = SHORE[i], [bx, by] = SHORE[i + 1];
    if (Math.abs(ay) > R) continue;
    const x = (ax + bx) / 2 - 350, y = (ay + by) / 2;
    if (rnd() < 0.5) scatter("snowland:snow_drift", [x, y], 250, 1, 200);
    else scatter("snowland:flat_slabs", [x, y], 250, 1, 170, 140);
  }

  // ---- rocks over the field ----
  const ROCKS: [string, XY, number][] = [
    ["rock_cluster", [-4600, -2800], 190], ["snow_boulder", [-3000, -3700], 130], ["flat_slabs", [-1500, -4600], 150], ["snow_boulder", [-2300, 600], 130],
    ["rock_cluster", [400, -3900], 190], ["snow_boulder", [2400, 300], 130], ["flat_slabs", [3200, 1500], 150], ["rock_cluster", [2600, 3200], 190],
    ["snow_boulder", [-4800, 2500], 130], ["flat_slabs", [-1000, 3800], 150], ["snow_boulder", [1400, 3600], 130], ["rock_cluster", [-4500, -4800], 190],
    ["snow_boulder", [3500, -4700], 130], ["flat_slabs", [-200, -2800], 150], ["snow_boulder", [3600, 3900], 130],
  ];
  for (const [id, at, r] of ROCKS) if (free(at[0], at[1], r)) prop(`snowland:${id}`, at, rnd() * 360, r + 40, ring(r));

  // ---- a few trees: wind-bent pines in the south, the field opens out to the sea ----
  for (const [c, r, n] of [
    [[-4700, -1200], 700, 5], [[-4200, -4500], 800, 5], [[-2600, -2600], 500, 3], [[-5000, 2000], 500, 3], [[-1700, -4900], 500, 3],
    [[200, -4900], 500, 3], [[-3700, 3900], 400, 2], [[-4800, 4700], 400, 3], [[1500, 4800], 400, 2], [[2100, 2200], 300, 2],
  ] as [XY, number, number][]) grove(c, r, n);

  // ---- ground cover ----
  scatter("snowland:snow_drift", [-2500, -2000], 2500, 5, 230);
  scatter("snowland:snow_drift", [1800, 1800], 2000, 4, 230);
  scatter("snowland:frost_shrub", [-3500, -1500], 2000, 5, 90, 50);
  scatter("snowland:frost_shrub", [2000, -300], 1800, 3, 90, 50);
  scatter("snowland:dry_grass", [-3800, -3000], 1800, 5, 90);
  scatter("snowland:dry_grass", [2400, 1800], 1500, 3, 90);
  scatter("snowland:dead_branches", [-1000, -2500], 3500, 4, 120);

  // ---- past the edge: woods to the south (toward Iceberg), bare glaciers east and west ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => [[0, 0], [250, 0], [-250, 0], [0, 250], [0, -250]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const bare = (x: number, y: number) => inPoly(GE, x, y) || inPoly(G3, x, y) || inPoly(SEA, x - 300, y);
  f.woods(area, ["SnowPine", "SnowPine", "SnowPineSmall", "FrostOak"], (x, y) => inside(x, y) || onTrack(x, y) || bare(x, y) || (x > 0 && rnd() < 0.6), { count: 260, spacing: 440, tries: 5000 });

  // ---- monsters ----
  const quiet = (x: number, y: number) => Math.hypot(x - CAMP[0], y - CAMP[1]) < 1300;
  f.monsterSpots(ground, { x0: -R + 200, x1: R - 200, y0: -R + 200, y1: R - 200 }, { step: 1060, keepOut: quiet });

  const npcs: NpcSpec[] = [
    { id: "icefield_explorer", x: CAMP[0] - 150, y: CAMP[1] + 420, face: 200, name: "คาริน", title: "นักสำรวจคนสุดท้าย", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "amber", eyes: "violet", top: "top_adventurer_navy", bottom: "bottom_adventurer_sand" },
      lines: [
        "เรือของคณะเราติดน้ำแข็งอยู่ริมฝั่งนั่นมาสองฤดูหนาวแล้ว ทุกคนถอยกลับไอซ์เบิร์กกันหมด",
        "ฉันกลับมาเก็บบันทึกการสำรวจที่ทิ้งไว้ในเต็นท์ แต่สัตว์ประหลาดบนทุ่งนี้ไม่ยอมให้เดินสะดวกเลย",
        "ขึ้นไปบนลานน้ำแข็งริมทะเลสิ ธงของคณะเรายังปักอยู่ตรงนั้น มองเห็นทะเลเหนือสุดตา",
      ] },
    { id: "icefield_fisher", x: FISH[0] - 160, y: FISH[1] - 150, face: 60, name: "ตาฮาลวาร์ด", title: "ชาวประมงน้ำแข็ง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "blue", top: "top_warrior", bottom: "bottom_warrior_cocoa" },
      lines: [
        "น้ำแข็งบนทะเลสาบหนาพอให้เดินได้ทั้งปี ตกปลาเทราต์ได้ตัวโต ๆ",
        "ระวังลมจากทะเลเหนือนะ พัดมาทีหิมะกลบรอยเท้าหมด",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [sea, lakeEdge, lakeMid, ...floes],
    sky: "#bccbd9",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -4300, y: 300 },
    npcs,
    labels: [
      { x: S_EXIT[0] + 150, y: S_EXIT[1], text: "ทางไปไอซ์เบิร์ก", kind: "gate" },
      { x: LAKE_C[0], y: LAKE_C[1] - 300, text: "ทะเลสาบน้ำแข็ง" },
      { x: CAMP[0] - 600, y: CAMP[1] - 200, text: "ค่ายนักสำรวจร้าง" },
      { x: WRECK[0] - 700, y: WRECK[1], text: "ซากเรือคณะสำรวจ" },
      { x: 3900, y: 2200, text: "ชายฝั่งทะเลเหนือ" },
      { x: -1500, y: 4800, text: "ธารน้ำแข็งตะวันตก" },
      { x: 2800, y: -3600, text: "ลานน้ำแข็งชมทะเล", kind: "small" },
      { x: -4300, y: 5200, text: "น้ำตกน้ำแข็ง", kind: "small" },
      { x: FISH[0], y: FISH[1] - 400, text: "จุดตกปลาน้ำแข็ง", kind: "small" },
    ],
  });
}

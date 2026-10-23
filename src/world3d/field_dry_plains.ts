// ที่ราบแห้งแล้ง (the dry plains), monsters Lv 50-62: dry scrubland where the green country gives
// out to the desert, east of Venezia. The caravan road comes in from the desert's edge on the east
// side and winds west across cracked earth, dry grass and thorn scrub to the way on to Venezia.
// Halfway along it stands the caravan waystation: the rest house, a well, awnings, posts where the
// camels are tethered, a fire. Mesas rise out of the plain: the great one in the north-east
// carries an abandoned stone fort, its corner towers and its gatehouse facing the long ramp up;
// the south-western one steps up again to a butte where an old beacon tower guided the caravans
// by night. A dry wash winds down the south-east, mud cracked in its bed, and in it lie the
// bleached bones of some huge beast. Lone buttes stand all round past the edge.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: west -> venezia, east -> desert_edge

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { KIT as WESTFARM, smooth, band, dense, blob, toLine, towards, along } from "./kits/westfarm";
import type { XY } from "./kits/westfarm";
import { KIT as DESERT } from "./kits/desert";
import { KIT as BAHAMAS } from "./kits/bahamas";
import { KIT as STEPPE, SHAPES as STEPPE_SHAPES } from "./kits/steppe";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as FRONTIER } from "./kits/frontier";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(WESTFARM, DESERT, BAHAMAS, STEPPE, TRUNRADA, FRONTIER);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the levels ----
// M1: the fort mesa (450) in the north-east; M2: the south-west mesa (380) and its butte MB (680);
// lone buttes past the edge (scenery); the rims north and south.
const M1: XY[] = [[1900, -900], [2800, -400], [4300, -500], [5200, -1100], [5400, -2600], [4900, -4000], [3600, -4300], [2200, -3900], [1600, -2600]];
const M2: XY[] = [[-1900, 1200], [-2500, 600], [-3800, 700], [-4800, 1500], [-5000, 3000], [-4400, 4400], [-3000, 4700], [-2000, 3900], [-1600, 2500]];
const MB: XY[] = [[-2900, 2400], [-3600, 2000], [-4300, 2500], [-4300, 3600], [-3500, 4000], [-2800, 3300]];
const RM1 = { top: [1750, -1750] as XY, bottom: [371, -1506] as XY, width: 480 };
const RM2 = { top: [-1750, 1850] as XY, bottom: [-629, 1591] as XY, width: 460 };
const RMB = { top: [-3250, 2200] as XY, bottom: [-2779, 1375] as XY, width: 420 };
const RIMS: [XY[], number][] = [
  [[[6100, -A], [6300, -3000], [5900, 0], [6400, 3500], [6000, A], [A, A], [A, -A]], 950],
  [[[-6200, -A], [-A, -A], [-A, A], [-6100, A], [-6400, 4000], [-5900, 500], [-6300, -3500]], 820],
  [[[2500, -7200], [3500, -6600], [4300, -7400], [3400, -8300]], 1050],
  [[[-3000, 6800], [-2000, 6300], [-1200, 7100], [-2200, 8000]], 900],
  [[[-4200, -7000], [-3000, -6600], [-2600, -7800], [-3800, -8200]], 860],
  [[[2600, 6800], [3800, 6500], [4300, 7600], [3000, 8100]], 1150],
  [[[-1000, -8200], [200, -7700], [700, -8600], [-500, -A]], 700],
];

// ---- the places ----
const FORT: XY = [3350, -2350];
const WS: XY = [750, 850]; // the waystation's rest house
const BEACON: XY = [-3700, 3000];
const WASH: XY[] = [[-1300, -900], [-2000, -1600], [-2700, -2400], [-3100, -3300], [-3700, -4200], [-4400, -5100], [-5200, -6200]];
const SKELETON: XY = [-2950, -2900];

// ---- the tracks ----
const ROAD: XY[] = smooth([[-300, -A], [-200, -7000], [-150, -5150], [-500, -3800], [-900, -2400], [-600, -1200], [-300, 0], [100, 1300], [600, 2600], [400, 3900], [250, 5150], [300, 7000], [400, A]]);
const FORT_WAY: XY[] = [...smooth([[-650, -1300], [-200, -1450], along(RM1.bottom, RM1.top, -400)]), RM1.bottom, RM1.top, ...smooth([along(RM1.bottom, RM1.top, 1800), [2200, -2050], [FORT[0] - 1250, FORT[1]]])];
const BEACON_WAY: XY[] = [
  ...smooth([[250, 1700], [-200, 1700], along(RM2.bottom, RM2.top, -400)]), RM2.bottom, RM2.top,
  ...smooth([along(RM2.bottom, RM2.top, 1550), [-2300, 1500], along(RMB.bottom, RMB.top, -350)]), RMB.bottom, RMB.top,
  ...smooth([along(RMB.bottom, RMB.top, 1300), [BEACON[0] + 300, BEACON[1] - 400]]),
];
const WASH_WAY: XY[] = smooth([[-750, -2000], [-1700, -2300], [-2300, -2650]]);
const TRACKS = [ROAD, FORT_WAY, BEACON_WAY, WASH_WAY];
const WAY_W: XY = [250, 5150], WAY_E: XY = [-150, -5150];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(303, {
    hills: [
      // the dry wash: a chain of hollows down the south-east
      ...WASH.map(([x, y], i) => ({ x, y, r: 620 + (i % 2) * 120, h: -70 - (i % 3) * 12 })),
      { x: -1500, y: 4800, r: 1000, h: 110 }, { x: 1800, y: 3900, r: 1200, h: 130 }, { x: 3800, y: 2300, r: 1100, h: 120 },
      { x: -4300, y: -1600, r: 1000, h: 100 }, { x: 4600, y: -4900, r: 700, h: 80 }, { x: 2300, y: 1000, r: 800, h: 70 },
      { x: -700, y: -4200, r: 700, h: 60 },
      // the dust rolling on past the edge
      { x: 0, y: -7600, r: 1800, h: 200 }, { x: 0, y: 7700, r: 1800, h: 180 },
    ],
    plateaus: [
      { poly: dense(M1), h: 450, ramps: [RM1] },
      { poly: dense(M2), h: 380, ramps: [RM2] },
      { poly: dense(MB), h: 680, ramps: [RMB] },
      ...RIMS.map(([poly, h]) => ({ poly: dense(poly), h })),
    ],
    rock: "CliffSand",
  });
  const { put, rnd } = f;
  const YARD = blob([250, 750], 620, 900, 5, 18, 0.08);
  const ground = f.ground({
    area: { x0: -A, y0: -A, x1: A, y1: A },
    roads: [band(ROAD, 480), band(FORT_WAY, 420), band(BEACON_WAY, 400), band(WASH_WAY, 360), YARD],
    plazas: [],
    base: "steppe",
    tint: "#efe0bf",
    road: [0.98, 0.86, 0.7],
  });

  // ---- placing things: clear of the tracks, the cliffs and each other ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine(x, y, t) < d) || ground.kind(x, y) !== 0;
  const free = (x: number, y: number, r: number, gap = 0) => !nearTrack(x, y, r + 230) && f.level(x, y, Math.min(r, 220)) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    taken.push([at[0], at[1], r]);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });
  const scatter = (refs: string[], n: number, box: { x0: number; x1: number; y0: number; y1: number }, rad: number, o: { s?: [number, number]; solid?: SolidSpec[] | "none"; keep?: (x: number, y: number) => boolean } = {}) => {
    for (let i = 0, made = 0; i < n * 30 && made < n; i++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (!free(x, y, rad, 40) || (o.keep && !o.keep(x, y))) continue;
      const s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      prop(refs[Math.floor(rnd() * refs.length)], [x, y], rnd() * 360, rad * s, { s, ...(o.solid ? { solid: o.solid } : {}) });
      made++;
    }
  };
  const IN = { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 };
  const nearExit = (x: number, y: number) => Math.hypot(x - WAY_W[0], y - WAY_W[1]) < 1000 || Math.hypot(x - WAY_E[0], y - WAY_E[1]) < 1000;

  // ---- the ways out ----
  f.exit("venezia", WAY_W, [334, 4450]);
  f.exit("desert_edge", WAY_E, [-330, -4450]);
  prop("desert:signpost", [700, 4800], -90, 80);
  prop("desert:boulder_big", [-450, 5000], 30, 260, { s: 0.6 });
  prop("desert:signpost", [300, -4900], 90, 80);
  prop("desert:rock_cluster", [-800, -5000], 60, 200, { s: 0.7 });

  // ---- the waystation: the rest house, the well, awnings, the camels' posts, a fire ----
  prop("desert:waystation", WS, towards(-1, 0.1), 520);
  prop("bahamas:well", [150, 1700], 20, 160);
  prop("bahamas:shade_sail", [400, -250], towards(-1, 0.3), 300);
  prop("bahamas:shade_sail", [1000, 2050], towards(-0.4, -1), 300);
  prop("westfarm:camel_post", [-850, 350], towards(1, 0.1), 260);
  prop("westfarm:camel_post", [-750, 1350], towards(1, -0.1), 260);
  prop("bahamas:camel_trough", [480, 1950], 90, 140);
  prop("trunrada:campfire", [350, 150], 0, 170);
  prop("bahamas:pottery_set", [1150, 350], 30, 90);
  prop("bahamas:pottery_set", [1100, 1400], 80, 90);
  prop("common:crate", [1250, 1150], 20, 60);
  prop("common:crate", [1300, 1230], 60, 60);
  prop("steppe:hay_bales", [-1150, 1900], 30, 240);
  prop("desert:signpost", [-100, -650], 0, 80);
  prop("desert:acacia", [1350, -400], 40, 260, ring(34, "tree"));
  prop("desert:acacia", [-1300, 2300], 120, 260, ring(34, "tree"));

  // ---- the fort on the great mesa: towers at the corners, walls, the gatehouse to the ramp ----
  const H = 900;
  // (the pieces block only their stonework, not the sand and stones fallen round them)
  const wallSolid = (len: number): SolidSpec[] => [{ kind: "wall", x: 0, y: 0, w: 170, d: len, rot: 0 }];
  for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) prop("westfarm:fort_tower", [FORT[0] + sx * H, FORT[1] + sy * H], 0, 360, { solid: [{ kind: "tower", x: 0, y: 0, w: 600, d: 600, rot: 0 }] });
  // north wall (outside +X), east (-Y), west (+Y): two 6 m pieces each
  for (const o of [-300, 300]) {
    prop("westfarm:fort_wall", [FORT[0] + H, FORT[1] + o], 180, 320, { solid: wallSolid(600) });
    prop("westfarm:fort_wall", [FORT[0] + o, FORT[1] - H], 90, 320, { solid: wallSolid(600) });
    prop("westfarm:fort_wall", [FORT[0] + o, FORT[1] + H], -90, 320, { solid: wallSolid(600) });
  }
  // the south wall: the gatehouse in its middle, a short piece each side
  prop("westfarm:fort_gate", [FORT[0] - H, FORT[1]], 0, 360, { solid: [{ kind: "gate", x: -25, y: -240, w: 350, d: 160, rot: 0 }, { kind: "gate", x: -25, y: 240, w: 350, d: 160, rot: 0 }] });
  for (const s of [-1, 1]) prop("westfarm:fort_wall", [FORT[0] - H, FORT[1] + s * 460], 0, 160, { sy: 280 / 600, solid: wallSolid(280) });
  // inside: a fallen barrack, a dry well, relics of the last fight, abandoned stores
  prop("desert:ruin_wall", [FORT[0] + 450, FORT[1] + 250], 90, 300, { s: 0.8 });
  prop("desert:column_fallen", [FORT[0] + 100, FORT[1] - 450], 30, 260, { s: 0.7 });
  prop("frontier:battle_relics", [FORT[0] - 250, FORT[1] + 350], 20, 160, { solid: "none" });
  prop("bahamas:well", [FORT[0] + 150, FORT[1] + 50], 0, 140, { s: 0.9 });
  prop("frontier:rubble_pile", [FORT[0] + 550, FORT[1] - 500], 10, 200, { s: 0.7 });
  prop("common:crate", [FORT[0] - 300, FORT[1] + 520], 20, 60);
  prop("common:crate", [FORT[0] - 230, FORT[1] + 600], 55, 60);
  prop("trunrada:banner_pole", [FORT[0] - 1350, FORT[1] - 450], 0, 60);
  // the mesa top round the fort: scrub, bones, rocks
  scatter(["desert:dry_bush", "desert:dry_bush", "desert:grass_tuft"], 10, { x0: 1900, x1: 5200, y0: -4200, y1: -600 }, 100, { s: [0.7, 1.1], keep: (x, y) => Math.max(Math.abs(x - FORT[0]), Math.abs(y - FORT[1])) > H + 450 });
  prop("desert:bones", [4850, -2200], 50, 200, { solid: "none" });
  prop("desert:hoodoo", [4300, -3900], 20, 180, { s: 0.8 });

  // ---- the south-west mesa and the beacon on its butte ----
  prop("steppe:beacon_tower", BEACON, towards(1, -0.6), 400, { solid: STEPPE_SHAPES.beacon_tower });
  prop("trunrada:cairn", [BEACON[0] + 450, BEACON[1] + 450], 0, 100);
  prop("desert:bones", [BEACON[0] - 300, BEACON[1] - 800], 120, 200, { s: 0.8, solid: "none" });
  prop("bahamas:rock_arch", [-4300, 1500], 40, 0, { s: 0.6, solid: "none" });
  taken.push([-4300, 1500, 450]);
  prop("desert:cart_wreck", [-2300, 3300], 140, 300);
  prop("bahamas:caravan_tent", [-2500, 4200], towards(1, -0.4), 330, { s: 0.85 });
  prop("trunrada:campfire", [-2000, 3500], 0, 170);
  scatter(["desert:dry_bush", "desert:grass_tuft", "desert:boulder_flat"], 9, { x0: -4900, x1: -1700, y0: 800, y1: 4600 }, 100, { s: [0.6, 1] });

  // ---- the dry wash: cracked mud in its bed, the great skeleton, scattered bones ----
  prop("westfarm:giant_skeleton", SKELETON, 60, 700, {
    solid: [{ kind: "bone", x: -560, y: -30, r: 120 }, { kind: "bone", x: -250, y: 0, r: 60 }, { kind: "bone", x: 100, y: 0, r: 60 }, { kind: "bone", x: 350, y: 0, r: 50 }],
  });
  for (let i = 0; i < WASH.length; i++) {
    const [x, y] = WASH[i];
    if (Math.abs(x) > R - 200 || Math.abs(y) > R - 200 || Math.hypot(x - SKELETON[0], y - SKELETON[1]) < 900) continue;
    put("westfarm:cracked_earth", [x + (rnd() - 0.5) * 300, y + (rnd() - 0.5) * 300], rnd() * 360, { s: 0.8 + rnd() * 0.3 });
  }
  for (const at of [[-2400, -3400], [-3500, -2400], [-1600, -1100]] as XY[]) put("westfarm:cracked_earth", at, rnd() * 360, { s: 0.7 });
  prop("desert:bones", [-2100, -2000], 30, 200, { solid: "none" });
  prop("steppe:bones", [-3600, -3900], 80, 180, { solid: "none" });
  prop("desert:dead_tree", [-2500, -1500], 30, 150, ring(26, "tree"));

  // ---- the plain: cracked earth, thorn scrub, dry grass, dead trees, rocks, bones ----
  for (let i = 0, made = 0; i < 300 && made < 16; i++) {
    const x = IN.x0 + rnd() * (IN.x1 - IN.x0), y = IN.y0 + rnd() * (IN.y1 - IN.y0);
    if (nearTrack(x, y, 380) || !f.level(x, y, 250) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + 300)) continue;
    put("westfarm:cracked_earth", [x, y], rnd() * 360, { s: 0.7 + rnd() * 0.5 });
    taken.push([x, y, 150]);
    made++;
  }
  scatter(["desert:boulder_big", "desert:rock_cluster", "desert:boulder_flat"], 22, IN, 240, { s: [0.5, 0.95], keep: (x, y) => !nearExit(x, y) });
  scatter(["desert:hoodoo"], 4, IN, 180, { s: [0.6, 0.9] });
  scatter(["desert:butte"], 2, { x0: -R + 1200, x1: R - 1200, y0: -R + 1200, y1: R - 1200 }, 560, { s: [0.55, 0.7] });
  scatter(["desert:dead_tree"], 9, IN, 150, { s: [0.8, 1.1], solid: [{ kind: "tree", x: 0, y: 0, r: 26 }] });
  scatter(["desert:acacia"], 5, IN, 260, { s: [0.8, 1.05], solid: [{ kind: "tree", x: 0, y: 0, r: 34 }] });
  scatter(["desert:dry_bush"], 46, IN, 110, { s: [0.7, 1.15] });
  scatter(["desert:bones", "steppe:bones", "desert:bones"], 8, IN, 200, { solid: "none", keep: (x, y) => !nearExit(x, y) });
  scatter(["desert:fallen_log", "desert:stump"], 6, IN, 200);
  scatter(["steppe:scrub", "steppe:scrub"], 14, IN, 110, { s: [0.7, 1] });
  // dry grass everywhere it can grow
  const grassOut = (x: number, y: number) => nearTrack(x, y, 60) || !f.level(x, y, 90) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr * 0.8);
  // (as thick as the flowers are on the greener fields)
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["grass_tuft", "grass_tuft", "grass_patch"], grassOut, { count: Math.round(150 + 130 * quality.flowers), tries: 5000, spacing: 340, kit: "desert" });
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["grass_tuft"], grassOut, { count: 80, tries: 2000, spacing: 500, kit: "steppe" });

  // ---- past the edge: the dust, scrub and rocks going on, buttes ----
  const rim = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || nearTrack(x, y, 300);
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["dry_bush", "grass_patch", "grass_tuft", "boulder_big", "rock_cluster", "dead_tree", "acacia", "butte", "hoodoo"], rim, { count: 320, tries: 6000, spacing: 520, kit: "desert" });

  // ---- monsters: the plain, the wash, both mesas, the fort's courtyard ----
  const busy = (x: number, y: number) => Math.hypot(x - WS[0] + 300, y - WS[1]) < 1500 || Math.hypot(x - BEACON[0], y - BEACON[1]) < 500;
  f.monsterSpots(ground, IN, { step: 820, keepOut: busy, max: 46 });
  // and closer together over the fort's mesa, its courtyard too (the field's grid finds little
  // room up there between the walls)
  const taken0 = f.spots.length;
  f.monsterSpots(ground, { x0: 1900, x1: 5200, y0: -4100, y1: -700 }, { step: 520, max: 10, keepOut: (x, y) => f.spots.slice(0, taken0).some((p) => Math.hypot(p.x - x, p.y - y) < 500) });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "dry_plains_keeper", x: WS[0] - 520, y: WS[1] + 330, face: 190, name: "ฮาริส", title: "เจ้าของศาลาพักคาราวาน", role: "talk",
      look: { gender: "male", hair: "", hairColor: "ink", eyes: "amber", top: "top_warrior", bottom: "bottom_warrior_cocoa" },
      lines: [
        "แวะพักก่อนเถอะ น้ำในบ่อนี้เป็นน้ำจืดบ่อเดียวระหว่างเวนิชเซียกับขอบทะเลทราย",
        "ทางตะวันตกไปเวนิชเซีย เมืองแห่งสายน้ำ ส่วนทางตะวันออกออกไปขอบทะเลทราย เดินต่อลงใต้จะถึงบาฮามัส",
        "ป้อมบนผาตะวันออกเฉียงเหนือถูกทิ้งร้างตั้งแต่รุ่นพ่อข้า ตอนนี้มีแต่ตัวอะไรไม่รู้ยึดไปทำรัง",
      ],
    },
    {
      id: "dry_plains_beacon", x: BEACON[0] + 520, y: BEACON[1] - 200, face: 0, name: "เฒ่าอิดริส", title: "ผู้เฝ้าหอไฟ", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "teal", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "หอไฟนี้จุดทุกคืนมาร้อยปี กองคาราวานที่หลงในพายุฝุ่นเห็นไฟแล้วก็หาทางกลับได้",
        "จากตรงนี้เห็นลำธารแห้งทางตะวันออก กระดูกยักษ์ที่นอนอยู่ในนั้นไม่มีใครรู้ว่าเป็นตัวอะไร",
        "ดินแตกระแหงแบบนี้ ฝนไม่ตกมาสามฤดูแล้ว ทะเลทรายกินเข้ามาทุกปี",
      ],
    },
  ];

  return f.finishField({
    ground,
    sky: "#d6c08e",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 380, y: 4200 },
    npcs,
    labels: [
      { x: WAY_W[0], y: WAY_W[1] - 250, text: "ทางไปเวนิชเซีย", kind: "gate" },
      { x: WAY_E[0], y: WAY_E[1] + 250, text: "ทางไปขอบทะเลทราย", kind: "gate" },
      { x: WS[0] - 300, y: WS[1], text: "ศาลาพักคาราวาน" },
      { x: FORT[0] - 450, y: FORT[1], text: "ป้อมร้างบนผา" },
      { x: BEACON[0] + 400, y: BEACON[1], text: "หอไฟบนภูหิน" },
      { x: SKELETON[0], y: SKELETON[1] - 500, text: "โครงกระดูกยักษ์", kind: "small" },
      { x: -3500, y: -4100, text: "ลำธารแห้ง", kind: "small" },
      { x: -2500, y: 2900, text: "ผาตะวันตก", kind: "small" },
    ],
  });
}

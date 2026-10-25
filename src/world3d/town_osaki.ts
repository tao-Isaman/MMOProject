// โอซากิ (Osaki): the island town far out east, reached only by boat. Drawn as a plan the way
// the player draws them (a box of streets, rows of houses, plazas, gates and dots for people),
// but the box is an island: the sea on the west, north and south, and a stone wall with one
// gate on the east where the island's hills begin (Amatsu in Ragnarok sets the mood).
//
// The plan (plan pixels, u right = east, v down = south; 20 cm a pixel):
//   - the harbour on the west, facing the mainland: a stone quay (u 140) with three piers, junks
//     and sampans, a red torii standing in the sea off the main pier, kura storehouses along the
//     quay promenade and the landing square where everyone steps ashore (the spawn and the
//     travel guide);
//   - the main street of machiya townhouses and shops running east from the landing square,
//     through the town square at the crossroads, to the shrine: a line of torii gates up the
//     approach, stone lanterns either side, the shrine hall in its walled precinct;
//   - north of it the north lane to the temple precinct on the high side of town (the
//     five-storey pagoda, a zen garden, the temple's thatched quarters), and between the lane
//     and the sea the cherry-tree park along the north shore;
//   - south of it the south lane from the harbour to the mountain gate (closed): the tea
//     house garden (koi pond, the red taiko bridge, stepping stones, bamboo fences), the
//     farmhouses and rice paddies on the edge, the fishermen's beach on the south-west shore;
//   - the cross street from the north shore to a fishing jetty on the south shore.
// Stone walls and bamboo fences instead of a city wall; cherry trees everywhere.
//
// Everything placed here comes from the town kits; the whole town is built at full size and
// drawn at TOWN_SCALE.

import * as THREE from "three";
import { material, defineMaterial } from "./textures";
import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import { KIT } from "./kits/osaki";
import { Plan, TownBuilder, useKits, colourways, facing, FACE, travelGuide, gateWay, waysOut } from "./town";
import type { Side, Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(KIT);

// Colourways: the same townhouses with other curtains, plaster and lattice.
defineMaterial("OsakiTown_PlasterOchre", { map: "plaster", tint: "#e4c79b", bump: 0.6 });
defineMaterial("OsakiTown_PlasterRose", { map: "plaster", tint: "#ecd2c4", bump: 0.6 });
defineMaterial("OsakiTown_KawaraDark", { map: "tiles", tint: "#4a505d", bump: 2.5 });
defineMaterial("OsakiTown_KawaraWarm", { map: "tiles", tint: "#6e6964", bump: 2.5 });
defineMaterial("OsakiTown_KawaraBlue", { map: "tiles", tint: "#566779", bump: 2.5 });
colourways({
  "osaki-red": { FabricNavy: "FabricRed", RoofKawara: "OsakiTown_KawaraDark" },
  "osaki-green": { FabricNavy: "FabricGreen", PlasterCream: "Osaki_Shikkui" },
  "osaki-ochre": { FabricNavy: "FabricPurple", PlasterCream: "OsakiTown_PlasterOchre", WoodRed: "WoodDark", RoofKawara: "OsakiTown_KawaraWarm" },
  "osaki-rose": { FabricNavy: "FabricGold", PlasterCream: "OsakiTown_PlasterRose", RoofKawara: "OsakiTown_KawaraBlue" },
  "osaki-white": { Osaki_Kuro: "Osaki_Shikkui", FabricNavy: "FabricRed" },
});

// ---- the plan's pixels -> the world: 20 cm a pixel, the town square at the origin ----
const { P, rect } = new Plan(20, 520, 450);

// The island's coast round the town (plan pixels, in order): the harbour quay on the west,
// the north shore, on east past the wall where the island runs on into its hills, and back
// along the south shore.
const QUAY_U = 140, QUAY_V0 = 240, QUAY_V1 = 690;
const COAST: [number, number][] = [
  [QUAY_U, QUAY_V1], [QUAY_U, QUAY_V0],
  [146, 212], [162, 184], [188, 158], [222, 136], [262, 120], [310, 108], [365, 101], [425, 97], [490, 96], [560, 93], [630, 87],
  [700, 82], [770, 80], [840, 82], [905, 77], [960, 71], [1020, 62], [1090, 48], [1170, 28], [1260, 6], [1400, -30], [1600, -70],
  [1600, 1200],
  [1400, 1040], [1260, 960], [1160, 905], [1080, 878], [1010, 862], [960, 853], [900, 847], [830, 843], [760, 846], [690, 843],
  [620, 838], [550, 836], [480, 839], [410, 841], [345, 833], [290, 819], [240, 797], [200, 769], [168, 736], [148, 712],
];

// the town's main lines
const EAST = 960;                       // the stone wall on the inland side
const GATE_V = 610;                     // the mountain gate in it, at the end of the south lane
const PIERS = [330, 450, 570];          // piers out from the quay (v)

export function buildOsaki(quality: { flowers: number }): Town {
  const town = new TownBuilder(23);
  const { put, rnd, extra } = town;

  // ---- ground: streets (cobbles), squares and the quay (flagstones), the sea round it all ----
  const roads: Poly[] = [
    rect(335, 420, 720, 480),   // the main street, from the landing square to the shrine
    rect(490, 140, 540, 395),   // the cross street, north part (to the north shore)
    rect(490, 505, 540, 830),   // and south part (to the fishing jetty)
    rect(150, 210, 640, 240),   // the north lane, from the quay to the temple gate
    rect(150, 595, EAST + 10, 625), // the south lane, from the quay to the mountain gate
    rect(EAST, 595, EAST + 200, 625), // the path on into the hills
  ];
  const plazas: Poly[] = [
    rect(QUAY_U, QUAY_V0, 202, QUAY_V1), // the quay promenade
    rect(200, 365, 335, 535),            // the landing square
    rect(462, 395, 568, 505),            // the town square at the crossroads
    rect(720, 425, 872, 475),            // the shrine approach under the torii
    rect(830, 385, 872, 515),            // the shrine court
    rect(640, 212, 760, 238),            // the temple path
    rect(752, 172, 848, 284),            // the pagoda court
  ];
  const coastW = COAST.map(([u, v]) => P(u, v));
  // the sea: everything in the ground's area outside the coast (one ring round, a cut in, the
  // coast the other way round)
  const AREA = { x0: P(0, 1180)[0], x1: P(0, -140)[0], y0: P(1500, 0)[1], y1: P(100, 0)[1] };
  const outer: [number, number][] = [[AREA.x0 - 100, AREA.y0 - 100], [AREA.x1 + 100, AREA.y0 - 100], [AREA.x1 + 100, AREA.y1 + 100], [AREA.x0 - 100, AREA.y1 + 100]];
  const signed = (ring: [number, number][]) => ring.reduce((s, [x, y], i) => { const [x2, y2] = ring[(i + 1) % ring.length]; return s + x * y2 - x2 * y; }, 0);
  const inner = Math.sign(signed(coastW)) === Math.sign(signed(outer)) ? [...coastW].reverse() : coastW;
  const seaRing: Poly = [...outer, outer[0], inner[0], ...inner, inner[0], outer[0]];
  const ground = buildPaved({ area: AREA, roads, plazas, water: [seaRing], base: "grass", road: [0.72, 0.70, 0.66], plaza: [0.88, 0.86, 0.80] });
  // whether a world point is on the island
  const onLand = (x: number, y: number) => {
    let inside = false;
    for (let i = 0, j = coastW.length - 1; i < coastW.length; j = i++) {
      const [xi, yi] = coastW[i], [xj, yj] = coastW[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };

  // ---- pieces with their own solids ----
  const POST: SolidSpec[] = [{ kind: "post", x: 0, y: 0, r: 20 }];
  const lanternPost = (u: number, v: number, f: number) => put("osaki:lantern_post", P(u, v), f, { solid: POST });
  const stoneLantern = (u: number, v: number, s = 1) => put("osaki:stone_lantern", P(u, v), rnd() * 20 - 10, { s });
  const tree = (kind: string, u: number, v: number, s = 0.75 + rnd() * 0.2) => put(`flora:${kind}`, P(u, v), rnd() * 360, { s });
  const torii = (u: number, v: number, f: number, s = 1) => put("osaki:torii", P(u, v), f, { s, solid: [{ kind: "post", x: 0, y: -235, r: 30 }, { kind: "post", x: 0, y: 235, r: 30 }] });

  // ---- walls: tile-capped stone walls round the precincts and along the inland side ----
  const wall = (a: [number, number], b: [number, number], out: Side, gaps: number[] = [], gap = 600) =>
    town.wall(P(a[0], a[1]), P(b[0], b[1]), out, "osaki:stone_wall", { gaps: gaps.map((g) => g * 20), len: 600, gap });
  // the east wall, from the north shore to the south shore, the mountain gate in it
  wall([EAST, 74], [EAST, 850], "e", [GATE_V - 74]);
  // the temple precinct (north-east): its gate at the end of the north lane
  wall([640, 110], [640, 345], "w", [225 - 110]);
  wall([640, 110], [EAST, 110], "n");
  wall([640, 345], [EAST, 345], "s");
  // the shrine precinct (east): open on the west where the main street comes in
  wall([720, 345], [720, 555], "w", [450 - 345], 1240);
  wall([720, 555], [EAST, 555], "s");
  // the gates: a roofed gate with solids either side of the way through
  const gateSolid: SolidSpec[] = [
    { kind: "gate", x: 0, y: -245, w: 260, d: 130, rot: 0 },
    { kind: "gate", x: 0, y: 245, w: 260, d: 130, rot: 0 },
  ];
  put("osaki:mon_gate", P(EAST, GATE_V), FACE.e, { solid: gateSolid });
  // corner turrets where the east wall meets the sea, and where the precincts join it
  for (const v of [92, 345, 832]) put("osaki:yagura", P(EAST, v), FACE.e, { solid: [{ kind: "tower", x: 0, y: 0, w: 640, d: 640, rot: 0 }] });
  put("osaki:mon_gate", P(640, 225), FACE.w, { solid: gateSolid });

  // ---- houses: machiya wall to wall along the streets, kura storehouses on the quay ----
  const STREET = ["machiya", "machiya", "shop", "machiya", "machiya", "machiya", "shop"];
  const LANE = ["machiya"];
  const TINTS = ["", "osaki-red", "osaki-green", "osaki-ochre", "", "osaki-rose", "osaki-red"];
  const terrace = (a: [number, number], b: [number, number], side: Side, pieces = STREET, start = 0, tints = TINTS) =>
    town.terrace(P(a[0], a[1]), P(b[0], b[1]), side, pieces, { start, kit: "osaki", tints, narrow: "machiya" });
  // the quay: storehouses facing the water, north and south of the landing square
  terrace([202, 245], [202, 362], "w", ["shop"], 0, ["", "osaki-white"]);
  terrace([202, 540], [202, 590], "w", ["shop"], 0, ["osaki-white"]);
  terrace([202, 628], [202, 688], "w", ["shop"], 0, [""]);
  // round the landing square
  terrace([255, 363], [335, 363], "s", LANE, 0);
  terrace([255, 537], [335, 537], "n", LANE, 0);
  // the main street, both sides, either side of the town square
  terrace([337, 418], [460, 418], "s", STREET, 0);
  terrace([570, 418], [716, 418], "s", STREET, 2);
  terrace([337, 482], [460, 482], "n", STREET, 2);
  terrace([570, 482], [716, 482], "n", STREET, 5);
  // the cross street
  terrace([488, 245], [488, 367], "e", LANE, 0);
  terrace([542, 245], [542, 367], "w", LANE, 0);
  terrace([488, 535], [488, 593], "e", LANE, 0);
  terrace([542, 535], [542, 593], "w", LANE, 0);
  terrace([488, 627], [488, 710], "e", LANE, 0);
  // the north lane
  terrace([212, 208], [486, 208], "s", STREET, 1);
  terrace([546, 208], [636, 208], "s", LANE, 0);
  terrace([255, 242], [434, 242], "n", LANE, 0);
  terrace([596, 242], [636, 242], "n", LANE, 0);
  // the south lane
  terrace([337, 593], [434, 593], "s", LANE, 0);
  terrace([596, 593], [716, 593], "s", STREET, 4);
  terrace([255, 627], [434, 627], "n", LANE, 0);

  // ---- the harbour: the quay, piers, boats, the torii in the sea ----
  // the quay wall along the water (4 m stones, their face on the coast)
  {
    const [x0] = P(0, QUAY_V1), [x1] = P(0, QUAY_V0), y = P(QUAY_U, 0)[1];
    const n = Math.round((x1 - x0) / 400);
    for (let i = 0; i < n; i++) put("osaki:quay", [x0 + ((i + 0.5) * (x1 - x0)) / n, y - 74], FACE.w, { sy: (x1 - x0) / n / 400, solid: "none" });
  }
  // the piers: 4 m sections out from the quay, the main one longest
  const pierLen = (v: number) => (v === 450 ? 7 : 6);
  for (const v of PIERS)
    for (let i = 0; i < pierLen(v); i++) put("osaki:pier", [P(0, v)[0], P(QUAY_U - 10 - 20 * i, 0)[1]], 0, { z: -28, solid: "none" });
  // big stone lanterns at the pier heads and the quay's ends (the harbour lights)
  for (const v of PIERS) put("osaki:stone_lantern", P(QUAY_U - 20 * pierLen(v) + 5, v - 5), 0, { s: 1.2, z: 18, solid: [{ kind: "post", x: 0, y: 0, r: 40 }] });
  put("osaki:stone_lantern", P(152, QUAY_V0 + 8), 0, { s: 1.6 });
  put("osaki:stone_lantern", P(152, QUAY_V1 - 8), 0, { s: 1.6 });
  // boats: junks alongside the piers, one riding out in the roads, sampans everywhere
  put("osaki:junk", P(78, 433), FACE.w, { z: -70 });
  put("osaki:junk", P(90, 587), FACE.w, { z: -70 });
  put("osaki:junk", P(-60, 360), -60, { z: -70 });
  for (const [u, v, h] of [[112, 380, 95], [118, 512, -85], [60, 352, 92], [96, 548, -95], [40, 476, 88], [118, 300, 100], [-20, 560, 70], [118, 655, -80]] as const)
    put("osaki:sampan", P(u, v), h, { z: -40 });
  // the great torii standing in the sea off the main pier
  put("osaki:torii", P(-46, 450), FACE.w, { s: 1.7, z: -40, solid: "none" });
  // lanterns, cargo and stalls on the quay
  for (const v of [262, 300, 360, 400, 500, 540, 610, 650]) lanternPost(194, v, FACE.w);
  for (const [u, v, h] of [[176, 268, 0], [176, 662, 0]] as const) put("osaki:sake_barrels", P(u, v), h);
  for (const [u, v] of [[160, 286], [166, 292], [160, 640], [168, 600], [172, 340], [186, 625]] as const) put("common:crate", P(u, v), rnd() * 90);
  put("osaki:yatai", P(186, 392), FACE.w);
  put("osaki:yatai", P(186, 512), FACE.w, { colours: "osaki-red" });

  // ---- the landing square: where everyone steps ashore. A fish market of stalls along its
  // sides, a well, and a great torii where the main street sets off for the shrine ----
  put("osaki:well", P(300, 450), FACE.w);
  for (const [u, v] of [[212, 372], [212, 528], [326, 372], [326, 528]] as const) lanternPost(u, v, facing(268 - u, 450 - v));
  for (const [i, u] of [232, 262, 292].entries()) {
    put("osaki:yatai", P(u, 380), FACE.s, { colours: i === 1 ? "osaki-red" : undefined });
    put("osaki:yatai", P(u, 520), FACE.n, { colours: i === 1 ? undefined : "osaki-red" });
  }
  for (const [u, v] of [[218, 392], [306, 508], [247, 394]] as const) put("common:crate", P(u, v), rnd() * 90);
  put("common:bench", P(300, 432), FACE.w);
  put("common:bench", P(300, 468), FACE.w);
  put("common:sign_post", P(322, 412), FACE.w);
  torii(338, 450, FACE.w, 1.35);
  for (const v of [404, 496]) stoneLantern(332, v, 1.1);
  tree("Cherry", 322, 392, 0.8);
  tree("Cherry", 322, 508, 0.8);
  // cherry trees in a row either side of the way up from the main pier
  for (const u of [216, 252, 288]) for (const v of [404, 496]) if (u > 220 || v > 450) tree("Cherry", u, v, 0.7);

  // ---- the lanes: lanterns along them, cherries along the shrine's south wall ----
  for (let u = 232; u <= 625; u += 44) {
    if (u > 470 && u < 560) continue;
    lanternPost(u, 214, FACE.s);
    lanternPost(u + 22, 236, FACE.n);
  }
  for (let u = 232; u <= 930; u += 44) {
    if (u > 470 && u < 560) continue;
    if (u < 720) lanternPost(u, 599, FACE.s);
    lanternPost(u + 22, 621, FACE.n);
  }
  for (let u = 738; u <= 940; u += 30) tree("Cherry", u, 576, 0.75 + rnd() * 0.15);

  // ---- the main street: lanterns down both sides ----
  for (let u = 350; u <= 705; u += 38) {
    if (u > 452 && u < 576) continue;
    lanternPost(u, 428, FACE.s);
    lanternPost(u + 19, 472, FACE.n);
  }
  put("osaki:sake_barrels", P(388, 475), FACE.n);

  // ---- the town square at the crossroads ----
  put("osaki:well", P(515, 450), 0);
  for (const [u, v] of [[503, 436], [527, 464]] as const) stoneLantern(u, v, 0.9);
  // a cherry tree and a stall in the corners between the streets
  tree("Cherry", 474, 406, 0.85);
  tree("Cherry", 556, 494, 0.85);
  put("osaki:yatai", P(555, 404), FACE.s);
  put("osaki:yatai", P(475, 496), FACE.n, { colours: "osaki-red" });
  put("common:bench", P(503, 466), FACE.e);
  put("common:bench", P(527, 434), FACE.w);
  // lanterns up and down the cross street
  for (const v of [270, 330, 380]) { lanternPost(495, v, FACE.e); lanternPost(535, v + 20, FACE.w); }
  for (const v of [520, 580, 650, 720, 790]) { lanternPost(495, v, FACE.e); if (v < 620) lanternPost(535, v + 15, FACE.w); }

  // ---- the shrine: a line of torii up the approach, lanterns either side, the hall ----
  for (const u of [732, 766, 800, 834]) torii(u, 450, FACE.w);
  for (const u of [748, 782, 816, 850]) for (const v of [416, 484]) stoneLantern(u, v);
  put("osaki:shrine_hall", P(905, 450), FACE.w);
  // the purification well, the sake offering and lantern posts round the court
  put("osaki:well", P(850, 372), FACE.s);
  put("osaki:sake_barrels", P(905, 512), FACE.n);
  put("osaki:sake_barrels", P(905, 388), FACE.s);
  for (const [u, v] of [[838, 392], [838, 508]] as const) lanternPost(u, v, FACE.e);
  // the sacred grove behind and round it
  for (const [u, v] of [[932, 374], [950, 405], [948, 498], [942, 540], [870, 360], [740, 360], [780, 365], [735, 540], [790, 538], [880, 540]] as const)
    tree(rnd() < 0.4 ? "Pine" : "Cherry", u, v, 0.85);
  // a festival stall by the precinct wall
  put("osaki:yatai", P(760, 520), FACE.n, { colours: "osaki-red" });
  put("osaki:yatai", P(800, 522), FACE.n);

  // ---- the temple precinct: the five-storey pagoda on the high side of town ----
  put("osaki:pagoda", P(800, 228), FACE.w);
  for (const u of [662, 694, 726]) for (const v of [204, 246]) stoneLantern(u, v);
  for (const [u, v] of [[752, 172], [848, 172], [752, 284], [848, 284]] as const) stoneLantern(u, v, 1.15);
  // the zen garden: raked gravel in a low frame (3 x 2 tiles)
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) put("osaki:zen_garden", P(870 + 20 * i, 300 + 20 * j), 0, { solid: [{ kind: "garden", x: 0, y: 0, w: 400, d: 400, rot: 0 }] });
  put("common:bench", P(880, 284), FACE.s);
  // the temple's quarters (thatched) and its well
  put("osaki:farmhouse", P(900, 165), FACE.w);
  put("osaki:well", P(700, 300), FACE.e);
  // a pond in the corner by the gate
  put("osaki:koi_pond", P(700, 150), FACE.e);
  for (const [u, v] of [[675, 135], [726, 168]] as const) stoneLantern(u, v, 0.9);
  // trees: cherries and maples round the court, pines by the walls, bamboo in the corner
  for (const [u, v, k] of [
    [662, 160, "Cherry"], [740, 135, "Cherry"], [665, 305, "Cherry"], [740, 320, "AutumnTree"], [780, 320, "Cherry"],
    [820, 320, "Pine"], [860, 230, "AutumnTree"], [870, 125, "Pine"], [940, 130, "Bamboo"], [945, 220, "Bamboo"], [940, 250, "Pine"],
    [780, 140, "Cherry"], [830, 135, "AutumnTree"], [690, 330, "Pine"], [924, 322, "Cherry"],
  ] as const) tree(k, u, v, k === "Bamboo" ? 1 : 0.85);

  // ---- the tea house garden (south): koi pond, red bridge, stepping stones ----
  const fence = (a: [number, number], b: [number, number], gaps: [number, number][] = []) => {
    const A = P(a[0], a[1]), B = P(b[0], b[1]);
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.round(L / 418);
    const h = (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI - 90;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, u = a[0] + (b[0] - a[0]) * t, v = a[1] + (b[1] - a[1]) * t;
      if (gaps.some(([g0, g1]) => (a[0] === b[0] ? v : u) > g0 && (a[0] === b[0] ? v : u) < g1)) continue;
      put("osaki:bamboo_fence", P(u, v), h, { sy: L / n / 418 });
    }
  };
  fence([548, 632], [778, 632], [[628, 672]]);
  fence([548, 632], [548, 810], [[690, 715]]);
  fence([778, 632], [778, 800]);
  put("osaki:tea_house", P(600, 690), FACE.e);
  put("osaki:koi_pond", P(700, 668), FACE.s);
  put("osaki:taiko_bridge", P(690, 745), FACE.s, { solid: [
    { kind: "pond", x: 0, y: -300, w: 420, d: 220, rot: 0 },
    { kind: "pond", x: 0, y: 300, w: 420, d: 220, rot: 0 },
    { kind: "rail", x: 0, y: -113, w: 760, d: 22, rot: 0 },
    { kind: "rail", x: 0, y: 113, w: 760, d: 22, rot: 0 },
  ] });
  for (const [u, v, h] of [[650, 650, 8], [652, 667, -8], [659, 683, -28], [671, 697, -48], [684, 709, -40]] as const) put("osaki:stepping_stones", P(u, v), h, { s: 0.8 });
  for (const [u, v] of [[630, 650], [740, 650], [640, 740], [735, 790], [580, 790]] as const) stoneLantern(u, v);
  for (const [u, v, k] of [
    [565, 645, "Bamboo"], [565, 740, "Bamboo"], [760, 650, "AutumnTree"], [760, 700, "Cherry"], [600, 760, "Cherry"], [650, 790, "AutumnTree"],
    [760, 780, "Pine"], [720, 705, "Cherry"], [620, 740, "AutumnTree"], [570, 800, "Pine"],
  ] as const) tree(k, u, v, k === "Bamboo" ? 1 : 0.8);
  put("common:bench", P(735, 700), FACE.w);

  // ---- the farms on the edge (south-east): thatched farmhouses and rice paddies ----
  put("osaki:farmhouse", P(815, 675), FACE.n);
  put("osaki:farmhouse", P(905, 675), FACE.n);
  put("osaki:well", P(860, 690), FACE.n);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) put("osaki:rice_paddy", P(802 + 33 * i, 732 + 33 * j), 0, { solid: [{ kind: "paddy", x: 0, y: 0, w: 560, d: 560, rot: 0 }] });
  fence([780, 712], [780, 822]);
  fence([945, 712], [945, 830]);
  for (const [u, v, k] of [[795, 640, "Bamboo"], [940, 645, "Bamboo"], [860, 650, "Pine"], [950, 700, "Cherry"], [790, 835, "Pine"], [935, 840, "Pine"]] as const) tree(k, u, v, 0.9);

  // ---- the north shore: cherry trees along the sea, a torii on the shore ----
  torii(515, 132, FACE.n, 1.1);
  for (const [u, v] of [[488, 148], [542, 148]] as const) stoneLantern(u, v);
  const northCoast = (u: number) => {
    for (let i = 2; i < COAST.length - 1; i++) {
      const [ua, va] = COAST[i], [ub, vb] = COAST[i + 1];
      if (u >= ua && u <= ub) return va + ((vb - va) * (u - ua)) / (ub - ua);
    }
    return 100;
  };
  for (let u = 232; u <= 625; u += 32) {
    if (u > 470 && u < 560) continue;
    tree("Cherry", u, Math.min(150, northCoast(u) + 24 + rnd() * 10), 0.8 + rnd() * 0.2);
  }
  for (const u of [260, 380, 600]) put("common:bench", P(u, 146), FACE.n);
  for (const u of [320, 440, 580]) stoneLantern(u, 146);

  // ---- the fishermen's beach (south-west) ----
  put("osaki:farmhouse", P(290, 735), FACE.s);
  put("osaki:farmhouse", P(390, 745), FACE.s);
  put("osaki:sampan", P(330, 812), -15, { z: -16 });
  put("osaki:sampan", P(440, 818), 20, { z: -16 });
  for (const [u, v] of [[235, 700], [340, 698], [430, 712]] as const) tree("Cherry", u, v, 0.8);
  // the fishing jetty at the end of the cross street
  for (let i = 0; i < 3; i++) put("osaki:pier", P(515, 845 + 20 * i), 90, { z: -28, solid: "none" });
  put("osaki:sampan", P(488, 880), 0, { z: -40 });
  put("osaki:sampan", P(545, 870), 180, { z: -40 });

  // ---- the shore all round: rocks and beaches on the coast, pines leaning over it ----
  const SAND = (u: number, v: number) => (v < 200 && u > 380 && u < 640) || (v > 780 && u > 250 && u < 470) || (v > 800 && u > 560 && u < 760);
  for (let i = 0; i < COAST.length; i++) {
    const a = COAST[i], b = COAST[(i + 1) % COAST.length];
    if (a[0] === QUAY_U && b[0] === QUAY_U) continue; // the quay
    const A = P(a[0], a[1]), B = P(b[0], b[1]);
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    // the sea side of this stretch
    const dx = (B[0] - A[0]) / L, dy = (B[1] - A[1]) / L;
    let nx = dy, ny = -dx;
    if (onLand((A[0] + B[0]) / 2 + nx * 60, (A[1] + B[1]) / 2 + ny * 60)) [nx, ny] = [-nx, -ny];
    const head = (Math.atan2(-ny, -nx) * 180) / Math.PI; // the piece's -X to the sea
    for (let t = 0; t < L; t += 0) {
      const mid = (a2: number) => [A[0] + dx * a2, A[1] + dy * a2] as [number, number];
      const [mx, my] = mid(t + 200);
      const u = 520 - my / 20, v = 450 - mx / 20;
      if (u > EAST + 220) break;
      const sand = SAND(u, v);
      const step = sand ? 600 : 300 + rnd() * 150;
      if (v > 800 && Math.abs(u - 515) < 16) { t += step; continue; } // the jetty's root
      const [px, py] = mid(Math.min(t + step / 2, L));
      put(sand ? "osaki:beach" : "osaki:shore_rocks", [px, py], head + (sand ? 0 : rnd() * 30 - 15), { s: sand ? 1 : 0.85 + rnd() * 0.4, solid: "none" });
      t += step;
    }
  }
  // pines on the headlands
  for (const [u, v] of [[170, 200], [200, 170], [178, 720], [222, 760], [625, 114], [700, 96], [870, 94], [922, 838]] as const) tree("Pine", u, v, 0.85 + rnd() * 0.2);

  // ---- the sea is solid, but for the piers and the jetty ----
  const SEA_D = 3000;
  const seaBox = (A: [number, number], B: [number, number], extA = 250, extB = extA) => {
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const dx = (B[0] - A[0]) / L, dy = (B[1] - A[1]) / L;
    let nx = dy, ny = -dx;
    if (onLand((A[0] + B[0]) / 2 + nx * 60, (A[1] + B[1]) / 2 + ny * 60)) [nx, ny] = [-nx, -ny];
    const c = (extB - extA) / 2;
    extra.push({ kind: "sea", x: (A[0] + B[0]) / 2 + dx * c + (nx * SEA_D) / 2, y: (A[1] + B[1]) / 2 + dy * c + (ny * SEA_D) / 2, w: L + extA + extB, d: SEA_D, rot: (Math.atan2(dy, dx) * 180) / Math.PI });
  };
  // along the quay, cut where the piers go out
  {
    const cuts = [QUAY_V0, ...PIERS.flatMap((v) => [v - 9, v + 9]), QUAY_V1];
    for (let i = 0; i < cuts.length; i += 2) seaBox(P(QUAY_U, cuts[i]), P(QUAY_U, cuts[i + 1]), 0);
    for (const v of PIERS) {
      const end = QUAY_U - 20 * pierLen(v);
      extra.push({ kind: "sea", x: P(0, v)[0], y: P(end - 10, 0)[1], w: 400, d: 400, rot: 0 });
    }
  }
  // round the rest of the coast, but where the jetty goes out
  for (let i = 1; i < COAST.length; i++) {
    const a = COAST[i], b = COAST[(i + 1) % COAST.length];
    if ((a[0] > EAST + 120 && b[0] > EAST + 120) || a[0] === b[0] && a[0] > 1500) continue;
    if (Math.min(a[0], b[0]) <= 515 && Math.max(a[0], b[0]) >= 515 && a[1] > 800) {
      // the jetty: the shore either side of it, a cap past its end
      const vm = a[1] + ((b[1] - a[1]) * (515 - a[0])) / (b[0] - a[0]), sa = Math.sign(a[0] - 515);
      seaBox(P(a[0], a[1]), P(515 + 8 * sa, vm), 250, 0);
      seaBox(P(515 - 8 * sa, vm), P(b[0], b[1]), 0, 250);
      extra.push({ kind: "sea", x: P(0, 905)[0], y: P(515, 0)[1], w: 400, d: 400, rot: 0 });
      continue;
    }
    seaBox(P(a[0], a[1]), P(b[0], b[1]));
  }

  // ---- the greens left between: cherry trees most of all ----
  const [X0, Y1] = P(QUAY_U, 860), [X1, Y0] = P(EAST, 70);
  const n0 = town.puts.length;
  town.greens(ground, { x0: X0, x1: X1, y0: Y0, y1: Y1 }, { trees: ["Cherry", "Cherry", "Cherry", "Pine", "AutumnTree", "Cherry", "Bamboo"], other: "osaki:stone_lantern", chance: 0.85, step: 480, margin: 300 });
  // but not on the garden's paths, the stepping stones or the zen garden
  const KEEP_CLEAR = [[640, 640, 700, 720], [670, 705, 715, 790], [855, 285, 935, 340]];
  const greens = town.puts.splice(n0).filter((pl) => {
    const u = 520 - pl.y / 20, v = 450 - pl.x / 20;
    return !KEEP_CLEAR.some(([u0, v0, u1, v1]) => u > u0 && u < u1 && v > v0 && v < v1);
  });
  town.puts.push(...greens);

  // ---- outside the wall: the island's wooded hills ----
  town.woods({ x0: P(0, 860)[0], x1: P(0, 60)[0], y0: P(1400, 0)[1], y1: P(EAST + 20, 0)[1] }, ["Pine", "Pine", "Cherry", "AutumnTree", "Bamboo", "PineSmall"], (x, y) => {
    const u = 520 - y / 20, v = 450 - x / 20;
    return !onLand(x, y) || u < EAST + 40 || (Math.abs(v - GATE_V) < 30 && u < EAST + 400) || !onLand(x + 400, y) || !onLand(x - 400, y);
  }, { count: 300, spacing: 360 });
  // the path on up into the hills: lanterns and a torii past the gate
  for (const u of [1000, 1040, 1120]) for (const v of [588, 632]) stoneLantern(u, v);
  torii(1080, 610, FACE.w, 1.1);
  for (const [u, v] of [[1010, 660], [1030, 560], [1150, 650], [1100, 545], [1200, 600]] as const) tree("Bamboo", u, v, 1.1);

  // ---- rocky islets off the shore, a pine on each ----
  for (const [u, v, r] of [[40, 170, 260], [30, 760, 220], [1080, 905, 240]] as const) {
    const [cx, cy] = P(u, v);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + u;
      put("osaki:shore_rocks", [cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55], (Math.atan2(-Math.sin(a), -Math.cos(a)) * 180) / Math.PI, { s: r / 230, solid: "none" });
    }
    put("flora:Pine", [cx, cy], rnd() * 360, { z: -6, s: 0.8, solid: "none" });
  }

  // the tool shop: the kura on the main street's south side, east of the town square
  const shopPl = town.puts.find((pl) => pl.ref === "osaki:shop" && 450 - pl.x / 20 > 482 && 520 - pl.y / 20 > 560 && 520 - pl.y / 20 < 720);
  const shopFront: [number, number] = shopPl ? [P(0, 470)[0], shopPl.y] : P(640, 470);

  // ---- build ----
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000).rotateX(-Math.PI / 2), material("WaterSea"));
  sea.position.set(0, -12, 0);
  sea.receiveShadow = true;
  const pt = (u: number, v: number) => ({ x: P(u, v)[0], y: P(u, v)[1] });
  const [gx, gy] = P(EAST, GATE_V);
  return town.finish({
    ground,
    scenery: [sea],
    sky: "#2f6f8f",
    flowers: {
      box: { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 },
      open: (x, y) => ground.kind(x, y) === 0 && onLand(x, y) && onLand(x + 200, y) && onLand(x - 200, y) && onLand(x, y + 200) && onLand(x, y - 200) && y > gy + 200,
      density: 0.3 * quality.flowers,
    },
    bounds: { minX: P(0, 880)[0], maxX: P(0, 45)[0], minY: P(EAST + 32, 0)[1], maxY: P(0, 0)[1] },
    spawn: pt(240, 452),
    npcs: osakiNpcs(shopFront),
    // the mountain gate: up into the bamboo and the sakura hills, and on to the volcano
    ...waysOut([gateWay([gx, gy], "e", "sakura_hills", 450, 420)]),
    closed: [],
    labels: [
      { ...pt(150, 560), text: "ท่าเรือโอซากิ" },
      { ...pt(270, 470), text: "ลานท่าเรือ", kind: "small" },
      { ...pt(8, 450), text: "โทริอิกลางทะเล", kind: "small" },
      { ...pt(400, 450), text: "ถนนการค้า" },
      { ...pt(515, 470), text: "ลานกลางเมือง", kind: "small" },
      { ...pt(850, 450), text: "ศาลเจ้า" },
      { ...pt(780, 452), text: "ทางเดินโทริอิ", kind: "small" },
      { ...pt(800, 290), text: "วัดเจดีย์ห้าชั้น" },
      { ...pt(848, 312), text: "สวนหินเซน", kind: "small" },
      { ...pt(660, 700), text: "สวนโรงน้ำชา" },
      { ...pt(700, 720), text: "สะพานโค้งแดง", kind: "small" },
      { ...pt(860, 712), text: "หมู่บ้านชาวนา" },
      { ...pt(380, 140), text: "สวนซากุระริมทะเล" },
      { ...pt(340, 790), text: "หาดชาวประมง", kind: "small" },
      { ...pt(515, 820), text: "ท่าเรือประมง", kind: "small" },
      { x: gx, y: gy + 250, text: "ประตูภูเขา · เนินซากุระ", kind: "gate" },
    ],
  });
}

// ---- the people of Osaki ----
function osakiNpcs(shop: [number, number]): NpcSpec[] {
  const at = (u: number, v: number) => {
    const [x, y] = P(u, v);
    return { x, y };
  };
  const samurai = (top: string, hairColor = "ink") => ({ gender: "male", hair: "", hairColor, eyes: "amber", top, bottom: "bottom_warrior_black" });
  return [
    travelGuide("osaki", P(226, 428), facing(1, 1), "ฮารุกะ"),
    { id: "osaki_harbourmaster", ...at(172, 470), face: 90, name: "โยชิดะ", title: "นายท่าเรือ", role: "talk", look: samurai("top_warrior_navy", "silver"),
      lines: ["ยินดีต้อนรับสู่เกาะโอซากิ ทุกคนมาถึงทางเรือที่ท่านี้แหละ", "เรือสำเภาจากแผ่นดินใหญ่เข้าออกทุกน้ำขึ้น ส่วนเรือแจวเป็นของชาวประมงบนเกาะ", "เห็นโทริอิแดงกลางทะเลไหม เรือทุกลำแล่นลอดมันก่อนเข้าท่า เป็นการขอพรเทพแห่งท้องทะเล"] },
    { id: "osaki_captain", ...at(92, 446), face: -90, name: "กัปตันมัตสึ", title: "เรือโดยสาร · อีเดน", role: "travel", ports: ["eden"], look: samurai("top_warrior", "auburn"),
      lines: ["ข้าล่องเรือระหว่างโอซากิกับท่าเรืออีเดนทางตะวันตก ขึ้นเรือไหม", "บางเที่ยวก็แล่นไปโยเดียทางตะวันตกเฉียงใต้ ขนผ้าไหมกับสาเกไปขาย"] },
    { id: "osaki_shop", x: shop[0], y: shop[1], face: 0, name: "โอฮานะ", title: "ร้านเครื่องมือ", role: "shop", sprite: "merchant",
      lines: ["ยา เสบียง เครื่องมือ มีครบในร้านม่านโนเรนนี้"] },
    { id: "osaki_brewer", ...at(404, 462), face: 180, name: "โทคุเบ", title: "โรงเหล้าสาเก", role: "talk", look: samurai("top_warrior_forest"),
      lines: ["สาเกของโอซากิหมักจากข้าวนาริมทะเล หอมที่สุดในแผ่นดิน", "ถังที่ศาลเจ้าน่ะ ข้าถวายเองทุกปี"] },
    { id: "osaki_aoi", ...at(500, 432), face: 180, name: "อาโออิ", title: "ช่างทำโคม", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "violet", top: "top_rose", bottom: "bottom_wine" },
      lines: ["นี่คือลานกลางเมือง ถนนการค้ายาวจากท่าเรือไปถึงศาลเจ้า", "เดินขึ้นเหนือไปจะเจอสวนซากุระริมทะเล ตะวันออกเฉียงเหนือคือวัดเจดีย์ห้าชั้น", "ทางใต้มีสวนโรงน้ำชากับนาข้าว โคมแดงทุกดวงในเมืองฉันทำเองนะ"] },
    { id: "osaki_healer", ...at(855, 500), face: 180, name: "มิโกะยูกิ", title: "มิโกะ · รักษาฟรี", role: "heal",
      look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "teal", top: "top_priestess_white", bottom: "bottom_priestess_wine" },
      lines: ["ขอเทพแห่งท้องทะเลคุ้มครองท่าน", "ล้างมือที่บ่อน้ำก่อนไหว้ แล้วเดินลอดโทริอิกลับไปอย่างสงบนะคะ"] },
    { id: "job_battlemage", ...at(744, 250), face: -90, name: "อาจารย์เคนชิน", title: "ปรมาจารย์ดาบเวท · เปลี่ยนอาชีพจอมเวทนักสู้", role: "talk", look: samurai("top_warrior_navy", "silver"),
      lines: ["ดาบกับเวทคือหนึ่งเดียวกัน ใครก็ตามที่เลเวล 35 มาฝึกกับข้าได้", "สมดุล เวทมนตร์ หรือคมดาบที่อาบธาตุ เลือกทางของเจ้าเอง"] },
    { id: "osaki_monk", ...at(760, 250), face: -90, name: "หลวงพี่เรียวคัง", title: "พระประจำวัดเจดีย์", role: "talk", look: samurai("top_warrior_navy", "ink"),
      lines: ["เจดีย์ห้าชั้นนี้ตั้งอยู่บนที่สูงของเมือง มองเห็นทะเลได้ทั้งสามด้าน", "สวนหินเซนข้างเจดีย์ คลื่นหินนั้นคือทะเลรอบเกาะของเรา", "ได้ยินว่าทางตะวันตกเฉียงเหนือ ป้อมคราเดียยังต้านพวกอสูรไม่หยุด"] },
    { id: "osaki_teahouse", ...at(640, 712), face: 90, name: "ชิโยะ", title: "เจ้าของโรงน้ำชา", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "amber", top: "top_lilac", bottom: "bottom_cocoa" },
      lines: ["เชิญนั่งพักดื่มชาเขียวกับดังโงะก่อนสิคะ", "ฤดูซากุระบาน ผู้คนจากแผ่นดินใหญ่ข้ามทะเลมาชมกันเต็มสวน"] },
    { id: "osaki_hina", ...at(718, 686), face: 0, name: "ฮินะ", title: "เด็กหญิงริมบ่อปลา", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "amber", eyes: "blue", top: "top_sky", bottom: "bottom_navy" },
      lines: ["ปลาคาร์ปตัวสีส้มชื่อทาโร่ ตัวขาวชื่อยูกิ!", "ข้ามสะพานโค้งแดงแล้วอย่าวิ่งนะ เดี๋ยวลื่น"] },
    { id: "osaki_farmer", ...at(860, 718), face: 180, name: "ลุงเก็นโซ", title: "ชาวนา", role: "talk", look: samurai("top_warrior_forest", "silver"),
      lines: ["นาข้าวบนเกาะเล็กก็จริง แต่น้ำจากภูเขาไฟใสสะอาดนัก", "ประตูภูเขาเพิ่งเปิดได้ไม่นาน แต่ได้ยินเสียงแปลกๆ จากป่าไผ่บนเขาทุกคืน"] },
    { id: "osaki_guard1", ...at(938, 592), face: 90, name: "ซามูไรเคนจิ", title: "ยามประตูภูเขา", role: "talk", look: samurai("top_warrior_navy"),
      lines: ["ออกประตูภูเขาไปคือเนินซากุระกับป่าไผ่ ขึ้นไปอีกคือยอดภูเขาไฟ", "บนเขามีศาลเจ้าร้าง อย่าขึ้นไปถ้ายังไม่แกร่งพอ"] },
    { id: "osaki_guard2", ...at(938, 628), face: 90, name: "ซามูไรโทชิโร่", title: "ยามประตูภูเขา", role: "talk", look: samurai("top_warrior"),
      lines: ["หลังกำแพงนี้คือป่าสนกับป่าไผ่ ขึ้นไปถึงปล่องภูเขาไฟ", "ถ้าบาดเจ็บ ไปหามิโกะที่ศาลเจ้าได้"] },
    { id: "osaki_fisher", ...at(515, 812), face: 0, name: "ทาโร่", title: "ชาวประมง", role: "talk", look: samurai("top_warrior", "auburn"),
      lines: ["เช้านี้ได้ปลาทูน่ามาตัวโต ลมทะเลใต้กำลังดี", "ทะเลทางใต้ไกลออกไปคือมหาสมุทรใต้ ไม่มีใครแล่นเรือไปถึงสุดขอบ"] },
    { id: "osaki_ronin", ...at(410, 150), face: 0, name: "เรน", title: "นักดาบพเนจร", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "crimson", eyes: "amber", top: "top_adventurer_plum", bottom: "bottom_adventurer_black" },
      lines: ["ข้ามาจากแผ่นดินใหญ่เพื่อดูซากุระริมทะเลนี่แหละ", "ทางเหนือของแผ่นดินใหญ่มีทุ่งสเตปป์ทรุนราดากับเมืองหิมะไอซ์เบิร์ก", "ถ้าได้ไปบาฮามัสกลางทะเลทราย อย่าลืมพกน้ำไปเยอะๆ"] },
  ];
}

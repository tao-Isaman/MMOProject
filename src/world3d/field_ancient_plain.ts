// ที่ราบโบราณ (the ancient plain), monsters Lv 110-122: the ruins of a city older than the kingdom,
// gone back to grass on the shore of the bay south of Venezia. The old road comes down from the dry
// plains through a gap in the ridge on the north side and past the temple's stairs into the forum;
// it goes on out east to Bahamas, round the foot of the colossus's hill, and a second road leaves
// the forum south for the royal necropolis. The city's harbour road leaves the forum north-west
// under a triumphal arch whose east end has fallen in and runs down to the old quay, half sunk in
// the bay, columns standing in the shallows. The whole west side is the bay's shore, a strip of
// sand between the grass and the sea. North-east of the forum a temple stands on its platform at
// the top of a flight of marble stairs. In the south-east the colossus's hill rises in two steps:
// on the lower one the colossus lies where it fell, its helmeted head apart from its body, and up
// a second stair the upper one keeps its sanctuary, a court of colonnades round the pedestal where
// its feet still stand. In the south-west the amphitheatre sits sunk in its bank of earth, its mouth
// to the road, its back to the sea; the broken arches of the old aqueduct cross the grass in the
// north-west, the last of them out in the water; wild olives and stone pines everywhere. The
// grass dries towards the north edge, into the dry plains' steppe, and gives way to sand towards
// the east, the desert round Bahamas; high ground past the north and south edges, open sand past
// the east.
//
// Full size in the field's own centimetres (north +X, east -Y), scaled by TOWN_SCALE in finish.
//   ways out: north -> dry_plains, east (south of the middle) -> bahamas, south -> royal_necropolis

import * as THREE from "three";
import { FieldBuilder } from "./field";
import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import { useKits, colourways } from "./town";
import type { Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import { KIT as RUINS, smooth, band, bevel, inPoly, distTo, towards, alongDir, rampOff } from "./kits/ruins";
import type { XY } from "./kits/ruins";
import { KIT as DESERT } from "./kits/desert";
import { KIT as STEPPE } from "./kits/steppe";

useKits(RUINS, DESERT, STEPPE);
// the desert's old walls and columns in this city's travertine, their sand drifts gone to turf
colourways({ ap_travertine: { Desert_Ruin: "Ruins_Travertine", Desert_RuinDark: "Ruins_TravertineDark", Desert_RuinPale: "Ruins_TravertineMid", Desert_Fluted: "Ruins_Fluted", Desert_Sand: "Ruins_Turf", Desert_SandDark: "Ruins_Turf" } });

const R = 5500; // the walkable box
const A = 9000; // the ground
const RAD = Math.PI / 180;

// ---- the levels (as drawn; the plateaus get bevelled corners) ----
// T1: the temple's platform (north-east); C1: the colossus's hill (south-east), its north-east
// corner drawn back for the Bahamas road, C2 its upper step; high ground past the north edge (a gap
// for the road) and the south edge, a headland in the south-west corner
const T1: XY[] = [[2700, -1500], [4700, -1300], [5050, -2600], [4700, -3900], [3100, -4000], [2450, -2800]];
const C1: XY[] = [[-600, -1500], [-550, -3300], [-700, -4300], [-1600, -4550], [-2600, -4700], [-3200, -5250], [-4700, -4900], [-5000, -3500], [-4700, -1900], [-3200, -1300], [-1800, -1200]];
const C2: XY[] = [[-2600, -2300], [-2600, -4100], [-3400, -4400], [-4200, -3900], [-4300, -2800], [-3600, -2000]];
const RIM_NE: XY[] = [[5900, -A], [6100, -3000], [5850, -1100], [6400, -700], [A, -700], [A, -A]];
const RIM_NW: XY[] = [[A, 700], [6400, 700], [5850, 1100], [5800, 1500], [5900, 3800], [6300, 4900], [A, 5300]];
const RIM_SE: XY[] = [[-6000, -1400], [-5800, -3800], [-6000, -5800], [-6300, -A], [-A, -A], [-A, -1300]];
const RIM_SW: XY[] = [[-5900, 1000], [-6200, 4000], [-5900, 5200], [-6500, 6300], [-A, 6600], [-A, 900]];
// the temple's stairs (a straight ramp of 9 m rising 3 m), the colossus hill's ramp and its stairs
const T1_STAIRS = rampOff(T1, 0, 0.5, 900, 440, true);
const C1_RAMP = rampOff(C1, 0, 0.5, 1000, 460);
const C2_STAIRS = rampOff(C2, 0, 0.5, 900, 440, true);

// ---- the sea: the shore of the bay from past the north-west corner (the old quay jutting out
// under the harbour road) round the amphitheatre's back to the headland past the south-west
// corner; the sea west of it ----
const SHORE: XY[] = [
  [A + 400, 5700], [6300, 5600], [5500, 5300], [5000, 4900], [4600, 4700], [4580, 5050], [3820, 5050], [3800, 4650], [3200, 4550],
  [2500, 4500], [1700, 4600], [1100, 4550], [500, 4450], [0, 4500], [-500, 4700], [-1000, 5150], [-1600, 5300], [-2300, 5350],
  [-3000, 5380], [-3700, 5320], [-4300, 5200], [-4700, 4900], [-5200, 4850], [-5700, 5150], [-6300, 6300], [-7000, 6700], [-A - 400, 6900],
];
const SEA: Poly = [...SHORE, [-A - 400, A + 400], [A + 400, A + 400]];
const QUAY: Poly = [[4580, 4350], [4580, 5050], [3820, 5050], [3820, 4350]];

// ---- the places ----
const NORTH: XY = [5150, 0], BAH: XY = [-1760, -5150], NEC: XY = [-5150, -200];
const ARCH: XY = [2850, 2800], AD: XY = [-0.586, -0.81]; // the triumphal arch, and the road's way through it
const AMP: XY = [-2700, 3300];                             // the amphitheatre (its mouth to -Y)
const FORUM: XY[] = [[2100, -500], [2100, 1300], [500, 1300], [500, -500]];
const COURT: XY[] = [[-2950, -2700], [-2950, -3700], [-3850, -3700], [-3850, -2700]]; // the sanctuary on C2
const TEMPLE: XY = [3791, -2315];
const PEDESTAL: XY = [-3400, -3200];

export function build(quality: { flowers: number }): Town {
  // the amphitheatre's bank: a ring of rises round it, open to the road, low and close behind it
  // where its back is to the sea (the ground comes down to the shore level)
  const bank = ([[-30, 1750, 820], [10, 1750, 820], [50, 1650, 700], [130, 1650, 700], [170, 1750, 820], [210, 1750, 820]] as const).map(([d, at, r]) => ({ x: AMP[0] + Math.cos(d * RAD) * at, y: AMP[1] + Math.sin(d * RAD) * at, r, h: 240 }));
  const f = new FieldBuilder(308, {
    hills: [
      ...bank,
      { x: 4300, y: 2400, r: 1100, h: 150 }, { x: 700, y: 3800, r: 1000, h: 130 }, { x: 2900, y: -4900, r: 900, h: 120 },
      { x: 4500, y: 500, r: 900, h: 140 }, { x: 1700, y: -2900, r: 800, h: -90 }, { x: 3000, y: 4800, r: 800, h: 110 },
      { x: -4600, y: -800, r: 600, h: 80 }, { x: -800, y: 2000, r: 500, h: -60 },
    ],
    plateaus: [
      { poly: bevel(T1), h: 300, ramps: [T1_STAIRS] },
      { poly: bevel(C1), h: 260, ramps: [C1_RAMP] },
      { poly: bevel(C2), h: 560, ramps: [C2_STAIRS] },
      { poly: bevel(RIM_NE), h: 620 }, { poly: bevel(RIM_NW), h: 620 }, { poly: bevel(RIM_SE), h: 520 }, { poly: bevel(RIM_SW), h: 480 },
    ],
    rock: "Ruins_CliffPale",
  });
  const AREA = { x0: -A, x1: A, y0: -A, y1: A };

  // ---- the roads: the old paving, cracked and grassed over ----
  const A1: XY = [ARCH[0] - AD[0] * 950, ARCH[1] - AD[1] * 950], A2: XY = [ARCH[0] + AD[0] * 950, ARCH[1] + AD[1] * 950];
  const VIA_W: XY[] = [...smooth([[4200, 4600], [3950, 4150], A1]), ARCH, ...smooth([A2, [2150, 1450], [1900, 1000]])];
  const VIA_N: XY[] = smooth([[2700, -100], [3350, -40], [4300, -10], NORTH, [7300, 0]]);
  const VIA_E: XY[] = smooth([[1350, -300], [1300, -700], [1050, -1500], [750, -2400], [550, -3300], [350, -4100], [-200, -4650], [-1000, -5000], BAH, [-1850, -6600], [-1900, -A]]);
  const SOUTH: XY[] = smooth([[700, 600], [400, 650], [-400, 700], [-1500, 450], [-2700, 350], [-3700, 100], [-4450, -150], NEC, [-7300, -250]]);
  const T1_WAY: XY[] = smooth([[2000, -350], [2700, -100], [3350, -40], [3580, -220], [T1_STAIRS.bottom[0] - 4, T1_STAIRS.bottom[1] + 60]]);
  const C1_WAY: XY[] = [[760, -2385], C1_RAMP.bottom, C1_RAMP.top, ...smooth([[-800, -2440], [-1200, -2800], [-1500, -3120], [C2_STAIRS.bottom[0] + 50, C2_STAIRS.bottom[1]]])];
  const C2_WAY: XY[] = [[C2_STAIRS.top[0] - 40, C2_STAIRS.top[1]], [-2990, -3200]];
  const AMP_WAY: XY[] = smooth([[-2700, 380], [-2760, 1300], [-2720, 2000], [-2700, 2400]]);
  const AQ_WAY: XY[] = smooth([[3250, 3350], [2700, 3650], [2000, 3700], [1600, 3700]]);
  const roads = [band(VIA_W, 500), band(VIA_N, 500), band(VIA_E, 500), band(SOUTH, 460), band(T1_WAY, 400), band(C1_WAY, 400), band(AMP_WAY, 400), band(AQ_WAY, 340), band(C2_WAY, 380)];
  const ground = f.ground({ area: AREA, cell: 60, roads, plazas: [FORUM, COURT, QUAY], water: [SEA], base: "grass", track: false, road: [0.95, 0.9, 0.8], plaza: [0.9, 0.88, 0.8] });

  // ---- the edges: the grass drying towards the dry plains on the north and going over to the
  // desert's sand towards Bahamas on the east (a factor on the ground's colour, point by point,
  // full at the edge and past it; not on the paving), sand laid over the east band and along the
  // shore ----
  const band01 = (v: number, from: number, to: number) => {
    const t = Math.min(1, Math.max(0, (v - from) / (to - from)));
    return t * t * (3 - 2 * t);
  };
  const toDry = (x: number) => band01(x, 3300, 5500), toSand = (y: number) => band01(y, -3300, -5500);
  {
    const geo = ground.mesh.geometry, pos = geo.getAttribute("position"), col = new Float32Array(pos.count * 3);
    const DRY = [2.1, 1.0, 2.0], SAND = [2.4, 1.2, 3.2];
    for (let i = 0; i < pos.count; i++) {
      const x = ground.mesh.position.x + pos.getX(i), y = -(ground.mesh.position.z + pos.getZ(i)), paved = ground.kind(x, y) === 1 || ground.kind(x, y) === 2;
      const n = paved ? 0 : toDry(x), e = paved ? 0 : toSand(y);
      col.set([0, 1, 2].map((c) => (1 + (DRY[c] - 1) * n) * (1 - e) + SAND[c] * e), i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    (ground.mesh.material as THREE.MeshStandardMaterial).vertexColors = true;
  }
  // another ground laid a little over this one, shown all over `area` but where `cut` cuts it away
  // (it follows the cliffs the same way, on the same grid)
  const over = (area: { x0: number; x1: number; y0: number; y1: number }, base: string, cut: Poly[], lift: number, tint?: string) => {
    const g = buildPaved({
      area, roads: [], plazas: [], water: cut, base, cell: 60, ...(tint ? { tint } : {}),
      height: (x, y) => f.h(x, y) + lift,
      place: (x, y, cell) => {
        const [px, py, h, k] = f.terrain.place(x, y, cell);
        return [px, py, h + lift, k];
      },
    });
    g.mesh.renderOrder = 1;
    return g;
  };
  // the sand's ragged inner edge across the east band, and the beach's along the shore
  const SAND_IN: XY[] = [];
  for (let x = -A; x <= A; x += 150) SAND_IN.push([x, -4550 + 380 * Math.sin(x / 640 + 1.1) + 230 * Math.sin(x / 270 + 0.3) + 110 * Math.sin(x / 95)]);
  const sand = over({ x0: -A, x1: A, y0: -A, y1: -2400 }, "sand", [[...SAND_IN, [A, -2400], [-A, -2400]], ...roads], 4);
  const BEACH_IN: XY[] = SHORE.map(([x, y], i) => [x, y - 380 - 160 * Math.sin(i * 1.7)]);
  const onBeach = (x: number, y: number) => !inPoly(SEA, x, y) && inPoly([...SHORE, ...[...BEACH_IN].reverse()], x, y) && !inPoly(QUAY, x, y);
  const beach = over({ x0: -A, x1: A, y0: 3000, y1: A }, "sand", [SEA, QUAY, [...BEACH_IN, [-A - 400, 3000], [A + 400, 3000]], ...roads], 3);

  // ---- the ways out ----
  f.exit("dry_plains", NORTH, [4450, 0]);
  f.exit("bahamas", BAH, [-1050, -4850]);
  f.exit("royal_necropolis", NEC, [-4450, -150]);

  // ---- placing: every thing remembered (x, y, r) so the trees keep clear ----
  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number) => taken.every(([px, py, pr]) => Math.hypot(px - x, py - y) > pr + r);
  const open = (x: number, y: number, r: number) => [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0);
  const put = (ref: string, at: XY, h = 0, o: { s?: number; solid?: "auto" | "none" | SolidSpec[]; r?: number; colours?: string } = {}) => {
    f.put(ref.includes(":") ? ref : `ruins:${ref}`, at, h, { s: o.s ?? 1, solid: o.solid ?? "auto", ...(o.colours ? { colours: o.colours } : {}) });
    taken.push([at[0], at[1], o.r ?? 120]);
  };
  const box = (w: number, d: number, x = 0, y = 0, kind = "ruin", rot = 0): SolidSpec => ({ kind, x, y, w, d, rot });
  const disc = (r: number, x = 0, y = 0, kind = "tree"): SolidSpec => ({ kind, x, y, r });
  const olive = (at: XY, s = 1) => put("olive_tree", at, (at[0] * 7 + at[1] * 3) % 360, { s, solid: [disc(42 * s)], r: 260 * s });
  // a row of colonnade pieces (8 m each) from a toward b, their fronts toward `face`
  const row = (a: XY, b: XY, face: XY, skip: number[] = []) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 800), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
    for (let k = 0; k < n; k++) {
      if (skip.includes(k)) continue;
      const c: XY = [a[0] + ux * (k + 0.5) * 800, a[1] + uy * (k + 0.5) * 800];
      put("colonnade", c, towards(face[0], face[1]), { solid: [box(232, 800), box(200, 260, 230, 300, "ruin")], r: 420 });
    }
  };
  const travertine = { colours: "ap_travertine" };

  // ---- the sea: the water under the cut-away ground, the shore closed all along, rocks along the
  // beach, stacks out in the bay ----
  const SHORE_IN = SHORE.filter(([x, y]) => Math.abs(x) < R + 600 && Math.abs(y) < R + 900);
  f.blockBand(SHORE_IN.map(([x, y], i) => {
    // (pushed out to sea, square to the shore there)
    const a = SHORE_IN[Math.max(0, i - 1)], b = SHORE_IN[Math.min(SHORE_IN.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    if (!inPoly(SEA, x + nx * 150, y + ny * 150)) [nx, ny] = [-nx, -ny];
    return [x + nx * 260, y + ny * 260] as XY;
  }), 520, { kind: "sea" });
  const sea = f.waterSheet({ x0: -A - 2500, x1: A + 2500, y0: 3800, y1: A + 2500 }, -14, "WaterSea");
  for (const [ref, at, h, sc] of [
    ["steppe:boulder_flat", [5200, 4750], 30, 0.8], ["steppe:rock_cluster", [2900, 4300], 120, 0.7], ["steppe:boulder", [-300, 4300], 200, 0.7],
    ["steppe:boulder_flat", [-2200, 5000], 60, 0.9], ["steppe:rock_cluster", [-4500, 4800], 10, 0.8], ["steppe:boulder_flat", [-5300, 4500], 150, 0.7],
  ] as [string, XY, number, number][]) put(ref, at, h, { s: sc, r: 200 });
  for (const [at, h, sc] of [[[2200, 6300], 40, 0.8], [[-3300, 6250], 160, 1], [[-800, 5900], 250, 0.55]] as [XY, number, number][]) put("steppe:sea_stack", at, h, { s: sc, solid: "none", r: 400 });

  // ---- the old harbour: the harbour road's quay, a broken arch on it, columns of the colonnade
  // that lined it standing out in the shallows, one fallen in the water ----
  put("broken_arch", [4200, 4500], 90, { solid: [box(170, 150, 0, -275), box(170, 150, 0, 275)], r: 380 });
  put("desert:ruin_column", [4450, 4950], 20, { ...travertine, r: 120 });
  put("desert:ruin_column", [3950, 4950], 140, { ...travertine, r: 120 });
  put("desert:column_fallen", [4250, 4800], 10, { ...travertine, solid: [box(140, 600, 0, 0, "ruin")], r: 150 });
  for (const [at, h] of [[[4450, 5550], 60], [[3950, 5600], 200], [[3450, 4900], 140], [[4950, 5250], 300]] as [XY, number][])
    f.put("desert:ruin_column", at, h, { colours: "ap_travertine", z: -40, solid: "none" });
  f.put("desert:column_fallen", [4200, 5900], 70, { colours: "ap_travertine", z: -50, solid: "none" });

  // ---- the triumphal arch over the road, colonnades from it to the forum ----
  put("triumphal_arch", ARCH, alongDir(AD[0], AD[1]), { solid: [box(600, 260, 0, -390), box(600, 260, 0, 390), box(600, 140, 0, -770), box(700, 520, 0, 780)], r: 1050 });
  const nrm: XY = [-AD[1], AD[0]]; // across the road
  for (const side of [-1, 1]) {
    const c: XY = [A2[0] + nrm[0] * side * 480 - AD[0] * 200, A2[1] + nrm[1] * side * 480 - AD[1] * 200];
    put("colonnade", c, towards(-nrm[0] * side, -nrm[1] * side), { solid: [box(232, 800), box(200, 260, 230, 300)], r: 420 });
  }
  for (const side of [-1, 1]) {
    const c: XY = [A1[0] + nrm[0] * side * 520 + AD[0] * 60, A1[1] + nrm[1] * side * 520 + AD[1] * 60];
    put("desert:ruin_wall", c, alongDir(AD[0], AD[1]) + 90, { ...travertine, solid: [box(110, 600, 0, 0, "wall")], r: 330 });
  }

  // ---- the forum: colonnades round three sides, honorific columns, olives ----
  row([2300, -500], [2300, 1100], [-1, 0]);
  row([380, -500], [380, 300], [1, 0]);
  row([380, 900], [380, 1700], [1, 0]);
  row([300, -650], [1100, -650], [0, 1]);
  row([1500, -650], [2300, -650], [0, 1]);
  row([300, 1450], [1900, 1450], [0, -1], [1]);
  put("broken_arch", [1500, 1460], 90, { solid: [box(170, 150, 0, -275), box(170, 150, 0, 275)], r: 380 });
  for (const at of [[1500, 200], [900, 700], [1100, -200]] as XY[]) put("desert:ruin_column", at, at[0] % 90, { ...travertine, r: 120 });
  olive([1700, 800], 0.8);
  olive([800, -100], 0.75);

  // ---- the temple on its platform, its stairs, olives and a fallen colonnade round it ----
  put("temple_front", TEMPLE, towards(0, 1), { solid: [box(1040, 1520)], r: 950 });
  const t1d: XY = [T1_STAIRS.top[0] - T1_STAIRS.bottom[0], T1_STAIRS.top[1] - T1_STAIRS.bottom[1]];
  put("temple_stairs", [(T1_STAIRS.top[0] + T1_STAIRS.bottom[0]) / 2, (T1_STAIRS.top[1] + T1_STAIRS.bottom[1]) / 2], alongDir(t1d[0], t1d[1]), { solid: "none", r: 480 });
  row([2800, -3600], [3600, -3600], [0, 1]);
  put("desert:ruin_wall", [4400, -3500], 15, { ...travertine, solid: [box(110, 600, 0, 0, "wall")], r: 330 });
  for (const at of [[4500, -1700], [3000, -1900], [4300, -3300], [3300, -3700]] as XY[]) if (f.level(at[0], at[1], 300)) olive(at, 0.8);

  // ---- the colossus's hill: the body and head on the lower step, the court and pedestal above ----
  // (the body moved back off the corner drawn back for the Bahamas road, the head beyond its neck)
  put("colossus_body", [-2000, -3900], 0, { r: 650 });
  put("colossus_head", [-1000, -3700], -40, { r: 330 });
  const c1d: XY = [C2_STAIRS.top[0] - C2_STAIRS.bottom[0], C2_STAIRS.top[1] - C2_STAIRS.bottom[1]];
  put("temple_stairs", [(C2_STAIRS.top[0] + C2_STAIRS.bottom[0]) / 2, (C2_STAIRS.top[1] + C2_STAIRS.bottom[1]) / 2], alongDir(c1d[0], c1d[1]), { solid: "none", r: 480 });
  put("broken_arch", [-2830, -3200], 0, { solid: [box(170, 150, 0, -275), box(170, 150, 0, 275)], r: 380 });
  put("colossus_feet", PEDESTAL, 180, { solid: [box(560, 420)], r: 420 });
  row([-3000, -2580], [-3800, -2580], [0, -1]);
  row([-3000, -3820], [-3800, -3820], [0, 1]);
  row([-3920, -2800], [-3920, -3600], [1, 0]);
  for (const at of [[-1300, -1800], [-3300, -1700], [-2300, -5000], [-4300, -4400], [-4000, -2300], [-3600, -4100]] as XY[]) if (f.level(at[0], at[1], 300)) olive(at, 0.85);
  put("desert:ruin_wall", [-1100, -2000], 70, { ...travertine, solid: [box(110, 600, 0, 0, "wall")], r: 330 });
  put("desert:ruin_column", [-700, -5250], 0, { ...travertine, r: 120 });

  // ---- the amphitheatre in its bank: the tiers solid in wedges, the arena open ----
  const amph: SolidSpec[] = [];
  for (let k = 0; k < 13; k++) {
    const a = (-130 + 20 * k + 10) * RAD;
    amph.push(box(420, 380, Math.cos(a) * 800, Math.sin(a) * 800, "ruin", a / RAD), box(400, 500, Math.cos(a) * 1190, Math.sin(a) * 1190, "ruin", a / RAD));
  }
  amph.push(box(170, 860, -725, 0), box(180, 140, -820, 990, "ruin", -50), box(180, 140, -820, -990, "ruin", 50));
  put("amphitheatre", AMP, 90, { solid: amph, r: 1500 });
  put("desert:signpost", [-2400, 600], towards(-0.3, 1), { solid: [disc(20, 0, 0, "post")], r: 90 });

  // ---- the aqueduct: its broken arches in a line across the grass ----
  put("broken_arch", [1500, 3150], 0, { solid: [box(170, 150, 0, -275), box(170, 150, 0, 275)], r: 380 });
  put("broken_arch", [1500, 3830], 180, { solid: [box(170, 150, 0, -275), box(170, 150, 0, 275)], r: 380 });
  // (the last one out in the water)
  put("broken_arch", [1450, 5000], 0, { solid: "none", r: 380 });
  put("desert:ruin_wall", [1480, 4420], 0, { ...travertine, solid: [box(110, 600, 0, 0, "wall")], r: 330 });

  // ---- the Bahamas and necropolis ways: columns and signposts ----
  put("desert:ruin_column", [-2500, -5300], 0, { ...travertine, r: 120 });
  put("desert:signpost", [-200, -4300], towards(-0.6, -1), { solid: [disc(20, 0, 0, "post")], r: 90 });
  for (const at of [[4900, 480], [4900, -480]] as XY[]) put("desert:ruin_column", at, at[1], { ...travertine, r: 120 });
  put("desert:signpost", [4250, 500], towards(1, 0), { solid: [disc(20, 0, 0, "post")], r: 90 });
  for (const at of [[-4800, 250], [-4700, -650]] as XY[]) put("desert:ruin_column", at, at[1], { ...travertine, r: 120 });
  put("desert:signpost", [-4200, 300], towards(-1, 0), { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("desert:signpost", [2250, -150], towards(0.4, -1), { solid: [disc(20, 0, 0, "post")], r: 90 });

  // ---- the old quarters: houses fallen to three walls round a court, a column down across it ----
  const house = (c: XY, h: number, k: number) => {
    const a = h * RAD, ux = Math.cos(a), uy = Math.sin(a), at = (lx: number, ly: number): XY => [c[0] + ux * lx - uy * ly, c[1] + uy * lx + ux * ly];
    if (!open(c[0], c[1], 500) || !f.level(c[0], c[1], 480) || !free(c[0], c[1], 380)) return;
    const wall = (lx: number, ly: number, dh: number) => put("desert:ruin_wall", at(lx, ly), h + dh, { ...travertine, solid: [box(110, 600, 0, 0, "wall")], r: 300 });
    wall(-300, 0, 0);
    if (k % 3 !== 1) wall(20, -320, 90);
    if (k % 3 !== 2) wall(20, 320, -90);
    put("desert:column_fallen", at(150, k % 2 ? 90 : -90), h + 25 + k * 40, { ...travertine, solid: [box(140, 600, 0, 0, "ruin")], r: 150 });
    if (k % 2 === 0) olive(at(380, -200), 0.7);
  };
  const HOUSES: [XY, number][] = [
    [[1000, 2250], 15], [[550, 2950], 100], [[2050, 2450], 70], [[-300, 1600], 40], [[-1300, 1350], 120], [[-1500, -650], 10], [[-2700, -550], 80],
    [[4300, 1300], 30], [[4500, 3600], 60], [[-3700, -900], 160], [[400, 3900], 20], [[-2300, 1250], 200], [[3400, 1300], 120], [[-800, -200], 70],
  ];
  HOUSES.forEach(([c, h], k) => house(c, h, k));
  // a colonnade along the south road where it leaves the forum
  row([300, 1220], [-500, 1220], [0, -1]);

  // ---- old walls, rocks and rubble over the grass ----
  const WALLS: [XY, number][] = [[[3300, 1800], 20], [[4200, -900], 80], [[-700, 3600], 30], [[-1800, 1300], 100], [[-4300, 1700], 60], [[2600, 3900], 120], [[-500, -900], 40], [[4800, 3300], 10]];
  for (const [at, h] of WALLS) if (open(at[0], at[1], 340) && f.level(at[0], at[1], 320) && free(at[0], at[1], 300)) put("desert:ruin_wall", at, h, { ...travertine, solid: [box(110, 600, 0, 0, "wall")], r: 330 });
  const ROCKS: [string, XY][] = [
    ["steppe:boulder", [4900, -900]], ["steppe:rock_cluster", [3900, 1200]], ["steppe:boulder_flat", [-600, 4100]], ["steppe:rock_cluster", [-4800, 2900]],
    ["steppe:boulder", [-3800, 4700]], ["steppe:boulder_flat", [2200, -4600]], ["steppe:rock_cluster", [5000, 4200]], ["steppe:boulder", [-5000, -1000]],
    ["steppe:boulder_flat", [1800, -3500]], ["steppe:rock_cluster", [500, -5000]], ["steppe:boulder", [2500, 4000]], ["steppe:boulder_flat", [-1600, 4800]],
  ];
  for (const [ref, at] of ROCKS) if (open(at[0], at[1], 200) && f.level(at[0], at[1], 200) && free(at[0], at[1], 200)) put(ref, at, at[0] % 360, { r: 220 });

  // ---- trees: olives and stone pines over the plain, thicker toward the edges (thinner and drier
  // over the sand on the east, none on the beach); feather grass, dry grass towards the edges ----
  const keepOut = (x: number, y: number) =>
    Math.hypot(x - AMP[0], y - AMP[1]) < 1500 || inPoly(FORUM, x, y) || Math.hypot(x - ARCH[0], y - ARCH[1]) < 1200 || Math.hypot(x - TEMPLE[0], y - TEMPLE[1]) < 1000 ||
    Math.hypot(x - PEDESTAL[0], y - PEDESTAL[1]) < 900 || f.warps.some((w) => Math.hypot(w.x - x, w.y - y) < 700) || distTo([C1_RAMP.top, C1_RAMP.bottom], x, y) < 450 ||
    distTo([T1_STAIRS.top, T1_STAIRS.bottom], x, y) < 450 || distTo([C2_STAIRS.top, C2_STAIRS.bottom], x, y) < 450;
  const rnd = f.rnd;
  for (let x = -R + 200; x < R; x += 420)
    for (let y = -R + 200; y < R; y += 420) {
      const px = x + (rnd() - 0.5) * 320, py = y + (rnd() - 0.5) * 320;
      const edge = Math.min(R - Math.abs(px), R - Math.abs(py));
      const e = toSand(py), want = (edge < 800 ? 0.55 : edge < 1500 ? 0.3 : 0.13) * (1 - 0.55 * e);
      if (rnd() > want || !open(px, py, 300) || !f.level(px, py, 200) || !free(px, py, 260) || keepOut(px, py) || onBeach(px, py)) continue;
      const k = rnd();
      if (rnd() < e * 0.8 || rnd() < toDry(px) * 0.3) put(k < 0.4 ? "desert:acacia" : "desert:dry_bush", [px, py], rnd() * 360, { s: 0.75 + rnd() * 0.35, solid: k < 0.4 ? [disc(34)] : "auto", r: 220 });
      else if (k < 0.5) olive([px, py], 0.75 + rnd() * 0.35);
      else put(k < 0.75 ? "flora:Pine" : k < 0.9 ? "flora:RoundTree" : "flora:Bush", [px, py], rnd() * 360, { s: 0.75 + rnd() * 0.35, r: 220 });
    }
  for (let x = -R + 150; x < R; x += 260)
    for (let y = -R + 150; y < R; y += 260) {
      const px = x + (rnd() - 0.5) * 220, py = y + (rnd() - 0.5) * 220;
      if (rnd() > 0.18 || !open(px, py, 120) || !f.level(px, py, 80) || !free(px, py, 70) || inPoly(FORUM, px, py) || Math.hypot(px - AMP[0], py - AMP[1]) < 1450 || onBeach(px, py)) continue;
      const dry = rnd() < Math.max(toSand(py), toDry(px) * 0.7);
      put(dry ? (rnd() < 0.5 ? "desert:grass_tuft" : "desert:grass_patch") : "steppe:grass_tuft", [px, py], rnd() * 360, { s: 0.8 + rnd() * 0.4, solid: "none", r: 60 });
    }
  // past the edge: olives and pines on the high ground north and south, the desert's scrub on the
  // open sand east, nothing on the sea
  const rimOut = (x: number, y: number) =>
    (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) === 1 || ground.kind(x, y) === 3 || onBeach(x, y) || [VIA_W, VIA_N, VIA_E, SOUTH].some((r) => distTo(r, x, y) < 450);
  const GREEN_RIM = { x0: -A, x1: A, y0: -5700, y1: A };
  f.woods(GREEN_RIM, ["Pine", "Pine", "RoundTree", "PineSmall", "Bush", "BigOak"], rimOut, { count: 300, spacing: 420, tries: 9000 });
  f.woods(GREEN_RIM, ["olive_tree"], rimOut, { count: 120, spacing: 520, tries: 5000, kit: "ruins" });
  f.woods({ x0: -A, x1: A, y0: -A, y1: -5700 }, ["dry_bush", "dry_bush", "grass_patch", "grass_tuft", "acacia", "boulder_flat", "rock_cluster"], rimOut, { count: 110, spacing: 500, tries: 4000, kit: "desert" });
  f.woods({ x0: 5700, x1: A, y0: -A, y1: 5000 }, ["dry_bush", "grass_tuft", "grass_patch"], rimOut, { count: 40, spacing: 480, tries: 1500, kit: "desert" });

  // ---- monsters: the grass between the ruins, the platform, the hill, the arena ----
  const SCHOLAR: XY = [1800, 900], WATCH: XY = [4600, 700];
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 840, keepOut: (x, y) => Math.hypot(x - SCHOLAR[0], y - SCHOLAR[1]) < 900 || Math.hypot(x - WATCH[0], y - WATCH[1]) < 700 });

  const npcs: NpcSpec[] = [
    {
      id: "ap_scholar", x: SCHOLAR[0], y: SCHOLAR[1], face: 200, name: "ลูเซีย", title: "นักโบราณคดีแห่งเวนิชเซีย", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "amber", top: "top_adventurer_teal", bottom: "bottom_adventurer_sand" },
      lines: [
        "เมืองนี้เก่ากว่าอาณาจักรของเราเสียอีก จารึกบนประตูชัยไม่มีใครอ่านออกสักคน",
        "รูปปั้นยักษ์บนเนินทางตะวันออกเฉียงใต้เคยยืนอยู่บนฐานนั้น วันหนึ่งก็ล้มลงมา ไม่มีบันทึกว่าเพราะอะไร",
        "ถนนทางใต้พาไปสุสานหลวงของกษัตริย์องค์แรก ที่นั่นไฟในกระถางยังลุกเป็นสีเขียวทั้งที่ไม่มีใครจุด",
      ],
    },
    {
      id: "ap_watch", x: WATCH[0], y: WATCH[1], face: -90, name: "เซร์คีโอ", title: "ทหารยามเวนิชเซีย", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "amber", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "เลยจากนี้ไปเป็นที่ราบโบราณ ตามถนนเก่าผ่านบันไดวิหารลงไปจะถึงลานกลางเมือง ทางเหนือกลับขึ้นไปที่ราบแห้งแล้ง",
        "ถนนที่ลอดประตูชัยทางตะวันตกพาลงไปท่าเรือโบราณ ทะเลกลืนท่าไปครึ่งหนึ่งแล้ว เหลือแต่เสาโผล่พ้นน้ำ",
        "ตกค่ำอย่าเข้าไปในโรงละครกลางแจ้ง ได้ยินเสียงปรบมือทั้งที่ไม่มีคนดู",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery: [sea, sand.mesh, beach.mesh],
    sky: "#9fb8c8",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && Math.hypot(x - AMP[0], y - AMP[1]) > 700 && !onBeach(x, y) && y > -4200, density: 0.2 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4400, y: 100 },
    npcs,
    labels: [
      { x: NORTH[0] - 250, y: NORTH[1], text: "ทางไปที่ราบแห้งแล้ง", kind: "gate" },
      { x: BAH[0], y: BAH[1] + 250, text: "ทางไปบาฮามัส", kind: "gate" },
      { x: NEC[0] + 250, y: NEC[1], text: "ทางไปสุสานหลวงโบราณ", kind: "gate" },
      { x: ARCH[0] + 300, y: ARCH[1] - 300, text: "ประตูชัยพัง" },
      { x: 1300, y: 400, text: "ลานกลางเมืองโบราณ" },
      { x: TEMPLE[0], y: TEMPLE[1] + 900, text: "วิหารบนฐานสูง" },
      { x: -1800, y: -3600, text: "รูปปั้นยักษ์ล้ม" },
      { x: PEDESTAL[0] + 450, y: PEDESTAL[1], text: "ลานฐานรูปปั้นยักษ์", kind: "small" },
      { x: AMP[0], y: AMP[1] - 1100, text: "โรงละครกลางแจ้ง" },
      { x: 1500, y: 4000, text: "ซากท่อส่งน้ำโบราณ", kind: "small" },
      { x: 3500, y: 3900, text: "ถนนโบราณ", kind: "small" },
      { x: 4200, y: 4800, text: "ท่าเรือโบราณ" },
      { x: -1500, y: 4600, text: "ชายหาดอ่าวเวนิชเซีย", kind: "small" },
    ],
  });
}

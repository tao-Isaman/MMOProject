// ที่ราบโบราณ (the ancient plain), monsters Lv 110-122: the ruins of a city older than the kingdom,
// gone back to grass south-east of Venezia. The old road comes in from Venezia at the north end of
// the west side, passes under a triumphal arch whose east end has fallen in, runs between
// colonnades into the forum, and goes on out east to Bahamas; a second road leaves the forum south
// for the royal necropolis. North-east of the forum a temple stands on its platform at the top of a
// flight of marble stairs. In the south-east the colossus's hill rises in two steps: on the lower
// one the colossus lies where it fell, its helmeted head apart from its body, and up a second stair
// the upper one keeps its sanctuary, a court of colonnades round the pedestal where its feet still
// stand. In the south-west the amphitheatre sits sunk in its bank of earth, its mouth to the road;
// the broken arches of the old aqueduct cross the grass in the north-west; wild olives and stone
// pines everywhere, and high ground all round past the edge.
//
// Full size in the field's own centimetres (north +X, east -Y), scaled by TOWN_SCALE in finish.
//   ways out: west (north end) -> venezia, east -> bahamas, south -> royal_necropolis

import { FieldBuilder } from "./field";
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
// T1: the temple's platform (north-east); C1: the colossus's hill (south-east), C2 its upper step;
// high ground all round past the edge, with gaps for the three roads
const T1: XY[] = [[2700, -1500], [4700, -1300], [5050, -2600], [4700, -3900], [3100, -4000], [2450, -2800]];
const C1: XY[] = [[-600, -1500], [-550, -3300], [-650, -4900], [-1400, -5300], [-3200, -5250], [-4700, -4900], [-5000, -3500], [-4700, -1900], [-3200, -1300], [-1800, -1200]];
const C2: XY[] = [[-2600, -2300], [-2600, -4100], [-3400, -4400], [-4200, -3900], [-4300, -2800], [-3600, -2000]];
const RIM_N: XY[] = [[5900, -A], [6100, -3000], [5800, 1500], [5900, 4800], [4700, 6000], [4900, A], [A, A], [A, -A]];
const RIM_E: XY[] = [[1200, -6100], [3500, -5800], [5500, -6000], [5600, -A], [1100, -A]];
const RIM_SE: XY[] = [[-6000, -1400], [-5800, -3800], [-5900, -5900], [-3500, -5900], [-700, -6100], [-600, -A], [-A, -A], [-A, -1300]];
const RIM_SW: XY[] = [[-5900, 1000], [-6200, 4000], [-5900, 5900], [-1500, 6200], [1000, 5900], [2900, 6100], [3000, A], [-A, A], [-A, 900]];
// the temple's stairs (a straight ramp of 9 m rising 3 m), the colossus hill's ramp and its stairs
const T1_STAIRS = rampOff(T1, 0, 0.5, 900, 440, true);
const C1_RAMP = rampOff(C1, 0, 0.5, 1000, 460);
const C2_STAIRS = rampOff(C2, 0, 0.5, 900, 440, true);

// ---- the places ----
const VEN: XY = [3900, 5150], BAH: XY = [300, -5150], NEC: XY = [-5150, -200];
const ARCH: XY = [2850, 2800], AD: XY = [-0.586, -0.81]; // the triumphal arch, and the road's way through it
const AMP: XY = [-2700, 3300];                             // the amphitheatre (its mouth to -Y)
const FORUM: XY[] = [[2100, -500], [2100, 1300], [500, 1300], [500, -500]];
const COURT: XY[] = [[-2950, -2700], [-2950, -3700], [-3850, -3700], [-3850, -2700]]; // the sanctuary on C2
const TEMPLE: XY = [3791, -2315];
const PEDESTAL: XY = [-3400, -3200];

export function build(quality: { flowers: number }): Town {
  // the amphitheatre's bank: a ring of rises round it, open to the road
  const bank = [-30, 10, 50, 90, 130, 170, 210].map((d) => ({ x: AMP[0] + Math.cos(d * RAD) * 1750, y: AMP[1] + Math.sin(d * RAD) * 1750, r: 820, h: 240 }));
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
      { poly: bevel(RIM_N), h: 620 }, { poly: bevel(RIM_E), h: 540 }, { poly: bevel(RIM_SE), h: 520 }, { poly: bevel(RIM_SW), h: 480 },
    ],
    rock: "Ruins_CliffPale",
  });
  const AREA = { x0: -A, x1: A, y0: -A, y1: A };

  // ---- the roads: the old paving, cracked and grassed over ----
  const A1: XY = [ARCH[0] - AD[0] * 950, ARCH[1] - AD[1] * 950], A2: XY = [ARCH[0] + AD[0] * 950, ARCH[1] + AD[1] * 950];
  const VIA_W: XY[] = [...smooth([[4100, 7300], VEN, [3780, 4350], A1]), ARCH, ...smooth([A2, [2150, 1450], [1900, 1000]])];
  const VIA_E: XY[] = smooth([[1350, -300], [1300, -700], [1050, -1500], [750, -2400], [550, -3300], [400, -4300], BAH, [250, -7300]]);
  const SOUTH: XY[] = smooth([[700, 600], [400, 650], [-400, 700], [-1500, 450], [-2700, 350], [-3700, 100], [-4450, -150], NEC, [-7300, -250]]);
  const T1_WAY: XY[] = smooth([[2000, -350], [2700, -100], [3350, -40], [3580, -220], [T1_STAIRS.bottom[0] - 4, T1_STAIRS.bottom[1] + 60]]);
  const C1_WAY: XY[] = [[760, -2385], C1_RAMP.bottom, C1_RAMP.top, ...smooth([[-800, -2440], [-1200, -2800], [-1500, -3120], [C2_STAIRS.bottom[0] + 50, C2_STAIRS.bottom[1]]])];
  const C2_WAY: XY[] = [[C2_STAIRS.top[0] - 40, C2_STAIRS.top[1]], [-2990, -3200]];
  const AMP_WAY: XY[] = smooth([[-2700, 380], [-2760, 1300], [-2720, 2000], [-2700, 2400]]);
  const AQ_WAY: XY[] = smooth([[3250, 3350], [2700, 3650], [2000, 3700], [1600, 3700]]);
  const roads = [band(VIA_W, 500), band(VIA_E, 500), band(SOUTH, 460), band(T1_WAY, 400), band(C1_WAY, 400), band(AMP_WAY, 400), band(AQ_WAY, 340), band(C2_WAY, 380)];
  const ground = f.ground({ area: AREA, cell: 60, roads, plazas: [FORUM, COURT], base: "grass", track: false, road: [0.95, 0.9, 0.8], plaza: [0.9, 0.88, 0.8] });

  // ---- the ways out ----
  f.exit("venezia", VEN, [3800, 4400]);
  f.exit("bahamas", BAH, [380, -4450]);
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

  // ---- the Venezia way: broken columns either side of the road, a signpost ----
  put("desert:ruin_column", [4100, 4700], 20, { ...travertine, r: 120 });
  put("desert:ruin_column", [3450, 4800], 140, { ...travertine, r: 120 });
  put("desert:signpost", [3350, 4250], towards(1, -0.3), { solid: [disc(20, 0, 0, "post")], r: 90 });

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
  put("colossus_body", [-1950, -4550], 25, { r: 650 });
  put("colossus_head", [-1450, -3850], -40, { r: 330 });
  const c1d: XY = [C2_STAIRS.top[0] - C2_STAIRS.bottom[0], C2_STAIRS.top[1] - C2_STAIRS.bottom[1]];
  put("temple_stairs", [(C2_STAIRS.top[0] + C2_STAIRS.bottom[0]) / 2, (C2_STAIRS.top[1] + C2_STAIRS.bottom[1]) / 2], alongDir(c1d[0], c1d[1]), { solid: "none", r: 480 });
  put("broken_arch", [-2830, -3200], 0, { solid: [box(170, 150, 0, -275), box(170, 150, 0, 275)], r: 380 });
  put("colossus_feet", PEDESTAL, 180, { solid: [box(560, 420)], r: 420 });
  row([-3000, -2580], [-3800, -2580], [0, -1]);
  row([-3000, -3820], [-3800, -3820], [0, 1]);
  row([-3920, -2800], [-3920, -3600], [1, 0]);
  for (const at of [[-1300, -1800], [-3300, -1700], [-2300, -5000], [-4300, -4400], [-4000, -2300], [-3600, -4100]] as XY[]) if (f.level(at[0], at[1], 300)) olive(at, 0.85);
  put("desert:ruin_wall", [-1100, -2000], 70, { ...travertine, solid: [box(110, 600, 0, 0, "wall")], r: 330 });
  put("desert:ruin_column", [-900, -4300], 0, { ...travertine, r: 120 });

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
  put("broken_arch", [1450, 5000], 0, { solid: [box(170, 150, 0, -275), box(170, 150, 0, 275)], r: 380 });
  put("desert:ruin_wall", [1480, 4420], 0, { ...travertine, solid: [box(110, 600, 0, 0, "wall")], r: 330 });

  // ---- the Bahamas and necropolis ways: columns and signposts ----
  for (const at of [[0, -4700], [700, -4800]] as XY[]) put("desert:ruin_column", at, at[0], { ...travertine, r: 120 });
  put("desert:signpost", [-50, -4300], towards(0.2, -1), { solid: [disc(20, 0, 0, "post")], r: 90 });
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
    [[4300, 1300], 30], [[4500, 3600], 60], [[-3700, -900], 160], [[200, 4500], 20], [[-2300, 1250], 200], [[3400, 1300], 120], [[-800, -200], 70],
  ];
  HOUSES.forEach(([c, h], k) => house(c, h, k));
  // a colonnade along the south road where it leaves the forum
  row([300, 1220], [-500, 1220], [0, -1]);

  // ---- old walls, rocks and rubble over the grass ----
  const WALLS: [XY, number][] = [[[3300, 1800], 20], [[4200, -600], 80], [[-700, 3600], 30], [[-1800, 1300], 100], [[-4300, 1700], 60], [[2600, 4400], 120], [[-500, -900], 40], [[4800, 3300], 10]];
  for (const [at, h] of WALLS) if (open(at[0], at[1], 340) && f.level(at[0], at[1], 320) && free(at[0], at[1], 300)) put("desert:ruin_wall", at, h, { ...travertine, solid: [box(110, 600, 0, 0, "wall")], r: 330 });
  const ROCKS: [string, XY][] = [
    ["steppe:boulder", [4900, -500]], ["steppe:rock_cluster", [3900, 1200]], ["steppe:boulder_flat", [-600, 4800]], ["steppe:rock_cluster", [-4800, 2900]],
    ["steppe:boulder", [-3800, 5000]], ["steppe:boulder_flat", [2200, -4600]], ["steppe:rock_cluster", [4600, 4300]], ["steppe:boulder", [-5000, -1000]],
    ["steppe:boulder_flat", [1800, -3500]], ["steppe:rock_cluster", [-200, -4600]], ["steppe:boulder", [2500, 5100]], ["steppe:boulder_flat", [-1600, 5000]],
  ];
  for (const [ref, at] of ROCKS) if (open(at[0], at[1], 200) && f.level(at[0], at[1], 200) && free(at[0], at[1], 200)) put(ref, at, at[0] % 360, { r: 220 });

  // ---- trees: olives and stone pines over the plain, thicker toward the edges; feather grass ----
  const keepOut = (x: number, y: number) =>
    Math.hypot(x - AMP[0], y - AMP[1]) < 1500 || inPoly(FORUM, x, y) || Math.hypot(x - ARCH[0], y - ARCH[1]) < 1200 || Math.hypot(x - TEMPLE[0], y - TEMPLE[1]) < 1000 ||
    Math.hypot(x - PEDESTAL[0], y - PEDESTAL[1]) < 900 || f.warps.some((w) => Math.hypot(w.x - x, w.y - y) < 700) || distTo([C1_RAMP.top, C1_RAMP.bottom], x, y) < 450 ||
    distTo([T1_STAIRS.top, T1_STAIRS.bottom], x, y) < 450 || distTo([C2_STAIRS.top, C2_STAIRS.bottom], x, y) < 450;
  const rnd = f.rnd;
  for (let x = -R + 200; x < R; x += 420)
    for (let y = -R + 200; y < R; y += 420) {
      const px = x + (rnd() - 0.5) * 320, py = y + (rnd() - 0.5) * 320;
      const edge = Math.min(R - Math.abs(px), R - Math.abs(py));
      const want = edge < 800 ? 0.55 : edge < 1500 ? 0.3 : 0.13;
      if (rnd() > want || !open(px, py, 300) || !f.level(px, py, 200) || !free(px, py, 260) || keepOut(px, py)) continue;
      const k = rnd();
      if (k < 0.5) olive([px, py], 0.75 + rnd() * 0.35);
      else put(k < 0.75 ? "flora:Pine" : k < 0.9 ? "flora:RoundTree" : "flora:Bush", [px, py], rnd() * 360, { s: 0.75 + rnd() * 0.35, r: 220 });
    }
  for (let x = -R + 150; x < R; x += 260)
    for (let y = -R + 150; y < R; y += 260) {
      const px = x + (rnd() - 0.5) * 220, py = y + (rnd() - 0.5) * 220;
      if (rnd() > 0.18 || !open(px, py, 120) || !f.level(px, py, 80) || !free(px, py, 70) || inPoly(FORUM, px, py) || Math.hypot(px - AMP[0], py - AMP[1]) < 1450) continue;
      put("steppe:grass_tuft", [px, py], rnd() * 360, { s: 0.8 + rnd() * 0.4, solid: "none", r: 60 });
    }
  // past the edge: olives and pines all round, on the high ground too
  const rimOut = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) === 1 || distTo(VIA_W, x, y) < 450 || distTo(VIA_E, x, y) < 450 || distTo(SOUTH, x, y) < 450;
  f.woods(AREA, ["Pine", "Pine", "RoundTree", "PineSmall", "Bush", "BigOak"], rimOut, { count: 420, spacing: 420, tries: 9000 });
  f.woods(AREA, ["olive_tree"], rimOut, { count: 160, spacing: 520, tries: 5000, kit: "ruins" });

  // ---- monsters: the grass between the ruins, the platform, the hill, the arena ----
  const SCHOLAR: XY = [1800, 900], WATCH: XY = [3500, 4500];
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
      id: "ap_watch", x: WATCH[0], y: WATCH[1], face: -60, name: "เซร์คีโอ", title: "ทหารยามเวนิชเซีย", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "amber", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "เลยจากนี้ไปเป็นที่ราบโบราณ ตามถนนเก่าลอดประตูชัยไปจะถึงลานกลางเมือง",
        "ตกค่ำอย่าเข้าไปในโรงละครกลางแจ้ง ได้ยินเสียงปรบมือทั้งที่ไม่มีคนดู",
      ],
    },
  ];

  return f.finishField({
    ground,
    sky: "#9fb8c8",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && Math.hypot(x - AMP[0], y - AMP[1]) > 700, density: 0.2 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 3750, y: 4150 },
    npcs,
    labels: [
      { x: VEN[0], y: VEN[1] - 250, text: "ทางไปเวนิชเซีย", kind: "gate" },
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
    ],
  });
}

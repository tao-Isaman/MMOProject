// พระราชวังหลวง (the royal palace): the kings' palace on its hill north of Eden, where the snow
// begins. The first dynasty, the legend says, united the tribes and built it above Eden; it is
// built as Eden is (pale stone, white plaster, blue roofs) but grander. The royal road comes up
// from the south through the wheat fields to its great gatehouse; past the walls to the west the
// foothills climb away (snowy in the north, green in the south as they are next door), to the
// north the mountains of the old royal mine, to the east the snowy pine woods of the royal hunt;
// the south is still green.
//
// The plan (full size, north +X, west +Y; the curtain wall 160 x 140 m with round towers and long
// royal banners all round):
//   - the south gate (the great gatehouse, the one the royal road looks up at) opens on the gate
//     court with its flower beds and the notice board; the quartermaster's store, the royal
//     kitchens and the servants' houses stand in terraces along the lane inside the south wall;
//   - the outer ward: the royal avenue of lamps and trees straight north from the gate to the
//     inner gate; west of it the parade ground where the royal guard drill, its dummies in rows,
//     the barracks along the west wall; east of it the coach yard where the royal coach waits
//     with the stable master who drives travellers to the other towns (the spawn is by him, far
//     enough up the avenue to be clear of the gatehouse's towers), the royal stables along the
//     east wall with their paddock of white horses, and the royal smithy;
//   - the inner wall across the ward with its clock gate; behind it the great court with the
//     three-tier fountain, walks where the statues of all the kings stand in two rows and lawns of
//     flower beds and clipped box between, the royal chapel (healing) and the guest house on its
//     west side, the library and the treasury on its east side (the east gate to the royal hunt
//     between them), and on its north side the throne hall, open to the court through its
//     colonnade so the king on his throne shows from the court (the ground is raised under the
//     throne's dais at the end, so he stands on it);
//   - the royal garden round and behind the throne hall: the hedge maze and topiary beasts in the
//     west, the pond with its pavilion and bridge and rose arbours in the east, the garden walk
//     behind the hall under a tunnel of roses to the north postern (to the old royal mine).
//   - outside: snowy slopes and snow pines north, east and in the north of the west, a snowy
//     hillside in the south-west corner where the royal road and the foothills meet round it, the
//     road out of each gate; the royal road coming up through green country from the south between
//     lamps, banners and trees.
// Ways out: south gate -> royal_road, north postern -> old_royal_mine, east gate -> royal_hunt,
// each in the middle of its side (the west, facing the foothills, has none).
//
// Laid out in world centimetres at full size and drawn at TOWN_SCALE.

import * as THREE from "three";
import { material, defineMaterial } from "./textures";
import { buildPaved } from "./paved";
import { merge, beamBetween, cylinderAt, toThree } from "./geo";
import type { Poly } from "./paved";
import { Terrain } from "./terrain";
import { KIT as PALACE, SOLIDS, GATE_GAP, DAIS } from "./kits/palace";
import { KIT as EDEN } from "./kits/eden";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as SNOWLAND } from "./kits/snowland";
import { KIT as HIGHLAND } from "./kits/highland";
import { TownBuilder, useKits, colourways, FACE, travelGuide, gateWay, waysOut, protoOf, solidsOf, TOWN_SCALE } from "./town";
import type { Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(PALACE, EDEN, PLAINS, SNOWLAND, HIGHLAND);

// Colourways: the kings cast in bronze or gilt among the marble ones; the servants' houses with
// cream plaster or slate roofs.
defineMaterial("PalaceTown_PlasterCream", { map: "plaster", tint: "#f2e5c6", bump: 0.6 });
colourways({
  palace_bronze: { Palace_Statue: "CopperGreen" },
  palace_gilt: { Palace_Statue: "Bronze" },
  palace_cream: { Eden_Plaster: "PalaceTown_PlasterCream" },
  palace_slate: { RoofBlue: "RoofSlate" },
});

type XY = [number, number];

// ---- the plan (full size, world cm) ----
const S = -7600, N = 8400, W = 7000, E = -7000; // the curtain wall's lines
const IW = -2000;                                // the inner wall across the ward
const GATE_S: XY = [S, 0], GATE_N: XY = [N, 0], GATE_E: XY = [400, E], GATE_I: XY = [IW, 0];
// the walkable box: the walls and 9 m round them; the ground 37 m round that
const B = { minX: S - 900, maxX: N + 900, minY: E - 900, maxY: W + 900 };
const AREA = { x0: S - 4600, x1: N + 4800, y0: E - 4600, y1: W + 4600 };
// the court's landmarks
const HALL: XY = [4330, 0];
const FOUNT: XY = [925, 0];
const CHAPEL: XY = [900, 5700], LIBRARY: XY = [2300, -5500], TREASURY: XY = [-1050, -5400], GUEST: XY = [-700, 5750];
const STATUE_X = [-1100, -300, 500, 1300, 2100, 2900], STATUE_Y = 2500;
// the outer ward's
const STABLES: XY = [-4700, -6300], SMITHY: XY = [-3000, -2700], BARRACKS: XY = [-4700, 6330], COACH: XY = [-4700, -1500];
// where travellers arrive by the guide (clear of the gatehouse's tall towers behind them)
const SPAWN: XY = [-4700, -300];
const PADDOCK = { x0: -6200, x1: -3700, y0: -4900, y1: -2700 };
const PARADE = { x0: -5400, x1: -2900, y0: 1700, y1: 5100 }; // (x0 its south side, y0 its east side)
// the garden's
const MAZE_C: XY = [6400, 4600];
const POND_C: XY = [6200, -4700], POND_R: XY = [1000, 1050], BRIDGE: XY = [5480, -4700];

// a point of a piece placed at c with heading h (degrees), given in its own frame
const loc = (c: XY, h: number, l: XY): XY => {
  const a = (h * Math.PI) / 180;
  return [c[0] + l[0] * Math.cos(a) - l[1] * Math.sin(a), c[1] + l[0] * Math.sin(a) + l[1] * Math.cos(a)];
};
const rect = (x0: number, y0: number, x1: number, y1: number): Poly => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
// an ellipse, a little uneven
function blob(c: XY, r: XY, seed: number, n = 28): Poly {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, k = 0.95 + rnd() * 0.08;
    return [c[0] + Math.cos(a) * r[0] * k, c[1] + Math.sin(a) * r[1] * k] as XY;
  });
}
function inPoly(poly: Poly, x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// The snow outside the walls (the grass of the palace and of the south is a second ground over
// it, cut away here): everything north of the north wall and east of the east wall; west of the
// west wall only its northern half, as the snowy foothills next door are snowy down to there
// and green below; south of that a snowy hillside in the south-west corner, where the royal road
// and the foothills meet round it; the royal road's approach green between.
function snowLine(pts: XY[], seed: number): XY[] {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const out: XY[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / 350));
    for (let k = 0; k < n; k++) {
      const t = k / n, j = i === 0 && k === 0 ? 0 : (rnd() - 0.5) * 360;
      out.push([ax + (bx - ax) * t + (-(by - ay) / L) * j, ay + (by - ay) * t + ((bx - ax) / L) * j]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// a ragged patch of snow round c
function patch(c: XY, r: XY, seed: number, n = 26): Poly {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, k = 0.82 + rnd() * 0.3;
    return [c[0] + Math.cos(a) * r[0] * k, c[1] + Math.sin(a) * r[1] * k] as XY;
  });
}
const SNOW_SW: XY = [-7300, 9500];
const SNOW: Poly[] = [
  rect(N + 175, AREA.y0 - 10, AREA.x1 + 10, AREA.y1 + 10),
  [[N + 180, W + 175], ...snowLine([[-300, W + 175], [-900, W + 1100], [-600, W + 2300], [-1300, W + 3500], [-1000, AREA.y1 + 10]], 7), [N + 180, AREA.y1 + 10]],
  patch(SNOW_SW, [2800, 2700], 13),
  [[N + 180, E - 175], ...snowLine([[S + 300, E - 175], [S + 100, E - 900], [S + 700, E - 2200], [S + 300, E - 3500], [S + 1000, AREA.y0 - 10]], 11), [N + 180, AREA.y0 - 10]],
];
const snowy = (x: number, y: number) => SNOW.some((p) => inPoly(p, x, y));
const inside = (x: number, y: number, m = 0) => x > S - m && x < N + m && y > E - m && y < W + m;

export function buildPalace(quality: { flowers: number }): Town {
  const town = new TownBuilder(47);
  const { put, rnd, extra } = town;
  const post = (r = 24): SolidSpec[] => [{ kind: "post", x: 0, y: 0, r }];

  // ---- the ground: the hill the palace stands on, flat inside the walls; snowy slopes rising
  // away west, north and east outside them ----
  const terrain = new Terrain({
    hills: [
      { x: -4000, y: 12200, r: 4200, h: 520 }, { x: 3000, y: 12400, r: 4300, h: 620 }, { x: 10200, y: 11800, r: 4200, h: 780 },
      { x: 13200, y: -4500, r: 4000, h: 700 }, { x: 13000, y: 4800, r: 4200, h: 820 },
      { x: -4800, y: -12000, r: 4000, h: 420 }, { x: 5500, y: -12300, r: 4200, h: 560 }, { x: 10200, y: -11600, r: 4000, h: 680 },
      { x: -7300, y: 10600, r: 3000, h: 420 },
    ],
    rock: "CliffSnow",
    detail: 9000,
  });
  town.terrain = terrain;

  // roads (cobbles) and plazas (flagstones)
  const roads: Poly[] = [
    rect(AREA.x0 - 10, -380, S + 360, 380),            // the royal road up to and through the great gate
    rect(S + 360, -650, IW - 330, 650),                 // the royal avenue to the inner gate
    rect(IW - 340, -300, IW + 340, 300),                // through the inner gate
    rect(-6750, -6700, -6250, 6700),                    // the lane along the south wall
    rect(-50, AREA.y0 - 10, 850, -4100),                // out of the east gate to the royal hunt
    rect(5230, -330, AREA.x1 + 10, 330),                // the garden walk behind the hall, out of the postern
    rect(7700, -6600, 8100, 6600),                      // the walk along the north wall
  ];
  const plazas: Poly[] = [
    rect(S + 360, -2600, -5700, 2600),                  // the gate court
    rect(PARADE.x0, PARADE.y0, PARADE.x1, PARADE.y1),   // the parade ground
    rect(-6500, -5840, -2900, -5200),                   // the stable yard
    rect(-3600, -2260, -2400, -650),                    // the smithy's yard
    rect(-3100, -1100, IW - 330, 1100),                 // before the inner gate
    // the great court: the axis from the inner gate to the throne hall, the fountain's square,
    // the walks where the kings stand, the hall's and the inner gate's forecourts, and walks out to
    // the chapel, the library, the treasury and the east gate (lawns with flower beds between)
    rect(IW + 330, -1200, 3460, 1200), rect(-250, -1900, 2100, 1900),
    rect(IW + 330, 2150, 3460, 2850), rect(IW + 330, -2850, 3460, -2150),
    rect(2800, -2850, 3460, 2850), rect(IW + 330, -2850, -1100, 2850),
    rect(600, 1200, 1200, 4600), rect(300, 4100, 1500, 4600),
    rect(-1500, -4850, 850, -2850), rect(1900, -4700, 2700, -2850), rect(1700, -4700, 2900, -4100),
    // the garden's paths: along both sides of the hall, to the maze and the bridge
    rect(3460, 2200, 7700, 2700), rect(3460, -2700, 7700, -2200),
    rect(4800, 2700, 5300, 4850), rect(4800, 4350, 5420, 4850), rect(7380, 4350, 7700, 4850),
    rect(4600, -4850, 5050, -2700), rect(4600, -4850, 5220, -4550),
  ];
  const POND = blob(POND_C, POND_R, 5);
  const area = { x0: AREA.x0, x1: AREA.x1, y0: AREA.y0, y1: AREA.y1 };
  const ROAD: [number, number, number] = [0.78, 0.76, 0.72], FLAG: [number, number, number] = [0.92, 0.9, 0.85];
  const ground = buildPaved({ area, roads, plazas, water: [POND], base: "snow", road: ROAD, plaza: FLAG, height: (x, y) => terrain.height(x, y), place: (x, y, cell) => terrain.place(x, y, cell) });
  // the grass: a second ground a hair over the snow, cut away where the snow lies
  const grass = buildPaved({ area, roads, plazas, water: [POND, ...SNOW], base: "grass", road: ROAD, plaza: FLAG, height: (x, y) => terrain.height(x, y), place: (x, y, cell) => terrain.place(x, y, cell) });
  grass.mesh.position.y += 3;
  grass.mesh.renderOrder = 1;
  const open = (x: number, y: number, r = 0) => [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0);

  // what already stands, to keep the trees, lamps and props clear of it
  const known: SolidSpec[] = [];
  let seen = 0;
  const clear = (x: number, y: number, r: number): boolean => {
    for (; seen < town.puts.length; seen++) known.push(...solidsOf(town.puts[seen], protoOf(town.puts[seen].ref, town.puts[seen].colours)));
    return [...known, ...extra].every((sp) => {
      const dx = x - sp.x, dy = y - sp.y;
      if ("r" in sp) return Math.hypot(dx, dy) > sp.r + r;
      const a = (sp.rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
      const lx = Math.abs(dx * c + dy * s) - sp.w / 2, ly = Math.abs(-dx * s + dy * c) - sp.d / 2;
      return Math.hypot(Math.max(lx, 0), Math.max(ly, 0)) > r;
    });
  };
  const tree = (kind: string, at: XY, s = 0.75, r = 200) => {
    if (open(at[0], at[1], 150) && clear(at[0], at[1], r)) put(`flora:${kind}`, at, rnd() * 360, { s: s + rnd() * 0.12 });
  };
  const lamp = (at: XY, h = 0) => put("palace:palace_lamp", at, h, { solid: post(28) });

  // ---- the curtain wall: 8 m lengths between round towers, a gap at each gate ----
  const TOWER = SOLIDS.palace_tower;
  const run = (a: XY, b: XY, out: "n" | "s" | "e" | "w", gaps: number[] = [], gap?: number) => town.wall(a, b, out, "palace:palace_wall", { gaps, gap });
  run([S, W], [S, E], "s", [W - GATE_S[1]], GATE_GAP.great_gatehouse);
  run([N, W], [N, E], "n", [W - GATE_N[1]], GATE_GAP.postern_gate);
  run([S, W], [N, W], "w");
  run([S, E], [N, E], "e", [GATE_E[0] - S], GATE_GAP.postern_gate);
  run([IW, W - 170], [IW, E + 170], "s", [W - 170 - GATE_I[1]], GATE_GAP.inner_gate);
  const towers: XY[] = [
    [S, W], [S, E], [N, W], [N, E],
    [S, 3900], [S, -3900], [N, 3700], [N, -3700],
    [-3100, W], [IW, W], [2000, W], [5300, W],
    [-2800, E], [IW, E], [2700, E], [5600, E],
    [IW, 4000], [IW, -4000],
  ];
  for (const at of towers) put("palace:palace_tower", at, inside(at[0], at[1], -10) ? 0 : at[0] === S ? FACE.s : at[0] === N ? FACE.n : at[1] === W ? FACE.w : FACE.e, { solid: TOWER });
  // the gates
  put("palace:great_gatehouse", GATE_S, FACE.s, { solid: SOLIDS.great_gatehouse });
  put("palace:postern_gate", GATE_N, FACE.n, { solid: SOLIDS.postern_gate });
  put("palace:postern_gate", GATE_E, FACE.e, { solid: SOLIDS.postern_gate });
  put("palace:inner_gate", GATE_I, FACE.s, { solid: SOLIDS.inner_gate });

  // ---- the court's buildings ----
  put("palace:throne_hall", HALL, 0, { solid: SOLIDS.throne_hall });
  put("palace:royal_chapel", CHAPEL, FACE.e);
  put("palace:royal_library", LIBRARY, FACE.w);
  put("palace:treasury", TREASURY, FACE.w);
  put("eden:inn", GUEST, FACE.e);
  // the fountain in the middle, a ring of benches, lamps and flower beds round it
  put("palace:tiered_fountain", FOUNT, 0, { s: 1.1, solid: [{ kind: "fountain", x: 0, y: 0, r: 450 }] });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8, c = Math.cos(a), s = Math.sin(a);
    if (i % 2) lamp([FOUNT[0] + c * 760, FOUNT[1] + s * 760]);
    else put("eden:park_bench", [FOUNT[0] + c * 700, FOUNT[1] + s * 700], (Math.atan2(-s, -c) * 180) / Math.PI);
    put("eden:flower_bed", [FOUNT[0] + Math.cos(a + 0.39) * 820, FOUNT[1] + Math.sin(a + 0.39) * 820], 0, { s: 0.7 });
  }
  // the kings, in two rows facing each other across the court: marble, bronze and gilt
  STATUE_X.forEach((x, i) => {
    for (const s of [-1, 1]) {
      const pose = (i + (s > 0 ? 1 : 0)) % 2 ? "palace:king_statue_sceptre" : "palace:king_statue";
      const tint = ["", "palace_bronze", "", "palace_gilt", "", "palace_bronze"][(i + (s > 0 ? 3 : 0)) % 6] || undefined;
      put(pose, [x, s * STATUE_Y], s < 0 ? FACE.w : FACE.e, { colours: tint });
    }
  });
  // lamps between the kings and down the axis, banners before the hall
  for (const x of [-700, 100, 1700, 2500]) for (const s of [-1, 1]) lamp([x, s * 2500]);
  for (const x of [-1300, -600, 2400, 3100]) for (const s of [-1, 1]) lamp([x, s * 1080]);
  // the lawns between the walks: flower beds, clipped box in urns at their corners, planters
  const lawn = (x0: number, x1: number, y0: number, y1: number) => {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = x1 - x0, d = Math.abs(y1 - y0);
    put("eden:flower_bed", [cx, cy], 0, { s: Math.min(1, Math.min(w, d) / 420) });
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) put("eden:topiary", [cx + sx * (w / 2 - 110), cy + sy * (d / 2 - 110)], 0);
    if (w > 1000) for (const sx of [-1, 1]) put("eden:flower_planter", [cx + sx * (w / 2 - 330), cy], 0);
  };
  for (const s of [-1, 1]) {
    lawn(-1100, -250, s * 1200, s * 2150);
    lawn(2100, 2800, s * 1200, s * 2150);
  }
  lawn(-1100, 600, 2850, 4100);
  lawn(1200, 2800, 2850, 4100);
  lawn(850, 1900, -4100, -2850);
  for (const s of [-1, 1]) lawn(2800, 3400, s * 2850, s * 4100);
  for (const y of [-2500, -1300, 1300, 2500]) put("eden:banner_pole", [3250, y], FACE.s, { solid: post(30) });
  for (const s of [-1, 1]) lamp([-1450, s * 3900]);
  // the chapel's garden north of it, the guest house's south of it
  put("eden:pergola", [2400, 5600], FACE.e);
  for (const [x, y] of [[2000, 4700], [2900, 4700], [2000, 6400], [2900, 6400]] as XY[]) put("eden:flower_bed", [x, y], 0, { s: 0.8 });
  for (const [x, y, k] of [[1800, 5550, "Cherry"], [3100, 5550, "Cherry"], [2450, 6550, "RoundTree"], [-1450, 4700, "Cherry"], [-1450, 6500, "RoundTree"], [100, 6550, "Cherry"]] as [number, number, string][]) tree(k, [x, y], 0.75);
  for (const [x, y] of [[2400, 4500]] as XY[]) put("eden:park_bench", [x, y], FACE.e);
  // lamps before the library and the treasury
  for (const x of [1500, 3100]) lamp([x, -4350]);
  for (const x of [-1650, -450]) lamp([x, -4350]);

  // ---- the outer ward ----
  // the gate court: the quartermaster's store and houses along the south wall, lamps, banners
  // (the royal coach waits up the avenue, by the spawn)
  for (const s of [-1, 1]) {
    put("eden:banner_pole", [S + 700, s * 1100], FACE.n, { solid: post(30) });
    lamp([-6200, s * 2350]);
    lamp([-5900, s * 900]);
  }
  for (const [x, y, h] of [[-6000, 1900, 20], [-6100, 2150, 70], [-5950, 2250, 40]] as [number, number, number][]) put("common:crate", [x, y], h);
  put("common:market_cart", [-6000, 1450], FACE.e);
  put("eden:notice_board", [-5950, -1500], FACE.s);
  // two flower beds on the court either side of the way in, clipped box round them
  for (const s of [-1, 1]) {
    put("eden:flower_bed", [-6500, s * 1150], 0);
    for (const [dx, dy] of [[-260, -260], [-260, 260], [260, -260], [260, 260]]) put("eden:topiary", [-6500 + dx, s * 1150 + dy], 0);
  }
  for (const s of [-1, 1]) for (const y of [1500, 2200]) put("eden:flower_planter", [-7080, s * y], FACE.n);
  for (const s of [-1, 1]) put("eden:park_bench", [-6500, s * 1760], s < 0 ? FACE.w : FACE.e);
  // the servants' houses and the royal kitchens along the south wall, wall to wall, facing the lane
  const ROWS = { kit: "eden", tints: ["", "palace_cream", "", "palace_slate", "palace_cream"], narrow: "townhouse_narrow" };
  // (a gap in each row where a tower of the wall stands behind it)
  town.terrace([-6770, 2720], [-6770, 3480], "n", ["tool_shop"], ROWS);
  town.terrace([-6770, 4320], [-6770, 6700], "n", ["townhouse", "townhouse_narrow", "townhouse"], ROWS);
  town.terrace([-6770, -2720], [-6770, -3480], "n", ["townhouse_narrow"], ROWS);
  town.terrace([-6770, -4320], [-6770, -6700], "n", ["inn", "townhouse_narrow", "townhouse"], ROWS);
  // the royal avenue: lamps and trees by turns down both sides
  for (let x = -5400, i = 0; x < IW - 500; x += 650, i++)
    for (const s of [-1, 1]) {
      if (i % 2) lamp([x, s * 820]);
      else tree(i % 4 ? "RoundTree" : "BigOak", [x, s * 900], 0.62, 120);
    }
  // before the inner gate: banners and lamps
  for (const s of [-1, 1]) {
    put("eden:banner_pole", [-2600, s * 1250], FACE.s, { solid: post(30) });
    lamp([-3200, s * 1500]);
  }
  // the parade ground: training dummies in rows along its west side (before the barracks) and
  // its south side, banners at its corners, lamps along its north side, benches for those
  // watching along its east side by the avenue's trees
  put("palace:barracks", BARRACKS, FACE.e);
  for (let x = PARADE.x0 + 450; x < PARADE.x1 - 300; x += 620) put("palace:training_dummy", [x, PARADE.y1 - 330], FACE.w + (rnd() - 0.5) * 30, { solid: post(36) });
  for (let y = PARADE.y0 + 700; y < PARADE.y1 - 800; y += 650) put("palace:training_dummy", [PARADE.x0 + 330, y], FACE.n + (rnd() - 0.5) * 30, { solid: post(36) });
  for (let y = PARADE.y0 + 500; y < PARADE.y1; y += 900) lamp([PARADE.x1 + 150, y]);
  for (const x of [PARADE.x0 + 900, PARADE.x0 + 1800]) put("eden:park_bench", [x, PARADE.y0 - 250], FACE.w);
  for (const [x, y] of [[PARADE.x0 + 150, PARADE.y0 + 150], [PARADE.x1 - 150, PARADE.y0 + 150], [PARADE.x0 + 150, PARADE.y1 - 150], [PARADE.x1 - 150, PARADE.y1 - 150]] as XY[]) put("eden:banner_pole", [x, y], FACE.e, { solid: post(30) });
  // the training yard north of the barracks: more dummies, a rack, crates
  for (const [x, y] of [[-3000, 5900], [-2600, 6300], [-3000, 6600]] as XY[]) put("palace:training_dummy", [x, y], FACE.w, { solid: post(36) });
  put("common:crate", [-2500, 5800], 20);
  // the stables along the east wall, their yard and the paddock of white horses
  put("palace:royal_stables", STABLES, FACE.w);
  {
    const { x0, x1, y0, y1 } = PADDOCK;
    // rail fences round it, a gate opening in the side to the stable yard
    for (let x = x0 + 200; x < x1; x += 400) {
      put("plains:rail_fence", [x, y1], 90);
      if (Math.abs(x - (x0 + x1) / 2) > 300) put("plains:rail_fence", [x, y0], 90);
    }
    for (let y = y0 + 200; y < y1; y += 400) for (const x of [x0, x1]) put("plains:rail_fence", [x, y], 0);
    for (const [x, y, h] of [[-5500, -3500, 30], [-4700, -4200, 200], [-4200, -3300, 120], [-5200, -4400, 280]] as [number, number, number][]) put("palace:horse", [x, y], h);
    put("plains:hay_bales", [-3950, -4600], 20, { s: 0.8 });
  }
  // the coach yard between the paddock and the avenue: the royal coach waiting with its horses
  // by the stable master, saddled horses for the hunt, hay, a well
  put("palace:royal_coach", COACH, FACE.s);
  put("palace:horse", [-5450, -2250], FACE.n + 10);
  put("palace:horse", [-4950, -2380], FACE.n - 15);
  put("eden:public_well", [-4000, -2250], 0, { solid: [{ kind: "well", x: 0, y: 0, r: 160 }] });
  put("plains:hay_bales", [-3950, -1350], 60, { s: 0.8 });
  // the smithy facing the avenue across its yard
  put("palace:royal_smithy", SMITHY, FACE.w, { solid: SOLIDS.royal_smithy });
  for (const [x, y, h] of [[-2550, -1900, 10], [-2500, -1650, 50]] as [number, number, number][]) put("common:crate", [x, y], h);

  // ---- the royal garden ----
  // the hedge maze and the topiary beasts round it in the west
  put("palace:hedge_maze", MAZE_C, FACE.s, { solid: SOLIDS.hedge_maze });
  for (const [x, y, k, h] of [[4400, 3400, "lion", FACE.e], [4400, 5900, "lion", FACE.e], [6400, 3100, "swan", FACE.s], [7800, 3300, "swan", FACE.n], [7900, 6200, "lion", FACE.n], [4300, 6600, "swan", FACE.e], [6300, 6300, "swan", 0]] as [number, number, string, number][])
    put(`palace:topiary_${k}`, [x, y], h);
  // the pond in the east with its pavilion and bridge, rose arbours along the path to it
  put("palace:pond_pavilion", POND_C, FACE.s, { z: 0, solid: SOLIDS.pond_pavilion });
  put("palace:garden_bridge", BRIDGE, 0, { solid: SOLIDS.garden_bridge });
  for (const x of [3800, 4300]) put("palace:rose_arbour", [x, -2450], 0, { solid: SOLIDS.rose_arbour });
  for (const y of [-3300, -3900]) put("palace:rose_arbour", [4825, y], 90, { solid: SOLIDS.rose_arbour });
  // the pond's shore and the island: nobody walks into the water (the bridge's way left open)
  const band = (pts: XY[], width: number, gaps: XY[] = [], gapR = 230) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L / 220));
      const rot = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
        if (gaps.some(([gx, gy]) => Math.hypot(gx - x, gy - y) < gapR)) continue;
        extra.push({ kind: "water", x, y, w: L / n + 40, d: width, rot });
      }
    }
  };
  band([...POND, POND[0]], 160, [[BRIDGE[0] - 300, BRIDGE[1]]]);
  band(Array.from({ length: 25 }, (_, i) => [POND_C[0] + Math.cos((i / 24) * Math.PI * 2) * 470, POND_C[1] + Math.sin((i / 24) * Math.PI * 2) * 470] as XY), 90, [[POND_C[0] - 470, POND_C[1]]], 200);
  // and the water either side of the bridge (the shore, the island and the bridge close the rest in)
  for (const s of [-1, 1]) extra.push({ kind: "water", x: BRIDGE[0], y: BRIDGE[1] + s * 230, w: 620, d: 120, rot: 0 });
  for (const [x, y] of [[5200, -3600], [7000, -3700], [7200, -5600], [5300, -5900]] as XY[]) put("eden:park_bench", [x, y], (Math.atan2(POND_C[1] - y, POND_C[0] - x) * 180) / Math.PI);
  for (const [x, y] of [[5050, -4300], [5050, -5100]] as XY[]) lamp([x, y]);
  // the walk behind the hall to the postern: a tunnel of rose arbours, flower beds, lamps
  for (let x = 5900; x <= 7300; x += 350) put("palace:rose_arbour", [x, 0], 0, { solid: SOLIDS.rose_arbour });
  for (const x of [5500, 7600]) for (const s of [-1, 1]) lamp([x, s * 520]);
  for (const x of [6200, 6900]) for (const s of [-1, 1]) put("eden:flower_bed", [x, s * 900], 0, { s: 0.75 });
  // balustrades between the court and the garden, a garden gate (two lamps) at each path
  for (const s of [-1, 1]) {
    for (let y = 2900; y < 4100; y += 400) put("palace:balustrade", [3480, s * (y + 200)], 0, { solid: [{ kind: "rail", x: 0, y: 0, w: 52, d: 400, rot: 0 }] });
    for (let x = 3700; x < 4500; x += 400) put("palace:balustrade", [x + 200, s * 4120], 90, { solid: [{ kind: "rail", x: 0, y: 0, w: 52, d: 400, rot: 0 }] });
    lamp([3480, s * 2800]);
    put("eden:banner_pole", [3480, s * 2100], FACE.s, { solid: post(30) });
  }
  // flower beds, benches and trees over the garden's lawns
  for (const [x, y] of [[4100, 2950], [5700, 3000], [7100, 2900], [4100, 6500], [5600, 6550], [7400, 6550], [4100, -3200], [6100, -2950], [7400, -2950], [7700, -6400], [4200, -6500], [6200, -6550]] as XY[]) put("eden:flower_bed", [x, y], 0, { s: 0.8 });
  for (const [x, y, h] of [[5550, 4050, FACE.e], [7550, 5150, FACE.w], [4300, -6000, FACE.w]] as [number, number, number][]) put("eden:park_bench", [x, y], h);
  for (const [x, y, k] of [[3900, 4800, "Cherry"], [3900, 6000, "RoundTree"], [5200, 6300, "Cherry"], [7700, 3800, "Cherry"], [8000, 5400, "RoundTree"], [3900, -4800, "Cherry"], [3800, -5700, "RoundTree"], [7600, -4300, "Cherry"], [7800, -5300, "BigOak"], [5600, -6300, "Cherry"], [6900, -6400, "RoundTree"], [6800, -2950, "Cherry"], [5400, 1500, "RoundTree"], [5400, -1500, "RoundTree"], [7600, 1200, "Cherry"], [7600, -1200, "Cherry"]] as [number, number, string][]) tree(k, [x, y], 0.7);

  // ---- outside: the royal road's approach, snowy slopes and woods, the roads out ----
  for (let x = S - 900; x > AREA.x0 + 600; x -= 1100) for (const s of [-1, 1]) {
    lamp([x, s * 640]);
    tree(x % 2200 ? "RoundTree" : "BigOak", [x - 550, s * 1150], 0.8, 100);
  }
  for (const s of [-1, 1]) put("eden:banner_pole", [S - 700, s * 900], FACE.s, { solid: post(30) });
  put("plains:signpost", [S - 2600, 900], FACE.s);
  // snow drifts against the walls outside where the snow lies
  for (let i = 0; i < 40; i++) {
    const side = i % 3, t = rnd();
    const at: XY = side === 0 ? [S + 600 + t * (N - S - 1200), W + 420] : side === 1 ? [S + 600 + t * (N - S - 1200), E - 420] : [N + 420, E + 600 + t * (W - E - 1200)];
    if (ground.kind(at[0], at[1]) === 0 && snowy(at[0], at[1]) && Math.abs(at[0] - GATE_E[0]) > 900 && Math.abs(at[1]) > 900) put(rnd() < 0.5 ? "snowland:snow_drift" : "highland:snow_drift", at, side < 2 ? 0 : 90, { solid: "none" });
  }
  // the ways north and east: trail signs and cairns
  put("snowland:trail_sign", [N + 900, 600], FACE.n, { solid: "none" });
  put("snowland:cairn", [N + 1500, -650], 0, { solid: "none" });
  put("snowland:trail_sign", [1100, E - 900], FACE.e, { solid: "none" });
  put("snowland:cairn", [-300, E - 1500], 0, { solid: "none" });
  // boulders and crags on the slopes, snow patches where the snow gives out on the grass
  for (let i = 0; i < 70; i++) {
    const x = AREA.x0 + rnd() * (AREA.x1 - AREA.x0), y = AREA.y0 + rnd() * (AREA.y1 - AREA.y0);
    if (inside(x, y, 1200) || ground.kind(x, y) !== 0) continue;
    if (snowy(x, y)) put(rnd() < 0.5 ? "snowland:snow_boulder" : rnd() < 0.5 ? "snowland:rock_cluster" : "snowland:frost_shrub", [x, y], rnd() * 360, { solid: "none", s: 0.8 + rnd() * 0.5 });
    else if (snowy(x, y + 1400) || snowy(x, y - 1400) || snowy(x + 1400, y)) put("snowland:snow_patch", [x, y], rnd() * 360, { solid: "none", s: 0.8 + rnd() * 0.6 });
  }
  for (const [x, y, s] of [[11500, 8800, 2.2], [12300, 1500, 2.6], [11800, -7600, 2.4], [-2000, 10800, 2], [6000, 10600, 2.3], [2000, -10800, 2.1], [-9500, 9800, 1.8]] as [number, number, number][]) put("highland:mountain_crag", [x, y], rnd() * 360, { s, solid: "none" });
  // the woods: snow pines on the snow, oaks and birches in the green south
  const roadOut = (x: number, y: number) => (Math.abs(y) < 1000 && (x < S || x > N)) || (Math.abs(x - GATE_E[0]) < 1000 && y < E);
  town.woods(area, ["SnowPine", "SnowPine", "SnowPineSmall", "FrostOak", "SnowPine"], (x, y) => inside(x, y, 1000) || roadOut(x, y) || !snowy(x, y) || ground.kind(x, y) !== 0, { count: Math.round(320 + 160 * Math.min(1, quality.flowers)), tries: 9000, spacing: 480 });
  town.woods(area, ["RoundTree", "BigOak", "Birch", "RoundTree", "Pine"], (x, y) => inside(x, y, 1000) || roadOut(x, y) || snowy(x, y) || ground.kind(x, y) !== 0 || (x < S && Math.abs(y) < 1500), { count: 170, tries: 5000, spacing: 520 });

  // ---- the greens left inside: trees and flower beds wherever there is room ----
  const TREES = ["RoundTree", "SmallTree", "Cherry", "RoundTree", "BigOak"];
  town.greens(ground, { x0: -5700, x1: IW - 300, y0: -2600, y1: -700 }, { trees: TREES, other: "eden:flower_bed", step: 640 });
  town.greens(ground, { x0: -5900, x1: IW - 300, y0: 700, y1: W - 200 }, { trees: TREES, other: "eden:flower_bed", step: 640, chance: 0.75 });
  town.greens(ground, { x0: IW + 200, x1: 3400, y0: 4150, y1: W - 200 }, { trees: TREES, other: "eden:flower_bed", step: 640 });
  town.greens(ground, { x0: 3500, x1: N - 300, y0: 2750, y1: W - 200 }, { trees: TREES, other: "eden:flower_bed", step: 700, chance: 0.5 });
  town.greens(ground, { x0: 3500, x1: N - 300, y0: E + 200, y1: -2750 }, { trees: TREES, other: "eden:flower_bed", step: 700, chance: 0.5 });

  // ---- build ----
  // the pond's water under the ground's hole
  const water = new THREE.Mesh(new THREE.PlaneGeometry(2 * POND_R[0] + 600, 2 * POND_R[1] + 600).rotateX(-Math.PI / 2), material("WaterSea"));
  water.position.set(POND_C[0], -12, -POND_C[1]);
  water.receiveShadow = true;
  // the pond's stone kerb, a little proud of the lawn, round the water's edge
  const kerb = toThree(merge(...POND.map((a, i) => {
    const b = POND[(i + 1) % POND.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
    return merge(
      beamBetween([a[0] - ux * 14, a[1] - uy * 14, -6], [b[0] + ux * 14, b[1] + uy * 14, -6], 46, 36, "StoneLight"),
      cylinderAt({ radius: 26, height: 40, segments: 8, bottom: [a[0], a[1], -24] }, "StoneWhite"),
    );
  })), material);
  const hall = (l: XY) => loc(HALL, 0, l);
  const built = town.finish({
    ground,
    scenery: [grass.mesh, water, kerb],
    sky: "#c3d0de",
    flowers: {
      box: { x: S, y: E, w: N - S, h: W - E },
      open: (x, y) => ground.kind(x, y) === 0 && inside(x, y, -400) && !(x > PARADE.x0 && x < PARADE.x1 && y > PARADE.y0 - 200),
      density: 0.3 * quality.flowers,
    },
    bounds: B,
    // on the avenue by the stable master and the royal coach
    spawn: { x: SPAWN[0], y: SPAWN[1] },
    npcs: palaceNpcs(town.doors, hall),
    ...waysOut([
      gateWay(GATE_S, "s", "royal_road", 480, 700),
      gateWay(GATE_N, "n", "old_royal_mine", 480, 600),
      gateWay(GATE_E, "e", "royal_hunt", 480, 600),
    ]),
    closed: [],
    labels: [
      { x: S + 900, y: 0, text: "ประตูใหญ่ · ถนนหลวง", kind: "gate" },
      { x: N - 700, y: 0, text: "ประตูหลัง · เหมืองหลวงเก่า", kind: "gate" },
      { x: GATE_E[0], y: E + 700, text: "ประตูตะวันออก · ป่าล่าสัตว์หลวง", kind: "gate" },
      { x: -6100, y: 0, text: "ลานหน้าประตู", kind: "small" },
      { x: (PARADE.x0 + PARADE.x1) / 2, y: (PARADE.y0 + PARADE.y1) / 2, text: "ลานสวนสนาม" },
      { x: BARRACKS[0], y: BARRACKS[1] - 900, text: "โรงทหาร", kind: "small" },
      { x: (PADDOCK.x0 + PADDOCK.x1) / 2, y: (PADDOCK.y0 + PADDOCK.y1) / 2, text: "คอกม้าหลวง" },
      { x: SMITHY[0], y: SMITHY[1] + 1000, text: "โรงตีเหล็กหลวง", kind: "small" },
      { x: -6200, y: 3600, text: "ร้านเสบียงหลวง", kind: "small" },
      { x: -6200, y: -3600, text: "โรงครัวหลวง", kind: "small" },
      { x: IW - 900, y: 0, text: "ประตูชั้นใน", kind: "small" },
      { x: FOUNT[0], y: FOUNT[1] - 1100, text: "ลานใหญ่" },
      { x: STATUE_X[2], y: STATUE_Y - 800, text: "แถวรูปปั้นกษัตริย์", kind: "small" },
      { x: HALL[0] - 1100, y: 0, text: "ท้องพระโรง" },
      { x: CHAPEL[0], y: 4350, text: "โบสถ์หลวง" },
      { x: LIBRARY[0], y: -4400, text: "หอสมุดหลวง" },
      { x: TREASURY[0], y: -4450, text: "คลังหลวง", kind: "small" },
      { x: GUEST[0] - 700, y: 4500, text: "เรือนรับรอง", kind: "small" },
      { x: 6400, y: 0, text: "อุทยานหลวง" },
      { x: MAZE_C[0] - 1300, y: MAZE_C[1], text: "เขาวงกตพุ่มไม้", kind: "small" },
      { x: POND_C[0] - 1300, y: POND_C[1] + 700, text: "ศาลากลางสระ", kind: "small" },
    ],
  });
  // the king stands on his throne's dais: the ground is that much higher there
  const k = TOWN_SCALE, base = built.height ?? (() => 0);
  const [dx0, dx1, dy] = [(HALL[0] + DAIS.x0) * k, (HALL[0] + DAIS.x1) * k, DAIS.hy * k];
  built.height = (x: number, y: number) => base(x, y) + (x > dx0 && x < dx1 && Math.abs(y - HALL[1] * k) < dy ? DAIS.h * k : 0);
  built.top = Math.max(built.top ?? 0, DAIS.h * k);
  // the solids far out past the edge of the walkable box keep nobody out of anything
  const b = built.bounds, m = 900;
  built.solids = built.solids.filter((sp) => sp.x > b.minX - m && sp.x < b.maxX + m && sp.y > b.minY - m && sp.y < b.maxY + m);
  return built;
}

// ---- the people of the palace ----
function palaceNpcs(doors: Record<string, XY>, hall: (l: XY) => XY): NpcSpec[] {
  const at = (p: XY) => ({ x: p[0], y: p[1] });
  const toward = (p: XY, q: XY) => (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
  const man = (top: string, hairColor = "ink", bottom = "bottom_warrior_black", eyes = "blue") => ({ gender: "male", hair: "", hairColor, eyes, top, bottom });
  const woman = (top: string, bottom: string, hairColor: string, hair = "hime", eyes = "teal") => ({ gender: "female", hair, hairColor, eyes, top, bottom });
  const guard = (id: string, p: XY, face: number, name: string, title: string, lines: string[], hair = "ink") => ({ id, ...at(p), face, name, title, role: "talk" as const, look: man("top_warrior_navy", hair), lines });
  const shop = doors.tool_shop ?? [-6600, 3200];
  const king = hall(DAIS.king);
  const smith = loc(SMITHY, FACE.w, [-330, -160]);
  const chapelDoor = loc(CHAPEL, FACE.e, [-1230, 0]);
  const libraryDoor = loc(LIBRARY, FACE.w, [-900, 0]);
  return [
    // the stable master by the royal coach: he drives travellers to the other towns
    { ...travelGuide("palace", [COACH[0] + 280, COACH[1] + 600], 100, "นายคอกม้าฮาโรลด์"), title: "นายคอกม้าหลวง · เดินทางข้ามเมือง", look: man("top_warrior_forest", "auburn", "bottom_warrior_cocoa", "amber"),
      lines: ["รถม้าหลวงพร้อมออกเดินทางทุกเมื่อ จะไปเมืองไหนเลือกบนแผนที่ได้เลย", "ม้าขาวคู่นี้เป็นม้าที่เร็วที่สุดในคอกหลวง พาท่านถึงทุกเมืองอย่างปลอดภัย", "ที่นี่จะเป็นจุดพักของท่านด้วยก็ได้ ข้าจดชื่อไว้ให้"] },
    // the quartermaster at his store on the lane
    { id: "palace_quartermaster", x: shop[0], y: shop[1], face: 0, name: "พ่อค้าเบอร์ทรัม", title: "พ่อค้าเสบียงหลวง", role: "shop", sprite: "merchant",
      lines: ["ยา เสบียง เครื่องใช้ ของชุดเดียวกับที่ส่งให้ราชองครักษ์ เลือกได้เลย", "ใครจะขึ้นเหมืองหลวงเก่าทางเหนือ ซื้อยาติดตัวไปเยอะๆ นะ ข้างบนนั่นหนาวจัด"] },
    // the guards: two inside each gate, two at the inner gate, two by the throne
    guard("palace_guard_s1", [S + 700, -420], 0, "ทหารยามลีโอนาร์ด", "ราชองครักษ์ประตูใหญ่", ["ยินดีต้อนรับสู่พระราชวังหลวง ประตูนี้เพิ่งเปิดให้คนทั่วไปเข้าได้ไม่นานมานี้เอง", "ออกประตูใหญ่ไปคือถนนหลวง เดินลงไปทางใต้จะถึงเมืองอีเดน"]),
    guard("palace_guard_s2", [S + 700, 420], 0, "ทหารยามกอดฟรีย์", "ราชองครักษ์ประตูใหญ่", ["ห้ามก่อเรื่องในเขตพระราชวัง ที่นี่ปลอดภัยกว่าที่ไหนในอาณาจักร", "รถม้าหลวงตรงนั้นพาไปได้ทุกเมือง ถามนายคอกม้าดูสิ"], "auburn"),
    guard("palace_guard_i1", [IW - 650, -420], 180, "ทหารยามอัลริก", "ราชองครักษ์ประตูชั้นใน", ["ผ่านประตูชั้นในไปคือลานใหญ่ ท้องพระโรงอยู่ตรงสุดลาน", "รูปปั้นสองแถวในลานคือกษัตริย์ทุกพระองค์ตั้งแต่ราชวงศ์แรก"], "gold"),
    guard("palace_guard_i2", [IW - 650, 420], 180, "ทหารยามเซดริก", "ราชองครักษ์ประตูชั้นใน", ["นาฬิกาบนประตูนี้ตีบอกเวลาให้ทั้งวัง ไม่เคยเดินผิดสักนาที", "โบสถ์หลวงอยู่ทางซ้ายของลาน หอสมุดกับคลังหลวงอยู่ทางขวา"]),
    guard("palace_guard_e1", [GATE_E[0] - 420, E + 650], 90, "ทหารยามโรวัน", "ราชองครักษ์ประตูตะวันออก", ["ออกประตูตะวันออกไปคือป่าล่าสัตว์หลวง เนินสนหิมะที่พระราชาเสด็จไปล่ากวาง", "กวางเขาเงินในป่านั่นพุ่งชนแรงนัก อย่าประมาท"], "silver"),
    guard("palace_guard_e2", [GATE_E[0] + 420, E + 650], 90, "ทหารยามแกเร็ธ", "ราชองครักษ์ประตูตะวันออก", ["หมาป่าสนลงมาจากป่าสนริมแม่น้ำถึงป่าล่าสัตว์แล้ว ช่วงนี้ต้องเฝ้าประตูแน่นหนา", "พวกนักล่าของวังออกประตูนี้ทุกเช้า กลับมาตอนพลบค่ำ"]),
    guard("palace_guard_n1", [N - 650, -420], 180, "ทหารยามทอร์วัลด์", "ราชองครักษ์ประตูหลัง", ["ออกประตูหลังไปคือเหมืองหลวงเก่า เหมืองเงินที่ใช้ทำมงกุฎของราชวงศ์", "อุโมงค์ถล่มไปนานแล้ว เดี๋ยวนี้มีแต่รถเหมืองผีกับโกเลมแร่เงิน ไม่ถึงเลเวลหกสิบอย่าเพิ่งขึ้นไป"], "ink"),
    guard("palace_guard_n2", [N - 650, 420], 180, "ทหารยามบียอร์น", "ราชองครักษ์ประตูหลัง", ["ลมจากภูเขาพัดหิมะลงมาถึงประตูนี้ทุกคืน", "อุทยานหลวงอยู่ข้างหลังเรา เจ้าหญิงชอบไปนั่งที่ศาลากลางสระ"], "gold"),
    guard("palace_guard_t1", hall([-260, -720]), 180, "ราชองครักษ์ออสวัลด์", "ราชองครักษ์ท้องพระโรง", ["ถวายบังคมก่อนเข้าเฝ้าด้วย", "ท้องพระโรงเปิดให้ราษฎรเข้าเฝ้าทุกวัน ตั้งแต่ประตูวังเปิด"], "auburn"),
    guard("palace_guard_t2", hall([-260, 720]), 180, "ราชองครักษ์เฮโรลด์", "ราชองครักษ์ท้องพระโรง", ["บัลลังก์นั้นทำจากเงินในเหมืองหลวงเก่า ปิดทองทั้งองค์", "เบื้องหลังผนังคือห้องประทับ ห้ามผู้ใดล่วงเข้าไป"]),
    // the king on his throne, the chancellor by the dais
    { id: "palace_king", ...at(king), face: 180, name: "พระเจ้าอาร์เธอร์ที่ห้า", title: "พระราชาแห่งอาณาจักร", role: "talk", look: man("top_warrior_navy", "silver", "bottom_warrior_black", "amber"),
      lines: [
        "ยินดีต้อนรับ นักผจญภัย เรารอคนอย่างเจ้ามานาน",
        "ทั่วแผ่นดินมีสิ่งยิ่งใหญ่ตื่นขึ้น มังกรฟ้าบนยอดเขาหลังวัง ราชินีหิมะทางเหนือสุด แม่ทัพอสูรทางตะวันออก และเทพพิทักษ์ต้นไม้แรกสุดแดนตะวันตกเฉียงใต้",
        "ผู้ใดปราบพวกมันได้ เราจะประทานฉายาและรางวัลให้สมเกียรติ กลับมาหาเราเมื่อพร้อม",
      ] },
    { id: "palace_chancellor", ...at(hall([-200, -1100])), face: 160, name: "เสนาบดีโอลิเวอร์", title: "เสนาบดี", role: "talk", look: man("top_warrior_forest", "silver", "bottom_warrior_black", "blue"),
      lines: [
        "ข้าดูแลกระดานพระราชบัญชา ทุกดินแดนรอบอาณาจักรมีมอนสเตอร์ที่ต้องกำจัดอยู่เสมอ",
        "ทุ่งดอกไม้หลวงกับป่าล่าสัตว์เหมาะกับมือใหม่ ส่วนสันเขาหลวงกับป่าต้นไม้แรกนั้นสำหรับผู้กล้าที่แกร่งที่สุดเท่านั้น",
        "ราชการบ้านเมืองไม่เคยว่าง แต่ถ้าเจ้ามีเรื่องจะทูล ข้าจะช่วยนำความขึ้นกราบทูล",
      ] },
    // the court: the chaplain at the chapel's door, the librarian at the library's, a herald
    { id: "palace_chaplain", ...at(chapelDoor), face: -90, name: "บาทหลวงอัมโบรส", title: "บาทหลวงหลวง · รักษาฟรี", role: "heal", look: man("top_warrior_navy", "silver", "bottom_warrior_black", "teal"),
      lines: ["ขอแสงศักดิ์สิทธิ์คุ้มครองท่าน โบสถ์นี้สวดถวายพระพรแด่กษัตริย์ทุกพระองค์", "หายเหนื่อยแล้ว ไปผจญภัยต่อได้ หากจะให้วังนี้เป็นที่พักเมื่อล้มลง ไปบอกนายคอกม้าหลวงข้างรถม้าหลวงในลานชั้นนอกเถิด"] },
    { id: "palace_librarian", ...at(libraryDoor), face: 90, name: "บรรณารักษ์เอเลนอร์", title: "บรรณารักษ์หลวง", role: "talk", look: woman("top_lilac", "bottom_navy", "silver", "hime", "violet"),
      lines: [
        "พงศาวดารเล่าว่า เมื่อกษัตริย์องค์แรกรวมเผ่าทั้งหลายได้ มังกรฟ้าก็ลงมาสวมมงกุฎให้บนยอดเขาหลังวังนี้ วันนี้มันยังเฝ้ายอดเขานั้นอยู่",
        "ทางเหนือสุดใต้หน้าผาน้ำแข็งมีวังของราชินีหิมะ นางเคยเป็นเทพีผู้อ่อนโยน แต่ความเหงาพันปีทำให้หัวใจนางเย็นเยียบ",
        "ก่อนมีอาณาจักร ก่อนมีคนเสียอีก ต้นไม้ต้นแรกงอกขึ้นที่ปลายสุดตะวันตกเฉียงใต้ รากของมันยึดแผ่นดินไว้ไม่ให้จมทะเล",
      ] },
    { id: "palace_herald", ...at([-1200, -700]), face: 90, name: "เด็กเชิญสาส์นปีเตอร์", title: "มหาดเล็ก", role: "talk", look: man("top_warrior", "gold", "bottom_warrior_cocoa", "blue"),
      lines: ["พระราชาประทับในท้องพระโรงทุกวัน เดินตรงขึ้นไปสุดลานเลย", "ถ้าหลงทาง ดูที่แผนที่สิ ในวังมีป้ายบอกทุกที่"] },
    { id: "palace_maid", ...at([FOUNT[0] - 300, -900]), face: 20, name: "แม่บ้านโรซาลีน", title: "นางกำนัล", role: "talk", look: woman("top_white", "bottom_navy", "auburn", "twintail", "amber"),
      lines: ["น้ำพุสามชั้นนี้สร้างฉลองวันราชาภิเษกขององค์ปัจจุบัน", "ห้องครัวหลวงทำขนมปังด้วยแป้งจากโรงสีที่ถนนหลวง หอมไปทั่ววังทุกเช้า"] },
    // the outer ward: the captain at the parade ground, knights drilling, the smith, a stable boy
    { id: "palace_captain", ...at([PARADE.x1 - 500, PARADE.y0 + 500]), face: 135, name: "เซอร์ไกเลส", title: "หัวหน้าราชองครักษ์", role: "talk", look: man("top_warrior_navy", "auburn", "bottom_warrior_black", "amber"),
      lines: [
        "อัศวินที่ดีไม่ได้วัดกันที่ดาบ แต่วัดที่ว่าเขายืนหยัดเพื่อใคร",
        "ทางตะวันออกสุด ทัพอสูรตั้งค่ายอยู่ริมทะเล แม่ทัพของพวกมันมีเขาเหล็กโค้งและดาบใหญ่กว่าตัวคน ราชองครักษ์ของข้าเสียไปหลายคนแล้วที่นั่น",
        "ถ้าเจ้าคิดจะไปค่ายทัพอสูร ฝึกที่ลานนี้ให้คล่องก่อน แล้วค่อยมาคุยกับข้า",
      ] },
    { id: "palace_knight1", ...at([-4500, 3150]), face: 90, name: "อัศวินเอ็ดมันด์", title: "ราชองครักษ์ฝึกดาบ", role: "talk", look: man("top_warrior_navy", "ink"), lines: ["ยกดาบให้สูงกว่านี้! อีกครั้ง!", "ฝึกวันละพันครั้ง ร่างกายจะจำได้เอง"] },
    { id: "palace_knight2", ...at([-4500, 3600]), face: -90, name: "อัศวินโรแลนด์", title: "ราชองครักษ์ฝึกดาบ", role: "talk", look: man("top_warrior_navy", "gold"), lines: ["ฮึ่ม แขนข้าล้าไปหมดแล้ว", "หัวหน้าไกเลสไม่ยอมให้พักจนกว่าจะตะวันตกดิน"] },
    { id: "palace_knight3", ...at([-3600, 3150]), face: 90, name: "อัศวินหญิงอิโซลด์", title: "ราชองครักษ์ฝึกดาบ", role: "talk", look: woman("top_adventurer_navy", "bottom_adventurer_black", "crimson", "twintail", "blue"),
      lines: ["ราชองครักษ์ไม่แบ่งชายหญิง ใครฝีมือดีก็ได้รับใช้พระราชา", "ข้าเคยไปป่าล่าสัตว์กับพระราชา พระองค์ยิงธนูแม่นกว่าพวกเราทุกคน"] },
    { id: "palace_knight4", ...at([-3600, 3600]), face: -90, name: "อัศวินบาร์โธโลมิว", title: "ราชองครักษ์ฝึกดาบ", role: "talk", look: man("top_warrior_navy", "auburn"), lines: ["ระวังด้วย ดาบฝึกก็ทำให้หัวโนได้นะ", "โรงทหารข้างหลังนั่น นอนกันห้องละสิบคน กรนเสียงดังทั้งคืน"] },
    { id: "palace_smith", ...at(smith), face: toward(smith, loc(SMITHY, FACE.w, [-700, 0])), name: "ช่างวูล์ฟกัง", title: "ช่างตีเหล็กหลวง · ตีบวก สร้างไอเทม", role: "smith", look: man("top_warrior", "ink", "bottom_warrior_cocoa", "amber"),
      lines: ["ดาบของราชองครักษ์ทุกเล่มผ่านค้อนของข้า เอาหินนภามาตีบวกอาวุธ หินดารามาตีบวกชุด", "มีแร่ หนัง หรือเศษอัญมณีพอเมื่อไร ข้าสร้างอุปกรณ์ให้ได้ เงินจากเหมืองหลวงเก่าตีออกมาได้คมที่สุด"] },
    { id: "palace_stableboy", ...at([PADDOCK.x1 + 250, -3700]), face: 180, name: "เด็กเลี้ยงม้าทิมมี่", title: "เด็กเลี้ยงม้า", role: "talk", look: man("top_warrior_forest", "auburn", "bottom_warrior_cocoa", "amber"),
      lines: ["ม้าขาวในคอกนี้สืบสายมาจากม้าทรงของกษัตริย์องค์แรกเลยนะ", "ม้าบางตัวมาจากทุ่งเลี้ยงม้าทางตะวันออก คนเลี้ยงที่นั่นเลือกตัวที่ดีที่สุดส่งเข้าวัง"] },
    // the garden: the princess at the pavilion, the gardener at the maze, a lady on the walk
    { id: "palace_princess", ...at([POND_C[0] - 120, POND_C[1] + 130]), face: 180, name: "เจ้าหญิงเอเลียนา", title: "เจ้าหญิง", role: "talk", look: woman("top_priestess_white", "bottom_priestess_white", "gold", "hime", "blue"),
      lines: [
        "อ๊ะ มีคนมาหาด้วย ปกติที่ศาลานี้มีแต่ข้ากับปลาในสระ",
        "เสด็จพ่อไม่ยอมให้ข้าออกไปนอกวังเลย ข้าอยากเห็นทะเลที่ท่าเรืออีเดนสักครั้ง",
        "ถ้าเจ้าออกไปผจญภัย กลับมาเล่าให้ข้าฟังบ้างนะ สัญญาสิ",
      ] },
    { id: "palace_gardener", ...at([MAZE_C[0] - 1250, MAZE_C[1] + 450]), face: -60, name: "ลุงอัลเฟรด", title: "คนสวนหลวง", role: "talk", look: man("top_warrior_forest", "silver", "bottom_warrior_cocoa", "amber"),
      lines: ["ข้าตัดแต่งพุ่มไม้เขาวงกตนี้มาสี่สิบปีแล้ว ยังหลงอยู่ข้างในเองบ่อยๆ", "สิงโตกับหงส์นั่นใช้เวลาดัดสามปีกว่าจะเป็นรูปร่าง ระวังอย่าไปเด็ดใบเล่นนะ", "ตรงกลางเขาวงกตมีนาฬิกาแดด ใครเดินไปถึงได้ก่อนเที่ยงจะโชคดีทั้งปี"] },
    { id: "palace_lady", ...at([5300, -900]), face: 0, name: "ท่านหญิงเซซิเลีย", title: "นางสนองพระโอษฐ์", role: "talk", look: woman("top_rose", "bottom_wine", "ink", "hime", "violet"),
      lines: ["ซุ้มกุหลาบเหล่านี้ปลูกไว้ตั้งแต่สมัยพระราชินีองค์ก่อน บานตลอดปีแม้หิมะตก", "ประตูหลังสุดทางเดินนี้ไปเหมืองหลวงเก่า แต่ท่านหญิงอย่างข้าไม่เคยออกไปหรอก"] },
  ];
}

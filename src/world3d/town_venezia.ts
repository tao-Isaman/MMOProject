// เวนิชเซีย (Venezia), the trading port on its lagoon in the south-west of the western lands: a
// city of canals whose ships sail to every port, and where the caravan road sets off north-east
// across the dry plains to Bahamas. Laid out as if drawn on paper like the player's other towns,
// in metres on the plan (u east, v south, the piazza's middle near the origin):
//   - the open lagoon all along the west (u < 12) out to the edge, channel markers and gondolas on
//     it, and the open bacino of the harbour on the south (v > 160); the land on the north and east,
//     closed by a brick wall with swallowtail merlons (towers at the corners and along it) and two
//     open gates: north on the axis of the basilica, whose road turns west outside the wall and runs
//     along it and over the strip of land at the lagoon's head to the north-west corner, on to the
//     plains below Noa, and goes straight on north too, out of the north side to the lavender
//     hills; and the north-east one in the east wall, the caravan road to the dry plains
//     (and from them south to the ancient plain, or on to Bahamas);
//   - the grand canal, 16 m wide, winding through in a reverse S: in from the lagoon on the west
//     (v 44), round a bend south past the Rialto, which carries the market street over it, east
//     round two more bends and south into the bacino; a timber bridge crosses its last reach;
//   - the great piazza (u 108-144, v 80-152) opening south onto the water: the domed basilica across
//     its north end with three bronze flagpoles before it, arcaded procuratie down both long sides
//     (cafés under them, the mask shop's stall), the campanile at the south-east corner, the Doge's
//     palace beyond it along the water, the winged-lion column on the molo and the gondola station;
//   - the riva along the bacino from the grand canal to the east wall: lamps, cargo, and two great
//     stone piers where the merchant galleons lie and the captain sails for Eden, Yodia and Suzhou;
//     an island with a church and its tower across the water;
//   - the west island (Dorsoduro) between the lagoon and the grand canal, cut by Rio A (east-west)
//     and Rio C (north-south): the Rialto market in its campo at the bridge's foot, rows of houses
//     on fondamente along the lagoon and the rii, the Zattere along the bacino and a domed church
//     at the grand canal's mouth;
//   - the north quarter between the wall and the grand canal: a lane along the wall, palazzi on the
//     canal's north bank and round its bend, a campo with its well-head, a hidden garden court;
//   - the Merceria from the Rialto's foot to the piazza, its shops; behind the basilica a lane round
//     its apse, and the north road out through the north gate;
//   - the east quarter (Castello): the long calle behind the piazza's arcades down to the gondola
//     basin, the smith's forge on its quay, the campo by the north-east gate where the caravans
//     load, houses round the basin, Rio B from the basin down to the bacino with bridges on the
//     street from the piazza to the east wall and on the riva, a public garden by the east wall.
// Bridges are low decks at street level; the water is cut away on either side of them, never
// under them, and solids over all the water keep everyone on the streets. The whole town is built
// at full size and drawn at TOWN_SCALE.

import * as THREE from "three";
import { material, defineMaterial } from "./textures";
import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import { KIT } from "./kits/venezia";
import { Plan, TownBuilder, useKits, colourways, protoOf, facing, FACE, travelGuide, gateWay, waysOut } from "./town";
import type { Side, Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(KIT);

// Colourways: the palazzi and houses in every pastel of the lagoon (the kit's pieces come in pink,
// ochre, salmon, cream and rust), and a few with brown or blue shutters.
defineMaterial("VeneziaTown_Peach", { map: "plaster", tint: "#f1b98f", bump: 0.6 });
defineMaterial("VeneziaTown_Lilac", { map: "plaster", tint: "#dcb7c6", bump: 0.6 });
defineMaterial("VeneziaTown_ShutterBrown", { map: "wood", tint: "#6d4a32", bump: 1 });
defineMaterial("VeneziaTown_ShutterBlue", { map: "wood", tint: "#3f6688", bump: 1 });
const WALLS = ["Venezia_Pink", "Venezia_Ochre", "Venezia_Salmon", "Venezia_Cream"];
const paint = (to: string, shutter?: string): Record<string, string> => ({
  ...Object.fromEntries(WALLS.filter((w) => w !== to).map((w) => [w, to])),
  ...(shutter ? { Venezia_Shutter: shutter } : {}),
});
colourways({
  pink: paint("Venezia_Pink"),
  ochre: paint("Venezia_Ochre", "VeneziaTown_ShutterBrown"),
  salmon: paint("Venezia_Salmon"),
  cream: paint("Venezia_Cream", "VeneziaTown_ShutterBlue"),
  rust: paint("Venezia_Rust"),
  peach: paint("VeneziaTown_Peach"),
  lilac: paint("VeneziaTown_Lilac", "VeneziaTown_ShutterBrown"),
});
// which colourways each house may take ("" = the kit's own colours)
const TINTS: Record<string, string[]> = {
  palazzo: ["", "ochre", "salmon", "cream", "", "lilac", "peach"],
  palazzo_grand: ["", "pink", "salmon", "cream", "lilac"],
  canal_house: ["", "pink", "ochre", "cream", "rust", "peach", "lilac"],
  canal_house_narrow: ["", "pink", "ochre", "salmon", "peach", "", "lilac"],
  shop_house: ["", "ochre", "salmon", "pink"],
};

// ---- the plan in metres -> the world: (112, 100) at the origin ----
type UV = [number, number];
const { P, rect, band } = new Plan(100, 112, 100);
const WATER_Z = -100; // the water's surface, a metre under the streets

// a quarter (or any part) of a circle round c, radius r, from angle a0 to a1 (degrees, on the plan),
// without its first point
const arc = (c: UV, r: number, a0: number, a1: number, n = 8): UV[] =>
  Array.from({ length: n }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * (i + 1)) / n) * Math.PI) / 180;
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)] as UV;
  });

// ---- the water ----
// the canals by their centrelines; each bridge crossing cuts a gap (half its width along the canal)
// in the water and its solids
interface Canal { pts: UV[]; w: number; cuts: { at: UV; half: number }[] }
const GRAND: Canal = {
  pts: [[-40, 44], [50, 44], ...arc([50, 56], 12, -90, 0), [62, 96], ...arc([74, 96], 12, 180, 90), [78, 108], ...arc([78, 120], 12, -90, 0), [90, 196]],
  w: 16,
  cuts: [{ at: [62, 80], half: 6.6 }, { at: [90, 136], half: 2.6 }],
};
const RIO_A: Canal = { pts: [[-30, 124], [86, 124]], w: 8, cuts: [{ at: [22, 124], half: 2 }, { at: [46, 124], half: 2 }] };
const RIO_B: Canal = { pts: [[184, 94], [184, 196]], w: 8, cuts: [{ at: [184, 110], half: 2 }, { at: [184, 156], half: 2 }] };
const RIO_C: Canal = { pts: [[31, 48], [31, 122]], w: 7, cuts: [{ at: [31, 70], half: 2 }, { at: [31, 98], half: 2 }] };
const CANALS = [GRAND, RIO_A, RIO_B, RIO_C];
const BASIN = { u0: 172, v0: 70, u1: 200, v1: 98 };
// the island across the bacino with its church
const ISLE = { u0: 100, v0: 198, u1: 150, v1: 228 };
// the piers out into the bacino (u), 40 m long
const PIERS = [162, 204];
const PIER_END = 200;

// ---- the land ----
const NORTH = 0, EAST = 212, WEST = 12, SHORE = 160;
const GATE_N: UV = [126, NORTH], GATE_NE: UV = [EAST, 34];
const SPAWN: UV = [126, 146];
// the north road: out of the north gate, west along the outside of the wall and over the strip of
// land at the lagoon's head to the north-west corner, where it leaves for the plains below Noa
// (v0.4: its corner cut a little sharper, clear of the way north to the lavender hills)
const NORTH_ROAD: UV[] = [[126, 2], [126, -3], [121, -7.5], [110, -7.5], [60, -7.5], [12, -7.5], [-10, -7.5], [-22, -12], [-40, -27], [-80, -60]];
const WAY_NW: UV = [-11, -7.5];
// the lagoon's head: its shore along the foot of that strip, then away north-west past the edge
const LAGOON: UV[] = [[WEST, -2], [-16, -3], [-28, -12], [-48, -34], [-90, -64], [-300, -70], [-300, 420], [WEST, 420]];

// the distance along a polyline to the point nearest p, and the point at a distance
function along(pts: UV[], p: UV): number {
  let best = Infinity, at = 0, s = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [a, b] = [pts[i], pts[i + 1]], du = b[0] - a[0], dv = b[1] - a[1], L = Math.hypot(du, dv);
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * du + (p[1] - a[1]) * dv) / (L * L)));
    const d = Math.hypot(a[0] + du * t - p[0], a[1] + dv * t - p[1]);
    if (d < best) [best, at] = [d, s + L * t];
    s += L;
  }
  return at;
}
function pointAt(pts: UV[], s: number): UV {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [a, b] = [pts[i], pts[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (s <= L || i === pts.length - 2) return [a[0] + ((b[0] - a[0]) * s) / L, a[1] + ((b[1] - a[1]) * s) / L];
    s -= L;
  }
  return pts[pts.length - 1];
}
// a canal's centreline cut into the reaches between its bridges
function reaches(c: Canal): UV[][] {
  const lens = c.pts.slice(1).map((p, i) => Math.hypot(p[0] - c.pts[i][0], p[1] - c.pts[i][1]));
  const total = lens.reduce((t, l) => t + l, 0);
  const gaps = c.cuts.map((k) => [along(c.pts, k.at) - k.half, along(c.pts, k.at) + k.half]).sort((p, q) => p[0] - q[0]);
  const spans: [number, number][] = [];
  let from = 0;
  for (const [g0, g1] of gaps) {
    spans.push([from, g0]);
    from = g1;
  }
  spans.push([from, total]);
  return spans.map(([s0, s1]) => {
    const out: UV[] = [pointAt(c.pts, s0)];
    let s = 0;
    for (let i = 0; i < c.pts.length; i++) {
      if (s > s0 + 0.01 && s < s1 - 0.01) out.push(c.pts[i]);
      s += lens[i] ?? 0;
    }
    out.push(pointAt(c.pts, s1));
    return out;
  });
}
// the two banks of a reach (as Plan.band offsets them), each with the plan direction of the water
function banks(pts: UV[], w: number): { line: UV[]; toWater: UV[] }[] {
  const left: UV[] = [], right: UV[] = [], nl: UV[] = [], nr: UV[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const du = b[0] - a[0], dv = b[1] - a[1], L = Math.hypot(du, dv) || 1, nu = -dv / L, nv = du / L;
    left.push([pts[i][0] + (nu * w) / 2, pts[i][1] + (nv * w) / 2]);
    right.push([pts[i][0] - (nu * w) / 2, pts[i][1] - (nv * w) / 2]);
    nl.push([-nu, -nv]);
    nr.push([nu, nv]);
  }
  return [{ line: left, toWater: nl }, { line: right, toWater: nr }];
}

export function buildVenezia(quality: { flowers: number }): Town {
  const town = new TownBuilder(404);
  const { put, rnd, extra } = town;
  const post = (r = 22): SolidSpec[] => [{ kind: "post", x: 0, y: 0, r }];
  const at = (u: number, v: number) => P(u, v);
  const head = (du: number, dv: number) => facing(du, dv);

  // ---- houses first (each row paves the ground along its front): rows wall to wall, their fronts
  // on the plan line a -> b facing plan direction `face`, centred on the line ----
  const strips: Poly[] = [];
  const row = (a: UV, b: UV, face: UV, pieces: string[], start = 0, gap = 12) => {
    const A = at(...a), B = at(...b), L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const dx = (B[0] - A[0]) / L, dy = (B[1] - A[1]) / L;
    const h = head(face[0], face[1]), r = (h * Math.PI) / 180, fx = -Math.cos(r), fy = -Math.sin(r);
    const along = -Math.sin(r) * dx + Math.cos(r) * dy > 0 ? 1 : -1;
    const pick = (piece: string) => {
      const tints = TINTS[piece] ?? [""];
      const colours = tints[Math.floor(rnd() * tints.length)] || undefined;
      return { piece, colours, f: protoOf(`venezia:${piece}`, colours).foot };
    };
    const list: ReturnType<typeof pick>[] = [];
    let t = 0;
    for (let i = start; ; i++) {
      let p = pick(pieces[i % pieces.length]);
      if (t + (p.f.y1 - p.f.y0) > L + 40) {
        p = pick("canal_house_narrow");
        if (t + (p.f.y1 - p.f.y0) > L + 40) break;
      }
      list.push(p);
      t += p.f.y1 - p.f.y0 + gap;
    }
    // paving under the fronts (the walls stand back of the line behind balconies and steps)
    strips.push([[A[0] + fx * 60, A[1] + fy * 60], [B[0] + fx * 60, B[1] + fy * 60], [B[0] - fx * 220, B[1] - fy * 220], [A[0] - fx * 220, A[1] - fy * 220]]);
    let s = (L - (t - gap)) / 2;
    for (const p of list) {
      const w = p.f.y1 - p.f.y0, c = along > 0 ? s - p.f.y0 : s + p.f.y1;
      put(`venezia:${p.piece}`, [A[0] + dx * c + fx * p.f.x0, A[1] + dy * c + fy * p.f.x0], h, { colours: p.colours });
      s += w + gap;
    }
  };
  const H = ["canal_house", "canal_house_narrow", "canal_house", "palazzo", "canal_house_narrow", "canal_house", "shop_house"];
  const N: UV = [0, -1], S: UV = [0, 1], E: UV = [1, 0], W: UV = [-1, 0];
  // the north quarter
  row([16, 14], [114, 14], S, H);
  row([14, 29.4], [50, 29.4], S, ["palazzo", "canal_house", "palazzo"]);
  row([52, 20], [76, 20], N, ["canal_house", "canal_house_narrow"], 1);
  row([99.4, 22], [99.4, 36], W, ["canal_house_narrow"]);
  row([122, 21], [122, 43], E, ["canal_house", "canal_house_narrow"], 2);
  row([80, 36], [96, 36], N, ["canal_house", "canal_house_narrow"]);
  row([106, 52], [106, 65], E, ["canal_house_narrow", "canal_house"]);
  row([70.6, 57], [70.6, 74], W, ["palazzo_grand"]);
  {
    // a palazzo on the outside of the first bend, facing into it
    const a = (-45 * Math.PI) / 180, [cu, cv] = [50 + 26 * Math.cos(a), 56 + 26 * Math.sin(a)];
    put("venezia:palazzo", at(cu, cv), head(-Math.cos(a), -Math.sin(a)), { colours: "ochre" });
  }
  {
    // and one facing the third bend, south of the Merceria
    const a = (-58 * Math.PI) / 180, [cu, cv] = [78 + 25.6 * Math.cos(a), 120 + 25.6 * Math.sin(a)];
    put("venezia:palazzo", at(cu, cv), head(-Math.cos(a), -Math.sin(a)), { colours: "salmon" });
  }
  row([70.6, 89], [70.6, 96], W, ["canal_house"]);
  // the Merceria
  row([84, 76], [106, 76], S, ["shop_house", "canal_house", "shop_house"]);
  // the piazza: arcades down both sides, the Doge's palace by the water
  row([108, 84], [108, 132], E, ["procuratie"], 0, 0);
  row([108, 140], [108, 148], E, ["procuratie"], 0, 0);
  row([144, 84], [144, 106], W, ["procuratie"], 0, 0);
  row([144, 114], [144, 128], W, ["procuratie"], 0, 0);
  put("venezia:fondaco", at(150.2, 140), FACE.w);
  // the east quarter
  row([132, 29.4], [204, 29.4], S, H, 3);
  row([146, 53], [146, 79], W, ["canal_house_narrow"]);
  row([164, 40], [164, 105], E, ["canal_house_narrow", "canal_house", "shop_house"]);
  row([180, 40], [180, 61], E, ["canal_house_narrow"]);
  row([200, 44], [200, 61], W, ["canal_house_narrow", "canal_house"]);
  row([172, 61.4], [200, 61.4], N, ["canal_house", "canal_house_narrow"]);
  row([200.6, 72], [200.6, 100], W, ["palazzo", "canal_house"]);
  row([156, 114], [180, 114], N, ["shop_house", "canal_house"]);
  row([156, 152], [179.4, 152], S, ["palazzo", "canal_house"]);
  // the west island
  row([17, 51.4], [27, 51.4], N, ["canal_house"]);
  row([35, 51.4], [50, 51.4], N, ["palazzo"]);
  row([17, 74], [17, 94], W, ["canal_house_narrow", "canal_house"]);
  row([17, 102], [17, 112], W, ["canal_house"]);
  row([17, 114], [27, 114], S, ["canal_house_narrow"]);
  row([42, 114], [54, 114], S, ["palazzo"]);
  row([14, 134], [58, 134], N, ["canal_house", "canal_house_narrow", "shop_house"]);
  row([14, 152], [58, 152], S, ["palazzo", "canal_house"]);
  // the church at the grand canal's mouth, facing the piazza across it
  put("venezia:basilica", at(66, 144), FACE.e, { s: 0.6 });

  // ---- ground: streets (cobbles), campi and the piazza (flagstones), the water ----
  const roads: Poly[] = [
    rect(16, 14, 122, 20),     // the lane along the north wall
    rect(122, -6, 130, 44),    // the north road, from outside the north gate to behind the basilica
    rect(122, -40, 130, -6),   // (v0.4) and straight on north out of the town to the lavender hills
    band(NORTH_ROAD, 6),       // and on outside the wall to the north-west corner
    rect(130, 30, 260, 38),    // the north-east road, out through the caravan gate
    rect(106, 44, 146, 52),    // the lane round the basilica's apse
    rect(106, 52, 113, 80),    // down its west side
    rect(139, 52, 146, 80),    // and its east side
    rect(70, 76, 108, 84),     // the Merceria, from the Rialto to the piazza
    rect(144, 106, 209, 114),  // the street from the piazza east to the wall
    rect(164, 38, 171, 106),   // the long calle behind the arcades, down to the basin
  ];
  const PIAZZA = rect(108, 80, 144, 152);
  const plazas: Poly[] = [
    PIAZZA,
    rect(98, 152, 212, 160),   // the riva along the bacino
    rect(12, 152, 82, 160),    // the Zattere
    rect(78, 20, 100, 36),     // the campo of the north quarter
    rect(180, 38, 200, 62),    // the caravans' campo by the north-east gate
    rect(35, 62, 54, 104),     // the Rialto market
    rect(70, 72, 82, 88),      // the Rialto's east foot
    rect(113, 52, 139, 80),    // the basilica's precinct
    rect(196, 114, 200, 152),  // the paths of the public garden
    rect(188, 131, 212, 135),
    rect(12, 52, 17, 120),     // the fondamenta along the lagoon
    rect(12, 30, 50, 36),      // and along the grand canal's north bank
    rect(17, 114, 64, 120),    // along Rio A's north bank
    rect(12, 128, 82, 134),    // and its south bank
    rect(74, 128, 82, 152),    // the timber bridge's west foot
    rect(98, 128, 108, 152),   // and its east foot, the corner of the riva
    ...PIERS.map((u) => rect(u - 3.2, SHORE, u + 3.2, PIER_END)),
    ...strips,
  ];
  const water: Poly[] = [
    LAGOON.map(([u, v]) => P(u, v)),                                        // the lagoon
    rect(-300, SHORE, ISLE.u0, 420), rect(ISLE.u1, SHORE, 450, 420),      // the bacino round the island
    rect(ISLE.u0, SHORE, ISLE.u1, ISLE.v0), rect(ISLE.u0, ISLE.v1, ISLE.u1, 420),
    rect(BASIN.u0, BASIN.v0, BASIN.u1, BASIN.v1),
  ];
  for (const c of CANALS) for (const r of reaches(c)) water.push(band(r, c.w));
  const area = { x0: P(0, 300)[0], x1: P(0, -160)[0], y0: P(300, 0)[1], y1: P(-120, 0)[1] };
  const ground = buildPaved({ area, roads, plazas, water, base: "grass", road: [0.78, 0.72, 0.66], plaza: [0.93, 0.89, 0.82] });
  const isWater = (u: number, v: number) => ground.kind(...at(u, v)) === 3;
  // the piers stand in the water (their paving is drawn over it)
  const onPier = (u: number, v: number) => v > SHORE && v < PIER_END && PIERS.some((p) => Math.abs(u - p) < 3.2);

  // ---- solids over the water: the canals reach by reach (circles at their bends), the lagoon,
  // the bacino but for the piers, the basin ----
  for (const c of CANALS)
    for (const r of reaches(c)) {
      for (let i = 0; i + 1 < r.length; i++) {
        const A = at(...r[i]), B = at(...r[i + 1]), L = Math.hypot(B[0] - A[0], B[1] - A[1]);
        if (L < 1) continue;
        extra.push({ kind: "water", x: (A[0] + B[0]) / 2, y: (A[1] + B[1]) / 2, w: L, d: c.w * 100, rot: (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI });
        if (i > 0) extra.push({ kind: "water", x: A[0], y: A[1], r: (c.w * 100) / 2 });
      }
    }
  const box = (u0: number, v0: number, u1: number, v1: number) => {
    const [x0, y0] = at(u0, v1), [x1, y1] = at(u1, v0);
    extra.push({ kind: "water", x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: Math.abs(x1 - x0), d: Math.abs(y1 - y0), rot: 0 });
  };
  box(-60, -3, WEST, SHORE + 80);
  {
    let u = -60;
    for (const p of PIERS) {
      box(u, SHORE, p - 3.2, SHORE + 80);
      box(p - 3.2, PIER_END, p + 3.2, SHORE + 80);
      u = p + 3.2;
    }
    box(u, SHORE, 300, SHORE + 80);
  }
  box(BASIN.u0, BASIN.v0, BASIN.u1, BASIN.v1);

  // ---- the fondamenta: a quay wall along every edge of the water, where land stands behind it ----
  // along a plan line, its water toward plan direction `tw`, in pieces about 4 m long
  const quay = (a: UV, b: UV, tw: UV) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 0.5) return;
    const n = Math.max(1, Math.round(L / 4)), l = L / n, du = (b[0] - a[0]) / L, dv = (b[1] - a[1]) / L;
    for (let i = 0; i < n; i++) {
      const m: UV = [a[0] + du * l * (i + 0.5), a[1] + dv * l * (i + 0.5)];
      // only where there is land behind (not where another water meets this one)
      if (isWater(m[0] - tw[0] * 1.2, m[1] - tw[1] * 1.2) || onPier(m[0] - tw[0] * 1.2, m[1] - tw[1] * 1.2)) continue;
      put("venezia:fondamenta", at(m[0] - tw[0] * 0.3, m[1] - tw[1] * 0.3), head(tw[0], tw[1]), { sy: l / 4, solid: "none" });
    }
  };
  for (const c of CANALS)
    for (const r of reaches(c))
      for (const { line, toWater } of banks(r, c.w))
        for (let i = 0; i + 1 < line.length; i++) {
          const tw: UV = [(toWater[i][0] + toWater[i + 1][0]) / 2, (toWater[i][1] + toWater[i + 1][1]) / 2];
          quay(line[i], line[i + 1], tw);
        }
  quay([WEST, -2], [WEST, SHORE], [-1, 0]);
  quay([-16, -3], [WEST, -2], [0, 1]);
  quay([WEST, SHORE], [EAST - 4, SHORE], [0, 1]);
  quay([BASIN.u0, BASIN.v0], [BASIN.u1, BASIN.v0], [0, 1]);
  quay([BASIN.u0, BASIN.v1], [BASIN.u1, BASIN.v1], [0, -1]);
  quay([BASIN.u0, BASIN.v0], [BASIN.u0, BASIN.v1], [1, 0]);
  quay([BASIN.u1, BASIN.v0], [BASIN.u1, BASIN.v1], [-1, 0]);
  // round the island
  quay([ISLE.u0, ISLE.v0], [ISLE.u1, ISLE.v0], [0, -1]);
  quay([ISLE.u0, ISLE.v1], [ISLE.u1, ISLE.v1], [0, 1]);
  quay([ISLE.u0, ISLE.v0], [ISLE.u0, ISLE.v1], [-1, 0]);
  quay([ISLE.u1, ISLE.v0], [ISLE.u1, ISLE.v1], [1, 0]);

  // ---- the bridges: low decks across the water, parapets solid either side ----
  const rails = (x: number, len: number): SolidSpec[] => [{ kind: "rail", x: -x, y: 0, w: 30, d: len, rot: 0 }, { kind: "rail", x, y: 0, w: 30, d: len, rot: 0 }];
  for (const [c, k] of [[RIO_A, 0], [RIO_A, 1], [RIO_B, 0], [RIO_B, 1], [RIO_C, 0], [RIO_C, 1]] as const) {
    const p = c.cuts[k].at, s = along(c.pts, p), q = pointAt(c.pts, s + 1);
    put("venezia:bridge", at(...p), head(q[0] - p[0], q[1] - p[1]), { solid: rails(175, 1160) });
  }
  put("venezia:rialto_bridge", at(62, 80), FACE.s, { solid: [...rails(625, 2500), { kind: "shops", x: -335, y: 0, w: 270, d: 2000, rot: 0 }, { kind: "shops", x: 335, y: 0, w: 270, d: 2000, rot: 0 }] });
  put("venezia:bridge_wooden", at(90, 136), FACE.s, { solid: rails(236, 2300) });

  // ---- the city wall: 8 m lengths between towers, the two gates ----
  const run = (a: UV, b: UV, out: Side, gaps: number[] = []) => town.wall(at(...a), at(...b), out, "venezia:city_wall", { gaps: gaps.map((g) => g * 100), gap: 1760 });
  run([WEST + 7, NORTH], [EAST, NORTH], "n", [GATE_N[0] - WEST - 7]);
  run([EAST, NORTH], [EAST, SHORE - 7], "e", [GATE_NE[1]]);
  const tower = (u: number, v: number) => put("venezia:wall_tower", at(u, v), 0, { solid: [{ kind: "tower", x: 0, y: 0, w: 700, d: 700, rot: 0 }] });
  // (one closing the street from the piazza where it meets the wall)
  for (const [u, v] of [[WEST + 4, NORTH], [64, NORTH], [176, NORTH], [EAST, NORTH], [EAST, 72], [EAST, 110], [EAST, SHORE - 4]] as UV[]) tower(u, v);
  // gates: brick towers either side of an open passage along the gate's own X
  const gateSolid: SolidSpec[] = [];
  for (const s of [-1, 1]) gateSolid.push({ kind: "gate", x: 170, y: s * 560, w: 700, d: 660, rot: 0 }, { kind: "gate", x: 0, y: s * 236, w: 300, d: 52, rot: 0 }, { kind: "gate", x: -180, y: s * 340, w: 70, d: 160, rot: 0 });
  put("venezia:city_gate", at(...GATE_N), FACE.n, { solid: gateSolid });
  put("venezia:city_gate", at(...GATE_NE), FACE.e, { solid: gateSolid });

  // ---- the piazza ----
  put("venezia:basilica", at(126, 67.6), FACE.s);
  put("venezia:campanile", at(138, 124), 0);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 9; j++) put("venezia:piazza_tile", at(114 + i * 8, 88 + j * 8), 0);
  for (const u of [116, 126, 136]) put("venezia:flagpole", at(u, 86), FACE.s, { solid: post(100) });
  // cafés under the arcades, the mask shop, lamps down both sides
  for (const [u, v] of [[113, 96], [113, 118], [139, 92]] as UV[]) put("venezia:cafe_set", at(u, v), rnd() * 40);
  put("venezia:mask_stall", at(112, 106), FACE.e);
  for (let v = 90; v <= 146; v += 14) {
    put("venezia:street_lamp", at(109.6, v + 7), 0, { solid: post(26) });
    if (v < 120) put("venezia:street_lamp", at(142.4, v), 0, { solid: post(26) });
  }
  // the molo: the lion column, the gondola station, lamps and benches along the water
  put("venezia:lion_column", at(116, 155), FACE.s, { solid: [{ kind: "column", x: 0, y: 0, r: 200 }] });
  put("venezia:lion_column", at(136, 155), FACE.s, { solid: [{ kind: "column", x: 0, y: 0, r: 200 }] });
  put("venezia:gondola_station", at(126, 162.7), FACE.s, { z: WATER_Z, solid: "none" });
  for (const u of [104, 146, 172, 194, 210]) put("venezia:riva_lamp", at(u, 158.6), 0, { solid: post(36) });
  for (const [u, v] of [[148, 157], [152, 157.6]] as UV[]) put("common:bench", at(u, v), FACE.s);

  // ---- the harbour: the great piers, the galleons, cargo, lamps ----
  for (const u of PIERS) for (let v = SHORE + 2; v < PIER_END; v += 4) put("venezia:harbour_pier", at(u, v), FACE.s, { solid: "none" });
  for (const u of PIERS) for (const v of [176, 198]) put("venezia:riva_lamp", at(u - 2.4, v), 0, { solid: post(36) });
  put("venezia:galleon", at(169.4, 179), FACE.n, { z: WATER_Z });
  put("venezia:galleon", at(196.8, 181), FACE.s, { z: WATER_Z });
  for (const [u, v, h] of [[163.5, 168, 90], [160.5, 190, 0], [205, 188, 20], [158, 156, 90]] as const) put("venezia:cargo_bales", at(u, v), h);
  for (const [u, v] of [[161, 172], [163.2, 194], [203, 166], [205.5, 175]] as UV[]) put("common:crate", at(u, v), rnd() * 90);
  // gondolas moored off the molo and the riva, paline in the water
  for (const [u, v, h] of [[110, 163.5, 92], [140, 164, 85], [150, 166, 96], [92, 166, 10]] as const) put("venezia:gondola", at(u, v), h, { z: WATER_Z });
  for (const [u, v] of [[106, 162], [118, 161.5], [134, 161.5], [146, 162]] as UV[]) put("venezia:mooring_pole", at(u, v), 0, { solid: "none" });

  // ---- the island across the bacino: its church, tower and trees ----
  put("venezia:basilica", at(125, 214), FACE.n, { s: 0.55 });
  put("venezia:campanile", at(141, 220), 0, { s: 0.8 });
  for (const [u, v, k] of [[106, 204, "Pine"], [108, 222, "RoundTree"], [144, 204, "Pine"]] as const) put(`flora:${k}`, at(u, v), rnd() * 360, { s: 0.8 });

  // ---- the grand canal: gondolas, paline before the palazzi, the Rialto's gondola station ----
  put("venezia:gondola_station", at(55.4, 95), FACE.e, { z: WATER_Z, solid: "none" });
  for (const [u, v, h] of [[58, 66, 0], [66, 92, 180], [20, 47, 90], [40, 41, 270], [86, 150, 170], [94, 126, 0]] as const) put("venezia:gondola", at(u, v), h, { z: WATER_Z });
  for (const [u, v] of [[68.4, 60], [68.4, 70], [24, 37.4], [44, 37.4], [56, 54], [96.4, 140], [83.6, 148]] as UV[]) put("venezia:mooring_poles", at(u, v), rnd() * 360, { solid: "none" });
  // the basin: its gondola station, gondolas on the water, the smith's forge on the quay
  put("venezia:gondola_station", at(173.4, 84), FACE.e, { z: WATER_Z, solid: "none" });
  for (const [u, v, h] of [[186, 76, 90], [190, 90, 80], [178, 94, 100]] as const) put("venezia:gondola", at(u, v), h, { z: WATER_Z });
  put("venezia:anvil_forge", at(166.2, 92), FACE.e);
  // the Rialto market: stalls in two rows, a well, cargo
  for (let v = 66; v <= 98; v += 8) {
    if (v < 76 || v > 86) put(v % 16 === 2 ? "venezia:spice_stall" : "venezia:market_stall", at(39.5, v), FACE.e);
    if (v < 74 || v > 88) put("venezia:market_stall", at(48.5, v), FACE.w);
  }
  put("venezia:well_head", at(44, 80), 0, { solid: [{ kind: "well", x: 0, y: 0, r: 130 }] });
  put("venezia:cargo_bales", at(50, 100.5), 0);
  // the well-heads of the campi
  put("venezia:well_head", at(89, 28), 0, { solid: [{ kind: "well", x: 0, y: 0, r: 130 }] });
  put("venezia:well_head", at(190, 50), 0, { solid: [{ kind: "well", x: 0, y: 0, r: 130 }] });
  // the caravans loading in the campo by the north-east gate
  put("common:market_cart", at(194, 54), FACE.e);
  put("common:market_cart", at(186, 42), 20);
  put("venezia:cargo_bales", at(197, 46), 90);
  for (const [u, v] of [[183, 56], [184, 59]] as UV[]) put("common:crate", at(u, v), rnd() * 90);

  // ---- lamps along the streets and the fondamente ----
  const lamps = (a: UV, b: UV, step: number, skip: (u: number, v: number) => boolean = () => false) => {
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let i = 0; i <= n; i++) {
      const u = a[0] + ((b[0] - a[0]) * i) / n, v = a[1] + ((b[1] - a[1]) * i) / n;
      if (!skip(u, v)) put("venezia:street_lamp", at(u, v), 0, { solid: post(26) });
    }
  };
  lamps([22, 19], [116, 19], 16);
  lamps([129, -4], [129, 28], 14);
  lamps([136, 37], [206, 37], 14, (u) => Math.abs(u - 164) < 6);
  lamps([76, 83], [104, 83], 14);
  lamps([170, 44], [170, 104], 16, (_u, v) => v > 86 && v < 96);
  lamps([150, 113], [206, 113], 14, (u) => Math.abs(u - 184) < 8);
  lamps([13, 58], [13, 112], 18);
  lamps([20, 159], [76, 159], 14);
  lamps([20, 119], [60, 119], 14, (u) => Math.abs(u - 31) < 6 || Math.abs(u - 46) < 4);
  lamps([16, 129], [78, 129], 14, (u) => Math.abs(u - 22) < 4 || Math.abs(u - 46) < 4);
  lamps([14, 35], [48, 35], 14);
  lamps([107, 46], [145, 46], 12);

  // ---- the public garden by the east wall: a gazebo where its paths cross, trees in rows,
  // benches along the paths ----
  put("common:gazebo", at(198, 133), 0);
  for (const v of [118, 124, 141, 147]) for (const u of [191, 205]) put(v % 2 ? "flora:Pine" : "flora:RoundTree", at(u, v), rnd() * 360, { s: 0.75 + rnd() * 0.15 });
  for (const [u, v, h] of [[194, 120, FACE.e], [194, 146, FACE.e], [202, 124, FACE.w], [202, 142, FACE.w], [190, 136.6, FACE.n], [208, 129.4, FACE.s]] as const) put("common:bench", at(u, v), h);
  for (const [u, v] of [[195, 127], [201, 139], [190, 129.6], [210, 136.4]] as UV[]) put("venezia:street_lamp", at(u, v), 0, { solid: post(26) });
  // the garden court behind the Merceria: a well, benches, trees
  put("venezia:well_head", at(86, 56), 0, { solid: [{ kind: "well", x: 0, y: 0, r: 130 }] });
  for (const [u, v, h] of [[80, 56, FACE.e], [92, 56, FACE.w]] as const) put("common:bench", at(u, v), h);
  // channel markers out in the lagoon and the bacino: clusters of piles, two rows down the lagoon;
  // gondolas out on it
  for (let v = 12; v < 150; v += 18) put("venezia:mooring_poles", at(2 + ((v / 18) % 2) * 3, v), rnd() * 360, { solid: "none" });
  for (let v = 20; v < 200; v += 24) put("venezia:mooring_poles", at(-14 + ((v / 24) % 2) * 4, v), rnd() * 360, { solid: "none" });
  for (const [u, v, h] of [[-4, 64, 10], [-8, 128, 170], [0, 182, 30]] as const) put("venezia:gondola", at(u, v), h, { z: WATER_Z });
  for (let u = 18; u < 96; u += 18) put("venezia:mooring_poles", at(u, 170 + ((u / 18) % 2) * 3), rnd() * 360, { solid: "none" });

  // ---- gardens: whatever grass is left between the houses ----
  town.greens(ground, { x0: P(0, 160)[0], x1: P(0, 0)[0], y0: P(EAST, 0)[1], y1: P(WEST, 0)[1] }, {
    trees: ["RoundTree", "Pine", "SmallTree", "Cherry", "RoundTree"], other: "common:bench", chance: 0.8, step: 520, margin: 300,
  });

  // ---- outside the walls: woods on the land to the north and east ----
  // (and on the strip at the lagoon's head past the north-west corner, clear of the road)
  const toNorthRoad = (u: number, v: number) => Math.min(...NORTH_ROAD.slice(1).map((b, i) => {
    const a = NORTH_ROAD[i], du = b[0] - a[0], dv = b[1] - a[1], t = Math.max(0, Math.min(1, ((u - a[0]) * du + (v - a[1]) * dv) / (du * du + dv * dv)));
    return Math.hypot(a[0] + du * t - u, a[1] + dv * t - v);
  }));
  town.woods({ x0: P(0, 150)[0], x1: P(0, -150)[0], y0: P(300, 0)[1], y1: P(-60, 0)[1] }, ["RoundTree", "BigOak", "Pine", "SmallTree", "RoundTree"], (x, y) => {
    const u = 112 - y / 100, v = 100 - x / 100;
    const inside = v > -12 && u < EAST + 12;
    const road = toNorthRoad(u, v) < 8 || (Math.abs(v - GATE_NE[1]) < 12 && u > EAST) || (Math.abs(u - GATE_N[0]) < 8 && v < 0);
    return inside || road || isWater(u, v) || isWater(u + 8, v) || isWater(u, v + 8) || isWater(u - 8, v + 8);
  }, { count: 220, spacing: 520 });

  // ---- build ----
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(80000, 80000).rotateX(-Math.PI / 2), material("Venezia_Water"));
  sea.position.set(0, WATER_Z, 0);
  sea.receiveShadow = true;
  const pt = (u: number, v: number) => ({ x: P(u, v)[0], y: P(u, v)[1] });
  const shopRow = town.puts.find((pl) => pl.ref === "venezia:shop_house" && Math.abs(100 - pl.x / 100 - 72) < 3 && 112 - pl.y / 100 < 100);
  return town.finish({
    ground,
    scenery: [sea],
    sky: "#3f7d86",
    flowers: {
      box: { x: P(0, 170)[0], y: P(230, 0)[1], w: 26000, h: 22000 },
      open: (x, y) => ground.kind(x, y) === 0,
      density: 0.3 * quality.flowers,
    },
    // (out over the lagoon on the west, to the strip at its head and the road on it on the north)
    bounds: { minX: P(0, PIER_END + 2)[0], maxX: P(0, NORTH - 12)[0], minY: P(EAST + 8, 0)[1], maxY: P(WEST - 28, 0)[1] },
    spawn: pt(...SPAWN),
    npcs: veneziaNpcs(shopRow ? { x: shopRow.x - 600, y: shopRow.y } : pt(92, 86)),
    // (the north road's way out at the corner: whoever comes back from the plains arrives a few
    // metres along the road)
    ...waysOut([
      { warp: { ...pt(...WAY_NW), r: 170, to: "noa_plains" }, back: pt(WAY_NW[0] + 9, WAY_NW[1]) },
      gateWay(at(...GATE_NE), "e", "dry_plains", 480, 420),
      // (v0.4) straight on north from the north gate to the lavender hills
      gateWay(at(...GATE_N), "n", "lavender_hills", 1030, 450),
    ]),
    closed: [],
    labels: [
      { ...pt(126, 100), text: "จัตุรัสมหาวิหาร" },
      { ...pt(126, 54), text: "มหาวิหารห้าโดม", kind: "small" },
      { ...pt(138, 130), text: "หอระฆัง", kind: "small" },
      { ...pt(156, 140), text: "ทำเนียบดอจ" },
      { ...pt(126, 156), text: "ท่าเรือกอนโดลา", kind: "small" },
      { ...pt(183, 157), text: "ท่าเรือใหญ่" },
      { ...pt(62, 88), text: "สะพานริอัลโต" },
      { ...pt(44, 72), text: "ตลาดริอัลโต" },
      { ...pt(88, 80), text: "ถนนเมอร์เซเรีย", kind: "small" },
      { ...pt(30, 33), text: "คลองใหญ่" },
      { ...pt(89, 31), text: "ลานบ่อน้ำ", kind: "small" },
      { ...pt(168, 78), text: "อู่เรือกอนโดลา" },
      { ...pt(190, 54), text: "ลานกองคาราวาน", kind: "small" },
      { ...pt(198, 133), text: "สวนสาธารณะ", kind: "small" },
      { ...pt(34, 131), text: "ย่านริมลากูน" },
      { ...pt(66, 156), text: "โบสถ์ปากคลอง", kind: "small" },
      { ...pt(125, 210), text: "เกาะโบสถ์", kind: "small" },
      { x: at(...GATE_N)[0] - 300, y: at(...GATE_N)[1], text: "ประตูเหนือ · ที่ราบใต้โนอา · ทุ่งลาเวนเดอร์", kind: "gate" },
      { ...pt(GATE_N[0] + 4, -10), text: "ทางไปทุ่งลาเวนเดอร์", kind: "gate" },
      { x: at(...GATE_NE)[0], y: at(...GATE_NE)[1] + 300, text: "ประตูตะวันออกเฉียงเหนือ · ที่ราบแห้งแล้ง", kind: "gate" },
      { x: at(...WAY_NW)[0] - 300, y: at(...WAY_NW)[1] - 600, text: "ทางไปที่ราบใต้โนอา", kind: "gate" },
      { ...pt(-6, 60), text: "ลากูน", kind: "small" },
    ],
  });
}

// ---- the people of Venezia ----
function veneziaNpcs(shop: { x: number; y: number }): NpcSpec[] {
  const spot = (u: number, v: number) => {
    const [x, y] = P(u, v);
    return { x, y };
  };
  // the way someone at (u, v) looks towards plan point (tu, tv), in world degrees
  const toward = (u: number, v: number, tu: number, tv: number) => {
    const [x0, y0] = P(u, v), [x1, y1] = P(tu, tv);
    return (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
  };
  const man = (top: string, hairColor = "ink", eyes = "amber", bottom = "bottom_warrior_cocoa") => ({ gender: "male", hair: "", hairColor, eyes, top, bottom });
  const woman = (hair: string, hairColor: string, eyes: string, top: string, bottom: string) => ({ gender: "female", hair, hairColor, eyes, top, bottom });
  const NORTH_FACE = 0, EAST_FACE = -90, SOUTH_FACE = 180;
  return [
    // by the spawn on the molo
    travelGuide("venezia", P(122, 146), toward(122, 146, 126, 140), "ลูเชีย"),
    { id: "venezia_guide", ...spot(130, 146), face: toward(130, 146, 126, 140), name: "ฟาบิโอ", title: "ผู้นำทาง", role: "talk", look: man("top_warrior_navy", "auburn", "blue"),
      lines: ["ยินดีต้อนรับสู่เวนิชเซีย เมืองแห่งสายน้ำ! ที่นี่คือโมโล ลานริมน้ำหน้าจัตุรัสมหาวิหาร", "มหาวิหารห้าโดมอยู่สุดจัตุรัสทางเหนือ ทำเนียบดอจอยู่ริมน้ำทางตะวันออก ท่าเรือใหญ่อยู่ถัดไปตามริมท่า",
        "เดินถนนเมอร์เซเรียจากมุมจัตุรัสไปทางตะวันตก จะถึงสะพานริอัลโตกับตลาดริมคลองใหญ่", "ประตูเหนือออกไปเลี้ยวซ้ายเลียบกำแพงไปที่ราบใต้โนอา ประตูตะวันออกเฉียงเหนือคือทางคาราวานข้ามที่ราบแห้งแล้ง แยกลงใต้ไปที่ราบโบราณ ตรงไปถึงบาฮามัส"] },
    // the harbour
    { id: "venezia_captain", ...spot(160.4, 170), face: toward(160.4, 170, 169, 176), name: "กัปตันอันเดรีย", title: "เรือโดยสาร · อีเดน โยเดีย ซูโจว", role: "travel", ports: ["eden", "yodia", "suzhou"],
      look: man("top_warrior_navy", "silver", "blue", "bottom_warrior_black"),
      lines: ["ขึ้นเรือไหม เรือกำปั่นของข้าแล่นไปอีเดน โยเดีย และเลียบฝั่งตะวันตกขึ้นไปถึงซูโจว", "เวนิชเซียส่งเรือสินค้าไปทุกเมืองท่า เกลือ แก้ว และผ้าไหมจากที่นี่ขายได้ทุกแห่ง", "ลมทะเลตะวันตกดีนัก ออกเรือได้ทุกน้ำขึ้น"] },
    { id: "venezia_harbourmaster", ...spot(203, 167), face: toward(203, 167, 197, 175), name: "ลอเรนโซ", title: "นายท่าเรือ", role: "talk", look: man("top_warrior", "ink", "teal"),
      lines: ["เรือทุกลำที่เข้าลากูนต้องผ่านสายตาข้า", "เกาะโบสถ์ตรงข้ามท่าเป็นที่หมายของชาวเรือ เห็นหอระฆังเมื่อไรก็รู้ว่าถึงบ้าน"] },
    { id: "venezia_spice", ...spot(155, 156.4), face: SOUTH_FACE, name: "เลโอนาร์โด", title: "พ่อค้าเครื่องเทศ", role: "talk", look: man("top_warrior_forest", "amber", "amber"),
      lines: ["หญ้าฝรั่นกับพริกไทยขึ้นเรือมาจากซูโจว ส่วนผ้าไหมมาตามทางคาราวานจากบาฮามัส", "พ่อค้าเวนิชเซียซื้อจากทุกทิศ แล้วขายไปทุกทิศ นั่นแหละความลับของเมืองนี้"] },
    // the piazza
    { id: "venezia_healer", ...spot(120, 88), face: toward(120, 88, 126, 96), name: "ซิสเตอร์คิอารา", title: "นักบวช · รักษาฟรี", role: "heal",
      look: woman("twintail", "gold", "blue", "top_priestess_white", "bottom_priestess_white"),
      lines: ["ขอพรแห่งสายน้ำและแสงจงคุ้มครองท่าน", "หายเหนื่อยแล้วนะ ลมทะเลช่วยให้ทุกคนสดชื่นเสมอ"] },
    { id: "venezia_maskmaker", ...spot(114.6, 106), face: EAST_FACE, name: "ฟรานเชสก้า", title: "ช่างทำหน้ากาก", role: "talk",
      look: woman("hime", "violet", "violet", "top_lilac", "bottom_wine"),
      lines: ["หน้ากากทุกชิ้นปั้นจากกระดาษอัดแล้วปิดทองด้วยมือ", "หน้ากากจมูกยาวนั่นคือหมอโรคระบาด ส่วนหน้ากากครึ่งหน้าประดับขนนกคือโคลอมบิน่า", "งานรื่นเริงประจำปี ทั้งเมืองสวมหน้ากากเต้นรำกันที่จัตุรัสนี้ทั้งคืน"] },
    { id: "venezia_painter", ...spot(132, 140), face: toward(132, 140, 138, 124), name: "ติเซียโน", title: "จิตรกร", role: "talk", look: man("top_warrior_forest", "auburn", "teal"),
      lines: ["แสงยามเย็นบนโดมของมหาวิหาร ไม่มีที่ไหนสวยเท่านี้", "หอระฆังสูงที่สุดในแดนตะวันตก ขึ้นไปบนนั้นมองเห็นลากูนทั้งผืน"] },
    { id: "venezia_girl", ...spot(124, 118), face: toward(124, 118, 126, 108), name: "จูลิเอตต้า", title: "เด็กหญิงให้อาหารนก", role: "talk",
      look: woman("twintail", "amber", "blue", "top_sky", "bottom_navy"),
      lines: ["นกพิราบที่จัตุรัสเชื่องมาก มากินข้าวโพดถึงมือเลย!", "พ่อหนูพายกอนโดลา พาคนข้ามคลองใหญ่ทุกวัน"] },
    { id: "venezia_doge_guard", ...spot(142.8, 136), face: 90, name: "ทหารยามจาโคโม", title: "องครักษ์ทำเนียบดอจ", role: "talk", look: man("top_warrior_navy", "ink", "amber", "bottom_warrior_black"),
      lines: ["ทำเนียบนี้คือที่ทำการของท่านดอจ ผู้ปกครองเวนิชเซีย", "ท่านดอจได้รับเลือกจากสภาพ่อค้า ไม่ใช่สืบทอดทางสายเลือด"] },
    // the Merceria: the shop
    { id: "venezia_shop", ...shop, face: 0, name: "มาริน่า", title: "ร้านเครื่องมือ", role: "shop", sprite: "merchant",
      lines: ["ยา เชือก คัมภีร์ ของดีจากเรือทุกลำมาอยู่ที่ร้านนี้", "เดินผ่านเมอร์เซเรียแล้วอย่าลืมแวะนะ"] },
    // the Rialto
    { id: "venezia_gondolier_rialto", ...spot(52.2, 92.4), face: toward(52.2, 92.4, 56, 95), name: "ปิเอโตร", title: "คนพายกอนโดลา", role: "talk", look: man("top_warrior_navy", "ink", "amber", "bottom_warrior_black"),
      lines: ["โอ้ โซเล มีโอ~ ขึ้นกอนโดลาชมคลองใหญ่ไหม", "กอนโดลาพายด้วยไม้พายเดียวจากท้ายเรือ เรือจึงเบี้ยวไปข้างหนึ่งนิดๆ ให้แล่นตรง", "ลอดใต้สะพานริอัลโตต้องก้มหัวนะ!"] },
    { id: "venezia_fruit", ...spot(44, 76), face: toward(44, 76, 39.5, 74), name: "ซิญอร่าโรซ่า", title: "แม่ค้าตลาดริอัลโต", role: "talk",
      look: woman("hime", "auburn", "amber", "top_rose", "bottom_cocoa"),
      lines: ["ส้ม มะนาว มะเขือม่วง อาร์ติโชก ส่งตรงจากสวนบนเกาะในลากูน", "ตลาดริอัลโตคึกคักตั้งแต่ฟ้าสาง เรือผักกับเรือปลาเข้ามาส่งของกันเต็มคลอง"] },
    // the gondoliers on the molo and in the basin
    { id: "venezia_gondolier_molo", ...spot(129, 158), face: toward(129, 158, 126, 163), name: "เบปเป้", title: "คนพายกอนโดลา", role: "talk", look: man("top_warrior", "auburn", "blue", "bottom_warrior_black"),
      lines: ["กอนโดลาจอดรอตรงนี้ทั้งวัน อยากไปไหนในเมืองบอกได้เลย", "เสาลายเกลียวพวกนั้นคือเสาผูกเรือ แต่ละบ้านทาสีของตระกูลตัวเอง"] },
    { id: "venezia_gondolier_basin", ...spot(169.4, 80), face: toward(169.4, 80, 175, 84), name: "มัตเตโอ", title: "ช่างต่อกอนโดลา", role: "talk", look: man("top_warrior_forest", "ink", "teal"),
      lines: ["กอนโดลาหนึ่งลำใช้ไม้ถึงแปดชนิด ต้องต่อด้วยมือทั้งลำ", "อู่นี้ซ่อมเรือให้ทั้งเมือง ตอนกลางคืนก็ยังได้ยินเสียงค้อน"] },
    // the smith at his forge by the basin
    { id: "venezia_smith", ...spot(169.4, 92), face: toward(169.4, 92, 166.2, 92), name: "จูเซปเป้", title: "ช่างตีเหล็ก · ตีบวก สร้างไอเทม", role: "smith", look: man("top_warrior", "ink", "amber"),
      lines: ["ข้าตีสมอและตะปูให้อู่ต่อเรือมาทั้งชีวิต ตีอาวุธก็ไม่แพ้ใคร", "เอาหินนภามาตีบวกอาวุธ หินดารามาตีบวกชุด มีแร่พอเมื่อไรข้าสร้างอุปกรณ์ให้ได้"] },
    // the north quarter
    { id: "venezia_glassblower", ...spot(92, 28), face: toward(92, 28, 89, 28), name: "อันโตนิโอ", title: "ช่างเป่าแก้ว", role: "talk", look: man("top_warrior_forest", "silver", "blue"),
      lines: ["แก้วของเวนิชเซียใสที่สุดในแผ่นดิน เป่าด้วยลมหายใจล้วนๆ", "ช่างแก้วห้ามออกจากเมืองโดยไม่ได้รับอนุญาต ความลับต้องอยู่ในลากูน"] },
    // the caravan master by the north-east gate
    { id: "venezia_caravan", ...spot(196, 40), face: toward(196, 40, 212, 34), name: "ซัลวาโตเร", title: "หัวหน้ากองคาราวาน", role: "talk", look: man("top_warrior", "amber", "amber"),
      lines: ["กองคาราวานของข้าออกประตูตะวันออกเฉียงเหนือ ข้ามที่ราบแห้งแล้งไปบาฮามัส", "ขาไปขนแก้วกับผ้าจากเวนิชเซีย ขากลับขนเครื่องเทศกับอินทผลัมจากทะเลทราย", "ที่ราบแห้งแล้งร้อนจัด พกน้ำให้พอ อย่าเดินหลงออกนอกเส้นทางคาราวาน"] },
    // the gate guards
    { id: "venezia_guard_n1", ...spot(123.4, 8), face: NORTH_FACE, name: "ทหารยามลูก้า", title: "ทหารยามประตูเหนือ", role: "talk", look: man("top_warrior_navy"),
      lines: ["ออกประตูเหนือแล้วเลี้ยวซ้าย เดินเลียบกำแพงไปจนสุดริมลากูน ถนนจะพาขึ้นไปที่ราบใต้โนอา ไร่องุ่นกับทุ่งข้าวสาลีสุดสายตา", "เดินตามถนนหินโบราณขึ้นไปจะถึงโนอา เมืองหลวงเก่าของอาณาจักร"] },
    { id: "venezia_guard_n2", ...spot(128.6, 8), face: NORTH_FACE, name: "ทหารยามนิโคโล", title: "ทหารยามประตูเหนือ", role: "talk", look: man("top_warrior_navy", "auburn"),
      lines: ["ถนนเส้นนี้ตรงจากประตูไปถึงหลังมหาวิหารเลย", "ถนนนอกกำแพงเลียบหัวลากูนไป ลมทะเลพัดแรง ระวังตกน้ำนะ", "ทางตะวันตกของที่ราบมีบึงลากูน ระวังหมอกพิษนะ"] },
    { id: "venezia_guard_ne1", ...spot(204, 31.5), face: EAST_FACE, name: "ทหารยามเอนริโก", title: "ทหารยามประตูตะวันออกเฉียงเหนือ", role: "talk", look: man("top_warrior"),
      lines: ["ประตูนี้คือต้นทางคาราวาน ออกไปคือที่ราบแห้งแล้ง ทอดยาวไปถึงบาฮามัส", "จะไปที่ราบโบราณก็ออกประตูนี้ ถึงศาลาพักคาราวานกลางที่ราบแล้วแยกลงใต้", "พุ่มไม้แห้งกับเนินหินยอดตัด เดินตามรอยล้อเกวียนไว้"] },
    { id: "venezia_guard_ne2", ...spot(204, 36.5), face: EAST_FACE, name: "ทหารยามสเตฟาโน", title: "ทหารยามประตูตะวันออกเฉียงเหนือ", role: "talk", look: man("top_warrior", "ink", "teal"),
      lines: ["คาราวานออกทุกเช้าตรู่ก่อนแดดจะแรง", "กลับเข้าเมืองมาเมื่อไร ไปพักที่จัตุรัสก่อน นักบวชรักษาให้ฟรี"] },
    // the watch on the east wall, where the street from the piazza ends at a tower
    { id: "venezia_guard_se1", ...spot(204, 107.5), face: EAST_FACE, name: "ทหารยามมาร์ติโน", title: "ทหารยามกำแพงตะวันออก", role: "talk", look: man("top_warrior_forest"),
      lines: ["ประตูตรงนี้ก่อปิดไปแล้ว จะไปที่ราบโบราณต้องออกประตูตะวันออกเฉียงเหนือ ข้ามที่ราบแห้งแล้งแล้วแยกลงใต้", "ที่ราบโบราณมีซากเมืองยุคก่อนกับรูปปั้นยักษ์ที่ล้มอยู่ เลยไปคือสุสานหลวง อย่าไปถ้ายังไม่แกร่งพอ"] },
    { id: "venezia_guard_se2", ...spot(204, 112.5), face: EAST_FACE, name: "ทหารยามเปาโล", title: "ทหารยามกำแพงตะวันออก", role: "talk", look: man("top_warrior_forest", "amber"),
      lines: ["ที่ราบโบราณเงียบนัก แต่ของที่ซ่อนอยู่ในซากนั้นไม่เคยหลับ", "ถนนเส้นนี้ข้ามสะพานคลองตรงไปถึงจัตุรัส"] },
    // the west island
    { id: "venezia_fisher", ...spot(40, 157), face: SOUTH_FACE, name: "นอนโน่ จิโอวานนี", title: "ชาวประมงลากูน", role: "talk", look: man("top_warrior", "silver", "teal"),
      lines: ["ลากูนตื้นนิดเดียว แต่ร่องน้ำลึกที่เสาไม้ปักบอกไว้ เรือใหญ่ต้องแล่นตามนั้น", "ปลาไหลกับปูจากบึงลากูนทางเหนืออร่อยที่สุด"] },
  ];
}

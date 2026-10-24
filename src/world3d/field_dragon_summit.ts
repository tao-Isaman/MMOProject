// ยอดเขามังกรฟ้า (the sky dragon's summit), monsters Lv 124-134, its guardian Lv 136: the last
// height of the king's mountains, standing out over the northern sea at the north-east end of the
// land. The ridge road from the royal peaks comes in over the west edge along the spine of the
// ridge, the north valley's last pocket under it on one side and the cloud basin on the other,
// and the ridge broadens into the summit's shoulder, a high snowfield whose north and east sides
// fall sheer into the sea. Clouds lie on the water under the cliffs and drift through the basin,
// so the summit seems to stand in a sea of cloud.
//
// From the shoulder a ramp climbs the summit's first step. On it the young sky dragons have their
// nest, a ring of boulders and charred trunks heaped with the hoard of all who came for it, and
// pillars of stone split and blackened by lightning stand about it. At the east end, over the
// sea cliffs, rises the crown of the mountain, and there in a ring of standing stones carved with
// runes of light, entered by a trilithon facing the way up, is the round dais where the legend
// says the sky dragon set the crown on the first king's head. The great sky dragon keeps it now.
// Down a ramp off the shoulder to the north lie the bones of a dragon long dead in the snow of
// the north valley's pocket; down another to the south, the cloud basin, pine woods going on
// south over the edge toward the frozen falls, and a beach of shingle where the falls' inlet
// comes in at the south-east.
//
// The coast range comes in along the north from the royal peaks and ends against the shoulder.
// There is no way on: the sea to the north and east, the inlet to the south-east.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   way out: west -> royal_peaks (middle of the edge, on the ridge)

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, seeded } from "./town";
import { KIT as SKY, DAIS_SOLIDS, TRILITHON_SOLIDS, NEST_DRAGON_SOLIDS } from "./kits/skypeaks";
import { KIT as WESTMOUNT, smooth, band, inPoly, toLine, dense, towards, rampOff, beyond, sheet } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import { KIT as SNOW, blobPoly } from "./kits/snowland";
import { KIT as NORTHCOLD } from "./kits/northcold";
import { KIT as TRUNRADA } from "./kits/trunrada";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(SKY, WESTMOUNT, SNOW, NORTHCOLD, TRUNRADA);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the sea: along the north under the coast range and the shoulder's cliffs, round the
// north-east corner, down the east side and in at the south-east as the falls' inlet ----
const SHORE: XY[] = smooth([
  [5320, A + 400], [5320, 6676], [5330, 5200], [5420, 3700], [5300, 2200], [5300, 900], [5250, -400], [5300, -1700], [5200, -3000], [5250, -4100], [4900, -5050],
  [4100, -5450], [2800, -5380], [1500, -5500], [200, -5400], [-900, -5050], [-2000, -4450], [-3000, -3900], [-3800, -3500], [-4700, -3700], [-5600, -3800], [-6676, -3900], [-A - 400, -3850],
], 4);
const SEA: XY[] = [...SHORE, [-A - 400, -A - 400], [A + 400, -A - 400], [A + 400, A + 400]];

// ---- the levels ----
// HIGH (450): the ridge in over the west edge (where the royal peaks' ridge meets it) broadening
// into the summit's shoulder, cliffs to the sea north and east; SUMMIT (850) its first step;
// CROWN (1250) the top at the east end; the coast range (1100) along the north-west, ending
// against the shoulder
const HIGH: XY[] = [
  [1550, A], [1550, 6676], [1500, 5500], [1650, 4400], [1600, 3300], [2100, 2500], [3000, 2100], [3900, 2250], [4700, 1900],
  [5000, 1000], [4950, -300], [5050, -1600], [4900, -2900], [4950, -3900], [4600, -4800], [3800, -5150], [2600, -5050], [1400, -5200], [200, -5050], [-900, -4700],
  [-1900, -4100], [-2800, -3500], [-3400, -2600], [-3700, -1400], [-3200, -300], [-2600, 600], [-1900, 1600], [-1650, 2800], [-1500, 4400], [-1550, 5500], [-1550, 6676], [-1550, A],
];
const SUMMIT: XY[] = [[4200, 900], [4300, -800], [4100, -2600], [3500, -3800], [2400, -4600], [1000, -4800], [-300, -4600], [-1100, -3900], [-1300, -2700], [-900, -1700], [-200, -800], [700, 200], [1800, 900], [3000, 1300]];
const CROWN_C: XY = [900, -3650];
const CROWN = blobPoly(CROWN_C, 1000, 820, 71, 0.06, 24);
const N_WALL: XY[] = [[4350, A], [4300, 5200], [4420, 3800], [4350, 2700], [4750, 2250], [5150, 2400], [5180, 3700], [5130, 5200], [5150, A]];
// ramps: up from the shoulder onto the step, the step onto the crown (from the west, the way up
// facing the ring's gate); down off the shoulder north into the valley's pocket, south into the
// cloud basin
const RS = rampOff([-200, -800], [700, 200], [2000, -2000], 1200, 460);
const RC = rampOff(CROWN[6], CROWN[7], CROWN_C, 1200, 440);
const RN = rampOff([2100, 2500], [3000, 2100], [2000, 0], 1250, 440);
const RB = rampOff([-3200, -300], [-2600, 600], [0, 0], 1250, 440);

// ---- the places ----
const W_EXIT: XY = [0, 5150];
const DAIS: XY = [CROWN_C[0], CROWN_C[1] - 60];
const NEST: XY = [3150, -1350];
const BONES: XY = [3250, 4350];
const SAGE: XY = [-650, 3300];

const climb = (r: { top: XY; bottom: XY }, inn = 400, out = 350): XY[] => [beyond(r.top, r.bottom, inn), r.bottom, r.top, beyond(r.bottom, r.top, out)];
const descend = (r: { top: XY; bottom: XY }, inn = 350, out = 400): XY[] => [beyond(r.bottom, r.top, inn), r.top, r.bottom, beyond(r.top, r.bottom, out)];

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(507, {
    hills: [
      { x: 3000, y: 4300, r: 900, h: -60 }, { x: -3700, y: 3500, r: 1100, h: 100 }, { x: -4400, y: -1000, r: 1000, h: 90 }, { x: -2600, y: 2600, r: 700, h: -50 },
      { x: 2400, y: -2400, r: 900, h: 60 }, { x: 3000, y: -300, r: 700, h: 50 }, { x: 0, y: 7700, r: 2400, h: 200 }, { x: -7600, y: 1000, r: 2800, h: 300 },
    ],
    plateaus: [
      { poly: dense(HIGH, 500), h: 450, ramps: [RN, RB] },
      { poly: dense(SUMMIT, 500), h: 850, ramps: [RS] },
      { poly: dense(CROWN, 450), h: 1250, ramps: [RC] },
      { poly: dense(N_WALL, 700), h: 1100 },
    ],
    rock: "Skypeaks_CliffPeak",
  });
  const { put, rnd } = f;

  // ---- the tracks: the ridge road up to the crown; out to the nest; down to the bones; down
  // into the cloud basin and along it to the beach ----
  const MAIN: XY[] = [
    ...smooth([[0, 9400], [0, 6676], W_EXIT, [0, 4400], [-120, 3300], [-350, 2200], [-700, 1500], climb(RS)[0]]), ...climb(RS).slice(1),
    ...smooth([climb(RS)[3], [900, -500], [1100, -1000], climb(RC)[0]]), ...climb(RC, 400, 300).slice(1), [DAIS[0], DAIS[1] + 380],
  ];
  const NEST_WAY: XY[] = smooth([[1000, -800], [1800, -700], [2500, -950], [NEST[0] - 400, NEST[1] + 650]]);
  const NORTH_WAY: XY[] = [...smooth([[-120, 3300], [700, 2900], [1400, 2300], descend(RN)[0]]), ...descend(RN).slice(1), ...smooth([descend(RN)[3], [BONES[0] - 500, BONES[1] - 800]])];
  const SOUTH_WAY: XY[] = [...smooth([[-700, 1500], [-1500, 900], [-2000, 300], descend(RB)[0]]), ...descend(RB).slice(1), ...smooth([descend(RB)[3], [-4500, 300], [-4300, -1100], [-4500, -2300], [-4300, -3100]])];
  const TRACKS = [MAIN, NEST_WAY, NORTH_WAY, SOUTH_WAY];
  const roads = TRACKS.map((t, i) => band(t, i === 0 ? 460 : 380));
  const DAIS_YARD = blobPoly(DAIS, 560, 560, 72, 0.05, 20);

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ROAD_TINT: [number, number, number] = [0.74, 0.76, 0.86];
  const ground = f.ground({ area, roads, plazas: [DAIS_YARD], water: [SEA], base: "snow", road: ROAD_TINT, plaza: [0.86, 0.86, 0.9] });
  const nearRoad = (x: number, y: number) => TRACKS.some((t) => toLine([x, y], t) < 420);

  // ---- the wind scours the heights to the rock in long streaks (a second ground of bare stone a
  // hair over the snow, cut away everywhere but those) ----
  const streaks: XY[][] = [];
  {
    const r2 = seeded(5071);
    for (let x = -3500; x < 5000; x += 340)
      for (let y = -5200; y < 6600; y += 520) {
        const cx = x + (r2() - 0.5) * 260, cy = y + (r2() - 0.5) * 400, hgt = f.h(cx, cy);
        if (hgt < 440 || r2() < (hgt > 840 ? 0.55 : 0.8) || !f.level(cx, cy, 220) || nearRoad(cx, cy) || inPoly(N_WALL, cx, cy)) continue;
        const k = 0.55 + r2() * 0.5, a = (r2() - 0.5) * 0.8;
        const b = blobPoly([0, 0], 110 * k, 330 * k, 5080 + streaks.length, 0.3, 14);
        streaks.push(b.map(([px, py]) => [cx + px * Math.cos(a) - py * Math.sin(a), cy + px * Math.sin(a) + py * Math.cos(a)] as XY));
      }
  }
  const BOX: XY[] = [[-3800, -A], [5400, -A], [5400, A], [-3800, A]];
  let OUT: XY[] = [...BOX, BOX[0]];
  for (const st of streaks) OUT = [...OUT, ...[...st].reverse(), [...st].reverse()[0], BOX[0]];
  const scoured = f.ground({ area: { x0: -3800, y0: -A, x1: 5400, y1: A }, roads, plazas: [DAIS_YARD], water: [OUT, SEA], base: "rock", road: ROAD_TINT, tint: "#d3d9e1" });
  scoured.mesh.position.y += 3;
  scoured.mesh.renderOrder = 1;

  // ---- the way out ----
  f.exit("royal_peaks", W_EXIT, [0, 4450]);

  // ---- the sea: cold water out to the edges, the shore closed, stacks and floes ----
  const sea = sheet(SEA, -14, "Skypeaks_SeaNorth"); // (over the sea only: the hollows inland stay dry)
  const near = SHORE.filter(([x, y]) => Math.abs(x) < A && Math.abs(y) < A);
  f.blockBand(near.map(([x, y]) => {
    const i = near.findIndex((p) => p[0] === x && p[1] === y), a = near[Math.max(0, i - 1)], b = near[Math.min(near.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let n: XY = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
    if (inPoly(SEA, x + n[0] * 150, y + n[1] * 150)) n = [-n[0], -n[1]];
    return [x - n[0] * 70, y - n[1] * 70] as XY;
  }), 240, { kind: "sea" });
  for (const [x, y, h, s] of [[6600, 1500, 30, 1.1], [7300, -3600, 160, 1.2], [6200, -6600, 240, 1], [2400, -6900, 80, 1.1], [-1600, -6700, 200, 0.9], [-4600, -5600, 60, 1], [7600, 4600, 120, 1]] as number[][])
    put("northcold:sea_stack", [x, y], h, { z: -14, s, solid: "none" });
  for (const [x, y, h, s] of [[5900, -1000, 20, 0.9], [6100, 3600, 130, 0.8], [5600, -4700, 240, 1], [3200, -6300, 60, 0.9], [-2800, -5100, 300, 0.8], [-5600, -4600, 100, 0.9]] as number[][])
    put("northcold:drift_floes", [x, y], h, { z: -14, s, solid: "none" });
  // the sea of clouds: banks lying on the water under the cliffs all round
  for (const [x, y, h, s] of [
    [5750, 3600, 10, 0.8], [5800, 300, 80, 0.9], [5750, -2600, 160, 0.85], [5300, -5300, 40, 0.9], [2900, -5950, 120, 0.85], [-200, -5900, 20, 0.8], [-2700, -4700, 90, 0.75],
  ] as number[][]) put("skypeaks:cloud_bank", [x, y], h, { z: -10, s, solid: "none" });
  for (const [x, y, h, s] of [[6300, -800, 30, 1.1], [6100, 2000, 100, 1], [4300, -6300, 60, 1.1], [1200, -6500, 150, 1], [-1600, -6000, 20, 0.9], [6000, -4200, 120, 1.1]] as number[][])
    put("skypeaks:cloud_wisp", [x, y], h, { z: -12, s, solid: "none" });

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const free = (x: number, y: number, r: number, gap = 0) =>
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    take(at[0], at[1], r);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });
  const inBox = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, o: (s: number) => Parameters<typeof put>[3] = () => ({}), where = inBox) => {
    for (let i = 0, made = 0; i < n * 12 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!where(x, y) || nearTrack(x, y, rad + 200) || !free(x, y, rad, 40)) continue;
      const s = 0.8 + rnd() * 0.4;
      put(ref, [x, y], rnd() * 360, { s, ...o(s) });
      take(x, y, rad * s);
      made++;
    }
  };
  for (const t of TRACKS) for (let i = 0; i < t.length; i += 2) take(t[i][0], t[i][1], 180);

  // ---- the way out: the sign, a cairn ----
  prop("snowland:trail_sign", [-380, 4800], 90, 80, ring(30, "post"));
  prop("snowland:cairn", [420, 4950], 0, 70, ring(45));
  // and round the arrival, close by the road
  for (const [ref, at, s] of [
    ["snowland:snow_drift", [480, 4300], 0.7], ["common:rock_small", [-430, 4600], 1], ["skypeaks:crag_cluster", [-560, 4150], 0.4], ["snowland:dry_grass", [420, 4000], 0.9],
    ["common:rock_small", [380, 3700], 1], ["snowland:snow_drift", [-470, 3800], 0.6],
  ] as [string, XY, number][]) if (free(at[0], at[1], 60)) prop(ref, at, rnd() * 360, 90, { s, solid: ref.includes("crag") ? ring(80 * s + 30).solid : "none" });

  // ---- the crown: the dais in its ring of standing stones, the trilithon facing the way up ----
  take(DAIS[0], DAIS[1], 950);
  // (the throne at the east side, facing the way up from the west; the gate across that way)
  put("skypeaks:coronation_dais", DAIS, -90, { s: 0.8, solid: DAIS_SOLIDS });
  const gateAt: XY = [DAIS[0], DAIS[1] + 720];
  put("skypeaks:ring_trilithon", gateAt, 90, { s: 0.75, solid: TRILITHON_SOLIDS });
  for (let k = 1; k < 10; k++) {
    const a = Math.PI / 2 + (k / 10) * Math.PI * 2, at: XY = [DAIS[0] + Math.cos(a) * 760, DAIS[1] + Math.sin(a) * 700];
    put("skypeaks:ring_stone", at, (a * 180) / Math.PI + 180, { s: 0.75, solid: [{ kind: "post", x: 0, y: 0, r: 70 }] });
  }
  for (const [dx, dy, h] of [[-420, -420, 30], [430, -380, 200], [380, 430, 110]] as number[][]) put("skypeaks:treasure_pile", [DAIS[0] + dx, DAIS[1] + dy], h, { s: 0.7, solid: "none" });
  for (const [dx, dy, s] of [[-750, -650, 0.55], [700, -700, 0.6], [-820, 560, 0.5]] as number[][]) if (free(DAIS[0] + dx, DAIS[1] + dy, 100)) prop("skypeaks:crag_cluster", [DAIS[0] + dx, DAIS[1] + dy], rnd() * 360, 140, { s, ...ring(100) });

  // ---- the step: the nest with its hoard, the lightning-struck pillars ----
  prop("skypeaks:dragon_nest", NEST, towards(-0.6, 1), 720, { s: 0.85, solid: NEST_DRAGON_SOLIDS });
  for (const [dx, dy, h] of [[-700, 900, 60], [700, 950, 160]] as number[][]) if (free(NEST[0] + dx, NEST[1] + dy, 120)) prop("skypeaks:treasure_pile", [NEST[0] + dx, NEST[1] + dy], h, 140, { s: 0.75, solid: "none" });
  const PILLARS: XY[] = [[2400, -2600], [3800, 400], [-400, -2400], [2100, 600], [3400, -3500], [-700, -3700]];
  for (const at of PILLARS) if (free(at[0], at[1], 200)) prop("skypeaks:struck_pillar", at, rnd() * 360, 280, { s: 0.75 + rnd() * 0.2, solid: [{ kind: "rock", x: 0, y: 0, r: 85 }] });
  // and out on the shoulder
  for (const at of [[2900, -4500], [-2200, -1800], [600, 1600]] as XY[]) if (free(at[0], at[1], 200)) prop("skypeaks:struck_pillar", at, rnd() * 360, 280, { s: 0.7, solid: [{ kind: "rock", x: 0, y: 0, r: 80 }] });

  // ---- the north valley's pocket: the dragon's bones in the snow ----
  prop("skypeaks:dragon_skeleton", BONES, 205, 700, { s: 0.75, solid: [{ kind: "bone", x: -420, y: 0, r: 90 }, { kind: "bone", x: -150, y: 20, w: 520, d: 300, rot: 0 }] });

  // ---- the ridge as it comes in: cornices on its edges, chains along the narrowest of it ----
  for (const side of [-1, 1]) for (let y = 4700; y > 3200; y -= 400) {
    const at: XY = [side * 1300, y];
    if (f.level(at[0], at[1], 60) && !nearTrack(at[0], at[1], 250)) put("skypeaks:cliff_rail", at, 0, { solid: [{ kind: "rail", x: 0, y: 0, w: 30, d: 400, rot: 0 }] });
  }
  for (const [at, h, s] of [[[-1000, 3900], 80, 0.75], [[1050, 2800], 260, 0.7], [[-1100, 1500], 100, 0.7], [[2600, 1000], 230, 0.75], [[4200, -1600], 260, 0.8], [[-2600, -2200], 90, 0.75]] as [XY, number, number][])
    if (free(at[0], at[1], 200)) prop("skypeaks:snow_cornice", at, h, 260, { s, solid: "none" });
  for (const [id, at, s, r] of [
    ["skypeaks:frost_tor", [900, 4300], 0.6, 170], ["skypeaks:crag_cluster", [-900, 4700], 0.55, 130], ["skypeaks:peak_boulder", [1000, 3500], 0.55, 130],
    ["skypeaks:crag_cluster", [-1000, 2700], 0.55, 130], ["skypeaks:peak_boulder", [700, 5200], 0.5, 120], ["skypeaks:frost_tor", [-1100, 3800], 0.5, 150],
  ] as [string, XY, number, number][]) if (free(at[0], at[1], r)) prop(id, at, rnd() * 360, r + 40, { s, ...ring(r) });
  prop("snowland:cairn", [500, 3900], 0, 70, ring(45));
  prop("snowland:cairn", [-500, 2400], 0, 70, ring(45));
  prop("snowland:cairn", [SAGE[0] - 250, SAGE[1] + 400], 0, 70, ring(45));
  prop("westmount:prayer_cairn", [SAGE[0] + 150, SAGE[1] - 380], 30, 150, { s: 0.6, ...ring(80) });
  prop("snowland:lean_to", [SAGE[0] - 120, SAGE[1] + 120], towards(0.2, -1), 220, { solid: [{ kind: "tent", x: 0, y: 0, w: 260, d: 260, rot: 0 }] });
  prop("trunrada:campfire", [SAGE[0] - 300, SAGE[1] - 250], 0, 110, ring(60));

  // ---- rocks: fallen at the cliffs' feet, crags and tors over the heights ----
  for (const poly of [HIGH, SUMMIT, CROWN]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (inPoly(poly, mx + nx * 50, my + ny * 50)) [nx, ny] = [-nx, -ny];
      for (let t = 300; t < L - 200; t += 700) {
        const out = 330 + rnd() * 160, x = a[0] + ((b[0] - a[0]) * t) / L + nx * out, y = a[1] + ((b[1] - a[1]) * t) / L + ny * out;
        if (rnd() < 0.45 || !inBox(x, y) || nearTrack(x, y, 260) || !free(x, y, 110, 60)) continue;
        const s = 0.5 + rnd() * 0.3;
        prop(rnd() < 0.5 ? "skypeaks:crag_cluster" : "skypeaks:peak_boulder", [x, y], rnd() * 360, 170 * s, { s, solid: [{ kind: "rock", x: 0, y: 0, r: 130 * s + 20 }] });
      }
    }
  }
  scatter("skypeaks:frost_tor", [1500, -1500], 3500, 7, 220, (s) => ({ s: s * 0.65, ...ring(150 * s) }), (x, y) => inBox(x, y) && f.h(x, y) > 400);
  scatter("skypeaks:peak_boulder", [1500, -1500], 3500, 8, 170, (s) => ({ s: s * 0.6, ...ring(110 * s) }), (x, y) => inBox(x, y) && f.h(x, y) > 400);
  scatter("skypeaks:crag_cluster", [1500, -1500], 3500, 7, 170, (s) => ({ s: s * 0.6, ...ring(110 * s) }), (x, y) => inBox(x, y) && f.h(x, y) > 400);
  scatter("snowland:flat_slabs", [1000, -500], 4000, 8, 150, (s) => ring(110 * s), (x, y) => inBox(x, y) && f.h(x, y) > 400);
  scatter("common:rock_small", [1000, -500], 4000, 18, 60, () => ({ solid: "none" }), (x, y) => inBox(x, y) && f.h(x, y) > 400);
  scatter("skypeaks:snow_cornice", [2000, -1500], 3000, 4, 260, () => ({ solid: "none" }), (x, y) => inBox(x, y) && f.h(x, y) > 400);
  scatter("snowland:snow_drift", [1500, -1500], 3500, 6, 230, () => ({}), (x, y) => inBox(x, y) && f.h(x, y) > 400);
  // the basin and the pocket: drifts, boulders, dry grass through the snow, fallen pines
  scatter("skypeaks:peak_boulder", [-3800, 1000], 2500, 6, 170, (s) => ({ s: s * 0.65, ...ring(115 * s) }), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  scatter("skypeaks:crag_cluster", [3000, 4000], 1500, 4, 170, (s) => ({ s: s * 0.6, ...ring(110 * s) }), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  scatter("snowland:snow_drift", [-3800, 1000], 2500, 6, 230, () => ({}), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  scatter("snowland:snow_drift", [3000, 4000], 1500, 3, 230, () => ({}), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  scatter("northcold:flattened_grass", [-3800, 1000], 2600, 12, 170, () => ({ solid: "none" }), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  scatter("snowland:dry_grass", [-3800, 1000], 2600, 10, 90, () => ({ solid: "none" }), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  scatter("snowland:frost_shrub", [-3800, 1000], 2600, 6, 90, () => ({ solid: [{ kind: "bush", x: 0, y: 0, r: 50 }] }), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  scatter("snowland:fallen_log", [-4200, 1500], 2000, 3, 220, () => ({ solid: [{ kind: "log", x: 0, y: 0, w: 90, d: 380, rot: 0 }] }), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  scatter("snowland:dead_branches", [-3500, 1000], 2800, 4, 120, () => ({ solid: "none" }), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  // the beach at the south-east where the inlet comes in: shingle, drift, rocks
  for (const [x, y, h] of [[-4300, -3500, 20], [-4900, -3250, 140], [-3700, -3100, 70], [-5200, -3500, 200]] as number[][])
    if (free(x, y, 120)) prop(rnd() < 0.5 ? "northcold:shingle_bank" : "northcold:iced_rocks", [x, y], h, 220, { solid: "none" });

  // ---- the pines: in the basin, thickening south toward the frozen falls; a few in the pocket;
  // wind-bent ones clinging to the heights ----
  const grove = (c: XY, r: number, n: number, kinds = ["SnowPine", "SnowPineSmall", "SnowPineSmall", "PineSmall"]) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inBox(x, y) || nearTrack(x, y, 330) || !free(x, y, 160, 160) || f.h(x, y) > 200) continue;
      put(`flora:${kinds[Math.floor(rnd() * kinds.length)]}`, [x, y], rnd() * 360, { s: 0.7 + rnd() * 0.35 });
      take(x, y, 160);
      made++;
    }
  };
  for (const [c, r, n] of [
    [[-4800, 4400], 700, 6], [[-4900, 2400], 700, 6], [[-4900, 400], 700, 6], [[-4800, -1500], 700, 6], [[-4900, -2900], 500, 3],
    [[-3200, 4700], 600, 5], [[-2600, 3300], 500, 3], [[-3500, 1900], 500, 3], [[-3300, -600], 500, 3], [[-3900, -2200], 500, 3],
    [[-2200, 5000], 500, 4], [[2400, 5000], 500, 4], [[3800, 3200], 400, 2], [[2100, 3600], 400, 2],
  ] as [XY, number, number][]) grove(c, r, n);
  for (const at of [[1100, 4200], [-1100, 2400], [1200, 1700], [3700, -2200], [-800, -1300], [1900, -3900], [4300, -3300], [-1600, -3300]] as XY[])
    if (free(at[0], at[1], 100)) prop("westmount:wind_pine", at, rnd() * 360, 200, { s: 0.6 + rnd() * 0.15, ...ring(36, "tree") });

  // ---- past the edges: pine woods to the south and west, bare rock on the coast range ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => [[0, 0], [300, 0], [-300, 0], [0, 300], [0, -300]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  f.woods(area, ["SnowPine", "SnowPine", "SnowPineSmall", "PineSmall"], (x, y) => inside(x, y) || onTrack(x, y) || f.h(x, y) > 350 || inPoly(SEA, x, y) || toLine([x, y], SHORE) < 400, { count: 200, spacing: 430, tries: 5000 });
  f.woods(area, ["crag_cluster", "peak_boulder", "frost_tor"], (x, y) => onTrack(x, y) || inside(x, y) || inPoly(SEA, x, y) || f.h(x, y) < 400, { count: 30, spacing: 900, tries: 2000, kit: "skypeaks" });
  // mist drifting through the basin and the pocket
  for (const [at, h, s] of [[[-3000, 2600], 30, 0.9], [[-4000, -400], 120, 1], [[-2800, -2900], 60, 0.9], [[-4300, 3900], 200, 0.8], [[3600, 3600], 10, 0.7], [[-1900, 300], 150, 0.7]] as [XY, number, number][])
    put("skypeaks:cloud_wisp", at, h, { s, solid: "none" });

  // ---- monsters: whelps over the shoulder, the step and the crown, in the basin and the
  // pocket; their guardian on the dais, the farthest spot from the way in (no spot is farther) ----
  const spawn: XY = [0, 4450], far = Math.hypot(DAIS[0] - spawn[0], DAIS[1] - spawn[1]) - 250;
  const quiet = (x: number, y: number) =>
    Math.hypot(x - spawn[0], y - spawn[1]) > far || Math.hypot(x - DAIS[0], y - DAIS[1]) < 1000 || Math.hypot(x - SAGE[0], y - SAGE[1]) < 600 || inPoly(N_WALL, x, y);
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 780, keepOut: quiet, max: 50 });
  f.spots.push({ x: DAIS[0], y: DAIS[1] });

  // ---- people ----
  const npcs: NpcSpec[] = [
    { id: "dragon_summit_sage", x: SAGE[0] + 250, y: SAGE[1] - 60, face: 270, name: "ฤๅษีเมฆา", title: "ผู้เฝ้าทางขึ้นยอดเขามังกร", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "teal", top: "top_priestess_white", bottom: "bottom_warrior_black" },
      lines: [
        "เบื้องล่างนั่นไม่ใช่หิมะหรอก เป็นทะเลเมฆ ยอดเขานี้สูงจนเมฆลอยอยู่ใต้เท้าเรา",
        "ตำนานว่ามังกรฟ้าลงมาสวมมงกุฎให้กษัตริย์องค์แรกบนแท่นหินบนยอดสุดทางตะวันออก ตั้งแต่นั้นมันก็เฝ้าแท่นนั้นไม่ยอมให้ใครเข้าใกล้",
        "ลูกมังกรเกิดจากไข่ในรังบนลานชั้นแรก ฟ้าผ่าลงตรงไหนก็มีพวกมันบินวนอยู่ ระวังตัวให้ดี",
      ] },
    { id: "dragon_summit_seeker", x: NEST[0] - 900, y: NEST[1] + 1300, face: 20, name: "เรนาร์ด", title: "นักล่าสมบัติผู้ยังไม่ยอมแพ้", role: "talk",
      look: { gender: "male", hair: "", hairColor: "amber", eyes: "amber", top: "top_adventurer_ochre", bottom: "bottom_adventurer_cocoa" },
      lines: [
        "ทองในรังนั่นกองสูงท่วมหัว แต่ทุกคนที่ไปหยิบกลายเป็นกระดูกอยู่ข้างกองสมบัติหมดแล้ว",
        "ข้าเห็นมงกุฎทองวางอยู่บนกองเหรียญด้วยนะ ถ้าได้มันมาข้าจะกลับไปเป็นท่านลอร์ดเลย",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [scoured.mesh, sea],
    sky: "#9fb7d0",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: spawn[0], y: spawn[1] },
    npcs,
    labels: [
      { x: W_EXIT[0] - 250, y: W_EXIT[1], text: "ทางไปสันเขาหลวง", kind: "gate" },
      { x: DAIS[0] - 650, y: DAIS[1], text: "แท่นพิธีราชาภิเษก" },
      { x: gateAt[0] - 450, y: gateAt[1] + 200, text: "วงหินตั้ง", kind: "small" },
      { x: NEST[0] - 900, y: NEST[1], text: "รังมังกร" },
      { x: BONES[0] - 800, y: BONES[1], text: "โครงกระดูกมังกร" },
      { x: PILLARS[0][0] - 400, y: PILLARS[0][1], text: "เสาหินถูกฟ้าผ่า", kind: "small" },
      { x: -3700, y: 1800, text: "แอ่งทะเลเมฆ" },
      { x: 1500, y: -1200, text: "ยอดเขามังกรฟ้า" },
      { x: -4000, y: -2800, text: "หาดกรวดริมอ่าว", kind: "small" },
      { x: SAGE[0] - 400, y: SAGE[1], text: "เพิงฤๅษี", kind: "small" },
    ],
  });
}

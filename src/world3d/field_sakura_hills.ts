// เนินซากุระและป่าไผ่ (sakura_hills): the hills of Osaki's island beyond its mountain gate, on
// the way up to the volcano. The track comes in from Osaki on the west, between stone lanterns
// and cherry trees, past a still pond and a meadow of silver grass, through a bamboo forest (a
// sacred rock bound with rope in a hollow at its heart) and on north to the volcano. To the
// south-east the hillside rises in terraces of cherry trees (a ramp up), and on the top terrace,
// up stone steps under an old torii, the shrine nobody tends any more. To the north-east a ridge
// looks out toward the volcano; a torii lies fallen up there.
//
// Laid out at full size in centimetres around the origin (north +X, west +Y); finishField
// scales it by TOWN_SCALE.

import { FieldBuilder } from "./field";
import { useKits } from "./town";
import type { Town } from "./town";
import type { Poly } from "./paved";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import { KIT as OSAKI } from "./kits/osaki";
import { KIT as VOLCANIC } from "./kits/volcanic";

useKits(OSAKI, VOLCANIC);

type XY = [number, number];

// ---- the lie of the land ----
const R = 5500; // the walkable bounds, +-R
const A = 9000; // the ground's area, +-A
// the terraces of cherry trees (south-east), the shrine's terrace on top of them
const T1: Poly = [[-600, -1400], [-1200, -800], [-2600, -700], [-3900, -900], [-4900, -1400], [-6400, -1700], [-9500, -1700], [-9500, -9500], [-1800, -9500], [-1400, -6400], [-1000, -4800], [-500, -3600], [-300, -2400]];
const T2: Poly = [[-2500, -2700], [-3500, -2500], [-4500, -2900], [-4900, -3800], [-4600, -4700], [-3600, -5000], [-2600, -4700], [-2200, -3700]];
// the mountain behind the shrine (scenery)
const SE: Poly = [[-3900, -6000], [-5900, -5300], [-9500, -4900], [-9500, -9500], [-2400, -9500], [-2700, -6700]];
// the ridge looking out to the volcano (north-east), and the mountain wall above it
const D: Poly = [[1500, -1500], [2600, -1200], [3700, -1500], [4700, -1700], [9500, -1700], [9500, -9500], [1600, -9500], [1200, -6000], [1000, -3800], [1100, -2400]];
const D2: Poly = [[4000, -2700], [9500, -2700], [9500, -9500], [2600, -9500], [2400, -6500], [3000, -4200]];
// the volcano's lower slopes along the north edge, a pass left open where the track goes on
const N1: Poly = [[5800, 1100], [6400, 2600], [5900, 5000], [6300, 9500], [9500, 9500], [9500, 1100]];
const N2: Poly = [[6100, -300], [9500, -300], [9500, -1700], [6400, -1700]];

// the ramps: a ramp's top on its plateau's edge, its foot out on the ground below
const RAMP_T1 = { top: [-1760, -760] as XY, bottom: [-1696, 138] as XY, width: 460 };
const RAMP_T2 = { top: [-3000, -2600] as XY, bottom: [-2823.5, -1717.5] as XY, width: 440, straight: true }; // the stone steps (a straight slope, as they are built)
const RAMP_D = { top: [2050, -1350] as XY, bottom: [1734, -192] as XY, width: 440 };

const POND: XY = [-3300, 2000];

// ---- tracks: smooth winding strips ----
function smooth(pts: XY[], n = 5): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function band(pts: XY[], w: number): Poly {
  const L: XY[] = [], Rr: XY[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    L.push([pts[i][0] + (nx * w) / 2, pts[i][1] + (ny * w) / 2]);
    Rr.push([pts[i][0] - (nx * w) / 2, pts[i][1] - (ny * w) / 2]);
  }
  return [...L, ...Rr.reverse()];
}
// points every `step` along a polyline, with the way it runs there
function every(pts: XY[], step: number, from = 0): { p: XY; d: XY }[] {
  const out: { p: XY; d: XY }[] = [];
  let carry = from;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    if (L < 1) continue;
    const d: XY = [(bx - ax) / L, (by - ay) / L];
    for (let s = carry; s < L; s += step) out.push({ p: [ax + d[0] * s, ay + d[1] * s], d });
    carry = (((carry - L) % step) + step) % step;
  }
  return out;
}
// the heading that turns a piece's front (-X) toward the world direction (dx, dy)
const faceDir = (dx: number, dy: number) => (Math.atan2(-dy, -dx) * 180) / Math.PI;
const faceTo = (from: XY, to: XY) => faceDir(to[0] - from[0], to[1] - from[1]);

// the main track: in from Osaki (west), through the bamboo, out north to the volcano
const MAIN = smooth([[-1300, 9000], [-1100, 6500], [-1000, 5150], [-900, 4300], [-1300, 3300], [-900, 2300], [-200, 1500], [500, 900], [1500, 700], [2600, 300], [3600, 500], [4500, 250], [5150, 300], [5900, 400], [7000, 300], [9000, 500]]);
// up the terraces to the shrine
const TERRACE = smooth([[500, 900], [-400, 700], [-1200, 650], [-1690, 560], [-1696, 138], [-1760, -760], [-1880, -1120], [-2350, -1360], [-2720, -1470], [-2823, -1717], [-3000, -2600], [-3160, -2950], [-3420, -3230]], 4);
// the spur into the bamboo to the sacred rock, and up onto the ridge
const GROVE = smooth([[-200, 1500], [300, 2100], [900, 2700], [1400, 3050]]);
const RIDGE = smooth([[1500, 700], [1700, 300], [1734, -192], [2050, -1350], [2400, -1900], [3000, -2200], [3700, -2050]], 4);

// the scattered pieces block only their heart (a trunk, a rock's bulk), not their whole box
const SOLIDS: Record<string, SolidSpec[]> = {
  "volcanic:dead_tree": [{ kind: "tree", x: 0, y: 0, r: 40 }],
  "volcanic:lava_boulder": [{ kind: "rock", x: 0, y: 0, r: 150 }],
  "volcanic:lava_rocks": [{ kind: "rock", x: 0, y: 0, r: 150 }],
  "volcanic:obsidian": [{ kind: "rock", x: 0, y: 0, r: 60 }],
  "volcanic:sulphur_vent": [{ kind: "vent", x: 0, y: 0, r: 130 }],
  "volcanic:basalt_columns": [{ kind: "rock", x: 0, y: 0, r: 190 }],
  "volcanic:boulder_moss": [{ kind: "rock", x: 0, y: 0, r: 120 }],
  "volcanic:stump": [{ kind: "tree", x: 0, y: 0, r: 50 }],
  "volcanic:lantern_toppled": [{ kind: "post", x: 80, y: 15, r: 55 }],
  "volcanic:waymarker": [{ kind: "post", x: 0, y: 0, r: 40 }],
};

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(117, {
    hills: [
      { x: 3300, y: 3300, r: 1900, h: 240 },   // the bamboo hill
      { x: -3600, y: 3600, r: 1500, h: 160 },  // the silver-grass meadow
      { x: 1550, y: 3150, r: 950, h: -120 },   // the hollow of the sacred rock
      { x: -3900, y: 600, r: 1100, h: 130 },
      { x: 4300, y: -800, r: 800, h: 90 },
      { x: 300, y: -2700, r: 1100, h: 140 },
      { x: -2400, y: 7600, r: 2200, h: 320 },  // the wooded hills past the edges
      { x: 2600, y: 7600, r: 2600, h: 380 },
      { x: -7400, y: 2600, r: 2600, h: 300 },
      { x: -7200, y: 6800, r: 2200, h: 260 },
    ],
    plateaus: [
      { poly: T1, h: 300, ramps: [RAMP_T1] },
      { poly: T2, h: 600, ramps: [RAMP_T2] },
      { poly: SE, h: 950 },
      { poly: D, h: 400, ramps: [RAMP_D] },
      { poly: D2, h: 760 },
      { poly: N1, h: 650 },
      { poly: N2, h: 650 },
    ],
    rock: "CliffRock",
  });
  const { put, rnd } = f;

  // ---- the ground: tracks of bare earth, the pond ----
  const pondPoly: Poly = Array.from({ length: 24 }, (_, k): XY => {
    const a = (k / 24) * Math.PI * 2, r = 560 + Math.sin(k * 1.7) * 40;
    return [POND[0] + Math.cos(a) * r * 1.15, POND[1] + Math.sin(a) * r];
  });
  const ground = f.ground({
    area: { x0: -A, y0: -A, x1: A, y1: A },
    roads: [band(MAIN, 470), band(TERRACE, 420), band(GROVE, 380), band(RIDGE, 400)],
    plazas: [],
    water: [pondPoly],
    road: [0.9, 0.82, 0.74],
  });
  f.blockDisc(POND, 600);
  for (const s of [-1, 1]) f.blockDisc([POND[0] + s * 330, POND[1]], 420);

  // ---- placing things clear of each other, the tracks and the cliffs ----
  const taken: [number, number, number][] = [];
  const onTrack = (x: number, y: number, m: number) => [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const free = (x: number, y: number, r: number) => !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r);
  const fits = (x: number, y: number, r: number, m = r) => f.level(x, y, r) && !onTrack(x, y, m) && free(x, y, r);
  const place = (ref: string, at: XY, h: number, r: number, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, SOLIDS[ref] && !o.solid ? { solid: SOLIDS[ref], ...o } : o);
    taken.push([at[0], at[1], r]);
  };
  const tryPlace = (ref: string, at: XY, h: number, r: number, o: Parameters<typeof put>[3] = {}) => {
    if (!fits(at[0], at[1], r)) return false;
    place(ref, at, h, r, o);
    return true;
  };
  // scatter `n` of `refs` over a box where `inside` says, `r` apart
  const scatter = (box: { x0: number; x1: number; y0: number; y1: number }, n: number, refs: string[], r: number, inside: (x: number, y: number) => boolean, o: { s?: [number, number]; solid?: "none"; tries?: number } = {}) => {
    let placed = 0;
    for (let t = 0; t < (o.tries ?? n * 30) && placed < n; t++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (!inside(x, y) || !fits(x, y, r)) continue;
      const s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      place(refs[Math.floor(rnd() * refs.length)], [x, y], rnd() * 360, r, { s, ...(o.solid ? { solid: o.solid } : {}) });
      placed++;
    }
  };
  const inPoly = (poly: Poly, x: number, y: number) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const inside = (x: number, y: number, m = 0) => Math.abs(x) < R - m && Math.abs(y) < R - m;
  const lanterns = (pts: XY[], step: number, off: number, from: number, until: (p: XY) => boolean = () => true) => {
    for (const { p, d } of every(pts, step, from)) {
      if (!until(p)) continue;
      for (const s of [-1, 1]) {
        const at: XY = [p[0] - d[1] * off * s, p[1] + d[0] * off * s];
        if (inside(at[0], at[1], 200)) tryPlace("osaki:stone_lantern", at, faceDir(d[1] * s, -d[0] * s), 80);
      }
    }
  };
  // a torii's two posts (it spans its own Y)
  const toriiSolid: SolidSpec[] = [{ kind: "post", x: 0, y: -245, r: 34 }, { kind: "post", x: 0, y: 245, r: 34 }];

  // ---- the ways out ----
  const WEST: XY = [-1000, 5150], WEST_BACK: XY = [-930, 4420];
  const NORTH: XY = [5150, 300], NORTH_BACK: XY = [4420, 270];
  f.exit("osaki", WEST, WEST_BACK);
  f.exit("volcano", NORTH, NORTH_BACK);
  // the west way: an old torii over the track where Osaki's road comes in, a signpost, lanterns
  place("volcanic:torii_old", [-960, 4780], faceDir(0, 1), 300, { solid: toriiSolid });
  place("volcanic:waymarker", [-1430, 4600], faceDir(0.3, -1), 70);
  lanterns(MAIN, 800, 330, 0, (p) => p[1] < 4500 && p[1] > 2300);
  // the north way: a signpost and the first lava rocks of the volcano
  place("volcanic:waymarker", [4700, 720], faceDir(-1, 0), 70);
  for (const [x, y, ref, h] of [[5100, 1050, "volcanic:lava_boulder", 30], [4900, -500, "volcanic:lava_rocks", 120], [5250, -900, "volcanic:dead_tree", 0], [4300, 1300, "volcanic:dead_tree", 200]] as const) tryPlace(ref, [x, y], h, 260);

  // signposts where the tracks part
  for (const [x, y, to] of [[780, 1270, [-400, 700]], [1980, 980, [1734, -192]], [-700, 1520, [300, 2100]]] as const) tryPlace("volcanic:waymarker", [x, y], faceTo([x, y], to as unknown as XY) + 90, 70);

  // ---- the terraces and the shrine ----
  // lanterns up the ramp's foot and along the terrace path to the steps
  for (const s of [-1, 1]) place("osaki:stone_lantern", [RAMP_T1.bottom[0] + s * 330, RAMP_T1.bottom[1] + 260], 0, 80);
  lanterns(TERRACE, 620, 300, 250, (p) => inPoly(T1, p[0], p[1]) && !inPoly(T2, p[0], p[1]) && p[1] < -900);
  // the stone steps up to the shrine terrace, the old torii at their foot
  const sdx = RAMP_T2.top[0] - RAMP_T2.bottom[0], sdy = RAMP_T2.top[1] - RAMP_T2.bottom[1], sl = Math.hypot(sdx, sdy);
  const up: XY = [sdx / sl, sdy / sl], stepsH = (Math.atan2(up[1], up[0]) * 180) / Math.PI;
  put("volcanic:stone_stairs", [(RAMP_T2.top[0] + RAMP_T2.bottom[0]) / 2, (RAMP_T2.top[1] + RAMP_T2.bottom[1]) / 2], stepsH);
  place("volcanic:torii_old", [RAMP_T2.bottom[0] - up[0] * 130, RAMP_T2.bottom[1] - up[1] * 130], stepsH, 300, { solid: toriiSolid });
  // the shrine on the top terrace, facing the steps; its guardians, lanterns, the fallen ones
  const SHRINE: XY = [-3850, -3800];
  const shrineH = faceTo(SHRINE, RAMP_T2.top);
  place("volcanic:shrine_ruin", SHRINE, shrineH, 560);
  const toward = (d: number, side: number): XY => {
    const a = ((shrineH + 180) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    return [SHRINE[0] + c * d - s * side, SHRINE[1] + s * d + c * side];
  };
  place("volcanic:komainu", toward(720, -280), shrineH - 22, 60);
  place("volcanic:komainu", toward(720, 280), shrineH + 22, 60);
  tryPlace("osaki:stone_lantern", toward(980, -320), 0, 80);
  tryPlace("volcanic:lantern_toppled", toward(980, 380), shrineH + 50, 150);
  tryPlace("osaki:stone_lantern", toward(1300, -320), 0, 80);
  tryPlace("osaki:stone_lantern", toward(1300, 320), 0, 80);
  place("volcanic:petal_carpet", toward(700, 0), rnd() * 360, 1, { solid: "none" });
  place("volcanic:petal_carpet", toward(-300, 700), rnd() * 360, 1, { solid: "none" });
  place("volcanic:jizo_group", toward(400, -720), shrineH + 90, 110);
  tryPlace("volcanic:boulder_moss", [-4500, -4300], 70, 170);
  tryPlace("volcanic:stump", [-3000, -4500], 20, 100);
  // cherry trees over both terraces, maples among them, petals beneath
  scatter({ x0: -5400, x1: -500, y0: -5400, y1: -800 }, 70, ["flora:Cherry", "flora:Cherry", "flora:Cherry", "flora:AutumnTree", "flora:Cherry"], 330, (x, y) => inPoly(T1, x, y) && inside(x, y, 300) && !onTrack(x, y, 380), { s: [0.85, 1.15] });
  scatter({ x0: -5400, x1: -500, y0: -5400, y1: -800 }, 26, ["volcanic:petal_carpet"], 170, (x, y) => inPoly(T1, x, y) && inside(x, y, 300), { solid: "none" });
  scatter({ x0: -5400, x1: -500, y0: -5400, y1: -800 }, 18, ["volcanic:susuki_grass", "volcanic:sasa_bush"], 120, (x, y) => inPoly(T1, x, y) && !inPoly(T2, x, y) && inside(x, y, 300), { solid: "none" });

  // ---- the ridge to the north-east ----
  place("volcanic:torii_fallen", [2900, -3000], 160, 420);
  place("volcanic:waymarker", [3500, -1800], faceDir(-1, 0.2), 70);
  place("volcanic:jizo_group", [2250, -2350], faceTo([2250, -2350], [2400, -1900]), 110);
  for (const [x, y, ref, h] of [[3900, -2300, "volcanic:boulder_moss", 30], [1700, -3400, "volcanic:boulder_moss", 200], [2300, -4300, "volcanic:fallen_log", 60], [3300, -3600, "volcanic:stump", 0], [1900, -2800, "volcanic:lantern_toppled", 120]] as const) tryPlace(ref, [x, y], h, 200);
  scatter({ x0: 1100, x1: 4700, y0: -5300, y1: -1300 }, 22, ["flora:Pine", "flora:PineSmall", "flora:Pine", "flora:AutumnTree"], 340, (x, y) => inPoly(D, x, y) && !inPoly(D2, x, y) && inside(x, y, 300) && !onTrack(x, y, 380), { s: [0.85, 1.15] });
  scatter({ x0: 1100, x1: 4700, y0: -5300, y1: -1300 }, 14, ["volcanic:susuki_grass"], 120, (x, y) => inPoly(D, x, y) && !inPoly(D2, x, y) && inside(x, y, 300), { solid: "none" });

  // ---- the bamboo forest and the sacred rock in its hollow ----
  const ROCK: XY = [1600, 3250];
  place("volcanic:sacred_rock", ROCK, faceTo(ROCK, [1150, 2900]), 330);
  place("osaki:stone_lantern", [1000, 3500], 0, 80);
  place("osaki:stone_lantern", [1500, 2550], 0, 80);
  place("volcanic:petal_carpet", [1150, 3000], 30, 1, { solid: "none" });
  const grove = (x: number, y: number) => x > -400 && y > 1200 && inside(x, y, 250) && Math.hypot(x - ROCK[0], y - ROCK[1]) > 700 && !onTrack(x, y, 330);
  scatter({ x0: -400, x1: R, y0: 1200, y1: R }, 190, ["flora:Bamboo", "flora:Bamboo", "flora:Bamboo", "flora:Bamboo", "flora:Bamboo", "flora:Pine"], 240, grove, { s: [0.9, 1.3], tries: 12000 });
  scatter({ x0: -400, x1: R, y0: 1200, y1: R }, 40, ["volcanic:sasa_bush"], 110, grove, { solid: "none", s: [0.8, 1.2] });
  for (const [x, y, ref, h] of [[2600, 2100, "volcanic:fallen_log", 20], [3500, 4300, "volcanic:fallen_log", 120], [600, 3800, "volcanic:stump", 0], [2300, 4600, "volcanic:stump", 0], [4100, 3100, "volcanic:lantern_toppled", 80], [700, 4600, "volcanic:boulder_moss", 0]] as const) tryPlace(ref, [x, y], h, 200);

  // ---- the meadow in the south-west: the pond in its rocks, silver grass, cherries ----
  for (let k = 0; k < 11; k++) {
    const a = (k / 11) * Math.PI * 2, at: XY = [POND[0] + Math.cos(a) * 690, POND[1] + Math.sin(a) * 600];
    put("osaki:shore_rocks", at, faceTo(at, POND), { s: 0.9 });
  }
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 + 0.2, r = 720 + rnd() * 120;
    tryPlace(k % 3 ? "volcanic:susuki_grass" : "volcanic:boulder_moss", [POND[0] + Math.cos(a) * r * 1.15, POND[1] + Math.sin(a) * r], rnd() * 360, 90, k % 3 ? { solid: "none" } : { s: 0.45 });
  }
  place("volcanic:jizo_group", [-1650, 3700], faceDir(1, -0.3), 110);
  place("volcanic:stump", [-2300, 4300], 0, 100);
  tryPlace("volcanic:torii_fallen", [-4300, 4300], 70, 420);
  scatter({ x0: -R, x1: 0, y0: -600, y1: R }, 34, ["flora:Cherry", "flora:Cherry", "flora:Pine", "flora:Cherry"], 360, (x, y) => inside(x, y, 300) && !inPoly(T1, x, y) && !onTrack(x, y, 420) && Math.hypot(x - POND[0], y - POND[1]) > 950, { s: [0.85, 1.2] });
  scatter({ x0: -R, x1: 0, y0: -600, y1: R }, 30, ["volcanic:susuki_grass", "volcanic:susuki_grass", "volcanic:sasa_bush"], 120, (x, y) => inside(x, y, 300) && !inPoly(T1, x, y) && Math.hypot(x - POND[0], y - POND[1]) > 800, { solid: "none" });
  scatter({ x0: -R, x1: 0, y0: -600, y1: R }, 12, ["volcanic:petal_carpet"], 170, (x, y) => inside(x, y, 300) && !inPoly(T1, x, y) && Math.hypot(x - POND[0], y - POND[1]) > 800, { solid: "none" });

  // ---- the open middle and the north: pines, boulders, grass ----
  scatter({ x0: -400, x1: R, y0: -1500, y1: 1300 }, 26, ["flora:Pine", "flora:PineSmall", "flora:Cherry", "flora:Bamboo"], 380, (x, y) => inside(x, y, 300) && !inPoly(D, x, y) && !onTrack(x, y, 420), { s: [0.85, 1.15] });
  scatter({ x0: -400, x1: R, y0: -5300, y1: 1300 }, 12, ["volcanic:boulder_moss", "volcanic:boulder_moss", "volcanic:stump"], 200, (x, y) => inside(x, y, 300) && !inPoly(D, x, y) && !inPoly(T1, x, y), { s: [0.7, 1.1] });
  scatter({ x0: -400, x1: R, y0: -5300, y1: 1300 }, 22, ["volcanic:susuki_grass", "volcanic:sasa_bush"], 120, (x, y) => inside(x, y, 300) && !inPoly(D, x, y) && !inPoly(T1, x, y), { solid: "none" });
  // the valley between the terraces and the ridge
  scatter({ x0: -1000, x1: 1400, y0: -5300, y1: -1500 }, 16, ["flora:Bamboo", "flora:Cherry", "flora:Pine"], 380, (x, y) => inside(x, y, 300) && !inPoly(D, x, y) && !inPoly(T1, x, y), { s: [0.9, 1.15] });

  // the mountain above the ridge (no way up): woods on it
  scatter({ x0: 2400, x1: R, y0: -R, y1: -2700 }, 30, ["flora:Pine", "flora:Pine", "flora:AutumnTree", "flora:Cherry"], 330, (x, y) => inPoly(D2, x, y), { solid: "none", s: [0.9, 1.2] });

  // ---- the rim: thick woods all round (on the plateaus too), nobody gets there ----
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["Bamboo", "Pine", "Cherry", "Pine", "PineSmall", "AutumnTree", "Cherry", "Bamboo"], (x, y) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) !== 0 || Math.abs(x) > A - 200 || Math.abs(y) > A - 200, { count: 520, spacing: 400, tries: 9000 });

  // ---- monsters: over the open ground, the terraces, the shrine's terrace and the ridge ----
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 820, keepOut: (x, y) => [D2, SE, N1, N2].some((p) => inPoly(p, x, y)) });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "sakura_hermit", ...xy(toward(1050, 0)), face: shrineH + 180, name: "หลวงตาโทคุอัน", title: "ผู้เฝ้าศาลร้าง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_black" },
      lines: ["ศาลนี้ร้างมาตั้งแต่ภูเขาไฟตื่น ผู้คนลงไปอยู่ในเมืองกันหมด", "ข้ายังขึ้นบันไดหินมากวาดกลีบซากุระทุกเช้า เทพแห่งภูเขายังไม่ทิ้งที่นี่หรอก", "สัตว์ประหลาดบนลานซากุระดุร้ายขึ้นทุกวัน ยิ่งใกล้ภูเขาไฟยิ่งแรง"],
    },
    {
      id: "sakura_cutter", x: 900, y: 3050, face: 200, name: "ทาเคโอะ", title: "คนตัดไผ่", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "teal", top: "top_warrior", bottom: "bottom_warrior_cocoa" },
      lines: ["ไผ่ในป่านี้ลำตรงที่สุดบนเกาะ ข้าตัดไปทำรั้วกับรางน้ำให้คนในเมือง", "หินใหญ่คาดเชือกในแอ่งนั่นศักดิ์สิทธิ์ ห้ามปีนเด็ดขาด", "ตามทางขึ้นเหนือไปคือยอดภูเขาไฟ หน่วยสำรวจจากโอซากิตั้งค่ายอยู่ข้างบน"],
    },
  ];

  return f.finishField({
    ground,
    scenery: [f.waterSheet({ x0: POND[0] - 900, x1: POND[0] + 900, y0: POND[1] - 800, y1: POND[1] + 800 }, -14, "WaterSea")],
    sky: "#4f6e45",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0, density: 0.3 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -960, y: 4150 },
    npcs,
    labels: [
      { x: WEST[0], y: WEST[1] - 250, text: "ทางไปโอซากิ", kind: "gate" },
      { x: NORTH[0] - 250, y: NORTH[1], text: "ทางไปยอดภูเขาไฟ", kind: "gate" },
      { x: 2600, y: 3700, text: "ป่าไผ่" },
      { x: ROCK[0] - 500, y: ROCK[1] - 300, text: "หินศักดิ์สิทธิ์", kind: "small" },
      { x: -2300, y: -2100, text: "ลานซากุระขั้นบันได" },
      { x: SHRINE[0] + 700, y: SHRINE[1] + 500, text: "ศาลเจ้าร้าง" },
      { x: RAMP_T2.bottom[0] + 200, y: RAMP_T2.bottom[1] + 300, text: "บันไดหินโทริอิ", kind: "small" },
      { x: POND[0] + 800, y: POND[1], text: "บึงน้ำนิ่ง", kind: "small" },
      { x: -3700, y: 3900, text: "ทุ่งหญ้าซูซูกิ", kind: "small" },
      { x: 3000, y: -2500, text: "สันเขาชมภูเขาไฟ" },
      { x: -1650, y: 3400, text: "จิโซริมทาง", kind: "small" },
    ],
  });
}

const xy = (p: XY) => ({ x: p[0], y: p[1] });

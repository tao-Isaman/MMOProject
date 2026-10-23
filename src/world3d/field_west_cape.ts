// แหลมทะเลตะวันตก (the west cape), monsters Lv 188-200, the hardest ground in the land: the
// westernmost cape of the continent, a long headland running out from Suzhou's shore into a wild
// sea that closes it in on the north, the west and the south. The way in comes from Suzhou over the
// east edge, through heath and wind-torn pines, past a broken beacon on the north point and
// another on the south. Up a ramp the spine of the cape rises as a cliff top above the sea, a third
// beacon fallen on it; along the south shore below it a strip of rocky beach leads to the cove
// where a great carrack lies broken on the reef, storm rocks and spray all round, and a second ramp
// climbs from there back onto the cliff top. At the very tip, a step higher again, is the shrine of
// the sea dragon: its stone gate with dragons coiled up the pillars, and beyond it, on the last
// rock before the open sea, the altar where a stone dragon holds out its glowing pearl.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   way out: east -> suzhou (a dead end: the cape goes nowhere else)

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { material } from "./textures";
import { KIT as WEST, GATE_PILLARS } from "./kits/westhills";
import { KIT as STEPPE } from "./kits/steppe";
import { KIT as JUNGLE } from "./kits/jungle";
import { KIT as OSAKI } from "./kits/osaki";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { smooth, band, inPoly } from "./kits/snowland";
import type { XY } from "./kits/snowland";
import { distToPath } from "./kits/frontier";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(WEST, STEPPE, JUNGLE, OSAKI, TRUNRADA);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the coast: the north shore from the east edge out to the tip, round it, and back along the
// south shore to the east edge ----
const NS: XY[] = [[4400, -9000], [4100, -7200], [3700, -5800], [3200, -4900], [3500, -3900], [3000, -2900], [2600, -1800], [2700, -700], [2200, 400], [1900, 1500], [2000, 2600], [1600, 3500], [1400, 4300], [1000, 4950]];
const TIP: XY[] = [[500, 5400], [-200, 5500], [-800, 5150]];
const SS: XY[] = [[-1300, 4400], [-1700, 3400], [-1700, 2400], [-2200, 1500], [-2700, 600], [-2900, -300], [-3300, -1300], [-3800, -2300], [-3500, -3400], [-3900, -4500], [-4400, -6000], [-4700, -7500], [-4900, -9000]];
const SHORE = smooth([...NS, ...TIP, ...SS], 3);
const SEA: XY[] = [...SHORE, [-A, -A], [-A, A], [A, A], [A, -A]];

// ---- the levels: P1 the cliff top along the spine (420), its edge at the sea along the north and
// round the tip, a beach below it on the south; P2 the tip (780), the shrine on it ----
// (on the south a toe of the cliff top reaches down to the shore; the ramp from the beach climbs
// its east face, along the shore)
const P1: XY[] = [[1300, -2500], [2300, -1700], [2450, -700], [2000, 400], [1700, 1500], [1800, 2600], [1400, 3500], [1200, 4250], [820, 4850], [380, 5230], [-180, 5300], [-650, 5000], [-1100, 4300], [-1450, 3400], [-1300, 2400], [-1750, 1900], [-2100, 1300], [-2450, 700], [-1300, 700], [-1250, -400], [-1300, -1500], [-1000, -2300]];
const P2: XY[] = [[1100, 2700], [1150, 3500], [980, 4200], [650, 4750], [250, 5050], [-150, 5100], [-500, 4850], [-850, 4250], [-1050, 3450], [-950, 2700], [-300, 2450], [500, 2450]];

// a ramp off the edge a -> b at t, `len` long, away from the point `inside`
function rampOn(a: XY, b: XY, t: number, len: number, width: number, inside: XY): { top: XY; bottom: XY; width: number } {
  const top: XY = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
  if ((inside[0] - top[0]) * nx + (inside[1] - top[1]) * ny > 0) [nx, ny] = [-nx, -ny];
  return { top, bottom: [top[0] + nx * len, top[1] + ny * len], width };
}
const RAMP_E = rampOn([-1000, -2300], [1300, -2500], 0.55, 1300, 480, [200, 0]);
const RAMP_S = rampOn([-2450, 700], [-1300, 700], 0.5, 1300, 440, [-1875, 1300]);
const RAMP_T = rampOn([-300, 2450], [500, 2450], 0.5, 1100, 440, [100, 3500]);

const along = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};
const rampLen = (r: { top: XY; bottom: XY }) => Math.hypot(r.top[0] - r.bottom[0], r.top[1] - r.bottom[1]);
// cut long edges into short pieces near the walkable box
function dz(poly: XY[], step = 450): XY[] {
  const o: XY[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) o.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return o;
}

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(315, {
    hills: [
      { x: 1500, y: -4300, r: 1400, h: 160 },
      { x: -1800, y: -4800, r: 1300, h: 140 },
      { x: -2500, y: -3000, r: 900, h: 90 },
      { x: 2600, y: -7600, r: 2400, h: 340 },
      { x: -2200, y: -7800, r: 2400, h: 300 },
    ],
    plateaus: [
      { poly: dz(P1), h: 420, ramps: [RAMP_E, RAMP_S] },
      { poly: dz(P2), h: 780, ramps: [RAMP_T] },
    ],
    rock: "Westhills_CapeCliff",
  });
  const { put, rnd } = f;

  // ---- tracks ----
  const E_EXIT: XY = [0, -5150];
  const eIn = along(RAMP_E.bottom, RAMP_E.top, -500), eOut = along(RAMP_E.bottom, RAMP_E.top, rampLen(RAMP_E) + 450);
  const tIn = along(RAMP_T.bottom, RAMP_T.top, -450), tOut = along(RAMP_T.bottom, RAMP_T.top, rampLen(RAMP_T) + 380);
  const GATE: XY = [100, 2950], ALTAR: XY = [0, 4250];
  const MAIN = [...smooth([[0, -7600], E_EXIT, [-90, -4650], eIn]), RAMP_E.bottom, RAMP_E.top, ...smooth([eOut, [400, -1000], [-100, 200], [150, 700], tIn]), RAMP_T.bottom, RAMP_T.top, ...smooth([tOut, along(GATE, tOut, 300), along(ALTAR, GATE, 650)])];
  const sIn = along(RAMP_S.bottom, RAMP_S.top, -500), sOut = along(RAMP_S.bottom, RAMP_S.top, rampLen(RAMP_S) + 450);
  const BEACH = [...smooth([[-60, -4700], [-1200, -4100], [-2200, -3200], [-2400, -2100], [-2050, -1300], sIn]), RAMP_S.bottom, RAMP_S.top, ...smooth([sOut, [-1300, 1500], [-500, 1100], [-100, 750]])];
  const NORTH = smooth([[-50, -4500], [900, -4100], [1800, -3700], [2300, -3350]]);
  const roads = [band(MAIN, 450), band(BEACH, 400), band(NORTH, 380)];
  const tracks = [MAIN, BEACH, NORTH];

  // ---- the ground: wind-burnt heath; a band of rock and shingle along the shore; the sea ----
  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ROAD: [number, number, number] = [0.78, 0.74, 0.7];
  const ground = f.ground({ area, roads, plazas: [], water: [SEA], base: "moss", road: ROAD, tint: "#b9b6a0" });
  // the shore band: a second ground that shows only between the shore and a line 4 m inland
  const inland: XY[] = (() => {
    const pts = [...SHORE];
    return pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0];
      const L = Math.hypot(nx, ny) || 1;
      nx /= L;
      ny /= L;
      if (inPoly(SEA, p[0] + nx * 60, p[1] + ny * 60)) [nx, ny] = [-nx, -ny];
      return [p[0] + nx * 420, p[1] + ny * 420] as XY;
    });
  })();
  const LAND_IN: XY[] = [...inland, [-4900 + 420, -A - 400], [4400 - 420, -A - 400]];
  const shore = f.ground({ area, roads, plazas: [], water: [SEA, LAND_IN], base: "rock", road: ROAD, tint: "#c9c2b4" });
  shore.mesh.position.y += 2;
  shore.mesh.renderOrder = 1;
  // the sea, out to the horizon
  const seaShape = new THREE.Shape();
  [...SHORE, [-30000, -A], [-30000, 30000], [30000, 30000], [30000, -A]].forEach(([x, y], i) => (i ? seaShape.lineTo(x, y) : seaShape.moveTo(x, y)));
  const seaSheet = new THREE.Mesh(new THREE.ShapeGeometry(seaShape).applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)), material("Westhills_StormSea"));
  seaSheet.position.y = -14;
  seaSheet.receiveShadow = true;
  // nobody walks into the sea: a band along the shore
  const seaward = (i: number, d: number): XY => {
    const p = SHORE[i], a = SHORE[Math.max(0, i - 1)], b = SHORE[Math.min(SHORE.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const L = Math.hypot(nx, ny) || 1;
    nx /= L;
    ny /= L;
    if (!inPoly(SEA, p[0] + nx * 60, p[1] + ny * 60)) [nx, ny] = [-nx, -ny];
    return [p[0] + nx * d, p[1] + ny * d];
  };
  const SHORE_IN = SHORE.map((_, i) => i).filter((i) => Math.abs(SHORE[i][0]) < R + 800 && Math.abs(SHORE[i][1]) < R + 800);
  f.blockBand(SHORE_IN.map((i) => seaward(i, 260)), 520, { kind: "sea" });

  // ---- the way out ----
  f.exit("suzhou", E_EXIT, [-60, -4450]);

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number, gap = 0) =>
    Math.abs(x) < A - 200 && Math.abs(y) < A - 200 &&
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, p: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, p, h, o);
    take(p[0], p[1], r);
  };
  const disc = (r: number, kind = "rock", x = 0, y = 0): SolidSpec => ({ kind, x, y, r });
  const onTrack = (x: number, y: number, m = 0) => tracks.some((t) => distToPath(t, x, y) < 230 + m);
  const shoreDist = (x: number, y: number) => distToPath(SHORE, x, y);
  const atSea = (x: number, y: number) => inPoly(SEA, x, y);

  // ---- the way out: a signpost hung with blue scarves, a cairn ----
  prop("steppe:signpost", [-480, -4850], 90, 90, { solid: [disc(30, "post")] });
  prop("trunrada:cairn", [420, -4950], 20, 160, { solid: [disc(125)] });

  // ---- the shrine of the sea dragon on the tip ----
  put("westhills:dragon_gate", GATE, 90, { solid: GATE_PILLARS.map(([x, y, r]) => disc(r, "pillar", x, y)) });
  take(GATE[0], GATE[1], 420);
  put("westhills:dragon_altar", ALTAR, 90, { solid: [disc(480, "altar")] });
  take(ALTAR[0], ALTAR[1], 560);
  for (const [x, y] of [[-330, 3400], [430, 3400], [-330, 3700], [430, 3700]] as XY[]) prop("osaki:stone_lantern", [x, y], 90, 70, { solid: [disc(30, "post")] });
  for (const [x, y, h, s] of [[800, 3200, -100, 0.85], [-750, 3150, -70, 0.8], [600, 4500, -110, 0.7], [-650, 4300, -80, 0.75]] as [number, number, number, number][])
    if (free(x, y, 120, 40)) prop("westhills:ragged_pine", [x, y], h, 200, { s, solid: [disc(30, "tree")] });

  // ---- the beacons that failed: on the north point, the south point, and fallen on the cliff top ----
  for (const [x, y, h] of [[2700, -3750, 60], [-2900, -3650, 200], [1150, 900, 140]] as [number, number, number][]) prop("westhills:broken_beacon", [x, y], h, 420, { solid: [disc(200, "tower")] });

  // ---- the great wreck on the reef in the south cove, storm rocks round it ----
  const WRECK: XY = [-3650, -900];
  put("westhills:great_wreck", WRECK, 8, { z: -20, solid: [{ kind: "wreck", x: 0, y: -350, w: 620, d: 1400, rot: 0 }, { kind: "wreck", x: 160, y: 650, w: 560, d: 900, rot: 0 }] });
  take(WRECK[0], WRECK[1], 1100);
  for (const [x, y, h, s] of [[-4700, -2000, 30, 1], [-4300, 600, 120, 0.8], [-5000, -400, 200, 1.2], [-3900, -2900, 60, 0.7]] as [number, number, number, number][]) prop("westhills:storm_rocks", [x, y], h, 300 * s, { s, z: -14, solid: "none" });
  for (const [x, y, s] of [[-4500, -1700, 1], [-4050, 450, 0.8], [-4850, -500, 1.1], [-4200, -1100, 0.7], [-3700, -2700, 0.7]] as [number, number, number][]) put("westhills:sea_spray", [x, y], rnd() * 360, { s, z: -14, solid: "none" });
  // the wreck's leavings on the beach: planks, a cask, cargo, a rowing boat stove in
  for (const [x, y, ref, h] of [[-2700, -2000, "jungle:wreck_debris", 40], [-2850, 300, "jungle:wreck_debris", 200], [-2600, -2600, "common:crate", 30], [-2500, -1500, "common:crate", 70]] as [number, number, string, number][])
    if (free(x, y, 120, 20)) prop(ref, [x, y], h, 200, ref.startsWith("jungle") ? { solid: "none" } : {});

  // ---- storm rocks and spray all round the cape: off the cliffs' feet, out on the reefs ----
  const OFF: [number, number, number][] = [];
  for (let i = 0; i < SHORE.length; i += 5) {
    const [x, y] = SHORE[i];
    if (Math.abs(x) > A - 600 || Math.abs(y) > A - 600 || y < -6000) continue;
    const d = 300 + rnd() * 2600;
    const p = seaward(i, d);
    if (Math.hypot(p[0] - WRECK[0], p[1] - WRECK[1]) < 1500 || OFF.some(([ox, oy, or]) => Math.hypot(ox - p[0], oy - p[1]) < or + 500)) continue;
    const big = d > 1200 && rnd() < 0.35;
    if (big) put(rnd() < 0.5 ? "steppe:sea_stack" : "jungle:sea_stack", p, rnd() * 360, { s: 0.8 + rnd() * 0.5, z: -12, solid: "none" });
    else put("westhills:storm_rocks", p, rnd() * 360, { s: 0.6 + rnd() * 0.6, z: -14, solid: "none" });
    OFF.push([p[0], p[1], big ? 600 : 300]);
    if (!big && rnd() < 0.45) put("westhills:sea_spray", [p[0] + (rnd() - 0.5) * 200, p[1] + (rnd() - 0.5) * 200], rnd() * 360, { s: 0.7 + rnd() * 0.5, z: -14, solid: "none" });
  }
  // spray breaking at the foot of the sea cliffs
  for (let i = 0; i < SHORE.length; i += 2) {
    const [x, y] = SHORE[i];
    if (Math.abs(x) > R + 1500 || Math.abs(y) > R + 1500 || y < -2000 || rnd() < 0.75) continue;
    put("westhills:sea_spray", seaward(i, 140 + rnd() * 120), rnd() * 360, { s: 0.6 + rnd() * 0.5, z: -14, solid: "none" });
  }
  // rocks along the shore band
  for (let i = 0; i < SHORE.length; i++) {
    const [x, y] = SHORE[i];
    if (Math.abs(x) > R || Math.abs(y) > R || rnd() < 0.55) continue;
    const p = seaward(i, -(120 + rnd() * 160));
    if (!free(p[0], p[1], 90, 30) || onTrack(p[0], p[1], 60)) continue;
    const ref = rnd() < 0.5 ? "steppe:boulder" : rnd() < 0.5 ? "steppe:rock_cluster" : "steppe:boulder_flat";
    const s = 0.5 + rnd() * 0.35;
    prop(ref, p, rnd() * 360, 160 * s, { s, solid: [disc(120 * s)] });
  }

  // ---- ragged pines over the cape, leaning away from the sea wind (east) ----
  for (let i = 0, made = 0; i < 400 && made < 26; i++) {
    const x = -4200 + rnd() * 7000, y = -R + 300 + rnd() * 9000;
    if (atSea(x, y) || shoreDist(x, y) < 500 || onTrack(x, y, 420) || !free(x, y, 160, 260)) continue;
    prop("westhills:ragged_pine", [x, y], -90 + (rnd() - 0.5) * 34, 220, { s: 0.7 + rnd() * 0.45, solid: [disc(30, "tree")] });
    made++;
  }
  // a few stands of pine on the landward end
  for (let i = 0, made = 0; i < 300 && made < 16; i++) {
    const x = -3600 + rnd() * 6600, y = -R + 200 + rnd() * 2600;
    if (atSea(x, y) || shoreDist(x, y) < 700 || onTrack(x, y, 200) || !free(x, y, 160, 200)) continue;
    prop(rnd() < 0.6 ? "flora:Pine" : "flora:PineSmall", [x, y], rnd() * 360, 200, { s: 0.8 + rnd() * 0.3 });
    made++;
  }

  // ---- heath: heather, gorse, wind-flattened grass, stones ----
  for (let i = 0; i < 1100; i++) {
    const x = -A + rnd() * 2 * A, y = -A + rnd() * (A + R + 300);
    if (atSea(x, y) || shoreDist(x, y) < 250 || onTrack(x, y, 60)) continue;
    const k = rnd();
    const ref = k < 0.3 ? "westhills:heather" : k < 0.5 ? "westhills:gorse" : k < 0.85 ? "steppe:grass_tuft" : "steppe:boulder_flat";
    const rad = ref.endsWith("gorse") ? 110 : ref.endsWith("flat") ? 120 : 80;
    if (!free(x, y, rad, 30)) continue;
    const s = ref.endsWith("flat") ? 0.4 + rnd() * 0.3 : 0.75 + rnd() * 0.5;
    put(ref, [x, y], rnd() * 360, { s, solid: ref.endsWith("gorse") ? [disc(55, "bush")] : ref.endsWith("flat") ? [disc(90 * s)] : "none" });
    take(x, y, rad);
  }
  // fallen rock at the foot of the cliff top's faces (on land)
  for (const poly of [P1, P2]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      if (inPoly(poly, (a[0] + b[0]) / 2 + nx * 50, (a[1] + b[1]) / 2 + ny * 50)) [nx, ny] = [-nx, -ny];
      for (let t = 300; t < L - 300; t += 600) {
        const o = 280 + rnd() * 160, x = a[0] + ((b[0] - a[0]) * t) / L + nx * o, y = a[1] + ((b[1] - a[1]) * t) / L + ny * o;
        if (rnd() < 0.45 || atSea(x, y) || !free(x, y, 110, 50)) continue;
        const s = 0.5 + rnd() * 0.35;
        prop(rnd() < 0.5 ? "steppe:boulder" : "steppe:rock_cluster", [x, y], rnd() * 360, 150 * s, { s, solid: [disc(120 * s)] });
      }
    }
  }

  // ---- past the edge on the land (east): pines and ragged pines over the hills ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  f.woods({ x0: -A, x1: A, y0: -A, y1: -R + 100 }, ["Pine", "Pine", "PineSmall", "RoundTree"], (x, y) => inside(x, y) || atSea(x, y) || shoreDist(x, y) < 400 || onTrack(x, y, 200), { count: 150, spacing: 420, tries: 5000 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: -R + 100 }, ["ragged_pine", "gorse"], (x, y) => inside(x, y) || atSea(x, y) || shoreDist(x, y) < 400 || onTrack(x, y, 200), { count: 50, spacing: 600, kit: "westhills" });

  // ---- monsters: the heath, the beach, the cliff top, the tip ----
  const quiet = (x: number, y: number) => Math.hypot(x - ALTAR[0], y - ALTAR[1]) < 700 || Math.hypot(x + 2300, y + 1300) < 900;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 640, keepOut: quiet });

  // ---- people ----
  const npcs: NpcSpec[] = [
    { id: "cape_keeper", x: ALTAR[0] - 120, y: ALTAR[1] - 640, face: 90, name: "ท่านผู้เฒ่าหลงไห่", title: "ผู้เฝ้าศาลมังกรทะเล", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "teal", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "มังกรทะเลหลับใหลอยู่ใต้คลื่นตรงสุดแหลมนี้ ไข่มุกในมือรูปสลักคือดวงใจของมัน",
        "หอไฟทั้งสามดับลงคืนเดียวกับที่เรือใหญ่ลำนั้นชนแนวหิน ตั้งแต่นั้นทะเลก็ไม่เคยสงบอีกเลย",
        "สัตว์ร้ายบนแหลมนี้แข็งแกร่งที่สุดในแผ่นดิน ถ้ายังไม่แน่ใจในฝีมือ จงกลับไปซูโจวเสียเถิด",
      ] },
    { id: "cape_sailor", x: -2300, y: -1300, face: 200, name: "เปียโตร", title: "ผู้รอดชีวิตจากเรืออับปาง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "blue", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "เรือของเราแล่นจากเวนิชเซียมาซูโจว พายุพัดมาเกยหินตรงนี้ในคืนเดียว",
        "ในท้องเรือยังมีของมีค่าเหลืออยู่ แต่พวกปีศาจทะเลมันยึดซากเรือไปหมดแล้ว",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [shore.mesh, seaSheet],
    sky: "#53687a",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && shoreDist(x, y) > 500, density: 0.05 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -60, y: -4300 },
    npcs,
    labels: [
      { x: E_EXIT[0] + 150, y: E_EXIT[1] + 150, text: "ทางไปซูโจว", kind: "gate" },
      { x: GATE[0] - 450, y: GATE[1] - 200, text: "ศาลมังกรทะเล" },
      { x: WRECK[0] + 1200, y: WRECK[1] - 300, text: "ซากเรือใหญ่บนแนวหิน" },
      { x: 500, y: 0, text: "ผาริมทะเล" },
      { x: 2350, y: -3300, text: "หอไฟสัญญาณพัง", kind: "small" },
      { x: -1200, y: -3600, text: "ทุ่งหญ้าลมทะเล", kind: "small" },
    ],
  });
}

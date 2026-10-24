// ทุ่งหินลอย (floating_rocks), monsters Lv 88-98: grassland between the plain of old stones, the
// storm cape and the border, where the magic loosed by the demon gate tore stones and whole
// islands of earth up out of the ground and left them hanging in the air, their shadows lying
// over the grass; violet light still crackles round them. The ways in meet on the open plain in
// the middle. From there:
//   - north-west, a ramp climbs the tableland (5.5 m) that goes on from the plain of old stones'
//     east plateau, an island hanging over it, the way west on its top;
//   - south-west, the river that comes out of the plain of old stones runs into the crater the
//     greatest island was torn from and fills it, the island hanging over its lake;
//   - north-east, a ramp climbs the torn mesa (4.8 m) to the ring of the old circle's stones,
//     torn out of their sockets and circling a rune-cut pillar in the air;
//   - south-east, the camp of the Kradia mages who came to watch: their pavilions, their scrying
//     engine trained on the stones, warding lamps round it; past it the ground greys and blackens
//     with the blight of the thorn land to the east, dark crystals breaking out of it;
//   - south, a gorge through the mountain wall of the border line, a Kradia post at its mouth.
// Small islands and clusters of stones hang over raw hollows all over the plain.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: north (the middle, e 0.50) -> storm_cape, east (the middle, n 0.50) -> thornland,
//             south (e 0.68, the gorge, as border_line's way north) -> border_line,
//             west (n 0.68, on the tableland, as stone_plain's way east) -> stone_plain

import * as THREE from "three";
import { FieldBuilder } from "./field";
import { useKits, colourways } from "./town";
import type { Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import { KIT as HEIGHTS } from "./kits/eastheights";
import { smooth, band, inPoly, distTo, faceDir, faceTo, blob } from "./kits/eastcoast";
import type { XY, Poly } from "./kits/eastcoast";
import { KIT as STEPPE, fieldReport } from "./kits/steppe";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as KRADIA } from "./kits/kradia";
import { KIT as FRONTIER, BLIGHT, DARK_ROCK } from "./kits/frontier";

useKits(HEIGHTS, STEPPE, TRUNRADA, KRADIA, FRONTIER);
colourways({ fr_blight: BLIGHT, fr_dark: DARK_ROCK });

// the last build's own check (see fieldReport), for building the field; the game never calls it
export let REPORT: () => string[] = () => [];

const R = 5500; // the walkable bounds, +-R
const A = 9000; // the ground's area, +-A

// ---- the levels ----
// NW: the tableland (5.5 m) going on from the plain of old stones' east plateau and the storm
// cape's south-west tableland; E: the torn mesa (4.8 m); SW, SE: the border's mountain wall
// (6.5 m, scenery) either side of the gorge
const NW: Poly = [[700, A + 400], [700, 5500], [900, 4300], [1600, 3300], [2300, 2600], [3200, 2000], [4300, 1700], [5500, 1500], [A + 400, 1450], [A + 400, A + 400]];
const ME: Poly = [[3800, -1600], [4600, -2600], [4300, -4200], [2900, -4700], [1500, -4100], [1300, -2600], [2400, -1600]];
const SW: Poly = [[-A - 400, A + 400], [-5050, A + 400], [-5050, 5500], [-4600, 4300], [-4300, 2900], [-3900, 1500], [-3950, 200], [-4300, -800], [-4600, -1350], [-5500, -1450], [-A - 400, -1450]];
const SE: Poly = [[-A - 400, -2550], [-5500, -2550], [-4600, -2650], [-4100, -3300], [-3800, -4400], [-3700, -5500], [-3600, -A - 400], [-A - 400, -A - 400]];

function rampOn(poly: Poly, a: XY, b: XY, t: number, len: number, width: number): { top: XY; bottom: XY; width: number } {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), top: XY = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
  if (inPoly(poly, top[0] + nx * 60, top[1] + ny * 60)) [nx, ny] = [-nx, -ny];
  return { top, bottom: [top[0] + nx * len, top[1] + ny * len], width };
}
const R_NW = rampOn(NW, [1600, 3300], [2300, 2600], 0.5, 1650, 460);
const R_ME = rampOn(ME, [1300, -2600], [1500, -4100], 0.5, 1450, 460);
const lenOf = (r: { top: XY; bottom: XY }) => Math.hypot(r.top[0] - r.bottom[0], r.top[1] - r.bottom[1]);
const toward = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};
const climb = (r: { top: XY; bottom: XY }, inn = 350, out = 350): XY[] => [toward(r.bottom, r.top, -inn), r.bottom, r.top, toward(r.bottom, r.top, lenOf(r) + out)];

// ---- water: the river from the plain of old stones into the crater lake ----
const LAKE_C: XY = [-1900, 2800];
const LAKE: Poly = blob(LAKE_C, 640, 700, 4, 20, 0.07);
const RIVER: XY[] = smooth([[-2950, A + 600], [-2800, 5500], [-2650, 4600], [-2450, 3900], [-2150, 3300]], 4);
const RIVER_W = 600;
// the sea in the north-east corner, where the storm cape's east shore turns along the thorn land's
// north coast
const SEA: Poly = [[A + 400, -4450], [6200, -4500], [5650, -4620], [5350, -4950], [5100, -5250], [5050, -5700], [4800, -6200], [4900, -6900], [4750, -7700], [4850, -A - 400], [A + 400, -A - 400]];

// ---- the tracks and the ways out ----
const N_EXIT: XY = [5150, 0], E_EXIT: XY = [0, -5150], S_EXIT: XY = [-5150, -2000], W_EXIT: XY = [2000, 5150];
const HUB: XY = [0, -500];
const NORTH: XY[] = smooth([[A + 200, 0], N_EXIT, [3800, -100], [2500, -400], [1200, -500], HUB]);
const EAST: XY[] = smooth([HUB, [-300, -1700], [-200, -3000], [-150, -4300], E_EXIT, [0, -A - 200]]);
const SOUTH: XY[] = smooth([HUB, [-1200, -900], [-2500, -1500], [-3700, -1950], [-4500, -2000], S_EXIT, [-A - 200, -2000]]);
const WEST: XY[] = [...smooth([HUB, [400, 400], climb(R_NW, 300)[0]]), ...climb(R_NW, 300).slice(1), ...smooth([climb(R_NW)[3], [2350, 3700], [2050, 4500], W_EXIT, [2000, A + 200]])];
const TO_RING: XY[] = [...smooth([[-200, -3200], climb(R_ME, 200)[0]]), ...climb(R_ME, 200).slice(1), ...smooth([climb(R_ME, 200, 300)[3], [2050, -3150], [2250, -3100]])];
const TO_LAKE: XY[] = smooth([[-500, -200], [-700, 700], [-1050, 1550], [-1250, 2000]]);
const TO_CAMP: XY[] = smooth([[-230, -2700], [-800, -3050], [-1250, -3250]]);
const TRACKS = [NORTH, EAST, SOUTH, WEST, TO_RING, TO_LAKE, TO_CAMP];
const RING: XY = [2950, -3100];
const CAMP: XY = [-1900, -3400];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(528, {
    hills: [
      // the plain rolling, hollows where earth was torn out of it
      { x: 1500, y: 1000, r: 1100, h: 110 }, { x: -800, y: 3800, r: 1000, h: 120 }, { x: 2500, y: -2000, r: 600, h: -50 },
      { x: -2800, y: -500, r: 900, h: 100 }, { x: 900, y: -2400, r: 700, h: 80 }, { x: -1500, y: -4600, r: 900, h: 110 },
      { x: 3500, y: 600, r: 700, h: -60 }, { x: -2900, y: 1400, r: 600, h: 90 }, { x: 600, y: 3300, r: 700, h: 100 },
      // the blighted land rolling on east
      { x: 1500, y: -7600, r: 2600, h: 220 }, { x: -1800, y: -7200, r: 1800, h: 180 },
    ],
    plateaus: [
      { poly: NW, h: 550, ramps: [R_NW] },
      { poly: ME, h: 480, ramps: [R_ME] },
      { poly: SW, h: 650 },
      { poly: SE, h: 650 },
    ],
    rock: "Eastheights_CliffRift",
  });
  const { put, rnd } = f;

  // ---- the ground: steppe grass, the blight greying it toward the thorn land in the east ----
  const river = band(RIVER, RIVER_W);
  const roads = [band(NORTH, 480), band(EAST, 480), band(SOUTH, 480), band(WEST, 440), band(TO_RING, 420), band(TO_LAKE, 380), band(TO_CAMP, 380)];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: [LAKE, river, SEA], base: "steppe", road: [0.82, 0.76, 0.68] });
  const blight = (y: number) => Math.min(1, Math.max(0, (-y - 2600) / 3400));
  {
    const geo = ground.mesh.geometry, pos = geo.getAttribute("position"), col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = ground.mesh.position.x + pos.getX(i), y = -(ground.mesh.position.z + pos.getZ(i));
      const b = blight(y + 500 * Math.sin(x / 900) + 250 * Math.sin(x / 330 + 1)), e = b * b * (3 - 2 * b);
      // (and browned toward the border's trampled grass along the south)
      const w = Math.min(1, Math.max(0, (-3300 - x - 300 * Math.sin(y / 800)) / 2200)), s = w * w * (3 - 2 * w) * 0.75;
      col.set([(1 - 0.32 * e) * (1 - 0.45 * s), (1 - 0.45 * e) * (1 - 0.52 * s), (1 - 0.22 * e) * (1 - 0.6 * s)], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    (ground.mesh.material as THREE.MeshStandardMaterial).vertexColors = true;
  }
  const water = f.waterSheet({ x0: -3800, x1: -1000, y0: 1800, y1: A + 900 }, -14, "WaterSea");
  const sea = f.waterSheet({ x0: 4800, x1: A + 3000, y0: -A - 3000, y1: -4300 }, -14, "Eastheights_StormSea");
  f.blockBand(SEA.slice(1, 10), 420, { kind: "sea" });
  f.blockBand(RIVER.filter(([, y]) => y < R + 900), RIVER_W + 80);
  const LAKE_IN = LAKE.map(([x, y]): XY => [LAKE_C[0] + (x - LAKE_C[0]) * 0.86, LAKE_C[1] + (y - LAKE_C[1]) * 0.86]);
  f.blockBand([...LAKE_IN, LAKE_IN[0]], 300);

  // ---- placing things clear of each other, the tracks, the water and the cliffs ----
  const taken: [number, number, number][] = [];
  const onTrack = (x: number, y: number, m: number) => TRACKS.some((t) => distTo(t, x, y) < m) || [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const wet = (x: number, y: number, m = 0) => inPoly(SEA, x, y) || distTo(SEA.slice(1, 10), x, y) < m || inPoly(LAKE, x, y) || distTo([...LAKE, LAKE[0]], x, y) < m || distTo(RIVER, x, y) < RIVER_W / 2 + m;
  const free = (x: number, y: number, r: number) => !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r);
  const fits = (x: number, y: number, r: number, m = r) => f.level(x, y, Math.min(r, 260)) && !onTrack(x, y, m + 230) && free(x, y, r) && !wet(x, y, r + 120);
  const place = (ref: string, at: XY, h: number, r: number, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    taken.push([at[0], at[1], r]);
  };
  const tryPlace = (ref: string, at: XY, h: number, r: number, o: Parameters<typeof put>[3] = {}) => {
    if (!fits(at[0], at[1], r)) return false;
    place(ref, at, h, r, o);
    return true;
  };
  const ring = (r: number, kind = "rock"): SolidSpec[] => [{ kind, x: 0, y: 0, r }];
  const inBox = (x: number, y: number, m = 0) => Math.abs(x) < R - m && Math.abs(y) < R - m;
  const scatter = (box: { x0: number; x1: number; y0: number; y1: number }, n: number, refs: string[], r: number, ok: (x: number, y: number) => boolean, o: { s?: [number, number]; solid?: number | "none"; tries?: number; head?: () => number; colours?: string } = {}) => {
    for (let t = 0, made = 0; t < (o.tries ?? n * 30) && made < n; t++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (!ok(x, y) || !fits(x, y, r)) continue;
      const s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      place(refs[Math.floor(rnd() * refs.length)], [x, y], o.head ? o.head() : rnd() * 360, r * s, { s, ...(o.colours ? { colours: o.colours } : {}), ...(o.solid === "none" ? { solid: "none" } : o.solid ? { solid: ring(o.solid * s) } : {}) });
      made++;
    }
  };
  const downwind = () => (rnd() - 0.5) * 40;
  const low = (x: number, y: number) => ![NW, ME, SW, SE].some((p) => inPoly(p, x, y));
  const grey = (x: number, y: number) => rnd() < blight(y + 300 * Math.sin(x / 700));

  // ---- the ways out ----
  f.exit("storm_cape", N_EXIT, [4450, -30]);
  f.exit("thornland", E_EXIT, [-20, -4450]);
  f.exit("border_line", S_EXIT, [-4450, -2000]);
  f.exit("stone_plain", W_EXIT, [2030, 4450]);
  place("steppe:signpost", [4650, 550], faceDir(1, 0), 60, { solid: ring(25, "post") });
  place("trunrada:cairn", [4700, -600], 0, 120, { solid: ring(80) });
  place("frontier:signpost", [550, -4650], faceDir(0, -1), 60, { solid: ring(25, "post") });
  place("frontier:dark_crystal", [-600, -4800], 40, 120, { s: 0.45, solid: ring(50) });
  place("kradia:banner_pole", [-4500, -1600], faceDir(-1, 0), 60, { solid: ring(22, "post") });
  place("kradia:banner_pole", [-4500, -2400], faceDir(-1, 0), 60, { solid: ring(22, "post") });
  place("kradia:barricade", [-3900, -1500], 70, 200);
  place("kradia:arcane_lamp", [-4200, -2450], 0, 60, { solid: ring(25, "post") });
  place("steppe:signpost", [2550, 4700], faceDir(0, 1), 60, { solid: ring(25, "post") });
  place("trunrada:cairn", [1500, 4800], 0, 120, { solid: ring(80) });
  for (const w of [N_EXIT, E_EXIT, S_EXIT, W_EXIT]) taken.push([w[0], w[1], 650]);
  place("steppe:signpost", [450, -100], faceTo([450, -100], HUB), 60, { solid: ring(25, "post") });

  // ---- the crater lake and the great island hanging over it ----
  put("eastheights:floating_isle", LAKE_C, 20, { s: 1.5, solid: "none" });
  taken.push([LAKE_C[0], LAKE_C[1], 800]);
  for (const p of RIVER) taken.push([p[0], p[1], RIVER_W / 2 + 60]);
  for (let k = 0; k < 10; k++) {
    // torn turf and roots round the crater's lip
    const a = (k / 10) * Math.PI * 2 + rnd() * 0.3, at: XY = [LAKE_C[0] + Math.cos(a) * 860, LAKE_C[1] + Math.sin(a) * 920];
    if (onTrack(at[0], at[1], 200) || distTo(RIVER, at[0], at[1]) < 500) continue;
    put("eastheights:torn_hollow", at, a * 57.3 + 90, { s: 0.6 + rnd() * 0.3, solid: "none" });
  }

  // ---- the torn mesa: the ring of stones round the rune pillar ----
  place("eastheights:stone_ring", RING, faceTo(RING, R_ME.top), 760, { solid: [{ kind: "stone", x: 0, y: 0, r: 470 }] });
  for (const [ref, at, h] of [["eastheights:floating_stones", [3800, -2300], 30], ["eastheights:heath_boulder", [2000, -4300], 80], ["eastheights:rock_scatter", [3700, -4200], 150], ["eastheights:torn_hollow", [2300, -2200], 60]] as [string, XY, number][])
    tryPlace(ref, at, h, 260, ref.includes("floating") || ref.includes("hollow") ? { solid: "none" } : { solid: ring(150) });
  tryPlace("kradia:arcane_lamp", [2200, -2700], 0, 60, { solid: ring(25, "post") });
  tryPlace("kradia:arcane_lamp", [2200, -3500], 0, 60, { solid: ring(25, "post") });

  // ---- the mages' camp: pavilions, the scrying engine, wards, stores ----
  place("eastheights:mage_tent", CAMP, faceTo(CAMP, [-1250, -3250]), 560, { solid: [{ kind: "tent", x: 0, y: 0, w: 450, d: 450, rot: 0 }] });
  place("eastheights:mage_tent", [-2600, -2800], faceTo([-2600, -2800], [-1600, -3000]), 520, { s: 0.85, solid: [{ kind: "tent", x: 0, y: 0, w: 450, d: 450, rot: 0 }] });
  place("eastheights:scrying_engine", [-1000, -3900], faceDir(1, 0.6), 260, { solid: [{ kind: "post", x: 0, y: 0, r: 130 }, { kind: "post", x: 40, y: 150, r: 40 }] });
  place("kradia:banner_pole", [-1400, -2800], 0, 60, { solid: ring(22, "post") });
  place("kradia:supplies", [-2500, -3700], 40, 200);
  place("trunrada:campfire", [-1650, -2850], 0, 150, { solid: ring(80, "fire") });
  for (const at of [[-900, -2600], [-900, -4300], [-2900, -4200], [-2800, -2300], [-1900, -2300]] as XY[]) tryPlace("kradia:arcane_lamp", at, 0, 60, { solid: ring(25, "post") });
  for (const [x, y, h] of [[-2250, -3800, 20], [-2350, -3880, 70], [-1200, -3600, 10]] as number[][]) tryPlace("common:crate", [x, y], h, 60);

  // ---- rocks along the shore of the sea in the corner ----
  for (let i = 1; i + 1 < 10; i++) {
    const [ax, ay] = SEA[i], [bx, by] = SEA[i + 1];
    for (let t = 0.2; t < 1; t += 0.45) put(rnd() < 0.5 ? "eastheights:rock_scatter" : "steppe:boulder", [ax + (bx - ax) * t - 120, ay + (by - ay) * t + 60], rnd() * 360, { s: 0.45 + rnd() * 0.3, solid: "none", z: -6 });
  }

  // ---- the gorge to the border: fallen rock at the walls' feet ----
  for (let k = 0; k < 8; k++) {
    const x = -5300 + k * 200, side = k % 2 ? 1 : -1, y = -2000 + side * (420 + rnd() * 80);
    put(rnd() < 0.5 ? "eastheights:heath_boulder" : "steppe:rock_cluster", [x, y], rnd() * 360, { s: 0.4 + rnd() * 0.25, solid: "none" });
  }

  // ---- islands and stones hanging over the plain, the hollows they came from ----
  const isle = (ref: string, at: XY, s: number) => {
    if (!fits(at[0], at[1], 200)) return;
    put(ref, at, rnd() * 360, { s, solid: "none" });
    put("eastheights:torn_hollow", at, rnd() * 360, { s: s * (ref.includes("small") ? 1 : 1.6), solid: "none" });
    taken.push([at[0], at[1], 380 * s]);
  };
  isle("eastheights:floating_isle", [3300, 3700], 1);
  isle("eastheights:floating_isle_small", [1700, -1700], 1);
  isle("eastheights:floating_isle_small", [-700, 3800], 1.2);
  isle("eastheights:floating_isle_small", [4200, -900], 0.9);
  isle("eastheights:floating_isle_small", [-3100, -3600], 1);
  isle("eastheights:floating_isle_small", [2100, 1200], 0.8);
  isle("eastheights:floating_isle", [-2800, 400], 0.8);
  for (const at of [[-1300, 1100], [1300, -3100], [3700, 4700], [-3400, -1000], [800, 2300], [3000, -5000], [1250, 750], [-900, -1800], [2700, -900], [-2300, -500]] as XY[]) tryPlace("eastheights:floating_stones", at, rnd() * 360, 280, { s: 0.8 + rnd() * 0.3, solid: "none" });
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 16, ["eastheights:torn_hollow"], 150, (x, y) => inBox(x, y, 300), { s: [0.5, 0.9], solid: "none" });

  // ---- the plain: boulders, rock shelves, a few crooked pines; the blight in the east: dead
  // trees, dark crystals, burnt patches ----
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 18, ["eastheights:heath_boulder", "eastheights:rock_scatter", "steppe:boulder", "steppe:boulder_flat"], 200, (x, y) => inBox(x, y, 250) && !grey(x, y), { s: [0.6, 1], solid: 130 });
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 3, ["eastheights:granite_tor"], 320, (x, y) => inBox(x, y, 600), { s: [0.8, 1], solid: 190 });
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 12, ["eastheights:bent_pine"], 260, (x, y) => inBox(x, y, 400) && !grey(x, y) && rnd() < 0.6, { s: [0.75, 1.05], head: downwind });
  scatter({ x0: -R, x1: R, y0: -R, y1: -2000 }, 16, ["frontier:dead_tree"], 150, (x, y) => inBox(x, y, 250) && grey(x, y), { s: [0.75, 1.05], solid: 40 });
  scatter({ x0: -R, x1: R, y0: -R, y1: -2500 }, 14, ["frontier:dark_crystal"], 150, (x, y) => inBox(x, y, 250) && grey(x, y), { s: [0.35, 0.6], solid: 60 });
  scatter({ x0: -R, x1: R, y0: -R, y1: -2000 }, 14, ["frontier:scorch_mark"], 150, (x, y) => inBox(x, y, 250) && low(x, y) && grey(x, y), { s: [0.5, 0.9], solid: "none", colours: "fr_blight" });
  scatter({ x0: -R, x1: R, y0: -R, y1: -2000 }, 8, ["frontier:rock_cluster", "frontier:boulder"], 180, (x, y) => inBox(x, y, 250) && grey(x, y), { s: [0.6, 0.9], solid: 120, colours: "fr_dark" });
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 40, ["eastheights:heather"], 110, (x, y) => inBox(x, y, 200) && !grey(x, y), { s: [0.7, 1.1], solid: "none", head: downwind });
  scatter({ x0: -R - 400, x1: R + 400, y0: -R - 400, y1: R + 400 }, Math.round(260 + 120 * quality.flowers), ["eastheights:bent_grass", "steppe:grass_tuft", "steppe:grass_tuft"], 60, (x, y) => !wet(x, y, 80) && !grey(x, y), { s: [0.7, 1.2], solid: "none", tries: 10000, head: downwind });
  scatter({ x0: -R - 400, x1: R + 400, y0: -R - 400, y1: -1500 }, 70, ["frontier:grass_tuft"], 60, (x, y) => grey(x, y), { s: [0.7, 1.2], solid: "none", tries: 3000 });

  // ---- past the edges: the plain of old stones' woods west, the border's wall south with its
  // autumn trees, the moor north, the blighted land east; islands hanging over the rim ----
  const outside = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || onTrack(x, y, 300) || wet(x, y, 250);
  f.woods({ x0: -A, x1: 700, y0: R, y1: A }, ["Pine", "PineSmall", "Birch", "Pine", "AutumnTree"], (x, y) => outside(x, y), { count: 80, spacing: 450, tries: 3000 });
  f.woods({ x0: -A, x1: -R, y0: -A, y1: A }, ["AutumnTree", "PineSmall", "Pine"], outside, { count: 60, spacing: 650, tries: 2000 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: -R }, ["dead_tree", "dead_tree", "dark_crystal", "boulder"], outside, { count: 90, spacing: 560, tries: 3000, kit: "frontier" });
  f.woods({ x0: R, x1: A, y0: -R, y1: A }, ["bent_pine", "heather", "bent_grass", "heath_boulder", "bent_grass"], outside, { count: 70, spacing: 520, tries: 3000, kit: "eastheights" });
  f.woods({ x0: 700, x1: A, y0: R, y1: A }, ["bent_pine", "heather", "heath_boulder", "bent_grass", "rock_scatter"], outside, { count: 40, spacing: 560, tries: 2000, kit: "eastheights" });
  for (const [x, y, s, ref] of [[7200, 6800, 1.2, "floating_isle"], [-7000, -7200, 1, "floating_isle_small"], [6800, -6600, 1.3, "floating_isle_small"], [-6800, 5600, 0.9, "floating_isle"]] as [number, number, number, string][])
    put(`eastheights:${ref}`, [x, y], rnd() * 360, { s, solid: "none" });

  // ---- monsters: the plain, the tableland, the mesa round the ring, the gorge; not in the camp ----
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, {
    step: 760, max: 52,
    keepOut: (x, y) => Math.hypot(x - CAMP[0] - 300, y - CAMP[1] - 200) < 1300 || Math.hypot(x - RING[0], y - RING[1]) < 520,
  });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "fr_mage", x: -1350, y: -3500, face: 30, name: "อาจารย์เซเลีย", title: "หัวหน้าค่ายนักเวทคราเดีย", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "violet", eyes: "violet", top: "top_priestess_black", bottom: "bottom_priestess_black" },
      lines: [
        "หินพวกนี้ลอยขึ้นในคืนเดียวกับที่ประตูอสูรเปิด เวทจากประตูนั้นแรงจนดึงแผ่นดินขึ้นมาได้",
        "เครื่องส่องของเราจับแสงม่วงรอบหินได้ทุกครั้งที่มันกระพริบ วงหินบนเนินตะวันออกยังหมุนไม่หยุดเลย",
        "ตาหินที่ลอยไปมานั่นไม่ใช่หินธรรมดา มันมองเห็นเรา อย่าเข้าใกล้ถ้าไม่จำเป็น",
      ],
    },
    {
      id: "fr_guard", x: -4100, y: -2550, face: -90, name: "แบรน", title: "ทหารคราเดียเฝ้าช่องเขา", role: "talk",
      look: { gender: "male", hair: "", hairColor: "blue", eyes: "violet", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "ช่องเขานี้ลงใต้ไปถึงแนวป้องกันชายแดน ทัพคราเดียยังตั้งมั่นอยู่ที่นั่น",
        "พวกอสูรหัวแพะชอบเดินขึ้นมาจากทางตะวันออก ตามดินดำที่ลามมาจากทุ่งหนาม",
      ],
    },
  ];

  REPORT = () => [`placements ${f.puts.length}`, ...fieldReport(f, ground)];
  return f.finishField({
    ground,
    scenery: [water, sea],
    sky: "#8d8aa0",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && blight(y) < 0.2, density: 0.07 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4450, y: -30 },
    npcs,
    labels: [
      { x: N_EXIT[0] - 300, y: N_EXIT[1], text: "ทางไปแหลมพายุ", kind: "gate" },
      { x: E_EXIT[0], y: E_EXIT[1] + 300, text: "ทางไปทุ่งหนามอสูร", kind: "gate" },
      { x: S_EXIT[0] + 300, y: S_EXIT[1], text: "ทางไปแนวป้องกันชายแดน", kind: "gate" },
      { x: W_EXIT[0], y: W_EXIT[1] - 300, text: "ทางไปที่ราบหินโบราณ", kind: "gate" },
      { x: RING[0] - 800, y: RING[1], text: "วงหินลอยรอบเสาหิน" },
      { x: LAKE_C[0] - 1000, y: LAKE_C[1], text: "ทะเลสาบหลุมยักษ์" },
      { x: CAMP[0] + 600, y: CAMP[1] + 300, text: "ค่ายนักเวทคราเดีย" },
      { x: 600, y: 600, text: "ทุ่งหินลอย" },
      { x: 2600, y: 3300, text: "ที่ราบสูงตะวันตก", kind: "small" },
      { x: -4300, y: -2000, text: "ช่องเขาชายแดน", kind: "small" },
      { x: 1000, y: -4300, text: "ดินแดนต้องสาป", kind: "small" },
    ],
  });
}

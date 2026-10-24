// ทะเลทรายแก้ว (the glass desert), monsters Lv 74-84: a cape of sand east of the great desert,
// the sea on its north, east and south, where lightning and a falling star fused the sand into
// glass. The way in from the great desert (the north end of the west side, through a cut in the
// mesa wall the two share) comes out onto dunes still golden from the desert; past them the sand
// pales to silver, spires of clear glass break out of it and plates of green glass crust it. The
// track winds south-east past the glass mesa on the north, its sea cliffs and its summit crowned
// by the tallest spires, to the great crater in the middle of the cape: a bowl ringed by a rim of
// thrown-up rock and tipped slabs, its floor fused black, the fallen star still glowing at its
// heart, where the mages of Kradia keep a watch camp on its rim. South of the crater a ridge the
// storms keep striking, scorched rocks and tubes of lightning glass over it, and out at the cape's
// tip a grove of glass trees looking over the sea.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   way out: west (north end) -> great_desert

import * as THREE from "three";
import { FieldBuilder } from "./field";
import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import type { Town } from "./town";
import { useKits } from "./town";
import { material } from "./textures";
import { smooth, band, dense, blob, inPoly, toLine, towards, along } from "./kits/westfarm";
import type { XY } from "./kits/westfarm";
import { KIT as SOUTHSANDS } from "./kits/southsands";
import { KIT as DESERT } from "./kits/desert";
import { KIT as BAHAMAS } from "./kits/bahamas";
import { KIT as JUNGLE } from "./kits/jungle";
import { KIT as KRADIA } from "./kits/kradia";
import { KIT as FRONTIER } from "./kits/frontier";
import { KIT as VOLCANIC } from "./kits/volcanic";
import { KIT as TRUNRADA } from "./kits/trunrada";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(SOUTHSANDS, DESERT, BAHAMAS, JUNGLE, KRADIA, FRONTIER, VOLCANIC, TRUNRADA);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the coast: the north shore from past the west edge round the cape's tip and back west along
// the south shore; the sea north, east and south of it ----
const SHORE: XY[] = smooth([
  [5100, A + 600], [4900, 7000], [4800, 5600], [4600, 4200], [4500, 2600], [4150, 1000], [3650, -700], [3050, -2200], [2300, -3500], [1300, -4250],
  [350, -4700], [-600, -4650], [-1500, -4100], [-2600, -3100], [-3500, -1700], [-4150, 0], [-4450, 1800], [-4600, 3600], [-4800, 5500], [-5100, 7000], [-5300, A + 600],
], 220);
const LAND: Poly = [...SHORE, [-A - 600, A + 600], [A + 600, A + 600]];
const SEA: Poly = [...SHORE, [-A - 600, A + 600], [-A - 600, -A - 600], [A + 600, -A - 600], [A + 600, A + 600]];

// ---- the levels ----
// N1: the glass mesa (450) on the north side, its north face sea cliffs; N1B its summit (800) where
// the tallest spires stand; S1: the lightning ridge (380) on the south side; past the west edge
// the mesa wall the great desert shares, cut where the track comes through.
const N1: XY[] = [[3800, 3000], [3900, 1500], [3400, 200], [2600, -900], [1600, -1500], [1100, -600], [1400, 800], [2200, 2000], [2900, 3100]];
const N1B: XY[] = [[3300, 1300], [3200, 300], [2600, -400], [1900, -700], [1700, 300], [2300, 1200]];
const S1: XY[] = [[-1600, 3800], [-1200, 2200], [-1700, 600], [-2700, -300], [-3500, 200], [-3700, 1700], [-3600, 3300], [-2800, 4300]];
const RIM_W: XY[] = [[-4300, 6250], [-2000, 6600], [1000, 6250], [3050, 6450], [3100, 8200], [3900, 8200], [3950, 6450], [4450, 6550], [4650, A + 600], [-4500, A + 600]];
const RN1 = { top: [2550, 2550] as XY, bottom: [1416, 3279] as XY, width: 460 };
const RN1B = { top: [2800, 1250] as XY, bottom: [2800, 2300] as XY, width: 420 };
const RS1 = { top: [-1400, 3000] as XY, bottom: [-140, 3315] as XY, width: 440 };
const len = (r: { top: XY; bottom: XY }) => Math.hypot(r.top[0] - r.bottom[0], r.top[1] - r.bottom[1]);
const climb = (r: { top: XY; bottom: XY }, inn = 400, out = 400): XY[] => [along(r.bottom, r.top, -inn), r.bottom, r.top, along(r.bottom, r.top, len(r) + out)];

// ---- the places ----
const W_EXIT: XY = [3500, 5150];
const CRATER: XY = [-500, -1800], CR = 1600; // the bowl and its rim's radius
const CAMP: XY = [450, -350];                 // the mages' watch camp on the crater's north-west rim
const CROWN: XY = [2550, 300];                // the tallest spires, on the mesa's summit
const TIP: XY = [-300, -4050];                // the glass trees at the cape's tip
const STRIKE: XY = [-2600, 1900];             // the lightning ridge's struck tree
const FOREST: XY = [-500, 2500];              // the thicket of glass spires between the track and the ridge

// ---- the tracks ----
const T_MAIN: XY[] = smooth([[3500, 7600], W_EXIT, [3350, 4400], [2700, 3900], [1700, 3700], [900, 3000], [450, 2000], [400, 900], [450, 0], [300, -650]]);
// down into the crater from its north-west rim to the fallen star, out over its east rim to the tip
const T_CRATER: XY[] = smooth([[300, -650], [0, -1050], [-300, -1450], [CRATER[0] + 220, CRATER[1] + 80]]);
const T_TIP: XY[] = smooth([[450, -300], [900, -1300], [1100, -2400], [700, -3300], [150, -3700], [TIP[0] + 250, TIP[1] + 150]]);
const T_N1: XY[] = [...smooth([[1900, 3700], climb(RN1)[0]]), ...climb(RN1).slice(1), ...smooth([climb(RN1)[3], climb(RN1B, 300)[0]]), ...climb(RN1B, 300).slice(1), ...smooth([climb(RN1B, 300, 300)[3], [CROWN[0] + 250, CROWN[1] + 500]])];
const T_S1: XY[] = [...smooth([[650, 2600], climb(RS1)[0]]), ...climb(RS1).slice(1), ...smooth([climb(RS1)[3], [-2200, 2700], [STRIKE[0] + 300, STRIKE[1] + 300]])];
const TRACKS = [T_MAIN, T_CRATER, T_TIP, T_N1, T_S1];

// how far into the band along the west edge, where the silver sand turns to the great desert's
// gold (0 at its inner side, 1 at the edge and past it)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => t * t * (3 - 2 * t);
const goldW = (y: number) => clamp01((y - 3200) / 2300);
// the ragged line west of which the sand is still the desert's (the glass sand laid over the rest)
const glassLine = (x: number) => 3000 + 380 * Math.sin(x / 640 + 0.5) + 200 * Math.sin(x / 240 + 1.7) + 90 * Math.sin(x / 97);

export function build(_quality: { flowers: number }): Town {
  // the crater: a bowl, and a rim of thrown-up ground round it
  const rimHills = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 + 0.2;
    return { x: CRATER[0] + Math.cos(a) * CR, y: CRATER[1] + Math.sin(a) * CR, r: 600 + (i % 3) * 60, h: 200 + (i % 2) * 50 };
  });
  const f = new FieldBuilder(518, {
    hills: [
      { x: CRATER[0], y: CRATER[1], r: CR + 100, h: -360 }, ...rimHills,
      // dunes going gold toward the great desert, low swells over the cape
      { x: 1500, y: 4700, r: 900, h: 170 }, { x: -1600, y: 5000, r: 900, h: 160 }, { x: -3100, y: 5100, r: 700, h: 130 },
      { x: 2000, y: -2900, r: 700, h: 110 }, { x: -2600, y: -2000, r: 600, h: 90 }, { x: -500, y: 2600, r: 700, h: 100 },
      // and the great dunes past the west edge
      { x: 600, y: 7400, r: 2000, h: 380 }, { x: -2800, y: 7600, r: 1800, h: 340 },
    ],
    plateaus: [
      { poly: dense(N1), h: 450, ramps: [RN1] },
      { poly: dense(N1B), h: 800, ramps: [RN1B] },
      { poly: dense(S1), h: 380, ramps: [RS1] },
      { poly: dense(RIM_W), h: 760 },
    ],
    rock: "Southsands_CliffGlass",
  });
  const { rnd } = f;

  const CAMP_YARD = blob(CAMP, 420, 520, 9, 14, 0.1);
  const roads: Poly[] = [band(T_MAIN, 470), band(T_CRATER, 400), band(T_TIP, 420), band(T_N1, 400), band(T_S1, 400), CAMP_YARD];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, cell: 60, roads, plazas: [], water: [SEA], base: "sand", road: [0.92, 0.86, 0.78] });

  // ---- the glass sand: a second ground a hair over the desert's sand, east of a ragged line near
  // the west edge (the desert's gold runs on west of it), its colour worked point by point: silver
  // over the cape, green-grey where glass crusts it, fused black down in the crater, wet at the water
  // (a factor on its own colour; the tracks drawn on it paler) ----
  const GLASS_IN: XY[] = [];
  for (let x = -A; x <= A; x += 150) GLASS_IN.push([x, glassLine(x)]);
  const glass = buildPaved({
    area: { x0: -A, x1: A, y0: -A, y1: 6000 }, roads, plazas: [], cell: 80, base: "snow", tint: "#e9e2d0", track: true, road: [0.86, 0.82, 0.76],
    water: [[...GLASS_IN, [A + 600, A + 600], [-A - 600, A + 600]], SEA],
    height: (x, y) => f.h(x, y) + 3,
    place: (x, y, cell) => {
      const [px, py, h, k] = f.terrain.place(x, y, cell);
      return [px, py, h + 3, k];
    },
  });
  glass.mesh.renderOrder = 1;
  {
    const geo = glass.mesh.geometry, pos = geo.getAttribute("position"), col = new Float32Array(pos.count * 3);
    const GLASSY = [0.84, 0.95, 0.92], BURNT = [0.36, 0.36, 0.38], RIMC = [0.86, 0.8, 0.74], WET = [0.72, 0.72, 0.7];
    const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
    for (let i = 0; i < pos.count; i++) {
      const x = glass.mesh.position.x + pos.getX(i), y = -(glass.mesh.position.z + pos.getZ(i));
      const d = toLine(x, y, SHORE), dc = Math.hypot(x - CRATER[0], y - CRATER[1]);
      const n = 0.5 + 0.5 * Math.sin(x / 530 + Math.sin(y / 410)) * Math.sin(y / 610 + 1.3);
      let c = mix([1, 1, 1], GLASSY, n * 0.8);
      c = mix(c, RIMC, ease(clamp01(1 - Math.abs(dc - CR) / 500)) * 0.8);
      c = mix(c, BURNT, ease(clamp01((CR - 250 - dc) / 600)));
      c = mix(c, WET, ease(clamp01((260 - d) / 200)));
      // toward the desert the glass sand thins to its gold
      c = mix(c, [1.06, 0.96, 0.78], ease(clamp01((y - glassLine(x) + 900) / 900)));
      col.set(c, i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    (glass.mesh.material as THREE.MeshStandardMaterial).vertexColors = true;
  }

  // ---- the sea all round, the shore closed ----
  const seaward = (i: number, d: number): XY => {
    const a = SHORE[Math.max(0, i - 1)], b = SHORE[Math.min(SHORE.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let n: XY = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
    if (inPoly(LAND, SHORE[i][0] + n[0] * 120, SHORE[i][1] + n[1] * 120)) n = [-n[0], -n[1]];
    return [SHORE[i][0] + n[0] * d, SHORE[i][1] + n[1] * d];
  };
  const shoreIn = SHORE.map((_, i) => i).filter((i) => Math.abs(SHORE[i][0]) < R + 700 && Math.abs(SHORE[i][1]) < R + 700);
  f.blockBand(shoreIn.map((i) => seaward(i, 260)), 520, { kind: "sea" });
  const seaShape = new THREE.Shape();
  [...SHORE.map((_, i) => seaward(i, -220)), [-20000, A + 600], [-20000, -20000], [20000, -20000], [20000, A + 600]].forEach(([x, y], i) => (i ? seaShape.lineTo(x, y) : seaShape.moveTo(x, y)));
  const seaSheet = new THREE.Mesh(new THREE.ShapeGeometry(seaShape).applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)), material("WaterSea"));
  seaSheet.position.y = -14;
  seaSheet.receiveShadow = true;

  // ---- the way out ----
  f.exit("great_desert", W_EXIT, [3350, 4450]);

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine(x, y, t) < d) || ground.kind(x, y) !== 0;
  const wet = (x: number, y: number, r: number) => [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].some(([dx, dy]) => ground.kind(x + dx, y + dy) === 3);
  const free = (x: number, y: number, r: number, gap = 0) =>
    !nearTrack(x, y, r + 200) && !wet(x, y, r + 150) && f.level(x, y, Math.min(r, 220)) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof f.put>[3] = {}) => {
    f.put(ref, at, h, o);
    taken.push([at[0], at[1], r]);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });
  const IN = { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 };
  const scatter = (refs: string[], n: number, box: { x0: number; x1: number; y0: number; y1: number }, rad: number, o: { s?: [number, number]; solid?: SolidSpec[] | "none"; keep?: (x: number, y: number) => boolean } = {}) => {
    for (let i = 0, made = 0; i < n * 30 && made < n; i++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (!free(x, y, rad, 40) || (o.keep && !o.keep(x, y))) continue;
      const s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      prop(refs[Math.floor(rnd() * refs.length)], [x, y], rnd() * 360, rad * s, { s, ...(o.solid ? { solid: o.solid } : {}) });
      made++;
    }
  };
  const nearExit = (x: number, y: number) => Math.hypot(x - W_EXIT[0], y - W_EXIT[1]) < 1200;
  const inCrater = (x: number, y: number) => Math.hypot(x - CRATER[0], y - CRATER[1]) < CR - 250;
  const DUNE_SOLID: SolidSpec[] = [{ kind: "dune", x: 40, y: 0, r: 240 }, { kind: "dune", x: 110, y: -290, r: 180 }, { kind: "dune", x: 110, y: 290, r: 180 }];
  const SPIRES = (s: number): SolidSpec[] => [{ kind: "crystal", x: 0, y: 0, r: 230 * s }];

  // ---- the way out: the desert's signpost, rocks at the cut ----
  prop("desert:signpost", [W_EXIT[0] - 420, W_EXIT[1] - 300], 0, 80);
  prop("desert:boulder_big", [W_EXIT[0] + 600, W_EXIT[1] + 200], 50, 230, { s: 0.6, ...ring(140) });
  prop("desert:rock_cluster", [W_EXIT[0] - 650, W_EXIT[1] + 400], 30, 200, { s: 0.7, ...ring(120) });
  prop("desert:signpost", [650, 300], 60, 80);

  // ---- the crater: the fallen star glowing at its heart, glowing cracks and glass crust over its
  // black floor, the rim's tipped slabs and scorched rocks ----
  prop("southsands:meteorite", CRATER, 30, 420, { solid: [{ kind: "rock", x: 0, y: 0, r: 300 }] });
  for (const [dx, dy, s] of [[700, -300, 0.7], [-700, -200, 0.6], [100, 700, 0.6], [-300, -800, 0.55], [600, 450, 0.5]] as number[][]) f.put("southsands:glass_crust", [CRATER[0] + dx, CRATER[1] + dy], rnd() * 360, { s, solid: "none" });
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + 0.45, d = CR - 100 + (i % 3) * 180;
    const at: XY = [CRATER[0] + Math.cos(a) * d, CRATER[1] + Math.sin(a) * d];
    if (nearTrack(at[0], at[1], 350) || wet(at[0], at[1], 300)) continue;
    prop(i % 3 ? "southsands:ejecta_rocks" : "southsands:scorched_rock", at, (a * 180) / Math.PI, 280, { s: 0.8 + (i % 4) * 0.1, solid: [{ kind: "rock", x: 0, y: 0, r: 170 }] });
  }
  for (let i = 0; i < 5; i++) {
    const a = rnd() * Math.PI * 2, d = 500 + rnd() * 600, at: XY = [CRATER[0] + Math.cos(a) * d, CRATER[1] + Math.sin(a) * d];
    if (free(at[0], at[1], 120)) prop("southsands:scorched_rock", at, rnd() * 360, 160, { s: 0.5 + rnd() * 0.3, ...ring(90) });
  }

  // ---- the mages' watch camp on the rim: a tent, a rune circle and crystal lamps, their supplies ----
  prop("bahamas:caravan_tent", [CAMP[0] + 250, CAMP[1] + 350], towards(-0.6, -1), 360);
  prop("kradia:rune_circle", [CAMP[0] - 150, CAMP[1] - 200], 0, 0, { solid: "none" });
  prop("kradia:arcane_lamp", [CAMP[0] - 450, CAMP[1] + 250], 0, 50);
  prop("kradia:arcane_lamp", [CAMP[0] + 250, CAMP[1] - 450], 0, 50);
  prop("kradia:supplies", [CAMP[0] + 500, CAMP[1] - 100], 30, 120);
  prop("trunrada:campfire", [CAMP[0] + 50, CAMP[1] + 50], 0, 140);
  prop("kradia:banner_pole", [CAMP[0] - 350, CAMP[1] + 480], 0, 60);

  // ---- the glass mesa: spires everywhere over it, the tallest crowning its summit ----
  prop("southsands:glass_spires", CROWN, 20, 400, { s: 1.25, solid: SPIRES(1.25) });
  prop("southsands:glass_spires", [CROWN[0] - 600, CROWN[1] - 700], 120, 300, { s: 0.85, solid: SPIRES(0.85) });
  prop("southsands:glass_tree", [CROWN[0] + 350, CROWN[1] - 800], 40, 200, ring(40, "tree"));
  scatter(["southsands:glass_spires"], 6, { x0: 1200, x1: 3900, y0: -1400, y1: 3000 }, 300, { s: [0.55, 0.85], solid: SPIRES(0.7), keep: (x, y) => f.h(x, y) > 400 && f.h(x, y) < 700 });
  scatter(["southsands:glass_shard", "southsands:glass_shard", "southsands:glass_crust"], 10, { x0: 1200, x1: 3900, y0: -1400, y1: 3000 }, 150, { s: [0.7, 1.1], solid: "none", keep: (x, y) => f.h(x, y) > 400 });

  // ---- the lightning ridge: a tree struck dead, tubes of lightning glass, scorched rocks ----
  prop("desert:dead_tree", STRIKE, 40, 200, { s: 1.3, ...ring(32, "tree") });
  prop("frontier:scorch_mark", [STRIKE[0] - 200, STRIKE[1] + 100], 0, 0, { solid: "none" });
  scatter(["southsands:fulgurite", "southsands:fulgurite", "southsands:scorched_rock", "southsands:glass_shard"], 10, { x0: -3700, x1: -1200, y0: -300, y1: 4300 }, 180, { s: [0.7, 1.1], solid: [{ kind: "rock", x: 0, y: 0, r: 110 }], keep: (x, y) => f.h(x, y) > 300 });

  // ---- the cape's tip: the glass trees looking out to sea ----
  for (const [dx, dy, s] of [[0, 0, 1.15], [450, -350, 0.9], [-400, -250, 0.8], [250, 450, 0.75], [-150, -650, 0.7]] as number[][]) {
    const at: XY = [TIP[0] + dx, TIP[1] + dy];
    if (!wet(at[0], at[1], 250)) prop("southsands:glass_tree", at, rnd() * 360, 200 * s, { s, ...ring(40 * s, "tree") });
  }
  prop("southsands:glass_crust", [TIP[0] + 200, TIP[1] - 100], 50, 0, { s: 0.7, solid: "none" });

  // ---- the sea: stacks of dark rock offshore, a few sunk in the shallows ----
  for (const [x, y, h, s] of [[5400, 1500, 20, 1], [4600, -2600, 120, 0.9], [2200, -5200, 200, 1.1], [-2400, -4800, 70, 0.85], [-5200, 600, 300, 1], [-5600, 4200, 160, 0.8], [5700, 4800, 260, 0.9]] as number[][])
    f.put("jungle:sea_stack", [x, y], h, { s, z: -10, solid: "none" });

  // ---- the cape: spires and shards over the silver sand, glass crust, scorched rocks, bones; the
  // desert's dunes, rocks and scrub thickening toward the west ----
  // the thicket of glass spires
  for (let i = 0, made = 0; i < 120 && made < 11; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 1100, x = FOREST[0] + Math.cos(a) * d, y = FOREST[1] + Math.sin(a) * d * 1.3;
    if (!free(x, y, 260, 20)) continue;
    const s = 0.6 + rnd() * 0.5;
    prop("southsands:glass_spires", [x, y], rnd() * 360, 300 * s, { s, solid: SPIRES(s) });
    made++;
  }
  scatter(["southsands:glass_shard"], 10, { x0: FOREST[0] - 1300, x1: FOREST[0] + 1300, y0: FOREST[1] - 1600, y1: FOREST[1] + 1600 }, 140, { s: [0.7, 1.1], solid: [{ kind: "crystal", x: 0, y: 0, r: 60 }] });
  scatter(["southsands:glass_spires"], 14, IN, 300, { s: [0.45, 0.85], solid: SPIRES(0.65), keep: (x, y) => !nearExit(x, y) && !inCrater(x, y) && goldW(y) < 0.5 && f.h(x, y) < 300 });
  scatter(["southsands:glass_shard"], 40, IN, 150, { s: [0.6, 1.1], solid: [{ kind: "crystal", x: 0, y: 0, r: 60 }], keep: (x, y) => !nearExit(x, y) && goldW(y) < 0.7 });
  scatter(["southsands:glass_crust"], 22, IN, 300, { s: [0.5, 0.95], solid: "none", keep: (_x, y) => goldW(y) < 0.6 });
  scatter(["southsands:fulgurite"], 10, IN, 160, { s: [0.7, 1], solid: [{ kind: "rock", x: 0, y: 0, r: 100 }], keep: (_x, y) => goldW(y) < 0.6 });
  scatter(["southsands:scorched_rock", "volcanic:obsidian", "southsands:ejecta_rocks"], 16, IN, 180, { s: [0.5, 0.9], solid: [{ kind: "rock", x: 0, y: 0, r: 110 }], keep: (x, y) => !nearExit(x, y) });
  scatter(["southsands:glass_tree"], 4, IN, 200, { s: [0.7, 0.95], solid: [{ kind: "tree", x: 0, y: 0, r: 35 }], keep: (x, y) => !nearExit(x, y) && goldW(y) < 0.3 && !inCrater(x, y) });
  // what the sea leaves on the cape's beaches: driftwood, bones, skulls
  scatter(["jungle:wreck_debris", "desert:bones", "southsands:cow_skull", "desert:fallen_log"], 10, IN, 150, { s: [0.6, 1], solid: "none", keep: (x, y) => toLine(x, y, SHORE) < 600 });
  scatter(["desert:dune_ridge"], 6, IN, 460, { s: [0.6, 0.95], solid: DUNE_SOLID, keep: (x, y) => !nearExit(x, y) && goldW(y) > 0.2 });
  scatter(["desert:rock_cluster", "desert:boulder_flat", "desert:boulder_big"], 12, IN, 220, { s: [0.5, 0.85], solid: [{ kind: "rock", x: 0, y: 0, r: 120 }], keep: (x, y) => !nearExit(x, y) && rnd() < goldW(y) + 0.25 });
  scatter(["desert:bones", "southsands:cow_skull"], 6, IN, 140, { solid: "none" });
  scatter(["desert:dry_bush", "desert:dead_tree"], 10, IN, 110, { s: [0.7, 1.1], keep: (_x, y) => rnd() < goldW(y) + 0.1 });
  const grassOut = (x: number, y: number) => nearTrack(x, y, 60) || wet(x, y, 200) || !f.level(x, y, 90) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr * 0.8);
  f.woods({ x0: -R, x1: R, y0: 2500, y1: R }, ["grass_tuft", "grass_tuft", "dry_bush"], (x, y) => grassOut(x, y) || rnd() > goldW(y) + 0.15, { count: 70, tries: 2500, spacing: 380, kit: "desert" });

  // ---- past the edges: the desert's dunes, rocks and buttes on the mesa wall and before it, glass
  // and rock out along the coast ----
  const rim = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) !== 0 || toLine(x, y, SHORE) < 300;
  f.woods({ x0: -A, x1: A, y0: R, y1: A }, ["dune_ridge", "dune_ridge", "boulder_big", "rock_cluster", "hoodoo", "butte", "dry_bush"], rim, { count: 80, tries: 3000, spacing: 700, kit: "desert" });
  f.woods({ x0: -A, x1: A, y0: -A, y1: R }, ["glass_shard", "glass_spires", "scorched_rock", "glass_crust"], rim, { count: 40, tries: 2000, spacing: 800, kit: "southsands" });

  // ---- monsters: the cape's sand, the crater's floor and rim, the mesa and its summit, the ridge,
  // the tip ----
  const busy = (x: number, y: number) => Math.hypot(x - CAMP[0], y - CAMP[1]) < 800 || Math.hypot(x - CRATER[0], y - CRATER[1]) < 450;
  f.monsterSpots(ground, IN, { step: 620, keepOut: busy, max: 50 });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "glass_desert_mage", x: CAMP[0] - 350, y: CAMP[1] - 450, face: 210, name: "อาจารย์เซเลน", title: "นักเวทเฝ้าดาวตกแห่งคราเดีย", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "violet", top: "top_lilac", bottom: "bottom_cocoa" },
      lines: [
        "ดาวดวงนั้นตกลงมาเมื่อร้อยปีก่อน ไฟในตัวมันยังไม่ดับจนถึงวันนี้ คราเดียส่งพวกเรามาเฝ้าดูมันไม่ให้คลาด",
        "ภูตเศษอุกกาบาตเกิดจากสะเก็ดของมัน มันยิ้มให้เจ้าก็จริง แต่พอใกล้ตายมันจะระเบิดใส่ ถอยออกมาให้ทัน",
        "ทรายทั้งแหลมนี้ถูกไฟหลอมจนเป็นแก้ว เดินระวังเท้าด้วย คมยิ่งกว่ามีด",
      ],
    },
    {
      id: "glass_desert_gatherer", x: 1500, y: 3500, face: 40, name: "คาริม", title: "พ่อค้าเก็บแก้วฟ้าผ่า", role: "talk",
      look: { gender: "male", hair: "", hairColor: "ink", eyes: "amber", top: "top_warrior", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ท่อแก้วฟ้าผ่าตามสันเขาทางใต้ ช่างแก้วที่บาฮามัสให้ราคาดีมาก แต่แมงป่องแก้วมันเฝ้าอยู่ทุกต้น",
        "ยอดแก้วที่สูงที่สุดอยู่บนผาแก้วทางเหนือ ตอนเย็นแดดส่องแล้วแสงหักเหเป็นสีรุ้งไปทั้งแหลม",
        "สุดปลายแหลมมีต้นไม้แก้วขึ้นเป็นดง ไม่มีใครรู้ว่ามันโตขึ้นมาเองหรือมีใครปลูก",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery: [seaSheet, glass.mesh],
    sky: "#cfd6d2",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 3350, y: 4300 },
    npcs,
    labels: [
      { x: W_EXIT[0], y: W_EXIT[1] - 250, text: "ทางไปทะเลทรายใหญ่", kind: "gate" },
      { x: CRATER[0] + 600, y: CRATER[1], text: "หลุมอุกกาบาตใหญ่" },
      { x: CAMP[0] - 300, y: CAMP[1] + 300, text: "ค่ายนักเวทเฝ้าดาวตก", kind: "small" },
      { x: CROWN[0] - 300, y: CROWN[1], text: "มงกุฎแก้วบนผา" },
      { x: STRIKE[0] + 300, y: STRIKE[1], text: "สันเขาฟ้าผ่า" },
      { x: TIP[0] + 300, y: TIP[1], text: "ดงต้นไม้แก้วปลายแหลม" },
      { x: 2200, y: 4300, text: "ทะเลทรายแก้ว", kind: "small" },
      { x: FOREST[0] + 300, y: FOREST[1], text: "ดงยอดแก้ว" },
    ],
  });
}

// ค่ายทัพอสูร (demon_camp), monsters Lv 110-120, its general Lv 122: the camp where the demon army
// gathers to march on the kingdom, on a rise over the sea south of the demon lands. The road comes
// in from the burnt villages on the west over ground burnt black, past a picket of the army (a
// banner, a brazier, stakes), to the camp:
//   - the camp rise (2.6 m) walled all round its edge by fences of great curved ribs, a gate under
//     a beast's skull at the top of the ramp on its west side and another on its north where the
//     road comes down from the demon lands;
//   - inside, an avenue between rows of black hide tents, banners and braziers of hellfire, cages
//     for the prisoners taken in the villages, stacks of the army's stores;
//   - at the avenue's end, the war-drum yard by the sea cliffs: the great drum on its dais, the
//     general's tent behind it, and there the general himself stands;
//   - in the south-west of the camp a crag (5.6 m, ramp from the avenue) where the broken ring of
//     the gate the army came through still stands, the rift in it open, the blood mages round it.
// The sea lies along the south and the east (the edge of the world); along the north the demon
// lands' black wall, the pass through it east of the middle; westward the burnt villages' land.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: west (the middle) -> burnt_villages, north (the pass) -> demon_land

import { FieldBuilder } from "./field";
import { useKits, colourways } from "./town";
import type { Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import { KIT as DEMON, smooth, band, inPoly, distTo, every, inland, faceDir, faceTo, seaSheet, tintGround, ease, fieldNoise } from "./kits/demonmarch";
import type { XY, Poly } from "./kits/demonmarch";
import { KIT as FRONTIER, BLIGHT, DARK_ROCK, rampOff, subdiv } from "./kits/frontier";
import { KIT as KRADIA } from "./kits/kradia";
import { KIT as EAST } from "./kits/eastcoast";

useKits(DEMON, FRONTIER, KRADIA, EAST);
colourways({
  frontier_blight: BLIGHT,
  frontier_dark: DARK_ROCK,
  dm_blackrock: { Eastcoast_Granite: "Demonmarch_Blight", Eastcoast_GranitePink: "Demonmarch_Blight", Eastcoast_GraniteWet: "Demonmarch_BlightSoil", Eastcoast_Weed: "Demonmarch_BlightSoil", Eastcoast_Cushion: "Demonmarch_BlightEdge", Eastcoast_Thrift: "Demonmarch_Crystal", Eastcoast_ThriftDeep: "Demonmarch_Crystal" },
  // Kradia's racks and stores taken over by the demon army: black iron, dark timber, red cloth
  dm_army: { WoodWarm: "Demonmarch_DarkWood", WoodShade: "Demonmarch_DarkWood", WoodPale: "Demonmarch_DarkWood", IronLight: "Demonmarch_IronBlack", FabricWhite: "Demonmarch_ClothDark", FabricPurple: "Demonmarch_ClothRed", Kradia_Cloth: "Demonmarch_ClothRed", GoldTrim: "Demonmarch_Rust" },
});

const R = 5500; // the walkable bounds, +-R
const A = 9000; // the ground's area, +-A

// ---- the coast: the south shore from the west edge (where the burnt villages' comes along) east,
// then north up the east side to the demon lands' wall (the land on its left) ----
const SHORE: XY[] = smooth([
  [-4400, A + 400], [-4300, 5500], [-4350, 4200], [-4150, 3000], [-4300, 1800], [-4000, 600], [-4200, -700], [-4000, -1900], [-3600, -3000],
  [-2900, -3900], [-1900, -4350], [-700, -4500], [500, -4380], [1700, -4600], [2900, -4450], [3900, -4700], [4700, -5100], [5400, -5450], [6100, -5900], [A + 400, -6600],
], 4);
const SEA: Poly = [...SHORE, [A + 400, -A - 400], [-A - 400, -A - 400], [-A - 400, A + 400]];

// ---- the levels: the demon lands' wall along the north and the pass through it; the camp rise
// (2.6 m) and the rift's crag on it (5.6 m) ----
const WALL_W: Poly = [[A, A], [4750, A], [4850, 3800], [4650, 2200], [4850, 600], [4700, -600], [A, -600]];
const WALL_E: Poly = [[A, -1500], [4750, -1500], [4900, -2800], [4650, -4000], [4700, -4700], [A, -5200]];
const CAMP: Poly = [[3000, 1400], [3100, -800], [2800, -3000], [1700, -4100], [-300, -4150], [-1800, -3600], [-2600, -2000], [-2500, -300], [-2100, 1200], [-900, 1900], [1600, 2100]];
const CRAG: Poly = [[-700, -1300], [-800, -2300], [-1400, -2700], [-1900, -2200], [-1900, -1200], [-1300, -800]];
const R_WEST = rampOff([-900, 1900], [1600, 2100], 0.36, 850, 500, [300, -1000]);
const R_NORTH = rampOff([3100, -800], [2800, -3000], 0.1, 850, 500, [300, -1000]);
const R_CRAG = rampOff([-700, -1300], [-800, -2300], 0.5, 900, 440, [-1300, -1800]);
const RAMPS = [R_WEST, R_NORTH, R_CRAG];

// ---- the ways out and the places ----
const W_EXIT: XY = [0, 5150], W_BACK: XY = [0, 4450];
const N_EXIT: XY = [5150, -1050], N_BACK: XY = [4450, -1050];
const SPAWN: XY = [60, 4300];
const DRUM: XY = [900, -3100];
const GENERAL: XY = [900, -3650]; // where the general stands, the farthest of all from the way in
const RIFT: XY = [-1350, -1800];
const PICKET: XY = [-450, 3300];
const SPY: XY = [-1900, 3500];

// ---- tracks ----
const along = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};
const climb = (r: { top: XY; bottom: XY }, inn = 420, out = 380): XY[] => [along(r.bottom, r.top, -inn), r.bottom, r.top, along(r.top, r.bottom, -out)];
const W_ROAD = [...smooth([[0, A + 300], W_EXIT, [-150, 4300], [-260, 3500], climb(R_WEST)[0]]), ...climb(R_WEST).slice(1, 3)];
const AVENUE = smooth([R_WEST.top, [150, 1100], [300, 0], [380, -1000], [560, -1900], [800, -2500]]);
const N_ROAD = [...smooth([[A + 300, -1050], N_EXIT, N_BACK, climb(R_NORTH)[0]]), ...climb(R_NORTH).slice(1, 3), ...smooth([R_NORTH.top, [2300, -1080], [1400, -1000], [380, -1000]])];
const TO_RIFT = [...smooth([[470, -1450], climb(R_CRAG, 300)[0]]), ...climb(R_CRAG, 300, 300).slice(1)];
const PATHS: XY[][] = [W_ROAD, AVENUE, N_ROAD, TO_RIFT];

// how black the ground is: burnt in the west (the villages' fires came this far), black under the
// camp and along the army's road from the pass
function blackAt(x: number, y: number): number {
  const camp = inPoly(CAMP, x, y) ? 1 : 1 - ease(0, 1400, Math.min(...CAMP.map(([cx, cy]) => Math.hypot(x - cx, y - cy))) - 900);
  const army = 1 - ease(500, 1800, distTo(N_ROAD, x, y));
  const east = 1 - ease(-500, 3500, y);
  return Math.min(1, Math.max(camp * 0.9, army * 0.8, east * 0.7) * (0.8 + 0.3 * fieldNoise(x, y, 11)));
}

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(531, {
    hills: [
      { x: -2200, y: 3400, r: 1300, h: 130 }, { x: 1800, y: 3600, r: 1200, h: 110 }, { x: 3800, y: 2400, r: 900, h: 120 },
      { x: -3300, y: 600, r: 800, h: 90 }, { x: 3900, y: -3200, r: 800, h: 100 }, { x: -1000, y: 3700, r: 600, h: -70 },
      { x: 1400, y: 1600, r: 700, h: 60 },
      // the burnt villages' ground rolling on past the west edge
      { x: -1500, y: 7700, r: 2600, h: 200 }, { x: 2300, y: 7500, r: 2000, h: 160 },
    ],
    plateaus: [
      { poly: subdiv(WALL_W), h: 650 },
      { poly: subdiv(WALL_E), h: 650 },
      { poly: subdiv(CAMP), h: 260, ramps: [R_WEST, R_NORTH] },
      { poly: subdiv(CRAG), h: 560, ramps: [R_CRAG] },
    ],
    rock: "Frontier_CliffDark",
  });
  const { put, rnd } = f;

  // ---- the ground: burnt grass in the west going black toward the camp, black under it and along
  // the army's road, dark sand on the shore ----
  const roads = [band(W_ROAD, 480), band(AVENUE, 520), band(N_ROAD, 480), band(TO_RIFT, 420)];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: [SEA], base: "steppe", road: [0.6, 0.48, 0.48] });
  const mix = (a: number[], b: number[], t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // (factors on the steppe's linear colour: burnt grass as the villages' east edge has it, the
  // camp's trodden black earth, dark sand)
  const BURNT = [0.36, 0.32, 0.56], BLACK = [0.16, 0.12, 0.42], SAND = [0.42, 0.38, 1.3];
  tintGround(ground, (x, y) => mix(mix(BURNT, BLACK, blackAt(x, y)), SAND, (1 - ease(250, 900, distTo(SHORE, x, y))) * 0.9), 0.35);

  // ---- the sea, the shore closed ----
  const sea = seaSheet([...inland(SHORE, 200), [A + 400, -30000], [-30000, -30000], [-30000, A + 400]]);
  const sea2 = seaSheet([[A + 400, -30000], [30000, -30000], [30000, -6600], [A + 400, -6600]]);
  f.blockBand(inland(SHORE.filter(([x, y]) => Math.abs(x) < R + 900 && Math.abs(y) < R + 900), -280), 520, { kind: "sea" });

  // ---- the ways out ----
  f.exit("burnt_villages", W_EXIT, W_BACK);
  f.exit("demon_land", N_EXIT, N_BACK);

  // ---- placing things clear of each other, the tracks, the ramps and the water ----
  const taken: [number, number, number][] = [[W_EXIT[0], W_EXIT[1], 450], [N_EXIT[0], N_EXIT[1], 450]];
  const onTrack = (x: number, y: number, m: number) => [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const nearRampAt = (x: number, y: number, m: number) => RAMPS.some((r) => distTo([r.top, r.bottom], x, y) < r.width / 2 + m);
  const free = (x: number, y: number, r: number) => !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r);
  const wet = (x: number, y: number, m: number) => inPoly(SEA, x, y) || distTo(SHORE, x, y) < m;
  const fits = (x: number, y: number, r: number, m = r) => f.level(x, y, r) && !onTrack(x, y, m) && !nearRampAt(x, y, m) && free(x, y, r) && !wet(x, y, r + 120);
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
  const inCamp = (x: number, y: number) => inPoly(CAMP, x, y);
  const TENT: SolidSpec[] = [{ kind: "tent", x: 0, y: 0, r: 230 }];
  const CAGE: SolidSpec[] = [{ kind: "cage", x: 0, y: 0, w: 300, d: 290, rot: 0 }];
  const BANNER: SolidSpec[] = [{ kind: "post", x: 0, y: 0, r: 55 }];
  const BRAZIER: SolidSpec[] = [{ kind: "fire", x: 0, y: 0, r: 60 }];
  const GATE: SolidSpec[] = [{ kind: "post", x: 0, y: -330, r: 85 }, { kind: "post", x: 0, y: 330, r: 85 }];

  // ---- the camp's fence: ribs along the rise's edge, 1.7 m in from it, the gates left open ----
  const gates = [R_WEST.top, R_NORTH.top];
  for (let i = 0; i < CAMP.length; i++) {
    const a = CAMP[i], b = CAMP[(i + 1) % CAMP.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
    let nx = -uy, ny = ux; // out of the camp
    if (inPoly(CAMP, (a[0] + b[0]) / 2 + nx * 60, (a[1] + b[1]) / 2 + ny * 60)) [nx, ny] = [-nx, -ny];
    const n = Math.max(1, Math.round((L - 300) / 400));
    for (let k = 0; k < n; k++) {
      const t = 150 + ((L - 300) * (k + 0.5)) / n, at: XY = [a[0] + ux * t - nx * 170, a[1] + uy * t - ny * 170];
      if (gates.some((g) => Math.hypot(g[0] - at[0], g[1] - at[1]) < 520)) continue;
      put("demonmarch:bone_fence", at, faceDir(nx, ny), { sy: (L - 300) / n / 400, solid: [{ kind: "fence", x: 10, y: 0, w: 60, d: 410, rot: 0 }] });
      taken.push([at[0], at[1], 210]);
    }
  }
  place("demonmarch:bone_gate", along(R_WEST.top, R_WEST.bottom, -60), faceDir(-0.08, 1), 420, { solid: GATE });
  place("demonmarch:bone_gate", along(R_NORTH.top, R_NORTH.bottom, -60), faceDir(0.99, -0.14), 420, { solid: GATE });
  // stakes outside the fence where the ground leads up to it
  for (const [at, h] of [[[-1400, 2550], 80], [[1300, 2750], 95], [[2400, 2500], 100], [[3600, 900], 175], [[3550, -2400], 190]] as [XY, number][]) tryPlace("frontier:stake_row", at, h, 220, { colours: "frontier_dark" });

  // ---- the avenue: rows of tents, banners and braziers ----
  const TENTS: XY[] = [
    [1100, 900], [-750, 700], [1300, -300], [-850, -350], [1550, -1500], [2200, 300], [2250, -1900], [-1500, 500], [2300, 1400], [-1650, -400],
    [-1800, -3000], [-900, -3300], [-2000, 1100], [1350, 1600], [2500, -900], [-300, -3500],
  ];
  TENTS.forEach((t, i) => tryPlace("demonmarch:black_tent", t, faceTo(t, [300, t[1] < -1000 ? -1500 : t[1]]) + (i % 3) * 8, 300, { s: 0.85 + (i % 3) * 0.08, solid: TENT }));
  [[-260, 1500], [560, 1450], [-120, 350], [720, 300], [0, -650], [800, -700], [180, -1700], [960, -1650]].forEach(([x, y], i) =>
    tryPlace(i % 4 < 2 ? "demonmarch:demon_banner" : "demonmarch:hell_brazier", [x, y], faceDir(1, 0), 110, { solid: i % 4 < 2 ? BANNER : BRAZIER }));
  for (const [at, h] of [[[1950, 700], 20], [[-500, -1100], 80], [[2600, -800], 40], [[-1300, 1300], 140]] as [XY, number][]) tryPlace("kradia:weapon_rack", at, h, 130, { colours: "dm_army" });
  for (const [at, h] of [[[2000, -400], 10], [[-1100, -1000], 60], [[1900, 1700], 30]] as [XY, number][]) tryPlace("kradia:supplies", at, h, 150, { colours: "dm_army" });
  for (const at of [[2100, -700], [2150, -1000], [-1150, -1250], [1700, 2000]] as XY[]) tryPlace("common:crate", at, rnd() * 90, 70, { colours: "dm_army" });

  // ---- the war-drum yard: the drum, the general's tent, the prisoners' cages ----
  place("demonmarch:war_drum", DRUM, faceTo(DRUM, [800, -2300]), 420, { solid: ring(330, "drum") });
  place("demonmarch:black_tent", [1900, -2800], faceTo([1900, -2800], DRUM), 420, { s: 1.4, solid: TENT });
  for (const [x, y] of [[300, -2650], [1550, -2600], [250, -3600], [1550, -3650]] as XY[]) tryPlace("demonmarch:hell_brazier", [x, y], faceTo([x, y], DRUM), 100, { s: 1.1, solid: BRAZIER });
  for (const [x, y] of [[-200, -3000], [1900, -3500]] as XY[]) tryPlace("demonmarch:demon_banner", [x, y], faceTo([x, y], DRUM), 100, { s: 1.15, solid: BANNER });
  for (const [at, h] of [[[-150, -2250], 70], [[1850, -2250], 200], [[-450, -3550], 100]] as [XY, number][]) tryPlace("demonmarch:prisoner_cage", at, h, 230, { solid: CAGE });
  tryPlace("frontier:beast_bones", [1300, -2300], 160, 300, { s: 0.55, solid: "none" });

  // ---- the rift on its crag ----
  place("demonmarch:rift_shard", RIFT, faceDir(1, 0), 420, { s: 0.8, solid: [{ kind: "rift", x: 0, y: 0, w: 120, d: 640, rot: 0 }, { kind: "rock", x: 0, y: 360, r: 70 }, { kind: "rock", x: 0, y: -360, r: 70 }] });
  for (const [x, y, ref] of [[-1100, -2350, "demonmarch:crystal_cluster"], [-1700, -1350, "demonmarch:crystal_cluster"], [-950, -1250, "demonmarch:hell_brazier"], [-1700, -2300, "demonmarch:blight_boulder"]] as [number, number, string][])
    tryPlace(ref, [x, y], rnd() * 360, 140, { s: 0.8, solid: ref.endsWith("brazier") ? BRAZIER : ring(70) });

  // ---- the picket on the road from the villages; the spy's rocks ----
  place("demonmarch:demon_banner", [PICKET[0] - 500, PICKET[1] - 150], faceDir(0, 1), 100, { solid: BANNER });
  place("demonmarch:hell_brazier", [PICKET[0] + 450, PICKET[1] - 200], faceDir(0, 1), 100, { solid: BRAZIER });
  tryPlace("frontier:stake_row", [PICKET[0] - 900, PICKET[1] + 200], 80, 220, { colours: "frontier_dark" });
  tryPlace("frontier:stake_row", [PICKET[0] + 900, PICKET[1] + 100], 100, 220, { colours: "frontier_dark" });
  for (const [at, s] of [[[SPY[0] - 250, SPY[1] - 300], 0.8], [[SPY[0] + 200, SPY[1] - 380], 0.6]] as [XY, number][]) place("frontier:boulder", at, rnd() * 360, 150 * s, { s, colours: "frontier_dark", solid: ring(110 * s) });

  // ---- the army's road down from the pass: banners, braziers, crystals and cracks ----
  for (const [x, y] of [[4200, -500], [4200, -1600]] as XY[]) tryPlace("demonmarch:demon_banner", [x, y], faceDir(-1, 0), 100, { solid: BANNER });
  for (const [x, y] of [[3500, -500], [3550, -1650]] as XY[]) tryPlace("demonmarch:hell_brazier", [x, y], faceDir(-1, 0), 100, { solid: BRAZIER });
  for (const [x, y, s] of [[4300, 400, 0.45], [4200, -2600, 0.5], [3700, 1800, 0.35]] as number[][]) tryPlace("frontier:dark_crystal", [x, y], rnd() * 360, 220, { s, solid: ring(100 * s + 40, "crystal") });
  for (const [x, y] of [[3800, 200], [3700, -2900], [4000, -3900]] as XY[]) tryPlace("frontier:glow_crack", [x, y], rnd() * 360, 300, { s: 0.6, solid: "none" });

  // ---- over the land: burnt trees in the west, dead trees, bones and black rocks nearer the camp;
  // inside the camp the trodden ground, a few bones and scorch ----
  for (let x = -R + 300; x < R; x += 560)
    for (let y = -R + 300; y < R; y += 560) {
      const px = x + (rnd() - 0.5) * 400, py = y + (rnd() - 0.5) * 400;
      if (!inBox(px, py, 200) || !fits(px, py, 160, 300) || Math.hypot(px - SPY[0], py - SPY[1]) < 700) continue;
      const k = blackAt(px, py), camp = inCamp(px, py);
      if (rnd() > (camp ? 0.18 : 0.45)) continue;
      const q = rnd();
      const ref = camp ? (q < 0.4 ? "frontier:beast_bones" : q < 0.7 ? "frontier:rock_cluster" : "frontier:rubble_pile")
        : k < 0.55 ? (q < 0.45 ? "demonmarch:charred_tree" : q < 0.6 ? "frontier:stump" : q < 0.75 ? "frontier:boulder" : "frontier:dead_tree")
          : q < 0.4 ? "frontier:dead_tree" : q < 0.55 ? "frontier:dark_crystal" : q < 0.75 ? "frontier:boulder" : "frontier:beast_bones";
      const r = ref.endsWith("bones") ? 330 : ref.endsWith("tree") ? 230 : 160;
      if (!fits(px, py, r, r + 100)) continue;
      const s = ref.endsWith("bones") ? 0.4 + rnd() * 0.25 : ref.endsWith("crystal") ? 0.3 + rnd() * 0.25 : 0.65 + rnd() * 0.4;
      const solid: SolidSpec[] | "none" = ref.endsWith("bones") || ref.endsWith("rubble_pile") ? "none" : ref.endsWith("tree") ? ring(38 * s, "tree") : ref.endsWith("crystal") ? ring(90 * s + 30, "crystal") : ring(95 * s);
      place(ref, [px, py], rnd() * 360, r * s, { s, solid, colours: ref.endsWith("boulder") || ref.endsWith("rock_cluster") ? "frontier_dark" : undefined });
    }
  for (let i = 0; i < 260; i++) {
    const x = -R + 200 + rnd() * (2 * R - 400), y = -R + 200 + rnd() * (2 * R - 400);
    if (onTrack(x, y, 200) || nearRampAt(x, y, 120) || wet(x, y, 250) || !f.level(x, y, 120) || !free(x, y, 40)) continue;
    const k = blackAt(x, y);
    if (k > 0.5 && rnd() < 0.22) put("frontier:scorch_mark", [x, y], rnd() * 360, { s: 0.5 + rnd() * 0.5, colours: k > 0.85 && rnd() < 0.5 ? "frontier_blight" : undefined, solid: "none" });
    else put("demonmarch:ash_grass", [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.5, solid: "none" });
  }

  // ---- the shore: black rocks along the water, stacks out at sea ----
  for (const { p, d } of every(SHORE, 380)) {
    if (Math.abs(p[0]) > R + 1500 || Math.abs(p[1]) > R + 1500 || rnd() < 0.35) continue;
    put("eastcoast:shore_rocks", [p[0] - d[1] * 110, p[1] + d[0] * 110], faceDir(-d[1], d[0]) + rnd() * 40, { s: 0.55 + rnd() * 0.5, solid: "none", z: -6, colours: "dm_blackrock" });
  }
  for (const [x, y, h, s] of [[-6200, 1500, 30, 0.8], [-5900, -2600, 150, 0.9], [-3600, -6000, 240, 0.8], [1200, -6100, 90, 0.75], [3800, -6400, 300, 0.7], [-6500, 4200, 200, 0.65]] as number[][])
    put("eastcoast:sea_stack", [x, y], h, { s, solid: "none", z: -14, colours: "dm_blackrock" });

  // ---- past the edges: the wall's top with dead trees and crystals, burnt trees to the west ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const track = (x: number, y: number) => PATHS.some((p) => distTo(p, x, y) < 480);
  f.woods({ x0: 4600, x1: A, y0: -A, y1: A }, ["dead_tree", "dead_tree", "dark_crystal"], (x, y) => inside(x, y) || track(x, y) || wet(x, y, 400) || Math.abs(y + 1050) < 550, { count: 120, spacing: 540, kit: "frontier", tries: 4000 });
  f.woods({ x0: -A, x1: 4600, y0: R - 500, y1: A }, ["charred_tree", "charred_tree", "mutant_tree"], (x, y) => inside(x, y) || track(x, y) || wet(x, y, 400), { count: 70, spacing: 560, kit: "demonmarch", tries: 3000 });
  f.woods({ x0: -A, x1: 4600, y0: R - 500, y1: A }, ["dead_tree", "red_maple"], (x, y) => inside(x, y) || track(x, y) || wet(x, y, 400), { count: 50, spacing: 600, kit: "frontier", tries: 2000 });

  // ---- monsters: round the camp and in it, the rift's crag; the general at the drum, the
  // farthest spot of all from the way in (none kept farther) ----
  const farthest = Math.hypot(GENERAL[0] - SPAWN[0], GENERAL[1] - SPAWN[1]) - 150;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, {
    step: 800, max: 50,
    keepOut: (x, y) => Math.hypot(x - SPAWN[0], y - SPAWN[1]) > farthest || Math.hypot(x - SPY[0], y - SPY[1]) < 900 || Math.hypot(x - DRUM[0], y - DRUM[1]) < 700 || wet(x, y, 300) || x > 4600,
  });
  f.spots.push({ x: GENERAL[0], y: GENERAL[1] });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "demon_camp_spy", x: SPY[0] + 60, y: SPY[1] - 120, face: faceTo(SPY, [0, 1900]), name: "ไรเวน", title: "สายลับแห่งคราเดีย", role: "talk",
      look: { gender: "male", hair: "", hairColor: "ink", eyes: "violet", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "ก้มลงหน่อย ยามบนรั้วกระดูกมันตาไวนัก ข้าเฝ้าค่ายนี้มาสิบสองคืนแล้ว",
        "ทุกคืนกลองศึกจะดังสามครั้ง แล้วทหารใหม่ก็เดินลงมาจากช่องเขาทางเหนือไม่ขาดสาย แม่ทัพเขาเหล็กยืนคุมอยู่ข้างกลองตลอด",
        "บนเนินหินทางใต้ของค่ายมีวงประตูที่แตกอยู่ แสงม่วงในนั้นยังไม่ดับ จอมเวทเลือดพวกนั้นกำลังพยายามเปิดมันให้กว้างกว่าเดิม",
      ],
    },
    {
      id: "demon_camp_escapee", x: -3550, y: 2400, face: 0, name: "ทอร์บิน", title: "ชาวประมงที่หนีออกจากกรง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "teal", top: "top_adventurer_teal", bottom: "bottom_adventurer_cocoa" },
      lines: [
        "ข้าแงะกุญแจกรงหนีออกมาตอนที่พวกมันตีกลองศึก เสียงดังจนไม่มีใครได้ยินเสียงเหล็ก",
        "ยังมีคนจากหมู่บ้านของข้าเหลืออยู่ในกรงข้างลานกลองอีกหลายคน ได้โปรดช่วยพวกเขาด้วย",
        "อย่าเดินเลียบหน้าผาทางทะเล ข้างล่างนั่นมีแต่หินแหลม",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery: [sea, sea2],
    sky: "#2a1e22",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: SPAWN[0], y: SPAWN[1] },
    npcs,
    labels: [
      { x: W_EXIT[0], y: W_EXIT[1] - 250, text: "ทางไปหมู่บ้านร้างชายแดน", kind: "gate" },
      { x: N_EXIT[0] - 250, y: N_EXIT[1], text: "ทางไปดินแดนอสูร", kind: "gate" },
      { x: 300, y: 2300, text: "ประตูค่ายหัวกะโหลก" },
      { x: 400, y: 600, text: "ค่ายทัพอสูร" },
      { x: DRUM[0] - 500, y: DRUM[1] + 400, text: "ลานกลองศึก" },
      { x: RIFT[0] + 500, y: RIFT[1] + 300, text: "เศษประตูมิติ" },
      { x: -300, y: -2300, text: "กรงเชลย", kind: "small" },
      { x: 3300, y: -1000, text: "ประตูค่ายด้านเหนือ", kind: "small" },
      { x: PICKET[0] + 200, y: PICKET[1] + 300, text: "ด่านหน้าค่าย", kind: "small" },
      { x: 4200, y: -1050, text: "ช่องเขาสู่ดินแดนอสูร", kind: "small" },
    ],
  });
}

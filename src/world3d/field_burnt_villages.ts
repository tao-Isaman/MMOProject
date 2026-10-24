// หมู่บ้านร้างชายแดน (burnt_villages), monsters Lv 98-108: the farming country south of the border
// line, where the demons came through on their way round Kradia's ramparts and burnt everything
// they passed. The road comes down from the border line through a pass in the ridge along the
// north edge, into what was the village round its well green: cottages burnt to their stone walls,
// chimneys standing, garden walls raked by claws, charred fences and trees. From the green:
//   - a road west through the fields left to die and into the border woods' red maples;
//   - a road east past the burnt houses to the demon army's camp;
//   - up a ramp onto the church hill (3.5 m, north-west): the chapel with its roof burnt and fallen
//     in, its tower still standing, and beside it the new graveyard the priest is still digging;
//   - up a ramp onto the farm terrace (3 m, north-east): the burnt barn, its fields and its
//     orchard burnt in rows;
//   - along the east road a farm the demons burnt on their way through;
//   - down to the fishermen's hamlet on the south shore: three more burnt houses, the jetty
//     burnt to its posts, boats burnt on the beach.
// The sea lies all along the south (the shore of grey sand and rocks); the border woods' ward hill
// ends just inside the west edge, wooded to its cliffs; the ridge along the north
// carries on into the border line's mountain wall, the pass through it a little west of the
// middle; the west edge goes on into the border woods, the east into the burnt ground before the
// demon camp.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: north (the pass) -> border_line, west (south of the middle) -> border_woods,
//   east (the middle) -> demon_camp

import { FieldBuilder } from "./field";
import { useKits, colourways } from "./town";
import type { Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import { KIT as DEMON, smooth, band, inPoly, distTo, nearestOn, every, inland, faceDir, faceTo, seaSheet, tintGround, ease, fieldNoise } from "./kits/demonmarch";
import type { XY, Poly } from "./kits/demonmarch";
import { KIT as FRONTIER, BLIGHT, rampOff, subdiv } from "./kits/frontier";
import { KIT as KRADIA } from "./kits/kradia";
import { KIT as EAST } from "./kits/eastcoast";

useKits(DEMON, FRONTIER, KRADIA, EAST);
colourways({
  frontier_blight: BLIGHT,
  // timber burnt black: the fishermen's jetty and boats, the wagons
  dm_charred: { Eastcoast_Drift: "Demonmarch_Char", Eastcoast_DriftDark: "Demonmarch_Char", Eastcoast_Hull: "Demonmarch_Char", Eastcoast_HullRed: "Demonmarch_Char", WoodGrey: "Demonmarch_Char", Eastcoast_Tar: "Demonmarch_Soot", Eastcoast_Net: "Demonmarch_Soot", Eastcoast_Float: "Demonmarch_Soot", WoodWarm: "Demonmarch_Char", WoodShade: "Demonmarch_Char", FabricWhite: "Demonmarch_Soot", FabricRed: "Demonmarch_Soot", Eastcoast_Timber: "Demonmarch_Char", Eastcoast_Canvas: "Demonmarch_Soot", Eastcoast_Sack: "Demonmarch_Ash" },
  dm_greyrock: { Eastcoast_Granite: "Demonmarch_FieldStoneDark", Eastcoast_GranitePink: "Demonmarch_FieldStoneDark", Eastcoast_Thrift: "Demonmarch_DeadStalk", Eastcoast_ThriftDeep: "Demonmarch_DeadStalkDark" },
});

const R = 5500; // the walkable bounds, +-R
const A = 9000; // the ground's area, +-A

// ---- the shore along the south, west to east (the land on its left) ----
const SHORE: XY[] = smooth([
  [-6000, A + 400], [-5450, 6200], [-5150, 5400], [-4900, 4400], [-4500, 3300], [-4300, 2200], [-4450, 1000], [-4250, -200], [-3950, -1300],
  [-4100, -2400], [-4400, -3300], [-4300, -4400], [-4300, -5500], [-4400, -6600], [-4600, -A - 400],
], 4);
const SEA: Poly = [...SHORE, [-A - 400, -A - 400], [-A - 400, A + 400]];

// ---- the levels: the ridge along the north (the border line's mountain wall), the pass through
// it; the church hill (3.5 m) and the farm terrace (3 m) ----
const RIDGE_W: Poly = [[A, A], [4700, A], [4800, 4000], [4600, 2600], [4850, 1400], [A, 1400]];
const RIDGE_E: Poly = [[A, 400], [4800, 400], [4650, -900], [4900, -2400], [4700, -3900], [4850, -A], [A, -A]];
const CHURCH: Poly = [[3100, 2800], [2900, 4000], [1900, 4500], [800, 4100], [600, 3000], [1000, 2100], [2200, 1900]];
const FARM: Poly = [[3600, -1700], [3900, -3000], [3500, -4300], [2300, -4600], [1400, -3900], [1300, -2600], [2000, -1700]];
// the east end of the border woods' ward hill, coming in over the west edge (wooded, no way up)
const WARD_END: Poly = [[3600, A], [3700, 6200], [3300, 5150], [2200, 5100], [1000, 5150], [-300, 5000], [-1100, 5300], [-1300, 6300], [-1100, A]];
const R_CHURCH = rampOff([1000, 2100], [2200, 1900], 0.45, 1100, 460, [1950, 3200]);
const R_FARM = rampOff([1400, -3900], [1300, -2600], 0.5, 1000, 460, [2500, -3100]);
const RAMPS = [R_CHURCH, R_FARM];

// ---- the ways out and the places ----
const N_EXIT: XY = [5150, 900], N_BACK: XY = [4450, 900];
const W_EXIT: XY = [-2800, 5150], W_BACK: XY = [-2750, 4450];
const E_EXIT: XY = [0, -5150], E_BACK: XY = [50, -4450];
const GREEN: XY = [700, 450];
const WELL: XY = [1300, -60];
const CHAPEL: XY = [2150, 3250];
const GRAVES: XY = [2450, 2350];
const BARN: XY = [2650, -3050];
const HAMLET: XY = [-2850, -1750];

// ---- tracks ----
const along = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};
const climb = (r: { top: XY; bottom: XY }, inn = 400, out = 380): XY[] => [along(r.bottom, r.top, -inn), r.bottom, r.top, along(r.top, r.bottom, -out)];
const ROAD_N = smooth([[A + 300, 900], N_EXIT, [4300, 950], [3400, 820], [2400, 660], [1500, 560], GREEN]);
const ROAD_E = smooth([GREEN, [300, -600], [200, -1800], [380, -3000], [120, -4200], E_EXIT, [0, -A - 300]]);
const ROAD_W = smooth([GREEN, [-100, 1300], [-900, 2300], [-1800, 3300], [-2500, 4300], W_EXIT, [-2800, A + 300]]);
const TO_CHURCH = [...smooth([[1500, 560], climb(R_CHURCH)[0]]), ...climb(R_CHURCH).slice(1), ...smooth([climb(R_CHURCH)[3], [1700, 2650], [1850, 2900]])];
const TO_FARM = [...smooth([[380, -3000], climb(R_FARM)[0]]), ...climb(R_FARM).slice(1), ...smooth([climb(R_FARM)[3], [2000, -3150], [2150, -3100]])];
const TO_HAMLET = smooth([[200, -1800], [-900, -1700], [-1900, -1650], [-2550, -1700], [-3300, -1850], [-3750, -1950]]);
const PATHS: XY[][] = [ROAD_N, ROAD_E, ROAD_W, TO_CHURCH, TO_FARM, TO_HAMLET];

// how much a point is burnt black: round the houses, the barn and the hamlet, along the roads the
// demons took, less out in the west where the border woods begin
const FIRES: [number, number, number][] = [[GREEN[0], GREEN[1], 2200], [HAMLET[0], HAMLET[1], 1500], [BARN[0], BARN[1], 1300], [CHAPEL[0], CHAPEL[1], 1200], [400, -2400, 1300]];
function burntAt(x: number, y: number): number {
  let k = 0;
  for (const [fx, fy, fr] of FIRES) k = Math.max(k, 1 - ease(fr * 0.35, fr, Math.hypot(x - fx, y - fy)));
  // (and the grass all over burnt in patches where the fire ran through it)
  const east = ease(-2500, -5200, y) * 0.6, patches = ease(0.5, 0.75, fieldNoise(x * 1.6, y * 1.6, 5)) * 0.7;
  return Math.min(1, Math.max(k, east, patches) * (0.75 + 0.35 * fieldNoise(x, y, 7)) * (1 - 0.7 * ease(3800, 5400, y)));
}

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(530, {
    hills: [
      { x: -1500, y: 2600, r: 1300, h: 120 }, { x: 3300, y: -700, r: 900, h: 140 }, { x: -2000, y: -3600, r: 1000, h: 110 },
      { x: 900, y: -1300, r: 600, h: -80 }, { x: -800, y: -3500, r: 900, h: 90 }, { x: 3200, y: 1300, r: 700, h: 90 },
      { x: -600, y: 4400, r: 1000, h: 130 }, { x: -2700, y: 900, r: 800, h: 70 },
      // the border woods' ground rolling on past the west edge
      { x: -1500, y: 7700, r: 2600, h: 240 }, { x: 2200, y: 7600, r: 2000, h: 200 },
    ],
    plateaus: [
      { poly: subdiv(RIDGE_W), h: 600 },
      { poly: subdiv(RIDGE_E), h: 600 },
      { poly: subdiv(CHURCH), h: 350, ramps: [R_CHURCH] },
      { poly: subdiv(FARM), h: 300, ramps: [R_FARM] },
      { poly: subdiv(WARD_END), h: 300 },
    ],
    rock: "Demonmarch_CliffAsh",
  });
  const { put, rnd } = f;

  // ---- the ground: dry grass, warmer under the border woods in the west, burnt black round the
  // houses and along the demons' way, grey sand along the shore ----
  const roads = [band(ROAD_N, 470), band(ROAD_E, 460), band(ROAD_W, 450), band(TO_CHURCH, 410), band(TO_FARM, 400), band(TO_HAMLET, 400)];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: [SEA], base: "steppe", road: [0.56, 0.47, 0.44] });
  const mix = (a: number[], b: number[], t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // (factors on the steppe's linear colour: trampled dry grass, the border woods' warm leaf-litter
  // floor, burnt black, grey sand)
  const DRY = [0.5, 0.46, 1.15], WOODS = [0.74, 0.52, 0.62], BURNT = [0.22, 0.19, 0.6], SAND = [0.57, 0.52, 1.7];
  tintGround(ground, (x, y) => {
    const w = ease(3300, 5200, y), c = mix(mix(DRY, WOODS, w), BURNT, burntAt(x, y) * 0.85);
    return mix(c, SAND, (1 - ease(250, 900, distTo(SHORE, x, y))) * 0.9);
  }, 0.4);

  // ---- the sea: past the horizon, the shore closed all along ----
  const sea = seaSheet([...inland(SHORE, 200), [-30000, -A - 400], [-30000, 30000], [-6000, 30000]]);
  f.blockBand(inland(SHORE.filter(([x, y]) => Math.abs(x) < R + 900 && Math.abs(y) < R + 900), -280), 520, { kind: "sea" });

  // ---- the ways out ----
  f.exit("border_line", N_EXIT, N_BACK);
  f.exit("border_woods", W_EXIT, W_BACK);
  f.exit("demon_camp", E_EXIT, E_BACK);

  // ---- placing things clear of each other, the tracks, the ramps and the water ----
  const taken: [number, number, number][] = [[N_EXIT[0], N_EXIT[1], 450], [W_EXIT[0], W_EXIT[1], 450], [E_EXIT[0], E_EXIT[1], 450]];
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
  // the heading that turns a piece's front to the nearest point of a track
  const toRoad = (at: XY, road: XY[]) => faceTo(at, nearestOn(road, at[0], at[1]).q);
  // a point `d` out from a piece at `at` turned `h`, `side` to its left (its own -X is its front)
  const rel = (at: XY, h: number, fx: number, fy: number): XY => {
    const a = (h * Math.PI) / 180;
    return [at[0] + fx * Math.cos(a) - fy * Math.sin(a), at[1] + fx * Math.sin(a) + fy * Math.cos(a)];
  };
  // a burnt cottage's walls (its own frame: walls at x = +-300, y = +-410), the chimney's foot
  const HOUSE_SOLID: SolidSpec[] = [
    { kind: "wall", x: -278, y: 0, w: 44, d: 820, rot: 0 }, { kind: "wall", x: 278, y: 0, w: 44, d: 820, rot: 0 },
    { kind: "wall", x: 0, y: -388, w: 600, d: 44, rot: 0 }, { kind: "wall", x: 0, y: 388, w: 600, d: 44, rot: 0 },
    { kind: "chimney", x: 0, y: 440, w: 130, d: 80, rot: 0 },
  ];
  const homes: XY[] = [];
  const house = (at: XY, h: number, s = 1) => {
    place("demonmarch:burnt_house", at, h, 560 * s, { s, solid: HOUSE_SOLID });
    homes.push(at);
  };

  // ---- the pass from the border line: Kradia's warning, a burnt-out cart ----
  place("frontier:signpost", [4500, 1500], faceDir(-1, 0), 60, { solid: ring(25, "post") });
  place("kradia:barricade", [4300, 300], faceDir(-1, 0.3), 220);
  tryPlace("eastcoast:broken_wagon", [3800, 1650], 160, 220, { colours: "dm_charred" });
  tryPlace("demonmarch:charred_tree", [3900, -300], 20, 200, { solid: ring(36, "tree") });

  // ---- the village round the well green ----
  place("demonmarch:burnt_well", WELL, 30, 220, { solid: ring(110, "well") });
  const HOUSES: [XY, XY[]][] = [
    [[2150, 1550], ROAD_N], [[2250, -650], ROAD_N], [[-80, 2550], ROAD_W], [[-550, 350], ROAD_W], [[1050, -1800], ROAD_E], [[-750, -1100], ROAD_E], [[3150, 2100], ROAD_N],
  ];
  HOUSES.forEach(([at, road], i) => house(at, toRoad(at, road) + (i % 2 ? 4 : -6), i === 6 ? 0.9 : 1));
  // garden walls raked by claws, burnt fences
  for (const [at, h] of [[[1500, 1100], 30], [[2850, -200], 100], [[-300, 1500], 60], [[200, -1200], 0], [[1700, -1200], 90]] as [XY, number][]) tryPlace("demonmarch:claw_wall", at, h, 230, { solid: [{ kind: "wall", x: 0, y: 0, w: 50, d: 400, rot: 0 }] });
  for (const [at, h] of [[[2700, 1000], 15], [[2950, 600], 5], [[-700, 900], 70], [[1500, -2400], 95], [[-1300, -700], 40], [[600, 1900], 120]] as [XY, number][]) tryPlace("demonmarch:burnt_fence", at, h, 220, { solid: "none" });
  for (const [at, h] of [[[1700, 200], 40], [[100, -150], 200], [[2600, -1300], 120], [[-300, -1900], 80]] as [XY, number][]) tryPlace("frontier:scorch_mark", at, h, 200, { s: 1.1, solid: "none" });
  for (const [ref, at, h] of [["eastcoast:broken_wagon", [1800, -250], 70], ["common:crate", [1600, 300], 20], ["common:crate", [800, -900], 50], ["frontier:rubble_pile", [-400, 900], 30], ["frontier:battle_relics", [1100, 1300], 120]] as [string, XY, number][])
    tryPlace(ref, at, h, 170, { colours: ref.includes("wagon") ? "dm_charred" : undefined });

  // ---- the church hill: the chapel, the new graveyard, the priest ----
  place("demonmarch:ruined_chapel", CHAPEL, faceTo(CHAPEL, R_CHURCH.top) + 8, 1000, {
    s: 0.9,
    solid: [
      { kind: "wall", x: 40, y: -352, w: 1200, d: 60, rot: 0 }, { kind: "wall", x: 40, y: 352, w: 1200, d: 60, rot: 0 },
      { kind: "wall", x: 613, y: 0, w: 60, d: 760, rot: 0 }, { kind: "tower", x: -730, y: 0, w: 340, d: 400, rot: 0 },
      { kind: "wall", x: 760, y: 0, w: 260, d: 520, rot: 0 },
    ],
  });
  place("demonmarch:fresh_graves", GRAVES, faceTo(GRAVES, CHAPEL) + 180, 520, {
    solid: [{ kind: "graves", x: -45, y: 0, w: 430, d: 780, rot: 0 }, { kind: "pits", x: 330, y: 0, w: 300, d: 720, rot: 0 }, { kind: "post", x: -300, y: -360, r: 20 }],
  });
  for (const [ref, at, h] of [["demonmarch:charred_tree", [1300, 3600], 0], ["demonmarch:charred_tree", [2800, 3700], 120], ["demonmarch:claw_wall", [1300, 2700], 60], ["demonmarch:claw_wall", [2800, 2900], 100], ["flora:AutumnTree", [1100, 3200], 20]] as [string, XY, number][])
    tryPlace(ref, at, h, 220, { solid: ref.endsWith("tree") ? ring(36, "tree") : ref.endsWith("wall") ? [{ kind: "wall", x: 0, y: 0, w: 50, d: 400, rot: 0 }] : "auto" });

  // ---- the farm terrace: the barn, its fields ----
  place("demonmarch:burnt_barn", BARN, faceTo(BARN, R_FARM.top), 650, {
    solid: [
      { kind: "wall", x: -330, y: -330, w: 40, d: 340, rot: 0 }, { kind: "wall", x: -330, y: 330, w: 40, d: 340, rot: 0 },
      { kind: "wall", x: 330, y: 0, w: 40, d: 1000, rot: 0 }, { kind: "wall", x: 0, y: -500, w: 660, d: 40, rot: 0 }, { kind: "wall", x: 0, y: 500, w: 660, d: 40, rot: 0 },
    ],
  });
  for (const [at, h] of [[[3100, -1950], 90], [[2500, -4050], 92], [[1950, -2250], 88]] as [XY, number][]) tryPlace("demonmarch:dead_crops", at, h, 380, { solid: "none" });
  for (const [at, h] of [[[3300, -3700], 0], [[1700, -3500], 100]] as [XY, number][]) tryPlace("demonmarch:burnt_fence", at, h, 220, { solid: "none" });
  // the orchard behind the barn, burnt where it stood in its rows; a cart and hay left in the yard
  for (const [x, y] of [[3300, -3700], [2950, -3850], [3300, -4050], [2950, -4200], [2600, -4300], [3250, -2350], [3550, -2650], [2900, -2050], [3550, -3300], [2600, -2200]] as XY[])
    tryPlace(rnd() < 0.8 ? "demonmarch:charred_tree" : "frontier:stump", [x + (rnd() - 0.5) * 80, y + (rnd() - 0.5) * 80], rnd() * 360, 140, { s: 0.6 + rnd() * 0.2, solid: ring(28, "tree") });
  for (const [ref, at, h] of [["eastcoast:broken_wagon", [2100, -2300], 40], ["frontier:scorch_mark", [2900, -2400], 0], ["frontier:scorch_mark", [2300, -3700], 90]] as [string, XY, number][])
    tryPlace(ref, at, h, 200, { colours: ref.includes("wagon") ? "dm_charred" : undefined, solid: ref.includes("wagon") ? "auto" : "none" });

  // ---- the fishermen's hamlet on the shore: houses, the burnt jetty, boats on the beach ----
  for (const [at, h] of [[[-2550, -1050], 0], [[-3150, -2600], 0], [[-2250, -2650], 0]] as [XY, number][]) house(at, toRoad(at, TO_HAMLET) + h, 0.9);
  const jettyAt = nearestOn(SHORE, -4000, -1950).q;
  for (let k = 0; k < 4; k++) put("eastcoast:fishing_jetty", [jettyAt[0] - 100 - k * 400, jettyAt[1]], 0, { colours: "dm_charred", solid: "none" });
  for (const [x, y, h] of [[-3800, -2600, 30], [-3700, -1200, 150], [-3850, -3200, 80]] as number[][]) put("eastcoast:rowboat", [x, y], h, { colours: "dm_charred", solid: [{ kind: "boat", x: 0, y: 0, w: 380, d: 150, rot: 0 }] });
  for (const [ref, at, h] of [["demonmarch:burnt_fence", [-2100, -1300], 20], ["demonmarch:claw_wall", [-3400, -1500], 80], ["common:crate", [-3350, -1950], 30], ["frontier:scorch_mark", [-2700, -2100], 0], ["demonmarch:charred_tree", [-2000, -2100], 0]] as [string, XY, number][])
    tryPlace(ref, at, h, 200, { solid: ref.endsWith("tree") ? ring(36, "tree") : ref.endsWith("wall") ? [{ kind: "wall", x: 0, y: 0, w: 50, d: 400, rot: 0 }] : ref.endsWith("crate") ? "auto" : "none" });

  // ---- a farm by the east road, burnt on the demons' way through ----
  for (const [at, h] of [[[-950, -4250], 0], [[-2350, -3850], 0]] as [XY, number][]) house(at, toRoad(at, ROAD_E) + h, 0.9);
  for (const [ref, at, h] of [["demonmarch:claw_wall", [-1650, -4300], 90], ["demonmarch:burnt_fence", [-1500, -3600], 0], ["eastcoast:broken_wagon", [-500, -3600], 200], ["frontier:beast_bones", [-1600, -4700], 60], ["frontier:scorch_mark", [-1300, -3500], 0]] as [string, XY, number][])
    tryPlace(ref, at, h, 220, { s: ref.endsWith("bones") ? 0.45 : 1, colours: ref.includes("wagon") ? "dm_charred" : undefined, solid: ref.endsWith("wall") ? [{ kind: "wall", x: 0, y: 0, w: 50, d: 400, rot: 0 }] : ref.includes("wagon") ? "auto" : "none" });

  // ---- the fields left to die, west and south of the village ----
  for (const [at, h] of [[[-1400, 1700], 10], [[-2100, 2000], 15], [[-1700, 3000], 5], [[-2700, 2900], 12], [[-1100, -2700], 92], [[-1900, -3200], 85], [[-500, 3400], 20]] as [XY, number][])
    tryPlace("demonmarch:dead_crops", at, h, 400, { solid: "none" });
  for (const [at, h] of [[[-1300, 1200], 0], [[-2300, 1450], 10], [[-1200, -3400], 95]] as [XY, number][]) tryPlace("demonmarch:burnt_fence", at, h, 220, { solid: "none" });

  // ---- over the land: charred trees and stumps, rocks, dry grass; red maples and autumn trees
  // thickening into the border woods in the west ----
  for (let x = -R + 300; x < R; x += 560)
    for (let y = -R + 300; y < R; y += 560) {
      const px = x + (rnd() - 0.5) * 400, py = y + (rnd() - 0.5) * 400;
      if (!inBox(px, py, 200) || !fits(px, py, 160, 300) || Math.hypot(px - GREEN[0], py - GREEN[1]) < 900) continue;
      const woods = ease(2600, 4800, py), roll = rnd();
      if (roll > 0.3 + 0.55 * woods) continue;
      const q = rnd();
      const ref = woods > 0.3 && q < woods * 0.75 ? (rnd() < 0.5 ? "frontier:red_maple" : "flora:AutumnTree")
        : q < 0.45 ? "demonmarch:charred_tree" : q < 0.6 ? "frontier:stump" : q < 0.72 ? "frontier:boulder" : q < 0.82 ? "frontier:fallen_log" : "frontier:dead_tree";
      const r = ref.endsWith("stump") || ref.endsWith("boulder") ? 140 : 230;
      if (!fits(px, py, r, r + 100)) continue;
      const s = 0.75 + rnd() * 0.35;
      const solid: SolidSpec[] = ref.endsWith("boulder") ? ring(90 * s) : ref.endsWith("log") ? [{ kind: "log", x: 0, y: 0, w: 90, d: 450, rot: 0 }] : ring((ref.endsWith("maple") ? 46 : 38) * s, "tree");
      place(ref, [px, py], rnd() * 360, r * s, { s, solid: ref.startsWith("flora:") ? "auto" : solid });
    }
  // low cover: dry grass, ash, scorched ground round the fires, leaves under the maples
  for (let i = 0; i < 300; i++) {
    const x = -R + 200 + rnd() * (2 * R - 400), y = -R + 200 + rnd() * (2 * R - 400);
    if (onTrack(x, y, 200) || nearRampAt(x, y, 120) || wet(x, y, 250) || !f.level(x, y, 120) || !free(x, y, 40)) continue;
    const k = burntAt(x, y), w = ease(3000, 4800, y);
    if (w > 0.4 && rnd() < w * 0.7) put("frontier:leaf_litter", [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.6, solid: "none" });
    else if (k > 0.5 && rnd() < 0.35) put("frontier:scorch_mark", [x, y], rnd() * 360, { s: 0.6 + rnd() * 0.6, solid: "none" });
    else put(k > 0.45 ? "demonmarch:ash_grass" : "frontier:grass_tuft", [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.5, solid: "none" });
  }

  // ---- the shore: grey rocks along the water, a stack out at sea ----
  for (const { p, d } of every(SHORE, 380)) {
    if (Math.abs(p[0]) > R + 1500 || Math.abs(p[1]) > R + 1500 || rnd() < 0.45) continue;
    if (Math.hypot(p[0] - jettyAt[0], p[1] - jettyAt[1]) < 700) continue;
    put("eastcoast:shore_rocks", [p[0] - d[1] * 110, p[1] + d[0] * 110], faceDir(-d[1], d[0]) + rnd() * 40, { s: 0.5 + rnd() * 0.45, solid: "none", z: -6, colours: "dm_greyrock" });
  }
  for (const [x, y, h, s] of [[-6300, 2600, 40, 0.8], [-6000, -3300, 160, 0.7], [-6700, -600, 250, 0.6]] as number[][]) put("eastcoast:sea_stack", [x, y], h, { s, solid: "none", z: -14, colours: "dm_greyrock" });

  // ---- past the edges: the ridge's back wooded, the border woods' red maples in the west, burnt
  // ground and charred trees toward the camp in the east ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const track = (x: number, y: number) => PATHS.some((p) => distTo(p, x, y) < 480);
  f.woods({ x0: 4600, x1: A, y0: -A, y1: A }, ["AutumnTree", "PineSmall", "Pine"], (x, y) => inside(x, y) || track(x, y) || Math.abs(y - 900) < 600, { count: 110, spacing: 600, tries: 3000 });
  f.woods({ x0: 4600, x1: A, y0: -A, y1: A }, ["rock_cluster", "boulder"], (x, y) => inside(x, y) || track(x, y), { count: 30, spacing: 900, kit: "frontier" });
  f.woods({ x0: -A, x1: A, y0: R - 600, y1: A }, ["red_maple"], (x, y) => inside(x, y) || track(x, y) || wet(x, y, 400), { count: 120, spacing: 520, kit: "frontier", tries: 4000 });
  f.woods({ x0: -A, x1: A, y0: R - 600, y1: A }, ["AutumnTree", "AutumnTree", "Pine"], (x, y) => inside(x, y) || track(x, y) || wet(x, y, 400), { count: 110, spacing: 460, tries: 4000 });
  f.woods({ x0: -A, x1: 4600, y0: -A, y1: -R + 600 }, ["charred_tree", "charred_tree"], (x, y) => inside(x, y) || track(x, y) || wet(x, y, 400), { count: 60, spacing: 600, kit: "demonmarch", tries: 3000 });
  f.woods({ x0: -A, x1: 4600, y0: -A, y1: -R + 600 }, ["dead_tree"], (x, y) => inside(x, y) || track(x, y) || wet(x, y, 400), { count: 30, spacing: 700, kit: "frontier", tries: 2000 });

  // ---- monsters: the village, the fields, the hamlet, the church hill, the farm ----
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, {
    step: 820, max: 52,
    // (not shut inside a burnt house's walls or the chapel's)
    keepOut: (x, y) => Math.hypot(x - GRAVES[0], y - GRAVES[1]) < 700 || Math.hypot(x - HAMLET[0], y - HAMLET[1] + 300) < 500 || wet(x, y, 300) || x > 4600 ||
      homes.some(([hx, hy]) => Math.hypot(x - hx, y - hy) < 560) || Math.hypot(x - CHAPEL[0], y - CHAPEL[1]) < 1000,
  });

  // ---- people ----
  const gH = faceTo(GRAVES, CHAPEL) + 180;
  const npcs: NpcSpec[] = [
    {
      id: "burnt_villages_priest", ...xy(rel(GRAVES, gH, -420, 420)), face: gH + 140, name: "บาทหลวงอัลดริก", title: "บาทหลวงประจำหมู่บ้าน", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_priestess_black", bottom: "bottom_priestess_black" },
      lines: [
        "ข้าขุดหลุมให้ชาวบ้านทุกวันตั้งแต่คืนที่พวกมันมา แต่คนที่ข้าฝังไว้เมื่อวาน วันนี้กลับลุกขึ้นมาเดินอีก",
        "หลุมพวกนี้ยังขุดไม่เสร็จหรอก จะเสร็จได้ยังไงในเมื่อคนตายมีมากกว่าคนที่เหลืออยู่",
        "ระฆังบนหอโบสถ์ยังแขวนอยู่ ถ้าวันไหนมันดังขึ้นเอง ให้รีบหนีลงไปทางทะเล",
      ],
    },
    {
      id: "burnt_villages_survivor", x: HAMLET[0] - 250, y: HAMLET[1] + 700, face: 0, name: "เมริน", title: "ชาวประมงผู้รอดชีวิต", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "auburn", eyes: "teal", top: "top_adventurer_teal", bottom: "bottom_adventurer_cocoa" },
      lines: [
        "คืนนั้นข้าพายเรือออกไปกลางทะเล พอหันกลับมาก็เห็นทั้งหมู่บ้านลุกเป็นไฟ",
        "พวกอสูรต้อนคนที่รอดไปทางตะวันออก ไปค่ายของมันริมทะเล ข้าเห็นกรงเหล็กลากผ่านไปทั้งคืน",
        "ทหารโครงกระดูกพวกนั้นมาจากสนามรบเก่าทางเหนือ มันเดินลงมาตามทางผ่านเขาเหมือนยังทำศึกไม่เสร็จ",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery: [sea],
    sky: "#4a3f3a",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4300, y: 1000 },
    npcs,
    labels: [
      { x: N_EXIT[0] - 250, y: N_EXIT[1], text: "ทางไปแนวป้องกันชายแดน", kind: "gate" },
      { x: W_EXIT[0], y: W_EXIT[1] - 250, text: "ทางไปป่าชายแดน", kind: "gate" },
      { x: E_EXIT[0], y: E_EXIT[1] + 250, text: "ทางไปค่ายทัพอสูร", kind: "gate" },
      { x: GREEN[0] + 500, y: GREEN[1] + 900, text: "หมู่บ้านลานบ่อน้ำ" },
      { x: WELL[0] - 250, y: WELL[1] + 200, text: "บ่อน้ำกลางหมู่บ้าน", kind: "small" },
      { x: CHAPEL[0] + 200, y: CHAPEL[1] + 900, text: "โบสถ์หลังคาพัง" },
      { x: GRAVES[0] - 600, y: GRAVES[1] - 300, text: "สุสานที่ขุดไม่เสร็จ", kind: "small" },
      { x: BARN[0] + 300, y: BARN[1] + 800, text: "ไร่บนเนินกับโรงนาไหม้" },
      { x: HAMLET[0] + 300, y: HAMLET[1] - 400, text: "หมู่บ้านชาวประมง" },
      { x: -2000, y: 2500, text: "ไร่ร้าง", kind: "small" },
      { x: -3700, y: -1700, text: "ท่าเรือไหม้", kind: "small" },
      { x: 4250, y: 1600, text: "ช่องเขาสู่แนวป้องกัน", kind: "small" },
    ],
  });
}

const xy = (p: XY) => ({ x: p[0], y: p[1] });

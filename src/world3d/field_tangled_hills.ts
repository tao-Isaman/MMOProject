// เนินเขาวงกต (the tangled hills), monsters Lv 146-158: the hill country between Highland Hill
// and the snowy foothills, where the hills crowd so close that the way through is a maze. High
// walls of mountain close it in on the south and north; between them two great hills stand
// across the way, each with a summit step on it, and narrow ravines wind between and round them.
// From the hollow by the miners' camp a narrow gorge cuts north through the north wall, the way
// up to the frostfang ridge.
//
// From the way in from the foothills (east) the ground opens into a ravine running north and
// south, a knoll in it. Both ways along it look like ways on and both end blind: the south
// ravine at a crag where a hermit lives in a cave, the north one under a frozen waterfall. The
// true way climbs the east hill, crosses it and comes down into the hollow between the two
// hills, where the old silver miners left their camp at the foot of the north wall; then up the
// west hill and down again into the west dale, where the way out to Highland Hill is, a knoll
// beside it. Cairns mark the true way, for those who know to look for them.
//
// Every hill is one plateau with its ramps (none touches another); where a hill closes a
// ravine it runs into the mountain wall, which stands higher.
//
// The snow lies deep in the ravines, but over the top of the south wall it thins towards the
// green meadows beyond, to bare ground and winter grass and then green grass with snow in
// patches, pines and birches among the snowy pines; so too in the south-east corner, towards
// the green lower slopes of the foothills.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: west -> highland, east -> snow_foothills, north (a little east of the middle, up the
//   gorge from the hollow) -> frostfang_ridge

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, seeded } from "./town";
import { KIT as SNOW, densify, smooth, band, inPoly, blobPoly } from "./kits/snowland";
import type { XY } from "./kits/snowland";
import { KIT as ICEBERG } from "./kits/iceberg";
import { KIT as NORTHCOLD } from "./kits/northcold";
import type { NpcSpec } from "../npcs";

useKits(SNOW, ICEBERG, NORTHCOLD);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the mountain walls, south and north (scenery), each with a spur that closes a ravine; the
// gorge to the frostfang ridge cut through the north one from the hollow ----
const MS: XY[] = [[-A, -A], [-4200, -A], [-4300, -5500], [-4100, -4500], [-4400, -3500], [-4200, -2600], [-4300, -2200], [-3200, -2000], [-3100, -1200], [-3300, -800], [-3600, -500], [-3700, 300], [-3500, 1000], [-3800, 2000], [-3600, 3000], [-3500, 3800], [-3700, 4800], [-3400, 5600], [-3600, A], [-A, A]];
const MN: XY[] = [[A, -A], [A, A], [3700, A], [3500, 5600], [3800, 4600], [3600, 3700], [3800, 3000], [3600, 2000], [3900, 1000], [3700, 200], [3780, -60], [4500, 20], [5300, -100], [6200, 0], [7200, -80], [8100, -80], [8100, -920], [7200, -920], [6200, -840], [5300, -940], [4500, -820], [3850, -900], [3600, -1000], [2700, -1200], [2800, -2300], [3900, -2500], [3500, -3000], [4100, -3500], [3800, -4500], [4000, -5500], [3900, -A]];

// ---- the hills: the east hill (A1 320, its summit A2 620), the west hill (B1 360, its summit B2
// 700), a knoll in the east ravine (E1 240) ----
const A1: XY[] = [[-3400, -3500], [-3750, -3050], [-3300, -2700], [-3500, -2200], [-3500, -1300], [-3000, -900], [-2300, -1250], [-1500, -700], [0, -900], [800, -1250], [1500, -700], [2900, -1000], [3000, -1800], [2900, -2600], [2700, -3500], [2000, -3950], [1500, -3700], [0, -3400], [-800, -3850], [-1600, -3700]];
const A2: XY[] = [[-2000, -3000], [-1800, -1600], [-600, -1500], [600, -2300], [300, -3100]];
const B1: XY[] = [[-4000, 1500], [-3000, 1300], [-2200, 1750], [-1500, 1500], [0, 1200], [1600, 1400], [2300, 1900], [3000, 1200], [4200, 1500], [4300, 3400], [3000, 3500], [2200, 3100], [1500, 3300], [0, 3600], [-800, 4050], [-1500, 3400], [-3000, 3500], [-4000, 3300]];
const B2: XY[] = [[-2400, 1900], [-800, 1800], [0, 2300], [-200, 3000], [-1600, 3000], [-2600, 2700]];
const E1: XY[] = [[1800, -5200], [3100, -5300], [3300, -4700], [2900, -4200], [1900, -4300]];
// knolls: one in the hollow (K1 220), one in the west dale (K2 260), one in the east ravine (K3 230)
const K1: XY[] = [[-3100, -150], [-2200, -250], [-1650, 150], [-1800, 650], [-2600, 750], [-3150, 350]];
const K2: XY[] = [[-3200, 4300], [-2300, 4100], [-1700, 4500], [-1800, 5300], [-3000, 5400]];
const K3: XY[] = [[-3400, -5600], [-2400, -5700], [-2200, -5000], [-2600, -4700], [-3300, -4800]];

// ramps: top on the edge, bottom out below
const RA_E = { top: [700, -3540] as XY, bottom: [494, -4569] as XY, width: 460 };   // up the east hill (the true way)
const RA_W = { top: [-700, -807] as XY, bottom: [-561, 234] as XY, width: 440 };    // down into the hollow (the true way)
const RA2 = { top: [450, -2700] as XY, bottom: [1340, -3033] as XY, width: 420 };   // up to the east summit
const RB_E = { top: [800, 1300] as XY, bottom: [936, 209] as XY, width: 440 };      // up the west hill (the true way)
const RB_W = { top: [750, 3450] as XY, bottom: [956, 4479] as XY, width: 440 };     // down to the way out (the true way)
const RB2 = { top: [-100, 2650] as XY, bottom: [862, 2925] as XY, width: 420 };     // up to the west summit
const RE1 = { top: [1850, -4750] as XY, bottom: [1100, -4700] as XY, width: 420 };  // up the knoll
const RK1 = { top: [-1719, 380] as XY, bottom: [-1029, 587] as XY, width: 400 };
const RK2 = { top: [-1725, 4700] as XY, bottom: [-950, 4800] as XY, width: 400 };
const RK3 = { top: [-2400, -4850] as XY, bottom: [-1950, -4250] as XY, width: 400 };

// the frozen waterfall at the head of the north ravine, the hermit's cave at the end of the south
// one, the mine's adit in the north wall over the hollow: the cliffs stay as drawn there
const FALLS: XY = [3350, -2400], CAVE: XY = [-3750, -2100], ADIT: XY = [3800, 300];

const along = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};
const len = (r: { top: XY; bottom: XY }) => Math.hypot(r.top[0] - r.bottom[0], r.top[1] - r.bottom[1]);
const dz = (p: XY[]) => densify(p, (x, y) => Math.abs(x) < R + 1500 && Math.abs(y) < R + 1500, 400);
// up a ramp: the way to its foot, its foot and top, and on past it
const up = (r: { top: XY; bottom: XY }, inn = 450, out = 400): XY[] => [along(r.bottom, r.top, -inn), r.bottom, r.top, along(r.bottom, r.top, len(r) + out)];
const down = (r: { top: XY; bottom: XY }, inn = 400, out = 450): XY[] => up(r, out, inn).reverse();

// ---- the thaw to the south ----
const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// How much of the ground lies under snow (0 none, 1 all): all of it but over the south wall,
// thinning towards the south edge, and in the south-east corner towards the foothills' grass
// (the world map's picture of the field reaches 6676 out).
const snowCover = (x: number, y: number): number => (1 - 0.8 * ss(-3600, -6900, x)) * (1 - 0.75 * ss(-1300, -3000, x) * ss(-4000, -6676, y));
// Where the ground clear of the snow is still bare earth and winter grass (north of a ragged
// line, but for the south-east corner), and south of it how much of it in patches, fewer
// towards the south edge.
const bareLine = (y: number) => -5000 + 3700 * ss(-3500, -4800, y) + 200 * Math.sin(y / 650) + 120 * Math.sin(y / 240 + 2);
const bareCover = (x: number, y: number): number => (0.85 - 0.65 * ss(-5000, -6676, x)) * (1 - ss(-3500, -4800, y)) + 0.2 * ss(-3500, -4800, y);
// Patches over the ground: blobs on a jittered grid, each there with the chance `p` gives and the
// bigger the likelier, so they run together where it nears 1 (their own seed, so nothing else
// in the field moves).
function patchesOf(p: (x: number, y: number) => number, seed: number, step = 400, where = (_x: number, _y: number) => true): XY[][] {
  const rnd = seeded(seed), out: XY[][] = [];
  for (let x = -A; x < -1300; x += step)
    for (let y = -A; y < A; y += step) {
      const cx = x + rnd() * step, cy = y + rnd() * step, k = p(cx, cy), r = step * (0.35 + 0.45 * k) * (0.8 + rnd() * 0.4);
      if (rnd() < k && !inPoly(SNOWFIELD, cx, cy) && where(cx, cy)) out.push(blobPoly([cx, cy], r * (0.8 + rnd() * 0.5), r * (0.7 + rnd() * 0.4), seed + out.length, 0.22, 16));
    }
  return out;
}
// where it is all snow: the ravines and the hills, its south edge ragged along the top of the
// south wall, and back to the east of the south-east corner; where it is all bare ground, the
// green beginning south of it
const SNOWFIELD: XY[] = (() => {
  const pts: XY[] = [];
  for (let y = A + 500; y >= -3700; y -= 300) pts.push([-3650 + 150 * Math.sin(y / 700) + 100 * Math.sin(y / 260 + 1), y]);
  return [[A + 500, A + 500], ...pts, [-1300, -4000], [-1300, -A - 500], [A + 500, -A - 500]];
})();
const BARE: XY[] = (() => {
  const pts: XY[] = [];
  for (let y = A + 500; y >= -A - 500; y -= 300) pts.push([bareLine(y), y]);
  return [[A + 500, A + 500], ...pts, [A + 500, -A - 500]];
})();

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(311, {
    hills: [
      { x: -500, y: -4700, r: 900, h: 60 },
      { x: 1000, y: 300, r: 800, h: -50 },
      { x: -2500, y: 200, r: 900, h: 70 },
      { x: 2200, y: 4700, r: 900, h: 70 },
      { x: -2600, y: 4600, r: 800, h: -40 },
      { x: -3600, y: -4400, r: 600, h: 50 },
    ],
    plateaus: [
      { poly: dz(MS), h: 950 },
      { poly: dz(MN), h: 1000 },
      { poly: dz(A1), h: 320, ramps: [RA_E, RA_W] },
      { poly: dz(A2), h: 620, ramps: [RA2] },
      { poly: dz(B1), h: 360, ramps: [RB_E, RB_W] },
      { poly: dz(B2), h: 700, ramps: [RB2] },
      { poly: dz(E1), h: 240, ramps: [RE1] },
      { poly: dz(K1), h: 220, ramps: [RK1] },
      { poly: dz(K2), h: 260, ramps: [RK2] },
      { poly: dz(K3), h: 230, ramps: [RK3] },
    ],
    rock: "CliffSnow",
    keep: [FALLS, CAVE, ADIT],
  });
  const { put, rnd } = f;

  // ---- tracks: as many ways as there are, so the tracks do not give the true way away ----
  const E_EXIT: XY = [-1200, -5150], W_EXIT: XY = [-500, 5150];
  const JE: XY = [-300, -4700]; // where the east ravine's ways part
  const ENTRY: XY[] = smooth([[-1250, -7600], E_EXIT, [-1050, -4700], JE]);
  const SOUTH: XY[] = smooth([JE, [-2200, -4400], [-3300, -4000], [-3800, -3200], [-3800, -2500]]);
  const NORTH: XY[] = smooth([JE, along(RE1.bottom, RE1.top, -400), [1700, -4000], [2400, -3800], [3300, -3700], [3400, -3000], [3300, -2700]]);
  const KNOLL: XY[] = [along(RE1.bottom, RE1.top, -400), RE1.bottom, RE1.top, along(RE1.bottom, RE1.top, len(RE1) + 400), [2700, -4800]];
  const EAST_HILL: XY[] = [...smooth([JE, up(RA_E)[0]]), ...up(RA_E).slice(1), ...smooth([up(RA_E)[3], [800, -2600], [200, -1800], down(RA_W)[0]]), ...down(RA_W).slice(1)];
  const SUMMIT_A: XY[] = [...smooth([[800, -2600], up(RA2, 350)[0]]), ...up(RA2, 350).slice(1), [100, -2400]];
  const HOLLOW: XY[] = smooth([down(RA_W)[3], [200, 350], up(RB_E)[0], [2000, 400], [2900, 600], [3300, 300]]);
  const KNOLL1: XY[] = [...smooth([down(RA_W)[3], [-800, 650], up(RK1, 350)[0]]), ...up(RK1, 350).slice(1), [-2400, 300]];
  const KNOLL3: XY[] = [...smooth([[-1200, -4500], up(RK3, 350)[0]]), ...up(RK3, 350).slice(1), [-2900, -5200]];
  const WEST_HILL: XY[] = [up(RB_E)[0], ...up(RB_E).slice(1), ...smooth([up(RB_E)[3], [1600, 2400], down(RB_W)[0]]), ...down(RB_W).slice(1), ...smooth([down(RB_W)[3], [300, 5000], [-200, 5050], W_EXIT, [-550, 7600]])];
  const SUMMIT_B: XY[] = [...smooth([[1600, 2400], up(RB2, 350)[0]]), ...up(RB2, 350).slice(1), [-900, 2400]];
  const WEST_DALE: XY[] = [...smooth([[100, 5000], [-350, 4800], up(RK2, 350)[0]]), ...up(RK2, 350).slice(1), [-2500, 4750]];
  // from the hollow by the miners' camp north up the gorge to the frostfang ridge
  const N_EXIT: XY = [5150, -520];
  const GORGE_WAY: XY[] = smooth([[2000, 400], [2600, 250], [3200, -250], [3800, -480], [4500, -400], N_EXIT, [7600, -500]]);
  const ROAD: [number, number, number] = [0.7, 0.75, 1.0];
  const roads = [band(ENTRY, 460), band(SOUTH, 380), band(NORTH, 380), band(KNOLL, 360), band(EAST_HILL, 400), band(SUMMIT_A, 360), band(HOLLOW, 380), band(WEST_HILL, 420), band(SUMMIT_B, 360), band(WEST_DALE, 340), band(KNOLL1, 340), band(KNOLL3, 340), band(GORGE_WAY, 400)];
  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ground = f.ground({ area, roads, plazas: [], base: "snow", road: ROAD });
  // over the south wall and in the south-east corner: bare ground and winter grass a hair over the
  // snow, green grass a hair over that, each cut away where the one below shows through
  const snowP = patchesOf(snowCover, 3111, 340), bareP = patchesOf(bareCover, 3112, 400, (x, y) => x < bareLine(y) + 400);
  const band0 = { x0: -A, y0: -A, x1: -1300, y1: A };
  const bare = f.ground({ area: band0, roads, plazas: [], water: [SNOWFIELD, ...snowP], base: "moss", road: ROAD, tint: "#d2c6a4" });
  bare.mesh.position.y += 3;
  bare.mesh.renderOrder = 1;
  const grass = f.ground({ area: band0, roads, plazas: [], water: [SNOWFIELD, BARE, ...snowP, ...bareP], base: "grass", road: ROAD });
  grass.mesh.position.y += 6;
  grass.mesh.renderOrder = 2;

  // ---- ways out ----
  f.exit("snow_foothills", E_EXIT, [-1100, -4450]);
  f.exit("highland", W_EXIT, [-400, 4450]);
  f.exit("frostfang_ridge", N_EXIT, [4450, -420]);

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number, gap = 0) =>
    Math.abs(x) < A - 200 && Math.abs(y) < A - 200 &&
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    take(at[0], at[1], r);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] });
  const inBox = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  const grove = (c: XY, r: number, n: number, kinds = ["SnowPine", "SnowPine", "SnowPineSmall", "SnowPineSmall", "FrostOak"]) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inBox(x, y) || !free(x, y, 170, 170)) continue;
      put(`flora:${kinds[Math.floor(rnd() * kinds.length)]}`, [x, y], rnd() * 360, { s: 0.75 + rnd() * 0.45 });
      take(x, y, 170);
      made++;
    }
  };
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, solid?: number) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (Math.abs(x) > R + 2500 || Math.abs(y) > R + 2500 || !free(x, y, rad, 40)) continue;
      put(ref, [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.4, ...(solid ? ring(solid) : {}) });
      take(x, y, rad);
      made++;
    }
  };

  // ---- the ways out: signs ----
  prop("snowland:trail_sign", [-1650, -4950], 90, 80, ring(30, "post"));
  prop("snowland:trail_sign", [-150, 5300], -90, 80, ring(30, "post"));
  prop("snowland:cairn", [-950, 5300], 0, 70, ring(45));
  prop("snowland:trail_sign", [4250, -120], 180, 80, ring(30, "post"));

  // ---- the true way: cairns all along it ----
  const TRUE_WAY: XY[] = [[-200, -4300], [300, -4300], [900, -3300], [700, -2900], [300, -2000], [-200, -1300], [-1000, -800 + 1300], [-200, 650], [500, 650], [1200, 1700], [1400, 2200], [1300, 3000], [1250, 4300], [600, 4650], [-100, 4800]];
  for (const [x, y] of TRUE_WAY) {
    // beside the track, on whichever side is clear
    for (const d of [280, -280, 380, -380]) {
      if (!free(x + d, y, 60)) continue;
      prop("snowland:cairn", [x + d, y], rnd() * 90, 70, ring(45));
      break;
    }
  }

  // ---- the south ravine's end: the hermit's cave under the crag ----
  prop("northcold:cave_mouth", [CAVE[0], CAVE[1] - 230], 90, 500, { solid: [{ kind: "rock", x: 130, y: 0, w: 380, d: 820, rot: 0 }, { kind: "post", x: -230, y: -35, r: 70 }] });
  prop("iceberg:woodpile", [-3300, -2550], 90, 170);
  prop("snowland:snowy_stump", [-3950, -2900], 0, 80, ring(45, "stump"));

  // ---- the north ravine's end: the frozen waterfall ----
  prop("snowland:frozen_falls", [FALLS[0], FALLS[1] - 165], 90, 450, { s: 1.25, solid: [{ kind: "rock", x: 60, y: 0, w: 300, d: 700, rot: 0 }, { kind: "ice", x: -210, y: 0, w: 150, d: 400, rot: 0 }] });
  prop("snowland:ice_crystals", [3600, -3000], 30, 120, ring(70, "crystal"));
  prop("snowland:ice_crystals", [2950, -2800], 200, 120, ring(70, "crystal"));
  prop("snowland:snow_boulder", [3650, -3700], 0, 170, ring(130));

  // ---- the miners' camp at the foot of the north wall, in the hollow ----
  prop("northcold:mine_adit", [ADIT[0] - 230, ADIT[1]], 0, 420, { solid: [{ kind: "rock", x: 150, y: 0, w: 360, d: 860, rot: 0 }, { kind: "rock", x: -40, y: 300, r: 110 }, { kind: "rock", x: -40, y: -300, r: 110 }] });
  prop("northcold:miners_shack", [2900, 1050], 200, 380, { solid: [{ kind: "house", x: 0, y: 0, w: 540, d: 420, rot: 0 }] });
  prop("northcold:ore_cart", [2900, -400], 60, 300, { solid: [{ kind: "cart", x: -40, y: 160, w: 180, d: 140, rot: 0 }, { kind: "rock", x: -90, y: -200, r: 130 }] });
  prop("northcold:ore_cart", [2000, 1000], 200, 300, { solid: [{ kind: "cart", x: -40, y: 160, w: 180, d: 140, rot: 0 }, { kind: "rock", x: -90, y: -200, r: 130 }] });
  prop("snowland:log_pile", [2400, -650], 90, 230);
  prop("iceberg:snowy_barrels", [3300, 900], 0, 110);
  prop("iceberg:sled", [2300, 1150], 20, 130);
  prop("iceberg:brazier", [2550, 300], 0, 60, ring(40, "post"));
  prop("common:crate", [3350, -600], 20, 60);
  prop("common:crate", [3250, -720], 60, 60);
  prop("common:fence_broken", [1900, -500], 80, 150);

  // ---- the summits: a lookout cairn on each, rocks, a few pines ----
  prop("snowland:rock_cluster", [-900, -2400], 30, 260, ring(190));
  prop("snowland:cairn", [-300, -2200], 0, 70, ring(45));
  prop("snowland:rock_cluster", [-1500, 2400], 0, 260, ring(190));
  prop("snowland:cairn", [-600, 2700], 0, 70, ring(45));
  prop("snowland:snow_boulder", [2700, -4750], 0, 170, ring(130));

  // ---- rocks over the hills and down the ravines ----
  const ROCKS: [string, XY, number][] = [
    ["snowland:snow_boulder", [-2700, -4700], 130], ["snowland:flat_slabs", [-3800, -3800], 150], ["snowland:rock_cluster", [3500, -4300], 190], ["northcold:iced_rocks", [-2300, -3900], 170],
    ["snowland:snow_boulder", [-2400, -2200], 130], ["snowland:flat_slabs", [1800, -2000], 150], ["snowland:rock_cluster", [2200, -3000], 190], ["snowland:snow_boulder", [-2600, -1300], 130],
    ["snowland:flat_slabs", [-2700, 600], 150], ["snowland:snow_boulder", [-1300, -100], 130], ["northcold:iced_rocks", [400, 900], 170], ["snowland:rock_cluster", [-3000, 2300], 190],
    ["snowland:snow_boulder", [2700, 2600], 130], ["snowland:flat_slabs", [-2800, 2900], 150], ["snowland:snow_boulder", [2900, 4300], 130], ["snowland:rock_cluster", [-1500, 5100], 190],
    ["snowland:flat_slabs", [-2700, 4900], 150], ["northcold:iced_rocks", [3000, 5000], 170], ["snowland:snow_boulder", [-2000, -5100], 130], ["snowland:flat_slabs", [1500, -5100], 150],
  ];
  for (const [id, at, r] of ROCKS) if (free(at[0], at[1], r)) prop(id, at, rnd() * 360, r + 40, ring(r));
  // fallen rock at the foot of every cliff
  for (const poly of [MS, MN, A1, A2, B1, B2, E1, K1, K2, K3]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (inPoly(poly, mx + nx * 50, my + ny * 50)) [nx, ny] = [-nx, -ny];
      for (let t = 250; t < L - 150; t += 600) {
        const out = 270 + rnd() * 140, x = a[0] + ((b[0] - a[0]) * t) / L + nx * out, y = a[1] + ((b[1] - a[1]) * t) / L + ny * out;
        if (rnd() < 0.5 || !inBox(x, y) || !free(x, y, 110, 60)) continue;
        const s = 0.5 + rnd() * 0.3;
        prop(rnd() < 0.6 ? "snowland:snow_boulder" : "snowland:flat_slabs", [x, y], rnd() * 360, 140 * s, { s, solid: [{ kind: "rock", x: 0, y: 0, r: 110 }] });
      }
    }
  }

  // ---- snowy pines: in the ravines and the hollow, thick on the hills, along every rim ----
  for (const [c, r, n] of [
    [[-2500, -4800], 600, 4], [[-3700, -4600], 500, 3], [[3300, -4900], 500, 3], [[1300, -5200], 400, 2], [[-3100, -3100], 400, 2], [[3400, -3400], 300, 2],
    [[-1500, -2700], 700, 5], [[1700, -2700], 700, 5], [[-2300, -1600], 500, 3], [[1800, -1400], 500, 3], [[-1500, -3300], 400, 2],
    [[-3000, -100], 500, 3], [[-2200, 900], 400, 2], [[1600, -200], 300, 2], [[3200, 1200], 300, 2],
    [[-3000, 2000], 600, 4], [[2400, 2000], 700, 5], [[2900, 3100], 500, 3], [[-3200, 3000], 400, 3], [[-1800, 2000], 300, 2],
    [[-1900, 4300], 600, 4], [[-500, 5000], 500, 3], [[3000, 4800], 400, 3], [[-3000, 4400], 400, 2],
  ] as [XY, number, number][]) grove(c, r, n);
  for (const poly of [A1, B1, A2, B2, E1, K1, K2, K3]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (!inPoly(poly, mx + nx * 50, my + ny * 50)) [nx, ny] = [-nx, -ny];
      for (let t = 200; t < L - 100; t += 520) {
        const back = 320 + rnd() * 240, x = a[0] + ((b[0] - a[0]) * t) / L + nx * back, y = a[1] + ((b[1] - a[1]) * t) / L + ny * back;
        if (rnd() < 0.35 || !inBox(x, y) || !free(x, y, 170, 150)) continue;
        put(`flora:${rnd() < 0.6 ? "SnowPine" : "SnowPineSmall"}`, [x, y], rnd() * 360, { s: 0.75 + rnd() * 0.4 });
        take(x, y, 170);
      }
    }
  }

  // ---- ground cover ----
  scatter("snowland:snow_drift", [-1000, -4800], 1500, 3, 230);
  scatter("snowland:snow_drift", [0, -2300], 2200, 4, 230);
  scatter("snowland:snow_drift", [-1000, 300], 1800, 3, 230);
  scatter("snowland:snow_drift", [0, 2500], 2200, 4, 230);
  scatter("snowland:snow_drift", [0, 4600], 2000, 3, 230);
  scatter("snowland:frost_shrub", [0, -4000], 3500, 5, 90, 50);
  scatter("snowland:frost_shrub", [0, 2500], 3500, 5, 90, 50);
  scatter("snowland:dead_branches", [0, 0], 4500, 8, 120);
  scatter("snowland:dry_grass", [0, 0], 4500, 6, 90);
  scatter("northcold:flattened_grass", [0, -2000], 2500, 4, 170);
  scatter("northcold:flattened_grass", [0, 2500], 2500, 4, 170);

  // ---- past the edge: pines along the tops of the mountain walls, down the way to each side
  // (pines and birches without their snow where it thins to the south) ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => [[0, 0], [250, 0], [-250, 0], [0, 250], [0, -250]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const thawed = (x: number, y: number) => snowCover(x, y) < 0.6;
  f.woods(area, ["SnowPine", "SnowPine", "SnowPineSmall", "FrostOak"], (x, y) => inside(x, y) || onTrack(x, y) || thawed(x, y), { count: 300, spacing: 430, tries: 6000 });
  f.woods(area, ["Pine", "Pine", "PineSmall", "Birch", "SnowPineSmall"], (x, y) => inside(x, y) || onTrack(x, y) || !thawed(x, y), { count: 70, spacing: 430, tries: 3000 });
  // and on the walls' tops inside the box, where nobody walks
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["SnowPine", "SnowPineSmall"], (x, y) => f.h(x, y) < 900 || onTrack(x, y) || thawed(x, y), { count: 80, spacing: 480, tries: 3000 });
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["Pine", "PineSmall", "Birch"], (x, y) => f.h(x, y) < 900 || onTrack(x, y) || !thawed(x, y), { count: 15, spacing: 480, tries: 1500 });

  // ---- monsters ----
  const quiet = (x: number, y: number) => Math.hypot(x - CAVE[0], y - CAVE[1]) < 900 || Math.hypot(x - 2900, y - 300) < 1100;
  f.monsterSpots(ground, { x0: -R + 200, x1: R - 200, y0: -R + 200, y1: R - 200 }, { step: 560, keepOut: quiet });

  // ---- people ----
  const npcs: NpcSpec[] = [
    { id: "tangled_hills_hermit", x: CAVE[0] + 520, y: CAVE[1] - 650, face: 160, name: "ฤๅษีทอร์วัลด์", title: "ฤๅษีแห่งเนินเขาวงกต", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "หลงมาถึงถ้ำข้าเหมือนคนอื่น ๆ สินะ หุบนี้ตันแล้ว ทางข้ามเนินไม่ได้อยู่ตรงนี้",
        "จำไว้ ทางจริงมีกองหินบอกทางวางไว้ตลอด ใครเดินตามรอยเท้าคนอื่นมักจะวนกลับมาที่เดิม",
        "ข้าอยู่ที่นี่มายี่สิบหนาวแล้ว ความเงียบของหิมะสอนอะไรข้ามากกว่าตำราทั้งหอสมุด",
      ] },
    { id: "tangled_hills_surveyor", x: -300, y: 700, face: 300, name: "ลีน่า", title: "นักทำแผนที่หลงทาง", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "gold", eyes: "blue", top: "top_adventurer_ochre", bottom: "bottom_adventurer_sand" },
      lines: [
        "ฉันวาดแผนที่เนินพวกนี้มาสามวันแล้ว แต่ทุกหุบหน้าตาเหมือนกันไปหมด",
        "ค่ายเหมืองเงินทางเหนือของแอ่งนี้ร้างมานานแล้ว ได้ยินว่าคนงานหนีออกไปในคืนเดียว",
        "ถ้าจะไปไฮแลนด์ ฮิล ต้องขึ้นเนินฝั่งตะวันตกแล้วลงอีกฝั่ง อย่าเพิ่งเชื่อฉันมากนะ ฉันก็ยังหลงอยู่",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [bare.mesh, grass.mesh],
    sky: "#b8c6d4",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -1150, y: -4300 },
    npcs,
    labels: [
      { x: E_EXIT[0] + 400, y: E_EXIT[1] + 100, text: "ทางไปเชิงเขาหิมะ", kind: "gate" },
      { x: W_EXIT[0] + 400, y: W_EXIT[1] - 100, text: "ทางไปไฮแลนด์ ฮิล", kind: "gate" },
      { x: N_EXIT[0] - 400, y: N_EXIT[1], text: "ทางไปสันเขาเขี้ยวน้ำแข็ง", kind: "gate" },
      { x: CAVE[0] + 700, y: CAVE[1] - 300, text: "ถ้ำฤๅษี" },
      { x: FALLS[0] - 600, y: FALLS[1] - 500, text: "น้ำตกน้ำแข็ง" },
      { x: 2400, y: 200, text: "ค่ายเหมืองเงินร้าง" },
      { x: -400, y: 300, text: "แอ่งกลางเนิน", kind: "small" },
      { x: -600, y: -2700, text: "ยอดเนินตะวันออก", kind: "small" },
      { x: -1200, y: 2400, text: "ยอดเนินตะวันตก", kind: "small" },
      { x: -2600, y: -3700, text: "หุบแคบใต้", kind: "small" },
      { x: 3200, y: -4000, text: "หุบแคบเหนือ", kind: "small" },
      { x: 2400, y: -4800, text: "เนินหินเล็ก", kind: "small" },
      { x: 1700, y: 4700, text: "หุบตะวันตก", kind: "small" },
      { x: -2500, y: 250, text: "เนินกลางแอ่ง", kind: "small" },
      { x: -2700, y: 4800, text: "เนินตะวันตก", kind: "small" },
      { x: -2900, y: -5100, text: "เนินหินใต้", kind: "small" },
    ],
  });
}

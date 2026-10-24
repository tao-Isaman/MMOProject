// สันเขาเขี้ยวน้ำแข็ง (the frostfang ridge), monsters Lv 160-170: the high country north of the
// tangled hills, between Iceberg's ice pass and the sea cliffs of the north. Two rows of peaks of
// dark rock stand along it like the teeth of a jaw, sheer and curved to their points: the upper
// row along the crest in the north, the lower out of the mountain wall in the south. Between the
// rows lies a basin of snow where the giants fought their last war in the old days: their bones,
// their broken swords as long as a house, the arms of the men who fought them, lie where they
// fell; their ghosts walk there still, and the frost titans come down off the ice to it.
//
// The way up from the tangled hills (the south edge, a little east of the middle) is a narrow
// gorge through the south wall into the basin. West of the basin the land climbs to the shoulder
// (4.5 m), the way out west along it to the east headland over the north sea cliffs; the
// shoulder runs round north under the crest, and from it a ramp climbs the crest (8 m), where the
// kingdom's border watchtower stands empty among the fangs, looking north over the ridge to the
// west glacier. A second ramp brings the shoulder down into the battlefield on its east side.
// The mountain wall of the ice pass closes the east; north and north-west past the crest the
// ridge falls toward the sea at the glacier's foot.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: south (a little east of the middle, up the gorge) -> tangled_hills,
//             west (the middle, on the shoulder) -> north_cliffs

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { KIT as GLACIER } from "./kits/glacier";
import { KIT as SNOW } from "./kits/snowland";
import { KIT as NORTHCOLD } from "./kits/northcold";
import { KIT as ICEBERG } from "./kits/iceberg";
import { KIT as WESTMOUNT, smooth, band, blob, inPoly, toLine, dense, towards, beyond, sheet } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(GLACIER, SNOW, NORTHCOLD, ICEBERG, WESTMOUNT);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the sea in the north-west corner, past the edge (the cove at the glacier's foot and the
// north sea cliffs' bay meet there) ----
const SEA: XY[] = [[4750, A + 400], [4750, 6676], [5300, 5900], [6000, 5100], [6676, 4800], [A + 400, 4700], [A + 400, A + 400]];

// ---- the levels ----
// U: the shoulder in the west and the upper ground round under the crest (450); CR: the crest
// (800) on it; SW: the mountain wall along the south (1000, scenery) with the gorge cut through
// it; EW: the ice pass's wall along the east (1100, scenery).
const U: XY[] = [[-3100, A], [-3000, 4600], [-2300, 3600], [-1000, 3200], [600, 3100], [1300, 2200], [1200, 800], [1300, -800], [1200, -2200], [1600, -3300], [2600, -3800], [4500, -4600], [A, -A], [A, 4300], [6800, 4400], [5900, 4600], [5000, 4700], [4600, 5600], [4400, A]];
const CR: XY[] = [[2300, -2500], [3000, -3100], [4300, -3300], [A, -3500], [A, 3900], [6800, 4000], [5700, 4100], [4700, 3600], [4100, 2900], [3200, 2500], [2400, 2300], [2200, 1400], [2100, 0], [2200, -1300]];
const SW: XY[] = [
  [-A, -A], [-3600, -A], [-3700, -4300], [-3500, -3000], [-3800, -2000], [-3600, -1150],
  // the gorge, on in line with the one through the tangled hills' north wall
  [-3750, -940], [-4500, -820], [-5300, -1000], [-6200, -900], [-7200, -1000], [-8100, -1000], [-8100, -100], [-7200, -80], [-6200, 0], [-5300, -120], [-4500, -40], [-3750, -100],
  [-3600, 300], [-3900, 1500], [-3700, 2700], [-4000, 3400], [-4700, 4300], [-5800, 5600], [-6300, 6700], [-6500, A], [-A, A],
];
const EW: XY[] = [[-A, -A], [A, -A], [A, -4700], [6000, -4600], [4500, -4300], [3300, -4500], [2200, -4200], [1000, -4300], [-200, -3900], [-1500, -4400], [-2600, -4000], [-3600, -4400], [-A, -4500]];
// the fangs: towers of rock standing sheer (no way up), each with its point on it: the upper row
// along the crest, the lower out of the south wall, two out in the battlefield
const FANGS: [XY, number, number][] = [
  [[4900, -2900], 600, 1500], [[4600, -1300], 470, 1250], [[5000, 400], 520, 1450], [[4700, 2100], 450, 1200], [[6100, -1900], 750, 1700], [[6300, 1400], 700, 1600], [[6100, 3300], 520, 1350],
  [[-3950, -3000], 520, 1400], [[-4250, -1700], 400, 1250], [[-4000, 1300], 480, 1350], [[-4100, 2700], 430, 1250], [[-5400, -3800], 700, 1600], [[-5500, 2100], 650, 1500],
  [[-1500, -2900], 380, 900], [[300, 1700], 320, 800],
];

// ramps: up onto the shoulder from the battlefield (west and east), up the crest from the shoulder
const RU = { top: [-1650, 3400] as XY, bottom: [-2047, 2109] as XY, width: 460 };
const RU2 = { top: [1250, -1500] as XY, bottom: [-96, -1404] as XY, width: 440 };
const RCR = { top: [3650, 2700] as XY, bottom: [3224, 3660] as XY, width: 440 };

// ---- the places ----
const S_EXIT: XY = [-5150, -520], W_EXIT: XY = [-300, 5150];
const FORK: XY = [-3000, -450];
const TOWER: XY = [3600, -800];
const SWORD: XY = [-2300, 900];   // the greatest of the giants' swords, on the way through the battlefield
const RANGER: XY = [3050, -1500];

// a ramp up from the ground or a step: the track leading to its foot, up it, and on past its top
const climb = (r: { top: XY; bottom: XY }, inn = 400, out = 400): XY[] => [beyond(r.top, r.bottom, inn), r.bottom, r.top, beyond(r.bottom, r.top, out)];

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(511, {
    hills: [
      // the battlefield's snow, heaped and hollowed
      { x: -2200, y: -800, r: 1000, h: 80 }, { x: -800, y: 2200, r: 900, h: 100 }, { x: 200, y: -2500, r: 900, h: 70 },
      { x: -2900, y: 3900, r: 1000, h: 90 }, { x: -1000, y: -3600, r: 700, h: -50 }, { x: -500, y: 500, r: 800, h: -40 },
    ],
    plateaus: [
      { poly: dense(U), h: 450, ramps: [RU, RU2] },
      { poly: dense(CR), h: 800, ramps: [RCR] },
      { poly: dense(SW, 700), h: 1000 },
      { poly: dense(EW, 700), h: 1100 },
      ...FANGS.map(([c, r, h], i) => ({ poly: dense(blob(c, r, r * (0.85 + (i % 3) * 0.08), 31 + i, 18), 400), h: h + (inPoly(CR, c[0], c[1]) ? 800 : inPoly(SW, c[0], c[1]) ? 1000 : 0) })),
    ],
    rock: "Glacier_FangCliff",
  });
  const { put, rnd } = f;

  // ---- the tracks: up the gorge into the battlefield and over it to the shoulder and the way
  // west; east through the battlefield and up onto the shoulder's east side, round under the
  // crest and up it to the watchtower ----
  const MAIN: XY[] = [
    ...smooth([[-7600, -520], S_EXIT, [-4300, -480], FORK, [-2700, 300], [-2450, 1300], climb(RU)[0]]), ...climb(RU).slice(1),
    ...smooth([climb(RU)[3], [-1100, 4100], [-500, 4600], W_EXIT, [-300, 7600]]),
  ];
  const EAST: XY[] = [
    ...smooth([FORK, [-2300, -1300], [-1200, -1650], climb(RU2)[0]]), ...climb(RU2).slice(1),
    ...smooth([climb(RU2)[3], [1700, -700], [1700, 600], [1720, 1700], [1500, 2700], [1200, 3600]]),
  ];
  const UP: XY[] = [
    ...smooth([[-1100, 4100], [0, 4000], [1200, 3600], [2300, 3800], climb(RCR)[0]]), ...climb(RCR).slice(1),
    ...smooth([climb(RCR)[3], [3700, 1500], [3400, 300], [TOWER[0] - 650, TOWER[1] + 100]]),
  ];
  const FIELD: XY[] = smooth([[-2300, -1300], [-2700, -2300], [-2300, -3300]]);
  const TRACKS = [MAIN, EAST, UP, FIELD];
  const roads = [band(MAIN, 460), band(EAST, 380), band(UP, 400), band(FIELD, 340), blob([TOWER[0] - 600, TOWER[1]], 500, 650, 7, 14)];

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ROAD: [number, number, number] = [0.72, 0.74, 0.82];
  const ground = f.ground({ area, roads, plazas: [], water: [SEA], base: "snow", road: ROAD });
  const sea = sheet(SEA, -14, "Glacier_Sea");

  // ---- the ways out ----
  f.exit("tangled_hills", S_EXIT, [-4450, -470]);
  f.exit("north_cliffs", W_EXIT, [-420, 4450]);

  // ---- placing things: clear of the tracks, the cliffs and each other ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const free = (x: number, y: number, r: number, gap = 0) =>
    !nearTrack(x, y, r + 180) && ground.kind(x, y) === 0 && f.level(x, y, Math.min(r, 220)) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    taken.push([at[0], at[1], r]);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });
  const inBox = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  const IN = { x0: -R + 250, x1: R - 250, y0: -R + 250, y1: R - 250 };
  const scatter = (refs: string[], n: number, box: { x0: number; x1: number; y0: number; y1: number }, rad: number, o: { s?: [number, number]; solid?: SolidSpec[] | "none"; ringR?: number; keep?: (x: number, y: number) => boolean } = {}) => {
    for (let i = 0, made = 0; i < n * 30 && made < n; i++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (!free(x, y, rad, 40) || (o.keep && !o.keep(x, y))) continue;
      const s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      prop(refs[Math.floor(rnd() * refs.length)], [x, y], rnd() * 360, rad * s, { s, ...(o.ringR ? ring(o.ringR * s) : o.solid ? { solid: o.solid } : {}) });
      made++;
    }
  };
  for (const t of TRACKS) for (let i = 0; i < t.length; i += 2) taken.push([t[i][0], t[i][1], 160]);
  const basin = (x: number, y: number) => f.h(x, y) < 250;
  const shoulder = (x: number, y: number) => Math.abs(f.h(x, y) - 450) < 60;
  const crest = (x: number, y: number) => Math.abs(f.h(x, y) - 800) < 60;

  // ---- the fangs: each tower's point on its top ----
  FANGS.forEach(([c, r], i) => put("glacier:fang_peak", c, (i * 47) % 360, { s: (r / 330) * (0.85 + (i % 3) * 0.1), solid: "none" }));

  // ---- the ways out: a sign at the gorge's mouth, cairns on the shoulder ----
  prop("snowland:trail_sign", [-3350, 250], 0, 80, ring(30, "post"));
  prop("snowland:cairn", [-4500, -100], 0, 70, ring(45));
  prop("snowland:trail_sign", [W_EXIT[0] - 450, W_EXIT[1] - 350], -90, 80, ring(30, "post"));
  prop("snowland:cairn", [W_EXIT[0] + 420, W_EXIT[1] - 500], 0, 70, ring(45));

  // ---- the watchtower on the crest, the broken border wall either side of it, the ranger's camp
  // in its lee ----
  prop("glacier:border_tower", TOWER, 0, 600, { solid: [{ kind: "tower", x: -20, y: -20, w: 660, d: 660, rot: 0 }, { kind: "rock", x: 320, y: 330, r: 160 }] });
  prop("westmount:fort_wall", [TOWER[0] + 250, TOWER[1] - 1050], 92, 420, { solid: [{ kind: "wall", x: 0, y: 0, w: 800, d: 200, rot: 0 }] });
  prop("westmount:fort_wall", [TOWER[0] + 350, TOWER[1] + 1050], 86, 420, { solid: [{ kind: "wall", x: 0, y: 0, w: 800, d: 200, rot: 0 }] });
  prop("westmount:rockfall", [TOWER[0] + 500, TOWER[1] + 1800], 40, 300, { s: 0.7, ...ring(200) });
  prop("snowland:lean_to", [RANGER[0] - 200, RANGER[1] - 450], towards(-1, 0.3), 260);
  prop("snowland:cold_campfire", [RANGER[0] - 450, RANGER[1] + 50], 0, 120, ring(55));
  prop("iceberg:woodpile", [RANGER[0] + 250, RANGER[1] - 700], 90, 120);
  prop("snowland:expedition_flag", [TOWER[0] - 800, TOWER[1] + 600], 0, 90, ring(40, "post"));

  // ---- the battlefield: the giants' bones, their broken swords, the arms of the fallen; the
  // greatest sword where the way crosses it ----
  prop("glacier:giant_sword", SWORD, 30, 330, { s: 1.4, solid: [{ kind: "sword", x: 0, y: 0, r: 70 }] });
  prop("glacier:battle_debris", [SWORD[0] - 400, SWORD[1] + 300], 40, 220, { solid: "none" });
  const RELICS: [string, XY, number, number, SolidSpec[]][] = [
    ["glacier:giant_bones", [-1900, -2500], 30, 1, [{ kind: "bone", x: 0, y: 0, w: 500, d: 1000, rot: 0 }]],
    ["glacier:giant_bones", [-400, 800], 110, 0.9, [{ kind: "bone", x: 0, y: 0, w: 500, d: 1000, rot: 0 }]],
    ["glacier:giant_bones", [500, -3000], 70, 0.85, [{ kind: "bone", x: 0, y: 0, w: 500, d: 1000, rot: 0 }]],
    ["glacier:giant_skull", [-1100, -800], 200, 1, [{ kind: "bone", x: 0, y: 0, r: 180 }]],
    ["glacier:giant_skull", [-300, 2600], 40, 0.9, [{ kind: "bone", x: 0, y: 0, r: 180 }]],
    ["glacier:giant_skull", [2900, 1400], 300, 0.8, [{ kind: "bone", x: 0, y: 0, r: 180 }]],
    ["glacier:giant_sword", [-900, -2600], 140, 1, [{ kind: "sword", x: 0, y: 0, r: 60 }]],
    ["glacier:giant_sword", [-2900, 2400], 260, 0.9, [{ kind: "sword", x: 0, y: 0, r: 60 }]],
    ["glacier:giant_sword", [600, 800], 80, 1.1, [{ kind: "sword", x: 0, y: 0, r: 60 }]],
    ["glacier:giant_sword", [-1600, 4500], 190, 1, [{ kind: "sword", x: 0, y: 0, r: 60 }]],
    ["glacier:giant_sword", [2800, -2100], 10, 1, [{ kind: "sword", x: 0, y: 0, r: 60 }]],
    ["glacier:giant_bones", [3100, 3500], 20, 0.8, [{ kind: "bone", x: 0, y: 0, w: 500, d: 1000, rot: 0 }]],
  ];
  for (const [ref, at, h, s, solid] of RELICS) if (free(at[0], at[1], 300 * s)) prop(ref, at, h, 450 * s, { s, solid });
  scatter(["glacier:battle_debris"], 26, IN, 180, { s: [0.8, 1.1], solid: "none" });
  scatter(["glacier:giant_skull", "glacier:giant_bones"], 4, IN, 400, { s: [0.7, 0.9], solid: [{ kind: "bone", x: 0, y: 0, r: 200 }], keep: (x, y) => shoulder(x, y) || crest(x, y) });
  scatter(["glacier:giant_sword"], 4, IN, 200, { s: [0.8, 1.1], solid: [{ kind: "sword", x: 0, y: 0, r: 60 }], keep: (x, y) => shoulder(x, y) || crest(x, y) });
  scatter(["glacier:ice_block"], 6, IN, 160, { s: [0.5, 0.8], ringR: 110, keep: crest });
  prop("westmount:prayer_cairn", [-2100, 4700], 20, 200, { s: 0.75, ...ring(90) });
  scatter(["glacier:fang_peak"], 6, IN, 260, { s: [0.35, 0.6], ringR: 200, keep: basin });
  scatter(["glacier:fang_peak"], 4, IN, 260, { s: [0.35, 0.55], ringR: 200, keep: (x, y) => shoulder(x, y) || crest(x, y) });
  // the dead men's graves the rangers raised, cairns in a ring
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2, at: XY = [-1500 + Math.cos(a) * 450, 300 + Math.sin(a) * 450];
    if (free(at[0], at[1], 60)) prop("snowland:cairn", at, rnd() * 90, 70, ring(45));
  }

  // ---- rocks over it all, snow drifts, the wind-bent pines that hold on up here ----
  scatter(["snowland:snow_boulder", "snowland:rock_cluster", "snowland:flat_slabs", "northcold:iced_rocks"], 30, IN, 170, { s: [0.6, 1.05], ringR: 130 });
  scatter(["glacier:ice_block"], 8, IN, 150, { s: [0.45, 0.8], ringR: 110 });
  scatter(["snowland:snow_drift"], 16, IN, 230, { s: [0.7, 1.1], solid: "none" });
  scatter(["snowland:dead_branches", "snowland:dry_grass", "snowland:frost_shrub", "northcold:flattened_grass"], 40, IN, 90, { s: [0.7, 1.1], solid: "none" });
  scatter(["westmount:wind_pine"], 10, IN, 200, { s: [0.6, 0.9], ringR: 40, keep: (x, y) => !basin(x, y) });
  scatter(["westmount:wind_pine"], 5, IN, 200, { s: [0.55, 0.8], ringR: 40, keep: basin });
  // fallen rock at the foot of the cliffs
  for (const poly of [U, CR, SW, EW]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (inPoly(poly, mx + nx * 50, my + ny * 50)) [nx, ny] = [-nx, -ny];
      for (let t = 300; t < L - 200; t += 620) {
        const out = 300 + rnd() * 150, x = a[0] + ((b[0] - a[0]) * t) / L + nx * out, y = a[1] + ((b[1] - a[1]) * t) / L + ny * out;
        if (rnd() < 0.5 || !inBox(x, y) || !free(x, y, 110, 60)) continue;
        const s = 0.5 + rnd() * 0.3;
        prop(rnd() < 0.6 ? "snowland:snow_boulder" : "snowland:flat_slabs", [x, y], rnd() * 360, 140 * s, { s, solid: [{ kind: "rock", x: 0, y: 0, r: 110 }] });
      }
    }
  }
  const grove = (c: XY, r: number, n: number, kinds = ["SnowPine", "SnowPineSmall", "SnowPineSmall"]) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inBox(x, y) || !free(x, y, 170, 170)) continue;
      put(`flora:${kinds[Math.floor(rnd() * kinds.length)]}`, [x, y], rnd() * 360, { s: 0.65 + rnd() * 0.35 });
      taken.push([x, y, 170]);
      made++;
    }
  };
  for (const [c, r, n] of [[[-3600, 4700], 700, 6], [[-2600, 5000], 500, 3], [[-3300, -3600], 400, 2], [[-200, 4800], 400, 2], [[1500, 4500], 500, 3], [[2600, -3500], 400, 2]] as [XY, number, number][]) grove(c, r, n);

  // ---- past the edges: snowy pines on the walls' tops and down the low corner by the north sea
  // cliffs, wind-bent pines on the crest; nothing on the sea ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => [[0, 0], [300, 0], [-300, 0], [0, 300], [0, -300]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const seaward = (x: number, y: number) => inPoly(SEA, x - 300, y - 300);
  const onFang = (x: number, y: number) => FANGS.some(([c, r]) => Math.hypot(x - c[0], y - c[1]) < r + 200);
  f.woods(area, ["SnowPine", "SnowPine", "SnowPineSmall", "SnowPineSmall"], (x, y) => inside(x, y) || onTrack(x, y) || seaward(x, y) || onFang(x, y) || f.h(x, y) < 900, { count: 220, spacing: 460, tries: 5000 });
  f.woods(area, ["SnowPine", "SnowPineSmall", "FrostOak"], (x, y) => inside(x, y) || onTrack(x, y) || seaward(x, y) || onFang(x, y) || f.h(x, y) > 120, { count: 70, spacing: 420, tries: 3000 });
  f.woods(area, ["wind_pine"], (x, y) => inside(x, y) || onTrack(x, y) || seaward(x, y) || onFang(x, y) || f.h(x, y) < 400 || f.h(x, y) > 900, { count: 60, spacing: 600, tries: 3000, kit: "westmount" });
  f.woods(area, ["snow_boulder", "rock_cluster"], (x, y) => inside(x, y) || onTrack(x, y) || seaward(x, y) || onFang(x, y), { count: 60, spacing: 700, tries: 2000, kit: "snowland" });

  // ---- monsters: the ghosts over the battlefield, the titans on the open snow of the shoulder
  // and the crest ----
  const quiet = (x: number, y: number) => Math.hypot(x - TOWER[0] + 300, y - TOWER[1] + 300) < 1100 || Math.hypot(x - SWORD[0], y - SWORD[1]) < 500;
  f.monsterSpots(ground, IN, { step: 720, keepOut: quiet, max: 52 });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "frostfang_ranger", x: RANGER[0], y: RANGER[1], face: 200, name: "บียาร์กิ", title: "พรานชายแดนเฒ่า", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "blue", top: "top_warrior_forest", bottom: "bottom_warrior_black" },
      lines: [
        "หอนี้เคยมีทหารเฝ้าสิบสองคน คอยดูว่ายักษ์จะลงมาจากธารน้ำแข็งอีกหรือไม่ ตอนนี้เหลือข้าคนเดียว",
        "ยอดหินพวกนั้นเรียงกันเหมือนเขี้ยว พวกเราเรียกที่นี่ว่าขากรรไกรของภูเขา ใครเดินเข้ามาก็เหมือนเดินเข้าปาก",
        "คืนพระจันทร์เต็มดวง วิญญาณยักษ์จะลุกขึ้นจากกองกระดูก หยิบดาบหักขึ้นมาสู้กันต่อเหมือนสงครามยังไม่จบ",
      ],
    },
    {
      id: "frostfang_scavenger", x: SWORD[0] - 650, y: SWORD[1] - 300, face: 60, name: "ทอร์ฟริด", title: "นักล่าสมบัติสนามรบ", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "auburn", eyes: "amber", top: "top_adventurer_ochre", bottom: "bottom_adventurer_cocoa" },
      lines: [
        "เหล็กของดาบยักษ์เล่มนี้ดีกว่าเหล็กของช่างคนไหนในอาณาจักร แต่ข้าลองงัดมาสามวันแล้วมันไม่ขยับเลย",
        "ระวังไททันน้ำแข็งนะ เดินทีพื้นสั่นทั้งเนิน ได้ยินเสียงน้ำแข็งแตกเมื่อไหร่ให้หาที่หลบ",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery: [sea],
    sky: "#a8b6c6",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -4300, y: -470 },
    npcs,
    labels: [
      { x: S_EXIT[0] + 250, y: S_EXIT[1] + 250, text: "ทางไปเนินเขาวงกต", kind: "gate" },
      { x: W_EXIT[0] - 250, y: W_EXIT[1] - 150, text: "ทางไปหน้าผาทะเลเหนือ", kind: "gate" },
      { x: TOWER[0] - 900, y: TOWER[1], text: "หอเฝ้าระวังชายแดนร้าง" },
      { x: -1500, y: -500, text: "สนามรบของยักษ์" },
      { x: SWORD[0] - 400, y: SWORD[1], text: "ดาบยักษ์หัก", kind: "small" },
      { x: 3200, y: 600, text: "แนวยอดเขี้ยวน้ำแข็ง", kind: "small" },
      { x: -1500, y: 4300, text: "ไหล่เขาตะวันตก", kind: "small" },
      { x: -4200, y: -480, text: "ช่องเขาใต้", kind: "small" },
      { x: -1500, y: 750, text: "สุสานนักรบ", kind: "small" },
    ],
  });
}

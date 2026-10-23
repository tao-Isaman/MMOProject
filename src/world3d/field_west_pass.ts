// ช่องเขาตะวันตก (the western pass), monsters Lv 134-146: the old road over the western range,
// from the ancient forest down to Suzhou. Mountain walls stand over it on both sides, rising in
// steps to peaks past the edge, and the road climbs between them in switchbacks.
//
// From the forest it comes in at the east foot (north along it), turns up the first ramp onto a
// terrace, doubles back south along it and climbs again onto the crest. On the crest, where a spur
// of rock reaches out from each wall, the old frontier gatehouse stands across the pass: the road
// runs through its gate, between the tower still standing and the one fallen in. Past it the road
// drops in two more switchbacks down the west side into the valley under the peaks. A gorge cuts
// across the valley from wall to wall, so deep its bottom is lost in shadow; two rope bridges hung
// with prayer flags cross it, and the road goes on south over the first of them to the way down to
// Suzhou. Rockfalls lie at the feet of the walls, wind-bent pines cling to the terraces, and
// pilgrims' cairns mark the crest and the valley.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: east -> elder_forest, south -> suzhou

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { KIT as WESTMOUNT, FORT_SOLIDS, BRIDGE_SOLIDS, CHASM_DEPTH, smooth, band, toLine, nearestOn, pieces, dense, towards, runAlong, rampOff, beyond } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import { KIT as SNOW } from "./kits/snowland";
import { KIT as STEPPE } from "./kits/steppe";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as ICEBERG } from "./kits/iceberg";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(WESTMOUNT, SNOW, STEPPE, TRUNRADA, ICEBERG);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the levels: the east foot (0), terrace A (350), the crest (700), terrace B (350), the west
// valley (0); each extends in under the walls and the next step ----
const TA: XY[] = [[-2200, -3300], [-800, -3400], [600, -3250], [2000, -3400], [3200, -3250], [4400, -3350], [4400, -1000], [-2200, -1000]];
const CREST: XY[] = [[-2200, -1600], [-600, -1650], [800, -1550], [2200, -1700], [3400, -1550], [4400, -1600], [4400, 400], [3200, 450], [1800, 350], [400, 450], [-1000, 350], [-2200, 400]];
const TB: XY[] = [[-2200, -200], [4400, -200], [4400, 2100], [3000, 2200], [1600, 2050], [200, 2150], [-1000, 2050], [-1400, 1800], [-2200, 1700]];
const RA1 = rampOff([2000, -3400], [3200, -3250], [2600, -2000], 1100, 460);
const RC1 = rampOff([-600, -1650], [800, -1550], [100, -500], 950, 440);
const RC2 = rampOff([1800, 350], [3200, 450], [2500, -500], 950, 440);
const RB1 = rampOff([-1000, 2050], [200, 2150], [-400, 800], 1000, 460);
// the walls: the south (S1) and north (N1) massifs, their spurs at the gatehouse, the peaks behind
// them (S2, N2) and the western walls past the valley (W1, W2)
const S1: XY[] = [[-A, -A], [-1500, -A], [-1400, -6000], [-1700, -4600], [-1300, -3400], [-1600, -2200], [-1300, -1400], [-1500, -500], [-1300, 350], [-1500, 1000], [-1300, 1800], [-2000, 2000], [-3500, 1850], [-5000, 2000], [-6500, 1900], [-A, 2000]];
const S_SPUR: XY[] = [[-1700, -1700], [-1200, -1450], [-100, -1150], [50, -500], [-150, 150], [-1200, 450], [-1800, 300], [-1900, -800]];
const N1: XY[] = [[3800, -A], [A, -A], [A, A], [3900, A], [4100, 5000], [3700, 3200], [4000, 1800], [3800, 900], [3800, -300], [3900, -1600], [4000, -2600], [3800, -3600], [4100, -4800], [3700, -6000]];
const N_SPUR: XY[] = [[4200, -1900], [3400, -1500], [2700, -1250], [2600, -800], [2700, -150], [3500, 250], [4300, -300], [4600, -1100]];
const S2: XY[] = [[-A, -A], [-3200, -A], [-3000, -5000], [-3400, -2500], [-3000, -600], [-3600, 800], [-6000, 900], [-A, 800]];
const N2: XY[] = [[5400, -A], [A, -A], [A, A], [5600, A], [5800, 4000], [5300, 1500], [5600, -500], [5200, -3000], [5600, -6000]];
const W1: XY[] = [[-A, A], [-A, 6300], [-5000, 6000], [-2000, 6300], [1000, 5900], [3900, 6200], [4200, A]];
const W2: XY[] = [[-A, A], [-A, 7500], [-3000, 7300], [0, 7600], [3000, 7300], [4200, A]];

// ---- the gorge across the valley, from the south wall to the western wall ----
const GORGE: XY[] = smooth([[-2450, 2150], [-2750, 2900], [-2600, 3700], [-2900, 4700], [-2700, 5500], [-2850, 6050]], 6);
const GW = 650; // between its walls

const FORT: XY = [1200, -500];
const CAIRNS: XY = [1600, 4100];

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(310, {
    hills: [
      { x: 1500, y: -4600, r: 900, h: 80 }, { x: -600, y: -4300, r: 700, h: 60 }, { x: 1800, y: 4200, r: 1200, h: 120 },
      { x: -1200, y: 4800, r: 800, h: -80 }, { x: 2800, y: 2700, r: 700, h: 70 }, { x: -4400, y: 4700, r: 800, h: 90 },
    ],
    plateaus: [
      { poly: dense(TA), h: 350, ramps: [RA1] },
      { poly: dense(TB), h: 350, ramps: [RB1] },
      { poly: dense(CREST), h: 700, ramps: [RC1, RC2] },
      { poly: dense(S1, 700), h: 1000 },
      { poly: dense(N1, 700), h: 1200 },
      { poly: dense(S_SPUR), h: 1400 },
      { poly: dense(N_SPUR), h: 1600 },
      { poly: dense(S2, 900), h: 1800 },
      { poly: dense(N2, 900), h: 1900 },
      { poly: dense(W1, 800), h: 900 },
      { poly: dense(W2, 900), h: 1500 },
    ],
    rock: "Westmount_CliffGranite",
  });
  const { put, rnd } = f;

  // ---- the crossings of the gorge ----
  const cross = (guess: XY) => {
    const n = nearestOn(GORGE, guess);
    let ax: XY = [-n.dir[1], n.dir[0]];
    if (ax[0] > 0) ax = [-ax[0], -ax[1]]; // (from the north side to the south)
    return { at: n.at, ax, off: (k: number): XY => [n.at[0] + ax[0] * k, n.at[1] + ax[1] * k] };
  };
  const B1 = cross([-2650, 3350]), B2 = cross([-2800, 5000]);

  // ---- the road and the paths ----
  const E_EXIT: XY = [600, -5150], S_EXIT: XY = [-5150, 3600];
  const ROAD: XY[] = [
    ...smooth([[400, -7600], E_EXIT, [1200, -4950], [2300, -4850], beyond(RA1.top, RA1.bottom, 400)]), RA1.bottom, RA1.top,
    ...smooth([beyond(RA1.bottom, RA1.top, 350), [2300, -2750], [1300, -2600], [600, -2850], beyond(RC1.top, RC1.bottom, 330)]), RC1.bottom, RC1.top,
    ...smooth([beyond(RC1.bottom, RC1.top, 300), [500, -1150], [1150, -950], [FORT[0], FORT[1] - 300]]), [FORT[0], FORT[1] + 300],
    ...smooth([[1250, -150], [1900, 150], beyond(RC2.bottom, RC2.top, 350)]), RC2.top, RC2.bottom,
    ...smooth([beyond(RC2.top, RC2.bottom, 330), [1900, 1550], [800, 1500], [-100, 1650], beyond(RB1.bottom, RB1.top, 300)]), RB1.top, RB1.bottom,
    ...smooth([beyond(RB1.top, RB1.bottom, 350), [-1100, 3500], [-1700, 3450], B1.off(-950)]),
    ...smooth([B1.off(950), [-4100, 3450], S_EXIT, [-7600, 3650]]),
  ];
  const LOOP: XY[] = [...smooth([[-1700, 3450], [-1400, 4300], [-1900, 4950], B2.off(-950)]), ...smooth([B2.off(950), [-4300, 4700], [-4300, 4000], [-4150, 3500]])];
  const CAIRN_WAY: XY[] = smooth([[-1100, 3500], [0, 3700], [900, 3900], [CAIRNS[0] - 300, CAIRNS[1] - 100]]);
  const TRACKS = [ROAD, LOOP, CAIRN_WAY];
  const roads = TRACKS.map((t, i) => band(t, i === 0 ? 460 : 380));

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const gorgeHole = band(GORGE, GW + 50);
  const ground = f.ground({ area, roads, plazas: [], water: [gorgeHole], base: "rock", road: [0.95, 0.88, 0.78] });

  // ---- the gorge: its walls going down out of sight, a torrent far below, the bridges ----
  const torrent = f.waterSheet({ x0: -3600, x1: -1800, y0: 1800, y1: 6600 }, -700, "Westmount_Torrent");
  const sunk = { solid: "none" as const, z: -CHASM_DEPTH };
  {
    const cum = [0];
    for (let i = 1; i < GORGE.length; i++) cum.push(cum[i - 1] + Math.hypot(GORGE[i][0] - GORGE[i - 1][0], GORGE[i][1] - GORGE[i - 1][1]));
    const L = cum[cum.length - 1];
    for (let s = 250; s < L - 200; s += 540) {
      let i = 1;
      while (i < GORGE.length - 1 && cum[i] < s) i++;
      const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1), a = GORGE[i - 1], b = GORGE[i];
      const p: XY = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const n: XY = [-(b[1] - a[1]) / dl, (b[0] - a[0]) / dl];
      for (const sg of [-1, 1]) put("westmount:chasm_wall", [p[0] + n[0] * sg * GW / 2, p[1] + n[1] * sg * GW / 2], towards(-n[0] * sg, -n[1] * sg), sunk);
    }
    // its two ends, shut
    const e0 = GORGE[0], e1 = GORGE[GORGE.length - 1];
    put("westmount:chasm_wall", [e0[0], e0[1] - 40], towards(0, 1), sunk);
    put("westmount:chasm_wall", [e1[0], e1[1] + 40], towards(0, -1), sunk);
  }
  for (const part of pieces([[GORGE[0][0], GORGE[0][1] - 350], ...GORGE, [GORGE[GORGE.length - 1][0], GORGE[GORGE.length - 1][1] + 350]], [B1.at, B2.at], 140)) f.blockBand(part, GW + 120, { step: 220, kind: "chasm" });
  put("westmount:gorge_bridge", B1.at, runAlong(B1.ax[0], B1.ax[1]), { solid: BRIDGE_SOLIDS });
  put("westmount:gorge_bridge", B2.at, runAlong(B2.ax[0], B2.ax[1]), { solid: BRIDGE_SOLIDS });

  // ---- ways out ----
  f.exit("elder_forest", E_EXIT, [800, -4450]);
  f.exit("suzhou", S_EXIT, [-4450, 3550]);

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const deep = (x: number, y: number, d: number) => toLine([x, y], GORGE) < GW / 2 + 120 + d;
  const free = (x: number, y: number, r: number, gap = 0) =>
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    !deep(x, y, r) && f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    take(at[0], at[1], r);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });
  const inBox = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, o: (s: number) => Parameters<typeof put>[3] = () => ({}), where = inBox) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!where(x, y) || nearTrack(x, y, rad + 230) || !free(x, y, rad, 40)) continue;
      const s = 0.8 + rnd() * 0.4;
      put(ref, [x, y], rnd() * 360, { s, ...o(s) });
      take(x, y, rad * s);
      made++;
    }
  };
  for (const t of TRACKS) for (let i = 0; i < t.length; i += 2) take(t[i][0], t[i][1], 200);
  take(B1.at[0], B1.at[1], 950);
  take(B2.at[0], B2.at[1], 950);

  // ---- the gatehouse across the crest, walls from it to the spurs ----
  prop("westmount:frontier_fort", FORT, 90, 1100, { solid: FORT_SOLIDS });
  prop("westmount:fort_wall", [2420, FORT[1]], 90, 300, { sy: 0.62 });
  prop("westmount:fort_wall", [80, FORT[1]], 90, 200, { sy: 0.4 });
  for (const [at, h, s] of [[[300, -1300], 20, 0.8], [[2200, 300], 200, 0.7]] as [XY, number, number][]) prop("westmount:rockfall", at, h, 450 * s, { s, ...ring(330 * s) });
  prop("iceberg:brazier", [FORT[0] - 400, FORT[1] - 650], 0, 60, ring(40, "post"));
  prop("iceberg:brazier", [FORT[0] + 400, FORT[1] - 650], 0, 60, ring(40, "post"));
  if (free(-200, -1350, 90)) prop("westmount:prayer_cairn", [-200, -1350], 40, 160, { s: 0.75, ...ring(90) });
  prop("snowland:supply_cache", [2200, -1250], 120, 220, { solid: [{ kind: "box", x: -10, y: 0, w: 330, d: 140, rot: 0 }] });
  prop("trunrada:banner_pole", [1900, -1350], 0, 60, ring(25, "post"));

  // ---- the cairns in the valley: a pilgrims' ground under the north wall ----
  prop("westmount:prayer_cairn", CAIRNS, 0, 260, ring(110));
  for (const [dx, dy, s] of [[700, 500, 0.7], [-500, 700, 0.6], [400, -700, 0.65], [900, -200, 0.55]] as const) prop("westmount:prayer_cairn", [CAIRNS[0] + dx, CAIRNS[1] + dy], rnd() * 360, 200 * s, { s, ...ring(110 * s) });
  for (const [dx, dy] of [[-300, -500], [200, 900], [-700, 200]] as const) prop("snowland:cairn", [CAIRNS[0] + dx, CAIRNS[1] + dy], rnd() * 90, 70, ring(45));
  // at the bridges and the turns of the road
  for (const at of [B1.off(-1150), B1.off(1150), B2.off(-1150), B2.off(1150)]) {
    const side: XY = [at[0] + (rnd() - 0.5) * 100, at[1] + 380];
    if (free(side[0], side[1], 80)) prop("snowland:cairn", side, rnd() * 90, 70, ring(45));
  }
  for (const at of [[3100, -3800], [-300, -2400], [600, -1900], [2900, 1000], [-700, 1300], [-600, 2700]] as XY[]) if (free(at[0], at[1], 80)) prop("snowland:cairn", at, rnd() * 90, 70, ring(45));

  // ---- the ways out ----
  prop("snowland:trail_sign", [350, -4800], 90, 80, ring(30, "post"));
  prop("westmount:prayer_cairn", [1000, -5000], 0, 160, { s: 0.6, ...ring(70) });
  prop("snowland:trail_sign", [-4800, 3250], 0, 80, ring(30, "post"));
  prop("steppe:signpost", [-4850, 3950], 0, 80, ring(30, "post"));

  // ---- rockfalls under the walls, boulders over the floors ----
  const ROCKFALLS: [XY, number, number][] = [
    [[-800, -4600], 0.8, 30], [[3300, -4500], 0.9, 100], [[2800, 2700], 0.9, 200], [[3200, 4800], 1.0, 300], [[-1700, 2500], 0.7, 60],
    [[-4600, 2500], 0.75, 150], [[-4300, 5200], 0.8, 250], [[-200, 5200], 0.85, 10], [[3200, -2200], 0.7, 90], [[-900, 700], 0.6, 0],
  ];
  for (const [at, s, h] of ROCKFALLS) if (free(at[0], at[1], 330 * s)) prop("westmount:rockfall", at, h, 460 * s, { s, ...ring(320 * s) });
  scatter("snowland:snow_boulder", [0, 0], 5200, 8, 130, (s) => ring(110 * s));
  scatter("steppe:boulder", [0, 0], 5200, 10, 130, (s) => ring(110 * s));
  scatter("steppe:rock_cluster", [0, 0], 5200, 8, 160, (s) => ring(130 * s));
  scatter("steppe:boulder_flat", [0, 0], 5200, 8, 140, () => ({ solid: "none" }));

  // ---- wind-bent pines on the terraces and in the valley, leaning away from the west wind ----
  const pine = (at: XY, s: number) => prop("westmount:wind_pine", at, 180 + (rnd() - 0.5) * 40, 200, { s, ...ring(40) });
  for (const [c, r, n] of [
    [[1500, -4100], 900, 4], [[2300, -2300], 600, 3], [[-500, -2600], 500, 2], [[2900, -900], 400, 2], [[-500, -400], 400, 2],
    [[1400, 900], 500, 3], [[-800, 900], 400, 2], [[300, 3000], 800, 4], [[2400, 3800], 900, 4], [[-1300, 4200], 500, 2],
    [[-4400, 3000], 500, 2], [[-4000, 5100], 500, 2], [[700, 5000], 600, 3], [[3300, 2000], 400, 2], [[-200, -5000], 400, 2],
  ] as [XY, number, number][]) {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inBox(x, y) || nearTrack(x, y, 380) || !free(x, y, 200, 150)) continue;
      pine([x, y], 0.75 + rnd() * 0.45);
      made++;
    }
  }
  scatter("flora:PineSmall", [0, 0], 5200, 14, 150, () => ({}));
  scatter("steppe:grass_tuft", [0, 0], 5300, 60, 60, () => ({ solid: "none" }));
  scatter("snowland:dry_grass", [0, 0], 5300, 40, 60, () => ({ solid: "none" }));
  scatter("steppe:scrub", [0, 0], 5300, 20, 90, () => ({ solid: "none" }));
  scatter("steppe:dead_tree", [0, 0], 5200, 5, 120, () => ring(35, "tree"));

  // ---- the walls' tops and the ways on past the edge: pines bent by the wind ----
  const onTrack = (x: number, y: number) => [[0, 0], [300, 0], [-300, 0], [0, 300], [0, -300]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const inside = (x: number, y: number) => Math.abs(x) < R + 300 && Math.abs(y) < R + 300;
  f.woods(area, ["Pine", "PineSmall", "Pine", "SnowPineSmall"], (x, y) => (inside(x, y) && f.h(x, y) < 950) || onTrack(x, y) || deep(x, y, 200), { count: 420, spacing: 520, tries: 6000 });
  f.woods(area, ["wind_pine"], (x, y) => (inside(x, y) && f.h(x, y) < 950) || onTrack(x, y) || deep(x, y, 200), { count: 70, spacing: 900, tries: 2000, kit: "westmount" });
  for (let i = 0; i < 40; i++) {
    const x = (rnd() - 0.5) * 2 * A, y = (rnd() - 0.5) * 2 * A;
    if (inside(x, y) || onTrack(x, y) || !f.level(x, y, 300)) continue;
    put(rnd() < 0.5 ? "westmount:rockfall" : "snowland:snow_boulder", [x, y], rnd() * 360, { solid: "none", s: 0.6 + rnd() * 0.5 });
  }

  // ---- monsters ----
  const quiet = (x: number, y: number) => Math.hypot(x - FORT[0], y - FORT[1]) < 900 || Math.hypot(x - CAIRNS[0], y - CAIRNS[1]) < 700;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 720, keepOut: quiet });

  const npcs: NpcSpec[] = [
    { id: "west_pass_veteran", x: 500, y: -1250, face: 200, name: "เกรเกอร์", title: "ยามเฒ่าแห่งด่านชายแดน", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "blue", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "ด่านนี้เคยกั้นพรมแดนระหว่างโนอากับเมืองท่าทางตะวันตก ตอนนี้เหลือแค่ข้ากับลมหนาว",
        "หอฝั่งเหนือถล่มลงมาในศึกครั้งสุดท้าย ก้อนหินยังกองอยู่อย่างนั้นตั้งแต่วันนั้น",
        "ลงทางตะวันตกไปจะเจอหุบเหว ข้ามสะพานเชือกแล้วเดินลงใต้ก็ถึงซูโจว",
      ] },
    { id: "west_pass_pilgrim", x: CAIRNS[0] - 450, y: CAIRNS[1] - 300, face: 160, name: "เหม่ยหลิง", title: "ผู้แสวงบุญแห่งช่องเขา", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "amber", top: "top_priestess_white", bottom: "bottom_priestess_wine" },
      lines: [
        "ธงมนต์ทุกผืนฝากคำอธิษฐานไปกับลม ให้คนข้ามเขาไปถึงปลายทางโดยปลอดภัย",
        "ใต้สะพานเชือกนั่นลึกจนมองไม่เห็นก้นเหว อย่าก้มมองนานนักล่ะ",
        "สัตว์ประหลาดบนช่องเขานี้แข็งแกร่งยิ่งกว่าที่ใดในแดนตะวันตก อย่าประมาทเชียว",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [torrent],
    sky: "#a3b0bb",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 900, y: -4300 },
    npcs,
    labels: [
      { x: E_EXIT[0], y: E_EXIT[1] + 250, text: "ทางไปป่าโบราณ", kind: "gate" },
      { x: S_EXIT[0] + 200, y: S_EXIT[1], text: "ทางไปซูโจว", kind: "gate" },
      { x: FORT[0] + 1300, y: FORT[1] - 300, text: "ด่านชายแดนเก่า" },
      { x: B1.at[0] + 300, y: B1.at[1] + 900, text: "หุบเหวสะพานเชือก" },
      { x: CAIRNS[0] + 300, y: CAIRNS[1] + 300, text: "ลานธงมนต์" },
      { x: 1500, y: -2300, text: "ทางขึ้นช่องเขา", kind: "small" },
      { x: 2600, y: -800, text: "สันช่องเขา", kind: "small" },
      { x: 1000, y: 3000, text: "หุบเขาตะวันตก" },
      { x: 1500, y: -4300, text: "เชิงเขาตะวันออก", kind: "small" },
    ],
  });
}

// ภูผาหินปูน (the karst peaks), monsters Lv 98-110: limestone country north of the ancient
// forest, on the way up to the downs. Sheer towers of pale rock stand everywhere out of a green
// floor, green on their ledges and tops, mist lying round their feet; a jade-green river winds
// through it from the north-west to the south, bamboo rafts drifting on it.
//
// The road keeps to the east bank from the way in from the forest (south) to the way on to the
// downs (north), past a lotus pond and the raftsmen's landing. A stone slab bridge crosses to the
// west bank, where bamboo groves crowd round a tower of two steps: two flights of stone stairs
// climb it to a red pavilion on its top, looking out over the river. On the east bank a broad
// tower can be climbed by an earth ramp to a lookout among the peaks, and in the south-east a
// low terrace with a pillar rising from it. The rest of the towers stand sheer, with no way up.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: south -> elder_forest, north -> highland_downs

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { KIT as WESTMOUNT, SLAB_BRIDGE_SOLIDS, smooth, band, sheet, blob, inPoly, toLine, nearestOn, pieces, dense, towards, runAlong, rampOff, beyond } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as OSAKI } from "./kits/osaki";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(WESTMOUNT, PLAINS, OSAKI);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the river: in from the north edge, winding south-west, out at the south edge ----
const RIVER: XY[] = smooth([[A, 3200], [6000, 2600], [4200, 3400], [2600, 2400], [1000, 2900], [-600, 1900], [-2200, 2500], [-3800, 1600], [-5600, 2300], [-A, 1800]], 6);
const RW = 700;

// ---- the towers you can climb ----
// the pavilion's tower on the west bank: a first step (400) and the top (800), stone stairs up each
const P1: XY[] = [[-4100, 3200], [-2400, 3100], [-700, 3500], [-500, 4400], [-700, 5300], [-2400, 5500], [-4100, 5200], [-4400, 4200]];
const P2: XY[] = [[-2300, 4100], [-1200, 4100], [-1000, 4700], [-1300, 5150], [-2300, 5050]];
const ST1 = rampOff([-700, 3500], [-500, 4400], [-2000, 4300], 1200, 430, true);
const ST2 = rampOff([-2300, 5050], [-2300, 4100], [-1600, 4600], 1200, 430, true);
// the lookout on the east bank (500) and the low terrace in the south-east (350) with its pillar
const P3: XY = [2600, -2700];
const P3P: XY[] = blob(P3, 1150, 1300, 3, 20);
const R3 = rampOff(P3P[3], P3P[4], P3, 1400, 440);
const P4: XY = [-3000, -3300];
const P4P: XY[] = blob(P4, 1100, 1000, 7, 20);
const R4 = rampOff(P4P[0], P4P[1], P4, 1050, 440);
const P4PILLAR: XY[] = blob([-3300, -3500], 450, 420, 9, 16);
// sheer towers (no way up): in the field and all round past its edge
const TOWERS: [XY, number, number][] = [
  [[4300, -4300], 900, 2400], [[-500, -4600], 750, 1900], [[400, -3800], 600, 1500], [[2300, 1300], 550, 1700],
  [[-3500, 450], 550, 1500], [[2800, 4600], 700, 2000], [[4100, 5000], 650, 1800], [[-4800, -1700], 600, 1600],
  [[-6800, -6500], 1200, 2600], [[-7000, -2600], 1000, 2200], [[-7200, 4000], 1300, 2800], [[-6500, 7000], 1000, 2400],
  [[0, -7200], 1300, 2600], [[3600, -7000], 1000, 2100], [[-3500, -7300], 1100, 2300], [[7000, -4000], 1200, 2800],
  [[7400, -1500], 800, 2100], [[7000, 6500], 1100, 2600], [[2500, 7300], 1000, 2300], [[-2500, 7500], 1200, 2500],
  [[6500, 4900], 900, 2200], [[-7600, 700], 700, 1900],
];

const PAVILION: XY = [-1700, 4600];
const POND_C: XY = [-1500, 800];
const POND = blob(POND_C, 850, 650, 5, 22);
const LANDING: XY = [3800, 2350];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(307, {
    hills: [
      { x: -4000, y: -900, r: 900, h: 70 }, { x: 1200, y: 1100, r: 900, h: 90 }, { x: 4600, y: -2000, r: 900, h: 80 },
      { x: -1200, y: -2400, r: 700, h: -70 }, { x: 4900, y: 4300, r: 500, h: 60 },
    ],
    plateaus: [
      { poly: dense(P1), h: 400, ramps: [ST1] },
      { poly: dense(P2), h: 800, ramps: [ST2] },
      { poly: dense(P3P), h: 500, ramps: [R3] },
      { poly: dense(P4P), h: 350, ramps: [R4] },
      { poly: dense(P4PILLAR, 400), h: 1600 },
      ...TOWERS.map(([c, r, h], i) => ({ poly: dense(blob(c, r, r * (0.8 + (i % 3) * 0.1), 11 + i, 18), 450), h })),
    ],
    rock: "Westmount_CliffLime",
  });
  const { put, rnd } = f;

  // ---- the bridge over the river ----
  const nb = nearestOn(RIVER, [1500, 2750]);
  let bax: XY = [-nb.dir[1], nb.dir[0]];
  if (bax[1] < 0) bax = [-bax[0], -bax[1]];
  const BR = { at: nb.at, off: (k: number): XY => [nb.at[0] + bax[0] * k, nb.at[1] + bax[1] * k] };

  // ---- the road and the paths ----
  const S_EXIT: XY = [-5150, -800], N_EXIT: XY = [5150, 600];
  const ROAD: XY[] = smooth([[-7600, -900], S_EXIT, [-3800, -650], [-2400, -300], [-900, -450], [400, -150], [1700, -600], [3200, -350], [4300, 450], N_EXIT, [7600, 650]]);
  const BRIDGE_WAY: XY[] = [...smooth([[400, -150], [900, 900], [1300, 1700], BR.off(-850)]), ...smooth([BR.off(850), [1300, 3700], beyond(ST1.top, ST1.bottom, 400)])];
  const STAIRS: XY[] = [ST1.bottom, ST1.top, ...smooth([beyond(ST1.bottom, ST1.top, 300), [-950, 3550], [-2000, 3450], [-3000, 3600], [-3400, 4000], beyond(ST2.top, ST2.bottom, 250)]), ST2.bottom, ST2.top, beyond(ST2.bottom, ST2.top, 250)];
  const LOOKOUT_WAY: XY[] = [...smooth([[3650, -80], beyond(R3.top, R3.bottom, 400)]), R3.bottom, R3.top, ...smooth([beyond(R3.bottom, R3.top, 400), [P3[0] + 100, P3[1] + 300]])];
  const TERRACE_WAY: XY[] = [...smooth([[-2400, -300], [-1500, -1200], [-700, -2200], beyond(R4.top, R4.bottom, 400)]), R4.bottom, R4.top, ...smooth([beyond(R4.bottom, R4.top, 350), [-2700, -2900]])];
  const POND_WAY: XY[] = smooth([[-900, -450], [-600, 150], [-450, 650]]);
  const LANDING_WAY: XY[] = smooth([[3200, -350], [3500, 900], [3700, 1700], LANDING]);
  const TRACKS = [ROAD, BRIDGE_WAY, STAIRS, LOOKOUT_WAY, TERRACE_WAY, POND_WAY, LANDING_WAY];
  const roads = TRACKS.map((t, i) => band(t, i === 0 ? 460 : i === 2 ? 420 : 380));

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ground = f.ground({ area, roads, plazas: [], water: [band(RIVER, RW), POND], base: "grass", road: [0.86, 0.78, 0.66] });

  // ---- the river and the pond: green water over a dark bed ----
  const bed = sheet(band(RIVER, RW + 160), -70, "Westmount_CliffMoss");
  const river = sheet(band(RIVER, RW + 120), -14, "Westmount_River");
  const pondBed = sheet(blob(POND_C, 950, 750, 5, 22), -60, "Westmount_CliffMoss");
  const pond = sheet(blob(POND_C, 920, 720, 5, 22), -14, "Westmount_River");
  for (const part of pieces(RIVER, [BR.at], 170)) f.blockBand(part, RW + 60, { step: 230 });
  f.blockBand([...POND, POND[0]], 180, { step: 200 });
  f.extra.push({ kind: "water", x: POND_C[0], y: POND_C[1], r: 500 });
  put("westmount:slab_bridge", BR.at, runAlong(bax[0], bax[1]), { solid: SLAB_BRIDGE_SOLIDS });

  // ---- ways out ----
  f.exit("elder_forest", S_EXIT, [-4450, -750]);
  f.exit("highland_downs", N_EXIT, [4450, 500]);

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const wet = (x: number, y: number, d: number) => toLine([x, y], RIVER) < RW / 2 + d || inPoly(POND, x, y) || Math.hypot(x - POND_C[0], y - POND_C[1]) < 800 + d;
  const free = (x: number, y: number, r: number, gap = 0) =>
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    !wet(x, y, r * 0.5) && f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
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
  take(BR.at[0], BR.at[1], 900);

  // ---- the pavilion's tower: the stairs, the pavilion on the top ----
  for (const st of [ST1, ST2]) put("westmount:stone_stairs", [(st.top[0] + st.bottom[0]) / 2, (st.top[1] + st.bottom[1]) / 2], runAlong(st.top[0] - st.bottom[0], st.top[1] - st.bottom[1]), { solid: "none" });
  for (const s of [-1, 1]) {
    const d: XY = [ST1.top[0] - ST1.bottom[0], ST1.top[1] - ST1.bottom[1]], L = Math.hypot(d[0], d[1]);
    prop("osaki:stone_lantern", [ST1.bottom[0] - (d[0] / L) * 150 - (d[1] / L) * s * 330, ST1.bottom[1] - (d[1] / L) * 150 + (d[0] / L) * s * 330], 0, 70, ring(35, "post"));
  }
  prop("westmount:cliff_pavilion", PAVILION, towards(-1, 0), 520, { solid: [{ kind: "post", x: 0, y: 0, r: 120 }, ...[0, 1, 2, 3, 4, 5].filter((k) => k !== 2 && k !== 3).map((k) => ({ kind: "post", x: Math.cos(Math.PI / 6 + (k * Math.PI) / 3) * 280, y: Math.sin(Math.PI / 6 + (k * Math.PI) / 3) * 280, r: 40 }))] });
  prop("westmount:wind_pine", [-1150, 5000], 140, 200, { s: 0.8, ...ring(40) });
  prop("westmount:wind_pine", [-2200, 3950], 200, 200, { s: 0.7, ...ring(40) });
  prop("westmount:mist_bank", [-2900, 4300], 20, 0, { solid: "none", s: 0.8 });

  // ---- the lookout on the east bank and the terrace in the south-east ----
  prop("westmount:prayer_cairn", [P3[0] + 300, P3[1] - 300], 30, 180, { s: 0.7, ...ring(90) });
  prop("westmount:wind_pine", [P3[0] + 700, P3[1] + 200], 160, 200, { s: 0.9, ...ring(40) });
  prop("westmount:wind_pine", [P3[0] - 500, P3[1] - 700], 200, 200, { s: 0.75, ...ring(40) });
  prop("osaki:stone_lantern", [P3[0] - 200, P3[1] + 500], 0, 70, ring(35, "post"));

  // ---- the lotus pond, the raftsmen's landing and the rafts ----
  prop("westmount:lotus_pond", POND_C, 10, 0, { solid: "none", s: 0.85 });
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2, at: XY = [POND_C[0] + Math.cos(a) * 980, POND_C[1] + Math.sin(a) * 780];
    if (nearTrack(at[0], at[1], 280)) continue;
    put(k % 3 === 0 ? "plains:flat_rock" : "plains:reeds", at, rnd() * 360, { s: 0.7 + rnd() * 0.3, solid: "none" });
  }
  const nl = nearestOn(RIVER, LANDING);
  prop("osaki:pier", [nl.at[0] + (LANDING[0] - nl.at[0]) * 0.45, nl.at[1] + (LANDING[1] - nl.at[1]) * 0.45], towards(LANDING[0] - nl.at[0], LANDING[1] - nl.at[1]), 300, { solid: "none" });
  prop("westmount:bamboo_raft", [nl.at[0] + 100, nl.at[1] - 120], runAlong(nl.dir[0], nl.dir[1]), 0);
  for (const g of [[5600, 2750], [1800, 2650], [-1500, 2250], [-4500, 2000]] as XY[]) {
    const n = nearestOn(RIVER, g);
    put("westmount:bamboo_raft", n.at, runAlong(n.dir[0], n.dir[1]) + (rnd() - 0.5) * 30);
  }
  prop("trunrada:campfire", [LANDING[0] - 300, LANDING[1] - 600], 0, 150, ring(70));
  prop("common:crate", [LANDING[0] + 200, LANDING[1] - 500], 20, 60);
  prop("common:crate", [LANDING[0] + 260, LANDING[1] - 430], 60, 60);

  // ---- mist round the towers' feet and over the water ----
  const MIST: [XY, number, number][] = [
    [[-3600, 2600], 60, 1], [[200, 2400], 100, 0.9], [[2900, 3000], 20, 0.8], [[4800, 2800], 80, 1], [[-500, -3800], 40, 0.9],
    [[3700, -4300], 120, 0.9], [[1000, -3000], 60, 0.7], [[-4200, -1800], 20, 0.8], [[2600, 600], 90, 0.7], [[-3200, 300], 0, 0.7],
    [[3100, 4400], 30, 0.8], [[-2600, -2200], 70, 0.8], [[4800, -1500], 10, 0.7], [[-5000, 3200], 50, 1],
  ];
  for (const [at, h, s] of MIST) put("westmount:mist_bank", at, h, { solid: "none", s });

  // ---- the ways out ----
  prop("plains:signpost", [-4850, -1150], 0, 80, ring(30, "post"));
  prop("osaki:stone_lantern", [-4900, -400], 0, 70, ring(35, "post"));
  prop("plains:signpost", [4900, 950], 180, 80, ring(30, "post"));
  prop("osaki:stone_lantern", [4950, 200], 0, 70, ring(35, "post"));

  // ---- bamboo groves on both banks ----
  const bamboo = (c: XY, r: number, n: number) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inBox(x, y) || nearTrack(x, y, 330) || !free(x, y, 120, 60)) continue;
      put("flora:Bamboo", [x, y], rnd() * 360, { s: 0.9 + rnd() * 0.5 });
      take(x, y, 130);
      made++;
    }
  };
  for (const [c, r, n] of [
    [[-3700, 3400], 700, 9], [[-300, 3300], 600, 6], [[400, 4700], 800, 10], [[1900, 4000], 700, 8], [[-4600, 4900], 500, 5],
    [[-2600, 1100], 600, 6], [[-400, 1300], 500, 5], [[2000, 1000], 600, 6], [[4600, 1500], 600, 6], [[-4100, -300], 500, 4],
    [[200, -1500], 600, 5], [[3800, -1200], 500, 4], [[-1800, -1700], 500, 4], [[1200, -4600], 500, 4], [[-4300, -4400], 500, 4],
  ] as [XY, number, number][]) bamboo(c, r, n);

  // ---- rocks and greenery over the floor ----
  scatter("plains:boulder", [0, 0], 5200, 10, 160, (s) => ring(130 * s));
  scatter("plains:rock_cluster", [0, 0], 5200, 6, 180, (s) => ring(140 * s));
  scatter("westmount:karst_spire", [0, 0], 5000, 3, 420, (s) => ring(260 * s));
  scatter("flora:RoundTree", [0, 0], 5200, 12, 200, () => ({}));
  scatter("flora:SmallTree", [0, 0], 5200, 10, 160, () => ({}));
  scatter("flora:Bush", [0, 0], 5300, 45, 80, () => ({ solid: "none" }));
  scatter("plains:tall_grass", [0, 0], 5300, 80, 60, () => ({ solid: "none" }));
  scatter("plains:fern_clump", [0, 0], 5300, 30, 60, () => ({ solid: "none" }));
  // spires standing in the river
  for (const g of [[4900, 3000], [-2900, 2050], [-6500, 2050], [6800, 2850]] as XY[]) {
    const n = nearestOn(RIVER, g);
    put("westmount:karst_spire", [n.at[0] + (rnd() - 0.5) * 120, n.at[1] + (rnd() - 0.5) * 120], rnd() * 360, { s: 0.45 + rnd() * 0.2, ...ring(150) });
  }
  // the reeds and rocks along the banks
  for (let i = 2; i < RIVER.length - 2; i += 2) {
    const [ax, ay] = RIVER[i], [bx, by] = RIVER[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
    for (const s of [-1, 1]) {
      if (rnd() < 0.4) continue;
      const o = RW / 2 + 60 + rnd() * 100, x = ax - ((by - ay) / L) * s * o, y = ay + ((bx - ax) / L) * s * o;
      if (!inBox(x, y) || nearTrack(x, y, 300) || !f.level(x, y, 100) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + 80)) continue;
      prop(rnd() < 0.6 ? "plains:reeds" : "plains:flat_rock", [x, y], rnd() * 360, 90, { s: 0.6 + rnd() * 0.4, solid: "none" });
    }
  }

  // ---- past the edge: woods and bamboo between the towers, greenery on their tops ----
  const onTrack = (x: number, y: number) => [[0, 0], [300, 0], [-300, 0], [0, 300], [0, -300]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const inside = (x: number, y: number) => Math.abs(x) < R + 300 && Math.abs(y) < R + 300;
  f.woods(area, ["RoundTree", "SmallTree", "Bamboo", "Bamboo", "JungleTree"], (x, y) => inside(x, y) || onTrack(x, y) || wet(x, y, 150) || f.h(x, y) > 100, { count: 320, spacing: 450, tries: 5000 });
  f.woods(area, ["wind_pine"], (x, y) => onTrack(x, y) || f.h(x, y) < 1300 || inPoly(P2, x, y), { count: 60, spacing: 600, tries: 3000, kit: "westmount" });
  f.woods(area, ["Bush", "SmallTree", "RoundTree"], (x, y) => onTrack(x, y) || f.h(x, y) < 1300, { count: 120, spacing: 380, tries: 4000 });

  // ---- monsters ----
  const quiet = (x: number, y: number) => Math.hypot(x - PAVILION[0], y - PAVILION[1]) < 650 || Math.hypot(x - LANDING[0], y - LANDING[1]) < 800;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 790, keepOut: quiet });

  const npcs: NpcSpec[] = [
    { id: "karst_raftsman", x: LANDING[0] - 500, y: LANDING[1] - 300, face: 120, name: "ลุงหลี่", title: "คนถ่อแพแห่งแม่น้ำหยก", role: "talk",
      look: { gender: "male", hair: "", hairColor: "ink", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "แม่น้ำสายนี้เขียวใสเหมือนหยก ไหลมาจากเขาทางเหนือ ข้าถ่อแพอยู่ที่นี่มาทั้งชีวิตแล้ว",
        "เช้า ๆ หมอกจะลอยคลุมโคนผาจนมองไม่เห็นฝั่ง อย่าเดินเข้าใกล้น้ำตอนนั้นนะ",
        "ทางเหนือขึ้นไปเป็นที่ราบเนินเขาของไฮแลนด์ ทางใต้ลงไปก็ป่าโบราณ",
      ] },
    { id: "karst_painter", x: PAVILION[0] - 700, y: PAVILION[1] + 450, face: 30, name: "ซิ่วหลาน", title: "จิตรกรแห่งศาลาริมผา", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "rose", eyes: "teal", top: "top_adventurer_teal", bottom: "bottom_adventurer_sand" },
      lines: [
        "ขึ้นบันไดหินมาถึงศาลาได้ก็คุ้มแล้ว มองลงไปเห็นแม่น้ำคดเคี้ยวระหว่างยอดผาเต็มตาเลย",
        "ข้าวาดภาพภูผานี้มาสามฤดูแล้ว ยังไม่เคยได้หมอกที่สวยเท่าของจริงสักครั้ง",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [bed, river, pondBed, pond],
    sky: "#b9c9c4",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && f.h(x, y) < 60 && !wet(x, y, 150), density: 0.14 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -4300, y: -600 },
    npcs,
    labels: [
      { x: S_EXIT[0] + 200, y: S_EXIT[1], text: "ทางไปป่าโบราณ", kind: "gate" },
      { x: N_EXIT[0] - 200, y: N_EXIT[1], text: "ทางไปที่ราบเนินเขา", kind: "gate" },
      { x: PAVILION[0] - 500, y: PAVILION[1], text: "ศาลาริมผา" },
      { x: -600, y: 2100, text: "แม่น้ำหยก" },
      { x: POND_C[0] + 300, y: POND_C[1] - 1050, text: "สระบัว", kind: "small" },
      { x: P3[0], y: P3[1] + 300, text: "ยอดผาชมวิว" },
      { x: LANDING[0], y: LANDING[1] - 400, text: "ท่าแพ", kind: "small" },
      { x: BR.at[0] - 500, y: BR.at[1], text: "สะพานแผ่นหิน", kind: "small" },
      { x: 400, y: 4700, text: "ป่าไผ่", kind: "small" },
      { x: P4[0] + 300, y: P4[1] + 300, text: "ลานผาใต้", kind: "small" },
    ],
  });
}

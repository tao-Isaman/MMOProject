// บึงลากูน (the lagoon marsh), monsters Lv 158-170: a vast marsh of pools and channels between
// Suzhou (west) and the plains south of Noa (east), woods standing along its south. The way across
// runs on what dry ground there is and on boardwalks of rotten planks over the water: from the
// road out of Suzhou's east gate, in the middle of the west side, over the channel that links the
// west pools, down between the first pool and the hummock, across the long channel that drains the
// great lagoon in the north-east, over a last pool and out east to the plains, south of where
// their river runs into the marsh. Off the way: a drowned village of stilt houses in the
// south-west pool, reached over the first pool and by a second boardwalk that ends at a ladder; a
// hummock in the north-west, up a ramp, from which a round shrine can be seen sinking into the
// pool beside it; a second hummock in the south-east where a great dead tree stands over a
// forgotten tomb. Reeds and cattails crowd every edge, drowned trees stand in the water, wisps
// hang over it and banks of poison mist lie on the pools. From the dry ground east of the first
// pool a track turns off south-west, between the west pools and the channel, and leaves over the
// south edge through the woods to the sunken temple woods.
//
// Full size in the field's own centimetres (north +X, east -Y), scaled by TOWN_SCALE in finish.
//   ways out: west -> suzhou, east -> noa_plains, south -> sunken_temple_woods

import { FieldBuilder } from "./field";
import { useKits } from "./town";
import type { Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import { KIT as RUINS, smooth, band, blob, bevel, inPoly, along, lengthOf, distTo, towards, rampOff } from "./kits/ruins";
import type { XY } from "./kits/ruins";
import { KIT as JUNGLE } from "./kits/jungle";
import { KIT as DESERT } from "./kits/desert";

useKits(RUINS, JUNGLE, DESERT);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the water ----
// P1..P5: the pools the way and its branches cross or skirt; LG: the great lagoon (north-east);
// CH: the channel draining it south-west across the whole marsh; Q: small pools between
const P1 = blob(-1700, 2200, 900, 1000, 1), P2 = blob(-3600, 1000, 900, 800, 2), P3 = blob(700, -3300, 800, 700, 3);
const P4 = blob(2600, 3000, 900, 900, 4), P5 = blob(-2400, -3200, 900, 800, 5), LG = blob(4000, -1200, 1300, 2000, 6, 30);
// more pools filling the ground between: (b) east of the north-west hummock, (c) south of the
// channel, (f) by the south rim, (g) south of the first pool, (h) by the lagoon, (i) on the west side
const MORE: XY[][] = [blob(1700, 1500, 600, 600, 31), blob(-900, -2500, 700, 650, 32), blob(-4300, -2800, 600, 700, 33), blob(-1700, 4200, 550, 600, 34), blob(4200, 1450, 650, 420, 35), blob(1500, 4700, 700, 500, 36)];
const Q: XY[][] = [blob(-400, 4300, 450, 500, 7), blob(4400, 2600, 500, 520, 8), blob(-4600, -3600, 500, 600, 9), blob(1700, -2150, 420, 450, 10), blob(-1200, -4400, 450, 450, 11), blob(4100, 4500, 600, 550, 12), blob(-4800, 3600, 450, 420, 13)];
const CH: XY[] = smooth([[2900, -400], [1800, -300], [800, -350], [-300, -800], [-1500, -1100], [-2800, -900], [-4000, -1400], [-5000, -1700], [-6600, -1800]]);
// two lesser channels: one from the south-east pool out past the edge, one linking the west pools
const CH2: XY[] = smooth([[-2500, -3600], [-2900, -4400], [-3500, -5100], [-4300, -6400]]);
const CH3: XY[] = smooth([[-1700, 4300], [-900, 4700], [-400, 4400], [400, 4900], [1500, 4700]]);
// past the edge: more water, so the marsh runs on (the plains' river comes into the one past the
// east edge, south of the road)
const RIM_WATER: XY[][] = [blob(7300, -2200, 1300, 2800, 14), blob(2700, 7300, 1500, 1200, 16), blob(-3500, -7300, 1500, 1300, 17)];

// ---- the hummocks ----
const H1 = blob(650, 2750, 800, 700, 21), H2 = blob(3500, -4550, 800, 650, 22);
const H1_RAMP = rampOff(H1, 18, 0.5, 1000, 440); // off its east side
const H2_RAMP = rampOff(H2, 12, 0.5, 1000, 440); // off its south side
// wooded banks past the edge (on the south the woods of the land beyond)
const RIM_A: XY[] = [[5900, 1200], [6300, 2800], [5900, 6000], [9000, 6200], [9000, 1000]];
const RIM_B: XY[] = [[-5900, 4200], [-6200, 6200], [-4600, 6100], [-4500, 9000], [-9000, 9000], [-9000, 4000]];
const RIM_D: XY[] = [[-3200, 6100], [-1000, 6400], [-800, 9000], [-3200, 9000]];
const RIM_C: XY[] = [[2600, -5900], [5800, -6100], [6000, -9000], [2400, -9000]];
const RIM_E: XY[] = [[-5900, -2500], [-6300, -4200], [-5950, -5900], [-6200, -9000], [-9000, -9000], [-9000, -2400]];

// ---- the boardwalks: the way's three crossings, the branch to the drowned village (over the
// first pool, then out to the ladder) ----
const BW4: XY[] = smooth([[60, 5010], [200, 4790], [340, 4570]]);
const BW1: XY[] = smooth([[-2450, 3050], [-2000, 2600], [-1600, 2050], [-1150, 1500], [-950, 1250]]);
const BW2: XY[] = smooth([[-100, -80], [150, -330], [380, -760], [560, -1050]]);
const BW3: XY[] = smooth([[860, -2480], [760, -2900], [600, -3350], [560, -3820], [560, -4080]]);
const BW5: XY[] = smooth([[-2950, 2600], [-3200, 2050], [-3350, 1650], [-3420, 1350]]);
const BWS = [BW4, BW1, BW2, BW3, BW5];

const SZ: XY = [0, 5150], NP: XY = [-1100, -5150], ST: XY = [-5150, -150];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(312, {
    hills: [{ x: -4400, y: 2600, r: 500, h: 60 }, { x: 3000, y: -2500, r: 450, h: 50 }],
    plateaus: [
      { poly: H1, h: 280, ramps: [H1_RAMP] },
      { poly: H2, h: 260, ramps: [H2_RAMP] },
      { poly: bevel(RIM_A), h: 420 }, { poly: bevel(RIM_B), h: 380 }, { poly: bevel(RIM_C), h: 400 }, { poly: bevel(RIM_D), h: 360 }, { poly: bevel(RIM_E), h: 380 },
    ],
    rock: "Ruins_CliffPeat",
  });
  const AREA = { x0: -A, x1: A, y0: -A, y1: A };

  // ---- the ways on the dry ground: tracks of trodden peat between the boardwalks ----
  const L0: XY[] = smooth([[0, 7300], SZ, BW4[0]]);
  const L0B: XY[] = smooth([BW4[BW4.length - 1], [480, 3950], [-150, 3550], [-450, 2900], [-480, 2200], [-760, 1500], [-860, 1120]]);
  const L1: XY[] = smooth([BW1[BW1.length - 1], [-700, 900], [-350, 350], BW2[0]]);
  const L2: XY[] = smooth([BW2[BW2.length - 1], [900, -1700], [880, -2200], BW3[0]]);
  const L3: XY[] = smooth([BW3[BW3.length - 1], [300, -4500], [-300, -5080], NP, [-1250, -7300]]);
  const VILLAGE: XY[] = smooth([BW1[0], [-2750, 3250], [-2950, 2950], BW5[0]]);
  const HUMMOCK1: XY[] = [...smooth([[-500, 950], [100, 950], H1_RAMP.bottom]), H1_RAMP.top, [H1_RAMP.top[0] + 40, H1_RAMP.top[1] + 350]];
  const HUMMOCK2: XY[] = [...smooth([[540, -4000], [1300, -4250], H2_RAMP.bottom]), H2_RAMP.top, [H2_RAMP.top[0] + 300, H2_RAMP.top[1] - 80]];
  const L4: XY[] = smooth([[-550, 650], [-1500, 350], [-2600, -150], [-3600, -450], [-4500, -250], ST, [-7300, -100]]);
  const tracks = [L0, L0B, L1, L2, L3, VILLAGE, HUMMOCK1, HUMMOCK2, L4];
  const pools = [P1, P2, P3, P4, P5, LG, ...Q, ...MORE];
  const ground = f.ground({
    area: AREA, cell: 60, roads: tracks.map((t) => band(t, 380)), plazas: [], water: [...pools, band(CH, 460), band(CH2, 400), band(CH3, 360), ...RIM_WATER],
    base: "moss", tint: "#9ea189", road: [0.62, 0.55, 0.45],
  });
  const scenery = [f.waterSheet(AREA, -14, "Ruins_MarshWater")];

  // ---- the ways out ----
  // (each arrival on the way in, past the first channel on the west, clear of the pools)
  f.exit("suzhou", SZ, [410, 4250]);
  f.exit("noa_plains", NP, [-450, -5090]);
  f.exit("sunken_temple_woods", ST, [-4450, -280]);

  // ---- what keeps everyone out of the water: discs over every pool, shrunk beside the boardwalks
  // so they close up to the rails without reaching the planks; the channel banded with a gap where
  // the boardwalk crosses; a stop at the end of the one that ends in the water ----
  const nearWalk = (x: number, y: number, d: number) => BWS.some((bw) => distTo(bw, x, y) < d);
  const walkGap = (x: number, y: number) => Math.min(...BWS.map((bw) => distTo(bw, x, y))) - 114; // room left beside the rails
  const plug = (p: XY, r: number) => {
    const room = walkGap(p[0], p[1]);
    if (room > 50 && Math.abs(p[0]) < R + 800 && Math.abs(p[1]) < R + 800) f.blockDisc(p, Math.min(r, room));
  };
  for (const poly of [...pools, ...RIM_WATER]) {
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    for (let x = Math.min(...xs) + 160; x < Math.max(...xs); x += 400)
      for (let y = Math.min(...ys) + 160; y < Math.max(...ys); y += 400) if (inPoly(poly, x, y)) plug([x, y], 285);
    const c: XY = [xs.reduce((t, v) => t + v, 0) / xs.length, ys.reduce((t, v) => t + v, 0) / ys.length];
    poly.forEach(([x, y], i) => i % 2 || plug([x + (c[0] - x) * 0.06, y + (c[1] - y) * 0.06], 195));
  }
  const crossing = BW2.filter((p) => distTo(CH, p[0], p[1]) < 400);
  f.blockBand(CH.filter((p) => Math.abs(p[0]) < R + 900 && Math.abs(p[1]) < R + 900), 430, { gaps: crossing, gapR: 260, step: 250 });
  f.blockBand(CH2.filter((p) => Math.abs(p[0]) < R + 900 && Math.abs(p[1]) < R + 900), 370, { step: 250 });
  f.blockBand(CH3.filter((p) => Math.abs(p[0]) < R + 900 && Math.abs(p[1]) < R + 900), 330, { gaps: BW4.filter((p) => distTo(CH3, p[0], p[1]) < 360), gapR: 240, step: 250 });
  const end = along(BW5, lengthOf(BW5));
  f.blockDisc([end.p[0] + end.dir[0] * 150, end.p[1] + end.dir[1] * 150], 140);

  // ---- placing: every thing remembered (x, y, r) so the plants keep clear ----
  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number) => taken.every(([px, py, pr]) => Math.hypot(px - x, py - y) > pr + r);
  const dry = (x: number, y: number, r: number) => [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0);
  const put = (ref: string, at: XY, h = 0, o: { s?: number; solid?: "auto" | "none" | SolidSpec[]; r?: number } = {}) => {
    f.put(ref.includes(":") ? ref : `ruins:${ref}`, at, h, { s: o.s ?? 1, solid: o.solid ?? "auto" });
    taken.push([at[0], at[1], o.r ?? 120]);
  };
  const box = (w: number, d: number, x = 0, y = 0, kind = "fence"): SolidSpec => ({ kind, x, y, w, d, rot: 0 });
  const disc = (r: number, x = 0, y = 0, kind = "tree"): SolidSpec => ({ kind, x, y, r });

  // the boardwalks: 4 m pieces turned along their curves, their sides solid
  for (const bw of BWS) {
    const L = lengthOf(bw), n = Math.ceil(L / 385);
    for (let i = 0; i < n; i++) {
      const { p, dir } = along(bw, ((i + 0.5) * L) / n);
      put("marsh_boardwalk", p, (Math.atan2(-dir[0], dir[1]) * 180) / Math.PI, { solid: [box(14, 410, -106, 0), box(14, 410, 106, 0)], r: 210 });
    }
  }

  // ---- the ways in and out: signs, old posts ----
  put("jungle:trail_sign", [400, 5250], towards(-0.4, -1), { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("jungle:trail_sign", [-650, -4600], towards(0.5, 1), { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("jungle:trail_sign", [-650, 1250], towards(-1, 0.5), { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("jungle:trail_sign", [700, -4150], towards(-0.4, -1), { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("jungle:trail_sign", [-4700, 250], towards(-1, 0.3), { solid: [disc(20, 0, 0, "post")], r: 90 });

  // ---- the drowned village: stilt houses in the south-west pool, the boardwalk to the first ----
  put("stilt_ruin", [-3650, 900], -117, { solid: "none", r: 420 }); // its ladder to the boardwalk's end
  put("stilt_ruin", [-3950, 1700], 120, { solid: "none", r: 420 });
  put("stilt_ruin", [-4100, 400], 250, { solid: "none", r: 420 });
  put("drowned_tree", [-3000, 400], 40, { solid: "none", r: 200 });

  // ---- the hummocks: a stilt house left high and dry on the first, the sunken shrine beside it;
  // a great dead tree over a forgotten tomb on the second ----
  put("stilt_ruin", [580, 2830], 160, { solid: [box(660, 560, 0, 0, "ruin")], r: 450 });
  put("drowned_tree", [400, 3300], 0, { s: 1.15, solid: [disc(55)], r: 260 });
  put("sunken_shrine", [2700, 3150], 30, { solid: "none", r: 360 });
  put("drowned_tree", [3600, -4700], 70, { s: 1.5, solid: [disc(75)], r: 320 });
  put("stone_tomb", [3300, -4250], 100, { solid: [box(330, 250, 0, 0, "tomb")], r: 230 });
  put("root_tangle", [3850, -4250], 300, { solid: [box(260, 150, 0, 0, "ruin")], r: 230 });

  // ---- reeds and cattails round every pool and along the channel, some out in the water ----
  const rnd = f.rnd;
  for (const poly of pools) {
    poly.forEach(([x, y], i) => {
      if (i % 2 || nearWalk(x, y, 330) || Math.abs(x) > R + 600 || Math.abs(y) > R + 600 || !free(x, y, 70)) return;
      put(rnd() < 0.6 ? "cattails" : "jungle:reeds", [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.35, solid: "none", r: 70 });
    });
  }
  for (const [ch, off] of [[CH, 250], [CH2, 220], [CH3, 200]] as [XY[], number][])
    for (let d = 200; d < lengthOf(ch); d += 420) {
      const { p, dir } = along(ch, d), s = Math.floor(d / 420) % 2 ? 1 : -1;
      const x = p[0] - dir[1] * s * off, y = p[1] + dir[0] * s * off;
      if (Math.abs(x) > R + 600 || Math.abs(y) > R + 600 || nearWalk(x, y, 330) || !free(x, y, 70)) continue;
      put(rnd() < 0.5 ? "cattails" : "jungle:reeds", [x, y], d, { s: 0.85 + rnd() * 0.3, solid: "none", r: 70 });
    }
  // drowned trees standing in the pools, clear of the boardwalks
  for (const poly of [P1, P3, P4, P5, LG, Q[1], Q[5], MORE[0], MORE[1], MORE[2], MORE[4], MORE[5]]) {
    for (let k = 0, made = 0; k < 30 && made < (poly === LG ? 6 : 2); k++) {
      const c = poly[Math.floor(rnd() * poly.length)], m = poly[(Math.floor(rnd() * poly.length) + 7) % poly.length], t = 0.25 + rnd() * 0.4;
      const p: XY = [c[0] + (m[0] - c[0]) * t, c[1] + (m[1] - c[1]) * t];
      if (!inPoly(poly, p[0], p[1]) || nearWalk(p[0], p[1], 450) || !free(p[0], p[1], 220)) continue;
      put("drowned_tree", p, rnd() * 360, { s: 0.8 + rnd() * 0.4, solid: "none", r: 220 });
      made++;
    }
  }

  // ---- wisps over the water, banks of poison mist on the pools and the low ground ----
  for (const at of [[-1700, 2500], [-1400, 1700], [700, -3100], [2400, 2700], [3500, -800], [4300, -2200], [-2300, -3000], [-3800, 1300], [3000, 3400], [-4500, -3500], [200, -400], [1700, -2100], [1500, 4700], [-1700, 4200], [-900, -2600]] as XY[])
    put("wisp_lights", at, (at[0] + at[1]) % 360, { solid: "none", r: 40 });
  for (const at of [[-1800, 2100], [600, -3300], [2700, 2800], [4000, -1000], [3700, -2400], [-2500, -3300], [-3500, 900], [-1000, -1100], [-4700, -3700], [1700, 1500], [-200, 2000], [4200, 1450], [-900, -2400], [-4300, -2800], [1500, 4600]] as XY[])
    put("poison_mist", at, (at[0] * 3) % 360, { solid: "none", r: 10 });

  // ---- the dry ground: bushes, rushes, a few living trees among the dead ones ----
  const keepOut = (x: number, y: number) => f.warps.some((w) => Math.hypot(w.x - x, w.y - y) < 700) || nearWalk(x, y, 350) ||
    distTo([H1_RAMP.top, H1_RAMP.bottom], x, y) < 420 || distTo([H2_RAMP.top, H2_RAMP.bottom], x, y) < 420;
  for (let x = -R + 200; x < R; x += 360)
    for (let y = -R + 200; y < R; y += 360) {
      const px = x + (rnd() - 0.5) * 280, py = y + (rnd() - 0.5) * 280;
      const edge = Math.min(R - Math.abs(px), R - Math.abs(py));
      const want = edge < 900 ? 0.5 : 0.16;
      if (rnd() > want || !dry(px, py, 260) || !f.level(px, py, 160) || !free(px, py, 220) || keepOut(px, py)) continue;
      const k = rnd();
      if (k < 0.3) put("drowned_tree", [px, py], rnd() * 360, { s: 0.6 + rnd() * 0.3, solid: [disc(40)], r: 220 });
      else if (k < 0.5) put(rnd() < 0.5 ? "flora:SmallTree" : "flora:Birch", [px, py], rnd() * 360, { s: 0.75 + rnd() * 0.3, r: 200 });
      else put(rnd() < 0.6 ? "flora:Bush" : "flora:JungleBush", [px, py], rnd() * 360, { s: 0.8 + rnd() * 0.4, solid: "none", r: 120 });
    }
  for (let x = -R + 150; x < R; x += 230)
    for (let y = -R + 150; y < R; y += 230) {
      const px = x + (rnd() - 0.5) * 200, py = y + (rnd() - 0.5) * 200;
      const shore = !dry(px, py, 260);
      if (rnd() > (shore ? 0.5 : 0.2) || !dry(px, py, 90) || !f.level(px, py, 80) || !free(px, py, 70) || keepOut(px, py)) continue;
      put(rnd() < 0.55 ? "desert:grass_tuft" : rnd() < 0.5 ? "jungle:reeds" : "cattails", [px, py], rnd() * 360, { s: 0.7 + rnd() * 0.4, solid: "none", r: 60 });
    }
  // past the edge: dead trees and thickets on the banks, reeds in the water
  const rimOut = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) === 1 || ground.kind(x, y) === 3;
  f.woods(AREA, ["drowned_tree", "drowned_tree", "cattails"], rimOut, { count: 200, spacing: 520, tries: 5000, kit: "ruins" });
  f.woods(AREA, ["SmallTree", "Bush", "Birch", "JungleBush", "RoundTree", "Bush"], rimOut, { count: 380, spacing: 380, tries: 8000 });
  f.woods(AREA, ["cattails", "drowned_tree"], (x, y) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) !== 3, { count: 120, spacing: 600, tries: 4000, kit: "ruins" });
  // the woods of the land to the south: living trees thick past the south edge, thinning into the marsh
  f.woods({ x0: -A, x1: -R + 300, y0: -A, y1: A }, ["RoundTree", "BigOak", "SmallTree", "RoundTree", "Birch", "BigOak"], (x, y) => (x > -R - 250 && Math.abs(y) < R + 250) || ground.kind(x, y) !== 0, { count: 260, spacing: 360, tries: 6000 });
  for (let i = 0; i < 400; i++) {
    const x = -R + 200 + rnd() * 1300, y = -R + 300 + rnd() * (2 * R - 600);
    if (rnd() > (-R + 1500 - x) / 1300 || !dry(x, y, 240) || !f.level(x, y, 150) || !free(x, y, 220) || keepOut(x, y)) continue;
    put(rnd() < 0.5 ? "flora:RoundTree" : rnd() < 0.5 ? "flora:BigOak" : "flora:SmallTree", [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.35, r: 220 });
  }

  // ---- monsters: on the dry ground and the hummocks ----
  const HERMIT: XY = [-500, 1300], WARDEN: XY = [850, -4700];
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 760, keepOut: (x, y) => Math.hypot(x - HERMIT[0], y - HERMIT[1]) < 800 || Math.hypot(x - WARDEN[0], y - WARDEN[1]) < 700 });

  const npcs: NpcSpec[] = [
    {
      id: "lm_hermit", x: HERMIT[0], y: HERMIT[1], face: 180, name: "ยายเฮลกา", title: "ผู้เฒ่าแห่งบึงลากูน", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "teal", top: "top_priestess_forest", bottom: "bottom_priestess_forest" },
      lines: [
        "อย่าเดินตามแสงสีเขียวเหนือน้ำ มันพาคนลงไปในบึงมานักต่อนักแล้ว",
        "หมอกสีเหลืองอมเขียวนั่นคือหมอกพิษ สูดเข้าไปนานๆ ล่ะก็หายใจไม่ออก",
        "หมู่บ้านใต้ถุนสูงทางตะวันตกเฉียงใต้จมน้ำไปตั้งแต่ข้ายังสาว ศาลกลางบึงก็จมลงทุกปี",
      ],
    },
    {
      id: "lm_warden", x: WARDEN[0], y: WARDEN[1], face: 160, name: "ดาริโอ", title: "พรานบึงจากโนอา", role: "talk",
      look: { gender: "male", hair: "", hairColor: "amber", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ทางไม้กระดานผุหมดแล้ว เดินให้ตรงกลางไว้ อย่าเหยียบขอบ",
        "ทางตะวันออกออกไปที่ราบใต้โนอา ทางตะวันตกข้ามสะพานไม้ไปถึงประตูตะวันออกของซูโจว",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery,
    sky: "#5d6b55",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => dry(x, y, 200), density: 0.06 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 520, y: -4250 },
    npcs,
    labels: [
      { x: SZ[0] + 250, y: SZ[1] - 250, text: "ทางไปซูโจว", kind: "gate" },
      { x: NP[0], y: NP[1] + 250, text: "ทางไปที่ราบใต้โนอา", kind: "gate" },
      { x: ST[0] + 250, y: ST[1] + 250, text: "ทางไปป่าวิหารจม", kind: "gate" },
      { x: 2450, y: -1200, text: "ลากูนใหญ่" },
      { x: -3300, y: 1800, text: "หมู่บ้านใต้ถุนสูงร้าง" },
      { x: 1000, y: 2850, text: "ศาลจมบึง", kind: "small" },
      { x: 650, y: 2750, text: "เนินกลางบึง" },
      { x: 3500, y: -4550, text: "เนินต้นไม้ตาย" },
      { x: -1700, y: 2200, text: "สะพานไม้กลางบึง", kind: "small" },
      { x: -1500, y: -650, text: "ลำรางระบายน้ำ", kind: "small" },
    ],
  });
}

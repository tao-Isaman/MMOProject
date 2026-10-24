// ป่าต้นไม้แรก (the forest of the first tree), monsters Lv 190-200 and its warden (boss, Lv 200):
// the last of the land in the far south-west, a broad shore of old forest with the sea on three
// sides, and in it the first tree of the world, whose roots hold the land together. Its bark and
// its leaves shine gold; its roots leave the trunk high up and arch out over the ground to fifteen
// metres and more, so a path runs right round it under them; golden mist lies in the hollows round
// it and fireflies drift everywhere in swarms. Old trees walk here, and under the first tree stands
// its warden, a tall god of golden wood with wings of leaves.
//
// The only way in is from the royal necropolis (east): down a ravine through the wooded ridge that
// closes the forest's east side, the necropolis's west ridge running on. The track winds south-west
// through the old forest, past the ramp up the north terrace (3.8 m, a lookout over the north sea
// under its own great tree), to the first tree; a branch climbs the west headland (4.8 m), whose
// cliffs fall into the sea, and another runs down to the south shore. There is no way on: the sea
// only, to the north, the west and the south.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   way out: east -> royal_necropolis

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, seeded } from "./town";
import { KIT as OLDGROWTH, FIRST_ROOTS, seaSheet } from "./kits/oldgrowth";
import { KIT as WESTMOUNT, smooth, band, inPoly, toLine, dense, towards, rampOff, beyond } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import { KIT as JUNGLE } from "./kits/jungle";
import { KIT as PLAINS } from "./kits/plains";
import { blobPoly } from "./kits/snowland";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(OLDGROWTH, WESTMOUNT, JUNGLE, PLAINS);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the sea round three sides: the shore from the north-east (where the ridge comes down to it)
// round the north, the west and the south to the south-east ----
const SHORE: XY[] = smooth([
  [A + 400, -6050], [6600, -6000], [5800, -5300], [5200, -4300], [5000, -3000], [5100, -1500], [4900, 0], [4700, 1500], [4300, 3000],
  [3600, 4300], [2300, 5000], [800, 5200], [-800, 5150], [-2200, 4900], [-3400, 4400], [-4300, 3500], [-4900, 2200], [-5100, 700],
  [-5000, -800], [-5100, -2300], [-5000, -3800], [-5300, -4900], [-6000, -5600], [-6600, -6000], [-A - 400, -6050],
], 3);
const SEA: XY[] = [...SHORE, [-A - 400, A + 400], [A + 400, A + 400]];

// ---- the levels: the north terrace and the west headland; the ridge along the east (the
// necropolis's west ridge running on), the ravine the way in comes down ----
const P1: XY[] = [[2400, -2600], [3900, -2900], [4500, -1800], [4400, -200], [3600, 500], [2500, 200], [2100, -1200]];
const RP1 = rampOff([2100, -1200], [2400, -2600], [3300, -1200], 1150, 440);
const P2: XY[] = [[1200, 2800], [2600, 2600], [3600, 3300], [3800, 4300], [3000, 5000], [1800, 5300], [900, 4600], [800, 3600]];
const RP2 = rampOff([800, 3600], [1200, 2800], [2500, 3800], 1450, 440);
const RIDGE_S: XY[] = [[-A, -A], [3900, -A], [3900, -6200], [3800, -5500], [3400, -5150], [2000, -5050], [500, -5200], [-1500, -5100], [-3000, -5250], [-4500, -5150], [-5300, -5300], [-A, -5300]];
const RIDGE_N: XY[] = [[4650, -A], [A, -A], [A, -6150], [6600, -6100], [5800, -5550], [5100, -5300], [4750, -5450], [4650, -6200]];

const FT: XY = [-2300, 1200]; // the first tree
const LOOKOUT: XY = [2600, 4200];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(521, {
    hills: [
      { x: -1000, y: -500, r: 900, h: -70 }, { x: -3600, y: 2400, r: 800, h: -60 }, { x: -800, y: 2900, r: 700, h: -60 }, { x: -3500, y: -700, r: 800, h: -70 },
      { x: 1300, y: 600, r: 1000, h: 80 }, { x: -3000, y: -3200, r: 900, h: 90 }, { x: 3000, y: -4000, r: 800, h: 70 }, { x: 600, y: -3600, r: 700, h: -50 },
    ],
    plateaus: [
      { poly: dense(P1), h: 380, ramps: [RP1] },
      { poly: dense(P2), h: 480, ramps: [RP2] },
      { poly: dense(RIDGE_S, 700), h: 520 },
      { poly: dense(RIDGE_N, 700), h: 600 },
    ],
    rock: "Oldgrowth_CliffMoss",
  });
  const { put, rnd } = f;

  // ---- the tracks: in down the ravine and on to the first tree, round it under its roots, up the
  // terrace, up the headland, down to the south shore ----
  const E_EXIT: XY = [4300, -5150];
  const MAIN: XY[] = smooth([[4300, -7600], E_EXIT, [4000, -4300], [3000, -3500], [1700, -2650], [600, -1500], [-400, -300], [-1100, 400], [-1500, 650]]);
  const RING: XY[] = [];
  for (let k = 0; k <= 40; k++) {
    const a = (k / 40) * Math.PI * 2;
    RING.push([FT[0] + Math.cos(a) * 1180, FT[1] + Math.sin(a) * 1180]);
  }
  const P1_WAY: XY[] = [...smooth([[1700, -2650], [1150, -2500], beyond(RP1.top, RP1.bottom, 280)]), RP1.bottom, RP1.top, ...smooth([beyond(RP1.bottom, RP1.top, 400), [3300, -1300], [3700, -900]])];
  const P2_WAY: XY[] = [...smooth([[-400, -300], [-350, 900], [-450, 1900], beyond(RP2.top, RP2.bottom, 300)]), RP2.bottom, RP2.top, ...smooth([beyond(RP2.bottom, RP2.top, 400), [2000, 3800], [LOOKOUT[0] - 200, LOOKOUT[1] - 300]])];
  const SOUTH_WAY: XY[] = smooth([[600, -1500], [-600, -2400], [-2000, -2900], [-3300, -3300], [-4200, -3500]]);
  const TRACKS = [MAIN, RING, P1_WAY, P2_WAY, SOUTH_WAY];
  const roads = TRACKS.map((t, i) => band(t, i === 0 ? 440 : 380));

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ground = f.ground({ area, roads, plazas: [], water: [SEA], base: "jungle", road: [0.72, 0.62, 0.42], tint: "#cbd3b0" });
  // moss in patches; round the first tree the ground turns golden with its fallen leaves
  const prnd = seeded(5211), mossy: XY[][] = [];
  for (let x = -A; x < A; x += 650)
    for (let y = -A; y < A; y += 650) if (prnd() < 0.4) mossy.push(blobPoly([x + prnd() * 650, y + prnd() * 650], 240 + prnd() * 200, 200 + prnd() * 150, 5212 + mossy.length, 0.25, 14));
  const moss = f.ground({ area, roads, plazas: [], water: [SEA, ...mossy], base: "moss", road: [0.72, 0.62, 0.42], tint: "#b9c49f" });
  moss.mesh.position.y += 3;
  moss.mesh.renderOrder = 1;
  // (drifts of its fallen leaves: the layer cut away everywhere but in them; each drift wound the
  // other way round from the frame, so it is left as a hole in the cut)
  const area2 = (p: XY[]) => p.reduce((t, [x, y], i) => t + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0);
  const FRAME: XY[] = [[-A, -A], [A, -A], [A, A], [-A, A]];
  const drifts: XY[][] = [];
  for (let i = 0; i < 26; i++) {
    const a = prnd() * Math.PI * 2, d = 1300 + Math.sqrt(prnd()) * 1700, r = 220 + prnd() * 260 * (1 - (d - 1300) / 1900);
    const c: XY = [FT[0] + Math.cos(a) * d, FT[1] + Math.sin(a) * d];
    if (drifts.some((q) => Math.hypot(q[0][0] - c[0], q[0][1] - c[1]) < 900)) continue;
    const b = blobPoly(c, r, r * 0.8, 5300 + i, 0.3, 14);
    drifts.push(Math.sign(area2(b)) === Math.sign(area2(FRAME)) ? b.reverse() : b);
  }
  const GOLD_OFF: XY[] = [...FRAME, FRAME[0], ...drifts.flatMap((b) => [...b, b[0], FRAME[0]])];
  const gold = f.ground({ area: { x0: FT[0] - 4000, x1: FT[0] + 4000, y0: FT[1] - 4000, y1: FT[1] + 4000 }, roads, plazas: [], water: [SEA, GOLD_OFF], base: "steppe", road: [0.72, 0.62, 0.42], tint: "#e3c98a" });
  gold.mesh.position.y += 5;
  gold.mesh.renderOrder = 2;

  // ---- the sea, closed along its shore ----
  const sea = seaSheet(SHORE, [[-A - 400, A + 400], [A + 400, A + 400]], 250, -15, "Oldgrowth_Sea"); // (over the sea only, so the hollows inland stay dry)
  const seaward = (p: XY, d: number): XY => {
    const i = SHORE.indexOf(p), a = SHORE[Math.max(0, i - 1)], b = SHORE[Math.min(SHORE.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    for (const s of [1, -1]) {
      const n: XY = [(-(b[1] - a[1]) / L) * s, ((b[0] - a[0]) / L) * s];
      if (inPoly(SEA, p[0] + n[0] * 120, p[1] + n[1] * 120)) return [p[0] + n[0] * d, p[1] + n[1] * d];
    }
    return p;
  };
  const nearShore = SHORE.filter(([x, y]) => Math.abs(x) < R + 1200 && Math.abs(y) < R + 1200);
  f.blockBand(nearShore.map((p) => seaward(p, 160)), 340, { kind: "sea", step: 220 });

  // ---- the way out ----
  f.exit("royal_necropolis", E_EXIT, [4050, -4450]);

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const wet = (x: number, y: number, d: number) => inPoly(SEA, x, y) || toLine([x, y], SHORE) < d + 150;
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
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, o: (s: number) => Parameters<typeof put>[3] = () => ({}), where = inBox, gap = 40) => {
    for (let i = 0, made = 0; i < n * 12 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!where(x, y) || nearTrack(x, y, rad + 230) || !free(x, y, rad, gap)) continue;
      const s = 0.8 + rnd() * 0.4;
      put(ref, [x, y], rnd() * 360, { s, ...o(s) });
      take(x, y, rad * s);
      made++;
    }
  };
  for (const t of TRACKS) for (let i = 0; i < t.length; i++) take(t[i][0], t[i][1], 200);

  // ---- the first tree: its trunk and the feet of its roots solid, the ring path free under the
  // arches; mist in the hollows round it, fireflies everywhere ----
  // (the trunk, and the feet of its root arches: the ground under the arches stays open)
  const rootFeet: SolidSpec[] = [{ kind: "tree", x: 0, y: 0, r: 640 }];
  for (const { a, out } of FIRST_ROOTS) for (const d of [out - 60, out + 80]) rootFeet.push({ kind: "root", x: Math.cos(a + 0.15) * d, y: Math.sin(a + 0.15) * d, r: 95 });
  prop("oldgrowth:first_tree", FT, 0, 1900, { solid: rootFeet });
  for (const [at, h, s] of [[[-1000, -500], 10, 0.9], [[-3600, 2400], 60, 0.8], [[-800, 2900], 120, 0.75], [[-3500, -700], 30, 0.85], [[-2300, 3000], 90, 0.7], [[-4200, 600], 0, 0.7]] as [XY, number, number][])
    put("oldgrowth:gold_mist", at, h, { solid: "none", s });
  for (const at of [[-600, 1300], [-3800, 1300], [-1400, -900], [-2600, 2900], [600, -400], [1800, 2000], [-200, -3300], [2700, -3600], [3300, -500], [-3700, -2600], [1500, 4300], [-4300, -1000]] as XY[])
    put("oldgrowth:firefly_swarm", at, rnd() * 360, { solid: "none", s: 0.8 + rnd() * 0.4 });

  // ---- the way in: root arches over the track, a sign, the ravine's rocks ----
  for (const t of [0.18, 0.42, 0.66]) {
    const i = Math.floor(t * (MAIN.length - 1)), a = MAIN[i], b = MAIN[Math.min(MAIN.length - 1, i + 1)];
    prop("oldgrowth:root_arch", a, (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI, 600, { solid: [{ kind: "root", x: 0, y: -460, w: 520, d: 260, rot: 0 }, { kind: "root", x: 0, y: 460, w: 520, d: 260, rot: 0 }] });
  }
  prop("jungle:trail_sign", [3700, -4700], towards(1, -0.6), 90, ring(20, "post"));
  for (const [x, y, s] of [[3500, -5500, 0.8], [4900, -5200, 0.7], [3200, -4950, 0.6]] as [number, number, number][]) if (free(x, y, 200)) prop("westmount:rockfall", [x, y], rnd() * 360, 360 * s, { s, ...ring(260 * s) });

  // ---- the north terrace: a great tree of its own over the sea; the west headland's lookout ----
  prop("oldgrowth:moss_giant", [3800, -600], 120, 800, { s: 0.75, solid: [{ kind: "tree", x: 0, y: 0, r: 200 }] });
  prop("westmount:prayer_cairn", [3900, -1600], 40, 140, { s: 0.6, ...ring(70) });
  prop("oldgrowth:glow_shrooms", [3000, -2200], 30, 180, { s: 0.7, solid: "none" });
  prop("westmount:elder_tree", [3450, 3500], 200, 600, { s: 0.7, solid: [{ kind: "tree", x: 0, y: 0, r: 150 }] });
  prop("westmount:prayer_cairn", [LOOKOUT[0] + 300, LOOKOUT[1] + 400], 0, 140, { s: 0.7, ...ring(80) });
  prop("oldgrowth:moss_boulders", [1600, 4700], 60, 260, { s: 0.7, ...ring(160) });

  // ---- the old forest: elder giants, mossy giants, broadleaves, ferns, fallen trunks, rocks;
  // thicker toward the ridge and the shores ----
  for (const [at, h, s] of [[[1800, -500], 30, 0.75], [[-3800, -2200], 200, 0.7], [[200, -4000], 100, 0.7], [[-4000, 3500], 300, 0.65], [[2200, 1800], 60, 0.7]] as [XY, number, number][])
    if (free(at[0], at[1], 250)) prop(rnd() < 0.5 ? "oldgrowth:moss_giant" : "westmount:elder_tree", at, h, 800 * s, { s, solid: [{ kind: "tree", x: 0, y: 0, r: 230 * s }] });
  for (const [at, h, s] of [[[400, 1700], 50, 0.75], [[-1800, -1800], 140, 0.7], [[2400, -4300], 80, 0.7]] as [XY, number, number][]) if (free(at[0], at[1], 300)) prop("oldgrowth:fallen_moss_giant", at, h, 850 * s, { s, solid: [{ kind: "log", x: 0, y: 0, w: 260, d: 1450, rot: 0 }] });
  scatter("oldgrowth:giant_stump", [0, 0], 5000, 3, 250, (s) => ({ s: s * 0.8, ...ring(150 * s, "log") }));
  scatter("oldgrowth:fern_bed", [0, 0], 5200, 22, 200, () => ({ solid: "none" }));
  scatter("oldgrowth:moss_boulders", [0, 0], 5200, 6, 230, (s) => ring(170 * s));
  scatter("oldgrowth:moss_slabs", [0, 0], 5200, 6, 200, () => ({ solid: "none" }));
  scatter("oldgrowth:glow_shrooms", [0, 0], 5200, 8, 150, () => ({ solid: "none" }));
  scatter("westmount:glow_mushrooms", [0, 0], 5200, 8, 140, () => ({ solid: "none" }));
  scatter("westmount:root_stone", [0, 0], 5000, 6, 140, (s) => ({ s: s * 0.8, ...ring(70 * s) }));
  scatter("jungle:giant_fern", [0, 0], 5300, 34, 90, () => ({ solid: "none" }));
  scatter("jungle:tree_fern", [0, 0], 5300, 14, 110, () => ({ solid: [{ kind: "post", x: 0, y: 0, r: 22 }] }));
  scatter("plains:fern_clump", [0, 0], 5300, 40, 70, () => ({ solid: "none" }));
  for (let i = 0; i < 900; i++) {
    const x = (rnd() - 0.5) * 2 * (R - 150), y = (rnd() - 0.5) * 2 * (R - 150), edge = Math.min(R - Math.abs(x), R - Math.abs(y));
    const nearTree = Math.hypot(x - FT[0], y - FT[1]) < 2400 || Math.hypot(x - LOOKOUT[0], y - LOOKOUT[1]) < 1000;
    if (nearTree || rnd() > (edge < 700 ? 0.85 : edge < 1300 ? 0.35 : 0.08) || nearTrack(x, y, 420) || !free(x, y, 180, 140)) continue;
    const k = rnd(), kind = k < 0.4 ? "flora:BigOak" : k < 0.65 ? "flora:RoundTree" : k < 0.85 ? "flora:JungleTree" : "jungle:vine_tree";
    prop(kind, [x, y], rnd() * 360, 200, { s: 0.8 + rnd() * 0.35, solid: kind === "jungle:vine_tree" ? [{ kind: "tree", x: 0, y: 0, r: 50 }] : "auto" });
  }

  // ---- past the edge: the ridge's woods, the forest on the land, nothing on the sea ----
  const onTrack = (x: number, y: number) => [[0, 0], [300, 0], [-300, 0], [0, 300], [0, -300]].some(([dx, dy]) => ground.kind(x + dx, y + dy) === 1);
  const inside = (x: number, y: number) => Math.abs(x) < R + 300 && Math.abs(y) < R + 300;
  const atSea = (x: number, y: number) => inPoly(SEA, x, y) || toLine([x, y], SHORE) < 250;
  f.woods(area, ["BigOak", "RoundTree", "JungleTree", "BigOak"], (x, y) => inside(x, y) || onTrack(x, y) || atSea(x, y) || f.h(x, y) > 100, { count: 220, spacing: 400, tries: 6000 });
  f.woods(area, ["Pine", "PineSmall", "Pine", "BigOak", "JungleTree"], (x, y) => (inside(x, y) && f.h(x, y) < 450) || onTrack(x, y) || atSea(x, y) || f.h(x, y) < 450, { count: 300, spacing: 420, tries: 6000 });
  f.woods(area, ["PalmBent", "Palm"], (x, y) => inside(x, y) || atSea(x, y) || toLine([x, y], SHORE) > 800 || f.h(x, y) > 100, { count: 30, spacing: 450, tries: 2000 });

  // ---- monsters: the old trees and the fireflies over the forest; the warden under the first tree,
  // on the far side of it from the way in, nothing farther than it ----
  const spawn: XY = [4050, -4300];
  const toTree: XY = [FT[0] - spawn[0], FT[1] - spawn[1]], tl = Math.hypot(toTree[0], toTree[1]);
  const WARDEN: XY = [FT[0] + (toTree[0] / tl) * 870, FT[1] + (toTree[1] / tl) * 870];
  const far = Math.hypot(WARDEN[0] - spawn[0], WARDEN[1] - spawn[1]) - 150;
  const DRUID: XY = [3500, -3700], POET: XY = [LOOKOUT[0] + 100, LOOKOUT[1] - 500];
  const quiet = (x: number, y: number) => Math.hypot(x - spawn[0], y - spawn[1]) > far || Math.hypot(x - FT[0], y - FT[1]) < 1500 || Math.hypot(x - DRUID[0], y - DRUID[1]) < 700 || Math.hypot(x - POET[0], y - POET[1]) < 600;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 900, max: 48, keepOut: quiet });
  f.spots.push({ x: WARDEN[0], y: WARDEN[1] });

  const npcs: NpcSpec[] = [
    { id: "first_tree_druid", x: DRUID[0], y: DRUID[1], face: 140, name: "ปู่ไพร", title: "ผู้พิทักษ์ป่าต้นไม้แรก", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "teal", top: "top_priestess_forest", bottom: "bottom_priestess_forest" },
      lines: [
        "ข้างหน้านั่นคือต้นไม้ต้นแรกของโลก รากของมันยึดแผ่นดินแถบนี้ไว้ไม่ให้จมลงทะเล",
        "เทพพิทักษ์ยืนอยู่ใต้ต้นไม้ไม่เคยห่าง ใครทำร้ายต้นไม้ มันจะเรียกต้นไม้เฒ่ามารุมทันที",
        "หมอกทองในแอ่งรอบต้นไม้คือละอองจากใบของมัน หิ่งห้อยทองก็กินละอองนั้นเป็นอาหาร",
      ] },
    { id: "first_tree_poet", x: POET[0], y: POET[1], face: -30, name: "ศรีปราชญ์น้อย", title: "กวีพเนจร", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "gold", eyes: "amber", top: "top_adventurer_ochre", bottom: "bottom_adventurer_sand" },
      lines: [
        "ข้าเดินทางมาทั่วอาณาจักร เพิ่งเคยเห็นแสงทองที่งามเท่านี้ มองจากผานี้ทั้งป่าเหมือนลุกเป็นไฟ",
        "พ้นทะเลตรงหน้าไปไม่มีแผ่นดินอีกแล้ว ที่นี่คือปลายสุดของโลก",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [moss.mesh, gold.mesh, sea],
    sky: "#8a8f6a",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && moss.kind(x, y) !== 0 && f.h(x, y) < 150 && !wet(x, y, 250), density: 0.1 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: spawn[0], y: spawn[1] },
    npcs,
    labels: [
      { x: E_EXIT[0] - 250, y: E_EXIT[1], text: "ทางไปสุสานหลวงโบราณ", kind: "gate" },
      { x: FT[0] - 1300, y: FT[1], text: "ต้นไม้แรกของโลก" },
      { x: -1000, y: -500, text: "ทะเลหมอกทอง", kind: "small" },
      { x: FT[0] + 900, y: FT[1] - 900, text: "ซุ้มรากทอง", kind: "small" },
      { x: 3300, y: -1300, text: "ลานรากเหนือ" },
      { x: LOOKOUT[0], y: LOOKOUT[1], text: "ผาตะวันตกสุดแผ่นดิน" },
      { x: -4000, y: -3400, text: "หาดใต้", kind: "small" },
      { x: 2500, y: -3700, text: "ป่าไม้เฒ่า", kind: "small" },
    ],
  });
}

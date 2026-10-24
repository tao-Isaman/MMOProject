// ธารน้ำแข็งตะวันตก (the west glacier), monsters Lv 66-76: west of Iceberg, where the ice that
// covers the north of the world comes down to the western sea. The glacier's tongue fills the
// north and north-west of the field and runs out into the sea in a wall of ice: a lower reach
// (3.8 m over the snowfield) and over it, along the north edge, the upper glacier (7.2 m), where
// the ice still comes down from the Snow Queen's hollow and breaks into seracs over the step.
// Crevasses open across both reaches, blue walls going down out of sight; over the widest the
// whalers strung a rope bridge on the way up the ice. In the glacier's snout, facing the
// snowfield, the meltwater has hollowed a cave of blue ice; in front of the snout, slumped out of
// it, a block of old clear ice holds the bones of a mammoth.
//
// Below the ice a snowfield runs from the way in from Iceberg (the east edge, a little south of
// its middle, through the snowy pines round the town) west and south to a cove on the sea, where
// whalers stranded two winters ago, their ship frozen into the bay, keep a camp of stone and turf
// on the shingle behind a whale's jawbones, and fish through the ice of a frozen meltwater pool
// in the snowfield. A moraine knoll rises out of the snowfield in the south-east. Along the south edge stands the ridge that runs on to the frostfang peaks, its sea
// cliffs closing the cove; the ice worms bore through the snowfield and the glacier both, and the
// sabre seals haul out on the cove's shingle and the strip of ice-foot under the glacier's front.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: east (a little south of the middle, as Iceberg's west gate) -> iceberg,
//             north (middle, up on the upper glacier) -> ice_queen_hollow

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { material } from "./textures";
import { KIT as GLACIER, CREVASSE_DEPTH } from "./kits/glacier";
import { KIT as SNOW, blobPoly, flatSheet } from "./kits/snowland";
import { KIT as NORTHCOLD } from "./kits/northcold";
import { KIT as ICEBERG } from "./kits/iceberg";
import { KIT as WESTFARM } from "./kits/westfarm";
import { smooth, band, blob, inPoly, toLine, nearestOn, dense, towards, runAlong, beyond, rampOff, sheet } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(GLACIER, SNOW, NORTHCOLD, ICEBERG, WESTFARM);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the coast: along the glacier's front in the north, round the cove, under the ridge's sea
// cliffs in the south; the sea west of it ----
const SHORE: XY[] = smooth([
  [A + 400, 4650], [7000, 4600], [5500, 4520], [4000, 4560], [2800, 4480], [2000, 4300], [1300, 3900], [700, 3450], [0, 3200],
  [-900, 3100], [-1900, 3150], [-2800, 3400], [-3500, 3800], [-4100, 4250], [-4700, 4600], [-5600, 4800], [-7000, 4850], [-A - 400, 4900],
], 3);
const SEA: XY[] = [...SHORE, [-A - 400, A + 400], [A + 400, A + 400]];
// the cove's shingle
const BEACH: XY[] = [[1500, 3800], [900, 3000], [100, 2650], [-900, 2450], [-2000, 2450], [-3000, 2800], [-3800, 3400], [-4400, 4000], [-4400, 6000], [1600, 6000]];

// ---- the levels ----
// G1: the glacier's lower reach (380), its front over the sea; G2 the upper glacier on it (720);
// MK: the moraine knoll in the snowfield (260); RS: the ridge along the south edge (780,
// scenery), its sea cliffs closing the cove.
const G1: XY[] = [[A, -2600], [6000, -2900], [4700, -3200], [3600, -2900], [2800, -2000], [2100, -900], [1700, 300], [1500, 1500], [1450, 2600], [1650, 3500], [2100, 4000], [3000, 4150], [4500, 4100], [6500, 4150], [A, 4250]];
const G2: XY[] = [[A, -1900], [5500, -2100], [4500, -1700], [3900, -700], [3600, 600], [3700, 1800], [4100, 2700], [4800, 3300], [5600, 3500], [A, 3600]];
const MK_C: XY = [-2700, -2400];
const MK: XY[] = blob(MK_C, 1050, 950, 5, 20);
const RS: XY[] = [[-A, -A], [-4800, -A], [-4900, -5000], [-4600, -3800], [-4900, -2600], [-4600, -1300], [-4800, 0], [-4500, 1300], [-4700, 2500], [-4300, 3300], [-4500, 4150], [-5300, 4450], [-6500, 4550], [-A, 4600]];

// ramps: up onto the lower reach from the snowfield, up the step to the upper glacier, up the knoll
const RG1 = { top: [1900, -300] as XY, bottom: [666, -711] as XY, width: 460 };
const RG2 = { top: [3900, 2250] as XY, bottom: [2895, 2697] as XY, width: 440 };
const RMK = rampOff(MK[17], MK[18], MK_C, 850, 420);

// ---- the crevasses: CV1 across the lower reach where the way up crosses it (the rope bridge),
// CV2 on the upper glacier, CV3 on the lower reach under the seracs ----
const CV1: XY[] = smooth([[2050, 1550], [2550, 1350], [3150, 1250]], 4);
const CV2: XY[] = smooth([[4700, 2300], [5200, 2000], [5900, 2100]], 4);
const CV3: XY[] = smooth([[3300, -1600], [3800, -2050], [4400, -2350]], 4);
const CREVASSES: [XY[], number][] = [[CV1, 900], [CV2, 600], [CV3, 600]];

// ---- the places ----
const E_EXIT: XY = [-385, -5150], N_EXIT: XY = [5150, 0];
const CAMP: XY = [-1900, 2350];          // the whalers' hut
const CAVE_EDGE: XY = [3200, -2450];     // where the cave opens in the glacier's snout
const CAVE_OUT: XY = [-0.747, -0.664];   // the way it faces
const MAMMOTH: XY = [850, 1750];
// the meltwater pool in the snowfield, frozen over (the whalers fish through it)
const POOL_C: XY = [-1700, -700];
const POOL: XY[] = blobPoly(POOL_C, 850, 650, 61, 0.12, 30);

// a ramp up from the ground or a step: the track leading to its foot, up it, and on past its top
const climb = (r: { top: XY; bottom: XY }, inn = 400, out = 400): XY[] => [beyond(r.top, r.bottom, inn), r.bottom, r.top, beyond(r.bottom, r.top, out)];
const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// A crevasse along its centre line, `w` across at its widest and narrowing to its tips: the
// centre line in even steps, the half width and the normal at each, and its outline.
function lensOf(cv: XY[], w: number): { mid: XY[]; hw: number[]; nor: XY[]; side: (sg: number) => XY[]; poly: XY[] } {
  const cum = [0];
  for (let i = 1; i < cv.length; i++) cum.push(cum[i - 1] + Math.hypot(cv[i][0] - cv[i - 1][0], cv[i][1] - cv[i - 1][1]));
  const L = cum[cum.length - 1], n = Math.max(8, Math.round(L / 60)), mid: XY[] = [], hw: number[] = [], nor: XY[] = [];
  for (let k = 0; k <= n; k++) {
    const s = (L * k) / n;
    let i = 1;
    while (i < cv.length - 1 && cum[i] < s) i++;
    const a = cv[i - 1], b = cv[i], t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1), d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    mid.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    nor.push([-(b[1] - a[1]) / d, (b[0] - a[0]) / d]);
    hw.push((w / 2) * Math.max(0.16, Math.pow(Math.sin((Math.PI * k) / n), 0.55)));
  }
  const side = (sg: number): XY[] => mid.map((p, k) => [p[0] + nor[k][0] * hw[k] * sg, p[1] + nor[k][1] * hw[k] * sg] as XY);
  return { mid, hw, nor, side, poly: [...side(1), ...side(-1).reverse()] };
}

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(508, {
    hills: [
      // the snowfield rolling between the way in, the knoll and the cove
      { x: -3700, y: -900, r: 900, h: 80 }, { x: -3300, y: 700, r: 1100, h: 110 }, { x: 600, y: -3700, r: 900, h: 70 },
      { x: -900, y: 1300, r: 800, h: -60 }, { x: 500, y: 300, r: 700, h: 60 }, { x: -3600, y: -4300, r: 800, h: 80 },
      // the snow piled against the glacier's foot in the east, and the land rising to the woods
      { x: 2600, y: -4300, r: 1300, h: 120 }, { x: -2000, y: -4800, r: 1100, h: 90 },
    ],
    plateaus: [
      { poly: dense(G1), h: 380, ramps: [RG1] },
      { poly: dense(G2), h: 720, ramps: [RG2] },
      { poly: dense(MK, 500), h: 260, ramps: [RMK] },
      { poly: dense(RS, 700), h: 780 },
    ],
    rock: "Glacier_IceCliff",
    keep: [CAVE_EDGE],
  });
  const { put, rnd } = f;

  // ---- the bridge over the crevasse on the way up ----
  const nb = nearestOn(CV1, [2550, 1350]);
  let bax: XY = [-nb.dir[1], nb.dir[0]];
  if (bax[1] < 0) bax = [-bax[0], -bax[1]];
  const BR = { at: nb.at, off: (k: number): XY => [nb.at[0] + bax[0] * k, nb.at[1] + bax[1] * k] };

  // ---- the tracks: in from Iceberg over the snowfield, up onto the ice and over the bridge to
  // the upper glacier and the way north; to the cave in the snout; down to the cove past the
  // mammoth; up the knoll ----
  const MAIN: XY[] = [
    ...smooth([[-400, -7600], E_EXIT, [-300, -4300], [-100, -3200], [250, -2200], [450, -1400], climb(RG1)[0]]), ...climb(RG1).slice(1),
    ...smooth([climb(RG1)[3], [2200, 300], [2330, 650], BR.off(-760)]), ...smooth([BR.off(760), [2780, 2200], climb(RG2)[0]]), ...climb(RG2).slice(1),
    ...smooth([climb(RG2)[3], [4500, 1450], [4850, 700], N_EXIT, [7600, 0]]),
  ];
  const caveMouth: XY = [CAVE_EDGE[0] + CAVE_OUT[0] * 700, CAVE_EDGE[1] + CAVE_OUT[1] * 700];
  const T_CAVE: XY[] = smooth([[250, -2200], [1100, -2550], [1800, -2900], caveMouth]);
  const T_COVE: XY[] = smooth([[450, -1400], [200, -400], [80, 600], [-250, 1450], [-800, 2000], [CAMP[0] + 350, CAMP[1] - 450]]);
  const T_MAMMOTH: XY[] = smooth([[-180, 1350], [300, 1500], [MAMMOTH[0] - 450, MAMMOTH[1] - 150]]);
  const T_KNOLL: XY[] = [...smooth([[-200, -3500], [-900, -3600], climb(RMK, 350)[0]]), ...climb(RMK, 350).slice(1), [MK_C[0] + 200, MK_C[1] - 100]];
  const TRACKS = [MAIN, T_CAVE, T_COVE, T_MAMMOTH, T_KNOLL];
  const roads = [band(MAIN, 460), band(T_CAVE, 380), band(T_COVE, 420), band(T_MAMMOTH, 340), band(T_KNOLL, 380), blob(CAMP, 700, 800, 3, 16)];

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const holes = CREVASSES.map(([cv, w]) => lensOf(cv, w + 50).poly);
  const ROAD: [number, number, number] = [0.74, 0.78, 0.88];
  const ground = f.ground({ area, roads, plazas: [], water: [SEA, POOL, ...holes], base: "snow", road: ROAD });
  // the cove's shingle: a second ground a hair over the snow, cut away outside the beach
  const areaOf = (p: XY[]) => p.reduce((t, [x, y], i) => t + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0);
  const bbox: XY[] = [[-5000, 1800], [2200, 1800], [2200, 6000], [-5000, 6000]];
  const hole = Math.sign(areaOf(bbox)) === Math.sign(areaOf(BEACH)) ? [...BEACH].reverse() : BEACH;
  const shingle = f.ground({ area: { x0: -4900, y0: 1900, x1: 2100, y1: 5900 }, roads, plazas: [], water: [[...bbox, bbox[0], ...hole, hole[0]], SEA], base: "rock", road: ROAD });
  shingle.mesh.position.y += 3;
  shingle.mesh.renderOrder = 1;

  // ---- the snow's colour, point by point: the glacier's ice bluer, banded across its flow (the
  // ogives a glacier carries down from its falls), white on the snowfield and the ridge, grey and
  // wet along the water's edge ----
  {
    const geo = ground.mesh.geometry, pos = geo.getAttribute("position"), col = new Float32Array(pos.count * 3);
    const ICE = [0.64, 0.82, 1.06], WET = [0.78, 0.8, 0.84];
    const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
    for (let i = 0; i < pos.count; i++) {
      const x = ground.mesh.position.x + pos.getX(i), y = -(ground.mesh.position.z + pos.getZ(i)), h = pos.getY(i);
      let c = [1, 1, 1];
      if (h > 300 && h < 760 && (inPoly(G1, x, y) || inPoly(G2, x, y))) {
        const band = 0.5 + 0.5 * Math.sin((x * 0.85 + 260 * Math.sin(y / 1400)) / 330);
        c = mix(c, ICE, 0.45 + 0.45 * band * band);
      }
      c = mix(c, WET, ss(500, 120, toLine([x, y], SHORE)) * (h < 60 ? 1 : 0));
      col.set(c, i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    (ground.mesh.material as THREE.MeshStandardMaterial).vertexColors = true;
  }

  // ---- the sea: cold dark water, the shore closed, floes and bergs calved from the glacier ----
  const sea = f.waterSheet({ x0: -A - 2500, x1: A + 2500, y0: 2800, y1: A + 2500 }, -14, "Glacier_Sea");
  const shoreIn = SHORE.filter(([x, y]) => Math.abs(x) < R + 800 && Math.abs(y) < R + 800);
  f.blockBand(shoreIn.map(([x, y]) => [x, y + 90] as XY), 220, { kind: "sea" });
  const floeMat = material("Glacier_Floe"), floes: THREE.Object3D[] = [];
  for (const [x, y, r, s] of [[-1500, 3800, 260, 81], [-600, 3650, 160, 82], [-2400, 4100, 200, 83], [300, 4300, 220, 84], [-3300, 4600, 180, 85], [2600, 5100, 240, 86], [4200, 5000, 200, 87], [-1100, 4700, 300, 88], [6000, 5200, 260, 89], [-4600, 5400, 220, 90]] as number[][])
    floes.push(flatSheet(blobPoly([x, y], r, r * 0.7, s, 0.25, 10), -11, floeMat));
  for (const [x, y, h, s] of [[3400, 5300, 30, 1.1], [5600, 5600, 160, 0.9], [1100, 5600, 250, 1.3], [-2900, 5900, 90, 1], [7200, 5400, 300, 1.2], [-5200, 6200, 20, 0.9]] as number[][])
    put("iceberg:ice_floe", [x, y], h, { s, z: -40 * s, solid: "none" });
  for (const [x, y, h, s] of [[2600, 4750, 60, 0.6], [4700, 4800, 200, 0.7], [6600, 4850, 120, 0.55]] as number[][])
    put("glacier:seracs", [x, y], h, { s, z: -90, solid: "none" });
  for (const [x, y, h] of [[-300, 4100, 30], [-3700, 5000, 140], [1800, 5000, 260], [5000, 5600, 90]] as number[][])
    put("northcold:drift_floes", [x, y], h, { z: -14, solid: "none" });

  // ---- the frozen pool: snowy ice round its edge, clear dark ice in the middle ----
  const poolEdge = flatSheet(blobPoly(POOL_C, 930, 720, 61, 0.12, 30), -4, material("Snowland_LakeIce"));
  const poolMid = flatSheet(blobPoly([POOL_C[0] + 60, POOL_C[1] - 40], 560, 400, 62, 0.15, 24), -3, material("Glacier_BlueIce"));

  // ---- the crevasses: walls of blue ice going down out of sight, a dark glow far below, closed
  // but where the bridge crosses ----
  const deepSheets: THREE.Object3D[] = [];
  const sunk = { solid: "none" as const, z: -CREVASSE_DEPTH };
  for (const [cv, w] of CREVASSES) {
    const lens = lensOf(cv, w), n = lens.mid.length;
    // its two sides, each in pieces of wall facing in across it
    for (const sg of [-1, 1]) {
      const side = lens.side(sg);
      for (let k = 2; k < n - 2; k += 7) {
        const a = side[k - 2], b = side[k + 2], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        let inn: XY = [-(b[1] - a[1]) / d, (b[0] - a[0]) / d];
        if (inn[0] * (lens.mid[k][0] - side[k][0]) + inn[1] * (lens.mid[k][1] - side[k][1]) < 0) inn = [-inn[0], -inn[1]];
        put("glacier:crevasse_wall", [side[k][0] - inn[0] * 10, side[k][1] - inn[1] * 10], towards(inn[0], inn[1]), sunk);
      }
    }
    // and across its tips
    for (const [tip, next] of [[lens.mid[0], lens.mid[3]], [lens.mid[n - 1], lens.mid[n - 4]]] as [XY, XY][]) {
      const d = Math.hypot(next[0] - tip[0], next[1] - tip[1]) || 1, u: XY = [(next[0] - tip[0]) / d, (next[1] - tip[1]) / d];
      put("glacier:crevasse_wall", [tip[0] - u[0] * 30, tip[1] - u[1] * 30], towards(u[0], u[1]), sunk);
    }
    const top = f.h(lens.mid[n >> 1][0], lens.mid[n >> 1][1]);
    deepSheets.push(sheet(lensOf(cv, w + 200).poly, top - CREVASSE_DEPTH + 20, "Glacier_Abyss"));
    // closed all along (but where the bridge crosses)
    for (let k = 0; k + 3 < n; k += 3) {
      const a = lens.mid[k], b = lens.mid[k + 3], m: XY = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (cv === CV1 && Math.hypot(m[0] - BR.at[0], m[1] - BR.at[1]) < 150) continue;
      f.blockBand([a, b], 2 * Math.max(lens.hw[k], lens.hw[k + 3]) + 120, { step: 400, kind: "chasm" });
    }
  }
  put("snowland:rope_bridge", BR.at, runAlong(bax[0], bax[1]), { s: 0.9, solid: [-1, 1].flatMap((sx) => [-1, 1].map((sy) => ({ kind: "post", x: sx * 745, y: sy * 143, r: 16 }))) });

  // ---- the ways out ----
  f.exit("iceberg", E_EXIT, [-330, -4400]);
  f.exit("ice_queen_hollow", N_EXIT, [4450, 650]);

  // ---- placing things: clear of the tracks, the cliffs, the water and each other ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const wet = (x: number, y: number, r: number) => [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].some(([dx, dy]) => ground.kind(x + dx, y + dy) === 3);
  const free = (x: number, y: number, r: number, gap = 0) =>
    !nearTrack(x, y, r + 180) && !wet(x, y, r + 150) && f.level(x, y, Math.min(r, 220)) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
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
  for (const [cv, w] of CREVASSES) for (const p of cv) taken.push([p[0], p[1], w / 2 + 120]);
  taken.push([BR.at[0], BR.at[1], 820]);
  const onIce = (x: number, y: number) => f.h(x, y) > 300 && inPoly(G1, x, y);
  const low = (x: number, y: number) => f.h(x, y) < 200;

  // ---- the ways out: Iceberg's trail sign and lanterns under the pines; cairns up to the hollow ----
  prop("snowland:trail_sign", [E_EXIT[0] - 380, E_EXIT[1] + 330], 90, 80, ring(30, "post"));
  prop("iceberg:lantern_post", [E_EXIT[0] + 330, E_EXIT[1] + 420], 0, 60, ring(26, "post"));
  prop("snowland:cairn", [E_EXIT[0] - 420, -3500], 0, 70, ring(45));
  prop("snowland:trail_sign", [N_EXIT[0] - 500, N_EXIT[1] - 380], 180, 80, ring(30, "post"));
  prop("snowland:cairn", [N_EXIT[0] - 300, N_EXIT[1] + 420], 0, 70, ring(45));
  prop("snowland:expedition_flag", [4300, 1900], 30, 90, ring(40, "post"));
  prop("snowland:cairn", [climb(RG1)[0][0] - 150, climb(RG1)[0][1] - 420], 0, 70, ring(45));

  // ---- the bridge: cairns and stakes at both ends ----
  for (const k of [-1, 1]) {
    const e = BR.off(k * 820);
    prop("snowland:cairn", [e[0] + bax[1] * 330, e[1] - bax[0] * 330], 0, 70, ring(45));
  }

  // ---- the ice cave in the snout ----
  const caveAt: XY = [CAVE_EDGE[0] + CAVE_OUT[0] * 180, CAVE_EDGE[1] + CAVE_OUT[1] * 180];
  prop("glacier:ice_cave", caveAt, towards(CAVE_OUT[0], CAVE_OUT[1]), 700, { s: 0.9, solid: [{ kind: "rock", x: 60, y: -330, w: 640, d: 360, rot: 0 }, { kind: "rock", x: 60, y: 330, w: 640, d: 360, rot: 0 }, { kind: "rock", x: 330, y: 0, w: 420, d: 900, rot: 0 }] });
  for (const [dx, dy, s] of [[-650, -500, 0.7], [-400, 650, 0.6], [-900, 250, 0.5]] as number[][]) {
    const c = Math.cos((towards(CAVE_OUT[0], CAVE_OUT[1]) * Math.PI) / 180), sn = Math.sin((towards(CAVE_OUT[0], CAVE_OUT[1]) * Math.PI) / 180);
    const at: XY = [caveAt[0] + dx * c - dy * sn, caveAt[1] + dx * sn + dy * c];
    if (free(at[0], at[1], 140)) prop("glacier:ice_block", at, rnd() * 360, 160 * s, { s, ...ring(110 * s) });
  }

  // ---- the mammoth in the ice, slumped out of the glacier's foot ----
  prop("glacier:mammoth_ice", MAMMOTH, towards(-1, -0.25), 520, { s: 0.9, solid: [{ kind: "ice", x: 20, y: 0, w: 820, d: 470, rot: 0 }, { kind: "bone", x: -440, y: 0, r: 110 }] });
  prop("snowland:explorer_tent", [MAMMOTH[0] - 650, MAMMOTH[1] + 650], towards(0.3, -1), 260, { s: 0.85 });
  prop("snowland:cold_campfire", [MAMMOTH[0] - 820, MAMMOTH[1] + 150], 0, 120, ring(60));
  prop("snowland:supply_cache", [MAMMOTH[0] - 300, MAMMOTH[1] + 900], 40, 160);

  // ---- the whalers' camp on the shingle: the hut behind the jawbones, the try-pots, the rack of
  // harpoons, their boat drawn up, the last whale's bones; their ship frozen into the bay ----
  prop("glacier:whaler_hut", CAMP, towards(-1, -0.45), 520, { solid: [{ kind: "building", x: 20, y: 0, w: 640, d: 560, rot: 0 }, { kind: "bone", x: -360, y: -130, r: 30 }, { kind: "bone", x: -360, y: 130, r: 30 }] });
  prop("glacier:try_pots", [CAMP[0] + 650, CAMP[1] + 450], towards(-0.6, -1), 260, { solid: [{ kind: "hearth", x: 0, y: 0, w: 220, d: 330, rot: 0 }] });
  prop("glacier:harpoon_rack", [CAMP[0] - 150, CAMP[1] + 750], towards(-1, 0.4), 220, { solid: [{ kind: "post", x: 0, y: -140, r: 30 }, { kind: "post", x: 0, y: 140, r: 30 }] });
  prop("northcold:icebound_boat", [-700, 2950], towards(-0.4, 1), 300, { solid: "none" });
  prop("westfarm:giant_skeleton", [-2700, 3050], 70, 600, { s: 0.9, solid: [{ kind: "bone", x: -560, y: -30, r: 120 }, { kind: "bone", x: -250, y: 0, r: 60 }, { kind: "bone", x: 100, y: 0, r: 60 }, { kind: "bone", x: 350, y: 0, r: 50 }] });
  prop("iceberg:snowy_barrels", [CAMP[0] + 500, CAMP[1] - 350], 20, 110);
  prop("iceberg:woodpile", [CAMP[0] - 400, CAMP[1] - 450], towards(-1, -0.45), 120);
  prop("common:crate", [CAMP[0] + 820, CAMP[1] - 80], 15, 60);
  prop("common:crate", [CAMP[0] + 880, CAMP[1] + 10], 50, 60);
  prop("snowland:cold_campfire", [CAMP[0] + 350, CAMP[1] + 130], 0, 120, ring(55));
  prop("iceberg:sled", [CAMP[0] - 650, CAMP[1] + 150], towards(-1, 0), 140);
  put("snowland:frozen_wreck", [-1700, 4300], 75, { z: -10, solid: "none" });
  for (const [x, y] of [[-3100, 3400], [-3500, 3700], [100, 2900], [700, 3300]] as XY[]) if (free(x, y, 120)) prop("northcold:shingle_bank", [x, y], rnd() * 360, 220, { solid: "none" });
  for (const at of [[-3800, 3900], [1100, 3450], [-200, 3050]] as XY[]) if (free(at[0], at[1], 150)) prop("northcold:iced_rocks", at, rnd() * 360, 200, { s: 0.8, ...ring(150) });

  // ---- on the frozen pool: the whalers' fishing holes, a sled ----
  put("snowland:ice_hole", [POOL_C[0] + 200, POOL_C[1] + 150], 30, { z: -3, solid: [{ kind: "hole", x: 0, y: 0, r: 70 }] });
  put("snowland:ice_hole", [POOL_C[0] - 250, POOL_C[1] - 200], 100, { z: -3, solid: [{ kind: "hole", x: 0, y: 0, r: 70 }] });
  put("iceberg:sled", [POOL_C[0] + 50, POOL_C[1] - 420], 60, { z: -3 });
  taken.push([POOL_C[0], POOL_C[1], 900]);

  // ---- the knoll: the whalers' lookout over the snowfield, rocks of the moraine ----
  prop("snowland:expedition_flag", [MK_C[0] + 300, MK_C[1] + 250], 60, 90, ring(40, "post"));
  prop("snowland:cairn", [MK_C[0] - 250, MK_C[1] - 300], 0, 70, ring(45));
  prop("snowland:rock_cluster", [MK_C[0] - 400, MK_C[1] + 350], 40, 200, { s: 0.8, ...ring(150) });

  // ---- the glacier: seracs where it breaks over the step and along its front, ice boulders,
  // sheets of blue ice, cracks; worm burrows through it ----
  const SERACS: [XY, number, number][] = [[[4600, -2400], 0.9, 20], [[5200, -2700], 0.8, 140], [[4100, -1500], 0.75, 260], [[3500, 100], 0.8, 80], [[3400, 900], 0.7, 200],
    [[3300, 3000], 0.85, 40], [[4200, 3500], 0.9, 300], [[2600, 3600], 0.8, 160], [[5000, 3700], 0.75, 60], [[6200, -1500], 1, 230], [[2500, -900], 0.6, 110]];
  for (const [at, s, h] of SERACS) if (free(at[0], at[1], 300 * s)) prop("glacier:seracs", at, h, 330 * s, { s, solid: [{ kind: "ice", x: 0, y: 0, r: 260 * s }] });
  scatter(["glacier:blue_ice"], 12, IN, 340, { s: [0.7, 1.1], solid: "none", keep: onIce });
  scatter(["glacier:ice_crack"], 10, IN, 420, { s: [0.7, 1], solid: "none", keep: onIce });
  scatter(["glacier:ice_crack"], 4, IN, 420, { s: [0.6, 0.8], solid: "none", keep: (x, y) => low(x, y) && y > -3500 && x > -4000 });
  scatter(["glacier:ice_block"], 16, IN, 150, { s: [0.5, 0.95], ringR: 120, keep: onIce });
  scatter(["glacier:ice_block"], 10, IN, 150, { s: [0.45, 0.8], ringR: 110, keep: (x, y) => low(x, y) && toLine([x, y], G1) < 1500 });
  scatter(["glacier:worm_burrow"], 9, IN, 200, { s: [0.8, 1.1], ringR: 120, keep: onIce });
  scatter(["glacier:worm_burrow"], 7, IN, 200, { s: [0.75, 1], ringR: 110, keep: (x, y) => low(x, y) && !inPoly(BEACH, x, y) });
  // fallen ice at the foot of the glacier's front on the snowfield side
  for (const poly of [G1, G2]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (inPoly(poly, mx + nx * 50, my + ny * 50)) [nx, ny] = [-nx, -ny];
      for (let t = 300; t < L - 200; t += 600) {
        const out = 300 + rnd() * 160, x = a[0] + ((b[0] - a[0]) * t) / L + nx * out, y = a[1] + ((b[1] - a[1]) * t) / L + ny * out;
        if (rnd() < 0.45 || !inBox(x, y) || !free(x, y, 110, 60)) continue;
        const s = 0.45 + rnd() * 0.3;
        prop("glacier:ice_block", [x, y], rnd() * 360, 200 * s, { s, solid: [{ kind: "ice", x: 0, y: 0, r: 130 * s }] });
      }
    }
  }

  // ---- the snowfield: snow-covered rocks, drifts, frozen shrubs; pines thickening toward the
  // woods round Iceberg in the east ----
  scatter(["snowland:snow_boulder", "snowland:rock_cluster", "snowland:flat_slabs", "northcold:iced_rocks"], 22, IN, 170, { s: [0.6, 1], ringR: 130, keep: low });
  scatter(["snowland:snow_drift"], 14, IN, 230, { s: [0.7, 1.1], solid: "none", keep: low });
  scatter(["snowland:snow_drift"], 8, IN, 230, { s: [0.6, 1], solid: "none", keep: onIce });
  scatter(["snowland:frost_shrub", "snowland:dry_grass", "snowland:dead_branches"], 26, IN, 90, { s: [0.7, 1.1], solid: "none", keep: (x, y) => low(x, y) && !inPoly(BEACH, x, y) });
  scatter(["northcold:flattened_grass"], 10, IN, 160, { solid: "none", keep: (x, y) => low(x, y) && y < 0 });
  const grove = (c: XY, r: number, n: number, kinds = ["SnowPine", "SnowPine", "SnowPineSmall", "SnowPineSmall", "FrostOak"]) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inBox(x, y) || !free(x, y, 170, 170) || !low(x, y)) continue;
      put(`flora:${kinds[Math.floor(rnd() * kinds.length)]}`, [x, y], rnd() * 360, { s: 0.7 + rnd() * 0.45 });
      taken.push([x, y, 170]);
      made++;
    }
  };
  for (const [c, r, n] of [
    [[-2200, -4700], 900, 9], [[800, -4700], 900, 9], [[2600, -4800], 800, 7], [[4300, -4400], 800, 6], [[-4000, -4700], 600, 4], [[-1100, -3800], 500, 3],
    [[1800, -3600], 600, 4], [[-3700, -1100], 600, 4], [[-3800, 1600], 500, 3], [[-2400, 600], 400, 2], [[3600, -3800], 500, 3], [[-200, -2400], 300, 1],
    [[-2900, 1600], 500, 3], [[-3600, -3300], 500, 3], [[-1200, -3000], 400, 2], [[-2000, 1000], 400, 2], [[-3900, 300], 400, 2], [[1300, -1700], 400, 2],
  ] as [XY, number, number][]) grove(c, r, n);

  // ---- past the edges: snowy pines round Iceberg in the east and on the ridge in the south, the
  // glacier running on north (seracs on it), the sea to the west ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => [[0, 0], [300, 0], [-300, 0], [0, 300], [0, -300]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const seaward = (x: number, y: number) => inPoly(SEA, x, y - 300);
  f.woods(area, ["SnowPine", "SnowPine", "SnowPineSmall", "FrostOak", "Birch"], (x, y) => inside(x, y) || onTrack(x, y) || seaward(x, y) || f.h(x, y) > 300 || (y > -3000 && f.h(x, y) < 700), { count: 280, spacing: 430, tries: 6000 });
  f.woods(area, ["SnowPine", "SnowPineSmall"], (x, y) => onTrack(x, y) || seaward(x, y) || f.h(x, y) < 700 || inPoly(G1, x, y), { count: 90, spacing: 480, tries: 3000 });
  f.woods(area, ["snow_boulder", "rock_cluster", "flat_slabs"], (x, y) => onTrack(x, y) || seaward(x, y) || f.h(x, y) < 700 || inPoly(G1, x, y), { count: 40, spacing: 700, tries: 1500, kit: "snowland" });
  f.woods(area, ["seracs", "ice_block", "blue_ice"], (x, y) => inside(x, y) || !onIce(x, y) || seaward(x, y) || [[0, 0], [400, 0], [-400, 0], [0, 400], [0, -400]].some(([dx, dy]) => !onIce(x + dx, y + dy)), { count: 40, spacing: 900, tries: 2000, kit: "glacier" });

  // ---- monsters: worms over the glacier and the snowfield, seals on the shingle and the ice-foot ----
  const busy = (x: number, y: number) => Math.hypot(x - CAMP[0], y - CAMP[1]) < 1100 || Math.hypot(x - MAMMOTH[0] + 500, y - MAMMOTH[1] - 300) < 800 || Math.hypot(x - caveMouth[0], y - caveMouth[1]) < 500;
  f.monsterSpots(ground, IN, { step: 700, keepOut: busy, max: 52 });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "west_glacier_whaler", x: CAMP[0] - 450, y: CAMP[1] - 300, face: 330, name: "ฮัลวาร์ด", title: "นักล่าวาฬที่ติดค้าง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "blue", top: "top_warrior_navy", bottom: "bottom_warrior_cocoa" },
      lines: [
        "เรือของเราถูกน้ำแข็งบีบติดอยู่ในอ่าวนั่นมาสองหนาวแล้ว รอให้ทะเลละลายเมื่อไหร่ก็จะได้กลับบ้านกันเสียที",
        "พวกแมวน้ำเขี้ยวดาบขึ้นมาแย่งเนื้อวาฬถึงหน้ากระท่อม เขี้ยวมันยาวกว่าฉมวกของข้าอีก",
        "อย่าเดินบนธารน้ำแข็งตอนพายุหิมะ รอยแยกมันลึกจนมองไม่เห็นก้น ข้าเสียลูกเรือไปสองคนแล้ว",
      ],
    },
    {
      id: "west_glacier_scholar", x: MAMMOTH[0] - 700, y: MAMMOTH[1] + 300, face: 30, name: "อิงเกบอร์ก", title: "นักปราชญ์จากไอซ์เบิร์ก", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "teal", top: "top_adventurer_navy", bottom: "bottom_adventurer_sand" },
      lines: [
        "แมมมอธตัวนี้หลับอยู่ในน้ำแข็งมาตั้งแต่ก่อนมีอาณาจักร ธารน้ำแข็งเพิ่งคายมันออกมาเมื่อฤดูร้อนที่แล้ว",
        "หนอนยักษ์เจาะน้ำแข็งได้เหมือนเจาะหิมะ ได้ยินเสียงครืดคราดใต้เท้าเมื่อไหร่ให้รีบถอยออกมา",
        "ธารน้ำแข็งนี้ไหลลงมาจากหุบทางเหนือ ชาวไอซ์เบิร์กเล่าว่าที่นั่นมีวังของราชินีหิมะ ไม่มีใครขึ้นไปแล้วกลับมาเล่าได้",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery: [shingle.mesh, sea, poolEdge, poolMid, ...floes, ...deepSheets],
    sky: "#b3c4d4",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -300, y: -4300 },
    npcs,
    labels: [
      { x: E_EXIT[0] + 150, y: E_EXIT[1] + 350, text: "ทางไปไอซ์เบิร์ก", kind: "gate" },
      { x: N_EXIT[0] - 200, y: N_EXIT[1] + 300, text: "ทางไปหุบวังน้ำแข็ง", kind: "gate" },
      { x: CAMP[0] - 700, y: CAMP[1], text: "ค่ายนักล่าวาฬ" },
      { x: caveMouth[0] - 500, y: caveMouth[1], text: "ถ้ำน้ำแข็งสีฟ้า" },
      { x: MAMMOTH[0] - 600, y: MAMMOTH[1], text: "แมมมอธในน้ำแข็ง" },
      { x: BR.at[0] - 400, y: BR.at[1] + 300, text: "สะพานเชือกข้ามรอยแยก", kind: "small" },
      { x: 2600, y: -500, text: "ลิ้นธารน้ำแข็ง" },
      { x: 4700, y: 2000, text: "ธารน้ำแข็งตอนบน", kind: "small" },
      { x: MK_C[0], y: MK_C[1], text: "เนินหินธารน้ำแข็ง", kind: "small" },
      { x: -400, y: 2800, text: "อ่าวเรือติดน้ำแข็ง", kind: "small" },
      { x: -900, y: -2100, text: "ทุ่งหิมะ", kind: "small" },
      { x: POOL_C[0], y: POOL_C[1], text: "แอ่งน้ำแข็ง", kind: "small" },
    ],
  });
}

// หุบวังน้ำแข็ง (the Snow Queen's hollow), monsters Lv 130-140, the Snow Queen Lv 142: the far
// north-west corner of the world, where the land is all ice and ends. A hollow lies in the ice
// sheet, walled round: on the north and the west by the great ice cliff at the world's edge, its
// far face falling sheer into the frozen sea; on the east by the glacier that runs on over the
// north icefield; on the south by the terraces the ice comes down in toward the west glacier.
//
// In the hollow stand the ruins of the Snow Queen's palace, all of ice: the gate of clear ice
// (its doors stand open), walls and broken towers round a court where the knights of the old
// kingdom who came to end her stand frozen in rows along the avenue between carved columns; at
// its head the grand stair climbs onto a terrace under the great cliff, where she waits on her
// throne among spires of indigo crystal. The crystal grows all over the hollow where her cold
// runs deepest, and seracs fallen off the cliffs lie on its floor.
//
// The way in from the west glacier (the middle of the south edge) is on the upper terrace (7.2
// m); a ramp brings it down onto the lower (3.8 m) and another down into the hollow before the
// gate. A second way down from the lower terrace comes out at the hollow's west end, under the
// cliff. There is no way on: the sea only, north and west.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   way out: south (middle) -> west_glacier

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { material } from "./textures";
import { KIT as GLACIER } from "./kits/glacier";
import { KIT as SNOW, blobPoly, flatSheet } from "./kits/snowland";
import { KIT as NORTHCOLD } from "./kits/northcold";
import { KIT as ICEBERG } from "./kits/iceberg";
import { smooth, band, inPoly, toLine, dense, beyond, sheet } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(GLACIER, SNOW, NORTHCOLD, ICEBERG);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the coast: round the outer foot of the great ice cliff, from the east edge (where the north
// icefield's shore comes in) round the north and down the west to the south edge (where the west
// glacier's comes in); the sea outside it ----
const SHORE: XY[] = smooth([[3700, -A - 400], [3700, -6676], [4100, -5300], [4500, -3800], [4700, -2000], [4800, 0], [4700, 2000], [4400, 3300], [3800, 4200], [2600, 4650], [0, 4700], [-3000, 4650], [-6676, 4600], [-A - 400, 4600]], 3);
const SEA: XY[] = [...SHORE, [-A - 400, A + 400], [A + 400, A + 400], [A + 400, -A - 400]];

// ---- the levels ----
// NI: the great ice cliff round the north and west (1200, scenery), its outer face over the sea;
// EG: the glacier along the east (1050, scenery); T2: the lower terrace along the south (380),
// T1 the upper on it (720), both running on into the west glacier; PT: the throne's terrace under
// the cliff (300).
const NI: XY[] = [
  [3400, -A], [3450, -6600], [3800, -5300], [4200, -3800], [4400, -2000], [4500, 0], [4400, 2000], [4100, 3200], [3500, 4000], [2400, 4350], [0, 4400], [-2000, 4350], [-3200, 4300],
  // (its foot round the hollow kept about as far from the way in as the throne, which stands
  // farthest, under it)
  [-3400, 3700], [-2000, 3500], [-800, 3400], [500, 3300], [1100, 3000], [1700, 2400], [2400, 1900], [2800, 800], [2900, -800], [2600, -1800], [1800, -2300], [1200, -3100], [700, -3800], [500, -4300], [400, -A],
];
// (it stops short of the south-east corner, which lies low and wooded like the west glacier's
// north-east corner and the woods round Iceberg beyond it)
const EG: XY[] = [[-6100, -A], [400, -A], [500, -4300], [0, -4200], [-1500, -3800], [-2800, -4100], [-3700, -3700], [-4600, -4300], [-5500, -5100], [-6100, -6100]];
const T2: XY[] = [[-A, -2600], [-3600, -2900], [-2800, -2300], [-2300, -900], [-2100, 600], [-2400, 2000], [-2900, 3200], [-3600, 3900], [-A, 4250]];
const T1: XY[] = [[-A, -1900], [-4600, -1800], [-4100, -900], [-3900, 400], [-4200, 1700], [-4900, 2800], [-A, 3600]];
const PT: XY[] = [[1600, -1500], [2400, -1800], [3300, -1900], [3400, 0], [3300, 1800], [2400, 1700], [1600, 1400]];

// ramps: down the terraces, the second way down at the west end, the grand stair up to the throne
const RT1 = { top: [-4000, -250] as XY, bottom: [-2962, -410] as XY, width: 460 };
const RT2 = { top: [-2200, -150] as XY, bottom: [-1060, -302] as XY, width: 460 };
const RT2B = { top: [-2650, 2600] as XY, bottom: [-1589, 3043] as XY, width: 420 };
const RPT = { top: [1600, -50] as XY, bottom: [650, -50] as XY, width: 620 };

// ---- the places ----
const S_EXIT: XY = [-5150, 0];
const GATE: XY = [-300, 0];       // the palace gate, facing south
const THRONE: XY = [2330, 0];     // on the terrace, facing south down the avenue
const QUEEN: XY = [1850, 0];      // where she waits, before it (the spot farthest from the way in)
const SPAWN: XY = [-4300, 60];
const CLIFF_BACK: XY = [2850, 0]; // the cliff behind the throne, kept as drawn (no scree)

// a ramp up from the ground or a step: the track leading to its foot, up it, and on past its top
const climb = (r: { top: XY; bottom: XY }, inn = 400, out = 400): XY[] => [beyond(r.top, r.bottom, inn), r.bottom, r.top, beyond(r.bottom, r.top, out)];
const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(509, {
    hills: [
      // the hollow's floor, dipping and heaving
      { x: 300, y: -2500, r: 1200, h: -60 }, { x: 0, y: 2400, r: 1000, h: -50 }, { x: -1500, y: 1500, r: 800, h: 60 },
      { x: -1200, y: -2700, r: 900, h: 70 }, { x: 1700, y: -2700, r: 700, h: 50 }, { x: 1200, y: 2300, r: 600, h: 40 },
    ],
    plateaus: [
      { poly: dense(T2), h: 380, ramps: [RT2, RT2B] },
      { poly: dense(T1), h: 720, ramps: [RT1] },
      { poly: dense(PT, 500), h: 300, ramps: [RPT] },
      { poly: dense(NI, 700), h: 1200 },
      { poly: dense(EG, 700), h: 1050 },
    ],
    rock: "Glacier_IceCliff",
    keep: [CLIFF_BACK],
  });
  const { put, rnd } = f;

  // ---- the tracks: down from the way in over the terraces to the gate, up the avenue and the
  // grand stair to the throne; round the walls; the second way down at the west end ----
  const MAIN: XY[] = [
    ...smooth([[-7600, 0], S_EXIT, [-4450, -80], climb(RT1)[0]]), ...climb(RT1).slice(1),
    ...smooth([climb(RT1)[3], [-2550, -280], climb(RT2, 300)[0]]), ...climb(RT2, 300).slice(1),
    ...smooth([climb(RT2, 300)[3], [-700, -120], [GATE[0] - 200, 0], [GATE[0] + 400, 0], climb(RPT, 250)[0]]), ...climb(RPT, 250).slice(1, 3), [QUEEN[0] - 100, 0],
  ];
  const ROUND_E: XY[] = smooth([[-900, -200], [-500, -1200], [100, -2200], [800, -2700]]);
  const WEST_WAY: XY[] = [...smooth([[-2700, -300], [-3100, 600], [-3100, 1700], climb(RT2B)[3]]), ...climb(RT2B).slice(0, 3).reverse(), ...smooth([beyond(RT2B.top, RT2B.bottom, 400), [-900, 2700], [-900, 1500], [-950, 400], [-900, -150]])];
  const TRACKS = [MAIN, ROUND_E, WEST_WAY];
  const roads = [band(MAIN, 460), band(ROUND_E, 380), band(WEST_WAY, 380)];

  // the palace's floor of polished ice, under the court and on the throne's terrace
  const COURT: XY[] = [[GATE[0] + 150, -1200], [1100, -1200], [1100, 1200], [GATE[0] + 150, 1200]];
  const DAIS: XY[] = [[1850, -1300], [2650, -1300], [2650, 1300], [1850, 1300]];

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ROAD: [number, number, number] = [0.76, 0.8, 0.92];
  const ground = f.ground({ area, roads, plazas: [COURT], water: [SEA], base: "snow", road: ROAD, plaza: [0.78, 0.9, 1.05] });

  // ---- the ice's colour: the hollow's floor and the terraces bluish, the old ice banded, the
  // floor before the cliff deepest blue ----
  {
    const geo = ground.mesh.geometry, pos = geo.getAttribute("position"), col = new Float32Array(pos.count * 3);
    const ICE = [0.66, 0.83, 1.06], DEEP = [0.55, 0.72, 1.05];
    const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
    for (let i = 0; i < pos.count; i++) {
      const x = ground.mesh.position.x + pos.getX(i), y = -(ground.mesh.position.z + pos.getZ(i)), h = pos.getY(i);
      let c = [1, 1, 1];
      const banded = 0.5 + 0.5 * Math.sin((x * 0.9 + 300 * Math.sin(y / 1500)) / 340);
      if (h > 300 && h < 760) c = mix(c, ICE, 0.35 + 0.4 * banded * banded);
      else if (h < 300) c = mix(c, ICE, 0.25 + 0.2 * banded);
      c = mix(c, DEEP, ss(1800, 300, toLine([x, y], NI.slice(13))) * 0.5);
      col.set(c, i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    (ground.mesh.material as THREE.MeshStandardMaterial).vertexColors = true;
  }

  // ---- the sea: dark and still under the ice cliff, floes and bergs on it ----
  const sea = sheet(SEA, -14, "Glacier_Sea");
  const floeMat = material("Glacier_Floe"), floes: THREE.Object3D[] = [];
  for (const [x, y, r, s] of [[5300, -3000, 300, 91], [5600, 600, 260, 92], [5200, 3300, 240, 93], [4300, 5300, 300, 94], [1000, 5300, 280, 95], [-2600, 5400, 260, 96], [-5200, 5500, 300, 97], [6300, -1200, 340, 98], [5000, -4800, 220, 99]] as number[][])
    floes.push(flatSheet(blobPoly([x, y], r, r * 0.7, s, 0.25, 10), -11, floeMat));
  for (const [x, y, h, s] of [[5900, -2200, 30, 1.2], [6100, 2200, 160, 1.1], [3200, 5700, 250, 1.3], [-1200, 5800, 90, 1], [-4600, 6200, 300, 1.2], [6400, -4600, 200, 1]] as number[][])
    put("iceberg:ice_floe", [x, y], h, { s, z: -40 * s, solid: "none" });
  for (const [x, y, h] of [[5400, -1800, 30], [5300, 2600, 140], [2000, 5200, 260], [-3600, 5100, 90]] as number[][])
    put("northcold:drift_floes", [x, y], h, { z: -14, solid: "none" });

  // ---- the way out ----
  f.exit("west_glacier", S_EXIT, [-4450, 30]);

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
  const PALACE = { x0: GATE[0] - 300, x1: 2900, y0: -1900, y1: 1900 };
  const inPalace = (x: number, y: number) => x > PALACE.x0 && x < PALACE.x1 && y > PALACE.y0 && y < PALACE.y1;
  taken.push([700, 0, 1400], [2200, 0, 900]);
  const floor = (x: number, y: number) => f.h(x, y) < 200 && !inPalace(x, y);
  const terrace = (x: number, y: number) => f.h(x, y) > 330 && f.h(x, y) < 780;

  // ---- the palace: the gate of clear ice, walls and broken towers round the court, carved
  // columns and the frozen knights in rows down the avenue ----
  const GATE_SOLID: SolidSpec[] = [{ kind: "tower", x: 0, y: -470, r: 230 }, { kind: "tower", x: 0, y: 470, r: 230 }, { kind: "wall", x: 0, y: -300, w: 160, d: 60, rot: 0 }, { kind: "wall", x: 0, y: 300, w: 160, d: 60, rot: 0 }];
  put("glacier:palace_gate", GATE, 0, { solid: GATE_SOLID });
  const WALL_SOLID: SolidSpec[] = [{ kind: "wall", x: 0, y: 0, w: 170, d: 800, rot: 0 }];
  // the south front either side of the gate, the side walls back to the terrace (one broken)
  for (const sy of [-1, 1]) {
    put("glacier:palace_wall", [GATE[0], sy * 1100], 0, { solid: WALL_SOLID });
    put(sy > 0 ? "glacier:palace_wall" : "glacier:palace_wall_broken", [GATE[0] + 700, sy * 1600], sy > 0 ? -90 : 90, { solid: sy > 0 ? WALL_SOLID : [{ kind: "wall", x: 0, y: -200, w: 170, d: 400, rot: 0 }] });
    put(sy > 0 ? "glacier:palace_wall_broken" : "glacier:palace_wall", [GATE[0] + 1500, sy * 1600], sy > 0 ? -90 : 90, { solid: sy > 0 ? [{ kind: "wall", x: 0, y: -200, w: 170, d: 400, rot: 0 }] : WALL_SOLID });
    put("glacier:palace_tower", [GATE[0], sy * 1650], 0, { s: 0.85, solid: [{ kind: "tower", x: 0, y: 0, r: 280 }] });
    put("glacier:palace_tower", [1750, sy * 1750], 90, { s: 0.75, solid: [{ kind: "tower", x: 0, y: 0, r: 260 }] });
  }
  // the court's columns and the frozen knights, in rows down the avenue
  for (const x of [200, 650]) for (const sy of [-1, 1]) put("glacier:ice_column", [x, sy * 520], 0, { s: 0.9, solid: [{ kind: "post", x: 0, y: 0, r: 75 }] });
  for (const x of [0, 300, 600, 900]) for (const sy of [-1, 1]) put("glacier:frozen_warrior", [x, sy * 880], sy > 0 ? -90 : 90, { solid: [{ kind: "ice", x: 0, y: 0, r: 85 }] });
  // ---- the throne's terrace: the throne under the cliff, columns, crystal either side, more
  // knights frozen kneeling before her ----
  for (const x of [DAIS[0][0] + 200, DAIS[0][0] + 600]) for (let y = -1200; y <= 1200; y += 400) put("glacier:palace_floor", [x, y], 0, { solid: "none" });
  put("glacier:ice_throne", THRONE, 0, { s: 0.9, solid: [{ kind: "throne", x: 40, y: 0, w: 600, d: 600, rot: 0 }] });
  for (const [x, y] of [[1950, -1050], [1950, 1050], [2550, -1150], [2550, 1150]] as XY[]) put("glacier:ice_column", [x, y], 0, { solid: [{ kind: "post", x: 0, y: 0, r: 80 }] });
  for (const sy of [-1, 1]) put("glacier:azure_crystals", [2750, sy * 1450], sy * 60, { s: 0.9, solid: [{ kind: "crystal", x: 0, y: 0, r: 230 }] });
  for (const [x, y, h] of [[1750, -650, 20], [1750, 650, -20]] as number[][]) put("glacier:frozen_warrior", [x, y], h, { s: 0.9, solid: [{ kind: "ice", x: 0, y: 0, r: 80 }] });
  // the army that never reached the gate: knights frozen in ranks on the snow before it
  for (let i = 0; i < 4; i++) for (const y of [-1700, -2050]) {
    const at: XY = [-1700 + i * 330 + (rnd() - 0.5) * 60, y + (rnd() - 0.5) * 60];
    if (free(at[0], at[1], 90)) prop("glacier:frozen_warrior", at, 180 + (rnd() - 0.5) * 30, 110, { solid: [{ kind: "ice", x: 0, y: 0, r: 85 }] });
  }

  // ---- the hollow: spires of indigo crystal, seracs fallen off the cliff, ice boulders and blue
  // ice; on the terraces more of the glacier's seracs and cracks ----
  const CRYSTALS: [XY, number, number][] = [[[1100, -2500], 1.1, 30], [[1000, 2500], 0.9, 200], [[-1800, 2800], 0.8, 100], [[-600, -3300], 0.85, 300], [[1500, 2000], 0.7, 60], [[-2600, 1500], 0.6, 260], [[200, 2900], 0.7, 140], [[600, -3400], 0.75, 20], [[1650, -1950], 0.6, 120]];
  for (const [at, s, h] of CRYSTALS) if (free(at[0], at[1], 220 * s)) prop("glacier:azure_crystals", at, h, 280 * s, { s, solid: [{ kind: "crystal", x: 0, y: 0, r: 220 * s }] });
  const SERACS: [XY, number, number][] = [[[1300, 2600], 0.6, 40], [[1500, -2400], 0.65, 160], [[-1000, 3000], 0.7, 280], [[-3800, 1500], 0.8, 80], [[-4300, -1300], 0.7, 200], [[-3200, -2000], 0.6, 20], [[-4700, 3200], 0.8, 120]];
  for (const [at, s, h] of SERACS) if (free(at[0], at[1], 300 * s)) prop("glacier:seracs", at, h, 330 * s, { s, solid: [{ kind: "ice", x: 0, y: 0, r: 260 * s }] });
  scatter(["glacier:ice_block"], 18, IN, 150, { s: [0.5, 0.95], ringR: 120 });
  scatter(["glacier:blue_ice"], 10, IN, 340, { s: [0.7, 1.1], solid: "none" });
  scatter(["glacier:ice_crack"], 8, IN, 420, { s: [0.7, 1], solid: "none", keep: terrace });
  scatter(["glacier:azure_crystals"], 5, IN, 200, { s: [0.35, 0.55], ringR: 140, keep: floor });
  scatter(["snowland:ice_crystals"], 12, IN, 120, { s: [0.7, 1.1], ringR: 70 });
  scatter(["snowland:snow_drift"], 14, IN, 230, { s: [0.7, 1.1], solid: "none" });
  scatter(["northcold:iced_rocks", "snowland:snow_boulder"], 10, IN, 170, { s: [0.6, 0.9], ringR: 130 });
  // ice fallen at the foot of the cliffs
  for (const poly of [NI, EG, T1, T2]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (inPoly(poly, mx + nx * 50, my + ny * 50)) [nx, ny] = [-nx, -ny];
      for (let t = 300; t < L - 200; t += 600) {
        const out = 300 + rnd() * 160, x = a[0] + ((b[0] - a[0]) * t) / L + nx * out, y = a[1] + ((b[1] - a[1]) * t) / L + ny * out;
        if (rnd() < 0.45 || !inBox(x, y) || inPalace(x, y) || !free(x, y, 110, 60)) continue;
        const s = 0.45 + rnd() * 0.3;
        prop("glacier:ice_block", [x, y], rnd() * 360, 200 * s, { s, solid: [{ kind: "ice", x: 0, y: 0, r: 130 * s }] });
      }
    }
  }
  // snowy pines in the low corner toward Iceberg
  for (let i = 0, made = 0; i < 120 && made < 10; i++) {
    const x = -5300 + rnd() * 1900, y = -5300 + rnd() * 2300;
    if (!inBox(x, y) || f.h(x, y) > 60 || !free(x, y, 170, 170)) continue;
    put(`flora:${rnd() < 0.6 ? "SnowPine" : "SnowPineSmall"}`, [x, y], rnd() * 360, { s: 0.7 + rnd() * 0.4 });
    taken.push([x, y, 170]);
    made++;
  }
  // the way in: a cairn and the frozen standard of the knights who went before
  prop("snowland:cairn", [S_EXIT[0] + 500, S_EXIT[1] - 450], 0, 70, ring(45));
  prop("snowland:expedition_flag", [S_EXIT[0] + 900, S_EXIT[1] + 500], 0, 90, ring(40, "post"));
  prop("snowland:trail_sign", [GATE[0] - 900, -450], 180, 80, ring(30, "post"));

  // ---- past the edges: the glacier's seracs on the cliff tops and terraces, a few snowy pines
  // in the low corner toward Iceberg; nothing on the sea ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => [[0, 0], [300, 0], [-300, 0], [0, 300], [0, -300]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const seaward = (x: number, y: number) => [[0, 0], [400, 0], [-400, 0], [0, 400], [0, -400]].some(([dx, dy]) => inPoly(SEA, x + dx, y + dy));
  f.woods(area, ["seracs", "ice_block", "seracs", "blue_ice"], (x, y) => inside(x, y) || onTrack(x, y) || seaward(x, y), { count: 90, spacing: 800, tries: 3000, kit: "glacier" });
  // (and on the cliff tops inside the box, where nobody walks: seracs and crystal against the sky)
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["seracs", "ice_block", "seracs", "azure_crystals"], (x, y) => f.h(x, y) < 1000 || seaward(x, y), { count: 40, spacing: 650, tries: 2000, kit: "glacier" });
  f.woods(area, ["SnowPine", "SnowPine", "SnowPineSmall", "FrostOak"], (x, y) => inside(x, y) || onTrack(x, y) || seaward(x, y) || f.h(x, y) > 100 || x > -3500 || y > -2700, { count: 70, spacing: 450, tries: 2500 });

  // ---- monsters: the frozen knights over the hollow, the terraces and the palace court; the
  // Queen on the spot farthest from the way in (before her throne): every other spot nearer ----
  const reach = Math.hypot(QUEEN[0] - SPAWN[0], QUEEN[1] - SPAWN[1]) - 120;
  // (and none on the strip of shore under the terraces' west end, which no way reaches)
  const quiet = (x: number, y: number) => Math.hypot(x - SPAWN[0], y - SPAWN[1]) > reach || (inPalace(x, y) && x > 1500) || y > 3900;
  f.monsterSpots(ground, IN, { step: 590, keepOut: quiet, max: 52 });
  f.spots.push({ x: QUEEN[0], y: QUEEN[1] });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "ice_queen_hollow_knight", x: -4000, y: 700, face: 0, name: "เซอร์เอริค", title: "อัศวินผู้รอดจากวังน้ำแข็ง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "gold", eyes: "blue", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "พวกเรามาสิบสองคนเพื่อปลดคำสาปของราชินีหิมะ ตอนนี้เพื่อนข้าทั้งสิบเอ็ดยืนแข็งอยู่หน้าประตูวังนั่น",
        "ประตูวังทำจากน้ำแข็งใส มองทะลุเข้าไปเห็นนางนั่งรออยู่บนบัลลังก์ เหมือนรู้ว่าเราจะมา",
        "นางเรียกอัศวินที่แข็งตายให้ลุกขึ้นมาสู้แทน ถ้าเจ้าจะไป จงไปเป็นกลุ่ม และอย่าให้ความหนาวของนางแตะตัว",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery: [sea, ...floes],
    sky: "#b9c6d6",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: SPAWN[0], y: SPAWN[1] },
    npcs,
    labels: [
      { x: S_EXIT[0] + 250, y: S_EXIT[1] + 300, text: "ทางไปธารน้ำแข็งตะวันตก", kind: "gate" },
      { x: 500, y: 0, text: "วังน้ำแข็งของราชินีหิมะ" },
      { x: THRONE[0] - 300, y: 0, text: "บัลลังก์น้ำแข็ง" },
      { x: GATE[0] - 350, y: 0, text: "ประตูวังน้ำแข็งใส", kind: "small" },
      { x: 1000, y: 2000, text: "หน้าผาน้ำแข็งสุดขอบโลก" },
      { x: -4300, y: 1800, text: "ลานธารน้ำแข็ง", kind: "small" },
      { x: -1500, y: -1900, text: "ทัพอัศวินแช่แข็ง", kind: "small" },
      { x: 1300, y: -2700, text: "ดงผลึกคราม", kind: "small" },
    ],
  });
}

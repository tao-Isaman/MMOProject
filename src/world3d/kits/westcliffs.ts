// ผาหิมะริมทะเลตะวันตก (the westcliffs field kit): the snowy cliffs over the western sea round the
// highland downs, for the valley of the humming stones and the cliffs of the snow abbey.
//
// The humming stones: pillars of soft stone the sea wind has hollowed out and pierced, standing
// alone or in groves, that hum when it blows through them; the giant harp, a rock frame strung
// with columns of stone and ice; boulders worn into holes; the caves in the cliffs where the echo
// bats roost; the old poet's hermitage with its porch, his desk and the poems hung out on a line,
// wind chimes on a post and a stele cut with his verses. The snow abbey: the abandoned church on
// the crag with its empty bell-cote and its fallen bay, the monks' cells behind an arcade, the
// abbey's walls (whole and broken) and its gate, the bell pavilion where the great bell now
// hangs, the stone stairs up the terraces, prayer flags, the ledge where an ascetic sits, a
// waystone with a little bell, the old jetty where the boats came in. The shore: coastal granite
// with orange lichen, a jagged spire, scree, pale sea grass and cushions of thrift in the snow, a
// pine snapped by the wind, reefs with the surf breaking white round them and a sea arch.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front facing -X.
// The pieces that stand in the sea (the reef, the arch, the jetty) have z = 0 at its surface.

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, torus, gableRoof, gableWall, rock, paint, noise3,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import { fallenTrunk, snag, endGrain, coverTop, pebbles } from "../nature";
import type { Kit } from "./types";

// ---- the kit's own materials ----
defineMaterial("Westcliffs_Granite", { map: "crag", tint: "#a2a6ad", bump: 3 });
defineMaterial("Westcliffs_GraniteDark", { map: "crag", tint: "#666b74", bump: 3 });
defineMaterial("Westcliffs_SeaRock", { map: "crag", tint: "#50545c", bump: 3.5 });
defineMaterial("Westcliffs_Pillar", { map: "crag", tint: "#bdb5a6", bump: 2.5 });
defineMaterial("Westcliffs_Hollow", { tint: "#17161a", rough: 1 });
defineMaterial("Westcliffs_Ice", { map: "ice", tint: "#d6eef8", rough: 0.1, opacity: 0.88 });
defineMaterial("Westcliffs_IceDeep", { map: "ice", tint: "#8fc4df", rough: 0.12 });
defineMaterial("Westcliffs_Foam", { map: "snow", tint: "#f2f7fa", rough: 0.85 });
defineMaterial("Westcliffs_Guano", { map: "plaster", tint: "#ebe9df", rough: 1 });
defineMaterial("Westcliffs_Bone", { map: "adobe", tint: "#e0d6bf", bump: 1 });
defineMaterial("Westcliffs_Dark", { tint: "#121114", rough: 1 });
defineMaterial("Westcliffs_Slate", { map: "stone", tint: "#5d6470", bump: 1.5 });
defineMaterial("Westcliffs_SlateDark", { map: "stone", tint: "#3c414a", bump: 1.5 });
defineMaterial("Westcliffs_AbbeyStone", { map: "stone", tint: "#bbb6aa", bump: 2 });
defineMaterial("Westcliffs_AbbeyStoneDark", { map: "stone", tint: "#8b877e", bump: 2 });
defineMaterial("Westcliffs_Rubble", { map: "crag", tint: "#9a958b", bump: 2.5 });
defineMaterial("Westcliffs_Timber", { map: "wood", tint: "#6b5745", bump: 1.3 });
defineMaterial("Westcliffs_TimberDark", { map: "wood", tint: "#463a2f", bump: 1.3 });
defineMaterial("Westcliffs_Plank", { map: "wood", tint: "#9c8567", bump: 1.2 });
defineMaterial("Westcliffs_Bronze", { map: "metal", tint: "#9a7440", rough: 0.38, metal: 0.75 });
defineMaterial("Westcliffs_Verdigris", { map: "metal", tint: "#6f9a84", rough: 0.6, metal: 0.3 });
defineMaterial("Westcliffs_Iron", { map: "metal", tint: "#3b3c42", rough: 0.6, metal: 0.45 });
defineMaterial("Westcliffs_Straw", { map: "thatch", tint: "#cbb478", rough: 1 });
defineMaterial("Westcliffs_SeaGrass", { map: "thatch", tint: "#cdc39a", rough: 1 });
defineMaterial("Westcliffs_SeaGrassDry", { map: "thatch", tint: "#a99a69", rough: 1 });
defineMaterial("Westcliffs_Thrift", { map: "felt", tint: "#d983a8", rough: 0.95 });
defineMaterial("Westcliffs_ThriftFaded", { map: "felt", tint: "#c9a5b4", rough: 0.95 });
defineMaterial("Westcliffs_Cushion", { map: "felt", tint: "#5d6d47", rough: 1 });
defineMaterial("Westcliffs_BarkGrey", { map: "bark", tint: "#8b847a", bump: 2 });
defineMaterial("Westcliffs_Paper", { map: "paper", tint: "#efe6cf", rough: 0.9 });
defineMaterial("Westcliffs_Ink", { tint: "#2b2722", rough: 0.9 });
defineMaterial("Westcliffs_Robe", { map: "fabric", tint: "#8c7c5f", rough: 1 });
defineMaterial("Westcliffs_Smoke", { tint: "#a7abb1", rough: 1, opacity: 0.32 });
defineMaterial("Westcliffs_GlassBlue", { tint: "#3d5f8f", rough: 0.15, glow: "#4a77b8", glowI: 0.25 });
defineMaterial("Westcliffs_GlassRed", { tint: "#8f3a35", rough: 0.15, glow: "#c4503e", glowI: 0.25 });
defineMaterial("Westcliffs_Ember", { tint: "#ff9a4a", glow: "#ff7a2a", glowI: 1.2 });
// for the fields: the sea cliffs, the inland cliffs, the cold sea
defineMaterial("Westcliffs_CliffSea", { map: "crag", tint: "#6a6f78", bump: 3.5 });
defineMaterial("Westcliffs_CliffGrey", { map: "crag", tint: "#a7adb6", bump: 3 });
defineMaterial("Westcliffs_WestSea", { tint: "#1f465b", rough: 0.06, opacity: 0.95 });
const LOG_END = endGrain("#b9a684");
const LOG_END_DARK = endGrain("#8f7656");

const DEG = 180 / Math.PI;

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// ---- shared pieces ----

// Centre a Geo on its footprint (x, y), leaving z alone.
function centre(g: Geo): Geo {
  const b = new THREE.Box3();
  for (const p of g) {
    p.geo.computeBoundingBox();
    b.union(p.geo.boundingBox!);
  }
  return translate(g, [-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0]);
}

const bb = boxBounds;
// A flattened ball (a snow clump, a puff of smoke, a fleck of foam).
const blob = (r: number, at: V3, mat: string, sz = 0.45, segs = 8): Geo => translate(scale(sphereCenter(r, [0, 0, 0], mat, segs), [1, 1, sz]), at);

// A soft low drift lx by ly, h high, at `at`: a lumpy dome, smooth-shaded.
function drift(lx: number, ly: number, h: number, seed: number, at: V3 = [0, 0, 0], turn = 0, mat = "Snow"): Geo {
  const rnd = seeded(seed);
  const geo = new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const P = geo.getAttribute("position");
  const bumps = Array.from({ length: 4 }, () => [rnd() * Math.PI * 2, 0.08 + rnd() * 0.14, 1 + Math.floor(rnd() * 3)]);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), ang = Math.atan2(z, x);
    let r = 1;
    for (const [ph, amp, k] of bumps) r += amp * Math.sin(ang * k + ph);
    P.setXYZ(i, (x * r * lx) / 2, (-z * r * ly) / 2, y ** 0.8 * h * (0.85 + 0.15 * r) - 2);
  }
  geo.computeVertexNormals();
  const flat = geo.toNonIndexed();
  const F = flat.getAttribute("position"), uv = new Float32Array(F.count * 2);
  for (let i = 0; i < F.count; i++) {
    uv[i * 2] = F.getX(i) / 100;
    uv[i * 2 + 1] = F.getY(i) / 100;
  }
  flat.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return translate(rotateZ([{ geo: flat, mat }], turn), at);
}

// Snow on what faces up; lichen in patches over a stone's sides and top.
const snowOn = (g: Geo, amount: number, seed: number, thick = 4): Geo => coverTop(g, "Snow", { amount, thick, seed, ragged: 0.18 });
// (lichen is painted into the stone's own colours, in soft blotches that run across its facets;
// the parts are changed in place, and nothing is added)
const ORANGE: V3 = [1.32, 0.96, 0.58], GREY: V3 = [1.0, 1.05, 0.86];
function lichenOn(g: Geo, seed: number, share = 0.28, tint: V3 = ORANGE): Geo {
  for (const part of g) {
    const pos = part.geo.getAttribute("position");
    let col = part.geo.getAttribute("color") as THREE.BufferAttribute | undefined;
    if (!col) part.geo.setAttribute("color", (col = new THREE.BufferAttribute(new Float32Array(pos.count * 3).fill(1), 3)));
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), k = noise3(x / 26 + 3, y / 26, z / 26, seed) - (1 - share);
      if (z < 8 || k <= 0) continue;
      const f = Math.min(1, k * 8);
      col.setXYZ(i, col.getX(i) * (1 + (tint[0] - 1) * f), col.getY(i) * (1 + (tint[1] - 1) * f), col.getZ(i) * (1 + (tint[2] - 1) * f));
    }
  }
  return [];
}

// A solid of revolution round Z from a profile of [radius, height] points (bottom to top), its
// surface pushed in and out a little by noise when `wobble` is given; texture in metres.
function lathe(prof: [number, number][], segs: number, mat: string, wobble?: { amp: number; seed: number; zScale?: number }): Geo {
  const geo = new THREE.LatheGeometry(prof.map(([r, z]) => new THREE.Vector2(Math.max(0.01, r), z)), segs);
  // three.js turns it round +Y: x and z across, y up
  const P = geo.getAttribute("position");
  if (wobble)
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      if (Math.hypot(x, z) < 0.5) continue;
      const a = Math.atan2(z, x), k = 1 + wobble.amp * 2 * (noise3(Math.cos(a) * 1.3 + 5, Math.sin(a) * 1.3 + 5, y / (wobble.zScale ?? 80), wobble.seed) - 0.5);
      P.setXYZ(i, x * k, y, z * k);
    }
  let len = 0, rmax = 0;
  for (let i = 1; i < prof.length; i++) len += Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]);
  for (const [r] of prof) rmax = Math.max(rmax, r);
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * Math.PI * 2 * rmax) / 100, (uv.getY(i) * len) / 100);
  geo.computeVertexNormals();
  // (the seam's two columns of points share their normals, so it does not show)
  const N = geo.getAttribute("normal"), m = prof.length;
  for (let j = 0; j < m; j++) {
    const a = j, b = segs * m + j;
    const nx = N.getX(a) + N.getX(b), ny = N.getY(a) + N.getY(b), nz = N.getZ(a) + N.getZ(b), l = Math.hypot(nx, ny, nz) || 1;
    N.setXYZ(a, nx / l, ny / l, nz / l);
    N.setXYZ(b, nx / l, ny / l, nz / l);
  }
  return rotateX([{ geo: geo.toNonIndexed(), mat }], 90);
}

// Icicles hanging under the line a-b.
function icicles(a: V3, b: V3, seed: number, step = 22, maxLen = 50, mat = "Westcliffs_Ice"): Geo {
  const rnd = seeded(seed), parts: Geo[] = [];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  for (let t = step * 0.5; t < len - 6; t += step * (0.7 + rnd() * 0.6)) {
    if (rnd() < 0.3) continue;
    const f = t / len, L = 10 + rnd() * rnd() * maxLen;
    const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, z = a[2] + (b[2] - a[2]) * f;
    parts.push(cylinderAt({ rBot: 0.5, rTop: 2.5 + rnd() * 2.5, height: L, segments: 5, bottom: [x, y, z - L + 1] }, mat));
  }
  return merge(...parts);
}

// A rope through points; the points of a line sagging from a to b.
function rope(pts: V3[], r: number, mat = "RopeTan"): Geo {
  return merge(...pts.slice(1).map((p, i) => cylinderBetween(pts[i], p, r, 4, mat)));
}
function sagLine(a: V3, b: V3, sag: number, n: number): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - sag * 4 * t * (1 - t)] as V3;
  });
}

// A limb of rock along a curve through `pts`, round, `r0` thick at its start and `r1` at its end,
// its surface swelling and narrowing as the stone has worn (the harp's frame, a sea arch).
function rockTube(pts: V3[], r0: number, r1: number, seed: number, mat: string, rings = 22, sides = 10): Geo {
  const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(c, rings, 1, sides, false);
  const P = geo.getAttribute("position"), N = geo.getAttribute("normal");
  for (let i = 0; i <= rings; i++) {
    const t = i / rings, cp = c.getPointAt(t), r = r0 + (r1 - r0) * t;
    for (let j = 0; j <= sides; j++) {
      const k = i * (sides + 1) + j, nx = N.getX(k), ny = N.getY(k), nz = N.getZ(k);
      const w = r * (1 + 0.16 * (noise3(cp.x / 60 + nx, cp.y / 60 + ny, cp.z / 60 + nz, seed) - 0.5) * 2);
      P.setXYZ(k, cp.x + nx * w, cp.y + ny * w, cp.z + nz * w);
    }
  }
  geo.computeVertexNormals();
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * c.getLength()) / 100, (uv.getY(i) * 2 * Math.PI * r0) / 100);
  return [{ geo: geo.toNonIndexed(), mat }];
}

// Smoke rising from `at`: puffs growing and thinning as they go up, drifting.
function plume(at: V3, n: number, r: number, seed: number, drift2: [number, number] = [0, 0]): Geo {
  const rnd = seeded(seed), parts: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const k = i / Math.max(1, n - 1), rr = r * (0.7 + k * 0.9) * (0.85 + rnd() * 0.3);
    parts.push(blob(rr, [at[0] + drift2[0] * k + (rnd() - 0.5) * r * 0.6, at[1] + drift2[1] * k + (rnd() - 0.5) * r * 0.6, at[2] + i * 36 + rnd() * 14], "Westcliffs_Smoke", 0.75, 7));
  }
  return merge(...parts);
}

// A ring of surf round a rock at the waterline: flecks of foam heaped where the waves break and
// trailing off on the lee side. `rx`, `ry` the ring's radii round `at`.
function surf(at: [number, number], rx: number, ry: number, seed: number, n = 14): Geo {
  const rnd = seeded(seed), parts: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.3, k = 0.95 + rnd() * 0.25;
    const r = 22 + rnd() * 26;
    parts.push(blob(r, [at[0] + Math.cos(a) * rx * k, at[1] + Math.sin(a) * ry * k, 1], "Westcliffs_Foam", 0.22 + rnd() * 0.12, 7));
  }
  // the lacy trail off the lee side (+Y): small flecks thinning out
  for (let i = 0; i < 8; i++) {
    const d = 1.1 + i * 0.18, w = (rnd() - 0.5) * rx * (0.6 + i * 0.12);
    parts.push(blob(10 + rnd() * 12 * (1 - i / 10), [at[0] + w, at[1] + ry * d, 0], "Westcliffs_Foam", 0.2, 6));
  }
  return merge(...parts);
}

// Wind chimes hanging from `at` (the hook): a little wooden disc, tubes of bronze of graded
// lengths round it, the striker between them and its sail below to catch the wind.
function chimes(at: V3, seed: number, n = 6, s = 1): Geo {
  const rnd = seeded(seed), parts: Geo[] = [];
  const top: V3 = [at[0], at[1], at[2] - 14 * s];
  parts.push(cylinderBetween(at, top, 0.6, 4, "RopeTan"));
  parts.push(cylinderAt({ radius: 13 * s, height: 3 * s, segments: 10, bottom: [top[0], top[1], top[2] - 3 * s] }, "Westcliffs_TimberDark"));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, len = (34 + i * 9) * s, x = top[0] + Math.cos(a) * 9 * s, y = top[1] + Math.sin(a) * 9 * s;
    const z0 = top[2] - 5 * s - rnd() * 4 * s;
    parts.push(cylinderBetween([x, y, top[2] - 3 * s], [x, y, z0], 0.4, 3, "RopeTan"));
    parts.push(cylinderAt({ radius: 1.8 * s, height: len, segments: 6, bottom: [x, y, z0 - len] }, i % 3 === 2 ? "Westcliffs_Verdigris" : "Westcliffs_Bronze"));
  }
  const zs = top[2] - 40 * s;
  parts.push(cylinderBetween([top[0], top[1], top[2] - 3 * s], [top[0], top[1], zs - 30 * s], 0.5, 3, "RopeTan"));
  parts.push(cylinderAt({ radius: 6 * s, height: 2 * s, segments: 8, bottom: [top[0], top[1], zs] }, "Westcliffs_Plank"));
  parts.push(bb([top[0] - 1, top[1] - 8 * s, zs - 60 * s], [top[0] + 1, top[1] + 8 * s, zs - 30 * s], "FabricRed"));
  return merge(...parts);
}

// A small flat cap of stone (a coping, a lintel) with snow along its top.
function coped(min: V3, max: V3, mat: string, seed: number, snow = 0.7): Geo {
  const g = bb(min, max, mat, 2.5);
  return snow > 0 ? merge(g, snowOn(g, snow, seed, 3)) : g;
}

// An arch of voussoirs: a half ring of `n` blocks in the plane x = x0, round (y0, z0), radius r,
// `w` deep along X and `t` thick across the ring.
function archRing(x0: number, y0: number, z0: number, r: number, w: number, t: number, n: number, mat: string, key = mat): Geo {
  const parts: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI, y = y0 + Math.cos(a) * (r + t / 2), z = z0 + Math.sin(a) * (r + t / 2);
    const seg = (Math.PI * (r + t / 2)) / n;
    parts.push(translate(rotateX(box([w, seg - 2, t], [0, 0, 0], i === Math.floor(n / 2) ? key : mat, 1.5), a * DEG - 90), [x0, y, z]));
  }
  return merge(...parts);
}

// The stone filling over an arch's ring (its spandrels): slices from the ring's outside up to
// `zTop`, x0..x1 deep, `halfW` either side of y0.
function spandrels(x0: number, x1: number, y0: number, z0: number, rOut: number, halfW: number, zTop: number, mat: string): Geo {
  const parts: Geo[] = [], step = 20;
  for (let y = -halfW; y < halfW - 0.1; y += step) {
    const ym = Math.min(Math.abs(y), Math.abs(y + step), y < 0 && y + step > 0 ? 0 : Infinity);
    const zc = ym < rOut ? z0 + Math.sqrt(rOut * rOut - ym * ym) : z0;
    if (zTop - zc < 2) continue;
    parts.push(bb([x0, y0 + y, zc - 6], [x1, y0 + Math.min(y + step, halfW), zTop], mat));
  }
  return merge(...parts);
}

// A tall window with a pointed head in a wall facing -X (or +X: `out` -1 / 1) at (x, y), its sill
// at z: a stone surround, dark leaded glass.
function lancet(x: number, y: number, z: number, w: number, h: number, out: number, glass = "Westcliffs_GlassBlue"): Geo {
  const f = out * 4, parts: Geo[] = [
    bb([x + f - 5, y - w / 2, z], [x + f + 5, y + w / 2, z + h], glass),
    translate(rotateX(box([10, w * 0.71, w * 0.71], [0, 0, 0], glass), 45), [x + f, y, z + h]),
    bb([x + out * 6 - 7, y - w / 2 - 12, z - 12], [x + out * 6 + 7, y + w / 2 + 12, z], "Westcliffs_AbbeyStone", 2),
    bb([x + out * 6 - 6, y - w / 2 - 10, z], [x + out * 6 + 6, y - w / 2, z + h], "Westcliffs_AbbeyStone", 1.5),
    bb([x + out * 6 - 6, y + w / 2, z], [x + out * 6 + 6, y + w / 2 + 10, z + h], "Westcliffs_AbbeyStone", 1.5),
    // the lead cames
    bb([x + f + out * 6 - 1, y - 1.5, z], [x + f + out * 6 + 1, y + 1.5, z + h], "Westcliffs_Iron"),
    bb([x + f + out * 6 - 1, y - w / 2, z + h * 0.5 - 1.5], [x + f + out * 6 + 1, y + w / 2, z + h * 0.5 + 1.5], "Westcliffs_Iron"),
  ];
  for (const s of [-1, 1]) parts.push(translate(rotateX(box([12, 10, w * 0.62], [0, 0, 0], "Westcliffs_AbbeyStone", 1.5), s * 45), [x + out * 6, y + s * w * 0.27, z + h + w * 0.27]));
  return merge(...parts);
}

// ======================================================================================
// ---- the shore and the snow ----

// Granite of the coast: a big rounded block and a smaller one leaning on it, orange and grey
// lichen in patches over them, snow on their tops and drifted at their feet. About 3.4 x 2.6 m.
function coastGranite(): Geo {
  const a = rock([300, 240, 200], 0.3, 1101, "Westcliffs_Granite");
  const b = translate(rotateZ(rock([150, 120, 110], 0.38, 1103, "Westcliffs_GraniteDark"), 30), [150, 110, 0]);
  const c = translate(rock([70, 60, 40], 0.45, 1105, "Westcliffs_Granite"), [-150, -110, 0]);
  const g = merge(a, b, c);
  return centre(merge(g, lichenOn(g, 1107), lichenOn(g, 1109, 0.18, GREY), snowOn(merge(a, b), 0.3, 1111, 5), drift(240, 150, 22, 1113, [-90, 80, 0], 30), drift(150, 110, 16, 1115, [120, -110, 0], -20)));
}

// A jagged spire of rock: a tall shard with a broken head leaning on it, ledges of snow up its
// sides, scree and stones heaped at its foot. About 3 x 2.6 m, 5.4 m high.
function rockSpire(): Geo {
  const shaft = rock([230, 190, 470], 0.26, 1201, "Westcliffs_GraniteDark");
  const head = translate(rotateY(rock([150, 130, 190], 0.32, 1203, "Westcliffs_Granite"), 12), [20, -15, 380]);
  const side = translate(rock([130, 120, 230], 0.3, 1205, "Westcliffs_Granite"), [80, 110, 0]);
  const g = merge(shaft, head, side);
  const parts: Geo[] = [g, snowOn(g, 0.22, 1207, 5), lichenOn(g, 1209, 0.12, GREY)];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4, d = 150 + (i % 2) * 30;
    parts.push(translate(rotateZ(rock([60 + i * 6, 45 + i * 4, 32], 0.45, 1211 + i, i % 2 ? "Westcliffs_Granite" : "Westcliffs_GraniteDark", true), i * 50), [Math.cos(a) * d, Math.sin(a) * d * 0.85, 0]));
  }
  parts.push(pebbles(1221, [0, 0], 180, 160, 10, 14), drift(260, 160, 28, 1223, [-100, -60, 0], 20), drift(180, 120, 20, 1225, [80, -150, 0], -40));
  return centre(merge(...parts));
}

// Scree: slabs split off the cliffs above lying tilted every way, chips and stones between,
// snow in the hollows (ground: walked round). About 4.4 x 3.2 m, 0.7 m high.
function screeSlabs(): Geo {
  const rnd = seeded(1301), parts: Geo[] = [];
  for (let i = 0; i < 8; i++) {
    const at: V3 = [(rnd() - 0.5) * 360, (rnd() - 0.5) * 240, 0], s = 60 + rnd() * 70;
    const slab = rock([s * 1.4, s, 26 + rnd() * 20], 0.25, 1303 + i, rnd() < 0.4 ? "Westcliffs_GraniteDark" : "Westcliffs_Granite", true);
    parts.push(translate(rotateZ(rotateY(slab, (rnd() - 0.5) * 34), rnd() * 180), [at[0], at[1], 4 + rnd() * 10]));
  }
  parts.push(pebbles(1321, [0, 0], 220, 160, 16, 12));
  for (let i = 0; i < 4; i++) parts.push(drift(90 + rnd() * 70, 60 + rnd() * 40, 10, 1331 + i, [(rnd() - 0.5) * 320, (rnd() - 0.5) * 220, 0], rnd() * 180));
  return centre(merge(...parts));
}

// A boulder the wind has worn into holes (tafoni): a block with a window right through it, its
// faces pitted with hollows, snow on its back. About 3.6 x 2.4 m, 2.7 m high.
function windHoleRock(): Geo {
  const parts: Geo[] = [];
  const legA = translate(rock([200, 210, 250], 0.26, 1401, "Westcliffs_Pillar"), [0, -105, 0]);
  const legB = translate(rock([190, 180, 220], 0.28, 1403, "Westcliffs_Pillar"), [10, 120, 0]);
  const top = translate(rock([190, 330, 120], 0.24, 1405, "Westcliffs_Pillar", true), [0, 10, 170]);
  const g = merge(legA, legB, top);
  parts.push(g, snowOn(g, 0.28, 1407, 5));
  // the window through it: dark at its throat
  parts.push(translate(scale(sphereCenter(1, [0, 0, 0], "Westcliffs_Hollow", 10), [110, 42, 62]), [0, 8, 112]));
  // pits over the faces
  const rnd = seeded(1409);
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2, z = 60 + rnd() * 160, r = 12 + rnd() * 18;
    const out = Math.abs(Math.cos(a)) * 100 + Math.abs(Math.sin(a)) * 170;
    parts.push(translate(rotateZ(scale(sphereCenter(1, [0, 0, 0], "Westcliffs_Hollow", 8), [5, r, r * 1.25]), a * DEG), [Math.cos(a) * out * 0.92, Math.sin(a) * out * 0.92, z]));
  }
  parts.push(drift(260, 150, 26, 1411, [60, 0, 0], 90), drift(140, 100, 14, 1413, [-120, -150, 0], 20));
  return centre(merge(...parts));
}

// Sea grass bent by the wind (toward -Y), pale tufts of it in the snow, a drift banked on their
// lee. About 2.6 x 2.2 m, 0.8 m high.
function seaGrass(): Geo {
  const rnd = seeded(1501), parts: Geo[] = [];
  const clumps: [number, number, number][] = [[0, 0, 1], [-80, 70, 0.8], [70, 80, 0.85], [90, -60, 0.7], [-70, -80, 0.75]];
  for (const [cx, cy, k] of clumps)
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2, d = rnd() * 16 * k, h = (55 + rnd() * 30) * k, lean = 0.35 + rnd() * 0.3;
      const p0: V3 = [cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0];
      const p1: V3 = [p0[0] + (rnd() - 0.5) * 8, p0[1] - lean * h * 0.25, h * 0.55];
      const p2: V3 = [p1[0] + (rnd() - 0.5) * 10, p1[1] - lean * h * 0.75, h * (0.9 - lean * 0.3)];
      const mat = rnd() < 0.3 ? "Westcliffs_SeaGrassDry" : "Westcliffs_SeaGrass";
      parts.push(cylinderBetween(p0, p1, 1.6, 3, mat, 1.1), cylinderBetween(p1, p2, 1.1, 3, mat, 0.2));
    }
  parts.push(drift(200, 110, 20, 1503, [0, -110, 0], 0), drift(120, 80, 12, 1505, [-60, 120, 0], 30));
  return centre(merge(...parts));
}

// Cushions of thrift in the snow: low mounds of grey-green leaves, the dry pink heads standing
// above them on their stalks. About 2 x 1.8 m.
function thriftCushions(): Geo {
  const rnd = seeded(1601), parts: Geo[] = [];
  const pads: [number, number, number][] = [[0, 0, 38], [-60, 55, 28], [55, 45, 26], [40, -60, 30], [-55, -40, 22]];
  pads.forEach(([x, y, r], i) => {
    parts.push(drift(r * 2.1, r * 1.9, r * 0.55, 1603 + i, [x, y, 0], rnd() * 180, "Westcliffs_Cushion"));
    const n = Math.round(r * 0.5);
    for (let k = 0; k < n; k++) {
      const a = rnd() * Math.PI * 2, d = rnd() * r * 0.8, h = r * 0.5 + 10 + rnd() * 14;
      const base: V3 = [x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.35 * (1 - (d / r) ** 2)];
      const tip: V3 = [base[0] + (rnd() - 0.5) * 6, base[1] + (rnd() - 0.5) * 6, h];
      parts.push(cylinderBetween(base, tip, 0.7, 3, "Westcliffs_SeaGrassDry"), sphereCenter(3.6 + rnd() * 1.6, tip, rnd() < 0.3 ? "Westcliffs_ThriftFaded" : "Westcliffs_Thrift", 6));
    }
  });
  parts.push(drift(130, 70, 10, 1611, [-10, -95, 0], 10), drift(90, 60, 8, 1613, [80, 90, 0], -30));
  return centre(merge(...parts));
}

// A pine the gales snapped: the grey trunk standing with its leader broken off and a few dead
// limbs, the top lying in the snow beside it. About 5 x 3 m, 4.6 m high.
function snappedPine(): Geo {
  const stand = snag({ seed: 1701, h: 520, r: 24, bark: "Westcliffs_BarkGrey", wood: LOG_END, lean: 0.08, spread: 0.6, rise: -0.15, depth: 3, snapped: true, roots: 5, cover: { mat: "Snow", amount: 0.5, thick: 3 } });
  const top = fallenTrunk({ seed: 1703, len: 300, r: 14, bark: "Westcliffs_BarkGrey", wood: LOG_END, broken: true, stubs: 4, snow: "Snow", bow: 10, pebbles: false });
  return centre(merge(stand, translate(rotateZ(top, 70), [-60, 220, 0]), drift(220, 140, 20, 1705, [-40, 200, 0], 70), drift(160, 120, 18, 1707, [60, -60, 0], 10)));
}

// A reef where the sea breaks: three dark rocks glazed with ice at the waterline, surf heaped
// white round them and trailing off. z = 0 is the sea. About 5.6 x 3.6 m.
function surfRocks(): Geo {
  const parts: Geo[] = [];
  const rocks: [V3, V3, number][] = [[[0, 0, 0], [260, 200, 170], 1801], [[-60, 190, 0], [160, 130, 100], 1803], [[70, -180, 0], [130, 120, 80], 1805]];
  for (const [at, size, seed] of rocks) {
    const g = translate(paint(rock(size, 0.32, seed, "Westcliffs_SeaRock"), (p) => {
      const wet = p.z < 40 ? 0.62 + 0.38 * (p.z / 40) : 1;
      return [wet, wet, wet * 1.02];
    }), at);
    parts.push(g, coverTop(g, "Westcliffs_Ice", { thick: 2, seed: seed + 1, where: (_x, _y, z, nz) => z < 34 && z > 4 && nz > -0.6 }), snowOn(g, 0.12, seed + 2, 3));
    parts.push(surf([at[0], at[1]], size[0] * 0.55, size[1] * 0.55, seed + 3, 12));
  }
  return centre(merge(...parts));
}

// A sea arch: a great bow of dark rock standing out of the sea, its two feet heaped with fallen
// blocks, snow along its crown, the birds' white streaks down its flanks, surf breaking round its
// feet. z = 0 is the sea. About 13 x 5 m, 10 m high.
function seaArch(): Geo {
  const rnd = seeded(1901), parts: Geo[] = [];
  const line: V3[] = [[20, -520, -40], [0, -470, 320], [-10, -330, 650], [0, -80, 860], [10, 200, 840], [0, 420, 580], [20, 520, 250], [30, 540, -40]];
  const bow = rockTube(line, 200, 230, 1903, "Westcliffs_SeaRock", 26, 12);
  const feet = merge(
    translate(rock([420, 380, 300], 0.3, 1905, "Westcliffs_SeaRock"), [0, -560, 0]),
    translate(rock([440, 400, 260], 0.3, 1907, "Westcliffs_SeaRock"), [20, 580, 0]),
    translate(rock([200, 180, 130], 0.4, 1908, "Westcliffs_GraniteDark"), [180, -330, 0]),
  );
  const g = merge(bow, feet);
  paint(g, (p) => {
    const wet = p.z < 70 ? 0.58 + 0.42 * Math.max(0, p.z / 70) : 1, streak = p.z > 250 && noise3(p.x / 34, p.y / 34, p.z / 420, 1911) > 0.64 ? 1.55 : 1;
    return [wet * streak, wet * streak, wet * 1.02 * streak];
  });
  parts.push(g);
  // snow lying along the crown
  const crown = new THREE.CatmullRomCurve3(line.map((p) => new THREE.Vector3(...p)));
  for (let t = 0.3; t <= 0.72; t += 0.04) {
    const p = crown.getPointAt(t), tan = crown.getTangentAt(t), r = 200 + 30 * t;
    if (Math.abs(tan.z) > 0.75) continue;
    parts.push(blob(80 + rnd() * 30, [p.x, p.y, p.z + r * 0.88], "Snow", 0.32, 8));
  }
  parts.push(coverTop(feet, "Westcliffs_Ice", { thick: 2, seed: 1913, where: (_x, _y, z, nz) => z < 40 && z > 6 && nz > -0.6 }));
  parts.push(surf([0, -560], 260, 230, 1915, 14), surf([20, 580], 270, 240, 1917, 14));
  return centre(merge(...parts));
}

// ======================================================================================
// ---- the humming stones ----

// A hollow pillar of soft stone the sea wind has worn: drums of it narrowed in grooves where the
// wind cuts, pierced with holes into its hollow core, its top an open rim (the wind sounds over
// it as breath over a bottle). `h` high, `r` round; snow on its ledges and rim.
function pillar(seed: number, h: number, r: number, lean = 0): Geo {
  const rnd = seeded(seed);
  const grooves = Array.from({ length: 2 + Math.floor(rnd() * 3) }, () => [h * (0.18 + rnd() * 0.7), 16 + rnd() * 18, 0.09 + rnd() * 0.1]);
  const rad = (z: number) => {
    let k = 1 + 0.22 * Math.max(0, 1 - z / 70) ** 2 + 0.05 * Math.sin(z / 60 + seed) - 0.1 * (z / h);
    for (const [gz, gw, gd] of grooves) k -= gd * Math.exp(-(((z - gz) / gw) ** 2));
    return r * k;
  };
  const steps = Math.max(8, Math.ceil(h / 28)), rt = rad(h), ri = rt * 0.58;
  const outer: [number, number][] = [];
  for (let i = 0; i <= steps; i++) outer.push([rad((i / steps) * h), (i / steps) * h - (i === 0 ? 10 : 0)]);
  outer.push([rt * 0.9, h + 7], [ri * 1.15, h + 6], [ri, h - 2]);
  const wob = { amp: 0.09, seed, zScale: 70 };
  const body = lathe(outer, 12, "Westcliffs_Pillar", wob);
  const core = lathe([[ri, h - 1], [ri * 0.92, h - 40], [ri * 0.6, h - 70], [0.5, h - 76]], 12, "Westcliffs_Hollow", wob);
  // bands of shade: dark in the grooves and at the foot, paler up toward the rim
  paint(body, (p) => {
    const z = p.z, gr = grooves.reduce((t, [gz, gw]) => t + Math.exp(-(((z - gz) / (gw * 1.3)) ** 2)), 0);
    const v = 0.74 + 0.26 * Math.min(1, z / h) - 0.16 * Math.min(1, gr) + 0.1 * (noise3(p.x / 40, p.y / 40, z / 140, seed + 3) - 0.5);
    return [v * 1.02, v, v * 0.96];
  });
  const parts: Geo[] = [body, core, snowOn(body, 0.16, seed + 5, 3), lichenOn(body, seed + 7, 0.14, GREY)];
  // holes into the hollow, mostly on the windward (-X) side
  const n = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (rnd() - 0.5) * (i < 2 ? 1.4 : 4.4), z = h * (0.22 + rnd() * 0.62), hr = r * (0.18 + rnd() * 0.16);
    const rr = rad(z) * 0.94;
    const hole = scale(sphereCenter(1, [0, 0, 0], "Westcliffs_Hollow", 8), [7, hr, hr * (1.2 + rnd() * 0.5)]);
    const lip = scale(rotateY(torus(1, 0.16, 10, 4, "Westcliffs_Pillar"), 90), [6, hr * 1.12, hr * 1.4]);
    parts.push(translate(rotateZ(merge(hole, lip), a * DEG), [Math.cos(a) * rr, Math.sin(a) * rr, z]));
  }
  let g = merge(...parts);
  if (lean) g = rotateY(g, lean);
  return g;
}

// One hollow pillar standing alone on its shelf of rock, a drift against its foot. About 2.6 m
// across, 6.6 m high.
function hollowPillar(): Geo {
  const base = rock([260, 230, 50], 0.3, 2005, "Westcliffs_Granite", true);
  return centre(merge(base, snowOn(base, 0.4, 2007, 3), pillar(2001, 640, 82, 2), drift(200, 120, 26, 2009, [60, 70, 0], 40), pebbles(2011, [0, 0], 150, 140, 7, 12)));
}

// The grove of humming stones: seven hollow pillars of every height on a shelf of bare rock, the
// tallest in the middle, drifts in their lee and a cairn left by those who came to listen. About
// 11 x 9.5 m, 8.4 m high.
const GROVE_P: [number, number, number, number, number][] = [
  [0, 0, 840, 96, 0], [-230, -260, 620, 80, -4], [190, -300, 520, 72, 5], [-260, 230, 560, 76, 3], [260, 200, 700, 86, -3], [-30, 400, 380, 64, 6], [60, -460, 420, 66, -6],
];
// the pillars of the grove (x, y, radius at their feet) for a field's solids
export const GROVE_PILLARS: [number, number, number][] = GROVE_P.map(([x, y, , r]) => [x, y, r + 14]);
function pillarGrove(): Geo {
  const parts: Geo[] = [];
  const shelf = rock([900, 760, 70], 0.22, 2101, "Westcliffs_Granite", true);
  parts.push(shelf, snowOn(shelf, 0.35, 2103, 3));
  const P = GROVE_P;
  P.forEach(([x, y, h, r, lean], i) => parts.push(translate(pillar(2111 + i * 13, h, r, lean), [x, y, 24])));
  // a cairn of flat stones and a few pebbles left on it
  let z = 30;
  for (let k = 0; k < 6; k++) {
    const s = 36 - k * 5;
    parts.push(translate(rotateZ(rock([s * 1.4, s, 11], 0.3, 2191 + k, k % 2 ? "Westcliffs_Granite" : "Westcliffs_GraniteDark", true), k * 40), [-380, -20, z]));
    z += 9;
  }
  parts.push(drift(320, 160, 34, 2199, [120, 520, 0], 0), drift(260, 150, 28, 2201, [-380, 380, 0], 30), drift(240, 140, 24, 2203, [380, -260, 0], -20), pebbles(2205, [0, 0], 470, 400, 16, 14));
  return merge(...parts);
}

// The giant harp: a frame of rock worn into the shape of a harp, its pillar standing on the left,
// its neck curving over to the sounding-board that leans up from the right, strung between them
// with columns of stone (two of them broken) and between those with long icicles. Snow on its
// neck and its base; an offering stone with candles at its foot. Seen side-on from the front (-X).
// About 11 x 4 m, 11 m high.
function harpRock(): Geo {
  const rnd = seeded(2301), parts: Geo[] = [];
  // the base: a long heap of blocks
  const base = merge(
    rock([420, 1100, 170], 0.22, 2303, "Westcliffs_GraniteDark", true),
    translate(rock([300, 360, 200], 0.28, 2305, "Westcliffs_Granite"), [0, -360, 0]),
    translate(rock([320, 420, 230], 0.26, 2307, "Westcliffs_Granite"), [10, 380, 0]),
  );
  parts.push(base, snowOn(base, 0.35, 2309, 5));
  // the column standing on the left (-Y); the sounding-board leaning up from its foot to the
  // right (+Y); the neck curving down from the column's head to the board's
  const neck: V3[] = [[0, -420, 1120], [0, -240, 1110], [0, -60, 1000], [0, 120, 900], [0, 300, 880], [0, 470, 830]];
  const boardZ = (y: number) => 170 + ((y + 330) / 800) * 600;
  const curve = new THREE.CatmullRomCurve3(neck.map((p) => new THREE.Vector3(...p)));
  const neckAt = (y: number) => {
    let best = curve.getPoint(0);
    for (let i = 0; i <= 60; i++) {
      const p = curve.getPoint(i / 60);
      if (Math.abs(p.y - y) < Math.abs(best.y - y)) best = p;
    }
    return best.z;
  };
  const pillarL = rockTube([[0, -430, 120], [10, -450, 420], [0, -440, 760], [0, -420, 1080]], 74, 60, 2311, "Westcliffs_Pillar");
  const board = rockTube([[0, -360, 140], [0, -100, boardZ(-100)], [0, 200, boardZ(200)], [0, 470, boardZ(470)]], 92, 64, 2313, "Westcliffs_Pillar");
  const top = rockTube(neck, 64, 54, 2315, "Westcliffs_Pillar");
  const knotL = translate(rock([180, 200, 170], 0.3, 2317, "Westcliffs_Pillar"), [0, -410, 1060]);
  const knotR = translate(rock([200, 200, 180], 0.3, 2319, "Westcliffs_Pillar"), [0, 480, 760]);
  const head = translate(rotateX(rock([150, 240, 140], 0.3, 2321, "Westcliffs_Pillar"), 20), [0, -330, 1150]);
  const fr = merge(pillarL, board, top, knotL, knotR, head);
  paint(fr, (p) => {
    const v = 0.78 + 0.22 * Math.min(1, p.z / 1000) + 0.12 * (noise3(p.x / 50, p.y / 50, p.z / 160, 2323) - 0.5);
    return [v * 1.02, v, v * 0.95];
  });
  parts.push(fr, lichenOn(fr, 2327, 0.12, GREY));
  for (let i = 1; i < 12; i++) {
    const p = curve.getPoint(i / 12);
    parts.push(blob(46 + rnd() * 16, [p.x, p.y, p.z + 46], "Snow", 0.32, 8));
  }
  parts.push(blob(70, [0, -410, 1200], "Snow", 0.35, 8), blob(60, [0, 480, 840], "Snow", 0.35, 8));
  // the strings: columns of stone from the base to the neck, two snapped; icicles between
  const strings = [-300, -220, -140, -60, 20, 100, 180, 260, 340];
  strings.forEach((y, i) => {
    const zt = neckAt(y) - 50, zb = boardZ(y) + 60, broken = i === 2 || i === 5;
    const z1 = broken ? zb + (zt - zb) * (0.3 + rnd() * 0.2) : zt;
    parts.push(cylinderBetween([0, y, zb - 20], [0, y + (rnd() - 0.5) * 6, z1], 9 + rnd() * 2, 7, "Westcliffs_Pillar", 7));
    if (broken) {
      parts.push(cylinderAt({ rBot: 7, rTop: 9, height: 70 + rnd() * 40, segments: 7, bottom: [0, y, zt - 90] }, "Westcliffs_Pillar"));
      parts.push(translate(rotateY(cylinderAt({ radius: 8, height: 160, segments: 7, bottom: [0, 0, 0] }, "Westcliffs_Pillar"), 80), [-150 - i * 10, y - 40, 175]));
    }
    if (i < strings.length - 1) {
      const ym = y + 40, L = 90 + rnd() * 160;
      parts.push(cylinderAt({ rBot: 0.8, rTop: 4.5, height: L, segments: 5, bottom: [0, ym, neckAt(ym) - 58 - L] }, "Westcliffs_Ice"));
    }
  });
  parts.push(icicles([-40, -380, 1060], [-40, 420, 830], 2331, 20, 60));
  // the offering stone at its foot, candles on it, pebbles stacked
  const altar = translate(rock([110, 160, 60], 0.2, 2341, "Westcliffs_Granite", true), [-330, 0, 0]);
  parts.push(altar);
  for (const [dy, h] of [[-40, 18], [-10, 26], [30, 14]]) parts.push(cylinderAt({ radius: 4, height: h, segments: 6, bottom: [-335, dy, 46] }, "Westcliffs_Paper"), blob(2.4, [-335, dy, 48 + h], "Westcliffs_Ember", 1.3, 5));
  let z = 46;
  for (let k = 0; k < 4; k++) {
    parts.push(translate(rock([24 - k * 4, 20 - k * 3, 8], 0.3, 2345 + k, "Westcliffs_GraniteDark", true), [-320, 55, z]));
    z += 7;
  }
  parts.push(drift(380, 200, 30, 2351, [-260, -300, 0], 10), drift(320, 180, 26, 2353, [-240, 360, 0], -10), drift(300, 200, 24, 2355, [240, 0, 0], 90));
  return merge(...parts);
}

// The mouth of a cave in a crag (its back flat to stand against a cliff): an arch of rock over a
// black throat, icicles along its lip, the white streaks of the bats' roost running down below
// it, old bones and stones at its mouth, snow on its brow. About 7 x 4.4 m, 5 m high.
function echoCave(): Geo {
  const parts: Geo[] = [];
  const back = translate(rock([360, 760, 500], 0.18, 2401, "Westcliffs_GraniteDark"), [60, 0, 0]);
  const jambL = translate(rock([200, 230, 400], 0.24, 2403, "Westcliffs_GraniteDark"), [-120, -250, 0]);
  const jambR = translate(rock([210, 250, 430], 0.24, 2405, "Westcliffs_GraniteDark"), [-110, 260, 0]);
  const brow = translate(rock([230, 520, 170], 0.22, 2407, "Westcliffs_Granite", true), [-120, 0, 300]);
  const g = merge(back, jambL, jambR, brow);
  parts.push(g, snowOn(brow, 0.3, 2409, 5), snowOn(back, 0.25, 2410, 5));
  // the throat: black, arched
  parts.push(translate(scale(sphereCenter(1, [0, 0, 0], "Westcliffs_Dark", 12), [60, 150, 300]), [-170, 0, 0]));
  parts.push(bb([-220, -150, 0], [-150, 150, 3], "Westcliffs_Dark"));
  // icicles on the lip, the roost's streaks below it
  parts.push(icicles([-232, -170, 318], [-232, 170, 318], 2411, 16, 70));
  {
    const r2 = seeded(2413);
    for (let i = 0; i < 9; i++) {
      const y = (i < 5 ? -1 : 1) * (170 + r2() * 90), top = 300 - r2() * 60, L = 60 + r2() * 120;
      parts.push(bb([-236 + r2() * 10, y - 3 - r2() * 3, top - L], [-230 + r2() * 10, y + 3, top], "Westcliffs_Guano"));
    }
  }
  // bones and stones at the mouth
  const rnd = seeded(2415);
  for (let i = 0; i < 5; i++) {
    const a: V3 = [-260 - rnd() * 80, (rnd() - 0.5) * 220, 4];
    parts.push(translate(rotateZ(cylinderBetween([-20, 0, 0], [20, 0, 2], 3, 5, "Westcliffs_Bone"), rnd() * 180), a));
  }
  parts.push(translate(scale(sphereCenter(9, [0, 0, 0], "Westcliffs_Bone", 8), [1.3, 1, 0.9]), [-290, 60, 8]));
  for (let i = 0; i < 4; i++) parts.push(translate(rock([40 + i * 8, 32 + i * 6, 22], 0.4, 2421 + i, "Westcliffs_GraniteDark"), [-280 - (i % 2) * 60, -180 + i * 110, 0]));
  parts.push(drift(220, 160, 30, 2431, [-230, -330, 0], 20), drift(200, 150, 26, 2433, [-220, 340, 0], -20));
  return merge(...parts);
}

// The old poet's hermitage: a stone hut under a slate gable that runs out over a timber porch,
// the porch's gable open on its truss. On the porch his low desk with paper, ink and brush, a
// cushion, a brazier glowing, a shelf of scrolls; wind chimes hung along its beam; his poems
// pegged out on a line to the pole beside the hut; firewood at the back, the chimney smoking.
// About 7.6 x 6.4 m, 5.6 m high.
function poetHermitage(): Geo {
  const rnd = seeded(2501), parts: Geo[] = [];
  const X0 = -120, X1 = 260, Y = 230, H = 250, PX = -320;
  // footing, walls of rubble stone with bigger quoins
  parts.push(bb([PX - 20, -Y - 30, -12], [X1 + 25, Y + 30, 28], "Westcliffs_Rubble", 4));
  parts.push(bb([X0, -Y, 28], [X1, Y, H], "StoneGrey", 4));
  for (const [sx, sy] of [[X0, -Y], [X1, -Y], [X1, Y], [X0, Y]])
    for (let z = 28; z < H - 30; z += 46) parts.push(boxAt([52, 52, 42], [sx + (sx > 0 ? -20 : 20), sy + (sy > 0 ? -20 : 20), z], (z / 46) % 2 > 1 ? "Westcliffs_AbbeyStoneDark" : "Westcliffs_Granite", 4));
  // the porch floor and its posts, the beam along its front
  parts.push(bb([PX, -Y - 10, 28], [X0, Y + 10, 40], "Westcliffs_Plank", 1.5));
  for (const y of [-Y, Y]) parts.push(boxAt([22, 22, H - 30], [PX + 12, y, 40], "Westcliffs_TimberDark", 2));
  parts.push(bb([PX, -Y - 12, H - 6], [PX + 24, Y + 12, H + 14], "Westcliffs_TimberDark", 2));
  // the roof: slate, snow on it, the gable over the porch open on its truss, the back one stone
  const RH = 170, half = Y + 30;
  parts.push(gableRoof([X1 - PX + 20, 2 * half, 12], [(PX + X1) / 2, 0, H + 10], RH, 40, "RoofSlate"));
  parts.push(gableRoof([X1 - PX + 10, 2 * half, 16], [(PX + X1) / 2, 0, H + 22], RH, 34, "Snow"));
  parts.push(gableWall(X1, half, H + 10, RH, "StoneGrey"), gableWall(X0, half, H + 10, RH, "Westcliffs_Plank"));
  parts.push(beamBetween([PX + 12, -half, H + 14], [PX + 12, 0, H + 10 + RH], 14, 14, "Westcliffs_TimberDark"), beamBetween([PX + 12, half, H + 14], [PX + 12, 0, H + 10 + RH], 14, 14, "Westcliffs_TimberDark"));
  parts.push(boxAt([14, 14, RH - 6], [PX + 12, 0, H + 14], "Westcliffs_TimberDark", 1.5));
  for (const s of [-1, 1]) parts.push(icicles([PX - 40, s * (half + 34), H + 10 + RH - (RH * (half + 34)) / half + 4], [X1 + 40, s * (half + 34), H + 10 + RH - (RH * (half + 34)) / half + 4], 2503 + s, 20, 40));
  // the door, a round window, a window with paper panes
  parts.push(bb([X0 - 6, -55, 28], [X0 + 4, 55, 228], "Westcliffs_TimberDark"), bb([X0 - 10, -48, 30], [X0 - 4, 48, 220], "DoorWood", 1.5));
  parts.push(sphereCenter(3, [X0 - 12, 30, 120], "Westcliffs_Iron", 5));
  parts.push(translate(rotateY(torus(34, 7, 14, 5, "Westcliffs_TimberDark"), 90), [X0 - 4, -150, 150]), translate(rotateY(cylinderAt({ radius: 32, height: 4, segments: 14, bottom: [0, 0, -2] }, "Westcliffs_Paper"), 90), [X0 - 2, -150, 150]));
  parts.push(bb([X0 - 6, 110, 110], [X0 + 2, 200, 190], "Westcliffs_TimberDark"), bb([X0 - 8, 116, 116], [X0 - 4, 194, 184], "Westcliffs_Paper"));
  parts.push(bb([X0 - 10, 152, 116], [X0 - 6, 158, 184], "Westcliffs_TimberDark"), bb([X0 - 10, 116, 147], [X0 - 6, 194, 153], "Westcliffs_TimberDark"));
  parts.push(bb([X1 - 4, -60, 120], [X1 + 6, 60, 190], "Westcliffs_TimberDark"), bb([X1 + 4, -54, 126], [X1 + 8, 54, 184], "Westcliffs_Paper"));
  // the desk on the porch, the paper on it, the ink stone and brush, his cushion
  const D: V3 = [-230, 80, 40];
  parts.push(bb([D[0] - 40, D[1] - 70, D[2] + 28], [D[0] + 40, D[1] + 70, D[2] + 34], "Westcliffs_Plank", 1));
  for (const [dx, dy] of [[-34, -64], [34, -64], [-34, 64], [34, 64]]) parts.push(bb([D[0] + dx - 3, D[1] + dy - 3, D[2]], [D[0] + dx + 3, D[1] + dy + 3, D[2] + 28], "Westcliffs_TimberDark"));
  for (let k = 0; k < 3; k++) {
    const sheet = translate(rotateZ(bb([-18, -26, 0], [18, 26, 0.6], "Westcliffs_Paper"), (rnd() - 0.5) * 20), [D[0] - 6 + k * 8, D[1] - 20 + k * 6, D[2] + 34 + k * 0.6]);
    parts.push(sheet);
  }
  for (let l = 0; l < 4; l++) parts.push(bb([D[0] + 6 - l * 7, D[1] - 34 + 18, D[2] + 36.4], [D[0] + 7 - l * 7, D[1] - 34 + 30 + (l % 2) * 8, D[2] + 36.6], "Westcliffs_Ink"));
  parts.push(bb([D[0] - 10, D[1] + 34, D[2] + 34], [D[0] + 10, D[1] + 52, D[2] + 38], "Westcliffs_SlateDark", 1), cylinderBetween([D[0], D[1] + 20, D[2] + 36], [D[0] + 10, D[1] + 6, D[2] + 37], 0.8, 4, "Bamboo"));
  parts.push(translate(scale(sphereCenter(28, [0, 0, 0], "FeltRed", 10), [1, 1, 0.28]), [D[0] - 70, D[1], D[2] + 6]));
  // the brazier, the scroll shelf
  parts.push(cylinderAt({ rBot: 14, rTop: 26, height: 22, segments: 10, bottom: [-250, -120, 40] }, "Westcliffs_Iron"));
  for (let i = 0; i < 3; i++) parts.push(cylinderBetween([-250, -120, 40], [-250 + Math.cos(i * 2.1) * 26, -120 + Math.sin(i * 2.1) * 26, 40], 2, 4, "Westcliffs_Iron"));
  parts.push(blob(20, [-250, -120, 60], "Westcliffs_Ember", 0.35, 8), plume([-250, -120, 80], 3, 10, 2505, [10, 30]));
  parts.push(bb([X0 - 36, -Y + 10, 40], [X0 - 4, -Y + 110, 160], "Westcliffs_Timber", 1.5));
  for (let sh = 0; sh < 3; sh++) for (let k = 0; k < 5; k++) parts.push(translate(rotateY(cylinderAt({ radius: 5, height: 28, segments: 6, bottom: [0, 0, -14] }, k % 2 ? "Westcliffs_Paper" : "Westcliffs_Straw"), 90), [X0 - 22, -Y + 22 + k * 18, 52 + sh * 38]));
  // the chimes along the porch beam
  for (const y of [-160, 0, 160]) parts.push(chimes([PX + 12, y, H - 6], 2511 + y, 6, 1));
  // the poems pegged out on a line to a pole
  const pole: V3 = [-40, Y + 260, 0];
  parts.push(cylinderAt({ radius: 6, height: 250, segments: 6, bottom: pole }, "Westcliffs_TimberDark"));
  const line = sagLine([PX + 12, Y + 6, 220], [pole[0], pole[1], 240], 30, 8);
  parts.push(rope(line, 0.8));
  const la = Math.atan2(pole[1] - Y, pole[0] - PX) * DEG;
  for (let k = 1; k < 8; k++) {
    const sheet = translate(rotateZ(merge(bb([-1, -12, -36], [1, 12, 0], "Westcliffs_Paper"), bb([-1.3, -8, -30], [1.3, 7, -29], "Westcliffs_Ink"), bb([-1.3, -8, -22], [1.3, 4, -21], "Westcliffs_Ink"), bb([-1.3, -8, -14], [1.3, 6, -13], "Westcliffs_Ink")), la + 90), line[k]);
    parts.push(sheet);
  }
  // the chimney at the back corner, smoke from it; firewood stacked along the back
  parts.push(boxAt([70, 66, H + RH + 30], [X1 - 30, -Y + 60, -10], "Westcliffs_AbbeyStoneDark", 4), boxAt([82, 78, 10], [X1 - 30, -Y + 60, H + RH + 20], "Westcliffs_Granite", 3));
  parts.push(plume([X1 - 30, -Y + 60, H + RH + 50], 5, 26, 2507, [40, 60]));
  for (let r2 = 0; r2 < 3; r2++)
    for (let k = 0; k < 9; k++) {
      const y = -170 + k * 30 + (r2 % 2) * 14, z = 14 + r2 * 24;
      parts.push(cylinderBetween([X1 + 20, y, z], [X1 + 92, y + (rnd() - 0.5) * 6, z], 11, 7, "Westcliffs_Timber"), cylinderBetween([X1 + 92, y, z], [X1 + 93, y, z], 9.5, 7, LOG_END_DARK));
    }
  parts.push(drift(300, 150, 46, 2521, [60, Y + 110, 0], 0), drift(260, 140, 40, 2523, [X1 + 140, 60, 0], 90), drift(200, 120, 30, 2525, [PX - 60, -Y - 40, 0], 20));
  return merge(...parts);
}

// Wind chimes on a post: a weathered post on a stone, a crossbar under a little plank roof hung
// with three sets of bronze tubes and two rings of hollow stone. About 1.8 x 0.9 m, 2.9 m high.
function windChimePost(): Geo {
  const parts: Geo[] = [];
  const base = rock([90, 80, 40], 0.3, 2601, "Westcliffs_Granite");
  parts.push(base, snowOn(base, 0.4, 2603, 3));
  parts.push(cylinderAt({ rBot: 9, rTop: 7, height: 280, segments: 7, bottom: [0, 0, 10] }, "Westcliffs_Timber"));
  parts.push(bb([-6, -80, 238], [6, 80, 250], "Westcliffs_TimberDark", 1.5));
  for (const s of [-1, 1]) parts.push(beamBetween([0, s * 60, 240], [0, 0, 180], 6, 6, "Westcliffs_TimberDark"));
  parts.push(translate(rotateZ(gableRoof([30, 180, 4], [0, 0, 254], 18, 10, "Westcliffs_Plank"), 90), [0, 0, 0]));
  parts.push(translate(rotateZ(gableRoof([30, 174, 5], [0, 0, 258], 18, 6, "Snow"), 90), [0, 0, 0]));
  for (const y of [-60, 0, 60]) parts.push(chimes([0, y, 238], 2611 + y, y === 0 ? 7 : 5, 1.1));
  for (const y of [-30, 30]) {
    parts.push(cylinderBetween([0, y, 238], [0, y, 175], 0.6, 3, "RopeTan"));
    parts.push(translate(rotateY(torus(11, 5, 10, 5, "Westcliffs_Pillar"), 90), [0, y, 163]));
  }
  parts.push(drift(160, 90, 16, 2621, [20, 0, 0], 0));
  return centre(merge(...parts));
}

// A stele of slate cut with the poet's verses: a slab under a little gabled cap on a stepped
// plinth, its lines in columns of carving, a bowl of offerings and a candle at its foot. About
// 1.6 x 1.2 m, 2.5 m high.
function poemStele(): Geo {
  const parts: Geo[] = [];
  parts.push(bb([-60, -80, -6], [60, 80, 18], "Westcliffs_AbbeyStoneDark", 3), bb([-44, -66, 18], [44, 66, 34], "Westcliffs_AbbeyStone", 3));
  parts.push(bb([-14, -54, 34], [14, 54, 214], "Westcliffs_Slate", 3));
  // the cap: a little gable of stone with snow on it
  parts.push(translate(rotateZ(gableRoof([40, 130, 8], [0, 0, 214], 20, 6, "Westcliffs_SlateDark"), 90), [0, 0, 0]));
  parts.push(translate(rotateZ(gableRoof([36, 124, 6], [0, 0, 220], 20, 3, "Snow"), 90), [0, 0, 0]));
  // the carving: a border, a title band, lines of words of every length
  parts.push(bb([-15.5, -46, 196], [-14, 46, 199], "Westcliffs_SlateDark"), bb([-15.5, -46, 46], [-14, 46, 49], "Westcliffs_SlateDark"));
  parts.push(bb([-15.5, -46, 46], [-14, -43, 199], "Westcliffs_SlateDark"), bb([-15.5, 43, 46], [-14, 46, 199], "Westcliffs_SlateDark"));
  parts.push(bb([-15.5, -28, 178], [-14, 28, 188], "Westcliffs_SlateDark"));
  const rnd = seeded(2701);
  for (let line = 0; line < 9; line++) {
    let y = -38;
    const z = 164 - line * 13;
    while (y < 34) {
      const w = 6 + rnd() * 16;
      if (y + w > 38) break;
      parts.push(bb([-15.3, y, z], [-14, y + w, z + 4], "Westcliffs_Ink"));
      y += w + 3 + rnd() * 3;
    }
  }
  // the offerings: a bowl with pebbles, a candle, dry flowers
  parts.push(cylinderAt({ rBot: 9, rTop: 14, height: 8, segments: 10, bottom: [-52, -30, 18] }, "Westcliffs_Bronze"));
  for (let i = 0; i < 4; i++) parts.push(sphereCenter(4, [-52 + (i % 2) * 6 - 3, -30 + (i > 1 ? 4 : -4), 27], "Westcliffs_GraniteDark", 5));
  parts.push(cylinderAt({ radius: 3.5, height: 16, segments: 6, bottom: [-50, 26, 18] }, "Westcliffs_Paper"), blob(2.2, [-50, 26, 35], "Westcliffs_Ember", 1.4, 5));
  for (let i = 0; i < 5; i++) parts.push(cylinderBetween([-48, 46, 18], [-58 + i * 4, 40 + i * 3, 46 + i * 3], 0.6, 3, "Westcliffs_SeaGrassDry"), sphereCenter(2.6, [-58 + i * 4, 40 + i * 3, 46 + i * 3], "Westcliffs_ThriftFaded", 5));
  parts.push(drift(150, 90, 14, 2703, [30, -40, 0], 10), drift(110, 70, 10, 2705, [20, 70, 0], -20));
  return merge(...parts);
}

// ======================================================================================
// ---- the snow abbey ----

// The abbey church: a nave of grey ashlar on a plinth under a steep slate roof, buttressed down
// both sides with tall windows of blue and red glass between; its front a gable with the round
// window over the arched door (one leaf of it hanging open) and the bell-cote rising over the
// gable, empty now (the bell was carried down to the pavilion); a half-round apse at the back.
// Abandoned: one bay of the roof has fallen in, its rafters bare over the hole, the slates and
// stones heaped below. Snow on everything. About 17 x 10.5 m, 15 m high.
function abbeyChurch(): Geo {
  const rnd = seeded(2801), parts: Geo[] = [];
  const X0 = -700, X1 = 600, Y = 380, Z0 = 50, ZW = 660, RH = 430, half = Y + 20;
  const S = "Westcliffs_AbbeyStone", SD = "Westcliffs_AbbeyStoneDark";
  // the plinth, the steps up to the door
  parts.push(bb([X0 - 30, -Y - 40, -14], [X1 + 30, Y + 40, Z0], SD, 4));
  for (let k = 0; k < 3; k++) parts.push(bb([X0 - 70 - k * 34, -160 + k * 10, -14], [X0 - 30, 160 - k * 10, Z0 - k * 16], SD, 3));
  // the walls, a string course, the parapet line
  parts.push(bb([X0, -Y, Z0], [X1, Y, ZW], S));
  parts.push(bb([X0 - 6, -Y - 6, Z0], [X1 + 6, Y + 6, Z0 + 30], SD, 2));
  parts.push(bb([X0 - 8, -Y - 8, ZW - 20], [X1 + 8, Y + 8, ZW], SD, 2));
  // buttresses down the sides between the bays; windows in the bays
  const bays = [-570, -280, 10, 300, 560];
  for (const s of [-1, 1]) {
    for (const x of bays) {
      parts.push(bb([x - 34, s * Y - (s > 0 ? 0 : 70), Z0], [x + 34, s * Y + (s > 0 ? 70 : 0), ZW - 120], SD, 3));
      parts.push(translate(rotateX(box([68, 70, 60], [0, 0, 0], SD, 3), s * -40), [x, s * (Y + 30), ZW - 110]));
    }
    for (let i = 0; i + 1 < bays.length; i++) {
      const x = (bays[i] + bays[i + 1]) / 2;
      if (s > 0 && i === 2) continue; // the fallen bay's window is a ragged hole (below)
      parts.push(translate(rotateZ(lancet(0, 0, 0, 70, 230, -1, i % 2 ? "Westcliffs_GlassRed" : "Westcliffs_GlassBlue"), s * -90), [x, s * (Y + 2), 230]));
    }
  }
  // the roof: slate and snow, but over one bay on the +Y side only rafters over a black hole
  const roofSide = (s: 1 | -1, x0: number, x1: number, mat: string, th: number, lift: number) => {
    const ang = Math.atan2(RH, Y), slope = (Y + 40) / Math.cos(ang);
    return translate(rotateX(box([x1 - x0, slope, th], [0, (s * slope) / 2, th / 2], mat), (-s * ang) * DEG), [(x0 + x1) / 2, 0, ZW + RH + lift]);
  };
  const HOLE: [number, number] = [-20, 300];
  parts.push(roofSide(-1, X0 - 30, X1 + 30, "RoofSlate", 14, 0), roofSide(-1, X0 - 20, X1 + 20, "Snow", 16, 12));
  parts.push(roofSide(1, X0 - 30, HOLE[0], "RoofSlate", 14, 0), roofSide(1, HOLE[1], X1 + 30, "RoofSlate", 14, 0));
  parts.push(roofSide(1, X0 - 20, HOLE[0] - 20, "Snow", 16, 12), roofSide(1, HOLE[1] + 20, X1 + 20, "Snow", 16, 12));
  // the hole: dark under it, the bare rafters, a purlin
  parts.push(translate(rotateX(box([HOLE[1] - HOLE[0], (Y + 20) / Math.cos(Math.atan2(RH, Y)), 2], [0, (Y + 20) / Math.cos(Math.atan2(RH, Y)) / 2, -30], "Westcliffs_Dark"), -Math.atan2(RH, Y) * DEG), [(HOLE[0] + HOLE[1]) / 2, 0, ZW + RH]));
  for (let x = HOLE[0] + 30; x < HOLE[1]; x += 60) parts.push(beamBetween([x, 0, ZW + RH + 4], [x + (rnd() - 0.5) * 10, Y + 30, ZW - 10], 12, 14, "Westcliffs_TimberDark"));
  parts.push(beamBetween([HOLE[0], Y / 2, ZW + RH / 2 + 8], [HOLE[1], Y / 2, ZW + RH / 2 + 8], 12, 14, "Westcliffs_TimberDark"));
  // the ridge, the front gable and the back one
  parts.push(bb([X0 - 30, -10, ZW + RH + 4], [X1 + 30, 10, ZW + RH + 20], SD, 2));
  parts.push(gableWall(X0, half, ZW, RH, S), gableWall(X1, half, ZW, RH, S));
  parts.push(gableWall(X0 - 1, half, ZW, RH, S), gableWall(X1 + 1, half, ZW, RH, S));
  for (const s of [-1, 1]) parts.push(beamBetween([X0 - 14, s * (half + 10), ZW - 6], [X0 - 14, 0, ZW + RH + 14], 22, 24, SD));
  // the front: the round window, the door under its arch
  const rw: V3 = [X0 - 8, 0, ZW + 110];
  parts.push(translate(rotateY(cylinderAt({ radius: 92, height: 6, segments: 18, bottom: [0, 0, -3] }, "Westcliffs_GlassBlue"), 90), rw));
  parts.push(translate(rotateY(torus(96, 12, 20, 6, SD), 90), rw), translate(rotateY(torus(36, 8, 14, 5, SD), 90), rw));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    parts.push(beamBetween([rw[0] - 4, Math.cos(a) * 36, rw[2] + Math.sin(a) * 36], [rw[0] - 4, Math.cos(a) * 90, rw[2] + Math.sin(a) * 90], 7, 7, SD));
  }
  parts.push(bb([X0 - 4, -95, Z0], [X0 + 6, 95, Z0 + 250], "Westcliffs_Dark"));
  parts.push(archRing(X0 - 18, 0, Z0 + 250, 100, 40, 30, 11, SD, S), archRing(X0 - 30, 0, Z0 + 250, 128, 22, 22, 13, S));
  for (const s of [-1, 1]) parts.push(bb([X0 - 38, s * 100 - 15, Z0], [X0, s * 100 + 15, Z0 + 250], SD, 2), bb([X0 - 44, s * 132 - 12, Z0], [X0 - 20, s * 132 + 12, Z0 + 250], S, 2));
  parts.push(bb([X0 - 12, -92, Z0 + 2], [X0 - 4, 0, Z0 + 246], "DoorWood", 1.5));
  parts.push(translate(rotateZ(bb([-4, 0, 0], [4, 90, 244], "DoorWood", 1.5), -62), [X0 - 6, 4, Z0 + 2]));
  for (const z of [Z0 + 50, Z0 + 190]) parts.push(bb([X0 - 15, -88, z], [X0 - 11, -6, z + 8], "Westcliffs_Iron"));
  // the bell-cote over the front gable: its opening empty, a cap and an iron finial with a ring
  const BC = { x0: X0 - 40, x1: X0 + 80, y: 120, z0: ZW + RH - 140, z1: ZW + RH + 420 };
  const cx = (BC.x0 + BC.x1) / 2, sill = BC.z1 - 210, ar = BC.y - 28, spring = BC.z1 - 30 - ar - 20;
  parts.push(bb([BC.x0, -BC.y, BC.z0], [BC.x1, BC.y, sill], S, 3));
  parts.push(bb([BC.x0 - 10, -BC.y - 10, sill - 10], [BC.x1 + 10, BC.y + 10, sill + 8], SD, 2));
  parts.push(bb([BC.x0, -BC.y, sill], [BC.x1, -ar, BC.z1 - 30], S, 2), bb([BC.x0, ar, sill], [BC.x1, BC.y, BC.z1 - 30], S, 2));
  parts.push(archRing(cx, 0, spring, ar, BC.x1 - BC.x0, 20, 9, SD), spandrels(BC.x0, BC.x1, 0, spring, ar + 20, ar, BC.z1 - 30, S));
  parts.push(bb([BC.x0 - 6, -BC.y - 6, BC.z1 - 34], [BC.x1 + 6, BC.y + 6, BC.z1], SD, 2));
  parts.push(beamBetween([cx, -ar, spring + 30], [cx, ar, spring + 30], 12, 12, "Westcliffs_TimberDark"));
  parts.push(translate(rotateZ(gableRoof([BC.x1 - BC.x0 + 10, 2 * BC.y + 10, 8], [0, 0, BC.z1], 70, 14, "RoofSlate"), 90), [cx, 0, 0]));
  parts.push(translate(rotateZ(gableRoof([BC.x1 - BC.x0, 2 * BC.y, 8], [0, 0, BC.z1 + 8], 70, 8, "Snow"), 90), [cx, 0, 0]));
  for (const s of [-1, 1]) parts.push(translate(rotateZ(gableWall(0, BC.y, BC.z1, 70, S), 90), [cx + s * (BC.x1 - BC.x0) / 2, 0, 0]).map((p) => ({ geo: p.geo, mat: p.mat })));
  parts.push(cylinderAt({ radius: 3, height: 110, segments: 6, bottom: [cx, 0, BC.z1 + 70] }, "Westcliffs_Iron"));
  parts.push(translate(rotateY(torus(20, 2.4, 14, 4, "Westcliffs_Iron"), 90), [cx, 0, BC.z1 + 160]));
  parts.push(icicles([BC.x0 - 10, -BC.y - 14, BC.z1 - 2], [BC.x1 + 10, -BC.y - 14, BC.z1 - 2], 2803, 16, 30));
  // the apse at the back: a half drum under a half cone of slate
  parts.push(cylinderAt({ radius: 300, height: ZW - Z0 - 60, segments: 14, bottom: [X1, 0, Z0] }, S));
  parts.push(cylinderAt({ radius: 315, height: 30, segments: 14, bottom: [X1, 0, Z0 - 10] }, SD));
  parts.push(cylinderAt({ rBot: 330, rTop: 20, height: 260, segments: 14, bottom: [X1, 0, ZW - 60] }, "RoofSlate"), cylinderAt({ rBot: 320, rTop: 18, height: 254, segments: 14, bottom: [X1, 0, ZW - 48] }, "Snow"));
  for (const a of [-50, 0, 50]) parts.push(translate(rotateZ(lancet(0, 0, 0, 56, 190, 1), a), [X1 + Math.cos((a * Math.PI) / 180) * 300, Math.sin((a * Math.PI) / 180) * 300, 260]));
  // the eaves' icicles, the rubble of the fallen bay heaped against the wall below it
  for (const s of [-1, 1]) parts.push(icicles([X0, s * (Y + 42), ZW - 30], [s > 0 ? HOLE[0] : X1, s * (Y + 42), ZW - 30], 2805 + s, 22, 50));
  for (let i = 0; i < 6; i++) parts.push(translate(rotateZ(rock([70 + rnd() * 40, 50 + rnd() * 30, 40], 0.35, 2811 + i, i % 2 ? S : "RoofSlate", true), rnd() * 180), [HOLE[0] + 40 + i * 45, Y + 100 + rnd() * 80, 0]));
  parts.push(translate(rotateZ(rotateY(beamBetween([0, 0, 0], [280, 0, 0], 14, 14, "Westcliffs_TimberDark"), -20), 30), [HOLE[0] + 40, Y + 90, 20]));
  parts.push(drift(420, 160, 50, 2821, [HOLE[0] + 160, Y + 140, 0], 0), drift(520, 160, 46, 2823, [0, -Y - 120, 0], 0), drift(280, 150, 40, 2825, [X1 + 300, -260, 0], 40));
  return merge(...parts);
}

// The monks' cells: a long low range under a slate roof, an arcade of round arches along its front
// with a door into each cell behind it, small windows on the back, chimneys; its far end ruined,
// the roof gone from the last cell and the gable broken down. About 13 x 6.4 m, 5.4 m high.
function abbeyCells(): Geo {
  const rnd = seeded(2901), parts: Geo[] = [];
  const Y = 600, X0 = -150, X1 = 300, ZW = 380, AX = -340, S = "Westcliffs_AbbeyStone", SD = "Westcliffs_AbbeyStoneDark";
  const RUIN = 380; // the cell past this (+Y) is ruined
  const cxr = (X0 + X1) / 2, half = (X1 - X0) / 2;
  parts.push(bb([AX - 20, -Y - 30, -12], [X1 + 30, Y + 30, 30], SD, 4));
  // the walls; at the ruined end only their stumps, ragged, rubble on its floor
  parts.push(bb([X0, -Y, 30], [X1, RUIN, ZW], S));
  for (let y = RUIN; y < Y; y += 44) parts.push(bb([X0, y, 30], [X0 + 40, y + 44, ZW - 90 - rnd() * 170], S), bb([X1 - 40, y, 30], [X1, y + 44, ZW - 110 - rnd() * 170], S));
  for (let x = X0; x < X1; x += 50) parts.push(bb([x, Y - 40, 30], [x + 50, Y, 110 + rnd() * 130], S));
  parts.push(bb([X0 + 40, RUIN, 30], [X1 - 40, Y - 40, 36], "Westcliffs_Rubble", 2));
  // the roof, its ridge along Y, over the whole cells; the gables at the end and at the ruin
  const RH = 160;
  parts.push(translate(rotateZ(gableRoof([RUIN + Y + 30, 2 * half, 12], [0, 0, ZW], RH, 40, "RoofSlate"), 90), [cxr, (RUIN - Y) / 2 - 15, 0]));
  parts.push(translate(rotateZ(gableRoof([RUIN + Y + 20, 2 * half, 16], [0, 0, ZW + 12], RH, 34, "Snow"), 90), [cxr, (RUIN - Y) / 2 - 15, 0]));
  for (const y of [-Y, RUIN]) parts.push(translate(rotateZ(gableWall(0, half, ZW, RH, S), 90), [cxr, y, 0]));
  // the rafters left bare over the ruined cell
  for (let y = RUIN + 50; y < Y - 60; y += 70) for (const s of [-1, 1]) parts.push(beamBetween([cxr, y, ZW + RH - 20 - (y - RUIN) * 0.4], [cxr + s * half, y, ZW - 10], 10, 12, "Westcliffs_TimberDark"));
  // the arcade: round arches on columns under a lean-to roof
  const cols = [-600, -360, -120, 120, 360, 600];
  const SPRING = 178, AR = 96;
  for (const y of cols) {
    parts.push(cylinderAt({ radius: 22, height: 14, segments: 8, bottom: [AX + 20, y, 30] }, SD));
    if (y > RUIN) {
      parts.push(cylinderAt({ radius: 16, height: 60 + rnd() * 50, segments: 8, bottom: [AX + 20, y, 44] }, S));
      continue;
    }
    parts.push(cylinderAt({ radius: 16, height: SPRING - 58, segments: 8, bottom: [AX + 20, y, 44] }, S), bb([AX - 6, y - 26, SPRING - 14], [AX + 46, y + 26, SPRING], SD, 2));
  }
  const last = cols.filter((y) => y < RUIN).pop()!;
  for (let i = 0; i + 1 < cols.length && cols[i + 1] <= last; i++) {
    const yc = (cols[i] + cols[i + 1]) / 2;
    parts.push(archRing(AX + 20, yc, SPRING, AR, 40, 20, 9, S), spandrels(AX, AX + 40, yc, SPRING, AR + 20, 120, 300, S));
  }
  parts.push(bb([AX - 6, -Y - 6, 300], [AX + 46, last + 30, 318], SD, 2));
  const lean = Math.atan2(32, X0 - AX + 30), run = Math.hypot(X0 - AX + 30, 32);
  parts.push(translate(rotateY(bb([0, -Y - 20, 0], [run, last + 50, 10], "RoofSlate"), -lean * DEG), [AX - 30, 0, 320]));
  parts.push(translate(rotateY(bb([4, -Y - 10, 10], [run, last + 40, 20], "Snow"), -lean * DEG), [AX - 30, 0, 320]));
  parts.push(icicles([AX - 30, -Y - 10, 318], [AX - 30, last + 40, 318], 2903, 20, 40));
  // the cells' doors and the grilles in them; the ruined cell's doorway empty
  for (let i = 0; i < 4; i++) {
    const y = -480 + i * 290, ruined = y > RUIN;
    if (ruined) continue;
    parts.push(bb([X0 - 4, y - 50, 30], [X0 + 4, y + 50, 240], "Westcliffs_TimberDark"));
    parts.push(bb([X0 - 8, y - 44, 32], [X0 - 4, y + 44, 230], "DoorWood", 1.5), bb([X0 - 10, y - 16, 176], [X0 - 6, y + 16, 206], "Westcliffs_Dark"));
    for (const dy of [-8, 0, 8]) parts.push(bb([X0 - 12, y + dy - 1.2, 176], [X0 - 9, y + dy + 1.2, 206], "Westcliffs_Iron"));
    parts.push(bb([X0 - 12, y - 62, 236], [X0 + 4, y + 62, 254], SD, 2));
    parts.push(bb([X1 - 4, y - 24, 200], [X1 + 6, y + 24, 270], "Westcliffs_Dark"), bb([X1 + 2, y - 30, 192], [X1 + 10, y + 30, 200], SD, 1));
  }
  // chimneys, a water butt, a bench under the arcade, stones fallen from the ruin
  for (const y of [-300, 150]) parts.push(boxAt([56, 56, 220], [X1 - 70, y, ZW], SD, 3), boxAt([66, 66, 10], [X1 - 70, y, ZW + 220], S, 2));
  parts.push(plume([X1 - 70, -300, ZW + 250], 3, 18, 2905, [30, 40]));
  parts.push(cylinderAt({ rBot: 34, rTop: 38, height: 90, segments: 10, bottom: [AX - 50, -Y + 60, 30] }, "Westcliffs_Timber"), cylinderAt({ radius: 36, height: 4, segments: 10, bottom: [AX - 50, -Y + 60, 118] }, "Westcliffs_Ice"));
  parts.push(bb([X0 - 60, -260, 30], [X0 - 20, -60, 76], "Westcliffs_Plank", 2));
  for (let i = 0; i < 6; i++) parts.push(translate(rotateZ(rock([60 + rnd() * 40, 50, 36], 0.35, 2911 + i, S, true), rnd() * 180), [AX + rnd() * 400, Y + 40 + rnd() * 120, 0]));
  parts.push(drift(380, 150, 44, 2921, [80, Y + 120, 0], 0), drift(300, 140, 40, 2923, [X1 + 110, -200, 0], 90), drift(220, 120, 30, 2925, [AX - 80, 450, 0], 0));
  return merge(...parts);
}

// A length of the abbey wall, 6 m (along Y; lengths join end to end): ashlar on a footing course,
// a coping with snow on it, a buttress on its outer (-X) face, a few stones gone. 0.9 x 6 m,
// 3.1 m high.
function abbeyWall(): Geo {
  const rnd = seeded(3001), S = "Westcliffs_AbbeyStone", SD = "Westcliffs_AbbeyStoneDark", parts: Geo[] = [];
  parts.push(bb([-44, -300, -10], [44, 300, 30], SD, 3), bb([-35, -300, 30], [35, 300, 280], S));
  parts.push(coped([-42, -302, 280], [42, 302, 300], SD, 3003, 0.8));
  parts.push(bb([-90, -40, -10], [-35, 40, 200], SD, 3), translate(rotateY(box([60, 80, 50], [0, 0, 0], SD, 3), -35), [-62, 0, 205]));
  for (let i = 0; i < 6; i++) {
    const y = -270 + rnd() * 540, z = 50 + rnd() * 200;
    parts.push(bb([-38, y, z], [-30, y + 30 + rnd() * 30, z + 18], "Westcliffs_Dark"));
  }
  parts.push(drift(200, 110, 34, 3005, [-90, -170, 0], 0), drift(180, 100, 30, 3007, [80, 150, 0], 0));
  return merge(...parts);
}

// A length of the abbey wall fallen in, 6 m: its top broken down in steps to a stump at one end,
// the stones heaped either side. 2.6 x 6 m, up to 2.8 m high.
function abbeyWallRuin(): Geo {
  const rnd = seeded(3101), S = "Westcliffs_AbbeyStone", SD = "Westcliffs_AbbeyStoneDark", parts: Geo[] = [];
  parts.push(bb([-44, -300, -10], [44, 300, 30], SD, 3));
  for (let y = -300; y < 300; y += 50) {
    const t = (y + 300) / 600, top = 280 - t * 220 + (rnd() - 0.5) * 50;
    parts.push(bb([-35, y, 30], [35, y + 50, Math.max(50, top)], S));
  }
  parts.push(coped([-42, -302, 270], [42, -180, 290], SD, 3103, 0.7));
  for (let i = 0; i < 10; i++) {
    const s = (rnd() < 0.5 ? -1 : 1) * (70 + rnd() * 70);
    parts.push(translate(rotateZ(rotateY(box([50 + rnd() * 20, 34, 26], [0, 0, 13], rnd() < 0.3 ? SD : S, 3), (rnd() - 0.5) * 40), rnd() * 180), [s, -40 + rnd() * 320, 0]));
  }
  parts.push(drift(220, 120, 30, 3105, [-110, 120, 0], 0), drift(200, 110, 26, 3107, [110, -60, 0], 0));
  return merge(...parts);
}

// The abbey gate: a gatehouse of two piers and the round arch between them, a gabled cap of slate,
// a niche over the arch with the bronze bell sign of the order, the doors standing open against
// the passage, an iron lantern, steps. Walked through along X. About 3.4 x 5.6 m, 6.2 m high.
function abbeyGate(): Geo {
  const S = "Westcliffs_AbbeyStone", SD = "Westcliffs_AbbeyStoneDark", parts: Geo[] = [];
  const X = 150, W = 125, Y = 280, ZA = 260, ZT = 480;
  parts.push(bb([-X - 30, -Y - 20, -12], [X + 30, -W + 10, 30], SD, 3), bb([-X - 30, W - 10, -12], [X + 30, Y + 20, 30], SD, 3));
  parts.push(bb([-X, -Y, 30], [X, -W, ZT], S), bb([-X, W, 30], [X, Y, ZT], S));
  parts.push(spandrels(-X, X, 0, ZA, W + 20, W, ZT, S));
  parts.push(archRing(-X - 2, 0, ZA, W, 30, 26, 11, SD, S), archRing(X + 2, 0, ZA, W, 30, 26, 11, SD, S));
  parts.push(bb([-X - 8, -Y - 8, ZA - 10], [-X + 4, -W - 26, ZA + 8], SD, 2), bb([-X - 8, W + 26, ZA - 10], [-X + 4, Y + 8, ZA + 8], SD, 2));
  // the passage's floor, the doors open against its sides
  parts.push(bb([-X - 10, -W, 0], [X + 10, W, 32], "Westcliffs_Rubble", 2));
  for (const s of [-1, 1]) parts.push(bb([X - 140, s * (W - 8) - 4, 34], [X - 30, s * (W - 8) + 4, 300], "DoorWood", 1.5), bb([X - 140, s * (W - 14) - 2, 80], [X - 30, s * (W - 14) + 2, 90], "Westcliffs_Iron"));
  // the cap: a slate gable along Y, snow on it
  parts.push(bb([-X - 14, -Y - 14, ZT], [X + 14, Y + 14, ZT + 18], SD, 2));
  parts.push(translate(rotateZ(gableRoof([2 * Y + 30, 2 * X + 30, 10], [0, 0, ZT + 18], 110, 20, "RoofSlate"), 90), [0, 0, 0]));
  parts.push(translate(rotateZ(gableRoof([2 * Y + 20, 2 * X + 30, 14], [0, 0, ZT + 28], 110, 14, "Snow"), 90), [0, 0, 0]));
  for (const s of [-1, 1]) parts.push(translate(rotateZ(gableWall(0, X + 14, ZT + 18, 110, S), 90), [0, s * (Y + 14), 0]));
  parts.push(icicles([-X - 40, -Y - 20, ZT + 4], [-X - 40, Y + 20, ZT + 4], 3201, 18, 36));
  // the niche over the arch with the order's sign: a bronze bell in a ring
  parts.push(bb([-X - 4, -40, 400], [-X + 6, 40, 470], "Westcliffs_Dark"), archRing(-X - 6, 0, 470, 40, 14, 10, 7, SD));
  parts.push(translate(merge(lathe([[2, 52], [10, 48], [16, 34], [20, 10], [24, 0], [0.5, 0]], 10, "Westcliffs_Bronze"), translate(rotateY(torus(30, 2.5, 16, 4, "Westcliffs_Bronze"), 90), [0, 0, 26])), [-X - 10, 0, 408]));
  // the lantern on its bracket
  parts.push(beamBetween([-X, -W - 40, 330], [-X - 50, -W - 40, 330], 5, 5, "Westcliffs_Iron"), cylinderBetween([-X - 46, -W - 40, 330], [-X - 46, -W - 40, 316], 0.8, 4, "Westcliffs_Iron"));
  parts.push(bb([-X - 56, -W - 50, 284], [-X - 36, -W - 30, 314], "Westcliffs_Iron", 1), bb([-X - 54, -W - 48, 287], [-X - 38, -W - 32, 311], "LanternGlow"));
  // the steps up to it from outside
  for (let k = 0; k < 2; k++) parts.push(bb([-X - 60 - k * 30, -W - 10, -12], [-X - 30, W + 10, 20 - k * 14], SD, 2));
  parts.push(drift(220, 160, 40, 3203, [-X - 40, -Y - 40, 0], 0), drift(220, 160, 40, 3205, [X + 40, Y + 40, 0], 0));
  return merge(...parts);
}

// The bell pavilion: the abbey's great bronze bell hung in a timber frame on a stone plinth under a
// hipped roof of slate, the striking log slung on ropes beside it, a rail round three sides, steps
// up at the front. About 5.8 x 5.8 m, 6.4 m high.
function bellPavilion(): Geo {
  const rnd = seeded(3301), parts: Geo[] = [];
  const P = 230, ZP = 50, ZB = 500, T = "Westcliffs_TimberDark";
  parts.push(bb([-P - 40, -P - 40, -14], [P + 40, P + 40, ZP], "Westcliffs_AbbeyStoneDark", 4));
  parts.push(bb([-P - 30, -P - 30, ZP - 6], [P + 30, P + 30, ZP], "Westcliffs_AbbeyStone", 1));
  for (let k = 0; k < 3; k++) parts.push(bb([-P - 90 - k * 30, -110, -14], [-P - 40, 110, ZP - 16 - k * 16], "Westcliffs_AbbeyStoneDark", 3));
  // the posts on their stone bases, the beams, the bell beam across
  for (const [x, y] of [[-P, -P], [P, -P], [P, P], [-P, P]]) {
    parts.push(boxAt([44, 44, 30], [x, y, ZP], "Westcliffs_AbbeyStone", 3), boxAt([28, 28, ZB - ZP - 30], [x, y, ZP + 30], T, 2));
  }
  for (const s of [-1, 1]) {
    parts.push(bb([-P - 26, s * P - 16, ZB - 30], [P + 26, s * P + 16, ZB], T, 2));
    parts.push(bb([s * P - 16, -P - 26, ZB - 30], [s * P + 16, P + 26, ZB], T, 2));
    for (const t of [-1, 1]) parts.push(beamBetween([s * P, t * (P - 20), ZB - 110], [s * P, t * (P - 110), ZB - 20], 12, 12, T));
  }
  parts.push(bb([-20, -P - 10, ZB - 64], [20, P + 10, ZB - 30], T, 2));
  // the rail round three sides (open at the front)
  for (const [a, b] of [[[-P, -P], [P, -P]], [[P, -P], [P, P]], [[P, P], [-P, P]]] as [[number, number], [number, number]][]) {
    parts.push(beamBetween([a[0], a[1], ZP + 80], [b[0], b[1], ZP + 80], 8, 10, "Westcliffs_Timber"));
    for (let t = 0.2; t < 0.9; t += 0.2) parts.push(boxAt([8, 8, 80], [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, ZP], "Westcliffs_Timber", 1));
  }
  // the bell: a bronze lip, waist and crown, bosses, the verdigris running down it, its loop
  const bell = lathe([[70, 0], [74, 6], [66, 14], [58, 40], [50, 80], [46, 110], [42, 128], [30, 138], [0.5, 140]], 18, "Westcliffs_Bronze");
  paint(bell, (p) => {
    const v = noise3(Math.atan2(p.y, p.x) * 2.5, p.z / 40, 1, 3303), g = v > 0.6 ? 1 : 0;
    return g ? [0.75, 1.15, 1.05] : [1, 1, 1];
  });
  const BZ = ZB - 64 - 40 - 140;
  parts.push(translate(bell, [0, 0, BZ]));
  for (const z of [BZ + 60, BZ + 100]) parts.push(translate(rotateZ(torus(z === BZ + 60 ? 52 : 46, 3, 18, 4, "Westcliffs_Bronze"), 0), [0, 0, z]));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    parts.push(sphereCenter(4.5, [Math.cos(a) * 48, Math.sin(a) * 48, BZ + 82], "Westcliffs_Bronze", 5));
  }
  parts.push(translate(rotateX(torus(16, 5, 12, 5, "Westcliffs_Bronze"), 90), [0, 0, BZ + 156]), cylinderBetween([0, 0, BZ + 170], [0, 0, ZB - 64], 4, 6, "Westcliffs_Iron"));
  parts.push(icicles([-74, 0, BZ + 2], [74, 0, BZ + 2], 3305, 14, 18), icicles([0, -74, BZ + 2], [0, 74, BZ + 2], 3307, 14, 18));
  // the striking log on its ropes, its end bound with rope
  const LZ = BZ + 60;
  parts.push(cylinderBetween([-P + 40, 0, LZ], [-82, 0, LZ], 13, 10, "Westcliffs_Timber"), cylinderBetween([-82, 0, LZ], [-81, 0, LZ], 11, 10, LOG_END));
  parts.push(cylinderAt({ radius: 14, height: 16, segments: 10, bottom: [0, 0, 0] }, "RopeTan").map((p) => ({ geo: p.geo.clone().rotateY(Math.PI / 2).translate(-P + 60, 0, LZ), mat: p.mat })));
  for (const x of [-P + 70, -120]) parts.push(cylinderBetween([x, 0, LZ + 12], [x, -P + 20, ZB - 30], 1.2, 4, "RopeTan"), cylinderBetween([x, 0, LZ + 12], [x, P - 20, ZB - 30], 1.2, 4, "RopeTan"));
  // the hipped roof: slate, snow on it, a finial; the eaves' icicles
  const E = P + 80, RHt = 230;
  parts.push(rotateZ(cylinderAt({ rBot: E * Math.SQRT2, rTop: 18, height: RHt, segments: 4, bottom: [0, 0, ZB] }, "RoofSlate"), 45));
  parts.push(rotateZ(cylinderAt({ rBot: (E - 50) * Math.SQRT2, rTop: 14, height: RHt * (1 - 50 / E) + 4, segments: 4, bottom: [0, 0, ZB + (RHt * 50) / E + 6] }, "Snow"), 45));
  // the hips: ridges of dark slate from the eaves' corners up to the finial
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) parts.push(beamBetween([sx * (E - 6), sy * (E - 6), ZB + 8], [0, 0, ZB + RHt + 4], 12, 12, "Westcliffs_SlateDark"));
  parts.push(cylinderAt({ radius: 10, height: 50, segments: 8, bottom: [0, 0, ZB + RHt - 4] }, "Westcliffs_Bronze"), sphereCenter(14, [0, 0, ZB + RHt + 58], "Westcliffs_Bronze", 8));
  for (const s of [-1, 1]) {
    parts.push(icicles([-E, s * (E - 4), ZB + 4], [E, s * (E - 4), ZB + 4], 3311 + s, 20, 36));
    parts.push(icicles([s * (E - 4), -E, ZB + 4], [s * (E - 4), E, ZB + 4], 3315 + s, 20, 36));
  }
  // a prayer flag line from the roof's corner, snow drifted on the plinth's lee
  const line = sagLine([P + 70, P + 70, ZB + 6], [P + 380, P + 330, 30], 40, 7), cloth = ["FabricRed", "FabricWhite", "FabricBlue", "FabricGold", "FabricGreen"];
  parts.push(rope(line, 0.8));
  for (let k = 1; k < 7; k++) parts.push(translate(rotateZ(bb([-1, -11, -26], [1, 11, 0], cloth[k % 5]), 40), line[k]));
  parts.push(drift(300, 140, 34, 3321, [P + 120, 0, 0], 90), drift(260, 120, 28, 3323, [0, P + 120, 0], 0), drift(200, 100, 20, 3325, [rnd() * 10, -P - 110, 0], 0));
  return merge(...parts);
}

// Stone stairs up to the abbey: 11 m long rising 3.5 m toward +X, 4.4 m wide, with a low parapet
// up each side and a lantern post at the foot and the head of each. Lay it on a straight ramp of the
// same rise, centred on the ramp's middle, its foot (-X) at the ramp's foot.
export const ABBEY_STAIRS = { run: 1100, rise: 350, width: 440 };
function abbeyStairs(): Geo {
  const rnd = seeded(3401), parts: Geo[] = [];
  const { run, rise } = ABBEY_STAIRS, W = ABBEY_STAIRS.width / 2, n = 18, tr = run / n, k = rise / run;
  const zAt = (x: number) => x * k;
  for (let i = 0; i < n; i++) {
    const x0 = -run / 2 + i * tr, x1 = x0 + tr, top = zAt(x1) + 3;
    parts.push(bb([x0, -W + 30, zAt(x0) - 40], [x1 + 6, W - 30, top + (rnd() - 0.5) * 2], rnd() < 0.25 ? "Westcliffs_AbbeyStoneDark" : "Westcliffs_AbbeyStone", 2.5));
    if (rnd() < 0.5) parts.push(blob(20 + rnd() * 14, [x0 + tr * 0.4, (rnd() < 0.5 ? -1 : 1) * (W - 50), top], "Snow", 0.3, 6));
  }
  // the parapets: stepped blocks up each side with a coping
  for (const s of [-1, 1]) {
    for (let j = 0; j < 9; j++) {
      const xa = -run / 2 + (j * run) / 9, xb = xa + run / 9;
      const [y0, y1] = s > 0 ? [W - 30, W] : [-W, -W + 30];
      parts.push(bb([xa, y0, zAt(xa) - 40], [xb + 4, y1, zAt(xb) + 58], j % 2 ? "Westcliffs_AbbeyStoneDark" : "Westcliffs_AbbeyStone", 3));
      parts.push(bb([xa - 2, y0 - 4, zAt(xb) + 58], [xb + 6, y1 + 4, zAt(xb) + 70], "Westcliffs_AbbeyStoneDark", 2));
      parts.push(blob(30, [xa + run / 18, s * (W - 15), zAt(xb) + 70], "Snow", 0.18, 6));
    }
    for (const x of [-run / 2 + 30, run / 2 - 30]) {
      const z = zAt(x) + 70;
      parts.push(boxAt([30, 30, 110], [x, s * (W - 15), z], "Westcliffs_AbbeyStone", 3), boxAt([38, 38, 10], [x, s * (W - 15), z + 110], "Westcliffs_AbbeyStoneDark", 2));
      parts.push(bb([x - 12, s * (W - 15) - 12, z + 120], [x + 12, s * (W - 15) + 12, z + 150], "Westcliffs_Iron", 1), bb([x - 9, s * (W - 15) - 9, z + 123], [x + 9, s * (W - 15) + 9, z + 147], "LanternGlow"));
      parts.push(rotateZ(cylinderAt({ rBot: 20, rTop: 2, height: 12, segments: 4, bottom: [0, 0, 0] }, "Westcliffs_Iron"), 45).map((p) => ({ geo: p.geo.clone().translate(x, s * (W - 15), z + 150), mat: p.mat })));
    }
  }
  return merge(...parts);
}

// Prayer flags: a line of cloths in five colours strung between two poles, sagging in the middle,
// the poles stood in little cairns. About 9 x 0.8 m, 4 m high.
function prayerFlags(): Geo {
  const parts: Geo[] = [], cloth = ["FabricBlue", "FabricWhite", "FabricRed", "FabricGreen", "FabricGold"];
  for (const s of [-1, 1]) {
    parts.push(cylinderAt({ rBot: 6, rTop: 4.5, height: 390, segments: 6, bottom: [0, s * 430, 0] }, "Westcliffs_Timber"));
    parts.push(sphereCenter(7, [0, s * 430, 394], "Westcliffs_Bronze", 6));
    let z = 0;
    for (let k = 0; k < 4; k++) {
      const r = 34 - k * 6;
      parts.push(translate(rotateZ(rock([r * 1.4, r * 1.2, 16], 0.3, 3501 + k + (s > 0 ? 10 : 0), k % 2 ? "Westcliffs_Granite" : "Westcliffs_GraniteDark", true), k * 50), [0, s * 430, z]));
      z += 12;
    }
    parts.push(drift(120, 90, 18, 3521 + s, [10, s * 430, 0], 0));
  }
  const line = sagLine([0, -426, 370], [0, 426, 370], 80, 16);
  parts.push(rope(line, 0.8));
  for (let k = 1; k < 16; k++) parts.push(translate(bb([-0.8, -12, -30], [0.8, 12, 0], cloth[k % 5]), line[k]));
  return merge(...parts);
}

// The ledge where an ascetic sits: a flat rock with a straw mat on it, his bowl, his water gourd,
// his staff leaning on a stone, a little cairn, a folded shawl, a cup of incense smoking; snow
// all round. About 3 x 2.4 m.
function meditationLedge(): Geo {
  const parts: Geo[] = [];
  const slab = rock([280, 220, 70], 0.18, 3601, "Westcliffs_Granite", true);
  parts.push(slab, snowOn(slab, 0.2, 3603, 3));
  const T = 44;
  parts.push(bb([-70, -55, T], [60, 55, T + 4], "Westcliffs_Straw", 1));
  for (let k = 0; k < 5; k++) parts.push(bb([-70, -55 + k * 26, T + 4], [60, -53 + k * 26, T + 4.6], "Westcliffs_SeaGrassDry"));
  parts.push(lathe([[0.5, 0], [8, 1], [13, 6], [14, 11], [12.5, 11.5]], 10, "Westcliffs_Timber").map((p) => ({ geo: p.geo.clone().translate(30, 80, T), mat: p.mat })));
  parts.push(translate(merge(sphereCenter(11, [0, 0, 11], "Westcliffs_Straw", 8), sphereCenter(7, [0, 0, 26], "Westcliffs_Straw", 7), cylinderAt({ radius: 2.5, height: 6, segments: 5, bottom: [0, 0, 32] }, "Westcliffs_TimberDark")), [-30, 85, T]));
  parts.push(bb([40, -85, T], [76, -45, T + 10], "FabricWhite", 2), bb([42, -83, T + 10], [74, -47, T + 14], "Westcliffs_Robe", 1));
  // the staff leaning on a stone at the ledge's end
  parts.push(translate(rock([50, 44, 40], 0.4, 3605, "Westcliffs_GraniteDark"), [120, 40, 0]));
  parts.push(cylinderBetween([150, -10, 0], [110, 46, 200], 2.6, 6, "Westcliffs_Timber"), sphereCenter(5, [110, 46, 202], "Westcliffs_TimberDark", 6));
  // the cairn, the incense cup
  let z = T;
  for (let k = 0; k < 5; k++) {
    parts.push(translate(rock([22 - k * 3, 18 - k * 2, 7], 0.3, 3611 + k, k % 2 ? "Westcliffs_Granite" : "Westcliffs_GraniteDark", true), [-100, -60, z]));
    z += 6;
  }
  parts.push(cylinderAt({ rBot: 5, rTop: 7, height: 8, segments: 8, bottom: [-90, 20, T] }, "Westcliffs_Bronze"), cylinderAt({ radius: 0.6, height: 18, segments: 3, bottom: [-90, 20, T + 8] }, "Westcliffs_TimberDark"));
  parts.push(plume([-90, 20, T + 30], 3, 5, 3615, [4, 10]));
  parts.push(drift(220, 120, 22, 3621, [-60, 140, 0], 0), drift(200, 110, 20, 3623, [80, -140, 0], 0), drift(140, 100, 16, 3625, [-160, -40, 0], 90));
  return centre(merge(...parts));
}

// The abbey's waystone: a post of slate on stepped stones, a gabled cap, a niche with a candle
// burning in it, arrow boards pointing the ways, a little bronze bell on an iron arm. About
// 1.4 x 1.2 m, 2.7 m high.
function abbeyWaystone(): Geo {
  const parts: Geo[] = [];
  parts.push(bb([-50, -50, -10], [50, 50, 16], "Westcliffs_AbbeyStoneDark", 3), bb([-36, -36, 16], [36, 36, 34], "Westcliffs_AbbeyStone", 3));
  parts.push(bb([-18, -20, 34], [18, 20, 220], "Westcliffs_Slate", 3));
  parts.push(translate(rotateZ(gableRoof([44, 52, 6], [0, 0, 220], 22, 6, "Westcliffs_SlateDark"), 90), [0, 0, 0]), translate(rotateZ(gableRoof([40, 48, 5], [0, 0, 226], 22, 2, "Snow"), 90), [0, 0, 0]));
  // the niche, its candle
  parts.push(bb([-20, -11, 150], [-14, 11, 190], "Westcliffs_Dark"), cylinderAt({ radius: 3, height: 12, segments: 6, bottom: [-17, 0, 150] }, "Westcliffs_Paper"), blob(2.4, [-17, 0, 164], "Westcliffs_Ember", 1.4, 5));
  // the arrows
  for (const [s, z, len] of [[1, 128, 66], [-1, 106, 56]] as [number, number, number][]) {
    parts.push(translate(merge(box([4, len, 16], [0, s * (len / 2 + 20), 0], "Westcliffs_Plank", 1.5), translate(rotateX(box([4, 12, 12], [0, 0, 0], "Westcliffs_Plank", 1), 45), [0, s * (len + 20), 0]), box([5, len - 12, 3], [0, s * (len / 2 + 17), 9], "Snow", 1)), [0, 0, z]));
  }
  // the bell on its arm
  parts.push(beamBetween([0, -20, 205], [0, -66, 205], 5, 5, "Westcliffs_Iron"), cylinderBetween([0, -62, 205], [0, -62, 194], 0.8, 4, "Westcliffs_Iron"));
  parts.push(translate(lathe([[13, 0], [11, 4], [9, 14], [6, 22], [0.5, 23]], 10, "Westcliffs_Bronze"), [0, -62, 170]));
  parts.push(drift(130, 110, 16, 3701, [10, 0, 0], 0));
  return merge(...parts);
}

// The abbey's old jetty: a causeway of big blocks running out into the sea (along +X) from the
// beach, its deck rising from the shore end, iron rings and two bollards, its far end broken off
// and fallen; ice round its feet. z = 0 is the sea. About 9.6 x 3.2 m.
function ruinedJetty(): Geo {
  const rnd = seeded(3801), parts: Geo[] = [], S = "Westcliffs_AbbeyStoneDark";
  const W = 130;
  for (let i = 0; i < 7; i++) {
    const x0 = -480 + i * 110, x1 = x0 + 108, top = 34 + i * 6;
    parts.push(bb([x0, -W, -60], [x1, W, top], i % 2 ? S : "Westcliffs_AbbeyStone", 3));
    parts.push(bb([x0 + 2, -W - 6, top - 12], [x1 - 2, W + 6, top + 4], "Westcliffs_AbbeyStone", 2));
    if (rnd() < 0.6) parts.push(blob(30 + rnd() * 20, [x0 + 50, (rnd() - 0.5) * 120, top + 4], "Snow", 0.2, 6));
    for (const s of [-1, 1]) if (i % 2 === 0) parts.push(translate(rotateX(torus(10, 2, 10, 4, "Westcliffs_Iron"), 90), [x0 + 54, s * (W + 8), top - 30]));
  }
  for (const x of [-60, 180]) parts.push(cylinderAt({ rBot: 18, rTop: 14, height: 56, segments: 8, bottom: [x, -W + 26, 50 + (x + 480) / 110 * 6] }, "Westcliffs_Iron"), sphereCenter(16, [x, -W + 26, 106 + (x + 480) / 110 * 6], "Westcliffs_Iron", 7));
  // the broken end: blocks tipped into the sea
  for (let i = 0; i < 5; i++) parts.push(translate(rotateZ(rotateY(box([100, 120 + rnd() * 60, 70], [0, 0, 0], i % 2 ? S : "Westcliffs_AbbeyStone", 3), 20 + rnd() * 40), (rnd() - 0.5) * 60), [320 + i * 40 + rnd() * 40, (rnd() - 0.5) * 220, -10 + rnd() * 20]));
  parts.push(coverTop(merge(...parts.slice(0, 14)), "Westcliffs_Ice", { thick: 2.5, seed: 3803, where: (_x, _y, z, nz) => z < 18 && z > -4 && Math.abs(nz) < 0.8 }));
  parts.push(surf([-80, 0], 520, 180, 3805, 18));
  return centre(merge(...parts));
}

export const KIT: Kit = {
  id: "westcliffs",
  name: "ผาหิมะริมทะเลตะวันตก",
  region: "รอบที่ราบเนินเขา",
  desc: "หุบหินร้องเพลงกับเสาหินกลวงที่ลมทะเลพัดผ่านจนฮัมเพลง หินรูปพิณยักษ์ ปากถ้ำค้างคาว และอาศรมของกวีเฒ่า ผาอารามหิมะกับโบสถ์ร้างบนผา กุฏิหิน ศาลาระฆัง บันไดหินขึ้นอาราม ธงมนต์ และท่าเรือเก่า ชายฝั่งหินแกรนิต แนวหินคลื่นซัด และซุ้มหินโค้งกลางทะเล",
  ground: "snow",
  sea: true,
  items: [
    { id: "coast_granite", name: "หินแกรนิตริมทะเล", make: coastGranite, tags: ["rock"] },
    { id: "rock_spire", name: "ยอดหินแหลมหิมะ", make: rockSpire, tags: ["rock"] },
    { id: "scree_slabs", name: "เศษหินแผ่นใต้ผา", make: screeSlabs, tags: ["ground", "rock"] },
    { id: "wind_hole_rock", name: "หินรูลม", make: windHoleRock, tags: ["rock"] },
    { id: "sea_grass", name: "กอหญ้าทะเลลู่ลม", make: seaGrass, tags: ["plant"] },
    { id: "thrift_cushions", name: "พุ่มดอกไม้ทะเลในหิมะ", make: thriftCushions, tags: ["plant"] },
    { id: "snapped_pine", name: "ซากสนหักลม", make: snappedPine, tags: ["log", "decor"] },
    { id: "surf_rocks", name: "แนวหินคลื่นซัด", make: surfRocks, tags: ["rock"] },
    { id: "sea_arch", name: "ซุ้มหินโค้งกลางทะเล", make: seaArch, tags: ["rock", "landmark"] },
    { id: "hollow_pillar", name: "เสาหินกลวง", make: hollowPillar, tags: ["rock", "landmark"] },
    { id: "pillar_grove", name: "ดงเสาหินร้องเพลง", make: pillarGrove, tags: ["landmark"] },
    { id: "harp_rock", name: "หินรูปพิณยักษ์", make: harpRock, tags: ["landmark"] },
    { id: "echo_cave", name: "ปากถ้ำค้างคาว", make: echoCave, tags: ["rock", "landmark"] },
    { id: "poet_hermitage", name: "อาศรมกวีเฒ่า", make: poetHermitage, tags: ["building", "landmark"] },
    { id: "wind_chime_post", name: "เสาโมบายลม", make: windChimePost, tags: ["decor"] },
    { id: "poem_stele", name: "ศิลาจารึกบทกวี", make: poemStele, tags: ["decor", "sign"] },
    { id: "abbey_church", name: "โบสถ์อารามผาหิมะ", make: abbeyChurch, tags: ["building", "landmark"] },
    { id: "abbey_cells", name: "กุฏิหินเรียงแถว", make: abbeyCells, tags: ["building"] },
    { id: "abbey_wall", name: "กำแพงอาราม (6 ม.)", make: abbeyWall, tags: ["wall"] },
    { id: "abbey_wall_ruin", name: "กำแพงอารามพัง (6 ม.)", make: abbeyWallRuin, tags: ["wall"] },
    { id: "abbey_gate", name: "ประตูอาราม", make: abbeyGate, tags: ["gate"] },
    { id: "bell_pavilion", name: "ศาลาระฆัง", make: bellPavilion, tags: ["building", "landmark"] },
    { id: "abbey_stairs", name: "บันไดหินขึ้นอาราม (11 ม. สูง 3.5 ม.)", make: abbeyStairs, tags: ["ground"] },
    { id: "prayer_flags", name: "ธงมนต์ขึงเชือก", make: prayerFlags, tags: ["decor"] },
    { id: "meditation_ledge", name: "แท่นหินนั่งสมาธิของนักพรต", make: meditationLedge, tags: ["decor"] },
    { id: "abbey_waystone", name: "หลักบอกทางอาราม", make: abbeyWaystone, tags: ["sign", "light"] },
    { id: "ruined_jetty", name: "ท่าเรือหินพังของอาราม", make: ruinedJetty, tags: ["dock"] },
  ],
  // A corner of the west cliffs: the grove of humming stones with a lone pillar and the wind-hole
  // rock, the harp on its rise and the poet's hermitage with his chimes and his stele (the north,
  // +X); the abbey's gate and walls, the church, the cells and the bell pavilion at the head of the
  // stairs (the south, -X); the shore along -Y with the jetty, the reef and the sea arch.
  sample(put) {
    put("pillar_grove", [1200, 900, 0], 0, 0.85);
    put("hollow_pillar", [300, 1700, 0], 30);
    put("wind_hole_rock", [-200, 700, 0], 60);
    put("harp_rock", [1900, -600, 0], 0, 0.7);
    put("poet_hermitage", [-300, 2600, 0], 200, 0.85);
    put("wind_chime_post", [-1100, 2100, 0], 20);
    put("poem_stele", [500, 2300, 0], 160);
    put("echo_cave", [2500, 2400, 0], 200, 0.8);
    put("abbey_church", [-1500, -700, 0], 90, 0.75);
    put("abbey_cells", [-2350, 1100, 0], 0, 0.75);
    put("bell_pavilion", [-300, -1000, 0], 45, 0.85);
    put("abbey_gate", [-300, 400, 0], 90, 0.85);
    put("abbey_wall", [-1100, 400, 0], 90, 0.85);
    put("abbey_wall_ruin", [500, 400, 0], 90, 0.85);
    put("abbey_stairs", [-2400, -600, 0], 0, 0.6);
    put("prayer_flags", [400, -1200, 0], 60);
    put("meditation_ledge", [1000, -1500, 0], 20);
    put("abbey_waystone", [-800, 1200, 0], 160);
    put("ruined_jetty", [-600, -2700, -12], -90, 0.9);
    put("surf_rocks", [1100, -2900, -12], 0);
    put("sea_arch", [2400, -3600, -12], 10, 0.6);
    put("coast_granite", [400, -1900, 0], 30);
    put("rock_spire", [2300, 1300, 0], 0, 0.8);
    put("scree_slabs", [2100, 300, 0], 0);
    put("snapped_pine", [-1800, 2200, 0], 40);
    for (const [x, y] of [[-600, -1800], [1500, -1800], [200, -2000], [2200, -1700]]) put("sea_grass", [x, y, 0], 0);
    for (const [x, y] of [[100, 1100], [800, -600], [-1300, 1600], [1600, 2100]]) put("thrift_cushions", [x, y, 0], x);
    for (const [x, y, s] of [[-2200, 2300, 1.1], [2300, 2300, 1], [-2300, -1800, 1], [1500, 2500, 0.9], [-1300, 2600, 1]]) put("flora:SnowPine", [x, y, 0], x, s);
    for (const [x, y] of [[-900, 2700], [2200, -200], [-2100, 1900]]) put("flora:SnowPineSmall", [x, y, 0], y);
  },
};

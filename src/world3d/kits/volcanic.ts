// ภูเขาไฟโอซากิ (the volcanic kit): the island of Osaki beyond its mountain gate. First the
// hills: bamboo groves, sakura terraces, a shrine nobody tends any more, its torii and stone
// lanterns fallen among the grass, jizo by the track. Then the volcano at the island's heart:
// black lava rock, basalt columns, sulphur vents breathing yellow steam, hot springs, dead trees
// and the glowing crater at the top.
//
// All centimetres, Z up; every item stands on z = 0, centred on its footprint, front facing -X.

import * as THREE from "three";
import { merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween, cylinderBetween, cylinderAt, sphereCenter, torus, rock, gableRoof, gableWall } from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import { shrub, limb as smooth } from "../trees";
import type { ShrubLook } from "../trees";
import type { Kit, Put } from "./types";

// ---- the island's own colours ----
defineMaterial("Volcanic_LavaRock", { map: "crag", tint: "#4c4446", bump: 4 }); // black porous rock
defineMaterial("Volcanic_LavaRockDark", { map: "crag", tint: "#332d2f", bump: 4 });
defineMaterial("Volcanic_Basalt", { map: "crag", tint: "#57535c", bump: 3, rough: 0.85 });
defineMaterial("Volcanic_BasaltTop", { map: "stone", tint: "#7b7780", bump: 2 });
defineMaterial("Volcanic_Ash", { map: "plaster", tint: "#77706a", rough: 1, bump: 1.5 });
defineMaterial("Volcanic_Lava", { map: "marble", tint: "#ff8a2c", rough: 0.55, glow: "#ff4f0c", glowI: 2.3 });
defineMaterial("Volcanic_LavaHot", { tint: "#ffd56c", rough: 0.5, glow: "#ffb01e", glowI: 2.6 });
defineMaterial("Volcanic_Crust", { map: "crag", tint: "#2e2627", bump: 3, glow: "#4a1000", glowI: 0.4 });
defineMaterial("Volcanic_Sulphur", { map: "plaster", tint: "#e8cd3e", rough: 1, bump: 1.4 });
defineMaterial("Volcanic_SulphurStain", { map: "plaster", tint: "#c8892e", rough: 1, bump: 1 });
defineMaterial("Volcanic_SulphurGlow", { tint: "#fff3a0", rough: 0.6, glow: "#ffd02a", glowI: 1.5 });
defineMaterial("Volcanic_Steam", { tint: "#f4f4f0", rough: 1, opacity: 0.42 });
defineMaterial("Volcanic_Smoke", { tint: "#b9b3ad", rough: 1, opacity: 0.4 });
defineMaterial("Volcanic_Spring", { tint: "#7ad8d3", rough: 0.06, opacity: 0.82 });
defineMaterial("Volcanic_SpringBed", { map: "stone", tint: "#3f918b", rough: 0.6 });
defineMaterial("Volcanic_Sinter", { map: "stone", tint: "#ebe1cd", bump: 1.6 });
defineMaterial("Volcanic_SinterRust", { map: "stone", tint: "#c98a5c", bump: 1.4 });
defineMaterial("Volcanic_Charred", { map: "bark", tint: "#3a3230", bump: 3 });
defineMaterial("Volcanic_DeadWood", { map: "bark", tint: "#9d9287", bump: 3 });
defineMaterial("Volcanic_LogBark", { map: "bark", tint: "#6e5139", bump: 3 });
defineMaterial("Volcanic_Heartwood", { map: "wood", tint: "#d6b486", bump: 1 });
defineMaterial("Volcanic_Moss", { map: "felt", tint: "#5f9139", rough: 1 });
defineMaterial("Volcanic_MossDark", { map: "felt", tint: "#43702b", rough: 1 });
defineMaterial("Volcanic_Grass", { map: "felt", tint: "#6f9c3c", rough: 1 });
defineMaterial("Volcanic_Granite", { map: "stone", tint: "#a3a397", bump: 2.5 });
defineMaterial("Volcanic_GraniteDark", { map: "stone", tint: "#7f8176", bump: 2.5 });
defineMaterial("Volcanic_Boulder", { map: "crag", tint: "#a7a497", bump: 4 }); // natural grey rock
defineMaterial("Volcanic_BoulderDark", { map: "crag", tint: "#7f7e73", bump: 4 });
defineMaterial("Volcanic_Carved", { map: "plaster", tint: "#a9a89c", bump: 1.4, rough: 0.95 }); // worn carved stone
defineMaterial("Volcanic_Petal", { tint: "#ffd2e0", rough: 0.85 });
defineMaterial("Volcanic_PetalDeep", { tint: "#f59cbb", rough: 0.85 });
defineMaterial("Volcanic_Susuki", { map: "felt", tint: "#a9a75e", rough: 0.95 });
defineMaterial("Volcanic_Plume", { map: "fabric", tint: "#f1e7cc", rough: 1 });
defineMaterial("Volcanic_Obsidian", { tint: "#1d1a22", rough: 0.12, metal: 0.35 });
defineMaterial("Volcanic_OldWood", { map: "wood", tint: "#8e8170", bump: 1.6 }); // weathered, unpainted
defineMaterial("Volcanic_OldWoodDark", { map: "wood", tint: "#5c4f42", bump: 1.6 });
defineMaterial("Volcanic_Vermilion", { map: "plaster", tint: "#b9533f", rough: 0.8, bump: 0.8 }); // faded lacquer
defineMaterial("Volcanic_Hiwada", { map: "thatch", tint: "#715843", bump: 2 }); // cypress-bark roofing
defineMaterial("Volcanic_PaperOld", { map: "paper", tint: "#d9cfb3", rough: 0.95 });
defineMaterial("Volcanic_Fungus", { map: "plaster", tint: "#dcb97f", rough: 0.9 });
defineMaterial("Volcanic_Earth", { map: "plaster", tint: "#5f4b37", rough: 1, bump: 1.6 });

// ---- small helpers ----
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => mul(a, 1 / (len(a) || 1));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const UP: V3 = [0, 0, 1];
const DEG = Math.PI / 180;
// a box between two corners given in any order
const bb = (a: V3, b: V3, mat: string, bevel = 0): Geo =>
  boxBounds([Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])], [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])], mat, bevel);
const ellipsoid = (r: V3, c: V3, mat: string, segs = 10): Geo => translate(scale(sphereCenter(1, [0, 0, 0], mat, segs), r), c);
// a hexagonal prism (corners on +X), `r` to its corners
const hex = (r: number, h: number, at: V3, mat: string, rTop = r): Geo => cylinderAt({ rBot: r, rTop, height: h, segments: 6, bottom: at }, mat);
// a pointed spike
const spike = (r: number, h: number, at: V3, mat: string, segs = 5): Geo => cylinderAt({ rBot: r, rTop: 0.4, height: h, segments: segs, bottom: at }, mat);
// a flat ellipse rx x ry, h thick, from z
const oval = (rx: number, ry: number, h: number, at: V3, mat: string, segs = 20): Geo =>
  translate(scale(cylinderAt({ radius: 1, height: h, segments: segs, bottom: [0, 0, 0] }, mat), [rx, ry, 1]), at);
// steam: a soft round cloud
const puff = (c: V3, r: number, mat = "Volcanic_Steam"): Geo => ellipsoid([r, r * 0.92, r * 0.78], c, mat, 10);

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// A tube through points, tapering from r0 to r1 (ropes, roots, branches); `joints` rounds the bends.
function chain(pts: V3[], r0: number, r1: number, mat: string, segs = 8, joints = false): Geo {
  const out: Geo[] = [];
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const ra = lerp(r0, r1, i / n), rb = lerp(r0, r1, (i + 1) / n);
    out.push(cylinderBetween(pts[i], pts[i + 1], ra, segs, mat, rb));
    if (joints && i > 0) out.push(sphereCenter(ra, pts[i], mat, segs));
  }
  return merge(...out);
}

// The highest point of a Geo straight above/below (x, y), or null when the line misses it:
// to set moss, ropes and crystals on a rock's own surface.
function heightOn(g: Geo, x: number, y: number): number | null {
  let best: number | null = null;
  for (const p of g) {
    const a = p.geo.getAttribute("position"), idx = p.geo.index;
    const n = idx ? idx.count : a.count;
    const v = (k: number) => (idx ? idx.getX(k) : k);
    for (let i = 0; i + 2 < n; i += 3) {
      const i0 = v(i), i1 = v(i + 1), i2 = v(i + 2);
      const ax = a.getX(i0), ay = a.getY(i0), bx = a.getX(i1), by = a.getY(i1), cx = a.getX(i2), cy = a.getY(i2);
      const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
      if (Math.abs(d) < 1e-9) continue;
      const l1 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / d;
      const l2 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / d;
      const l3 = 1 - l1 - l2;
      if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
      const z = l1 * a.getZ(i0) + l2 * a.getZ(i1) + l3 * a.getZ(i2);
      if (best === null || z > best) best = z;
    }
  }
  return best;
}
// How far out from (cx, cy) along `angle` a shape still reaches height z (its outline at z).
function reachAt(g: Geo, cx: number, cy: number, angle: number, z: number, max: number): number {
  let lo = 0, hi = max;
  for (let k = 0; k < 14; k++) {
    const m = (lo + hi) / 2, h = heightOn(g, cx + Math.cos(angle) * m, cy + Math.sin(angle) * m);
    if (h !== null && h >= z) lo = m;
    else hi = m;
  }
  return lo;
}

// ---- free-form surfaces (as in the Osaki kit) ----
type Hint = V3 | ((c: V3) => V3);
function surface(P: V3[][], UV: [number, number][][], mat: string, hint: Hint): Geo {
  const rows = P.length, cols = P[0].length;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) {
      pos.push(...P[i][j]);
      uv.push(...UV[i][j]);
    }
  for (let i = 0; i < rows - 1; i++)
    for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
      for (const [p, q, r] of [[a, b, d], [a, d, c]]) {
        const A: V3 = [pos[p * 3], pos[p * 3 + 1], pos[p * 3 + 2]], B: V3 = [pos[q * 3], pos[q * 3 + 1], pos[q * 3 + 2]], C: V3 = [pos[r * 3], pos[r * 3 + 1], pos[r * 3 + 2]];
        const nn = cross(sub(B, A), sub(C, A));
        const h = typeof hint === "function" ? hint(mul(add(add(A, B), C), 1 / 3)) : hint;
        if (dot(nn, h) >= 0) idx.push(p, q, r);
        else idx.push(p, r, q);
      }
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const flat = geo.toNonIndexed();
  flat.computeVertexNormals();
  return [{ geo: flat, mat }];
}
// A flat polygon fanned from `c`, facing along `hint` (both ways when `both`).
function fan(c: V3, ring: V3[], mat: string, hint: V3, both = false): Geo {
  const pos: number[] = [], uv: number[] = [];
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const B = ring[i], C = ring[(i + 1) % n];
    const nn = cross(sub(B, c), sub(C, c));
    if (len(nn) < 1e-6) continue;
    const tris = dot(nn, hint) >= 0 ? [[c, B, C]] : [[c, C, B]];
    if (both) tris.push([tris[0][0], tris[0][2], tris[0][1]]);
    for (const t of tris)
      for (const p of t) {
        pos.push(...p);
        uv.push((p[0] + p[1]) / 100, p[2] / 100);
      }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return [{ geo, mat }];
}
// A rectangular section (w across, h up) swept along a path: curved beams.
function sweep(path: V3[], w: number, h: number, mat: string): Geo {
  const n = path.length;
  const T = path.map((_, i) => norm(sub(path[Math.min(n - 1, i + 1)], path[Math.max(0, i - 1)])));
  const S = T.map((t) => {
    let s = cross(t, UP);
    if (len(s) < 1e-4) s = cross(t, [0, 1, 0]);
    return norm(s);
  });
  const N = T.map((t, i) => cross(S[i], t));
  const L: number[] = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1] + len(sub(path[i], path[i - 1])));
  const C = (i: number, a: number, b: number): V3 => add(path[i], add(mul(S[i], (a * w) / 2), mul(N[i], (b * h) / 2)));
  const out: Geo[] = [];
  for (const [a0, b0, a1, b1, span] of [[-1, -1, 1, -1, w], [1, -1, 1, 1, h], [1, 1, -1, 1, w], [-1, 1, -1, -1, h]]) {
    const P = path.map((_, i): V3[] => [C(i, a0, b0), C(i, a1, b1)]);
    const UV = L.map((l): [number, number][] => [[l / 100, 0], [l / 100, span / 100]]);
    const mid = (a0 + a1) / 2, midB = (b0 + b1) / 2;
    out.push(surface(P, UV, mat, (c) => {
      let best = 0, bd = Infinity;
      path.forEach((p, i) => {
        const d = len(sub(c, p));
        if (d < bd) [best, bd] = [i, d];
      });
      return add(mul(S[best], mid), mul(N[best], midB));
    }));
  }
  for (const [i, s] of [[0, -1], [n - 1, 1]]) out.push(fan(path[i], [C(i, -1, -1), C(i, 1, -1), C(i, 1, 1), C(i, -1, 1)], mat, mul(T[i], s)));
  return merge(...out);
}
// A solid of revolution about +Z from a (radius, height) profile.
function lathe(prof: [number, number][], segs: number, mat: string, at: V3 = [0, 0, 0]): Geo {
  const geo = new THREE.LatheGeometry(prof.map(([r, z]) => new THREE.Vector2(r, z)), segs);
  geo.rotateX(Math.PI / 2);
  const rmax = Math.max(...prof.map((p) => p[0]));
  let plen = 0;
  for (let i = 1; i < prof.length; i++) plen += Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]);
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * Math.PI * 2 * rmax) / 100, (uv.getY(i) * plen) / 100);
  geo.translate(...at);
  return [{ geo: geo.toNonIndexed(), mat }];
}
// a bunch of grass blades from `at`
function tuft(at: V3, seed: number, n: number, h: number, mat = "Volcanic_Grass"): Geo {
  const rnd = seeded(seed), out: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, l = h * (0.6 + rnd() * 0.5), t0 = 8 + rnd() * 18, t1 = 30 + rnd() * 40;
    let p: V3 = [at[0] + Math.cos(a) * 4, at[1] + Math.sin(a) * 4, at[2]];
    for (let k = 0; k < 3; k++) {
      const th = (t0 + (t1 * k) / 2) * DEG;
      const q: V3 = [p[0] + Math.cos(a) * Math.sin(th) * (l / 3), p[1] + Math.sin(a) * Math.sin(th) * (l / 3), p[2] + Math.cos(th) * (l / 3)];
      out.push(beamBetween(p, q, 4.5 - k, 1.4, mat));
      p = q;
    }
  }
  return merge(...out);
}
// moss cushions scattered over the top of a shape (each a few lumps on its own surface)
function mossOn(g: Geo, at: [number, number][], seed: number, size = 40, mat = "Volcanic_Moss"): Geo {
  const rnd = seeded(seed), out: Geo[] = [];
  for (const [x0, y0] of at) {
    const s0 = size * (0.6 + rnd() * 0.6), m = rnd() < 0.4 ? "Volcanic_MossDark" : mat;
    for (let k = 0; k < 4; k++) {
      const a = rnd() * Math.PI * 2, d = k ? s0 * (0.35 + rnd() * 0.3) : 0, x = x0 + Math.cos(a) * d, y = y0 + Math.sin(a) * d;
      const z = heightOn(g, x, y);
      if (z === null) continue;
      const s = s0 * (k ? 0.45 + rnd() * 0.2 : 0.62), rz = 4 + s * 0.3;
      out.push(ellipsoid([s, s * (0.7 + rnd() * 0.3), rz], [x, y, z - rz * 0.35], m, 7));
    }
  }
  return merge(...out);
}
// a shide: the zigzag paper streamer hanging from a sacred rope (its paper thin along X)
function shide(top: V3, alongX = false): Geo {
  const out: Geo[] = [];
  for (let k = 0; k < 4; k++) {
    const o = k % 2 ? 4 : -4;
    out.push(boxAt(alongX ? [10, 1.2, 11] : [1.2, 10, 11], [top[0] + (alongX ? o : 0), top[1] + (alongX ? 0 : o), top[2] - 13 - k * 11], "FabricWhite"));
  }
  return merge(...out);
}
// a sagging rope from a to b (`sag` cm at the middle)
function sagRope(a: V3, b: V3, sag: number, r: number, n = 10, mat = "RopeTan"): { geo: Geo; pts: V3[] } {
  const pts = Array.from({ length: n + 1 }, (_, i): V3 => {
    const t = i / n;
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t) - sag * 4 * t * (1 - t)];
  });
  const fat = (t: number) => r * (0.65 + 0.35 * Math.sin(Math.PI * t));
  const out: Geo[] = [];
  for (let i = 0; i < n; i++) out.push(cylinderBetween(pts[i], pts[i + 1], fat(i / n), 8, mat, fat((i + 1) / n)));
  return { geo: merge(...out), pts };
}
// a vermilion torii's curved top beam: y from -half to half, rising `rise` at its ends
const curveY = (half: number, z: number, rise: number, k = 13): V3[] =>
  Array.from({ length: k }, (_, i) => {
    const y = -half + (2 * half * i) / (k - 1);
    return [0, y, z + rise * Math.pow(Math.abs(y) / half, 2.4)];
  });

// ---- the hills: the abandoned shrine and what lies around it ----

// The abandoned shrine (honden) on its stone base: weathered timber, a bark roof with a hole
// in it and moss, chigi and katsuogi on the ridge, a lattice door gone, the rope frayed.
function shrineRuin(): Geo {
  const P: Geo[] = [];
  const W = "Volcanic_OldWood", D = "Volcanic_OldWoodDark", G = "Volcanic_Granite";
  const bx = 180, by = 260, zB = 26, zF = 105, zW = 340;
  // the stone base and its steps
  P.push(bb([-335, -400, 0], [300, 400, zB], G, 3), bb([-380, -150, 0], [-330, 150, 13], G, 2));
  P.push(bb([-300, -400, zB - 4], [300, -380, zB + 1], "Volcanic_GraniteDark"));
  // the stone water basin (chozubachi) at the corner, green water
  P.push(bb([-410, -380, 0], [-330, -270, 48], "Volcanic_GraniteDark", 4), bb([-400, -368, 40], [-340, -282, 49], "Volcanic_SpringBed"));
  // posts under the floor
  for (const x of [-250, -bx, 0, bx]) for (const y of [-by, -87, 87, by]) P.push(cylinderAt({ radius: 9, height: zF - 10 - zB, segments: 8, bottom: [x, y, zB] }, D));
  // the floor and the veranda in front; two planks gone
  P.push(bb([-255, -285, zF - 12], [bx + 12, 285, zF], W, 1.5));
  for (const [y0, y1] of [[-150, -122], [60, 84]] as const) P.push(bb([-254, y0, zF - 11], [-188, y1, zF + 0.6], "WoodDark"));
  // side rails, one end broken off and hanging
  for (const s of [-1, 1]) {
    for (const x of [-250, -110, 40, bx]) P.push(boxAt([9, 9, 55], [x, s * 280, zF], D, 1));
    if (s < 0) P.push(bb([-254, -284, zF + 46], [bx + 4, -276, zF + 54], D));
    else {
      P.push(bb([-110, 276, zF + 46], [bx + 4, 284, zF + 54], D));
      P.push(beamBetween([-110, 280, zF + 50], [-246, 286, zF + 6], 8, 8, D));
    }
  }
  // the hall: a dark core, pillars, plank walls, lattice doors in front
  P.push(bb([-bx + 8, -by + 8, zF], [bx - 8, by - 8, zW - 6], "WoodDark"));
  for (const x of [-bx, bx]) for (const y of [-by, -87, 87, by]) P.push(boxAt([22, 22, zW - zF], [x, y, zF], W, 2));
  for (const y of [-by, by]) P.push(boxAt([22, 22, zW - zF], [0, y, zF], W, 2));
  const planks = (x0: number, y0: number, x1: number, y1: number) => {
    const along = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    const n = 9;
    for (let k = 0; k < n; k++) {
      const z0 = zF + 4 + ((zW - zF - 30) * k) / n, z1 = z0 + (zW - zF - 30) / n - 1.5;
      P.push(along ? bb([x0 - 4, y0, z0], [x0 + 4, y1, z1], k % 3 === 2 ? D : W) : bb([x0, y0 - 4, z0], [x1, y0 + 4, z1], k % 3 === 2 ? D : W));
    }
  };
  for (const s of [-1, 1]) {
    planks(-bx + 11, s * by, -11, s * by);
    planks(11, s * by, bx - 11, s * by);
  }
  for (const [y0, y1] of [[-by + 11, -98], [-76, 76], [98, by - 11]] as const) planks(bx, y0, bx, y1);
  planks(-bx, -by + 11, -bx, -98);
  // lattice doors: the middle bay has lost one leaf, the right bay's door leans on the wall
  const lattice = (x: number, y0: number, y1: number, z0: number, z1: number): Geo => {
    const g: Geo[] = [bb([x - 1, y0, z0], [x + 3, y1, z1], "Volcanic_PaperOld")];
    for (let y = y0 + 9; y < y1 - 3; y += 17) g.push(bb([x - 4, y - 2, z0], [x - 1, y + 2, z1], D));
    for (let z = z0 + 12; z < z1 - 3; z += 17) g.push(bb([x - 4, y0, z - 2], [x - 1, y1, z + 2], D));
    g.push(bb([x - 5, y0, z0], [x + 3, y0 + 5, z1], D), bb([x - 5, y1 - 5, z0], [x + 3, y1, z1], D), bb([x - 5, y0, z1 - 5], [x + 3, y1, z1], D), bb([x - 5, y0, z0], [x + 3, y1, z0 + 6], D));
    return merge(...g);
  };
  P.push(lattice(-bx - 6, -76, 0, zF + 2, zF + 215));
  P.push(lattice(-bx - 6, 98, by - 11, zF + 2, zF + 215), bb([-bx - 8, 98, zF + 215], [-bx + 6, by - 11, zW - 24], W));
  P.push(bb([-bx - 8, -76, zF + 215], [-bx + 6, 76, zW - 24], W));
  // the fallen leaf of the middle door, leaning against the veranda edge
  P.push(rotateY(lattice(0, 0, 76, 0, 213), 27, [0, 0, 0]).map((p) => ({ geo: p.geo.clone().translate(-302, -66, zB), mat: p.mat })));
  // the head beams
  for (const s of [-1, 1]) {
    P.push(bb([-bx - 14, s * by - 14, zW - 26], [bx + 14, s * by + 14, zW], D));
    P.push(bb([s * bx - 14, -by - 14, zW - 26], [s * bx + 14, by + 14, zW], D));
  }
  P.push(bb([-bx - 16, -by, zF + 212], [-bx + 4, by, zF + 226], D));
  // the roof: ridge along Y (built along X, then turned), cypress bark; the back slope has a
  // hole with its rafters showing, moss near the eaves
  const R: Geo[] = [];
  const half = bx, over = 95, roofH = 165, th = 14, L = 2 * by + 2 * 80, base = zW + 14;
  const ang = Math.atan2(roofH, half), slope = (half + over) / Math.cos(ang);
  const slabPart = (x0: number, x1: number, side: 1 | -1, s0: number, s1: number, mat = "Volcanic_Hiwada"): Geo =>
    rotateX(box([x1 - x0, s1 - s0, th], [(x0 + x1) / 2, (side * (s0 + s1)) / 2, th / 2], mat), (-side * ang) / DEG);
  R.push(slabPart(-L / 2, L / 2, 1, 0, slope));
  const hx0 = 30, hx1 = 190, hs0 = slope * 0.32, hs1 = slope * 0.62;
  R.push(slabPart(-L / 2, hx0, -1, 0, slope), slabPart(hx1, L / 2, -1, 0, slope));
  R.push(slabPart(hx0, hx1, -1, 0, hs0), slabPart(hx0, hx1, -1, hs1, slope));
  // rafters across the hole, and the edge of the bark ragged
  for (const x of [55, 110, 165]) R.push(rotateX(box([9, hs1 - hs0 + 30, 10], [x, (-(hs0 + hs1)) / 2, -4], D), ang / DEG));
  for (const [x, s] of [[70, hs0], [140, hs1], [175, hs0]] as const) R.push(rotateX(box([34, 16, th * 0.6], [x, -s, th * 0.3], "Volcanic_Hiwada"), ang / DEG + 12));
  // the underside of the eaves, darker
  for (const side of [1, -1] as const) R.push(rotateX(box([L - 4, slope - 4, 3], [0, (side * slope) / 2, -1.5], D), (-side * ang) / DEG));
  // moss patches on the slopes
  const rnd = seeded(5);
  for (let k = 0; k < 22; k++) {
    const side = k % 2 ? 1 : -1, x = -L / 2 + 40 + rnd() * (L - 80), s = slope * (0.6 + rnd() * 0.38);
    if (side < 0 && x > hx0 - 30 && x < hx1 + 30) continue;
    R.push(rotateX(rotateZ(ellipsoid([14 + rnd() * 18, 10 + rnd() * 10, 4], [0, 0, 0], rnd() < 0.5 ? "Volcanic_MossDark" : "Volcanic_Moss", 6), rnd() * 180).map((p) => ({ geo: p.geo.clone().translate(x, side * s, th), mat: p.mat })), (-side * ang) / DEG));
  }
  // ridge cap, katsuogi logs across it, chigi crossed at the ends, bargeboards
  R.push(box([L + 10, 34, 24], [0, 0, 4], D, 3), box([L + 14, 24, 10], [0, 0, 20], "Volcanic_Hiwada", 2));
  for (const x of [-180, -60, 60, 180]) R.push(cylinderBetween([x, -40, 34], [x, 40, 34], 12, 10, W));
  for (const sx of [-1, 1]) {
    const x = sx * (L / 2 + 4);
    for (const s of [-1, 1]) {
      R.push(beamBetween([x, s * (half + over) * Math.cos(ang) * 0.98, -(half + over) * Math.sin(ang) + 6], [x, -s * 42, 80], 10, 22, W));
    }
  }
  P.push(translate(rotateZ(translate(merge(...R), [0, 0, roofH]), 90), [0, 0, base]));
  // the gable ends (tympanum) under the roof
  for (const s of [-1, 1]) P.push(rotateZ(gableWall(s * by, half, base - 4, roofH - 6, W), 90));
  // the wooden steps up to the veranda, the middle one cracked
  for (let k = 0; k < 3; k++) {
    const x1 = -255 - k * 27, x0 = x1 - 27, z = zF - 26 * (k + 1) + 26;
    if (k === 1) P.push(bb([x0, -90, z - 8], [x1, -10, z], W), rotateY(bb([x0, 10, z - 8], [x1, 90, z], W), 10, [x1, 50, z]));
    else P.push(bb([x0, -90, z - 8], [x1, 90, z], W));
    for (const s of [-1, 1]) P.push(bb([x0, s * 90 - 5, zB], [x1, s * 90 + 5, z], D));
  }
  // the offering box and the old bell with its faded rope
  P.push(boxAt([50, 120, 44], [-215, 0, zF], D, 2));
  for (let k = 0; k < 5; k++) P.push(boxAt([52, 7, 4], [-215, -44 + k * 22, zF + 44], W));
  P.push(sphereCenter(13, [-230, 0, 282], "Bronze", 10), cylinderBetween([-230, 0, 296], [-230, 0, zW - 26], 2, 5, "IronDark"));
  P.push(chain([[-230, 0, 268], [-232, 3, 220], [-229, -2, 170], [-234, 4, 140]], 3.2, 2.4, "Volcanic_PaperOld", 6));
  // the frayed sacred rope: hangs across from the left, its right end fallen
  const rope = sagRope([-bx - 22, -110, zF + 205], [-bx - 22, 30, zF + 195], 22, 8, 7);
  P.push(rope.geo, chain([[-bx - 22, 30, zF + 195], [-bx - 26, 44, zF + 150], [-bx - 30, 50, zF + 95]], 6, 4, "RopeTan", 8));
  for (const i of [2, 4]) P.push(shide(rope.pts[i]));
  // moss and grass where the base meets the ground, fallen bark shingles
  for (const [x, y] of [[-330, -395], [295, -395], [295, 395], [-330, 395], [-300, 200]] as const) P.push(ellipsoid([60, 44, 14], [x, y, zB - 4], "Volcanic_Moss", 8));
  for (const [x, y, s] of [[-345, 360, 3], [-350, -250, 11], [310, 0, 19], [310, 300, 23], [-120, -410, 29], [120, 410, 31]] as const) P.push(tuft([x, y, 0], s, 9, 60));
  for (const [x, y, a] of [[-300, 300, 20], [-310, 330, -35], [-280, -230, 60]] as const) P.push(rotateZ(boxAt([40, 18, 3], [x, y, zB], "Volcanic_Hiwada"), a, [x, y, zB]));
  return translate(merge(...P), [40, 0, 0]);
}

// An old torii, its vermilion faded and peeling, moss on the top beam, a rope with paper
// streamers under the tie beam. Spans Y (the posts at y = +-245); walk through along X.
function toriiOld(): Geo {
  const R = "Volcanic_Vermilion", B = "LacquerBlack", W = "Volcanic_OldWood";
  const py = 245, H = 460, P: Geo[] = [];
  for (const sy of [-1, 1]) {
    const y = sy * py;
    P.push(boxAt([82, 82, 18], [0, y, 0], "Volcanic_Granite", 4), ellipsoid([34, 26, 6], [24, y + 18, 16], "Volcanic_Moss", 8));
    P.push(cylinderAt({ radius: 27, height: 62, segments: 14, bottom: [0, y, 18] }, B));
    P.push(cylinderAt({ rBot: 24, rTop: 20, height: H - 18, segments: 14, bottom: [0, y, 18] }, R));
    P.push(cylinderAt({ radius: 23, height: 12, segments: 14, bottom: [0, y, H - 12] }, B));
    // bare wood where the paint has gone
    for (const [z, a, h] of [[130, 200, 40], [250, 160, 26], [330, 230, 34], [190, 20, 22]] as const) {
      const c = Math.cos(a * DEG), s = Math.sin(a * DEG), r = 22.2 - (z / H) * 3.4;
      P.push(rotateZ(boxAt([3, 13, h], [0, 0, z], W), a, [0, 0, 0]).map((p) => ({ geo: p.geo.clone().translate(c * r, y + s * r, 0), mat: p.mat })));
    }
    P.push(tuft([30, y - 30, 0], 7 + sy, 8, 55), tuft([-34, y + 26, 0], 9 + sy, 7, 45));
  }
  P.push(boxAt([26, 2 * py + 150, 28], [0, 0, H - 125], R, 2));
  P.push(sweep(curveY(py + 110, H + 12, 12), 36, 26, R));
  P.push(sweep(curveY(py + 150, H + 38, 26), 46, 22, B));
  P.push(boxAt([22, 26, 75], [0, 0, H - 97], R), boxAt([8, 52, 62], [-15, 0, H - 92], "Volcanic_OldWoodDark", 2));
  // moss along the kasagi
  for (const y of [-260, -120, 40, 210]) P.push(ellipsoid([22, 40, 5], [0, y, H + 64 + 26 * Math.pow(Math.abs(y) / (py + 150), 2.4)], "Volcanic_Moss", 8));
  // the rope and its streamers
  const rope = sagRope([-18, -py + 30, H - 140], [-18, py - 30, H - 140], 34, 8, 10);
  P.push(rope.geo);
  for (const i of [2, 4, 6, 8]) P.push(shide(rope.pts[i]));
  return merge(...P);
}

// A torii that has come down: one post standing with a stub of the tie beam, the other broken
// off, the top beam lying slant from the standing post to the grass.
function toriiFallen(): Geo {
  const R = "Volcanic_Vermilion", B = "LacquerBlack", W = "Volcanic_OldWood";
  const py = 245, H = 460, P: Geo[] = [];
  for (const sy of [-1, 1]) {
    const y = sy * py;
    P.push(boxAt([82, 82, 18], [0, y, 0], "Volcanic_Granite", 4));
    P.push(cylinderAt({ radius: 27, height: 62, segments: 14, bottom: [0, y, 18] }, B));
  }
  // the standing post, its tie-beam stub
  P.push(cylinderAt({ rBot: 24, rTop: 20, height: H - 18, segments: 14, bottom: [0, -py, 18] }, R), cylinderAt({ radius: 23, height: 12, segments: 14, bottom: [0, -py, H - 12] }, B));
  P.push(bb([-13, -py - 75, H - 125], [13, -py + 95, H - 97], R, 2));
  for (const [dy, dz] of [[95, 0], [88, 10], [92, 22]] as const) P.push(spike(7, 14, [0, -py + dy, H - 125 + dz], W).map((p) => ({ geo: p.geo.clone().rotateX(-Math.PI / 2).translate(0, -py + dy, H - 112 + dz - (H - 125 + dz)), mat: p.mat })));
  // the broken post: a stump with splinters, its top lying in the grass
  P.push(cylinderAt({ rBot: 24, rTop: 22, height: 132, segments: 14, bottom: [0, py, 18] }, R));
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    P.push(spike(8, 12 + ((k * 7) % 5) * 7, [Math.cos(a) * 13, py + Math.sin(a) * 13, 148], W));
  }
  P.push(cylinderAt({ radius: 15, height: 6, segments: 10, bottom: [0, py, 146] }, W));
  P.push(cylinderBetween([-70, py + 60, 22], [-370, py + 120, 21], 22, 14, R, 20), cylinderBetween([-62, py + 58, 22], [-70, py + 60, 22], 20, 14, W));
  // the top beams fallen slant: one end over the standing post, the other in the grass
  const top: V3 = [6, -py - 70, H + 6], foot: V3 = [-150, py + 30, 14];
  P.push(beamBetween(add(top, [0, 0, 30]), add(foot, [0, 0, 26]), 46, 22, B), beamBetween(top, foot, 36, 26, R));
  // the plaque face up in the grass, the rope rotted on the ground
  P.push(rotateZ(boxAt([62, 52, 8], [-230, -60, 0], "Volcanic_OldWoodDark", 2), 25, [-230, -60, 0]));
  P.push(chain([[-120, -200, 4], [-160, -120, 5], [-150, -20, 4], [-190, 60, 5]], 7, 6, "RopeTan", 8));
  for (const [x, y, s] of [[-40, -py - 40, 3], [40, py + 40, 5], [-200, 200, 7], [-300, -100, 13], [-150, py + 120, 17]] as const) P.push(tuft([x, y, 0], s, 9, 60));
  P.push(ellipsoid([50, 34, 6], [-200, py + 80, 2], "Volcanic_Moss", 8));
  return translate(merge(...P), [90, 0, 0]);
}

// Stone steps for a ramp: 9 m long rising 3 m (1 in 3), 4.2 m wide, centred on the ramp's
// middle (z = 0 there; the foot at -X is 150 below, the top at +X 150 above). Put it at the
// ramp's midpoint, its -X end toward the foot. Mossy kerbs either side, petals on the treads.
function stoneStairs(): Geo {
  const P: Geo[] = [], rnd = seeded(13);
  const run = 900, rise = 300, n = 20, W = 210, k = rise / run, tr = run / n;
  const zAt = (x: number) => x * k;
  for (let i = 0; i < n; i++) {
    const x0 = -run / 2 + i * tr, x1 = x0 + tr, top = zAt(x1) + 2 + (rnd() - 0.5) * 2;
    const split = (rnd() - 0.5) * 220;
    P.push(bb([x0, -W + 28, zAt(x0) - 40], [x1 + 6, split - 1, top], rnd() < 0.3 ? "Volcanic_GraniteDark" : "Volcanic_Granite", 2));
    P.push(bb([x0, split + 1, zAt(x0) - 40], [x1 + 6, W - 28, top - (rnd() < 0.3 ? 2 : 0)], rnd() < 0.3 ? "Volcanic_GraniteDark" : "Volcanic_Granite", 2));
    if (rnd() < 0.35) P.push(ellipsoid([12, 26 + rnd() * 20, 2.5], [x1 - 8, (rnd() - 0.5) * 300, top], "Volcanic_Moss", 6));
    for (let p = 0; p < 3; p++) if (rnd() < 0.5) P.push(rotateZ(boxAt([12, 8, 1], [x0 + rnd() * tr, (rnd() - 0.5) * 340, top], rnd() < 0.3 ? "Volcanic_PetalDeep" : "Volcanic_Petal"), rnd() * 180, [x0 + tr / 2, 0, top]));
  }
  // kerbs: long stones stepping up either side
  for (const s of [-1, 1])
    for (let j = 0; j < 5; j++) {
      const xa = -run / 2 + (j * run) / 5, xb = xa + run / 5;
      P.push(bb([xa, s * W - 30, zAt(xa) - 40], [xb, s * W, zAt(xb) + 26], "Volcanic_GraniteDark", 3));
      P.push(ellipsoid([60, 18, 5], [xa + 90, s * (W - 15), zAt(xb) + 25], "Volcanic_Moss", 6));
    }
  return merge(...P);
}

// Three jizo on a stone ledge by the track, red bibs and caps, a pinwheel, offerings.
function jizoGroup(): Geo {
  const P: Geo[] = [], G = "Volcanic_Carved";
  P.push(bb([-38, -100, 0], [38, 100, 16], "Volcanic_GraniteDark", 3), ellipsoid([30, 40, 6], [20, 80, 14], "Volcanic_Moss", 8));
  for (const [y, h] of [[-58, 64], [0, 76], [58, 58]] as const) {
    const at: V3 = [0, y, 16];
    P.push(lathe([[0, 0], [19, 0], [21, 6], [20, h * 0.35], [17, h * 0.6], [11, h * 0.68], [0, h * 0.7]], 10, G, at));
    const hr = 11 + h * 0.03;
    const hz = 16 + h * 0.7 + hr * 0.8;
    P.push(sphereCenter(hr, [0, y, hz], G, 10));
    P.push(ellipsoid([hr * 1.02, hr * 1.02, hr * 0.62], [0, y, hz + hr * 0.42], "FabricRed", 10));
    for (const s of [-1, 1]) P.push(boxAt([1.2, 4.5, 1.2], [-hr + 0.8, y + s * 4.5, hz - 1], "LacquerBlack"));
    P.push(cylinderAt({ rBot: 21.5, rTop: 13, height: h * 0.13, segments: 10, bottom: [0, y, 16 + h * 0.56] }, "FabricRed"));
    P.push(rotateY(boxAt([2.5, 28, 22], [0, 0, -22], "FabricRed"), -14).map((q) => ({ geo: q.geo.clone().translate(-19, y, 16 + h * 0.62), mat: q.mat })));
    P.push(ellipsoid([7, 9, 8], [-18, y, 16 + h * 0.42], G, 6));
    P.push(cylinderAt({ radius: 5, height: 7, segments: 8, bottom: [-30, y + 14, 16] }, "Volcanic_GraniteDark"));
  }
  // a pinwheel on a stick and a little offering of oranges
  P.push(cylinderBetween([-26, 88, 16], [-26, 88, 110], 1.2, 5, "BambooDry"));
  for (let k = 0; k < 4; k++) P.push(rotateX(boxAt([1.5, 20, 12], [-29, 98, 104], k % 2 ? "FabricRed" : "FabricGold"), k * 90, [-29, 88, 110]));
  for (const [y, z] of [[-26, 21], [-18, 21], [-22, 27]] as const) P.push(sphereCenter(5, [-26, y, z], "FabricGold", 8));
  P.push(tuft([30, -95, 0], 41, 8, 50), tuft([-30, 104, 0], 43, 7, 45));
  return merge(...P);
}

// A stone lion-dog guarding a shrine (komainu), worn smooth and mossy; pairs face each other.
function komainu(): Geo {
  const S = "Volcanic_Carved", M = "Volcanic_Moss";
  return merge(
    boxAt([66, 66, 16], [0, 0, 0], "Volcanic_GraniteDark", 3),
    boxAt([52, 52, 58], [0, 0, 16], S, 3),
    boxAt([62, 62, 10], [0, 0, 74], "Volcanic_GraniteDark", 3),
    ellipsoid([22, 18, 16], [8, 0, 96], S, 8),
    ellipsoid([16, 15, 22], [-6, 0, 112], S, 8),
    boxAt([9, 9, 30], [-14, -9, 84], S, 2),
    boxAt([9, 9, 30], [-14, 9, 84], S, 2),
    ellipsoid([15, 16, 15], [-12, 3, 138], S, 8),
    ellipsoid([10, 13, 8], [-22, 3, 134], S, 8),
    ellipsoid([16, 17, 6], [-10, 4, 150], M, 8),
    ellipsoid([9, 9, 12], [24, 0, 112], S, 6),
    ellipsoid([24, 20, 5], [12, -8, 84], M, 8),
    ellipsoid([28, 22, 6], [10, 14, 15], M, 8),
    tuft([28, -28, 0], 47, 8, 40),
  );
}

// A stone lantern knocked over: the base still standing, the post, fire box and cap in the grass.
function lanternToppled(): Geo {
  const S = "Volcanic_Carved", M = "Volcanic_Moss", D = "Volcanic_GraniteDark";
  const hexZ = (rBot: number, rTop: number, h: number, z: number, mat: string) => rotateZ(cylinderAt({ rBot, rTop, height: h, segments: 6, bottom: [0, 0, z] }, mat), 30);
  const P: Geo[] = [hexZ(50, 46, 18, 0, D), hexZ(42, 24, 16, 18, S), cylinderAt({ radius: 14, height: 30, segments: 10, bottom: [0, 0, 34] }, S)];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    P.push(spike(6, 6 + k * 3, [Math.cos(a) * 8, Math.sin(a) * 8, 62], S));
  }
  // the post lying in the grass
  P.push(cylinderBetween([-40, 50, 14], [-120, 110, 14], 14, 10, S), cylinderBetween([-120, 110, 14], [-124, 113, 14], 17, 10, S));
  // the fire box on its side
  const box6: Geo = merge(hexZ(31, 31, 7, 0, S), hexZ(21, 21, 48, 0, "Volcanic_GraniteDark"), hexZ(31, 31, 7, 42, S), hexZ(40, 40, 8, -8, S));
  P.push(translate(rotateY(box6, 90), [-170, -30, 34]));
  // the cap, tilted on the ground, and its finial rolled off
  const cap = merge(hexZ(52, 56, 6, 0, M), hexZ(56, 13, 32, 6, S), cylinderAt({ rBot: 9, rTop: 15, height: 8, segments: 10, bottom: [0, 0, 37] }, S));
  P.push(translate(rotateY(cap, -24), [-60, -120, 18]));
  P.push(sphereCenter(13, [-190, -150, 13], S, 10));
  P.push(ellipsoid([40, 30, 7], [10, 0, 32], M, 8), tuft([-90, 40, 0], 51, 10, 60), tuft([-150, -110, 0], 53, 8, 50), tuft([40, -50, 0], 55, 7, 45));
  return translate(merge(...P), [80, 15, 0]);
}

// A great boulder bound with a sacred rope (shimenawa) and paper streamers, small stones and
// an offering stand before it: the bamboo grove's holy rock.
function sacredRock(): Geo {
  const main = merge(rock([380, 320, 300], 0.3, 17, "Volcanic_Boulder"), translate(rock([200, 170, 170], 0.4, 19, "Volcanic_Boulder"), [110, 120, 0]));
  const P: Geo[] = [main];
  P.push(mossOn(main, [[0, 0], [60, -40], [-50, 50], [90, 60], [-80, -60], [20, 90], [100, -10]], 3, 46, "Volcanic_Moss"));
  // the rope round it at 1.3 m: on its own outline there
  const zr = 130, pts: V3[] = [];
  for (let k = 0; k <= 28; k++) {
    const a = (k / 28) * Math.PI * 2, r = reachAt(main, 0, 0, a, zr, 400) + 3;
    pts.push([Math.cos(a) * r, Math.sin(a) * r, zr - 6 * Math.cos(a)]);
  }
  P.push(chain(pts, 9, 9, "RopeTan", 8, true));
  // the front (-X): streamers and the thick knot
  for (const k of [11, 12, 13, 15, 16, 17]) P.push(shide(add(pts[k], mul(norm([pts[k][0], pts[k][1], 0]), 6))));
  P.push(sphereCenter(15, add(pts[14], [-6, 0, 0]), "RopeTan", 8));
  // stones round the foot, an offering stand in front
  for (const [x, y, s, sd] of [[-150, -170, 60, 21], [150, 170, 70, 23], [170, -150, 50, 25], [-190, 110, 45, 27], [-60, 200, 55, 29]] as const) P.push(translate(rock([s, s * 0.8, s * 0.6], 0.4, sd, "Volcanic_BoulderDark"), [x, y, -2]));
  P.push(boxAt([40, 70, 50], [-230, 0, 0], "Volcanic_OldWoodDark", 2), boxAt([46, 76, 5], [-230, 0, 50], "Volcanic_OldWood", 1));
  P.push(cylinderAt({ radius: 8, height: 12, segments: 8, bottom: [-230, -18, 55] }, "FabricWhite"), cylinderAt({ radius: 7, height: 16, segments: 8, bottom: [-230, 18, 55] }, "Bronze"));
  P.push(tuft([-180, -80, 0], 61, 9, 60), tuft([120, -190, 0], 63, 8, 55), tuft([-120, 180, 0], 65, 9, 55), tuft([190, 60, 0], 67, 7, 50));
  return merge(...P);
}

// Kumazasa: a waist-high bush of dwarf bamboo: thin canes under lobes of long narrow leaves,
// their tips pale where the frost has bleached the edges.
defineMaterial("Volcanic_SasaCore", { map: "foliage", tint: "#3f6a2e", rough: 0.95, bump: 1.5 });
defineMaterial("Volcanic_SasaCardDark", { card: "lance", tint: "#477a34", rough: 0.8 });
defineMaterial("Volcanic_SasaCard", { card: "lance", tint: "#6c9e44", rough: 0.75 });
defineMaterial("Volcanic_SasaCardLight", { card: "lance", tint: "#b4d07a", rough: 0.7 });
const SASA: ShrubLook = { core: "Volcanic_SasaCore", dark: "Volcanic_SasaCardDark", mid: "Volcanic_SasaCard", light: "Volcanic_SasaCardLight" };
function sasaBush(): Geo {
  const rnd = seeded(61), stems: Geo[] = [];
  for (let i = 0; i < 16; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 50;
    const x = Math.cos(a) * d, y = Math.sin(a) * d, h = 55 + rnd() * 45;
    stems.push(cylinderBetween([x, y, 0], [x * 1.5 + (rnd() - 0.5) * 20, y * 1.5 + (rnd() - 0.5) * 20, h], 1.5, 5, i % 3 ? "Bamboo" : "BambooDry", 1));
  }
  return merge(...stems, shrub({
    seed: 63, leaf: 34, look: SASA, ragged: 0.75, core: 0.75,
    lobes: [[0, 0, 58, 72, 62, 32], [48, -38, 46, 46, 42, 26], [-44, 40, 44, 46, 40, 24], [-20, -50, 40, 36, 36, 22], [30, 34, 48, 40, 36, 24], [-42, -6, 50, 38, 36, 24]],
  }));
}

// Susuki: a fountain of silver grass with feathery plumes.
function susukiGrass(): Geo {
  const rnd = seeded(71), P: Geo[] = [];
  for (let i = 0; i < 36; i++) {
    const a = rnd() * Math.PI * 2, l = 80 + rnd() * 55, t0 = 6 + rnd() * 22, t1 = 40 + rnd() * 50;
    let p: V3 = [Math.cos(a) * 6, Math.sin(a) * 6, 0];
    for (let k = 0; k < 3; k++) {
      const th = (t0 + (t1 * k) / 2) * DEG;
      const q: V3 = [p[0] + Math.cos(a) * Math.sin(th) * (l / 3), p[1] + Math.sin(a) * Math.sin(th) * (l / 3), p[2] + Math.cos(th) * (l / 3)];
      P.push(beamBetween(p, q, 5.5 - k * 1.5, 1.4, i % 4 ? "Volcanic_Susuki" : "Volcanic_Grass"));
      p = q;
    }
  }
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2, h = 125 + rnd() * 45, lean = 8 + rnd() * 18;
    const base: V3 = [Math.cos(a) * 8, Math.sin(a) * 8, 0], tip: V3 = [Math.cos(a) * lean * 1.6, Math.sin(a) * lean * 1.6, h];
    P.push(cylinderBetween(base, tip, 1.3, 4, "Volcanic_Susuki"));
    for (let k = 0; k < 4; k++) {
      const b = a + (k - 1.5) * 0.5, c: V3 = [tip[0] + Math.cos(b) * 10, tip[1] + Math.sin(b) * 10, tip[2] - 12];
      P.push(rotateY(ellipsoid([4.5, 4.5, 20], [0, 0, 0], "Volcanic_Plume", 6), 35, [0, 0, 0]).map((p2) => ({ geo: p2.geo.clone().rotateZ(b).translate(...c), mat: p2.mat })));
    }
  }
  return merge(...P);
}

// Fallen cherry petals: soft pink drifts and scattered petals, 3.2 m across (lies flat).
function petalCarpet(): Geo {
  const rnd = seeded(81), P: Geo[] = [];
  for (let k = 0; k < 7; k++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 90, rx = 40 + rnd() * 50;
    P.push(rotateZ(oval(rx, rx * (0.5 + rnd() * 0.4), 0.8, [0, 0, 0.3], k % 3 ? "Volcanic_Petal" : "Volcanic_PetalDeep", 10), rnd() * 180).map((p) => ({ geo: p.geo.clone().translate(Math.cos(a) * d, Math.sin(a) * d, 0), mat: p.mat })));
  }
  for (let k = 0; k < 130; k++) {
    const a = rnd() * Math.PI * 2, d = 160 * Math.sqrt(rnd()), x = Math.cos(a) * d, y = Math.sin(a) * d;
    P.push(rotateZ(box([13, 9, 1], [0, 0, 1.4], rnd() < 0.3 ? "Volcanic_PetalDeep" : "Volcanic_Petal"), rnd() * 180).map((p) => ({ geo: p.geo.clone().translate(x, y, 0), mat: p.mat })));
  }
  return merge(...P);
}

// A grey granite boulder with moss on its back, two small stones at its foot.
function boulderMoss(): Geo {
  const main = rock([250, 200, 175], 0.35, 23, "Volcanic_Boulder");
  return merge(
    main,
    mossOn(main, [[0, 0], [50, 30], [-40, -20], [20, -55], [-60, 40], [70, -30]], 11, 42),
    translate(rock([80, 64, 52], 0.4, 24, "Volcanic_BoulderDark"), [-120, 90, -2]),
    translate(rock([56, 48, 40], 0.4, 25, "Volcanic_Boulder"), [110, -100, -2]),
    tuft([-100, -80, 0], 71, 9, 55), tuft([95, 95, 0], 73, 8, 50),
  );
}

// A fallen trunk, moss along its back, shelf fungus, a broken splintered end.
function fallenLog(): Geo {
  const B = "Volcanic_LogBark", P: Geo[] = [];
  const a: V3 = [-200, 0, 29], b: V3 = [195, 12, 26];
  P.push(cylinderBetween(a, b, 30, 12, B, 26));
  P.push(cylinderBetween([-202, 0, 29], [-199, 0, 29], 27, 12, "Volcanic_Heartwood"), translate(rotateY(torus(16, 1.5, 14, 4, "Volcanic_LogBark"), 90), [-203, 0, 29]));
  for (let k = 0; k < 8; k++) {
    const ang = (k / 8) * Math.PI * 2, c: V3 = [195, 12 + Math.cos(ang) * 20, 26 + Math.sin(ang) * 20];
    P.push(cylinderBetween(c, add(c, [24 + ((k * 13) % 5) * 9, Math.cos(ang) * 6, Math.sin(ang) * 6]), 7, 5, "Volcanic_Heartwood", 0.6));
  }
  P.push(smooth([[-60, 4, 50], [-36, -16, 84], [-20, -30, 110]], 8, 4, B, { seg: 6, maxRings: 3 }), smooth([[80, 8, 48], [104, 34, 68], [120, 60, 80]], 7, 3, B, { seg: 6, maxRings: 3 }), smooth([[20, -22, 30], [14, -46, 26], [10, -70, 16]], 6, 3, B, { seg: 6, maxRings: 3 }));
  for (let k = 0; k < 6; k++) P.push(ellipsoid([34, 16, 6], [-160 + k * 62, 5 + k * 2, 55 - k * 0.6], k % 2 ? "Volcanic_Moss" : "Volcanic_MossDark", 8));
  for (const [x, z, r] of [[-110, 22, 13], [-80, 34, 10], [40, 18, 12], [70, 30, 9]] as const) P.push(cylinderAt({ radius: r, height: 4, segments: 10, bottom: [x, -27, z] }, "Volcanic_Fungus"));
  P.push(tuft([-120, 50, 0], 81, 9, 55), tuft([100, -45, 0], 83, 8, 50), tuft([0, 50, 0], 85, 6, 45));
  return merge(...P);
}

// A tree stump: roots into the ground, a ragged break, moss and toadstools.
function stump(): Geo {
  const B = "Volcanic_LogBark", P: Geo[] = [cylinderAt({ rBot: 40, rTop: 34, height: 66, segments: 12, bottom: [0, 0, 0] }, B)];
  P.push(cylinderAt({ radius: 31, height: 3, segments: 12, bottom: [0, 0, 64] }, "Volcanic_Heartwood"), translate(torus(18, 1.6, 14, 4, B), [0, 0, 67.5]));
  for (let k = 0; k < 6; k++) {
    const a = (-60 + k * 22) * DEG;
    P.push(spike(8, 20 + ((k * 11) % 4) * 9, [Math.cos(a) * 28, Math.sin(a) * 28, 62], k % 2 ? B : "Volcanic_Heartwood"));
  }
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.4;
    P.push(smooth([[Math.cos(a) * 24, Math.sin(a) * 24, 32], [Math.cos(a) * 58, Math.sin(a) * 58, 10], [Math.cos(a + 0.1) * 92, Math.sin(a + 0.1) * 92, -6]], 15, 5, B, { seg: 7, maxRings: 4, gnarl: 0.5 }));
  }
  P.push(ellipsoid([30, 22, 6], [-10, 14, 66], "Volcanic_Moss", 8));
  for (const [x, y, h] of [[-48, -30, 14], [-56, -16, 10], [-44, -44, 8]] as const) P.push(cylinderAt({ radius: 2.4, height: h, segments: 6, bottom: [x, y, 0] }, "FabricWhite"), ellipsoid([7, 7, 4.5], [x, y, h], "FabricRed", 8));
  P.push(tuft([40, 50, 0], 91, 8, 50));
  return merge(...P);
}

// A wayside signpost (michishirube): a capped wooden post with a name board, two arrow boards
// along Y and a straw hat left on its peg.
function waymarker(): Geo {
  const W = "Volcanic_OldWood", D = "Volcanic_OldWoodDark", P: Geo[] = [];
  P.push(bb([-40, -40, 0], [40, 40, 18], "Volcanic_Granite", 3), boxAt([20, 20, 252], [0, 0, 18], W, 2));
  P.push(gableRoof([46, 44, 4], [0, 0, 266], 18, 6, D), boxAt([48, 6, 6], [0, 0, 283], D));
  P.push(boxAt([4, 28, 116], [-12, 0, 108], "WoodPale", 1));
  for (const [z, w, h] of [[200, 14, 5], [186, 10, 9], [170, 16, 4], [154, 8, 10], [138, 14, 5], [124, 12, 7]] as const) P.push(boxAt([1.5, w, h], [-14.5, ((z * 7) % 5) - 2, z], "LacquerBlack"));
  for (const [z, s, l] of [[238, 1, 120], [212, -1, 104]] as const) {
    P.push(boxAt([6, l, 24], [0, s * (l / 2 + 8), z], W, 1));
    P.push(translate(rotateX(box([6, 17, 17], [0, 0, 0], W), 45), [0, s * (l + 8), z + 12]));
    for (const dy of [26, 46, 66]) P.push(boxAt([1.5, 9, 6], [-3.5, s * dy, z + 9], "LacquerBlack"));
  }
  // the straw hat on its peg, a stone at the foot
  P.push(cylinderBetween([10, 0, 150], [22, 0, 150], 2, 5, D));
  P.push(translate(rotateY(cylinderAt({ rBot: 30, rTop: 3, height: 13, segments: 12, bottom: [0, 0, 0] }, "Thatch"), 72), [26, 0, 148]));
  P.push(translate(rock([40, 32, 26], 0.4, 93, "Volcanic_BoulderDark"), [-30, 50, 0]), tuft([30, -40, 0], 95, 8, 45), tuft([-34, -30, 0], 97, 6, 40));
  return merge(...P);
}

// ---- the volcano ----

// A great boulder of black lava rock with two smaller ones.
function lavaBoulder(): Geo {
  return merge(
    rock([330, 270, 240], 0.5, 31, "Volcanic_LavaRock"),
    translate(rock([150, 120, 110], 0.5, 32, "Volcanic_LavaRockDark"), [150, -120, -4]),
    translate(rock([90, 80, 64], 0.55, 33, "Volcanic_LavaRock"), [-150, 110, -3]),
    translate(rock([60, 50, 30], 0.5, 34, "Volcanic_Ash", true), [-170, -90, -2]),
  );
}

// A heap of lava rocks, some flat, ~4 x 3 m.
function lavaRocks(): Geo {
  const P: Geo[] = [];
  for (const [x, y, sx, sy, sz, flat, m, sd] of [
    [0, 0, 180, 150, 130, false, 0, 41], [120, 70, 140, 120, 90, false, 1, 42], [-130, 60, 200, 160, 70, true, 0, 43], [-90, -100, 110, 90, 80, false, 1, 44],
    [130, -90, 160, 120, 55, true, 2, 45], [-180, -30, 70, 60, 50, false, 0, 46], [40, 130, 60, 50, 40, false, 1, 47], [190, 10, 50, 44, 34, false, 0, 48],
  ] as const) P.push(translate(rock([sx, sy, sz], 0.5, sd, ["Volcanic_LavaRock", "Volcanic_LavaRockDark", "Volcanic_Ash"][m], flat), [x, y, -3]));
  return merge(...P);
}

// Scree: grey ash and loose stones, flat on the ground, ~3.5 x 3 m.
function scree(): Geo {
  const rnd = seeded(101), P: Geo[] = [];
  for (let k = 0; k < 5; k++) P.push(rotateZ(oval(70 + rnd() * 50, 40 + rnd() * 30, 2.5, [0, 0, 0], "Volcanic_Ash", 9), rnd() * 180).map((p) => ({ geo: p.geo.clone().translate((rnd() - 0.5) * 220, (rnd() - 0.5) * 160, 0), mat: p.mat })));
  for (let k = 0; k < 26; k++) {
    const s = 18 + rnd() * 38, x = (rnd() - 0.5) * 320, y = (rnd() - 0.5) * 260;
    P.push(translate(rock([s, s * (0.7 + rnd() * 0.3), s * (0.4 + rnd() * 0.3)], 0.5, 110 + k, rnd() < 0.5 ? "Volcanic_LavaRock" : "Volcanic_LavaRockDark", rnd() < 0.5), [x, y, -2]));
  }
  return merge(...P);
}

// Basalt columns: hexagonal pillars packed tight, stepping up to 4.6 m at the back, a few
// broken drums lying in front.
function basaltColumns(): Geo {
  const rnd = seeded(111), P: Geo[] = [], R = 33;
  for (let i = -5; i <= 5; i++)
    for (let j = -4; j <= 4; j++) {
      const x = R * 1.5 * i, y = R * Math.sqrt(3) * (j + (Math.abs(i) % 2) * 0.5);
      if ((x / 210) ** 2 + (y / 170) ** 2 > 1) continue;
      const peak = 1 - Math.hypot((x - 80) / 260, (y + 20) / 200);
      const h = Math.max(30, 40 + 420 * Math.max(0, peak) ** 1.3 + (rnd() - 0.5) * 70);
      P.push(hex(R - 1.5, h, [x, y, 0], "Volcanic_Basalt"), hex(R - 1.5, 5, [x, y, h], "Volcanic_BasaltTop", R - 6));
    }
  for (const [x, y, l, a] of [[-280, -60, 110, 20], [-260, 110, 80, -40], [-330, 40, 70, 70]] as const)
    P.push(translate(rotateZ(rotateY(hex(R - 2, l, [0, 0, -l / 2], "Volcanic_Basalt"), 90), a), [x, y, (R - 2) * 0.87]));
  P.push(translate(rock([80, 60, 40], 0.5, 112, "Volcanic_LavaRockDark"), [-230, -150, -2]), translate(rock([60, 50, 34], 0.5, 113, "Volcanic_Ash", true), [-200, 170, -2]));
  return merge(...P);
}

// A dead tree, scorched black and bleached grey, its bare branches clawing up.
function deadTree(): Geo {
  const rnd = seeded(121), C = "Volcanic_Charred", Dw = "Volcanic_DeadWood", P: Geo[] = [];
  const trunk: V3[] = [[0, 0, 0], [10, 6, 120], [26, -10, 240], [14, -22, 360], [30, -16, 470]];
  P.push(smooth(trunk, 28, 6, C, { seg: 9, flare: 0.6, roots: 5, gnarl: 0.9, seed: 121, taper: 0.85 }));
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.3;
    P.push(smooth([[Math.cos(a) * 16, Math.sin(a) * 16, 28], [Math.cos(a) * 52, Math.sin(a) * 52, 8], [Math.cos(a + 0.12) * 86, Math.sin(a + 0.12) * 86, -6]], 12, 4, C, { seg: 6, maxRings: 4 }));
  }
  for (const [t, a, l] of [[0.42, 30, 190], [0.55, 160, 210], [0.68, 260, 170], [0.8, 90, 150], [0.9, 210, 120]] as const) {
    const i = Math.min(3, Math.floor(t * 4)), f = t * 4 - i;
    const s = add(trunk[i], mul(sub(trunk[i + 1], trunk[i]), f)), d = a * DEG;
    const m: V3 = add(s, [Math.cos(d) * l * 0.55, Math.sin(d) * l * 0.55, l * 0.35]);
    const e: V3 = add(m, [Math.cos(d + 0.3) * l * 0.45, Math.sin(d + 0.3) * l * 0.45, l * 0.45]);
    const r0 = 10 - t * 5;
    P.push(smooth([s, m, e], r0, 1.2, i % 2 ? Dw : C, { seg: 6, gnarl: 0.4 }));
    for (let k = 0; k < 2; k++) {
      const dd = d + (rnd() - 0.5) * 1.6, tip: V3 = add(m, [Math.cos(dd) * l * 0.4, Math.sin(dd) * l * 0.4, l * (0.2 + rnd() * 0.4)]);
      P.push(smooth([m, [(m[0] + tip[0]) / 2, (m[1] + tip[1]) / 2, (m[2] + tip[2]) / 2 + 6], tip], r0 * 0.4, 0.6, Dw, { seg: 4, maxRings: 3 }));
    }
  }
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2;
    P.push(spike(4, 18 + k * 6, add(trunk[4], [Math.cos(a) * 3, Math.sin(a) * 3, -4]), Dw));
  }
  P.push(translate(rock([70, 56, 36], 0.5, 122, "Volcanic_LavaRock"), [70, 60, -2]), translate(rock([90, 70, 20], 0.4, 123, "Volcanic_Ash", true), [-60, -50, -2]));
  return merge(...P);
}

// A sulphur vent: a mound crusted yellow, a rock chimney with a glowing mouth, steam rising.
function sulphurVent(): Geo {
  const P: Geo[] = [];
  const mound = merge(translate(rock([330, 290, 110], 0.3, 132, "Volcanic_Sulphur", true), [0, 0, -14]), translate(rock([190, 170, 120], 0.35, 133, "Volcanic_Sulphur"), [12, -6, -6]));
  P.push(mound, translate(rock([300, 250, 40], 0.3, 134, "Volcanic_SulphurStain", true), [-30, 40, -12]));
  for (const [x, y, sd] of [[130, -80, 135], [-120, -90, 136], [60, 130, 137]] as const) P.push(translate(rock([60, 50, 36], 0.5, sd, "Volcanic_LavaRock"), [x, y, -4]));
  P.push(cylinderAt({ rBot: 54, rTop: 30, height: 86, segments: 9, bottom: [10, -6, 32] }, "Volcanic_LavaRock"));
  P.push(translate(torus(28, 9, 12, 6, "Volcanic_SulphurStain"), [10, -6, 117]), cylinderAt({ radius: 22, height: 4, segments: 10, bottom: [10, -6, 114] }, "Volcanic_SulphurGlow"));
  // yellow crystals on the crust (set on the mound's own surface)
  const rnd = seeded(131);
  for (let k = 0; k < 16; k++) {
    const a = rnd() * Math.PI * 2, d = 60 + rnd() * 80, x = Math.cos(a) * d, y = Math.sin(a) * d, z = heightOn(mound, x, y);
    if (z === null) continue;
    P.push(rotateY(spike(5 + rnd() * 5, 14 + rnd() * 18, [0, 0, -3], "Volcanic_SulphurGlow", 4), (rnd() - 0.5) * 40).map((p) => ({ geo: p.geo.clone().translate(x, y, z), mat: p.mat })));
  }
  // two small side vents
  for (const [x, y] of [[-90, 70], [80, 95]] as const) {
    const z = heightOn(mound, x, y) ?? 0;
    P.push(cylinderAt({ radius: 11, height: 4, segments: 8, bottom: [x, y, z - 2] }, "Volcanic_SulphurGlow"), translate(torus(12, 5, 10, 5, "Volcanic_SulphurStain"), [x, y, z]), puff([x - 4, y + 4, z + 40], 26));
  }
  for (const [x, y, z, r] of [[10, -6, 160, 38], [16, -12, 222, 50], [26, -22, 292, 64], [40, -34, 372, 76]] as const) P.push(puff([x, y, z], r));
  return merge(...P);
}

// A hot spring: milky turquoise water in a rim of rock and white sinter, terraces spilling
// over on one side, steam over the water, a bamboo pipe pouring in, a bucket and an old sign.
function hotSpring(): Geo {
  const P: Geo[] = [], RX = 290, RY = 210, rnd = seeded(141);
  P.push(oval(RX + 40, RY + 40, 6, [0, 0, -2], "Volcanic_Sinter", 24), oval(RX, RY, 4, [0, 0, 1], "Volcanic_SpringBed", 24), oval(RX, RY, 8, [0, 0, 5], "Volcanic_Spring", 24));
  for (let k = 0; k < 30; k++) {
    const a = (k / 30) * Math.PI * 2 + rnd() * 0.08, c = Math.cos(a), s = Math.sin(a);
    if (s > 0.55 && c > -0.5 && c < 0.6) continue; // the terraces' lip
    const sz = 50 + rnd() * 45;
    P.push(translate(rock([sz, sz * 0.8, sz * 0.55], 0.45, 150 + k, rnd() < 0.55 ? "Volcanic_LavaRock" : "Volcanic_Sinter"), [(RX + 14) * c, (RY + 14) * s, -4]));
  }
  // sinter terraces spilling down on the +Y side, each a little pool
  for (let t = 0; t < 3; t++) {
    const cx = 10 - t * 24, cy = RY + 8 + t * 42, z = 12 - t * 4.5;
    P.push(oval(160 - t * 28, 62, z, [cx, cy, -2], t === 1 ? "Volcanic_SinterRust" : "Volcanic_Sinter", 18), oval(144 - t * 28, 48, 2.2, [cx, cy - 4, z - 2.6], "Volcanic_Spring", 18));
  }
  for (const [x, y, z, r] of [[-80, -40, 70, 60], [60, 30, 110, 74], [-10, 60, 165, 86], [110, -70, 85, 52], [20, -10, 230, 92], [-130, 40, 130, 58]] as const) P.push(puff([x, y, z], r));
  // the bamboo pipe on crossed stakes, water falling from it
  P.push(cylinderBetween([RX + 90, 40, 96], [RX - 50, 30, 74], 6, 8, "Bamboo"));
  for (const s of [-1, 1]) P.push(cylinderBetween([RX + 40 + s * 18, 34, 0], [RX + 40 - s * 18, 34, 110], 2.5, 6, "BambooDry"));
  P.push(cylinderBetween([RX - 52, 30, 72], [RX - 62, 30, 12], 3, 6, "Volcanic_Spring"));
  // a wooden bucket on a rock and an old sign with the spring mark
  P.push(translate(rock([70, 60, 40], 0.3, 148, "Volcanic_LavaRock", true), [-RX - 50, -RY * 0.5, -2]));
  P.push(cylinderAt({ rBot: 17, rTop: 20, height: 26, segments: 12, bottom: [-RX - 50, -RY * 0.5, 20] }, "WoodWarm"));
  for (const z of [26, 40]) P.push(translate(torus(19, 1.6, 14, 4, "IronDark"), [-RX - 50, -RY * 0.5, z]));
  P.push(cylinderBetween([-RX - 50, -RY * 0.5 + 10, 50], [-RX - 30, -RY * 0.5 + 40, 70], 1.6, 5, "WoodPale"));
  P.push(boxAt([10, 10, 120], [-RX - 70, RY * 0.7, 0], "Volcanic_OldWoodDark"), boxAt([5, 70, 50], [-RX - 77, RY * 0.7, 80], "WoodPale", 1));
  P.push(translate(rotateY(torus(13, 3, 10, 4, "LacquerRed"), 90), [-RX - 80, RY * 0.7, 98]).map((p) => ({ geo: p.geo, mat: p.mat })));
  for (const dy of [-12, 0, 12]) P.push(chain([[-RX - 80, RY * 0.7 + dy, 106], [-RX - 80, RY * 0.7 + dy + 3, 114], [-RX - 80, RY * 0.7 + dy - 2, 122]], 1.5, 1.5, "LacquerRed", 4));
  P.push(boxAt([4, 30, 6], [-RX - 80, RY * 0.7, 87], "WoodPale"));
  return merge(...P);
}

// A crack in the ground with lava glowing in it between slabs of dark crust, 5.6 m long
// (lies flat: walk over it).
function lavaCrack(): Geo {
  const rnd = seeded(161), P: Geo[] = [];
  const pts: [number, number][] = [];
  for (let i = 0; i <= 8; i++) pts.push([-280 + i * 70, (rnd() - 0.5) * 70]);
  for (let i = 0; i < 8; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], w = 30 + rnd() * 18;
    P.push(beamBetween([ax, ay, 1.5], [bx, by, 1.5], w, 3, "Volcanic_Lava"), beamBetween([ax, ay, 3], [bx, by, 3], w * 0.35, 1.6, "Volcanic_LavaHot"));
    const nx = -(by - ay), ny = bx - ax, l = Math.hypot(nx, ny);
    for (const s of [-1, 1]) {
      const sz = 55 + rnd() * 35, off = w / 2 + sz * 0.32;
      P.push(translate(rotateZ(rock([sz, sz * 0.65, 14 + rnd() * 8], 0.45, 170 + i * 2 + (s > 0 ? 1 : 0), "Volcanic_Crust", true), rnd() * 180), [(ax + bx) / 2 + (s * nx * off) / l, (ay + by) / 2 + (s * ny * off) / l, -3]));
    }
  }
  return merge(...P);
}

// Obsidian: black glassy shards jutting from dark rock, an ember glow at their roots.
function obsidian(): Geo {
  const rnd = seeded(181), P: Geo[] = [translate(rock([150, 120, 46], 0.4, 182, "Volcanic_LavaRockDark", true), [0, 0, -3])];
  for (let k = 0; k < 9; k++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 50, h = 50 + rnd() * 110, r = 10 + rnd() * 8;
    P.push(rotateZ(rotateY(spike(r, h, [0, 0, -6], "Volcanic_Obsidian", 5), (rnd() - 0.5) * 50), rnd() * 360).map((p) => ({ geo: p.geo.clone().translate(Math.cos(a) * d, Math.sin(a) * d, 18), mat: p.mat })));
  }
  for (const [x, y] of [[20, 10], [-25, 18], [8, -28]] as const) P.push(ellipsoid([10, 8, 4], [x, y, 20], "Volcanic_LavaHot", 6));
  return merge(...P);
}

// The crater at the volcano's top: a ring of black rock 16 m across rising to a jagged rim,
// a lake of lava glowing inside with floes of crust, smoke rising, a breach where lava
// spills down the outer slope at the front-left. Keep everyone off it (a solid disc r ~800).
function crater(): Geo {
  const P: Geo[] = [], rnd = seeded(191);
  const outer = lathe([[830, -6], [770, 34], [700, 110], [630, 220], [592, 285], [566, 306], [540, 298]], 30, "Volcanic_LavaRock");
  const inner = lathe([[540, 298], [515, 240], [494, 150], [478, 70], [468, 26]], 30, "Volcanic_Crust");
  const wall = merge(outer, inner);
  P.push(wall);
  P.push(cylinderAt({ radius: 480, height: 10, segments: 30, bottom: [0, 0, 18] }, "Volcanic_Lava"), translate(torus(470, 9, 30, 6, "Volcanic_LavaHot"), [0, 0, 28]));
  for (let k = 0; k < 6; k++) {
    const a = rnd() * Math.PI * 2, d = 120 + rnd() * 260;
    P.push(rotateZ(oval(50 + rnd() * 40, 24 + rnd() * 16, 2, [0, 0, 0], "Volcanic_LavaHot", 10), rnd() * 180).map((p) => ({ geo: p.geo.clone().translate(Math.cos(a) * d, Math.sin(a) * d, 27.5), mat: p.mat })));
  }
  for (let k = 0; k < 11; k++) {
    const a = (k / 11) * Math.PI * 2 + rnd(), d = 80 + rnd() * 330, s = 70 + rnd() * 90;
    P.push(translate(rock([s, s * 0.75, 26], 0.35, 200 + k, "Volcanic_Crust", true), [Math.cos(a) * d, Math.sin(a) * d, 20]));
  }
  // jagged rocks along the rim (a gap at the breach) and down the outer slope
  const breach = 205 * DEG;
  for (let k = 0; k < 30; k++) {
    const a = (k / 30) * Math.PI * 2 + (rnd() - 0.5) * 0.12;
    if (Math.abs(Math.atan2(Math.sin(a - breach), Math.cos(a - breach))) < 0.16) continue;
    const r = 560 + (rnd() - 0.5) * 50, x = Math.cos(a) * r, y = Math.sin(a) * r, z = heightOn(wall, x, y) ?? 290;
    const s = 80 + rnd() * 80;
    P.push(translate(rotateZ(rock([s, s * 0.7, 90 + rnd() * 150], 0.55, 230 + k, k % 3 ? "Volcanic_LavaRock" : "Volcanic_LavaRockDark"), (a / DEG) + 90), [x, y, z - 30]));
  }
  for (let k = 0; k < 22; k++) {
    const a = rnd() * Math.PI * 2, r = 650 + rnd() * 160, x = Math.cos(a) * r, y = Math.sin(a) * r, z = heightOn(wall, x, y);
    if (z === null || Math.abs(Math.atan2(Math.sin(a - breach), Math.cos(a - breach))) < 0.2) continue;
    const s = 50 + rnd() * 70;
    P.push(translate(rock([s, s * 0.8, s * 0.6], 0.5, 270 + k, rnd() < 0.5 ? "Volcanic_LavaRock" : "Volcanic_Ash"), [x, y, z - 12]));
  }
  // the breach: a notch in the rim and a tongue of lava down the slope to the foot
  const flow: V3[] = [];
  for (let k = 0; k <= 12; k++) {
    const r = 540 + k * 26, a = breach + Math.sin(k * 0.7) * 0.05, x = Math.cos(a) * r, y = Math.sin(a) * r;
    flow.push([x, y, (heightOn(outer, x, y) ?? 0) + 3]);
  }
  for (let k = 0; k < 12; k++) {
    const w = 70 - k * 3;
    P.push(beamBetween(flow[k], flow[k + 1], w, 8, "Volcanic_Lava"), beamBetween(add(flow[k], [0, 0, 4]), add(flow[k + 1], [0, 0, 4]), w * 0.35, 3, "Volcanic_LavaHot"));
    for (const s of [-1, 1]) {
      const n = norm(cross(sub(flow[k + 1], flow[k]), UP)), c = add(mul(add(flow[k], flow[k + 1]), 0.5), mul(n, s * (w / 2 + 16)));
      P.push(translate(rock([50, 40, 26], 0.4, 300 + k * 2 + (s > 0 ? 1 : 0), "Volcanic_Crust", true), [c[0], c[1], c[2] - 10]));
    }
  }
  // smoke over the lake
  for (const [x, y, z, r, m] of [[-60, 40, 160, 150, 0], [90, -60, 260, 190, 1], [-20, -30, 380, 230, 0], [60, 80, 500, 250, 1], [-100, 0, 620, 220, 1]] as const) P.push(puff([x, y, z], r, m ? "Volcanic_Smoke" : "Volcanic_Steam"));
  return merge(...P);
}

// The survey party's camp: an A-frame tent (door to -X), a campfire with a pot on a tripod,
// crates, a map weighted with stones and Osaki's banner on a pole.
function surveyCamp(): Geo {
  const P: Geo[] = [], C = "FabricSand", Wd = "WoodDark";
  const tx = 60, ty = -40; // the tent's centre
  const T: Geo[] = [];
  T.push(gableRoof([320, 300, 4], [0, 0, 10], 180, 0, C));
  T.push(gableWall(160, 150, 10, 180, C), bb([-160, -154, 0], [160, -146, 12], C), bb([-160, 146, 0], [160, 154, 12], C));
  for (const s of [-1, 1]) T.push(fan([-160, s * 150, 10], [[-160, s * 150, 10], [-160, s * 55, 10], [-160, 0, 190]], C, [-1, 0, 0], true));
  T.push(bb([-158, -146, 0], [158, 146, 2], "Volcanic_Earth"));
  for (const x of [-166, 166]) T.push(cylinderAt({ radius: 4, height: 206, segments: 8, bottom: [x, 0, 0] }, Wd));
  T.push(cylinderBetween([-172, 0, 196], [172, 0, 196], 3.5, 8, Wd));
  for (const x of [-166, 166]) for (const s of [-1, 1]) {
    const stake: V3 = [x + Math.sign(x) * 110, s * 50, 0];
    T.push(cylinderBetween([x, 0, 200], add(stake, [0, 0, 18]), 0.9, 4, "RopeTan"), cylinderAt({ radius: 3, height: 20, segments: 6, bottom: stake }, Wd));
  }
  T.push(cylinderBetween([-120, -60, 14], [60, -60, 14], 14, 10, "FeltRed"), boxAt([60, 50, 40], [80, 70, 0], "FabricNavy", 4));
  P.push(translate(merge(...T), [tx, ty, 0]));
  // the campfire and its tripod
  const fx = -260, fy = 150;
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    P.push(translate(rock([30, 26, 20], 0.4, 310 + k, "Volcanic_LavaRock"), [fx + Math.cos(a) * 52, fy + Math.sin(a) * 52, -2]));
  }
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.3;
    P.push(cylinderBetween([fx + Math.cos(a) * 40, fy + Math.sin(a) * 40, 6], [fx - Math.cos(a) * 18, fy - Math.sin(a) * 18, 16], 6, 7, "Volcanic_Charred"));
    P.push(cylinderBetween([fx + Math.cos(a) * 70, fy + Math.sin(a) * 70, 0], [fx, fy, 130], 2.5, 6, Wd));
  }
  P.push(cylinderAt({ radius: 30, height: 2, segments: 10, bottom: [fx, fy, 1] }, "Volcanic_LavaHot"));
  for (const [dx, dy, h, r] of [[0, 0, 56, 16], [10, 8, 40, 12], [-10, 6, 34, 11], [4, -10, 42, 12]] as const) P.push(cylinderAt({ rBot: r, rTop: 1, height: h, segments: 6, bottom: [fx + dx, fy + dy, 4] }, "FireGlow"));
  P.push(cylinderBetween([fx, fy, 130], [fx, fy, 86], 0.8, 4, "IronDark"), lathe([[0, 0], [14, 1], [19, 8], [20, 20], [18, 26], [16, 27]], 12, "IronDark", [fx, fy, 60]));
  // crates and a barrel
  for (const [x, y, z, a] of [[-210, -150, 0, 8], [-150, -190, 0, -6], [-185, -165, 60, 20]] as const) {
    const cr = merge(boxAt([60, 60, 60], [0, 0, 0], "WoodWarm", 3), boxAt([62, 8, 62], [0, -20, -1], "IronDark"), boxAt([62, 8, 62], [0, 20, -1], "IronDark"));
    P.push(translate(rotateZ(cr, a), [x, y, z]));
  }
  P.push(cylinderAt({ rBot: 26, rTop: 28, height: 70, segments: 12, bottom: [-90, -230, 0] }, "WoodWarm"), translate(torus(28, 2, 14, 4, "IronDark"), [-90, -230, 14]), translate(torus(28, 2, 14, 4, "IronDark"), [-90, -230, 56]));
  // the map table: a crate with paper, stones on its corners, a brush
  P.push(boxAt([70, 90, 52], [-300, -40, 0], "WoodPale", 3), boxAt([56, 76, 1.5], [-300, -40, 52], "Volcanic_PaperOld"));
  for (const [dx, dy] of [[-22, -30], [22, 30], [20, -32]] as const) P.push(sphereCenter(6, [-300 + dx, -40 + dy, 56], "Volcanic_LavaRock", 6));
  P.push(cylinderBetween([-310, -20, 55], [-290, 0, 55], 1.2, 5, Wd), boxAt([14, 4, 2], [-305, -50, 53.5], "LacquerBlack"));
  // Osaki's banner (nobori) on its pole
  const bx = -330, by = -230;
  P.push(cylinderAt({ radius: 4, height: 340, segments: 8, bottom: [bx, by, 0] }, Wd), cylinderBetween([bx, by, 330], [bx, by + 75, 330], 2.5, 6, Wd));
  P.push(bb([bx - 1.5, by + 8, 120], [bx + 1.5, by + 72, 328], "FabricWhite"), bb([bx - 2, by + 8, 300], [bx + 2, by + 72, 316], "FabricNavy"), bb([bx - 2, by + 8, 120], [bx + 2, by + 72, 132], "FabricNavy"));
  P.push(translate(rotateY(cylinderAt({ radius: 22, height: 2, segments: 16, bottom: [0, 0, -1] }, "FabricRed"), 90), [bx - 1.5, by + 40, 230]));
  for (let z = 140; z < 320; z += 45) P.push(torus(5, 1, 8, 3, Wd).map((p) => ({ geo: p.geo.clone().rotateX(Math.PI / 2).translate(bx, by + 4, z), mat: p.mat })));
  P.push(tuft([150, 190, 0], 321, 8, 50), tuft([-360, 120, 0], 323, 7, 45));
  return translate(merge(...P), [40, 20, 0]);
}

// ---- the sample: where the sakura hills meet the lava field ----
// Up the screen (+X) the volcano: the crater, its lava spilling down, vents, a hot spring and
// basalt on grey ash; down the screen (-X) the hills: the old shrine and its torii under cherry
// trees, a bamboo grove with the sacred rock, jizo and a signpost by the track; the survey
// camp where the two meet.
function sample(put: Put): void {
  // ash and scree over the volcano's half
  for (const [x, y, h] of [[200, 1800, 0], [500, 900, 40], [900, 200, 80], [1400, -300, 20], [1900, -900, 110], [1100, -1100, 60], [600, -600, 150], [1900, 300, 30], [300, 0, 90], [2000, 1900, 10], [-100, 1300, 70], [1500, 500, 130]] as const) put("scree", [x, y, 0], h);
  // the crater and its lava running down toward the camp
  put("crater", [1350, 1250, 0], 0);
  put("lava_crack", [330, 640, 0], 25);
  put("lava_rocks", [700, 1950, 0], 30);
  put("lava_boulder", [-150, 2000, 0], 200);
  put("obsidian", [1100, 300, 0], 0);
  put("obsidian", [2050, 900, 0], 60);
  put("sulphur_vent", [1850, -350, 0], 0);
  put("sulphur_vent", [1250, -950, 0], 70);
  put("basalt_columns", [2000, -1750, 0], 180);
  put("lava_rocks", [1500, -1900, 0], 100);
  put("hot_spring", [450, -1450, 0], 10);
  put("dead_tree", [700, 700, 0], 0);
  put("dead_tree", [1950, 450, 0], 140);
  put("dead_tree", [950, -1850, 0], 250);
  put("dead_tree", [1600, -1300, 0], 60);
  put("lava_crack", [1500, -500, 0], -40);
  // the survey camp between the two
  put("survey_camp", [-80, -400, 0], -10);
  put("waymarker", [-500, 400, 0], 30);
  // the hills: the shrine under the cherries, its guardians, the old torii, lanterns down
  put("shrine_ruin", [-1450, 950, 0], 0);
  put("komainu", [-2000, 650, 0], -40);
  put("komainu", [-2000, 1250, 0], 40);
  put("torii_old", [-2150, 950, 0], 0);
  put("lantern_toppled", [-1700, 250, 0], 40);
  put("petal_carpet", [-1950, 1600, 0], 0);
  put("petal_carpet", [-950, 1650, 0], 70);
  put("petal_carpet", [-2050, 250, 0], 20);
  put("petal_carpet", [-1150, -300, 0], 120);
  put("petal_carpet", [-600, -1300, 0], 40);
  for (const [x, y, s] of [[-2050, 1900, 1], [-1700, 1950, 0.9], [-850, 1250, 1], [-2100, -150, 0.9], [-1250, -650, 1.1], [-650, -950, 0.85], [-1850, -1100, 1], [-950, 500, 0.9]] as const) put("flora:Cherry", [x, y, 0], x, s);
  // the bamboo grove along the +Y edge, the sacred rock in it
  for (const [x, y, s] of [[-550, 2100, 1.1], [-300, 1700, 1], [-750, 1900, 0.9], [100, 2150, 1], [-1200, 2150, 1], [350, 1850, 1.05], [-50, 1500, 0.95]] as const) put("flora:Bamboo", [x, y, 0], x, s);
  put("sacred_rock", [-500, 1400, 0], 200);
  for (const [x, y] of [[-150, 1150, 0], [-900, 1950], [-50, 1850], [-750, 1100], [200, 1550]] as const) put("sasa_bush", [x, y, 0], x);
  // the track side: jizo, the fallen torii, a log, the stump, silver grass, boulders
  put("jizo_group", [-1650, -350, 0], -90);
  put("torii_fallen", [-1300, -1700, 0], -20);
  put("fallen_log", [-700, -2000, 0], 25);
  put("stump", [-2050, -700, 0], 0);
  put("boulder_moss", [-2050, -1750, 0], 40);
  put("boulder_moss", [-350, -1000, 0], 200);
  for (const [x, y] of [[-600, -1650], [-1950, -400], [-1000, -1100], [-2150, -1300], [-300, 900], [-1650, -1500]] as const) put("susuki_grass", [x, y, 0], y);
  for (const [x, y] of [[-1600, 1600], [-1950, 2150], [-1100, 1350]] as const) put("sasa_bush", [x, y, 0], x);
  put("flora:Pine", [-150, -2050, 0], 0, 1);
  put("flora:PineSmall", [-2150, -2000, 0], 0, 1);
}

export const KIT: Kit = {
  id: "volcanic",
  name: "ภูเขาไฟโอซากิ",
  region: "เกาะโอซากิ หลังประตูภูเขา",
  desc: "ป่าไผ่ เนินซากุระ ศาลเจ้าร้าง แล้วขึ้นไปคือหินลาวาดำ บ่อน้ำพุร้อน ปล่องกำมะถัน เสาหินบะซอลต์ และปากปล่องลาวาบนยอด",
  ground: "grass",
  items: [
    { id: "shrine_ruin", name: "ศาลเจ้าร้าง", make: shrineRuin, tags: ["building", "landmark", "ruin"] },
    { id: "torii_old", name: "โทริอิเก่า", make: toriiOld, tags: ["gate", "landmark"] },
    { id: "torii_fallen", name: "โทริอิพังทลาย", make: toriiFallen, tags: ["ruin", "decor"] },
    { id: "stone_stairs", name: "บันไดหินขึ้นผา (9 ม. สูง 3 ม.)", make: stoneStairs, tags: ["ground", "stairs"] },
    { id: "jizo_group", name: "จิโซริมทาง", make: jizoGroup, tags: ["decor", "shrine"] },
    { id: "komainu", name: "สิงโตหินเฝ้าศาล", make: komainu, tags: ["decor", "shrine"] },
    { id: "lantern_toppled", name: "โคมหินล้ม", make: lanternToppled, tags: ["ruin", "decor"] },
    { id: "sacred_rock", name: "หินศักดิ์สิทธิ์คาดเชือก", make: sacredRock, tags: ["landmark", "rock"] },
    { id: "sasa_bush", name: "พุ่มไผ่แคระ", make: sasaBush, tags: ["plant"] },
    { id: "susuki_grass", name: "กอหญ้าซูซูกิ", make: susukiGrass, tags: ["plant"] },
    { id: "petal_carpet", name: "กลีบซากุระร่วง", make: petalCarpet, tags: ["ground"] },
    { id: "boulder_moss", name: "หินแกรนิตมอส", make: boulderMoss, tags: ["rock"] },
    { id: "fallen_log", name: "ขอนไม้ล้ม", make: fallenLog, tags: ["decor", "wood"] },
    { id: "stump", name: "ตอไม้", make: stump, tags: ["decor", "wood"] },
    { id: "waymarker", name: "เสาบอกทาง", make: waymarker, tags: ["sign", "decor"] },
    { id: "lava_boulder", name: "หินลาวาก้อนใหญ่", make: lavaBoulder, tags: ["rock"] },
    { id: "lava_rocks", name: "กองหินลาวา", make: lavaRocks, tags: ["rock"] },
    { id: "scree", name: "ลานเศษหินและเถ้า", make: scree, tags: ["ground"] },
    { id: "basalt_columns", name: "เสาหินบะซอลต์", make: basaltColumns, tags: ["rock", "landmark"] },
    { id: "dead_tree", name: "ต้นไม้ตายไหม้เกรียม", make: deadTree, tags: ["plant", "decor"] },
    { id: "sulphur_vent", name: "ปล่องกำมะถัน", make: sulphurVent, tags: ["vent", "landmark"] },
    { id: "hot_spring", name: "บ่อน้ำพุร้อน", make: hotSpring, tags: ["water", "landmark"] },
    { id: "lava_crack", name: "รอยแยกลาวา", make: lavaCrack, tags: ["ground"] },
    { id: "obsidian", name: "ผลึกหินออบซิเดียน", make: obsidian, tags: ["rock", "crystal"] },
    { id: "crater", name: "ปากปล่องลาวา (16 ม.)", make: crater, tags: ["landmark"] },
    { id: "survey_camp", name: "ค่ายหน่วยสำรวจ", make: surveyCamp, tags: ["camp", "decor"] },
  ],
  sample,
};

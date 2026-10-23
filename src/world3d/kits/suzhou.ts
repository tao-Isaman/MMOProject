// ซูโจว (Suzhou): the merchant port at the western tip of the continent, where the junks of the
// western sea trade tea, silk and porcelain. Chinese (Jiangnan) architecture, unlike Osaki's
// Japanese: sweeping roofs whose corners curl up like horns, curled ornaments on the ridges, grey
// tiles on the houses and green glazed tiles on the landmarks; crimson columns and painted
// blue-green bracket sets; whitewashed walls under dark tile copings, horse-head gables stepping
// up over the roofs, moon gates and lattice windows; a ceremonial archway (pailou), an octagonal
// pagoda that is the harbour's lighthouse, a governor's hall, tea houses with balconies, stone
// hump bridges over the canals, willows, red lanterns strung across the streets, junks with
// batten sails, black-awning sampans and wooden piers.
//
// All centimetres, Z up; every item stands on z = 0, centred on its footprint, front facing -X.
// The town's water (sea and canals) lies 110 cm below the ground: the quay and canal walls drop
// to it and the boats are built with their keel at z = 0 (sink them by their draft).

import * as THREE from "three";
import { merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween, cylinderBetween, cylinderAt, sphereCenter, torus, rock } from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, material } from "../textures";
import { limb, LeafCards, frond, foliage, CANOPY, treeObject } from "../trees";
import type { Kit, Put } from "./types";

// ---- the town's own colours ----
defineMaterial("Suzhou_Tile", { map: "tiles", tint: "#565c64", bump: 2.5 });            // dark grey roof tiles
defineMaterial("Suzhou_TileEnd", { map: "tiles", tint: "#717880", bump: 1.5 });         // round eave-tile ends
defineMaterial("Suzhou_TileGreen", { map: "tiles", tint: "#3f8c5e", bump: 2.5, rough: 0.42 }); // green glazed tiles
defineMaterial("Suzhou_TileEndGreen", { map: "tiles", tint: "#2e6c48", bump: 1.5, rough: 0.42 });
defineMaterial("Suzhou_Ridge", { map: "plaster", tint: "#464b52", rough: 0.6, bump: 0.8 });
defineMaterial("Suzhou_RidgeGreen", { map: "plaster", tint: "#2d6b47", rough: 0.4, bump: 0.8 });
defineMaterial("Suzhou_White", { map: "plaster", tint: "#f3f0e8", bump: 0.5 });          // whitewash
defineMaterial("Suzhou_WallRed", { map: "plaster", tint: "#a83a2d", bump: 0.6 });        // temple walls
defineMaterial("Suzhou_Red", { map: "plaster", tint: "#a3251d", rough: 0.42 });          // lacquered columns
defineMaterial("Suzhou_Teal", { map: "plaster", tint: "#2b7570", rough: 0.5 });          // painted beams, brackets
defineMaterial("Suzhou_Blue", { map: "plaster", tint: "#2e4f88", rough: 0.5 });
defineMaterial("Suzhou_Granite", { map: "stone", tint: "#c5c1b7", bump: 1.6 });
defineMaterial("Suzhou_GraniteDark", { map: "stone", tint: "#8f8c86", bump: 1.8 });
defineMaterial("Suzhou_Marble", { map: "marble", tint: "#ecebe4", rough: 0.5 });
defineMaterial("Suzhou_Brick", { map: "brick", tint: "#8e9195", bump: 1.5 });            // grey city-wall brick
defineMaterial("Suzhou_BrickDark", { map: "brick", tint: "#6d7075", bump: 1.5 });
defineMaterial("Suzhou_Lantern", { map: "fabric", tint: "#e23b27", rough: 0.75, glow: "#ff3218", glowI: 0.85 });
defineMaterial("Suzhou_Tassel", { map: "fabric", tint: "#e8b440", rough: 0.8 });
defineMaterial("Suzhou_Glow", { map: "paper", tint: "#ffe3a4", rough: 0.8, glow: "#ffb447", glowI: 1.25 }); // lit paper
defineMaterial("Suzhou_Ink", { map: "plaster", tint: "#211f1e", rough: 0.45 });          // signboards, doors
defineMaterial("Suzhou_Porcelain", { tint: "#f2f3f0", rough: 0.22 });
defineMaterial("Suzhou_Cobalt", { tint: "#27489b", rough: 0.25 });
defineMaterial("Suzhou_Sail", { map: "fabric", tint: "#b3572f", rough: 0.95 });         // junk sails, tanned
defineMaterial("Suzhou_SailPale", { map: "fabric", tint: "#c9894d", rough: 0.95 });
defineMaterial("Suzhou_Hull", { map: "wood", tint: "#5b402b", bump: 1.2 });
defineMaterial("Suzhou_HullBlack", { map: "wood", tint: "#34312e", bump: 1 });
defineMaterial("Suzhou_Mat", { map: "bamboo", tint: "#3b3732", rough: 0.9 });           // black woven awnings
defineMaterial("Suzhou_Indigo", { map: "fabric", tint: "#2f4b7c", rough: 0.95 });
defineMaterial("Suzhou_Taihu", { map: "stone", tint: "#c0bdb4", bump: 3 });              // garden rock
defineMaterial("Suzhou_Hole", { map: "stone", tint: "#454746", rough: 1 });
defineMaterial("Suzhou_Pond", { tint: "#3f7b6c", rough: 0.08, opacity: 0.82 });
defineMaterial("Suzhou_PondBed", { map: "stone", tint: "#2e463f", rough: 0.9 });
defineMaterial("Suzhou_LotusLeaf", { map: "felt", tint: "#4d8b3b", rough: 0.8 });
defineMaterial("Suzhou_LotusPink", { map: "fabric", tint: "#f4a8c2", rough: 0.8 });
defineMaterial("Suzhou_Algae", { map: "stone", tint: "#6f7a5a", bump: 2 });             // the canal walls' wet line
defineMaterial("Suzhou_Cream", { map: "fabric", tint: "#f2e6c8", rough: 0.95 });         // banners

const TILE = "Suzhou_Tile", RIDGE = "Suzhou_Ridge", RED = "Suzhou_Red", WHITE = "Suzhou_White";
const TEAL = "Suzhou_Teal", BLUE = "Suzhou_Blue", GRANITE = "Suzhou_Granite";

// ---- small vector helpers ----
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => mul(a, 1 / (len(a) || 1));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const UP: V3 = [0, 0, 1];
// a box between two corners given in any order
const bb = (a: V3, b: V3, mat: string, bevel = 0): Geo =>
  boxBounds([Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])], [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])], mat, bevel);
// a thin disc facing along X or Y
function disc(r: number, c: V3, mat: string, axis: "x" | "y", thick = 1.6, segs = 16): Geo {
  const d = cylinderAt({ radius: r, height: thick, segments: segs, bottom: [0, 0, -thick / 2] }, mat);
  return translate(axis === "x" ? rotateY(d, 90) : rotateX(d, 90), c);
}
function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
const ellipsoid = (r: V3, c: V3, mat: string, segs = 10): Geo => scale(sphereCenter(1, [0, 0, 0], mat, segs), r).map((p) => ({ geo: p.geo.translate(...c), mat: p.mat }));

// ---- free-form surfaces ----
// A grid of points (rows x cols) into triangles with smooth normals; each triangle is wound so it
// faces along `hint` (a direction, or a function of the triangle's centre).
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
      const a = i * cols + j, b = a + cols, c = b + 1, d = a + 1;
      for (const [p, q, r] of [[a, b, c], [a, c, d]]) {
        const A = P[Math.floor(p / cols)][p % cols], B = P[Math.floor(q / cols)][q % cols], C = P[Math.floor(r / cols)][r % cols];
        const n = cross(sub(B, A), sub(C, A));
        if (len(n) < 1e-6) continue;
        const h = typeof hint === "function" ? hint(mul(add(add(A, B), C), 1 / 3)) : hint;
        if (dot(n, h) >= 0) idx.push(p, q, r);
        else idx.push(p, r, q);
      }
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const nor = geo.getAttribute("normal");
  for (let i = 0; i < nor.count; i++) {
    if (Math.abs(nor.getX(i)) + Math.abs(nor.getY(i)) + Math.abs(nor.getZ(i)) < 1e-4) {
      const h = typeof hint === "function" ? norm(hint([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]])) : norm(hint);
      nor.setXYZ(i, h[0], h[1], h[2]);
    }
  }
  return [{ geo, mat }];
}

// A flat polygon fanned from `c` (flat shaded), facing along `hint`.
function fan(c: V3, ring: V3[], mat: string, hint: V3, uvOf: (p: V3) => [number, number], closed = false): Geo {
  const pos: number[] = [], uv: number[] = [];
  const n = ring.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const B = ring[i], C = ring[(i + 1) % n];
    const nn = cross(sub(B, c), sub(C, c));
    if (len(nn) < 1e-6) continue;
    for (const p of dot(nn, hint) >= 0 ? [c, B, C] : [c, C, B]) {
      pos.push(...p);
      uv.push(...uvOf(p));
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return [{ geo, mat }];
}

// A rectangular section (w across, h up) swept along a path: curved beams, rails, ridges.
function sweep(path: V3[], w: number, h: number, mat: string, o: { swapUv?: boolean; caps?: boolean; up?: V3 } = {}): Geo {
  const n = path.length, up = o.up ?? UP;
  const T = path.map((_, i) => norm(sub(path[Math.min(n - 1, i + 1)], path[Math.max(0, i - 1)])));
  const S = T.map((t) => {
    let s = cross(t, up);
    if (len(s) < 1e-4) s = cross(t, [0, 1, 0]);
    return norm(s);
  });
  const N = T.map((t, i) => cross(S[i], t));
  const L: number[] = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1] + len(sub(path[i], path[i - 1])));
  const C = (i: number, a: number, b: number): V3 => add(path[i], add(mul(S[i], (a * w) / 2), mul(N[i], (b * h) / 2)));
  const nearest = (c: V3): V3 => {
    let best = path[0], bd = Infinity;
    for (const p of path) {
      const d = len(sub(c, p));
      if (d < bd) [best, bd] = [p, d];
    }
    return sub(c, best);
  };
  const out: Geo[] = [];
  for (const [a0, b0, a1, b1, span] of [[-1, -1, 1, -1, w], [1, -1, 1, 1, h], [1, 1, -1, 1, w], [-1, 1, -1, -1, h]]) {
    const P = path.map((_, i): V3[] => [C(i, a0, b0), C(i, a1, b1)]);
    const UV = L.map((l): [number, number][] => (o.swapUv ? [[0, l / 100], [span / 100, l / 100]] : [[l / 100, 0], [l / 100, span / 100]]));
    out.push(surface(P, UV, mat, nearest));
  }
  if (o.caps !== false) {
    for (const [i, s] of [[0, -1], [n - 1, 1]]) {
      const ring = [C(i, -1, -1), C(i, 1, -1), C(i, 1, 1), C(i, -1, 1)];
      out.push(fan(path[i], ring, mat, mul(T[i], s), (p) => [dot(p, S[i]) / 100, dot(p, N[i]) / 100], true));
    }
  }
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
  return [{ geo, mat }];
}

// A flat outline (a, b) with holes cut through it, extruded `depth`: along X from x = w0 (the
// outline in the YZ plane: a -> y, b -> z) or along Y over y in [w0, w0 + depth] (a -> x,
// b -> z). For arches, moon gates and the bridges' spandrels; box-style texture coordinates.
type Pts = [number, number][];
const area2 = (p: Pts) => p.reduce((s, [x, y], i) => { const [x2, y2] = p[(i + 1) % p.length]; return s + x * y2 - x2 * y; }, 0);
function extrude(outline: Pts, holes: Pts[], axis: "x" | "y", w0: number, depth: number, mat: string): Geo {
  const ccw = area2(outline) > 0 ? outline : [...outline].reverse();
  const shape = new THREE.Shape(ccw.map(([a, b]) => new THREE.Vector2(a, b)));
  for (const h of holes) shape.holes.push(new THREE.Path((area2(h) < 0 ? h : [...h].reverse()).map(([a, b]) => new THREE.Vector2(a, b))));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
  geo.clearGroups();
  // (a, b, w) into the world, keeping the winding (both maps have determinant +1)
  geo.applyMatrix4(axis === "x"
    ? new THREE.Matrix4().set(0, 0, 1, w0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1)
    : new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, -1, w0 + depth, 0, 1, 0, 0, 0, 0, 0, 1));
  const g = geo.index ? geo.toNonIndexed() : geo;
  const pos = g.getAttribute("position"), nor = g.getAttribute("normal");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const n = [Math.abs(nor.getX(i)), Math.abs(nor.getY(i)), Math.abs(nor.getZ(i))];
    const p = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    const ax = n[0] >= n[1] && n[0] >= n[2] ? 0 : n[1] >= n[2] ? 1 : 2;
    const [a, b] = [0, 1, 2].filter((k) => k !== ax);
    uv[i * 2] = p[a === 2 ? b : a] / 100;
    uv[i * 2 + 1] = p[a === 2 ? a : b] / 100;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return [{ geo: g, mat }];
}
// An arch outline: w wide, h to the crown (a round head on straight sides), from z = 0.
function archPts(w: number, h: number, segs = 14, y0 = 0, z0 = 0): Pts {
  const r = w / 2, spring = Math.max(0, h - r);
  const pts: Pts = [[y0 - r, z0], [y0 + r, z0], [y0 + r, z0 + spring]];
  for (let i = 1; i < segs; i++) {
    const a = (i / segs) * Math.PI;
    pts.push([y0 + r * Math.cos(a), z0 + spring + r * Math.sin(a)]);
  }
  pts.push([y0 - r, z0 + spring]);
  return pts;
}
function circlePts(r: number, cy: number, cz: number, segs = 28): Pts {
  return Array.from({ length: segs }, (_, i): [number, number] => [cy + r * Math.cos((i / segs) * Math.PI * 2), cz + r * Math.sin((i / segs) * Math.PI * 2)]);
}

// A flat tiled slab: e0-e1 along the eave, r0-r1 the high edge (top surface), `th` thick; the
// tile channels run down the slope.
function slab(e0: V3, e1: V3, r1: V3, r0: V3, th: number, mat = TILE, under = "WoodShade", edge = "Suzhou_TileEnd"): Geo {
  const W = len(sub(e1, e0)), D = len(sub(r0, e0));
  const top = [[e0, e1], [r0, r1]];
  const uvTop: [number, number][][] = [[[0, D / 100], [W / 100, D / 100]], [[0, 0], [W / 100, 0]]];
  const down: V3 = [0, 0, -th];
  const bot = top.map((row) => row.map((p) => add(p, down)));
  const uvBot: [number, number][][] = [[[0, 0], [0, W / 100]], [[D / 100, 0], [D / 100, W / 100]]];
  const c = mul(add(add(e0, e1), add(r0, r1)), 0.25);
  const out: Geo[] = [surface(top, uvTop, mat, UP), surface(bot, uvBot, under, [0, 0, -1])];
  const corners = [e0, e1, r1, r0];
  for (let i = 0; i < 4; i++) {
    const a = corners[i], b = corners[(i + 1) % 4];
    const mid = mul(add(a, b), 0.5), l = len(sub(b, a));
    out.push(surface([[a, b], [add(a, down), add(b, down)]], [[[0, 0], [l / 100, 0]], [[0, th / 100], [l / 100, th / 100]]], i === 0 ? edge : under, sub(mid, c)));
  }
  return merge(...out);
}

// ---- the Chinese roof ----
// Concave slopes (flat at the eaves, steep at the ridge) whose corners sweep up and out, each
// corner ending in an upturned horn; a raised ridge with curled ornaments at its ends. Ridge
// along X. kind: "hip" (a pyramid when ridge is 0), "xieshan" (a hip below, a gable on top) or
// "gable". hx, hy: the eave's half extent; z: eave height; h: rise.
interface RoofSpec {
  hx: number;
  hy: number;
  z: number;
  h: number;
  kind: "hip" | "xieshan" | "gable";
  ridge?: number;    // hip: half ridge length (default hx - hy)
  gableAt?: number;  // xieshan: share of the slope where the gable starts
  curve?: number;    // profile exponent: 1 straight, higher = flatter eaves and steeper top
  lift?: number;     // corner upturn
  flare?: number;    // corners pushed outward
  reach?: number;    // how far along the eave the upturn spreads
  th?: number;       // thickness
  tMax?: number;     // hip: stop the slopes this far up (a skirt round a storey above; no ridge)
  mat?: string;
  under?: string;
  edge?: string;
  tileEnd?: string;
  ridgeMat?: string;
  gableMat?: string;
  barge?: string;     // bargeboards
  gableInset?: number;
  gableBase?: number;
  gableHalf?: number;
  ends?: boolean;     // gable ends (verge, bargeboards, tympanum); false for wall copings
  cap?: boolean;      // ridge
  curls?: number;     // curled ridge-end ornaments, this big (0: none)
  horns?: number;     // upturned horn at each corner, this long (default from the lift)
  pearl?: boolean;    // a flaming pearl mid ridge
  nt?: number;
  ns?: number;
}

function roof(r: RoofSpec): Geo {
  const mat = r.mat ?? TILE, under = r.under ?? "WoodShade", edgeM = r.edge ?? "WoodDark";
  const ridgeM = r.ridgeMat ?? RIDGE, bargeM = r.barge ?? "WoodDark";
  const th = r.th ?? 18, curve = r.curve ?? 1.7, lift = r.lift ?? 0, flare = r.flare ?? 0;
  const reach = r.reach ?? Math.min(r.hx, r.hy) * 0.8;
  const nt = r.nt ?? 8, ns = r.ns ?? 12, kind = r.kind;
  const tb = kind === "xieshan" ? r.gableAt ?? 0.5 : kind === "hip" ? 1 : 0;
  const rid = kind === "hip" ? Math.max(0, r.ridge ?? r.hx - r.hy) : kind === "xieshan" ? r.hx - r.hy * tb : r.hx;
  const tMax = kind === "hip" ? r.tMax ?? 1 : 1;
  const ax = (t: number) => (kind === "gable" ? r.hx : kind === "hip" ? lerp(r.hx, rid, t) : t < tb ? lerp(r.hx, rid, t / tb) : rid);
  const ay = (t: number) => r.hy * (1 - t);
  const zt = (t: number) => r.z + r.h * Math.pow(t, curve);
  const turn = (t: number, d: number) => {
    const a = Math.max(0, 1 - d / reach);
    return a * a * (1 - t) * (1 - t);
  };
  // side 0: -Y, 1: +Y, 2: -X, 3: +X; s in [-1, 1] along the side
  const P = (side: number, t: number, s: number): V3 => {
    const corner = 1 - Math.abs(s), sg = Math.sign(s);
    if (side < 2) {
      const sy = side === 0 ? -1 : 1;
      const w = kind === "gable" ? 0 : turn(t, corner * r.hx);
      return [s * ax(t) + sg * flare * w, sy * ay(t) + sy * flare * w, zt(t) + lift * w];
    }
    const sx = side === 2 ? -1 : 1;
    const w = turn(t, corner * r.hy);
    return [sx * ax(t) + sx * flare * w, s * ay(t) + sg * flare * w, zt(t) + lift * w];
  };
  const ts: number[] = [];
  if (kind === "xieshan") {
    const n1 = Math.max(2, Math.round(nt * tb)), n2 = Math.max(2, nt - n1);
    for (let k = 0; k <= n1; k++) ts.push(tb * Math.pow(k / n1, 1.2));
    for (let k = 1; k <= n2; k++) ts.push(tb + ((1 - tb) * k) / n2);
  } else for (let k = 0; k <= nt; k++) ts.push(tMax * Math.pow(k / nt, 1.2));
  const ss = Array.from({ length: ns + 1 }, (_, j) => {
    const u = -1 + (2 * j) / ns;
    return Math.sign(u) * (1 - Math.pow(1 - Math.abs(u), 1.5));
  });
  const out: Geo[] = [];
  const down: V3 = [0, 0, -th];
  const outward: V3[] = [[0, -1, 0], [0, 1, 0], [-1, 0, 0], [1, 0, 0]];
  for (const side of kind === "gable" ? [0, 1] : [0, 1, 2, 3]) {
    const T = side < 2 ? ts : ts.filter((t) => t <= tb + 1e-9);
    const top = T.map((t) => ss.map((s) => P(side, t, s)));
    // slope length down each column (V grows downhill so each course's lip sits low)
    const vl = top.map(() => ss.map(() => 0));
    for (let i = T.length - 2; i >= 0; i--) for (let j = 0; j < ss.length; j++) vl[i][j] = vl[i + 1][j] + len(sub(top[i + 1][j], top[i][j]));
    const along = (p: V3) => (side < 2 ? p[0] : p[1]) / 100;
    const uvTop = top.map((row, i) => row.map((p, j): [number, number] => [along(p) * 0.75, vl[i][j] / 100]));
    out.push(surface(top, uvTop, mat, UP));
    const bot = top.map((row) => row.map((p) => add(p, down)));
    const uvBot = top.map((row, i) => row.map((p, j): [number, number] => [vl[i][j] / 100, along(p)]));
    out.push(surface(bot, uvBot, under, [0, 0, -1]));
    // the eave's edge: round tile ends over a dark fascia
    const midE = top[0].map((p) => add(p, mul(down, 0.5)));
    out.push(surface([top[0], midE], [top[0].map((p): [number, number] => [along(p), 0]), top[0].map((p): [number, number] => [along(p), (th * 0.5) / 100])], r.tileEnd ?? "Suzhou_TileEnd", outward[side]));
    out.push(surface([midE, bot[0]], [top[0].map((p): [number, number] => [along(p), 0]), top[0].map((p): [number, number] => [along(p), (th * 0.5) / 100])], edgeM, outward[side]));
    // the top edge of a skirt (hidden under the storey above, but closed all the same)
    if (tMax < 1) {
      const last = top.length - 1;
      out.push(surface([top[last], bot[last]], [top[last].map((p): [number, number] => [along(p), 0]), top[last].map((p): [number, number] => [along(p), th / 100])], under, mul(outward[side], -1)));
    }
    // verge edges of the gable part
    if (side < 2 && kind !== "hip" && r.ends !== false) {
      for (const j of [0, ss.length - 1]) {
        const rowsT = T.map((t, i) => [t, i] as const).filter(([t]) => t >= tb - 1e-9);
        const a = rowsT.map(([, i]) => top[i][j]), b = rowsT.map(([, i]) => bot[i][j]);
        out.push(surface([a, b], [a.map((p): [number, number] => [p[1] / 100, 0]), a.map((p): [number, number] => [p[1] / 100, th / 100])], edgeM, [j === 0 ? -1 : 1, 0, 0]));
      }
    }
  }
  const zTop = zt(1);
  // gable ends: tympanum, bargeboards, verge ridges, a hanging-fish ornament
  if (kind !== "hip" && r.ends !== false) {
    const nf = Math.max(6, Math.round(nt * 1.6));
    const fine = Array.from({ length: nf + 1 }, (_, k) => tb + ((1 - tb) * k) / nf);
    for (const sx of [-1, 1]) {
      const xg = sx * (rid - (r.gableInset ?? 10));
      const zb = r.gableBase ?? zt(tb);
      const gh = r.gableHalf ?? Infinity;
      const half = fine.map((t) => {
        const p = P(0, t, sx);
        return [Math.max(p[1], -gh), Math.max(p[2] - th - 2, zb)] as [number, number];
      });
      const ring: V3[] = [[xg, half[0][0], zb], ...half.map(([y, z]): V3 => [xg, y, z]), ...half.slice(0, -1).reverse().map(([y, z]): V3 => [xg, -y, z]), [xg, -half[0][0], zb]];
      out.push(fan([xg, 0, zb], ring, r.gableMat ?? RED, [sx, 0, 0], (p) => [p[1] / 100, p[2] / 100]));
      const vpath = [...fine.map((t) => P(0, t, sx)), ...fine.slice(0, -1).reverse().map((t) => P(1, t, sx))].map((p): V3 => [p[0] + sx * 5, p[1], p[2] - th / 2 + 2]);
      out.push(sweep(vpath, 10, th + 14, bargeM));
      for (const side of [0, 1]) {
        const k = 1 - 16 / Math.max(rid, 40);
        out.push(sweep(fine.map((t) => add(P(side, t, sx * k), [0, 0, 7])), 16, 12, ridgeM));
      }
      // the hanging fish (xuanyu) under the gable's peak
      const fz = zTop - th - 26;
      out.push(rotateX(boxAt([4, 26, 26], [xg + sx * 7, 0, fz - 13], "GoldTrim"), 45, [xg + sx * 7, 0, fz]), boxAt([5, 8, 30], [xg + sx * 7, 0, fz - 40], "GoldTrim"));
      if (kind === "xieshan") {
        const z0 = zt(tb);
        out.push(boxAt([24, 2 * ay(tb) + 10, th + 12], [sx * rid, 0, z0 - th], ridgeM, 2));
      }
    }
  }
  // hip ridges at the corners, each running out into an upturned horn
  if (kind !== "gable") {
    const T = ts.filter((t) => t <= Math.min(tb, tMax) + 1e-9);
    for (const side of [0, 1]) for (const s of [-1, 1]) out.push(sweep(T.map((t) => add(P(side, t, s), [0, 0, 7])), 17, 14, ridgeM));
    const hl = r.horns ?? Math.max(22, Math.min(50, lift * 0.6));
    if (hl > 0)
      for (const side of [0, 1])
        for (const s of [-1, 1]) {
          const c = add(P(side, 0, s), [0, 0, 6]), d = norm([Math.sign(c[0]), Math.sign(c[1]), 0]);
          out.push(limb([c, add(c, add(mul(d, hl * 0.35), [0, 0, hl * 0.2])), add(c, add(mul(d, hl * 0.62), [0, 0, hl * 0.6])), add(c, add(mul(d, hl * 0.7), [0, 0, hl * 1.05]))], 9 + th * 0.2, 3, ridgeM, { seg: 6, step: 14 }));
        }
  }
  // the ridge, curled ornaments at its ends, a pearl in the middle
  const rl = kind === "gable" ? r.hx : rid;
  if (r.cap !== false && tMax >= 1 && rl > 5) {
    const tiled = r.ends === false, ext = tiled ? 0 : 10;
    out.push(boxAt([2 * rl + ext * 2, 30, 44], [0, 0, zTop - 30], ridgeM, tiled ? 0 : 3));
    out.push(boxAt([2 * rl + ext * 2 - 6, 34, 6], [0, 0, zTop + 8], r.tileEnd ?? "Suzhou_TileEnd"));
    out.push(cylinderBetween([-rl - ext + 4, 0, zTop + 20], [rl + ext - 4, 0, zTop + 20], 9, 8, ridgeM));
    const cs = r.curls ?? (tiled ? 0 : 1);
    if (cs > 0)
      for (const sx of [-1, 1]) {
        const e: V3 = [sx * (rl + ext), 0, zTop + 6];
        out.push(boxAt([30 * cs, 36 * cs, 34 * cs], [e[0] - sx * 10 * cs, 0, zTop - 24], ridgeM, 2));
        out.push(limb([e, add(e, [sx * 10 * cs, 0, 34 * cs]), add(e, [sx * 4 * cs, 0, 66 * cs]), add(e, [-sx * 16 * cs, 0, 80 * cs]), add(e, [-sx * 32 * cs, 0, 70 * cs]), add(e, [-sx * 34 * cs, 0, 52 * cs])], 13 * cs, 4.5 * cs, ridgeM, { seg: 7, step: 12 }));
      }
    if (r.pearl) {
      out.push(lathe([[0, 0], [20, 2], [14, 14], [8, 20], [0, 22]], 8, ridgeM, [0, 0, zTop + 26]));
      out.push(sphereCenter(13, [0, 0, zTop + 58], "GoldTrim", 10));
      out.push(limb([[0, 0, zTop + 66], [4, 0, zTop + 86], [-3, 0, zTop + 104]], 6, 1.5, "GoldTrim", { seg: 5 }));
    }
  }
  return merge(...out);
}

// A pyramid roof over a regular n-gon (a pavilion, a pagoda's eaves): concave facets, the corners
// lifted into horns, a hip ridge down every corner. R: the eave's corner radius; a flat side faces
// -X. tMax < 1 stops it short of the apex (a skirt round a storey above).
interface PolyRoofSpec {
  n: number;
  R: number;
  z: number;
  h: number;
  curve?: number;
  lift?: number;
  flare?: number;
  reach?: number;
  th?: number;
  tMax?: number;
  mat?: string;
  under?: string;
  tileEnd?: string;
  ridgeMat?: string;
  horns?: number;
  bells?: boolean;
  nt?: number;
  ns?: number;
}
const cornerDir = (n: number, j: number): V3 => {
  const a = Math.PI - Math.PI / n + (j * 2 * Math.PI) / n;
  return [Math.cos(a), Math.sin(a), 0];
};
function polyRoof(o: PolyRoofSpec): Geo {
  const n = o.n, th = o.th ?? 16, curve = o.curve ?? 1.7, lift = o.lift ?? 0, flare = o.flare ?? 0;
  const half = o.R * Math.sin(Math.PI / n), reach = Math.min(o.reach ?? half * 0.85, half * 0.98);
  const tMax = o.tMax ?? 1, nt = o.nt ?? 6, ns = o.ns ?? 8;
  const mat = o.mat ?? TILE, under = o.under ?? "WoodShade", ridgeM = o.ridgeMat ?? RIDGE;
  const P = (k: number, t: number, s: number): V3 => {
    const A = cornerDir(n, k), B = cornerDir(n, k + 1), f = (s + 1) / 2;
    const ex = lerp(A[0], B[0], f) * o.R, ey = lerp(A[1], B[1], f) * o.R;
    const w = Math.max(0, 1 - ((1 - Math.abs(s)) * half) / reach) ** 2 * (1 - t) ** 2;
    const c = s < 0 ? A : B;
    return [ex * (1 - t) + c[0] * flare * w, ey * (1 - t) + c[1] * flare * w, o.z + o.h * Math.pow(t, curve) + lift * w];
  };
  const ts = Array.from({ length: nt + 1 }, (_, k) => tMax * Math.pow(k / nt, 1.2));
  const ss = Array.from({ length: ns + 1 }, (_, j) => {
    const u = -1 + (2 * j) / ns;
    return Math.sign(u) * (1 - Math.pow(1 - Math.abs(u), 1.5));
  });
  const out: Geo[] = [];
  const down: V3 = [0, 0, -th];
  for (let k = 0; k < n; k++) {
    const A = cornerDir(n, k), B = cornerDir(n, k + 1);
    const tan = norm(sub(B, A)), outN = norm(add(A, B));
    const top = ts.map((t) => ss.map((s) => P(k, t, s)));
    const vl = top.map(() => ss.map(() => 0));
    for (let i = ts.length - 2; i >= 0; i--) for (let j = 0; j < ss.length; j++) vl[i][j] = vl[i + 1][j] + len(sub(top[i + 1][j], top[i][j]));
    const along = (p: V3) => dot(p, tan) / 100;
    out.push(surface(top, top.map((row, i) => row.map((p, j): [number, number] => [along(p) * 0.75, vl[i][j] / 100])), mat, UP));
    const bot = top.map((row) => row.map((p) => add(p, down)));
    out.push(surface(bot, top.map((row, i) => row.map((p, j): [number, number] => [vl[i][j] / 100, along(p)])), under, [0, 0, -1]));
    const midE = top[0].map((p) => add(p, mul(down, 0.5)));
    const uvE = (z: number) => top[0].map((p): [number, number] => [along(p), z]);
    out.push(surface([top[0], midE], [uvE(0), uvE(th * 0.005)], o.tileEnd ?? "Suzhou_TileEnd", outN));
    out.push(surface([midE, bot[0]], [uvE(0), uvE(th * 0.005)], "WoodDark", outN));
    if (tMax < 1) {
      const l = top.length - 1;
      out.push(surface([top[l], bot[l]], [uvE(0), uvE(th / 100)], under, mul(outN, -1)));
    }
    // the hip ridge down corner k + 1, and its horn
    out.push(sweep(ts.map((t) => add(P(k, t, 1), [0, 0, 6])), 15, 12, ridgeM));
    const hl = o.horns ?? Math.max(20, Math.min(46, lift * 0.6));
    const c = add(P(k, 0, 1), [0, 0, 5]);
    if (hl > 0) out.push(limb([c, add(c, add(mul(B, hl * 0.35), [0, 0, hl * 0.2])), add(c, add(mul(B, hl * 0.62), [0, 0, hl * 0.6])), add(c, add(mul(B, hl * 0.7), [0, 0, hl * 1.05]))], 8 + th * 0.2, 2.6, ridgeM, { seg: 6, step: 14 }));
    if (o.bells) {
      const b = add(c, add(mul(B, hl * 0.3), [0, 0, -4]));
      out.push(cylinderBetween(b, add(b, [0, 0, -16]), 1, 4, "Bronze"), cylinderAt({ rBot: 7, rTop: 3, height: 13, segments: 8, bottom: add(b, [0, 0, -29]) }, "Bronze"));
    }
  }
  return merge(...out);
}

// ---- shared bits ----
// A bracket set (dougong) on a beam at (x, y, z) reaching `out` toward -X: a great block, arms
// crossed along X and Y, small blocks, a longer crossed pair, small blocks again (k scales it;
// 64 k tall).
function dougong(x: number, y: number, z: number, out: number, k = 1, arm = TEAL, block = BLUE): Geo {
  const P: Geo[] = [boxAt([30 * k, 30 * k, 16 * k], [x, y, z], block)];
  P.push(boxAt([out * 0.6, 12 * k, 14 * k], [x - out * 0.3 + 6 * k, y, z + 16 * k], arm));
  P.push(boxAt([12 * k, 70 * k, 14 * k], [x, y, z + 16 * k], arm));
  for (const yy of [-30 * k, 30 * k]) P.push(boxAt([16 * k, 16 * k, 10 * k], [x, y + yy, z + 30 * k], block));
  P.push(boxAt([16 * k, 16 * k, 10 * k], [x - out * 0.55, y, z + 30 * k], block));
  P.push(boxAt([out * 1.1, 12 * k, 14 * k], [x - out * 0.5, y, z + 40 * k], arm));
  P.push(boxAt([12 * k, 108 * k, 14 * k], [x - out * 0.55, y, z + 40 * k], arm));
  for (const yy of [-48 * k, 48 * k]) P.push(boxAt([16 * k, 16 * k, 10 * k], [x - out * 0.55, y + yy, z + 54 * k], block));
  P.push(boxAt([16 * k, 16 * k, 10 * k], [x - out * 1.02, y, z + 54 * k], block));
  P.push(boxAt([3, 13 * k, 14 * k], [x - out * 1.07, y, z + 40 * k], "GoldTrim"));
  return merge(...P);
}
// Bracket sets all round a rectangle of walls (half extents hx, hy) at height z: `ys` along the
// -X and +X walls, `xs` along the -Y and +Y walls, and the eave purlin they carry.
function bracketRing(hx: number, hy: number, z: number, out: number, ys: number[], xs: number[], k = 1, arm = TEAL, block = BLUE): Geo {
  const front = merge(...ys.map((y) => dougong(-hx, y, z, out, k, arm, block)), boxAt([16 * k, 2 * hy + 2 * out, 14 * k], [-hx - out, 0, z + 64 * k], arm));
  const side = merge(...xs.map((x) => dougong(-hy, x, z, out, k, arm, block)), boxAt([16 * k, 2 * hx + 2 * out, 14 * k], [-hy - out, 0, z + 64 * k], arm));
  return merge(front, rotateZ(front, 180), rotateZ(side, 90), rotateZ(side, -90));
}
// n numbers evenly from a to b
const spread = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => (n === 1 ? (a + b) / 2 : a + ((b - a) * i) / (n - 1)));

// A painted beam (a teal beam with blue bands and gold edges toward its ends) on the plane x = x0
// facing -X, from y0 to y1, z0 up, h tall.
function paintedBeam(x0: number, y0: number, y1: number, z0: number, h: number, d = 20, both = false): Geo {
  const L = y1 - y0, e = Math.min(60, L * 0.18);
  const P: Geo[] = [bb([x0, y0, z0], [x0 + d, y1, z0 + h], TEAL)];
  for (const [xa, xb] of both ? [[x0 - 1, x0 + 2], [x0 + d - 2, x0 + d + 1]] : [[x0 - 1, x0 + 2]]) {
    P.push(bb([xa, y0 + e, z0 + 2], [xb, y1 - e, z0 + h - 2], BLUE));
    P.push(bb([xa - 0.5, y0 + e - 3, z0 + 1], [xb + 0.5, y0 + e, z0 + h - 1], "GoldTrim"), bb([xa - 0.5, y1 - e, z0 + 1], [xb + 0.5, y1 - e + 3, z0 + h - 1], "GoldTrim"));
  }
  return merge(...P);
}

// A red silk lantern (round, gold caps, a red tassel) hanging from `top`, r round.
function lantern(r: number, top: V3, body = "Suzhou_Lantern"): Geo {
  const hz = r * 0.82, c: V3 = [top[0], top[1], top[2] - 8 - hz];
  const zb = c[2] - hz - 3;
  return merge(
    cylinderBetween(top, [top[0], top[1], top[2] - 8], 0.9, 4, "Suzhou_Ink"),
    cylinderAt({ radius: r * 0.48, height: 6, segments: 10, bottom: [c[0], c[1], c[2] + hz - 3] }, "GoldTrim"),
    ellipsoid([r, r, hz], c, body, 12),
    cylinderAt({ radius: r * 0.48, height: 6, segments: 10, bottom: [c[0], c[1], zb] }, "GoldTrim"),
    cylinderBetween([c[0], c[1], zb], [c[0], c[1], zb - r * 0.45], 1.1, 4, "Suzhou_Tassel"),
    cylinderAt({ rBot: r * 0.22, rTop: r * 0.07, height: r * 0.8, segments: 8, bottom: [c[0], c[1], zb - r * 0.45 - r * 0.8] }, "FabricRed"),
  );
}

// A lattice window on the plane x = x0 facing -X: paper (or a glow) behind a dark frame, a grid
// of slats and an inner frame (the Chinese "step" lattice).
function lattice(x0: number, y0: number, y1: number, z0: number, z1: number, frame = "WoodShade", back = "PaperShoji", step = 15): Geo {
  const P: Geo[] = [bb([x0, y0, z0], [x0 + 4, y1, z1], back)];
  const f = 7;
  P.push(bb([x0 - 6, y0 - f, z0 - f], [x0 + 2, y1 + f, z0], frame), bb([x0 - 6, y0 - f, z1], [x0 + 2, y1 + f, z1 + f], frame));
  P.push(bb([x0 - 6, y0 - f, z0], [x0 + 2, y0, z1], frame), bb([x0 - 6, y1, z0], [x0 + 2, y1 + f, z1], frame));
  const W = y1 - y0, H = z1 - z0;
  const nx = Math.max(2, Math.round(W / step)), nz = Math.max(2, Math.round(H / step));
  for (let i = 1; i < nx; i++) P.push(bb([x0 - 3, y0 + (W * i) / nx - 1.3, z0], [x0, y0 + (W * i) / nx + 1.3, z1], frame));
  for (let i = 1; i < nz; i++) P.push(bb([x0 - 3, y0, z0 + (H * i) / nz - 1.3], [x0, y1, z0 + (H * i) / nz + 1.3], frame));
  // the inner frame
  const iy = W * 0.28, iz = H * 0.28;
  P.push(bb([x0 - 5, y0 + iy, z0 + iz - 2], [x0 - 2, y1 - iy, z0 + iz + 2], frame), bb([x0 - 5, y0 + iy, z1 - iz - 2], [x0 - 2, y1 - iy, z1 - iz + 2], frame));
  P.push(bb([x0 - 5, y0 + iy - 2, z0 + iz], [x0 - 2, y0 + iy + 2, z1 - iz], frame), bb([x0 - 5, y1 - iy - 2, z0 + iz], [x0 - 2, y1 - iy + 2, z1 - iz], frame));
  return merge(...P);
}

// A wooden railing from a to b (its foot), h tall: posts, balusters, a top rail and a sill.
function railing(a: V3, b: V3, h: number, mat = RED, step = 30): Geo {
  const L = len(sub(b, a)), n = Math.max(1, Math.round(L / 90)), m = Math.max(2, Math.round(L / step));
  const P: Geo[] = [];
  for (let i = 0; i <= n; i++) {
    const p = add(a, mul(sub(b, a), i / n));
    P.push(boxAt([9, 9, h + 6], p, mat));
  }
  for (let i = 1; i < m; i++) {
    const p = add(a, mul(sub(b, a), i / m));
    P.push(boxAt([4, 4, h - 14], add(p, [0, 0, 8]), mat));
  }
  P.push(beamBetween(add(a, [0, 0, h - 2]), add(b, [0, 0, h - 2]), 9, 7, mat), beamBetween(add(a, [0, 0, 5]), add(b, [0, 0, 5]), 8, 8, mat));
  return merge(...P);
}

// A stone balustrade from a to b (its foot), h tall: posts with round heads, carved panels
// between, a rail along the top.
function balustrade(a: V3, b: V3, h = 70, mat = "Suzhou_Marble", step = 120): Geo {
  const L = len(sub(b, a)), n = Math.max(1, Math.round(L / step));
  const P: Geo[] = [];
  for (let i = 0; i <= n; i++) {
    const p = add(a, mul(sub(b, a), i / n));
    P.push(boxAt([16, 16, h], p, mat), lathe([[8, 0], [10, 6], [5, 16], [0, 20]], 6, mat, add(p, [0, 0, h])));
  }
  P.push(beamBetween(add(a, [0, 0, h - 14]), add(b, [0, 0, h - 14]), 10, 9, mat));
  P.push(beamBetween(add(a, [0, 0, 18]), add(b, [0, 0, 18]), 7, h - 40, mat));
  P.push(beamBetween(add(a, [0, 0, 4]), add(b, [0, 0, 4]), 12, 8, mat));
  return merge(...P);
}

// A paper couplet (red strips with black characters) either side of a door at y = ±w/2 on the
// plane x = x0, and a strip across the top.
function couplets(x0: number, w: number, z0: number, h: number): Geo {
  const P: Geo[] = [];
  for (const s of [-1, 1]) {
    const y = s * (w / 2 + 16);
    P.push(bb([x0 - 1.5, y - 11, z0], [x0, y + 11, z0 + h], "FabricRed"));
    for (let k = 0; k < 5; k++) P.push(bb([x0 - 2, y - 5, z0 + 12 + k * (h - 24) / 5], [x0 - 1.5, y + 5, z0 + 20 + k * (h - 24) / 5], "Suzhou_Ink"));
  }
  P.push(bb([x0 - 1.5, -w * 0.32, z0 + h + 8], [x0, w * 0.32, z0 + h + 30], "FabricRed"));
  for (let k = 0; k < 4; k++) P.push(bb([x0 - 2, -w * 0.25 + k * w * 0.16, z0 + h + 14], [x0 - 1.5, -w * 0.25 + k * w * 0.16 + 10, z0 + h + 24], "Suzhou_Ink"));
  return merge(...P);
}

// A signboard on the plane x = x0 facing -X: black lacquer, a gold border, `n` gold characters.
function signboard(x0: number, yc: number, zc: number, w: number, h: number, n: number, vertical = false): Geo {
  const P: Geo[] = [bb([x0 - 4, yc - w / 2, zc - h / 2], [x0 + 4, yc + w / 2, zc + h / 2], "Suzhou_Ink", 1)];
  P.push(bb([x0 - 5, yc - w / 2 + 3, zc + h / 2 - 7], [x0 - 4, yc + w / 2 - 3, zc + h / 2 - 3], "GoldTrim"), bb([x0 - 5, yc - w / 2 + 3, zc - h / 2 + 3], [x0 - 4, yc + w / 2 - 3, zc - h / 2 + 7], "GoldTrim"));
  P.push(bb([x0 - 5, yc - w / 2 + 3, zc - h / 2 + 3], [x0 - 4, yc - w / 2 + 7, zc + h / 2 - 3], "GoldTrim"), bb([x0 - 5, yc + w / 2 - 7, zc - h / 2 + 3], [x0 - 4, yc + w / 2 - 3, zc + h / 2 - 3], "GoldTrim"));
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n;
    const cy = vertical ? yc : yc - w / 2 + w * t, cz = vertical ? zc + h / 2 - h * t : zc;
    const s = Math.min(vertical ? w : w / n, vertical ? h / n : h) * 0.3;
    P.push(bb([x0 - 6, cy - s, cz + s * 0.6], [x0 - 4, cy + s, cz + s * 0.85], "GoldTrim"), bb([x0 - 6, cy - 1.5, cz - s], [x0 - 4, cy + 1.5, cz + s], "GoldTrim"));
    P.push(bb([x0 - 6, cy - s * 0.8, cz - s * 0.2], [x0 - 4, cy + s * 0.8, cz + s * 0.05], "GoldTrim"));
  }
  return merge(...P);
}

// ---- items ----

// The pagoda by the harbour, which is also its lighthouse: seven octagonal storeys of whitewash
// and crimson columns on a granite podium, each under green glazed eaves whose corners curl up
// into horns hung with bells; balconies with red railings, arched doors on four sides, lattice
// windows on the others; the top storey a lantern room of glowing lattice, the spire above it.
function pagoda(): Geo {
  const P: Geo[] = [];
  const oct = (r: number, z: number, h: number, mat: string) => rotateZ(cylinderAt({ radius: r, height: h, segments: 8, bottom: [0, 0, z] }, mat), 22.5);
  const at = (r: number, j: number, z: number): V3 => add(mul(cornerDir(8, j), r), [0, 0, z]);
  const C8 = Math.cos(Math.PI / 8), S8 = Math.sin(Math.PI / 8);
  // the podium: two octagonal steps, stairs up the front, a balustrade round the top
  P.push(oct(640, 0, 46, "Suzhou_GraniteDark"), oct(592, 46, 44, GRANITE), oct(598, 86, 8, "Suzhou_GraniteDark"));
  for (let j = 1; j < 8; j++) P.push(balustrade(at(570, j, 94), at(570, j + 1, 94), 62));
  // (the front side: the balustrade either side of the stairs)
  P.push(balustrade(at(570, 0, 94), add(mul(add(cornerDir(8, 0), cornerDir(8, 1)), 570 / 2), [0, -150 / C8, 94]), 62));
  P.push(balustrade(add(mul(add(cornerDir(8, 0), cornerDir(8, 1)), 570 / 2), [0, 150 / C8, 94]), at(570, 1, 94), 62));
  for (let k = 0; k < 4; k++) P.push(boxAt([40, 300, 94 - k * 23], [-592 * C8 - 20 - k * 40, 0, 0], GRANITE, 2));
  for (const s of [-1, 1]) P.push(bb([-592 * C8 - 170, s * 150, 0], [-592 * C8, s * 176, 70], "Suzhou_GraniteDark", 2));
  const RW = [380, 346, 316, 292, 270, 250, 232];
  const HW = [312, 234, 224, 214, 204, 196, 186];
  let z0 = 94;
  for (let i = 0; i < 7; i++) {
    const rw = RW[i], hw = HW[i], ap = rw * C8, side = 2 * rw * S8, top = i === 6;
    // body and corner columns
    P.push(oct(rw - 8, z0, hw, top ? "Suzhou_Glow" : WHITE));
    for (let j = 0; j < 8; j++) P.push(cylinderAt({ radius: i === 0 ? 17 : 14, height: hw, segments: 6, bottom: at(rw, j, z0) }, RED));
    // one side (facing -X), turned to the other seven
    const s: Geo[] = [
      bb([-ap - 7, -side / 2, z0], [-ap + 6, side / 2, z0 + 14], RED),
      bb([-ap - 9, -side / 2, z0 + hw - 30], [-ap + 4, side / 2, z0 + hw - 12], RED),
      bb([-ap - 7, -side / 2, z0 + hw - 12], [-ap + 4, side / 2, z0 + hw + 10], TEAL),
      bb([-ap - 8, -side / 2 + 20, z0 + hw - 9], [-ap - 6, side / 2 - 20, z0 + hw + 7], BLUE),
    ];
    // corbels under the eaves
    for (const y of [-side / 4, side / 4]) {
      s.push(boxAt([30, 16, 14], [-ap - 14, y, z0 + hw + 10], BLUE));
      s.push(boxAt([52, 14, 14], [-ap - 24, y, z0 + hw + 24], TEAL));
    }
    const door: Geo[] = [], win: Geo[] = [];
    if (top) {
      // the lantern room: glowing lattice screens all round
      win.push(lattice(-ap - 4, -side / 2 + 18, side / 2 - 18, z0 + 22, z0 + hw - 38, RED, "Suzhou_Glow", 18));
      door.push(...win);
    } else {
      const dw = i === 0 ? 130 : 84, dh = i === 0 ? 236 : hw * 0.72;
      door.push(translate(extrude(archPts(dw, dh, 8), [], "x", -ap - 5, 7, "Suzhou_Ink"), [0, 0, z0 + 14]));
      door.push(translate(extrude(archPts(dw + 26, dh + 13, 8), [archPts(dw, dh, 8)], "x", -ap - 9, 8, RED), [0, 0, z0 + 14]));
      if (i === 0) for (const yy of [-1, 1]) door.push(bb([-ap - 8, yy * (dw / 2 + 13) - 10, z0 + 14], [-ap - 5, yy * (dw / 2 + 13) + 10, z0 + 180], "FabricRed"));
      if (i < 3) win.push(lattice(-ap - 4, -side / 4 - 6, side / 4 + 6, z0 + hw * 0.35, z0 + hw * 0.35 + Math.min(110, side / 2 + 12), "WoodShade", "PaperShoji", 17));
      else win.push(disc(32, [-ap - 2, 0, z0 + hw * 0.5], RED, "x", 6, 12), disc(25, [-ap - 5, 0, z0 + hw * 0.5], "Suzhou_Ink", "x", 2, 12));
    }
    for (let j = 0; j < 8; j++) P.push(rotateZ(merge(...s, ...(j % 2 === 0 ? door : win)), j * 45));
    // the eaves (green glazed), a skirt up to the next storey's balcony, or the top roof
    const zE = z0 + hw + 48, Re = rw + (i === 0 ? 190 : 150);
    if (!top) {
      const rn = RW[i + 1], tMax = 1 - (rn + 50) / Re, rise = 76, curve = 1.6;
      P.push(polyRoof({ n: 8, R: Re, z: zE, h: rise / Math.pow(tMax, curve), curve, lift: 44, flare: 18, th: 16, tMax, mat: "Suzhou_TileGreen", tileEnd: "Suzhou_TileEndGreen", ridgeMat: "Suzhou_RidgeGreen", under: TEAL, horns: 40, bells: true, nt: 4, ns: 6 }));
      const zB = zE + rise + 4;
      P.push(oct(rn + 78, zB - 14, 14, "WoodShade"));
      for (let j = 0; j < 8; j++) P.push(railing(at(rn + 70, j, zB), at(rn + 70, j + 1, zB), 56, RED, 46));
      z0 = zB;
    } else {
      const h = 290;
      P.push(polyRoof({ n: 8, R: Re + 10, z: zE, h, curve: 1.55, lift: 56, flare: 22, th: 18, mat: "Suzhou_TileGreen", tileEnd: "Suzhou_TileEndGreen", ridgeMat: "Suzhou_RidgeGreen", under: TEAL, horns: 50, bells: true, nt: 6, ns: 6 }));
      // the spire: a lotus base, a bowl, rings, a gourd and a spike; chains to the corners
      const zA = zE + h;
      P.push(lathe([[0, -10], [44, -6], [52, 8], [40, 22], [0, 24]], 8, "Suzhou_RidgeGreen", [0, 0, zA]));
      P.push(lathe([[0, 0], [30, 2], [36, 16], [24, 30], [0, 32]], 10, "Bronze", [0, 0, zA + 22]));
      P.push(cylinderAt({ radius: 7, height: 300, segments: 8, bottom: [0, 0, zA] }, "Bronze"));
      for (let k = 0; k < 7; k++) P.push(translate(torus(24 - k * 1.6, 3.5, 12, 5, "GoldTrim"), [0, 0, zA + 70 + k * 22]));
      const zg = zA + 70 + 7 * 22;
      P.push(lathe([[0, 0], [16, 4], [20, 18], [10, 32], [14, 42], [16, 54], [8, 66], [0, 70]], 10, "GoldTrim", [0, 0, zg]));
      P.push(cylinderAt({ rBot: 4, rTop: 0.5, height: 60, segments: 6, bottom: [0, 0, zg + 68] }, "GoldTrim"));
      for (let j = 0; j < 8; j++) P.push(cylinderBetween([0, 0, zA + 210], add(at(Re + 30, j, zE), [0, 0, 60]), 1.2, 4, "IronDark"));
      // a beacon brazier glowing in the lantern room
      P.push(cylinderAt({ rBot: 50, rTop: 70, height: 40, segments: 8, bottom: [0, 0, z0 + 40] }, "Bronze"), cylinderAt({ rBot: 60, rTop: 30, height: 70, segments: 8, bottom: [0, 0, z0 + 80] }, "FireGlow"));
    }
  }
  return merge(...P);
}

// A street lamp: a crimson post on a granite foot, a little tiled cap, an arm curling out over
// the street with a red lantern on it. 3.6 m tall; the lantern hangs toward -X.
function lanternPost(): Geo {
  const P: Geo[] = [
    boxAt([46, 46, 18], [0, 0, 0], "Suzhou_GraniteDark", 3),
    boxAt([34, 34, 34], [0, 0, 18], GRANITE, 2),
    boxAt([17, 17, 300], [0, 0, 52], RED, 1.5),
    boxAt([22, 22, 10], [0, 0, 300], "GoldTrim", 1),
    cylinderAt({ rBot: 32, rTop: 3, height: 24, segments: 4, bottom: [0, 0, 352] }, TILE),
    sphereCenter(6, [0, 0, 380], "GoldTrim", 8),
  ];
  P[4] = rotateZ(P[4], 45);
  P.push(limb([[0, 0, 318], [-30, 0, 330], [-62, 0, 334], [-76, 0, 346], [-72, 0, 360]], 5, 2.5, RED, { seg: 6 }));
  P.push(boxAt([30, 8, 10], [-16, 0, 296], RED));
  P.push(lantern(22, [-60, 0, 332]));
  return merge(...P);
}

// The Jiangnan townhouse: two storeys of whitewash, 8 m along the street (Y) and 7 m deep, a
// granite-framed door with a black double door and red couplets, lattice windows, a dark wooden
// upper floor under a pent roof, grey tiles; at each end a horse-head gable wall stepping up over
// the roof in three tiers, each capped with tiles and an upturned "horse head".
function townhouse(): Geo {
  const P: Geo[] = [];
  const hx = 350, hy = 400, z1 = 30, z2 = 330, z3 = 600, D = "WoodShade";
  P.push(bb([-hx - 12, -hy, 0], [hx + 12, hy, z1], GRANITE, 2));
  // back wall, front ground floor, the upper front of dark boards set back under the pent roof
  P.push(bb([hx - 24, -hy, z1], [hx, hy, z3], WHITE));
  P.push(bb([-hx, -hy, z1], [-hx + 24, hy, z2 + 20], WHITE));
  P.push(bb([-hx + 30, -hy, z2], [-hx + 44, hy, z3], D));
  P.push(bb([-hx + 26, -hy, z3 - 22], [-hx + 46, hy, z3], "WoodDark"));
  // the door: a granite frame, black leaves with bronze rings, a step, couplets, lanterns
  P.push(bb([-hx - 8, -86, z1], [-hx + 2, -70, z1 + 250], GRANITE), bb([-hx - 8, 70, z1], [-hx + 2, 86, z1 + 250], GRANITE));
  P.push(bb([-hx - 10, -96, z1 + 250], [-hx + 2, 96, z1 + 272], GRANITE, 1.5));
  P.push(bb([-hx - 3, -70, z1], [-hx + 1, -1, z1 + 250], "Suzhou_Ink"), bb([-hx - 3, 1, z1], [-hx + 1, 70, z1 + 250], "Suzhou_Ink"));
  for (const y of [-14, 14]) P.push(translate(rotateY(torus(6, 1.4, 10, 4, "Bronze"), 90), [-hx - 5, y, z1 + 120]));
  P.push(bb([-hx - 60, -100, 0], [-hx - 8, 100, 16], GRANITE, 2));
  P.push(couplets(-hx - 1, 172, z1 + 40, 190));
  for (const y of [-118, 118]) P.push(lantern(16, [-hx - 34, y, z2 + 24]));
  // ground floor windows
  for (const y of [-260, 260]) P.push(lattice(-hx - 2, y - 62, y + 62, z1 + 90, z1 + 200, "WoodDark", "PaperShoji", 14));
  // upper floor: four lattice windows between posts
  for (const y of [-285, -95, 95, 285]) P.push(lattice(-hx + 28, y - 70, y + 70, z2 + 60, z2 + 205, "WoodDark", "PaperShoji", 14));
  for (const y of [-hy + 8, -190, 0, 190, hy - 8]) P.push(bb([-hx + 22, y - 8, z2], [-hx + 32, y + 8, z3], "WoodDark"));
  // the pent roof between the floors
  P.push(slab([-hx - 72, -hy, z2 + 24], [-hx - 72, hy, z2 + 24], [-hx + 34, hy, z2 + 66], [-hx + 34, -hy, z2 + 66], 9));
  P.push(bb([-hx + 18, -hy, z2 + 58], [-hx + 34, hy, z2 + 74], RIDGE));
  P.push(bb([-hx - 66, -hy, z2 + 8], [-hx - 56, hy, z2 + 20], "WoodDark"));
  for (const y of [-hy + 20, -133, 133, hy - 20]) P.push(beamBetween([-hx, y, z2 + 28], [-hx - 62, y, z2 + 12], 7, 9, "WoodDark"));
  // back: a small door and two windows upstairs
  const back = merge(
    bb([-hx - 4, -60, z1], [-hx + 2, 60, z1 + 220], "WoodDark"),
    bb([-hx - 8, -72, z1 + 220], [-hx + 2, 72, z1 + 234], GRANITE),
    lattice(-hx - 2, -240, -120, z2 + 80, z2 + 190, "WoodDark"),
    lattice(-hx - 2, 120, 240, z2 + 80, z2 + 190, "WoodDark"),
  );
  P.push(rotateZ(back, 180));
  // the main roof: a gable, ridge along Y, between the gable walls
  P.push(rotateZ(roof({ kind: "gable", hx: hy - 18, hy: hx + 72, z: z3, h: 230, th: 16, curve: 1.25, ends: false, curls: 0, nt: 6, ns: 4 }), 90));
  // the horse-head gables: three tiers each side of the ridge, capped, the outer ends upturned
  const tiers: [number, number, number][] = [[hx + 24, 250, 720], [250, 128, 806], [128, 0, 906]];
  for (const sy of [-1, 1]) {
    const y = sy * (hy - 14);
    for (const sx of [-1, 1])
      for (const [xo, xi, ztop] of tiers) {
        P.push(bb([sx * xo, y - 15, z1], [sx * xi, y + 15, ztop], WHITE));
        P.push(bb([sx * (xo + 6), y - 22, ztop], [sx * xi, y + 22, ztop + 8], RIDGE));
        P.push(slab([sx * (xo + 6), y - 30, ztop + 2], [sx * xi, y - 30, ztop + 2], [sx * xi, y, ztop + 18], [sx * (xo + 6), y, ztop + 18], 6));
        P.push(slab([sx * xi, y + 30, ztop + 2], [sx * (xo + 6), y + 30, ztop + 2], [sx * (xo + 6), y, ztop + 18], [sx * xi, y, ztop + 18], 6));
        P.push(bb([sx * (xo + 6), y - 8, ztop + 14], [sx * xi, y + 8, ztop + 26], RIDGE));
        P.push(limb([[sx * (xo - 20), y, ztop + 22], [sx * (xo + 4), y, ztop + 26], [sx * (xo + 18), y, ztop + 44]], 9, 3.5, RIDGE, { seg: 6 }));
      }
    // a little window high in the gable
    P.push(bb([-40, y - sy * 17, 690], [40, y - sy * 16, 740], "Suzhou_Ink"));
  }
  return merge(...P);
}

// The pailou: a ceremonial archway of four crimson columns in granite clamps, three openings
// (the middle one 4.3 m clear, for the main street), painted lintels with a gold-lettered plaque,
// bracket sets and three little hip roofs of green glazed tile, the middle one highest. It spans
// 12.6 m along Y; the way through runs along X.
function pailou(): Geo {
  const P: Geo[] = [];
  const cols = [-590, -230, 230, 590];
  for (const y of cols) {
    const inner = Math.abs(y) < 300, H = inner ? 640 : 540;
    P.push(boxAt([70, 70, 26], [0, y, 0], "Suzhou_GraniteDark", 3));
    P.push(cylinderAt({ radius: 19, height: H, segments: 12, bottom: [0, y, 26] }, RED));
    // the clamp stones either side of each column's foot
    for (const s of [-1, 1]) P.push(boxAt([34, 30, 150], [s * 38, y, 26], GRANITE, 3), boxAt([40, 36, 12], [s * 38, y, 176], GRANITE, 2));
    P.push(boxAt([28, 44, 150], [0, y + (y < 0 ? -1 : 1) * 4, 26], GRANITE, 2));
  }
  // lintels and plaques
  const beam = (y0: number, y1: number, z: number, h: number) => paintedBeam(-16, y0, y1, z, h, 32, true);
  P.push(beam(-230, 230, 520, 36), beam(-230, 230, 640, 34));
  P.push(signboard(-18, 0, 597, 250, 70, 3), rotateZ(signboard(-18, 0, 597, 250, 70, 3), 180));
  for (const s of [-1, 1]) {
    P.push(beam(s < 0 ? -590 : 230, s < 0 ? -230 : 590, 440, 30), beam(s < 0 ? -590 : 230, s < 0 ? -230 : 590, 540, 28));
    P.push(bb([-10, s * 300, 470], [10, s * 520, 540], BLUE), bb([-12, s * 330, 480], [12, s * 490, 530], "GoldTrim"));
    P.push(bb([-13, s * 345, 486], [13, s * 475, 524], TEAL));
  }
  // brackets and roofs: the middle bay high, the side bays lower
  const bays: [number, number, number][] = [[0, 230, 674], [-410, 180, 568], [410, 180, 568]];
  for (const [yc, half, z] of bays) {
    for (const y of spread(yc - half + 40, yc + half - 40, Math.max(3, Math.round(half / 70)))) P.push(dougong(-6, y, z, 40, 0.8), rotateZ(dougong(-6, -y, z, 40, 0.8), 180));
    P.push(translate(rotateZ(roof({ kind: "hip", hx: half + 70, hy: 118, z: z + 64, h: z > 600 ? 120 : 100, ridge: half + 10, curve: 1.6, lift: 34, flare: 14, reach: 110, th: 12, mat: "Suzhou_TileGreen", tileEnd: "Suzhou_TileEndGreen", ridgeMat: "Suzhou_RidgeGreen", under: TEAL, curls: 0.75, horns: 34, nt: 4, ns: 8 }), 90), [0, yc, 0]));
  }
  return merge(...P);
}

// City wall of grey brick, 8 m along Y: a granite plinth, the wall 6.2 m to the walkway,
// crenellations with loopholes on the outside (-X), a low parapet inside. Tiles end to end.
function cityWall(): Geo {
  const L = 400, B = "Suzhou_Brick";
  const P: Geo[] = [
    bb([-150, -L, 0], [150, L, 46], "Suzhou_GraniteDark"),
    bb([-136, -L, 46], [136, L, 620], B),
    bb([-142, -L, 300], [-136, L, 316], "Suzhou_BrickDark"),
    bb([-136, -L, 620], [136, L, 626], "Suzhou_GraniteDark"),
    bb([-150, -L, 620], [-108, L, 690], B),
    bb([-154, -L, 690], [-104, L, 698], "Suzhou_GraniteDark"),
    bb([108, -L, 620], [136, L, 700], B),
    bb([104, -L, 700], [140, L, 708], "Suzhou_GraniteDark"),
  ];
  for (let k = 0; k < 8; k++) {
    const y = -350 + k * 100;
    P.push(boxAt([46, 62, 76], [-129, y, 698], B, 1.5), boxAt([52, 68, 8], [-129, y, 774], "Suzhou_GraniteDark", 1.5));
    P.push(bb([-154, y - 6, 714], [-150, y + 6, 740], "Suzhou_Ink"));
  }
  // drain spouts on the inside
  for (const y of [-200, 200]) P.push(boxAt([30, 14, 10], [150, y, 600], GRANITE));
  return merge(...P);
}

// A corner tower: a square bastion of brick a little higher than the wall, crenellated, with a
// small watch pavilion on top (crimson posts, a hip-and-gable roof of grey tile). 7.2 m square.
function wallTower(): Geo {
  const H = 700, R = 360, B = "Suzhou_Brick";
  const P: Geo[] = [
    boxAt([2 * R + 20, 2 * R + 20, 50], [0, 0, 0], "Suzhou_GraniteDark", 3),
    boxAt([2 * R, 2 * R, H - 50], [0, 0, 50], B),
    boxAt([2 * R + 6, 2 * R + 6, 8], [0, 0, H], "Suzhou_GraniteDark"),
  ];
  for (let k = 0; k < 4; k++) {
    const side: Geo[] = [bb([-R - 6, -R, H], [-R + 40, R, H + 70], B), bb([-R - 10, -R, H + 70], [-R + 44, R, H + 78], "Suzhou_GraniteDark")];
    for (let i = 0; i < 7; i++) {
      const y = -R + 50 + i * ((2 * R - 100) / 6);
      side.push(boxAt([46, 60, 74], [-R + 17, y, H + 78], B, 1.5), boxAt([52, 66, 8], [-R + 17, y, H + 152], "Suzhou_GraniteDark", 1.5));
    }
    side.push(bb([-R - 4, -150, 320], [-R, 150, 330], "Suzhou_BrickDark"), bb([-R - 4, -24, 420], [-R, 24, 470], "Suzhou_Ink"));
    P.push(rotateZ(merge(...side), k * 90));
  }
  // the watch pavilion
  const zp = H + 8, ph = 260, hx = 200;
  for (const x of [-hx, hx]) for (const y of [-hx, hx]) P.push(cylinderAt({ radius: 14, height: ph, segments: 8, bottom: [x, y, zp] }, RED));
  for (let k = 0; k < 4; k++) P.push(rotateZ(merge(paintedBeam(-hx - 10, -hx, hx, zp + ph - 34, 30, 20), railing([-hx, -hx, zp], [-hx, hx, zp], 50)), k * 90));
  P.push(boxAt([2 * hx - 40, 2 * hx - 40, ph - 30], [0, 0, zp], WHITE));
  for (let k = 0; k < 4; k++) P.push(rotateZ(lattice(-hx + 18, -70, 70, zp + 60, zp + 190, "WoodShade"), k * 90));
  P.push(roof({ kind: "xieshan", hx: hx + 110, hy: hx + 110, z: zp + ph + 10, h: 190, curve: 1.6, lift: 46, flare: 18, th: 14, gableAt: 0.5, curls: 0.7, nt: 6, ns: 8 }));
  return merge(...P);
}

// The city gate: a brick gate base 17 m along Y and 10 m deep with an arched passage (4.6 m wide)
// through it along X, granite voussoirs, crenellations, the red doors swung back inside; on top a
// two-storey gate tower of crimson columns and lattice under double eaves of grey tile.
function cityGate(): Geo {
  const P: Geo[] = [];
  const HX = 500, HY = 850, H = 760, AW = 460, AH = 560, B = "Suzhou_Brick";
  // the base with its passage
  P.push(extrude([[-HY, 46], [HY, 46], [HY, H], [-HY, H]], [archPts(AW, AH - 46, 16, 0, 46)], "x", -HX, 2 * HX, B));
  P.push(extrude([[-HY - 14, 0], [HY + 14, 0], [HY + 14, 46], [-HY - 14, 46]], [[[-AW / 2, -1], [AW / 2, -1], [AW / 2, 47], [-AW / 2, 47]]], "x", -HX - 14, 2 * HX + 28, "Suzhou_GraniteDark"));
  for (const x of [-HX - 8, HX]) P.push(extrude(archPts(AW + 60, AH + 30 - 46, 16, 0, 46), [archPts(AW, AH - 46, 16, 0, 46)], "x", x, 8, GRANITE));
  // the passage's floor and the doors swung back against its walls
  P.push(bb([-HX, -AW / 2, 0], [HX, AW / 2, 4], "Suzhou_GraniteDark"));
  for (const s of [-1, 1]) {
    P.push(bb([HX - 260, s * (AW / 2 - 14), 4], [HX - 30, s * (AW / 2 - 4), 330], RED));
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) P.push(sphereCenter(3.5, [HX - 240 + c * 60, s * (AW / 2 - 15), 50 + r * 60], "GoldTrim", 6));
  }
  // crenellations outside (-X), a parapet inside
  P.push(bb([-HX - 8, -HY, H], [-HX + 40, HY, H + 70], B), bb([-HX - 12, -HY, H + 70], [-HX + 44, HY, H + 78], "Suzhou_GraniteDark"));
  for (let i = 0; i < 17; i++) P.push(boxAt([46, 62, 74], [-HX + 16, -HY + 50 + i * 100, H + 78], B, 1.5), boxAt([52, 68, 8], [-HX + 16, -HY + 50 + i * 100, H + 152], "Suzhou_GraniteDark", 1.5));
  P.push(bb([HX - 30, -HY, H], [HX + 6, HY, H + 80], B), bb([HX - 34, -HY, H + 80], [HX + 10, HY, H + 88], "Suzhou_GraniteDark"));
  for (const s of [-1, 1]) P.push(bb([-HX + 40, s * HY - s * 30, H], [HX - 30, s * HY, H + 80], B));
  P.push(bb([-HX, -HY, H], [HX, HY, H + 6], "Suzhou_GraniteDark"));
  // a plaque over the arch outside
  P.push(signboard(-HX - 10, 0, AH + 110, 210, 66, 3));
  // the gate tower: ground storey 13 x 6.4 m, upper storey 10.4 x 4.8 m
  const z0 = H + 6, tx = 320, ty = 650, h1 = 320;
  P.push(boxAt([2 * tx + 60, 2 * ty + 60, 30], [0, 0, z0], GRANITE, 2));
  const zf = z0 + 30;
  for (const x of [-tx, tx]) for (const y of spread(-ty, ty, 6)) P.push(cylinderAt({ radius: 18, height: h1, segments: 10, bottom: [x, y, zf] }, RED));
  for (const y of [-ty, ty]) P.push(cylinderAt({ radius: 18, height: h1, segments: 10, bottom: [0, y, zf] }, RED));
  P.push(boxAt([2 * tx - 80, 2 * ty - 80, h1 - 20], [0, 0, zf], WHITE));
  const bayW = (2 * ty) / 5;
  for (const sx of [-1, 1])
    for (let b = 0; b < 5; b++) {
      const yc = -ty + bayW * (b + 0.5);
      const front = lattice(-tx + 38, yc - bayW / 2 + 22, yc + bayW / 2 - 22, zf + 30, zf + h1 - 60, "Suzhou_Red", "PaperShoji", 19);
      P.push(sx < 0 ? front : rotateZ(front, 180));
    }
  for (const sx of [-1, 1]) {
    const f = paintedBeam(-tx - 12, -ty - 18, ty + 18, zf + h1 - 40, 36, 24);
    P.push(sx < 0 ? f : rotateZ(f, 180));
  }
  for (const sy of [-1, 1]) {
    const f = paintedBeam(-ty - 12, -tx - 18, tx + 18, zf + h1 - 40, 36, 24);
    P.push(rotateZ(f, sy * 90));
  }
  P.push(bracketRing(tx, ty, zf + h1, 60, spread(-ty, ty, 8), spread(-tx, tx, 4), 0.85));
  // the lower eaves: a skirt up to the upper storey
  const ux = 240, uy = 520, zl = zf + h1 + 54;
  P.push(rotateZ(roof({ kind: "hip", hx: ty + 170, hy: tx + 170, z: zl, h: 520, ridge: ty - tx, tMax: 0.36, curve: 1.6, lift: 60, flare: 26, th: 16, nt: 4, ns: 10 }), 90));
  const zu = zl + 104;
  P.push(boxAt([2 * ux + 80, 2 * uy + 80, 14], [0, 0, zu - 14], "WoodShade"));
  for (let k = 0; k < 4; k++) {
    const w = k % 2 ? uy + 36 : ux + 36, h = k % 2 ? ux + 36 : uy + 36;
    P.push(rotateZ(railing([-w, -h, zu], [-w, h, zu], 54), k * 90));
  }
  const h2 = 250;
  for (const x of [-ux, ux]) for (const y of spread(-uy, uy, 5)) P.push(cylinderAt({ radius: 15, height: h2, segments: 10, bottom: [x, y, zu] }, RED));
  P.push(boxAt([2 * ux - 20, 2 * uy - 20, h2 - 10], [0, 0, zu], WHITE));
  for (const sx of [-1, 1])
    for (let b = 0; b < 4; b++) {
      const yc = -uy + (uy / 2) * (b + 0.5);
      const front = lattice(-ux + 8, yc - uy / 4 + 18, yc + uy / 4 - 18, zu + 30, zu + h2 - 46, "Suzhou_Red", "PaperShoji", 19);
      P.push(sx < 0 ? front : rotateZ(front, 180));
    }
  P.push(signboard(-ux - 30, 0, zu + h2 + 40, 170, 56, 3));
  P.push(bracketRing(ux, uy, zu + h2, 52, spread(-uy, uy, 7), spread(-ux, ux, 3), 0.75));
  P.push(rotateZ(roof({ kind: "xieshan", hx: uy + 170, hy: ux + 170, z: zu + h2 + 52, h: 270, curve: 1.7, lift: 72, flare: 28, th: 18, gableAt: 0.48, curls: 1.2, nt: 8, ns: 12 }), 90));
  return merge(...P);
}

// Goods on a shop's shelves and counters: bolts of silk, porcelain jars and bowls, tea boxes
// along a line at height z from y0 to y1 (x the shelf's middle).
function goods(x: number, y0: number, y1: number, z: number, seed: number): Geo {
  const P: Geo[] = [], rnd = seeded(seed);
  const silk = ["FabricRed", "FabricGold", "Suzhou_Indigo", "FabricGreen", "FabricPurple", "Suzhou_Cream", "FabricRed"];
  for (let y = y0 + 20; y < y1 - 20; ) {
    const k = rnd();
    if (k < 0.4) {
      // a stack of silk bolts
      const m = silk[Math.floor(rnd() * silk.length)];
      for (let j = 0; j < 3; j++) P.push(cylinderBetween([x - 14, y + j * 13, z + 8], [x + 14, y + j * 13, z + 8], 6.5, 6, j % 2 ? m : silk[(silk.indexOf(m) + 2) % silk.length]));
      P.push(cylinderBetween([x - 14, y + 6, z + 20], [x + 14, y + 6, z + 20], 6.5, 6, m));
      y += 46;
    } else if (k < 0.75) {
      // a blue-and-white jar
      P.push(lathe([[0, 0], [10, 1], [13, 12], [8, 26], [7, 30], [0, 30]], 8, "Suzhou_Porcelain", [x, y + 12, z]));
      P.push(lathe([[13.1, 0], [13.4, 5], [0, 10]], 8, "Suzhou_Cobalt", [x, y + 12, z + 8]));
      y += 34;
    } else {
      // tea boxes with red labels
      P.push(boxAt([24, 22, 18], [x, y + 10, z], "WoodPale", 1), boxAt([2, 12, 10], [x - 12, y + 10, z + 4], "FabricRed"));
      P.push(boxAt([22, 20, 14], [x, y + 10, z + 18], "WoodWarm", 1));
      y += 30;
    }
  }
  return merge(...P);
}

// The shophouse: an open shop front of crimson columns with a counter and shelves of silk,
// porcelain and tea behind, black-and-gold signboards (one across, two hanging out over the
// street), a balcony upstairs with red lattice doors and lanterns under the eaves, and curved
// "Guanyin" gable walls rising over the grey roof. 8 m along Y, 8 m deep.
function shophouse(): Geo {
  const P: Geo[] = [];
  const hx = 400, hy = 400, z1 = 24, z2 = 330, z3 = 610;
  P.push(bb([-hx - 34, -hy, 0], [hx + 10, hy, z1], GRANITE, 2));
  P.push(bb([hx - 24, -hy, z1], [hx, hy, z3], WHITE));
  // the shop: a dark back wall, shelves of goods, the counter
  P.push(bb([-hx + 210, -hy + 20, z1], [-hx + 230, hy - 20, z2], "WoodDark"));
  for (const z of [z1 + 60, z1 + 130, z1 + 200]) {
    P.push(bb([-hx + 178, -hy + 34, z], [-hx + 210, hy - 34, z + 5], "WoodDark"));
    P.push(goods(-hx + 194, -hy + 34, hy - 34, z + 5, z));
  }
  P.push(bb([-hx + 56, -hy + 50, z1], [-hx + 104, hy - 170, z1 + 88], "WoodWarm", 2), bb([-hx + 50, -hy + 44, z1 + 88], [-hx + 110, hy - 164, z1 + 95], "WoodDark"));
  P.push(goods(-hx + 80, -hy + 60, 60, z1 + 95, 7));
  // an abacus on the counter
  P.push(boxAt([24, 40, 3], [-hx + 80, 150, z1 + 95], "WoodDark"));
  for (let i = 0; i < 6; i++) P.push(cylinderBetween([-hx + 70, 134 + i * 6.4, z1 + 100], [-hx + 90, 134 + i * 6.4, z1 + 100], 1.6, 5, "WoodRed"));
  // the ceiling, the columns, the signboard across the front
  P.push(bb([-hx, -hy, z2 - 18], [hx - 24, hy, z2], "WoodDark"));
  for (const y of [-hy + 14, -133, 133, hy - 14]) P.push(cylinderAt({ radius: 13, height: z2 - z1, segments: 8, bottom: [-hx + 14, y, z1] }, RED));
  P.push(signboard(-hx - 2, 0, z2 - 44, 300, 50, 4));
  // signboards hanging out over the street on iron arms
  for (const s of [-1, 1]) {
    const y = s * (hy - 14);
    P.push(bb([-hx - 74, y - 3, z2 - 34], [-hx + 6, y + 3, z2 - 28], "IronDark"));
    P.push(translate(rotateZ(signboard(0, 0, 0, 44, 170, 4, true), 90), [-hx - 44, y, z2 - 128]));
    for (const yy of [-16, 16]) P.push(cylinderBetween([-hx - 44 + yy, y, z2 - 34], [-hx - 44 + yy, y, z2 - 44], 0.8, 4, "IronDark"));
  }
  // the balcony upstairs on brackets, its railing and the lattice doors behind
  P.push(bb([-hx - 92, -hy, z2], [-hx, hy, z2 + 14], "WoodShade"));
  for (const y of [-hy + 14, -133, 133, hy - 14]) P.push(beamBetween([-hx + 4, y, z2 - 54], [-hx - 82, y, z2 - 2], 9, 11, "WoodDark"));
  P.push(railing([-hx - 86, -hy + 6, z2 + 14], [-hx - 86, hy - 6, z2 + 14], 66));
  for (const s of [-1, 1]) P.push(railing([-hx - 86, s * (hy - 6), z2 + 14], [-hx, s * (hy - 6), z2 + 14], 66));
  P.push(bb([-hx + 8, -hy, z2], [-hx + 20, hy, z3], "WoodDark"));
  for (const y of [-300, -100, 100, 300]) P.push(lattice(-hx + 6, y - 92, y + 92, z2 + 34, z3 - 54, RED, "PaperShoji", 18));
  for (const y of [-hy + 8, -200, 0, 200, hy - 8]) P.push(bb([-hx, y - 7, z2 + 14], [-hx + 10, y + 7, z3], RED));
  for (const y of [-260, 0, 260]) P.push(lantern(19, [-hx - 64, y, z3 - 22]));
  // the back: a door, two windows upstairs
  P.push(rotateZ(merge(
    bb([-hx - 4, -60, z1], [-hx + 2, 60, z1 + 220], "WoodDark"),
    bb([-hx - 8, -72, z1 + 220], [-hx + 2, 72, z1 + 234], GRANITE),
    lattice(-hx - 2, -260, -130, z2 + 90, z2 + 200, "WoodDark"),
    lattice(-hx - 2, 130, 260, z2 + 90, z2 + 200, "WoodDark"),
  ), 180));
  // the roof: a gable, ridge along Y, curled ridge ends, eaves out over the balcony
  P.push(rotateZ(roof({ kind: "gable", hx: hy - 24, hy: hx + 120, z: z3, h: 200, th: 16, curve: 1.3, ends: false, curls: 0.9, nt: 6, ns: 4 }), 90));
  // the curved gable walls
  const crest = (x: number) => z3 + 50 + 250 * Math.pow(Math.max(0, 1 - (x / (hx + 30)) ** 2), 1.5);
  const xs = spread(-hx - 30, hx + 30, 17);
  for (const sy of [-1, 1]) {
    const y0 = sy < 0 ? -hy : hy - 30;
    P.push(extrude([[-hx - 30, z1], [hx + 30, z1], ...[...xs].reverse().map((x): [number, number] => [x, crest(x)])], [], "y", y0, 30, WHITE));
    const yc = y0 + 15;
    P.push(sweep(xs.map((x): V3 => [x, yc, crest(x) + 5]), 46, 12, RIDGE));
    P.push(sweep(xs.map((x): V3 => [x, yc, crest(x) + 13]), 24, 10, TILE));
    for (const sx of [-1, 1]) P.push(limb([[sx * (hx + 10), yc, crest(hx + 10) + 8], [sx * (hx + 34), yc, crest(hx + 30) + 10], [sx * (hx + 46), yc, crest(hx + 30) + 32]], 9, 3.5, RIDGE, { seg: 6 }));
  }
  return merge(...P);
}

// The tea house: two storeys, 10 m along Y and 8.4 m deep, crimson columns all round, a veranda
// with tables below and a balcony all round upstairs (lean-out "beauty's" railings), lanterns
// along the eaves, a skirt roof between the floors and a hip-and-gable roof of grey tile with its
// corners swept high; a tall cloth banner for tea by the steps.
function teaHouse(): Geo {
  const P: Geo[] = [];
  const hx = 420, hy = 500, z1 = 40, z2 = 360, z3 = 650, ix = hx - 100, iy = hy - 100;
  P.push(bb([-hx - 44, -hy - 44, 0], [hx + 44, hy + 44, z1], GRANITE, 2));
  P.push(bb([-hx - 110, -170, 0], [-hx - 44, 170, 20], GRANITE, 2));
  // columns all round, full height
  const cols: V3[] = [];
  for (const y of spread(-hy, hy, 5)) cols.push([-hx, y, z1], [hx, y, z1]);
  for (const x of spread(-hx, hx, 4).slice(1, -1)) cols.push([x, -hy, z1], [x, hy, z1]);
  for (const c of cols) P.push(cylinderAt({ radius: 15, height: z3 - z1, segments: 10, bottom: c }, RED));
  // the core: white walls with lattice, the front doors folded open
  P.push(boxAt([2 * ix, 2 * iy, z2 - z1 - 20], [0, 0, z1], WHITE));
  for (let k = 0; k < 4; k++) {
    const w = k % 2 ? ix : iy, d = k % 2 ? iy : ix;
    const face: Geo[] = [];
    for (const y of spread(-w + 70, w - 70, 3)) {
      if (k === 0 && Math.abs(y) < 120) continue;
      face.push(lattice(-d - 2, y - 60, y + 60, z1 + 40, z2 - 50, "Suzhou_Red", "PaperShoji", 19));
    }
    if (k === 0) face.push(bb([-d - 3, -110, z1], [-d + 1, 110, z2 - 40], "Suzhou_Ink"));
    P.push(rotateZ(merge(...face), k * 90));
  }
  // tables and stools on the veranda
  for (const y of [-300, 300]) {
    P.push(cylinderAt({ radius: 7, height: 66, segments: 6, bottom: [-hx + 50, y, z1] }, "WoodDark"), cylinderAt({ radius: 34, height: 6, segments: 12, bottom: [-hx + 50, y, z1 + 66] }, "WoodWarm"));
    for (const a of [0, 2.1, 4.2]) P.push(cylinderAt({ rBot: 13, rTop: 15, height: 42, segments: 8, bottom: [-hx + 50 + Math.cos(a) * 52, y + Math.sin(a) * 52, z1] }, "Suzhou_Porcelain"));
    P.push(lathe([[0, 0], [7, 1], [9, 8], [5, 13], [6, 15], [0, 15]], 8, "Suzhou_Porcelain", [-hx + 50, y, z1 + 72]));
    for (const a of [1, 3, 5]) P.push(cylinderAt({ rBot: 3, rTop: 4, height: 4, segments: 6, bottom: [-hx + 50 + Math.cos(a) * 18, y + Math.sin(a) * 18, z1 + 72] }, "Suzhou_Porcelain"));
  }
  // the skirt roof between the floors
  P.push(rotateZ(roof({ kind: "hip", hx: hy + 150, hy: hx + 150, z: z2 - 70, h: 420, ridge: hy - hx, tMax: 0.17, curve: 1.3, lift: 44, flare: 18, th: 13, horns: 36, nt: 2, ns: 10 }), 90));
  // the balcony upstairs, all round, and its railings
  P.push(boxAt([2 * hx + 120, 2 * hy + 120, 16], [0, 0, z2 - 16], "WoodShade"));
  for (let k = 0; k < 4; k++) {
    const w = k % 2 ? hx + 54 : hy + 54, d = k % 2 ? hy + 54 : hx + 54;
    const side = merge(
      railing([-d, -w, z2], [-d, w, z2], 50),
      sweep([[-d - 14, -w, z2 + 74], [-d - 14, w, z2 + 74]], 8, 7, RED),
    );
    const backrest: Geo[] = [];
    for (const y of spread(-w + 10, w - 10, Math.round(w / 32))) backrest.push(beamBetween([-d, y, z2 + 48], [-d - 14, y, z2 + 74], 3, 3, RED));
    P.push(rotateZ(merge(side, ...backrest), k * 90));
  }
  // upstairs: lattice walls on the core
  P.push(boxAt([2 * ix + 40, 2 * iy + 40, z3 - z2 - 10], [0, 0, z2], "WoodShade"));
  for (let k = 0; k < 4; k++) {
    const w = k % 2 ? ix + 20 : iy + 20, d = k % 2 ? iy + 20 : ix + 20;
    P.push(rotateZ(merge(...spread(-w + 60, w - 60, Math.round(w / 150)).map((y) => lattice(-d - 2, y - 46, y + 46, z2 + 30, z3 - 50, "Suzhou_Red", "PaperShoji", 18))), k * 90));
  }
  P.push(signboard(-ix - 30, 0, z3 - 30, 260, 54, 3));
  // painted beams over the columns, lanterns under the eaves
  for (let k = 0; k < 4; k++) {
    const w = k % 2 ? hx : hy, d = k % 2 ? hy : hx;
    P.push(rotateZ(paintedBeam(-d - 12, -w - 15, w + 15, z3 - 40, 36, 24), k * 90));
    const ls = spread(-w + 120, w - 120, k % 2 ? 2 : 3);
    for (const y of ls) P.push(rotateZ(lantern(18, [-d - 40, y, z3 - 14]), k * 90));
  }
  P.push(bracketRing(hx, hy, z3, 54, spread(-hy, hy, 7), spread(-hx, hx, 5), 0.7));
  P.push(rotateZ(roof({ kind: "xieshan", hx: hy + 200, hy: hx + 200, z: z3 + 50, h: 270, curve: 1.65, lift: 72, flare: 30, th: 20, gableAt: 0.5, curls: 1.1, nt: 8, ns: 12 }), 90));
  // the tea banner by the steps
  const bx = -hx - 120, by = -260;
  P.push(boxAt([30, 30, 24], [bx, by, 0], GRANITE, 2), cylinderAt({ radius: 5, height: 560, segments: 6, bottom: [bx, by, 24] }, "Bamboo"));
  P.push(bb([bx - 2, by + 6, 300], [bx + 2, by + 70, 560], "Suzhou_Cream"), bb([bx - 3, by + 6, 540], [bx + 3, by + 70, 560], "FabricRed"), bb([bx - 3, by + 6, 300], [bx + 3, by + 70, 312], "FabricRed"));
  for (const [z, w] of [[500, 40], [470, 6], [440, 36], [410, 8], [380, 30]] as const) P.push(bb([bx - 3.5, by + 38 - w / 2, z], [bx + 3.5, by + 38 + w / 2, z + 9], "Suzhou_Ink"));
  P.push(cylinderBetween([bx, by, 566], [bx, by + 76, 566], 2.5, 5, "Bamboo"));
  return merge(...P);
}

// The great hall (the governor's yamen, or a temple): on a granite platform with a marble
// balustrade and steps up the front, five bays of crimson columns, a porch before lattice doors,
// bracket sets painted blue and green, a great hip-and-gable roof with dragon-curled ridge ends
// and a pearl, a plaque under the eaves. 18 m along Y, 11.6 m deep.
function greatHall(): Geo {
  const P: Geo[] = [];
  const zp = 130, H = 430, cx = [-420, -140, 140, 420], cy = spread(-750, 750, 6);
  P.push(bb([-600, -900, 0], [560, 900, zp - 10], GRANITE, 3), bb([-606, -906, zp - 10], [566, 906, zp], "Suzhou_GraniteDark", 2));
  // steps up the front (the middle), cheek walls
  for (let k = 0; k < 5; k++) P.push(bb([-600 - 34 * (k + 1), -230, 0], [-600 - 34 * k, 230, zp - 10 - 24 * k], GRANITE, 1.5));
  for (const s of [-1, 1]) P.push(bb([-780, s * 230, 0], [-600, s * 262, zp - 10], "Suzhou_GraniteDark", 2));
  // the balustrade round the platform, open at the steps
  for (const [a, b] of [[[-590, -890, zp], [-590, -240, zp]], [[-590, 240, zp], [-590, 890, zp]], [[-590, -890, zp], [550, -890, zp]], [[-590, 890, zp], [550, 890, zp]], [[550, -890, zp], [550, 890, zp]]] as [V3, V3][])
    P.push(balustrade(a, b, 64));
  // columns on stone bases
  for (const x of cx) for (const y of cy) {
    P.push(cylinderAt({ rBot: 34, rTop: 28, height: 16, segments: 10, bottom: [x, y, zp] }, GRANITE));
    P.push(cylinderAt({ rBot: 23, rTop: 21, height: H - 16, segments: 12, bottom: [x, y, zp + 16] }, RED));
  }
  // walls: lattice doors across the front behind the porch, red walls round the sides and back
  P.push(bb([-150, -760, zp], [430, 760, zp + H - 40], "Suzhou_WallRed"));
  for (let b = 0; b < 5; b++) {
    const y0 = cy[b] + 22, y1 = cy[b + 1] - 22, w = (y1 - y0) / 4;
    for (let d = 0; d < 4; d++) {
      const ya = y0 + d * w + 2, yb = ya + w - 4;
      P.push(lattice(-154, ya, yb, zp + 120, zp + H - 70, RED, "PaperShoji", 16));
      P.push(bb([-158, ya - 2, zp], [-150, yb + 2, zp + 112], RED), bb([-160, ya + 8, zp + 20], [-158, yb - 8, zp + 96], "GoldTrim"));
    }
  }
  for (const s of [-1, 1]) for (const x of [0, 280]) P.push(rotateZ(lattice(-760 - 2, x - 70, x + 70, zp + 160, zp + 300, "WoodShade"), s * 90));
  // beams and brackets, the plaque
  for (let k = 0; k < 4; k++) {
    const w = k % 2 ? 420 : 750, d = k % 2 ? 750 : 420;
    P.push(rotateZ(paintedBeam(-d - 16, -w - 20, w + 20, zp + H - 46, 44, 30), k * 90));
  }
  P.push(bracketRing(420, 750, zp + H, 76, spread(-750, 750, 11), spread(-420, 420, 7), 1));
  P.push(translate(rotateY(signboard(0, 0, 0, 120, 200, 3, true), -8), [-452, 0, zp + H - 120]));
  P.push(bb([-448, -64, zp + H - 230], [-444, 64, zp + H - 222], "GoldTrim"));
  // the roof
  P.push(rotateZ(roof({ kind: "xieshan", hx: 750 + 250, hy: 420 + 250, z: zp + H + 76, h: 350, curve: 1.65, lift: 78, flare: 34, th: 26, gableAt: 0.5, curls: 1.6, pearl: true, nt: 9, ns: 14 }), 90));
  return merge(...P);
}

// A gate hall for a walled compound: three bays on a low platform, crimson columns, great red
// doors studded with gold in the middle under a plaque, white walls with round lattice windows
// either side, a hip-and-gable roof. 8.4 m along Y, the way through along X.
function gateHall(): Geo {
  const P: Geo[] = [];
  const zp = 40, H = 340, hx = 200, hy = 400;
  P.push(bb([-hx - 110, -hy - 50, 0], [hx + 110, hy + 50, zp], GRANITE, 2));
  for (const s of [-1, 1]) P.push(bb([s * (hx + 110) - (s > 0 ? 0 : 50), -150, 0], [s * (hx + 110) + (s > 0 ? 50 : 0), 150, 20], GRANITE, 2));
  for (const x of [-hx, hx]) for (const y of spread(-hy, hy, 4)) P.push(cylinderAt({ radius: 16, height: H, segments: 10, bottom: [x, y, zp] }, RED));
  // the doors at the middle line, open a crack
  P.push(bb([-14, -140, zp], [14, -133, zp + 290], RED), bb([-14, 133, zp], [14, 140, zp + 290], RED));
  P.push(bb([-16, -140, zp + 290], [16, 140, zp + H], RED), bb([-20, -133, zp], [20, 133, zp + 14], "Suzhou_GraniteDark"));
  for (const s of [-1, 1]) {
    P.push(translate(rotateZ(bb([-5, 0, 0], [5, 128, 270], RED), s * 12), [0, s * -126, zp + 14]));
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) P.push(translate(rotateZ(sphereCenter(3.5, [-7, 22 + c * 28, 40 + r * 50], "GoldTrim", 6), s * 12), [0, s * -126, zp + 14]));
  }
  P.push(signboard(-18, 0, zp + 315, 170, 46, 3), rotateZ(signboard(-18, 0, zp + 315, 170, 46, 3), 180));
  // the side bays: white walls, round windows
  for (const s of [-1, 1]) {
    P.push(bb([-14, s * 140, zp], [14, s * hy, zp + H], WHITE));
    P.push(extrude(circlePts(58, s * 270, zp + 170, 20), [circlePts(48, s * 270, zp + 170, 20)], "x", -20, 40, GRANITE));
    for (let i = -2; i <= 2; i++) P.push(bb([-17, s * 270 + i * 18 - 1.5, zp + 128], [17, s * 270 + i * 18 + 1.5, zp + 212], "WoodShade"), bb([-17, s * 270 - 42, zp + 170 + i * 18 - 1.5], [17, s * 270 + 42, zp + 170 + i * 18 + 1.5], "WoodShade"));
    P.push(bb([-15, s * 270 - 50, zp + 120], [15, s * 270 + 50, zp + 220], "PaperShoji"));
  }
  for (const sx of [-1, 1]) P.push(sx < 0 ? paintedBeam(-hx - 14, -hy - 16, hy + 16, zp + H - 36, 32, 28) : rotateZ(paintedBeam(-hx - 14, -hy - 16, hy + 16, zp + H - 36, 32, 28), 180));
  P.push(bracketRing(hx, hy, zp + H, 50, spread(-hy, hy, 7), spread(-hx, hx, 3), 0.7));
  P.push(rotateZ(roof({ kind: "xieshan", hx: hy + 160, hy: hx + 170, z: zp + H + 50, h: 230, curve: 1.7, lift: 60, flare: 24, th: 16, gableAt: 0.5, curls: 0.9, nt: 7, ns: 10 }), 90));
  return merge(...P);
}

// A whitewashed garden wall 4 m along Y under a coping of dark tiles, with a leak window (a
// lattice of tiles) in the middle. Tiles end to end.
function courtyardWall(): Geo {
  const P: Geo[] = [bb([-26, -200, 0], [26, 200, 30], GRANITE)];
  const w0 = -48, w1 = 48, z0 = 110, z1 = 200;
  P.push(bb([-20, -200, 30], [20, w0, 260], WHITE), bb([-20, w1, 30], [20, 200, 260], WHITE));
  P.push(bb([-20, w0, 30], [20, w1, z0], WHITE), bb([-20, w0, z1], [20, w1, 260], WHITE));
  // the leak window: a grey frame and tiles laid in a pattern of overlapping rings
  P.push(bb([-22, w0 - 8, z0 - 8], [22, w0, z1 + 8], "Suzhou_GraniteDark"), bb([-22, w1, z0 - 8], [22, w1 + 8, z1 + 8], "Suzhou_GraniteDark"));
  P.push(bb([-22, w0, z0 - 8], [22, w1, z0], "Suzhou_GraniteDark"), bb([-22, w0, z1], [22, w1, z1 + 8], "Suzhou_GraniteDark"));
  for (const [cy, cz] of [[-24, 132], [24, 132], [-24, 178], [24, 178], [0, 155]] as const) P.push(translate(rotateY(torus(20, 2.6, 12, 4, "Suzhou_GraniteDark"), 90), [0, cy, cz]));
  P.push(bb([-20, -200, 258], [20, 200, 266], RIDGE));
  P.push(rotateZ(roof({ kind: "gable", hx: 200, hy: 46, z: 262, h: 26, th: 7, curve: 1.05, ends: false, curls: 0, nt: 2, ns: 2 }), 90));
  return merge(...P);
}

// A moon gate: a whitewashed wall 5 m along Y with a round opening 2.3 m across ringed in
// granite, a stone tablet over it and a tiled coping; the way through along X.
function moonGate(): Geo {
  const P: Geo[] = [];
  const R = 115, cz = 142;
  P.push(extrude([[-250, 30], [250, 30], [250, 320], [-250, 320]], [circlePts(R + 14, 0, cz, 32)], "x", -22, 44, WHITE));
  P.push(extrude(circlePts(R + 14, 0, cz, 32), [circlePts(R, 0, cz, 32)], "x", -27, 54, GRANITE));
  P.push(bb([-28, -250, 0], [28, -R + 30, 30], GRANITE), bb([-28, R - 30, 0], [28, 250, 30], GRANITE));
  P.push(bb([-40, -R + 30, 0], [40, R - 30, 26], "Suzhou_GraniteDark", 2));
  P.push(signboard(-27, 0, 290, 90, 30, 2), rotateZ(signboard(-27, 0, 290, 90, 30, 2), 180));
  P.push(bb([-22, -250, 318], [22, 250, 326], RIDGE));
  P.push(rotateZ(roof({ kind: "gable", hx: 250, hy: 48, z: 322, h: 28, th: 7, curve: 1.05, ends: false, curls: 0, nt: 2, ns: 2 }), 90));
  for (const s of [-1, 1]) P.push(limb([[0, s * 236, 352], [0, s * 254, 356], [0, s * 264, 372]], 7, 2.5, RIDGE, { seg: 6 }));
  return merge(...P);
}

// ---- the canals and the harbour (the water lies 110 cm below the ground) ----

// A stone hump bridge over a canal (7 m of water between the canal walls): the way over runs
// along X, 13 m from end to end and 4.3 m wide; the deck rises only 40 cm (it stays walkable on
// flat ground) while the arch below it springs from the water, ringed in dark granite. Marble
// balustrades with drum stones at their ends.
function humpBridge(): Geo {
  const P: Geo[] = [];
  const Lh = 650, W = 215;
  const zD = (x: number) => 5 + 35 * Math.pow(Math.max(0, 1 - (x / Lh) ** 2), 1.3);
  const xs = spread(-Lh, Lh, 27);
  // the deck, with low steps across it
  P.push(sweep(xs.map((x): V3 => [x, 0, zD(x) - 12]), 2 * W, 24, GRANITE, { swapUv: true }));
  for (const x of spread(-Lh + 70, Lh - 70, 21)) P.push(boxAt([6, 2 * W - 40, 2.5], [x, 0, zD(x) - 0.5], "Suzhou_GraniteDark"));
  // the spandrel walls with the arch through them
  const a = 290, zs = -170, zc = -2, R = (a * a + (zc - zs) ** 2) / (2 * (zc - zs)), zcen = zc - R, th0 = Math.asin(a / R);
  const arc = (r: number, n = 16): Pts => Array.from({ length: n + 1 }, (_, i): [number, number] => { const t = th0 - (2 * th0 * i) / n; return [r * Math.sin(t), zcen + r * Math.cos(t)]; });
  const hole: Pts = [[-a, -250], [a, -250], ...arc(R).map(([x, z]): [number, number] => [x, Math.max(z, zs)])];
  const outline: Pts = [[-Lh + 10, -260], [Lh - 10, -260], ...[...xs].reverse().map((x): [number, number] => [Math.max(-Lh + 10, Math.min(Lh - 10, x)), zD(x) - 10])];
  for (const s of [-1, 1]) P.push(extrude(outline, [hole], "y", s < 0 ? -W : W - 30, 30, GRANITE));
  // the voussoir rings and keystones on both faces, the vault under the arch
  for (const s of [-1, 1]) {
    P.push(sweep(arc(R + 16).map(([x, z]): V3 => [x, s * (W + 2), z]), 8, 32, "Suzhou_GraniteDark"));
    P.push(boxAt([30, 10, 44], [0, s * (W + 3), zc - 12], "Suzhou_GraniteDark", 2));
  }
  const vault = [arc(R).map(([x, z]): V3 => [x, -W + 30, z]), arc(R).map(([x, z]): V3 => [x, W - 30, z])];
  P.push(surface(vault, vault.map((row) => row.map((p, i): [number, number] => [i * 0.4, p[1] / 100])), GRANITE, (c) => sub([0, c[1], zcen], c)));
  // the balustrades: posts, a panel and a rail following the hump, drum stones at the ends
  for (const s of [-1, 1]) {
    const y = s * (W - 16), inner = xs.filter((x) => Math.abs(x) <= Lh - 90);
    for (const x of spread(-Lh + 90, Lh - 90, 11)) P.push(boxAt([15, 15, 66], [x, y, zD(x) - 2], "Suzhou_Marble", 1.5), lathe([[6, 0], [9, 3], [9, 9], [4, 16], [0, 18]], 8, "Suzhou_Marble", [x, y, zD(x) + 64]));
    P.push(sweep(inner.map((x): V3 => [x, y, zD(x) + 54]), 12, 10, "Suzhou_Marble"), sweep(inner.map((x): V3 => [x, y, zD(x) + 26]), 7, 38, "Suzhou_Marble"));
    for (const sx of [-1, 1]) {
      const x = sx * (Lh - 50);
      P.push(boxAt([70, 22, 20], [x, y, zD(x) - 4], "Suzhou_Marble", 2), cylinderBetween([x - sx * 4, y - 11, zD(x) + 44], [x - sx * 4, y + 11, zD(x) + 44], 26, 14, "Suzhou_Marble"));
      P.push(boxAt([40, 18, 30], [x - sx * 26, y, zD(x) + 14], "Suzhou_Marble", 2));
    }
  }
  return merge(...P);
}

// A canal wall of dressed granite, 4 m along Y: the coping a little proud of the ground, the
// face (at -X) dropping 2 m past the water line, a dark wet band at the water. Tiles end to end.
function canalWall(): Geo {
  const P: Geo[] = [bb([0, -200, -230], [70, 200, 0], "Suzhou_GraniteDark")];
  for (let r = 0; r < 5; r++) {
    const z1 = -6 - r * 45, z0 = z1 - 45;
    const off = (r % 2) * 50;
    for (let y = -200 - off; y < 200; y += 100) {
      const ya = Math.max(-200, y), yb = Math.min(200, y + 100);
      if (yb - ya > 8) P.push(bb([-4, ya + 1.5, z0 + 1.5], [8, yb - 1.5, z1 - 1.5], r === 2 ? "Suzhou_Algae" : r > 2 ? "Suzhou_GraniteDark" : GRANITE, 2));
    }
  }
  P.push(bb([-16, -200, -8], [44, 200, 8], GRANITE, 2));
  for (const y of [-100, 100]) P.push(bb([-17, y - 0.8, -7], [44, y + 0.8, 7.5], "Suzhou_GraniteDark"));
  return merge(...P);
}

// The harbour quay, 4 m along Y: big granite blocks dropping to 2.6 m under the ground, a broad
// coping, a stone bollard and an iron mooring ring on its face.
function quay(): Geo {
  const P: Geo[] = [bb([-10, -200, -270], [90, 200, -6], "Suzhou_GraniteDark")];
  const rnd = seeded(13);
  for (let r = 0; r < 5; r++) {
    const z1 = -10 - r * 52, z0 = z1 - 52;
    let y = -200 + (r % 2) * 40;
    if (r % 2) P.push(bb([-22 - r * 3, -199, z0 + 1.5], [20, -162, z1 - 1.5], r === 2 ? "Suzhou_Algae" : GRANITE, 3));
    while (y < 199) {
      const w = Math.min(200 - y, 70 + rnd() * 50);
      if (w > 12) P.push(bb([-22 - r * 3, y + 1.5, z0 + 1.5], [20, y + w - 1.5, z1 - 1.5], r === 2 ? "Suzhou_Algae" : r > 2 ? "Suzhou_GraniteDark" : rnd() < 0.6 ? GRANITE : "MossStone", r < 2 ? 3 : 0));
      y += w;
    }
  }
  for (let i = 0; i < 2; i++) P.push(bb([-36, -200 + i * 200 + 1, -12], [70, -1 + i * 200, 10], GRANITE, 3));
  P.push(cylinderAt({ rBot: 17, rTop: 13, height: 46, segments: 10, bottom: [12, 120, 10] }, "Suzhou_GraniteDark"), cylinderAt({ rBot: 19, rTop: 14, height: 10, segments: 10, bottom: [12, 120, 56] }, "Suzhou_GraniteDark"));
  P.push(translate(rotateY(torus(11, 2.2, 12, 4, "IronDark"), 90), [-40, -80, -40]), boxAt([6, 10, 10], [-38, -80, -32], "IronDark"));
  return merge(...P);
}

// A wooden pier, 4 m along Y and 3 m wide; its deck is 12 cm over the ground, its piles go down
// into the water. Joins end to end.
function pier(): Geo {
  const P: Geo[] = [];
  const n = 14, w = 400 / n;
  for (let i = 0; i < n; i++) P.push(bb([-150, -200 + i * w + 1, 4], [150, -200 + (i + 1) * w - 1, 12], i % 4 === 1 ? "WoodPale" : "WoodGrey", 1));
  for (const x of [-120, 0, 120]) P.push(bb([x - 8, -200, -14], [x + 8, 200, 4], "WoodDark"));
  for (const y of [-150, 150]) {
    P.push(bb([-166, y - 9, -34], [166, y + 9, -14], "WoodDark"));
    for (const x of [-158, 158]) {
      P.push(cylinderAt({ radius: 13, height: 360, segments: 10, bottom: [x, y, -320] }, "WoodGrey"));
      P.push(translate(torus(13.5, 2.4, 12, 4, "RopeTan"), [x, y, -10]));
    }
    P.push(beamBetween([-158, y, -200], [158, y, -40], 8, 8, "WoodDark"));
  }
  for (const s of [-1, 1]) P.push(bb([s * 142, -200, 12], [s * 152, 200, 18], "WoodDark"));
  for (let k = 0; k < 3; k++) P.push(translate(torus(17 - k * 4, 3, 12, 4, "RopeTan"), [96, 110, 15 + k * 4]));
  return merge(...P);
}

// Boats: a hull lofted through cross-sections, bow at -X, keel at z = 0.
interface Hull {
  L: number;
  half: (u: number) => number;
  keel: (u: number) => number;
  sheer: (u: number) => number;
}
function hullPoint(h: Hull, u: number, a: number, inset = 0): V3 {
  const x = -h.L / 2 + u * h.L;
  const hb = Math.max(0.5, h.half(u) - inset), kz = h.keel(u) + inset, sz = h.sheer(u);
  const t = (Math.abs(a) * Math.PI) / 2;
  return [x, Math.sign(a) * hb * Math.pow(Math.sin(t), 0.6), kz + (sz - kz) * Math.pow(1 - Math.cos(t), 1.15)];
}
function hullGeo(h: Hull, outer: string, inner: string, rim: string, n = 16, k = 10): Geo {
  const us = Array.from({ length: n + 1 }, (_, i) => i / n);
  const as = Array.from({ length: k + 1 }, (_, j) => -1 + (2 * j) / k);
  const mid = (u: number) => (h.keel(u) + h.sheer(u)) / 2;
  const outward = (c: V3): V3 => {
    const u = Math.max(0, Math.min(1, (c[0] + h.L / 2) / h.L));
    return sub(c, [Math.max(-h.L * 0.3, Math.min(h.L * 0.3, c[0])), 0, mid(u)]);
  };
  const uvs = (G: V3[][]) => G.map((row) => { let acc = 0; return row.map((p, j): [number, number] => { if (j) acc += len(sub(p, row[j - 1])); return [p[0] / 100, acc / 100]; }); });
  const O = us.map((u) => as.map((a) => hullPoint(h, u, a)));
  const I = us.map((u) => as.map((a) => hullPoint(h, u, a, 5)));
  const P: Geo[] = [surface(O, uvs(O), outer, outward), surface(I, uvs(I), inner, (c) => mul(outward(c), -1))];
  for (const j of [0, k]) P.push(surface(us.map((_, i) => [O[i][j], I[i][j]]), us.map((_, i): [number, number][] => [[O[i][j][0] / 100, 0], [O[i][j][0] / 100, 0.05]]), rim, UP));
  for (const [i, s] of [[0, -1], [n, 1]] as const) {
    P.push(fan([O[i][0][0], 0, h.sheer(us[i])], O[i], outer, [s, 0, 0], (p) => [p[1] / 100, p[2] / 100]));
    P.push(fan([I[i][0][0] - s * 0.5, 0, h.sheer(us[i])], I[i].map((p): V3 => [p[0] - s * 0.5, p[1], p[2]]), inner, [-s, 0, 0], (p) => [p[1] / 100, p[2] / 100]));
  }
  return merge(...P);
}
// A band along the hull's side at depth `dz` below the sheer, both sides.
function hullBand(h: Hull, dz: number, w: number, mat: string, n = 18): Geo {
  return merge(...[-1, 1].map((s) => sweep(Array.from({ length: n + 1 }, (_, i) => { const p = hullPoint(h, i / n, s); return [p[0], p[1] + s * 3, p[2] - dz] as V3; }), 7, w, mat)));
}

// A junk of the western sea: a flat transom bow painted with watchful eyes, a towering stern
// castle with a cabin under an upturned roof, a great rudder, three masts carrying fan-shaped
// lug sails stiffened by bamboo battens, their sheets running aft; cargo on deck. 13 m long;
// sits about 70 cm deep (keel at z = 0).
function junk(): Geo {
  const h: Hull = {
    L: 1300,
    half: (u) => (u < 0.42 ? 78 + 132 * Math.sin((Math.PI / 2) * (u / 0.42)) : 210 - 52 * ((u - 0.42) / 0.58) ** 2),
    keel: (u) => (u < 0.18 ? 70 * (1 - u / 0.18) ** 2 : u > 0.86 ? 50 * ((u - 0.86) / 0.14) ** 1.5 : 0),
    sheer: (u) => 175 + (u < 0.25 ? 110 * (1 - u / 0.25) ** 2 : 0) + (u > 0.62 ? 200 * ((u - 0.62) / 0.38) ** 2 : 0),
  };
  const at = (u: number) => -h.L / 2 + u * h.L;
  const P: Geo[] = [hullGeo(h, "Suzhou_Hull", "WoodWarm", "WoodDark", 22, 12)];
  P.push(hullBand(h, 6, 14, RED), hullBand(h, 22, 10, "Suzhou_White"), hullBand(h, 40, 12, "WoodDark"));
  // the bow transom, red, and the eyes
  P.push(fan([at(0) - 3, 0, h.sheer(0) - 60], Array.from({ length: 9 }, (_, i) => { const p = hullPoint(h, 0, -1 + (2 * i) / 8); return [p[0] - 3, p[1] * 0.9, Math.max(p[2], h.sheer(0) - 120)] as V3; }), RED, [-1, 0, 0], (p) => [p[1] / 100, p[2] / 100]));
  for (const s of [-1, 1]) {
    const e = hullPoint(h, 0.05, s * 0.78);
    P.push(disc(22, [e[0], e[1] + s * 3, e[2]], "Suzhou_White", "y", 2, 14), disc(10, [e[0] - 2, e[1] + s * 4.5, e[2]], "Suzhou_Ink", "y", 2, 10));
  }
  // the deck
  const zd = 158;
  const deckW = (u: number) => {
    const kz = h.keel(u) + 5, sz = h.sheer(u), f = Math.max(0, Math.min(1, (zd - kz) / (sz - kz)));
    const t = Math.acos(1 - Math.pow(f, 1 / 1.15));
    return (h.half(u) - 5) * Math.pow(Math.sin(t), 0.6);
  };
  const us = Array.from({ length: 15 }, (_, i) => 0.04 + (0.7 * i) / 14);
  const deck = us.map((u) => [[at(u), -deckW(u), zd], [at(u), deckW(u), zd]] as V3[]);
  P.push(surface(deck, deck.map((r) => r.map((p): [number, number] => [p[1] / 100, p[0] / 100])), "WoodPale", UP));
  // the stern castle: a raised deck, a cabin with lattice windows under a little upturned roof
  const zq = 290, q0 = 0.74;
  const qus = Array.from({ length: 7 }, (_, i) => q0 + ((0.99 - q0) * i) / 6);
  const qd = qus.map((u) => [[at(u), -(h.half(u) - 8), zq], [at(u), h.half(u) - 8, zq]] as V3[]);
  P.push(surface(qd, qd.map((r) => r.map((p): [number, number] => [p[1] / 100, p[0] / 100])), "WoodPale", UP));
  P.push(bb([at(q0) - 4, -h.half(q0) + 6, zd], [at(q0) + 6, h.half(q0) - 6, zq], "WoodShade"));
  const c0 = at(0.77), c1 = at(0.92);
  P.push(bb([c0, -110, zq], [c1, 110, zq + 160], "WoodWarm", 2));
  for (const s of [-1, 1]) P.push(rotateZ(lattice(-112, -(c1 - c0) / 2 + 30, (c1 - c0) / 2 - 30, zq + 40, zq + 130, RED), s * 90).map((p) => ({ geo: p.geo.clone().translate((c0 + c1) / 2, 0, 0), mat: p.mat })));
  P.push(lattice(c0 - 2, -70, 70, zq + 30, zq + 140, RED));
  P.push(translate(roof({ kind: "hip", hx: (c1 - c0) / 2 + 40, hy: 150, z: zq + 166, h: 70, curve: 1.5, lift: 30, flare: 12, th: 10, curls: 0.6, horns: 26, nt: 3, ns: 6 }), [(c0 + c1) / 2, 0, 0]));
  P.push(railing([at(0.76), -h.half(0.76) + 10, zq], [at(0.99), -h.half(0.99) + 10, zq], 50), railing([at(0.76), h.half(0.76) - 10, zq], [at(0.99), h.half(0.99) - 10, zq], 50));
  // the rudder, the tiller, a stern lantern
  P.push(bb([at(1) + 6, -8, 40], [at(1) + 100, 8, 300], "WoodDark", 2), cylinderBetween([at(1) + 20, 0, 300], [at(1) + 20, 0, 400], 6, 6, "WoodDark"));
  P.push(cylinderBetween([at(1) + 20, 0, 380], [at(0.92), 0, zq + 60], 4, 6, "WoodDark"));
  P.push(lantern(20, [at(1) + 30, 0, 470]), cylinderBetween([at(0.97), 0, zq], [at(1) + 30, 0, 480], 3, 5, "WoodDark"));
  // masts and their lug sails
  const sail = (u: number, zb: number, H: number, W: number, rise: number, n: number, mat: string): Geo => {
    const mx = at(u), out: Geo[] = [];
    out.push(cylinderAt({ rBot: 12, rTop: 7, height: H + rise + 80, segments: 8, bottom: [mx, 0, zb - 40] }, "WoodWarm"));
    const z0 = zb + 60;
    const luff = (j: number): V3 => [mx - W * 0.28, -10, z0 + (H * j) / n];
    const leech = (j: number): V3 => [mx + W * 0.72 + 50 * Math.sin((Math.PI * j) / n), -10, z0 + (H * j) / n + rise * Math.pow(j / n, 1.6)];
    const rows: V3[][] = [];
    for (let j = 0; j <= n; j++) {
      const L = luff(j), E = leech(j);
      rows.push([L, add(mul(add(L, E), 0.5), [0, -4, 0]), E]);
      if (j < n) {
        const L2 = luff(j + 1), E2 = leech(j + 1);
        rows.push([mul(add(L, L2), 0.5), add(mul(add(add(L, E), add(L2, E2)), 0.25), [0, -18, 0]), mul(add(E, E2), 0.5)]);
      }
    }
    const uv = rows.map((r) => r.map((p): [number, number] => [p[0] / 100, p[2] / 100]));
    out.push(surface(rows, uv, mat, [0, -1, 0]), surface(rows.map((r) => r.map((p) => add(p, [0, 1, 0]))), uv, mat, [0, 1, 0]));
    for (let j = 0; j <= n; j++) out.push(cylinderBetween(add(luff(j), [-6, -6, 0]), add(leech(j), [6, -6, 0]), j === 0 || j === n ? 4.5 : 3, 5, j === n ? "WoodDark" : "BambooDry"));
    // sheets fanning down to the stern
    const anchor: V3 = [at(Math.min(0.99, u + 0.3)), 0, u > 0.7 ? zq + 40 : zd + 40];
    for (let j = 1; j <= n; j += 2) out.push(cylinderBetween(leech(j), anchor, 0.8, 3, "RopeTan"));
    out.push(cylinderBetween([mx, 0, zb + H + rise + 40], [at(u < 0.2 ? 0 : u - 0.2), 0, zd + 30], 0.9, 3, "RopeTan"));
    out.push(bb([mx - 1, 0, zb + H + rise + 10], [mx + 1, 80, zb + H + rise + 34], "FabricRed"));
    return merge(...out);
  };
  P.push(rotateY(sail(0.15, zd, 560, 400, 140, 7, "Suzhou_Sail"), -6, [at(0.15), 0, zd]));
  P.push(sail(0.42, zd, 760, 520, 200, 9, "Suzhou_Sail"));
  P.push(sail(0.84, zq, 380, 300, 100, 6, "Suzhou_SailPale"));
  // cargo: tea chests and jars lashed on deck, an anchor at the bow
  for (const [u, y] of [[0.25, -60], [0.25, 60], [0.31, 0], [0.55, -70], [0.6, 60]] as const) P.push(boxAt([60, 56, 50], [at(u), y, zd], "WoodPale", 2), bb([at(u) - 31, y - 20, zd + 14], [at(u) - 30, y + 20, zd + 36], "FabricRed"));
  for (const y of [-40, 20]) P.push(lathe([[0, 0], [20, 2], [28, 22], [24, 44], [12, 54], [13, 60], [0, 60]], 10, "Suzhou_Porcelain", [at(0.66), y, zd]), lathe([[27.2, 0], [28.4, 8], [27.6, 16], [0, 16]], 10, "Suzhou_Cobalt", [at(0.66), y, zd + 20]));
  P.push(cylinderBetween([at(0.02), -50, 230], [at(0.02) - 30, -70, 120], 5, 6, "IronDark"), beamBetween([at(0.02) - 40, -70, 125], [at(0.02) - 20, -70, 105], 6, 30, "IronDark"));
  return merge(...P);
}

// A black-awning sampan of the canals: a slim black hull, arched awnings of dark woven bamboo,
// a long sculling oar over the stern, a pole and a fish basket. 6.4 m long; place it about 30 cm
// deep in the water.
function sampan(): Geo {
  const h: Hull = {
    L: 640,
    half: (u) => (u < 0.35 ? 10 + 74 * Math.sin((Math.PI / 2) * (u / 0.35)) : 84 * (1 - 0.32 * ((u - 0.35) / 0.65) ** 2)),
    keel: (u) => (u < 0.2 ? 34 * (1 - u / 0.2) ** 2 : u > 0.82 ? 18 * ((u - 0.82) / 0.18) ** 2 : 0),
    sheer: (u) => 52 + (u < 0.3 ? 38 * (1 - u / 0.3) ** 2 : 0) + (u > 0.75 ? 22 * ((u - 0.75) / 0.25) ** 2 : 0),
  };
  const at = (u: number) => -h.L / 2 + u * h.L;
  const P: Geo[] = [hullGeo(h, "Suzhou_HullBlack", "WoodPale", "WoodWarm")];
  P.push(hullBand(h, 3, 7, "WoodWarm", 14));
  P.push(bb([at(0.15), -48, 12], [at(0.9), 48, 16], "WoodPale"));
  for (const u of [0.24, 0.88]) P.push(bb([at(u) - 12, -h.half(u) + 6, h.sheer(u) - 16], [at(u) + 12, h.half(u) - 6, h.sheer(u) - 10], "WoodWarm"));
  // the awnings, one stepping down behind the other
  for (const [u0, u1, ht] of [[0.32, 0.47, 78], [0.47, 0.61, 74], [0.61, 0.7, 66]] as const) {
    const w = h.half((u0 + u1) / 2) - 4;
    const arc = (x: number) => Array.from({ length: 11 }, (_, j): V3 => { const t = -Math.PI / 2 + (Math.PI * j) / 10; return [x, w * Math.sin(t), 46 + ht * Math.cos(t)]; });
    const rows = [arc(at(u0)), arc((at(u0) + at(u1)) / 2), arc(at(u1))];
    const uv = rows.map((r) => r.map((p, j): [number, number] => [j * 0.2, p[0] / 100]));
    P.push(surface(rows, uv, "Suzhou_Mat", (c) => [0, c[1], c[2] - 46]), surface(rows.map((r) => r.map((p) => add(p, [0, 0, -1.5]))), uv, "BambooDry", (c) => [0, -c[1], 46 - c[2]]));
    for (const x of [at(u0), at(u1)]) P.push(sweep(arc(x), 5, 4, "WoodDark"));
  }
  // the sculling oar, a punt pole, a fish basket and a stool
  P.push(cylinderBetween([at(1) + 170, 24, -40], [at(0.8), -24, 120], 3.6, 6, "WoodPale"), translate(rotateZ(box([70, 18, 3], [0, 0, 0], "WoodPale"), 12), [at(1) + 170, 24, -40]));
  P.push(cylinderBetween([at(0.12), 30, 40], [at(0.86), 40, 70], 2.4, 5, "Bamboo"));
  P.push(cylinderAt({ rBot: 14, rTop: 18, height: 26, segments: 10, bottom: [at(0.22), 20, 16] }, "BambooDry"), boxAt([28, 28, 26], [at(0.8), 0, 16], "WoodWarm", 1.5));
  return merge(...P);
}

// Rocks along a natural shore, 4 m along Y, the sea at -X: big rocks from the bank down past the
// water line (covering the ground's edge), smaller ones on the bank.
function shoreRocks(): Geo {
  const P: Geo[] = [];
  const rnd = seeded(77);
  for (let i = 0; i < 5; i++) {
    const y = -168 + i * 84 + (rnd() - 0.5) * 30, s = 110 + rnd() * 80;
    P.push(translate(rock([s, s * (0.75 + rnd() * 0.25), s * (0.8 + rnd() * 0.4)], 0.5, 300 + i * 7, rnd() < 0.35 ? "MossStone" : "StoneGrey"), [-20 + (rnd() - 0.5) * 50, y, -150]));
  }
  for (let i = 0; i < 5; i++) {
    const y = -180 + i * 90 + rnd() * 20, s = 60 + rnd() * 40;
    P.push(translate(rock([s, s * 0.8, s * 0.7], 0.45, 340 + i * 5, "StoneDark"), [-130 - rnd() * 50, y, -150]));
  }
  for (let i = 0; i < 6; i++) {
    const y = -185 + i * 70 + rnd() * 15, s = 22 + rnd() * 22;
    P.push(translate(rock([s, s * 0.8, s * 0.5], 0.4, 380 + i * 3, rnd() < 0.5 ? "MossStone" : "StoneGrey", true), [60 + rnd() * 50, y, -3]));
  }
  return merge(...P);
}

// ---- streets, markets, gardens ----

// Red lanterns strung across a street on a sagging cord, 12 m along Y between two iron wall
// plates at 4.7 m (stretch it to the street's width).
function lanternString(): Geo {
  const z = 470, sag = 60, half = 600;
  const zc = (y: number) => z - sag * (1 - (y / half) ** 2);
  const P: Geo[] = [sweep(spread(-half, half, 25).map((y): V3 => [0, y, zc(y)]), 2.2, 2.2, "Suzhou_Ink")];
  for (const y of spread(-480, 480, 7)) P.push(lantern(19, [0, y, zc(y) - 1]));
  for (const s of [-1, 1]) P.push(boxAt([14, 8, 34], [0, s * half, z - 18], "IronDark"));
  return merge(...P);
}

// A market stall under an indigo awning: a counter of silk, porcelain and tea, bamboo poles, a
// lantern and a little sign; the seller stands behind (+X). 3 m along Y.
function marketStall(): Geo {
  const P: Geo[] = [
    bb([-96, -140, 0], [-10, 140, 78], "WoodWarm", 2),
    bb([-102, -146, 78], [-4, 146, 84], "WoodDark"),
    bb([-98, -136, 10], [-94, 136, 70], "Suzhou_Indigo"),
  ];
  P.push(goods(-52, -140, 140, 84, 31));
  for (const [x, y, hgt] of [[-126, -158, 228], [-126, 158, 228], [104, -158, 278], [104, 158, 278]] as const) P.push(cylinderAt({ radius: 4, height: hgt, segments: 6, bottom: [x, y, 0] }, "Bamboo"));
  P.push(slab([-134, -172, 222], [-134, 172, 222], [112, 172, 278], [112, -172, 278], 3, "Suzhou_Indigo", "Suzhou_Indigo", "Suzhou_Cream"));
  P.push(bb([-137, -172, 196], [-133, 172, 222], "Suzhou_Cream"), bb([-138, -172, 196], [-136, 172, 202], "FabricRed"));
  P.push(lantern(16, [-130, 150, 210]));
  P.push(translate(rotateZ(signboard(0, 0, 0, 26, 90, 3, true), 90), [-126, -150, 150]));
  P.push(boxAt([56, 50, 46], [50, 80, 0], "WoodPale", 2), boxAt([50, 46, 40], [50, 80, 46], "WoodPale", 2), boxAt([30, 30, 3], [40, -60, 0], "BambooDry"));
  P.push(cylinderAt({ rBot: 18, rTop: 22, height: 30, segments: 10, bottom: [40, -60, 3] }, "BambooDry"));
  return merge(...P);
}

// Tea chests stacked on a pallet for loading, red paper labels and rope, about 2 x 1.6 m.
function teaChests(): Geo {
  const P: Geo[] = [bb([-104, -84, 0], [104, 84, 10], "WoodDark")];
  const chest = (x: number, y: number, z: number, turn: number) => {
    const g = merge(
      boxAt([62, 52, 46], [0, 0, 0], "WoodPale", 2),
      bb([-32, -16, 12], [-31, 16, 38], "FabricRed"),
      bb([-33, -4, 16], [-32, 4, 34], "Suzhou_Ink"), bb([-33, -10, 28], [-32, 10, 31], "Suzhou_Ink"),
      bb([-32, -27, 21], [32, 27, 25], "RopeTan"),
    );
    P.push(translate(rotateZ(g, turn), [x, y, z]));
  };
  for (const x of [-66, 0, 66]) for (const y of [-54, 0, 54]) if (!(x === 66 && y === 54)) chest(x, y, 10, (x + y) % 4 === 0 ? 0 : 180);
  for (const [x, y] of [[-33, -27], [-33, 27], [33, -27]] as const) chest(x, y, 56, 0);
  chest(-33, 0, 102, 0);
  return merge(...P);
}

// Blue-and-white porcelain packed in straw for the junks: a tall vase, ginger jars, stacked bowls.
function porcelainJars(): Geo {
  const P: Geo[] = [boxAt([200, 150, 6], [0, 0, 0], "Thatch")];
  const jar = (x: number, y: number, k: number) => {
    P.push(lathe([[0, 0], [16 * k, 1], [26 * k, 14 * k], [27 * k, 30 * k], [20 * k, 46 * k], [11 * k, 52 * k], [11 * k, 58 * k], [0, 58 * k]], 12, "Suzhou_Porcelain", [x, y, 6]));
    P.push(lathe([[26.6 * k, 0], [27.6 * k, 8 * k], [26.8 * k, 16 * k], [0, 16 * k]], 12, "Suzhou_Cobalt", [x, y, 6 + 18 * k]));
    P.push(lathe([[0, 0], [13 * k, 0], [12 * k, 5 * k], [5 * k, 9 * k], [5 * k, 12 * k], [0, 13 * k]], 10, "Suzhou_Cobalt", [x, y, 6 + 58 * k]));
  };
  jar(-50, -30, 1.15);
  jar(30, -40, 0.95);
  jar(-10, 40, 0.9);
  jar(60, 40, 0.8);
  // a tall vase
  P.push(lathe([[0, 0], [14, 1], [24, 20], [22, 50], [12, 74], [9, 90], [14, 104], [0, 104]], 12, "Suzhou_Porcelain", [-70, 50, 6]));
  P.push(lathe([[22.6, 0], [23.6, 10], [22.4, 22], [0, 22]], 12, "Suzhou_Cobalt", [-70, 50, 26]), lathe([[9.6, 0], [11.4, 6], [12.8, 12], [0, 12]], 10, "Suzhou_Cobalt", [-70, 50, 88]));
  // stacked bowls
  for (let i = 0; i < 4; i++) P.push(lathe([[0, 0], [7, 0], [15, 6], [17, 10], [16.4, 10], [0, 2]], 10, i % 2 ? "Suzhou_Porcelain" : "Suzhou_Cobalt", [80, -40, 6 + i * 6]));
  return merge(...P);
}

// A weeping willow for the canal banks: a gnarled trunk forking into arching limbs, long strands
// of narrow leaves hanging from them nearly to the ground, a thin crown on top.
const lin = (r: number, g: number, b: number, k = 1.6) => new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace).multiplyScalar(k);
function willow(): THREE.Object3D {
  const rnd = seeded(51);
  const wood: Geo[] = [limb([[0, 0, 0], [10, 4, 120], [26, 0, 250], [34, -6, 330]], 24, 14, "BarkWarm", { flare: 0.5, roots: 4, gnarl: 0.9, seed: 51 })];
  const strands = new LeafCards(), crown = new LeafCards();
  const lobes: [number, number, number, number, number, number][] = [];
  for (let b = 0; b < 7; b++) {
    const a = (b / 7) * Math.PI * 2 + rnd() * 0.5, L = 200 + rnd() * 80;
    const base: V3 = [34, -6, 310 + rnd() * 40];
    const mid: V3 = [base[0] + Math.cos(a) * L * 0.45, base[1] + Math.sin(a) * L * 0.45, base[2] + 150 + rnd() * 40];
    const end: V3 = [base[0] + Math.cos(a) * L, base[1] + Math.sin(a) * L, base[2] + 130 + rnd() * 50];
    wood.push(limb([base, mid, end], 11, 2.5, "BarkWarm", { seed: 60 + b, gnarl: 0.5 }));
    lobes.push([mid[0], mid[1], mid[2] + 20, 80, 80, 50], [end[0], end[1], end[2], 60, 60, 40]);
    // the strands: curtains of narrow leaves falling from along the limb
    for (let k = 0; k < 12; k++) {
      const t = 0.3 + 0.7 * (k / 11), p = mid.map((v, i) => (t < 0.5 ? lerp(base[i], v, t * 2) : lerp(v, end[i], (t - 0.5) * 2))) as V3;
      const sh = 0.8 + rnd() * 0.3;
      frond(strands, { at: add(p, [(rnd() - 0.5) * 30, (rnd() - 0.5) * 30, 0]), yaw: a + (rnd() - 0.5) * 1.2, lift: -0.9 - rnd() * 0.3, droop: 0.6, len: 190 + rnd() * 170, w: 17, fold: 0.1, segs: 5, base: lin(100 * sh, 142 * sh, 56 * sh), tip: lin(176 * sh, 208 * sh, 100 * sh) });
    }
  }
  wood.push(foliage({ seed: 52, lobes, leaf: 42, look: CANOPY.birch, density: 0.55, hang: 1.2, core: 0.5 }, crown));
  return treeObject(merge(...wood), [strands, "frond"], [crown, "fine"]);
}

// A hexagonal garden pavilion: crimson columns on a granite base, a fretwork frieze under painted
// lintels, benches with lean-out backs on five sides, a stone table, a tall six-sided roof of
// grey tile with sharply upturned corners and a gourd finial. 5.8 m across.
function pavilion(): Geo {
  const P: Geo[] = [];
  const Rc = 220, zp = 50, H = 290, ap = Rc * Math.cos(Math.PI / 6);
  const hex = (r: number, z: number, h: number, mat: string) => rotateZ(cylinderAt({ radius: r, height: h, segments: 6, bottom: [0, 0, z] }, mat), 30);
  P.push(hex(290, 0, zp - 8, GRANITE), hex(296, zp - 8, 8, "Suzhou_GraniteDark"));
  P.push(bb([-290 * Math.cos(Math.PI / 6) - 54, -80, 0], [-290 * Math.cos(Math.PI / 6) + 2, 80, 24], GRANITE, 2));
  for (let j = 0; j < 6; j++) {
    const c = mul(cornerDir(6, j), Rc);
    P.push(cylinderAt({ rBot: 20, rTop: 17, height: 12, segments: 8, bottom: [c[0], c[1], zp] }, GRANITE), cylinderAt({ radius: 12, height: H, segments: 8, bottom: [c[0], c[1], zp] }, RED));
  }
  for (let j = 0; j < 6; j++) {
    const s: Geo[] = [paintedBeam(-ap - 10, -Rc / 2, Rc / 2, zp + H - 30, 30, 20)];
    // the fretwork frieze
    s.push(bb([-ap - 6, -Rc / 2 + 12, zp + H - 58], [-ap - 2, Rc / 2 - 12, zp + H - 54], RED));
    for (const y of spread(-Rc / 2 + 16, Rc / 2 - 16, 9)) s.push(bb([-ap - 6, y - 1.5, zp + H - 58], [-ap - 2, y + 1.5, zp + H - 30], RED));
    for (const sy of [-1, 1]) s.push(beamBetween([-ap - 4, sy * (Rc / 2 - 12), zp + H - 90], [-ap - 4, sy * (Rc / 2 - 50), zp + H - 54], 4, 5, RED));
    if (j !== 0) {
      // a bench with a backrest leaning out
      s.push(bb([-ap + 4, -Rc / 2 + 14, zp + 36], [-ap + 40, Rc / 2 - 14, zp + 44], "WoodShade"), bb([-ap + 8, -Rc / 2 + 14, zp], [-ap + 36, Rc / 2 - 14, zp + 36], WHITE));
      for (const y of spread(-Rc / 2 + 18, Rc / 2 - 18, 9)) s.push(beamBetween([-ap + 4, y, zp + 44], [-ap - 12, y, zp + 88], 3, 3, RED));
      s.push(sweep([[-ap - 12, -Rc / 2 + 16, zp + 88], [-ap - 12, Rc / 2 - 16, zp + 88]], 7, 6, RED));
    }
    P.push(rotateZ(merge(...s), j * 60));
  }
  P.push(hex(Rc + 16, zp + H, 14, "WoodShade"));
  // the stone table and drum stools
  P.push(cylinderAt({ rBot: 22, rTop: 16, height: 64, segments: 8, bottom: [0, 0, zp] }, GRANITE), cylinderAt({ radius: 46, height: 8, segments: 12, bottom: [0, 0, zp + 64] }, GRANITE));
  for (let k = 0; k < 4; k++) P.push(lathe([[0, 0], [14, 0], [17, 20], [14, 40], [0, 40]], 10, GRANITE, [Math.cos(k * 1.57 + 0.8) * 86, Math.sin(k * 1.57 + 0.8) * 86, zp]));
  // the roof and its gourd
  const zr = zp + H + 14, hr = 300;
  P.push(polyRoof({ n: 6, R: Rc + 160, z: zr, h: hr, curve: 1.85, lift: 64, flare: 22, th: 15, horns: 54, nt: 7, ns: 6 }));
  P.push(lathe([[0, 0], [26, 0], [30, 10], [18, 18], [0, 20]], 8, RIDGE, [0, 0, zr + hr - 8]));
  P.push(lathe([[0, 0], [12, 2], [16, 14], [8, 26], [11, 34], [13, 44], [6, 54], [0, 58]], 10, "Suzhou_TileGreen", [0, 0, zr + hr + 10]));
  return merge(...P);
}

// A Taihu rock: pale limestone worn into a tall, holed, twisting stack on a few flat stones.
function taihuRock(): Geo {
  const M = "Suzhou_Taihu";
  const P: Geo[] = [
    translate(rock([110, 90, 30], 0.4, 21, "Suzhou_GraniteDark", true), [0, 0, -4]),
    translate(rock([86, 66, 120], 0.6, 22, M), [0, 0, 6]),
    translate(rock([70, 56, 110], 0.7, 23, M), [14, 8, 96]),
    translate(rock([60, 48, 82], 0.7, 24, M), [-6, -6, 180]),
    translate(rock([46, 40, 54], 0.6, 25, M), [12, 2, 240]),
  ];
  for (const [x, y, z, r] of [[-34, 6, 60, 13], [-30, -10, 140, 11], [-20, 4, 214, 9], [10, -30, 110, 10], [14, 30, 70, 12], [-8, 22, 196, 8], [30, -10, 250, 7]] as const)
    P.push(ellipsoid([r * 0.6, r, r * 1.3], [x, y, z], "Suzhou_Hole", 8));
  return merge(...P);
}

// A guardian lion of granite on its plinth, seated, facing -X, a ball under its right paw.
function stoneLion(): Geo {
  const M = GRANITE, z0 = 66;
  const P: Geo[] = [
    boxAt([84, 64, 52], [0, 0, 0], "Suzhou_GraniteDark", 3),
    boxAt([92, 72, 14], [0, 0, 52], M, 2),
    bb([-43, -24, 12], [-42, 24, 42], "Suzhou_Granite"),
    ellipsoid([32, 25, 28], [14, 0, z0 + 28], M),
    ellipsoid([22, 23, 34], [-8, 0, z0 + 48], M),
    sphereCenter(21, [-14, 0, z0 + 92], M, 10),
    boxAt([18, 24, 16], [-34, 0, z0 + 76], M, 5),
    sphereCenter(5, [-41, 0, z0 + 86], "Suzhou_GraniteDark", 6),
    ellipsoid([10, 18, 4], [-38, 0, z0 + 76], "Suzhou_GraniteDark", 8),
  ];
  for (const s of [-1, 1]) {
    P.push(boxAt([13, 11, 54], [-24, s * 12, z0], M, 3), ellipsoid([11, 8, 6], [-32, s * 12, z0 + 4], M, 8));
    P.push(ellipsoid([14, 9, 22], [18, s * 20, z0 + 18], M, 8));
    P.push(sphereCenter(4, [-30, s * 9, z0 + 98], "Suzhou_Ink", 6), ellipsoid([5, 6, 8], [-10, s * 18, z0 + 112], M, 6));
  }
  // the mane: curls round the head
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    P.push(sphereCenter(8, [-4 + Math.cos(a) * 6, Math.sin(a) * 19, z0 + 92 + Math.cos(a) * 18], M, 6));
  }
  P.push(sphereCenter(12, [-36, 22, z0 + 12], M, 8), translate(torus(12, 1.6, 10, 4, "Suzhou_GraniteDark"), [-36, 22, z0 + 12]));
  P.push(limb([[40, 0, z0 + 20], [52, 0, z0 + 40], [46, 0, z0 + 60]], 7, 4, M, { seg: 6 }));
  return merge(...P);
}

// A lotus pond, about 8 x 6 m: still water ringed with Taihu rocks and flat stones, lotus leaves
// on the water and some raised on their stalks, pink flowers.
function lotusPond(): Geo {
  const P: Geo[] = [];
  const rnd = seeded(37);
  const rx = 380, ry = 270;
  const edge = (a: number) => 1 + 0.08 * Math.sin(3 * a + 1) + 0.05 * Math.sin(5 * a);
  const ring = Array.from({ length: 32 }, (_, k): V3 => { const a = (k / 32) * Math.PI * 2; return [rx * edge(a) * Math.cos(a), ry * edge(a) * Math.sin(a), 4]; });
  P.push(fan([0, 0, 4], ring, "Suzhou_Pond", UP, (p) => [p[0] / 100, p[1] / 100], true));
  P.push(fan([0, 0, 1], ring.map((p): V3 => [p[0] * 1.02, p[1] * 1.02, 1]), "Suzhou_PondBed", UP, (p) => [p[0] / 100, p[1] / 100], true));
  for (let k = 0; k < 26; k++) {
    const a = (k / 26) * Math.PI * 2, e = edge(a) * 1.03, s = 34 + rnd() * 34;
    const big = k % 5 === 0;
    P.push(translate(rock(big ? [s * 1.3, s, s * 1.6] : [s, s * 0.8, s * 0.45], big ? 0.6 : 0.4, 70 + k, big ? "Suzhou_Taihu" : rnd() < 0.5 ? GRANITE : "MossStone", !big), [rx * e * Math.cos(a), ry * e * Math.sin(a), -4]));
  }
  for (let k = 0; k < 20; k++) {
    const a = rnd() * Math.PI * 2, d = 0.15 + rnd() * 0.7, r = 22 + rnd() * 18;
    const x = rx * d * Math.cos(a), y = ry * d * Math.sin(a);
    if (k % 4 === 0) {
      P.push(cylinderBetween([x, y, 4], [x + 4, y, 40 + rnd() * 30], 1.4, 4, "Suzhou_LotusLeaf"));
      P.push(translate(rotateY(cylinderAt({ rBot: r, rTop: r * 0.9, height: 3, segments: 10, bottom: [0, 0, 0] }, "Suzhou_LotusLeaf"), 18), [x + 4, y, 44 + rnd() * 30]));
    } else P.push(cylinderAt({ radius: r, height: 2, segments: 10, bottom: [x, y, 5] }, "Suzhou_LotusLeaf"));
  }
  for (let k = 0; k < 6; k++) {
    const a = k * 1.1 + 0.4, d = 0.3 + (k % 3) * 0.2, x = rx * d * Math.cos(a), y = ry * d * Math.sin(a), z = 34 + (k % 3) * 12;
    P.push(cylinderBetween([x, y, 4], [x, y, z], 1.2, 4, "Suzhou_LotusLeaf"));
    P.push(lathe([[0, 0], [6, 2], [12, 10], [10, 16], [0, 8]], 8, "Suzhou_LotusPink", [x, y, z]), sphereCenter(4, [x, y, z + 8], "FabricGold", 6));
  }
  return merge(...P);
}

// A bronze incense burner for a temple court: a three-legged cauldron with ring handles on a
// granite base, a little roofed lid, sticks of incense glowing at their tips.
function incenseBurner(): Geo {
  const P: Geo[] = [boxAt([110, 110, 30], [0, 0, 0], GRANITE, 3), boxAt([96, 96, 10], [0, 0, 30], "Suzhou_GraniteDark", 2)];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    P.push(cylinderBetween([Math.cos(a) * 30, Math.sin(a) * 30, 40], [Math.cos(a) * 36, Math.sin(a) * 36, 72], 6, 6, "Bronze"));
  }
  P.push(lathe([[0, 0], [30, 2], [46, 20], [48, 44], [42, 54], [46, 58], [0, 58]], 12, "Bronze", [0, 0, 68]));
  for (const s of [-1, 1]) P.push(translate(rotateX(torus(14, 3, 10, 4, "Bronze"), 90), [0, s * 48, 130]));
  P.push(rotateZ(cylinderAt({ rBot: 40, rTop: 6, height: 40, segments: 6, bottom: [0, 0, 132] }, "Bronze"), 30), sphereCenter(8, [0, 0, 178], "GoldTrim", 8));
  for (let k = 0; k < 5; k++) {
    const x = -24 + k * 12, y = (k % 2) * 8 - 4;
    P.push(cylinderBetween([x, y, 120], [x, y, 160 + (k % 3) * 6], 0.9, 4, "FabricRed"), sphereCenter(1.6, [x, y, 161 + (k % 3) * 6], "FireGlow", 4));
  }
  return merge(...P);
}

// A smith's forge under a lean-to of grey tiles: a brick hearth with glowing coals and a hood, the
// bellows, an anvil on its stump, a quench tub and a rack of blades. 3.2 m along Y, 2.4 m deep.
function forge(): Geo {
  const P: Geo[] = [bb([-120, -160, 0], [120, 160, 6], "Suzhou_GraniteDark")];
  // the hearth and its hood
  P.push(bb([30, -150, 6], [116, -10, 92], "Suzhou_Brick"), bb([26, -154, 92], [120, -6, 100], "Suzhou_GraniteDark"));
  P.push(bb([40, -136, 100], [104, -24, 110], "FireGlow"), sphereCenter(14, [70, -100, 108], "FireGlow", 6), sphereCenter(11, [80, -60, 106], "FireGlow", 6));
  P.push(bb([44, -146, 160], [116, -14, 230], "Suzhou_Brick"), bb([70, -110, 230], [104, -50, 330], "Suzhou_BrickDark"));
  for (const y of [-146, -20]) P.push(bb([44, y - 6, 100], [52, y, 160], "IronDark"));
  // the bellows: a long box with a handle
  P.push(bb([40, 0, 6], [116, 40, 70], "WoodDark", 2), cylinderBetween([28, 20, 60], [40, 20, 60], 3, 6, "WoodPale"), bb([24, 10, 54], [28, 30, 66], "WoodPale"));
  // the anvil on its stump, hammer and tongs
  P.push(cylinderAt({ radius: 26, height: 50, segments: 10, bottom: [-40, -40, 6] }, "BarkWarm"));
  P.push(boxAt([28, 50, 12], [-40, -40, 56], "IronDark", 2), boxAt([18, 26, 14], [-40, -40, 68], "IronDark", 2), boxAt([30, 66, 10], [-40, -40, 82], "IronDark", 2));
  P.push(cylinderAt({ rBot: 7, rTop: 1, height: 16, segments: 6, bottom: [0, 0, 0] }, "IronDark").map((p) => ({ geo: p.geo.clone().rotateX(Math.PI / 2).translate(-40, -73, 87), mat: p.mat })));
  P.push(cylinderBetween([-30, -20, 93], [-30, 14, 93], 2, 5, "WoodPale"), boxAt([10, 16, 9], [-30, -24, 89], "IronDark"));
  // the quench tub
  P.push(cylinderAt({ rBot: 26, rTop: 30, height: 50, segments: 12, bottom: [-50, 90, 6] }, "WoodWarm"), cylinderAt({ radius: 27, height: 2, segments: 12, bottom: [-50, 90, 50] }, "WaterDark"));
  for (const z of [16, 42]) P.push(translate(torus(29, 1.6, 12, 4, "IronDark"), [-50, 90, z]));
  // a rack of blades
  P.push(bb([90, 60, 6], [100, 150, 150], "WoodDark"), bb([80, 60, 120], [100, 150, 128], "WoodDark"));
  for (let k = 0; k < 5; k++) P.push(beamBetween([60, 68 + k * 18, 10], [86, 68 + k * 18, 150], 4, 1.5, k % 2 ? "IronLight" : "IronDark"));
  // the lean-to roof on four posts
  for (const [x, y] of [[-110, -150], [-110, 150], [110, -150], [110, 150]] as const) P.push(boxAt([12, 12, x < 0 ? 236 : 286], [x, y, 6], "WoodShade", 1));
  P.push(slab([-140, -180, 240], [-140, 180, 240], [130, 180, 294], [130, -180, 294], 8));
  return merge(...P);
}

// Granite paving, a 4 m square of slabs (5 cm, to lay over the ground).
function paving(): Geo {
  const P: Geo[] = [];
  const rnd = seeded(5);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const m = rnd() < 0.25 ? "Suzhou_GraniteDark" : GRANITE;
    P.push(boxAt([98, 98, 5], [-150 + i * 100, -150 + j * 100, 0], m, 1.5));
  }
  return merge(...P);
}

// ---- the kit ----
function sample(put: Put): void {
  // the harbour along the -Y edge: the quay, a pier, a junk and sampans
  for (let x = -2000; x <= 2000; x += 400) put("quay", [x, -2178, 0], 90);
  for (const y of [-2400, -2800, -3200]) put("pier", [-500, y, -14], 0);
  put("junk", [900, -3050, -72], 90);
  put("sampan", [-1000, -2700, -40], 95);
  put("sampan", [-60, -2950, -40], 80);
  put("lantern_post", [-700, -2100, 0], 90);
  put("lantern_post", [-300, -2100, 0], 90);
  put("tea_chests", [400, -1900, 0], 0);
  put("porcelain_jars", [900, -1950, 0], 10);
  put("market_stall", [-200, -1700, 0], 90);
  // the pagoda lighthouse on the shore
  put("pagoda", [-1550, -1450, 0], 0);
  // the landing, the pailou over the main street
  for (let x = -1000; x <= 600; x += 400) for (let y = -1950; y <= -1150; y += 400) put("paving", [x, y, 0]);
  for (let y = -750; y <= 650; y += 400) put("paving", [-200, y, 0]), put("paving", [200, y, 0]);
  put("pailou", [0, -950, 0], 90);
  // the main street: shophouses and townhouses on both sides, lanterns across it
  put("shophouse", [-860, -350, 0], 180);
  put("townhouse", [-810, 470, 0], 180);
  put("shophouse", [860, -350, 0], 0);
  put("tea_house", [930, 560, 0], 0);
  for (const y of [-500, 100]) put("lantern_string", [0, y, 0], 90, 0.88);
  for (const y of [-650, 250]) put("lantern_post", [-420, y, 0], 180), put("lantern_post", [420, y, 0], 0);
  // the canal across the street and its hump bridge (water laid over the ground here)
  const water = new THREE.Mesh(new THREE.PlaneGeometry(4000, 700).rotateX(-Math.PI / 2), material("Suzhou_Pond"));
  put(water, [-200, 1500, 2], 0);
  for (let x = -2000; x <= 1600; x += 400) {
    if (Math.abs(x) > 250) put("canal_wall", [x, 1134, 0], -90), put("canal_wall", [x, 1866, 0], 90);
  }
  put("hump_bridge", [0, 1500, 0], 90);
  put("willow", [-1500, 1000, 0], 40);
  put("willow", [700, 2000, 0], 200);
  put("sampan", [-1100, 1500, -20], 0, 0.9);
  // the garden behind the houses: a wall with a moon gate, the pavilion, a rock and a pond
  for (const y of [-650, -250, 950]) put("courtyard_wall", [-1300, y, 0], 0);
  put("moon_gate", [-1300, 350, 0], 0);
  put("pavilion", [-1850, 450, 0], 0);
  put("taihu_rock", [-1700, -350, 0], 20);
  put("lotus_pond", [-1800, -620, 0], 90, 0.6);
  for (const y of [-260, 260]) put("stone_lion", [-1180, 350 + y * 0.6, 0], 0);
  // the city gate and wall at the back (+X), a corner tower
  put("city_gate", [1700, 1500, 0], 180);
  put("city_wall", [1700, 2350, 0], 180);
  put("wall_tower", [1950, -400, 0], 0);
  put("city_wall", [1700, 250, 0], 180, 1);
  // trees
  for (const [x, y] of [[-2050, 1900], [1300, -900], [-1000, -900]] as const) put("flora:Pine", [x, y, 0], x, 0.9);
  put("flora:Bamboo", [-2050, -100, 0], 0);
  put("flora:Bamboo", [-1450, 900, 0], 0);
}

export const KIT: Kit = {
  id: "suzhou",
  name: "ซูโจว",
  region: "เมืองท่าตะวันตกสุดของทวีป",
  desc: "เมืองท่าแบบจีน: หลังคาโค้งปลายงอน เสาแดง กำแพงขาวหลังคาดำ ประตูพระจันทร์ เจดีย์ประภาคาร ซุ้มประตูไผ่ไหล สะพานโค้ง คลอง โคมแดง เรือสำเภา",
  ground: "grass",
  sea: true,
  items: [
    { id: "pagoda", name: "เจดีย์แปดเหลี่ยม (ประภาคาร)", make: pagoda, tags: ["landmark", "building", "tower", "light"] },
    { id: "great_hall", name: "ท้องพระโรงจวนเจ้าเมือง", make: greatHall, tags: ["landmark", "building"] },
    { id: "pailou", name: "ซุ้มประตูไผ่ไหล", make: pailou, tags: ["landmark", "gate"] },
    { id: "city_gate", name: "ประตูเมืองหอสองชั้น", make: cityGate, tags: ["gate", "landmark", "defence"] },
    { id: "city_wall", name: "กำแพงเมืองอิฐ (8 ม.)", make: cityWall, tags: ["wall", "defence"] },
    { id: "wall_tower", name: "ป้อมมุมกำแพง", make: wallTower, tags: ["tower", "defence"] },
    { id: "townhouse", name: "บ้านกำแพงขาวหน้าจั่วหัวม้า", make: townhouse, tags: ["building"] },
    { id: "shophouse", name: "ห้องแถวร้านค้า", make: shophouse, tags: ["building", "market"] },
    { id: "tea_house", name: "โรงน้ำชาสองชั้น", make: teaHouse, tags: ["building", "market"] },
    { id: "gate_hall", name: "ซุ้มประตูจวน", make: gateHall, tags: ["gate", "building"] },
    { id: "courtyard_wall", name: "กำแพงขาวหลังคากระเบื้อง (4 ม.)", make: courtyardWall, tags: ["wall"] },
    { id: "moon_gate", name: "ประตูพระจันทร์", make: moonGate, tags: ["gate", "wall", "decor"] },
    { id: "hump_bridge", name: "สะพานหินโค้ง", make: humpBridge, tags: ["bridge", "landmark"] },
    { id: "canal_wall", name: "เขื่อนหินริมคลอง (4 ม.)", make: canalWall, tags: ["ground", "dock"] },
    { id: "quay", name: "ท่าหินริมทะเล (4 ม.)", make: quay, tags: ["dock", "ground"] },
    { id: "pier", name: "สะพานท่าเรือไม้ (4 ม.)", make: pier, tags: ["dock"] },
    { id: "junk", name: "เรือสำเภาใบลายไม้ไผ่", make: junk, tags: ["boat"] },
    { id: "sampan", name: "เรือประทุนดำ", make: sampan, tags: ["boat"] },
    { id: "shore_rocks", name: "โขดหินริมฝั่ง (4 ม.)", make: shoreRocks, tags: ["ground", "shore"] },
    { id: "lantern_string", name: "ราวโคมแดงข้ามถนน (12 ม.)", make: lanternString, tags: ["light", "decor"] },
    { id: "lantern_post", name: "เสาโคมแดง", make: lanternPost, tags: ["light"] },
    { id: "market_stall", name: "แผงขายผ้าไหมและเครื่องเคลือบ", make: marketStall, tags: ["market"] },
    { id: "tea_chests", name: "กองหีบใบชา", make: teaChests, tags: ["market", "decor"] },
    { id: "porcelain_jars", name: "โถเครื่องเคลือบลายคราม", make: porcelainJars, tags: ["market", "decor"] },
    { id: "willow", name: "ต้นหลิว", make: willow, tags: ["plant"] },
    { id: "pavilion", name: "ศาลาหกเหลี่ยม", make: pavilion, tags: ["building", "decor"] },
    { id: "taihu_rock", name: "หินไท่หู", make: taihuRock, tags: ["decor"] },
    { id: "stone_lion", name: "สิงโตหิน", make: stoneLion, tags: ["decor"] },
    { id: "lotus_pond", name: "สระบัว", make: lotusPond, tags: ["decor"] },
    { id: "incense_burner", name: "กระถางธูปสำริด", make: incenseBurner, tags: ["decor", "magic"] },
    { id: "forge", name: "เตาตีเหล็ก", make: forge, tags: ["market", "decor"] },
    { id: "paving", name: "ลานหินแกรนิต (4 ม.)", make: paving, tags: ["ground"] },
  ],
  sample,
};

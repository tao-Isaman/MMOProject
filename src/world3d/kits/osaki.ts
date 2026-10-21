// โอซากิ (Osaki): a remote island town far to the east, reached only by boat. Japanese-style
// (Amatsu-like): grey kawara roofs with curved slopes and upturned corners, vermilion and black
// lacquered timber, shoji paper walls, white plaster on stone bases, bamboo, stone lanterns,
// cherry trees, a five-storey pagoda and a harbour where everyone arrives.
//
// All centimetres, Z up; every item stands on z = 0, centred on its footprint, front facing -X.

import * as THREE from "three";
import { merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween, cylinderBetween, cylinderAt, sphereCenter, torus, rock } from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import type { Kit, Put } from "./types";

// ---- the town's own colours ----
defineMaterial("Osaki_Shikkui", { map: "plaster", tint: "#f4f1e8", bump: 0.6 }); // white lime plaster
defineMaterial("Osaki_Ridge", { map: "plaster", tint: "#6d7584", rough: 0.6, bump: 0.8 }); // ridge tiles
defineMaterial("Osaki_TileEnd", { map: "tiles", tint: "#8d95a3", bump: 1.5 }); // round eave-tile ends
defineMaterial("Osaki_Slate", { map: "plaster", tint: "#3c4047", rough: 0.6 }); // namako wall tiles
defineMaterial("Osaki_Ochre", { map: "plaster", tint: "#e3b04b", rough: 0.6 }); // painted beam ends
defineMaterial("Osaki_Gravel", { map: "ribs", tint: "#e9e4d6", rough: 1 }); // raked gravel
defineMaterial("Osaki_GravelPlain", { map: "plaster", tint: "#e2dccb", rough: 1, bump: 1.2 });
defineMaterial("Osaki_Moss", { map: "felt", tint: "#5d8a3a", rough: 1 });
defineMaterial("Osaki_Pond", { tint: "#3b7f8c", rough: 0.08, opacity: 0.8 });
defineMaterial("Osaki_PondBed", { map: "stone", tint: "#2c4a4c", rough: 0.9 });
defineMaterial("Osaki_KoiOrange", { tint: "#f26a22", rough: 0.35 });
defineMaterial("Osaki_KoiWhite", { tint: "#f8f4ec", rough: 0.35 });
defineMaterial("Osaki_LanternRed", { map: "fabric", tint: "#e0503a", rough: 0.8, glow: "#ff4a26", glowI: 0.85 });
defineMaterial("Osaki_LanternWhite", { map: "fabric", tint: "#fff3dc", rough: 0.8, glow: "#ffcf80", glowI: 0.9 });
defineMaterial("Osaki_Lotus", { map: "fabric", tint: "#f4a9c4", rough: 0.8 });
defineMaterial("Osaki_Tatami", { map: "fabric", tint: "#cdc48c", rough: 0.95 });
defineMaterial("Osaki_Straw", { map: "thatch", tint: "#d9c690", bump: 1.5 });
defineMaterial("Osaki_ThatchDark", { map: "thatch", tint: "#8f7444", bump: 2 });
defineMaterial("Osaki_Thatch", { map: "thatch", tint: "#bf9f5f", bump: 3 });
defineMaterial("Osaki_DockLight", { map: "wood", tint: "#a59c8c", bump: 1.2 });
defineMaterial("Osaki_StoneWarm", { map: "stone", tint: "#cfc6b4", bump: 2 });
defineMaterial("Osaki_Kuro", { map: "plaster", tint: "#3b3d43", rough: 0.55, bump: 0.6 }); // black kura plaster
defineMaterial("Osaki_Sail", { map: "fabric", tint: "#f3eee0", rough: 0.95 });
defineMaterial("Osaki_Sand", { map: "plaster", tint: "#e9dab4", rough: 1, bump: 1.2 }); // beach sand
defineMaterial("Osaki_SandWet", { map: "plaster", tint: "#b9a98a", rough: 0.5, bump: 0.8 });
defineMaterial("Osaki_Earth", { map: "plaster", tint: "#8b7656", rough: 1, bump: 1.6 }); // paddy bunds
defineMaterial("Osaki_Paddy", { tint: "#7f9c8a", rough: 0.08, opacity: 0.85 }); // flooded field
defineMaterial("Osaki_Rice", { map: "felt", tint: "#86b24a", rough: 0.9 });

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
// a thin disc facing along X or Y (crests, round windows)
function disc(r: number, c: V3, mat: string, axis: "x" | "y", thick = 1.6, segs = 16): Geo {
  const d = cylinderAt({ radius: r, height: thick, segments: segs, bottom: [0, 0, -thick / 2] }, mat);
  return translate(axis === "x" ? rotateY(d, 90) : rotateX(d, 90), c);
}

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

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

// A rectangular section (w across, h up) swept along a path: curved beams, rails, lintels.
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
function lathe(prof: [number, number][], segs: number, mat: string, at: V3 = [0, 0, 0], phase = 0): Geo {
  const geo = new THREE.LatheGeometry(prof.map(([r, z]) => new THREE.Vector2(r, z)), segs, phase);
  geo.rotateX(Math.PI / 2);
  const rmax = Math.max(...prof.map((p) => p[0]));
  let plen = 0;
  for (let i = 1; i < prof.length; i++) plen += Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]);
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * Math.PI * 2 * rmax) / 100, (uv.getY(i) * plen) / 100);
  geo.translate(...at);
  return [{ geo, mat }];
}

const ellipsoid = (r: V3, c: V3, mat: string, segs = 10): Geo => scale(sphereCenter(1, [0, 0, 0], mat, segs), r).map((p) => ({ geo: p.geo.translate(...c), mat: p.mat }));

// A flat tiled slab: e0-e1 along the eave, r0-r1 the high edge (top surface), `th` thick. The
// tile channels run down the slope.
function slab(e0: V3, e1: V3, r1: V3, r0: V3, th: number, mat: string, under = "WoodDark", edge = "WoodDark"): Geo {
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

// ---- the Japanese roof ----
// Curved slopes (flat at the eaves, steep at the ridge), corners that sweep up and out. Ridge
// along X. kind: "hip" (yosemune, or a pyramid with ridge 0), "irimoya" (hip below, a gable on
// top) or "gable" (kirizuma). hx, hy: the eave's half extent; z: eave height; h: rise.
interface RoofSpec {
  hx: number;
  hy: number;
  z: number;
  h: number;
  kind: "hip" | "irimoya" | "gable";
  ridge?: number; // hip: half ridge length (default hx - hy)
  gableAt?: number; // irimoya: share of the slope where the gable starts
  curve?: number; // profile exponent: 1 straight, higher = flatter eaves and steeper top
  lift?: number; // corner upturn
  flare?: number; // corners pushed outward
  reach?: number; // how far along the eave the upturn spreads
  th?: number; // thickness
  mat?: string;
  under?: string;
  edge?: string;
  tileEnd?: string; // the upper half of the eave edge
  uvScale?: [number, number]; // texture scale on the top surface (along the eave, down the slope)
  ridgeMat?: string;
  gableMat?: string;
  hafu?: string; // bargeboards
  gableInset?: number; // tympanum set back from the roof's end
  gableBase?: number; // tympanum bottom height
  gableHalf?: number; // tympanum half width limit
  ends?: boolean; // gable ends (verge, bargeboards, tympanum); false for tiling wall caps
  cap?: boolean; // ridge cap
  oni?: string | false; // ridge-end ornaments
  nt?: number;
  ns?: number;
}

function roof(r: RoofSpec): Geo {
  const mat = r.mat ?? "RoofKawara", under = r.under ?? "WoodDark", edgeM = r.edge ?? "WoodDark";
  const ridgeM = r.ridgeMat ?? "Osaki_Ridge", hafuM = r.hafu ?? "WoodDark";
  const th = r.th ?? 18, curve = r.curve ?? 1.6, lift = r.lift ?? 0, flare = r.flare ?? 0;
  const reach = r.reach ?? Math.min(r.hx, r.hy) * 0.9;
  const nt = r.nt ?? 8, ns = r.ns ?? 12, kind = r.kind;
  const tb = kind === "irimoya" ? r.gableAt ?? 0.5 : kind === "hip" ? 1 : 0;
  const rid = kind === "hip" ? Math.max(0, r.ridge ?? r.hx - r.hy) : kind === "irimoya" ? r.hx - r.hy * tb : r.hx;
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
  if (kind === "irimoya") {
    const n1 = Math.max(2, Math.round(nt * tb)), n2 = Math.max(2, nt - n1);
    for (let k = 0; k <= n1; k++) ts.push(tb * Math.pow(k / n1, 1.2));
    for (let k = 1; k <= n2; k++) ts.push(tb + ((1 - tb) * k) / n2);
  } else for (let k = 0; k <= nt; k++) ts.push(Math.pow(k / nt, 1.2));
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
    const [us, vs] = r.uvScale ?? [0.75, 1];
    const uvTop = top.map((row, i) => row.map((p, j): [number, number] => [along(p) * us, (vl[i][j] / 100) * vs]));
    out.push(surface(top, uvTop, mat, UP));
    const bot = top.map((row) => row.map((p) => add(p, down)));
    const uvBot = top.map((row, i) => row.map((p, j): [number, number] => [vl[i][j] / 100, along(p)]));
    out.push(surface(bot, uvBot, under, [0, 0, -1]));
    // the eave's edge
    const midE = top[0].map((p) => add(p, mul(down, 0.45)));
    out.push(surface([top[0], midE], [top[0].map((p): [number, number] => [along(p), 0]), top[0].map((p): [number, number] => [along(p), (th * 0.45) / 100])], r.tileEnd ?? "Osaki_TileEnd", outward[side]));
    out.push(surface([midE, bot[0]], [top[0].map((p): [number, number] => [along(p), 0]), top[0].map((p): [number, number] => [along(p), (th * 0.55) / 100])], edgeM, outward[side]));
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
  // gable ends: tympanum, bargeboards, verge ridges
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
      out.push(fan([xg, 0, zb], ring, r.gableMat ?? "Osaki_Shikkui", [sx, 0, 0], (p) => [p[1] / 100, p[2] / 100]));
      // bargeboard over the verge, from one eave end over the ridge to the other
      const vpath = [...fine.map((t) => P(0, t, sx)), ...fine.slice(0, -1).reverse().map((t) => P(1, t, sx))].map((p): V3 => [p[0] + sx * 5, p[1], p[2] - th / 2 + 2]);
      out.push(sweep(vpath, 10, th + 14, hafuM));
      // the verge ridges (tiles running down along each gable edge)
      for (const side of [0, 1]) {
        const k = 1 - 16 / Math.max(rid, 40);
        out.push(sweep(fine.map((t) => add(P(side, t, sx * k), [0, 0, 7])), 16, 12, ridgeM));
      }
      // irimoya: the little ridge where the hip skirt meets the gable
      if (kind === "irimoya") {
        const z0 = zt(tb);
        out.push(boxAt([24, 2 * ay(tb) + 10, th + 12], [sx * rid, 0, z0 - th], ridgeM, 2));
        out.push(boxAt([10, 2 * ay(tb) + 10, 4], [sx * rid, 0, z0 + 12], "Osaki_Shikkui"));
      }
    }
  }
  // hip ridges at the corners
  if (kind !== "gable") {
    const T = ts.filter((t) => t <= tb + 1e-9);
    for (const side of [0, 1]) for (const s of [-1, 1]) out.push(sweep(T.map((t) => add(P(side, t, s), [0, 0, 7])), 17, 14, ridgeM));
  }
  // the ridge
  const rl = kind === "gable" ? r.hx : rid;
  if (r.cap !== false && rl > 5) {
    const tiled = r.ends === false, ext = tiled ? 0 : 10, inset = tiled ? 0 : 1;
    out.push(boxAt([2 * rl + ext * 2, 30, 40], [0, 0, zTop - 30], ridgeM, tiled ? 0 : 3));
    out.push(boxAt([2 * rl + ext * 2 - 4 * inset, 33, 5], [0, 0, zTop + 6], "Osaki_Shikkui"));
    out.push(boxAt([2 * rl + ext * 2 - 8 * inset, 26, 12], [0, 0, zTop + 11], ridgeM, tiled ? 0 : 2));
    out.push(cylinderBetween([-rl - ext + 4 * inset, 0, zTop + 25], [rl + ext - 4 * inset, 0, zTop + 25], 10, 8, ridgeM));
    if (r.oni !== false && r.ends !== false) {
      for (const sx of [-1, 1]) {
        out.push(boxAt([16, 44, 52], [sx * (rl + ext), 0, zTop - 18], r.oni ?? ridgeM, 3));
        out.push(rotateY(boxAt([14, 44, 20], [sx * (rl + ext + 6), 0, zTop + 28], r.oni ?? ridgeM, 3), sx * 25, [sx * (rl + ext), 0, zTop + 30]));
      }
    }
  }
  return merge(...out);
}

// ---- shared bits ----
// Bracket sets (tokyo) at a wall top: block, arm, block, longer arm, block, and an eave purlin.
function bracketSide(half: number, wall: number, z: number, out: number, at: number[], arm: string, block: string): Geo {
  const parts: Geo[] = [];
  for (const a of at) {
    parts.push(
      boxAt([24, 24, 16], [-wall - 4, a, z], block),
      boxAt([out * 0.6, 14, 15], [-wall - out * 0.3, a, z + 16], arm),
      boxAt([20, 20, 13], [-wall - out * 0.55, a, z + 31], block),
      boxAt([out * 1.05, 14, 15], [-wall - out * 0.5, a, z + 44], arm),
      boxAt([20, 20, 13], [-wall - out, a, z + 59], block),
      boxAt([4, 15, 15], [-wall - out * 1.06, a, z + 44], "Osaki_Ochre"),
    );
  }
  parts.push(boxAt([16, 2 * half + 2 * out, 16], [-wall - out, 0, z + 72], arm));
  return merge(...parts);
}
function brackets(cx: number, cy: number, z: number, out: number, nx: number, ny: number, arm: string, block: string): Geo {
  const along = (h: number, n: number) => Array.from({ length: n }, (_, i) => -h + (2 * h * i) / (n - 1));
  const sideX = bracketSide(cy, cx, z, out, along(cy, nx), arm, block);
  const sideY = bracketSide(cx, cy, z, out, along(cx, ny), arm, block);
  return merge(sideX, rotateZ(sideX, 180), rotateZ(sideY, 90), rotateZ(sideY, -90));
}

// A railing round a rectangle: posts and two rails; `gap` leaves an opening mid -X side.
function railing(hx: number, hy: number, z: number, h: number, mat: string, step = 110, gap = 0): Geo {
  const parts: Geo[] = [];
  const sideRail = (x0: number, y0: number, x1: number, y1: number) => {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / step));
    for (let i = 0; i <= n; i++) parts.push(boxAt([9, 9, h], [lerp(x0, x1, i / n), lerp(y0, y1, i / n), z], mat));
    for (const zz of [h - 6, h * 0.45]) parts.push(boxBounds([Math.min(x0, x1) - 4, Math.min(y0, y1) - 4, z + zz], [Math.max(x0, x1) + 4, Math.max(y0, y1) + 4, z + zz + (zz > h * 0.5 ? 8 : 6)], mat));
  };
  sideRail(hx, -hy, hx, hy);
  sideRail(-hx, -hy, hx, -hy);
  sideRail(-hx, hy, hx, hy);
  if (gap > 0) {
    sideRail(-hx, -hy, -hx, -gap / 2);
    sideRail(-hx, gap / 2, -hx, hy);
  } else sideRail(-hx, -hy, -hx, hy);
  return merge(...parts);
}

// A paper lantern (chochin) hanging from z = top, `r` round.
function chochin(r: number, top: V3, mat = "Osaki_LanternRed"): Geo {
  const hgt = r * 2.7, c: V3 = [top[0], top[1], top[2] - 8 - hgt / 2];
  return merge(
    cylinderBetween(top, [top[0], top[1], top[2] - 8], 1.2, 4, "LacquerBlack"),
    ellipsoid([r, r, hgt / 2], c, mat, 12),
    cylinderAt({ radius: r * 0.62, height: 7, segments: 10, bottom: [c[0], c[1], c[2] + hgt / 2 - 5] }, "LacquerBlack"),
    cylinderAt({ radius: r * 0.62, height: 7, segments: 10, bottom: [c[0], c[1], c[2] - hgt / 2 - 2] }, "LacquerBlack"),
    translate(torus(r + 0.6, 1.1, 14, 3, "LacquerBlack"), c),
  );
}

// ---- items ----

// Torii: the vermilion gate (myojin style), spanning Y.
function torii(): Geo {
  const R = "LacquerRed", B = "LacquerBlack";
  const py = 235, H = 470;
  const parts: Geo[] = [];
  for (const sy of [-1, 1]) {
    const y = sy * py;
    parts.push(boxAt([90, 90, 16], [0, y, 0], "StoneGrey", 4));
    parts.push(cylinderAt({ rBot: 36, rTop: 30, height: 16, segments: 14, bottom: [0, y, 16] }, "StoneGrey"));
    parts.push(cylinderAt({ radius: 29, height: 70, segments: 14, bottom: [0, y, 30] }, B));
    parts.push(cylinderAt({ rBot: 25, rTop: 21, height: H - 30, segments: 14, bottom: [0, y, 30] }, R));
    parts.push(cylinderAt({ radius: 24, height: 14, segments: 14, bottom: [0, y, H - 16] }, B));
    // wedges where the nuki passes
    parts.push(boxAt([14, 10, 24], [-22, y + sy * 30, H - 128], B));
  }
  // nuki: the tie beam through both pillars
  parts.push(boxAt([28, 2 * py + 170, 30], [0, 0, H - 132], R, 2));
  // shimaki and kasagi: curved up toward their ends
  const curveY = (half: number, z: number, rise: number, k = 15): V3[] => Array.from({ length: k }, (_, i) => {
    const y = -half + (2 * half * i) / (k - 1);
    return [0, y, z + rise * Math.pow(Math.abs(y) / half, 2.4)];
  });
  parts.push(sweep(curveY(py + 120, H + 15, 14), 40, 30, R));
  parts.push(sweep(curveY(py + 170, H + 44, 30), 52, 24, B));
  // gakuzuka and the plaque
  parts.push(boxAt([24, 30, 100], [0, 0, H - 102], R));
  parts.push(boxAt([10, 62, 86], [-18, 0, H - 98], B, 2));
  parts.push(boxAt([4, 52, 74], [-24, 0, H - 92], "GoldTrim"));
  parts.push(boxAt([4, 44, 66], [-25, 0, H - 88], B));
  for (const [z, w] of [[H - 40, 22], [H - 58, 30], [H - 74, 18]] as const) parts.push(boxAt([3, w, 7], [-27, 0, z], "GoldTrim"));
  return merge(...parts);
}

// Kasuga stone lantern (toro), ~2.2 m.
function stoneLantern(): Geo {
  const S = "StoneGrey", M = "MossStone";
  const hex = (o: { rBot: number; rTop: number; height: number; z: number }, mat: string) => rotateZ(cylinderAt({ rBot: o.rBot, rTop: o.rTop, height: o.height, segments: 6, bottom: [0, 0, o.z] }, mat), 30);
  const parts: Geo[] = [
    hex({ rBot: 50, rTop: 46, height: 18, z: 0 }, M),
    hex({ rBot: 42, rTop: 24, height: 16, z: 18 }, S),
    cylinderAt({ radius: 14, height: 88, segments: 10, bottom: [0, 0, 32] }, S),
    cylinderAt({ radius: 17, height: 7, segments: 10, bottom: [0, 0, 72] }, S),
    hex({ rBot: 22, rTop: 40, height: 18, z: 118 }, S),
    hex({ rBot: 40, rTop: 40, height: 8, z: 136 }, S),
    // fire box: a glowing core in a stone frame
    hex({ rBot: 21, rTop: 21, height: 48, z: 144 }, "LanternGlow"),
    hex({ rBot: 31, rTop: 31, height: 7, z: 144 }, S),
    hex({ rBot: 31, rTop: 31, height: 7, z: 186 }, S),
    // roof
    hex({ rBot: 52, rTop: 56, height: 6, z: 193 }, M),
    hex({ rBot: 56, rTop: 13, height: 32, z: 199 }, M),
    cylinderAt({ rBot: 9, rTop: 15, height: 8, segments: 10, bottom: [0, 0, 230] }, S),
    sphereCenter(13, [0, 0, 247], S, 10),
    cylinderAt({ rBot: 6, rTop: 0.5, height: 12, segments: 8, bottom: [0, 0, 256] }, S),
  ];
  for (let k = 0; k < 6; k++) {
    const a = ((k * 60 + 30) * Math.PI) / 180;
    parts.push(boxAt([8, 8, 36], [Math.cos(a) * 27, Math.sin(a) * 27, 151], S));
    parts.push(sphereCenter(7, [Math.cos(a) * 55, Math.sin(a) * 55, 204], M, 6));
  }
  return merge(...parts);
}

// A five-storey pagoda (goju-no-to): the town's landmark.
function pagoda(): Geo {
  const parts: Geo[] = [];
  const R = "LacquerRed", W = "Osaki_Shikkui";
  // podium with steps on every side
  parts.push(boxAt([1180, 1180, 26], [0, 0, 0], "StoneGrey", 4));
  parts.push(boxAt([1120, 1120, 44], [0, 0, 26], "Osaki_StoneWarm", 3));
  parts.push(boxAt([1130, 1130, 8], [0, 0, 66], "StoneGrey", 2));
  for (const rot of [0, 90, 180, 270])
    for (let k = 0; k < 3; k++) parts.push(rotateZ(boxAt([40, 280, 74 - k * 24], [-580 - k * 36, 0, 0], "StoneGrey", 3), rot));
  const cores = [300, 268, 240, 214, 190];
  const wallH = [290, 212, 200, 188, 178];
  let z0 = 74;
  for (let i = 0; i < 5; i++) {
    const c = cores[i], wh = wallH[i];
    // posts, beams and walls
    const posts = [-c, -c / 3, c / 3, c];
    const sideParts: Geo[] = [];
    for (const a of posts) sideParts.push(boxAt([26, 26, wh], [-c, a, z0], R, i === 0 ? 2 : 0));
    // sill, waist and head beams
    sideParts.push(boxAt([30, 2 * c + 26, 16], [-c - 2, 0, z0], R));
    sideParts.push(boxAt([24, 2 * c, 14], [-c - 2, 0, z0 + wh * 0.33], R));
    sideParts.push(boxAt([30, 2 * c + 30, 20], [-c - 2, 0, z0 + wh - 22], R));
    // plaster frieze above the head beam
    sideParts.push(boxAt([14, 2 * c, 28], [-c + 4, 0, z0 + wh - 2], W));
    // bays: a door in the middle, plaster (with a slat window on the ground floor) at the sides
    const bay = (2 * c) / 3;
    const dh = i === 0 ? 236 : wh * 0.72;
    sideParts.push(boxAt([12, bay - 26, wh - 30], [-c + 6, -bay, z0 + 16], W));
    sideParts.push(boxAt([12, bay - 26, wh - 30], [-c + 6, bay, z0 + 16], W));
    // double door
    sideParts.push(boxAt([12, bay - 26, dh], [-c + 2, 0, z0 + 16], "WoodRed"));
    sideParts.push(boxAt([14, 4, dh], [-c, 0, z0 + 16], "LacquerBlack"));
    for (const zz of [0.25, 0.5, 0.75]) for (const yy of [-1, 1]) sideParts.push(boxAt([4, 6, 6], [-c - 4, yy * (bay / 4), z0 + 16 + dh * zz], "GoldTrim"));
    sideParts.push(boxAt([12, bay - 26, wh - 30 - dh], [-c + 6, 0, z0 + 16 + dh], W));
    if (i === 0) {
      // renji windows: vertical slats in a dark opening
      for (const yy of [-bay, bay]) {
        sideParts.push(boxAt([10, bay * 0.55, 90], [-c + 2, yy, z0 + 120], "LacquerBlack"));
        sideParts.push(boxAt([14, bay * 0.55 + 16, 10], [-c, yy, z0 + 114], R));
        sideParts.push(boxAt([14, bay * 0.55 + 16, 10], [-c, yy, z0 + 208], R));
        for (let k = 0; k < 7; k++) sideParts.push(boxAt([8, 5, 92], [-c - 2, yy - bay * 0.25 + (k * bay * 0.5) / 6, z0 + 120], R));
      }
    }
    const side = merge(...sideParts);
    parts.push(side, rotateZ(side, 90), rotateZ(side, 180), rotateZ(side, 270));
    // brackets under the eaves
    const zb = z0 + wh + 26;
    parts.push(brackets(c, c, zb, 70, 4, 4, R, "WoodDark"));
    // the roof
    const he = c + 200 - i * 9;
    const spec: RoofSpec = { hx: he, hy: he, z: zb + 92 - 40, h: i === 4 ? he * 0.66 : he * 0.55, kind: "hip", ridge: 0, curve: 1.8, lift: 46, flare: 24, reach: he * 0.75, th: 22, nt: 8, ns: 12 };
    // the roof's underside rests on the eave purlin (top at zb + 88, c + 80 out)
    spec.z = zb + 112 - spec.h * Math.pow((he - c - 70) / he, 1.8);
    parts.push(roof(spec));
    // wind bells at the corners
    for (const [sx, sy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      const tip: V3 = [sx * (he + 22), sy * (he + 22), spec.z + 42 - 26];
      parts.push(cylinderBetween(add(tip, [0, 0, 22]), tip, 1.2, 4, "Bronze"), cylinderAt({ rBot: 9, rTop: 4, height: 16, segments: 8, bottom: add(tip, [0, 0, -16]) }, "Bronze"));
    }
    if (i < 4) {
      // the next storey stands where the roof meets its walls, with a balcony
      const cn = cores[i + 1];
      const zMeet = spec.z + spec.h * Math.pow(1 - cn / he, 1.8);
      z0 = zMeet - 4;
      parts.push(boxAt([2 * cn + 120, 2 * cn + 120, 12], [0, 0, z0 - 6], "WoodDark", 2));
      parts.push(railing(cn + 54, cn + 54, z0 + 6, 52, R, 90));
    } else {
      // the spire (sorin)
      const zA = spec.z + spec.h;
      parts.push(boxAt([76, 76, 34], [0, 0, zA - 16], "Bronze", 3));
      parts.push(lathe([[0, 0], [30, 2], [36, 14], [30, 30], [0, 34]], 12, "Bronze", [0, 0, zA + 16]));
      parts.push(lathe([[8, 0], [24, 10], [30, 22], [0, 22]], 12, "Bronze", [0, 0, zA + 48]));
      parts.push(cylinderAt({ radius: 7, height: 420, segments: 10, bottom: [0, 0, zA] }, "Bronze"));
      for (let k = 0; k < 9; k++) parts.push(translate(torus(26 - k * 1.2, 4, 14, 5, "Bronze"), [0, 0, zA + 88 + k * 28]));
      const zf = zA + 88 + 9 * 28;
      for (const rot of [0, 45, 90, 135]) parts.push(rotateZ(boxAt([60, 3, 70], [0, 0, zf], "GoldTrim"), rot));
      parts.push(sphereCenter(13, [0, 0, zf + 86], "GoldTrim", 10));
      parts.push(lathe([[0, 0], [12, 6], [14, 16], [8, 28], [0, 40]], 10, "GoldTrim", [0, 0, zf + 98]));
    }
  }
  return merge(...parts);
}

// ---- facade parts, all built on the plane x = x0 facing -X (turn them for other sides) ----

// Koshi lattice bay: a base board, red-brown slats in front of lit paper.
function latticeBay(x0: number, y0: number, y1: number, z0: number, z1: number, slat = "WoodRed"): Geo {
  const P: Geo[] = [
    bb([x0 - 6, y0, z0], [x0 + 8, y1, z0 + 50], "WoodDark", 1),
    bb([x0 + 2, y0, z0 + 50], [x0 + 8, y1, z1], "PaperShoji"),
    bb([x0 - 9, y0, z0 + 46], [x0 + 2, y1, z0 + 55], slat),
    bb([x0 - 9, y0, z1 - 9], [x0 + 2, y1, z1], slat),
  ];
  const n = Math.floor((y1 - y0 - 8) / 9);
  for (let i = 0; i <= n; i++) P.push(bb([x0 - 7, y0 + 4 + i * 9, z0 + 55], [x0 - 1, y0 + 8.5 + i * 9, z1 - 9], slat));
  return merge(...P);
}

// Noren: split curtains on a rod, with a white crest.
function noren(x0: number, y0: number, y1: number, zTop: number, h: number, mat = "FabricNavy", crest = "FabricWhite"): Geo {
  const P: Geo[] = [cylinderBetween([x0 - 1, y0 - 10, zTop + 3], [x0 - 1, y1 + 10, zTop + 3], 2.8, 6, "WoodPale")];
  const n = Math.max(1, Math.round((y1 - y0) / 64)), w = (y1 - y0) / n;
  for (let i = 0; i < n; i++) P.push(bb([x0 - 1.5, y0 + i * w + 1.5, zTop - h], [x0 + 1.5, y0 + (i + 1) * w - 1.5, zTop], mat));
  const r = Math.min(22, h * 0.24);
  const spots = n >= 6 ? [0.2, 0.5, 0.8] : [0.5];
  for (const f of spots) P.push(disc(r, [x0 - 2.6, lerp(y0, y1, f), zTop - h * 0.42], crest, "x"));
  return merge(...P);
}

// Mushiko window: thick plaster bars over a dark opening.
function mushiko(x0: number, yc: number, w: number, z0: number, h: number, wall: string): Geo {
  const P: Geo[] = [
    bb([x0 - 2, yc - w / 2, z0], [x0 + 4, yc + w / 2, z0 + h], "LacquerBlack"),
    bb([x0 - 11, yc - w / 2 - 11, z0 - 11], [x0 - 2, yc + w / 2 + 11, z0], wall, 1.5),
    bb([x0 - 11, yc - w / 2 - 11, z0 + h], [x0 - 2, yc + w / 2 + 11, z0 + h + 11], wall, 1.5),
    bb([x0 - 11, yc - w / 2 - 11, z0], [x0 - 2, yc - w / 2, z0 + h], wall),
    bb([x0 - 11, yc + w / 2, z0], [x0 - 2, yc + w / 2 + 11, z0 + h], wall),
  ];
  const n = Math.round(w / 17);
  for (let i = 1; i < n; i++) P.push(bb([x0 - 8, yc - w / 2 + (i * w) / n - 4, z0], [x0 - 2, yc - w / 2 + (i * w) / n + 4, z0 + h], wall));
  return merge(...P);
}

// A shoji panel (paper in a light frame), optionally with a few muntins standing proud.
function shoji(x0: number, y0: number, y1: number, z0: number, z1: number, frame = "WoodPale"): Geo {
  return merge(
    bb([x0 - 1, y0, z0], [x0 + 3, y1, z1], "PaperShoji"),
    bb([x0 - 4, y0, z0], [x0, y1, z0 + 7], frame),
    bb([x0 - 4, y0, z1 - 6], [x0, y1, z1], frame),
    bb([x0 - 4, y0, z0], [x0, y0 + 5, z1], frame),
    bb([x0 - 4, y1 - 5, z0], [x0, y1, z1], frame),
  );
}

// Inuyarai: curved bamboo slats bowing out from the foot of a wall.
function inuyarai(x0: number, y0: number, y1: number): Geo {
  const P: Geo[] = [];
  const prof = (f: number): V3 => [x0 - 4 - 50 * Math.sin(f), 0, 100 * Math.cos(f)];
  const fs = [0.22, 0.5, 0.8, 1.1, 1.35, 1.5];
  for (let y = y0 + 6; y <= y1 - 6; y += 13) P.push(sweep(fs.map((f) => add(prof(f), [0, y, 0])), 5, 3, "BambooDry"));
  for (const f of [0.4, 1.0]) {
    const p = prof(f);
    P.push(cylinderBetween([p[0] - 3, y0, p[2]], [p[0] - 3, y1, p[2]], 2.6, 6, "Bamboo"));
  }
  return merge(...P);
}

// Namako wall: dark tiles in a raised white diagonal grid.
function namako(x0: number, y0: number, y1: number, z0: number, z1: number, step = 30): Geo {
  const P: Geo[] = [bb([x0 - 2, y0, z0], [x0 + 6, y1, z1], "Osaki_Slate")];
  const H = z1 - z0;
  for (const dir of [1, -1])
    for (let c = y0 - H; c <= y1; c += step) {
      // y = c + s * H (dir 1) or c + H - s * H (dir -1), z = z0 + s * H
      const ya = dir > 0 ? c : c + H, yb = dir > 0 ? c + H : c;
      let s0 = 0, s1 = 1;
      const yAt = (s: number) => ya + (yb - ya) * s;
      const sAt = (y: number) => (y - ya) / (yb - ya);
      const lo = sAt(y0), hi = sAt(y1);
      s0 = Math.max(s0, Math.min(lo, hi));
      s1 = Math.min(s1, Math.max(lo, hi));
      if (s1 - s0 < 0.04) continue;
      P.push(beamBetween([x0 - 3, yAt(s0), z0 + s0 * H], [x0 - 3, yAt(s1), z0 + s1 * H], 4, 5, "Osaki_Shikkui"));
    }
  P.push(bb([x0 - 5, y0, z0 - 4], [x0 + 6, y1, z0 + 4], "Osaki_Shikkui"), bb([x0 - 5, y0, z1 - 4], [x0 + 6, y1, z1 + 4], "Osaki_Shikkui"));
  return merge(...P);
}

// A small potted pine for doorsteps.
function pottedPine(at: V3, s = 1): Geo {
  const g = merge(
    cylinderAt({ rBot: 13, rTop: 17, height: 22, segments: 10, bottom: [0, 0, 0] }, "StoneBlueDark"),
    cylinderAt({ radius: 15, height: 2, segments: 10, bottom: [0, 0, 20] }, "WoodDark"),
    cylinderBetween([0, 0, 20], [6, 2, 48], 3.5, 6, "BarkWarm", 2.6),
    cylinderBetween([6, 2, 48], [-8, 4, 70], 2.6, 6, "BarkWarm", 1.8),
    ellipsoid([22, 18, 9], [10, 2, 52], "PineNeedle", 8),
    ellipsoid([18, 15, 8], [-10, 4, 70], "PineNeedle", 8),
    ellipsoid([12, 10, 7], [0, 0, 84], "PineNeedle", 8),
  );
  return translate(scale(g, [s, s, s]), at);
}

// ---- machiya: a two-storey townhouse, 8 x 6.6 m; ridge along Y, eaves to the street ----
function machiya(): Geo {
  const P: Geo[] = [];
  const D = "WoodDark", Wh = "Osaki_Shikkui";
  const hx = 400, hy = 330, z1 = 18, z2 = 318, z3 = 548;
  P.push(bb([-hx - 14, -hy - 14, 0], [hx + 14, hy + 14, z1], "StoneGrey", 3));
  for (const x of [-hx, -hx / 3, hx / 3, hx]) for (const y of [-hy, hy]) P.push(boxAt([20, 20, z3 - z1], [x, y, z1], D, 1.5));
  for (const y of [-110, 110]) for (const x of [-hx, hx]) P.push(boxAt([20, 20, z3 - z1], [x, y, z1], D, 1.5));
  // side walls: charred boards low, white plaster above
  for (const sy of [-1, 1]) {
    const y = sy * hy;
    P.push(bb([-hx, y - 6, z1], [hx, y + 6, z1 + 95], D));
    P.push(bb([-hx, y - 5, z1 + 95], [hx, y + 5, z3], Wh));
    P.push(bb([-hx, y - 8, z1 + 92], [hx, y + 8, z1 + 102], D));
    P.push(bb([-hx, y - 8, z2 - 4], [hx, y + 8, z2 + 12], D));
    P.push(bb([-hx - 12, y - 10, z3 - 18], [hx + 12, y + 10, z3 + 16], D));
    // udatsu: a plaster firewall wing with its own little roof
    P.push(bb([-hx - 14, y, z2 + 40], [-hx + 66, y + sy * 34, z2 + 175], Wh, 2));
    P.push(bb([-hx - 16, y + sy * 2, z2 + 24], [-hx + 68, y + sy * 36, z2 + 42], D));
    P.push(bb([-hx - 24, y - sy * 6, z2 + 175], [-hx + 76, y + sy * 44, z2 + 186], "Osaki_Ridge", 2));
    P.push(cylinderBetween([-hx - 26, y + sy * 18, z2 + 191], [-hx + 78, y + sy * 18, z2 + 191], 7, 8, "Osaki_Ridge"));
  }
  // side windows on the upper floor
  const sideWin = merge(shoji(-hy - 7, -70, 70, 400, 470, D), ...Array.from({ length: 6 }, (_, i) => bb([-hy - 11, -60 + i * 24 - 2, 400], [-hy - 7, -60 + i * 24 + 2, 470], D)));
  P.push(rotateZ(sideWin, 90), rotateZ(sideWin, -90));
  // front: lattice bays either side of the entrance, inuyarai at their feet
  const fx = -hx;
  P.push(latticeBay(fx, -hy + 10, -120, z1, z2 - 46), latticeBay(fx, 120, hy - 10, z1, z2 - 46));
  P.push(inuyarai(fx - 12, -hy + 14, -124), inuyarai(fx - 12, 124, hy - 14));
  P.push(bb([fx - 9, -hy, z2 - 46], [fx + 6, hy, z2 - 30], D));
  P.push(bb([fx - 3, -hy, z2 - 30], [fx + 5, hy, z2 - 4], Wh));
  P.push(bb([fx - 10, -hy - 10, z2 - 4], [fx + 6, hy + 10, z2 + 12], D));
  // entrance: half open sliding door, dark inside, noren, a step stone and a potted pine
  P.push(bb([fx + 26, -100, z1], [fx + 32, 100, z2 - 46], "LacquerBlack"));
  P.push(bb([fx, -104, z1], [fx + 30, -98, z2 - 46], D), bb([fx, 98, z1], [fx + 30, 104, z2 - 46], D));
  P.push(shoji(fx + 4, 0, 98, z1, z2 - 48, "WoodRed"));
  for (let i = 1; i < 10; i++) P.push(bb([fx - 1, i * 9.8 - 1.5, z1 + 6], [fx + 1, i * 9.8 + 1.5, z2 - 54], "WoodRed"));
  P.push(bb([fx - 62, -92, 0], [fx - 14, 92, 14], "Osaki_StoneWarm", 2));
  P.push(noren(fx - 16, -100, 100, z2 - 52, 108));
  P.push(pottedPine([fx - 46, 150, 0]));
  // upper floor: earthen plaster with mushiko windows
  P.push(bb([fx - 3, -hy, z2 + 12], [fx + 6, hy, z3 - 18], "PlasterCream"));
  P.push(mushiko(fx - 3, -165, 140, z2 + 92, 72, "PlasterCream"), mushiko(fx - 3, 165, 140, z2 + 92, 72, "PlasterCream"));
  P.push(bb([fx - 12, -hy - 12, z3 - 18], [fx + 6, hy + 12, z3 + 16], D));
  // pent roof over the shop front, on bracket arms
  P.push(slab([fx - 108, -hy - 26, z2 + 16], [fx - 108, hy + 26, z2 + 16], [fx - 6, hy + 26, z2 + 60], [fx - 6, -hy - 26, z2 + 60], 10, "RoofKawara", D, "Osaki_TileEnd"));
  P.push(bb([fx - 16, -hy - 26, z2 + 54], [fx - 2, hy + 26, z2 + 70], "Osaki_Ridge", 2));
  P.push(bb([fx - 100, -hy - 20, z2 - 8], [fx - 90, hy + 20, z2 + 5], D));
  for (const y of [-hy, 0, hy]) P.push(beamBetween([fx, y, z2 + 20], [fx - 98, y, z2 + 2], 8, 10, D));
  // back: boards and plaster, shoji doors under a small roof, an upper window
  const back: Geo[] = [
    bb([-hx - 5, -hy, z1], [-hx + 5, hy, z1 + 95], D),
    bb([-hx - 4, -hy, z1 + 95], [-hx + 4, hy, z3], Wh),
    bb([-hx - 8, -hy, z1 + 92], [-hx + 8, hy, z1 + 102], D),
    bb([-hx - 8, -hy, z2 - 4], [-hx + 8, hy, z2 + 12], D),
    bb([-hx - 12, -hy - 12, z3 - 18], [-hx + 6, hy + 12, z3 + 16], D),
    shoji(-hx - 6, -92, 0, z1, z1 + 222, D),
    shoji(-hx - 6, 0, 92, z1, z1 + 222, D),
    bb([-hx - 10, -100, z1 + 222], [-hx, 100, z1 + 236], D),
    shoji(-hx - 6, -80, 80, z2 + 70, z2 + 150, D),
    slab([-hx - 66, -140, 266], [-hx - 66, 140, 266], [-hx - 4, 140, 296], [-hx - 4, -140, 296], 8, "RoofKawara", D, "Osaki_TileEnd"),
  ];
  P.push(rotateZ(merge(...back), 180));
  // main roof: gable, ridge along Y
  P.push(rotateZ(roof({ kind: "gable", hx: hy + 46, hy: hx + 80, z: z3 + 16, h: 205, th: 18, curve: 1.12, gableInset: 46, gableBase: z3, gableHalf: hx + 2, nt: 6, ns: 6 }), 90));
  return merge(...P);
}

// ---- shop: a black-walled kura-style merchant house with an open front, noren and signboards ----
function shop(): Geo {
  const P: Geo[] = [];
  const D = "WoodDark", K = "Osaki_Kuro", Wh = "Osaki_Shikkui";
  const hx = 360, hy = 400, z1 = 18, z2 = 320, z3 = 550;
  P.push(bb([-hx - 14, -hy - 14, 0], [hx + 14, hy + 14, z1], "StoneGrey", 3));
  // the open shop front: posts, raised floor, shelves full of goods
  for (const y of [-hy, -hy / 2, 0, hy / 2, hy]) P.push(boxAt([22, 22, z2 - z1], [-hx, y, z1], D, 1.5));
  P.push(bb([-hx + 4, -hy + 10, z1], [-hx + 230, hy - 10, 56], "WoodPale", 1));
  P.push(bb([-hx - 2, -hy, 46], [-hx + 10, hy, 58], D));
  P.push(bb([-hx + 230, -hy + 10, 56], [-hx + 240, hy - 10, z2], "WoodWarm"));
  P.push(bb([-hx, -hy, z2 - 16], [-hx + 240, hy, z2], D));
  for (const z of [110, 170, 230]) P.push(bb([-hx + 196, -hy + 12, z], [-hx + 232, hy - 12, z + 5], D));
  const rnd = seeded(5);
  const jarMats = ["StoneBlueDark", "Bronze", "PlasterCream", "WoodRed"];
  for (const z of [115, 175, 235])
    for (let y = -hy + 40; y < hy - 30; y += 46 + rnd() * 20) {
      if (rnd() < 0.5) P.push(lathe([[0, 0], [10, 1], [14, 12], [10, 24], [6, 28], [7, 32], [0, 32]], 8, jarMats[Math.floor(rnd() * 4)], [-hx + 214, y, z]));
      else P.push(boxAt([28, 30, 22 + rnd() * 14], [-hx + 214, y, z], rnd() < 0.5 ? "WoodPale" : "FabricSand", 1));
    }
  // baskets of fruit and bolts of cloth on the floor
  for (const [y, fruit] of [[-310, "Osaki_KoiOrange"], [-200, "LeafGreen"], [-90, "FabricRed"]] as const) {
    P.push(cylinderAt({ rBot: 24, rTop: 30, height: 22, segments: 10, bottom: [-hx + 60, y, 56] }, "BambooDry"));
    for (let k = 0; k < 6; k++) P.push(sphereCenter(9, [-hx + 60 + Math.cos(k) * 14, y + Math.sin(k) * 14, 80 + (k % 3) * 4], fruit, 6));
    P.push(sphereCenter(9, [-hx + 60, y, 90], fruit, 6));
  }
  const cloth = ["FabricRed", "FabricNavy", "FabricGold", "FabricPurple", "FabricGreen", "FabricBlue"];
  cloth.forEach((m, i) => P.push(cylinderBetween([-hx + 40, 60 + (i % 3) * 30, 64 + Math.floor(i / 3) * 24], [-hx + 150, 60 + (i % 3) * 30, 64 + Math.floor(i / 3) * 24], 12, 10, m)));
  P.push(boxAt([60, 120, 36], [-hx + 130, 260, 56], D, 2), boxAt([30, 40, 6], [-hx + 130, 240, 92], "WoodPale", 1));
  P.push(noren(-hx - 14, -hy / 2 + 6, hy / 2 - 6, z2 - 58, 100));
  // walls: thick black plaster, namako below, a white band under the eaves
  const sideWall = merge(
    bb([-hy - 9, -hx, z1], [-hy + 9, hx, z3], K),
    namako(-hy - 10, -hx + 14, hx - 14, z1 + 8, z1 + 116),
    bb([-hy - 11, -hx, z3 - 34], [-hy + 9, hx, z3], Wh),
    bb([-hy - 14, -hx - 4, z1], [-hy + 4, -hx + 14, z3], K, 2),
    bb([-hy - 14, hx - 14, z1], [-hy + 4, hx + 4, z3], K, 2),
  );
  P.push(rotateZ(sideWall, 90), rotateZ(sideWall, -90));
  const back = merge(
    bb([-hx - 9, -hy, z1], [-hx + 9, hy, z3], K),
    namako(-hx - 10, -hy + 14, -110, z1 + 8, z1 + 116),
    namako(-hx - 10, 110, hy - 14, z1 + 8, z1 + 116),
    bb([-hx - 11, -hy, z3 - 34], [-hx + 9, hy, z3], Wh),
    // a kura door: deep white frame, black door, iron fittings
    bb([-hx - 24, -95, z1], [-hx - 9, 95, z1 + 262], Wh, 4),
    bb([-hx - 27, -70, z1], [-hx - 22, 70, z1 + 228], K, 1),
    bb([-hx - 29, -2, z1 + 10], [-hx - 26, 2, z1 + 220], "IronDark"),
    bb([-hx - 30, -60, z1 + 110], [-hx - 27, 60, z1 + 118], "IronDark"),
  );
  P.push(rotateZ(back, 180));
  // upper front: black wall with two kura windows (shutters swung open)
  P.push(bb([-hx - 9, -hy, z2], [-hx + 9, hy, z3], K));
  P.push(bb([-hx - 12, -hy - 10, z2 - 18], [-hx + 10, hy + 10, z2 + 4], D));
  P.push(bb([-hx - 11, -hy, z3 - 34], [-hx + 9, hy, z3], Wh));
  for (const y of [-260, 260]) {
    P.push(bb([-hx - 20, y - 64, z2 + 80], [-hx - 8, y + 64, z2 + 178], Wh, 3));
    P.push(bb([-hx - 22, y - 44, z2 + 96], [-hx - 18, y + 44, z2 + 162], K));
    for (let k = -2; k <= 2; k++) P.push(cylinderBetween([-hx - 24, y + k * 15, z2 + 96], [-hx - 24, y + k * 15, z2 + 162], 2, 6, "IronDark"));
    for (const s of [-1, 1]) P.push(bb([-hx - 74, y + s * 60, z2 + 84], [-hx - 20, y + s * 70, z2 + 174], Wh, 2));
  }
  // pent roof with the big signboard standing on it
  P.push(slab([-hx - 112, -hy - 28, z2 + 18], [-hx - 112, hy + 28, z2 + 18], [-hx - 10, hy + 28, z2 + 62], [-hx - 10, -hy - 28, z2 + 62], 11, "RoofKawara", D, "Osaki_TileEnd"));
  P.push(bb([-hx - 18, -hy - 28, z2 + 56], [-hx - 6, hy + 28, z2 + 72], "Osaki_Ridge", 2));
  P.push(bb([-hx - 104, -hy - 22, z2 - 8], [-hx - 94, hy + 22, z2 + 6], D));
  for (const y of [-hy, -hy / 2, 0, hy / 2, hy]) P.push(beamBetween([-hx, y, z2 + 20], [-hx - 102, y, z2 + 2], 8, 10, D));
  const sx = -hx - 60;
  for (const y of [-120, 120]) P.push(bb([sx - 3, y - 4, z2 + 34], [sx + 3, y + 4, z2 + 70], D));
  P.push(bb([sx - 6, -160, z2 + 66], [sx + 6, 160, z2 + 156], K, 2));
  P.push(bb([sx - 8, -156, z2 + 70], [sx - 6, 156, z2 + 74], "GoldTrim"), bb([sx - 8, -156, z2 + 148], [sx - 6, 156, z2 + 152], "GoldTrim"));
  P.push(bb([sx - 8, -156, z2 + 70], [sx - 6, -152, z2 + 152], "GoldTrim"), bb([sx - 8, 152, z2 + 70], [sx - 6, 156, z2 + 152], "GoldTrim"));
  // three gold characters
  for (const yc of [-95, 0, 95]) {
    P.push(bb([sx - 9, yc - 22, z2 + 128], [sx - 6, yc + 22, z2 + 134], "GoldTrim"));
    P.push(bb([sx - 9, yc - 3, z2 + 84], [sx - 6, yc + 3, z2 + 136], "GoldTrim"));
    P.push(bb([sx - 9, yc - 18, z2 + 104], [sx - 6, yc + 18, z2 + 109], "GoldTrim"));
    P.push(beamBetween([sx - 8, yc - 4, z2 + 100], [sx - 8, yc - 22, z2 + 84], 3, 5, "GoldTrim"));
    P.push(beamBetween([sx - 8, yc + 4, z2 + 100], [sx - 8, yc + 22, z2 + 84], 3, 5, "GoldTrim"));
  }
  // a standing signboard by the street
  const os = -hx - 150, oy = -hy + 50;
  P.push(boxAt([44, 44, 14], [os, oy, 0], "StoneGrey", 2), boxAt([26, 40, 150], [os, oy, 14], "WoodWarm", 2));
  P.push(boxAt([40, 56, 8], [os, oy, 164], "Osaki_Ridge", 2), cylinderBetween([os, oy - 30, 176], [os, oy + 30, 176], 5, 6, "Osaki_Ridge"));
  for (const [z, w] of [[140, 22], [118, 6], [98, 18], [76, 6], [56, 24]] as const) P.push(bb([os - 15, oy - w / 2, z], [os - 12, oy + w / 2, z + 8], K));
  // main roof: heavy gable with big ridge-end tiles
  P.push(rotateZ(roof({ kind: "gable", hx: hy + 50, hy: hx + 86, z: z3 + 16, h: 225, th: 22, curve: 1.12, gableInset: 50, gableBase: z3, gableHalf: hx + 4, oni: "LacquerBlack", nt: 6, ns: 6 }), 90));
  return merge(...P);
}

// ---- tea house: a small irimoya pavilion on a raised deck, red bench and parasol out front ----
function teaHouse(): Geo {
  const P: Geo[] = [];
  const Wd = "WoodWarm", Wh = "Osaki_Shikkui";
  const fx = -300, bx = 300, hy = 340, zf = 50, zt = 310;
  for (const x of [fx + 20, -40, bx - 20]) for (const y of [-hy + 20, 0, hy - 20]) P.push(boxAt([36, 36, 24], [x, y, 0], "StoneGrey", 3));
  for (const y of [-hy + 20, 0, hy - 20]) P.push(bb([fx, y - 7, 24], [bx, y + 7, zf - 10], "WoodShade"));
  P.push(bb([fx, -hy, zf - 10], [bx, hy, zf], "WoodPale", 1.5));
  // posts: the veranda front and the room
  for (const y of [-hy + 10, hy - 10]) P.push(boxAt([14, 14, zt - zf], [fx + 10, y, zf], Wd, 1.5));
  for (const x of [-80, bx - 10]) for (const y of [-hy + 40, -100, 100, hy - 40]) P.push(boxAt([14, 14, zt - zf], [x, y, zf], Wd, 1.5));
  // plate beams
  P.push(bb([fx, -hy, zt - 16], [fx + 18, hy, zt + 4], Wd), bb([bx - 18, -hy, zt - 16], [bx, hy, zt + 4], Wd));
  P.push(bb([fx, -hy, zt - 16], [bx, -hy + 18, zt + 4], Wd), bb([fx, hy - 18, zt - 16], [bx, hy, zt + 4], Wd));
  // the room: tatami, shoji round three sides, a plaster back wall with a round window
  P.push(bb([-80, -hy + 40, zf], [bx - 10, hy - 40, zf + 4], "Osaki_Tatami"));
  P.push(bb([bx - 16, -hy + 40, zf], [bx - 4, hy - 40, zt - 16], Wh));
  P.push(disc(62, [bx - 18, 0, 175], "PaperShoji", "x", 4, 20), translate(rotateY(torus(64, 5, 20, 6, "BambooDry"), 90), [bx - 20, 0, 175]));
  P.push(...[-30, 0, 30].map((d) => bb([bx - 21, d - 2, 113], [bx - 18, d + 2, 237], "BambooDry")));
  for (const sy of [-1, 1]) {
    const y = sy * (hy - 40);
    for (let i = 0; i < 4; i++) {
      const x0 = -80 + i * 92;
      const a = sy > 0 ? x0 + 4 : -(x0 + 90), b = sy > 0 ? x0 + 90 : -(x0 + 4);
      P.push(translate(rotateZ(shoji(-6, a, b, zf + 4, zt - 50), sy > 0 ? -90 : 90), [0, y, 0]));
    }
    P.push(bb([-80, y - 5, zt - 50], [bx - 10, y + 5, zt - 16], Wh));
  }
  // front of the room: two shoji closed, two slid open
  P.push(shoji(-84, -hy + 44, -hy + 134, zf + 4, zt - 50), shoji(-84, hy - 134, hy - 44, zf + 4, zt - 50), shoji(-78, hy - 220, hy - 130, zf + 4, zt - 50));
  P.push(bb([-86, -hy + 40, zt - 50], [-74, hy - 40, zt - 16], Wh));
  // a low table and cushions inside
  P.push(boxAt([70, 110, 30], [60, 0, zf + 4], "WoodDark", 2), boxAt([50, 50, 8], [0, -40, zf + 4], "FeltRed", 2), boxAt([50, 50, 8], [0, 40, zf + 4], "FeltRed", 2));
  // a step stone to the veranda
  P.push(rock([70, 50, 26], 0.2, 7, "StoneGrey", true).map((p) => ({ geo: p.geo.translate(fx - 40, 0, 0), mat: p.mat })));
  // roof: irimoya, ridge along Y
  P.push(rotateZ(roof({ kind: "irimoya", hx: hy + 70, hy: bx + 70, z: zt + 10, h: 230, th: 16, curve: 1.6, lift: 24, flare: 10, gableAt: 0.5, nt: 8, ns: 10 }), 90));
  // red lanterns at the front corners
  for (const y of [-hy + 10, hy - 10]) P.push(chochin(13, [fx + 10, y, zt - 20]));
  // outside: a bench with red felt, tea and dango
  const bxp = -430, by = -110;
  P.push(boxAt([70, 190, 42], [bxp, by, 0], Wd, 2), boxAt([76, 196, 4], [bxp, by, 42], "FeltRed", 1));
  P.push(boxAt([30, 42, 3], [bxp, by - 40, 46], "LacquerBlack", 1));
  P.push(sphereCenter(7, [bxp - 4, by - 48, 55], "IronDark", 8), cylinderAt({ rBot: 3.5, rTop: 4.5, height: 7, segments: 8, bottom: [bxp + 6, by - 30, 49] }, "PlasterCream"));
  P.push(cylinderBetween([bxp - 10, by + 30, 49], [bxp + 16, by + 30, 51], 0.7, 4, "BambooDry"));
  for (const [i, m] of ["Osaki_Lotus", "Osaki_KoiWhite", "Osaki_Moss"].entries()) P.push(sphereCenter(4, [bxp - 4 + i * 7, by + 30, 51], m, 6));
  // parasol (nodate-gasa)
  const px = -440, py = 140;
  P.push(cylinderAt({ radius: 22, height: 14, segments: 10, bottom: [px, py, 0] }, "StoneGrey"));
  P.push(cylinderAt({ radius: 4, height: 290, segments: 8, bottom: [px, py, 0] }, "Bamboo"));
  P.push(lathe([[150, 226], [128, 238], [60, 270], [8, 288], [0, 289]], 16, "FabricRed", [px, py, 0]));
  P.push(lathe([[0, 284], [8, 283], [60, 266], [128, 234], [148, 223]], 16, "Osaki_Sail", [px, py, 0]));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    P.push(cylinderBetween([px, py, 250], [px + Math.cos(a) * 140, py + Math.sin(a) * 140, 226], 0.9, 4, "BambooDry"));
  }
  // nobori banner on a bamboo pole
  const nx = -360, ny = -300;
  P.push(cylinderAt({ radius: 3.5, height: 380, segments: 8, bottom: [nx, ny, 0] }, "Bamboo"));
  P.push(cylinderBetween([nx, ny, 350], [nx, ny + 66, 350], 2, 6, "Bamboo"));
  P.push(bb([nx - 1, ny + 4, 140], [nx + 1, ny + 62, 350], "FabricWhite"));
  P.push(bb([nx - 1.5, ny + 4, 316], [nx + 1.5, ny + 62, 350], "FabricRed"), bb([nx - 1.5, ny + 4, 140], [nx + 1.5, ny + 62, 152], "FabricRed"));
  for (const [z, w] of [[284, 30], [262, 8], [240, 26], [214, 8], [190, 34]] as const) P.push(bb([nx - 2.5, ny + 33 - w / 2, z], [nx - 1, ny + 33 + w / 2, z + 9], "LacquerBlack"));
  return translate(merge(...P), [100, 0, 0]); // centre the footprint (the bench and parasol stand in front)
}

// ---- farmhouse (minka): thatched irimoya roof, earthen walls, a veranda, firewood ----
function farmhouse(): Geo {
  const P: Geo[] = [];
  const D = "WoodDark", Wl = "PlasterCream";
  const hx = 450, hy = 330, z1 = 22, zt = 292;
  P.push(bb([-hx - 12, -hy - 12, 0], [hx + 12, hy + 12, z1], "MossStone", 3));
  for (const x of [-hx, -hx / 2, 0, hx / 2, hx]) for (const y of [-hy, hy]) P.push(boxAt([20, 20, zt - z1], [x, y, z1], D, 1.5));
  for (const y of [-110, 110]) for (const x of [-hx, hx]) P.push(boxAt([20, 20, zt - z1], [x, y, z1], D, 1.5));
  // walls: boards below, earthen plaster above, beams
  const wall = (half: number, d: number): Geo =>
    merge(
      bb([-d - 5, -half, z1], [-d + 5, half, z1 + 100], "WoodShade"),
      bb([-d - 4, -half, z1 + 100], [-d + 4, half, zt], Wl),
      bb([-d - 8, -half, z1 + 96], [-d + 8, half, z1 + 106], D),
      bb([-d - 10, -half - 10, zt - 20], [-d + 10, half + 10, zt + 30], D),
    );
  // front: a wide doorway (one leaf open) and a slat window
  const front = merge(
    wall(hy, hx),
    bb([-hx - 2, -70, z1], [-hx + 6, 90, z1 + 210], "LacquerBlack"),
    bb([-hx - 10, -76, z1 + 210], [-hx + 2, 96, z1 + 226], D),
    bb([-hx - 12, 90, z1], [-hx - 4, 176, z1 + 210], "DoorWood", 1),
    bb([-hx - 14, 96, z1 + 100], [-hx - 11, 170, z1 + 106], D),
    bb([-hx - 7, -260, z1 + 110], [-hx - 3, -150, z1 + 190], "LacquerBlack"),
    ...Array.from({ length: 8 }, (_, i) => cylinderBetween([-hx - 8, -254 + i * 15, z1 + 110], [-hx - 8, -254 + i * 15, z1 + 190], 2.5, 6, "Bamboo")),
    bb([-hx - 52, -60, 0], [-hx - 12, 80, 12], "Osaki_StoneWarm", 2),
  );
  P.push(front);
  // the -Y side: shoji along a veranda
  const sideV = merge(
    bb([-hy - 5, -hx, z1], [-hy + 5, hx, z1 + 30], "WoodShade"),
    ...Array.from({ length: 8 }, (_, i) => shoji(-hy - 6, -hx + 12 + i * 110.5, -hx + 120 + i * 110.5, z1 + 30, zt - 30)),
    bb([-hy - 4, -hx, zt - 30], [-hy + 4, hx, zt], Wl),
    bb([-hy - 10, -hx - 10, zt - 20], [-hy + 10, hx + 10, zt + 30], D),
    bb([-hy - 100, -hx + 40, 38], [-hy - 4, hx - 40, 48], "WoodPale", 1),
    ...[-hx + 60, -hx / 3, hx / 3, hx - 60].map((y) => boxAt([10, 10, 38], [-hy - 90, y, 0], D)),
    bb([-hy - 70, hx - 40, z1], [-hy - 8, hx - 10, zt - 20], "WoodShade", 1),
  );
  P.push(rotateZ(sideV, 90));
  // the +Y side: plaster wall with a stack of firewood and straw bales
  const sideW = merge(wall(hx, hy), shoji(-hy - 6, -60, 60, z1 + 120, z1 + 200, D));
  P.push(rotateZ(sideW, -90));
  for (let row = 0; row < 4; row++)
    for (let i = 0; i < 9 - (row % 2); i++) P.push(cylinderBetween([-200 + i * 26 + (row % 2) * 13, hy + 16, 12 + row * 24], [-200 + i * 26 + (row % 2) * 13, hy + 66, 12 + row * 24], 12, 7, "BarkWarm"));
  P.push(bb([-212, hy + 14, 0], [24, hy + 70, 4], "WoodDark"));
  P.push(cylinderBetween([120, hy + 50, 30], [200, hy + 50, 30], 30, 10, "Osaki_Straw"), cylinderBetween([140, hy + 50, 82], [220, hy + 50, 82], 26, 10, "Osaki_Straw"));
  P.push(rotateZ(wall(hy, hx), 180));
  // a rain barrel at the front corner and dried persimmons under the eave
  P.push(cylinderAt({ radius: 30, height: 70, segments: 12, bottom: [-hx - 50, -hy + 20, 0] }, "WoodWarm"));
  for (const z of [12, 56]) P.push(cylinderAt({ radius: 31, height: 5, segments: 12, bottom: [-hx - 50, -hy + 20, z] }, "IronDark"));
  P.push(cylinderAt({ radius: 27, height: 2, segments: 12, bottom: [-hx - 50, -hy + 20, 68] }, "WaterDark"));
  for (const y of [-240, -200, -160]) {
    P.push(cylinderBetween([-hx - 30, y, 275], [-hx - 30, y, 180], 0.8, 4, "RopeTan"));
    for (let k = 0; k < 6; k++) P.push(sphereCenter(5, [-hx - 30, y, 190 + k * 14], "Osaki_KoiOrange", 6));
  }
  // thatched roof
  P.push(roof({ kind: "irimoya", hx: hx + 125, hy: hy + 125, z: zt + 4, h: 440, th: 46, curve: 1.05, gableAt: 0.62, mat: "Osaki_Thatch", under: "Osaki_ThatchDark", edge: "Osaki_ThatchDark", tileEnd: "Osaki_Thatch", uvScale: [0.5, 0.45], ridgeMat: "Osaki_ThatchDark", gableMat: "WoodDark", hafu: "WoodDark", cap: false, nt: 8, ns: 8 }));
  // ridge: a thatch cap with bamboo and crossed sticks
  const zr = zt + 4 + 440, rl = hx + 125 - (hy + 125) * 0.62;
  P.push(bb([-rl - 20, -36, zr - 40], [rl + 20, 36, zr + 22], "Osaki_ThatchDark", 6));
  P.push(cylinderBetween([-rl - 26, 0, zr + 26], [rl + 26, 0, zr + 26], 12, 8, "BambooDry"));
  for (let i = 0; i < 6; i++) {
    const x = -rl + (2 * rl * i) / 5;
    P.push(cylinderBetween([x, -50, zr - 6], [x, 40, zr + 64], 3.5, 6, D), cylinderBetween([x, 50, zr - 6], [x, -40, zr + 64], 3.5, 6, D));
  }
  // the smoke-vent lattice on each gable
  for (const s of [-1, 1]) for (let i = -3; i <= 3; i++) P.push(bb([s * (rl - 14), i * 18 - 2, zt + 290], [s * (rl - 8), i * 18 + 2, zt + 380 - Math.abs(i) * 22], "BambooDry"));
  return merge(...P);
}

// ---- shrine hall (haiden): raised on a stone platform, red pillars, big irimoya roof and a
// karahafu porch over the steps ----
function karahafu(x0: number, x1: number, half: number, z: number, hump: number, th: number): Geo {
  const ny = 16;
  const ys = Array.from({ length: ny + 1 }, (_, j) => -half + (2 * half * j) / ny);
  const zf = (y: number) => {
    const a = Math.abs(y) / half;
    return z + hump * Math.pow(Math.cos((a * Math.PI) / 2), 1.3) + 0.25 * hump * Math.pow(a, 6);
  };
  const xs = [x0, (x0 + x1) / 2, x1];
  const top = xs.map((x) => ys.map((y): V3 => [x, y, zf(y)]));
  const arc: number[] = [0];
  for (let j = 1; j <= ny; j++) arc.push(arc[j - 1] + Math.hypot(ys[j] - ys[j - 1], zf(ys[j]) - zf(ys[j - 1])));
  const mid = arc[ny / 2];
  const uvTop = top.map((row) => row.map((p, j): [number, number] => [p[0] / 100, Math.abs(arc[j] - mid) / 100]));
  const down: V3 = [0, 0, -th];
  const bot = top.map((row) => row.map((p) => add(p, down)));
  const P: Geo[] = [surface(top, uvTop, "RoofKawara", UP), surface(bot, uvTop, "WoodDark", [0, 0, -1])];
  P.push(surface([top[0], bot[0]], [top[0].map((p): [number, number] => [p[1] / 100, 0]), top[0].map((p): [number, number] => [p[1] / 100, th / 100])], "WoodDark", [-1, 0, 0]));
  for (const j of [0, ny]) P.push(surface(xs.map((_, i) => [top[i][j], bot[i][j]]), xs.map((x): [number, number][] => [[x / 100, 0], [x / 100, th / 100]]), "WoodDark", [0, j === 0 ? -1 : 1, 0]));
  // the bow-shaped bargeboard and its gold fittings
  P.push(sweep(ys.map((y): V3 => [x0 - 6, y, zf(y) - th / 2 + 2]), 12, th + 24, "WoodDark"));
  P.push(sweep(ys.map((y): V3 => [x0 - 13, y, zf(y) + 6]), 3, 5, "GoldTrim", { caps: false }));
  P.push(boxAt([8, 40, 30], [x0 - 14, 0, zf(0) - th - 20], "GoldTrim", 2), sphereCenter(7, [x0 - 18, 0, zf(0) - th - 2], "GoldTrim", 8));
  for (const s of [-1, 1]) P.push(boxAt([8, 22, 16], [x0 - 12, s * (half - 12), zf(half) - th - 8], "GoldTrim", 2));
  return merge(...P);
}

// A komainu guardian on its pedestal, facing -X (side = which way it turns its head).
function komainu(at: V3, side: number): Geo {
  const S = "StoneGrey", M = "MossStone";
  const g = merge(
    boxAt([62, 62, 14], [0, 0, 0], M, 3),
    boxAt([50, 50, 56], [0, 0, 14], S, 3),
    boxAt([60, 60, 10], [0, 0, 70], M, 3),
    // haunches, chest, front legs, head with a curly mane, a curled tail
    ellipsoid([22, 18, 16], [8, 0, 92], S, 8),
    ellipsoid([16, 15, 22], [-6, 0, 108], S, 8),
    boxAt([9, 9, 30], [-14, -9, 80], S, 2),
    boxAt([9, 9, 30], [-14, 9, 80], S, 2),
    ellipsoid([15, 16, 15], [-12, side * 3, 134], M, 8),
    ellipsoid([10, 13, 8], [-22, side * 3, 130], S, 8),
    sphereCenter(4, [-30, side * 3 - 6, 136], "LacquerBlack", 6),
    sphereCenter(4, [-30, side * 3 + 6, 136], "LacquerBlack", 6),
    ellipsoid([9, 9, 12], [24, 0, 108], M, 6),
  );
  return translate(rotateZ(g, side * 12, [0, 0, 0]), at);
}

function shrineHall(): Geo {
  const P: Geo[] = [];
  const R = "LacquerRed", Wh = "Osaki_Shikkui", D = "WoodDark";
  const bx = 380, by = 540, zP = 44, zF = 120, zW = 440;
  // stone platform and steps
  P.push(bb([-560, -720, 0], [560, 720, 34], "StoneGrey", 4), bb([-540, -700, 34], [540, 700, zP], "Osaki_StoneWarm", 2));
  P.push(bb([-600, -250, 0], [-555, 250, 30], "StoneGrey", 3), bb([-640, -250, 0], [-598, 250, 15], "StoneGrey", 3));
  // under-floor and the veranda round the hall
  P.push(bb([-bx + 10, -by + 10, zP], [bx - 10, by - 10, zF - 14], D));
  for (const x of [-460, -230, 0, 230, 460]) for (const y of [-620, 620]) P.push(cylinderAt({ radius: 10, height: zF - 14 - zP, segments: 8, bottom: [x, y, zP] }, R));
  for (const y of [-400, -133, 133, 400]) for (const x of [-460, 460]) P.push(cylinderAt({ radius: 10, height: zF - 14 - zP, segments: 8, bottom: [x, y, zP] }, R));
  P.push(bb([-472, -632, zF - 14], [472, 632, zF], "WoodWarm", 2));
  P.push(railing(465, 625, zF, 64, R, 115, 470));
  // wooden steps up to the veranda
  for (let k = 0; k < 4; k++) P.push(bb([-472 - (k + 1) * 22, -220, zP - 10], [-472 - k * 22, 220, zF - 14 - k * 19], "WoodWarm", 1.5));
  for (const s of [-1, 1]) P.push(sweep([[-560, s * 226, zP + 50], [-472, s * 226, zF + 56]], 8, 8, R), boxAt([12, 12, 56], [-560, s * 226, zP], R, 1));
  // pillars, beams, walls
  const front = (half: number, d: number, n: number, doors: boolean): Geo => {
    const G: Geo[] = [];
    const ys = Array.from({ length: n + 1 }, (_, i) => -half + (2 * half * i) / n);
    for (const y of ys) G.push(cylinderAt({ radius: 17, height: zW - zF, segments: 12, bottom: [-d, y, zF] }, R));
    G.push(bb([-d - 12, -half, zF], [-d + 10, half, zF + 18], R), bb([-d - 14, -half - 14, zF + 300 - 70], [-d + 10, half + 14, zF + 300 - 52], R));
    G.push(bb([-d - 12, -half - 10, zW - 26], [-d + 10, half + 10, zW], R));
    for (let i = 0; i < n; i++) {
      const y0 = ys[i] + 17, y1 = ys[i + 1] - 17;
      const centre = doors && i > 0 && i < n - 1;
      if (centre) {
        // lattice doors: a black grid over paper
        G.push(bb([-d - 1, y0, zF + 18], [-d + 4, y1, zF + 230], "PaperShoji"));
        for (let y = y0 + 9; y < y1 - 4; y += 18) G.push(bb([-d - 5, y - 2, zF + 18], [-d - 1, y + 2, zF + 230], "LacquerBlack"));
        for (let z = zF + 30; z < zF + 226; z += 18) G.push(bb([-d - 5, y0, z - 2], [-d - 1, y1, z + 2], "LacquerBlack"));
        G.push(bb([-d - 6, y0, zF + 226], [-d + 4, y1, zF + 238], R));
        G.push(bb([-d - 3, y0, zF + 238], [-d + 6, y1, zW - 26], Wh));
      } else G.push(bb([-d - 3, y0, zF + 18], [-d + 6, y1, zW - 26], Wh));
    }
    // the frieze above, with gold beam ends
    G.push(bb([-d - 2, -half, zW], [-d + 8, half, zW + 34], Wh));
    return merge(...G);
  };
  P.push(front(by, bx, 5, true), rotateZ(front(by, bx, 5, false), 180), rotateZ(front(bx, by, 3, false), 90), rotateZ(front(bx, by, 3, false), -90));
  P.push(brackets(bx, by, zW + 30, 70, 6, 4, R, D));
  // the main roof
  const spec: RoofSpec = { kind: "irimoya", hx: by + 185, hy: bx + 185, z: 0, h: 400, th: 26, curve: 1.7, lift: 46, flare: 22, gableAt: 0.5, nt: 10, ns: 14, hafu: D, oni: "GoldTrim" };
  spec.z = zW + 30 + 114 - spec.h * Math.pow((185 - 70) / (bx + 185), 1.7);
  P.push(rotateZ(roof(spec), 90));
  // a gold crest on each gable
  const zg = spec.z + spec.h * Math.pow(0.75, 1.7) - 30;
  for (const s of [-1, 1]) P.push(disc(30, [0, s * (by + 185 - (bx + 185) * 0.5 - 12), zg], "GoldTrim", "y", 4, 16));
  // the porch: two pillars, a rainbow beam, the karahafu roof
  const px = -600;
  for (const s of [-1, 1]) {
    P.push(boxAt([44, 44, 18], [px, s * 200, 30], "StoneGrey", 3), cylinderAt({ radius: 15, height: 374, segments: 12, bottom: [px, s * 200, 48] }, R));
    P.push(bb([px, s * 200 - 8, 360], [-bx, s * 200 + 8, 376], R));
  }
  P.push(sweep(Array.from({ length: 9 }, (_, i): V3 => { const y = -230 + (460 * i) / 8; return [px, y, 372 + 12 * (1 - (y / 230) ** 2)]; }), 22, 26, R));
  P.push(karahafu(px - 90, -bx - 60, 270, 418, 66, 18));
  // shimenawa rope with paper streamers, the bell and its rope
  const rope: V3[] = Array.from({ length: 11 }, (_, i) => { const y = -160 + 32 * i; return [px + 4, y, 352 - 34 * (1 - (y / 160) ** 2)]; });
  for (let i = 0; i < 10; i++) P.push(cylinderBetween(rope[i], rope[i + 1], 10 - 4 * Math.abs(i - 4.5) / 4.5, 8, "RopeTan", 10 - 4 * Math.abs(i + 1 - 4.5) / 4.5));
  for (const i of [2, 4, 6, 8]) for (let k = 0; k < 4; k++) P.push(boxAt([1, 9, 12], [rope[i][0] - 6, rope[i][1] + (k % 2 ? 4 : -4), rope[i][2] - 22 - k * 12], "FabricWhite"));
  P.push(sphereCenter(15, [px + 40, 0, 316], "GoldTrim", 10), bb([px + 24, -9, 306], [px + 26, 9, 309], "LacquerBlack"));
  ["FabricRed", "FabricWhite", "FabricRed", "FabricWhite", "FabricRed"].forEach((m, i) => P.push(cylinderBetween([px + 40, 0, 300 - i * 30], [px + 40, 0, 270 - i * 30], 3, 6, m)));
  // guardians at the foot of the steps
  P.push(komainu([-700, -330, 0], 1), komainu([-700, 330, 0], -1));
  // the offering box
  P.push(boxAt([56, 140, 50], [-428, 0, zF], D, 2));
  for (let k = 0; k < 6; k++) P.push(boxAt([58, 6, 4], [-428, -55 + k * 22, zF + 50], "WoodPale"));
  P.push(disc(10, [-457, 0, zF + 26], "GoldTrim", "x", 2, 12));
  return translate(merge(...P), [70, 0, 0]); // centre the footprint (porch and guardians in front)
}

// ---- the red arched bridge (taiko-bashi) over a little stream ----
function taikoBridge(): Geo {
  const P: Geo[] = [];
  const R = "LacquerRed";
  const half = 470, rise = 170, z0 = 22;
  const zAt = (x: number) => z0 + rise * Math.pow(Math.max(0, 1 - (x / half) ** 2), 0.85);
  const xs = Array.from({ length: 21 }, (_, i) => -half + (2 * half * i) / 20);
  // water and its stony banks
  const ring = Array.from({ length: 24 }, (_, k): V3 => { const a = (k / 24) * Math.PI * 2; return [255 * Math.cos(a), 400 * Math.sin(a), 3]; });
  P.push(fan([0, 0, 3], ring, "Osaki_Pond", UP, (p) => [p[0] / 100, p[1] / 100], true));
  P.push(fan([0, 0, 1], ring.map((p): V3 => [p[0] * 1.02, p[1] * 1.02, 1]), "Osaki_PondBed", UP, (p) => [p[0] / 100, p[1] / 100], true));
  const rnd = seeded(23);
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    if (Math.abs(s * 400) < 130) continue;
    const sz = 40 + rnd() * 36;
    P.push(translate(rock([sz, sz * 0.8, sz * 0.55], 0.4, k + 3, rnd() < 0.6 ? "MossStone" : "StoneGrey"), [262 * c, 408 * s, -4]));
  }
  // deck, girders, rails
  const deck = xs.map((x): V3 => [x, 0, zAt(x) - 6]);
  P.push(sweep(deck, 220, 12, "WoodPale", { swapUv: true }));
  for (const s of [-1, 1]) {
    P.push(sweep(xs.map((x): V3 => [x, s * 113, zAt(x) - 22]), 14, 34, R));
    const inner = xs.filter((x) => Math.abs(x) < half * 0.93);
    P.push(sweep(inner.map((x): V3 => [x, s * 108, zAt(x) + 76]), 10, 9, R), sweep(inner.map((x): V3 => [x, s * 108, zAt(x) + 38]), 7, 7, R));
    for (let i = 0; i <= 8; i++) {
      const x = -half * 0.9 + (1.8 * half * i) / 8;
      const end = i === 0 || i === 8;
      P.push(boxAt(end ? [18, 18, 100] : [11, 11, 82], [x, s * 108, zAt(x) - 4], R, 1.5));
      if (end) P.push(lathe([[9, 0], [12, 6], [11, 14], [5, 22], [1, 30], [0, 32]], 10, "Bronze", [x, s * 108, zAt(x) + 96]));
    }
    // piers in the water
    for (const px of [-230, 230]) {
      P.push(cylinderAt({ radius: 11, height: zAt(px) - 24, segments: 10, bottom: [px, s * 80, 0] }, R));
      P.push(cylinderAt({ radius: 12, height: 14, segments: 10, bottom: [px, s * 80, 0] }, "LacquerBlack"));
    }
  }
  for (const px of [-230, 230]) P.push(bb([px - 8, -98, zAt(px) - 40], [px + 8, 98, zAt(px) - 22], R), bb([px - 6, -86, 52], [px + 6, 86, 64], R));
  // stone abutments
  for (const s of [-1, 1]) P.push(bb([s * (half - 70), -150, 0], [s * (half + 40), 150, z0], "StoneGrey", 3));
  return merge(...P);
}

// ---- koi pond: stone-rimmed water, koi, lily pads, irises and a bamboo water spout ----
function koi(at: V3, heading: number, kind: number): Geo {
  const a = kind === 1 ? "Osaki_KoiWhite" : "Osaki_KoiOrange", b = kind === 1 ? "Osaki_KoiOrange" : kind === 2 ? "LacquerBlack" : "Osaki_KoiWhite";
  const g = merge(
    ellipsoid([24, 8, 5], [0, 0, 0], a, 8),
    ellipsoid([10, 6.5, 4], [6 - kind * 4, 0, 1.8], b, 6),
    rotateZ(box([14, 3, 1.4], [-26, 0, 0], a), 28, [-20, 0, 0]),
    rotateZ(box([14, 3, 1.4], [-26, 0, 0], a), -28, [-20, 0, 0]),
    rotateZ(box([8, 2, 1], [4, 9, -1], a), 30, [4, 6, 0]),
    rotateZ(box([8, 2, 1], [4, -9, -1], a), -30, [4, -6, 0]),
  );
  return translate(rotateZ(g, heading), at);
}

function iris(at: V3, seed: number): Geo {
  const rnd = seeded(seed);
  const P: Geo[] = [];
  for (let i = 0; i < 9; i++) {
    const a = rnd() * 360, tilt = 6 + rnd() * 16, h = 55 + rnd() * 35;
    P.push(rotateZ(rotateY(boxAt([2, 7, h], [0, 0, 0], "LeafGreen"), tilt), a));
  }
  for (let i = 0; i < 3; i++) {
    const a = rnd() * Math.PI * 2, r = 8 + rnd() * 8;
    P.push(cylinderBetween([0, 0, 0], [Math.cos(a) * r, Math.sin(a) * r, 80 + i * 8], 0.8, 4, "LeafGreen"), ellipsoid([6, 6, 5], [Math.cos(a) * r, Math.sin(a) * r, 84 + i * 8], "FabricPurple", 6));
  }
  return translate(merge(...P), at);
}

function koiPond(): Geo {
  const P: Geo[] = [];
  const rx = 270, ry = 205;
  const rad = (a: number) => 1 + 0.1 * Math.sin(2 * a + 1) + 0.07 * Math.sin(3 * a + 2);
  const ring = Array.from({ length: 28 }, (_, k): V3 => { const a = (k / 28) * Math.PI * 2; return [rx * rad(a) * Math.cos(a), ry * rad(a) * Math.sin(a), 5]; });
  P.push(fan([0, 0, 5], ring, "Osaki_Pond", UP, (p) => [p[0] / 100, p[1] / 100], true));
  P.push(fan([0, 0, 1], ring.map((p): V3 => [p[0] * 1.03, p[1] * 1.03, 1]), "Osaki_PondBed", UP, (p) => [p[0] / 100, p[1] / 100], true));
  // rim stones
  const rnd = seeded(41);
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2 + rnd() * 0.1;
    const r = rad(a) * 1.06, sz = 44 + rnd() * 40;
    P.push(translate(rock([sz, sz * 0.75, sz * (0.45 + rnd() * 0.3)], 0.45, 60 + k, rnd() < 0.55 ? "MossStone" : "StoneGrey"), [rx * r * Math.cos(a), ry * r * Math.sin(a), -5]));
  }
  // koi under the surface
  for (const [x, y, h, k] of [[-120, -40, 20, 0], [-70, 60, 200, 1], [40, -90, 120, 2], [110, 30, 310, 0], [-10, 20, 80, 1], [150, -60, 250, 0]] as const) P.push(koi([x, y, 2.5], h, k));
  // lily pads and blossoms
  for (const [x, y, r] of [[-170, 90, 18], [-150, 120, 13], [-195, 60, 11], [120, 110, 16], [150, 90, 12]] as const) P.push(cylinderAt({ radius: r, height: 1.2, segments: 10, bottom: [x, y, 5.3] }, "LeafGreen"));
  P.push(ellipsoid([6, 6, 5], [-160, 100, 9], "Osaki_Lotus", 8), ellipsoid([5, 5, 4], [128, 106, 8], "Osaki_Lotus", 8));
  // irises on the bank
  P.push(iris([-250, -170, 0], 3), iris([-215, -205, 0], 9), iris([235, 175, 0], 5));
  // shishi-odoshi: a bamboo pipe tipping over a stone basin
  const sx = 240, sy = -150;
  P.push(translate(rock([70, 60, 40], 0.3, 88, "StoneGrey"), [sx, sy, 0]));
  for (const s of [-1, 1]) P.push(cylinderAt({ radius: 3.5, height: 60, segments: 7, bottom: [sx + 10, sy + s * 14, 0] }, "Bamboo"));
  P.push(cylinderBetween([sx - 45, sy, 42], [sx + 50, sy, 64], 5, 8, "Bamboo"));
  P.push(cylinderAt({ radius: 5, height: 110, segments: 8, bottom: [sx + 70, sy - 10, 0] }, "Bamboo"));
  P.push(cylinderBetween([sx + 70, sy - 10, 100], [sx + 40, sy - 5, 92], 3, 7, "Bamboo"));
  P.push(cylinderBetween([sx - 48, sy, 41], [sx - 40, sy, 30], 1.2, 4, "Osaki_Pond"));
  return merge(...P);
}

// ---- zen rock garden: a 4 x 4 m tile of raked gravel, mossy rocks ringed by ripples ----
function zenGarden(): Geo {
  const P: Geo[] = [];
  for (const s of [-1, 1]) P.push(bb([-200, s * 200, 0], [200, s * 182, 14], "StoneGrey", 2), bb([s * 200, -182, 0], [s * 182, 182, 14], "StoneGrey", 2));
  P.push(bb([-182, -182, 0], [182, 182, 6], "Osaki_Gravel"));
  const groups: [number, number, number, number][] = [[-80, -60, 46, 11], [90, 70, 38, 17], [70, -110, 24, 29]];
  for (const [x, y, r, seed] of groups) {
    P.push(cylinderAt({ radius: r + 46, height: 0.6, segments: 24, bottom: [x, y, 6] }, "Osaki_GravelPlain"));
    for (const k of [1, 2, 3]) P.push(translate(scale(torus(r + k * 14, 3.2, 20, 4, "Osaki_GravelPlain"), [1, 1, 0.55]), [x, y, 6.6]));
    P.push(translate(rock([r * 2.1, r * 1.8, r * 0.5], 0.3, seed + 1, "Osaki_Moss", true), [x, y, 3]));
    P.push(translate(rock([r * 1.6, r * 1.3, r * 1.6], 0.5, seed, "StoneGrey"), [x, y, 4]));
    P.push(translate(rock([r * 0.7, r * 0.6, r * 0.6], 0.5, seed + 5, "MossStone"), [x + r * 0.8, y - r * 0.5, 4]));
  }
  return merge(...P);
}

// ---- bamboo fence (kenninji-gaki), 4 m along Y, tiles end to end ----
function bambooFence(): Geo {
  const P: Geo[] = [];
  for (const y of [-200, 200]) P.push(cylinderAt({ radius: 8, height: 196, segments: 10, bottom: [0, y, 0] }, "WoodDark"), cylinderAt({ rBot: 9, rTop: 4, height: 8, segments: 10, bottom: [0, y, 196] }, "WoodDark"));
  const n = 60;
  for (let i = 0; i < n; i++) {
    const y0 = -192 + (384 * i) / n;
    P.push(bb([-2, y0 + 0.4, 6], [2, y0 + 384 / n - 0.4, 178], i % 3 === 1 ? "BambooDry" : "Bamboo"));
  }
  for (const z of [40, 100, 156])
    for (const s of [-1, 1]) {
      P.push(cylinderBetween([s * 5, -196, z], [s * 5, 196, z], 3.6, 7, "BambooDry"));
      for (let y = -170; y <= 170; y += 68) P.push(boxAt([12, 4, 9], [0, y, z - 4.5], "LacquerBlack"));
    }
  P.push(cylinderBetween([0, -198, 182], [0, 198, 182], 6, 8, "BambooDry"), bb([-6, -198, 176], [6, 198, 180], "Bamboo"));
  return merge(...P);
}

// ---- stone-based plaster wall with a kawara cap (tsuiji-bei), 6 m along Y, tiles end to end ----
function stoneWall(): Geo {
  const P: Geo[] = [];
  P.push(bb([-38, -300, 0], [38, 300, 64], "MossStone", 2));
  P.push(bb([-40, -300, 58], [40, 300, 66], "StoneGrey"));
  P.push(bb([-24, -300, 66], [24, 300, 226], "Osaki_Shikkui"));
  P.push(bb([-27, -300, 196], [27, 300, 210], "WoodDark"));
  for (const y of [-150, 150]) P.push(bb([-27, y - 8, 66], [27, y + 8, 196], "WoodDark"));
  P.push(bb([-34, -300, 210], [34, 300, 234], "WoodDark"));
  P.push(rotateZ(roof({ kind: "gable", hx: 300, hy: 62, z: 232, h: 34, th: 10, curve: 1.05, ends: false, oni: false, nt: 3, ns: 4 }), 90));
  return merge(...P);
}

// ---- harbour ----
// Wooden pier, 4 m along Y, 3 m wide, deck 46 cm up, piles into the water; joins end to end.
function pier(): Geo {
  const P: Geo[] = [];
  const n = 15, w = 400 / n;
  for (let i = 0; i < n; i++) P.push(bb([-150, -200 + i * w + 1, 39], [150, -200 + (i + 1) * w - 1, 46], i % 3 === 1 ? "Osaki_DockLight" : "WoodGrey", 1));
  for (const x of [-120, 0, 120]) P.push(bb([x - 8, -200, 20], [x + 8, 200, 39], "WoodDark"));
  for (const y of [-140, 140]) {
    P.push(bb([-166, y - 9, 2], [166, y + 9, 20], "WoodDark"));
    for (const x of [-160, 160]) {
      P.push(cylinderAt({ radius: 12, height: 302, segments: 10, bottom: [x, y, -230] }, "WoodGrey"));
      P.push(cylinderAt({ rBot: 12, rTop: 9, height: 6, segments: 10, bottom: [x, y, 72] }, "WoodGrey"));
      P.push(translate(torus(12.5, 2.4, 12, 4, "RopeTan"), [x, y, 58]));
    }
  }
  for (const s of [-1, 1]) P.push(bb([s * 144, -200, 46], [s * 152, 200, 52], "WoodDark"));
  // a coil of rope
  for (let k = 0; k < 3; k++) P.push(translate(torus(18 - k * 4, 3, 12, 4, "RopeTan"), [90, 120, 49 + k * 4]));
  return merge(...P);
}

// Stone quay wall (ishigaki), 4 m along Y; the face (at -X) drops into the sea.
function quay(): Geo {
  const P: Geo[] = [bb([-40, -200, -250], [70, 200, -6], "StoneDark")];
  const rnd = seeded(11);
  for (let r = 0; r < 6; r++) {
    const z1 = -6 - r * 40, z0 = z1 - 40, xf = -62 - r * 6;
    let y = -200 + (r % 2) * 30;
    if (r % 2) P.push(bb([xf, -199, z0 + 1.5], [xf + 44, -172, z1 - 1.5], "StoneGrey", 4));
    while (y < 199) {
      const w = Math.min(200 - y, 55 + rnd() * 60);
      if (w > 12) P.push(bb([xf, y + 1.5, z0 + 1.5], [xf + 44, y + w - 1.5, z1 - 1.5], rnd() < 0.5 ? "StoneGrey" : "MossStone", r < 2 ? 4 : 0));
      y += w;
    }
  }
  for (let i = 0; i < 4; i++) P.push(bb([-74, -200 + i * 100 + 1, -8], [60, -100 + i * 100 - 1, 12], "Osaki_StoneWarm", 3));
  P.push(cylinderAt({ rBot: 14, rTop: 11, height: 40, segments: 10, bottom: [-30, 0, 12] }, "IronDark"), cylinderAt({ rBot: 17, rTop: 12, height: 9, segments: 10, bottom: [-30, 0, 52] }, "IronDark"));
  return merge(...P);
}

// Boats: a hull lofted through cross-sections, bow at -X.
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
  return [x, Math.sign(a) * hb * Math.pow(Math.sin(t), 0.7), kz + (sz - kz) * Math.pow(1 - Math.cos(t), 1.15)];
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

// Sampan: a small rowing boat with a woven mat canopy and a sculling oar. Keel at z = 0; sits
// about 40 cm deep, so place it at z = -40 in the sea.
function sampan(): Geo {
  const h: Hull = {
    L: 580,
    half: (u) => (u < 0.45 ? 4 + 68 * Math.pow(Math.sin((Math.PI / 2) * (u / 0.45)), 0.8) : 72 * (1 - 0.32 * ((u - 0.45) / 0.55) ** 2)),
    keel: (u) => (u < 0.25 ? 42 * (1 - u / 0.25) ** 2 : u > 0.85 ? 10 * ((u - 0.85) / 0.15) : 0),
    sheer: (u) => 58 + (u < 0.3 ? 40 * (1 - u / 0.3) ** 2 : 0) + (u > 0.7 ? 16 * ((u - 0.7) / 0.3) ** 2 : 0),
  };
  const P: Geo[] = [hullGeo(h, "WoodShade", "WoodPale", "WoodDark")];
  const at = (u: number) => -h.L / 2 + u * h.L;
  for (const s of [-1, 1]) P.push(sweep(Array.from({ length: 13 }, (_, i) => { const u = i / 12; const p = hullPoint(h, u, s); return [p[0], p[1] + s * 2, p[2] - 4] as V3; }), 6, 9, "WoodDark"));
  P.push(bb([at(0.2), -40, 12], [at(0.9), 40, 16], "WoodPale"));
  for (const u of [0.3, 0.82]) P.push(bb([at(u) - 12, -h.half(u) + 6, h.sheer(u) - 18], [at(u) + 12, h.half(u) - 6, h.sheer(u) - 12], "WoodWarm"));
  // the canopy
  const x0 = at(0.42), x1 = at(0.68);
  const arc = (x: number) => Array.from({ length: 11 }, (_, j): V3 => { const t = -Math.PI / 2 + (Math.PI * j) / 10; return [x, 66 * Math.sin(t), 52 + 82 * Math.cos(t)]; });
  const rows = [arc(x0), arc((x0 + x1) / 2), arc(x1)];
  const uv = rows.map((r) => r.map((p, j): [number, number] => [j * 0.21, p[0] / 100]));
  P.push(surface(rows, uv, "BambooDry", (c) => [0, c[1], c[2] - 52]), surface(rows.map((r) => r.map((p) => add(p, [0, 0, -1.5]))), uv, "Osaki_Straw", (c) => [0, -c[1], 52 - c[2]]));
  for (const x of [x0, x1]) P.push(sweep(arc(x), 6, 5, "WoodDark"));
  // sculling oar over the stern and a straw hat
  P.push(cylinderBetween([at(1) + 150, 20, -30], [at(0.8), -26, 118], 3.4, 6, "WoodPale"), translate(rotateZ(box([60, 16, 3], [0, 0, 0], "WoodPale"), 10), [at(1) + 150, 20, -30]));
  P.push(cylinderAt({ rBot: 28, rTop: 2, height: 14, segments: 12, bottom: [at(0.3), 10, h.sheer(0.3) - 12] }, "BambooDry"));
  P.push(boxAt([36, 36, 30], [at(0.2), 0, 16], "WoodWarm", 1.5));
  return merge(...P);
}

// A small sailing ship (bezaisen-style): high stern, one big striped square sail. Keel at z = 0;
// place it at z = -70 in the sea.
function junk(): Geo {
  const h: Hull = {
    L: 1000,
    half: (u) => (u < 0.4 ? 6 + 144 * Math.pow(Math.sin((Math.PI / 2) * (u / 0.4)), 0.75) : 150 * (1 - 0.28 * Math.max(0, (u - 0.6) / 0.4) ** 2)),
    keel: (u) => (u < 0.22 ? 70 * (1 - u / 0.22) ** 2 : u > 0.88 ? 26 * ((u - 0.88) / 0.12) : 0),
    sheer: (u) => 150 + (u < 0.3 ? 90 * (1 - u / 0.3) ** 2 : 0) + (u > 0.65 ? 100 * ((u - 0.65) / 0.35) ** 2 : 0),
  };
  const P: Geo[] = [hullGeo(h, "WoodShade", "WoodWarm", "WoodDark", 20, 12)];
  const at = (u: number) => -h.L / 2 + u * h.L;
  for (const s of [-1, 1]) {
    for (const dz of [-8, -46]) P.push(sweep(Array.from({ length: 17 }, (_, i) => { const p = hullPoint(h, i / 16, s); return [p[0], p[1] + s * 3, p[2] + dz] as V3; }), 8, 12, "WoodDark"));
  }
  // deck
  const zd = 118;
  const us = Array.from({ length: 15 }, (_, i) => 0.08 + (0.88 * i) / 14);
  const deckW = (u: number) => {
    const kz = h.keel(u) + 5, sz = h.sheer(u), f = Math.max(0, Math.min(1, (zd - kz) / (sz - kz)));
    const t = Math.acos(1 - Math.pow(f, 1 / 1.15));
    return (h.half(u) - 5) * Math.pow(Math.sin(t), 0.7);
  };
  const deck = us.map((u) => [[at(u), -deckW(u), zd], [at(u), deckW(u), zd]] as V3[]);
  P.push(surface(deck, deck.map((r) => r.map((p): [number, number] => [p[1] / 100, p[0] / 100])), "WoodPale", UP));
  // the stern house
  const sx0 = at(0.72), sx1 = at(0.93);
  P.push(bb([sx0, -110, zd], [sx1, 110, zd + 120], "WoodWarm", 2));
  for (const s of [-1, 1]) P.push(shoji(0, -60, 60, 0, 70).map((p) => ({ geo: p.geo.clone().rotateZ((-s * Math.PI) / 2).translate((sx0 + sx1) / 2, s * 112, zd + 30), mat: p.mat })));
  P.push(shoji(sx0 - 2, -50, 50, zd + 10, zd + 100, "WoodDark"));
  P.push(roof({ kind: "gable", hx: (sx1 - sx0) / 2 + 30, hy: 135, z: zd + 126, h: 60, th: 10, curve: 1.1, gableInset: 30, gableBase: zd + 120, gableMat: "WoodWarm", nt: 3, ns: 4 }).map((p) => ({ geo: p.geo.clone().translate((sx0 + sx1) / 2, 0, 0), mat: p.mat })));
  // rudder
  P.push(bb([at(1) + 4, -6, 10], [at(1) + 70, 6, 200], "WoodDark", 1.5), cylinderBetween([at(1) - 20, 0, 300], [at(1) + 30, 0, 200], 5, 6, "WoodDark"));
  // bow stem
  P.push(sweep([[at(0) + 20, 0, 70], [at(0) - 10, 0, 160], [at(0) - 40, 0, 250], [at(0) - 52, 0, 290]], 12, 16, "WoodDark"));
  // mast, yards and the sail
  const mx = at(0.45);
  P.push(cylinderAt({ rBot: 13, rTop: 9, height: 860, segments: 10, bottom: [mx, 0, zd] }, "WoodWarm"));
  for (const z of [920, 330]) P.push(cylinderBetween([mx - 16, -300, z], [mx - 16, 300, z], 6, 8, "WoodDark"));
  const W = 560, zb = 340, H = 570, strips = 14;
  for (let i = 0; i < strips; i++) {
    const ya = -W / 2 + (W * i) / strips, yb = ya + W / strips;
    const rowsS = Array.from({ length: 7 }, (_, r) => {
      const z = zb + (H * r) / 6;
      const bul = (y: number) => -24 - 46 * Math.cos((Math.PI * y) / W) * Math.sin((Math.PI * (z - zb)) / H);
      return [[mx + bul(ya), ya, z], [mx + bul(yb), yb, z]] as V3[];
    });
    const uv = rowsS.map((r) => r.map((p): [number, number] => [p[1] / 100, p[2] / 100]));
    const m = i % 2 ? "Osaki_Sail" : "FabricSand";
    P.push(surface(rowsS, uv, m, [-1, 0, 0]), surface(rowsS, uv, m, [1, 0, 0]));
  }
  // rigging
  const top: V3 = [mx, 0, zd + 860];
  P.push(cylinderBetween(top, [at(0) - 40, 0, 260], 1.4, 4, "RopeTan"), cylinderBetween(top, [at(0.95), 0, h.sheer(0.95)], 1.4, 4, "RopeTan"));
  for (const s of [-1, 1]) P.push(cylinderBetween([mx - 16, s * 290, 330], [at(0.6), s * 120, h.sheer(0.6)], 1.2, 4, "RopeTan"), cylinderBetween(top, [mx, s * 140, h.sheer(0.45)], 1.2, 4, "RopeTan"));
  // pennant and stern banners
  P.push(bb([mx - 1, 0, zd + 830], [mx + 1, 70, zd + 850], "FabricRed"));
  for (const s of [-1, 1]) {
    P.push(cylinderAt({ radius: 2.5, height: 230, segments: 6, bottom: [sx1 - 10, s * 95, zd + 120] }, "Bamboo"));
    P.push(bb([sx1 - 11, s * 95 + 3, zd + 220], [sx1 - 9, s * 95 + 40, zd + 340], s < 0 ? "FabricRed" : "FabricWhite"));
  }
  // cargo on deck
  for (const [x, y] of [[at(0.25), -40], [at(0.25), 40], [at(0.32), 0]] as const) P.push(boxAt([56, 56, 50], [x, y, zd], "WoodWarm", 2));
  P.push(cylinderAt({ radius: 30, height: 56, segments: 12, bottom: [at(0.58), -60, zd] }, "Osaki_Straw"), cylinderAt({ radius: 30, height: 56, segments: 12, bottom: [at(0.58), 50, zd] }, "Osaki_Straw"));
  return merge(...P);
}

// ---- sake barrels (komodaru) on a stepped rack ----
function sakeBarrels(): Geo {
  const P: Geo[] = [];
  const labels = ["FabricRed", "FabricNavy", "FabricWhite", "FabricGold"];
  const tiers: [number, number, number][] = [[-70, 0, 4], [0, 50, 4], [70, 100, 3]];
  P.push(bb([-110, -170, 0], [-30, 170, 6], "WoodDark"), bb([-40, -170, 0], [40, 170, 56], "WoodDark", 2), bb([30, -170, 0], [110, 170, 106], "WoodDark", 2));
  let n = 0;
  for (const [x, z, count] of tiers)
    for (let i = 0; i < count; i++) {
      const y = (i - (count - 1) / 2) * 76, b: V3 = [x, y, z + 6];
      P.push(cylinderAt({ radius: 33, height: 60, segments: 12, bottom: b }, "Osaki_Straw"));
      P.push(cylinderAt({ radius: 28, height: 4, segments: 12, bottom: add(b, [0, 0, 59]) }, "WoodPale"));
      for (const dz of [8, 50]) P.push(cylinderAt({ radius: 34, height: 3, segments: 12, bottom: add(b, [0, 0, dz]) }, "RopeTan"));
      const lab = labels[n++ % 4];
      P.push(bb([x - 34, y - 19, z + 18], [x - 30, y + 19, z + 52], lab));
      const ink = lab === "FabricWhite" || lab === "FabricGold" ? "LacquerBlack" : "FabricWhite";
      P.push(bb([x - 35, y - 3, z + 22], [x - 34, y + 3, z + 48], ink), bb([x - 35, y - 11, z + 40], [x - 34, y + 11, z + 44], ink), bb([x - 35, y - 9, z + 28], [x - 34, y + 9, z + 31], ink));
    }
  return merge(...P);
}

// ---- a well with a little kawara roof, pulley and buckets ----
function well(): Geo {
  const P: Geo[] = [];
  P.push(lathe([[48, 0], [62, 0], [62, 62], [48, 62], [48, 10]], 16, "StoneGrey"));
  P.push(cylinderAt({ radius: 49, height: 2, segments: 16, bottom: [0, 0, 40] }, "WaterDark"));
  for (const s of [-1, 1]) {
    P.push(bb([-80, s * 52 - 7, 62], [80, s * 52 + 7, 76], "WoodDark"));
    P.push(bb([s * 52 - 7, -80, 76], [s * 52 + 7, 80, 90], "WoodDark"));
    P.push(boxAt([14, 14, 260], [0, s * 80, 0], "WoodDark", 1.5), boxAt([30, 30, 12], [0, s * 80, 0], "StoneGrey", 2));
  }
  P.push(bb([-8, -96, 248], [8, 96, 262], "WoodDark"));
  P.push(rotateZ(roof({ kind: "gable", hx: 118, hy: 96, z: 250, h: 48, th: 9, curve: 1.15, gableInset: 0, gableBase: 300, nt: 3, ns: 4 }), 90));
  // pulley, rope, buckets
  P.push(translate(rotateX(cylinderAt({ radius: 12, height: 6, segments: 12, bottom: [0, 0, -3] }, "WoodWarm"), 90), [0, 0, 230]));
  P.push(cylinderBetween([0, 0, 248], [0, 0, 232], 1.5, 4, "IronDark"));
  P.push(cylinderBetween([-12, 0, 230], [-12, 0, 132], 1, 4, "RopeTan"), cylinderBetween([12, 0, 230], [60, 50, 95], 1, 4, "RopeTan"));
  const bucket = (b: V3) => merge(cylinderAt({ rBot: 13, rTop: 16, height: 26, segments: 10, bottom: b }, "WoodWarm"), cylinderAt({ radius: 16.5, height: 3, segments: 10, bottom: add(b, [0, 0, 20]) }, "IronDark"), cylinderAt({ radius: 14, height: 3, segments: 10, bottom: add(b, [0, 0, 4]) }, "IronDark"));
  P.push(bucket([-12, 0, 106]), bucket([60, 50, 90]));
  return merge(...P);
}

// ---- lantern post: a wooden post with a hanging red paper lantern ----
function lanternPost(): Geo {
  const P: Geo[] = [];
  P.push(boxAt([40, 40, 16], [0, 0, 0], "StoneGrey", 3), boxAt([16, 16, 300], [0, 0, 16], "WoodDark", 2), boxAt([24, 24, 8], [0, 0, 312], "WoodDark", 2));
  P.push(sweep([[0, 0, 290], [-30, 0, 296], [-60, 0, 297], [-82, 0, 292]], 8, 9, "WoodDark"));
  P.push(beamBetween([-4, 0, 256], [-42, 0, 292], 6, 6, "WoodDark"));
  P.push(chochin(21, [-76, 0, 288]));
  // a small sign board on the post
  P.push(boxAt([4, 22, 60], [-10, 0, 150], "WoodPale", 1), bb([-12.5, -3, 160], [-12, 3, 200], "LacquerBlack"), bb([-12.5, -8, 186], [-12, 8, 190], "LacquerBlack"));
  return merge(...P);
}

// ---- ground ----
// Stepping-stone path, 4 x 4 m: a gravel strip along X with flat stones and mossy edges.
function steppingStones(): Geo {
  const P: Geo[] = [bb([-200, -80, 0], [200, 80, 3], "Osaki_GravelPlain")];
  const rnd = seeded(31);
  for (let i = 0; i < 5; i++) {
    const x = -160 + i * 80, y = (i % 2 ? 1 : -1) * 18;
    P.push(translate(rock([62, 48, 14], 0.25, 40 + i, "StoneGrey", true), [x, y, 0]));
  }
  for (let i = 0; i < 9; i++) for (const s of [-1, 1]) P.push(translate(rock([30 + rnd() * 20, 24 + rnd() * 14, 14 + rnd() * 10], 0.45, 70 + i * 2 + (s > 0 ? 1 : 0), rnd() < 0.5 ? "MossStone" : "StoneGrey"), [-180 + i * 45, s * (86 + rnd() * 8), -2]));
  for (const [x, y] of [[-120, 140], [70, -150], [160, 130], [-40, -140]] as const) P.push(translate(rock([90, 60, 18], 0.3, 90 + Math.abs(x), "Osaki_Moss", true), [x, y, -3]));
  return merge(...P);
}

// Stone plaza tile (ishidatami), 4 x 4 m: slabs in a running bond over dark joints.
function plazaTile(): Geo {
  const P: Geo[] = [bb([-200, -200, 0], [200, 200, 3], "StoneDark")];
  const rnd = seeded(17);
  const mats = ["StoneGrey", "StoneLight", "Osaki_StoneWarm", "StoneGrey"];
  for (let r = 0; r < 8; r++) {
    const x0 = -200 + r * 50;
    let y = -200 - (r % 2 ? 50 : 0);
    while (y < 200) {
      const a = Math.max(y, -200), b = Math.min(y + 100, 200);
      if (b - a > 10) P.push(bb([x0 + 1.5, a + 1.5, 3], [x0 + 48.5, b - 1.5, 5 + rnd() * 0.8], mats[Math.floor(rnd() * 4)]));
      y += 100;
    }
  }
  return merge(...P);
}

// ---- the island's edge ----
// Rocky shore: boulders at the water's edge, 4 m along Y; the sea at -X, the land at +X. Set it
// on the coastline at z = 0: the big rocks stand half in the water, pebbles run up the bank.
function shoreRocks(): Geo {
  const P: Geo[] = [];
  const rnd = seeded(73);
  for (let i = 0; i < 5; i++) {
    const y = -168 + i * 84 + (rnd() - 0.5) * 30, s = 80 + rnd() * 75;
    P.push(translate(rock([s, s * (0.75 + rnd() * 0.25), s * (0.5 + rnd() * 0.35)], 0.5, 300 + i * 7, rnd() < 0.35 ? "MossStone" : "StoneGrey"), [-30 + (rnd() - 0.5) * 50, y, -30]));
  }
  for (let i = 0; i < 5; i++) {
    const y = -180 + i * 90 + rnd() * 20, s = 36 + rnd() * 30;
    P.push(translate(rock([s, s * 0.8, s * 0.6], 0.45, 340 + i * 5, "StoneDark"), [-120 - rnd() * 50, y, -24]));
  }
  for (let i = 0; i < 7; i++) {
    const y = -185 + i * 60 + rnd() * 15, s = 18 + rnd() * 18;
    P.push(translate(rock([s, s * 0.8, s * 0.5], 0.4, 380 + i * 3, rnd() < 0.5 ? "MossStone" : "StoneGrey", true), [50 + rnd() * 50, y, -3]));
  }
  return merge(...P);
}

// Sandy beach: a strip of sand sloping into the sea, 6 m along Y; the sea at -X. Set it on the
// coastline at z = 0: dry sand over the grass's edge, wet sand at the water line, the rest
// under the shallows. The land-side edge waves, and matches end to end.
function beach(): Geo {
  const P: Geo[] = [];
  const ny = 24;
  const edge = (y: number) => 150 + 22 * Math.sin((2 * Math.PI * y) / 300) + 10 * Math.sin((2 * Math.PI * y) / 150 + 1);
  const prof: [number, number][] = [[-170, -38], [-100, -11.5], [-40, 1.2]];
  const ys = Array.from({ length: ny + 1 }, (_, j) => -300 + (600 * j) / ny);
  const rows: V3[][] = prof.map(([x, z]) => ys.map((y): V3 => [x, y, z]));
  rows.push(ys.map((y): V3 => [edge(y) * 0.45, y, 2.5]), ys.map((y): V3 => [edge(y), y, 2]));
  const uv = (r: V3[][]) => r.map((row) => row.map((p): [number, number] => [p[1] / 100, p[0] / 100]));
  P.push(surface(rows, uv(rows), "Osaki_Sand", UP));
  // the wet band at the water's edge
  const wet = [ys.map((y): V3 => [-98, y, -10.7]), ys.map((y): V3 => [-55, y, -1.6])];
  P.push(surface(wet, uv(wet), "Osaki_SandWet", UP));
  // pebbles, a shell or two and a piece of driftwood
  const rnd = seeded(91);
  for (let i = 0; i < 7; i++) P.push(translate(rock([14 + rnd() * 16, 12 + rnd() * 10, 8 + rnd() * 6], 0.4, 400 + i, rnd() < 0.5 ? "StoneGrey" : "StoneDark", true), [-40 + rnd() * 160, -280 + i * 85 + rnd() * 30, 0]));
  P.push(cylinderBetween([40, -120, 6], [92, -40, 9], 6, 7, "WoodGrey", 4.5), cylinderBetween([70, -82, 7], [98, -96, 9], 2.5, 5, "WoodGrey"));
  for (const [x, y] of [[20, 160], [-10, 60]] as const) P.push(ellipsoid([5, 4, 2], [x, y, 2], "FabricSand", 6));
  return merge(...P);
}

// ---- a roofed gate (yakui-mon) for a stone wall: two great posts and two back posts under a
// gable kawara roof, the doors swung back, plaster wings to meet the wall. 6 m across (Y), the
// way through along X with 3.2 m clear between the posts ----
function monGate(): Geo {
  const P: Geo[] = [];
  const D = "WoodDark", K = "LacquerBlack";
  const py = 180, zt = 400, bx = 130;
  P.push(bb([-60, -py - 20, 0], [bx + 40, py + 20, 5], "StoneGrey", 2));
  for (const s of [-1, 1]) {
    P.push(boxAt([58, 58, 18], [0, s * py, 0], "StoneGrey", 3), boxAt([38, 38, 16], [bx, s * py, 0], "StoneGrey", 3));
    P.push(boxAt([34, 34, zt - 18], [0, s * py, 18], D, 2));
    P.push(boxAt([24, 24, zt - 76], [bx, s * py, 16], D, 2));
    P.push(bb([0, s * py - 9, zt - 120], [bx, s * py + 9, zt - 100], D));
    P.push(bb([0, s * py - 9, 40], [bx, s * py + 9, 54], D));
    // iron caps on the post feet
    P.push(bb([-19, s * py - 19, 18], [19, s * py + 19, 34], "IronDark"));
    // a door leaf swung back against the side, hinged at the great post
    const dy = s * (py - 22);
    P.push(bb([20, dy - 4, 24], [20 + 150, dy + 4, 318], "DoorWood", 1));
    for (const z of [70, 170, 270]) P.push(bb([20, dy - s * 6, z], [170, dy - s * 4, z + 10], "IronDark"));
    for (const z of [62, 162, 262]) for (let k = 0; k < 5; k++) P.push(sphereCenter(3, [34 + k * 30, dy - s * 7, z + 23], "IronDark", 5));
    // a plaster wing on a stone base, capped with tiles, to meet the wall
    const y0 = s * (py + 20), y1 = s * 300;
    P.push(bb([-38, y0, 0], [38, y1, 64], "MossStone", 2), bb([-40, y0, 58], [40, y1, 66], "StoneGrey"));
    P.push(bb([-24, y0, 66], [24, y1, 226], "Osaki_Shikkui"), bb([-27, y0, 196], [27, y1, 210], D), bb([-34, y0, 210], [34, y1, 234], D));
    P.push(translate(rotateZ(roof({ kind: "gable", hx: Math.abs(y1 - y0) / 2, hy: 62, z: 232, h: 34, th: 10, curve: 1.05, ends: false, oni: false, nt: 3, ns: 3 }), 90), [0, (y0 + y1) / 2, 0]));
  }
  // the tie beam through the great posts, the head beam, the back lintel
  P.push(bb([-14, -py - 34, zt - 160], [14, py + 34, zt - 128], D, 2));
  P.push(bb([-20, -py - 26, zt - 28], [20, py + 26, zt], D, 2));
  P.push(bb([bx - 16, -py - 16, zt - 96], [bx + 16, py + 16, zt - 76], D));
  // beams from front to back carrying the roof, with pale ends
  for (const s of [-1, 0, 1]) {
    P.push(bb([-60, s * py - 11, zt], [bx + 60, s * py + 11, zt + 24], D, 2));
    for (const x of [-60, bx + 60]) P.push(bb([x - 1, s * py - 11, zt], [x + 1, s * py + 11, zt + 24], "Osaki_Shikkui"));
  }
  // the name plaque under the head beam
  P.push(boxAt([8, 96, 64], [-22, 0, zt - 120], K, 2), boxAt([3, 80, 52], [-27, 0, zt - 114], "GoldTrim"), boxAt([2, 70, 44], [-28, 0, zt - 110], K));
  for (const [z, w] of [[zt - 80, 30], [zt - 92, 8], [zt - 104, 34]] as const) P.push(bb([-30, -w / 2, z], [-29, w / 2, z + 6], "GoldTrim"));
  // the roof: gable, ridge along Y
  P.push(translate(rotateZ(roof({ kind: "gable", hx: py + 150, hy: 170, z: zt + 34, h: 125, th: 18, curve: 1.15, gableInset: 26, gableBase: zt + 24, gableMat: "WoodDark", nt: 5, ns: 6, oni: "Osaki_Ridge" }), 90), [bx / 2, 0, 0]));
  return translate(merge(...P), [-bx / 2, 0, 0]); // centre the footprint
}

// ---- yatai: a street stall on two wheels with a little roof, noren and red lanterns; the
// counter faces -X, two stools before it ----
function yatai(): Geo {
  const P: Geo[] = [];
  const D = "WoodDark", W = "WoodWarm";
  P.push(bb([-48, -110, 34], [48, 110, 104], W, 2), bb([-50, -112, 30], [50, 112, 40], D));
  P.push(bb([-66, -118, 104], [54, 118, 110], "WoodPale", 1));
  for (let k = 0; k < 4; k++) P.push(bb([-50, -100 + k * 52, 44], [-48, -56 + k * 52, 96], "WoodPale"));
  for (const s of [-1, 1]) {
    P.push(translate(rotateX(torus(32, 4, 16, 5, D), 90), [10, s * 124, 34]));
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI;
      P.push(cylinderBetween([10 + Math.cos(a) * 30, s * 124, 34 + Math.sin(a) * 30], [10 - Math.cos(a) * 30, s * 124, 34 - Math.sin(a) * 30], 1.8, 4, D));
    }
    P.push(cylinderBetween([10, s * 112, 34], [10, s * 132, 34], 6, 8, "IronDark"));
    for (const x of [-44, 44]) P.push(boxAt([8, 8, 136], [x, s * 106, 110], D));
    // the shafts to push it by
    P.push(cylinderBetween([48, s * 90, 92], [150, s * 90, 70], 3.5, 6, W));
  }
  P.push(cylinderBetween([150, -96, 70], [150, 96, 70], 3.5, 6, W));
  // roof: a little gable, ridge along Y
  P.push(rotateZ(roof({ kind: "gable", hx: 150, hy: 92, z: 238, h: 44, th: 8, curve: 1.1, gableInset: 8, gableBase: 246, gableMat: "WoodWarm", nt: 3, ns: 4 }), 90));
  P.push(bb([-50, -112, 236], [50, 112, 246], D));
  P.push(noren(-56, -106, 106, 236, 44, "FabricNavy"));
  P.push(chochin(14, [-62, -116, 236]), chochin(14, [-62, 116, 236]));
  // on the counter: a pot on a burner, bowls, a sake bottle; a stool or two in front
  P.push(cylinderAt({ radius: 22, height: 20, segments: 12, bottom: [10, 50, 110] }, "IronDark"), cylinderAt({ radius: 23, height: 3, segments: 12, bottom: [10, 50, 130] }, "WoodPale"));
  for (const y of [-80, -46, -12]) P.push(cylinderAt({ rBot: 7, rTop: 11, height: 8, segments: 10, bottom: [-46, y, 110] }, y === -46 ? "LacquerRed" : "PlasterCream"));
  P.push(lathe([[0, 0], [7, 1], [8, 14], [3, 22], [3, 28], [0, 28]], 8, "PlasterCream", [-20, 80, 110]));
  for (const y of [-60, 50]) P.push(cylinderAt({ radius: 17, height: 44, segments: 10, bottom: [-120, y, 0] }, "WoodShade"), cylinderAt({ radius: 18, height: 4, segments: 10, bottom: [-120, y, 44] }, "FeltRed"));
  return merge(...P);
}

// ---- a rice paddy, 6 x 6 m: an earth bund round a flooded field of young rice in rows ----
function ricePaddy(): Geo {
  const P: Geo[] = [];
  const H = 300, b = 34;
  for (const s of [-1, 1]) {
    P.push(bb([-H, s * H, 0], [H, s * (H - b), 16], "Osaki_Earth", 3));
    P.push(bb([s * H, -H + b, 0], [s * (H - b), H - b, 16], "Osaki_Earth", 3));
  }
  P.push(bb([-H + b, -H + b, 0], [H - b, H - b, 4], "Osaki_Earth"), bb([-H + b, -H + b, 4], [H - b, H - b, 8], "Osaki_Paddy"));
  const tuft = (x: number, y: number, seed: number) => {
    const r = seeded(seed), G: Geo[] = [];
    for (let k = 0; k < 4; k++) G.push(rotateZ(rotateY(boxAt([2, 5, 34 + r() * 14], [0, 0, 0], "Osaki_Rice"), 10 + r() * 14), k * 90 + r() * 40));
    return translate(merge(...G), [x, y, 4]);
  };
  const n = 9, step = (2 * (H - b) - 40) / (n - 1);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) P.push(tuft(-H + b + 20 + i * step, -H + b + 20 + j * step, i * 13 + j * 7 + 1));
  return merge(...P);
}

// ---- the kit ----
function sample(put: Put): void {
  // the harbour along the -Y edge: a stone quay, a pier, boats
  for (let x = -2000; x <= 2000; x += 400) put("quay", [x, -2160, 0], 90);
  for (const y of [-2430, -2830, -3230]) put("pier", [-1300, y, -28], 0);
  put("sampan", [-1720, -2760, -40], 95);
  put("sampan", [-880, -2960, -40], 80);
  put("junk", [500, -2900, -70], 90);
  put("lantern_post", [-1560, -2100, 0], 180);
  put("lantern_post", [-1040, -2100, 0], 0);
  // cargo on the quay
  put("sake_barrels", [-150, -1940, 0], 0);
  put("sake_barrels", [-1900, -1300, 0], 0);
  for (const [x, y, z, h] of [[300, -1980, 0, 10], [370, -1920, 0, -12], [330, -1960, 60, 30], [-1800, -1900, 0, 5]] as const) put("common:crate", [x, y, z], h);
  put("common:bench", [-600, -1980, 0], 90);
  // the approach: landing, torii, lantern-lined path up to the seaside shrine
  put("plaza_tile", [-1300, -1900, 0]);
  for (let x = -1300; x <= 700; x += 400) put("plaza_tile", [x, -1500, 0]);
  put("torii", [-950, -1500, 0], 0);
  for (const x of [-650, -50, 550]) for (const y of [-1785, -1215]) if (!(x > 0 && y > -1300)) put("stone_lantern", [x, y, 0], 0);
  put("shrine_hall", [1430, -1450, 0], 0);
  // the cross street: a shop, two machiya and the tea house facing it
  for (let y = -1100; y <= 2100; y += 400) put("plaza_tile", [-500, y, 0]);
  put("shop", [230, -700, 0], 0);
  put("machiya", [250, 150, 0], 0);
  put("machiya", [250, 920, 0], 0);
  put("tea_house", [100, 1800, 0], 0);
  for (const y of [-500, 700, 1500]) put("lantern_post", [-740, y, 0], 180);
  // the pagoda behind its precinct wall
  put("pagoda", [1500, 450, 0], 0);
  for (const y of [-150, 1050]) put("stone_wall", [800, y, 0], 0);
  for (const y of [180, 720]) put("stone_lantern", [860, y, 0], 0);
  // the garden in front: koi pond, red bridge, zen garden; a farmhouse at the edge
  put("koi_pond", [-1500, -300, 0], 90);
  put("taiko_bridge", [-1500, 400, 0], 0);
  put("stepping_stones", [-860, 400, 0], 0);
  for (const y of [-650, -250]) put("zen_garden", [-1050, y, 0], 0);
  for (let y = -700; y <= 900; y += 400) put("bamboo_fence", [-2050, y, 0], 0);
  put("farmhouse", [-1450, 1650, 0], 0);
  put("well", [-1000, 1050, 0], 0);
  put("stone_lantern", [-1150, 100, 0], 30);
  put("stone_lantern", [-1950, 400, 0], 0);
  // trees
  for (const [x, y, s] of [[-1350, -700, 0.9], [-1850, -650, 1.1], [-950, 1450, 0.9], [-2000, 1000, 1], [1000, 1650, 1], [-250, -1150, 0.8], [2050, 1350, 1]] as const) put("flora:Cherry", [x, y, 0], x, s);
  for (const [x, y, s] of [[-2050, -1900, 1], [2050, -400, 1.1], [1150, 1900, 0.9]] as const) put("flora:Pine", [x, y, 0], 0, s);
  for (const [x, y] of [[-1700, 900], [1800, 1800], [-1950, -1450]] as const) put("flora:AutumnTree", [x, y, 0], 0, 0.9);
  for (const [x, y, s] of [[1450, 2000, 1], [1750, 1500, 1.1], [2050, 2050, 0.9], [2100, 900, 1]] as const) put("flora:Bamboo", [x, y, 0], x, s);
  put("flora:PineSmall", [-2050, -1200, 0], 0);
}

export const KIT: Kit = {
  id: "osaki",
  name: "โอซากิ",
  region: "เกาะห่างไกลทางตะวันออก ต้องนั่งเรือมาเท่านั้น",
  desc: "เมืองเกาะแบบญี่ปุ่น หลังคากระเบื้องเทาปลายงอน เสาแดงชาด ประตูกระดาษโชจิ ซากุระ เจดีย์ห้าชั้น และท่าเรือที่ทุกคนมาถึง",
  ground: "moss",
  sea: true,
  items: [
    { id: "pagoda", name: "เจดีย์ห้าชั้น", make: pagoda, tags: ["landmark", "building", "tower"] },
    { id: "shrine_hall", name: "ศาลเจ้า", make: shrineHall, tags: ["building", "landmark", "magic"] },
    { id: "machiya", name: "บ้านมาจิยะ", make: machiya, tags: ["building"] },
    { id: "shop", name: "ร้านค้าม่านโนเรน", make: shop, tags: ["building", "market"] },
    { id: "tea_house", name: "โรงน้ำชา", make: teaHouse, tags: ["building", "market"] },
    { id: "farmhouse", name: "บ้านชาวนาหลังคาฟาง", make: farmhouse, tags: ["building"] },
    { id: "torii", name: "โทริอิ", make: torii, tags: ["gate", "landmark"] },
    { id: "stone_wall", name: "กำแพงหินหลังคากระเบื้อง (6 ม.)", make: stoneWall, tags: ["wall", "defence"] },
    { id: "bamboo_fence", name: "รั้วไม้ไผ่ (4 ม.)", make: bambooFence, tags: ["wall", "decor"] },
    { id: "taiko_bridge", name: "สะพานโค้งแดง", make: taikoBridge, tags: ["landmark", "decor"] },
    { id: "koi_pond", name: "บ่อปลาคาร์ป", make: koiPond, tags: ["decor"] },
    { id: "zen_garden", name: "สวนหินเซน", make: zenGarden, tags: ["ground", "decor"] },
    { id: "stone_lantern", name: "โคมหิน", make: stoneLantern, tags: ["light", "decor"] },
    { id: "lantern_post", name: "เสาโคมกระดาษ", make: lanternPost, tags: ["light"] },
    { id: "pier", name: "ท่าเรือไม้ (4 ม.)", make: pier, tags: ["dock"] },
    { id: "quay", name: "ตลิ่งหินท่าเรือ (4 ม.)", make: quay, tags: ["dock", "wall"] },
    { id: "sampan", name: "เรือแจว", make: sampan, tags: ["boat"] },
    { id: "junk", name: "เรือใบสินค้า", make: junk, tags: ["boat"] },
    { id: "sake_barrels", name: "กองถังสาเก", make: sakeBarrels, tags: ["market", "decor"] },
    { id: "well", name: "บ่อน้ำมีหลังคา", make: well, tags: ["decor"] },
    { id: "stepping_stones", name: "ทางหินก้าว", make: steppingStones, tags: ["ground"] },
    { id: "plaza_tile", name: "ลานหินปู", make: plazaTile, tags: ["ground"] },
    { id: "shore_rocks", name: "โขดหินริมฝั่ง (4 ม.)", make: shoreRocks, tags: ["ground", "shore"] },
    { id: "beach", name: "หาดทราย (6 ม.)", make: beach, tags: ["ground", "shore"] },
    { id: "mon_gate", name: "ประตูหลังคากระเบื้อง", make: monGate, tags: ["gate", "landmark"] },
    { id: "yatai", name: "แผงลอยยาไต", make: yatai, tags: ["market"] },
    { id: "rice_paddy", name: "นาข้าว (6 ม.)", make: ricePaddy, tags: ["ground", "farm"] },
  ],
  sample,
};

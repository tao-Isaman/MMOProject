// ทรายริมทะเลและหุบผาน้ำตก (southsands): the kit of the three fields round the great desert where
// it meets the sea and the jungle. On the inner sea's shore (เนินทรายริมทะเลใน): crescent dunes of
// red sand, flats of white salt crust in hexagons, the salt pans and the salt workers' heaps,
// a fisherman's driftwood hut on stilts, nets drying on their rack, a rowing boat drawn up and a
// two-masted trader broken on the sand, bleached ox skulls (the hermit crabs' shells), a spring
// in a ring of stones. On the glass cape (ทะเลทรายแก้ว), where lightning and a falling star fused
// the sand: spires of clear glass, shards, a tree of glass, the glowing meteorite and the rock it
// threw out of its crater, lightning tubes, plates of glass crust, scorched boulders. In the
// waterfall gorge (หุบผาน้ำตก): a two-tier waterfall off a 5 m cliff and the stream that feeds it,
// a rope bridge, rocks in the river, curtains of vines over the cliffs, the giant rafflesia, a
// carved stela and the stepped pyramid under its vines.
//
// Everything is built from code in centimetres, Z up; each item stands on z = 0, centred on its
// footprint, its front facing -X. Masonry, rock and sand get world-aligned texture coordinates;
// glass is flat-shaded so its facets catch the light.

import * as THREE from "three";
import { merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, beamBetween, cylinderBetween, cylinderAt, sphereCenter, torus, gableRoof, rock } from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import { coverTop } from "../nature";
import { limb, grow } from "../trees";
import type { Kit, Put } from "./types";

// ---- the kit's own colours ----
// the shore
defineMaterial("Southsands_RedSand", { map: "felt", tint: "#dca07a", rough: 1 });
defineMaterial("Southsands_RedSandDark", { map: "felt", tint: "#cc8d68", rough: 1 });
defineMaterial("Southsands_BeachSand", { map: "felt", tint: "#e8d3ad", rough: 1 });
defineMaterial("Southsands_WetSand", { map: "felt", tint: "#a98a66", rough: 0.6 });
defineMaterial("Southsands_Salt", { map: "snow", tint: "#f6f3ec", rough: 0.85 });
defineMaterial("Southsands_SaltRidge", { map: "snow", tint: "#ffffff", rough: 0.7 });
defineMaterial("Southsands_SaltDirty", { map: "felt", tint: "#e3d7c2", rough: 0.95 });
defineMaterial("Southsands_Brine", { tint: "#8fbdb6", rough: 0.08, opacity: 0.88 });
defineMaterial("Southsands_Bund", { map: "adobe", tint: "#b08e6a", bump: 1 });
defineMaterial("Southsands_Driftwood", { map: "wood", tint: "#b8ab98", bump: 1.5 });
defineMaterial("Southsands_DriftDark", { map: "wood", tint: "#7d6f5f", bump: 1.5 });
defineMaterial("Southsands_Thatch", { map: "thatch", tint: "#b99b5e", bump: 2 });
defineMaterial("Southsands_Hull", { map: "wood", tint: "#5c4632", bump: 1.5 });
defineMaterial("Southsands_HullPale", { map: "wood", tint: "#8f7a62", bump: 1.5 });
defineMaterial("Southsands_HullPaint", { map: "wood", tint: "#3f7a78", bump: 1.2 }); // faded teal wale
defineMaterial("Southsands_Sail", { map: "fabric", tint: "#e0d3b6", rough: 1 });
defineMaterial("Southsands_Net", { map: "fabric", tint: "#5f6650", rough: 1, opacity: 0.85 });
defineMaterial("Southsands_Float", { map: "plaster", tint: "#d0602e", rough: 0.6 });
defineMaterial("Southsands_Fish", { map: "metal", tint: "#b9c2c4", rough: 0.4, metal: 0.3 });
defineMaterial("Southsands_Bone", { map: "plaster", tint: "#efe7d4", rough: 0.8 });
defineMaterial("Southsands_Dark", { tint: "#1e1914", rough: 1 });
defineMaterial("Southsands_Spring", { tint: "#3f9a96", rough: 0.05, opacity: 0.88 });
defineMaterial("Southsands_Reed", { map: "felt", tint: "#8c9a4a", rough: 0.9 });
defineMaterial("Southsands_Wicker", { map: "thatch", tint: "#b48d55", bump: 1.5 });
defineMaterial("Southsands_Sack", { map: "fabric", tint: "#d8c6a0", rough: 1 });
defineMaterial("Southsands_SandRock", { map: "crag", tint: "#d6a070", bump: 3 });
defineMaterial("Southsands_Clay", { map: "plaster", tint: "#b86d40", rough: 0.85 });
// the glass cape
defineMaterial("Southsands_Glass", { tint: "#c4f0ea", rough: 0.04, metal: 0.15, opacity: 0.62, glow: "#7ad8d2", glowI: 0.2 });
defineMaterial("Southsands_GlassCore", { tint: "#6fd0d8", rough: 0.1, opacity: 0.8, glow: "#5fc8e0", glowI: 0.45 });
defineMaterial("Southsands_GlassGreen", { tint: "#8fc6a2", rough: 0.08, metal: 0.1, opacity: 0.78 });
defineMaterial("Southsands_GlassDark", { tint: "#26403c", rough: 0.12, metal: 0.2 });
defineMaterial("Southsands_GlassLeaf", { tint: "#b9f4ff", rough: 0.05, opacity: 0.7, glow: "#8fe8ff", glowI: 0.5 });
defineMaterial("Southsands_Fused", { map: "crag", tint: "#c4a77c", bump: 2 });
defineMaterial("Southsands_CliffGlass", { map: "crag", tint: "#a89f90", bump: 4 }); // the glass cape's cliffs (fused sand)
defineMaterial("Southsands_Meteor", { map: "crag", tint: "#3b302c", bump: 4 });
defineMaterial("Southsands_Scorch", { map: "crag", tint: "#4c423b", bump: 3 });
defineMaterial("Southsands_Molten", { tint: "#ff9a3c", glow: "#ff6a12", glowI: 1.6, rough: 0.5 });
defineMaterial("Southsands_Ember", { tint: "#ffcf7a", glow: "#ffae3a", glowI: 1.2, rough: 0.5 });
defineMaterial("Southsands_Smoke", { tint: "#7a706a", rough: 1, opacity: 0.24 });
// the gorge
defineMaterial("Southsands_Water", { tint: "#4f9fa6", rough: 0.05, opacity: 0.86 });
defineMaterial("Southsands_Foam", { tint: "#f2f8f6", rough: 0.6, opacity: 0.9 });
defineMaterial("Southsands_Mist", { tint: "#ffffff", rough: 1, opacity: 0.22 });
defineMaterial("Southsands_WetRock", { map: "crag", tint: "#6f6a5e", bump: 3 });
defineMaterial("Southsands_Moss", { map: "felt", tint: "#5b8a30", rough: 1 });
defineMaterial("Southsands_MossDark", { map: "felt", tint: "#3f6a26", rough: 1 });
defineMaterial("Southsands_Vine", { map: "bark", tint: "#58602e", bump: 1.5 });
defineMaterial("Southsands_VineLeaf", { map: "felt", tint: "#3f8a2e", rough: 0.6 });
defineMaterial("Southsands_Temple", { map: "stone", tint: "#a59f80", bump: 2.5 });
defineMaterial("Southsands_TempleDark", { map: "stone", tint: "#7f7a60", bump: 2.5 });
defineMaterial("Southsands_Carved", { map: "sandstone", tint: "#b8a578", bump: 2 });
defineMaterial("Southsands_Jade", { map: "plaster", tint: "#4f9a7c", rough: 0.5 });
defineMaterial("Southsands_Plank", { map: "wood", tint: "#8a6a46", bump: 1.2 });
defineMaterial("Southsands_Rope", { map: "fabric", tint: "#b39c6c", rough: 1 });
defineMaterial("Southsands_Petal", { map: "felt", tint: "#b8352a", rough: 0.7 });
defineMaterial("Southsands_PetalDeep", { map: "felt", tint: "#8a2420", rough: 0.7 });
defineMaterial("Southsands_Wart", { map: "plaster", tint: "#f1e3cc", rough: 0.8 });
defineMaterial("Southsands_FlowerCore", { tint: "#3a1612", rough: 1 });
defineMaterial("Southsands_Spore", { tint: "#b5e07a", glow: "#8fcf4a", glowI: 0.5, opacity: 0.35 });
defineMaterial("Southsands_Bud", { map: "felt", tint: "#6a3a2a", rough: 0.8 });

type P2 = [number, number];

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// ---- geometry helpers ----
// Texture coordinates in metres from the position, across each face's normal (masonry courses
// stay level, sand and salt tile evenly whatever their shape).
function worldUv(geo: THREE.BufferGeometry): void {
  const pos = geo.getAttribute("position"), nor = geo.getAttribute("normal");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const [u, v] = nz >= nx && nz >= ny ? [x, y] : nx >= ny ? [y, z] : [x, z];
    uv[i * 2] = u / 100;
    uv[i * 2 + 1] = v / 100;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}
function reuv(g: Geo): Geo {
  return g.map((p) => {
    const geo = p.geo.clone();
    if (!geo.getAttribute("normal")) geo.computeVertexNormals();
    worldUv(geo);
    return { geo, mat: p.mat };
  });
}
// Faceted: every triangle its own flat normal (glass and crystal).
function facet(g: Geo): Geo {
  return g.map((p) => {
    const geo = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    geo.computeVertexNormals();
    return { geo, mat: p.mat };
  });
}
const sbox = (size: V3, center: V3, mat: string, bevel = 0): Geo => reuv(box(size, center, mat, bevel));
const sboxAt = (size: V3, bottom: V3, mat: string, bevel = 0): Geo => reuv(boxAt(size, bottom, mat, bevel));
const geoOf = (geo: THREE.BufferGeometry, mat: string, uvWorld = true): Geo => {
  geo.computeVertexNormals();
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (uvWorld) worldUv(g);
  return [{ geo: g, mat }];
};

// A rock of geo.ts turned and moved.
const R = (size: V3, seed: number, at: V3, rot = 0, mat = "Southsands_WetRock", rough = 0.35, flat = false): Geo =>
  translate(rotateZ(reuv(rock(size, rough, seed, mat, flat)), rot), at);

// An irregular outline round the origin, rx by ry, n points.
function blob(rx: number, ry: number, seed: number, n = 24, wob = 0.14): P2[] {
  const rnd = seeded(seed), ph = rnd() * 6.28, ph2 = rnd() * 6.28;
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, k = 1 + wob * (0.6 * Math.sin(a * 3 + ph) + 0.4 * Math.sin(a * 5 + ph2)) + (rnd() - 0.5) * wob * 0.4;
    return [Math.cos(a) * rx * k, Math.sin(a) * ry * k] as P2;
  });
}
const inside = (poly: P2[], x: number, y: number): boolean => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
// An outline extruded from z0 to z1 (a flat plate: salt crust, glass, a pan's floor).
function slab(pts: P2[], z0: number, z1: number, mat: string, at: P2 = [0, 0]): Geo {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x + at[0], y + at[1])));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: z1 - z0, bevelEnabled: false, curveSegments: 1 });
  geo.translate(0, 0, z0);
  return geoOf(geo, mat);
}

// A drift of sand (or salt) rising h above `at`, rx by ry across where it meets the ground: a bell,
// its toe running out gently into the ground.
function cap(rx: number, ry: number, h: number, at: V3, mat: string, segs = 16, pow = 2): Geo {
  const prof: P2[] = [[1.08, -0.05]];
  for (let i = 8; i >= 0; i--) {
    const t = i / 8;
    prof.push([t, (1 - t * t) ** pow]);
  }
  const geo = new THREE.LatheGeometry(prof.map(([r, z]) => new THREE.Vector2(r, z)), segs);
  geo.rotateX(Math.PI / 2);
  geo.scale(rx, ry, h);
  geo.translate(...at);
  return geoOf(geo, mat);
}
// A cone of something heaped (salt), its slope a little concave, its top rounded.
function heap(r: number, h: number, at: V3, mat: string, seed: number): Geo {
  const rnd = seeded(seed), prof: P2[] = [[r * 1.05, -4]];
  for (let i = 8; i >= 0; i--) {
    const t = i / 8;
    prof.push([r * t, h * (1 - Math.pow(t, 0.8)) * (t < 0.15 ? 1 - (0.15 - t) * 0.8 : 1)]);
  }
  const geo = new THREE.LatheGeometry(prof.map(([a, b]) => new THREE.Vector2(a, b)), 14);
  geo.rotateX(Math.PI / 2);
  const pos = geo.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), k = 1 + 0.06 * Math.sin(Math.atan2(y, x) * 3 + seed) + (rnd() - 0.5) * 0.03;
    pos.setXY(i, x * k, y * k);
  }
  geo.translate(...at);
  return geoOf(geo, mat);
}

// A crescent dune (a barchan): the long windward slope on its outer side (-X), a steep slip face
// inside the crescent, the horns trailing downwind (+X), wind ripples across the windward slope;
// the crest is `H` high.
function dune(Rc: number, thm: number, H: number, Ww: number, Wl: number, mat: string, seed: number): Geo {
  const nt = 22, nd = 14, rnd = seeded(seed);
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= nt; i++) {
    const th = -thm + (2 * thm * i) / nt, k = Math.cos(((th / thm) * Math.PI) / 2);
    const cx = Rc * (1 - Math.cos(th)), cy = Rc * Math.sin(th), nx = -Math.cos(th), ny = Math.sin(th);
    const hh = H * Math.pow(Math.max(0, k), 1.2), ww = Ww * (0.45 + 0.55 * k), wl = Wl * (0.5 + 0.5 * k);
    for (let j = 0; j <= nd; j++) {
      const d = -wl + ((ww + wl) * j) / nd;
      let z = d >= 0 ? hh * Math.pow(1 - d / ww, 1.6) : hh * Math.pow(1 + d / wl, 0.6);
      // ripples on the windward side
      if (d > 0 && j < nd) z += 3.5 * Math.sin(d / 26 + th * 3) * Math.min(1, (1 - d / ww) * 3) * (0.7 + rnd() * 0.3);
      if (j === 0 || j === nd) z = -6;
      pos.push(cx + nx * d, cy + ny * d, Math.max(-6, z));
    }
  }
  for (let i = 0; i < nt; i++)
    for (let j = 0; j < nd; j++) {
      const a = i * (nd + 1) + j, b = a + nd + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  return geoOf(geo, mat);
}

// A sheet of falling water along Y from y0 to y1 through the profile points (x, z), both faces,
// a little ragged.
function fallSheet(profile: P2[], y0: number, y1: number, cols: number, mat: string, seed: number, wob = 5): Geo {
  const rnd = seeded(seed), rows = profile.length;
  const pts: V3[][] = profile.map(([x, z], i) => Array.from({ length: cols + 1 }, (_, j) => [x + (i && i < rows - 1 ? (rnd() - 0.5) * wob * 2 : 0), y0 + ((y1 - y0) * j) / cols, z] as V3));
  const pos: number[] = [];
  const tri = (a: V3, b: V3, c: V3) => pos.push(...a, ...b, ...c, ...a, ...c, ...b);
  for (let i = 0; i + 1 < rows; i++)
    for (let j = 0; j < cols; j++) {
      tri(pts[i][j], pts[i + 1][j], pts[i + 1][j + 1]);
      tri(pts[i][j], pts[i + 1][j + 1], pts[i][j + 1]);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return geoOf(geo, mat);
}

// A cloth hung or stretched: a grid through `corner(u, v)` (u, v 0..1), both faces, holes torn
// where `torn` says.
function cloth(corner: (u: number, v: number) => V3, nu: number, nv: number, mat: string, torn?: (u: number, v: number) => boolean): Geo {
  const pos: number[] = [];
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      if (torn?.((i + 0.5) / nu, (j + 0.5) / nv)) continue;
      const a = corner(i / nu, j / nv), b = corner((i + 1) / nu, j / nv), c = corner((i + 1) / nu, (j + 1) / nv), d = corner(i / nu, (j + 1) / nv);
      pos.push(...a, ...b, ...c, ...a, ...c, ...d, ...a, ...c, ...b, ...a, ...d, ...c);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return geoOf(geo, mat);
}

// A rope through points (a little sag already in them).
const rope = (pts: V3[], r: number, mat = "Southsands_Rope"): Geo => merge(...pts.slice(1).map((p, i) => cylinderBetween(pts[i], p, r, 4, mat)));
function sagLine(a: V3, b: V3, sag: number, n: number): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - sag * 4 * t * (1 - t)] as V3;
  });
}

// A square frustum (a pyramid's tier): bx by at the foot, tx ty at the top, h high.
function frustum(bx: number, by: number, tx: number, ty: number, h: number, bottom: V3, mat: string): Geo {
  const [cx, cy, cz] = bottom;
  const P = (i: number, top: boolean): V3 => {
    const sx = i === 1 || i === 2 ? 1 : -1, sy = i >= 2 ? 1 : -1;
    return top ? [cx + (sx * tx) / 2, cy + (sy * ty) / 2, cz + h] : [cx + (sx * bx) / 2, cy + (sy * by) / 2, cz];
  };
  const pos: number[] = [];
  const quad = (a: V3, b: V3, c: V3, d: V3) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    quad(P(i, false), P(j, false), P(j, true), P(i, true));
  }
  quad(P(0, true), P(1, true), P(2, true), P(3, true));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return geoOf(geo, mat);
}

// A boat's hull: an open shell along X (bow at -X), `B` across at its widest, `D` deep amidships
// with the sheer rising `rise` at the ends, planked `th` thick, a transom `stern` of the beam wide
// at +X. `hole(x, girth 0 keel..1 gunwale, side)` tears planking out (a wreck).
interface HullSpec { L: number; B: number; D: number; rise: number; th: number; stern: number; outer: string; inner: string; nx?: number; ny?: number; hole?: (x: number, g: number, side: number) => boolean }
function hullHalf(h: HullSpec) {
  const half = h.L / 2;
  const hb = (t: number) => (t < 0 ? (h.B / 2) * Math.sqrt(Math.max(0, 1 - Math.pow(-t, 2.2))) : (h.B / 2) * (1 - (1 - h.stern) * Math.pow(t, 3)));
  const zk = (t: number) => h.D * 0.22 * Math.pow(Math.abs(t), 3);
  const zs = (t: number) => h.D + h.rise * t * t;
  const at = (t: number, g: number, s: number, inset: number): V3 => {
    const a = (g * Math.PI) / 2, w = Math.max(0, hb(t) - inset), top = zs(t), bot = zk(t) + inset;
    return [t * half, s * w * Math.sin(a), top - (top - bot) * Math.cos(a)];
  };
  return { half, hb, zk, zs, at };
}
function hull(h: HullSpec): Geo {
  const nx = h.nx ?? 24, ny = h.ny ?? 8, H = hullHalf(h), out: Geo[] = [];
  for (const s of [-1, 1])
    for (const inner of [false, true]) {
      const pos: number[] = [], uv: number[] = [], idx: number[] = [];
      for (let i = 0; i <= nx; i++)
        for (let j = 0; j <= ny; j++) {
          const t = -1 + (2 * i) / nx, p = H.at(t, j / ny, s, inner ? h.th : 0);
          pos.push(...p);
          uv.push(p[0] / 100, ((j / ny) * (H.hb(t) + H.zs(t)) * 1.2) / 100);
        }
      const flip = s > 0 !== inner;
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < ny; j++) {
          if (h.hole?.((-1 + (2 * i + 1) / nx) * H.half, (j + 0.5) / ny, s)) continue;
          const a = i * (ny + 1) + j, b = a + ny + 1;
          if (flip) idx.push(a, b + 1, b, a, a + 1, b + 1);
          else idx.push(a, b, b + 1, a, b + 1, a + 1);
        }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      out.push([{ geo, mat: inner ? h.inner : h.outer }]);
      // the gunwale's cap, outer edge to inner
      const cap: number[] = [];
      for (let i = 0; i < nx; i++) {
        const t0 = -1 + (2 * i) / nx, t1 = -1 + (2 * (i + 1)) / nx;
        if (h.hole?.(((t0 + t1) / 2) * H.half, 0.97, s)) continue;
        const a = H.at(t0, 1, s, 0), b = H.at(t1, 1, s, 0), c = H.at(t1, 1, s, h.th), d = H.at(t0, 1, s, h.th);
        cap.push(...a, ...b, ...c, ...a, ...c, ...d, ...a, ...c, ...b, ...a, ...d, ...c);
      }
      const cg = new THREE.BufferGeometry();
      cg.setAttribute("position", new THREE.Float32BufferAttribute(cap, 3));
      out.push(geoOf(cg, h.inner));
    }
  // the transom: the stern's section closed by a flat panel (both faces)
  if (h.stern > 0.05) {
    const sec: THREE.Vector2[] = [];
    for (let j = 8; j >= 0; j--) { const p = H.at(1, j / 8, -1, 0); sec.push(new THREE.Vector2(p[1], p[2])); }
    for (let j = 1; j <= 8; j++) { const p = H.at(1, j / 8, 1, 0); sec.push(new THREE.Vector2(p[1], p[2])); }
    const sg = new THREE.ShapeGeometry(new THREE.Shape(sec));
    const p = sg.getAttribute("position"), tri: number[] = [];
    const ix = sg.index!;
    for (let k = 0; k < ix.count; k += 3) {
      const v = [ix.getX(k), ix.getX(k + 1), ix.getX(k + 2)].map((n) => [H.half - 2, p.getX(n), p.getY(n)] as V3);
      tri.push(...v[0], ...v[1], ...v[2], ...v[0], ...v[2], ...v[1]);
    }
    const tg = new THREE.BufferGeometry();
    tg.setAttribute("position", new THREE.Float32BufferAttribute(tri, 3));
    out.push(geoOf(tg, h.outer));
  }
  return merge(...out);
}

// ================================================================== the inner sea's shore

// สันเนินทรายแดง: a crescent dune of the red sand, a smaller one beside it.
function redDune(): Geo {
  return merge(
    dune(520, 1.0, 190, 360, 150, "Southsands_RedSand", 11),
    translate(rotateZ(dune(300, 0.9, 90, 220, 90, "Southsands_RedSandDark", 12), 25), [-380, 520, 0]),
    cap(150, 190, 30, [-300, -260, 0], "Southsands_RedSandDark"),
  );
}

// ลานเกลือขาว: a flat of salt crust (about 16 m across) broken into hexagons by raised white ridges,
// its rim damp and dirty where it meets the sand.
function saltFlat(): Geo {
  const out = blob(820, 640, 21, 30, 0.12), inner = out.map(([x, y]) => [x * 0.93, y * 0.93] as P2);
  const parts: Geo[] = [slab(out, -2, 1.5, "Southsands_SaltDirty"), slab(inner, -2, 3, "Southsands_Salt")];
  // a hexagon net: its corners jittered, every edge once
  const S = 95, rnd = seeded(23), seen = new Set<string>();
  const jit = (x: number, y: number): P2 => {
    const k = Math.round(x * 7.3 + y * 13.1);
    const r = seeded(Math.abs(k) + 5);
    return [x + (r() - 0.5) * 22, y + (r() - 0.5) * 22];
  };
  for (let row = -9; row <= 9; row++)
    for (let col = -8; col <= 8; col++) {
      const cx = col * S * 1.5, cy = row * S * Math.sqrt(3) + (col % 2 ? (S * Math.sqrt(3)) / 2 : 0);
      for (let k = 0; k < 6; k++) {
        const a0 = (k * Math.PI) / 3, a1 = ((k + 1) * Math.PI) / 3;
        const p: P2 = [Math.round(cx + S * Math.cos(a0)), Math.round(cy + S * Math.sin(a0))], q: P2 = [Math.round(cx + S * Math.cos(a1)), Math.round(cy + S * Math.sin(a1))];
        const key = p[0] < q[0] || (p[0] === q[0] && p[1] < q[1]) ? `${p}|${q}` : `${q}|${p}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (!inside(inner, (p[0] + q[0]) / 2 / 0.97, (p[1] + q[1]) / 2 / 0.97) || rnd() < 0.08) continue;
        const a = jit(...p), b = jit(...q);
        parts.push(beamBetween([a[0], a[1], 4], [b[0], b[1], 4], 9, 3.5, "Southsands_SaltRidge"));
      }
    }
  return parts.flat();
}

// นาเกลือ: salt pans (3 by 2, each about 2.8 m square) between low earth bunds: brine in some,
// crust and little heaps raked up in others, a plank across, a rake and a basket.
function saltPans(): Geo {
  const parts: Geo[] = [], P = 290, rnd = seeded(31);
  const X0 = -1.5 * P, Y0 = -P;
  // the bunds round and between the pans
  for (let i = 0; i <= 3; i++) parts.push(sboxAt([34, 2 * P + 34, 16], [X0 + i * P, 0, -2], "Southsands_Bund", 6));
  for (let j = 0; j <= 2; j++) parts.push(sboxAt([3 * P + 34, 34, 16], [0, Y0 + j * P, -2], "Southsands_Bund", 6));
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 2; j++) {
      const cx = X0 + (i + 0.5) * P, cy = Y0 + (j + 0.5) * P, wet = (i + j) % 2 === 0;
      parts.push(sboxAt([P - 30, P - 30, wet ? 5 : 3], [cx, cy, 0], wet ? "Southsands_Brine" : "Southsands_Salt"));
      if (!wet) for (let k = 0; k < 3; k++) parts.push(heap(28 + rnd() * 14, 22 + rnd() * 10, [cx + (rnd() - 0.5) * 150, cy + (rnd() - 0.5) * 150, 2], "Southsands_Salt", 32 + k + i * 3));
      else parts.push(slab(blob(70, 50, 33 + i, 10), 4, 5.5, "Southsands_Salt", [cx + (rnd() - 0.5) * 80, cy + (rnd() - 0.5) * 80]));
    }
  // a plank laid across the middle pans, a wooden rake and a basket
  parts.push(sboxAt([P + 60, 34, 5], [X0 + 1.5 * P, Y0 + P, 14], "Southsands_Driftwood", 1.5));
  parts.push(beamBetween([X0 + 0.4 * P, Y0 + 1.3 * P, 3], [X0 + 0.95 * P, Y0 + 1.45 * P, 60], 5, 5, "Southsands_DriftDark"));
  parts.push(translate(rotateZ(sboxAt([10, 70, 8], [0, 0, 0], "Southsands_DriftDark", 1), 75), [X0 + 0.38 * P, Y0 + 1.28 * P, 2]));
  parts.push(cylinderAt({ rBot: 26, rTop: 34, height: 34, segments: 12, bottom: [X0 + 2.6 * P, Y0 + 2.2 * P, 0] }, "Southsands_Wicker"));
  parts.push(heap(26, 18, [X0 + 2.6 * P, Y0 + 2.2 * P, 26], "Southsands_Salt", 39));
  return merge(...parts);
}

// กองเกลือ: the salt raked into three white cones, sacks of it filled and tied, a basket, a
// wooden rake and a shovel stuck in the biggest heap.
function saltHeap(): Geo {
  const parts: Geo[] = [
    heap(150, 150, [0, 0, 0], "Southsands_Salt", 41),
    heap(110, 105, [-40, 210, 0], "Southsands_Salt", 42),
    heap(85, 80, [150, -170, 0], "Southsands_SaltDirty", 43),
    cap(260, 230, 4, [30, 20, 0], "Southsands_SaltDirty"),
  ];
  for (const [x, y, r] of [[-170, -120, 10], [-210, -40, -20], [-150, 30, 30], [-190, -200, 80]] as V3[]) {
    parts.push(translate(rotateZ(merge(
      scale(sphereCenter(30, [0, 0, 32], "Southsands_Sack", 10), [1, 0.8, 1.1]),
      cylinderAt({ rBot: 9, rTop: 5, height: 14, segments: 6, bottom: [0, 0, 62] }, "Southsands_Sack"),
      torus(8, 2, 8, 4, "Southsands_Rope").map((p) => ({ geo: p.geo.translate(0, 0, 63), mat: p.mat })),
    ), r), [x, y, 0]));
  }
  parts.push(cylinderAt({ rBot: 28, rTop: 36, height: 38, segments: 12, bottom: [60, 160, 0] }, "Southsands_Wicker"));
  parts.push(heap(30, 16, [60, 160, 36], "Southsands_Salt", 44));
  // the shovel in the big heap, the rake leaning on it
  parts.push(beamBetween([-20, 40, 120], [-60, 70, 230], 5, 5, "Southsands_DriftDark"));
  parts.push(translate(rotateZ(rotateY(sboxAt([30, 4, 34], [0, 0, 0], "IronDark", 1), -30), 35), [-15, 35, 92]));
  parts.push(beamBetween([-120, -60, 0], [-75, -30, 170], 5, 5, "Southsands_DriftDark"));
  parts.push(translate(rotateZ(sboxAt([8, 60, 8], [0, 0, 0], "Southsands_DriftDark", 1), 30), [-125, -63, 0]));
  return merge(...parts);
}

// กระท่อมชาวประมง: a fisherman's hut of driftwood boards on short stilts, a palm-thatch roof, a
// porch at the front (-X) with a rail, steps down to the sand, a net hung over the rail, oars,
// a lantern by the door and a fish basket.
function fisherHut(): Geo {
  const W = 420, Dp = 340, F = 70, Hh = 230, parts: Geo[] = [], rnd = seeded(51);
  const D = "Southsands_Driftwood", DD = "Southsands_DriftDark";
  // stilts and the floor (the porch runs out 130 in front)
  for (const x of [-W / 2 - 120, -W / 2, 0, W / 2])
    for (const y of [-Dp / 2 + 10, 0, Dp / 2 - 10]) parts.push(cylinderAt({ rBot: 9, rTop: 8, height: F, segments: 6, bottom: [x, y, -10] }, DD));
  parts.push(sboxAt([W + 140, Dp + 20, 10], [-60, 0, F - 10], D, 1.5));
  for (let x = -W / 2 - 125; x < W / 2; x += 30) parts.push(beamBetween([x, -Dp / 2 - 10, F + 0.5], [x, Dp / 2 + 10, F + 0.5], 1.5, 1, DD));
  // walls of horizontal boards (a little uneven), the door and the windows cut in them
  const board = (a: V3, b: V3, k: number) => beamBetween(a, b, 6, 36, k % 3 === 0 ? DD : D);
  for (let k = 0; k < 6; k++) {
    const z = F + 20 + k * 36, wob = (rnd() - 0.5) * 3;
    // back (+X) and the sides (with a window each between 90 and 160 up)
    parts.push(board([W / 2, -Dp / 2, z + wob], [W / 2, Dp / 2, z], k));
    for (const s of [-1, 1]) {
      if (k >= 2 && k <= 3) {
        parts.push(board([-W / 2, s * Dp / 2, z], [-60, s * Dp / 2, z + wob], k), board([60, s * Dp / 2, z], [W / 2, s * Dp / 2, z], k));
      } else parts.push(board([-W / 2, s * Dp / 2, z], [W / 2, s * Dp / 2, z + wob], k));
    }
    // front: the door between y -45 and 45
    if (k < 5) parts.push(board([-W / 2, -Dp / 2, z], [-W / 2, -48, z], k), board([-W / 2, 48, z], [-W / 2, Dp / 2, z + wob], k));
    else parts.push(board([-W / 2, -Dp / 2, z], [-W / 2, Dp / 2, z], k));
  }
  for (const [x, y] of [[-W / 2, -Dp / 2], [-W / 2, Dp / 2], [W / 2, -Dp / 2], [W / 2, Dp / 2]]) parts.push(sboxAt([14, 14, Hh + 10], [x, y, F], DD, 2));
  // the door ajar, its frame; the window shutters propped open
  parts.push(sboxAt([10, 14, 205], [-W / 2 - 2, -52, F], DD, 1.5), sboxAt([10, 14, 205], [-W / 2 - 2, 52, F], DD, 1.5), sboxAt([12, 118, 12], [-W / 2 - 2, 0, F + 200], DD, 1.5));
  parts.push(sboxAt([4, 96, 196], [-W / 2 + 4, 0, F + 2], "Southsands_Dark"));
  parts.push(translate(rotateZ(sboxAt([5, 90, 196], [0, 45, 0], "DoorWood", 1), -60), [-W / 2 - 4, -45, F + 2]));
  for (const s of [-1, 1]) {
    parts.push(sboxAt([118, 4, 68], [0, s * (Dp / 2 - 2), F + 92], "Southsands_Dark"));
    parts.push(translate(rotateX(sboxAt([118, 5, 64], [0, 0, 0], D, 1), s * -55), [0, s * (Dp / 2 + 4), F + 160]));
    parts.push(beamBetween([0, s * (Dp / 2 + 3), F + 92], [0, s * (Dp / 2 + 48), F + 150], 3, 3, DD));
  }
  // the roof: palm thatch on a gable, ridge along X, a ridge cap of bundled fronds
  parts.push(gableRoof([W + 30, Dp + 30, 14], [0, 0, F + Hh], 120, 60, "Southsands_Thatch"));
  parts.push(cylinderBetween([-W / 2 - 75, 0, F + Hh + 124], [W / 2 + 75, 0, F + Hh + 124], 11, 6, "Southsands_DriftDark"));
  for (const s of [-1, 1]) {
    for (let k = 0; k < 2; k++) {
      const z = F + Hh + k * 60, y = s * (Dp / 2 + 30 - k * 85);
      parts.push(beamBetween([-W / 2 - 75, y, z + 8], [W / 2 + 75, y, z + 8], 8, 8, "Southsands_DriftDark"));
    }
  }
  // gable ends closed with boards
  for (const x of [-W / 2, W / 2]) for (let k = 0; k < 3; k++) parts.push(beamBetween([x, -Dp / 2 + 30 + k * 50, F + Hh + 10 + k * 34], [x, Dp / 2 - 30 - k * 50, F + Hh + 10 + k * 34], 5, 34, D));
  // the porch: posts, a rail, steps down, the net over the rail
  for (const y of [-Dp / 2 + 5, Dp / 2 - 5]) parts.push(cylinderAt({ radius: 8, height: Hh - 10, segments: 6, bottom: [-W / 2 - 120, y, F] }, DD));
  parts.push(beamBetween([-W / 2 - 120, -Dp / 2 + 5, F + Hh - 12], [-W / 2 - 120, Dp / 2 - 5, F + Hh - 12], 10, 10, DD));
  for (const y of [-Dp / 2 + 5, Dp / 2 - 5]) parts.push(beamBetween([-W / 2 - 120, y, F + Hh - 12], [-W / 2 - 10, y, F + Hh + 30], 8, 8, DD));
  parts.push(beamBetween([-W / 2 - 122, -Dp / 2 + 5, F + 75], [-W / 2 - 122, 40, F + 75], 7, 7, D));
  parts.push(beamBetween([-W / 2 - 122, -Dp / 2 + 5, F + 10], [-W / 2 - 122, -Dp / 2 + 5, F + 75], 6, 6, D));
  parts.push(beamBetween([-W / 2 - 122, 40, F + 10], [-W / 2 - 122, 40, F + 75], 6, 6, D));
  for (let k = 0; k < 3; k++) parts.push(sboxAt([30, 110, F - 14 - k * 23], [-W / 2 - 148 - k * 30, 105, -6], k % 2 ? D : DD, 2));
  parts.push(cloth((u, v) => [-W / 2 - 124 - 18 * Math.sin(Math.PI * v) + 6 * Math.sin(u * 9), -Dp / 2 + 10 + u * 140, F + 78 - v * 66 - 8 * Math.sin(Math.PI * u)], 8, 4, "Southsands_Net"));
  for (let k = 0; k < 4; k++) parts.push(sphereCenter(7, [-W / 2 - 126, -Dp / 2 + 25 + k * 34, F + 72], "Southsands_Float", 6));
  // oars against the wall, a lantern, a fish basket, a crate
  for (const y of [70, 100]) parts.push(beamBetween([-W / 2 - 18, y, F], [-W / 2 - 6, y + 10, F + 210], 5, 4, D), translate(sboxAt([3, 16, 50], [0, 0, 0], D, 1), [-W / 2 - 18, y, F + 2]));
  parts.push(beamBetween([-W / 2 - 4, -70, F + 190], [-W / 2 - 34, -70, F + 190], 3, 3, "IronDark"));
  parts.push(sboxAt([14, 14, 20], [-W / 2 - 34, -70, F + 160], "IronDark", 1), sboxAt([10, 16, 12], [-W / 2 - 34, -70, F + 164], "LanternGlow"));
  parts.push(cylinderAt({ rBot: 22, rTop: 28, height: 30, segments: 10, bottom: [-W / 2 - 80, -120, F] }, "Southsands_Wicker"));
  for (let k = 0; k < 3; k++) parts.push(translate(rotateZ(scale(sphereCenter(12, [0, 0, 0], "Southsands_Fish", 6), [2, 0.6, 0.4]), k * 50), [-W / 2 - 80, -120, F + 32]));
  parts.push(sboxAt([60, 50, 44], [-W / 2 - 90, 140, 0], "WoodShade", 2));
  return merge(...parts);
}

// ราวตากแห: two trestles of driftwood poles with a ridge pole between, a fishing net hung over it
// with its floats, and a line of fish drying beside.
function netRack(): Geo {
  const L = 480, Hh = 210, parts: Geo[] = [], DD = "Southsands_DriftDark";
  for (const y of [-L / 2, L / 2]) {
    parts.push(beamBetween([-70, y, -10], [0, y, Hh + 12], 7, 7, DD), beamBetween([70, y, -10], [0, y, Hh + 12], 7, 7, DD));
    parts.push(beamBetween([-38, y, 80], [38, y, 80], 5, 5, DD));
  }
  parts.push(cylinderBetween([0, -L / 2 - 30, Hh], [0, L / 2 + 30, Hh], 6, 6, "Southsands_Driftwood"));
  // the net: draped both sides of the pole, sagging between the trestles, ragged at its foot
  for (const s of [-1, 1])
    parts.push(cloth((u, v) => {
      const y = -L / 2 + 20 + u * (L - 40), sag = 22 * Math.sin(Math.PI * u);
      return [s * (6 + v * 46 + 8 * Math.sin(u * 11 + v * 3)), y, Hh - 4 - sag - v * (150 - 24 * Math.sin(u * 7))];
    }, 12, 4, "Southsands_Net", (u, v) => v > 0.75 && Math.sin(u * 23) > 0.4));
  for (let k = 0; k < 9; k++) parts.push(sphereCenter(8, [-48 + (k % 2) * 96, -L / 2 + 40 + k * 50, Hh - 160 + 22 * Math.sin((Math.PI * (k + 0.5)) / 9)], "Southsands_Float", 6));
  // fish drying on a line off the far trestle
  parts.push(cylinderBetween([0, L / 2, 150], [0, L / 2 + 260, 140], 1.2, 3, "Southsands_Rope"), cylinderAt({ radius: 5, height: 160, segments: 6, bottom: [0, L / 2 + 270, -10] }, DD));
  for (let k = 0; k < 6; k++) {
    const y = L / 2 + 30 + k * 38;
    parts.push(cylinderBetween([0, y, 148 - k * 1.5], [0, y, 136 - k * 1.5], 0.8, 3, "Southsands_Rope"));
    parts.push(translate(rotateY(scale(sphereCenter(10, [0, 0, 0], "Southsands_Fish", 6), [0.35, 0.7, 2.2]), 0), [0, y, 116 - k * 1.5]));
  }
  // a basket of floats and a coil of rope at its foot
  parts.push(cylinderAt({ rBot: 24, rTop: 30, height: 32, segments: 10, bottom: [60, -L / 2 - 70, 0] }, "Southsands_Wicker"));
  for (let k = 0; k < 4; k++) parts.push(sphereCenter(9, [52 + (k % 2) * 16, -L / 2 - 78 + k * 6, 34 + (k > 1 ? 8 : 0)], "Southsands_Float", 6));
  parts.push(translate(torus(26, 6, 14, 6, "Southsands_Rope"), [-60, L / 2 - 40, 5]), translate(torus(18, 6, 12, 6, "Southsands_Rope"), [-60, L / 2 - 40, 15]));
  return merge(...parts);
}

// เรือไม้ลำเล็ก: a rowing boat drawn up on the sand, heeled over a little, its oars across the
// thwarts, a coil of rope and a bailer in it, a painter running to a stake.
function beachedBoat(): Geo {
  const spec: HullSpec = { L: 470, B: 160, D: 66, rise: 26, th: 4, stern: 0.5, outer: "Southsands_HullPale", inner: "Southsands_Driftwood", nx: 20, ny: 7 };
  const H = hullHalf(spec), parts: Geo[] = [hull(spec)];
  for (const t of [-0.35, 0.05, 0.5]) {
    const w = H.hb(t) * 2 - 10, z = H.zs(t) * 0.68;
    parts.push(sboxAt([22, w, 4], [t * H.half, 0, z], "Southsands_Driftwood", 1));
  }
  // a wale painted teal along each side, a stem post
  for (const s of [-1, 1]) for (let i = 0; i < 10; i++) {
    const t0 = -0.95 + i * 0.19, t1 = t0 + 0.19, a = H.at(t0, 0.92, s, -1.5), b = H.at(t1, 0.92, s, -1.5);
    parts.push(beamBetween(a, b, 3, 7, "Southsands_HullPaint"));
  }
  parts.push(cylinderBetween(H.at(-1, 0, 1, 0), [-H.half - 4, 0, H.zs(-1) + 8], 5, 5, "Southsands_DriftDark"));
  for (const s of [-1, 1]) parts.push(beamBetween([-150, s * 30, 48], [170, s * 50, 52], 4, 4, "Southsands_Driftwood"), translate(sboxAt([46, 14, 2], [0, 0, 0], "Southsands_Driftwood", 0.5), [170, s * 50, 50]));
  parts.push(translate(torus(14, 3.5, 10, 4, "Southsands_Rope"), [120, 10, 12]));
  parts.push(cylinderBetween([-H.half, 0, H.zs(-1) - 6], [-H.half - 170, 30, 6], 1.2, 3, "Southsands_Rope"), cylinderAt({ rBot: 5, rTop: 3, height: 50, segments: 5, bottom: [-H.half - 175, 30, -15] }, "Southsands_DriftDark"));
  return translate(rotateX(merge(...parts), 9), [0, 0, -12]);
}

// ซากเรือใบเกยตื้น: a two-masted trader driven onto the sand in a storm, heeled over and half buried;
// a hole torn in its side shows its ribs; the foremast still stands with a torn sail on its yard,
// the mainmast snapped, its top lying on the sand; a cabin at the stern, the bowsprit, rigging
// hanging slack; sand drifted against the low side.
function sailWreck(): Geo {
  const spec: HullSpec = {
    L: 1800, B: 520, D: 340, rise: 90, th: 12, stern: 0.55, outer: "Southsands_Hull", inner: "Southsands_HullPale", nx: 30, ny: 9,
    hole: (x, g, s) => s > 0 && x > 120 && x < 640 && g > 0.25 && g < 0.85 && !(x > 400 && g > 0.7),
  };
  const H = hullHalf(spec), parts: Geo[] = [hull(spec)];
  // the ribs in the hole
  for (let x = 150; x < 640; x += 60) {
    const t = x / H.half, pts: V3[] = [];
    for (let k = 0; k <= 6; k++) pts.push(H.at(t, 0.15 + k * 0.13, 1, 6));
    parts.push(limb(pts, 7, 6, "Southsands_HullPale", { seg: 5 }));
  }
  // wales along the sheer, the deck (half its planks gone), deck beams
  for (const s of [-1, 1]) for (let i = 0; i < 14; i++) {
    const t0 = -0.96 + i * 0.137, t1 = t0 + 0.137;
    if (s > 0 && t0 * H.half > 140 && t0 * H.half < 620) continue;
    parts.push(beamBetween(H.at(t0, 0.9, s, -3), H.at(t1, 0.9, s, -3), 6, 16, "Southsands_HullPaint"));
  }
  const deckZ = (t: number) => H.zs(t) - 40;
  for (let x = -720; x < 760; x += 70) {
    const t = x / H.half, w = H.hb(t) * 2 - 30;
    parts.push(sboxAt([14, w, 14], [x, 0, deckZ(t) - 16], "Southsands_HullPale", 1));
    if (!(x > 100 && x < 600) || (x / 70) % 3 === 0) parts.push(sboxAt([68, w * (x > 100 && x < 600 ? 0.4 : 1), 6], [x + 35, x > 100 && x < 600 ? -w * 0.3 : 0, deckZ(t)], "Southsands_HullPale", 1));
  }
  // the stern cabin, its door and windows
  const cx = 640;
  parts.push(sboxAt([260, 330, 170], [cx, 0, deckZ(cx / H.half)], "Southsands_HullPale", 3));
  parts.push(sboxAt([290, 360, 14], [cx, 0, deckZ(cx / H.half) + 170], "Southsands_Hull", 3));
  parts.push(sboxAt([4, 80, 140], [cx - 132, 0, deckZ(cx / H.half)], "Southsands_Dark"));
  for (const s of [-1, 1]) for (const dx of [-60, 50]) parts.push(sboxAt([44, 4, 34], [cx + dx, s * 166, deckZ(cx / H.half) + 90], "Southsands_Dark"));
  // the foremast standing, its yard and a torn sail; the mainmast snapped; the bowsprit
  const fm: V3 = [-420, 0, deckZ(-420 / H.half)];
  parts.push(cylinderAt({ rBot: 17, rTop: 11, height: 1150, segments: 8, bottom: fm }, "Southsands_DriftDark"));
  parts.push(cylinderAt({ radius: 18, height: 12, segments: 8, bottom: [fm[0], 0, fm[2] + 820] }, "Southsands_Hull"));
  const yard = fm[2] + 880;
  parts.push(translate(rotateZ(cylinderBetween([0, -360, 0], [0, 360, 0], 8, 6, "Southsands_DriftDark", 6), 14), [fm[0] - 18, 0, yard]));
  parts.push(cloth((u, v) => {
    const a = (14 * Math.PI) / 180, y = -320 + u * 640;
    return [fm[0] - 30 - 50 * Math.sin(Math.PI * u) * v - y * Math.sin(a), y * Math.cos(a), yard - 10 - v * (520 - 60 * Math.sin(u * 5))];
  }, 9, 7, "Southsands_Sail", (u, v) => (v > 0.55 && Math.sin(u * 13) > 0.1) || (v > 0.82) || (u > 0.6 && u < 0.8 && v > 0.3)));
  const mm: V3 = [180, 0, deckZ(180 / H.half)];
  parts.push(cylinderAt({ rBot: 19, rTop: 15, height: 420, segments: 8, bottom: mm }, "Southsands_DriftDark"));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    parts.push(cylinderBetween([mm[0], 0, mm[2] + 420], [mm[0] + Math.cos(a) * 14, Math.sin(a) * 14, mm[2] + 440 + (k % 2) * 18], 6, 4, "Southsands_DriftDark", 1));
  }
  parts.push(cylinderBetween([-H.half + 20, 0, H.zs(-1) - 30], [-H.half - 420, 0, H.zs(-1) + 160], 11, 6, "Southsands_DriftDark", 7));
  // shrouds and stays hanging slack
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) parts.push(rope(sagLine([fm[0] - 40 + k * 40, s * (H.hb(fm[0] / H.half) - 6), H.zs(fm[0] / H.half)], [fm[0], s * 10, fm[2] + 800], 30, 6), 2));
    parts.push(rope(sagLine([mm[0] + 30, s * (H.hb(mm[0] / H.half) - 6), H.zs(mm[0] / H.half)], [mm[0], s * 12, mm[2] + 400], 20, 5), 2));
  }
  parts.push(rope(sagLine([fm[0], 0, fm[2] + 1100], [-H.half - 400, 0, H.zs(-1) + 160], 80, 8), 2));
  parts.push(rope(sagLine([fm[0], 0, fm[2] + 900], [mm[0], 0, mm[2] + 410], 150, 8), 2));
  // the whole ship heeled over to +Y (the hole side up), bow a little down, sunk into the sand
  const ship = translate(rotateY(rotateX(merge(...parts), -17), 3), [0, 0, -95]);
  // the mainmast's top lying in the sand beside it, sand drifted against the low side, timbers
  const out: Geo[] = [ship];
  out.push(translate(rotateZ(merge(
    cylinderBetween([0, 0, 18], [0, 760, 26], 15, 8, "Southsands_DriftDark", 10),
    cylinderBetween([-260, 520, 30], [260, 560, 24], 7, 6, "Southsands_DriftDark", 5),
    cloth((u, v) => [-240 + u * 480, 540 + v * 220 + 30 * Math.sin(u * 7), 22 + 18 * Math.sin(Math.PI * v) * Math.sin(u * 4)], 6, 3, "Southsands_Sail", (u, v) => v > 0.6 && u > 0.5),
  ), -12), [220, -420, 0]));
  out.push(cap(700, 260, 70, [0, -330, 0], "Southsands_BeachSand"), cap(300, 200, 45, [-650, -240, 0], "Southsands_BeachSand"), cap(260, 180, 50, [700, 300, 0], "Southsands_BeachSand"));
  for (const [x, y, r, l] of [[-900, 420, 30, 260], [500, 640, 70, 200], [-300, 700, -20, 160]] as [number, number, number, number][])
    out.push(translate(rotateZ(sboxAt([l, 26, 12], [0, 0, 0], "Southsands_HullPale", 2), r), [x, y, 0]));
  out.push(translate(rotateZ(rotateY(merge(cylinderAt({ radius: 34, height: 70, segments: 10, bottom: [0, 0, -35] }, "Southsands_Hull"), torus(34, 3, 12, 4, "IronDark")), 90), 20), [-760, 600, 26]));
  return merge(...out);
}

// กะโหลกวัวฟอกขาว: the bleached skull of an ox, its horns sweeping up, half in the sand, a few ribs
// and vertebrae round it (what the hermit crabs carry for shells).
function cowSkull(): Geo {
  const B = "Southsands_Bone", parts: Geo[] = [];
  const skull: Geo[] = [
    scale(sphereCenter(26, [0, 0, 0], B, 10), [1.1, 1.15, 0.85]),
    scale(cylinderAt({ rBot: 20, rTop: 12, height: 50, segments: 8, bottom: [0, 0, 0] }, B), [1, 0.85, 1]).map((p) => ({ geo: p.geo.rotateY(-Math.PI / 2 - 0.25).translate(-14, 0, 2), mat: p.mat })),
    sphereCenter(7, [-10, -14, 12], "Southsands_Dark", 6), sphereCenter(7, [-10, 14, 12], "Southsands_Dark", 6),
    sphereCenter(4, [-62, -6, -6], "Southsands_Dark", 5), sphereCenter(4, [-62, 6, -6], "Southsands_Dark", 5),
  ];
  for (const s of [-1, 1]) skull.push(limb([[4, s * 22, 10], [8, s * 52, 16], [4, s * 76, 38], [-10, s * 84, 66]], 8, 2, B, { seg: 6 }));
  parts.push(translate(rotateY(merge(...skull), -12), [0, 0, 16]));
  // ribs arching out of the sand behind it, two vertebrae, the jaw
  for (let i = 0; i < 4; i++) {
    const x = 90 + i * 26, pts: V3[] = [];
    for (let k = 0; k <= 4; k++) { const a = (k / 4) * Math.PI * 0.8; pts.push([x + k * 3, 30 + Math.cos(a) * 40, -6 + Math.sin(a) * 34 * (1 - i * 0.1)]); }
    parts.push(limb(pts, 3.2, 2, B, { seg: 4 }));
  }
  for (let i = 0; i < 3; i++) parts.push(translate(rotateZ(sboxAt([12, 10, 9], [0, 0, 0], B, 2), i * 20), [80 + i * 22, -4 + i * 3, 0]));
  parts.push(translate(rotateZ(beamBetween([0, 0, 2], [52, 6, 4], 7, 5, B), 140), [20, -40, 0]));
  return merge(...parts);
}

// แอ่งน้ำพุล้อมหิน: a little pool where a spring wells up (bubbles at its source), ringed with rounded
// stones and damp sand, reeds at one side.
function springPool(): Geo {
  const rnd = seeded(61), parts: Geo[] = [
    slab(blob(270, 220, 62, 20, 0.1), -1, 1.5, "Southsands_WetSand"),
    slab(blob(190, 150, 63, 18, 0.08), -1, 5, "Southsands_Spring"),
  ];
  for (let i = 0; i < 15; i++) {
    const a = (i / 15) * Math.PI * 2 + rnd() * 0.2, k = 1.02 + rnd() * 0.12;
    if (a > 2.5 && a < 3.2) continue; // the low side where the water runs out
    const s = 34 + rnd() * 30;
    parts.push(R([s * 1.3, s, s * 0.7], 64 + i, [Math.cos(a) * 195 * k, Math.sin(a) * 155 * k, -4], rnd() * 180, rnd() < 0.5 ? "Southsands_WetRock" : "Southsands_SandRock", 0.4));
  }
  for (let i = 0; i < 6; i++) parts.push(scale(sphereCenter(10 + rnd() * 8, [80 + rnd() * 40, -30 + rnd() * 60, 5], "Southsands_Foam", 6), [1, 1, 0.3]));
  parts.push(torus(24, 3, 14, 4, "Southsands_Foam").map((p) => ({ geo: p.geo.translate(95, 0, 6), mat: p.mat })));
  for (let i = 0; i < 9; i++) {
    const x = -150 + rnd() * 120, y = 110 + rnd() * 90;
    for (let k = 0; k < 6; k++) {
      const a = rnd() * Math.PI * 2, l = 60 + rnd() * 70;
      parts.push(beamBetween([x, y, 0], [x + Math.cos(a) * l * 0.25, y + Math.sin(a) * l * 0.25, l], 3, 1.5, "Southsands_Reed"));
    }
  }
  return merge(...parts);
}

// ================================================================== the glass cape

// A crystal of glass: a hexagonal prism r across and h tall to the shoulder, a six-sided point
// on top, leaning `tilt` degrees toward `dir`, its foot sunk below the ground.
function crystal(r: number, h: number, tilt: number, dir: number, at: V3, mat = "Southsands_Glass", core = true): Geo {
  const g: Geo[] = [
    cylinderAt({ radius: r, height: h, segments: 6, bottom: [0, 0, -30] }, mat),
    cylinderAt({ rBot: r, rTop: 0, height: r * 1.9, segments: 6, bottom: [0, 0, h - 30] }, mat),
  ];
  if (core) g.push(cylinderAt({ rBot: r * 0.32, rTop: r * 0.12, height: h * 0.85, segments: 6, bottom: [0, 0, -20] }, "Southsands_GlassCore"));
  return translate(rotateZ(rotateY(facet(merge(...g)), tilt), dir), at);
}

// ยอดแก้วใส: a cluster of glass spires 2-6.5 m tall breaking out of a crust of fused sand, light
// caught in their cores.
function glassSpires(): Geo {
  const rnd = seeded(71), parts: Geo[] = [slab(blob(300, 260, 72, 18, 0.15), -2, 6, "Southsands_GlassGreen"), cap(330, 290, 22, [0, 0, 0], "Southsands_Fused")];
  const list: [number, number, number, number, number][] = [[0, 0, 70, 640, 4], [120, 90, 48, 430, 18], [-110, 70, 44, 380, 22], [60, -130, 52, 470, 16], [-90, -110, 36, 300, 28], [180, -40, 30, 240, 34], [-180, -10, 28, 210, 38], [10, 170, 30, 260, 30], [-40, -200, 24, 170, 40]];
  for (const [x, y, r, h, t] of list) parts.push(crystal(r, h, t, (Math.atan2(y, x) * 180) / Math.PI + (rnd() - 0.5) * 20, [x, y, 0]));
  for (let i = 0; i < 8; i++) {
    const a = rnd() * Math.PI * 2, d = 200 + rnd() * 120;
    parts.push(crystal(8 + rnd() * 10, 30 + rnd() * 50, 30 + rnd() * 40, (a * 180) / Math.PI, [Math.cos(a) * d, Math.sin(a) * d, 0], "Southsands_GlassGreen", false));
  }
  return merge(...parts);
}

// เศษแก้วปักทราย: a few smaller spikes of glass and a broken slab, for scattering over the sand.
function glassShard(): Geo {
  const rnd = seeded(81), parts: Geo[] = [cap(150, 120, 14, [0, 0, 0], "Southsands_Fused")];
  for (const [x, y, r, h, t] of [[0, 0, 26, 200, 14], [50, 30, 18, 120, 30], [-40, 35, 14, 90, 36], [20, -50, 16, 100, 28]] as number[][])
    parts.push(crystal(r, h, t, (Math.atan2(y, x || 1) * 180) / Math.PI + rnd() * 30, [x, y, 0]));
  parts.push(translate(rotateZ(rotateY(facet(slab([[-50, -30], [60, -40], [70, 20], [-30, 45]], 0, 10, "Southsands_GlassGreen")), 60), 30), [-70, -40, 0]));
  return merge(...parts);
}

// ต้นไม้แก้ว: a tree of glass grown where lightning struck a thorn tree and the sand ran up its
// branches: a clear twisted trunk, branches forking, clusters of glowing crystal leaves.
function glassTree(): Geo {
  const tips: { p: V3; d: V3; r: number }[] = [];
  const parts: Geo[] = [
    limb([[0, 0, -20], [10, 6, 90], [-6, 14, 180], [8, 0, 250]], 22, 13, "Southsands_GlassGreen", { flare: 0.7, roots: 4, seg: 7 }),
    grow({ mat: "Southsands_Glass", seed: 91, at: [8, 0, 240], dir: [0.1, 0, 1], len: 150, r: 12, depth: 3, spread: 0.75, shrink: 0.72, rise: 0.25, tips }),
    cap(160, 140, 16, [0, 0, 0], "Southsands_Fused"), slab(blob(150, 130, 92, 14), -1, 4, "Southsands_GlassGreen"),
  ];
  const rnd = seeded(93);
  for (const t of tips) {
    for (let k = 0; k < 4; k++) {
      const c: V3 = [t.p[0] + (rnd() - 0.5) * 50, t.p[1] + (rnd() - 0.5) * 50, t.p[2] + (rnd() - 0.3) * 30];
      parts.push(facet(translate(rotateZ(scale(sphereCenter(14 + rnd() * 10, [0, 0, 0], "Southsands_GlassLeaf", 4), [1, 1, 1.5]), rnd() * 90), c)));
    }
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4;
    parts.push(crystal(9, 40 + i * 6, 40, (a * 180) / Math.PI, [Math.cos(a) * 60, Math.sin(a) * 60, 0], "Southsands_Glass", false));
  }
  return merge(...parts);
}

// ก้อนดาวตกเรืองแสง: the falling star where it came to rest, split into dark iron-black pieces with
// its molten heart glowing between them, embers scattered, smoke rising, the sand under it fused
// to black glass.
function meteorite(): Geo {
  const rnd = seeded(101), parts: Geo[] = [
    slab(blob(380, 340, 102, 22, 0.18), -2, 4, "Southsands_GlassDark"),
    sphereCenter(150, [0, 0, 120], "Southsands_Molten", 12),
  ];
  const chunks: [V3, V3, number][] = [
    [[-60, -50, 40], [260, 230, 230], 0], [[70, -40, 50], [240, 250, 240], 70], [[-30, 90, 60], [250, 220, 250], 150],
    [[50, 70, 150], [210, 200, 170], 210], [[-70, 10, 170], [190, 210, 160], 290],
  ];
  chunks.forEach(([at, size, rot], i) => parts.push(R(size, 103 + i, [at[0] * 1.18, at[1] * 1.18, at[2] - 40], rot, "Southsands_Meteor", 0.3)));
  // glowing seams and embers on the glass round it
  for (let i = 0; i < 16; i++) {
    const a = rnd() * Math.PI * 2, d = 200 + rnd() * 160;
    parts.push(R([20 + rnd() * 26, 18 + rnd() * 20, 14 + rnd() * 14], 120 + i, [Math.cos(a) * d, Math.sin(a) * d, 0], rnd() * 180, i % 3 ? "Southsands_Meteor" : "Southsands_Ember", 0.3));
  }
  for (let i = 0; i < 6; i++) {
    const a = rnd() * Math.PI * 2, l = 120 + rnd() * 140;
    parts.push(beamBetween([Math.cos(a) * 160, Math.sin(a) * 160, 3], [Math.cos(a + 0.2) * (160 + l), Math.sin(a + 0.2) * (160 + l), 3], 6, 2, "Southsands_Molten"));
  }
  for (let i = 0; i < 3; i++) parts.push(scale(sphereCenter(50 + i * 22, [0, 0, 0], "Southsands_Smoke", 8), [1, 1, 0.8]).map((p) => ({ geo: p.geo.translate(20 + i * 30, -10 + i * 16, 330 + i * 110), mat: p.mat })));
  return merge(...parts);
}

// หินกระเด็นจากหลุม: slabs of the ground the falling star threw out of its crater, tipped up on
// edge round its rim, scorched dark, splashes of glass on them.
function ejectaRocks(): Geo {
  const rnd = seeded(111), parts: Geo[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rnd() * 0.5, d = 60 + rnd() * 140, s = 0.6 + rnd() * 0.6;
    const slabRock = rotateY(reuv(rock([200 * s, 150 * s, 90 * s], 0.3, 112 + i, i % 3 ? "Southsands_Scorch" : "Southsands_Fused", true)), -35 - rnd() * 25);
    parts.push(translate(rotateZ(slabRock, (a * 180) / Math.PI), [Math.cos(a) * d, Math.sin(a) * d, -20]));
  }
  const glaze = coverTop(parts.flat(), "Southsands_GlassDark", { amount: 0.35, thick: 2, seed: 113, patches: 0.6 });
  return merge(...parts, glaze, cap(300, 260, 26, [0, 0, 0], "Southsands_Fused"));
}

// ท่อแก้วฟ้าผ่า: fulgurites, where lightning ran into the sand and fused it to tubes of rough glass,
// dug out by the wind, branching up out of a low mound.
function fulgurite(): Geo {
  const parts: Geo[] = [cap(170, 150, 34, [0, 0, 0], "Southsands_Fused")];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.3;
    parts.push(grow({ mat: i % 2 ? "Southsands_GlassDark" : "Southsands_GlassGreen", seed: 121 + i, at: [Math.cos(a) * 40, Math.sin(a) * 40, 10], dir: [Math.cos(a) * 0.35, Math.sin(a) * 0.35, 1], len: 90 + i * 20, r: 9, depth: 2, spread: 0.7, shrink: 0.75, wobble: 1.1 }));
  }
  return merge(...parts);
}

// แผ่นทรายหลอมแก้ว: a patch of sand fused by lightning into plates of green glass, cracked apart,
// flush with the ground (walked over).
function glassCrust(): Geo {
  const rnd = seeded(131), parts: Geo[] = [slab(blob(420, 360, 132, 24, 0.16), -2, 1.5, "Southsands_Fused")];
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 300, r = 50 + rnd() * 70;
    parts.push(facet(slab(blob(r, r * (0.6 + rnd() * 0.4), 133 + i, 7, 0.3), 0, 3 + rnd() * 2, i % 6 ? "Southsands_GlassGreen" : "Southsands_GlassDark", [Math.cos(a) * d, Math.sin(a) * d])));
  }
  return merge(...parts);
}

// หินไหม้เกรียม: boulders scorched black, a glassy glaze run over their tops.
function scorchedRock(): Geo {
  const parts: Geo[] = [R([240, 200, 160], 141, [0, 0, -10], 0, "Southsands_Scorch", 0.4), R([150, 130, 100], 142, [150, 110, -8], 40, "Southsands_Scorch", 0.4), R([90, 80, 60], 143, [-120, 120, -5], 80, "Southsands_Meteor", 0.4)];
  return merge(...parts, coverTop(parts.flat(), "Southsands_GlassDark", { amount: 0.4, thick: 2.5, seed: 144 }));
}

// ================================================================== the waterfall gorge

// น้ำตกสองชั้นหน้าผา: a stream runs over the plateau (from +X) to the lip at x = 150, 5 m up, falls
// onto a ledge of rock half way down, foams there and falls again into a pool at the foot (on the
// low ground, at the water's level), in mist. Stand it with its +X into the plateau, the lip on
// the plateau's edge (and keep the cliff as drawn there).
function waterfall(): Geo {
  const H = 500, LIP = 150, W = 220, LEDGE = 230, out: Geo[] = [], rnd = seeded(151);
  // on top: the stream's last run to the lip, banked with mossy rocks
  out.push(sboxAt([780, 2 * W, 6], [LIP + 390, 0, H - 3], "Southsands_Water"));
  out.push(cylinderBetween([LIP + 4, -W, H + 4], [LIP + 4, W, H + 4], 9, 6, "Southsands_Foam"));
  for (let i = 0; i < 6; i++)
    for (const s of [-1, 1]) out.push(R([150 + (i % 3) * 30, 110, 70 + (i % 2) * 40], 152 + i * 2 + s, [LIP + 40 + i * 130, s * (W + 40), H - 20], rnd() * 90, "Southsands_WetRock", 0.4));
  // the ledge half way down: a shelf of rock standing out of the face
  const ledge = R([200, 2 * W + 120, 120], 160, [LIP - 70, 0, LEDGE - 100], 0, "Southsands_WetRock", 0.25, true);
  out.push(ledge, coverTop(ledge, "Southsands_Moss", { amount: 0.3, patches: 0.5, seed: 161 }));
  // the face behind (so the falls read against dark wet rock even where the cliff leans back)
  out.push(sboxAt([40, 2 * W + 60, H], [LIP - 15, 0, 0], "Southsands_WetRock"));
  // the two falls, white streaks down them
  const top: P2[] = [[LIP + 4, H + 4], [LIP - 22, H - 30], [LIP - 44, H - 100], [LIP - 60, H - 170], [LIP - 70, LEDGE + 8]];
  const low: P2[] = [[LIP - 150, LEDGE + 2], [LIP - 175, LEDGE - 40], [LIP - 196, LEDGE - 110], [LIP - 210, LEDGE - 180], [LIP - 222, -12]];
  out.push(fallSheet(top, -W + 10, W - 10, 10, "Southsands_Water", 171, 6), fallSheet(low, -W - 20, W + 20, 10, "Southsands_Water", 172, 6));
  for (let i = 0; i < 9; i++) {
    const y = -W + 30 + rnd() * (2 * W - 60), w = 14 + rnd() * 26;
    out.push(fallSheet(top.map(([x, z]) => [x - 4, z] as P2), y - w / 2, y + w / 2, 1, "Southsands_Foam", 180 + i, 4));
    out.push(fallSheet(low.map(([x, z]) => [x - 4, z] as P2), y - w / 2 - 10, y + w / 2 + 10, 1, "Southsands_Foam", 190 + i, 4));
  }
  // foam on the ledge's water and in the pool, spray and mist
  out.push(sboxAt([110, 2 * W, 5], [LIP - 110, 0, LEDGE - 2], "Southsands_Water"));
  for (let i = 0; i < 8; i++) out.push(translate(scale(sphereCenter(26 + rnd() * 20, [0, 0, 0], "Southsands_Foam", 8), [1.2, 1, 0.3]), [LIP - 100 - rnd() * 60, (rnd() - 0.5) * 2 * W, LEDGE + 4]));
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI - Math.PI / 2, r = 40 + rnd() * 150;
    out.push(translate(scale(sphereCenter(36 + rnd() * 40, [0, 0, 0], "Southsands_Foam", 8), [1.2, 1, 0.24]), [LIP - 240 - Math.cos(a) * r * 0.6, Math.sin(a) * (W + 30) * 0.9, -9]));
  }
  for (const [x, y, z, r] of [[-120, -60, 40, 70], [-90, 90, 50, 60], [-170, 10, 30, 80]]) out.push(scale(sphereCenter(r, [0, 0, 0], "Southsands_Mist", 10), [1.3, 1.3, 0.6]).map((p) => ({ geo: p.geo.translate(x, y, z), mat: p.mat })));
  // rocks at the foot, either side, moss on the ones the spray reaches
  for (const s of [-1, 1]) {
    const foot = merge(R([220, 180, 170], 200 + s, [40, s * (W + 80), -20], 30, "Southsands_WetRock", 0.4), R([130, 110, 90], 203 + s, [-130, s * (W + 40), -30], 70, "Southsands_WetRock", 0.4), R([90, 80, 60], 206 + s, [-260, s * (W - 10), -30], 10, "Southsands_SandRock", 0.4));
    out.push(foot, coverTop(foot, "Southsands_Moss", { amount: 0.45, seed: 207 + s }));
    // ferns of moss hanging off the face beside the falls
    for (let k = 0; k < 3; k++) out.push(limb([[LIP - 30, s * (W + 30 + k * 30), H - 10], [LIP - 60, s * (W + 40 + k * 30), H - 120 - k * 30], [LIP - 70, s * (W + 35 + k * 30), H - 240 - k * 40]], 4, 2, "Southsands_Vine", { seg: 4 }));
  }
  return merge(...out);
}

// ลำธารบนผา (4 ม.): a straight 4 m run of a shallow stream over level ground (along X), stones in
// its bed breaking the water, pebbled banks; laid end to end to bring a stream to the falls.
function streamRun(): Geo {
  const rnd = seeded(211), out: Geo[] = [sboxAt([400, 300, 4], [0, 0, -1], "Southsands_Water")];
  for (const s of [-1, 1]) {
    out.push(sboxAt([400, 50, 3], [0, s * 170, -1.5], "Southsands_WetSand"));
    for (let k = 0; k < 5; k++) out.push(R([40 + rnd() * 50, 34 + rnd() * 40, 26 + rnd() * 20], 212 + k + (s > 0 ? 10 : 0), [-180 + k * 90 + rnd() * 40, s * (160 + rnd() * 30), -6], rnd() * 180, rnd() < 0.6 ? "Southsands_WetRock" : "Southsands_SandRock", 0.4));
  }
  for (let k = 0; k < 3; k++) {
    const x = -130 + k * 130 + rnd() * 40, y = (rnd() - 0.5) * 160;
    out.push(R([50, 44, 30], 230 + k, [x, y, -12], rnd() * 180, "Southsands_WetRock", 0.35));
    out.push(translate(scale(sphereCenter(26, [0, 0, 0], "Southsands_Foam", 8), [0.6, 1.2, 0.18]), [x + 24, y, 3]), translate(scale(sphereCenter(20, [0, 0, 0], "Southsands_Foam", 6), [1.8, 0.5, 0.12]), [x - 40, y, 3]));
  }
  return merge(...out);
}

// หินกลางลำธาร: dark wet rocks standing out of a river (their feet under the water) with white water
// streaming past them toward -X.
function riverRocks(): Geo {
  const out: Geo[] = [], rnd = seeded(241);
  const rocks: [number, number, number, number][] = [[0, 0, 160, 100], [130, -120, 110, 70], [-120, 110, 120, 60], [170, 120, 90, 50], [-170, -90, 80, 44], [40, 200, 70, 40]];
  for (const [x, y, s, h] of rocks) {
    const r = translate(rotateZ(reuv(rock([s, s * 0.8, h + 34], 0.35, 242 + Math.round(x + y) % 40, "Southsands_WetRock")), rnd() * 180), [x, y, -34]);
    out.push(r);
    if (h > 50) out.push(coverTop(r, "Southsands_Moss", { amount: 0.3, patches: 0.6, seed: 250 + x }));
    out.push(translate(scale(sphereCenter(s * 0.5, [0, 0, 0], "Southsands_Foam", 8), [0.6, 1.1, 0.16]), [x + s * 0.42, y, -9]));
    for (let k = 1; k <= 3; k++) out.push(translate(scale(sphereCenter(s * 0.34, [0, 0, 0], "Southsands_Foam", 8), [1.6, 0.5, 0.12]), [x - s * 0.4 - k * 60, y + (rnd() - 0.5) * 30, -10]));
  }
  return merge(...out);
}

// สะพานเชือก (14 ม.): a rope bridge along X, 14 m between its posts: a plank deck on two
// stringers, the planks uneven (a few missing), handropes sagging between the post pairs with
// hangers down to the deck and netting along the sides, guy ropes back to stakes. It is walked
// on: the deck's top is at z = 0 at the ends.
function ropeBridge(): Geo {
  const L = 1400, Wd = 230, half = L / 2, rnd = seeded(261), parts: Geo[] = [];
  const sag = (x: number) => -8 * (1 - (x / half) ** 2);
  for (let x = -half + 16; x <= half - 16; x += 30) {
    if (rnd() < 0.05 && Math.abs(x) < half - 200) continue;
    const w = Wd + (rnd() - 0.5) * 20;
    parts.push(translate(rotateZ(sboxAt([24, w, 5], [0, 0, -5], rnd() < 0.5 ? "Southsands_Plank" : "Southsands_Driftwood", 1), (rnd() - 0.5) * 5), [x, (rnd() - 0.5) * 6, sag(x)]));
  }
  for (const y of [-Wd / 2 + 18, Wd / 2 - 18])
    for (let i = 0; i < 10; i++) {
      const a = -half + (L * i) / 10, b = -half + (L * (i + 1)) / 10;
      parts.push(beamBetween([a, y, sag(a) - 11], [b, y, sag(b) - 11], 11, 9, "Southsands_DriftDark"));
    }
  for (const sx of [-1, 1]) {
    const x = sx * (half + 15);
    for (const sy of [-1, 1]) {
      const y = sy * (Wd / 2 + 16);
      parts.push(cylinderAt({ rBot: 15, rTop: 12, height: 240, segments: 8, bottom: [x, y, -30] }, "Southsands_DriftDark"));
      parts.push(torus(15, 3, 10, 4, "Southsands_Rope").map((p) => ({ geo: p.geo.translate(x, y, 190), mat: p.mat })));
      parts.push(R([70, 60, 40], 262 + sx + sy * 2, [x + sx * 20, y, -14], 0, "Southsands_WetRock", 0.4));
      const sk: V3 = [x + sx * 120, y + sy * 30, 0];
      parts.push(cylinderBetween([x, y, 196], [sk[0], sk[1], 20], 2.5, 4, "Southsands_Rope"));
      parts.push(cylinderBetween([sk[0] - sx * 8, sk[1], -10], [sk[0] + sx * 6, sk[1], 32], 5, 5, "Southsands_DriftDark", 4));
    }
    parts.push(beamBetween([x, -Wd / 2 - 30, 200], [x, Wd / 2 + 30, 200], 14, 14, "Southsands_DriftDark"));
  }
  for (const sy of [-1, 1]) {
    const y = sy * (Wd / 2 + 16);
    const high = sagLine([-half - 15, y, 186], [half + 15, y, 186], 70, 24), mid = sagLine([-half - 15, y, 100], [half + 15, y, 100], 45, 24);
    parts.push(rope(high, 3.2), rope(mid, 2.4));
    for (let i = 1; i < 24; i++) {
      const p = high[i];
      parts.push(cylinderBetween(p, [p[0], y * 0.92, sag(p[0]) + 1], 1.3, 3, "Southsands_Rope"));
    }
    parts.push(cloth((u, v) => {
      const x = -half + u * L, zTop = 100 - 45 * 4 * u * (1 - u);
      return [x, y * 0.97, sag(x) + 2 + (zTop - sag(x) - 2) * v];
    }, 14, 2, "Southsands_Net"));
  }
  return merge(...parts);
}

// ม่านเถาวัลย์หน้าผา: lianas hanging from a mossy lip down a 5 m cliff face toward -X, leaves along
// them. Stand it on the plateau's edge, its -X over the drop.
function cliffVines(): Geo {
  const rnd = seeded(271), parts: Geo[] = [];
  const lip = merge(R([120, 380, 50], 272, [30, 0, -18], 0, "Southsands_WetRock", 0.3, true));
  parts.push(lip, coverTop(lip, "Southsands_Moss", { amount: 0.8, thick: 4, seed: 273 }));
  for (let i = 0; i < 11; i++) {
    const y = -170 + i * 34 + (rnd() - 0.5) * 20, l = 220 + rnd() * 280, pts: V3[] = [];
    for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push([-10 - 30 * t - 25 * Math.sin(t * 3 + i), y + 12 * Math.sin(t * 5 + i), 10 - l * t]); }
    parts.push(limb(pts, 3.5, 1.8, "Southsands_Vine", { seg: 4 }));
    for (let k = 1; k < 6; k++) {
      const t = k / 6, p = pts[Math.min(5, Math.round(t * 5))];
      parts.push(translate(rotateZ(scale(sphereCenter(14 + rnd() * 10, [0, 0, 0], rnd() < 0.5 ? "Southsands_VineLeaf" : "Southsands_MossDark", 5), [0.5, 1.2, 0.9]), rnd() * 60), [p[0] - 4, p[1] + (rnd() - 0.5) * 20, p[2] + (rnd() - 0.5) * 30]));
    }
  }
  return merge(...parts);
}

// ดอกบัวผุดยักษ์บาน: a giant rafflesia in bloom on the forest floor, five thick red petals warted
// white round a cup with a dark mouth full of spines, a haze of spores over it; two buds like
// dark cabbages beside it on the vine it lives on.
function rafflesiaBloom(): Geo {
  const rnd = seeded(281), parts: Geo[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 360 + 18;
    const petal: Geo[] = [scale(sphereCenter(1, [0, 0, 0], "Southsands_Petal", 12), [72, 58, 15])];
    for (let k = 0; k < 9; k++) {
      const u = (rnd() - 0.5) * 1.3, v = (rnd() - 0.5) * 1.3;
      if (u * u + v * v > 0.7) continue;
      petal.push(sphereCenter(5 + rnd() * 5, [u * 72, v * 58, 15 * Math.sqrt(1 - u * u - v * v) - 1], "Southsands_Wart", 6));
    }
    parts.push(translate(rotateZ(translate(rotateY(merge(...petal), -8), [84, 0, 12]), a), [0, 0, 0]));
  }
  parts.push(cylinderAt({ rBot: 54, rTop: 46, height: 42, segments: 14, bottom: [0, 0, 0] }, "Southsands_PetalDeep"));
  parts.push(torus(44, 8, 16, 6, "Southsands_Petal").map((p) => ({ geo: p.geo.translate(0, 0, 42), mat: p.mat })));
  parts.push(cylinderAt({ radius: 38, height: 3, segments: 14, bottom: [0, 0, 32] }, "Southsands_FlowerCore"));
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 28;
    parts.push(cylinderAt({ rBot: 3, rTop: 0.5, height: 10 + rnd() * 8, segments: 4, bottom: [Math.cos(a) * d, Math.sin(a) * d, 34] }, "Southsands_Wart"));
  }
  for (let i = 0; i < 4; i++) parts.push(sphereCenter(30 + i * 10, [(rnd() - 0.5) * 30, (rnd() - 0.5) * 30, 70 + i * 34], "Southsands_Spore", 8));
  // the buds and the vine
  for (const [x, y, r] of [[150, 120, 26], [-120, 170, 20]] as V3[]) {
    parts.push(scale(sphereCenter(r, [0, 0, 0], "Southsands_Bud", 10), [1, 1, 0.8]).map((p) => ({ geo: p.geo.translate(x, y, r * 0.6), mat: p.mat })));
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; parts.push(translate(rotateZ(rotateY(scale(sphereCenter(r * 0.6, [0, 0, 0], "Southsands_Bud", 6), [0.4, 1, 0.9]), 25), (a * 180) / Math.PI), [x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.5])); }
  }
  parts.push(limb([[-260, 40, 4], [-120, 80, 8], [0, 40, 6], [140, 110, 6], [240, 200, 4]], 7, 5, "Southsands_Vine", { seg: 5 }));
  parts.push(cap(170, 160, 8, [0, 0, 0], "Southsands_MossDark"));
  return merge(...parts);
}

// แท่นศิลาสลัก: a carved stela of the people who built the pyramid, a face and glyphs cut in its
// front (-X), an altar stone before it with offerings, vines and moss over it.
function carvedStela(): Geo {
  const S = "Southsands_Carved", D = "Southsands_TempleDark", parts: Geo[] = [
    sboxAt([90, 120, 30], [0, 0, 0], D, 4), sboxAt([56, 96, 290], [0, 0, 30], S, 4), sboxAt([66, 108, 26], [0, 0, 320], D, 4),
  ];
  // the face: brow, eyes, nose, mouth; glyph panels under it
  parts.push(sboxAt([8, 80, 10], [-30, 0, 268], D, 2), sboxAt([6, 18, 14], [-30, -18, 246], "Southsands_Jade", 2), sboxAt([6, 18, 14], [-30, 18, 246], "Southsands_Jade", 2));
  parts.push(sboxAt([10, 14, 30], [-32, 0, 214], S, 2), sboxAt([7, 44, 8], [-30, 0, 196], D, 2));
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) parts.push(sboxAt([4, 34, 30], [-29, -20 + c * 40, 50 + r * 36], D, 3));
  parts.push(sboxAt([70, 110, 40], [-110, 0, 0], D, 6), sboxAt([60, 96, 6], [-110, 0, 40], S, 2));
  parts.push(sphereCenter(9, [-112, -24, 52], "Southsands_Petal", 8), sphereCenter(7, [-104, 12, 50], "GoldTrim", 6), cylinderAt({ radius: 8, height: 12, segments: 8, bottom: [-118, 30, 46] }, "Southsands_Clay"));
  const body = merge(...parts);
  parts.push(coverTop(body, "Southsands_Moss", { amount: 0.25, patches: 0.6, seed: 291 }));
  for (let i = 0; i < 5; i++) {
    const y = -40 + i * 20;
    parts.push(limb([[20, y, 340], [-34, y + 6, 300], [-36, y - 8, 200 - i * 30], [-34, y + 4, 60 + i * 20]], 2.5, 1.6, "Southsands_Vine", { seg: 4 }));
  }
  return merge(...parts);
}

// พีระมิดขั้นบันไดคลุมเถาวัลย์: the stepped pyramid in the gorge's jungle, 18 m square at its foot and
// six battered tiers high, a cornice round each tier and panels of carving in its faces; a steep
// stair up its front (-X) between serpent balustrades to the shrine on top, with its doorway and
// roof comb; moss over its tops, vines hanging down its faces, blocks fallen from its corners.
function stepPyramid(): Geo {
  const T = "Southsands_Temple", D = "Southsands_TempleDark", C = "Southsands_Carved", rnd = seeded(301);
  const tiers: Geo[] = [], deco: Geo[] = [];
  const N = 6, TH = 185, half = (k: number) => 900 - k * 125;
  for (let k = 0; k < N; k++) {
    const b = half(k) * 2, t = b - 40, z = k * TH;
    tiers.push(frustum(b, b, t, t, TH - 20, [0, 0, z], T));
    tiers.push(sboxAt([t + 30, t + 30, 20], [0, 0, z + TH - 20], D, 3));
    // panels in each face
    for (const [ax, sgn] of [[0, -1], [0, 1], [1, -1], [1, 1]] as [number, number][]) {
      const n = Math.max(1, Math.floor(b / 340));
      for (let i = 0; i < n; i++) {
        const along = -b / 2 + (i + 0.5) * (b / n);
        if (ax === 0 && sgn < 0 && Math.abs(along) < 280) continue; // the stair
        const off = sgn * (b / 2 - 14), size: V3 = ax === 0 ? [8, b / n - 70, TH - 80] : [b / n - 70, 8, TH - 80];
        deco.push(sbox(size, ax === 0 ? [off, along, z + TH / 2 - 10] : [along, off, z + TH / 2 - 10], C, 2));
        if (k < 3) deco.push(sbox(ax === 0 ? [10, 30, 30] : [30, 10, 30], ax === 0 ? [off + sgn * 4, along, z + TH / 2 - 10] : [along, off + sgn * 4, z + TH / 2 - 10], D, 3));
      }
    }
  }
  const topZ = N * TH;
  // the stair: steps from the ground up the front to the top tier, deep into the core
  const run0 = -half(0) - 250, run1 = -half(N - 1) + 20, steps = 40;
  for (let i = 0; i < steps; i++) {
    const x = run0 + ((run1 - run0) * i) / steps, z = ((i + 1) * topZ) / steps;
    deco.push(sboxAt([run1 - x + 60, 380, z - (i ? (i * topZ) / steps : 0)], [(x + run1 + 60) / 2, 0, i ? (i * topZ) / steps : 0], i % 2 ? T : D, 1.5));
  }
  for (const s of [-1, 1]) {
    deco.push(beamBetween([run0 - 20, s * 215, 40], [run1, s * 215, topZ + 30], 50, 60, D));
    // the serpent's head at the foot of each balustrade
    deco.push(sboxAt([90, 70, 70], [run0 - 60, s * 215, 0], C, 8), sboxAt([30, 60, 24], [run0 - 110, s * 215, 20], D, 4), sphereCenter(8, [run0 - 100, s * 215 + 22, 54], "Southsands_Jade", 6), sphereCenter(8, [run0 - 100, s * 215 - 22, 54], "Southsands_Jade", 6));
  }
  // the shrine on top: walls, a dark doorway to -X, a stepped roof and a comb of carved stone
  const sh = half(N - 1) - 40;
  deco.push(sboxAt([sh * 2 - 60, sh * 2 - 60, 250], [40, 0, topZ], T, 4));
  deco.push(sboxAt([6, 110, 190], [40 - sh + 28, 0, topZ], "Southsands_Dark"));
  deco.push(sboxAt([24, 150, 30], [40 - sh + 22, 0, topZ + 190], C, 3));
  for (const s of [-1, 1]) deco.push(sboxAt([20, 30, 190], [40 - sh + 24, s * 70, topZ], D, 3));
  deco.push(sboxAt([sh * 2 - 20, sh * 2 - 20, 40], [40, 0, topZ + 250], D, 4), sboxAt([sh * 2 - 100, sh * 2 - 100, 40], [40, 0, topZ + 290], T, 4));
  deco.push(sboxAt([40, sh * 2 - 140, 170], [60, 0, topZ + 330], C, 4));
  for (let i = 0; i < 4; i++) deco.push(sboxAt([46, 30, 40], [60, -sh + 110 + i * ((sh * 2 - 220) / 3), topZ + 380], "Southsands_Jade", 3));
  // blocks fallen at the foot
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2, d = 980 + rnd() * 260;
    if (Math.cos(a) < -0.7) continue;
    deco.push(translate(rotateZ(rotateY(sbox([70 + rnd() * 40, 50 + rnd() * 30, 40 + rnd() * 20], [0, 0, 0], rnd() < 0.5 ? T : D, 4), (rnd() - 0.5) * 40), rnd() * 90), [Math.cos(a) * d, Math.sin(a) * d, 12]));
  }
  const body = merge(...tiers, ...deco);
  const moss = coverTop(merge(...tiers), "Southsands_Moss", { amount: 0.12, thick: 5, seed: 302, patches: 0.45, grain: 70 });
  // vines hanging down the faces from the tiers' edges
  const vines: Geo[] = [];
  for (let k = 1; k < N; k++)
    for (let i = 0; i < 7; i++) {
      const side = Math.floor(rnd() * 4), along = (rnd() - 0.5) * (half(k) * 2 - 120), e = half(k) - 10, z = k * TH;
      if (side === 0 && Math.abs(along) < 300) continue;
      const out = (d: number): [number, number] => (side === 0 ? [-e - d, along] : side === 1 ? [e + d, along] : side === 2 ? [along, -e - d] : [along, e + d]);
      const l = 140 + rnd() * 240, pts: V3[] = [];
      for (let j = 0; j <= 4; j++) { const t = j / 4, [x, y] = out(10 + (l * t * 125) / TH); pts.push([x, y, z + 2 - l * t]); }
      vines.push(limb(pts, 4, 2, "Southsands_Vine", { seg: 4 }));
      for (let j = 0; j < 4; j++) {
        const p = pts[j + 1];
        vines.push(translate(scale(sphereCenter(18 + rnd() * 12, [0, 0, 0], rnd() < 0.6 ? "Southsands_VineLeaf" : "Southsands_MossDark", 5), [1, 1, 0.7]), [p[0], p[1], p[2] + 10]));
      }
    }
  return merge(body, moss, ...vines);
}

// ================================================================== the kit

function sample(put: Put): void {
  // the inner sea's shore along -Y: the trader wrecked on the sand, a rowing boat drawn up, a
  // fisherman's hut and his net rack; the salt pans and heaps behind the beach, the spring under
  // its palms, red dunes; the glass cape's spires and its fallen star at the back
  put("sail_wreck", [-500, -1700, 0], 20, 0.55);
  put("beached_boat", [900, -1900, 0], 120);
  put("fisher_hut", [1200, -700, 0], 0, 0.9);
  put("net_rack", [400, -800, 0], 10);
  put("salt_pans", [-900, 300, 0], 0);
  put("salt_heap", [-1500, 1300, 0], 30);
  put("salt_flat", [-300, 1200, 0], 0, 0.6);
  put("cow_skull", [600, 600, 0], 40);
  put("cow_skull", [-1900, -900, 0], 200, 0.8);
  put("spring_pool", [1400, 900, 0], 0);
  for (const [x, y, h] of [[1700, 1250, 20], [1150, 1300, 100], [1750, 600, 200]]) put("flora:Palm", [x, y, 0], h, 0.9);
  put("red_dune", [-1500, 2000, 0], 200);
  put("red_dune", [1900, 2000, 0], 160, 0.7);
  put("glass_spires", [400, 2000, 0], 0, 0.6);
  put("glass_shard", [1100, 2000, 0], 40);
  put("meteorite", [-400, 2000, 0], 0, 0.5);
  put("fulgurite", [-1900, 600, 0], 0);
  put("glass_crust", [300, 1500, 0], 0, 0.6);
}

export const KIT: Kit = {
  id: "southsands",
  name: "ทรายริมทะเลและหุบผาน้ำตก",
  region: "รอบทะเลทรายใหญ่",
  desc: "เนินทรายแดงกับลานเกลือริมทะเลใน ซากเรือใบเกยตื้น ทะเลทรายแก้วที่ฟ้าผ่าและดาวตกหลอมทรายจนเป็นแก้ว และหุบผาป่าดิบที่มีน้ำตกสองชั้น สะพานเชือก ดอกบัวผุดยักษ์ กับพีระมิดขั้นบันไดใต้เถาวัลย์",
  ground: "sand",
  sea: true,
  items: [
    { id: "red_dune", name: "สันเนินทรายแดง", make: redDune, tags: ["ground", "decor"] },
    { id: "salt_flat", name: "ลานเกลือขาว (16 ม.)", make: saltFlat, tags: ["ground"] },
    { id: "salt_pans", name: "นาเกลือ", make: saltPans, tags: ["ground", "decor"] },
    { id: "salt_heap", name: "กองเกลือ", make: saltHeap, tags: ["decor", "market"] },
    { id: "fisher_hut", name: "กระท่อมชาวประมง", make: fisherHut, tags: ["building"] },
    { id: "net_rack", name: "ราวตากแห", make: netRack, tags: ["decor"] },
    { id: "beached_boat", name: "เรือไม้เกยหาด", make: beachedBoat, tags: ["boat", "decor"] },
    { id: "sail_wreck", name: "ซากเรือใบเกยตื้น", make: sailWreck, tags: ["landmark", "boat"] },
    { id: "cow_skull", name: "กะโหลกวัวฟอกขาว", make: cowSkull, tags: ["decor"] },
    { id: "spring_pool", name: "แอ่งน้ำพุล้อมหิน", make: springPool, tags: ["decor", "water"] },
    { id: "glass_spires", name: "ยอดแก้วใส", make: glassSpires, tags: ["landmark", "magic"] },
    { id: "glass_shard", name: "เศษแก้วปักทราย", make: glassShard, tags: ["decor"] },
    { id: "glass_tree", name: "ต้นไม้แก้ว", make: glassTree, tags: ["landmark", "plant"] },
    { id: "meteorite", name: "ก้อนดาวตกเรืองแสง", make: meteorite, tags: ["landmark", "magic"] },
    { id: "ejecta_rocks", name: "หินกระเด็นจากหลุมอุกกาบาต", make: ejectaRocks, tags: ["decor"] },
    { id: "fulgurite", name: "ท่อแก้วฟ้าผ่า", make: fulgurite, tags: ["decor"] },
    { id: "glass_crust", name: "แผ่นทรายหลอมแก้ว", make: glassCrust, tags: ["ground"] },
    { id: "scorched_rock", name: "หินไหม้เกรียม", make: scorchedRock, tags: ["decor"] },
    { id: "waterfall", name: "น้ำตกสองชั้นหน้าผา (5 ม.)", make: waterfall, tags: ["water", "landmark"] },
    { id: "stream_run", name: "ลำธารบนผา (4 ม.)", make: streamRun, tags: ["ground", "water"] },
    { id: "river_rocks", name: "หินกลางลำธาร", make: riverRocks, tags: ["water", "decor"] },
    { id: "rope_bridge", name: "สะพานเชือก (14 ม.)", make: ropeBridge, tags: ["bridge"] },
    { id: "cliff_vines", name: "ม่านเถาวัลย์หน้าผา", make: cliffVines, tags: ["plant", "decor"] },
    { id: "rafflesia_bloom", name: "ดอกบัวผุดยักษ์บาน", make: rafflesiaBloom, tags: ["plant", "decor"] },
    { id: "carved_stela", name: "แท่นศิลาสลัก", make: carvedStela, tags: ["decor", "landmark"] },
    { id: "step_pyramid", name: "พีระมิดขั้นบันไดคลุมเถาวัลย์", make: stepPyramid, tags: ["landmark"] },
  ],
  sample,
};

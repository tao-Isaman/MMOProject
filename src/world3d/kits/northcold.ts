// แม่น้ำเยือกแข็งและเขาเหนือ (the northcold field kit): the cold country round Highland Hill.
// For the frozen river between Noa and the snow: plates of river ice to walk on, ridges of ice
// heaved up where it cracked, floes drifting in the open water, marker poles of the ice road, an
// old stone bridge of arches (a span, the span that fell, the ramp up from the bank), the
// ferryman's hut and his landing with the ferry frozen in, rowboats caught in the ice, frozen
// reeds. For the sea cliffs of the north: a ruined lighthouse, sea stacks, seabird rocks, rocks
// glazed with ice, a shipwreck on the shingle, banks of shingle and driftwood, grass flattened
// by the wind under the snow. For the tangled hills: the hermit's cave mouth, the adit of an
// abandoned silver mine, the miners' shack and an ore cart off its rails.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front facing -X.
// The pieces that stand in water (the floes, the bridge, the sea stacks) have z = 0 at the
// water's surface.

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, torus, gableRoof, gableWall, rock,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import type { Kit } from "./types";

// ---- the kit's own materials ----
defineMaterial("Northcold_Granite", { map: "crag", tint: "#9ea4ad", bump: 3 });
defineMaterial("Northcold_GraniteDark", { map: "crag", tint: "#6c717b", bump: 3 });
defineMaterial("Northcold_SeaRock", { map: "crag", tint: "#5f646d", bump: 3.5 });
defineMaterial("Northcold_SeaRockLight", { map: "crag", tint: "#878d96", bump: 3 });
defineMaterial("Northcold_Earth", { map: "adobe", tint: "#5a4838", bump: 1.5 });
// river ice: snowy white ice, clear dark ice, the white of its cracks; floes; a glaze on rocks
defineMaterial("Northcold_ShoreIce", { map: "ice", tint: "#cfe2ec", rough: 0.35 });
defineMaterial("Northcold_RiverIce", { map: "ice", tint: "#9cc6dc", rough: 0.12 });
defineMaterial("Northcold_RiverIceDark", { map: "ice", tint: "#5f93b3", rough: 0.08 });
defineMaterial("Northcold_IceCrack", { tint: "#eef8ff", rough: 0.5 });
defineMaterial("Northcold_Floe", { map: "ice", tint: "#e2f0f7", rough: 0.4 });
defineMaterial("Northcold_FloeSide", { map: "ice", tint: "#7fb8d4", rough: 0.15 });
defineMaterial("Northcold_Glaze", { map: "ice", tint: "#c6e8f6", rough: 0.06, opacity: 0.82 });
defineMaterial("Northcold_Icicle", { map: "ice", tint: "#d8f0fa", rough: 0.08, opacity: 0.9 });
// the old bridge and the lighthouse: grey stone gone dark with age, lichen, stains
defineMaterial("Northcold_BridgeStone", { map: "stone", tint: "#a19e95", bump: 2.2 });
defineMaterial("Northcold_BridgeStoneDark", { map: "stone", tint: "#7c7a74", bump: 2.2 });
defineMaterial("Northcold_Coping", { map: "stone", tint: "#b7b3a8", bump: 1.8 });
defineMaterial("Northcold_Lichen", { map: "felt", tint: "#a3a05e", rough: 1 });
defineMaterial("Northcold_Stain", { map: "plaster", tint: "#57534c", rough: 1 });
defineMaterial("Northcold_Whitewash", { map: "plaster", tint: "#d9d6cb", bump: 0.8 });
defineMaterial("Northcold_FadedRed", { map: "plaster", tint: "#8c3f35", bump: 0.8 });
// timber gone grey in the cold, the ferryman's tarred boards, hides, a red rag
defineMaterial("Northcold_Timber", { map: "wood", tint: "#6d5c4b", bump: 1.3 });
defineMaterial("Northcold_Plank", { map: "wood", tint: "#9b8c79", bump: 1.2 });
defineMaterial("Northcold_Tar", { map: "wood", tint: "#3b322c", bump: 1.2 });
defineMaterial("Northcold_Hull", { map: "wood", tint: "#55473c", bump: 1.4 });
defineMaterial("Northcold_HullPaint", { map: "plaster", tint: "#3d5a73", rough: 0.85 });
defineMaterial("Northcold_Hide", { map: "felt", tint: "#7a5a3e", rough: 1 });
defineMaterial("Northcold_Rag", { map: "fabric", tint: "#b23a2c", rough: 0.95 });
defineMaterial("Northcold_Sail", { map: "fabric", tint: "#cfc4a8", rough: 0.95 });
// reeds and grass, frosted
defineMaterial("Northcold_Reed", { map: "thatch", tint: "#b29c6a", rough: 1 });
defineMaterial("Northcold_ReedFrost", { map: "thatch", tint: "#dfe3df", rough: 0.9 });
defineMaterial("Northcold_Cattail", { map: "felt", tint: "#5b3c26", rough: 1 });
defineMaterial("Northcold_Grass", { map: "thatch", tint: "#a99d69", rough: 1 });
defineMaterial("Northcold_GrassPale", { map: "thatch", tint: "#c9c39a", rough: 1 });
// the shore: pebbles, driftwood, kelp; the birds and their droppings
defineMaterial("Northcold_Pebble", { map: "stone", tint: "#8e8a83", bump: 1 });
defineMaterial("Northcold_PebbleDark", { map: "stone", tint: "#5d5b58", bump: 1 });
defineMaterial("Northcold_PebbleLight", { map: "stone", tint: "#bdb8ad", bump: 1 });
defineMaterial("Northcold_Driftwood", { map: "bark", tint: "#a99d8c", bump: 1.5 });
defineMaterial("Northcold_Kelp", { map: "felt", tint: "#3f3a22", rough: 0.7 });
defineMaterial("Northcold_Guano", { map: "plaster", tint: "#efeee6", rough: 1 });
defineMaterial("Northcold_Feather", { map: "felt", tint: "#f2f2ee", rough: 1 });
defineMaterial("Northcold_FeatherGrey", { map: "felt", tint: "#8c9399", rough: 1 });
defineMaterial("Northcold_FeatherDark", { map: "felt", tint: "#25272b", rough: 1 });
defineMaterial("Northcold_Beak", { map: "felt", tint: "#e08a2c", rough: 0.8 });
// the mine: spoil, ore with silver in it, the dark inside a hill
defineMaterial("Northcold_Spoil", { map: "crag", tint: "#77706a", bump: 2 });
defineMaterial("Northcold_Ore", { map: "crag", tint: "#56504f", bump: 2.5 });
defineMaterial("Northcold_Silver", { map: "metal", tint: "#d4dde6", rough: 0.3, metal: 0.8 });
defineMaterial("Northcold_Rust", { map: "metal", tint: "#6e4a34", rough: 0.8, metal: 0.3 });
defineMaterial("Northcold_Dark", { tint: "#0c0b0c", rough: 1 });
defineMaterial("Northcold_HullPale", { map: "wood", tint: "#8f8172", bump: 1.2 });
defineMaterial("Northcold_HideDark", { map: "felt", tint: "#8a6544", rough: 1 });
defineMaterial("Northcold_Fish", { map: "metal", tint: "#a9b9c2", rough: 0.4, metal: 0.3 });
defineMaterial("Northcold_Frost", { map: "snow", tint: "#e1ebf6", rough: 0.85 });
defineMaterial("Northcold_Ash", { map: "felt", tint: "#625d59", rough: 1 });
defineMaterial("Northcold_Char", { map: "bark", tint: "#2f2825", bump: 2, rough: 1 });
defineMaterial("Northcold_LogEnd", { map: "adobe", tint: "#d2ab7a", bump: 0.8 });
defineMaterial("Northcold_Ember", { tint: "#ff8a3a", rough: 1, glow: "#ff5a12", glowI: 1.6 });

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

// A flattened ball (snow clumps, a bird's body).
const blob = (r: number, at: V3, mat: string, sz = 0.45, segs = 9): Geo => translate(scale(sphereCenter(r, [0, 0, 0], mat, segs), [1, 1, sz]), at);

// A triangle seen from both sides.
function tri(a: V3, b: V3, c: V3, mat: string): Geo {
  const geo = new THREE.BufferGeometry();
  const pts = [a, b, c, a, c, b];
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
  geo.computeVertexNormals();
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(pts.flatMap((p) => [(p[0] + p[1]) / 100, p[2] / 100]), 2));
  return [{ geo, mat }];
}

// A surface through rows of points, seen from both sides (a hull's planking).
function loft(rows: V3[][], mat: string): Geo {
  const pos: number[] = [];
  for (let i = 0; i + 1 < rows.length; i++)
    for (let j = 0; j + 1 < rows[i].length; j++) {
      const a = rows[i][j], b = rows[i][j + 1], c = rows[i + 1][j + 1], d = rows[i + 1][j];
      pos.push(...a, ...b, ...c, ...a, ...c, ...d, ...a, ...c, ...b, ...a, ...d, ...c);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const p = geo.getAttribute("position"), uv = new Float32Array(p.count * 2);
  for (let k = 0; k < p.count; k++) {
    uv[k * 2] = p.getX(k) / 100;
    uv[k * 2 + 1] = (p.getZ(k) + Math.abs(p.getY(k))) / 100;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return [{ geo, mat }];
}

// Snow lying on the upward faces of a shape: a copy of every face that looks up more than
// `minUp`, lifted a little off it.
function snowFacets(g: Geo, minUp = 0.55, lift = 2.5, mat = "Snow"): Geo {
  const tris: THREE.Vector3[][] = [];
  const normals = new Map<string, THREE.Vector3>();
  const key = (v: THREE.Vector3) => `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;
  for (const p of g) {
    const src = p.geo.index ? p.geo.toNonIndexed() : p.geo, P = src.getAttribute("position");
    for (let i = 0; i + 2 < P.count; i += 3) {
      const t = [0, 1, 2].map((k) => new THREE.Vector3().fromBufferAttribute(P, i + k));
      const n = new THREE.Vector3().subVectors(t[1], t[0]).cross(new THREE.Vector3().subVectors(t[2], t[0])).normalize();
      if (n.z < minUp) continue;
      tris.push(t);
      for (const v of t) {
        const m = normals.get(key(v));
        if (m) m.add(n);
        else normals.set(key(v), n.clone());
      }
    }
  }
  const pos: number[] = [];
  for (const t of tris)
    for (const v of t) {
      const n = normals.get(key(v))!.clone().normalize();
      pos.push(v.x + n.x * lift, v.y + n.y * lift, v.z + n.z * lift + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(pos.flatMap((v, i) => (i % 3 === 2 ? [] : [v / 100])), 2));
  return [{ geo, mat }];
}

// A rock with snow (or ice, or droppings) lying on its upper faces (`cover`: how much, 0..1).
function coldRock(size: V3, rough: number, seed: number, o: { mat?: string; flat?: boolean; cover?: number; coat?: string; at?: V3; turn?: number; tilt?: number } = {}): Geo {
  const body = rock(size, rough, seed, o.mat ?? "Northcold_Granite", o.flat ?? false);
  const cover = o.cover ?? 0.4;
  let g = cover > 0 ? merge(body, snowFacets(body, 0.95 - cover, 2.5, o.coat ?? "Snow")) : body;
  if (o.tilt) g = rotateY(g, o.tilt);
  if (o.turn) g = rotateZ(g, o.turn);
  return o.at ? translate(g, o.at) : g;
}

// A soft low mound lx by ly, h high, lying at `at`: a lumpy dome, smooth-shaded.
function mound(lx: number, ly: number, h: number, seed: number, at: V3 = [0, 0, 0], turn = 0, mat = "Snow"): Geo {
  const rnd = seeded(seed);
  const geo = new THREE.SphereGeometry(1, 16, 7, 0, Math.PI * 2, 0, Math.PI / 2);
  const P = geo.getAttribute("position");
  const bumps = Array.from({ length: 5 }, () => [rnd() * Math.PI * 2, 0.08 + rnd() * 0.14, 1 + Math.floor(rnd() * 3)]);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), ang = Math.atan2(z, x);
    let r = 1;
    for (const [ph, amp, k] of bumps) r += amp * Math.sin(ang * k + ph);
    const up = y ** 0.8;
    P.setXYZ(i, (x * r * lx) / 2, (-z * r * ly) / 2, up * h * (0.85 + 0.15 * r) - 2);
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

// Icicles hanging under the line a-b.
function icicles(a: V3, b: V3, seed: number, step = 24, maxLen = 50, mat = "Northcold_Icicle"): Geo {
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

// A rope through points; a rope sagging from a to b.
function rope(pts: V3[], r: number, mat = "RopeTan"): Geo {
  return merge(...pts.slice(1).map((p, i) => cylinderBetween(pts[i], p, r, 4, mat)));
}
function sagLine(a: V3, b: V3, sag: number, n: number): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - sag * 4 * t * (1 - t)] as V3;
  });
}

// A rough round outline of radii rx, ry, wobbling by `wob` (an ice plate, a floe).
function blobOutline(rx: number, ry: number, seed: number, wob = 0.18, n = 14): [number, number][] {
  const rnd = seeded(seed);
  const k = Array.from({ length: 3 }, () => [rnd() * Math.PI * 2, rnd() * wob, 2 + Math.floor(rnd() * 3)]);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.25;
    let r = 1 - wob * 0.3 + rnd() * wob * 0.6;
    for (const [ph, amp, f] of k) r += amp * Math.sin(a * f + ph);
    return [Math.cos(a) * rx * r, Math.sin(a) * ry * r];
  });
}

// The faces of an extrusion apart: its caps and its sides (each its own material).
function groupsOf(geo: THREE.BufferGeometry): THREE.BufferGeometry[] {
  const g = geo.index ? geo.toNonIndexed() : geo;
  return g.groups.map((gr) => {
    const out = new THREE.BufferGeometry();
    for (const name of ["position", "normal", "uv"]) {
      const a = g.getAttribute(name) as THREE.BufferAttribute;
      out.setAttribute(name, new THREE.BufferAttribute((a.array as Float32Array).slice(gr.start * a.itemSize, (gr.start + gr.count) * a.itemSize), a.itemSize));
    }
    return out;
  });
}
const uvScale = (geo: THREE.BufferGeometry, k: number) => {
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * k);
  return geo;
};

// A slab over a plan outline from z0 up to z1 (its top and its sides in their own materials),
// its edges a little rounded off when `soft`.
function slab(outline: [number, number][], z0: number, z1: number, top: string, side = top, soft = 0): Geo {
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  const b = Math.min(soft, (z1 - z0) * 0.4);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.5, z1 - z0 - 2 * b), bevelEnabled: b > 0.3, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 4 });
  geo.translate(0, 0, z0 + b);
  const [caps, sides] = groupsOf(geo);
  return [{ geo: uvScale(caps, 0.01), mat: top }, { geo: uvScale(sides, 0.01), mat: side }];
}

// A shape drawn in the X-Z plane (x along, z up) made solid across Y from y0 to y1: a bridge's
// side, a ramp's walls.
function profile(pts: [number, number][], y0: number, y1: number, mat: string, capMat = mat): Geo {
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments: 4 });
  // (x, y, z) -> (x, -z, y): the shape stands up, the depth runs along -Y; then moved to y0..y1
  geo.rotateX(Math.PI / 2);
  geo.translate(0, y1, 0);
  const [caps, sides] = groupsOf(geo);
  return [{ geo: uvScale(caps, 0.01), mat: capMat }, { geo: uvScale(sides, 0.01), mat }];
}

// ======================================================================================
// ---- the frozen river ----

// A plate of river ice (ground, walked over): clear dark ice in patches under a skin of white,
// white cracks running through it, snow blown across it in streaks. About 9.6 x 7.6 m, 5 cm.
function riverIce(): Geo {
  const rnd = seeded(11), parts: Geo[] = [slab(blobOutline(480, 380, 11, 0.14, 18), 0, 4, "Northcold_RiverIce")];
  for (const [x, y, rx, ry, s] of [[-150, 80, 190, 140, 13], [180, -120, 150, 110, 17], [60, 210, 110, 80, 19], [-260, -170, 90, 70, 23]] as number[][])
    parts.push(translate(slab(blobOutline(rx, ry, s, 0.22, 12), 0, 4.6, "Northcold_RiverIceDark"), [x, y, 0]));
  // cracks: wandering white lines from a few points
  for (let c = 0; c < 6; c++) {
    let x = (rnd() - 0.5) * 520, y = (rnd() - 0.5) * 380, a = rnd() * Math.PI * 2;
    const n = 4 + Math.floor(rnd() * 4);
    for (let k = 0; k < n; k++) {
      const L = 30 + rnd() * 60, nx = x + Math.cos(a) * L, ny = y + Math.sin(a) * L;
      if (Math.hypot(nx / 470, ny / 370) > 0.95) break;
      parts.push(beamBetween([x, y, 4.9], [nx, ny, 4.9], 2.2, 0.8, "Northcold_IceCrack"));
      if (rnd() < 0.3) {
        const b = a + (rnd() < 0.5 ? 1 : -1) * (0.6 + rnd() * 0.6), bl = 20 + rnd() * 40;
        parts.push(beamBetween([nx, ny, 4.9], [nx + Math.cos(b) * bl, ny + Math.sin(b) * bl, 4.9], 1.6, 0.8, "Northcold_IceCrack"));
      }
      [x, y] = [nx, ny];
      a += (rnd() - 0.5) * 1.1;
    }
  }
  // snow blown across in streaks
  for (const [x, y, l, w, s] of [[-300, 150, 260, 60, 27], [120, 260, 200, 50, 29], [260, -40, 300, 70, 31], [-60, -280, 220, 50, 33]] as number[][])
    parts.push(mound(l, w, 5, s, [x, y, 2], 18, "Snow"));
  return merge(...parts);
}

// A ridge of ice heaved up where the sheet cracked and the plates rode over each other: slabs
// tilted every way along a line about 7 m long (along Y), snow drifted against its foot.
function iceRidge(): Geo {
  const rnd = seeded(41), parts: Geo[] = [mound(760, 230, 30, 43, [0, 0, 0], 90, "Snow")];
  for (let i = 0; i < 15; i++) {
    const y = -330 + i * 47 + (rnd() - 0.5) * 20, side = i % 2 ? 1 : -1;
    const w = 70 + rnd() * 90, h = 50 + rnd() * 90 * (1 - Math.abs(y) / 520), t = 14 + rnd() * 12;
    const mat = rnd() < 0.45 ? "Northcold_RiverIceDark" : rnd() < 0.5 ? "Northcold_RiverIce" : "Northcold_Floe";
    let s = box([t, w, h], [0, 0, h / 2 - 8], mat, 4);
    s = rotateY(s, side * (22 + rnd() * 34));
    s = rotateZ(s, (rnd() - 0.5) * 40);
    const g = translate(s, [side * (10 + rnd() * 40), y, 0]);
    parts.push(g, snowFacets(g, 0.6, 1.5));
  }
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2, d = 90 + rnd() * 60;
    parts.push(translate(rotateZ(rotateY(box([30 + rnd() * 30, 25 + rnd() * 25, 12], [0, 0, 0], "Northcold_Floe", 3), (rnd() - 0.5) * 40), rnd() * 180), [Math.cos(a) * d, -330 + rnd() * 660, 4]));
  }
  return merge(...parts);
}

// Floes drifting in open water (z = 0 the water's surface): five plates of old ice riding a
// hand high, snow on them, broken bits round about. About 7 x 6 m.
function driftFloes(): Geo {
  const rnd = seeded(51), parts: Geo[] = [];
  for (const [x, y, rx, ry, s, h] of [[-120, -60, 210, 160, 53, 14], [190, 140, 150, 110, 57, 11], [160, -200, 120, 90, 59, 10], [-190, 220, 110, 80, 61, 9], [-300, -230, 80, 60, 67, 8]] as number[][]) {
    const o = blobOutline(rx, ry, s, 0.2, 11);
    parts.push(translate(rotateZ(slab(o, -22, h, "Northcold_Floe", "Northcold_FloeSide", 4), rnd() * 360), [x, y, 0]));
    if (rx > 100) parts.push(mound(rx * 1.1, ry * 0.9, 9 + rnd() * 8, s + 1, [x + (rnd() - 0.5) * 40, y + (rnd() - 0.5) * 40, h - 2], rnd() * 180));
  }
  for (let i = 0; i < 12; i++) {
    const x = (rnd() - 0.5) * 640, y = (rnd() - 0.5) * 560;
    parts.push(translate(rotateZ(slab(blobOutline(18 + rnd() * 18, 14 + rnd() * 12, 70 + i, 0.25, 7), -10, 3 + rnd() * 3, "Northcold_Floe", "Northcold_FloeSide", 1.5), rnd() * 360), [x, y, 0]));
  }
  return merge(...parts);
}

// A marker pole of the ice road: a birch pole frozen into a heap of ice and snow, a red rag
// and a bundle of spruce twigs tied at its top so the way shows in a blizzard.
function iceMarker(): Geo {
  const rnd = seeded(71), parts: Geo[] = [
    cylinderAt({ rBot: 6, rTop: 4.5, height: 300, segments: 7, bottom: [0, 0, -10] }, "BarkBirch"),
    mound(120, 100, 28, 73), mound(70, 60, 22, 74, [30, -30, 0], 30, "Northcold_ShoreIce"),
  ];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rnd() * 0.4;
    parts.push(translate(rotateZ(rotateY(box([24 + rnd() * 16, 18, 10], [0, 0, 0], "Northcold_Floe", 3), 30 + rnd() * 30), a * DEG), [Math.cos(a) * 30, Math.sin(a) * 30, 12]));
  }
  // the twigs, tied on under the rag
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2, l = 40 + rnd() * 25;
    parts.push(cylinderBetween([0, 0, 252], [Math.cos(a) * 14, Math.sin(a) * 14, 252 - l], 1.6, 4, "PineCore"));
    parts.push(cylinderBetween([Math.cos(a) * 6, Math.sin(a) * 6, 245], [Math.cos(a) * 18, Math.sin(a) * 18, 252 - l * 0.8], 3.5, 4, "PineNeedle", 1));
  }
  parts.push(cylinderAt({ radius: 7.5, height: 8, segments: 7, bottom: [0, 0, 248] }, "RopeTan"));
  // the rag streaming out in the wind (toward +Y), in a few folds
  const rag: V3[] = [[0, 4, 282], [0, 32, 286], [-6, 60, 280], [4, 88, 284]];
  for (let i = 0; i + 1 < rag.length; i++) {
    const [a, b] = [rag[i], rag[i + 1]], d = 22 - i * 4;
    parts.push(tri(a, b, [b[0], b[1], b[2] - d + 4], "Northcold_Rag"), tri(a, [b[0], b[1], b[2] - d + 4], [a[0], a[1], a[2] - d], "Northcold_Rag"));
  }
  parts.push(blob(8, [0, 0, 291], "Snow", 0.6, 7));
  return merge(...parts);
}

// ---- the old stone bridge ----
// Its pieces join end to end along X: a span is one arch between two half piers (each pier is
// two halves, one from each span); the fallen span has only stubs of its arch left at each pier;
// the ramp brings the way up from the bank onto the first span. z = 0 is the water's surface
// (the ramp's own z = 0 is the bank, BRIDGE.bank above the water); the deck is BRIDGE.deck up.
export const BRIDGE = {
  span: 1000,  // one span, pier centre to pier centre
  width: 520,  // across the parapets
  clear: 440,  // the way between them
  deck: 300,   // the deck's top above the water
  bank: 14,    // the bank above the water
  run: 1000,   // the ramp's slope, foot to top (its rise is deck - bank)
  rampLen: 1320, // the whole ramp piece: a flared foot, the slope and the abutment at the top
  rampTop: 400,  // where the slope reaches the deck (from the ramp piece's centre, along X)
};
const BW = BRIDGE.width / 2, BC = BRIDGE.clear / 2, DECK = BRIDGE.deck;
const SPRING = 30, ARISE = 180, ACH = 380; // the arch springs from the piers at x = +-ACH
const AR = (ACH * ACH + ARISE * ARISE) / (2 * ARISE), AZ = SPRING + ARISE - AR, ATH = Math.asin(ACH / AR);
const RING = 48;

// the arch's underside from angle a0 to a1 (radians from the crown, negative toward -X)
const arc = (a0: number, a1: number, r = AR, n = 14): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [r * Math.sin(a), AZ + r * Math.cos(a)];
  });

// The arch ring's stones on both faces from angle a0 to a1, a few of them slipped.
function voussoirs(a0: number, a1: number, seed: number, slip = 0): Geo {
  const rnd = seeded(seed), parts: Geo[] = [], n = Math.max(2, Math.round(((a1 - a0) / (2 * ATH)) * 17));
  const da = (a1 - a0) / n, rm = AR + RING / 2;
  for (const s of [-1, 1])
    for (let i = 0; i < n; i++) {
      const a = a0 + da * (i + 0.5), key = Math.abs(a) < da * 0.6;
      const len = da * rm - 4, mat = (i + (s > 0 ? 1 : 0)) % 3 === 0 ? "Northcold_BridgeStoneDark" : "Northcold_BridgeStone";
      let v = box([len, 14, RING + (key ? 22 : 6)], [0, 0, key ? 8 : 0], mat, 2.5);
      if (slip && (i === 0 || i === n - 1) && rnd() < 0.6) v = translate(rotateY(v, (rnd() - 0.5) * 14), [0, 0, -slip * rnd()]);
      parts.push(translate(rotateY(v, a * DEG), [rm * Math.sin(a), s * (BW - 4), AZ + rm * Math.cos(a)]));
    }
  return merge(...parts);
}

// A pier's cutwater, the half of it on this piece's side of the joint at x = jx (sx: which way
// the piece lies from the joint), on the face sy: a pointed nose up from the river bed with a
// sloping cap, ice frozen round it at the waterline.
function cutwater(jx: number, sx: number, sy: number, seed: number): Geo {
  const rnd = seeded(seed), x0 = jx + sx * 120, y0 = sy * (BW - 10), tip = sy * (BW + 140);
  const pl: [number, number][] = [[x0, y0], [jx, y0], [jx, tip]];
  const parts: Geo[] = [slab(pl, -60, 190, "Northcold_BridgeStone", "Northcold_BridgeStone")];
  const apex: V3 = [jx, y0, 268], A: V3 = [x0, y0, 190], B: V3 = [jx, tip, 190], C: V3 = [jx, y0, 190];
  parts.push(tri(apex, A, B, "Northcold_Coping"), tri(apex, B, C, "Northcold_Coping"));
  // ice at the waterline round the nose
  parts.push(slab(blobOutline(80, 60, seed, 0.3, 9).map(([x, y]) => [x + jx + sx * 20, y + tip - sy * 30] as [number, number]), -6, 8, "Northcold_Floe", "Northcold_FloeSide", 2));
  for (let i = 0; i < 3; i++)
    parts.push(translate(rotateZ(rotateY(box([40 + rnd() * 20, 30, 10], [0, 0, 0], "Northcold_Floe", 3), sx * (20 + rnd() * 30)), rnd() * 180), [jx + sx * (30 + rnd() * 50), tip - sy * (rnd() * 60), 10]));
  parts.push(icicles([x0, sy * (BW + 2), 189], [jx, sy * (BW + 2), 189], seed + 3, 16, 30));
  return merge(...parts);
}

// The parapet along one side from x0 to x1, its coping stones (some gone), snow on them.
function parapet(x0: number, x1: number, sy: number, seed: number, z0 = DECK - 10): Geo {
  const rnd = seeded(seed), y = sy * (BW - 20), parts: Geo[] = [boxBounds([x0, y - 20, z0], [x1, y + 20, DECK + 75], "Northcold_BridgeStone", 2)];
  const n = Math.max(1, Math.round((x1 - x0) / 100)), L = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    if (rnd() < 0.12) continue;
    const cx = x0 + L * (i + 0.5);
    const c = translate(rotateZ(box([L - 4, 50, 14], [0, 0, 7], "Northcold_Coping", 3), (rnd() - 0.5) * 3), [cx, y + (rnd() - 0.5) * 3, DECK + 75 + (rnd() - 0.5) * 2]);
    parts.push(c);
    if (rnd() < 0.75) parts.push(blob(L * 0.42, [cx + (rnd() - 0.5) * 20, y, DECK + 89], "Snow", 0.2, 8));
  }
  return merge(...parts);
}

// One span: an arch between two half piers, the spandrels and the deck over it, the arch ring
// standing proud, a string course, parapets, cutwaters, ice and icicles.
function bridgeSpan(): Geo {
  const H = BRIDGE.span / 2, rnd = seeded(91);
  const body: [number, number][] = [[-H, -60], [-ACH, -60], ...arc(-ATH, ATH), [ACH, -60], [H, -60], [H, DECK - 10], [-H, DECK - 10]];
  const parts: Geo[] = [profile(body, -BW + 10, BW - 10, "Northcold_BridgeStone")];
  parts.push(voussoirs(-ATH, ATH, 93));
  // the string course under the parapets, the deck of cobbles, snow along its sides
  for (const s of [-1, 1]) parts.push(boxBounds([-H, s > 0 ? BW - 12 : -BW - 2, DECK - 34], [H, s > 0 ? BW + 2 : -BW + 12, DECK - 14], "Northcold_Coping", 2.5));
  parts.push(boxBounds([-H, -BW + 12, DECK - 12], [H, BW - 12, DECK], "CobbleDark"));
  for (const s of [-1, 1]) {
    parts.push(parapet(-H, H, s, 95 + s));
    parts.push(mound(BRIDGE.span * 0.9, 70, 16, 97 + s, [(rnd() - 0.5) * 100, s * (BC - 18), DECK - 2], 0));
    for (const jx of [-H, H]) parts.push(cutwater(jx, jx < 0 ? 1 : -1, s, 101 + s * 3 + (jx < 0 ? 0 : 1)));
    parts.push(icicles([-ACH + 60, s * (BW + 1), DECK - 35], [ACH - 60, s * (BW + 1), DECK - 35], 105 + s, 22, 34));
  }
  // snow on the deck in patches, lichen and dark stains down the faces
  parts.push(mound(260, 160, 6, 111, [-180, 40, DECK - 2], 20), mound(200, 140, 5, 112, [220, -70, DECK - 2], -30));
  for (const s of [-1, 1])
    for (let i = 0; i < 5; i++) {
      const x = -H + 60 + rnd() * (BRIDGE.span - 120), z = 80 + rnd() * 140;
      if (Math.abs(x) < ACH - 30 && z < AZ + Math.sqrt(Math.max(0, AR * AR - x * x)) + RING + 10) continue;
      parts.push(boxBounds([x - 30 - rnd() * 30, s * (BW - 9) - 1, z], [x + 30 + rnd() * 30, s * (BW - 9) + 1, z + 20 + rnd() * 30], rnd() < 0.5 ? "Northcold_Lichen" : "Northcold_Stain"));
    }
  return merge(...parts);
}

// The span that fell: stubs of its arch left at each pier (the north one shorter), the deck and
// parapets broken off ragged over them, a barrier of planks across each broken end, the fallen
// stones heaped in the river below with ice jammed among them.
function bridgeBroken(): Geo {
  const H = BRIDGE.span / 2, rnd = seeded(121), parts: Geo[] = [];
  const aL = -ATH + 0.42 * ATH, aR = ATH - 0.3 * ATH; // where each stub's arch breaks off
  const [lx, lz] = arc(aL, aL, AR, 1)[0], [rx, rz] = arc(aR, aR, AR, 1)[0];
  const left: [number, number][] = [[-H, -60], [-ACH, -60], ...arc(-ATH, aL, AR, 6), [lx + 30, lz + 40], [lx + 5, lz + 75], [lx + 40, DECK - 70], [-210, DECK - 40], [-235, DECK - 10], [-H, DECK - 10]];
  const right: [number, number][] = [[H, DECK - 10], [270, DECK - 10], [300, DECK - 50], [rx - 20, rz + 70], [rx - 40, rz + 30], ...arc(aR, ATH, AR, 4), [ACH, -60], [H, -60]];
  parts.push(profile(left, -BW + 10, BW - 10, "Northcold_BridgeStone"), profile(right, -BW + 10, BW - 10, "Northcold_BridgeStone"));
  parts.push(voussoirs(-ATH, aL, 123, 18), voussoirs(aR, ATH, 125, 18));
  for (const [x0, x1] of [[-H, -235], [270, H]] as [number, number][]) {
    for (const s of [-1, 1]) parts.push(boxBounds([x0, s > 0 ? BW - 12 : -BW - 2, DECK - 34], [x1, s > 0 ? BW + 2 : -BW + 12, DECK - 14], "Northcold_Coping", 2.5));
    parts.push(boxBounds([x0, -BW + 12, DECK - 12], [x1, BW - 12, DECK], "CobbleDark"));
  }
  // the parapets end ragged, a stone or two short of the break
  for (const s of [-1, 1]) {
    parts.push(parapet(-H, -270 - (s > 0 ? 40 : 0), s, 127 + s), parapet(310 + (s > 0 ? 0 : 40), H, s, 129 + s));
    parts.push(boxBounds([-270 - (s > 0 ? 40 : 0), s * (BW - 20) - 20, DECK - 10], [-240, s * (BW - 20) + 20, DECK + 30], "Northcold_BridgeStone", 2));
    for (const jx of [-H, H]) parts.push(cutwater(jx, jx < 0 ? 1 : -1, s, 131 + s * 3 + (jx < 0 ? 0 : 1)));
    parts.push(mound(220, 60, 14, 135 + s, [-370, s * (BC - 18), DECK - 2], 0), mound(160, 60, 12, 137 + s, [400, s * (BC - 18), DECK - 2], 0));
  }
  // a coping stone hanging over the edge
  parts.push(translate(rotateY(box([90, 50, 14], [0, 0, 0], "Northcold_Coping", 3), 28), [-232, BW - 30, DECK + 30]));
  // the barriers across the broken ends: trestles, planks, a red-striped board, a rope of rags
  const barrier = (x: number, face: number, seed: number): Geo => {
    const r = seeded(seed), b: Geo[] = [];
    for (const y of [-BC + 40, BC - 40]) {
      b.push(cylinderBetween([x - 26, y - 6, DECK], [x + 26, y + 6, DECK + 105], 4.5, 5, "Northcold_Timber"));
      b.push(cylinderBetween([x + 26, y - 6, DECK], [x - 26, y + 6, DECK + 105], 4.5, 5, "Northcold_Timber"));
    }
    b.push(translate(rotateX(box([8, BRIDGE.clear - 30, 22], [0, 0, 0], "Northcold_Plank", 1.5), 3), [x, 0, DECK + 92]));
    b.push(translate(rotateX(box([8, BRIDGE.clear - 50, 20], [0, 0, 0], "Northcold_Plank", 1.5), -4), [x, 10, DECK + 50]));
    for (let k = -4; k <= 4; k += 2) b.push(boxBounds([x - face * 6, k * 42 - 14, DECK + 82], [x - face * 4.5, k * 42 + 14, DECK + 102], "Northcold_Rag"));
    b.push(rope(sagLine([x, -BC + 40, DECK + 104], [x, BC - 40, DECK + 104], 18, 6), 1.2));
    for (let k = 0; k < 4; k++) b.push(boxBounds([x - 1, -110 + k * 70, DECK + 70 - r() * 10], [x + 1, -100 + k * 70, DECK + 92], "Northcold_Rag"));
    b.push(blob(60, [x, -60, DECK + 105], "Snow", 0.18, 8));
    return merge(...b);
  };
  parts.push(barrier(-275, 1, 141), barrier(320, -1, 143));
  // the fallen stones in the river: blocks, arch stones, a slab of deck, ice jammed among them
  for (let i = 0; i < 16; i++) {
    const x = -220 + rnd() * 480, y = (rnd() - 0.5) * (BRIDGE.width + 120), s = 50 + rnd() * 60;
    const g = translate(rotateZ(rotateY(rotateX(box([s * 1.3, s, s * 0.8], [0, 0, 0], rnd() < 0.4 ? "Northcold_BridgeStoneDark" : "Northcold_BridgeStone", 5), (rnd() - 0.5) * 50), (rnd() - 0.5) * 60), rnd() * 180), [x, y, -10 + rnd() * 40]);
    parts.push(g);
    if (rnd() < 0.6) parts.push(snowFacets(g, 0.7, 1.5));
  }
  parts.push(translate(rotateY(rotateX(box([220, 300, 24], [0, 0, 0], "CobbleDark", 3), 14), -22), [20, 40, 40]));
  parts.push(translate(rotateY(rotateZ(box([180, 40, 60], [0, 0, 0], "Northcold_BridgeStone", 3), 60), 35), [120, -260, 35]));
  for (let i = 0; i < 7; i++) {
    const a = rnd() * Math.PI * 2;
    parts.push(translate(rotateZ(slab(blobOutline(60 + rnd() * 50, 40 + rnd() * 30, 150 + i, 0.3, 8), -10, 8, "Northcold_Floe", "Northcold_FloeSide", 2), a * DEG), [-260 + rnd() * 560, (rnd() - 0.5) * 700, 0]));
  }
  for (let i = 0; i < 5; i++) parts.push(translate(rotateZ(rotateY(box([70 + rnd() * 40, 50, 14], [0, 0, 0], "Northcold_Floe", 4), 25 + rnd() * 30), rnd() * 180), [-200 + rnd() * 400, (rnd() - 0.5) * 500, 20]));
  parts.push(icicles([lx - 10, -BW + 20, lz + 10], [lx - 10, BW - 20, lz + 10], 145, 30, 60), icicles([rx + 10, -BW + 20, rz + 10], [rx + 10, BW - 20, rz + 10], 147, 30, 50));
  return merge(...parts);
}

// The ramp up from the bank onto the bridge (z = 0 the bank): a cobbled slope between walls
// that rise with it, flared out at the foot (-X) to newel posts, and at the top the abutment the
// first span rests on, with its own newel posts and an old plaque.
function bridgeRamp(): Geo {
  const L = BRIDGE.rampLen, H = L / 2, top = BRIDGE.rampTop, foot = top - BRIDGE.run, rise = DECK - BRIDGE.bank, rnd = seeded(161);
  const parts: Geo[] = [];
  // the slope (its surface a few cm over the ground's own ramp) and the abutment under the deck
  parts.push(profile([[foot - 30, -20], [foot - 30, 4], [top, rise + 5], [H, rise + 5], [H, -40], [top, -40]], -BC, BC, "Northcold_BridgeStoneDark", "Cobble"));
  // the walls, rising with the slope to parapet height
  const wall = (s: number): Geo => {
    const y0 = s > 0 ? BC : -BW, y1 = s > 0 ? BW : -BC;
    return merge(
      profile([[foot - 40, -20], [foot - 40, 60], [top, rise + 75], [H, rise + 75], [H, -50], [top, -50]], y0, y1, "Northcold_BridgeStone"),
      ...Array.from({ length: 11 }, (_, i) => {
        const a = foot - 40 + (i * (top - foot + 40)) / 11, b = foot - 40 + ((i + 1) * (top - foot + 40)) / 11;
        const za = 60 + ((a - foot + 40) / (top - foot + 40)) * (rise + 15), zb = 60 + ((b - foot + 40) / (top - foot + 40)) * (rise + 15);
        return beamBetween([a + 2, s * (BW - 20), za + 7], [b - 2, s * (BW - 20), zb + 7], 52, 14, "Northcold_Coping");
      }),
      boxBounds([top, s * (BW - 20) - 26, rise + 75], [H, s * (BW - 20) + 26, rise + 89], "Northcold_Coping", 3),
    );
  };
  parts.push(wall(1), wall(-1));
  // the walls flare out at the foot to low newel posts
  for (const s of [-1, 1]) {
    parts.push(translate(rotateZ(boxBounds([-120, -20, -20], [0, 20, 55], "Northcold_BridgeStone", 2), s * 35), [foot - 40, s * (BW - 20), 0]));
    const nx = foot - 40 - Math.cos(35 / DEG) * 120, ny = s * (BW - 20 + Math.sin(35 / DEG) * 120);
    parts.push(boxAt([62, 62, 110], [nx, ny, -10], "Northcold_BridgeStone", 3), boxAt([74, 74, 14], [nx, ny, 100], "Northcold_Coping", 3), cylinderAt({ rBot: 24, rTop: 8, height: 26, segments: 8, bottom: [nx, ny, 114] }, "Northcold_Coping"), blob(26, [nx, ny, 124], "Snow", 0.35, 8));
    // the abutment's buttresses and tall newel posts at the top
    parts.push(boxBounds([top - 10, s > 0 ? BW - 8 : -BW - 40, -50], [top + 70, s > 0 ? BW + 40 : -BW + 8, rise - 40], "Northcold_BridgeStoneDark", 3));
    parts.push(boxAt([70, 70, 150], [top + 30, s * (BW - 20), rise + 75], "Northcold_BridgeStone", 3), boxAt([84, 84, 16], [top + 30, s * (BW - 20), rise + 225], "Northcold_Coping", 3));
    parts.push(sphereCenter(26, [top + 30, s * (BW - 20), rise + 262], "Northcold_Coping", 10), blob(28, [top + 30, s * (BW - 20), rise + 278], "Snow", 0.4, 8));
    parts.push(icicles([top - 15, s * (BW + 30), rise + 74], [top - 15, s * (BW - 70), rise + 74], 163 + s, 14, 26));
    // snow along the foot of each wall, up the slope
    for (let i = 0; i < 4; i++) {
      const x = foot + 120 + i * 230, z = ((x - foot) / (top - foot)) * rise;
      parts.push(translate(rotateY(mound(240, 60, 14, 165 + i + s * 7, [0, 0, 0], 0), -Math.atan2(rise, top - foot) * DEG), [x, s * (BC - 16), z]));
    }
  }
  // the plaque on the abutment's face (toward -Y, seen from the river bank)
  parts.push(boxBounds([top + 120, -BW - 6, rise - 150], [top + 220, -BW, rise - 80], "Northcold_Coping", 1.5), boxBounds([top + 128, -BW - 8, rise - 142], [top + 212, -BW - 6, rise - 88], "Bronze"));
  for (let i = 0; i < 6; i++) {
    const s = i % 2 ? 1 : -1, x = foot + 200 + rnd() * 700, z = 20 + rnd() * 50;
    parts.push(boxBounds([x, s * BW - 1, z], [x + 40 + rnd() * 50, s * BW + 1, z + 30 + rnd() * 30], "Northcold_Lichen"));
  }
  return merge(...parts);
}

// ---- the ferry ----

// Logs laid one on another along a wall from a to b (a wall of a log hut), each a little
// different, the ends sticking out past the corners; `gaps` leaves openings [from, to] (cm
// along the wall) between heights z0..z1 (a door, a window).
function logWall(a: [number, number], b: [number, number], z0: number, n: number, seed: number, gaps: [number, number, number, number][] = []): Geo {
  const rnd = seeded(seed), parts: Geo[] = [], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
  for (let i = 0; i < n; i++) {
    const r = 12 + rnd() * 2, z = z0 + i * 23 + r;
    const cut = gaps.filter(([, , g0, g1]) => z > g0 && z < g1).map(([s0, s1]) => [s0, s1] as [number, number]);
    let from = -22;
    for (const [s0, s1] of [...cut, [L + 22, L + 22] as [number, number]]) {
      if (s0 - from > 20) parts.push(cylinderBetween([a[0] + ux * from, a[1] + uy * from, z], [a[0] + ux * s0, a[1] + uy * s0, z], r, 8, rnd() < 0.3 ? "Northcold_Plank" : "Northcold_Timber"));
      from = s1;
    }
  }
  return merge(...parts);
}

// A window in a wall facing `n` (unit, in the plan) at (x, y): a frame, a pane, a shutter open.
function window(x: number, y: number, z: number, n: [number, number], w = 70, h = 70): Geo {
  const deg = Math.atan2(n[1], n[0]) * DEG;
  const local = merge(
    boxBounds([-6, -w / 2 - 8, -8], [6, w / 2 + 8, 0], "Northcold_Plank", 1.5),
    boxBounds([-6, -w / 2 - 8, h], [6, w / 2 + 8, h + 10], "Northcold_Plank", 1.5),
    boxBounds([-6, -w / 2 - 8, 0], [6, -w / 2, h], "Northcold_Plank", 1.5),
    boxBounds([-6, w / 2, 0], [6, w / 2 + 8, h], "Northcold_Plank", 1.5),
    boxBounds([-2, -w / 2, 0], [2, w / 2, h], "GlassBlue"),
    boxBounds([-5, -2, 0], [5, 2, h], "Northcold_Plank"),
    translate(rotateZ(boxBounds([0, 0, 0], [4, w / 2, h], "Northcold_HullPaint", 1), -70), [6, w / 2 + 6, 0]),
    blob(w * 0.45, [8, 0, h + 12], "Snow", 0.25, 8),
  );
  return translate(rotateZ(local, deg), [x, y, z]);
}

// The ferryman's hut on the bank: a log hut on a stone footing under a steep snowy roof, a porch
// at its front with the ferry bell, oars and coiled rope; his nets on a rack, firewood stacked
// at the back, a lantern lit by the door. About 7.6 x 7 m.
function ferryHut(): Geo {
  const rnd = seeded(201), X = 290, Y = 240, parts: Geo[] = [];
  parts.push(boxBounds([-X - 15, -Y - 15, -10], [X + 15, Y + 15, 55], "StoneGrey", 4));
  // the walls: a door in the front, a window in each side
  parts.push(logWall([-X, -Y], [-X, Y], 55, 10, 203, [[Y - 60, Y + 60, 55, 270]]));
  parts.push(logWall([X, -Y], [X, Y], 55, 10, 205));
  parts.push(logWall([-X, -Y], [X, -Y], 55, 10, 207, [[X - 50, X + 50, 140, 225]]));
  parts.push(logWall([-X, Y], [X, Y], 55, 10, 209, [[X - 50, X + 50, 140, 225]]));
  parts.push(window(0, -Y - 6, 142, [0, -1], 90, 72), window(0, Y + 6, 142, [0, 1], 90, 72));
  // the door, its frame, a lantern beside it, a sign board over it
  parts.push(boxBounds([-X - 14, -66, 55], [-X - 6, 66, 270], "Northcold_Plank", 1.5), boxBounds([-X - 12, -55, 55], [-X - 4, 55, 262], "Northcold_Tar", 1));
  for (let k = -2; k <= 2; k++) parts.push(boxBounds([-X - 14, k * 22 - 10, 60], [-X - 11, k * 22 + 10, 258], "DoorWood"));
  parts.push(boxBounds([-X - 18, 24, 140], [-X - 12, 34, 150], "IronDark"));
  parts.push(boxBounds([-X - 22, -120, 300], [-X - 14, 120, 345], "Northcold_Plank", 2), translate(scale(sphereCenter(30, [0, 0, 0], "Northcold_HullPaint", 8), [0.2, 2.2, 0.55]), [-X - 24, 0, 322]));
  parts.push(cylinderBetween([-X - 14, -95, 230], [-X - 50, -95, 230], 2, 4, "IronDark"), boxBounds([-X - 62, -107, 185], [-X - 38, -83, 222], "IronDark"), boxBounds([-X - 59, -104, 189], [-X - 41, -86, 218], "LanternGlow"));
  // the roof: steep, shingled, snow thick on it, icicles under the eaves
  const RH = 230, top = 55 + 10 * 23 + 10;
  parts.push(gableRoof([2 * X + 30, 2 * Y + 30, 12], [0, 0, top], RH, 55, "RoofSlate"));
  parts.push(gableRoof([2 * X + 36, 2 * Y + 30, 10], [0, 0, top + 12], RH, 48, "Snow"));
  for (const x of [-X - 10, X + 10]) parts.push(gableWall(x, Y + 12, top, RH, "Northcold_Plank"));
  const eave = (Y + 15 + 55) * 1, ez = top - (55 * RH) / (Y + 15) + 6;
  for (const s of [-1, 1]) parts.push(icicles([-X - 70, s * eave, ez], [X + 70, s * eave, ez], 211 + s, 18, 55));
  // a stone chimney on the right side
  parts.push(boxAt([80, 70, top + RH + 60], [120, Y + 50, -10], "StoneGrey", 4), boxAt([92, 82, 14], [120, Y + 50, top + RH + 50], "StoneDark", 3), blob(44, [120, Y + 50, top + RH + 64], "Snow", 0.35, 8));
  // the porch: a floor of boards, two posts, a lean-to roof
  parts.push(boxBounds([-X - 150, -Y, 10], [-X - 15, Y, 26], "Northcold_Plank", 2));
  for (const y of [-Y + 10, Y - 10]) parts.push(cylinderAt({ radius: 10, height: 245, segments: 8, bottom: [-X - 135, y, 10] }, "Northcold_Timber"));
  parts.push(translate(rotateY(boxBounds([-180, -Y - 30, 0], [0, Y + 30, 10], "RoofSlate", 2), -14), [-X, 0, 262]), translate(rotateY(boxBounds([-176, -Y - 28, 10], [0, Y + 28, 18], "Snow", 3), -14), [-X, 0, 262]));
  parts.push(icicles([-X - 175, -Y - 25, 214], [-X - 175, Y + 25, 214], 213, 16, 40));
  // the ferry bell on a bracket at the porch post
  parts.push(beamBetween([-X - 135, -Y + 10, 225], [-X - 135, -Y - 50, 225], 8, 8, "Northcold_Timber"));
  parts.push(cylinderAt({ rBot: 17, rTop: 11, height: 24, segments: 10, bottom: [-X - 135, -Y - 45, 190] }, "Bronze"), sphereCenter(11, [-X - 135, -Y - 45, 214], "Bronze", 8));
  parts.push(rope([[-X - 135, -Y - 45, 190], [-X - 138, -Y - 47, 120], [-X - 132, -Y - 44, 70]], 1.3));
  // oars against the wall, a coil of rope, a bench
  for (const [y, a] of [[-150, 8], [-115, -6]] as [number, number][]) {
    parts.push(cylinderBetween([-X - 30, y, 15], [-X - 18 + Math.sin(a / DEG) * 10, y + a * 3, 300], 3.5, 6, "Northcold_Plank"));
    parts.push(translate(rotateY(box([6, 22, 70], [0, 0, 0], "Northcold_Plank", 1), 3), [-X - 28, y, 50]));
  }
  parts.push(translate(torus(26, 5, 12, 5, "RopeTan"), [-X - 80, 140, 30]), translate(torus(18, 5, 10, 5, "RopeTan"), [-X - 80, 140, 39]));
  parts.push(boxBounds([-X - 70, -40, 26], [-X - 30, 100, 34], "Northcold_Plank", 2), boxBounds([-X - 66, -30, 10], [-X - 34, -20, 26], "Northcold_Timber"), boxBounds([-X - 66, 80, 10], [-X - 34, 90, 26], "Northcold_Timber"));
  // the net rack on the left side
  for (const x of [-170, 170]) parts.push(cylinderAt({ radius: 7, height: 200, segments: 6, bottom: [x, -Y - 130, -5] }, "Northcold_Timber"));
  parts.push(cylinderBetween([-190, -Y - 130, 190], [190, -Y - 130, 190], 5, 6, "Northcold_Timber"));
  for (let k = 0; k <= 8; k++) {
    const x = -160 + k * 40;
    parts.push(cylinderBetween([x, -Y - 130, 188], [x + (rnd() - 0.5) * 10, -Y - 126 + (rnd() - 0.5) * 8, 70 + rnd() * 20], 0.8, 3, "RopeTan"));
  }
  for (let k = 0; k < 4; k++) parts.push(rope(sagLine([-160, -Y - 130, 170 - k * 30], [160, -Y - 130, 170 - k * 30], 8, 6), 0.8));
  for (const x of [-110, -60, 40]) parts.push(translate(scale(sphereCenter(9, [0, 0, 0], "Northcold_Fish", 6), [0.6, 0.5, 2.6]), [x, -Y - 134, 150]));
  // firewood stacked against the back wall under a little roof
  for (let r = 0; r < 4; r++)
    for (let k = 0; k < 7; k++) {
      const y = -170 + k * 30 + (r % 2) * 14, z = 18 + r * 26;
      parts.push(cylinderBetween([X + 30, y, z], [X + 100, y + (rnd() - 0.5) * 6, z], 12, 7, "Northcold_Timber"), cylinderBetween([X + 100, y, z], [X + 101, y, z], 10, 7, "Northcold_LogEnd"));
    }
  parts.push(translate(rotateY(boxBounds([0, -200, 0], [100, 200, 8], "Northcold_Tar", 2), 16), [X + 15, 0, 140]));
  // snow banked against the walls
  parts.push(mound(260, 110, 50, 215, [-80, Y + 70, 0], 0), mound(300, 120, 44, 216, [100, -Y - 60, 0], 0), mound(200, 140, 40, 217, [X + 140, 120, 0], 80), mound(240, 100, 30, 218, [-X - 200, -160, 0], 70));
  return merge(...parts);
}

// The ferry landing: a timber jetty out from the bank (its root toward -X), and at its end the
// ferry, a flat scow, frozen fast in the river with its guide rope running out over the ice to
// a stake. About 15 x 4 m.
function ferryLanding(): Geo {
  const rnd = seeded(231), parts: Geo[] = [];
  // the jetty: posts in pairs, ice collars round them, a deck of planks, a step down at the root
  for (let x = -440; x <= 240; x += 136)
    for (const y of [-118, 118]) {
      parts.push(cylinderAt({ radius: 11, height: 90, segments: 8, bottom: [x, y, -40] }, "Northcold_Tar"), cylinderAt({ rBot: 26, rTop: 14, height: 14, segments: 8, bottom: [x, y, -2] }, "Northcold_Floe"));
      parts.push(cylinderAt({ radius: 12, height: 4, segments: 8, bottom: [x, y, 50] }, "Snow"));
    }
  parts.push(boxBounds([-450, -130, 30], [250, -112, 46], "Northcold_Tar"), boxBounds([-450, 112, 30], [250, 130, 46], "Northcold_Tar"));
  for (let x = -446; x < 248; x += 24) parts.push(boxBounds([x, -128 + (rnd() - 0.5) * 6, 46], [x + 21, 128 + (rnd() - 0.5) * 6, 51], rnd() < 0.5 ? "Northcold_Plank" : "WoodGrey", 1));
  parts.push(boxBounds([-520, -110, 0], [-450, 110, 22], "Northcold_Plank", 2));
  parts.push(mound(500, 160, 9, 233, [-80, -10, 48], 0), mound(200, 90, 8, 234, [160, 60, 48], 20));
  // a mooring post with the ferry's guide rope over it
  parts.push(cylinderAt({ rBot: 16, rTop: 13, height: 320, segments: 8, bottom: [230, 150, -30] }, "Northcold_Tar"), cylinderAt({ radius: 15, height: 6, segments: 8, bottom: [230, 150, 290] }, "Snow"));
  // the scow: slab sides raked at both ends, a deck, rails, a capstan, frozen in with a list
  const scow: Geo[] = [];
  const SL = 520, SB = 170;
  scow.push(profile([[-SL / 2 - 50, 40], [-SL / 2, -20], [SL / 2, -20], [SL / 2 + 50, 40], [SL / 2 + 50, 52], [-SL / 2 - 50, 52]], -SB, SB, "Northcold_Hull", "Northcold_Hull"));
  for (let x = -SL / 2 - 40; x < SL / 2 + 40; x += 26) scow.push(boxBounds([x, -SB + 8, 52], [x + 23, SB - 8, 57], "WoodGrey", 1));
  for (const s of [-1, 1]) {
    scow.push(boxBounds([-SL / 2, s * SB - 6, 52], [SL / 2, s * SB + 6, 66], "Northcold_Tar"));
    for (let x = -SL / 2 + 20; x <= SL / 2 - 20; x += 120) scow.push(boxAt([9, 9, 80], [x, s * (SB - 10), 57], "Northcold_Timber", 1));
    scow.push(beamBetween([-SL / 2 + 20, s * (SB - 10), 135], [SL / 2 - 20, s * (SB - 10), 135], 9, 8, "Northcold_Timber"));
    scow.push(boxBounds([-SL / 2 - 46, s * 20, 52], [-SL / 2 - 36, s * (SB - 20), 70], "Northcold_Tar"));
  }
  scow.push(cylinderAt({ radius: 22, height: 70, segments: 10, bottom: [60, 0, 57] }, "Northcold_Timber"), cylinderAt({ radius: 26, height: 10, segments: 10, bottom: [60, 0, 120] }, "IronDark"));
  for (let k = 0; k < 4; k++) scow.push(beamBetween([60, 0, 100], [60 + Math.cos(k * 1.57) * 70, Math.sin(k * 1.57) * 70, 104], 6, 6, "Northcold_Plank"));
  scow.push(mound(420, 230, 18, 236, [-20, 10, 55], 0), mound(160, 120, 12, 237, [180, -60, 55], 30));
  scow.push(icicles([-SL / 2, -SB - 8, 50], [SL / 2, -SB - 8, 50], 238, 20, 30));
  parts.push(translate(rotateX(rotateY(merge(...scow), -3), 5), [560, 0, -18]));
  // ice heaved up round the scow and the jetty's end
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rnd() * 0.2, rx = 380 + rnd() * 40, ry = 230 + rnd() * 30;
    const g = translate(rotateZ(rotateY(box([60 + rnd() * 50, 22, 40 + rnd() * 35], [0, 0, 10], rnd() < 0.5 ? "Northcold_Floe" : "Northcold_RiverIceDark", 4), (rnd() - 0.5) * 50), a * DEG + 90), [560 + Math.cos(a) * rx, Math.sin(a) * ry, 0]);
    parts.push(g, snowFacets(g, 0.6, 1.5));
  }
  parts.push(slab(blobOutline(420, 260, 239, 0.12, 16).map(([x, y]) => [x + 560, y] as [number, number]), -4, 6, "Northcold_ShoreIce", "Northcold_FloeSide", 2));
  // the guide rope: from the post out over the ice to an iron stake frozen in
  parts.push(rope(sagLine([230, 150, 300], [1150, 160, 40], 70, 9), 2.2));
  parts.push(cylinderBetween([1150, 160, -10], [1160, 162, 60], 6, 6, "IronDark"), cylinderAt({ rBot: 34, rTop: 18, height: 18, segments: 8, bottom: [1152, 160, 0] }, "Northcold_Floe"), mound(110, 90, 20, 240, [1140, 150, 0], 20));
  return merge(...parts);
}

// A rowboat caught in the ice: listing, sunk to her waist in a slab of river ice that has
// heaved up round her, snow lying in her, one oar frozen across her, icicles off her gunwale.
function iceboundBoat(): Geo {
  const rnd = seeded(251), L = 440, B = 76, N = 10, rows: V3[][] = [], parts: Geo[] = [];
  const sheer = (t: number) => 62 + 26 * (2 * t - 1) ** 2;
  const half = (t: number) => B * (t < 0.15 ? 0.62 + t * 2.2 : Math.pow(Math.max(0, Math.cos(((t - 0.15) / 0.85) * Math.PI * 0.5)), 0.7) * (t < 0.45 ? 0.95 + (t - 0.15) * 0.17 : 1));
  for (let i = 0; i <= N; i++) {
    const t = i / N, x = -L / 2 + t * L, b = half(t), s = sheer(t), row: V3[] = [];
    for (let k = 0; k <= 8; k++) {
      const p = -Math.PI / 2 + (k * Math.PI) / 8;
      row.push([x, Math.sign(Math.sin(p)) * b * Math.pow(Math.abs(Math.sin(p)), 0.65), s * (1 - Math.cos(p))]);
    }
    rows.push(row);
  }
  const boat: Geo[] = [loft(rows, "Northcold_Hull")];
  // the painted strake and the gunwale
  for (const s of [0, 8]) {
    const strip: V3[][] = [rows.map((r) => r[s]), rows.map((r) => [r[s][0], r[s][1] * 1.02, r[s][2] - 12] as V3)];
    boat.push(loft(strip, "Northcold_HullPaint"));
    for (let i = 0; i < N; i++) boat.push(beamBetween(rows[i][s], rows[i + 1][s], 6, 5, "Northcold_Tar"));
  }
  // transom, thwarts, snow inside
  const tr = rows[0];
  for (let k = 0; k < 4; k++) boat.push(tri(tr[k], tr[k + 1], [tr[4][0], 0, tr[0][2]], "Northcold_Hull"), tri(tr[8 - k], tr[7 - k], [tr[4][0], 0, tr[0][2]], "Northcold_Hull"));
  for (const t of [0.3, 0.6]) {
    const i = Math.round(t * N), b = half(t);
    boat.push(boxBounds([rows[i][0][0] - 14, -b + 6, sheer(t) - 22], [rows[i][0][0] + 14, b - 6, sheer(t) - 16], "Northcold_Plank", 1));
  }
  boat.push(mound(L * 0.75, B * 1.5, 22, 253, [10, 0, 30], 0));
  boat.push(cylinderBetween([-60, -B - 60, 72], [40, B + 80, 70], 3, 6, "Northcold_Plank"), translate(rotateZ(box([60, 14, 3], [0, 0, 0], "Northcold_Plank", 1), 75), [55, B + 105, 69]));
  for (const s of [0, 8]) boat.push(icicles(rows[2][s], rows[8][s], 255 + s, 20, 30));
  parts.push(translate(rotateX(rotateY(merge(...boat), -4), 11), [0, 0, -34]));
  // the ice round her
  parts.push(slab(blobOutline(330, 200, 257, 0.12, 14), -4, 10, "Northcold_RiverIce", "Northcold_FloeSide", 3));
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rnd() * 0.25, rx = 250 + rnd() * 30, ry = 110 + rnd() * 20;
    const g = translate(rotateZ(rotateY(box([50 + rnd() * 40, 18, 30 + rnd() * 40], [0, 0, 10], rnd() < 0.5 ? "Northcold_Floe" : "Northcold_RiverIceDark", 4), -30 - rnd() * 25), a * DEG), [Math.cos(a) * rx, Math.sin(a) * ry, 0]);
    parts.push(g, snowFacets(g, 0.6, 1.5));
  }
  parts.push(mound(220, 120, 24, 259, [-180, 120, 0], 20), mound(160, 100, 18, 260, [200, -110, 0], -10));
  return merge(...parts);
}

// A clump of reeds at the river's edge, frozen into the shore ice: stems and blades bleached by
// the cold and furred with frost, cattails, a few snapped, snow lying among them.
function frozenReeds(): Geo {
  const rnd = seeded(271), parts: Geo[] = [slab(blobOutline(130, 95, 273, 0.2, 12), -2, 4, "Northcold_ShoreIce", "Northcold_FloeSide", 1.5), mound(170, 120, 14, 274, [-20, 10, 0], 30)];
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()), x = Math.cos(a) * 110 * d, y = Math.sin(a) * 80 * d;
    const h = 90 + rnd() * 100, la = rnd() * Math.PI * 2, lean = 0.08 + rnd() * 0.18;
    const tip: V3 = [x + Math.cos(la) * h * lean + 10, y + Math.sin(la) * h * lean, h];
    const mat = rnd() < 0.45 ? "Northcold_ReedFrost" : "Northcold_Reed";
    if (rnd() < 0.15) {
      // snapped: the top bent over
      const mid: V3 = [x + (tip[0] - x) * 0.55, y + (tip[1] - y) * 0.55, h * 0.55];
      parts.push(cylinderBetween([x, y, -2], mid, 1.8, 4, mat, 1.3), cylinderBetween(mid, [mid[0] + Math.cos(la) * 45, mid[1] + Math.sin(la) * 45, mid[2] - 25], 1.3, 4, mat, 0.6));
      continue;
    }
    parts.push(cylinderBetween([x, y, -2], tip, 1.8, 4, mat, 0.5));
    if (rnd() < 0.3) {
      const c: V3 = [x + (tip[0] - x) * 0.8, y + (tip[1] - y) * 0.8, h * 0.8];
      parts.push(cylinderBetween(c, [c[0] + (tip[0] - x) * 0.12, c[1] + (tip[1] - y) * 0.12, c[2] + 24], 4.5, 6, "Northcold_Cattail"), blob(5, [c[0] + (tip[0] - x) * 0.12, c[1] + (tip[1] - y) * 0.12, c[2] + 24], "Snow", 0.7, 6));
    }
    if (rnd() < 0.5) {
      const ba = la + (rnd() - 0.5) * 2, bl = 50 + rnd() * 50;
      parts.push(tri([x - 2, y, 5], [x + 2, y, 5], [x + Math.cos(ba) * bl * 0.6, y + Math.sin(ba) * bl * 0.6, bl * 0.8], rnd() < 0.5 ? "Northcold_ReedFrost" : "Northcold_Reed"));
    }
  }
  return merge(...parts);
}

// ======================================================================================
// ---- the sea cliffs of the north ----

// The ruined lighthouse on the highest headland: a tapering whitewashed tower with faded red
// bands on an eight-sided plinth, a crack open down one side, its gallery's railing half gone,
// the lantern's glazing smashed and its copper dome fallen onto the gallery; the keeper's
// cottage behind it roofless, its chimney still standing. About 13 x 10 m, 20 m tall.
const LH = { r0: 235, r1: 168, z0: 90, h: 1500 };
const lhR = (z: number) => LH.r0 + ((LH.r1 - LH.r0) * (z - LH.z0)) / LH.h;
function ruinedLighthouse(): Geo {
  const rnd = seeded(301), parts: Geo[] = [], top = LH.z0 + LH.h;
  // the plinth and its steps (toward -X)
  parts.push(cylinderAt({ rBot: 345, rTop: 330, height: LH.z0, segments: 8, bottom: [0, 0, -10] }, "Northcold_GraniteDark"));
  parts.push(cylinderAt({ radius: 338, height: 8, segments: 8, bottom: [0, 0, LH.z0 - 10] }, "Northcold_Coping"));
  for (let k = 0; k < 3; k++) parts.push(boxBounds([-345 - (3 - k) * 32, -90, -10], [-300, 90, LH.z0 - 10 - (2 - k) * 26], "Northcold_Coping", 2));
  // the tower, the bands, the crack
  parts.push(cylinderAt({ rBot: LH.r0, rTop: LH.r1, height: LH.h, segments: 16, bottom: [0, 0, LH.z0 - 2] }, "Northcold_Whitewash"));
  for (const [z, h] of [[520, 170], [1080, 170]]) parts.push(cylinderAt({ rBot: lhR(z) + 1.5, rTop: lhR(z + h) + 1.5, height: h, segments: 16, bottom: [0, 0, z] }, "Northcold_FadedRed"));
  // bare stone where the whitewash has flaked off
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2, z = LH.z0 + 60 + rnd() * (LH.h - 160), r = lhR(z) + 2;
    parts.push(translate(rotateZ(boxBounds([-2, -20 - rnd() * 30, 0], [2, 20 + rnd() * 30, 25 + rnd() * 40], rnd() < 0.6 ? "Northcold_BridgeStone" : "Northcold_Stain"), a * DEG), [Math.cos(a) * r, Math.sin(a) * r, z]));
  }
  for (let z = LH.z0 + 380, k = 0; z < top - 120; z += 46, k++) {
    const a = (78 + Math.sin(k * 1.3) * 5) / DEG, r = lhR(z) + 1, w = 16 + Math.abs(Math.sin(k * 2.1)) * 26;
    parts.push(translate(rotateZ(boxBounds([-3, -w / 2, 0], [3, w / 2, 48], "Northcold_Dark"), a * DEG), [Math.cos(a) * r, Math.sin(a) * r, z]));
    if (k % 3 === 1) parts.push(translate(rotateZ(boxBounds([-1, -w / 2 - 14, 0], [5, -w / 2, 22], "Northcold_BridgeStone", 1), a * DEG), [Math.cos(a) * (r + 2), Math.sin(a) * (r + 2), z + 10]));
  }
  // the door (toward -X) and the windows climbing round
  const dr = lhR(LH.z0 + 100);
  parts.push(boxBounds([-dr - 16, -78, LH.z0 - 2], [-dr + 30, 78, LH.z0 + 268], "Northcold_Coping", 3), boxBounds([-dr - 18, -58, LH.z0 - 2], [-dr + 32, 58, LH.z0 + 245], "Northcold_Dark"));
  parts.push(translate(rotateZ(boxBounds([0, 0, 0], [6, 100, 220], "Northcold_Tar", 1), -58), [-dr - 18, -56, LH.z0 + 4]));
  for (const [ang, z] of [[200, 420], [255, 690], [150, 930], [100, 1180], [210, 1400]] as [number, number][]) {
    const a = ang / DEG, r = lhR(z);
    parts.push(translate(rotateZ(merge(
      boxBounds([-10, -34, -12], [12, 34, 0], "Northcold_Coping", 2), boxBounds([-10, -30, 90], [12, 30, 104], "Northcold_Coping", 2),
      boxBounds([-12, -22, 0], [8, 22, 90], "Northcold_Dark"),
    ), ang), [Math.cos(a) * r, Math.sin(a) * r, z]));
  }
  // the gallery on corbels, its railing half gone, icicles round its edge, snow on it
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    parts.push(translate(rotateZ(boxBounds([-10, -12, -60], [70, 12, 0], "Northcold_Coping", 2), a * DEG), [Math.cos(a) * (LH.r1 - 30), Math.sin(a) * (LH.r1 - 30), top]));
  }
  parts.push(cylinderAt({ radius: 238, height: 24, segments: 16, bottom: [0, 0, top] }, "Northcold_Coping"));
  parts.push(icicles([238, 0, top], [0, 238, top], 303, 16, 60), icicles([0, 238, top], [-238, 0, top], 304, 16, 60), icicles([-238, 0, top], [0, -238, top], 305, 16, 60), icicles([0, -238, top], [238, 0, top], 306, 16, 60));
  const rail: V3[] = [];
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2, gone = k >= 4 && k <= 8;
    const p: V3 = [Math.cos(a) * 222, Math.sin(a) * 222, top + 24];
    rail.push(p);
    if (gone && k !== 6) continue;
    const lean = k === 6 ? 40 : 0;
    parts.push(cylinderBetween(p, [p[0] * (1 + lean / 222), p[1] * (1 + lean / 222), top + 24 + 105 - lean], 3, 5, "IronDark"));
  }
  for (let k = 0; k < 14; k++) if (!(k >= 3 && k <= 8)) parts.push(cylinderBetween([rail[k][0], rail[k][1], top + 125], [rail[(k + 1) % 14][0], rail[(k + 1) % 14][1], top + 125], 2.5, 4, "IronDark"), cylinderBetween([rail[k][0], rail[k][1], top + 75], [rail[(k + 1) % 14][0], rail[(k + 1) % 14][1], top + 75], 1.8, 4, "IronDark"));
  // the lantern room: a low wall, glazing bars (some snapped), two panes left, the lamp
  parts.push(cylinderAt({ radius: 150, height: 70, segments: 12, bottom: [0, 0, top + 24] }, "Northcold_Whitewash"), cylinderAt({ radius: 158, height: 8, segments: 12, bottom: [0, 0, top + 94] }, "Northcold_Coping"));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2, h = [230, 230, 120, 230, 60, 180, 230, 90][k];
    parts.push(cylinderBetween([Math.cos(a) * 146, Math.sin(a) * 146, top + 100], [Math.cos(a) * 140, Math.sin(a) * 140, top + 100 + h], 4, 5, "IronDark"));
  }
  for (const k of [0, 6]) {
    const a = ((k + 0.5) / 8) * Math.PI * 2;
    parts.push(translate(rotateZ(boxBounds([-1.5, -52, 0], [1.5, 52, 200], "GlassBlue"), a * DEG), [Math.cos(a) * 140, Math.sin(a) * 140, top + 102]));
  }
  parts.push(cylinderBetween([Math.cos(0) * 140, 0, top + 330], [Math.cos(Math.PI / 4) * 140, Math.sin(Math.PI / 4) * 140, top + 330], 3.5, 5, "IronDark"), cylinderBetween([Math.cos(Math.PI * 1.5) * 140, Math.sin(Math.PI * 1.5) * 140, top + 330], [Math.cos(Math.PI * 1.75) * 140, Math.sin(Math.PI * 1.75) * 140, top + 330], 3.5, 5, "IronDark"));
  parts.push(cylinderAt({ rBot: 34, rTop: 26, height: 90, segments: 10, bottom: [0, 0, top + 94] }, "Bronze"), translate(scale(sphereCenter(52, [0, 0, 0], "Northcold_Glaze", 12), [1, 1, 1.25]), [0, 0, top + 240]));
  // the dome, fallen onto the gallery and tipped over its edge, its ball on top
  const cap = new THREE.SphereGeometry(165, 14, 5, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).scale(1, 1, 0.62);
  const dome = merge(
    [{ geo: cap.toNonIndexed(), mat: "CopperGreen" }], cylinderAt({ radius: 160, height: 4, segments: 14, bottom: [0, 0, 2] }, "Northcold_Dark"),
    translate(torus(163, 7, 14, 4, "CopperGreen"), [0, 0, 4]), cylinderAt({ radius: 14, height: 40, segments: 6, bottom: [0, 0, 95] }, "CopperGreen"), sphereCenter(22, [0, 0, 145], "CopperGreen", 8),
  );
  parts.push(translate(rotateZ(rotateY(dome, -62), 20), [-150, 470, 60]), mound(300, 200, 36, 312, [-100, 480, 0], 30));
  parts.push(translate(rotateZ(rotateY(box([90, 60, 10], [0, 0, 0], "CopperGreen", 2), 20), 30), [60, 520, 8]), translate(rotateZ(rotateY(box([70, 40, 8], [0, 0, 0], "CopperGreen", 2), -15), 75), [-330, 360, 6]));
  parts.push(mound(260, 120, 26, 307, [70, -150, top + 22], 30));
  // the keeper's cottage behind (+X): roofless walls with ragged tops, a chimney, fallen beams
  const C = { x0: 260, x1: 680, y0: -260, y1: 200 };
  const walls: [number, number, number, number, number][] = [
    [C.x0 + 120, C.y0, C.x1, C.y0 + 40, 260], [C.x1 - 40, C.y0, C.x1, C.y1, 300], [C.x0 + 220, C.y1 - 40, C.x1, C.y1, 210], [C.x0 + 120, C.y0, C.x0 + 160, C.y1 - 140, 230],
  ];
  for (const [x0, y0, x1, y1, h] of walls) {
    const along = x1 - x0 > y1 - y0, n = Math.round((along ? x1 - x0 : y1 - y0) / 60);
    parts.push(boxBounds([x0, y0, -10], [x1, y1, h * 0.55], "Northcold_BridgeStone", 3));
    for (let k = 0; k < n; k++) {
      const hh = h * (0.55 + 0.45 * Math.abs(Math.sin(k * 1.7 + h))) * (rnd() < 0.2 ? 0.7 : 1);
      const a = along ? x0 + ((x1 - x0) * k) / n : x0, b = along ? y0 : y0 + ((y1 - y0) * k) / n;
      const g = boxBounds([a, b, h * 0.5], along ? [a + (x1 - x0) / n - 2, y1, hh] : [x1, b + (y1 - y0) / n - 2, hh], "Northcold_BridgeStone", 2);
      parts.push(g);
      if (rnd() < 0.6) parts.push(blob(28, [along ? a + 28 : (x0 + x1) / 2, along ? (y0 + y1) / 2 : b + 28, hh + 2], "Snow", 0.35, 7));
    }
  }
  parts.push(boxAt([90, 80, 520], [C.x1 - 20, -30, -10], "Northcold_BridgeStoneDark", 3), boxAt([100, 90, 16], [C.x1 - 20, -30, 506], "Northcold_Coping", 3), blob(44, [C.x1 - 20, -30, 522], "Snow", 0.4, 8));
  parts.push(beamBetween([C.x0 + 140, C.y0 + 20, 230], [C.x0 + 330, C.y0 + 200, 0], 20, 20, "Northcold_Timber"), beamBetween([C.x1 - 40, C.y1 - 30, 280], [C.x1 - 260, C.y1 - 160, 10], 20, 20, "Northcold_Timber"), beamBetween([C.x0 + 420, C.y0 + 20, 250], [C.x0 + 380, C.y1 - 40, 120], 18, 18, "Northcold_Timber"));
  parts.push(mound(300, 260, 40, 309, [C.x0 + 400, -40, 0], 30), mound(260, 140, 50, 310, [C.x0 + 60, C.y0 - 60, 0], 0));
  // stones fallen out of the crack at the foot, snow on the plinth
  for (let i = 0; i < 6; i++) parts.push(translate(rotateZ(rotateY(box([40 + rnd() * 30, 30 + rnd() * 20, 22], [0, 0, 0], "Northcold_BridgeStone", 3), (rnd() - 0.5) * 40), rnd() * 180), [Math.cos(1.4) * 330 + (rnd() - 0.5) * 160, Math.sin(1.4) * 330 + 60 + rnd() * 120, LH.z0 + 4]));
  for (const a of [0.3, 2.2, 3.6, 5.0]) parts.push(mound(220, 120, 22, 311 + a * 10, [Math.cos(a) * 270, Math.sin(a) * 270, LH.z0 - 6], a * DEG + 90));
  return merge(...parts);
}

// A sea stack: a pillar of dark stone in beds, each bed a little smaller than the one under it,
// snow lying on every ledge, ice round its foot at the waterline (z = 0 the sea), birds on top.
// About 6 m across, 12 m tall.
function seaStack(): Geo {
  const rnd = seeded(331), parts: Geo[] = [];
  // the beds: a pillar narrowing a little upward, some beds jutting out over the one below
  const beds: { z: number; h: number; r: number; ox: number; oy: number }[] = [];
  let z = -80, ox = 0, oy = 0;
  while (z < 1100) {
    const h = 90 + rnd() * 100, t = Math.max(0, z) / 1100, r = (290 - 90 * t) * (0.9 + rnd() * 0.18);
    beds.push({ z, h, r, ox, oy });
    z += h - 4;
    ox += (rnd() - 0.5) * 36;
    oy += (rnd() - 0.5) * 36;
  }
  beds.forEach((bd, k) => {
    const next = beds[k + 1], ledge = !next || next.r < bd.r * 0.9;
    const o = blobOutline(bd.r, bd.r * (0.82 + rnd() * 0.12), 333 + k, 0.24, 15).map(([x, y]) => [x + bd.ox, y + bd.oy] as [number, number]);
    parts.push(slab(o, bd.z, bd.z + bd.h, ledge && bd.z > 40 ? "Snow" : "Northcold_SeaRockLight", k % 2 ? "Northcold_SeaRock" : "Northcold_SeaRockLight", 5));
  });
  const last = beds[beds.length - 1];
  z = last.z + last.h;
  parts.push(mound(last.r * 1.8, last.r * 1.5, 45, 339, [last.ox, last.oy, z - 8], 20));
  // knobs of rock standing out of its sides, snow on their shoulders
  for (let i = 0; i < 7; i++) {
    const bd = beds[1 + Math.floor(rnd() * (beds.length - 2))], a = rnd() * Math.PI * 2, s = 80 + rnd() * 70;
    parts.push(coldRock([s * 1.4, s, s * 1.2], 0.45, 345 + i, { mat: "Northcold_SeaRock", at: [bd.ox + Math.cos(a) * bd.r * 0.85, bd.oy + Math.sin(a) * bd.r * 0.75, bd.z], cover: 0.4 }));
  }
  const top = z;
  // boulders fallen at its foot, ice at the waterline, droppings and birds
  for (let i = 0; i < 6; i++) {
    const a = rnd() * Math.PI * 2;
    parts.push(coldRock([110 + rnd() * 80, 90 + rnd() * 60, 70 + rnd() * 50], 0.45, 341 + i, { mat: "Northcold_SeaRock", at: [Math.cos(a) * 330, Math.sin(a) * 300, -40], cover: 0.35, coat: "Northcold_Glaze" }));
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + rnd() * 0.3;
    parts.push(translate(rotateZ(slab(blobOutline(70 + rnd() * 40, 40 + rnd() * 20, 350 + i, 0.3, 8), -8, 6 + rnd() * 6, "Northcold_Floe", "Northcold_FloeSide", 2), a * DEG), [Math.cos(a) * 320, Math.sin(a) * 290, 0]));
  }
  for (let i = 0; i < 8; i++) {
    const bd = beds[2 + Math.floor(rnd() * (beds.length - 3))], a = rnd() * Math.PI * 2;
    parts.push(translate(rotateZ(boxBounds([-2, -8 - rnd() * 6, -60 - rnd() * 80], [2, 8, 0], "Northcold_Guano"), a * DEG), [bd.ox + Math.cos(a) * bd.r * 0.86, bd.oy + Math.sin(a) * bd.r * 0.78, bd.z + bd.h]));
  }
  parts.push(bird([last.ox + 30, last.oy - 40, top + 22], 200, "gull", 1.7), bird([last.ox - 50, last.oy + 30, top + 20], 30, "gull", 1.7), bird([last.ox + 60, last.oy + 60, top + 16], 120, "cormorant", 1.7));
  return merge(...parts);
}

// A seabird: a gull, a puffin or a cormorant, sitting, facing `h` degrees.
function bird(at: V3, h: number, kind: "gull" | "puffin" | "cormorant", s = 1): Geo {
  const [back, belly, wing] = kind === "gull" ? ["Northcold_Feather", "Northcold_Feather", "Northcold_FeatherGrey"] : kind === "puffin" ? ["Northcold_FeatherDark", "Northcold_Feather", "Northcold_FeatherDark"] : ["Northcold_FeatherDark", "Northcold_FeatherDark", "Northcold_FeatherDark"];
  const up = kind === "gull" ? 0.25 : 0.55, L = kind === "puffin" ? 0.8 : 1;
  const g = merge(
    translate(rotateY(scale(sphereCenter(11, [0, 0, 0], belly, 7), [1.5 * L, 1, 1]), -up * 40), [0, 0, 13]),
    translate(rotateY(scale(sphereCenter(10, [0, 0, 0], back, 7), [1.45 * L, 1.05, 0.8]), -up * 40), [2, 0, 16]),
    ...[-1, 1].map((sy) => translate(rotateY(scale(sphereCenter(8, [0, 0, 0], wing, 6), [1.9 * L, 0.35, 0.7]), -up * 30 - 8), [5, sy * 8.5, 16])),
    sphereCenter(7.5, [-12 * L, 0, 25 + up * 6], back, 7),
    cylinderBetween([-17 * L, 0, 25 + up * 6], [-28 * L, 0, 23 + up * 6], kind === "puffin" ? 4 : 2.2, 4, kind === "cormorant" ? "Northcold_FeatherGrey" : "Northcold_Beak", 0.5),
    tri([14 * L, -5, 13], [14 * L, 5, 13], [26 * L, 0, 10 - up * 6], wing),
    cylinderBetween([0, -4, 4], [0, -4, -2], 1.2, 3, "Northcold_Beak"), cylinderBetween([0, 4, 4], [0, 4, -2], 1.2, 3, "Northcold_Beak"),
  );
  return translate(rotateZ(scale(g, [s, s, s]), h), at);
}

// A seabirds' rock by the shore: a heap of dark boulders whitened with droppings, nests of
// weed and twigs on its ledges, gulls, puffins and a cormorant sitting on it. About 5 x 4 m.
function seabirdRock(): Geo {
  const rnd = seeded(361), parts: Geo[] = [];
  const rocks: [V3, V3, number][] = [[[0, 0, 0], [380, 300, 250], 363], [[-150, 170, 0], [220, 180, 140], 365], [[170, -160, 0], [200, 170, 120], 367], [[60, 200, 120], [180, 150, 120], 369], [[-200, -120, 0], [160, 140, 90], 371]];
  for (const [at, size, seed] of rocks) {
    const body = rotateZ(rock(size, 0.42, seed, "Northcold_SeaRock"), seed * 7);
    parts.push(translate(merge(body, snowFacets(body, 0.82, 2.5, "Northcold_Guano"), snowFacets(body, 0.93, 4, "Snow")), at));
  }
  // streaks of droppings down its sides, a little snow in the hollows
  for (let i = 0; i < 12; i++) {
    const a = rnd() * Math.PI * 2;
    parts.push(translate(rotateZ(rotateY(boxBounds([-1, -6 - rnd() * 6, -50 - rnd() * 60], [3, 6, 0], "Northcold_Guano"), -14), a * DEG), [Math.cos(a) * (150 + rnd() * 20), Math.sin(a) * (120 + rnd() * 20), 180 + rnd() * 40]));
  }
  parts.push(mound(180, 120, 26, 373, [-260, 60, 0], 20), mound(160, 100, 20, 374, [240, 60, 0], -30));
  // the nests and the birds on the ledges
  const ledges: [V3, number, "gull" | "puffin" | "cormorant"][] = [
    [[-20, 30, 245], 160, "gull"], [[70, -60, 238], 230, "gull"], [[-90, -40, 232], 90, "cormorant"], [[50, 200, 232], 200, "puffin"], [[90, 230, 228], 250, "puffin"],
    [[-160, 180, 136], 140, "puffin"], [[-130, 210, 134], 100, "puffin"], [[180, -150, 118], 300, "gull"], [[-220, -110, 88], 40, "gull"], [[10, 230, 230], 170, "puffin"],
  ];
  for (const [at, h, kind] of ledges) parts.push(bird(at, h, kind, kind === "puffin" ? 1.5 : 1.8));
  for (const at of [[-40, 60, 246], [40, -20, 240], [-170, 150, 138]] as V3[]) {
    parts.push(translate(torus(16, 6, 9, 4, "Northcold_Kelp"), [at[0], at[1], at[2] + 3]));
    for (let k = 0; k < 2; k++) parts.push(sphereCenter(4.5, [at[0] + (k - 0.5) * 8, at[1] + 2, at[2] + 4], "Northcold_PebbleLight", 6));
  }
  return merge(...parts);
}

// Rocks glazed with ice where the spray freezes on them: dark boulders under a clear shell of
// ice on their tops, icicles hanging off every overhang, frozen spray heaped round their feet.
// About 4.6 x 3.6 m.
function icedRocks(): Geo {
  const rnd = seeded(381), parts: Geo[] = [];
  const rocks: [V3, V3, number][] = [[[0, 0, 0], [300, 240, 210], 383], [[-170, 130, 0], [190, 160, 130], 385], [[170, -110, 0], [170, 150, 150], 387], [[-120, -150, 0], [130, 110, 80], 389]];
  for (const [at, size, seed] of rocks) {
    const body = rock(size, 0.45, seed, "Northcold_SeaRock");
    const g = merge(body, snowFacets(body, 0.2, 3, "Northcold_Glaze"), snowFacets(body, 0.88, 4, "Snow"));
    parts.push(translate(rotateZ(g, seed * 11), at));
    // icicles round its shoulder
    const n = 9;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + rnd() * 0.3, rx = size[0] * 0.42, ry = size[1] * 0.42, z = size[2] * (0.45 + rnd() * 0.2);
      parts.push(icicles([at[0] + Math.cos(a) * rx, at[1] + Math.sin(a) * ry, z], [at[0] + Math.cos(a + 0.4) * rx, at[1] + Math.sin(a + 0.4) * ry, z - 4], seed + k, 10, 40));
    }
  }
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2, d = 150 + rnd() * 90;
    parts.push(translate(scale(sphereCenter(30 + rnd() * 25, [0, 0, 0], "Northcold_Glaze", 7), [1.3, 1, 0.5]), [Math.cos(a) * d, Math.sin(a) * d * 0.8, 4]));
  }
  return merge(...parts);
}

// A shipwreck on the shingle: a two-masted trader thrown up by a storm, lying over on her side
// with the planking of her flank torn away to the ribs, her mainmast snapped and lying beside
// her with its sail in rags, barrels and timbers strewn about, snow on all of it. About 19 x
// 11 m.
function shipwreck(): Geo {
  const rnd = seeded(401), L = 1500, B = 210, N = 14, parts: Geo[] = [], hull: Geo[] = [];
  const sheer = (t: number) => 300 + 90 * (2 * t - 1) ** 2 + (t > 0.85 ? (t - 0.85) * 300 : 0);
  const half = (t: number) => B * (t < 0.12 ? 0.7 + t * 2.5 : Math.pow(Math.max(0, Math.cos(((t - 0.12) / 0.88) * Math.PI * 0.5)), 0.55));
  const sec = (t: number, k: number, inset = 0): V3 => {
    const p = -Math.PI / 2 + (k * Math.PI) / 8, b = half(t) - inset, s = sheer(t);
    return [-L / 2 + t * L, Math.sign(Math.sin(p)) * b * Math.pow(Math.abs(Math.sin(p)), 0.5), s * (1 - Math.cos(p)) + inset * 0.3];
  };
  // the planking: whole on the side she lies on (k < 4), torn open amidships on the other
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N, torn = i >= 5 && i <= 9;
    for (let k = 0; k < 8; k++) {
      if (torn && k >= 4 && !(k === 7 && (i === 5 || i === 9))) continue;
      hull.push(loft([[sec(t0, k), sec(t0, k + 1)], [sec(t1, k), sec(t1, k + 1)]], k % 3 === 0 ? "Northcold_HullPale" : "Northcold_Hull"));
    }
  }
  // the ribs showing where she is torn, a wale along her sheer, the stern's transom
  for (let i = 5; i <= 10; i++) {
    const t = i / N;
    for (let k = 3; k < 8; k++) hull.push(cylinderBetween(sec(t, k, 8), sec(t, k + 1, 8), 9, 5, "Northcold_Timber"));
  }
  for (let i = 0; i < N; i++) for (const k of [0, 8]) hull.push(beamBetween(sec(i / N, k), sec((i + 1) / N, k), 14, 12, "Northcold_Tar"));
  const tr = Array.from({ length: 9 }, (_, k) => sec(0, k));
  for (let k = 0; k < 4; k++) hull.push(tri(tr[k], tr[k + 1], [tr[0][0], 0, tr[0][2]], "Northcold_Hull"), tri(tr[8 - k], tr[7 - k], [tr[0][0], 0, tr[0][2]], "Northcold_Hull"));
  // what is left of her deck at the ends, the mainmast's stump, the foremast standing
  hull.push(boxBounds([-L / 2 + 20, -B * 0.6, 300], [-L / 2 + 360, B * 0.6, 316], "WoodGrey", 2), boxBounds([L / 2 - 420, -B * 0.5, 304], [L / 2 - 160, B * 0.5, 320], "WoodGrey", 2));
  hull.push(cylinderAt({ radius: 20, height: 170, segments: 8, bottom: [-80, 0, 220] }, "Northcold_Timber"), cylinderAt({ rBot: 16, rTop: 11, height: 780, segments: 8, bottom: [420, 0, 260] }, "Northcold_Timber"));
  hull.push(beamBetween([420, -180, 760], [420, 180, 780], 10, 10, "Northcold_Timber"));
  hull.push(rope([[420, 0, 1000], [-L / 2 + 40, 0, 330]], 1.5), rope([[420, 0, 980], [L / 2 + 60, 0, 360]], 1.5));
  hull.push(loft([[[420, -170, 760], [420, 0, 772], [420, 170, 780]], [[440, -150, 600], [470, 0, 640], [430, 130, 520]]], "Northcold_Sail"));
  hull.push(icicles(sec(0.05, 0), sec(0.95, 0), 403, 30, 50));
  // she lies over to port with her torn flank up, her bow up on the shingle, her keel half buried
  const lying = translate(rotateY(rotateX(merge(...hull), 38), -4), [0, -60, -40]);
  parts.push(lying, snowFacets(lying, 0.75, 3));
  // the mainmast lying alongside, its sail in rags, rigging trailing
  parts.push(cylinderBetween([-300, -620, 20], [700, -820, 30], 18, 8, "Northcold_Timber", 12), cylinderBetween([200, -720, 30], [240, -560, 140], 8, 6, "Northcold_Timber"));
  parts.push(loft([[[-100, -660, 24], [200, -720, 28], [500, -780, 30]], [[-60, -760, 4], [220, -890, 6], [460, -900, 4]]], "Northcold_Sail"), tri([200, -720, 30], [240, -560, 140], [320, -620, 10], "Northcold_Sail"));
  parts.push(rope(sagLine([-300, -620, 30], [-200, -300, 160], -30, 5), 1.4), rope(sagLine([700, -820, 30], [520, -320, 200], -40, 5), 1.4));
  // barrels (one stove in), timbers, a chest, the anchor half buried
  for (const [x, y, lie] of [[-650, -650, 1], [-520, -730, 0], [820, -300, 1], [880, 200, 0]] as number[][]) {
    const b = merge(cylinderAt({ rBot: 26, rTop: 30, height: 40, segments: 10, bottom: [0, 0, 0] }, "WoodShade"), cylinderAt({ rBot: 30, rTop: 26, height: 40, segments: 10, bottom: [0, 0, 40] }, "WoodShade"), cylinderAt({ radius: 28.5, height: 5, segments: 10, bottom: [0, 0, 12] }, "Northcold_Rust"), cylinderAt({ radius: 28.5, height: 5, segments: 10, bottom: [0, 0, 64] }, "Northcold_Rust"));
    parts.push(translate(lie ? rotateY(b, 90) : b, [x, y, lie ? 28 : 0]));
  }
  for (let i = 0; i < 9; i++) {
    const x = -800 + rnd() * 1700, y = -980 + rnd() * 300 + (i % 3 === 0 ? 1300 : 0), a = rnd() * 180, l = 120 + rnd() * 180;
    parts.push(translate(rotateZ(box([l, 22, 8], [0, 0, 4], rnd() < 0.5 ? "WoodGrey" : "Northcold_Hull", 2), a), [x, y, 0]));
  }
  parts.push(translate(rotateZ(merge(boxAt([80, 50, 40], [0, 0, 0], "WoodWarm", 3), boxAt([84, 54, 6], [0, 0, 18], "IronDark")), 25), [-880, 150, 0]));
  parts.push(translate(rotateZ(rotateX(merge(
    cylinderBetween([0, 0, 0], [0, 0, 180], 7, 6, "IronDark"), cylinderBetween([0, -70, 30], [0, 70, 30], 6, 6, "IronDark"),
    cylinderBetween([0, -70, 30], [0, -95, 75], 6, 6, "IronDark"), cylinderBetween([0, 70, 30], [0, 95, 75], 6, 6, "IronDark"),
    translate(torus(16, 3.5, 10, 4, "IronDark"), [0, 0, 195]), cylinderBetween([0, -40, 160], [0, 40, 160], 5, 6, "Northcold_Timber"),
  ), -72), 40), [-900, -200, 10]));
  parts.push(mound(500, 220, 40, 405, [-300, 160, 0], 10), mound(420, 200, 34, 406, [500, 140, 0], -10), mound(300, 160, 24, 407, [100, -980, 0], 5));
  // (about centred on its footprint; the field's solids are drawn to these numbers)
  return translate(merge(...parts), [0, 300, 0]);
}

// A bank of shingle (ground, walked over): rounded pebbles heaped along a storm line, a few
// cobbles, a bleached log of driftwood, strands of kelp, ice crusted on the wet stones, snow.
// About 7.5 x 4.6 m.
function shingleBank(): Geo {
  const rnd = seeded(421), parts: Geo[] = [mound(740, 440, 16, 423, [0, 0, 0], 0, "Northcold_Pebble")];
  const mats = ["Northcold_Pebble", "Northcold_PebbleDark", "Northcold_PebbleLight"];
  for (let i = 0; i < 70; i++) {
    const x = (rnd() - 0.5) * 700, berm = Math.sin(x / 140) * 40, y = berm + (rnd() - 0.5) * (rnd() < 0.6 ? 160 : 380);
    if (Math.hypot(x / 360, y / 215) > 1) continue;
    const r = 6 + rnd() * rnd() * 14, z = 14 * (1 - Math.hypot(x / 370, y / 220) ** 2);
    parts.push(translate(rotateZ(scale(sphereCenter(r, [0, 0, 0], mats[Math.floor(rnd() * 3)], 5), [1.3, 1, 0.55]), rnd() * 180), [x, y, z + r * 0.15]));
  }
  for (let i = 0; i < 4; i++) parts.push(coldRock([40 + rnd() * 30, 34 + rnd() * 20, 26], 0.4, 425 + i, { mat: "Northcold_PebbleDark", at: [(rnd() - 0.5) * 560, (rnd() - 0.5) * 280, 2], cover: 0.25 }));
  parts.push(cylinderBetween([-260, 120, 18], [130, 170, 26], 15, 8, "Northcold_Driftwood", 11), cylinderBetween([-80, 140, 22], [-140, 220, 40], 5, 5, "Northcold_Driftwood"), cylinderBetween([60, 160, 24], [110, 90, 44], 4, 5, "Northcold_Driftwood"));
  for (let i = 0; i < 6; i++) {
    let x = (rnd() - 0.5) * 560, y = -60 + (rnd() - 0.5) * 120;
    for (let k = 0; k < 4; k++) {
      const nx = x + 20 + rnd() * 20, ny = y + (rnd() - 0.5) * 30;
      parts.push(beamBetween([x, y, 14], [nx, ny, 14], 4, 1.5, "Northcold_Kelp"));
      [x, y] = [nx, ny];
    }
  }
  for (const [x, y, rx, ry] of [[-200, -120, 90, 50], [180, -90, 110, 60], [40, 40, 70, 40]] as number[][]) parts.push(translate(slab(blobOutline(rx, ry, x + 900, 0.25, 9), 8, 17, "Northcold_Glaze", "Northcold_Glaze", 2), [x, y, 0]));
  parts.push(mound(220, 120, 14, 427, [250, 120, 4], 20), mound(160, 90, 10, 428, [-300, -60, 2], -10));
  return merge(...parts);
}

// Grass flattened by the wind off the sea under a thin snow: tufts of pale stems all lying the
// same way (toward -X), a few seed heads still up. Ground, walked over. About 3.4 x 2.4 m.
function flattenedGrass(): Geo {
  const rnd = seeded(441), parts: Geo[] = [mound(340, 230, 9, 443, [0, 0, -1]), mound(180, 120, 8, 444, [100, 70, 0], 20, "Northcold_Frost")];
  for (let t = 0; t < 26; t++) {
    const cx = (rnd() - 0.5) * 300, cy = (rnd() - 0.5) * 200;
    if (Math.hypot(cx / 160, cy / 110) > 1) continue;
    const z0 = 7 * (1 - Math.hypot(cx / 170, cy / 115) ** 2);
    for (let k = 0; k < 7; k++) {
      const a = Math.PI + (rnd() - 0.5) * 0.7, len = 30 + rnd() * 35, rise = 6 + rnd() * 14, mat = rnd() < 0.55 ? "Northcold_Grass" : "Northcold_GrassPale";
      const bx = cx + (rnd() - 0.5) * 16, by = cy + (rnd() - 0.5) * 16;
      parts.push(tri([bx, by - 2.5, z0 - 2], [bx, by + 2.5, z0 - 2], [bx + Math.cos(a) * len, by + Math.sin(a) * len, z0 + rise], mat));
    }
    if (rnd() < 0.35) {
      const top: V3 = [cx - 10, cy + (rnd() - 0.5) * 10, z0 + 28 + rnd() * 16];
      parts.push(cylinderBetween([cx, cy, z0 - 2], top, 0.8, 3, "Northcold_GrassPale"), cylinderBetween(top, [top[0] - 4, top[1], top[2] + 9], 2, 4, "Northcold_Grass"));
    }
  }
  return merge(...parts);
}

// ======================================================================================
// ---- the tangled hills: the hermit and the old silver mine ----

// The rock round an opening in a cliff (its back, +X, goes into the hill): boulders piled to an
// arch, snow on their shoulders, the dark inside. `w` wide, `h` high.
function rockArch(w: number, h: number, seed: number, mat: string): Geo {
  const rnd = seeded(seed), parts: Geo[] = [];
  parts.push(boxBounds([-30, -w / 2 - 10, -10], [260, w / 2 + 10, h + 10], "Northcold_Dark"));
  parts.push(coldRock([420, 300, h + 160], 0.32, seed + 1, { mat, at: [120, w / 2 + 120, -20], cover: 0.3 }));
  parts.push(coldRock([400, 300, h + 120], 0.32, seed + 2, { mat, at: [130, -w / 2 - 120, -20], cover: 0.3 }));
  parts.push(coldRock([360, w + 360, 240], 0.3, seed + 3, { mat, at: [110, 0, h - 40], cover: 0.5, flat: true }));
  parts.push(coldRock([260, 260, 200], 0.4, seed + 4, { mat, at: [190, w / 2 + 260, -20], cover: 0.4 }), coldRock([240, 240, 180], 0.4, seed + 5, { mat, at: [200, -w / 2 - 270, -20], cover: 0.4 }));
  for (let i = 0; i < 5; i++) parts.push(coldRock([60 + rnd() * 50, 50 + rnd() * 40, 40 + rnd() * 30], 0.5, seed + 10 + i, { mat, at: [-80 - rnd() * 120, (rnd() < 0.5 ? -1 : 1) * (w / 2 + 40 + rnd() * 160), 0], cover: 0.45 }));
  parts.push(icicles([-60, -w / 2 - 20, h + 6], [-60, w / 2 + 20, h + 6], seed + 20, 14, 70));
  return merge(...parts);
}

// The hermit's cave: a dark mouth in a crag hung with a curtain of hides half drawn, a lantern
// on a hook, his fire smouldering under a pot on a tripod, a log to sit on, firewood, a rack of
// drying herbs and fish, a little tower of prayer stones. About 9 x 6 m.
function caveMouth(): Geo {
  const rnd = seeded(461), W = 300, Hh = 300, parts: Geo[] = [rockArch(W, Hh, 463, "Northcold_GraniteDark")];
  // the floor running in, the curtain on its pole
  parts.push(slab(blobOutline(220, 170, 465, 0.15, 10).map(([x, y]) => [x + 40, y] as [number, number]), -2, 3, "Northcold_Earth", "Northcold_Earth"));
  parts.push(cylinderBetween([-40, -W / 2 - 30, Hh - 30], [-40, W / 2 + 30, Hh - 20], 4, 6, "Northcold_Timber"));
  for (let k = 0; k < 5; k++) {
    const y0 = -W / 2 + 10 + k * 34, sway = k * 4;
    parts.push(translate(rotateX(box([5, 36, Hh - 50], [0, 0, 0], k % 2 ? "Northcold_Hide" : "Northcold_HideDark", 1.5), (k - 2) * 1.5), [-42 + sway * 0.3, y0 + 16, (Hh - 50) / 2 + 12]));
  }
  parts.push(translate(rotateZ(box([5, 70, Hh - 60], [0, 0, (Hh - 60) / 2 + 20], "Northcold_Hide", 1.5), 25), [-50, W / 2 - 20, 0]));
  // the lantern
  parts.push(cylinderBetween([-50, W / 2 + 40, Hh - 40], [-90, W / 2 + 40, Hh - 40], 2, 4, "IronDark"), boxBounds([-104, W / 2 + 28, Hh - 100], [-80, W / 2 + 52, Hh - 60], "IronDark"), boxBounds([-101, W / 2 + 31, Hh - 96], [-83, W / 2 + 49, Hh - 64], "LanternGlow"));
  // the fire, the tripod and pot
  const F: V3 = [-260, -40, 0];
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    parts.push(coldRock([26, 22, 16], 0.5, 470 + k, { mat: "Northcold_Granite", at: [F[0] + Math.cos(a) * 52, F[1] + Math.sin(a) * 52, 0], cover: 0 }));
  }
  parts.push(cylinderAt({ radius: 44, height: 4, segments: 10, bottom: [F[0], F[1], 0] }, "Northcold_Ash"));
  for (let k = 0; k < 4; k++) parts.push(cylinderBetween([F[0] + Math.cos(k * 1.6) * 34, F[1] + Math.sin(k * 1.6) * 34, 4], [F[0] - Math.cos(k * 1.6) * 8, F[1] - Math.sin(k * 1.6) * 8, 14], 5, 6, "Northcold_Char"));
  parts.push(translate(scale(sphereCenter(18, [0, 0, 0], "Northcold_Ember", 7), [1, 1, 0.4]), [F[0], F[1], 6]));
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.4;
    parts.push(cylinderBetween([F[0] + Math.cos(a) * 70, F[1] + Math.sin(a) * 70, 0], [F[0], F[1], 140], 2.5, 5, "Northcold_Timber"));
  }
  parts.push(cylinderBetween([F[0], F[1], 140], [F[0], F[1], 74], 0.8, 3, "IronDark"), cylinderAt({ rBot: 16, rTop: 20, height: 26, segments: 10, bottom: [F[0], F[1], 48] }, "IronDark"));
  // a log to sit on, firewood stacked against the rock, the drying rack, prayer stones
  parts.push(cylinderBetween([-330, 60, 18], [-200, 120, 18], 18, 8, "Northcold_Timber"), mound(120, 50, 8, 475, [-265, 90, 34], 25));
  for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) parts.push(cylinderBetween([-40 + k * 24, W / 2 + 70 + (r % 2) * 10, 14 + r * 24], [-40 + k * 24 + (rnd() - 0.5) * 6, W / 2 + 160, 14 + r * 24], 11, 6, "Northcold_Timber"));
  for (const y of [-W / 2 - 130, -W / 2 - 330]) parts.push(cylinderAt({ radius: 6, height: 190, segments: 6, bottom: [-200, y, -5] }, "Northcold_Timber"));
  parts.push(cylinderBetween([-200, -W / 2 - 140, 180], [-200, -W / 2 - 320, 180], 4, 6, "Northcold_Timber"));
  for (let k = 0; k < 6; k++) {
    const y = -W / 2 - 160 - k * 28;
    if (k % 2) parts.push(translate(scale(sphereCenter(9, [0, 0, 0], "Northcold_Fish", 6), [0.6, 0.5, 2.4]), [-200, y, 150]));
    else parts.push(cylinderBetween([-200, y, 178], [-200, y, 140], 1, 3, "RopeTan"), translate(scale(sphereCenter(12, [0, 0, 0], k === 2 ? "Northcold_Grass" : "PineNeedle", 6), [1, 1, 1.6]), [-200, y, 130]));
  }
  let z = 0;
  for (let k = 0; k < 6; k++) {
    const s = 34 - k * 4.5, hh = 10 + rnd() * 5;
    parts.push(translate(rotateZ(rock([s * 1.4, s, hh], 0.3, 480 + k, "Northcold_Granite", true), rnd() * 180), [-170, 220, z]));
    z += hh * 0.85;
  }
  parts.push(mound(200, 120, 30, 487, [-300, -260, 0], 30), mound(160, 100, 24, 488, [-150, 300, 0], -20));
  return merge(...parts);
}

// The adit of the old silver mine: a timbered portal into the crag, boarded across and one board
// fallen, a red warning board, the rails coming out of the dark onto the snow, a lamp hook.
// About 8 x 6 m.
function mineAdit(): Geo {
  const rnd = seeded(501), W = 280, Hh = 290, parts: Geo[] = [rockArch(W + 60, Hh + 30, 503, "Northcold_Granite")];
  // the portal: two sets of posts and caps, braces, lagging over the cap
  for (const x of [-40, 60]) {
    for (const s of [-1, 1]) parts.push(boxAt([30, 30, Hh], [x, s * (W / 2), -5], "Northcold_Timber", 3), beamBetween([x, s * (W / 2 - 15), Hh - 70], [x, s * (W / 2 - 80), Hh - 5], 16, 16, "Northcold_Timber"));
    parts.push(boxBounds([x - 18, -W / 2 - 30, Hh - 5], [x + 18, W / 2 + 30, Hh + 32], "Northcold_Timber", 3));
  }
  for (let k = 0; k < 8; k++) parts.push(boxBounds([-60 + k * 16, -W / 2 - 20, Hh + 32], [-46 + k * 16, W / 2 + 20, Hh + 38], "Northcold_Plank", 1));
  parts.push(mound(200, W + 60, 24, 505, [0, 0, Hh + 36], 0), icicles([-58, -W / 2 - 30, Hh - 5], [-58, W / 2 + 30, Hh - 5], 507, 16, 50));
  // boards nailed across, one hanging by a nail, the red warning board
  parts.push(translate(rotateX(box([5, W + 40, 24], [0, 0, 0], "Northcold_Plank", 1), 12), [-60, 0, 110]), translate(rotateX(box([5, W + 40, 24], [0, 0, 0], "Northcold_Plank", 1), -9), [-60, 0, 170]));
  parts.push(translate(rotateX(box([5, W - 20, 22], [0, 0, 0], "Northcold_Plank", 1), 64), [-62, -50, 60]));
  parts.push(boxBounds([-68, 10, 205], [-63, 110, 260], "Northcold_Rag", 1), boxBounds([-70, 20, 215], [-67, 100, 222], "Northcold_IceCrack"), boxBounds([-70, 20, 238], [-67, 100, 245], "Northcold_IceCrack"));
  parts.push(cylinderBetween([-40, -W / 2 - 15, 230], [-90, -W / 2 - 15, 230], 2, 4, "Northcold_Rust"), boxBounds([-104, -W / 2 - 27, 186], [-80, -W / 2 - 3, 222], "Northcold_Rust"));
  // the rails out of the dark
  for (let x = 220; x > -400; x -= 48) parts.push(boxBounds([x - 14, -70, -2], [x + 14, 70, 6], "Northcold_Timber", 1.5));
  for (const y of [-45, 45]) parts.push(boxBounds([-400, y - 3, 6], [230, y + 3, 14], "Northcold_Rust"));
  parts.push(mound(240, 120, 18, 509, [-320, 70, 0], 30), mound(180, 100, 14, 510, [-200, -180, 0], -20));
  for (let i = 0; i < 6; i++) parts.push(coldRock([30 + rnd() * 30, 26 + rnd() * 20, 20], 0.5, 511 + i, { mat: "Northcold_Ore", at: [-250 - rnd() * 150, (rnd() - 0.5) * 300, 0], cover: 0.3 }));
  return merge(...parts);
}

// The miners' shack, abandoned: plank walls on a stone footing, one side of the roof fallen in
// with the snow come in after it, the stovepipe askew, the door hanging by one hinge, a broken
// window, a pick and a shovel left by the door. About 6.4 x 5 m.
function minersShack(): Geo {
  const rnd = seeded(531), X = 260, Y = 200, parts: Geo[] = [boxBounds([-X - 10, -Y - 10, -10], [X + 10, Y + 10, 30], "StoneGrey", 3)];
  const wallH = 250;
  // the walls of upright boards (the front with a doorway, a window in the left side)
  const boards = (a: [number, number], b: [number, number], gaps: [number, number, number][] = []) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, out: Geo[] = [];
    for (let s = 0; s < L; s += 26) {
      const g = gaps.find(([g0, g1]) => s + 13 > g0 && s + 13 < g1), h = wallH - (rnd() < 0.15 ? 20 + rnd() * 30 : 0);
      const x = a[0] + ux * (s + 13), y = a[1] + uy * (s + 13), deg = Math.atan2(uy, ux) * DEG;
      if (g) {
        if (g[2] > 0) out.push(translate(rotateZ(boxBounds([-12, -3, 30], [12, 3, g[2]], rnd() < 0.5 ? "Northcold_Plank" : "WoodGrey"), deg), [x, y, 0]));
        out.push(translate(rotateZ(boxBounds([-12, -3, g[2] > 0 ? g[2] + 80 : 240], [12, 3, h], rnd() < 0.5 ? "Northcold_Plank" : "WoodGrey"), deg), [x, y, 0]));
        continue;
      }
      out.push(translate(rotateZ(boxBounds([-12, -3, 30], [12, 3, h], rnd() < 0.5 ? "Northcold_Plank" : "WoodGrey"), deg), [x, y, 0]));
    }
    return merge(...out);
  };
  parts.push(boards([-X, -Y], [-X, Y], [[Y - 60, Y + 60, 0]]), boards([X, -Y], [X, Y]), boards([-X, -Y], [X, -Y], [[X - 50, X + 50, 120]]), boards([-X, Y], [X, Y]));
  for (const [x, y] of [[-X, -Y], [X, -Y], [X, Y], [-X, Y]]) parts.push(boxAt([16, 16, wallH + 10], [x, y, 25], "Northcold_Timber", 2));
  parts.push(boxBounds([-X - 6, -Y - 6, wallH - 10], [X + 6, Y + 6, wallH + 4], "Northcold_Timber", 2));
  parts.push(boxBounds([-50, -Y - 6, 112], [50, -Y + 6, 120], "Northcold_Timber"), boxBounds([-50, -Y - 6, 200], [50, -Y + 6, 208], "Northcold_Timber"), translate(rotateZ(boxBounds([0, 0, 0], [40, 2, 50], "GlassBlue"), 10), [-40, -Y - 4, 122]));
  // the door hanging off, the doorway dark
  parts.push(boxBounds([-X + 4, -58, 30], [-X + 8, 58, 238], "Northcold_Dark"), translate(rotateY(rotateZ(boxBounds([0, 0, 0], [6, 100, 200], "Northcold_Tar", 1), -50), 6), [-X - 6, -55, 32]));
  // the roof: the right slope whole under snow, the left slope broken and fallen in
  const RH = 140, ang = Math.atan2(RH, Y) * DEG, sl = Math.hypot(RH, Y) + 40;
  parts.push(translate(rotateX(boxBounds([-X - 40, 0, 0], [X + 40, sl, 10], "Northcold_Tar", 2), -ang), [0, 0, wallH + RH]));
  parts.push(translate(rotateX(boxBounds([-X - 34, 0, 10], [X + 34, sl - 6, 26], "Snow", 4), -ang), [0, 0, wallH + RH]));
  parts.push(translate(rotateX(boxBounds([-X - 40, -sl * 0.45, 0], [-X * 0.1, 0, 10], "Northcold_Tar", 2), ang), [0, 0, wallH + RH]));
  parts.push(translate(rotateZ(rotateX(boxBounds([0, -sl * 0.6, 0], [X * 0.9, 0, 10], "Northcold_Tar", 2), 58), -6), [-X * 0.05, -20, 120]));
  parts.push(gableWall(-X - 4, Y + 4, wallH + 4, RH - 4, "WoodGrey"), gableWall(X + 4, Y + 4, wallH + 4, RH - 4, "WoodGrey"));
  for (let k = 0; k < 5; k++) parts.push(beamBetween([-X + 40 + k * 110, -Y + 10, wallH + 6], [-X + 40 + k * 110 + (k === 3 ? 30 : 0), k === 3 ? -60 : 0, k === 3 ? wallH - 60 : wallH + RH - 4], 10, 10, "Northcold_Timber"));
  parts.push(mound(300, 200, 70, 533, [60, -60, 30], 10));
  parts.push(icicles([-X - 40, Y + 40, wallH - 20], [X + 40, Y + 40, wallH - 20], 535, 18, 40));
  // the stovepipe through the good slope, leaning
  parts.push(cylinderBetween([120, 90, wallH + 60], [140, 110, wallH + RH + 120], 10, 8, "IronDark"), cylinderAt({ rBot: 18, rTop: 6, height: 18, segments: 8, bottom: [141, 111, wallH + RH + 118] }, "IronDark"));
  // a pick and a shovel by the door, a barrel, drifts against the walls
  parts.push(cylinderBetween([-X - 40, Y - 30, 0], [-X - 14, Y - 10, 120], 3, 5, "Northcold_Timber"), translate(rotateY(boxBounds([-30, -3, -4], [30, 3, 4], "IronDark"), 30), [-X - 14, Y - 10, 120]));
  parts.push(cylinderBetween([-X - 40, Y + 20, 0], [-X - 12, Y + 30, 130], 2.5, 5, "Northcold_Timber"), boxBounds([-X - 52, Y + 8, -2], [-X - 34, Y + 34, 28], "Northcold_Rust"));
  parts.push(cylinderAt({ radius: 28, height: 76, segments: 10, bottom: [X + 50, -Y + 40, 0] }, "WoodShade"), cylinderAt({ radius: 26, height: 6, segments: 10, bottom: [X + 50, -Y + 40, 74] }, "Snow"));
  parts.push(mound(320, 120, 60, 537, [40, Y + 60, 0], 0), mound(260, 110, 50, 538, [X + 60, 40, 0], 90), mound(200, 100, 40, 539, [-X - 70, -120, 0], 80));
  return merge(...parts);
}

// An ore cart off its rails: a stretch of track with its far end wrenched up, the cart tipped
// on its side and its load of silver ore spilled, one wheel off, beside a heap of spoil with a
// pick stuck in it. About 5.2 x 3.6 m.
function oreCart(): Geo {
  const rnd = seeded(551), parts: Geo[] = [];
  for (let x = -220; x <= 180; x += 50) parts.push(boxBounds([x - 13, -62, -2], [x + 13, 62, 6], "Northcold_Timber", 1.5));
  for (const y of [-42, 42]) parts.push(boxBounds([-240, y - 3, 6], [190, y + 3, 14], "Northcold_Rust"), beamBetween([190, y, 10], [260, y + y * 0.2, 60], 6, 8, "Northcold_Rust"));
  // the cart on its side
  const cart: Geo[] = [
    boxBounds([-70, -48, 20], [70, 48, 26], "Northcold_Rust"),
    translate(rotateY(boxBounds([-3, -50, 0], [3, 50, 70], "Northcold_Rust"), -12), [-70, 0, 24]), translate(rotateY(boxBounds([-3, -50, 0], [3, 50, 70], "Northcold_Rust"), 12), [70, 0, 24]),
    ...[-1, 1].map((s) => translate(rotateX(boxBounds([-80, -3, 0], [80, 3, 70], "Northcold_Rust"), s * 12), [0, s * 48, 24])),
    boxBounds([-86, -58, 88], [86, 58, 94], "IronDark"),
  ];
  for (const x of [-45, 45]) for (const s of [-1, 1]) if (!(x > 0 && s > 0)) cart.push(translate(rotateX(cylinderAt({ radius: 17, height: 8, segments: 10, bottom: [0, 0, -4] }, "IronDark"), 90), [x, s * 50, 17]));
  parts.push(translate(rotateX(merge(...cart), 78), [-20, 150, 48]));
  parts.push(translate(cylinderAt({ radius: 17, height: 8, segments: 10, bottom: [0, 0, 0] }, "IronDark"), [130, 230, 0]));
  // the spilled ore with silver glinting in it
  for (let i = 0; i < 16; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 110, at: V3 = [-60 + Math.cos(a) * d, 260 + Math.sin(a) * d * 0.6, 0];
    parts.push(coldRock([22 + rnd() * 24, 18 + rnd() * 16, 14 + rnd() * 12], 0.5, 553 + i, { mat: "Northcold_Ore", at, cover: 0.15 }));
    if (rnd() < 0.5) parts.push(translate(rotateZ(box([6, 4, 3], [0, 0, 0], "Northcold_Silver", 1), rnd() * 180), [at[0] + 4, at[1], 14]));
  }
  // the spoil heap, the pick in it
  parts.push(mound(300, 220, 80, 571, [-90, -200, 0], 20, "Northcold_Spoil"), snowFacets(mound(300, 220, 80, 571, [-90, -200, 0], 20, "Northcold_Spoil"), 0.85, 3));
  for (let i = 0; i < 8; i++) parts.push(coldRock([24 + rnd() * 20, 20 + rnd() * 14, 16], 0.5, 575 + i, { mat: "Northcold_Spoil", at: [-90 + (rnd() - 0.5) * 300, -200 + (rnd() - 0.5) * 200, 0], cover: 0.2 }));
  parts.push(cylinderBetween([-80, -190, 60], [-40, -170, 160], 3, 5, "Northcold_Timber"), translate(rotateZ(rotateY(boxBounds([-34, -3, -4], [34, 3, 4], "IronDark"), 70), 20), [-80, -190, 66]));
  parts.push(mound(180, 90, 16, 585, [120, -40, 0], 30));
  return merge(...parts);
}

export const KIT: Kit = {
  id: "northcold",
  name: "แม่น้ำเยือกแข็งและเขาเหนือ",
  region: "รอบไฮแลนด์ ฮิล",
  desc: "แม่น้ำกว้างที่แข็งเป็นน้ำแข็ง สะพานหินเก่าครึ่งพัง ท่าแพข้ามฟาก หน้าผาริมทะเลเหนือกับประภาคารร้างและซากเรือ เนินเขาวงกตกับถ้ำฤๅษีและเหมืองเงินร้าง",
  ground: "snow",
  sea: true,
  items: [
    { id: "river_ice", name: "แผ่นน้ำแข็งแม่น้ำ", make: () => centre(riverIce()), tags: ["ground"] },
    { id: "ice_ridge", name: "แนวน้ำแข็งแตกอัด", make: () => centre(iceRidge()), tags: ["rock", "decor"] },
    { id: "drift_floes", name: "แพน้ำแข็งลอย", make: () => centre(driftFloes()), tags: ["ground", "decor"] },
    { id: "ice_marker", name: "หลักปักทางบนน้ำแข็ง", make: () => centre(iceMarker()), tags: ["sign"] },
    { id: "bridge_span", name: "ช่วงสะพานหินโค้ง (10 ม.)", make: bridgeSpan, tags: ["bridge", "landmark"] },
    { id: "bridge_broken", name: "ช่วงสะพานที่พังลง (10 ม.)", make: bridgeBroken, tags: ["bridge", "landmark"] },
    { id: "bridge_ramp", name: "ทางลาดขึ้นสะพาน", make: bridgeRamp, tags: ["bridge"] },
    { id: "ferry_hut", name: "กระท่อมคนแจวแพข้ามฟาก", make: () => centre(ferryHut()), tags: ["building"] },
    { id: "ferry_landing", name: "ท่าแพข้ามฟากติดน้ำแข็ง", make: () => centre(ferryLanding()), tags: ["dock"] },
    { id: "icebound_boat", name: "เรือพายติดน้ำแข็ง", make: () => centre(iceboundBoat()), tags: ["boat", "decor"] },
    { id: "frozen_reeds", name: "กอกกเยือกแข็ง", make: () => centre(frozenReeds()), tags: ["plant"] },
    { id: "ruined_lighthouse", name: "ประภาคารร้าง", make: () => centre(ruinedLighthouse()), tags: ["landmark"] },
    { id: "sea_stack", name: "เสาหินกลางทะเลน้ำแข็ง", make: () => centre(seaStack()), tags: ["rock", "landmark"] },
    { id: "seabird_rock", name: "โขดหินนกทะเล", make: () => centre(seabirdRock()), tags: ["rock", "decor"] },
    { id: "iced_rocks", name: "โขดหินเคลือบน้ำแข็ง", make: () => centre(icedRocks()), tags: ["rock"] },
    { id: "shipwreck", name: "ซากเรือแตกบนหาดกรวด", make: shipwreck, tags: ["landmark", "wreck"] },
    { id: "shingle_bank", name: "หาดกรวดกับขอนลอยน้ำ", make: () => centre(shingleBank()), tags: ["ground"] },
    { id: "flattened_grass", name: "หญ้าลู่ลมใต้หิมะ", make: () => centre(flattenedGrass()), tags: ["ground", "plant"] },
    { id: "cave_mouth", name: "ปากถ้ำฤๅษี", make: () => centre(caveMouth()), tags: ["landmark", "camp"] },
    { id: "mine_adit", name: "ปากอุโมงค์เหมืองเงินร้าง", make: () => centre(mineAdit()), tags: ["landmark"] },
    { id: "miners_shack", name: "กระท่อมคนงานเหมืองร้าง", make: () => centre(minersShack()), tags: ["building"] },
    { id: "ore_cart", name: "รถแร่ตกราง", make: () => centre(oreCart()), tags: ["decor"] },
  ],
  // A corner of the cold country: the river along the -Y edge with the old bridge reaching out
  // over it and broken off, floes in the water and a sea stack beyond; the ferryman's hut and his
  // landing on the bank, a boat caught in the ice, reeds; the ruined lighthouse on the rise
  // behind with grass flattened by the wind; the mine's adit, the shack and the cart in the snow.
  sample(put) {
    // the bridge: the ramp on the bank, a span, the fallen span out over the water
    put("bridge_ramp", [-900, -1250, 0], -90);
    put("bridge_span", [-900, -2410, -14], -90);
    put("bridge_broken", [-900, -3410, -14], -90);
    put("drift_floes", [700, -2900, -12], 30);
    put("drift_floes", [-2000, -3300, -12], 160, 0.8);
    put("sea_stack", [1800, -3500, -12], 0, 0.7);
    put("icebound_boat", [1300, -2350, -6], 20);
    // the ferryman's hut and landing on the bank
    put("ferry_hut", [800, -700, 0], 90);
    put("ferry_landing", [150, -2300, 0], -90, 0.8);
    for (const [x, y] of [[-200, -2050], [400, -2100], [1900, -2050], [-1700, -2100], [-2100, -1900]]) put("frozen_reeds", [x, y, 0], x);
    put("river_ice", [1600, -1500, 0], 0, 0.6);
    put("ice_ridge", [2000, -800, 0], 20, 0.8);
    for (const [x, y] of [[300, -1500], [1300, -1200], [-300, -900]]) put("ice_marker", [x, y, 0], 0);
    put("seabird_rock", [-2000, -1500, 0], 30, 0.8);
    put("iced_rocks", [-1500, -2000, 0], 0);
    put("shingle_bank", [-1700, -1100, 0], 10, 0.8);
    // the lighthouse on the rise, the wind-flattened grass round it
    put("ruined_lighthouse", [1200, 1500, 0], 180, 0.9);
    for (const [x, y] of [[0, 900], [600, 400], [2100, 600], [-300, 1700]]) put("flattened_grass", [x, y, 0], 0);
    // the mine: the adit, the shack, the cart
    put("mine_adit", [-1700, 1800, 0], 0, 0.9);
    put("miners_shack", [-1500, 300, 0], 20);
    put("ore_cart", [-400, 300, 0], 160);
    put("cave_mouth", [2100, -100, 0], 180, 0.8);
    // pines and rocks
    for (const [x, y, s] of [[-2200, 1000, 1.1], [-2300, -300, 1], [2300, 1900, 1.2], [-500, 2200, 1], [400, 2300, 0.9], [-2200, 2300, 1]]) put("flora:SnowPine", [x, y, 0], x, s);
    for (const [x, y] of [[-900, 1500], [300, -100], [2200, 1100]]) put("flora:SnowPineSmall", [x, y, 0], y);
  },
};

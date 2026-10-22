// Mesh building blocks that follow Oriverse's Weave (box_at, beam_between, gable_roof, array, ...),
// so the courtyard's #mesh recipes (the-hero-fighter/oriverse/frieren/courtyard.weave) port line
// for line. A Geo is a list of parts, each a geometry with a material name; transforms copy.
//
// Coordinates are Oriverse's: centimetres, Z up. `toThree` turns a finished Geo into meshes in
// three.js space (Y up): world (x, y, z) -> three (x, z, -y).
//
// Every primitive gets texture coordinates in metres along its own surfaces (the longer side of
// each box face runs along U), so wood grain follows each plank and nothing stretches.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type V3 = [number, number, number];
export interface Part {
  geo: THREE.BufferGeometry;
  mat: string;
}
export type Geo = Part[];

const RAD = Math.PI / 180;
const M = () => new THREE.Matrix4();

function apply(g: Geo, m: THREE.Matrix4): Geo {
  return g.map((p) => ({ geo: p.geo.clone().applyMatrix4(m), mat: p.mat }));
}
function around(g: Geo, [px, py, pz]: V3, m: THREE.Matrix4): Geo {
  return apply(g, M().makeTranslation(px, py, pz).multiply(m).multiply(M().makeTranslation(-px, -py, -pz)));
}

export const merge = (...gs: Geo[]): Geo => gs.flat();
export const translate = (g: Geo, [x, y, z]: V3): Geo => apply(g, M().makeTranslation(x, y, z));
export const rotateX = (g: Geo, deg: number, pivot: V3 = [0, 0, 0]): Geo => around(g, pivot, M().makeRotationX(deg * RAD));
export const rotateY = (g: Geo, deg: number, pivot: V3 = [0, 0, 0]): Geo => around(g, pivot, M().makeRotationY(deg * RAD));
export const rotateZ = (g: Geo, deg: number, pivot: V3 = [0, 0, 0]): Geo => around(g, pivot, M().makeRotationZ(deg * RAD));
export const scale = (g: Geo, [sx, sy, sz]: V3, pivot: V3 = [0, 0, 0]): Geo => around(g, pivot, M().makeScale(sx, sy, sz));

export function array(g: Geo, count: number, [ox, oy, oz]: V3): Geo {
  return merge(...Array.from({ length: count }, (_, i) => translate(g, [ox * i, oy * i, oz * i])));
}
export function gridArray(g: Geo, [nx, ny, nz]: V3, [ox, oy, oz]: V3): Geo {
  const out: Geo[] = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) out.push(translate(g, [ox * i, oy * j, oz * k]));
  return merge(...out);
}

// ---- texture coordinates ----
// Box-style: each vertex takes the two axes across its normal, in metres, longer box side first.
function boxUv(geo: THREE.BufferGeometry, size: V3): void {
  const pos = geo.getAttribute("position"), nor = geo.getAttribute("normal");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const p = [pos.getX(i), pos.getY(i), pos.getZ(i)], n = [Math.abs(nor.getX(i)), Math.abs(nor.getY(i)), Math.abs(nor.getZ(i))];
    const axis = n[0] >= n[1] && n[0] >= n[2] ? 0 : n[1] >= n[2] ? 1 : 2;
    let [a, b] = [0, 1, 2].filter((x) => x !== axis);
    if (size[b] > size[a]) [a, b] = [b, a];
    uv[i * 2] = p[a] / 100;
    uv[i * 2 + 1] = p[b] / 100;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}
// Round shapes keep three.js's own (around, along) coordinates, scaled to metres.
function scaleUv(geo: THREE.BufferGeometry, su: number, sv: number): void {
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * su) / 100, (uv.getY(i) * sv) / 100);
}

function part(geo: THREE.BufferGeometry, mat: string): Geo {
  return [{ geo: geo.index ? geo.toNonIndexed() : geo, mat }];
}

// ---- boxes ----
// A box centred on `center`; a bevel cuts its edges at 45 degrees (catches the light like the
// Oriverse bevels).
export function box(size: V3, center: V3, mat: string, bevel = 0): Geo {
  const [sx, sy, sz] = size;
  const b = Math.min(bevel, sx / 2 - 0.01, sy / 2 - 0.01, sz / 2 - 0.01);
  const geo = b > 0.3 ? chamferBox(sx, sy, sz, b) : new THREE.BoxGeometry(sx, sy, sz).toNonIndexed();
  boxUv(geo, size);
  geo.translate(...center);
  return [{ geo, mat }];
}
export const boxAt = (size: V3, bottom: V3, mat: string, bevel = 0): Geo => box(size, [bottom[0], bottom[1], bottom[2] + size[2] / 2], mat, bevel);
export const boxCenter = (size: V3, center: V3, mat: string): Geo => box(size, center, mat);
export function boxBounds(min: V3, max: V3, mat: string, bevel = 0): Geo {
  return box([max[0] - min[0], max[1] - min[1], max[2] - min[2]], [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2], mat, bevel);
}

// A box with chamfered edges and corners: the convex hull of three boxes, each shrunk by `b`
// along one axis.
function chamferBox(sx: number, sy: number, sz: number, b: number): THREE.BufferGeometry {
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  const pts: THREE.Vector3[] = [];
  for (const [ax, ay, az] of [[hx - b, hy - b, hz], [hx - b, hy, hz - b], [hx, hy - b, hz - b]])
    for (const x of [-ax, ax]) for (const y of [-ay, ay]) for (const z of [-az, az]) pts.push(new THREE.Vector3(x, y, z));
  return hull(pts);
}

// Flat-shaded convex hull of a few points (gift wrapping over faces; fine for <= 30 points).
function hull(pts: THREE.Vector3[]): THREE.BufferGeometry {
  const tris: number[] = [];
  const seen = new Set<string>();
  const n = pts.length, eps = 1e-4;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let k = j + 1; k < n; k++) {
        const a = pts[i], bb = pts[j], c = pts[k];
        const nor = new THREE.Vector3().subVectors(bb, a).cross(new THREE.Vector3().subVectors(c, a));
        if (nor.lengthSq() < eps) continue;
        nor.normalize();
        let pos = 0, neg = 0;
        for (const p of pts) {
          const d = nor.dot(new THREE.Vector3().subVectors(p, a));
          if (d > eps) pos++;
          else if (d < -eps) neg++;
        }
        if (pos && neg) continue;
        const key = [i, j, k].join(",");
        if (seen.has(key)) continue;
        seen.add(key);
        // outward: all other points on the negative side
        if (pos) tris.push(i, k, j);
        else tris.push(i, j, k);
      }
  // faces of more than 3 coplanar points come out as overlapping fans; that's harmless for a
  // flat-shaded solid
  const position = new Float32Array(tris.length * 3);
  tris.forEach((v, i) => position.set([pts[v].x, pts[v].y, pts[v].z], i * 3));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geo.computeVertexNormals();
  return geo;
}

// A rectangular beam from `start` to `end`, `w` wide and `h` tall across it (its "up" kept as
// close to world Z as the direction allows).
export function beamBetween(start: V3, end: V3, w: number, h: number, mat: string): Geo {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const d = new THREE.Vector3().subVectors(b, a), len = d.length();
  d.normalize();
  const side = new THREE.Vector3(0, 0, 1).cross(d);
  if (side.lengthSq() < 1e-6) side.set(0, 1, 0);
  side.normalize();
  const up = new THREE.Vector3().crossVectors(d, side);
  const m = new THREE.Matrix4().makeBasis(d, side, up).setPosition(a.clone().add(b).multiplyScalar(0.5));
  return apply(box([len, w, h], [0, 0, 0], mat), m);
}

// ---- round things (three.js builds them around +Y; turned to stand on +Z) ----
function standUp(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return geo.rotateX(Math.PI / 2);
}

export function cylinderBetween(start: V3, end: V3, radius: number, segments: number, mat: string, radiusEnd = radius): Geo {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const d = new THREE.Vector3().subVectors(b, a), len = d.length();
  const geo = new THREE.CylinderGeometry(radiusEnd, radius, len, segments, 1);
  scaleUv(geo, Math.PI * 2 * radius, len);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()));
  geo.translate(...a.add(b).multiplyScalar(0.5).toArray());
  return part(geo, mat);
}

export function cylinderAt(o: { radius?: number; rBot?: number; rTop?: number; height: number; segments: number; bottom: V3 }, mat: string): Geo {
  const rb = o.rBot ?? o.radius!, rt = o.rTop ?? o.radius!;
  const geo = standUp(new THREE.CylinderGeometry(rt, rb, o.height, o.segments, 1));
  // three.js puts the first corner on +Z (before standing up); Weave puts it on +X
  geo.rotateZ(Math.PI / 2);
  scaleUv(geo, Math.PI * 2 * Math.max(rb, rt), o.height);
  geo.translate(o.bottom[0], o.bottom[1], o.bottom[2] + o.height / 2);
  return part(geo, mat);
}

export function cylinderCenter(radius: number, height: number, segments: number, center: V3, mat: string): Geo {
  const geo = standUp(new THREE.CylinderGeometry(radius, radius, height, segments, 1));
  scaleUv(geo, Math.PI * 2 * radius, height);
  geo.translate(...center);
  return part(geo, mat);
}

export function sphereCenter(radius: number, center: V3, mat: string, segments = 12): Geo {
  const geo = new THREE.SphereGeometry(radius, segments, Math.max(4, Math.round(segments * 0.66)));
  scaleUv(geo, Math.PI * 2 * radius, Math.PI * radius);
  geo.translate(...center);
  return part(geo, mat);
}

// A ring around +Z (Weave's torus lies flat).
export function torus(major: number, tube: number, segments: number, tubeSegments: number, mat: string): Geo {
  const geo = new THREE.TorusGeometry(major, tube, tubeSegments, segments);
  scaleUv(geo, Math.PI * 2 * major, Math.PI * 2 * tube);
  return part(geo, mat);
}

// A two-slope roof over a sx x sy footprint, `th` thick, ridge along X `roofH` above the base,
// eaves `overhang` past the footprint on every side.
export function gableRoof(size: V3, bottom: V3, roofH: number, overhang: number, mat: string): Geo {
  const [sx, sy, th] = size;
  const angle = Math.atan2(roofH, sy / 2);
  const slope = (sy / 2 + overhang) / Math.cos(angle);
  const len = sx + overhang * 2;
  // each slab hangs from the ridge line down to its eave
  const slab = (side: 1 | -1): Geo => rotateX(box([len, slope, th], [0, (side * slope) / 2, th / 2], mat), (-side * angle) / RAD);
  return translate(merge(slab(1), slab(-1)), [bottom[0], bottom[1], bottom[2] + roofH]);
}

// The triangle closing a gable: in the plane x, `half` either side of y = 0, from z0 up to the
// ridge at z0 + h (shows from both sides).
export function gableWall(x: number, half: number, z0: number, h: number, mat: string): Geo {
  const geo = new THREE.BufferGeometry();
  const z1 = z0 + h;
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([x, -half, z0, x, half, z0, x, 0, z1, x, half, z0, x, -half, z0, x, 0, z1]), 3));
  geo.computeVertexNormals();
  boxUv(geo, [1, half * 2, h]);
  return [{ geo, mat }];
}

// ---- rocks: a squashed icosphere with seeded bumps, flat-shaded (detail 0: 20 faces, a pebble) ----
function seeded(seed: number): () => number {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
export function rock(size: V3, roughness: number, seed: number, mat: string, flat = false, detail = 1): Geo {
  const rnd = seeded(seed);
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.getAttribute("position");
  const moved = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    if (!moved.has(key)) moved.set(key, 1 + (rnd() - 0.5) * roughness);
    const f = moved.get(key)!;
    let z = pos.getZ(i) * f;
    if (z < -0.2) z = -0.2 + (z + 0.2) * 0.15; // flat underside
    pos.setXYZ(i, pos.getX(i) * f * size[0] / 2, pos.getY(i) * f * size[1] / 2, (z + 0.2) * size[2] / (flat ? 1.6 : 1.2));
  }
  geo.computeVertexNormals();
  boxUv(geo, size);
  return [{ geo, mat }];
}

// ---- into three.js ----
const ZUP_TO_YUP = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);

// One mesh per material, Y up, positioned at the origin of the Geo.
export function toThree(g: Geo, materials: (name: string) => THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const byMat = new Map<string, THREE.BufferGeometry[]>();
  for (const p of g) {
    const list = byMat.get(p.mat) ?? [];
    list.push(p.geo);
    byMat.set(p.mat, list);
  }
  for (const [mat, geos] of byMat) {
    const merged = mergeGeometries(geos.map((x) => {
      const y = x.index ? x.toNonIndexed() : x;
      // every part needs the same attributes
      if (!y.getAttribute("uv")) y.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(y.getAttribute("position").count * 2), 2));
      for (const name of Object.keys(y.attributes)) if (!["position", "normal", "uv"].includes(name)) y.deleteAttribute(name);
      return y;
    }))!;
    merged.applyMatrix4(ZUP_TO_YUP);
    const mesh = new THREE.Mesh(merged, materials(mat));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}

// Place a built object at a world position with a heading (degrees about Z), as Oriverse's
// `object { position rotation }`.
export function place(obj: THREE.Object3D, [x, y, z]: V3, headingDeg = 0, s = 1): THREE.Object3D {
  obj.position.set(x, z, -y);
  obj.rotation.y = headingDeg * RAD;
  obj.scale.setScalar(s);
  return obj;
}

// โยเดีย: the second harbour of the realm, a tropical trading port where the southern plains
// meet the sea and the jungle. Timber warehouses, a brick-and-plaster customs house with
// terracotta roofs and a striped lighthouse along the quay; stilt houses with thatch roofs,
// bamboo, carved guardian posts and a log palisade toward the jungle; wharves, piers, a crane,
// cargo, fishing boats, outrigger canoes and a three-masted merchant ship on the water.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front facing -X.
// Boats float with their waterline at about z = 0 (their hulls go below it).

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, array, gridArray, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, torus, gableWall, rock,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import { solid } from "./types";
import type { Kit, Put } from "./types";

// ---------- the town's own colours ----------
defineMaterial("Yodia_Ochre", { map: "plaster", tint: "#ebc77c", bump: 0.6 }); // colonial yellow plaster
defineMaterial("Yodia_Teal", { map: "wood", tint: "#3f8076", bump: 1.2 }); // painted shutters, boards
defineMaterial("Yodia_RedPaint", { map: "plaster", tint: "#b9412f", bump: 0.5 }); // lighthouse bands
defineMaterial("Yodia_HullTrim", { map: "wood", tint: "#c9973f", bump: 1.2 }); // ochre wales
defineMaterial("Yodia_HullBottom", { map: "wood", tint: "#7c3426", bump: 1 }); // red-brown below the waterline
defineMaterial("Yodia_Tar", { map: "fabric", tint: "#4b3d2d", rough: 1 }); // tarred standing rigging
defineMaterial("Yodia_Clay", { map: "adobe", tint: "#b9693e", bump: 1 }); // pots and water jars
defineMaterial("Yodia_Glaze", { map: "metal", tint: "#5b3f26", rough: 0.35, metal: 0.15 }); // glazed dragon jars
defineMaterial("Yodia_Fish", { map: "metal", tint: "#b7c7cf", rough: 0.35, metal: 0.45 });
defineMaterial("Yodia_Snapper", { map: "metal", tint: "#d8644f", rough: 0.4, metal: 0.3 });
defineMaterial("Yodia_Banana", { map: "felt", tint: "#f1d03c", rough: 0.7 });
defineMaterial("Yodia_Mango", { map: "felt", tint: "#f39c2f", rough: 0.6 });
defineMaterial("Yodia_Coconut", { map: "felt", tint: "#73a03c", rough: 0.8 });
defineMaterial("Yodia_Pineapple", { map: "ribs", tint: "#cf9a3a", rough: 0.8 });
defineMaterial("Yodia_Burlap", { map: "fabric", tint: "#c4a274", rough: 1 });
defineMaterial("Yodia_Net", { map: "fabric", tint: "#56715b", rough: 1 });
defineMaterial("Yodia_Ice", { map: "snow", tint: "#e2f2f8", rough: 0.35 });
defineMaterial("Yodia_ThatchOld", { map: "thatch", tint: "#ad8c4c", bump: 2 }); // weathered courses
defineMaterial("Yodia_Leaf", { map: "felt", tint: "#3f8030", rough: 0.9 }); // banana leaves

// ---------- helpers ----------
const D = 180 / Math.PI;
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rope = (a: V3, b: V3, r = 1.6, mat = "RopeTan"): Geo => cylinderBetween(a, b, r, 4, mat);
// a detail built facing -X (on the plane x = 0) put on a side of a building: heading 0 = the -X
// face at distance d from the centre, 90 = the -Y face, 180 = +X, 270 = +Y
const at = (g: Geo, heading: number, d: number, along: number, z: number): Geo => rotateZ(translate(g, [-d, along, z]), heading);

// Texture coordinates again, with U along `axis` on every face that runs along it (roof slabs
// whose slope is longer than their ridge, upright boards). Call it before any rotation.
function uvAlong(g: Geo, axis: 0 | 1 | 2): Geo {
  for (const p of g) {
    const pos = p.geo.getAttribute("position"), nor = p.geo.getAttribute("normal");
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const v = [pos.getX(i), pos.getY(i), pos.getZ(i)], n = [Math.abs(nor.getX(i)), Math.abs(nor.getY(i)), Math.abs(nor.getZ(i))];
      const ax = n[0] >= n[1] && n[0] >= n[2] ? 0 : n[1] >= n[2] ? 1 : 2;
      const rest = [0, 1, 2].filter((a) => a !== ax);
      const [a, b] = rest.includes(axis) ? [axis, rest.find((r) => r !== axis)!] : rest;
      uv[i * 2] = v[a] / 100;
      uv[i * 2 + 1] = v[b] / 100;
    }
    p.geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  }
  return g;
}
// swap U and V (barrel staves run up a cylinder, not around it)
function swapUv(g: Geo): Geo {
  for (const p of g) {
    const uv = p.geo.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i));
  }
  return g;
}

// A two-slope roof, ridge along X (like geo's gableRoof) whose courses always run along the ridge.
function roof(sx: number, sy: number, th: number, bottom: V3, h: number, ov: number, mat: string, bevel = 0): Geo {
  const a = Math.atan2(h, sy / 2), slope = (sy / 2 + ov) / Math.cos(a), len = sx + ov * 2;
  const slab = (s: 1 | -1): Geo => rotateX(uvAlong(box([len, slope, th], [0, (s * slope) / 2, th / 2], mat, bevel), 0), -s * a * D);
  return translate(merge(slab(1), slab(-1)), [bottom[0], bottom[1], bottom[2] + h]);
}
// A thatch roof (ridge along X) laid in `tiers` courses a side, each upper course thicker so its
// lower edge steps out over the next one; its underside is the same plane as roof()'s.
function thatchRoof(sx: number, sy: number, th: number, bottom: V3, h: number, ov: number, tiers = 3): Geo {
  const a = Math.atan2(h, sy / 2), slope = (sy / 2 + ov) / Math.cos(a), len = sx + ov * 2, seg = slope / tiers;
  const out: Geo[] = [];
  for (const s of [1, -1] as const)
    for (let k = 0; k < tiers; k++) {
      const t = th * (1 + (tiers - 1 - k) * 0.8), d0 = k * seg, d1 = Math.min(slope, (k + 1) * seg + th);
      out.push(rotateX(uvAlong(box([len - k * 6, d1 - d0, t], [0, (s * (d0 + d1)) / 2, t / 2 - k * 0.8], k % 2 ? "Yodia_ThatchOld" : "Thatch", 2.5), 0), -s * a * D));
    }
  return translate(merge(...out), [bottom[0], bottom[1], bottom[2] + h]);
}
// Barge boards up both roof edges of a gable (plane x), crossing at the apex into carved horns
// (the kalae of the southern houses) `horn` long.
function barge(x: number, half: number, zEave: number, zRidge: number, horn: number, mat = "WoodDark", w = 18): Geo {
  const L = Math.hypot(half, zRidge - zEave), ux = half / L, uz = (zRidge - zEave) / L;
  const side = (s: 1 | -1): Geo => beamBetween([x, s * half, zEave], [x, -s * ux * horn, zRidge + uz * horn], 7, w, mat);
  return merge(side(1), side(-1));
}

interface WinOpt { frame?: string; shutter?: string; sill?: string; key?: boolean; bars?: boolean }
// A framed window in a wall facing -X: the wall face is x = 0, centred on y = 0, sill at z = 0.
function win(w: number, h: number, o: WinOpt = {}): Geo {
  const f = o.frame ?? "WoodDark", s = o.sill ?? f;
  const g: Geo[] = [
    boxAt([6, w + 16, h + 16], [-3, 0, -8], f, 1.5),
    boxAt([3, w, h], [-6.5, 0, 0], "GlassBlue"),
    boxAt([14, w + 28, 6], [-7, 0, -14], s, 1.5),
    boxAt([10, w + 24, 8], [-5, 0, h + 8], s, 1.5),
  ];
  if (o.bars) for (const y of [-w / 4, 0, w / 4]) g.push(boxAt([3, 3, h], [-9.5, y, 0], "IronDark"));
  else g.push(boxAt([3, 4, h], [-9, 0, 0], f), boxAt([3, w, 4], [-9, 0, h * 0.58], f));
  if (o.key) g.push(boxAt([12, 18, 24], [-6, 0, h + 8], s, 1.5));
  if (o.shutter) {
    const sw = w / 2 + 4;
    for (const side of [-1, 1]) {
      const y = side * (w / 2 + 9 + sw / 2);
      g.push(boxAt([4, sw, h + 6], [-3, y, -3], o.shutter, 1));
      for (let i = 1; i < 5; i++) g.push(boxAt([2, sw - 8, 3], [-5.5, y, -3 + ((h + 6) * i) / 5], "WoodDark"));
    }
  }
  return merge(...g);
}
// A door in a wall facing -X: wall face x = 0, centred on y = 0, standing on z = 0.
function door(w: number, h: number, o: { leaf?: string; frame?: string; double?: boolean } = {}): Geo {
  const f = o.frame ?? "WoodDark", leaf = o.leaf ?? "DoorWood";
  const g: Geo[] = [
    boxAt([7, w + 22, h + 11], [-3.5, 0, 0], f, 1.5),
    boxAt([5, w, h], [-8.5, 0, 0], leaf, 1),
    boxAt([12, w + 36, 12], [-6, 0, h + 10], f, 2),
    boxAt([2, w - 12, 6], [-11.5, 0, h * 0.3], f),
    boxAt([2, w - 12, 6], [-11.5, 0, h * 0.72], f),
  ];
  if (o.double) g.push(boxAt([2, 4, h], [-11.5, 0, 0], f), sphereCenter(3.5, [-13, -9, h * 0.48], "IronDark", 6), sphereCenter(3.5, [-13, 9, h * 0.48], "IronDark", 6));
  else g.push(sphereCenter(3.5, [-13, w * 0.33, h * 0.48], "IronDark", 6));
  return merge(...g);
}

// a lantern standing on z = 0, `r` across
function lantern(r = 10, h = 24, glow = "LanternGlow"): Geo {
  return merge(
    cylinderAt({ rBot: r * 0.7, rTop: r, height: 4, segments: 6, bottom: [0, 0, 0] }, "IronDark"),
    cylinderAt({ radius: r * 0.82, height: h, segments: 6, bottom: [0, 0, 4] }, glow),
    cylinderAt({ rBot: r * 1.15, rTop: 2, height: r * 0.9, segments: 6, bottom: [0, 0, h + 4] }, "IronDark"),
    sphereCenter(2.6, [0, 0, h + 5 + r * 0.9], "IronDark", 6),
  );
}
// a lantern hanging `drop` below the point p
function hangLantern(p: V3, drop: number, r = 10, h = 24): Geo {
  const top = p[2] - drop;
  return merge(rope(p, [p[0], p[1], top], 1, "IronDark"), translate(lantern(r, h), [p[0], p[1], top - (h + 7.6 + r * 0.9)]));
}

function crate(s: number, mat = "WoodWarm", trim = "WoodShade"): Geo {
  const t = Math.max(5, s * 0.13), o = (s - t) / 2;
  return merge(
    boxAt([s - 4, s - 4, s - 4], [0, 0, 2], mat),
    gridArray(boxAt([t, t, s], [-o, -o, 0], trim), [2, 2, 1], [s - t, s - t, 0]),
    gridArray(boxAt([s, t, t], [0, -o, 0], trim), [1, 2, 2], [0, s - t, s - t]),
    gridArray(boxAt([t, s, t], [-o, 0, 0], trim), [2, 1, 2], [s - t, 0, s - t]),
  );
}
function barrel(h = 90, r = 34, mat = "WoodWarm"): Geo {
  const rb = r * 0.84;
  const body = swapUv(merge(
    cylinderAt({ rBot: rb, rTop: r, height: h * 0.42, segments: 12, bottom: [0, 0, 0] }, mat),
    cylinderAt({ radius: r, height: h * 0.16, segments: 12, bottom: [0, 0, h * 0.42] }, mat),
    cylinderAt({ rBot: r, rTop: rb, height: h * 0.42, segments: 12, bottom: [0, 0, h * 0.58] }, mat),
  ));
  const hoop = (z: number, rr: number): Geo => translate(torus(rr + 0.6, 1.8, 12, 4, "IronDark"), [0, 0, z]);
  const rAt = (z: number) => (z < 0.42 ? rb + ((r - rb) * z) / 0.42 : z > 0.58 ? r - ((r - rb) * (z - 0.58)) / 0.42 : r);
  return merge(body, hoop(h * 0.1, rAt(0.1)), hoop(h * 0.3, rAt(0.3)), hoop(h * 0.7, rAt(0.7)), hoop(h * 0.9, rAt(0.9)),
    cylinderAt({ radius: rb - 2, height: 2, segments: 12, bottom: [0, 0, h - 1] }, "WoodShade"));
}
function sack(mat = "Yodia_Burlap"): Geo {
  return merge(
    translate(scale(sphereCenter(1, [0, 0, 0], mat, 8), [36, 27, 22]), [0, 0, 20]),
    cylinderAt({ rBot: 9, rTop: 6, height: 10, segments: 6, bottom: [0, 0, 36] }, mat),
    translate(torus(6.5, 1.6, 8, 4, "RopeTan"), [0, 0, 42]),
    sphereCenter(7, [0, 0, 49], mat, 6),
  );
}
// a glazed dragon jar with a gold band and a cloth-tied lid
function jar(h = 80, r = 32, mat = "Yodia_Glaze"): Geo {
  return merge(
    cylinderAt({ rBot: r * 0.6, rTop: r, height: h * 0.45, segments: 12, bottom: [0, 0, 0] }, mat),
    cylinderAt({ rBot: r, rTop: r * 0.52, height: h * 0.38, segments: 12, bottom: [0, 0, h * 0.45] }, mat),
    cylinderAt({ rBot: r * 0.42, rTop: r * 0.48, height: h * 0.14, segments: 12, bottom: [0, 0, h * 0.83] }, mat),
    translate(torus(r * 0.99, 2.4, 12, 4, "GoldTrim"), [0, 0, h * 0.45]),
    translate(torus(r * 0.86, 1.8, 12, 4, "GoldTrim"), [0, 0, h * 0.62]),
    cylinderAt({ rBot: r * 0.56, rTop: r * 0.3, height: h * 0.1, segments: 8, bottom: [0, 0, h * 0.95] }, "FabricRed"),
  );
}
function coil(r = 24, n = 3, mat = "RopeTan"): Geo {
  const g: Geo[] = [];
  for (let i = 0; i < n; i++) g.push(translate(torus(r - i * 3.5, 3.2, 12, 5, mat), [0, 0, 3.2 + i * 5.6]));
  return merge(...g);
}
function bollard(): Geo {
  return merge(
    cylinderAt({ rBot: 17, rTop: 14, height: 36, segments: 10, bottom: [0, 0, 0] }, "IronDark"),
    cylinderAt({ radius: 21, height: 7, segments: 10, bottom: [0, 0, 36] }, "IronDark"),
    cylinderAt({ rBot: 21, rTop: 9, height: 7, segments: 10, bottom: [0, 0, 43] }, "IronDark"),
  );
}
// a fish lying on its side along X, belly on z = 0, head toward -X
function fish(len: number, mat = "Yodia_Fish"): Geo {
  const tail = translate(scale(rotateY(cylinderAt({ rBot: 0.5, rTop: len * 0.15, height: len * 0.22, segments: 4, bottom: [0, 0, 0] }, mat), 90), [1, 1, 0.25]), [len * 0.34, 0, len * 0.06]);
  return merge(
    translate(scale(sphereCenter(1, [0, 0, 0], mat, 8), [len * 0.4, len * 0.13, len * 0.065]), [0, 0, len * 0.06]),
    tail,
    sphereCenter(len * 0.025 + 0.6, [-len * 0.28, -len * 0.03, len * 0.105], "LacquerBlack", 6),
  );
}
// a woven bamboo basket, open at the top
function basket(r = 24, h = 26): Geo {
  return merge(
    cylinderAt({ rBot: r * 0.8, rTop: r, height: h, segments: 10, bottom: [0, 0, 0] }, "BambooDry"),
    translate(torus(r, 2.4, 10, 4, "WoodShade"), [0, 0, h]),
  );
}
// A double-sided cloth over four corners (bottom-left, bottom-right, top-left, top-right), bulged
// by `bulge` most in its middle (sails, flags, a hammock). A triangle when tl = tr.
function sheet(bl: V3, br: V3, tl: V3, tr: V3, bulge: V3, mat: string, nu = 6, nv = 5, edge = 0.3): Geo {
  const B = new THREE.Vector3(...bulge);
  const P = (u: number, v: number): THREE.Vector3 => {
    const b = new THREE.Vector3(...lerp3(bl, br, u)), t = new THREE.Vector3(...lerp3(tl, tr, u));
    return b.lerp(t, v).addScaledVector(B, (edge + (1 - edge) * Math.sin(Math.PI * u)) * Math.sin(Math.PI * v));
  };
  const w = Math.hypot(br[0] - bl[0], br[1] - bl[1], br[2] - bl[2]), h = Math.hypot(tl[0] - bl[0], tl[1] - bl[1], tl[2] - bl[2]);
  const pos: number[] = [], uv: number[] = [];
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => ({ p: P(a / nu, b / nv), u: ((a / nu) * w) / 100, v: ((b / nv) * h) / 100 }));
      for (const k of [0, 1, 2, 0, 2, 3, 0, 2, 1, 0, 3, 2]) {
        pos.push(q[k].p.x, q[k].p.y, q[k].p.z);
        uv.push(q[k].u, q[k].v);
      }
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return [{ geo, mat }];
}
// a barrel vault of `n` slats along X (len long), radius r about the X axis, spanning `deg` over the top
function arch(len: number, r: number, deg: number, n: number, mat: string): Geo {
  const out: Geo[] = [], step = deg / n, w = 2 * r * Math.sin((step / 2) / D) + 1.5;
  for (let i = 0; i < n; i++) out.push(rotateX(box([len, w, 6], [0, 0, r], mat), -deg / 2 + step * (i + 0.5)));
  return merge(...out);
}
// a round log with a sharpened top
function stake(x: number, y: number, h: number, r: number): Geo {
  return merge(
    cylinderAt({ rBot: r, rTop: r * 0.92, height: h, segments: 8, bottom: [x, y, 0] }, "BarkWarm"),
    cylinderAt({ rBot: r * 0.92, rTop: 1.5, height: r * 2.6, segments: 8, bottom: [x, y, h] }, "WoodPale"),
  );
}

// ---------- hulls: sections lofted bow to stern ----------
// One cross-section: (y, z, material of the edge to the next point), clockwise seen from +X
// (down the starboard side, across the keel, up to port, then in over the rail and across the deck).
type Sec = [number, number, string][];
function loft(xs: number[], secs: Sec[], outer: number, capMat: string): Geo {
  const by = new Map<string, { p: number[]; uv: number[] }>();
  const add = (mat: string, pts: V3[], uvs: [number, number][]) => {
    let b = by.get(mat);
    if (!b) by.set(mat, (b = { p: [], uv: [] }));
    for (const q of pts) b.p.push(q[0], q[1], q[2]);
    for (const u of uvs) b.uv.push(u[0], u[1]);
  };
  const arc = secs.map((s) => {
    const a = [0];
    for (let j = 0; j < s.length; j++) {
      const p = s[j], q = s[(j + 1) % s.length];
      a.push(a[j] + Math.hypot(q[0] - p[0], q[1] - p[1]));
    }
    return a;
  });
  for (let k = 0; k + 1 < xs.length; k++) {
    const A = secs[k], B = secs[k + 1], n = A.length;
    for (let j = 0; j < n; j++) {
      const j2 = (j + 1) % n;
      const a0: V3 = [xs[k], A[j][0], A[j][1]], a1: V3 = [xs[k], A[j2][0], A[j2][1]];
      const b0: V3 = [xs[k + 1], B[j][0], B[j][1]], b1: V3 = [xs[k + 1], B[j2][0], B[j2][1]];
      const ua0: [number, number] = [xs[k] / 100, arc[k][j] / 100], ua1: [number, number] = [xs[k] / 100, arc[k][j + 1] / 100];
      const ub0: [number, number] = [xs[k + 1] / 100, arc[k + 1][j] / 100], ub1: [number, number] = [xs[k + 1] / 100, arc[k + 1][j + 1] / 100];
      add(A[j][2], [a0, b0, b1, a0, b1, a1], [ua0, ub0, ub1, ua0, ub1, ua1]);
    }
  }
  // close both ends over the outer outline
  for (const [k, flip] of [[0, false], [xs.length - 1, true]] as const) {
    const s = secs[k].slice(0, outer);
    const c: V3 = [xs[k], s.reduce((t, p) => t + p[0], 0) / s.length, s.reduce((t, p) => t + p[1], 0) / s.length];
    const uv = (v: V3): [number, number] => [v[1] / 100, v[2] / 100];
    for (let j = 0; j < s.length; j++) {
      const p: V3 = [xs[k], s[j][0], s[j][1]], q: V3 = [xs[k], s[(j + 1) % s.length][0], s[(j + 1) % s.length][1]];
      if (flip) add(capMat, [c, q, p], [uv(c), uv(q), uv(p)]);
      else add(capMat, [c, p, q], [uv(c), uv(p), uv(q)]);
    }
  }
  const out: Geo = [];
  for (const [mat, b] of by) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(b.p, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(b.uv, 2));
    geo.computeVertexNormals();
    out.push({ geo, mat });
  }
  return out;
}

interface HullOpt {
  len: number; beam: number; deck: number; keel: number; bulwark: number; sheer: number;
  stern: number;      // half-width at the transom, as a share of the beam
  th: number;         // plank thickness
  n: number;          // stations
  wl: number;         // where the bottom paint ends
  band: number;       // the coloured band under the rail
  rise?: number;      // a step up of the bulwarks aft (a sterncastle)
  bowRise?: number;   // the bow sweeping up
  sternSweep?: number;// the stern sweeping up
  mats: [string, string, string, string, string, string]; // band, topsides, bottom, rail, inside, deck
}
const smooth = (u: number): number => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
function widthAt(t: number, stern: number): number {
  if (t < 0.45) return Math.sin((t / 0.45) * (Math.PI / 2)) ** 0.75;
  if (t < 0.72) return 1;
  return 1 - (1 - stern) * ((t - 0.72) / 0.28) ** 1.8;
}
// the hull's shape at x (bow at -len/2)
function hullAt(o: HullOpt, x: number) {
  const t = Math.min(1, Math.max(0, (x + o.len / 2) / o.len)), e = (2 * t - 1) ** 2;
  const w = Math.max(3, (o.beam / 2) * widthAt(t, o.stern));
  const top = o.deck + o.bulwark + o.sheer * e + (o.rise ?? 0) * smooth((t - 0.7) / 0.1)
    + (o.bowRise ?? 0) * Math.max(0, (0.25 - t) / 0.25) ** 2 + (o.sternSweep ?? 0) * Math.max(0, (t - 0.75) / 0.25) ** 2;
  const deck = o.deck + o.sheer * 0.4 * e;
  const keel = o.keel * (0.3 + 0.7 * (1 - (1 - Math.min(1, t / 0.3)) ** 2));
  return { w, wi: Math.max(1, w - o.th), top, deck, keel };
}
function hull(o: HullOpt): Geo {
  const [band, side, bottom, rail, inner, deck] = o.mats;
  const xs: number[] = [], secs: Sec[] = [];
  for (let k = 0; k <= o.n; k++) {
    const x = -o.len / 2 + (o.len * k) / o.n, s = hullAt(o, x), w = s.w, wi = s.wi, kz = s.keel;
    xs.push(x);
    secs.push([
      [w, s.top, band], [w, s.top - o.band, side], [w * 0.985, o.wl, bottom], [w * 0.9, kz * 0.4, bottom],
      [w * 0.55, kz * 0.85, bottom], [0, kz, bottom], [-w * 0.55, kz * 0.85, bottom], [-w * 0.9, kz * 0.4, bottom],
      [-w * 0.985, o.wl, side], [-w, s.top - o.band, band], [-w, s.top, rail],
      [-wi, s.top, inner], [-wi, s.deck, deck], [wi, s.deck, inner], [wi, s.top, rail],
    ]);
  }
  return loft(xs, secs, 11, side);
}
// a strip along the hull's side at height z (a wale)
function wale(o: HullOpt, z: number, x0: number, x1: number, mat: string, steps = 16): Geo {
  const g: Geo[] = [];
  for (const s of [-1, 1])
    for (let i = 0; i < steps; i++) {
      const xa = x0 + ((x1 - x0) * i) / steps, xb = x0 + ((x1 - x0) * (i + 1)) / steps;
      g.push(beamBetween([xa, s * (hullAt(o, xa).w * 0.99 + 2), z], [xb, s * (hullAt(o, xb).w * 0.99 + 2), z], 8, 13, mat));
    }
  return merge(...g);
}
// a square sail hanging from a yard at zTop (in front of a mast at xm), bellied forward
function squareSail(xm: number, zTop: number, zBot: number, half: number, belly: number, mat = "FabricWhite"): Geo {
  const x = xm - 30;
  return merge(
    sheet([x, -half * 1.04, zBot], [x, half * 1.04, zBot], [x, -half * 0.94, zTop], [x, half * 0.94, zTop], [-belly, 0, 0], mat, 6, 5),
    cylinderBetween([xm - 24, 0, zTop + 6], [xm - 24, half * 1.04, zTop + 6], 7, 6, "WoodWarm", 3.5),
    cylinderBetween([xm - 24, 0, zTop + 6], [xm - 24, -half * 1.04, zTop + 6], 7, 6, "WoodWarm", 3.5),
  );
}

// ---------- boats ----------
const SHIP: HullOpt = {
  len: 2000, beam: 560, deck: 150, keel: -190, bulwark: 60, sheer: 50, rise: 110, bowRise: 60, stern: 0.72, th: 10, n: 24, wl: 18, band: 24,
  mats: ["Yodia_HullTrim", "WoodDark", "Yodia_HullBottom", "WoodWarm", "WoodShade", "WoodPale"],
};

function mast(x: number, z0: number, zPlat: number, zPeak: number): Geo {
  return merge(
    cylinderBetween([x, 0, z0 - 10], [x, 0, zPlat], 17, 10, "WoodWarm", 14),
    cylinderAt({ radius: 62, height: 10, segments: 10, bottom: [x, 0, zPlat] }, "WoodDark"),
    cylinderAt({ rBot: 30, rTop: 62, height: 18, segments: 10, bottom: [x, 0, zPlat - 18] }, "WoodShade"),
    translate(torus(60, 2.5, 16, 4, "WoodWarm"), [x, 0, zPlat + 30]),
    boxAt([4, 4, 30], [x, 59, zPlat + 10], "WoodDark"), boxAt([4, 4, 30], [x, -59, zPlat + 10], "WoodDark"),
    boxAt([4, 4, 30], [x - 59, 0, zPlat + 10], "WoodDark"), boxAt([4, 4, 30], [x + 59, 0, zPlat + 10], "WoodDark"),
    cylinderBetween([x, 0, zPlat], [x, 0, zPeak], 11, 8, "WoodWarm", 6),
    boxAt([30, 70, 6], [x, 0, zPlat + (zPeak - zPlat) * 0.62], "WoodDark"),
    sphereCenter(7, [x, 0, zPeak + 4], "GoldTrim", 8),
  );
}

function ship(): Geo {
  const o = SHIP, H = (x: number) => hullAt(o, x);
  const g: Geo[] = [hull(o), wale(o, 95, -900, 960, "Yodia_HullTrim", 20)];
  // quarterdeck over the after cabin
  const qz = 290, qxs = [600, 680, 760, 840, 920, 1000];
  g.push(loft(qxs, qxs.map((x): Sec => { const wi = H(x).wi + 1; return [[wi, qz, "WoodShade"], [wi, qz - 16, "WoodShade"], [-wi, qz - 16, "WoodShade"], [-wi, qz, "WoodPale"]]; }), 4, "WoodShade"));
  const wq = H(600).wi;
  g.push(boxBounds([600, -wq, 150], [612, wq, qz - 14], "WoodWarm"));
  g.push(at(door(80, 118), 0, -600, 0, 156), at(win(40, 40), 0, -600, -160, 205), at(win(40, 40), 0, -600, 160, 205));
  g.push(array(boxAt([5, 5, 34], [606, -wq + 14, qz], "WoodWarm"), 18, [0, (2 * wq - 28) / 17, 0]), boxBounds([600, -wq, qz + 34], [612, wq, qz + 40], "WoodDark"));
  // steps up to the quarterdeck
  for (let i = 0; i < 5; i++) g.push(boxAt([24, 70, 6], [590 - i * 22, 180, qz - 26 - i * 26], "WoodShade"));
  g.push(beamBetween([492, 140, 152], [600, 140, qz], 5, 10, "WoodDark"), beamBetween([492, 220, 152], [600, 220, qz], 5, 10, "WoodDark"));
  // ship's wheel
  const wheel: V3 = [880, 0, qz + 82];
  g.push(boxAt([14, 34, 66], [900, 0, qz], "WoodDark", 2), translate(rotateY(torus(40, 3, 14, 4, "WoodWarm"), 90), wheel));
  for (let i = 0; i < 4; i++) {
    const a = (i * 45) / D;
    g.push(cylinderBetween([wheel[0], Math.cos(a) * 52, wheel[2] + Math.sin(a) * 52], [wheel[0], -Math.cos(a) * 52, wheel[2] - Math.sin(a) * 52], 2, 5, "WoodWarm"));
  }
  // gunports with small guns, three a side
  for (const x of [-300, 120, 340])
    for (const s of [-1, 1]) {
      const w = H(x).w;
      g.push(boxAt([38, 6, 30], [x, s * (w + 1), 166], "LacquerBlack"));
      g.push(rotateX(boxAt([40, 4, 32], [x, s * (w + 3), 196], "WoodRed"), s * -55, [x, s * (w + 1), 196]));
      g.push(cylinderBetween([x, s * (w - 30), 181], [x, s * (w + 26), 181], 6.5, 8, "IronDark", 5));
    }
  // masts, platforms, yards and sails
  const masts: [number, number, number, number][] = [[-560, 150, 950, 1600], [-60, 150, 1080, 1800], [760, qz, 880, 1350]];
  for (const [x, z0, zp, zt] of masts) g.push(mast(x, z0, zp, zt));
  g.push(
    squareSail(-560, 850, 330, 360, 70), squareSail(-560, 1290, 968, 270, 55), squareSail(-560, 1530, 1300, 180, 40),
    squareSail(-60, 980, 360, 400, 80), squareSail(-60, 1450, 1098, 300, 60), squareSail(-60, 1720, 1465, 200, 42),
    squareSail(760, 1250, 900, 190, 45),
  );
  // spanker on the mizzen (gaff and boom)
  g.push(
    cylinderBetween([775, 0, 1040], [1120, 0, 1200], 6, 6, "WoodWarm", 4), cylinderBetween([775, 0, 410], [1190, 0, 440], 7, 6, "WoodWarm", 5),
    sheet([782, 0, 418], [1180, 0, 440], [782, 0, 1035], [1112, 0, 1192], [0, 45, 0], "FabricWhite", 6, 5),
  );
  // bowsprit, bitts, jib and fore staysail
  const bs0: V3 = [-820, 0, 300], bs1: V3 = [-1520, 0, 520];
  g.push(cylinderBetween(bs0, bs1, 14, 8, "WoodWarm", 7), boxAt([34, 46, 150], [-820, 0, 150], "WoodDark", 3));
  g.push(sheet([-1490, 0, 512], [-1020, 0, 418], [-600, 0, 1500], [-600, 0, 1500], [0, 40, 0], "FabricWhite", 5, 6));
  g.push(sheet([-1100, 0, 392], [-770, 0, 332], [-590, 0, 1000], [-590, 0, 1000], [0, 34, 0], "FabricWhite", 5, 6));
  // figurehead: a gilded naga curling from the stem
  for (let i = 0; i < 6; i++) g.push(sphereCenter(17 - i * 2, [-1000 - i * 18, 0, 210 + i * 18 + (i > 3 ? (i - 3) * 10 : 0)], "GoldTrim", 8));
  g.push(cylinderAt({ rBot: 9, rTop: 1, height: 26, segments: 6, bottom: [-1098, 0, 318] }, "GoldTrim"));
  // standing rigging: stays, shrouds, backstays
  const tar = (a: V3, b: V3) => rope(a, b, 1.6, "Yodia_Tar");
  g.push(
    tar([-560, 0, 1600], bs1), tar([-560, 0, 950], [-1100, 0, 388]), tar([-60, 0, 1800], [-560, 0, 1540]), tar([-60, 0, 1080], [-560, 0, 520]),
    tar([760, 0, 1350], [-60, 0, 1160]), tar([760, 0, 880], [-50, 0, 470]), tar(bs1, [-1000, 0, 130]),
  );
  for (const [x, , zp, zt] of masts)
    for (const s of [-1, 1]) {
      const ch = H(x + 30);
      g.push(boxBounds([x - 40, s > 0 ? ch.w - 2 : -ch.w - 18, ch.top - 34], [x + 100, s > 0 ? ch.w + 18 : -ch.w + 2, ch.top - 26], "WoodDark"));
      for (const dx of [-25, 25, 75]) {
        const c = H(x + dx);
        g.push(tar([x + dx * 0.15, s * 22, zp - 4], [x + dx, s * (c.w + 12), c.top - 30]));
      }
      for (const dx of [-14, 24]) g.push(tar([x, s * 9, zt - 150], [x + dx, s * 58, zp + 10]));
      if (x < 700) {
        const b = H(x + 420);
        g.push(tar([x, s * 6, zt - 60], [x + 420, s * (b.w + 4), b.top - 6]));
      }
    }
  // sheets from the courses' corners to the rail
  for (const [x, , , zb, half] of [[-560, 0, 0, 330, 360], [-60, 0, 0, 360, 400]])
    for (const s of [-1, 1]) {
      const c = H(x + 260);
      g.push(rope([x - 30, s * half * 1.04, zb], [x + 260, s * (c.w - 4), c.top], 1.3));
    }
  // pennants and the ensign (the wind blows from astern, toward -X)
  g.push(sheet([-66, 0, 1785], [-430, 0, 1800], [-66, 0, 1830], [-430, 0, 1802], [0, 16, -10], "FabricRed", 6, 1, 0.6));
  g.push(sheet([-566, 0, 1590], [-820, 0, 1600], [-566, 0, 1622], [-820, 0, 1601], [0, 14, -8], "FabricGold", 5, 1, 0.6));
  g.push(cylinderBetween([1012, 0, 360], [1030, 0, 600], 3.5, 6, "WoodWarm"), sphereCenter(5, [1030, 0, 604], "GoldTrim", 6));
  g.push(sheet([1028, 0, 548], [900, 0, 540], [1030, 0, 592], [902, 0, 584], [0, 18, 0], "FabricRed", 5, 2));
  g.push(sheet([1026, 0, 506], [898, 0, 498], [1028, 0, 548], [900, 0, 540], [0, 18, 0], "FabricGold", 5, 2));
  // stern: windows, a gilded band, lanterns on the taffrail, the rudder
  for (const y of [-138, -46, 46, 138]) g.push(boxAt([4, 64, 54], [1002, y, 228], "GoldTrim"), boxAt([4, 50, 40], [1005, y, 235], "GlassBlue"), boxAt([4, 3, 40], [1007, y, 235], "GoldTrim"));
  g.push(boxAt([5, 360, 14], [1003, 0, 292], "GoldTrim", 1), boxAt([5, 300, 26], [1003, 0, 306], "WoodRed", 1), boxAt([5, 380, 8], [1003, 0, 208], "GoldTrim", 1));
  const st = H(1000).top;
  for (const y of [-170, 0, 170]) g.push(cylinderBetween([985, y, st], [985, y, st + 30], 3, 6, "IronDark"), translate(lantern(12, 26), [985, y, st + 30]));
  g.push(boxBounds([1000, -9, -185], [1034, 9, 230], "WoodDark", 2), boxBounds([1001, -11, 40], [1036, 11, 50], "IronDark"), boxBounds([1001, -11, 140], [1036, 11, 150], "IronDark"));
  // anchors hanging at the bow, catheads
  for (const s of [-1, 1]) {
    const x = -850, b = H(x), y = s * (b.w + 14);
    g.push(beamBetween([x - 10, s * (b.w - 20), b.top - 10], [x - 30, s * (b.w + 46), b.top - 2], 14, 14, "WoodDark"));
    g.push(boxAt([8, 8, 130], [x, y, b.top - 170], "IronDark"), boxAt([8, 60, 8], [x, y, b.top - 60], "WoodDark"));
    g.push(beamBetween([x, y, b.top - 170], [x - 34, y, b.top - 130], 8, 8, "IronDark"), beamBetween([x, y, b.top - 170], [x + 34, y, b.top - 130], 8, 8, "IronDark"));
    g.push(translate(rotateY(torus(8, 2, 8, 4, "IronDark"), 90), [x, y, b.top - 32]));
  }
  // deck: hatch grating, the ship's boat, capstan, cargo and coiled ropes
  g.push(boxAt([210, 170, 22], [-320, 0, 150], "WoodDark", 2), boxAt([190, 150, 4], [-320, 0, 172], "WoodShade"));
  g.push(array(boxAt([190, 4, 4], [-320, -66, 176], "WoodDark"), 6, [0, 26.4, 0]), array(boxAt([4, 150, 4], [-405, 0, 176], "WoodDark"), 7, [28.3, 0, 0]));
  const boat: HullOpt = { len: 330, beam: 120, deck: 6, keel: -26, bulwark: 34, sheer: 12, bowRise: 8, stern: 0.55, th: 4, n: 10, wl: 0, band: 8,
    mats: ["WoodRed", "WoodWarm", "WoodShade", "WoodShade", "WoodShade", "WoodShade"] };
  g.push(translate(merge(hull(boat), boxAt([18, 80, 26], [-80, 0, -30], "WoodDark"), boxAt([18, 80, 26], [80, 0, -30], "WoodDark"),
    cylinderBetween([-130, -20, 22], [130, -30, 22], 2.5, 5, "WoodPale"), cylinderBetween([-130, 20, 22], [130, 30, 22], 2.5, 5, "WoodPale")), [200, 0, 182]));
  g.push(cylinderAt({ rBot: 28, rTop: 22, height: 50, segments: 8, bottom: [480, 0, 150] }, "WoodWarm"), cylinderAt({ radius: 32, height: 12, segments: 8, bottom: [480, 0, 200] }, "WoodDark"));
  for (let i = 0; i < 2; i++) g.push(rotateZ(boxAt([150, 7, 7], [480, 0, 204], "WoodWarm"), i * 90, [480, 0, 0]));
  g.push(translate(crate(62), [-170, -180, 150]), translate(crate(62), [-170, -112, 150]), translate(crate(54), [-170, -150, 212]), translate(crate(58, "WoodPale"), [-120, 170, 150]));
  g.push(translate(barrel(76, 28), [-60, -200, 150]), translate(barrel(76, 28), [50, 200, 150]), translate(barrel(76, 28), [100, 205, 150]));
  for (const [x, y] of [[-520, 70], [-20, -70], [700, 60]]) g.push(translate(coil(22, 3), [x, y, x > 600 ? qz : 150]));
  return merge(...g);
}

const BOAT: HullOpt = {
  len: 640, beam: 220, deck: 40, keel: -70, bulwark: 30, sheer: 40, bowRise: 45, sternSweep: 15, stern: 0.6, th: 6, n: 14, wl: 8, band: 12,
  mats: ["Yodia_Teal", "WoodWarm", "Yodia_HullBottom", "WoodDark", "WoodShade", "WoodGrey"],
};
function fishingBoat(): Geo {
  const o = BOAT, H = (x: number) => hullAt(o, x);
  const g: Geo[] = [hull(o), wale(o, 22, -260, 300, "WoodDark", 10)];
  // a woven canopy over the stern
  const cw = H(150).wi;
  g.push(translate(arch(190, cw, 150, 7, "Thatch"), [160, 0, 58]));
  for (const x of [72, 248]) for (const s of [-1, 1]) g.push(cylinderBetween([x, s * (cw - 4), 44], [x, s * (cw - 4), 82], 3, 6, "Bamboo"));
  // mast and a lateen sail
  g.push(cylinderBetween([-110, 0, 30], [-110, 0, 470], 7, 8, "WoodWarm", 5), sphereCenter(6, [-110, 0, 474], "GoldTrim", 6));
  g.push(cylinderBetween([-330, 0, 150], [120, 0, 560], 4.5, 6, "BambooDry", 3));
  g.push(sheet([-300, 0, 168], [60, 0, 120], [100, 0, 538], [100, 0, 538], [0, 30, 0], "FabricSand", 5, 6));
  g.push(rope([-110, 0, 470], [120, 0, 556], 1), rope([60, 0, 120], [150, 50, 75], 1.2), rope([-300, 0, 168], [-290, 0, 70], 1.2));
  // nets with floats at the bow, baskets of fish, oars, a lantern pole
  g.push(translate(rock([170, 130, 42], 0.5, 7, "Yodia_Net", true), [-215, 0, 46]));
  for (const [x, y] of [[-280, -40], [-250, 40], [-170, -52], [-150, 46]]) g.push(sphereCenter(6, [x, y, 66], "FabricRed", 6));
  for (const [x, y] of [[-30, -52], [10, 50]]) {
    g.push(translate(basket(22, 24), [x, y, 44]));
    for (const [dx, dy, a] of [[0, 0, 20], [-6, 8, 100], [6, -6, 160]]) g.push(translate(rotateZ(fish(26), a), [x + dx, y + dy, 64]));
  }
  for (const s of [-1, 1]) g.push(cylinderBetween([-200, s * (H(-200).w - 8), H(-200).top + 3], [180, s * (H(180).w - 6), H(180).top + 3], 2.5, 6, "WoodPale"),
    boxAt([60, 4, 16], [205, s * (H(200).w - 6), H(200).top - 5], "WoodPale"));
  g.push(cylinderBetween([300, 0, 48], [300, 0, 240], 3, 6, "WoodDark"), beamBetween([300, 0, 236], [270, 0, 236], 3, 3, "WoodDark"), hangLantern([268, 0, 236], 6, 8, 18));
  return merge(...g);
}

const CANOE: HullOpt = {
  len: 520, beam: 84, deck: 6, keel: -32, bulwark: 36, sheer: 18, bowRise: 26, sternSweep: 26, stern: 0.06, th: 5, n: 14, wl: 4, band: 9,
  mats: ["WoodRed", "WoodDark", "WoodShade", "WoodWarm", "WoodShade", "WoodShade"],
};
function outriggerCanoe(): Geo {
  const o = CANOE, g: Geo[] = [hull(o)];
  // the float out to starboard on two booms
  const fy = 180;
  g.push(cylinderBetween([-190, fy, -4], [190, fy, -4], 11, 8, "WoodPale"));
  g.push(cylinderBetween([190, fy, -4], [250, fy, 6], 11, 8, "WoodPale", 1.5), cylinderBetween([-190, fy, -4], [-250, fy, 6], 11, 8, "WoodPale", 1.5));
  for (const x of [-100, 100]) {
    const top = hullAt(o, x).top;
    g.push(cylinderBetween([x, -42, top + 4], [x, fy + 12, top - 2], 4.5, 6, "BambooDry"));
    g.push(cylinderBetween([x - 12, fy, top - 2], [x - 26, fy, 4], 2.4, 5, "WoodDark"), cylinderBetween([x + 12, fy, top - 2], [x + 26, fy, 4], 2.4, 5, "WoodDark"));
    for (const y of [-38, 38]) g.push(translate(rotateY(torus(5.5, 1.4, 6, 3, "RopeTan"), 90), [x, y, top + 3]));
  }
  // paddles and a little basket
  const paddle = (a: V3, b: V3): Geo => merge(cylinderBetween(a, b, 2.2, 5, "WoodWarm"), translate(rotateZ(boxAt([38, 15, 3], [0, 0, -1.5], "WoodWarm", 1), Math.atan2(b[1] - a[1], b[0] - a[0]) * D), b));
  g.push(paddle([-170, -20, 32], [40, 20, 30]), paddle([200, 10, 30], [-20, -24, 28]));
  g.push(translate(basket(14, 16), [140, 0, 6]));
  return translate(merge(...g), [0, -(fy + 11 - 42) / 2, 0]);
}

// ---------- the waterfront ----------
// a pier segment, 4 m along Y (tiles end to end), 2.4 m wide, its deck 40 cm up on piles
function pier(): Geo {
  const g: Geo[] = [], top = 40;
  for (let i = 0; i < 14; i++) {
    const y = -200 + (400 / 14) * (i + 0.5), len = 236 + ((i * 7) % 3) * 4;
    g.push(boxAt([len, 26, 6], [((i * 5) % 3 - 1) * 2.5, y, top - 6], i % 5 === 3 ? "WoodPale" : "WoodGrey", 1));
  }
  for (const x of [-90, 0, 90]) g.push(boxBounds([x - 8, -200, top - 28], [x + 8, 200, top - 6], "WoodDark"));
  for (const y of [-150, 150]) {
    g.push(boxBounds([-138, y - 9, top - 46], [138, y + 9, top - 28], "WoodDark"));
    for (const x of [-128, 128]) {
      g.push(cylinderAt({ radius: 13, height: 340, segments: 8, bottom: [x, y, -270] }, "WoodDark"));
      g.push(cylinderAt({ radius: 14, height: 34, segments: 8, bottom: [x, y, -44] }, "MossStone"));
      g.push(cylinderAt({ rBot: 13, rTop: 9, height: 6, segments: 8, bottom: [x, y, 70] }, "WoodShade"));
    }
    g.push(beamBetween([-128, y, -40], [128, y, top - 46], 8, 12, "WoodShade"));
  }
  for (const x of [-128, 128]) g.push(beamBetween([x, -150, -30], [x, 150, top - 46], 8, 12, "WoodShade"));
  for (const s of [-1, 1]) g.push(boxBounds([s * 120 - 6, -200, top], [s * 120 + 6, 200, top + 9], "WoodDark"));
  g.push(translate(torus(15, 3, 10, 4, "RopeTan"), [128, 150, 52]), translate(torus(15, 3, 10, 4, "RopeTan"), [128, 150, 46]));
  g.push(boxAt([30, 10, 8], [-112, 60, top + 9], "IronDark", 1), boxAt([8, 6, 10], [-112, 46, top + 9], "IronDark"), boxAt([8, 6, 10], [-112, 74, top + 9], "IronDark"));
  return merge(...g);
}

// a stone wharf segment, 8 m along Y (tiles end to end), 5 m deep, its sea face to -X
function wharf(): Geo {
  const top = 40, g: Geo[] = [
    boxBounds([-250, -400, -260], [250, 400, top], "StoneGrey"),
    boxBounds([-254, -400, -260], [-246, 400, -24], "MossStone"),
    boxBounds([-262, -400, top - 10], [-180, 400, top + 6], "StoneLight", 2.5),
    boxBounds([240, -400, top - 6], [252, 400, top + 2], "StoneDark", 1),
  ];
  for (const y of [-300, -100, 100, 300]) {
    g.push(boxBounds([-274, y - 11, -160], [-260, y + 11, top + 2], "WoodDark", 2));
    for (const z of [-60, 10]) g.push(boxBounds([-276, y - 13, z], [-259, y + 13, z + 6], "IronDark"));
  }
  for (const y of [-200, 200]) g.push(translate(bollard(), [-220, y, top + 6]));
  g.push(translate(coil(20, 3), [-170, 236, top]), translate(rotateY(torus(13, 2.4, 10, 4, "IronDark"), 90), [-265, 0, -12]));
  return merge(...g);
}

// stone steps down into the water, 4 m along Y, 5 m deep (matches the wharf)
function dockSteps(): Geo {
  const top = 40, g: Geo[] = [];
  for (const s of [-1, 1]) {
    const y0 = s < 0 ? -200 : 120, y1 = s < 0 ? -120 : 200;
    g.push(boxBounds([-250, y0, -260], [250, y1, top], "StoneGrey"), boxBounds([-262, y0, top - 10], [250, y1, top + 6], "StoneLight", 2.5));
    g.push(boxBounds([-254, y0, -260], [-246, y1, -24], "MossStone"));
    g.push(translate(bollard(), [-215, (y0 + y1) / 2, top + 6]));
    g.push(translate(rotateZ(rotateY(torus(12, 2.4, 10, 4, "IronDark"), 90), 90), [-120, s * 118, -20]));
  }
  g.push(boxBounds([60, -120, -260], [250, 120, top], "StoneGrey"), boxBounds([240, -120, top - 6], [252, 120, top + 2], "StoneDark", 1));
  for (let i = 0; i < 10; i++) {
    const zt = top - (i + 1) * 22, x1 = 60 - i * 31;
    g.push(boxBounds([x1 - 31, -120, -260], [x1 + 2, 120, zt], zt < -16 ? "MossStone" : "StoneLight", 2));
  }
  return merge(...g);
}

// a wooden slewing crane on a stone base; the jib reaches out to -X with a crate on the hook
function crane(): Geo {
  const g: Geo[] = [
    boxAt([300, 300, 50], [0, 0, 0], "StoneGrey", 4),
    cylinderAt({ radius: 76, height: 12, segments: 12, bottom: [0, 0, 50] }, "WoodShade"),
    translate(torus(76, 3, 16, 4, "IronDark"), [0, 0, 56]),
    boxAt([36, 36, 650], [0, 0, 62], "WoodWarm", 3),
    boxAt([50, 50, 10], [0, 0, 712], "WoodDark", 2),
    sphereCenter(10, [0, 0, 730], "GoldTrim", 8),
  ];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.push(beamBetween([dx * 112, dy * 112, 62], [dx * 18, dy * 18, 330], 14, 14, "WoodShade"));
  const foot: V3 = [-20, 0, 170], tip: V3 = [-520, 0, 640];
  for (const s of [-1, 1]) g.push(beamBetween([foot[0], s * 16, foot[2]], [tip[0], s * 12, tip[2]], 13, 18, "WoodWarm"));
  for (let i = 1; i < 6; i++) {
    const p = lerp3(foot, tip, i / 6);
    g.push(boxAt([8, 36, 8], [p[0], 0, p[2] - 6], "WoodDark"));
  }
  // back arm with a counterweight, ties from the mast top
  g.push(boxBounds([0, -11, 600], [240, 11, 624], "WoodWarm", 2), boxAt([74, 74, 90], [205, 0, 510], "StoneDark", 4), boxBounds([166, -38, 548], [244, 38, 556], "IronDark"));
  g.push(rope([0, 0, 716], [tip[0] + 6, 0, tip[2] + 8], 2.2, "Yodia_Tar"), rope([0, 0, 716], [236, 0, 624], 2.2, "Yodia_Tar"));
  // pulley, hoist rope, hook, a sling and a crate
  const px = tip[0] - 4;
  g.push(translate(rotateX(torus(14, 4, 10, 4, "WoodShade"), 90), [px, 0, tip[2] - 18]));
  for (const s of [-1, 1]) g.push(boxAt([36, 3, 36], [px, s * 7, tip[2] - 34], "IronDark"));
  const hookZ = 430, hx = px - 16;
  g.push(rope([hx, 0, tip[2] - 18], [hx, 0, hookZ + 10], 2.2), translate(rotateX(torus(9, 2.4, 10, 4, "IronDark"), 90), [hx, 0, hookZ]));
  const cTop = hookZ - 100;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.push(rope([hx, 0, hookZ - 8], [hx + sx * 28, sy * 28, cTop], 1.4));
  g.push(translate(crate(64), [hx, 0, cTop - 64]));
  g.push(rope([px + 14, 0, tip[2] - 18], [-40, 0, 150], 2), rope([-40, 0, 150], [-70, 0, 140], 2));
  // winch drum with cranks
  g.push(cylinderBetween([-75, -40, 125], [-75, 40, 125], 20, 10, "WoodShade"), translate(rotateX(torus(20, 2, 10, 4, "RopeTan"), 90), [-75, 0, 125]));
  for (const s of [-1, 1]) {
    g.push(boxAt([70, 8, 92], [-75, s * 48, 62], "WoodDark", 1.5));
    g.push(cylinderBetween([-75, s * 44, 125], [-75, s * 58, 125], 3, 6, "IronDark"), beamBetween([-75, s * 58, 125], [-75, s * 58, 160], 4, 4, "IronDark"), cylinderBetween([-75, s * 58, 160], [-75, s * 72, 160], 2.5, 6, "WoodWarm"));
  }
  return merge(...g);
}

// crates, barrels, sacks, dragon jars and a coil of rope, about 3.2 x 2.8 m
function cargoPile(): Geo {
  const lying = translate(rotateY(barrel(), 90), [-45, 0, 34]);
  return merge(
    translate(crate(70), [-70, -80, 0]), translate(crate(70), [-70, -4, 0]), translate(crate(58, "WoodPale"), [-70, -42, 70]),
    translate(rotateZ(crate(62, "WoodPale"), 14), [20, -110, 0]), translate(crate(48), [24, -108, 62]),
    translate(barrel(), [70, 30, 0]), translate(barrel(), [120, -40, 0]), translate(lying, [90, 100, 0]),
    boxAt([10, 16, 10], [45, 72, 0], "WoodShade"), boxAt([10, 16, 10], [45, 128, 0], "WoodShade"),
    translate(sack(), [-20, 90, 0]), translate(rotateZ(sack(), 40), [-80, 110, 0]), translate(rotateZ(sack(), -25), [-40, 75, 36]),
    translate(rotateZ(sack("FabricSand"), 70), [-120, 40, 0]),
    translate(jar(), [140, -110, 0]), translate(jar(66, 26), [150, 40, 0]),
    translate(coil(22, 3), [-140, -110, 0]),
  );
}

// ---------- buildings ----------
// a house on tall stilts: bamboo walls, a steep thatch roof over a front veranda, a ladder up
function stiltHouse(): Geo {
  const F = 220, W = 430, x0 = -180, x1 = 280, hy = 220, xv = -360;
  const g: Geo[] = [];
  const posts: [number, number][] = [];
  for (const x of [-350, -180, 50, 280]) for (const y of [-210, 210]) posts.push([x, y]);
  posts.forEach(([x, y], i) => {
    g.push(cylinderAt({ rBot: 14, rTop: 11, height: W + 6, segments: 8, bottom: [x, y, 0] }, "WoodDark"));
    g.push(translate(rock([42, 42, 16], 0.3, 3 + i, "StoneGrey", true), [x, y, -3]));
  });
  for (const x of [-180, 50, 280]) g.push(cylinderAt({ radius: 12, height: F - 14, segments: 8, bottom: [x, 0, 0] }, "WoodDark"));
  // floor beams and deck
  for (const y of [-210, 0, 210]) g.push(boxBounds([xv - 6, y - 9, F - 34], [x1 + 14, y + 9, F - 14], "WoodDark"));
  g.push(boxBounds([xv - 10, -hy - 8, F - 14], [x1 + 12, hy + 8, F], "WoodWarm", 2));
  for (const s of [-1, 1]) g.push(beamBetween([-350, s * 210, 40], [-180, s * 210, F - 40], 8, 10, "WoodShade"), beamBetween([50, s * 210, 40], [280, s * 210, F - 40], 8, 10, "WoodShade"));
  // bamboo walls on a dark frame
  g.push(
    boxBounds([x0 - 8, -hy, F], [x0, hy, W], "BambooDry"), boxBounds([x1 - 8, -hy, F], [x1, hy, W], "BambooDry"),
    boxBounds([x0, -hy, F], [x1, -hy + 8, W], "BambooDry"), boxBounds([x0, hy - 8, F], [x1, hy, W], "BambooDry"),
  );
  for (const z of [F + 4, F + 110]) {
    g.push(boxBounds([x0 - 12, -hy - 4, z], [x0 - 8, hy + 4, z + 7], "WoodDark"), boxBounds([x1, -hy - 4, z], [x1 + 4, hy + 4, z + 7], "WoodDark"));
    g.push(boxBounds([x0, -hy - 4, z], [x1, -hy, z + 7], "WoodDark"), boxBounds([x0, hy, z], [x1, hy + 4, z + 7], "WoodDark"));
  }
  g.push(boxBounds([xv, -hy - 6, W - 6], [x1 + 8, -hy + 10, W + 10], "WoodDark", 1.5), boxBounds([xv, hy - 10, W - 6], [x1 + 8, hy + 6, W + 10], "WoodDark", 1.5));
  g.push(boxBounds([xv - 8, -hy - 6, W - 6], [xv + 8, hy + 6, W + 10], "WoodDark", 1.5));
  g.push(at(door(96, 186), 0, -x0 + 8, 0, F));
  // windows with propped shutters on the sides and back
  const prop = (w: number, h: number): Geo => merge(
    boxAt([6, w + 14, h + 14], [-3, 0, -7], "WoodDark", 1), boxAt([3, w, h], [-6.5, 0, 0], "GlassBlue"), boxAt([3, 4, h], [-9, 0, 0], "WoodDark"),
    rotateY(boxAt([4, w + 10, h + 6], [-8, 0, 1], "WoodWarm", 1), 62, [-8, 0, h + 7]),
    cylinderBetween([-10, 0, -6], [-8 - (h + 6) * Math.sin(62 / D), 0, h + 7 - (h + 6) * Math.cos(62 / D)], 1.6, 4, "BambooDry"),
  );
  for (const [hd, d, along] of [[90, hy, -50], [90, hy, -160], [270, hy, 50], [270, hy, 160], [180, x1, 0]] as const) g.push(at(prop(70, 76), hd, d, along, F + 70));
  // steep thatch roof over house and veranda, closed gables with battens, carved horns
  const zr = W + 290;
  g.push(thatchRoof(x1 - xv, 2 * hy, 14, [(x1 + xv) / 2, 0, W], 290, 70));
  g.push(cylinderBetween([xv - 76, 0, zr + 18], [x1 + 76, 0, zr + 18], 19, 6, "Thatch"), cylinderBetween([xv - 82, 0, zr + 24], [x1 + 82, 0, zr + 24], 9, 6, "BambooDry"));
  const eave = W - (70 * 290) / hy;
  for (const x of [xv - 2, x1 + 2]) {
    g.push(gableWall(x, hy, W, 282, "WoodPale"));
    for (let y = -160; y <= 160; y += 40) g.push(boxBounds([x - 3, y - 3, W], [x + 3, y + 3, W + 282 * (1 - Math.abs(y) / hy) - 6], "WoodDark"));
  }
  g.push(barge(xv - 72, hy + 70, eave + 16, zr + 24, 95), barge(x1 + 72, hy + 70, eave + 16, zr + 24, 95));
  // veranda rail and ladder
  for (const s of [-1, 1]) {
    g.push(boxBounds([xv - 4, s > 0 ? 60 : -hy, F + 70], [xv + 4, s > 0 ? hy : -60, F + 76], "WoodDark"));
    g.push(boxBounds([xv, s * hy - 4, F + 70], [x0, s * hy + 4, F + 76], "WoodDark"));
    for (let y = 72; y < hy; y += 20) g.push(cylinderBetween([xv, s * y, F], [xv, s * y, F + 70], 3, 6, "Bamboo"));
    for (let x = xv + 18; x < x0; x += 20) g.push(cylinderBetween([x, s * hy, F], [x, s * hy, F + 70], 3, 6, "Bamboo"));
  }
  for (const s of [-1, 1]) g.push(beamBetween([xv - 120, s * 40, 0], [xv - 4, s * 40, F + 6], 8, 10, "WoodDark"));
  for (let i = 1; i < 8; i++) {
    const t = i / 8;
    g.push(cylinderBetween([xv - 120 + 116 * t, -44, (F + 6) * t], [xv - 120 + 116 * t, 44, (F + 6) * t], 3.5, 6, "BambooDry"));
  }
  // life underneath: water jars, firewood, a hammock; a lantern and a basket on the veranda
  g.push(translate(jar(70, 26, "Yodia_Clay"), [-250, -140, 0]), translate(jar(56, 22, "Yodia_Clay"), [-240, -90, 0]));
  for (let i = 0; i < 6; i++) g.push(cylinderBetween([200 + (i % 3) * 18, 120, 10 + Math.floor(i / 3) * 17], [200 + (i % 3) * 18, 190, 10 + Math.floor(i / 3) * 17], 8, 6, "BarkWarm"));
  g.push(sheet([70, -236, 118], [70, -184, 118], [262, -236, 118], [262, -184, 118], [0, 0, -42], "FabricRed", 4, 6));
  g.push(rope([70, -210, 118], [50, -210, 150], 1.2), rope([262, -210, 118], [280, -210, 150], 1.2));
  g.push(hangLantern([-300, 0, W - 6], 20), translate(basket(18, 22), [-300, 150, F]));
  return merge(...g);
}

// a long house on low stilts with a deep veranda along its front (-X), thatch roofs
function longhouse(): Geo {
  const F = 130, W = 420, x0 = -100, x1 = 300, hy = 480, xv = -300;
  const g: Geo[] = [];
  for (const x of [-290, -100, 100, 300])
    for (const y of [-470, -235, 0, 235, 470]) {
      g.push(cylinderAt({ rBot: 13, rTop: 11, height: F - 14, segments: 8, bottom: [x, y, 0] }, "WoodDark"));
      g.push(cylinderAt({ rBot: 20, rTop: 17, height: 10, segments: 8, bottom: [x, y, 0] }, "StoneGrey"));
    }
  for (const x of [-290, -100, 100, 300]) g.push(boxBounds([x - 9, -hy - 10, F - 32], [x + 9, hy + 10, F - 14], "WoodDark"));
  g.push(boxBounds([xv - 8, -hy - 10, F - 14], [x1 + 10, hy + 10, F], "WoodWarm", 2));
  // board walls (boards upright) on a dark frame
  g.push(
    uvAlong(boxBounds([x0 - 8, -hy, F], [x0, hy, W], "WoodPale"), 2), uvAlong(boxBounds([x1 - 8, -hy, F], [x1, hy, W], "WoodPale"), 2),
    uvAlong(boxBounds([x0, -hy, F], [x1, -hy + 8, W], "WoodPale"), 2), uvAlong(boxBounds([x0, hy - 8, F], [x1, hy, W], "WoodPale"), 2),
  );
  for (const y of [-480, -240, 0, 240, 480]) g.push(boxAt([16, 16, W - F + 6], [x0 - 6, y, F], "WoodDark", 1.5), boxAt([16, 16, W - F + 6], [x1 + 2, y, F], "WoodDark", 1.5));
  for (const x of [100]) for (const s of [-1, 1]) g.push(boxAt([16, 16, W - F + 6], [x, s * (hy + 2), F], "WoodDark", 1.5));
  for (const z of [F, W - 8]) {
    g.push(boxBounds([x0 - 14, -hy - 6, z], [x0 - 4, hy + 6, z + 12], "WoodDark"), boxBounds([x1, -hy - 6, z], [x1 + 10, hy + 6, z + 12], "WoodDark"));
    g.push(boxBounds([x0, -hy - 10, z], [x1, -hy - 2, z + 12], "WoodDark"), boxBounds([x0, hy + 2, z], [x1, hy + 10, z + 12], "WoodDark"));
  }
  for (const y of [-120, 120]) g.push(at(door(90, 200), 0, -x0 + 8, y, F + 8));
  for (const y of [-360, 360]) g.push(at(win(80, 90, { shutter: "WoodShade" }), 0, -x0 + 8, y, F + 90));
  for (const y of [-240, 0, 240]) g.push(at(win(80, 90, { shutter: "WoodShade" }), 180, x1, -y, F + 90));
  for (const hd of [90, 270]) g.push(at(win(80, 90, { shutter: "WoodShade" }), hd, hy, hd === 90 ? -100 : 100, F + 90));
  // main thatch roof (ridge along Y), gable ends with battens and horns
  const zr = W + 260, cx = (x0 + x1) / 2;
  g.push(translate(rotateZ(thatchRoof(2 * hy, x1 - x0, 14, [0, 0, W], 260, 55), 90), [cx, 0, 0]));
  g.push(cylinderBetween([cx, -hy - 52, zr + 17], [cx, hy + 52, zr + 17], 19, 6, "Thatch"), cylinderBetween([cx, -hy - 60, zr + 23], [cx, hy + 60, zr + 23], 9, 6, "BambooDry"));
  const half = (x1 - x0) / 2, eave = W - (55 * 260) / half;
  for (const s of [-1, 1]) {
    g.push(translate(rotateZ(gableWall(s * hy, half, W, 252, "BambooDry"), 90), [cx, 0, 0]));
    for (let x = -150; x <= 150; x += 50) g.push(translate(boxBounds([x - 3, s * hy - 3, W], [x + 3, s * hy + 3, W + 252 * (1 - Math.abs(x) / half) - 6], "WoodDark"), [cx, 0, 0]));
    g.push(translate(rotateZ(barge(s * (hy + 57), half + 55, eave + 16, zr + 24, 90), 90), [cx, 0, 0]));
  }
  // the veranda: a lean-to roof on posts, a rail, steps down at the middle
  g.push(beamBetween([x0 - 10, 0, W - 22], [xv - 50, 0, 296], 2 * hy + 60, 14, "Thatch"));
  for (const y of [-470, -235, 0, 235, 470]) g.push(boxAt([14, 14, 318 - F], [xv + 10, y, F], "WoodDark", 1.5));
  g.push(boxBounds([xv + 2, -hy - 10, 306], [xv + 18, hy + 10, 320], "WoodDark"));
  for (const s of [-1, 1]) {
    g.push(boxBounds([xv - 2, s > 0 ? 60 : -hy, F + 60], [xv + 6, s > 0 ? hy : -60, F + 67], "WoodDark"));
    g.push(boxBounds([xv, s * hy - 4, F + 60], [x0, s * hy + 4, F + 67], "WoodDark"));
    for (let y = 80; y < hy; y += 24) g.push(boxAt([5, 5, 60], [xv + 2, s * y, F], "WoodShade"));
    for (let x = xv + 24; x < x0; x += 24) g.push(boxAt([5, 5, 60], [x, s * hy, F], "WoodShade"));
  }
  for (let i = 0; i < 4; i++) g.push(boxBounds([xv - 30 - i * 30, -60, 0], [xv - i * 30, 60, F - 14 - i * 30], "WoodWarm", 1.5));
  for (const s of [-1, 1]) g.push(beamBetween([xv - 130, s * 64, 0], [xv, s * 64, F], 8, 12, "WoodDark"));
  // veranda life: potted plants, a bench, a fish trap, lanterns; firewood and jars underneath
  for (const y of [-80, 80]) g.push(translate(merge(cylinderAt({ rBot: 14, rTop: 19, height: 30, segments: 8, bottom: [0, 0, 0] }, "Yodia_Clay"), sphereCenter(24, [0, 0, 46], "LeafGreen", 8)), [xv + 30, y, F]));
  g.push(boxAt([44, 160, 8], [x0 - 40, -300, F + 40], "WoodWarm", 1.5), boxAt([40, 8, 40], [x0 - 40, -370, F], "WoodShade"), boxAt([40, 8, 40], [x0 - 40, -230, F], "WoodShade"));
  g.push(translate(merge(cylinderAt({ rBot: 16, rTop: 6, height: 50, segments: 8, bottom: [0, 0, 0] }, "BambooDry"), rope([0, 0, 50], [0, 0, 70], 1)), [xv + 30, 300, 230]));
  g.push(hangLantern([xv + 10, -240, 306], 18), hangLantern([xv + 10, 240, 306], 18));
  for (let i = 0; i < 9; i++) g.push(cylinderBetween([150 + (i % 3) * 16, 300, 9 + Math.floor(i / 3) * 15], [150 + (i % 3) * 16, 420, 9 + Math.floor(i / 3) * 15], 7, 6, "BarkWarm"));
  g.push(translate(jar(64, 24, "Yodia_Clay"), [0, -380, 0]));
  return merge(...g);
}

// a timber warehouse: stone plinth, plank walls on a dark frame, big doors, a loft door with a
// hoist beam and pulley over a loading platform, terracotta roof
function warehouse(): Geo {
  const hx = 430, hy = 340, P = 60, W = 640, zr = W + 320;
  const g: Geo[] = [
    boxBounds([-hx - 10, -hy - 10, 0], [hx + 10, hy + 10, P], "StoneGrey", 3),
    boxBounds([-hx, -hy, P], [hx, hy, W], "WoodWarm"),
  ];
  // frame: corner and bay posts, plates, braces
  for (const x of [-hx, -215, 0, 215, hx]) for (const s of [-1, 1]) g.push(boxAt([20, 20, W - P], [x === -hx ? x + 6 : x === hx ? x - 6 : x, s * (hy + 2), P], "WoodDark", 1.5));
  for (const y of [-165, 165]) g.push(boxAt([20, 20, W - P], [-hx - 2, y, P], "WoodDark", 1.5), boxAt([20, 20, W - P], [hx + 2, y, P], "WoodDark", 1.5));
  for (const z of [P, 420, W - 16]) {
    g.push(boxBounds([-hx - 4, -hy - 6, z], [hx + 4, -hy + 2, z + 16], "WoodDark"), boxBounds([-hx - 4, hy - 2, z], [hx + 4, hy + 6, z + 16], "WoodDark"));
    g.push(boxBounds([hx - 2, -hy, z], [hx + 6, hy, z + 16], "WoodDark"));
    if (z !== P) g.push(boxBounds([-hx - 6, -hy, z], [-hx + 2, hy, z + 16], "WoodDark"));
  }
  for (const s of [-1, 1]) for (const [xa, xb] of [[-hx + 10, -215], [215, hx - 10]]) g.push(beamBetween([xa, s * (hy + 3), P + 16], [xb, s * (hy + 3), 418], 8, 12, "WoodDark"));
  // big double doors, loft door, a sign board
  const leaf = (s: number): Geo => merge(
    boxAt([8, 146, 322], [-hx - 6, s * 75, P], "DoorWood", 1),
    boxAt([4, 140, 14], [-hx - 12, s * 75, P + 30], "WoodDark"), boxAt([4, 140, 14], [-hx - 12, s * 75, P + 280], "WoodDark"),
    beamBetween([-hx - 12, s * 140, P + 40], [-hx - 12, s * 10, P + 284], 4, 12, "WoodDark"),
    boxAt([3, 46, 8], [-hx - 14, s * 124, P + 60], "IronDark"), boxAt([3, 46, 8], [-hx - 14, s * 124, P + 250], "IronDark"),
    translate(rotateY(torus(7, 1.6, 8, 4, "IronDark"), 90), [-hx - 15, s * 18, P + 150]),
  );
  g.push(leaf(-1), leaf(1), boxBounds([-hx - 14, -168, P], [-hx, -148, P + 340], "WoodDark", 1.5), boxBounds([-hx - 14, 148, P], [-hx, 168, P + 340], "WoodDark", 1.5));
  g.push(boxBounds([-hx - 16, -180, P + 322], [-hx, 180, P + 346], "WoodDark", 2));
  g.push(boxAt([6, 230, 44], [-hx - 6, 0, 428], "Yodia_Teal", 1.5), boxAt([7, 238, 4], [-hx - 7, 0, 426], "GoldTrim"), boxAt([7, 238, 4], [-hx - 7, 0, 470], "GoldTrim"));
  g.push(at(door(130, 150), 0, hx, 0, 486), boxAt([46, 170, 8], [-hx - 22, 0, 478], "WoodShade", 1.5));
  // windows: shuttered above, barred below
  for (const s of [-1, 1]) for (const x of [-322, -108, 108, 322]) {
    g.push(at(win(70, 90, { shutter: "WoodShade" }), s < 0 ? 90 : 270, hy, s < 0 ? -x : x, 470));
    if (Math.abs(x) < 200) g.push(at(win(60, 50, { bars: true }), s < 0 ? 90 : 270, hy, s < 0 ? -x : x, 200));
  }
  for (const y of [-200, 200]) g.push(at(win(70, 90, { shutter: "WoodShade" }), 180, hx, -y, 470));
  // terracotta roof, plank gables with barge boards, a round vent at the back
  g.push(roof(2 * hx, 2 * hy, 20, [0, 0, W], 320, 45, "RoofTerracotta", 3), cylinderBetween([-hx - 50, 0, zr + 16], [hx + 50, 0, zr + 16], 14, 6, "RoofTerracotta"));
  const eave = W - (45 * 320) / hy;
  for (const x of [-hx, hx]) g.push(gableWall(x + (x < 0 ? -2 : 2), hy, W, 312, "WoodWarm"));
  g.push(barge(-hx - 47, hy + 45, eave + 18, zr + 26, 26), barge(hx + 47, hy + 45, eave + 18, zr + 26, 26));
  g.push(translate(rotateY(torus(34, 6, 12, 4, "WoodDark"), 90), [hx + 4, 0, 790]), translate(rotateY(cylinderAt({ radius: 30, height: 3, segments: 12, bottom: [0, 0, 0] }, "GlassBlue"), 90), [hx + 1, 0, 790]));
  // hoist beam under a little hood, pulley, ropes and a hanging crate
  g.push(boxBounds([-hx - 175, -12, 836], [-hx + 30, 12, 866], "WoodDark", 2), beamBetween([-hx - 2, 0, 740], [-hx - 110, 0, 834], 10, 12, "WoodDark"));
  g.push(roof(180, 54, 6, [-hx - 90, 0, 872], 28, 10, "RoofTerracotta"));
  const px = -hx - 150;
  g.push(translate(rotateX(torus(14, 4, 10, 4, "WoodShade"), 90), [px, 0, 812]), boxAt([34, 3, 40], [px, 8, 800], "IronDark"), boxAt([34, 3, 40], [px, -8, 800], "IronDark"));
  g.push(rope([px - 14, 0, 812], [px - 14, 0, 330], 2), rope([px + 14, 0, 812], [-hx - 8, 0, 600], 2));
  g.push(translate(rotateX(torus(8, 2.4, 8, 4, "IronDark"), 90), [px - 14, 0, 322]));
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.push(rope([px - 14, 0, 314], [px - 14 + sx * 24, sy * 24, 240], 1.3));
  g.push(translate(crate(56), [px - 14, 0, 184]));
  // loading platform and ramp at the doors, a crate and a barrel waiting
  g.push(boxBounds([-hx - 110, -210, 0], [-hx, 210, P], "WoodGrey", 2), beamBetween([-hx - 220, 0, 4], [-hx - 108, 0, P - 4], 170, 8, "WoodGrey"));
  for (const y of [-205, 205]) g.push(boxAt([14, 14, P + 4], [-hx - 104, y, 0], "WoodDark", 1.5));
  g.push(translate(crate(60), [-hx - 60, 160, P]), translate(barrel(80, 30), [-hx - 60, -165, P]));
  return translate(merge(...g), [95, 0, 0]);
}

// the customs house: brick ground floor, yellow plaster above, a projecting bay with a balcony,
// a clock in its pediment, terracotta roofs, a flag on the ridge
function customsHouse(): Geo {
  const hx = 400, hy = 500, bx = -520, by = 230, P = 50, F1 = 380, F2 = 700, C = 725;
  const g: Geo[] = [
    boxBounds([-hx - 10, -hy - 10, 0], [hx + 10, hy + 10, P], "StoneGrey", 3),
    boxBounds([bx - 10, -by - 10, 0], [-hx, by + 10, P], "StoneGrey", 3),
    boxBounds([-hx, -hy, P], [hx, hy, F1], "BrickRed"), boxBounds([bx, -by, P], [-hx, by, F1], "BrickRed"),
    boxBounds([-hx - 8, -hy - 8, F1], [hx + 8, hy + 8, F1 + 20], "StoneWhite", 2), boxBounds([bx - 8, -by - 8, F1], [-hx, by + 8, F1 + 20], "StoneWhite", 2),
    boxBounds([-hx, -hy, F1 + 20], [hx, hy, F2], "Yodia_Ochre"), boxBounds([bx, -by, F1 + 20], [-hx, by, F2], "Yodia_Ochre"),
    boxBounds([-hx - 12, -hy - 12, F2], [hx + 12, hy + 12, C], "StoneWhite", 3), boxBounds([bx - 12, -by - 12, F2], [-hx, by + 12, C], "StoneWhite", 3),
  ];
  // quoins up every corner
  const quoins = (x: number, y: number, sx: number, sy: number): Geo => {
    const q: Geo[] = [];
    for (let z = P, i = 0; z < F2 - 30; z += 50, i++) {
      const a = i % 2 ? 46 : 28, b = i % 2 ? 28 : 46;
      q.push(boxBounds([Math.min(x - sx * 4, x + sx * a), Math.min(y - sy * 4, y + sy * b), z], [Math.max(x - sx * 4, x + sx * a), Math.max(y - sy * 4, y + sy * b), z + 42], "StoneWhite"));
    }
    return merge(...q);
  };
  g.push(quoins(-hx, -hy, 1, 1), quoins(-hx, hy, 1, -1), quoins(hx, -hy, -1, 1), quoins(hx, hy, -1, -1), quoins(bx, -by, 1, 1), quoins(bx, by, 1, -1));
  // roofs: the main one (ridge along Y) and the bay's cross gable
  const zr = C + 300;
  g.push(rotateZ(roof(2 * hy, 2 * hx, 20, [0, 0, C], 300, 50, "RoofTerracotta", 3), 90), cylinderBetween([0, -hy - 60, zr + 15], [0, hy + 60, zr + 15], 13, 6, "RoofTerracotta"));
  for (const s of [-1, 1]) {
    g.push(rotateZ(gableWall(s * hy, hx, C, 290, "Yodia_Ochre"), 90));
    g.push(translate(rotateZ(rotateY(torus(40, 7, 14, 4, "StoneWhite"), 90), s * 90), [0, s * (hy + 2), C + 110]));
    g.push(translate(rotateZ(rotateY(cylinderAt({ radius: 36, height: 3, segments: 12, bottom: [0, 0, 0] }, "GlassBlue"), 90), s * 90), [0, s * (hy + 1), C + 110]));
  }
  g.push(roof(460, 2 * by, 18, [-290, 0, C], 200, 30, "RoofTerracotta", 3), cylinderBetween([bx - 34, 0, C + 214], [-60, 0, C + 214], 12, 6, "RoofTerracotta"));
  g.push(gableWall(bx, by, C, 192, "Yodia_Ochre"), barge(bx - 6, by + 18, C - 8, C + 200, 12, "StoneWhite", 16));
  // the clock
  const cz = C + 82, cxf = bx - 4;
  g.push(translate(rotateY(cylinderAt({ radius: 54, height: 6, segments: 16, bottom: [0, 0, 0] }, "StoneWhite"), -90), [cxf, 0, cz]));
  g.push(translate(rotateY(torus(55, 5, 16, 4, "GoldTrim"), 90), [cxf - 6, 0, cz]));
  for (let i = 0; i < 12; i++) {
    const a = (i * 30) / D;
    g.push(boxAt([3, i % 3 ? 4 : 7, i % 3 ? 6 : 10], [cxf - 7, Math.cos(a) * 44, cz + Math.sin(a) * 44 - (i % 3 ? 3 : 5)], "LacquerBlack"));
  }
  g.push(beamBetween([cxf - 9, 0, cz], [cxf - 9, 14, cz + 26], 3, 5, "LacquerBlack"), beamBetween([cxf - 9, 0, cz], [cxf - 9, -36, cz + 6], 3, 4, "LacquerBlack"), sphereCenter(5, [cxf - 10, 0, cz], "GoldTrim", 6));
  // entrance: double doors, a sign, lamps, steps
  g.push(at(door(150, 250, { double: true, leaf: "Yodia_Teal" }), 0, -bx, 0, P));
  g.push(boxAt([6, 210, 42], [bx - 8, 0, P + 280], "Yodia_Teal", 1.5), boxAt([7, 218, 4], [bx - 9, 0, P + 278], "GoldTrim"), boxAt([7, 218, 4], [bx - 9, 0, P + 320], "GoldTrim"));
  for (const s of [-1, 1]) g.push(beamBetween([bx, s * 120, 260], [bx - 30, s * 120, 268], 4, 4, "IronDark"), hangLantern([bx - 30, s * 120, 268], 4, 9, 20));
  for (let i = 0; i < 2; i++) g.push(boxBounds([bx - 10 - 32 * (i + 1), -140, 0], [bx - 10, 140, P - 17 * (i + 1)], "StoneGrey", 2));
  // balcony on the bay with a balustrade and brackets
  g.push(boxBounds([bx - 80, -200, F1 + 12], [bx, 200, F1 + 28], "StoneWhite", 2));
  for (const y of [-160, 0, 160]) g.push(beamBetween([bx, y, F1 - 40], [bx - 70, y, F1 + 12], 12, 14, "StoneWhite"));
  for (let y = -190; y <= 190; y += 19) g.push(cylinderAt({ rBot: 4, rTop: 3, height: 52, segments: 6, bottom: [bx - 74, y, F1 + 28] }, "StoneWhite"));
  for (const s of [-1, 1]) for (let x = bx - 55; x < bx; x += 19) g.push(cylinderAt({ rBot: 4, rTop: 3, height: 52, segments: 6, bottom: [x, s * 196, F1 + 28] }, "StoneWhite"));
  g.push(boxBounds([bx - 80, -200, F1 + 80], [bx - 66, 200, F1 + 90], "StoneWhite", 1.5));
  for (const s of [-1, 1]) g.push(boxBounds([bx - 80, s > 0 ? 190 : -200, F1 + 80], [bx, s > 0 ? 200 : -190, F1 + 90], "StoneWhite", 1.5));
  g.push(at(win(100, 230, { frame: "StoneWhite", shutter: "Yodia_Teal" }), 0, -bx, 0, F1 + 32));
  // windows: arched-key ones below, shuttered ones above
  const lower = (): Geo => win(80, 170, { frame: "StoneWhite", key: true });
  const upper = (): Geo => win(80, 170, { frame: "StoneWhite", shutter: "Yodia_Teal", key: true });
  for (const y of [-370, 370]) g.push(at(lower(), 0, hx, y, P + 70), at(upper(), 0, hx, y, F1 + 70));
  for (const y of [-330, -110, 110, 330]) g.push(at(lower(), 180, hx, y, P + 70), at(upper(), 180, hx, y, F1 + 70));
  for (const hd of [90, 270]) for (const x of [-250, 0, 250]) g.push(at(lower(), hd, hy, x, P + 70), at(upper(), hd, hy, x, F1 + 70));
  // chimneys and the flag
  for (const y of [-300, 300]) g.push(boxAt([60, 60, 240], [200, y, 900], "BrickRed", 2), boxAt([74, 74, 12], [200, y, 1140], "StoneWhite", 2));
  g.push(cylinderBetween([0, 0, zr + 20], [0, 0, zr + 440], 5, 8, "WoodWarm"), sphereCenter(8, [0, 0, zr + 446], "GoldTrim", 8));
  g.push(sheet([0, 4, zr + 330], [0, 150, zr + 326], [0, 4, zr + 380], [0, 150, zr + 376], [-14, 0, 0], "FabricRed", 6, 2));
  g.push(sheet([0, 4, zr + 380], [0, 150, zr + 376], [0, 4, zr + 430], [0, 150, zr + 426], [-14, 0, 0], "FabricGold", 6, 2));
  return translate(merge(...g), [70, 0, 0]);
}

// the lighthouse: a red-and-white tower on a rocky stone base (deep enough to stand in the sea),
// a gallery and a glowing lantern room under a copper cap; the keeper's cottage behind
function lighthouse(): Geo {
  const g: Geo[] = [
    cylinderAt({ radius: 360, height: 260, segments: 8, bottom: [0, 0, -200] }, "StoneGrey"),
    cylinderAt({ rBot: 330, rTop: 318, height: 40, segments: 8, bottom: [0, 0, 60] }, "StoneLight"),
  ];
  for (let i = 0; i < 7; i++) {
    const a = i * 51 + 20, r = 350 + (i % 3) * 25;
    g.push(translate(rock([150 + (i % 2) * 60, 120, 90 + (i % 3) * 30], 0.4, 11 + i, i % 2 ? "MossStone" : "StoneGrey"), [Math.cos(a / D) * r, Math.sin(a / D) * r, -40]));
  }
  // tower in bands (a flat face toward -X)
  const z0 = 100, H = 1500, rb = 230, rt = 162, nb = 6;
  const rAt = (z: number) => rb + ((rt - rb) * (z - z0)) / H;
  const tower: Geo[] = [];
  for (let i = 0; i < nb; i++) {
    const za = z0 + (H * i) / nb;
    tower.push(cylinderAt({ rBot: rAt(za), rTop: rAt(za + H / nb), height: H / nb, segments: 12, bottom: [0, 0, za] }, i % 2 ? "Yodia_RedPaint" : "StoneWhite"));
  }
  g.push(rotateZ(merge(...tower), 15));
  const k = Math.cos(15 / D);
  for (const [z, hd] of [[520, 0], [860, 60], [1220, 0], [700, 240], [1060, 180]] as const) g.push(at(win(44, 70, { frame: "StoneGrey" }), hd, rAt(z) * k, 0, z));
  // entrance porch
  g.push(boxBounds([-300, -100, 100], [-200, 100, 380], "StoneWhite"), roof(130, 200, 14, [-260, 0, 380], 70, 16, "RoofTerracotta", 2));
  g.push(gableWall(-302, 100, 380, 64, "StoneWhite"), at(door(90, 210), 0, 300, 0, 100), boxBounds([-340, -90, 60], [-300, 90, 100], "StoneLight", 2));
  // gallery: corbels, platform, rail
  const zg = z0 + H;
  for (let i = 0; i < 12; i++) g.push(rotateZ(boxAt([44, 22, 44], [rt + 14, 0, zg - 44], "StoneGrey", 2), i * 30));
  g.push(cylinderAt({ radius: 236, height: 24, segments: 12, bottom: [0, 0, zg] }, "StoneGrey"));
  for (let i = 0; i < 16; i++) g.push(rotateZ(boxAt([5, 5, 76], [226, 0, zg + 24], "IronDark"), i * 22.5));
  g.push(translate(torus(226, 3, 24, 4, "IronDark"), [0, 0, zg + 100]), translate(torus(226, 2, 24, 4, "IronDark"), [0, 0, zg + 64]));
  // lantern room and copper cap
  g.push(cylinderAt({ radius: 140, height: 60, segments: 8, bottom: [0, 0, zg + 24] }, "Yodia_RedPaint"));
  g.push(cylinderAt({ radius: 126, height: 170, segments: 8, bottom: [0, 0, zg + 84] }, "LanternGlow"));
  for (let i = 0; i < 8; i++) g.push(rotateZ(boxAt([10, 10, 170], [127, 0, zg + 84], "IronDark"), i * 45));
  g.push(translate(torus(127, 3, 16, 4, "IronDark"), [0, 0, zg + 168]));
  g.push(cylinderAt({ radius: 150, height: 14, segments: 8, bottom: [0, 0, zg + 254] }, "IronDark"));
  g.push(cylinderAt({ rBot: 150, rTop: 112, height: 60, segments: 8, bottom: [0, 0, zg + 268] }, "CopperGreen"));
  g.push(cylinderAt({ rBot: 112, rTop: 24, height: 86, segments: 8, bottom: [0, 0, zg + 328] }, "CopperGreen"));
  g.push(sphereCenter(24, [0, 0, zg + 426], "GoldTrim", 10), cylinderBetween([0, 0, zg + 440], [0, 0, zg + 540], 3, 6, "IronDark"));
  g.push(boxAt([70, 3, 10], [6, 0, zg + 500], "GoldTrim"), translate(rotateY(cylinderAt({ rBot: 10, rTop: 0.5, height: 22, segments: 4, bottom: [0, 0, 0] }, "GoldTrim"), -90), [-30, 0, zg + 505]));
  // the keeper's cottage
  const cx0 = 190, cx1 = 620, cy = 200, cw = 330;
  g.push(boxBounds([cx0, -cy - 10, -40], [cx1 + 10, cy + 10, 60], "StoneGrey", 3), boxBounds([cx0, -cy, 60], [cx1, cy, cw], "PlasterCream"));
  g.push(roof(cx1 - cx0, 2 * cy, 16, [(cx0 + cx1) / 2, 0, cw], 180, 35, "RoofTerracotta", 3), cylinderBetween([cx0, 0, cw + 192], [cx1 + 40, 0, cw + 192], 11, 6, "RoofTerracotta"));
  g.push(gableWall(cx1 + 1, cy, cw, 172, "PlasterCream"), barge(cx1 + 38, cy + 35, cw - 32, cw + 196, 14, "WoodDark", 14));
  for (const hd of [90, 270]) for (const x of [320, 500]) g.push(at(win(60, 80, { shutter: "Yodia_Teal" }), hd, cy, hd === 90 ? -x : x, 150));
  g.push(at(win(60, 80, { shutter: "Yodia_Teal" }), 180, cx1, 0, 150), at(door(84, 200), 90, cy, -410, 60));
  g.push(boxAt([50, 50, 150], [540, 110, 440], "StoneGrey", 2));
  return translate(merge(...g), [-130, 0, 0]);
}

// ---------- market ----------
function fishStall(): Geo {
  const g: Geo[] = [
    boxAt([120, 240, 8], [0, 0, 78], "WoodWarm", 2), boxAt([6, 236, 50], [-56, 0, 30], "WoodShade", 1),
    boxAt([104, 222, 8], [0, 0, 86], "Yodia_Ice", 3),
  ];
  for (const [x, y] of [[-52, -112], [52, -112], [-52, 112], [52, 112]]) g.push(boxAt([8, 8, 78], [x, y, 0], "WoodDark", 1));
  // fish laid out on the ice, a big one across the front
  const kinds = ["Yodia_Fish", "Yodia_Snapper", "Yodia_Fish"];
  for (let i = 0; i < 9; i++) {
    const row = i % 3, col = Math.floor(i / 3);
    g.push(translate(rotateZ(fish(44, kinds[(i + col) % 3]), 80 + ((i * 23) % 20)), [-28 + row * 26, -80 + col * 50, 94]));
  }
  g.push(translate(rotateZ(fish(84, "Yodia_Fish"), 92), [-30, 74, 94]), translate(rotateZ(fish(70, "Yodia_Snapper"), 85), [20, 78, 94]));
  // the canopy: bamboo poles, a striped awning sloping to the front, flaps
  for (const [x, y, h] of [[-78, -132, 206], [-78, 132, 206], [78, -132, 246], [78, 132, 246]]) g.push(cylinderBetween([x, y, 0], [x, y, h], 4, 7, "Bamboo"));
  for (let i = 0; i < 10; i++) {
    const y = -135 + 30 * i;
    g.push(beamBetween([96, y, 250], [-104, y, 200], 30, 3, i % 2 ? "FabricWhite" : "FabricBlue"));
    g.push(boxAt([2, 30, 24], [-105, y, 177], i % 2 ? "FabricWhite" : "FabricBlue"));
  }
  // dried fish on a line between the front poles, a hanging scale
  g.push(rope([-78, -132, 186], [-78, 132, 186], 0.8));
  for (let i = 0; i < 5; i++) g.push(translate(rotateY(fish(30, "Yodia_Snapper"), 90), [-78, -84 + i * 42, 168]));
  g.push(rope([20, 0, 238], [20, 0, 175], 0.8), boxAt([4, 70, 4], [20, 0, 172], "Bronze"));
  for (const s of [-1, 1]) g.push(rope([20, s * 34, 172], [20, s * 34, 150], 0.6), cylinderAt({ rBot: 9, rTop: 13, height: 4, segments: 8, bottom: [20, s * 34, 146] }, "Bronze"));
  // baskets of shrimp and crabs, a tub, a stool for the seller
  const shrimp = (n: number): Geo => merge(...Array.from({ length: n }, (_, i) => sphereCenter(5, [Math.cos(i * 2.4) * (4 + i * 1.6), Math.sin(i * 2.4) * (4 + i * 1.6), 0], "Yodia_Mango", 6)));
  g.push(translate(basket(26, 26), [-110, -70, 0]), translate(shrimp(9), [-110, -70, 26]));
  g.push(translate(basket(24, 22), [-112, 60, 0]), translate(merge(sphereCenter(9, [0, 0, 0], "FabricRed", 8), sphereCenter(9, [10, 9, 3], "FabricRed", 8), sphereCenter(9, [-8, 8, 2], "FabricRed", 8)), [-112, 60, 24]));
  g.push(cylinderAt({ rBot: 26, rTop: 30, height: 34, segments: 10, bottom: [96, -80, 0] }, "WoodWarm"), cylinderAt({ radius: 27, height: 2, segments: 10, bottom: [96, -80, 30] }, "WaterDark"));
  g.push(boxAt([34, 34, 6], [100, 60, 40], "WoodWarm", 1.5), array(boxAt([5, 5, 40], [86, 46, 0], "WoodDark"), 2, [28, 0, 0]), array(boxAt([5, 5, 40], [86, 74, 0], "WoodDark"), 2, [28, 0, 0]));
  return merge(...g);
}

function bananas(): Geo {
  const g: Geo[] = [cylinderBetween([0, 0, -6], [0, 0, 30], 3, 5, "LeafGreen")];
  for (let row = 0; row < 2; row++)
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 + row * 30) / D, z = 4 + row * 11;
      g.push(cylinderBetween([Math.cos(a) * 4, Math.sin(a) * 4, z], [Math.cos(a) * 15, Math.sin(a) * 15, z + 15], 3.4, 5, "Yodia_Banana", 1.8));
    }
  return merge(...g);
}
function pineapple(): Geo {
  return merge(
    cylinderAt({ rBot: 8, rTop: 9, height: 20, segments: 6, bottom: [0, 0, 0] }, "Yodia_Pineapple"),
    cylinderAt({ rBot: 9, rTop: 4, height: 5, segments: 6, bottom: [0, 0, 20] }, "Yodia_Pineapple"),
    cylinderAt({ rBot: 6, rTop: 0.5, height: 18, segments: 5, bottom: [0, 0, 24] }, "LeafGreen"),
  );
}
function fruitStall(): Geo {
  const g: Geo[] = [
    boxAt([110, 260, 8], [0, 0, 70], "WoodWarm", 2), boxAt([46, 256, 26], [32, 0, 78], "WoodWarm", 2),
    boxAt([6, 256, 44], [-52, 0, 26], "WoodShade", 1),
  ];
  for (const [x, y] of [[-48, -122], [48, -122], [-48, 122], [48, 122]]) g.push(boxAt([8, 8, 70], [x, y, 0], "WoodDark", 1));
  for (const [x, y, a] of [[-20, -80, 8], [-24, 10, -6], [-18, 92, 12], [32, -60, -4], [30, 60, 6]]) g.push(rotateZ(boxAt([48, 72, 1], [x, y, x > 0 ? 104 : 78], "Yodia_Leaf"), a, [x, y, 0]));
  // coconuts in a pyramid, mangoes, pineapples, bananas on the back shelf
  for (const [x, y, z, m] of [[-30, -100, 0, 0], [-30, -74, 0, 0], [-8, -100, 0, 1], [-8, -74, 0, 0], [-19, -87, 20, 0], [-30, -48, 0, 1]] as const) g.push(sphereCenter(13, [x, y, 92 + z], m ? "BarkPalm" : "Yodia_Coconut", 8));
  for (let i = 0; i < 9; i++) g.push(translate(scale(sphereCenter(1, [0, 0, 0], i % 4 ? "Yodia_Mango" : "Yodia_Coconut", 6), [9, 7, 7]), [-34 + (i % 3) * 16, -6 + Math.floor(i / 3) * 15, 85]));
  for (const [x, y] of [[-30, 70], [-10, 86], [-30, 102], [-12, 112]]) g.push(translate(pineapple(), [x, y, 79]));
  for (const y of [-80, 0, 80]) g.push(translate(rotateY(bananas(), 60), [32, y, 112]));
  // thatch lean-to on bamboo poles, bananas hanging from the front beam
  for (const [x, y, h] of [[-80, -140, 210], [-80, 140, 210], [80, -140, 252], [80, 140, 252]]) g.push(cylinderBetween([x, y, 0], [x, y, h], 4, 7, "Bamboo"));
  g.push(beamBetween([100, 0, 254], [-112, 0, 204], 330, 12, "Thatch"));
  g.push(cylinderBetween([-80, -150, 204], [-80, 150, 204], 4, 6, "Bamboo"), cylinderBetween([80, -150, 248], [80, 150, 248], 4, 6, "Bamboo"));
  for (const y of [-60, 60]) g.push(rope([-80, y, 202], [-80, y, 182], 0.8), translate(bananas(), [-80, y, 150]));
  // baskets on the ground
  g.push(translate(basket(24, 22), [-108, -50, 0]), sphereCenter(12, [-108, -50, 26], "Yodia_Coconut", 8), sphereCenter(12, [-100, -40, 30], "Yodia_Coconut", 8));
  g.push(translate(basket(22, 20), [-104, 70, 0]), translate(merge(...[0, 1, 2, 3].map((i) => translate(scale(sphereCenter(1, [0, 0, 0], "Yodia_Mango", 6), [9, 7, 7]), [Math.cos(i * 1.6) * 8, Math.sin(i * 1.6) * 8, 0]))), [-104, 70, 24]));
  return merge(...g);
}

// ---------- town edge ----------
// a log palisade, 6 m along Y (tiles end to end); rails and props on the town side (+X)
function palisade(): Geo {
  const g: Geo[] = [];
  for (let i = 0; i < 20; i++) g.push(stake(((i * 3) % 5) - 2, -285 + i * 30, 300 + ((i * 7) % 4) * 14, 15));
  for (const z of [70, 230]) g.push(boxBounds([14, -300, z], [32, 300, z + 20], "WoodDark"));
  for (const y of [-180, 180]) g.push(cylinderBetween([170, y, 0], [30, y, 236], 10, 8, "BarkWarm"), boxAt([30, 30, 10], [170, y, 0], "StoneGrey", 2));
  for (let i = 0; i < 20; i += 3) g.push(boxAt([6, 32, 8], [16, -285 + i * 30, 76], "RopeTan"), boxAt([6, 32, 8], [16, -285 + i * 30, 236], "RopeTan"));
  g.push(translate(rock([60, 50, 30], 0.4, 4, "MossStone"), [-30, -120, -4]), translate(rock([50, 40, 24], 0.4, 9, "MossStone"), [-28, 170, -4]));
  return merge(...g);
}

// the palisade gate: two log watchtowers with thatch roofs, a walkway, open log doors; 6 m along Y
function palisadeGate(): Geo {
  const g: Geo[] = [], yc = 215, half = 85;
  for (const s of [-1, 1]) {
    const y = s * yc;
    for (const dx of [-62, 62]) for (const dy of [-62, 62]) g.push(cylinderAt({ radius: 13, height: 560, segments: 8, bottom: [dx, y + dy, 0] }, "BarkWarm"));
    for (let k = -2; k <= 2; k++) {
      g.push(stake(-74, y + k * 25, 300, 12), stake(74, y + k * 25, 300, 12));
      g.push(stake(k * 25, y + s * 74, 300, 12));
      if (Math.abs(k) < 2) g.push(stake(k * 25, y - s * 74, 300, 12));
    }
    g.push(boxBounds([-half, y - half, 320], [half, y + half, 336], "WoodWarm", 2));
    for (const z of [370, 404]) {
      g.push(boxBounds([-half, y - half, z], [-half + 8, y + half, z + 8], "WoodDark"), boxBounds([half - 8, y - half, z], [half, y + half, z + 8], "WoodDark"));
      g.push(boxBounds([-half, y + s * half - 4, z], [half, y + s * half + 4, z + 8], "WoodDark"));
    }
    g.push(translate(rotateZ(cylinderAt({ rBot: 150, rTop: 6, height: 150, segments: 4, bottom: [0, 0, 540] }, "Thatch"), 45), [0, y, 0]));
    g.push(translate(rotateZ(cylinderAt({ rBot: 112, rTop: 104, height: 10, segments: 4, bottom: [0, 0, 530] }, "WoodDark"), 45), [0, y, 0]));
    g.push(sphereCenter(9, [0, y, 694], "WoodDark", 8));
    // torches on the front of each tower
    g.push(beamBetween([-86, y - s * 40, 250], [-112, y - s * 40, 268], 5, 5, "IronDark"), cylinderAt({ rBot: 6, rTop: 10, height: 16, segments: 6, bottom: [-114, y - s * 40, 266] }, "IronDark"));
    g.push(cylinderAt({ rBot: 8, rTop: 0.5, height: 26, segments: 6, bottom: [-114, y - s * 40, 280] }, "FireGlow"), sphereCenter(7, [-114, y - s * 40, 284], "FireGlow", 6));
  }
  // walkway over the gateway, its rails, lintel, sign
  g.push(boxBounds([-half, -yc + half, 320], [half, yc - half, 336], "WoodWarm", 2));
  for (const x of [-80, 80]) g.push(boxBounds([x - 10, -yc, 296], [x + 10, yc, 320], "WoodDark", 1.5), boxBounds([x - 4, -yc + half, 380], [x + 4, yc - half, 388], "WoodDark"));
  for (const x of [-80, 80]) for (let y = -110; y <= 110; y += 22) g.push(boxAt([5, 5, 48], [x, y, 336], "WoodShade"));
  g.push(boxAt([8, 190, 56], [-96, 0, 226], "WoodRed", 2), boxAt([9, 198, 5], [-97, 0, 224], "GoldTrim"), boxAt([9, 198, 5], [-97, 0, 279], "GoldTrim"));
  for (const s of [-1, 1]) g.push(rope([-92, s * 80, 282], [-92, s * 80, 296], 1));
  // the doors: log leaves on hinges at the towers, swung open inward
  for (const s of [-1, 1]) {
    const leaf: Geo[] = [];
    for (let i = 0; i < 5; i++) leaf.push(stake(-60, s * (12 + i * 24), 270, 11));
    leaf.push(boxBounds([-48, s > 0 ? 4 : -128, 50], [-40, s > 0 ? 128 : -4, 70], "WoodDark"), boxBounds([-48, s > 0 ? 4 : -128, 220], [-40, s > 0 ? 128 : -4, 240], "WoodDark"));
    leaf.push(beamBetween([-44, s * 120, 64], [-44, s * 10, 226], 6, 12, "WoodDark"));
    g.push(rotateZ(merge(...leaf), s * 72, [-60, s * (yc - half), 0]));
  }
  return merge(...g);
}

// a carved guardian post: three stacked faces, a hornbill with spread wings on top, the
// three-coloured cloth tied round its foot
function guardianPost(): Geo {
  const g: Geo[] = [
    boxAt([96, 96, 26], [0, 0, 0], "StoneGrey", 4),
    cylinderAt({ rBot: 28, rTop: 25, height: 340, segments: 8, bottom: [0, 0, 26] }, "WoodDark"),
  ];
  ["FabricRed", "FabricGold", "FabricGreen"].forEach((m, i) => g.push(cylinderAt({ radius: 30, height: 7, segments: 8, bottom: [0, 0, 44 + i * 7] }, m)));
  g.push(rotateY(boxAt([2, 10, 46], [-31, 6, 18], "FabricRed"), 8, [-31, 6, 60]), rotateY(boxAt([2, 10, 40], [-31, -6, 22], "FabricGold"), -6, [-31, -6, 60]));
  const feat = (z: number, w: number): Geo => {
    const x = -w;
    const eye = (s: number): Geo => merge(
      translate(rotateY(cylinderAt({ radius: 10, height: 5, segments: 8, bottom: [0, 0, 0] }, "StoneWhite"), -90), [x, s * w * 0.45, z + 46]),
      translate(rotateY(cylinderAt({ radius: 4.5, height: 2.5, segments: 6, bottom: [0, 0, 0] }, "LacquerBlack"), -90), [x - 5, s * w * 0.45, z + 46]),
    );
    return merge(
      boxAt([10, 2 * w + 6, 9], [x - 3, 0, z + 58], "WoodDark", 2), eye(-1), eye(1),
      boxAt([12, 14, 22], [x - 4, 0, z + 22], "WoodDark", 2),
      boxAt([5, w * 1.2, 12], [x - 1, 0, z + 6], "LacquerRed"),
      boxAt([4, 6, 7], [x - 3, -9, z + 8], "StoneWhite"), boxAt([4, 6, 7], [x - 3, 9, z + 8], "StoneWhite"),
    );
  };
  const tiers: [number, string][] = [[90, "WoodWarm"], [176, "WoodRed"], [262, "WoodWarm"]];
  for (const [z, m] of tiers) {
    const w = 33;
    g.push(boxAt([2 * w, 2 * w, 76], [0, 0, z], m, 3), feat(z, w), rotateZ(feat(z, w), 180));
    for (const s of [-1, 1]) g.push(boxAt([24, 10, 30], [0, s * (w + 4), z + 26], m, 2));
    g.push(boxAt([2 * w + 8, 2 * w + 8, 8], [0, 0, z + 76], "GoldTrim", 1.5));
  }
  // the hornbill
  g.push(boxAt([62, 48, 50], [0, 0, 346], "WoodRed", 3), boxAt([40, 16, 18], [0, 0, 396], "GoldTrim", 2));
  g.push(translate(rotateY(cylinderAt({ rBot: 13, rTop: 1, height: 56, segments: 4, bottom: [0, 0, 0] }, "GoldTrim"), -90), [-30, 0, 372]));
  for (const s of [-1, 1]) {
    g.push(translate(rotateY(cylinderAt({ radius: 6, height: 3, segments: 6, bottom: [0, 0, 0] }, "StoneWhite"), -90), [-31, s * 14, 380]));
    g.push(beamBetween([0, s * 22, 362], [0, s * 120, 420], 7, 40, "WoodRed"), beamBetween([0, s * 100, 412], [0, s * 132, 444], 8, 14, "GoldTrim"));
  }
  return merge(...g);
}

// ---------- lights ----------
function tikiTorch(): Geo {
  return merge(
    translate(rock([40, 36, 20], 0.4, 5, "StoneGrey"), [8, 4, -4]), translate(rock([30, 26, 16], 0.4, 8, "MossStone"), [-12, -8, -4]),
    cylinderBetween([0, 0, 0], [0, 0, 214], 5, 7, "Bamboo"),
    translate(torus(6, 1.6, 8, 4, "RopeTan"), [0, 0, 150]), translate(torus(6, 1.6, 8, 4, "RopeTan"), [0, 0, 196]),
    cylinderAt({ rBot: 9, rTop: 15, height: 30, segments: 8, bottom: [0, 0, 204] }, "BambooDry"),
    translate(torus(15, 2, 8, 4, "WoodShade"), [0, 0, 234]),
    cylinderAt({ rBot: 12, rTop: 0.5, height: 42, segments: 7, bottom: [0, 0, 232] }, "FireGlow"),
    sphereCenter(10, [0, 0, 240], "FireGlow", 8),
    cylinderAt({ rBot: 6, rTop: 0.5, height: 22, segments: 6, bottom: [6, 4, 246] }, "FireGlow"),
  );
}

function harbourLamp(): Geo {
  const g: Geo[] = [
    boxAt([46, 46, 28], [0, 0, 0], "StoneGrey", 3),
    boxAt([18, 18, 300], [0, 0, 28], "WoodDark", 2),
    boxAt([24, 24, 8], [0, 0, 110], "IronDark", 1), boxAt([24, 24, 8], [0, 0, 300], "IronDark", 1),
    boxAt([26, 26, 10], [0, 0, 328], "WoodDark", 2),
    rotateZ(cylinderAt({ rBot: 20, rTop: 2, height: 18, segments: 4, bottom: [0, 0, 338] }, "IronDark"), 45),
  ];
  for (const s of [-1, 1]) {
    g.push(beamBetween([0, s * 9, 304], [0, s * 74, 304], 6, 8, "IronDark"), beamBetween([0, s * 9, 262], [0, s * 50, 304], 4, 5, "IronDark"));
    g.push(translate(rotateZ(rotateY(torus(8, 1.5, 8, 4, "IronDark"), 90), 90), [0, s * 30, 290]));
    g.push(hangLantern([0, s * 66, 304], 6, 10, 26));
  }
  // a life ring and a coil of rope on the post
  for (let i = 0; i < 8; i++) {
    const a0 = (i * 45) / D, a1 = ((i + 1) * 45) / D;
    g.push(cylinderBetween([-15, Math.cos(a0) * 24, 160 + Math.sin(a0) * 24], [-15, Math.cos(a1) * 24, 160 + Math.sin(a1) * 24], 5.5, 6, i % 2 ? "FabricRed" : "FabricWhite"));
  }
  g.push(translate(rotateY(coil(16, 2), 90), [14, 0, 150]), boxAt([14, 6, 6], [-12, 0, 186], "IronDark"));
  return merge(...g);
}

// ---------- ground ----------
// planks across a path, 4 m along Y (tiles end to end), 1.6 m wide, about 8 cm high
function plankPath(): Geo {
  const g: Geo[] = [boxBounds([-62, -200, 0], [-50, 200, 4], "WoodDark"), boxBounds([50, -200, 0], [62, 200, 4], "WoodDark")];
  const mats = ["WoodWarm", "WoodShade", "WoodGrey", "WoodWarm"];
  for (let i = 0; i < 16; i++) {
    const y = -200 + 25 * (i + 0.5), len = 150 + ((i * 7) % 4) * 5;
    g.push(rotateZ(boxAt([len, 21, 4], [((i * 5) % 3 - 1) * 4, y, 3.5], mats[(i * 3) % 4], 1), ((i * 11) % 5) - 2, [0, y, 0]));
  }
  return merge(...g);
}
// a 4 m square of quay paving: cobbles inside a frame of kerb stones (tiles both ways)
function quayPaving(): Geo {
  return merge(
    boxBounds([-185, -185, 0], [185, 185, 5], "Cobble"),
    boxBounds([-200, -200, 0], [200, -185, 6], "StoneLight", 1), boxBounds([-200, 185, 0], [200, 200, 6], "StoneLight", 1),
    boxBounds([-200, -185, 0], [-185, 185, 6], "StoneLight", 1), boxBounds([185, -185, 0], [200, 185, 6], "StoneLight", 1),
  );
}

// ---------- the sample: the harbour front ----------
function sample(put: Put): void {
  const here = (g: Geo): void => put(solid(g), [0, 0, 0]);
  // the waterfront along the sea (-Y): a stone wharf with steps and a pier, the ship moored
  for (const x of [-1800, -1000, -200, 600, 1800]) put("wharf", [x, -2250, 0], 90);
  put("dock_steps", [1200, -2250, 0], 90);
  put("pier", [1800, -2700, 0]);
  put("pier", [1800, -3100, 0]);
  put("ship", [-750, -2840, 0]);
  put("fishing_boat", [1545, -2930, 0], 92);
  put("outrigger_canoe", [1200, -2650, 0], 176);
  put("outrigger_canoe", [2085, -2960, 0], 88);
  for (const [x, y, h] of [[1760, -2620, 15], [1835, -2640, -10]]) put("common:crate", [x, y, 40], h);
  put(solid(merge(basket(24, 24), ...[0, 1, 2].map((i) => translate(rotateZ(fish(28), i * 70), [0, 0, 22 + i * 3])))), [1850, -2980, 40]);
  put(solid(merge(basket(22, 22), translate(rock([40, 34, 14], 0.4, 3, "Yodia_Net", true), [0, 0, 18]))), [1760, -3060, 40]);
  put(solid(coil(22, 3)), [1840, -3200, 40]);
  put("crane", [-300, -2280, 40], 90);
  // mooring lines to the bollards and a gangplank up to the ship's rail
  const moor = (a: V3, b: V3, sag: number): Geo => {
    const p = (t: number): V3 => { const q = lerp3(a, b, t); return [q[0], q[1], q[2] - sag * 4 * t * (1 - t)]; };
    return merge(...[0, 1, 2, 3, 4, 5].map((i) => rope(p(i / 6), p((i + 1) / 6), 2.4)));
  };
  here(merge(
    moor([-1650, -2772, 286], [-2000, -2470, 88], 40), moor([195, -2690, 360], [400, -2470, 88], 40), moor([-1050, -2566, 206], [-800, -2470, 88], 18),
    beamBetween([-700, -2466, 47], [-700, -2582, 214], 64, 6, "WoodGrey"),
    ...[1, 2, 3, 4, 5].map((i) => { const q = lerp3([-700, -2466, 50], [-700, -2582, 217], i / 6); return boxAt([58, 5, 3], q, "WoodDark"); }),
  ));
  // the quay: paving, the warehouses, the customs house, the lighthouse; cargo, lamps
  for (let x = -2000; x <= 2000; x += 400) put("quay_paving", [x, -1800, 0]);
  for (const x of [-400, 1000]) put("quay_paving", [x, -1400, 0]);
  put("warehouse", [-1750, -1150, 0], 90);
  put("warehouse", [-900, -1150, 0], 90);
  put("customs_house", [250, -1250, 0], 90);
  put("lighthouse", [1760, -1400, 0], 90);
  put("cargo_pile", [-1450, -2170, 40], 90);
  put("cargo_pile", [950, -2150, 40], 10);
  for (const x of [-1150, -50, 700, 1600]) put("harbour_lamp", [x, -2395, 40], 90);
  for (const [x, y, h] of [[-1880, -2120, 10], [-1810, -2130, 35], [-1845, -2140, 0], [180, -2110, 20], [250, -2120, -15]]) put("common:crate", [x, y, y < -2000 ? 40 : 0], h);
  for (const [x, y] of [[-2060, -2160], [-1990, -2110], [320, -2160], [1450, -2140]]) put(solid(barrel()), [x, y, 40]);
  put("common:market_cart", [-430, -1820, 0], 95);
  put("common:sign_post", [-130, -1950, 0], 30);
  // the market corner
  for (const x of [-1600, -1200, -800, -400]) for (const y of [-300, 100]) put("quay_paving", [x, y, 0]);
  put("fish_stall", [-1460, -60, 0], 90);
  put("fruit_stall", [-1000, -60, 0], 90);
  put("common:market_cart", [-560, -110, 0], 120);
  put("cargo_pile", [-1820, 250, 0], 0);
  put("common:bench", [-1250, -430, 0], 90);
  put("common:bench", [-760, -430, 0], 90);
  put("guardian_post", [-250, 200, 0], 90);
  for (const [x, y] of [[-1740, -360], [-260, -360], [-1740, 280]]) put("tiki_torch", [x, y, 0]);
  // the jungle side: stilt houses and a longhouse along plank paths, the palisade and its gate
  put("longhouse", [-700, 1300, 0], 90);
  put("stilt_house", [-1800, 960, 0], 90);
  put("stilt_house", [1350, 1080, 0], 112);
  put("stilt_house", [1500, -120, 0], 70);
  for (const y of [1800, 1400, 1000, 600]) put("plank_path", [0, y, 0]);
  for (const x of [-300, -700]) put("plank_path", [x, 700, 0], 90);
  for (const x of [400, 800]) put("plank_path", [x, 960, 0], 90);
  for (const x of [-1800, -1200, -600, 600, 1200, 1800]) put("palisade", [x, 2100, 0], 270);
  put("palisade_gate", [0, 2100, 0], 270);
  put("guardian_post", [-430, 1830, 0], 90);
  put("guardian_post", [430, 1830, 0], 90);
  for (const [x, y] of [[-180, 1580], [180, 1580], [-180, 1080], [180, 820], [-180, 420], [180, 420], [1000, 840]]) put("tiki_torch", [x, y, 0]);
  // plants
  const plants: [string, number, number, number, number][] = [
    ["JungleTree", -2050, 1720, 0, 1], ["JungleTree", -1050, 1880, 70, 0.9], ["JungleTree", 1000, 1820, 140, 1], ["JungleTree", 1950, 1550, 200, 1.1],
    ["JungleTree", 2050, 300, 30, 0.9], ["JungleTree", -2100, -320, 90, 0.85], ["JungleTree", 700, 1500, 250, 0.8],
    ["PalmTall", -380, -480, 0, 1], ["PalmTall", 980, -620, 60, 1.05], ["Palm", 1180, -900, 120, 0.9], ["PalmBent", 1150, -1700, 200, 1],
    ["PalmBent", -2120, -1880, 300, 0.9], ["Palm", 650, 300, 40, 1], ["PalmTall", -2000, 250, 150, 1], ["Palm", 2050, -700, 0, 0.9],
    ["Bamboo", -1350, 1720, 0, 1], ["Bamboo", 2050, 850, 60, 1], ["Bamboo", -2100, 1300, 120, 0.9], ["Bamboo", 600, 1780, 20, 0.85],
    ["JungleBush", -1500, 1700, 0, 1], ["JungleBush", -420, 1880, 40, 1], ["JungleBush", 400, 1820, 80, 1.1], ["JungleBush", 1600, 1820, 120, 1],
    ["JungleBush", -2050, 600, 160, 1], ["JungleBush", 650, 1250, 200, 0.9], ["JungleBush", 1000, 500, 240, 1], ["JungleBush", -250, 1000, 280, 0.8],
    ["JungleBush", -1150, 600, 320, 0.9], ["JungleBush", 2050, -300, 10, 0.9], ["JungleBush", 250, 600, 50, 0.8], ["JungleBush", -800, 380, 90, 0.7],
  ];
  for (const [kind, x, y, h, sc] of plants) put(`flora:${kind}`, [x, y, 0], h, sc);
}

export const KIT: Kit = {
  id: "yodia",
  name: "โยเดีย",
  region: "ที่ราบ เมืองท่า และป่าแดนใต้",
  desc: "เมืองท่าค้าขายใหญ่อันดับสองรองจากเมืองหลวง โกดังไม้และด่านศุลกากรหลังคากระเบื้องดินเผาเรียงริมท่า เรือสินค้าจากทุกทิศจอดเทียบ บ้านใต้ถุนสูงหลังคามุงจากชิดชายป่า",
  ground: "jungle",
  sea: true,
  items: [
    { id: "stilt_house", name: "บ้านใต้ถุนสูง", make: stiltHouse, tags: ["building"] },
    { id: "longhouse", name: "เรือนยาวมีชาน", make: longhouse, tags: ["building"] },
    { id: "warehouse", name: "โกดังสินค้า", make: warehouse, tags: ["building", "dock"] },
    { id: "customs_house", name: "ด่านศุลกากร", make: customsHouse, tags: ["building", "landmark"] },
    { id: "lighthouse", name: "ประภาคาร", make: lighthouse, tags: ["landmark", "tower", "light"] },
    { id: "ship", name: "เรือใบสามเสา", make: ship, tags: ["boat", "landmark"] },
    { id: "fishing_boat", name: "เรือประมง", make: fishingBoat, tags: ["boat"] },
    { id: "outrigger_canoe", name: "เรือแคนูติดทุ่น", make: outriggerCanoe, tags: ["boat"] },
    { id: "pier", name: "ท่าเทียบเรือ (4 ม.)", make: pier, tags: ["dock"] },
    { id: "wharf", name: "ท่าเรือหิน (8 ม.)", make: wharf, tags: ["dock", "wall"] },
    { id: "dock_steps", name: "บันไดท่าน้ำ", make: dockSteps, tags: ["dock"] },
    { id: "crane", name: "ปั้นจั่นไม้", make: crane, tags: ["dock"] },
    { id: "cargo_pile", name: "กองสินค้า", make: cargoPile, tags: ["market", "decor"] },
    { id: "fish_stall", name: "แผงปลาสด", make: fishStall, tags: ["market"] },
    { id: "fruit_stall", name: "แผงผลไม้", make: fruitStall, tags: ["market"] },
    { id: "palisade", name: "กำแพงซุง (6 ม.)", make: palisade, tags: ["wall", "defence"] },
    { id: "palisade_gate", name: "ประตูค่าย", make: palisadeGate, tags: ["gate", "defence", "tower"] },
    { id: "guardian_post", name: "เสาเทพารักษ์", make: guardianPost, tags: ["decor", "magic"] },
    { id: "tiki_torch", name: "คบเพลิงไม้ไผ่", make: tikiTorch, tags: ["light"] },
    { id: "harbour_lamp", name: "โคมไฟท่าเรือ", make: harbourLamp, tags: ["light", "dock"] },
    { id: "plank_path", name: "ทางเดินไม้กระดาน (4 ม.)", make: plankPath, tags: ["ground"] },
    { id: "quay_paving", name: "ลานหินท่าเรือ (4 ม.)", make: quayPaving, tags: ["ground"] },
  ],
  sample,
};

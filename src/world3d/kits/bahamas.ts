// บาฮามัส (Bahamas): the caravan city in the middle of the desert, where the roads from the
// central lands meet the roads to the south. Sandstone and adobe houses with flat roofs and
// parapets, domes, horseshoe and pointed arches, wooden lattice screens, striped awnings and
// tents, a grand bazaar and an oasis with palms (like Morroc in Ragnarok Online).
//
// Everything here is built from code in centimetres, Z up; each item stands on z = 0, centred on
// its footprint, its front facing -X. Arched walls are 2D outlines extruded (THREE.ExtrudeGeometry),
// domes and pots are lathes; masonry gets world-aligned texture coordinates so courses stay
// level and run on from one block to the next.

import * as THREE from "three";
import { merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween, cylinderBetween, cylinderAt, sphereCenter, torus, gableWall, rock } from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import type { Kit, Put } from "./types";

// ---- the town's own colours ----
defineMaterial("Bahamas_SandstoneDeep", { map: "sandstone", tint: "#c99459", bump: 1.5 });
defineMaterial("Bahamas_DesertRock", { map: "sandstone", tint: "#c7895a", bump: 2.5 });
defineMaterial("Bahamas_DomeTeal", { map: "tiles", tint: "#2fa6a0", rough: 0.4, bump: 2 });
defineMaterial("Bahamas_TileTeal", { map: "brick", tint: "#2e9f9a", rough: 0.45, bump: 0.6 });
defineMaterial("Bahamas_TileCobalt", { map: "brick", tint: "#2c58a8", rough: 0.45, bump: 0.6 });
defineMaterial("Bahamas_TileSaffron", { map: "brick", tint: "#e2a43a", rough: 0.45, bump: 0.6 });
defineMaterial("Bahamas_Shadow", { tint: "#3a2a1f", rough: 1 });
defineMaterial("Bahamas_ShutterTeal", { map: "wood", tint: "#3d8a90", bump: 1 });
defineMaterial("Bahamas_PaverA", { map: "adobe", tint: "#dcb882", bump: 1.2 });
defineMaterial("Bahamas_PaverB", { map: "adobe", tint: "#cda26c", bump: 1.2 });
defineMaterial("Bahamas_Grout", { map: "adobe", tint: "#9c7a50", bump: 0.5 });
defineMaterial("Bahamas_Clay", { map: "plaster", tint: "#b8673c", rough: 0.85 });
defineMaterial("Bahamas_ClayPale", { map: "plaster", tint: "#dba374", rough: 0.85 });
defineMaterial("Bahamas_GlazeBlue", { map: "plaster", tint: "#2f63b0", rough: 0.35 });
defineMaterial("Bahamas_GlazeGreen", { map: "plaster", tint: "#3f8f6a", rough: 0.35 });
defineMaterial("Bahamas_Water", { tint: "#2f8f98", rough: 0.08, opacity: 0.88 });
defineMaterial("Bahamas_PoolBed", { map: "adobe", tint: "#5f7a5a", bump: 0.5 });
defineMaterial("Bahamas_FabricSaffron", { map: "fabric", tint: "#e07a28", rough: 0.95 });
defineMaterial("Bahamas_FabricTeal", { map: "fabric", tint: "#2f8f8a", rough: 0.95 });
defineMaterial("Bahamas_FabricMaroon", { map: "fabric", tint: "#7c2430", rough: 0.95 });
defineMaterial("Bahamas_SpiceRed", { map: "felt", tint: "#c0432a", rough: 1 });
defineMaterial("Bahamas_SpiceYellow", { map: "felt", tint: "#e3b23c", rough: 1 });
defineMaterial("Bahamas_SpiceGreen", { map: "felt", tint: "#8a9a3a", rough: 1 });
defineMaterial("Bahamas_SpiceBrown", { map: "felt", tint: "#8b4f2a", rough: 1 });
defineMaterial("Bahamas_Orange", { map: "felt", tint: "#f08c22", rough: 0.7 });
defineMaterial("Bahamas_Date", { map: "felt", tint: "#5e2a16", rough: 0.6 });
defineMaterial("Bahamas_Wicker", { map: "thatch", tint: "#b8925a", bump: 1.5 });
defineMaterial("Bahamas_Reed", { map: "ribs", tint: "#7a9a48", rough: 0.9 });
defineMaterial("Bahamas_OasisGrass", { map: "felt", tint: "#6f9a3c", rough: 1 });
defineMaterial("Bahamas_Sand", { map: "adobe", tint: "#e8cc94", bump: 0.6 });
defineMaterial("Bahamas_Granite", { map: "marble", tint: "#d39b7a", rough: 0.5 });

// ---- geometry helpers ----
type P2 = [number, number];
type Arch = "round" | "pointed" | "horseshoe" | "rect";

const cyl = (r: number, h: number, segs: number, bottom: V3, mat: string): Geo => cylinderAt({ radius: r, height: h, segments: segs, bottom }, mat);
const cone = (rBot: number, rTop: number, h: number, segs: number, bottom: V3, mat: string): Geo => cylinderAt({ rBot, rTop, height: h, segments: segs, bottom }, mat);
// a square pyramid / frustum with its sides along the axes (side = full width at the bottom)
const pyramid = (side: number, top: number, h: number, bottom: V3, mat: string): Geo => rotateZ(cone(side / Math.SQRT2, top / Math.SQRT2, h, 4, [0, 0, 0], mat), 45).map((p) => ({ geo: p.geo.translate(...bottom), mat: p.mat }));

// Texture coordinates in metres from the position, across each face's normal: walls keep their
// courses level (V = z) and neighbouring blocks line up.
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
    worldUv(geo);
    return { geo, mat: p.mat };
  });
}
const sboxAt = (size: V3, bottom: V3, mat: string, bevel = 0): Geo => reuv(boxAt(size, bottom, mat, bevel));
const sboxB = (min: V3, max: V3, mat: string, bevel = 0): Geo => reuv(boxBounds(min, max, mat, bevel));

// A 2D outline (with holes) extruded `depth`: "yz" = outline (y, z), extruded along +X from x = at;
// "xz" = outline (x, z), along +Y from y = at; "xy" = outline (x, y), up from z = at.
function prism(outer: P2[], holes: P2[][], depth: number, plane: "yz" | "xz" | "xy", at: number, mat: string): Geo {
  const shape = new THREE.Shape(outer.map(([a, b]) => new THREE.Vector2(a, b)));
  for (const h of holes) shape.holes.push(new THREE.Path(h.map(([a, b]) => new THREE.Vector2(a, b))));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
  const m = new THREE.Matrix4();
  if (plane === "yz") m.set(0, 0, 1, at, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1);
  else if (plane === "xz") m.set(1, 0, 0, 0, 0, 0, -1, at + depth, 0, 1, 0, 0, 0, 0, 0, 1);
  else m.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, at, 0, 0, 0, 1);
  geo.applyMatrix4(m);
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.clearGroups();
  worldUv(g);
  return [{ geo: g, mat }];
}

// A profile of [radius, height] points from the bottom up, turned round Z (smooth shaded).
function lathe(profile: P2[], segs: number, mat: string, bottom: V3 = [0, 0, 0]): Geo {
  const geo = new THREE.LatheGeometry(profile.map(([r, z]) => new THREE.Vector2(r, z)), segs);
  let len = 0;
  for (let i = 1; i < profile.length; i++) len += Math.hypot(profile[i][0] - profile[i - 1][0], profile[i][1] - profile[i - 1][1]);
  const rmax = Math.max(...profile.map((p) => p[0]));
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * 2 * Math.PI * rmax) / 100, (uv.getY(i) * len) / 100);
  geo.rotateX(Math.PI / 2);
  geo.translate(...bottom);
  return [{ geo: geo.toNonIndexed(), mat }];
}

// A flat polygon seen from both sides (sails, pennants).
function sheet(pts: V3[], mat: string): Geo {
  const pos: number[] = [];
  for (let i = 1; i + 1 < pts.length; i++) {
    const a = pts[0], b = pts[i], c = pts[i + 1];
    pos.push(...a, ...b, ...c, ...a, ...c, ...b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  worldUv(geo);
  return [{ geo, mat }];
}

// ---- arches ----
const E = 0.22; // a pointed arch's two centres sit this fraction of the span in from the jambs
// Height of an opening's top `u` from its middle (w wide, sides `spring` tall).
function archTop(kind: Arch, w: number, spring: number, u: number): number {
  const h = w / 2, a = Math.min(Math.abs(u), h);
  if (kind === "rect") return spring;
  if (kind === "round") return spring + Math.sqrt(h * h - a * a);
  if (kind === "horseshoe") {
    const R = h * 1.18;
    return spring + Math.sqrt(R * R - a * a);
  }
  const e = w * E, R = h + e;
  return spring + Math.sqrt(Math.max(0, R * R - (a + e) * (a + e)));
}
const archApex = (kind: Arch, w: number, spring: number): number => archTop(kind, w, spring, 0);

// The outline of an opening from its left foot (-w/2, 0), up and over, to its right foot (w/2, 0).
function archOutline(kind: Arch, w: number, spring: number, n = 8): P2[] {
  const h = w / 2;
  const pts: P2[] = [[-h, 0]];
  if (kind === "rect") pts.push([-h, spring], [h, spring]);
  else if (kind === "round") {
    for (let i = 0; i <= 2 * n; i++) {
      const a = Math.PI * (1 - i / (2 * n));
      pts.push([h * Math.cos(a), spring + h * Math.sin(a)]);
    }
  } else if (kind === "horseshoe") {
    const R = h * 1.18, d = Math.sqrt(R * R - h * h), a0 = Math.PI + Math.asin(d / R), a1 = -Math.asin(d / R);
    pts.push([-h, spring - d]);
    for (let i = 1; i < 2 * n + 2; i++) {
      const a = a0 + ((a1 - a0) * i) / (2 * n + 2);
      pts.push([R * Math.cos(a), spring + R * Math.sin(a)]);
    }
    pts.push([h, spring - d]);
  } else {
    const e = w * E, R = h + e, top = Math.acos(-e / R);
    for (let i = 0; i <= n; i++) {
      const a = Math.PI + (top - Math.PI) * (i / n);
      pts.push([e + R * Math.cos(a), spring + R * Math.sin(a)]);
    }
    for (let i = n - 1; i >= 0; i--) {
      const a = Math.PI + (top - Math.PI) * (i / n);
      pts.push([-(e + R * Math.cos(a)), spring + R * Math.sin(a)]);
    }
  }
  pts.push([h, 0]);
  return pts;
}

// A moulding round an arch, `tw` wide, standing `depth` proud of the plane x = 0 (towards -X).
function archRing(kind: Arch, w: number, spring: number, tw: number, depth: number, mat: string): Geo {
  const outer = archOutline(kind, w + 2 * tw, spring), inner = archOutline(kind, w, spring).reverse();
  return prism([...outer, ...inner], [], depth + 1, "yz", -depth, mat);
}

// A wooden screen in the plane x = 0 filling an opening (y centred, from z = 0): a diamond lattice
// in a square-headed window, upright bars and rails in an arched one.
function lattice(kind: Arch, w: number, sp: number, cell: number, mat: string): Geo {
  const parts: Geo[] = [];
  const bar = 3;
  if (kind === "rect") {
    const hw = w / 2 - 1, lo = 1, hi = sp - 1;
    for (let k = -hw - hi + cell / 2; k < hw - lo; k += cell) {
      const u0 = Math.max(-hw, lo + k), u1 = Math.min(hw, hi + k);
      if (u1 - u0 > 2) parts.push(beamBetween([0, u0, u0 - k], [0, u1, u1 - k], bar, bar, mat));
    }
    for (let k = -hw + lo + cell / 2; k < hw + hi; k += cell) {
      const u0 = Math.max(-hw, k - hi), u1 = Math.min(hw, k - lo);
      if (u1 - u0 > 2) parts.push(beamBetween([0, u0, k - u0], [0, u1, k - u1], bar, bar, mat));
    }
    parts.push(box([4, w, 4], [0, 0, 2], mat), box([4, w, 4], [0, 0, sp - 2], mat), box([4, 4, sp], [0, -w / 2 + 2, sp / 2], mat), box([4, 4, sp], [0, w / 2 - 2, sp / 2], mat));
  } else {
    const nu = Math.max(2, Math.round(w / cell));
    for (let i = 1; i < nu; i++) {
      const u = -w / 2 + (w * i) / nu, top = archTop(kind, w, sp, u) - 1;
      parts.push(box([bar, bar, top], [0, u, top / 2], mat));
    }
    const rails = kind === "horseshoe" ? sp - 0.63 * (w / 2) : sp;
    for (let z = cell; z < rails; z += cell) parts.push(box([bar, w - 2, bar], [0, 0, z], mat));
  }
  return merge(...parts);
}

// ---- walls with openings ----
type Fill = "door" | "dark" | "grille" | "glass" | "open";
interface Opening {
  c: number;       // middle, along the wall
  w: number;
  spring: number;  // height of the straight sides
  z0?: number;     // sill height (0: a door, cut from the foot of the wall)
  kind?: Arch;
  fill?: Fill;
  tw?: number;     // moulding width
  shutters?: string;
}

// What sits in an opening of a wall `t` thick (wall front at x = -t/2): door leaf, dark
// interior, glass, lattice; the moulding round it, a sill, shutters.
function openingDetail(o: Opening, t: number, trim: string | null): Geo {
  const kind = o.kind ?? "round", z0 = o.z0 ?? 0, fill = o.fill ?? "dark", w = o.w, sp = o.spring;
  const back = t / 2, apex = archApex(kind, w, sp);
  const panel = (mat: string, depth: number, x: number): Geo => prism(archOutline(kind, w, sp), [], depth, "yz", x, mat);
  const parts: Geo[] = [];
  if (fill === "door") {
    const x = back - 16;
    parts.push(panel("DoorWood", 8, x));
    if (w >= 100) parts.push(box([3, 4, apex - 4], [x - 1, 0, apex / 2], "WoodDark"));
    const hi = kind === "horseshoe" ? Math.min(sp * 0.7, sp - 0.65 * (w / 2)) : sp * 0.75;
    for (const z of [sp * 0.2, hi]) parts.push(box([3, w - 4, 7], [x - 1, 0, z], "IronDark"));
    const ring = rotateY(torus(6, 1.4, 8, 3, "Bronze"), 90);
    if (w >= 100) parts.push(translate(ring, [x - 4, -12, sp * 0.5]), translate(ring, [x - 4, 12, sp * 0.5]));
    else parts.push(translate(ring, [x - 4, w * 0.25, sp * 0.5]));
  } else if (fill === "dark") parts.push(panel("Bahamas_Shadow", 2, back - 3));
  else if (fill === "glass") {
    parts.push(panel("GlassBlue", 3, back - 14));
    parts.push(box([3, 4, apex], [back - 15.5, 0, apex / 2], "WoodDark"), box([3, w, 4], [back - 15.5, 0, sp], "WoodDark"));
  } else if (fill === "grille") {
    parts.push(panel("Bahamas_Shadow", 2, back - 3));
    parts.push(translate(lattice(kind, w, sp, kind === "rect" ? 15 : 14, "WoodWarm"), [-t / 2 + 8, 0, 0]));
  }
  if (trim) {
    const tw = o.tw ?? 10;
    parts.push(translate(archRing(kind, w, sp, tw, 5, trim), [-t / 2, 0, 0]));
    if (z0 > 0) parts.push(sboxAt([14, w + 2 * tw + 10, 8], [-t / 2 - 3, 0, -8], trim));
  }
  if (o.shutters) {
    const off = w / 2 + (o.tw ?? (trim ? 10 : 0)) + w / 4 + 3;
    for (const s of [-1, 1]) {
      parts.push(boxAt([4, w / 2, sp], [-t / 2 - (trim ? 8 : 3), s * off, 0], o.shutters, 1));
      parts.push(boxAt([2, w / 2 - 8, 5], [-t / 2 - (trim ? 10.5 : 5.5), s * off, sp * 0.3], "WoodDark"), boxAt([2, w / 2 - 8, 5], [-t / 2 - (trim ? 10.5 : 5.5), s * off, sp * 0.7], "WoodDark"));
    }
  }
  return translate(merge(...parts), [0, o.c, z0]);
}

// A wall slab `len` long (along Y, centred), `h` high from z = 0 and `t` thick (centred on x = 0,
// front at x = -t/2), with its openings cut and filled.
function facade(len: number, h: number, t: number, ops: Opening[], mat: string, trim: string | null = null): Geo {
  const outer: P2[] = [[-len / 2, 0]];
  for (const o of ops.filter((x) => !x.z0).sort((a, b) => a.c - b.c))
    for (const [u, v] of archOutline(o.kind ?? "round", o.w, o.spring)) outer.push([o.c + u, v]);
  outer.push([len / 2, 0], [len / 2, h], [-len / 2, h]);
  const holes = ops.filter((x) => x.z0).map((o) => archOutline(o.kind ?? "round", o.w, o.spring).map(([u, v]): P2 => [o.c + u, (o.z0 ?? 0) + v]));
  return merge(prism(outer, holes, t, "yz", -t / 2, mat), ...ops.map((o) => openingDetail(o, t, trim)));
}

// One side of a D (x) by W (y) box of walls; each side's openings are measured along it as seen
// from outside, positive to the viewer's left (as +Y is from the front).
type Side = "front" | "back" | "left" | "right";
function wallSide(side: Side, D: number, W: number, h: number, t: number, ops: Opening[], mat: string, trim: string | null): Geo {
  if (side === "front") return translate(facade(W, h, t, ops, mat, trim), [-D / 2 + t / 2, 0, 0]);
  if (side === "back") return translate(rotateZ(facade(W, h, t, ops, mat, trim), 180), [D / 2 - t / 2, 0, 0]);
  if (side === "left") return translate(rotateZ(facade(D - 2 * t, h, t, ops, mat, trim), -90), [0, W / 2 - t / 2, 0]);
  return translate(rotateZ(facade(D - 2 * t, h, t, ops, mat, trim), 90), [0, -W / 2 + t / 2, 0]);
}
function shell(D: number, W: number, h: number, t: number, ops: Partial<Record<Side, Opening[]>>, mat: string, trim: string | null): Geo {
  return merge(...(["front", "back", "left", "right"] as Side[]).map((s) => wallSide(s, D, W, h, t, ops[s] ?? [], mat, trim)));
}

// A stepped merlon (two tiers and a little pyramid), w along Y, d along X, on z = 0.
function merlon(w: number, d: number, mat: string): Geo {
  const s = w * 0.6;
  return merge(
    sboxAt([d, w, 34], [0, 0, 0], mat),
    sboxAt([d, s, 18], [0, 0, 34], mat),
    scale(pyramid(s, 0, 16, [0, 0, 52], mat), [d / s, 1, 1], [0, 0, 0]),
  );
}

// Coping on the heads of a box of walls (D x W, t thick) at height z, merlons on it.
function crown(D: number, W: number, t: number, z: number, mat: string, m: Geo | null, spacing: number, skipEnds = false): Geo {
  const parts: Geo[] = [
    sboxB([-D / 2 - 4, -W / 2 - 4, z], [-D / 2 + t + 4, W / 2 + 4, z + 8], mat),
    sboxB([D / 2 - t - 4, -W / 2 - 4, z], [D / 2 + 4, W / 2 + 4, z + 8], mat),
    sboxB([-D / 2 + t + 4, -W / 2 - 4, z], [D / 2 - t - 4, -W / 2 + t + 4, z + 8], mat),
    sboxB([-D / 2 + t + 4, W / 2 - t - 4, z], [D / 2 - t - 4, W / 2 + 4, z + 8], mat),
  ];
  if (m) {
    const nW = Math.max(2, Math.round(W / spacing)), nD = Math.max(1, Math.round((D - 2 * t) / spacing));
    const skip = (i: number, n: number) => skipEnds && (i === 0 || i === n - 1);
    for (let i = 0; i < nW; i++) {
      if (skip(i, nW)) continue;
      const y = -W / 2 + (W * (i + 0.5)) / nW;
      parts.push(translate(m, [-D / 2 + t / 2, y, z + 8]), translate(m, [D / 2 - t / 2, y, z + 8]));
    }
    const side = rotateZ(m, 90);
    for (let i = 0; i < nD; i++) {
      if (skip(i, nD)) continue;
      const x = -D / 2 + t + ((D - 2 * t) * (i + 0.5)) / nD;
      parts.push(translate(side, [x, -W / 2 + t / 2, z + 8]), translate(side, [x, W / 2 - t / 2, z + 8]));
    }
  }
  return merge(...parts);
}

// ---- small things used by several items ----
// A pierced brass lantern standing on z = 0, about 80 tall.
function lantern(): Geo {
  return merge(
    cone(2, 6, 7, 8, [0, 0, 0], "Bronze"),
    lathe([[5, 0], [11, 6], [15, 17], [16, 26], [12, 38], [7, 44]], 8, "LanternGlow", [0, 0, 6]),
    cyl(16.6, 3, 8, [0, 0, 29], "Bronze"),
    cyl(9, 4, 8, [0, 0, 49], "Bronze"),
    lathe([[11, 0], [11, 2], [9, 7], [5, 12], [2, 17], [0, 20]], 8, "Bronze", [0, 0, 53]),
    translate(rotateX(torus(4, 1, 6, 3, "Bronze"), 90), [0, 0, 77]),
  );
}
// A lantern hung by a chain from (x, y, top).
function hangLantern(x: number, y: number, top: number, chain: number, s = 1): Geo {
  return merge(cylinderBetween([x, y, top], [x, y, top - chain], 0.8, 4, "IronDark"), translate(scale(lantern(), [s, s, s]), [x, y, top - chain - 81 * s]));
}

// A rug lying on z = 0, w along X, l along Y: field, border, medallion, fringes; `both` puts the
// pattern on its underside too (for rugs that hang).
function rug(w: number, l: number, base: string, border: string, accent: string, both = false): Geo {
  const b = 7, inset = 9;
  const pattern = (z: number, up: number): Geo => merge(
    boxAt([b, l - 2 * inset, 0.6], [-w / 2 + inset + b / 2, 0, z], border),
    boxAt([b, l - 2 * inset, 0.6], [w / 2 - inset - b / 2, 0, z], border),
    boxAt([w - 2 * inset - 2 * b, b, 0.6], [0, -l / 2 + inset + b / 2, z], border),
    boxAt([w - 2 * inset - 2 * b, b, 0.6], [0, l / 2 - inset - b / 2, z], border),
    rotateZ(boxAt([w * 0.34, w * 0.34, 0.6], [0, 0, z], accent), 45),
    rotateZ(boxAt([w * 0.15, w * 0.15, 0.6], [0, 0, z + up], border), 45),
    rotateZ(boxAt([w * 0.14, w * 0.14, 0.6], [0, -l * 0.3, z], accent), 45),
    rotateZ(boxAt([w * 0.14, w * 0.14, 0.6], [0, l * 0.3, z], accent), 45),
  );
  return merge(
    boxAt([w, l, 1.6], [0, 0, 0], base),
    pattern(1.6, 0.6),
    both ? pattern(-0.6, -0.6) : [],
    boxAt([w - 6, 5, 0.8], [0, -l / 2 - 2.5, 0.4], "FabricWhite"),
    boxAt([w - 6, 5, 0.8], [0, l / 2 + 2.5, 0.4], "FabricWhite"),
  );
}
// A rug hanging flat (patterned both sides) with its top edge at (x, y, top); `len` tall, `wid` across.
const hangRug = (len: number, wid: number, at: V3, base: string, border: string, accent: string): Geo =>
  translate(rotateY(rug(len, wid, base, border, accent, true), -90), [at[0], at[1], at[2] - len / 2]);

const cushion = (r: number, at: V3, mat: string): Geo => translate(scale(sphereCenter(r, [0, 0, 0], mat, 8), [1, 1, 0.42]), [at[0], at[1], at[2] + r * 0.4]);

function sack(h: number, mat = "FabricSand"): Geo {
  const r = h * 0.48;
  return merge(
    lathe([[0, 0], [r * 0.8, 0], [r, h * 0.12], [r * 1.02, h * 0.45], [r * 0.85, h * 0.72], [r * 0.4, h * 0.86], [r * 0.25, h * 0.9], [r * 0.34, h], [0, h * 1.02]], 9, mat),
    cyl(r * 0.28, h * 0.05, 8, [0, 0, h * 0.86], "RopeTan"),
  );
}

// Pots by shape: [radius, height] from the foot up (closed at the mouth, a dark disc shows it open).
const POTS: Record<string, P2[]> = {
  amphora: [[0, 0], [9, 0], [11, 4], [20, 16], [29, 38], [31, 55], [27, 72], [16, 86], [9, 93], [8, 104], [11, 108], [10, 110], [0, 110]],
  urn: [[0, 0], [16, 0], [22, 6], [36, 26], [42, 48], [40, 66], [30, 80], [22, 86], [24, 90], [23, 93], [0, 93]],
  jar: [[0, 0], [11, 0], [15, 5], [22, 18], [24, 30], [20, 42], [12, 50], [11, 55], [13, 58], [0, 58]],
  jug: [[0, 0], [8, 0], [12, 6], [14, 16], [11, 26], [7, 32], [7, 40], [9, 42], [0, 42]],
  bowl: [[0, 0], [10, 0], [20, 6], [25, 14], [24, 15], [0, 11]],
};
function pot(kind: keyof typeof POTS, mat: string, s = 1, at: V3 = [0, 0, 0]): Geo {
  const prof = POTS[kind].map(([r, z]): P2 => [r * s, z * s]);
  const top = prof[prof.length - 1][1], mouth = prof[prof.length - 2][0];
  const parts: Geo[] = [lathe(prof, 10, mat)];
  if (kind !== "bowl") parts.push(cyl(mouth * 0.75, 0.6, 10, [0, 0, top], "Bahamas_Shadow"));
  if (kind === "amphora") for (const sy of [-1, 1]) parts.push(translate(rotateX(torus(8 * s, 1.8 * s, 10, 4, mat), 90), [0, sy * 18 * s, 84 * s]));
  if (kind === "jug") parts.push(translate(rotateX(torus(8 * s, 1.8 * s, 10, 4, mat), 90), [0, 13 * s, 26 * s]));
  if (kind === "urn") parts.push(cyl(42.3 * s, 6 * s, 12, [0, 0, 45 * s], "Bahamas_GlazeBlue"));
  return translate(merge(...parts), at);
}

function teapot(at: V3): Geo {
  return translate(merge(
    lathe([[0, 0], [8, 0], [11, 5], [12, 10], [9, 15], [4, 17], [3.5, 21], [5, 22], [0, 23]], 10, "Bronze"),
    cylinderBetween([10, 0, 8], [19, 0, 17], 1.6, 6, "Bronze", 1),
    translate(rotateX(torus(5, 1, 8, 4, "Bronze"), 90), [-11, 0, 10]),
  ), at);
}

// ======================================================================================
// buildings
// ======================================================================================

// บ้านดินเหนียว: a one-storey adobe house, flat roof behind a parapet, wooden beam ends,
// whitewashed frames and teal shutters, an outside stair up the +Y side to the roof terrace.
function adobeHouse(): Geo {
  const D = 600, W = 720, t = 35, h = 340, ph = 55;
  const win = (c: number, shutters = true): Opening => ({ c, w: 74, z0: 115, spring: 90, kind: "rect", fill: "grille", shutters: shutters ? "Bahamas_ShutterTeal" : undefined });
  const ops: Partial<Record<Side, Opening[]>> = {
    front: [{ c: -150, w: 112, spring: 165, kind: "round", fill: "door", tw: 12 }, win(160)],
    back: [win(-150, false), { c: 150, w: 60, z0: 150, spring: 55, kind: "round", fill: "dark" }],
    right: [win(-120), win(130, false)],
    left: [{ c: -160, w: 50, z0: 170, spring: 40, kind: "round", fill: "dark" }],
  };
  const parts: Geo[] = [
    sboxB([-D / 2 - 7, -W / 2 - 7, 0], [D / 2 + 7, W / 2 + 7, 22], "Bahamas_SandstoneDeep", 2),
    ...(["front", "back", "right"] as Side[]).map((s) => wallSide(s, D, W, h + ph, t, ops[s] ?? [], "AdobeOchre", "AdobeWhite")),
    wallSide("left", D, W, h, t, ops.left ?? [], "AdobeOchre", "AdobeWhite"),
    sboxB([-D / 2 + t, -W / 2 + t, h - 20], [D / 2 - t, W / 2 - t, h], "AdobeOchre"),
  ];
  // the +Y parapet with a gap where the stair comes up
  const gap: [number, number] = [120, 230];
  parts.push(sboxB([-D / 2 + t, W / 2 - t, h], [gap[0], W / 2, h + ph], "AdobeOchre"), sboxB([gap[1], W / 2 - t, h], [D / 2 - t, W / 2, h + ph], "AdobeOchre"));
  // coping on the parapets (whitewashed), round pinnacles at the corners
  const cz = h + ph;
  parts.push(
    sboxB([-D / 2 - 4, -W / 2 - 4, cz], [-D / 2 + t + 4, W / 2 + 4, cz + 8], "AdobeWhite"),
    sboxB([D / 2 - t - 4, -W / 2 - 4, cz], [D / 2 + 4, W / 2 + 4, cz + 8], "AdobeWhite"),
    sboxB([-D / 2 + t + 4, -W / 2 - 4, cz], [D / 2 - t - 4, -W / 2 + t + 4, cz + 8], "AdobeWhite"),
    sboxB([-D / 2 + t + 4, W / 2 - t - 4, cz], [gap[0], W / 2 + 4, cz + 8], "AdobeWhite"),
    sboxB([gap[1], W / 2 - t - 4, cz], [D / 2 - t - 4, W / 2 + 4, cz + 8], "AdobeWhite"),
  );
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(cone(24, 7, 52, 8, [sx * (D / 2 - t / 2), sy * (W / 2 - t / 2), cz + 8], "AdobeOchre"));
  // beam ends (vigas) through the front, back and -Y walls just under the roof
  const viga = (a: V3, b: V3) => cylinderBetween(a, b, 7, 7, "WoodDark");
  for (let y = -300; y <= 300; y += 75) {
    if (y < 40 || y > 180) parts.push(viga([-D / 2 - 28, y, h - 32], [-D / 2 + 10, y, h - 32]));
    parts.push(viga([D / 2 + 28, y, h - 32], [D / 2 - 10, y, h - 32]));
  }
  for (let x = -225; x <= 225; x += 75) parts.push(viga([x, -W / 2 - 28, h - 32], [x, -W / 2 + 10, h - 32]));
  // the outside stair along +Y, rising towards +X, and its sloping side wall
  const n = 12, rise = h / n, run = 38, x0 = -D / 2 + 25, L = n * run;
  const steps: P2[] = [[0, 0], [L, 0]];
  for (let i = n - 1; i >= 0; i--) steps.push([(i + 1) * run, (i + 1) * rise], [i * run, (i + 1) * rise]);
  parts.push(translate(prism(steps, [], 92, "xz", W / 2, "AdobeOchre"), [x0, 0, 0]));
  parts.push(translate(prism([[0, 0], [L + 30, 0], [L + 30, h + 48], [L, h + 48], [0, rise + 48]], [], 16, "xz", W / 2 + 80, "AdobeOchre"), [x0, 0, 0]));
  parts.push(translate(prism([[0, rise + 48], [L, h + 48], [L + 30, h + 48], [L + 30, h + 56], [L, h + 56], [0, rise + 56]], [], 20, "xz", W / 2 + 78, "AdobeWhite"), [x0, 0, 0]));
  parts.push(translate(prism(archOutline("round", 70, 50), [], 2, "xz", W / 2 + 97, "Bahamas_Shadow"), [x0 + L * 0.62, 0, 25]));
  // roof terrace: a striped sun shade on two poles, a rug and cushions, a water jar
  const sx0 = 95, sx1 = 250;
  for (const x of [sx0, sx1]) for (const y of [-318, -72]) parts.push(cylinderBetween([x, y, h], [x, y, h + (x === sx0 ? 206 : 232)], 5, 8, "WoodDark"));
  for (let i = 0; i < 5; i++) parts.push(beamBetween([sx0 - 16, -330 + 26 + i * 52, h + 204], [sx1 + 16, -330 + 26 + i * 52, h + 232], 52, 2.5, i % 2 ? "FabricSand" : "FabricRed"));
  for (let k = 0; k < 7; k++) parts.push(translate(rotateX(box([3, 20, 20], [0, 0, 0], k % 2 ? "FabricSand" : "FabricRed"), 45), [sx0 - 16, -318 + k * 41, h + 203]));
  parts.push(translate(rug(190, 230, "FeltRed", "FabricGold", "FabricNavy"), [160, -195, h]));
  parts.push(cushion(32, [215, -270, h + 2], "FabricGold"), cushion(30, [215, -125, h + 2], "FabricPurple"));
  parts.push(pot("jar", "Bahamas_Clay", 1, [-200, -280, h]), pot("jug", "Bahamas_ClayPale", 1, [-150, -300, h]));
  // a rug airing over the front parapet
  parts.push(sboxB([-D / 2 - 6, 40, cz + 8], [-D / 2 + t + 6, 180, cz + 10], "FeltRed"));
  parts.push(hangRug(130, 140, [-D / 2 - 6, 110, cz + 10], "FeltRed", "FabricGold", "FabricNavy"));
  for (const y of [-300, -10, 250]) parts.push(boxAt([2, 14, 14], [-D / 2 - 0.5, y, 262], "Bahamas_Shadow"));
  // a mud bench along the front wall under the window
  parts.push(sboxB([-D / 2 - 46, 30, 0], [-D / 2, 310, 42], "AdobeOchre", 2), sboxB([-D / 2 - 49, 26, 42], [-D / 2, 314, 48], "AdobeWhite", 1.5));
  parts.push(cushion(22, [-D / 2 - 24, 90, 48], "Bahamas_FabricTeal"), cushion(22, [-D / 2 - 24, 140, 48], "FeltRed"));
  // doorstep pots and a lamp by the door
  parts.push(pot("urn", "Bahamas_ClayPale", 0.8, [-D / 2 - 55, -260, 0]), pot("jar", "Bahamas_GlazeBlue", 0.9, [-D / 2 - 40, -40, 0]));
  parts.push(boxAt([24, 8, 8], [-D / 2 - 12, -230, 230], "IronDark"), hangLantern(-D / 2 - 22, -230, 232, 8, 0.55));
  return merge(...parts);
}

// บ้านหินทรายโดมขาว: a two-storey sandstone house with a white dome on a drum, a horseshoe door,
// a wooden lattice bay (mashrabiya) over it and a stepped-merlon parapet.
function domedHouse(): Geo {
  const D = 700, W = 700, t = 40, h = 650, ph = 60;
  const low = (c: number): Opening => ({ c, w: 80, z0: 105, spring: 100, kind: "rect", fill: "grille", tw: 10 });
  const up = (c: number): Opening => ({ c, w: 78, z0: 410, spring: 105, kind: "pointed", fill: "glass", tw: 10 });
  const parts: Geo[] = [
    sboxB([-D / 2 - 8, -W / 2 - 8, 0], [D / 2 + 8, W / 2 + 8, 28], "Bahamas_SandstoneDeep", 2),
    shell(D, W, h + ph, t, {
      front: [{ c: 0, w: 130, spring: 190, kind: "horseshoe", fill: "door", tw: 14 }, low(-215), low(215), up(-215), up(215)],
      back: [low(-180), { c: 150, w: 100, spring: 170, kind: "round", fill: "door", tw: 10 }, up(-200), up(0), up(200)],
      left: [low(0), up(-160), up(160)],
      right: [low(-150), low(150), up(0)],
    }, "SandstoneWarm", "SandstonePale"),
    sboxB([-D / 2 + t, -W / 2 + t, h - 20], [D / 2 - t, W / 2 - t, h], "SandstoneWarm"),
    sboxB([-D / 2 - 6, -W / 2 - 6, 318], [D / 2 + 6, W / 2 + 6, 334], "SandstonePale", 2),
    sboxB([-D / 2 - 9, -W / 2 - 9, 600], [D / 2 + 9, W / 2 + 9, 628], "SandstonePale", 3),
    crown(D, W, t, h + ph, "SandstonePale", merlon(54, t, "SandstoneWarm"), 100),
  ];
  // the dome on its drum, over the back half of the roof
  const dx = 90;
  parts.push(cyl(178, 95, 16, [dx, 0, h], "SandstonePale"), cyl(186, 12, 16, [dx, 0, h + 95], "SandstoneWarm"));
  parts.push(lathe(Array.from({ length: 8 }, (_, i): P2 => [182 * Math.cos((i / 7) * Math.PI / 2), 205 * Math.sin((i / 7) * Math.PI / 2)]), 16, "AdobeWhite", [dx, 0, h + 105]));
  parts.push(sphereCenter(14, [dx, 0, h + 318], "GoldTrim", 10), sphereCenter(9, [dx, 0, h + 340], "GoldTrim", 8), cone(4, 0, 40, 6, [dx, 0, h + 346], "GoldTrim"));
  const drumWin = translate(prism(archOutline("round", 34, 30), [], 3, "yz", -1.5, "Bahamas_Shadow"), [-176, 0, h + 22]);
  for (let k = 0; k < 8; k++) parts.push(translate(rotateZ(drumWin, 11.25 + 45 * k), [dx, 0, 0]));
  // the lattice bay over the door
  const bx = -D / 2, bw = 200, bd = 70, bz = 372, bh = 200;
  parts.push(sboxB([bx - 1, -bw / 2 + 6, bz + 10], [bx, bw / 2 - 6, bz + bh - 6], "Bahamas_Shadow"));
  parts.push(boxBounds([bx - bd - 6, -bw / 2 - 8, bz], [bx, bw / 2 + 8, bz + 14], "WoodDark", 2));
  for (const s of [-1, 1]) parts.push(beamBetween([bx, s * 80, bz - 70], [bx - bd + 6, s * 80, bz + 2], 10, 10, "WoodDark"));
  for (const s of [-1, 1]) for (const xx of [bx - bd, bx - 4]) parts.push(boxAt([7, 7, bh - 14], [xx, s * (bw / 2 - 3.5), bz + 14], "WoodDark"));
  parts.push(translate(lattice("rect", bw - 8, bh - 60, 15, "WoodWarm"), [bx - bd, 0, bz + 14]));
  parts.push(boxAt([5, bw, 6], [bx - bd, 0, bz + bh - 46], "WoodDark"));
  parts.push(translate(lattice("rect", bw - 8, 32, 12, "WoodWarm"), [bx - bd, 0, bz + bh - 40]));
  for (const s of [-1, 1]) parts.push(translate(rotateZ(lattice("rect", bd - 8, bh - 22, 15, "WoodWarm"), 90), [bx - bd / 2, s * (bw / 2 - 3.5), bz + 14]));
  parts.push(boxBounds([bx - bd - 8, -bw / 2 - 8, bz + bh - 8], [bx + 2, bw / 2 + 8, bz + bh + 2], "WoodDark", 2));
  for (let k = 0; k < 9; k++) parts.push(pyramid(14, 0, 14, [bx - bd - 2, -bw / 2 + 8 + k * 23, bz + bh + 2], "WoodDark"));
  // a little wooden hood over the door and lamps either side
  parts.push(rotateY(boxBounds([-60, -100, -4], [0, 100, 4], "WoodShade", 1), -14, [0, 0, 0]).map((p) => ({ geo: p.geo.clone().translate(-D / 2, 0, 316), mat: p.mat })));
  for (const s of [-1, 1]) parts.push(beamBetween([-D / 2, s * 90, 270], [-D / 2 - 52, s * 90, 318], 7, 7, "WoodDark"));
  for (const s of [-1, 1]) parts.push(boxAt([24, 8, 8], [-D / 2 - 12, s * 120, 238], "IronDark"), hangLantern(-D / 2 - 22, s * 120, 240, 8, 0.55));
  // pots and a sack at the door
  parts.push(pot("amphora", "Bahamas_Clay", 0.9, [-D / 2 - 45, -300, 0]), pot("jar", "Bahamas_GlazeGreen", 0.8, [-D / 2 - 40, 300, 0]), translate(sack(55), [-D / 2 - 50, 245, 0]));
  return merge(...parts);
}

// บ้านพ่อค้าซุ้มโค้ง: a merchant's house: a ground-floor arcade of pointed arches in front of the
// shop, a terrace with a wooden rail on top, striped awnings over the upper windows, a little
// domed kiosk on the roof.
function merchantHouse(): Geo {
  const W = 1000, t = 40, xa = -350, xm = -130, Dm = 480, hm = 700, ph = 60, ha = 380;
  const mx = xm + Dm / 2;
  const up = (c: number): Opening => ({ c, w: 90, z0: 450, spring: 95, kind: "pointed", fill: "glass", tw: 10 });
  const side = (c: number): Opening => ({ c, w: 80, z0: 110, spring: 100, kind: "rect", fill: "grille", tw: 10 });
  const parts: Geo[] = [
    sboxB([xm - 4, -W / 2 - 8, 0], [mx + Dm / 2 + 8, W / 2 + 8, 25], "Bahamas_SandstoneDeep", 2),
    translate(shell(Dm, W, hm + ph, t, {
      front: [
        { c: 0, w: 150, spring: 200, kind: "pointed", fill: "door", tw: 12 },
        { c: -320, w: 200, z0: 50, spring: 160, kind: "rect", fill: "dark", tw: 10 },
        { c: 320, w: 200, z0: 50, spring: 160, kind: "rect", fill: "dark", tw: 10 },
        up(-300), up(0), up(300),
      ],
      back: [side(-300), side(300), up(-300), up(0), up(300)],
      left: [side(0), up(-110), up(110)],
      right: [{ c: 80, w: 110, spring: 180, kind: "round", fill: "door", tw: 10 }, up(-110), up(110)],
    }, "SandstonePale", "SandstoneWarm"), [mx, 0, 0]),
    sboxB([xm + t, -W / 2 + t, hm - 20], [xm + Dm - t, W / 2 - t, hm], "SandstonePale"),
    sboxB([xm - 8, -W / 2 - 8, 640], [xm + Dm + 8, W / 2 + 8, 668], "SandstoneWarm", 3),
    sboxB([xm - 4, -W / 2 - 4, 612], [xm + Dm + 4, W / 2 + 4, 640], "Bahamas_TileTeal"),
    sboxB([xm - 5, -W / 2 - 5, 606], [xm + Dm + 5, W / 2 + 5, 612], "GoldTrim"),
    translate(crown(Dm, W, t, hm + ph, "SandstoneWarm", merlon(54, t, "SandstonePale"), 105), [mx, 0, 0]),
  ];
  // the arcade: front with three pointed arches, open ends, a deck on top
  const arches: Opening[] = [-325, 0, 325].map((c) => ({ c, w: 230, spring: 170, kind: "pointed" as Arch, fill: "open" as Fill, tw: 12 }));
  parts.push(translate(facade(W, ha, t, arches, "SandstonePale", "SandstoneWarm"), [xa + t / 2, 0, 0]));
  for (const s of [-1, 1]) parts.push(translate(rotateZ(facade(xm - xa - t, ha, t, [{ c: 0, w: 110, spring: 150, kind: "round", fill: "open", tw: 10 }], "SandstonePale", "SandstoneWarm"), s > 0 ? -90 : 90), [(xa + t + xm) / 2, s * (W / 2 - t / 2), 0]));
  parts.push(sboxB([xa + 1, -W / 2 + 1, ha - 32], [xm, W / 2 - 1, ha - 2], "SandstonePale"));
  parts.push(sboxB([xa - 6, -W / 2 - 6, ha - 2], [xm + 2, W / 2 + 6, ha + 8], "SandstoneWarm", 2));
  parts.push(sboxB([xa, -W / 2, 0], [xm, W / 2, 3], "Bahamas_PaverA"));
  // terrace rail
  const rx = xa + 6, rz = ha + 8;
  for (let y = -W / 2 + 6; y <= W / 2 - 6; y += 123.5) parts.push(boxAt([10, 10, 88], [rx, y, rz], "WoodDark", 1.5));
  parts.push(boxAt([12, W, 8], [rx, 0, rz + 82], "WoodDark", 1.5), boxAt([8, W, 6], [rx, 0, rz + 10], "WoodDark"));
  for (let y = -W / 2 + 20; y < W / 2 - 10; y += 22) parts.push(boxAt([4, 4, 64], [rx, y, rz + 16], "WoodShade"));
  for (const s of [-1, 1]) {
    parts.push(boxAt([xm - xa - 6, 10, 8], [(xa + xm) / 2, s * (W / 2 - 6), rz + 82], "WoodDark"));
    for (let x = xa + 30; x < xm - 10; x += 22) parts.push(boxAt([4, 4, 64], [x, s * (W / 2 - 6), rz + 16], "WoodShade"));
  }
  // striped awnings over the upper front windows
  for (const c of [-300, 0, 300]) {
    for (let i = 0; i < 6; i++) parts.push(rotateY(boxAt([70, 22, 2], [-35, c - 55 + i * 22, 0], i % 2 ? "FabricSand" : "FabricRed"), -28).map((p) => ({ geo: p.geo.clone().translate(xm - 2, 0, 640), mat: p.mat })));
    for (let i = 0; i < 6; i++) parts.push(translate(rotateX(box([3, 13, 13], [0, 0, 0], i % 2 ? "FabricRed" : "FabricSand"), 45), [xm - 64, c - 55 + i * 22, 607]));
  }
  // under the arcade: lamps, goods against the shop wall
  for (const c of [-325, 0, 325]) parts.push(hangLantern((xa + xm) / 2 + 10, c, ha - 32, 30, 0.6));
  parts.push(pot("amphora", "Bahamas_Clay", 1, [xm - 30, -440, 0]), pot("urn", "Bahamas_ClayPale", 0.9, [xm - 45, -200, 0]), pot("jar", "Bahamas_GlazeBlue", 1, [xm - 30, 170, 0]));
  parts.push(translate(sack(60), [xm - 40, 230, 0]), translate(sack(52, "FabricWhite"), [xm - 35, 450, 0]), translate(rotateZ(sack(48), 40), [xm - 85, 420, 0]));
  parts.push(hangRug(150, 110, [xm - 4, 210 + 120, 220], "Bahamas_FabricMaroon", "FabricGold", "Bahamas_FabricTeal"));
  parts.push(hangRug(150, 110, [xm - 4, -210 - 120 - 10, 220], "FabricNavy", "FabricWhite", "FeltRed"));
  // a signboard over the middle arch
  parts.push(boxBounds([xa - 6, -90, ha - 52], [xa - 1, 90, ha - 12], "WoodDark", 1), boxBounds([xa - 8, -96, ha - 56], [xa - 5, 96, ha - 52], "GoldTrim"), boxBounds([xa - 8, -96, ha - 12], [xa - 5, 96, ha - 8], "GoldTrim"));
  parts.push(translate(rotateY(cyl(13, 3, 12, [0, 0, 0], "GoldTrim"), 90), [xa - 7, 0, ha - 32]));
  // terrace: pots and a rug airing on the rail
  parts.push(pot("urn", "Bahamas_Clay", 0.8, [xa + 120, -380, ha + 8]), pot("jar", "Bahamas_ClayPale", 1, [xa + 100, 400, ha + 8]));
  parts.push(boxBounds([rx - 10, 80, rz + 90], [rx + 10, 230, rz + 92], "FabricGold"), hangRug(80, 150, [rx - 10, 155, rz + 92], "FabricGold", "FeltRed", "FabricNavy"));
  // the roof kiosk: four posts, a slab and a small white dome
  const kx = mx + 120, ky = -300, kz = hm;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(sboxAt([14, 14, 170], [kx + sx * 70, ky + sy * 70, kz], "SandstonePale", 1.5));
  parts.push(sboxB([kx - 92, ky - 92, kz + 170], [kx + 92, ky + 92, kz + 190], "SandstoneWarm", 2));
  parts.push(lathe(Array.from({ length: 7 }, (_, i): P2 => [80 * Math.cos((i / 6) * Math.PI / 2), 95 * Math.sin((i / 6) * Math.PI / 2)]), 12, "AdobeWhite", [kx, ky, kz + 190]));
  parts.push(sphereCenter(8, [kx, ky, kz + 290], "GoldTrim", 8), cone(3, 0, 26, 6, [kx, ky, kz + 296], "GoldTrim"));
  parts.push(translate(rug(110, 110, "FeltRed", "FabricGold", "FabricNavy"), [kx, ky, kz]));
  return merge(...parts);
}

// วังโดมฟ้า: the landmark: a palace hall on a platform, entered through a tall tiled portal
// (iwan), crowned by a turquoise onion dome on a windowed drum; turrets at its corners, a
// tall tower with a balcony at the back, arcaded wings round a forecourt with a fountain.
function grandPalace(): Geo {
  const P = 60;
  const parts: Geo[] = [];
  // platform, front steps, forecourt floor
  parts.push(sboxB([-1090, -1090, 0], [1090, 1090, P - 10], "Bahamas_SandstoneDeep"), sboxB([-1100, -1100, P - 10], [1100, 1100, P], "SandstonePale", 2));
  parts.push(sboxB([-1180, -330, 0], [-1095, 330, 20], "SandstonePale", 2), sboxB([-1140, -330, 0], [-1095, 330, 40], "SandstonePale", 2));
  parts.push(sboxB([-1100, -170, P], [-460, 170, P + 2], "MarbleWhite"));
  parts.push(translate(rotateZ(sboxAt([500, 500, 1], [0, 0, 0], "Bahamas_TileCobalt"), 45), [-760, 0, P + 2]), sboxAt([500, 500, 1.5], [-760, 0, P + 2], "Bahamas_TileCobalt"));
  // the fountain: an octagonal basin, water, a bowl on a stem
  const fx = -760;
  parts.push(lathe([[210, 0], [210, 42], [188, 42], [188, 2]], 8, "MarbleWhite", [fx, 0, P + 3]));
  parts.push(cyl(190, 4, 8, [fx, 0, P + 3], "Bahamas_PoolBed"), cyl(189, 2, 8, [fx, 0, P + 34], "Bahamas_Water"));
  parts.push(cyl(22, 90, 8, [fx, 0, P + 3], "MarbleWhite"), lathe([[10, 0], [40, 6], [62, 18], [64, 24], [0, 20]], 12, "MarbleWhite", [fx, 0, P + 90]));
  parts.push(cyl(56, 2, 12, [fx, 0, P + 111], "Bahamas_Water"), lathe([[0, 0], [10, 2], [7, 18], [3, 24], [0, 26]], 8, "Bahamas_TileTeal", [fx, 0, P + 112]));
  // orange trees in planters along the forecourt
  for (const x of [-980, -540]) for (const s of [-1, 1]) parts.push(orangeTree([x, s * 600, P]));
  // lamp pedestals at the head of the steps
  for (const s of [-1, 1]) {
    parts.push(sboxAt([70, 70, 110], [-1050, s * 420, P], "SandstoneWarm", 3), sboxAt([84, 84, 12], [-1050, s * 420, P + 110], "SandstonePale", 2));
    parts.push(translate(scale(lantern(), [1.5, 1.5, 1.5]), [-1050, s * 420, P + 122]));
  }

  // the hall: x -200..900, y -550..550, 900 to the roof
  const hx = 350, hD = 1100, hW = 1100, hH = 900, ht = 60;
  const sideWin = (c: number): Opening => ({ c, w: 130, z0: 300, spring: 200, kind: "pointed", fill: "grille", tw: 18 });
  parts.push(translate(merge(
    shell(hD, hW, hH + 70, ht, {
      front: [{ c: 0, w: 220, spring: 270, kind: "horseshoe", fill: "door", tw: 18 }, { c: 0, w: 200, z0: 470, spring: 150, kind: "pointed", fill: "grille", tw: 18 }],
      back: [-330, 0, 330].map((c) => ({ c, w: 130, z0: 300, spring: 200, kind: "pointed" as Arch, fill: "glass" as Fill, tw: 18 })),
      left: [-330, 0, 330].map(sideWin),
      right: [-330, 0, 330].map(sideWin),
    }, "SandstonePale", "Bahamas_TileTeal"),
    sboxB([-hD / 2 + ht, -hW / 2 + ht, hH - 20], [hD / 2 - ht, hW / 2 - ht, hH], "SandstonePale"),
    sboxB([-hD / 2 - 4, -hW / 2 - 4, 0], [hD / 2 + 4, hW / 2 + 4, 30], "Bahamas_SandstoneDeep"),
    sboxB([-hD / 2 - 5, -hW / 2 - 5, 790], [hD / 2 + 5, hW / 2 + 5, 840], "Bahamas_TileTeal"),
    sboxB([-hD / 2 - 6, -hW / 2 - 6, 776], [hD / 2 + 6, hW / 2 + 6, 790], "GoldTrim"),
    sboxB([-hD / 2 - 12, -hW / 2 - 12, 840], [hD / 2 + 12, hW / 2 + 12, 880], "SandstoneWarm", 3),
    crown(hD, hW, ht, hH + 70, "SandstoneWarm", merlon(64, ht, "SandstonePale"), 112, true),
  ), [hx, 0, P]));

  // the portal (iwan): a tall block before the hall with a great pointed niche
  const iw = 860, iH = 1200, ix0 = -460, ix1 = -200;
  parts.push(translate(facade(iw, iH, ix1 - ix0, [{ c: 0, w: 500, spring: 560, kind: "pointed", fill: "open" }], "SandstonePale"), [(ix0 + ix1) / 2, 0, P]));
  parts.push(translate(archRing("pointed", 500, 560, 34, 6, "Bahamas_TileTeal"), [ix0, 0, P]));
  parts.push(translate(archRing("pointed", 568, 560, 10, 8, "GoldTrim"), [ix0, 0, P]));
  parts.push(sboxB([ix0 - 4, -360, P], [ix0 + 2, -310, P + 1050], "Bahamas_TileCobalt"), sboxB([ix0 - 4, 310, P], [ix0 + 2, 360, P + 1050], "Bahamas_TileCobalt"));
  parts.push(sboxB([ix0 - 4, -360, P + 1000], [ix0 + 2, 360, P + 1050], "Bahamas_TileCobalt"), sboxB([ix0 - 6, -380, P + 1060], [ix0 + 2, 380, P + 1080], "GoldTrim"));
  for (const s of [-1, 1]) parts.push(translate(rotateY(cyl(36, 4, 12, [0, 0, 0], "Bahamas_TileSaffron"), -90), [ix0 - 1, s * 225, P + 960]));
  parts.push(sboxB([ix0 - 10, -iw / 2 - 10, P + iH - 50], [ix1 + 10, iw / 2 + 10, P + iH - 20], "SandstoneWarm", 3));
  parts.push(sboxB([ix0 - 4, -iw / 2 - 4, P + iH], [ix1 + 4, iw / 2 + 4, P + iH + 6], "SandstonePale"));
  for (let i = 0; i < 8; i++) for (const x of [ix0 + 22, ix1 - 22]) parts.push(translate(merlon(64, 44, "SandstonePale"), [x, -iw / 2 + 54 + i * ((iw - 108) / 7), P + iH + 6]));
  for (const s of [-1, 1]) {
    const tx = (ix0 + ix1) / 2, ty = s * (iw / 2 - 10), tz = P + iH - 20;
    parts.push(cyl(46, 130, 8, [tx, ty, tz], "SandstoneWarm"), cyl(52, 10, 8, [tx, ty, tz + 130], "GoldTrim"));
    parts.push(lathe(onion(50, 95), 12, "Bahamas_DomeTeal", [tx, ty, tz + 140]), cone(4, 0, 30, 6, [tx, ty, tz + 232], "GoldTrim"));
  }
  // a lamp hanging in the niche
  parts.push(hangLantern((ix0 + ix1) / 2, 0, P + 890, 150, 1.3));

  // drum and onion dome over the middle of the hall
  const z0 = P + hH;
  parts.push(rotateZ(cyl(470, 110, 8, [0, 0, 0], "SandstoneWarm"), 22.5).map((p) => ({ geo: p.geo.clone().translate(hx, 0, z0), mat: p.mat })));
  parts.push(cyl(476, 14, 8, [0, 0, 0], "SandstonePale").map((p) => ({ geo: p.geo.clone().rotateZ(Math.PI / 8).translate(hx, 0, z0 + 110), mat: p.mat })));
  parts.push(cyl(400, 260, 16, [hx, 0, z0 + 124], "SandstonePale"), cyl(406, 42, 16, [hx, 0, z0 + 330], "Bahamas_TileTeal"), cyl(414, 22, 16, [hx, 0, z0 + 372], "GoldTrim"));
  const dWin = merge(translate(prism(archOutline("pointed", 70, 70), [], 3, "yz", -2, "Bahamas_Shadow"), [-393, 0, z0 + 160]), translate(archRing("pointed", 70, 70, 9, 3, "Bahamas_TileTeal"), [-393, 0, z0 + 160]));
  for (let k = 0; k < 8; k++) parts.push(translate(rotateZ(dWin, 11.25 + 45 * k), [hx, 0, 0]));
  parts.push(lathe(onion(400, 700), 20, "Bahamas_DomeTeal", [hx, 0, z0 + 394]));
  parts.push(sphereCenter(42, [hx, 0, z0 + 1120], "GoldTrim", 12), sphereCenter(26, [hx, 0, z0 + 1180], "GoldTrim", 10), cone(9, 0, 130, 8, [hx, 0, z0 + 1195], "GoldTrim"));
  // turrets at the hall's corners
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const tx = hx + sx * (hD / 2 - 30), ty = sy * (hW / 2 - 30), tz = P + hH + 70;
    parts.push(cyl(64, 190, 8, [tx, ty, tz - 70], "SandstoneWarm"), cyl(70, 10, 8, [tx, ty, tz + 120], "GoldTrim"));
    parts.push(lathe(onion(66, 120), 12, "Bahamas_DomeTeal", [tx, ty, tz + 130]), cone(4, 0, 32, 6, [tx, ty, tz + 246], "GoldTrim"));
  }

  // the tall tower behind the +Y wing: square base, octagonal shaft, a balcony, a lantern storey
  const mx = 720, my = 830;
  parts.push(sboxB([mx - 150, my - 150, P], [mx + 150, my + 150, P + 640], "SandstoneWarm"));
  parts.push(sboxB([mx - 154, my - 154, P + 580], [mx + 154, my + 154, P + 620], "Bahamas_TileTeal"), sboxB([mx - 162, my - 162, P + 620], [mx + 162, my + 162, P + 650], "SandstonePale", 3));
  parts.push(translate(merge(prism(archOutline("round", 90, 150), [], 4, "yz", -2, "DoorWood"), archRing("round", 90, 150, 12, 4, "SandstonePale")), [mx - 150, my, P]));
  parts.push(cyl(122, 960, 8, [mx, my, P + 650], "SandstonePale"));
  for (const z of [P + 950, P + 1300]) parts.push(cyl(126, 34, 8, [mx, my, z], "Bahamas_TileTeal"));
  parts.push(cone(122, 180, 60, 8, [mx, my, P + 1550], "SandstoneWarm"), cyl(184, 16, 8, [mx, my, P + 1610], "SandstonePale"));
  parts.push(lathe([[170, 0], [182, 0], [182, 64], [170, 64]], 8, "SandstoneWarm", [mx, my, P + 1626]), cyl(186, 8, 8, [mx, my, P + 1690], "SandstonePale"));
  parts.push(cyl(96, 330, 8, [mx, my, P + 1626], "SandstonePale"));
  const mWin = translate(prism(archOutline("pointed", 54, 110), [], 3, "yz", -2, "Bahamas_Shadow"), [-89, 0, P + 1740]);
  for (let k = 0; k < 8; k += 2) parts.push(translate(rotateZ(mWin, 22.5 + 45 * k), [mx, my, 0]));
  parts.push(cyl(120, 24, 8, [mx, my, P + 1956], "SandstoneWarm"), cyl(110, 14, 8, [mx, my, P + 1980], "GoldTrim"));
  parts.push(lathe(onion(100, 230), 12, "Bahamas_DomeTeal", [mx, my, P + 1994]), sphereCenter(18, [mx, my, P + 2240], "GoldTrim", 8), cone(5, 0, 70, 6, [mx, my, P + 2252], "GoldTrim"));

  // arcaded wings either side of the forecourt, opening onto it
  const wing = (): Geo => merge(
    shell(360, 800, 560, 40, { front: [-250, 0, 250].map((c) => ({ c, w: 180, spring: 210, kind: "pointed" as Arch, fill: "open" as Fill, tw: 16 })), back: [-250, 250].map((c) => ({ c, w: 70, z0: 200, spring: 90, kind: "pointed" as Arch, fill: "grille" as Fill, tw: 8 })) }, "SandstonePale", "Bahamas_TileTeal"),
    sboxB([-140, -360, 480], [140, 360, 500], "SandstonePale"),
    sboxB([-186, -406, 440], [186, 406, 470], "SandstoneWarm", 2),
    crown(360, 800, 40, 560, "SandstoneWarm", merlon(54, 40, "SandstonePale"), 100),
    ...[-250, 0, 250].map((c) => hangLantern(0, c, 480, 60, 0.8)),
    translate(rug(120, 700, "FeltRed", "FabricGold", "FabricNavy"), [90, 0, 0]),
  );
  for (const s of [-1, 1]) parts.push(translate(rotateZ(wing(), s > 0 ? 90 : -90), [-660, s * 880, P]));
  return merge(...parts);
}

// A clipped orange tree in a tiled sandstone planter, standing at `at`.
function orangeTree(at: V3): Geo {
  const fruit: Geo[] = [];
  for (let k = 0; k < 9; k++) {
    const a = k * 2.4, e = 0.2 + (k % 3) * 0.3;
    fruit.push(sphereCenter(6, [Math.cos(a) * Math.cos(e) * 56, Math.sin(a) * Math.cos(e) * 56, 205 + Math.sin(e) * 50], "Bahamas_Orange", 6));
  }
  return translate(merge(
    sboxAt([96, 96, 56], [0, 0, 0], "SandstoneWarm", 3),
    sboxAt([100, 100, 12], [0, 0, 30], "Bahamas_TileTeal", 1),
    sboxAt([104, 104, 8], [0, 0, 56], "SandstonePale", 2),
    cyl(42, 2, 10, [0, 0, 62], "WoodDark"),
    cylinderBetween([0, 0, 60], [0, 0, 170], 7, 8, "BarkWarm", 5),
    scale(sphereCenter(60, [0, 0, 0], "LeafGreen", 12), [1, 1, 0.9]).map((p) => ({ geo: p.geo.clone().translate(0, 0, 205), mat: p.mat })),
    ...fruit,
  ), at);
}

// An onion dome's profile, r at its foot, h tall.
function onion(r: number, h: number): P2[] {
  return [[1, 0], [1.1, 0.1], [1.18, 0.24], [1.15, 0.38], [1.0, 0.52], [0.74, 0.66], [0.46, 0.78], [0.24, 0.88], [0.1, 0.95], [0, 1]].map(([a, b]): P2 => [a * r, b * h]);
}

// ======================================================================================
// defence
// ======================================================================================

// หอคอยยาม: a tapering square watchtower with a striped canopy and a pennant; it also serves as
// the corner tower of the city wall (its 3.8 m base takes the 3 m wall).
function watchtower(): Geo {
  const parts: Geo[] = [
    sboxAt([416, 416, 60], [0, 0, 0], "Bahamas_SandstoneDeep", 3),
    pyramid(380, 340, 900, [0, 0, 0], "SandstoneWarm"),
    sboxAt([372, 372, 16], [0, 0, 440], "SandstonePale", 2),
    sboxAt([404, 404, 44], [0, 0, 876], "SandstonePale", 3),
  ];
  // corbels under the top
  for (let i = 0; i < 9; i++) {
    const u = -160 + i * 40;
    for (const [x, y, r] of [[-180, u, 0], [180, u, 0], [u, -180, 90], [u, 180, 90]] as [number, number, number][])
      parts.push(translate(rotateZ(sboxAt([22, 18, 34], [0, 0, 0], "SandstonePale", 1.5), r), [x + Math.sign(x) * 6, y + Math.sign(y) * 6, 842]));
  }
  // the parapet and merlons, a striped canopy on four posts, a pennant
  parts.push(crown(404, 404, 26, 920, "SandstonePale", merlon(50, 26, "SandstoneWarm"), 80));
  for (const [x0, y0, x1, y1] of [[-202, -202, -176, 202], [176, -202, 202, 202], [-176, -202, 176, -176], [-176, 176, 176, 202]]) parts.push(sboxB([x0, y0, 920], [x1, y1, 990], "SandstoneWarm"));
  parts.push(boxBounds([-176, -176, 920], [176, 176, 928], "WoodShade"));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(boxAt([12, 12, 220], [sx * 150, sy * 150, 928], "WoodDark", 1.5));
  parts.push(pyramid(400, 0, 170, [0, 0, 1148], "FabricSand"));
  for (const [x, y] of [[-200, -200], [-200, 200], [200, -200], [200, 200]]) parts.push(beamBetween([x, y, 1148], [0, 0, 1318], 18, 3, "FabricRed"));
  for (const [x, y] of [[-200, 0], [200, 0], [0, -200], [0, 200]]) parts.push(beamBetween([x, y, 1148], [0, 0, 1318], 40, 3, "FabricRed"));
  for (let i = 0; i < 4; i++) parts.push(rotateZ(merge(boxAt([4, 400, 22], [-200, 0, 1126], "FabricRed"), ...Array.from({ length: 10 }, (_, k) => translate(rotateX(box([3, 22, 22], [0, 0, 0], k % 2 ? "FabricGold" : "FabricRed"), 45), [-200, -180 + k * 40, 1126]))), 90 * i));
  parts.push(sphereCenter(12, [0, 0, 1320], "GoldTrim", 8), cylinderBetween([0, 0, 1310], [0, 0, 1500], 3, 6, "WoodDark"));
  parts.push(sheet([[0, 0, 1495], [0, 0, 1440], [0, -110, 1470]], "FabricRed"));
  // door, slit windows
  parts.push(translate(merge(prism(archOutline("round", 100, 150), [], 8, "yz", -4, "DoorWood"), archRing("round", 100, 150, 14, 6, "SandstonePale"), boxAt([4, 96, 7], [-6, 0, 40], "IronDark"), boxAt([4, 96, 7], [-6, 0, 120], "IronDark")), [-189, 0, 60]));
  for (const r of [0, 90, 180, 270]) for (const z of [380, 640]) {
    if (r === 0 && z === 380) continue;
    const half = 190 - (20 * (z + 35)) / 900;
    parts.push(rotateZ(boxAt([6, 16, 70], [-half, 0, z], "Bahamas_Shadow"), r));
  }
  return merge(...parts);
}

// กำแพงเมือง (8 ม.): a sandstone wall segment 8 m long along Y, 3 m thick, stepped merlons on the
// outer (-X) parapet, a walk behind; tiles end to end along Y.
function cityWall(): Geo {
  const L = 800, H = 560;
  const parts: Geo[] = [
    sboxB([-150, -L / 2, 0], [150, L / 2, H], "SandstoneWarm"),
    sboxB([-172, -L / 2, 0], [-150, L / 2, 90], "Bahamas_SandstoneDeep"),
    sboxB([150, -L / 2, 0], [168, L / 2, 70], "Bahamas_SandstoneDeep"),
    sboxB([-156, -L / 2, 470], [-150, L / 2, 486], "SandstonePale"),
    sboxB([-150, -L / 2, H], [-100, L / 2, H + 90], "SandstoneWarm"),
    sboxB([-156, -L / 2, H + 90], [-94, L / 2, H + 98], "SandstonePale"),
    sboxB([120, -L / 2, H], [150, L / 2, H + 50], "SandstoneWarm"),
    sboxB([116, -L / 2, H + 50], [154, L / 2, H + 56], "SandstonePale"),
    sboxB([-100, -L / 2, H], [120, L / 2, H + 3], "Bahamas_PaverA"),
    // a buttress in the middle of the outer face, its top sloping back into the wall
    sboxB([-200, -60, 0], [-150, 60, 470], "SandstoneWarm"),
    sboxB([-208, -68, 470], [-150, 68, 486], "SandstonePale", 2),
    prism([[-200, 486], [-150, 486], [-150, 548]], [], 120, "xz", -60, "SandstoneWarm"),
  ];
  for (let i = 0; i < 8; i++) parts.push(translate(merlon(58, 50, "SandstonePale"), [-125, -L / 2 + 50 + i * 100, H + 98]));
  for (let i = 0; i < 8; i++) {
    const y = -L / 2 + i * 100;
    if (i > 0) parts.push(boxAt([2, 10, 52], [-151, y, H + 20], "Bahamas_Shadow"));
    if (Math.abs(y + 50) > 80) parts.push(cylinderBetween([-186, y + 50, 380], [-140, y + 50, 380], 6, 7, "WoodDark"));
  }
  return merge(...parts);
}

// ประตูเมืองซุ้มโค้ง: the city gate: a great pointed arch through a tiled gate block between two
// round towers with banners; its doors stand open. Nominal length 12 m along Y (the wall joins
// at y = ±600), towers reach to ±700.
function cityGate(): Geo {
  const T = 360, Hb = 760, w = 360, sp = 330, half = 320;
  const parts: Geo[] = [];
  parts.push(translate(facade(half * 2, Hb, T, [{ c: 0, w, spring: sp, kind: "pointed", fill: "open" }], "SandstoneWarm"), [0, 0, 0]));
  parts.push(sboxB([-T / 2 - 22, -half, 0], [-T / 2, -w / 2 - 50, 90], "Bahamas_SandstoneDeep"), sboxB([-T / 2 - 22, w / 2 + 50, 0], [-T / 2, half, 90], "Bahamas_SandstoneDeep"));
  parts.push(sboxB([T / 2, -half, 0], [T / 2 + 22, -w / 2 - 50, 90], "Bahamas_SandstoneDeep"), sboxB([T / 2, w / 2 + 50, 0], [T / 2 + 22, half, 90], "Bahamas_SandstoneDeep"));
  // both faces: tiled arch moulding, gold line, cobalt frame, a sun disc
  const face = merge(
    archRing("pointed", w, sp, 28, 6, "Bahamas_TileTeal"),
    archRing("pointed", w + 56, sp, 8, 8, "GoldTrim"),
    sboxB([-4, -w / 2 - 70, 0], [2, -w / 2 - 44, 650], "Bahamas_TileCobalt"),
    sboxB([-4, w / 2 + 44, 0], [2, w / 2 + 70, 650], "Bahamas_TileCobalt"),
    sboxB([-4, -w / 2 - 70, 624], [2, w / 2 + 70, 650], "Bahamas_TileCobalt"),
    translate(rotateY(cyl(34, 4, 16, [0, 0, 0], "GoldTrim"), -90), [-2, 0, 700]),
    translate(rotateY(cyl(24, 4, 16, [0, 0, 0], "Bahamas_TileSaffron"), -90), [-5, 0, 700]),
  );
  parts.push(translate(face, [-T / 2, 0, 0]), translate(rotateZ(face, 180), [T / 2, 0, 0]));
  parts.push(sboxB([-T / 2 - 12, -half, Hb - 30], [T / 2 + 12, half, Hb], "SandstonePale", 3));
  for (const s of [-1, 1]) parts.push(sboxB([s > 0 ? T / 2 - 40 : -T / 2, -half, Hb], [s > 0 ? T / 2 : -T / 2 + 40, half, Hb + 60], "SandstoneWarm"));
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) parts.push(translate(merlon(56, 40, "SandstonePale"), [s * (T / 2 - 20), -half + 53 + i * 107, Hb + 60]));
  parts.push(sboxB([-T / 2 + 40, -half, Hb], [T / 2 - 40, half, Hb + 3], "Bahamas_PaverA"));
  // the passage: paving, a hanging lamp, the two door leaves swung open inwards (+X)
  parts.push(sboxB([-T / 2, -w / 2, 0], [T / 2, w / 2, 3], "Bahamas_PaverB"));
  parts.push(hangLantern(0, 0, archApex("pointed", w, sp) - 4, 70, 1.1));
  const leaf = merge(
    boxBounds([0, -174, 0], [9, 0, 340], "DoorWood", 1),
    ...[50, 170, 290].map((z) => boxBounds([-2, -170, z], [0, -4, z + 10], "IronDark")),
    translate(rotateY(torus(9, 2, 10, 4, "Bronze"), 90), [-3, -150, 160]),
  );
  parts.push(translate(rotateZ(leaf, 72), [120, w / 2 - 2, 3]), translate(rotateZ(scale(leaf, [1, -1, 1]), -72), [120, -w / 2 + 2, 3]));
  // round towers
  for (const s of [-1, 1]) {
    const ty = s * 480, R = 220;
    parts.push(cyl(242, 80, 12, [0, ty, 0], "Bahamas_SandstoneDeep"), cyl(R, 1000, 12, [0, ty, 0], "SandstoneWarm"));
    parts.push(cyl(R + 5, 14, 12, [0, ty, 520], "SandstonePale"), cone(R, R + 26, 40, 12, [0, ty, 900], "SandstonePale"), cyl(R + 26, 70, 12, [0, ty, 940], "SandstoneWarm"), cyl(R + 30, 8, 12, [0, ty, 1010], "SandstonePale"));
    for (let k = 0; k < 12; k++) parts.push(translate(rotateZ(translate(merlon(58, 34, "SandstonePale"), [-(R + 12), 0, 0]), 15 + 30 * k), [0, ty, 1018]));
    parts.push(boxAt([80, 80, 8], [60, ty - s * 40, 1018], "WoodDark", 2), boxAt([86, 6, 10], [60, ty - s * 40, 1018], "IronDark"));
    parts.push(cylinderBetween([-60, ty + s * 60, 1018], [-60, ty + s * 60, 1330], 4, 6, "WoodDark"), sphereCenter(8, [-60, ty + s * 60, 1334], "GoldTrim", 8));
    parts.push(sheet([[-60, ty + s * 60, 1324], [-60, ty + s * 60, 1254], [-60, ty + s * 60 + s * 150, 1290]], "FabricRed"));
    // banner on the outer face, a small window, slits
    parts.push(boxBounds([-R - 8, ty - 46, 520], [-R - 5, ty + 46, 900], "FabricRed"), boxBounds([-R - 10, ty - 52, 896], [-R - 4, ty + 52, 906], "GoldTrim"));
    parts.push(boxBounds([-R - 9, ty - 46, 534], [-R - 8, ty + 46, 548], "FabricGold"), translate(rotateX(box([3, 40, 40], [0, 0, 0], "FabricRed"), 45), [-R - 6.5, ty, 520]));
    parts.push(translate(rotateX(box([2, 34, 34], [0, 0, 0], "GoldTrim"), 45), [-R - 9, ty, 760]));
    for (const a of [140, 220, 180 + s * 75]) parts.push(translate(rotateZ(boxAt([6, 12, 60], [-(R - 3), 0, 300], "Bahamas_Shadow"), a - 180), [0, ty, 0]));
    for (const a of [140, 220]) parts.push(translate(rotateZ(boxAt([6, 12, 60], [-(R - 3), 0, 660], "Bahamas_Shadow"), a - 180), [0, ty, 0]));
  }
  return merge(...parts);
}

// ======================================================================================
// market and trade
// ======================================================================================

// เต็นท์กองคาราวาน: a big striped caravan tent, open at the front, rugs and cushions inside, a
// lamp from the ridge, guy ropes and stakes.
function caravanTent(): Geo {
  const D = 500, W = 700, ridge = 400, eave = 200, over = 22;
  const parts: Geo[] = [];
  const pole = (x: number, y: number, h: number) => cylinderBetween([x, y, 0], [x, y, h], 6, 8, "WoodDark");
  for (const y of [-220, 220]) parts.push(pole(0, y, ridge + 30), sphereCenter(10, [0, y, ridge + 36], "GoldTrim", 8));
  for (const x of [-D / 2, D / 2]) for (const y of [-W / 2, W / 2]) parts.push(pole(x, y, eave));
  parts.push(pole(D / 2, 0, eave));
  // roof: stripes down both slopes; gables; ridge roll
  const drop = (over * (ridge - eave)) / (D / 2);
  for (const s of [-1, 1]) for (let i = 0; i < 14; i++) {
    const y = -W / 2 + 25 + i * 50;
    parts.push(beamBetween([0, y, ridge + 2], [s * (D / 2 + over), y, eave - drop], 50, 3, (i + (s > 0 ? 1 : 0)) % 2 ? "FabricRed" : "FabricSand"));
  }
  for (const s of [-1, 1]) parts.push(translate(rotateZ(gableWall(0, D / 2, eave, ridge - eave, "FabricSand"), 90), [0, s * W / 2, 0]));
  parts.push(cylinderBetween([0, -W / 2 - 6, ridge + 4], [0, W / 2 + 6, ridge + 4], 7, 8, "Bahamas_FabricMaroon"));
  // walls: back in vertical stripes, sides plain with a red hem
  for (let i = 0; i < 14; i++) parts.push(boxAt([3, 50, eave], [D / 2 + 2, -W / 2 + 25 + i * 50, 0], i % 2 ? "FabricRed" : "FabricSand"));
  for (const s of [-1, 1]) parts.push(boxAt([D, 3, eave], [0, s * (W / 2 + 2), 0], "FabricSand"), boxAt([D, 4, 26], [0, s * (W / 2 + 3), 0], "FabricRed"));
  // front: valance with a row of pointed flaps, the door curtains tied back
  parts.push(boxBounds([-D / 2 - over - 2, -W / 2 - 6, eave - drop - 26], [-D / 2 - over + 2, W / 2 + 6, eave - drop], "FabricRed"));
  for (let k = 0; k < 17; k++) parts.push(translate(rotateX(box([3, 24, 24], [0, 0, 0], k % 2 ? "FabricRed" : "FabricGold"), 45), [-D / 2 - over, -W / 2 + 10 + k * 42.5, eave - drop - 26]));
  for (const s of [-1, 1]) {
    parts.push(cylinderBetween([-D / 2 - 4, s * (W / 2 - 30), eave - 10], [-D / 2 - 4, s * (W / 2 - 60), 10], 14, 8, "FabricSand", 6));
    parts.push(translate(torus(10, 3, 10, 4, "RopeTan"), [-D / 2 - 4, s * (W / 2 - 50), 70]));
  }
  // inside: rugs, cushions, a low table with tea, a hanging lamp
  parts.push(translate(rug(440, 640, "FeltRed", "FabricGold", "FabricNavy"), [0, 0, 0]));
  parts.push(translate(rug(160, 240, "FabricNavy", "FabricWhite", "FeltRed"), [-40, 0, 2.2]));
  const cols = ["FabricGold", "FabricPurple", "FabricRed", "Bahamas_FabricTeal"];
  for (let i = 0; i < 6; i++) parts.push(cushion(38, [195, -250 + i * 100, 2], cols[i % 4]));
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) parts.push(cushion(34, [-90 + i * 100, s * 290, 2], cols[(i + 1) % 4]));
  parts.push(boxAt([90, 90, 6], [40, 0, 28], "WoodDark", 1.5), ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b]) => boxAt([7, 7, 28], [40 + a * 38, b * 38, 2], "WoodDark")));
  parts.push(teapot([30, -10, 34]), cyl(4, 6, 8, [55, 20, 34], "GoldTrim"), cyl(4, 6, 8, [62, -5, 34], "GoldTrim"), cyl(4, 6, 8, [20, 25, 34], "GoldTrim"));
  parts.push(hangLantern(0, 0, ridge - 4, 60, 0.9));
  // guy ropes and stakes; a chest and sacks by the door
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const top: V3 = [sx * D / 2, sy * W / 2, eave], stake: V3 = [sx * (D / 2 + 90), sy * (W / 2 + 90), 0];
    parts.push(cylinderBetween(top, [stake[0], stake[1], 18], 1.4, 4, "RopeTan"), boxAt([6, 6, 24], stake, "WoodDark"));
  }
  for (const y of [-220, 220]) parts.push(cylinderBetween([0, y, ridge + 20], [0, y + Math.sign(y) * 160, 0], 1.4, 4, "RopeTan"));
  parts.push(boxAt([70, 45, 40], [-D / 2 - 70, -W / 2 + 40, 0], "WoodDark", 2), boxAt([72, 47, 6], [-D / 2 - 70, -W / 2 + 40, 28], "Bronze"), boxAt([4, 12, 10], [-D / 2 - 106, -W / 2 + 40, 24], "GoldTrim"));
  parts.push(translate(sack(60), [-D / 2 - 60, W / 2 - 50, 0]), translate(sack(50, "FabricWhite"), [-D / 2 - 110, W / 2 - 80, 0]));
  // outside the door: a rug in the open with cushions, a tea tray and a small fire
  const ox = -D / 2 - 120;
  parts.push(translate(rug(170, 300, "Bahamas_FabricMaroon", "FabricGold", "Bahamas_FabricTeal"), [ox, 20, 0]));
  parts.push(cushion(30, [ox + 50, -80, 2], "FabricGold"), cushion(30, [ox + 55, 110, 2], "Bahamas_FabricSaffron"), cushion(28, [ox - 50, 120, 2], "FabricPurple"));
  parts.push(cyl(36, 3, 14, [ox, 20, 2], "Bronze"), teapot([ox - 5, 15, 5]), cyl(3.5, 6, 8, [ox + 15, 40, 5], "GoldTrim"), cyl(3.5, 6, 8, [ox - 18, 42, 5], "GoldTrim"));
  for (let k = 0; k < 7; k++) parts.push(translate(scale(sphereCenter(10, [0, 0, 0], "StoneGrey", 6), [1.1, 0.9, 0.6]), [ox - 110 + Math.cos((k / 7) * Math.PI * 2) * 32, -200 + Math.sin((k / 7) * Math.PI * 2) * 32, 2]));
  parts.push(cone(18, 0, 34, 6, [ox - 110, -200, 0], "FireGlow"), cone(10, 0, 22, 5, [ox - 100, -190, 0], "FireGlow"), cylinderBetween([ox - 130, -215, 6], [ox - 90, -185, 4], 4, 6, "WoodDark"));
  return merge(...parts);
}

// ผ้าใบบังแดด: a striped sun sail on four poles over a rug, with cushions and a tea tray.
function shadeSail(): Geo {
  const parts: Geo[] = [];
  const hx = 160, hy = 180, zf = 236, zb = 286;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const z = sx < 0 ? zf : zb;
    parts.push(cylinderBetween([sx * hx, sy * hy, 0], [sx * hx, sy * hy, z + 10], 5, 8, "WoodDark"), sphereCenter(7, [sx * hx, sy * hy, z + 12], "GoldTrim", 8));
    parts.push(cylinderBetween([sx * hx, sy * hy, z + 6], [sx * (hx + 80), sy * (hy + 80), 0], 1.2, 4, "RopeTan"), boxAt([5, 5, 16], [sx * (hx + 80), sy * (hy + 80), 0], "WoodDark"));
  }
  const strips = ["Bahamas_FabricTeal", "FabricSand", "Bahamas_FabricTeal", "FabricSand", "Bahamas_FabricTeal"];
  strips.forEach((m, i) => parts.push(beamBetween([-hx - 20, -hy - 10 + 76 * i + 38, zf - 2], [hx + 20, -hy - 10 + 76 * i + 38, zb + 4], 76, 2.5, m)));
  for (let k = 0; k < 10; k++) parts.push(translate(rotateX(box([3, 22, 22], [0, 0, 0], k % 2 ? "FabricSand" : "Bahamas_FabricTeal"), 45), [-hx - 20, -hy + 10 + k * 38, zf - 3]));
  parts.push(translate(rug(260, 300, "FeltRed", "FabricGold", "Bahamas_FabricTeal"), [0, 0, 0]));
  parts.push(cushion(34, [90, -100, 2], "FabricGold"), cushion(34, [90, 0, 2], "Bahamas_FabricSaffron"), cushion(34, [90, 100, 2], "FabricPurple"));
  parts.push(cyl(14, 26, 8, [-10, 0, 2], "WoodDark"), cyl(42, 3, 16, [-10, 0, 28], "Bronze"), teapot([-15, -10, 31]), cyl(4, 6, 8, [5, 18, 31], "GoldTrim"), cyl(4, 6, 8, [-30, 20, 31], "GoldTrim"));
  parts.push(pot("jar", "Bahamas_Clay", 1, [hx - 20, hy + 30, 0]));
  return merge(...parts);
}

// แผงพรมและเครื่องปั้น: a bazaar stall: a counter, a striped awning, rugs hanging at the back and
// over the side rail, pots on the counter and on the ground.
function bazaarStall(): Geo {
  const parts: Geo[] = [];
  const W = 320, xf = -100, xb = 100;
  for (const y of [-W / 2, W / 2]) parts.push(boxAt([9, 9, 240], [xf, y, 0], "WoodDark", 1.5), boxAt([9, 9, 285], [xb, y, 0], "WoodDark", 1.5));
  parts.push(beamBetween([xf, -W / 2 - 6, 236], [xf, W / 2 + 6, 236], 8, 8, "WoodDark"), beamBetween([xb, -W / 2 - 6, 280], [xb, W / 2 + 6, 280], 8, 8, "WoodDark"));
  for (const y of [-W / 2, W / 2]) parts.push(beamBetween([xf - 4, y, 238], [xb + 4, y, 282], 7, 7, "WoodDark"));
  // awning stripes running down to the front, pointed flaps
  for (let i = 0; i < 8; i++) {
    const y = -W / 2 - 10 + 21 + i * 42.5;
    parts.push(beamBetween([xb + 14, y, 290], [xf - 55, y, 226], 42.5, 2.5, i % 2 ? "FabricSand" : "FabricRed"));
  }
  for (let k = 0; k < 9; k++) parts.push(translate(rotateX(box([3, 22, 22], [0, 0, 0], k % 2 ? "FabricRed" : "FabricGold"), 45), [xf - 55, -W / 2 - 4 + k * 42, 224]));
  // counter with a framed front and a top board
  parts.push(boxAt([50, W - 20, 86], [xf + 15, 0, 0], "WoodWarm", 2), boxAt([62, W - 4, 6], [xf + 15, 0, 86], "WoodShade", 1.5));
  for (const y of [-100, 0, 100]) parts.push(boxBounds([xf - 12, y - 42, 12], [xf - 9, y + 42, 74], "WoodShade", 0.5), translate(rotateX(box([2, 26, 26], [0, 0, 0], "GoldTrim"), 45), [xf - 12, y, 43]));
  // the back: a rail with three rugs
  parts.push(cylinderBetween([xb - 6, -W / 2, 255], [xb - 6, W / 2, 255], 3, 6, "WoodDark"));
  parts.push(hangRug(200, 96, [xb - 9, -104, 255], "FeltRed", "FabricGold", "FabricNavy"), hangRug(210, 96, [xb - 9, 0, 255], "FabricNavy", "FeltCream", "FeltRed"), hangRug(190, 96, [xb - 9, 104, 255], "Bahamas_FabricMaroon", "FabricGold", "Bahamas_FabricTeal"));
  // a rug folded over the side rail
  parts.push(beamBetween([xf, W / 2 + 4, 150], [xb, W / 2 + 4, 150], 5, 5, "WoodDark"));
  parts.push(boxBounds([xf + 10, W / 2 - 4, 151], [xb - 10, W / 2 + 12, 154], "Bahamas_FabricTeal"));
  for (const s of [-1, 1]) parts.push(boxBounds([xf + 10, W / 2 + 4 + s * 8 - 1.5, 40], [xb - 10, W / 2 + 4 + s * 8 + 1.5, 152], "Bahamas_FabricTeal"), boxBounds([xf + 18, W / 2 + 4 + s * 9.6 - 0.6, 50], [xb - 18, W / 2 + 4 + s * 9.6 + 0.6, 140], "FabricGold"));
  // goods: folded rugs and pots on the counter, big jars in front
  ["FeltRed", "FabricNavy", "FabricGold", "Bahamas_FabricMaroon"].forEach((m, i) => parts.push(boxAt([44, 70, 7], [xf + 15, -90, 92 + i * 7], m, 1)));
  parts.push(pot("jug", "Bahamas_GlazeBlue", 0.8, [xf + 15, 20, 92]), pot("jar", "Bahamas_ClayPale", 0.7, [xf + 15, 70, 92]), pot("bowl", "Bahamas_GlazeGreen", 1, [xf + 15, 120, 92]));
  parts.push(pot("amphora", "Bahamas_Clay", 0.9, [xf - 60, -120, 0]), pot("urn", "Bahamas_GlazeBlue", 0.75, [xf - 70, 10, 0]), pot("jar", "Bahamas_ClayPale", 0.9, [xf - 55, 120, 0]));
  parts.push(translate(rotateX(cylinderBetween([0, 0, 0], [0, 0, 150], 13, 10, "Bahamas_FabricMaroon"), 14), [xf + 60, -W / 2 - 20, 0]));
  return merge(...parts);
}

// แผงเครื่องเทศและผลไม้: a spice and fruit stall: baskets heaped with spices on a stepped table,
// crates of oranges and dates, a brass balance, strings of chillies under a striped canopy.
function spiceStall(): Geo {
  const parts: Geo[] = [];
  const W = 300;
  for (const x of [-100, 100]) for (const y of [-W / 2, W / 2]) parts.push(boxAt([8, 8, 250], [x, y, 0], "WoodDark", 1.5));
  for (let i = 0; i < 6; i++) parts.push(beamBetween([-130, -W / 2 - 10 + 26.7 + i * 53.3, 244], [130, -W / 2 - 10 + 26.7 + i * 53.3, 262], 53.3, 2.5, i % 2 ? "FabricWhite" : "FabricGold"));
  parts.push(beamBetween([-100, -W / 2 - 6, 246], [-100, W / 2 + 6, 246], 7, 7, "WoodDark"), beamBetween([100, -W / 2 - 6, 258], [100, W / 2 + 6, 258], 7, 7, "WoodDark"));
  for (let k = 0; k < 9; k++) parts.push(translate(rotateX(box([3, 20, 20], [0, 0, 0], k % 2 ? "FabricGold" : "FabricRed"), 45), [-130, -W / 2 + 4 + k * 37, 242]));
  // a stepped table: low front, high back
  parts.push(boxAt([80, W - 30, 62], [-50, 0, 0], "WoodWarm", 2), boxAt([84, W - 26, 5], [-50, 0, 62], "WoodShade", 1));
  parts.push(boxAt([70, W - 30, 95], [30, 0, 0], "WoodWarm", 2), boxAt([74, W - 26, 5], [30, 0, 95], "WoodShade", 1));
  const basket = (spice: string, at: V3): Geo => translate(merge(
    lathe([[0, 0], [22, 0], [27, 16], [28, 19], [25, 19], [0, 18]], 9, "Bahamas_Wicker"),
    cone(24, 3, 22, 9, [0, 0, 17], spice),
  ), at);
  const spices = ["Bahamas_SpiceRed", "Bahamas_SpiceYellow", "Bahamas_SpiceGreen", "Bahamas_SpiceBrown", "Bahamas_SpiceYellow", "Bahamas_SpiceRed"];
  spices.forEach((m, i) => parts.push(basket(m, [30, -112 + i * 45, 100])));
  ["Bahamas_SpiceBrown", "Bahamas_SpiceGreen"].forEach((m, i) => parts.push(basket(m, [-58, -112 + i * 54, 67])));
  // a crate of oranges and one of dates on the low table, a balance
  const crate = (fruit: string, r: number, at: V3, nx: number, ny: number): Geo => {
    const g: Geo[] = [boxAt([nx * r * 2 + 8, ny * r * 2 + 8, 3], [0, 0, 0], "WoodPale")];
    for (const s of [-1, 1]) g.push(boxAt([4, ny * r * 2 + 8, 14], [s * (nx * r + 2), 0, 0], "WoodPale"), boxAt([nx * r * 2, 4, 14], [0, s * (ny * r + 2), 0], "WoodPale"));
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) g.push(sphereCenter(r, [-nx * r + r + i * 2 * r, -ny * r + r + j * 2 * r, 3 + r + ((i + j) % 2) * 2], fruit, 6));
    return translate(merge(...g), at);
  };
  parts.push(crate("Bahamas_Orange", 6, [-62, 60, 67], 4, 5), crate("Bahamas_Date", 5, [-62, 115, 67], 4, 4));
  const pan = (y: number) => merge(lathe([[0, 0], [12, 1], [15, 4], [14, 4], [0, 2]], 10, "Bronze", [0, y, 0]), ...[-1, 1].map((s) => cylinderBetween([s * 10, y, 3], [0, y, 34], 0.5, 3, "Bronze")));
  parts.push(translate(merge(cyl(5, 3, 8, [0, 0, 0], "Bronze"), cylinderBetween([0, 0, 0], [0, 0, 52], 1.5, 6, "Bronze"), cylinderBetween([0, -26, 52], [0, 26, 52], 1.2, 6, "Bronze"), translate(pan(-26), [0, 0, 18]), translate(pan(26), [0, 0, 18])).map((p) => ({ geo: p.geo.clone().rotateZ(Math.PI / 2), mat: p.mat })), [-55, -6, 67]));
  // chillies and garlic hanging from the front beam
  for (const [y, m] of [[-110, "Bahamas_SpiceRed"], [-40, "FabricWhite"], [40, "Bahamas_SpiceRed"], [110, "FabricWhite"]] as [number, string][]) {
    parts.push(cylinderBetween([-100, y, 244], [-100, y, 170], 0.6, 3, "RopeTan"));
    for (let k = 0; k < 6; k++) {
      const at: V3 = [-100 + (k % 2 ? 3 : -3), y + (k % 3) * 2 - 2, 225 - k * 9];
      parts.push(m === "FabricWhite" ? sphereCenter(6, at, m, 5) : cone(0.3, 3.5, 12, 5, [at[0], at[1], at[2] - 6], m));
    }
  }
  // sacks of grain and a sack of chillies on the ground
  parts.push(translate(sack(58), [-150, -110, 0]), translate(sack(50, "FabricWhite"), [-150, 125, 0]), translate(merge(sack(46), cone(16, 2, 10, 8, [0, 0, 45], "Bahamas_SpiceRed")), [-155, 60, 0]));
  return merge(...parts);
}

// กองพรมม้วน: a pile of rolled rugs on a spread rug, one leaning, one over a wooden rack.
function rugPile(): Geo {
  const parts: Geo[] = [translate(rug(200, 300, "FeltRed", "FabricGold", "FabricNavy"), [0, -20, 0])];
  const roll = (r: number, len: number, mat: string, at: V3, yaw: number): Geo => translate(rotateZ(merge(
    cylinderBetween([0, -len / 2, 0], [0, len / 2, 0], r, 12, mat),
    ...[-1, 1].map((s) => cylinderBetween([0, s * len / 2, 0], [0, s * (len / 2 + 0.6), 0], r * 0.3, 8, "Bahamas_Shadow")),
    ...[-1, 1].map((s) => cylinderBetween([0, s * len * 0.42, 0], [0, s * (len * 0.42 + 8), 0], r + 0.5, 12, "FabricGold")),
  ), yaw), at);
  parts.push(roll(18, 210, "FabricNavy", [-50, -20, 20], 0), roll(18, 220, "Bahamas_FabricMaroon", [-14, -20, 20], 0), roll(17, 200, "Bahamas_FabricTeal", [21, -20, 19], 0));
  parts.push(roll(16, 190, "FeltRed", [-32, -20, 50], 3), roll(15, 180, "FabricGold", [4, -20, 50], -2));
  parts.push(translate(rotateX(roll(14, 170, "FabricPurple", [0, 0, 0], 0), 0), [0, 0, 0]).map((p) => ({ geo: p.geo.clone().rotateX(Math.PI / 2 - 0.3).translate(80, 150, 85), mat: p.mat })));
  // a rack with a rug thrown over it
  const rx = 110, ry = -40;
  for (const y of [-80, 80]) parts.push(beamBetween([rx - 30, ry + y, 0], [rx, ry + y, 110], 6, 6, "WoodDark"), beamBetween([rx + 30, ry + y, 0], [rx, ry + y, 110], 6, 6, "WoodDark"));
  parts.push(cylinderBetween([rx, ry - 90, 112], [rx, ry + 90, 112], 3, 6, "WoodDark"));
  parts.push(rotateY(boxBounds([-1.5, -70, -90], [1.5, 70, 0], "FabricNavy"), 14).map((p) => ({ geo: p.geo.clone().translate(rx - 3, ry, 114), mat: p.mat })));
  parts.push(rotateY(boxBounds([-1.5, -70, -90], [1.5, 70, 0], "FabricNavy"), -14).map((p) => ({ geo: p.geo.clone().translate(rx + 3, ry, 114), mat: p.mat })));
  parts.push(rotateY(boxBounds([-2, -60, -70], [-1.5, 60, -10], "FabricGold"), 14).map((p) => ({ geo: p.geo.clone().translate(rx - 3, ry, 114), mat: p.mat })));
  parts.push(boxBounds([rx - 4, ry - 70, 112], [rx + 4, ry + 70, 116], "FabricNavy"));
  parts.push(translate(sack(50), [-80, 130, 0]));
  return merge(...parts);
}

// ======================================================================================
// the oasis and water
// ======================================================================================

// โอเอซิส: a pool of clear water in a ring of rocks, grass round it, reeds, lily pads and a
// stone step to draw water from (palms go round it from the flora kit).
function oasisPool(): Geo {
  const rx = 330, ry = 240;
  const ellipse = (r: number, h: number, z: number, mat: string): Geo => scale(cyl(1, h, 20, [0, 0, z], mat), [rx * r, ry * r, 1]);
  const parts: Geo[] = [
    ellipse(1.42, 1, 0, "Bahamas_OasisGrass"),
    ellipse(1.04, 2, 1, "Bahamas_PoolBed"),
    ellipse(1.02, 2, 13, "Bahamas_Water"),
  ];
  // rocks round the rim (a gap at the front for the step)
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + (i % 3) * 0.05;
    if (Math.abs(Math.cos(a) + 1) < 0.08) continue;
    const big = i % 3 === 0;
    const size: V3 = big ? [110, 80, 52] : [80, 62, 34];
    const at: V3 = [Math.cos(a) * (rx + 14), Math.sin(a) * (ry + 14), -4];
    parts.push(translate(rotateZ(reuv(rock(size, 0.45, 11 + i * 7, i % 2 ? "Bahamas_DesertRock" : "SandstoneWarm")), (a * 180) / Math.PI + 90), at));
  }
  // the step: a flat sandstone slab at the front
  parts.push(sboxB([-rx - 70, -80, 0], [-rx + 30, 80, 18], "SandstonePale", 3), sboxB([-rx - 110, -60, 0], [-rx - 60, 60, 9], "SandstonePale", 2));
  // reeds in three clumps, lily pads
  for (const [cx, cy, n] of [[120, 225, 9], [250, -150, 7], [-180, 200, 6]] as [number, number, number][]) for (let k = 0; k < n; k++) {
    const a = k * 2.4, d = 8 + (k % 3) * 9, h = 110 + ((k * 37) % 60);
    const b: V3 = [cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0], t: V3 = [b[0] + Math.cos(a) * 26, b[1] + Math.sin(a) * 26, h];
    parts.push(cylinderBetween(b, t, 2.2, 5, "Bahamas_Reed", 0.6));
    if (k % 2 === 0) parts.push(cylinderBetween([t[0] - Math.cos(a) * 6, t[1] - Math.sin(a) * 6, h - 22], [t[0] - Math.cos(a) * 3, t[1] - Math.sin(a) * 3, h - 6], 3, 6, "Bahamas_Date"));
  }
  for (const [x, y, r] of [[60, -60, 22], [100, -20, 16], [-60, 90, 20], [180, 60, 14], [-120, -110, 18]]) parts.push(cyl(r, 1, 10, [x, y, 15], "LeafGreen"));
  for (const [x, y] of [[-40, -230], [210, 210], [-260, -130]]) parts.push(translate(scale(sphereCenter(26, [0, 0, 0], "Bahamas_OasisGrass", 8), [1.3, 1, 0.55]), [x * 1.25, y * 1.25, 4]));
  return merge(...parts);
}

// บ่อน้ำรอกดึง: a round stone well with a wooden frame, a pulley, a rope and a bucket.
function well(): Geo {
  const parts: Geo[] = [
    lathe([[86, 0], [86, 80], [94, 80], [94, 94], [66, 94], [66, 50]], 14, "SandstoneWarm"),
    cyl(87, 18, 14, [0, 0, 0], "Bahamas_SandstoneDeep"),
    cyl(67, 2, 14, [0, 0, 52], "WaterDark"),
  ];
  for (const s of [-1, 1]) parts.push(boxAt([14, 14, 250], [0, s * 104, 0], "WoodDark", 2), beamBetween([0, s * 104, 150], [0, s * 104 + s * 40, 0], 9, 9, "WoodDark"));
  parts.push(cylinderBetween([0, -118, 232], [0, 118, 232], 7, 8, "WoodShade"));
  // a little tiled roof on the frame
  for (const s of [-1, 1]) parts.push(beamBetween([0, 0, 280], [s * 64, 0, 246], 250, 5, "RoofTerracotta"), beamBetween([s * 2, 0, 270], [s * 58, 0, 240], 236, 4, "WoodShade"));
  parts.push(cylinderBetween([0, -128, 283], [0, 128, 283], 5, 8, "RoofTerracotta"));
  for (const s of [-1, 1]) parts.push(boxAt([6, 6, 36], [0, s * 104, 246], "WoodDark"));
  // pulley, rope, bucket
  parts.push(translate(rotateX(torus(16, 3, 14, 5, "WoodWarm"), 90), [0, 0, 212]), cylinderBetween([0, -5, 212], [0, 5, 212], 4, 8, "IronDark"), cylinderBetween([0, 0, 228], [0, 0, 214], 2, 6, "IronDark"));
  parts.push(cylinderBetween([-16, 0, 212], [-16, 0, 150], 1.2, 4, "RopeTan"), cylinderBetween([16, 0, 212], [16, 96, 110], 1.2, 4, "RopeTan"), translate(rotateY(torus(6, 1.6, 8, 4, "RopeTan"), 90), [16, 100, 104]));
  parts.push(lathe([[0, 0], [14, 0], [17, 24], [16, 24], [0, 4]], 10, "WoodWarm", [-16, 0, 118]), cyl(17.4, 3, 10, [-16, 0, 136], "IronDark"), cyl(15, 3, 10, [-16, 0, 121], "IronDark"));
  parts.push(cylinderBetween([-31, 0, 142], [-16, 0, 154], 0.8, 4, "IronDark"), cylinderBetween([-1, 0, 142], [-16, 0, 154], 0.8, 4, "IronDark"));
  // jars on a slab beside it
  parts.push(sboxB([-50, 110, 0], [50, 190, 10], "SandstonePale", 2), pot("jar", "Bahamas_Clay", 1, [-20, 150, 10]), pot("jug", "Bahamas_ClayPale", 1, [25, 155, 10]));
  return merge(...parts);
}

// รางน้ำให้อูฐ: a long stone water trough with a hitching rail, a heap of hay and a feed bucket.
function camelTrough(): Geo {
  const L = 320, Wd = 90, H = 62, t = 14;
  const parts: Geo[] = [
    sboxB([-Wd / 2, -L / 2, 0], [Wd / 2, L / 2, 14], "SandstoneWarm", 2),
    sboxB([-Wd / 2, -L / 2, 0], [-Wd / 2 + t, L / 2, H], "SandstoneWarm", 2),
    sboxB([Wd / 2 - t, -L / 2, 0], [Wd / 2, L / 2, H], "SandstoneWarm", 2),
    sboxB([-Wd / 2 + t, -L / 2, 0], [Wd / 2 - t, -L / 2 + t, H], "SandstoneWarm", 2),
    sboxB([-Wd / 2 + t, L / 2 - t, 0], [Wd / 2 - t, L / 2, H], "SandstoneWarm", 2),
    sboxB([-Wd / 2 + t, -L / 2 + t, 14], [Wd / 2 - t, L / 2 - t, H - 10], "Bahamas_Water"),
    sboxB([-Wd / 2 - 6, -L / 2 - 6, 0], [Wd / 2 + 6, L / 2 + 6, 10], "Bahamas_SandstoneDeep", 2),
  ];
  // a spout at one end
  parts.push(sboxB([-20, L / 2 - 4, H - 6], [20, L / 2 + 30, H + 70], "SandstonePale", 2), cylinderBetween([0, L / 2, H + 40], [0, L / 2 - 30, H + 34], 4, 8, "Bronze"));
  // hitching rail behind it with rope loops and a saddle blanket
  for (const y of [-130, 130]) parts.push(boxAt([12, 12, 120], [Wd / 2 + 60, y, 0], "WoodDark", 2));
  parts.push(cylinderBetween([Wd / 2 + 60, -150, 112], [Wd / 2 + 60, 150, 112], 5, 8, "WoodShade"));
  for (const y of [-60, 40]) parts.push(translate(rotateY(torus(9, 1.6, 8, 4, "RopeTan"), 90), [Wd / 2 + 60, y, 100]));
  parts.push(boxBounds([Wd / 2 + 52, 60, 70], [Wd / 2 + 68, 120, 118], "FeltRed"), boxBounds([Wd / 2 + 51, 58, 70], [Wd / 2 + 69, 122, 76], "FabricGold"));
  // hay and a bucket
  parts.push(translate(rock([120, 170, 60], 0.35, 41, "Thatch"), [Wd / 2 + 40, -235, -4]), translate(rock([60, 70, 34], 0.4, 43, "Thatch"), [Wd / 2 + 95, -170, -3]));
  parts.push(lathe([[0, 0], [16, 0], [19, 28], [18, 28], [0, 4]], 10, "WoodWarm", [-Wd / 2 - 40, -L / 2 + 40, 0]), cyl(19.4, 3, 10, [-Wd / 2 - 40, -L / 2 + 40, 20], "IronDark"));
  return merge(...parts);
}

// ======================================================================================
// lights
// ======================================================================================

// เสาตะเกียงทองเหลือง: a bronze lamp post on a stone foot, a lantern on top and two hanging from
// curled arms.
function lanternPost(): Geo {
  const parts: Geo[] = [
    sboxAt([54, 54, 30], [0, 0, 0], "SandstoneWarm", 3),
    sboxAt([40, 40, 18], [0, 0, 30], "SandstonePale", 2),
    cyl(9, 12, 8, [0, 0, 48], "Bronze"),
    cyl(6, 230, 8, [0, 0, 48], "IronDark"),
    cyl(9, 6, 8, [0, 0, 150], "Bronze"),
    cyl(10, 8, 8, [0, 0, 276], "Bronze"),
  ];
  for (const s of [-1, 1]) {
    parts.push(beamBetween([0, 0, 262], [0, s * 62, 276], 4, 4, "IronDark"), beamBetween([0, s * 10, 240], [0, s * 34, 268], 3, 3, "IronDark"));
    parts.push(translate(rotateY(torus(9, 1.5, 10, 4, "IronDark"), 90), [0, s * 70, 276]));
    parts.push(hangLantern(0, s * 64, 268, 10, 0.75));
  }
  parts.push(translate(scale(lantern(), [0.9, 0.9, 0.9]), [0, 0, 284]));
  return merge(...parts);
}

// กระถางไฟสำริด: a bronze brazier on three legs over a stone foot, its fire burning.
function brazier(): Geo {
  const parts: Geo[] = [cyl(44, 22, 8, [0, 0, 0], "SandstoneWarm"), cyl(36, 6, 8, [0, 0, 22], "SandstonePale")];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    parts.push(cylinderBetween([Math.cos(a) * 28, Math.sin(a) * 28, 28], [Math.cos(a) * 18, Math.sin(a) * 18, 96], 3, 6, "Bronze"), sphereCenter(5, [Math.cos(a) * 28, Math.sin(a) * 28, 30], "Bronze", 6));
  }
  parts.push(lathe([[0, 0], [16, 1], [34, 10], [44, 24], [47, 32], [44, 32], [0, 26]], 14, "Bronze", [0, 0, 90]), cyl(47.5, 4, 14, [0, 0, 112], "GoldTrim"));
  parts.push(cyl(40, 4, 10, [0, 0, 114], "WoodDark"));
  for (const [x, y, r, h] of [[0, 0, 22, 70], [14, 10, 13, 48], [-12, 12, 12, 42], [4, -16, 12, 46], [-16, -8, 10, 34]]) parts.push(rotateZ(cone(r, 0, h, 6, [x, y, 116], "FireGlow"), x * 3));
  for (const [x, y] of [[22, -18], [-26, 6], [10, 26], [28, 14]]) parts.push(sphereCenter(5, [x, y, 120], "FireGlow", 6));
  return merge(...parts);
}

// ======================================================================================
// ground
// ======================================================================================

// ถนนหินทราย (4 ม.): a 4 m road tile of sandstone pavers laid in courses across the road, a
// kerb along each side; tiles end to end along X.
function roadTile(): Geo {
  const S = 400, parts: Geo[] = [sboxAt([S, S, 3], [0, 0, 0], "Bahamas_Grout")];
  const rows = 8, kerb = 30;
  for (let i = 0; i < rows; i++) {
    const x = -S / 2 + (S / rows) * (i + 0.5), off = i % 2 ? 50 : 0;
    for (let y0 = -S / 2 + kerb - off; y0 < S / 2 - kerb; y0 += 100) {
      const a = Math.max(y0, -S / 2 + kerb), b = Math.min(y0 + 100, S / 2 - kerb);
      if (b - a < 20) continue;
      const k = (i * 7 + Math.round(y0)) % 3;
      parts.push(boxBounds([x - S / rows / 2 + 1.5, a + 1.5, 2], [x + S / rows / 2 - 1.5, b - 1.5, 5 + (k === 1 ? 0.6 : 0)], k === 2 ? "Bahamas_PaverB" : "Bahamas_PaverA"));
    }
  }
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) parts.push(boxBounds([-S / 2 + i * 100 + 1, s > 0 ? S / 2 - kerb + 1 : -S / 2 + 1, 2], [-S / 2 + (i + 1) * 100 - 1, s > 0 ? S / 2 - 1 : -S / 2 + kerb - 1, 9], "SandstonePale", 1.5));
  return merge(...parts);
}

// ลานกระเบื้องโมเสก (4 ม.): a 4 m plaza tile: sandstone slabs, a cobalt border and an eight-point
// star of glazed tiles in the middle; tiles in a grid.
function plazaTile(): Geo {
  const S = 400, parts: Geo[] = [sboxAt([S, S, 3], [0, 0, 0], "Bahamas_Grout")];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) parts.push(boxBounds([-S / 2 + i * 100 + 1, -S / 2 + j * 100 + 1, 2], [-S / 2 + (i + 1) * 100 - 1, -S / 2 + (j + 1) * 100 - 1, 5], (i + j) % 2 ? "SandstonePale" : "Bahamas_PaverA"));
  const band = (a: V3, b: V3, mat: string) => sboxB(a, b, mat);
  const o = 14, bw = 12;
  parts.push(band([-S / 2 + o, -S / 2 + o, 5], [S / 2 - o, -S / 2 + o + bw, 5.6], "Bahamas_TileCobalt"), band([-S / 2 + o, S / 2 - o - bw, 5], [S / 2 - o, S / 2 - o, 5.6], "Bahamas_TileCobalt"));
  parts.push(band([-S / 2 + o, -S / 2 + o + bw, 5], [-S / 2 + o + bw, S / 2 - o - bw, 5.6], "Bahamas_TileCobalt"), band([S / 2 - o - bw, -S / 2 + o + bw, 5], [S / 2 - o, S / 2 - o - bw, 5.6], "Bahamas_TileCobalt"));
  const sq = (side: number, z: number, mat: string, rot: number) => rotateZ(sboxAt([side, side, 0.8], [0, 0, z], mat), rot);
  parts.push(sq(170, 5, "Bahamas_TileTeal", 0), sq(170, 5, "Bahamas_TileTeal", 45), sq(120, 5.8, "SandstonePale", 0), sq(120, 5.8, "SandstonePale", 45));
  parts.push(sq(84, 6.6, "Bahamas_TileCobalt", 0), sq(84, 6.6, "Bahamas_TileCobalt", 45), rotateZ(cyl(30, 0.8, 16, [0, 0, 7.4], "Bahamas_TileSaffron"), 0));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(translate(sq(34, 5, "Bahamas_TileTeal", 45), [sx * 140, sy * 140, 0]), translate(sq(16, 5.8, "Bahamas_TileSaffron", 45), [sx * 140, sy * 140, 0]));
  return merge(...parts);
}

// ======================================================================================
// street decor
// ======================================================================================

// ชุดโอ่งและไหดินเผา: a group of clay and glazed pots: amphorae, an urn, jars, a jug, bowls.
function potterySet(): Geo {
  return merge(
    pot("urn", "Bahamas_ClayPale", 1, [20, -10, 0]),
    pot("amphora", "Bahamas_Clay", 1.05, [60, 60, 0]),
    pot("amphora", "Bahamas_ClayPale", 0.85, [-20, 75, 0]),
    pot("jar", "Bahamas_GlazeBlue", 1, [-45, -50, 0]),
    pot("jar", "Bahamas_GlazeGreen", 0.75, [-60, 20, 0]),
    pot("jug", "Bahamas_Clay", 1, [-85, -10, 0]),
    pot("bowl", "Bahamas_GlazeBlue", 1, [-30, -100, 0]),
    pot("bowl", "Bahamas_ClayPale", 0.9, [-30, -100, 10]),
    translate(rotateY(pot("jar", "Bahamas_Clay", 0.8), 75), [60, -70, 20]),
  );
}

// เสาหินโอเบลิสก์: a sandstone obelisk on a stepped plinth, carved panels, a gilded tip.
function obelisk(): Geo {
  const parts: Geo[] = [
    sboxAt([210, 210, 30], [0, 0, 0], "Bahamas_SandstoneDeep", 3),
    sboxAt([168, 168, 36], [0, 0, 30], "SandstonePale", 3),
    sboxAt([124, 124, 96], [0, 0, 66], "SandstoneWarm", 3),
    sboxAt([128, 128, 14], [0, 0, 132], "Bahamas_TileTeal", 1),
    sboxAt([136, 136, 14], [0, 0, 162], "SandstonePale", 2),
    pyramid(80, 56, 640, [0, 0, 176], "Bahamas_Granite"),
    pyramid(57, 0, 56, [0, 0, 816], "GoldTrim"),
    pyramid(64, 57, 10, [0, 0, 806], "GoldTrim"),
  ];
  // carved panels up each face (dark grooves) and a gold sun disc
  const tilt = (Math.atan2(12, 640) * 180) / Math.PI;
  for (let r = 0; r < 4; r++) {
    const face: Geo[] = [];
    // a column of little carved signs: squares, bars, rings, a pair of strokes
    const glyphs: [number, number, number][] = [[18, 6, 0], [12, 12, 0], [6, 20, 0], [22, 5, 0], [0, 0, 1], [14, 14, 0], [5, 18, -6], [5, 18, 6], [20, 6, 0], [0, 0, 1], [12, 12, 0], [22, 5, 0]];
    glyphs.forEach(([w, hgt, dy], i) => {
      const z = 600 - i * 30, half = 40 - (12 * (z - 176)) / 640;
      const g = w ? boxAt([2, w, hgt], [0, dy, -hgt / 2], "Bahamas_Shadow") : rotateY(torus(6, 1.6, 10, 4, "Bahamas_Shadow"), 90);
      face.push(translate(rotateY(g, tilt), [-half - 0.4, 0, z]));
    });
    face.push(translate(rotateY(rotateY(cyl(13, 2, 12, [0, 0, 0], "Bahamas_TileSaffron"), -90), tilt), [-(40 - (12 * (660 - 176)) / 640) - 0.5, 0, 660]));
    parts.push(rotateZ(merge(...face), 90 * r));
  }
  for (let r = 0; r < 4; r++) parts.push(rotateZ(translate(prism(archOutline("pointed", 34, 30), [], 2, "yz", -1, "Bahamas_TileCobalt"), [-63, 0, 82]), 90 * r));
  return merge(...parts);
}

// ซุ้มหินทะเลทราย: a natural desert rock arch, layered sandstone, boulders and a sand drift.
function rockArch(): Geo {
  const R = (size: V3, seed: number, at: V3, rot = 0, mat = "Bahamas_DesertRock"): Geo => translate(rotateZ(reuv(rock(size, 0.35, seed, mat)), rot), at);
  return merge(
    R([240, 210, 250], 3, [0, -300, 0], 10),
    R([200, 180, 220], 5, [10, -290, 200], -20),
    R([230, 200, 260], 7, [-10, 300, 0], -15),
    R([190, 170, 200], 9, [0, 290, 210], 25),
    R([210, 820, 150], 13, [0, 0, 360], 0),
    R([150, 380, 90], 17, [0, -120, 470], 8, "SandstoneWarm"),
    R([170, 150, 130], 31, [0, -200, 300], 40),
    R([160, 140, 120], 37, [0, 205, 310], -35),
    R([120, 110, 80], 19, [-160, -420, 0], 30),
    R([90, 80, 60], 23, [140, 380, 0], 60, "SandstoneWarm"),
    R([70, 60, 46], 29, [-130, 160, 0], 5),
    translate(scale(sphereCenter(100, [0, 0, 0], "Bahamas_Sand", 10), [1.3, 2.4, 0.32]), [60, -200, -6]),
    translate(scale(sphereCenter(80, [0, 0, 0], "Bahamas_Sand", 10), [1.1, 1.8, 0.3]), [-40, 330, -6]),
  );
}

// ======================================================================================
// the kit
// ======================================================================================

export const KIT: Kit = {
  id: "bahamas",
  name: "บาฮามัส",
  region: "กลางทะเลทราย ทางแยกระหว่างภาคกลางกับภาคใต้",
  desc: "เมืองคาราวานกลางผืนทราย บ้านดินและหินทรายหลังคาแบน โดมสีฟ้าคราม ซุ้มประตูโค้งเกือกม้า ตลาดบาซาร์ และโอเอซิสร่มรื่นด้วยต้นปาล์ม",
  ground: "sand",
  items: [
    { id: "adobe_house", name: "บ้านดินเหนียว", make: adobeHouse, tags: ["building"] },
    { id: "domed_house", name: "บ้านหินทรายโดมขาว", make: domedHouse, tags: ["building"] },
    { id: "merchant_house", name: "บ้านพ่อค้าซุ้มโค้ง", make: merchantHouse, tags: ["building", "market"] },
    { id: "grand_palace", name: "วังโดมฟ้า", make: grandPalace, tags: ["building", "landmark"] },
    { id: "watchtower", name: "หอคอยยาม", make: watchtower, tags: ["tower", "defence"] },
    { id: "city_wall", name: "กำแพงเมือง (8 ม.)", make: cityWall, tags: ["wall", "defence"] },
    { id: "city_gate", name: "ประตูเมืองซุ้มโค้ง", make: cityGate, tags: ["gate", "defence"] },
    { id: "caravan_tent", name: "เต็นท์กองคาราวาน", make: caravanTent, tags: ["market", "building"] },
    { id: "shade_sail", name: "ผ้าใบบังแดด", make: shadeSail, tags: ["market", "decor"] },
    { id: "bazaar_stall", name: "แผงพรมและเครื่องปั้น", make: bazaarStall, tags: ["market"] },
    { id: "spice_stall", name: "แผงเครื่องเทศและผลไม้", make: spiceStall, tags: ["market"] },
    { id: "rug_pile", name: "กองพรมม้วน", make: rugPile, tags: ["market", "decor"] },
    { id: "oasis_pool", name: "โอเอซิส", make: oasisPool, tags: ["water", "decor"] },
    { id: "well", name: "บ่อน้ำรอกดึง", make: well, tags: ["water", "decor"] },
    { id: "camel_trough", name: "รางน้ำให้อูฐ", make: camelTrough, tags: ["water", "decor"] },
    { id: "lantern_post", name: "เสาตะเกียงทองเหลือง", make: lanternPost, tags: ["light"] },
    { id: "brazier", name: "กระถางไฟสำริด", make: brazier, tags: ["light"] },
    { id: "road_tile", name: "ถนนหินทราย (4 ม.)", make: roadTile, tags: ["ground"] },
    { id: "plaza_tile", name: "ลานกระเบื้องโมเสก (4 ม.)", make: plazaTile, tags: ["ground"] },
    { id: "pottery_set", name: "ชุดโอ่งและไหดินเผา", make: potterySet, tags: ["decor"] },
    { id: "obelisk", name: "เสาหินโอเบลิสก์", make: obelisk, tags: ["decor", "landmark"] },
    { id: "rock_arch", name: "ซุ้มหินทะเลทราย", make: rockArch, tags: ["decor"] },
  ],
  sample,
};

// The sample: the bazaar street runs across the town (along Y). Beyond it the palace, a domed
// house, the merchant's arcade and a lane back to the gate in the city wall; on the near side the
// market stalls face the street, then a tiled plaza round an obelisk, the oasis with its palms,
// a well and a caravan camp.
function sample(put: Put): void {
  // the street and the lane to the gate
  for (let y = -2000; y <= 2000; y += 400) put("road_tile", [0, y, 0], 90);
  for (let x = 400; x <= 1600; x += 400) put("road_tile", [x, -1100, 0]);
  // beyond the street
  put("grand_palace", [1400, 1150, 0]);
  put("domed_house", [600, -480, 0]);
  put("adobe_house", [1400, -480, 0]);
  put("merchant_house", [650, -1850, 0]);
  put("city_gate", [1980, -1100, 0], 180);
  put("city_wall", [1980, -2100, 0], 180);
  put("watchtower", [1980, -160, 0]);
  put("shade_sail", [1420, -1780, 0], 90);
  put("pottery_set", [1150, -1450, 0], 40);
  for (const [x, y] of [[280, -1340], [280, -860], [280, 320], [-260, 620], [-260, -150], [-260, -900], [-260, -2050]]) put("lantern_post", [x, y, 0]);
  // the market on the near side, facing the street
  put("shade_sail", [-500, 1360, 0], 180);
  put("spice_stall", [-430, 820, 0], 180);
  put("bazaar_stall", [-430, 380, 0], 180);
  put("pottery_set", [-440, -70, 0], 200);
  put("rug_pile", [-520, -500, 0], 180);
  put("bazaar_stall", [-430, -1250, 0], 180);
  put("spice_stall", [-430, -1700, 0], 180);
  put("pottery_set", [-700, -2000, 0], 90);
  // the plaza round the obelisk, the oasis, the well
  for (const [x, y] of [[-1300, -300], [-900, -300], [-1300, -700], [-900, -700]]) put("plaza_tile", [x, y, 0]);
  put("obelisk", [-1100, -500, 0]);
  put("brazier", [-1560, -960, 0]);
  put("brazier", [-640, -40, 0]);
  put("lantern_post", [-1560, -40, 0]);
  put("lantern_post", [-640, -960, 0]);
  put("oasis_pool", [-1350, 900, 0]);
  put("well", [-950, 250, 0], 20);
  // the caravan camp
  put("caravan_tent", [-1700, -1560, 0]);
  put("caravan_tent", [-1850, -150, 0], 0, 0.9);
  put("camel_trough", [-1250, -1250, 0], 90);
  for (const [x, y, h, z] of [[-1250, -1700, 15, 0], [-1190, -1780, -10, 0], [-1220, -1740, 40, 60], [-1560, -650, 5, 0]]) put("common:crate", [x, y, z], h);
  put("common:market_cart", [-1050, -2000, 0], 60);
  // palms round the water and along the street, cacti and a rock arch out at the edge
  for (const [x, y, h, sc, k] of [
    [-880, 1330, 0, 1, "PalmTall"], [-1700, 1420, 60, 0.95, "Palm"], [-1950, 820, 120, 1, "PalmBent"], [-860, 560, 200, 0.9, "Palm"],
    [-1300, 1550, 30, 1.05, "Palm"], [-2050, 1250, 90, 0.9, "PalmTall"], [-1700, 380, 250, 0.85, "PalmBent"],
    [-330, 2100, 10, 1, "PalmTall"], [260, 2150, 75, 1, "Palm"], [-720, -1000, 160, 0.9, "Palm"], [-1500, -1080, 300, 0.8, "PalmBent"],
  ] as [number, number, number, number, string][]) put(`flora:${k}`, [x, y, 0], h, sc);
  for (const [x, y, k] of [[-2150, -760, "Cactus"], [-2100, -900, "CactusRound"], [-750, -2150, "CactusRound"], [-1450, 1900, "CactusRound"], [-2150, 550, "Cactus"]] as [number, number, string][]) put(`flora:${k}`, [x, y, 0]);
  put("rock_arch", [-1950, 2050, 0], 20, 0.8);
}

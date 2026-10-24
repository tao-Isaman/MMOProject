// ธารน้ำแข็งและวังราชินีหิมะ (glacier): the kit of the three fields west of Iceberg, where the
// land ends in ice. On the west glacier (ธารน้ำแข็งตะวันตก), whose tongue runs down into the
// sea: ice boulders and the rubble of fallen seracs, the seracs themselves, blue ice scoured bare
// by the wind, cracks across the surface and the walls of the deep crevasses (set down into a
// cut in the ground), a cave of blue ice, the ice worms' burrows, a mammoth's bones in a block
// of clear ice, and the camp the stranded whalers built (a hut of stone and turf behind a whale's
// jawbones, the try-pots where they boiled the blubber, a rack of harpoons). In the hollow of the
// Snow Queen's palace (หุบวังน้ำแข็ง): the palace of clear ice in ruins, its gate, walls and
// broken towers, carved columns and a floor of polished ice, the throne on its dais, spires of
// indigo crystal, and the warriors frozen where they stood. On the frostfang ridge
// (สันเขาเขี้ยวน้ำแข็ง): the fangs of dark rock that give it its name, and the old battlefield of
// the giants between them, a ribcage and a helmed skull in the snow, a giant's broken sword,
// the arms of the fallen, and the border watchtower left to the wind.
//
// Everything is built from code in centimetres, Z up; each item stands on z = 0, centred on its
// footprint, its front facing -X. Ice is flat-shaded so its facets catch the light; clear ice is
// see-through and casts no shadow, so what is frozen inside it shows.

import * as THREE from "three";
import { merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, beamBetween, cylinderBetween, cylinderAt, sphereCenter, torus, gableRoof, gableWall, rock, paint, noise3 } from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import { coverTop } from "../nature";
import { solid } from "./types";
import type { Kit, Put } from "./types";

// ---- the kit's own colours ----
// glacier ice: white-blue on top, deep blue in the cracks and caves, clear where it is old and pure
defineMaterial("Glacier_Ice", { map: "ice", tint: "#d4ecf6", rough: 0.18 });
defineMaterial("Glacier_IceBlue", { map: "ice", tint: "#8cc8e6", rough: 0.14 });
defineMaterial("Glacier_IceDeep", { map: "ice", tint: "#4e93c4", rough: 0.16 });
defineMaterial("Glacier_IceDark", { tint: "#173d60", rough: 0.3 });
defineMaterial("Glacier_IceClear", { map: "ice", tint: "#e4f6ff", rough: 0.05, metal: 0.1, opacity: 0.5 });
defineMaterial("Glacier_IceOld", { map: "ice", tint: "#bfe2f4", rough: 0.06, metal: 0.1, opacity: 0.64 });
defineMaterial("Glacier_CaveGlow", { map: "ice", tint: "#7fd2ff", rough: 0.1, glow: "#3aa6ff", glowI: 0.75 });
defineMaterial("Glacier_Abyss", { tint: "#050e17", rough: 0.6, glow: "#0a2846", glowI: 0.3 });
defineMaterial("Glacier_BlueIce", { map: "ice", tint: "#a6d9f1", rough: 0.06 });
defineMaterial("Glacier_Crack", { tint: "#1b4a72", rough: 0.3 });
defineMaterial("Glacier_Frost", { map: "snow", tint: "#eef6fc", rough: 0.85 });
defineMaterial("Glacier_IceCliff", { map: "crag", tint: "#a7c8dc", bump: 2.5 }); // the glacier's ice cliffs
defineMaterial("Glacier_Burrow", { tint: "#0e1a24", rough: 1 });
// the cold western sea and the ice floating on it
defineMaterial("Glacier_Sea", { tint: "#1d4860", rough: 0.06, opacity: 0.95 });
defineMaterial("Glacier_Floe", { map: "ice", tint: "#e3f0f7", rough: 0.3 });
// the whalers' camp
defineMaterial("Glacier_Stone", { map: "crag", tint: "#8a9099", bump: 3 });
defineMaterial("Glacier_StoneDark", { map: "crag", tint: "#5f656e", bump: 3 });
defineMaterial("Glacier_Turf", { map: "thatch", tint: "#77704e", bump: 2 });
defineMaterial("Glacier_Hide", { map: "felt", tint: "#7c5b3f", rough: 1 });
defineMaterial("Glacier_HideDark", { map: "felt", tint: "#4f3a2a", rough: 1 });
defineMaterial("Glacier_Bone", { map: "plaster", tint: "#e9e1cd", rough: 0.8 });
defineMaterial("Glacier_BoneOld", { map: "plaster", tint: "#c8b998", rough: 0.85 });
defineMaterial("Glacier_Tusk", { map: "plaster", tint: "#efe3c8", rough: 0.55 });
defineMaterial("Glacier_Iron", { map: "metal", tint: "#3c3b3d", rough: 0.6, metal: 0.4 });
defineMaterial("Glacier_Rust", { map: "metal", tint: "#7a4b32", rough: 0.85, metal: 0.2 });
defineMaterial("Glacier_Oil", { tint: "#2a2116", rough: 0.15 });
defineMaterial("Glacier_Ember", { tint: "#ffb15a", glow: "#ff7a1e", glowI: 1.4, rough: 0.6 });
defineMaterial("Glacier_Driftwood", { map: "wood", tint: "#9a8f80", bump: 1.4 });
// the Snow Queen's palace
defineMaterial("Glacier_Palace", { map: "ice", tint: "#cfe6f4", rough: 0.12 });
defineMaterial("Glacier_PalaceB", { map: "ice", tint: "#b9daee", rough: 0.12 });
defineMaterial("Glacier_PalaceTrim", { map: "ice", tint: "#eaf6fd", rough: 0.08, metal: 0.15 });
defineMaterial("Glacier_PalaceFloor", { map: "marble", tint: "#c4e2f2", rough: 0.05, metal: 0.1 });
defineMaterial("Glacier_PalaceFloorB", { map: "marble", tint: "#a9d0e8", rough: 0.05, metal: 0.1 });
defineMaterial("Glacier_Azure", { map: "ice", tint: "#6470d8", rough: 0.08, glow: "#2f3cc0", glowI: 0.3, opacity: 0.92 });
defineMaterial("Glacier_AzureCore", { tint: "#c4ceff", rough: 0.1, glow: "#7d8eff", glowI: 1.3 });
defineMaterial("Glacier_AzureDeep", { tint: "#26307a", rough: 0.2, glow: "#2232b0", glowI: 0.35 });
defineMaterial("Glacier_FrostSteel", { map: "metal", tint: "#9fb3c4", rough: 0.35, metal: 0.6 });
defineMaterial("Glacier_FrostSteelDark", { map: "metal", tint: "#55667a", rough: 0.4, metal: 0.55 });
defineMaterial("Glacier_Tabard", { map: "fabric", tint: "#34477a", rough: 0.95 });
defineMaterial("Glacier_Velvet", { map: "fabric", tint: "#4a62b0", rough: 0.9 });
defineMaterial("Glacier_EyeGlow", { tint: "#bfe8ff", glow: "#6fd0ff", glowI: 2 });
// the frostfang ridge
defineMaterial("Glacier_Fang", { map: "crag", tint: "#5d626d", bump: 3.5 });
defineMaterial("Glacier_FangPale", { map: "crag", tint: "#8a909b", bump: 3 });
defineMaterial("Glacier_FangCliff", { map: "crag", tint: "#767c88", bump: 3.5 }); // the ridge's cliffs
defineMaterial("Glacier_Steel", { map: "metal", tint: "#7d8792", rough: 0.45, metal: 0.55 });
defineMaterial("Glacier_SteelRust", { map: "metal", tint: "#80583f", rough: 0.85, metal: 0.25 });
defineMaterial("Glacier_Leather", { map: "felt", tint: "#553826", rough: 0.95 });
defineMaterial("Glacier_Tower", { map: "stone", tint: "#9ca2a9", bump: 2 });
defineMaterial("Glacier_TowerDark", { map: "stone", tint: "#71777f", bump: 2 });
defineMaterial("Glacier_Banner", { map: "fabric", tint: "#3f5687", rough: 1 });
defineMaterial("Glacier_BannerRed", { map: "fabric", tint: "#86312b", rough: 1 });
defineMaterial("Glacier_Timber", { map: "wood", tint: "#5a4636", bump: 1.4 });

const DEG = Math.PI / 180;

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// ---- geometry helpers ----

// Texture coordinates in metres from the position, across each face's normal.
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
// A three.js geometry (Z up) as a Geo: flat-shaded facets, world-aligned texture.
function geoOf(geo: THREE.BufferGeometry, mat: string): Geo {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.deleteAttribute("normal");
  g.computeVertexNormals();
  worldUv(g);
  return [{ geo: g, mat }];
}
// Centre a Geo on its footprint (x, y), leaving z alone.
function centre(g: Geo): Geo {
  const b = new THREE.Box3();
  for (const p of g) {
    p.geo.computeBoundingBox();
    b.union(p.geo.boundingBox!);
  }
  return translate(g, [-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0]);
}

// Ice shaded like ice: deeper blue toward its foot and on the faces that look down, white where
// it faces the sky, each facet a shade of its own.
function iceShade(g: Geo, seed: number, top: number, deep = 0.72): Geo {
  const rnd = seeded(seed);
  let k = 0, cur: [number, number, number] = [1, 1, 1];
  return paint(g, (p, n) => {
    // (a new shade every third corner: one per flat-shaded triangle)
    if (k++ % 3 === 0) {
      const h = Math.min(1, Math.max(0, p.z / Math.max(1, top)));
      const v = deep + (1 - deep) * Math.sqrt(h) + 0.1 * Math.max(0, n.z) + (rnd() - 0.5) * 0.1;
      cur = [v * (0.9 + 0.1 * h), v * (0.96 + 0.04 * h), Math.min(1.12, v * 1.06)];
    }
    return cur;
  });
}

// A chunk of glacier ice: a rough rock of ice, flat-shaded, shaded by iceShade.
function iceRock(size: V3, rough: number, seed: number, mat = "Glacier_Ice", at: V3 = [0, 0, 0], turn = 0, flat = false): Geo {
  const g = rock(size, rough, seed, mat, flat);
  return translate(rotateZ(iceShade(g, seed + 3, size[2]), turn), at);
}

// A pinnacle of ice (or rock): a prism of `seg` sides `h` tall, `r` across its foot, tapering to
// a point pushed off to one side, its faces broken up; leaning `lean` degrees toward heading `dir`.
function shard(h: number, r: number, seed: number, mat: string, o: { seg?: number; lean?: number; dir?: number; at?: V3; tip?: number; bend?: number; rows?: number; jag?: number } = {}): Geo {
  const rnd = seeded(seed), seg = o.seg ?? 5, rows = o.rows ?? 4, tip = o.tip ?? 0.08, bend = o.bend ?? 0, jag = o.jag ?? 0.22;
  const geo = new THREE.CylinderGeometry(r * tip, r, h, seg, rows, false, rnd() * Math.PI);
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0, h / 2 - 15);
  const pos = geo.getAttribute("position"), off = [(rnd() - 0.5) * r * 0.6, (rnd() - 0.5) * r * 0.6];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), t = Math.max(0, z / h);
    const n = noise3(x / (r * 0.7) + seed, y / (r * 0.7), z / (h * 0.3), seed) - 0.5;
    const k = 1 + jag * 2 * n;
    // the tip pushed off to one side, and the whole bent (a fang curving forward)
    pos.setXYZ(i, x * k + off[0] * t * t + bend * h * t * t, y * k + off[1] * t * t, z);
  }
  let g = geoOf(geo, mat);
  if (o.lean) g = rotateZ(rotateY(g, o.lean), o.dir ?? 0);
  return o.at ? translate(g, o.at) : g;
}

// A soft low mound of snow lx by ly, h high, lying at `at`: a lumpy dome, smooth-shaded.
function mound(lx: number, ly: number, h: number, seed: number, at: V3 = [0, 0, 0], turn = 0, mat = "Snow"): Geo {
  const rnd = seeded(seed);
  const geo = new THREE.SphereGeometry(1, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const P = geo.getAttribute("position");
  const bumps = Array.from({ length: 5 }, () => [rnd() * Math.PI * 2, 0.08 + rnd() * 0.14, 1 + Math.floor(rnd() * 3)]);
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

// Snow lying on what faces up.
const snowOn = (g: Geo, amount = 0.4, thick = 5, seed = 1): Geo => coverTop(g, "Snow", { amount, thick, seed, ragged: 0.25 });

// Icicles hanging under the line a-b.
function icicles(a: V3, b: V3, seed: number, step = 24, maxLen = 50, mat = "Glacier_Ice"): Geo {
  const rnd = seeded(seed), parts: Geo[] = [];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  for (let t = step * 0.5; t < len - 6; t += step * (0.7 + rnd() * 0.6)) {
    if (rnd() < 0.3) continue;
    const f = t / len, L = 10 + rnd() * rnd() * maxLen;
    parts.push(cylinderAt({ rBot: 0.5, rTop: 2.5 + rnd() * 2.5, height: L, segments: 5, bottom: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f - L + 1] }, mat));
  }
  return merge(...parts);
}

// A six-sided crystal h tall, r across, leaning `tilt` degrees toward heading `dir`.
function crystal(h: number, r: number, at: V3, tilt: number, dir: number, mat = "Glacier_Azure"): Geo {
  const g = merge(
    cylinderAt({ radius: r, height: h * 0.76 + 30, segments: 6, bottom: [0, 0, -30] }, mat),
    cylinderAt({ rBot: r, rTop: r * 0.05, height: h * 0.24, segments: 6, bottom: [0, 0, h * 0.76] }, mat),
  );
  return translate(rotateZ(rotateY(g, tilt), dir), at);
}

// A bone from a to b, thicker at its knuckled ends.
function bone(a: V3, b: V3, r: number, mat = "Glacier_Bone"): Geo {
  return merge(cylinderBetween(a, b, r, 7, mat, r * 0.85), sphereCenter(r * 1.45, a, mat, 8), sphereCenter(r * 1.35, b, mat, 8));
}
// A curved bone along points (a rib, a tusk), tapering from r0 to r1.
function curve(pts: V3[], r0: number, r1: number, mat = "Glacier_Bone", segs = 6): Geo {
  const g: Geo[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const ra = r0 + ((r1 - r0) * i) / (pts.length - 1), rb = r0 + ((r1 - r0) * (i + 1)) / (pts.length - 1);
    g.push(cylinderBetween(pts[i], pts[i + 1], ra, segs, mat, rb));
    if (i > 0) g.push(sphereCenter(ra * 1.02, pts[i], mat, 6));
  }
  return merge(...g);
}
// Points round an arc: from angle a0 to a1 (degrees) of a circle radius r about c, in the plane
// spanned by u (angle 0) and v (angle 90).
function arc(c: V3, r: number, a0: number, a1: number, n: number, u: V3 = [1, 0, 0], v: V3 = [0, 0, 1]): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (a0 + ((a1 - a0) * i) / n) * DEG, ca = Math.cos(a) * r, sa = Math.sin(a) * r;
    return [c[0] + u[0] * ca + v[0] * sa, c[1] + u[1] * ca + v[1] * sa, c[2] + u[2] * ca + v[2] * sa] as V3;
  });
}
// A flat polygon (points in x, y) at height z, facing up.
function flatPoly(pts: [number, number][], z: number, mat: string): Geo {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ShapeGeometry(shape);
  geo.translate(0, 0, z);
  const g = geo.toNonIndexed();
  g.computeVertexNormals();
  const P = g.getAttribute("position"), uv = new Float32Array(P.count * 2);
  for (let i = 0; i < P.count; i++) {
    uv[i * 2] = P.getX(i) / 100;
    uv[i * 2 + 1] = P.getY(i) / 100;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return [{ geo: g, mat }];
}
// An irregular outline round the origin, rx by ry, n points.
function blobPts(rx: number, ry: number, seed: number, n = 16, wob = 0.18): [number, number][] {
  const rnd = seeded(seed);
  const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, k = 1 + wob * (0.5 * Math.sin(a * 2 + ph[0]) + 0.3 * Math.sin(a * 3 + ph[1]) + 0.2 * Math.sin(a * 5 + ph[2]));
    return [Math.cos(a) * rx * k, Math.sin(a) * ry * k] as [number, number];
  });
}
// A Geo as an object whose meshes cast no shadow (clear ice: what is inside it still gets light).
function shadowless(g: Geo): THREE.Object3D {
  const o = solid(g);
  o.traverse((m) => {
    if ((m as THREE.Mesh).isMesh) m.castShadow = false;
  });
  return o;
}
// Opaque parts and clear ice in one object.
function withClear(opaque: Geo, clear: Geo): THREE.Object3D {
  const grp = new THREE.Group();
  grp.add(solid(opaque), shadowless(clear));
  return grp;
}

// ======================================================================================
// ---- the west glacier ----
// ======================================================================================

// An ice boulder (2.6 x 2.2 m, 1.8 m): a block of glacier ice broken off a serac, snow on its
// back, chips round its foot.
function iceBlock(): Geo {
  const body = iceRock([260, 220, 185], 0.3, 11);
  return centre(merge(
    body, snowOn(body, 0.32, 6, 2),
    iceRock([70, 58, 44], 0.4, 12, "Glacier_IceBlue", [150, -95, 0], 30),
    iceRock([52, 46, 30], 0.4, 13, "Glacier_Ice", [-135, 80, 0], 70),
    iceRock([40, 34, 22], 0.4, 14, "Glacier_IceBlue", [-60, -130, 0], 10),
    mound(170, 110, 26, 15, [70, 90, 0], 30),
  ));
}

// Seracs (6 x 5 m, 7 m): pinnacles of ice where the glacier breaks over a step, leaning every way,
// blue in the cracks between them, snow on their shoulders, their broken pieces round the foot.
function seracs(): Geo {
  const g: Geo[] = [];
  const spikes: [number, number, number, number, number, number][] = [
    // x, y, height, radius, lean, lean heading
    [0, 0, 680, 150, 6, 30], [-140, -170, 520, 130, 12, 220], [130, 160, 560, 140, 10, 60],
    [-170, 150, 420, 115, 14, 150], [180, -150, 380, 110, 15, -40], [40, -300, 300, 95, 18, 260], [-300, -20, 330, 100, 16, 180],
  ];
  spikes.forEach(([x, y, h, r, lean, dir], i) => {
    const s = iceShade(shard(h, r, 31 + i, i % 3 === 2 ? "Glacier_IceBlue" : "Glacier_Ice", { seg: 5 + (i % 2), lean, dir, rows: 4, jag: 0.25 }), 41 + i, h, 0.62);
    g.push(translate(s, [x, y, 0]), translate(snowOn(s, 0.18, 6, 50 + i), [x, y, 0]));
  });
  // a deep blue core between them, where the light comes through
  g.push(shard(360, 90, 39, "Glacier_IceDeep", { seg: 5, lean: 4, dir: 90, at: [20, -40, 0] }));
  g.push(mound(620, 520, 60, 51), iceRock([90, 70, 60], 0.4, 52, "Glacier_Ice", [300, 120, 0], 20), iceRock([70, 60, 40], 0.4, 53, "Glacier_IceBlue", [-260, 260, 0], 80));
  g.push(iceRock([60, 50, 40], 0.4, 54, "Glacier_Ice", [260, -320, 0], 140), iceRock([110, 80, 50], 0.4, 55, "Glacier_Ice", [-320, -220, 0], 40));
  return centre(merge(...g));
}

// A wall of a crevasse (6 m along Y, CREVASSE_DEPTH deep), its face to -X: ice in bulging bands,
// white at the lip and bluer, then darker, all the way down; an overhang of snow along its top
// with icicles under it. It stands on z = 0 like any item; a field sets it down into a cut in the
// ground so its lip meets the ground at the crevasse's edge.
export const CREVASSE_DEPTH = 720;
function crevasseWall(): Geo {
  const Hh = CREVASSE_DEPTH + 6, NY = 12, NZ = 12, Y0 = -310, Y1 = 310, rows: V3[][] = [];
  for (let i = 0; i <= NZ; i++) {
    const z = Hh * (1 - i / NZ), row: V3[] = [];
    for (let j = 0; j <= NY; j++) {
      const y = Y0 + ((Y1 - Y0) * j) / NY;
      // bulging bands of ice, broken up along the wall; the wall overhangs a little near the top
      const n = noise3(y / 110, z / 90, 1.7, 611) - 0.5, band = Math.sin(z / 70 + noise3(y / 240, 0, z / 240, 612) * 4);
      const x = i === 0 ? -4 : -62 * n - 22 * band + (i / NZ) * 40 - 30 + (i === 1 ? -26 : 0);
      row.push([x, y, z]);
    }
    rows.push(row);
  }
  const pos: number[] = [];
  for (let i = 0; i < NZ; i++)
    for (let j = 0; j < NY; j++) {
      const a = rows[i][j], b = rows[i][j + 1], c = rows[i + 1][j + 1], d = rows[i + 1][j];
      pos.push(...a, ...c, ...d, ...a, ...b, ...c);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const uv: number[] = [];
  for (let k = 0; k < pos.length; k += 3) uv.push(pos[k + 1] / 100, pos[k + 2] / 100);
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  // white at the lip, blue lower down, near black at the bottom
  const face = paint([{ geo, mat: "Glacier_IceBlue" }], (p) => {
    const t = Math.min(1, Math.max(0, p.z / Hh)), v = 0.06 + 1.0 * Math.pow(t, 2.2);
    return [v * (0.75 + 0.25 * t), v * (0.88 + 0.12 * t), Math.min(1.1, v * 1.2)];
  });
  const g: Geo[] = [face];
  // the lip: lumps of snow along the top, overhanging a little, icicles under them, blocks of ice
  // wedged in the face lower down
  const rnd = seeded(614);
  for (let k = 0; k < 5; k++) g.push(mound(150 + rnd() * 60, 100 + rnd() * 40, 14 + rnd() * 10, 616 + k, [12 + rnd() * 20, Y0 + 60 + k * 125, Hh - 12], rnd() * 30 - 15));
  g.push(icicles([-40, Y0 + 20, Hh - 10], [-40, Y1 - 20, Hh - 10], 613, 22, 70, "Glacier_Ice"));
  for (let k = 0; k < 3; k++) g.push(iceRock([90, 140, 70], 0.4, 621 + k, "Glacier_IceBlue", [-70, Y0 + 120 + k * 190, Hh * (0.45 + rnd() * 0.35)], rnd() * 90));
  return merge(...g);
}

// A crack across the glacier (9 x 1.4 m, flat): a jagged dark fissure, blue ice either side of
// it, the snow heaped a little along its lips.
function iceCrack(): Geo {
  const rnd = seeded(71), L = 900, n = 18, mid: [number, number][] = [];
  for (let i = 0; i <= n; i++) mid.push([-L / 2 + (L * i) / n, (rnd() - 0.5) * 60 + Math.sin(i * 0.7) * 30]);
  const strip = (w: (t: number) => number, z: number, mat: string): Geo => {
    const left: [number, number][] = [], right: [number, number][] = [];
    mid.forEach(([x, y], i) => {
      const t = i / n, ww = w(t) * (0.75 + rnd() * 0.5);
      left.push([x, y + ww]);
      right.push([x, y - ww]);
    });
    return flatPoly([...left, ...right.reverse()], z, mat);
  };
  const taper = (t: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
  const g: Geo[] = [strip((t) => 70 * taper(t) + 6, 1.2, "Glacier_BlueIce"), strip((t) => 30 * taper(t) + 2, 2.4, "Glacier_IceDeep"), strip((t) => 12 * taper(t) + 1, 3.4, "Glacier_Crack")];
  for (let i = 2; i < n - 1; i += 2) {
    const [x, y] = mid[i], side = i % 4 ? 1 : -1;
    g.push(mound(110 + rnd() * 60, 50, 12 + rnd() * 8, 72 + i, [x, y + side * (70 + rnd() * 20), 0], rnd() * 20));
  }
  return merge(...g);
}

// A sheet of blue ice (7 x 5 m, flat): the glacier scoured bare by the wind, polished, white cracks
// over it, its edge ragged with snow.
function blueIce(): Geo {
  const rnd = seeded(81), out = blobPts(350, 250, 82, 22, 0.22);
  const g: Geo[] = [flatPoly(out, 1.5, "Glacier_BlueIce"), flatPoly(blobPts(250, 160, 83, 16, 0.25).map(([x, y]) => [x + 40, y - 20]), 2.1, "Glacier_IceBlue")];
  for (let k = 0; k < 5; k++) {
    const a = rnd() * Math.PI, x = (rnd() - 0.5) * 300, y = (rnd() - 0.5) * 200, l = 80 + rnd() * 120;
    g.push(beamBetween([x - Math.cos(a) * l, y - Math.sin(a) * l, 2.6], [x + Math.cos(a) * l, y + Math.sin(a) * l, 2.6], 3, 0.6, "Glacier_Frost"));
  }
  out.forEach(([x, y], i) => {
    if (i % 3) return;
    g.push(mound(90 + rnd() * 80, 60 + rnd() * 30, 10 + rnd() * 8, 84 + i, [x * 1.04, y * 1.04, 0], (Math.atan2(y, x) * 180) / Math.PI + 90));
  });
  return merge(...g);
}

// A cave of blue ice (11 x 10 m, 6 m): the glacier's snout hollowed by meltwater, its mouth (to -X)
// an arch hung with icicles, the tunnel inside glowing blue, chunks fallen at its mouth and snow
// heaped over its back.
function iceCave(): Geo {
  const g: Geo[] = [];
  // the masses either side of the mouth and behind it, the roof over the tunnel
  const left = iceRock([760, 440, 540], 0.28, 91, "Glacier_IceBlue", [40, -360, 0], 6);
  const right = iceRock([720, 420, 500], 0.28, 92, "Glacier_IceBlue", [60, 360, 0], -8);
  const back = iceRock([560, 980, 600], 0.25, 93, "Glacier_Ice", [330, 0, 0]);
  const roof = iceRock([640, 760, 280], 0.3, 94, "Glacier_IceBlue", [20, 0, 300]);
  g.push(left, right, back, roof, snowOn(merge(left, right, back, roof), 0.3, 8, 95));
  // the glacier breaking up over it: seracs on its back
  for (const [x, y, h, r, lean, dir, sd] of [[300, -200, 380, 110, 8, 200, 103], [380, 220, 300, 95, 12, 40, 104], [200, 420, 240, 80, 16, 80, 105], [260, -470, 260, 85, 14, 260, 106]] as number[][])
    g.push(iceShade(shard(h, r, sd, "Glacier_Ice", { seg: 5, lean, dir, at: [x, y, 380] }), sd + 10, h + 380, 0.66));
  // the tunnel: walls, ceiling and floor of deep blue ice, its far end glowing
  g.push(boxAt([500, 30, 330], [-60, -150, 0], "Glacier_IceDeep", 6), boxAt([500, 30, 330], [-60, 150, 0], "Glacier_IceDeep", 6));
  g.push(box([520, 340, 30], [-60, 0, 330], "Glacier_IceDeep", 6), boxAt([520, 300, 4], [-60, 0, 0], "Glacier_IceBlue", 2));
  g.push(boxAt([40, 300, 330], [180, 0, 0], "Glacier_CaveGlow", 4), boxAt([20, 120, 180], [150, -40, 0], "Glacier_CaveGlow", 4));
  // the mouth: an arch of clear blue ice round it, icicles along its top
  g.push(curve(arc([-300, 0, 150], 175, -10, 190, 12, [0, 1, 0], [0, 0, 1]), 36, 30, "Glacier_IceBlue", 7));
  g.push(icicles([-310, -150, 316], [-310, 150, 316], 96, 16, 80, "Glacier_Ice"), icicles([-200, -140, 330], [-200, 140, 330], 97, 20, 60, "Glacier_IceBlue"));
  // chunks fallen at the mouth, a drift against its side
  g.push(iceRock([110, 90, 70], 0.4, 98, "Glacier_Ice", [-430, -230, 0], 30), iceRock([80, 70, 50], 0.4, 99, "Glacier_IceBlue", [-470, 210, 0], 80), iceRock([60, 50, 36], 0.4, 100, "Glacier_Ice", [-390, 120, 0], 10));
  g.push(mound(300, 200, 50, 101, [-380, -420, 0], 20), mound(260, 180, 40, 102, [-360, 430, 0], -30));
  return centre(merge(...g));
}

// An ice worm's burrow (3 m): a dark hole bored down into the snow, its rim heaped up in churned
// lumps and broken ice, frost scraped off round it in rings.
function wormBurrow(): Geo {
  const rnd = seeded(111), g: Geo[] = [];
  g.push(flatPoly(blobPts(105, 95, 112, 14, 0.12), 3, "Glacier_Burrow"));
  // the inner slope of the rim, down into the dark
  const inner = new THREE.CylinderGeometry(150, 108, 34, 14, 1, true);
  inner.rotateX(Math.PI / 2);
  inner.translate(0, 0, 19);
  g.push(paint(geoOf(inner, "Glacier_IceBlue"), (p) => {
    const v = 0.35 + 0.6 * Math.min(1, Math.max(0, (p.z - 2) / 34));
    return [v, v, v * 1.05];
  }));
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + rnd() * 0.3, d = 165 + rnd() * 25;
    g.push(mound(110 + rnd() * 50, 70 + rnd() * 30, 30 + rnd() * 18, 113 + k, [Math.cos(a) * d, Math.sin(a) * d, 0], (a * 180) / Math.PI + 90));
  }
  for (let k = 0; k < 6; k++) {
    const a = rnd() * Math.PI * 2, d = 150 + rnd() * 90;
    g.push(iceRock([30 + rnd() * 30, 24 + rnd() * 20, 22 + rnd() * 20], 0.45, 125 + k, k % 2 ? "Glacier_IceBlue" : "Glacier_Ice", [Math.cos(a) * d, Math.sin(a) * d, 4], rnd() * 180));
  }
  // shards of the ice it bored through, standing up out of the rim
  for (let k = 0; k < 4; k++) {
    const a = rnd() * Math.PI * 2;
    g.push(shard(60 + rnd() * 50, 18 + rnd() * 10, 131 + k, "Glacier_Ice", { seg: 4, lean: 25 + rnd() * 20, dir: (a * 180) / Math.PI, at: [Math.cos(a) * 140, Math.sin(a) * 140, 10] }));
  }
  return merge(...g);
}

// A mammoth in the ice (8 x 4.5 m, 4.4 m): a great block of old clear ice slumped out of the
// glacier, the bones of a mammoth inside it, its skull and the long curled tusks breaking out of
// the front; snow on top, bones fallen out of the melt at its foot.
function mammothIce(): THREE.Object3D {
  const bones: Geo[] = [];
  // the spine, the ribs, the legs folded under, the skull toward the front (-X)
  const spine: V3[] = [];
  for (let k = 0; k <= 10; k++) spine.push([-170 + k * 38, 0, 270 - Math.sin((k / 10) * Math.PI) * 30 - k * 4]);
  bones.push(curve(spine, 18, 12, "Glacier_BoneOld"));
  for (let k = 0; k < 8; k++) {
    const x = -130 + k * 34, s = 1 - Math.abs(k - 3) * 0.08;
    for (const sy of [-1, 1]) bones.push(curve(arc([x, 0, 175], 95 * s, 75, -70, 6, [0, sy, 0], [0, 0, 1]), 9, 6, "Glacier_BoneOld", 5));
  }
  for (const [x, y] of [[-110, -70], [-110, 70], [180, -70], [180, 70]] as [number, number][]) bones.push(bone([x, y, 160], [x - 30, y * 1.2, 40], 14, "Glacier_BoneOld"), bone([x - 30, y * 1.2, 40], [x + 20, y * 1.3, 10], 11, "Glacier_BoneOld"));
  bones.push(bone([230, 0, 220], [270, 0, 130], 22, "Glacier_BoneOld"));
  const skull = merge(scale(sphereCenter(70, [0, 0, 0], "Glacier_BoneOld", 10), [1.25, 0.85, 1.2]), box([120, 90, 70], [-80, 0, -50], "Glacier_BoneOld", 14), box([60, 110, 40], [-40, 0, -90], "Glacier_BoneOld", 10), sphereCenter(18, [-60, -46, 12], "Glacier_Burrow", 6), sphereCenter(18, [-60, 46, 12], "Glacier_Burrow", 6));
  bones.push(translate(rotateY(skull, -15), [-240, 0, 250]));
  // the tusks: curling forward, out and up, out of the ice
  for (const sy of [-1, 1]) {
    const pts: V3[] = [];
    for (let k = 0; k <= 9; k++) {
      const t = k / 9, a = t * 200 * DEG;
      pts.push([-300 - Math.sin(a) * 150 - t * 40, sy * (45 + t * 90), 185 - (1 - Math.cos(a)) * 30 + t * t * 160]);
    }
    bones.push(curve(pts, 17, 6, "Glacier_Tusk", 8));
  }
  // the block: clear ice, snow on it, its foot in a drift; bones that melted out lying in front
  const block = iceRock([800, 440, 440], 0.16, 141, "Glacier_IceOld");
  const shell = iceRock([820, 470, 380], 0.2, 142, "Glacier_Ice", [60, 0, -30]);
  const opaque = merge(...bones, snowOn(block, 0.25, 8, 143), mound(900, 560, 50, 144, [20, 0, 0]),
    // a ledge of white ice behind (the glacier it fell from), the front left clear
    translate(scale(shell, [0.5, 1, 1.05]), [260, 0, 0]),
    bone([-470, 120, 8], [-380, 190, 6], 10, "Glacier_BoneOld"), bone([-500, -160, 8], [-420, -230, 10], 8, "Glacier_BoneOld"),
    iceRock([90, 70, 60], 0.4, 145, "Glacier_IceBlue", [-430, -40, 0], 30), iceRock([70, 60, 40], 0.4, 146, "Glacier_Ice", [-380, 260, 0], 60));
  const grp = withClear(opaque, block);
  const b = new THREE.Box3().setFromObject(grp);
  grp.position.set(-(b.min.x + b.max.x) / 2, 0, 0);
  const outer = new THREE.Group();
  outer.add(grp);
  return outer;
}

// ---- the whalers' camp ----

// A dry-stone wall from a to b (on the ground), h high, t thick: stones in rough courses.
function stoneWall(a: [number, number], b: [number, number], h: number, t: number, seed: number): Geo {
  const rnd = seeded(seed), g: Geo[] = [], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
  const rot = (Math.atan2(uy, ux) * 180) / Math.PI;
  g.push(rotateZ(boxAt([L, t - 10, h - 8], [0, 0, 0], "Glacier_StoneDark", 4), rot));
  for (let z = 0, row = 0; z < h - 10; z += 30, row++)
    for (let s = (row % 2) * 30; s < L - 20; s += 50 + rnd() * 30) {
      const w = 40 + rnd() * 30, x = a[0] + ux * (s + w / 2), y = a[1] + uy * (s + w / 2);
      g.push(translate(rotateZ(rock([w, t * (0.9 + rnd() * 0.2), 34], 0.25, seed + row * 31 + Math.floor(s), rnd() < 0.3 ? "Glacier_StoneDark" : "Glacier_Stone", true), rot + (rnd() - 0.5) * 8), [x, y, z - 4]));
    }
  return merge(...g);
}

// The whalers' hut (6.6 x 5.4 m, 3.4 m): stranded whalers' winter house of dry stone, roofed with
// turf on driftwood, its door in the front gable (-X) under an arch of a whale's jawbones; a hide
// over the doorway, a stovepipe smoking no more, snow heavy on the roof and banked round it.
function whalerHut(): Geo {
  const g: Geo[] = [], W = 500, D = 420, H = 150;
  // the walls (the front one in two halves either side of the door)
  g.push(stoneWall([-W / 2, D / 2], [W / 2, D / 2], H, 70, 151), stoneWall([-W / 2, -D / 2], [W / 2, -D / 2], H, 70, 152), stoneWall([W / 2, -D / 2], [W / 2, D / 2], H, 70, 153));
  g.push(stoneWall([-W / 2, -D / 2], [-W / 2, -70], H, 70, 154), stoneWall([-W / 2, 70], [-W / 2, D / 2], H, 70, 155));
  // the gable ends above the walls, and the roof: driftwood under a thick turf, ridge along X
  g.push(gableWall(-W / 2 + 5, D / 2 + 10, H, 120, "Glacier_Driftwood"), gableWall(W / 2 - 5, D / 2 + 10, H, 120, "Glacier_Driftwood"));
  const roof = gableRoof([W + 70, D + 110, 26], [0, 0, H - 4], 130, 30, "Glacier_Turf");
  // snow lying on the turf, short of the gable ends, the turf showing at the eaves
  g.push(roof, translate(gableRoof([W - 60, D + 110, 7], [0, 0, H - 4], 130, 16, "Snow"), [0, 0, 24]));
  for (const sy of [-1, 1]) g.push(mound(W - 40, 90, 22, 157 + sy, [0, sy * (D / 2 + 70), H + 2 - 12]));
  for (const x of [-W / 2 - 34, W / 2 + 34]) g.push(beamBetween([x, -D / 2 - 60, H - 6], [x, 0, H + 128], 14, 12, "Glacier_Driftwood"), beamBetween([x, D / 2 + 60, H - 6], [x, 0, H + 128], 14, 12, "Glacier_Driftwood"));
  // the door: a dark way in hung with a hide, a lintel of driftwood
  g.push(boxAt([30, 130, 150], [-W / 2 + 8, 0, 0], "Glacier_Burrow"), boxAt([8, 120, 128], [-W / 2 - 14, 4, 6], "Glacier_Hide", 2));
  g.push(beamBetween([-W / 2 - 30, -90, H + 6], [-W / 2 - 30, 90, H + 6], 22, 18, "Glacier_Driftwood"));
  // the whale's jawbones: two great curved bones meeting in a pointed arch before the door
  for (const sy of [-1, 1]) {
    const pts: V3[] = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      pts.push([-W / 2 - 110 - t * 10, sy * (130 - Math.pow(t, 2.2) * 125), -10 + Math.sin(t * Math.PI * 0.5) * 360]);
    }
    g.push(curve(pts, 20, 11, "Glacier_Bone", 7));
  }
  // the stovepipe, a lamp by the door, a whale vertebra for a step, gear against the wall
  g.push(cylinderAt({ radius: 14, height: 120, segments: 8, bottom: [120, 90, H + 60] }, "Glacier_Iron"), cylinderAt({ radius: 19, height: 10, segments: 8, bottom: [120, 90, H + 176] }, "Glacier_Iron"));
  g.push(cylinderBetween([-W / 2 - 40, -110, H + 10], [-W / 2 - 40, -110, H - 30], 1.5, 4, "Glacier_Iron"), boxAt([18, 18, 26], [-W / 2 - 40, -110, H - 56], "LanternGlow", 2));
  g.push(scale(cylinderAt({ radius: 44, height: 26, segments: 10, bottom: [-W / 2 - 70, 0, 0] }, "Glacier_Bone"), [1, 1.2, 1]));
  g.push(cylinderAt({ radius: 28, height: 70, segments: 10, bottom: [-W / 2 + 10, D / 2 + 70, 0] }, "WoodDark"), cylinderAt({ radius: 28, height: 70, segments: 10, bottom: [-W / 2 + 70, D / 2 + 66, 0] }, "WoodDark"));
  g.push(torus(28, 3, 10, 4, "Glacier_Iron").map((p) => ({ geo: p.geo.clone().translate(-W / 2 + 10, D / 2 + 70, 52), mat: p.mat })));
  // snow banked against the walls
  g.push(mound(W + 80, 140, 70, 157, [0, D / 2 + 50, 0]), mound(W + 40, 120, 60, 158, [30, -D / 2 - 45, 0]), mound(140, D + 60, 70, 159, [W / 2 + 50, 0, 0]));
  g.push(mound(130, 140, 40, 160, [-W / 2 - 40, -D / 2 + 20, 0]), mound(120, 120, 34, 161, [-W / 2 - 50, D / 2 - 30, 0]));
  return centre(merge(...g));
}

// The try-pots (3.2 x 2 m, 1.9 m): where the whalers boiled the blubber down: a hearth of stones
// with two great iron pots set in it, the fire-mouth in front still glowing, a chimney behind,
// casks of oil, a skimmer and a heap of firewood.
function tryPots(): Geo {
  const g: Geo[] = [];
  g.push(stoneWall([-90, -150], [-90, 150], 90, 60, 171), stoneWall([90, -150], [90, 150], 90, 60, 172), stoneWall([-90, -150], [90, -150], 90, 60, 173), stoneWall([-90, 150], [90, 150], 90, 60, 174));
  g.push(boxAt([170, 290, 70], [0, 0, 0], "Glacier_StoneDark", 4), boxAt([190, 310, 12], [0, 0, 82], "Glacier_Stone", 4));
  for (const y of [-70, 70]) {
    g.push(cylinderAt({ rBot: 46, rTop: 62, height: 46, segments: 14, bottom: [0, y, 70] }, "Glacier_Iron"));
    g.push(torus(62, 5, 14, 5, "Glacier_Iron").map((p) => ({ geo: p.geo.clone().translate(0, y, 116), mat: p.mat })));
    g.push(cylinderAt({ radius: 57, height: 2, segments: 14, bottom: [0, y, 108] }, "Glacier_Oil"));
  }
  // the fire-mouth (front), embers in it; the chimney at the back
  g.push(boxAt([12, 90, 46], [-96, 0, 8], "Glacier_Burrow"), boxAt([10, 70, 14], [-92, 0, 10], "Glacier_Ember", 3));
  g.push(boxAt([60, 60, 150], [70, 0, 90], "Glacier_Stone", 4), boxAt([66, 66, 10], [70, 0, 240], "Glacier_StoneDark", 3));
  // casks, the skimmer, firewood (driftwood)
  for (const [x, y, s] of [[-40, 210, 1], [40, 225, 0.9], [-10, 280, 0.85]] as number[][]) {
    g.push(cylinderAt({ radius: 32 * s, height: 78 * s, segments: 10, bottom: [x, y, 0] }, "WoodDark"));
    for (const z of [12, 62]) g.push(torus(32 * s + 1, 2.5, 10, 4, "Glacier_Iron").map((p) => ({ geo: p.geo.clone().translate(x, y, z * s), mat: p.mat })));
  }
  g.push(cylinderBetween([-80, -190, 0], [-30, -150, 200], 3, 5, "Glacier_Driftwood"), cylinderAt({ radius: 22, height: 4, segments: 8, bottom: [-30, -150, 196] }, "Glacier_Iron"));
  for (let k = 0; k < 6; k++) g.push(cylinderBetween([-150 + (k % 3) * 10, -150 + k * 18, 12 + Math.floor(k / 3) * 22], [-50 + (k % 3) * 10, -170 + k * 18, 14 + Math.floor(k / 3) * 22], 10, 6, "Glacier_Driftwood"));
  g.push(snowOn(boxAt([190, 310, 12], [0, 0, 82], "Glacier_Stone", 4), 0.6, 4, 175), mound(260, 120, 30, 176, [60, -230, 0]), mound(160, 260, 34, 177, [150, 60, 0]));
  return centre(merge(...g));
}

// A rack of harpoons (3.2 x 1.4 m, 2.4 m): two ribs of a whale set up for posts with a crossbar
// of driftwood, harpoons and lances hanging from it, a flensing spade leaning on it, coils of line
// and a tub at its foot.
function harpoonRack(): Geo {
  const g: Geo[] = [];
  for (const y of [-140, 140]) g.push(curve([[0, y, -10], [-12, y, 80], [-8, y, 160], [10, y, 230]], 13, 9, "Glacier_Bone", 7));
  g.push(beamBetween([4, -170, 212], [4, 170, 212], 16, 14, "Glacier_Driftwood"));
  for (let k = 0; k < 6; k++) {
    const y = -110 + k * 44, lance = k % 3 === 2;
    g.push(cylinderBetween([-14, y, 20], [-10, y + (k % 2 ? 6 : -6), 226], 2.6, 5, "Glacier_Driftwood"));
    g.push(lance ? cylinderAt({ rBot: 5, rTop: 0.5, height: 40, segments: 4, bottom: [-10, y, 226] }, "Glacier_Iron")
      : merge(cylinderAt({ rBot: 4, rTop: 0.5, height: 30, segments: 4, bottom: [-10, y, 226] }, "Glacier_Iron"), beamBetween([-10, y - 10, 230], [-10, y + 10, 240], 3, 3, "Glacier_Iron")));
  }
  // the flensing spade, leaning against the rack
  g.push(cylinderBetween([-110, 60, 0], [-20, 40, 200], 3, 5, "Glacier_Driftwood"), translate(rotateY(boxAt([4, 34, 30], [0, 0, 0], "Glacier_Iron", 1), -24), [-118, 62, 0]));
  // coils of line, a tub
  for (const [x, y, r] of [[-70, -90, 34], [-60, -20, 26]] as number[][])
    for (let k = 0; k < 4; k++) g.push(torus(r - k * 3, 4, 12, 4, "RopeTan").map((p) => ({ geo: p.geo.clone().translate(x, y, 4 + k * 7), mat: p.mat })));
  g.push(cylinderAt({ rBot: 30, rTop: 36, height: 44, segments: 10, bottom: [-50, 110, 0] }, "WoodDark"), cylinderAt({ radius: 33, height: 2, segments: 10, bottom: [-50, 110, 40] }, "Snow"));
  g.push(mound(300, 150, 26, 181, [20, 0, 0]));
  return centre(merge(...g));
}

// ======================================================================================
// ---- the Snow Queen's palace ----
// ======================================================================================

// A course of ice blocks from y0 to y1 at height z, h high, t thick (x centred on cx), the blocks
// bevelled and in two shades.
function iceCourse(y0: number, y1: number, z: number, h: number, t: number, cx: number, seed: number, len = 90): Geo {
  const rnd = seeded(seed), g: Geo[] = [];
  for (let y = y0; y < y1 - 5; ) {
    const l = Math.min(len * (0.7 + rnd() * 0.6), y1 - y);
    g.push(boxAt([t, l - 3, h - 3], [cx, y + l / 2, z], rnd() < 0.5 ? "Glacier_Palace" : "Glacier_PalaceB", 5));
    y += l;
  }
  return merge(...g);
}

// A pointed merlon of ice (a little four-sided spire).
const merlon = (x: number, y: number, z: number, w: number, h: number, mat = "Glacier_PalaceTrim"): Geo =>
  translate(merge(boxAt([w, w, h * 0.45], [0, 0, 0], mat, 4), rotateZ(cylinderAt({ rBot: w * 0.68, rTop: 2, height: h * 0.55, segments: 4, bottom: [0, 0, h * 0.45] }, mat), 45)), [x, y, z]);

// A wall of the palace (8 m along Y, 4.6 m): courses of ice blocks on a plinth, a coping with
// pointed merlons, icicles under the coping, snow on the walk and drifted at its foot. Pieces
// join end to end along Y.
function palaceWall(): Geo {
  const g: Geo[] = [], L = 800, T = 120, H = 380;
  g.push(boxAt([T + 40, L, 50], [0, 0, 0], "Glacier_PalaceB", 6));
  for (let k = 0, z = 50; z < H - 10; k++, z += 55) g.push(iceCourse(-L / 2, L / 2, z, 55, T, 0, 201 + k, 110));
  g.push(boxAt([T + 30, L, 24], [0, 0, H], "Glacier_PalaceTrim", 6));
  for (let y = -L / 2 + 50; y < L / 2; y += 100) for (const x of [-T / 2 + 6, T / 2 - 6]) g.push(merlon(x, y, H + 24, 34, 70));
  g.push(icicles([-T / 2 - 16, -L / 2 + 10, H], [-T / 2 - 16, L / 2 - 10, H], 211, 22, 60), icicles([T / 2 + 16, -L / 2 + 10, H], [T / 2 + 16, L / 2 - 10, H], 212, 26, 50));
  g.push(box([T - 20, L - 20, 8], [0, 0, H + 26], "Snow", 3));
  // pilasters at the joins, frost creeping up the foot
  for (const y of [-L / 2 + 20, L / 2 - 20]) g.push(boxAt([T + 50, 40, H + 10], [0, y, 0], "Glacier_PalaceTrim", 6));
  g.push(mound(80, L * 0.6, 40, 213, [-T / 2 - 30, -120, 0]), mound(70, L * 0.45, 34, 214, [T / 2 + 30, 160, 0]));
  return merge(...g);
}

// A broken length of the palace wall (8 m along Y): its courses fallen away to a ragged stump at
// one end, the blocks lying where they fell, snow over the rubble.
function palaceWallBroken(): Geo {
  const g: Geo[] = [], L = 800, T = 120, rnd = seeded(221);
  g.push(boxAt([T + 40, L, 50], [0, 0, 0], "Glacier_PalaceB", 6));
  for (let k = 0, z = 50; z < 360; k++, z += 55) {
    // each course a little shorter than the one under it, from the -Y end
    const end = L / 2 - k * 95 - rnd() * 60;
    if (end < -L / 2 + 60) break;
    g.push(iceCourse(-L / 2, end, z, 55, T, 0, 222 + k, 110));
  }
  g.push(boxAt([T + 50, 40, 380], [0, -L / 2 + 20, 0], "Glacier_PalaceTrim", 6));
  for (let k = 0; k < 9; k++) {
    const x = (rnd() - 0.5) * 300, y = 60 + rnd() * 330;
    g.push(translate(rotateZ(rotateX(boxAt([T * 0.9, 90, 52], [0, 0, 0], k % 2 ? "Glacier_Palace" : "Glacier_PalaceB", 5), (rnd() - 0.5) * 30), rnd() * 90), [x, y, -6]));
  }
  g.push(merlon(-60, 300, 0, 34, 70), mound(300, 360, 45, 223, [0, 230, 0]), mound(90, 300, 36, 224, [-T / 2 - 40, -150, 0]));
  return merge(...g);
}

// A tower of the palace in ruins (5.6 m across, 11 m): eight sides of ice blocks on a stepped
// plinth, tall narrow windows glowing blue, its top broken off ragged; indigo crystal growing out
// of the break, fallen blocks round its foot.
function palaceTower(): Geo {
  const g: Geo[] = [], R = 260, rnd = seeded(231);
  g.push(cylinderAt({ radius: R + 50, height: 40, segments: 8, bottom: [0, 0, 0] }, "Glacier_PalaceB"), cylinderAt({ radius: R + 25, height: 40, segments: 8, bottom: [0, 0, 40] }, "Glacier_PalaceTrim"));
  // the shaft in drums, each a little narrower; the top drum's corners at ragged heights
  const shaft = new THREE.CylinderGeometry(R - 20, R, 1000, 8, 10, false, Math.PI / 8);
  shaft.rotateX(Math.PI / 2);
  shaft.translate(0, 0, 580);
  const sp = shaft.getAttribute("position");
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i), y = sp.getY(i), z = sp.getZ(i);
    if (z > 1000) {
      const a = Math.atan2(y, x), cut = 860 + 180 * (0.5 + 0.5 * Math.sin(a * 2 + 1)) + 90 * noise3(Math.cos(a) * 2, Math.sin(a) * 2, 0, 232);
      sp.setZ(i, Math.min(z, cut));
    }
  }
  g.push(iceShade(geoOf(shaft, "Glacier_Palace"), 233, 1080, 0.82));
  // courses (bands of trim), windows, a broken parapet stub
  for (const z of [300, 560, 820]) g.push(cylinderAt({ radius: R + 6, height: 18, segments: 8, bottom: [0, 0, z] }, "Glacier_PalaceTrim").map((p) => ({ geo: p.geo.clone().rotateZ(Math.PI / 8), mat: p.mat })));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8 + Math.PI / 8, x = Math.cos(a) * (R - 8), y = Math.sin(a) * (R - 8);
    for (const z of k % 2 ? [380] : [380, 640]) g.push(translate(rotateZ(merge(boxAt([20, 44, 150], [0, 0, 0], "Glacier_CaveGlow", 2), cylinderAt({ rBot: 22, rTop: 2, height: 30, segments: 4, bottom: [0, 0, 150] }, "Glacier_CaveGlow").map((p) => ({ geo: p.geo.clone().rotateZ(Math.PI / 4), mat: p.mat }))), (a * 180) / Math.PI), [x, y, z]));
  }
  // crystal out of the break, fallen blocks, snow
  g.push(crystal(320, 50, [30, -40, 900], 12, 40), crystal(240, 38, [-60, 50, 880], 20, 200), crystal(180, 30, [60, 80, 860], 28, 120));
  for (let k = 0; k < 8; k++) {
    const a = rnd() * Math.PI * 2, d = R + 90 + rnd() * 160;
    g.push(translate(rotateZ(rotateY(boxAt([90, 70, 50], [0, 0, 0], k % 2 ? "Glacier_Palace" : "Glacier_PalaceB", 5), (rnd() - 0.5) * 30), rnd() * 90), [Math.cos(a) * d, Math.sin(a) * d, -5]));
  }
  g.push(mound(380, 240, 60, 234, [R + 60, 120, 0], 70), mound(300, 200, 50, 235, [-R - 40, -160, 0], -20));
  return merge(...g);
}

// The gate of the palace (13 m wide, 11 m): two towers of ice with spires of indigo crystal, a
// tall pointed arch between them, its doors of clear ice standing open inward; steps up to it,
// snow drifted against the towers.
function gateTower(y: number, seed: number): Geo {
  const g: Geo[] = [];
  g.push(cylinderAt({ radius: 220, height: 60, segments: 8, bottom: [0, y, 0] }, "Glacier_PalaceB"));
  for (let k = 0, z = 60; z < 760; k++, z += 70) g.push(translate(rotateZ(cylinderAt({ radius: 185 - k * 2, height: 66, segments: 8, bottom: [0, 0, z] }, k % 2 ? "Glacier_Palace" : "Glacier_PalaceB"), k % 2 ? 0 : 22.5), [0, y, 0]));
  g.push(cylinderAt({ radius: 200, height: 30, segments: 8, bottom: [0, y, 760] }, "Glacier_PalaceTrim"));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    g.push(merlon(Math.cos(a) * 175, y + Math.sin(a) * 175, 790, 40, 90));
  }
  g.push(crystal(420, 80, [0, y, 780], 0, 0), crystal(220, 40, [40, y + 60, 790], 18, 60), crystal(200, 36, [-40, y - 50, 790], 20, 230));
  // windows (to the front)
  for (const z of [300, 520]) g.push(merge(boxAt([20, 40, 130], [-180, y, z], "Glacier_CaveGlow", 2), cylinderAt({ rBot: 20, rTop: 2, height: 26, segments: 4, bottom: [-180, y, z + 130] }, "Glacier_CaveGlow")));
  g.push(icicles([-200, y - 120, 760], [-200, y + 120, 760], seed, 18, 70));
  return merge(...g);
}
function palaceGate(): THREE.Object3D {
  const g: Geo[] = [gateTower(-470, 241), gateTower(470, 242)];
  // the pointed arch: each side an arc about a centre across the middle from it (springing at
  // 420, its point at 760), a wall of ice courses over it up to the walk between the towers
  const Z0 = 420, RA = 343, C = 43;
  const halfAt = (z: number) => Math.sqrt(Math.max(0, RA * RA - (z - Z0) ** 2)) - C;
  for (const sy of [-1, 1]) {
    const pts: V3[] = [];
    for (let k = 0; k <= 10; k++) {
      const z = Z0 + (340 * k) / 10;
      pts.push([0, sy * Math.max(0, halfAt(z)), z]);
    }
    for (const x of [-62, 62]) g.push(translate(curve(pts, 24, 24, "Glacier_PalaceTrim", 6), [x, 0, 0]));
    g.push(boxAt([150, 50, Z0], [0, sy * 300, 0], "Glacier_PalaceTrim", 6));
  }
  for (let k = 0, z = Z0; z < 760; k++, z += 55) {
    const half = Math.max(0, halfAt(z + 27));
    g.push(iceCourse(-300, -half - 10, z, 55, 120, 0, 250 + k, 95), iceCourse(half + 10, 300, z, 55, 120, 0, 260 + k, 95));
  }
  g.push(boxAt([150, 640, 40], [0, 0, 760], "Glacier_PalaceTrim", 6));
  for (let y = -270; y <= 270; y += 90) g.push(merlon(0, y, 800, 40, 100));
  g.push(crystal(300, 60, [0, 0, 800], 0, 0));
  // a low apron of polished ice before it and through it, snow drifted against the towers
  g.push(boxAt([260, 1120, 5], [-230, 0, 0], "Glacier_PalaceFloorB", 2), boxAt([200, 560, 6], [0, 0, 0], "Glacier_PalaceFloor", 2));
  g.push(mound(260, 300, 70, 270, [-130, -660, 0]), mound(240, 260, 60, 271, [-120, 660, 0]), mound(300, 240, 50, 272, [170, 640, 0]));
  // the doors: clear ice in frames of trim, standing open inward (hinged at the back of the arch)
  const doors: Geo[] = [];
  for (const sy of [-1, 1]) {
    const open = (gg: Geo) => rotateZ(gg, sy * 85, [60, sy * 262, 0]);
    doors.push(open(boxAt([12, 250, 400], [60, sy * 137, 10], "Glacier_IceClear", 3)));
    g.push(open(merge(boxAt([20, 20, 410], [60, sy * 18, 6], "Glacier_PalaceTrim", 3), boxAt([20, 260, 18], [60, sy * 137, 400], "Glacier_PalaceTrim", 3), boxAt([20, 260, 14], [60, sy * 137, 6], "Glacier_PalaceTrim", 3))));
  }
  return withClear(merge(...g), merge(...doors));
}

// A carved column of ice (1.5 m across, 6.6 m): a stepped plinth, a shaft of octagonal drums each
// turned a little on the last (it twists as it rises), a flared capital hung with icicles, a
// crystal on top.
function iceColumn(): Geo {
  const g: Geo[] = [];
  g.push(boxAt([150, 150, 36], [0, 0, 0], "Glacier_PalaceB", 6), boxAt([124, 124, 30], [0, 0, 36], "Glacier_PalaceTrim", 6));
  for (let k = 0; k < 9; k++)
    g.push(cylinderAt({ rBot: 48 - k * 0.6, rTop: 47.4 - k * 0.6, height: 50, segments: 8, bottom: [0, 0, 66 + k * 50] }, k % 2 ? "Glacier_Palace" : "Glacier_PalaceB").map((p) => ({ geo: p.geo.clone().rotateZ(k * 0.2), mat: p.mat })));
  for (const z of [66, 291, 516]) g.push(cylinderAt({ radius: 53, height: 10, segments: 8, bottom: [0, 0, z] }, "Glacier_PalaceTrim"));
  g.push(cylinderAt({ rBot: 46, rTop: 78, height: 50, segments: 8, bottom: [0, 0, 516] }, "Glacier_PalaceTrim"), boxAt([150, 150, 24], [0, 0, 566], "Glacier_PalaceTrim", 5));
  for (const [a, b] of [[[-75, -75], [-75, 75]], [[-75, 75], [75, 75]], [[75, 75], [75, -75]], [[75, -75], [-75, -75]]] as [number, number][][]) g.push(icicles([a[0], a[1], 566], [b[0], b[1], 566], 281 + a[0] + b[1], 18, 45));
  g.push(crystal(110, 22, [0, 0, 590], 0, 0), crystal(60, 12, [20, 20, 590], 24, 45), crystal(54, 11, [-22, -16, 590], 26, 220));
  g.push(box([120, 120, 6], [0, 0, 593], "Snow", 2));
  return merge(...g);
}

// A floor of polished ice (4 m square, 5 cm): flagstones a metre square in two shades, frost in
// the joints. Tiles join edge to edge.
function palaceFloor(): Geo {
  const g: Geo[] = [boxAt([400, 400, 2], [0, 0, 0], "Glacier_Frost")];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.push(boxAt([96, 96, 5], [-150 + i * 100, -150 + j * 100, 0], (i + j) % 2 ? "Glacier_PalaceFloor" : "Glacier_PalaceFloorB", 1.5));
  return merge(...g);
}

// The Snow Queen's throne (7.4 x 7 m, 7.6 m): a dais of three steps of polished ice, the throne at
// its back facing -X: a seat of ice with a cushion of blue velvet, arms ending in crystals, and a
// back of ice spikes fanning up round a tall central spire of indigo crystal; crystal braziers
// burning cold at the dais' front corners, a runner of velvet down the steps.
function iceThrone(): Geo {
  const g: Geo[] = [];
  for (let k = 0; k < 3; k++) g.push(boxAt([740 - k * 150, 700 - k * 140, 34], [k * 40, 0, k * 34], k % 2 ? "Glacier_PalaceFloor" : "Glacier_PalaceFloorB", 6));
  g.push(boxAt([440, 130, 3], [-80, 0, 34], "Glacier_Velvet", 1), boxAt([300, 130, 3], [-60, 0, 68], "Glacier_Velvet", 1), boxAt([200, 130, 3], [-30, 0, 102], "Glacier_Velvet", 1));
  // the seat (its back at +X), the cushion, the arms
  const z0 = 102;
  g.push(boxAt([150, 190, 70], [110, 0, z0], "Glacier_PalaceTrim", 8), boxAt([130, 160, 16], [100, 0, z0 + 70], "Glacier_Velvet", 6));
  for (const sy of [-1, 1]) {
    g.push(boxAt([150, 30, 70], [100, sy * 105, z0 + 70], "Glacier_Palace", 6), crystal(70, 16, [30, sy * 105, z0 + 140], 10, sy * 90));
  }
  // the back: a fan of ice spikes round the spire
  g.push(boxAt([40, 200, 220], [185, 0, z0 + 70], "Glacier_Palace", 6));
  for (let k = -4; k <= 4; k++) {
    const a = k * 17, h = 380 - Math.abs(k) * 55, y = Math.sin(a * DEG) * 70;
    g.push(shard(h, 26 - Math.abs(k) * 1.5, 291 + k, Math.abs(k) % 2 ? "Glacier_PalaceTrim" : "Glacier_Ice", { seg: 4, lean: a, dir: 90, at: [195, y, z0 + 210], tip: 0.05, jag: 0.06 }));
  }
  g.push(crystal(520, 46, [200, 0, z0 + 230], 0, 0), crystal(260, 26, [205, 30, z0 + 240], 6, 90));
  // the braziers at the front corners
  for (const sy of [-1, 1]) {
    const x = -300, y = sy * 290;
    g.push(cylinderAt({ rBot: 30, rTop: 18, height: 90, segments: 8, bottom: [x, y, 34] }, "Glacier_PalaceTrim"), cylinderAt({ rBot: 20, rTop: 40, height: 26, segments: 8, bottom: [x, y, 124] }, "Glacier_PalaceTrim"));
    g.push(crystal(80, 18, [x, y, 140], 0, 0, "Glacier_AzureCore"), crystal(56, 12, [x + 14, y + 10, 140], 22, 40, "Glacier_Azure"), crystal(50, 11, [x - 12, y - 8, 140], 24, 220, "Glacier_Azure"));
  }
  g.push(icicles([-370, -350, 34], [-370, 350, 34], 299, 30, 20));
  return merge(...g);
}

// Indigo crystals (5 x 4 m, 7 m): spires of the blue-violet crystal that grows where the Queen's
// cold runs deepest, out of a bed of dark rock and ice, a glowing heart among them.
function azureCrystals(): Geo {
  const g: Geo[] = [];
  const base = merge(rock([380, 300, 90], 0.4, 301, "Glacier_StoneDark", true), iceRock([200, 160, 70], 0.4, 302, "Glacier_IceBlue", [120, 60, 0], 20));
  g.push(base, snowOn(base, 0.3, 5, 303));
  const spires: [number, number, number, number, number, number][] = [
    [0, 0, 680, 70, 4, 0], [-90, 80, 480, 52, 16, 140], [100, -60, 520, 56, 14, -40], [-60, -110, 380, 44, 22, 230],
    [130, 110, 340, 40, 24, 60], [-150, -10, 300, 38, 28, 180], [40, 150, 260, 32, 30, 100], [170, -130, 220, 30, 32, -60],
  ];
  spires.forEach(([x, y, h, r, tilt, dir], i) => g.push(crystal(h, r, [x, y, 30], tilt, dir, i === 0 ? "Glacier_Azure" : i % 3 === 0 ? "Glacier_AzureDeep" : "Glacier_Azure")));
  g.push(crystal(200, 30, [10, 10, 20], 0, 0, "Glacier_AzureCore"));
  g.push(mound(460, 380, 40, 304, [0, 0, 0]));
  return centre(merge(...g));
}

// A warrior frozen where he stood (1.7 x 1.6 m, 2.6 m): a knight of the old kingdom in armour,
// tabard and plumed helm, his sword point-down before him and his shield on his arm, held in a
// block of clear ice on a drift of snow.
function frozenWarrior(): THREE.Object3D {
  const g: Geo[] = [], S = "Glacier_FrostSteel", D = "Glacier_FrostSteelDark";
  // legs and sabatons
  for (const sy of [-1, 1]) {
    g.push(boxAt([34, 26, 70], [0, sy * 20, 26], S, 6), boxAt([46, 28, 22], [-6, sy * 20, 6], D, 5), boxAt([30, 30, 18], [0, sy * 20, 96], D, 6));
  }
  // the tabard and the breastplate, the belt
  g.push(boxAt([44, 70, 66], [0, 0, 100], "Glacier_Tabard", 4), boxAt([50, 76, 60], [0, 0, 150], S, 10), boxAt([52, 78, 10], [0, 0, 150], "Glacier_Leather", 3));
  g.push(boxAt([4, 30, 50], [-27, 0, 104], "Glacier_PalaceTrim", 1));
  // pauldrons, arms
  for (const sy of [-1, 1]) {
    g.push(scale(sphereCenter(24, [0, sy * 46, 200], S, 10), [1, 1, 0.75]));
    g.push(cylinderBetween([0, sy * 50, 190], [-18, sy * 52, 140], 11, 8, D));
  }
  // the helm: a barrel helm with a visor slit, eyes glowing, a plume
  g.push(cylinderAt({ radius: 28, height: 50, segments: 10, bottom: [0, 0, 208] }, S), scale(sphereCenter(28, [0, 0, 258], S, 10), [1, 1, 0.5]));
  g.push(boxAt([4, 40, 6], [-28, 0, 236], "Glacier_Burrow"), sphereCenter(3.5, [-27, -9, 239], "Glacier_EyeGlow", 6), sphereCenter(3.5, [-27, 9, 239], "Glacier_EyeGlow", 6));
  g.push(curve([[0, 0, 270], [10, 0, 292], [30, 0, 300], [52, 0, 286]], 9, 4, "Glacier_Tabard", 6));
  // the sword, point down before him, his hands on the pommel
  g.push(boxAt([6, 12, 120], [-46, 0, 14], "Glacier_Steel", 1), boxAt([10, 50, 8], [-46, 0, 134], D, 2), cylinderAt({ radius: 5, height: 26, segments: 6, bottom: [-46, 0, 142] }, "Glacier_Leather"), sphereCenter(7, [-46, 0, 172], D, 6));
  g.push(sphereCenter(10, [-40, -10, 160], D, 6), sphereCenter(10, [-40, 10, 160], D, 6));
  // the shield on his left arm (+Y): a kite of steel, a blue field
  g.push(translate(rotateZ(merge(boxAt([8, 70, 90], [0, 0, 0], D, 4), boxAt([4, 56, 74], [-5, 0, 8], "Glacier_Tabard", 2), scale(cylinderAt({ rBot: 2, rTop: 36, height: 46, segments: 4, bottom: [0, 0, -46] }, D), [0.16, 1, 1])), 20), [-10, 70, 110]));
  // frost on him, the snow under him
  const body = merge(...g);
  const opaque = merge(body, coverTop(body, "Glacier_Frost", { amount: 0.3, thick: 2, seed: 311 }), mound(220, 200, 30, 312));
  const ice = iceRock([170, 160, 300], 0.12, 313, "Glacier_IceClear", [0, 0, -8]);
  return withClear(opaque, ice);
}

// ======================================================================================
// ---- the frostfang ridge ----
// ======================================================================================

// A fang of rock (5 x 4.5 m, 13 m): a spike of dark stone curving forward (-X) to its point like a
// beast's tooth, ice glazing its cracks, snow on its ledges, broken rock round its foot.
function fangPeak(): Geo {
  const g: Geo[] = [];
  // the rock in beds: paler and darker bands up the fang
  const beds = (gg: Geo, seed: number) => paint(gg, (p) => {
    const b = Math.sin(p.z / 70 + noise3(p.x / 200, p.y / 200, 0, seed) * 2.5);
    const v = 0.82 + 0.16 * b + 0.1 * Math.min(1, p.z / 1300);
    return [v, v, v * 1.04];
  });
  const fang = beds(shard(1300, 250, 401, "Glacier_Fang", { seg: 7, rows: 9, bend: -0.3, tip: 0.04, jag: 0.18 }), 412);
  const fang2 = beds(shard(700, 150, 402, "Glacier_FangPale", { seg: 6, rows: 6, bend: -0.25, tip: 0.05, jag: 0.2, lean: 10, dir: 130, at: [150, 200, 0] }), 413);
  const fang3 = beds(shard(420, 110, 414, "Glacier_Fang", { seg: 6, rows: 4, bend: -0.2, tip: 0.06, jag: 0.22, lean: 16, dir: -120, at: [120, -210, 0] }), 415);
  g.push(fang, fang2, fang3, snowOn(merge(fang, fang2, fang3), 0.42, 7, 403));
  // ledges where the snow lies, and a blade of ice down its back
  for (const [z, a, w] of [[260, 30, 200], [540, 200, 160], [820, 100, 120], [380, -90, 150]] as number[][]) {
    const r = 250 * (1 - z / 1500) - 20, x = Math.cos(a * DEG) * r - 0.3 * 1300 * (z / 1300) ** 2, y = Math.sin(a * DEG) * r;
    const ledge = translate(rotateZ(rock([w, w * 0.7, 50], 0.35, 416 + z, "Glacier_Fang", true), a), [x, y, z - 20]);
    g.push(ledge, snowOn(ledge, 0.7, 6, 420 + z));
  }
  g.push(shard(760, 60, 405, "Glacier_IceBlue", { seg: 4, lean: 7, dir: 0, at: [150, -40, 0], tip: 0.1, jag: 0.3 }));
  const foot = merge(rock([300, 220, 130], 0.4, 406, "Glacier_Fang"), translate(rock([200, 160, 90], 0.4, 407, "Glacier_FangPale"), [-220, 180, 0]), translate(rock([160, 140, 70], 0.4, 408, "Glacier_Fang"), [-180, -220, 0]), translate(rock([120, 100, 60], 0.4, 409, "Glacier_FangPale"), [240, -200, 0]));
  g.push(foot, snowOn(foot, 0.5, 6, 410), mound(600, 520, 55, 411));
  return centre(merge(...g));
}

// The bones of a giant (10 x 5 m, 2.6 m): a ribcage arching out of the snow along its spine, the
// pelvis at one end, a thigh bone thrown aside, snow drifted in between the ribs.
function giantBones(): Geo {
  const g: Geo[] = [];
  const spine: V3[] = [];
  for (let k = 0; k <= 12; k++) spine.push([0, -420 + k * 60, 30 + Math.sin((k / 12) * Math.PI) * 40]);
  g.push(curve(spine, 26, 22, "Glacier_Bone", 7));
  for (let k = 1; k < 12; k++) g.push(boxAt([30, 22, 34], [0, spine[k][1], spine[k][2] + 10], "Glacier_Bone", 6));
  // the ribs: from the spine up and over, falling toward the snow (some broken short)
  for (let k = 0; k < 7; k++) {
    const y = -300 + k * 62, s = 1 - Math.abs(k - 2.5) * 0.07;
    for (const sx of [-1, 1]) {
      const broken = (k * 3 + (sx > 0 ? 1 : 0)) % 5 === 0;
      const pts = arc([0, y, 60], 230 * s, 90, broken ? 40 : -20, 7, [sx, 0, 0], [0, 0, 1]).map(([x, yy, z]) => [x, yy + Math.abs(x) * 0.15, z] as V3);
      g.push(curve(pts, 12, 7, "Glacier_Bone", 6));
    }
  }
  // the pelvis, a thigh bone, the shoulder blade
  g.push(translate(scale(sphereCenter(90, [0, 0, 0], "Glacier_BoneOld", 10), [1.4, 0.6, 0.7]), [0, 340, 40]));
  g.push(sphereCenter(26, [-90, 350, 40], "Glacier_Burrow", 6), sphereCenter(26, [90, 350, 40], "Glacier_Burrow", 6));
  g.push(bone([-240, 420, 18], [-120, 680, 22], 26, "Glacier_BoneOld"), bone([220, -330, 24], [330, -150, 14], 18, "Glacier_Bone"));
  g.push(translate(rotateY(scale(sphereCenter(70, [0, 0, 0], "Glacier_BoneOld", 8), [1.2, 0.25, 1]), 30), [200, -420, 50]));
  g.push(mound(520, 1000, 60, 421, [0, 0, 0]), mound(240, 300, 50, 422, [-200, 100, 0], 20), mound(200, 260, 40, 423, [180, -120, 0], -10));
  return centre(merge(...g));
}

// A giant's skull in a helm (3.4 x 3 m, 2.4 m): fallen on its side in the snow, its jaw gaping,
// still wearing the horned helmet it died in, the iron rusted through.
function giantSkull(): Geo {
  const g: Geo[] = [];
  const skull = merge(
    scale(sphereCenter(110, [0, 0, 0], "Glacier_Bone", 12), [1, 0.92, 0.9]),
    box([90, 150, 70], [-90, 0, -40], "Glacier_Bone", 16),
    // the jaw, hanging open
    translate(rotateY(box([110, 140, 34], [-60, 0, 0], "Glacier_BoneOld", 10), 22), [-30, 0, -110]),
  );
  g.push(skull);
  // the sockets, the nose, the teeth
  g.push(sphereCenter(32, [-88, -42, 10], "Glacier_Burrow", 8), sphereCenter(32, [-88, 42, 10], "Glacier_Burrow", 8), box([20, 30, 40], [-118, 0, -30], "Glacier_Burrow", 4));
  for (let k = -3; k <= 3; k++) g.push(boxAt([14, 16, 18], [-132, k * 20, -78], "Glacier_Tusk", 3), boxAt([12, 14, 16], [-118, k * 19, -124], "Glacier_Tusk", 3));
  // the helm: a bowl of rusted iron with a rim, a nasal guard, two great horns curving out
  const helm = merge(
    scale(sphereCenter(122, [0, 0, 0], "Glacier_SteelRust", 12), [1, 0.98, 0.72]).map((p) => ({ geo: p.geo, mat: p.mat })),
    torus(118, 9, 16, 5, "Glacier_Rust"),
    box([16, 26, 90], [-118, 0, -30], "Glacier_Rust", 4),
  );
  g.push(translate(helm, [10, 0, 34]).map((p) => ({ geo: p.geo, mat: p.mat })));
  for (const sy of [-1, 1]) {
    const pts: V3[] = [];
    for (let k = 0; k <= 7; k++) {
      const t = k / 7;
      pts.push([10 - t * 40, sy * (100 + t * 140), 80 + Math.sin(t * Math.PI * 0.8) * 120 - t * 30]);
    }
    g.push(curve(pts, 26, 5, "Glacier_BoneOld", 7));
  }
  // tipped on its side in the snow
  const body = translate(rotateX(merge(...g), 18), [0, 0, 120]);
  return centre(merge(body, coverTop(body, "Snow", { amount: 0.25, thick: 6, seed: 431 }), mound(420, 360, 80, 432, [30, 40, 0])));
}

// A giant's broken sword (4 x 1.6 m, 6.2 m): a greatsword the height of a house driven slantwise
// into the snow, snapped off two thirds down, its guard and grip above; the broken-off point
// lying in the snow beside it. Rust in patches on the blade.
function giantSword(): Geo {
  const g: Geo[] = [];
  const rust = (gg: Geo, seed: number) => paint(gg, (p) => {
    const v = noise3(p.x / 40, p.y / 40, p.z / 60, seed);
    return v > 0.62 ? [0.85, 0.62, 0.48] : [1, 1, 1];
  });
  // the blade (along Z), its fuller, the break (a ragged end under the snow)
  const blade = merge(boxAt([16, 76, 420], [0, 0, -60], "Glacier_Steel", 4), boxAt([20, 14, 380], [0, 0, -40], "Glacier_SteelRust", 2));
  // the guard, the grip, the pommel
  const hilt = merge(
    boxAt([34, 240, 34], [0, 0, 360], "Glacier_SteelRust", 8), sphereCenter(26, [0, -124, 377], "Glacier_SteelRust", 8), sphereCenter(26, [0, 124, 377], "Glacier_SteelRust", 8),
    cylinderAt({ radius: 17, height: 150, segments: 8, bottom: [0, 0, 394] }, "Glacier_Leather"),
    ...[0, 1, 2, 3, 4].map((k) => cylinderAt({ radius: 19, height: 6, segments: 8, bottom: [0, 0, 404 + k * 30] }, "Glacier_Rust")),
    sphereCenter(34, [0, 0, 562], "Glacier_SteelRust", 10),
  );
  const sword = rotateY(rotateX(merge(rust(blade, 441), hilt), 9), -14);
  g.push(sword, snowOn(rotateY(rotateX(hilt, 9), -14), 0.2, 5, 442));
  // the point, broken off, lying in the snow
  const point = merge(boxAt([14, 70, 150], [0, 0, 0], "Glacier_Steel", 3), cylinderAt({ rBot: 36, rTop: 1, height: 70, segments: 4, bottom: [0, 0, 150] }, "Glacier_Steel").map((p) => ({ geo: p.geo.clone().scale(0.2, 1, 1), mat: p.mat })));
  g.push(translate(rotateZ(rotateY(rust(point, 443), 82), 30), [-150, 170, 14]));
  // the snow heaped where it went in, rocks
  g.push(mound(260, 220, 70, 444), mound(160, 120, 34, 445, [-140, 170, 0], 30), rock([90, 70, 50], 0.4, 446, "Glacier_Fang"));
  return centre(merge(...g));
}

// The border watchtower (6.6 m square, 13 m): a square tower of grey stone on a battered plinth,
// set here when the ridge was the kingdom's edge and long left to the wind: arrow slits, its door
// broken in, one corner of its top fallen away in a heap of stones, the roof timbers bare, a
// torn banner still on its pole; snow on every ledge.
function borderTower(): Geo {
  const g: Geo[] = [], W = 560, H = 1050, rnd = seeded(451);
  // the battered plinth, the walls (courses of two greys), quoins at the corners
  g.push(cylinderAt({ rBot: 440, rTop: 400, height: 120, segments: 4, bottom: [0, 0, 0] }, "Glacier_TowerDark").map((p) => ({ geo: p.geo.clone().rotateZ(Math.PI / 4), mat: p.mat })));
  // the walls: four sides, the -X one with the door, the +X/+Y corner fallen from 700 up
  const wallH = (side: string, t: number) => (side === "n" || side === "w") && t > 0.6 ? H - 360 - (t - 0.6) * 500 : H;
  // (each side: its centre line, its turn, and which way its outer face lies in its own X)
  const sides: [string, V3, number][] = [["s", [-W / 2 + 40, 0, 0], 0], ["n", [W / 2 - 40, 0, 0], 0], ["e", [0, -W / 2 + 40, 0], -90], ["w", [0, W / 2 - 40, 0], -90]];
  const outSign: Record<string, number> = { s: -1, n: 1, e: 1, w: -1 };
  for (const [side, c, rot] of sides) {
    for (let k = 0; k < 6; k++) {
      const t = (k + 0.5) / 6, y = -W / 2 + 40 + (W - 80) * t, h = wallH(side, t);
      const seg = boxAt([80, (W - 80) / 6 + 1, h - 120], [0, 0, 120], k % 2 ? "Glacier_Tower" : "Glacier_TowerDark", 3);
      g.push(translate(rotateZ(translate(seg, [0, y, 0]), rot), c[0] !== 0 ? [c[0], 0, 0] : [0, c[1], 0]));
    }
  }
  for (const [x, y] of [[-1, -1], [-1, 1], [1, -1], [1, 1]] as [number, number][]) {
    const top = x > 0 && y > 0 ? H - 520 : H;
    for (let z = 120; z < top - 30; z += 70) g.push(boxAt([100, 100, 62], [x * (W / 2 - 40), y * (W / 2 - 40), z], (z / 70) % 2 ? "Glacier_Tower" : "Glacier_TowerDark", 5));
  }
  // string courses, the parapet (broken where the corner fell), arrow slits
  for (const z of [430, 760]) for (const [side, c, rot] of sides) {
    const len = side === "n" || side === "w" ? (z > 700 ? W * 0.55 : W) : W;
    const off = len < W ? -(W - len) / 2 : 0;
    g.push(translate(rotateZ(boxAt([100, len, 22], [0, off, z], "Glacier_TowerDark", 4), rot), c[0] !== 0 ? [c[0] * 1.08, 0, 0] : [0, c[1] * 1.08, 0]));
  }
  for (const [side, c, rot] of sides) {
    for (let k = 0; k < 5; k++) {
      const y = -W / 2 + 70 + k * ((W - 140) / 4);
      if ((side === "n" || side === "w") && y > W * 0.05) continue;
      g.push(translate(rotateZ(boxAt([96, 60, 70], [0, y, H], "Glacier_Tower", 5), rot), c[0] !== 0 ? [c[0], 0, 0] : [0, c[1], 0]));
    }
    for (const z of [520, 840]) {
      if ((side === "n" || side === "w") && z > 700) continue;
      g.push(translate(rotateZ(boxAt([10, 16, 90], [outSign[side] * 44, side === "s" ? 140 : 0, z], "Glacier_Burrow"), rot), c));
    }
  }
  // the door (front, -X): a dark way in, a broken plank door hanging, a lintel
  g.push(boxAt([20, 150, 240], [-W / 2, 0, 120], "Glacier_Burrow"), boxAt([90, 200, 30], [-W / 2 + 40, 0, 360], "Glacier_TowerDark", 4));
  g.push(translate(rotateZ(boxAt([8, 70, 200], [0, 35, 0], "Glacier_Timber", 2), -50), [-W / 2 - 6, -70, 124]), translate(rotateY(boxAt([8, 60, 150], [0, 0, 0], "Glacier_Timber", 2), 70), [-W / 2 - 120, 40, 0]));
  // stone steps up to the door
  for (let k = 0; k < 3; k++) g.push(boxAt([70, 200, 40], [-W / 2 - 60 - k * 60 + 60, 0, (2 - k) * 40], "Glacier_TowerDark", 4));
  // bare roof timbers over the top, the banner pole and its torn banner
  for (let k = 0; k < 4; k++) g.push(beamBetween([-W / 2 + 60, -180 + k * 110, H - 40], [W / 2 - 60 - (k > 1 ? 220 : 0), -180 + k * 110 + (k > 1 ? 30 : 0), H - 40 - (k > 1 ? 60 : 0)], 20, 20, "Glacier_Timber"));
  g.push(cylinderAt({ radius: 7, height: 380, segments: 6, bottom: [-150, -150, H - 40] }, "Glacier_Timber"));
  const flag: Geo[] = [];
  for (let k = 0; k < 5; k++) flag.push(boxAt([4, 50, 130 - k * 18], [-150, -150 + 10 + k * 46, H + 340 - (130 - k * 18) + (k % 2 ? -8 : 0)], k % 2 ? "Glacier_Banner" : "Glacier_Banner", 1));
  g.push(...flag);
  // the fallen corner: a heap of its stones down the +X/+Y side
  for (let k = 0; k < 16; k++) {
    const x = W / 2 - 20 + rnd() * 260 - 60, y = W / 2 - 20 + rnd() * 260 - 60;
    g.push(translate(rotateZ(rotateX(boxAt([70 + rnd() * 30, 50 + rnd() * 20, 40], [0, 0, 0], k % 2 ? "Glacier_Tower" : "Glacier_TowerDark", 5), (rnd() - 0.5) * 40), rnd() * 90), [x, y, -6 + rnd() * 30]));
  }
  // snow on the ledges and the heap, drifted against the walls
  const body = merge(...g);
  g.push(coverTop(body, "Snow", { amount: 0.2, thick: 6, seed: 452 }));
  g.push(mound(260, W + 120, 70, 453, [-W / 2 - 90, 60, 0]), mound(W, 220, 60, 454, [0, -W / 2 - 80, 0]), mound(320, 320, 80, 455, [W / 2 + 80, W / 2 + 80, 0]));
  return centre(merge(...g));
}

// The arms of the fallen (3.4 x 2.4 m, 1.8 m): shields, spears and a helmet where a fight on the
// ridge ended: a round shield face-down, a kite shield driven into the snow, spears stuck at
// angles, a helmet, a broken axe, arrows; rusted and dusted with snow.
function battleDebris(): Geo {
  const g: Geo[] = [];
  g.push(translate(rotateY(merge(cylinderAt({ radius: 46, height: 6, segments: 14, bottom: [0, 0, 0] }, "Glacier_Timber"), torus(46, 3, 14, 4, "Glacier_Rust").map((p) => ({ geo: p.geo.clone().translate(0, 0, 3), mat: p.mat })), scale(sphereCenter(12, [0, 0, 6], "Glacier_SteelRust", 8), [1, 1, 0.6])), 8), [-60, -80, 4]));
  g.push(translate(rotateY(merge(boxAt([7, 70, 80], [0, 0, 0], "Glacier_SteelRust", 3), boxAt([3, 58, 66], [-4, 0, 8], "Glacier_BannerRed", 1), scale(cylinderAt({ rBot: 2, rTop: 36, height: 44, segments: 4, bottom: [0, 0, -44] }, "Glacier_SteelRust"), [0.16, 1, 1])), -16), [40, 90, 30]));
  for (const [x, y, a, b, l] of [[100, -40, -25, 20, 220], [-120, 60, 30, 140, 200], [10, -150, 18, 260, 240]] as number[][]) {
    const spear = merge(cylinderAt({ radius: 3, height: l, segments: 5, bottom: [0, 0, -20] }, "Glacier_Timber"), cylinderAt({ rBot: 6, rTop: 0.5, height: 28, segments: 4, bottom: [0, 0, l - 20] }, "Glacier_Steel"));
    g.push(translate(rotateZ(rotateY(spear, a), b), [x, y, 0]));
  }
  g.push(translate(merge(scale(sphereCenter(20, [0, 0, 0], "Glacier_SteelRust", 10), [1, 1, 0.85]), torus(20, 2.5, 12, 4, "Glacier_Rust"), boxAt([4, 6, 18], [-20, 0, -12], "Glacier_Rust", 1)), [-20, 20, 14]));
  g.push(translate(rotateZ(rotateY(merge(cylinderAt({ radius: 3, height: 110, segments: 5, bottom: [0, 0, 0] }, "Glacier_Timber"), translate(scale(cylinderAt({ radius: 22, height: 4, segments: 8, bottom: [0, 0, 0] }, "Glacier_SteelRust"), [1, 0.6, 1]), [14, 0, 90])), 85), 70), [120, 70, 6]));
  for (let k = 0; k < 6; k++) g.push(translate(rotateZ(rotateY(cylinderAt({ radius: 1, height: 70, segments: 4, bottom: [0, 0, 0] }, "Glacier_Timber"), 30 + k * 7), k * 40), [-140 + k * 30, -30 + (k % 3) * 40, 0]));
  g.push(mound(340, 240, 22, 461), mound(120, 90, 24, 462, [40, 90, 0]));
  const body = merge(...g);
  return centre(merge(body, coverTop(body, "Snow", { amount: 0.15, thick: 2, seed: 463 })));
}

// ======================================================================================
// ---- the kit ----
// ======================================================================================

export const KIT: Kit = {
  id: "glacier",
  name: "ธารน้ำแข็งและวังราชินีหิมะ",
  region: "ตะวันตกของไอซ์เบิร์ก",
  desc: "ลิ้นธารน้ำแข็งที่ไหลลงทะเลตะวันตก มีรอยแยกลึก ยอดน้ำแข็ง ถ้ำน้ำแข็งสีฟ้า และค่ายนักล่าวาฬที่ติดค้าง เหนือขึ้นไปคือซากวังน้ำแข็งของราชินีหิมะกับผลึกครามและนักรบที่ถูกแช่แข็ง ทางใต้คือสันเขาเขี้ยวน้ำแข็ง สนามรบเก่าของยักษ์",
  ground: "snow",
  sea: true,
  items: [
    // the west glacier
    { id: "ice_block", name: "ก้อนน้ำแข็งธารน้ำแข็ง", make: iceBlock, tags: ["rock", "decor"] },
    { id: "seracs", name: "ยอดน้ำแข็งแหลม", make: seracs, tags: ["rock", "landmark"] },
    { id: "crevasse_wall", name: "ผนังรอยแยกน้ำแข็ง (6 ม.)", make: crevasseWall, tags: ["wall"] },
    { id: "ice_crack", name: "รอยร้าวบนธารน้ำแข็ง", make: iceCrack, tags: ["ground"] },
    { id: "blue_ice", name: "ลานน้ำแข็งสีฟ้า", make: blueIce, tags: ["ground"] },
    { id: "ice_cave", name: "ถ้ำน้ำแข็งสีฟ้า", make: iceCave, tags: ["landmark"] },
    { id: "worm_burrow", name: "รูหนอนยักษ์", make: wormBurrow, tags: ["decor"] },
    { id: "mammoth_ice", name: "แมมมอธในก้อนน้ำแข็ง", make: mammothIce, tags: ["landmark"] },
    { id: "whaler_hut", name: "กระท่อมนักล่าวาฬ", make: whalerHut, tags: ["building"] },
    { id: "try_pots", name: "เตาเคี่ยวน้ำมันวาฬ", make: tryPots, tags: ["decor"] },
    { id: "harpoon_rack", name: "ราวฉมวกนักล่าวาฬ", make: harpoonRack, tags: ["decor"] },
    // the Snow Queen's palace
    { id: "palace_gate", name: "ประตูวังน้ำแข็งใส", make: palaceGate, tags: ["gate", "landmark"] },
    { id: "palace_wall", name: "กำแพงวังน้ำแข็ง (8 ม.)", make: palaceWall, tags: ["wall"] },
    { id: "palace_wall_broken", name: "กำแพงวังน้ำแข็งพัง (8 ม.)", make: palaceWallBroken, tags: ["wall", "ruin"] },
    { id: "palace_tower", name: "หอคอยวังน้ำแข็งพัง", make: palaceTower, tags: ["tower", "ruin"] },
    { id: "ice_column", name: "เสาน้ำแข็งสลัก", make: iceColumn, tags: ["decor"] },
    { id: "palace_floor", name: "พื้นน้ำแข็งขัดเงา (4 ม.)", make: palaceFloor, tags: ["ground"] },
    { id: "ice_throne", name: "บัลลังก์น้ำแข็ง", make: iceThrone, tags: ["landmark"] },
    { id: "azure_crystals", name: "ผลึกคราม", make: azureCrystals, tags: ["magic", "landmark"] },
    { id: "frozen_warrior", name: "นักรบแช่แข็ง", make: frozenWarrior, tags: ["decor"] },
    // the frostfang ridge
    { id: "fang_peak", name: "ยอดหินเขี้ยว", make: fangPeak, tags: ["rock", "landmark"] },
    { id: "giant_bones", name: "โครงกระดูกยักษ์", make: giantBones, tags: ["decor"] },
    { id: "giant_skull", name: "กะโหลกยักษ์สวมหมวกเหล็ก", make: giantSkull, tags: ["decor"] },
    { id: "giant_sword", name: "ดาบยักษ์หักปักหิมะ", make: giantSword, tags: ["landmark"] },
    { id: "border_tower", name: "หอเฝ้าระวังชายแดนร้าง", make: borderTower, tags: ["tower", "landmark"] },
    { id: "battle_debris", name: "ซากอาวุธสนามรบ", make: battleDebris, tags: ["decor"] },
  ],
  // A corner of the far west: the whalers' camp on the shore (the sea to the east of the scene),
  // the glacier above it with its seracs, cave and crevasse cracks, the gate of the ice palace
  // with frozen warriors before it in the north-west, and the fangs and a giant's bones in the
  // south-west.
  sample: (put: Put) => {
    // the shore and the whalers' camp
    put("whaler_hut", [-300, -1250, 0], 200);
    put("try_pots", [500, -1500, 0], 100);
    put("harpoon_rack", [-1200, -1500, 0], 160);
    put("northcold:icebound_boat", [-700, -2050, 0], 80);
    put("iceberg:ice_floe", [300, -3000, -20], 40, 0.5);
    put("iceberg:ice_floe", [-1500, -3300, -20], 200, 0.35);
    put("snowland:cairn", [1200, -1100, 0], 0);
    // the glacier
    put("blue_ice", [0, -100, 0], 20);
    put("ice_crack", [-800, 300, 0], 70);
    put("ice_crack", [700, -450, 0], 120, 0.8);
    put("seracs", [1300, 300, 0], 0);
    put("ice_block", [400, 500, 0], 40);
    put("ice_block", [-400, -500, 0], 160, 0.6);
    put("worm_burrow", [-1100, -350, 0], 0);
    put("ice_cave", [1500, -500, 0], 10);
    put("mammoth_ice", [-1300, 600, 0], 20, 0.8);
    // the palace: its gate, a wall either side, columns, warriors in a row, crystals
    put("palace_floor", [1100, 1300, 0], 0);
    put("palace_floor", [700, 1300, 0], 0);
    put("palace_gate", [1500, 1300, 0], 0, 0.8);
    put("palace_wall", [1500, 2100, 0], 0, 0.8);
    put("palace_tower", [1900, 2000, 0], 0, 0.6);
    put("ice_column", [800, 900, 0], 0, 0.8);
    put("ice_column", [800, 1700, 0], 0, 0.8);
    for (const y of [1000, 1300, 1600]) put("frozen_warrior", [300, y, 0], 0);
    put("azure_crystals", [1900, 800, 0], 30, 0.8);
    // the ridge: fangs, a giant's bones, his sword and skull, the arms of the fallen, the tower
    put("fang_peak", [-1700, 1900, 0], 30, 0.7);
    put("fang_peak", [-900, 2100, 0], 200, 0.5);
    put("giant_bones", [-600, 1200, 0], 60, 0.8);
    put("giant_sword", [-1500, 1100, 0], 20);
    put("giant_skull", [-200, 1900, 0], 120, 0.8);
    put("battle_debris", [-300, 800, 0], 0);
    put("border_tower", [-1900, -200, 0], 0, 0.7);
    put("flora:SnowPineSmall", [-1900, 900, 0], 0, 0.8);
    put("flora:SnowPine", [-1600, -1000, 0], 0, 0.9);
    put("snowland:snow_drift", [200, 1900, 0], 30);
    put("snowland:snow_drift", [-1000, -1000, 0], 100);
  },
};

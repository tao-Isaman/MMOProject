// ไฮแลนด์ ฮิล (Highland Hill): the ancient snow town at the foot of the mountains, where the
// legend says the ancestors of everyone in the land first settled. Built like Noa and Eden (stone,
// plaster and tiled roofs) but for the cold: roofs pitched steep and heavy with snow, thick walls
// of grey fieldstone with heavy quoins, small windows set deep in them glowing warm, big stone
// chimneys built out from the gables, and a covered porch before every door. The landmarks are
// the Ancestor Stone (a huge carved standing stone, its faces cut with the names of the first
// families) and the Ancestors' Temple with its bell tower, reached up a flight of steps. The
// farmers grow potatoes, cabbages and barley in glasshouses warmed by stoves, in walled plots under
// the snow and in cold frames; sheep winter in stone pens. The town wall and gates are grey stone
// with snow on the wall-walk, and the mountains behind are piled from great snowy crags.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front to -X.
// The wall (8 m) and the field wall (4 m) tile end to end along Y; the temple stair (2.4 m)
// tiles along X, rising 1 m toward +X.

import * as THREE from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, array, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, torus, gableWall, rock,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import { Cards, lump, shrub } from "../trees";
import { coverTop } from "../nature";
import type { Kit, Put } from "./types";

// ---- materials ----
defineMaterial("Highland_Stone", { map: "stone", tint: "#a9a59b", bump: 2.2 });      // grey fieldstone walls
defineMaterial("Highland_StoneDark", { map: "stone", tint: "#7b7a7a", bump: 2.2 });  // plinths, steps, copings
defineMaterial("Highland_StonePale", { map: "stone", tint: "#d6d1c6", bump: 1.8 });  // quoins, lintels, surrounds
defineMaterial("Highland_DryStone", { map: "crag", tint: "#a19d93", bump: 3 });      // dry-stone field walls
defineMaterial("Highland_Ancient", { map: "crag", tint: "#8f9597", bump: 2.6 });     // the ancestor stone
defineMaterial("Highland_Carve", { tint: "#34363c", rough: 1 });                     // letters cut in it
defineMaterial("Highland_Plaster", { map: "plaster", tint: "#ece4d3", bump: 0.6 });
defineMaterial("Highland_Roof", { map: "tiles", tint: "#82493a", bump: 2.5 });       // old red-brown tiles
defineMaterial("Highland_TempleRoof", { map: "tiles", tint: "#505a69", bump: 2.5 }); // dark slate tiles
defineMaterial("Highland_Shutter", { map: "wood", tint: "#3f604c", bump: 1 });       // green shutters
defineMaterial("Highland_Timber", { map: "wood", tint: "#5a412e", bump: 1.2 });
defineMaterial("Highland_Boards", { map: "wood", tint: "#76604a", bump: 1.2 });      // the barn's weathered boards
defineMaterial("Highland_Clay", { map: "plaster", tint: "#a65d3f", bump: 0.6 });     // chimney pots
defineMaterial("Highland_WarmPane", { tint: "#ffd796", rough: 0.4, glow: "#ffb04a", glowI: 1.0 }); // lit windows
defineMaterial("Highland_Glass", { tint: "#e8f6f4", rough: 0.05, opacity: 0.3, glow: "#ffe2b0", glowI: 0.14 }); // glasshouse panes
defineMaterial("Highland_GlazingWhite", { map: "wood", tint: "#eeeae0", bump: 0.6 });
defineMaterial("Highland_Soil", { map: "felt", tint: "#4a3628", rough: 1 });
defineMaterial("Highland_Cabbage", { map: "felt", tint: "#93c070", rough: 0.85 });
defineMaterial("Highland_CabbageDark", { map: "felt", tint: "#4f8047", rough: 0.9 });
defineMaterial("Highland_CabbageRed", { map: "felt", tint: "#7c4b7c", rough: 0.85 });
defineMaterial("Highland_Leek", { map: "felt", tint: "#e9ecd6", rough: 0.85 });
defineMaterial("Highland_Barley", { map: "thatch", tint: "#dcc37c", rough: 1 });
defineMaterial("Highland_Straw", { map: "thatch", tint: "#c3a35c", rough: 1 });
defineMaterial("Highland_Potato", { map: "adobe", tint: "#b8925e", bump: 1 });
defineMaterial("Highland_Wool", { map: "felt", tint: "#ece6d8", rough: 1 });
defineMaterial("Highland_WoolGrey", { map: "felt", tint: "#b3ab9f", rough: 1 });
defineMaterial("Highland_SheepFace", { map: "felt", tint: "#2e2a28", rough: 1 });
defineMaterial("Highland_Banner", { map: "fabric", tint: "#6b2b33", rough: 0.95 });   // deep wine, the town's colour
defineMaterial("Highland_Sack", { map: "fabric", tint: "#cdb68a", rough: 1 });
defineMaterial("Highland_Dark", { tint: "#1f1d1f", rough: 1 });
defineMaterial("Highland_Crag", { map: "crag", tint: "#949aa2", bump: 3 });
defineMaterial("Highland_CragDark", { map: "crag", tint: "#6f747d", bump: 3 });
defineMaterial("Highland_Pine", { map: "felt", tint: "#2f5a3a", rough: 0.95 });

// ---- helpers ----
const D = Math.PI / 180;

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// World-aligned texture coordinates (metres / s): masonry courses stay level and run on across
// neighbouring boxes; `vertical` turns them (boards up a barn).
function wuv(g: Geo, s = 1, vertical = false): Geo {
  return g.map(({ geo, mat }) => {
    const out = geo.clone();
    const pos = out.getAttribute("position"), nor = out.getAttribute("normal");
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const side = nz < nx || nz < ny;
      let [u, v] = side ? (nx >= ny ? [y, z] : [x, z]) : [x, y];
      if (vertical && side) [u, v] = [v, u];
      uv[i * 2] = u / (100 * s);
      uv[i * 2 + 1] = v / (100 * s);
    }
    out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return { geo: out, mat };
  });
}

// Roof texture coordinates for a slab: U along the eaves, V up the slope (the tile courses level
// whichever way the slab is longer).
function roofUv(g: Geo, s = 1): Geo {
  const n = new THREE.Vector3(), e = new THREE.Vector3(), t = new THREE.Vector3(), p = new THREE.Vector3();
  return g.map(({ geo, mat }) => {
    const out = geo.clone();
    const pos = out.getAttribute("position"), nor = out.getAttribute("normal");
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      n.set(nor.getX(i), nor.getY(i), nor.getZ(i));
      p.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      const h = Math.hypot(n.x, n.y);
      if (h < 1e-3) {
        e.set(1, 0, 0);
        t.set(0, 1, 0);
      } else {
        e.set(-n.y / h, n.x / h, 0);
        t.crossVectors(n, e).normalize();
      }
      uv[i * 2] = p.dot(e) / (100 * s);
      uv[i * 2 + 1] = p.dot(t) / (100 * s);
    }
    out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return { geo: out, mat };
  });
}

// Put a piece built facing -X (its back on x = 0, centred on y = 0) onto one face of a box
// building: `d` from the centre to that wall, `u` along the wall, bottom at z.
type Face = "-x" | "+x" | "-y" | "+y";
function onFace(g: Geo, face: Face, d: number, u: number, z: number): Geo {
  if (face === "-x") return translate(g, [-d, u, z]);
  if (face === "+x") return translate(rotateZ(g, 180), [d, u, z]);
  if (face === "-y") return translate(rotateZ(g, 90), [u, -d, z]);
  return translate(rotateZ(g, -90), [u, d, z]);
}

// A round (or polygonal) drum, a flat face toward each axis.
function ring(r: number, h: number, z: number, mat: string, seg = 16, rTop = r): Geo {
  return rotateZ(cylinderAt({ rBot: r, rTop, height: h, segments: seg, bottom: [0, 0, z] }, mat), 180 / seg);
}

// Outlines in a wall's plane: (shape x, shape y) = (world y, world z).
function archShape(hw: number, spring: number, bottom = 0): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-hw, bottom);
  s.lineTo(hw, bottom);
  s.lineTo(hw, spring);
  s.absarc(0, spring, hw, 0, Math.PI, false);
  s.lineTo(-hw, bottom);
  return s;
}
function circleShape(r: number, cy = 0, cz = 0): THREE.Shape {
  const s = new THREE.Shape();
  s.absarc(cy, cz, r, 0, Math.PI * 2, false);
  return s;
}
// The town's mark: a peak with a lesser one beside it, in the wall plane.
function peakShape(s: number, cz = 0): THREE.Shape {
  const sh = new THREE.Shape();
  const pts: [number, number][] = [[-s, -0.45 * s], [-0.45 * s, 0.25 * s], [-0.22 * s, 0.02 * s], [0.18 * s, 0.6 * s], [s, -0.45 * s]];
  sh.moveTo(pts[0][0], pts[0][1] + cz);
  for (const [y, z] of pts.slice(1)) sh.lineTo(y, z + cz);
  sh.lineTo(pts[0][0], pts[0][1] + cz);
  return sh;
}
// A flat piece cut to a shape, facing -X, from x0 to x0 + depth.
function panel(shape: THREE.Shape, x0: number, depth: number, mat: string, o: { s?: number; vertical?: boolean; seg?: number } = {}): Geo {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: o.seg ?? 8 });
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, x0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  const geo = g.index ? g.toNonIndexed() : g;
  geo.clearGroups();
  return wuv([{ geo, mat }], o.s ?? 1, o.vertical);
}
// A solid wrapped round some points (the standing stone, sloped copings, battered walls).
function hull(pts: V3[], mat: string, s = 1): Geo {
  return wuv([{ geo: new ConvexGeometry(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))), mat }], s);
}
// Voussoirs: `n` wedge stones round an arch (degrees from +Y over the top) in a -X facing wall,
// centre c, from radius r out to r + thick, `depth` through the wall.
function arcStones(c: V3, r: number, a0: number, a1: number, n: number, thick: number, depth: number, mat: string, bevel = 2): Geo {
  const out: Geo[] = [];
  const step = (a1 - a0) / n, chord = 2 * (r + thick) * Math.sin((Math.abs(step) * D) / 2) * 1.04, rm = r + thick / 2;
  for (let i = 0; i < n; i++) {
    const a = (a0 + step * (i + 0.5)) * D;
    out.push(translate(rotateX(box([depth, chord, thick], [0, 0, 0], mat, bevel), a / D - 90), [c[0], c[1] + rm * Math.cos(a), c[2] + rm * Math.sin(a)]));
  }
  return merge(...out);
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

// ---- snow ----
// A drift: a long low dome lx by ly, h high, lying on the ground at c.
const drift = (c: V3, lx: number, ly: number, h: number): Geo => scale(sphereCenter(50, c, "Snow", 10), [lx / 100, ly / 100, h / 50], c);
// A soft lumpy mound of snow lx by ly, h high, at `at`, turned `turn` degrees.
function mound(lx: number, ly: number, h: number, seed: number, at: V3 = [0, 0, 0], turn = 0, mat = "Snow"): Geo {
  const rnd = seeded(seed);
  const geo = new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const P = geo.getAttribute("position");
  const bumps = Array.from({ length: 4 }, () => [rnd() * Math.PI * 2, 0.08 + rnd() * 0.12, 1 + Math.floor(rnd() * 3)]);
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
// Icicles hanging from the line a-b (an eave, a sill), of random lengths with gaps.
function icicles(a: V3, b: V3, seed: number, step = 26, maxLen = 46): Geo {
  const rnd = seeded(seed), parts: Geo[] = [];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  for (let t = step * 0.6; t < len - 8; t += step * (0.7 + rnd() * 0.6)) {
    if (rnd() < 0.3) continue;
    const f = t / len, L = 10 + rnd() * rnd() * maxLen;
    const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, z = a[2] + (b[2] - a[2]) * f;
    parts.push(cylinderAt({ rBot: 0.5, rTop: 3 + rnd() * 2.5, height: L, segments: 5, bottom: [x, y, z - L + 1] }, "IceBlue"));
  }
  return merge(...parts);
}

// A steep tiled roof over sx x sy (ridge along X, gables at ±X) on walls whose tops are at z:
// two slabs with barge boards, snow lying from the ridge down `snow` of each slope in a thick
// blanket ending in a rounded lip with tongues slipping further, a snow ridge, icicles at the eaves.
interface RoofOpt {
  sx: number; sy: number; h: number; z: number; mat?: string;
  over?: number; gableOver?: number; th?: number; snow?: number; snowTh?: number; icicles?: boolean; seed?: number; barge?: string;
}
function snowRoof(o: RoofOpt): Geo {
  const th = o.th ?? 22, over = o.over ?? 40, gov = o.gableOver ?? over, sn = o.snowTh ?? 18, mat = o.mat ?? "Highland_Roof";
  const a = Math.atan2(o.h, o.sy / 2), deg = a / D;
  const slope = (o.sy / 2 + over) / Math.cos(a), len = o.sx + 2 * gov, sl = slope * (o.snow ?? 0.7);
  const barge = o.barge ?? "Highland_Timber", rnd = seeded((o.seed ?? 5) * 3 + 1), tn = sn - 3;
  const parts: Geo[] = [];
  for (const s of [1, -1] as const) {
    const tongues: Geo[] = [];
    for (let x = -len / 2 + 10 + rnd() * 40; x < len / 2 - 50; x += 30 + rnd() * 110) {
      const w = Math.min(50 + rnd() * 120, len / 2 - 8 - x), cx = x + w / 2;
      const ext = Math.min(slope - sl - 6, slope * (0.04 + rnd() * 0.13) + 8);
      if (ext > 4) tongues.push(scale(sphereCenter(w / 2, [cx, s * sl, th], "Snow", 8), [1, ext / (w / 2), (tn * 0.8) / (w / 2)], [cx, s * sl, th]));
      x += w * 0.6;
    }
    parts.push(rotateX(merge(
      roofUv(box([len, slope, th], [0, (s * slope) / 2, th / 2], mat, 2)),
      box([8, slope + 4, th + 10], [len / 2 + 4, (s * slope) / 2, th / 2 + 1], barge, 1.5),
      box([8, slope + 4, th + 10], [-len / 2 - 4, (s * slope) / 2, th / 2 + 1], barge, 1.5),
      box([len - 4, sl, sn], [0, (s * sl) / 2, th + sn / 2 - 1], "Snow", Math.min(5, sn / 3)),
      cylinderBetween([-len / 2 + 2, s * sl, th + sn * 0.35], [len / 2 - 2, s * sl, th + sn * 0.35], sn * 0.6, 7, "Snow"),
      ...tongues,
    ), -s * deg));
    if (o.icicles !== false) {
      const ey = s * slope * Math.cos(a), ez = -slope * Math.sin(a);
      parts.push(icicles([-len / 2 + 4, ey, ez], [len / 2 - 4, ey, ez], (o.seed ?? 5) + (s > 0 ? 0 : 50)));
    }
  }
  const t = th + sn, rz = t * Math.cos(a) * 0.7;
  parts.push(cylinderBetween([-len / 2 + 2, 0, rz], [len / 2 - 2, 0, rz], t * Math.sin(a) * 0.8 + 3, 8, "Snow"));
  return translate(merge(...parts), [0, 0, o.z + o.h]);
}
// The same roof turned so its ridge runs along Y, with stone (or plaster) gables at ±hy.
function roofY(hx: number, hy: number, E: number, h: number, o: Partial<RoofOpt> & { gable?: string } = {}): Geo {
  return rotateZ(merge(
    snowRoof({ sx: 2 * hy, sy: 2 * hx, h, z: E, over: 42, gableOver: 32, ...o }),
    wuv(merge(gableWall(hy - 2, hx - 2, E, h - 6, o.gable ?? "Highland_Stone"), gableWall(-hy + 2, hx - 2, E, h - 6, o.gable ?? "Highland_Stone")), 1.2),
  ), 90);
}
// ... and with its ridge along X.
function roofX(hx: number, hy: number, E: number, h: number, o: Partial<RoofOpt> & { gable?: string } = {}): Geo {
  return merge(
    snowRoof({ sx: 2 * hx, sy: 2 * hy, h, z: E, over: 38, gableOver: 32, ...o }),
    wuv(merge(gableWall(hx - 2, hy - 2, E, h - 6, o.gable ?? "Highland_Stone"), gableWall(-hx + 2, hy - 2, E, h - 6, o.gable ?? "Highland_Stone")), 1.2),
  );
}

// ---- windows, doors, porches, chimneys, lamps ----
// A small window set deep in a thick wall, facing -X (its back on the wall face at x = 0): a
// heavy pale stone surround standing 22 cm proud so the warm-lit glass sits deep; a cross of
// glazing bars, a lintel stone and a sill both carrying snow; shutters folded back if a colour is
// given (`round`: a round head).
function deepWindow(w: number, h: number, o: { shutter?: string; round?: boolean; frame?: string } = {}): Geo {
  const hw = w / 2, fm = o.frame ?? "Highland_StonePale", jd = 22, spring = o.round ? h - hw : h;
  const parts: Geo[] = [
    o.round ? panel(archShape(hw, spring), -3, 3, "Highland_WarmPane") : boxBounds([-3, -hw, 0], [0, hw, h], "Highland_WarmPane"),
    boxBounds([-7, -2.5, 0], [-3, 2.5, h - 2], "Highland_Timber"),
    boxBounds([-7, -hw, spring * 0.55 - 2.5], [-3, hw, spring * 0.55 + 2.5], "Highland_Timber"),
    boxBounds([-jd, -hw - 16, -6], [0, -hw, spring + 2], fm),
    boxBounds([-jd, hw, -6], [0, hw + 16, spring + 2], fm),
    boxBounds([-jd - 8, -hw - 20, -18], [0, hw + 20, -6], fm, 2),
    box([jd + 6, w + 38, 8], [-(jd + 8) / 2, 0, -3], "Snow", 3),
  ];
  if (o.round) {
    parts.push(arcStones([-jd / 2, 0, spring], hw, 0, 180, 7, 18, jd, fm, 0));
    parts.push(box([jd + 2, 26, 8], [-jd / 2, 0, h + 21], "Snow", 3));
  } else {
    parts.push(boxBounds([-jd - 4, -hw - 26, h], [0, hw + 26, h + 26], fm));
    parts.push(box([jd + 2, w + 48, 9], [-(jd + 4) / 2, 0, h + 29], "Snow", 3.5));
  }
  if (o.shutter)
    for (const s of [-1, 1]) {
      const sw = hw + 2, y = s * (hw + 16 + sw / 2 + 2);
      parts.push(
        boxBounds([-5, y - sw / 2, -2], [0, y + sw / 2, spring + 2], o.shutter),
        boxBounds([-7, y - sw / 2 + 3, spring * 0.15], [-5, y + sw / 2 - 3, spring * 0.15 + 6], o.shutter),
        boxBounds([-7, y - sw / 2 + 3, spring * 0.78], [-5, y + sw / 2 - 3, spring * 0.78 + 6], o.shutter),
        beamBetween([-6, y - (s * sw) / 3, spring * 0.18 + 6], [-6, y + (s * sw) / 3, spring * 0.78], 2, 5, o.shutter),
      );
    }
  return merge(...parts);
}
// A planked door under a round arch of voussoirs, facing -X, its back on the wall face: an
// opening w wide, jambs up to hs; iron straps, a ring; its threshold `lift` above the ground
// (over the plinth), with steps down to it.
function archDoor(w: number, hs: number, o: { leaf?: string; stone?: string; lift?: number } = {}): Geo {
  const R = w / 2, stone = o.stone ?? "Highland_StonePale", leaf = o.leaf ?? "DoorWood", lift = o.lift ?? 0;
  const parts: Geo[] = [
    panel(archShape(R, hs), -6, 6, leaf, { vertical: true }),
    ...[0.18, 0.6].map((t) => boxBounds([-8, -R + 6, hs * t], [-6, R - 6, hs * t + 7], "IronDark")),
    translate(rotateY(torus(6, 1.5, 10, 4, "IronDark"), 90), [-9, R * 0.5, hs * 0.5]),
    arcStones([-12, 0, hs], R, 0, 180, 9, 24, 24, stone, 0),
  ];
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) parts.push(boxAt([24, 26, hs / 3 - 3], [-12, s * (R + 13), (k * hs) / 3], stone));
  parts.push(box([26, 30, 8], [-12, 0, hs + R + 28], "Snow", 3));
  if (lift > 0) {
    parts.push(boxBounds([-48, -R - 26, -lift], [0, R + 26, 0], "Highland_StoneDark", 2));
    if (lift > 30) parts.push(boxBounds([-78, -R - 16, -lift], [-40, R + 16, -lift / 2], "Highland_StoneDark", 2));
  }
  return merge(...parts);
}
// A small iron lantern with glowing glass and a snowy cap, about 48 tall, standing on z = 0.
function lantern(): Geo {
  return merge(
    boxAt([22, 22, 4], [0, 0, 0], "IronDark"),
    boxAt([16, 16, 26], [0, 0, 4], "LanternGlow"),
    ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => boxAt([3, 3, 26], [a * 9, b * 9, 4], "IronDark")),
    rotateZ(cylinderAt({ rBot: 16.5, rTop: 3, height: 13, segments: 4, bottom: [0, 0, 30] }, "IronDark"), 45),
    rotateZ(cylinderAt({ rBot: 12, rTop: 2, height: 10, segments: 4, bottom: [0, 0, 36] }, "Snow"), 45),
    cylinderAt({ radius: 3, height: 5, segments: 6, bottom: [0, 0, 43] }, "IronDark"),
  );
}
// A lantern hanging `drop` below z = 0 on a chain.
function hanging(drop: number): Geo {
  return merge(cylinderBetween([0, 0, 0], [0, 0, -drop + 48], 1.2, 4, "IronDark"), translate(lantern(), [0, 0, -drop]));
}
// A lantern on an iron bracket out from a -X facing wall (bracket at z = 0).
function wallLantern(): Geo {
  return merge(
    boxBounds([-3, -8, -30], [0, 8, 12], "IronDark"),
    beamBetween([0, 0, 6], [-44, 0, 6], 4, 5, "IronDark"),
    beamBetween([0, 0, -24], [-28, 0, 4], 3, 3, "IronDark"),
    translate(hanging(36), [-40, 0, 6]),
  );
}
// A covered porch facing -X, its back on the wall face at x = 0, `w` wide and `d` deep: a flagged
// floor as high as the house's plinth with two steps up to it, stout posts on stone bases carrying
// a beam, a steep little roof (its gable to the front) heavy with snow, a bench along one side
// and a lantern under the ridge. The door behind it stands on the floor (z = 46).
function porch(w: number, d: number, h = 270, o: { seed?: number; roof?: string; bench?: boolean } = {}): Geo {
  const hw = w / 2, rh = w * 0.62, F = 46, parts: Geo[] = [];
  parts.push(
    boxBounds([-d - 16, -hw - 10, 0], [0, hw + 10, F], "Highland_StoneDark", 2),
    boxBounds([-d - 18, -hw - 12, F - 6], [0, hw + 12, F], "Highland_StonePale", 1.5),
    boxBounds([-d - 48, -hw + 22, 0], [-d - 14, hw - 22, 31], "Highland_StoneDark", 2),
    boxBounds([-d - 78, -hw + 30, 0], [-d - 44, hw - 30, 16], "Highland_StoneDark", 2),
    boxBounds([-d - 4, -hw - 2, h - 8], [-d + 22, hw + 2, h + 14], "Highland_Timber", 1.5),
  );
  for (const s of [-1, 1]) {
    const y = s * (hw - 14);
    parts.push(
      boxAt([34, 34, 26], [-d + 9, y, F], "Highland_StonePale", 2),
      boxAt([22, 22, h - F - 26], [-d + 9, y, F + 26], "Highland_Timber", 2),
      boxBounds([-d + 2, s > 0 ? hw - 24 : -hw + 2, h - 8], [0, s > 0 ? hw - 2 : -hw + 24, h + 14], "Highland_Timber", 1.5),
      beamBetween([-d + 9, y, h - 56], [-d + 52, y, h - 8], 10, 10, "Highland_Timber"),
      beamBetween([-d + 9, y, h - 56], [-d + 9, y - s * 40, h - 8], 10, 10, "Highland_Timber"),
    );
  }
  if (o.bench !== false) parts.push(boxBounds([-d + 34, hw - 50, F + 34], [-14, hw - 18, F + 42], "Highland_Timber", 1.5), boxBounds([-d + 38, hw - 46, F], [-d + 50, hw - 22, F + 34], "Highland_Timber"), boxBounds([-40, hw - 46, F], [-28, hw - 22, F + 34], "Highland_Timber"));
  const sx = d + 30;
  parts.push(translate(snowRoof({ sx, sy: w, h: rh, z: h + 14, over: 22, gableOver: 0, th: 14, snowTh: 14, snow: 0.74, mat: o.roof ?? "Highland_Roof", seed: o.seed ?? 9 }), [-sx / 2 + 2, 0, 0]));
  parts.push(gableWall(-d - 4, hw - 2, h + 14, rh - 4, "Highland_Timber"));
  parts.push(translate(hanging(56), [-d * 0.45, 0, h + 40]));
  return merge(...parts);
}
// A stone chimney stack sx by sy from z0 to `top`: a cap band, a rim with snow on it, two clay
// pots with embers glowing in them.
function chimney(sx: number, sy: number, z0: number, top: number): Geo {
  const hx = sx / 2, hy = sy / 2, pots = sy >= sx ? [[0, -hy * 0.42], [0, hy * 0.42]] : [[-hx * 0.42, 0], [hx * 0.42, 0]];
  return merge(
    wuv(boxBounds([-hx, -hy, z0], [hx, hy, top], "Highland_Stone", 3), 1.1),
    boxBounds([-hx - 8, -hy - 8, top - 34], [hx + 8, hy + 8, top - 18], "Highland_StoneDark", 2),
    boxBounds([-hx - 6, -hy - 6, top], [hx + 6, hy + 6, top + 14], "Highland_StoneDark", 2),
    box([sx + 8, sy + 8, 9], [0, 0, top + 16], "Snow", 4),
    ...pots.map(([x, y]) => merge(
      cylinderAt({ rBot: 13, rTop: 10, height: 36, segments: 8, bottom: [x, y, top + 14] }, "Highland_Clay"),
      cylinderAt({ radius: 7, height: 2, segments: 8, bottom: [x, y, top + 48] }, "FireGlow"),
    )),
  );
}
// A big chimney built out from a gable end, facing -X (its back on the wall at x = 0): a breast
// w wide from the ground, weathered back in two steps under snow, then the stack up to `top`.
function endChimney(w: number, sh: number, top: number): Geo {
  const hw = w / 2, sw = w * 0.62, parts: Geo[] = [
    boxBounds([-104, -hw - 10, 0], [0, hw + 10, 48], "Highland_StoneDark", 2),
    wuv(boxBounds([-92, -hw, 48], [0, hw, sh], "Highland_Stone", 2), 1.2),
    hull([[-92, -hw, sh], [-92, hw, sh], [0, -hw, sh], [0, hw, sh], [-80, -sw / 2, sh + 60], [-80, sw / 2, sh + 60], [0, -sw / 2, sh + 60], [0, sw / 2, sh + 60]], "Highland_Stone"),
    hull([[-96, -hw - 4, sh + 2], [-96, hw + 4, sh + 2], [-84, -sw / 2 - 2, sh + 64], [-84, sw / 2 + 2, sh + 64], [-60, -hw, sh + 30], [-60, hw, sh + 30]], "Snow"),
    translate(chimney(80, sw, sh + 40, top), [-40, 0, 0]),
  ];
  for (let z = 60, i = 0; z + 40 < sh; z += 52, i++) {
    const a = i % 2 ? 26 : 42;
    for (const s of [-1, 1]) parts.push(boxBounds([-96, s < 0 ? -hw - 3 : hw - a, z], [-60, s < 0 ? -hw + a : hw + 3, z + 42], "Highland_StonePale"));
  }
  return merge(...parts);
}
// Corner stones up the corners of a box building between z0 and z1, alternating long and short.
function quoins(hx: number, hy: number, z0: number, z1: number, corners: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]]): Geo {
  const out: Geo[] = [];
  for (const [cx, cy] of corners)
    for (let i = 0, z = z0; z + 40 <= z1; i++, z += 50) {
      const ax = i % 2 ? 30 : 50, ay = i % 2 ? 50 : 30, x = cx * hx, y = cy * hy;
      out.push(boxBounds([cx < 0 ? x - 4 : x - ax, cy < 0 ? y - 4 : y - ay, z], [cx < 0 ? x + ax : x + 4, cy < 0 ? y + ay : y + 4, z + 42], "Highland_StonePale"));
    }
  return merge(...out);
}
// The body of a stone house ±hx by ±hy: a dark plinth, fieldstone walls to E (to `upper` and then
// plaster, set in a little, if given), a string course, an eaves course and quoins.
function stoneBody(hx: number, hy: number, E: number, o: { upper?: number; plaster?: string } = {}): Geo {
  const top = o.upper ?? E, parts: Geo[] = [
    wuv(merge(
      boxBounds([-hx - 12, -hy - 12, 0], [hx + 12, hy + 12, 46], "Highland_StoneDark", 2),
      boxBounds([-hx, -hy, 46], [hx, hy, top], "Highland_Stone"),
    ), 1.2),
    boxBounds([-hx - 10, -hy - 10, E - 18], [hx + 10, hy + 10, E], "Highland_StonePale", 2),
    quoins(hx, hy, 46, top - 6),
  ];
  if (o.upper !== undefined)
    parts.push(
      boxBounds([-hx + 4, -hy + 4, o.upper], [hx - 4, hy - 4, E - 18], o.plaster ?? "Highland_Plaster"),
      boxBounds([-hx - 8, -hy - 8, o.upper - 6], [hx + 8, hy + 8, o.upper + 12], "Highland_StonePale", 2),
    );
  return merge(...parts);
}
// A small gabled dormer facing -X on a roof slope: its front at x (on the roof), w wide, `depth`
// back into the roof, its walls from z0 up `h`, a lit window in front, its own little snowy roof.
function dormer(x: number, y: number, z0: number, w: number, depth: number, h: number, seed: number, mat = "Highland_Roof"): Geo {
  const hw = w / 2;
  return translate(merge(
    boxBounds([0, -hw, 0], [depth, hw, h], "Highland_Plaster"),
    boxBounds([-4, -hw - 4, 0], [6, -hw + 8, h + 4], "Highland_Timber"),
    boxBounds([-4, hw - 8, 0], [6, hw + 4, h + 4], "Highland_Timber"),
    translate(snowRoof({ sx: depth + 14, sy: w, h: w * 0.55, z: h, over: 14, gableOver: 0, th: 12, snowTh: 11, mat, snow: 0.72, seed }), [(depth + 14) / 2 - 14, 0, 0]),
    gableWall(-2, hw - 2, h, w * 0.55 - 4, "Highland_Plaster"),
    translate(deepWindow(w * 0.42, h * 0.5), [0, 0, h * 0.24]),
  ), [x, y, z0]);
}
// The town's mark facing -X: a wine roundel ringed in gold, a gold peak and the sun over it.
function emblem(r: number): Geo {
  return merge(
    panel(circleShape(r + 5), -2, 2, "GoldTrim", { seg: 10 }),
    panel(circleShape(r), -3.5, 1.5, "Highland_Banner", { seg: 10 }),
    panel(circleShape(r * 0.24, r * 0.1, r * 0.32), -5, 1.5, "GoldTrim", { seg: 8 }),
    panel(peakShape(r * 0.66, -r * 0.2), -5, 1.5, "GoldTrim"),
  );
}
// A banner hanging from a rod at z = 0 in the plane x = 0: wine cloth, gold borders, a forked
// tail, the mark on both faces.
function banner(w: number, h: number): Geo {
  const hw = w / 2, m = translate(emblem(w * 0.3), [0, 0, -h * 0.42]);
  return merge(
    cylinderBetween([0, -hw - 12, 4], [0, hw + 12, 4], 2.5, 6, "WoodDark"),
    sphereCenter(4, [0, -hw - 13, 4], "GoldTrim", 6),
    sphereCenter(4, [0, hw + 13, 4], "GoldTrim", 6),
    boxBounds([-1.5, -hw, -h], [1.5, hw, 0], "Highland_Banner"),
    beamBetween([0, -hw, -h], [0, -hw * 0.3, -h - hw * 0.8], 3, w * 0.42, "Highland_Banner"),
    beamBetween([0, hw, -h], [0, hw * 0.3, -h - hw * 0.8], 3, w * 0.42, "Highland_Banner"),
    boxBounds([-2.2, -hw - 1, -h], [2.2, -hw + 5, 0], "GoldTrim"),
    boxBounds([-2.2, hw - 5, -h], [2.2, hw + 1, 0], "GoldTrim"),
    m,
    rotateZ(m, 180),
  );
}

// ---- crops and beasts ----
// A cabbage on `at`: a round head in its ring of outer leaves, a cap of snow if `snow`.
function cabbage(at: V3, s: number, seed: number, red = false, snow = false): Geo {
  const rnd = seeded(seed), head = red ? "Highland_CabbageRed" : "Highland_Cabbage", leaf = red ? "Highland_CabbageRed" : "Highland_CabbageDark";
  const parts: Geo[] = [lump([at[0], at[1], at[2] + 10 * s], [11 * s, 11 * s, 10 * s], seed, head, 1, 0.08, 30)];
  const a0 = rnd() * 360;
  for (let k = 0; k < 4; k++) {
    const a = (a0 + k * 90) * D;
    parts.push(translate(rotateZ(rotateY(scale(sphereCenter(11 * s, [0, 0, 0], leaf, 6), [1.25, 0.85, 0.22]), -24), a / D), [at[0] + Math.cos(a) * 10 * s, at[1] + Math.sin(a) * 10 * s, at[2] + 6 * s]));
  }
  if (snow) parts.push(scale(sphereCenter(8 * s, [at[0], at[1], at[2] + 19 * s], "Snow", 7), [1, 1, 0.36], [at[0], at[1], at[2] + 19 * s]));
  return merge(...parts);
}
// A leek: a white shank and a fan of dark blades.
function leek(at: V3, seed: number): Geo {
  const rnd = seeded(seed), a0 = rnd() * 180, parts: Geo[] = [cylinderAt({ rBot: 3.5, rTop: 3, height: 26, segments: 6, bottom: at }, "Highland_Leek")];
  for (let k = 0; k < 3; k++) {
    const a = (a0 + (k - 1) * 30) * D, lean = (k - 1) * 0.5 + (rnd() - 0.5) * 0.3;
    parts.push(beamBetween([at[0], at[1], at[2] + 22], [at[0] + Math.cos(a) * lean * 20, at[1] + Math.sin(a) * lean * 20, at[2] + 52 - Math.abs(lean) * 10], 6, 1.5, "Highland_CabbageDark"));
  }
  return merge(...parts);
}
// Tufts of young barley (or seedlings) on a bed at z, over x0..x1 by y0..y1.
function tufts(cards: Cards, x0: number, x1: number, y0: number, y1: number, z: number, n: number, h: number, seed: number): void {
  const rnd = seeded(seed);
  for (let i = 0; i < n; i++) {
    const at: V3 = [x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0), z];
    const a0 = rnd() * Math.PI;
    for (let k = 0; k < 2; k++) {
      const a = a0 + (k * Math.PI) / 2;
      cards.add(k ? "TuftCard" : "TuftCardDark", at, new THREE.Vector3(Math.cos(a), Math.sin(a), 0), new THREE.Vector3((rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.2, 1).normalize(), h * 1.1, h * (0.85 + rnd() * 0.3), new THREE.Vector3(0, 0, 1), [0, 0, 1, 1], true);
    }
  }
}
// A potato plant: a low leafy clump.
function potatoPlant(at: V3, seed: number): Geo {
  return translate(shrub({ seed, leaf: 11, density: 0.4, ragged: 0.5, core: 0.75, lobes: [[0, 0, 15, 16, 16, 13], [8, 5, 24, 10, 10, 9], [-7, -6, 22, 10, 10, 9]] }), at);
}
// A sheep, standing or lying down, looking to -X.
function sheep(seed: number, lying = false, grey = false): Geo {
  const wool = grey ? "Highland_WoolGrey" : "Highland_Wool", z = lying ? 24 : 50;
  const parts: Geo[] = [
    lump([0, 0, z], [44, 27, lying ? 22 : 25], seed, wool, 1, 0.12, 30),
    lump([-26, 0, z + 8], [20, 21, 19], seed + 3, wool, 1, 0.12, 30),
    translate(scale(sphereCenter(10, [0, 0, 0], "Highland_SheepFace", 8), [1.55, 0.95, 1.05]), [-48, 0, z + 14]),
    lump([-42, 0, z + 23], [9, 9, 6], seed + 5, wool, 0, 0.1, 20),
  ];
  for (const s of [-1, 1]) parts.push(translate(rotateX(box([10, 13, 4], [0, 0, 0], "Highland_SheepFace", 1), s * 30), [-42, s * 13, z + 18]));
  if (!lying) for (const [x, y] of [[-24, -12], [-24, 12], [22, -12], [22, 12]]) parts.push(cylinderAt({ rBot: 3.4, rTop: 4.2, height: 34, segments: 6, bottom: [x, y, 0] }, "Highland_SheepFace"));
  return merge(...parts);
}

// ---- dry-stone walling ----
// A dry-stone wall `len` long along Y, h high: battered faces of rough stone, stones standing
// out of them, a coping of slabs on edge, snow along the top and drifts at its foot.
function dryWall(len: number, h: number, seed: number): Geo {
  const rnd = seeded(seed), half = len / 2, b = 40, t = 26;
  const parts: Geo[] = [
    hull([[-b, -half, 0], [b, -half, 0], [-b, half, 0], [b, half, 0], [-t, -half, h], [t, -half, h], [-t, half, h], [t, half, h]], "Highland_DryStone", 0.7),
  ];
  // the coping: slabs on edge across the top, leaning a little each way
  const n = Math.max(3, Math.round(len / 34));
  for (let i = 0; i < n; i++) {
    const y = -half + (len * (i + 0.5)) / n;
    parts.push(translate(rotateX(box([t * 2 + 12, len / n - 3, 30 + rnd() * 8], [0, 0, 0], "Highland_DryStone", 2), (rnd() - 0.5) * 16), [0, y, h + 13]));
  }
  // stones standing out of the faces
  for (let i = 0; i < Math.round(len / 60); i++)
    for (const s of [-1, 1]) {
      const y = -half + 20 + rnd() * (len - 40), z = 12 + rnd() * (h - 30), x = s * (b - ((b - t) * z) / h);
      parts.push(translate(rock([30 + rnd() * 16, 34 + rnd() * 20, 18 + rnd() * 10], 0.3, seed * 7 + i * 2 + (s > 0 ? 1 : 0), rnd() < 0.5 ? "Highland_DryStone" : "Highland_StoneDark", true, 0), [x, y, z - 6]));
    }
  parts.push(scale(cylinderBetween([0, -half + 4, h + 26], [0, half - 4, h + 26], 22, 8, "Snow"), [1.3, 1, 0.55], [0, 0, h + 26]));
  for (let y = -half + 60 + rnd() * 60; y < half - 60; y += 130 + rnd() * 120) parts.push(drift([(rnd() < 0.5 ? -1 : 1) * (b + 12), y, 0], 70 + rnd() * 40, 110 + rnd() * 100, 24 + rnd() * 16));
  return merge(...parts);
}

// ==================================================================================================
// ---- the town wall ----
// An 800 cm length of town wall along Y (tiles end to end), the outside to -X: a dark footing, a
// thick battered wall of grey stone, a crenellated parapet outside on corbels, a low one inside,
// snow lying on the wall-walk and the merlons, buttresses and slits outside, icicles.
function cityWall(): Geo {
  const L = 400, out: Geo[] = [];
  out.push(wuv(merge(
    boxBounds([-120, -L, 0], [110, L, 60], "Highland_StoneDark"),
    hull([[-108, -L, 60], [-108, L, 60], [96, -L, 60], [96, L, 60], [-92, -L, 520], [-92, L, 520], [86, -L, 520], [86, L, 520]], "Highland_Stone"),
    boxBounds([-118, -L, 520], [-60, L, 600], "Highland_Stone"),
    boxBounds([60, -L, 520], [92, L, 566], "Highland_Stone"),
  ), 1.3));
  out.push(
    boxBounds([-60, -L, 520], [60, L, 524], "CobbleDark"),
    boxBounds([-104, -L, 440], [-90, L, 454], "Highland_StonePale"),
    boxBounds([-120, -L, 600], [-56, L, 610], "Highland_StonePale", 1.5),
    boxBounds([56, -L, 566], [96, L, 574], "Highland_StonePale", 1.5),
    array(boxBounds([-118, -L + 22, 610], [-58, -L + 78, 690], "Highland_Stone", 2), 8, [0, 100, 0]),
    array(box([60, 60, 9], [-88, -L + 50, 693], "Snow", 3), 8, [0, 100, 0]),
    array(boxBounds([-120, -L + 36, 486], [-90, -L + 64, 520], "Highland_StonePale", 1.5), 8, [0, 100, 0]),
    // the wall-walk under snow, banked against the parapets
    box([112, 2 * L, 14], [0, 0, 530], "Snow", 5),
    scale(cylinderBetween([-56, -L, 528], [-56, L, 528], 14, 6, "Snow"), [1, 1, 1.4], [-56, 0, 528]),
    scale(cylinderBetween([56, -L, 528], [56, L, 528], 12, 6, "Snow"), [1, 1, 1.3], [56, 0, 528]),
    box([44, 2 * L, 8], [76, 0, 578], "Snow", 3),
    icicles([-122, -L + 6, 600], [-122, L - 6, 600], 31, 30, 34),
  );
  for (const y of [-260, 260]) {
    out.push(wuv(hull([[-170, y - 46, 0], [-170, y + 46, 0], [-100, y - 46, 0], [-100, y + 46, 0], [-130, y - 40, 340], [-130, y + 40, 340], [-100, y - 40, 380], [-100, y + 40, 380]], "Highland_Stone"), 1.3));
    out.push(hull([[-172, y - 48, 336], [-172, y + 48, 336], [-130, y - 42, 346], [-130, y + 42, 346], [-100, y - 44, 386], [-100, y + 44, 386]], "Snow"));
  }
  for (const y of [-130, 130]) out.push(boxBounds([-103, y - 6, 300], [-96, y + 6, 400], "Highland_Dark"), boxBounds([-104, y - 14, 290], [-94, y + 14, 300], "Highland_StonePale"));
  out.push(drift([-150, -120, 0], 70, 220, 34), drift([-140, 150, 0], 60, 160, 26), drift([120, 40, 0], 60, 260, 30));
  return merge(...out);
}

// A round wall tower: a battered stone drum, a corbelled parapet with snowy merlons, a steep
// conical roof heavy with snow, slits and a lit window, a pennant.
function wallTower(): Geo {
  const r = 270, h = 900, roofH = 640, out: Geo[] = [
    ring(r + 40, 70, 0, "Highland_StoneDark", 16, r + 20),
    wuv(ring(r + 18, h - 70, 70, "Highland_Stone", 16, r), 1.3),
    ring(r + 17, 14, 440, "Highland_StonePale"),
    ring(r + 34, 110, h, "Highland_Stone"),
    ring(r + 40, 10, h + 100, "Highland_StonePale"),
    ring(r + 20, 6, h + 104, "Snow"),
  ];
  for (let i = 0; i < 16; i++) out.push(rotateZ(boxBounds([r - 4, -14, h - 50], [r + 36, 14, h], "Highland_StonePale", 1.5), i * 22.5));
  // the roof: a steep cone of tiles under a cone of snow, a finial and a wine pennant
  out.push(
    rotateZ(cylinderAt({ rBot: r + 70, rTop: 4, height: roofH, segments: 16, bottom: [0, 0, h + 110] }, "Highland_Roof"), 11.25),
    rotateZ(cylinderAt({ rBot: (r + 70) * 0.8, rTop: 2, height: roofH * 0.8, segments: 16, bottom: [0, 0, h + 110 + roofH * 0.2 + 10] }, "Snow"), 11.25),
    ring(r + 72, 8, h + 106, "Highland_Timber"),
    cylinderBetween([0, 0, h + 110 + roofH - 30], [0, 0, h + 110 + roofH + 130], 3, 6, "IronDark"),
    sphereCenter(10, [0, 0, h + 110 + roofH + 2], "GoldTrim", 8),
    boxBounds([-1.5, 0, h + roofH + 190], [1.5, 80, h + roofH + 230], "Highland_Banner"),
  );
  for (let i = 0; i < 16; i++) {
    const a = (i * 22.5 + 11.25) * D, rr = r + 70;
    out.push(cylinderAt({ rBot: 0.5, rTop: 3.5, height: 18 + (i % 3) * 12, segments: 5, bottom: [Math.cos(a) * rr, Math.sin(a) * rr, h + 92 - (i % 3) * 12] }, "IceBlue"));
  }
  // slits and a lit window toward each side
  for (const a of [0, 90, 180, 270]) {
    const c = Math.cos(a * D), s = Math.sin(a * D);
    out.push(translate(rotateZ(merge(boxBounds([-4, -7, 0], [2, 7, 110], "Highland_Dark"), boxBounds([-8, -16, -10], [0, 16, 0], "Highland_StonePale"), boxBounds([-8, -16, 110], [0, 16, 122], "Highland_StonePale")), a + 180), [c * (r + 16), s * (r + 16), 220]));
    out.push(translate(rotateZ(deepWindow(44, 66, { round: true }), a + 180 + 45), [Math.cos((a + 45) * D) * (r + 35), Math.sin((a + 45) * D) * (r + 35), h + 20]));
  }
  out.push(drift([-r - 10, 60, 0], 90, 260, 36), drift([r, -80, 0], 80, 200, 28));
  return merge(...out);
}

// The town gate, 11.2 m along Y: two square towers under steep snowy spires either side of an open
// arched passage 4 m wide, a crenellated gate block over it with the town's mark, lanterns, and
// the great doors standing open inward. The outside to -X.
function cityGate(): Geo {
  const HX = 150, R = 200, SP = 300, TOP = 720, TY = 380, T = 180, out: Geo[] = [];
  const mason: Geo[] = [boxBounds([-HX, -R, SP + R + 30], [HX, R, TOP], "Highland_Stone")];
  // the spandrels, in 20 cm slices down to the arch's voussoirs
  for (let y0 = -R; y0 < R; y0 += 20) {
    const m = Math.max(Math.abs(y0), Math.abs(y0 + 20)), z0 = SP + Math.sqrt(Math.max(0, (R + 24) ** 2 - m * m));
    if (z0 < SP + R + 28) mason.push(boxBounds([-HX, y0, z0], [HX, y0 + 20, SP + R + 32], "Highland_Stone"));
  }
  out.push(wuv(merge(...mason), 1.3));
  out.push(
    arcStones([0, 0, SP], R, 0, 180, 11, 34, 2 * HX + 10, "Highland_StonePale"),
    boxBounds([-HX - 30, -R, 0], [HX + 30, R, 5], "CobbleDark"),
    boxBounds([-HX - 8, -R - 4, TOP - 70], [HX + 8, R + 4, TOP - 56], "Highland_StonePale", 1.5),
    boxBounds([-HX - 14, -R, TOP], [-HX + 40, R, TOP + 70], "Highland_Stone"),
    boxBounds([HX - 30, -R, TOP], [HX + 6, R, TOP + 40], "Highland_Stone"),
    box([2 * HX - 50, 2 * R, 14], [5, 0, TOP + 6], "Snow", 5),
    array(boxBounds([-HX - 14, -R + 15, TOP + 70], [-HX + 40, -R + 65, TOP + 140], "Highland_Stone", 2), 4, [0, 100, 0]),
    array(box([52, 52, 9], [-HX + 13, -R + 40, TOP + 144], "Snow", 3), 4, [0, 100, 0]),
    icicles([-HX - 16, -R + 4, TOP], [-HX - 16, R - 4, TOP], 41, 26, 36),
  );
  // impost blocks at the springing
  for (const s of [-1, 1]) out.push(boxBounds([-HX - 6, s < 0 ? -R - 8 : R - 6, SP - 18], [HX + 6, s < 0 ? -R + 6 : R + 8, SP], "Highland_StonePale", 1.5));
  // the town's mark over the arch, front and back
  out.push(translate(emblem(70), [-HX, 0, SP + R + 130]), translate(rotateZ(emblem(70), 180), [HX, 0, SP + R + 130]));
  // the towers
  for (const s of [-1, 1]) {
    const y = s * TY;
    out.push(
      boxBounds([-T - 14, y - T - 14, 0], [T + 14, y + T + 14, 60], "Highland_StoneDark", 2),
      wuv(boxBounds([-T, y - T, 60], [T, y + T, 940], "Highland_Stone"), 1.3),
      translate(quoins(T, T, 60, 930), [0, y, 0]),
      boxBounds([-T - 12, y - T - 12, 930], [T + 12, y + T + 12, 960], "Highland_StonePale", 2),
      rotateZ(cylinderAt({ rBot: (T + 60) * Math.SQRT2, rTop: 4, height: 560, segments: 4, bottom: [0, y, 960] }, "Highland_Roof"), 45, [0, y, 0]),
      rotateZ(cylinderAt({ rBot: (T + 60) * Math.SQRT2 * 0.8, rTop: 2, height: 560 * 0.8, segments: 4, bottom: [0, y, 960 + 560 * 0.2 + 8] }, "Snow"), 45, [0, y, 0]),
      cylinderBetween([0, y, 1490], [0, y, 1620], 3, 6, "IronDark"),
      sphereCenter(9, [0, y, 1522], "GoldTrim", 8),
      boxBounds([-1.5, y, 1580], [1.5, y + s * 70, 1616], "Highland_Banner"),
      icicles([-T - 60, y - T - 60, 960], [-T - 60, y + T + 60, 960], 50 + s, 26, 38),
      icicles([T + 60, y - T - 60, 960], [T + 60, y + T + 60, 960], 52 + s, 26, 38),
      translate(deepWindow(56, 86, { round: true }), [-T, y, 640]),
      translate(rotateZ(deepWindow(56, 86, { round: true }), 180), [T, y, 640]),
      onFace(deepWindow(56, 86, { round: true }), s > 0 ? "+y" : "-y", y * s + T, 0, 640),
      translate(boxBounds([-4, -7, 0], [2, 7, 110], "Highland_Dark"), [-T, y, 260]),
      translate(wallLantern(), [-T, y - s * 90, 300]),
      translate(rotateZ(wallLantern(), 180), [T, y - s * 90, 300]),
      translate(banner(90, 260), [-T - 8, y + s * 60, 560]),
      drift([-T - 40, y + s * 40, 0], 90, 300, 30),
    );
  }
  // the doors, open against the passage walls inside
  for (const s of [-1, 1]) {
    const y0 = s < 0 ? -R + 1 : R - 9;
    out.push(boxBounds([20, y0, 6], [190, y0 + 8, 330], "DoorWood"));
    for (const z of [60, 190, 300]) out.push(boxBounds([24, s < 0 ? y0 + 8 : y0 - 2, z], [186, s < 0 ? y0 + 10 : y0, z + 10], "IronDark"));
  }
  return merge(...out);
}

// ==================================================================================================
// ---- houses ----
// A broad stone house, 8.8 m along the street, its ridge along Y: one storey and an attic under a
// steep roof heavy with snow, a covered porch over the door, small deep windows with green
// shutters, a dormer, a big chimney built out from the +Y gable and a woodpile at the -Y end.
function stoneHouse(): Geo {
  const HX = 330, HY = 440, E = 320, RH = 470, out: Geo[] = [];
  out.push(stoneBody(HX, HY, E));
  out.push(roofY(HX, HY, E, RH, { seed: 3, snow: 0.64 }));
  // front
  out.push(onFace(archDoor(110, 160), "-x", HX, -200, 46));
  out.push(onFace(porch(230, 170, 280, { seed: 4 }), "-x", HX, -200, 0));
  for (const y of [90, 300]) out.push(onFace(deepWindow(66, 84, { shutter: "Highland_Shutter" }), "-x", HX, y, 120));
  out.push(dormer(-262, 190, 410, 150, 210, 140, 6));
  out.push(onFace(wallLantern(), "-x", HX, 195, 240));
  // back
  for (const y of [-220, 220]) out.push(onFace(deepWindow(66, 84, { shutter: "Highland_Shutter" }), "+x", HX, y, 120));
  out.push(onFace(archDoor(96, 150, { lift: 46 }), "+x", HX, 20, 46));
  // the ends: the chimney on +Y; a window, the attic window and the woodpile on -Y
  out.push(onFace(endChimney(190, E + 40, E + RH + 160), "+y", HY, 0, 0));
  out.push(onFace(deepWindow(60, 80), "-y", HY, -120, 120), onFace(deepWindow(50, 66, { round: true }), "-y", HY, 0, E + 120));
  out.push(woodpile([130, -HY - 50, 0], 220, 90));
  // drifts against the walls
  out.push(drift([HX + 30, -80, 0], 60, 520, 30), drift([180, HY + 120, 0], 160, 80, 26), drift([-HX - 40, 330, 0], 70, 150, 22));
  return merge(...out);
}
// A stack of split logs len long along Y (turned `turn` degrees), snow on top.
function woodpile(at: V3, len: number, turn = 0): Geo {
  return translate(rotateZ(logStack(len), turn), at);
}
function logStack(len: number): Geo {
  const rnd = seeded(len), parts: Geo[] = [boxBounds([-34, -len / 2, 0], [34, len / 2, 8], "Highland_Timber")];
  for (let row = 0; row < 4; row++)
    for (let y = -len / 2 + 14 + (row % 2) * 9; y < len / 2 - 10; y += 19) {
      const r = 8 + rnd() * 2;
      parts.push(cylinderBetween([-30, y, 16 + row * 17], [30, y, 16 + row * 17], r, 6, "Highland_Boards"));
      parts.push(cylinderBetween([-31, y, 16 + row * 17], [-30, y, 16 + row * 17], r - 1.5, 6, "WoodPale"));
    }
  parts.push(scale(cylinderBetween([0, -len / 2 + 6, 82], [0, len / 2 - 6, 82], 30, 8, "Snow"), [1.2, 1, 0.42], [0, 0, 82]));
  return merge(...parts);
}

// A tall stone house, 5.4 m along the street, its gable to the front: a stone ground floor, a
// plaster upper floor, a covered porch, deep windows, a round window in the gable and a big
// chimney built out from the back gable.
function stoneHouseTall(): Geo {
  const HX = 380, HY = 270, G = 330, E = 640, RH = 420, out: Geo[] = [];
  out.push(stoneBody(HX, HY, E, { upper: G }));
  out.push(roofX(HX, HY, E, RH, { seed: 7, gable: "Highland_Plaster", snow: 0.64 }));
  // front
  out.push(onFace(archDoor(104, 160), "-x", HX, -110, 46));
  out.push(onFace(porch(210, 150, 275, { seed: 8 }), "-x", HX, -110, 0));
  out.push(onFace(deepWindow(62, 82, { shutter: "Highland_Shutter" }), "-x", HX, 150, 120));
  for (const y of [-120, 120]) out.push(onFace(deepWindow(62, 96, { shutter: "Highland_Shutter" }), "-x", HX - 4, y, G + 74));
  out.push(onFace(merge(panel(circleShape(42), -10, 10, "Highland_StonePale"), panel(circleShape(30), -12, 2, "Highland_WarmPane"), boxBounds([-14, -30, -2], [-12, 30, 2], "Highland_Timber"), boxBounds([-14, -2, -30], [-12, 2, 30], "Highland_Timber")), "-x", HX - 2, 0, E + 150));
  out.push(onFace(wallLantern(), "-x", HX, 44, 300));
  // back
  out.push(onFace(endChimney(170, G + 60, E + RH + 150), "+x", HX, 0, 0));
  out.push(onFace(deepWindow(56, 80), "+x", HX, -170, 120), onFace(deepWindow(56, 90, { shutter: "Highland_Shutter" }), "+x", HX - 4, 170, G + 74));
  // the sides
  for (const f of ["-y", "+y"] as const) {
    out.push(onFace(deepWindow(60, 82, { shutter: "Highland_Shutter" }), f, HY, -170, 120));
    out.push(onFace(deepWindow(60, 92, { shutter: "Highland_Shutter" }), f, HY - 4, 160, G + 74));
  }
  out.push(drift([120, HY + 36, 0], 380, 60, 26), drift([HX + 120, -170, 0], 120, 90, 24));
  return merge(...out);
}

// A crofter's cottage, 6 m along the street, ridge along Y: one storey under a steep snowy roof, a
// small porch, a lean-to woodshed on the -Y end and the chimney on the +Y gable.
function cottage(): Geo {
  const HX = 270, HY = 300, E = 270, RH = 400, out: Geo[] = [];
  out.push(stoneBody(HX, HY, E));
  out.push(roofY(HX, HY, E, RH, { seed: 11, snow: 0.66, over: 38, gableOver: 28 }));
  out.push(onFace(archDoor(100, 150), "-x", HX, -90, 46), onFace(porch(200, 140, 260, { seed: 12, bench: false }), "-x", HX, -90, 0));
  out.push(onFace(deepWindow(62, 80, { shutter: "Highland_Shutter" }), "-x", HX, 170, 110));
  out.push(onFace(deepWindow(62, 80, { shutter: "Highland_Shutter" }), "+x", HX, 0, 110));
  out.push(onFace(endChimney(170, E + 30, E + RH + 140), "+y", HY, 0, 0));
  // the woodshed: posts, a lean-to roof under snow, logs stacked inside
  const shed: Geo[] = [];
  for (const x of [-220, 220]) shed.push(boxAt([16, 16, 200], [x, -HY - 150, 0], "Highland_Timber", 1.5));
  shed.push(boxBounds([-236, -HY - 160, 196], [236, -HY - 140, 214], "Highland_Timber", 1.5));
  const ang = Math.atan2(60, 170) / D;
  shed.push(translate(rotateX(merge(roofUv(box([500, 190, 14], [0, -95, 7], "Highland_Roof", 2)), box([494, 160, 14], [0, -84, 20], "Snow", 4)), ang), [0, -HY + 4, 268]));
  shed.push(icicles([-246, -HY - 182, 200], [246, -HY - 182, 200], 13, 24, 30));
  shed.push(woodpile([0, -HY - 70, 0], 380, 90));
  out.push(...shed);
  out.push(drift([HX + 34, 0, 0], 60, 480, 28), drift([-120, HY + 30, 0], 200, 60, 22));
  return merge(...out);
}

// The farmhouse and its barn under one long line of roofs, 16.6 m along Y: the house (stone,
// porch, chimney on its end) on -Y, the bigger barn on +Y with stone walls below and weathered
// boards above, great doors standing open, a hay door with a hoist, a vent on the ridge, straw
// and barley stooks by the doors.
function farmhouse(): Geo {
  const out: Geo[] = [];
  // the house: ±330 by ±380, its middle at y = -440
  {
    const HX = 330, HY = 380, E = 320, RH = 470, Y = -440, h: Geo[] = [];
    h.push(stoneBody(HX, HY, E), roofY(HX, HY, E, RH, { seed: 15, snow: 0.64 }));
    h.push(onFace(archDoor(106, 160), "-x", HX, 40, 46), onFace(porch(220, 160, 275, { seed: 16 }), "-x", HX, 40, 0));
    for (const y of [-190, 270]) h.push(onFace(deepWindow(64, 84, { shutter: "Highland_Shutter" }), "-x", HX, y, 120));
    for (const y of [-150, 150]) h.push(onFace(deepWindow(64, 84, { shutter: "Highland_Shutter" }), "+x", HX, y, 120));
    h.push(onFace(endChimney(190, E + 40, E + RH + 160), "-y", HY, 0, 0));
    h.push(dormer(-262, -120, 410, 150, 210, 140, 17));
    out.push(translate(merge(...h), [0, Y, 0]));
  }
  // the barn: ±380 by ±430, its middle at y = 370
  {
    const HX = 380, HY = 430, S = 210, E = 440, RH = 480, Y = 370, b: Geo[] = [];
    b.push(wuv(merge(
      boxBounds([-HX + 1, -HY - 12, 0], [HX + 12, HY + 12, 40], "Highland_StoneDark", 2),
      boxBounds([-HX - 12, -HY - 12, 0], [-HX + 1, -176, 40], "Highland_StoneDark", 2),
      boxBounds([-HX - 12, 176, 0], [-HX + 1, HY + 12, 40], "Highland_StoneDark", 2),
      boxBounds([-HX, -HY, 40], [HX, HY, S], "Highland_Stone"),
    ), 1.2));
    b.push(quoins(HX, HY, 40, S - 10), boxBounds([-HX - 8, -HY - 8, S - 8], [HX + 8, HY + 8, S + 6], "Highland_StonePale", 2));
    b.push(wuv(boxBounds([-HX + 6, -HY + 6, S + 6], [HX - 6, HY - 6, E], "Highland_Boards"), 1, true));
    for (const s of [-1, 1]) {
      for (let y = -HY + 30; y < HY - 10; y += 42) b.push(boxBounds([s * (HX - 6) - (s > 0 ? 0 : 5), y - 4, S + 6], [s * (HX - 6) + (s > 0 ? 5 : 0), y + 4, E - 6], "Highland_Timber"));
      for (let x = -HX + 30; x < HX - 10; x += 42) b.push(boxBounds([x - 4, s * (HY - 6) - (s > 0 ? 0 : 5), S + 6], [x + 4, s * (HY - 6) + (s > 0 ? 5 : 0), E - 6], "Highland_Timber"));
    }
    b.push(boxBounds([-HX - 6, -HY - 6, E - 16], [HX + 6, HY + 6, E], "Highland_Timber", 1.5));
    b.push(rotateZ(merge(
      snowRoof({ sx: 2 * HY, sy: 2 * HX, h: RH, z: E, over: 44, gableOver: 32, seed: 19, snow: 0.74 }),
      wuv(merge(gableWall(HY - 6, HX - 6, E, RH - 8, "Highland_Boards"), gableWall(-HY + 6, HX - 6, E, RH - 8, "Highland_Boards")), 1, true),
    ), 90));
    // the great doors: the opening dark inside, one leaf open, one shut; a lintel beam
    b.push(boxBounds([-HX - 2, -150, 0], [-HX + 6, 150, 330], "Highland_Dark"));
    b.push(boxBounds([-HX - 16, -176, 330], [-HX + 4, 176, 356], "Highland_Timber", 2));
    for (const s of [-1, 1]) b.push(boxBounds([-HX - 16, s * 150 - 13, 0], [-HX + 4, s * 150 + 13, 340], "Highland_Timber", 2));
    const leaf = merge(boxBounds([-6, 0, 4], [0, 148, 324], "Highland_Boards"), beamBetween([-9, 8, 30], [-9, 140, 300], 4, 14, "Highland_Timber"), ...[30, 290].map((z) => boxBounds([-10, 4, z], [-6, 144, z + 16], "Highland_Timber")));
    b.push(translate(leaf, [-HX - 2, 2, 0]));
    b.push(translate(rotateZ(translate(rotateZ(leaf, 180), [0, 0, 0]), -70), [-HX - 6, -150, 0]));
    // the hay door in a gabled loft over the doors, a hoist beam with a rope
    b.push(boxBounds([-HX - 10, -110, E - 30], [-HX + 150, 110, E + 140], "Highland_Boards"));
    b.push(translate(snowRoof({ sx: 190, sy: 220, h: 130, z: E + 140, over: 16, gableOver: 0, th: 12, snowTh: 12, seed: 21, snow: 0.72 }), [-HX + 70, 0, 0]));
    b.push(gableWall(-HX - 12, 108, E + 140, 126, "Highland_Boards"));
    b.push(boxBounds([-HX - 14, -60, E - 10], [-HX - 8, 60, E + 110], "Highland_Dark"), translate(lump([-HX - 14, 0, E - 4], [16, 50, 22], 23, "Highland_Straw", 1, 0.2), [0, 0, 0]));
    b.push(boxBounds([-HX - 100, -8, E + 214], [-HX + 20, 8, E + 232], "Highland_Timber", 1.5), cylinderBetween([-HX - 88, 0, E + 214], [-HX - 88, 0, E + 20], 1.5, 4, "RopeTan"), boxBounds([-HX - 94, -6, E + 6], [-HX - 82, 6, E + 22], "IronDark"));
    // the vent on the ridge
    b.push(boxBounds([-70, -70, E + RH - 30], [70, 70, E + RH + 110], "Highland_Boards"), boxBounds([-72, -50, E + RH + 40], [72, 50, E + RH + 90], "Highland_Dark"));
    b.push(rotateZ(cylinderAt({ rBot: 120, rTop: 4, height: 110, segments: 4, bottom: [0, 0, E + RH + 110] }, "Highland_Roof"), 45), rotateZ(cylinderAt({ rBot: 92, rTop: 2, height: 85, segments: 4, bottom: [0, 0, E + RH + 140] }, "Snow"), 45));
    // the back: a small door and windows in the stone
    b.push(onFace(archDoor(100, 150, { lift: 40 }), "+x", HX, -200, 40));
    for (const y of [60, 280]) b.push(onFace(deepWindow(50, 50), "+x", HX, y, 110));
    out.push(translate(merge(...b), [0, Y, 0]));
  }
  // straw and barley stooks by the barn doors, drifts
  out.push(lump([-470, 860, 0], [70, 90, 60], 31, "Highland_Straw", 1, 0.18), scale(sphereCenter(60, [-470, 860, 52], "Snow", 8), [1.1, 1.3, 0.35], [-470, 860, 52]));
  out.push(translate(stooks(), [-520, 640, 0]), translate(rotateZ(stooks(), 70), [-560, -130, 0]));
  out.push(drift([380, -400, 0], 60, 600, 28), drift([420, 400, 0], 70, 700, 32), drift([-100, -900, 0], 200, 70, 26));
  return centre(merge(...out));
}
// Three sheaves of barley standing together under a cap of snow.
function stooks(): Geo {
  const parts: Geo[] = [];
  for (const [x, y, lean] of [[0, -36, -8], [0, 36, 8], [-30, 0, 0]] as const) {
    const sheaf = merge(
      cylinderAt({ rBot: 18, rTop: 10, height: 70, segments: 8, bottom: [0, 0, 0] }, "Highland_Barley"),
      cylinderAt({ rBot: 10, rTop: 16, height: 40, segments: 8, bottom: [0, 0, 70] }, "Highland_Barley"),
      cylinderAt({ radius: 11, height: 6, segments: 8, bottom: [0, 0, 64] }, "Highland_Straw"),
    );
    parts.push(translate(rotateX(sheaf, lean), [x, y, 0]));
  }
  parts.push(scale(sphereCenter(40, [-8, 0, 108], "Snow", 8), [1.1, 1.2, 0.34], [-8, 0, 108]));
  return merge(...parts);
}

// The elders' hall (the town hall), 16 m along the square: two storeys of stone and plaster under
// a great steep roof, a pillared portico with the town's mark in its gable, banners, lanterns, a
// bell turret on the ridge and big chimneys on both gables.
function eldersHall(): Geo {
  const HX = 520, HY = 800, G = 360, E = 700, RH = 640, out: Geo[] = [];
  out.push(stoneBody(HX, HY, E, { upper: G }));
  out.push(roofY(HX, HY, E, RH, { seed: 25, snow: 0.64, over: 52, gableOver: 40 }));
  // the portico: a stepped floor, four columns, an entablature, its own roof and gable
  const PX = HX + 300, py = 300;
  out.push(
    boxBounds([-PX - 60, -py - 50, 0], [-HX, py + 50, 18], "Highland_StoneDark", 2),
    boxBounds([-PX - 20, -py - 20, 18], [-HX, py + 20, 36], "Highland_StonePale", 2),
    boxBounds([-PX - 10, -py - 10, 420], [-HX, py + 10, 486], "Highland_StonePale", 2),
    boxBounds([-PX - 18, -py - 18, 486], [-HX, py + 18, 500], "Highland_StonePale", 2),
  );
  for (const y of [-240, -80, 80, 240])
    out.push(
      boxAt([64, 64, 26], [-PX + 30, y, 36], "Highland_StonePale", 2),
      cylinderAt({ rBot: 26, rTop: 23, height: 330, segments: 12, bottom: [-PX + 30, y, 62] }, "Highland_Stone"),
      boxAt([62, 62, 28], [-PX + 30, y, 392], "Highland_StonePale", 2),
    );
  out.push(translate(merge(
    snowRoof({ sx: 460, sy: 2 * py + 20, h: 340, z: 500, over: 30, gableOver: 0, th: 18, snowTh: 15, seed: 26, snow: 0.72 }),
    wuv(gableWall(-230 - 6, py + 8, 500, 334, "Highland_Stone"), 1.2),
  ), [-PX + 230 - 20, 0, 0]));
  out.push(translate(emblem(90), [-PX - 28, 0, 620]));
  out.push(onFace(archDoor(200, 230, { leaf: "DoorWood" }), "-x", HX, 0, 36), boxBounds([-HX - 7, -2, 36], [-HX - 5, 2, 266], "IronDark"));
  for (const y of [-200, 200]) out.push(onFace(wallLantern(), "-x", HX, y, 300));
  // the front's windows and banners
  for (const y of [-650, -460, 460, 650]) out.push(onFace(deepWindow(74, 110, { shutter: "Highland_Shutter" }), "-x", HX, y, 120));
  for (const y of [-650, -420, 420, 650]) out.push(onFace(deepWindow(70, 112, { round: true }), "-x", HX - 4, y, G + 110));
  for (const y of [-535, 535]) out.push(translate(banner(76, 220), [-HX - 20, y, G + 270]));
  // the back
  for (const y of [-600, -300, 0, 300, 600]) out.push(onFace(deepWindow(70, 100, { shutter: "Highland_Shutter" }), "+x", HX, y, 120), onFace(deepWindow(66, 106, { round: true }), "+x", HX - 4, y, G + 110));
  // the gables: chimneys, windows
  for (const f of ["-y", "+y"] as const) {
    out.push(onFace(endChimney(210, E + 80, E + RH + 220), f, HY, 0, 0));
    for (const u of [-300, 300]) out.push(onFace(deepWindow(66, 100, { shutter: "Highland_Shutter" }), f, HY, u, 120), onFace(deepWindow(62, 106, { round: true }), f, HY - 4, u, G + 110));
  }
  // the bell turret on the ridge: corner posts, open sides, a bell, a steep snowy spire
  const Z = E + RH - 60, B: Geo[] = [boxBounds([-110, -110, Z - 150], [110, 110, Z + 60], "Highland_Stone")];
  for (const [x, y] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) B.push(boxBounds([x * 100 - 16, y * 100 - 16, Z + 60], [x * 100 + 16, y * 100 + 16, Z + 260], "Highland_Timber", 2));
  B.push(boxBounds([-118, -118, Z + 54], [118, 118, Z + 70], "Highland_Timber", 1.5), boxBounds([-122, -122, Z + 256], [122, 122, Z + 280], "Highland_Timber", 1.5));
  B.push(cylinderAt({ rBot: 46, rTop: 26, height: 70, segments: 12, bottom: [0, 0, Z + 150] }, "Bronze"), sphereCenter(26, [0, 0, Z + 220], "Bronze", 10), cylinderBetween([0, -100, Z + 250], [0, 100, Z + 250], 5, 6, "IronDark"));
  B.push(rotateZ(cylinderAt({ rBot: 200, rTop: 4, height: 330, segments: 4, bottom: [0, 0, Z + 280] }, "Highland_Roof"), 45), rotateZ(cylinderAt({ rBot: 158, rTop: 2, height: 262, segments: 4, bottom: [0, 0, Z + 352] }, "Snow"), 45));
  B.push(cylinderBetween([0, 0, Z + 590], [0, 0, Z + 700], 3, 6, "IronDark"), sphereCenter(10, [0, 0, Z + 612], "GoldTrim", 8), panel(circleShape(24, 0, Z + 680), -1.5, 3, "GoldTrim"));
  B.push(icicles([-142, -142, Z + 280], [-142, 142, Z + 280], 61, 24, 30), icicles([142, -142, Z + 280], [142, 142, Z + 280], 62, 24, 30));
  out.push(...B);
  out.push(drift([HX + 34, -300, 0], 60, 700, 30), drift([HX + 30, 420, 0], 50, 500, 24), drift([-HX - 40, -700, 0], 70, 220, 26), drift([-HX - 40, 720, 0], 70, 180, 24));
  return merge(...out);
}

// ==================================================================================================
// ---- landmarks ----
// The Ancestor Stone: a great carved standing stone, 8 m high, on three round steps. Its broad
// faces are cut with the names of the first families in rows, the oldest filled with gold, the
// town's mark at its head; a band of carving rings it; evergreen wreaths and candles lie at its
// foot, four stone lanterns stand round it, snow lies on its shoulders and the steps.
function ancestorStone(): Geo {
  const out: Geo[] = [];
  const rnd = seeded(77);
  out.push(wuv(merge(ring(330, 30, 0, "Highland_StoneDark", 12), ring(270, 30, 30, "Highland_Stone", 12), ring(210, 30, 60, "Highland_StonePale", 12)), 1.2));
  const B = 90, TOP = 800, T = 62, W0 = 112, W1 = 82;
  const W = (z: number) => W0 + ((W1 - W0) * (z - B)) / (TOP - 120 - B);
  // the stone: a flat front face (x = -T), a rough back, the head rounded off
  const pts: V3[] = [];
  for (const s of [-1, 1]) {
    pts.push([-T, s * W0, B], [-T, s * W1, TOP - 120], [-T, s * 54, TOP - 40], [-T, s * 22, TOP - 6]);
    pts.push([T, s * (W0 - 6), B], [T - 6, s * (W1 - 8), TOP - 130], [T - 10, s * 50, TOP - 48], [T - 14, s * 20, TOP - 12]);
    pts.push([0, s * (W0 + 10), B + 160], [6, s * (W0 + 4), B + 380], [4, s * (W1 + 6), TOP - 200]);
  }
  pts.push([-T, 0, TOP], [T - 14, 0, TOP - 4], [8, 0, TOP + 6]);
  out.push(hull(pts, "Highland_Ancient", 1.3));
  // names in rows on the front and the back: words of random length, two columns
  const words = (face: 1 | -1, z0: number, z1: number, gold: number) => {
    const g: Geo[] = [];
    let row = 0;
    for (let z = z1; z > z0; z -= 17, row++) {
      const hw = W(z) - 20, x = face < 0 ? -T : T - (6 * (z - B)) / (TOP - 130 - B);
      for (const col of [-1, 1]) {
        let y = col < 0 ? -hw : 8;
        const end = col < 0 ? -8 : hw;
        while (y < end - 10) {
          const len = Math.min(end - y, 12 + rnd() * 26);
          g.push(boxBounds([x - 1.4, y, z], [x + 1.4, y + len, z + 5], row < gold ? "GoldTrim" : "Highland_Carve"));
          y += len + 7 + rnd() * 5;
        }
      }
    }
    return merge(...g);
  };
  out.push(words(-1, 170, 560, 3), words(1, 200, 540, 0));
  // a carved band round it, the mark at its head on the front, a sun on the back
  out.push(boxBounds([-T - 2, -W(600) - 2, 596], [-T + 2, W(600) + 2, 604], "Highland_Carve"), boxBounds([-T - 2, -W(580) - 2, 576], [-T + 2, W(580) + 2, 580], "Highland_Carve"));
  out.push(translate(merge(
    panel(circleShape(46), -1.5, 3, "Highland_Carve", { seg: 12 }),
    panel(circleShape(40), -2.5, 3, "Highland_Ancient", { seg: 12 }),
    panel(circleShape(10, 4, 14), -4, 3, "GoldTrim", { seg: 8 }),
    panel(peakShape(30, -8), -4, 3, "GoldTrim"),
  ), [-T, 0, 660]));
  out.push(translate(rotateZ(merge(panel(circleShape(30), -2, 3, "Highland_Carve", { seg: 12 }), ...Array.from({ length: 8 }, (_, i) => rotateX(boxBounds([-2, -3, 34], [1, 3, 52], "Highland_Carve"), i * 45))), 180), [T - 7, 0, 640]));
  // snow on its head and shoulders, on the steps
  out.push(scale(sphereCenter(54, [0, 0, TOP - 22], "Snow", 10), [1.05, 1.1, 0.42], [0, 0, TOP - 22]));
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 + 20) * D;
    out.push(rotateZ(drift([300, 0, 28], 50, 150, 10), (a / D)));
  }
  // offerings at its foot: two wreaths of evergreen with red berries, candles
  for (const s of [-1, 1]) {
    const c: V3 = [-T - 26, s * 62, 110];
    out.push(translate(rotateY(torus(22, 7, 12, 6, "Highland_Pine"), 70), c));
    for (let k = 0; k < 5; k++) out.push(sphereCenter(3, [c[0] - 6, c[1] + Math.cos(k * 1.3) * 20, c[2] + 4 + Math.sin(k * 1.3) * 20], "LacquerRed", 5));
  }
  for (const [x, y, h] of [[-T - 50, 0, 22], [-T - 46, -22, 16], [-T - 46, 24, 14], [-T - 64, -100, 18], [-T - 64, 102, 12]] as const)
    out.push(cylinderAt({ radius: 4.5, height: h, segments: 8, bottom: [x, y, 90] }, "Highland_Leek"), cylinderAt({ rBot: 2.5, rTop: 0.5, height: 7, segments: 5, bottom: [x, y, 90 + h] }, "FireGlow"));
  // stone lanterns on the diagonals
  for (let i = 0; i < 4; i++) {
    const a = (i * 90 + 45) * D, x = Math.cos(a) * 370, y = Math.sin(a) * 370;
    out.push(translate(merge(
      boxAt([56, 56, 20], [0, 0, 0], "Highland_StoneDark", 2),
      boxAt([34, 34, 110], [0, 0, 20], "Highland_Stone", 2),
      boxAt([54, 54, 54], [0, 0, 130], "Highland_StonePale", 2),
      boxBounds([-28, -14, 142], [28, 14, 174], "LanternGlow"),
      boxBounds([-14, -28, 142], [14, 28, 174], "LanternGlow"),
      rotateZ(cylinderAt({ rBot: 50, rTop: 6, height: 34, segments: 4, bottom: [0, 0, 184] }, "Highland_StoneDark"), 45),
      rotateZ(cylinderAt({ rBot: 38, rTop: 4, height: 24, segments: 4, bottom: [0, 0, 196] }, "Snow"), 45),
    ), [x, y, 0]));
  }
  return merge(...out);
}

// The Ancestors' Temple, 20 m long and 13.6 m across: on a stepped platform, a stone hall under a
// great steep roof of dark slate heavy with snow, a portico of four thick columns before its
// doors (one leaf open on the glow inside), the town's mark and a round window in the pediment,
// buttresses down the sides with tall lit windows between, wine banners, braziers burning at the
// front corners, and at the back a square bell tower with a snowy spire.
function ancestorsTemple(): Geo {
  const out: Geo[] = [];
  const X0 = -1000, X1 = 1040, Y0 = 680, CX0 = -470, CX1 = 660, CY = 500, B = 90, E = 830, RH = 720;
  for (let i = 0; i < 3; i++) out.push(wuv(boxBounds([X0 + i * 40, -Y0 + i * 40, i * 30], [X1 - i * 40, Y0 - i * 40, (i + 1) * 30], i ? "Highland_Stone" : "Highland_StoneDark", 2), 1.3));
  // the hall
  out.push(
    wuv(boxBounds([CX0, -CY, B], [CX1, CY, E - 30], "Highland_Stone"), 1.4),
    boxBounds([CX0 - 12, -CY - 12, B], [CX1 + 12, CY + 12, B + 50], "Highland_StoneDark", 2),
    boxBounds([CX0 - 8, -CY - 8, 500], [CX1 + 8, CY + 8, 516], "Highland_StonePale", 2),
    boxBounds([X0 + 96, -CY - 20, E - 30], [CX1 + 14, CY + 20, E], "Highland_StonePale", 2),
    translate(quoins(CY, CY, B + 50, E - 40, [[1, -1], [1, 1]]), [CX1 - CY, 0, 0]),
  );
  // buttresses down the sides with snow on their offsets, tall round-headed windows between them
  for (const x of [-330, -40, 250, 540])
    for (const s of [-1, 1]) {
      const y0 = s * CY, y1 = s * (CY + 90), ym = s * (CY + 42);
      out.push(wuv(hull([[x - 50, y0, B], [x + 50, y0, B], [x - 50, y1, B], [x + 50, y1, B], [x - 44, y0, 640], [x + 44, y0, 640], [x - 44, ym, 600], [x + 44, ym, 600]], "Highland_Stone"), 1.3));
      out.push(hull([[x - 46, ym, 600], [x + 46, ym, 600], [x - 46, y0, 640], [x + 46, y0, 640], [x - 46, ym, 610], [x + 46, ym, 610], [x - 46, y0, 650], [x + 46, y0, 650]], "Snow"));
    }
  for (const x of [-185, 105, 395]) for (const f of ["-y", "+y"] as const) out.push(onFace(deepWindow(70, 250, { round: true }), f, CY, x, 220));
  // the portico: four columns with bases and capitals under the entablature
  for (const y of [-400, -135, 135, 400])
    out.push(
      boxAt([96, 96, 34], [-900, y, B], "Highland_StonePale", 2),
      cylinderAt({ rBot: 44, rTop: 39, height: 560, segments: 14, bottom: [-900, y, B + 34] }, "Highland_Stone"),
      translate(ring(48, 16, 0, "Highland_StonePale", 14), [-900, y, B + 34]),
      translate(ring(46, 16, 0, "Highland_StonePale", 14), [-900, y, B + 578]),
      boxAt([100, 100, 36], [-900, y, B + 594], "Highland_StonePale", 2),
    );
  out.push(
    boxBounds([X0 + 50, -CY - 20, B + 630], [CX0, CY + 20, E - 30], "Highland_StonePale", 2),
    boxBounds([X0 + 40, -CY - 26, E - 34], [CX0, CY + 26, E], "Highland_StonePale", 2),
  );
  // the roof over hall and portico, the pediment, the rear gable
  const rx0 = X0 + 60, rx1 = CX1 + 10;
  out.push(translate(snowRoof({ sx: rx1 - rx0, sy: 2 * CY + 40, h: RH, z: E, over: 64, gableOver: 40, th: 26, snowTh: 22, seed: 41, snow: 0.74, mat: "Highland_TempleRoof", barge: "Highland_StonePale" }), [(rx0 + rx1) / 2, 0, 0]));
  out.push(wuv(gableWall(rx0 + 4, CY + 16, E, RH - 8, "Highland_StonePale"), 1.4), wuv(gableWall(rx1 - 4, CY + 16, E, RH - 8, "Highland_Stone"), 1.4));
  out.push(translate(merge(panel(circleShape(74), -12, 12, "Highland_StonePale", { seg: 14 }), panel(circleShape(58), -14, 2, "Highland_WarmPane", { seg: 14 }), ...Array.from({ length: 6 }, (_, i) => rotateX(boxBounds([-16, -3, 0], [-14, 3, 58], "Highland_Timber"), i * 60))), [rx0, 0, E + 350]));
  out.push(translate(emblem(100), [rx0 - 4, 0, E + 150]));
  // the doors: a great arched doorway in the hall's front, one leaf open on the warm light inside
  out.push(onFace(merge(
    panel(archShape(150, 280), -2, 2, "LanternGlow"),
    arcStones([-14, 0, 280], 150, 0, 180, 13, 34, 28, "Highland_StonePale"),
    ...[-1, 1].map((s) => boxAt([28, 34, 280], [-14, s * 167, 0], "Highland_StonePale", 2)),
    boxBounds([-10, 0, 0], [-4, 150, 280], "DoorWood"),
    ...[60, 200].map((z) => boxBounds([-12, 6, z], [-10, 144, z + 9], "Bronze")),
    translate(rotateZ(boxBounds([-6, 0, 0], [0, 150, 280], "DoorWood"), 75), [-6, -150, 0]),
  ), "-x", -CX0, 0, B));
  for (const s of [-1, 1]) out.push(translate(banner(100, 300), [CX0 - 20, s * 300, 700]));
  // braziers at the front corners of the platform
  for (const s of [-1, 1]) {
    const c: V3 = [X0 + 120, s * (Y0 - 110), B];
    out.push(translate(merge(
      boxAt([80, 80, 30], [0, 0, 0], "Highland_StoneDark", 2),
      cylinderAt({ rBot: 26, rTop: 20, height: 110, segments: 8, bottom: [0, 0, 30] }, "Highland_Stone"),
      cylinderAt({ rBot: 24, rTop: 58, height: 34, segments: 12, bottom: [0, 0, 140] }, "IronDark"),
      cylinderAt({ rBot: 50, rTop: 12, height: 60, segments: 8, bottom: [0, 0, 166] }, "FireGlow"),
      cylinderAt({ rBot: 26, rTop: 2, height: 52, segments: 6, bottom: [10, -8, 190] }, "FireGlow"),
    ), c));
  }
  // the bell tower at the back, its belfry clear above the ridge
  const TX0 = CX1, TX1 = X1 - 90, TY = 200, TT = 1940, OB = TT - 360, TC = (TX0 + TX1) / 2;
  out.push(
    wuv(boxBounds([TX0, -TY, B], [TX1, TY, TT], "Highland_Stone"), 1.4),
    translate(quoins((TX1 - TX0) / 2, TY, B + 20, TT - 20, [[1, -1], [1, 1]]), [TC, 0, 0]),
    boxBounds([TX0 - 10, -TY - 10, OB - 40], [TX1 + 10, TY + 10, OB - 24], "Highland_StonePale", 2),
    boxBounds([TX0 - 16, -TY - 16, TT], [TX1 + 16, TY + 16, TT + 40], "Highland_StonePale", 2),
  );
  const opening = merge(panel(archShape(60, 190), -4, 4, "Highland_Dark"), arcStones([-12, 0, 190], 60, 0, 180, 7, 20, 24, "Highland_StonePale"), boxBounds([-26, -78, -14], [0, 78, 0], "Highland_StonePale", 2), box([30, 150, 8], [-14, 0, 4], "Snow", 3));
  for (const f of ["+x", "-y", "+y"] as const) out.push(translate(onFace(opening, f, f === "+x" ? (TX1 - TX0) / 2 : TY, 0, OB), [TC, 0, 0]));
  out.push(onFace(merge(panel(circleShape(52), -10, 10, "Highland_StonePale", { seg: 12 }), panel(circleShape(42), -12, 2, "Highland_WarmPane", { seg: 12 })), "+x", TX1, 0, OB - 300));
  out.push(translate(merge(
    cylinderAt({ rBot: 62, rTop: 34, height: 90, segments: 12, bottom: [0, 0, OB + 60] }, "Bronze"),
    sphereCenter(34, [0, 0, OB + 150], "Bronze", 10),
    rotateZ(cylinderAt({ rBot: 300, rTop: 5, height: 600, segments: 4, bottom: [0, 0, TT + 40] }, "Highland_TempleRoof"), 45),
    rotateZ(cylinderAt({ rBot: 238, rTop: 3, height: 476, segments: 4, bottom: [0, 0, TT + 40 + 136] }, "Snow"), 45),
    cylinderBetween([0, 0, TT + 610], [0, 0, TT + 760], 4, 6, "IronDark"),
    sphereCenter(12, [0, 0, TT + 630], "GoldTrim", 8),
    panel(circleShape(34, 0, TT + 730), -2, 4, "GoldTrim", { seg: 12 }),
    rotateZ(panel(circleShape(34, 0, TT + 730), -2, 4, "GoldTrim", { seg: 12 }), 90),
  ), [TC, 0, 0]));
  for (const s of [-1, 1]) out.push(icicles([TC - 212, s * 212, TT + 40], [TC + 212, s * 212, TT + 40], 70 + s, 26, 40));
  // snow along the platform's sides
  for (const s of [-1, 1]) out.push(drift([200, s * (Y0 + 10), 20], 1200, 70, 30), drift([-650, s * (Y0 - 40), 80], 300, 50, 18));
  return merge(...out);
}

// A flight of steps 2.4 m long and 6.4 m wide rising 1 m toward +X (tiles end to end up a
// slope: put each about 50 cm down on it): five broad steps between cheek walls with snowy
// copings; the fill and the cheeks reach well below z = 0 to meet falling ground.
function templeStair(): Geo {
  const L = 120, W = 320, out: Geo[] = [];
  for (let i = 0; i < 5; i++) {
    const x0 = -L + i * 48;
    out.push(boxBounds([x0, -W, -140], [L, W, (i + 1) * 20], "Highland_StonePale", 2));
    out.push(boxBounds([x0 - 2, -W, (i + 1) * 20 - 3], [x0 + 10, W, (i + 1) * 20 + 0.5], "Highland_StoneDark"));
  }
  for (const s of [-1, 1]) {
    const y0 = s * W, y1 = s * (W + 56);
    out.push(hull([[-L, y0, -160], [L, y0, -160], [-L, y1, -160], [L, y1, -160], [-L, y0, 80], [L, y0, 180], [-L, y1, 80], [L, y1, 180]], "Highland_Stone", 1.3));
    out.push(hull([[-L, y0 - s * 6, 80], [L, y0 - s * 6, 180], [-L, y1 + s * 6, 80], [L, y1 + s * 6, 180], [-L, y0 - s * 6, 96], [L, y0 - s * 6, 196], [-L, y1 + s * 6, 96], [L, y1 + s * 6, 196]], "Highland_StonePale"));
    out.push(hull([[-L, y0, 96], [L, y0, 196], [-L, y1, 96], [L, y1, 196], [-L, y0 + s * 10, 106], [L, y0 + s * 10, 206], [-L, y1 - s * 10, 106], [L, y1 - s * 10, 206]], "Snow"));
    // snow lying in the corners of the steps
    for (let i = 0; i < 5; i++) out.push(scale(sphereCenter(20, [-L + i * 48 + 30, s * (W - 22), (i + 1) * 20], "Snow", 7), [1.4, 1.1, 0.4], [-L + i * 48 + 30, s * (W - 22), (i + 1) * 20]));
  }
  return merge(...out);
}

// ==================================================================================================
// ---- farming ----
// A glasshouse, 12 m long and 6.6 m across, its door to -X: a stone dwarf wall, white glazing bars
// and panes of glass warmed by a glowing stove, lanterns hung from the ridge, beds of cabbages,
// potato plants and young barley down both sides of a flagged path, seed trays by the door;
// snow drifted round outside and along the ridge.
function glasshouse(): Geo {
  const LX = 600, LY = 330, W0 = 76, E = 290, RH = 230, out: Geo[] = [];
  const t = 26;
  // the dwarf wall (a gap for the door), its coping
  out.push(wuv(merge(
    boxBounds([LX - t, -LY, 0], [LX, LY, W0], "Highland_Stone"),
    boxBounds([-LX, -LY, 0], [LX, -LY + t, W0], "Highland_Stone"),
    boxBounds([-LX, LY - t, 0], [LX, LY, W0], "Highland_Stone"),
    boxBounds([-LX, -LY, 0], [-LX + t, -60, W0], "Highland_Stone"),
    boxBounds([-LX, 60, 0], [-LX + t, LY, W0], "Highland_Stone"),
  ), 1.2));
  out.push(
    boxBounds([LX - t - 4, -LY - 4, W0], [LX + 4, LY + 4, W0 + 8], "Highland_StonePale", 1.5),
    boxBounds([-LX - 4, -LY - 4, W0], [LX + 4, -LY + t + 4, W0 + 8], "Highland_StonePale", 1.5),
    boxBounds([-LX - 4, LY - t - 4, W0], [LX + 4, LY + 4, W0 + 8], "Highland_StonePale", 1.5),
    boxBounds([-LX - 4, -LY - 4, W0], [-LX + t + 4, -60, W0 + 8], "Highland_StonePale", 1.5),
    boxBounds([-LX - 4, 60, W0], [-LX + t + 4, LY + 4, W0 + 8], "Highland_StonePale", 1.5),
  );
  // the floor: a flagged path, raised beds of soil with timber edges
  out.push(boxBounds([-LX + t, -60, 0], [LX - t, 60, 4], "Highland_StonePale"));
  for (const s of [-1, 1]) {
    const y0 = s < 0 ? -LY + t : 70, y1 = s < 0 ? -70 : LY - t;
    out.push(boxBounds([-LX + t + 10, y0, 0], [LX - t - 80, y1, 30], "Highland_Soil"));
    out.push(boxBounds([-LX + t + 10, s < 0 ? y1 - 6 : y0, 0], [LX - t - 80, s < 0 ? y1 : y0 + 6, 36], "Highland_Timber"));
  }
  // the crops: cabbages down the -Y bed, potato plants and barley down the +Y bed
  const rnd = seeded(91), cards = new Cards();
  for (let x = -LX + 80, i = 0; x < LX - 130; x += 60, i++)
    for (const y of [-240, -150]) out.push(cabbage([x + (rnd() - 0.5) * 10, y + (rnd() - 0.5) * 10, 30], 1.3, 100 + i * 3 + (y > -200 ? 1 : 0), i % 5 === 2));
  for (let x = -LX + 90, i = 0; x < 120; x += 62, i++) out.push(potatoPlant([x, 150 + (i % 2) * 70, 30], 200 + i));
  tufts(cards, 170, LX - 140, 100, LY - 40, 30, 46, 34, 9);
  out.push(cards.geo());
  // the stove at the back, its flue up through the roof
  out.push(
    boxBounds([LX - 120, -50, 0], [LX - 40, 50, 80], "IronDark", 2),
    boxBounds([LX - 122, -26, 18], [LX - 119, 26, 56], "FireGlow"),
    cylinderBetween([LX - 80, 0, 80], [LX - 80, 0, E + RH + 70], 9, 8, "IronDark"),
    cylinderAt({ rBot: 20, rTop: 6, height: 18, segments: 8, bottom: [LX - 80, 0, E + RH + 70] }, "IronDark"),
  );
  // the frame: posts, eaves plates, rafters, the ridge
  const G = "Highland_GlazingWhite";
  for (const s of [-1, 1]) {
    const y = s * (LY - 13);
    for (let x = -LX + 13, i = 0; x <= LX - 12; x += (2 * LX - 26) / 12, i++) out.push(boxBounds([x - 4, y - 4, W0], [x + 4, y + 4, E], G));
    out.push(boxBounds([-LX + 4, y - 7, E - 4], [LX - 4, y + 7, E + 6], G), boxBounds([-LX + 4, y - 5, W0 + 70], [LX - 4, y + 5, W0 + 76], G));
  }
  const a = Math.atan2(RH, LY - 13), slope = (LY - 13) / Math.cos(a);
  for (let x = -LX + 13; x <= LX - 12; x += (2 * LX - 26) / 12)
    for (const s of [-1, 1]) out.push(translate(rotateX(box([7, slope, 7], [0, (s * slope) / 2, 0], G), (-s * a) / D), [x, 0, E + RH]));
  out.push(boxBounds([-LX + 4, -6, E + RH - 6], [LX - 4, 6, E + RH + 8], G));
  // the glass: the long sides, the roof, the ends and their gables (the door left open)
  for (const s of [-1, 1]) {
    out.push(boxBounds([-LX + 13, s * (LY - 13) - 1, W0 + 6], [LX - 13, s * (LY - 13) + 1, E - 4], "Highland_Glass"));
    out.push(translate(rotateX(box([2 * LX - 26, slope, 2], [0, (s * slope) / 2, -3], "Highland_Glass"), (-s * a) / D), [0, 0, E + RH]));
    out.push(gableWall(s * (LX - 13), LY - 13, E, RH - 4, "Highland_Glass"));
  }
  out.push(boxBounds([LX - 14, -LY + 13, W0 + 6], [LX - 12, LY - 13, E], "Highland_Glass"));
  for (const [y0, y1] of [[-LY + 13, -64], [64, LY - 13]]) out.push(boxBounds([-LX + 12, y0, W0 + 6], [-LX + 14, y1, E], "Highland_Glass"));
  for (const x of [-LX + 13, LX - 13]) {
    for (const y of [-LY + 13, -160, -64, 64, 160, LY - 13]) out.push(boxBounds([x - 4, y - 4, x < 0 && Math.abs(y) < 70 ? 0 : W0], [x + 4, y + 4, E + (RH * (LY - 13 - Math.abs(y))) / (LY - 13) - 4], G));
    out.push(boxBounds([x - 5, -LY + 13, E - 4], [x + 5, LY - 13, E + 4], G));
  }
  out.push(boxBounds([-LX + 9, -64, 214], [-LX + 17, 64, 222], G), boxBounds([-LX + 12, -64, 222], [-LX + 14, 64, E], "Highland_Glass"));
  // the door, standing half open
  out.push(translate(rotateZ(merge(boxBounds([-3, 0, 4], [3, 120, 210], G), boxBounds([-1, 8, 80], [1, 112, 202], "Highland_Glass"), boxBounds([-4, 4, 4], [4, 116, 78], "Highland_Timber")), -60), [-LX + 13, -60, 0]));
  // lanterns from the ridge, seed trays on a bench by the door
  for (const x of [-330, 0, 330]) out.push(translate(hanging(110), [x, 0, E + RH - 6]));
  out.push(boxBounds([-LX + 40, LY - 120, 0], [-LX + 150, LY - 30, 70], "Highland_Timber", 1.5));
  const trays = new Cards();
  for (const x of [-LX + 70, -LX + 120]) {
    out.push(boxBounds([x - 22, LY - 112, 70], [x + 22, LY - 40, 80], "Highland_Soil"));
    tufts(trays, x - 18, x + 18, LY - 108, LY - 44, 80, 8, 12, x);
  }
  out.push(trays.geo());
  // snow: drifted round the dwarf wall, a line along the ridge and the eaves
  out.push(drift([0, -LY - 30, 0], 1100, 70, 40), drift([0, LY + 30, 0], 1000, 70, 36), drift([LX + 30, 0, 0], 70, 560, 34), drift([-LX - 30, -200, 0], 60, 200, 26), drift([-LX - 30, 210, 0], 60, 180, 24));
  out.push(scale(cylinderBetween([-LX + 6, 0, E + RH + 8], [LX - 6, 0, E + RH + 8], 12, 6, "Snow"), [1, 1.6, 0.6], [0, 0, E + RH + 8]));
  for (const s of [-1, 1]) out.push(box([2 * LX - 20, 16, 7], [0, s * (LY - 8), E + 9], "Snow", 3));
  return merge(...out);
}

// A row of four cold frames, 4.6 m: timber boxes, higher at the back, their glass lights sloping
// to the front, one propped open; seedlings inside, snow on the rims and drifted at the ends.
function coldFrames(): Geo {
  const out: Geo[] = [], cards = new Cards();
  for (let i = 0; i < 4; i++) {
    const y = -171 + i * 114, hw = 52;
    out.push(
      boxBounds([-72, y - hw, 0], [-64, y + hw, 30], "Highland_Timber"),
      boxBounds([64, y - hw, 0], [72, y + hw, 52], "Highland_Timber"),
      hull([[-72, y - hw, 0], [72, y - hw, 0], [-72, y - hw, 30], [72, y - hw, 52], [-72, y - hw + 7, 0], [72, y - hw + 7, 0], [-72, y - hw + 7, 30], [72, y - hw + 7, 52]], "Highland_Timber"),
      hull([[-72, y + hw, 0], [72, y + hw, 0], [-72, y + hw, 30], [72, y + hw, 52], [-72, y + hw - 7, 0], [72, y + hw - 7, 0], [-72, y + hw - 7, 30], [72, y + hw - 7, 52]], "Highland_Timber"),
      boxBounds([-64, y - hw + 7, 0], [64, y + hw - 7, 10], "Highland_Soil"),
    );
    tufts(cards, -54, 54, y - hw + 14, y + hw - 14, 10, 7, 14, 30 + i);
    const ang = Math.atan2(22, 144) / D, open = i === 2 ? 34 : 0;
    const lid = merge(boxBounds([-148, -hw, 0], [0, hw, 3], "Highland_Glass"), boxBounds([-148, -hw, 0], [0, -hw + 6, 5], "Highland_GlazingWhite"), boxBounds([-148, hw - 6, 0], [0, hw, 5], "Highland_GlazingWhite"), boxBounds([-148, -3, 0], [0, 3, 5], "Highland_GlazingWhite"), boxBounds([-148, -hw, 0], [-140, hw, 5], "Highland_GlazingWhite"));
    out.push(translate(rotateY(lid, -ang + open), [72, y, 52]));
    if (open) out.push(cylinderBetween([-62, y + 30, 30], [-50, y + 30, 120], 1.6, 4, "Highland_Timber"));
    out.push(box([12, 2 * hw, 6], [68, y, 55], "Snow", 2), box([10, 2 * hw, 5], [-68, y, 32], "Snow", 2));
  }
  out.push(cards.geo());
  out.push(drift([0, -250, 0], 140, 70, 30), drift([0, 250, 0], 140, 60, 28), drift([100, 0, 0], 50, 420, 22));
  return merge(...out);
}

// A walled vegetable plot under snow, 6 by 4 m: a low stone kerb round a bed where the snow lies
// in a blanket and the winter crops stand through it in rows: cabbages, red cabbages, leeks, a
// ridge of potatoes under straw; a scarecrow in the corner and a little sign.
function vegPlot(): Geo {
  const out: Geo[] = [], rnd = seeded(55);
  for (const s of [-1, 1]) {
    out.push(boxBounds([-300, s * 200 - 12, 0], [300, s * 200 + 12, 26], "Highland_StoneDark", 2), box([600, 26, 8], [0, s * 200, 29], "Snow", 3));
    out.push(boxBounds([s * 300 - 12, -188, 0], [s * 300 + 12, 188, 26], "Highland_StoneDark", 2), box([26, 376, 8], [s * 300, 0, 29], "Snow", 3));
  }
  out.push(boxBounds([-288, -188, 0], [288, 188, 10], "Highland_Soil"), box([572, 372, 12], [0, 0, 14], "Snow", 5));
  for (let x = -250, i = 0; x <= 250; x += 50, i++) {
    out.push(cabbage([x + (rnd() - 0.5) * 8, -140, 12], 1.15, 300 + i, false, true));
    out.push(cabbage([x + (rnd() - 0.5) * 8, -70, 12], 1.05, 330 + i, true, true));
  }
  for (let x = -260, i = 0; x <= 260; x += 34, i++) out.push(leek([x, 4 + (i % 2) * 8, 14], 400 + i));
  out.push(scale(cylinderBetween([-270, 100, 12], [270, 100, 12], 34, 8, "Highland_Soil"), [1, 1, 0.7], [0, 100, 12]));
  out.push(scale(cylinderBetween([-266, 100, 22], [266, 100, 22], 30, 8, "Highland_Straw"), [1, 1, 0.55], [0, 100, 22]));
  out.push(scale(cylinderBetween([-262, 100, 30], [262, 100, 30], 24, 8, "Snow"), [1, 1, 0.5], [0, 100, 30]));
  for (let x = -230; x <= 230; x += 58) out.push(cylinderBetween([x, 100 + (rnd() - 0.5) * 20, 30], [x + (rnd() - 0.5) * 20, 100 + (rnd() - 0.5) * 30, 58], 1.4, 4, "Highland_Straw"));
  // the scarecrow
  out.push(translate(merge(
    cylinderAt({ radius: 4, height: 200, segments: 6, bottom: [0, 0, 0] }, "Highland_Timber"),
    cylinderBetween([0, -70, 150], [0, 70, 150], 3, 6, "Highland_Timber"),
    hull([[-14, -34, 80], [14, -34, 80], [-14, 34, 80], [14, 34, 80], [-12, -40, 158], [12, -40, 158], [-12, 40, 158], [12, 40, 158]], "Highland_Banner"),
    sphereCenter(18, [0, 0, 182], "Highland_Sack", 8),
    cylinderAt({ rBot: 30, rTop: 30, height: 4, segments: 10, bottom: [0, 0, 196] }, "Highland_Straw"),
    cylinderAt({ rBot: 16, rTop: 12, height: 20, segments: 10, bottom: [0, 0, 198] }, "Highland_Straw"),
    scale(sphereCenter(22, [0, 0, 216], "Snow", 8), [1.3, 1.3, 0.4], [0, 0, 216]),
    scale(sphereCenter(10, [0, -62, 154], "Snow", 6), [1.5, 1, 0.5], [0, -62, 154]),
    scale(sphereCenter(10, [0, 62, 154], "Snow", 6), [1.5, 1, 0.5], [0, 62, 154]),
    cylinderBetween([0, -70, 150], [-6, -84, 128], 2, 4, "Highland_Straw"),
    cylinderBetween([0, 70, 150], [-6, 84, 130], 2, 4, "Highland_Straw"),
  ), [230, 150, 12]));
  // the sign
  out.push(translate(merge(cylinderAt({ radius: 3.5, height: 90, segments: 6, bottom: [0, 0, 0] }, "Highland_Timber"), boxBounds([-3, -30, 66], [3, 30, 96], "Highland_Boards", 1), translate(cabbage([0, 0, 0], 0.55, 999), [-6, 0, 74]), box([10, 64, 5], [0, 0, 99], "Snow", 2)), [-334, -150, 0]));
  return merge(...out);
}

// A dry-stone field wall 4 m long (tiles end to end along Y), about 1.4 m high with its coping.
function fieldWall(): Geo {
  return dryWall(400, 110, 7);
}

// A sheep pen, 6 by 5.6 m: dry-stone walls round three sides, a hurdle gate standing open at the
// front, a lean-to shelter along the back over straw, a hay rack, a trough with ice, five sheep.
function sheepPen(): Geo {
  const out: Geo[] = [];
  out.push(translate(dryWall(560, 90, 11), [290, 0, 0]));
  for (const s of [-1, 1]) {
    out.push(translate(rotateZ(dryWall(560, 90, 13 + s), 90), [0, s * 270, 0]));
  }
  for (const s of [-1, 1]) out.push(translate(dryWall(130, 90, 17 + s), [-290, s * 215, 0]));
  // the hurdle gate, swung open
  const hurdle = merge(
    ...[0, 50, 100, 150].map((y) => boxAt([8, 8, 110], [0, y, 0], "Highland_Timber", 1)),
    ...[30, 64, 98].map((z) => boxBounds([-3, 0, z], [3, 150, z + 8], "Highland_Boards")),
    beamBetween([0, 4, 34], [0, 146, 100], 5, 6, "Highland_Boards"),
  );
  out.push(translate(rotateZ(hurdle, -120), [-290, -150, 0]));
  // the shelter: posts, a lean-to roof under snow, straw
  for (const y of [-220, 0, 220]) out.push(boxAt([16, 16, 190], [110, y, 0], "Highland_Timber", 1.5));
  out.push(boxBounds([102, -240, 186], [118, 240, 202], "Highland_Timber", 1.5));
  const ang = Math.atan2(66, 224) / D;
  out.push(translate(rotateY(merge(roofUv(box([240, 560, 14], [120, 0, 7], "Highland_Roof", 2)), box([200, 548, 14], [112, 0, 20], "Snow", 4)), -ang), [80, 0, 194]));
  out.push(icicles([86, -270, 196], [86, 270, 196], 17, 26, 30));
  out.push(lump([200, 0, 0], [80, 230, 10], 61, "Highland_Straw", 1, 0.2));
  // the hay rack and the trough
  out.push(translate(merge(
    ...[-70, 70].map((y) => merge(boxAt([10, 10, 130], [0, y, 0], "Highland_Timber", 1), beamBetween([-30, y, 130], [30, y, 130], 8, 8, "Highland_Timber"))),
    ...[-56, -28, 0, 28, 56].map((y) => merge(beamBetween([0, y, 40], [-34, y, 128], 3, 3, "Highland_Timber"), beamBetween([0, y, 40], [34, y, 128], 3, 3, "Highland_Timber"))),
    lump([0, 0, 96], [36, 70, 30], 63, "Highland_Straw", 1, 0.25),
  ), [0, 140, 0]));
  out.push(boxBounds([-150, -222, 0], [-30, -180, 40], "Highland_StoneDark", 2), boxBounds([-142, -216, 30], [-38, -186, 38], "IceBlue"));
  // the sheep
  out.push(translate(sheep(1), [-80, -60, 0]), translate(rotateZ(sheep(2, false, true), 140), [70, 20, 0]), translate(rotateZ(sheep(3, true), 200), [180, -130, 0]));
  out.push(translate(rotateZ(sheep(4, true), 170), [190, 60, 0]), translate(rotateZ(sheep(5), -40), [-170, 110, 0]));
  out.push(drift([-200, -230, 0], 120, 60, 24), drift([-230, 230, 0], 80, 70, 22));
  return merge(...out);
}

// A market stall of the winter's crops, 3.2 m: a timber frame under a steep little snowy roof, a
// counter of crates of potatoes and cabbages, sacks of barley, strings of onions, a slate board.
function vegStall(): Geo {
  const out: Geo[] = [], rnd = seeded(71);
  for (const [x, y] of [[-70, -150], [-70, 150], [70, -150], [70, 150]]) out.push(boxAt([12, 12, 256], [x, y, 0], "Highland_Timber", 1.5));
  for (const x of [-70, 70]) out.push(boxBounds([x - 9, -166, 240], [x + 9, 166, 258], "Highland_Timber", 1.5));
  for (const y of [-150, 150]) out.push(boxBounds([-80, y - 8, 244], [80, y + 8, 258], "Highland_Timber", 1.5));
  out.push(rotateZ(snowRoof({ sx: 350, sy: 160, h: 120, z: 258, over: 30, gableOver: 0, th: 12, snowTh: 13, seed: 72, snow: 0.72 }), 90));
  out.push(...[-1, 1].map((s) => rotateZ(gableWall(s * 175, 78, 258, 116, "Highland_Boards"), 90)));
  out.push(boxBounds([-86, -156, 0], [-60, 156, 84], "Highland_Boards", 1.5), boxBounds([-92, -162, 84], [-40, 162, 92], "Highland_Timber", 1.5));
  // crates on the counter: potatoes, cabbages, leeks
  const crate = (y: number, fill: (cx: number, cy: number) => Geo) => {
    out.push(boxBounds([-88, y - 44, 92], [-40, y + 44, 116], "Highland_Boards", 1.5));
    for (let i = 0; i < 6; i++) out.push(fill(-74 + (i % 2) * 20, y - 30 + Math.floor(i / 2) * 30));
  };
  crate(-100, (cx, cy) => merge(...[0, 1, 2].map((k) => lump([cx + (rnd() - 0.5) * 12, cy + (rnd() - 0.5) * 14, 112 + k * 4], [7, 6, 5], 500 + Math.floor(rnd() * 99), "Highland_Potato", 0, 0.15, 20))));
  crate(0, (cx, cy) => cabbage([cx, cy, 108], 0.9, 600 + Math.floor(rnd() * 99), rnd() < 0.3));
  crate(100, (cx, cy) => merge(...[0, 1, 2].map((k) => lump([cx + (rnd() - 0.5) * 12, cy + (rnd() - 0.5) * 14, 112 + k * 4], [7, 6, 5], 700 + Math.floor(rnd() * 99), "Highland_Potato", 0, 0.15, 20))));
  // sacks of barley beside it, onions hung from the beam, the slate
  for (const [x, y] of [[-40, -210], [-10, -236], [-50, 218]]) out.push(lump([x, y, 0], [24, 22, 40], x * y, "Highland_Sack", 1, 0.1, 30), cylinderAt({ radius: 14, height: 8, segments: 8, bottom: [x, y, 52] }, "Highland_Barley"));
  for (const y of [-110, -50, 50, 110]) {
    out.push(cylinderBetween([-78, y, 226], [-78, y, 170], 1, 4, "RopeTan"));
    for (let k = 0; k < 4; k++) out.push(sphereCenter(6, [-78 + (k % 2) * 4, y + (k % 2 ? 4 : -4), 176 + k * 12], "Highland_Straw", 6));
  }
  out.push(boxBounds([-100, -40, 0], [-96, 40, 70], "Highland_Timber"), boxBounds([-104, -36, 24], [-100, 36, 66], "Highland_Dark"));
  out.push(translate(lantern(), [-70, 150, 270]));
  out.push(drift([60, -200, 0], 90, 80, 22), drift([80, 190, 0], 80, 90, 20));
  return merge(...out);
}
// ==================================================================================================
// ---- town fabric ----
// The old well: a round stone curb with ice on the water, two stone posts carrying a steep little
// roof of tiles under snow, a windlass with its rope and bucket.
function well(): Geo {
  const bucket = merge(
    cylinderAt({ rBot: 11, rTop: 14, height: 22, segments: 10, bottom: [0, 0, 0] }, "Highland_Boards"),
    cylinderAt({ radius: 11.6, height: 2.5, segments: 10, bottom: [0, 0, 3] }, "IronDark"),
    cylinderAt({ radius: 13.8, height: 2.5, segments: 10, bottom: [0, 0, 17] }, "IronDark"),
    translate(rotateX(torus(14, 1, 10, 4, "IronDark"), 90), [0, 0, 22]),
  );
  return merge(
    ring(130, 14, 0, "Highland_StoneDark", 12),
    wuv(ring(100, 76, 14, "Highland_Stone", 12), 1.1),
    translate(torus(96, 10, 16, 6, "Highland_StonePale"), [0, 0, 90]),
    translate(scale(torus(95, 9, 16, 6, "Snow"), [1, 1, 0.55]), [0, 0, 99]),
    cylinderAt({ radius: 88, height: 2, segments: 12, bottom: [0, 0, 70] }, "IceBlue"),
    ...[-1, 1].map((s) => merge(boxAt([36, 36, 240], [0, s * 112, 0], "Highland_Stone", 2), boxAt([44, 44, 16], [0, s * 112, 240], "Highland_StonePale", 2))),
    boxBounds([-12, -132, 256], [12, 132, 272], "Highland_Timber", 1.5),
    rotateZ(snowRoof({ sx: 290, sy: 230, h: 150, z: 272, over: 22, gableOver: 0, th: 12, snowTh: 13, seed: 81, snow: 0.74 }), 90),
    ...[-1, 1].map((s) => rotateZ(gableWall(s * 145, 113, 272, 146, "Highland_Timber"), 90)),
    cylinderBetween([0, -94, 190], [0, 120, 190], 3, 6, "IronDark"),
    cylinderBetween([0, -50, 190], [0, 50, 190], 11, 8, "Highland_Boards"),
    ...[-36, -18, 0, 18, 36].map((y) => translate(rotateX(torus(12, 2, 10, 4, "RopeTan"), 90), [0, y, 190])),
    cylinderBetween([0, 0, 178], [0, 0, 128], 1, 4, "RopeTan"),
    translate(bucket, [0, 0, 106]),
    beamBetween([0, 120, 190], [0, 120, 160], 4, 4, "IronDark"),
    cylinderBetween([0, 120, 162], [0, 138, 162], 2.2, 6, "Highland_Timber"),
    translate(bucket, [104, -60, 14]),
    drift([-120, 80, 0], 90, 160, 30), drift([110, 110, 0], 80, 120, 24),
  );
}

// A street lamp, 3.4 m: a stone pedestal, an iron post with a scrolled collar, a big lantern at
// the top under a cap of snow and two small ones hung from a crossbar with icicles.
function streetLamp(): Geo {
  return merge(
    boxAt([60, 60, 18], [0, 0, 0], "Highland_StoneDark", 3),
    boxAt([42, 42, 46], [0, 0, 18], "Highland_Stone", 2),
    boxAt([50, 50, 8], [0, 0, 64], "Highland_StonePale", 2),
    box([46, 46, 6], [0, 0, 74], "Snow", 2),
    cylinderAt({ rBot: 9, rTop: 6, height: 230, segments: 8, bottom: [0, 0, 72] }, "IronDark"),
    ring(10, 8, 150, "GoldTrim", 8),
    ring(10, 6, 286, "IronDark", 8),
    cylinderBetween([0, -54, 290], [0, 54, 290], 3, 6, "IronDark"),
    ...[-1, 1].map((s) => merge(beamBetween([0, s * 6, 250], [0, s * 46, 290], 3, 3, "IronDark"), translate(hanging(64), [0, s * 50, 290]))),
    icicles([0, -50, 287], [0, 50, 287], 5, 14, 18),
    translate(scale(lantern(), [1.35, 1.35, 1.35]), [0, 0, 292]),
  );
}

// A snowdrift, about 4.6 m along Y: soft mounds banked together.
function snowDrift(): Geo {
  return merge(
    mound(220, 460, 76, 91),
    mound(160, 260, 54, 92, [40, 150, 0], 20),
    mound(140, 220, 44, 93, [-40, -170, 0], -15),
    mound(90, 120, 30, 94, [-110, 60, 0], 50),
  );
}

// A great crag of the mountains, 15 m across and 15 m high: rock masses piled round a spire, snow
// lying on everything that faces up. Scale it up for the peaks behind the town.
function mountainCrag(): Geo {
  const rocks = merge(
    rock([900, 760, 1500], 0.38, 101, "Highland_Crag"),
    translate(rock([760, 620, 950], 0.42, 103, "Highland_CragDark"), [-380, 380, 0]),
    translate(rock([700, 680, 820], 0.4, 107, "Highland_Crag"), [330, -380, 0]),
    translate(rock([600, 520, 600], 0.45, 109, "Highland_CragDark"), [-420, -330, 0]),
    translate(rock([520, 560, 520], 0.45, 113, "Highland_Crag"), [420, 360, 0]),
    translate(rock([440, 420, 380], 0.5, 127, "Highland_CragDark"), [-650, 20, 0]),
  );
  return merge(rocks, coverTop(rocks, "Snow", { amount: 0.52, thick: 10, seed: 3, grain: 160 }));
}

// ==================================================================================================
// ---- the sample: a corner of Highland Hill ----
// The Ancestor Stone in the square, the elders' hall closing its north side, stone houses down
// the east side, the farm corner on the west (a glasshouse, cold frames, a walled plot, the sheep
// pen), the market stalls and the well, and along the south edge the town wall with a gate and
// towers; lamps, drifts, snowy pines, and a crag of the mountains in the far corner.
function sample(put: Put): void {
  put("ancestor_stone", [0, 0, 0]);
  for (const [x, y] of [[-650, -650], [-650, 650], [650, -650], [650, 650]]) put("street_lamp", [x, y, 0]);
  put("elders_hall", [1650, 0, 0], 0, 0.9);
  // the east side: houses facing the square
  put("stone_house", [1050, -1650, 0], -90, 0.9);
  put("stone_house_tall", [100, -1600, 0], -90, 0.9);
  put("cottage", [-850, -1650, 0], -90, 0.9);
  put("veg_stall", [400, -900, 0], -90);
  put("veg_stall", [-400, -900, 0], -90);
  put("well", [-950, 650, 0]);
  // the west side: the farm corner
  put("glasshouse", [750, 1750, 0], 90);
  put("cold_frames", [-50, 2300, 0], 90);
  put("veg_plot", [-150, 1500, 0], 90);
  put("sheep_pen", [-1200, 1700, 0], 90, 0.9);
  put("barley_stooks", [-600, 1000, 0], 30);
  put("barley_stooks", [-520, 1150, 0], 100);
  for (const y of [1050, 1450]) put("field_wall", [250, y, 0], 0);
  // the south edge: the wall, its gate and towers
  put("city_gate", [-2150, 0, 0], 0, 0.85);
  for (const y of [-1000, -1700, 1000, 1700]) put("city_wall", [-2150, y, 0], 0, 0.85);
  for (const y of [-2350, 2350]) put("wall_tower", [-2150, y, 0], 0, 0.85);
  for (const y of [-1350, 1350]) put("snow_drift", [-1800, y, 0], 0);
  // snow, trees and the mountain
  put("snow_drift", [900, 900, 0], 30);
  for (const [x, y, k, s] of [[2300, 1800, "SnowPine", 1.1], [2100, 2400, "SnowPineSmall", 1], [-200, -2500, "SnowPine", 0.9], [1800, -1500, "FrostOak", 0.9], [-1500, -1000, "SnowPineSmall", 1], [-1400, 900, "FrostOak", 0.8]] as const)
    put(`flora:${k}`, [x, y, 0], x, s);
  put("mountain_crag", [2700, -2700, 0], 30, 0.55);
}

export const KIT: Kit = {
  id: "highland",
  name: "ไฮแลนด์ ฮิล",
  region: "เชิงเขาหิมะทางเหนือของโนอา",
  desc: "เมืองโบราณเชิงเขาหิมะ ถิ่นกำเนิดของบรรพบุรุษ บ้านหินกำแพงหนาหลังคาชันหนักหิมะ ปล่องไฟหินใหญ่ หน้าต่างเล็กลึกอบอุ่น ระเบียงมีหลังคา หินบรรพบุรุษจารึกชื่อกลางลาน วิหารบรรพบุรุษบนเนิน เรือนกระจกปลูกมันฝรั่ง กะหล่ำ ข้าวบาร์เลย์ แปลงผักใต้หิมะ และคอกแกะ",
  ground: "snow",
  items: [
    // landmarks
    { id: "ancestor_stone", name: "หินบรรพบุรุษ", make: ancestorStone, tags: ["landmark", "decor"] },
    { id: "ancestors_temple", name: "วิหารบรรพบุรุษ", make: () => centre(ancestorsTemple()), tags: ["landmark", "building"] },
    { id: "temple_stair", name: "บันไดขึ้นวิหาร (2.4 ม.)", make: templeStair, tags: ["ground", "stairs"] },
    // buildings
    { id: "elders_hall", name: "หอผู้อาวุโส", make: eldersHall, tags: ["building", "landmark"] },
    { id: "stone_house", name: "บ้านหินหลังคาชัน", make: () => centre(stoneHouse()), tags: ["building"] },
    { id: "stone_house_tall", name: "บ้านหินสองชั้น", make: () => centre(stoneHouseTall()), tags: ["building"] },
    { id: "cottage", name: "กระท่อมหินชาวไร่", make: () => centre(cottage()), tags: ["building"] },
    { id: "farmhouse", name: "ฟาร์มเฮาส์และโรงนา", make: farmhouse, tags: ["building", "farm"] },
    // farming
    { id: "glasshouse", name: "เรือนกระจก", make: glasshouse, tags: ["building", "farm"] },
    { id: "cold_frames", name: "กระบะเพาะกล้า", make: coldFrames, tags: ["farm", "decor"] },
    { id: "veg_plot", name: "แปลงผักใต้หิมะ", make: vegPlot, tags: ["farm", "plant"] },
    { id: "barley_stooks", name: "ฟ่อนข้าวบาร์เลย์", make: stooks, tags: ["farm", "decor"] },
    { id: "field_wall", name: "กำแพงหินแห้ง (4 ม.)", make: fieldWall, tags: ["wall", "farm"] },
    { id: "sheep_pen", name: "คอกแกะ", make: sheepPen, tags: ["farm", "decor"] },
    { id: "veg_stall", name: "แผงผักไร่ภูเขา", make: vegStall, tags: ["market"] },
    // town fabric
    { id: "city_wall", name: "กำแพงเมืองหิน (8 ม.)", make: cityWall, tags: ["wall", "defence"] },
    { id: "wall_tower", name: "หอคอยกำแพง", make: wallTower, tags: ["tower", "defence"] },
    { id: "city_gate", name: "ประตูเมืองหิน", make: cityGate, tags: ["gate", "defence", "landmark"] },
    { id: "well", name: "บ่อน้ำหินเก่า", make: well, tags: ["decor"] },
    { id: "street_lamp", name: "โคมไฟถนน", make: streetLamp, tags: ["light"] },
    { id: "snow_drift", name: "กองหิมะ", make: () => centre(snowDrift()), tags: ["ground", "decor"] },
    { id: "mountain_crag", name: "ผาหินภูเขา", make: () => centre(mountainCrag()), tags: ["rock", "landmark"] },
  ],
  sample,
};

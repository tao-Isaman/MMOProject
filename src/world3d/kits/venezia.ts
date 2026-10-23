// เวนิชเซีย (Venezia): the trading port on its lagoon in the south-west of the western lands, a city
// of canals whose life is bound to the water. Pastel palazzi in pink, ochre, salmon and cream with
// Venetian-Gothic windows (ogee arches in white Istrian stone), balconies and funnel chimneys, and
// the narrower canal houses; the domed basilica, the brick campanile and the arcades round the
// great piazza, the Doge's arcaded palace; the covered Rialto bridge across the grand canal, small
// stone bridges and a timber one; the fondamenta that line every canal, steps down to the water,
// striped mooring poles, gondolas and their station; the great harbour piers and a merchant
// galleon; the winged-lion column, flagpoles, a carved well-head, the mask shop, market and spice
// stalls, lamps, café tables, cargo off the ships; and on the land side, where the caravans leave,
// a brick wall with swallowtail merlons, its towers and a triumphal gate under the lion.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front facing -X.
// Bridges are walked along their own Y at z = 0 (a low deck; their arches face ±X and reach down
// to the water); quay walls, piers and poles reach 2-4 m down into it. Boats and the gondola
// station float with their waterline at their own z = 0: place them at the water's level.

import * as THREE from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, array, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, torus, gableWall, rock,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import type { Recipe } from "../textures";
import type { Kit, Put } from "./types";

// ---------- the town's own colours ----------
const VENEZIA_MATS: Record<string, Recipe> = {
  // the pastel plasters of the palazzi
  Venezia_Pink: { map: "plaster", tint: "#eaa9a1", bump: 0.6 },
  Venezia_Ochre: { map: "plaster", tint: "#e7bb66", bump: 0.6 },
  Venezia_Salmon: { map: "plaster", tint: "#eb9772", bump: 0.6 },
  Venezia_Cream: { map: "plaster", tint: "#f2e3c2", bump: 0.6 },
  Venezia_Rust: { map: "plaster", tint: "#c8644c", bump: 0.6 },
  // white Istrian stone for every trim, grey trachyte for the paving, old brick
  Venezia_Istrian: { map: "stone", tint: "#f5f1e7", bump: 1.2 },
  Venezia_Trachyte: { map: "stone", tint: "#86827c", bump: 1.5 },
  Venezia_Brick: { map: "brick", tint: "#b85c40", bump: 1.5 },
  Venezia_BrickOld: { map: "brick", tint: "#94523c", bump: 1.5 },
  Venezia_Marble: { map: "marble", tint: "#efe8dd", rough: 0.4 },
  Venezia_Granite: { map: "marble", tint: "#a99088", rough: 0.4 },
  Venezia_Verde: { map: "marble", tint: "#5f7f6c", rough: 0.35 }, // green marble columns
  Venezia_Algae: { map: "stone", tint: "#4e6844", bump: 2 }, // the weed line where the water laps
  // roofs: coppi tiles, ridge tiles, lead
  Venezia_Roof: { map: "tiles", tint: "#c96f46", bump: 2.5 },
  Venezia_RoofRidge: { map: "tiles", tint: "#a5553a", bump: 2 },
  Venezia_Lead: { map: "metal", tint: "#8f9aa2", rough: 0.55, metal: 0.35 },
  // paint, shutters, gilding, bronze
  Venezia_Shutter: { map: "wood", tint: "#467152", bump: 1 },
  Venezia_PaintRed: { map: "plaster", tint: "#b8322c", rough: 0.5, bump: 0.3 },
  Venezia_PaintBlue: { map: "plaster", tint: "#2c5da6", rough: 0.5, bump: 0.3 },
  Venezia_PaintWhite: { map: "plaster", tint: "#f6f3ec", rough: 0.5, bump: 0.3 },
  Venezia_Mosaic: { map: "metal", tint: "#e2b048", rough: 0.3, metal: 0.6, glow: "#6a4a10", glowI: 0.25 },
  Venezia_MosaicBlue: { map: "plaster", tint: "#2f4f8c", rough: 0.4 },
  Venezia_Patina: { map: "metal", tint: "#5a705f", rough: 0.5, metal: 0.5 }, // the lion's old bronze
  Venezia_HullBottom: { map: "wood", tint: "#6e3326", bump: 1 },
  Venezia_Tar: { map: "fabric", tint: "#4a3d2e", rough: 1 },
  Venezia_Dark: { tint: "#211d1c", rough: 0.95 }, // deep shadow in openings
  // cloth and goods
  Venezia_Velvet: { map: "felt", tint: "#8c1f2c", rough: 0.9 },
  Venezia_Canvas: { map: "fabric", tint: "#efe1c3", rough: 0.95 },
  Venezia_Silk: { map: "fabric", tint: "#2f8f86", rough: 0.5 },
  Venezia_Geranium: { map: "felt", tint: "#da313b", rough: 0.7 },
  Venezia_Leaf: { map: "felt", tint: "#3f7a34", rough: 0.9 },
  Venezia_Orange: { map: "felt", tint: "#f08a24", rough: 0.6 },
  Venezia_Lemon: { map: "felt", tint: "#f2d33b", rough: 0.6 },
  Venezia_Aubergine: { map: "felt", tint: "#4b2350", rough: 0.45 },
  Venezia_Artichoke: { map: "felt", tint: "#6f8a4a", rough: 0.8 },
  Venezia_Saffron: { map: "felt", tint: "#e3962a", rough: 1 },
  Venezia_Paprika: { map: "felt", tint: "#a8321f", rough: 1 },
  Venezia_Turmeric: { map: "felt", tint: "#e8b62a", rough: 1 },
  Venezia_Pepper: { map: "felt", tint: "#3b2c25", rough: 1 },
  Venezia_Wicker: { map: "bamboo", tint: "#c9a86a", rough: 0.8 },
  Venezia_Clay: { map: "adobe", tint: "#b9693e", bump: 1 },
  // the canals' water (greener than the open sea)
  Venezia_Water: { tint: "#3f7c78", rough: 0.08, opacity: 0.9 },
};
for (const [name, recipe] of Object.entries(VENEZIA_MATS)) defineMaterial(name, recipe);

const IST = "Venezia_Istrian";
const D = Math.PI / 180;

// ---------- texture coordinates ----------
// World-aligned (metres / s): masonry courses stay level and run on across neighbouring boxes;
// `vertical` turns them (planks up a door).
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
// Roof slabs: U along the eaves, V up the slope, so the tile courses lie level on every slope.
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

// ---------- placing details ----------
// Put a piece built facing -X (its back on x = 0, centred on y = 0) onto one face of a box
// building: `d` from the centre to that wall, `u` along the wall, bottom at z.
type Face = "-x" | "+x" | "-y" | "+y";
function onFace(g: Geo, face: Face, d: number, u: number, z: number): Geo {
  if (face === "-x") return translate(g, [-d, u, z]);
  if (face === "+x") return translate(rotateZ(g, 180), [d, u, z]);
  if (face === "-y") return translate(rotateZ(g, 90), [u, -d, z]);
  return translate(rotateZ(g, -90), [u, d, z]);
}
// ... or onto a drum: `r` out from its axis at `c`, facing the compass angle `deg` (0 = +X).
function onRound(g: Geo, r: number, deg: number, z: number, c: V3 = [0, 0, 0]): Geo {
  return translate(rotateZ(translate(g, [-r, 0, z]), deg - 180), c);
}

// ---------- outlines in a wall's plane (shape x = world y, shape y = world z) ----------
// Openings: straight jambs up to the springing, then a flat, round, pointed (Gothic) head or the
// Venetian ogee, the S-curved arch that rises to a point (arco inflesso).
type Head = "flat" | "round" | "pointed" | "ogee";
const riseOf = (head: Head, hw: number): number => (head === "flat" ? 0 : head === "round" ? hw : head === "pointed" ? hw * 1.732 : hw * 1.2);
// The head of an opening centred on cy, from its springing on one side to the other: dir 1 goes
// from the left jamb (cy - hw) over the top to the right one, -1 the other way.
function headTo(p: THREE.Path, cy: number, hw: number, spring: number, head: Head, dir: 1 | -1): void {
  const r = riseOf(head, hw), s = dir;
  if (head === "round") p.absarc(cy, spring, hw, dir > 0 ? Math.PI : 0, dir > 0 ? 0 : Math.PI, dir > 0);
  else if (head === "pointed") {
    if (dir > 0) {
      p.absarc(cy + hw, spring, 2 * hw, Math.PI, (2 * Math.PI) / 3, true);
      p.absarc(cy - hw, spring, 2 * hw, Math.PI / 3, 0, true);
    } else {
      p.absarc(cy - hw, spring, 2 * hw, 0, Math.PI / 3, false);
      p.absarc(cy + hw, spring, 2 * hw, (2 * Math.PI) / 3, Math.PI, false);
    }
  } else if (head === "ogee") {
    p.bezierCurveTo(cy - s * hw, spring + r * 0.55, cy, spring + r * 0.4, cy, spring + r);
    p.bezierCurveTo(cy, spring + r * 0.4, cy + s * hw, spring + r * 0.55, cy + s * hw, spring);
  } else p.lineTo(cy + s * hw, spring);
}
function outline<T extends THREE.Path>(p: T, hw: number, spring: number, head: Head, bottom = 0, cy = 0): T {
  p.moveTo(cy - hw, bottom);
  p.lineTo(cy + hw, bottom);
  p.lineTo(cy + hw, spring);
  headTo(p, cy, hw, spring, head, -1);
  p.lineTo(cy - hw, bottom);
  return p;
}
const shapeOf = (hw: number, spring: number, head: Head, bottom = 0): THREE.Shape => outline(new THREE.Shape(), hw, spring, head, bottom);
// A frame round an opening, open at its foot: up the inside of the left jamb, over the opening's
// head, down the right jamb, out by t and back over the outer outline.
function frameShape(hw: number, spring: number, head: Head, t: number, bottom = 0): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-hw - t, bottom);
  s.lineTo(-hw, bottom);
  s.lineTo(-hw, spring);
  headTo(s, 0, hw, spring, head, 1);
  s.lineTo(hw, bottom);
  s.lineTo(hw + t, bottom);
  s.lineTo(hw + t, spring);
  headTo(s, 0, hw + t, spring, head, -1);
  s.lineTo(-hw - t, bottom);
  return s;
}
// A wall ±(y0..y1) from z0 to z1 with openings cut up from its foot, each [centre, half-width,
// springing, head] (an arcade, a gateway, a belfry).
function arcadeShape(y0: number, y1: number, z0: number, z1: number, ops: [number, number, number, Head][]): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(y0, z0);
  for (const [cy, hw, spring, head] of [...ops].sort((a, b) => a[0] - b[0])) {
    s.lineTo(cy - hw, z0);
    s.lineTo(cy - hw, spring);
    headTo(s, cy, hw, spring, head, 1);
    s.lineTo(cy + hw, z0);
  }
  s.lineTo(y1, z0);
  s.lineTo(y1, z1);
  s.lineTo(y0, z1);
  s.lineTo(y0, z0);
  return s;
}
function rectShape(y0: number, y1: number, z0: number, z1: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(y0, z0);
  s.lineTo(y1, z0);
  s.lineTo(y1, z1);
  s.lineTo(y0, z1);
  s.lineTo(y0, z0);
  return s;
}
function circleShape(r: number, cy = 0, cz = 0): THREE.Shape {
  const s = new THREE.Shape();
  s.absarc(cy, cz, r, 0, Math.PI * 2, false);
  return s;
}
function ringShape(r: number, t: number, cy = 0, cz = 0): THREE.Shape {
  const s = circleShape(r + t, cy, cz);
  const h = new THREE.Path();
  h.absarc(cy, cz, r, 0, Math.PI * 2, true);
  s.holes.push(h);
  return s;
}
// A bridge's face: a wall ±hw wide from z0 up to z1 with a segmental arch cut out of its foot,
// spanning ±span from its springing at zs up to its crown at zc.
function spandrelShape(hw: number, z0: number, z1: number, span: number, zs: number, zc: number): THREE.Shape {
  const rise = zc - zs, R = (span * span + rise * rise) / (2 * rise), cz = zc - R, a = Math.atan2(zs - cz, span);
  const s = new THREE.Shape();
  s.moveTo(-hw, z0);
  s.lineTo(-span, z0);
  s.lineTo(-span, zs);
  s.absarc(0, cz, R, Math.PI - a, a, true);
  s.lineTo(span, z0);
  s.lineTo(hw, z0);
  s.lineTo(hw, z1);
  s.lineTo(-hw, z1);
  s.lineTo(-hw, z0);
  return s;
}
// A flat piece cut to a shape, facing -X, from x0 to x0 + depth.
function panel(shape: THREE.Shape, x0: number, depth: number, mat: string, o: { s?: number; vertical?: boolean; seg?: number } = {}): Geo {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: o.seg ?? 5 });
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, x0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  const geo = g.index ? g.toNonIndexed() : g;
  geo.clearGroups();
  return wuv([{ geo, mat }], o.s ?? 1, o.vertical);
}
// A flat piece cut to a shape in the X-Z plane (shape x = world x, shape y = world z), from y0
// back to y0 - depth (wings, blades, ship's figures seen from the side).
function sidePanel(shape: THREE.Shape, y0: number, depth: number, mat: string, seg = 6): Geo {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: seg });
  g.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, -1, y0, 0, 1, 0, 0, 0, 0, 0, 1));
  const geo = g.index ? g.toNonIndexed() : g;
  geo.clearGroups();
  return wuv([{ geo, mat }]);
}
// A solid of revolution about Z through [radius, z] points from the bottom up.
function lathe(pts: [number, number][], seg: number, mat: string, at: V3 = [0, 0, 0]): Geo {
  const g = new THREE.LatheGeometry(pts.map(([r, z]) => new THREE.Vector2(Math.max(0.01, r), z)), seg);
  g.rotateX(Math.PI / 2);
  const rMax = Math.max(...pts.map((p) => p[0])), len = pts.reduce((t, p, i) => (i ? t + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  const uv = g.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * Math.PI * 2 * rMax) / 100, (uv.getY(i) * len) / 100);
  g.translate(...at);
  return [{ geo: g.toNonIndexed(), mat }];
}
// A round rope or stem through some points.
function tube(pts: V3[], r: number, mat: string, seg = 16, radial = 5): Geo {
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, radial, false);
  return wuv([{ geo: g.toNonIndexed(), mat }]);
}
// A spiral stripe round a pole of radius r from z0 to z1, one turn every `pitch`.
function helix(r: number, z0: number, z1: number, pitch: number, tr: number, mat: string, phase = 0): Geo {
  const turns = (z1 - z0) / pitch, n = Math.max(8, Math.round(turns * 10)), pts: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = phase + t * turns * Math.PI * 2;
    pts.push([Math.cos(a) * r, Math.sin(a) * r, z0 + (z1 - z0) * t]);
  }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), n, tr, 3, false);
  return [{ geo: g.toNonIndexed(), mat }];
}
// A solid wrapped round some points (lumps, sloping walls).
function hullGeo(pts: V3[], mat: string): Geo {
  return wuv([{ geo: new ConvexGeometry(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))), mat }]);
}
// A double-sided surface through F(u, v) over [u0, u1] x [v0, v1] (sails, awnings, flags).
function surf(F: (u: number, v: number) => V3, u0: number, u1: number, v0: number, v1: number, nu: number, nv: number, mat: string): Geo {
  const pos: number[] = [], uv: number[] = [];
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => {
        const u = u0 + ((u1 - u0) * a) / nu, v = v0 + ((v1 - v0) * b) / nv;
        return { p: F(u, v), u, v };
      });
      for (const k of [0, 1, 2, 0, 2, 3, 0, 2, 1, 0, 3, 2]) {
        pos.push(...q[k].p);
        uv.push(q[k].u * 3, q[k].v * 3);
      }
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return [{ geo, mat }];
}
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// A cloth over four corners (bottom-left, bottom-right, top-left, top-right; a triangle when the
// top two are one), bellied by `bulge` most in its middle.
function clothAt(bl: V3, br: V3, tl: V3, tr: V3, bulge: V3, edge = 0.3) {
  return (u: number, v: number): V3 => {
    const b = lerp3(bl, br, u), t = lerp3(tl, tr, u), p = lerp3(b, t, v), k = (edge + (1 - edge) * Math.sin(Math.PI * u)) * Math.sin(Math.PI * v);
    return [p[0] + bulge[0] * k, p[1] + bulge[1] * k, p[2] + bulge[2] * k];
  };
}
function sheet(bl: V3, br: V3, tl: V3, tr: V3, bulge: V3, mat: string, nu = 6, nv = 5, edge = 0.3): Geo {
  return surf(clothAt(bl, br, tl, tr, bulge, edge), 0, 1, 0, 1, nu, nv, mat);
}
// Wedge stones round an arc in a -X facing wall: centre c, from radius r out to r + thick,
// between a0 and a1 (degrees from +Y over the top), `depth` through the wall.
function arcStones(c: V3, r: number, a0: number, a1: number, n: number, thick: number, depth: number, mat: string, bevel = 0): Geo {
  const out: Geo[] = [];
  const step = (a1 - a0) / n, chord = 2 * (r + thick) * Math.sin((Math.abs(step) * D) / 2) * 1.04, rm = r + thick / 2;
  for (let i = 0; i < n; i++) {
    const a = (a0 + step * (i + 0.5)) * D;
    out.push(translate(rotateX(box([depth, chord, thick], [0, 0, 0], mat, bevel), a / D - 90), [c[0], c[1] + rm * Math.cos(a), c[2] + rm * Math.sin(a)]));
  }
  return merge(...out);
}
// The underside of an arch: `n` slats along X, `len` long, on the circle of radius R about the
// X axis at height cz, spanning `half` degrees either side of the top.
function vault(len: number, R: number, cz: number, half: number, n: number, mat: string, th = 14): Geo {
  const out: Geo[] = [], step = (2 * half) / n, w = 2 * R * Math.sin((step / 2) * D) + 2;
  for (let i = 0; i < n; i++) out.push(rotateX(box([len, w, th], [0, 0, R + th / 2], mat), -half + step * (i + 0.5)));
  return translate(merge(...out), [0, 0, cz]);
}

// ---------- Venetian details ----------
interface WinOpt { head?: Head; frame?: string; glass?: string; shutters?: boolean; flowers?: number; grille?: boolean; t?: number }
// A window on a -X facing wall (back on x = 0, centred on y = 0, the sill at z = 0): an Istrian
// surround standing 8 cm proud of the plaster, the glass set back in it behind dark glazing bars,
// a sill; green shutters folded back, a box of red geraniums or an iron grille when asked.
function win(w: number, h: number, o: WinOpt = {}): Geo {
  const hw = w / 2, head = o.head ?? "ogee", t = o.t ?? 11, rise = riseOf(head, hw), spring = h - rise, fm = o.frame ?? IST;
  const out: Geo[] = [
    panel(frameShape(hw, spring, head, t), -8, 10, fm),
    panel(shapeOf(hw, spring, head), -1.5, 2, o.glass ?? "GlassBlue"),
    boxBounds([-15, -hw - t - 6, -9], [2, hw + t + 6, 1], fm),
  ];
  if (o.grille) {
    for (const y of [-hw * 0.5, 0, hw * 0.5]) out.push(boxBounds([-6, y - 1.5, 0], [-3, y + 1.5, spring + rise * 0.6], "IronDark"));
    for (const z of [spring * 0.3, spring * 0.7]) out.push(boxBounds([-6, -hw, z - 1.5], [-3, hw, z + 1.5], "IronDark"));
  } else out.push(boxBounds([-4, -2, 0], [-1.5, 2, spring + rise * 0.75], "WoodDark"), boxBounds([-4, -hw, spring * 0.6 - 2], [-1.5, hw, spring * 0.6 + 2], "WoodDark"));
  // the ogee's point carries a little stone finial
  if (head === "ogee") out.push(cylinderAt({ rBot: 6, rTop: 1, height: 18, segments: 4, bottom: [-4, 0, h + t * 1.1] }, fm));
  if (o.shutters)
    for (const s of [-1, 1]) {
      const a = s * (hw + t + 2), b = s * (hw + t + 2 + hw * 0.95), lo = Math.min(a, b), hi = Math.max(a, b);
      out.push(boxBounds([-6, lo, 0], [-1, hi, spring], "Venezia_Shutter"));
      for (const z of [spring * 0.3, spring * 0.7]) out.push(boxBounds([-8, lo + 3, z - 3], [-6, hi - 3, z + 3], "WoodDark"));
    }
  if (o.flowers !== undefined) out.push(flowerBox(w + 10, o.flowers));
  return merge(...out);
}
// A box of red geraniums on a sill (its back on x = 0, its foot at z = 0).
function flowerBox(w: number, seed: number): Geo {
  const out: Geo[] = [boxBounds([-34, -w / 2, 0], [-8, w / 2, 16], "Venezia_Clay", 1.5), translate(rock([22, w - 4, 20], 0.5, 3 + seed, "Venezia_Leaf", true, 0), [-21, 0, 13])];
  const n = Math.max(3, Math.round(w / 18));
  for (let i = 0; i < n; i++) out.push(sphereCenter(6, [-21 + ((i * 7) % 3 - 1) * 6, -w / 2 + 8 + ((w - 16) * i) / (n - 1), 27 + ((i * 5) % 3) * 3], "Venezia_Geranium", 4));
  return merge(...out);
}
// A door on a -X wall (back on x = 0, centred on y = 0, standing on z = 0): a deep Istrian surround,
// the leaf (or two) of planks set back with iron straps, bronze knobs, a stone step.
function door(w: number, h: number, o: { head?: Head; leaf?: string; double?: boolean; step?: boolean; t?: number; key?: boolean } = {}): Geo {
  const hw = w / 2, head = o.head ?? "round", t = o.t ?? 16, rise = riseOf(head, hw), spring = h - rise, leaf = o.leaf ?? "DoorWood";
  const out: Geo[] = [
    panel(frameShape(hw, spring, head, t), -10, 18, IST),
    panel(shapeOf(hw, spring, head), -3, 4, leaf, { vertical: true }),
  ];
  for (const z of [h * 0.2, spring * 0.72]) out.push(boxBounds([-5, -hw + 3, z], [-3, hw - 3, z + 6], "IronDark"));
  if (o.double) out.push(boxBounds([-5, -2, 0], [-3, 2, h - 3], "WoodDark"), sphereCenter(4, [-7, -9, h * 0.42], "Bronze", 6), sphereCenter(4, [-7, 9, h * 0.42], "Bronze", 6));
  else out.push(sphereCenter(4.5, [-7, hw * 0.6, h * 0.42], "Bronze", 6));
  if (head !== "flat" && o.key !== false) out.push(boxBounds([-14, -10, h + t - 4], [4, 10, h + t + 18], IST));
  if (head === "flat") out.push(boxBounds([-16, -hw - t - 14, h + t - 2], [6, hw + t + 14, h + t + 14], IST, 2));
  if (o.step !== false) out.push(boxBounds([-44, -hw - t - 8, 0], [4, hw + t + 8, 12], IST, 2));
  return merge(...out);
}
// A turned baluster `h` tall standing on z = 0.
function baluster(h: number, mat = IST): Geo {
  return rotateZ(cylinderAt({ rBot: 6, rTop: 4.2, height: h, segments: 4, bottom: [0, 0, 0] }, mat), 45);
}
// A balcony on a -X wall (back on x = 0, its floor at z = 0, centred on y = 0): an Istrian slab on
// corbels, turned balusters under a rail along the front and both ends.
function balcony(w: number, d = 60): Geo {
  const hw = w / 2, out: Geo[] = [
    boxBounds([-d, -hw, -12], [0, hw, 0], IST, 2),
    boxBounds([-d - 4, -hw - 4, -17], [2, hw + 4, -11], IST),
    boxBounds([-d, -hw, 0], [-d + 14, hw, 6], IST),
    boxBounds([-d - 2, -hw - 2, 58], [-d + 14, hw + 2, 68], IST),
  ];
  for (const y of w > 200 ? [-hw + 20, 0, hw - 20] : [-hw + 18, hw - 18]) out.push(hullGeo([[0, y - 9, -12], [0, y + 9, -12], [-d + 6, y - 9, -12], [-d + 6, y + 9, -12], [0, y - 8, -46], [0, y + 8, -46]], IST));
  const n = Math.max(2, Math.round((w - 16) / 19));
  for (let i = 0; i < n; i++) out.push(translate(baluster(52), [-d + 7, -hw + 8 + ((w - 16) * i) / (n - 1), 6]));
  for (const s of [-1, 1]) {
    out.push(boxBounds([-d, s * hw - 7, 0], [0, s * hw + 7, 6], IST), boxBounds([-d, s * hw - 8, 58], [0, s * hw + 8, 68], IST));
    for (let x = -d + 24; x < -6; x += 19) out.push(translate(baluster(52), [x, s * (hw - 1), 6]));
  }
  return merge(...out);
}
// The Gothic multi-light window of a piano nobile on a -X wall (back on x = 0, sill at z = 0):
// `n` ogee lights `w` wide on slender colonnettes, roundels between their points and a lintel
// over them, all in one Istrian frame.
function polifora(n: number, w: number, h: number): Geo {
  const gap = 18, W = n * w + (n - 1) * gap, hw = w / 2, rise = riseOf("ogee", hw), spring = h - rise, out: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const y = -W / 2 + hw + i * (w + gap);
    out.push(translate(merge(
      panel(frameShape(hw, spring, "ogee", 9), -8, 10, IST),
      panel(shapeOf(hw, spring, "ogee"), -1.5, 2, "GlassBlue"),
      boxBounds([-4, -2, 0], [-1.5, 2, spring + rise * 0.7], "WoodDark"),
      boxBounds([-4, -hw, spring * 0.6 - 2], [-1.5, hw, spring * 0.6 + 2], "WoodDark"),
      cylinderAt({ rBot: 5, rTop: 1, height: 14, segments: 4, bottom: [-4, 0, h + 9] }, IST),
    ), [0, y, 0]));
    if (i < n - 1) {
      const yc = y + hw + gap / 2;
      out.push(cylinderAt({ radius: 6, height: spring - 8, segments: 8, bottom: [-14, yc, 0] }, "Venezia_Marble"));
      out.push(boxBounds([-22, yc - 11, spring - 10], [-6, yc + 11, spring], IST));
      // a roundel in the spandrel between two points
      out.push(panel(ringShape(hw * 0.32, 5, yc, spring + rise * 0.82), -9, 10, IST), panel(circleShape(hw * 0.32, yc, spring + rise * 0.82), -2, 2, "Venezia_Dark"));
    }
  }
  const top = h + 30;
  out.push(
    boxBounds([-10, -W / 2 - 24, -4], [2, -W / 2 - 8, top], IST),
    boxBounds([-10, W / 2 + 8, -4], [2, W / 2 + 24, top], IST),
    boxBounds([-14, -W / 2 - 30, top], [2, W / 2 + 30, top + 14], IST, 2),
    boxBounds([-16, -W / 2 - 30, -10], [2, W / 2 + 30, 1], IST),
  );
  return merge(...out);
}
// A hexagonal lantern of glass in an iron cage standing on z = 0 (about 50 cm high).
function lantern(r = 12, h = 30): Geo {
  return merge(
    cylinderAt({ rBot: r * 0.55, rTop: r * 1.05, height: 6, segments: 6, bottom: [0, 0, 0] }, "IronDark"),
    cylinderAt({ radius: r * 0.86, height: h, segments: 6, bottom: [0, 0, 6] }, "LanternGlow"),
    ...[0, 1, 2, 3, 4, 5].map((i) => cylinderAt({ radius: 1.4, height: h, segments: 4, bottom: [Math.cos((i * 60 + 30) * D) * r * 0.92, Math.sin((i * 60 + 30) * D) * r * 0.92, 6] }, "IronDark")),
    cylinderAt({ rBot: r * 1.2, rTop: r * 0.3, height: r * 0.8, segments: 6, bottom: [0, 0, h + 6] }, "IronDark"),
    cylinderAt({ radius: r * 0.32, height: 5, segments: 6, bottom: [0, 0, h + 6 + r * 0.8] }, "IronDark"),
    sphereCenter(3, [0, 0, h + 14 + r * 0.8], "GoldTrim", 6),
  );
}
// A lantern on an iron bracket out from a -X wall (the bracket at z = 0).
function wallLantern(): Geo {
  return merge(
    beamBetween([2, 0, 0], [-44, 0, 0], 4, 5, "IronDark"),
    beamBetween([2, 0, -30], [-28, 0, -2], 3, 3, "IronDark"),
    translate(rotateX(torus(7, 1.3, 8, 3, "IronDark"), 90), [-20, 0, -10]),
    cylinderBetween([-40, 0, 0], [-40, 0, -8], 1.2, 4, "IronDark"),
    translate(lantern(10, 24), [-40, 0, -52]),
  );
}
// A Venetian funnel chimney (camino a imbuto) at (x, y): a plaster stack from z0 (inside the roof)
// up to `top`, a stone cap, a neck and the wide upturned cone of the pot, rimmed in stone.
function chimney(x: number, y: number, z0: number, top: number, mat = "Venezia_Rust"): Geo {
  return merge(
    wuv(boxBounds([x - 30, y - 30, z0], [x + 30, y + 30, top], mat)),
    boxBounds([x - 37, y - 37, top], [x + 37, y + 37, top + 10], IST, 1.5),
    cylinderAt({ radius: 14, height: 22, segments: 8, bottom: [x, y, top + 10] }, mat),
    cylinderAt({ rBot: 14, rTop: 44, height: 62, segments: 10, bottom: [x, y, top + 32] }, mat),
    cylinderAt({ radius: 47, height: 8, segments: 10, bottom: [x, y, top + 94] }, IST),
    cylinderAt({ radius: 39, height: 2, segments: 10, bottom: [x, y, top + 101] }, "Venezia_Dark"),
  );
}
// A tiled hipped roof over ±hx, ±hy from z (eaves ovx / ovy past the walls), rising h to a ridge
// along the longer side (to a point when square), with ridge and hip tiles.
function hipRoof(hx: number, hy: number, z: number, h: number, ovx: number, ovy: number, mat = "Venezia_Roof", th = 18): Geo {
  const ax = hx + ovx, ay = hy + ovy, zt = z + th, zr = zt + h;
  const ends: V3[] = ax - ay > 2 ? [[ay - ax, 0, zr], [ax - ay, 0, zr]] : ay - ax > 2 ? [[0, ax - ay, zr], [0, ay - ax, zr]] : [[0, 0, zr]];
  const pts = ends.map((e) => new THREE.Vector3(...e));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) pts.push(new THREE.Vector3(sx * ax, sy * ay, z), new THREE.Vector3(sx * ax, sy * ay, zt));
  const ridgeMat = mat === "Venezia_Roof" ? "Venezia_RoofRidge" : mat;
  const out: Geo[] = [roofUv([{ geo: new ConvexGeometry(pts), mat }])];
  if (ends.length === 2) out.push(cylinderBetween([ends[0][0], ends[0][1], zr + 3], [ends[1][0], ends[1][1], zr + 3], 9, 6, ridgeMat));
  const alongX = ends.length === 2 && ends[0][0] !== 0;
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      const e = ends.length === 1 ? ends[0] : ends[(alongX ? sx : sy) < 0 ? 0 : 1], c: V3 = [sx * ax, sy * ay, zt + 2];
      out.push(cylinderBetween([c[0] + (e[0] - c[0]) * 0.03, c[1] + (e[1] - c[1]) * 0.03, c[2] + (e[2] - c[2]) * 0.03], [e[0], e[1], zr + 3], 6, 6, ridgeMat));
    }
  return merge(...out);
}
// A tiled two-slope roof over ±hx, ±hy, its ridge along Y and the eaves `ov` past the front and
// back at z = E, flush at the ends (houses in a row join under one roof line); plaster gables.
function rowRoof(hx: number, hy: number, E: number, RH: number, ov: number, wall: string, mat = "Venezia_Roof"): Geo {
  const ang = Math.atan2(RH, hx), slope = (hx + ov) / Math.cos(ang), th = 16;
  const slab = (s: 1 | -1): Geo => rotateY(box([slope, 2 * hy + 4, th], [(s * slope) / 2, 0, th / 2], mat), (s * ang) / D);
  const rz = E + RH + th / Math.cos(ang) - 2;
  return merge(
    roofUv(translate(merge(slab(1), slab(-1)), [0, 0, E + RH])),
    cylinderBetween([0, -hy - 2, rz], [0, hy + 2, rz], 9, 6, mat === "Venezia_Roof" ? "Venezia_RoofRidge" : mat),
    wuv(merge(rotateZ(gableWall(hy - 1, hx, E, RH - 3, wall), 90), rotateZ(gableWall(-(hy - 1), hx, E, RH - 3, wall), 90))),
  );
}
// The eaves cornice round ±hx, ±hy with its top at z: a stone band over a row of dentils (on the
// faces listed; the band runs the full length where the house joins its neighbours).
function cornice(hx: number, hy: number, z: number, faces: Face[] = ["-x", "+x", "-y", "+y"], mat = IST): Geo {
  const ends = faces.includes("-y") || faces.includes("+y");
  const out: Geo[] = [boxBounds([-hx - 16, -hy - (ends ? 16 : 0), z - 14], [hx + 16, hy + (ends ? 16 : 0), z], mat, ends ? 2 : 0)];
  for (const f of faces) {
    const len = (f.endsWith("x") ? hy : hx) * 2 - 20, n = Math.floor(len / 30);
    out.push(onFace(array(boxAt([9, 10, 11], [-4.5, -len / 2 + 11, z - 26], mat), n, [0, len / n, 0]), f, f.endsWith("x") ? hx : hy, 0, 0));
  }
  return merge(...out);
}
// The body of a Venetian house over ±hx, ±hy: an Istrian plinth, plaster to the eaves at E, a
// white string course at each floor.
function body(hx: number, hy: number, floors: number[], E: number, wall: string): Geo {
  return merge(
    wuv(boxBounds([-hx - 6, -hy - 6, 0], [hx + 6, hy + 6, 46], IST)),
    wuv(boxBounds([-hx, -hy, 46], [hx, hy, E], wall)),
    ...floors.map((f) => boxBounds([-hx - 6, -hy - 6, f - 5], [hx + 6, hy + 6, f + 6], IST, 1)),
  );
}
// Istrian strips up the corners of the front (and back).
function cornerStrips(hx: number, hy: number, z0: number, z1: number, back = false): Geo {
  const out: Geo[] = [];
  for (const sx of back ? [-1, 1] : [-1])
    for (const sy of [-1, 1]) out.push(boxBounds([sx < 0 ? -hx - 4 : hx - 26, sy < 0 ? -hy - 4 : hy - 26, z0], [sx < 0 ? -hx + 26 : hx + 4, sy < 0 ? -hy + 26 : hy + 4, z1], IST));
  return merge(...out);
}
// A wooden altana: the roof terrace on posts above the tiles where washing dries, its floor at
// zf, w x d, centred at (x, y), its posts from z0 inside the roof.
function altana(x: number, y: number, z0: number, zf: number, w: number, d: number): Geo {
  const out: Geo[] = [boxBounds([x - d / 2, y - w / 2, zf], [x + d / 2, y + w / 2, zf + 8], "WoodGrey")];
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      out.push(boxBounds([x + sx * (d / 2 - 6) - 5, y + sy * (w / 2 - 6) - 5, z0], [x + sx * (d / 2 - 6) + 5, y + sy * (w / 2 - 6) + 5, zf + 96], "WoodDark"));
      out.push(beamBetween([x + sx * (d / 2 - 6), y + sy * (w / 2 - 6), zf - 4], [x + sx * (d / 2 - 6), y, z0 + (zf - z0) * 0.4], 5, 5, "WoodDark"));
    }
  for (const s of [-1, 1]) {
    out.push(boxBounds([x - d / 2, y + s * (w / 2) - 3, zf + 86], [x + d / 2, y + s * (w / 2) + 3, zf + 92], "WoodGrey"), boxBounds([x + s * (d / 2) - 3, y - w / 2, zf + 86], [x + s * (d / 2) + 3, y + w / 2, zf + 92], "WoodGrey"));
    out.push(array(boxAt([3, 3, 80], [x - d / 2 + 14, y + s * (w / 2 - 2), zf + 8], "WoodGrey"), Math.floor(d / 22), [22, 0, 0]));
  }
  // washing on a line
  out.push(cylinderBetween([x - d / 2 + 8, y - w / 2 + 6, zf + 82], [x + d / 2 - 8, y + w / 2 - 6, zf + 82], 0.8, 3, "RopeTan"));
  for (const [t, m] of [[0.25, "FabricWhite"], [0.45, "FabricBlue"], [0.65, "FabricWhite"], [0.82, "Venezia_PaintRed"]] as const) {
    const p = lerp3([x - d / 2 + 8, y - w / 2 + 6, zf + 82], [x + d / 2 - 8, y + w / 2 - 6, zf + 82], t);
    out.push(boxBounds([p[0] - 18, p[1] - 1, p[2] - 42], [p[0] + 18, p[1] + 1, p[2]], m));
  }
  return merge(...out);
}
// A striped awning on a -X wall (back on x = 0, top edge at z = 0) `w` wide, `d` out and `drop`
// down to its front, with a scalloped valance.
function awning(w: number, d: number, drop: number, a: string, b: string): Geo {
  const n = Math.max(4, Math.round(w / 34)), sw = w / n, ang = Math.atan2(drop, d), L = Math.hypot(d, drop), out: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const y = -w / 2 + sw * (i + 0.5);
    out.push(translate(rotateY(boxAt([L, sw + 0.5, 3], [-L / 2, 0, 0], i % 2 ? a : b), -ang / D), [0, y, 0]));
    out.push(boxBounds([-d - 2, y - sw / 2, -drop - 22], [-d + 1, y + sw / 2, -drop + 1], i % 2 ? a : b));
    out.push(sphereCenter(sw * 0.36, [-d - 0.5, y, -drop - 22], i % 2 ? a : b, 4));
  }
  for (const s of [-1, 1]) out.push(beamBetween([0, s * (w / 2 - 4), -drop - 30], [-d, s * (w / 2 - 4), -drop - 2], 3, 3, "IronDark"));
  out.push(boxBounds([-4, -w / 2 - 4, -4], [2, w / 2 + 4, 6], "WoodDark"));
  return merge(...out);
}
// A hanging sign on an iron bracket out from a -X wall (bracket at z = 0), a painted board.
function hangingSign(board: string, emblem: Geo): Geo {
  return merge(
    beamBetween([2, 0, 0], [-110, 0, 0], 5, 5, "IronDark"),
    beamBetween([2, 0, -40], [-62, 0, -2], 3, 3, "IronDark"),
    cylinderBetween([-34, 0, 0], [-34, 0, -14], 1, 4, "IronDark"),
    cylinderBetween([-96, 0, 0], [-96, 0, -14], 1, 4, "IronDark"),
    boxBounds([-110, -3.5, -84], [-20, 3.5, -14], "WoodDark", 1.5),
    boxBounds([-106, -4.5, -80], [-24, 4.5, -18], board),
    translate(emblem, [-65, -6, -49]),
    translate(emblem, [-65, 6, -49]),
  );
}

// ---------- small figures in bronze and stone ----------
// The winged lion of St Mark built facing -X, standing on z = 0 (about 1.9 m long, 1.8 m high to
// its wing tips): a maned head with a halo, a forepaw on the open book, wings raised behind.
function lion(mat = "Venezia_Patina", gilt = "GoldTrim"): Geo {
  const out: Geo[] = [
    translate(scale(sphereCenter(1, [0, 0, 0], mat, 10), [64, 30, 30]), [12, 0, 70]),
    translate(scale(sphereCenter(1, [0, 0, 0], mat, 8), [34, 32, 34]), [52, 0, 64]),
    translate(rock([86, 78, 84], 0.35, 7, mat), [-46, 0, 52]),
    sphereCenter(22, [-74, 0, 112], mat, 10),
    boxAt([26, 24, 20], [-94, 0, 96], mat, 6),
    sphereCenter(6, [-108, 0, 108], "Venezia_Dark", 6),
    translate(rotateY(torus(30, 3, 18, 4, gilt), 90), [-66, 0, 122]),
  ];
  for (const s of [-1, 1]) out.push(cylinderAt({ rBot: 6, rTop: 2, height: 12, segments: 5, bottom: [-70, s * 14, 130] }, mat));
  // legs: the left forepaw on the book, the rest standing
  out.push(
    cylinderBetween([-50, -16, 64], [-88, -18, 26], 8.5, 6, mat, 7), sphereCenter(9, [-92, -18, 24], mat, 6),
    cylinderBetween([-44, 16, 60], [-52, 16, 6], 9, 6, mat, 7.5), sphereCenter(9.5, [-54, 16, 6], mat, 6),
  );
  for (const s of [-1, 1]) out.push(cylinderBetween([58, s * 18, 54], [68, s * 18, 6], 10, 6, mat, 7.5), sphereCenter(9.5, [70, s * 18, 6], mat, 6));
  // the open book under the paw
  out.push(translate(merge(rotateX(boxAt([36, 26, 4], [0, 13, 0], "Venezia_PaintWhite"), -8), rotateX(boxAt([36, 26, 4], [0, -13, 0], "Venezia_PaintWhite"), 8), boxBounds([-19, -27, -4], [19, 27, 1], gilt)), [-94, -18, 8]));
  // wings: a feathered blade raised from each shoulder
  const wing = new THREE.Shape();
  const wp: [number, number][] = [[0, 0], [14, 40], [36, 84], [70, 122], [100, 146], [96, 126], [104, 110], [86, 100], [92, 82], [72, 72], [78, 54], [56, 46], [58, 28], [36, 20], [30, 6]];
  wing.moveTo(...wp[0]);
  for (const p of wp.slice(1)) wing.lineTo(...p);
  wing.lineTo(...wp[0]);
  for (const s of [-1, 1]) out.push(translate(rotateX(sidePanel(wing, 3, 6, mat), -s * 16), [-24, s * 24, 92]));
  // the tail
  out.push(tube([[80, 0, 70], [118, 8, 50], [140, 16, 70], [132, 22, 100]], 4, mat, 10, 5), sphereCenter(8, [132, 22, 104], mat, 6));
  return merge(...out);
}
// A gilded bronze horse of the basilica's loggia, built facing -X on z = 0 (about 1 m long),
// one forehoof raised.
function horse(mat = "Bronze"): Geo {
  return merge(
    translate(scale(sphereCenter(1, [0, 0, 0], mat, 8), [40, 15, 19]), [0, 0, 62]),
    cylinderBetween([-30, 0, 70], [-50, 0, 102], 11, 6, mat, 7),
    translate(rotateY(scale(sphereCenter(1, [0, 0, 0], mat, 6), [16, 7, 8]), 30), [-58, 0, 98]),
    ...[-1, 1].map((s) => cylinderAt({ rBot: 2, rTop: 1, height: 9, segments: 4, bottom: [-50, s * 4, 106] }, mat)),
    cylinderBetween([-26, -9, 52], [-28, -9, 0], 4.5, 5, mat),
    cylinderBetween([-26, 9, 52], [-44, 9, 30], 4.5, 5, mat), cylinderBetween([-44, 9, 30], [-38, 9, 16], 4, 5, mat),
    cylinderBetween([28, -9, 52], [32, -9, 0], 4.5, 5, mat),
    cylinderBetween([28, 9, 52], [26, 9, 0], 4.5, 5, mat),
    tube([[38, 0, 70], [52, 0, 56], [56, 0, 30]], 3, mat, 6, 4),
  );
}
// A standing saint in a robe (`h` tall, built facing -X on z = 0), one arm raised.
function figure(h: number, mat = IST): Geo {
  return merge(
    cylinderAt({ rBot: h * 0.17, rTop: h * 0.1, height: h * 0.62, segments: 7, bottom: [0, 0, 0] }, mat),
    cylinderAt({ rBot: h * 0.1, rTop: h * 0.08, height: h * 0.2, segments: 7, bottom: [0, 0, h * 0.62] }, mat),
    sphereCenter(h * 0.075, [0, 0, h * 0.89], mat, 7),
    cylinderBetween([0, h * 0.08, h * 0.76], [-h * 0.06, h * 0.16, h * 1.02], h * 0.03, 5, mat),
  );
}
// The gilded angel on the campanile's spire, built facing -X on z = 0 (about 1.4 m).
function angel(mat = "GoldTrim"): Geo {
  const wing = new THREE.Shape();
  const wp: [number, number][] = [[0, 0], [30, 30], [60, 70], [52, 40], [62, 30], [40, 18], [36, 4]];
  wing.moveTo(...wp[0]);
  for (const p of wp.slice(1)) wing.lineTo(...p);
  wing.lineTo(...wp[0]);
  return merge(
    sphereCenter(12, [0, 0, 6], mat, 8),
    cylinderAt({ rBot: 18, rTop: 8, height: 70, segments: 8, bottom: [0, 0, 14] }, mat),
    cylinderAt({ rBot: 8, rTop: 6, height: 20, segments: 8, bottom: [0, 0, 84] }, mat),
    sphereCenter(9, [0, 0, 112], mat, 8),
    cylinderBetween([0, 8, 98], [-10, 20, 140], 3, 5, mat),
    cylinderBetween([0, -8, 98], [-16, -10, 76], 3, 5, mat),
    ...[-1, 1].map((s) => translate(rotateZ(sidePanel(wing, 2, 4, mat), s * 25), [8, s * 6, 80])),
  );
}

// ---------- hulls: sections lofted bow to stern ----------
// One cross-section: (y, z, material of the edge to the next point), clockwise seen from +X (down
// the starboard side, across the keel, up to port, then in over the rail and across the deck).
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
  stern: number; th: number; n: number; wl: number; band: number;
  rise?: number; bowRise?: number; sternSweep?: number;
  mats: [string, string, string, string, string, string]; // band, topsides, bottom, rail, inside, deck
}
const smooth = (u: number): number => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
function widthAt(t: number, stern: number): number {
  if (t < 0.45) return Math.sin((t / 0.45) * (Math.PI / 2)) ** 0.75;
  if (t < 0.7) return 1;
  return 1 - (1 - stern) * ((t - 0.7) / 0.3) ** 1.8;
}
function hullAt(o: HullOpt, x: number) {
  const t = Math.min(1, Math.max(0, (x + o.len / 2) / o.len)), e = (2 * t - 1) ** 2;
  const w = Math.max(3, (o.beam / 2) * widthAt(t, o.stern));
  const top = o.deck + o.bulwark + o.sheer * e + (o.rise ?? 0) * smooth((t - 0.7) / 0.1)
    + (o.bowRise ?? 0) * Math.max(0, (0.22 - t) / 0.22) ** 2 + (o.sternSweep ?? 0) * Math.max(0, (t - 0.78) / 0.22) ** 2;
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
// a strip along both sides of the hull at height z (a wale)
function wale(o: HullOpt, z: number, x0: number, x1: number, mat: string, steps = 16, h = 13): Geo {
  const g: Geo[] = [];
  for (const s of [-1, 1])
    for (let i = 0; i < steps; i++) {
      const xa = x0 + ((x1 - x0) * i) / steps, xb = x0 + ((x1 - x0) * (i + 1)) / steps;
      g.push(beamBetween([xa, s * (hullAt(o, xa).w * 0.99 + 2), z], [xb, s * (hullAt(o, xb).w * 0.99 + 2), z], 8, h, mat));
    }
  return merge(...g);
}
const rope = (a: V3, b: V3, r = 1.6, mat = "RopeTan"): Geo => cylinderBetween(a, b, r, 4, mat);

// =====================================================================================
// buildings
// =====================================================================================

// A palazzo, three storeys and 10 m wide: the water portal under a round arch between barred
// windows, the piano nobile's four-light Gothic window over a balcony, a three-light window above,
// single ogee windows with balconies and shutters at the sides, Istrian string courses and corner
// strips, a dentil cornice, a hipped roof of coppi and three funnel chimneys.
function palazzo(wall = "Venezia_Pink"): Geo {
  const HX = 450, HY = 500, F1 = 400, F2 = 760, E = 1080, out: Geo[] = [];
  const on = (g: Geo, face: Face, u: number, z: number) => out.push(onFace(g, face, (face.endsWith("x") ? HX : HY) + (z < 46 ? 6 : 0), u, z));
  out.push(body(HX, HY, [F1, F2], E, wall), cornerStrips(HX, HY, 46, E - 14, true), cornice(HX, HY, E, ["-x", "-y", "+y"]));
  // front: the portal, barred windows, lanterns
  on(door(210, 340, { double: true, t: 22 }), "-x", 0, 0);
  for (const s of [-1, 1]) {
    on(win(80, 130, { head: "flat", grille: true }), "-x", s * 300, 130);
    on(wallLantern(), "-x", s * 170, 300);
  }
  // the piano nobile and the floor above
  on(balcony(400, 66), "-x", 0, F1 + 40);
  on(polifora(4, 68, 240), "-x", 0, F1 + 54);
  on(balcony(320, 56), "-x", 0, F2 + 40);
  on(polifora(3, 62, 210), "-x", 0, F2 + 54);
  for (const s of [-1, 1]) {
    on(balcony(150, 48), "-x", s * 330, F1 + 40);
    on(win(82, 230, { shutters: true }), "-x", s * 330, F1 + 54);
    on(win(74, 200, { shutters: true, flowers: s + 2 }), "-x", s * 330, F2 + 54);
  }
  // back: a door to the calle, plain windows with shutters
  on(door(120, 250, { head: "flat" }), "+x", 200, 0);
  on(win(80, 130, { head: "flat", grille: true }), "+x", -200, 120);
  for (const z of [F1 + 60, F2 + 60]) for (const u of [-300, 0, 300]) on(win(76, 200, { shutters: true, head: u ? "ogee" : "round" }), "+x", u, z);
  // ends
  for (const f of ["-y", "+y"] as const) {
    on(win(70, 120, { head: "flat", grille: true }), f, 0, 140);
    for (const z of [F1 + 60, F2 + 60]) for (const u of [-220, 220]) on(win(72, 190, { shutters: true }), f, u, z);
  }
  out.push(hipRoof(HX, HY, E, 220, 44, 44));
  out.push(chimney(-250, -HY + 70, E, E + 300), chimney(250, HY - 70, E, E + 280), chimney(240, -HY + 90, E, E + 250));
  return merge(...out);
}

// A grand palazzo on the grand canal, four storeys and 14 m wide: a water portal flanked by two
// doors on the ground floor, a six-light window with roundels and a long balcony on the piano
// nobile, a four-light one above, a row of square attic windows under the cornice, white Gothic
// merlons along the roof line, funnel chimneys.
function palazzoGrand(wall = "Venezia_Ochre"): Geo {
  const HX = 550, HY = 700, F1 = 420, F2 = 800, F3 = 1160, E = 1420, out: Geo[] = [];
  const on = (g: Geo, face: Face, u: number, z: number) => out.push(onFace(g, face, (face.endsWith("x") ? HX : HY) + (z < 46 ? 6 : 0), u, z));
  out.push(body(HX, HY, [F1, F2, F3], E, wall), cornerStrips(HX, HY, 46, E - 14, true), cornice(HX, HY, E, ["-x", "-y", "+y"]));
  // the ground floor: the water portal, doors, barred windows, lanterns
  on(door(280, 380, { double: true, t: 26 }), "-x", 0, 0);
  for (const s of [-1, 1]) {
    on(door(120, 270, { head: "ogee" }), "-x", s * 330, 0);
    on(win(80, 130, { head: "flat", grille: true }), "-x", s * 560, 140);
    on(wallLantern(), "-x", s * 205, 320);
  }
  // the piano nobile
  on(balcony(640, 70), "-x", 0, F1 + 44);
  on(polifora(6, 70, 250), "-x", 0, F1 + 58);
  // the second floor
  on(balcony(420, 60), "-x", 0, F2 + 44);
  on(polifora(4, 66, 230), "-x", 0, F2 + 58);
  for (const s of [-1, 1]) {
    for (const [z, h] of [[F1 + 58, 240], [F2 + 58, 220]] as const) {
      on(balcony(140, 46), "-x", s * 560, z - 14);
      on(win(80, h, { shutters: true }), "-x", s * 560, z);
    }
  }
  // the attic
  for (let i = 0; i < 7; i++) on(win(62, 76, { head: "flat", t: 9 }), "-x", -540 + i * 180, F3 + 90);
  // merlons along the front's cornice
  const merlon = new THREE.Shape();
  merlon.moveTo(-22, 0);
  merlon.lineTo(22, 0);
  merlon.lineTo(22, 26);
  merlon.bezierCurveTo(22, 46, 4, 46, 0, 70);
  merlon.bezierCurveTo(-4, 46, -22, 46, -22, 26);
  merlon.lineTo(-22, 0);
  for (let y = -HY + 30; y <= HY - 30; y += 70) out.push(translate(panel(merlon, -HX - 14, 14, IST), [0, y, E]));
  // back and ends
  on(door(130, 260, { head: "flat" }), "+x", 300, 0);
  for (const z of [F1 + 60, F2 + 60]) for (const u of [-440, -150, 150, 440]) on(win(78, 210, { shutters: true, head: "round" }), "+x", u, z);
  for (const u of [-440, -150, 150, 440]) on(win(62, 80, { head: "flat", t: 9 }), "+x", u, F3 + 90);
  for (const f of ["-y", "+y"] as const) {
    for (const z of [F1 + 60, F2 + 60]) for (const u of [-300, 0, 300]) on(win(74, 200, { shutters: true }), f, u, z);
    for (const u of [-300, 0, 300]) on(win(62, 80, { head: "flat", t: 9 }), f, u, F3 + 90);
  }
  out.push(hipRoof(HX, HY, E, 240, 46, 46));
  out.push(chimney(-330, -HY + 80, E, E + 300), chimney(-330, HY - 80, E, E + 300), chimney(300, 0, E, E + 320));
  return merge(...out);
}

// A canal house, 5.6 m wide and three storeys, for the rows along the rii: a round-headed door
// and a barred window, a two-light window over a little balcony, shuttered windows with
// geraniums, the roof's ridge along the row (flush ends), a funnel chimney up the side.
function canalHouse(wall = "Venezia_Salmon"): Geo {
  const HX = 400, HY = 280, F1 = 340, F2 = 660, E = 960, out: Geo[] = [];
  const on = (g: Geo, face: Face, u: number, z: number) => out.push(onFace(g, face, (face.endsWith("x") ? HX : HY) + (z < 46 ? 6 : 0), u, z));
  out.push(body(HX, HY, [F1, F2], E, wall), cornice(HX, HY, E, ["-x", "+x"]));
  on(door(110, 240), "-x", -120, 0);
  on(win(80, 120, { head: "flat", grille: true }), "-x", 120, 110);
  on(wallLantern(), "-x", 10, 290);
  on(balcony(200, 50), "-x", 0, F1 + 40);
  on(polifora(2, 62, 200), "-x", 0, F1 + 52);
  for (const s of [-1, 1]) on(win(64, 170, { shutters: true, flowers: s + 4 }), "-x", s * 120, F2 + 54);
  on(door(100, 230, { head: "flat" }), "+x", 120, 0);
  for (const z of [F1 + 56, F2 + 56]) for (const u of [-120, 120]) on(win(64, 170, { shutters: true, head: "round" }), "+x", u, z);
  for (const f of ["-y", "+y"] as const) on(win(60, 150, { shutters: true }), f, 150, F1 + 70);
  out.push(rowRoof(HX, HY, E, 170, 40, wall));
  out.push(chimney(150, HY - 40, E - 40, E + 260));
  return merge(...out);
}

// A narrow canal house, 4.4 m wide and four storeys, cream with green shutters, an altana (the
// wooden roof terrace) on its ridge and washing on the line.
function canalHouseNarrow(wall = "Venezia_Cream"): Geo {
  const HX = 380, HY = 220, F1 = 320, F2 = 620, F3 = 920, E = 1200, out: Geo[] = [];
  const on = (g: Geo, face: Face, u: number, z: number) => out.push(onFace(g, face, (face.endsWith("x") ? HX : HY) + (z < 46 ? 6 : 0), u, z));
  out.push(body(HX, HY, [F1, F2, F3], E, wall), cornice(HX, HY, E, ["-x", "+x"]));
  on(door(100, 230, { head: "flat" }), "-x", -80, 0);
  on(win(64, 110, { head: "flat", grille: true }), "-x", 100, 120);
  on(balcony(170, 46), "-x", 0, F1 + 40);
  on(win(70, 200, { shutters: true }), "-x", 0, F1 + 52);
  for (const [z, h] of [[F2 + 54, 180], [F3 + 54, 160]] as const) for (const s of [-1, 1]) on(win(56, h, { shutters: true, head: "round", flowers: z > F3 ? undefined : s + 6 }), "-x", s * 92, z);
  on(door(96, 220, { head: "flat" }), "+x", 80, 0);
  for (const z of [F1 + 56, F2 + 56, F3 + 56]) on(win(60, 160, { shutters: true }), "+x", -60, z);
  out.push(rowRoof(HX, HY, E, 150, 36, wall));
  out.push(altana(60, 0, E + 60, E + 190, 300, 240));
  out.push(chimney(-200, HY - 40, E - 30, E + 230, "Venezia_Salmon"));
  return merge(...out);
}

// A shop house, 7.2 m wide: two round-arched shop fronts on the ground floor (a window of small
// panes and the door) under a striped awning and a hanging sign, a long balcony with three ogee
// windows over it, shuttered windows above, the ridge along the row.
function shopHouse(wall = "Venezia_Rust"): Geo {
  const HX = 420, HY = 360, F1 = 360, F2 = 680, E = 980, out: Geo[] = [];
  const on = (g: Geo, face: Face, u: number, z: number) => out.push(onFace(g, face, (face.endsWith("x") ? HX : HY) + (z < 46 ? 6 : 0), u, z));
  out.push(body(HX, HY, [F1, F2], E, wall), cornice(HX, HY, E, ["-x", "+x"]));
  // the shop fronts: an Istrian arch round each, glazing on a timber stall-board, a door
  for (const s of [-1, 1]) {
    const hw = 110, spring = 200;
    on(merge(
      panel(frameShape(hw, spring, "round", 18), -10, 18, IST),
      panel(shapeOf(hw, spring, "round"), -2, 3, "GlassBlue"),
      boxBounds([-8, -hw, 0], [-1, hw, 70], "WoodDark", 1),
      ...[-hw / 2, 0, hw / 2].map((y) => boxBounds([-6, y - 2, 70], [-2, y + 2, spring + hw * 0.9], "WoodDark")),
      boxBounds([-6, -hw, 150], [-2, hw, 154], "WoodDark"),
      s < 0 ? boxBounds([-5, -hw + 30, 0], [-1, hw - 30, 240], "DoorWood") : [],
    ), "-x", s * 175, 0);
  }
  out.push(translate(awning(640, 120, 60, "Venezia_PaintRed", "Venezia_Canvas"), [-HX, 0, 340]));
  const emblem = merge(cylinderAt({ radius: 14, height: 4, segments: 10, bottom: [0, 0, 0] }, "GoldTrim"));
  on(hangingSign("Venezia_PaintBlue", rotateX(emblem, 90)), "-x", -HY + 40, 300);
  on(balcony(560, 56), "-x", 0, F1 + 40);
  for (const u of [-200, 0, 200]) on(win(70, 210, { shutters: u !== 0 }), "-x", u, F1 + 52);
  for (const u of [-200, 0, 200]) on(win(64, 170, { shutters: true, head: "round", flowers: u / 100 + 9 }), "-x", u, F2 + 54);
  on(door(110, 240, { head: "flat" }), "+x", -150, 0);
  for (const z of [F1 + 56, F2 + 56]) for (const u of [-180, 180]) on(win(64, 170, { shutters: true }), "+x", u, z);
  out.push(rowRoof(HX, HY, E, 180, 40, wall));
  out.push(chimney(160, -HY + 40, E - 40, E + 250), chimney(-180, HY - 40, E - 40, E + 220));
  return merge(...out);
}

// A length of the arcaded buildings round the great piazza, 8 m along Y (lengths join end to end):
// a ground-floor arcade of two round arches in Istrian stone with shop fronts back in its shade,
// two storeys of round-arched windows between half-columns, a cornice, white ornamental merlons and
// the ridge along the row.
function procuratie(): Geo {
  const HX = 500, HY = 400, G = 470, F2 = 800, E = 1120, AD = 300, out: Geo[] = [];
  // the arcade's front: half piers at the ends, a pier in the middle, two arches
  out.push(panel(arcadeShape(-HY, HY, 0, G, [[-200, 140, 290, "round"], [200, 140, 290, "round"]]), -HX, 40, IST));
  for (const yc of [-200, 200]) out.push(translate(arcStones([-HX - 4, 0, 290], 140, 0, 180, 9, 34, 10, IST), [0, yc, 0]));
  // the arcade inside: floor, ceiling, back wall with shop fronts, lanterns
  out.push(boxBounds([-HX + 40, -HY, 0], [-HX + AD, HY, 4], "Venezia_Trachyte"), boxBounds([-HX + 40, -HY, G - 30], [-HX + AD, HY, G], "Venezia_Cream"));
  out.push(wuv(boxBounds([-HX + AD, -HY, 0], [HX, HY, G], "Venezia_Cream")));
  for (const yc of [-200, 200]) {
    out.push(onFace(door(96, 240, { head: "round", step: false }), "-x", HX - AD, yc - 66, 0));
    out.push(onFace(win(90, 160, { head: "flat" }), "-x", HX - AD, yc + 70, 60));
    out.push(translate(cylinderBetween([0, 0, 0], [0, 0, -34], 1, 4, "IronDark"), [-HX + 150, yc, G - 30]), translate(lantern(11, 26), [-HX + 150, yc, G - 112]));
  }
  // upper storeys: plaster with arched windows between Istrian half-columns
  out.push(wuv(boxBounds([-HX, -HY, G], [HX, HY, E], "Venezia_Cream")));
  out.push(boxBounds([-HX - 10, -HY, G - 8], [HX + 10, HY, G + 10], IST, 1), boxBounds([-HX - 6, -HY, F2 - 6], [HX + 6, HY, F2 + 6], IST));
  for (const [z, h, w] of [[G + 60, 220, 110], [F2 + 50, 190, 100]] as const)
    for (const y of [-300, -100, 100, 300]) {
      out.push(onFace(win(w, h, { head: "round", t: 10 }), "-x", HX, y, z));
      out.push(onFace(win(w - 20, h - 30, { head: "round", shutters: true }), "+x", HX, y, z + 10));
    }
  for (const [z0, z1] of [[G + 10, F2 - 6], [F2 + 6, E - 14]] as const)
    for (const y of [-400, -200, 0, 200, 400]) {
      const hw = y === -400 || y === 400 ? 8 : 16, y0 = Math.max(-HY, y - hw), y1 = Math.min(HY, y + hw);
      out.push(boxBounds([-HX - 10, y0, z0], [-HX, y1, z1], IST), boxBounds([-HX - 16, y0 - 4, z1 - 16], [-HX, y1 + 4, z1], IST));
    }
  out.push(boxBounds([-HX - 18, -HY, E - 18], [HX + 18, HY, E + 4], IST, 2));
  out.push(onFace(array(boxAt([9, 10, 11], [-4.5, -HY + 11, E - 30], IST), 36, [0, 22, 0]), "-x", HX, 0, 0));
  // ornamental merlons over the front
  const merlon = new THREE.Shape();
  merlon.moveTo(-18, 0);
  merlon.lineTo(18, 0);
  merlon.lineTo(18, 30);
  merlon.lineTo(6, 42);
  merlon.lineTo(0, 64);
  merlon.lineTo(-6, 42);
  merlon.lineTo(-18, 30);
  merlon.lineTo(-18, 0);
  for (let y = -HY + 50; y < HY; y += 100) out.push(translate(panel(merlon, -HX - 12, 12, IST), [0, y, E + 4]));
  out.push(rowRoof(HX, HY, E + 4, 160, 10, "Venezia_Cream"));
  return merge(...out);
}

// The Doge's palace (a fondaco by the water in its other colours), 24 x 12 m: a ground-floor
// arcade of pointed arches on stout columns, the loggia above with twice as many ogee arches and a
// row of quatrefoil roundels, the great upper wall in pink with a lattice of white stones and tall
// Gothic windows, white merlons along the top, a lead roof.
function fondaco(wall = "Venezia_Pink"): Geo {
  const HX = 600, HY = 1200, G = 480, L1 = 860, E = 1460, out: Geo[] = [];
  const faces: [Face, number, number][] = [["-x", HX, HY], ["-y", HY, HX], ["+y", HY, HX]];
  // the core behind the arcades
  out.push(wuv(boxBounds([-HX + 300, -HY + 300, 0], [HX - 40, HY - 300, L1], "Venezia_Cream")));
  out.push(boxBounds([-HX, -HY, 0], [HX, HY, 6], "Venezia_Trachyte"));
  for (const [f, d, half] of faces) {
    const n = Math.round((2 * half) / 300), bay = (2 * half) / n;
    const arcade: Geo[] = [];
    // ground: pointed arches on columns
    const ground = Array.from({ length: n }, (_, i): [number, number, number, Head] => [-half + bay * (i + 0.5), bay / 2 - 34, 250, "pointed"]);
    arcade.push(panel(arcadeShape(-half, half, 70, G, ground), 0, 40, IST));
    for (let i = 0; i <= n; i++) {
      const yc = -half + bay * i;
      arcade.push(cylinderAt({ radius: 34, height: 180, segments: 10, bottom: [10, yc, 70] }, IST), cylinderAt({ radius: 44, height: 70, segments: 10, bottom: [10, yc, 0] }, IST));
      arcade.push(boxBounds([-34, yc - 44, 236], [54, yc + 44, 262], IST, 2));
    }
    // the loggia: two ogee arches for every one below, slender columns, roundels, a balustrade
    const m = n * 2, lb = (2 * half) / m;
    const loggia = arcadeShape(-half, half, G, L1, Array.from({ length: m }, (_, i): [number, number, number, Head] => [-half + lb * (i + 0.5), lb / 2 - 14, G + 190, "ogee"]));
    for (let i = 0; i < m - 1; i++) {
      const rc = new THREE.Path();
      rc.absarc(-half + lb * (i + 1), G + 300, 30, 0, Math.PI * 2, true);
      loggia.holes.push(rc);
    }
    arcade.push(panel(loggia, 20, 26, IST));
    for (let i = 0; i < m - 1; i++) {
      const yc = -half + lb * (i + 1);
      arcade.push(cylinderAt({ radius: 9, height: 180, segments: 8, bottom: [34, yc, G + 10] }, "Venezia_Marble"), panel(circleShape(30, yc, G + 300), 40, 4, "Venezia_Dark"));
      arcade.push(panel(ringShape(30, 6, yc, G + 300), 16, 6, IST));
    }
    arcade.push(boxBounds([-10, -half, G - 12], [60, half, G + 6], IST, 2), boxBounds([-12, -half, G + 70], [10, half, G + 80], IST, 1.5));
    for (let y = -half + 16; y < half - 8; y += 26) arcade.push(translate(baluster(62), [0, y, G + 6]));
    // the dark galleries behind
    arcade.push(boxBounds([60, -half + 40, 0], [300, half - 40, L1], "Venezia_Dark"));
    // the upper wall: pink with a lattice of white stones, tall windows, roundels
    arcade.push(wuv(boxBounds([0, -half, L1], [300, half, E], wall)));
    arcade.push(boxBounds([-12, -half, L1 - 4], [10, half, L1 + 16], IST, 2));
    for (let z = L1 + 56, r = 0; z < E - 40; z += 60, r++)
      for (let y = -half + 30 + (r % 2) * 50; y < half - 20; y += 100) arcade.push(translate(rotateX(boxAt([3, 24, 24], [0, 0, -12], IST), 45), [-1, y, z]));
    const k = Math.max(2, Math.round(half / 450));
    for (let i = 0; i < k; i++) {
      const y = -half + ((2 * half) / k) * (i + 0.5);
      arcade.push(translate(merge(balcony(200, 44), translate(win(130, 300, { head: "pointed", t: 16 }), [0, 0, 14])), [0, y, L1 + 60]));
    }
    arcade.push(boxBounds([-16, -half, E - 18], [10, half, E + 4], IST, 2));
    // white merlons
    const merlon = new THREE.Shape();
    merlon.moveTo(-20, 0);
    merlon.lineTo(20, 0);
    merlon.lineTo(20, 28);
    merlon.lineTo(8, 36);
    merlon.lineTo(0, 66);
    merlon.lineTo(-8, 36);
    merlon.lineTo(-20, 28);
    merlon.lineTo(-20, 0);
    for (let y = -half + 40; y < half - 20; y += 80) arcade.push(translate(panel(merlon, -8, 12, IST), [0, y, E + 4]));
    out.push(onFace(merge(...arcade), f, d, 0, 0));
  }
  // the back: plain pink upper wall over a wall with windows
  out.push(wuv(boxBounds([HX - 40, -HY, 0], [HX, HY, E], wall)));
  for (let y = -HY + 200; y < HY; y += 400) {
    out.push(onFace(win(110, 260, { head: "pointed", t: 14 }), "+x", HX, y, L1 + 80));
    out.push(onFace(win(80, 160, { head: "round" }), "+x", HX, y, 220));
  }
  out.push(boxBounds([HX - 50, -HY, E - 18], [HX + 16, HY, E + 4], IST, 2));
  out.push(hipRoof(HX - 20, HY - 20, E + 4, 260, 20, 20, "Venezia_Lead"));
  return merge(...out);
}

// =====================================================================================
// landmarks
// =====================================================================================

// A lead dome on its drum at (x, y), the drum's foot at z: a ring of arched windows, the tall
// outer shell of lead, the lantern, a gilded ball and cross.
function dome(x: number, y: number, z: number, r: number): Geo {
  const out: Geo[] = [
    cylinderAt({ radius: r + 24, height: 26, segments: 16, bottom: [x, y, z] }, IST),
    cylinderAt({ radius: r + 10, height: 150, segments: 16, bottom: [x, y, z + 26] }, "Venezia_Brick"),
    cylinderAt({ radius: r + 22, height: 14, segments: 16, bottom: [x, y, z + 176] }, IST),
  ];
  for (let i = 0; i < 8; i++) out.push(onRound(merge(panel(frameShape(19, 60, "round", 7), -6, 8, IST, { seg: 4 }), panel(shapeOf(19, 60, "round"), -1, 2, "Venezia_Dark", { seg: 4 })), r + 10, i * 45 + 22.5, z + 52, [x, y, 0]));
  const h = r * 1.12, zd = z + 190;
  const prof: [number, number][] = [[r + 16, 0], [r + 20, h * 0.08], [r + 22, h * 0.24], [r + 14, h * 0.42], [r * 0.95, h * 0.6], [r * 0.8, h * 0.76], [r * 0.56, h * 0.89], [r * 0.3, h * 0.97], [r * 0.12, h]];
  out.push(lathe(prof, 16, "Venezia_Lead", [x, y, zd]));
  const lz = zd + h - 6, lr = r * 0.16;
  out.push(cylinderAt({ radius: lr, height: lr * 1.4, segments: 8, bottom: [x, y, lz] }, "Venezia_Lead"));
  for (let i = 0; i < 4; i++) out.push(onRound(panel(shapeOf(lr * 0.3, lr * 0.6, "round"), -1, 2, "Venezia_Dark"), lr, i * 90 + 45, lz + lr * 0.25, [x, y, 0]));
  out.push(lathe([[lr * 1.15, 0], [lr * 1.25, lr * 0.3], [lr * 1.05, lr * 0.8], [lr * 0.5, lr * 1.3], [lr * 0.12, lr * 1.65]], 8, "Venezia_Lead", [x, y, lz + lr * 1.4]));
  const tz = lz + lr * 3.05;
  out.push(sphereCenter(lr * 0.28, [x, y, tz + lr * 0.25], "GoldTrim", 8), boxBounds([x - 2, y - 2, tz + lr * 0.5], [x + 2, y + 2, tz + lr * 1.6], "GoldTrim"), boxBounds([x - 2, y - lr * 0.4, tz + lr * 1.15], [x + 2, y + lr * 0.4, tz + lr * 1.27], "GoldTrim"));
  return merge(...out);
}
// An onion-tipped crest of gilded leaves over an arch of the basilica's front (built facing -X):
// the ogee outline round the round arch of half-width hw springing at `spring`, a saint on top.
function crest(hw: number, spring: number): Geo {
  const W = hw + 46, r = riseOf("ogee", W), out: Geo[] = [panel(frameShape(W - 16, spring, "ogee", 16, spring - 2), -6, 10, IST)];
  const curve = new THREE.CubicBezierCurve(new THREE.Vector2(W, spring), new THREE.Vector2(W, spring + r * 0.55), new THREE.Vector2(0, spring + r * 0.4), new THREE.Vector2(0, spring + r));
  for (let i = 1; i < 8; i++) {
    const p = curve.getPoint(i / 8);
    for (const s of [-1, 1]) out.push(translate(rotateY(cylinderAt({ rBot: 9, rTop: 1, height: 22, segments: 4, bottom: [0, 0, 0] }, "GoldTrim"), -30), [-8, s * (p.x + 8), p.y]));
  }
  out.push(translate(figure(130, IST), [-4, 0, spring + r + 4]));
  return merge(...out);
}
// The basilica on the great piazza, 22 x 23 m and about 20 m to the crosses: five domes of lead on
// a Greek cross, the front a screen of five deep portals with gold mosaic in their lunettes and
// columns of marble, a terrace along the top with four bronze horses, five round arches over it
// crowned with gilded crests and saints, pinnacles between; brick sides with blind arcades, the
// round ends of the cross arms, an apse.
function basilica(): Geo {
  const out: Geo[] = [], X0 = -880, X1 = 880, HY = 700, TOP = 1150;
  // the church: nave and the cross arms, brick clad with marble along the foot
  out.push(wuv(boxBounds([X0, -HY, 0], [X1, HY, TOP], "Venezia_Brick")), wuv(boxBounds([-320, -1080, 0], [520, 1080, TOP], "Venezia_Brick")));
  out.push(boxBounds([X0 - 6, -HY - 6, 0], [X1 + 6, HY + 6, 150], "Venezia_Marble", 2), boxBounds([-326, -1086, 0], [526, 1086, 150], "Venezia_Marble", 2));
  out.push(boxBounds([X0 - 14, -HY - 14, TOP - 30], [X1 + 14, HY + 14, TOP], IST, 3), boxBounds([-334, -1094, TOP - 30], [534, 1094, TOP], IST, 3));
  out.push(boxBounds([X0, -HY, TOP], [X1, HY, TOP + 16], "Venezia_Lead"), boxBounds([-320, -1080, TOP], [520, 1080, TOP + 16], "Venezia_Lead"));
  // blind arcades and windows along the sides
  const arch = (w: number, h: number) => merge(panel(frameShape(w / 2, h - w / 2, "round", 16), -8, 10, IST), panel(shapeOf(w / 2, h - w / 2, "round"), -3, 4, "Venezia_Marble"), translate(win(w * 0.45, h * 0.5, { head: "round", t: 8 }), [-3, 0, h * 0.3]));
  for (const f of ["-y", "+y"] as const) {
    for (const u of [-700, -480, 640, 800]) out.push(onFace(arch(170, 760), f, HY, u, 160));
    for (const u of [-200, 0, 200, 400]) out.push(onFace(arch(170, 760), f, 1080, u, 160));
    // the round end of each cross arm, with a great window
    const end = shapeOf(420, TOP, "round", TOP - 30);
    out.push(onFace(merge(panel(end, -20, 40, "Venezia_Brick"), panel(frameShape(404, TOP, "round", 16, TOP), -26, 10, IST), panel(frameShape(150, TOP + 120, "round", 18), -30, 10, IST), panel(shapeOf(150, TOP + 120, "round"), -24, 4, "GlassBlue")), f, 1080, 100, 0));
  }
  // the apse at the back
  out.push(cylinderAt({ radius: 360, height: 900, segments: 16, bottom: [X1, 0, 0] }, "Venezia_Brick"), cylinderAt({ radius: 366, height: 150, segments: 16, bottom: [X1, 0, 0] }, "Venezia_Marble"));
  out.push(lathe([[372, 0], [360, 120], [300, 230], [180, 320], [10, 360]], 16, "Venezia_Lead", [X1, 0, 900]));
  for (const a of [-50, 0, 50]) out.push(onRound(arch(130, 560), 360, a, 200, [X1, 0, 0]));
  // the domes: the great one over the crossing, four over the arms
  out.push(dome(100, 0, TOP + 16, 420), dome(-540, 0, TOP + 16, 340), dome(640, 0, TOP + 16, 340), dome(100, -720, TOP + 16, 320), dome(100, 720, TOP + 16, 320));
  // ---- the front screen ----
  const FX = -1100, FY = 1150, T1 = 780;
  const portals: [number, number, number][] = [[0, 210, 470], [-540, 160, 400], [540, 160, 400], [-930, 130, 380], [930, 130, 380]];
  out.push(panel(arcadeShape(-FY, FY, 0, T1, portals.map(([y, hw, sp]): [number, number, number, Head] => [y, hw, sp, "round"])), FX, 40, "Venezia_Marble"));
  out.push(boxBounds([FX + 156, -FY, 0], [X0, FY, T1], "Venezia_Brick"));
  for (const [y, hw, sp] of portals) {
    const p: Geo[] = [
      panel(frameShape(hw * 0.84, sp, "round", hw * 0.16), FX + 40, 50, IST),
      panel(frameShape(hw * 0.68, sp, "round", hw * 0.16), FX + 90, 60, "Venezia_Verde"),
      panel(shapeOf(hw * 0.68, sp, "round"), FX + 150, 6, "Venezia_Mosaic"),
      panel(rectShape(-hw * 0.5, hw * 0.5, 0, sp - 30), FX + 146, 4, "Bronze"),
      boxBounds([FX + 140, -hw * 0.5 - 6, sp - 34], [FX + 152, hw * 0.5 + 6, sp - 22], IST),
      arcStones([FX - 6, 0, sp], hw, 0, 180, 13, 30, 12, IST),
    ];
    for (const s of [-1, 1]) for (const k of [0, 1]) {
      const cy = s * (hw + 22 + k * 30);
      p.push(cylinderAt({ radius: 13, height: sp - 70, segments: 6, bottom: [FX - 18 - k * 4, cy, 40] }, k ? "Venezia_Granite" : "Venezia_Verde"));
      p.push(boxBounds([FX - 36 - k * 4, cy - 18, 0], [FX, cy + 18, 40], IST, 2), boxBounds([FX - 36 - k * 4, cy - 18, sp - 30], [FX, cy + 18, sp - 10], IST, 2));
    }
    out.push(translate(merge(...p), [0, y, 0]));
  }
  // the terrace along the top of the portals, balustrade and horses
  out.push(boxBounds([FX - 50, -FY - 20, T1 - 30], [FX + 200, FY + 20, T1], IST, 3));
  for (let y = -FY + 14; y < FY - 6; y += 30) out.push(translate(baluster(60), [FX - 38, y, T1]));
  out.push(boxBounds([FX - 50, -FY - 20, T1 + 60], [FX - 26, FY + 20, T1 + 70], IST, 1.5));
  for (const y of [-150, -50, 50, 150]) out.push(translate(merge(boxBounds([-40, -18, 0], [40, 18, 40], "Venezia_Marble", 2), translate(horse(), [0, 0, 40])), [FX + 60, y, T1]));
  // the upper arches: five round-topped bays, mosaics and the great window, crests and saints
  const UX = FX + 120;
  const uppers: [number, number, number][] = [[0, 290, 1080], [-540, 220, 1000], [540, 220, 1000], [-930, 180, 960], [930, 180, 960]];
  for (const [y, hw, sp] of uppers) {
    const u: Geo[] = [
      panel(shapeOf(hw, sp, "round", T1), UX, 40, "Venezia_Marble"),
      panel(frameShape(hw - 30, sp, "round", 22, T1 + 40), UX - 10, 12, IST),
    ];
    if (y === 0) u.push(panel(shapeOf(hw - 30, sp, "round", T1 + 40), UX - 2, 4, "Venezia_MosaicBlue"), panel(frameShape(150, sp - 40, "round", 14, T1 + 100), UX - 8, 10, "GoldTrim"), panel(shapeOf(150, sp - 40, "round", T1 + 100), UX - 4, 4, "GlassBlue"), translate(scale(lion("GoldTrim", "GoldTrim"), [0.55, 0.55, 0.55]), [UX - 30, 0, sp + 60]));
    else u.push(panel(shapeOf(hw - 30, sp, "round", T1 + 40), UX - 2, 4, "Venezia_Mosaic"), translate(figure(160, "Venezia_MosaicBlue"), [UX - 4, 0, T1 + 100]));
    u.push(translate(crest(hw, sp), [UX, 0, 0]));
    out.push(translate(merge(...u), [0, y, 0]));
  }
  // pinnacles between the arches
  for (const y of [-1150, -760, -290, 290, 760, 1150]) {
    out.push(translate(merge(
      boxBounds([-40, -40, 0], [40, 40, 480], IST, 2),
      boxBounds([-48, -48, 480], [48, 48, 500], IST, 2),
      ...[0, 2].map((i) => onRound(merge(panel(frameShape(16, 90, "pointed", 6), -4, 6, IST, { seg: 3 }), panel(shapeOf(16, 90, "pointed"), -1, 2, "Venezia_Dark", { seg: 3 })), 40, i * 90 + 180, 300)),
      rotateZ(cylinderAt({ rBot: 60, rTop: 4, height: 220, segments: 4, bottom: [0, 0, 500] }, IST), 45),
      sphereCenter(9, [0, 0, 726], "GoldTrim", 6),
      translate(figure(110, IST), [-30, 0, 500]),
    ), [UX + 20, y, T1]));
  }
  // the upper wall behind the arches, up to the domes' drums
  out.push(boxBounds([UX + 40, -FY, T1], [X0, FY, TOP], "Venezia_Brick"));
  return merge(...out);
}

// The campanile, the tall brick bell tower of the piazza (5.6 m square, about 28 m to the angel):
// a stepped Istrian base, the shaft of brick with pilaster strips joined by little arches at the
// top, the white belfry of four arches a side with the bells inside, the attic with a medallion
// on each face, the green copper spire with corner pinnacles and the gilded angel.
function campanile(): Geo {
  const H = 260, S0 = 110, S1 = 1500, B1 = 1820, A1 = 2120, out: Geo[] = [];
  out.push(boxBounds([-H - 60, -H - 60, 0], [H + 60, H + 60, 36], IST, 3), boxBounds([-H - 34, -H - 34, 36], [H + 34, H + 34, S0], IST, 3));
  out.push(wuv(boxBounds([-H, -H, S0], [H, H, S1], "Venezia_Brick")));
  for (const f of ["-x", "+x", "-y", "+y"] as Face[]) {
    const strips: Geo[] = [], pitch = (2 * H - 36) / 4;
    for (let i = 0; i < 5; i++) strips.push(boxBounds([-8, -H + 18 + i * pitch - 18, S0 + 20], [0, -H + 18 + i * pitch + 18, S1 - 110], "Venezia_BrickOld"));
    for (let i = 0; i < 4; i++) strips.push(translate(panel(frameShape(pitch / 2 - 18, S1 - 110, "round", 18, S1 - 112), -8, 8, "Venezia_BrickOld"), [0, -H + 18 + (i + 0.5) * pitch, 0]));
    strips.push(boxBounds([-12, -H - 4, S1 - 30], [2, H + 4, S1], IST, 2));
    // a column of slit windows up the shaft
    for (let z = 300; z < S1 - 200; z += 260) strips.push(merge(panel(frameShape(10, z + 60, "round", 6, z), -4, 6, IST), panel(shapeOf(10, z + 60, "round", z), -1, 2, "Venezia_Dark")));
    out.push(onFace(merge(...strips), f, H, 0, 0));
  }
  // the belfry
  out.push(boxBounds([-H - 24, -H - 24, S1], [H + 24, H + 24, S1 + 24], IST, 3));
  out.push(boxBounds([-H + 40, -H + 40, S1 + 24], [H - 40, H - 40, B1 - 40], "Venezia_Dark"));
  for (const f of ["-x", "+x", "-y", "+y"] as Face[]) {
    const bel: Geo[] = [];
    bel.push(panel(arcadeShape(-H, H, S1 + 24, B1 - 40, [-0.75, -0.25, 0.25, 0.75].map((k): [number, number, number, Head] => [k * H, H * 0.19, S1 + 210, "round"])), -4, 30, IST));
    for (const k of [-0.5, 0, 0.5]) bel.push(cylinderAt({ radius: 10, height: 170, segments: 8, bottom: [-16, k * H, S1 + 30] }, "Venezia_Marble"), boxBounds([-30, k * H - 16, S1 + 196], [-2, k * H + 16, S1 + 212], IST, 1.5));
    bel.push(boxBounds([-24, -H, S1 + 24], [0, H, S1 + 70], IST, 1.5));
    for (let y = -H + 12; y < H - 6; y += 18) bel.push(translate(baluster(36), [-14, y, S1 + 70]));
    bel.push(boxBounds([-26, -H, S1 + 106], [-2, H, S1 + 114], IST));
    out.push(onFace(merge(...bel), f, H, 0, 0));
  }
  for (const [y, r] of [[-90, 70], [90, 56]] as const) out.push(lathe([[r * 1.05, 0], [r, r * 0.25], [r * 0.7, r * 0.75], [r * 0.6, r * 1.05], [r * 0.15, r * 1.2]], 10, "Bronze", [0, y, S1 + 120 + (70 - r)]));
  out.push(boxBounds([-H + 40, -10, S1 + 230], [H - 40, 10, S1 + 250], "WoodDark"));
  out.push(boxBounds([-H - 30, -H - 30, B1 - 40], [H + 30, H + 30, B1], IST, 3));
  // the attic
  out.push(wuv(boxBounds([-H + 10, -H + 10, B1], [H - 10, H - 10, A1], "Venezia_Brick")));
  for (const f of ["-x", "+x", "-y", "+y"] as Face[]) {
    out.push(onFace(merge(
      boxBounds([-6, -H + 10, B1], [2, -H + 50, A1], IST), boxBounds([-6, H - 50, B1], [2, H - 10, A1], IST),
      panel(ringShape(80, 14, 0, B1 + 150), -8, 10, IST),
      panel(circleShape(80, 0, B1 + 150), -3, 4, "Venezia_MosaicBlue"),
      translate(rotateX(scale(lion("GoldTrim", "GoldTrim"), [0.42, 0.42, 0.42]), 0), [-6, 0, B1 + 100]),
    ), f, H - 10, 0, 0));
  }
  out.push(boxBounds([-H - 20, -H - 20, A1], [H + 20, H + 20, A1 + 30], IST, 3));
  // the spire and its pinnacles
  out.push(rotateZ(cylinderAt({ rBot: H * Math.SQRT2, rTop: 10, height: 560, segments: 4, bottom: [0, 0, A1 + 30] }, "RoofCopper"), 45));
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      out.push(boxBounds([sx * H - 24, sy * H - 24, A1 + 30], [sx * H + 24, sy * H + 24, A1 + 80], IST, 2));
      out.push(rotateZ(cylinderAt({ rBot: 30, rTop: 2, height: 130, segments: 4, bottom: [sx * H, sy * H, A1 + 80] }, "RoofCopper"), 45, [sx * H, sy * H, 0]));
    }
  out.push(sphereCenter(18, [0, 0, A1 + 600], "GoldTrim", 8), translate(angel(), [0, 0, A1 + 612]));
  return merge(...out);
}

// The Rialto: the covered stone bridge across the grand canal (26 m along its own Y, 12.8 m
// across). A low deck at street level with step edges, two rows of arched shops along the middle
// whose roofs step up toward the central portico, outer walkways behind Istrian balustrades, and on
// each face (±X) the one great segmental arch springing from the water, its ring of voussoirs and
// carved roundels in the spandrels; the vault beneath. Walk the central passage or the walkways.
function rialto(): Geo {
  const L = 1300, W = 640, SH = 470, PH = 200, out: Geo[] = [];
  out.push(boxBounds([-W, -L, -16], [W, L, 5], IST, 1));
  // step edges across the three walkways
  for (let y = 300; y < L; y += 44)
    for (const s of [-1, 1]) {
      out.push(boxBounds([-PH, s * y - 2, 5], [PH, s * y + 2, 6.5], "StoneGrey"));
      for (const k of [-1, 1]) out.push(boxBounds([k > 0 ? SH : -W + 30, s * y - 2, 5], [k > 0 ? W - 30 : -SH, s * y + 2, 6.5], "StoneGrey"));
    }
  // the faces over the water, the vault under
  const R = (820 * 820 + 150 * 150) / 300, half = (Math.asin(820 / R) * 180) / Math.PI;
  const face = merge(
    panel(spandrelShape(L, -260, -16, 820, -190, -40), -36, 30, IST),
    arcStones([-40, 0, -40 - R], R, 90 - half, 90 + half, 19, 46, 10, IST),
    boxBounds([-50, -L, -24], [-30, L, 6], IST, 2),
    panel(ringShape(70, 12, -1050, -130), -44, 10, IST), panel(circleShape(70, -1050, -130), -38, 4, "Venezia_Marble"),
    panel(ringShape(70, 12, 1050, -130), -44, 10, IST), panel(circleShape(70, 1050, -130), -38, 4, "Venezia_Marble"),
  );
  out.push(translate(face, [-W, 0, 0]), rotateZ(translate(face, [-W, 0, 0]), 180));
  out.push(vault(2 * W - 20, R, -40 - R, half, 18, IST, 12));
  // the balustrades along the outer walkways
  for (const s of [-1, 1]) {
    out.push(boxBounds([s * W - 30, -L + 60, 5], [s * W, L - 60, 16], IST), boxBounds([s * W - 34, -L + 60, 86], [s * W + 2, L - 60, 98], IST, 2));
    for (let y = -L + 74; y < L - 66; y += 24) out.push(translate(baluster(70), [s * (W - 15), y, 16]));
    for (const y of [-L + 50, L - 50, -400, 400]) out.push(boxBounds([s * W - 36, y - 20, 5], [s * W + 4, y + 20, 108], IST, 2));
  }
  // the shop rows: six bays a side of the portico, both rows, stepping up toward the middle
  const bays = 6, b0 = 240, b1 = 1000, bl = (b1 - b0) / bays;
  for (const s of [-1, 1])
    for (const k of [-1, 1])
      for (let i = 0; i < bays; i++) {
        const ya = k * (b1 - i * bl), yb = k * (b1 - (i + 1) * bl), y0 = Math.min(ya, yb), y1 = Math.max(ya, yb), yc = (y0 + y1) / 2, eh = 330 + i * 26;
        const x0 = s < 0 ? -SH : PH, x1 = s < 0 ? -PH : SH;
        out.push(wuv(boxBounds([x0, y0, 5], [x1, y1, eh], IST)));
        // an arch on each side of the bay: the shop opening to the passage, a blind arch outside
        const inner = merge(panel(frameShape(40, 150, "round", 10, 0), -4, 6, IST), panel(shapeOf(40, 150, "round"), 0, 3, "Venezia_Dark"),
          boxBounds([-12, -40, 0], [-2, 40, 80], "WoodDark"), boxBounds([-40, -44, 76], [-2, 44, 82], "WoodWarm"));
        out.push(onFace(inner, s < 0 ? "+x" : "-x", -PH, yc, 5));
        out.push(onFace(win(60, 170, { head: "round", grille: i % 2 === 1, t: 10 }), s < 0 ? "-x" : "+x", SH, yc, 60));
        out.push(boxBounds([x0 - 8, y0, eh - 16], [x1 + 8, y1, eh], IST, 1.5));
        out.push(translate(rowRoof((x1 - x0) / 2 + 6, (y1 - y0) / 2, eh, 70, 12, IST, "Venezia_Lead"), [(x0 + x1) / 2, yc, 0]));
        // goods hung outside the shops facing the passage
        if (i % 2 === 0) out.push(translate(boxAt([16, 50, 60], [0, 0, 0], i % 4 ? "FabricRed" : "Venezia_Silk"), [s < 0 ? -PH + 6 : PH - 6, yc + 40, 150]));
      }
  // the central portico: a great arch over the passage each way, pediments to the water
  const P = 240, PT = 640;
  out.push(wuv(boxBounds([-SH, -P, 5], [-PH, P, PT], IST)), wuv(boxBounds([PH, -P, 5], [SH, P, PT], IST)));
  for (const f of ["-y", "+y"] as Face[]) {
    out.push(onFace(merge(panel(arcadeShape(-SH, SH, 5, PT + 20, [[0, PH, 400, "round"]]), -10, 20, IST), arcStones([-12, 0, 400], PH, 0, 180, 11, 34, 8, IST), boxBounds([-26, -SH - 10, PT], [8, SH + 10, PT + 26], IST, 2)), f, P, 0, 0));
  }
  out.push(rotateZ(vault(2 * P, PH, 400, 90, 12, IST, 12), 90));
  out.push(boxBounds([-SH - 10, -P - 10, PT], [SH + 10, P + 10, PT + 26], IST, 2));
  out.push(merge(
    translate(rotateZ(rowRoof(P + 12, SH + 10, PT + 26, 190, 0, IST, "Venezia_Lead"), 90), [0, 0, 0]),
  ));
  for (const s of [-1, 1]) out.push(onFace(merge(panel(frameShape(90, 300, "round", 14, 0), -6, 10, IST), panel(shapeOf(90, 300, "round"), -1, 3, "Venezia_Dark")), s < 0 ? "-x" : "+x", SH, 0, 120));
  return merge(...out);
}

// A small stone bridge over a rio of 8 m (12 m along its own Y, 3.8 m across): a low deck of brick
// with Istrian step edges, brick parapets whose coping rises in a gentle hump, Istrian posts with
// balls at the four ends, and on each face (±X) the segmental arch from the water with its ring of
// white voussoirs and the brick vault beneath. Walk it along Y between the parapets.
function bridge(): Geo {
  const L = 600, W = 190, DW = 160, out: Geo[] = [];
  out.push(wuv(boxBounds([-DW, -L, -12], [DW, L, 5], "Venezia_Brick")));
  for (let y = 140; y < L - 20; y += 40) for (const s of [-1, 1]) out.push(boxBounds([-DW, s * y - 3, 5], [DW, s * y + 3, 7], IST));
  // the parapets, their tops in a hump
  const top = (y: number) => 82 + 40 * Math.cos((Math.PI * y) / (2 * (L - 40)));
  const par = new THREE.Shape();
  par.moveTo(-(L - 40), 0);
  par.lineTo(L - 40, 0);
  for (let i = 0; i <= 12; i++) {
    const y = (L - 40) - (2 * (L - 40) * i) / 12;
    par.lineTo(y, top(y));
  }
  par.lineTo(-(L - 40), 0);
  for (const s of [-1, 1]) {
    out.push(panel(par, s < 0 ? -W : DW, W - DW, "Venezia_Brick"));
    for (let i = 0; i < 12; i++) {
      const ya = -(L - 40) + (2 * (L - 40) * i) / 12, yb = -(L - 40) + (2 * (L - 40) * (i + 1)) / 12;
      out.push(beamBetween([s * (DW + W) / 2, ya, top(ya) + 4], [s * (DW + W) / 2, yb, top(yb) + 4], W - DW + 12, 10, IST));
    }
    for (const k of [-1, 1]) out.push(boxBounds([s * (DW + W) / 2 - 24, k * (L - 20) - 24, 0], [s * (DW + W) / 2 + 24, k * (L - 20) + 24, 104], IST, 2), sphereCenter(18, [s * (DW + W) / 2, k * (L - 20), 124], IST, 8));
  }
  // the faces over the water and the vault
  const span = 400, zs = -170, zc = -24, R = (span * span + (zc - zs) ** 2) / (2 * (zc - zs)), half = (Math.asin(span / R) * 180) / Math.PI;
  const face = merge(
    panel(spandrelShape(L - 60, -250, -6, span, zs, zc), -W - 8, 22, "Venezia_Brick"),
    arcStones([-W - 12, 0, zc - R], R, 90 - half, 90 + half, 13, 32, 10, IST),
    boxBounds([-W - 16, -L + 20, -16], [-W + 4, L - 20, 6], IST, 2),
  );
  out.push(face, rotateZ(face, 180), vault(2 * W, R, zc - R, half, 12, "Venezia_BrickOld", 10));
  return merge(...out);
}

// A timber bridge over the grand canal (23 m along its own Y, 5.2 m across): a deck of planks at
// street level between rails, and above each rail a bowstring arch of laminated beams rising to
// 3 m over the middle with posts down to the rail; beneath, the timber arch from the water and
// stone abutments; Istrian piers with lamps at the four ends.
function bridgeWooden(): Geo {
  const L = 1150, DW = 220, W = 250, out: Geo[] = [];
  out.push(boxBounds([-DW, -L, -20], [DW, L, 2], "WoodDark"));
  for (let y = -L + 15; y < L; y += 30) out.push(boxBounds([-DW, y - 13, 2], [DW, y + 13, 7], (Math.round(y / 30) % 5) === 0 ? "WoodPale" : "WoodGrey", 1));
  const archZ = (y: number, a: number, h: number) => h * Math.max(0, 1 - (y / a) ** 2);
  for (const s of [-1, 1]) {
    const x = s * (DW + 15);
    out.push(boxBounds([x - 12, -L, -30], [x + 12, L, 10], "WoodShade"));
    // the rail and its posts
    out.push(boxBounds([x - 7, -L + 60, 92], [x + 7, L - 60, 104], "WoodWarm"));
    for (let y = -L + 60; y <= L - 60; y += 100) out.push(boxBounds([x - 6, y - 6, 7], [x + 6, y + 6, 100], "WoodShade"));
    // the bowstring arch above the rail
    const n = 16, A = 900;
    for (let i = 0; i < n; i++) {
      const ya = -A + (2 * A * i) / n, yb = -A + (2 * A * (i + 1)) / n;
      out.push(beamBetween([x, ya, 100 + archZ(ya, A, 200)], [x, yb, 100 + archZ(yb, A, 200)], 16, 22, "WoodWarm"));
      if (i > 0) out.push(boxBounds([x - 4, ya - 4, 100], [x + 4, ya + 4, 100 + archZ(ya, A, 200)], "WoodShade"));
    }
    // beneath: the arch from the water to the deck
    const B = 820;
    for (let i = 0; i < n; i++) {
      const ya = -B + (2 * B * i) / n, yb = -B + (2 * B * (i + 1)) / n;
      out.push(beamBetween([x, ya, -160 + archZ(ya, B, 130)], [x, yb, -160 + archZ(yb, B, 130)], 18, 24, "WoodShade"));
      if (i > 0 && i < n) out.push(boxBounds([x - 5, ya - 5, -160 + archZ(ya, B, 130)], [x + 5, ya + 5, -20], "WoodDark"));
    }
    // abutments and the end piers with lamps
    for (const k of [-1, 1]) {
      out.push(boxBounds([x - 40, k * 820 - 40, -300], [x + 40, k * 820 + 40, -14], IST, 2));
      out.push(boxBounds([s * W - 26, k * (L - 26) - 26, 0], [s * W + 26, k * (L - 26) + 26, 110], IST, 2), translate(lantern(13, 32), [s * W, k * (L - 26), 110]));
    }
  }
  return merge(...out);
}

// =====================================================================================
// the water's edge and the harbour
// =====================================================================================

// A length of fondamenta, 4 m along Y (lengths join end to end): the brick quay wall from the canal
// bed up to the street, its face (to -X) on x = -30, an Istrian kerb along the edge, Istrian blocks
// and green weed where the water laps (about 1 m down), an iron mooring ring.
function fondamenta(): Geo {
  const L = 200;
  return merge(
    wuv(boxBounds([-30, -L, -250], [30, L, -6], "Venezia_BrickOld")),
    boxBounds([-38, -L, -9], [30, L, 4], IST, 1.5),
    boxBounds([-33, -L, -175], [-29, L, -62], IST),
    boxBounds([-35, -L, -126], [-31, L, -88], "Venezia_Algae"),
    translate(rotateY(torus(10, 2, 10, 4, "IronDark"), 90), [-38, 60, -42]),
    boxBounds([-38, 56, -34], [-32, 64, -28], "IronDark"),
  );
}
// Steps down to the water off a length of fondamenta (4 m along Y): the quay wall with a flight
// projecting into the canal between low Istrian walls, the lower steps green with weed.
function fondamentaSteps(): Geo {
  const out: Geo[] = [fondamenta()];
  for (let i = 0; i < 7; i++) {
    const x0 = -38 - 30 * (i + 1), z = -18 * (i + 1);
    out.push(boxBounds([x0, -110, -250], [x0 + 30, 110, z], i > 4 ? "Venezia_Algae" : IST, 1));
  }
  for (const s of [-1, 1]) {
    const side = new THREE.Shape();
    side.moveTo(-38, -250);
    side.lineTo(-38 - 30 * 7 - 6, -250);
    side.lineTo(-38 - 30 * 7 - 6, -110);
    side.lineTo(-38, 30);
    side.lineTo(-38, -250);
    out.push(sidePanel(side, s * 110 + (s > 0 ? 24 : 0), 24, IST));
    out.push(sphereCenter(12, [-46, s * 122, 38], IST, 6));
  }
  return merge(...out);
}
// A palina: a mooring pole driven into the canal bed (3 m down), painted white with a spiral stripe
// and a gilded knob, `h` above the street.
function palina(h: number, stripe: string, phase = 0): Geo {
  return merge(
    cylinderAt({ radius: 10, height: h + 300, segments: 8, bottom: [0, 0, -300] }, "Venezia_PaintWhite"),
    helix(10.4, -160, h - 24, 58, 3.4, stripe, phase),
    cylinderAt({ rBot: 11, rTop: 13, height: 14, segments: 8, bottom: [0, 0, h] }, stripe),
    sphereCenter(12, [0, 0, h + 24], "GoldTrim", 8),
  );
}
// A cluster of three paline lashed together near the top (in front of a palazzo's water door).
function mooringPoles(): Geo {
  const out: Geo[] = [
    translate(palina(300, "Venezia_PaintRed"), [-14, 0, 0]),
    translate(palina(250, "Venezia_PaintBlue", 1), [14, -22, 0]),
    translate(palina(270, "Venezia_PaintRed", 2), [14, 22, 0]),
  ];
  for (const z of [150, 190]) out.push(translate(torus(30, 3, 12, 4, "RopeTan"), [5, 0, z]));
  return merge(...out);
}

// ---------- boats ----------
const GONDOLA: HullOpt = {
  len: 1000, beam: 150, deck: 12, keel: -26, bulwark: 26, sheer: 14, bowRise: 100, sternSweep: 66, stern: 0.05, th: 4, n: 22, wl: 4, band: 5,
  mats: ["LacquerBlack", "LacquerBlack", "LacquerBlack", "LacquerBlack", "WoodDark", "WoodDark"],
};
// A gondola, 10 m long, black with gilded ornaments (bow to -X, its waterline at z = 0): the
// toothed iron ferro on the high bow, the red velvet seats amidships, the forcola and the long oar
// at the stern where the gondolier stands.
function gondola(): Geo {
  const o = GONDOLA, H = (x: number) => hullAt(o, x);
  const g: Geo[] = [hull(o), wale(o, 32, -380, 380, "GoldTrim", 12, 4)];
  // the ferro
  const bt = H(-498).top;
  g.push(boxBounds([-512, -2, bt - 30], [-494, 2, bt + 64], "IronLight"), beamBetween([-514, 0, bt + 62], [-470, 0, bt + 80], 4, 10, "IronLight"));
  for (let i = 0; i < 6; i++) g.push(boxBounds([-540, -1.5, bt - 22 + i * 13], [-510, 1.5, bt - 15 + i * 13], "IronLight"));
  g.push(boxBounds([-496, -1.5, bt - 6], [-476, 1.5, bt + 2], "IronLight"));
  // the stern's curl and its little iron
  const st = H(498).top;
  g.push(boxBounds([490, -1.5, st - 20], [508, 1.5, st + 14], "IronLight"));
  // the seats: a cushioned bench with a gilded back, two side chairs, a carpet
  g.push(boxBounds([-180, -46, 12], [180, 46, 14], "FabricRed"));
  g.push(boxBounds([10, -54, 12], [70, 54, 44], "Venezia_Velvet", 3), boxBounds([66, -54, 40], [76, 54, 84], "GoldTrim", 1.5), boxBounds([62, -50, 44], [68, 50, 80], "Venezia_Velvet", 2));
  for (const s of [-1, 1]) g.push(boxBounds([-90, s * 30 - 22, 12], [-50, s * 30 + 22, 38], "Venezia_Velvet", 3), sphereCenter(7, [40, s * (H(40).w + 2), H(40).top + 6], "GoldTrim", 6));
  // the gondolier's platform, the forcola and the oar
  g.push(boxBounds([380, -32, 24], [450, 32, 30], "WoodDark"));
  g.push(boxBounds([318, 52, H(326).top - 4], [334, 62, H(326).top + 56], "WoodDark", 2), boxBounds([312, 50, H(326).top + 40], [330, 64, H(326).top + 50], "WoodDark"));
  g.push(cylinderBetween([326, 58, H(326).top + 48], [720, 150, -30], 3, 6, "WoodPale"), translate(rotateZ(boxAt([60, 14, 3], [0, 0, -1.5], "WoodPale", 1), 14), [740, 156, -36]));
  return merge(...g);
}

// The gondola station (stazio): a floating timber landing, 6 m along Y, 2.6 m across (its
// waterline at z = 0), a little roofed shelter and a bench at one end, striped poles at the corners
// to tie the gondolas to, and a gangway up to the quay at +X (1.1 m up).
function gondolaStation(): Geo {
  const out: Geo[] = [];
  for (const y of [-220, 0, 220]) out.push(boxBounds([-120, y - 90, -24], [120, y + 90, 10], "WoodShade", 2));
  out.push(boxBounds([-130, -300, 10], [130, 300, 16], "WoodDark"));
  for (let y = -290; y < 300; y += 24) out.push(boxBounds([-130, y - 10, 16], [130, y + 10, 20], y % 48 === 0 ? "WoodPale" : "WoodGrey", 1));
  for (const s of [-1, 1]) out.push(boxBounds([-134, s * 300 - 6, 16], [134, s * 300 + 6, 26], "WoodDark"));
  // the shelter
  for (const sx of [-1, 1]) for (const y of [120, 280]) out.push(boxBounds([sx * 100 - 6, y - 6, 20], [sx * 100 + 6, y + 6, 250], "WoodDark"));
  out.push(boxBounds([90, 110, 20], [110, 290, 130], "WoodWarm"));
  out.push(boxBounds([60, 130, 20], [100, 270, 62], "WoodWarm"), boxBounds([56, 126, 62], [104, 274, 68], "WoodDark"));
  out.push(roofUv(merge(rotateY(boxAt([140, 200, 6], [-70, 200, 0], "Venezia_Roof"), -14), rotateY(boxAt([140, 200, 6], [70, 200, 0], "Venezia_Roof"), 14))).map((p) => ({ ...p, geo: p.geo.clone().translate(0, 0, 268) })));
  out.push(cylinderBetween([0, 100, 284], [0, 300, 284], 6, 6, "Venezia_RoofRidge"));
  out.push(translate(lantern(10, 24), [-100, 300, 250]));
  // a board with the gondola painted on it
  out.push(boxBounds([-12, 250, 160], [-4, 300, 230], "Venezia_PaintBlue"), boxBounds([-14, 254, 190], [-12, 296, 196], "GoldTrim"));
  // the poles
  for (const [x, y, c, ph] of [[-150, -310, "Venezia_PaintRed", 0], [-150, 310, "Venezia_PaintBlue", 1], [150, -310, "Venezia_PaintRed", 2]] as const) out.push(translate(palina(260, c, ph), [x, y, 0]));
  // the gangway up to the quay
  out.push(beamBetween([130, -60, 22], [330, -60, 112], 110, 8, "WoodGrey"));
  for (const s of [-1, 1]) out.push(beamBetween([130, -60 + s * 56, 80], [330, -60 + s * 56, 170], 6, 6, "WoodDark"), boxBounds([126, -60 + s * 56 - 3, 20], [134, -60 + s * 56 + 3, 82], "WoodDark"));
  return merge(...out);
}

// A length of the great harbour pier, 4 m along Y (lengths join end to end), 6.4 m across: a mole
// of stone from the lagoon bed, Istrian kerbs and trachyte paving on top at street level, a bollard
// and timber fenders each side, iron rings, weed at the waterline.
function harbourPier(): Geo {
  const L = 200, W = 320, out: Geo[] = [
    wuv(boxBounds([-W, -L, -330], [W, L, -6], "Venezia_BrickOld")),
    boxBounds([-W + 34, -L, -8], [W - 34, L, 4], "Venezia_Trachyte"),
    boxBounds([-W - 4, -L, -175], [W + 4, L, -62], IST),
    boxBounds([-W - 6, -L, -126], [W + 6, L, -88], "Venezia_Algae"),
  ];
  for (const s of [-1, 1]) {
    out.push(boxBounds([s < 0 ? -W - 8 : W - 34, -L, -12], [s < 0 ? -W + 34 : W + 8, L, 7], IST, 1.5));
    out.push(cylinderAt({ rBot: 17, rTop: 14, height: 38, segments: 8, bottom: [s * (W - 30), 0, 7] }, IST), sphereCenter(17, [s * (W - 30), 0, 47], IST, 8));
    for (const y of [-120, 120]) out.push(boxBounds([s * (W + 14) - 9, y - 10, -230], [s * (W + 14) + 9, y + 10, 0], "WoodDark", 2));
    out.push(translate(rotateY(torus(11, 2.4, 10, 4, "IronDark"), 90), [s * (W + 9), 0, -40]));
  }
  return merge(...out);
}

const GALLEON: HullOpt = {
  len: 2600, beam: 680, deck: 170, keel: -210, bulwark: 70, sheer: 60, rise: 150, bowRise: 90, stern: 0.7, th: 10, n: 26, wl: 20, band: 26,
  mats: ["Venezia_PaintRed", "WoodDark", "Venezia_HullBottom", "WoodWarm", "WoodShade", "WoodPale"],
};
// A square sail hanging from a yard at zTop in front of a mast at xm, bellied forward, with a red
// cross of St George... no: the red band of the Republic along its foot.
function squareSail(xm: number, zTop: number, zBot: number, half: number, belly: number, band = false): Geo {
  const x = xm - 32, F = clothAt([x, -half * 1.04, zBot], [x, half * 1.04, zBot], [x, -half * 0.94, zTop], [x, half * 0.94, zTop], [-belly, 0, 0]);
  const out: Geo[] = [
    surf(F, 0, 1, 0, 1, 6, 5, "Venezia_Canvas"),
    cylinderBetween([xm - 26, 0, zTop + 6], [xm - 26, half * 1.04, zTop + 6], 8, 6, "WoodWarm", 4),
    cylinderBetween([xm - 26, 0, zTop + 6], [xm - 26, -half * 1.04, zTop + 6], 8, 6, "WoodWarm", 4),
  ];
  if (band) {
    const G = (u: number, v: number): V3 => { const p = F(u, v); return [p[0] - 2, p[1], p[2]]; };
    out.push(surf(G, 0.44, 0.56, 0.12, 0.92, 1, 5, "Venezia_PaintRed"), surf(G, 0, 1, 0.5, 0.62, 6, 1, "Venezia_PaintRed"));
  }
  return merge(...out);
}
function mast(x: number, z0: number, zPlat: number, zPeak: number): Geo {
  return merge(
    cylinderBetween([x, 0, z0 - 10], [x, 0, zPlat], 18, 10, "WoodWarm", 15),
    cylinderAt({ radius: 66, height: 10, segments: 10, bottom: [x, 0, zPlat] }, "WoodDark"),
    cylinderAt({ rBot: 30, rTop: 66, height: 20, segments: 10, bottom: [x, 0, zPlat - 20] }, "WoodShade"),
    translate(torus(64, 2.5, 16, 4, "WoodWarm"), [x, 0, zPlat + 32]),
    ...[0, 90, 180, 270].map((a) => boxAt([4, 4, 32], [x + Math.cos(a * D) * 63, Math.sin(a * D) * 63, zPlat + 10], "WoodDark")),
    cylinderBetween([x, 0, zPlat], [x, 0, zPeak], 12, 8, "WoodWarm", 6),
    sphereCenter(8, [x, 0, zPeak + 4], "GoldTrim", 8),
  );
}
// A Venetian merchant galleon, 26 m long (bow to -X, waterline at z = 0, the deck 1.7 m up): a
// red band and gilded wales on dark topsides, the high stern castle with a gallery of gilded
// windows and three lanterns, a forecastle, square sails with the Republic's red cross on the
// foremast and mainmast, a lateen on the mizzen, the lion banner at the stern, a gilded lion for a
// figurehead, cargo on deck and the ship's boat.
function galleon(): Geo {
  const o = GALLEON, H = (x: number) => hullAt(o, x);
  const g: Geo[] = [hull(o), wale(o, 110, -1150, 1250, "GoldTrim", 22, 10), wale(o, 60, -1100, 1200, "WoodShade", 22)];
  // the stern castle (quarterdeck) and its cabin front
  const qz = 330, qxs = [640, 740, 840, 940, 1040, 1140, 1240, 1300];
  g.push(loft(qxs, qxs.map((x): Sec => { const wi = H(x).wi + 1; return [[wi, qz, "WoodShade"], [wi, qz - 16, "WoodShade"], [-wi, qz - 16, "WoodShade"], [-wi, qz, "WoodPale"]]; }), 4, "WoodShade"));
  const wq = H(640).wi;
  g.push(boxBounds([640, -wq, 170], [654, wq, qz - 14], "WoodWarm"));
  g.push(onFace(door(84, 130, { head: "round", step: false, t: 10 }), "-x", -640, 0, 176));
  for (const y of [-180, 180]) g.push(onFace(win(46, 60, { head: "round", frame: "GoldTrim", t: 7 }), "-x", -640, y, 224));
  g.push(array(boxAt([5, 5, 34], [648, -wq + 14, qz], "WoodWarm"), 18, [0, (2 * wq - 28) / 17, 0]), boxBounds([640, -wq, qz + 34], [654, wq, qz + 40], "WoodDark"));
  for (let i = 0; i < 6; i++) g.push(boxAt([24, 70, 6], [628 - i * 22, 200, qz - 26 - i * 26], "WoodShade"));
  // the forecastle
  const fz = 300, fxs = [-1180, -1100, -1000, -900, -820];
  g.push(loft(fxs, fxs.map((x): Sec => { const wi = H(x).wi + 1; return [[wi, fz, "WoodShade"], [wi, fz - 14, "WoodShade"], [-wi, fz - 14, "WoodShade"], [-wi, fz, "WoodPale"]]; }), 4, "WoodShade"));
  const wf = H(-820).wi;
  g.push(boxBounds([-834, -wf, 170], [-820, wf, fz - 12], "WoodWarm"), array(boxAt([5, 5, 30], [-826, -wf + 14, fz], "WoodWarm"), 14, [0, (2 * wf - 28) / 13, 0]), boxBounds([-834, -wf, fz + 30], [-820, wf, fz + 36], "WoodDark"));
  // gunports, two a side
  for (const x of [-300, 200])
    for (const s of [-1, 1]) {
      const w = H(x).w;
      g.push(boxAt([40, 6, 32], [x, s * (w + 1), 184], "LacquerBlack"), rotateX(boxAt([42, 4, 34], [x, s * (w + 3), 216], "Venezia_PaintRed"), s * -55, [x, s * (w + 1), 216]));
    }
  // masts, sails, the lateen on the mizzen
  const masts: [number, number, number, number][] = [[-640, 170, 1000, 1680], [-80, 170, 1140, 1900], [820, qz, 940, 1500]];
  for (const [x, z0, zp, zt] of masts) g.push(mast(x, z0, zp, zt));
  g.push(squareSail(-640, 900, 360, 380, 74, true), squareSail(-640, 1360, 1018, 280, 56), squareSail(-80, 1040, 380, 430, 84, true), squareSail(-80, 1560, 1158, 320, 62), squareSail(-80, 1830, 1580, 210, 40));
  g.push(cylinderBetween([560, 0, 560], [1360, 0, 1460], 7, 6, "WoodWarm", 4));
  g.push(sheet([590, 0, 584], [1290, 0, 470], [1340, 0, 1432], [1340, 0, 1432], [0, 46, 0], "Venezia_Canvas", 5, 6));
  // bowsprit, the jib
  const bs0: V3 = [-1150, 0, 330], bs1: V3 = [-1820, 0, 560];
  g.push(cylinderBetween(bs0, bs1, 15, 8, "WoodWarm", 8), sheet([-1780, 0, 548], [-1260, 0, 420], [-660, 0, 1560], [-660, 0, 1560], [0, 40, 0], "Venezia_Canvas", 5, 6));
  // the gilded lion at the stem
  g.push(translate(scale(lion("GoldTrim", "GoldTrim"), [0.62, 0.62, 0.62]), [-1270, 0, 210]));
  // rigging
  const tar = (a: V3, b: V3) => rope(a, b, 1.7, "Venezia_Tar");
  g.push(tar([-640, 0, 1680], bs1), tar([-640, 0, 1000], [-1250, 0, 400]), tar([-80, 0, 1900], [-640, 0, 1620]), tar([-80, 0, 1140], [-640, 0, 560]), tar([820, 0, 1500], [-80, 0, 1260]), tar(bs1, [-1300, 0, 130]));
  for (const [x, , zp] of masts)
    for (const s of [-1, 1]) {
      const ch = H(x + 30);
      g.push(boxBounds([x - 40, s > 0 ? ch.w - 2 : -ch.w - 18, ch.top - 36], [x + 100, s > 0 ? ch.w + 18 : -ch.w + 2, ch.top - 28], "WoodDark"));
      for (const dx of [-25, 25, 75]) {
        const c = H(x + dx);
        g.push(tar([x + dx * 0.15, s * 22, zp - 4], [x + dx, s * (c.w + 12), c.top - 32]));
      }
    }
  // the stern: a gallery of gilded windows, lanterns, the lion banner, the rudder
  for (const y of [-180, -60, 60, 180]) g.push(boxAt([4, 74, 60], [1300, y, 230], "GoldTrim"), boxAt([4, 58, 46], [1303, y, 237], "GlassBlue"), boxAt([4, 3, 46], [1305, y, 237], "GoldTrim"));
  g.push(boxAt([5, 420, 14], [1301, 0, 300], "GoldTrim", 1), boxAt([5, 360, 26], [1301, 0, 316], "Venezia_PaintRed", 1), boxAt([5, 440, 8], [1301, 0, 210], "GoldTrim", 1));
  const st = H(1290).top;
  for (const y of [-200, 0, 200]) g.push(cylinderBetween([1270, y, st], [1270, y, st + 34], 3, 6, "IronDark"), translate(lantern(15, 34), [1270, y, st + 34]));
  g.push(cylinderBetween([1290, 0, st], [1310, 0, st + 380], 4, 6, "WoodWarm"), sphereCenter(7, [1310, 0, st + 384], "GoldTrim", 6));
  g.push(sheet([1308, 0, st + 210], [1080, 0, st + 196], [1310, 0, st + 370], [1082, 0, st + 352], [0, 22, 0], "Venezia_PaintRed", 6, 3));
  g.push(sheet([1306, 0, st + 238], [1180, 0, st + 230], [1307, 0, st + 300], [1181, 0, st + 292], [0, 24, 0], "GoldTrim", 3, 2));
  g.push(boxBounds([1296, -10, -205], [1334, 10, 240], "WoodDark", 2), boxBounds([1297, -12, 40], [1336, 12, 50], "IronDark"), boxBounds([1297, -12, 150], [1336, 12, 160], "IronDark"));
  // pennants
  g.push(sheet([-86, 0, 1886], [-470, 0, 1900], [-86, 0, 1930], [-470, 0, 1902], [0, 16, -10], "Venezia_PaintRed", 6, 1, 0.6));
  g.push(sheet([-646, 0, 1668], [-900, 0, 1678], [-646, 0, 1700], [-900, 0, 1679], [0, 14, -8], "GoldTrim", 5, 1, 0.6));
  // anchors at the bow
  for (const s of [-1, 1]) {
    const x = -1040, b = H(x), y = s * (b.w + 14);
    g.push(beamBetween([x - 10, s * (b.w - 20), b.top - 10], [x - 30, s * (b.w + 46), b.top - 2], 14, 14, "WoodDark"));
    g.push(boxAt([8, 8, 130], [x, y, b.top - 170], "IronDark"), boxAt([8, 60, 8], [x, y, b.top - 60], "WoodDark"));
    g.push(beamBetween([x, y, b.top - 170], [x - 34, y, b.top - 130], 8, 8, "IronDark"), beamBetween([x, y, b.top - 170], [x + 34, y, b.top - 130], 8, 8, "IronDark"));
  }
  // the deck: hatch, capstan, the ship's boat, cargo
  g.push(boxAt([220, 180, 22], [-360, 0, 170], "WoodDark", 2), boxAt([200, 160, 4], [-360, 0, 192], "WoodShade"));
  g.push(array(boxAt([200, 4, 4], [-360, -70, 196], "WoodDark"), 6, [0, 28, 0]));
  const boat: HullOpt = { len: 340, beam: 126, deck: 6, keel: -26, bulwark: 34, sheer: 12, bowRise: 8, stern: 0.55, th: 4, n: 10, wl: 0, band: 8,
    mats: ["Venezia_PaintRed", "WoodWarm", "WoodShade", "WoodShade", "WoodShade", "WoodShade"] };
  g.push(translate(merge(hull(boat), boxAt([18, 80, 26], [-80, 0, -30], "WoodDark"), boxAt([18, 80, 26], [80, 0, -30], "WoodDark")), [240, 0, 202]));
  g.push(cylinderAt({ rBot: 28, rTop: 22, height: 50, segments: 8, bottom: [520, 0, 170] }, "WoodWarm"), cylinderAt({ radius: 32, height: 12, segments: 8, bottom: [520, 0, 220] }, "WoodDark"));
  for (let i = 0; i < 2; i++) g.push(rotateZ(boxAt([150, 7, 7], [520, 0, 224], "WoodWarm"), i * 90, [520, 0, 0]));
  g.push(translate(cargoBales(), [-160, -10, 170]));
  return merge(...g);
}

// =====================================================================================
// the piazza and the streets
// =====================================================================================

// The column of the winged lion on the molo (about 11 m): three Istrian steps, a carved pedestal,
// a shaft of grey-pink granite, a Byzantine capital and the bronze lion on its plinth.
function lionColumn(): Geo {
  const out: Geo[] = [];
  for (let i = 0; i < 3; i++) out.push(rotateZ(cylinderAt({ radius: 230 - i * 40, height: 22, segments: 8, bottom: [0, 0, i * 22] }, IST), 22.5));
  out.push(boxBounds([-80, -80, 66], [80, 80, 90], IST, 3), boxBounds([-70, -70, 90], [70, 70, 230], "Venezia_Marble", 2), boxBounds([-82, -82, 230], [82, 82, 252], IST, 3));
  for (const f of ["-x", "+x", "-y", "+y"] as Face[]) out.push(onFace(merge(panel(frameShape(40, 50, "round", 8, 0), -4, 6, IST), panel(shapeOf(40, 50, "round"), -1, 3, "Venezia_Verde")), f, 70, 0, 120));
  out.push(cylinderAt({ rBot: 62, rTop: 70, height: 26, segments: 12, bottom: [0, 0, 252] }, IST));
  out.push(cylinderAt({ rBot: 54, rTop: 46, height: 820, segments: 12, bottom: [0, 0, 278] }, "Venezia_Granite"));
  const cz = 1098;
  out.push(cylinderAt({ rBot: 48, rTop: 70, height: 70, segments: 8, bottom: [0, 0, cz] }, IST), boxBounds([-92, -92, cz + 70], [92, 92, cz + 96], IST, 3));
  for (const a of [0, 90, 180, 270]) out.push(translate(rotateZ(translate(rock([30, 40, 50], 0.4, a + 3, IST), [-60, 0, 0]), a), [0, 0, cz + 20]));
  out.push(boxBounds([-110, -50, cz + 96], [110, 50, cz + 116], IST, 2));
  out.push(translate(lion(), [10, 0, cz + 116]));
  return merge(...out);
}
// A bronze flagpole of the piazza (about 11 m): a cast pedestal on Istrian steps, the red pole and
// the Republic's banner of crimson and gold flying out to +Y.
function flagpole(): Geo {
  const out: Geo[] = [
    rotateZ(cylinderAt({ radius: 110, height: 20, segments: 8, bottom: [0, 0, 0] }, IST), 22.5),
    lathe([[86, 0], [90, 20], [70, 40], [58, 70], [66, 96], [48, 120], [34, 150], [26, 170]], 10, "Bronze", [0, 0, 20]),
    cylinderAt({ rBot: 9, rTop: 5, height: 1000, segments: 8, bottom: [0, 0, 190] }, "Venezia_PaintRed"),
    sphereCenter(11, [0, 0, 1196], "GoldTrim", 8),
  ];
  for (let i = 0; i < 4; i++) out.push(onRound(merge(panel(circleShape(14, 0, 0), -2, 3, "GoldTrim")), 66, i * 90, 90));
  out.push(sheet([0, 6, 900], [0, 240, 880], [0, 6, 1170], [0, 250, 1150], [26, 0, -10], "Venezia_PaintRed", 7, 4));
  out.push(sheet([0, 250, 880], [0, 290, 860], [0, 250, 1150], [0, 310, 1110], [20, 0, -6], "GoldTrim", 2, 4));
  out.push(cylinderBetween([0, 6, 1176], [0, 6, 892], 2, 4, "RopeTan"));
  return merge(...out);
}
// A vera da pozzo: the carved Istrian well-head of a campo, an octagonal drum with a rosette on
// each face on two steps, a bronze lid, and the iron arch with a pulley and a copper bucket.
function wellHead(): Geo {
  const out: Geo[] = [
    rotateZ(cylinderAt({ radius: 150, height: 14, segments: 8, bottom: [0, 0, 0] }, IST), 22.5),
    rotateZ(cylinderAt({ radius: 122, height: 14, segments: 8, bottom: [0, 0, 14] }, IST), 22.5),
    rotateZ(cylinderAt({ radius: 84, height: 12, segments: 8, bottom: [0, 0, 28] }, IST), 22.5),
    rotateZ(cylinderAt({ radius: 76, height: 72, segments: 8, bottom: [0, 0, 40] }, IST), 22.5),
    rotateZ(cylinderAt({ radius: 86, height: 12, segments: 8, bottom: [0, 0, 112] }, IST), 22.5),
  ];
  for (let k = 0; k < 8; k++) out.push(rotateZ(translate(merge(boxBounds([-3, -20, 52], [1, 20, 100], "Venezia_Marble"), sphereCenter(9, [-4, 0, 76], IST, 6), boxBounds([-5, -24, 50], [1, 24, 54], IST), boxBounds([-5, -24, 98], [1, 24, 102], IST)), [-70, 0, 0]), k * 45));
  out.push(lathe([[72, 0], [70, 10], [52, 26], [24, 36], [4, 40]], 12, "Bronze", [0, 0, 124]), translate(torus(8, 2, 8, 4, "Bronze"), [0, 0, 168]));
  for (const s of [-1, 1]) out.push(cylinderBetween([s * 72, 0, 118], [s * 72, 0, 230], 3.5, 6, "IronDark"));
  const arc: V3[] = [];
  for (let i = 0; i <= 8; i++) arc.push([Math.cos((i / 8) * Math.PI) * 72, 0, 230 + Math.sin((i / 8) * Math.PI) * 50]);
  out.push(tube(arc, 3.5, "IronDark", 12, 5), translate(rotateX(torus(14, 3, 10, 4, "IronDark"), 90), [0, 0, 262]));
  out.push(cylinderBetween([0, 0, 248], [30, 30, 140], 1, 4, "RopeTan"), cylinderAt({ rBot: 13, rTop: 16, height: 22, segments: 8, bottom: [34, 32, 128] }, "CopperGreen"));
  return merge(...out);
}

// ---------- masks ----------
function maskFace(mat: string, w = 11, h = 15): Geo {
  return merge(
    translate(scale(sphereCenter(1, [0, 0, 0], mat, 6), [5, w, h]), [0, 0, 0]),
    boxBounds([-5.5, -w * 0.62, h * 0.12], [-3, -w * 0.18, h * 0.32], "Venezia_Dark"),
    boxBounds([-5.5, w * 0.18, h * 0.12], [-3, w * 0.62, h * 0.32], "Venezia_Dark"),
  );
}
// the masks of the carnival, each facing -X, centred on z = 0
const MASKS: (() => Geo)[] = [
  // bauta: white, a jutting chin
  () => merge(maskFace("Venezia_PaintWhite", 12, 17), boxBounds([-9, -8, -18], [0, 8, -6], "Venezia_PaintWhite", 2)),
  // colombina: a gilded half mask with feathers
  () => merge(translate(scale(sphereCenter(1, [0, 0, 0], "GoldTrim", 8), [4, 13, 7]), [0, 0, 3]), boxBounds([-4.5, -8, 2], [-2, -3, 6], "Venezia_Dark"), boxBounds([-4.5, 3, 2], [-2, 8, 6], "Venezia_Dark"),
    ...[[-8, "FabricPurple"], [0, "Venezia_PaintRed"], [8, "FabricPurple"]].map(([y, m]) => translate(rotateX(scale(sphereCenter(1, [0, 0, 0], m as string, 6), [2, 4, 14]), (y as number) * 2), [2, (y as number) + 6, 18]))),
  // the plague doctor: a long white beak
  () => merge(maskFace("Venezia_PaintWhite", 10, 13), cylinderBetween([-3, 0, -2], [-34, 0, -12], 7, 6, "Venezia_PaintWhite", 1), translate(rotateY(torus(3, 1, 8, 3, "GlassBlue"), 90), [-5, -5, 3]), translate(rotateY(torus(3, 1, 8, 3, "GlassBlue"), 90), [-5, 5, 3])),
  // moretta: a black oval
  () => maskFace("LacquerBlack", 10, 13),
  // harlequin: half red half gold
  () => merge(translate(scale(sphereCenter(1, [0, 0, 0], "Venezia_PaintRed", 8), [5, 11, 14]), [0, -1, 0]), translate(scale(sphereCenter(1, [0, 0, 0], "GoldTrim", 8), [4.6, 9, 13]), [-0.8, 3, 0]), boxBounds([-6, -7, 2], [-3, -2, 5], "Venezia_Dark"), boxBounds([-6, 2, 2], [-3, 7, 5], "Venezia_Dark")),
  // a blue and gold volto
  () => merge(maskFace("Venezia_PaintBlue", 11, 15), boxBounds([-6, -9, 7], [-4, 9, 9], "GoldTrim")),
];
// The mask shop's stall, 3.2 m wide: a counter of blue panels in front, a back wall of velvet hung
// with rows of carnival masks, more on stands on the counter, a purple and gold striped awning, a
// signboard with a gilded mask, lanterns at the corners.
function maskStall(): Geo {
  const out: Geo[] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) out.push(boxBounds([sx * 80 - 6, sy * 150 - 6, 0], [sx * 80 + 6, sy * 150 + 6, 250], "WoodDark"));
  out.push(boxBounds([-96, -156, 0], [-60, 156, 92], "Venezia_PaintBlue", 2), boxBounds([-104, -162, 92], [-56, 162, 100], "WoodWarm", 1.5));
  for (const y of [-100, 0, 100]) out.push(boxBounds([-98, y - 40, 14], [-94, y + 40, 80], "GoldTrim"));
  out.push(boxBounds([70, -156, 0], [84, 156, 240], "Venezia_Velvet"));
  for (const [i, z] of [176, 218].entries())
    for (let k = 0; k < 5; k++) out.push(translate(MASKS[(k + i * 2) % MASKS.length](), [64, -116 + k * 58, z]));
  // a slanted board along the counter, masks laid on it to the street
  out.push(translate(rotateY(boxBounds([-4, -150, 0], [4, 150, 70], "Venezia_Velvet"), 35), [-80, 0, 100]));
  for (let k = 0; k < 5; k++) out.push(translate(rotateY(MASKS[(k * 5 + 2) % MASKS.length](), 35), [-67, -116 + k * 58, 134]));
  // the awning, masks hung on cords from its front beam, the sign, the lanterns
  out.push(translate(awning(320, 150, 50, "FabricPurple", "FabricGold"), [84, 0, 266]));
  for (let k = 0; k < 5; k++) {
    const y = -100 + k * 50;
    out.push(cylinderBetween([-64, y, 194], [-64, y, 170], 0.8, 3, "RopeTan"), translate(MASKS[(k * 3) % MASKS.length](), [-68, y, 152]));
  }
  out.push(boxBounds([60, -160, 250], [90, 160, 300], "WoodDark", 2), boxBounds([56, -150, 256], [62, 150, 294], "Venezia_PaintBlue"), translate(scale(MASKS[1](), [1.6, 1.6, 1.6]), [54, 0, 276]));
  for (const s of [-1, 1]) out.push(cylinderBetween([-80, s * 150, 250], [-80, s * 150, 230], 1, 4, "IronDark"), translate(lantern(9, 22), [-80, s * 150, 190]));
  return merge(...out);
}
// A market stall of the Rialto, 3 m wide: a trestle table under a striped awning on poles, crates
// of oranges, lemons, aubergines and artichokes tilted to the front, baskets, a brass scale.
function marketStall(a = "Venezia_PaintRed", b = "Venezia_Canvas"): Geo {
  const out: Geo[] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) out.push(boxBounds([sx * 70 - 5, sy * 145 - 5, 0], [sx * 70 + 5, sy * 145 + 5, sx < 0 ? 210 : 250], "WoodWarm"));
  out.push(boxBounds([-80, -150, 74], [80, 150, 82], "WoodPale", 1.5));
  for (const sx of [-1, 1]) out.push(beamBetween([sx * 60, -140, 0], [sx * 60, 140, 74], 6, 6, "WoodShade"));
  const fruit: [string, number][] = [["Venezia_Orange", 8], ["Venezia_Lemon", 7], ["Venezia_Aubergine", 9], ["Venezia_Artichoke", 9], ["Venezia_Orange", 8]];
  fruit.forEach(([m, r], k) => {
    const y = -112 + k * 56, crate = merge(boxBounds([-30, -26, 0], [30, 26, 14], "WoodPale", 1));
    const heap: Geo[] = [crate];
    for (let i = 0; i < 9; i++) heap.push(m === "Venezia_Aubergine" ? translate(scale(sphereCenter(1, [0, 0, 0], m, 6), [r * 1.4, r * 0.8, r * 0.8]), [-18 + (i % 3) * 18, -14 + Math.floor(i / 3) * 14, 18]) : sphereCenter(r, [-18 + (i % 3) * 18, -14 + Math.floor(i / 3) * 14, 16 + (i % 2) * 3], m, 6));
    out.push(translate(rotateY(merge(...heap), -12), [-20, y, 82]));
  });
  out.push(translate(merge(cylinderAt({ rBot: 20, rTop: 26, height: 24, segments: 8, bottom: [0, 0, 0] }, "Venezia_Wicker"), ...[0, 1, 2, 3].map((i) => sphereCenter(8, [Math.cos(i * 1.6) * 10, Math.sin(i * 1.6) * 10, 24], "Venezia_Lemon", 6))), [-100, 120, 0]));
  out.push(translate(cylinderAt({ rBot: 18, rTop: 22, height: 30, segments: 8, bottom: [0, 0, 0] }, "Venezia_Wicker"), [-104, -110, 0]));
  out.push(translate(merge(cylinderAt({ radius: 3, height: 40, segments: 6, bottom: [0, 0, 0] }, "Bronze"), beamBetween([0, -22, 40], [0, 22, 40], 3, 3, "Bronze"), ...[-1, 1].map((s) => cylinderAt({ rBot: 4, rTop: 11, height: 4, segments: 8, bottom: [0, s * 22, 22] }, "Bronze"))), [40, 0, 82]));
  // the awning sloping to the front
  const F = clothAt([-110, -165, 196], [-110, 165, 196], [74, -165, 252], [74, 165, 252], [0, 0, 12], 0.4);
  const n = 8;
  for (let i = 0; i < n; i++) out.push(surf(F, i / n, (i + 1) / n, 0, 1, 1, 4, i % 2 ? a : b));
  for (let i = 0; i < n; i++) out.push(boxBounds([-112, -165 + (330 * i) / n, 178], [-108, -165 + (330 * (i + 1)) / n, 198], i % 2 ? a : b));
  return merge(...out);
}
// A spice merchant's stall from the eastern trade, 3 m wide: open sacks heaped with saffron,
// paprika, turmeric and pepper, bolts of silk on a rack, copper scale pans, a gold and crimson canopy.
function spiceStall(): Geo {
  const out: Geo[] = [];
  const spices = ["Venezia_Saffron", "Venezia_Paprika", "Venezia_Turmeric", "Venezia_Pepper", "Venezia_Paprika", "Venezia_Saffron"];
  spices.forEach((m, i) => {
    const x = -70 + (i % 2) * 52, y = -100 + Math.floor(i / 2) * 90;
    out.push(cylinderAt({ rBot: 24, rTop: 28, height: 48, segments: 8, bottom: [x, y, 0] }, "Venezia_Canvas"), translate(torus(27, 4, 10, 4, "Venezia_Canvas"), [x, y, 48]), cylinderAt({ rBot: 26, rTop: 3, height: 24, segments: 8, bottom: [x, y, 44] }, m));
  });
  // the silk rack
  out.push(boxBounds([56, -140, 0], [64, -132, 180], "WoodDark"), boxBounds([56, 132, 0], [64, 140, 180], "WoodDark"));
  ["Venezia_Silk", "FabricPurple", "FabricGold", "Venezia_PaintRed", "FabricNavy"].forEach((m, i) => out.push(cylinderBetween([60, -128, 40 + i * 28], [60, 128, 40 + i * 28], 13, 8, m)));
  out.push(translate(merge(cylinderAt({ radius: 3, height: 70, segments: 6, bottom: [0, 0, 0] }, "Bronze"), beamBetween([0, -28, 70], [0, 28, 70], 3, 3, "Bronze"), ...[-1, 1].map((s) => cylinderAt({ rBot: 5, rTop: 14, height: 5, segments: 8, bottom: [0, s * 28, 44] }, "CopperGreen"))), [-10, 130, 0]));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) out.push(boxBounds([sx * 90 - 5, sy * 150 - 5, 0], [sx * 90 + 5, sy * 150 + 5, 240], "WoodDark"));
  const F = clothAt([-120, -170, 220], [-120, 170, 220], [100, -170, 262], [100, 170, 262], [0, 0, -16], 0.4);
  for (let i = 0; i < 6; i++) out.push(surf(F, i / 6, (i + 1) / 6, 0, 1, 1, 4, i % 2 ? "FabricGold" : "Venezia_Velvet"));
  out.push(boxBounds([-124, -172, 196], [-118, 172, 222], "GoldTrim"));
  return merge(...out);
}
// A cast-iron street lamp (about 3.3 m): an Istrian block, a fluted post, a glass lantern.
function streetLamp(): Geo {
  return merge(
    boxBounds([-24, -24, 0], [24, 24, 16], IST, 2),
    rotateZ(cylinderAt({ rBot: 20, rTop: 13, height: 40, segments: 8, bottom: [0, 0, 16] }, "IronDark"), 22.5),
    cylinderAt({ rBot: 8, rTop: 6, height: 210, segments: 8, bottom: [0, 0, 56] }, "IronDark"),
    translate(torus(8, 2, 8, 4, "IronDark"), [0, 0, 130]),
    cylinderAt({ rBot: 6, rTop: 12, height: 18, segments: 8, bottom: [0, 0, 266] }, "IronDark"),
    translate(lantern(15, 36), [0, 0, 282]),
  );
}
// The tall candelabra of the riva (about 4.4 m): an Istrian pedestal, a cast-iron column, three
// lanterns on scrolled arms and one on top.
function rivaLamp(): Geo {
  const out: Geo[] = [
    boxBounds([-34, -34, 0], [34, 34, 80], IST, 3),
    boxBounds([-40, -40, 80], [40, 40, 92], IST, 2),
    rotateZ(cylinderAt({ rBot: 24, rTop: 16, height: 30, segments: 8, bottom: [0, 0, 92] }, "IronDark"), 22.5),
    cylinderAt({ rBot: 10, rTop: 8, height: 270, segments: 8, bottom: [0, 0, 122] }, "IronDark"),
    translate(torus(10, 2.5, 8, 4, "IronDark"), [0, 0, 200]),
    translate(lantern(15, 36), [0, 0, 392]),
  ];
  for (let i = 0; i < 3; i++) {
    const a = (i * 120 + 90) * D, ex = Math.cos(a) * 62, ey = Math.sin(a) * 62;
    out.push(tube([[0, 0, 360], [ex * 0.5, ey * 0.5, 376], [ex, ey, 366]], 2.5, "IronDark", 6, 4), translate(lantern(12, 28), [ex, ey, 318]), cylinderBetween([ex, ey, 366], [ex, ey, 360], 1.2, 4, "IronDark"));
  }
  return merge(...out);
}
// Café tables on the piazza: two marble tables on iron feet, wicker chairs round them, a cream
// parasol over each.
function cafeSet(): Geo {
  const out: Geo[] = [];
  for (const [tx, ty] of [[-60, -90], [60, 90]] as const) {
    out.push(cylinderAt({ radius: 34, height: 4, segments: 12, bottom: [tx, ty, 74] }, "Venezia_Marble"), cylinderAt({ radius: 3, height: 74, segments: 6, bottom: [tx, ty, 0] }, "IronDark"), cylinderAt({ rBot: 20, rTop: 4, height: 6, segments: 8, bottom: [tx, ty, 0] }, "IronDark"));
    out.push(cylinderAt({ radius: 3, height: 70, segments: 6, bottom: [tx, ty, 78] }, "WoodPale"), cylinderAt({ radius: 3.5, height: 200, segments: 6, bottom: [tx, ty, 78] }, "WoodPale"));
    out.push(lathe([[150, 0], [130, 14], [80, 34], [4, 50]], 8, "Venezia_Canvas", [tx, ty, 236]));
    for (let k = 0; k < 3; k++) {
      const a = (k * 120 + (tx > 0 ? 60 : 0)) * D, cx = tx + Math.cos(a) * 60, cy = ty + Math.sin(a) * 60;
      const chair = merge(
        boxBounds([-18, -18, 42], [18, 18, 48], "Venezia_Wicker", 1.5),
        ...[[-15, -15], [15, -15], [-15, 15], [15, 15]].map(([x, y]) => cylinderAt({ radius: 1.8, height: 42, segments: 4, bottom: [x, y, 0] }, "IronDark")),
        boxBounds([14, -18, 48], [19, 18, 90], "Venezia_Wicker", 1.5),
      );
      out.push(translate(rotateZ(chair, (Math.atan2(cy - ty, cx - tx) * 180) / Math.PI), [cx, cy, 0]));
    }
    out.push(cylinderAt({ radius: 4, height: 10, segments: 6, bottom: [tx + 10, ty, 78] }, "Venezia_PaintWhite"), cylinderAt({ radius: 5, height: 3, segments: 6, bottom: [tx - 12, ty + 6, 78] }, "Venezia_PaintWhite"));
  }
  return merge(...out);
}
// Goods off the ships, 2.4 x 2 m: crates, barrels, sacks, rolled carpets and amphorae.
function cargoBales(): Geo {
  const crate = (s: number, m = "WoodWarm") => merge(boxAt([s, s, s], [0, 0, 0], m, 1.5), boxBounds([-s / 2 - 1, -s / 2 - 1, s * 0.15], [s / 2 + 1, s / 2 + 1, s * 0.25], "WoodShade"), boxBounds([-s / 2 - 1, -s / 2 - 1, s * 0.75], [s / 2 + 1, s / 2 + 1, s * 0.85], "WoodShade"));
  const barrel = (h = 86, r = 30) => merge(lathe([[r * 0.84, 0], [r, h * 0.5], [r * 0.84, h]], 10, "WoodWarm"), ...[0.12, 0.3, 0.7, 0.88].map((t) => translate(torus(r * (0.86 + 0.14 * Math.sin(Math.PI * t)) + 0.6, 1.8, 10, 4, "IronDark"), [0, 0, h * t])));
  const sack = (m = "Venezia_Canvas") => merge(translate(scale(sphereCenter(1, [0, 0, 0], m, 8), [36, 26, 22]), [0, 0, 20]), cylinderAt({ rBot: 9, rTop: 6, height: 10, segments: 6, bottom: [0, 0, 36] }, m));
  const amphora = () => lathe([[2, 0], [16, 14], [24, 40], [20, 64], [8, 78], [9, 90]], 8, "Venezia_Clay");
  return merge(
    translate(crate(70), [-70, -60, 0]), translate(crate(64, "WoodPale"), [10, -60, 0]), translate(crate(56), [-40, -60, 70]),
    translate(barrel(), [80, -50, 0]), translate(barrel(80, 28), [80, 20, 0]),
    translate(sack(), [-80, 40, 0]), translate(rotateZ(sack(), 40), [-20, 50, 0]), translate(rotateZ(sack(), 100), [-50, 60, 36]),
    cylinderBetween([-110, 100, 16], [60, 100, 16], 16, 10, "FabricRed"), cylinderBetween([-110, 100, 46], [60, 100, 46], 15, 10, "FabricNavy"),
    translate(amphora(), [100, 90, 0]), translate(rotateY(amphora(), 80), [10, 0, 14]),
  );
}
// The smith's forge in the open by his workshop, 2.6 x 1.6 m: a brick hearth of glowing coals
// under a hood and flue, the bellows, an anvil on its block, a quench tub and a rack of blades.
function anvilForge(): Geo {
  const out: Geo[] = [
    wuv(boxBounds([20, -120, 0], [90, 0, 86], "Venezia_Brick")),
    boxBounds([16, -116, 86], [94, -4, 92], IST),
    rock([60, 90, 12], 0.4, 9, "FireGlow", true).map((p) => ({ ...p, geo: p.geo.clone().translate(55, -60, 90) })),
    hullGeo([[0, -130, 200], [100, -130, 200], [0, 10, 200], [100, 10, 200], [30, -80, 280], [80, -80, 280], [30, -40, 280], [80, -40, 280]], "Venezia_BrickOld"),
    boxBounds([36, -78, 280], [76, -42, 420], "Venezia_BrickOld"),
  ];
  for (const [x, y] of [[4, -126], [96, -126], [4, 6], [96, 6]]) out.push(boxBounds([x - 4, y - 4, 92], [x + 4, y + 4, 202], "IronDark"));
  // bellows
  out.push(translate(rotateZ(merge(hullGeo([[0, -20, 0], [0, 20, 0], [70, -26, 6], [70, 26, 6], [0, -20, 14], [0, 20, 14], [70, -26, 28], [70, 26, 28]], "WoodShade"), cylinderBetween([0, 0, 8], [-20, 0, 6], 4, 6, "Bronze")), 0), [120, -60, 60]));
  // the anvil
  out.push(cylinderAt({ radius: 26, height: 50, segments: 8, bottom: [-50, 50, 0] }, "BarkWarm"), boxBounds([-70, 38, 50], [-30, 62, 64], "IronDark"), boxBounds([-82, 42, 64], [-18, 58, 78], "IronDark", 1.5), cylinderAt({ rBot: 8, rTop: 1, height: 26, segments: 6, bottom: [0, 0, 0] }, "IronDark").map((p) => ({ ...p, geo: p.geo.clone().rotateY(-Math.PI / 2).translate(-82, 50, 71) })));
  out.push(boxBounds([-60, 46, 78], [-20, 50, 80], "IronLight"));
  // the quench tub
  out.push(cylinderAt({ rBot: 26, rTop: 30, height: 46, segments: 10, bottom: [-30, -60, 0] }, "WoodShade"), cylinderAt({ radius: 27, height: 2, segments: 10, bottom: [-30, -60, 40] }, "Venezia_Water"), translate(torus(29, 2, 10, 4, "IronDark"), [-30, -60, 30]));
  // the rack of blades
  out.push(boxBounds([60, 60, 0], [70, 130, 120], "WoodDark"), boxBounds([56, 60, 100], [74, 130, 108], "WoodDark"));
  for (let i = 0; i < 4; i++) out.push(boxBounds([54, 68 + i * 16, 20], [56, 72 + i * 16, 120], "IronLight"), boxBounds([52, 64 + i * 16, 100], [58, 76 + i * 16, 104], "Bronze"));
  return merge(...out);
}
// A tile of the piazza's paving, 8 m square and 3 cm thick: grey trachyte laid with white Istrian
// bands round the edge and in a lozenge between their middles.
function piazzaTile(): Geo {
  const out: Geo[] = [boxBounds([-400, -400, 0], [400, 400, 2.5], "Venezia_Trachyte")];
  for (const s of [-1, 1]) out.push(boxBounds([s * 380 - 12, -380, 2.5], [s * 380 + 12, 380, 3.6], IST), boxBounds([-380, s * 380 - 12, 2.5], [380, s * 380 + 12, 3.6], IST));
  for (const [a, b] of [[[-380, 0], [0, -380]], [[0, -380], [380, 0]], [[380, 0], [0, 380]], [[0, 380], [-380, 0]]] as [number, number][][]) out.push(beamBetween([a[0], a[1], 3.05], [b[0], b[1], 3.05], 18, 1.1, IST));
  out.push(cylinderAt({ radius: 46, height: 1.1, segments: 12, bottom: [0, 0, 2.5] }, IST), cylinderAt({ radius: 34, height: 1.2, segments: 12, bottom: [0, 0, 2.6] }, "Venezia_Trachyte"));
  return merge(...out);
}

// =====================================================================================
// the land side: wall, towers, gate
// =====================================================================================

// A swallowtail merlon (the Ghibelline crenel of the Arsenale) on a -X face, its foot at z = 0.
function merlonSwallow(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-34, 0);
  s.lineTo(34, 0);
  s.lineTo(34, 104);
  s.lineTo(0, 70);
  s.lineTo(-34, 104);
  s.lineTo(-34, 0);
  return s;
}
// The little hanging arches under a brick parapet (a Lombard band), `n` of them over ±half.
function corbelBand(half: number, n: number, z: number): Geo {
  const out: Geo[] = [boxBounds([-16, -half, z], [0, half, z + 14], IST)];
  const w = (2 * half) / n;
  for (let i = 0; i < n; i++) out.push(translate(panel(frameShape(w / 2 - 8, 0, "round", 7, -26), -8, 8, "Venezia_BrickOld", { seg: 5 }), [0, -half + w * (i + 0.5), z - w / 2 + 4]));
  return merge(...out);
}
// A length of the land wall, 8 m along Y (tiles end to end), its outside to -X: a brick curtain
// 6.5 m high on an Istrian footing, arrow slits, a band of little arches under the parapet of
// swallowtail merlons, the wall-walk behind.
function cityWall(): Geo {
  const L = 400, T = 80, H = 650, out: Geo[] = [
    boxBounds([-T - 14, -L, 0], [T + 6, L, 60], IST, 2),
    wuv(boxBounds([-T, -L, 60], [T, L, H], "Venezia_Brick")),
    boxBounds([-T, -L, H], [T, L, H + 10], IST),
    translate(corbelBand(L, 10, H - 50), [-T, 0, 0]),
  ];
  for (let i = 0; i < 8; i++) out.push(translate(panel(merlonSwallow(), -T, 34, "Venezia_Brick"), [0, -L + 50 + i * 100, H + 10]));
  out.push(boxBounds([T - 30, -L, H + 10], [T, L, H + 70], "Venezia_Brick"));
  for (const y of [-200, 200]) out.push(onFace(merge(panel(rectShape(-14, 14, -8, 108), -4, 6, IST), panel(rectShape(-5, 5, 0, 100), -1, 2, "Venezia_Dark")), "-x", T, y, 280));
  return merge(...out);
}
// A square brick tower of the land wall (6.4 m, 11 m high): an Istrian footing, slits on every
// face, a stone band, little arches under a crown of swallowtail merlons, a flag of the lion.
function wallTower(): Geo {
  const H = 320, Z = 1100, out: Geo[] = [
    boxBounds([-H - 16, -H - 16, 0], [H + 16, H + 16, 70], IST, 3),
    wuv(boxBounds([-H, -H, 70], [H, H, Z], "Venezia_Brick")),
    boxBounds([-H - 8, -H - 8, 620], [H + 8, H + 8, 640], IST, 2),
    boxBounds([-H - 30, -H - 30, Z], [H + 30, H + 30, Z + 14], IST, 2),
  ];
  for (const f of ["-x", "+x", "-y", "+y"] as Face[]) {
    const g: Geo[] = [corbelBand(H, 7, Z - 60)];
    for (let i = 0; i < 6; i++) g.push(translate(panel(merlonSwallow(), -30, 30, "Venezia_Brick"), [0, -H + 30 + i * ((2 * H - 60) / 5), Z + 14]));
    for (const z of [300, 760]) g.push(merge(panel(rectShape(-16, 16, z - 10, z + 120), -4, 6, IST), panel(rectShape(-6, 6, z, z + 110), -1, 2, "Venezia_Dark")));
    out.push(onFace(merge(...g), f, H, 0, 0));
  }
  out.push(boxBounds([-H + 30, -H + 30, Z], [H - 30, H - 30, Z + 6], "Venezia_Trachyte"));
  out.push(cylinderAt({ radius: 5, height: 420, segments: 6, bottom: [0, 0, Z] }, "WoodDark"), sheet([0, 4, Z + 280], [0, 180, Z + 270], [0, 4, Z + 410], [0, 190, Z + 400], [18, 0, -6], "Venezia_PaintRed", 5, 3));
  return merge(...out);
}
// The land gate (the way out to the fields), 17 m across: an open passage along X between two
// crenellated brick towers, its outer face (-X) a triumphal arch of Istrian stone: paired granite
// columns either side of the round arch, an entablature, an attic with the winged lion and a
// pediment with a saint; the gate leaves standing open against the passage walls inside.
function cityGate(): Geo {
  const PW = 250, TY = 560, TH = 300, out: Geo[] = [];
  // the towers stand back from the front, flush with its face, the passage running on between them
  for (const s of [-1, 1]) out.push(translate(scale(wallTower(), [1, TH / 320, 1.1]), [170, s * TY, 0]));
  // the wall over the passage
  out.push(panel(arcadeShape(-(TY - TH), TY - TH, 0, 820, [[0, 210, 400, "round"]]), -150, 300, "Venezia_Brick"));
  out.push(vault(300, 210, 400, 90, 12, "Venezia_BrickOld", 12));
  out.push(boxBounds([-150, -TY + TH, 820], [150, TY - TH, 830], IST));
  for (let i = 0; i < 4; i++) out.push(translate(panel(merlonSwallow(), -150, 30, "Venezia_Brick"), [0, -170 + i * 113, 830]));
  out.push(onFace(arcStones([0, 0, 400], 210, 0, 180, 13, 34, 10, IST), "+x", 150, 0, 0));
  // the triumphal front
  const front: Geo[] = [
    arcStones([0, 0, 400], 210, 0, 180, 13, 40, 14, IST),
    panel(frameShape(210, 400, "round", 70, 0), -4, 16, IST),
    boxBounds([-40, -420, 700], [6, 420, 780], IST, 3),
    boxBounds([-48, -440, 780], [6, 440, 800], IST, 2),
    boxBounds([-30, -300, 800], [6, 300, 960], IST, 2),
    panel(rectShape(-220, 220, 830, 935), -38, 8, "Venezia_MosaicBlue"),
    translate(scale(lion("GoldTrim", "GoldTrim"), [0.48, 0.48, 0.48]), [-46, 0, 836]),
  ];
  const ped = new THREE.Shape();
  ped.moveTo(-320, 960);
  ped.lineTo(320, 960);
  ped.lineTo(0, 1090);
  ped.lineTo(-320, 960);
  front.push(panel(ped, -30, 30, IST), translate(figure(150, IST), [-14, 0, 1060]));
  for (const s of [-1, 1]) {
    for (const k of [0, 1]) {
      const y = s * (300 + k * 80);
      front.push(boxBounds([-60, y - 34, 0], [6, y + 34, 160], IST, 3), cylinderAt({ rBot: 26, rTop: 22, height: 520, segments: 10, bottom: [-28, y, 160] }, "Venezia_Granite"), boxBounds([-62, y - 36, 680], [6, y + 36, 700], IST, 2));
    }
    front.push(translate(figure(120, IST), [-20, s * 300, 800]), sphereCenter(22, [-20, s * 420, 830], IST, 8));
  }
  out.push(onFace(merge(...front), "-x", 150, 0, 0));
  // the open leaves inside
  for (const s of [-1, 1]) out.push(boxBounds([120, s * 206 - 4, 0], [330, s * 206 + 4, 380], "DoorWood"), boxBounds([130, s * 202 - 4, 60], [320, s * 202, 70], "IronDark"), boxBounds([130, s * 202 - 4, 300], [320, s * 202, 310], "IronDark"));
  out.push(boxBounds([-170, -PW, 0], [500, PW, 4], "Venezia_Trachyte"));
  return merge(...out);
}

// =====================================================================================
// the sample: the molo, where the harbour meets the piazza
// =====================================================================================
function sample(put: Put): void {
  // the waterfront along the sea (-Y): fondamenta, steps, the great pier with the galleon
  for (let x = -2000; x <= 2000; x += 400) if (x !== 1200) put("fondamenta", [x, -2170, 0], 90);
  put("fondamenta_steps", [1200, -2170, 0], 90);
  for (let i = 0; i < 5; i++) put("harbour_pier", [-1100, -2400 - 400 * i, 0]);
  put("galleon", [-300, -3300, -12], 90);
  put("gondola", [500, -2600, -12], 8);
  put("gondola", [1700, -2700, -12], 172);
  put("gondola_station", [1200, -2560, -12], 90);
  for (const [x, y] of [[300, -2330], [800, -2330], [2000, -2400]]) put("mooring_poles", [x, y, 0], x);
  put("mooring_pole", [-1700, -2600, 0]);
  put("mooring_pole", [-1500, -2700, 0]);
  for (const [x, y] of [[-1360, -2600], [-1360, -3400], [-840, -3000]]) put("riva_lamp", [x, y, 4]);
  put("cargo_bales", [-1150, -2650, 4], 90);
  put("cargo_bales", [-1050, -3500, 4], 180);
  // the molo: paving, the lion column, the lamps along the water
  for (let x = -2000; x <= 2000; x += 800) for (const y of [-1800, -1000, -200]) put("piazza_tile", [x, y, 0]);
  put("lion_column", [-200, -1650, 0], 90);
  for (const x of [-1800, 400, 1800]) put("riva_lamp", [x, -1980, 0]);
  // the piazza beyond: the basilica, the campanile, flagpoles, the arcades, palazzi
  put("basilica", [-900, 1350, 0], 90);
  put("campanile", [1000, 950, 0], 0);
  for (const x of [-1500, -900, -300]) put("flagpole", [x, -100, 0]);
  put("procuratie", [1900, -300, 0], 180);
  put("procuratie", [1900, -1100, 0], 180);
  put("palazzo", [1800, 1900, 0], 90);
  put("canal_house", [2050, 600, 0], 180);
  put("shop_house", [-2150, -1350, 0], 0);
  put("canal_house_narrow", [-2150, -650, 0], 0);
  put("well_head", [600, -700, 0]);
  // the market under the arcades, the mask shop, the café
  put("market_stall", [1200, -1450, 0], 180);
  put("spice_stall", [1200, -800, 0], 180);
  put("mask_stall", [-1500, -900, 0], 0);
  put("cafe_set", [700, 150, 0], 20);
  put("anvil_forge", [-1500, -1700, 0], 0);
  for (const [x, y] of [[-2000, 200], [200, -1300], [1500, 300], [-600, -1200]]) put("street_lamp", [x, y, 0]);
  for (const [k, x, y, h, s] of [["Pine", 2200, 1100, 0, 0.8], ["RoundTree", -2200, 600, 40, 0.75], ["Cherry", 1500, 1300, 90, 0.7], ["Bush", 1600, -500, 0, 1.1]] as const) put(`flora:${k}`, [x, y, 0], h, s);
}

export const KIT: Kit = {
  id: "venezia",
  name: "เวนิชเซีย",
  region: "เมืองท่าบนลากูน ชายฝั่งตะวันตกเฉียงใต้",
  desc: "เมืองแห่งสายน้ำบนลากูน คลองแทนถนน ตึกปาลาซโซสีพาสเทลหน้าต่างโค้งแหลมแบบโกธิกขอบหินขาว ระเบียงและปล่องไฟทรงกรวย มหาวิหารห้าโดม หอระฆังอิฐ สะพานริอัลโต กอนโดลา เสาผูกเรือลายเกลียว และท่าเรือใหญ่ที่ส่งเรือสินค้าไปทุกเมืองท่า",
  ground: "grass",
  sea: true,
  items: [
    { id: "palazzo", name: "ปาลาซโซสีชมพู (3 ชั้น)", make: () => palazzo(), tags: ["building"] },
    { id: "palazzo_grand", name: "ปาลาซโซใหญ่ริมคลอง (4 ชั้น)", make: () => palazzoGrand(), tags: ["building", "landmark"] },
    { id: "canal_house", name: "บ้านริมคลอง", make: () => canalHouse(), tags: ["building"] },
    { id: "canal_house_narrow", name: "บ้านแคบมีระเบียงดาดฟ้า", make: () => canalHouseNarrow(), tags: ["building"] },
    { id: "shop_house", name: "ตึกร้านค้าชั้นล่าง", make: () => shopHouse(), tags: ["building", "market"] },
    { id: "procuratie", name: "ตึกระเบียงโค้งรอบจัตุรัส (8 ม.)", make: procuratie, tags: ["building", "wall"] },
    { id: "fondaco", name: "ทำเนียบดอจ (ตึกระเบียงโกธิก)", make: () => fondaco(), tags: ["building", "landmark"] },
    { id: "basilica", name: "มหาวิหารห้าโดม", make: basilica, tags: ["landmark", "building"] },
    { id: "campanile", name: "หอระฆังอิฐ", make: campanile, tags: ["landmark", "tower"] },
    { id: "rialto_bridge", name: "สะพานหลังคาริอัลโต (คลองใหญ่ 16 ม.)", make: rialto, tags: ["landmark", "bridge"] },
    { id: "bridge", name: "สะพานหินโค้ง (คลอง 8 ม.)", make: bridge, tags: ["bridge"] },
    { id: "bridge_wooden", name: "สะพานไม้โค้ง (คลองใหญ่ 16 ม.)", make: bridgeWooden, tags: ["bridge"] },
    { id: "fondamenta", name: "ขอบคลองหิน (4 ม.)", make: fondamenta, tags: ["dock", "wall"] },
    { id: "fondamenta_steps", name: "บันไดลงคลอง (4 ม.)", make: fondamentaSteps, tags: ["dock"] },
    { id: "mooring_poles", name: "เสาผูกเรือลายเกลียว (กลุ่ม)", make: mooringPoles, tags: ["dock", "decor"] },
    { id: "mooring_pole", name: "เสาผูกเรือลายเกลียว", make: () => palina(280, "Venezia_PaintRed"), tags: ["dock", "decor"] },
    { id: "gondola", name: "เรือกอนโดลา", make: gondola, tags: ["boat"] },
    { id: "gondola_station", name: "ท่าเรือกอนโดลา", make: gondolaStation, tags: ["dock", "boat"] },
    { id: "harbour_pier", name: "ท่าเทียบเรือหินใหญ่ (4 ม.)", make: harbourPier, tags: ["dock"] },
    { id: "galleon", name: "เรือกำปั่นสินค้า", make: galleon, tags: ["boat", "landmark"] },
    { id: "lion_column", name: "เสาสิงโตมีปีก", make: lionColumn, tags: ["landmark", "decor"] },
    { id: "flagpole", name: "เสาธงสำริด", make: flagpole, tags: ["decor"] },
    { id: "well_head", name: "ปากบ่อน้ำหินสลัก", make: wellHead, tags: ["decor"] },
    { id: "mask_stall", name: "แผงหน้ากาก", make: maskStall, tags: ["market"] },
    { id: "market_stall", name: "แผงผักผลไม้", make: () => marketStall(), tags: ["market"] },
    { id: "spice_stall", name: "แผงเครื่องเทศและผ้าไหม", make: spiceStall, tags: ["market"] },
    { id: "street_lamp", name: "โคมไฟถนนเหล็กหล่อ", make: streetLamp, tags: ["light"] },
    { id: "riva_lamp", name: "เสาโคมสามดวงริมท่า", make: rivaLamp, tags: ["light", "dock"] },
    { id: "cafe_set", name: "โต๊ะคาเฟ่ริมจัตุรัส", make: cafeSet, tags: ["decor", "market"] },
    { id: "cargo_bales", name: "กองสินค้าจากเรือ", make: cargoBales, tags: ["market", "decor"] },
    { id: "anvil_forge", name: "เตาตีเหล็กกลางแจ้ง", make: anvilForge, tags: ["market", "decor"] },
    { id: "piazza_tile", name: "พื้นจัตุรัสลายหินขาว (8 ม.)", make: piazzaTile, tags: ["ground"] },
    { id: "city_wall", name: "กำแพงอิฐใบเสมาหางนกนางแอ่น (8 ม.)", make: cityWall, tags: ["wall", "defence"] },
    { id: "wall_tower", name: "หอคอยกำแพงอิฐ", make: wallTower, tags: ["tower", "defence"] },
    { id: "city_gate", name: "ประตูเมืองซุ้มประตูชัย", make: cityGate, tags: ["gate", "defence", "landmark"] },
  ],
  sample,
};

// The courtyard: walkable bounds and solid footprints. Footprints are taken from the Oriverse
// world (oriverse/frieren/courtyard.weave in the-hero-fighter), in sim centimetres.

import { mapX, mapY } from "./projection.js";

export const SPAWN = { x: 1000, y: 250 };
export const BOUNDS = { minX: 60, maxX: 2650, minY: -760, maxY: 2050 };

// box: centre, w along local X, d along local Y, rot = degrees about Z (counter-clockwise).
// circle: centre, r.
export const SOLIDS = [
  { kind: "house", x: 1910, y: 1440, w: 810, d: 910, rot: 0 },
  { kind: "well", x: 1100, y: 820, w: 190, d: 190, rot: 8 },
  { kind: "box", x: 792, y: 771, w: 156, d: 116, rot: -10 },   // cart
  { kind: "box", x: 1864, y: 178, w: 50, d: 170, rot: 24 },    // bench
  { kind: "box", x: 2051, y: -22, w: 50, d: 170, rot: 20 },    // bench
  { kind: "box", x: 1070, y: -470, w: 56, d: 56, rot: 8 },     // crates
  { kind: "box", x: 1100, y: -540, w: 56, d: 56, rot: -12 },
  { kind: "box", x: 1642, y: 965, w: 56, d: 56, rot: 0 },
  { kind: "box", x: 1735, y: 950, w: 56, d: 56, rot: 15 },
  { kind: "box", x: 854, y: -689, w: 150, d: 14, rot: 48 },    // fence
  { kind: "post", x: 978, y: -416, r: 12 },
  { kind: "tree", x: 1000, y: -600, r: 50 },
  { kind: "tree", x: 960, y: 1020, r: 35 },
  { kind: "tree", x: 2380, y: 120, r: 45 },
  { kind: "hedge", x: 2050, y: 680, r: 110 },
  { kind: "hedge", x: 1960, y: 440, r: 110 },
  { kind: "hedge", x: 2120, y: 240, r: 110 },
  { kind: "bush", x: 919, y: -570, r: 45 },
  { kind: "bush", x: 968, y: -684, r: 45 },
  { kind: "bush", x: 422, y: 265, r: 45 },
  { kind: "bush", x: 488, y: -75, r: 45 },
  { kind: "bush", x: 433, y: -195, r: 45 },
  { kind: "bush", x: 668, y: 806, r: 45 },
  { kind: "rock", x: 948, y: -452, r: 25 },
  { kind: "rock", x: 427, y: 56, r: 25 },
  { kind: "rock", x: 612, y: 731, r: 25 },
];

for (const s of SOLIDS) {
  if (s.r === undefined) {
    const a = (s.rot * Math.PI) / 180;
    s.cos = Math.cos(a);
    s.sin = Math.sin(a);
  }
}

// Push a circle of radius r at p = {x, y} out of every solid and back inside the bounds.
// Resolving overlaps (rather than rejecting the move) lets the player slide along walls.
export function resolve(p, r) {
  for (let pass = 0; pass < 3; pass++) {
    for (const s of SOLIDS) {
      if (s.r !== undefined) {
        const dx = p.x - s.x, dy = p.y - s.y;
        const min = s.r + r, d2 = dx * dx + dy * dy;
        if (d2 < min * min) {
          const d = Math.sqrt(d2) || 1e-6;
          p.x = s.x + (dx / d) * min;
          p.y = s.y + (dy / d) * min;
        }
        continue;
      }
      // into the box's frame
      const rx = p.x - s.x, ry = p.y - s.y;
      const lx = rx * s.cos + ry * s.sin, ly = -rx * s.sin + ry * s.cos;
      const hw = s.w / 2, hd = s.d / 2;
      const cx = Math.max(-hw, Math.min(hw, lx)), cy = Math.max(-hd, Math.min(hd, ly));
      let nx = lx - cx, ny = ly - cy;
      const d2 = nx * nx + ny * ny;
      if (d2 >= r * r) continue;
      let ox, oy;
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2);
        ox = cx + (nx / d) * r;
        oy = cy + (ny / d) * r;
      } else {
        // centre is inside the box: leave by the nearest face
        const px = hw - Math.abs(lx), py = hd - Math.abs(ly);
        if (px < py) { ox = Math.sign(lx || 1) * (hw + r); oy = ly; }
        else { ox = lx; oy = Math.sign(ly || 1) * (hd + r); }
      }
      p.x = s.x + ox * s.cos - oy * s.sin;
      p.y = s.y + ox * s.sin + oy * s.cos;
    }
  }
  p.x = Math.max(BOUNDS.minX + r, Math.min(BOUNDS.maxX - r, p.x));
  p.y = Math.max(BOUNDS.minY + r, Math.min(BOUNDS.maxY - r, p.y));
}

function boxCorners(s, z) {
  const hw = s.w / 2, hd = s.d / 2;
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, ly]) => [
    s.x + lx * s.cos - ly * s.sin,
    s.y + lx * s.sin + ly * s.cos,
    z,
  ]);
}

// Collision outlines for the `?debug` overlay, in map pixels.
export function debugShapes() {
  return SOLIDS.map((s) =>
    s.r !== undefined
      ? { circle: [mapX(s.x, s.y), mapY(s.x, s.y), s.r] }
      : { poly: boxCorners(s, 0).map(([x, y]) => [mapX(x, y), mapY(x, y)]) },
  );
}

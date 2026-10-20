// The courtyard: walkable bounds, solid footprints and the map picture under everything.
// Footprints are taken from the Oriverse world (oriverse/frieren/courtyard.weave in
// the-hero-fighter), in sim centimetres.

import { MAP_W, MAP_H, S2, mapX, mapY } from "./projection.js";

export const SPAWN = { x: 1000, y: 250 };
export const BOUNDS = { minX: 60, maxX: 2650, minY: -900, maxY: 2050 };

// box: centre, w along local X, d along local Y, rot = degrees about Z (counter-clockwise),
// h = height (only used by the stand-in map). circle: centre, r, h.
export const SOLIDS = [
  { kind: "house", x: 1910, y: 1440, w: 810, d: 910, rot: 0, h: 260 },
  { kind: "gazebo", x: 1100, y: 820, w: 190, d: 190, rot: 0, h: 230 },
  { kind: "box", x: 792, y: 771, w: 156, d: 116, rot: -10, h: 95, color: "#8a6142" },   // cart
  { kind: "box", x: 1864, y: 178, w: 50, d: 170, rot: 24, h: 45, color: "#8f6a46" },    // bench
  { kind: "box", x: 2051, y: -22, w: 50, d: 170, rot: 20, h: 45, color: "#8f6a46" },    // bench
  { kind: "box", x: 1070, y: -470, w: 56, d: 56, rot: 8, h: 56, color: "#a9794b" },     // crates
  { kind: "box", x: 1100, y: -540, w: 56, d: 56, rot: -12, h: 56, color: "#a9794b" },
  { kind: "box", x: 1642, y: 965, w: 56, d: 56, rot: 5, h: 56, color: "#a9794b" },
  { kind: "box", x: 1735, y: 950, w: 56, d: 56, rot: -6, h: 56, color: "#a9794b" },
  { kind: "box", x: 854, y: -689, w: 150, d: 14, rot: 48, h: 90, color: "#7b5a3c" },    // fence
  { kind: "post", x: 978, y: -416, r: 12, h: 120 },
  { kind: "tree", x: 1000, y: -600, r: 50, h: 520, crown: 1.15 },
  { kind: "tree", x: 960, y: 1020, r: 35, h: 430, crown: 0.85 },
  { kind: "tree", x: 2380, y: 120, r: 45, h: 480, crown: 1.0 },
  { kind: "hedge", x: 2050, y: 680, r: 110, h: 120 },
  { kind: "hedge", x: 1960, y: 440, r: 110, h: 120 },
  { kind: "hedge", x: 2120, y: 240, r: 110, h: 120 },
  { kind: "bush", x: 919, y: -570, r: 45, h: 70 },
  { kind: "bush", x: 968, y: -684, r: 45, h: 70 },
  { kind: "bush", x: 422, y: 265, r: 45, h: 70 },
  { kind: "bush", x: 488, y: -75, r: 45, h: 70 },
  { kind: "bush", x: 433, y: -195, r: 45, h: 70 },
  { kind: "bush", x: 668, y: 806, r: 45, h: 70 },
  { kind: "rock", x: 948, y: -452, r: 25, h: 24 },
  { kind: "rock", x: 427, y: 56, r: 25, h: 24 },
  { kind: "rock", x: 612, y: 731, r: 25, h: 24 },
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
      ? { circle: [mapX(s.y), mapY(s.x), s.r] }
      : { poly: boxCorners(s, 0).map(([x, y]) => [mapX(y), mapY(x)]) },
  );
}

// ---------------------------------------------------------------------------------------
// Stand-in map. Used only while assets/map.jpg (the stitched Oriverse capture) is missing,
// so the game stays playable; it is painted from the same footprints the collision uses.

const STANDIN_SCALE = 0.5; // canvas pixels per map pixel

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function poly(g, pts, fill) {
  g.beginPath();
  pts.forEach(([x, y, z], i) => (i ? g.lineTo(mapX(y), mapY(x, z)) : g.moveTo(mapX(y), mapY(x, z))));
  g.closePath();
  g.fillStyle = fill;
  g.fill();
}

function ball(g, x, y, z, r, color) {
  const cx = mapX(y), cy = mapY(x, z);
  const grad = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  grad.addColorStop(0, shade(color, 1.25));
  grad.addColorStop(1, shade(color, 0.72));
  g.fillStyle = grad;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
}

function groundShadow(g, x, y, rx) {
  g.fillStyle = "rgba(18, 34, 10, 0.28)";
  g.beginPath();
  g.ellipse(mapX(y) - rx * 0.25, mapY(x) + 4, rx, rx * S2, 0, 0, Math.PI * 2);
  g.fill();
}

// Box with the faces a camera looking along +X can see: sides whose normal points at -X, then the top.
function block(g, s, z0, z1, color) {
  const lo = boxCorners(s, z0), hi = boxCorners(s, z1);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const nx = hi[j][1] - hi[i][1]; // outward normal x of edge i (corners run counter-clockwise)
    if (nx < -1e-6) poly(g, [lo[i], lo[j], hi[j], hi[i]], shade(color, 0.72));
  }
  poly(g, hi, color);
}

function tree(g, x, y, crown, rand) {
  g.fillStyle = "#5d4129";
  const tx = mapX(y), base = mapY(x);
  g.fillRect(tx - 16, mapY(x, 300), 32, base - mapY(x, 300));
  const blobs = [[0, 0, 400, 150], [-60, 70, 340, 110], [50, -80, 350, 115], [70, 60, 450, 105], [-40, -60, 480, 100], [0, 0, 520, 95]];
  for (const [dx, dy, z, r] of blobs) {
    ball(g, x + dx * crown, y + dy * crown, z * Math.min(1, 0.8 + crown * 0.2), r * crown, rand() < 0.5 ? "#4b7a2c" : "#56873a");
  }
}

function house(g, s) {
  const x0 = s.x - s.w / 2, x1 = s.x + s.w / 2, y0 = s.y - s.d / 2, y1 = s.y + s.d / 2;
  const eave = s.h, ridge = s.h + 260, o = 40;
  block(g, s, 0, eave, "#efe3c8");
  // front wall details: timber frame, door, windows
  const wall = (y, z, w, h, c) => poly(g, [[x0 - 1, y - w / 2, z], [x0 - 1, y + w / 2, z], [x0 - 1, y + w / 2, z + h], [x0 - 1, y - w / 2, z + h]], c);
  wall(s.y, 0, s.d, 14, "#6b4a32");
  wall(s.y, eave - 14, s.d, 14, "#6b4a32");
  for (const yy of [y0 + 7, s.y - 230, s.y + 230, y1 - 7]) wall(yy, 0, 14, eave, "#6b4a32");
  wall(s.y, 0, 130, 205, "#5a3a24");
  wall(s.y, 0, 106, 192, "#7d5434");
  for (const yy of [s.y - 340, s.y + 340]) { wall(yy, 110, 110, 90, "#6b4a32"); wall(yy, 116, 96, 78, "#9cc6d8"); }
  // gable end and roof, ridge running along X
  poly(g, [[x0, y0, eave], [x0, y1, eave], [x0, s.y, ridge]], "#e4d4b2");
  poly(g, [[x0 - o, y0 - o, eave - 20], [x1 + o, y0 - o, eave - 20], [x1 + o, s.y, ridge], [x0 - o, s.y, ridge]], "#a95a43");
  poly(g, [[x0 - o, y1 + o, eave - 20], [x1 + o, y1 + o, eave - 20], [x1 + o, s.y, ridge], [x0 - o, s.y, ridge]], "#8c4734");
  poly(g, [[x0 - o, s.y - 10, ridge], [x1 + o, s.y - 10, ridge], [x1 + o, s.y + 10, ridge], [x0 - o, s.y + 10, ridge]], "#6e3627");
}

function gazebo(g, s) {
  const r = s.w / 2 - 10;
  for (const [dx, dy] of [[r, r], [r, -r], [-r, r], [-r, -r]].sort((a, b) => b[0] - a[0])) {
    block(g, { x: s.x + dx, y: s.y + dy, w: 16, d: 16, cos: 1, sin: 0 }, 0, s.h, "#e8e1d2");
  }
  const R = s.w / 2 + 25, apex = [s.x, s.y, s.h + 210];
  const c = [[s.x + R, s.y - R], [s.x + R, s.y + R], [s.x - R, s.y + R], [s.x - R, s.y - R]].map(([x, y]) => [x, y, s.h]);
  poly(g, [c[0], c[1], apex], "#4f7f8c");
  poly(g, [c[1], c[2], apex], "#5f93a0");
  poly(g, [c[3], c[0], apex], "#456f7a");
  poly(g, [c[2], c[3], apex], "#6aa2ae");
}

export function paintStandIn() {
  const canvas = document.createElement("canvas");
  canvas.width = MAP_W * STANDIN_SCALE;
  canvas.height = MAP_H * STANDIN_SCALE;
  const g = canvas.getContext("2d");
  g.scale(STANDIN_SCALE, STANDIN_SCALE);
  const rand = rng(7);

  const sky = g.createLinearGradient(0, 0, 0, MAP_H);
  sky.addColorStop(0, "#8db462");
  sky.addColorStop(1, "#4f7c31");
  g.fillStyle = sky;
  g.fillRect(0, 0, MAP_W, MAP_H);

  for (let i = 0; i < 900; i++) {
    const r = 40 + rand() * 140;
    g.fillStyle = rand() < 0.5 ? "rgba(255, 250, 190, 0.03)" : "rgba(20, 52, 12, 0.045)";
    g.beginPath();
    g.ellipse(rand() * MAP_W, rand() * MAP_H, r, r * S2, 0, 0, Math.PI * 2);
    g.fill();
  }
  // dirt path from the west edge past the spawn point to the house door
  g.lineCap = "round";
  g.lineJoin = "round";
  const path = [[-300, 250], [500, 320], [1000, 420], [1300, 900], [1500, 1380]];
  for (const [w, c] of [[190, "rgba(150, 120, 70, 0.35)"], [140, "rgba(196, 168, 112, 0.65)"]]) {
    g.strokeStyle = c;
    g.lineWidth = w;
    g.beginPath();
    path.forEach(([x, y], i) => (i ? g.lineTo(mapX(y), mapY(x)) : g.moveTo(mapX(y), mapY(x))));
    g.stroke();
  }
  for (let i = 0; i < 16000; i++) {
    const x = rand() * MAP_W, y = rand() * MAP_H, h = 4 + rand() * 7;
    g.strokeStyle = rand() < 0.55 ? "rgba(36, 74, 20, 0.35)" : "rgba(196, 226, 120, 0.3)";
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (rand() - 0.5) * 4, y - h);
    g.stroke();
  }
  // a tree line around the clearing
  const ring = [];
  for (let i = 0; i < 70; i++) {
    const t = rand();
    const side = Math.floor(rand() * 4);
    const x = side === 0 ? BOUNDS.minX - 180 - rand() * 600 : side === 1 ? BOUNDS.maxX + 150 + rand() * 900 : BOUNDS.minX + t * (BOUNDS.maxX - BOUNDS.minX);
    const y = side === 2 ? BOUNDS.minY - 180 - rand() * 500 : side === 3 ? BOUNDS.maxY + 150 + rand() * 500 : BOUNDS.minY + t * (BOUNDS.maxY - BOUNDS.minY);
    ring.push({ kind: "tree", x, y, crown: 0.9 + rand() * 0.5 });
  }

  const things = [...SOLIDS, ...ring].sort((a, b) => b.x - a.x); // far (large X) first
  for (const s of things) groundShadow(g, s.x, s.y, s.kind === "house" ? 520 : s.kind === "tree" ? 150 * (s.crown || 1) : (s.r || s.w / 2 || 40) * 1.1);
  for (const s of things) {
    if (s.kind === "house") house(g, s);
    else if (s.kind === "gazebo") gazebo(g, s);
    else if (s.kind === "box") block(g, s, 0, s.h, s.color);
    else if (s.kind === "post") block(g, { x: s.x, y: s.y, w: 16, d: 16, cos: 1, sin: 0 }, 0, s.h, "#7b5a3c");
    else if (s.kind === "tree") tree(g, s.x, s.y, s.crown, rand);
    else if (s.kind === "hedge") for (const [dx, dy] of [[40, -60], [40, 60], [-20, -80], [-20, 80], [0, 0]]) ball(g, s.x + dx, s.y + dy, 70, 75, "#3f6e2a");
    else if (s.kind === "bush") for (const [dx, dy] of [[12, -22], [12, 22], [-12, 0]]) ball(g, s.x + dx, s.y + dy, 34, 34, "#4a7d30");
    else if (s.kind === "rock") ball(g, s.x, s.y, 10, s.r, "#a19f92");
  }
  return { image: canvas, scale: STANDIN_SCALE };
}

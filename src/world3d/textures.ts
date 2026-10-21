// Painted textures for the courtyard, drawn into canvases at start-up (nothing to download):
// light grey detail maps that the materials tint, like Oriverse's "WoodDetail" etc. with a tint.
// Every map tiles and covers one metre (the meshes' texture coordinates are in metres).

import * as THREE from "three";

const SIZE = 256;

// Tileable value noise: a random lattice of `cells` per side, smoothly interpolated.
function noise(cells: number, seed: number): (u: number, v: number) => number {
  let s = seed * 7919 + 13;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const grid = Array.from({ length: cells * cells }, rnd);
  const at = (i: number, j: number) => grid[((j % cells) + cells) % cells * cells + (((i % cells) + cells) % cells)];
  return (u, v) => {
    const x = u * cells, y = v * cells, i = Math.floor(x), j = Math.floor(y);
    const fx = x - i, fy = y - j, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * sx, b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * sx;
    return a + (b - a) * sy;
  };
}
function fbm(octaves: [number, number][], seed: number): (u: number, v: number) => number {
  const layers = octaves.map(([cells], i) => noise(cells, seed + i * 31));
  const total = octaves.reduce((t, [, w]) => t + w, 0);
  return (u, v) => layers.reduce((t, f, i) => t + f(u, v) * octaves[i][1], 0) / total;
}

// Fill a canvas pixel by pixel: shade(u, v) -> [r, g, b] (0..255) or [r, g, b, a].
function paint(shade: (u: number, v: number) => number[], size = SIZE): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const [r, gg, b, a = 255] = shade(x / size, y / size);
      img.data.set([r, gg, b, a], (y * size + x) * 4);
    }
  g.putImageData(img, 0, 0);
  return c;
}
const grey = (v: number) => {
  const c = Math.max(0, Math.min(255, Math.round(v * 255)));
  return [c, c, c];
};

// Planks running along U, four to a metre, with grain and dark seams.
function wood(): HTMLCanvasElement {
  const grain = fbm([[4, 1], [32, 0.5]], 3), ring = noise(8, 9), knot = noise(6, 21);
  return paint((u, v) => {
    const plank = Math.floor(v * 4), pv = v * 4 - plank;
    const tone = 0.82 + 0.12 * Math.sin(plank * 12.9898) ** 2;
    const streak = 0.5 + 0.5 * Math.sin((v * 4 + grain(u, v) * 3 + plank) * Math.PI * 9);
    const seam = pv < 0.06 || pv > 0.96 ? 0.55 : 1;
    const end = Math.abs(((u * 2 + plank * 0.37) % 1) - 0.5) < 0.006 ? 0.6 : 1; // board ends
    const k = knot(u * 3 + plank, v) > 0.92 ? 0.75 : 1;
    return grey((tone - 0.1 * streak - 0.06 * ring(u, v)) * seam * end * k);
  });
}

// Stone blocks in courses, mortar lines, each block a little lighter or darker.
function stone(): HTMLCanvasElement {
  const n = fbm([[8, 1], [32, 0.6], [64, 0.3]], 5);
  return paint((u, v) => {
    const rows = 4, row = Math.floor(v * rows), rv = v * rows - row;
    const shift = (row % 2) * 0.17, cols = 3, cu = (u + shift) * cols, col = Math.floor(cu), lu = cu - col;
    const id = Math.sin((row * 7 + col) * 78.233) * 43758.5453;
    const block = 0.78 + 0.16 * (id - Math.floor(id));
    const mortar = rv < 0.06 || lu < 0.035 ? 0.55 : 1;
    const edge = rv > 0.86 || lu > 0.95 ? 0.9 : 1;
    return grey((block + (n(u, v) - 0.5) * 0.25) * mortar * edge);
  });
}

// Overlapping shingles in rows along U, each with a shaded lower lip.
function shingles(): HTMLCanvasElement {
  const n = fbm([[16, 1], [64, 0.4]], 7);
  return paint((u, v) => {
    const rows = 6, row = Math.floor(v * rows), rv = v * rows - row;
    const cols = 5, cu = (u + (row % 2) * 0.1) * cols, col = Math.floor(cu), lu = cu - col;
    const id = Math.sin((row * 13 + col) * 12.9898) * 43758.5453;
    const tone = 0.8 + 0.14 * (id - Math.floor(id));
    const lip = rv > 0.82 ? 0.62 : 1 - 0.18 * (1 - rv);
    const gap = lu < 0.03 ? 0.6 : 1;
    return grey((tone + (n(u, v) - 0.5) * 0.15) * lip * gap);
  });
}

function plaster(): HTMLCanvasElement {
  const n = fbm([[6, 1], [24, 0.5], [96, 0.25]], 11);
  return paint((u, v) => grey(0.9 + (n(u, v) - 0.5) * 0.12));
}

function fabric(): HTMLCanvasElement {
  const n = fbm([[8, 1], [128, 0.4]], 13);
  return paint((u, v) => {
    const weave = (Math.sin(u * Math.PI * 2 * 64) + Math.sin(v * Math.PI * 2 * 64)) * 0.02;
    return grey(0.9 + weave + (n(u, v) - 0.5) * 0.1);
  });
}

function metal(): HTMLCanvasElement {
  const n = fbm([[8, 1], [64, 0.5]], 17);
  return paint((u, v) => grey(0.75 + (n(u, v) - 0.5) * 0.3));
}

// Bark: deep vertical furrows (along V, up the trunk).
function bark(): HTMLCanvasElement {
  const n = fbm([[4, 1], [16, 0.6], [64, 0.3]], 19);
  return paint((u, v) => {
    const f = Math.abs(Math.sin((u * 7 + n(u, v * 0.3) * 1.5) * Math.PI));
    return grey(0.55 + 0.4 * f ** 0.6 + (n(u * 2, v) - 0.5) * 0.15);
  });
}

// The leaf clump of the Oriverse trees (#texture LeafClump): a cluster of five-leaf rosettes
// in greens, transparent around them.
export function leafClump(): HTMLCanvasElement {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  let s = 41;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const mix = (a: number[], b: number[], t: number) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
  for (let i = 0; i < 16; i++) {
    const a = i * 2.39996, r = 0.03 + 0.34 * Math.sqrt((i + 0.5) / 16);
    const cx = (0.5 + r * Math.cos(a)) * size, cy = (0.54 + r * 0.82 * Math.sin(a)) * size;
    const len = (0.13 + 0.05 * rnd()) * size, rot = 1.2 + rnd() * 1.4;
    const [cr, cg, cb] = mix([47, 106, 28], [169, 219, 82], 0.15 + 0.75 * rnd());
    for (let k = 0; k < 5; k++) {
      const ang = rot + k * 1.2566, l = len * [1, 0.85, 0.5, 0.5, 0.85][k];
      g.save();
      g.translate(cx, cy);
      g.rotate(ang);
      const grad = g.createLinearGradient(0, 0, l, 0);
      grad.addColorStop(0, `rgb(${cr * 0.7},${cg * 0.7},${cb * 0.7})`);
      grad.addColorStop(1, `rgb(${cr},${cg},${cb})`);
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(l / 2, 0, l / 2, l * 0.26, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  }
  return c;
}

function texture(canvas: HTMLCanvasElement, srgb = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---- materials by Oriverse name ----
const DETAIL = { wood, stone, plaster, fabric, metal, bark, shingles };
type Recipe = { map?: keyof typeof DETAIL; tint: string; rough?: number; metal?: number; bump?: number };
const RECIPES: Record<string, Recipe> = {
  WoodWarm: { map: "wood", tint: "#b07c44", bump: 1.2 },
  WoodShade: { map: "wood", tint: "#6e4729", bump: 1.2 },
  DoorWood: { map: "wood", tint: "#5e3d23", bump: 1.2 },
  StoneLight: { map: "stone", tint: "#e2dccd", bump: 2 },
  StoneDark: { map: "stone", tint: "#a29b8e", bump: 2 },
  MossStone: { map: "stone", tint: "#aeb09e", bump: 2 },
  PlasterCream: { map: "plaster", tint: "#f4e8cc", bump: 0.6 },
  RoofOrange: { map: "shingles", tint: "#dc7b3e", bump: 2.5 },
  RoofSlate: { map: "shingles", tint: "#62728a", bump: 2.5 },
  FabricWhite: { map: "fabric", tint: "#f6f5f0", rough: 0.95 },
  FabricBlue: { map: "fabric", tint: "#4485d4", rough: 0.95 },
  IronDark: { map: "metal", tint: "#444444", rough: 0.6, metal: 0.4 },
  BarkWarm: { map: "bark", tint: "#80593a", bump: 3 },
  GlassBlue: { tint: "#3c5872", rough: 0.25 },
  WaterDark: { tint: "#2b4655", rough: 0.1 },
};

const maps = new Map<string, THREE.Texture>();
const mats = new Map<string, THREE.MeshStandardMaterial>();

// The shared material for an Oriverse material name.
export function material(name: string): THREE.MeshStandardMaterial {
  let m = mats.get(name);
  if (m) return m;
  const r = RECIPES[name] ?? { tint: "#ff00ff" };
  m = new THREE.MeshStandardMaterial({ color: r.tint, roughness: r.rough ?? 0.9, metalness: r.metal ?? 0 });
  if (r.map) {
    let t = maps.get(r.map);
    if (!t) maps.set(r.map, (t = texture(DETAIL[r.map]())));
    m.map = t;
    if (r.bump) {
      m.bumpMap = t;
      m.bumpScale = r.bump;
    }
  }
  mats.set(name, m);
  return m;
}

// Ground detail maps (raw colour, decoded in the ground shader).
export function grassMap(): THREE.CanvasTexture {
  const n = fbm([[6, 1], [24, 0.6], [96, 0.35]], 23), m = noise(48, 29);
  return texture(paint((u, v) => {
    const t = n(u, v), speck = m(u, v) > 0.8 ? 0.08 : 0;
    const a = [79, 143, 42], b = [127, 191, 60];
    return a.map((x, i) => (x + (b[i] - x) * t) * (0.92 + speck + (m(u * 2, v * 2) - 0.5) * 0.12));
  }, 512), false);
}
export function dirtMap(): THREE.CanvasTexture {
  const n = fbm([[6, 1], [24, 0.5], [96, 0.3]], 31), p = noise(40, 37);
  return texture(paint((u, v) => {
    const t = n(u, v), pebble = p(u, v) > 0.82 ? 1.12 : p(u, v) < 0.12 ? 0.86 : 1;
    const a = [201, 159, 90], b = [232, 199, 132];
    return a.map((x, i) => (x + (b[i] - x) * t) * pebble);
  }, 512), false);
}

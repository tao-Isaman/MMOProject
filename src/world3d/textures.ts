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

// Sandstone: big soft-edged blocks, two courses to a metre, sandy grain.
function sandstone(): HTMLCanvasElement {
  const n = fbm([[6, 1], [24, 0.5], [128, 0.35]], 41);
  return paint((u, v) => {
    const rows = 2, row = Math.floor(v * rows), rv = v * rows - row;
    const cu = (u + (row % 2) * 0.27) * 2, col = Math.floor(cu), lu = cu - col;
    const id = Math.sin((row * 5 + col) * 41.17) * 43758.5453;
    const block = 0.84 + 0.1 * (id - Math.floor(id));
    const joint = rv < 0.03 || lu < 0.02 ? 0.72 : rv < 0.06 || lu < 0.04 ? 0.9 : 1;
    return grey((block + (n(u, v) - 0.5) * 0.18) * joint);
  });
}

// Adobe / rough plaster: mottled patches and a few hairline cracks.
function adobe(): HTMLCanvasElement {
  const n = fbm([[4, 1], [16, 0.6], [64, 0.3]], 43), c = fbm([[10, 1], [40, 0.4]], 47);
  return paint((u, v) => {
    const crack = Math.abs(c(u, v) - 0.5) < 0.006 ? 0.7 : 1;
    return grey((0.86 + (n(u, v) - 0.5) * 0.22) * crack);
  });
}

// Cobbles: rounded stones on a jittered grid (six to a metre), dark gaps between them.
function cobble(): HTMLCanvasElement {
  const cells = 6, n = fbm([[16, 1], [64, 0.4]], 53);
  let s = 59;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pts = Array.from({ length: cells * cells }, (_, i) => [((i % cells) + 0.2 + rnd() * 0.6) / cells, (Math.floor(i / cells) + 0.2 + rnd() * 0.6) / cells, 0.78 + rnd() * 0.18]);
  return paint((u, v) => {
    let d1 = 9, d2 = 9, tone = 0.8;
    for (const [px, py, t] of pts)
      for (const ox of [-1, 0, 1])
        for (const oy of [-1, 0, 1]) {
          const d = Math.hypot(u - px - ox, v - py - oy);
          if (d < d1) [d2, d1, tone] = [d1, d, t];
          else if (d < d2) d2 = d;
        }
    const gap = d2 - d1, edge = Math.min(1, gap * cells * 3);
    return grey((tone + (n(u, v) - 0.5) * 0.15) * (0.45 + 0.55 * edge) * (1 - d1 * cells * 0.25));
  });
}

// Barrel roof tiles: six channels to a metre along U, courses every quarter metre along V.
function tiles(): HTMLCanvasElement {
  const n = fbm([[8, 1], [64, 0.4]], 61);
  return paint((u, v) => {
    const cu = u * 6, lu = cu - Math.floor(cu);
    const rows = 4, rv = v * rows - Math.floor(v * rows);
    const round = 0.62 + 0.38 * Math.sin(lu * Math.PI);
    const lip = rv > 0.88 ? 0.7 : 1 - 0.12 * rv;
    const id = Math.sin((Math.floor(cu) * 3 + Math.floor(v * rows) * 17) * 12.9898) * 43758.5453;
    return grey((round * lip) * (0.9 + 0.1 * (id - Math.floor(id))) + (n(u, v) - 0.5) * 0.08);
  });
}

// Thatch: straw strands down the slope (along V), in layered bundles.
function thatch(): HTMLCanvasElement {
  const n = fbm([[64, 1], [8, 0.5]], 67), m = noise(128, 71);
  return paint((u, v) => {
    const layer = v * 5 - Math.floor(v * 5);
    const strand = 0.75 + 0.25 * Math.sin((u * 90 + n(u, v) * 6) * Math.PI);
    return grey((0.62 + 0.3 * strand * (0.7 + 0.3 * m(u, v * 0.2))) * (layer > 0.9 ? 0.75 : 1));
  });
}

// Snow: soft drifts and a little sparkle.
function snow(): HTMLCanvasElement {
  const n = fbm([[4, 1], [16, 0.5], [64, 0.25]], 73), sp = noise(96, 79);
  return paint((u, v) => grey(0.9 + (n(u, v) - 0.5) * 0.12 + (sp(u, v) > 0.86 ? 0.06 : 0)));
}

// Ice: pale with branching crack lines.
function ice(): HTMLCanvasElement {
  const n = fbm([[6, 1], [24, 0.5]], 83), c1 = fbm([[5, 1], [20, 0.5]], 89), c2 = fbm([[7, 1], [28, 0.5]], 97);
  return paint((u, v) => {
    const crack = Math.abs(c1(u, v) - 0.5) < 0.008 || Math.abs(c2(u, v) - 0.5) < 0.005 ? 0.78 : 1;
    return grey((0.88 + (n(u, v) - 0.5) * 0.16) * crack);
  });
}

// Shoji: paper panes in a dark wooden lattice (three by four to a metre).
function paper(): HTMLCanvasElement {
  const n = fbm([[16, 1], [128, 0.3]], 101);
  return paint((u, v) => {
    const lu = (u * 3) % 1, lv = (v * 4) % 1;
    const bar = lu < 0.05 || lu > 0.95 || lv < 0.05 || lv > 0.95;
    return bar ? grey(0.32) : grey(0.93 + (n(u, v) - 0.5) * 0.06);
  });
}

// Bamboo: canes run along V; a node ring every 40 cm, faint streaks along the cane.
function bamboo(): HTMLCanvasElement {
  const n = noise(64, 103);
  return paint((u, v) => {
    const node = (v * 2.5) % 1;
    const ring = node < 0.03 ? 0.62 : node < 0.06 ? 1.08 : 1;
    return grey((0.84 + (n(u * 4, v * 0.3) - 0.5) * 0.12) * ring);
  });
}

// Marble: white with soft grey veins.
function marble(): HTMLCanvasElement {
  const n = fbm([[3, 1], [12, 0.6], [48, 0.3]], 107);
  return paint((u, v) => {
    const vein = Math.abs(Math.sin((u * 3 + v * 2 + n(u, v) * 4) * Math.PI));
    return grey(0.95 - 0.16 * (1 - vein) ** 6 + (n(u * 2, v * 2) - 0.5) * 0.04);
  });
}

// Bricks: eight courses to a metre, four bricks across, offset every other course.
function brick(): HTMLCanvasElement {
  const n = fbm([[16, 1], [64, 0.4]], 109);
  return paint((u, v) => {
    const rows = 8, row = Math.floor(v * rows), rv = v * rows - row;
    const cu = (u + (row % 2) * 0.125) * 4, col = Math.floor(cu), lu = cu - col;
    const id = Math.sin((row * 11 + col) * 71.3) * 43758.5453;
    const mortar = rv < 0.12 || lu < 0.04 ? 0.62 : 1;
    return grey((0.8 + 0.14 * (id - Math.floor(id)) + (n(u, v) - 0.5) * 0.12) * mortar);
  });
}

// Felt: matted fibres.
function felt(): HTMLCanvasElement {
  const n = fbm([[8, 1], [48, 0.5], [160, 0.4]], 113);
  return paint((u, v) => grey(0.86 + (n(u, v) - 0.5) * 0.2));
}

// Ribs: vertical ridges around a cactus (along U, which runs around round shapes).
function ribs(): HTMLCanvasElement {
  const n = noise(32, 127);
  return paint((u, v) => grey(0.7 + 0.25 * Math.abs(Math.sin(u * Math.PI * 12)) + (n(u, v) - 0.5) * 0.08));
}

// The leaf clump of the Oriverse trees (#texture LeafClump): a cluster of five-leaf rosettes
// in greens, transparent around them.
export interface LeafPalette {
  dark: [number, number, number];
  light: [number, number, number];
  leaves?: number;  // rosettes in the clump
  thin?: number;    // leaf width relative to its length
}
export const LEAVES: Record<string, LeafPalette> = {
  green: { dark: [47, 106, 28], light: [169, 219, 82] },
  blossom: { dark: [214, 120, 160], light: [255, 214, 230] },
  birch: { dark: [118, 150, 40], light: [222, 230, 110] },
  jungle: { dark: [22, 78, 30], light: [92, 168, 60], leaves: 12 },
  autumn: { dark: [170, 70, 30], light: [240, 170, 60] },
  frost: { dark: [70, 110, 90], light: [200, 225, 220] },
  bamboo: { dark: [60, 110, 40], light: [150, 200, 80], leaves: 20, thin: 0.14 },
};
export function leafClump(palette: LeafPalette = LEAVES.green): HTMLCanvasElement {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  let s = 41;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const mix = (a: number[], b: number[], t: number) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
  const count = palette.leaves ?? 16, thin = palette.thin ?? 0.26;
  for (let i = 0; i < count; i++) {
    const a = i * 2.39996, r = 0.03 + 0.34 * Math.sqrt((i + 0.5) / count);
    const cx = (0.5 + r * Math.cos(a)) * size, cy = (0.54 + r * 0.82 * Math.sin(a)) * size;
    const len = (0.13 + 0.05 * rnd()) * size, rot = 1.2 + rnd() * 1.4;
    const [cr, cg, cb] = mix(palette.dark, palette.light, 0.15 + 0.75 * rnd());
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
      g.ellipse(l / 2, 0, l / 2, l * thin, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  }
  return c;
}

// A palm frond seen flat: a rib along U with leaflets either side, transparent around it.
export function frondTexture(dark: [number, number, number] = [40, 110, 40], light: [number, number, number] = [130, 196, 70]): HTMLCanvasElement {
  const w = 256, h = 64;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 34; i++) {
    const x = 8 + (i / 34) * (w - 16), len = (h / 2 - 3) * (1 - Math.abs(i / 34 - 0.35) * 0.9);
    const t = rnd();
    for (const side of [-1, 1]) {
      g.save();
      g.translate(x, h / 2);
      g.rotate(side * (0.9 + rnd() * 0.25));
      g.fillStyle = `rgb(${dark.map((d, k) => Math.round(d + (light[k] - d) * t)).join(",")})`;
      g.beginPath();
      g.ellipse(len / 2, 0, len / 2, 2.2, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  }
  g.fillStyle = `rgb(${dark.join(",")})`;
  g.fillRect(4, h / 2 - 1.5, w - 8, 3);
  return c;
}

// A spray of pine needles along U (twig down the middle, needles angled forward on both sides,
// a few side twigs), transparent around it; `snowy` lays soft clumps of snow along the twig.
export function needleTexture(snowy = false): HTMLCanvasElement {
  const w = 256, h = 128;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  let s = snowy ? 211 : 197;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const dark = [26, 60, 34], light = [96, 146, 74];
  const col = (t: number) => `rgb(${dark.map((d, i) => Math.round(d + (light[i] - d) * t)).join(",")})`;
  g.lineCap = "round";
  // a twig from (x0, y0) along angle `a`, `len` long, needles `nl` long
  const twig = (x0: number, y0: number, a: number, len: number, nl: number, lift: number) => {
    const steps = Math.round(len / 2.2);
    for (let i = 0; i < steps; i++) {
      const t = i / steps, x = x0 + Math.cos(a) * len * t, y = y0 + Math.sin(a) * len * t;
      const l = nl * (1 - 0.5 * t) * (0.75 + rnd() * 0.5);
      for (const side of [-1, 1]) {
        const na = a + side * (0.6 + rnd() * 0.5);
        g.strokeStyle = col(Math.min(1, lift + rnd() * 0.55 + 0.25 * t));
        g.lineWidth = 1.8 + rnd() * 1.2;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + Math.cos(na) * l, y + Math.sin(na) * l);
        g.stroke();
      }
    }
  };
  // side twigs first (under), then the main twig's long needles, then a lighter top layer
  for (let i = 0; i < 9; i++) {
    const x = 14 + i * 26 + rnd() * 8, side = i % 2 ? 1 : -1;
    twig(x, h / 2, side * (0.5 + rnd() * 0.3), 30 + rnd() * 18 - i * 1.5, 22, 0);
  }
  twig(4, h / 2, 0, w - 10, 40, 0.1);
  twig(10, h / 2 - 3, -0.02, w - 30, 26, 0.45);
  if (snowy) {
    // snow lies along the top of the twig in long soft bands with gaps, the needle tips
    // staying green either side
    const bands = 5;
    for (let i = 0; i < bands; i++) {
      const x = 30 + (i / bands) * (w - 70) + rnd() * 14, y = h / 2 + (rnd() - 0.5) * 8, rx = 28 + rnd() * 16, ry = 10 + rnd() * 6;
      const grad = g.createRadialGradient(x, y - ry * 0.3, 1, x, y, rx);
      grad.addColorStop(0, "rgb(255,255,255)");
      grad.addColorStop(0.6, "rgb(238,245,255)");
      grad.addColorStop(0.85, "rgba(210,226,248,0.85)");
      grad.addColorStop(1, "rgba(210,226,248,0)");
      g.save();
      g.translate(x, y);
      g.scale(1, ry / rx);
      g.translate(-x, -y);
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, rx, 0, Math.PI * 2);
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
const DETAIL = { wood, stone, plaster, fabric, metal, bark, shingles, sandstone, adobe, cobble, tiles, thatch, snow, ice, paper, bamboo, marble, brick, felt, ribs };
export type DetailMap = keyof typeof DETAIL;
// glow: emissive colour (crystals, lanterns); opacity < 1 makes it see-through (ice, glass).
export type Recipe = { map?: DetailMap; tint: string; rough?: number; metal?: number; bump?: number; glow?: string; glowI?: number; opacity?: number };
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

  // ---- the town kits' shared palette ----
  WoodDark: { map: "wood", tint: "#4a3322", bump: 1.2 },
  WoodPale: { map: "wood", tint: "#d9b98a", bump: 1.2 },
  WoodRed: { map: "wood", tint: "#8c3a2a", bump: 1.2 },
  WoodGrey: { map: "wood", tint: "#8d8579", bump: 1.2 }, // weathered dock planks
  StoneGrey: { map: "stone", tint: "#b8b6b0", bump: 2 },
  StoneBlueDark: { map: "stone", tint: "#6f7a8c", bump: 2 },
  StoneWhite: { map: "stone", tint: "#f2eee6", bump: 2 },
  SandstoneWarm: { map: "sandstone", tint: "#e2b97c", bump: 1.5 },
  SandstonePale: { map: "sandstone", tint: "#efd9ab", bump: 1.5 },
  AdobeOchre: { map: "adobe", tint: "#d79b5c", bump: 1 },
  AdobeWhite: { map: "adobe", tint: "#f1e6d2", bump: 1 },
  MarbleWhite: { map: "marble", tint: "#f5f3ee", rough: 0.45 },
  Cobble: { map: "cobble", tint: "#bdb5a6", bump: 2 },
  CobbleDark: { map: "cobble", tint: "#8a857c", bump: 2 },
  BrickRed: { map: "brick", tint: "#b5583b", bump: 1.5 },
  RoofTerracotta: { map: "tiles", tint: "#c4643a", bump: 2.5 },
  RoofKawara: { map: "tiles", tint: "#5c6372", bump: 2.5 },
  RoofBlue: { map: "tiles", tint: "#3f6fb0", bump: 2.5 },
  RoofCopper: { map: "tiles", tint: "#5f9e88", bump: 2.5, metal: 0.2 },
  RoofRed: { map: "shingles", tint: "#b5452f", bump: 2.5 },
  Thatch: { map: "thatch", tint: "#c9a65a", bump: 2 },
  Snow: { map: "snow", tint: "#f6f9ff", rough: 0.8 },
  IceBlue: { map: "ice", tint: "#bfe3f5", rough: 0.15, opacity: 0.85 },
  LacquerRed: { map: "plaster", tint: "#c8372d", rough: 0.45 },
  LacquerBlack: { map: "plaster", tint: "#262224", rough: 0.4 },
  PaperShoji: { map: "paper", tint: "#f7f2e4", rough: 0.95 },
  Bamboo: { map: "bamboo", tint: "#9fb35a", rough: 0.6 },
  BambooDry: { map: "bamboo", tint: "#c9b77a", rough: 0.7 },
  FeltCream: { map: "felt", tint: "#e8dcc2", rough: 1 },
  FeltRed: { map: "felt", tint: "#a8433a", rough: 1 },
  FabricRed: { map: "fabric", tint: "#c23b32", rough: 0.95 },
  FabricGold: { map: "fabric", tint: "#d9a93a", rough: 0.95 },
  FabricPurple: { map: "fabric", tint: "#6a3d8f", rough: 0.95 },
  FabricGreen: { map: "fabric", tint: "#4f8a4a", rough: 0.95 },
  FabricSand: { map: "fabric", tint: "#e9d5a8", rough: 0.95 },
  FabricNavy: { map: "fabric", tint: "#2c3e6b", rough: 0.95 },
  RopeTan: { map: "fabric", tint: "#b89a66", rough: 1 },
  GoldTrim: { map: "metal", tint: "#d6a640", rough: 0.35, metal: 0.7 },
  Bronze: { map: "metal", tint: "#a8743c", rough: 0.45, metal: 0.6 },
  CopperGreen: { map: "metal", tint: "#6fa591", rough: 0.6, metal: 0.3 },
  IronLight: { map: "metal", tint: "#8d939b", rough: 0.5, metal: 0.5 },
  CrystalViolet: { tint: "#b08cff", rough: 0.2, glow: "#8a52ff", glowI: 1.4, opacity: 0.92 },
  CrystalBlue: { tint: "#9be3ff", rough: 0.2, glow: "#3fb6ff", glowI: 1.3, opacity: 0.92 },
  LanternGlow: { tint: "#ffd28a", rough: 0.6, glow: "#ffb347", glowI: 1.6 },
  FireGlow: { tint: "#ff9a3c", rough: 1, glow: "#ff6a1a", glowI: 2 },
  CactusGreen: { map: "ribs", tint: "#5f9a4e", rough: 0.8 },
  LeafGreen: { map: "felt", tint: "#4f8a34", rough: 0.9 },
  PineNeedle: { map: "felt", tint: "#2f5a3a", rough: 0.95 },
  PineCore: { map: "felt", tint: "#22422b", rough: 1 },
  BarkBirch: { map: "bark", tint: "#e6e2d8", bump: 2 },
  BarkPalm: { map: "bark", tint: "#9a7a52", bump: 3 },
  WaterSea: { tint: "#2f6f8f", rough: 0.08, opacity: 0.9 },
};

// Kits can add their own materials (a name used by their meshes and a recipe).
export function defineMaterial(name: string, recipe: Recipe): void {
  if (!RECIPES[name]) RECIPES[name] = recipe;
}

const maps = new Map<string, THREE.Texture>();
const mats = new Map<string, THREE.MeshStandardMaterial>();

// The shared material for an Oriverse material name.
export function material(name: string): THREE.MeshStandardMaterial {
  let m = mats.get(name);
  if (m) return m;
  const r = RECIPES[name] ?? { tint: "#ff00ff" };
  m = new THREE.MeshStandardMaterial({ color: r.tint, roughness: r.rough ?? 0.9, metalness: r.metal ?? 0 });
  if (r.glow) {
    m.emissive = new THREE.Color(r.glow);
    m.emissiveIntensity = r.glowI ?? 1;
  }
  if (r.opacity !== undefined && r.opacity < 1) {
    m.transparent = true;
    m.opacity = r.opacity;
  }
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

// Ground colour maps for the other lands (sRGB, one tile per metre; the gallery repeats them).
const GROUNDS: Record<string, { a: number[]; b: number[]; seed: number; speck?: number[]; ripple?: boolean }> = {
  grass: { a: [79, 143, 42], b: [127, 191, 60], seed: 23 },
  sand: { a: [214, 184, 128], b: [240, 216, 164], seed: 131, ripple: true },
  snow: { a: [222, 232, 244], b: [250, 252, 255], seed: 137 },
  steppe: { a: [128, 140, 70], b: [190, 180, 104], seed: 139, speck: [150, 120, 70] },
  jungle: { a: [44, 98, 36], b: [92, 150, 52], seed: 149, speck: [70, 56, 34] },
  moss: { a: [86, 120, 58], b: [140, 164, 86], seed: 151, speck: [170, 168, 150] },
  dirt: { a: [176, 132, 80], b: [214, 178, 118], seed: 157 },
  rock: { a: [120, 116, 108], b: [170, 164, 152], seed: 163 },
};
export function groundTexture(kind: string): THREE.CanvasTexture {
  const g = GROUNDS[kind] ?? GROUNDS.grass;
  const n = fbm([[6, 1], [24, 0.6], [96, 0.35]], g.seed), m = noise(48, g.seed + 6);
  return texture(paint((u, v) => {
    let t = n(u, v);
    if (g.ripple) t = t * 0.7 + 0.3 * (0.5 + 0.5 * Math.sin((v * 9 + n(u, v) * 3) * Math.PI * 2));
    if (g.speck && m(u, v) > 0.84) return g.speck;
    return g.a.map((x, i) => (x + (g.b[i] - x) * t) * (0.94 + (m(u * 2, v * 2) - 0.5) * 0.1));
  }, 512));
}

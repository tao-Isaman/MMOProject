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
// Crag: a cliff's bare rock: blotchy stone in a few wavy ledges (along U), cracks running down.
function crag(): HTMLCanvasElement {
  const n = fbm([[3, 1], [8, 0.8], [24, 0.5], [64, 0.3]], 47), c = noise(10, 59), l = noise(5, 53);
  return paint((u, v) => {
    const lv = (((v * 3 + (l(u, v) - 0.5) * 0.8) % 1) + 1) % 1;
    const ledge = lv < 0.05 ? 0.72 : lv < 0.1 ? 1.08 : 1;
    const crack = Math.abs(c(u, v * 0.3) - 0.5) < 0.02 ? 0.65 : 1;
    return grey((0.52 + n(u, v) * 0.55) * ledge * crack);
  });
}

// ---- foliage: leaves painted in grey for the tint to colour ----
const shade = (v: number) => {
  const c = Math.max(0, Math.min(255, Math.round(v * 255)));
  return `rgb(${c},${c},${c})`;
};
// One leaf from (0, 0) along +x: `len` long, `wid` its half-width, darker at the stalk, a dark
// rim and a pale midrib so it still reads small.
function paintLeaf(g: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, wid: number, val: number, rim = 1.1, veins = 0): void {
  g.save();
  g.translate(x, y);
  g.rotate(ang);
  const grad = g.createLinearGradient(0, 0, len, 0);
  grad.addColorStop(0, shade(val * 0.6));
  grad.addColorStop(0.55, shade(val * 0.9));
  grad.addColorStop(1, shade(val));
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(0, 0);
  g.bezierCurveTo(len * 0.22, wid * 1.1, len * 0.68, wid * 0.95, len, 0);
  g.bezierCurveTo(len * 0.68, -wid * 0.95, len * 0.22, -wid * 1.1, 0, 0);
  g.fill();
  if (rim > 0) {
    g.strokeStyle = shade(val * 0.48);
    g.lineWidth = rim;
    g.stroke();
  }
  g.strokeStyle = shade(Math.min(1, val * 1.1 + 0.04));
  g.lineWidth = Math.max(1, wid * 0.12);
  g.beginPath();
  g.moveTo(len * 0.06, 0);
  g.quadraticCurveTo(len * 0.5, wid * 0.06, len * 0.92, 0);
  g.stroke();
  for (let i = 1; i <= veins; i++) {
    const t = i / (veins + 1);
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(len * t * 0.9, 0);
      g.lineTo(len * (t * 0.9 + 0.12), s * wid * 0.7 * Math.sin(Math.PI * t));
      g.stroke();
    }
  }
  g.restore();
}

// Foliage: a tiling mat of small overlapping leaves over deep gaps (the inside of a bush, the
// face of a clipped hedge).
function foliage(): HTMLCanvasElement {
  const size = SIZE, c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = shade(0.4);
  g.fillRect(0, 0, size, size);
  let s = 131;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const leaves = Array.from({ length: 300 }, () => ({ x: rnd() * size, y: rnd() * size, a: rnd() * Math.PI * 2, l: 15 + rnd() * 11, v: 0.5 + rnd() * 0.5 }));
  leaves.sort((p, q) => p.v - q.v);
  for (const f of leaves)
    for (const ox of [-size, 0, size])
      for (const oy of [-size, 0, size]) {
        const x = f.x + ox, y = f.y + oy;
        if (x < -30 || y < -30 || x > size + 30 || y > size + 30) continue;
        paintLeaf(g, x, y, f.a, f.l, f.l * 0.36, f.v, 1);
      }
  return c;
}

// Leaf cards (alpha-cut, grey for the tint): "leaves" a round spray of small leaves, "broad" a
// few big glossy jungle leaves, "lance" narrow bamboo leaves fanning out, "tuft" strap leaves
// rising from the card's bottom edge (the foliage of a flower clump).
export type CardKind = "leaves" | "broad" | "lance" | "tuft" | "needles" | "flowers";
export function leafCard(kind: Exclude<CardKind, "flowers">): HTMLCanvasElement {
  const size = 256, c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  let s = { leaves: 17, broad: 23, lance: 29, tuft: 31, needles: 37 }[kind];
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  if (kind === "needles") {
    // a pine tuft from above: needles bursting out of the middle, darker underneath
    g.lineCap = "round";
    const list = Array.from({ length: 90 }, () => ({ a: rnd() * Math.PI * 2, l: size * (0.24 + rnd() * 0.22), v: 0.5 + rnd() * 0.5, o: rnd() * size * 0.08 }));
    list.sort((p, q) => p.v - q.v);
    for (const n of list) {
      const x0 = size / 2 + Math.cos(n.a + 1.3) * n.o, y0 = size / 2 + Math.sin(n.a + 1.3) * n.o;
      const grad = g.createLinearGradient(x0, y0, x0 + Math.cos(n.a) * n.l, y0 + Math.sin(n.a) * n.l);
      grad.addColorStop(0, shade(n.v * 0.5));
      grad.addColorStop(1, shade(n.v));
      g.strokeStyle = grad;
      g.lineWidth = 3.2;
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x0 + Math.cos(n.a) * n.l, y0 + Math.sin(n.a) * n.l);
      g.stroke();
    }
    return c;
  }
  if (kind === "tuft") {
    // tapering blades from the bottom middle, curving out, darker at the foot
    const blades = Array.from({ length: 15 }, (_, i) => {
      const spread = ((i / 14) * 2 - 1) * 1.05 + (rnd() - 0.5) * 0.25;
      return { a: spread, l: size * (0.95 - 0.38 * Math.abs(spread) + (rnd() - 0.5) * 0.12), w: 7 + rnd() * 5, v: 0.6 + rnd() * 0.4, x: size / 2 + (rnd() - 0.5) * 34 };
    });
    blades.sort((p, q) => Math.abs(q.a) - Math.abs(p.a));
    for (const b of blades) {
      const x0 = b.x, y0 = size - 2, bend = b.a * 1.25;
      const ctrl = [x0 + Math.sin(b.a * 0.5) * b.l * 0.5, y0 - Math.cos(b.a * 0.5) * b.l * 0.55];
      const tip = [x0 + Math.sin(bend) * b.l * 0.62, y0 - Math.cos(bend) * b.l * 0.92];
      const at = (t: number) => [(1 - t) ** 2 * x0 + 2 * (1 - t) * t * ctrl[0] + t * t * tip[0], (1 - t) ** 2 * y0 + 2 * (1 - t) * t * ctrl[1] + t * t * tip[1]];
      const left: number[][] = [], right: number[][] = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10, p = at(t), q = at(Math.min(1, t + 0.05)), r = at(Math.max(0, t - 0.05));
        const dx = q[0] - r[0], dy = q[1] - r[1], L = Math.hypot(dx, dy) || 1, w = b.w * (1 - t) ** 0.7 * (t < 0.1 ? 0.7 + t * 3 : 1);
        left.push([p[0] - (dy / L) * w, p[1] + (dx / L) * w]);
        right.push([p[0] + (dy / L) * w, p[1] - (dx / L) * w]);
      }
      const grad = g.createLinearGradient(x0, y0, tip[0], tip[1]);
      grad.addColorStop(0, shade(b.v * 0.45));
      grad.addColorStop(0.5, shade(b.v * 0.85));
      grad.addColorStop(1, shade(b.v));
      g.fillStyle = grad;
      g.beginPath();
      [...left, ...right.reverse()].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
      g.fill();
      g.strokeStyle = shade(b.v * 0.42);
      g.lineWidth = 1;
      g.stroke();
    }
    return c;
  }
  const cx = size / 2, cy = size / 2;
  const n = { leaves: 34, broad: 8, lance: 20 }[kind];
  const list = Array.from({ length: n }, (_, i) => {
    const a = kind === "broad" ? (i / n) * Math.PI * 2 + rnd() * 0.5 : rnd() * Math.PI * 2;
    const d = (kind === "broad" ? 0.04 : 0.17) * size * Math.sqrt(rnd());
    const len = size * ({ leaves: 0.24, broad: 0.4, lance: 0.4 }[kind] + rnd() * ({ leaves: 0.09, broad: 0.06, lance: 0.06 }[kind]));
    const wid = len * { leaves: 0.36, broad: 0.33, lance: 0.11 }[kind];
    return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, a: a + (rnd() - 0.5) * 0.9, len: Math.min(len, size * 0.47 - d), wid, v: 0.55 + rnd() * 0.45 };
  });
  list.sort((p, q) => p.v - q.v);
  for (const f of list) paintLeaf(g, f.x, f.y, f.a, f.len, Math.min(f.wid, f.len * 0.4), f.v, kind === "broad" ? 1.6 : 1.2, kind === "broad" ? 4 : 0);
  return c;
}

// Flowers, in colour: a 4 x 4 atlas of 128 px cells, each a little cluster seen from above (or
// from the side for the upright and hanging ones). FLOWER_CELLS names them.
export const FLOWER_CELLS = {
  roseRed: 0, cosmosPink: 1, buttercup: 2, daisy: 3, pansy: 4, marigold: 5, forgetMeNot: 6, blossom: 7,
  wisteria: 8, lavender: 9, berries: 10, tinyYellow: 11, tulips: 12, hydrangea: 13, tinyOrange: 14, rosePink: 15,
} as const;
export function flowerAtlas(): HTMLCanvasElement {
  const C = 128, c = document.createElement("canvas");
  c.width = c.height = C * 4;
  const g = c.getContext("2d")!;
  let s = 37;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const rgb = (h: string, k = 1) => {
    const n = parseInt(h.slice(1), 16);
    return `rgb(${Math.min(255, Math.round(((n >> 16) & 255) * k))},${Math.min(255, Math.round(((n >> 8) & 255) * k))},${Math.min(255, Math.round((n & 255) * k))})`;
  };
  // n petals round (x, y): each an ellipse `len` out from the middle, `w` its half-width
  const petals = (x: number, y: number, n: number, len: number, w: number, rot: number, col: string, tipK = 1.25, outline = 0.6) => {
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      g.save();
      g.translate(x, y);
      g.rotate(a);
      const grad = g.createLinearGradient(0, 0, len, 0);
      grad.addColorStop(0, rgb(col, 0.78));
      grad.addColorStop(1, rgb(col, tipK));
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(len * 0.52, 0, len * 0.5, w, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = rgb(col, outline);
      g.lineWidth = 1;
      g.stroke();
      g.restore();
    }
  };
  const dot = (x: number, y: number, r: number, col: string, k = 0.6) => {
    const grad = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, rgb(col, 1.25));
    grad.addColorStop(1, rgb(col, 0.85));
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = rgb(col, k);
    g.lineWidth = 1;
    g.stroke();
  };
  const rose = (x: number, y: number, r: number, col: string) => {
    petals(x, y, 5, r, r * 0.42, rnd(), col, 1.05, 0.5);
    petals(x, y, 5, r * 0.7, r * 0.34, rnd() + 0.6, col, 1.2, 0.5);
    dot(x, y, r * 0.36, col, 0.45);
    g.strokeStyle = rgb(col, 0.5);
    g.lineWidth = 1.4;
    g.beginPath();
    g.arc(x + r * 0.05, y, r * 0.2, 0.4, 4.4);
    g.stroke();
  };
  const daisy = (x: number, y: number, r: number, n: number, w: number, col: string, eye: string, eyeR = 0.26) => {
    petals(x, y, n, r, r * w, rnd(), col);
    dot(x, y, r * eyeR, eye, 0.55);
  };
  const tiny = (x: number, y: number, r: number, col: string, eye: string) => {
    petals(x, y, 5, r, r * 0.42, rnd(), col, 1.2, 0.62);
    dot(x, y, r * 0.24, eye, 0.7);
  };
  const scatter = (n: number, r0: number, r1: number, f: (x: number, y: number, r: number) => void) => {
    const spots: number[][] = [];
    for (let k = 0; k < 400 && spots.length < n; k++) {
      const r = r0 + rnd() * (r1 - r0), x = 10 + r + rnd() * (C - 20 - 2 * r), y = 10 + r + rnd() * (C - 20 - 2 * r);
      if (spots.every(([a, b, q]) => Math.hypot(a - x, b - y) > (q + r) * 0.72)) spots.push([x, y, r]);
    }
    spots.sort((p, q) => p[1] - q[1]);
    for (const [x, y, r] of spots) f(x, y, r);
  };
  const cells: ((ox: number, oy: number) => void)[] = [
    (ox, oy) => { for (const [x, y, r] of [[40, 46, 28], [88, 44, 24], [64, 88, 27]]) rose(ox + x, oy + y, r, "#d42a3e"); },
    (ox, oy) => { for (const [x, y, r] of [[42, 44, 27], [88, 50, 23], [62, 90, 25]]) daisy(ox + x, oy + y, r, 8, 0.36, "#f27fb0", "#f2c22a"); },
    (ox, oy) => scatter(5, 17, 22, (x, y, r) => daisy(ox + x, oy + y, r, 5, 0.52, "#ffcf2a", "#f08a1a", 0.3)),
    (ox, oy) => { for (const [x, y, r] of [[42, 42, 28], [90, 54, 24], [56, 92, 25]]) daisy(ox + x, oy + y, r, 14, 0.17, "#f2f0e6", "#f2b81e", 0.3); },
    (ox, oy) => { for (const [x, y, r] of [[42, 46, 26], [88, 48, 24], [64, 90, 25]]) { petals(ox + x, oy + y, 5, r, r * 0.55, rnd(), "#8448d0", 1.35, 0.55); dot(ox + x, oy + y, r * 0.38, "#341466", 0.6); dot(ox + x, oy + y, r * 0.12, "#f6d23a", 0.7); } },
    (ox, oy) => { for (const [x, y, r] of [[42, 44, 27], [88, 50, 24], [62, 90, 26]]) { petals(ox + x, oy + y, 12, r, r * 0.3, rnd(), "#e8661a", 1.2, 0.6); petals(ox + x, oy + y, 9, r * 0.66, r * 0.28, rnd(), "#f48a24", 1.25, 0.6); dot(ox + x, oy + y, r * 0.26, "#b8460e", 0.6); } },
    (ox, oy) => scatter(13, 9, 12, (x, y, r) => tiny(ox + x, oy + y, r, "#5a8ef0", "#f6d23a")),
    (ox, oy) => scatter(13, 9, 12, (x, y, r) => tiny(ox + x, oy + y, r, rnd() < 0.6 ? "#f6eef0" : "#f8c2d4", "#e86a92")),
    // wisteria: racemes hanging from the top edge, wide at the top, to a point
    (ox, oy) => {
      for (const [x, l] of [[34, 100], [66, 116], [96, 92]])
        for (let k = 0; k < 26; k++) {
          const t = k / 26, y = 10 + t * l, w = 18 * (1 - t) + 3;
          dot(ox + x + (rnd() - 0.5) * 2 * w, oy + y, 5.5 - 2.5 * t, t < 0.3 ? "#b89af0" : t < 0.7 ? "#9470dc" : "#7650c4", 0.55);
        }
    },
    // lavender: spikes rising from the bottom edge
    (ox, oy) => {
      for (const [x, l, lean] of [[30, 96, -0.25], [48, 112, -0.1], [64, 104, 0.02], [80, 116, 0.12], [98, 94, 0.26]]) {
        const tx = x + lean * l;
        g.strokeStyle = "rgb(84,128,62)";
        g.lineWidth = 2.5;
        g.beginPath();
        g.moveTo(ox + 64 + (x - 64) * 0.3, oy + C - 2);
        g.lineTo(ox + tx, oy + C - l);
        g.stroke();
        for (let k = 0; k < 9; k++) {
          const t = k / 9, px = tx - lean * l * 0.45 * t, py = C - l + l * 0.45 * t;
          dot(ox + px + (k % 2 ? 2.5 : -2.5), oy + py, 4.6 - t * 1.2, k < 3 ? "#9c7ae0" : "#7c56c8", 0.55);
        }
      }
    },
    (ox, oy) => scatter(11, 8, 11, (x, y, r) => { dot(ox + x, oy + y, r, "#c81e2c", 0.5); g.fillStyle = "rgba(255,230,230,0.85)"; g.beginPath(); g.arc(ox + x - r * 0.35, oy + y - r * 0.35, r * 0.22, 0, Math.PI * 2); g.fill(); }),
    (ox, oy) => scatter(13, 9, 12, (x, y, r) => tiny(ox + x, oy + y, r, "#ffd640", "#e8801a")),
    // tulips from the side: cups on stems rising from the bottom edge
    (ox, oy) => {
      for (const [x, h, col] of [[36, 92, "#e2303c"], [66, 110, "#f0c020"], [94, 88, "#e2303c"]] as [number, number, string][]) {
        g.strokeStyle = "rgb(70,124,52)";
        g.lineWidth = 3.5;
        g.beginPath();
        g.moveTo(ox + 64 + (x - 64) * 0.4, oy + C - 2);
        g.lineTo(ox + x, oy + C - h + 14);
        g.stroke();
        const cx = ox + x, cy = oy + C - h;
        for (const [dx, k] of [[-7, 0.85], [7, 0.9], [0, 1.15]] as [number, number][]) {
          g.fillStyle = rgb(col, k);
          g.beginPath();
          g.ellipse(cx + dx, cy, 9, 15, dx * 0.03, 0, Math.PI * 2);
          g.fill();
          g.strokeStyle = rgb(col, 0.55);
          g.lineWidth = 1;
          g.stroke();
        }
      }
    },
    // hydrangea: two big heads of four-petalled florets
    (ox, oy) => {
      for (const [x, y, R] of [[44, 50, 34], [86, 80, 32]])
        for (let k = 0; k < 30; k++) {
          const a = k * 2.4, d = R * Math.sqrt((k + 0.5) / 30) * 0.86, col = ["#8ea8f0", "#a894ec", "#b8c8f8", "#9c8ae0"][k % 4];
          petals(ox + x + Math.cos(a) * d, oy + y + Math.sin(a) * d, 4, 8, 4, rnd(), col, 1.2, 0.6);
        }
    },
    (ox, oy) => scatter(13, 9, 12, (x, y, r) => tiny(ox + x, oy + y, r, "#ff6a2a", "#ffd23a")),
    (ox, oy) => { for (const [x, y, r] of [[40, 46, 28], [88, 44, 24], [64, 88, 27]]) rose(ox + x, oy + y, r, "#f27aa6"); },
  ];
  cells.forEach((paintCell, i) => {
    const ox = (i % 4) * C, oy = Math.floor(i / 4) * C;
    g.save();
    g.beginPath();
    g.rect(ox + 3, oy + 3, C - 6, C - 6);
    g.clip();
    paintCell(ox, oy);
    g.restore();
  });
  return c;
}
// The texture rectangle [u0, v0, u1, v1] of an atlas cell (texture v runs up the canvas).
export function flowerCell(i: number): [number, number, number, number] {
  const col = i % 4, row = Math.floor(i / 4), e = 0.004;
  return [col / 4 + e, 1 - (row + 1) / 4 + e, (col + 1) / 4 - e, 1 - row / 4 - e];
}

const DETAIL = { crag, wood, stone, plaster, fabric, metal, bark, shingles, sandstone, adobe, cobble, tiles, thatch, snow, ice, paper, bamboo, marble, brick, felt, ribs, foliage };
export type DetailMap = keyof typeof DETAIL;
// A fresh copy of a detail map's canvas (grey, one tile per metre).
export const detailCanvas = (name: DetailMap): HTMLCanvasElement => DETAIL[name]();
// glow: emissive colour (crystals, lanterns); opacity < 1 makes it see-through (ice, glass).
// card: an alpha-cut leaf or flower card (see leafCard / flowerAtlas) instead of a tiling map.
export type Recipe = { map?: DetailMap; card?: CardKind; tint: string; rough?: number; metal?: number; bump?: number; glow?: string; glowI?: number; opacity?: number };
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
  // bushes, hedges and flower beds: the leafy mass inside, leaf cards from shade to sun, the
  // strap leaves of a flower clump and the flowers themselves (src/world3d/trees.ts: shrub)
  FoliageCore: { map: "foliage", tint: "#5a9040", rough: 0.95, bump: 1.5 },
  LeafCardDark: { card: "leaves", tint: "#487c36", rough: 0.85 },
  LeafCard: { card: "leaves", tint: "#5e9a3c", rough: 0.8 },
  LeafCardLight: { card: "leaves", tint: "#8cc250", rough: 0.75 },
  TuftCard: { card: "tuft", tint: "#78b04e", rough: 0.8 },
  TuftCardDark: { card: "tuft", tint: "#548c3a", rough: 0.85 },
  FlowerCards: { card: "flowers", tint: "#ffffff", rough: 0.7 },
  JungleCore: { map: "foliage", tint: "#3c7a3c", rough: 0.9, bump: 1.5 },
  JungleLeafDark: { card: "broad", tint: "#2f6a36", rough: 0.6 },
  JungleLeaf: { card: "broad", tint: "#4c9244", rough: 0.55 },
  JungleLeafLight: { card: "broad", tint: "#86c25a", rough: 0.5 },
  BarkBirch: { map: "bark", tint: "#e6e2d8", bump: 2 },
  BarkPalm: { map: "bark", tint: "#9a7a52", bump: 3 },
  WaterSea: { tint: "#2f6f8f", rough: 0.08, opacity: 0.9 },
  // cliff faces (src/world3d/terrain.ts)
  CliffRock: { map: "crag", tint: "#a89c8a", bump: 4 },
  CliffMoss: { map: "crag", tint: "#949c80", bump: 4 },
  CliffSnow: { map: "crag", tint: "#c9d3dc", bump: 3 },
  CliffSand: { map: "crag", tint: "#d0a66e", bump: 4 },
  CliffRed: { map: "crag", tint: "#b06a46", bump: 4 },
  CliffBasalt: { map: "crag", tint: "#4a4446", bump: 4 },
};

// Kits can add their own materials (a name used by their meshes and a recipe).
export function defineMaterial(name: string, recipe: Recipe): void {
  if (!RECIPES[name]) RECIPES[name] = recipe;
}

const maps = new Map<string, THREE.Texture>();
const mats = new Map<string, THREE.MeshStandardMaterial>();
const cardMaps = new Map<CardKind, THREE.Texture>();
const CARD_NORMAL = THREE.ShaderChunk.normal_fragment_begin.replace("normal *= faceDirection;", "");
function cardShader(shader: THREE.WebGLProgramParametersWithUniforms): void {
  shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_begin>", CARD_NORMAL);
}

// The shared material for an Oriverse material name.
export function material(name: string): THREE.MeshStandardMaterial {
  let m = mats.get(name);
  if (m) return m;
  const r = RECIPES[name] ?? { tint: "#ff00ff" };
  m = new THREE.MeshStandardMaterial({ color: r.tint, roughness: r.rough ?? 0.9, metalness: r.metal ?? 0 });
  if (r.card) {
    // both faces lit alike by the normals the card was given (they point out of its bush), so
    // a clump shades like one soft ball instead of flickering light and dark card by card
    let t = cardMaps.get(r.card);
    if (!t) {
      t = new THREE.CanvasTexture(r.card === "flowers" ? flowerAtlas() : leafCard(r.card));
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      cardMaps.set(r.card, t);
    }
    m.map = t;
    m.alphaTest = 0.5;
    m.side = THREE.DoubleSide;
    m.onBeforeCompile = cardShader;
  }
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
export function groundTexture(kind: string, srgb = true): THREE.CanvasTexture {
  const g = GROUNDS[kind] ?? GROUNDS.grass;
  const n = fbm([[6, 1], [24, 0.6], [96, 0.35]], g.seed), m = noise(48, g.seed + 6);
  return texture(paint((u, v) => {
    let t = n(u, v);
    if (g.ripple) t = t * 0.7 + 0.3 * (0.5 + 0.5 * Math.sin((v * 9 + n(u, v) * 3) * Math.PI * 2));
    if (g.speck && m(u, v) > 0.84) return g.speck;
    return g.a.map((x, i) => (x + (g.b[i] - x) * t) * (0.94 + (m(u * 2, v * 2) - 0.5) * 0.1));
  }, 512), srgb);
}

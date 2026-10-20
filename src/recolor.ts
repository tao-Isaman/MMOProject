// Palette recolouring for dyes and monster variants.

import type { Img } from "./types";
//
// Sprites have a few hundred distinct colours, so every colour is mapped once through the
// rules and the result is looked up per pixel.

export type RGB = [number, number, number];

export function rgbToHsl(r: number, g: number, b: number): RGB {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  h = (((h % 360) + 360) % 360) / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Copy an image into a new canvas with every opaque colour passed through fn(r, g, b, x, y),
// which returns [r, g, b] or null to keep it. Position-dependent rules (fn uses x/y) skip the
// per-colour cache.
export function mapColors(img: Img, fn: (r: number, g: number, b: number, x?: number, y?: number) => RGB | null, { positional = false } = {}): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, c.width, c.height);
  const px = data.data;
  const cache = new Map<number, RGB | null>();
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    let out: RGB | null | undefined;
    if (positional) {
      const p = i / 4;
      out = fn(px[i], px[i + 1], px[i + 2], p % c.width, Math.floor(p / c.width));
    } else {
      const key = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
      out = cache.get(key);
      if (out === undefined) {
        out = fn(px[i], px[i + 1], px[i + 2]);
        cache.set(key, out);
      }
    }
    if (out) {
      px[i] = out[0];
      px[i + 1] = out[1];
      px[i + 2] = out[2];
    }
  }
  g.putImageData(data, 0, 0);
  return c;
}

// Rotate every hue by deg (monster variants).
export function hueShift(img: Img, deg: number, satScale = 1): HTMLCanvasElement {
  return mapColors(img, (r, g, b) => {
    const [h, s, l] = rgbToHsl(r, g, b);
    if (s < 0.08) return null;
    return hslToRgb(h + deg, clamp01(s * satScale), l);
  });
}

// Paint a colour onto a shaded region: keeps each pixel's lightness (so the shading survives),
// takes the dye's hue and saturation. A null hue leaves the colour alone.
export interface Dye {
  hue: number | null;
  sat: number;
  light?: number;
  target?: number;
}

export function dyePixel(r: number, g: number, b: number, dye: Dye | null | undefined): RGB | null {
  if (!dye || dye.hue === null || dye.hue === undefined) return null;
  const [, , l] = rgbToHsl(r, g, b);
  return hslToRgb(dye.hue, dye.sat, clamp01(l + (dye.light || 0)));
}

// White silhouette of an image, for hit flashes.
export function silhouette(img: Img, color = "#ffffff"): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d")!;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

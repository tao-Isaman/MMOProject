// Image loading and the small textures built at runtime.

import type { Atlas, Img } from "./types";

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

// Load { key: url } in parallel, reporting progress as a 0..1 fraction.
export async function loadAll(list: Record<string, string>, onProgress: (f: number) => void): Promise<Record<string, HTMLImageElement>> {
  const keys = Object.keys(list);
  let done = 0;
  const images = await Promise.all(
    keys.map((k) =>
      loadImage(list[k]).then((img) => {
        onProgress(++done / keys.length);
        return img;
      }),
    ),
  );
  return Object.fromEntries(keys.map((k, i) => [k, images[i]]));
}

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// Halved copies of an image, so small on-screen sprites sample a texture close to their size
// (canvas drawImage does no mipmapping and shimmers when shrinking a large texture a lot).
export function mipChain(img: Img, levels: number): Img[] {
  const chain: Img[] = [img];
  for (let i = 1; i < levels; i++) {
    const prev = chain[i - 1];
    const c = canvas(Math.max(1, prev.width >> 1), Math.max(1, prev.height >> 1));
    const g = c.getContext("2d")!;
    g.imageSmoothingQuality = "high";
    g.drawImage(prev, 0, 0, c.width, c.height);
    chain.push(c);
  }
  return chain;
}

// Pre-rotated, ground-projected copies of an atlas: row = atlas frame, column = one of
// `turns` rotations, each cell squashed by cos 45 like a sprite lying on the ground.
export function bakeGround(img: Img, cols: number, rows: number, cell: number, turns: number, levels: number): Atlas {
  const src = img.width / cols;
  const ch = Math.round(cell * Math.SQRT1_2);
  const c = canvas(cell * turns, ch * cols * rows);
  const g = c.getContext("2d")!;
  g.imageSmoothingQuality = "high";
  for (let f = 0; f < cols * rows; f++) {
    for (let t = 0; t < turns; t++) {
      g.setTransform(1, 0, 0, Math.SQRT1_2, (t + 0.5) * cell, (f + 0.5) * ch);
      g.rotate((t / turns) * Math.PI * 2);
      g.drawImage(img, (f % cols) * src, Math.floor(f / cols) * src, src, src, -cell / 2, -cell / 2, cell, cell);
    }
  }
  return { levels: mipChain(c, levels), cols: turns, rows: cols * rows };
}

// Soft round glow in one colour (the GlowDot texture of the Oriverse spell).
export function glow(color: string, size = 64): HTMLCanvasElement {
  const c = canvas(size, size);
  const g = c.getContext("2d")!;
  const r = size / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.18, color);
  grad.addColorStop(0.55, color.replace(/[\d.]+\)$/, (a) => `${parseFloat(a) * 0.35})`));
  grad.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

// Multiply an image's colour by a tint, keeping its alpha.
export function tint(img: Img, color: string): HTMLCanvasElement {
  const c = canvas(img.width, img.height);
  const g = c.getContext("2d")!;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = "multiply";
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = "destination-in";
  g.drawImage(img, 0, 0);
  return c;
}

// Pixel art effects from pixelfx (https://github.com/patch-gg/pixelfx, MIT, after Hugo Duprez's
// Sprite Fusion effects): baked by tools/pixelfx_bake.mjs into sprite sheets in assets/fx, listed
// in assets/fx/pixelfx.json, and played here as animated sprites in the particle system's sorted
// layer (normal blend, drawn crisp). Each sheet stands on its pivot (the effect's origin, the
// floor for ground effects) at the point given, and faces right unless flipped.

import { loadImage } from "./assets";
import { SORTED } from "./particles";
import type { Particles, Sheet } from "./particles";

interface Entry { fps: number; frames: number; w: number; h: number; cols: number; pivot: [number, number] }
const SHEETS = new Map<string, Sheet>();

// Starts loading every sheet; an effect asked for before its sheet is in is skipped.
export async function loadPixelFx(): Promise<void> {
  try {
    const list = (await (await fetch("assets/fx/pixelfx.json")).json()) as Record<string, Entry>;
    await Promise.all(Object.entries(list).map(async ([name, e]) => {
      const img = await loadImage(`assets/fx/${name}.png`);
      SHEETS.set(name, { img, ...e });
    }));
  } catch {
    // no effects: the game plays on with its own particles
  }
}

export function hasPixelFx(name: string): boolean {
  return SHEETS.has(name);
}

// A sheet's frame width (px), 0 before it is in.
export function pixelFxWidth(name: string): number {
  return SHEETS.get(name)?.w ?? 0;
}

// At most this many play at once (a storm hitting a crowd would bury the screen), newest skipped.
const MAX_LIVE = 36;
const ends: number[] = [];

// Play one: at (x, y, z) (world cm), `width` map px across, faster with rate, mirrored by flip.
export function pixelFx(fx: Particles, name: string, x: number, y: number, z: number, width: number, o: { flip?: boolean; rate?: number } = {}): void {
  const sheet = SHEETS.get(name);
  if (!sheet) return;
  const rate = o.rate ?? 1, now = performance.now(), life = sheet.frames / (sheet.fps * rate);
  for (let i = ends.length - 1; i >= 0; i--) if (ends[i] <= now) ends.splice(i, 1);
  if (ends.length >= MAX_LIVE) return;
  ends.push(now + life * 1000);
  fx.add({ x, y, z, layer: SORTED, sheet, rate, flipX: o.flip, life, size: [[0, width], [1, width]], alpha: [[0, 1], [1, 1]] });
}

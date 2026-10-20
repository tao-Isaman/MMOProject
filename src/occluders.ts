// Things that stand up from the ground (trees, the house, the well, carts, bushes...) cut out of
// the map, one set per camera angle (tools/occluders.py). The map already shows them; drawing a
// cutout again over a character that stands behind it puts the character behind the tree or
// the house. Each cutout carries the depth (map y) of the front of its footprint and is sorted
// with the characters; it turns see-through while it hides the player.

import { loadImage } from "./assets";
import { yaw } from "./projection";
import type { Img, View } from "./types";

// One cutout: where it sits in the atlas (sx, sy) and on the map (mx, my), its size, the map y
// of its footprint's front, and a coarse solid/clear grid ("1"/"0" rows).
export interface Cutout {
  kind: string;
  sx: number;
  sy: number;
  mx: number;
  my: number;
  w: number;
  h: number;
  depth: number;
  mask?: string[];
}

interface CutoutSet {
  atlas: string;
  items: Cutout[];
  image?: Img;
}

export interface OccluderData {
  yaws: Record<string, CutoutSet>;
}

export class Occluders {
  // data: assets/maps/occluders.json { yaws: { "<yaw>": { atlas, items: [{ sx, sy, w, h, mx, my, depth }] } } }
  data: OccluderData | null;
  atlases: Promise<Img | null>[] = [];

  constructor(data: OccluderData | null) {
    this.data = data;
  }

  load(k: number): Promise<Img | null> {
    const set = this.data?.yaws?.[k];
    if (!set) return Promise.resolve(null);
    this.atlases[k] ??= loadImage(`assets/maps/${set.atlas}`).then((img) => (set.image = img));
    return this.atlases[k];
  }

  // Cutouts for the current camera angle (empty until its atlas has loaded).
  get items(): Cutout[] {
    const set = this.data?.yaws?.[yaw];
    return set?.image ? set.items : [];
  }

  get image(): Img | undefined {
    return this.data?.yaws?.[yaw]?.image;
  }

  // Whether the cutout has solid pixels over a map box (its alpha mask, sampled coarsely).
  covers(it: Cutout, box: { x: number; y: number; w: number; h: number }): boolean {
    const m = it.mask;
    if (!m) return true;
    const cols = m[0].length, rows = m.length;
    for (let r = 0; r < rows; r++) {
      const y = it.my + ((r + 0.5) * it.h) / rows;
      if (y < box.y || y > box.y + box.h) continue;
      for (let c = 0; c < cols; c++) {
        const x = it.mx + ((c + 0.5) * it.w) / cols;
        if (x >= box.x && x <= box.x + box.w && m[r][c] === "1") return true;
      }
    }
    return false;
  }

  // Draw one cutout at its place on the map; `hides` is the player's screen box in map px
  // when the cutout covers the player.
  draw(ctx: CanvasRenderingContext2D, view: View, it: Cutout, hides: boolean): void {
    const { k, ox, oy } = view;
    if (!this.image) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (hides) ctx.globalAlpha = 0.5;
    ctx.drawImage(this.image, it.sx, it.sy, it.w, it.h, it.mx * k + ox, it.my * k + oy, it.w * k, it.h * k);
    ctx.globalAlpha = 1;
  }
}

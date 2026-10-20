// Things that stand up from the ground (trees, the house, the well, carts, bushes...) cut out of
// the map, one set per camera angle (tools/occluders.py). The map already shows them; drawing a
// cutout again over a character that stands behind it puts the character behind the tree or
// the house. Each cutout carries the depth (map y) of the front of its footprint and is sorted
// with the characters; it turns see-through while it hides the player.

import { loadImage } from "./assets.js";
import { yaw } from "./projection.js";

export class Occluders {
  // data: assets/maps/occluders.json { yaws: { "<yaw>": { atlas, items: [{ sx, sy, w, h, mx, my, depth }] } } }
  constructor(data) {
    this.data = data;
    this.atlases = [];
  }

  load(k) {
    const set = this.data?.yaws?.[k];
    if (!set) return Promise.resolve(null);
    this.atlases[k] ??= loadImage(`assets/maps/${set.atlas}`).then((img) => (set.image = img));
    return this.atlases[k];
  }

  // Cutouts for the current camera angle (empty until its atlas has loaded).
  get items() {
    const set = this.data?.yaws?.[yaw];
    return set?.image ? set.items : [];
  }

  get image() {
    return this.data?.yaws?.[yaw]?.image;
  }

  // Whether the cutout has solid pixels over a map box (its alpha mask, sampled coarsely).
  covers(it, box) {
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
  draw(ctx, view, it, hides) {
    const { k, ox, oy } = view;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (hides) ctx.globalAlpha = 0.5;
    ctx.drawImage(this.image, it.sx, it.sy, it.w, it.h, it.mx * k + ox, it.my * k + oy, it.w * k, it.h * k);
    ctx.globalAlpha = 1;
  }
}

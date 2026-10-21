// The courtyard for a camera that turns freely (tools/scene360.py builds the files):
//
// - ground: one image of the courtyard without anything standing on it (terrain, paths,
//   flowers, with the shadows of the objects baked in), captured at yaw 0. It lies flat, so
//   any heading shows it through an affine transform (projection.ts groundTransform).
// - props: everything that stands up (house, trees, hedges, the gazebo...), cut out of captures
//   taken from `headings` evenly spaced headings. Each is drawn upright at its base point
//   from the nearest captured heading, cross-fading near the halfway angle, and sorted by
//   the front of its footprint with the characters, so a character can walk behind a tree.
//   A prop turns see-through while it hides the player.
//
// Without public/assets/maps/scene.json the old single map (map_y0.jpg, objects painted in)
// is the ground and the camera can't turn.

import { loadImage } from "./assets";
import { groundTransform, mapX, mapY, yaw } from "./projection";
import type { Img, View } from "./types";

// One prop as seen from one captured heading: its cutout in atlas `a`, where its base centre
// sits inside the cutout, and a coarse solid/clear grid ("1"/"0" rows) of the cutout.
export interface PropView {
  a: number;
  sx: number;
  sy: number;
  w: number;
  h: number;
  ax: number;
  ay: number;
  mask?: string[];
}

export interface Prop {
  kind: string;
  x: number;               // base centre, world cm
  y: number;
  foot: [number, number][]; // footprint outline, world cm
  views: (PropView | null)[];
}

export interface SceneData {
  ground: { image: string; x0: number; y0: number };
  headings: number;
  atlases: string[];
  props: Prop[];
}

// A prop placed for this frame: which views to draw with what weight, its screen box (map
// px, from the stronger view) and its depth.
export interface Placed {
  prop: Prop;
  depth: number;
  parts: { v: PropView; x: number; y: number; alpha: number }[];
  box: { x: number; y: number; w: number; h: number };
  main: PropView;
}

const LEGACY: SceneData = { ground: { image: "map_y0.jpg", x0: -2048, y0: -1536 }, headings: 1, atlases: [], props: [] };

export class Scene {
  data: SceneData;
  ground: Img | null = null;
  atlases: (Img | null)[] = [];
  ready = false;

  constructor(data: SceneData | null) {
    this.data = data ?? LEGACY;
  }

  // Whether the camera may turn (the full scene files are there).
  get turns(): boolean {
    return this.data !== LEGACY;
  }

  async load(): Promise<void> {
    const d = this.data;
    const [ground, ...atlases] = await Promise.all([
      loadImage(`assets/maps/${d.ground.image}`),
      ...d.atlases.map((a) => loadImage(`assets/maps/${a}`).catch(() => null)),
    ]);
    this.ground = ground;
    this.atlases = atlases;
    this.ready = true;
  }

  drawGround(ctx: CanvasRenderingContext2D, view: View): void {
    if (!this.ground) return;
    const [a, b, c, d, e, f] = groundTransform(this.data.ground.x0, this.data.ground.y0);
    const { k, ox, oy } = view;
    ctx.setTransform(a * k, b * k, c * k, d * k, e * k + ox, f * k + oy);
    ctx.drawImage(this.ground, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Every prop for the current heading.
  place(): Placed[] {
    const n = this.data.headings, out: Placed[] = [];
    if (!this.ready || !n) return out;
    const t = yaw / ((Math.PI * 2) / n);
    const k0 = Math.floor(t) % n, k1 = (k0 + 1) % n, f = t - Math.floor(t);
    // cross-fade only around the halfway angle, so most of the time one view shows alone
    const u = Math.min(1, Math.max(0, (f - 0.4) / 0.2)), w1 = u * u * (3 - 2 * u);
    for (const prop of this.data.props) {
      const bx = mapX(prop.x, prop.y), by = mapY(prop.x, prop.y);
      const parts: Placed["parts"] = [];
      const add = (v: PropView | null, alpha: number) => {
        if (v && alpha > 0.002 && this.atlases[v.a]) parts.push({ v, x: bx - v.ax, y: by - v.ay, alpha });
      };
      // both views stay opaque through the middle of the fade (no see-through ghost), the
      // stronger one on top
      const v0 = prop.views[k0], v1 = prop.views[k1];
      if (v0 && v1) {
        const a0 = Math.min(1, 2 * (1 - w1)), a1 = Math.min(1, 2 * w1);
        if (w1 > 0.5) {
          add(v0, a0);
          add(v1, a1);
        } else {
          add(v1, a1);
          add(v0, a0);
        }
      } else add(v0 ?? v1, 1);
      if (!parts.length) continue;
      const main = parts[parts.length - 1];
      let depth = -Infinity;
      for (const [x, y] of prop.foot) depth = Math.max(depth, mapY(x, y));
      out.push({ prop, depth, parts, main: main.v, box: { x: main.x, y: main.y, w: main.v.w, h: main.v.h } });
    }
    return out;
  }

  // Whether a placed prop has solid pixels over a map box (its mask, sampled coarsely).
  covers(p: Placed, box: { x: number; y: number; w: number; h: number }): boolean {
    const b = p.box;
    if (box.x > b.x + b.w || box.x + box.w < b.x || box.y > b.y + b.h || box.y + box.h < b.y) return false;
    const m = p.main.mask;
    if (!m) return true;
    const cols = m[0].length, rows = m.length;
    for (let r = 0; r < rows; r++) {
      const y = b.y + ((r + 0.5) * b.h) / rows;
      if (y < box.y || y > box.y + box.h) continue;
      for (let c = 0; c < cols; c++) {
        const x = b.x + ((c + 0.5) * b.w) / cols;
        if (x >= box.x && x <= box.x + box.w && m[r][c] === "1") return true;
      }
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D, view: View, p: Placed, hides: boolean): void {
    const { k, ox, oy } = view;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const { v, x, y, alpha } of p.parts) {
      ctx.globalAlpha = alpha * (hides ? 0.45 : 1);
      ctx.drawImage(this.atlases[v.a]!, v.sx, v.sy, v.w, v.h, x * k + ox, y * k + oy, v.w * k, v.h * k);
    }
    ctx.globalAlpha = 1;
  }
}

// What monsters leave behind: their loot lies on the ground round where they fell until the
// player walks over it (the bot can be told to fetch it). It blinks for a while before it fades,
// and goes when the map changes. Gold still goes straight into the purse.

import { resolve } from "./world";
import { mapX, mapY } from "./projection";
import type { Img, Vec2, View } from "./types";

export const PICK_RANGE = 70; // cm: walking this close picks a thing up
const LIFE = 120;             // s it lies there
const BLINK = 12;             // s of blinking at the end
const SIZE = 34;              // map px: the icon

export interface Loot extends Vec2 {
  id: string;   // item id
  t: number;    // s on the ground
  seed: number; // its own bob
}

export class Ground {
  items: Loot[] = []; // the same array for good (the bot holds it)

  // Drop an item a little way from `at`, out of any solid.
  drop(id: string, at: Vec2): void {
    const a = Math.random() * Math.PI * 2, d = 20 + Math.random() * 50;
    const p = { x: at.x + Math.cos(a) * d, y: at.y + Math.sin(a) * d };
    resolve(p, 12);
    this.items.push({ id, x: p.x, y: p.y, t: 0, seed: Math.random() * 10 });
  }

  update(dt: number): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.items[i].t += dt;
      if (this.items[i].t >= LIFE) this.items.splice(i, 1);
    }
  }

  clear(): void {
    this.items.length = 0;
  }

  take(l: Loot): void {
    const i = this.items.indexOf(l);
    if (i >= 0) this.items.splice(i, 1);
  }

  // The things within reach of a point.
  within(p: Vec2, r = PICK_RANGE): Loot[] {
    return this.items.filter((l) => Math.hypot(l.x - p.x, l.y - p.y) <= r);
  }

  // The thing whose icon is under a map point (map px), if any.
  at(mx: number, my: number): Loot | null {
    let best: Loot | null = null, bestD = Infinity;
    for (const l of this.items) {
      const lx = mapX(l.x, l.y), ly = mapY(l.x, l.y);
      if (Math.abs(mx - lx) > SIZE * 0.7 || my < ly - SIZE * 1.6 || my > ly + 10) continue;
      const d = Math.hypot(mx - lx, my - (ly - SIZE * 0.6));
      if (d < bestD) [best, bestD] = [l, d];
    }
    return best;
  }

  // The billboard it is drawn into (world3d actor box).
  static box(l: Loot): { x: number; y: number; w: number; h: number; foot: number } {
    return { x: l.x, y: l.y, w: 70, h: 90, foot: 16 };
  }

  // One thing: its icon bobbing over a soft shadow, blinking before it goes.
  draw(ctx: CanvasRenderingContext2D, v: View, l: Loot, img: Img): void {
    if (LIFE - l.t < BLINK && Math.floor(l.t * 5) % 2) return;
    const k = v.k, gx = mapX(l.x, l.y) * k + v.ox, gy = mapY(l.x, l.y) * k + v.oy;
    const bob = (3 + 3 * Math.sin(l.t * 3 + l.seed)) * k, s = SIZE * k;
    ctx.fillStyle = "rgba(10, 20, 6, 0.35)";
    ctx.beginPath();
    ctx.ellipse(gx, gy, s * 0.42, s * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    // a faint ring of light so it shows on busy ground
    const glow = ctx.createRadialGradient(gx, gy - s * 0.5 - bob, 0, gx, gy - s * 0.5 - bob, s * 0.7);
    glow.addColorStop(0, "rgba(255, 244, 196, 0.45)");
    glow.addColorStop(1, "rgba(255, 244, 196, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(gx - s, gy - s * 1.3 - bob, s * 2, s * 1.6);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, gx - s / 2, gy - s - bob, s, s);
  }
}

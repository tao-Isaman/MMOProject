// A small particle system in world space (sim centimetres, Z up), drawn through the map projection.
//
// Layers, in draw order:
//   GROUND_GLOW  additive, lying on the ground (rune circle, flash, ripples)
//   SORTED       normal blend, depth-sorted against the player (flowers, petals)
//   AIR_GLOW     additive, over everything (light streaks, sparkles, motes)

import { S2, mapX, mapY } from "./projection";
import type { Atlas, Curve, Img, View } from "./types";
import type { GroundSprite } from "./world3d/view";

export const GROUND_GLOW = 0;
export const SORTED = 1;
export const AIR_GLOW = 2;

const MAX_PARTICLES = 12000;

export const rand = (a: number, b: number): number => a + Math.random() * (b - a);

// Particles that lie on the ground, as sprites for the 3D view to lay there (World3D.ground), so
// characters stand on them: glows add light (add), the rest is laid over. Flowers baked for the
// 2D view (`baked`) come from `flowers`, the same atlas seen from straight above.
export function groundSprites(particles: Particle[], add: boolean, flowers: Atlas): GroundSprite[] {
  const out: GroundSprite[] = [];
  const cell = (a: Atlas, f: number): [number, number, number, number] => {
    const c = f % a.cols, r = Math.floor(f / a.cols);
    return [c / a.cols, r / a.rows, (c + 1) / a.cols, (r + 1) / a.rows];
  };
  for (const p of particles) {
    const u = p.age / p.life, alpha = Math.min(1, curve(p.alpha, u)), size = curve(p.size, u);
    if (alpha <= 0.003 || size <= 0.05) continue;
    const at = { x: p.x, y: p.y, size, alpha, add };
    if (p.baked) out.push({ ...at, img: flowers.levels[0], uv: cell(flowers, p.frame ?? 0), rot: ((p.turn ?? 0) / p.baked.cols) * Math.PI * 2 });
    else if (p.atlas) out.push({ ...at, img: p.atlas.levels[0], uv: cell(p.atlas, p.frame ?? 0), rot: p.rot });
    else if (p.tex) out.push({ ...at, img: p.tex, uv: [0, 0, 1, 1], rot: p.rot });
  }
  return out;
}

// Piecewise-linear curve over normalised life, as [[t, value], ...] (the Oriverse sequences).
export function curve(points: Curve, t: number): number {
  if (t <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [t1, v1] = points[i];
    if (t <= t1) {
      const [t0, v0] = points[i - 1];
      return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0 || 1);
    }
  }
  return points[points.length - 1][1];
}

// Accumulates fractional spawns so a rate of N per second stays exact at any frame rate.
export class Emitter {
  rate: number;
  start: number;
  end: number;
  spawn: () => void;
  acc = 0;

  constructor(rate: number, start: number, duration: number, spawn: () => void) {
    this.rate = rate;
    this.start = start;
    this.end = start + duration;
    this.spawn = spawn;
  }
  update(t: number, dt: number): void {
    const a = Math.max(t - dt, this.start), b = Math.min(t, this.end);
    if (b <= a) return;
    this.acc += (b - a) * this.rate;
    while (this.acc >= 1) {
      this.acc -= 1;
      this.spawn();
    }
  }
  done(t: number): boolean {
    return t >= this.end;
  }
}

// A baked pixel art effect (src/pixelfx.ts): frames of w x h in a grid of cols, played at fps,
// standing on its pivot (px in the frame).
export interface Sheet { img: Img; fps: number; frames: number; w: number; h: number; cols: number; pivot: [number, number] }

// What callers pass to Particles.add; the motion fields default to zero.
export interface ParticleSpec {
  x: number;
  y: number;
  z: number;
  life: number;
  layer: number;
  size: Curve;
  alpha: Curve;
  tex?: Img;
  atlas?: Atlas;
  baked?: Atlas;  // ground atlas from assets.ts bakeGround
  frame?: number;
  turn?: number;
  flat?: boolean; // lies on the ground plane
  age?: number;   // negative: born later
  vx?: number;
  vy?: number;
  vz?: number;
  az?: number;
  drag?: number;
  turb?: number;
  turbScale?: number;
  rot?: number;
  spin?: number;
  squash?: number;
  sheet?: Sheet;   // an animated pixel art effect: size is its width, drawn crisp on its pivot
  rate?: number;   // the sheet's playback speed
  flipX?: boolean; // the sheet mirrored (its effects face right)
}

export interface Particle extends ParticleSpec {
  age: number;
  vx: number;
  vy: number;
  vz: number;
  az: number;
  drag: number;
  turb: number;
  turbScale: number;
  rot: number;
  spin: number;
  squash: number;
  seed: number;
  depth?: number; // set while depth-sorting
}

export class Particles {
  list: Particle[] = [];
  time = 0;

  add(spec: ParticleSpec): Particle | null {
    const p = spec as Particle;
    if (this.list.length >= MAX_PARTICLES) return null;
    p.age = p.age ?? 0;
    p.vx = p.vx ?? 0; p.vy = p.vy ?? 0; p.vz = p.vz ?? 0;
    p.az = p.az ?? 0;
    p.drag = p.drag ?? 0;
    p.turb = p.turb ?? 0;
    p.turbScale = p.turbScale ?? 120;
    p.rot = p.rot ?? 0;
    p.spin = p.spin ?? 0;
    p.squash = p.squash ?? 1;
    p.seed = Math.random() * 100;
    this.list.push(p);
    return p;
  }

  update(dt: number): void {
    this.time += dt;
    const t = this.time;
    const list = this.list;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.age += dt;
      if (p.age >= p.life) {
        list[i] = list[list.length - 1];
        list.pop();
        continue;
      }
      if (p.age < 0) continue; // not born yet (delayed)
      if (p.turb) {
        const k = 1 / p.turbScale, s = p.seed;
        p.vx += p.turb * Math.sin(p.y * k + t * 1.3 + s) * dt;
        p.vy += p.turb * Math.cos(p.x * k + t * 1.1 + s * 1.7) * dt;
        p.vz += p.turb * 0.5 * Math.sin((p.x + p.y) * k + t * 1.7 + s * 2.3) * dt;
      }
      p.vz += p.az * dt;
      if (p.drag) {
        const f = Math.exp(-p.drag * dt);
        p.vx *= f; p.vy *= f; p.vz *= f;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.z < 0) { p.z = 0; p.vz = 0; }
      p.rot += p.spin * dt;
    }
  }

  // Living particles of one layer, in insertion order.
  layer(layer: number): Particle[] {
    return this.list.filter((p) => p.layer === layer && p.age >= 0);
  }

  // view: { k: device px per map px, ox, oy: device offset of the map origin, w, h, mipFor }
  //
  // Sprites that need no rotation are drawn axis-aligned under an identity transform, which is
  // several times cheaper than a transformed draw when the canvas falls back to the CPU. Ground
  // flowers use `baked`: an atlas already rotated and squashed onto the ground plane.
  draw(ctx: CanvasRenderingContext2D, view: View, particles: Particle[]): void {
    const { k, ox, oy, mipFor } = view;
    let identity = false;
    for (const p of particles) {
      const u = p.age / p.life;
      const a = curve(p.alpha, u);
      const s = curve(p.size, u);
      if (a <= 0.003 || s <= 0.05) continue;
      const mx = mapX(p.x, p.y) * k + ox;
      const my = mapY(p.x, p.y, p.z) * k + oy;
      const r = s * k;
      const reach = r * Math.max(1, p.squash);
      if (mx < -reach || my < -reach || mx > view.w + reach || my > view.h + reach) continue;
      ctx.globalAlpha = a > 1 ? 1 : a;

      if (p.sheet) {
        const sh = p.sheet, f = Math.min(sh.frames - 1, Math.floor(p.age * sh.fps * (p.rate ?? 1)));
        // (bigger than its frames: a whole number of screen pixels to each of its own, so it stays crisp)
        const w = r > sh.w ? sh.w * Math.round(r / sh.w) : r, h = (w * sh.h) / sh.w;
        ctx.setTransform(p.flipX ? -1 : 1, 0, 0, 1, mx, my);
        identity = false;
        const smooth = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sh.img, (f % sh.cols) * sh.w, Math.floor(f / sh.cols) * sh.h, sh.w, sh.h, (-sh.pivot[0] / sh.w) * w, (-sh.pivot[1] / sh.h) * h, w, h);
        ctx.imageSmoothingEnabled = smooth;
        continue;
      }

      if (p.baked || (p.rot === 0 && p.spin === 0)) {
        if (!identity) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          identity = true;
        }
        const h = r * (p.baked || p.flat ? S2 : p.squash);
        if (p.baked) {
          const b = p.baked, lvl = mipFor(b, r), img = b.levels[lvl];
          const cw = img.width / b.cols, ch = img.height / b.rows;
          ctx.drawImage(img, (p.turn ?? 0) * cw, (p.frame ?? 0) * ch, cw, ch, mx - r / 2, my - h / 2, r, h);
        } else if (p.tex) {
          ctx.drawImage(p.tex, mx - r / 2, my - h / 2, r, h);
        }
        continue;
      }

      identity = false;
      const c = Math.cos(p.rot) * r, sn = Math.sin(p.rot) * r;
      if (p.flat) ctx.setTransform(c, S2 * sn, -sn, S2 * c, mx, my);
      else ctx.setTransform(c, sn, -sn * p.squash, c * p.squash, mx, my);
      if (p.atlas) {
        const img = p.atlas.levels[mipFor(p.atlas, r)];
        const cw = img.width / p.atlas.cols, ch = img.height / p.atlas.rows;
        const f = p.frame ?? 0;
        ctx.drawImage(img, (f % p.atlas.cols) * cw, Math.floor(f / p.atlas.cols) * ch, cw, ch, -0.5, -0.5, 1, 1);
      } else if (p.tex) {
        ctx.drawImage(p.tex, -0.5, -0.5, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }
}

// The circle a spell being cast opens under its caster, like the flower field's (src/spell.ts),
// in the spell's own look (src/circles.ts): it opens with a little overshoot, the rim turns one
// way and the figure the other, faster and brighter as the cast bar fills, while motes of the
// spell's kind rise round it (embers, frost, wisps, leaves, petals, or the void drawing in). A
// sigil turns under what the spell is aimed at and follows it. When the bar fills the circle
// flashes and fades out wide; let go early, it dims and breaks into sparks.

import { Emitter, AIR_GLOW, GROUND_GLOW, SORTED, rand } from "./particles";
import type { Particle, Particles } from "./particles";
import { circleTextures } from "./circles";
import type { CircleLook } from "./circles";
import type { Textures, Vec2 } from "./types";

const OPEN = 0.22;    // s to open
const RELEASED = 0.4; // s to fade after the spell goes off
const BROKEN = 0.3;   // s to break up when let go

// What the sigil lies under: where (null: nowhere now) and how wide.
export interface CastTarget {
  at: () => Vec2 | null;
  size: number;
}

export class CastCircle {
  fx: Particles;
  tex: Textures;
  look: CircleLook;
  caster: Vec2;
  duration: number;
  size: number;
  target: CastTarget | null;
  t = 0;
  end: { t: number; how: "release" | "cancel" } | null = null;
  done = false;
  parts: { glow: Particle | null; rim: Particle | null; figure: Particle | null; sigil: Particle | null };
  emitters: Emitter[];

  constructor(fx: Particles, tex: Textures, look: CircleLook, caster: Vec2, duration: number, size: number, target: CastTarget | null) {
    this.fx = fx;
    this.tex = tex;
    this.look = look;
    this.caster = caster;
    this.duration = duration;
    this.size = size;
    this.target = target;
    const t = circleTextures(look);
    // held for good and posed every frame (size and alpha are one-point curves)
    const held = (img: CanvasImageSource, z: number, spin: number) => fx.add({ x: caster.x, y: caster.y, z, flat: true, layer: GROUND_GLOW,
      tex: img as HTMLCanvasElement, life: 1e9, spin, rot: Math.random() * Math.PI * 2, size: [[0, 0]], alpha: [[0, 0]] });
    this.parts = {
      glow: held(tex.glowFor(look.color), 1, 0),
      rim: held(t.rim, 2, 0.3),
      figure: held(t.figure, 2.5, -0.5),
      sigil: target ? held(t.sigil, 2, 0.9) : null,
    };
    const motes: Record<CircleLook["motes"], () => void> = {
      ember: () => this.ember(), frost: () => this.frost(), wisp: () => this.wisp(), leaf: () => this.leaf(), petal: () => this.petal(), void: () => this.inward(),
    };
    this.emitters = [new Emitter(36, 0, 1e9, () => this.streak()), new Emitter(look.motes === "petal" ? 30 : 46, 0, 1e9, motes[look.motes])];
  }

  update(dt: number): void {
    if (this.done) return;
    this.t += dt;
    const { t, caster } = this;
    const fill = Math.min(1, t / Math.max(0.05, this.duration));
    let scale = backOut(Math.min(1, t / OPEN)), alpha = Math.min(1, t / 0.12) * (0.6 + 0.4 * fill);
    if (this.end) {
      const u = (t - this.end.t) / (this.end.how === "release" ? RELEASED : BROKEN);
      if (u >= 1) return this.finish();
      if (this.end.how === "release") {
        scale *= 1 + 0.25 * u;
        alpha *= 1 - u;
      } else {
        scale *= 1 - 0.12 * u;
        alpha *= (1 - u) * (0.6 + 0.4 * Math.sin(t * 60)); // a guttering flicker
      }
    } else {
      for (const e of this.emitters) e.update(t, dt);
    }
    const pose = (p: Particle | null, x: number, y: number, size: number, a: number, spin?: number) => {
      if (!p) return;
      p.x = x;
      p.y = y;
      p.size[0][1] = size;
      p.alpha[0][1] = a;
      if (spin !== undefined) p.spin = spin;
    };
    const turn = 1 + 1.6 * fill;
    pose(this.parts.glow, caster.x, caster.y, this.size * 1.2 * scale, 0.16 * alpha);
    pose(this.parts.rim, caster.x, caster.y, this.size * scale, alpha, 0.3 * turn);
    pose(this.parts.figure, caster.x, caster.y, this.size * 0.74 * scale, alpha, -0.5 * turn);
    if (this.target && this.parts.sigil) {
      const at = this.target.at();
      const pulse = 1 + 0.05 * Math.sin(t * 9);
      if (at) pose(this.parts.sigil, at.x, at.y, this.target.size * scale * pulse, 0.7 * alpha, 0.9 * turn);
      else pose(this.parts.sigil, caster.x, caster.y, 0, 0);
    }
  }

  // The bar filled: a flash, rings running out, sparks; the circle fades out wide.
  release(): void {
    if (this.end) return;
    this.end = { t: this.t, how: "release" };
    const { fx, tex, look, caster: { x, y } } = this;
    fx.add({ x, y, z: 3, flat: true, layer: GROUND_GLOW, tex: tex.flash, life: 0.5,
      size: [[0, this.size * 0.9], [0.35, this.size * 1.4], [1, this.size * 1.6]], alpha: [[0, 1], [1, 0]] });
    fx.add({ x, y, z: 90, layer: AIR_GLOW, tex: tex.glowFor(look.color), life: 0.4, size: [[0, 60], [0.2, 190], [1, 230]], alpha: [[0, 0.9], [1, 0]] });
    [0, 0.08].forEach((delay, i) => fx.add({ x, y, z: 2, flat: true, layer: GROUND_GLOW, tex: tex.ringFor(look.color), age: -delay, life: 0.6,
      size: [[0, this.size], [1, this.size * (2.4 - i * 0.4)]], alpha: [[0, 0.95 - i * 0.25], [1, 0]] }));
    const spark = tex.glowFor(look.light);
    for (let i = 0; i < 36; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(160, 340);
      fx.add({ x, y, z: rand(20, 50), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rand(40, 200), drag: 1.6,
        layer: AIR_GLOW, tex: spark, life: rand(0.5, 0.9), size: [[0, rand(6, 10)], [1, 2]], alpha: [[0, 1], [1, 0]] });
    }
  }

  // Let go before the bar filled: the circle dims, flickers and breaks into sparks off its rim.
  cancel(): void {
    if (this.end) return;
    this.end = { t: this.t, how: "cancel" };
    const { fx, tex, look, caster: { x, y } } = this;
    const shard = tex.glowFor(look.color);
    for (let i = 0; i < 26; i++) {
      const a = rand(0, Math.PI * 2), r = this.size * 0.45, sp = rand(30, 110);
      fx.add({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, z: rand(4, 14), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rand(20, 90),
        drag: 2, az: -120, layer: AIR_GLOW, tex: shard, life: rand(0.35, 0.65), size: [[0, rand(5, 9)], [1, 1]], alpha: [[0, 0.9], [1, 0]] });
    }
  }

  finish(): void {
    this.done = true;
    for (const p of Object.values(this.parts)) if (p) p.life = p.age; // gone on the next step
  }

  // ---- motes ----
  // A point within the circle (f: share of its radius, at least `min`).
  spot(min = 0, max = 1): Vec2 {
    const a = rand(0, Math.PI * 2), r = (this.size / 2) * Math.sqrt(rand(min * min, max * max));
    return { x: this.caster.x + Math.cos(a) * r, y: this.caster.y + Math.sin(a) * r };
  }

  // light streaking up off the rim
  streak(): void {
    const p = this.spot(0.75, 1);
    this.fx.add({ ...p, z: rand(10, 20), az: 480, layer: AIR_GLOW, tex: this.tex.glowFor(this.look.light), life: rand(0.5, 0.8), squash: 4,
      size: [[0, 7], [0.3, 13], [1, 3]], alpha: [[0, 0], [0.25, 0.75], [1, 0]] });
  }

  ember(): void {
    const p = this.spot(0, 0.95);
    this.fx.add({ ...p, z: rand(4, 12), vz: rand(60, 150), turb: 90, layer: AIR_GLOW, tex: this.tex.glowFor(rand(0, 1) < 0.5 ? this.look.color : "#ffc070"),
      life: rand(0.7, 1.3), size: [[0, rand(6, 11)], [0.6, 6], [1, 1.5]], alpha: [[0, 0], [0.15, 1], [1, 0]] });
  }

  frost(): void {
    const p = this.spot(0, 1);
    this.fx.add({ ...p, z: rand(80, 150), vz: rand(-45, -20), turb: 30, layer: AIR_GLOW, tex: this.tex.glowFor(this.look.light),
      life: rand(1, 1.6), size: [[0, rand(4, 7)], [1, 2]], alpha: [[0, 0], [0.2, 1], [1, 0]] });
    if (Math.random() < 0.3) {
      const q = this.spot(0.3, 1);
      this.fx.add({ ...q, z: 2, flat: true, layer: GROUND_GLOW, tex: this.tex.glowFor(this.look.color), life: rand(0.6, 1),
        size: [[0, 20], [1, 60]], alpha: [[0, 0], [0.3, 0.35], [1, 0]] });
    }
  }

  // wisps circling in toward the middle
  wisp(): void {
    const a = rand(0, Math.PI * 2), r = this.size * 0.48, sp = rand(70, 120);
    this.fx.add({ x: this.caster.x + Math.cos(a) * r, y: this.caster.y + Math.sin(a) * r, z: rand(8, 30),
      vx: -Math.sin(a) * sp - Math.cos(a) * 50, vy: Math.cos(a) * sp - Math.sin(a) * 50, vz: rand(10, 40),
      layer: AIR_GLOW, tex: this.tex.glowFor(this.look.light), life: rand(0.7, 1.1), size: [[0, rand(6, 9)], [1, 2]], alpha: [[0, 0], [0.2, 1], [1, 0]] });
  }

  // green motes spiralling up off the rim
  leaf(): void {
    const a = rand(0, Math.PI * 2), r = this.size * rand(0.3, 0.5), sp = rand(40, 80);
    this.fx.add({ x: this.caster.x + Math.cos(a) * r, y: this.caster.y + Math.sin(a) * r, z: rand(4, 10),
      vx: -Math.sin(a) * sp, vy: Math.cos(a) * sp, vz: rand(40, 90), turb: 60, layer: AIR_GLOW,
      tex: this.tex.glowFor(rand(0, 1) < 0.5 ? this.look.color : this.look.light), life: rand(0.8, 1.3),
      size: [[0, rand(6, 10)], [1, 2]], alpha: [[0, 0], [0.2, 0.95], [1, 0]] });
  }

  // the flower field's petals, swirling up
  petal(): void {
    const a = rand(0, Math.PI * 2), r = this.size * rand(0.2, 0.5), sp = rand(50, 90);
    this.fx.add({ x: this.caster.x + Math.cos(a) * r, y: this.caster.y + Math.sin(a) * r, z: rand(6, 16),
      vx: -Math.sin(a) * sp, vy: Math.cos(a) * sp, vz: rand(30, 70), turb: 80, spin: rand(-3, 3), rot: rand(0, Math.PI * 2),
      layer: SORTED, atlas: this.tex.petals, frame: Math.floor(Math.random() * 4), life: rand(0.9, 1.4),
      size: [[0, 13], [1, 8]], alpha: [[0, 0], [0.12, 1], [1, 0]] });
  }

  // motes pulled in from outside the circle to its heart
  inward(): void {
    const a = rand(0, Math.PI * 2), r = this.size * rand(0.55, 0.7), life = rand(0.55, 0.85);
    this.fx.add({ x: this.caster.x + Math.cos(a) * r, y: this.caster.y + Math.sin(a) * r, z: rand(10, 40),
      vx: (-Math.cos(a) * r) / life, vy: (-Math.sin(a) * r) / life, vz: -10, layer: AIR_GLOW,
      tex: this.tex.glowFor(rand(0, 1) < 0.6 ? this.look.color : this.look.light), life, size: [[0, rand(5, 9)], [1, 3]], alpha: [[0, 0], [0.3, 1], [1, 0.2]] });
  }
}

// Ease out with a little overshoot (the circle snaps open).
function backOut(u: number): number {
  const c = 1.7;
  return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2;
}

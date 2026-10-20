// Flower Field: the Oriverse spell timeline (oriverse/frieren/courtyard.weave) in seconds.
//   0.0 s  rune circle opens under the caster, light streaks and sparkles rise, cast bar fills
//   1.5 s  release: white flash, caster glow, sparks, three ripple rings
//          the carpet blooms ring by ring outward (one ring every 7 frames at 60 fps)
//          each clump lives 4.6 s + 0.2 s per ring, then sheds petals that rise and fade
//   6.0 s  blue-white sparkles drift up while the carpet dissolves

import { Emitter, AIR_GLOW, GROUND_GLOW, SORTED, rand } from "./particles";
import type { Particles } from "./particles";
import type { Curve, Textures } from "./types";

// The caster the spell lifts and lights.
interface Caster {
  x: number;
  y: number;
  z: number;
}

export const CAST_TIME = 1.5;
export const HOVER_END = 7.0; // the caster floats until the carpet starts to clear

const RING_STEP = 7 / 60;
const DISSOLVE_T = 4.6;
const DISSOLVE_STEP = 0.2;
// [ring radius cm, clumps on the ring, flowers per clump]; no centre clump, so the caster
// keeps a small clearing and is never buried in flowers.
const RINGS: [number, number, number][] = [[95, 7, 20], [183, 13, 20], [271, 19, 20], [359, 26, 20], [447, 32, 20]];
const CLUMP_BOX = 100;
const FLOWER_SIZE = 42;
const FLOWER_SIZE_SEQ: Curve = [[0, 0], [0.035, 1.3], [0.065, 0.94], [0.095, 1], [0.5, 1.07], [0.9, 1], [1, 0.55]];
const SPARKLE_AT = CAST_TIME + DISSOLVE_T - 0.1;
const END = 12;

const scaled = (seq: Curve, k: number): Curve => seq.map(([t, v]) => [t, v * k]);

export class FlowerSpell {
  fx: Particles;
  tex: Textures;
  x: number;
  y: number;
  caster: Caster;
  t = 0;
  released = false;
  ringsSpawned = 0;
  clumps: { petals: Emitter }[] = [];
  emitters: Emitter[];

  constructor(fx: Particles, tex: Textures, x: number, y: number, caster: Caster) {
    this.fx = fx;
    this.tex = tex;
    this.x = x;
    this.y = y;
    this.caster = caster;
    this.emitters = [
      new Emitter(55, 0, 1.6, () => this.streak()),
      new Emitter(34, 0, 1.6, () => this.castSparkle()),
      new Emitter(240, SPARKLE_AT, 1.7, () => this.dissolveSparkle()),
    ];
    this.open();
  }

  get done(): boolean {
    return this.t > END;
  }

  update(dt: number): void {
    this.t += dt;
    const t = this.t;
    if (!this.released && t >= CAST_TIME) {
      this.released = true;
      this.release();
    }
    while (this.ringsSpawned < RINGS.length && t >= CAST_TIME + this.ringsSpawned * RING_STEP) {
      this.spawnRing(this.ringsSpawned++);
    }
    for (const e of this.emitters) e.update(t, dt);
    for (const c of this.clumps) c.petals.update(t, dt);
  }

  // --- cast -----------------------------------------------------------------------------
  open(): void {
    const { fx, tex, x, y } = this;
    fx.add({ x, y, z: 2, flat: true, layer: GROUND_GLOW, tex: tex.rune, life: 1.75, spin: 0.3,
      size: [[0, 140], [0.08, 305], [0.14, 280], [1, 280]], alpha: [[0, 0], [0.07, 1], [0.9, 1], [1, 0.6]] });
    fx.add({ x, y, z: 1, flat: true, layer: GROUND_GLOW, tex: tex.mint, life: 1.75,
      size: [[0, 150], [0.1, 360], [1, 360]], alpha: [[0, 0], [0.1, 0.3], [1, 0.34]] });
  }

  streak(): void {
    this.fx.add({ x: this.x + rand(-40, 40), y: this.y + rand(-40, 40), z: rand(15, 25), az: 500,
      layer: AIR_GLOW, tex: this.tex.column, life: rand(0.6, 0.9), squash: 4,
      size: [[0, 8], [0.3, 14], [1, 4]], alpha: [[0, 0], [0.25, 0.8], [1, 0]] });
  }

  castSparkle(): void {
    const [vx, vy, vz] = randomDir(rand(0, 15));
    this.fx.add({ x: this.x + rand(-120, 120), y: this.y + rand(-120, 120), z: rand(20, 30), vx, vy, vz,
      az: 90, turb: 60, layer: AIR_GLOW, tex: this.tex.sparkle, life: rand(0.9, 1.5),
      size: [[0, 5], [0.5, 8], [1, 2]], alpha: [[0, 0], [0.25, 1], [1, 0]] });
  }

  // --- release --------------------------------------------------------------------------
  release(): void {
    const { fx, tex, x, y } = this;
    fx.add({ x, y, z: 3, flat: true, layer: GROUND_GLOW, tex: tex.flash, life: 0.55,
      size: [[0, 280], [0.35, 440], [1, 520]], alpha: [[0, 1], [1, 0]] });
    const lift = this.caster.z;
    fx.add({ x: this.caster.x, y: this.caster.y, z: 85 + lift, layer: AIR_GLOW, tex: tex.flash, life: 0.45,
      size: [[0, 80], [0.2, 220], [1, 260]], alpha: [[0, 0.9], [1, 0]] });
    for (let i = 0; i < 70; i++) {
      const [vx, vy, vz] = randomDir(rand(200, 400), -0.1);
      const n = Math.hypot(vx, vy, vz) || 1;
      fx.add({ x: x + (vx / n) * 30, y: y + (vy / n) * 30, z: 35 + (vz / n) * 30, vx, vy, vz, drag: 0.35,
        layer: AIR_GLOW, tex: tex.sparkle, life: rand(0.6, 1.0), size: [[0, 9], [1, 3]], alpha: [[0, 1], [1, 0]] });
    }
    [0, 0.09, 0.18].forEach((delay, i) => {
      fx.add({ x, y, z: 2, flat: true, layer: GROUND_GLOW, tex: tex.ring, age: -delay, life: 0.65,
        size: [[0, 280], [1, 880 - i * 80]], alpha: [[0, 0.95 - i * 0.2], [1, 0]] });
    });
  }

  spawnRing(r: number): void {
    const [rad, n, per] = RINGS[r];
    const L = DISSOLVE_T + DISSOLVE_STEP * r;
    const size = scaled(FLOWER_SIZE_SEQ, FLOWER_SIZE + r);
    const born = this.t;
    for (let k = 0; k < n; k++) {
      const a = ((360 / n) * k + r * 23 + rand(-6, 6)) * (Math.PI / 180);
      const rr = rad + rand(-20, 20);
      const cx = this.x + rr * Math.cos(a), cy = this.y + rr * Math.sin(a);
      for (let i = 0; i < per; i++) {
        this.fx.add({ x: cx + rand(-CLUMP_BOX / 2, CLUMP_BOX / 2), y: cy + rand(-CLUMP_BOX / 2, CLUMP_BOX / 2), z: rand(2, 8),
          flat: true, layer: SORTED, baked: this.tex.flowers, frame: Math.floor(Math.random() * 9),
          turn: Math.floor(Math.random() * this.tex.flowers.cols), life: L + rand(-0.15, 0.1), size,
          alpha: [[0, 0], [0.006, 1], [0.93, 1], [1, 0]] });
      }
      // the clump sheds its petals just before its flowers fade
      const petals = new Emitter(per / 0.25, born + L - 0.2, 0.25, () => this.petal(cx, cy));
      this.clumps.push({ petals });
    }
  }

  petal(cx: number, cy: number): void {
    // up within a 60 degree cone
    const sp = rand(0, 20), th = rand(0, Math.PI * 2), tilt = rand(0, Math.PI / 3);
    this.fx.add({ x: cx + rand(-CLUMP_BOX / 2, CLUMP_BOX / 2), y: cy + rand(-CLUMP_BOX / 2, CLUMP_BOX / 2), z: rand(8, 20),
      vx: sp * Math.sin(tilt) * Math.cos(th), vy: sp * Math.sin(tilt) * Math.sin(th), vz: sp * Math.cos(tilt),
      az: 45, drag: 1.2, turb: 100, turbScale: 120, spin: rand(-2.5, 2.5), rot: rand(0, Math.PI * 2),
      layer: SORTED, atlas: this.tex.petals, frame: Math.floor(Math.random() * 4), life: rand(1.4, 2.4),
      size: [[0, 15], [1, 9]], alpha: [[0, 0], [0.06, 1], [0.55, 0.85], [1, 0]] });
  }

  dissolveSparkle(): void {
    const r = 480 * Math.sqrt(Math.random()), a = rand(0, Math.PI * 2);
    const [vx, vy, vz] = randomDir(rand(0, 15));
    this.fx.add({ x: this.x + r * Math.cos(a), y: this.y + r * Math.sin(a), z: rand(40, 80), vx, vy, vz,
      az: 70, turb: 80, layer: AIR_GLOW, tex: this.tex.dissolve, life: rand(1.0, 1.8),
      size: [[0, 6], [1, 2]], alpha: [[0, 0], [0.2, 1], [1, 0]] });
  }
}

// Random direction scaled to `speed`; minZ limits how far below the horizon it may point.
function randomDir(speed: number, minZ = -1): [number, number, number] {
  const z = rand(minZ, 1), a = rand(0, Math.PI * 2), s = Math.sqrt(1 - z * z);
  return [s * Math.cos(a) * speed, s * Math.sin(a) * speed, z * speed];
}

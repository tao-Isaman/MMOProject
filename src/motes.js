// Yellow-green motes drifting over the courtyard (the AmbientMotes effect of the Oriverse world),
// spawned around the view so the air is always full wherever the player walks.

import { Emitter, AIR_GLOW, rand } from "./particles.js";

export class Motes {
  constructor(fx, tex) {
    this.fx = fx;
    this.tex = tex;
    this.t = 0;
    this.center = { x: 0, y: 0 };
    this.emitter = new Emitter(22, 0, Infinity, () => this.spawn());
  }

  // Fill the air at once instead of waiting a few seconds for the first motes.
  prewarm() {
    for (let i = 0; i < 100; i++) {
      const p = this.spawn();
      if (p) p.age = Math.random() * p.life * 0.8;
    }
  }

  update(dt, center) {
    this.t += dt;
    this.center = center;
    this.emitter.update(this.t, dt);
  }

  spawn() {
    const sp = rand(5, 20), a = rand(0, Math.PI * 2), vz = rand(-1, 1) * sp * 0.5;
    return this.fx.add({
      x: this.center.x + rand(-900, 900), y: this.center.y + rand(-1000, 1000), z: rand(10, 260),
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz, az: -3, turb: 35, turbScale: 300,
      squash: 1.8, layer: AIR_GLOW, tex: this.tex, life: rand(4, 7),
      size: [[0, 0], [0.15, 11], [0.85, 11], [1, 0]], alpha: [[0, 0], [0.2, 0.6], [0.8, 0.6], [1, 0]],
    });
  }
}

// The elf mage: WASD movement over the courtyard, four facing sprites, hover while casting.

import { mapX, mapY } from "./projection.js";
import { resolve } from "./world.js";

const SPEED = 420;       // cm/s
const RADIUS = 24;       // collision radius, cm
const HEIGHT = 104;      // sprite height on the map, px (= cm)
const STRIDE = 150;      // cm walked per two steps
const HOVER = 24;        // cm the caster floats during the spell
const HOVER_RAMP = 40 / 60;

export class Player {
  constructor(x, y, sprites) {
    this.x = x;
    this.y = y;
    this.z = 0;
    this.sprites = sprites; // { front, back, left, right }
    this.facing = "front";
    this.phase = 0;
    this.moving = false;
    this.time = 0;
    this.cast = null; // { t, duration, hoverEnd, x, y }
  }

  get casting() {
    return !!this.cast && this.cast.t < this.cast.duration;
  }

  startCast(duration, hoverEnd) {
    this.cast = { t: 0, duration, hoverEnd, x: this.x, y: this.y };
    this.facing = "front";
  }

  // move = { x, y }: wanted direction in world axes (W = +X, A = +Y), not normalised
  update(dt, move) {
    this.time += dt;
    let mx = move.x, my = move.y;
    if (this.casting) mx = my = 0; // rooted while the cast bar fills
    const len = Math.hypot(mx, my);
    this.moving = len > 0;
    if (this.moving) {
      mx /= len;
      my /= len;
      const p = { x: this.x + mx * SPEED * dt, y: this.y + my * SPEED * dt };
      resolve(p, RADIUS);
      const walked = Math.hypot(p.x - this.x, p.y - this.y);
      this.x = p.x;
      this.y = p.y;
      this.phase += (walked / STRIDE) * Math.PI * 2;
      // diagonals show the side view
      if (Math.abs(mx) > Math.abs(my)) this.facing = mx > 0 ? "back" : "front";
      else this.facing = my > 0 ? "left" : "right";
    } else {
      this.phase = 0;
    }

    // hover: ramps up with the cast, bobs gently, settles when the carpet clears or when
    // the caster walks off the spell's centre
    let target = 0;
    if (this.cast) {
      const c = this.cast;
      c.t += dt;
      const onSpot = Math.hypot(this.x - c.x, this.y - c.y) < 60;
      if (c.t < c.hoverEnd && onSpot) {
        const ramp = Math.min(1, c.t / HOVER_RAMP, (c.hoverEnd - c.t) / HOVER_RAMP);
        target = ramp * (HOVER + 6 * Math.sin(c.t * (240 * Math.PI) / 180));
      }
      if (c.t >= c.hoverEnd) this.cast = null;
    }
    this.z += (target - this.z) * Math.min(1, dt * 10);
  }

  // Ground point on the map, for depth sorting.
  get depth() {
    return mapY(this.x, 0);
  }

  draw(ctx, view) {
    const { k, ox, oy } = view;
    const gx = mapX(this.y) * k + ox;
    const gy = mapY(this.x, 0) * k + oy;

    // shadow shrinks and fades as she rises
    const lift = Math.max(0, this.z);
    const sr = 30 * (1 - lift / 140) * k;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(16, 30, 10, ${0.34 * (1 - lift / 90)})`;
    ctx.beginPath();
    ctx.ellipse(gx, gy, sr, sr * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    const img = this.sprites[this.facing];
    const h = HEIGHT * k, w = (img.width / img.height) * h;
    let bob = 0, tilt = 0, breathe = 1;
    if (this.moving) {
      bob = Math.abs(Math.sin(this.phase)) * 4 * k;
      tilt = Math.sin(this.phase) * 0.045;
    } else {
      breathe = 1 + 0.012 * Math.sin(this.time * 2.2);
    }
    const fy = mapY(this.x, lift) * k + oy - bob;
    // anchor at the feet so tilt and breathing pivot on the ground
    ctx.setTransform(Math.cos(tilt), Math.sin(tilt), -Math.sin(tilt) * breathe, Math.cos(tilt) * breathe, gx, fy);
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (this.casting) this.drawCastBar(ctx, gx, fy - h - 12 * k, k);
  }

  // Ragnarok-style cast bar over the head.
  drawCastBar(ctx, cx, y, k) {
    const w = 70 * k, h = 9 * k, pad = 1.5 * k;
    const f = Math.min(1, this.cast.t / this.cast.duration);
    ctx.fillStyle = "rgba(10, 14, 20, 0.85)";
    ctx.fillRect(cx - w / 2, y - h, w, h);
    ctx.fillStyle = "#18212c";
    ctx.fillRect(cx - w / 2 + pad, y - h + pad, w - pad * 2, h - pad * 2);
    const grad = ctx.createLinearGradient(0, y - h, 0, y);
    grad.addColorStop(0, "#9bf58c");
    grad.addColorStop(1, "#3fb935");
    ctx.fillStyle = grad;
    ctx.fillRect(cx - w / 2 + pad, y - h + pad, (w - pad * 2) * f, h - pad * 2);
  }
}

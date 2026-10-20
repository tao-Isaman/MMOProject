// The elf mage: WASD movement over the courtyard, 8-direction sprite animation (idle, walk,
// attack), hover while casting.
//
// The idle sheet holds the eight directions of the Oriverse sprite `elf_mage_rest`; walk and
// attack are built from them by tools/animate_sprite.py. Every sheet has one row per
// direction in Oriverse order (front, then clockwise seen from above), one 128 px column per
// frame, pivot at the bottom centre of each cell.

import { mapX, mapY } from "./projection.js";
import { resolve } from "./world.js";

const SPEED = 380;        // cm/s
const RADIUS = 24;        // collision radius, cm
const CELL = 128;         // sprite cell, px
const SCALE = 1.05;       // map px per sprite px
const HEAD = 112;         // sprite px from the pivot up to just above the hair
const WALK_CYCLE = 170;   // cm walked per walk loop (two steps)
const ATTACK_FPS = 14;
const HIT_FRAME = 5;      // attack frame where the staff lands
const WINDUP_FRAME = 3;   // cast holds this attack frame while the cast bar fills
const HOVER = 24;         // cm the caster floats during the spell
const HOVER_RAMP = 40 / 60;

export const DIRECTIONS = ["south", "south-west", "west", "north-west", "north", "north-east", "east", "south-east"];
// staff gem in each direction's cell (sprite px), printed by tools/animate_sprite.py
const GEMS = [[93, 32], [87, 30], [73, 36], [48, 30], [33, 31], [35, 28], [55, 28], [69, 21]];

// World direction (x = +X up the screen, y = +Y screen left) -> sheet row.
export function directionIndex(x, y) {
  const a = Math.atan2(y, -x); // 0 = towards the camera, +90 = screen left
  return ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
}

// Unit world vector a sheet row faces.
export function directionVector(i) {
  const a = (i * Math.PI) / 4;
  return { x: -Math.cos(a), y: Math.sin(a) };
}

export class Player {
  // sheets: { idle, walk, attack } images, rows = 8 directions, columns = frames;
  // gemGlow: soft glow texture drawn over the staff gem while swinging or casting
  constructor(x, y, sheets, gemGlow) {
    this.x = x;
    this.y = y;
    this.z = 0;
    this.sheets = sheets;
    this.gemGlow = gemGlow;
    this.dir = 0;
    this.walked = 0;
    this.moving = false;
    this.time = 0;
    this.cast = null;   // { t, duration, hoverEnd, x, y }
    this.attack = null; // { t, hit }
  }

  get casting() {
    return !!this.cast && this.cast.t < this.cast.duration;
  }

  get busy() {
    return this.casting || !!this.attack;
  }

  startCast(duration, hoverEnd) {
    this.cast = { t: 0, duration, hoverEnd, x: this.x, y: this.y };
    this.attack = null;
    this.dir = 0; // face the camera like the Oriverse cast
  }

  // Swing the staff, optionally turning towards a world point first. Returns false when busy.
  startAttack(target) {
    if (this.busy) return false;
    if (target) {
      const dx = target.x - this.x, dy = target.y - this.y;
      if (Math.hypot(dx, dy) > 1) this.dir = directionIndex(dx, dy);
    }
    this.attack = { t: 0, hit: false };
    return true;
  }

  // move = { x, y }: wanted direction in world axes (W = +X, A = +Y), not normalised.
  // Returns the attack hit point { x, y, z } on the frame the staff lands, else null.
  update(dt, move) {
    this.time += dt;
    let mx = move.x, my = move.y;
    if (this.busy) mx = my = 0; // rooted while casting or swinging
    const len = Math.hypot(mx, my);
    this.moving = len > 0;
    if (this.moving) {
      mx /= len;
      my /= len;
      const p = { x: this.x + mx * SPEED * dt, y: this.y + my * SPEED * dt };
      resolve(p, RADIUS);
      this.walked += Math.hypot(p.x - this.x, p.y - this.y);
      this.x = p.x;
      this.y = p.y;
      this.dir = directionIndex(mx, my);
    } else {
      this.walked = 0;
    }

    let hit = null;
    if (this.attack) {
      const a = this.attack;
      a.t += dt;
      const frame = Math.floor(a.t * ATTACK_FPS);
      if (!a.hit && frame >= HIT_FRAME) {
        a.hit = true;
        const v = directionVector(this.dir);
        hit = { x: this.x + v.x * 70, y: this.y + v.y * 70, z: 55 };
      }
      if (frame >= this.attackFrames) this.attack = null;
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
    return hit;
  }

  get attackFrames() {
    return this.sheets.attack.width / CELL;
  }

  // Which sheet and column to show this frame.
  pose() {
    const { walk, attack, idle } = this.sheets;
    if (this.cast && this.cast.t < this.cast.duration + 0.4) {
      // wind up while the cast bar fills, then follow through on release
      const c = this.cast;
      const f = c.t < c.duration
        ? Math.min(WINDUP_FRAME, Math.floor((c.t / 0.35) * WINDUP_FRAME))
        : Math.min(this.attackFrames - 1, WINDUP_FRAME + 1 + Math.floor((c.t - c.duration) * ATTACK_FPS));
      return { sheet: attack, col: f };
    }
    if (this.attack) return { sheet: attack, col: Math.min(this.attackFrames - 1, Math.floor(this.attack.t * ATTACK_FPS)) };
    if (this.moving) {
      const n = walk.width / CELL;
      return { sheet: walk, col: Math.floor((this.walked / WALK_CYCLE) * n) % n };
    }
    return { sheet: idle, col: 0 };
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

    const { sheet, col } = this.pose();
    const s = SCALE * k;
    const breathe = this.moving || this.busy ? 1 : 1 + 0.012 * Math.sin(this.time * 2.2);
    const fy = mapY(this.x, lift) * k + oy;
    // pivot (bottom centre of the cell) on the feet; breathing stretches up from the ground
    ctx.setTransform(s, 0, 0, s * breathe, gx, fy);
    ctx.drawImage(sheet, col * CELL, this.dir * CELL, CELL, CELL, -CELL / 2, -CELL, CELL, CELL);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const glow = this.gemGlowStrength();
    if (glow > 0.01) {
      const [ex, ey] = GEMS[this.dir];
      const r = (10 + 16 * glow) * k;
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.min(1, glow);
      ctx.drawImage(this.gemGlow, gx + (ex - CELL / 2) * s - r, fy + (ey - CELL) * s - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    if (this.casting) this.drawCastBar(ctx, gx, fy - HEAD * s - 6 * k, k);
  }

  // 0..1: builds through the wind-up, flares when the staff lands; pulses while casting.
  gemGlowStrength() {
    if (this.attack) {
      const f = this.attack.t * ATTACK_FPS;
      return f < HIT_FRAME ? (f / HIT_FRAME) * 0.6 : Math.max(0, 1 - (f - HIT_FRAME) / 3);
    }
    if (this.casting) return 0.55 + 0.35 * Math.sin(this.cast.t * 9);
    return 0;
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

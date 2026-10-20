// Jelly slimes: hop around their spawn point, flinch and get knocked back when hit, pop when
// defeated, drop loot and come back after a while.
//
// Sheets come from the Oriverse sprite `jelly_slime`: four directions per sheet (front, then
// clockwise seen from above: south, west, north, east), one 64 px column per frame. Colour
// variants are hue-rotated copies.

import { mapX, mapY } from "./projection.js";
import { resolve, SOLIDS, BOUNDS } from "./world.js";
import { hueShift, silhouette } from "./recolor.js";
import { rand } from "./particles.js";

const CELL = 64;
const SCALE = 1.25;      // map px per sprite px
const HOP_SPEED = 95;    // cm/s while hopping
const HOP_FPS = 10;
const RESPAWN = 9;       // s

export const VARIANTS = [
  { id: "green", name: "สไลม์เขียว", hue: 0, hp: 60, weight: 6, drops: [["jelly", 0.9], ["sprout", 0.08], ["top_mint", 0.03], ["bottom_forest", 0.03]] },
  { id: "pink", name: "สไลม์ชมพู", hue: 185, hp: 90, weight: 4, drops: [["jelly", 1], ["top_rose", 0.05], ["bottom_wine", 0.05]] },
  { id: "blue", name: "สไลม์ฟ้า", hue: 70, hp: 120, weight: 3, drops: [["jelly", 1], ["jelly", 0.5], ["top_sky", 0.06], ["bottom_navy", 0.06]] },
  { id: "violet", name: "สไลม์ม่วง", hue: 125, hp: 200, weight: 1, drops: [["sprout", 0.6], ["top_lilac", 0.12], ["bottom_cocoa", 0.12], ["jelly", 1]] },
];

// Spawn spots on open ground (world cm), clear of the house, well and hedges.
const SPAWNS = [
  { x: 700, y: 350 }, { x: 600, y: -300 }, { x: 1300, y: -250 }, { x: 1450, y: 400 },
  { x: 1500, y: 1050 }, { x: 800, y: 1300 }, { x: 350, y: 750 }, { x: 2400, y: -400 },
];
const LEASH = 260;

// 8-direction world vector -> slime sheet row (south, west, north, east).
function row4(dx, dy) {
  const a = Math.atan2(dy, -dx); // 0 = towards the camera, +90 = screen left
  return ((Math.round(a / (Math.PI / 2)) % 4) + 4) % 4;
}

// Load-time: build a sheet set per colour variant, each with a white flash copy.
export function slimeSheets(images) {
  const out = {};
  for (const v of VARIANTS) {
    const set = {};
    for (const clip of ["idle", "hop", "hurt", "die"]) {
      const img = v.hue ? hueShift(images[clip], v.hue, 1.1) : images[clip];
      set[clip] = { img, flash: silhouette(img), frames: img.width / CELL };
    }
    out[v.id] = set;
  }
  return out;
}

export class Monster {
  constructor(variant, home, sheets) {
    this.variant = variant;
    this.home = home;
    this.sheets = sheets[variant.id];
    this.radius = 30;
    this.height = 70;
    this.spawn();
  }

  spawn() {
    const p = { x: this.home.x + rand(-120, 120), y: this.home.y + rand(-120, 120) };
    resolve(p, this.radius);
    this.x = p.x;
    this.y = p.y;
    this.hp = this.variant.hp;
    this.alive = true;
    this.state = "idle"; // idle | hop | hurt | die | gone
    this.t = 0;
    this.wait = rand(0.5, 2.5);
    this.goal = null;
    this.row = Math.floor(rand(0, 4));
    this.vx = this.vy = 0;
    this.flash = 0;
    this.respawn = 0;
    this.spawnFade = 0.6;
  }

  // Returns true when this hit defeats it.
  hit(damage, dir, knock) {
    if (!this.alive) return false;
    this.hp -= damage;
    this.flash = 0.12;
    this.vx = dir.x * knock * 6;
    this.vy = dir.y * knock * 6;
    this.row = row4(-dir.x, -dir.y); // turn to face the attacker
    if (this.hp <= 0) {
      this.alive = false;
      this.state = "die";
      this.t = 0;
      return true;
    }
    this.state = "hurt";
    this.t = 0;
    return false;
  }

  update(dt) {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.spawnFade = Math.max(0, this.spawnFade - dt);
    // knockback slides and decays
    if (this.vx || this.vy) {
      const p = { x: this.x + this.vx * dt, y: this.y + this.vy * dt };
      resolve(p, this.radius);
      this.x = p.x;
      this.y = p.y;
      const decay = Math.exp(-dt * 9);
      this.vx *= decay;
      this.vy *= decay;
      if (Math.hypot(this.vx, this.vy) < 4) this.vx = this.vy = 0;
    }
    switch (this.state) {
      case "gone":
        this.respawn -= dt;
        if (this.respawn <= 0) this.spawn();
        break;
      case "die":
        if (this.t >= this.sheets.die.frames / HOP_FPS + 0.2) {
          this.state = "gone";
          this.respawn = RESPAWN;
        }
        break;
      case "hurt":
        if (this.t >= this.sheets.hurt.frames / HOP_FPS) {
          this.state = "idle";
          this.t = 0;
          this.wait = rand(0.2, 0.8);
        }
        break;
      case "idle":
        this.wait -= dt;
        if (this.wait <= 0) {
          const a = rand(0, Math.PI * 2), r = rand(60, LEASH);
          this.goal = { x: this.home.x + Math.cos(a) * r, y: this.home.y + Math.sin(a) * r };
          this.state = "hop";
          this.t = 0;
        }
        break;
      case "hop": {
        const dx = this.goal.x - this.x, dy = this.goal.y - this.y, d = Math.hypot(dx, dy);
        // only move while airborne: the middle of each hop cycle
        const phase = (this.t * HOP_FPS) % this.sheets.hop.frames / this.sheets.hop.frames;
        const air = phase > 0.25 && phase < 0.75;
        if (d < 12 || this.t > 6) {
          this.state = "idle";
          this.wait = rand(1, 3.5);
          break;
        }
        this.row = row4(dx, dy);
        if (air) {
          const p = { x: this.x + (dx / d) * HOP_SPEED * 2 * dt, y: this.y + (dy / d) * HOP_SPEED * 2 * dt };
          resolve(p, this.radius);
          this.x = p.x;
          this.y = p.y;
        }
        break;
      }
    }
  }

  get depth() {
    return mapY(this.x, 0);
  }

  frame() {
    const s = this.sheets;
    switch (this.state) {
      case "hop": return { clip: s.hop, col: Math.floor(this.t * HOP_FPS) % s.hop.frames };
      case "hurt": return { clip: s.hurt, col: Math.min(s.hurt.frames - 1, Math.floor(this.t * HOP_FPS)) };
      case "die": return { clip: s.die, col: Math.min(s.die.frames - 1, Math.floor(this.t * HOP_FPS)) };
      default: return { clip: s.idle, col: 0 };
    }
  }

  draw(ctx, view) {
    if (this.state === "gone") return;
    const { k, ox, oy } = view;
    const gx = mapX(this.y) * k + ox, gy = mapY(this.x, 0) * k + oy;
    const fade = this.state === "die" ? Math.max(0, 1 - Math.max(0, this.t - 0.5) / 0.5) : 1 - this.spawnFade / 0.6;
    ctx.globalAlpha = fade;
    ctx.fillStyle = "rgba(16, 30, 10, 0.3)";
    ctx.beginPath();
    ctx.ellipse(gx, gy, 26 * k, 11 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    const { clip, col } = this.frame();
    const s = SCALE * k;
    const sx = col * CELL, sy = this.row * CELL;
    ctx.drawImage(clip.img, sx, sy, CELL, CELL, gx - (CELL / 2) * s, gy - CELL * s, CELL * s, CELL * s);
    if (this.flash > 0) {
      ctx.globalAlpha = fade * Math.min(1, this.flash / 0.08) * 0.85;
      ctx.drawImage(clip.flash, sx, sy, CELL, CELL, gx - (CELL / 2) * s, gy - CELL * s, CELL * s, CELL * s);
    }
    ctx.globalAlpha = 1;
    if (this.alive && this.hp < this.variant.hp) this.drawHp(ctx, gx, gy - (CELL * 0.82) * s - 8 * k, k);
  }

  drawHp(ctx, cx, y, k) {
    const w = 52 * k, h = 6 * k;
    ctx.fillStyle = "rgba(10, 12, 8, 0.8)";
    ctx.fillRect(cx - w / 2 - k, y - k, w + 2 * k, h + 2 * k);
    ctx.fillStyle = "#4b1c18";
    ctx.fillRect(cx - w / 2, y, w, h);
    ctx.fillStyle = "#ff6a5a";
    ctx.fillRect(cx - w / 2, y, (w * Math.max(0, this.hp)) / this.variant.hp, h);
  }

  // Screen-space pick radius test for clicks (map px).
  contains(mx, my) {
    if (!this.alive) return false;
    const gx = mapX(this.y), gy = mapY(this.x, 0) - 30;
    return Math.hypot(mx - gx, (my - gy) * 1.3) < 52;
  }
}

// One monster per spawn spot, variants picked by weight.
export function spawnMonsters(sheets) {
  const total = VARIANTS.reduce((a, v) => a + v.weight, 0);
  const pick = () => {
    let r = rand(0, total);
    for (const v of VARIANTS) if ((r -= v.weight) <= 0) return v;
    return VARIANTS[0];
  };
  const list = [];
  for (const home of SPAWNS) {
    list.push(new Monster(pick(), home, sheets));
    list.push(new Monster(VARIANTS[0], { x: home.x + 80, y: home.y - 90 }, sheets));
  }
  return list;
}

// Roll a variant's drop table.
export function rollDrops(variant) {
  return variant.drops.filter(([, chance]) => Math.random() < chance).map(([id]) => id);
}

export { SOLIDS, BOUNDS };

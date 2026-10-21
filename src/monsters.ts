// Jelly slimes: hop around their spawn point, flinch and get knocked back when hit, chase and
// bite back once angered (violet ones attack on sight), pop when defeated, drop loot and come
// back after a while. Skills can stun, freeze, slow and burn them.
//
// Sheets come from the Oriverse sprite `jelly_slime`: four directions per sheet (front, then
// clockwise seen from above: south, west, north, east), one 64 px column per frame. Colour
// variants are hue-rotated copies.

import { icon } from "./icons";
import { mapX, mapY, yaw } from "./projection";
import { resolve, SOLIDS, BOUNDS } from "./world";
import { hueShift, silhouette } from "./recolor";
import { rand } from "./particles";
import type { Img, Vec2, View } from "./types";
import type { Hero } from "./hero";

export interface Variant {
  id: string;
  name: string;
  hue: number;
  level: number;
  hp: number;
  atk: number;
  def: number;
  mdef: number;
  accuracy?: number; // against the player's evasion (default: from its level)
  flee?: number;     // evasion against the player's accuracy (default: from its level)
  crit?: number;     // chance its bite crits (default: from its level)
  xp: number;
  aggro: number;
  weight: number;
  drops: [string, number][];
}

interface Clip {
  img: Img;
  flash: Img;
  ice: Img;
  frames: number;
}
type SlimeSet = Record<"idle" | "hop" | "hurt" | "die", Clip>;

// What a monster needs from the game each frame.
export interface MonsterCtx {
  player: Vec2;
  hero: Hero;
  bite: (m: Monster) => void;
}

const CELL = 64;
const SCALE = 1.25;      // map px per sprite px
const HOP_SPEED = 95;    // cm/s while hopping
const HOP_FPS = 10;
const RESPAWN = 9;       // s

// level, hp, atk, def, mdef and xp feed stats.js; aggro: radius (cm) in which it attacks first
const BOOK_DROPS: [string, number][] = [["book_survivor", 0.015], ["book_gathering", 0.015], ["book_lightning", 0.015]];
export const VARIANTS: Variant[] = [
  { id: "green", name: "สไลม์เขียว", hue: 0, level: 1, hp: 60, atk: 8, def: 2, mdef: 2, xp: 8, aggro: 0, weight: 6,
    drops: [["jelly", 0.9], ["sprout", 0.08], ["top_mint", 0.03], ["bottom_forest", 0.03], ["top_priestess_forest", 0.02], ["bottom_priestess_forest", 0.02], ...BOOK_DROPS] },
  { id: "pink", name: "สไลม์ชมพู", hue: 185, level: 3, hp: 110, atk: 13, def: 5, mdef: 4, xp: 15, aggro: 0, weight: 4,
    drops: [["jelly", 1], ["top_rose", 0.05], ["bottom_wine", 0.05], ["top_priestess_wine", 0.03], ["bottom_priestess_wine", 0.03], ["bottom_adventurer_wine", 0.03], ...BOOK_DROPS] },
  { id: "blue", name: "สไลม์ฟ้า", hue: 70, level: 5, hp: 170, atk: 18, def: 8, mdef: 10, xp: 24, aggro: 0, weight: 3,
    drops: [["jelly", 1], ["jelly", 0.5], ["top_sky", 0.06], ["bottom_navy", 0.06], ["top_adventurer_navy", 0.03], ["bottom_adventurer_sand", 0.03], ["top_warrior_navy", 0.03], ...BOOK_DROPS] },
  { id: "violet", name: "สไลม์ม่วง", hue: 125, level: 9, hp: 320, atk: 28, def: 12, mdef: 12, xp: 48, aggro: 260, weight: 1,
    drops: [["sprout", 0.6], ["top_lilac", 0.12], ["bottom_cocoa", 0.12], ["jelly", 1], ["top_priestess_black", 0.06], ["bottom_priestess_black", 0.06],
      ["top_adventurer_plum", 0.06], ["bottom_adventurer_black", 0.06], ["top_adventurer_ochre", 0.04], ["top_warrior_forest", 0.04], ["bottom_warrior_black", 0.04],
      ["book_survivor", 0.08], ["book_gathering", 0.08], ["book_lightning", 0.08]] },
];
const BITE_REACH = 95;   // cm between centres
const BITE_TIME = 1.6;   // s between bites
const CHASE_LEASH = 900; // gives up past this far from home
const ANGER = 12;        // s it stays angry after being hit

// Spawn spots on open ground (world cm), clear of the house, well and hedges.
const SPAWNS: Vec2[] = [
  { x: 700, y: 350 }, { x: 600, y: -300 }, { x: 1300, y: -250 }, { x: 1450, y: 400 },
  { x: 1500, y: 1050 }, { x: 800, y: 1300 }, { x: 350, y: 750 }, { x: 2400, y: -400 },
];
const LEASH = 260;

// World vector -> slime facing (south, west, north, east as seen from the yaw-0 camera); the
// sheet row on screen adds the camera yaw.
function row4(dx: number, dy: number): number {
  const a = Math.atan2(dy, -dx); // 0 = towards the camera, +90 = screen left
  return ((Math.round(a / (Math.PI / 2)) % 4) + 4) % 4;
}

// Load-time: build a sheet set per colour variant, each with a white flash copy.
export function slimeSheets(images: Record<keyof SlimeSet, Img>): Record<string, SlimeSet> {
  const out: Record<string, SlimeSet> = {};
  for (const v of VARIANTS) {
    const set = {} as SlimeSet;
    for (const clip of ["idle", "hop", "hurt", "die"] as const) {
      const img = v.hue ? hueShift(images[clip], v.hue, 1.1) : images[clip];
      set[clip] = { img, flash: silhouette(img), ice: silhouette(img, "#9fd8ff"), frames: img.width / CELL };
    }
    out[v.id] = set;
  }
  return out;
}

type State = "idle" | "hop" | "hurt" | "die" | "gone" | "bite";

// Status badges: when each shows, its glyph and colour.
const STATUS: [(m: Monster) => boolean, string, string][] = [
  [(m) => m.burns.some((b) => b.poison), "drop", "#6fcf5a"],
  [(m) => m.slow > 0, "swirl", "#6fb4ff"],
  [(m) => m.weak > 0, "down", "#b58aff"],
  [(m) => m.expose > 0, "target", "#ff7a5a"],
  [(m) => m.blind > 0, "eye", "#7d7690"],
];

export class Monster {
  variant: Variant;
  home: Vec2;
  sheets: SlimeSet;
  radius = 30;
  height = 70;
  x = 0;
  y = 0;
  hp = 0;
  maxHp = 0;
  level = 1;
  atk = 0;
  def = 0;
  mdef = 0;
  accuracy = 0;
  flee = 0;
  crit = 0;
  angry = 0;   // s left chasing the player
  biteCd = 0;
  stun = 0;
  freeze = 0;
  slow = 0;
  burns: { dps: number; t: number; poison?: boolean }[] = []; // fire and poison, ticked by combat.ts
  weak = 0;      // s left dealing weakPct less damage
  weakPct = 0;
  expose = 0;    // s left taking exposePct more damage
  exposePct = 0;
  blind = 0;     // s left missing half its bites
  alive = true;
  state: State = "idle";
  t = 0;
  wait = 0;
  goal: Vec2 | null = null;
  row = 0;     // facing, see row4
  vx = 0;
  vy = 0;
  flash = 0;
  respawn = 0;
  spawnFade = 0;
  bitten = false;

  constructor(variant: Variant, home: Vec2, sheets: Record<string, SlimeSet>) {
    this.variant = variant;
    this.home = home;
    this.sheets = sheets[variant.id];
    this.spawn();
  }

  spawn(): void {
    const p = { x: this.home.x + rand(-120, 120), y: this.home.y + rand(-120, 120) };
    resolve(p, this.radius);
    this.x = p.x;
    this.y = p.y;
    this.hp = this.variant.hp;
    this.maxHp = this.variant.hp;
    this.level = this.variant.level;
    this.atk = this.variant.atk;
    this.def = this.variant.def;
    this.mdef = this.variant.mdef;
    this.accuracy = this.variant.accuracy ?? 10 + 1.4 * this.level;
    this.flee = this.variant.flee ?? 2 + 1.5 * this.level;
    this.crit = this.variant.crit ?? 0.03 + 0.0002 * this.level;
    this.angry = 0;
    this.biteCd = 0;
    this.stun = 0;
    this.freeze = 0;
    this.slow = 0;
    this.burns = [];
    this.weak = this.weakPct = this.expose = this.exposePct = this.blind = 0;
    this.alive = true;
    this.state = "idle";
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
  hit(damage: number, dir: Vec2, knock: number): boolean {
    if (!this.alive) return false;
    this.hp -= damage;
    this.flash = 0.12;
    this.angry = ANGER;
    this.vx = dir.x * knock * 6;
    this.vy = dir.y * knock * 6;
    this.row = row4(-dir.x, -dir.y); // turn to face the attacker
    if (this.hp <= 0) {
      this.alive = false;
      this.state = "die";
      this.t = 0;
      return true;
    }
    if (this.state !== "bite") {
      this.state = "hurt";
      this.t = 0;
    }
    return false;
  }

  // Attacked but missed: no harm, but it turns on the attacker all the same.
  provoke(dir: Vec2): void {
    if (!this.alive) return;
    this.angry = ANGER;
    this.row = row4(-dir.x, -dir.y);
  }

  get held(): boolean {
    return this.stun > 0 || this.freeze > 0;
  }

  // Its bite after weakening.
  get power(): number {
    return this.atk * (this.weak > 0 ? 1 - this.weakPct : 1);
  }

  // Under any status (for the hunter's bonus).
  get afflicted(): boolean {
    return this.held || this.slow > 0 || this.weak > 0 || this.expose > 0 || this.blind > 0 || this.burns.some((b) => b.poison);
  }

  // Weaken or expose for t s: the stronger one wins while one is on.
  weaken(t: number, pct: number): void {
    this.weakPct = this.weak > 0 ? Math.max(this.weakPct, pct) : pct;
    this.weak = Math.max(this.weak, t);
  }

  exposeTo(t: number, pct: number): void {
    this.exposePct = this.expose > 0 ? Math.max(this.exposePct, pct) : pct;
    this.expose = Math.max(this.expose, t);
  }

  // ctx: { player, hero, bite(monster) } — bite() is called when a bite lands.
  update(dt: number, ctx: MonsterCtx): void {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.freeze = Math.max(0, this.freeze - dt);
    this.slow = Math.max(0, this.slow - dt);
    this.weak = Math.max(0, this.weak - dt);
    this.expose = Math.max(0, this.expose - dt);
    this.blind = Math.max(0, this.blind - dt);
    this.biteCd = Math.max(0, this.biteCd - dt);
    this.angry = Math.max(0, this.angry - dt);
    if (this.alive && this.held) {
      // frozen or stunned: only knockback still slides it
      this.slide(dt);
      if (this.state === "hop" || this.state === "bite") {
        this.state = "idle";
        this.wait = 0.2;
      }
      return;
    }
    const pl = ctx.player, alive = ctx.hero.alive;
    const toPlayer = Math.hypot(pl.x - this.x, pl.y - this.y);
    const fromHome = Math.hypot(this.x - this.home.x, this.y - this.home.y);
    if (this.alive && alive && this.variant.aggro && toPlayer < this.variant.aggro) this.angry = Math.max(this.angry, 2);
    if (!alive || fromHome > CHASE_LEASH) this.angry = 0;
    const chasing = this.alive && this.angry > 0 && (this.state === "idle" || this.state === "hop");
    if (chasing) {
      if (toPlayer < BITE_REACH && this.biteCd <= 0) {
        this.state = "bite";
        this.t = 0;
        this.bitten = false;
        this.row = row4(pl.x - this.x, pl.y - this.y);
      } else if (toPlayer >= BITE_REACH * 0.8) {
        this.goal = { x: pl.x, y: pl.y };
        if (this.state !== "hop") {
          this.state = "hop";
          this.t = 0;
        }
      } else if (this.state === "hop") {
        this.state = "idle";
        this.wait = 0.3;
      }
    }
    if (this.state === "bite") {
      // lunge on the way up, the bite lands at the top of the hop
      const lunge = this.t < 0.3 ? 1 : 0;
      if (lunge) {
        const d = toPlayer || 1;
        const p = { x: this.x + ((pl.x - this.x) / d) * 160 * dt, y: this.y + ((pl.y - this.y) / d) * 160 * dt };
        if (toPlayer > 60) {
          resolve(p, this.radius);
          this.x = p.x;
          this.y = p.y;
        }
      }
      if (!this.bitten && this.t >= 0.3) {
        this.bitten = true;
        if (toPlayer < BITE_REACH + 30 && alive) ctx.bite(this);
      }
      if (this.t >= 0.55) {
        this.state = "idle";
        this.wait = 0.15;
        this.biteCd = BITE_TIME;
      }
    }
    this.slide(dt);
    this.step(dt);
  }

  // knockback slides and decays
  slide(dt: number): void {
    this.spawnFade = Math.max(0, this.spawnFade - dt);
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
  }

  step(dt: number): void {
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
        if (this.wait <= 0 && this.angry <= 0) {
          // calm again: wander, healing up if it was hurt
          this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.25);
          const a = rand(0, Math.PI * 2), r = rand(60, LEASH);
          this.goal = { x: this.home.x + Math.cos(a) * r, y: this.home.y + Math.sin(a) * r };
          this.state = "hop";
          this.t = 0;
        }
        break;
      case "hop": {
        const goal = this.goal ?? this.home;
        const dx = goal.x - this.x, dy = goal.y - this.y, d = Math.hypot(dx, dy);
        // only move while airborne: the middle of each hop cycle
        const phase = (this.t * HOP_FPS) % this.sheets.hop.frames / this.sheets.hop.frames;
        const air = phase > 0.25 && phase < 0.75;
        if ((d < 12 || this.t > 6) && this.angry <= 0) {
          this.state = "idle";
          this.wait = rand(1, 3.5);
          break;
        }
        if (d < 12) break;
        this.row = row4(dx, dy);
        if (air) {
          const v = HOP_SPEED * 2 * (this.slow > 0 ? 0.5 : 1) * (this.angry > 0 ? 1.25 : 1);
          const p = { x: this.x + (dx / d) * v * dt, y: this.y + (dy / d) * v * dt };
          resolve(p, this.radius);
          this.x = p.x;
          this.y = p.y;
        }
        break;
      }
    }
  }

  get depth(): number {
    return mapY(this.x, this.y);
  }

  frame(): { clip: Clip; col: number } {
    const s = this.sheets;
    switch (this.state) {
      case "hop": return { clip: s.hop, col: Math.floor(this.t * HOP_FPS) % s.hop.frames };
      case "bite": return { clip: s.hop, col: Math.min(s.hop.frames - 1, Math.floor(this.t * HOP_FPS * 2)) };
      case "hurt": return { clip: s.hurt, col: Math.min(s.hurt.frames - 1, Math.floor(this.t * HOP_FPS)) };
      case "die": return { clip: s.die, col: Math.min(s.die.frames - 1, Math.floor(this.t * HOP_FPS)) };
      default: return { clip: s.idle, col: 0 };
    }
  }

  draw(ctx: CanvasRenderingContext2D, view: View): void {
    if (this.state === "gone") return;
    const { k, ox, oy } = view;
    const gx = mapX(this.x, this.y) * k + ox, gy = mapY(this.x, this.y) * k + oy;
    const fade = this.state === "die" ? Math.max(0, 1 - Math.max(0, this.t - 0.5) / 0.5) : 1 - this.spawnFade / 0.6;
    ctx.globalAlpha = fade;
    ctx.fillStyle = "rgba(16, 30, 10, 0.3)";
    ctx.beginPath();
    ctx.ellipse(gx, gy, 26 * k, 11 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    const { clip, col } = this.frame();
    const s = SCALE * k;
    const sx = col * CELL, sy = ((this.row + Math.round(yaw / (Math.PI / 2))) % 4) * CELL;
    ctx.drawImage(clip.img, sx, sy, CELL, CELL, gx - (CELL / 2) * s, gy - CELL * s, CELL * s, CELL * s);
    if (this.flash > 0) {
      ctx.globalAlpha = fade * Math.min(1, this.flash / 0.08) * 0.85;
      ctx.drawImage(clip.flash, sx, sy, CELL, CELL, gx - (CELL / 2) * s, gy - CELL * s, CELL * s, CELL * s);
    }
    if (this.freeze > 0 && this.alive) {
      ctx.globalAlpha = fade * 0.55;
      ctx.drawImage(clip.ice ?? clip.flash, sx, sy, CELL, CELL, gx - (CELL / 2) * s, gy - CELL * s, CELL * s, CELL * s);
    }
    ctx.globalAlpha = 1;
    const top = gy - (CELL * 0.82) * s - 8 * k;
    if (this.stun > 0 && this.alive) this.drawStars(ctx, gx, top - 6 * k, k);
    if (this.alive && (this.hp < this.maxHp || this.angry > 0)) this.drawHp(ctx, gx, top, k);
    if (this.alive) this.drawStatus(ctx, gx, top - 18 * k, k);
  }

  // A row of small badges over the HP bar: poisoned, slowed, weakened, exposed, blinded.
  drawStatus(ctx: CanvasRenderingContext2D, cx: number, y: number, k: number): void {
    const on = STATUS.filter(([test]) => test(this));
    const size = 15 * k, gap = 2 * k;
    let x = cx - (on.length * (size + gap) - gap) / 2;
    for (const [, glyph, color] of on) {
      ctx.drawImage(icon(glyph, color), x, y - size, size, size);
      x += size + gap;
    }
  }

  drawStars(ctx: CanvasRenderingContext2D, cx: number, y: number, k: number): void {
    ctx.fillStyle = "#ffe27a";
    for (let i = 0; i < 3; i++) {
      const a = this.t * 5 + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 16 * k, y + Math.sin(a) * 5 * k, 3.2 * k, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawHp(ctx: CanvasRenderingContext2D, cx: number, y: number, k: number): void {
    const w = 52 * k, h = 6 * k;
    ctx.fillStyle = "rgba(10, 12, 8, 0.8)";
    ctx.fillRect(cx - w / 2 - k, y - k, w + 2 * k, h + 2 * k);
    ctx.fillStyle = "#4b1c18";
    ctx.fillRect(cx - w / 2, y, w, h);
    ctx.fillStyle = this.angry > 0 ? "#ff6a5a" : "#e0a090";
    ctx.fillRect(cx - w / 2, y, (w * Math.max(0, this.hp)) / this.maxHp, h);
    ctx.font = `600 ${11 * k}px Kanit, system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.lineWidth = 3 * k;
    ctx.strokeStyle = "rgba(10, 12, 8, 0.85)";
    ctx.fillStyle = "#fff6d8";
    ctx.strokeText(`Lv ${this.level}`, cx - w / 2 - 4 * k, y + h);
    ctx.fillText(`Lv ${this.level}`, cx - w / 2 - 4 * k, y + h);
    ctx.textAlign = "start";
  }

  // Screen-space pick radius test for clicks (map px).
  contains(mx: number, my: number): boolean {
    if (!this.alive) return false;
    const gx = mapX(this.x, this.y), gy = mapY(this.x, this.y) - 30;
    return Math.hypot(mx - gx, (my - gy) * 1.3) < 52;
  }
}

// One monster per spawn spot, variants picked by weight.
export function spawnMonsters(sheets: Record<string, SlimeSet>): Monster[] {
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
export function rollDrops(variant: Variant, bonus = 0): string[] {
  return variant.drops.filter(([, chance]) => Math.random() < chance * (1 + bonus)).map(([id]) => id);
}

export { SOLIDS, BOUNDS };

// Hits: normal attacks per weapon type, projectiles (arrows, staff bolts and skill shots),
// burning, and the floating numbers. Damage numbers come from stats.js.

import { mapX, mapY, S2, toView } from "./projection";
import { WEAPON_TYPES, OFFHAND_DAMAGE } from "./items";
import type { WeaponId, WeaponType } from "./items";
import { AIR_GLOW, GROUND_GLOW, rand } from "./particles";
import type { Particles } from "./particles";
import { basicDamage } from "./stats";
import type { Hit, Stats } from "./stats";
import type { Hero } from "./hero";
import type { Monster } from "./monsters";
import type { Target } from "./player";
import type { Img, Textures, Vec2, View } from "./types";

export const UNARMED: WeaponType = { name: "มือเปล่า", motion: "thrust", hit: "line", reach: 90, width: 40, interval: 0.6, damage: [4, 7] };

// Weapon stats with the wielder's attack speed and reach bonuses (stats.js) folded in.
export function weaponStats(weaponId: string | null, stats: Stats | null = null): WeaponType {
  const w = (weaponId && WEAPON_TYPES[weaponId as WeaponId]) || UNARMED;
  if (!stats) return w;
  const reach = 1 + stats.reach;
  return {
    ...w,
    interval: w.interval / (1 + stats.aspd),
    reach: w.reach && w.reach * reach,
    projectile: w.projectile && { ...w.projectile, range: w.projectile.range * reach },
  };
}

// How close the player walks before attacking a target with this weapon.
export function attackRange(w: WeaponType): number {
  return w.projectile ? w.projectile.range * 0.85 : w.reach * 0.85;
}

// Floating numbers and short labels that rise and fade over a world point.
export type FloaterStyle = "damage" | "crit" | "loot" | "info" | "hurt" | "heal" | "level" | "shield" | "magic" | "miss";

interface Floater {
  x: number;
  y: number;
  z: number;
  text: string;
  style: FloaterStyle;
  t: number;
  life: number;
  dx: number;
  seed: number; // the crit burst's spikes and tilt
}

// A comic-book explosion behind a critical hit's number: a jagged star around (x, y).
function burst(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, seed: number): void {
  const n = 13;
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = seed * Math.PI * 2 + (i * Math.PI) / n;
    const r = i % 2 ? 0.6 + 0.08 * Math.sin(seed * 51 + i * 3.1) : 1 + 0.14 * Math.sin(seed * 97 + i * 7.3);
    const px = x + Math.cos(a) * rx * r, py = y + Math.sin(a) * ry * r;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

export class Floaters {
  list: Floater[] = [];

  add(x: number, y: number, z: number, text: string, style: FloaterStyle = "damage"): void {
    const long = style === "loot" || style === "level";
    this.list.push({ x, y, z, text, style, t: 0, life: long ? 1.8 : 0.9, dx: style === "level" ? 0 : rand(-14, 14), seed: Math.random() });
  }

  update(dt: number): void {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const f = this.list[i];
      f.t += dt;
      if (f.t >= f.life) this.list.splice(i, 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D, view: View): void {
    const { k, ox, oy } = view;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    const colors: Record<FloaterStyle, string> = { damage: "#fff6d8", crit: "#ffe14a", loot: "#c9ffe0", info: "#ffd0c8", hurt: "#ff6b5e", heal: "#7dff9a", level: "#ffe27a", shield: "#cbbcff", magic: "#cfe0ff", miss: "#d6d6d6" };
    for (const f of this.list) {
      const u = f.t / f.life;
      const rise = f.style === "loot" || f.style === "level" ? 40 * u : 60 * Math.sqrt(u);
      const px = (mapX(f.x, f.y) + f.dx * u) * k + ox;
      const py = mapY(f.x, f.y, f.z + rise) * k + oy;
      const big = f.style === "crit" || f.style === "level";
      const size = (big ? 30 : f.style === "loot" ? 17 : 22) * k * (big ? 1 + 0.3 * Math.max(0, 1 - u * 4) : 1);
      ctx.globalAlpha = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
      ctx.font = `600 ${size}px Kanit, system-ui, sans-serif`;
      if (f.style === "crit") {
        // yellow on a red explosion
        const cy = py - size * 0.36, rx = ctx.measureText(f.text).width / 2 + size * 0.8, ry = size * 1.05;
        burst(ctx, px, cy, rx, ry, f.seed);
        const glow = ctx.createRadialGradient(px, cy, 0, px, cy, rx);
        glow.addColorStop(0, "#ff6a2e");
        glow.addColorStop(1, "#c8140c");
        ctx.fillStyle = glow;
        ctx.lineWidth = Math.max(2, size * 0.1);
        ctx.strokeStyle = "#4a0805";
        ctx.fill();
        ctx.stroke();
      }
      ctx.lineWidth = Math.max(2, size * 0.16);
      ctx.strokeStyle = f.style === "crit" ? "#5a0d05" : "rgba(20, 14, 10, 0.9)";
      ctx.fillStyle = colors[f.style];
      ctx.strokeText(f.text, px, py);
      ctx.fillText(f.text, px, py);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "start";
  }
}

// Monsters inside a hit shape, nearest first. dir: unit vector in world axes.
//   line: a strip `width` wide, `reach` long; arc: within `reach` and `arc` degrees.
export interface Shape {
  hit?: "arc" | "line" | "circle";
  reach: number;
  arc?: number;
  width?: number;
}

export function shapeTargets(origin: Vec2, dir: Vec2, shape: Shape, monsters: Monster[]): Monster[] {
  const out: { m: Monster; along: number }[] = [];
  for (const m of monsters) {
    if (!m.alive) continue;
    const dx = m.x - origin.x, dy = m.y - origin.y;
    const along = dx * dir.x + dy * dir.y;
    const side = -dx * dir.y + dy * dir.x;
    const dist = Math.hypot(dx, dy) - m.radius;
    if (shape.hit === "line") {
      if (along > -m.radius && along - m.radius < shape.reach && Math.abs(side) < (shape.width ?? 40) / 2 + m.radius) out.push({ m, along });
    } else if (shape.hit === "circle") {
      if (dist < shape.reach) out.push({ m, along: dist });
    } else {
      const ang = (Math.atan2(side, along) * 180) / Math.PI;
      if (dist < shape.reach && Math.abs(ang) < (shape.arc ?? 90) / 2 + 20) out.push({ m, along });
    }
  }
  out.sort((a, b) => a.along - b.along);
  return out.map((o) => o.m);
}

export interface ShotSpec {
  kind: "bolt" | "arrow" | "wave" | "skill";
  speed: number;
  range: number;
  radius: number;
  pierce?: boolean;
  color?: string;
  onHit: (m: Monster, dir: Vec2) => void;
}

interface Projectile {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  left: number;
  kind: ShotSpec["kind"];
  radius: number;
  color?: string;
  pierce: boolean;
  onHit: ShotSpec["onHit"];
  hitSet: Set<Monster>;
  age: number;
}

interface CombatDeps {
  fx: Particles;
  tex: Textures;
  floaters: Floaters;
  monsters: Monster[];
  hero: Hero;
  onKill: (m: Monster) => void;
}

export class Combat {
  fx: Particles;
  tex: Textures;
  floaters: Floaters;
  monsters: Monster[];
  hero: Hero;
  onKill: (m: Monster) => void;
  projectiles: Projectile[] = [];
  pending: { t: number; origin: Vec2; dir: Vec2; w: WeaponType }[] = []; // delayed second hits (weapons with hits > 1)
  offhits: { t: number; m: Monster; w: WeaponType; dir: Vec2 }[] = []; // off-hand follow-ups
  burnClock = 0;

  // hero: stats for damage; onKill(monster)
  constructor({ fx, tex, floaters, monsters, hero, onKill }: CombatDeps) {
    this.fx = fx;
    this.tex = tex;
    this.floaters = floaters;
    this.monsters = monsters;
    this.hero = hero;
    this.onKill = onKill;
  }

  // The player's weapon lands: resolve a melee hit or launch a projectile.
  // A normal attack with the main-hand weapon; a weapon in the off hand follows up on every
  // monster the main hand hit for OFFHAND_DAMAGE of its own damage.
  strike(player: { x: number; y: number; target: Target | null; aimDir(): Vec2 }, weaponId: string | null, offhand: WeaponId | null = null): void {
    const w = weaponStats(weaponId, this.hero.stats);
    const off = offhand ? weaponStats(offhand, this.hero.stats) : null;
    const follow = (m: Monster, d: Vec2) => {
      if (off) this.offhits.push({ t: 0.13, m, w: off, dir: d });
    };
    const dir = player.aimDir();
    const origin = { x: player.x, y: player.y };
    if (w.projectile) {
      const p = w.projectile;
      // aim at the target if there is one, else where the attack was aimed
      let aim = dir;
      if (player.target && player.target.alive) {
        const dx = player.target.x - origin.x, dy = player.target.y - origin.y, d = Math.hypot(dx, dy) || 1;
        aim = { x: dx / d, y: dy / d };
      }
      const onHit = (m: Monster, d: Vec2) => {
        this.damage(m, w, d);
        follow(m, d);
      };
      this.shoot(origin, aim, { ...p, onHit });
      // a second arrow beside the first, now and then (the archer's double shot)
      if (p.kind === "arrow" && Math.random() < this.hero.stats.multiShot) {
        const a = Math.atan2(aim.y, aim.x) + 0.07;
        this.shoot({ x: origin.x - aim.y * 14, y: origin.y + aim.x * 14 }, { x: Math.cos(a), y: Math.sin(a) }, { ...p, onHit });
      }
      return;
    }
    const hits = shapeTargets(origin, dir, w, this.monsters);
    const targets = w.pierce || w.hit !== "line" ? hits : hits.slice(0, 1);
    for (const m of targets) {
      this.damage(m, w, dir);
      follow(m, dir);
    }
    this.slashFx(origin, dir, w);
    if ((w.hits ?? 1) > 1) this.pending.push({ t: 0.14, origin, dir, w });
  }

  // Launch a projectile from `origin` along unit `aim`: { kind, speed, range, radius, pierce,
  // color, onHit(monster, dir) }.
  shoot(origin: Vec2, aim: Vec2, p: ShotSpec): void {
    this.projectiles.push({
      x: origin.x + aim.x * 40, y: origin.y + aim.y * 40, z: 60,
      vx: aim.x * p.speed, vy: aim.y * p.speed, left: p.range, kind: p.kind, radius: p.radius,
      color: p.color, pierce: !!p.pierce, onHit: p.onHit, hitSet: new Set(), age: 0,
    });
  }

  // A normal attack lands on a monster (scale < 1 for the off hand).
  damage(m: Monster, w: WeaponType, dir: Vec2, scale = 1): void {
    const r = basicDamage(this.hero.stats, w, m);
    if (r.miss) return void this.apply(m, r, dir);
    if (scale !== 1) r.dmg = Math.max(1, Math.round(r.dmg * scale));
    if (this.hero.stats.stunHit && Math.random() < this.hero.stats.stunHit) m.stun = Math.max(m.stun, 1);
    if (this.hero.stats.poisonHit && Math.random() < this.hero.stats.poisonHit) m.burns.push({ dps: (r.dmg * 0.4) / 3, t: 3, poison: true });
    this.apply(m, r, dir, w.knock ?? 25);
  }

  // Land a computed hit { dmg, crit, magic, miss } on a monster. A miss still angers it.
  apply(m: Monster, r: Hit, dir: Vec2, knock = 25): boolean {
    if (!m.alive) return false;
    if (r.miss) {
      m.provoke(dir);
      this.floaters.add(m.x, m.y, m.height, "พลาด", "miss");
      return false;
    }
    // an exposed monster takes more; the hunter's instinct, more on any status
    const more = (m.expose > 0 ? 1 + m.exposePct : 1) * (m.afflicted ? 1 + this.hero.stats.huntDmg : 1);
    if (more !== 1) r.dmg = Math.max(1, Math.round(r.dmg * more));
    const died = m.hit(r.dmg, dir, knock);
    this.floaters.add(m.x, m.y, m.height, String(r.dmg), r.crit ? "crit" : r.magic ? "magic" : "damage");
    this.fx.add({ x: m.x, y: m.y, z: m.height * 0.5, layer: AIR_GLOW, tex: this.tex.flash, life: 0.18,
      size: [[0, 24], [1, 60]], alpha: [[0, 0.8], [1, 0]] });
    if (died) this.onKill(m);
    return died;
  }

  slashFx(origin: Vec2, dir: Vec2, w: WeaponType): void {
    const line = w.hit === "line";
    const reach = line ? w.reach : w.reach * 0.75;
    const n = line ? 6 : 9;
    for (let i = 0; i < n; i++) {
      let px: number, py: number;
      if (line) {
        const f = (i + 1) / n;
        px = origin.x + dir.x * reach * f;
        py = origin.y + dir.y * reach * f;
      } else {
        const a = Math.atan2(dir.y, dir.x) + ((i / (n - 1)) - 0.5) * (((w.arc ?? 90) * Math.PI) / 180);
        px = origin.x + Math.cos(a) * reach;
        py = origin.y + Math.sin(a) * reach;
      }
      this.fx.add({ x: px, y: py, z: 55, layer: AIR_GLOW, tex: this.tex.sparkle, life: 0.22 + i * 0.012,
        size: [[0, 14], [1, 4]], alpha: [[0, 0.9], [1, 0]] });
    }
  }

  update(dt: number): void {
    for (let i = this.offhits.length - 1; i >= 0; i--) {
      const h = this.offhits[i];
      if ((h.t -= dt) > 0) continue;
      this.offhits.splice(i, 1);
      if (h.m.alive) this.damage(h.m, h.w, h.dir, OFFHAND_DAMAGE);
    }
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const p = this.pending[i];
      p.t -= dt;
      if (p.t > 0) continue;
      this.pending.splice(i, 1);
      for (const m of shapeTargets(p.origin, p.dir, p.w, this.monsters).slice(0, 1)) this.damage(m, p.w, p.dir);
      this.slashFx(p.origin, p.dir, p.w);
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const step = Math.hypot(p.vx, p.vy) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.left -= step;
      p.age += dt;
      if (p.kind !== "arrow") {
        this.fx.add({ x: p.x, y: p.y, z: p.z, layer: AIR_GLOW, tex: p.kind === "bolt" ? this.tex.mint : this.tex.sparkle, life: 0.25,
          size: [[0, p.kind === "wave" ? 40 : 26], [1, 6]], alpha: [[0, 0.6], [1, 0]] });
      }
      let gone = p.left <= 0;
      for (const m of this.monsters) {
        if (gone || !m.alive || p.hitSet.has(m)) continue;
        if (Math.hypot(m.x - p.x, m.y - p.y) < m.radius + p.radius * 0.5) {
          const d = Math.hypot(p.vx, p.vy) || 1;
          p.onHit(m, { x: p.vx / d, y: p.vy / d });
          p.hitSet.add(m);
          if (!p.pierce) gone = true;
        }
      }
      if (gone) {
        if (p.kind !== "arrow") {
          this.fx.add({ x: p.x, y: p.y, z: p.z, layer: AIR_GLOW, tex: this.tex.flash, life: 0.3,
            size: [[0, 30], [1, 90]], alpha: [[0, 0.9], [1, 0]] });
          this.fx.add({ x: p.x, y: p.y, z: 0, layer: GROUND_GLOW, tex: this.tex.mint, life: 0.4,
            size: [[0, 40], [1, 120]], alpha: [[0, 0.5], [1, 0]] });
        }
        this.projectiles.splice(i, 1);
      }
    }
    // burning (fire element) and poison tick twice a second
    this.burnClock += dt;
    if (this.burnClock >= 0.5) {
      const tick = this.burnClock;
      this.burnClock = 0;
      for (const m of this.monsters) {
        if (!m.alive || !m.burns.length) continue;
        let dmg = 0;
        const poison = m.burns.some((b) => b.poison);
        m.burns = m.burns.filter((b) => {
          dmg += b.dps * Math.min(tick, b.t);
          return (b.t -= tick) > 0;
        });
        if (dmg >= 1) {
          const died = m.hit(Math.round(dmg), { x: 0, y: 0 }, 0);
          this.floaters.add(m.x, m.y, m.height, String(Math.round(dmg)), "info");
          this.fx.add({ x: m.x + rand(-15, 15), y: m.y + rand(-15, 15), z: 30, layer: AIR_GLOW, tex: poison ? this.tex.glowFor("#7be06a") : this.tex.ember, life: 0.5,
            size: [[0, 30], [1, 8]], alpha: [[0, 0.8], [1, 0]], vz: 80 });
          if (died) this.onKill(m);
        }
      }
    }
  }

  // Projectiles drawn over the scene (arrows as sprites, magic as a glowing core).
  draw(ctx: CanvasRenderingContext2D, view: View, arrowImg: Img | undefined): void {
    const { k, ox, oy } = view;
    for (const p of this.projectiles) {
      const px = mapX(p.x, p.y) * k + ox, py = mapY(p.x, p.y, p.z) * k + oy;
      // screen direction of travel (forward is squashed by the 45 degree view)
      const v = toView(p.vx, p.vy);
      const sx = -v.left, sy = -v.fwd * S2;
      const ang = Math.atan2(sy, sx);
      if (p.kind === "arrow" && arrowImg) {
        const len = 46 * k;
        ctx.setTransform(Math.cos(ang), Math.sin(ang), -Math.sin(ang), Math.cos(ang), px, py);
        ctx.drawImage(arrowImg, -len / 2, -len * (arrowImg.height / arrowImg.width) / 2, len, len * (arrowImg.height / arrowImg.width));
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        const r = (p.kind === "wave" ? 26 : 16) * k;
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(this.tex.flash, px - r, py - r, r * 2, r * 2);
        ctx.globalCompositeOperation = "source-over";
      }
    }
  }
}

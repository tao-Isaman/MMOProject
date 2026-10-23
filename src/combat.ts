// Hits: normal attacks per weapon type, projectiles (arrows, staff bolts and skill shots),
// burning, and the floating numbers. Damage numbers come from stats.js.

import { mapX, mapY, S2, toView } from "./projection";
import { WEAPON_TYPES, OFFHAND_DAMAGE, weaponType } from "./items";
import type { WeaponId, WeaponType } from "./items";
import { AIR_GLOW, GROUND_GLOW, rand } from "./particles";
import type { Particles } from "./particles";
import { basicDamage, isMagic, poisonScale, lucky } from "./stats";
import type { Hit, Stats } from "./stats";
import type { Hero } from "./hero";
import type { Monster } from "./monsters";
import type { Target } from "./player";
import type { ElementId } from "./progression";
import type { Img, Textures, Vec2, View } from "./types";

export const UNARMED: WeaponType = { name: "มือเปล่า", motion: "thrust", hit: "line", reach: 90, width: 40, interval: 0.6, damage: [4, 7] };

// Weapon stats with the wielder's attack speed and reach bonuses (stats.js) folded in.
export function weaponStats(weaponId: string | null, stats: Stats | null = null): WeaponType {
  const type = weaponType(weaponId);
  const w = (type && WEAPON_TYPES[type]) || UNARMED;
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
  target?: Monster | null; // locked on: it homes in on this one and hits nothing else
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
  target: Monster | null;
}

interface CombatDeps {
  fx: Particles;
  tex: Textures;
  floaters: Floaters;
  monsters: Monster[];
  hero: Hero;
  onKill: (m: Monster) => void;
  onReflect?: (m: Monster, dmg: number) => void; // a monster sends part of a blow back
}

export class Combat {
  fx: Particles;
  tex: Textures;
  floaters: Floaters;
  monsters: Monster[];
  hero: Hero;
  onKill: (m: Monster) => void;
  onReflect?: (m: Monster, dmg: number) => void;
  onElement?: (m: Monster, el: ElementId, dmg: number) => void; // an enchanted normal hit's element riders
  onFalcon?: (m: Monster) => void;                              // the falcon dives in after a normal hit
  projectiles: Projectile[] = [];
  pending: { t: number; origin: Vec2; dir: Vec2; w: WeaponType; m: Monster | null }[] = []; // delayed second hits (weapons with hits > 1)
  offhits: { t: number; m: Monster; w: WeaponType; dir: Vec2 }[] = []; // off-hand follow-ups
  burnClock = 0;

  // hero: stats for damage; onKill(monster)
  constructor({ fx, tex, floaters, monsters, hero, onKill, onReflect }: CombatDeps) {
    this.fx = fx;
    this.tex = tex;
    this.floaters = floaters;
    this.monsters = monsters;
    this.hero = hero;
    this.onKill = onKill;
    this.onReflect = onReflect;
  }

  // The monster an attack locks on to: the player's target while it lives, else the one nearest
  // in front within `reach` (cm edge to edge).
  lockOn(player: { x: number; y: number; target: Target | null }, dir: Vec2, reach: number): Monster | null {
    const t = player.target as Monster | null;
    if (t?.alive && this.monsters.includes(t)) return t;
    let best: Monster | null = null, score = Infinity;
    for (const m of this.monsters) {
      if (!m.alive) continue;
      const dx = m.x - player.x, dy = m.y - player.y, d = Math.hypot(dx, dy) || 1;
      const edge = d - m.radius, ahead = (dx * dir.x + dy * dir.y) / d;
      if (edge > reach || ahead < 0.25) continue;
      const sc = edge * (2 - ahead);
      if (sc < score) [best, score] = [m, sc];
    }
    return best;
  }

  // The player's weapon lands: one monster, locked on (src/combat.ts lockOn). A bow or a staff
  // shoots a shot that homes in on it; a melee weapon hits it if it is within reach. A weapon
  // in the off hand follows up for OFFHAND_DAMAGE of its own damage.
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
      const target = this.lockOn(player, dir, p.range);
      let aim = dir;
      if (target) {
        const dx = target.x - origin.x, dy = target.y - origin.y, d = Math.hypot(dx, dy) || 1;
        aim = { x: dx / d, y: dy / d };
      }
      const onHit = (m: Monster, d: Vec2) => {
        this.damage(m, w, d);
        follow(m, d);
      };
      this.shoot(origin, aim, { ...p, onHit, target });
      // a second arrow after the first, now and then (the archer's double shot)
      if (p.kind === "arrow" && lucky(this.hero.stats.multiShot, this.hero.stats)) {
        const a = Math.atan2(aim.y, aim.x) + 0.07;
        this.shoot({ x: origin.x - aim.y * 14, y: origin.y + aim.x * 14 }, { x: Math.cos(a), y: Math.sin(a) }, { ...p, onHit, target });
      }
      return;
    }
    const target = this.lockOn(player, dir, w.reach + 40);
    const near = target && Math.hypot(target.x - origin.x, target.y - origin.y) - target.radius <= w.reach + 40;
    const at = near ? (() => {
      const dx = target.x - origin.x, dy = target.y - origin.y, d = Math.hypot(dx, dy) || 1;
      return { x: dx / d, y: dy / d };
    })() : dir;
    if (near) {
      this.damage(target, w, at);
      follow(target, at);
    }
    this.slashFx(origin, at, w);
    if ((w.hits ?? 1) > 1) this.pending.push({ t: 0.14, origin, dir: at, w, m: near ? target : null });
  }

  // Launch a projectile from `origin` along unit `aim`: { kind, speed, range, radius, pierce,
  // color, onHit(monster, dir) }.
  shoot(origin: Vec2, aim: Vec2, p: ShotSpec): void {
    this.projectiles.push({
      x: origin.x + aim.x * 40, y: origin.y + aim.y * 40, z: 60,
      vx: aim.x * p.speed, vy: aim.y * p.speed, left: p.range, kind: p.kind, radius: p.radius,
      color: p.color, pierce: !!p.pierce, onHit: p.onHit, hitSet: new Set(), age: 0, target: p.target ?? null,
    });
  }

  // A normal attack lands on a monster (scale < 1 for the off hand). An enchanted weapon hits in
  // its element (with that element's riders); the falcon may dive in after it.
  damage(m: Monster, w: WeaponType, dir: Vec2, scale = 1): void {
    const st = this.hero.stats, el = isMagic(w) ? null : this.hero.enchant, r = basicDamage(st, w, m, el);
    if (r.miss) return void this.apply(m, r, dir);
    if (scale !== 1) r.dmg = Math.max(1, Math.round(r.dmg * scale));
    if (st.stunHit && lucky(st.stunHit, st)) m.stun = Math.max(m.stun, 1);
    if (st.poisonHit && lucky(st.poisonHit, st)) {
      m.burns.push({ dps: (r.dmg * 0.4 * poisonScale(st, this.hero.progress.elements)) / 3, t: 3, poison: true });
    }
    this.apply(m, r, dir);
    if (el) this.onElement?.(m, el, r.dmg);
    if (st.falconChance && m.alive && lucky(st.falconChance, st)) this.onFalcon?.(m);
  }

  // Land a computed hit { dmg, crit, magic, miss } on a monster. A miss still angers it. Only a
  // skill made to push (knock) moves it; normal attacks don't, or a ranged fighter would keep
  // everything off for ever.
  apply(m: Monster, r: Hit, dir: Vec2, knock = 0): boolean {
    if (!m.alive) return false;
    if (r.miss) {
      m.provoke(dir);
      this.floaters.add(m.x, m.y, m.height, "พลาด", "miss");
      return false;
    }
    // an exposed monster takes more; the hunter's instinct, more on any status; more on its kind;
    // more the lower the player's HP (blood rage)
    const st = this.hero.stats, stone = this.hero.progress.elements.stone ?? 0;
    const low = st.lowHpDmg ? 1 + st.lowHpDmg * Math.max(0, 1 - this.hero.hp / st.maxHp) : 1;
    const more = (m.expose > 0 ? 1 + m.exposePct : 1) * (m.afflicted ? 1 + st.huntDmg : 1) * (m.petrify > 0 && stone >= 50 ? 1.25 : 1)
      * (1 + st[`${m.race}Dmg`]) * low;
    if (more !== 1) r.dmg = Math.max(1, Math.round(r.dmg * more));
    const died = m.hit(r.dmg, dir, knock);
    if (st.lifesteal > 0 && this.hero.alive) this.hero.heal(r.dmg * st.lifesteal);
    this.floaters.add(m.x, m.y, m.height, String(r.dmg), r.crit ? "crit" : r.magic ? "magic" : "damage");
    this.fx.add({ x: m.x, y: m.y, z: m.height * 0.5, layer: AIR_GLOW, tex: this.tex.flash, life: 0.18,
      size: [[0, 24], [1, 60]], alpha: [[0, 0.8], [1, 0]] });
    // a spiked shell or a mirror sends part of a blow (not a spell) back
    if (m.reflect > 0 && !r.magic && this.hero.alive) {
      const back = Math.round(r.dmg * m.reflect);
      if (back > 0) this.onReflect?.(m, back);
    }
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
      if (p.m?.alive) this.damage(p.m, p.w, p.dir);
      this.slashFx(p.origin, p.dir, p.w);
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      // locked on: it turns to its target wherever that goes (and flies on if it fell)
      if (p.target?.alive) {
        const dx = p.target.x - p.x, dy = p.target.y - p.y, d = Math.hypot(dx, dy) || 1, v = Math.hypot(p.vx, p.vy);
        p.vx = (dx / d) * v;
        p.vy = (dy / d) * v;
        p.left = Math.max(p.left, d + 60);
      }
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
        if (gone || !m.alive || p.hitSet.has(m) || (p.target && m !== p.target)) continue;
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

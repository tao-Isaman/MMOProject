// Normal attacks: hit shapes per weapon type, projectiles, and floating damage numbers.

import { mapX, mapY, S2 } from "./projection.js";
import { WEAPON_TYPES } from "./items.js";
import { AIR_GLOW, GROUND_GLOW, rand } from "./particles.js";

export const UNARMED = { name: "มือเปล่า", motion: "thrust", hit: "line", reach: 90, width: 40, interval: 0.6, damage: [4, 7] };

export function weaponStats(weaponId) {
  return (weaponId && WEAPON_TYPES[weaponId]) || UNARMED;
}

// How close the player walks before attacking a target with this weapon.
export function attackRange(w) {
  return w.projectile ? w.projectile.range * 0.85 : w.reach * 0.85;
}

function rollDamage(w) {
  const [a, b] = w.damage;
  const crit = Math.random() < (w.crit ?? 0.08);
  const dmg = Math.round(rand(a, b) * (crit ? 1.6 : 1));
  return { dmg, crit };
}

// Floating numbers and short labels that rise and fade over a world point.
export class Floaters {
  constructor() {
    this.list = [];
  }

  add(x, y, z, text, style = "damage") {
    this.list.push({ x, y, z, text, style, t: 0, life: style === "loot" ? 1.6 : 0.9, dx: rand(-14, 14) });
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const f = this.list[i];
      f.t += dt;
      if (f.t >= f.life) this.list.splice(i, 1);
    }
  }

  draw(ctx, view) {
    const { k, ox, oy } = view;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    for (const f of this.list) {
      const u = f.t / f.life;
      const rise = f.style === "loot" ? 40 * u : 60 * Math.sqrt(u);
      const px = (mapX(f.y) + f.dx * u) * k + ox;
      const py = mapY(f.x, f.z + rise) * k + oy;
      const big = f.style === "crit";
      const size = (big ? 30 : f.style === "loot" ? 17 : 22) * k * (big ? 1 + 0.3 * Math.max(0, 1 - u * 4) : 1);
      ctx.globalAlpha = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
      ctx.font = `600 ${size}px Kanit, system-ui, sans-serif`;
      ctx.lineWidth = Math.max(2, size * 0.16);
      ctx.strokeStyle = "rgba(20, 14, 10, 0.9)";
      ctx.fillStyle = { damage: "#fff6d8", crit: "#ffb347", loot: "#c9ffe0", info: "#ffd0c8" }[f.style];
      ctx.strokeText(f.text, px, py);
      ctx.fillText(f.text, px, py);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "start";
  }
}

// Melee hit test. dir = unit facing vector in world axes.
function meleeTargets(origin, dir, w, monsters) {
  const out = [];
  for (const m of monsters) {
    if (!m.alive) continue;
    const dx = m.x - origin.x, dy = m.y - origin.y;
    const along = dx * dir.x + dy * dir.y;
    const side = -dx * dir.y + dy * dir.x;
    const dist = Math.hypot(dx, dy) - m.radius;
    if (w.hit === "line") {
      if (along > -m.radius && along - m.radius < w.reach && Math.abs(side) < w.width / 2 + m.radius) out.push({ m, along });
    } else {
      const ang = (Math.atan2(side, along) * 180) / Math.PI;
      if (dist < w.reach && Math.abs(ang) < w.arc / 2 + 20) out.push({ m, along });
    }
  }
  out.sort((a, b) => a.along - b.along);
  return out.map((o) => o.m);
}

export class Combat {
  constructor({ fx, tex, floaters, monsters, onKill }) {
    Object.assign(this, { fx, tex, floaters, monsters, onKill });
    this.projectiles = [];
    this.pending = []; // delayed second hits (dual daggers)
  }

  // The player's weapon lands: resolve a melee hit or launch a projectile.
  strike(player, weaponId) {
    const w = weaponStats(weaponId);
    const dir = player.facing();
    const origin = { x: player.x, y: player.y };
    if (w.projectile) {
      const p = w.projectile;
      const tip = { x: origin.x + dir.x * 40, y: origin.y + dir.y * 40, z: 60 };
      // aim at the target if there is one, else straight ahead
      let aim = dir;
      if (player.target && player.target.alive) {
        const dx = player.target.x - tip.x, dy = player.target.y - tip.y, d = Math.hypot(dx, dy) || 1;
        aim = { x: dx / d, y: dy / d };
      }
      this.projectiles.push({ ...tip, vx: aim.x * p.speed, vy: aim.y * p.speed, left: p.range, kind: p.kind, radius: p.radius,
        w, pierce: !!w.pierce, hitSet: new Set(), age: 0 });
      return;
    }
    const hits = meleeTargets(origin, dir, w, this.monsters);
    const targets = w.pierce || w.hit !== "line" ? hits : hits.slice(0, 1);
    for (const m of targets) this.damage(m, w, dir);
    this.slashFx(origin, dir, w);
    if (w.hits > 1) this.pending.push({ t: 0.14, origin, dir, w });
  }

  damage(m, w, dir) {
    const { dmg, crit } = rollDamage(w);
    const died = m.hit(dmg, dir, w.knock ?? 25);
    this.floaters.add(m.x, m.y, m.height, String(dmg), crit ? "crit" : "damage");
    this.fx.add({ x: m.x, y: m.y, z: m.height * 0.5, layer: AIR_GLOW, tex: this.tex.flash, life: 0.18,
      size: [[0, 24], [1, 60]], alpha: [[0, 0.8], [1, 0]] });
    if (died) this.onKill(m);
  }

  slashFx(origin, dir, w) {
    const line = w.hit === "line";
    const reach = line ? w.reach : w.reach * 0.75;
    const n = line ? 6 : 9;
    for (let i = 0; i < n; i++) {
      let px, py;
      if (w.hit === "line") {
        const f = (i + 1) / n;
        px = origin.x + dir.x * reach * f;
        py = origin.y + dir.y * reach * f;
      } else {
        const a = Math.atan2(dir.y, dir.x) + ((i / (n - 1)) - 0.5) * ((w.arc * Math.PI) / 180);
        px = origin.x + Math.cos(a) * reach;
        py = origin.y + Math.sin(a) * reach;
      }
      this.fx.add({ x: px, y: py, z: 55, layer: AIR_GLOW, tex: this.tex.sparkle, life: 0.22 + i * 0.012,
        size: [[0, 14], [1, 4]], alpha: [[0, 0.9], [1, 0]] });
    }
  }

  update(dt) {
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const p = this.pending[i];
      p.t -= dt;
      if (p.t > 0) continue;
      this.pending.splice(i, 1);
      for (const m of meleeTargets(p.origin, p.dir, p.w, this.monsters).slice(0, 1)) this.damage(m, p.w, p.dir);
      this.slashFx(p.origin, p.dir, p.w);
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const step = Math.hypot(p.vx, p.vy) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.left -= step;
      p.age += dt;
      if (p.kind === "bolt") {
        this.fx.add({ x: p.x, y: p.y, z: p.z, layer: AIR_GLOW, tex: this.tex.mint, life: 0.25,
          size: [[0, 26], [1, 6]], alpha: [[0, 0.6], [1, 0]] });
      }
      let gone = p.left <= 0;
      for (const m of this.monsters) {
        if (gone || !m.alive || p.hitSet.has(m)) continue;
        if (Math.hypot(m.x - p.x, m.y - p.y) < m.radius + p.radius * 0.5) {
          const d = Math.hypot(p.vx, p.vy) || 1;
          this.damage(m, p.w, { x: p.vx / d, y: p.vy / d });
          p.hitSet.add(m);
          if (!p.pierce) gone = true;
        }
      }
      if (gone) {
        if (p.kind === "bolt") {
          this.fx.add({ x: p.x, y: p.y, z: p.z, layer: AIR_GLOW, tex: this.tex.flash, life: 0.3,
            size: [[0, 30], [1, 90]], alpha: [[0, 0.9], [1, 0]] });
          this.fx.add({ x: p.x, y: p.y, z: 0, layer: GROUND_GLOW, tex: this.tex.mint, life: 0.4,
            size: [[0, 40], [1, 120]], alpha: [[0, 0.5], [1, 0]] });
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  // Projectiles drawn over the scene (arrows as sprites, bolts as a glowing core).
  draw(ctx, view, arrowImg) {
    const { k, ox, oy } = view;
    for (const p of this.projectiles) {
      const px = mapX(p.y) * k + ox, py = mapY(p.x, p.z) * k + oy;
      // screen direction of travel: right = -Y, up = +X (squashed by the 45 degree view)
      const sx = -p.vy, sy = -p.vx * S2;
      const ang = Math.atan2(sy, sx);
      if (p.kind === "arrow" && arrowImg) {
        const len = 46 * k;
        ctx.setTransform(Math.cos(ang), Math.sin(ang), -Math.sin(ang), Math.cos(ang), px, py);
        ctx.drawImage(arrowImg, -len / 2, -len * (arrowImg.height / arrowImg.width) / 2, len, len * (arrowImg.height / arrowImg.width));
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else if (p.kind === "bolt") {
        const r = 16 * k;
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(this.tex.flash, px - r, py - r, r * 2, r * 2);
        ctx.globalCompositeOperation = "source-over";
      }
    }
  }
}

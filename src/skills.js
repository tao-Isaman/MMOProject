// Active skills: checks (learned, weapon, MP, cooldown), the caster's animation, and the effect
// of each skill type, with element bonuses (progression.js ELEMENTS):
//   fire       +1% skill damage per level; 10+: hits burn for 20% over 3 s
//   water      +2% healing per level; 10+: hits heal 5% of the damage
//   wind       cooldown (in stats); 10+: +25% move speed for 2 s after a skill
//   earth      shield of 0.4% max HP per level on every skill; 10+: stuns and slows last 30% longer
//   lightning  +0.3% skill crit per level; 10+: hits jump to one more monster for 30%
//
// Skill types: bolt, fan (projectiles) · blast (at the aimed point) · nova, storm (around the
// caster) · cone (in front) · beam (a line) · dash · heal · shield · buff · flower.

import { ACTIVES, MASTERIES } from "./progression.js";
import { skillDamage } from "./stats.js";
import { shapeTargets } from "./combat.js";
import { AIR_GLOW, GROUND_GLOW, rand } from "./particles.js";
import { FlowerSpell, CAST_TIME, HOVER_END } from "./spell.js";
import { WEAPON_TYPES } from "./items.js";

const LEAD = 0.22; // s from the start of the animation to the hit

export class Skills {
  constructor({ progress, hero, player, combat, monsters, fx, tex, floaters, spells, weapon }) {
    Object.assign(this, { progress, hero, player, combat, monsters, fx, tex, floaters, spells, weapon });
    this.timers = []; // { t, fn }
  }

  get el() {
    return this.progress.elements;
  }

  // Try a skill toward a world point. Returns null when it goes off, or why not.
  use(id, aim) {
    const a = ACTIVES[id];
    if (!a) return "ช่องว่าง";
    const rank = this.progress.skillRank(id);
    if (!rank) return "ยังไม่ได้เรียนสกิลนี้";
    if (!this.hero.alive) return "ล้มอยู่";
    const weapons = a.source.weapons;
    if (weapons && !weapons.includes(this.weapon())) return `ต้องถือ${MASTERIES[a.source.mastery].name}`;
    if (this.player.casting || this.player.dashing) return "กำลังใช้สกิลอื่น";
    if (this.hero.cooldowns.has(id)) return "ยังติดคูลดาวน์";
    const s = a.skill;
    if (!this.hero.spend(s.mp)) return "MP ไม่พอ";
    this.hero.cooldowns.set(id, s.cd * (1 - this.hero.stats.cdr));
    this.hero.cdTotal = this.hero.cdTotal ?? new Map();
    this.hero.cdTotal.set(id, s.cd * (1 - this.hero.stats.cdr));

    const p = this.player;
    let dir = p.facing();
    if (aim) {
      const dx = aim.x - p.x, dy = aim.y - p.y, d = Math.hypot(dx, dy);
      if (d > 1) dir = { x: dx / d, y: dy / d };
    }
    p.target = null;
    if (s.cast) p.startCast(s.cast, s.type === "flower" ? HOVER_END : s.cast);
    else p.startMotion(s.motion, dir, this.weaponStats());
    this.effect(id, s, rank, dir, aim);
    this.afterCast();
    return null;
  }

  weaponStats() {
    const w = WEAPON_TYPES[this.weapon()];
    return w ?? { motion: "thrust" };
  }

  later(t, fn) {
    this.timers.push({ t, fn });
  }

  update(dt) {
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i];
      tm.t -= dt;
      if (tm.t <= 0) {
        this.timers.splice(i, 1);
        tm.fn();
      }
    }
  }

  // Element effects that follow any skill.
  afterCast() {
    const earth = this.el.earth ?? 0, wind = this.el.wind ?? 0;
    if (earth) {
      this.hero.addShield(this.hero.stats.maxHp * 0.004 * earth, 4);
      this.ring(this.player.x, this.player.y, "#d6a35c", 90, 0.5);
    }
    if (wind >= 10) this.hero.addBuff("wind_rush", "สายลม", { move: 0.25 }, 2);
  }

  // Damage a monster with a skill, then the element riders.
  hit(m, s, rank, dir, knock = 20, chained = false) {
    if (!m.alive) return;
    const r = skillDamage(this.hero.stats, this.el, s, rank, m, WEAPON_TYPES[this.weapon()]);
    if (chained) r.dmg = Math.max(1, Math.round(r.dmg * 0.3));
    const earth = (this.el.earth ?? 0) >= 10 ? 1.3 : 1;
    if (s.stun) m.stun = Math.max(m.stun, s.stun(rank) * earth);
    if (s.freeze) m.freeze = Math.max(m.freeze, s.freeze(rank) * earth);
    if (s.slow) m.slow = Math.max(m.slow, s.slow(rank) * earth);
    this.combat.apply(m, r, dir, knock);
    if ((this.el.fire ?? 0) >= 10) m.burns.push({ dps: (r.dmg * 0.2) / 3, t: 3 });
    if ((this.el.water ?? 0) >= 10) this.hero.heal(r.dmg * 0.05);
    if (!chained && (this.el.lightning ?? 0) >= 10) {
      const next = this.monsters.filter((o) => o !== m && o.alive && Math.hypot(o.x - m.x, o.y - m.y) < 260)
        .sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))[0];
      if (next) {
        this.zap(m, next);
        this.hit(next, s, rank, dir, 0, true);
      }
    }
  }

  healAmount(raw) {
    return raw * (1 + 0.02 * (this.el.water ?? 0));
  }

  effect(id, s, rank, dir, aim) {
    const p = this.player, origin = { x: p.x, y: p.y };
    const hitAll = (list, knock) => list.forEach((m) => this.hit(m, s, rank, dir, knock));
    switch (s.type) {
      case "bolt":
        this.later(LEAD, () => this.combat.shoot({ x: p.x, y: p.y }, dir, {
          kind: s.pierce ? "wave" : "skill", speed: s.speed, range: s.range, radius: s.radius, pierce: s.pierce,
          onHit: (m, d) => this.hit(m, s, rank, d),
        }));
        break;
      case "fan":
        this.later(LEAD, () => {
          const base = Math.atan2(dir.y, dir.x), spread = (s.spread * Math.PI) / 180;
          for (let i = 0; i < s.count; i++) {
            const a = base + (i / (s.count - 1) - 0.5) * spread;
            this.combat.shoot({ x: p.x, y: p.y }, { x: Math.cos(a), y: Math.sin(a) }, {
              kind: s.arrow ? "arrow" : "bolt", speed: s.speed, range: s.range, radius: s.radius,
              onHit: (m, d) => this.hit(m, s, rank, d),
            });
          }
        });
        break;
      case "blast": {
        const dist = aim ? Math.min(s.range, Math.hypot(aim.x - p.x, aim.y - p.y)) : s.range * 0.6;
        const at = { x: p.x + dir.x * dist, y: p.y + dir.y * dist };
        this.ring(at.x, at.y, s.color, s.radius * 2, s.delay + LEAD, true);
        this.later(s.delay + LEAD, () => {
          hitAll(shapeTargets(at, dir, { hit: "circle", reach: s.radius }, this.monsters), 30);
          this.burst(at.x, at.y, s.color, s.radius);
        });
        break;
      }
      case "nova":
        this.later(LEAD * 0.8, () => {
          for (const m of shapeTargets({ x: p.x, y: p.y }, dir, { hit: "circle", reach: s.radius }, this.monsters)) {
            const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy) || 1;
            this.hit(m, s, rank, { x: dx / d, y: dy / d }, s.knock ?? 20);
          }
          this.ring(p.x, p.y, s.color, s.radius * 2, 0.45);
          this.burst(p.x, p.y, s.color, s.radius * 0.7);
        });
        break;
      case "storm":
        for (let i = 0; i < s.pulses; i++) {
          this.later(LEAD * 0.5 + i * s.every, () => {
            for (const m of shapeTargets({ x: p.x, y: p.y }, dir, { hit: "circle", reach: s.radius }, this.monsters)) {
              const dx = m.x - p.x, dy = m.y - p.y, d = Math.hypot(dx, dy) || 1;
              this.hit(m, s, rank, { x: dx / d, y: dy / d }, 10);
            }
            this.ring(p.x, p.y, s.color, s.radius * 2, 0.25);
            if (i < s.pulses - 1) p.startMotion(i % 2 ? "swing" : "thrust", dir, this.weaponStats(), 0.2);
          });
        }
        break;
      case "cone":
        for (let i = 0; i < (s.hits ?? 1); i++) {
          this.later(LEAD + i * 0.16, () => {
            hitAll(shapeTargets(origin, dir, { hit: "arc", reach: s.reach, arc: s.arc }, this.monsters), s.knock ?? 30);
            this.fan(origin, dir, s.reach, s.arc, s.color);
            if (i > 0) p.startMotion(s.motion, dir, this.weaponStats(), 0.25);
          });
        }
        break;
      case "beam":
        this.later(LEAD, () => {
          hitAll(shapeTargets({ x: p.x, y: p.y }, dir, { hit: "line", reach: s.length, width: s.width }, this.monsters), 20);
          this.line({ x: p.x, y: p.y }, dir, s.length, s.color);
        });
        break;
      case "dash": {
        const hit = new Set();
        p.startDash(dir, s.distance, 0.2, () => {
          for (const m of shapeTargets({ x: p.x, y: p.y }, dir, { hit: "circle", reach: s.width }, this.monsters)) {
            if (hit.has(m)) continue;
            hit.add(m);
            this.hit(m, s, rank, dir, 30);
          }
          this.fx.add({ x: p.x, y: p.y, z: 50, layer: AIR_GLOW, tex: this.tex.sparkle, life: 0.35,
            size: [[0, 40], [1, 8]], alpha: [[0, 0.8], [1, 0]] });
        });
        break;
      }
      case "heal":
        this.later(LEAD, () => {
          const got = this.hero.heal(this.healAmount(this.hero.stats.maxHp * s.heal(rank) + this.hero.stats[s.stat] * s.mult(rank)));
          this.floaters.add(p.x, p.y, 130, `+${Math.round(got)}`, "heal");
          this.sparkleUp(p.x, p.y, this.tex.mint, 26);
        });
        break;
      case "shield":
        this.later(LEAD, () => {
          const amount = this.hero.stats.maxMp * s.base(rank) + this.hero.stats.matk * s.mult(rank);
          this.hero.addShield(amount, s.duration);
          this.floaters.add(p.x, p.y, 130, `โล่ ${Math.round(amount)}`, "shield");
          this.ring(p.x, p.y, s.color, 140, 0.6);
        });
        break;
      case "buff":
        this.later(LEAD, () => {
          this.hero.addBuff(id, ACTIVES[id].name, s.buff(rank), s.duration);
          if (s.heal) {
            const got = this.hero.heal(this.healAmount(this.hero.stats.maxHp * s.heal(rank)));
            if (got >= 1) this.floaters.add(p.x, p.y, 130, `+${Math.round(got)}`, "heal");
          }
          this.floaters.add(p.x, p.y, 150, ACTIVES[id].name, "level");
          this.ring(p.x, p.y, s.color, 180, 0.5);
          this.sparkleUp(p.x, p.y, this.tex.flash, 16);
        });
        break;
      case "flower": {
        const at = { x: p.x, y: p.y };
        this.spells.push(new FlowerSpell(this.fx, this.tex, at.x, at.y, p));
        this.later(CAST_TIME, () => {
          const got = this.hero.heal(this.healAmount(this.hero.stats.maxHp * s.heal(rank)));
          if (got >= 1) this.floaters.add(p.x, p.y, 130, `+${Math.round(got)}`, "heal");
        });
        for (let i = 0; i < s.ticks; i++) {
          this.later(CAST_TIME + 0.4 + i * 1, () => {
            for (const m of shapeTargets(at, dir, { hit: "circle", reach: s.radius }, this.monsters)) {
              const dx = m.x - at.x, dy = m.y - at.y, d = Math.hypot(dx, dy) || 1;
              this.hit(m, s, rank, { x: dx / d, y: dy / d }, 5);
            }
          });
        }
        break;
      }
    }
  }

  // ---- effects ----
  ring(x, y, color, size, life, ground = false) {
    this.fx.add({ x, y, z: 2, layer: GROUND_GLOW, tex: this.tex.ringFor(color), flat: true, life,
      size: ground ? [[0, size * 0.9], [1, size]] : [[0, size * 0.3], [1, size]], alpha: [[0, 0.9], [0.7, 0.6], [1, 0]] });
  }

  burst(x, y, color, radius) {
    const tex = this.tex.glowFor(color);
    for (let i = 0; i < 18; i++) {
      const a = rand(0, Math.PI * 2), r = rand(0, radius);
      this.fx.add({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, z: rand(10, 60), layer: AIR_GLOW, tex, life: rand(0.35, 0.6),
        size: [[0, rand(30, 60)], [1, 6]], alpha: [[0, 0.9], [1, 0]], vz: rand(60, 180) });
    }
    this.fx.add({ x, y, z: 30, layer: AIR_GLOW, tex: this.tex.flash, life: 0.3, size: [[0, radius], [1, radius * 1.8]], alpha: [[0, 0.8], [1, 0]] });
  }

  fan(origin, dir, reach, arc, color) {
    const tex = this.tex.glowFor(color), n = 10;
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(dir.y, dir.x) + (i / (n - 1) - 0.5) * ((arc * Math.PI) / 180);
      this.fx.add({ x: origin.x + Math.cos(a) * reach * 0.8, y: origin.y + Math.sin(a) * reach * 0.8, z: 50, layer: AIR_GLOW, tex,
        life: 0.3 + i * 0.01, size: [[0, 34], [1, 6]], alpha: [[0, 0.9], [1, 0]] });
    }
  }

  line(origin, dir, length, color) {
    const tex = this.tex.glowFor(color);
    for (let d = 40; d < length; d += 22) {
      this.fx.add({ x: origin.x + dir.x * d, y: origin.y + dir.y * d, z: 55, layer: AIR_GLOW, tex, life: 0.45,
        size: [[0, 46], [1, 10]], alpha: [[0, 0.95], [1, 0]] });
    }
  }

  zap(a, b) {
    for (let i = 0; i <= 8; i++) {
      const f = i / 8;
      this.fx.add({ x: a.x + (b.x - a.x) * f + rand(-10, 10), y: a.y + (b.y - a.y) * f + rand(-10, 10), z: 50, layer: AIR_GLOW,
        tex: this.tex.glowFor("#fff27a"), life: 0.25, size: [[0, 26], [1, 6]], alpha: [[0, 1], [1, 0]] });
    }
  }

  sparkleUp(x, y, tex, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), r = rand(10, 60);
      this.fx.add({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, z: rand(0, 40), layer: AIR_GLOW, tex, life: rand(0.6, 1),
        size: [[0, 18], [1, 4]], alpha: [[0, 0.9], [1, 0]], vz: rand(80, 160) });
    }
  }
}

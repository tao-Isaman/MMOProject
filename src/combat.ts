// Hits: normal attacks per weapon type (and a druid's in a form), projectiles (arrows, staff
// bolts and skill shots), the counter, burning, and the floating numbers. Damage numbers come
// from stats.js.

import { fromView, mapX, mapY, S2, toView } from "./projection";
import { sound } from "./audio";
import { WEAPON_TYPES, OFFHAND_DAMAGE, weaponType } from "./items";
import type { WeaponId, WeaponType } from "./items";
import { AIR_GLOW, GROUND_GLOW, rand } from "./particles";
import type { Particles } from "./particles";
import { basicDamage, isMagic, poisonScale, lucky, skillDamage } from "./stats";
import type { Hit, Stats } from "./stats";
import type { Hero } from "./hero";
import type { Monster } from "./monsters";
import type { Target } from "./player";
import type { ElementId, SkillDef } from "./progression";
import type { Img, Textures, Vec2, View } from "./types";

// Where a gun's muzzle is when she fires: this far ahead of her (cm) and this high, and this far
// to the side when she aims up or down the screen.
const MUZZLE = { out: 62, z: 95, side: 44 };
const soundSeed = (text: string): number => { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return h >>> 0; };

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

// A form's normal attack (SkillDef.formAttack) as a weapon to swing: a blow `reach` in front, or
// a shot as far as `range`, one every `every` s, with the wielder's attack speed and reach.
export type FormAttack = NonNullable<SkillDef["formAttack"]>;
export function formWeapon(fa: FormAttack, stats: Stats): WeaponType {
  const reach = 1 + stats.reach;
  return {
    name: "ร่างแปลง", motion: "swing", hit: "arc", arc: 100, reach: (fa.reach ?? 130) * reach, damage: [0, 0],
    interval: (fa.every ?? 1) / (1 + stats.aspd),
    projectile: fa.kind === "ranged" ? { kind: "bolt", speed: 950, range: (fa.range ?? 560) * reach, radius: 26 } : undefined,
  };
}

// The counter: 150% of attack (and the weapon in hand), a physical skill hit.
const COUNTER: SkillDef = { type: "cone", stat: "atk", mult: () => 1.5, mp: 0, cd: 0, motion: "swing", color: "#ffd27a" };

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
  kind: "bolt" | "arrow" | "bullet" | "wave" | "skill";
  speed: number;
  range: number;
  radius: number;
  pierce?: boolean;
  color?: string;
  vfxTheme?: string;
  glyph?: string;
  vfxSignature?: number;
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
  vfxTheme?: string;
  glyph?: string;
  vfxSignature?: number;
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
  onBasicHit?: (m: Monster) => void;                            // a main-hand normal hit landed (autocast)
  projectiles: Projectile[] = [];
  pending: { t: number; origin: Vec2; dir: Vec2; w: WeaponType; m: Monster | null }[] = []; // delayed second hits (weapons with hits > 1)
  offhits: { t: number; m: Monster; w: WeaponType; dir: Vec2; from: Vec2 }[] = []; // off-hand follow-ups (from: who strikes)
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
  strike(player: { x: number; y: number; target: Target | null; aimDir(): Vec2; projectileOrigin?(): Vec2 }, weaponId: string | null, offhand: WeaponId | null = null): void {
    const w = weaponStats(weaponId, this.hero.stats);
    const off = offhand ? weaponStats(offhand, this.hero.stats) : null;
    const follow = (m: Monster, d: Vec2) => {
      if (off) this.offhits.push({ t: 0.13, m, w: off, dir: d, from: player });
    };
    const dir = player.aimDir();
    const origin = w.projectile
      ? player.projectileOrigin?.() ?? { x: player.x, y: player.y }
      : { x: player.x, y: player.y };
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
    sound.play("swing", soundSeed(`${w.name}:${w.motion}`));
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

  // A normal attack in a form (the druid's): a blow at the one in front within reach, or a shot in
  // the form's colour that homes in on it; `mult` of attack (or magic attack) in its element,
  // `heal` of the damage done back as HP. Like a weapon's blow, it may set an autocast going.
  formStrike(player: { x: number; y: number; target: Target | null; aimDir(): Vec2; projectileOrigin?(): Vec2 }, fa: FormAttack, rank: number, w: WeaponType, color: string): void {
    const blow: SkillDef = { type: "cone", stat: fa.stat ?? "atk", element: fa.element, mult: fa.mult, mp: 0, cd: 0, motion: "swing", color };
    const origin = { x: player.x, y: player.y };
    const land = (m: Monster, d: Vec2) => {
      const r = skillDamage(this.hero.stats, this.hero.progress.elements, blow, rank, m);
      this.apply(m, r, d);
      if (r.miss) return;
      if (fa.element) this.onElement?.(m, fa.element, r.dmg);
      const got = fa.heal && this.hero.alive ? this.hero.heal(r.dmg * fa.heal(rank)) : 0;
      if (got >= 1) this.floaters.add(player.x, player.y, 130, `+${Math.round(got)}`, "heal");
      this.onBasicHit?.(m);
    };
    const dir = player.aimDir();
    if (w.projectile) {
      const shotOrigin = player.projectileOrigin?.() ?? origin;
      const p = w.projectile, target = this.lockOn(player, dir, p.range);
      const aim = target ? this.toward(shotOrigin, target) : dir;
      this.shoot(shotOrigin, aim, { kind: "skill", speed: p.speed, range: p.range, radius: p.radius, color, target, onHit: land });
      return;
    }
    const target = this.lockOn(player, dir, w.reach + 40);
    const near = target && Math.hypot(target.x - origin.x, target.y - origin.y) - target.radius <= w.reach + 40;
    const at = near ? this.toward(origin, target) : dir;
    if (!w.projectile) sound.play("swing", soundSeed(`form:${fa.kind}:${w.motion}`));
    if (near) land(target, at);
    this.slashFx(origin, at, w);
  }

  // The counter stat: a monster whose blow just landed on the player (from close by) is struck
  // straight back, "สวนกลับ" over her. w: the weapon in hand (its power), null without one.
  counter(m: Monster, from: Vec2, w: WeaponType | null): void {
    const dir = this.toward(from, m);
    this.floaters.add(from.x, from.y, 165, "สวนกลับ", "level");
    this.apply(m, skillDamage(this.hero.stats, this.hero.progress.elements, COUNTER, 1, m, w), dir);
    this.slashFx(from, dir, w ?? UNARMED);
  }

  private toward(a: Vec2, b: Vec2): Vec2 {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    return { x: dx / d, y: dy / d };
  }

  // Launch a projectile from `origin` along unit `aim`: { kind, speed, range, radius, pierce,
  // color, onHit(monster, dir) }. A bullet leaves from the muzzle of the gun held out at
  // shoulder height, in a flash.
  shoot(origin: Vec2, aim: Vec2, p: ShotSpec): void {
    sound.playProjectile(p.kind, p.vfxTheme ?? p.glyph ?? "");
    const gun = p.kind === "bullet", z = gun ? MUZZLE.z : 60;
    const v = toView(aim.x, aim.y), len = Math.hypot(v.left, v.fwd) || 1;
    // aimed off to a far corner, the gun is held out at arm's length in the hand that points it
    // (not between her hands), so its muzzle is farther out
    const out = gun ? MUZZLE.out * (1 + 1.4 * (Math.max(0, v.fwd) / len) * (Math.abs(v.left) / len)) : 40;
    let x = origin.x + aim.x * out, y = origin.y + aim.y * out;
    // a gun aimed straight up or down the screen is held out at the side (weapons.ts aimAngle)
    if (gun && Math.abs(v.left) < 0.3 * Math.hypot(v.left, v.fwd * S2)) {
      const right = fromView(0, -MUZZLE.side);
      x += right.x;
      y += right.y;
    }
    this.projectiles.push({
      x, y, z, vx: aim.x * p.speed, vy: aim.y * p.speed, left: p.range, kind: p.kind, radius: p.radius,
      color: p.color, vfxTheme: p.vfxTheme, glyph: p.glyph, vfxSignature: p.vfxSignature, pierce: !!p.pierce, onHit: p.onHit, hitSet: new Set(), age: 0, target: p.target ?? null,
    });
    if (gun) this.muzzleFlash(x, y, z, aim);
  }

  // A gun going off: a hot flash at the muzzle and a few sparks thrown forward.
  muzzleFlash(x: number, y: number, z: number, aim: Vec2): void {
    this.fx.add({ x, y, z, layer: AIR_GLOW, tex: this.tex.glowFor("#ffcf6a"), life: 0.12, size: [[0, 56], [1, 18]], alpha: [[0, 1], [1, 0]] });
    this.fx.add({ x, y, z, layer: AIR_GLOW, tex: this.tex.flash, life: 0.08, size: [[0, 26], [1, 8]], alpha: [[0, 1], [1, 0]] });
    for (let i = 0; i < 3; i++) {
      const v = rand(260, 520), a = Math.atan2(aim.y, aim.x) + rand(-0.5, 0.5);
      this.fx.add({ x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: rand(-40, 60), layer: AIR_GLOW, tex: this.tex.ember,
        life: rand(0.1, 0.18), size: [[0, 9], [1, 2]], alpha: [[0, 1], [1, 0]] });
    }
  }

  // Where a bullet stops: a small hot spark and a spray of embers.
  sparks(x: number, y: number, z: number): void {
    this.fx.add({ x, y, z, layer: AIR_GLOW, tex: this.tex.glowFor("#ffd88a"), life: 0.14, size: [[0, 30], [1, 10]], alpha: [[0, 0.9], [1, 0]] });
    for (let i = 0; i < 4; i++) {
      const a = rand(0, Math.PI * 2), v = rand(120, 300);
      this.fx.add({ x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: rand(40, 200), layer: AIR_GLOW, tex: this.tex.ember,
        life: rand(0.15, 0.3), size: [[0, 8], [1, 2]], alpha: [[0, 1], [1, 0]] });
    }
  }

  // A normal attack lands on a monster (scale < 1 for the off hand). An enchanted weapon hits in
  // its element (with that element's riders); the falcon may dive in after it; a thief's dagger
  // may land twice (again: this is that second blow).
  damage(m: Monster, w: WeaponType, dir: Vec2, scale = 1, again = false): void {
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
    if (!again && scale === 1) this.onBasicHit?.(m);
    if (!again && st.doubleHit && m.alive && lucky(st.doubleHit, st)) this.damage(m, w, dir, scale, true);
  }

  // Land a computed hit { dmg, crit, magic, miss } on a monster. A miss still angers it. Only a
  // skill made to push (knock) moves it; normal attacks don't, or a ranged fighter would keep
  // everything off for ever. ally: one of the player's allies struck (src/allies.ts): her hiding,
  // lifesteal and the monster's spikes have nothing to do with it.
  apply(m: Monster, r: Hit, dir: Vec2, knock = 0, ally = false): boolean {
    if (!m.alive) return false;
    if (r.miss) {
      sound.play("miss", soundSeed(m.variant.id));
      m.provoke(dir);
      this.floaters.add(m.x, m.y, m.height, "พลาด", "miss");
      return false;
    }
    // an exposed monster takes more; the hunter's instinct, more on any status; more on its kind;
    // more the lower the player's HP (blood rage)
    const st = this.hero.stats, stone = this.hero.progress.elements.stone ?? 0;
    const low = st.lowHpDmg ? 1 + st.lowHpDmg * Math.max(0, 1 - this.hero.hp / st.maxHp) : 1;
    // the first blow from hiding lands harder, and ends the hiding
    const ambush = this.hero.hidden && !ally ? 1 + st.ambush : 1;
    if (this.hero.hidden && !ally) this.hero.reveal();
    const more = (m.expose > 0 ? 1 + m.exposePct : 1) * (m.afflicted ? 1 + st.huntDmg : 1) * (m.petrify > 0 && stone >= 50 ? 1.25 : 1)
      * (1 + st[`${m.race}Dmg`]) * low * ambush;
    if (more !== 1) r.dmg = Math.max(1, Math.round(r.dmg * more));
    const died = m.hit(r.dmg, dir, knock);
    sound.play(r.crit ? "critical" : "impact", r.dmg + soundSeed(m.variant.id));
    if (st.lifesteal > 0 && this.hero.alive && !ally) this.hero.heal(r.dmg * st.lifesteal);
    this.floaters.add(m.x, m.y, m.height, String(r.dmg), r.crit ? "crit" : r.magic ? "magic" : "damage");
    this.fx.add({ x: m.x, y: m.y, z: m.height * 0.5, layer: AIR_GLOW, tex: this.tex.flash, life: 0.18,
      size: [[0, 24], [1, 60]], alpha: [[0, 0.8], [1, 0]] });
    // a spiked shell or a mirror sends part of a blow (not a spell) back
    if (m.reflect > 0 && !r.magic && this.hero.alive && !ally) {
      const back = Math.round(r.dmg * m.reflect);
      if (back > 0) this.onReflect?.(m, back);
    }
    if (died) {
      sound.play("enemy-death", soundSeed(m.variant.id));
      this.onKill(m);
    }
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
      if (!h.m.alive) continue;
      const shot = h.w.projectile?.kind === "bullet" ? h.w.projectile : null;
      if (!shot) {
        this.damage(h.m, h.w, h.dir, OFFHAND_DAMAGE);
        continue;
      }
      // a pistol in the off hand fires its own bullet at it
      const d = Math.hypot(h.m.x - h.from.x, h.m.y - h.from.y) || 1;
      this.shoot(h.from, { x: (h.m.x - h.from.x) / d, y: (h.m.y - h.from.y) / d }, { ...shot, target: h.m, onHit: (m, dir) => this.damage(m, h.w, dir, OFFHAND_DAMAGE) });
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
      if ((p.kind !== "bullet" || p.vfxSignature !== undefined) && (p.kind !== "arrow" || !!p.color)) {
        const glyphMotion = p.glyph === "wave" || p.glyph === "swirl" ? 1.8 : p.glyph === "beam" || p.glyph === "pierce" ? 0.45 : 1;
        const phase = ((p.vfxSignature ?? 0) % 31) * 0.2 + p.age * (2 + ((p.vfxSignature ?? 0) % 7)) * glyphMotion;
        const side = Math.sin(phase) * (3 + ((p.vfxSignature ?? 0) % 9)) * glyphMotion;
        const speed = Math.hypot(p.vx, p.vy) || 1, tx = -p.vy / speed, ty = p.vx / speed;
        const trailX = p.x + tx * side, trailY = p.y + ty * side;
        const tex = p.vfxTheme === "fire" ? this.tex.ember : p.color ? this.tex.glowFor(p.color) : p.kind === "bolt" ? this.tex.mint : this.tex.sparkle;
        if (p.vfxTheme === "plant") {
          this.fx.add({ x: trailX, y: trailY, z: p.z, layer: SORTED, atlas: this.tex.petals, frame: Math.floor(p.age * 18 + (p.vfxSignature ?? 0)) % 4, life: 0.34,
            size: [[0, 12], [1, 3]], alpha: [[0, 0.75], [1, 0]] });
        } else {
          const scale = 0.8 + ((p.vfxSignature ?? 0) % 7) * 0.08;
          this.fx.add({ x: trailX, y: trailY, z: p.z, layer: AIR_GLOW, tex, life: 0.25 + ((p.vfxSignature ?? 0) % 4) * 0.03,
            size: [[0, (p.kind === "wave" ? 40 : 26) * scale], [1, 6]], alpha: [[0, 0.6], [1, 0]] });
        }
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
        // a bullet strikes sparks off what it hits; magic bursts
        if (p.kind === "bullet") this.sparks(p.x, p.y, p.z);
        else if (p.kind !== "arrow") {
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
          if (died) {
            sound.play("enemy-death", soundSeed(m.variant.id));
            this.onKill(m);
          }
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
      } else if (p.kind === "bullet") {
        this.tracer(ctx, px, py, ang, k, Math.min(1, p.age / 0.03));
      } else {
        const r = (p.kind === "wave" ? 26 : 16) * k;
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(p.color ? this.tex.glowFor(p.color) : this.tex.flash, px - r, py - r, r * 2, r * 2);
        ctx.globalCompositeOperation = "source-over";
      }
    }
  }

  // A bullet in flight: a short streak, red-gold at its tail and white-hot at its head (grown
  // to full length over its first moment, so it starts at the muzzle).
  tracer(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, k: number, grown: number): void {
    const len = 34 * k * grown, w = 3.2 * k;
    ctx.setTransform(Math.cos(ang), Math.sin(ang), -Math.sin(ang), Math.cos(ang), x, y);
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(-len, 0, 0, 0);
    g.addColorStop(0, "rgba(255, 120, 40, 0)");
    g.addColorStop(0.6, "rgba(255, 196, 90, 0.75)");
    g.addColorStop(1, "rgba(255, 250, 225, 1)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(-w, -w / 2);
    ctx.arc(0, 0, w / 2, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-w, w / 2);
    ctx.closePath();
    ctx.fill();
    ctx.drawImage(this.tex.flash, -5 * k, -5 * k, 10 * k, 10 * k);
    ctx.globalCompositeOperation = "source-over";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

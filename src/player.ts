// The elf mage: WASD or click-to-target movement over the courtyard, 8-direction sprite
// animation, a normal attack that depends on the equipped weapon, hover while casting.
//
// Sheets are the Oriverse sprite `mage_twintail` (tools/sprite_cells.py): one row per direction
// in Oriverse order (front, then clockwise seen from above), one column per frame, pivot at the
// bottom centre of each cell. The character is empty-handed; the weapon is drawn into her hand
// during attacks and casts (src/weapons.js). In a form (a druid's) she is drawn as a monster's
// sheet instead (`shape`, set by main.ts): four directions, its walk and its attack.

import { groundFromMap, mapX, mapY, yaw, yawEighths } from "./projection";
import { resolve } from "./world";
import { attackRange } from "./combat";
import { WEAPON_ART, drawWeapon, heldAngle, screenAngle, weaponTip } from "./weapons";
import { silhouette } from "./recolor";
import type { WeaponArt } from "./weapons";
import type { WeaponType } from "./items";
import type { Sheet } from "./allies";
import type { Hands } from "./look";
import type { Img, Vec2, View } from "./types";

// What the player can chase and hit.
export interface Target extends Vec2 {
  alive: boolean;
  radius: number;
}

// The weapon fields an attack or skill animation looks at.
export interface AttackWeapon {
  motion: string;
  builtin?: boolean;
  skill?: boolean;
}

interface Attack {
  t: number;
  motion: string;
  dur: number;
  frames: number;
  hit: boolean;   // true once the weapon landed (or never will, for skill motions)
  w: AttackWeapon;
  aim: Vec2;
}

interface Cast {
  t: number;
  duration: number;
  hoverEnd: number;
  x: number;
  y: number;
}

const SPEED = 380;        // cm/s
export const RADIUS = 24; // collision radius, cm
const HEIGHT = 128;       // on-screen height of the character, map px
const HEAD = 0.93;        // fraction of the height from the pivot up to just above the hair
const WALK_CYCLE = 170;   // cm walked per walk loop (two steps)
const HOVER = 24;         // cm the caster floats during the spell
const HOVER_RAMP = 40 / 60;
// how far into each attack clip the weapon lands (the mage's clips have 8 frames, the
// costume bodies' attacks 4; both play over the same time)
const HIT_AT: Record<string, number> = { swing: 3 / 8, thrust: 4 / 8, shoot: 4 / 8 };
const ATTACK_TIME = 8 / 12;
const WINDUP_AT = 3 / 8;  // the cast holds this frame while the cast bar fills
const SHAPE_SIZE = [130, 190]; // cm tall a form is drawn, whatever the monster it looks like

export const DIRECTIONS = ["south", "south-west", "west", "north-west", "north", "north-east", "east", "south-east"];

// World direction -> facing index, counted like the sheet rows as seen from the yaw-0 camera
// (x = +X up the screen, y = +Y screen left). The sheet row on screen is viewRow(index).
export function directionIndex(x: number, y: number): number {
  const a = Math.atan2(y, -x); // 0 = towards the camera, +90 = screen left
  return ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
}

// Sheet row showing facing index i from the current camera (the nearest of the 8 views).
export function viewRow(i: number): number {
  return (i + yawEighths()) % 8;
}

// Unit world vector a facing index points along.
export function directionVector(i: number): Vec2 {
  const a = (i * Math.PI) / 4;
  return { x: -Math.cos(a), y: Math.sin(a) };
}

export class Player {
  x: number;
  y: number;
  z = 0;
  gemGlow: Img;
  dir = 0;          // facing index, see directionIndex
  walked = 0;
  moving = false;
  time = 0;
  cast: Cast | null = null;
  attack: Attack | null = null;
  cooldown = 0;
  target: Target | null = null; // monster to walk to and keep attacking
  dash: { vx: number; vy: number; t: number; onStep?: () => void } | null = null;
  speedMul = 1;     // from the hero's move speed
  dead = false;
  hurtFlash = 0;
  sheets!: Record<string, Img>;
  flashes: Record<string, Img> = {};
  anchors?: Hands;
  builtin: Record<string, boolean> = {};
  cell = 96;
  scale = 1;
  shape: Sheet | null = null; // a form's look, drawn instead of her (null: herself)
  orbs: Img[] = [];           // the glows of the element orbs she holds, circling over her head
  private redShapes = new Map<Img, Img>(); // its red copies for a hit

  // sheets: { idle, walk, swing, thrust, shoot, cast? }; anchors: hand positions per clip
  // (they change with the body, see setSheets);
  // gemGlow: soft glow drawn on the staff tip while casting
  constructor(x: number, y: number, sheets: Record<string, Img>, anchors: Hands | undefined, gemGlow: Img) {
    this.x = x;
    this.y = y;
    this.setSheets(sheets, anchors);
    this.gemGlow = gemGlow;
  }

  // builtin: clips whose Oriverse animation already draws a weapon (the swing a sword, the shoot
  // a bow), played as drawn only with that weapon in hand (see clipFor)
  setSheets(sheets: Record<string, Img>, anchors: Hands | undefined, builtin: Record<string, boolean> = {}): void {
    this.sheets = sheets;
    this.flashes = {};
    this.anchors = anchors;
    this.builtin = builtin;
    this.cell = sheets.idle.height / 8;
    // measured once: how tall the character stands in the idle front cell
    this.scale = HEIGHT / (this.cell * 0.92);
  }

  // Red silhouette of a sheet, made on first use.
  flashSheet(clip: string): Img {
    if (!this.flashes[clip]) this.flashes[clip] = silhouette(this.sheets[clip], "#ff3a2a");
    return this.flashes[clip];
  }

  get casting(): boolean {
    return !!this.cast && this.cast.t < this.cast.duration;
  }

  get busy(): boolean {
    return this.casting || !!this.attack || !!this.dash;
  }

  get dashing(): boolean {
    return !!this.dash;
  }

  // A skill's animation: play `motion` toward `dir` without a weapon hit of its own.
  // The clip to play `motion` with w in hand: one with a weapon drawn in (builtin: the swing's
  // sword, the shoot's bow) only for the weapon it draws, since anything else in hand would show
  // beside it (a third weapon with an off hand); otherwise the empty-handed thrust.
  clipFor(motion: string, w: AttackWeapon): string {
    return !this.sheets[motion] || (this.builtin[motion] && !(w.builtin && w.motion === motion)) ? "thrust" : motion;
  }

  startMotion(motion: string, dir: Vec2 | null, w: AttackWeapon, dur = 0.45): void {
    motion = this.clipFor(motion, w);
    const sheet = this.sheets[motion];
    if (dir) this.dir = directionIndex(dir.x, dir.y);
    this.attack = { t: 0, motion, dur, frames: sheet.width / this.cell, hit: true,
      w: { ...w, motion, skill: true }, aim: dir ?? this.facing() };
  }

  // Rush `distance` cm along unit `dir` in `time` s; onStep() runs every frame of the rush.
  startDash(dir: Vec2, distance: number, time: number, onStep?: () => void): void {
    this.startMotion("thrust", dir, this.attack?.w ?? { motion: "thrust" }, time + 0.2);
    this.dash = { vx: (dir.x * distance) / time, vy: (dir.y * distance) / time, t: time, onStep };
  }

  facing(): Vec2 {
    return directionVector(this.dir);
  }

  // Exact direction of the current attack (toward the click or the target); the sprite only
  // turns to the nearest of its 8 directions.
  aimDir(): Vec2 {
    return this.attack?.aim ?? this.facing();
  }

  // A cast bar of `duration` s, floating until hoverEnd; facing `dir` (a spell aimed somewhere),
  // else the camera like the Oriverse cast.
  startCast(duration: number, hoverEnd: number, dir?: Vec2): void {
    this.cast = { t: 0, duration, hoverEnd, x: this.x, y: this.y };
    this.attack = null;
    this.target = null;
    this.dir = dir ? directionIndex(dir.x, dir.y) : (8 - yawEighths()) % 8;
  }

  // Normal attack with weapon stats w, optionally turning toward a world point first.
  // Returns false while busy or recovering.
  startAttack(w: WeaponType, toward: Vec2 | null): boolean {
    if (this.busy || this.cooldown > 0) return false;
    let aim = this.facing();
    if (toward) {
      const dx = toward.x - this.x, dy = toward.y - this.y, d = Math.hypot(dx, dy);
      if (d > 1) {
        this.dir = directionIndex(dx, dy);
        aim = { x: dx / d, y: dy / d };
      }
    }
    const motion = this.clipFor(w.motion, w);
    const frames = this.sheets[motion].width / this.cell;
    // the clip plays faster for quick weapons
    const dur = Math.min(w.interval * 0.92, ATTACK_TIME);
    this.attack = { t: 0, motion, dur, frames, hit: false, w, aim };
    this.cooldown = w.interval;
    return true;
  }

  // move = { x, y }: wanted direction in world axes (W = +X, A = +Y), not normalised.
  // w = equipped weapon stats. Returns "hit" on the frame the weapon lands, else null.
  update(dt: number, move: Vec2, w: WeaponType): "hit" | null {
    this.time += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    let mx = move.x, my = move.y;
    if (mx || my) this.target = null;
    if (this.target && !this.target.alive) this.target = null;

    // walk to the target until it is in reach, then keep attacking it
    if (this.target && !this.busy && !this.dead) {
      const dx = this.target.x - this.x, dy = this.target.y - this.y;
      const d = Math.hypot(dx, dy) - this.target.radius;
      if (d > attackRange(w)) {
        mx = dx;
        my = dy;
      } else {
        this.dir = directionIndex(dx, dy);
        this.startAttack(w, this.target);
      }
    }

    if (this.busy || this.dead) mx = my = 0; // rooted while casting or swinging
    if (this.dash) {
      const d = this.dash;
      const p = { x: this.x + d.vx * dt, y: this.y + d.vy * dt };
      resolve(p, RADIUS);
      this.x = p.x;
      this.y = p.y;
      d.onStep?.();
      if ((d.t -= dt) <= 0) this.dash = null;
    }
    const len = Math.hypot(mx, my);
    this.moving = len > 0;
    if (this.moving) {
      mx /= len;
      my /= len;
      const v = SPEED * this.speedMul;
      const p = { x: this.x + mx * v * dt, y: this.y + my * v * dt };
      resolve(p, RADIUS);
      this.walked += Math.hypot(p.x - this.x, p.y - this.y);
      this.x = p.x;
      this.y = p.y;
      this.dir = directionIndex(mx, my);
    } else {
      this.walked = 0;
    }

    let hit: "hit" | null = null;
    if (this.attack) {
      const a = this.attack;
      a.t += dt;
      const frame = Math.floor((a.t / a.dur) * a.frames);
      if (!a.hit && frame >= HIT_AT[a.motion] * a.frames) {
        a.hit = true;
        hit = "hit";
      }
      if (a.t >= a.dur) this.attack = null;
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

  // Which clip and column to show this frame.
  pose(): { clip: string; col: number } {
    const { walk } = this.sheets;
    const cols = (s: Img) => s.width / this.cell;
    if (this.cast && this.cast.t < this.cast.duration + 0.5) {
      // raise the hands while the cast bar fills, then let them fall on release
      // (without a cast clip, the swing unless a sword is drawn into it: hers is drawn in hand)
      const clip = this.sheets.cast ? "cast" : this.builtin.swing ? "thrust" : "swing";
      const n = cols(this.sheets[clip]);
      const c = this.cast;
      const windup = Math.floor(WINDUP_AT * n);
      const col = c.t < c.duration
        ? Math.min(windup, Math.floor((c.t / 0.35) * windup))
        : Math.min(n - 1, windup + 1 + Math.floor((c.t - c.duration) * 10 * (n / 8)));
      return { clip, col };
    }
    if (this.attack) {
      const a = this.attack;
      return { clip: a.motion, col: Math.min(a.frames - 1, Math.floor((a.t / a.dur) * a.frames)) };
    }
    if (this.moving) {
      const n = cols(walk);
      return { clip: "walk", col: Math.floor((this.walked / WALK_CYCLE) * n) % n };
    }
    return { clip: "idle", col: 0 };
  }

  // Ground point on the map, for depth sorting.
  get depth(): number {
    return mapY(this.x, this.y);
  }

  // weapon / offhand: what to draw in each hand during attacks and casts (null: empty)
  draw(ctx: CanvasRenderingContext2D, view: View, weapon: { img: Img; art: WeaponArt } | null, offhand: { img: Img; art: WeaponArt } | null = null): void {
    if (this.shape) return this.drawShape(ctx, view, this.shape);
    const { k, ox, oy } = view;
    const gx = mapX(this.x, this.y) * k + ox;
    const gy = mapY(this.x, this.y) * k + oy;

    // shadow shrinks and fades as she rises
    const lift = Math.max(0, this.z);
    const sr = 30 * (1 - lift / 140) * k;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(16, 30, 10, ${0.34 * (1 - lift / 90)})`;
    ctx.beginPath();
    ctx.ellipse(gx, gy, sr, sr * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    const { clip, col } = this.pose();
    const sheet = this.sheets[clip];
    const cell = this.cell;
    const s = this.scale * k;
    const breathe = this.moving || this.busy ? 1 : 1 + 0.012 * Math.sin(this.time * 2.2);
    const fy = mapY(this.x, this.y, lift) * k + oy;

    // the weapon shows while attacking or casting (unless the clip already draws it); behind
    // her when she faces away
    const a = this.attack;
    const showWeapon = (weapon || offhand) && (this.casting || a);
    const mainShown = weapon && !(a && a.w.builtin && this.builtin[a.motion]);
    const hand = showWeapon ? this.handFor(clip, col) : null;
    const row = viewRow(this.dir);
    const behind = row >= 3 && row <= 5;
    const toScreen = ([hx, hy]: [number, number]) => [gx + (hx - cell / 2) * s, fy + (hy - cell) * s];
    const facing = screenAngle(this.aimDir()), held = heldAngle(facing, weapon?.art), offHeld = heldAngle(facing, offhand?.art);
    // an off hand hidden behind her (or never seen in this direction) holds its gear behind her
    const offHidden = !hand?.l || !!hand.lh;
    const offBehind = behind || offHidden;
    const drawOff = () => {
      if (!hand || !offhand) return;
      const l: [number, number] = hand.l ?? [hand.c[0], hand.c[1] + 4];
      const [lx, ly] = toScreen(l);
      drawWeapon(ctx, offhand.img, offhand.art, lx, ly, offHeld, s * (offhand.art.scale ?? 1));
    };
    const drawMain = () => {
      if (!hand || !weapon || !mainShown) return;
      let [x, y] = toScreen(hand.r);
      // a two-handed sword or spear is held in both hands: its grip between them (a gun aimed
      // away from the camera stays in the hand that points it, or her back would hide it)
      if (weapon.art.twoHand && hand.l && !offHidden && !(weapon.art.aimed && behind)) [x, y] = toScreen([(hand.r[0] + hand.l[0]) / 2, (hand.r[1] + hand.l[1]) / 2]);
      const wscale = s * (weapon.art.scale ?? 1);
      drawWeapon(ctx, weapon.img, weapon.art, x, y, held, wscale);
      if (weapon.art.pair && hand.l) {
        const [lx, ly] = toScreen(hand.l);
        drawWeapon(ctx, weapon.img, weapon.art, lx, ly, held, wscale);
      }
      if (this.cast && this.casting && this.gemGlow) {
        const tip = weaponTip(weapon.img, weapon.art, x, y, held, wscale);
        const r = (18 + 8 * Math.sin(this.cast.t * 9)) * k;
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(this.gemGlow, tip.x - r, tip.y - r, r * 2, r * 2);
        ctx.globalCompositeOperation = "source-over";
      }
    };

    if (this.dead) ctx.globalAlpha = 0.45;
    if (offBehind) drawOff();
    if (behind) drawMain();
    // pivot (bottom centre of the cell) on the feet; breathing stretches up from the ground
    ctx.setTransform(s, 0, 0, s * breathe, gx, fy);
    ctx.drawImage(sheet, col * cell, row * cell, cell, cell, -cell / 2, -cell, cell, cell);
    if (this.hurtFlash > 0 && this.flashSheet) {
      // red tint over the sprite when hit
      ctx.globalAlpha = Math.min(1, this.hurtFlash * 3) * 0.6;
      ctx.drawImage(this.flashSheet(clip), col * cell, row * cell, cell, cell, -cell / 2, -cell, cell, cell);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    if (!offBehind) drawOff();
    if (!behind) drawMain();

    this.drawOrbs(ctx, gx, fy - (HEIGHT * HEAD + 22) * k, k);
    if (this.casting) this.drawCastBar(ctx, gx, fy - HEIGHT * HEAD * k - 6 * k, k);
  }

  // The orbs she holds circling round a point over her head: each its colour's glow, twice for
  // depth of colour, with a bright core.
  drawOrbs(ctx: CanvasRenderingContext2D, cx: number, cy: number, k: number): void {
    this.orbs.forEach((img, i) => {
      const a = this.time * 2.4 + (i * Math.PI * 2) / this.orbs.length;
      const x = cx + Math.cos(a) * 32 * k, y = cy + Math.sin(a) * 10 * k, r = (15 + 2 * Math.sin(this.time * 6 + i * 2)) * k;
      ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
      ctx.drawImage(img, x - r * 0.7, y - r * 0.7, r * 1.4, r * 1.4);
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(img, x - r * 0.4, y - r * 0.4, r * 0.8, r * 0.8);
      ctx.globalCompositeOperation = "source-over";
    });
  }

  // In a form: the monster's sheet as tall as the monster stands, within SHAPE_SIZE (floating if
  // it flies), turned the way she faces, walking as she walks, its attack while she strikes; red
  // when hit.
  drawShape(ctx: CanvasRenderingContext2D, view: View, sh: Sheet): void {
    const { k, ox, oy } = view;
    const gx = mapX(this.x, this.y) * k + ox, gy = mapY(this.x, this.y) * k + oy;
    const lift = (sh.fly ? 40 + Math.sin(this.time * 2.6) * 7 : 0) + Math.max(0, this.z) * Math.SQRT1_2; // (map px; z is cm up)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(16, 30, 10, ${sh.fly ? 0.22 : 0.34})`;
    const sr = Math.max(30, Math.min(SHAPE_SIZE[1], sh.size) * 0.22) * k;
    ctx.beginPath();
    ctx.ellipse(gx, gy, sr, sr * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    const a = this.attack;
    const clip = a ? sh.attack : this.moving ? sh.move : sh.idle;
    const col = a ? Math.min(clip.frames - 1, Math.floor((a.t / a.dur) * clip.frames)) : this.moving ? Math.floor(this.walked / 30) % clip.frames : 0;
    const row = (Math.round(this.dir / 2) + Math.round(yaw / (Math.PI / 2))) % 4;
    const size = Math.min(SHAPE_SIZE[1], Math.max(SHAPE_SIZE[0], sh.size));
    const c = sh.cell, s = (size * 0.8 * k) / sh.top, breathe = this.moving || this.busy ? 1 : 1 + 0.015 * Math.sin(this.time * 2.4);
    const sx = (clip.at + col) * c, sy = row * c, dw = c * s, dh = c * s * breathe;
    const dx = gx - dw / 2, dy = gy - (c - sh.foot) * s * breathe - lift * k;
    if (this.dead) ctx.globalAlpha = 0.45;
    ctx.drawImage(clip.img, sx, sy, c, c, dx, dy, dw, dh);
    if (this.hurtFlash > 0) {
      let red = this.redShapes.get(clip.img);
      if (!red) this.redShapes.set(clip.img, (red = silhouette(clip.img, "#ff3a2a")));
      ctx.globalAlpha = Math.min(1, this.hurtFlash * 3) * 0.6;
      ctx.drawImage(red, sx, sy, c, c, dx, dy, dw, dh);
    }
    ctx.globalAlpha = 1;
    this.drawOrbs(ctx, gx, gy - (size * 0.8 + lift + 22) * k, k);
    if (this.casting) this.drawCastBar(ctx, gx, gy - (size * 0.8 + lift) * k - 6 * k, k);
  }

  // Hand positions (sprite px) for a frame; falls back to a point beside the body.
  // lh: the off hand is hidden behind the body in this frame (its place borrowed from a frame
  // where it shows).
  handFor(clip: string, col: number): { r: [number, number]; l: [number, number] | null; lh?: number; c: [number, number] } {
    const row = viewRow(this.dir);
    const a = this.anchors?.[clip]?.[row]?.[col];
    const c: [number, number] = a?.c ?? [this.cell / 2, this.cell * 0.62];
    const r: [number, number] = a?.r ?? [c[0] + (row >= 5 ? 10 : -10), c[1] + 6];
    return { r, l: a?.l ?? null, lh: a?.lh, c };
  }

  // Projectile origin for a bow release: convert the animated hand's sprite position back to
  // world coordinates so the arrow appears to leave the hand instead of the ground pivot.
  projectileOrigin(): Vec2 {
    const { clip, col } = this.pose();
    if (clip !== "shoot") return { x: this.x, y: this.y };
    const hand = this.handFor(clip, col).r;
    const dx = (hand[0] - this.cell / 2) * this.scale;
    const dy = (hand[1] - this.cell) * this.scale;
    return groundFromMap(mapX(this.x, this.y) + dx, mapY(this.x, this.y) + dy);
  }

  // Ragnarok-style cast bar over the head.
  drawCastBar(ctx: CanvasRenderingContext2D, cx: number, y: number, k: number): void {
    const w = 70 * k, h = 9 * k, pad = 1.5 * k;
    const f = this.cast ? Math.min(1, this.cast.t / this.cast.duration) : 0;
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

export { WEAPON_ART };

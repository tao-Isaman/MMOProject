// Auto-hunt bot: picks slimes inside a hunting area, walks to them around the solids, uses the
// skills its rules allow in their priority order, attacks normally in between, and sits down to
// recover when HP or MP runs low. Any key or click hands control back for a moment.
//
// Settings live in localStorage (the character's "bot.v1"); the window that edits them is src/botui.ts.

import { ACTIVES } from "./progression";
import { saveKey } from "./save";
import type { Progress, SkillDef } from "./progression";
import { findPath, clearLine } from "./world";
import { attackRange } from "./combat";
import { RADIUS } from "./player";
import { VARIANTS } from "./monsters";
import type { Player } from "./player";
import type { Hero } from "./hero";
import type { Skills } from "./skills";
import type { Monster } from "./monsters";
import type { Inventory } from "./inventory";
import type { WeaponType, WeaponId } from "./items";
import type { Vec2 } from "./types";

const MANUAL_PAUSE = 2.5;  // s the bot waits after the player takes over
const THREAT_RANGE = 700;  // cm: angry slimes this close are fought first
const THINK = 0.12;        // s between decisions
const STUCK_TIME = 1.2;    // s without progress before giving up on a target
const SKIP_TIME = 8;       // s an unreachable target is ignored

// When a skill rule fires:
//   ready  offensive: the target is in the skill's reach; support: in a fight and the effect is missing
//   hp     HP below value %
//   mobs   at least value slimes inside the skill's area
export type Cond = "ready" | "hp" | "mobs";
export interface SkillRule {
  id: string;
  on: boolean;
  cond: Cond;
  value: number;
}

export interface BotSettings {
  rules: SkillRule[];                 // priority order
  basic: boolean;                     // normal attacks while skills recharge
  targets: Record<string, boolean>;   // slime variant id -> hunt it
  prefer: "near" | "weak" | "strong";
  defend: boolean;                    // slimes attacking us come first, whatever the filter
  radius: number;                     // cm around the anchor
  wholeMap: boolean;                  // hunt anywhere in the courtyard, ignoring the radius
  restHp: number;                     // % HP that sends the bot to rest (0: never)
  restMp: number;                     // % MP that sends the bot to rest (0: never)
  resume: number;                     // % HP and MP to rest up to
  saveMp: number;                     // % MP only support skills may dip into
  potHp: number;                      // % HP below which to drink a red potion (0: never)
  potMp: number;                      // % MP below which to drink a blue potion (0: never)
  revive: boolean;                    // keep hunting after a respawn
  stopFull: boolean;                  // stop when the bag is full
}

export type BotState = "off" | "seek" | "approach" | "fight" | "rest" | "return" | "paused" | "dead";

export const STATE_TEXT: Record<BotState, string> = {
  off: "ปิดอยู่", seek: "รอมอนสเตอร์", approach: "เดินไปหาเป้าหมาย", fight: "กำลังต่อสู้",
  rest: "นั่งพักฟื้น", return: "กลับเขตล่า", paused: "ผู้เล่นควบคุมอยู่", dead: "รอฟื้น",
};

const SUPPORT = new Set(["heal", "shield", "buff"]);
export const isSupport = (s: SkillDef) => SUPPORT.has(s.type);

// A new rule for a skill, with a sensible default condition for its type.
export function defaultRule(id: string): SkillRule {
  const s = ACTIVES[id].skill;
  if (s.type === "heal") return { id, on: true, cond: "hp", value: 55 };
  if (s.type === "shield") return { id, on: true, cond: "hp", value: 75 };
  if (s.type === "nova" || s.type === "storm") return { id, on: true, cond: "mobs", value: 2 };
  return { id, on: true, cond: "ready", value: s.type === "flower" ? 2 : 50 };
}

export function defaultSettings(): BotSettings {
  return {
    rules: [], basic: true, targets: Object.fromEntries(VARIANTS.map((v) => [v.id, true])), prefer: "near", defend: true,
    radius: 900, wholeMap: false, restHp: 35, restMp: 15, resume: 90, saveMp: 20, potHp: 45, potMp: 25, revive: true, stopFull: true,
  };
}

// How far from the caster a skill reaches the point it is aimed at (cm), and the radius of
// the area that "mobs" counts around its centre.
export function skillReach(s: SkillDef): { reach: number; area: number; self: boolean } {
  switch (s.type) {
    case "bolt": case "fan": return { reach: (s.range ?? 500) * 0.9, area: 160, self: false };
    case "blast": return { reach: s.range ?? 500, area: s.radius ?? 150, self: false };
    case "beam": return { reach: (s.length ?? 500) * 0.9, area: 160, self: false };
    case "dash": return { reach: (s.distance ?? 200) + 30, area: 120, self: false };
    case "cone": return { reach: (s.reach ?? 150) * 0.9, area: (s.reach ?? 150) * 0.9, self: true };
    case "nova": case "storm": return { reach: (s.radius ?? 200) * 0.85, area: (s.radius ?? 200) * 0.85, self: true };
    case "flower": return { reach: (s.radius ?? 450) * 0.75, area: (s.radius ?? 450) * 0.75, self: true };
    default: return { reach: Infinity, area: 300, self: true };
  }
}

interface BotDeps {
  player: Player;
  hero: Hero;
  progress: Progress;
  skills: Skills;
  monsters: Monster[];
  inv: Inventory;
  weapon: () => WeaponType;      // equipped weapon with the hero's stats applied
  weaponId: () => string | null;
  onSkill?: (id: string) => void;
  say?: (text: string) => void;  // a short line over the player
  drink?: (kind: "hp" | "mp") => boolean;   // drink the fitting potion; false if none or too soon
  potions?: (kind: "hp" | "mp") => number;  // how many potions of that kind are in the bag
}

export class Bot {
  d: BotDeps;
  settings: BotSettings;
  on = false;
  state: BotState = "off";
  anchor: Vec2 = { x: 0, y: 0 };
  target: Monster | null = null;
  path: Vec2[] = [];
  pathTo: Vec2 | null = null;
  repath = 0;
  manual = 0;
  think = 0;
  restTick = 0;
  stuck = { t: 0, x: 0, y: 0 };
  skip = new Map<Monster, number>();
  stats = { time: 0, kills: 0, xp: 0, items: 0, gold: 0, potions: 0 };
  listeners = new Set<() => void>();

  constructor(deps: BotDeps) {
    this.d = deps;
    this.settings = this.load();
    this.syncRules();
    deps.progress.onChange(() => this.syncRules());
  }

  // ---- settings ----
  load(): BotSettings {
    const base = defaultSettings();
    try {
      const saved = JSON.parse(localStorage.getItem(saveKey("bot.v1")) || "null") as Partial<BotSettings> | null;
      if (!saved) return base;
      const rules = (saved.rules ?? []).filter((r) => ACTIVES[r.id] && ["ready", "hp", "mobs"].includes(r.cond));
      return { ...base, ...saved, rules, targets: { ...base.targets, ...saved.targets } };
    } catch {
      return base;
    }
  }

  save(): void {
    try {
      localStorage.setItem(saveKey("bot.v1"), JSON.stringify(this.settings));
    } catch {
      // not persisted
    }
    this.notify();
  }

  // Every learned active gets a rule (newly learned ones go last); rules are kept for skills
  // that were unlearned, so a refund doesn't lose the setup.
  syncRules(): void {
    const known = new Set(this.settings.rules.map((r) => r.id));
    let added = false;
    for (const id of Object.keys(ACTIVES)) {
      if (!known.has(id) && this.d.progress.skillRank(id) > 0) {
        this.settings.rules.push(defaultRule(id));
        added = true;
      }
    }
    if (added) this.save();
    else this.notify();
  }

  onChange(fn: () => void): void {
    this.listeners.add(fn);
  }

  notify(): void {
    for (const fn of this.listeners) fn();
  }

  // ---- control ----
  start(): void {
    if (this.on) return;
    this.on = true;
    this.anchor = { x: this.d.player.x, y: this.d.player.y };
    this.stats = { time: 0, kills: 0, xp: 0, items: 0, gold: 0, potions: 0 };
    this.reset("seek");
    this.d.say?.("เริ่มบอท");
    this.notify();
  }

  stop(why = "หยุดบอท"): void {
    if (!this.on) return;
    this.on = false;
    if (this.target && this.d.player.target === this.target) this.d.player.target = null;
    this.reset("off");
    this.d.say?.(why);
    this.notify();
  }

  toggle(): void {
    if (this.on) this.stop();
    else this.start();
  }

  setAnchorHere(): void {
    this.anchor = { x: this.d.player.x, y: this.d.player.y };
    this.notify();
  }

  // The player pressed a key or clicked: let them drive for a moment.
  noteManual(): void {
    if (!this.on) return;
    this.manual = MANUAL_PAUSE;
    this.target = null;
    this.path = [];
  }

  noteKill(xp: number, items: number, gold = 0): void {
    if (!this.on) return;
    this.stats.kills++;
    this.stats.xp += xp;
    this.stats.items += items;
    this.stats.gold += gold;
  }

  reset(state: BotState): void {
    this.state = state;
    this.target = null;
    this.path = [];
    this.pathTo = null;
  }

  // ---- each frame: returns where to walk (world axes, not normalised) ----
  update(dt: number): Vec2 {
    const none = { x: 0, y: 0 };
    if (!this.on) return none;
    const { player, hero, inv } = this.d;
    const s = this.settings;
    this.stats.time += dt;
    for (const [m, t] of this.skip) if ((t - dt) <= 0) this.skip.delete(m); else this.skip.set(m, t - dt);

    if (!hero.alive) {
      if (!s.revive) {
        this.stop("บอทหยุดเพราะตัวละครล้ม");
        return none;
      }
      this.reset("dead");
      return none;
    }
    if (this.manual > 0) {
      this.manual -= dt;
      this.state = "paused";
      return none;
    }
    if (s.stopFull && inv.full) {
      this.stop("บอทหยุด: กระเป๋าเต็ม");
      return none;
    }

    let hpPct = (hero.hp / hero.stats.maxHp) * 100, mpPct = (hero.mp / hero.stats.maxMp) * 100;
    const threats = this.threats();

    // ---- potions ----
    if (s.potHp > 0 && hpPct < s.potHp && this.d.drink?.("hp")) {
      this.stats.potions++;
      hpPct = (hero.hp / hero.stats.maxHp) * 100;
    }
    if (s.potMp > 0 && mpPct < s.potMp && this.d.drink?.("mp")) {
      this.stats.potions++;
      mpPct = (hero.mp / hero.stats.maxMp) * 100;
    }

    // ---- resting ----
    if (this.state === "rest") {
      if (threats.length) this.state = "seek";
      else if (hpPct >= Math.min(100, s.resume) - 0.5 && mpPct >= Math.min(100, s.resume) - 0.5) {
        this.state = "seek";
        this.d.say?.("พักเสร็จแล้ว");
      } else {
        this.restTick -= dt;
        if (this.restTick <= 0) {
          this.restTick = 0.5;
          hero.addBuff("bot_rest", "พักฟื้น", { hpRegen: hero.stats.maxHp * 0.025, mpRegen: hero.stats.maxMp * 0.025 }, 0.7);
        }
        this.useSupport(false);
        return none;
      }
    } else if (!threats.length && ((s.restHp > 0 && hpPct < s.restHp) || (s.restMp > 0 && mpPct < s.restMp))) {
      this.reset("rest");
      player.target = null;
      this.restTick = 0;
      this.d.say?.("นั่งพักฟื้น");
      return none;
    }

    // ---- decisions a few times a second ----
    this.think -= dt;
    if (this.think <= 0) {
      this.think = THINK;
      this.pickTarget(threats);
      if (this.useSupport(true)) return none;
      if (this.target && this.useOffensive(this.target)) return none;
    }

    const t = this.target;
    if (!t) {
      player.target = null;
      const home = Math.hypot(player.x - this.anchor.x, player.y - this.anchor.y);
      if (!s.wholeMap && home > 120) {
        this.state = "return";
        return this.walkTo(this.anchor, dt);
      }
      this.state = "seek";
      this.path = [];
      return none;
    }

    // walk up to the target, then let the player's own chase-and-attack take over
    const want = this.engageRange();
    const dist = Math.hypot(t.x - player.x, t.y - player.y) - t.radius;
    if (dist <= want + 25 && clearLine(player, t, RADIUS * 0.6)) {
      this.state = "fight";
      this.path = [];
      this.stuck.t = 0;
      if (s.basic) player.target = t;
      else if (player.target === t) player.target = null;
      return none;
    }
    this.state = "approach";
    if (player.target === t) player.target = null;
    return this.walkTo(t, dt);
  }

  inFight(): boolean {
    return !!this.target && (this.state === "fight" || this.state === "approach");
  }

  // Slimes chasing us, nearest first.
  threats(): Monster[] {
    const p = this.d.player;
    return this.d.monsters
      .filter((m) => m.alive && m.angry > 0 && Math.hypot(m.x - p.x, m.y - p.y) < THREAT_RANGE)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
  }

  pickTarget(threats: Monster[]): void {
    const s = this.settings, p = this.d.player;
    const inArea = (m: Monster) => s.wholeMap || Math.hypot(m.x - this.anchor.x, m.y - this.anchor.y) <= s.radius;
    const t = this.target;
    // a threat takes over from a target that isn't one
    if (s.defend && threats.length && !(t && threats.includes(t))) {
      const pick = threats.find((m) => !this.skip.has(m));
      if (pick) return this.setTarget(pick);
    }
    if (t && t.alive && !this.skip.has(t) && (inArea(t) || t.angry > 0)) return;
    const list = this.d.monsters.filter((m) => m.alive && !this.skip.has(m) && s.targets[m.variant.id] !== false && inArea(m));
    if (!list.length) return this.setTarget(null);
    const dist = (m: Monster) => Math.hypot(m.x - p.x, m.y - p.y);
    const score = s.prefer === "weak" ? (m: Monster) => m.hp * 10 + dist(m) / 100
      : s.prefer === "strong" ? (m: Monster) => -m.level * 1e4 + dist(m) : dist;
    list.sort((a, b) => score(a) - score(b));
    this.setTarget(list[0]);
  }

  setTarget(m: Monster | null): void {
    if (m === this.target) return;
    if (this.d.player.target === this.target) this.d.player.target = null;
    this.target = m;
    this.path = [];
    this.pathTo = null;
    this.stuck = { t: 0, x: this.d.player.x, y: this.d.player.y };
  }

  // How close to stand: the weapon's reach with normal attacks on, else the shortest reach
  // of the offensive skills in use.
  engageRange(): number {
    const w = this.d.weapon();
    if (this.settings.basic) return attackRange(w);
    let best = Infinity;
    for (const r of this.settings.rules) {
      if (!r.on || !this.d.progress.skillRank(r.id)) continue;
      const sk = ACTIVES[r.id].skill;
      if (!isSupport(sk)) best = Math.min(best, skillReach(sk).reach);
    }
    return Number.isFinite(best) ? best * 0.9 : attackRange(w);
  }

  walkTo(goal: Vec2, dt: number): Vec2 {
    const p = this.d.player;
    this.repath -= dt;
    const moved = !this.pathTo || Math.hypot(goal.x - this.pathTo.x, goal.y - this.pathTo.y) > 80;
    if (!this.path.length || moved || this.repath <= 0) {
      this.path = findPath(p, goal, RADIUS) ?? [];
      this.pathTo = { x: goal.x, y: goal.y };
      this.repath = 0.6;
      if (!this.path.length) return this.giveUp();
    }
    while (this.path.length > 1 && Math.hypot(this.path[0].x - p.x, this.path[0].y - p.y) < 25) this.path.shift();
    const next = this.path[0];
    // stuck: barely moved for a while
    this.stuck.t += dt;
    if (Math.hypot(p.x - this.stuck.x, p.y - this.stuck.y) > 30) this.stuck = { t: 0, x: p.x, y: p.y };
    else if (this.stuck.t > STUCK_TIME) return this.giveUp();
    return { x: next.x - p.x, y: next.y - p.y };
  }

  giveUp(): Vec2 {
    if (this.target) this.skip.set(this.target, SKIP_TIME);
    this.setTarget(null);
    return { x: 0, y: 0 };
  }

  // ---- skills ----
  ready(id: string, support: boolean): boolean {
    const { hero, progress } = this.d;
    if (!progress.skillRank(id) || hero.cooldowns.has(id)) return false;
    const a = ACTIVES[id], s = a.skill;
    if (a.source.weapons && !a.source.weapons.includes(this.d.weaponId() as WeaponId)) return false;
    // offensive skills leave saveMp % of MP for the support ones
    const floor = support ? 0 : (hero.stats.maxMp * this.settings.saveMp) / 100;
    return hero.mp - s.mp >= floor;
  }

  // The player can start a skill now (not mid-cast, and a swing has already landed).
  free(): boolean {
    const p = this.d.player;
    return !p.casting && !p.dashing && (!p.attack || p.attack.hit);
  }

  count(c: Vec2, r: number): number {
    return this.d.monsters.filter((m) => m.alive && Math.hypot(m.x - c.x, m.y - c.y) <= r + m.radius).length;
  }

  // Heal, shield and buff rules. fighting: whether "ready" rules may fire (they wait for a fight).
  useSupport(fighting: boolean): boolean {
    if (!this.free()) return false;
    const { hero, player } = this.d;
    const hpPct = (hero.hp / hero.stats.maxHp) * 100;
    const busy = fighting && (this.inFight() || this.threats().length > 0);
    for (const r of this.settings.rules) {
      const a = ACTIVES[r.id];
      if (!r.on || !a || !isSupport(a.skill) || !this.ready(r.id, true)) continue;
      const s = a.skill;
      let go = false;
      if (r.cond === "hp") go = hpPct < r.value;
      else if (r.cond === "mobs") go = this.count(player, 300) >= r.value;
      else if (busy) {
        if (s.type === "heal") go = hpPct < 90;
        else if (s.type === "shield") go = !hero.shield;
        else go = !hero.buffs.some((b) => b.id === r.id);
      }
      if (go && this.cast(r.id, null)) return true;
    }
    return false;
  }

  useOffensive(t: Monster): boolean {
    if (!this.free()) return false;
    const { hero, player } = this.d;
    const hpPct = (hero.hp / hero.stats.maxHp) * 100;
    const dist = Math.hypot(t.x - player.x, t.y - player.y) - t.radius;
    if (!clearLine(player, t, RADIUS * 0.6) && dist > 120) return false;
    for (const r of this.settings.rules) {
      const a = ACTIVES[r.id];
      if (!r.on || !a || isSupport(a.skill) || !this.ready(r.id, false)) continue;
      const { reach, area, self } = skillReach(a.skill);
      if (dist > reach) continue;
      let go = r.cond === "ready";
      if (r.cond === "hp") go = hpPct < r.value;
      else if (r.cond === "mobs") go = this.count(self ? player : t, area) >= r.value;
      if (go && this.cast(r.id, t)) return true;
    }
    return false;
  }

  cast(id: string, aim: Vec2 | null): boolean {
    const why = this.d.skills.use(id, aim ? { x: aim.x, y: aim.y } : null);
    if (why) return false;
    this.d.onSkill?.(id);
    return true;
  }
}

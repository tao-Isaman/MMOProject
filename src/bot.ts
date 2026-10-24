// Auto-hunt bot: picks slimes inside a hunting area, walks to them around the solids, uses the
// skills its rules allow in their priority order, attacks normally in between, walks over what
// they drop to pick it up (if told to), and sits down to recover when HP or MP runs low. Any
// key or click hands control back for a moment. It keeps an invoker's three orbs up and turns
// them toward a spell that can go (invoke below), and takes a druid's form when a fight is on.
//
// Settings live in localStorage (the character's "bot.v1"); the window that edits them is src/botui.ts.

import { ACTIVES, mpCost } from "./progression";
import { saveKey } from "./save";
import { MAX_ORBS } from "./hero";
import type { ElementId, Progress, SkillDef } from "./progression";
import { findPath, clearLine } from "./world";
import { attackRange } from "./combat";
import { RADIUS } from "./player";
import { VARIANTS } from "./monsters";
import type { Player } from "./player";
import type { Hero } from "./hero";
import type { Skills } from "./skills";
import type { Monster } from "./monsters";
import type { Inventory } from "./inventory";
import type { WeaponType } from "./items";
import type { Vec2 } from "./types";

const MANUAL_PAUSE = 2.5;  // s the bot waits after the player takes over
const THREAT_RANGE = 700;  // cm: angry slimes this close are fought first
const THINK = 0.12;        // s between decisions
const STUCK_TIME = 1.2;    // s without progress before giving up on a target
const SKIP_TIME = 8;       // s an unreachable target is ignored
const LOOT_RANGE = 900;    // cm: how far it goes for loot when hunting the whole map

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
  stopFull: boolean;                  // stop when the bag is full
  loot: boolean;                      // walk over what monsters drop (between fights) to pick it up
}

export type BotState = "off" | "seek" | "approach" | "fight" | "loot" | "rest" | "return" | "paused";

export const STATE_TEXT: Record<BotState, string> = {
  off: "ปิดอยู่", seek: "รอมอนสเตอร์", approach: "เดินไปหาเป้าหมาย", fight: "กำลังต่อสู้", loot: "เดินไปเก็บของ",
  rest: "นั่งพักฟื้น", return: "กลับเขตล่า", paused: "ผู้เล่นควบคุมอยู่",
};

// (a summon and a smoke cloud are support too: called when a fight is on and they aren't up; an
// orb while fewer than three are held, a form while she is in none)
const SUPPORT = new Set(["heal", "shield", "buff", "decoy", "summon", "smoke", "orb", "form"]);
// A buff lasting at least this long (s) is worth keeping up out of a fight as well.
const LONG_BUFF = 60;
export const isSupport = (s: SkillDef) => SUPPORT.has(s.type);

// A new rule for a skill, with a sensible default condition for its type.
export function defaultRule(id: string): SkillRule {
  const s = ACTIVES[id].skill;
  if (s.type === "heal") return { id, on: true, cond: "hp", value: 55 };
  if (s.type === "shield") return { id, on: true, cond: "hp", value: 75 };
  if (s.type === "nova" || s.type === "storm") return { id, on: true, cond: "mobs", value: 2 };
  if ((s.type === "dash" && !s.mult) || s.type === "workshop" || s.type === "make" || s.type === "smoke" || s.type === "stall") return { id, on: false, cond: "ready", value: 50 };
  return { id, on: true, cond: "ready", value: s.type === "flower" ? 2 : 50 };
}

export function defaultSettings(): BotSettings {
  return {
    rules: [], basic: true, targets: Object.fromEntries(VARIANTS.map((v) => [v.id, true])), prefer: "near", defend: true,
    radius: 900, wholeMap: false, restHp: 35, restMp: 15, resume: 90, saveMp: 20, potHp: 45, potMp: 25, stopFull: true, loot: true,
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
    case "mimic": return { reach: (s.range ?? 600) * 0.9, area: 160, self: false };
    // an invoke as far as the nearest-reaching of its spells
    case "invoke": return { reach: Math.min(...Object.values(s.invoke ?? {}).map((x) => skillReach(x.skill).reach)), area: 160, self: false };
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
  loot?: Vec2[];                  // what lies on the ground to pick up (src/loot.ts)
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
  fetching: Vec2 | null = null;      // the thing on the ground being walked to
  skipLoot = new Map<Vec2, number>(); // things it couldn't get to, for a while
  stats = { time: 0, kills: 0, xp: 0, items: 0, gold: 0, potions: 0 };
  capNoted = false; // told this run that experience stops at the level-99 limit
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
    this.capNoted = false;
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

  // A kill it saw. At the level-99 limit the hunt goes on for gold and drops; it says once that
  // the experience has stopped.
  noteKill(xp: number, gold = 0): void {
    if (!this.on) return;
    const capped = this.d.progress.capped;
    this.stats.kills++;
    if (!capped) this.stats.xp += xp;
    this.stats.gold += gold;
    if (capped && !this.capNoted) {
      this.capNoted = true;
      this.d.say?.("เลเวล 99 แล้ว EXP ไม่เพิ่ม: ทำภารกิจทลายขีดจำกัดกับพระราชาที่พระราชวังหลวง");
    }
  }

  notePick(): void {
    if (this.on) this.stats.items++;
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
    for (const [l, t] of this.skipLoot) if ((t - dt) <= 0) this.skipLoot.delete(l); else this.skipLoot.set(l, t - dt);

    // falling stops it: the player decides what to do after getting up
    if (!hero.alive) {
      this.stop("บอทหยุดเพราะตัวละครล้ม");
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

    // ---- between fights: walk over what fell to pick it up ----
    const pick = s.loot && !threats.length ? this.nearestLoot() : null;
    if (pick) {
      player.target = null; // nothing is after it (no threats), so the fight can wait
      this.fetching = pick;
      this.state = "loot";
      return this.walkTo(pick, dt);
    }
    this.fetching = null;

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
    if (this.fetching) {
      this.skipLoot.set(this.fetching, SKIP_TIME);
      this.fetching = null;
      this.path = [];
      this.pathTo = null;
      return { x: 0, y: 0 };
    }
    if (this.target) this.skip.set(this.target, SKIP_TIME);
    this.setTarget(null);
    return { x: 0, y: 0 };
  }

  // The nearest thing lying in the hunting area (or near, hunting the whole map).
  nearestLoot(): Vec2 | null {
    const s = this.settings, p = this.d.player;
    let best: Vec2 | null = null, bestD = Infinity;
    for (const l of this.d.loot ?? []) {
      if (this.skipLoot.has(l)) continue;
      const d = Math.hypot(l.x - p.x, l.y - p.y);
      const inArea = s.wholeMap ? d <= LOOT_RANGE : Math.hypot(l.x - this.anchor.x, l.y - this.anchor.y) <= s.radius + 100;
      if (inArea && d < bestD) [best, bestD] = [l, d];
    }
    return best;
  }

  // ---- skills ----
  // A skill can go now: learned, off cooldown, the right weapon, and its MP over the floor plus
  // `reserve` (what a skill higher on the list is waiting to have).
  ready(id: string, support: boolean, reserve = 0): boolean {
    return this.usable(id) && this.d.hero.mp - this.mp(id) >= this.floor(support) + reserve;
  }

  // What a skill costs now (its rank's MP).
  mp(id: string): number {
    return mpCost(id, this.d.progress.skillRank(id));
  }

  // Learned, off cooldown, and the weapon it needs in hand (MP aside).
  usable(id: string): boolean {
    const { hero, progress } = this.d;
    if (!progress.skillRank(id) || hero.cooldowns.has(id)) return false;
    return this.d.skills.wields(id);
  }

  // offensive skills leave saveMp % of MP for the support ones
  floor(support: boolean): number {
    return support ? 0 : (this.d.hero.stats.maxMp * this.settings.saveMp) / 100;
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
      // (a form she is in would only turn her back)
      if (s.type === "form" && hero.form?.id === r.id) continue;
      let go = false;
      if (r.cond === "hp") go = hpPct < r.value;
      else if (r.cond === "mobs") go = this.count(player, 300) >= r.value;
      else if (busy) {
        if (s.type === "heal") go = hpPct < 90;
        else if (s.type === "shield") go = !hero.shield;
        else if (s.type === "summon") go = (this.d.skills.allies?.same(s).length ?? 0) < (s.count ?? 1)
          // a statue's blessing doesn't stack: a second of the same one is no use while it stands
          && !(s.ally === "statue" && this.d.skills.allies?.list.some((x) => x.alive && x.skill === r.id));
        else if (s.type === "decoy") go = !this.d.skills.allies?.count("decoy");
        else if (s.type === "smoke") go = !this.d.skills.clouds.length;
        else if (s.type === "orb") go = hero.orbs.length < MAX_ORBS;
        else if (s.type === "form") go = !hero.form;
        else go = !hero.buffs.some((b) => b.id === r.id);
      } else if (fighting && s.type === "buff" && (s.duration ?? 8) >= LONG_BUFF) {
        // a blessing that lasts minutes is kept up between fights too, not left to lapse until
        // the next one starts
        go = !hero.buffs.some((b) => b.id === r.id);
      } else if (fighting && s.type === "orb") {
        // the orbs' buffs last as long as they are held: three are kept up between fights too
        go = hero.orbs.length < MAX_ORBS;
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
    // the list goes top first: a skill that would go but for its MP keeps that MP from the ones
    // under it (else cheap spells spent it as it came back and the big one never went)
    let reserve = 0;
    for (const r of this.settings.rules) {
      const a = ACTIVES[r.id];
      if (!r.on || !a || isSupport(a.skill) || a.skill.type === "workshop" || a.skill.type === "make" || !this.usable(r.id)) continue;
      const { reach, area, self } = skillReach(a.skill);
      if (dist > reach) continue;
      let go = r.cond === "ready";
      if (r.cond === "hp") go = hpPct < r.value;
      else if (r.cond === "mobs") go = this.count(self ? player : t, area) >= r.value;
      if (!go) continue;
      if (!this.ready(r.id, false, reserve)) {
        // (one it could never afford holds nothing back)
        if (this.mp(r.id) + this.floor(false) <= hero.stats.maxMp) reserve = Math.max(reserve, this.mp(r.id));
        continue;
      }
      if (a.skill.type === "invoke" ? this.invoke(r.id, t, dist, reserve) : this.cast(r.id, t)) return true;
    }
    return false;
  }

  // An invoke rule: the spell for the orbs held if it can go now (off cooldown, its MP there, the
  // target in its reach; a buff not on her already), else an orb toward the spell in its table
  // that fewest orb casts away can (the first such in the table); an orb on its short cooldown is
  // waited for, not planned round (or the plan would swing from spell to spell). Whether it did
  // either.
  invoke(id: string, t: Monster, dist: number, reserve: number): boolean {
    const { hero, skills, progress } = this.d, rank = progress.skillRank(id);
    // the orb skills she has, one for each element
    const orbs = new Map<ElementId, string>();
    for (const [oid, o] of Object.entries(ACTIVES)) {
      if (o.skill.type === "orb" && o.skill.orb && !orbs.has(o.skill.orb) && progress.skillRank(oid) && skills.wields(oid)) orbs.set(o.skill.orb, oid);
    }
    const held = hero.orbs.map((o) => o.el);
    let best: ElementId[] | null = null;
    for (const [key, spell] of Object.entries(ACTIVES[id].skill.invoke ?? {})) {
      const sp = spell.skill, cast = `${id}:${key}`;
      if (hero.cooldowns.has(cast) || hero.mp - skills.mpOf(cast, rank) < this.floor(false) + reserve) continue;
      if (sp.type === "buff" ? hero.buffs.some((b) => b.id === cast) : dist > skillReach(sp).reach) continue;
      const need = this.orbsFor(held, key.split("+") as ElementId[], orbs);
      if (need && (!best || need.length < best.length)) best = need;
      if (best?.length === 0) break;
    }
    if (!best) return false;
    if (!best.length) return this.cast(id, t);
    const next = orbs.get(best[0])!;
    return this.ready(next, false, reserve) && this.cast(next, null);
  }

  // The orbs to cast (fewest first) so that the three held become `want` (each new one sends the
  // oldest away), or null when one of them has no orb skill.
  orbsFor(held: ElementId[], want: ElementId[], have: Map<ElementId, string>): ElementId[] | null {
    for (let n = 0; n <= MAX_ORBS; n++) {
      const kept = held.slice(Math.max(0, held.length + n - MAX_ORBS));
      if (kept.length + n !== MAX_ORBS) continue;
      const rest = [...want];
      if (!kept.every((e) => rest.includes(e) && rest.splice(rest.indexOf(e), 1))) continue;
      return rest.every((e) => have.has(e)) ? rest : null;
    }
    return null;
  }

  cast(id: string, aim: Vec2 | null): boolean {
    const why = this.d.skills.use(id, aim ? { x: aim.x, y: aim.y } : null);
    if (why) return false;
    this.d.onSkill?.(id);
    return true;
  }
}

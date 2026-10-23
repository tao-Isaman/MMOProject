// Stats and damage. computeStats folds class, level, passives, masteries, elements, the weapon
// in hand and active buffs into one set of numbers; the damage functions use them.

import { CLASSES, TREES, MASTERIES, ELEMENTS, ELEMENT_IDS, RACES, JOBS, JOB_LEVEL, needMet } from "./progression";
import { ITEMS } from "./items";
import type { ElementId, Progress, Race, SkillDef, StatBag } from "./progression";
import type { WeaponType } from "./items";
import { rand } from "./particles";

const ZERO = {
  maxHp: 0, maxMp: 0, atk: 0, matk: 0, def: 0, mdef: 0, hit: 0, flee: 0, crit: 0, critDmg: 0, aspd: 0, move: 0,
  hpRegen: 0, mpRegen: 0, cdr: 0, dmgRed: 0,
  // a share off every cast time (skills.ts), apart from the cooldowns
  castRed: 0,
  // extras: weapon damage bonus, reach, stun chance on hit, exp and drop bonus, defence ignored
  dmg: 0, reach: 0, stunHit: 0, xpPct: 0, drop: 0, pierce: 0, potion: 0,
  // healing power, a second arrow on a bow shot, poison on a normal hit, damage to monsters
  // under any status, longer buffs
  healPct: 0, multiShot: 0, poisonHit: 0, huntDmg: 0, buffTime: 0,
  // a share of the damage a bite does sent back at the biter
  reflect: 0,
  // luck: every chance the player rolls is this many percent likelier (luckFactor); the chance
  // a monster's spell misses outright (smoke)
  luck: 0, magicDodge: 0,
  // a share of the damage done healed back; up to this much more damage as HP runs low (all of
  // it at 0 HP); the falcon's chance to dive in after a normal hit and its strength (of attack);
  // poison damage
  lifesteal: 0, lowHpDmg: 0, falconChance: 0, falconPower: 0, poisonPct: 0,
  // trade (the wandering merchant's book): a share off what NPC shops charge, a share more for
  // what they buy, extra bag slots, more gold from monsters, a share off a guide's fare
  buyDisc: 0, sellBonus: 0, bagSlots: 0, goldPct: 0, fareDisc: 0,
  // multipliers, applied at the end
  atkPct: 0, matkPct: 0, defPct: 0, mdefPct: 0, maxHpPct: 0, maxMpPct: 0, mpRegenPct: 0,
};

// Attack and defence in each element (fireAtk, fireDef, ...), a point each a percent; more damage
// to each kind of monster (undeadDmg, ...), a fraction.
type ElementStats = Record<`${ElementId}Atk` | `${ElementId}Def`, number> & Record<`${Race}Dmg`, number>;
const ELEMENT_ZERO = Object.fromEntries([...ELEMENT_IDS.flatMap((e) => [[`${e}Atk`, 0], [`${e}Def`, 0]]), ...RACES.map((r) => [`${r}Dmg`, 0])]) as ElementStats;

export type Stats = typeof ZERO & ElementStats;

// What a hit is measured against.
export interface Defender {
  def: number;
  mdef: number;
  flee: number;
  eleDef?: Partial<Record<ElementId, number>>;
  race?: Race;
}

export interface Hit {
  dmg: number;
  crit: boolean;
  magic: boolean;
  miss: boolean;
  element?: ElementId;
}

function add(into: Record<string, number>, from: StatBag, k = 1): void {
  for (const [key, v] of Object.entries(from)) into[key] = (into[key] ?? 0) + (v ?? 0) * k;
}

// progress: Progress; weaponId: main-hand weapon or null; buffs: [{ stats }]; offhandId: what
// the off hand holds (a weapon counts for its mastery, gear adds its stats); worn: the hat,
// shoes, rings and trinkets worn (their stats)
export function computeStats(progress: Progress, weaponId: string | null, buffs: { stats: StatBag }[] = [], offhandId: string | null = null, worn: (string | null)[] = []): Stats {
  const cls = CLASSES[progress.cls ?? "mage"];
  const s: Stats = { ...ZERO, ...ELEMENT_ZERO };
  const bag = s as unknown as Record<string, number>;
  add(bag, cls.base);
  add(bag, cls.growth, progress.level - 1);
  // a second job: its bonus, and its growth on every level since it could be taken
  const job = progress.job ? JOBS[progress.job] : null;
  if (job) {
    add(bag, job.bonus);
    add(bag, job.growth, Math.max(0, progress.level - JOB_LEVEL));
  }
  const offWeapon = offhandId ? ITEMS[offhandId]?.weapon ?? null : null;
  for (const [id, lv] of Object.entries(progress.elements)) {
    add(bag, ELEMENTS[id].per, lv);
    for (const m of ELEMENTS[id].marks) if (m.stats && lv >= m.at) add(bag, m.stats);
  }
  for (const treeId of progress.trees()) {
    for (const n of TREES[treeId].nodes) {
      const r = progress.ranks[n.id];
      if (r && n.kind === "passive" && n.stats && needMet(n.need, weaponId, offWeapon)) add(bag, n.stats(r));
    }
  }
  for (const [id, lv] of Object.entries(progress.mastery)) {
    const m = MASTERIES[id];
    // weapon masteries count while that weapon is in either hand
    if (m.kind === "weapon" && !m.weapons?.includes(weaponId as never) && !m.weapons?.includes(offWeapon as never)) continue;
    add(bag, m.per, lv);
    for (const r of m.rewards) if (r.kind === "passive" && r.stats && lv >= r.at) add(bag, r.stats);
  }
  const gear = offhandId ? ITEMS[offhandId] : undefined;
  if (gear?.kind === "offhand" && gear.stats) add(bag, gear.stats as StatBag);
  for (const id of worn) {
    const item = id ? ITEMS[id] : undefined;
    if (item?.stats) add(bag, item.stats as StatBag);
  }
  for (const b of buffs) add(bag, b.stats);
  s.maxHp *= 1 + s.maxHpPct;
  s.maxMp *= 1 + s.maxMpPct;
  s.atk *= 1 + s.atkPct;
  s.matk *= 1 + s.matkPct;
  s.def *= 1 + s.defPct;
  s.mdef *= 1 + s.mdefPct;
  s.mpRegen *= 1 + s.mpRegenPct;
  s.crit = Math.min(CRIT_CAP, s.crit);
  s.cdr = Math.min(0.5, s.cdr);
  s.castRed = Math.min(0.6, s.castRed);
  s.dmgRed = Math.min(0.75, s.dmgRed);
  s.aspd = Math.min(1.5, s.aspd);
  s.pierce = Math.min(0.8, s.pierce);
  s.multiShot = Math.min(0.8, s.multiShot);
  s.poisonHit = Math.min(0.6, s.poisonHit);
  s.reflect = Math.min(0.6, s.reflect);
  s.magicDodge = Math.min(0.6, s.magicDodge);
  return s;
}

// Luck (the jester's new stat, gear): every chance in the player's favour is this much likelier
// (luck 50: half as likely again): crits, procs, steals, drops, refining, a good dice roll. A
// monster's crit is as much less likely.
export function luckFactor(stats: { luck: number }): number {
  return 1 + Math.max(0, stats.luck) / 100;
}
export function lucky(chance: number, stats: { luck: number }): boolean {
  return Math.random() < chance * luckFactor(stats);
}
// A die (1-6): with luck, now and then rolled twice and the better kept.
export function rollDie(stats: { luck: number }): number {
  const roll = () => 1 + Math.floor(Math.random() * 6);
  const first = roll();
  return Math.random() < Math.min(0.8, Math.max(0, stats.luck) / 100) ? Math.max(first, roll()) : first;
}

// How strong the player's poison is: poison damage stats, doubled at poison element 50.
export function poisonScale(stats: Stats, elements: Record<string, number>): number {
  return (1 + stats.poisonPct) * ((elements.poison ?? 0) >= 50 ? 2 : 1);
}

// Defence curve: 100 defence halves the damage.
export function mitigate(amount: number, defence: number, pierce = 0): number {
  return amount * 100 / (100 + Math.max(0, defence) * (1 - pierce));
}

// The chance a physical blow lands: 80%, plus 1% for every point of accuracy over the target's
// evasion (less for every point under), between 5% and 100%.
export function hitChance(hit: number, flee: number): number {
  return Math.min(1, Math.max(0.05, 0.8 + (hit - flee) / 100));
}

// The most a crit chance can be, luck and the weapon's own included.
export const CRIT_CAP = 0.5;

// A critical hit goes through this much of the armour, on top of any armour piercing.
export const CRIT_PIERCE = 0.5;

// ---- elements: every blow carries the attacker's elemental power ----
// After a hit's normal damage, each element adds the attacker's attack in it over the defender's
// defence in it (an element the defender is better armoured against adds nothing, never less),
// straight onto the damage. A hit made in an element also swings with half again its attack in
// that element on top of its attack stat (ELEMENT_SWING), before defence.
export const ELEMENT_SWING = 1.5;
export function elementBonus(attack: (e: ElementId) => number, defence: (e: ElementId) => number): number {
  let sum = 0;
  for (const e of ELEMENT_IDS) sum += Math.max(0, attack(e) - defence(e));
  return sum;
}
// The player's bonus against a monster.
export function playerElementBonus(stats: Stats, target: Defender): number {
  return elementBonus((e) => stats[`${e}Atk`], (e) => target.eleDef?.[e] ?? 0);
}

// How much of the armour a light hit goes through (the light element's line).
export function lightPierce(level: number): number {
  return level > 0 ? Math.min(1, 0.2 + 0.016 * level + (level >= 35 ? 0.2 : 0)) : 0;
}

// Magic always lands and never crits. `through`: armour it goes through besides piercing.
function spellHit(raw: number, stats: Stats, target: Defender, through = 0): Hit {
  const pierce = 1 - (1 - stats.pierce) * (1 - through);
  return { dmg: Math.max(1, Math.round(mitigate(raw, target.mdef, pierce))), crit: false, magic: true, miss: false };
}

// A physical blow rolls its crit first, as in Ragnarok: a crit always lands, harder and through
// half the armour. Any other blow can miss (accuracy against evasion).
function physicalHit(raw: number, stats: Stats, critChance: number, target: Defender, through = 0): Hit {
  const crit = Math.random() < Math.min(CRIT_CAP, critChance * luckFactor(stats));
  if (!crit && Math.random() >= hitChance(stats.hit, target.flee)) return { dmg: 0, crit: false, magic: false, miss: true };
  const pierce = 1 - (1 - stats.pierce) * (1 - through) * (crit ? 1 - CRIT_PIERCE : 1);
  const dmg = mitigate(raw * (crit ? 1 + stats.critDmg : 1), target.def, pierce);
  return { dmg: Math.max(1, Math.round(dmg)), crit, magic: false, miss: false };
}

// Staves cast magic; everything else hits physically.
export function isMagic(w: WeaponType): boolean {
  return w.projectile?.kind === "bolt";
}

// A normal attack: weapon roll plus the matching attack stat (and the swing of its element when
// the weapon is enchanted), then the element bonus.
export function basicDamage(stats: Stats, w: WeaponType, target: Defender, element?: ElementId | null): Hit {
  const magic = isMagic(w);
  const [a, b] = w.damage;
  const swing = element ? ELEMENT_SWING * stats[`${element}Atk`] : 0;
  const raw = (rand(a, b) + (magic ? stats.matk : stats.atk) + swing) * (1 + stats.dmg);
  const hit = magic ? spellHit(raw, stats, target) : physicalHit(raw, stats, stats.crit + (w.crit ?? 0.05) - 0.05, target);
  if (!hit.miss) {
    hit.dmg += Math.round(playerElementBonus(stats, target));
    if (element) hit.element = element;
  }
  return hit;
}

// Average damage of the weapon in hand when it matches the skill's kind (a staff for spells,
// any other weapon for physical skills), added to the attack stat before the multiplier.
export function weaponPower(w: WeaponType | null | undefined, magic: boolean): number {
  return w && isMagic(w) === magic ? (w.damage[0] + w.damage[1]) / 2 : 0;
}

// What a skill hit does before defence, crits and the random spread: the skill's multiplier
// of attack stat plus weapon power (plus the swing of the skill's element), with fire on top
// (+1% a level, +15% more at 50). A skill on attack and magic attack together ("both") takes 0.6
// of each and any weapon's power.
export function skillPower(stats: Stats, elements: Record<string, number>, skill: SkillDef, rank: number, weapon: WeaponType | null = null): number {
  const magic = skill.stat === "matk", fire = elements.fire ?? 0;
  const swing = skill.element ? ELEMENT_SWING * stats[`${skill.element}Atk`] : 0;
  const base = swing + (skill.stat === "both"
    ? 0.6 * (stats.atk + stats.matk) + (weapon ? (weapon.damage[0] + weapon.damage[1]) / 2 : 0)
    : (magic ? stats.matk : stats.atk) + weaponPower(weapon, magic));
  return base * (skill.mult?.(rank) ?? 1) * (1 + stats.dmg) * (1 + 0.01 * fire) * (fire >= 50 ? 1.15 : 1);
}

// A skill hit: skillPower and the spread, then a spell (lightning: +0.3% damage a level) or a
// physical blow (lightning: +0.1% crit chance a level), then the element bonus (a light hit also
// goes through some of the armour).
export function skillDamage(stats: Stats, elements: Record<string, number>, skill: SkillDef, rank: number, target: Defender, weapon: WeaponType | null = null): Hit {
  const lightning = elements.lightning ?? 0, el = skill.element;
  const through = el === "light" ? lightPierce(elements.light ?? 0) : 0;
  const raw = skillPower(stats, elements, skill, rank, weapon) * rand(0.92, 1.08);
  const hit = skill.stat === "matk" || skill.stat === "both"
    ? spellHit(raw * (1 + 0.003 * lightning), stats, target, through)
    : physicalHit(raw, stats, stats.crit + 0.001 * lightning, target, through);
  if (!hit.miss) {
    hit.dmg += Math.round(playerElementBonus(stats, target));
    if (el) hit.element = el;
  }
  return hit;
}

// What a monster's bite does to it: a physical blow by the same rules (a crit lands, +50% and
// through half the player's armour; any other bite can miss); a bite in an element swings with
// its attack in it too and adds what that attack has over the player's defence in it. null when
// it misses.
export const MONSTER_CRIT_DMG = 0.5;
export function monsterDamage(m: { power: number; accuracy: number; crit: number; element?: ElementId; eleAtk: number }, stats: Stats): { dmg: number; crit: boolean } | null {
  const crit = Math.random() < m.crit / luckFactor(stats);
  if (!crit && Math.random() >= hitChance(m.accuracy, stats.flee)) return null;
  const swing = m.element ? ELEMENT_SWING * m.eleAtk : 0;
  let hit = mitigate((m.power + swing) * rand(0.85, 1.15) * (crit ? 1 + MONSTER_CRIT_DMG : 1), stats.def, crit ? CRIT_PIERCE : 0);
  if (m.element) hit += Math.max(0, m.eleAtk - stats[`${m.element}Def`]);
  return { dmg: Math.max(1, Math.round(hit * (1 - stats.dmgRed))), crit };
}

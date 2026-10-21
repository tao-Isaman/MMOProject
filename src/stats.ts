// Stats and damage. computeStats folds class, level, passives, masteries, elements, the weapon
// in hand and active buffs into one set of numbers; the damage functions use them.

import { CLASSES, TREES, MASTERIES, ELEMENTS } from "./progression";
import { ITEMS } from "./items";
import type { Progress, SkillDef, StatBag } from "./progression";
import type { WeaponType } from "./items";
import { rand } from "./particles";

const ZERO = {
  maxHp: 0, maxMp: 0, atk: 0, matk: 0, def: 0, mdef: 0, crit: 0, critDmg: 0, aspd: 0, move: 0,
  hpRegen: 0, mpRegen: 0, cdr: 0, dmgRed: 0,
  // extras: weapon damage bonus, reach, stun chance on hit, exp and drop bonus, defence ignored
  dmg: 0, reach: 0, stunHit: 0, xpPct: 0, drop: 0, pierce: 0, potion: 0,
  // healing power, a second arrow on a bow shot, poison on a normal hit, damage to monsters
  // under any status, longer buffs
  healPct: 0, multiShot: 0, poisonHit: 0, huntDmg: 0, buffTime: 0,
  // multipliers, applied at the end
  atkPct: 0, matkPct: 0, defPct: 0, mdefPct: 0, maxHpPct: 0, maxMpPct: 0, mpRegenPct: 0,
};

export type Stats = typeof ZERO;

// What a hit is measured against.
export interface Defender {
  def: number;
  mdef: number;
}

export interface Hit {
  dmg: number;
  crit: boolean;
  magic: boolean;
}

function add(into: Record<string, number>, from: StatBag, k = 1): void {
  for (const [key, v] of Object.entries(from)) into[key] = (into[key] ?? 0) + (v ?? 0) * k;
}

// progress: Progress; weaponId: main-hand weapon or null; buffs: [{ stats }]; offhandId: what
// the off hand holds (a weapon counts for its mastery, gear adds its stats)
export function computeStats(progress: Progress, weaponId: string | null, buffs: { stats: StatBag }[] = [], offhandId: string | null = null): Stats {
  const cls = CLASSES[progress.cls ?? "mage"];
  const s: Stats = { ...ZERO };
  const bag = s as unknown as Record<string, number>;
  add(bag, cls.base);
  add(bag, cls.growth, progress.level - 1);
  for (const [id, lv] of Object.entries(progress.elements)) {
    add(bag, ELEMENTS[id].per, lv);
    for (const m of ELEMENTS[id].marks) if (m.stats && lv >= m.at) add(bag, m.stats);
  }
  for (const treeId of progress.trees()) {
    for (const n of TREES[treeId].nodes) {
      const r = progress.ranks[n.id];
      if (r && n.kind === "passive" && n.stats) add(bag, n.stats(r));
    }
  }
  for (const [id, lv] of Object.entries(progress.mastery)) {
    const m = MASTERIES[id];
    // weapon masteries count while that weapon is in either hand
    const offWeapon = offhandId ? ITEMS[offhandId]?.weapon : undefined;
    if (m.kind === "weapon" && !m.weapons?.includes(weaponId as never) && !m.weapons?.includes(offWeapon as never)) continue;
    add(bag, m.per, lv);
    for (const r of m.rewards) if (r.kind === "passive" && r.stats && lv >= r.at) add(bag, r.stats);
  }
  const gear = offhandId ? ITEMS[offhandId] : undefined;
  if (gear?.kind === "offhand" && gear.stats) add(bag, gear.stats as StatBag);
  for (const b of buffs) add(bag, b.stats);
  s.maxHp *= 1 + s.maxHpPct;
  s.maxMp *= 1 + s.maxMpPct;
  s.atk *= 1 + s.atkPct;
  s.matk *= 1 + s.matkPct;
  s.def *= 1 + s.defPct;
  s.mdef *= 1 + s.mdefPct;
  s.mpRegen *= 1 + s.mpRegenPct;
  s.crit = Math.min(1, s.crit);
  s.cdr = Math.min(0.5, s.cdr);
  s.dmgRed = Math.min(0.75, s.dmgRed);
  s.aspd = Math.min(1.5, s.aspd);
  s.pierce = Math.min(0.8, s.pierce);
  s.multiShot = Math.min(0.8, s.multiShot);
  s.poisonHit = Math.min(0.6, s.poisonHit);
  return s;
}

// Defence curve: 100 defence halves the damage.
export function mitigate(amount: number, defence: number, pierce = 0): number {
  return amount * 100 / (100 + Math.max(0, defence) * (1 - pierce));
}

// Staves cast magic; everything else hits physically.
export function isMagic(w: WeaponType): boolean {
  return w.projectile?.kind === "bolt";
}

// A normal attack: weapon roll plus the matching attack stat.
export function basicDamage(stats: Stats, w: WeaponType, target: Defender): Hit {
  const magic = isMagic(w);
  const [a, b] = w.damage;
  const raw = (rand(a, b) + (magic ? stats.matk : stats.atk)) * (1 + stats.dmg);
  const crit = Math.random() < stats.crit + (w.crit ?? 0.05) - 0.05;
  const hit = mitigate(raw * (crit ? 1 + stats.critDmg : 1), magic ? target.mdef : target.def, stats.pierce);
  return { dmg: Math.max(1, Math.round(hit)), crit, magic };
}

// Average damage of the weapon in hand when it matches the skill's kind (a staff for spells,
// any other weapon for physical skills), added to the attack stat before the multiplier.
export function weaponPower(w: WeaponType | null | undefined, magic: boolean): number {
  return w && isMagic(w) === magic ? (w.damage[0] + w.damage[1]) / 2 : 0;
}

// What a skill hit does before defence, crits and the random spread: the skill's multiplier
// of attack stat plus weapon power, with fire on top (+1% a level, +15% more at 50).
export function skillPower(stats: Stats, elements: Record<string, number>, skill: SkillDef, rank: number, weapon: WeaponType | null = null): number {
  const magic = skill.stat === "matk", fire = elements.fire ?? 0;
  const base = (magic ? stats.matk : stats.atk) + weaponPower(weapon, magic);
  return base * (skill.mult?.(rank) ?? 1) * (1 + stats.dmg) * (1 + 0.01 * fire) * (fire >= 50 ? 1.15 : 1);
}

// A skill hit: skillPower, then crits (lightning adds to the chance), the spread and defence.
export function skillDamage(stats: Stats, elements: Record<string, number>, skill: SkillDef, rank: number, target: Defender, weapon: WeaponType | null = null): Hit {
  const magic = skill.stat === "matk";
  const raw = skillPower(stats, elements, skill, rank, weapon);
  const crit = Math.random() < stats.crit + 0.003 * (elements.lightning ?? 0);
  const hit = mitigate(raw * (crit ? 1 + stats.critDmg : 1) * rand(0.92, 1.08), magic ? target.mdef : target.def, stats.pierce);
  return { dmg: Math.max(1, Math.round(hit)), crit, magic };
}

// A monster hitting the player.
export function monsterDamage(atk: number, stats: Stats): number {
  return Math.max(1, Math.round(mitigate(atk * rand(0.85, 1.15), stats.def) * (1 - stats.dmgRed)));
}

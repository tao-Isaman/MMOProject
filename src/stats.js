// Stats and damage. computeStats folds class, level, passives, masteries, elements, the weapon
// in hand and active buffs into one set of numbers; the damage functions use them.

import { CLASSES, TREES, MASTERIES, ELEMENTS } from "./progression.js";
import { rand } from "./particles.js";

const ZERO = {
  maxHp: 0, maxMp: 0, atk: 0, matk: 0, def: 0, mdef: 0, crit: 0, critDmg: 0, aspd: 0, move: 0,
  hpRegen: 0, mpRegen: 0, cdr: 0, dmgRed: 0,
  // extras: weapon damage bonus, reach, stun chance on hit, exp and drop bonus, defence ignored
  dmg: 0, reach: 0, stunHit: 0, xpPct: 0, drop: 0, pierce: 0,
  // multipliers, applied at the end
  atkPct: 0, matkPct: 0, defPct: 0, mdefPct: 0, maxHpPct: 0, maxMpPct: 0, mpRegenPct: 0,
};

function add(into, from, k = 1) {
  for (const [key, v] of Object.entries(from)) into[key] = (into[key] ?? 0) + v * k;
}

// progress: Progress; weaponId: equipped weapon or null; buffs: [{ stats }]
export function computeStats(progress, weaponId, buffs = []) {
  const cls = CLASSES[progress.cls ?? "mage"];
  const s = { ...ZERO };
  add(s, cls.base);
  add(s, cls.growth, progress.level - 1);
  for (const [id, lv] of Object.entries(progress.elements)) add(s, ELEMENTS[id].per, lv);
  for (const treeId of progress.trees()) {
    for (const n of TREES[treeId].nodes) {
      const r = progress.ranks[n.id];
      if (r && n.kind === "passive") add(s, n.stats(r));
    }
  }
  for (const [id, lv] of Object.entries(progress.mastery)) {
    const m = MASTERIES[id];
    // weapon masteries count while that weapon is in hand
    if (m.kind === "weapon" && !m.weapons.includes(weaponId)) continue;
    add(s, m.per, lv);
    for (const r of m.rewards) if (r.kind === "passive" && lv >= r.at) add(s, r.stats);
  }
  for (const b of buffs) add(s, b.stats);
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
  return s;
}

// Defence curve: 100 defence halves the damage.
export function mitigate(amount, defence, pierce = 0) {
  return amount * 100 / (100 + Math.max(0, defence) * (1 - pierce));
}

// Staves cast magic; everything else hits physically.
export function isMagic(w) {
  return w.projectile?.kind === "bolt";
}

// A normal attack: weapon roll plus the matching attack stat.
export function basicDamage(stats, w, target) {
  const magic = isMagic(w);
  const [a, b] = w.damage;
  const raw = (rand(a, b) + (magic ? stats.matk : stats.atk)) * (1 + stats.dmg);
  const crit = Math.random() < stats.crit + (w.crit ?? 0.05) - 0.05;
  const hit = mitigate(raw * (crit ? 1 + stats.critDmg : 1), magic ? target.mdef : target.def, stats.pierce);
  return { dmg: Math.max(1, Math.round(hit)), crit, magic };
}

// Average damage of the weapon in hand when it matches the skill's kind (a staff for spells,
// any other weapon for physical skills), added to the attack stat before the multiplier.
export function weaponPower(w, magic) {
  return w && isMagic(w) === magic ? (w.damage[0] + w.damage[1]) / 2 : 0;
}

// A skill hit: the skill's multiplier of attack stat plus weapon power, fire and lightning
// levels on top.
export function skillDamage(stats, elements, skill, rank, target, weapon = null) {
  const magic = skill.stat === "matk";
  const base = (magic ? stats.matk : stats.atk) + weaponPower(weapon, magic);
  const raw = base * skill.mult(rank) * (1 + stats.dmg) * (1 + 0.01 * (elements.fire ?? 0));
  const crit = Math.random() < stats.crit + 0.003 * (elements.lightning ?? 0);
  const hit = mitigate(raw * (crit ? 1 + stats.critDmg : 1) * rand(0.92, 1.08), magic ? target.mdef : target.def, stats.pierce);
  return { dmg: Math.max(1, Math.round(hit)), crit, magic };
}

// A monster hitting the player.
export function monsterDamage(atk, stats) {
  return Math.max(1, Math.round(mitigate(atk * rand(0.85, 1.15), stats.def) * (1 - stats.dmgRed)));
}

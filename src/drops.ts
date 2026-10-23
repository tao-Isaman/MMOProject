// What a field monster leaves when it falls (src/main.ts rolls it; the codex lists it): the
// material of what it is, now and then a monster core (likelier the higher its level), the two
// refining stones, and gear of the tier its level falls in. Books and the shop's hats, shoes,
// rings and trinkets come from pools of their own (main.ts), the first field's slimes have their
// own list (monsters.ts).

import { GEAR_TIERS, TIER_SLOTS, tierId } from "./items";
import type { MonsterDef, MonsterKind } from "./bestiary";
import type { Race } from "./progression";

// Hide from animals, insects and water beasts; ore from golems, spirits, people and the dead
// (their old armour); gem shards from magic plants, demons, angels and dragons (dragons a hide too).
export const MATERIAL_OF: Record<Race, string> = {
  brute: "beast_hide", insect: "beast_hide", fish: "beast_hide",
  formless: "iron_ore", human: "iron_ore", undead: "iron_ore",
  plant: "gem_shard", demon: "gem_shard", angel: "gem_shard", dragon: "gem_shard",
};
// how much more a kind leaves
const KIND_SCALE: Record<MonsterKind, number> = { normal: 1, tank: 1.2, fast: 0.9, caster: 1, rare: 5, boss: 8 };
const STONE: Record<MonsterKind, number> = { normal: 0.004, tank: 0.004, fast: 0.004, caster: 0.004, rare: 0.05, boss: 0.3 };

// The fixed list: [item, chance] (before the player's drop and luck bonuses).
export function fieldDrops(def: MonsterDef): [string, number][] {
  const k = KIND_SCALE[def.kind], level = (def.levels[0] + def.levels[1]) / 2;
  const big = def.kind === "rare" || def.kind === "boss" ? 2 : 1;
  const round = (v: number) => +Math.min(1, v).toFixed(4);
  const out: [string, number][] = [[MATERIAL_OF[def.race ?? "brute"], round(0.12 * k)]];
  if (def.race === "dragon") out.push(["beast_hide", round(0.12 * k)]);
  out.push(["monster_core", round((0.015 + level * 0.0003) * k * big)], ["sky_stone", STONE[def.kind]], ["star_stone", STONE[def.kind]]);
  return out;
}

// The gear tier a monster of a level leaves: the tier its level band (tier to tier + 29) starts
// at, none under 30.
export function gearTierAt(level: number): number | null {
  return [...GEAR_TIERS].reverse().find((t) => level >= t) ?? null;
}
// The chance a monster leaves one piece of that tier's gear (any of them alike).
export const TIER_DROP: Record<MonsterKind, number> = { normal: 0.003, tank: 0.003, fast: 0.003, caster: 0.003, rare: 0.06, boss: 0.4 };
export function tierPool(tier: number): string[] {
  return TIER_SLOTS.map((s) => tierId(tier, s));
}

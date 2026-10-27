// What a field monster leaves when it falls (src/main.ts rolls it; the codex lists it): its own
// material (one per monster, only it drops it: sale goods), the material of what it is and a
// little of the other two, now and then a monster core (likelier the higher its level), the two
// refining stones, and gear of the tier its level falls in. Books and the shop's hats, shoes,
// rings and trinkets come from pools of their own (main.ts), the first field's slimes have their
// own list (monsters.ts).

import { GEAR_TIERS, TIER_SLOTS, tierId, ITEMS } from "./items";
import { MONSTERS } from "./bestiary";
import type { MonsterDef, MonsterKind } from "./bestiary";
import type { Race } from "./progression";
import { MAP_NAMES } from "./maps";

// One line of a drop table: the item, the chance it drops (before the player's drop and luck
// bonuses) and, when more than one falls at once, how many: [fewest, most].
export type Drop = [id: string, chance: number, count?: [number, number]];

// Hide from animals, insects and water beasts; ore from golems, spirits, people and the dead
// (their old armour); gem shards from magic plants, demons, angels and dragons (dragons a hide too).
export const MATERIAL_OF: Record<Race, string> = {
  brute: "beast_hide", insect: "beast_hide", fish: "beast_hide",
  formless: "iron_ore", human: "iron_ore", undead: "iron_ore",
  plant: "gem_shard", demon: "gem_shard", angel: "gem_shard", dragon: "gem_shard",
};
const GENERIC = ["beast_hide", "iron_ore", "gem_shard"];
// how much more a kind leaves
const KIND_SCALE: Record<MonsterKind, number> = { normal: 1, tank: 1.2, fast: 0.9, caster: 1, rare: 5, boss: 8 };
const STONE: Record<MonsterKind, number> = { normal: 0.006, tank: 0.006, fast: 0.006, caster: 0.006, rare: 0.05, boss: 0.3 };

// ---- each monster's own material ----
export const matId = (monster: string) => `mat_${monster}`;
// What the shop pays for a monster's own material. A kill pays (1.5–3.5) x level gold straight
// away, 2.5 x level on average; a common monster leaves its material about 30% of the time
// (tank 36%, fast 27%), so at 4 + 2.8 x level a piece brings in about a third of that again
// (fast 30%, tank 41%) on top. A rare one always leaves it and is worth three, a boss leaves
// three or four worth eight each: their big paydays.
const SELL_KIND: Record<MonsterKind, number> = { normal: 1, tank: 1, fast: 1, caster: 1, rare: 3, boss: 8 };
export function materialSell(level: number, kind: MonsterKind): number {
  return Math.round((4 + 2.8 * level) * SELL_KIND[kind]);
}
// its picture: a glyph by what it is, tinted by its element
const MAT_GLYPH: Record<Race, string> = {
  brute: "paw", insect: "bug", fish: "fish", formless: "earth", human: "person",
  undead: "skull", plant: "leaf", demon: "horns", angel: "wing", dragon: "dragon",
};
const MAT_COLOR: Record<string, string> = {
  earth: "#c8a064", water: "#5aa8ff", wind: "#9ee8b0", fire: "#ff7a4a", lightning: "#ffe066", ice: "#a8e4ff",
  light: "#fff2a8", dark: "#9a7cc8", plant: "#7ed06a", stone: "#a8a090", mud: "#8a6a48", lava: "#ff5a2a",
  metal: "#c0c8d8", poison: "#a0e060", smoke: "#b8b8c8", shadow: "#7060a0", gold: "#ffd24a",
};
// Into ITEMS, one per monster (its level sets the price; it is the same item where it visits).
for (const m of MONSTERS) {
  ITEMS[matId(m.id)] = {
    kind: "material", name: m.mat, stack: 99, sell: materialSell(m.level, m.kind),
    icon: { glyph: MAT_GLYPH[m.race ?? "brute"], color: MAT_COLOR[m.element ?? ""] ?? "#d8c8a0" },
    note: `วัตถุดิบจาก${m.name} (ฟิลด์ ${MAP_NAMES[m.field]}) ขายให้ร้านค้าได้`,
  };
}

// The fixed list (before the player's drop and luck bonuses).
export function fieldDrops(def: MonsterDef): Drop[] {
  const k = KIND_SCALE[def.kind], level = def.level;
  const big = def.kind === "rare" || def.kind === "boss" ? 2 : 1;
  const round = (v: number) => +Math.min(1, v).toFixed(4);
  // its own material: about one kill in three, always from a rare one, three or four from a boss
  const own: Drop = def.kind === "boss" ? [matId(def.id), 1, [3, 4]] : [matId(def.id), def.kind === "rare" ? 1 : round(0.3 * k)];
  // the material of what it is (a dragon two), and a little of the others for crafting and brewing
  const main = def.race === "dragon" ? ["gem_shard", "beast_hide"] : [MATERIAL_OF[def.race ?? "brute"]];
  const out: Drop[] = [own, ...main.map((id): Drop => [id, round(0.12 * k)]), ...GENERIC.filter((id) => !main.includes(id)).map((id): Drop => [id, round(0.03 * k)])];
  out.push(["monster_core", round((0.015 + level * 0.0003) * k * big)], ["sky_stone", STONE[def.kind]], ["star_stone", STONE[def.kind]]);
  return out;
}

// The gear tier a monster of a level leaves: the tier its level band (tier to tier + 29) starts
// at, none under 30.
export function gearTierAt(level: number): number | null {
  return [...GEAR_TIERS].reverse().find((t) => level >= t) ?? null;
}
// The chance a monster leaves one piece of that tier's gear (half the time the player's own
// weapon, main.ts; else any of them alike).
export const TIER_DROP: Record<MonsterKind, number> = { normal: 0.003, tank: 0.003, fast: 0.003, caster: 0.003, rare: 0.06, boss: 0.4 };
export function tierPool(tier: number): string[] {
  return TIER_SLOTS.map((s) => tierId(tier, s));
}

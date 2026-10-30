// Gear sockets (v0.7): what can be set into a weapon or a piece of gear, kept in the piece's id
// after "#" (items.ts splitId), parts joined by "|":
//   c:<core id>       one monster core (CORES), only in the kind of gear the core names; always
//                     takes, and stays for good
//   s:<stat>:<n>      up to four soul fragments, each a small stat rolled when it is set
//                     (SOUL_STATS: n is the points, or thousandths for a percent)
//   e:<element>:<n>   up to four element stones, +10 to +50 in that element: attack on a weapon,
//                     ring or trinket, defence on anything else
// A soul fragment or an element stone can fail to take (SET_CHANCE: less for every one already
// in), and is lost then; the piece stays as it was.
//
// Every monster has its own core (core_<monster id>, drops.ts: one kill in a thousand). What it
// gives is read from the monster itself (bestiary.ts): two stats from what it stands out at
// (standouts) or what it is (race), never the same pair at the same numbers as another core, and
// one more thing from how it fights: a skill granted or raised, a mastery or element raised, or a
// skill it casts by itself on a normal hit (a boss two of these). Its level and kind set how much.

import { ITEMS, WEARABLE, splitId, joinId, setSocketResolver } from "./items";
import type { Item, ItemKind, Grants, SocketInfo } from "./items";
import { MONSTERS, standouts, behaviour } from "./bestiary";
import type { MonsterDef, MonsterKind, StatProfile } from "./bestiary";
import { ACTIVES, AUTOCAST, ELEMENTS, ELEMENT_IDS, ELEMENT_STAT_NAMES, MASTERIES, PERCENT_STATS, RACE_NAMES, RACES, STAT_NAMES } from "./progression";
import type { ElementId, Race } from "./progression";

export type CoreSlot = "weapon" | "offhand" | "top" | "bottom" | "hat" | "shoes" | "ring" | "trinket";
export const SLOT_NAMES: Record<CoreSlot, string> = {
  weapon: "อาวุธ", offhand: "มือรอง", top: "เสื้อ", bottom: "กางเกง/กระโปรง", hat: "หมวก", shoes: "รองเท้า", ring: "แหวน", trinket: "เครื่องประดับ",
};
export const MAX_SOULS = 4;
export const MAX_STONES = 4;
// The chance the 1st, 2nd, 3rd and 4th soul fragment or element stone takes (before luck).
export const SET_CHANCE = [0.9, 0.7, 0.5, 0.3];

// ---- names for stats ----
const WORDS: Record<string, string> = {
  ...STAT_NAMES, ...ELEMENT_STAT_NAMES, atkPct: "พลังโจมตี", matkPct: "พลังเวท", defPct: "ป้องกัน", mdefPct: "ต้านเวท", maxHpPct: "HP สูงสุด",
  maxMpPct: "MP สูงสุด", goldPct: "ทองจากมอนสเตอร์",
  ...Object.fromEntries(RACES.map((r) => [`${r}Dmg`, `ดาเมจใส่${RACE_NAMES[r]}`])),
};
const isPct = (k: string) => k.endsWith("Pct") || (k.endsWith("Dmg") && k !== "critDmg") || PERCENT_STATS.has(k);
export function statWords(stats: Partial<Record<string, number>>): string {
  return Object.entries(stats).filter(([k]) => !k.startsWith(AUTOCAST)).map(([k, v = 0]) =>
    `${WORDS[k] ?? k} +${isPct(k) ? `${+(v * 100).toFixed(1)}%` : +v.toFixed(1)}`).join(" · ");
}

// ---- monster cores ----
export interface Core {
  id: string;
  monster: string;
  name: string;
  level: number;
  slot: CoreSlot;
  stats: Partial<Record<string, number>>; // with autocast_<skill>: the chance it casts by itself
  grants: Grants;
}
export const coreId = (monster: string) => `core_${monster}`;
export const CORES: Record<string, Core> = {};

const KIND_MUL: Record<MonsterKind, number> = { normal: 1, tank: 1, fast: 1, caster: 1, rare: 1.4, boss: 1.9 };
type StatPick = [key: string, at: (L: number) => number];
const pctAt = (a: number, b: number) => (L: number) => a + b * L;
const flatAt = (a: number, b: number) => (L: number) => a + b * L;
// What a strength gives, and what a race gives when it stands out at one thing or none.
const BY_STANDOUT: Record<string, StatPick> = {
  strong: ["atkPct", pctAt(0.04, 0.0004)],
  fast: ["aspd", pctAt(0.03, 0.00025)],
  tough: ["maxHpPct", pctAt(0.05, 0.0004)],
  magic: ["matkPct", pctAt(0.04, 0.0004)],
  evasive: ["flee", flatAt(6, 0.35)],
  accurate: ["hit", flatAt(6, 0.35)],
  crit: ["crit", pctAt(0.02, 0.0001)],
};
const BY_RACE: Record<Race, StatPick> = {
  brute: ["atk", flatAt(4, 0.3)], insect: ["move", pctAt(0.03, 0.0002)], fish: ["maxMp", flatAt(20, 3)],
  formless: ["def", flatAt(3, 0.25)], human: ["luck", flatAt(3, 1 / 15)], undead: ["mdef", flatAt(3, 0.25)],
  plant: ["hpRegen", flatAt(1, 1 / 15)], demon: ["matk", flatAt(4, 0.3)], angel: ["maxHp", flatAt(40, 5)],
  dragon: ["critDmg", pctAt(0.08, 0.0005)],
};
const SLOT_OF_STANDOUT: Record<string, CoreSlot> = {
  strong: "weapon", crit: "trinket", accurate: "ring", tough: "top", magic: "hat", evasive: "shoes", fast: "bottom",
};
const SLOT_OF_RACE: Record<Race, CoreSlot> = {
  brute: "weapon", insect: "shoes", fish: "bottom", formless: "top", human: "ring", undead: "trinket",
  plant: "hat", demon: "trinket", angel: "hat", dragon: "top",
};
// The skills a core can grant, raise or cast (none needs a weapon, so any build can use them).
const BOLT: Partial<Record<ElementId, string>> = {
  fire: "elem_flame_lance", lava: "elem_flame_lance", water: "elem_tidal_wave", wind: "monk_nature_gust", ice: "rime_shard",
  light: "radiant_sacred_ray", dark: "shade_shadow_bolt", smoke: "shade_shadow_bolt", plant: "seed_shot", lightning: "levin_spark",
  metal: "archmage_metal_spike", mud: "slow_arrow", poison: "venom_dart", shadow: "shaman_summon_shade", gold: "trade_coin",
  earth: "sculptor_stone_hurl", stone: "sculptor_stone_hurl",
};
const NOVA: Partial<Record<ElementId, string>> = {
  fire: "weaponsmith_spark", lava: "weaponsmith_spark", ice: "rime_ring", light: "radiant_purge_nova", lightning: "levin_burst",
  metal: "archmage_metal_thorns",
};
const MASTERY_OF_RACE: Record<Race, string> = {
  brute: "claw", insect: "dagger", fish: "spear", formless: "mace", human: "sword", undead: "staff", plant: "staff",
  demon: "axe", angel: "mace", dragon: "axe",
};
const usableSkill = (id: string | undefined): id is string => !!id && !!ACTIVES[id] && !ACTIVES[id].need;

type Special = { kind: "grant" | "rank" | "mastery" | "element" | "auto"; id: string };
function specials(def: CoreSource): Special[] {
  const has = (b: string) => behaviour(def, b) !== null, ranged = behaviour(def, "ranged");
  const el = def.element, magical = !!def.stats?.magical || def.kind === "caster";
  const out: Special[] = [];
  const push = (s: Special | null) => {
    if (s && !out.some((o) => o.kind === s.kind)) out.push(s);
  };
  if (ranged === "arrow") push({ kind: "mastery", id: "bow" });
  if (ranged === "musket" || ranged === "cannon") push({ kind: "mastery", id: "gun" });
  if (ranged === "shuriken") push({ kind: "mastery", id: "dagger" });
  if (has("slam") || has("explode")) {
    const id = (el && NOVA[el]) || (magical ? "ether_burst" : "whirlwind");
    if (usableSkill(id)) push({ kind: "auto", id });
  }
  if (has("heal")) push({ kind: "grant", id: magical || def.race === "angel" || def.race === "plant" ? "holy_heal" : "first_aid" });
  if (has("charge")) push({ kind: "grant", id: "dash_strike" });
  if (has("burn") || has("slow") || has("petrify")) {
    const id = has("burn") ? "elem_flame_lance" : has("petrify") ? "sculptor_stone_hurl" : (el && BOLT[el]) || "rime_shard";
    if (usableSkill(id)) push({ kind: "auto", id });
  }
  if (has("steal")) push({ kind: "mastery", id: "dagger" });
  if (el && (magical || (ranged && ranged in ELEMENTS))) push({ kind: "element", id: el });
  if (el && usableSkill(BOLT[el])) push({ kind: "rank", id: BOLT[el]! });
  push({ kind: "mastery", id: MASTERY_OF_RACE[def.race ?? "brute"] });
  return out.filter((s) => s.kind === "mastery" || s.kind === "element" || usableSkill(s.id)).slice(0, def.kind === "boss" ? 2 : 1);
}

// What a core is made from: a field monster, or one of the first field's slimes.
type CoreSource = Pick<MonsterDef, "id" | "name" | "level" | "kind" | "element" | "behave" | "race" | "stats">;
const SLIMES: CoreSource[] = [
  { id: "slime_green", name: "สไลม์เขียว", level: 1, kind: "normal", element: "plant", behave: [], race: "formless", stats: {} },
  { id: "slime_pink", name: "สไลม์ชมพู", level: 3, kind: "normal", behave: [], race: "formless", stats: { flee: 10 } },
  { id: "slime_blue", name: "สไลม์ฟ้า", level: 5, kind: "normal", element: "ice", behave: [], race: "formless", stats: { def: 1.35 } },
  { id: "slime_violet", name: "สไลม์ม่วง", level: 9, kind: "normal", element: "dark", behave: [], race: "formless", stats: { crit: 0.13 } },
];

function makeCore(def: CoreSource, taken: Set<string>): Core {
  const L = def.level, k = KIND_MUL[def.kind], race = def.race ?? "brute";
  const outs = standouts((def.stats ?? {}) as StatProfile, behaviour(def, "dodge") !== null);
  const picks: StatPick[] = [];
  for (const o of outs) if (picks.length < 2 && !picks.some((p) => p[0] === BY_STANDOUT[o][0])) picks.push(BY_STANDOUT[o]);
  if (picks.length < 2 && !picks.some((p) => p[0] === BY_RACE[race][0])) picks.push(BY_RACE[race]);
  if (picks.length < 2) picks.push(def.kind === "tank" ? ["defPct", pctAt(0.05, 0.0004)] : ["maxHp", flatAt(40, 5)]);
  const stats: Record<string, number> = {};
  for (const [key, at] of picks) stats[key] = isPct(key) ? +(at(L) * k).toFixed(3) : Math.max(1, Math.round(at(L) * k));
  if (has(def, "reflect")) stats.reflect = +((0.03 + 0.0002 * L) * k).toFixed(3);
  // never two cores with the same numbers: nudge the second stat until it is its own
  const second = picks[1][0], step = isPct(second) ? 0.001 : 1;
  const sig = () => Object.entries(stats).sort().map(([a, b]) => `${a}:${b}`).join(",");
  while (taken.has(sig())) stats[second] = +(stats[second] + step).toFixed(3);
  taken.add(sig());
  const big = def.kind === "boss" ? 2 : def.kind === "rare" ? 1 : 0;
  const grants: Required<Grants> = { ranks: {}, mastery: {}, elements: {}, auto: {} };
  for (const s of specials(def)) {
    const max = ACTIVES[s.id]?.max ?? 5;
    if (s.kind === "grant") grants.ranks[s.id] = Math.min(max, 1 + Math.floor(L / 40) + big);
    if (s.kind === "rank") grants.ranks[s.id] = 1 + Math.floor(L / 70) + Math.min(1, big);
    if (s.kind === "mastery") grants.mastery[s.id] = Math.ceil(L / 30) + big;
    if (s.kind === "element") grants.elements[s.id] = Math.ceil(L / 25) + big;
    if (s.kind === "auto") {
      grants.auto[s.id] = Math.min(max, 1 + Math.floor(L / 40) + big);
      stats[AUTOCAST + s.id] = +((0.03 + 0.0001 * L) * (def.kind === "boss" ? 1.5 : 1)).toFixed(3);
    }
  }
  const slot: CoreSlot = has(def, "reflect") ? "offhand" : outs.length ? SLOT_OF_STANDOUT[outs[0]] : SLOT_OF_RACE[race];
  return { id: coreId(def.id), monster: def.id, name: `แกน${def.name}`, level: L, slot, stats, grants };
}
const has = (def: { behave: string[] }, b: string) => behaviour(def, b) !== null;

// What a core gives, as tip lines.
export function coreLines(c: Core): string[] {
  const out = [`ใส่ได้กับ: ${SLOT_NAMES[c.slot]}`];
  const plain = statWords(c.stats);
  if (plain) out.push(plain);
  for (const [id, r] of Object.entries(c.grants.ranks ?? {})) out.push(`สกิล ${ACTIVES[id].name} +${r} ระดับ (ยังไม่ได้เรียนก็ใช้ได้)`);
  for (const [id, lv] of Object.entries(c.grants.mastery ?? {})) out.push(`ความเชี่ยวชาญ${MASTERIES[id].name} +${lv} ระดับ`);
  for (const [id, lv] of Object.entries(c.grants.elements ?? {})) out.push(`ธาตุ${ELEMENTS[id].name} +${lv} ระดับ`);
  for (const [id, r] of Object.entries(c.grants.auto ?? {}))
    out.push(`ตีปกติโดนมีโอกาส ${+((c.stats[AUTOCAST + id] ?? 0) * 100).toFixed(1)}% ร่าย${ACTIVES[id].name} ระดับ ${r} เอง`);
  return out;
}

const ELEMENT_COLOR = (e: ElementId | undefined) => (e ? ELEMENTS[e].color : "#e8604a");
{
  const taken = new Set<string>();
  for (const def of [...SLIMES, ...MONSTERS]) {
    if (CORES[coreId(def.id)]) continue;
    const c = makeCore(def, taken);
    CORES[c.id] = c;
    ITEMS[c.id] = {
      kind: "material", socket: "core", name: c.name, stack: 99, sell: 200 + c.level * 10,
      icon: { glyph: "burst", color: ELEMENT_COLOR(def.element) },
      note: `แกนพลังของ${def.name} ใส่ในอุปกรณ์ได้ 1 ชิ้นต่อ 1 อุปกรณ์ที่โรงช่าง ใส่แล้วติดถาวร<br>${coreLines(c).join("<br>")}`,
    };
  }
}

// ---- soul fragments ----
export const SOUL = "soul_fragment";
ITEMS[SOUL] = {
  kind: "material", socket: "soul", name: "ชิ้นส่วนวิญญาณ", stack: 99, sell: 30, icon: { glyph: "star", color: "#c8b8ff" },
  note: `เศษวิญญาณจากมอนสเตอร์ ใส่ในอาวุธหรืออุปกรณ์ได้ถึง ${MAX_SOULS} ชิ้นที่โรงช่าง ได้ค่าสถานะเล็กน้อยแบบสุ่ม ยิ่งใส่หลายชิ้นยิ่งติดยาก (ไม่ติดก็หายไป)`,
};
// [stat, at tier 0 (points, or a fraction for a percent)]: rolled at 60-100% of it, more on
// higher tier gear (x2 at tier 60, x4 at 180 for points; x3 at 180 for percents).
export const SOUL_STATS: [string, number][] = [
  ["atk", 3], ["matk", 3], ["def", 2], ["mdef", 2], ["maxHp", 25], ["maxMp", 15], ["hit", 3], ["flee", 3], ["luck", 2], ["hpRegen", 1],
  ["crit", 0.008], ["critDmg", 0.02], ["aspd", 0.008], ["move", 0.01], ["atkPct", 0.01], ["matkPct", 0.01], ["maxHpPct", 0.012], ["defPct", 0.012],
];
const soulValue = (key: string, n: number) => (isPct(key) ? n / 1000 : n);
// A soul fragment's part as words ("พลังโจมตี +4").
export function soulText(part: string): string {
  const [, key, n] = part.split(":");
  return statWords({ [key]: soulValue(key, +n) });
}
export function rollSoul(gear: string): string {
  const [key, v] = SOUL_STATS[Math.floor(Math.random() * SOUL_STATS.length)];
  const t = ITEMS[gear]?.tier ?? 0, roll = 0.6 + 0.4 * Math.random();
  const n = isPct(key) ? Math.max(1, Math.round(1000 * v * roll * (1 + t / 90))) : Math.max(1, Math.round(v * roll * (1 + t / 60)));
  return `s:${key}:${n}`;
}

// ---- element stones ----
export const stoneId = (e: ElementId) => `elstone_${e}`;
for (const e of ELEMENT_IDS) {
  ITEMS[stoneId(e)] = {
    kind: "material", socket: "stone", name: `ศิลาธาตุ${ELEMENTS[e].name}`, stack: 99, sell: 80,
    icon: { glyph: ELEMENTS[e].glyph, color: ELEMENTS[e].color },
    note: `ใส่ในอาวุธหรืออุปกรณ์ได้ถึง ${MAX_STONES} ก้อนที่โรงช่าง ได้ +10 ถึง +50 แบบสุ่ม: ใส่อาวุธ แหวน หรือเครื่องประดับ เป็นพลังโจมตีธาตุ${ELEMENTS[e].name} ใส่อย่างอื่นเป็นป้องกันธาตุ${ELEMENTS[e].name} ยิ่งใส่หลายก้อนยิ่งติดยาก (ไม่ติดก็หายไป)`,
  };
}
const ATTACK_GEAR = new Set<ItemKind>(["weapon", "ring", "trinket"]);
export function rollStone(e: ElementId): string {
  return `e:${e}:${10 + Math.floor(Math.random() * 41)}`;
}

// ---- reading and writing a piece's sockets ----
export interface Sockets { core: string | null; souls: string[]; stones: string[] }
export function socketsOf(id: string): Sockets {
  const raw = splitId(id).sockets;
  const out: Sockets = { core: null, souls: [], stones: [] };
  for (const part of raw ? raw.split("|") : []) {
    if (part.startsWith("c:")) out.core = part.slice(2);
    else if (part.startsWith("s:")) out.souls.push(part);
    else if (part.startsWith("e:")) out.stones.push(part);
  }
  return out;
}
export function withSockets(id: string, s: Sockets): string {
  const { base, plus, maker } = splitId(id);
  const parts = [...(s.core ? [`c:${s.core}`] : []), ...s.souls, ...s.stones];
  return joinId(base, plus, maker, parts.length ? parts.join("|") : null);
}
// Whether a piece of gear takes sockets at all, and which core fits it.
export const socketable = (id: string): boolean => WEARABLE.has(ITEMS[id]?.kind);
export function coreFits(core: string, gear: string): boolean {
  const c = CORES[core], kind = ITEMS[gear]?.kind;
  return !!c && !!kind && c.slot === kind && !socketsOf(gear).core;
}

// What a socket string does on a piece (null: not a valid one for it).
function resolve(raw: string, item: Item): SocketInfo | null {
  const stats: Record<string, number> = {};
  const add = (k: string, v: number) => (stats[k] = +((stats[k] ?? 0) + v).toFixed(4));
  let core: Core | null = null, souls = 0, stones = 0;
  const lines: string[] = [];
  const stoneWords: string[] = [], soulWords: string[] = [];
  for (const part of raw.split("|")) {
    const [kind, a, b] = part.split(":");
    if (kind === "c") {
      core = CORES[a] ?? null;
      if (!core || core.slot !== item.kind) return null;
      for (const [k, v = 0] of Object.entries(core.stats)) add(k, v);
    } else if (kind === "s") {
      if (++souls > MAX_SOULS || !SOUL_STATS.some(([k]) => k === a) || !(+b > 0)) return null;
      add(a, soulValue(a, +b));
      soulWords.push(statWords({ [a]: soulValue(a, +b) }));
    } else if (kind === "e") {
      if (++stones > MAX_STONES || !(a in ELEMENTS) || !(+b > 0)) return null;
      const key = `${a}${ATTACK_GEAR.has(item.kind) ? "Atk" : "Def"}`;
      add(key, +b);
      stoneWords.push(statWords({ [key]: +b }));
    } else return null;
  }
  if (core) lines.push(`<b>${core.name}</b>: ${coreLines(core).slice(1).join(" · ")}`);
  lines.push(`ชิ้นส่วนวิญญาณ ${souls}/${MAX_SOULS}${soulWords.length ? `: ${soulWords.join(" · ")}` : ""}`);
  lines.push(`ศิลาธาตุ ${stones}/${MAX_STONES}${stoneWords.length ? `: ${stoneWords.join(" · ")}` : ""}`);
  return { stats, grants: core?.grants, tag: core ? `[${core.name}]` : souls + stones ? `[${souls + stones}]` : undefined, text: lines.join("<br>") };
}
setSocketResolver(resolve);

// What everything worn grants together (Progress.gear).
export function gearGrants(ids: (string | null)[]): Required<Grants> {
  const out: Required<Grants> = { ranks: {}, mastery: {}, elements: {}, auto: {} };
  for (const id of ids) {
    const g = id ? ITEMS[id]?.grants : undefined;
    if (!g) continue;
    for (const part of ["ranks", "mastery", "elements", "auto"] as const)
      for (const [k, v] of Object.entries(g[part] ?? {})) out[part][k] = part === "auto" ? Math.max(out[part][k] ?? 0, v) : (out[part][k] ?? 0) + v;
  }
  return out;
}

// What a monster leaves of these (drops.ts and the slimes, monsters.ts): its core one time in a
// thousand, a soul fragment now and then, and a stone of its own element.
export const CORE_CHANCE = 0.001;
const SOUL_CHANCE: Record<MonsterKind, number> = { normal: 0.01, tank: 0.012, fast: 0.009, caster: 0.01, rare: 0.1, boss: 0.5 };
const STONE_CHANCE: Record<MonsterKind, number> = { normal: 0.004, tank: 0.004, fast: 0.004, caster: 0.005, rare: 0.04, boss: 0.25 };
export function socketDrops(monster: string, kind: MonsterKind, element: ElementId | undefined): [string, number][] {
  const out: [string, number][] = [[coreId(monster), CORE_CHANCE], [SOUL, SOUL_CHANCE[kind]]];
  if (element) out.push([stoneId(element), STONE_CHANCE[kind]]);
  return out;
}

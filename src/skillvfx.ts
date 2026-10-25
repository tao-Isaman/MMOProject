import type { SkillDef } from "./progression";

export type SkillVfxTheme = "fire" | "plant" | "ice" | "water" | "lightning" | "wind" | "earth" | "holy" | "shadow" | "poison" | "metal" | "arcane" | "physical";

export interface SkillVfxProfile {
  theme: SkillVfxTheme;
  glyph: string;
  signature: number;
}

function signatureOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

const ELEMENT_THEME: Record<string, SkillVfxTheme> = {
  fire: "fire", lava: "fire", plant: "plant", ice: "ice", water: "water", lightning: "lightning", wind: "wind",
  earth: "earth", stone: "earth", mud: "earth", light: "holy", gold: "holy", dark: "shadow", shadow: "shadow",
  poison: "poison", metal: "metal",
};

const KEYWORD_THEME: [RegExp, SkillVfxTheme][] = [
  [/fire|flame|meteor|lava|rage/, "fire"],
  [/poison|toxic|venom|plague/, "poison"],
  [/ice|frost|freeze|snow/, "ice"],
  [/lightning|thunder/, "lightning"],
  [/plant|flower|petal|seed|root|thorn|vine|bloom/, "plant"],
  [/holy|divine|bless|angel|guardian|heal|miracle/, "holy"],
  [/shadow|dark|doom|curse|smoke|void/, "shadow"],
  [/water|river|aqua|tide|rain/, "water"],
  [/wind|dash|sprint|gale|spin|whirl/, "wind"],
  [/earth|stone|mud|quake|slam/, "earth"],
  [/metal|iron|shield|bash/, "metal"],
];

const GLYPH_THEME: Record<string, SkillVfxTheme> = {
  flame: "fire", rage: "fire", burst: "fire", leaf: "plant", flower: "plant", thorn: "plant",
  freeze: "ice", drop: "water", wave: "water", cry: "ice", storm: "wind", swirl: "wind", spin: "wind", dash: "wind", wing: "wind",
  heal: "holy", heart: "holy", star: "holy", up: "holy", shield: "metal", bash: "metal", slam: "earth", earth: "earth",
  eye: "shadow", void: "shadow", bolt: "arcane", beam: "arcane", arrow: "physical", twin: "physical", pierce: "physical", fan: "physical",
};

export function skillVfxProfile(id: string, glyph: string, skill: SkillDef): SkillVfxProfile {
  const key = id.toLowerCase();
  const elementTheme = skill.element ? ELEMENT_THEME[skill.element] : undefined;
  const namedTheme = Object.entries(ELEMENT_THEME).sort(([a], [b]) => b.length - a.length).find(([element]) => key.includes(element))?.[1];
  const keywordTheme = KEYWORD_THEME.find(([pattern]) => pattern.test(key))?.[1];
  const theme = elementTheme ?? namedTheme ?? keywordTheme ?? GLYPH_THEME[glyph] ?? (
    skill.type === "heal" || skill.type === "shield" || skill.type === "buff" ? "holy" :
    skill.type === "dash" || skill.type === "storm" ? "wind" :
    skill.type === "trap" || skill.type === "smoke" ? "shadow" :
    skill.type === "cone" ? "physical" : "arcane"
  );
  return { theme, glyph, signature: signatureOf(key) };
}

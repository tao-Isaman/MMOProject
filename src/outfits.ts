// What a character wears on the outside: the outfit of the job it has now (its third job, else its
// second, else its class; plain brown clothes before it picks a class), not its armour. Worn
// tops and bottoms only add their stats; how the character looks follows the job, the way a
// Ragnarok job changes its sprite.
//
// Each job and build is getting a body of its own from Oriverse (src/items.ts SHAPES marked
// `job`), worn as it was drawn: so far the swordsman's, the wizard's, the knight's, the
// bishop's, the ranger's, the thief's and the jester's, female and male, the warlord's male one
// and the battlemage's female one. Until a job's body for a build is in, its outfit is one of the
// other bodies in that job's colours: a female character the mage coat, the priestess robe or the
// adventurer vest, a male one the warrior jacket. A job line keeps its class's shape and moves on
// in colour (the male battlemage a sky-blue jacket, the archmage a midnight one).
//
// The look code (src/look.ts) reads a slot holding "@shape/dye" as that garment itself, so an
// outfit goes in place of the worn top and bottom without being an item anybody can hold.

import type { ClassId, JobId, Job3Id } from "./progression";
import type { Gender } from "./items";
import type { Equipped } from "./inventory";

type Piece = [shape: string, dye: string | null];
type Outfit = Record<Gender, [top: Piece, bottom: Piece]>;

const OUTFITS: Record<"none" | ClassId | JobId | Job3Id, Outfit> = {
  none: { female: [["plain", null], ["plain", null]], male: [["plain_m", null], ["plain_m", null]] },
  // the classes
  mage: { female: [["mage", null], ["mage", null]], male: [["warrior", "lilac"], ["warrior", "black"]] },
  warrior: { female: [["adventurer", null], ["adventurer", "cocoa"]], male: [["warrior", null], ["warrior", null]] },
  archer: { female: [["adventurer", "forest"], ["adventurer", "sand"]], male: [["warrior", "forest"], ["warrior", "cocoa"]] },
  priest: { female: [["priestess", null], ["priestess", null]], male: [["warrior", "white"], ["warrior", "navy"]] },
  // the second jobs
  wizard: { female: [["wizard_f", null], ["wizard_f", null]], male: [["wizard_m", null], ["wizard_m", null]] },
  battlemage: { female: [["battlemage_f", null], ["battlemage_f", null]], male: [["warrior", "sky"], ["warrior", "wine"]] },
  bishop: { female: [["bishop_f", null], ["bishop_f", null]], male: [["bishop_m", null], ["bishop_m", null]] },
  ranger: { female: [["ranger_f", null], ["ranger_f", null]], male: [["ranger_m", null], ["ranger_m", null]] },
  swordsman: { female: [["swordsman_f", null], ["swordsman_f", null]], male: [["swordsman_m", null], ["swordsman_m", null]] },
  warlord: { female: [["adventurer", "crimson"], ["adventurer", "black"]], male: [["warlord_m", null], ["warlord_m", null]] },
  thief: { female: [["thief_f", null], ["thief_f", null]], male: [["thief_m", null], ["thief_m", null]] },
  jester: { female: [["jester_f", null], ["jester_f", null]], male: [["jester_m", null], ["jester_m", null]] },
  mercenary: { female: [["adventurer", "ochre"], ["adventurer", "wine"]], male: [["warrior", "ochre"], ["warrior", "wine"]] },
  inventor: { female: [["adventurer", "cocoa"], ["adventurer", "ochre"]], male: [["warrior", "cocoa"], ["warrior", "ochre"]] },
  merchant: { female: [["adventurer", "ochre"], ["adventurer", "cocoa"]], male: [["warrior", "ochre"], ["warrior", "cocoa"]] },
  // the third jobs
  knight: { female: [["knight_f", null], ["knight_f", null]], male: [["knight_m", null], ["knight_m", null]] },
  hunter: { female: [["adventurer", "forest"], ["adventurer", "cocoa"]], male: [["warrior", "forest"], ["warrior", "black"]] },
  archmage: { female: [["mage", "navy"], ["mage", "black"]], male: [["warrior", "navy"], ["warrior", "plum"]] },
  assassin: { female: [["adventurer", "black"], ["adventurer", "black"]], male: [["warrior", "black"], ["warrior", "black"]] },
  high_bishop: { female: [["priestess", "white"], ["priestess", "ochre"]], male: [["warrior", "white"], ["warrior", "ochre"]] },
  monk: { female: [["priestess", "ochre"], ["priestess", "wine"]], male: [["warrior", "ochre"], ["warrior", "cocoa"]] },
  spellblade: { female: [["mage", "black"], ["mage", "wine"]], male: [["warrior", "black"], ["warrior", "wine"]] },
  sculptor: { female: [["adventurer", "sand"], ["adventurer", "cocoa"]], male: [["warrior", "sand"], ["warrior", "cocoa"]] },
  magician: { female: [["mage", "crimson"], ["mage", "black"]], male: [["warrior", "crimson"], ["warrior", "white"]] },
  historian: { female: [["priestess", "forest"], ["priestess", "cocoa"]], male: [["warrior", "forest"], ["warrior", "sand"]] },
  shinobi: { female: [["adventurer", "navy"], ["adventurer", "black"]], male: [["warrior", "navy"], ["warrior", "black"]] },
};

// The job whose outfit a character wears. A fourth job has none yet (docs/v05_jobs.md 7): it
// wears its third job's.
export function outfitRole(p: { cls: ClassId | null; job: JobId | null; job3?: Job3Id | null }): keyof typeof OUTFITS {
  return p.job3 ?? p.job ?? p.cls ?? "none";
}

// The top and bottom of that outfit for a build, as "@shape/dye" (src/look.ts reads them).
export function outfit(gender: Gender, role: keyof typeof OUTFITS): { top: string; bottom: string } {
  const [top, bottom] = (OUTFITS[role] ?? OUTFITS.none)[gender];
  const spec = ([shape, dye]: Piece) => `@${shape}/${dye ?? ""}`;
  return { top: spec(top), bottom: spec(bottom) };
}

// What a character shows: its gear in the hands, its job's outfit for the clothes.
export function dressed(equipped: Equipped, gender: Gender, p: Parameters<typeof outfitRole>[0]): Equipped {
  return { ...equipped, ...outfit(gender, outfitRole(p)) };
}

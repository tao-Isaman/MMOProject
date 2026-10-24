// What a character wears on the outside: the outfit of the job it has now (its third job, else its
// second, else its class; plain brown clothes before it picks a class), not its armour. Worn
// tops and bottoms only add their stats; how the character looks follows the job, the way a
// Ragnarok job changes its sprite.
//
// Until each job has a body of its own from Oriverse, a job's outfit is one of the bodies there
// are (src/items.ts SHAPES) in that job's colours: a female character the mage coat, the
// priestess robe or the adventurer vest, a male one the warrior jacket. A job line keeps its
// class's shape and moves on in colour (the wizard a violet coat, the archmage a midnight one).
//
// The look code (src/look.ts) reads a slot holding "@shape/dye" as that garment itself, so an
// outfit goes in place of the worn top and bottom without being an item anybody can hold.

import type { ClassId, JobId, Job3Id } from "./progression";
import type { Gender } from "./items";
import type { Equipped } from "./inventory";

type Piece = [shape: string, dye: string | null];
interface Outfit {
  female: [top: Piece, bottom: Piece];
  male: [top: string | null, bottom: string | null]; // the warrior jacket's and trousers' dyes
}

const OUTFITS: Record<"none" | ClassId | JobId | Job3Id, Outfit> = {
  none: { female: [["plain", null], ["plain", null]], male: [null, null] }, // (male: plain_m, below)
  // the classes
  mage: { female: [["mage", null], ["mage", null]], male: ["lilac", "black"] },
  warrior: { female: [["adventurer", null], ["adventurer", "cocoa"]], male: [null, null] },
  archer: { female: [["adventurer", "forest"], ["adventurer", "sand"]], male: ["forest", "cocoa"] },
  priest: { female: [["priestess", null], ["priestess", null]], male: ["white", "navy"] },
  // the second jobs
  wizard: { female: [["mage", "lilac"], ["mage", "navy"]], male: ["plum", "black"] },
  battlemage: { female: [["mage", "sky"], ["mage", "wine"]], male: ["sky", "wine"] },
  bishop: { female: [["priestess", "white"], ["priestess", "white"]], male: ["white", "white"] },
  ranger: { female: [["adventurer", "teal"], ["adventurer", "cocoa"]], male: ["teal", "cocoa"] },
  swordsman: { female: [["adventurer", "navy"], ["adventurer", "sand"]], male: ["navy", "sand"] },
  warlord: { female: [["adventurer", "crimson"], ["adventurer", "black"]], male: ["crimson", "black"] },
  thief: { female: [["adventurer", "plum"], ["adventurer", "black"]], male: ["plum", "black"] },
  jester: { female: [["mage", "rose"], ["mage", "plum"]], male: ["rose", "plum"] },
  mercenary: { female: [["adventurer", "ochre"], ["adventurer", "wine"]], male: ["ochre", "wine"] },
  inventor: { female: [["adventurer", "cocoa"], ["adventurer", "ochre"]], male: ["cocoa", "ochre"] },
  // the third jobs
  knight: { female: [["adventurer", "white"], ["adventurer", "navy"]], male: ["white", "navy"] },
  hunter: { female: [["adventurer", "forest"], ["adventurer", "cocoa"]], male: ["forest", "black"] },
  archmage: { female: [["mage", "navy"], ["mage", "black"]], male: ["navy", "plum"] },
  assassin: { female: [["adventurer", "black"], ["adventurer", "black"]], male: ["black", "black"] },
  high_bishop: { female: [["priestess", "white"], ["priestess", "ochre"]], male: ["white", "ochre"] },
  monk: { female: [["priestess", "ochre"], ["priestess", "wine"]], male: ["ochre", "cocoa"] },
  spellblade: { female: [["mage", "black"], ["mage", "wine"]], male: ["black", "wine"] },
  sculptor: { female: [["adventurer", "sand"], ["adventurer", "cocoa"]], male: ["sand", "cocoa"] },
  magician: { female: [["mage", "crimson"], ["mage", "black"]], male: ["crimson", "white"] },
  historian: { female: [["priestess", "forest"], ["priestess", "cocoa"]], male: ["forest", "sand"] },
  shinobi: { female: [["adventurer", "navy"], ["adventurer", "black"]], male: ["navy", "black"] },
};

// The job whose outfit a character wears.
export function outfitRole(p: { cls: ClassId | null; job: JobId | null; job3?: Job3Id | null }): keyof typeof OUTFITS {
  return p.job3 ?? p.job ?? p.cls ?? "none";
}

// The top and bottom of that outfit for a build, as "@shape/dye" (src/look.ts reads them).
export function outfit(gender: Gender, role: keyof typeof OUTFITS): { top: string; bottom: string } {
  const o = OUTFITS[role] ?? OUTFITS.none;
  const spec = ([shape, dye]: Piece) => `@${shape}/${dye ?? ""}`;
  if (gender === "female") return { top: spec(o.female[0]), bottom: spec(o.female[1]) };
  if (role === "none") return { top: spec(["plain_m", null]), bottom: spec(["plain_m", null]) };
  return { top: spec(["warrior", o.male[0]]), bottom: spec(["warrior", o.male[1]]) };
}

// What a character shows: its gear in the hands, its job's outfit for the clothes.
export function dressed(equipped: Equipped, gender: Gender, p: Parameters<typeof outfitRole>[0]): Equipped {
  return { ...equipped, ...outfit(gender, outfitRole(p)) };
}

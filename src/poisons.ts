// Poison vials: made from materials by a skill (SkillDef.make, the assassin's poisoner) and used
// from the bag to coat the weapon. A coating is an enchant buff (hero.ts): the weapon hits in the
// poison element for a while (normal attacks, and physical skills without an element of their
// own) with the vial's stats on top, so a normal hit may poison (poisonHit) even without the
// poison element learned. A new coating, or any other enchant, replaces the one on the weapon.
//
// The vials join ITEMS here (like the books in progression.ts); they are "potion" items so the
// bag uses them, but they restore nothing, and main.ts coats with them instead.

import { ITEMS } from "./items";
import type { ElementId, StatBag } from "./progression";

export interface Coating {
  element: ElementId;
  time: number;     // s it lasts (longer with buffTime)
  stats: StatBag;   // while it lasts
}

export const COATINGS: Record<string, Coating> = {
  poison_vial: { element: "poison", time: 60, stats: { poisonHit: 0.2, poisonAtk: 12 } },
  poison_vial_strong: { element: "poison", time: 90, stats: { poisonHit: 0.3, poisonAtk: 30, poisonPct: 0.15 } },
};

Object.assign(ITEMS, {
  poison_vial: {
    kind: "potion", name: "ขวดยาพิษ", stack: 50, sell: 25, icon: { glyph: "drop", color: "#8fdc4a", art: "poison_vial" },
    note: "ใช้แล้วเคลือบอาวุธด้วยพิษ 60 วิ: อาวุธตีเป็นธาตุพิษ ตีปกติมีโอกาส 20% ติดพิษ พลังโจมตีธาตุพิษ +12",
  },
  poison_vial_strong: {
    kind: "potion", name: "ขวดยาพิษเข้มข้น", stack: 50, sell: 60, icon: { glyph: "drop", color: "#5fb82e", art: "poison_vial_strong" },
    note: "ใช้แล้วเคลือบอาวุธด้วยพิษร้าย 90 วิ: อาวุธตีเป็นธาตุพิษ ตีปกติมีโอกาส 30% ติดพิษ พลังโจมตีธาตุพิษ +30 พิษแรงขึ้น 15%",
  },
});

// พระราชวังหลวง (palace): a placeholder until the real palace is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import { travelGuide, TOWN_SCALE } from "./town";
import type { Town } from "./town";

export function buildPalace(_quality: { flowers: number }): Town {
  const t = placeholderField(500, [{ to: "old_royal_mine", side: "n" }, { to: "royal_road", side: "s" }, { to: "royal_hunt", side: "e" }]);
  const k = TOWN_SCALE;
  return {
    ...t,
    spots: undefined,
    npcs: [
      { ...travelGuide("palace", [0, 0], 0), x: 300 * k, y: 0 },
    ],
  };
}

// ไฮแลนด์ ฮิล (highland): a placeholder until the real town is built (docs/west_lands.md).

import { placeholderField } from "./field";
import { travelGuide, TOWN_SCALE } from "./town";
import type { Town } from "./town";

export function buildHighland(_quality: { flowers: number }): Town {
  const t = placeholderField(403, [{ to: "frozen_river", side: "s" }, { to: "north_cliffs", side: "n" }, { to: "highland_downs", side: "w" }, { to: "tangled_hills", side: "e" }]);
  const k = TOWN_SCALE;
  return {
    ...t,
    spots: undefined,
    npcs: [
      { ...travelGuide("highland", [0, 0], 0), x: 300 * k, y: 0 },
    ],
  };
}

// โนอา (noa): a placeholder until the real town is built (docs/west_lands.md).

import { placeholderField } from "./field";
import { travelGuide, TOWN_SCALE } from "./town";
import type { Town } from "./town";

export function buildNoa(_quality: { flowers: number }): Town {
  const t = placeholderField(401, [{ to: "noa_meadow", side: "e", shift: 1800 }, { to: "west_woods", side: "e", shift: -1800 }, { to: "frozen_river", side: "n" }, { to: "elder_forest", side: "w" }, { to: "noa_plains", side: "s" }]);
  const k = TOWN_SCALE;
  return {
    ...t,
    spots: undefined,
    npcs: [
      { ...travelGuide("noa", [0, 0], 0), x: 300 * k, y: 0 },
    ],
  };
}

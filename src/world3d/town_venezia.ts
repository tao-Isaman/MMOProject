// เวนิชเซีย (venezia): a placeholder until the real town is built (docs/west_lands.md).

import { placeholderField } from "./field";
import { travelGuide, TOWN_SCALE } from "./town";
import type { Town } from "./town";

export function buildVenezia(_quality: { flowers: number }): Town {
  const t = placeholderField(404, [{ to: "noa_plains", side: "n" }, { to: "dry_plains", side: "e", shift: 1800 }, { to: "ancient_plain", side: "e", shift: -1800 }]);
  const k = TOWN_SCALE;
  return {
    ...t,
    spots: undefined,
    npcs: [
      { ...travelGuide("venezia", [0, 0], 0), x: 300 * k, y: 0 },
      { id: "venezia_captain", x: -300 * k, y: 300 * k, face: 0, name: "กัปตันเรือ", title: "เรือโดยสาร", role: "travel", ports: ["eden", "yodia", "suzhou"], lines: ["ขึ้นเรือไหม"] },
    ],
  };
}

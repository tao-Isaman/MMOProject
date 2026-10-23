// ซูโจว (suzhou): a placeholder until the real town is built (docs/west_lands.md).

import { placeholderField } from "./field";
import { travelGuide, TOWN_SCALE } from "./town";
import type { Town } from "./town";

export function buildSuzhou(_quality: { flowers: number }): Town {
  const t = placeholderField(402, [{ to: "west_cape", side: "w" }, { to: "west_pass", side: "n" }, { to: "rice_terraces", side: "s" }]);
  const k = TOWN_SCALE;
  return {
    ...t,
    spots: undefined,
    npcs: [
      { ...travelGuide("suzhou", [0, 0], 0), x: 300 * k, y: 0 },
      { id: "suzhou_captain", x: -300 * k, y: 300 * k, face: 0, name: "กัปตันเรือ", title: "เรือโดยสาร", role: "travel", ports: ["eden", "venezia"], lines: ["ขึ้นเรือไหม"] },
    ],
  };
}

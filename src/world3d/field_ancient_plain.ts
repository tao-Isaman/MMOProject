// ที่ราบโบราณ (ancient_plain): a placeholder until the real field is built (docs/west_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(308, [{ to: "venezia", side: "w" }, { to: "royal_necropolis", side: "e" }]);
}

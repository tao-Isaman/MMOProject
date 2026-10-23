// สุสานหลวงโบราณ (royal_necropolis): a placeholder until the real field is built (docs/west_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(313, [{ to: "ancient_plain", side: "w" }, { to: "south_jungle", side: "e" }]);
}

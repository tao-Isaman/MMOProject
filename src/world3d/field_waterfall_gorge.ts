// หุบผาน้ำตก (waterfall_gorge): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(519, [{ to: "great_desert", side: "n" }, { to: "mangrove_coast", side: "s" }, { to: "south_jungle", side: "w" }]);
}

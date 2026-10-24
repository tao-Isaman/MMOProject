// ทุ่งหินลอย (floating_rocks): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(528, [{ to: "storm_cape", side: "n" }, { to: "border_line", side: "s" }, { to: "thornland", side: "e" }, { to: "stone_plain", side: "w" }]);
}

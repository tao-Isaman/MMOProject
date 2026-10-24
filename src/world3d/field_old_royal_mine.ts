// เหมืองหลวงเก่า (old_royal_mine): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(505, [{ to: "palace", side: "s" }, { to: "royal_peaks", side: "e" }, { to: "ice_pass", side: "w" }]);
}

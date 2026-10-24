// สันเขาหลวง (royal_peaks): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(506, [{ to: "dragon_summit", side: "e" }, { to: "old_royal_mine", side: "w" }]);
}

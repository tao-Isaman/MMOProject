// ที่ราบสูงลมแรง (windswept_heights): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(526, [{ to: "stone_plain", side: "s" }, { to: "storm_cape", side: "e" }, { to: "horse_meadow", side: "w" }]);
}

// ป่าต้นไม้แรก (first_tree): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(521, [{ to: "royal_necropolis", side: "e" }]);
}

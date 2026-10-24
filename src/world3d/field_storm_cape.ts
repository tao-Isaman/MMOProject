// แหลมพายุ (storm_cape): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(527, [{ to: "floating_rocks", side: "s" }, { to: "windswept_heights", side: "w" }]);
}

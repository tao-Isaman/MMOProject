// ป่าโบราณ (elder_forest): a placeholder until the real field is built (docs/west_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(304, [{ to: "noa", side: "e" }, { to: "west_pass", side: "w" }]);
}

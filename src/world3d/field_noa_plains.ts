// ที่ราบใต้โนอา (noa_plains): a placeholder until the real field is built (docs/west_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(302, [{ to: "noa", side: "n" }, { to: "venezia", side: "s" }, { to: "lagoon_marsh", side: "w" }]);
}

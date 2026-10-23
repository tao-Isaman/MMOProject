// นาขั้นบันได (rice_terraces): a placeholder until the real field is built (docs/west_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(305, [{ to: "suzhou", side: "n" }, { to: "lagoon_marsh", side: "e" }]);
}

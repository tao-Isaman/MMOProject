// บึงลากูน (lagoon_marsh): a placeholder until the real field is built (docs/west_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(312, [{ to: "rice_terraces", side: "w" }, { to: "noa_plains", side: "e" }]);
}

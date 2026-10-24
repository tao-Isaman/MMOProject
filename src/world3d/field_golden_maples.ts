// ป่าเมเปิลทอง (golden_maples): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(524, [{ to: "caravan_road", side: "n" }, { to: "border_woods", side: "e" }]);
}

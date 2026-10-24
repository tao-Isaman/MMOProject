// ทุ่งกังหันลม (windmill_fields): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(502, [{ to: "south_savanna", side: "e" }, { to: "lavender_hills", side: "w" }]);
}

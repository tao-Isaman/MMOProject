// ทุ่งดอกไม้หลวง (flower_fields): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(501, [{ to: "snow_foothills", side: "n" }, { to: "royal_road", side: "e" }, { to: "noa_meadow", side: "w" }]);
}

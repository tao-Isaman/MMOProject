// ทุ่งลาเวนเดอร์ (lavender_hills): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(516, [{ to: "west_woods", side: "n" }, { to: "venezia", side: "s" }, { to: "windmill_fields", side: "e" }, { to: "noa_plains", side: "w" }]);
}

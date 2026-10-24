// ทุ่งผาริมทะเลใน (inner_sea_cliffs): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(522, [{ to: "west_steppe", side: "n" }, { to: "caravan_road", side: "e" }]);
}

// ทุ่งแสงเหนือ (aurora_field): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(510, [{ to: "north_icefield", side: "w" }]);
}

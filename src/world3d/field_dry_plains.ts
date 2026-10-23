// ที่ราบแห้งแล้ง (dry_plains): a placeholder until the real field is built (docs/west_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(303, [{ to: "venezia", side: "w" }, { to: "bahamas", side: "e" }]);
}

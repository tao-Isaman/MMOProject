// ทะเลทรายแก้ว (glass_desert): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(518, [{ to: "great_desert", side: "w" }]);
}

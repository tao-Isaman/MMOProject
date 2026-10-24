// ทุ่งหนามอสูร (thornland): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(529, [{ to: "demon_land", side: "s" }, { to: "floating_rocks", side: "w" }]);
}

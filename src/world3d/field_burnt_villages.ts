// หมู่บ้านร้างชายแดน (burnt_villages): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(530, [{ to: "border_line", side: "n" }, { to: "demon_camp", side: "e" }, { to: "border_woods", side: "w" }]);
}

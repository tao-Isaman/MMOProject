// ค่ายทัพอสูร (demon_camp): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(531, [{ to: "demon_land", side: "n" }, { to: "burnt_villages", side: "w" }]);
}

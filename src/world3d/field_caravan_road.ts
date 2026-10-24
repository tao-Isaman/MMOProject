// ถนนคาราวานตะวันออก (caravan_road): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(523, [{ to: "trunrada", side: "n" }, { to: "golden_maples", side: "s" }, { to: "kradia", side: "e" }, { to: "inner_sea_cliffs", side: "w" }]);
}

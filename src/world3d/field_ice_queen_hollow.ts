// หุบวังน้ำแข็ง (ice_queen_hollow): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(509, [{ to: "west_glacier", side: "s" }]);
}

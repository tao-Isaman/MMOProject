// หุบหินร้องเพลง (humming_stones): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(512, [{ to: "highland_downs", side: "s" }, { to: "north_cliffs", side: "e" }]);
}

// สันเขาเขี้ยวน้ำแข็ง (frostfang_ridge): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(511, [{ to: "tangled_hills", side: "s" }, { to: "north_cliffs", side: "w" }]);
}

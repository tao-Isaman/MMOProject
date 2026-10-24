// ธารน้ำแข็งตะวันตก (west_glacier): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(508, [{ to: "ice_queen_hollow", side: "n" }, { to: "iceberg", side: "e" }]);
}

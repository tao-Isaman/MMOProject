// หน้าผาทะเลเหนือ (north_cliffs): a placeholder until the real field is built (docs/west_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(314, [{ to: "highland", side: "s" }]);
}

// แม่น้ำเยือกแข็ง (frozen_river): a placeholder until the real field is built (docs/west_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(309, [{ to: "noa", side: "s" }, { to: "highland", side: "n" }]);
}

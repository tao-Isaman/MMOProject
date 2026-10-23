// เนินเขาวงกต (tangled_hills): a placeholder until the real field is built (docs/west_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(311, [{ to: "highland", side: "w" }, { to: "snow_foothills", side: "e" }]);
}

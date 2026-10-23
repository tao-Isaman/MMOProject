// ภูผาหินปูน (karst_peaks): a placeholder until the real field is built (docs/west_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(307, [{ to: "highland_downs", side: "n" }, { to: "west_pass", side: "s" }]);
}

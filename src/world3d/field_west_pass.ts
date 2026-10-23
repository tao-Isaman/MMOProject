// ช่องเขาตะวันตก (west_pass): a placeholder until the real field is built (docs/west_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(310, [{ to: "elder_forest", side: "e" }, { to: "suzhou", side: "s" }, { to: "karst_peaks", side: "n" }]);
}

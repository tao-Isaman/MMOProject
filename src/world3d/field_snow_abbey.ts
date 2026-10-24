// ผาอารามหิมะ (snow_abbey): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(513, [{ to: "primeval_forest", side: "s" }, { to: "highland_downs", side: "e" }]);
}

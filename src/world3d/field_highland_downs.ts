// ที่ราบเนินเขา (highland_downs): a placeholder until the real field is built (docs/west_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(306, [{ to: "highland", side: "e" }, { to: "karst_peaks", side: "s" }]);
}

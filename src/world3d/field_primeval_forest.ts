// ป่าดึกดำบรรพ์ (primeval_forest): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(514, [{ to: "snow_abbey", side: "n" }, { to: "west_pass", side: "s" }, { to: "karst_peaks", side: "e" }]);
}

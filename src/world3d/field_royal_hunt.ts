// ป่าล่าสัตว์หลวง (royal_hunt): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(503, [{ to: "pine_river", side: "s" }, { to: "frozen_falls", side: "e" }, { to: "palace", side: "w" }]);
}

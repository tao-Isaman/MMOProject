// ป่าไทรศักดิ์สิทธิ์ (sacred_banyan): a placeholder until the real field is built (docs/v04_lands.md).

import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(520, [{ to: "royal_necropolis", side: "n" }, { to: "yodia", side: "e" }]);
}

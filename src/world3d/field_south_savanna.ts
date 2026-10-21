// A placeholder until this field is built (src/world3d/field.ts).
import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(112, [{ to: "eden", side: "n" }, { to: "desert_edge", side: "s" }]);
}

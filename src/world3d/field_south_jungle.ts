// A placeholder until this field is built (src/world3d/field.ts).
import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(115, [{ to: "bahamas", side: "n" }, { to: "yodia", side: "s" }]);
}

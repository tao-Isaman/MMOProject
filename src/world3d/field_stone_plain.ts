// A placeholder until this field is built (src/world3d/field.ts).
import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(108, [{ to: "trunrada", side: "w" }, { to: "kradia", side: "s" }]);
}

// A placeholder until this field is built (src/world3d/field.ts).
import { placeholderField } from "./field";
import type { Town } from "./town";

export function build(_quality: { flowers: number }): Town {
  return placeholderField(103, [{ to: "snow_foothills", side: "s" }, { to: "iceberg", side: "n" }]);
}

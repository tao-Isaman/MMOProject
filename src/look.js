// Character colours: hair, eyes (wardrobe) and coat, skirt (equipped clothes).
//
// Every sheet of the Oriverse sprite is recoloured by colour region. The regions are told
// apart by hue, saturation and lightness (thresholds measured on the generated sprite by
// tools/palette_regions.py and stored in assets/palette_regions.json).

import { mapColors, rgbToHsl, dyePixel } from "./recolor.js";
import { DYES, ITEMS } from "./items.js";
import { HAIR_COLORS, EYE_COLORS } from "./ui.js";

// regions: { name: { h: [min, max], s: [min, max], l: [min, max] } }, hue ranges may wrap.
function inRange(v, [a, b]) {
  return a <= b ? v >= a && v <= b : v >= a || v <= b;
}

export function classify(regions, r, g, b) {
  const [h, s, l] = rgbToHsl(r, g, b);
  for (const [name, q] of Object.entries(regions)) {
    if (inRange(h, q.h) && s >= q.s[0] && s <= q.s[1] && l >= q.l[0] && l <= q.l[1]) return name;
  }
  return null;
}

// Recolour the base sheets for a look and the equipped clothes; returns new canvases (the
// base images are returned untouched when nothing changes).
export function buildLook(base, regions, look, equipped) {
  const hair = HAIR_COLORS.find((c) => c.id === look.hairColor);
  const eyes = EYE_COLORS.find((c) => c.id === look.eyes);
  const top = DYES[ITEMS[equipped.top]?.dye];
  const bottom = DYES[ITEMS[equipped.bottom]?.dye];
  const dyes = { hair, eyes, coat: top, skirt: bottom };
  if (Object.values(dyes).every((d) => !d || d.hue === null || d.hue === undefined)) return { ...base };
  const fn = (r, g, b) => {
    const region = classify(regions, r, g, b);
    return region ? dyePixel(r, g, b, dyes[region]) : null;
  };
  const out = {};
  for (const [clip, img] of Object.entries(base)) out[clip] = mapColors(img, fn);
  return out;
}

export function lookKey(look, equipped) {
  return [look.hairColor, look.eyes, equipped.top, equipped.bottom].join("|");
}

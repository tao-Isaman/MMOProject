// Character looks: body, hairstyle and colours.
//
// Every body is its own Oriverse sprite (assets/chars/<body>_<clip>.png, described in
// assets/chars/bodies.json). The mage and the warrior keep the hair they were generated with.
// The costume bodies were generated with short hair, which tools/char_layers.py erased frame by
// frame; a hairstyle head layer (assets/chars/hair_<id>.png: back layer in column 0, front
// layer in column 1) is drawn back onto every frame at the head offset tracked for it.
//
// Colours are moved region by region (hue, saturation and lightness thresholds per body in
// bodies.json; hair and eyes for head layers in hair.json), so the hair dye never reaches a
// body and cloth dyes never reach the hair.

import { mapColors, rgbToHsl, hslToRgb } from "./recolor.js";
import { COSTUMES, DYES, ITEMS } from "./items.js";
import { HAIR_COLORS, EYE_COLORS } from "./ui.js";
import { loadImage } from "./assets.js";

export const CLIPS = ["idle", "walk", "swing", "thrust", "shoot", "cast"];
const CELL = 96;

// regions: { name: { h: [min, max], s: [min, max], l: [min, max] } }, hue ranges may wrap.
function inRange(v, [a, b]) {
  return a <= b ? v >= a && v <= b : v >= a || v <= b;
}

// Every region a colour falls in, in the order they are listed.
function matches(regions, r, g, b) {
  const [h, s, l] = rgbToHsl(r, g, b);
  return Object.keys(regions).filter((name) => {
    const q = regions[name];
    return inRange(h, q.h) && s >= q.s[0] && s <= q.s[1] && l >= q.l[0] && l <= q.l[1];
  });
}

export function classify(regions, r, g, b) {
  return matches(regions, r, g, b)[0] ?? null;
}

const clamp01 = (v) => Math.max(0.02, Math.min(0.98, v));

// Wardrobe colours shift lightness by `light`; cloth dyes move the region's average lightness
// (mean) to the dye's target. Either way the pixel keeps its shading.
function paint(r, g, b, dye, mean) {
  const [, , l] = rgbToHsl(r, g, b);
  const nl = dye.target !== undefined ? l - mean + dye.target : l + (dye.light || 0);
  return hslToRgb(dye.hue, dye.sat, clamp01(nl));
}

// Recolour images by region: dyes { region: dye }, means { region: average lightness }.
// A region with side "above" or "below" only counts on that side of the neck (the warrior's
// hair and jacket share their reds); split = { neck, offsets } follows the head per frame.
function recolor(images, regions, dyes, means = {}, split = null) {
  const live = Object.entries(dyes).filter(([, d]) => d && d.hue !== null && d.hue !== undefined);
  if (!live.length) return images;
  const use = Object.fromEntries(live);
  const fn = (r, g, b) => {
    const region = classify(regions, r, g, b);
    return region && use[region] ? paint(r, g, b, use[region], means[region] ?? 0.5) : null;
  };
  const sided = split && live.some(([name]) => regions[name]?.side);
  const out = {};
  for (const [k, img] of Object.entries(images)) out[k] = sided ? recolorSided(img, k, regions, use, means, split) : mapColors(img, fn);
  return out;
}

function recolorSided(img, clip, regions, use, means, split) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, c.width, c.height);
  const px = data.data;
  const regionsOf = new Map();
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const key = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
    let found = regionsOf.get(key);
    if (found === undefined) {
      found = matches(regions, px[i], px[i + 1], px[i + 2]);
      regionsOf.set(key, found);
    }
    if (!found.length) continue;
    const p = i / 4, x = p % c.width, y = Math.floor(p / c.width);
    const dy = split.offsets?.[clip]?.[Math.floor(y / CELL)]?.[Math.floor(x / CELL)]?.[1] ?? 0;
    const below = y % CELL >= split.neck + dy;
    const region = found.find((name) => !regions[name].side || (regions[name].side === "below") === below);
    if (!region || !use[region]) continue;
    const [r, gg, b] = paint(px[i], px[i + 1], px[i + 2], use[region], means[region] ?? 0.5);
    px[i] = r;
    px[i + 1] = gg;
    px[i + 2] = b;
  }
  g.putImageData(data, 0, 0);
  return c;
}

export class Looks {
  // data: { bodies, hair } from assets/chars/*.json
  constructor(data) {
    this.bodies = data.bodies;
    this.hair = data.hair;
    this.sheets = new Map(); // body -> Promise<{ clip: image }>
    this.heads = new Map();  // hairstyle -> Promise<image>
  }

  // Hairstyles that have a head layer.
  get hairstyles() {
    return new Set(Object.keys(this.hair.styles));
  }

  // Which body and hairstyle a look and costume end up using.
  resolve(look, equipped) {
    const costume = COSTUMES[ITEMS[equipped.costume]?.costume] ?? COSTUMES.mage;
    // a body is used once all its clips are in (bodies.json lists them)
    const want = look.gender === "male" ? "warrior" : costume.body;
    const body = this.bodies[want]?.clips?.length === CLIPS.length ? want : "mage";
    const def = this.bodies[body];
    // a costume body has no hair of its own: fall back to the first hairstyle that is ready
    const hair = !def.hairless ? null : this.hair.styles[look.hair] ? look.hair : Object.keys(this.hair.styles)[0] ?? null;
    return { body, def, hair, costume };
  }

  note(look, equipped) {
    const { body, hair, costume } = this.resolve(look, equipped);
    if (body === "warrior") return "ตัวละครชายใช้ทรงผมของตัวเอง ชุดเปลี่ยนแค่สี ส่วนเสื้อกับกางเกงย้อมสีได้";
    if (body === "mage" && look.hair !== "twintail") return `${costume.name}มาพร้อมผมทวินเทล ทรงผมที่เลือกจะใช้กับชุดอื่น`;
    if (hair && hair !== look.hair) return "ทรงผมนี้ยังใส่กับชุดนี้ไม่ได้";
    return "ชุด เสื้อ และกางเกงเปลี่ยนได้จากไอเท็มในกระเป๋า (ปุ่ม I)";
  }

  key(look, equipped) {
    const r = this.resolve(look, equipped);
    return [r.body, r.hair, look.hairColor, look.eyes, equipped.costume, equipped.top, equipped.bottom].join("|");
  }

  loadBody(body, clips = CLIPS) {
    const id = `${body}:${clips.join(",")}`;
    if (!this.sheets.has(id)) {
      this.sheets.set(id, Promise.all(clips.map((c) => loadImage(`assets/chars/${body}_${c}.png`)))
        .then((imgs) => Object.fromEntries(clips.map((c, i) => [c, imgs[i]]))));
    }
    return this.sheets.get(id);
  }

  loadHead(style) {
    if (!this.heads.has(style)) this.heads.set(style, loadImage(`assets/chars/hair_${style}.png`));
    return this.heads.get(style);
  }

  // Build the sheets for a look: { sheets, hands, builtin } (hands: weapon hand anchors per
  // clip; builtin: clips that already show the weapon).
  async build(look, equipped, clips = CLIPS) {
    const { body, def, hair, costume } = this.resolve(look, equipped);
    const base = await this.loadBody(body, clips);
    const hairDye = HAIR_COLORS.find((c) => c.id === look.hairColor);
    const eyeDye = EYE_COLORS.find((c) => c.id === look.eyes);
    const cloth = (slot) => {
      const worn = DYES[ITEMS[equipped[slot]]?.dye];
      const dye = worn ?? DYES[costume[slot]];
      const region = def.cloth[slot];
      // a body's own colour for this region needs no work
      return dye && def.natural?.[region] !== (worn ? ITEMS[equipped[slot]].dye : costume[slot]) ? [region, dye] : null;
    };
    const dyes = Object.fromEntries([cloth("top"), cloth("bottom")].filter(Boolean));
    if (!def.hairless) Object.assign(dyes, { hair: hairDye, eyes: eyeDye });
    let sheets = recolor(base, def.regions, dyes, def.mean, def.split && { neck: def.split, offsets: def.head?.offsets });
    if (hair) {
      const head = recolor({ head: await this.loadHead(hair) }, this.hair.regions, { hair: hairDye, eyes: eyeDye }).head;
      sheets = this.attachHead(sheets, def, head, this.hair.styles[hair]);
    }
    return { sheets, hands: def.hands, builtin: def.builtin ?? {} };
  }

  // Draw the head layer onto every frame: back column under the body, front column over it.
  attachHead(sheets, def, head, style) {
    const out = {};
    for (const [clip, sheet] of Object.entries(sheets)) {
      const c = document.createElement("canvas");
      c.width = sheet.width;
      c.height = sheet.height;
      const g = c.getContext("2d");
      const frames = sheet.width / CELL;
      for (let d = 0; d < 8; d++) {
        const [ax, ay] = def.head.anchor[d];
        const [hx, hy] = style.anchor[d];
        for (let f = 0; f < frames; f++) {
          const [dx, dy] = def.head.offsets[clip]?.[d]?.[f] ?? [0, 0];
          const x = f * CELL, y = d * CELL;
          const px = x + ax + dx - hx, py = y + ay + dy - hy;
          g.save();
          g.beginPath();
          g.rect(x, y, CELL, CELL);
          g.clip();
          g.drawImage(head, 0, d * CELL, CELL, CELL, px, py, CELL, CELL);
          g.drawImage(sheet, x, y, CELL, CELL, x, y, CELL, CELL);
          g.drawImage(head, CELL, d * CELL, CELL, CELL, px, py, CELL, CELL);
          g.restore();
        }
      }
      out[clip] = c;
    }
    return out;
  }
}

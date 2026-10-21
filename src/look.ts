// Character looks: top, bottom, hairstyle and colours.
//
// Every body is its own Oriverse sprite (assets/chars/<body>_<clip>.png, described in
// assets/chars/bodies.json). A top is the upper half of one body (head to waist, with the
// arms), a bottom the lower half of another; frame by frame the bottom is drawn from its waist
// down and the top above it, moved so the two waists meet (bodies.json `waist`, following the
// body's bob through the head offsets). Bodies marked hairless were generated with short hair,
// which tools/char_layers.py erased frame by frame; a hairstyle head layer
// (assets/chars/hair_<id>.png: back layer in column 0, front layer in column 1) is drawn back
// onto every frame at the top body's head offset. Other bodies keep the hair they came with.
//
// Colours are moved region by region (hue, saturation and lightness thresholds per body in
// bodies.json; hair and eyes for head layers in hair.json), so the hair dye never reaches a
// body and cloth dyes never reach the hair.

import { mapColors, rgbToHsl, hslToRgb } from "./recolor";
import type { Dye, RGB } from "./recolor";
import { DYES, ITEMS, SHAPES, DEFAULT_SHAPE } from "./items";
import { HAIR_COLORS, EYE_COLORS } from "./ui";
import type { Look } from "./ui";
import type { Equipped } from "./inventory";
import { loadImage } from "./assets";
import type { Img } from "./types";

export const CLIPS = ["idle", "walk", "swing", "thrust", "shoot", "cast"];
const CELL = 96;

type Range = [number, number];
// A colour region: hue, saturation and lightness ranges (hue ranges may wrap past 360), and
// optionally which side of the neck it belongs to.
export interface Region {
  h: Range;
  s: Range;
  l: Range;
  side?: "above" | "below";
}
type Regions = Record<string, Region>;
type Sheets = Record<string, Img>;
type Offsets = Record<string, [number, number][][]>; // clip -> direction -> frame -> [dx, dy]

// Hand positions per clip, direction and frame (tools/hand_anchors.py).
export interface HandAnchor {
  r: [number, number] | null;
  l: [number, number] | null;
  c: [number, number];
}
export type Hands = Record<string, HandAnchor[][]>;

// One body in bodies.json.
export interface BodyDef {
  name: string;
  clips?: string[];
  hairless: boolean;
  regions: Regions;
  cloth: { top: string; bottom: string };
  natural?: Record<string, string>;
  mean: Record<string, number>;
  split?: number; // neck row for regions with a side
  waist: number;  // row of the waist in the standing frame, where tops and bottoms meet
  neck?: number;  // row of the neck in the standing frame (item icons start there)
  hands?: Hands;
  builtin?: Record<string, boolean>;
  head?: { anchor: [number, number][]; offsets: Offsets };
}

export interface HairStyle {
  anchor: [number, number][];
  neck: number;
}

export interface HairData {
  regions: Regions;
  styles: Record<string, HairStyle>;
}

export interface Built {
  sheets: Sheets;
  hands?: Hands;
  builtin: Record<string, boolean>;
}

function inRange(v: number, [a, b]: Range): boolean {
  return a <= b ? v >= a && v <= b : v >= a || v <= b;
}

// Every region a colour falls in, in the order they are listed.
function matches(regions: Regions, r: number, g: number, b: number): string[] {
  const [h, s, l] = rgbToHsl(r, g, b);
  return Object.keys(regions).filter((name) => {
    const q = regions[name];
    return inRange(h, q.h) && s >= q.s[0] && s <= q.s[1] && l >= q.l[0] && l <= q.l[1];
  });
}

export function classify(regions: Regions, r: number, g: number, b: number): string | null {
  return matches(regions, r, g, b)[0] ?? null;
}

const clamp01 = (v: number) => Math.max(0.02, Math.min(0.98, v));

// Wardrobe colours shift lightness by `light`; cloth dyes move the region's average lightness
// (mean) to the dye's target. Either way the pixel keeps its shading.
function paint(r: number, g: number, b: number, dye: Dye, mean: number): RGB {
  const [, , l] = rgbToHsl(r, g, b);
  const nl = dye.target !== undefined ? l - mean + dye.target : l + (dye.light || 0);
  return hslToRgb(dye.hue ?? 0, dye.sat, clamp01(nl));
}

// Recolour images by region: dyes { region: dye }, means { region: average lightness }.
// A region with side "above" or "below" only counts on that side of the neck (the warrior's
// hair and jacket share their reds); split = { neck, offsets } follows the head per frame.
interface Split {
  neck: number;
  offsets?: Offsets;
}

function recolor(images: Sheets, regions: Regions, dyes: Record<string, Dye | undefined>, means: Record<string, number> = {}, split: Split | null = null): Sheets {
  const live = Object.entries(dyes).filter((e): e is [string, Dye] => !!e[1] && e[1].hue !== null && e[1].hue !== undefined);
  if (!live.length) return images;
  const use = Object.fromEntries(live);
  const fn = (r: number, g: number, b: number) => {
    const region = classify(regions, r, g, b);
    return region && use[region] ? paint(r, g, b, use[region], means[region] ?? 0.5) : null;
  };
  const out: Sheets = {};
  for (const [k, img] of Object.entries(images)) {
    out[k] = split && live.some(([name]) => regions[name]?.side) ? recolorSided(img, k, regions, use, means, split) : mapColors(img, fn);
  }
  return out;
}

function recolorSided(img: Img, clip: string, regions: Regions, use: Record<string, Dye>, means: Record<string, number>, split: Split): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, c.width, c.height);
  const px = data.data;
  const regionsOf = new Map<number, string[]>();
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
  bodies: Record<string, BodyDef>;
  hair: HairData;
  sheets = new Map<string, Promise<Sheets>>(); // "body:clips" -> sheets
  heads = new Map<string, Promise<Img>>();     // hairstyle -> head layer

  // data: { bodies, hair } from assets/chars/*.json
  constructor(data: { bodies: Record<string, BodyDef>; hair: HairData }) {
    this.bodies = data.bodies;
    this.hair = data.hair;
  }

  // Hairstyles that have a head layer.
  get hairstyles(): Set<string> {
    return new Set(Object.keys(this.hair.styles));
  }

  // A body is used once all its clips are in (bodies.json lists them).
  ready(body: string): boolean {
    return this.bodies[body]?.clips?.length === CLIPS.length;
  }

  // The shape a slot shows: the worn item's, or the build's default when it is empty, made
  // for the other build, or its body isn't ready yet.
  shapeFor(look: Look, equipped: Equipped, slot: "top" | "bottom"): { shape: string; dye: string | null; worn: boolean } {
    const item = ITEMS[equipped[slot] ?? ""];
    const sh = item?.shape ? SHAPES[slot][item.shape] : undefined;
    if (sh && sh.gender === look.gender && this.ready(sh.body)) return { shape: item!.shape!, dye: item!.dye ?? null, worn: true };
    const def = DEFAULT_SHAPE[look.gender as keyof typeof DEFAULT_SHAPE] ?? "mage";
    return { shape: this.ready(SHAPES[slot][def]?.body) ? def : "mage", dye: null, worn: false };
  }

  // Which bodies and hairstyle a look and its clothes end up using.
  resolve(look: Look, equipped: Equipped) {
    const top = this.shapeFor(look, equipped, "top"), bottom = this.shapeFor(look, equipped, "bottom");
    const topBody = SHAPES.top[top.shape].body, bottomBody = SHAPES.bottom[bottom.shape].body;
    const def = this.bodies[topBody];
    // a hairless top body takes the hairstyle (the first ready one if the chosen one isn't)
    const hair = !def.hairless ? null : this.hair.styles[look.hair] ? look.hair : Object.keys(this.hair.styles)[0] ?? null;
    return { top, bottom, topBody, bottomBody, def, hair };
  }

  note(look: Look, equipped: Equipped): string {
    const r = this.resolve(look, equipped);
    for (const slot of ["top", "bottom"] as const) {
      const item = ITEMS[equipped[slot] ?? ""];
      if (!item?.shape || r[slot].worn) continue;
      const sh = SHAPES[slot][item.shape];
      if (sh.gender !== look.gender) return `${item.name}สำหรับตัวละคร${sh.gender === "male" ? "ชาย" : "หญิง"} จึงใช้ทรงตั้งต้นแทน`;
      return `${sh.name}ยังรอท่าทางจาก Oriverse ให้ครบ ระหว่างนี้ใช้ทรงตั้งต้นแทน`;
    }
    if (!r.def.hairless && r.topBody === "warrior") return "ตัวละครชายใช้ทรงผมของตัวเอง ย้อมสีผมได้";
    if (!r.def.hairless && look.hair !== "twintail") return "เสื้อตัวนี้มาพร้อมผมทวินเทล ทรงผมที่เลือกจะใช้กับเสื้อตัวอื่น";
    if (r.hair && r.hair !== look.hair) return "ทรงผมนี้ยังใช้ไม่ได้";
    return "เปลี่ยนเสื้อและกางเกงได้จากไอเท็มในกระเป๋า (ปุ่ม I) ทรงไหนใส่คู่กับทรงไหนก็ได้";
  }

  key(look: Look, equipped: Equipped): string {
    const r = this.resolve(look, equipped);
    return [r.top.shape, r.top.dye, r.bottom.shape, r.bottom.dye, r.hair, look.hairColor, look.eyes].join("|");
  }

  // A garment's icon art: its half of the body's front standing frame, in its colour (null
  // while the body has no standing sheet yet).
  async garmentArt(slot: "top" | "bottom", shape: string, dyeId: string | null): Promise<HTMLCanvasElement | null> {
    const body = SHAPES[slot][shape].body, def = this.bodies[body];
    if (!def) return null;
    const idle = await this.loadBody(body, ["idle"]).catch(() => null);
    if (!idle) return null;
    const region = def.cloth[slot], dye = dyeId ? DYES[dyeId] : undefined;
    const img = recolor(idle, def.regions, dye && def.natural?.[region] !== dyeId ? { [region]: dye } : {}, def.mean).idle;
    const y0 = slot === "top" ? (def.hairless ? 0 : def.neck ?? 0) : def.waist, y1 = slot === "top" ? def.waist + 2 : CELL;
    const c = document.createElement("canvas");
    c.width = CELL;
    c.height = y1 - y0;
    c.getContext("2d")!.drawImage(img, 0, y0, CELL, y1 - y0, 0, 0, CELL, y1 - y0);
    return c;
  }

  loadBody(body: string, clips = CLIPS): Promise<Sheets> {
    const id = `${body}:${clips.join(",")}`;
    let p = this.sheets.get(id);
    if (!p) {
      p = Promise.all(clips.map((c) => loadImage(`assets/chars/${body}_${c}.png`)))
        .then((imgs) => Object.fromEntries(clips.map((c, i) => [c, imgs[i]])));
      this.sheets.set(id, p);
    }
    return p;
  }

  loadHead(style: string): Promise<Img> {
    let p = this.heads.get(style);
    if (!p) {
      p = loadImage(`assets/chars/hair_${style}.png`);
      this.heads.set(style, p);
    }
    return p;
  }

  // Build the sheets for a look: { sheets, hands, builtin } (hands: weapon hand anchors per
  // clip; builtin: clips that already show the weapon).
  async build(look: Look, equipped: Equipped, clips = CLIPS): Promise<Built> {
    const { top, bottom, topBody, bottomBody, def, hair } = this.resolve(look, equipped);
    const bdef = this.bodies[bottomBody];
    const [upper, lower] = await Promise.all([this.loadBody(topBody, clips), this.loadBody(bottomBody, clips)]);
    const hairDye = HAIR_COLORS.find((c) => c.id === look.hairColor);
    const eyeDye = EYE_COLORS.find((c) => c.id === look.eyes);
    const cloth = (d: BodyDef, region: string, dyeId: string | null) => {
      const dye = dyeId ? DYES[dyeId] : undefined;
      // a body's own colour for this region needs no work
      return dye && d.natural?.[region] !== dyeId ? { [region]: dye } : {};
    };
    const topDyes: Record<string, Dye | undefined> = cloth(def, def.cloth.top, top.dye);
    if (!def.hairless) Object.assign(topDyes, { hair: hairDye, eyes: eyeDye });
    const split = (d: BodyDef) => (d.split ? { neck: d.split, offsets: d.head?.offsets } : null);
    const upperC = recolor(upper, def.regions, topDyes, def.mean, split(def));
    const lowerC = recolor(lower, bdef.regions, cloth(bdef, bdef.cloth.bottom, bottom.dye), bdef.mean, split(bdef));
    // per frame, how far the top moves down so its waist meets the bottom's
    const bob = (d: BodyDef, clip: string, dir: number, f: number) => d.head?.offsets[clip]?.[dir]?.[f]?.[1] ?? 0;
    const shift = (clip: string, dir: number, f: number, fb: number) =>
      bdef.waist + bob(bdef, clip, dir, fb) - (def.waist + bob(def, clip, dir, f));
    let sheets = this.join(upperC, lowerC, bdef, shift);
    const moved = (clip: string, dir: number, f: number) => shift(clip, dir, f, this.bottomFrame(upper[clip], lower[clip], f));
    if (hair && def.head) {
      const head = recolor({ head: await this.loadHead(hair) }, this.hair.regions, { hair: hairDye, eyes: eyeDye }).head;
      sheets = this.attachHead(sheets, def.head, head, this.hair.styles[hair], moved);
    }
    return { sheets, hands: shiftHands(def.hands, moved), builtin: topBody === bottomBody ? def.builtin ?? {} : {} };
  }

  // Which frame of the bottom's clip goes with frame f of the top's (clips may differ in length).
  bottomFrame(upper: Img | undefined, lower: Img | undefined, f: number): number {
    if (!upper || !lower) return f;
    const nu = upper.width / CELL, nl = lower.width / CELL;
    return Math.min(nl - 1, Math.floor((f * nl) / nu));
  }

  // The bottom from its waist down, then the top above its waist moved by shift().
  join(upper: Sheets, lower: Sheets, bdef: BodyDef, shift: (clip: string, dir: number, f: number, fb: number) => number): Sheets {
    const out: Sheets = {};
    for (const [clip, sheet] of Object.entries(upper)) {
      const low = lower[clip];
      const c = document.createElement("canvas");
      c.width = sheet.width;
      c.height = sheet.height;
      const g = c.getContext("2d")!;
      const frames = sheet.width / CELL;
      for (let d = 0; d < 8; d++) {
        for (let f = 0; f < frames; f++) {
          const fb = this.bottomFrame(sheet, low, f);
          const x = f * CELL, y = d * CELL;
          const wl = Math.round(bdef.waist + (bdef.head?.offsets[clip]?.[d]?.[fb]?.[1] ?? 0));
          const sh = Math.round(shift(clip, d, f, fb));
          const wu = wl - sh; // the top's waist row in its own frame
          g.drawImage(low, fb * CELL, y + wl, CELL, CELL - wl, x, y + wl, CELL, CELL - wl);
          const top = Math.max(0, -sh);
          if (wu > top) g.drawImage(sheet, x, y + top, CELL, wu - top, x, y + top + sh, CELL, wu - top);
        }
      }
      out[clip] = c;
    }
    return out;
  }

  // Draw the head layer onto every frame: back column under the body, front column over it.
  // moved(clip, dir, frame): how far the top was moved down to meet the bottom.
  attachHead(sheets: Sheets, head: NonNullable<BodyDef["head"]>, layer: Img, style: HairStyle, moved: (clip: string, dir: number, f: number) => number): Sheets {
    const out: Sheets = {};
    for (const [clip, sheet] of Object.entries(sheets)) {
      const c = document.createElement("canvas");
      c.width = sheet.width;
      c.height = sheet.height;
      const g = c.getContext("2d")!;
      const frames = sheet.width / CELL;
      for (let d = 0; d < 8; d++) {
        const [ax, ay] = head.anchor[d];
        const [hx, hy] = style.anchor[d];
        for (let f = 0; f < frames; f++) {
          const [dx, dy] = head.offsets[clip]?.[d]?.[f] ?? [0, 0];
          const x = f * CELL, y = d * CELL;
          const px = x + ax + dx - hx, py = y + ay + dy - hy + Math.round(moved(clip, d, f));
          g.save();
          g.beginPath();
          g.rect(x, y, CELL, CELL);
          g.clip();
          g.drawImage(layer, 0, d * CELL, CELL, CELL, px, py, CELL, CELL);
          g.drawImage(sheet, x, y, CELL, CELL, x, y, CELL, CELL);
          g.drawImage(layer, CELL, d * CELL, CELL, CELL, px, py, CELL, CELL);
          g.restore();
        }
      }
      out[clip] = c;
    }
    return out;
  }
}

// Weapon hand anchors moved with the top.
function shiftHands(hands: Hands | undefined, moved: (clip: string, dir: number, f: number) => number): Hands | undefined {
  if (!hands) return hands;
  const out: Hands = {};
  for (const [clip, dirs] of Object.entries(hands)) {
    out[clip] = dirs.map((frames, d) => frames.map((a, f) => {
      const dy = Math.round(moved(clip, d, f));
      if (!dy) return a;
      const mv = (p: [number, number] | null): [number, number] | null => (p ? [p[0], p[1] + dy] : null);
      return { r: mv(a.r), l: mv(a.l), c: mv(a.c)! };
    }));
  }
  return out;
}

// Character looks: top, bottom, hairstyle and colours.
//
// Every body is its own Oriverse sprite (assets/chars/<body>_<clip>.png, described in
// assets/chars/bodies.json). A top is the upper half of one body (head to waist, with the
// arms), a bottom the lower half of another; frame by frame the bottom is drawn from its waist
// down and the top above it, moved only to follow the bottom's bob (the head offsets): every body
// is brought to the same height first (`stretch`), so the head stays where it is. Bodies marked hairless were generated with short hair,
// which tools/char_layers.py erased frame by frame; a hairstyle head layer
// (assets/chars/hair_<id>.png: back layer in column 0, front layer in column 1) is drawn back
// onto every frame at the top body's head offset. Other bodies keep the hair they came with.
//
// When the top and the bottom come from different bodies the halves are not simply cut at the
// waist: each piece keeps what is its own (piece() below). The top brings its hands, sleeves and a
// long coat's skirts down over the bottom, and the bottom keeps its legs, skirt and boots, with
// the legs carried up where the other outfit's coat hid them.
//
// Colours are moved region by region (hue, saturation and lightness thresholds per body in
// bodies.json; hair and eyes for head layers in hair.json), so the hair dye never reaches a
// body and cloth dyes never reach the hair.

import { mapColors, rgbToHsl, hslToRgb } from "./recolor";
import type { Dye, RGB } from "./recolor";
import { DYES, ITEMS, SHAPES, DEFAULT_SHAPE, FALLBACK_SHAPE, type Gender } from "./items";
import { HAIR_COLORS, EYE_COLORS } from "./ui";
import type { Look } from "./ui";
import type { Equipped } from "./inventory";
import { loadImage } from "./assets";
import type { Img } from "./types";

export const CLIPS = ["idle", "walk", "swing", "thrust", "shoot", "cast"];
// Cast is optional: a body without it raises its arms with its swing instead (player.ts).
const NEEDED = CLIPS.filter((c) => c !== "cast");
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
  tails?: string[];                // regions that, below the waist, belong to the top (a long coat)
  stretch?: [number, number, number]; // rows [neck, feet] drawn from neck row [2] down (see stretchRow)
  legs?: [number, number, number]; // what the legs are (raw rgb) where a removed coat hid them
  under?: string;                  // the body whose trousers show when this one's coat isn't worn
  shoes?: number;                  // rows above the sole that keep their colour when the trousers are dyed
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

// Bare skin, in every body: below the waist it is the hands.
const SKIN: Region = { h: [0, 35], s: [0.15, 0.8], l: [0.55, 0.92] };

// Dark leather, for a belt.
const BELT: Dye = { hue: 25, sat: 0.35, target: 0.2 };

// One body's sheet as one piece of a mixed outfit, frame by frame at the body's waist. As the
// top (asTop): everything above the waist, and below it only the top's own pixels: the hands (skin
// above the feet rows; down there it is bare ankles), what lies within 3 px of them (sleeves,
// cuffs) unless it is the bottom's cloth, the `tails` regions and the trim and outline within 2 px
// of them. As the bottom: below the waist without those, each
// hole filled from the pixel under it (column by column, upward), so legs run on up under where a
// coat was; with `legs` set, in that colour.
function piece(img: Img, def: BodyDef, clip: string, asTop: boolean, cut = def.waist): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, 0, 0);
  const W = c.width, H = c.height, data = g.getImageData(0, 0, W, H), px = data.data;
  const waist = (x: number, y: number) =>
    Math.round(cut + (def.head?.offsets[clip]?.[Math.floor(y / CELL)]?.[Math.floor(x / CELL)]?.[1] ?? 0));
  const low = (x: number, y: number) => y % CELL >= waist(x, y);
  // per pixel: 1 skin, 2 tail cloth, 3 bottom cloth, 4 trim or outline, 0 anything else
  const kind = new Uint8Array(W * H), cache = new Map<number, number>(), tails = def.tails ?? [];
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    if (!px[i + 3]) continue;
    const key = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
    let k = cache.get(key);
    if (k === undefined) {
      const [h, s, l] = rgbToHsl(px[i], px[i + 1], px[i + 2]);
      const region = classify(def.regions, px[i], px[i + 1], px[i + 2]);
      k = region === def.cloth.bottom ? 3 : region && tails.includes(region) ? 2
        : inRange(h, SKIN.h) && s >= SKIN.s[0] && s <= SKIN.s[1] && l >= SKIN.l[0] && l <= SKIN.l[1] ? 1
        : l < 0.16 || (h >= 12 && h <= 60 && s > 0.25 && l >= 0.2 && l <= 0.85) ? 4 : 0;
      cache.set(key, k);
    }
    kind[p] = k;
  }
  const top = new Uint8Array(W * H);
  // the 8 neighbours of p in its own frame
  const around = (p: number, fn: (q: number, qx: number, qy: number) => void) => {
    const x = p % W, y = (p / W) | 0, cx = x - (x % CELL), cy = y - (y % CELL);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const qx = x + dx, qy = y + dy;
        if ((dx || dy) && qx >= cx && qy >= cy && qx < cx + CELL && qy < cy + CELL) fn(qy * W + qx, qx, qy);
      }
  };
  // hands and what lies within 3 px of them; tail cloth and the trim and outline along its
  // edges, followed through trim and outline pixels 5 px out at most
  let hands: number[] = [], edge: number[] = [];
  for (let p = 0; p < W * H; p++) {
    if ((kind[p] !== 1 && kind[p] !== 2) || !low(p % W, (p / W) | 0)) continue;
    if (kind[p] === 1 && ((p / W) | 0) % CELL >= CELL - 14) continue; // bare ankles, not hands
    top[p] = 1;
    (kind[p] === 1 ? hands : edge).push(p);
  }
  for (let step = 0; step < 5; step++) {
    const nh: number[] = [], ne: number[] = [];
    if (step < 3) for (const p of hands) around(p, (q, qx, qy) => {
      if (!top[q] && px[q * 4 + 3] && kind[q] !== 3 && low(qx, qy)) {
        top[q] = 1;
        nh.push(q);
      }
    });
    for (const p of edge) around(p, (q, qx, qy) => {
      if (!top[q] && kind[q] === 4 && low(qx, qy)) {
        top[q] = 1;
        ne.push(q);
      }
    });
    hands = nh;
    edge = ne;
  }
  if (asTop) {
    for (let p = 0; p < W * H; p++) if (!top[p] && low(p % W, (p / W) | 0)) px[p * 4 + 3] = 0;
  } else {
    // what legs grow up from: a pixel kept or filled, not light (a swing's slash, a white hem),
    // with something solid beside it (not a lone line, as a slash's outline is)
    const lit = (q: number) => rgbToHsl(px[q * 4], px[q * 4 + 1], px[q * 4 + 2])[2] >= 0.62;
    const kept = (q: number) => q >= 0 && q < W * H && px[q * 4 + 3] > 0 && !lit(q);
    const solid = (q: number) => kept(q) && ((q % W > 0 && kept(q - 1)) || (q % W < W - 1 && kept(q + 1)));
    // a swing's slash below the waist (near white, grey) goes, unless it is the bottom's cloth
    for (let p = 0; p < W * H; p++) {
      const i = p * 4;
      if (!px[i + 3] || kind[p] === 3 || !low(p % W, (p / W) | 0)) continue;
      const [, sat, l] = rgbToHsl(px[i], px[i + 1], px[i + 2]);
      if (l >= 0.8 && sat < 0.2) px[i + 3] = 0;
    }
    // and legs only grow above the feet: the columns with something solid in a frame's last rows
    const feet = new Uint8Array(W * (H / CELL)), grown = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
      if (y % CELL < CELL - 14) continue;
      for (let x = 0; x < W; x++) if (!top[y * W + x] && solid(y * W + x)) for (let k = -1; k <= 1; k++) if (x + k >= 0 && x + k < W) feet[Math.floor(y / CELL) * W + x + k] = 1;
    }
    for (let x = 0; x < W; x++)
      for (let y = H - 1; y >= 0; y--) {
        const p = y * W + x, i = p * 4;
        if (!top[p]) continue;
        const j = i + W * 4; // the pixel under it, already settled
        // (a leg already growing goes on up; a new one starts only from something solid)
        if (y % CELL === CELL - 1 || !px[j + 3] || !(grown[p + W] || solid(p + W)) || !feet[Math.floor(y / CELL) * W + x]) {
          px[i + 3] = 0;
          continue;
        }
        grown[p] = 1;
        const dark = rgbToHsl(px[j], px[j + 1], px[j + 2])[2] < 0.16;
        const [r, gg, b] = def.legs && !dark ? def.legs : [px[j], px[j + 1], px[j + 2]];
        px[i] = r;
        px[i + 1] = gg;
        px[i + 2] = b;
        px[i + 3] = 255;
      }
  }
  g.putImageData(data, 0, 0);
  return c;
}

// Put back the undyed pixels in each column's lowest `rows` (the shoe there; a lifted foot is
// lower in its own columns), frame by frame.
function keepShoes(dyed: Sheets, plain: Sheets, rows: number): Sheets {
  const out: Sheets = {};
  for (const [clip, img] of Object.entries(dyed)) {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d", { willReadFrequently: true })!;
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height);
    const o = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
    o.canvas.width = c.width;
    o.canvas.height = c.height;
    o.drawImage(plain[clip], 0, 0);
    const src = o.getImageData(0, 0, c.width, c.height).data, px = d.data, W = c.width;
    for (let fy = 0; fy < c.height; fy += CELL)
      for (let x = 0; x < W; x++) {
        let y = fy + CELL - 1;
        while (y >= fy && !src[(y * W + x) * 4 + 3]) y--;
        for (let k = 0; k < rows && y - k >= fy; k++) {
          const i = ((y - k) * W + x) * 4;
          px[i] = src[i];
          px[i + 1] = src[i + 1];
          px[i + 2] = src[i + 2];
        }
      }
    g.putImageData(d, 0, 0);
    out[clip] = c;
  }
  return out;
}

const pieces = (sheets: Sheets, def: BodyDef, asTop: boolean, cut?: number): Sheets =>
  Object.fromEntries(Object.entries(sheets).map(([clip, img]) => [clip, piece(img, def, clip, asTop, cut)]));

// Every body the same height: Oriverse drew some outfits shorter (neck lower, feet on the same
// line), so their rows from the neck down are spread over the tallest one's (bodies.json
// `stretch`: [neck, feet, target neck]); what is above the neck (hands raised in a cast) moves up
// with it. stretchRow maps a row of the drawing to the row it ends up on.
function stretchRow(st: [number, number, number], y: number): number {
  const [neck, feet, to] = st;
  if (y >= feet) return y;
  if (y <= neck) return y - (neck - to);
  return feet - ((feet - y) * (feet - to)) / (feet - neck);
}

function stretchSheet(img: Img, st: [number, number, number]): HTMLCanvasElement {
  const [neck, feet, to] = st;
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d")!;
  for (let d = 0; d < img.height / CELL; d++)
    for (let y = 0; y < CELL; y++) {
      // the source row each row comes from (stretchRow, backwards)
      const src = y >= feet ? y : y <= to ? y + (neck - to) : Math.round(feet - ((feet - y) * (feet - neck)) / (feet - to));
      if (src >= 0 && src < CELL) g.drawImage(img, 0, d * CELL + src, img.width, 1, 0, d * CELL + y, img.width, 1);
    }
  return c;
}

// A body's rows as they are after stretching: its waist, neck, head anchor and bob, hands.
function stretchDef(def: BodyDef): void {
  const st = def.stretch;
  if (!st) return;
  const k = (st[1] - st[2]) / (st[1] - st[0]);
  def.waist = Math.round(stretchRow(st, def.waist));
  if (def.neck !== undefined) def.neck = Math.round(stretchRow(st, def.neck));
  if (def.head) {
    def.head.anchor = def.head.anchor.map(([x, y]) => [x, Math.round(stretchRow(st, y))]);
    for (const dirs of Object.values(def.head.offsets)) for (const frames of dirs) for (const o of frames) o[1] *= k;
  }
  for (const dirs of Object.values(def.hands ?? {}))
    for (const frames of dirs)
      for (const a of frames) {
        for (const key of ["r", "l", "c"] as const) {
          const p = a[key];
          if (p) a[key] = [p[0], Math.round(stretchRow(st, p[1]))];
        }
      }
}

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
    for (const def of Object.values(this.bodies)) stretchDef(def);
  }

  // Hairstyles that have a head layer.
  get hairstyles(): Set<string> {
    return new Set(Object.keys(this.hair.styles));
  }

  // A body is used once all its clips are in (bodies.json lists them).
  ready(body: string): boolean {
    const have = this.bodies[body]?.clips;
    return !!have && NEEDED.every((c) => have.includes(c));
  }

  // The shape a slot shows: the worn item's, or the build's default when it is empty, made
  // for the other build, or its body isn't ready yet.
  shapeFor(look: Look, equipped: Equipped, slot: "top" | "bottom"): { shape: string; dye: string | null; worn: boolean } {
    const item = ITEMS[equipped[slot] ?? ""];
    const sh = item?.shape ? SHAPES[slot][item.shape] : undefined;
    if (sh && sh.gender === look.gender && this.ready(sh.body)) return { shape: item!.shape!, dye: item!.dye ?? null, worn: true };
    const g = look.gender as Gender;
    const shape = [DEFAULT_SHAPE[g], FALLBACK_SHAPE[g]].find((s) => s && this.ready(SHAPES[slot][s]?.body)) ?? "mage";
    return { shape, dye: null, worn: false };
  }

  // Which bodies and hairstyle a look and its clothes end up using.
  resolve(look: Look, equipped: Equipped) {
    const top = this.shapeFor(look, equipped, "top"), bottom = this.shapeFor(look, equipped, "bottom");
    const topBody = SHAPES.top[top.shape].body;
    let bottomBody = SHAPES.bottom[bottom.shape].body;
    // Under a long coat the legs were never drawn: worn under another top, the coat's bottom
    // shows another body's drawn trousers and boots instead, in the coat's trouser colour.
    const coat = this.bodies[bottomBody];
    const under = !!coat.under && bottomBody !== topBody && this.ready(coat.under);
    if (under) {
      bottom.dye ??= coat.natural?.[coat.cloth.bottom] ?? null;
      bottomBody = coat.under!;
    }
    const def = this.bodies[topBody];
    // a hairless top body takes the hairstyle (the first ready one if the chosen one isn't)
    const hair = !def.hairless ? null : this.hair.styles[look.hair] ? look.hair : Object.keys(this.hair.styles)[0] ?? null;
    return { top, bottom, topBody, bottomBody, def, hair, under };
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
    if (!r.def.hairless && look.gender === "male") return "ตัวละครชายใช้ทรงผมของตัวเอง ย้อมสีผมได้";
    if (!r.def.hairless && look.hair !== "twintail") return "เสื้อตัวนี้มาพร้อมผมทวินเทล ทรงผมที่เลือกจะใช้กับเสื้อตัวอื่น";
    if (r.hair && r.hair !== look.hair) return "ทรงผมนี้ยังใช้ไม่ได้";
    return "เปลี่ยนเสื้อและกางเกงได้จากไอเท็มในกระเป๋า (ปุ่ม I) ทรงไหนใส่คู่กับทรงไหนก็ได้";
  }

  key(look: Look, equipped: Equipped): string {
    const r = this.resolve(look, equipped);
    return [r.top.shape, r.top.dye, r.bottom.shape, r.bottom.dye, r.hair, look.hairColor, look.eyes].join("|");
  }

  loadBody(body: string, wanted = CLIPS): Promise<Sheets> {
    const have = this.bodies[body]?.clips;
    const clips = have ? wanted.filter((c) => have.includes(c)) : wanted;
    const id = `${body}:${clips.join(",")}`;
    let p = this.sheets.get(id);
    if (!p) {
      const st = this.bodies[body]?.stretch;
      p = Promise.all(clips.map((c) => loadImage(`assets/chars/${body}_${c}.png`)))
        .then((imgs) => Object.fromEntries(clips.map((c, i) => [c, st ? stretchSheet(imgs[i], st) : imgs[i]])));
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
    const { top, bottom, topBody, bottomBody, def, hair, under } = this.resolve(look, equipped);
    const bdef = this.bodies[bottomBody];
    const same = topBody === bottomBody;
    // (a mixed outfit's legs may come from the bottom's swing or thrust: see lowClip)
    const lowClips = same ? clips : [...new Set([...clips, "swing", "thrust"])];
    const [upper, lower] = await Promise.all([this.loadBody(topBody, clips), this.loadBody(bottomBody, lowClips)]);
    const hairDye = HAIR_COLORS.find((c) => c.id === look.hairColor);
    const eyeDye = EYE_COLORS.find((c) => c.id === look.eyes);
    const cloth = (d: BodyDef, region: string, dyeId: string | null) => {
      const dye = dyeId ? DYES[dyeId] : undefined;
      // a body's own colour for this region needs no work
      return dye && d.natural?.[region] !== dyeId ? { [region]: dye } : {};
    };
    // Both pieces of one body's outfit cross the waist (the mage's long coat runs down past it,
    // its dark vest up above it), so each half takes both dyes; mixed bodies dye their own piece.
    const topCloth = cloth(def, def.cloth.top, top.dye);
    // borrowed trousers: the hem of their own jacket at the waist becomes a leather belt
    const bottomCloth: Record<string, Dye> = { ...cloth(bdef, bdef.cloth.bottom, bottom.dye), ...(under ? { [bdef.cloth.top]: BELT } : {}) };
    const topDyes: Record<string, Dye | undefined> = same ? { ...bottomCloth, ...topCloth } : topCloth;
    if (!def.hairless) Object.assign(topDyes, { hair: hairDye, eyes: eyeDye });
    const split = (d: BodyDef) => (d.split ? { neck: d.split, offsets: d.head?.offsets } : null);
    // one body: its halves fit as they are; two: each keeps only its own piece
    // (the top reaches down to the lower of the two waists, so no gap opens between them)
    const upperC = recolor(same ? upper : pieces(upper, def, true, Math.max(def.waist, bdef.waist)), def.regions, topDyes, def.mean, split(def));
    const lowerP = same ? lower : pieces(lower, bdef, false);
    let lowerC = recolor(lowerP, bdef.regions, same ? { ...topCloth, ...bottomCloth } : bottomCloth, bdef.mean, split(bdef));
    // shoes drawn in the trousers' colours keep theirs when the trousers are dyed
    if (bdef.shoes && lowerC !== lowerP) lowerC = keepShoes(lowerC, lowerP, bdef.shoes);
    // per frame, how far the top moves down to follow the bottom's bob (every body stands as
    // tall as the others, so the top is not moved to make the waists meet: the head stays put)
    const bob = (d: BodyDef, clip: string, dir: number, f: number) => d.head?.offsets[clip]?.[dir]?.[f]?.[1] ?? 0;
    // a bottom without one of the top's clips (cast) moves its legs as in its swing; in a mixed
    // outfit, where the bottom's clip has its own weapon drawn in (a blade and slash across the
    // legs), as in its thrust
    const lowClip = (clip: string) => {
      const c = lower[clip] ? clip : "swing";
      return !same && bdef.builtin?.[c] && lower.thrust ? "thrust" : c;
    };
    const shift = (clip: string, dir: number, f: number, fb: number) => bob(bdef, lowClip(clip), dir, fb) - bob(def, clip, dir, f);
    let sheets = this.join(upperC, lowerC, bdef, shift, lowClip, !same);
    const moved = (clip: string, dir: number, f: number) => shift(clip, dir, f, this.bottomFrame(upper[clip], lower[lowClip(clip)], f));
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

  // The bottom from its waist down, then the top above its waist moved by shift(); a top cut
  // into its own piece (layered) is laid over whole, its pieces below the waist included.
  join(upper: Sheets, lower: Sheets, bdef: BodyDef, shift: (clip: string, dir: number, f: number, fb: number) => number, lowClip: (clip: string) => string, layered = false): Sheets {
    const out: Sheets = {};
    for (const [clip, sheet] of Object.entries(upper)) {
      const lc = lowClip(clip), low = lower[lc];
      const c = document.createElement("canvas");
      c.width = sheet.width;
      c.height = sheet.height;
      const g = c.getContext("2d")!;
      const frames = sheet.width / CELL;
      for (let d = 0; d < 8; d++) {
        for (let f = 0; f < frames; f++) {
          const fb = this.bottomFrame(sheet, low, f);
          const x = f * CELL, y = d * CELL;
          const wl = Math.round(bdef.waist + (bdef.head?.offsets[lc]?.[d]?.[fb]?.[1] ?? 0));
          const sh = Math.round(shift(clip, d, f, fb));
          const wu = wl - sh; // the top's waist row in its own frame
          g.drawImage(low, fb * CELL, y + wl, CELL, CELL - wl, x, y + wl, CELL, CELL - wl);
          const top = Math.max(0, -sh);
          if (layered) {
            g.save();
            g.beginPath();
            g.rect(x, y, CELL, CELL);
            g.clip();
            g.drawImage(sheet, x, y, CELL, CELL, x, y + sh, CELL, CELL);
            g.restore();
          } else if (wu > top) g.drawImage(sheet, x, y + top, CELL, wu - top, x, y + top + sh, CELL, wu - top);
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

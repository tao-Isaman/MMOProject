// Townsfolk: who stands where on a map, what they say, and what they do when you talk to them
// (open the shop, heal, or just talk). Each one is drawn from an 8-direction standing sheet:
// the merchant's own sprite, or a character dressed through the wardrobe (src/look.ts).

import { mapX, mapY } from "./projection";
import { directionIndex, viewRow } from "./player";
import type { Img, Vec2, View } from "./types";
import { isTouch } from "./touch";

const CELL = 96;
const HEIGHT = 128;   // on-screen height, like the player
export const TALK_RANGE = 190; // cm

export type NpcRole = "shop" | "heal" | "talk";

export interface NpcSpec {
  id: string;
  x: number;
  y: number;
  face?: number;       // degrees in the world (0 = +X), when nobody is near
  name: string;
  title: string;
  role: NpcRole;
  lines: string[];     // what they say, in turn
  sprite?: "merchant"; // her own sheet, else dressed from `look`
  look?: { gender: string; hair: string; hairColor: string; eyes: string; top: string; bottom: string };
}

export class Npc {
  spec: NpcSpec;
  x: number;
  y: number;
  sheet: Img | null = null;
  dir: number;
  home: number;
  radius = 30;
  time = 0;
  said = 0;               // which line comes next
  bubble: { text: string; t: number } | null = null;

  constructor(spec: NpcSpec) {
    this.spec = spec;
    this.x = spec.x;
    this.y = spec.y;
    const a = ((spec.face ?? 180) * Math.PI) / 180;
    this.home = this.dir = directionIndex(Math.cos(a), Math.sin(a));
  }

  get name(): string {
    return this.spec.name;
  }

  // Turns to face the player when they come close, and back when they leave.
  update(dt: number, player: Vec2): void {
    this.time += dt;
    const dx = player.x - this.x, dy = player.y - this.y;
    this.dir = Math.hypot(dx, dy) < 600 ? directionIndex(dx, dy) : this.home;
    if (this.bubble && (this.bubble.t -= dt) <= 0) this.bubble = null;
  }

  // The next line, shown in a balloon over the head.
  talk(): string {
    const lines = this.spec.lines;
    const text = lines[this.said % lines.length] ?? "";
    this.said++;
    this.bubble = { text, t: 3 + text.length * 0.06 };
    return text;
  }

  distance(p: Vec2): number {
    return Math.hypot(p.x - this.x, p.y - this.y);
  }

  // Whether a map point is on them (for clicks).
  contains(mx: number, my: number): boolean {
    const gx = mapX(this.x, this.y), gy = mapY(this.x, this.y);
    return Math.abs(mx - gx) < 34 && my < gy + 10 && my > gy - HEIGHT;
  }

  draw(ctx: CanvasRenderingContext2D, view: View, near: boolean): void {
    const { k, ox, oy } = view;
    const gx = mapX(this.x, this.y) * k + ox, gy = mapY(this.x, this.y) * k + oy;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(16, 30, 10, 0.34)";
    ctx.beginPath();
    ctx.ellipse(gx, gy, 30 * k, 12.6 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    if (this.sheet) {
      const s = (HEIGHT / (CELL * 0.92)) * k * (1 + 0.012 * Math.sin(this.time * 2.2));
      const row = viewRow(this.dir);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.sheet, 0, row * CELL, CELL, CELL, gx - (CELL / 2) * s, gy - CELL * s, CELL * s, CELL * s);
      ctx.imageSmoothingEnabled = true;
    }
    // name and role over the head
    const top = gy - HEIGHT * k - 12 * k;
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    ctx.font = `600 ${15 * k}px Kanit, sans-serif`;
    ctx.lineWidth = 4 * k;
    ctx.strokeStyle = "rgba(10, 14, 8, 0.85)";
    ctx.strokeText(this.spec.name, gx, top);
    ctx.fillStyle = "#ffe6a8";
    ctx.fillText(this.spec.name, gx, top);
    ctx.font = `${12 * k}px Kanit, sans-serif`;
    const label = near ? `${this.spec.title} · ${isTouch() ? "แตะเพื่อคุย" : "คลิกหรือกด F"}` : this.spec.title;
    ctx.strokeText(label, gx, top - 17 * k);
    ctx.fillStyle = near ? "#9df0b4" : "#d8d2bf";
    ctx.fillText(label, gx, top - 17 * k);
    if (this.bubble) drawBubble(ctx, gx, top - 40 * k, this.bubble.text, k);
    ctx.textAlign = "start";
  }
}

// A white speech balloon, wrapped to about 16 em, its tail pointing down at the speaker.
function drawBubble(ctx: CanvasRenderingContext2D, x: number, bottom: number, text: string, k: number): void {
  ctx.font = `${13 * k}px Kanit, sans-serif`;
  const maxW = 220 * k, lines: string[] = [];
  let line = "";
  for (const ch of [...text]) {
    const next = line + ch;
    if (ctx.measureText(next).width > maxW && line) {
      // break after a space when there is one nearby
      const cut = line.lastIndexOf(" ");
      if (cut > line.length * 0.5) {
        lines.push(line.slice(0, cut));
        line = line.slice(cut + 1) + ch;
      } else {
        lines.push(line);
        line = ch;
      }
    } else line = next;
  }
  if (line) lines.push(line);
  const lh = 18 * k, pad = 9 * k;
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + pad * 2, h = lines.length * lh + pad * 1.4;
  const x0 = x - w / 2, y0 = bottom - h - 8 * k;
  ctx.fillStyle = "rgba(255, 253, 244, 0.96)";
  ctx.strokeStyle = "rgba(60, 50, 30, 0.75)";
  ctx.lineWidth = 1.5 * k;
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, 8 * k);
  ctx.moveTo(x - 7 * k, y0 + h);
  ctx.lineTo(x, y0 + h + 8 * k);
  ctx.lineTo(x + 7 * k, y0 + h);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3a2f1e";
  lines.forEach((l, i) => ctx.fillText(l, x, y0 + pad + lh * (i + 0.72)));
}

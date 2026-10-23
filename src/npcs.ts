// Townsfolk: who stands where on a map, what they say, and what they do when you talk to them
// (open the shop, heal, or just talk). Each one is drawn from an 8-direction standing sheet:
// the merchant's own sprite, or a character dressed through the wardrobe (src/look.ts).

import { mapX, mapY } from "./projection";
import { directionIndex, viewRow } from "./player";
import type { Img, Vec2, View } from "./types";

const CELL = 96;
const HEIGHT = 128;   // on-screen height, like the player
export const TALK_RANGE = 190; // cm

export type NpcRole = "shop" | "heal" | "talk" | "travel";

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
  ports?: string[];    // a ship's captain (role travel): the only towns the ship sails to
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
  }

  // What they say next (the talk window opens with it), in turn.
  nextLine(): string {
    const lines = this.spec.lines;
    return lines[this.said++ % Math.max(1, lines.length)] ?? "";
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
    // name and title over the head (the title lights up within talking range)
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
    const label = this.spec.title;
    ctx.strokeText(label, gx, top - 17 * k);
    ctx.fillStyle = near ? "#9df0b4" : "#d8d2bf";
    ctx.fillText(label, gx, top - 17 * k);
    ctx.textAlign = "start";
  }
}

// World <-> map projection.
//
// The view is orthographic, the camera pitched 45 degrees down at 1 map pixel per world
// centimetre (src/world3d/view.ts points the 3D camera the same way). The camera can face any
// heading: `yaw` (radians) is 0 facing +X and turns towards +Y. World units are Oriverse sim
// centimetres (Z up). At yaw 0, right on screen = -Y and up = +X.
//
// "Map" coordinates are this view's screen plane before the camera's zoom and scroll: the
// courtyard centre (CX, CY) sits at (MAP_W / 2, MAP_H / 2) for every heading.

import type { Vec2 } from "./types";

export const S2 = Math.SQRT1_2; // cos 45 = sin 45
const TAU = Math.PI * 2;

export const MAP_W = 4096;
export const MAP_H = 3072;
// World point that lands on the map centre (the look_at of the middle capture row).
export const CX = 1733;
export const CY = 550;

let fx = 1, fy = 0;
export let yaw = 0;

export function setYaw(a: number): void {
  yaw = ((a % TAU) + TAU) % TAU;
  fx = Math.cos(yaw);
  fy = Math.sin(yaw);
}

// The camera heading in eighths of a turn, rounded: which of the 8 directions of a sprite
// sheet faces the camera.
export function yawEighths(): number {
  return Math.round(yaw / (Math.PI / 4)) % 8;
}

// A world vector in camera terms: { fwd: away from the camera, left: screen left }.
export function toView(x: number, y: number): { fwd: number; left: number } {
  return { fwd: x * fx + y * fy, left: -x * fy + y * fx };
}

// Back from camera terms to a world vector.
export function fromView(fwd: number, left: number): Vec2 {
  return { x: fwd * fx - left * fy, y: fwd * fy + left * fx };
}

export function mapX(x: number, y: number): number {
  return MAP_W / 2 - toView(x - CX, y - CY).left;
}

// The ground's height under a world point (cm): the current map's hills and plateaus (flat
// ground is 0 everywhere). `top` is the highest it goes.
let height: ((x: number, y: number) => number) | null = null;
let top = 0;
export function setHeights(fn: ((x: number, y: number) => number) | null, max = 0): void {
  height = fn;
  top = max;
}
export function heightAt(x: number, y: number): number {
  return height ? height(x, y) : 0;
}

// z: how high above the ground under (x, y).
export function mapY(x: number, y: number, z = 0): number {
  return MAP_H / 2 - (toView(x - CX, y - CY).fwd + z + (height ? height(x, y) : 0)) * S2;
}

// Inverse for points on the plane z = 0.
export function groundFromMap(mx: number, my: number): Vec2 {
  const v = fromView((MAP_H / 2 - my) / S2, MAP_W / 2 - mx);
  return { x: CX + v.x, y: CY + v.y };
}

// The point of the ground under a map point: down the line of sight from above the highest
// ground to the first place it meets the ground (a cliff in front hides the ground behind it).
export function groundAt(mx: number, my: number): Vec2 {
  const flat = groundFromMap(mx, my);
  if (!height) return flat;
  // going down the line of sight by dz moves the point dz further from the camera
  const f = fromView(1, 0);
  const at = (z: number): Vec2 => ({ x: flat.x - z * f.x, y: flat.y - z * f.y });
  let prev = top + 20;
  for (let z = prev; z > -400; z -= 12) {
    const p = at(z);
    if (height(p.x, p.y) >= z) {
      // close in on where the line crosses the ground between the last two steps
      let hi = prev, lo = z;
      for (let i = 0; i < 6; i++) {
        const mid = (hi + lo) / 2, q = at(mid);
        if (height(q.x, q.y) >= mid) lo = mid;
        else hi = mid;
      }
      return at(lo);
    }
    prev = z;
  }
  return flat;
}

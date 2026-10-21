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

export function mapY(x: number, y: number, z = 0): number {
  return MAP_H / 2 - (toView(x - CX, y - CY).fwd + z) * S2;
}

// Inverse for points on the ground plane (z = 0).
export function groundFromMap(mx: number, my: number): Vec2 {
  const v = fromView((MAP_H / 2 - my) / S2, MAP_W / 2 - mx);
  return { x: CX + v.x, y: CY + v.y };
}

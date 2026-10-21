// World <-> map projection.
//
// The scene is an orthographic view of the Oriverse courtyard, the camera pitched 45 degrees
// down at 1 map pixel per world centimetre. The camera can face any heading: `yaw` (radians)
// is 0 facing +X and turns towards +Y. World units are Oriverse sim centimetres (Z up). At
// yaw 0, right on screen = -Y and up = +X.
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

// The affine map from an image of the ground captured at yaw 0 (its top-left corner at map
// offset (x0, y0) from the centre, 1 px per map px) to map coordinates at the current yaw,
// as canvas transform terms [a, b, c, d, e, f].
export function groundTransform(x0: number, y0: number): [number, number, number, number, number, number] {
  const c = fx, s = fy;
  return [c, S2 * s, -s / S2, c, MAP_W / 2 + c * x0 - (s * y0) / S2, MAP_H / 2 + c * y0 + S2 * s * x0];
}

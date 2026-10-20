// World <-> map projection.
//
// Each map image is a stitched orthographic capture of the Oriverse courtyard, taken with the
// camera pitched 45 degrees down at 1 image pixel per world centimetre. The camera turns in
// 90 degree steps (yaw 0..3): yaw 0 faces +X, then +Y, -X, -Y. World units are Oriverse sim
// centimetres (Z up). At yaw 0, right on screen = -Y and up = +X.

import type { Vec2 } from "./types";

export const S2 = Math.SQRT1_2; // cos 45 = sin 45

export const MAP_W = 4096;
export const MAP_H = 3072;
// World point that lands on the map centre (the look_at of the middle capture row).
const CX = 1733;
const CY = 550;

const FORWARD: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
let fx = 1, fy = 0;
export let yaw = 0;

export function setYaw(k: number): void {
  yaw = ((k % 4) + 4) % 4;
  [fx, fy] = FORWARD[yaw];
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

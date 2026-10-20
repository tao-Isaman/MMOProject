// World <-> map projection.
//
// The map image is a stitched orthographic capture of the Oriverse courtyard, taken with the
// camera pitched 45 degrees down and facing +X, at 1 image pixel per world centimetre.
// World units are Oriverse sim centimetres (Z up). On screen: right = -Y, up = +X.

export const S2 = Math.SQRT1_2; // cos 45 = sin 45

export const MAP_W = 4096;
export const MAP_H = 3072;
// World point that lands on the map centre (the look_at of the middle capture row).
const CX = 1733;
const CY = 550;

export function mapX(y) {
  return MAP_W / 2 - (y - CY);
}

export function mapY(x, z = 0) {
  return MAP_H / 2 - ((x - CX) + z) * S2;
}

// Inverse for points on the ground plane (z = 0).
export function groundFromMap(mx, my) {
  return { x: CX + (MAP_H / 2 - my) / S2, y: CY + (MAP_W / 2 - mx) };
}

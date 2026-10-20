// Shared shapes used across the game modules.

export interface Vec2 {
  x: number;
  y: number;
}

// Anything canvas drawImage accepts that also knows its size.
export type Img = HTMLImageElement | HTMLCanvasElement;

// Halved copies of one texture (assets.ts mipChain) laid out as a grid of cells.
export interface Atlas {
  levels: Img[];
  cols: number;
  rows: number;
}

// How the map is drawn this frame: device px per map px, device offset of the map origin,
// canvas size, and the mip level picker for atlases.
export interface View {
  k: number;
  ox: number;
  oy: number;
  w: number;
  h: number;
  mipFor: (atlas: Atlas, r: number) => number;
}

// A [t, value] piecewise-linear curve over a particle's normalised life.
export type Curve = [number, number][];

// Textures built at boot (main.ts) for spells, hits and skill effects.
export interface Textures {
  rune: Img;
  ring: Img;
  mint: Img;
  column: Img;
  sparkle: Img;
  flash: Img;
  dissolve: Img;
  ember: Img;
  flowers: Atlas; // ground-baked flower atlas
  petals: Atlas;
  glowFor: (color: string) => Img;
  ringFor: (color: string) => Img;
}

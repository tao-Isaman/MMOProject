// Town kits: the building blocks for the towns and maps to come, one kit per town (plus the
// shared ones). Every item is built from code like the courtyard (src/world3d/geo.ts), in
// centimetres with Z up, standing on z = 0 and centred on its footprint; its front faces -X
// (the side a player sees first in the starting view), as the courtyard house's door does.
//
// kits.html shows them: every item of a kit laid out in rows, and a little sample scene.

import * as THREE from "three";
import { toThree } from "../geo";
import type { Geo, V3 } from "../geo";
import { material } from "../textures";

export type Ground = "grass" | "sand" | "snow" | "steppe" | "jungle" | "moss" | "dirt" | "rock";

export interface KitItem {
  id: string;   // snake_case, unique in its kit
  name: string; // Thai, shown in the gallery
  make: () => Geo | THREE.Object3D;
  tags?: string[]; // building, wall, gate, tower, dock, boat, market, light, decor, plant, ground...
}

// Place something in a sample scene: an item id of this kit (or "kit:item" of another), or a
// ready object; at a world point (cm), heading in degrees about Z, uniform scale.
export type Put = (what: string | THREE.Object3D, at: V3, heading?: number, scale?: number) => void;

export interface Kit {
  id: string;
  name: string;   // Thai town name
  region: string; // where it lies (Thai)
  desc: string;   // what it's like (Thai)
  ground: Ground;
  sea?: boolean;  // a strip of sea along the sample scene's -Y edge
  items: KitItem[];
  sample?: (put: Put) => void; // about 40 x 40 m around the origin
}

// A Geo into meshes with the shared materials.
export const solid = (g: Geo): THREE.Group => toThree(g, material);

export function build(item: KitItem): THREE.Object3D {
  const made = item.make();
  return made instanceof THREE.Object3D ? made : solid(made);
}

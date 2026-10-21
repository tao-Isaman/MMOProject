// The scenery of each map, built when the map is entered: the western field (the courtyard of
// courtyard.weave) and the city of Eden (town_eden.ts).

import * as THREE from "three";
import { buildCourtyard } from "./courtyard";
import { buildGround } from "./ground";
import { blocked } from "../world";
import type { Level } from "./view";

// The field: the courtyard's ground and props, flowers where the ground is open. The map's
// solids must already be set (flowers keep off them).
export function fieldLevel(quality: { flowers: number }, warps: { x: number; y: number }[]): Level {
  const root = new THREE.Group();
  const ground = buildGround();
  root.add(ground.mesh);
  const open = (x: number, y: number) => ground.dirt(x, y) < 0.35 && !blocked({ x, y }, 6);
  root.add(buildCourtyard(open, { flowerScale: quality.flowers }).root);
  return { root, sky: "#3d5a2a", warps };
}

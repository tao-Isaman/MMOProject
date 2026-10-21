// The village courtyard in 3D: the props of the-hero-fighter/oriverse/frieren/courtyard.weave
// ported recipe by recipe (centimetres, Z up, same names and numbers), placed where that
// world puts them; the trees and bushes from its #tree recipes; and a ring of woods around the
// walkable square so the view never runs off the edge of the world.

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, array, gridArray, boxAt, boxBounds, boxCenter, beamBetween,
  cylinderBetween, cylinderAt, cylinderCenter, sphereCenter, torus, gableRoof, gableWall, rock, toThree, place,
} from "./geo";
import type { Geo, V3 } from "./geo";
import { material } from "./textures";
import { tree } from "./trees";
import { BOUNDS } from "../world";

// ---- props (#mesh) ----
export function bench(): Geo {
  const seat = merge(
    boxAt([16, 170, 5], [-14, 0, 42], "WoodWarm", 1.5),
    boxAt([16, 170, 5], [4, 0, 42], "WoodWarm", 1.5),
    boxAt([14, 170, 5], [21, 0, 42], "WoodWarm", 1.5),
  );
  const back = merge(
    boxAt([5, 170, 13], [30, 0, 58], "WoodWarm", 1.5),
    boxAt([5, 170, 13], [32, 0, 75], "WoodWarm", 1.5),
  );
  const legL = merge(
    boxAt([8, 8, 42], [-16, -70, 0], "WoodShade", 1),
    boxAt([8, 8, 90], [30, -70, 0], "WoodShade", 1),
    boxAt([52, 7, 6], [7, -70, 36], "WoodShade", 1),
  );
  return merge(seat, back, legL, translate(legL, [0, 140, 0]));
}

export function crate(): Geo {
  const core = boxAt([56, 56, 56], [0, 0, 2], "WoodWarm", 1);
  const posts = gridArray(boxAt([8, 8, 60], [-26, -26, 0], "WoodShade", 1), [2, 2, 1], [52, 52, 0]);
  const railsX = gridArray(boxAt([60, 8, 8], [0, -26, 0], "WoodShade", 1), [1, 2, 2], [0, 52, 52]);
  const railsY = gridArray(boxAt([8, 60, 8], [-26, 0, 0], "WoodShade", 1), [2, 1, 2], [52, 0, 52]);
  return merge(core, posts, railsX, railsY);
}

export function fenceBroken(): Geo {
  const p1 = boxAt([10, 10, 80], [0, -65, 0], "WoodShade", 1.5);
  const p2 = rotateX(boxAt([10, 10, 70], [0, 65, 0], "WoodShade", 1.5), 12, [0, 65, 0]);
  const r1 = boxAt([5, 150, 12], [-4, 0, 55], "WoodWarm", 1.5);
  const r2 = rotateX(boxAt([5, 150, 12], [-6, 0, 22], "WoodWarm", 1.5), -8, [0, 0, 28]);
  return merge(p1, p2, r1, r2);
}

export function signPost(): Geo {
  return merge(
    boxAt([12, 12, 105], [0, 0, 0], "WoodWarm", 2),
    boxAt([16, 16, 6], [0, 0, 105], "WoodShade", 2),
    boxAt([4, 28, 18], [-8, 0, 70], "WoodShade", 1),
  );
}

export const flatStone = (seed: number): Geo => rock([42, 30, 7], 0.3, seed, "StoneLight", true);
export const rockSmall = (seed: number): Geo => rock([45, 38, 26], 0.4, seed, "MossStone");

export function gazebo(): Geo {
  const base = boxAt([190, 190, 30], [0, 0, 0], "StoneLight", 4);
  const posts = gridArray(boxAt([13, 13, 170], [-75, -75, 30], "WoodWarm", 2), [2, 2, 1], [150, 150, 0]);
  const beamsX = array(boxAt([172, 12, 12], [0, -75, 196], "WoodShade", 2), 2, [0, 150, 0]);
  const beamsY = array(boxAt([12, 172, 12], [-75, 0, 196], "WoodShade", 2), 2, [150, 0, 0]);
  const roof = rotateZ(cylinderAt({ rBot: 140, rTop: 6, height: 140, segments: 4, bottom: [0, 0, 210] }, "RoofOrange"), 45);
  const eave = rotateZ(cylinderAt({ rBot: 145, rTop: 140, height: 8, segments: 4, bottom: [0, 0, 204] }, "WoodShade"), 45);
  const finial = sphereCenter(9, [0, 0, 353], "WoodShade");
  const wellRing = cylinderAt({ radius: 42, height: 60, segments: 16, bottom: [0, 0, 30] }, "StoneLight");
  const water = cylinderAt({ radius: 35, height: 2, segments: 16, bottom: [0, 0, 88] }, "WaterDark");
  return merge(base, posts, beamsX, beamsY, roof, eave, finial, wellRing, water);
}

export function marketCart(): Geo {
  const body = boxAt([150, 110, 60], [0, 0, 50], "WoodWarm", 3);
  const trim = boxAt([156, 116, 8], [0, 0, 106], "WoodShade", 2);
  const rim = rotateX(torus(40, 6, 20, 8, "WoodShade"), 90);
  const spoke = cylinderBetween([0, 0, -37], [0, 0, 37], 2.5, 6, "WoodShade");
  const spokes = merge(spoke, rotateY(spoke, 45), rotateY(spoke, 90), rotateY(spoke, 135));
  const hub = rotateX(cylinderCenter(8, 14, 10, [0, 0, 0], "IronDark"), 90);
  const wheel = merge(rim, spokes, hub);
  const wheels = merge(translate(wheel, [20, -64, 46]), translate(wheel, [20, 64, 46]));
  const postBack = boxAt([6, 6, 110], [70, -52, 110], "WoodShade");
  const postFront = boxAt([6, 6, 80], [-70, -52, 110], "WoodShade");
  const posts = merge(postBack, translate(postBack, [0, 104, 0]), postFront, translate(postFront, [0, 104, 0]));
  const stripes = [-60, -40, -20, 0, 20, 40, 60].map((y, i) => rotateY(boxCenter([190, 20, 3], [0, y, 0], i % 2 ? "FabricWhite" : "FabricBlue"), -10));
  const awning = translate(merge(...stripes), [0, 0, 205]);
  const flapB = boxCenter([3, 20, 22], [-94, -60, 178], "FabricBlue");
  const flapW = boxCenter([3, 20, 22], [-94, -40, 178], "FabricWhite");
  const flaps = merge(array(flapB, 4, [0, 40, 0]), array(flapW, 3, [0, 40, 0]));
  const goods = merge(
    boxAt([40, 34, 26], [30, -20, 114], "WoodWarm", 2),
    sphereCenter(16, [-30, 22, 126], "FabricWhite"),
    sphereCenter(14, [-10, -28, 124], "RoofOrange"),
  );
  const shafts = merge(
    cylinderBetween([-75, -40, 70], [-200, -55, 4], 4, 8, "WoodShade"),
    cylinderBetween([-75, 40, 70], [-200, 55, 4], 4, 8, "WoodShade"),
  );
  return merge(body, trim, wheels, posts, awning, flaps, goods, shafts);
}

export function house(): Geo {
  const plinth = boxBounds([-410, -460, 0], [410, 460, 40], "StoneDark", 3);
  const stone = boxBounds([-405, -455, 0], [405, 455, 130], "StoneLight", 4);
  const upper = boxBounds([-400, -450, 130], [400, 450, 640], "PlasterCream", 2);
  const fposts = array(boxAt([10, 16, 510], [-404, -442, 130], "WoodShade", 1.5), 7, [0, 147, 0]);
  const fbeams = merge(
    boxAt([12, 910, 16], [-405, 0, 126], "WoodShade", 1.5),
    boxAt([10, 910, 12], [-404, 0, 380], "WoodShade", 1.5),
    boxAt([12, 910, 16], [-405, 0, 628], "WoodShade", 1.5),
  );
  const sposts = array(boxAt([16, 10, 510], [-392, -454, 130], "WoodShade", 1.5), 6, [157, 0, 0]);
  const sbeams = merge(
    boxAt([810, 12, 16], [0, -455, 126], "WoodShade", 1.5),
    boxAt([810, 10, 12], [0, -454, 380], "WoodShade", 1.5),
    boxAt([810, 12, 16], [0, -455, 628], "WoodShade", 1.5),
  );
  const braces = merge(
    beamBetween([-405, -440, 400], [-405, -300, 620], 10, 8, "WoodShade"),
    beamBetween([-405, 300, 400], [-405, 440, 620], 10, 8, "WoodShade"),
    beamBetween([-390, -456, 400], [-240, -456, 620], 10, 8, "WoodShade"),
    beamBetween([240, -456, 400], [390, -456, 620], 10, 8, "WoodShade"),
  );
  const doorFrame = boxAt([14, 150, 250], [-404, -290, 0], "WoodShade", 2);
  const door = boxAt([10, 118, 232], [-408, -290, 0], "DoorWood", 1);
  const lintel = boxAt([20, 170, 20], [-406, -290, 250], "WoodShade", 3);
  const winF = merge(
    boxAt([10, 90, 110], [-404, 0, 0], "WoodShade", 1),
    boxAt([6, 72, 92], [-408, 0, 9], "GlassBlue"),
    boxAt([8, 90, 5], [-408, 0, 52], "WoodShade"),
  );
  const windowsF = merge(translate(winF, [0, -120, 450]), translate(winF, [0, 160, 450]), translate(winF, [0, 120, 160]));
  const winS = merge(
    boxAt([90, 10, 110], [0, -454, 0], "WoodShade", 1),
    boxAt([72, 6, 92], [0, -458, 9], "GlassBlue"),
    boxAt([5, 8, 110], [0, -458, 0], "WoodShade"),
  );
  const windowsS = merge(translate(winS, [-160, 0, 450]), translate(winS, [160, 0, 450]), translate(winS, [0, 0, 160]));
  const quoins = array(boxAt([30, 30, 42], [-400, -450, 40], "StoneDark", 4), 2, [0, 0, 46]);
  const roof = gableRoof([880, 980, 22], [0, 0, 640], 320, 30, "RoofSlate");
  // the plaster triangles under the gable ends (Oriverse's gable_roof closes them itself)
  const gables = merge(gableWall(-400, 450, 640, 294, "PlasterCream"), gableWall(400, 450, 640, 294, "PlasterCream"));
  const chimney = boxAt([60, 60, 220], [150, 250, 800], "StoneDark", 3);
  return merge(plinth, stone, upper, fposts, fbeams, sposts, sbeams, braces, doorFrame, door, lintel, windowsF, windowsS, quoins, roof, gables, chimney);
}

// ---- flowers (#mesh FlowerWhite / FlowerYellow), one coloured geometry each for instancing ----
const PETAL: Record<string, string> = { StemGreen: "#4f8f2a", PetalWhite: "#fbfbf2", PetalYellow: "#ffd83a", PetalHeart: "#f2a922" };
function flower(white: boolean): Geo {
  const h = white ? 34 : 30, r = white ? 3 : 2.6, off = white ? 3.5 : 3;
  const petalMat = white ? "PetalWhite" : "PetalYellow";
  const stem = cylinderBetween([0, 0, 0], [0, 0, h], 0.6, 5, "StemGreen");
  const petal = scale(sphereCenter(r, [off, 0, h], petalMat, 6), [1, 0.6, 0.35], [off, 0, h]);
  const petals = merge(petal, rotateZ(petal, 72), rotateZ(petal, 144), rotateZ(petal, 216), rotateZ(petal, 288));
  const heart = sphereCenter(white ? 1.8 : 1.5, [0, 0, h + 1], white ? "PetalYellow" : "PetalHeart", 6);
  return merge(stem, petals, heart);
}
function coloured(g: Geo): THREE.BufferGeometry {
  const group = toThree(g, () => new THREE.MeshBasicMaterial());
  const geos: THREE.BufferGeometry[] = [];
  group.children.forEach((child, i) => {
    const mesh = child as THREE.Mesh, geo = mesh.geometry.clone();
    const mat = [...new Set(g.map((p) => p.mat))][i];
    const c = new THREE.Color(PETAL[mat]);
    const n = geo.getAttribute("position").count;
    geo.setAttribute("color", new THREE.Float32BufferAttribute(Array.from({ length: n }, () => [c.r, c.g, c.b]).flat(), 3));
    geos.push(geo);
  });
  const all = new THREE.BufferGeometry();
  const join = (name: string, size: number) => {
    const arrays = geos.map((x) => x.getAttribute(name).array as Float32Array);
    const out = new Float32Array(arrays.reduce((t, a) => t + a.length, 0));
    let o = 0;
    for (const a of arrays) {
      out.set(a, o);
      o += a.length;
    }
    all.setAttribute(name, new THREE.BufferAttribute(out, size));
  };
  join("position", 3);
  join("normal", 3);
  join("color", 3);
  return all;
}

// ---- layout ----
function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

export interface Courtyard {
  root: THREE.Group;
  props: THREE.Object3D[]; // things that stand up (for fading when they hide the player)
}

// isOpen(x, y): ground where flowers may grow (not a path, not under a prop).
export function buildCourtyard(isOpen: (x: number, y: number) => boolean, opts: { flowerScale?: number } = {}): Courtyard {
  const root = new THREE.Group();
  const props: THREE.Object3D[] = [];
  const add = (obj: THREE.Object3D, at: V3, heading = 0, s = 1) => {
    place(obj, at, heading, s);
    root.add(obj);
    props.push(obj);
    return obj;
  };
  const built = new Map<string, THREE.Group>();
  const mesh = (name: string, make: () => Geo) => {
    let g = built.get(name);
    if (!g) built.set(name, (g = toThree(make(), material)));
    return g.clone();
  };

  // trees and bushes
  add(tree("BigOak"), [1000, -600, 0]);
  add(tree("SmallTree"), [960, 1020, 0], 40);
  add(tree("RoundTree"), [2380, 120, 0], 300);
  for (const [x, y, rot, s] of [[2050, 680, 120, 2.9], [1960, 440, 220, 3.1], [2120, 240, 20, 2.7]]) add(tree("Bush"), [x, y, 0], rot, s);
  for (const [x, y, rot] of [[919, -570, 0], [968, -684, 70], [422, 265, 140], [488, -75, 200], [433, -195, 260], [668, 806, 30]]) add(tree("Bush"), [x, y, 0], rot, 1.2);

  // buildings and props
  add(mesh("house", house), [1910, 1440, 0]);
  add(mesh("gazebo", gazebo), [1100, 820, 0], 8);
  add(mesh("cart", marketCart), [792, 771, 0], -10);
  add(mesh("bench", bench), [1864, 178, 0], 24);
  add(mesh("bench", bench), [2051, -22, 0], 20);
  for (const [x, y, rot] of [[1070, -470, 8], [1100, -540, -12], [1642, 965, 0], [1735, 950, 15]]) add(mesh("crate", crate), [x, y, 0], rot);
  add(mesh("post", signPost), [978, -416, 0], -15);
  add(mesh("fence", fenceBroken), [854, -689, 0], 48);
  [[1331, 780, 20], [1406, 727, 75], [1418, 672, 130], [1397, 623, 10], [1453, 607, 95], [1469, 719, 160]].forEach(([x, y, rot], i) => {
    root.add(place(toThree(flatStone(4 + i), material), [x, y, 0], rot));
  });
  [[948, -452, 30], [427, 56, 110], [612, 731, 200]].forEach(([x, y, rot], i) => add(toThree(rockSmall(3 + i * 7), material), [x, y, 0], rot));

  // the woods around the courtyard: a band past each edge of the walkable square
  const rnd = seeded(77);
  const kinds = ["RoundTree", "RoundTree", "SmallTree", "BigOak", "SmallTree", "RoundTree"];
  const margin = 380, depth = 2200;
  const ring: [number, number][] = [];
  for (let i = 0; i < 900 && ring.length < 90; i++) {
    const x = BOUNDS.minX - margin - depth + rnd() * (BOUNDS.maxX - BOUNDS.minX + 2 * (margin + depth));
    const y = BOUNDS.minY - margin - depth + rnd() * (BOUNDS.maxY - BOUNDS.minY + 2 * (margin + depth));
    const inside = x > BOUNDS.minX - margin && x < BOUNDS.maxX + margin && y > BOUNDS.minY - margin && y < BOUNDS.maxY + margin;
    if (inside || ring.some(([ox, oy]) => Math.hypot(ox - x, oy - y) < 360)) continue;
    ring.push([x, y]);
    const kind = kinds[Math.floor(rnd() * kinds.length)];
    const s = kind === "BigOak" ? 0.8 + rnd() * 0.2 : 0.9 + rnd() * 0.35;
    root.add(place(tree(kind), [x, y, 0], rnd() * 360, s));
  }
  for (let i = 0; i < 110; i++) {
    const side = Math.floor(rnd() * 4), t = rnd();
    const x = side < 2 ? BOUNDS.minX + t * (BOUNDS.maxX - BOUNDS.minX) : side === 2 ? BOUNDS.minX - 60 - rnd() * 260 : BOUNDS.maxX + 60 + rnd() * 260;
    const y = side >= 2 ? BOUNDS.minY + t * (BOUNDS.maxY - BOUNDS.minY) : side === 0 ? BOUNDS.minY - 60 - rnd() * 260 : BOUNDS.maxY + 60 + rnd() * 260;
    root.add(place(tree("Bush"), [x, y, 0], rnd() * 360, 1.4 + rnd() * 1.6));
  }

  // flower fields (#scatter WhiteFlowers / YellowFlowers over 2400 x 3600 around (1300, 0))
  for (const [white, spacing, density, seed, smin, smax] of [[true, 110, 0.45, 4, 0.7, 1.3], [false, 140, 0.35, 9, 0.7, 1.2]] as const) {
    const r = seeded(seed);
    const geo = coloured(flower(white));
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, depthWrite: false });
    const spots: THREE.Matrix4[] = [];
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    const count = Math.round(((2400 * 3600) / spacing ** 2) * density * (opts.flowerScale ?? 1));
    for (let i = 0; i < count; i++) {
      const x = 100 + r() * 2400, y = -1800 + r() * 3600;
      if (!isOpen(x, y)) continue;
      const s = smin + r() * (smax - smin);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * Math.PI * 2);
      spots.push(m.clone().compose(new THREE.Vector3(x, 0, -y), q, new THREE.Vector3(s, s, s)));
    }
    const inst = new THREE.InstancedMesh(geo, mat, spots.length);
    spots.forEach((mm, i) => inst.setMatrixAt(i, mm));
    inst.receiveShadow = true;
    inst.renderOrder = 1; // after the props, and never over a character (no depth written)
    root.add(inst);
  }
  return { root, props };
}

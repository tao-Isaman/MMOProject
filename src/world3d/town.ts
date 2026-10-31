// What every town is built with: its plan read into the world, pieces from the town kits
// (src/world3d/kits) placed by name, walls cut to length, terraces of houses wall to wall, trees
// on the greens and woods outside, and the finish: one instanced mesh per piece, material and
// 50 m block (a block off screen costs nothing), the solids, flowers on the open grass, and the
// whole town scaled to TOWN_SCALE.
//
// A plan is read in its own pixels (u right, v down, as drawn) and turned into the world: north
// (up the page) is +X, east (right) is -Y, so the starting camera sees it as drawn.

import * as THREE from "three";
import { toThree } from "./geo";
import type { Geo } from "./geo";
import { material } from "./textures";
import type { Paved, Poly } from "./paved";
import { flowerFields } from "./courtyard";
import { COMMON, FLORA } from "./kits/common";
import type { Kit, KitItem } from "./kits/types";
import type { Terrain } from "./terrain";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import type { Level } from "./view";
import type { MapLabel } from "../maps";

// The towns are built at full size (the kits' own sizes) and then scaled as one: at full size
// they felt too big next to the characters. The scenery takes the scale on its root; everything
// the game reads (solids, bounds, places) is scaled to match on the way out.
export const TOWN_SCALE = 0.85;
// The side of the square the scenery is batched by (cm): small enough that the camera, which
// sees about 20 m across, culls most of a map, big enough to keep the draw calls few.
const BLOCK = Number(globalThis.localStorage?.getItem("dbg.block")) || 2000;

// ---- the kits a town draws from (each town module adds its own) ----
const KITS: Record<string, Kit> = { common: COMMON, flora: FLORA };
export function useKits(...kits: Kit[]): void {
  for (const k of kits) KITS[k.id] = k;
}

// Pieces a kit may not have yet stand in for each other.
const FALLBACK: Record<string, string> = {};
export function fallbacks(map: Record<string, string>): void {
  Object.assign(FALLBACK, map);
}

// Colourways: the same pieces with some materials swapped (red roofs, cream walls...).
const COLOURS: Record<string, Record<string, string>> = {};
export function colourways(map: Record<string, Record<string, string>>): void {
  Object.assign(COLOURS, map);
}

// ---- directions and chance ----
// the heading (degrees) that turns an item's front (-X) toward plan direction (du, dv)
export const facing = (du: number, dv: number) => (Math.atan2(du, dv) * 180) / Math.PI;
export const FACE = { e: 90, w: -90, n: 180, s: 0 } as const;
export type Side = keyof typeof FACE;

export function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// ---- a plan's pixels -> the world ----
export class Plan {
  // S: cm per plan pixel; (CU, CV): the plan pixel at the world origin
  constructor(readonly S: number, readonly CU: number, readonly CV: number) {}
  P = (u: number, v: number): [number, number] => [(this.CV - v) * this.S, (this.CU - u) * this.S];
  rect = (u0: number, v0: number, u1: number, v1: number): Poly => [this.P(u0, v0), this.P(u1, v0), this.P(u1, v1), this.P(u0, v1)];
  // a quarter ellipse with its corner at (cu, cv), reaching ru along u (signed) and rv along v (signed)
  quarter = (cu: number, cv: number, ru: number, rv: number, n = 16): Poly => {
    const pts: Poly = [this.P(cu, cv)];
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * (Math.PI / 2);
      pts.push(this.P(cu + ru * Math.cos(t), cv + rv * Math.sin(t)));
    }
    return pts;
  };
  // a polygon through plan points
  poly = (pts: [number, number][]): Poly => pts.map(([u, v]) => this.P(u, v));
  // a band `width` plan pixels wide along a polyline of plan points (a winding street)
  band = (pts: [number, number][], width: number): Poly => {
    const left: [number, number][] = [], right: [number, number][] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const du = b[0] - a[0], dv = b[1] - a[1], L = Math.hypot(du, dv) || 1;
      const nu = -dv / L, nv = du / L;
      left.push([pts[i][0] + nu * width / 2, pts[i][1] + nv * width / 2]);
      right.push([pts[i][0] - nu * width / 2, pts[i][1] - nv * width / 2]);
    }
    return this.poly([...left, ...right.reverse()]);
  };
}

// ---- placements ----
export interface Placement {
  ref: string;       // "kit:item"
  x: number;
  y: number;
  z: number;
  h: number;         // heading, degrees
  s: number;         // scale
  sy: number;        // extra stretch along the item's own Y (wall pieces cut to length)
  colours?: string;
  solid: "auto" | "none" | SolidSpec[]; // explicit shapes are in the item's own frame
}

export interface Proto {
  obj: THREE.Object3D;
  foot: { x0: number; x1: number; y0: number; y1: number };
  tags: string[];
  kit: string;
}

const protos = new Map<string, Proto>();
export function protoOf(ref: string, colours?: string): Proto {
  const key = `${ref}|${colours ?? ""}`;
  let p = protos.get(key);
  if (p) return p;
  const find = (r: string): [string, KitItem] | null => {
    const [kit, id] = r.split(":");
    const item = KITS[kit]?.items.find((i) => i.id === id);
    return item ? [kit, item] : null;
  };
  const found = find(ref) ?? find(FALLBACK[ref] ?? "") ?? find("common:crate")!;
  const [kit, item] = found;
  const made = item.make();
  let obj: THREE.Object3D;
  if (made instanceof THREE.Object3D) obj = made;
  else {
    const map = colours ? COLOURS[colours] : null;
    const geo: Geo = map ? made.map((part) => ({ geo: part.geo, mat: map[part.mat] ?? part.mat })) : made;
    obj = toThree(geo, material);
  }
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  p = { obj, foot: { x0: box.min.x, x1: box.max.x, y0: -box.max.z, y1: -box.min.z }, tags: item.tags ?? [], kit };
  protos.set(key, p);
  return p;
}

// The shapes a placed item blocks, in the world.
export function solidsOf(pl: Placement, proto: Proto): SolidSpec[] {
  const a = (pl.h * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const toWorld = (lx: number, ly: number): [number, number] => [pl.x + (lx * c - ly * s) * pl.s, pl.y + (lx * s + ly * c) * pl.s];
  if (pl.solid === "none") return [];
  if (Array.isArray(pl.solid))
    return pl.solid.map((sp) => {
      const [x, y] = toWorld(sp.x, sp.y);
      return "r" in sp ? { ...sp, x, y, r: sp.r * pl.s } : { ...sp, x, y, w: sp.w * pl.s, d: sp.d * pl.s, rot: sp.rot + pl.h };
    });
  const t = proto.tags, f = proto.foot;
  if (t.includes("ground") || t.includes("boat")) return [];
  const w = f.x1 - f.x0, d = (f.y1 - f.y0) * pl.sy;
  if (proto.kit === "flora") {
    const [x, y] = toWorld(0, 0);
    return [{ kind: "tree", x, y, r: (w < 200 ? 35 : 42) * pl.s }];
  }
  const [x, y] = toWorld((f.x0 + f.x1) / 2, ((f.y0 + f.y1) / 2) * pl.sy);
  if (w < 130 && d < 130) return [{ kind: "post", x, y, r: (Math.max(w, d) / 2) * 0.7 * pl.s }];
  const k = t.includes("building") || t.includes("landmark") ? 0.94 : 1;
  return [{ kind: proto.tags[0] ?? "box", x, y, w: w * k * pl.s, d: d * k * pl.s, rot: pl.h }];
}

// ---- what a built town hands the game ----
export interface Town {
  level: Level;
  solids: SolidSpec[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  spawn: { x: number; y: number };
  npcs: NpcSpec[];
  // a warp to map `to` lands where that map's gates[<this map>] says (or at `arrive`)
  warps: { x: number; y: number; r: number; to: string; arrive?: { x: number; y: number } }[];
  gates?: Record<string, { x: number; y: number }>; // where you arrive from each map next door
  closed: { x: number; y: number; r: number; text: string }[];
  labels: MapLabel[];
  height?: (x: number, y: number) => number; // the ground's height (world cm), when it is not flat
  top?: number;                              // and the highest it goes
  spots?: { x: number; y: number }[];        // where monsters live (a field)
}

type XY = [number, number];

export class TownBuilder {
  puts: Placement[] = [];
  extra: SolidSpec[] = []; // solids that are no piece's (the sea, a river)
  rnd: () => number;
  doors: Record<string, XY> = {}; // just outside the first of each terrace piece (world)
  terrain: Terrain | null = null;  // ground that is not flat: every piece stands on it

  constructor(seed: number) {
    this.rnd = seeded(seed);
  }

  put = (ref: string, at: XY, h = 0, o: Partial<Placement> = {}): void => {
    this.puts.push({ ref, x: at[0], y: at[1], z: 0, h, s: 1, sy: 1, solid: "auto", ...o });
  };

  // A straight run of wall from a to b (world), its outside facing `out`, in pieces `len` long
  // (the last cut to fit), leaving a gap `gap` wide at each distance along it in `gaps`.
  wall(a: XY, b: XY, out: Side, piece: string, o: { gaps?: number[]; len?: number; gap?: number } = {}): void {
    const len = o.len ?? 800, half = (o.gap ?? 1580) / 2;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
    const spans: [number, number][] = [];
    let from = 0;
    for (const g of [...(o.gaps ?? [])].sort((p, q) => p - q)) {
      spans.push([from, g - half]);
      from = g + half;
    }
    spans.push([from, L]);
    for (const [s0, s1] of spans) {
      for (let t = s0; t < s1 - 20; t += len) {
        const l = Math.min(len, s1 - t), mid = t + l / 2;
        this.put(piece, [a[0] + ux * mid, a[1] + uy * mid], FACE[out], { sy: l / len });
      }
    }
  }

  // A terrace: houses wall to wall with their fronts on the world line A -> B, facing `side`,
  // the pieces in turn from `start` (bare names are `kit`'s), each in a colourway from `tints`
  // ("" for its own colours). `narrow` ends the row when the next piece won't fit.
  terrace(A: XY, B: XY, side: Side, pieces: string[], o: { start?: number; kit: string; tints?: string[]; narrow: string; gap?: number }): void {
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const dx = (B[0] - A[0]) / L, dy = (B[1] - A[1]) / L;
    const r = (FACE[side] * Math.PI) / 180;
    const fx = -Math.cos(r), fy = -Math.sin(r);                      // the way the fronts face
    const along = -Math.sin(r) * dx + Math.cos(r) * dy > 0 ? 1 : -1; // whether the houses' own +Y runs along the row
    const tints = o.tints ?? [""];
    const refOf = (pc: string) => (pc.includes(":") ? pc : `${o.kit}:${pc}`);
    let t = 0;
    for (let i = o.start ?? 0; ; i++) {
      let piece = pieces[i % pieces.length];
      const colours = tints[Math.floor(this.rnd() * tints.length)] || undefined;
      let f = protoOf(refOf(piece), colours).foot;
      if (t + (f.y1 - f.y0) > L + 40) {
        // the end of the row: a narrow house if one still fits
        piece = o.narrow;
        f = protoOf(refOf(piece), colours).foot;
        if (t + (f.y1 - f.y0) > L + 40) break;
      }
      const w = f.y1 - f.y0, c = along > 0 ? t - f.y0 : t + f.y1;
      this.put(refOf(piece), [A[0] + dx * c + fx * f.x0, A[1] + dy * c + fy * f.x0], FACE[side], { colours });
      if (!this.doors[piece]) this.doors[piece] = [A[0] + dx * (t + w / 2) + fx * 170, A[1] + dy * (t + w / 2) + fy * 170];
      t += w + (o.gap ?? 4);
    }
  }

  // Trees (and now and then something else) on the grass left between, on a jittered grid over
  // the world box: only where the ground is grass all round and nothing stands within reach.
  greens(ground: Paved, box: { x0: number; x1: number; y0: number; y1: number }, o: { trees: string[]; other: string; chance?: number; step?: number; margin?: number }): void {
    const G = 100, x0 = box.x0, y0 = box.y0, gw = Math.ceil((box.x1 - box.x0) / G), gh = Math.ceil((box.y1 - y0) / G);
    const taken = new Uint8Array(gw * gh);
    const mark = (x: number, y: number, r: number) => {
      for (let j = Math.max(0, Math.floor((y - r - y0) / G)); j <= Math.min(gh - 1, Math.floor((y + r - y0) / G)); j++)
        for (let i = Math.max(0, Math.floor((x - r - x0) / G)); i <= Math.min(gw - 1, Math.floor((x + r - x0) / G)); i++) taken[j * gw + i] = 1;
    };
    for (const pl of this.puts) for (const sp of solidsOf(pl, protoOf(pl.ref, pl.colours))) mark(sp.x, sp.y, ("r" in sp ? sp.r : Math.hypot(sp.w, sp.d) / 2) + 250);
    const free = (x: number, y: number) => {
      const i = Math.floor((x - x0) / G), j = Math.floor((y - y0) / G);
      return i >= 0 && j >= 0 && i < gw && j < gh && !taken[j * gw + i];
    };
    const m = o.margin ?? 700, step = o.step ?? 520, rnd = this.rnd;
    for (let x = box.x0 + m; x < box.x1 - m; x += step)
      for (let y = y0 + m; y < box.y1 - m; y += step) {
        const px = x + (rnd() - 0.5) * 300, py = y + (rnd() - 0.5) * 300;
        // grass all round (not a road, plaza or water)
        if ([[0, 0], [300, 0], [-300, 0], [0, 300], [0, -300]].some(([dx, dy]) => ground.kind(px + dx, py + dy) !== 0) || !free(px, py) || !this.level(px, py, 150)) continue;
        if (rnd() < (o.chance ?? 0.62)) this.put(`flora:${o.trees[Math.floor(rnd() * o.trees.length)]}`, [px, py], rnd() * 360, { s: 0.6 + rnd() * 0.25 });
        else this.put(o.other, [px, py], rnd() * 90);
        mark(px, py, 300);
      }
  }

  // Woods outside the walls: up to `count` trees in the world box, kept `spacing` apart and out
  // of wherever `keepOut` says (the town, its roads, the harbour).
  woods(box: { x0: number; x1: number; y0: number; y1: number }, kinds: string[], keepOut: (x: number, y: number) => boolean, o: { count?: number; tries?: number; spacing?: number; kit?: string } = {}): void {
    const woods: XY[] = [], rnd = this.rnd, spacing = o.spacing ?? 450;
    for (let i = 0; i < (o.tries ?? 2600) && woods.length < (o.count ?? 150); i++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (keepOut(x, y) || !this.level(x, y, 150) || woods.some(([ox, oy]) => Math.hypot(ox - x, oy - y) < spacing)) continue;
      woods.push([x, y]);
      this.put(`${o.kit ?? "flora"}:${kinds[Math.floor(rnd() * kinds.length)]}`, [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.4, solid: "none" });
    }
  }

  // Whether the ground round (x, y) is level enough to stand something on (no cliff within r).
  level(x: number, y: number, r: number): boolean {
    return !this.terrain || this.terrain.level(x, y, r);
  }

  // Everything into one scene and the game's terms, at TOWN_SCALE. `scenery`: meshes of the
  // town's own besides the pieces (the sea); `flowers`: where flowers may grow (and how many);
  // `late`: solids that keep no flowers off (bars across shut gates).
  finish(o: {
    ground: Paved;
    scenery?: THREE.Object3D[];
    sky: string;
    flowers?: { box: { x: number; y: number; w: number; h: number }; open: (x: number, y: number) => boolean; density: number };
    late?: SolidSpec[];
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
    spawn: { x: number; y: number };
    npcs: NpcSpec[];
    warps: Town["warps"];
    gates?: Town["gates"];
    closed: Town["closed"];
    labels: MapLabel[];
    spots?: { x: number; y: number }[];
  }): Town {
    // ---- one instanced mesh per piece, material and BLOCK square: the camera sees a few of them,
    // and the rest are culled whole ----
    const root = new THREE.Group();
    root.add(o.ground.mesh);
    for (const s of o.scenery ?? []) root.add(s);
    // every piece on the ground; the cliffs' rock faces and the solids along them
    const terrain = this.terrain;
    if (terrain) {
      for (const pl of this.puts) pl.z += terrain.height(pl.x, pl.y);
      if (terrain.cliffs().length) root.add(terrain.faces());
    }
    const groups = new Map<string, Placement[]>();
    for (const pl of this.puts) {
      const key = `${pl.ref}|${pl.colours ?? ""}|${Math.floor(pl.x / BLOCK)},${Math.floor(pl.y / BLOCK)}`;
      const list = groups.get(key);
      if (list) list.push(pl);
      else groups.set(key, [pl]);
    }
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    for (const list of groups.values()) {
      const proto = protoOf(list[0].ref, list[0].colours);
      const mats = list.map((pl) => m.clone().compose(new THREE.Vector3(pl.x, pl.z, -pl.y), q.setFromAxisAngle(up, (pl.h * Math.PI) / 180).clone(), new THREE.Vector3(pl.s, pl.s, pl.s * pl.sy)));
      proto.obj.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const inst = new THREE.InstancedMesh(mesh.geometry, mesh.material, mats.length);
        mats.forEach((M, i) => inst.setMatrixAt(i, M.clone().multiply(mesh.matrixWorld)));
        inst.castShadow = mesh.castShadow;
        inst.receiveShadow = mesh.receiveShadow;
        if (mesh.customDepthMaterial) inst.customDepthMaterial = mesh.customDepthMaterial;
        inst.computeBoundingSphere();
        root.add(inst);
      });
    }
    const solids: SolidSpec[] = [...this.extra, ...(terrain?.solids() ?? [])];
    for (const pl of this.puts) solids.push(...solidsOf(pl, protoOf(pl.ref, pl.colours)));
    // ---- flowers on the open grass, not under a house or a prop (their footprints, a little
    // grown, on a 1 m grid) ----
    if (o.flowers) {
      const box = o.flowers.box;
      const G = 100, gx0 = box.x, gy0 = box.y, gw = Math.ceil(box.w / G), gh = Math.ceil(box.h / G);
      const taken = new Uint8Array(gw * gh);
      for (const sp of solids) {
        const r = "r" in sp ? sp.r + 60 : Math.hypot(sp.w, sp.d) / 2 + 60;
        const a = (("rot" in sp ? sp.rot : 0) * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
        for (let j = Math.max(0, Math.floor((sp.y - r - gy0) / G)); j <= Math.min(gh - 1, Math.floor((sp.y + r - gy0) / G)); j++)
          for (let i = Math.max(0, Math.floor((sp.x - r - gx0) / G)); i <= Math.min(gw - 1, Math.floor((sp.x + r - gx0) / G)); i++) {
            const dx = gx0 + (i + 0.5) * G - sp.x, dy = gy0 + (j + 0.5) * G - sp.y;
            const inside = "r" in sp ? Math.hypot(dx, dy) < r
              : Math.abs(dx * c + dy * sn) < sp.w / 2 + 60 && Math.abs(-dx * sn + dy * c) < sp.d / 2 + 60;
            if (inside) taken[j * gw + i] = 1;
          }
      }
      const free = (x: number, y: number) => {
        const i = Math.floor((x - gx0) / G), j = Math.floor((y - gy0) / G);
        return i >= 0 && j >= 0 && i < gw && j < gh && !taken[j * gw + i];
      };
      const open = o.flowers.open;
      root.add(flowerFields((x, y) => open(x, y) && free(x, y) && this.level(x, y, 60), box, o.flowers.density, terrain ? (x, y) => terrain.height(x, y) : undefined));
    }
    solids.push(...(o.late ?? []));

    // ---- to TOWN_SCALE: the scenery on its root (the portals go under it too), the rest point
    // by point (a warp's arrival is in the other map, which keeps its own size) ----
    const k = TOWN_SCALE;
    root.scale.setScalar(k);
    const at = <T extends { x: number; y: number }>(p: T): T => ({ ...p, x: p.x * k, y: p.y * k });
    const b = o.bounds;
    const height = terrain?.sampler(b, k, 40);
    return {
      level: { root, sky: o.sky, warps: o.warps.map((w) => ({ ...w, z: terrain?.height(w.x, w.y) ?? 0 })) },
      solids: solids.map((sp) => ("r" in sp ? { ...at(sp), r: sp.r * k } : { ...at(sp), w: sp.w * k, d: sp.d * k })),
      bounds: { minX: b.minX * k, maxX: b.maxX * k, minY: b.minY * k, maxY: b.maxY * k },
      spawn: at(o.spawn),
      npcs: o.npcs.map(at),
      warps: o.warps.map((w) => ({ ...at(w), r: w.r * k })),
      gates: Object.fromEntries(Object.entries(o.gates ?? {}).map(([id, g]) => [id, at(g)])),
      ...(o.spots ? { spots: o.spots.map(at) } : {}),
      closed: o.closed.map((c) => ({ ...at(c), r: c.r * k })),
      labels: o.labels.map(at),
      ...(height ? { height, top: height.max } : {}),
    };
  }
}

// ---- the ways out ----
// A gate that leads out to map `to` (a field): the warp `reach` past the gate on its outside
// (`out`), and where whoever comes back from `to` arrives, `back` inside it.
const OUTWARD: Record<Side, XY> = { n: [1, 0], s: [-1, 0], w: [0, 1], e: [0, -1] };
export function gateWay(gate: XY, out: Side, to: string, reach = 450, back = 450): { warp: Town["warps"][number]; back: { x: number; y: number } } {
  const [dx, dy] = OUTWARD[out];
  return { warp: { x: gate[0] + dx * reach, y: gate[1] + dy * reach, r: 170, to }, back: { x: gate[0] - dx * back, y: gate[1] - dy * back } };
}
// The warps and gates of a town's ways out, for finish.
export function waysOut(ways: ReturnType<typeof gateWay>[]): { warps: Town["warps"]; gates: Record<string, { x: number; y: number }> } {
  return { warps: ways.map((w) => w.warp), gates: Object.fromEntries(ways.map((w) => [w.warp.to, w.back])) };
}

// ---- townsfolk every town has ----
// The travel guide by the way in: her talk window offers two things, keeping this town as the
// save point and a warp to another town (picked on the world map).
export function travelGuide(town: string, at: XY, face: number, name = "เอลซ่า"): NpcSpec {
  return {
    id: `${town}_travel`, x: at[0], y: at[1], face, name, title: "ผู้นำทาง · เดินทางข้ามเมือง", role: "travel",
    look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "blue", top: "top_priestess_wine", bottom: "bottom_priestess_white" },
    lines: ["จะไปเมืองไหนดีคะ เลือกบนแผนที่ได้เลย", "เดินทางกับสมาคมผู้นำทาง ปลอดภัยถึงที่หมายทุกเมือง"],
  };
}

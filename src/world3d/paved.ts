// Town ground: one wide plane of grass (or snow, sand, steppe...) with roads of cobbles and
// plazas of flagstones painted into it from polygons (world cm), a darker kerb where they meet
// the open ground. The shader mixes the three by a painted mask, like ground.ts mixes grass and
// dirt.

import * as THREE from "three";
import { grassMap, dirtMap, detailCanvas, groundTexture } from "./textures";

export type Poly = [number, number][];

export interface PavedSpec {
  area: { x0: number; y0: number; x1: number; y1: number }; // the ground plane (world cm)
  roads: Poly[];
  plazas: Poly[];
  water?: Poly[];    // holes in the ground where the sea comes in (a harbour basin)
  cmPerPx?: number; // mask resolution
  base?: string;     // the open ground: grass (default), snow, sand, steppe, jungle, dirt, moss, rock
  road?: [number, number, number];  // tints over the cobbles and flagstones
  track?: boolean;  // the roads are tracks of bare earth (soft edges, no kerb), not cobbles
  tint?: string;    // over the whole ground (black lava rock, blighted earth...)
  plaza?: [number, number, number];
  height?: (x: number, y: number) => number; // ground that is not flat (src/world3d/terrain.ts)
  cell?: number;                             // its mesh's grid, cm
  // where each of the grid's points goes (x, y, height, and how stony: scree at a cliff's foot),
  // given where it would be and the grid's cell: moved onto the top and the foot of the cliffs
  // (src/world3d/terrain.ts `place`)
  place?: (x: number, y: number, cell: number) => [number, number, number, number];
}

export interface Paved {
  mesh: THREE.Mesh;
  // 0 grass, 1 road, 2 plaza, 3 water at a world point
  kind: (x: number, y: number) => number;
}

function texture(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

export function buildPaved(spec: PavedSpec): Paved {
  const { x0, y0, x1, y1 } = spec.area;
  const cm = spec.cmPerPx ?? 25;
  const W = Math.ceil((x1 - x0) / cm), H = Math.ceil((y1 - y0) / cm);
  // the mask: red = road, green = plaza, blue = water; canvas x runs along world x, canvas y along world y
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "lighter";
  const fill = (polys: Poly[], colour: string) => {
    g.fillStyle = colour;
    for (const poly of polys) {
      g.beginPath();
      poly.forEach(([x, y], i) => (i ? g.lineTo((x - x0) / cm, (y - y0) / cm) : g.moveTo((x - x0) / cm, (y - y0) / cm)));
      g.closePath();
      g.fill();
    }
  };
  // a track's edge fades into the grass
  if (spec.track) g.filter = `blur(${Math.max(1, 60 / cm)}px)`;
  fill(spec.roads, "#ff0000");
  g.filter = "none";
  fill(spec.plazas, "#00ff00");
  fill(spec.water ?? [], "#0000ff");
  const data = g.getImageData(0, 0, W, H).data;
  const kind = (x: number, y: number) => {
    const px = Math.floor((x - x0) / cm), py = Math.floor((y - y0) / cm);
    if (px < 0 || py < 0 || px >= W || py >= H) return 0;
    const i = (py * W + px) * 4;
    return data[i + 2] > 127 ? 3 : data[i + 1] > 127 ? 2 : data[i] > 127 ? 1 : 0;
  };
  const mask = new THREE.CanvasTexture(c);
  mask.flipY = false;
  mask.magFilter = THREE.LinearFilter;

  const uniforms = {
    uGrass: { value: !spec.base || spec.base === "grass" ? grassMap() : groundTexture(spec.base, false) },
    uRoad: { value: new THREE.Vector3(...(spec.road ?? (spec.track ? [0.92, 0.86, 0.8] : [0.74, 0.70, 0.64]))) },
    uPlaza: { value: new THREE.Vector3(...(spec.plaza ?? [0.90, 0.87, 0.80])) },
    uBase: { value: !spec.base || spec.base === "grass" ? 0.86 : 1 },
    uCobble: { value: spec.track ? dirtMap() : texture(detailCanvas("cobble")) },
    uKerb: { value: spec.track ? 0.12 : 0.45 },
    uTile: { value: spec.track ? 300 : 120 },
    uFlag: { value: texture(detailCanvas("stone")) },
    uMask: { value: mask },
    uMin: { value: new THREE.Vector2(x0, y0) },
    uSize: { value: new THREE.Vector2(x1 - x0, y1 - y0) },
    uTexel: { value: new THREE.Vector2(1 / W, 1 / H) },
    uOrigin: { value: new THREE.Vector3((x0 + x1) / 2, 0, -(y0 + y1) / 2) },
    uSteep: { value: spec.place ? 1 : 0 }, // on ground shaped by the terrain: steep ground (a ramp's banks) stony, no paving up it
  };
  const mat = new THREE.MeshStandardMaterial({ color: spec.tint ?? 0xffffff, roughness: 0.95 });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      // the ground's own coordinates (the polygons'), whatever the level is scaled to in the world;
      // how stony it is (scree, steep banks)
      .replace("#include <common>", "#include <common>\nvarying vec3 vGround;\nuniform vec3 uOrigin;\nattribute float scree;\nvarying float vStony;\nvarying float vUp;\nuniform float uSteep;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGround = transformed + uOrigin;\nvUp = normal.y;\nvStony = max(scree, uSteep * (1.0 - smoothstep(0.6, 0.86, normal.y)));");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
        varying vec3 vGround;
        varying float vStony;
        varying float vUp;
        uniform float uSteep;
        uniform sampler2D uGrass, uCobble, uFlag, uMask;
        uniform vec2 uMin, uSize, uTexel;
        uniform vec3 uRoad, uPlaza;
        uniform float uBase, uKerb, uTile;`)
      .replace("#include <map_fragment>", `
        vec2 w = vec2(vGround.x, -vGround.z);
        vec3 grass = mix(texture2D(uGrass, w / 260.0).rgb, texture2D(uGrass, w / 1130.0 + 0.37).rgb, 0.45);
        grass = pow(grass * uBase, vec3(2.2));
        // scree and steep banks: the ground greyed and warmed toward stone and earth
        grass = mix(grass, vec3(dot(grass, vec3(0.3, 0.55, 0.15))) * vec3(1.08, 0.96, 0.8), vStony * 0.6);
        // cobbles (1.2 m tiles) a warm grey; flagstones (3 m tiles, big slabs) pale
        vec3 cobble = texture2D(uCobble, w / uTile).rgb * uRoad;
        vec3 flag = texture2D(uFlag, w.yx / 300.0).rgb * uPlaza;
        cobble = pow(cobble, vec3(2.2));
        flag = pow(flag, vec3(2.2));
        vec2 m = (w - uMin) / uSize;
        vec3 k = texture2D(uMask, m).rgb;
        if (k.b > 0.5) discard; // the water below shows through
        // (no paving or track up a steep bank)
        float level = mix(1.0, smoothstep(0.62, 0.8, vUp), uSteep);
        float road = smoothstep(0.3, 0.7, k.r) * level, plaza = smoothstep(0.3, 0.7, k.g) * level;
        vec3 col = mix(mix(grass, cobble, road), flag, plaza);
        // a kerb: darker where paving meets grass
        float edge = max(k.r, k.g);
        float kerb = 1.0 - uKerb * level * (smoothstep(0.15, 0.45, edge) - smoothstep(0.55, 0.85, edge));
        diffuseColor.rgb *= col * kerb;`);
  };
  // flat: one quad; with a height, a grid of `cell` squares (up to 600 a side) raised to it
  const cell = spec.height ? Math.max(spec.cell ?? 100, (x1 - x0) / 600, (y1 - y0) / 600) : 0;
  const geo = spec.height
    ? new THREE.PlaneGeometry(x1 - x0, y1 - y0, Math.ceil((x1 - x0) / cell), Math.ceil((y1 - y0) / cell))
    : new THREE.PlaneGeometry(x1 - x0, y1 - y0);
  geo.rotateX(-Math.PI / 2);
  if (spec.height) {
    const pos = geo.getAttribute("position") as THREE.BufferAttribute, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const stony = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = cx + pos.getX(i), y = cy - pos.getZ(i);
      if (spec.place) {
        const [px, py, h, s] = spec.place(x, y, cell);
        pos.setXYZ(i, px - cx, h, cy - py);
        stony[i] = s;
      } else pos.setY(i, spec.height(x, y));
    }
    geo.setAttribute("scree", new THREE.BufferAttribute(stony, 1));
    geo.computeVertexNormals();
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(uniforms.uOrigin.value);
  mesh.receiveShadow = true;
  return { mesh, kind };
}

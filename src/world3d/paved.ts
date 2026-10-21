// Town ground: one wide plane of grass with roads of cobbles and plazas of flagstones painted
// into it from polygons (world cm), a darker kerb where they meet the grass. The shader mixes
// the three by a painted mask, like ground.ts mixes grass and dirt.

import * as THREE from "three";
import { grassMap, detailCanvas } from "./textures";

export type Poly = [number, number][];

export interface PavedSpec {
  area: { x0: number; y0: number; x1: number; y1: number }; // the ground plane (world cm)
  roads: Poly[];
  plazas: Poly[];
  water?: Poly[];    // holes in the ground where the sea comes in (a harbour basin)
  cmPerPx?: number; // mask resolution
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
  fill(spec.roads, "#ff0000");
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
    uGrass: { value: grassMap() },
    uCobble: { value: texture(detailCanvas("cobble")) },
    uFlag: { value: texture(detailCanvas("stone")) },
    uMask: { value: mask },
    uMin: { value: new THREE.Vector2(x0, y0) },
    uSize: { value: new THREE.Vector2(x1 - x0, y1 - y0) },
    uTexel: { value: new THREE.Vector2(1 / W, 1 / H) },
  };
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGround;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGround = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
        varying vec3 vGround;
        uniform sampler2D uGrass, uCobble, uFlag, uMask;
        uniform vec2 uMin, uSize, uTexel;`)
      .replace("#include <map_fragment>", `
        vec2 w = vec2(vGround.x, -vGround.z);
        vec3 grass = mix(texture2D(uGrass, w / 260.0).rgb, texture2D(uGrass, w / 1130.0 + 0.37).rgb, 0.45);
        grass = pow(grass * 0.86, vec3(2.2));
        // cobbles (1.2 m tiles) a warm grey; flagstones (3 m tiles, big slabs) pale
        vec3 cobble = texture2D(uCobble, w / 120.0).rgb * vec3(0.74, 0.70, 0.64);
        vec3 flag = texture2D(uFlag, w.yx / 300.0).rgb * vec3(0.90, 0.87, 0.80);
        cobble = pow(cobble, vec3(2.2));
        flag = pow(flag, vec3(2.2));
        vec2 m = (w - uMin) / uSize;
        vec3 k = texture2D(uMask, m).rgb;
        if (k.b > 0.5) discard; // the water below shows through
        float road = smoothstep(0.3, 0.7, k.r), plaza = smoothstep(0.3, 0.7, k.g);
        vec3 col = mix(mix(grass, cobble, road), flag, plaza);
        // a kerb: darker where paving meets grass
        float edge = max(k.r, k.g);
        float kerb = 1.0 - 0.45 * (smoothstep(0.15, 0.45, edge) - smoothstep(0.55, 0.85, edge));
        diffuseColor.rgb *= col * kerb;`);
  };
  const geo = new THREE.PlaneGeometry(x1 - x0, y1 - y0);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set((x0 + x1) / 2, 0, -(y0 + y1) / 2);
  mesh.receiveShadow = true;
  return { mesh, kind };
}

// The ground: one wide plane, grass mixed with dirt where courtyard.weave paints its paths
// (#terrain_paint CourtyardPaint, polygons in metres).

import * as THREE from "three";
import { grassMap, dirtMap } from "./textures";
import { blurChannels } from "./paved";

// Dirt paths: the paint polygons of courtyard.weave, world metres.
const PATHS: [number, number][][] = [
  [[4.8, 4.4], [5.2, 5.1], [5.3, 5.4], [4.8, 5.9], [4.4, 6.8], [2.9, 6.3], [2.9, 4.0], [4.4, 4.5], [4.6, 4.4]],
  [[6.4, 2.9], [6.1, 2.7], [5.5, 1.7], [5.5, 0.6], [5.8, 0.1], [6.0, 0.2], [6.1, 0.6], [6.5, 1.7], [6.9, 1.9], [7.0, 2.2], [6.8, 2.8]],
  [[9.7, 6.5], [10.3, 7.5], [10.0, 7.7], [10.2, 8.0], [9.9, 8.2], [9.2, 8.2], [9.1, 8.7], [8.8, 8.7], [8.0, 8.2], [7.4, 7.9], [7.1, 7.0], [7.3, 6.5], [8.6, 6.3], [9.0, 6.5], [9.4, 6.4]],
  [[7.9, 0.9], [7.5, 0.7], [7.1, 0.3], [6.9, -1.1], [6.5, -2.6], [6.2, -3.0], [4.9, -3.7], [4.5, -4.3], [4.2, -4.6], [4.1, -4.9], [2.9, -4.5], [2.9, -7.6], [4.9, -8.8], [5.0, -7.3], [5.2, -7.4], [5.9, -7.1], [6.5, -6.8], [7.1, -5.9], [8.5, -5.2], [9.0, -4.4], [9.3, -4.3], [9.3, -3.7], [9.8, -3.7], [10.3, -3.1], [10.6, -3.0], [10.9, -3.2], [10.8, -3.8], [10.9, -4.0], [11.7, -4.2], [12.0, -4.3], [12.5, -4.1], [12.9, -3.1], [13.3, -2.8], [13.4, -2.2], [13.3, -1.9], [12.6, -1.7], [11.6, -1.0], [11.0, -0.9], [10.2, -0.4], [9.6, -0.4], [9.2, -0.1], [8.8, -0.1]],
  [[12.4, 7.0], [13.2, 7.7], [13.5, 8.2], [13.3, 8.2], [12.6, 8.0], [12.6, 9.9], [12.9, 10.1], [12.8, 10.4], [12.3, 10.6], [10.7, 9.7], [10.6, 10.1], [10.2, 10.0], [9.8, 9.6], [10.2, 9.5], [10.1, 9.0], [11.0, 8.9], [10.6, 8.1], [10.5, 7.5], [11.0, 7.3], [11.7, 6.8]],
  [[13.8, 6.5], [13.4, 6.3], [12.2, 4.7], [12.1, 3.4], [12.4, 3.1], [13.1, 3.0], [13.6, 3.1], [13.9, 4.5], [14.5, 5.2], [14.5, 6.2]],
];

// The painted area: world cm.
const SPLAT = { x: -600, y: -1600, w: 4000, h: 4000, px: 512 };

export interface Ground {
  mesh: THREE.Mesh;
  dirt: (x: number, y: number) => number; // 0 grass .. 1 path, at a world point
}

function splatCanvas(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = SPLAT.px;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, SPLAT.px, SPLAT.px);
  g.fillStyle = "#fff";
  const k = SPLAT.px / SPLAT.w;
  for (const poly of PATHS) {
    g.beginPath();
    poly.forEach(([mx, my], i) => {
      const x = (mx * 100 - SPLAT.x) * k, y = (my * 100 - SPLAT.y) * k;
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    });
    g.closePath();
    g.fill();
  }
  // the paint's fade
  const img = g.getImageData(0, 0, SPLAT.px, SPLAT.px);
  blurChannels(img.data, SPLAT.px, SPLAT.px, [0, 1, 2], 3);
  g.putImageData(img, 0, 0);
  return c;
}

export function buildGround(): Ground {
  const splat = splatCanvas();
  const data = splat.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, SPLAT.px, SPLAT.px).data;
  const dirt = (x: number, y: number) => {
    const px = Math.floor(((x - SPLAT.x) / SPLAT.w) * SPLAT.px), py = Math.floor(((y - SPLAT.y) / SPLAT.h) * SPLAT.px);
    if (px < 0 || py < 0 || px >= SPLAT.px || py >= SPLAT.px) return 0;
    return data[(py * SPLAT.px + px) * 4] / 255;
  };
  const splatTex = new THREE.CanvasTexture(splat);
  splatTex.flipY = false;
  const uniforms = {
    uGrass: { value: grassMap() },
    uDirt: { value: dirtMap() },
    uSplat: { value: splatTex },
    uSplatMin: { value: new THREE.Vector2(SPLAT.x, SPLAT.y) },
    uSplatSize: { value: new THREE.Vector2(SPLAT.w, SPLAT.h) },
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
        uniform sampler2D uGrass, uDirt, uSplat;
        uniform vec2 uSplatMin, uSplatSize;`)
      .replace("#include <map_fragment>", `
        vec2 w = vec2(vGround.x, -vGround.z);
        vec3 grass = mix(texture2D(uGrass, w / 260.0).rgb, texture2D(uGrass, w / 1130.0 + 0.37).rgb, 0.45);
        vec3 dirtC = texture2D(uDirt, w / 330.0).rgb;
        float s = texture2D(uSplat, (w - uSplatMin) / uSplatSize).r;
        float edge = texture2D(uGrass, w / 90.0).g;
        s = smoothstep(0.35, 0.65, s + (edge - 0.55) * 0.5);
        diffuseColor.rgb *= pow(mix(grass * 0.86, dirtC, s), vec3(2.2));`);
  };
  const geo = new THREE.PlaneGeometry(16000, 16000);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(1300, 0, -650);
  mesh.receiveShadow = true;
  return { mesh, dirt };
}

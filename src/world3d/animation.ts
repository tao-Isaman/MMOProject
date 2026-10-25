// Shared clock for small shader animations on scenery (fire, water, and flowers).
import type { MeshStandardMaterial } from "three";

export const sceneryTime = { value: 0 };

export type SceneryMotion = "fire" | "water" | "spray" | "flower";

export function animateSceneryMaterial(material: MeshStandardMaterial, motion: SceneryMotion): void {
  const previous = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.uSceneryTime = sceneryTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uSceneryTime;\nvarying vec3 vSceneryPosition;\nvarying float vSceneryPhase;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vSceneryPosition = position;
        vSceneryPhase = dot(position, vec3(0.013, 0.017, 0.019));
        ${motion === "fire" ? `
          float flameWeight = clamp(position.y / 120.0, 0.0, 1.0);
          float flameWaver = sin(uSceneryTime * 13.0 + vSceneryPhase * 5.0);
          transformed.x += flameWaver * 3.0 * flameWeight;
          transformed.z += cos(uSceneryTime * 9.0 + vSceneryPhase * 4.0) * 2.0 * flameWeight;
          transformed.y += abs(flameWaver) * 2.5 * flameWeight;
        ` : ""}
        ${motion === "flower" ? `
          float bloomWeight = clamp(position.y / 90.0, 0.0, 1.0);
          transformed.x += sin(uSceneryTime * 1.5 + vSceneryPhase * 4.0) * 2.2 * bloomWeight;
          transformed.z += cos(uSceneryTime * 1.2 + vSceneryPhase * 3.0) * 1.6 * bloomWeight;
        ` : ""}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uSceneryTime;\nvarying vec3 vSceneryPosition;\nvarying float vSceneryPhase;")
      .replace("#include <color_fragment>", `#include <color_fragment>
        ${motion === "water" ? `
          float ripple = 0.965 + 0.035 * sin(uSceneryTime * 2.6 + vSceneryPosition.x * 0.035 + sin(vSceneryPosition.z * 0.045 - uSceneryTime) * 0.7);
          diffuseColor.rgb *= ripple;
        ` : ""}
        ${motion === "spray" ? `
          diffuseColor.a *= 0.82 + 0.14 * sin(uSceneryTime * 4.0 + vSceneryPhase * 2.0);
        ` : ""}`)
      .replace("#include <lights_fragment_begin>", `#include <lights_fragment_begin>
        ${motion === "fire" ? "totalEmissiveRadiance *= 0.82 + 0.18 * sin(uSceneryTime * 17.0 + vSceneryPhase * 3.0);" : ""}`);
  };
  const previousKey = material.customProgramCacheKey.bind(material);
  material.customProgramCacheKey = () => `${previousKey()}|scenery-${motion}`;
}

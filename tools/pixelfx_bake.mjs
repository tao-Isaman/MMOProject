#!/usr/bin/env node
// Bakes the pixel art effects the game plays (src/pixelfx.ts) from a pixelfx checkout
// (https://github.com/patch-gg/pixelfx, MIT; set PIXELFX to its folder, default ../pixelfx):
// a transparent sprite sheet each in public/assets/fx/<name>.png and one manifest,
// public/assets/fx/pixelfx.json, with each sheet's frame size, columns, frame count, fps and pivot.
//
//   node tools/pixelfx_bake.mjs            bake them all
//   node tools/pixelfx_bake.mjs hit_fire   bake some
import { join, resolve } from "node:path";
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const PIXELFX = resolve(process.env.PIXELFX ?? join(import.meta.dirname, "..", "..", "pixelfx"));
const { loadEffect, renderFrames, spriteSheet, save } = await import(join(PIXELFX, "tools/lib/fxlib.mjs"));
const OUT = join(import.meta.dirname, "..", "public/assets/fx");

// pixelfx's ramps (src/core/color.js PAL), dark to bright
const PAL = {
  fire: ["#1f0b10", "#4a1118", "#8c1d1c", "#cc3a1a", "#f2701f", "#ffae35", "#ffe27a", "#fff8d6"],
  holy: ["#2a1c08", "#5a3e10", "#9a6c18", "#d8a428", "#ffd84a", "#fff09a", "#fffbe6", "#ffffff"],
  leaf: ["#0c1a0e", "#163418", "#225224", "#357530", "#4f9a3a", "#7cc048", "#b4e070", "#e4ffb0"],
  wind: ["#0a2420", "#124038", "#1c6a58", "#2c9a7c", "#52c8a2", "#8ee8c8", "#ccfff0", "#ffffff"],
  shadow: ["#050308", "#0f0a18", "#1c1230", "#2c1a4a", "#432468", "#5e3290", "#8048b8", "#a970e0"],
  heal: ["#08201a", "#0f3f2c", "#17663e", "#24924e", "#3ec466", "#7ee88a", "#c8ffc4", "#ffffff"],
};

// name: [pixelfx id, options, fps (fewer frames for the long ones)]
const BAKE = {
  // hits on a monster
  hit_physical: ["impacts/hit-spark", {}, 30],
  hit_crit: ["impacts/crit-hit", {}, 30],
  hit_fire: ["explosions/plasma-explosion", { palette: PAL.fire, accent: ["#4a1118", "#cc3a1a", "#f2701f", "#ffae35", "#ffe27a"] }, 20],
  hit_arcane: ["explosions/plasma-explosion", {}, 20],
  hit_ice: ["ice/snowflake-burst", {}, 20],
  hit_lightning: ["lightning/zap-hit", {}, 30],
  hit_shadow: ["explosions/implosion", {}, 20],
  hit_holy: ["impacts/hit-spark", { palette: PAL.holy }, 30],
  hit_plant: ["impacts/hit-spark", { palette: PAL.leaf }, 30],
  hit_wind: ["impacts/hit-spark", { palette: PAL.wind }, 30],
  hit_poison: ["nature/acid-splash", {}, 20],
  hit_water: ["water/splash", {}, 20],
  hit_earth: ["impacts/blunt-hit", {}, 30],
  hit_metal: ["impacts/parry", {}, 30],
  // a weapon's cut on a monster
  slash: ["melee/sword-slash", {}, 30],
  thrust: ["melee/thrust", {}, 30],
  spin: ["melee/spin-slash", {}, 30],
  // round the caster as a skill goes off
  cast_fire: ["fire/fire-ring", {}, 20],
  cast_ice: ["ice/frost-nova", {}, 20],
  cast_lightning: ["lightning/thunderclap", {}, 20],
  cast_arcane: ["arcane/mana-burst", {}, 20],
  cast_holy: ["holy/heal-aoe", {}, 20],
  cast_earth: ["impacts/ground-slam", {}, 15],
  cast_plant: ["nature/thorns", {}, 20],
  // a monster falling
  death: ["spawn/poof", {}, 20],
};

const only = process.argv.slice(2);
const path = join(OUT, "pixelfx.json");
const manifest = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
for (const [name, [id, options, fps]] of Object.entries(BAKE)) {
  if (only.length && !only.includes(name)) continue;
  const fx = await loadEffect(id);
  const r = renderFrames(fx, { fps, actor: false, options, bg: "none" });
  const s = spriteSheet(fx, r, name), px = s.json.meta.pixelfx;
  save(join(OUT, `${name}.png`), s.png);
  manifest[name] = { id, fps: px.fps, frames: px.frames, w: px.frameSize[0], h: px.frameSize[1], cols: px.columns, pivot: px.pivot };
  console.log(`${name}  ${id}  ${px.frames} frames  ${px.frameSize.join("x")}`);
}
writeFileSync(path, JSON.stringify(manifest, null, 1) + "\n");

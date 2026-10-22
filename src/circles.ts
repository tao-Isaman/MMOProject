// Magic circles for spells being cast, drawn on canvases at runtime (the flower field's circle is
// a picture, assets/rune_circle.png). Every spell has a look of its own: two colours, the figure
// in the middle and the script its runes are written in. Each school writes differently: fire
// in sharp strokes with flicks, ice in straight lines at sixty degrees, arcane in rings and
// dots, nature in curls and leaves, the void in hooks and spirals. A look is drawn once and kept,
// as three discs: the rim (rings, runes, ticks), the figure (so the two can turn against each
// other), and a small sigil laid under what the spell is aimed at.

import type { Img } from "./types";

export type Script = "fire" | "ice" | "arcane" | "nature" | "void";
export type Figure = "triangle" | "sun" | "star5" | "octagram" | "snow" | "hexagram" | "eye" | "thorns" | "vines" | "rose" | "orbits" | "spiral";
// what rises round the circle while it fills (src/castfx.ts)
export type Motes = "ember" | "frost" | "wisp" | "leaf" | "petal" | "void";

export interface CircleLook {
  color: string;  // the glow
  light: string;  // the lines
  figure: Figure;
  script: Script;
  motes: Motes;
  size: number;   // cm across under the caster
  nodes?: number; // small circles strung on the inner ring
}

// One look per spell that is cast (the mage's spells with a cast time, progression.ts).
export const LOOKS: Record<string, CircleLook> = {
  fire_bolt:   { color: "#ff6a22", light: "#ffcf8a", figure: "triangle", script: "fire", motes: "ember", size: 230 },
  fire_ball:   { color: "#ff5e22", light: "#ffd890", figure: "sun", script: "fire", motes: "ember", size: 300, nodes: 6 },
  meteor:      { color: "#ff4a1c", light: "#ffd27a", figure: "octagram", script: "fire", motes: "ember", size: 420, nodes: 8 },
  cold_bolt:   { color: "#4fb4ff", light: "#bfe8ff", figure: "snow", script: "ice", motes: "frost", size: 230 },
  ice_lance:   { color: "#5cc8ff", light: "#b8ecff", figure: "hexagram", script: "ice", motes: "frost", size: 320, nodes: 6 },
  soul_volley: { color: "#7a88ff", light: "#cfcfff", figure: "star5", script: "arcane", motes: "wisp", size: 250, nodes: 5 },
  ruin_beam:   { color: "#6a86ff", light: "#c4d0ff", figure: "eye", script: "arcane", motes: "wisp", size: 380, nodes: 8 },
  thorn_bind:  { color: "#3fc45a", light: "#c6f7a0", figure: "thorns", script: "nature", motes: "leaf", size: 270 },
  vine_whip:   { color: "#4cc86a", light: "#c4f5b8", figure: "vines", script: "nature", motes: "leaf", size: 240 },
  petal_storm: { color: "#ff7cc4", light: "#ffc8e8", figure: "rose", script: "nature", motes: "petal", size: 340, nodes: 5 },
  gravity:     { color: "#8a66ff", light: "#d2c4ff", figure: "orbits", script: "void", motes: "void", size: 320, nodes: 3 },
  singularity: { color: "#6e44ff", light: "#cdb8ff", figure: "spiral", script: "void", motes: "void", size: 420, nodes: 6 },
};

// A look for a spell without one of its own, from its colour.
export function lookFor(id: string, color: string): CircleLook {
  return LOOKS[id] ?? { color, light: "#ffffff", figure: "star5", script: "arcane", motes: "wisp", size: 260 };
}

export interface CircleTextures {
  rim: Img;
  figure: Img;
  sigil: Img;
}

const cache = new Map<CircleLook, CircleTextures>();

export function circleTextures(look: CircleLook): CircleTextures {
  let t = cache.get(look);
  if (!t) {
    const seed = hash(`${look.script}${look.figure}${look.color}`);
    t = { rim: drawRim(look, seed), figure: drawFigure(look, 512, 175), sigil: drawSigil(look, seed) };
    cache.set(look, t);
  }
  return t;
}

// ---- drawing ----

type G = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

function canvas(size: number): [HTMLCanvasElement, G] {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.translate(size / 2, size / 2);
  g.lineCap = "round";
  g.lineJoin = "round";
  return [c, g];
}

// A seeded random source (mulberry32), so a look's runes are the same every time.
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// Stroke a path as glowing ink: a wide soft pass in the glow colour, then the thin bright line.
function ink(g: G, look: CircleLook, width: number, path: () => void, fill = false): void {
  g.save();
  g.beginPath();
  path();
  g.shadowColor = look.color;
  g.shadowBlur = width * 5;
  g.globalAlpha = 0.45;
  g.strokeStyle = look.color;
  g.lineWidth = width * 2.6;
  g.stroke();
  if (fill) {
    g.fillStyle = look.color;
    g.fill();
  }
  g.globalAlpha = 1;
  g.shadowBlur = width * 2;
  g.strokeStyle = look.light;
  g.lineWidth = width;
  g.stroke();
  if (fill) {
    g.fillStyle = look.light;
    g.globalAlpha = 0.8;
    g.fill();
  }
  g.restore();
}

const ring = (g: G, r: number) => () => {
  g.moveTo(r, 0);
  g.arc(0, 0, r, 0, TAU);
};

// A regular polygon (or star when step > 1) of n points on radius r, the first at angle a0.
function poly(g: G, n: number, r: number, a0 = -Math.PI / 2, step = 1): void {
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((i * step) % n) * (TAU / n);
    if (i) g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    else g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
}

function circleAt(g: G, x: number, y: number, r: number): void {
  g.moveTo(x + r, y);
  g.arc(x, y, r, 0, TAU);
}

// One rune of a script, in a cell of half-size h round the origin (up is outward on the rim).
function rune(g: G, script: Script, h: number, r: () => number): void {
  const pick = (p: number) => r() < p;
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    g.moveTo(x0 * h, y0 * h);
    g.lineTo(x1 * h, y1 * h);
  };
  switch (script) {
    case "fire": {
      // a stem with flame flicks, chevrons and zigzags: all straight, all sharp
      if (pick(0.75)) line(0, 1, 0, -1);
      if (pick(0.6)) { g.moveTo(-0.6 * h, 0.15 * h); g.lineTo(0, -0.55 * h); g.lineTo(0.6 * h, 0.15 * h); }
      const s = pick(0.5) ? 1 : -1;
      if (pick(0.7)) line(0, -0.1, 0.65 * s, -0.85);
      if (pick(0.4)) line(-0.55, 1, 0.55, 1);
      if (pick(0.35)) { g.moveTo(-0.7 * h, 0.55 * h); g.lineTo(-0.25 * h, 0.1 * h); g.lineTo(0.2 * h, 0.55 * h); g.lineTo(0.65 * h, 0.1 * h); }
      break;
    }
    case "ice": {
      // straight strokes at 0, 60 and 120 degrees, barbed ends, a small diamond
      const angles = [90, 30, 150].filter(() => pick(0.65));
      if (!angles.length) angles.push(90);
      for (const d of angles) {
        const a = (d * Math.PI) / 180, x = Math.cos(a), y = Math.sin(a);
        line(-x, -y, x, y);
        if (pick(0.5)) {
          const bx = -y * 0.3, by = x * 0.3;
          line(x * 0.7 - bx, y * 0.7 - by, x * 0.7 + bx, y * 0.7 + by);
        }
      }
      if (pick(0.45)) { g.moveTo(0, -0.35 * h); g.lineTo(0.25 * h, 0); g.lineTo(0, 0.35 * h); g.lineTo(-0.25 * h, 0); g.closePath(); }
      break;
    }
    case "arcane": {
      // rings, half rings, a bar and dots, like alchemists' marks
      const cy = pick(0.5) ? -0.35 : 0.35;
      if (pick(0.7)) circleAt(g, 0, cy * h, 0.42 * h);
      else { g.moveTo(-0.5 * h, cy * h); g.arc(0, cy * h, 0.5 * h, Math.PI, 0, cy > 0); }
      if (pick(0.7)) line(0, -cy * 0.2, 0, -cy * 2.6);
      if (pick(0.5)) line(-0.55, -cy * 1.6, 0.55, -cy * 1.6);
      if (pick(0.55)) circleAt(g, (pick(0.5) ? 0.62 : -0.62) * h, -cy * 1.2 * h, 0.1 * h);
      break;
    }
    case "nature": {
      // a curling stem, leaves, a fork
      const s = pick(0.5) ? 1 : -1;
      g.moveTo(0, h);
      g.quadraticCurveTo(-0.8 * s * h, 0, 0, -0.55 * h);
      g.arc(0.28 * s * h, -0.55 * h, 0.28 * h, Math.PI, s > 0 ? TAU * 0.85 : Math.PI * 0.15, s < 0);
      if (pick(0.65)) {
        g.moveTo(0, 0.25 * h);
        g.quadraticCurveTo(0.55 * s * h, -0.05 * h, 0.75 * s * h, 0.45 * h);
        g.quadraticCurveTo(0.3 * s * h, 0.55 * h, 0, 0.25 * h);
      }
      if (pick(0.4)) { g.moveTo(-0.15 * s * h, 0.55 * h); g.quadraticCurveTo(-0.6 * s * h, 0.35 * h, -0.7 * s * h, -0.1 * h); }
      break;
    }
    case "void": {
      // hooks, crescents, a slashed ring and spirals
      const kind = Math.floor(r() * 3);
      if (kind === 0) {
        for (let i = 0; i <= 24; i++) {
          const t = i / 24, a = t * TAU * 1.25, rr = h * (0.1 + 0.85 * t);
          if (i) g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
          else g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
      } else if (kind === 1) {
        g.moveTo(0.2 * h, -0.9 * h);
        g.arc(0, 0, 0.92 * h, -Math.PI * 0.42, Math.PI * 0.42, true);
        g.arc(0.45 * h, 0, 0.62 * h, Math.PI * 0.62, -Math.PI * 0.62, false);
      } else {
        circleAt(g, 0, 0, 0.55 * h);
        line(-0.85, 0.85, 0.85, -0.85);
      }
      if (pick(0.5)) { g.moveTo(-0.7 * h, h); g.lineTo(-0.7 * h, 0.2 * h); g.arc(-0.35 * h, 0.2 * h, 0.35 * h, Math.PI, TAU * 0.9); }
      break;
    }
  }
}

// The rim: rings, a band of runes and a ring of ticks, nodes for some looks, a faint glow inside.
function drawRim(look: CircleLook, seed: number): HTMLCanvasElement {
  const [c, g] = canvas(512);
  const r = rng(seed);
  const glow = g.createRadialGradient(0, 0, 60, 0, 0, 252);
  glow.addColorStop(0, "rgba(0,0,0,0)");
  glow.addColorStop(0.85, withAlpha(look.color, 0.12));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = glow;
  g.fillRect(-256, -256, 512, 512);
  ink(g, look, 3, ring(g, 246));
  ink(g, look, 1.4, ring(g, 238));
  // the runes, read outward round the band, dots between
  const n = 20 + Math.floor(r() * 8);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    g.save();
    g.rotate(a);
    g.translate(0, -218);
    ink(g, look, 2, () => rune(g, look.script, 12, r));
    g.restore();
    g.save();
    g.rotate(a + Math.PI / n);
    ink(g, look, 1.5, () => circleAt(g, 0, -218, 1.6), true);
    g.restore();
  }
  ink(g, look, 2.4, ring(g, 198));
  ink(g, look, 1, ring(g, 192));
  // ticks: fire and ice cut short marks, arcane steps them, nature hangs leaves, the void dashes
  const ticks = look.script === "nature" ? 24 : 72;
  ink(g, look, 1.3, () => {
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * TAU, cs = Math.cos(a), sn = Math.sin(a);
      if (look.script === "nature") {
        const x = cs * 182, y = sn * 182, tx = -sn * 7, ty = cs * 7;
        g.moveTo(x - tx, y - ty);
        g.quadraticCurveTo(x + cs * 9, y + sn * 9, x + tx, y + ty);
        g.quadraticCurveTo(x - cs * 9, y - sn * 9, x - tx, y - ty);
      } else if (look.script === "void") {
        g.moveTo(Math.cos(a) * 184, Math.sin(a) * 184);
        g.arc(0, 0, 184, a, a + (TAU / ticks) * 0.55);
      } else {
        const long = look.script === "arcane" ? i % 6 === 0 : i % 3 === 0;
        const r0 = long ? 176 : 182;
        g.moveTo(cs * r0, sn * r0);
        g.lineTo(cs * 188, sn * 188);
      }
    }
  });
  if (look.nodes) {
    for (let i = 0; i < look.nodes; i++) {
      const a = (i / look.nodes) * TAU - Math.PI / 2, x = Math.cos(a) * 195, y = Math.sin(a) * 195;
      ink(g, look, 2, () => circleAt(g, x, y, 13));
      g.save();
      g.translate(x, y);
      g.rotate(a + Math.PI / 2);
      ink(g, look, 1.3, () => rune(g, look.script, 6.5, r));
      g.restore();
    }
  }
  return c;
}

// The figure in the middle, within radius R of a canvas `size` across.
function drawFigure(look: CircleLook, size: number, R: number): HTMLCanvasElement {
  const [c, g] = canvas(size);
  const w = R / 175; // line widths scale with the figure
  const k = (v: number) => v * w;
  switch (look.figure) {
    case "triangle":
      ink(g, look, k(2.6), () => poly(g, 3, R));
      ink(g, look, k(1.8), () => poly(g, 3, R * 0.5, Math.PI / 2));
      ink(g, look, k(1.6), () => { circleAt(g, 0, 0, R * 0.5); circleAt(g, 0, 0, R * 0.2); });
      ink(g, look, k(1.6), () => { for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i * TAU) / 3; circleAt(g, Math.cos(a) * R, Math.sin(a) * R, R * 0.09); } });
      break;
    case "sun":
      ink(g, look, k(2.2), () => { circleAt(g, 0, 0, R * 0.38); circleAt(g, 0, 0, R * 0.2); });
      ink(g, look, k(1.8), () => {
        // flame petals, each with a little curl at the tip
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * TAU, d = 0.17, r0 = R * 0.4;
          g.moveTo(Math.cos(a - d) * r0, Math.sin(a - d) * r0);
          g.quadraticCurveTo(Math.cos(a - 0.12) * R * 0.78, Math.sin(a - 0.12) * R * 0.78, Math.cos(a + 0.05) * R, Math.sin(a + 0.05) * R);
          g.quadraticCurveTo(Math.cos(a + 0.1) * R * 0.7, Math.sin(a + 0.1) * R * 0.7, Math.cos(a + d) * r0, Math.sin(a + d) * r0);
        }
      });
      ink(g, look, k(1.6), () => { poly(g, 3, R * 0.19); poly(g, 3, R * 0.19, Math.PI / 2); });
      break;
    case "star5":
      ink(g, look, k(2.4), () => poly(g, 5, R * 0.97, -Math.PI / 2, 2));
      ink(g, look, k(1.6), () => poly(g, 5, R * 0.97));
      ink(g, look, k(1.8), () => { circleAt(g, 0, 0, R * 0.38); poly(g, 5, R * 0.36, Math.PI / 2); });
      break;
    case "octagram":
      ink(g, look, k(2.4), () => { poly(g, 4, R * 0.95, 0); poly(g, 4, R * 0.95, Math.PI / 4); });
      ink(g, look, k(1.8), () => { circleAt(g, 0, 0, R * 0.68); circleAt(g, 0, 0, R * 0.3); });
      ink(g, look, k(1.4), () => {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU;
          g.moveTo(Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3);
          g.lineTo(Math.cos(a) * R * 0.68, Math.sin(a) * R * 0.68);
        }
        // small worlds circling the star
        for (let i = 0; i < 4; i++) { const a = Math.PI / 8 + (i * TAU) / 4; circleAt(g, Math.cos(a) * R * 0.82, Math.sin(a) * R * 0.82, R * 0.1); }
      });
      break;
    case "snow":
      ink(g, look, k(2.4), () => {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU - Math.PI / 2, x = Math.cos(a), y = Math.sin(a);
          g.moveTo(0, 0);
          g.lineTo(x * R * 0.95, y * R * 0.95);
          for (const [f, l] of [[0.45, 0.28], [0.7, 0.2]]) {
            for (const s of [-1, 1]) {
              const b = a + s * 0.9;
              g.moveTo(x * R * f, y * R * f);
              g.lineTo(x * R * f + Math.cos(b) * R * l, y * R * f + Math.sin(b) * R * l);
            }
          }
        }
      });
      ink(g, look, k(1.6), () => { poly(g, 6, R * 0.3); circleAt(g, 0, 0, R * 0.12); });
      ink(g, look, k(1.4), () => { for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU - Math.PI / 2; g.save(); g.translate(Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95); g.rotate(a); poly(g, 4, R * 0.06, 0); g.restore(); } });
      break;
    case "hexagram":
      ink(g, look, k(2.4), () => { poly(g, 3, R * 0.95); poly(g, 3, R * 0.95, Math.PI / 2); });
      ink(g, look, k(1.8), () => { poly(g, 6, R * 0.55, 0); circleAt(g, 0, 0, R * 0.32); });
      ink(g, look, k(1.4), () => {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU - Math.PI / 2;
          circleAt(g, Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95, R * 0.06);
          g.moveTo(Math.cos(a + Math.PI / 6) * R * 0.32, Math.sin(a + Math.PI / 6) * R * 0.32);
          g.lineTo(Math.cos(a + Math.PI / 6) * R * 0.55, Math.sin(a + Math.PI / 6) * R * 0.55);
        }
      });
      break;
    case "eye":
      ink(g, look, k(2.4), () => {
        g.moveTo(-R * 0.95, 0);
        g.quadraticCurveTo(0, -R * 0.75, R * 0.95, 0);
        g.quadraticCurveTo(0, R * 0.75, -R * 0.95, 0);
      });
      ink(g, look, k(2), () => { circleAt(g, 0, 0, R * 0.32); circleAt(g, 0, 0, R * 0.13); });
      ink(g, look, k(1.3), () => {
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * TAU;
          g.moveTo(Math.cos(a) * R * 0.38, Math.sin(a) * R * 0.38);
          g.lineTo(Math.cos(a) * R * (i % 2 ? 0.48 : 0.56), Math.sin(a) * R * (i % 2 ? 0.48 : 0.56));
        }
        poly(g, 8, R * 0.95, Math.PI / 8);
      });
      break;
    case "thorns":
      ink(g, look, k(2), () => {
        circleAt(g, 0, 0, R * 0.72);
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * TAU, d = 0.07, s = i % 2 ? 0.95 : 0.86;
          g.moveTo(Math.cos(a - d) * R * 0.72, Math.sin(a - d) * R * 0.72);
          g.lineTo(Math.cos(a + 0.03) * R * s, Math.sin(a + 0.03) * R * s);
          g.lineTo(Math.cos(a + d) * R * 0.72, Math.sin(a + d) * R * 0.72);
        }
      });
      ink(g, look, k(1.8), () => {
        // a triple knot of three rings
        for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i * TAU) / 3; circleAt(g, Math.cos(a) * R * 0.22, Math.sin(a) * R * 0.22, R * 0.34); }
        circleAt(g, 0, 0, R * 0.1);
      });
      break;
    case "vines":
      ink(g, look, k(2.2), () => {
        for (let v = 0; v < 3; v++) {
          const a0 = (v / 3) * TAU;
          for (let i = 0; i <= 40; i++) {
            const t = i / 40, a = a0 + t * Math.PI * 1.3, rr = R * (0.12 + 0.82 * t);
            if (i) g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
            else g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
          }
        }
        circleAt(g, 0, 0, R * 0.12);
      });
      ink(g, look, k(1.5), () => {
        // leaves along the vines
        for (let v = 0; v < 3; v++) {
          for (const t of [0.35, 0.6, 0.85]) {
            const a = (v / 3) * TAU + t * Math.PI * 1.3, rr = R * (0.12 + 0.82 * t);
            const x = Math.cos(a) * rr, y = Math.sin(a) * rr, ox = Math.cos(a + 1.2) * R * 0.16, oy = Math.sin(a + 1.2) * R * 0.16;
            g.moveTo(x, y);
            g.quadraticCurveTo(x + ox * 0.6 - oy * 0.35, y + oy * 0.6 + ox * 0.35, x + ox, y + oy);
            g.quadraticCurveTo(x + ox * 0.6 + oy * 0.35, y + oy * 0.6 - ox * 0.35, x, y);
          }
        }
      });
      break;
    case "rose":
      ink(g, look, k(1.9), () => { for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * TAU) / 5; circleAt(g, Math.cos(a) * R * 0.42, Math.sin(a) * R * 0.42, R * 0.42); } });
      ink(g, look, k(1.6), () => {
        circleAt(g, 0, 0, R * 0.84);
        for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + (i * TAU) / 5; circleAt(g, Math.cos(a) * R * 0.16, Math.sin(a) * R * 0.16, R * 0.16); }
      });
      break;
    case "orbits":
      ink(g, look, k(2), () => {
        for (let i = 0; i < 3; i++) {
          g.save();
          g.rotate((i * Math.PI) / 3);
          g.moveTo(R * 0.92, 0);
          g.ellipse(0, 0, R * 0.92, R * 0.3, 0, 0, TAU);
          g.restore();
        }
      });
      ink(g, look, k(1.8), () => { circleAt(g, 0, 0, R * 0.18); circleAt(g, 0, 0, R * 0.08); });
      ink(g, look, k(1.4), () => {
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI) / 3, t = 0.9 + i * 1.7, x = Math.cos(t) * R * 0.92, y = Math.sin(t) * R * 0.3;
          circleAt(g, x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), R * 0.05);
        }
      }, true);
      break;
    case "spiral":
      for (const [width, alpha] of [[2.6, 1], [1.2, 0.7]] as const) {
        ink(g, look, k(width), () => {
          for (let v = 0; v < 5; v++) {
            const a0 = (v / 5) * TAU + (alpha < 1 ? 0.35 : 0);
            for (let i = 0; i <= 40; i++) {
              const t = i / 40, a = a0 + t * Math.PI * 1.6, rr = R * (0.16 + 0.8 * t ** 0.8);
              if (i) g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
              else g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
            }
          }
        });
      }
      ink(g, look, k(2), () => { circleAt(g, 0, 0, R * 0.16); circleAt(g, 0, 0, R * 0.07); });
      break;
  }
  return c;
}

// The sigil under a spell's target: two rings, a few runes and the look's figure small.
function drawSigil(look: CircleLook, seed: number): HTMLCanvasElement {
  const [c, g] = canvas(256);
  const r = rng(seed ^ 0x5bd1e995);
  ink(g, look, 2.4, ring(g, 122));
  ink(g, look, 1.2, ring(g, 114));
  for (let i = 0; i < 8; i++) {
    g.save();
    g.rotate((i / 8) * TAU);
    g.translate(0, -100);
    ink(g, look, 1.6, () => rune(g, look.script, 8, r));
    g.restore();
  }
  ink(g, look, 1.6, ring(g, 86));
  g.drawImage(drawFigure(look, 256, 80), -128, -128);
  return c;
}

// "#rrggbb" as rgba with an alpha.
function withAlpha(hex: string, a: number): string {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${v[0]}, ${v[1]}, ${v[2]}, ${a})`;
}

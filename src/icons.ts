// Skill, mastery and element icons, drawn as vector glyphs on a tinted gem so every skill reads
// at 40 px. icon(glyph, color) returns a cached 96 px canvas.

const SIZE = 96;
const cache = new Map<string, HTMLCanvasElement>();
type G = CanvasRenderingContext2D;
type Pt = [number, number];

export function icon(glyph: string, color: string): HTMLCanvasElement {
  const key = `${glyph}|${color}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const g = c.getContext("2d")!;
  // gem: dark rim, coloured body lit from the top left
  const r = 14;
  rounded(g, 3, 3, SIZE - 6, SIZE - 6, r);
  g.fillStyle = "#14110c";
  g.fill();
  const body = g.createRadialGradient(SIZE * 0.35, SIZE * 0.3, 4, SIZE / 2, SIZE / 2, SIZE * 0.7);
  body.addColorStop(0, mix(color, "#ffffff", 0.35));
  body.addColorStop(0.55, color);
  body.addColorStop(1, mix(color, "#000000", 0.6));
  rounded(g, 7, 7, SIZE - 14, SIZE - 14, r - 4);
  g.fillStyle = body;
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = "rgba(255, 244, 214, 0.55)";
  g.stroke();
  // glyph in cream with a dark outline
  g.save();
  g.translate(SIZE / 2, SIZE / 2);
  g.lineJoin = "round";
  g.lineCap = "round";
  const path = GLYPHS[glyph] ?? GLYPHS.star;
  g.strokeStyle = "rgba(20, 14, 8, 0.85)";
  g.fillStyle = "rgba(20, 14, 8, 0.85)";
  g.lineWidth = 11;
  path(g, true);
  g.strokeStyle = "#fff6e0";
  g.fillStyle = "#fff6e0";
  g.lineWidth = 5;
  path(g, false);
  g.restore();
  cache.set(key, c);
  return c;
}

function rounded(g: G, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function mix(a: string, b: string, t: number): string {
  const pa = parse(a), pb = parse(b);
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
}

function parse(hex: string): number[] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

// Each glyph draws centred on 0,0 within about ±30 px; `under` is the outline pass.
const line = (g: G, pts: Pt[]) => {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
};
const poly = (g: G, pts: Pt[]) => {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
};
const dot = (g: G, x: number, y: number, r: number, under: boolean) => {
  g.beginPath();
  g.arc(x, y, r + (under ? 3 : 0), 0, Math.PI * 2);
  g.fill();
};
const star = (g: G, x: number, y: number, r: number, under: boolean) => {
  const k = under ? 3 : 0, pts: Pt[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4, rr = (i % 2 ? r * 0.35 : r) + k;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  poly(g, pts);
};

const GLYPHS: Record<string, (g: G, under: boolean) => void> = {
  star: (g, u) => star(g, 0, 0, 26, u),
  bolt: (g, u) => {
    line(g, [[-24, 22], [10, -12]]);
    star(g, 14, -14, 15, u);
  },
  burst: (g, u) => {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      line(g, [[Math.cos(a) * 12, Math.sin(a) * 12], [Math.cos(a) * 28, Math.sin(a) * 28]]);
    }
    dot(g, 0, 0, 8, u);
  },
  beam: (g, u) => {
    line(g, [[-28, 10], [28, -10]]);
    line(g, [[-28, -2], [20, -19]]);
    dot(g, -24, 6, 9, u);
  },
  flower: (g, u) => {
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      dot(g, Math.cos(a) * 14, Math.sin(a) * 14, 9, u);
    }
    g.save();
    if (!u) g.fillStyle = "#ffd36a";
    dot(g, 0, 0, 7, u);
    g.restore();
  },
  heal: (g, u) => {
    const k = u ? 3 : 0;
    poly(g, [[-7 - k, -24 - k], [7 + k, -24 - k], [7 + k, -7 - k], [24 + k, -7 - k], [24 + k, 7 + k], [7 + k, 7 + k], [7 + k, 24 + k],
      [-7 - k, 24 + k], [-7 - k, 7 + k], [-24 - k, 7 + k], [-24 - k, -7 - k], [-7 - k, -7 - k]]);
  },
  heart: (g, u) => {
    const k = u ? 3 : 0;
    g.beginPath();
    g.moveTo(0, 22 + k);
    g.bezierCurveTo(-34 - k, 0, -18, -26 - k, 0, -10);
    g.bezierCurveTo(18, -26 - k, 34 + k, 0, 0, 22 + k);
    g.fill();
  },
  shield: (g, u) => {
    const k = u ? 3 : 0;
    g.beginPath();
    g.moveTo(0, -26 - k);
    g.lineTo(22 + k, -16 - k);
    g.quadraticCurveTo(22 + k, 14, 0, 28 + k);
    g.quadraticCurveTo(-22 - k, 14, -22 - k, -16 - k);
    g.closePath();
    g.fill();
  },
  wave: (g) => {
    for (const r of [10, 20, 30]) {
      g.beginPath();
      g.arc(-12, 0, r, -0.9, 0.9);
      g.stroke();
    }
  },
  swirl: (g) => {
    g.beginPath();
    for (let t = 0; t < 4 * Math.PI; t += 0.2) {
      const r = 3 + t * 2.2;
      const x = Math.cos(t) * r, y = Math.sin(t) * r;
      if (t) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.stroke();
  },
  freeze: (g) => {
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      line(g, [[Math.cos(a) * -26, Math.sin(a) * -26], [Math.cos(a) * 26, Math.sin(a) * 26]]);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3, x = Math.cos(a) * 17, y = Math.sin(a) * 17;
      line(g, [[x + Math.cos(a + 0.9) * 7, y + Math.sin(a + 0.9) * 7], [x, y], [x + Math.cos(a - 0.9) * 7, y + Math.sin(a - 0.9) * 7]]);
    }
  },
  thorn: (g) => {
    g.beginPath();
    g.moveTo(-24, 22);
    g.bezierCurveTo(-6, 6, 8, 4, 24, -24);
    g.stroke();
    for (const [x, y] of [[-12, 12], [2, 2], [14, -10]]) line(g, [[x, y], [x - 8, y - 9]]);
  },
  pierce: (g, u) => {
    line(g, [[-26, 26], [16, -16]]);
    poly(g, [[26 + (u ? 3 : 0), -26 - (u ? 3 : 0)], [8, -18], [18, -8]]);
  },
  up: (g, u) => {
    const k = u ? 3 : 0;
    poly(g, [[0, -26 - k], [22 + k, 0], [8, 0], [8, 24 + k], [-8, 24 + k], [-8, 0], [-22 - k, 0]]);
  },
  drop: (g, u) => {
    const k = u ? 3 : 0;
    g.beginPath();
    g.moveTo(0, -28 - k);
    g.bezierCurveTo(20 + k, -2, 22 + k, 26 + k, 0, 26 + k);
    g.bezierCurveTo(-22 - k, 26 + k, -20 - k, -2, 0, -28 - k);
    g.fill();
  },
  spin: (g) => {
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      g.beginPath();
      g.arc(0, 0, 22, a, a + 1.4);
      g.stroke();
      const x = Math.cos(a + 1.4) * 22, y = Math.sin(a + 1.4) * 22;
      line(g, [[x - 6, y - 4], [x, y], [x - 2, y + 7]]);
    }
  },
  slam: (g) => {
    line(g, [[0, -28], [0, 6]]);
    line(g, [[-10, -4], [0, 8], [10, -4]]);
    line(g, [[-26, 22], [-12, 14], [0, 24], [12, 14], [26, 22]]);
  },
  rage: (g, u) => {
    const k = u ? 3 : 0;
    g.beginPath();
    g.moveTo(0, -28 - k);
    g.bezierCurveTo(20 + k, -6, 24 + k, 26 + k, 0, 26 + k);
    g.bezierCurveTo(-24 - k, 26 + k, -16 - k, 0, -6, -10);
    g.bezierCurveTo(-4, 0, 4, 2, 0, -28 - k);
    g.fill();
  },
  bash: (g, u) => {
    GLYPHS.shield(g, u);
    if (!u) {
      g.strokeStyle = "rgba(20, 14, 8, 0.85)";
      g.lineWidth = 4;
      line(g, [[-10, -6], [10, 10]]);
      line(g, [[10, -6], [-10, 10]]);
    }
  },
  cry: (g) => {
    for (const r of [8, 17, 26]) {
      g.beginPath();
      g.arc(-14, 0, r, -0.8, 0.8);
      g.stroke();
    }
    dot(g, -18, 0, 5, false);
  },
  dash: (g, u) => {
    line(g, [[-26, -12], [-4, -12]]);
    line(g, [[-30, 2], [-8, 2]]);
    line(g, [[-26, 16], [-4, 16]]);
    const k = u ? 3 : 0;
    poly(g, [[26 + k, 2], [2 - k, -18 - k], [2 - k, 22 + k]]);
  },
  twin: (g) => {
    line(g, [[-22, -24], [10, 26]]);
    line(g, [[-6, -26], [24, 22]]);
  },
  storm: (g, u) => {
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + 0.4;
      line(g, [[Math.cos(a) * 8, Math.sin(a) * 8], [Math.cos(a + 0.5) * 28, Math.sin(a + 0.5) * 28]]);
    }
    GLYPHS.swirl(g, u);
  },
  fan: (g) => {
    for (const a of [-0.55, -0.28, 0, 0.28, 0.55]) {
      const x = Math.sin(a) * 28, y = -Math.cos(a) * 28;
      line(g, [[0, 24], [x, y]]);
    }
  },
  eye: (g, u) => {
    g.beginPath();
    g.moveTo(-28, 0);
    g.quadraticCurveTo(0, -24, 28, 0);
    g.quadraticCurveTo(0, 24, -28, 0);
    g.stroke();
    dot(g, 0, 0, 8, u);
  },
  leaf: (g, u) => {
    const k = u ? 3 : 0;
    g.beginPath();
    g.moveTo(-22 - k, 22 + k);
    g.bezierCurveTo(-22, -18, 6, -26, 26 + k, -26 - k);
    g.bezierCurveTo(24, 0, 8, 22, -22 - k, 22 + k);
    g.fill();
  },
  earth: (g, u) => {
    const k = u ? 3 : 0;
    poly(g, [[-30 - k, 22 + k], [-10, -16 - k], [0, -2], [10, -22 - k], [30 + k, 22 + k]]);
  },
  flame: (g, u) => GLYPHS.rage(g, u),
  arrow: (g, u) => {
    line(g, [[-22, 22], [16, -16]]);
    poly(g, [[26 + (u ? 4 : 0), -26 - (u ? 4 : 0)], [6 - (u ? 3 : 0), -20], [20, -6 + (u ? 3 : 0)]]);
    line(g, [[-22, 22], [-28, 10]]);
    line(g, [[-22, 22], [-10, 28]]);
  },
  cross: (g) => {
    line(g, [[0, -26], [0, 26]]);
    line(g, [[-17, -9], [17, -9]]);
  },
  target: (g, u) => {
    g.beginPath();
    g.arc(0, 0, 18, 0, Math.PI * 2);
    g.stroke();
    dot(g, 0, 0, 5, u);
    line(g, [[-28, 0], [-20, 0]]);
    line(g, [[20, 0], [28, 0]]);
    line(g, [[0, -28], [0, -20]]);
    line(g, [[0, 20], [0, 28]]);
  },
  down: (g) => {
    line(g, [[0, -24], [0, 22]]);
    line(g, [[-15, 8], [0, 22], [15, 8]]);
  },
  wing: (g) => {
    line(g, [[-22, 20], [-6, -6], [18, -24]]);
    line(g, [[-14, 22], [4, 2], [24, -10]]);
    line(g, [[-4, 24], [12, 12], [26, 6]]);
  },
  sword: (g, u) => {
    line(g, [[-20, 20], [22, -22]]);
    line(g, [[-24, 8], [-8, 24]]);
    dot(g, -24, 24, 4, u);
  },
};

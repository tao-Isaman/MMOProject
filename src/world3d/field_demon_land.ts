// ดินแดนอสูร (the demon lands), beyond the border line: purple-black ground under a dark sky,
// dead trees, dark glowing crystals, bones of great beasts and chasms that glow from below
// (monsters Lv 85-100). The way in is from the border line in the west:
//   - a last Kradia scout's camp by the way in;
//   - the citadel in the east: a broad black plateau (3.6 m) with a higher step on it (7.2 m)
//     where the demon gate stands facing west, braziers of purple fire and crystals round its
//     forecourt; a ramp up each step;
//   - in the north-west, the crystal mesa (4.2 m) crowned by a giant dark crystal (ramp on its
//     south-east face);
//   - three chasms at ground level, glowing from far below, cracks running off them;
//   - in the south-west, the bone field: a giant's skeleton among crystals and purple fire;
//   - (v0.4) a track north off the main one, between the northern chasm and the citadel, through a
//     pass in the black wall to the thornland (the middle of the north edge), and one south past
//     the bone field's chasm and under the citadel, through a pass in the south wall to the demon
//     army's camp.
// Full size, north +X, west +Y; finishField scales it by TOWN_SCALE.

import * as THREE from "three";
import { FieldBuilder } from "./field";
import { useKits, colourways } from "./town";
import type { Town } from "./town";
import type { Poly } from "./paved";
import { material } from "./textures";
import { KIT as FRONTIER, subdiv, BLIGHT, DARK_ROCK, chaikin, bandPoly, distToPath, rampOff, nearRamp } from "./kits/frontier";
import type { XY } from "./kits/frontier";
import { KIT as KRADIA } from "./kits/kradia";
import type { NpcSpec } from "../npcs";

useKits(FRONTIER, KRADIA);
colourways({
  frontier_blight: BLIGHT,
  frontier_dark: DARK_ROCK,
  frontier_hellfire: { Kradia_Flame: "Frontier_Hellfire", FireGlow: "Frontier_CrystalCore", StoneGrey: "Frontier_Obsidian", Kradia_StoneDeep: "Frontier_Obsidian", GoldTrim: "IronDark" },
  frontier_ashgrass: { Frontier_DryGrass: "Frontier_BlightEdge", Frontier_RustGrass: "Frontier_Soot" },
});

const R = 5500;
const A = 9000;

// ---- the raised ground ----
// the black walls north and south (scenery); (v0.4) each cut by a pass, the part east of it on
// its own (NRIM_E, SRIM_E below)
const NRIM: XY[] = [[5300, A], [5600, 2000], [5250, 450], [A, 450], [A, A]];
const SRIM: XY[] = [[-5300, A], [-A, A], [-A, -600], [-5320, -600], [-5200, 0], [-5600, 2000]];
// the citadel: a broad plateau running on east out of the bounds, the gate's step on it
const CITADEL: XY[] = [[3300, -1700], [3900, -3500], [3400, -A], [-3400, -A], [-3900, -3500], [-3300, -1700], [-1500, -1200], [1500, -1200]];
const KEEP: XY[] = [[1500, -3100], [1700, -4400], [1200, -5700], [-1200, -5700], [-1700, -4400], [-1500, -3100], [-600, -2900], [600, -2900]];
// the crystal mesa in the north-west
const MESA: XY[] = [[4800, 2600], [4700, 4400], [3900, 5200], [2600, 5000], [2000, 3900], [2400, 2700], [3500, 2300]];

const R_CITADEL = rampOff([-1500, -1200], [1500, -1200], 0.25, 1180, 500, [0, -3000]);
const R_KEEP = rampOff([-600, -2900], [600, -2900], 0.5, 1150, 480, [0, -4200]);
const R_MESA = rampOff([2400, 2700], [3500, 2300], 0.5, 1320, 460, [3500, 3800]);
const RAMPS = [R_CITADEL, R_KEEP, R_MESA];

const GATE: XY = [0, -4250];
const CRYSTAL: XY = [3550, 3900];
const BONES: XY = [-3300, 1300];
const CAMP: XY = [-600, 4300];
const EXIT: XY = [0, 5150], BACK: XY = [40, 4450];

// ---- v0.4: the ways north to the thornland and south to the demon camp, through passes in the
// black walls, where those fields' own ways out are ----
const NRIM_E: XY[] = [[A, -450], [5250, -450], [5700, -2500], [5300, -A], [A, -A]];
const SRIM_E: XY[] = [[-A, -1500], [-5500, -1500], [-5700, -2500], [-5300, -A], [-A, -A]];
const N_EXIT: XY = [5150, 0], N_BACK: XY = [4450, 0];
const S_EXIT: XY = [-5150, -1050], S_BACK: XY = [-4450, -1050];
const TO_THORNS = chaikin([[-500, 600], [300, 300], [1300, 50], [2500, -280], [3700, -150], [4500, 0], N_EXIT, [A + 200, 0]], 3);
const TO_CAMP = chaikin([[-700, 300], [-1300, -80], [-2100, -600], [-3000, -800], [-3900, -950], [-4600, -1050], S_EXIT, [-A - 200, -1050]], 3);

// the chasms' centre lines and widths
const CHASMS: [XY[], number][] = [
  [[[4700, 1200], [4000, 600], [3300, 900], [2500, 300], [1800, 500]], 420],
  [[[-1500, 3700], [-2300, 3000], [-3100, 3300], [-3900, 2600], [-4700, 2800]], 400],
  [[[-1900, 500], [-2600, -100], [-3400, 200], [-4300, -400]], 360],
];

// A chasm's outline: a jagged band along its centre line, narrowing at both ends.
function chasmPoly(line: XY[], width: number, seed: number): XY[] {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pts = chaikin(line, 2), n = pts.length;
  const left: XY[] = [], right: XY[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const t = i / (n - 1), taper = Math.pow(Math.sin(Math.PI * (0.06 + 0.88 * t)), 0.6);
    const wl = (width / 2) * taper * (0.7 + rnd() * 0.5), wr = (width / 2) * taper * (0.7 + rnd() * 0.5);
    left.push([pts[i][0] + nx * wl, pts[i][1] + ny * wl]);
    right.push([pts[i][0] - nx * wr, pts[i][1] - ny * wr]);
  }
  return [...left, ...right.reverse()];
}

// The rock walls down into a chasm and the glow at its floor (three.js space: x, z up -> y, -y).
function chasmMesh(polys: XY[][], depth: number): THREE.Object3D {
  const pos: number[] = [], uv: number[] = [];
  for (const poly of polys) {
    let u = 0;
    for (let i = 0; i < poly.length; i++) {
      const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
      const L = Math.hypot(bx - ax, by - ay), u1 = u + L / 300;
      pos.push(ax, 2, -ay, bx, 2, -by, bx, -depth, -by, ax, 2, -ay, bx, -depth, -by, ax, -depth, -ay);
      uv.push(u, 0, u1, 0, u1, depth / 300, u, 0, u1, depth / 300, u, depth / 300);
      u = u1;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  const mat = material("Frontier_CliffDark").clone();
  mat.side = THREE.DoubleSide;
  const walls = new THREE.Mesh(geo, mat);
  walls.receiveShadow = true;
  return walls;
}

// The bright seam of fire down the middle of each chasm's floor (three.js space).
function seams(chasms: [XY[], number][], level: number): THREE.Mesh {
  const pos: number[] = [];
  for (const [line, w] of chasms) {
    const pts = chaikin(line, 2), n = pts.length;
    for (let i = 0; i + 1 < n; i++) {
      const t0 = i / (n - 1), t1 = (i + 1) / (n - 1);
      const side = (k: number, t: number): XY => {
        const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const half = w * 0.16 * Math.sin(Math.PI * (0.08 + 0.84 * t));
        return [(-(b[1] - a[1]) / L) * half, ((b[0] - a[0]) / L) * half];
      };
      const [n0x, n0y] = side(i, t0), [n1x, n1y] = side(i + 1, t1);
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      pos.push(ax - n0x, level, -(ay - n0y), bx - n1x, level, -(by - n1y), bx + n1x, level, -(by + n1y));
      pos.push(ax - n0x, level, -(ay - n0y), bx + n1x, level, -(by + n1y), ax + n0x, level, -(ay + n0y));
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const mat = material("Frontier_Abyss").clone();
  mat.side = THREE.DoubleSide;
  return new THREE.Mesh(geo, mat);
}

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(111, {
    hills: [
      { x: 1200, y: 3600, r: 1100, h: 180 }, { x: -3800, y: 4600, r: 1100, h: 200 }, { x: 4300, y: -900, r: 900, h: 160 },
      { x: -4300, y: -1600, r: 700, h: 140 }, { x: 900, y: 600, r: 700, h: -120 }, { x: -1200, y: 2000, r: 700, h: 120 },
      { x: 1500, y: 2900, r: 500, h: -90 }, { x: 1900, y: -400, r: 450, h: -80 }, { x: 4400, y: 4800, r: 700, h: 150 },
    ],
    plateaus: [
      { poly: subdiv(NRIM), h: 700 },
      { poly: subdiv(SRIM), h: 650 },
      { poly: subdiv(CITADEL), h: 360, ramps: [R_CITADEL] },
      { poly: subdiv(KEEP), h: 720, ramps: [R_KEEP] },
      { poly: subdiv(MESA), h: 420, ramps: [R_MESA] },
      // v0.4: the walls' parts east of their passes
      { poly: subdiv(NRIM_E), h: 700 },
      { poly: subdiv(SRIM_E), h: 650 },
    ],
    rock: "Frontier_CliffDark",
  });
  const { put, rnd } = f;

  // ---- tracks ----
  const MAIN = chaikin([[0, A], [0, 5300], [100, 4500], [-200, 3700], [200, 2900], [100, 2100], [-300, 1300], [-500, 600], [-700, 300], R_CITADEL.bottom], 3);
  const ON_CITADEL = chaikin([R_CITADEL.top, [-650, -1500], [-200, -1650], R_KEEP.bottom], 2);
  const FORECOURT = chaikin([R_KEEP.top, [0, -3300], [0, -3650]], 1);
  const TO_MESA = chaikin([[100, 2100], [900, 1950], [1700, 1750], R_MESA.bottom], 2);
  const ON_MESA = chaikin([R_MESA.top, [3150, 3000], [3350, 3450]], 1);
  const TO_BONES = chaikin([[-300, 1300], [-1100, 1600], [-2000, 1550], [-2700, 1400]], 2);
  const CITADEL_S = chaikin([R_CITADEL.top, [-1700, -1900], [-2600, -2600], [-2900, -3600]], 2);
  const CITADEL_N = chaikin([R_KEEP.bottom, [900, -1800], [2000, -2200], [2700, -3000]], 2);
  const PATHS = [MAIN, ON_CITADEL, FORECOURT, TO_MESA, ON_MESA, TO_BONES, CITADEL_S, CITADEL_N, ...RAMPS.map((r): XY[] => [r.bottom, r.top]), TO_THORNS, TO_CAMP];
  const roads: Poly[] = [
    bandPoly(MAIN, 480, 60), bandPoly(ON_CITADEL, 440), bandPoly(FORECOURT, 520), bandPoly(TO_MESA, 420, 40), bandPoly(ON_MESA, 400),
    bandPoly(TO_BONES, 400, 40), bandPoly(CITADEL_S, 400, 40), bandPoly(CITADEL_N, 400, 40),
    ...RAMPS.map((r) => bandPoly([r.bottom, r.top], r.width - 40)),
    bandPoly(TO_THORNS, 440, 50), bandPoly(TO_CAMP, 440, 50),
  ];
  const chasms = CHASMS.map(([line, w], i) => chasmPoly(line, w, 31 + i * 17));
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: chasms, base: "rock", road: [0.72, 0.5, 0.56], tint: "#7a6890" });
  // the demon lands' ground: the rock darkened to purple-black
  const DEPTH = 320;
  const scenery: THREE.Object3D[] = [chasmMesh(chasms, DEPTH)];
  for (const poly of chasms) {
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    scenery.push(f.waterSheet({ x0: Math.min(...xs) - 200, x1: Math.max(...xs) + 200, y0: Math.min(...ys) - 200, y1: Math.max(...ys) + 200 }, -DEPTH + 10, "Frontier_AbyssDeep"));
  }
  scenery.push(seams(CHASMS, -DEPTH + 24));
  for (const [line, w] of CHASMS) f.blockBand(chaikin(line, 2), w + 60, { kind: "chasm", step: 200 });

  const onTrack = (x: number, y: number, m: number) => PATHS.some((p) => distToPath(p, x, y) < m);
  const near = (p: XY, x: number, y: number, r: number) => Math.hypot(p[0] - x, p[1] - y) < r;
  const nearChasm = (x: number, y: number, m: number) => CHASMS.some(([line, w]) => distToPath(chaikin(line, 1), x, y) < w / 2 + m);
  const at = (ref: string, p: XY, h: number, r: number, o: Parameters<typeof put>[3] = {}) => {
    if (f.level(p[0], p[1], r)) put(ref, p, h, o);
  };
  const deadTree = (p: XY, s: number) => put("frontier:dead_tree", p, rnd() * 360, { s, solid: [{ kind: "tree", x: 0, y: 0, r: 40 }] });

  // ---- the way back west, the scout's camp ----
  f.exit("border_line", EXIT, BACK);
  put("frontier:signpost", [600, 4700], -90);
  put("kradia:arcane_lamp", [-450, 4850], 0);
  put("kradia:arcane_lamp", [450, 4950], 0);
  put("frontier:army_tent", [-1150, 4400], 90);
  put("frontier:campfire", [-700, 3850], 0, { solid: [{ kind: "fire", x: 0, y: 0, r: 95 }] });
  put("kradia:supplies", [-1250, 3700], 60);
  put("kradia:banner_pole", [-600, 4700], -90);

  // ---- v0.4: the ways out north to the thornland and south to the demon camp, a signpost and
  // a pair of dark crystals at each pass ----
  f.exit("thornland", N_EXIT, N_BACK);
  f.exit("demon_camp", S_EXIT, S_BACK);
  put("frontier:signpost", [4650, 620], 180);
  put("frontier:signpost", [-4650, -1650], 0);
  for (const [x, y, h] of [[4900, 800, 30], [4950, -750, 200], [-4950, -350, 120], [-4950, -1800, 300]] as number[][]) put("frontier:dark_crystal", [x, y], h, { s: 0.45 });

  // ---- the citadel: the demon gate on its step, braziers and crystals round the forecourt,
  // spires and dead trees on the broad step below ----
  put("frontier:demon_gate", GATE, -90);
  for (const [x, y] of [[-900, -3300], [900, -3300], [-1000, -3900], [1000, -3900]] as XY[]) at("kradia:brazier", [x, y], 0, 120, { colours: "frontier_hellfire" });
  at("frontier:dark_crystal", [-1250, -5000], 30, 300, { s: 0.9 });
  at("frontier:dark_crystal", [1200, -5050], 140, 300, { s: 0.85 });
  at("frontier:beast_bones", [-900, -5200], 300, 300, { s: 0.6 });
  at("frontier:glow_crack", [-600, -3450], 90, 330, { s: 0.6 });
  at("frontier:glow_crack", [700, -3500], 80, 330, { s: 0.55 });
  at("frontier:dead_tree", [1350, -3400], 0, 120, { s: 0.75, solid: [{ kind: "tree", x: 0, y: 0, r: 40 }] });
  at("frontier:dead_tree", [-1350, -3500], 0, 120, { s: 0.7, solid: [{ kind: "tree", x: 0, y: 0, r: 40 }] });
  // the avenue up the citadel: crystals either side of the climb
  for (const [x, y, s] of [[-1500, -1600, 0.5], [600, -1500, 0.45], [-2500, -1900, 0.6], [1900, -1750, 0.55], [-2600, -3200, 0.7], [2600, -2500, 0.6], [-2000, -4300, 0.75], [2300, -4200, 0.7], [-3000, -2500, 0.5], [3000, -3500, 0.6]] as number[][]) {
    at("frontier:dark_crystal", [x, y], rnd() * 360, 250, { s });
  }

  // ---- the giant crystal on the mesa ----
  put("frontier:dark_crystal", CRYSTAL, 20, { s: 1.7 });
  for (const [x, y, s] of [[4200, 3300, 0.6], [3000, 4500, 0.55], [4100, 4500, 0.5], [2700, 3600, 0.4]] as number[][]) at("frontier:dark_crystal", [x, y], rnd() * 360, 220, { s });
  at("frontier:glow_crack", [3300, 4600], 120, 330, { s: 0.6 });
  at("frontier:beast_bones", [4200, 3900], 160, 320, { s: 0.55 });

  // ---- the bone field ----
  put("frontier:beast_bones", BONES, 200, { s: 1.5 });
  at("kradia:brazier", [BONES[0] + 700, BONES[1] - 300], 0, 120, { colours: "frontier_hellfire" });
  at("kradia:brazier", [BONES[0] - 800, BONES[1] + 300], 0, 120, { colours: "frontier_hellfire" });
  at("frontier:dark_crystal", [BONES[0] + 300, BONES[1] + 900], 80, 250, { s: 0.6 });
  at("frontier:dark_crystal", [BONES[0] - 600, BONES[1] - 800], 200, 250, { s: 0.5 });
  at("frontier:beast_bones", [-4300, 1900], 40, 300, { s: 0.7 });
  at("frontier:beast_bones", [-2100, 2300], 280, 300, { s: 0.6 });

  // ---- rocks along the chasms' rims, cracks running off their ends ----
  for (const [line, w] of CHASMS) {
    const pts = chaikin(line, 2);
    for (let i = 1; i < pts.length - 1; i += 2) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
      const side = rnd() < 0.5 ? -1 : 1, d = w / 2 + 120 + rnd() * 80;
      const p: XY = [pts[i][0] - ((by - ay) / L) * d * side, pts[i][1] + ((bx - ax) / L) * d * side];
      if (!onTrack(p[0], p[1], 300)) at(rnd() < 0.5 ? "frontier:boulder" : "frontier:rock_cluster", p, rnd() * 360, 140, { s: 0.35 + rnd() * 0.25, colours: "frontier_dark" });
    }
    for (const [end, prev] of [[line[0], line[1]], [line[line.length - 1], line[line.length - 2]]]) {
      const dx = end[0] - prev[0], dy = end[1] - prev[1], L = Math.hypot(dx, dy) || 1;
      const p: XY = [end[0] + (dx / L) * 380, end[1] + (dy / L) * 380];
      if (Math.abs(p[0]) < R - 300 && Math.abs(p[1]) < R - 300) at("frontier:glow_crack", p, (Math.atan2(dy, dx) * 180) / Math.PI - 90, 300, { s: 0.7 });
    }
  }

  // ---- over the lands: dead trees, crystals, blight, bones, ashen grass ----
  for (let x = -R + 300; x < R; x += 560)
    for (let y = -R + 300; y < R; y += 560) {
      const px = x + (rnd() - 0.5) * 400, py = y + (rnd() - 0.5) * 400;
      if (Math.abs(px) > R - 150 || Math.abs(py) > R - 150 || onTrack(px, py, 420) || nearRamp(RAMPS, px, py, 260) || nearChasm(px, py, 250)) continue;
      if (near(GATE, px, py, 1500) || near(CRYSTAL, px, py, 900) || near(BONES, px, py, 1000) || near(CAMP, px, py, 1100) || near(EXIT, px, py, 900) || near(N_EXIT, px, py, 900) || near(S_EXIT, px, py, 900) || !f.level(px, py, 200)) continue;
      const k = rnd();
      if (k < 0.2) deadTree([px, py], 0.65 + rnd() * 0.45);
      else if (k < 0.27) put("frontier:dark_crystal", [px, py], rnd() * 360, { s: 0.3 + rnd() * 0.3 });
      else if (k < 0.32) put("frontier:boulder", [px, py], rnd() * 360, { s: 0.45 + rnd() * 0.35, colours: "frontier_dark" });
      else if (k < 0.35) put("frontier:rock_cluster", [px, py], rnd() * 360, { s: 0.45 + rnd() * 0.3, colours: "frontier_dark" });
      else if (k < 0.37 && f.level(px, py, 330)) put("frontier:beast_bones", [px, py], rnd() * 360, { s: 0.45 + rnd() * 0.25 });
      else if (k < 0.4 && f.level(px, py, 330)) put("frontier:glow_crack", [px, py], rnd() * 360, { s: 0.45 + rnd() * 0.3 });
    }
  for (let i = 0; i < 220; i++) {
    const x = -R + rnd() * 2 * R, y = -R + rnd() * 2 * R;
    if (onTrack(x, y, 160) || nearRamp(RAMPS, x, y, 150) || nearChasm(x, y, 150) || !f.level(x, y, 220)) continue;
    if (rnd() < 0.55) put("frontier:scorch_mark", [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.9, colours: "frontier_blight" });
    else put("frontier:grass_tuft", [x, y], rnd() * 360, { s: 0.7 + rnd() * 0.5, colours: "frontier_ashgrass" });
  }

  // ---- the rim: dead woods and crystals all round, black rock on the walls ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const road = (x: number, y: number) => distToPath(MAIN, x, y) < 480 || distToPath(TO_THORNS, x, y) < 480 || distToPath(TO_CAMP, x, y) < 480;
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["dead_tree", "dead_tree", "dead_tree", "dark_crystal"], (x, y) => inside(x, y) || road(x, y), { count: 330, spacing: 520, kit: "frontier" });
  for (let i = 0; i < 70; i++) {
    const x = -A + rnd() * 2 * A, y = -A + rnd() * 2 * A;
    if (inside(x, y) || road(x, y) || !f.level(x, y, 250)) continue;
    put(rnd() < 0.5 ? "frontier:rock_cluster" : "frontier:boulder", [x, y], rnd() * 360, { s: 0.6 + rnd() * 0.6, solid: "none", colours: "frontier_dark" });
  }
  for (let i = 0; i < 120; i++) {
    const x = -A + rnd() * 2 * A, y = -A + rnd() * 2 * A;
    if (inside(x, y) || road(x, y) || !f.level(x, y, 200)) continue;
    put("frontier:scorch_mark", [x, y], rnd() * 360, { s: 1.3 + rnd(), colours: "frontier_blight" });
  }

  // ---- monsters ----
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, {
    step: 880,
    keepOut: (x, y) => near(CAMP, x, y, 1400) || nearRamp(RAMPS, x, y, 120) || nearChasm(x, y, 150) || near(GATE, x, y, 700) || Math.abs(x) > 5000,
  });

  const scout: NpcSpec = {
    id: "demon_land_scout", x: -300, y: 4100, face: -90, name: "เซลีน", title: "จอมเวทสอดแนมแห่งคราเดีย", role: "talk",
    look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "violet", top: "top_priestess_wine", bottom: "bottom_priestess_black" },
    lines: [
      "นี่คือที่สุดของแผ่นดินที่คราเดียยังส่งคนมาเฝ้าได้ เลยจากนี้ไปคือดินแดนของพวกอสูร",
      "ประตูอสูรบนป้อมดำทางตะวันออกยังเปิดอยู่ พวกมันเดินออกมาจากแสงม่วงนั่นไม่หยุด",
      "อย่าเข้าใกล้เหวที่เรืองแสง ไอร้อนจากข้างล่างกัดกินได้แม้แต่เกราะเหล็ก",
    ],
  };

  return f.finishField({
    ground,
    scenery,
    sky: "#1d1525",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 60, y: 4250 },
    npcs: [scout],
    labels: [
      { x: 100, y: 4700, text: "ทางไปแนวป้องกันชายแดน", kind: "gate" },
      { x: N_EXIT[0] - 250, y: N_EXIT[1], text: "ทางไปทุ่งหนามอสูร", kind: "gate" },
      { x: S_EXIT[0] + 250, y: S_EXIT[1], text: "ทางไปค่ายทัพอสูร", kind: "gate" },
      { x: 0, y: -3300, text: "ประตูอสูร" },
      { x: -600, y: -1700, text: "ป้อมดำ" },
      { x: 3300, y: 3300, text: "ผลึกมารยักษ์" },
      { x: BONES[0] + 500, y: BONES[1] + 300, text: "ลานกระดูก" },
      { x: 2900, y: 1500, text: "เหวเรืองแสง", kind: "small" },
      { x: -2600, y: 3800, text: "เหวเรืองแสง", kind: "small" },
      { x: -500, y: 3800, text: "ค่ายสอดแนม", kind: "small" },
    ],
  });
}

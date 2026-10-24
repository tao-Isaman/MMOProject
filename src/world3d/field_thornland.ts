// ทุ่งหนามอสูร (thornland), monsters Lv 104-114: the land north of the demon lands, where their
// power has seeped up through the rock wall between and eaten the country to the sea. Coming in
// from the floating rocks on the west, the grass still grows, only greyer; eastward it burns to
// ash, black thorn vines crawl over it and heap into thickets, violet crystals break out of the
// ground and the trees stand black and twisted with glowing pods on their thorns:
//   - by the way in from the west, a camp of Kradia's rangers who watch the blight spread;
//   - north-west, a wood of black trees running down to the sea, a thorn cage among them;
//   - in the middle, a mound (3.8 m, ramp on its west) where the great black tree grows, a heart
//     of crystal glowing in a cleft of its trunk, its roots and thorns spreading over the top;
//     a botanist from Kradia camps at the foot of the ramp;
//   - north-east, a headland over the sea (3.5 m, ramp on its north), and on it a higher crag
//     (7 m, ramp from the headland's west) where a spire of violet crystal has burst out of the
//     rock;
//   - south-east, the field of thorn cages: the thorns have grown round the beasts they caught,
//     their bones still inside, and the ground sinks into the burrows of the thorn worms;
//   - on the north shore a cove of grey sand where a sea beast's bones lie beached.
// The coast runs along the north and the east (the sea past them the edge of the world); along the
// south edge stands the black rock wall of the demon lands, the way through it to them in a pass
// at the middle. The west edge opens onto the floating rocks' grass.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: west (the middle) -> floating_rocks, south (the middle, through the pass) -> demon_land

import { FieldBuilder } from "./field";
import { useKits, colourways } from "./town";
import type { Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import { KIT as DEMON, smooth, band, inPoly, distTo, every, inland, faceDir, faceTo, seaSheet, tintGround, ease, fieldNoise } from "./kits/demonmarch";
import type { XY, Poly } from "./kits/demonmarch";
import { KIT as FRONTIER, BLIGHT, DARK_ROCK, rampOff, subdiv } from "./kits/frontier";
import { KIT as KRADIA } from "./kits/kradia";
import { KIT as EAST } from "./kits/eastcoast";

useKits(DEMON, FRONTIER, KRADIA, EAST);
colourways({
  frontier_blight: BLIGHT,
  frontier_dark: DARK_ROCK,
  dm_dark: { ...DARK_ROCK, Frontier_Moss: "Demonmarch_BlightEdge" }, // (black rock, the moss on it gone to blight)
  // the coast's granite gone black with the blight, crystal where the sea pinks grew
  dm_blackrock: { Eastcoast_Granite: "Demonmarch_Blight", Eastcoast_GranitePink: "Demonmarch_Blight", Eastcoast_GraniteWet: "Demonmarch_BlightSoil", Eastcoast_Weed: "Demonmarch_BlightSoil", Eastcoast_Cushion: "Demonmarch_BlightEdge", Eastcoast_Thrift: "Demonmarch_Crystal", Eastcoast_ThriftDeep: "Demonmarch_Crystal" },
});

const R = 5500; // the walkable bounds, +-R
const A = 9000; // the ground's area, +-A

// ---- the coast: from past the south-east corner north up the east side, round the north-east
// and west along the north (the land on its left), the cove of grey sand in the north ----
const SHORE: XY[] = smooth([
  [-A - 400, -5950], [-5700, -5600], [-5000, -5150], [-4300, -4800], [-3300, -4700], [-2200, -4450], [-1000, -4620], [200, -4500], [1300, -4680],
  [2400, -4520], [3300, -4300], [4000, -3850], [4420, -3000], [4520, -2000], [4320, -1000], [4120, -100], [3720, 650], [3640, 1350], [3880, 2000],
  [4320, 2600], [4520, 3600], [4720, 4500], [5050, 5300], [5600, 5950], [6300, 6500], [A + 400, 6900],
], 4);
const SEA: Poly = [...SHORE, [A + 400, -A - 400], [-A - 400, -A - 400]];
const COVE: XY = [3300, 1200];

// ---- the levels ----
// The demon lands' black wall along the south edge, the pass through it at the middle; the mound of
// the black tree (3.8 m); the headland (3.5 m) and its crystal crag (7 m).
const WALL_W: Poly = [[-A, A], [-4800, A], [-4700, 3800], [-4950, 2400], [-4750, 1200], [-4850, 450], [-A, 450]];
const WALL_E: Poly = [[-A, -450], [-4850, -450], [-4700, -1500], [-4950, -2900], [-4700, -4300], [-5300, -4800], [-A, -5000]];
const MOUND: Poly = [[900, -400], [500, 500], [-600, 700], [-1600, 100], [-1900, -900], [-1400, -1900], [-300, -2300], [700, -1700]];
const HEAD: Poly = [[1500, -2000], [2700, -1600], [3700, -1800], [4050, -2900], [3700, -3900], [2600, -4250], [1300, -4250], [700, -3500], [800, -2600]];
const CRAG: Poly = [[2600, -2400], [3400, -2300], [3600, -3100], [3200, -3600], [2600, -3500], [2400, -2900]];
const R_MOUND = rampOff([-1600, 100], [-1900, -900], 0.4, 1150, 460, [-300, -800]);
const R_HEAD = rampOff([1500, -2000], [2700, -1600], 0.5, 1100, 460, [2400, -3000]);
const R_CRAG = rampOff([2600, -3500], [2400, -2900], 0.5, 1050, 420, [3000, -2900]);
const RAMPS = [R_MOUND, R_HEAD, R_CRAG];

// ---- the ways out and the places ----
const W_EXIT: XY = [0, 5150], W_BACK: XY = [0, 4450];
const S_EXIT: XY = [-5150, 0], S_BACK: XY = [-4450, 0];
const TREE: XY = [-250, -750];
const SPIRE: XY = [3020, -2960];
const RANGERS: XY = [-900, 4300];
const BOTANIST: XY = [-3150, -650];
const CAGES: XY[] = [[-2250, -2150], [-3350, -3150], [-1200, -3500], [2300, 3500]];
const BURROWS: [number, number, number][] = [[-2700, -3100, 1000], [-1000, -3800, 700], [-3900, -2000, 650]];

// ---- tracks ----
const along = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};
// a ramp: the track to its foot, up it, and on past its top
const climb = (r: { top: XY; bottom: XY }, inn = 420, out = 380): XY[] => [along(r.bottom, r.top, -inn), r.bottom, r.top, along(r.top, r.bottom, -out)];
const MAIN = smooth([[0, A + 300], W_EXIT, [-250, 4300], [-900, 3300], [-1700, 2350], [-2500, 1550], [-3300, 950], [-4050, 420], [-4600, 80], S_EXIT, [-A - 300, 0]]);
const TO_TREE = [...smooth([[-2500, 1550], [-2750, 800], climb(R_MOUND)[0]]), ...climb(R_MOUND).slice(1), ...smooth([climb(R_MOUND)[3], [-1150, -560], [-820, -660]])];
const NE = [...smooth([[-900, 3300], [200, 2700], [1250, 1750], [1650, 500], climb(R_HEAD)[0]]), ...climb(R_HEAD).slice(1), ...smooth([climb(R_HEAD)[3], [1750, -2550], [1560, -3050], climb(R_CRAG)[0]]), ...climb(R_CRAG, 420, 200).slice(1)];
const TO_COVE = smooth([[1250, 1750], [2050, 1650], [2700, 1400], [3150, 1250]]);
const TO_CAGES = smooth([[-3300, 950], [-3600, 250], [-3500, -800], [-3150, -1600], [-2650, -2350], [-2150, -2900], [-1500, -3250]]);
const PATHS: XY[][] = [MAIN, TO_TREE, NE, TO_COVE, TO_CAGES];

// how deep in the blight a point is: 0 on the floating rocks' grass at the west edge, 1 deep in
// it; deepest round the black tree and at the pass from the demon lands
function blightAt(x: number, y: number): number {
  // (the floating rocks' grass greys and blackens toward the south-east too, by the border wall)
  const west = 1 - ease(2400, 5200, y) * 0.85 * (0.45 + 0.55 * ease(-3800, -500, x));
  const tree = 1 - ease(800, 3200, Math.hypot(x - TREE[0], y - TREE[1]));
  const pass = 1 - ease(600, 2600, Math.hypot(x + 4900, y)), south = ease(-3000, -5200, x); // (the demon lands' black, past the wall)
  return Math.min(1, west * (0.62 + 0.28 * fieldNoise(x, y, 3)) + 0.45 * tree + 0.35 * pass + 0.6 * south);
}

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(529, {
    hills: [
      ...BURROWS.map(([x, y, r]) => ({ x, y, r, h: -150 })),
      { x: -1300, y: 3200, r: 1500, h: 160 }, { x: 2200, y: 3400, r: 1500, h: 200 }, { x: 2600, y: 900, r: 900, h: 110 },
      { x: -3600, y: 3500, r: 1100, h: 120 }, { x: -3300, y: -700, r: 650, h: 80 }, { x: 600, y: 1700, r: 800, h: -90 },
      { x: -2300, y: 300, r: 700, h: -80 }, { x: 1000, y: -3300, r: 700, h: 90 },
      // the floating rocks' grass rolling on past the west edge
      { x: 0, y: 7700, r: 2600, h: 260 }, { x: 3200, y: 7400, r: 1800, h: 180 },
    ],
    plateaus: [
      { poly: subdiv(WALL_W), h: 700 },
      { poly: subdiv(WALL_E), h: 700 },
      { poly: subdiv(MOUND), h: 380, ramps: [R_MOUND] },
      { poly: subdiv(HEAD), h: 350, ramps: [R_HEAD] },
      { poly: subdiv(CRAG), h: 700, ramps: [R_CRAG] },
    ],
    rock: "Demonmarch_CliffBlight",
  });
  const { put, rnd } = f;

  // ---- the ground: burnt grass greying and darkening into the blight, dark tracks, the sea ----
  const roads = [band(MAIN, 470), band(TO_TREE, 420), band(NE, 410), band(TO_COVE, 380), band(TO_CAGES, 390)];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: [SEA], base: "steppe", road: [0.62, 0.55, 0.58] });
  // (factors on the steppe's linear colour: olive grass in the west, ash grey, a purple-black deep in
  // the blight, grey sand along the shore)
  const mix = (a: number[], b: number[], t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const WEST = [0.5, 0.68, 0.62], ASH = [0.52, 0.47, 1.4], DEEP = [0.2, 0.15, 0.8], SAND = [0.57, 0.52, 1.7];
  tintGround(ground, (x, y) => {
    const k = blightAt(x, y), c = k < 0.5 ? mix(WEST, ASH, k / 0.5) : mix(ASH, DEEP, (k - 0.5) / 0.5);
    const shore = 1 - ease(250, 900, distTo(SHORE, x, y)), cove = 1 - ease(500, 1400, Math.hypot(x - COVE[0], y - COVE[1]));
    return mix(c, SAND, Math.max(shore, cove) * 0.9);
  }, 0.35);

  // ---- the sea: dark water out past the horizon, the shore closed all along ----
  const sea = seaSheet([...inland(SHORE, 200), [A + 400, -30000], [-30000, -30000]]);
  const sea2 = seaSheet([[A + 400, -30000], [30000, -30000], [30000, 30000], [A + 400, 30000]]);
  f.blockBand(inland(SHORE.filter(([x, y]) => Math.abs(x) < R + 900 && Math.abs(y) < R + 900), -280), 520, { kind: "sea" });

  // ---- the ways out ----
  f.exit("floating_rocks", W_EXIT, W_BACK);
  f.exit("demon_land", S_EXIT, S_BACK);

  // ---- placing things clear of each other, the tracks, the ramps and the water ----
  const taken: [number, number, number][] = [[W_EXIT[0], W_EXIT[1], 500], [S_EXIT[0], S_EXIT[1], 500]];
  const onTrack = (x: number, y: number, m: number) => [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const nearRampAt = (x: number, y: number, m: number) => RAMPS.some((r) => distTo([r.top, r.bottom], x, y) < r.width / 2 + m);
  const free = (x: number, y: number, r: number) => !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r);
  const wet = (x: number, y: number, m: number) => inPoly(SEA, x, y) || distTo(SHORE, x, y) < m;
  const fits = (x: number, y: number, r: number, m = r) => f.level(x, y, r) && !onTrack(x, y, m) && !nearRampAt(x, y, m) && free(x, y, r) && !wet(x, y, r + 120);
  const place = (ref: string, at: XY, h: number, r: number, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    taken.push([at[0], at[1], r]);
  };
  const tryPlace = (ref: string, at: XY, h: number, r: number, o: Parameters<typeof put>[3] = {}) => {
    if (!fits(at[0], at[1], r)) return false;
    place(ref, at, h, r, o);
    return true;
  };
  const ring = (r: number, kind = "rock"): SolidSpec[] => [{ kind, x: 0, y: 0, r }];
  const inBox = (x: number, y: number, m = 0) => Math.abs(x) < R - m && Math.abs(y) < R - m;
  // scatter n pieces of refs over a box where `ok` says, r apart
  const scatter = (box: { x0: number; x1: number; y0: number; y1: number }, n: number, refs: string[], r: number, ok: (x: number, y: number) => boolean, o: { s?: [number, number]; solid?: (ref: string, s: number) => SolidSpec[] | "none"; tries?: number; colours?: string } = {}) => {
    let made = 0;
    for (let t = 0; t < (o.tries ?? n * 30) && made < n; t++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (!ok(x, y) || !fits(x, y, r)) continue;
      const ref = refs[Math.floor(rnd() * refs.length)], s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      place(ref, [x, y], rnd() * 360, r * s, { s, ...(o.solid ? { solid: o.solid(ref, s) } : {}), ...(o.colours ? { colours: o.colours } : {}) });
      made++;
    }
  };
  // the trunk or bulk a scattered piece blocks
  const bulk = (ref: string, s: number): SolidSpec[] | "none" =>
    ref.endsWith("mutant_tree") || ref.endsWith("dead_tree") || ref.endsWith("charred_tree") ? ring(40 * s, "tree")
      : ref.endsWith("thorn_thicket") ? ring(120 * s, "thorn")
        : ref.endsWith("blight_boulder") ? ring(115 * s)
          : ref.endsWith("crystal_cluster") ? ring(55 * s, "crystal")
            : ref.startsWith("flora:") ? [{ kind: "tree", x: 0, y: 0, r: 38 * s }]
              : "none";

  // ---- the way in from the floating rocks: Kradia's rangers' camp ----
  place("frontier:signpost", [650, 4750], faceDir(0, -1), 60, { solid: ring(25, "post") });
  place("kradia:banner_pole", [-520, 5000], faceDir(0, -1), 60, { solid: ring(20, "post") });
  place("kradia:banner_pole", [520, 5000], faceDir(0, -1), 60, { solid: ring(20, "post") });
  place("frontier:army_tent", [RANGERS[0] - 350, RANGERS[1] + 750], faceTo([RANGERS[0] - 350, RANGERS[1] + 750], RANGERS), 330);
  place("frontier:army_tent", [RANGERS[0] - 1050, RANGERS[1] + 250], faceTo([RANGERS[0] - 1050, RANGERS[1] + 250], RANGERS), 330);
  place("frontier:campfire", RANGERS, 0, 150, { solid: ring(95, "fire") });
  place("kradia:supplies", [RANGERS[0] + 450, RANGERS[1] + 650], 30, 150);
  place("kradia:weapon_rack", [RANGERS[0] - 1150, RANGERS[1] - 350], faceDir(1, 0), 130);
  place("kradia:barricade", [RANGERS[0] - 200, RANGERS[1] - 700], faceDir(0, -1), 220);
  place("kradia:barricade", [RANGERS[0] - 1000, RANGERS[1] - 600], faceDir(0.3, -1), 220);
  place("common:crate", [RANGERS[0] + 300, RANGERS[1] + 330], 12, 70);

  // ---- the black tree on its mound, the botanist below ----
  place("demonmarch:black_heart_tree", TREE, faceTo(TREE, R_MOUND.top), 900, { solid: [{ kind: "tree", x: 0, y: 0, r: 120 }] });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3, d = 820 + rnd() * 200, at: XY = [TREE[0] + Math.cos(a) * d, TREE[1] + Math.sin(a) * d];
    tryPlace(k % 2 ? "demonmarch:thorn_vines" : "demonmarch:crystal_cluster", at, rnd() * 360, 160, k % 2 ? { solid: "none" } : { solid: ring(55, "crystal") });
  }
  tryPlace("demonmarch:thorn_thicket", [600, -1300], 40, 180, { s: 0.9, solid: ring(110, "thorn") });
  tryPlace("demonmarch:thorn_thicket", [-1300, -1500], 200, 180, { s: 0.8, solid: ring(100, "thorn") });
  tryPlace("demonmarch:blight_boulder", [400, 200], 70, 180, { s: 0.7, solid: ring(90) });
  const bot: XY = [BOTANIST[0], BOTANIST[1]];
  place("frontier:army_tent", [bot[0] - 300, bot[1] - 450], faceTo([bot[0] - 300, bot[1] - 450], bot), 300, { s: 0.85 });
  place("common:crate", [bot[0] + 150, bot[1] - 420], 20, 70);
  place("common:crate", [bot[0] + 230, bot[1] - 300], 70, 70, { s: 0.8 });
  place("frontier:campfire", [bot[0] - 450, bot[1] + 150], 0, 130, { solid: ring(90, "fire") });

  // ---- the headland and the crystal crag ----
  place("demonmarch:crystal_spire", SPIRE, faceTo(SPIRE, R_CRAG.top), 420, { solid: [{ kind: "crystal", x: 0, y: 0, r: 190 }, { kind: "rock", x: 150, y: -120, r: 90 }, { kind: "rock", x: -150, y: 130, r: 80 }] });
  for (const [x, y, ref, h] of [[3350, -3300, "demonmarch:crystal_cluster", 20], [2750, -2550, "demonmarch:crystal_cluster", 150], [3350, -2550, "demonmarch:thorn_vines", 80], [2750, -3400, "demonmarch:blight_boulder", 200]] as [number, number, string, number][])
    tryPlace(ref, [x, y], h, 150, { s: 0.85, solid: bulk(ref, 0.85) });
  scatter({ x0: 700, x1: 4100, y0: -4300, y1: -1600 }, 9, ["demonmarch:mutant_tree", "demonmarch:mutant_tree", "frontier:dead_tree"], 230, (x, y) => inPoly(HEAD, x, y) && !inPoly(CRAG, x, y), { s: [0.75, 1.05], solid: bulk });
  scatter({ x0: 700, x1: 4100, y0: -4300, y1: -1600 }, 7, ["demonmarch:crystal_cluster", "demonmarch:blight_boulder", "demonmarch:thorn_vines"], 160, (x, y) => inPoly(HEAD, x, y) && !inPoly(CRAG, x, y), { s: [0.6, 0.95], solid: bulk });
  scatter({ x0: 700, x1: 4100, y0: -4300, y1: -1600 }, 14, ["demonmarch:ash_grass"], 60, (x, y) => inPoly(HEAD, x, y), { s: [0.8, 1.3], solid: () => "none" });

  // ---- the field of thorn cages and the worms' burrows ----
  CAGES.forEach((c, i) => place("demonmarch:thorn_cage", c, (i * 97) % 360, 300, { s: i === 3 ? 0.85 : 1, solid: ring(i === 3 ? 160 : 185, "thorn") }));
  for (const [bx, by, br] of BURROWS) {
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + rnd(), d = br * (0.85 + rnd() * 0.3);
      tryPlace(k % 2 ? "demonmarch:thorn_thicket" : "demonmarch:thorn_vines", [bx + Math.cos(a) * d, by + Math.sin(a) * d], rnd() * 360, 170, { s: 0.75 + rnd() * 0.3, solid: k % 2 ? ring(95, "thorn") : "none" });
    }
    tryPlace("demonmarch:thorn_vines", [bx, by], rnd() * 360, 120, { s: 1.2, solid: "none" });
  }
  for (const at of [[-2650, -2750], [-1700, -2750], [-3600, -3700], [-900, -2900]] as XY[]) tryPlace("frontier:beast_bones", at, rnd() * 360, 300, { s: 0.55, solid: "none" });

  // ---- the cove and the beached bones ----
  place("frontier:beast_bones", [3550, 1150], 75, 420, { s: 1.15, solid: [{ kind: "bones", x: 0, y: 0, w: 600, d: 300, rot: 0 }] });
  for (const [x, y, h] of [[3250, 600, 30], [3000, 1900, 120], [3600, 1750, 70]] as number[][]) tryPlace("frontier:fallen_log", [x, y], h, 200, { s: 0.8, colours: "dm_dark", solid: [{ kind: "log", x: 0, y: 0, w: 90, d: 420, rot: 0 }] });

  // ---- the black wood in the north-west, fading into the grass near the west edge ----
  scatter({ x0: 1200, x1: 4600, y0: 1700, y1: 5200 }, 30, ["demonmarch:mutant_tree", "demonmarch:mutant_tree", "demonmarch:mutant_tree", "frontier:dead_tree"], 260, (x, y) => inBox(x, y, 200) && !wet(x, y, 500), { s: [0.75, 1.1], solid: bulk });
  scatter({ x0: 1200, x1: 4600, y0: 1700, y1: 5200 }, 14, ["demonmarch:thorn_vines", "demonmarch:thorn_thicket", "demonmarch:crystal_cluster"], 170, (x, y) => inBox(x, y, 200) && !wet(x, y, 400), { s: [0.7, 1], solid: bulk });

  // ---- over the land: the blight's pieces thickening eastward, grass and the odd green tree
  // still in the west ----
  for (let x = -R + 300; x < R; x += 520)
    for (let y = -R + 300; y < R; y += 520) {
      const px = x + (rnd() - 0.5) * 380, py = y + (rnd() - 0.5) * 380;
      if (!inBox(px, py, 200) || !fits(px, py, 120, 260) || inPoly(MOUND, px, py) || inPoly(HEAD, px, py)) continue;
      if (Math.hypot(px - RANGERS[0], py - RANGERS[1]) < 1300 || Math.hypot(px - BOTANIST[0], py - BOTANIST[1]) < 900) continue;
      const k = blightAt(px, py), roll = rnd();
      if (roll < 0.28) continue;
      let ref: string, r = 150;
      const q = rnd();
      if (k < 0.45) ref = q < 0.12 ? "flora:Pine" : q < 0.2 ? "flora:SmallTree" : q < 0.32 ? "frontier:dead_tree" : q < 0.42 ? "frontier:boulder" : q < 0.75 ? "frontier:grass_tuft" : "demonmarch:ash_grass";
      else ref = q < 0.1 ? "demonmarch:mutant_tree" : q < 0.16 ? "frontier:dead_tree" : q < 0.26 ? "demonmarch:thorn_thicket" : q < 0.36 ? "demonmarch:crystal_cluster" : q < 0.41 ? "demonmarch:blight_boulder" : q < 0.66 ? "demonmarch:thorn_vines" : "demonmarch:ash_grass";
      if (ref.endsWith("tree") || ref.startsWith("flora:")) r = 230;
      if (!fits(px, py, r, r + 120)) continue;
      const s = ref.endsWith("thicket") ? 0.7 + rnd() * 0.3 : ref.endsWith("boulder") ? 0.5 + rnd() * 0.35 : 0.75 + rnd() * 0.35;
      place(ref, [px, py], rnd() * 360, ref.endsWith("grass") || ref.endsWith("tuft") ? 60 : r * s, { s, solid: bulk(ref, s), ...(ref === "frontier:boulder" ? { colours: "dm_dark" } : {}) });
    }
  // ground cover between: ash grass, scorched blight, glowing cracks deep in
  for (let i = 0; i < 260; i++) {
    const x = -R + 200 + rnd() * (2 * R - 400), y = -R + 200 + rnd() * (2 * R - 400);
    if (onTrack(x, y, 200) || nearRampAt(x, y, 120) || wet(x, y, 250) || !f.level(x, y, 120) || !free(x, y, 40)) continue;
    const k = blightAt(x, y);
    if (k > 0.55 && rnd() < 0.35) put("frontier:scorch_mark", [x, y], rnd() * 360, { s: 0.7 + rnd() * 0.6, colours: "frontier_blight", solid: "none" });
    else if (k > 0.75 && rnd() < 0.12 && f.level(x, y, 330)) put("frontier:glow_crack", [x, y], rnd() * 360, { s: 0.5 + rnd() * 0.3, solid: "none" });
    else put(k < 0.4 ? "frontier:grass_tuft" : "demonmarch:ash_grass", [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.5, solid: "none" });
  }

  // ---- the pass to the demon lands: dark crystals and a crack of their light ----
  tryPlace("frontier:signpost", [-4500, 650], faceDir(1, 0), 60, { solid: ring(25, "post") });
  for (const [x, y, s, h] of [[-4250, -700, 0.45, 30], [-4350, 800, 0.4, 200], [-3900, -900, 0.35, 120]] as number[][]) tryPlace("frontier:dark_crystal", [x, y], h, 200, { s, solid: ring(90 * s + 40, "crystal") });
  tryPlace("frontier:glow_crack", [-3900, 500], 80, 300, { s: 0.6, solid: "none" });

  // ---- the shore: black rocks along the water, stacks out in the sea ----
  for (const { p, d } of every(SHORE, 360)) {
    if (Math.abs(p[0]) > R + 1500 || Math.abs(p[1]) > R + 1500 || rnd() < 0.3) continue;
    if (Math.hypot(p[0] - COVE[0], p[1] - COVE[1]) < 900 && rnd() < 0.7) continue;
    put("eastcoast:shore_rocks", [p[0] - d[1] * 110, p[1] + d[0] * 110], faceDir(-d[1], d[0]) + rnd() * 40, { s: 0.55 + rnd() * 0.5, solid: "none", z: -6, colours: "dm_blackrock" });
  }
  for (const [x, y, h, s] of [[6100, 1800, 20, 0.9], [5600, -2600, 140, 0.8], [5900, -800, 80, 0.65], [2600, -5900, 200, 0.85], [-600, -6100, 260, 0.75], [5300, 4600, 60, 0.7], [-3600, -6300, 300, 0.7]] as number[][])
    put("eastcoast:sea_stack", [x, y], h, { s, solid: "none", z: -14, colours: "dm_blackrock" });

  // ---- past the edges: the wall's top black with dead trees and crystals, the grass and its
  // trees on the west, a fringe of black trees along the coast ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const track = (x: number, y: number) => PATHS.some((p) => distTo(p, x, y) < 480);
  f.woods({ x0: -A, x1: -4600, y0: -A, y1: A }, ["dead_tree", "dead_tree", "dark_crystal"], (x, y) => inside(x, y) || track(x, y) || wet(x, y, 400) || Math.abs(y) < 600, { count: 120, spacing: 520, kit: "frontier", tries: 4000 });
  f.woods({ x0: -4600, x1: A, y0: R, y1: A }, ["Pine", "SmallTree", "Pine", "RoundTree"], (x, y) => inside(x, y) || track(x, y) || wet(x, y, 400), { count: 110, spacing: 480, tries: 4000 });
  f.woods({ x0: -4600, x1: A, y0: 3500, y1: A }, ["dead_tree"], (x, y) => inside(x, y) || track(x, y) || wet(x, y, 400) || y > 7000, { count: 30, spacing: 600, kit: "frontier", tries: 2000 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["mutant_tree"], (x, y) => inside(x, y) || track(x, y) || wet(x, y, 350) || y > 3500 || x < -4600, { count: 40, spacing: 650, kit: "demonmarch", tries: 3000 });

  // ---- monsters: the burnt grass, the thorns, the mound, the headland and its crag ----
  const camp = (x: number, y: number) => Math.hypot(x - RANGERS[0], y - RANGERS[1]) < 1500 || Math.hypot(x - BOTANIST[0], y - BOTANIST[1]) < 1000;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 800, max: 52, keepOut: (x, y) => camp(x, y) || Math.hypot(x - TREE[0], y - TREE[1]) < 500 || wet(x, y, 300) || x < -4700 });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "thornland_ranger", x: RANGERS[0] + 120, y: RANGERS[1] - 380, face: faceTo(RANGERS, W_EXIT), name: "ฮาร์วิน", title: "พรานลาดตระเวนแห่งคราเดีย", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "หญ้าตรงนี้ยังเขียวอยู่บ้าง แต่ทุกเดือนเถาหนามดำคืบเข้ามาอีกหลายก้าว เราปักธงไว้วัดระยะมันทุกเช้า",
        "หนอนหนามมันซุ่มอยู่ใต้ดินในหลุมทางตะวันออกเฉียงใต้ เห็นดินยุบเป็นแอ่งเมื่อไหร่อย่าเข้าไปคนเดียว",
        "ทางใต้ผ่านช่องเขาหินดำไปคือดินแดนอสูร สุนัขนรกพวกนั้นก็ข้ามมาจากทางนั้นแหละ",
      ],
    },
    {
      id: "thornland_botanist", x: BOTANIST[0] + 60, y: BOTANIST[1] - 200, face: faceTo(BOTANIST, R_MOUND.top), name: "เอลวีรา", title: "นักพฤกษศาสตร์จากหอเวทคราเดีย", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "violet", eyes: "teal", top: "top_adventurer_teal", bottom: "bottom_adventurer_cocoa" },
      lines: [
        "ต้นไม้ดำบนเนินนั้นไม่ใช่ต้นไม้ธรรมดา มันดูดพลังจากแผ่นดินเข้าไปเลี้ยงผลึกในลำต้น ยิ่งโตหนามก็ยิ่งลามออกมา",
        "สัตว์ที่หลงเข้าไปในเถาหนามจะถูกมันรัดจนกลายเป็นกรง กระดูกพวกนั้นข้าเก็บตัวอย่างไปแล้วสามโครง",
        "ถ้าตัดรากมันได้สักวัน ทุ่งนี้อาจกลับมาเขียวอีก แต่ตอนนี้ข้าได้แต่จดบันทึกไปก่อน",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery: [sea, sea2],
    sky: "#3b3440",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 60, y: 4250 },
    npcs,
    labels: [
      { x: W_EXIT[0], y: W_EXIT[1] - 250, text: "ทางไปทุ่งหินลอย", kind: "gate" },
      { x: S_EXIT[0] + 250, y: S_EXIT[1], text: "ทางไปดินแดนอสูร", kind: "gate" },
      { x: TREE[0] + 900, y: TREE[1] + 300, text: "ต้นไม้ดำหัวใจผลึก" },
      { x: SPIRE[0] - 500, y: SPIRE[1] + 400, text: "ยอดผลึกม่วง" },
      { x: 1700, y: -3700, text: "แหลมผลึกริมทะเล", kind: "small" },
      { x: -2500, y: -1700, text: "ทุ่งกรงหนาม" },
      { x: -2700, y: -3500, text: "รังหนอนหนาม", kind: "small" },
      { x: 2600, y: 2900, text: "ป่าต้นไม้ดำ" },
      { x: COVE[0] + 100, y: COVE[1] + 600, text: "หาดซากอสูรทะเล", kind: "small" },
      { x: RANGERS[0] + 300, y: RANGERS[1] + 500, text: "ค่ายพรานคราเดีย", kind: "small" },
      { x: -4300, y: 350, text: "ช่องเขาหินดำ", kind: "small" },
    ],
  });
}

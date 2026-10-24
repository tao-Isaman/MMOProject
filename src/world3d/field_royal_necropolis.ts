// สุสานหลวงโบราณ (the royal necropolis), monsters Lv 170-182: where the first kings were buried,
// and where the southern jungle has begun to swallow them. From the way in from the ancient plain
// (north) an avenue of guardian statues and braziers of ghost-fire runs south between two
// obelisks to the foot of the great terrace; up its stairs, and up a second flight from the
// terrace, the great mausoleum stands on the upper step, sealed. On the plain either side of the
// avenue lie the rows of house tombs and sarcophagi; in the west a ridge of dark rock carries the
// sealed tomb gate cut in its face; on the terrace's wings more tombs, the east one in the trees.
// The east is the jungle's: fig roots gripping fallen stones, vines over the tombs, and a hill
// where a giant fig has closed round the tombs on its top. The way out to the southern jungle
// leaves through the trees on the east side. Pale fires burn with no one to tend them, wisps
// drift over the graves and the mist lies in the hollows. From the jungle track a path turns off
// south-west under the great terrace's cliff and leaves over the south edge, through a gap in the
// high woods there, for the sacred banyan woods; and from the west tombs' path another climbs past
// the north-west obelisk into the ravine between the west ridge and the north-west heights, out over
// the west edge to the forest of the first tree.
//
// Full size in the field's own centimetres (north +X, east -Y), scaled by TOWN_SCALE in finish.
//   ways out: north -> ancient_plain, east -> south_jungle, south -> sacred_banyan, west -> first_tree

import { FieldBuilder } from "./field";
import { useKits } from "./town";
import type { Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import { KIT as RUINS, smooth, band, bevel, inPoly, distTo, towards, alongDir, rampOff } from "./kits/ruins";
import type { XY } from "./kits/ruins";
import { KIT as JUNGLE } from "./kits/jungle";
import { KIT as DESERT } from "./kits/desert";

useKits(RUINS, JUNGLE, DESERT);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the levels (as drawn; the plateaus get bevelled corners) ----
// M1: the great terrace (south, running on past the edge); M2: its upper step, the mausoleum's;
// E1: the fig hill (north-east); the west ridge with the tomb gate in its face; high ground past
// the other edges, gaps left for the two ways out
const M1: XY[] = [[-1300, -2700], [-1300, 3300], [-3000, 3400], [-6000, 3200], [-6000, -2800], [-3500, -2900]];
const M2: XY[] = [[-2600, -1100], [-2600, 1900], [-3900, 2000], [-5100, 1800], [-5100, -1100], [-3900, -1200]];
const E1: XY[] = [[1700, -2700], [3900, -2500], [4500, -3600], [4000, -4800], [2100, -4900], [1400, -3900]];
const WEST: XY[] = [[3800, 4100], [2500, 3950], [1000, 4100], [-500, 3950], [-1600, 4200], [-6000, 4000], [-6000, A], [3900, A]];
// (its west side drawn back from the west ridge's: the ravine between them is the way to the first tree)
const RIM_NW: XY[] = [[4650, 4100], [5800, 1300], [A, 1300], [A, A], [4650, A]];
const RIM_NE: XY[] = [[5800, -500], [A, -500], [A, -A], [800, -A], [800, -6000], [3000, -5800], [5200, -5900], [6000, -4000]];
const RIM_SE: XY[] = [[-1200, -6000], [-3500, -5800], [-6000, -6000], [-6000, -A], [-1300, -A]];
// (a gap in it where the way to the sacred banyan woods runs on)
const RIM_S: XY[] = [[-6300, -A], [-6400, -4300], [-8200, -4250], [-8200, -2550], [-6400, -2500], [-6300, 3500], [-6400, A], [-A, A], [-A, -A]];
// the terrace's stairs and the upper step's (straight ramps of 9 m rising 3 m), the fig hill's ramp
const M1_STAIRS = { top: [-1300, 400] as XY, bottom: [-400, 400] as XY, width: 440, straight: true };
const M2_STAIRS = { top: [-2600, 400] as XY, bottom: [-1700, 400] as XY, width: 440, straight: true };
const E1_RAMP = rampOff(E1, 1, 0.5, 1000, 440);

// ---- the places ----
const PLAIN: XY = [5150, 400], JUNGLE_WAY: XY = [-200, -5150], BANYAN_WAY: XY = [-5150, -3400], TREE_WAY: XY = [4300, 5150];
const AV_Y = 400;                    // the avenue's line
const MAUSOLEUM: XY = [-3800, 400];
const GATE: XY = [1300, 3800];       // the sealed tomb gate, against the west ridge
const FIG: XY = [3000, -3800];       // the giant fig on its hill

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(313, {
    hills: [
      { x: 2200, y: 2600, r: 700, h: -70 }, { x: 1500, y: -1500, r: 700, h: 90 }, { x: 3800, y: 2300, r: 700, h: 100 },
      { x: 4700, y: -1700, r: 700, h: 110 }, { x: -200, y: 2700, r: 800, h: 80 }, { x: 600, y: -3800, r: 700, h: -60 },
    ],
    plateaus: [
      { poly: bevel(M1), h: 300, ramps: [M1_STAIRS] },
      { poly: bevel(M2), h: 600, ramps: [M2_STAIRS] },
      { poly: bevel(E1), h: 280, ramps: [E1_RAMP] },
      { poly: bevel(WEST), h: 520 }, { poly: bevel(RIM_NW), h: 600 }, { poly: bevel(RIM_NE), h: 650 }, { poly: bevel(RIM_SE), h: 700 }, { poly: bevel(RIM_S), h: 900 },
    ],
    rock: "Ruins_CliffDark",
  });
  const AREA = { x0: -A, x1: A, y0: -A, y1: A };

  // ---- the ways: the avenue of flagstones, paved paths through the tombs, a track into the trees ----
  const AVENUE: XY[] = [[4500, AV_Y + 280], [4500, AV_Y - 280], [-420, AV_Y - 280], [-420, AV_Y + 280]];
  const LANDING1: XY[] = [[-1240, AV_Y + 260], [-1240, AV_Y - 260], [-1760, AV_Y - 260], [-1760, AV_Y + 260]];
  const LANDING2: XY[] = [[-2540, AV_Y + 520], [-2540, AV_Y - 520], [-2900, AV_Y - 520], [-2900, AV_Y + 520]];
  const IN_WAY: XY[] = [[7300, AV_Y + 60], PLAIN, [4400, AV_Y]];
  const TOMB_W: XY[] = smooth([[4000, 680], [3950, 1500], [3400, 2350], [2400, 2420], [1300, 2380], [300, 2420], [-600, 2350]]);
  const GATE_WAY: XY[] = smooth([[1300, 2400], [1320, 2900], [1300, 3350]]);
  const TOMB_E: XY[] = smooth([[4000, 120], [3950, -700], [3400, -1650], [2300, -1720], [1200, -1680]]);
  const FIG_WAY: XY[] = [...smooth([[4600, 150], [4850, -700], [5050, -1600], [E1_RAMP.bottom[0] + 60, E1_RAMP.bottom[1] + 300]]), E1_RAMP.bottom, E1_RAMP.top, ...smooth([[4000, -3200], [3600, -3500], [3350, -3600]])];
  const OUT_WAY: XY[] = smooth([[700, AV_Y - 260], [550, -800], [350, -2000], [100, -3200], [-100, -4300], JUNGLE_WAY, [-300, -7300]]);
  const SOUTH_WAY: XY[] = smooth([[100, -3200], [-1000, -3450], [-2500, -3500], [-4000, -3450], BANYAN_WAY, [-7600, -3400]]);
  const WEST_WAY: XY[] = smooth([[3400, 2350], [3850, 3050], [4250, 3800], [4300, 4500], TREE_WAY, [4300, 7600]]);
  const roads = [band(IN_WAY, 520), band(TOMB_W, 380), band(GATE_WAY, 380), band(TOMB_E, 380), band(FIG_WAY, 400), band(OUT_WAY, 430), band(SOUTH_WAY, 400), band(WEST_WAY, 400)];
  const ground = f.ground({ area: AREA, cell: 60, roads, plazas: [AVENUE, LANDING1, LANDING2], base: "moss", track: false, tint: "#b9bdae", road: [0.82, 0.82, 0.78], plaza: [0.8, 0.8, 0.78] });

  // ---- the ways out ----
  f.exit("ancient_plain", PLAIN, [4450, AV_Y]);
  f.exit("south_jungle", JUNGLE_WAY, [-120, -4450]);
  f.exit("sacred_banyan", BANYAN_WAY, [-4450, -3440]);
  f.exit("first_tree", TREE_WAY, [4280, 4430]);

  // ---- placing: every thing remembered (x, y, r) so the trees keep clear ----
  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number) => taken.every(([px, py, pr]) => Math.hypot(px - x, py - y) > pr + r);
  const open = (x: number, y: number, r: number) => [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0);
  const put = (ref: string, at: XY, h = 0, o: { s?: number; solid?: "auto" | "none" | SolidSpec[]; r?: number } = {}) => {
    f.put(ref.includes(":") ? ref : `ruins:${ref}`, at, h, { s: o.s ?? 1, solid: o.solid ?? "auto" });
    taken.push([at[0], at[1], o.r ?? 120]);
  };
  const disc = (r: number, x = 0, y = 0, kind = "tree"): SolidSpec => ({ kind, x, y, r });
  const box = (w: number, d: number, x = 0, y = 0, kind = "ruin"): SolidSpec => ({ kind, x, y, w, d, rot: 0 });
  const tomb = (at: XY, h: number) => put("stone_tomb", at, h, { solid: [box(330, 250, 0, 0, "tomb")], r: 230 });
  const sarco = (at: XY, h: number) => put("sarcophagus", at, h, { solid: [box(284, 144, 0, 0, "tomb")], r: 170 });
  const brazier = (at: XY) => put("ghost_brazier", at, 0, { solid: [disc(40, 0, 0, "post")], r: 70 });
  const level = (at: XY, r: number) => f.level(at[0], at[1], r) && open(at[0], at[1], r * 0.6);

  // ---- the way in from the plain: obelisks either side of the avenue's head, a signpost ----
  for (const s of [-1, 1]) put("obelisk", [4300, AV_Y + s * 520], 0, { r: 160 });
  put("desert:signpost", [4700, AV_Y + 650], towards(1, -0.4), { solid: [disc(20, 0, 0, "post")], r: 90 });

  // ---- the avenue: guardians facing across it, ghost-fire between them, obelisks at its foot ----
  for (let x = 3600; x >= -100; x -= 900)
    for (const s of [-1, 1]) {
      put("guardian_statue", [x, AV_Y + s * 540], s > 0 ? 90 : -90, { s: 1.15, r: 140 });
      if (x > 0) brazier([x - 450, AV_Y + s * 520]);
    }
  for (const s of [-1, 1]) put("obelisk", [-250, AV_Y + s * 900], 0, { r: 160 });

  // ---- the terraces: their stairs, braziers at the landings, the mausoleum on the upper step ----
  for (const st of [M1_STAIRS, M2_STAIRS]) put("temple_stairs", [(st.top[0] + st.bottom[0]) / 2, (st.top[1] + st.bottom[1]) / 2], alongDir(st.top[0] - st.bottom[0], st.top[1] - st.bottom[1]), { solid: "none", r: 480 });
  for (const s of [-1, 1]) brazier([-1500, AV_Y + s * 330]);
  for (const s of [-1, 1]) put("guardian_statue", [-2750, AV_Y + s * 680], 180, { s: 1.15, r: 140 });
  put("mausoleum", MAUSOLEUM, 180, { r: 1000 });

  // the terrace's wings: sarcophagi in rows on the west one, tombs among the trees on the east one
  for (let x = -1900; x >= -5200; x -= 520) {
    for (const y of [2350, 2950]) if (level([x, y], 180)) sarco([x, y], y > 2600 ? 4 : -6);
  }
  for (const [x, y, h] of [[-2000, -1700, 0], [-2800, -2100, 180], [-3700, -1700, 0], [-4500, -2100, 180], [-5300, -1700, 0]] as [number, number, number][]) if (level([x, y], 220)) tomb([x, y], h);
  for (const at of [[-2400, -2400], [-4100, -2400], [-3300, -1500]] as XY[]) if (level(at, 200)) put("root_tangle", at, at[0] % 360, { solid: [box(260, 150)], r: 230 });

  // ---- the west tombs: two rows facing across their path, sarcophagi between, the sealed gate ----
  for (let x = 3200; x >= -300; x -= 460) {
    if (Math.abs(x - GATE[0]) < 320) continue;
    for (const [y, h] of [[1950, -90], [2860, 90]] as [number, number][]) if (level([x, y], 220)) tomb([x, y], h);
  }
  for (const [x, y, h] of [[2700, 3350, 10], [2100, 3400, -8], [400, 3350, 4], [-200, 3300, 170], [3100, 1450, 90], [2200, 1450, 90], [700, 1450, 90]] as [number, number, number][]) if (level([x, y], 180)) sarco([x, y], h);
  put("tomb_gate", GATE, 90, { solid: [box(400, 900, 0, 0, "gate")], r: 520 });
  for (const s of [-1, 1]) {
    put("guardian_statue", [GATE[0] + s * 700, GATE[1] - 380], 90, { r: 140 });
    brazier([GATE[0] + s * 480, GATE[1] - 620]);
  }
  for (const at of [[3400, 3300], [-700, 3200], [1900, 1100]] as XY[]) put("obelisk", at, 0, { r: 160 });

  // ---- the east tombs in the trees, the fig hill ----
  for (let x = 3200; x >= 1300; x -= 460)
    for (const [y, h] of [[-1240, 90], [-2160, -90]] as [number, number][]) if (level([x, y], 220) && !(x < 2000 && y < -2000)) tomb([x, y], h);
  for (const at of [[2500, -1000], [1600, -2400], [3700, -2200], [1000, -1000]] as XY[]) if (level(at, 200)) put("root_tangle", at, (at[0] + at[1]) % 360, { solid: [box(260, 150)], r: 230 });
  put("jungle:strangler_fig", FIG, 30, { solid: [disc(320)], r: 620 });
  for (const [x, y, h] of [[2300, -3400, 90], [2400, -4300, 90], [3700, -4300, -90]] as [number, number, number][]) if (level([x, y], 220)) tomb([x, y], h);
  put("root_tangle", [2700, -3000], 200, { solid: [box(260, 150)], r: 230 });
  put("obelisk", [3700, -3200], 0, { s: 0.85, r: 150 });
  brazier([3550, -3480]);

  // ---- the way to the jungle: a trail sign and torches of ghost-fire ----
  put("jungle:trail_sign", [250, -4500], towards(-0.4, -1), { solid: [disc(20, 0, 0, "post")], r: 90 });
  for (const s of [-1, 1]) brazier([-120 + s * 420, -4750]);
  put("jungle:trail_sign", [950, 150], towards(1, -1), { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("jungle:trail_sign", [-4700, -3000], towards(-1, 0.3), { solid: [disc(20, 0, 0, "post")], r: 90 });
  put("jungle:trail_sign", [4000, 4700], towards(0.3, 1), { solid: [disc(20, 0, 0, "post")], r: 90 });
  for (const s of [-1, 1]) brazier([4300 + s * 280, 4400]);

  // ---- wisps over the graves, mist in the hollows ----
  for (const at of [[2500, 2400], [700, 2900], [-2200, 2650], [2900, -1700], [1700, -1700], [-4000, -1900], [3300, -3900], [-600, -3000]] as XY[]) put("wisp_lights", at, (at[0] * 3) % 360, { solid: "none", r: 60 });
  for (const at of [[2200, 2500], [600, -3800], [3000, -1700], [-3600, 2700], [1800, 3300]] as XY[]) put("poison_mist", at, (at[1] * 2) % 360, { solid: "none", r: 10 });

  // ---- trees: the jungle thick in the east and creeping in among the tombs, thin cypress-dark
  // pines and dead trees in the west ----
  const keepOut = (x: number, y: number) =>
    Math.hypot(x - MAUSOLEUM[0], y - MAUSOLEUM[1]) < 1300 || Math.hypot(x - GATE[0], y - GATE[1]) < 900 || inPoly(AVENUE, x, y) || Math.abs(y - AV_Y) < 900 && x > -500 ||
    f.warps.some((w) => Math.hypot(w.x - x, w.y - y) < 700) || distTo([E1_RAMP.top, E1_RAMP.bottom], x, y) < 450 || Math.hypot(x - FIG[0], y - FIG[1]) < 650 ||
    distTo([M1_STAIRS.top, M1_STAIRS.bottom], x, y) < 450 || distTo([M2_STAIRS.top, M2_STAIRS.bottom], x, y) < 450;
  const rnd = f.rnd;
  for (let x = -R + 200; x < R; x += 380)
    for (let y = -R + 200; y < R; y += 380) {
      const px = x + (rnd() - 0.5) * 300, py = y + (rnd() - 0.5) * 300;
      const edge = Math.min(R - Math.abs(px), R - Math.abs(py)), east = py < -900;
      const want = east ? (edge < 900 ? 0.8 : py < -2600 ? 0.5 : 0.3) : edge < 800 ? 0.45 : 0.06;
      if (rnd() > want || !open(px, py, 260) || !f.level(px, py, 180) || !free(px, py, 240) || keepOut(px, py)) continue;
      const k = rnd();
      const kind = east ? (k < 0.45 ? "flora:JungleTree" : k < 0.65 ? "jungle:vine_tree" : k < 0.8 ? "flora:JungleBush" : "flora:Bamboo") : k < 0.45 ? "flora:Pine" : k < 0.75 ? "desert:dead_tree" : "flora:PineSmall";
      const big = kind === "jungle:vine_tree";
      put(kind, [px, py], rnd() * 360, { s: 0.8 + rnd() * 0.35, solid: kind === "flora:JungleBush" ? "none" : big ? [disc(50)] : kind === "desert:dead_tree" ? [disc(30)] : "auto", r: big ? 260 : 200 });
    }
  // ferns and bushes under the jungle, on the east side only
  for (let x = -R + 100; x < R; x += 240)
    for (let y = -R + 100; y < -700; y += 240) {
      const px = x + (rnd() - 0.5) * 200, py = y + (rnd() - 0.5) * 200;
      if (rnd() > (py < -2500 ? 0.45 : 0.22) || !open(px, py, 150) || !f.level(px, py, 100) || !free(px, py, 90) || keepOut(px, py)) continue;
      put(rnd() < 0.5 ? "jungle:giant_fern" : rnd() < 0.5 ? "flora:JungleBush" : "jungle:elephant_ear", [px, py], rnd() * 360, { s: 0.75 + rnd() * 0.4, solid: "none", r: 80 });
    }
  // past the edge: jungle to the east and south, dark pines and dead trees to the north and west
  const rimOut = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) === 1 || distTo(OUT_WAY, x, y) < 450 || distTo(IN_WAY, x, y) < 450 || distTo(SOUTH_WAY, x, y) < 450 || distTo(WEST_WAY, x, y) < 450;
  f.woods({ x0: -A, x1: A, y0: -A, y1: -1500 }, ["JungleTree", "JungleTree", "Bamboo", "JungleBush", "PalmTall"], rimOut, { count: 420, spacing: 360, tries: 9000 });
  f.woods({ x0: -A, x1: -R, y0: -1500, y1: A }, ["JungleTree", "Pine", "JungleTree", "JungleBush"], rimOut, { count: 120, spacing: 420, tries: 4000 });
  f.woods({ x0: -R, x1: A, y0: -1500, y1: A }, ["Pine", "PineSmall", "Pine", "BigOak"], rimOut, { count: 260, spacing: 440, tries: 6000 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: -1500 }, ["vine_tree", "giant_fern"], rimOut, { count: 120, spacing: 600, tries: 3000, kit: "jungle" });

  // ---- monsters: among the tombs, on the terraces, the fig hill ----
  const KEEPER: XY = [4050, 1250], SEEKER: XY = [250, -3900];
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 800, keepOut: (x, y) => Math.hypot(x - KEEPER[0], y - KEEPER[1]) < 800 || Math.hypot(x - SEEKER[0], y - SEEKER[1]) < 800 });

  const npcs: NpcSpec[] = [
    {
      id: "rn_keeper", x: KEEPER[0], y: KEEPER[1], face: 210, name: "ตาเฒ่าโอเรน", title: "ผู้เฝ้าสุสานหลวง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "violet", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "ทางนี้คือถนนของกษัตริย์องค์แรก ทหารหินเฝ้ามาพันปี อย่าทำเสียงดังต่อหน้าพวกเขา",
        "ไฟในกระถางเป็นสีเขียวมาตั้งแต่ข้ายังเด็ก ไม่มีใครเติมน้ำมัน ไม่มีใครจุด",
        "ประตูในหน้าผาตะวันตกผนึกไว้ด้วยแสงสีม่วง ใครแตะต้องจะได้ยินเสียงกระซิบไปอีกหลายคืน",
      ],
    },
    {
      id: "rn_seeker", x: SEEKER[0], y: SEEKER[1], face: 90, name: "ทาเลีย", title: "นักล่าสมบัติ", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "crimson", eyes: "amber", top: "top_adventurer_ochre", bottom: "bottom_adventurer_black" },
      lines: [
        "ป่าแดนใต้กลืนสุสานฝั่งตะวันออกไปครึ่งหนึ่งแล้ว รากไทรชอนไชลงไปถึงห้องเก็บศพ",
        "เดินตามทางนี้ไปตะวันออกจะออกป่าดิบแดนใต้ ส่วนมหาสุสานบนลานสูง... ข้ายังไม่กล้าขึ้นไป",
      ],
    },
  ];

  return f.finishField({
    ground,
    sky: "#3b4a3e",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && y > -800 && x > -1200, density: 0.05 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4300, y: AV_Y - 120 },
    npcs,
    labels: [
      { x: PLAIN[0] - 250, y: PLAIN[1], text: "ทางไปที่ราบโบราณ", kind: "gate" },
      { x: JUNGLE_WAY[0], y: JUNGLE_WAY[1] + 250, text: "ทางไปป่าดิบแดนใต้", kind: "gate" },
      { x: BANYAN_WAY[0] + 250, y: BANYAN_WAY[1], text: "ทางไปป่าไทรศักดิ์สิทธิ์", kind: "gate" },
      { x: TREE_WAY[0] - 250, y: TREE_WAY[1], text: "ทางไปป่าต้นไม้แรก", kind: "gate" },
      { x: MAUSOLEUM[0], y: MAUSOLEUM[1] - 1100, text: "มหาสุสานหลวง" },
      { x: 1800, y: AV_Y, text: "ถนนทหารหินเฝ้าสุสาน" },
      { x: GATE[0] - 500, y: GATE[1] - 300, text: "ประตูสุสานผนึก" },
      { x: 1700, y: 2400, text: "แถวสุสานหิน", kind: "small" },
      { x: 2300, y: -1700, text: "สุสานในป่า", kind: "small" },
      { x: FIG[0] - 400, y: FIG[1], text: "เนินไทรกลืนสุสาน" },
      { x: -2100, y: 400, text: "ลานสุสานชั้นล่าง", kind: "small" },
    ],
  });
}

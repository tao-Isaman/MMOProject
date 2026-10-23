// บาฮามัส (Bahamas), the caravan city in the middle of the desert, the crossroads to the south.
// Laid out as if drawn on paper like the player's other towns: a walled box about 166 x 161 m with
// three gates. The main gate on the north (the road from Eden) opens onto the bazaar street, two
// rows of awnings, spice stalls and rug piles in front of arcaded merchant houses, which runs down
// to the obelisk square in the middle of town. West of the square a forecourt leads to the palace
// under its turquoise dome, raised on a terrace against the west wall (the high side of town);
// behind the bazaar on the north-west the oasis lies in two rings of palms with houses round it;
// the north-east is the quarter of blue-domed houses, two lanes off the bazaar street and a date
// palm garden behind; the east road goes out to the east gate; the south road down to the south
// gate, beside it the caravan camp (tents, camel troughs, carts) under the caravanserai along the
// east wall; the south-west is the adobe quarter: three lanes, a well square and the potters' yard
// by the wall. Outside: open dunes with a few palms, cacti and rock arches.
//
// The plan is read in its own pixels (u right, v down, as drawn) and turned into the world:
// north (up the page) is +X, east (right) is -Y. One plan pixel is 26 cm; the obelisk square
// sits at about the origin. Everything comes from the Bahamas kit (src/world3d/kits/bahamas.ts),
// the shared props and the flora.

import { KIT } from "./kits/bahamas";
import { defineMaterial } from "./textures";
import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import { Plan, TownBuilder, useKits, colourways, protoOf, facing, FACE, travelGuide, gateWay, waysOut } from "./town";
import type { Side, Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(KIT);

// Colourways: adobe in ochre, rose, pale sand or whitewash with cobalt trims; the domes (white in
// the kit) tiled turquoise or cobalt; merchants' awnings in teal or saffron.
defineMaterial("BahamasTown_AdobeRose", { map: "adobe", tint: "#d48d6a", bump: 1 });
defineMaterial("BahamasTown_AdobeSand", { map: "adobe", tint: "#e2c08c", bump: 1 });
defineMaterial("BahamasTown_Lime", { map: "adobe", tint: "#f2ebdd", bump: 1 });
defineMaterial("BahamasTown_TrimCobalt", { map: "adobe", tint: "#3c66b2", bump: 0.6 });
defineMaterial("BahamasTown_ShutterBlue", { map: "wood", tint: "#3b5f9e", bump: 1 });
defineMaterial("BahamasTown_DomeCobalt", { map: "tiles", tint: "#2d5db2", rough: 0.4, bump: 2 });
colourways({
  rose: { AdobeOchre: "BahamasTown_AdobeRose" },
  sand: { AdobeOchre: "BahamasTown_AdobeSand", Bahamas_ShutterTeal: "BahamasTown_ShutterBlue" },
  lime: { AdobeOchre: "BahamasTown_Lime", AdobeWhite: "BahamasTown_TrimCobalt", Bahamas_ShutterTeal: "BahamasTown_ShutterBlue" },
  domeTeal: { AdobeWhite: "Bahamas_DomeTeal" },
  domeCobalt: { AdobeWhite: "BahamasTown_DomeCobalt" },
  limeTeal: { SandstoneWarm: "BahamasTown_Lime", AdobeWhite: "Bahamas_DomeTeal" },
  shopTeal: { AdobeWhite: "Bahamas_DomeTeal", FabricRed: "Bahamas_FabricTeal" },
  shopSaffron: { AdobeWhite: "BahamasTown_DomeCobalt", FabricRed: "Bahamas_FabricSaffron" },
});
// which colourways each house may take ("" = the kit's own colours)
const TINTS: Record<string, string[]> = {
  adobe_house: ["", "rose", "", "sand", "lime", "rose", "sand"],
  domed_house: ["domeTeal", "domeCobalt", "domeTeal", "limeTeal", "domeCobalt", "limeTeal"],
  merchant_house: ["shopTeal", "", "shopSaffron", "shopTeal"],
};

// ---- the plan's pixels -> the world: 26 cm a pixel, (420, 420) at the origin ----
const { P, rect } = new Plan(26, 420, 420);

// ---- the plan (plan pixels) ----
const WALL = { u0: 100, u1: 740, v0: 110, v1: 730 };
const GATE_N_UV: [number, number] = [420, WALL.v0], GATE_E_UV: [number, number] = [WALL.u1, 430], GATE_S_UV: [number, number] = [470, WALL.v1];
const OBELISK: [number, number] = [431, 408];
const POOL: [number, number] = [246, 226];
const WELL_SQ: [number, number] = [270, 611];

export function buildBahamas(quality: { flowers: number }): Town {
  const town = new TownBuilder(23);
  const { put, rnd } = town;
  const at = (u: number, v: number) => P(u, v);

  // ---- ground: sand; sandstone streets and plazas ----
  const roads: Poly[] = [
    rect(385, 104, 455, 335),   // the bazaar street, from the north gate to the square
    rect(540, 405, 746, 455),   // the east road
    rect(445, 482, 495, 736),   // the south road
    rect(400, -700, 440, 104),  // outside the gates: the caravan tracks
    rect(746, 410, 1300, 450),
    rect(450, 736, 490, 1300),
    // the north-east lanes off the bazaar street, and the lane along the east wall
    rect(457, 150, 718, 168), rect(457, 236, 718, 254), rect(700, 120, 718, 405),
    // alleys: into the oasis, from the forecourt north and south, into the palm garden
    rect(352, 236, 385, 254), rect(304, 303, 322, 368), rect(304, 444, 322, 517), rect(521, 286, 540, 335),
    // the south-west lanes and the lane along the west wall
    rect(108, 517, 445, 535), rect(108, 601, 445, 619), rect(248, 685, 412, 703), rect(108, 450, 128, 703),
  ];
  const SQUARE = rect(322, 335, 540, 482);
  const FORECOURT = rect(224, 368, 322, 444);
  const plazas: Poly[] = [SQUARE, FORECOURT, rect(230, 570, 310, 652)];
  const ground = buildPaved({
    area: { x0: -17000, x1: 17000, y0: -17000, y1: 17000 }, roads, plazas, base: "sand",
    road: [0.97, 0.83, 0.62], plaza: [1.0, 0.91, 0.74],
  });

  // ---- the city wall: 8 m pieces between watchtowers, three gates ----
  const NORTH = P(0, WALL.v0)[0], SOUTH = P(0, WALL.v1)[0], WEST = P(WALL.u0, 0)[1], EAST = P(WALL.u1, 0)[1];
  const GATE_N = at(...GATE_N_UV), GATE_E = at(...GATE_E_UV), GATE_S = at(...GATE_S_UV);
  const run = (a: [number, number], b: [number, number], out: Side, gaps: number[] = []) => town.wall(a, b, out, "bahamas:city_wall", { gaps, gap: 1200 });
  run([NORTH, WEST], [NORTH, EAST], "n", [WEST - GATE_N[1]]);
  run([NORTH, EAST], [SOUTH, EAST], "e", [NORTH - GATE_E[0]]);
  run([SOUTH, WEST], [SOUTH, EAST], "s", [WEST - GATE_S[1]]);
  run([NORTH, WEST], [SOUTH, WEST], "w");
  const tower = (u: number, v: number) => put("bahamas:watchtower", at(u, v), 0);
  for (const [u, v] of [[WALL.u0, WALL.v0], [WALL.u1, WALL.v0], [WALL.u0, WALL.v1], [WALL.u1, WALL.v1]]) tower(u, v);
  for (const u of [260, 580]) tower(u, WALL.v0);
  for (const u of [285, 620]) tower(u, WALL.v1);
  for (const v of [270, 430, 590]) tower(WALL.u0, v);
  for (const v of [270, 590]) tower(WALL.u1, v);
  // gates: a tiled arch between two round towers; solids either side of the open passage
  const gateSolid: SolidSpec[] = [
    { kind: "gate", x: 0, y: -250, w: 404, d: 140, rot: 0 },
    { kind: "gate", x: 0, y: 250, w: 404, d: 140, rot: 0 },
    { kind: "gate", x: 0, y: -480, r: 245 },
    { kind: "gate", x: 0, y: 480, r: 245 },
  ];
  put("bahamas:city_gate", GATE_N, FACE.n, { solid: gateSolid });
  put("bahamas:city_gate", GATE_E, FACE.e, { solid: gateSolid });
  put("bahamas:city_gate", GATE_S, FACE.s, { solid: gateSolid });

  // ---- houses: rows wall to wall along the streets, fronts on the plan line a -> b ----
  const row = (a: [number, number], b: [number, number], side: Side, pieces: string[], start = 0) => {
    const A = at(a[0], a[1]), B = at(b[0], b[1]);
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const dx = (B[0] - A[0]) / L, dy = (B[1] - A[1]) / L;
    const r = (FACE[side] * Math.PI) / 180, fx = -Math.cos(r), fy = -Math.sin(r);
    const along = -Math.sin(r) * dx + Math.cos(r) * dy > 0 ? 1 : -1;
    let t = 0;
    for (let i = start; ; i++) {
      let piece = pieces[i % pieces.length];
      const pick = () => {
        const tints = TINTS[piece] ?? [""];
        const colours = tints[Math.floor(rnd() * tints.length)] || undefined;
        return { colours, f: protoOf(`bahamas:${piece}`, colours).foot };
      };
      let { colours, f } = pick();
      if (t + (f.y1 - f.y0) > L + 40) {
        // the end of the row: a domed house (the narrowest) if one still fits
        piece = "domed_house";
        ({ colours, f } = pick());
        if (t + (f.y1 - f.y0) > L + 40) break;
      }
      const w = f.y1 - f.y0, c = along > 0 ? t - f.y0 : t + f.y1;
      put(`bahamas:${piece}`, [A[0] + dx * c + fx * f.x0, A[1] + dy * c + fy * f.x0], FACE[side], { colours });
      t += w + 4;
    }
  };
  const BAZAAR = ["merchant_house", "domed_house", "merchant_house", "adobe_house", "merchant_house"];
  const DOMES = ["domed_house", "adobe_house", "domed_house", "adobe_house", "merchant_house", "domed_house"];
  const ADOBE = ["adobe_house", "domed_house", "adobe_house", "adobe_house", "domed_house", "adobe_house"];
  // the bazaar street: merchants' arcades both sides, lanes left open off it
  row([383, 122], [383, 236], "e", BAZAAR, 0);
  row([383, 254], [383, 300], "e", BAZAAR, 2);
  row([457, 122], [457, 150], "w", ["domed_house"]);
  row([457, 168], [457, 236], "w", BAZAAR, 1);
  row([457, 254], [457, 300], "w", BAZAAR, 4);
  // round the obelisk square (the alley into the palm garden at its north-east corner)
  row([324, 333], [383, 333], "s", ["domed_house", "adobe_house"]);
  row([457, 333], [519, 333], "s", ["adobe_house", "domed_house"]);
  row([542, 337], [542, 403], "w", ["merchant_house", "domed_house"]);
  row([324, 484], [443, 484], "n", ["merchant_house", "domed_house", "adobe_house", "merchant_house"]);
  row([497, 484], [538, 484], "n", ["merchant_house"]);
  // the palace forecourt, a house each side of it
  row([226, 366], [302, 366], "s", ["merchant_house", "domed_house"]);
  row([226, 446], [302, 446], "n", ["merchant_house", "domed_house"]);
  // the oasis quarter: houses round the oasis, facing it
  row([128, 152], [348, 152], "s", ADOBE, 0);
  row([142, 170], [142, 340], "e", ADOBE, 3);
  row([142, 303], [302, 303], "n", ADOBE, 1);
  // the quarter of blue domes: both sides of two lanes, along the east road
  row([490, 150], [698, 150], "s", DOMES, 0);
  row([490, 168], [698, 168], "n", DOMES, 2);
  row([490, 236], [698, 236], "s", DOMES, 1);
  row([490, 254], [698, 254], "n", DOMES, 3);
  row([574, 403], [698, 403], "s", DOMES, 4);
  // the south-east: along the east road, the south road, the caravanserai along the east wall
  row([542, 457], [698, 457], "n", DOMES, 2);
  row([497, 517], [497, 560], "w", ["merchant_house"]);
  row([698, 492], [698, 720], "w", ["merchant_house"]);
  // the adobe quarter (south-west): three lanes, the well square on the middle one
  row([150, 515], [302, 515], "s", ADOBE, 2);
  row([130, 537], [410, 537], "n", ADOBE, 0);
  row([130, 601], [228, 601], "s", ADOBE, 4);
  row([312, 601], [410, 601], "s", ADOBE, 1);
  row([130, 621], [228, 621], "n", ADOBE, 3);
  row([312, 621], [410, 621], "n", ADOBE, 5);
  row([443, 537], [443, 601], "e", ADOBE, 2);
  row([443, 619], [443, 722], "e", ADOBE, 4);
  row([250, 685], [410, 685], "s", ADOBE, 3);

  // ---- lamps and trees ----
  const lamp = (u: number, v: number, h = 0) => put("bahamas:lantern_post", at(u, v), h, { solid: [{ kind: "post", x: 0, y: 0, r: 24 }] });
  const brazier = (u: number, v: number) => put("bahamas:brazier", at(u, v), rnd() * 90);
  const PALMS = ["Palm", "PalmTall", "Palm", "PalmBent"];
  const palm = (u: number, v: number, s = 0.85 + rnd() * 0.3, kind = PALMS[Math.floor(rnd() * PALMS.length)]) => put(`flora:${kind}`, at(u, v), rnd() * 360, { s });
  // an avenue: palms and lamps in turn from a to b
  const avenue = (a: [number, number], b: [number, number], step: number, h: number) => {
    const n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step);
    for (let i = 0; i <= n; i++) {
      const u = a[0] + ((b[0] - a[0]) * i) / n, v = a[1] + ((b[1] - a[1]) * i) / n;
      if (i % 2) lamp(u, v, h);
      else palm(u, v, 0.8 + rnd() * 0.2, rnd() < 0.5 ? "PalmTall" : "Palm");
    }
  };

  // ---- the bazaar street: stalls down both sides in front of the arcades ----
  const GOODS = ["bazaar_stall", "spice_stall", "rug_pile", "bazaar_stall", "spice_stall", "pottery_set", "bazaar_stall", "rug_pile", "spice_stall"];
  const SPAN: Record<string, number> = { bazaar_stall: 19, spice_stall: 15, rug_pile: 17, pottery_set: 11 };
  const stalls = (u: number, side: Side, gaps: [number, number][], start: number) => {
    let v = 148, i = start, n = 0;
    while (v < 330) {
      const kind = GOODS[i % GOODS.length], len = SPAN[kind];
      if (v + len > 330) break;
      const gap = gaps.find(([g0, g1]) => v + len > g0 - 3 && v < g1 + 3);
      if (gap) {
        v = gap[1] + 4;
        continue;
      }
      put(`bahamas:${kind}`, at(u, v + len / 2), FACE[side], { s: 1.15 });
      v += len + 3;
      i++;
      if (++n % 4 === 0 && v + 8 < 330 && !gaps.some(([g0, g1]) => v + 8 > g0 - 3 && v < g1 + 3)) {
        lamp(u, v + 2, 90);
        v += 8;
      }
    }
  };
  stalls(398, "e", [[236, 254]], 0);
  stalls(442, "w", [[150, 168], [236, 254]], 4);
  // braziers inside the north gate
  brazier(396, 128);
  brazier(444, 128);

  // ---- the obelisk square ----
  // the obelisk on a star of glazed tiles (4 m each, five by five without the corners), braziers
  // in the corners, a ring of lamps and palms round it
  {
    const [ox, oy] = at(...OBELISK);
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (Math.abs(i) + Math.abs(j) < 4) put("bahamas:plaza_tile", [ox + i * 400, oy + j * 400], 0);
    for (const [i, j] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put("bahamas:brazier", [ox + i * 800, oy + j * 800], 0);
  }
  put("bahamas:obelisk", at(...OBELISK), 0, { s: 1.6 });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    lamp(OBELISK[0] + Math.cos(a) * 70, OBELISK[1] + Math.sin(a) * 52, facing(Math.cos(a), Math.sin(a)) + 90);
  }
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    palm(OBELISK[0] + Math.cos(a) * 84, OBELISK[1] + Math.sin(a) * 60, 1, "PalmTall");
  }
  // the square's market: stalls along its south and east sides, tea under sails
  put("bahamas:spice_stall", at(336, 470), FACE.n);
  put("bahamas:bazaar_stall", at(354, 470), FACE.n);
  put("bahamas:rug_pile", at(372, 471), FACE.n);
  put("bahamas:spice_stall", at(406, 470), FACE.n);
  put("bahamas:bazaar_stall", at(424, 470), FACE.n);
  put("bahamas:spice_stall", at(530, 350), FACE.w);
  put("bahamas:pottery_set", at(531, 366), rnd() * 360);
  put("bahamas:bazaar_stall", at(530, 384), FACE.w);
  put("bahamas:shade_sail", at(512, 466), FACE.n);
  put("bahamas:shade_sail", at(345, 351), FACE.s);
  palm(328, 343, 0.9);
  put("common:market_cart", at(388, 471), FACE.n);

  // ---- the palace: raised on its terrace against the west wall, facing the square down the
  // forecourt, a stair down from the terrace between lamp pedestals ----
  put("bahamas:palace_terrace", at(176, 406), FACE.e, {
    solid: [
      { kind: "palace", x: -30, y: 0, w: 2420, d: 2360, rot: 0 },
      { kind: "palace", x: -1405, y: 0, w: 330, d: 940, rot: 0 },
      { kind: "post", x: -1630, y: -442, r: 45 },
      { kind: "post", x: -1630, y: 442, r: 45 },
    ],
  });
  put("bahamas:grand_palace", at(176, 406), FACE.e, { z: 140, solid: "none" });
  for (const v of [374, 438]) {
    for (const u of [244, 270, 296]) palm(u, v, 0.95, "PalmTall");
    for (const u of [257, 283, 309]) lamp(u, v, 0);
  }
  // palms in the palace gardens behind and beside it
  for (const [u, v] of [[118, 362], [160, 352], [200, 350], [160, 462], [200, 466], [118, 400]]) palm(u, v);

  // ---- the oasis: the pool in a ring of palms, tea under sails, a well ----
  put("bahamas:oasis_pool", at(...POOL), FACE.e, {
    s: 2.5, solid: [{ kind: "water", x: 0, y: 0, w: 800, d: 380, rot: 0 }, { kind: "water", x: 0, y: 0, w: 560, d: 580, rot: 0 }],
  });
  const OASIS_KEEP: [number, number, number][] = [[318, 180, 16], [176, 288, 16], [330, 282, 12], [338, 214, 14], [300, 164, 6], [156, 300, 6], [336, 296, 6], [298, 226, 8]];
  const clear = (u: number, v: number) => !OASIS_KEEP.some(([ku, kv, r]) => Math.hypot(u - ku, v - kv) < r + 6);
  // two rings of palms, open on the east where the step goes down to the water
  for (const [n, ru, rv, j] of [[14, 54, 40, 0], [11, 74, 57, 0.5]]) {
    for (let k = 0; k < n; k++) {
      const a = ((k + j) / n) * Math.PI * 2 + (rnd() - 0.5) * 0.18;
      if (Math.cos(a) > 0.93) continue;
      const r = 1 + (rnd() - 0.5) * 0.1, u = POOL[0] + Math.cos(a) * ru * r, v = POOL[1] + Math.sin(a) * rv * r;
      if (clear(u, v)) palm(u, v, 0.95 + rnd() * 0.3);
    }
  }
  for (let k = 0; k < 9; k++) {
    const a = ((k + 0.25) / 9) * Math.PI * 2;
    const u = POOL[0] + Math.cos(a) * 63, v = POOL[1] + Math.sin(a) * 48;
    if (Math.cos(a) < 0.85 && clear(u, v)) put("flora:JungleBush", at(u, v), rnd() * 360, { s: 0.8 + rnd() * 0.3 });
  }
  put("bahamas:shade_sail", at(318, 180), FACE.w);
  put("bahamas:shade_sail", at(176, 288), FACE.n);
  put("bahamas:well", at(330, 282), FACE.w);
  put("bahamas:camel_trough", at(338, 214), FACE.w);
  put("bahamas:pottery_set", at(166, 180), rnd() * 360);
  for (const [u, v] of [[300, 164], [156, 300], [336, 296]]) lamp(u, v);

  // ---- the quarter of blue domes ----
  // lamps where the lanes meet the bazaar street and the lane along the east wall
  for (const [u, v] of [[488, 159], [488, 245], [690, 159], [690, 245]]) lamp(u, v, 90);
  // the date palm garden behind the square: palms in rows, a well, a sail, pots
  put("bahamas:well", at(624, 326), 0);
  put("bahamas:shade_sail", at(670, 352), FACE.w);
  put("bahamas:pottery_set", at(560, 300), rnd() * 360);
  for (let v = 298; v <= 362; v += 21)
    for (let u = 556; u <= 690; u += 22) {
      if ((v > 330 && u < 588) || Math.hypot(u - 624, v - 326) < 16 || Math.hypot(u - 670, v - 352) < 18 || Math.hypot(u - 560, v - 300) < 10) continue;
      palm(u + (rnd() - 0.5) * 4, v + (rnd() - 0.5) * 4, 0.85 + rnd() * 0.2, rnd() < 0.7 ? "Palm" : "PalmTall");
    }
  // along the east road
  avenue([556, 413], [690, 413], 22, 0);
  avenue([556, 447], [690, 447], 22, 0);
  brazier(722, 412);
  brazier(722, 448);

  // ---- the south road and the caravan camp beside the south gate ----
  avenue([453, 500], [453, 692], 24, 90);
  avenue([487, 572], [487, 692], 24, 90);
  // tents in three rows, the first two facing the yard between them
  for (const u of [560, 600, 640]) put("bahamas:caravan_tent", at(u, 528), FACE.s);
  for (const u of [560, 600, 640]) put("bahamas:caravan_tent", at(u, 622), FACE.n);
  for (const u of [565, 605, 645]) put("bahamas:caravan_tent", at(u, 694), FACE.n, { s: 0.92 });
  // camel troughs along the road, hay, carts, crates, a sail and fires in the yard
  for (const v of [584, 614, 644, 674]) put("bahamas:camel_trough", at(516, v), FACE.e);
  put("common:market_cart", at(624, 576), 30);
  put("common:market_cart", at(552, 582), -20);
  for (const [u, v, z] of [[668, 568, 0], [673, 574, 0], [670, 571, 60], [538, 704, 0], [544, 710, 0], [684, 650, 0]]) put("common:crate", at(u, v), rnd() * 90, { z });
  put("bahamas:shade_sail", at(680, 528), FACE.w);
  put("bahamas:rug_pile", at(620, 655), FACE.n);
  put("bahamas:pottery_set", at(580, 656), rnd() * 360);
  put("bahamas:pottery_set", at(684, 596), rnd() * 360);
  brazier(588, 592);
  brazier(662, 658);
  for (const [u, v] of [[504, 568], [508, 700], [688, 622], [688, 700]]) palm(u, v);
  put("common:market_cart", at(684, 676), 80);
  for (const [u, v] of [[545, 562], [655, 562]]) put("bahamas:pottery_set", at(u, v), rnd() * 360);
  brazier(448, 712);
  brazier(492, 712);

  // ---- the adobe quarter: the well square, the potters' yard by the south wall ----
  put("bahamas:well", at(...WELL_SQ), 20);
  for (const [u, v] of [[240, 580], [300, 580], [240, 642], [300, 642]]) lamp(u, v, 45);
  put("bahamas:pottery_set", at(255, 586), rnd() * 360);
  put("flora:PalmTall", at(288, 640), 40, { s: 1 });
  // the potters' yard: pots drying in rows, a kiln fire, a sail to work under
  put("bahamas:shade_sail", at(212, 668), FACE.e);
  for (const [u, v] of [[148, 664], [148, 686], [148, 708], [172, 664], [172, 708], [236, 708]]) put("bahamas:pottery_set", at(u, v), rnd() * 360);
  put("bahamas:brazier", at(186, 690), 0);
  put("bahamas:rug_pile", at(236, 690), FACE.w);
  put("bahamas:pottery_set", at(204, 712), rnd() * 360);
  palm(238, 662, 0.9, "PalmBent");
  for (const [u, v] of [[120, 540], [120, 620], [264, 526], [380, 526], [380, 610], [330, 694]]) lamp(u, v, u === 120 ? 90 : 0);

  // ---- the open sand left between: palms and cacti, now and then a group of pots ----
  town.greens(ground, { x0: SOUTH, x1: NORTH, y0: EAST, y1: WEST }, {
    trees: ["Palm", "PalmTall", "PalmBent", "Palm", "Cactus", "CactusRound"], other: "bahamas:pottery_set", chance: 0.8, step: 560, margin: 500,
  });

  // ---- outside the walls: open dunes, a few palms and cacti, rock arches ----
  const near = (x: number, y: number, uv: [number, number], r: number) => {
    const [gx, gy] = at(...uv);
    return Math.hypot(x - gx, y - gy) < r;
  };
  const ARCHES = [[-120, 260, 20, 1.2], [-200, 640, 70, 1], [960, 200, 110, 1.1], [1010, 700, 160, 1.3], [230, 990, 40, 1], [760, 1020, 100, 1.2], [640, -230, 10, 1.1], [130, -260, 150, 1]];
  for (const [u, v, h, s] of ARCHES) put("bahamas:rock_arch", at(u, v), h, { s, solid: "none" });
  const track = (x: number, y: number, w: number) => (Math.abs(y - GATE_N[1]) < w && x > NORTH) || (Math.abs(x - GATE_E[0]) < w && y < EAST) || (Math.abs(y - GATE_S[1]) < w && x < SOUTH);
  const walled = (x: number, y: number, m: number) => x > SOUTH - m && x < NORTH + m && y > EAST - m && y < WEST + m;
  // crescent dunes, all lying the same way to the wind from the north-east
  const dunes: [number, number, number][] = [];
  for (let i = 0; i < 900 && dunes.length < 30; i++) {
    const x = -16000 + rnd() * 32000, y = -16000 + rnd() * 32000, s = 0.75 + rnd() * 0.95;
    if (walled(x, y, 1400 + 700 * s) || track(x, y, 1300 + 600 * s) || ARCHES.some(([u, v]) => near(x, y, [u, v], 1500 + 700 * s))) continue;
    if (dunes.some(([dx, dy, ds]) => Math.hypot(dx - x, dy - y) < 900 * (s + ds))) continue;
    dunes.push([x, y, s]);
    put("bahamas:sand_dune", [x, y], -45 + (rnd() - 0.5) * 30, { s, solid: "none" });
  }
  town.woods({ x0: -16000, x1: 16000, y0: -16000, y1: 16000 }, ["Palm", "Cactus", "CactusRound", "PalmBent", "Cactus", "PalmTall", "CactusRound"], (x, y) =>
    walled(x, y, 1000) || track(x, y, 900) || ARCHES.some(([u, v]) => near(x, y, [u, v], 700)) || dunes.some(([dx, dy, ds]) => Math.hypot(dx - x, dy - y) < 800 * ds),
  { count: Math.round(30 + 50 * quality.flowers), spacing: 1300, tries: 3000 });

  // ---- build ----
  const pt = (u: number, v: number) => ({ x: P(u, v)[0], y: P(u, v)[1] });
  return town.finish({
    ground,
    sky: "#e3c48e",
    bounds: { minX: SOUTH - 700, maxX: NORTH + 700, minY: EAST - 700, maxY: WEST + 700 },
    spawn: pt(420, 352),
    npcs: bahamasNpcs(),
    // north to the desert's edge (and on to Eden), east into the great desert, south into the jungle
    ...waysOut([
      gateWay(GATE_N, "n", "desert_edge", 480, 420),
      gateWay(GATE_E, "e", "great_desert", 480, 420),
      gateWay(GATE_S, "s", "south_jungle", 480, 420),
    ]),
    closed: [],
    // names on the map window
    labels: [
      { ...pt(420, 230), text: "ตลาดบาซาร์" },
      { ...pt(431, 452), text: "ลานเสาโอเบลิสก์" },
      { ...pt(262, 406), text: "วังโดมฟ้า" },
      { ...pt(246, 276), text: "โอเอซิส" },
      { ...pt(585, 597), text: "ลานกองคาราวาน" },
      { ...pt(600, 245), text: "ย่านบ้านโดมฟ้า" },
      { ...pt(220, 526), text: "ย่านบ้านดิน" },
      { ...pt(WELL_SQ[0], WELL_SQ[1] + 30), text: "ลานบ่อน้ำ", kind: "small" },
      { ...pt(186, 676), text: "ลานช่างปั้นหม้อ", kind: "small" },
      { ...pt(630, 318), text: "สวนปาล์ม", kind: "small" },
      { ...pt(640, 430), text: "ถนนตะวันออก", kind: "small" },
      { ...pt(470, 650), text: "ถนนใต้", kind: "small" },
      { x: GATE_N[0], y: GATE_N[1], text: "ประตูเหนือ · ขอบทะเลทราย", kind: "gate" },
      { x: GATE_E[0], y: GATE_E[1], text: "ประตูตะวันออก · ทะเลทรายใหญ่", kind: "gate" },
      { x: GATE_S[0], y: GATE_S[1], text: "ประตูใต้ · ป่าดิบแดนใต้", kind: "gate" },
    ],
  });

  // ---- townsfolk ----
  function bahamasNpcs(): NpcSpec[] {
    const spot = (u: number, v: number) => {
      const [x, y] = at(u, v);
      return { x, y };
    };
    // the way someone at (u, v) looks towards plan point (tu, tv), in world degrees
    const toward = (u: number, v: number, tu: number, tv: number) => {
      const [x0, y0] = at(u, v), [x1, y1] = at(tu, tv);
      return (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    };
    const guard = (top: string, hairColor = "ink") => ({ gender: "male", hair: "", hairColor, eyes: "amber", top, bottom: "bottom_warrior_cocoa" });
    return [
      // the north gate
      { id: "bh_guard_n1", ...spot(408, 134), face: 180, name: "ทหารยามฮาคิม", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_navy"),
        lines: ["ออกประตูเหนือไปคือขอบทะเลทราย เดินต่อขึ้นไปผ่านทุ่งสะวันนาจะถึงอีเดน", "พายุทรายกลบเส้นทางบ่อยๆ เดินตามป้ายบอกทางไว้ อย่าหลงออกนอกทาง"] },
      { id: "bh_guard_n2", ...spot(432, 134), face: 180, name: "ทหารยามซาอิด", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_navy", "auburn"),
        lines: ["ยินดีต้อนรับสู่บาฮามัส เมืองคาราวานกลางผืนทราย", "เดินตามถนนตลาดบาซาร์ลงไป จะเจอลานเสาโอเบลิสก์กลางเมือง"] },
      // the east gate
      { id: "bh_guard_e1", ...spot(716, 420), face: 90, name: "ทหารยามคาริม", title: "ทหารยามประตูตะวันออก", role: "talk", look: guard("top_warrior"),
        lines: ["ออกประตูตะวันออกไปคือทะเลทรายใหญ่ ซากวิหารโบราณจมทรายอยู่กลางเนินทราย", "ได้ยินว่าคราเดียทางตะวันออกมีจอมเวทคอยเฝ้าชายแดนอสูรอยู่"] },
      { id: "bh_guard_e2", ...spot(716, 440), face: 90, name: "ทหารยามนาบิล", title: "ทหารยามประตูตะวันออก", role: "talk", look: guard("top_warrior", "amber"),
        lines: ["กลางวันแดดแผดเผา กลางคืนหนาวจับใจ ทะเลทรายก็เป็นอย่างนี้แหละ", "ถ้าหลงในเมือง มองหาโดมสีฟ้าของวังไว้ แล้วเดินตามถนนใหญ่"] },
      // the south gate
      { id: "bh_guard_s1", ...spot(460, 704), face: 0, name: "ทหารยามยูซุฟ", title: "ทหารยามประตูใต้", role: "talk", look: guard("top_warrior_forest"),
        lines: ["ออกประตูใต้ไปคือป่าดิบแดนใต้ ฝ่าป่าลงไปจะถึงเมืองท่าโยเดีย", "บาฮามัสคือทางแยก ใครจะลงไปเมืองท่าแดนใต้ก็ต้องผ่านที่นี่"] },
      { id: "bh_guard_s2", ...spot(480, 704), face: 0, name: "ทหารยามทาริก", title: "ทหารยามประตูใต้", role: "talk", look: guard("top_warrior_forest", "ink"),
        lines: ["กองคาราวานพักอยู่ลานข้างประตูนี้ อูฐกินน้ำที่รางหิน", "ถ้าเห็นฟ้าเป็นสีส้มทางใต้ รีบเข้าเมืองเลย พายุทรายกำลังมา"] },
      // the palace steps
      { id: "bh_palace_1", ...spot(246, 398), face: -90, name: "องครักษ์ฟาริด", title: "องครักษ์วังโดมฟ้า", role: "talk", look: guard("top_warrior_navy", "ink"),
        lines: ["วังโดมฟ้าคือที่ประทับของเจ้าเมืองบาฮามัส", "ยังไม่อนุญาตให้คนนอกเข้าไปข้างใน ขออภัยด้วย"] },
      { id: "bh_palace_2", ...spot(246, 414), face: -90, name: "องครักษ์ราชิด", title: "องครักษ์วังโดมฟ้า", role: "talk", look: guard("top_warrior_navy", "auburn"),
        lines: ["โดมสีฟ้าครามนั่นปูด้วยกระเบื้องเคลือบนับหมื่นแผ่น", "ท่านเจ้าเมืองรักสวนส้มในลานวังที่สุด ใครเด็ดผลไปโดนดุแน่"] },
      // the square: the way in, the guide, the healer
      travelGuide("bahamas", at(447, 352), toward(447, 352, 420, 352)),
      { id: "bh_guide", ...spot(420, 377), face: toward(420, 377, 420, 352), name: "ไลลา", title: "ผู้นำทาง", role: "talk",
        look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "amber", top: "top_adventurer_ochre", bottom: "bottom_adventurer_sand" },
        lines: ["ที่นี่คือลานเสาโอเบลิสก์ ใจกลางเมืองบาฮามัส", "ตลาดบาซาร์ยาวขึ้นไปทางเหนือจนถึงประตูเหนือ โอเอซิสอยู่หลังตลาดฝั่งตะวันตก", "วังโดมฟ้าอยู่สุดลานหน้าวังทางตะวันตก ย่านบ้านโดมฟ้าอยู่ตะวันออกเฉียงเหนือ", "ลานกองคาราวานอยู่ข้างประตูใต้ ส่วนย่านบ้านดินกับลานบ่อน้ำอยู่ตะวันตกเฉียงใต้"] },
      { id: "bh_healer", ...spot(392, 348), face: toward(392, 348, 420, 352), name: "ซิสเตอร์นูรา", title: "นักบวช · รักษาฟรี", role: "heal",
        look: { gender: "female", hair: "twintail", hairColor: "silver", eyes: "teal", top: "top_priestess_white", bottom: "bottom_priestess_white" },
        lines: ["ดื่มน้ำเยอะๆ นะ แดดที่นี่แรงนัก", "ขอพรแห่งโอเอซิสจงคุ้มครองท่าน หายเหนื่อยแล้ว ไปต่อได้"] },
      // the bazaar
      { id: "bh_shop", ...spot(412, 268), face: -90, name: "ยาซมิน", title: "ร้านเครื่องมือ", role: "shop", sprite: "merchant",
        lines: ["ยา ผ้าคลุมกันแดด คัมภีร์ มีครบ เข้ามาเลือกดูก่อนได้"] },
      { id: "bh_spice", ...spot(428, 190), face: 90, name: "ซาฮีรา", title: "แม่ค้าเครื่องเทศ", role: "talk",
        look: { gender: "female", hair: "twintail", hairColor: "crimson", eyes: "amber", top: "top_adventurer_plum", bottom: "bottom_adventurer_cocoa" },
        lines: ["หญ้าฝรั่น ยี่หร่า พริกแดง มาจากทุกเส้นทางคาราวาน", "อินทผลัมสดจากโอเอซิส หวานที่สุดในทะเลทราย ลองชิมสิ"] },
      { id: "bh_rugs", ...spot(412, 160), face: -90, name: "ฮัสซัน", title: "พ่อค้าพรม", role: "talk", look: guard("top_warrior_forest", "ink"),
        lines: ["พรมผืนนี้ทอมือ ใช้เวลาทอเกือบปี ลายไม่ซ้ำใครแน่นอน", "ต่อราคาได้นะ แต่อย่าต่อมากนัก พ่อค้าบาฮามัสก็ต้องกินต้องใช้"] },
      // the oasis
      { id: "bh_water", ...spot(298, 226), face: toward(298, 226, ...POOL), name: "อามีนา", title: "สาวตักน้ำ", role: "talk",
        look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "teal", top: "top_adventurer_teal", bottom: "bottom_adventurer_sand" },
        lines: ["โอเอซิสนี้ไม่เคยแห้งเลย ต่อให้หน้าร้อนที่สุดก็ตาม", "ต้นปาล์มรอบสระให้ทั้งร่มเงาและอินทผลัมกับคนทั้งเมือง"] },
      { id: "job_wizard", ...spot(334, 198), face: toward(334, 198, ...POOL), name: "จอมเวทซาฮาร่า", title: "จอมเวทแห่งทะเลทราย · เปลี่ยนอาชีพจอมเวท", role: "talk",
        look: { gender: "female", hair: "twintail", hairColor: "ink", eyes: "amber", top: "top_priestess_black", bottom: "bottom_priestess_black" },
        lines: ["ผืนทรายนี้เก็บเวทโบราณไว้มาก นักเวทหรือนักบวชเลเวล 30 มาเรียนกับข้าได้", "เวทธาตุหลากสี หรือเวทมืดและคำสาป ทั้งสองทางล้วนทรงพลัง"] },
      { id: "bh_story", ...spot(318, 198), face: toward(318, 198, ...POOL), name: "ท่านนาดีม", title: "นักเล่านิทาน", role: "talk", look: guard("top_warrior", "silver"),
        lines: ["เมื่อก่อนที่นี่เป็นแค่บ่อน้ำกลางทราย กองคาราวานแวะพักกันจนกลายเป็นเมือง", "เสาโอเบลิสก์กลางเมืองจารึกชื่อเส้นทางคาราวานไว้ทุกสาย", "ทางเหนือคืออีเดนเมืองหลวง ทางใต้คือป่าแดนใต้กับโยเดียเมืองท่า"] },
      // the caravan camp
      { id: "bh_caravan", ...spot(600, 580), face: toward(600, 580, 470, 600), name: "ซาลิม", title: "หัวหน้ากองคาราวาน", role: "talk", look: guard("top_warrior", "ink"),
        lines: ["กองคาราวานของข้าเดินทางจากอีเดนลงไปถึงโยเดีย", "ข้ามทะเลทรายต้องเดินตอนกลางคืน ดูดาวนำทางเอา", "เส้นทางใต้ยังปิดอยู่ พวกข้าเลยต้องพักที่นี่ไปก่อน"] },
      { id: "job_mercenary", ...spot(628, 600), face: toward(628, 600, 470, 600), name: "กัปตันคาลิด", title: "หัวหน้าทหารรับจ้าง · เปลี่ยนอาชีพทหารรับจ้าง", role: "talk", look: guard("top_warrior_navy", "ink"),
        lines: ["คาราวานจ้างพวกข้าคุ้มกันข้ามทะเลทรายทุกเที่ยว", "ทหารรับจ้างรับทุกคนที่สู้เป็น เลเวล 30 แล้วมาหาข้า หอก อาวุธสองมือ หรือธนู เลือกเอา"] },
      { id: "bh_camel", ...spot(532, 629), face: 90, name: "ดาเลีย", title: "เด็กเลี้ยงอูฐ", role: "talk",
        look: { gender: "female", hair: "twintail", hairColor: "amber", eyes: "blue", top: "top_adventurer_ochre", bottom: "bottom_adventurer_cocoa" },
        lines: ["อูฐกินน้ำทีละมากๆ แต่อดน้ำได้ตั้งหลายวัน", "พออูฐพักเต็มที่ กองคาราวานก็จะออกเดินทางกันอีก"] },
      // the adobe quarter
      { id: "bh_potter", ...spot(205, 700), face: toward(205, 700, 186, 690), name: "อุมัร", title: "ช่างปั้นหม้อ", role: "talk", look: guard("top_warrior_forest", "auburn"),
        lines: ["โอ่งดินเผาเก็บน้ำให้เย็นได้ทั้งวัน", "ดินเหนียวที่ดีที่สุดต้องขุดจากริมโอเอซิส"] },
      { id: "bh_girl", ...spot(286, 590), face: toward(286, 590, ...WELL_SQ), name: "ซาร่า", title: "ชาวเมือง", role: "talk",
        look: { gender: "female", hair: "twintail", hairColor: "gold", eyes: "violet", top: "top_rose", bottom: "bottom_cocoa" },
        lines: ["บ้านดินเย็นสบายกว่าที่คิดนะ ผนังหนากันแดดได้ดี", "ตอนเย็นทุกคนขึ้นไปนั่งบนดาดฟ้า ชมพระอาทิตย์ตกหลังเนินทราย"] },
    ];
  }
}

// คราเดีย (Kradia): the fortress city of magic on the eastern border. Heavy blue-grey stone
// walls and round towers under slate cones, an iron-bound gate, and the arcane woven through
// it all: glowing crystals, rune circles, a tall mage tower, purple-and-gold banners, braziers
// and the engines that hold the border against the monsters from the east.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, front towards -X.
// The fortress pieces (wall, wall tower, gate) show their TOWN side to -X; their outer side
// (merlons with slits, the portcullis, machicolations, ward glyphs) faces +X, towards the enemy.
// Walls are 700 cm long and tile along Y, 340 cm thick with the walkway at z = 616; a round
// tower (radius 330) can swallow a wall end anywhere within 280 cm of its centre, and the gate
// (1520 along Y) takes a wall end against each side at y = +-760.

import {
  merge, translate, rotateX, rotateY, rotateZ, scale, array, gridArray, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, cylinderCenter, sphereCenter, torus, gableWall, rock,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import type { Kit, Put } from "./types";

defineMaterial("Kradia_StoneDeep", { map: "stone", tint: "#555e70", bump: 2 });
defineMaterial("Kradia_Rune", { tint: "#d4bcff", rough: 0.4, glow: "#9259ff", glowI: 1.9 });
defineMaterial("Kradia_RuneBlue", { tint: "#bff2ff", rough: 0.4, glow: "#3fbfff", glowI: 1.7 });
defineMaterial("Kradia_Void", { tint: "#15141b", rough: 1 });
defineMaterial("Kradia_Window", { tint: "#8b7ad8", rough: 0.3, glow: "#5b3fd0", glowI: 0.8 });

const DEG = 180 / Math.PI;

// ---- helpers ----

// Flat shading (each triangle its own normal): crisp octagons and crystal facets.
function facet(g: Geo): Geo {
  return g.map((p) => {
    const geo = p.geo.clone();
    geo.computeVertexNormals();
    return { geo, mat: p.mat };
  });
}

// Plain planar texture coordinates (metres in x, y) on the flat tops and bottoms of round
// pieces, whose caps otherwise smear the stone texture.
function flatCaps(g: Geo): Geo {
  return g.map((p) => {
    const geo = p.geo.clone();
    const pos = geo.getAttribute("position"), nor = geo.getAttribute("normal"), uv = geo.getAttribute("uv");
    if (uv && nor) for (let i = 0; i < pos.count; i++) if (Math.abs(nor.getZ(i)) > 0.95) uv.setXY(i, pos.getX(i) / 100, pos.getY(i) / 100);
    return { geo, mat: p.mat };
  });
}

// n copies of g turned about Z.
const around = (g: Geo, n: number, start = 0): Geo => merge(...Array.from({ length: n }, (_, i) => rotateZ(g, start + (360 / n) * i)));

// An octagonal prism (or frustum) with a flat face towards each axis; its apothem is apo(r).
const oct = (r: number, h: number, z: number, mat: string, rTop = r): Geo =>
  flatCaps(facet(rotateZ(cylinderAt({ rBot: r, rTop, height: h, segments: 8, bottom: [0, 0, z] }, mat), 22.5)));
const apo = (r: number) => r * Math.cos(Math.PI / 8);

// A round drum (or cone) with a flat face towards -X; its apothem is r * cos(180 / seg).
const drum = (r: number, h: number, z: number, mat: string, seg = 16, rTop = r): Geo =>
  flatCaps(rotateZ(cylinderAt({ rBot: r, rTop, height: h, segments: seg, bottom: [0, 0, z] }, mat), 180 / seg));
const apo16 = (r: number) => r * Math.cos(Math.PI / 16);

// A disc in the plane x = c[0] (axis along X): round windows, roundels, shields.
const disk = (r: number, t: number, c: V3, mat: string, seg = 16): Geo =>
  translate(rotateY(flatCaps(cylinderCenter(r, t, seg, [0, 0, 0], mat)), 90), c);

// A six-sided crystal standing on `bottom`: a short point, the prism, a long point.
function crystal(r: number, h: number, bottom: V3, mat = "CrystalViolet", seg = 6): Geo {
  const [x, y, z] = bottom, lo = h * 0.26, mid = h * 0.38;
  return facet(merge(
    cylinderAt({ rBot: 0.5, rTop: r, height: lo, segments: seg, bottom: [x, y, z] }, mat),
    cylinderAt({ radius: r, height: mid, segments: seg, bottom: [x, y, z + lo] }, mat),
    cylinderAt({ rBot: r, rTop: 0.5, height: h - lo - mid, segments: seg, bottom: [x, y, z + lo + mid] }, mat),
  ));
}
// A crystal tilted about its foot (tilt away from the axis, then turned about Z), set at `at`.
const shard = (r: number, h: number, at: V3, tilt: number, turn: number, mat = "CrystalBlue"): Geo =>
  translate(rotateZ(rotateY(crystal(r, h, [0, 0, 0], mat), tilt), turn), at);

// A gable roof, ridge along X, like geo's gableRoof, but with the shingle courses the right
// way up on both slopes (one slab built, the other turned half round) and a ridge cap.
function roof(size: V3, bottom: V3, roofH: number, overhang: number, mat = "RoofSlate", ridge = "Kradia_StoneDeep"): Geo {
  const [sx, sy, th] = size, a = Math.atan2(roofH, sy / 2);
  const slope = (sy / 2 + overhang) / Math.cos(a), len = sx + overhang * 2;
  const slab = rotateX(box([len, slope, th], [0, -slope / 2, th / 2], mat), a * DEG);
  const cap = translate(rotateX(box([len + 6, 20, 20], [0, 0, 0], ridge, 2), 45), [0, 0, th * 1.1]);
  return translate(merge(slab, rotateZ(slab, 180), cap), [bottom[0], bottom[1], bottom[2] + roofH]);
}

// A half-round arch of wedge stones in the plane x = c[0], springing from the line through c.
function archRing(rIn: number, rOut: number, depth: number, c: V3, mat: string, n = 7): Geo {
  const rm = (rIn + rOut) / 2, chord = 2 * rOut * Math.sin(Math.PI / (2 * n)) + 1;
  const stones: Geo[] = [];
  for (let i = 0; i < n; i++) stones.push(rotateX(box([depth, rOut - rIn, chord], [0, rm, 0], mat, 1.5), ((i + 0.5) / n) * 180));
  return translate(merge(...stones), c);
}

// ---- wall furniture, all on a face at x = fx that looks towards -X (turn them for the rest) ----

// A tall round-headed window: stone surround, sill, keystone, glass and glazing bars.
function archWindow(fx: number, y: number, z: number, w: number, h: number, glass = "GlassBlue", frame = "StoneGrey", bars = "IronDark"): Geo {
  const r = w / 2, rect = h - r;
  return merge(
    boxAt([10, w + 24, rect], [fx - 1, y, z], frame, 1.5),
    disk(r + 12, 8, [fx - 1, y, z + rect], frame, 14),
    boxAt([4, w, rect], [fx - 7, y, z], glass),
    disk(r, 3, [fx - 7, y, z + rect], glass, 14),
    boxAt([3, 4, h - 4], [fx - 9.5, y, z], bars),
    boxAt([3, w, 4], [fx - 9.5, y, z + rect * 0.6], bars),
    boxAt([16, w + 34, 10], [fx - 4, y, z - 10], frame, 2),
    boxAt([14, 18, 24], [fx - 5, y, z + h + 2], frame, 1.5),
  );
}

// A round window: stone ring, glass and a cross of bars.
function roundWindow(fx: number, y: number, z: number, r: number, glass = "Kradia_Window", frame = "StoneGrey"): Geo {
  const bar = box([3, 4, r * 2], [0, 0, 0], "IronDark");
  return merge(
    disk(r + 12, 8, [fx - 1, y, z], frame, 16),
    disk(r, 3, [fx - 6.5, y, z], glass, 16),
    translate(merge(bar, rotateX(bar, 90)), [fx - 9, y, z]),
  );
}

// A rose window: a dark stone ring, violet glass, stone tracery and gold rings.
function roseWindow(fx: number, y: number, z: number, r: number): Geo {
  const spoke = box([3, 6, r * 2 - 4], [0, 0, 0], "StoneGrey");
  return merge(
    disk(r + 20, 10, [fx - 1, y, z], "StoneBlueDark", 20),
    disk(r, 3, [fx - 7.5, y, z], "Kradia_Window", 20),
    translate(merge(...[0, 45, 90, 135].map((a) => rotateX(spoke, a))), [fx - 10, y, z]),
    translate(rotateY(torus(r * 0.55, 3, 20, 4, "GoldTrim"), 90), [fx - 10, y, z]),
    translate(rotateY(torus(r, 4, 24, 4, "GoldTrim"), 90), [fx - 8, y, z]),
    disk(r * 0.2, 6, [fx - 11, y, z], "GoldTrim", 12),
  );
}

// A small window with open plank shutters, sill and lintel.
function shutteredWindow(fx: number, y: number, z: number, w: number, h: number, glass = "GlassBlue"): Geo {
  const sh = boxAt([4, w / 2, h], [0, 0, z], "WoodDark", 1);
  const off = w / 2 + 11 + w / 4;
  return merge(
    boxAt([10, w + 18, h + 14], [fx - 1, y, z - 7], "StoneBlueDark", 1.5),
    boxAt([4, w, h], [fx - 7, y, z], glass),
    boxAt([3, 4, h], [fx - 9.5, y, z], "WoodDark"),
    boxAt([3, w, 4], [fx - 9.5, y, z + h / 2 - 2], "WoodDark"),
    boxAt([16, w + 30, 10], [fx - 4, y, z - 16], "StoneGrey", 2),
    boxAt([14, w + 30, 16], [fx - 3, y, z + h + 7], "StoneGrey", 2),
    translate(sh, [fx - 4, y - off, 0]),
    translate(sh, [fx - 4, y + off, 0]),
  );
}

// A small dark window with iron bars (guard rooms, cellars).
function barredWindow(fx: number, y: number, z: number, w: number, h: number): Geo {
  const bars: Geo[] = [];
  for (let i = 1; i < 4; i++) bars.push(boxAt([3, 4, h], [fx - 8, y - w / 2 + (w * i) / 4, z], "IronDark"));
  return merge(
    boxAt([10, w + 22, h + 22], [fx - 1, y, z - 11], "StoneGrey", 2),
    boxAt([4, w, h], [fx - 6.5, y, z], "Kradia_Void"),
    ...bars,
  );
}

// An arrow slit (a cross loop) in a stone surround.
function slit(fx: number, y: number, z: number, h = 90): Geo {
  return merge(
    boxAt([8, 34, h + 24], [fx, y, z - 12], "StoneGrey", 1.5),
    boxAt([4, 10, h], [fx - 3, y, z], "Kradia_Void"),
    boxAt([4, 30, 9], [fx - 3, y, z + h * 0.58], "Kradia_Void"),
  );
}

// A dark doorway in a stone frame (onto a wall walk).
function doorway(fx: number, y: number, z: number, w: number, h: number): Geo {
  return merge(
    boxAt([10, w + 28, h + 14], [fx - 1, y, z], "StoneGrey", 1.5),
    boxAt([4, w, h], [fx - 7, y, z], "Kradia_Void"),
  );
}

// An arched door: stone jambs and wedge stones proud of the wall, the leaves set back between
// them, iron straps, ring pulls and (when raised) a stone step beneath.
function door(fx: number, y: number, w: number, h: number, z = 0, wood = "DoorWood", stone = "StoneGrey", step = true): Geo {
  const r = w / 2, rect = h - r, jw = 22;
  const jamb = boxAt([24, jw, rect], [fx - 6, 0, z], stone, 2);
  const ring = translate(rotateY(torus(7, 1.6, 10, 4, "IronDark"), 90), [fx - 8, 0, z + rect * 0.5]);
  return merge(
    translate(jamb, [0, y - r - jw / 2, 0]), translate(jamb, [0, y + r + jw / 2, 0]),
    archRing(r, r + jw, 24, [fx - 6, y, z + rect], stone, 7),
    boxAt([6, w + 2, rect], [fx - 3, y, z], wood),
    disk(r + 1, 6, [fx - 3, y, z + rect], wood, 14),
    boxAt([3, w - 8, 10], [fx - 7, y, z + rect * 0.2], "IronDark"),
    boxAt([3, w - 8, 10], [fx - 7, y, z + rect * 0.72], "IronDark"),
    boxAt([3, 5, h - 4], [fx - 7, y, z], "IronDark"),
    translate(ring, [0, y - 16, 0]), translate(ring, [0, y + 16, 0]),
    step && z > 0 ? boxAt([40, w + 2 * jw + 20, z], [fx - 20, y, 0], stone, 2) : [],
  );
}

// A crystal lamp on an iron arm.
function sconce(fx: number, y: number, z: number, s = 1): Geo {
  return merge(
    boxAt([6, 20 * s, 34 * s], [fx - 3, y, z - 20 * s], "IronDark", 1),
    beamBetween([fx - 4, y, z - 8 * s], [fx - 40 * s, y, z], 5 * s, 5 * s, "IronDark"),
    cylinderAt({ rBot: 7 * s, rTop: 13 * s, height: 7 * s, segments: 8, bottom: [fx - 42 * s, y, z - 2 * s] }, "IronDark"),
    crystal(8 * s, 36 * s, [fx - 42 * s, y, z + 7 * s], "CrystalBlue"),
  );
}

// A ward glyph: a stone roundel with a glowing ring, a six-rayed star and a diamond.
function glyph(fx: number, y: number, z: number, r: number, mat = "Kradia_Rune"): Geo {
  const bar = box([3, 5, r * 1.25], [0, 0, 0], mat);
  return merge(
    disk(r, 8, [fx - 2, y, z], "StoneGrey", 16),
    translate(rotateY(torus(r * 0.8, 2.6, 24, 4, mat), 90), [fx - 6, y, z]),
    translate(merge(bar, rotateX(bar, 60), rotateX(bar, 120)), [fx - 6.5, y, z]),
    translate(rotateX(box([4, r * 0.32, r * 0.32], [0, 0, 0], mat), 45), [fx - 7, y, z]),
  );
}

// A hanging banner on a gold rod, the cloth in the plane x = top[0] (seen from both sides):
// purple with gold edges, a pointed foot and Kradia's crystal sigil.
function banner(w: number, h: number, top: V3, cloth = "FabricPurple"): Geo {
  const [x, y, z] = top, body = h - w / 2, e = body * 0.42;
  const diamond = (s: number, t: number, mat: string, dx = 0) => translate(rotateX(box([t, s, s], [0, 0, 0], mat), 45), [x + dx, y, 0]);
  return merge(
    boxAt([3, w, body], [x, y, z - body], cloth),
    translate(diamond(w / Math.SQRT2, 3, cloth, 0.4), [0, 0, z - body]),
    boxAt([4, 6, body], [x, y - w / 2 + 3, z - body], "GoldTrim"),
    boxAt([4, 6, body], [x, y + w / 2 - 3, z - body], "GoldTrim"),
    boxAt([4, w, 7], [x, y, z - 26], "GoldTrim"),
    translate(diamond(w * 0.34, 5, "GoldTrim"), [0, 0, z - e]),
    translate(diamond(w * 0.18, 7, "Kradia_Rune"), [0, 0, z - e]),
    cylinderBetween([x, y - w / 2 - 12, z + 3], [x, y + w / 2 + 12, z + 3], 3.5, 6, "GoldTrim"),
    sphereCenter(5.5, [x, y - w / 2 - 13, z + 3], "GoldTrim", 6),
    sphereCenter(5.5, [x, y + w / 2 + 13, z + 3], "GoldTrim", 6),
  );
}
// iron hooks holding a banner's rod off a face at x = fx
const hooks = (fx: number, x: number, y: number, w: number, z: number): Geo =>
  merge(boxBounds([x - 3, y - w / 2 - 4, z - 4], [fx, y - w / 2 + 4, z + 4], "IronDark"), boxBounds([x - 3, y + w / 2 - 4, z - 4], [fx, y + w / 2 + 4, z + 4], "IronDark"));

// A kite shield (gold-bordered purple) over two crossed swords.
function crest(fx: number, y: number, z: number, s = 1): Geo {
  const kite = (grow: number, mat: string, dx: number) => merge(
    boxAt([4, (70 + grow) * s, (46 + grow) * s], [fx - dx, y, z], mat),
    translate(rotateX(box([4, (50 + grow) * s, (50 + grow) * s], [0, 0, 0], mat), 45), [fx - dx + 0.5, y, z]),
  );
  return merge(
    translate(rotateX(sword(96 * s), 38), [fx - 1, y, z - 40 * s]),
    translate(rotateX(sword(96 * s), -38), [fx - 1, y, z - 40 * s]),
    kite(12, "GoldTrim", 3),
    kite(0, "FabricPurple", 5),
    translate(rotateX(box([4, 22 * s, 22 * s], [0, 0, 0], "Kradia_Rune"), 45), [fx - 7, y, z + 12 * s]),
  );
}

// ---- small props ----

// A sword standing point down, the blade flat towards X.
function sword(len = 90): Geo {
  return merge(
    scale(cylinderAt({ rBot: 0.5, rTop: 4, height: 10, segments: 4, bottom: [0, 0, 0] }, "IronLight"), [0.3, 0.9, 1]),
    boxAt([2, 7, len], [0, 0, 10], "IronLight"),
    boxAt([5, 30, 5], [0, 0, 10 + len], "GoldTrim", 1),
    cylinderAt({ radius: 2.5, height: 18, segments: 6, bottom: [0, 0, 15 + len] }, "WoodDark"),
    sphereCenter(4, [0, 0, 35 + len], "GoldTrim", 6),
  );
}

function spear(len = 230): Geo {
  return merge(
    cylinderAt({ radius: 2.5, height: len, segments: 6, bottom: [0, 0, 0] }, "WoodPale"),
    facet(cylinderAt({ rBot: 5, rTop: 0.5, height: 30, segments: 4, bottom: [0, 0, len] }, "IronLight")),
    cylinderAt({ radius: 3.4, height: 6, segments: 6, bottom: [0, 0, len - 4] }, "GoldTrim"),
  );
}

// A round shield facing -X: painted face, iron rim and a gold boss.
function roundShield(r: number, c: V3, face = "FabricPurple"): Geo {
  return merge(
    disk(r, 5, c, face, 14),
    translate(rotateY(torus(r, 2.6, 16, 4, "IronDark"), 90), c),
    sphereCenter(r * 0.22, [c[0] - 3, c[1], c[2]], "GoldTrim", 8),
  );
}

function barrel(at: V3, r = 30, h = 80): Geo {
  const [x, y, z] = at, half = h / 2;
  const hoop = (t: number) => cylinderAt({ radius: r * (0.86 + 0.28 * Math.min(t, 1 - t)) + 1.2, height: 5, segments: 12, bottom: [x, y, z + h * t - 2.5] }, "IronDark");
  return merge(
    cylinderAt({ rBot: r * 0.86, rTop: r, height: half, segments: 12, bottom: [x, y, z] }, "WoodWarm"),
    cylinderAt({ rBot: r, rTop: r * 0.86, height: half, segments: 12, bottom: [x, y, z + half] }, "WoodWarm"),
    hoop(0.12), hoop(0.38), hoop(0.62), hoop(0.88),
    translate(drum(r * 0.84, 3, h, "WoodDark", 12), [x, y, z]),
  );
}

function crateAt(at: V3, s = 1, turn = 0): Geo {
  const core = boxAt([56, 56, 56], [0, 0, 2], "WoodWarm", 1);
  const posts = gridArray(boxAt([8, 8, 60], [-26, -26, 0], "WoodShade", 1), [2, 2, 1], [52, 52, 0]);
  const railsX = gridArray(boxAt([44, 8, 8], [0, -26, 0], "WoodShade"), [1, 2, 2], [0, 52, 52]);
  const railsY = gridArray(boxAt([8, 44, 8], [-26, 0, 0], "WoodShade"), [2, 1, 2], [52, 0, 52]);
  return translate(rotateZ(scale(merge(core, posts, railsX, railsY), [s, s, s]), turn), at);
}

function sack(at: V3, turn = 0): Geo {
  const [x, y, z] = at;
  return translate(rotateZ(merge(
    scale(sphereCenter(30, [0, 0, 0], "FabricSand", 8), [1, 0.78, 0.72], [0, 0, 0]),
    cylinderAt({ rBot: 7, rTop: 10, height: 14, segments: 8, bottom: [0, 0, 18] }, "FabricSand"),
    cylinderAt({ radius: 8, height: 4, segments: 8, bottom: [0, 0, 22] }, "RopeTan"),
  ), turn), [x, y, z + 21]);
}

// ---- the fortress ----

// Fortress wall, 700 cm along Y: footing, string course, walkway on corbels, merlons with
// slits and a ward glyph outside (+X); pilasters, a banner and a crystal sconce inside (-X).
function fortressWall(): Geo {
  const h = 350;
  const merl = merge(
    boxBounds([112, -30, 726], [180, 30, 816], "StoneBlueDark", 1.5),
    boxBounds([108, -34, 816], [184, 34, 828], "StoneGrey", 1.5),
  );
  const merlSlit = merge(merl, rotateZ(slit(-180, 0, 748, 50), 180));
  const merlons = merge(...[-300, -200, -100, 0, 100, 200, 300].map((y, i) => translate(i % 2 ? merlSlit : merl, [0, y, 0])));
  const corbels = array(boxBounds([164, -h + 13, 556], [188, -h + 37, 600], "StoneGrey", 1.5), 14, [0, 50, 0]);
  const pil = (y0: number, y1: number) => merge(
    boxBounds([-188, y0, 70], [-170, y1, 540], "StoneGrey"),
    boxBounds([-196, y0, 540], [-170, y1, 600], "StoneGrey"),
  );
  return merge(
    boxBounds([-186, -h, 0], [186, h, 70], "Kradia_StoneDeep"),
    boxBounds([-170, -h, 70], [170, h, 600], "StoneBlueDark"),
    boxBounds([-178, -h, 290], [178, h, 306], "StoneGrey"),
    boxBounds([-178, -h, 600], [188, h, 616], "StoneGrey"),
    boxBounds([110, -h, 616], [186, h, 716], "StoneBlueDark"),
    boxBounds([106, -h, 716], [190, h, 726], "StoneGrey"),
    boxBounds([-182, -h, 616], [-150, h, 676], "StoneBlueDark"),
    boxBounds([-186, -h, 676], [-146, h, 686], "StoneGrey"),
    merlons, corbels,
    pil(-h, -h + 30), pil(-30, 30), pil(h - 30, h),
    banner(110, 250, [-190, 175, 594]), hooks(-178, -190, 175, 110, 597),
    sconce(-170, -175, 430),
    rotateZ(merge(slit(-170, -175, 360), slit(-170, 175, 360), glyph(-170, 0, 430, 62)), 180),
  );
}

// Round wall tower: battered plinth, string courses level with the wall's, a corbelled
// gallery, a windowed drum and a flared slate cone with a floating crystal. Door and banner
// to the town (-X), arrow slits all round, doorways onto the wall walks at +-Y.
function wallTower(): Geo {
  const R = 330, fx = -apo16(R);
  const out: Geo[] = [
    drum(386, 110, 0, "Kradia_StoneDeep", 16, R + 8),
    drum(R, 790, 110, "StoneBlueDark"),
    drum(R + 9, 16, 290, "StoneGrey"), drum(R + 9, 16, 600, "StoneGrey"),
    around(boxBounds([R - 14, -13, 840], [R + 30, 13, 900], "StoneGrey", 1.5), 16),
    drum(R + 44, 22, 900, "StoneGrey"),
    drum(R + 28, 178, 922, "StoneBlueDark"),
    drum(R + 38, 10, 1100, "GoldTrim"),
    drum(R + 96, 46, 1110, "RoofSlate", 16, R + 46),
    drum(R + 46, 500, 1156, "RoofSlate", 16, 6),
    sphereCenter(15, [0, 0, 1660], "GoldTrim", 10),
    cylinderAt({ rBot: 5, rTop: 1, height: 70, segments: 6, bottom: [0, 0, 1670] }, "GoldTrim"),
    crystal(15, 64, [0, 0, 1750], "CrystalViolet"),
    door(fx + 2, 0, 130, 240, 110, "DoorWood", "StoneGrey", false),
    boxBounds([-452, -112, 0], [-340, 112, 37], "StoneGrey", 2),
    boxBounds([-416, -106, 37], [-340, 106, 74], "StoneGrey", 2),
    boxBounds([-380, -100, 74], [-326, 100, 110], "StoneGrey", 2),
    banner(110, 230, [fx - 7, 0, 860]), hooks(fx, fx - 7, 0, 110, 863),
    rotateZ(sconce(fx, 0, 300), 22.5), rotateZ(sconce(fx, 0, 300), -22.5),
    rotateZ(doorway(fx + 2, -20, 616, 90, 190), -90), rotateZ(doorway(fx + 2, 20, 616, 90, 190), 90),
  ];
  for (const a of [135, 225, 45, 315]) out.push(rotateZ(slit(fx + 3, 0, 360), a - 180));
  for (const a of [157.5, 202.5, 22.5, 337.5, 0]) out.push(rotateZ(slit(fx + 3, 0, 640), a - 180));
  for (const a of [0, 90, 180, 270]) out.push(rotateZ(archWindow(-apo16(R + 28) + 2, 0, 950, 56, 124, "Kradia_Window"), a));
  // little lucarnes on the cone
  const lucarne = merge(
    boxBounds([-362, -34, 1176], [-280, 34, 1286], "StoneBlueDark", 2),
    boxAt([4, 34, 64], [-364, 0, 1196], "Kradia_Window"),
    boxAt([6, 46, 8], [-365, 0, 1188], "StoneGrey", 1),
    translate(facet(rotateZ(cylinderAt({ rBot: 58, rTop: 2, height: 64, segments: 4, bottom: [0, 0, 0] }, "RoofSlate"), 45)), [-321, 0, 1286]),
  );
  for (const a of [45, 135, 225, 315]) out.push(rotateZ(lucarne, a));
  return merge(...out);
}

// Fortress gate, 1520 along Y: a gatehouse over a round-arched passage (along X) between
// two square towers with slate pyramids. Town side (-X): iron-bound doors standing open,
// crystal lamps, the Kradia sigil, banners; outer side (+X): the half-raised portcullis,
// machicolations, arrow slits and a ward glyph. Walls join at y = +-760.
function fortressGate(): Geo {
  const P = 170, SPRING = 400, D = 250, TOP = 920;
  const out: Geo[] = [
    boxBounds([-D, -320, 0], [D, -P, TOP], "StoneBlueDark"),
    boxBounds([-D, P, 0], [D, 320, TOP], "StoneBlueDark"),
    boxBounds([-D, -P, SPRING + P], [D, P, TOP], "StoneBlueDark"),
    boxBounds([-D - 70, -P, 0], [D + 70, P, 5], "Cobble"),
  ];
  // the vault: slices stepping down to the springing line
  const N = 14;
  for (let i = 0; i < N; i++) {
    const y0 = -P + (2 * P * i) / N, y1 = y0 + (2 * P) / N;
    const ym = Math.min(Math.abs(y0), Math.abs(y1)) * (y0 < 0 && y1 > 0 ? 0 : 1);
    out.push(boxBounds([-D + 1, y0, SPRING + Math.sqrt(P * P - ym * ym)], [D - 1, y1, SPRING + P + 1], "Kradia_StoneDeep"));
  }
  // both faces: wedge stones, imposts, keystone, crystal lamps on the piers, string courses
  const face = merge(
    archRing(P, P + 46, 30, [-D - 4, 0, SPRING], "StoneGrey", 9),
    boxBounds([-D - 22, -P - 50, SPRING - 22], [-D + 2, -P + 4, SPRING], "StoneGrey", 2),
    boxBounds([-D - 22, P - 4, SPRING - 22], [-D + 2, P + 50, SPRING], "StoneGrey", 2),
    boxBounds([-D - 26, -28, SPRING + P + 6], [-D + 2, 28, SPRING + P + 70], "StoneGrey", 2),
    translate(rotateX(box([4, 26, 26], [0, 0, 0], "Kradia_Rune"), 45), [-D - 27, 0, SPRING + P + 38]),
    sconce(-D, -245, 420, 1.5), sconce(-D, 245, 420, 1.5),
    boxBounds([-D - 8, -320, 290], [-D, -P - 50, 306], "StoneGrey"),
    boxBounds([-D - 8, P + 50, 290], [-D, 320, 306], "StoneGrey"),
  );
  out.push(face, rotateZ(face, 180));
  // town side: the sigil over the arch; outer side: a ward glyph
  out.push(glyph(-D, 0, 770, 92), translate(rotateY(torus(98, 6, 28, 6, "GoldTrim"), 90), [-D - 8, 0, 770]));
  out.push(rotateZ(glyph(-D, 0, 770, 80), 180));
  // the open doors against the passage walls (town side), the portcullis (outer side)
  for (const s of [-1, 1]) {
    const y0 = s > 0 ? P - 14 : -P + 2, y1 = y0 + 12, yf = s > 0 ? y0 - 1.5 : y1 + 1.5;
    out.push(boxBounds([-220, y0, 6], [-56, y1, 396], "DoorWood"));
    for (const z of [60, 180, 300]) out.push(boxBounds([-218, yf - 1.5, z], [-58, yf + 1.5, z + 12], "IronDark"));
    out.push(boxBounds([-226, y0 - 2, 20], [-214, y1 + 2, 380], "IronDark"));
    out.push(boxBounds([140, s * P - 6, 0], [160, s * P + 6, SPRING + 80], "Kradia_Void"));
  }
  for (let y = -150; y <= 150; y += 30) {
    out.push(boxBounds([146, y - 3, 270], [154, y + 3, 620], "IronDark"));
    out.push(cylinderAt({ rBot: 0.8, rTop: 4.5, height: 22, segments: 4, bottom: [150, y, 248] }, "IronDark"));
  }
  for (const z of [290, 370, 450, 530]) out.push(boxBounds([143, -P + 2, z], [157, P - 2, z + 9], "IronDark"));
  // gatehouse top: walk, battlements both sides, machicolations outside
  const merl = merge(boxBounds([-D - 12, -26, 1030], [-D + 34, 26, 1110], "StoneBlueDark", 1.5), boxBounds([-D - 16, -30, 1110], [-D + 38, 30, 1122], "StoneGrey", 1.5));
  out.push(
    boxBounds([-D - 12, -320, TOP], [D + 12, 320, TOP + 16], "StoneGrey"),
    boxBounds([-D - 12, -320, TOP + 16], [-D + 34, 320, 1020], "StoneBlueDark"),
    boxBounds([-D - 16, -320, 1020], [-D + 38, 320, 1030], "StoneGrey"),
    array(translate(merl, [0, -250, 0]), 6, [0, 100, 0]),
    boxBounds([D - 34, -320, TOP + 16], [D + 44, 320, 1020], "StoneBlueDark"),
    boxBounds([D - 38, -320, 1020], [D + 48, 320, 1030], "StoneGrey"),
    array(boxBounds([D - 4, -312, 852], [D + 44, -288, TOP + 16], "StoneGrey", 1.5), 13, [0, 50, 0]),
    array(merge(
      boxBounds([D - 2, -276, 1030], [D + 44, -224, 1110], "StoneBlueDark", 1.5),
      boxBounds([D - 6, -280, 1110], [D + 48, -220, 1122], "StoneGrey", 1.5),
      rotateZ(slit(-D - 44, 250, 1046, 50), 180),
    ), 6, [0, 100, 0]),
  );
  // the towers
  const tw = (yc: number, outer: 1 | -1): Geo => {
    const t: Geo[] = [
      boxBounds([-305, -235, 0], [305, 235, 90], "Kradia_StoneDeep", 4),
      boxBounds([-290, -220, 90], [290, 220, 1100], "StoneBlueDark", 6),
      ...[290, 600, TOP].map((z) => boxBounds([-298, -228, z], [298, 228, z + 16], "StoneGrey", 2)),
      boxBounds([-312, -242, 1100], [312, 242, 1180], "StoneBlueDark", 3),
      boxBounds([-318, -248, 1180], [318, 248, 1190], "StoneGrey", 2),
      facet(scale(rotateZ(cylinderAt({ rBot: 425, rTop: 8, height: 470, segments: 4, bottom: [0, 0, 1190] }, "RoofSlate"), 45), [1, 0.74, 1])),
      sphereCenter(13, [0, 0, 1662], "GoldTrim", 8),
      crystal(14, 60, [0, 0, 1684], "CrystalViolet"),
      door(-290, 0, 110, 230, 0, "DoorWood", "StoneGrey", true),
      banner(150, 380, [-300, 0, 1030]), hooks(-290, -300, 0, 150, 1033),
      archWindow(-290, -150, 680, 66, 150, "Kradia_Window"), archWindow(-290, 150, 680, 66, 150, "Kradia_Window"),
      sconce(-290, -110, 200), sconce(-290, 110, 200),
      rotateZ(merge(slit(-290, -120, 330), slit(-290, 120, 330), slit(-290, -120, 720), slit(-290, 120, 720)), 180),
    ];
    // merlons round the top and corbels under the parapet
    const mX = (y: number) => merge(boxBounds([-312, y - 24, 1190], [-280, y + 24, 1262], "StoneBlueDark", 1.5), boxBounds([-316, y - 28, 1262], [-276, y + 28, 1272], "StoneGrey", 1.5));
    const mY = (x: number) => merge(boxBounds([x - 24, -242, 1190], [x + 24, -210, 1262], "StoneBlueDark", 1.5), boxBounds([x - 28, -246, 1262], [x + 28, -206, 1272], "StoneGrey", 1.5));
    const cX = (y: number) => boxBounds([-310, y - 12, 1050], [-284, y + 12, 1100], "StoneGrey", 1.5);
    const cY = (x: number) => boxBounds([x - 12, -240, 1050], [x + 12, -214, 1100], "StoneGrey", 1.5);
    for (const y of [-144, -48, 48, 144]) t.push(mX(y), rotateZ(mX(y), 180));
    for (const y of [-180, -60, 60, 180]) t.push(cX(y), rotateZ(cX(y), 180));
    for (const x of [-200, -100, 0, 100, 200]) t.push(mY(x), rotateZ(mY(x), 180));
    for (const x of [-240, -120, 0, 120, 240]) t.push(cY(x), rotateZ(cY(x), 180));
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) t.push(
      boxBounds([Math.min(sx * 312, sx * 266), Math.min(sy * 242, sy * 196), 1190], [Math.max(sx * 312, sx * 266), Math.max(sy * 242, sy * 196), 1272], "StoneBlueDark", 1.5),
      boxBounds([Math.min(sx * 316, sx * 262), Math.min(sy * 246, sy * 192), 1272], [Math.max(sx * 316, sx * 262), Math.max(sy * 246, sy * 192), 1282], "StoneGrey", 1.5),
    );
    // the outer side face (where the wall walk comes in): a doorway and slits above the wall
    const side = merge(doorway(-220, -20 * outer, 616, 90, 190), slit(-220, -120 * outer, 920, 70), slit(-220, 120 * outer, 920, 70));
    t.push(rotateZ(side, outer > 0 ? -90 : 90));
    return translate(merge(...t), [0, yc, 0]);
  };
  out.push(tw(540, 1), tw(-540, -1));
  return merge(...out);
}

// ---- buildings ----

// The great mage tower (landmark): an octagonal hall on a stepped platform with a porch,
// buttresses topped with crystals, two balconies, a glowing rune band, a ring of runes
// floating around the middle stage, a slate spire and a great crystal held above gold claws.
function mageTower(): Geo {
  // radii of the stages (octagons, a flat face to each axis) and the levels between them
  const RP = 660, RH = 470, RB1 = 530, RM = 360, RB2 = 430, RU = 260;
  const Z1 = 560, Z2 = 1250, Z3 = 1660;
  const out: Geo[] = [
    oct(RP, 40, 0, "Kradia_StoneDeep"), oct(RP - 40, 40, 40, "StoneGrey"),
    boxBounds([-apo(RP) - 42, -250, 0], [-apo(RP) + 2, 250, 20], "StoneGrey", 2),
    boxBounds([-apo(RP - 40) - 40, -240, 40], [-apo(RP - 40) + 2, 240, 60], "StoneGrey", 2),
    // hall
    oct(RH + 16, 36, 80, "Kradia_StoneDeep"), oct(RH, Z1 - 116, 116, "StoneBlueDark"), oct(RH + 12, 14, 330, "StoneGrey"),
  ];
  const butt = merge(
    boxBounds([RH - 44, -30, 116], [RH + 70, 30, 380], "StoneGrey", 2),
    boxBounds([RH - 44, -34, 380], [RH + 78, 34, 392], "Kradia_StoneDeep", 2),
    boxBounds([RH - 44, -26, 392], [RH + 40, 26, Z1 - 30], "StoneGrey", 2),
    boxBounds([RH - 44, -30, Z1 - 30], [RH + 48, 30, Z1 - 18], "Kradia_StoneDeep", 2),
    crystal(11, 46, [RH + 12, 0, Z1 - 18], "CrystalBlue"),
  );
  out.push(around(butt, 8, 22.5));
  const fx = -apo(RH);
  for (let k = 1; k < 8; k++) out.push(rotateZ(merge(archWindow(fx + 2, 0, 362, 84, 160, "Kradia_Window"), glyph(fx, 0, 220, 46)), 45 * k));
  // door and porch
  out.push(
    door(fx + 2, 0, 170, 280, 80, "DoorWood", "StoneGrey", false),
    ...[-140, 140].flatMap((y) => [
      boxAt([46, 46, 16], [fx - 100, y, 80], "Kradia_StoneDeep", 2),
      cylinderAt({ radius: 16, height: 274, segments: 10, bottom: [fx - 100, y, 96] }, "StoneGrey"),
      boxAt([44, 44, 14], [fx - 100, y, 370], "GoldTrim", 2),
    ]),
    boxBounds([fx - 132, -176, 384], [fx + 4, 176, 428], "StoneGrey", 3),
    roof([140, 352, 10], [fx - 62, 0, 428], 90, 12, "StoneGrey", "GoldTrim"),
    gableWall(fx - 134, 176, 428, 88, "Kradia_StoneDeep"),
    glyph(fx - 134, 0, 460, 24),
  );
  // a railing round an octagonal balcony of radius r, at z
  const railing = (r: number, z: number): Geo => {
    const a = apo(r) - 14, edge = 2 * r * Math.sin(Math.PI / 8) - 10, n = Math.max(3, Math.round(edge / 48));
    const side: Geo[] = [];
    for (let i = 0; i <= n; i++) side.push(cylinderAt({ rBot: 5, rTop: 4, height: 50, segments: 6, bottom: [-a, -edge / 2 + (edge * i) / n, z] }, "StoneGrey"));
    side.push(boxBounds([-a - 7, -edge / 2 - 6, z + 50], [-a + 7, edge / 2 + 6, z + 60], "StoneGrey", 1.5));
    return merge(around(merge(...side), 8), around(boxAt([18, 18, 66], [a / Math.cos(Math.PI / 8), 0, z], "StoneGrey", 2), 8, 22.5));
  };
  const corbel = (r0: number, r1: number, z: number) => boxBounds([r0, -12, z - 44], [r1, 12, z], "StoneGrey", 1.5);
  // first balcony
  out.push(
    oct(RB1, 30, Z1, "StoneGrey"), railing(RB1, Z1 + 30),
    around(corbel(RH - 34, RH + 40, Z1 - 18), 8, 13), around(corbel(RH - 34, RH + 40, Z1 - 18), 8, -13),
  );
  // middle stage
  out.push(
    oct(RM, Z2 - Z1 - 30, Z1 + 30, "StoneBlueDark"),
    around(boxBounds([RM - 16, -15, Z1 + 30], [RM + 10, 15, Z2], "StoneGrey"), 8, 22.5),
    oct(RM + 4, 10, 1150, "Kradia_Rune"), oct(RM + 6, 8, 1210, "GoldTrim"),
  );
  for (const a of [0, 90, 180, 270]) out.push(rotateZ(archWindow(-apo(RM) + 2, 0, 690, 74, 230, "Kradia_Window"), a));
  for (const a of [45, 135, 225, 315]) out.push(rotateZ(roundWindow(-apo(RM) + 2, 0, 1010, 32), a));
  // second balcony
  out.push(oct(RB2, 30, Z2, "StoneGrey"), railing(RB2, Z2 + 30), around(corbel(RM - 30, RM + 52, Z2), 16, 11.25));
  // upper stage, cornice, spire
  out.push(
    oct(RU, Z3 - Z2 - 30, Z2 + 30, "StoneBlueDark"),
    around(boxBounds([RU - 14, -12, Z2 + 30], [RU + 8, 12, Z3], "StoneGrey"), 8, 22.5),
    oct(RU + 34, 24, Z3, "StoneGrey"), oct(RU + 40, 8, Z3 + 24, "GoldTrim"),
    oct(RU + 74, 46, Z3 + 32, "RoofSlate", RU + 12), oct(RU + 12, 540, Z3 + 78, "RoofSlate", 16),
    // little dormer-like lucarnes on the spire
    ...[0, 90, 180, 270].map((a) => rotateZ(merge(
      boxBounds([-RU + 10, -26, Z3 + 90], [-RU + 60, 26, Z3 + 190], "StoneBlueDark", 2),
      boxAt([4, 30, 66], [-RU + 8, 0, Z3 + 104], "Kradia_Window"),
      translate(facet(rotateZ(cylinderAt({ rBot: 46, rTop: 2, height: 60, segments: 4, bottom: [0, 0, 0] }, "RoofSlate"), 45)), [-RU + 36, 0, Z3 + 190]),
    ), a)),
  );
  for (let k = 0; k < 8; k++) out.push(rotateZ(archWindow(-apo(RU) + 2, 0, Z2 + 110, 52, 190, "Kradia_Window"), 45 * k));
  // the crown and its crystal
  const ZC = Z3 + 78 + 540;
  const claw = merge(
    beamBetween([36, 0, ZC - 10], [100, 0, ZC + 70], 10, 10, "GoldTrim"),
    beamBetween([100, 0, ZC + 70], [80, 0, ZC + 150], 8, 8, "GoldTrim"),
    sphereCenter(7, [80, 0, ZC + 152], "GoldTrim", 8),
  );
  out.push(
    translate(torus(56, 7, 16, 6, "GoldTrim"), [0, 0, ZC]),
    around(claw, 4, 45),
    crystal(62, 250, [0, 0, ZC + 36], "CrystalViolet"),
    ...[0, 72, 144, 216, 288].map((a, i) => shard(11, 48, [170 * Math.cos(a / DEG), 170 * Math.sin(a / DEG), ZC + 60 + (i % 2) * 60], 24, a, i % 2 ? "CrystalViolet" : "CrystalBlue")),
  );
  // the floating rune ring with crystal beads, round the middle stage
  const tilt = 9 / DEG, RR = 540, ZR = 930;
  out.push(translate(rotateY(torus(RR, 5, 48, 6, "Kradia_Rune"), 9), [0, 0, ZR]));
  for (const a of [30, 120, 210, 300]) {
    const c = Math.cos(a / DEG), s = Math.sin(a / DEG);
    out.push(crystal(11, 44, [RR * c * Math.cos(tilt), RR * s, ZR - RR * c * Math.sin(tilt) - 22], "CrystalBlue"));
  }
  return merge(...out);
}

// Magic academy and library: a long stone hall with buttresses and tall gold-barred windows,
// a steep slate roof with a crystal-tipped fleche, a rose window over the front door and a
// gilded open-book sign; pinnacles with crystals at the gable corners.
function academy(): Geo {
  const X = 650, Y = 420, H = 760, RH = 560;
  const out: Geo[] = [
    boxBounds([-X - 16, -Y - 16, 0], [X + 16, Y + 16, 60], "Kradia_StoneDeep", 3),
    boxBounds([-X, -Y, 60], [X, Y, H], "StoneGrey"),
    boxBounds([-X - 12, -Y - 12, H - 20], [X + 12, Y + 12, H + 10], "StoneBlueDark", 2),
    roof([2 * X, 2 * Y, 24], [0, 0, H + 10], RH, 44),
    gableWall(-X, Y, H + 10, RH - 4, "StoneGrey"), gableWall(X, Y, H + 10, RH - 4, "StoneGrey"),
  ];
  // pinnacles at the gable corners
  const pinnacle = merge(
    boxAt([56, 56, 70], [0, 0, 0], "StoneBlueDark", 3),
    boxAt([64, 64, 10], [0, 0, 70], "StoneGrey", 2),
    facet(rotateZ(cylinderAt({ rBot: 36, rTop: 2, height: 110, segments: 4, bottom: [0, 0, 80] }, "StoneBlueDark"), 45)),
    crystal(10, 40, [0, 0, 194], "CrystalBlue"),
  );
  for (const x of [-X + 10, X - 10]) for (const y of [-Y + 10, Y - 10]) out.push(translate(pinnacle, [x, y, H + 10]));
  // buttresses along both long sides
  const butt = (x: number): Geo => merge(
    boxBounds([x - 30, Y, 0], [x + 30, Y + 90, 412], "StoneBlueDark", 2),
    boxBounds([x - 34, Y, 412], [x + 34, Y + 98, 424], "StoneGrey", 1.5),
    boxBounds([x - 26, Y, 424], [x + 26, Y + 58, 680], "StoneBlueDark", 2),
    boxBounds([x - 30, Y, 680], [x + 30, Y + 66, 692], "StoneGrey", 1.5),
    crystal(9, 34, [x, Y + 34, 692], "CrystalViolet"),
  );
  const butts = merge(...[-620, -320, 0, 320, 620].map(butt));
  out.push(butts, rotateZ(butts, 180));
  const sideWin = merge(...[-470, -160, 160, 470].map((s) => archWindow(-Y, s, 180, 110, 400, "GlassBlue", "StoneBlueDark", "GoldTrim")));
  out.push(rotateZ(sideWin, 90), rotateZ(sideWin, -90));
  // front: door, steps, lancets, lamps, the book sign, the rose window
  const bookPage = (s: number) => translate(rotateZ(boxAt([4, 46, 36], [0, s * 24, 0], "FabricWhite"), s * 14), [-X - 10, 0, 468]);
  out.push(
    door(-X, 0, 230, 340, 60, "DoorWood"),
    boxBounds([-X - 82, -190, 0], [-X - 38, 190, 30], "StoneGrey", 2),
    archWindow(-X, -300, 160, 80, 330, "GlassBlue", "StoneBlueDark", "GoldTrim"),
    archWindow(-X, 300, 160, 80, 330, "GlassBlue", "StoneBlueDark", "GoldTrim"),
    sconce(-X, -186, 300), sconce(-X, 186, 300),
    boxAt([6, 140, 74], [-X - 3, 0, 448], "GoldTrim", 2),
    boxAt([4, 128, 62], [-X - 6.5, 0, 454], "FabricPurple"),
    bookPage(-1), bookPage(1),
    boxAt([5, 6, 40], [-X - 12, 0, 466], "WoodRed"),
    roseWindow(-X, 0, 1000, 130),
    rotateZ(merge(roseWindow(-X, 0, 1000, 100), archWindow(-X, -200, 180, 80, 330, "GlassBlue", "StoneBlueDark", "GoldTrim"), archWindow(-X, 200, 180, 80, 330, "GlassBlue", "StoneBlueDark", "GoldTrim")), 180),
  );
  // the fleche on the ridge
  const fl: Geo[] = [
    oct(72, 180, H + RH - 80, "StoneBlueDark"),
    oct(86, 12, H + RH + 90, "StoneGrey"),
    oct(92, 320, H + RH + 102, "RoofSlate", 4),
    sphereCenter(10, [0, 0, H + RH + 424], "GoldTrim", 8),
    crystal(14, 58, [0, 0, H + RH + 440], "CrystalViolet"),
  ];
  for (let k = 0; k < 8; k += 2) fl.push(rotateZ(boxAt([4, 26, 56], [-apo(72) - 1, 0, H + RH + 26], "Kradia_Window"), 45 * k));
  out.push(...fl);
  return merge(...out);
}

// Barracks: a long two-storey block (ridge along Y) with a dark stone ground floor, barred
// windows, a crest of shield and crossed swords over the iron-bound door, shuttered windows
// above, quoins, two chimneys and a pennant on the gable.
function barracks(): Geo {
  const X = 330, Y = 560, RH = 360;
  const out: Geo[] = [
    boxBounds([-X - 14, -Y - 14, 0], [X + 14, Y + 14, 50], "Kradia_StoneDeep", 3),
    boxBounds([-X, -Y, 50], [X, Y, 350], "StoneBlueDark"),
    boxBounds([-X - 8, -Y - 8, 350], [X + 8, Y + 8, 366], "StoneGrey", 2),
    boxBounds([-X, -Y, 366], [X, Y, 640], "StoneGrey"),
    boxBounds([-X - 10, -Y - 10, 640], [X + 10, Y + 10, 660], "Kradia_StoneDeep", 2),
    rotateZ(merge(
      roof([2 * Y, 2 * X, 22], [0, 0, 660], RH, 36),
      gableWall(-Y, X, 660, RH - 2, "StoneGrey"), gableWall(Y, X, 660, RH - 2, "StoneGrey"),
    ), 90),
  ];
  // quoins on the upper floor
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (let k = 0; k < 5; k++) {
    const [a, b] = k % 2 ? [32, 52] : [52, 32], z = 372 + k * 53;
    out.push(boxBounds([Math.min(sx * (X + 4), sx * (X - a)), Math.min(sy * (Y + 4), sy * (Y - b)), z], [Math.max(sx * (X + 4), sx * (X - a)), Math.max(sy * (Y + 4), sy * (Y - b)), z + 46], "StoneBlueDark", 2));
  }
  // chimneys through the back slope
  for (const y of [-330, 330]) out.push(
    boxBounds([96, y - 40, 800], [176, y + 40, 1130], "StoneBlueDark", 3),
    boxBounds([88, y - 48, 1130], [184, y + 48, 1148], "StoneGrey", 2),
    boxBounds([110, y - 26, 1148], [162, y + 26, 1150], "Kradia_Void"),
  );
  // front
  out.push(
    door(-X, 0, 190, 280, 50, "DoorWood"),
    crest(-X, 0, 470),
    banner(90, 210, [-X - 6, -190, 344]), hooks(-X, -X - 6, -190, 90, 347),
    banner(90, 210, [-X - 6, 190, 344]), hooks(-X, -X - 6, 190, 90, 347),
    ...[-480, -330, 330, 480].map((y) => barredWindow(-X, y, 170, 56, 90)),
    ...[-420, -200, 200, 420].map((y) => shutteredWindow(-X, y, 440, 70, 110)),
  );
  // back and gable ends
  out.push(rotateZ(merge(
    ...[-420, -140, 140, 420].map((y) => barredWindow(-X, y, 170, 56, 90)),
    ...[-420, -140, 140, 420].map((y) => shutteredWindow(-X, y, 440, 70, 110)),
  ), 180));
  const gable = merge(shutteredWindow(-Y, 0, 440, 70, 110), barredWindow(-Y, -150, 170, 56, 90), barredWindow(-Y, 150, 170, 56, 90), roundWindow(-Y, 0, 790, 34, "GlassBlue"));
  out.push(rotateZ(gable, 90), rotateZ(gable, -90));
  // a pennant pole on the -Y gable apex
  out.push(
    cylinderAt({ radius: 5, height: 230, segments: 6, bottom: [0, -Y - 30, 980] }, "WoodDark"),
    sphereCenter(8, [0, -Y - 30, 1214], "GoldTrim", 6),
    boxBounds([-82, -Y - 32, 1130], [-4, -Y - 28, 1190], "FabricPurple"),
    boxBounds([-84, -Y - 33, 1130], [-76, -Y - 27, 1190], "GoldTrim"),
  );
  return merge(...out);
}

// A Kradia house: two storeys of grey stone under a steep slate roof (gable to the front),
// a corbelled corner turret with a slate cone and crystal, shuttered windows, a slate hood
// over the door, a crystal lamp, a chimney.
function stoneHouse(): Geo {
  const X = 320, Y = 280, H = 600, RH = 380;
  const out: Geo[] = [
    boxBounds([-X - 12, -Y - 12, 0], [X + 12, Y + 12, 40], "Kradia_StoneDeep", 3),
    boxBounds([-X, -Y, 40], [X, Y, H], "StoneGrey"),
    boxBounds([-X - 7, -Y - 7, 300], [X + 7, Y + 7, 314], "StoneBlueDark", 2),
    boxBounds([-X - 10, -Y - 10, H - 6], [X + 10, Y + 10, H + 8], "StoneBlueDark", 2),
    roof([2 * X, 2 * Y, 20], [0, 0, H + 8], RH, 32),
    gableWall(-X, Y, H + 8, RH - 2, "StoneGrey"), gableWall(X, Y, H + 8, RH - 2, "StoneGrey"),
  ];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (let k = 0; k < 10; k++) {
    if (sx < 0 && sy > 0 && k > 3) continue; // under the turret
    const [a, b] = k % 2 ? [28, 46] : [46, 28], z = 48 + k * 54;
    out.push(boxBounds([Math.min(sx * (X + 4), sx * (X - a)), Math.min(sy * (Y + 4), sy * (Y - b)), z], [Math.max(sx * (X + 4), sx * (X - a)), Math.max(sy * (Y + 4), sy * (Y - b)), z + 44], "StoneBlueDark", 2));
  }
  // corner turret at the front left (+Y)
  const tc: V3 = [-X - 10, Y + 10, 0];
  const turret = merge(
    cylinderAt({ rBot: 26, rTop: 124, height: 110, segments: 16, bottom: [0, 0, 250] }, "StoneBlueDark"),
    drum(120, 520, 360, "StoneGrey"),
    drum(126, 14, 600, "StoneBlueDark"),
    drum(128, 12, 880, "GoldTrim"),
    drum(152, 340, 892, "RoofSlate", 16, 4),
    sphereCenter(9, [0, 0, 1234], "GoldTrim", 8),
    crystal(11, 46, [0, 0, 1250], "CrystalViolet"),
    archWindow(-apo16(120) + 2, 0, 420, 44, 110),
    rotateZ(archWindow(-apo16(120) + 2, 0, 680, 44, 110), -90),
    archWindow(-apo16(120) + 2, 0, 680, 44, 110),
  );
  out.push(translate(turret, tc));
  // front
  out.push(
    door(-X, -110, 110, 230, 40, "DoorWood"),
    beamBetween([-X - 92, -110, 290], [-X + 2, -110, 322], 176, 8, "RoofSlate"),
    beamBetween([-X, -186, 236], [-X - 80, -186, 292], 8, 8, "WoodDark"),
    beamBetween([-X, -34, 236], [-X - 80, -34, 292], 8, 8, "WoodDark"),
    sconce(-X, -230, 250),
    shutteredWindow(-X, 120, 120, 80, 110),
    shutteredWindow(-X, -150, 400, 70, 110),
    shutteredWindow(-X, 50, 400, 70, 110),
    roundWindow(-X, 0, 760, 30, "GlassBlue"),
  );
  // sides and back
  const side = merge(shutteredWindow(-Y, -120, 120, 80, 110), shutteredWindow(-Y, 140, 400, 70, 110));
  out.push(rotateZ(side, 90), rotateZ(merge(shutteredWindow(-Y, 100, 120, 80, 110), shutteredWindow(-Y, 20, 400, 70, 110)), -90));
  out.push(rotateZ(merge(shutteredWindow(-X, -100, 120, 80, 110), shutteredWindow(-X, 100, 400, 70, 110), roundWindow(-X, 0, 760, 30, "GlassBlue")), 180));
  // chimney on the -Y slope
  out.push(
    boxBounds([150, -190, 740], [230, -120, 1090], "StoneBlueDark", 3),
    boxBounds([142, -198, 1090], [238, -112, 1106], "StoneGrey", 2),
    boxBounds([162, -178, 1106], [218, -132, 1108], "Kradia_Void"),
  );
  return merge(...out);
}

// The smithy: a stone shop at the back and an open work floor under a slate lean-to on
// timber posts at the front: the forge with glowing coals under a stone hood and chimney,
// bellows, an anvil on a stump, a quench barrel, a grindstone, a crest of arms on the wall
// and a hanging sign with an anvil.
function smithy(): Geo {
  const out: Geo[] = [
    boxBounds([-10, -364, 0], [414, 364, 40], "Kradia_StoneDeep", 3),
    boxBounds([0, -350, 40], [400, 350, 440], "StoneBlueDark"),
    boxBounds([-8, -358, 430], [408, 358, 446], "StoneGrey", 2),
    translate(rotateZ(merge(
      roof([700, 400, 18], [0, 0, 446], 270, 34),
      gableWall(-350, 200, 446, 268, "StoneBlueDark"), gableWall(350, 200, 446, 268, "StoneBlueDark"),
    ), 90), [200, 0, 0]),
    boxBounds([-444, -362, 0], [-10, 362, 4], "CobbleDark"),
    // lean-to on posts (high enough to see the forge under it)
    beamBetween([-462, 0, 362], [6, 0, 432], 770, 14, "RoofSlate"),
    boxBounds([-436, -364, 334], [-404, 364, 358], "WoodDark", 2),
  ];
  for (const y of [-340, 0, 340]) {
    out.push(boxAt([42, 42, 12], [-420, y, 0], "StoneGrey", 2), boxBounds([-432, y - 12, 12], [-408, y + 12, 336], "WoodDark", 2));
    for (const s of [-1, 1]) if (Math.abs(y + s * 70) < 345) out.push(beamBetween([-420, y, 262], [-420, y + s * 70, 336], 8, 8, "WoodDark"));
  }
  // the forge: a hearth of glowing coals before a chimney breast with a fire mouth, bellows
  out.push(
    boxBounds([-250, 110, 0], [-50, 330, 86], "Kradia_StoneDeep", 3),
    boxBounds([-238, 122, 86], [-140, 318, 92], "FireGlow"),
    ...[[-215, 150], [-180, 290], [-165, 175], [-205, 250], [-160, 240]].map(([x, y]) => sphereCenter(8, [x, y, 92], "FireGlow", 6)),
    boxBounds([-140, 130, 86], [-50, 310, 300], "StoneBlueDark", 3),
    boxBounds([-144, 176, 92], [-139, 264, 172], "Kradia_Void"),
    boxBounds([-148, 168, 172], [-138, 272, 184], "IronDark"),
    ...[[200, 0, 46], [232, 14, 38], [222, -16, 30]].map(([y, tilt, h]) => translate(rotateY(facet(cylinderAt({ rBot: 13, rTop: 0.5, height: h, segments: 6, bottom: [0, 0, 0] }, "FireGlow")), tilt), [-152, y, 92])),
    boxBounds([-146, 124, 300], [-44, 316, 312], "StoneGrey", 2),
    boxBounds([-130, 180, 312], [-62, 260, 900], "StoneBlueDark", 3),
    boxBounds([-138, 172, 900], [-54, 268, 918], "StoneGrey", 2),
    boxBounds([-120, 190, 918], [-72, 250, 920], "Kradia_Void"),
    boxBounds([-230, 20, 0], [-130, 90, 40], "WoodDark", 2),
    boxBounds([-226, 28, 40], [-140, 82, 64], "FeltRed", 3),
    beamBetween([-230, 55, 66], [-140, 55, 54], 60, 5, "WoodWarm"),
    cylinderBetween([-185, 82, 54], [-185, 116, 70], 4, 6, "IronDark"),
  );
  // anvil on its stump, hammer
  out.push(translate(merge(
    cylinderAt({ radius: 30, height: 52, segments: 10, bottom: [0, 0, 0] }, "WoodDark"),
    boxBounds([-22, -14, 52], [22, 14, 62], "IronDark", 1.5),
    boxBounds([-12, -9, 62], [12, 9, 74], "IronDark"),
    boxBounds([-30, -15, 74], [26, 15, 90], "IronDark", 2),
    cylinderBetween([-30, 0, 84], [-62, 0, 87], 8, 8, "IronDark", 1.5),
    cylinderBetween([0, 6, 93], [34, 30, 93], 2.2, 6, "WoodWarm"),
    boxBounds([-6, -2, 88], [8, 14, 98], "IronLight", 1),
  ), [-270, -60, 4]));
  // quench barrel, grindstone, coal heap, iron bars
  out.push(
    barrel([-340, -270, 4], 32, 76),
    translate(drum(26, 2, 0, "WaterDark", 12), [-340, -270, 74]),
    translate(merge(
      disk(38, 12, [0, 0, 64], "StoneGrey", 14),
      cylinderBetween([0, -30, 64], [0, 30, 64], 3, 6, "IronDark"),
      beamBetween([0, -22, 0], [0, -22, 64], 8, 8, "WoodDark"), beamBetween([0, 22, 0], [0, 22, 64], 8, 8, "WoodDark"),
      beamBetween([-40, -22, 0], [0, -22, 60], 6, 6, "WoodDark"), beamBetween([-40, 22, 0], [0, 22, 60], 6, 6, "WoodDark"),
      boxBounds([-30, -18, 0], [30, 18, 20], "WoodWarm", 2),
    ), [-330, 230, 4]),
    translate(rock([90, 70, 36], 0.5, 11, "Kradia_Void"), [-60, -70, 4]),
    ...[0, 1, 2].map((i) => boxBounds([-400, -190 + i * 12, 4 + (i % 2) * 8], [-300, -180 + i * 12, 12 + (i % 2) * 8], "IronLight", 1)),
  );
  // the back room's door, crest and windows
  out.push(
    door(0, -230, 110, 230, 40, "DoorWood"),
    translate(rotateX(sword(80), 35), [-1, -70, 220]), translate(rotateX(sword(80), -35), [-1, -70, 220]),
    roundShield(32, [-6, -70, 300], "FabricPurple"),
    rotateZ(shutteredWindow(-350, 200, 170, 70, 100), -90),
    rotateZ(shutteredWindow(-350, -200, 170, 70, 100), 90),
    rotateZ(merge(shutteredWindow(-400, -150, 170, 70, 100), shutteredWindow(-400, 150, 170, 70, 100)), 180),
  );
  // hanging sign with an anvil
  out.push(
    boxBounds([-424, -192, 262], [-420, -190, 336], "IronDark"), boxBounds([-424, -110, 262], [-420, -108, 336], "IronDark"),
    boxBounds([-426, -200, 200], [-418, -100, 262], "WoodWarm", 2),
    ...[[-428, -426], [-418, -416]].map(([x0, x1]) => merge(
      boxBounds([x0, -170, 222], [x1, -130, 234], "IronDark"),
      boxBounds([x0, -160, 212], [x1, -140, 222], "IronDark"),
      boxBounds([x0, -176, 234], [x1, -124, 244], "IronDark"),
      boxBounds([x0, -124, 238], [x1, -112, 242], "IronDark"),
    )),
  );
  return merge(...out);
}

// A market stall of crystals and potions: counter with a purple drape, shelves of glowing
// bottles, a crystal ball, crystal clusters, books, and a purple-and-gold striped awning.
function crystalStall(): Geo {
  const out: Geo[] = [
    boxBounds([-70, -130, 0], [10, 130, 86], "WoodDark", 2),
    boxBounds([-80, -140, 86], [18, 140, 94], "WoodWarm", 2),
    boxBounds([-73, -128, 30], [-70, 128, 86], "FabricPurple"),
    boxBounds([-74, -128, 24], [-70, 128, 32], "GoldTrim"),
    translate(rotateX(box([3, 30, 30], [0, 0, 0], "Kradia_Rune"), 45), [-74.5, 0, 60]),
  ];
  // posts and awning
  for (const y of [-136, 136]) out.push(boxBounds([-82, y - 5, 0], [-72, y + 5, 232], "WoodDark", 1.5), boxBounds([62, y - 5, 0], [72, y + 5, 272], "WoodDark", 1.5));
  const stripes: Geo[] = [];
  for (let i = 0; i < 10; i++) stripes.push(box([236, 30, 3], [0, -135 + 30 * i, 0], i % 2 ? "FabricGold" : "FabricPurple"));
  out.push(translate(rotateY(merge(...stripes), -10), [-6, 0, 253]));
  for (let i = 0; i < 10; i++) out.push(boxAt([3, 28, 22], [-122, -135 + 30 * i, 210], i % 2 ? "FabricPurple" : "FabricGold"));
  // shelves of bottles
  out.push(boxBounds([36, -130, 0], [70, -122, 200], "WoodDark"), boxBounds([36, 122, 0], [70, 130, 200], "WoodDark"));
  const bottles = ["CrystalBlue", "CrystalViolet", "FireGlow", "GlassBlue", "CrystalBlue", "Kradia_Rune", "CrystalViolet"];
  for (const z of [60, 120, 180]) {
    out.push(boxBounds([34, -128, z], [72, 128, z + 6], "WoodWarm", 1.5));
    bottles.forEach((mat, i) => {
      const y = -100 + i * 33, hh = 16 + ((i * 7 + z) % 3) * 5;
      out.push(
        cylinderAt({ rBot: 7, rTop: 5, height: hh, segments: 6, bottom: [54, y, z + 6] }, mat),
        cylinderAt({ radius: 3, height: 9, segments: 5, bottom: [54, y, z + 6 + hh] }, "WoodPale"),
      );
    });
  }
  // goods on the counter
  out.push(
    shard(9, 44, [-34, -96, 94], 0, 0, "CrystalViolet"), shard(7, 34, [-30, -80, 94], 22, 60, "CrystalViolet"), shard(6, 30, [-38, -108, 94], 25, 200, "CrystalBlue"),
    cylinderAt({ rBot: 12, rTop: 6, height: 14, segments: 8, bottom: [-30, 70, 94] }, "GoldTrim"),
    sphereCenter(16, [-30, 70, 122], "CrystalBlue", 12),
    boxBounds([-44, -10, 94], [-14, 24, 102], "FabricNavy", 1), boxBounds([-42, -8, 102], [-16, 22, 109], "FabricRed", 1), boxBounds([-40, -6, 109], [-18, 18, 115], "FabricGreen", 1),
    boxBounds([-82, -136, 222], [-72, 136, 230], "WoodDark", 1.5),
    boxBounds([-78, -27, 200], [-76, -25, 222], "IronDark"), boxBounds([-78, 25, 200], [-76, 27, 222], "IronDark"),
    boxBounds([-80, -40, 168], [-74, 40, 200], "WoodDark", 1.5),
    translate(rotateX(box([3, 18, 18], [0, 0, 0], "Kradia_Rune"), 45), [-81.5, 0, 184]),
    translate(rotateX(box([3, 18, 18], [0, 0, 0], "Kradia_Rune"), 45), [-72.5, 0, 184]),
  );
  return merge(...out);
}

// ---- magic ----

// A ward stone: a tapering dark obelisk with glowing runes and gold bands on a stepped base,
// a violet crystal floating over a gold cradle at its top, blue shards drifting around it.
function crystalObelisk(): Geo {
  const half = (z: number) => 31 - (10 * (z - 60)) / 320;
  const face: Geo[] = [];
  for (const z of [140, 225, 305]) {
    face.push(boxAt([3, 4, 34], [-half(z) - 1, 0, z - 17], "Kradia_Rune"));
    face.push(translate(rotateX(box([3, 14, 14], [0, 0, 0], "Kradia_Rune"), 45), [-half(z) - 1.4, 0, z + 26]));
  }
  return merge(
    boxAt([140, 140, 30], [0, 0, 0], "Kradia_StoneDeep", 4),
    boxAt([108, 108, 30], [0, 0, 30], "StoneGrey", 3),
    facet(rotateZ(cylinderAt({ rBot: 31 * Math.SQRT2, rTop: 21 * Math.SQRT2, height: 320, segments: 4, bottom: [0, 0, 60] }, "StoneBlueDark"), 45)),
    around(merge(...face), 4),
    boxAt([66, 66, 10], [0, 0, 92], "GoldTrim", 2),
    boxAt([48, 48, 10], [0, 0, 362], "GoldTrim", 2),
    boxAt([46, 46, 8], [0, 0, 380], "StoneGrey", 2),
    around(beamBetween([18, 0, 386], [34, 0, 440], 6, 6, "GoldTrim"), 4, 45),
    crystal(26, 122, [0, 0, 404], "CrystalViolet"),
    shard(7, 30, [52, 10, 444], 30, 20), shard(6, 26, [-30, 44, 470], -28, 110), shard(6, 24, [-20, -50, 430], 26, 250),
  );
}

// A rune circle: a round two-tier dais with two glowing rings, twelve glyphs between them,
// a hexagram and a glowing core, and four short crystal posts on the rim.
function runeCircle(): Geo {
  const Z = 32;
  const inlay = (g: Geo) => translate(g, [0, 0, Z - 1]);
  const bar = (len: number, w = 6) => boxAt([len, w, 3], [0, 0, 0], "Kradia_Rune");
  const glyphs: Geo[] = [
    merge(bar(6, 36), translate(bar(26, 6), [0, 15, 0]), translate(bar(14, 6), [0, -6, 0])),
    merge(translate(rotateZ(boxAt([16, 16, 3], [0, 0, 0], "Kradia_Rune"), 45), [0, 6, 0]), translate(bar(30, 5), [0, -14, 0])),
    merge(translate(bar(6, 34), [-8, 0, 0]), translate(bar(6, 34), [8, 0, 0]), translate(boxAt([8, 8, 3], [0, 0, 0], "Kradia_Rune"), [0, 22, 0])),
    merge(rotateZ(bar(30, 5), 35), rotateZ(bar(30, 5), -35)),
  ];
  const ring: Geo[] = [];
  for (let i = 0; i < 12; i++) ring.push(rotateZ(translate(rotateZ(glyphs[i % 4], 90), [305, 0, 0]), i * 30));
  const hex: Geo[] = [];
  for (const start of [90, 30]) for (let k = 0; k < 3; k++) {
    const a = (start + k * 120) / DEG, b = (start + (k + 1) * 120) / DEG;
    hex.push(beamBetween([200 * Math.cos(a), 200 * Math.sin(a), 1.5], [200 * Math.cos(b), 200 * Math.sin(b), 1.5], 6, 3, "Kradia_Rune"));
  }
  const post = merge(
    boxAt([46, 46, 70], [0, 0, 0], "StoneBlueDark", 3),
    boxAt([54, 54, 10], [0, 0, 70], "StoneGrey", 2),
    crystal(12, 50, [0, 0, 80], "CrystalBlue"),
  );
  return merge(
    drum(430, 16, 0, "Kradia_StoneDeep", 32),
    drum(400, 16, 16, "StoneGrey", 32),
    inlay(scale(torus(360, 4, 48, 6, "Kradia_Rune"), [1, 1, 0.5])),
    inlay(scale(torus(250, 3.5, 40, 6, "Kradia_Rune"), [1, 1, 0.5])),
    inlay(merge(...ring)),
    inlay(merge(...hex)),
    inlay(scale(torus(200, 3, 36, 6, "Kradia_Rune"), [1, 1, 0.5])),
    translate(drum(56, 4, 0, "StoneBlueDark", 16), [0, 0, Z - 1]),
    translate(scale(torus(44, 3, 24, 6, "Kradia_RuneBlue"), [1, 1, 0.6]), [0, 0, Z + 3]),
    translate(rotateZ(boxBounds([-16, -16, Z + 2], [16, 16, Z + 5], "Kradia_Rune"), 45), [0, 0, 0]),
    around(translate(post, [372, 0, Z]), 4, 45),
  );
}

// An arcane street lamp: iron post with gold rings on a stone foot, an iron crown holding a
// floating blue crystal under a little cap.
function arcaneLamp(): Geo {
  return merge(
    boxAt([52, 52, 20], [0, 0, 0], "Kradia_StoneDeep", 3),
    boxAt([36, 36, 30], [0, 0, 20], "StoneGrey", 3),
    cylinderAt({ rBot: 8, rTop: 6, height: 232, segments: 8, bottom: [0, 0, 50] }, "IronDark"),
    ...[60, 170, 278].map((z) => cylinderAt({ radius: 10, height: 6, segments: 8, bottom: [0, 0, z] }, "GoldTrim")),
    around(merge(beamBetween([4, 0, 282], [24, 0, 304], 4, 4, "IronDark"), beamBetween([24, 0, 304], [19, 0, 356], 4, 4, "IronDark")), 4, 45),
    facet(rotateZ(cylinderAt({ rBot: 30, rTop: 3, height: 24, segments: 4, bottom: [0, 0, 356] }, "IronDark"), 45)),
    sphereCenter(5, [0, 0, 384], "GoldTrim", 6),
    crystal(13, 54, [0, 0, 292], "CrystalBlue"),
  );
}

// ---- defence ----

// The great crossbow (aims at -X): a turntable mount, the stock with a loaded bolt, torsion
// skeins and arms at the front, the string back to the claw, a winch at the rear.
function ballista(): Geo {
  const up: Geo[] = [
    boxBounds([-150, -14, 106], [120, 14, 128], "WoodWarm", 2),
    boxBounds([-130, -60, 98], [-84, 60, 150], "WoodDark", 2),
    boxBounds([-127, -62, 96], [-121, 62, 152], "IronDark"), boxBounds([-93, -62, 96], [-87, 62, 152], "IronDark"),
  ];
  for (const s of [-1, 1]) up.push(
    cylinderAt({ radius: 11, height: 74, segments: 8, bottom: [-107, s * 40, 88] }, "RopeTan"),
    beamBetween([-107, s * 46, 125], [-72, s * 176, 128], 9, 9, "WoodWarm"),
    sphereCenter(5, [-72, s * 177, 128], "IronDark", 6),
    beamBetween([-72, s * 176, 128], [70, 0, 134], 2.5, 2.5, "RopeTan"),
  );
  const fin = boxBounds([40, -1, 136], [68, 1, 152], "FeltRed");
  up.push(
    cylinderBetween([-190, 0, 136], [70, 0, 136], 3.2, 6, "WoodPale"),
    cylinderBetween([-190, 0, 136], [-224, 0, 136], 6, 4, "IronDark", 0.5),
    fin, rotateX(fin, 120, [0, 0, 136]), rotateX(fin, 240, [0, 0, 136]),
    boxBounds([62, -11, 128], [84, 11, 142], "IronDark", 1.5),
    cylinderBetween([110, -40, 118], [110, 40, 118], 6, 8, "WoodDark"),
    boxBounds([96, -28, 104], [124, -16, 128], "WoodDark", 1.5), boxBounds([96, 16, 104], [124, 28, 128], "WoodDark", 1.5),
  );
  for (const s of [-1, 1]) {
    const w = translate(rotateX(torus(18, 2.6, 12, 4, "IronDark"), 90), [110, s * 42, 118]);
    up.push(w, beamBetween([110, s * 42, 100], [110, s * 42, 136], 3, 3, "IronDark"), beamBetween([92, s * 42, 118], [128, s * 42, 118], 3, 3, "IronDark"));
  }
  return merge(
    boxBounds([-90, -12, 0], [90, 12, 18], "WoodDark", 2),
    boxBounds([-12, -90, 0], [12, 90, 17], "WoodDark", 2),
    drum(46, 14, 18, "WoodWarm", 12),
    boxBounds([-16, -16, 32], [16, 16, 100], "WoodDark", 2),
    boxBounds([-26, -24, 96], [26, 24, 106], "IronDark", 1.5),
    rotateY(merge(...up), 6, [0, 0, 106]),
  );
}

// A wheeled stone-thrower (mangonel, throws towards -X): chassis on four wheels, the A-frame
// with a padded stop bar, the torsion skein, the arm cocked back with a glowing crystal shot.
function catapult(): Geo {
  const out: Geo[] = [];
  for (const y of [-80, 80]) out.push(boxBounds([-180, y - 12, 34], [180, y + 12, 62], "WoodDark", 2));
  for (const x of [-160, 0, 150]) out.push(boxBounds([x - 12, -92, 46], [x + 12, 92, 66], "WoodWarm", 2));
  const wheel = merge(
    rotateX(flatCaps(cylinderCenter(42, 12, 14, [0, 0, 0], "WoodWarm")), 90),
    rotateX(torus(42, 4, 16, 6, "IronDark"), 90),
    rotateX(cylinderCenter(9, 20, 8, [0, 0, 0], "IronDark"), 90),
  );
  for (const x of [-120, 120]) {
    out.push(cylinderBetween([x, -112, 46], [x, 112, 46], 5, 8, "IronDark"));
    for (const y of [-104, 104]) out.push(translate(wheel, [x, y, 46]));
  }
  for (const y of [-72, 72]) out.push(
    boxBounds([-62, y - 10, 62], [-42, y + 10, 236], "WoodDark", 2),
    beamBetween([-168, y, 62], [-54, y, 200], 10, 10, "WoodDark"),
    beamBetween([40, y, 62], [-50, y, 200], 10, 10, "WoodDark"),
  );
  out.push(
    boxBounds([-66, -92, 220], [-38, 92, 246], "WoodWarm", 2),
    boxBounds([-40, -30, 214], [-30, 30, 250], "FeltRed", 2),
    cylinderBetween([60, -68, 72], [60, 68, 72], 20, 10, "RopeTan"),
    translate(rotateX(torus(22, 4, 12, 4, "IronDark"), 90), [60, -70, 72]), translate(rotateX(torus(22, 4, 12, 4, "IronDark"), 90), [60, 70, 72]),
    beamBetween([50, 0, 68], [220, 0, 104], 16, 16, "WoodWarm"),
    ...[90, 150, 200].map((x) => beamBetween([x, -9.5, 76 + (x - 50) * 0.21], [x, 9.5, 76 + (x - 50) * 0.21], 4, 18, "IronDark")),
    cylinderAt({ rBot: 16, rTop: 30, height: 18, segments: 10, bottom: [222, 0, 104] }, "WoodDark"),
    facet(sphereCenter(22, [222, 0, 134], "CrystalViolet", 7)),
    cylinderBetween([160, -96, 78], [160, 96, 78], 7, 8, "WoodDark"),
    beamBetween([160, 0, 80], [200, 0, 98], 2.5, 2.5, "RopeTan"),
  );
  for (const y of [-98, 98]) out.push(beamBetween([160, y, 50], [160, y, 106], 5, 5, "IronDark"), beamBetween([132, y, 78], [188, y, 78], 5, 5, "IronDark"));
  return merge(...out);
}

// A spiked barricade (cheval de frise), 300 cm along Y: a log with sharpened stakes crossed
// through it, bound with iron.
function barricade(): Geo {
  const out: Geo[] = [cylinderBetween([0, -150, 70], [0, 150, 70], 16, 10, "WoodDark")];
  const d = Math.SQRT1_2 * 100;
  for (let j = 0; j < 5; j++) {
    const y = -120 + 60 * j;
    for (const s of [-1, 1]) {
      const lo: V3 = [-s * d, y, 70 - d], hi: V3 = [s * d * 0.86, y, 70 + d * 0.86], tip: V3 = [s * d * 1.12, y, 70 + d * 1.12];
      out.push(cylinderBetween(lo, hi, 6, 6, "WoodPale"), cylinderBetween(hi, tip, 6, 6, "WoodPale", 0.6));
    }
    out.push(cylinderBetween([0, y - 9, 70], [0, y + 9, 70], 17.5, 10, "IronDark"));
  }
  return merge(...out);
}

// ---- lights and decor ----

function brazier(): Geo {
  const flame = (r: number, h: number, at: V3, tilt: number, turn: number, mat = "FireGlow") =>
    translate(rotateZ(rotateY(facet(cylinderAt({ rBot: r, rTop: 0.5, height: h, segments: 7, bottom: [0, 0, 0] }, mat)), tilt), turn), at);
  return merge(
    oct(44, 18, 0, "Kradia_StoneDeep"),
    oct(28, 82, 18, "StoneGrey", 22),
    oct(36, 12, 100, "Kradia_StoneDeep"),
    cylinderAt({ rBot: 24, rTop: 52, height: 32, segments: 12, bottom: [0, 0, 112] }, "IronDark"),
    drum(54, 6, 142, "GoldTrim", 12, 52),
    around(beamBetween([26, 0, 112], [58, 0, 154], 5, 5, "IronDark"), 4, 45),
    drum(46, 4, 136, "WoodDark", 12),
    flame(30, 74, [0, 0, 138], 0, 0), flame(18, 50, [20, 8, 138], 16, 20), flame(16, 44, [-16, -14, 138], 18, 210),
    flame(14, 40, [-6, 20, 138], 14, 120, "LanternGlow"), flame(12, 34, [14, -20, 138], 18, 300, "LanternGlow"),
  );
}

function bannerPole(): Geo {
  return merge(
    boxAt([72, 72, 30], [0, 0, 0], "Kradia_StoneDeep", 3),
    boxAt([48, 48, 20], [0, 0, 30], "StoneGrey", 3),
    cylinderAt({ rBot: 7, rTop: 6, height: 570, segments: 8, bottom: [0, 0, 50] }, "WoodDark"),
    ...[60, 420].map((z) => cylinderAt({ radius: 8.5, height: 8, segments: 8, bottom: [0, 0, z] }, "GoldTrim")),
    boxBounds([-14, -8, 580], [0, 8, 600], "IronDark"),
    banner(130, 400, [-14, 0, 590]),
    facet(cylinderAt({ rBot: 10, rTop: 0.5, height: 36, segments: 4, bottom: [0, 0, 620] }, "GoldTrim")),
    crystal(8, 30, [0, 0, 662], "CrystalViolet"),
  );
}

function weaponRack(): Geo {
  const end = (y: number) => merge(
    beamBetween([-36, y, 0], [0, y, 152], 8, 8, "WoodDark"),
    beamBetween([36, y, 0], [0, y, 152], 8, 8, "WoodDark"),
    boxBounds([-28, y - 4, 40], [28, y + 4, 48], "WoodDark"),
  );
  return merge(
    end(-100), end(100),
    boxBounds([-6, -112, 146], [6, 112, 158], "WoodWarm", 1.5),
    boxBounds([-26, -104, 44], [26, 104, 52], "WoodWarm", 1.5),
    ...[-72, -42, -12].map((y) => translate(rotateY(spear(214), 11), [-20, y, 52])),
    ...[28, 62].map((y) => translate(rotateY(sword(84), -9), [16, y, 52])),
    translate(rotateY(roundShield(30, [0, 0, 31]), 12), [-50, 62, 0]),
  );
}

function trainingDummy(): Geo {
  return merge(
    boxBounds([-45, -7, 0], [45, 7, 12], "WoodDark", 2), boxBounds([-7, -45, 0], [7, 45, 13], "WoodDark", 2),
    cylinderAt({ radius: 7, height: 140, segments: 8, bottom: [0, 0, 12] }, "WoodWarm"),
    cylinderAt({ rBot: 22, rTop: 27, height: 75, segments: 10, bottom: [0, 0, 70] }, "Thatch"),
    ...[84, 122].map((z) => cylinderAt({ radius: 28, height: 5, segments: 10, bottom: [0, 0, z] }, "RopeTan")),
    cylinderBetween([0, -62, 130], [0, 62, 130], 5, 8, "WoodWarm"),
    sphereCenter(9, [0, -64, 130], "FabricSand", 8),
    sphereCenter(19, [0, 0, 166], "FabricSand", 10),
    cylinderAt({ rBot: 21, rTop: 14, height: 12, segments: 10, bottom: [0, 0, 172] }, "IronLight"),
    translate(scale(sphereCenter(14, [0, 0, 0], "IronLight", 10), [1, 1, 0.6]), [0, 0, 184]),
    boxAt([4, 5, 16], [-20, 0, 158], "IronLight"),
    disk(12, 3, [-26, 0, 108], "FabricRed", 12), disk(6, 3, [-27.5, 0, 108], "FabricWhite", 10),
    roundShield(22, [-8, 52, 116], "WoodRed"),
  );
}

function supplies(): Geo {
  const open = merge(
    boxBounds([-30, -30, 0], [30, 30, 6], "WoodShade", 1),
    boxBounds([-30, -30, 6], [-24, 30, 46], "WoodWarm", 1), boxBounds([24, -30, 6], [30, 30, 46], "WoodWarm", 1),
    boxBounds([-24, -30, 6], [24, -24, 46], "WoodWarm", 1), boxBounds([-24, 24, 6], [24, 30, 46], "WoodWarm", 1),
    boxBounds([-24, -24, 6], [24, 24, 30], "FabricSand"),
    shard(8, 40, [-8, -6, 26], 14, 30), shard(7, 34, [10, 8, 26], 20, 200, "CrystalViolet"), shard(6, 30, [8, -12, 26], 24, 300),
    shard(6, 28, [-12, 12, 26], 22, 120, "CrystalViolet"),
  );
  return merge(
    barrel([-80, -80, 0]), barrel([-84, -10, 0], 28, 74),
    crateAt([40, -70, 0], 1, 8), crateAt([42, -68, 60], 0.78, 30),
    translate(rotateZ(open, -12), [50, 30, 0]),
    sack([-30, 70, 0], 20), sack([-95, 62, 0], -30), sack([-60, 75, 34], 70),
  );
}

// ---- ground ----

// Road tile, 400 x 400 (runs along X): cobbles between stone kerbs.
function roadTile(): Geo {
  const kerb = boxBounds([-199, -200, 0], [-101, -160, 8], "StoneGrey", 1.5);
  return merge(
    boxBounds([-200, -160, 0], [200, 160, 4], "Cobble"),
    array(kerb, 4, [100, 0, 0]),
    array(translate(kerb, [0, 360, 0]), 4, [100, 0, 0]),
  );
}

// Plaza tile, 400 x 400: grey flagstones on a dark bed, a dark stone band round the edge (the
// tiles make a 4 m grid) and a thin glowing four-point star with a crystal diamond at the centre.
function runePlazaTile(): Geo {
  const out: Geo[] = [boxBounds([-200, -200, 0], [200, 200, 3], "Kradia_StoneDeep")];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const x0 = -186 + i * 93, y0 = -186 + j * 93;
    out.push(boxBounds([x0 + 1, y0 + 1, 0], [x0 + 92, y0 + 92, 6], (i * 3 + j * 5) % 7 === 0 ? "StoneWhite" : "StoneGrey", 1.5));
  }
  const band = boxBounds([-199, -199, 0], [-187, 199, 6.5], "StoneBlueDark", 1);
  out.push(band, rotateZ(band, 90), rotateZ(band, 180), rotateZ(band, 270));
  const ray = rotateZ(boxBounds([-3, 0, 6], [3, 92, 8], "Kradia_Rune"), 0);
  out.push(
    around(ray, 4),
    around(scale(ray, [0.7, 0.45, 1]), 4, 45),
    translate(rotateZ(boxBounds([-16, -16, 6], [16, 16, 9], "StoneBlueDark", 1), 45), [0, 0, 0]),
    translate(rotateZ(boxBounds([-9, -9, 8], [9, 9, 11], "Kradia_RuneBlue"), 45), [0, 0, 0]),
  );
  return merge(...out);
}

// ---- the kit ----

export const KIT: Kit = {
  id: "kradia",
  name: "คราเดีย",
  region: "ชายแดนตะวันออก",
  desc: "นครแห่งเวทมนตร์และป้อมปราการที่คอยกันอสูรจากฝั่งตะวันออก กำแพงหินสีน้ำเงินเข้ม หอคอยจอมเวท ผลึกเรืองแสง และธงสีม่วงทอง",
  ground: "rock",
  items: [
    { id: "fortress_wall", name: "กำแพงป้อม (7 ม.)", make: fortressWall, tags: ["wall", "defence"] },
    { id: "wall_tower", name: "หอกำแพงทรงกลม", make: wallTower, tags: ["tower", "wall", "defence"] },
    { id: "fortress_gate", name: "ประตูป้อมปราการ", make: fortressGate, tags: ["gate", "wall", "defence"] },
    { id: "mage_tower", name: "หอคอยจอมเวท", make: mageTower, tags: ["landmark", "building", "magic"] },
    { id: "arcane_academy", name: "หอสมุดเวทมนตร์", make: academy, tags: ["building", "magic"] },
    { id: "barracks", name: "ค่ายทหาร", make: barracks, tags: ["building", "defence"] },
    { id: "stone_house", name: "บ้านหินหอมุม", make: stoneHouse, tags: ["building"] },
    { id: "smithy", name: "โรงตีเหล็ก", make: smithy, tags: ["building", "market"] },
    { id: "crystal_stall", name: "แผงขายผลึกเวท", make: crystalStall, tags: ["market", "magic"] },
    { id: "crystal_obelisk", name: "เสาผลึกเวท", make: crystalObelisk, tags: ["magic", "decor"] },
    { id: "rune_circle", name: "วงเวทรูน", make: runeCircle, tags: ["magic", "ground"] },
    { id: "arcane_lamp", name: "โคมผลึก", make: arcaneLamp, tags: ["light", "magic"] },
    { id: "ballista", name: "หน้าไม้ยักษ์", make: ballista, tags: ["defence"] },
    { id: "catapult", name: "เครื่องยิงหิน", make: catapult, tags: ["defence"] },
    { id: "barricade", name: "รั้วขวากไม้ (3 ม.)", make: barricade, tags: ["defence"] },
    { id: "brazier", name: "กระถางไฟ", make: brazier, tags: ["light", "decor"] },
    { id: "banner_pole", name: "เสาธงคราเดีย", make: bannerPole, tags: ["decor"] },
    { id: "weapon_rack", name: "ชั้นวางอาวุธ", make: weaponRack, tags: ["decor", "defence"] },
    { id: "training_dummy", name: "หุ่นฝึกดาบ", make: trainingDummy, tags: ["decor"] },
    { id: "supplies", name: "กองเสบียง", make: supplies, tags: ["decor", "market"] },
    { id: "road_tile", name: "ถนนหิน (4 ม.)", make: roadTile, tags: ["ground"] },
    { id: "rune_plaza_tile", name: "พื้นลานรูน (4 ม.)", make: runePlazaTile, tags: ["ground", "magic"] },
  ],
  sample,
};

// A corner of Kradia: the inner side of the east wall (+X) with the gate, a wall tower and
// ballistae on the ramparts; the mage tower behind a rune-circle plaza ringed by ward stones;
// the barracks and its training yard; the smithy, a house and crystal stalls by the road.
function sample(put: Put): void {
  const WX = 1750;
  // the wall, the gate and the towers
  put("fortress_gate", [WX, -700, 0]);
  for (const y of [410, 1110, 1810, -1810]) put("fortress_wall", [WX, y, 0]);
  put("wall_tower", [WX, 2160, 0]);
  put("wall_tower", [WX, -2160, 0]);
  put("ballista", [WX - 10, -700, 936], 180, 0.85);
  put("ballista", [WX - 50, 760, 616], 180, 0.7);
  put("ballista", [WX - 50, -1600, 616], 180, 0.7);
  put("barricade", [2150, -1250, 0], 10);
  put("barricade", [2150, -150, 0], -10);
  // the road in from the gate
  for (let x = 1270; x > -2200; x -= 400) put("road_tile", [x, -700, 0]);
  // the plaza with the rune circle before the mage tower
  for (const x of [-1050, -650, -250]) for (const y of [-300, 100, 500, 900, 1300, 1700]) put("rune_plaza_tile", [x, y, 0]);
  put("mage_tower", [700, 1250, 0]);
  put("rune_circle", [-500, 1170, 0]);
  for (const [dx, dy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) put("crystal_obelisk", [-500 + dx * 440, 1170 + dy * 440, 0]);
  put("arcane_lamp", [-1180, 300, 0]);
  put("arcane_lamp", [-120, 300, 0]);
  put("crystal_stall", [-1100, -150, 0], 0);
  put("crystal_stall", [-1100, 520, 0], 0);
  put("banner_pole", [-120, -320, 0]);
  put("banner_pole", [0, 1060, 0]);
  put("banner_pole", [0, 1440, 0]);
  // a little market on the near side of the plaza
  put("common:market_cart", [-1800, -100, 0], 80);
  put("supplies", [-1900, 380, 0], 30);
  put("common:bench", [-1500, 950, 0], 90);
  put("brazier", [-1450, 1250, 0]);
  // lamps and braziers along the road
  for (const x of [900, 100, -700, -1500]) put("arcane_lamp", [x, -440, 0]);
  for (const x of [500, -300, -1100, -1900]) put("arcane_lamp", [x, -960, 0]);
  put("brazier", [1280, -1000, 0]);
  put("brazier", [1280, -400, 0]);
  put("banner_pole", [1330, -1180, 0]);
  put("banner_pole", [1330, -220, 0]);
  put("catapult", [1150, 300, 0], 180);
  put("supplies", [1400, 520, 0]);
  // the barracks and its yard
  put("barracks", [650, -1650, 0]);
  put("training_dummy", [-50, -1500, 0], 10);
  put("training_dummy", [-60, -1800, 0], -15);
  put("weapon_rack", [100, -1250, 0], 90);
  put("weapon_rack", [-250, -1980, 0], -90);
  put("supplies", [1200, -1950, 0]);
  // smithy and a house near the camera
  put("smithy", [-1450, -1720, 0]);
  put("supplies", [-1550, -1150, 0], 180);
  put("stone_house", [-1760, 1780, 0]);
  put("brazier", [-1250, 1950, 0]);
  // trees, sparse on the border
  put("flora:Pine", [-2150, 650, 0], 0, 0.85);
  put("flora:PineSmall", [-2150, 1150, 0], 40);
  put("flora:AutumnTree", [-2050, -1250, 0], 20, 0.8);
  put("flora:Birch", [250, 1950, 0], 0, 0.9);
  put("flora:PineSmall", [-650, -2050, 0], 80);
  put("flora:Pine", [1150, -2150, 0], 0, 0.9);
  put("flora:AutumnTree", [300, -400, 0], 150, 0.7);
}

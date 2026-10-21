// Item icons for tops and bottoms: each shape drawn on its own as a 24 x 24 pixel-art piece (a
// coat, a skirt, trousers...), the way Ragnarok shows clothes, in the item's colour.
//
// Map letters: "." empty, "o" outline; M m D H the garment's own colour (main, shade, deep shade,
// highlight), which the item's dye sets; the rest are fixed accents (FIXED). Light comes from the
// left. The maps were drawn as left halves and mirrored, with a few one-sided details (the
// adventurer's pauldron and strap).

import { DYES } from "./items";
import type { Dye } from "./recolor";

type Rgb = [number, number, number];

const FIXED: Record<string, Rgb> = {
  o: [30, 26, 36],      // outline
  g: [242, 199, 92],    // gold trim
  G: [184, 134, 46],
  w: [244, 241, 234],   // white
  W: [201, 196, 214],
  k: [42, 39, 51],      // black
  K: [74, 70, 86],
  r: [216, 52, 60],     // red gem
  b: [138, 90, 50],     // leather
  B: [94, 58, 30],
  s: [200, 206, 216],   // steel
  S: [138, 146, 160],
  c: [243, 230, 196],   // cream blouse
  C: [214, 195, 154],
  n: [46, 63, 122],     // the priestess's navy skirt (her dye goes on the tabard)
  N: [31, 43, 86],
};

// A shape's own colour, for items without a dye (hue, saturation, target lightness).
const NATURAL: Record<string, Dye> = {
  "top/mage": DYES.white,
  "bottom/mage": DYES.black,
  "top/priestess": DYES.navy,
  "bottom/priestess": DYES.white,
  "top/adventurer": { hue: 352, sat: 0.55, target: 0.33 },
  "bottom/adventurer": { hue: 140, sat: 0.45, target: 0.3 },
  "top/warrior": { hue: 14, sat: 0.72, target: 0.52 },
  "bottom/warrior": DYES.navy,
};

const MAPS: Record<string, string[]> = {
  "top/mage": [
    "........................",
    ".........oooooo.........",
    "........oHgrrgMo........",
    "....oooooMgkkgMooooo....",
    "...oHHHHHMgwwgMMMMMMo...",
    "..oHMMMMMMgkkgMMMMMMMo..",
    ".oHMMMMoMMgwwgMMoMMMMMo.",
    ".oMMMMmoMMgkkgMMomMMMMo.",
    "oHMMMmmoMMgwwgMMommMMMMo",
    "oMMMmmmoMMgkkgMMommmMMMo",
    "oMMmmmmoMMgwwgMMommmmMMo",
    "ommmmmmomMgkkgMmommmmmmo",
    "oggggggomMgwwgMmoggggggo",
    "oGGGGGGomMgkkgMmoGGGGGGo",
    ".oooooooMMgDDgMMooooooo.",
    ".......oMmgDDgmMo.......",
    "......oMMmgDDgmMMo......",
    "......oMmmgDDgmmMo......",
    "......oMmmgDDgmmMo......",
    "......oggggggggggo......",
    "......oooooooooooo......",
  ],
  "bottom/mage": [
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    ".....oooooooooooooo.....",
    ".....oDDDDDDDDDDDDo.....",
    ".....oggggggggggggo.....",
    "....oHMMMmMMMMmMMMMo....",
    "....oHMMmMMMMMMmMMMo....",
    "...oHMMMmMMMMMMmMMMMo...",
    "...oMMMmMMMMMMMMmMMMo...",
    "..oHMMmMMMmMMmMMMmMMMo..",
    "..oMMmMMMmMMMMmMMMmMMo..",
    ".oHMmMMMmMMMMMMmMMMmMMo.",
    ".oMmMMMmMMMMMMMMmMMMmMo.",
    ".ommmmmmmmmmmmmmmmmmmmo.",
    ".oooooooooooooooooooooo.",
  ],
  "top/priestess": [
    "........................",
    ".........oooooo.........",
    "........owwggwwo........",
    "........owWggWwo........",
    ".....ooooWWwwWWoooo.....",
    "...oowwwwwwwwwwwwwwoo...",
    "..owwwwwwwwwwwwwwwwwwo..",
    ".owwwwwwwwwwwwwwwwwwwwo.",
    ".oWWWWWWWWWWWWWWWWWWWWo.",
    ".ooHMoHMMMMggMMMMMoMMoo.",
    ".oMMMoMMMMMMMMMMMMoMMMo.",
    ".oMMmoMMMMMggMMMMMomMMo.",
    ".oMmmoMMMMMMMMMMMMommMo.",
    ".owwwoMMmMMggMMmMMowwwo.",
    ".oWWWoMMmMMMMMMmMMoWWWo.",
    "..ooooMmmMMMMMMmmMoooo..",
    ".....ommmmmmmmmmmmo.....",
    ".....oooooooooooooo.....",
  ],
  "bottom/priestess": [
    "........................",
    "........................",
    ".....oooooooooooooo.....",
    ".....obbbbbbbbbbbbo.....",
    ".....oBBBBBBBBBBBBo.....",
    ".....onnnoMMMMonnno.....",
    ".....onnnoHMMMonnno.....",
    "....onnnnoMggMonnnno....",
    "....onnnnoggggonnnno....",
    "...onnnnnoMggMonnnnno...",
    "...onnnnnoMMMMonnnnno...",
    "...onnNnnoMMMMonnNnno...",
    "..onnnNnnomMMmonnNnnno..",
    "..onnNnnnomMMmonnnNnno..",
    "..onnNnnnomMMmonnnNnno..",
    ".onnNnnnnommmmonnnnNnno.",
    ".onNnnnnnoooooonnnnnNno.",
    ".onNnnnnnnnnnnnnnnnnNno.",
    ".oNNNNNNNNNNNNNNNNNNNNo.",
    ".oooooooooooooooooooooo.",
  ],
  "top/adventurer": [
    "........................",
    "........................",
    ".........oooooo.........",
    "........occcccco........",
    "..oooooooccccccoooooo...",
    ".oswssoMMMckkcMMMocCco..",
    ".oSsssSoMMkcckMMMoCCcco.",
    ".ooSSSoBMMckkcMMMoCCcco.",
    ".oCCCCoMBMkcckMMMoCCCCo.",
    "..oCCooMMBckkcMMMooCCo..",
    "...oo.oMMmBcckmMMo.oo...",
    "......oMMmcBkcmMMo......",
    "......oMmmkcBkmmMo......",
    "......oMmmckkBmmMo......",
    "......ommmmmmmmmmo......",
    "......obbbbbbbbbbo......",
    "......oBBBBggBBBBo......",
    "......oooooooooooo......",
  ],
  "bottom/adventurer": [
    "........................",
    "........................",
    "........................",
    ".....oooooooooooooo.....",
    ".....obbbbbbbbbbbbo.....",
    ".....oBBgBBBBBBgBBo.....",
    "....oHMoMMoMMoMMoMMo....",
    "....oMMoMMoMMoMMoMMo....",
    "...oHMMoMMoMMoMMoMMMo...",
    "...oMMoMMMoMMoMMMoMMo...",
    "..oHMMoMMoMMMMoMMoMMMo..",
    "..oMMoMMMoMMMMoMMMoMMo..",
    ".oHMMoMMoMMMMMMoMMoMMMo.",
    ".ommmommmommmmommmommmo.",
    ".oooooooooooooooooooooo.",
    "....okkkokkkkkkokkko....",
    "....oKkkokkkkkkokkKo....",
    "....oKkkokkkkkkokkKo....",
    "....oooooooooooooooo....",
  ],
  "top/warrior": [
    "........................",
    "........................",
    "......ooooo..ooooo......",
    ".....owwwwokkowwwwo.....",
    "...oowwWWwokkowWWwwoo...",
    "..oHMMooooMkkMooooMMMo..",
    ".oHMMMMMMMMkkMMMMMMMMMo.",
    ".oMMMMoMMMwkkwMMMoMMMMo.",
    "oHMMMMoMMMMkkMMMMoMMMMMo",
    "oMMMMmoMMMwkkwMMMomMMMMo",
    "oMMMmmoMMMMkkMMMMommMMMo",
    "occccooMMMwkkwMMMoocccco",
    "oCCCCooMMMMkkMMMMooCCCCo",
    ".oooo.oMMMwkkwMMMo.oooo.",
    "......oMmmMkkMmmMo......",
    "......oMmmMkkMmmMo......",
    "......oooooooooooo......",
  ],
  "bottom/warrior": [
    "........................",
    "........................",
    "....oooooooooooooooo....",
    "....oBBBBBBBBBBBBBBo....",
    "....obbbbbbggbbbbbbo....",
    "....oHMMMMMMMMMMMMMo....",
    "....oHMMMMMMMMMMMMMo....",
    "....oMMMMMmoomMMMMMo....",
    "....oMMMMmo..omMMMMo....",
    "....oMMMMmo..omMMMMo....",
    "....oHMMMmo..omMMMMo....",
    "....oMMMMmo..omMMMMo....",
    "....oMMMmmo..ommMMMo....",
    "....oMMMmmo..ommMMMo....",
    "....obbbbbo..obbbbbo....",
    "...obbbbbbo..obbbbbbo...",
    "...oBBBBBBo..oBBBBBBo...",
    "...oooooooo..oooooooo...",
  ],
};

function hsl(h: number, s: number, l: number): Rgb {
  l = Math.max(0, Math.min(1, l));
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

// The garment colours for one hue: main, shade, deep shade, highlight (dark cloth gets smaller steps).
function shades({ hue, sat, target: l = 0.5 }: Dye): Record<string, Rgb> {
  hue ??= 0;
  const dark = l <= 0.3;
  return {
    M: hsl(hue, sat, l),
    m: hsl(hue, sat, l - (dark ? 0.07 : 0.13)),
    D: hsl(hue, sat, l - (dark ? 0.11 : 0.26)),
    H: hsl(hue, sat, Math.min(0.98, l + (l > 0.85 ? 0.06 : 0.12))),
  };
}

// The icon for a top or bottom of `shape` in `dye` (null: the shape's own colour), as a 24 x 24
// canvas; null for a shape without a drawing.
export function garmentIcon(slot: "top" | "bottom", shape: string, dye: string | null): HTMLCanvasElement | null {
  const key = `${slot}/${shape}`, map = MAPS[key];
  if (!map) return null;
  const colours = { ...FIXED, ...shades(dye ? DYES[dye] : NATURAL[key]) };
  const c = document.createElement("canvas");
  c.width = c.height = 24;
  const g = c.getContext("2d")!;
  const img = g.createImageData(24, 24);
  map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const rgb = colours[row[x]];
      if (!rgb) continue;
      img.data.set([...rgb, 255], (y * 24 + x) * 4);
    }
  });
  g.putImageData(img, 0, 0);
  return c;
}

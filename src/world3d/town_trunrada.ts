// ทรุนราดา (Trunrada): a placeholder until the town is laid out. The travel guide stands by the
// way in, so the town can be reached and left.

import { KIT } from "./kits/trunrada";
import { buildPaved } from "./paved";
import { Plan, TownBuilder, useKits, travelGuide } from "./town";
import type { Town } from "./town";

useKits(KIT);

const { P, rect } = new Plan(20, 500, 500);

export function buildTrunrada(quality: { flowers: number }): Town {
  const town = new TownBuilder(1);
  const ground = buildPaved({ area: { x0: -9000, x1: 9000, y0: -9000, y1: 9000 }, roads: [rect(470, 200, 530, 800)], plazas: [rect(400, 420, 600, 580)], base: "steppe" });
  town.put("trunrada:yurt_chief", P(500, 300), 0);
  return town.finish({
    ground,
    sky: "#8fa25a",
    flowers: { box: { x: -6000, y: -6000, w: 12000, h: 12000 }, open: (x, y) => ground.kind(x, y) === 0, density: 0.2 * quality.flowers },
    bounds: { minX: -7000, maxX: 7000, minY: -7000, maxY: 7000 },
    spawn: { x: P(500, 600)[0], y: P(500, 600)[1] },
    npcs: [travelGuide("trunrada", P(540, 600), 180)],
    warps: [],
    closed: [],
    labels: [],
  });
}

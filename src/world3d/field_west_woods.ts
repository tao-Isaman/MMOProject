// A placeholder until this field is built (src/world3d/field.ts): for now a test of the ground
// that rises and falls.
import { FieldBuilder } from "./field";
import type { Town } from "./town";

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(101, {
    hills: [{ x: -2500, y: -2000, r: 1800, h: 160 }, { x: -1800, y: 2600, r: 1400, h: -90 }],
    plateaus: [
      { poly: [[1200, 800], [4400, 600], [4600, 4200], [1500, 4400]], h: 300, ramps: [{ top: [1350, 2400], bottom: [300, 2450], width: 420 }] },
      { poly: [[2600, 2000], [3900, 1900], [4000, 3500], [2700, 3600]], h: 560, ramps: [{ top: [2650, 2800], bottom: [1900, 2800], width: 360 }] },
    ],
    rock: "CliffMoss",
  });
  const R = 5000;
  const ground = f.ground({
    area: { x0: -R - 4000, y0: -R - 4000, x1: R + 4000, y1: R + 4000 },
    roads: [[[-200, -5200], [200, -5200], [400, -1000], [600, 2300], [200, 2700], [-100, 2400], [0, -1000]]],
    plazas: [],
  });
  f.exit("field", [0, -4800], [0, -4100]);
  f.woods({ x0: -R - 4000, x1: R + 4000, y0: -R - 4000, y1: R + 4000 }, ["BigOak", "RoundTree", "SmallTree"], (x, y) => Math.abs(x) < R + 300 && Math.abs(y) < R + 300, { count: 200 });
  for (const [x, y] of [[-2500, -2000], [2000, 1500], [3300, 2700], [-3000, 1000], [-1000, 3500]] as [number, number][]) f.put("flora:BigOak", [x, y], 30);
  f.put("common:gazebo", [3300, 2600], 0);
  f.monsterSpots(ground, { x0: -R + 400, x1: R - 400, y0: -R + 400, y1: R - 400 });
  return f.finishField({
    ground, sky: "#3d5a2a", bounds: { minX: -R, maxX: R, minY: -R, maxY: R }, spawn: { x: 0, y: -4000 },
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0, density: 0.3 * quality.flowers },
    labels: [{ x: 3300, y: 2600, text: "ศาลาบนผา" }],
  });
}

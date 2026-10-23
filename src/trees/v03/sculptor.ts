// The sculptor's branches (third job, from the inventor): stubs until their trees are written. A
// stub (`stub: true`) keeps the job from being offered at its master (progression.ts job3Open), and
// tree_check lets it be. A written branch has seven skills (TREE_SKILLS[3]); the knight
// (src/trees/v03/knight.ts) is the model. What each branch was planned with is noted over it.
import type { Tree } from "../../progression";

export const SCULPTOR_TREES: Record<string, Tree> = {
  // fits: summon (ally: "statue", buff, radius); mace skills
  sculptor_wood: {
    name: "รูปสลักงานไม้", cls: null, job3: "sculptor", stub: true, color: "#d8b080", glyph: "person",
    note: "รูปปั้นไม้เสริมพลังเป็นกลุ่มในพื้นที่ ตีด้วยกระบอง",
    nodes: [],
  },
  // fits: summon (ally: "wall" and "golem")
  sculptor_stone: {
    name: "รูปสลักงานปูน", cls: null, job3: "sculptor", stub: true, color: "#c8c0b0", glyph: "earth",
    note: "สิ่งปลูกสร้างชั่วคราวขวางทาง สิ่งปลูกสร้างมีชีวิตช่วยตีและป้องกัน",
    nodes: [],
  },
};

// The shinobi's branches (third job, from any second job): stubs until their trees are written. A
// stub (`stub: true`) keeps the job from being offered at its master (progression.ts job3Open), and
// tree_check lets it be. A written branch has seven skills (TREE_SKILLS[3]); the knight
// (src/trees/v03/knight.ts) is the model. What each branch was planned with is noted over it.
import type { Tree } from "../../progression";

export const SHINOBI_TREES: Record<string, Tree> = {
  // fits: dash, bolt, stealth and ambush, type "smoke"
  shinobi_spy: {
    name: "นินจาสายลับ", cls: null, job3: "shinobi", stub: true, color: "#8aa0c8", glyph: "eye",
    note: "เคลื่อนที่ ระยะไกล ซ่อนตัว ลอบโจมตี",
    nodes: [],
  },
  // fits: combo, hits, summon (ally: "clone")
  shinobi_combat: {
    name: "นินจาต่อสู้", cls: null, job3: "shinobi", stub: true, color: "#a0b8e0", glyph: "twin",
    note: "มีดและดาบมือเดียว กระบวนท่า เร็ว แยกร่างโจมตี",
    nodes: [],
  },
};

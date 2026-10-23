// The archmage's branches (third job, from the wizard, the battlemage, the inventor or the jester):
// stubs until their trees are written. A stub (`stub: true`) keeps the job from being offered at
// its master (progression.ts job3Open), and tree_check lets it be. A written branch has seven
// skills (TREE_SKILLS[3]); the knight (src/trees/v03/knight.ts) is the model. What each branch was
// planned with is noted over it.
import type { Tree } from "../../progression";

export const ARCHMAGE_TREES: Record<string, Tree> = {
  // fits: blast, storm and nova spells of several elements; combo between elements
  archmage_elements: {
    name: "เวทธาตุขั้นสูง", cls: null, job3: "archmage", stub: true, color: "#a8c0ff", glyph: "burst",
    note: "เวทหลายธาตุ วงกว้าง",
    nodes: [],
  },
  // fits: metal spells; buffs with need { shield: true }; the reflect stat
  archmage_metal: {
    name: "จอมเวทโลหะ", cls: null, job3: "archmage", stub: true, color: "#b8c4d4", glyph: "shield",
    note: "เวทโลหะ ป้องกันสูง บัฟเมื่อถือโล่ สะท้อนการโจมตี",
    nodes: [],
  },
};

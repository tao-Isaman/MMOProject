// The spellblade's branches (third job, from the battlemage, the wizard or the swordsman): stubs
// until their trees are written. A stub (`stub: true`) keeps the job from being offered at its
// master (progression.ts job3Open), and tree_check lets it be. A written branch has seven skills
// (TREE_SKILLS[3]); the knight (src/trees/v03/knight.ts) is the model. What each branch was planned
// with is noted over it.
import type { Tree } from "../../progression";

export const SPELLBLADE_TREES: Record<string, Tree> = {
  // fits: stat "both", element "dark" (and "shadow" after the merge)
  spellblade_rift: {
    name: "ดาบผ่ามิติ", cls: null, job3: "spellblade", stub: true, color: "#b090ff", glyph: "wave",
    note: "ดาบผสานเวท ความมืด ใช้ทั้งพลังโจมตีและพลังเวท",
    nodes: [],
  },
  // fits: enchant buffs, combo chains
  spellblade_runic: {
    name: "ดาบเสริมพลัง", cls: null, job3: "spellblade", stub: true, color: "#a8d8ff", glyph: "sword",
    note: "เวทเสริมดาบ กระบวนท่า เสริมธาตุ ยืดหยุ่น",
    nodes: [],
  },
};

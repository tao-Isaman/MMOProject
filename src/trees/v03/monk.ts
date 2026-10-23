// The monk's branches (third job, from the bishop, the wizard, the battlemage or the thief): stubs
// until their trees are written. A stub (`stub: true`) keeps the job from being offered at its
// master (progression.ts job3Open), and tree_check lets it be. A written branch has seven skills
// (TREE_SKILLS[3]); the knight (src/trees/v03/knight.ts) is the model. What each branch was planned
// with is noted over it.
import type { Tree } from "../../progression";

export const MONK_TREES: Record<string, Tree> = {
  // fits: autocast_<skill>; enchant buffs
  monk_nature: {
    name: "พลังธรรมชาติ", cls: null, job3: "monk", stub: true, color: "#a8e0a0", glyph: "leaf",
    note: "ตีปกติผสานธาตุ ตีแล้วร่ายสกิลเอง",
    nodes: [],
  },
  // fits: hits on cone, nova and dash; combo chains; knuckle skills after the merge
  monk_martial: {
    name: "ศิลปะการต่อสู้", cls: null, job3: "monk", stub: true, color: "#ffc890", glyph: "bash",
    note: "หลายฮิต เสริมสนับมือ แรง ท่าสังหาร",
    nodes: [],
  },
};

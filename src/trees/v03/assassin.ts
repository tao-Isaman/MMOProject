// The assassin's branches (third job, from the ranger, the thief, the swordsman, the warlord or the
// mercenary): stubs until their trees are written. A stub (`stub: true`) keeps the job from being
// offered at its master (progression.ts job3Open), and tree_check lets it be. A written branch has
// seven skills (TREE_SKILLS[3]); the knight (src/trees/v03/knight.ts) is the model. What each
// branch was planned with is noted over it.
import type { Tree } from "../../progression";

export const ASSASSIN_TREES: Record<string, Tree> = {
  // fits: claw skills (need { weapons: ["claw"] } once v03_base is merged); hits, combo
  assassin_blade: {
    name: "นักลอบสังหาร", cls: null, job3: "assassin", stub: true, color: "#a890d8", glyph: "skull",
    note: "เร็ว คริติคอล เสริมกรงเล็บ",
    nodes: [],
  },
  // fits: type "make" turning materials into poison vials (src/poisons.ts); poison, detonate
  assassin_venom: {
    name: "นักวางยาพิษ", cls: null, job3: "assassin", stub: true, color: "#8fdc6a", glyph: "drop",
    note: "โจมตีพิษกายภาพ สร้างยาพิษ เคลือบอาวุธ",
    nodes: [],
  },
  // fits: manaBurn and silence; magicDodge; stat "both" with daggers
  assassin_spell: {
    name: "มือสังหารเวท", cls: null, job3: "assassin", stub: true, color: "#9aa8ff", glyph: "bolt",
    note: "หลบเวท เผามานา โจมตีทั้งเวทและกาย เสริมมีด",
    nodes: [],
  },
};

// The historian's branches (third job, from any second job): stubs until their trees are written. A
// stub (`stub: true`) keeps the job from being offered at its master (progression.ts job3Open), and
// tree_check lets it be. A written branch has seven skills (TREE_SKILLS[3]); the knight
// (src/trees/v03/knight.ts) is the model. What each branch was planned with is noted over it.
import type { Tree } from "../../progression";

export const HISTORIAN_TREES: Record<string, Tree> = {
  // fits: weaken, expose, <race>Dmg stats, drop
  historian_nature: {
    name: "ธรรมชาติวิทยา", cls: null, job3: "historian", stub: true, color: "#a8d890", glyph: "leaf",
    note: "ดีบัฟแรง บัฟตีมอนสเตอร์ตามเผ่า เพิ่มของดรอป",
    nodes: [],
  },
  // fits: terrain on buffs and passives (src/terrain.ts); buyDisc, sellBonus
  historian_archaeo: {
    name: "โบราณคดี", cls: null, job3: "historian", stub: true, color: "#d8c08a", glyph: "scroll",
    note: "บัฟตามภูมิประเทศ ใช้ทั้งพลังโจมตีและพลังเวท ซื้อขายถูก",
    nodes: [],
  },
};

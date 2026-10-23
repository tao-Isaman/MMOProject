// The magician's branches (third job, from any second job): stubs until their trees are written. A
// stub (`stub: true`) keeps the job from being offered at its master (progression.ts job3Open), and
// tree_check lets it be. A written branch has seven skills (TREE_SKILLS[3]); the knight
// (src/trees/v03/knight.ts) is the model. What each branch was planned with is noted over it.
import type { Tree } from "../../progression";

export const MAGICIAN_TREES: Record<string, Tree> = {
  // fits: dice, roll, luck
  magician_gambler: {
    name: "นักเสี่ยงดวง", cls: null, job3: "magician", stub: true, color: "#ffe08a", glyph: "coin",
    note: "ใช้ทั้งพลังโจมตีและพลังเวท ทอยเต๋า โยนเหรียญ เสริมโชค",
    nodes: [],
  },
  // fits: type "mimic"; dash
  magician_copycat: {
    name: "นักก๊อปปี้", cls: null, job3: "magician", stub: true, color: "#ffa8e0", glyph: "eye",
    note: "ก๊อปสกิลมอนสเตอร์ สกิลเคลื่อนที่ ใช้ทั้งพลังโจมตีและพลังเวท",
    nodes: [],
  },
  // fits: decoy, summon (ally: "clone"), type "smoke", stealth
  magician_illusion: {
    name: "นักหลอกล่อ", cls: null, job3: "magician", stub: true, color: "#c8a8ff", glyph: "cloud",
    note: "ร่างปลอม ซ่อนตัว ควันซ่อนตัวกลุ่ม ใช้ทั้งพลังโจมตีและพลังเวท",
    nodes: [],
  },
};

// The hunter's branches (third job, from the ranger, the thief, the jester or the mercenary): stubs
// until their trees are written. A stub (`stub: true`) keeps the job from being offered at its
// master (progression.ts job3Open), and tree_check lets it be. A written branch has seven skills
// (TREE_SKILLS[3]); the knight (src/trees/v03/knight.ts) is the model. What each branch was planned
// with is noted over it.
import type { Tree } from "../../progression";

export const HUNTER_TREES: Record<string, Tree> = {
  // fits: bow skills on one target; slow, freeze, stun riders
  hunter_bow: {
    name: "ธนูนักล่า", cls: null, job3: "hunter", stub: true, color: "#c8e08a", glyph: "arrow",
    note: "ธนูแรง ยิงเป้าเดี่ยว ดีบัฟให้ศัตรูเคลื่อนที่ช้าลงหรือหยุดนิ่ง",
    nodes: [],
  },
  // fits: summon (ally: "wolf", count 2-3); autocast of a wolf skill on normal hits
  hunter_beast: {
    name: "สัตว์ล่าเหยื่อ", cls: null, job3: "hunter", stub: true, color: "#d0b080", glyph: "paw",
    note: "ออกล่ากับหมาป่า หมาป่าตามตัวและกัดตัวที่เราตี ตีปกติแล้วหมาป่าช่วยตี",
    nodes: [],
  },
};

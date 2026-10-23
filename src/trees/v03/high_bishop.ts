// The high bishop's branches (third job, from the bishop): stubs until their trees are written. A
// stub (`stub: true`) keeps the job from being offered at its master (progression.ts job3Open), and
// tree_check lets it be. A written branch has seven skills (TREE_SKILLS[3]); the knight
// (src/trees/v03/knight.ts) is the model. What each branch was planned with is noted over it.
import type { Tree } from "../../progression";

export const HIGH_BISHOP_TREES: Record<string, Tree> = {
  // fits: long buffs (120-180 s), enchant: "light", weaken and expose
  hbishop_blessing: {
    name: "พรศักดิ์สิทธิ์", cls: null, job3: "high_bishop", stub: true, color: "#fff0b0", glyph: "up",
    note: "บัฟ อาวุธธาตุแสง ดีบัฟมอนสเตอร์ ป้องกันทีม โจมตีน้อย",
    nodes: [],
  },
  // fits: heal; light spells
  hbishop_renewal: {
    name: "พรฟื้นพลัง", cls: null, job3: "high_bishop", stub: true, color: "#fff8d0", glyph: "heal",
    note: "ฮีลแรง ฮีลหมู่ โจมตีแสงเยอะ",
    nodes: [],
  },
  // fits: autocast_<skill> on mace passives or buffs; vs: { undead, demon }
  hbishop_exorcist: {
    name: "นักล่าปีศาจ", cls: null, job3: "high_bishop", stub: true, color: "#ffe08a", glyph: "cross",
    note: "ตีปกติด้วยกระบอง ตีแล้วร่ายสกิลเอง เก่งกับอันเดดและปีศาจ",
    nodes: [],
  },
};

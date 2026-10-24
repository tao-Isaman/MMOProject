// v0.5's trees (docs/v05_jobs.md): the fourth jobs' branches and the merchant's, one file a job,
// and the new skill books. A branch not written yet is a stub here (its job isn't offered until
// none of its branches is); a job's file overrides its stubs as its trees are written.
import type { Tree } from "../../progression";
import { HIGH_KNIGHT_TREES } from "./high_knight";
import { SNIPER_TREES } from "./sniper";
import { WARLOCK_TREES } from "./warlock";
import { DRUID_TREES } from "./druid";
import { SLAYER_TREES } from "./slayer";
import { ROYAL_GUARD_TREES } from "./royal_guard";
import { ALCHEMIST_TREES } from "./alchemist";
import { WUXIA_TREES } from "./wuxia";
import { VIKING_TREES } from "./viking";
import { SAMURAI_TREES } from "./samurai";
import { SHAMAN_TREES } from "./shaman";
import { MERCHANT_TREES } from "./merchant";
import { V05_BOOK_TREES } from "./books";

const stub = (name: string, who: Pick<Tree, "job" | "job4">, glyph: string, color: string): Tree =>
  ({ name, cls: null, ...who, stub: true, color, glyph, note: "กำลังเขียน", nodes: [] });

const STUBS: Record<string, Tree> = {
  high_knight_lance: stub("หอกบุทะลวง", { job4: "high_knight" }, "pierce", "#c0d4ff"),
  high_knight_arms: stub("เทพศาสตรา", { job4: "high_knight" }, "sword", "#ffe0a8"),
  sniper_gun: stub("สายปืน", { job4: "sniper" }, "target", "#d0d8b0"),
  sniper_bow: stub("สายธนู", { job4: "sniper" }, "arrow", "#b8d090"),
  warlock_invoker: stub("เจ้าแห่งพลังธาตุ", { job4: "warlock" }, "swirl", "#a8b8ff"),
  warlock_curse: stub("พ่อมดคำสาป", { job4: "warlock" }, "skull", "#a080c0"),
  druid_nature: stub("พลังธรรมชาติ", { job4: "druid" }, "leaf", "#90d080"),
  druid_wild: stub("พลังสัตว์ป่า", { job4: "druid" }, "paw", "#c8a878"),
  slayer_dagger: stub("สายมีด", { job4: "slayer" }, "pierce", "#c8a8e8"),
  slayer_claw: stub("สายกรงเล็บ", { job4: "slayer" }, "twin", "#9878c8"),
  royal_guard_shield: stub("ทหารคุ้มกัน", { job4: "royal_guard" }, "shield", "#e8d090"),
  royal_guard_hunt: stub("ทหารไล่ล่า", { job4: "royal_guard" }, "target", "#e8a070"),
  royal_guard_strike: stub("ทหารจู่โจม", { job4: "royal_guard" }, "arrow", "#d8b880"),
  alchemist_homunculus: stub("ชีวิตประดิษฐ์", { job4: "alchemist" }, "heart", "#90e0d0"),
  alchemist_bomb: stub("ระเบิดทำลายล้าง", { job4: "alchemist" }, "burst", "#e8a060"),
  alchemist_synth: stub("ธาตุสังเคราะห์", { job4: "alchemist" }, "drop", "#a0c8e8"),
  wuxia_sword: stub("กระบี่พเนจร", { job4: "wuxia" }, "sword", "#f0c890"),
  wuxia_fist: stub("ต่อสู้มือเปล่า", { job4: "wuxia" }, "bash", "#f0a070"),
  viking_axe: stub("สายขวาน", { job4: "viking" }, "rage", "#d8a888"),
  viking_mace: stub("สายกระบอง", { job4: "viking" }, "slam", "#b8b0a0"),
  samurai_blade: stub("ทะลวงฟัน", { job4: "samurai" }, "sword", "#f0a0a0"),
  samurai_vanguard: stub("ปะทะแนวหน้า", { job4: "samurai" }, "shield", "#d8b0b0"),
  samurai_ranged: stub("ต่อสู้ยืดหยุ่น", { job4: "samurai" }, "arrow", "#e8c0a0"),
  shaman_consecrate: stub("ปลุกเสก", { job4: "shaman" }, "cross", "#e0c8a0"),
  shaman_summon: stub("อัญเชิญ", { job4: "shaman" }, "cloud", "#a890c8"),
  merchant_trade: stub("ค้าขาย", { job: "merchant" }, "coin", "#e8c36a"),
  merchant_cart: stub("เกวียนสินค้า", { job: "merchant" }, "bag", "#c8a070"),
};

export const V05_TREES: Record<string, Tree> = {
  ...STUBS, ...HIGH_KNIGHT_TREES, ...SNIPER_TREES, ...WARLOCK_TREES, ...DRUID_TREES, ...SLAYER_TREES, ...ROYAL_GUARD_TREES, ...ALCHEMIST_TREES, ...WUXIA_TREES, ...VIKING_TREES, ...SAMURAI_TREES, ...SHAMAN_TREES, ...MERCHANT_TREES, ...V05_BOOK_TREES,
};

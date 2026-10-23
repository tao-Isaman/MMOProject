// The third jobs' branches (docs/v03_jobs.md), one file a job, merged into TREES like the second
// jobs' (progression.ts). A job is offered at its master once none of its branches is a stub.
import type { Tree } from "../../progression";
import { KNIGHT_TREES } from "./knight";
import { HUNTER_TREES } from "./hunter";
import { ARCHMAGE_TREES } from "./archmage";
import { ASSASSIN_TREES } from "./assassin";
import { HIGH_BISHOP_TREES } from "./high_bishop";
import { MONK_TREES } from "./monk";
import { SPELLBLADE_TREES } from "./spellblade";
import { SCULPTOR_TREES } from "./sculptor";
import { MAGICIAN_TREES } from "./magician";
import { HISTORIAN_TREES } from "./historian";
import { SHINOBI_TREES } from "./shinobi";

export const V03_JOB_TREES: Record<string, Tree> = {
  ...KNIGHT_TREES, ...HUNTER_TREES, ...ARCHMAGE_TREES, ...ASSASSIN_TREES, ...HIGH_BISHOP_TREES, ...MONK_TREES,
  ...SPELLBLADE_TREES, ...SCULPTOR_TREES, ...MAGICIAN_TREES, ...HISTORIAN_TREES, ...SHINOBI_TREES,
};

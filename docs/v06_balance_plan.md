# v0.6 balance: more passives per branch, longer buffs and debuffs

Request (user, 2026-10-26): rework balance for every class. Every class should have at least 2 passive
skills, with more passives the higher the class. Also make buffs and debuffs last longer for every class.
The user didn't pick options, so the recommended defaults below were used.

## Decisions
| | |
|---|---|
| Passives per branch (minimum) | base class tree **2**, 2nd job branch **3**, 3rd job **4**, 4th job **5** (`TREE_PASSIVES` in `src/progression.ts`) |
| How | **add new passive nodes**. Never remove, rename or retype an existing node (players' saved ranks and hotbars point at node ids). |
| Buff durations | **×1.5**: `duration` of `buff` and `shield` skills, and of `form` (default 60 → 90) |
| Soft debuffs | **×1.5**: `debuff` (weaken/expose; runtime default 6 → 9), `slow`, `blind`, `silence` (default 3 → 4.5) |
| Not changed | `stun`, `freeze` (hard crowd control), poison (its damage is spread over 4 s; longer means weaker per second), summon/trap/smoke/decoy/mimic lifetimes, cooldowns, MP |

Survey on 2026-10-26: 87 trees are below the minimum (12 base, 25 second-job, 26 third-job, 25 fourth-job
branches). Books (tier 0) already have 3–9 passives, so they get only the duration change.

## Rules for the new passives
- **Use only stats and fields that already exist.** That means `StatBag` keys from `STAT_NAMES` in
  `progression.ts` (e.g. atkPct, matkPct, maxHpPct, defPct, mdefPct, crit, critDmg, aspd, move, cdr,
  castRed, hpRegen, mpRegen, luck, dmgRed, statusRes, element atk/def, race damage like undeadDmg,
  autocast_<id>, doubleHit, counter, allyPct, lowHpDmg, poisonPct …), `need`, and `terrain`. **No new runtime
  mechanics, and no edits to skills.ts/hero.ts/combat.ts** (other agents work in parallel; shared runtime
  files are off limits except for the core agent).
- Fit the branch's theme and weapon. If the branch's actives need a weapon, give the passive the same `need`
  where it makes sense.
- **Strength:** modest, judged against the existing passives of the same tier. One new passive at max
  rank should be worth about one existing passive of that tier, not more. A branch must not become more
  than ~10–15% stronger overall. Prefer utility and sustain (regen, cdr, castRed, statusRes, move, mp) and
  conditional bonuses over raw damage percent where the branch is already a damage branch.
- `max` 5 or 10. Thai `name` and `desc` in the same voice as the file, and the desc numbers must come from
  the same expressions as `stats`. `glyph` must be one icons.ts can draw (tree_check reports unknown ones).
  New skill icon art isn't needed: a missing `assets/skills/<id>.png` falls back to the glyph.
- `id`: unique across the whole game, prefixed with the tree id (e.g. `druid_nature_moss`).
- `pos`: a free spot on the 4×4 grid. `req` (optional) to a node on a higher row (smaller row index) with
  a reachable rank. Keep the tree readable: a passive under its theme's line.
- Update the file's header comment where it says how many skills a branch has.

## Rules for durations
- Multiply by 1.5. Buffs round to whole seconds (8 → 12, 15 → 22.5 → 23, 180 → 270); debuffs to 0.1 s.
  For ByRank values (`slow: lin(1, 0.1)`), scale both terms (`lin(1.5, 0.15)`).
- **Every desc that states a duration must change with it.** Many descs hardcode "20 วิ" or compute from
  the same `lin()`. Search each file for `วิ` after the change and check every match.
- Don't touch `stun`/`freeze`/poison/summon/trap/smoke/mimic/decoy durations, `cd`, or `cast`.

## Split (parallel agents, one git worktree each, files owned exclusively)
| Agent | Files | Trees to bring up to the minimum |
|---|---|---|
| core | `src/progression.ts` (base class trees, mastery/element reward skills), runtime defaults in `src/skills.ts`/`src/hero.ts`/`src/combat.ts` (debuff 6→9, silence 3→4.5, form 60→90, any other buff/debuff default) | 12 base class trees |
| job2-a | `src/trees/battlemage.ts`, `blades.ts`, `casters.ts`, `ranger.ts` | their second-job branches |
| job2-b | `src/trees/v02jobs.ts`, `src/trees/v05/merchant.ts`, plus durations only in `src/trees/books.ts`, `src/trees/v05/books.ts` | their second-job branches |
| job3-a | `src/trees/v03/knight.ts`, `hunter.ts`, `archmage.ts`, `assassin.ts`, `high_bishop.ts`, `monk.ts` | their branches |
| job3-b | `src/trees/v03/spellblade.ts`, `sculptor.ts`, `magician.ts`, `historian.ts`, `shinobi.ts` | their branches |
| job4-a | `src/trees/v05/high_knight.ts`, `sniper.ts`, `warlock.ts`, `druid.ts`, `slayer.ts`, `royal_guard.ts` | their branches |
| job4-b | `src/trees/v05/alchemist.ts`, `wuxia.ts`, `viking.ts`, `samurai.ts`, `shaman.ts` | their branches |

Nobody edits `README.md`. Each agent reports a table of its new passives (tree, id, name, max, effect at max).
After the merge, the coordinator updates the README tree tables plus a v0.6 note.

## Done when
- `node tools/tree_check.cjs` reports 0 problems on the merged tree, and `npm run typecheck` and `npm run build` pass.
- A survey shows every tier at or above its minimum, and buff/debuff durations ×1.5.
- An independent review of the merged diff finds no balance outliers or desc/number mismatches.

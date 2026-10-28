# Monster stats: every monster has its own strength (จุดเด่นของมอนสเตอร์)

Request (user, 2026-10-27): every monster should have different stats by nature. Some hit hard, some are
fast, some are tough, some cast spells, some dodge well, some are accurate, some crit often. Each monster
has its own signature so the player has to find a way to deal with it.

Design change (user, same day): **no trait system.** The first draft of this plan had a `traits` axis
(brute/swift/... tags with a multiplier table). The user asked for the differences to go straight into each
monster's stats instead, so there are no trait names, no trait table and no trait tags anywhere. What follows
is the design that was built.

## What existed before
- `MonsterDef.kind` (normal/tank/fast/caster/rare/boss) in `src/bestiary.ts` gives hp/atk/def/mdef/xp
  multipliers (`KIND`, `statsFor`) and walk speed / spawn weight / respawn (`KINDS` in `src/monsters.ts`).
  All 38 "fast" monsters had identical numbers. Same for the other kinds.
- `accuracy`, `flee`, `crit` came from level only (`10+1.4L`, `2+1.5L`, `0.03+0.0002L`). Only the `dodge`
  behaviour changed flee (x1.6).
- Crit damage was fixed (`MONSTER_CRIT_DMG` 0.5) and so was the bite interval (`BITE_TIME` 1.6 s, shots x1.4).

## Design: each monster's own `stats`
`kind` stays as it is (spawn weight, respawn, drops, xp, boss/rare rules). Every `MonsterDef` in `MONSTERS`
now carries its own `stats: StatProfile`, written on the entry itself:

| field | meaning |
|---|---|
| `hp`, `atk`, `def`, `mdef` | multiplier of what its level and kind give it |
| `speed`, `biteTime` | multiplier of its kind's walk speed / of the time between bites |
| `accuracy`, `flee` | **points added** to its level's accuracy / evasion (a multiplier blew past the hit-chance floor and ceiling at high levels, so these are flat points picked per monster for its level) |
| `crit` | its crit chance itself (cap 0.35) |
| `critDmg` | its extra crit damage itself (default 0.5) |
| `magical` | its bite is a spell: turned by the player's magic defence, dodged by smoke |

`statsFor(level, kind, stats = {})` folds it in and returns hp/atk/def/mdef/xp plus accuracy, flee, crit,
critDmg, speed (multiplier), biteTime (multiplier), magical. Old two-argument callers still work.

Every monster's numbers were picked by hand from its `look`, `behave`, `element`, `size` and `kind`, always
with a cost: a hard hitter swings slower, a quick one has less HP and a weaker bite, a tough one hits softer
and walks slower, a magic one has thinner armour, a slippery one has less HP and armour, an accurate or
crit-heavy one hits a little softer. Rare monsters mix two strengths, bosses three. A monster with the `dodge`
behaviour is already hard to hit, so its numbers give it a second strength instead (the tanuki's trick is
magic, the panther crits).

The slimes in `VARIANTS` have explicit numbers too: green plain, pink slippery (evasion, a little less HP),
blue tough (armour, softer bite), violet crit-heavy (crit 13%, crit damage +80%).

## What stands out (derived from the numbers, never stored)
`standouts(stats, dodge)` in `bestiary.ts` reads a build: strong (atk >= 1.2), fast (speed >= 1.15 or
biteTime <= 0.85), tough (hp >= 1.2 or def >= 1.3), magic (`magical` or mdef >= 1.35), evasive (flee >= +8 or
`dodge`), accurate (accuracy >= +8), crit (crit >= 0.10). The codex shows each one as a plain-language note
with its counter:

| Stands out | Player answers with |
|---|---|
| strong | defence, shields, `dmgRed`, kiting, weaken debuff |
| fast | slows, stuns, snares, ranged damage while it closes in |
| tough | armour piercing, element weakness, poison/burn |
| magic | magic defence, `magicDodge` (smoke), silence, physical damage |
| evasive | accuracy, spells (always hit), area skills, stuns |
| accurate | evasion is useless: stack defence/HP/shields instead |
| crit | luck (monster crit is divided by `luckFactor`), HP/shields for the spikes |

## Power budget (monsters must not all get stronger)
- Rating = damage it deals a reference player x how long it lasts against her, relative to the same
  level/kind with no build (and the same behaviours). Target 0.9-1.15, error outside 0.8-1.3. Result: all
  161 between 0.90 and 1.15, mean 1.01.
- Clamps (relative to the kind-only value, in `CLAMP`): hp <= 2.2, atk <= 1.5, def <= 2.0, speed <= 1.45.
- Walk speed is held at `330 / CHASE_PACE` (220 cm/s), so a chase never beats 330 cm/s (player: 380).
- Bites never come quicker than 1.0 s (`MIN_BITE`).
- XP, drops, spawn weights, respawn times and levels are unchanged.
- Reference players come from the game's own tables: attacker = warrior with no gear (half physical, half
  spells); plain defender = warrior; evasive defender = archer turned thief with the feather hat and swift
  shoes. An evasive build must leave the attacker >= 15% hit chance; an accurate build must never hit the
  evasive defender 100% of the time.

## Code
1. `src/bestiary.ts`: `StatProfile`, `MonsterDef.stats`, `statsFor(level, kind, stats)`, `baseAim`, `CLAMP`,
   `MAX_CRIT`, `standouts`; every one of the 161 entries has its own `stats`.
2. `src/monsters.ts`: `Variant.critDmg/speedMul/biteMul/magical`; `variantOf` fills them (dodge or build
   evasion, whichever is more); `walkSpeed()` (kind x build, capped, slower for a shambler); bite interval x
   `biteMul` (min 1 s); `magical` also true for a magic build; the slimes' explicit numbers.
3. `src/stats.ts` `monsterDamage`: optional `critDmg` on the monster (default `MONSTER_CRIT_DMG`).
4. `src/codex.ts`: accuracy / evasion / crit % / speed / bite interval next to the existing numbers, and a
   "จุดเด่น" line from `standouts` with the counters (slimes too).
5. `tools/monster_trait_check.cjs`: strength counts (each >= 8), rare >= 2 / boss >= 3, field spread (5+
   monsters: >= 3 strengths; no two of one kind built alike in a field), the rating table, clamps, speed and
   bite limits, and the hit-chance table at levels 10/50/100/200. Exits 1 on a broken rule.
   `--all` lists every monster; `--try <level> <kind> '<json>'` weighs a build without editing the bestiary.

## Not in scope
- No new skills, items, saves or UI windows. No changes to `combat.ts`, `skills.ts`, `hero.ts`, `main.ts`.

## Verify
- `npx tsc --noEmit` and `npm run build` pass.
- `node tools/monster_trait_check.cjs` exits 0.
- Spot check in the codex that a fast/tank/caster monster each show different numbers and a "จุดเด่น" line.

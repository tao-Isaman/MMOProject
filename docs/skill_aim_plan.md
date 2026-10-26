# Plan: skill aim mode (click skill → aim cursor → pick target / area)

Request (user, 2026-10-26): "use a skill: click the skill first, then the cursor changes to aim mode, then select
the area or target to use it on; if the skill is AOE it shows the size of the area."

## Today (src/main.ts ~1215–1253, 1427, 1846; src/skills.ts singleTarget/groundTarget; world3d/view.ts setAim)
- Only **ground** skills (`groundTarget`: blast, trap, ranged summon/smoke) aim first: a disc of `radius` under
  the mouse clamped to `range`; left click / same key casts, right click / Esc cancels.
- Every other skill fires **instantly** at the mouse point / current target / nearest monster.
- Cursor never changes. No range indicator. No shape preview for cones, beams, fans, novas.
- Touch (`isTouch()`) has its own flow (src/touch.ts) — **leave touch unchanged**.

## New behaviour (mouse/keyboard only)

Pressing a skill key (1–0) or clicking its hotbar slot enters **aim mode** for every skill that needs a place,
direction or target. Aim kind is decided from the cast skill (`castSkill(id)`, so invoke spells and the mimic
copy aim as what they will fire):

| kind | skills | preview while aiming | confirm (left click, or the same key again) |
|---|---|---|---|
| `target` | `singleTarget(s)`: bolt without pierce, narrow cone (arc ≤ 50), falcon, mimic (and the mimic's copy) | dashed **range ring** round the player (bolt `range`, cone `reach`); monster under the cursor gets a hover ring (red if out of range, gold if in range) | click a monster → it becomes `player.target` and the skill is used on it. Out of range → walk toward it and cast when in range (cancelled by any other move/click/skill, or if it dies). Click on empty ground → stay aiming, small hint "เลือกเป้าหมาย". Same key again → monster under cursor, else current live target, else nearest in range, else deny. |
| `ground` | `groundTarget(s)` (as today) | disc of `radius` at the cursor clamped to `range` (as today) **plus** the range ring | cast at the spot (as today) |
| `direction` | wide cone, beam, fan, bolt with pierce, dash | shape from the player toward the cursor: cone/fan **sector** (`reach`/`range`, `arc`/`spread`), beam **rectangle** (`length` × `width`), dash **line + landing disc** (`distance`, `width`) | cast toward the cursor |
| `self` | nova, storm (round the caster) | circle of `radius` round the player that follows them | left click anywhere / same key → cast |
| `instant` | everything else (heal, shield, buff, orb, form, make, flower, summon/smoke without range, stall …) | none | fires immediately as today |

Common rules
- **Cursor**: the canvas gets a class per kind (`aim-target`, `aim-area`) with a custom crosshair cursor
  (inline SVG data-URI in `style.css`, hotspot centred; fallback `crosshair`). While aiming a `target` skill and
  hovering a monster, a "locked" variant (red/gold). Restored on exit.
- **Hotbar**: the slot being aimed shows an "aiming" highlight (CSS class through `hud`), removed on exit.
- **Validation before entering aim**: `skills.why(id)` (cooldown, MP, weapon need…) → deny as today, don't aim.
  Re-check at confirm (MP may have changed).
- **Cancel**: right click (without dragging the camera — a right-button drag still turns the camera and should
  NOT cancel; cancel only on a right click released without movement), Esc (already first in the Esc chain),
  pressing a different skill key (switches to that skill's aim), death, map change, opening the talk dialog.
  Walking with WASD keeps aiming. Clicking on UI windows doesn't confirm (only canvas pointerdown confirms).
- AOE size shown is the real hit size: use the same numbers `noticed()`/`effect()` use (radius, reach, arc,
  length, width, spread, distance) including defaults (`?? 200`, `?? 150`, `?? 500`…), so the preview matches what
  gets hit. Colour from the skill's `color` (fallback `#ffd27a`), translucent fill + brighter outline.
- Shapes are ground decals following the terrain (`heightAt`), like `setAim`/`setArea` in `world3d/view.ts`.
  Add to view.ts a reusable marker API, e.g. `setRangeRing(at, r, color)`, `setAimShape(shape | null)` where
  shape = `{kind:"circle"|"sector"|"rect", x, y, dirX, dirY, r, arc?, len?, width?, color}`; one mesh updated in
  place per frame (no per-frame allocation of new geometries/materials).
- The bot (`bot.ts`) and touch keep calling `skills.use` directly — unaffected.
- Keep `skills.use(id, aim)` semantics; the target kind passes the chosen monster's position as `aim` with
  `player.target` set so `lockFor` picks it.

## Files
- `src/main.ts`: replace the `aiming` block with an aim controller (kind, slot, id, pending walk-to-cast); hook
  pointerdown/contextmenu/keys/Esc; draw previews in the frame where `setAim` is called now.
  Prefer a new module `src/aim.ts` for the kind classification + preview-shape computation (pure functions) so
  main.ts only wires it. `aimKind(s: SkillDef): "target"|"ground"|"direction"|"self"|"instant"` next to
  `singleTarget`/`groundTarget` in skills.ts or in aim.ts.
- `src/world3d/view.ts`: range ring + shape decal + hover ring.
- `src/hud.ts`: aiming highlight on a slot.
- `style.css`: cursors, slot highlight.
- `README.md`: update the controls rows (line ~24, skill keys) to describe aim mode per kind.

## Verification
1. `npm run typecheck` and `npm run build` clean.
2. Browser check with Playwright (`D:\MMOProject\e2e`, see `drive.mjs`/`peek.mjs` for how the game is driven):
   dev server, create/enter a character, put one skill of each kind on the bar (force via save/localStorage or a
   debug hook if needed — don't ship debug hooks), press the key, move the mouse, screenshot each preview
   (target ring + hover, ground disc + range, cone/beam sector, nova circle), confirm a cast, test right-click and
   Esc cancel. Look at the screenshots.
3. Independent review, then commit on the current branch and push (user asked to push).

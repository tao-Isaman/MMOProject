# Plan: items on the skill bar, drag to rearrange, 2-row bar, mobile action buttons, rest

Request (user, 2026-10-26, Thai): usable items can be put on the skill bar and used from it; skills and items
on the bar can be moved between slots; make the bar's slots smaller and give it 2 rows; on mobile put the
skills in rows like that, and keep only the important action buttons on the right (normal attack, rest).

## Desktop bar
- **20 slots in 2 rows of 10**, smaller than today's 54 px (about 40–44 px, still readable: key label, icon,
  cooldown sweep, count). Row 1 keys `1`–`0` (as now), row 2 **Shift+`1`–`0`** (label "⇧1"…). Clicking a slot
  works as now. The aim mode (src/aim.ts, main.ts `useSlot`) works for any slot.
- The bar stays bottom-centre; check it doesn't collide with the menu buttons at the bottom right or the
  minimap, at 1366×768 and smaller windows.

## Items on the bar
- A slot holds either a skill id (as today) or an item: `"item:<id>"` (or a cleaner typed shape, your choice,
  but saves must round-trip). `Progress.hotbar` grows to 20; old saves (10 entries) load into the first row;
  unknown ids and items that no longer exist are dropped (see `Progress.load` hotbar filter).
- What can go on: items the bag already lets you **use** (drink a potion, read a book or hairstyle book, coat
  with a poison vial… — find the existing "use" path in the inventory UI, double-click / the item menu, and
  call that same function; don't duplicate logic). Gear (wearables) can't go on the bar.
- On the bar an item shows its icon and the count in the bag (bottom-right, like the bag's count); with 0 left
  it stays on the bar dimmed (RO-style) and pressing it says "ไม่มี<ชื่อ>เหลือ". Pressing it uses one, with the
  same sounds/effects as using it from the bag. Respect any existing potion cooldown/limits.
- The bot keeps its own potion logic; nothing else about the bot changes.

## Moving things onto / around the bar
- Drag a skill from the skill window onto a slot (if that already exists, keep it; also keep the "ใส่แถบสกิล"
  button); drag an item from the bag onto a slot (the item stays in the bag — the slot is a shortcut).
- Drag a slot onto another slot: swap them. Drag a slot off the bar: clear it (and keep right-click clear if
  that exists today). Pointer events so it works with mouse; the slot click still uses it when not dragged
  (a few px threshold).
- Persist on every change (as the hotbar saves today).

## Rest (พักฟื้น) — new player action
- Desktop key **X** (check it's free) and a button on mobile. Toggles sitting: while sitting she stays still
  and regenerates much faster (reuse the bot's rest rate: `hero.addBuff("bot_rest" …)` in src/bot.ts ~312 — make
  a shared helper so the bot and the player use the same thing), shown as a buff "พักฟื้น" and a sitting pose if
  the character art has one (else just stop; no new art needed).
- Stands up on: moving, attacking, using a skill or item that isn't a potion, taking damage, opening the
  talk window, map change. Can't sit while a monster is chasing her (angry and near): say "มีศัตรูอยู่ใกล้ ๆ".

## Mobile / touch (src/touch.ts, body.touch in style.css)
- Skills: in rows like the desktop bar (2 rows of 10, or 2×5 if it fits better on a landscape phone — your call,
  explain it), placed where it doesn't block the joystick (left 38%) or the right-side buttons. Tapping a slot
  uses it exactly as the current touch skill slots do (lock the target/nearest in 9 m, etc.).
- Right side: only the important action buttons — **normal attack** (the sword button, as now), **rest**,
  and the **red / blue potion** quick buttons (they already exist). Remove the ring of skill slots around the
  sword button.
- Long-press on a slot doesn't clear it (as now). Drag-to-rearrange on touch is optional; if it's easy with the
  same pointer code, keep it.

## Docs and checks
- README controls tables (desktop and mobile) updated in Thai.
- `npx tsc --noEmit`, `npx vite build`, `node tools/tree_check.cjs` pass.
- Playwright (D:\MMOProject\e2e, see `e2e/heights/lib.mjs`, `window.__game`): desktop 1366×768 — bar with 2
  rows; put a red potion on a slot by dragging from the bag, press its key, HP goes up and the count drops;
  drag a skill to another slot (swap); Shift+1 uses row 2; X sits and regenerates, moving stands up. Touch
  emulation (a landscape phone, e.g. 844×390, `hasTouch`, `isMobile`): screenshot the layout; tap a skill slot,
  tap attack, rest, potion. Screenshots in `D:\MMOProject\e2e\hotbar\`. Stop the dev server after.

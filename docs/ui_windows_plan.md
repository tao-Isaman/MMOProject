# UI windows plan: Ragnarok-style window manager (v0.6 UI)

> Goal: make the in-game windows behave like a classic MMO client (Ragnarok Online standard).
> Windows must be freely movable, remember where they were, stack sensibly, never pile up on one
> spot, and hold big content (skills, codex, quests, inventory) without the title bar scrolling
> away. Desktop only: phones keep the one-sheet-at-a-time behaviour.

Skill reference used: `.claude/skills/game-ui-ux/SKILL.md` (anchors not absolute pixels, screen
stack, safe area, event-driven updates) and `.claude/skills/rpg/SKILL.md`.

## 1. What exists today (survey, 25 Oct 2026)

All windows are plain DOM panels built by `makeWindow(id, title, key)` in `src/ui.ts`:

| id | file | content size | own scroll area |
|---|---|---|---|
| inventory | src/ui.ts | medium | `.inv-grid` max-height 346px |
| status | src/charui.ts | medium | none (whole window scrolls) |
| settings | src/charui.ts | small | none |
| skills | src/charui.ts | **big** (tabs: trees / mastery / elements) | `.sk-body` max-height min(70vh, 640px) |
| bot | src/botui.ts | medium | none |
| quests | src/questui.ts | **big** (tabs) | none |
| codex | src/codex.ts | **big** (tabs + search) | `.cx-list` max-height min(66vh, 600px) |
| map | src/mapui.ts | canvas, fits itself | none, `overflow: visible` |
| shop | src/shop.ts | big list | `.shop-list` max-height min(60vh, 520px) |
| workshop | src/workshop.ts | medium | `.shop-list` |
| stall | src/stall.ts | medium | `.shop-list` |

Problems found:

1. **Every window opens on the same spot.** `.window` defaults to `top: 70px; right: 24px`. Only
   `#status` (left) and `#map` (centred) differ. Open skills + quests + codex and they sit exactly
   on top of each other.
2. **No click-to-front.** All windows share `z-index: 5`; DOM order decides who is on top. A
   window behind another cannot be raised except by closing the front one.
3. **Positions are forgotten.** Drag works (title bar, pointer capture) but the position lives
   only in inline style. Reload, or switch character, and everything resets.
4. **Nothing clamps on browser resize.** A window dragged to the right edge is lost off-screen
   after the browser shrinks. Only `mapui.ts` listens to `resize`.
5. **Title bar scrolls away.** `.window` itself has `overflow: auto` with `max-height:
   calc(100vh - 150px)`. On tall content (status, quests, bot) the header and close button scroll
   out of view. Skills and codex avoid it only because they cap an inner list.
6. **Esc closes all windows at once** (`src/main.ts` ~line 1335). RO closes the top one.
7. **No collapse, no resize, no size memory.** Big-content windows have hard-coded inner heights
   (`min(70vh, 640px)` etc.), so a 4K user gets the same cramped list as a laptop user.
8. Map window centres itself with `transform: translateX(-50%)`; the drag code converts that to
   left/top on first grab. The manager must keep that working.

## 2. Target behaviour (Ragnarok standard)

| feature | spec |
|---|---|
| Move | drag by title bar (already), clamped so the title bar always stays on screen |
| Remember | position (and size, and collapsed state) per window per character in `localStorage` via `saveKey("win." + id)`; restored on first open; "reset window layout" button in settings |
| Front | `pointerdown` anywhere on a window raises it (global z counter starting at 10; keep tooltips/menus at 60+ as today) |
| Cascade defaults | no two windows share a default spot (table below) |
| Snap | while dragging, snap to viewport edges and to other open windows' edges within 12px |
| Collapse | double-click the title bar, or a ▁ button, hides the body and leaves the bar; remembered |
| Resize | bottom-right grip on resizable windows (skills, codex, quests, inventory, shop, workshop, stall, bot, status); min 280×200, max viewport; remembered |
| Close | × button, hotkey again, or **Esc closes only the top-most open window**. Esc order: an aimed skill is let go first, then the front window closes, then the talk dialog; with the bag's item menu open, Esc closes only that menu |
| Layout | `.window` is a flex column: fixed bar, then one `.window-body` that scrolls. Inner lists lose their hard-coded max-heights and flex to fill (`flex: 1; min-height: 0`) so resizing the window grows the list |
| Resize of browser | all open windows re-clamped into the viewport |
| Touch | `body.touch`: manager features off (no drag/snap/resize/z/memory); one-sheet-at-a-time stays as is |

Default cascade positions (desktop, 1920×1080 reference, expressed as anchors not pixels):

| window | anchor | offset |
|---|---|---|
| status | left / top | 14px, 178px (as now, under vitals) |
| inventory | right / top | 24px, 70px |
| skills | center | offset −120px x |
| quests | right / top | 360px, 70px |
| codex | center | offset +80px x, +40px y |
| bot | left / top | 300px, 180px |
| settings | center | 0 |
| map | center / top | 0, 56px (as now) |
| shop, workshop, stall | center | 0 (open next to an NPC, short-lived) |

Anchors are resolved to left/top at first open from the current viewport, then the saved
position takes over.

## 3. Implementation

### 3a. New module `src/windows.ts` (the manager)

```ts
export interface WindowOpts { resizable?: boolean; anchor: Anchor; dx?: number; dy?: number; minW?: number; minH?: number }
export function register(win: HTMLElement, opts: WindowOpts): void
export function focus(win: HTMLElement): void         // raise to front
export function closeTop(): boolean                   // Esc: close highest open window, true if one closed
export function openWindows(): HTMLElement[]
export function resetLayout(): void                   // forget saved positions/sizes, re-apply defaults
export function layoutKey(id: string): string         // saveKey("win." + id)
```

- `register` is called by `makeWindow`. It: wraps all non-bar children into `.window-body`
  (use a `MutationObserver` on `childList` so children appended later by the callers, e.g.
  `el("p", "wr-note", this.win)`, also land in the body); adds the collapse button and the
  resize grip; wires drag with snap + clamp + save; wires `pointerdown` → `focus`.
- Visibility: callers toggle the `hidden` class directly today (11 call sites). Do not change
  them. Observe `class` with the same `MutationObserver` and, when `hidden` is removed, apply the
  saved/default position (first time), clamp, and `focus`.
- Persist with `saveKey` so each character keeps its own layout (matches how the look and other
  settings are saved). Listen to `resize` once, re-clamp every open window.
- Snap: compare the dragged rect's edges to viewport edges and to every other open window's
  edges; if within 12px, set the coordinate. Do not snap to hidden windows.

### 3b. `src/ui.ts` `makeWindow`

- Keep the signature and the DOM contract (`.window-bar` with `h2`, `kbd`, `.window-close`), since
  `shop.ts`, `workshop.ts`, `mapui.ts` query it. `mapui.ts` inserts its tabs before the `kbd`.
- Move the drag code out into `windows.ts`. `makeWindow` creates the chrome then calls
  `register(win, opts)`, with per-id options looked up from a table in `windows.ts`.

### 3c. `style.css`

- `.window`: `display: flex; flex-direction: column; overflow: hidden; max-height: calc(100vh - 24px)`;
  drop `overflow: auto`.
- `.window-bar`: `flex: none`; compact 30px RO-style bar: title left, hotkey badge, ▁ and × right.
- `.window-body`: `flex: 1; min-height: 0; overflow: auto; scrollbar-width: thin`.
- `.window.collapsed .window-body, .window.collapsed .window-grip { display: none }`.
- `.window-grip`: 14px triangle bottom-right, `cursor: nwse-resize`.
- `.window.front`: slightly brighter rim so the active window reads as active.
- Inner lists: `.sk-body`, `.cx-list`, `.shop-list`, `.inv-grid`, `.ql-list`: remove fixed
  max-heights on desktop; make the body of those windows `display: flex; flex-direction: column`
  and the list `flex: 1; min-height: 0`. Give resizable windows a sensible default size via the
  manager (e.g. skills 760×620, codex 560×600, quests 480×520).
- Keep every `body.touch` rule working: the touch sheet must still scroll as one piece with the
  sticky bar. Easiest: `body.touch .window-body { overflow: visible }` and keep the sheet's own
  `overflow: auto`.
- Do not change the palette; keep Kanit and the existing rim/gold/mint variables.

### 3d. `src/main.ts`

- Esc: call `closeTop()` first; only if nothing was open fall through to today's cancel logic.
- Remove the per-window `toggle(false)` list on Esc.

### 3e. `src/charui.ts` SettingsUI

- Add a button "รีเซ็ตตำแหน่งหน้าต่าง" that calls `resetLayout()`.

### 3f. README

- In the key table add rows (Thai, matching the existing voice): drag the title bar to move,
  double-click to collapse, drag the corner to resize, Esc closes the front window, windows
  remember their place per character.

## 4. Out of scope (later)

- Window opacity slider (RO has it). Easy to add on top of the manager; not now.
- Keyboard/gamepad focus navigation inside windows.
- Changing any game logic, the HUD bar, the vitals panel, the minimap, or the title screen.

## 5. Verification

1. `npm run typecheck` and `npm run build` pass.
2. Manual (desktop): open K, J, C, I, P together → four distinct spots, none overlapping exactly;
   click a back window → it comes to front; drag near an edge → snaps; reload → same spots;
   double-click bar → collapses; drag grip on K → list grows; shrink the browser → windows pulled
   back in; Esc → only the front window closes; settings reset → defaults again.
3. Manual (phone / `body.touch`): unchanged one-sheet behaviour, sheet scrolls with sticky bar.

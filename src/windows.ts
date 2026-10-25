// The window manager: windows behave as in a classic MMO client (Ragnarok Online).
//
// makeWindow (src/ui.ts) builds the chrome and calls register(). From then on a window drags by
// its title bar (snapping to the screen edges and to other open windows), comes to the front on a
// click, collapses to its bar on a double click (or the ▁ button), resizes from the corner grip
// when it holds big content, and remembers where it was, its size and whether it was collapsed,
// per character (saveKey). Each window has a default spot, given as an anchor rather than pixels,
// so that windows opened together never sit exactly on top of each other.
//
// The windows' owners keep showing and hiding them with the `hidden` class; a MutationObserver
// notices. Whatever they append to the window lands in its scrolling `.window-body`.
//
// Phones (body.touch) keep one sheet at a time in the middle: no dragging, snapping, resizing,
// stacking or memory there.

import { saveKey, readJson } from "./save";
import { isTouch, onTouchMode } from "./touch";

export type Anchor = "left-top" | "right-top" | "center" | "center-top";

export interface WindowOpts {
  anchor: Anchor;
  dx?: number;          // offset from the anchor, px
  dy?: number;
  resizable?: boolean;  // the corner grip
  minW?: number;
  minH?: number;
  w?: number;           // default size, px (otherwise the stylesheet's)
  h?: number;
  fill?: boolean;       // the body is a flex column whose list grows with the window
}

// Default spots and sizes (desktop). Anchors resolve against the viewport at first open.
const WINDOW_OPTS: Record<string, WindowOpts> = {
  status: { anchor: "left-top", dx: 14, dy: 178, resizable: true },
  inventory: { anchor: "right-top", dx: 24, dy: 70, resizable: true, fill: true, h: 500 },
  skills: { anchor: "center", dx: -120, resizable: true, fill: true, h: 620 },
  quests: { anchor: "right-top", dx: 360, dy: 70, resizable: true, fill: true, w: 480, h: 520 },
  codex: { anchor: "center", dx: 80, dy: 40, resizable: true, fill: true, h: 600 },
  bot: { anchor: "left-top", dx: 300, dy: 180, resizable: true },
  settings: { anchor: "center" },
  map: { anchor: "center-top", dy: 56 },
  shop: { anchor: "center", resizable: true, fill: true, h: 560 },
  workshop: { anchor: "center", resizable: true, fill: true, h: 560 },
  stall: { anchor: "center", resizable: true, fill: true, h: 520 },
};

export function optsFor(id: string): WindowOpts {
  return WINDOW_OPTS[id] ?? { anchor: "center" };
}

const SNAP = 12;      // px: edges closer than this stick together while dragging
const Z0 = 10;        // the bottom window's z-index (tooltips and menus sit at 60+)
const MIN_W = 280, MIN_H = 200;
const NUDGE = 28;     // a default spot already taken moves this far down and right

interface Layout { x: number; y: number; w?: number; h?: number; c?: boolean }

interface Win {
  el: HTMLElement;
  id: string;
  opts: WindowOpts;
  bar: HTMLElement;
  body: HTMLElement;
  grip: HTMLElement | null;
  placed: boolean;          // has its spot (saved or default) this session
  wasOpen: boolean;
  closer: (() => void) | null;
  self: number;             // class changes the manager made itself, not yet seen by the observer
}

const wins: Win[] = [];     // stacking order, bottom first
const byEl = new Map<HTMLElement, Win>();
let busy = false;           // a drag or a resize is under way

const px = (n: number) => `${Math.round(n)}px`;
const clampN = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const isOpen = (w: Win) => !w.el.classList.contains("hidden");
// The manager's own classes (front, collapsed): changed only when they differ, and counted so the
// observer can tell them from the owners' show and hide.
function setClass(w: Win, cls: string, on: boolean): void {
  if (w.el.classList.contains(cls) === on) return;
  w.self++;
  w.el.classList.toggle(cls, on);
}
const onControl = (t: EventTarget | null) => t instanceof Element && !!t.closest("button, input, select, a");

export function layoutKey(id: string): string {
  return saveKey("win." + id);
}

export function openWindows(): HTMLElement[] {
  return wins.filter(isOpen).map((w) => w.el);
}

function topOpen(): Win | null {
  for (let i = wins.length - 1; i >= 0; i--) if (isOpen(wins[i])) return wins[i];
  return null;
}

// z-indexes follow the stacking order; the top open window wears the brighter rim
function restack(): void {
  if (isTouch()) return;
  const top = topOpen();
  wins.forEach((w, i) => {
    w.el.style.zIndex = String(Z0 + i);
    setClass(w, "front", w === top);
  });
}

export function focus(win: HTMLElement): void {
  const w = byEl.get(win);
  if (!w) return;
  const i = wins.indexOf(w);
  if (i !== wins.length - 1) {
    wins.splice(i, 1);
    wins.push(w);
  } else if (w.el.classList.contains("front") || isTouch()) return; // already on top
  restack();
}

// How a window closes (its owner's toggle(false), so tooltips and the like close with it).
export function setCloser(win: HTMLElement, fn: () => void): void {
  const w = byEl.get(win);
  if (w) w.closer = fn;
}

export function closeWindow(win: HTMLElement): void {
  const w = byEl.get(win);
  if (w?.closer) w.closer();
  else win.classList.add("hidden");
}

// Esc: the front window closes; true if there was one.
export function closeTop(): boolean {
  const w = topOpen();
  if (!w) return false;
  closeWindow(w.el);
  return true;
}

function setPos(w: Win, x: number, y: number): void {
  Object.assign(w.el.style, { left: px(x), top: px(y), right: "auto", bottom: "auto", transform: "none" });
}

// Keep a window on screen: all of its width, and its title bar (or all of it, `whole`).
function clamp(w: Win, whole = false): void {
  const s = w.el.style;
  if (s.width && parseFloat(s.width) > innerWidth - 16) s.width = px(Math.max(MIN_W, innerWidth - 16));
  if (s.height && parseFloat(s.height) > innerHeight - 24) s.height = px(Math.max(MIN_H, innerHeight - 24));
  const r = w.el.getBoundingClientRect();
  const maxY = whole ? innerHeight - r.height : innerHeight - w.bar.offsetHeight;
  const x = clampN(r.left, 0, Math.max(0, innerWidth - r.width));
  const y = clampN(r.top, 0, Math.max(0, maxY));
  if (x !== r.left || y !== r.top || s.transform !== "none") setPos(w, x, y);
}

function save(w: Win): void {
  // a window closed mid-drag measures as all zeros: keep what was saved
  if (isTouch() || !isOpen(w)) return;
  const r = w.el.getBoundingClientRect(), s = w.el.style;
  const lay: Layout = { x: Math.round(r.left), y: Math.round(r.top) };
  if (w.opts.resizable && s.width) lay.w = Math.round(parseFloat(s.width));
  if (w.opts.resizable && s.height) lay.h = Math.round(parseFloat(s.height));
  if (w.el.classList.contains("collapsed")) lay.c = true;
  try {
    localStorage.setItem(layoutKey(w.id), JSON.stringify(lay));
  } catch {
    // private mode or blocked storage: the layout lasts this session
  }
}

// First open this session: the saved spot and size, or the default ones.
function place(w: Win): void {
  w.placed = true;
  const o = w.opts, s = w.el.style;
  const saved = readJson<Layout>(layoutKey(w.id));
  const width = (o.resizable ? saved?.w : undefined) ?? o.w;
  const height = (o.resizable ? saved?.h : undefined) ?? o.h;
  s.width = width ? px(Math.min(width, innerWidth - 16)) : "";
  s.height = height ? px(Math.min(height, innerHeight - 24)) : "";
  setCollapsed(w, !!saved?.c);
  if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
    setPos(w, saved.x, saved.y);
    clamp(w);
    return;
  }
  const r = w.el.getBoundingClientRect();
  const dx = o.dx ?? 0, dy = o.dy ?? 0;
  let x = 0, y = 0;
  switch (o.anchor) {
    case "left-top": x = dx; y = dy; break;
    case "right-top": x = innerWidth - r.width - dx; y = dy; break;
    case "center-top": x = (innerWidth - r.width) / 2 + dx; y = dy; break;
    case "center": x = (innerWidth - r.width) / 2 + dx; y = (innerHeight - r.height) / 2 + dy; break;
  }
  // a spot another open window already holds: step down and right
  const taken = () => wins.some((v) => {
    if (v === w || !v.placed || !isOpen(v)) return false;
    const q = v.el.getBoundingClientRect();
    return Math.abs(q.left - x) < 6 && Math.abs(q.top - y) < 6;
  });
  for (let i = 0; i < 8 && taken(); i++) {
    x += NUDGE;
    y += NUDGE;
  }
  setPos(w, x, y);
  clamp(w, true);
}

// The coordinate v of a box `size` long, moved onto the nearest line within SNAP (by its start
// or its end), or left as it is.
function snap(v: number, size: number, lines: number[]): number {
  let best = v, d = SNAP + 1;
  for (const l of lines) {
    for (const c of [l, l - size]) {
      const dd = Math.abs(v - c);
      if (dd < d) {
        d = dd;
        best = c;
      }
    }
  }
  return d <= SNAP ? best : v;
}

// Pointer capture on `target`; move(ev) while it lasts, done() when it ends.
function track(target: HTMLElement, e: PointerEvent, move: (ev: PointerEvent) => void, done: () => void): void {
  target.setPointerCapture(e.pointerId);
  busy = true;
  const up = () => {
    busy = false;
    target.removeEventListener("pointermove", move);
    target.removeEventListener("pointerup", up);
    target.removeEventListener("pointercancel", up);
    done();
  };
  target.addEventListener("pointermove", move);
  target.addEventListener("pointerup", up);
  target.addEventListener("pointercancel", up);
}

function bindDrag(w: Win): void {
  const bar = w.bar;
  bar.addEventListener("pointerdown", (e) => {
    // buttons in the bar (close, collapse, the map's tabs) keep their clicks
    if (e.button !== 0 || isTouch() || onControl(e.target)) return;
    e.preventDefault();
    focus(w.el);
    // pinned where it stands first (a centred window would otherwise jump)
    const r = w.el.getBoundingClientRect();
    setPos(w, r.left, r.top);
    const ox = e.clientX - r.left, oy = e.clientY - r.top;
    const others = wins.filter((v) => v !== w && isOpen(v)).map((v) => v.el.getBoundingClientRect());
    bar.classList.add("dragging");
    track(bar, e, (ev) => {
      let x = ev.clientX - ox, y = ev.clientY - oy;
      const xs = [0, innerWidth], ys = [0, innerHeight];
      for (const o of others) {
        // only the windows alongside: their side edges; above or below: their top and bottom
        if (y < o.bottom + SNAP && y + r.height > o.top - SNAP) xs.push(o.left, o.right);
        if (x < o.right + SNAP && x + r.width > o.left - SNAP) ys.push(o.top, o.bottom);
      }
      x = snap(x, r.width, xs);
      y = snap(y, r.height, ys);
      setPos(w, clampN(x, 0, Math.max(0, innerWidth - r.width)), clampN(y, 0, Math.max(0, innerHeight - bar.offsetHeight)));
    }, () => {
      bar.classList.remove("dragging");
      save(w);
    });
  });
  bar.addEventListener("dblclick", (e) => {
    if (!onControl(e.target)) toggleCollapse(w);
  });
}

function bindGrip(w: Win, grip: HTMLElement): void {
  grip.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || isTouch()) return;
    e.preventDefault();
    e.stopPropagation();
    focus(w.el);
    const r = w.el.getBoundingClientRect();
    setPos(w, r.left, r.top);
    const minW = w.opts.minW ?? MIN_W, minH = w.opts.minH ?? MIN_H;
    // no taller than the stylesheet lets it render (max-height), nor past the bottom of the screen
    const cssMax = parseFloat(getComputedStyle(w.el).maxHeight);
    const maxH = Math.min(innerHeight - r.top, Number.isFinite(cssMax) ? cssMax : Infinity);
    track(grip, e, (ev) => {
      w.el.style.width = px(clampN(r.width + ev.clientX - e.clientX, minW, innerWidth - r.left));
      w.el.style.height = px(clampN(r.height + ev.clientY - e.clientY, minH, maxH));
    }, () => save(w));
  });
}

function setCollapsed(w: Win, c: boolean): void {
  setClass(w, "collapsed", c);
  w.bar.querySelector(".window-collapse")?.setAttribute("aria-pressed", String(c));
}

function toggleCollapse(w: Win): void {
  if (isTouch()) return;
  setCollapsed(w, !w.el.classList.contains("collapsed"));
  clamp(w);
  save(w);
}

// Everything but the chrome goes into the body (callers append to the window itself).
function adopt(w: Win): void {
  for (const n of [...w.el.childNodes]) if (n !== w.bar && n !== w.body && n !== w.grip) w.body.append(n);
}

function shown(w: Win): void {
  if (!isTouch()) {
    if (!w.placed) place(w);
    else clamp(w);
  }
  focus(w.el);
}

const watch = new MutationObserver((records) => {
  const changed = new Set<Win>();
  for (const rec of records) {
    const w = byEl.get(rec.target as HTMLElement);
    if (!w) continue;
    if (rec.type === "childList") adopt(w);
    else if (w.self > 0) w.self--; // front or collapsed, set by the manager
    else changed.add(w);
  }
  for (const w of changed) {
    const open = isOpen(w);
    if (open !== w.wasOpen) {
      w.wasOpen = open;
      if (open) shown(w);
      else restack();
    } else if (open && wins[wins.length - 1] !== w) focus(w.el); // shown again while open: to the front
  }
});

// content that grows (a re-render, the map's world view) must not push a window off screen
const sizes = new ResizeObserver((entries) => {
  if (busy || isTouch()) return;
  for (const e of entries) {
    const w = byEl.get(e.target as HTMLElement);
    if (w && w.placed && isOpen(w)) clamp(w);
  }
});

window.addEventListener("resize", () => {
  if (isTouch()) return;
  for (const w of wins) if (w.placed && isOpen(w)) clamp(w);
});

// touch mode: the stylesheet's sheet takes over; drop everything the manager set
onTouchMode(() => {
  for (const w of wins) {
    w.placed = false;
    setClass(w, "collapsed", false);
    setClass(w, "front", false);
    for (const p of ["left", "top", "right", "bottom", "transform", "width", "height", "z-index"]) w.el.style.removeProperty(p);
  }
});

export function register(win: HTMLElement, opts: WindowOpts): void {
  const bar = win.querySelector<HTMLElement>(".window-bar")!;
  const body = document.createElement("div");
  body.className = "window-body";
  win.append(body);
  const w: Win = { el: win, id: win.id, opts, bar, body, grip: null, placed: false, wasOpen: !win.classList.contains("hidden"), closer: null, self: 0 };
  if (opts.fill) win.classList.add("window-fill");

  const fold = document.createElement("button");
  fold.type = "button";
  fold.className = "window-collapse";
  fold.setAttribute("aria-label", "ย่อ");
  fold.setAttribute("aria-pressed", "false");
  fold.textContent = "▁";
  fold.addEventListener("click", () => toggleCollapse(w));
  bar.insertBefore(fold, bar.querySelector(".window-close"));

  if (opts.resizable) {
    const grip = document.createElement("div");
    grip.className = "window-grip";
    grip.setAttribute("aria-hidden", "true");
    win.append(grip);
    w.grip = grip;
    bindGrip(w, grip);
  }
  bindDrag(w);
  win.addEventListener("pointerdown", () => !isTouch() && focus(win), { capture: true });

  wins.push(w);
  byEl.set(win, w);
  adopt(w);
  watch.observe(win, { childList: true, attributes: true, attributeFilter: ["class"] });
  sizes.observe(win);
}

// Settings: forget every saved spot and size; open windows go back to their default spots.
export function resetLayout(): void {
  for (const w of wins) {
    try {
      localStorage.removeItem(layoutKey(w.id));
    } catch {
      // nothing was kept
    }
    w.placed = false;
    setCollapsed(w, false);
    for (const p of ["left", "top", "right", "bottom", "transform", "width", "height"]) w.el.style.removeProperty(p);
  }
  if (isTouch()) return;
  for (const w of wins) if (isOpen(w)) place(w);
  restack();
}

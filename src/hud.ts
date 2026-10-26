// Skill bar: twenty slots in two rows of ten, filled from the character's hotbar. The first row
// is keys 1-9 and 0, the second Shift and the same keys. A slot holds a learned skill (dragged in
// from the skill window) or a shortcut to a usable item (dragged in from the bag; the item stays
// in the bag and the slot shows how many are left, dimmed at none). A slot dragged onto another
// swaps with it, dragged off the bar empties; right-click empties it too (not on phones, where a
// long press would). Beside it, the element orbs an invoker holds; over a slot, a caption (the
// spell an invoke would cast now).

import { isTouch } from "./touch";
import type { Img } from "./types";

export const ROW = 10;
export const SLOT_COUNT = ROW * 2;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
// What slot i's key reads: "1".."0" on the first row, "⇧1".."⇧0" (Shift) on the second.
export const slotLabel = (i: number): string => (i >= ROW ? "⇧" : "") + KEYS[i % ROW];
const slotName = (i: number): string => (i >= ROW ? "Shift+" : "") + KEYS[i % ROW];

// KeyboardEvent.code (top row and numpad) and Shift -> slot index; -1 for other keys.
export function slotForCode(code: string, shift = false): number {
  const m = /^(?:Digit|Numpad)(\d)$/.exec(code);
  if (!m) return -1;
  return (m[1] === "0" ? 9 : Number(m[1]) - 1) + (shift ? ROW : 0);
}

export interface SlotEntry {
  id: string;
  name: string;
  icon: Img;
  tip: string;      // html
  missing?: boolean; // not learned (any more), or none of the item left
  count?: number;    // an item: how many the bag holds
}

interface Slot {
  el: HTMLButtonElement;
  art: HTMLSpanElement;
  cd: HTMLSpanElement;
  cdText: HTMLSpanElement;
  tip: HTMLSpanElement;
  note: HTMLSpanElement;
  count: HTMLSpanElement;
  id: string | null;
}

const ORBS = 3;

export class SkillBar {
  root: HTMLElement;
  slots: Slot[];
  orbs: HTMLElement;
  orbsShown = "";

  dragEnd = 0; // when a drag last let go (the click that follows it is not a press)

  // onUse(i): slot pressed; onClear(i): right-click, or dragged off the bar; onMove(i, j): slot i
  // dragged onto slot j
  constructor(root: HTMLElement, onUse: (i: number) => void, onClear: (i: number) => void, onMove: (i: number, j: number) => void) {
    this.root = root;
    this.slots = Array.from({ length: SLOT_COUNT }, (_, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `slot empty${i >= ROW ? " row2" : ""}`;
      el.dataset.slot = String(i);
      const art = document.createElement("span");
      art.className = "slot-art";
      const k = document.createElement("span");
      k.className = "key";
      // (the second row's Shift arrow a size up: at the key's size it reads as a 1)
      if (i >= ROW) k.append(Object.assign(document.createElement("b"), { textContent: "⇧" }));
      k.append(KEYS[i % ROW]);
      const cd = document.createElement("span");
      cd.className = "cd";
      const cdText = document.createElement("span");
      cdText.className = "cdtext";
      const count = document.createElement("span");
      count.className = "slot-count";
      const tip = document.createElement("span");
      tip.className = "tooltip";
      const note = document.createElement("span");
      note.className = "slot-note";
      el.append(art, k, cd, cdText, count, tip, note);
      el.addEventListener("click", () => {
        el.blur(); // keep keyboard focus on the game
        if (performance.now() - this.dragEnd > 250) onUse(i);
      });
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (!isTouch()) onClear(i); // a long press on a phone is not a right-click
      });
      root.append(el);
      return { el, art, cd, cdText, tip, note, count, id: null };
    });
    this.bindDrag(onClear, onMove);
    this.orbs = document.createElement("div");
    this.orbs.className = "orbs hidden";
    this.orbs.setAttribute("aria-label", "ลูกแก้วธาตุ");
    for (let i = 0; i < ORBS; i++) this.orbs.append(document.createElement("i"));
    root.append(this.orbs);
  }

  // The orbs held, oldest first, as their elements' names and colours; shown while she holds one
  // or has an orb skill on the bar.
  setOrbs(orbs: { name: string; color: string }[], shown: boolean): void {
    const key = shown ? orbs.map((o) => o.color).join() || "-" : "";
    if (key === this.orbsShown) return;
    this.orbsShown = key;
    this.orbs.classList.toggle("hidden", !shown);
    [...this.orbs.children].forEach((dot, i) => {
      const o = orbs[i], d = dot as HTMLElement;
      d.classList.toggle("on", !!o);
      d.style.setProperty("--orb", o?.color ?? "transparent");
      d.title = o?.name ?? "ว่าง";
    });
  }

  // A short caption over slot i (an invoke's spell), in a colour; "" for none.
  setNote(i: number, text: string, color = ""): void {
    const n = this.slots[i].note;
    if (n.dataset.key === `${text}|${color}`) return;
    n.dataset.key = `${text}|${color}`;
    n.textContent = text;
    n.style.color = color;
  }

  // entry: { id, name, icon, tip (html), missing, count } or null
  set(i: number, entry: SlotEntry | null): void {
    const s = this.slots[i];
    s.id = entry?.id ?? null;
    s.el.classList.toggle("empty", !entry);
    s.el.classList.toggle("missing", !!entry?.missing);
    s.el.setAttribute("aria-label", entry ? `${entry.name} (ปุ่ม ${slotName(i)})` : `ช่องว่าง ${slotName(i)}`);
    s.art.replaceChildren();
    if (entry) {
      const c = document.createElement("canvas");
      c.width = entry.icon.width;
      c.height = entry.icon.height;
      c.getContext("2d")!.drawImage(entry.icon, 0, 0);
      s.art.append(c);
    }
    s.count.textContent = entry?.count !== undefined ? String(entry.count) : "";
    s.tip.innerHTML = entry ? entry.tip : "";
  }

  // Drag a filled slot (mouse, pen or finger) past a few px: let go on another slot to swap the
  // two, off the bar to empty it, on the bar between slots to leave it be.
  bindDrag(onClear: (i: number) => void, onMove: (i: number, j: number) => void): void {
    let drag: { i: number; x: number; y: number; ghost: HTMLCanvasElement | null } | null = null;
    this.root.addEventListener("pointerdown", (e) => {
      const el = e.target instanceof Element ? e.target.closest<HTMLElement>(".slot") : null;
      if (!el || e.button !== 0) return;
      const i = Number(el.dataset.slot);
      if (this.slots[i].id) drag = { i, x: e.clientX, y: e.clientY, ghost: null };
    });
    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) {
        const src = this.slots[drag.i].art.querySelector("canvas");
        drag.ghost = document.createElement("canvas");
        if (src) {
          drag.ghost.width = src.width;
          drag.ghost.height = src.height;
          drag.ghost.getContext("2d")!.drawImage(src, 0, 0);
        }
        drag.ghost.className = "inv-ghost";
        document.body.append(drag.ghost);
        this.slots[drag.i].el.classList.add("dragging");
      }
      if (drag.ghost) {
        drag.ghost.style.left = `${e.clientX}px`;
        drag.ghost.style.top = `${e.clientY}px`;
      }
    });
    const end = (e: PointerEvent, drop: boolean) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (!d.ghost) return; // not dragged: the click uses the slot
      d.ghost.remove();
      this.slots[d.i].el.classList.remove("dragging");
      this.dragEnd = performance.now();
      if (!drop) return;
      const j = this.slotAt(e.clientX, e.clientY);
      const over = document.elementFromPoint(e.clientX, e.clientY);
      if (j >= 0) onMove(d.i, j);
      else if (!(over && this.root.contains(over))) onClear(d.i);
    };
    window.addEventListener("pointerup", (e) => end(e, true));
    window.addEventListener("pointercancel", (e) => end(e, false));
  }

  // Slot under a screen point, for drops from the skill window and the bag; -1 if none.
  slotAt(x: number, y: number): number {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>(".slot");
    return el && this.root.contains(el) ? Number(el.dataset.slot) : -1;
  }

  setCooldown(i: number, remaining: number, total: number): void {
    const s = this.slots[i];
    const f = remaining > 0 && total > 0 ? remaining / total : 0;
    s.el.style.setProperty("--cd", f.toFixed(4));
    const text = remaining > 0 ? (remaining < 1 ? remaining.toFixed(1) : Math.ceil(remaining).toString()) : "";
    if (s.cdText.textContent !== text) s.cdText.textContent = text;
  }

  // The slot whose skill is being aimed (main.ts) glows until it goes off or is let go; -1: none.
  setAiming(i: number): void {
    this.slots.forEach((s, j) => s.el.classList.toggle("aiming", j === i));
  }

  // Restart a one-shot CSS animation on a slot.
  pulse(i: number, cls: "flash" | "denied"): void {
    const el = this.slots[i].el;
    el.classList.remove("flash", "denied");
    void el.offsetWidth;
    el.classList.add(cls);
  }
}

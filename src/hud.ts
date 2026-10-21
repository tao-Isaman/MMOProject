// Skill bar: ten slots bound to keys 1-9 and 0, filled from the character's hotbar. Learned
// skills are dragged in from the skill window; right-click empties a slot (not on phones, where a
// long press would).

import { isTouch } from "./touch";

export const SLOT_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

// KeyboardEvent.code -> slot index (top row and numpad)
export function slotForCode(code: string): number {
  const m = /^(?:Digit|Numpad)(\d)$/.exec(code);
  if (!m) return -1;
  return m[1] === "0" ? 9 : Number(m[1]) - 1;
}

export interface SlotEntry {
  id: string;
  name: string;
  icon: HTMLCanvasElement;
  tip: string;      // html
  missing?: boolean; // not learned (any more)
}

interface Slot {
  el: HTMLButtonElement;
  art: HTMLSpanElement;
  cd: HTMLSpanElement;
  cdText: HTMLSpanElement;
  tip: HTMLSpanElement;
  id: string | null;
}

export class SkillBar {
  root: HTMLElement;
  slots: Slot[];

  // onUse(i): slot pressed; onClear(i): right-click
  constructor(root: HTMLElement, onUse: (i: number) => void, onClear: (i: number) => void) {
    this.root = root;
    this.slots = SLOT_KEYS.map((key, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "slot empty";
      el.dataset.slot = String(i);
      const art = document.createElement("span");
      art.className = "slot-art";
      const k = document.createElement("span");
      k.className = "key";
      k.textContent = key;
      const cd = document.createElement("span");
      cd.className = "cd";
      const cdText = document.createElement("span");
      cdText.className = "cdtext";
      const tip = document.createElement("span");
      tip.className = "tooltip";
      el.append(art, k, cd, cdText, tip);
      el.addEventListener("click", () => {
        el.blur(); // keep keyboard focus on the game
        onUse(i);
      });
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (!isTouch()) onClear(i); // a long press on a phone is not a right-click
      });
      root.append(el);
      return { el, art, cd, cdText, tip, id: null };
    });
  }

  // entry: { id, name, icon (canvas), tip (html), missing } or null
  set(i: number, entry: SlotEntry | null): void {
    const s = this.slots[i];
    s.id = entry?.id ?? null;
    s.el.classList.toggle("empty", !entry);
    s.el.classList.toggle("missing", !!entry?.missing);
    s.el.setAttribute("aria-label", entry ? `${entry.name} (ปุ่ม ${SLOT_KEYS[i]})` : `ช่องว่าง ${SLOT_KEYS[i]}`);
    s.art.replaceChildren();
    if (entry) {
      const c = document.createElement("canvas");
      c.width = entry.icon.width;
      c.height = entry.icon.height;
      c.getContext("2d")!.drawImage(entry.icon, 0, 0);
      s.art.append(c);
    }
    s.tip.innerHTML = entry ? entry.tip : "";
  }

  // Slot under a screen point, for drops from the skill window; -1 if none.
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

  // Restart a one-shot CSS animation on a slot.
  pulse(i: number, cls: "flash" | "denied"): void {
    const el = this.slots[i].el;
    el.classList.remove("flash", "denied");
    void el.offsetWidth;
    el.classList.add(cls);
  }
}

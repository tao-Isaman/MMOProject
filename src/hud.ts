// Skill bar: ten slots bound to keys 1-9 and 0, filled from the character's hotbar. Learned
// skills are dragged in from the skill window; right-click empties a slot (not on phones, where a
// long press would). Beside it, the element orbs an invoker holds; over a slot, a caption (the
// spell an invoke would cast now).

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
  note: HTMLSpanElement;
  id: string | null;
}

const ORBS = 3;

export class SkillBar {
  root: HTMLElement;
  slots: Slot[];
  orbs: HTMLElement;
  orbsShown = "";

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
      const note = document.createElement("span");
      note.className = "slot-note";
      el.append(art, k, cd, cdText, tip, note);
      el.addEventListener("click", () => {
        el.blur(); // keep keyboard focus on the game
        onUse(i);
      });
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (!isTouch()) onClear(i); // a long press on a phone is not a right-click
      });
      root.append(el);
      return { el, art, cd, cdText, tip, note, id: null };
    });
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

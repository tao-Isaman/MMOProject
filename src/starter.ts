// How a character starts: its class, then one of the class's three skill books, one of the
// four first elements and one weapon mastery. Everything else is found in the game (books,
// src/progression.ts BOOKS). The form is shared by the character creator (src/title.ts) and
// the class picker shown to an old character that never chose a class (src/charui.ts).

import { el } from "./ui";
import { CLASSES, TREES, ELEMENTS, MASTERIES, FIRST_ELEMENTS } from "./progression";
import type { ClassId } from "./progression";
import { isTwoHanded } from "./items";
import type { WeaponId } from "./items";

export interface Start {
  cls: ClassId;
  tree: string;
  element: string;
  mastery: string;
}

// The weapon masteries, the class's own weapon first.
function masteriesFor(cls: ClassId): string[] {
  const all = Object.keys(MASTERIES).filter((m) => MASTERIES[m].kind === "weapon");
  const own = all.find((m) => MASTERIES[m].weapons?.includes(CLASSES[cls].weapon));
  return own ? [own, ...all.filter((m) => m !== own)] : all;
}

export function defaultStart(cls: ClassId): Start {
  return { cls, tree: CLASSES[cls].trees[0], element: FIRST_ELEMENTS[0], mastery: masteriesFor(cls)[0] };
}

// What it holds at the start: the first weapon of its mastery (the class's own weapon when
// that's one of them), and its class's off-hand item when the weapon leaves a hand free.
const CLASS_OFFHAND: Partial<Record<ClassId, string>> = { mage: "spell_tome", warrior: "buckler", priest: "spell_tome" };
export function startGear(s: Start): { weapon: WeaponId; offhand: string | null } {
  const ws = MASTERIES[s.mastery].weapons ?? [CLASSES[s.cls].weapon];
  const weapon = ws.includes(CLASSES[s.cls].weapon) ? CLASSES[s.cls].weapon : ws[0];
  return { weapon, offhand: isTwoHanded(weapon) ? null : CLASS_OFFHAND[s.cls] ?? null };
}

// The four choices as rows of buttons under headings; picking redraws them (a new class picks
// its own first book and weapon again) and calls changed().
export function starterForm(parent: HTMLElement, s: Start, changed: () => void = () => {}): void {
  const draw = () => {
    parent.replaceChildren();
    const section = (title: string, note: string) => {
      const h = el("h3", "title-h", parent);
      h.textContent = title;
      if (note) el("small", "title-hnote", h).textContent = note;
      return el("div", "wr-choices", parent);
    };
    const choice = (row: HTMLElement, text: string, on: boolean, sub: string, pick: () => void, color?: string) => {
      const b = el("button", `wr-choice${on ? " on" : ""}`, row);
      b.type = "button";
      b.textContent = text;
      if (color) b.style.setProperty("--accent", color);
      if (sub) el("small", "", b).textContent = sub;
      b.addEventListener("click", () => {
        pick();
        draw();
        changed();
      });
    };
    const cls = section("อาชีพ", "");
    cls.classList.add("title-classes");
    for (const [id, c] of Object.entries(CLASSES) as [ClassId, (typeof CLASSES)[ClassId]][]) {
      choice(cls, c.name, s.cls === id, c.note, () => Object.assign(s, defaultStart(id)));
    }
    const trees = section("ตำราสกิลเริ่มต้น", "เลือก 1 จาก 3 · อีก 2 เล่มหาได้ในเกม");
    trees.classList.add("title-classes");
    for (const t of CLASSES[s.cls].trees) choice(trees, TREES[t].name, s.tree === t, TREES[t].note, () => (s.tree = t), TREES[t].color);
    const els = section("ธาตุเริ่มต้น", "เลือก 1 จาก 4 · ธาตุอื่นหาตำราได้ในเกม");
    for (const e of FIRST_ELEMENTS) choice(els, `ธาตุ${ELEMENTS[e].name}`, s.element === e, `เด่นด้าน${ELEMENTS[e].side}`, () => (s.element = e), ELEMENTS[e].color);
    const ms = section("ความเชี่ยวชาญเริ่มต้น", "เลือกอาวุธ 1 อย่าง · ได้อาวุธนี้ติดตัว อย่างอื่นหาตำราได้ในเกม");
    masteriesFor(s.cls).forEach((m, i) => choice(ms, MASTERIES[m].name, s.mastery === m, i === 0 ? "อาวุธประจำอาชีพ" : "", () => (s.mastery = m)));
  };
  draw();
}

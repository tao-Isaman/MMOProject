// How a character starts: its class, then one of the class's three skill books and one of the
// four first elements, each picked from a row of icons, and the mastery of its class's weapon.
// Everything else is found in the game (books, src/progression.ts BOOKS). The form is shared by
// the character creator (src/title.ts) and the class picker shown to an old character that never
// chose a class (src/charui.ts).

import { el } from "./ui";
import { CLASSES, TREES, ELEMENTS, MASTERIES, FIRST_ELEMENTS } from "./progression";
import type { ClassId } from "./progression";
import { isTwoHanded } from "./items";
import type { WeaponId } from "./items";
import { skillIcon, hasArt } from "./icons";

export interface Start {
  cls: ClassId;
  tree: string;
  element: string;
  mastery: string;
}

// The weapon mastery of a class's own weapon.
function classMastery(cls: ClassId): string {
  return Object.keys(MASTERIES).find((m) => MASTERIES[m].kind === "weapon" && MASTERIES[m].weapons?.includes(CLASSES[cls].weapon))!;
}

export function defaultStart(cls: ClassId): Start {
  return { cls, tree: CLASSES[cls].trees[0], element: FIRST_ELEMENTS[0], mastery: classMastery(cls) };
}

// What it holds at the start: its class's weapon, and its class's off-hand item when the weapon
// leaves a hand free.
const CLASS_OFFHAND: Partial<Record<ClassId, string>> = { mage: "spell_tome", warrior: "buckler", priest: "spell_tome" };
export function startGear(s: Start): { weapon: WeaponId; offhand: string | null } {
  const ws = MASTERIES[s.mastery].weapons ?? [CLASSES[s.cls].weapon];
  const weapon = ws.includes(CLASSES[s.cls].weapon) ? CLASSES[s.cls].weapon : ws[0];
  return { weapon, offhand: isTwoHanded(weapon) ? null : CLASS_OFFHAND[s.cls] ?? null };
}

// The three choices as rows of icons under headings (a class its emblem, else its weapon's),
// the picked one named under its row; picking redraws them (a new class picks its own first book
// again) and calls changed().
export function starterForm(parent: HTMLElement, s: Start, changed: () => void = () => {}): void {
  const draw = () => {
    parent.replaceChildren();
    const section = (title: string, note: string) => {
      const h = el("h3", "title-h", parent);
      h.textContent = title;
      if (note) el("small", "title-hnote", h).textContent = note;
      return el("div", "st-picks", parent);
    };
    const caption = (name: string, sub: string, color: string) => {
      const c = el("p", "st-caption", parent);
      c.style.setProperty("--accent", color);
      el("strong", "", c).textContent = name;
      c.append(sub);
    };
    const choice = (row: HTMLElement, art: string, glyph: string, name: string, on: boolean, pick: () => void, color: string) => {
      const b = el("button", `st-pick${on ? " on" : ""}`, row);
      b.type = "button";
      b.title = name;
      b.setAttribute("aria-label", name);
      b.setAttribute("aria-pressed", String(on));
      b.style.setProperty("--accent", color);
      const c = el("canvas", "", b);
      c.width = c.height = 96;
      c.getContext("2d")!.drawImage(skillIcon(art, glyph, color), 0, 0);
      b.addEventListener("click", () => {
        pick();
        draw();
        changed();
      });
    };
    const gold = "#f4d27a";
    const cls = section("อาชีพ", "");
    cls.classList.add("title-classes");
    for (const [id, c] of Object.entries(CLASSES) as [ClassId, (typeof CLASSES)[ClassId]][]) {
      const m = MASTERIES[classMastery(id)];
      choice(cls, hasArt(`class_${id}`) ? `class_${id}` : `mastery_${classMastery(id)}`, m.glyph, c.name, s.cls === id, () => Object.assign(s, defaultStart(id)), gold);
    }
    caption(CLASSES[s.cls].name, CLASSES[s.cls].note, gold);
    const trees = section("ตำราสกิลเริ่มต้น", "เลือก 1 จาก 3 · อีก 2 เล่มหาได้ในเกม");
    for (const t of CLASSES[s.cls].trees) choice(trees, `tree_${t}`, TREES[t].glyph, TREES[t].name, s.tree === t, () => (s.tree = t), TREES[t].color);
    caption(TREES[s.tree].name, TREES[s.tree].note, TREES[s.tree].color);
    const els = section("ธาตุเริ่มต้น", "เลือก 1 จาก 4 · ธาตุอื่นหาตำราได้ในเกม");
    for (const e of FIRST_ELEMENTS) choice(els, `element_${e}`, ELEMENTS[e].glyph, `ธาตุ${ELEMENTS[e].name}`, s.element === e, () => (s.element = e), ELEMENTS[e].color);
    caption(`ธาตุ${ELEMENTS[s.element].name}`, `เด่นด้าน${ELEMENTS[s.element].side}`, ELEMENTS[s.element].color);
  };
  draw();
}

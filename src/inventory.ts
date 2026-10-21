// Inventory: a grid of slots plus the equipped weapon, top and bottom, saved in the browser.

import { ITEMS, itemSlot, stackLimit } from "./items";
import type { EquipSlot } from "./items";

export interface Stack {
  id: string;
  count: number;
}
export type Equipped = Record<EquipSlot, string | null>;

export const COLS = 8;
export const ROWS = 5;
const SAVE_KEY = "mmoproject.inventory.v3";
const OLD_KEYS = ["mmoproject.inventory.v2", "mmoproject.inventory.v1"];

// Clothes every character starts with, besides the mage top and skirt worn.
const STARTER_CLOTHES = [
  "top_priestess", "bottom_priestess", "top_adventurer", "bottom_adventurer", "top_warrior", "bottom_warrior",
  "top_sky", "bottom_navy", "top_priestess_white", "top_adventurer_teal", "bottom_adventurer_cocoa",
];

// v2 costumes (one item for a whole outfit) become a top and a bottom of the same shape.
const COSTUME_TO_CLOTHES: Record<string, [string, string]> = {
  costume_mage: ["top_white", "bottom_black"],
  costume_priestess_navy: ["top_priestess", "bottom_priestess"],
  costume_priestess_wine: ["top_priestess_wine", "bottom_priestess"],
  costume_priestess_forest: ["top_priestess_forest", "bottom_priestess"],
  costume_priestess_black: ["top_priestess_black", "bottom_priestess_black"],
  costume_priestess_white: ["top_priestess_white", "bottom_priestess_white"],
  costume_adventurer_red: ["top_adventurer", "bottom_adventurer"],
  costume_adventurer_navy: ["top_adventurer_navy", "bottom_adventurer_sand"],
  costume_adventurer_teal: ["top_adventurer_teal", "bottom_adventurer_cocoa"],
  costume_adventurer_plum: ["top_adventurer_plum", "bottom_adventurer_black"],
  costume_adventurer_ochre: ["top_adventurer_ochre", "bottom_adventurer_wine"],
};

export const STARTER: { equipped: Equipped; items: string[] } = {
  equipped: { weapon: "staff", top: "top_white", bottom: "bottom_black" },
  items: ["sword_1h", "sword_2h", "axe", "mace", "spear_1h", "spear_2h", "dagger", "dual_daggers", "bow", ...STARTER_CLOTHES],
};

export class Inventory {
  slots: (Stack | null)[] = new Array(COLS * ROWS).fill(null);
  equipped: Equipped = { weapon: null, top: null, bottom: null };
  listeners = new Set<(inv: Inventory) => void>();

  constructor() {
    if (!this.load()) this.reset();
  }

  reset(): void {
    this.slots.fill(null);
    this.equipped = { ...STARTER.equipped };
    for (const id of STARTER.items) this.add(id, 1, { silent: true });
    this.changed();
  }

  onChange(fn: (inv: Inventory) => void): () => boolean {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  changed(): void {
    this.save();
    for (const fn of this.listeners) fn(this);
  }

  // Add items, filling existing stacks first. Returns how many did not fit.
  add(id: string, count = 1, { silent = false } = {}): number {
    if (!ITEMS[id]) return count;
    const max = stackLimit(id);
    let left = count;
    for (const s of this.slots) {
      if (left <= 0) break;
      if (s && s.id === id && s.count < max) {
        const n = Math.min(max - s.count, left);
        s.count += n;
        left -= n;
      }
    }
    for (let i = 0; i < this.slots.length && left > 0; i++) {
      if (!this.slots[i]) {
        const n = Math.min(max, left);
        this.slots[i] = { id, count: n };
        left -= n;
      }
    }
    if (!silent && left < count) this.changed();
    return left;
  }

  // Drag one slot onto another: merge equal stacks, otherwise swap.
  move(from: number, to: number): void {
    if (from === to) return;
    const a = this.slots[from], b = this.slots[to];
    if (!a) return;
    if (b && b.id === a.id && stackLimit(a.id) > 1) {
      const n = Math.min(stackLimit(a.id) - b.count, a.count);
      b.count += n;
      a.count -= n;
      if (a.count <= 0) this.slots[from] = null;
    } else {
      this.slots[from] = b;
      this.slots[to] = a;
    }
    this.changed();
  }

  // Equip the item in a grid slot; whatever was equipped there goes back into that slot.
  equip(index: number): boolean {
    const s = this.slots[index];
    const slot = s && itemSlot(s.id);
    if (!slot) return false;
    const old = this.equipped[slot];
    this.equipped[slot] = s.id;
    this.slots[index] = old ? { id: old, count: 1 } : null;
    this.changed();
    return true;
  }

  // Take an equipped item off into the given grid slot, or the first free one (bare hands; an
  // empty top or bottom slot shows the default shape).
  unequip(slot: EquipSlot, index = -1): boolean {
    const id = this.equipped[slot];
    if (!id) return false;
    if (index < 0) index = this.slots.indexOf(null);
    if (index < 0) return false;
    const there = this.slots[index];
    if (there && itemSlot(there.id) !== slot) return false;
    this.equipped[slot] = there ? there.id : null;
    this.slots[index] = { id, count: 1 };
    this.changed();
    return true;
  }

  get full(): boolean {
    return !this.slots.includes(null);
  }

  save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ slots: this.slots, equipped: this.equipped }));
    } catch {
      // private mode or blocked storage: the inventory just won't persist
    }
  }

  load(): boolean {
    type Saved = { slots?: ({ id: string; count: number } | null)[]; equipped?: Record<string, string | null> };
    let data: Saved | null = null, from = SAVE_KEY;
    try {
      for (const key of [SAVE_KEY, ...OLD_KEYS]) {
        data = JSON.parse(localStorage.getItem(key) || "null");
        if (data) {
          from = key;
          break;
        }
      }
    } catch {
      return false;
    }
    if (!data || !Array.isArray(data.slots) || data.slots.length !== this.slots.length) return false;
    const old = from !== SAVE_KEY;
    // costumes in the bag turn into their top and bottom
    const extra: string[] = [];
    this.slots = data.slots.map((s) => {
      if (s && COSTUME_TO_CLOTHES[s.id]) {
        const [t, b] = COSTUME_TO_CLOTHES[s.id];
        extra.push(b);
        return { id: t, count: 1 };
      }
      return s && ITEMS[s.id] && s.count > 0 ? { id: s.id, count: s.count } : null;
    });
    const eq = data.equipped ?? {};
    for (const slot of Object.keys(this.equipped) as EquipSlot[]) {
      const id = eq[slot];
      this.equipped[slot] = id && itemSlot(id) === slot ? id : old && slot !== "weapon" ? null : STARTER.equipped[slot];
    }
    if (old) {
      // the costume worn becomes the top and bottom worn; the dye items worn before (now mage
      // shapes) go back to the bag
      const worn = COSTUME_TO_CLOTHES[eq.costume ?? ""] ?? COSTUME_TO_CLOTHES.costume_mage;
      for (const [i, slot] of (["top", "bottom"] as const).entries()) {
        if (this.equipped[slot]) extra.push(this.equipped[slot]!);
        this.equipped[slot] = worn[i];
      }
      if (from === OLD_KEYS[1]) extra.push(...STARTER_CLOTHES);
      for (const id of [...extra, "top_priestess", "bottom_priestess", "top_adventurer", "bottom_adventurer", "top_warrior", "bottom_warrior"]) {
        if (!this.has(id)) this.add(id, 1, { silent: true });
      }
      this.save();
    }
    return true;
  }

  // Whether an item is in the bag or worn.
  has(id: string): boolean {
    return Object.values(this.equipped).includes(id) || this.slots.some((s) => s?.id === id);
  }
}

// Inventory: a grid of slots plus the equipped weapon, costume, top and bottom dyes, saved in
// the browser.

import { ITEMS, itemSlot, stackLimit } from "./items.js";

export const COLS = 8;
export const ROWS = 5;
const SAVE_KEY = "mmoproject.inventory.v2";
const OLD_KEY = "mmoproject.inventory.v1";

// The ten costumes added with the new bodies; old saves receive them once.
const NEW_COSTUMES = [
  "costume_priestess_navy", "costume_priestess_wine", "costume_priestess_forest", "costume_priestess_black", "costume_priestess_white",
  "costume_adventurer_red", "costume_adventurer_navy", "costume_adventurer_teal", "costume_adventurer_plum", "costume_adventurer_ochre",
];

export const STARTER = {
  equipped: { weapon: "staff", costume: "costume_mage", top: null, bottom: null },
  items: ["sword_1h", "sword_2h", "axe", "mace", "spear_1h", "spear_2h", "dagger", "dual_daggers", "bow", "top_sky", "bottom_navy", ...NEW_COSTUMES],
};

export class Inventory {
  constructor() {
    this.slots = new Array(COLS * ROWS).fill(null); // { id, count } | null
    this.equipped = { weapon: null, costume: null, top: null, bottom: null };
    this.listeners = new Set();
    if (!this.load()) this.reset();
  }

  reset() {
    this.slots.fill(null);
    this.equipped = { ...STARTER.equipped };
    for (const id of STARTER.items) this.add(id, 1, { silent: true });
    this.changed();
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  changed() {
    this.save();
    for (const fn of this.listeners) fn(this);
  }

  // Add items, filling existing stacks first. Returns how many did not fit.
  add(id, count = 1, { silent = false } = {}) {
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
  move(from, to) {
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
  equip(index) {
    const s = this.slots[index];
    const slot = s && itemSlot(s.id);
    if (!slot) return false;
    const old = this.equipped[slot];
    this.equipped[slot] = s.id;
    this.slots[index] = old ? { id: old, count: 1 } : null;
    this.changed();
    return true;
  }

  // Take an equipped item off into the given grid slot, or the first free one. Everything but
  // the costume can come off (bare hands, the costume's own colours); a costume only swaps.
  unequip(slot, index = -1) {
    const id = this.equipped[slot];
    if (!id) return false;
    if (index < 0) index = this.slots.indexOf(null);
    if (index < 0) return false;
    const there = this.slots[index];
    if (there && itemSlot(there.id) !== slot) return false;
    if (!there && slot === "costume") return false;
    this.equipped[slot] = there ? there.id : null;
    this.slots[index] = { id, count: 1 };
    this.changed();
    return true;
  }

  get full() {
    return !this.slots.includes(null);
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ slots: this.slots, equipped: this.equipped }));
    } catch {
      // private mode or blocked storage: the inventory just won't persist
    }
  }

  load() {
    let data = null, migrated = false;
    try {
      data = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (!data) {
        data = JSON.parse(localStorage.getItem(OLD_KEY) || "null");
        migrated = !!data;
      }
    } catch {
      return false;
    }
    if (!data || !Array.isArray(data.slots) || data.slots.length !== this.slots.length) return false;
    this.slots = data.slots.map((s) => (s && ITEMS[s.id] && s.count > 0 ? { id: s.id, count: s.count } : null));
    for (const slot of Object.keys(this.equipped)) {
      const id = data.equipped?.[slot];
      this.equipped[slot] = id && itemSlot(id) === slot ? id : STARTER.equipped[slot];
    }
    if (migrated) {
      // v1 had no costume slot and always wore a top and bottom: white and black are the mage
      // costume's own colours, so drop them back into the bag
      for (const slot of ["top", "bottom"]) {
        const id = data.equipped?.[slot];
        if (id === "top_white" || id === "bottom_black") {
          this.equipped[slot] = null;
          this.add(id, 1, { silent: true });
        }
      }
      for (const id of NEW_COSTUMES) this.add(id, 1, { silent: true });
      this.save();
    }
    if (!this.equipped.costume) this.equipped.costume = STARTER.equipped.costume;
    return true;
  }
}

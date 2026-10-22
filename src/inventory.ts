// Inventory: a grid of slots plus what is worn (main hand, off hand, hat, top, bottom, shoes,
// two rings, two trinkets) and gold, saved in the browser. A two-handed weapon in the main hand
// keeps the off hand empty.

import { ITEMS, itemSlot, stackLimit, sortKey, fitsSlot, isTwoHanded } from "./items";
import { saveKey } from "./save";
import type { EquipSlot } from "./items";

export interface Stack {
  id: string;
  count: number;
}
export type Equipped = Record<EquipSlot, string | null>;
// Nothing worn.
export const NO_GEAR: Equipped = { weapon: null, offhand: null, top: null, bottom: null, hat: null, shoes: null, ring1: null, ring2: null, trinket1: null, trinket2: null };

export const COLS = 8;
export const ROWS = 5;
// The bag's size before extra slots (the wandering merchant's book, stat bagSlots).
export const BAG_BASE = COLS * ROWS;
const SAVE_KEY = () => saveKey("inventory.v3");
const OLD_KEYS = () => [saveKey("inventory.v2"), saveKey("inventory.v1")];

// Clothes the oldest saves (v1) were given when tops and bottoms came in.
const STARTER_CLOTHES = [
  "top_priestess", "bottom_priestess", "top_adventurer", "bottom_adventurer", "top_warrior", "bottom_warrior",
  "top_sky", "bottom_navy", "top_priestess_white", "top_adventurer_teal", "bottom_adventurer_cocoa",
  "buckler", "spell_tome", "dagger",
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

// A new bag: only what is worn (title.ts puts on the class's own gear and the chosen clothes)
// and a few potions; other weapons and clothes come from the shop and from monsters. Nothing
// on top or bottom is the plain brown T-shirt and trousers (items.ts DEFAULT_SHAPE).
export const STARTER: { equipped: Equipped } = {
  equipped: { ...NO_GEAR, weapon: "staff" },
};

export class Inventory {
  slots: (Stack | null)[] = new Array(BAG_BASE).fill(null);
  equipped: Equipped = { ...NO_GEAR };
  gold = 0;
  listeners = new Set<(inv: Inventory) => void>();

  constructor() {
    if (!this.load()) this.reset();
  }

  reset(): void {
    this.slots.fill(null);
    this.equipped = { ...STARTER.equipped };
    this.add("potion_red", 5, { silent: true });
    this.add("potion_blue", 5, { silent: true });
    this.gold = 200;
    this.changed();
  }

  // Grows or shrinks the bag to `size` slots (never below the base size). Shrinking moves what
  // lies past the end into free slots before it, and keeps any slot it can't empty.
  resize(size: number): void {
    const n = Math.max(BAG_BASE, Math.floor(size)), before = this.slots.length;
    if (n > before) this.slots.push(...new Array<Stack | null>(n - before).fill(null));
    else if (n < before) {
      for (let i = n; i < before; i++) {
        const free = this.slots.indexOf(null);
        if (this.slots[i] && free >= 0 && free < n) {
          this.slots[free] = this.slots[i];
          this.slots[i] = null;
        }
      }
      let end = before;
      while (end > n && !this.slots[end - 1]) end--;
      this.slots.length = end;
    }
    if (this.slots.length !== before) this.changed();
  }

  // A new character's gear, put on straight away (nothing left over in the bag).
  outfit(gear: Partial<Equipped>): void {
    Object.assign(this.equipped, gear);
    this.changed();
  }

  // How many of an item the bag holds.
  count(id: string): number {
    return this.slots.reduce((n, s) => n + (s?.id === id ? s.count : 0), 0);
  }

  // Take `count` of an item out of the bag (smallest stacks first). False if there aren't enough.
  take(id: string, count = 1): boolean {
    if (this.count(id) < count) return false;
    let left = count;
    const order = this.slots.map((s, i) => [s, i] as const).filter(([s]) => s?.id === id).sort((a, b) => a[0]!.count - b[0]!.count);
    for (const [s, i] of order) {
      const n = Math.min(left, s!.count);
      s!.count -= n;
      left -= n;
      if (s!.count <= 0) this.slots[i] = null;
      if (!left) break;
    }
    this.changed();
    return true;
  }

  // Throw away `count` from one grid slot (all of it by default).
  discard(index: number, count = Infinity): void {
    const s = this.slots[index];
    if (!s) return;
    s.count -= Math.min(count, s.count);
    if (s.count <= 0) this.slots[index] = null;
    this.changed();
  }

  // Merge stacks and order the bag by kind, shape, colour and name.
  sort(): void {
    const totals = new Map<string, number>();
    for (const s of this.slots) if (s) totals.set(s.id, (totals.get(s.id) ?? 0) + s.count);
    this.slots.fill(null);
    let i = 0;
    for (const id of [...totals.keys()].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))) {
      let n = totals.get(id)!;
      const max = stackLimit(id);
      while (n > 0 && i < this.slots.length) {
        this.slots[i++] = { id, count: Math.min(n, max) };
        n -= max;
      }
    }
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

  // Equip the item in a grid slot (in `slot`, else where it usually goes); whatever was worn
  // there goes back into that grid slot. Returns why not, or null.
  equipTo(index: number, slot?: EquipSlot): string | null {
    const s = this.slots[index];
    if (!s) return "ช่องว่าง";
    let to = slot ?? itemSlot(s.id);
    // a second ring or trinket goes in the other of its two slots while that one is free
    if (!slot && (to === "ring1" || to === "trinket1") && this.equipped[to]) {
      const other = to === "ring1" ? "ring2" : "trinket2";
      if (!this.equipped[other]) to = other;
    }
    if (!to || !fitsSlot(s.id, to)) return "ใส่ช่องนี้ไม่ได้";
    if (to === "offhand" && isTwoHanded(this.equipped.weapon)) return "ถืออาวุธสองมืออยู่ ถอดอาวุธก่อนจึงใส่มือรองได้";
    // a two-handed weapon needs the off hand free: what's there goes to the bag
    if (to === "weapon" && isTwoHanded(s.id) && this.equipped.offhand) {
      const free = this.slots.findIndex((x, i) => !x && i !== index);
      if (free < 0 && this.equipped.weapon) return "กระเป๋าเต็ม ถอดของมือรองไม่ได้";
      const off = this.equipped.offhand;
      this.equipped.offhand = null;
      if (free >= 0) this.slots[free] = { id: off, count: 1 };
      else {
        // the main hand was empty: the off-hand item takes the weapon's place in the grid
        this.slots[index] = { id: off, count: 1 };
        this.equipped.weapon = s.id;
        this.changed();
        return null;
      }
    }
    const old = this.equipped[to];
    this.equipped[to] = s.id;
    if (s.count > 1) {
      s.count -= 1;
      if (old && this.add(old, 1, { silent: true })) return "กระเป๋าเต็ม";
    } else this.slots[index] = old ? { id: old, count: 1 } : null;
    this.changed();
    return null;
  }

  equip(index: number): boolean {
    return this.equipTo(index) === null;
  }

  // Take an equipped item off into the given grid slot, or the first free one (bare hands; an
  // empty top or bottom slot shows the default shape).
  unequip(slot: EquipSlot, index = -1): boolean {
    const id = this.equipped[slot];
    if (!id) return false;
    if (index < 0) index = this.slots.indexOf(null);
    if (index < 0) return false;
    const there = this.slots[index];
    if (there && !fitsSlot(there.id, slot)) return false;
    // swapping a two-handed weapon in needs the off hand empty
    if (there && slot === "weapon" && isTwoHanded(there.id) && this.equipped.offhand) return false;
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
      localStorage.setItem(SAVE_KEY(), JSON.stringify({ slots: this.slots, equipped: this.equipped, gold: this.gold }));
    } catch {
      // private mode or blocked storage: the inventory just won't persist
    }
  }

  load(): boolean {
    type Saved = { slots?: ({ id: string; count: number } | null)[]; equipped?: Record<string, string | null>; gold?: number };
    let data: Saved | null = null, from = SAVE_KEY();
    try {
      for (const key of [SAVE_KEY(), ...OLD_KEYS()]) {
        data = JSON.parse(localStorage.getItem(key) || "null");
        if (data) {
          from = key;
          break;
        }
      }
    } catch {
      return false;
    }
    // (a bag saved bigger keeps its size until the slots it was given are known: resize)
    if (!data || !Array.isArray(data.slots) || data.slots.length < BAG_BASE) return false;
    const old = from !== SAVE_KEY();
    const before = !("offhand" in (data.equipped ?? {}));
    this.gold = Math.max(0, Math.floor(Number(data.gold) || 0));
    // costumes in the bag turn into their top and bottom
    const extra: string[] = [];
    let daggers = 0;
    this.slots = data.slots.map((s) => {
      if (s?.id === "dual_daggers") {
        // dual daggers became two daggers: one for each hand
        daggers++;
        return { id: "dagger", count: 1 };
      }
      if (s && COSTUME_TO_CLOTHES[s.id]) {
        const [t, b] = COSTUME_TO_CLOTHES[s.id];
        extra.push(b);
        return { id: t, count: 1 };
      }
      return s && ITEMS[s.id] && s.count > 0 ? { id: s.id, count: s.count } : null;
    });
    const eq = { ...(data.equipped ?? {}) };
    if (eq.weapon === "dual_daggers") {
      eq.weapon = "dagger";
      eq.offhand = eq.offhand ?? "dagger";
    }
    for (const slot of Object.keys(this.equipped) as EquipSlot[]) {
      const id = eq[slot];
      // (a slot saved empty stays empty; only a save from before the slot existed gets the starter)
      this.equipped[slot] = id && fitsSlot(id, slot) ? id : slot in eq || (old && slot !== "weapon") ? null : STARTER.equipped[slot];
    }
    if (old) {
      // the costume worn becomes the top and bottom worn; the dye items worn before (now mage
      // shapes) go back to the bag
      const worn = COSTUME_TO_CLOTHES[eq.costume ?? ""] ?? COSTUME_TO_CLOTHES.costume_mage;
      for (const [i, slot] of (["top", "bottom"] as const).entries()) {
        if (this.equipped[slot]) extra.push(this.equipped[slot]!);
        this.equipped[slot] = worn[i];
      }
      if (from === OLD_KEYS()[1]) extra.push(...STARTER_CLOTHES);
      for (const id of [...extra, "top_priestess", "bottom_priestess", "top_adventurer", "bottom_adventurer", "top_warrior", "bottom_warrior"]) {
        if (!this.has(id)) this.add(id, 1, { silent: true });
      }
      this.add("potion_red", 5, { silent: true });
      this.add("potion_blue", 5, { silent: true });
      this.gold = Math.max(this.gold, 200);
      this.save();
    }
    if (daggers) this.add("dagger", daggers, { silent: true });
    if (before && !old) {
      // saves from before the off hand get the new starting gear once
      for (const id of ["buckler", "spell_tome", "dagger"]) if (!this.has(id)) this.add(id, 1, { silent: true });
      this.save();
    }
    if (isTwoHanded(this.equipped.weapon) && this.equipped.offhand) {
      this.add(this.equipped.offhand, 1, { silent: true });
      this.equipped.offhand = null;
    }
    return true;
  }

  // Whether an item is in the bag or worn.
  has(id: string): boolean {
    return Object.values(this.equipped).includes(id) || this.slots.some((s) => s?.id === id);
  }
}

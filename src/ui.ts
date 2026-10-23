// Inventory window (I), and the look choices the character creator offers.
//
// Both are plain DOM panels over the canvas. Items are dragged with pointer events (works with
// mouse, pen and touch); double-click equips or takes off, and on a phone a tap opens the item's
// menu with what it does.

import { saveKey } from "./save";
import { ITEMS, EQUIP_SLOTS, describe, itemSlot, fitsSlot, isTwoHanded } from "./items";
import type { EquipSlot } from "./items";
import { COLS } from "./inventory";
import type { Inventory } from "./inventory";
import type { Dye } from "./recolor";
import type { Img } from "./types";
import { isTouch } from "./touch";

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (parent) parent.append(e);
  return e;
}

// A draggable window with a title bar and a close button.
export function makeWindow(id: string, title: string, key: string): HTMLElement {
  const win = el("section", "window hidden");
  win.id = id;
  win.setAttribute("aria-label", title);
  const bar = el("header", "window-bar", win);
  el("h2", "", bar).textContent = title;
  const k = el("kbd", "", bar);
  k.textContent = key;
  const close = el("button", "window-close", bar);
  close.type = "button";
  close.setAttribute("aria-label", "ปิด");
  close.textContent = "×";
  close.addEventListener("click", () => win.classList.add("hidden"));
  // drag by the title bar; the window is pinned where it stands first (some windows are
  // centred with a transform, which would otherwise make them jump)
  bar.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || isTouch() || (e.target instanceof Element && e.target.closest(".window-close"))) return;
    e.preventDefault();
    const r = win.getBoundingClientRect();
    Object.assign(win.style, { transform: "none", left: `${r.left}px`, top: `${r.top}px`, right: "auto" });
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    bar.setPointerCapture(e.pointerId);
    bar.classList.add("dragging");
    const move = (ev: PointerEvent) => {
      win.style.left = `${Math.max(0, Math.min(innerWidth - r.width, ev.clientX - dx))}px`;
      win.style.top = `${Math.max(0, Math.min(innerHeight - 40, ev.clientY - dy))}px`;
    };
    const up = () => {
      bar.classList.remove("dragging");
      bar.removeEventListener("pointermove", move);
      bar.removeEventListener("pointerup", up);
      bar.removeEventListener("pointercancel", up);
    };
    bar.addEventListener("pointermove", move);
    bar.addEventListener("pointerup", up);
    bar.addEventListener("pointercancel", up);
  });
  document.body.append(win);
  return win;
}

export class InventoryUI {
  inv: Inventory;
  icons: (id: string) => Img | null;
  use: (index: number) => string;
  win: HTMLElement;
  equipEls: Record<string, HTMLElement> = {};
  grid: HTMLElement;
  cells: HTMLElement[];
  tip: HTMLElement;
  status: HTMLElement;
  gold: HTMLElement;
  menu: HTMLElement;
  wearable: (id: string) => string | null;

  // icons(id) -> canvas or image for an item; use(index) reads a book, drinks a potion or
  // uses another item and returns a message
  // wearable(id): why an item can't be worn yet, or null
  constructor(inv: Inventory, icons: (id: string) => Img | null, use: (index: number) => string, wearable: (id: string) => string | null = () => null) {
    this.inv = inv;
    this.icons = icons;
    this.use = use;
    this.wearable = wearable;
    this.win = makeWindow("inventory", "กระเป๋า", "I");
    const body = el("div", "inv-body", this.win);
    const equip = el("div", "inv-equip", body);
    for (const { slot, name } of EQUIP_SLOTS) {
      const box = el("div", "inv-equip-row", equip);
      const cell = el("div", "inv-cell equip", box);
      cell.dataset.equip = slot;
      el("span", "inv-equip-label", box).textContent = name;
      this.equipEls[slot] = cell;
    }
    this.grid = el("div", "inv-grid", body);
    this.grid.style.setProperty("--cols", String(COLS));
    this.cells = [];
    this.tip = el("div", "inv-tip hidden", document.body);
    const foot = el("div", "inv-foot", this.win);
    this.gold = el("span", "inv-gold", foot);
    const sort = el("button", "wr-choice inv-sort", foot);
    sort.type = "button";
    sort.textContent = "เรียงของ";
    sort.addEventListener("click", () => {
      this.inv.sort();
      this.flash("เรียงของแล้ว", true);
    });
    this.status = el("p", "inv-status", this.win);
    this.menu = el("div", "inv-menu hidden", document.body);
    window.addEventListener("pointerdown", (e) => {
      if (!(e.target instanceof Node && this.menu.contains(e.target))) this.closeMenu();
    });
    window.addEventListener("keydown", (e) => e.code === "Escape" && this.closeMenu());
    inv.onChange(() => this.render());
    this.bindPointer();
    this.render();
  }

  toggle(show = this.win.classList.contains("hidden")): void {
    this.win.classList.toggle("hidden", !show);
    this.tip.classList.add("hidden");
    this.closeMenu();
  }

  closeMenu(): void {
    this.menu.classList.add("hidden");
  }

  // A button in the item menu.
  menuButton(text: string, fn: () => void, danger = false): void {
    const b = el("button", `inv-menu-btn${danger ? " danger" : ""}`, this.menu);
    b.type = "button";
    b.textContent = text;
    b.addEventListener("click", () => {
      this.closeMenu();
      fn();
    });
  }

  // The item's name, and with `info` what it does (a tap has no hover tooltip).
  menuHead(id: string, info: boolean): void {
    el("p", "inv-menu-q", this.menu).textContent = ITEMS[id].name;
    if (!info) return;
    const why = itemSlot(id) ? this.wearable(id) : null;
    el("div", "inv-menu-info", this.menu).innerHTML = `${describe(id)}${why ? `<span class="inv-tip-why">${why}</span>` : ""}`;
  }

  placeMenu(x: number, y: number): void {
    this.menu.classList.remove("hidden");
    const r = this.menu.getBoundingClientRect();
    this.menu.style.left = `${Math.max(8, Math.min(innerWidth - r.width - 8, x))}px`;
    this.menu.style.top = `${Math.max(8, Math.min(innerHeight - r.height - 8, y))}px`;
  }

  // Menu for a worn item (taps on an equipment cell).
  openEquipMenu(slot: EquipSlot, x: number, y: number): void {
    const id = this.inv.equipped[slot];
    if (!id) return;
    this.menu.replaceChildren();
    this.menuHead(id, true);
    this.menuButton("ถอด", () => this.flash(this.inv.unequip(slot) ? null : "ถอดไม่ได้: กระเป๋าเต็ม"));
    this.placeMenu(x, y);
  }

  // Right-click menu for a bag slot; confirm: go straight to "throw it all away?"; info: also
  // say what the item does.
  openMenu(index: number, x: number, y: number, confirm = false, info = false): void {
    const s = this.inv.slots[index];
    if (!s) return;
    const item = ITEMS[s.id];
    this.menu.replaceChildren();
    const button = (text: string, fn: () => void, danger = false) => this.menuButton(text, fn, danger);
    const ask = (count: number) => {
      this.menu.replaceChildren();
      el("p", "inv-menu-q", this.menu).textContent = `ทิ้ง${item.name}${count > 1 ? ` × ${count}` : ""}? ทิ้งแล้วเอาคืนไม่ได้`;
      button("ทิ้ง", () => {
        this.inv.discard(index, count);
        this.flash(`ทิ้ง${item.name}แล้ว`);
      }, true);
      button("ยกเลิก", () => undefined);
    };
    if (confirm) ask(s.count);
    else {
      this.menuHead(s.id, info);
      if (item.kind === "potion" || item.kind === "book" || item.kind === "style") button(item.kind === "potion" ? "ดื่ม" : "อ่าน", () => this.flash(this.use(index), true));
      else if (itemSlot(s.id)) {
        button(item.kind === "weapon" ? "ใส่มือหลัก" : "สวมใส่", () => this.wear(index));
        if (item.kind === "weapon" && fitsSlot(s.id, "offhand")) button("ใส่มือรอง", () => this.wear(index, "offhand"));
      }
      if (s.count > 1) button("ทิ้ง 1 ชิ้น", () => ask(1), true);
      button(s.count > 1 ? `ทิ้งทั้งหมด (${s.count})` : "ทิ้ง", () => ask(s.count), true);
    }
    this.placeMenu(x, y);
  }

  fill(cell: HTMLElement, id: string | null | undefined, count: number | undefined): void {
    cell.replaceChildren();
    cell.classList.toggle("filled", !!id);
    cell.classList.toggle("unready", !!id && !!itemSlot(id) && !!this.wearable(id));
    if (!id) return;
    const icon = this.icons(id);
    if (icon) {
      const c = icon.cloneNode(true) as Img;
      if (c instanceof HTMLCanvasElement) c.getContext("2d")!.drawImage(icon, 0, 0);
      c.classList.add("inv-icon");
      cell.append(c);
    }
    if (count && count > 1) el("span", "inv-count", cell).textContent = String(count);
  }

  render(): void {
    // one cell per slot (the bag grows with the wandering merchant's book)
    while (this.cells.length < this.inv.slots.length) {
      const c = el("div", "inv-cell", this.grid);
      c.dataset.index = String(this.cells.length);
      this.cells.push(c);
    }
    while (this.cells.length > this.inv.slots.length) this.cells.pop()!.remove();
    this.inv.slots.forEach((s, i) => this.fill(this.cells[i], s?.id, s?.count));
    for (const [slot, cell] of Object.entries(this.equipEls)) this.fill(cell, this.inv.equipped[slot as EquipSlot], 1);
    // a two-handed weapon fills both hands: show it faded in the off-hand cell too
    const both = isTwoHanded(this.inv.equipped.weapon) && !this.inv.equipped.offhand;
    this.equipEls.offhand.classList.toggle("held", both);
    if (both) this.fill(this.equipEls.offhand, this.inv.equipped.weapon, 1);
    const used = this.inv.slots.filter(Boolean).length;
    this.status.textContent = isTouch()
      ? `${used} / ${this.inv.slots.length} ช่อง · แตะไอเท็มเพื่อดูว่าทำอะไรได้ · ลากเพื่อย้ายหรือใส่`
      : `${used} / ${this.inv.slots.length} ช่อง · ลากเพื่อย้าย · ดับเบิลคลิกเพื่อใส่ ถอด ดื่ม หรืออ่าน · คลิกขวาหรือลากออกนอกกระเป๋าเพื่อทิ้ง`;
    this.gold.innerHTML = `<img src="assets/skills/gold_coin.png" alt="">${this.inv.gold.toLocaleString()} ทอง`;
  }

  // What item a cell shows.
  itemAt(cell: HTMLElement): string | null | undefined {
    if (cell.dataset.equip) {
      const slot = cell.dataset.equip as EquipSlot;
      // the off-hand cell shows a two-handed main weapon but doesn't hold it
      if (slot === "offhand" && !this.inv.equipped.offhand && isTwoHanded(this.inv.equipped.weapon)) return null;
      return this.inv.equipped[slot];
    }
    return this.inv.slots[Number(cell.dataset.index)]?.id;
  }

  showTip(cell: HTMLElement, x: number, y: number): void {
    const id = this.itemAt(cell);
    if (!id) {
      this.tip.classList.add("hidden");
      return;
    }
    const item = ITEMS[id];
    const kind = { weapon: "อาวุธ", offhand: "มือรอง", top: "เสื้อ", bottom: "กางเกง/กระโปรง", hat: "หมวก", shoes: "รองเท้า", ring: "แหวน",
      trinket: "เครื่องประดับ", potion: "ยา", material: "วัตถุดิบ", book: "ตำรา", style: "ตำราทำผม" }[item.kind];
    const why = itemSlot(id) ? this.wearable(id) : null;
    this.tip.innerHTML = `<strong>${item.name}</strong><span class="inv-tip-kind">${kind}</span>${describe(id)}${why ? `<span class="inv-tip-why">${why}</span>` : ""}`;
    this.tip.classList.remove("hidden");
    const r = this.tip.getBoundingClientRect();
    this.tip.style.left = `${Math.min(innerWidth - r.width - 8, x + 16)}px`;
    this.tip.style.top = `${Math.min(innerHeight - r.height - 8, y + 16)}px`;
  }

  bindPointer(): void {
    let drag: { from: HTMLElement; ghost: Img | undefined; x: number; y: number; moved: boolean; touch: boolean } | null = null;
    const cellFrom = (target: EventTarget | null) => (target instanceof Element ? target.closest<HTMLElement>(".inv-cell") : null);
    this.win.addEventListener("pointerover", (e) => {
      const c = cellFrom(e.target);
      if (c && !drag) this.showTip(c, e.clientX, e.clientY);
    });
    this.win.addEventListener("pointerout", (e) => {
      if (!cellFrom(e.relatedTarget)) this.tip.classList.add("hidden");
    });
    this.win.addEventListener("dblclick", (e) => {
      const c = cellFrom(e.target);
      if (!c) return;
      if (c.dataset.equip) {
        if (this.itemAt(c)) this.flash(this.inv.unequip(c.dataset.equip as EquipSlot) ? null : "ถอดไม่ได้: กระเป๋าเต็ม");
      }
      else if (this.inv.slots[Number(c.dataset.index)]) {
        const i = Number(c.dataset.index);
        const kind = ITEMS[this.inv.slots[i]!.id].kind;
        if (kind === "book" || kind === "potion" || kind === "style") this.flash(this.use(i), true);
        else this.wear(i);
      }
      this.tip.classList.add("hidden");
    });
    this.win.addEventListener("contextmenu", (e) => {
      const c = cellFrom(e.target);
      e.preventDefault();
      if (c && !c.dataset.equip && this.itemAt(c)) {
        this.tip.classList.add("hidden");
        this.openMenu(Number(c.dataset.index), e.clientX, e.clientY);
      }
    });
    this.win.addEventListener("pointerdown", (e) => {
      const c = cellFrom(e.target);
      if (!c || e.button !== 0 || !this.itemAt(c)) return;
      e.preventDefault();
      const src = c.querySelector<HTMLCanvasElement | HTMLImageElement>(".inv-icon");
      const ghost = src?.cloneNode(true) as Img | undefined;
      if (src && ghost instanceof HTMLCanvasElement) ghost.getContext("2d")!.drawImage(src, 0, 0);
      drag = { from: c, ghost, x: e.clientX, y: e.clientY, moved: false, touch: e.pointerType === "touch" };
      this.tip.classList.add("hidden");
    });
    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) {
        drag.moved = true;
        if (drag.ghost) {
          drag.ghost.classList.add("inv-ghost");
          document.body.append(drag.ghost);
        }
        drag.from.classList.add("dragging");
      }
      if (drag.moved && drag.ghost) {
        drag.ghost.style.left = `${e.clientX}px`;
        drag.ghost.style.top = `${e.clientY}px`;
      }
    });
    window.addEventListener("pointerup", (e) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      d.ghost?.remove();
      d.from.classList.remove("dragging");
      if (!d.moved) {
        // a tap with a finger: the item's menu
        if (d.touch && d.from.dataset.equip) this.openEquipMenu(d.from.dataset.equip as EquipSlot, e.clientX, e.clientY);
        else if (d.touch) this.openMenu(Number(d.from.dataset.index), e.clientX, e.clientY, false, true);
        return;
      }
      const over = document.elementFromPoint(e.clientX, e.clientY);
      // dropped outside the bag, onto the game: ask before throwing it away
      if (!d.from.dataset.equip && over instanceof Element && !this.win.contains(over) && over.id === "game") {
        this.openMenu(Number(d.from.dataset.index), e.clientX, e.clientY, true);
        return;
      }
      const to = cellFrom(over);
      if (!to || to === d.from) return;
      this.drop(d.from, to);
    });
  }

  drop(from: HTMLElement, to: HTMLElement): void {
    const inv = this.inv;
    if (from.dataset.equip) {
      // taking something off onto a grid cell
      if (to.dataset.equip) return;
      if (!inv.unequip(from.dataset.equip as EquipSlot, Number(to.dataset.index))) this.flash("วางตรงนั้นไม่ได้");
      return;
    }
    const fi = Number(from.dataset.index);
    if (to.dataset.equip) {
      const slot = to.dataset.equip as EquipSlot;
      if (!fitsSlot(inv.slots[fi]?.id, slot)) {
        this.flash(slot === "offhand" && isTwoHanded(inv.slots[fi]?.id) ? "อาวุธสองมือใส่ได้แค่ช่องมือหลัก" : "ใส่ช่องนี้ไม่ได้");
        return;
      }
      this.wear(fi, slot);
      return;
    }
    inv.move(fi, Number(to.dataset.index));
  }

  // Put on the item in a bag slot (into `slot`, or where it normally goes), unless it can't be
  // worn yet.
  wear(index: number, slot?: EquipSlot): void {
    const id = this.inv.slots[index]?.id;
    if (!id || !itemSlot(id)) return this.flash("ไอเท็มนี้สวมใส่ไม่ได้");
    const why = this.wearable(id);
    if (why) return this.flash(why);
    const was = this.inv.equipped.offhand;
    const err = this.inv.equipTo(index, slot);
    if (err) return this.flash(err);
    if (was && !this.inv.equipped.offhand) this.flash(`${ITEMS[was].name} กลับเข้ากระเป๋า (อาวุธสองมือ)`);
  }

  flash(msg: string | null, good = false): void {
    if (!msg) return;
    this.status.textContent = msg;
    this.status.classList.toggle("good", good);
    this.status.classList.remove("warn");
    void this.status.offsetWidth;
    this.status.classList.add("warn");
  }
}

// Look choices for the character creator (src/title.ts): build, hairstyle, hair colour, eye
// colour. A hairstyle is locked until its head layer is in assets/chars/hair.json.
export interface Choice {
  id: string;
  name: string;
  locked?: boolean;
}
export interface ColorChoice extends Choice, Dye {}

export const GENDERS: Choice[] = [
  { id: "female", name: "หญิง" },
  { id: "male", name: "ชาย" },
];
export const HAIRSTYLES: Choice[] = [
  { id: "twintail", name: "ทวินเทลยาว" },
  { id: "hime", name: "ยาวหน้าม้าตรง" },
  { id: "bob", name: "บ็อบธรรมดา" },
  { id: "ponytail", name: "หางม้าสูง" },
  { id: "sidebraid", name: "เปียข้างพาดไหล่" },
  { id: "buns", name: "ซาลาเปาคู่" },
  { id: "wavy", name: "ยาวลอนใหญ่" },
  { id: "pixie", name: "พิกซี่สั้น" },
  { id: "halfup", name: "ยาวมัดครึ่งหัว" },
  { id: "twinbraids", name: "เปียคู่" },
  { id: "crown", name: "เปียมงกุฎ" },
];
export const HAIR_COLORS: ColorChoice[] = [
  { id: "silver", name: "สีเดิม", hue: null, sat: 0 },
  { id: "gold", name: "ทอง", hue: 44, sat: 0.62, light: 0.02 },
  { id: "rose", name: "ชมพู", hue: 335, sat: 0.55, light: 0 },
  { id: "sky", name: "ฟ้า", hue: 200, sat: 0.6, light: -0.02 },
  { id: "mint", name: "เขียว", hue: 150, sat: 0.45, light: -0.02 },
  { id: "ink", name: "ดำ", hue: 240, sat: 0.18, light: -0.42 },
  { id: "auburn", name: "แดงน้ำตาล", hue: 12, sat: 0.6, light: -0.18 },
];
export const EYE_COLORS: ColorChoice[] = [
  { id: "teal", name: "เขียวมรกต", hue: null, sat: 0 },
  { id: "amber", name: "อำพัน", hue: 38, sat: 0.85, light: 0 },
  { id: "violet", name: "ม่วง", hue: 275, sat: 0.6, light: 0 },
  { id: "crimson", name: "แดง", hue: 355, sat: 0.75, light: 0 },
  { id: "blue", name: "น้ำเงิน", hue: 215, sat: 0.75, light: 0 },
];


// available: hairstyle ids that have head layers
export interface Look {
  gender: string;
  hair: string;
  hairColor: string;
  eyes: string;
  styles?: string[]; // the hairstyles it has learned (the plain bob always)
}

// Everyone has the plain bob; an older character also keeps the hairstyle it wore.
export function loadLook(available: Set<string>): Look {
  const look: Look = { gender: "female", hair: "bob", hairColor: "silver", eyes: "teal" };
  try {
    Object.assign(look, JSON.parse(localStorage.getItem(saveKey("look.v1")) || "{}"));
  } catch {
    // keep the defaults
  }
  if (!GENDERS.some((g) => g.id === look.gender)) look.gender = "female";
  if (look.hair !== "twintail" && !available.has(look.hair)) look.hair = "bob";
  look.styles = [...new Set(["bob", ...(look.styles ?? []), look.hair])];
  if (!HAIR_COLORS.some((c) => c.id === look.hairColor)) look.hairColor = "silver";
  if (!EYE_COLORS.some((c) => c.id === look.eyes)) look.eyes = "teal";
  return look;
}

// A swatch's colour for a hair or eye dye.
export function swatchColor(c: ColorChoice, key: "hairColor" | "eyes"): string {
  if (c.hue === null || c.hue === undefined) return key === "eyes" ? "#3fb7a6" : "#d9d6e8";
  return `hsl(${c.hue} ${Math.round(c.sat * 100)}% ${key === "eyes" ? 50 : 62 + (c.light ?? 0) * 40}%)`;
}

export function saveLook(look: Look): void {
  try {
    localStorage.setItem(saveKey("look.v1"), JSON.stringify(look));
  } catch {
    // not persisted
  }
}

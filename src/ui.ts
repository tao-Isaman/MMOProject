// Inventory window (I) and wardrobe window (C).
//
// Both are plain DOM panels over the canvas. Items are dragged with pointer events (works with
// mouse, pen and touch); double-click equips or takes off.

import { ITEMS, EQUIP_SLOTS, describe, itemSlot } from "./items";
import type { EquipSlot } from "./items";
import { COLS } from "./inventory";
import type { Inventory } from "./inventory";
import type { Dye } from "./recolor";
import type { Img } from "./types";

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
  // drag by the title bar
  bar.addEventListener("pointerdown", (e) => {
    if (e.target === close) return;
    const r = win.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    bar.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      win.style.left = `${Math.max(0, Math.min(innerWidth - r.width, ev.clientX - dx))}px`;
      win.style.top = `${Math.max(0, Math.min(innerHeight - 40, ev.clientY - dy))}px`;
      win.style.right = "auto";
    };
    const up = () => {
      bar.removeEventListener("pointermove", move);
      bar.removeEventListener("pointerup", up);
    };
    bar.addEventListener("pointermove", move);
    bar.addEventListener("pointerup", up);
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

  // icons(id) -> canvas or image for an item; use(index) reads a book or other usable item
  // and returns a message
  constructor(inv: Inventory, icons: (id: string) => Img | null, use: (index: number) => string) {
    this.inv = inv;
    this.icons = icons;
    this.use = use;
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
    this.cells = inv.slots.map((_, i) => {
      const c = el("div", "inv-cell", this.grid);
      c.dataset.index = String(i);
      return c;
    });
    this.tip = el("div", "inv-tip hidden", document.body);
    this.status = el("p", "inv-status", this.win);
    inv.onChange(() => this.render());
    this.bindPointer();
    this.render();
  }

  toggle(show = this.win.classList.contains("hidden")): void {
    this.win.classList.toggle("hidden", !show);
    this.tip.classList.add("hidden");
  }

  fill(cell: HTMLElement, id: string | null | undefined, count: number | undefined): void {
    cell.replaceChildren();
    cell.classList.toggle("filled", !!id);
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
    this.inv.slots.forEach((s, i) => this.fill(this.cells[i], s?.id, s?.count));
    for (const [slot, cell] of Object.entries(this.equipEls)) this.fill(cell, this.inv.equipped[slot as EquipSlot], 1);
    const used = this.inv.slots.filter(Boolean).length;
    this.status.textContent = `${used} / ${this.inv.slots.length} ช่อง · ลากเพื่อย้าย · ดับเบิลคลิกเพื่อใส่ ถอด หรืออ่าน`;
  }

  // What item a cell shows.
  itemAt(cell: HTMLElement): string | null | undefined {
    if (cell.dataset.equip) return this.inv.equipped[cell.dataset.equip as EquipSlot];
    return this.inv.slots[Number(cell.dataset.index)]?.id;
  }

  showTip(cell: HTMLElement, x: number, y: number): void {
    const id = this.itemAt(cell);
    if (!id) {
      this.tip.classList.add("hidden");
      return;
    }
    const item = ITEMS[id];
    const kind = { weapon: "อาวุธ", top: "เสื้อ", bottom: "กางเกง/กระโปรง", material: "วัตถุดิบ", book: "คัมภีร์" }[item.kind];
    this.tip.innerHTML = `<strong>${item.name}</strong><span class="inv-tip-kind">${kind}</span>${describe(id)}`;
    this.tip.classList.remove("hidden");
    const r = this.tip.getBoundingClientRect();
    this.tip.style.left = `${Math.min(innerWidth - r.width - 8, x + 16)}px`;
    this.tip.style.top = `${Math.min(innerHeight - r.height - 8, y + 16)}px`;
  }

  bindPointer(): void {
    let drag: { from: HTMLElement; ghost: Img | undefined; x: number; y: number; moved: boolean } | null = null;
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
      if (c.dataset.equip) this.flash(this.inv.unequip(c.dataset.equip as EquipSlot) ? null : "ถอดไม่ได้: กระเป๋าเต็ม");
      else if (this.inv.slots[Number(c.dataset.index)]) {
        const i = Number(c.dataset.index);
        if (ITEMS[this.inv.slots[i]!.id].kind === "book") this.flash(this.use(i), true);
        else this.flash(this.inv.equip(i) ? null : "ไอเท็มนี้สวมใส่ไม่ได้");
      }
      this.tip.classList.add("hidden");
    });
    this.win.addEventListener("pointerdown", (e) => {
      const c = cellFrom(e.target);
      if (!c || e.button !== 0 || !this.itemAt(c)) return;
      e.preventDefault();
      const src = c.querySelector<HTMLCanvasElement | HTMLImageElement>(".inv-icon");
      const ghost = src?.cloneNode(true) as Img | undefined;
      if (src && ghost instanceof HTMLCanvasElement) ghost.getContext("2d")!.drawImage(src, 0, 0);
      drag = { from: c, ghost, x: e.clientX, y: e.clientY, moved: false };
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
      if (!d.moved) return;
      const to = cellFrom(document.elementFromPoint(e.clientX, e.clientY));
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
      if (itemSlot(inv.slots[fi]?.id) !== to.dataset.equip) {
        this.flash("ใส่ช่องนี้ไม่ได้");
        return;
      }
      inv.equip(fi);
      return;
    }
    inv.move(fi, Number(to.dataset.index));
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

// Wardrobe: character, hairstyle, hair colour, eye colour, with a live preview. A hairstyle
// is locked until its head layer is in assets/chars/hair.json.
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
  { id: "bob", name: "บ็อบสั้น" },
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

const LOOK_KEY = "mmoproject.look.v1";

// available: hairstyle ids that have head layers
export interface Look {
  gender: string;
  hair: string;
  hairColor: string;
  eyes: string;
}

export function loadLook(available: Set<string>): Look {
  const look: Look = { gender: "female", hair: "twintail", hairColor: "silver", eyes: "teal" };
  try {
    Object.assign(look, JSON.parse(localStorage.getItem(LOOK_KEY) || "{}"));
  } catch {
    // keep the defaults
  }
  if (!GENDERS.some((g) => g.id === look.gender)) look.gender = "female";
  if (look.hair !== "twintail" && !available.has(look.hair)) look.hair = "twintail";
  if (!HAIR_COLORS.some((c) => c.id === look.hairColor)) look.hairColor = "silver";
  if (!EYE_COLORS.some((c) => c.id === look.eyes)) look.eyes = "teal";
  return look;
}

export class WardrobeUI {
  look: Look;
  available: Set<string>;
  noteFor: (look: Look) => string;
  drawPreview: (cv: HTMLCanvasElement, look: Look, turn: number) => void;
  onChange: (look: Look) => void;
  win: HTMLElement;
  canvas: HTMLCanvasElement;
  turn = 0;
  note: HTMLElement;

  // drawPreview(canvas, look) paints the character; onChange(look) applies it in game;
  // available: hairstyle ids with head layers; note(look) explains what the clothes override
  constructor(look: Look, drawPreview: (cv: HTMLCanvasElement, look: Look, turn: number) => void, onChange: (look: Look) => void,
    available: Set<string>, note: (look: Look) => string) {
    this.look = look;
    this.available = available;
    this.noteFor = note;
    this.drawPreview = drawPreview;
    this.onChange = onChange;
    this.win = makeWindow("wardrobe", "แต่งตัว", "C");
    const body = el("div", "wr-body", this.win);
    const left = el("div", "wr-preview", body);
    this.canvas = el("canvas", "", left);
    this.canvas.width = 192;
    this.canvas.height = 192;
    const turn = el("div", "wr-turn", left);
    for (const [label, d] of [["◀", 1], ["▶", -1]] as const) {
      const b = el("button", "wr-btn", turn);
      b.type = "button";
      b.textContent = label;
      b.setAttribute("aria-label", d > 0 ? "หมุนซ้าย" : "หมุนขวา");
      b.addEventListener("click", () => {
        this.turn = (this.turn + d + 8) % 8;
        this.preview();
      });
    }
    const right = el("div", "wr-options", body);
    this.group(right, "ตัวละคร", GENDERS, "gender", (o) => o.name);
    const hairs = HAIRSTYLES.map((h) => ({ ...h, locked: h.id !== "twintail" && !available.has(h.id) }));
    this.group(right, "ทรงผม", hairs, "hair", (o) => o.name);
    this.group(right, "สีผม", HAIR_COLORS, "hairColor");
    this.group(right, "สีตา", EYE_COLORS, "eyes");
    this.note = el("p", "wr-note", right);
  }

  group(parent: HTMLElement, title: string, options: (Choice | ColorChoice)[], key: keyof Look, label?: (o: Choice) => string): void {
    el("h3", "", parent).textContent = title;
    const row = el("div", label ? "wr-choices" : "wr-swatches", parent);
    for (const o of options) {
      const b = el("button", label ? "wr-choice" : "wr-swatch", row);
      b.type = "button";
      b.dataset.key = key;
      b.dataset.id = o.id;
      b.title = o.locked ? `${o.name} (เร็วๆ นี้)` : o.name;
      if (label) b.textContent = o.locked ? `${o.name} · เร็วๆ นี้` : o.name;
      else b.style.setProperty("--swatch", swatchColor(o as ColorChoice, key));
      b.disabled = !!o.locked;
      b.addEventListener("click", () => {
        this.look[key] = o.id;
        try {
          localStorage.setItem(LOOK_KEY, JSON.stringify(this.look));
        } catch {
          // not persisted
        }
        this.sync();
        this.onChange(this.look);
      });
    }
  }

  sync(): void {
    for (const b of this.win.querySelectorAll<HTMLElement>("[data-key]")) b.classList.toggle("on", this.look[b.dataset.key as keyof Look] === b.dataset.id);
    this.note.textContent = this.noteFor(this.look);
    this.preview();
  }

  preview(): void {
    this.drawPreview(this.canvas, this.look, this.turn);
  }

  toggle(show = this.win.classList.contains("hidden")): void {
    this.win.classList.toggle("hidden", !show);
    if (show) this.sync();
  }
}

function swatchColor(o: ColorChoice, key: string): string {
  if (o.hue === null) return key === "eyes" ? "#2bb5a3" : "#d8d4ec";
  const l = key === "eyes" ? 45 : Math.round(62 + (o.light || 0) * 100);
  return `hsl(${o.hue} ${Math.round(o.sat * 100)}% ${l}%)`;
}

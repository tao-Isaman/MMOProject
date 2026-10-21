// The merchant by the market cart and her shop window: buy potions, off-hand gear, clothes and
// books for gold, sell back anything in the bag that isn't worn.
//
// Her sprite is the first adventurer body generated in Oriverse (8 directions, standing).

import { mapX, mapY } from "./projection";
import { directionIndex, viewRow } from "./player";
import { ITEMS, sellPrice, stackLimit } from "./items";
import { el, makeWindow } from "./ui";
import type { Inventory } from "./inventory";
import type { Img, Vec2, View } from "./types";

const CELL = 96;
const HEIGHT = 128;   // on-screen height, like the player
export const TALK_RANGE = 190; // cm

export const MERCHANT = { x: 900, y: 690, name: "มิร่า", title: "ร้านค้า" };

export const STOCK = [
  "potion_red", "potion_red_big", "potion_blue", "potion_blue_big",
  "buckler", "kite_shield", "alchemy_flask", "spell_tome", "grimoire", "dagger",
  "top_priestess_white", "bottom_priestess_white", "top_adventurer_teal", "bottom_adventurer_sand",
  "top_mint", "bottom_forest", "top_warrior_navy", "bottom_warrior_cocoa",
  "book_survivor", "book_gathering", "book_lightning",
];

export class Npc {
  x: number;
  y: number;
  name: string;
  title: string;
  sheet: Img;
  dir = 0;
  radius = 30;
  time = 0;

  constructor(spec: { x: number; y: number; name: string; title: string }, sheet: Img) {
    this.x = spec.x;
    this.y = spec.y;
    this.name = spec.name;
    this.title = spec.title;
    this.sheet = sheet;
  }

  get depth(): number {
    return mapY(this.x, this.y);
  }

  // Turns to face the player when they come close.
  update(dt: number, player: Vec2): void {
    this.time += dt;
    const dx = player.x - this.x, dy = player.y - this.y;
    if (Math.hypot(dx, dy) < 600) this.dir = directionIndex(dx, dy);
  }

  distance(p: Vec2): number {
    return Math.hypot(p.x - this.x, p.y - this.y);
  }

  // Whether a map point is on her (for clicks).
  contains(mx: number, my: number): boolean {
    const gx = mapX(this.x, this.y), gy = mapY(this.x, this.y);
    return Math.abs(mx - gx) < 34 && my < gy + 10 && my > gy - HEIGHT;
  }

  draw(ctx: CanvasRenderingContext2D, view: View, near: boolean): void {
    const { k, ox, oy } = view;
    const gx = mapX(this.x, this.y) * k + ox, gy = mapY(this.x, this.y) * k + oy;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(16, 30, 10, 0.34)";
    ctx.beginPath();
    ctx.ellipse(gx, gy, 30 * k, 12.6 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    const s = (HEIGHT / (CELL * 0.92)) * k * (1 + 0.012 * Math.sin(this.time * 2.2));
    const row = viewRow(this.dir);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.sheet, 0, row * CELL, CELL, CELL, gx - (CELL / 2) * s, gy - CELL * s, CELL * s, CELL * s);
    ctx.imageSmoothingEnabled = true;
    // name and role over the head; a bag that bobs when she's in reach
    const top = gy - HEIGHT * k - 12 * k;
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    ctx.font = `600 ${15 * k}px Kanit, sans-serif`;
    ctx.lineWidth = 4 * k;
    ctx.strokeStyle = "rgba(10, 14, 8, 0.85)";
    ctx.strokeText(this.name, gx, top);
    ctx.fillStyle = "#ffe6a8";
    ctx.fillText(this.name, gx, top);
    ctx.font = `${12 * k}px Kanit, sans-serif`;
    const label = near ? `${this.title} · คลิกหรือกด F` : this.title;
    ctx.strokeText(label, gx, top - 17 * k);
    ctx.fillStyle = near ? "#9df0b4" : "#d8d2bf";
    ctx.fillText(label, gx, top - 17 * k);
    ctx.textAlign = "start";
  }
}

// ---- shop window ----
export class ShopUI {
  inv: Inventory;
  icons: (id: string) => Img | null;
  win: HTMLElement;
  tab: "buy" | "sell" = "buy";
  tabs: HTMLElement;
  list: HTMLElement;
  gold: HTMLElement;
  status: HTMLElement;
  qty = new Map<string, number>();

  constructor(inv: Inventory, icons: (id: string) => Img | null) {
    this.inv = inv;
    this.icons = icons;
    this.win = makeWindow("shop", `${MERCHANT.title} · ${MERCHANT.name}`, "F");
    const top = el("div", "shop-top", this.win);
    this.tabs = el("div", "sk-tabs", top);
    for (const [id, name] of [["buy", "ซื้อ"], ["sell", "ขาย"]] as const) {
      const b = el("button", "sk-tab", this.tabs);
      b.type = "button";
      b.dataset.tab = id;
      b.textContent = name;
      b.addEventListener("click", () => {
        this.tab = id;
        this.render();
      });
    }
    this.gold = el("span", "inv-gold", top);
    this.list = el("div", "shop-list", this.win);
    this.status = el("p", "inv-status", this.win);
    inv.onChange(() => this.render());
    window.addEventListener("item-icons", () => this.render());
  }

  get open(): boolean {
    return !this.win.classList.contains("hidden");
  }

  toggle(show = !this.open): void {
    this.win.classList.toggle("hidden", !show);
    if (show) {
      this.status.textContent = "ยินดีต้อนรับจ้า ยา เสื้อผ้า คัมภีร์ มีครบ ของในกระเป๋าก็รับซื้อนะ";
      this.render();
    }
  }

  say(msg: string, good = false): void {
    this.status.textContent = msg;
    this.status.classList.toggle("good", good);
    this.status.classList.remove("warn");
    void this.status.offsetWidth;
    this.status.classList.add("warn");
  }

  iconCell(parent: HTMLElement, id: string): void {
    const cell = el("span", "inv-cell shop-icon", parent);
    const icon = this.icons(id);
    if (icon) {
      const c = icon.cloneNode(true) as Img;
      if (c instanceof HTMLCanvasElement) c.getContext("2d")!.drawImage(icon, 0, 0);
      c.classList.add("inv-icon");
      cell.append(c);
    }
  }

  render(): void {
    if (!this.open) return;
    for (const b of this.tabs.children) b.classList.toggle("on", (b as HTMLElement).dataset.tab === this.tab);
    this.gold.innerHTML = `<i></i>${this.inv.gold.toLocaleString()} ทอง`;
    this.list.replaceChildren();
    if (this.tab === "buy") this.renderBuy();
    else this.renderSell();
  }

  renderBuy(): void {
    for (const id of STOCK) {
      const item = ITEMS[id], price = item.price ?? 0;
      const row = el("div", "shop-row", this.list);
      this.iconCell(row, id);
      const info = el("div", "shop-info", row);
      el("strong", "", info).textContent = item.name;
      el("span", "sk-sub", info).textContent = `${item.note ?? ""}${this.inv.count(id) ? ` · มีอยู่ ${this.inv.count(id)}` : ""}`;
      const stackable = stackLimit(id) > 1;
      let n = Math.max(1, this.qty.get(id) ?? 1);
      if (stackable) {
        const q = el("div", "shop-qty", row);
        const minus = el("button", "bt-move", q);
        minus.type = "button";
        minus.textContent = "−";
        const v = el("span", "", q);
        v.textContent = String(n);
        const plus = el("button", "bt-move", q);
        plus.type = "button";
        plus.textContent = "+";
        const set = (d: number) => {
          n = Math.max(1, Math.min(99, n + d));
          this.qty.set(id, n);
          v.textContent = String(n);
          buy.textContent = `${(price * n).toLocaleString()} ทอง`;
          buy.disabled = this.inv.gold < price * n;
        };
        minus.addEventListener("click", () => set(n >= 10 ? -5 : -1));
        plus.addEventListener("click", () => set(n >= 5 ? 5 : 1));
      }
      const buy = el("button", "shop-buy", row);
      buy.type = "button";
      buy.textContent = `${(price * n).toLocaleString()} ทอง`;
      buy.disabled = this.inv.gold < price * n;
      buy.title = "ซื้อ";
      buy.addEventListener("click", () => {
        const cost = price * n;
        if (this.inv.gold < cost) return this.say("ทองไม่พอจ้า");
        const left = this.inv.add(id, n, { silent: true });
        const got = n - left;
        if (!got) return this.say("กระเป๋าเต็มแล้วจ้า");
        this.inv.gold -= price * got;
        this.inv.changed();
        this.say(`ซื้อ${item.name}${got > 1 ? ` × ${got}` : ""} แล้ว ขอบคุณจ้า${left ? ` (ใส่ได้แค่ ${got})` : ""}`, true);
      });
    }
  }

  renderSell(): void {
    const sellable = this.inv.slots.map((s, i) => [s, i] as const).filter(([s]) => s && sellPrice(s.id) > 0);
    const mats = sellable.filter(([s]) => ITEMS[s!.id].kind === "material");
    if (mats.length) {
      const all = el("button", "wr-choice shop-sellall", this.list);
      all.type = "button";
      const total = mats.reduce((t, [s]) => t + sellPrice(s!.id) * s!.count, 0);
      all.textContent = `ขายวัตถุดิบทั้งหมด (${total.toLocaleString()} ทอง)`;
      all.addEventListener("click", () => {
        for (const [, i] of mats) this.inv.slots[i] = null;
        this.inv.gold += total;
        this.inv.changed();
        this.say(`ขายวัตถุดิบได้ ${total.toLocaleString()} ทอง`, true);
      });
    }
    if (!sellable.length) el("p", "wr-note", this.list).textContent = "ไม่มีของที่ขายได้ (ของที่สวมใส่อยู่ต้องถอดก่อน)";
    for (const [s, i] of sellable) {
      const id = s!.id, item = ITEMS[id], each = sellPrice(id);
      const row = el("div", "shop-row", this.list);
      this.iconCell(row, id);
      const info = el("div", "shop-info", row);
      el("strong", "", info).textContent = `${item.name}${s!.count > 1 ? ` × ${s!.count}` : ""}`;
      el("span", "sk-sub", info).textContent = `ชิ้นละ ${each.toLocaleString()} ทอง`;
      const sell = (n: number) => {
        this.inv.discard(i, n);
        this.inv.gold += each * n;
        this.inv.changed();
        this.say(`ขาย${item.name}${n > 1 ? ` × ${n}` : ""} ได้ ${(each * n).toLocaleString()} ทอง`, true);
      };
      if (s!.count > 1) {
        const one = el("button", "shop-buy alt", row);
        one.type = "button";
        one.textContent = "ขาย 1";
        one.addEventListener("click", () => sell(1));
      }
      const b = el("button", "shop-buy", row);
      b.type = "button";
      b.textContent = s!.count > 1 ? `ขายหมด ${(each * s!.count).toLocaleString()}` : `ขาย ${each.toLocaleString()}`;
      b.addEventListener("click", () => sell(s!.count));
    }
  }
}

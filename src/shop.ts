// The shop window: buy potions, off-hand gear, clothes and books for gold, sell back anything
// in the bag that isn't worn. Any shopkeeper opens it (src/npcs.ts, role "shop"); the
// merchant's sprite is the first adventurer body generated in Oriverse (8 directions, standing).

import { ITEMS, sellPrice, stackLimit } from "./items";
import { el, makeWindow } from "./ui";
import type { Inventory } from "./inventory";
import type { Img } from "./types";

export const MERCHANT = { x: 900, y: 690, name: "มิร่า", title: "ร้านค้า" };

export const STOCK = [
  "potion_red", "potion_red_big", "potion_blue", "potion_blue_big",
  "sword_1h", "sword_2h", "axe", "mace", "spear_1h", "spear_2h", "dagger", "staff", "bow",
  "buckler", "kite_shield", "alchemy_flask", "spell_tome", "grimoire",
  "top_priestess_white", "bottom_priestess_white", "top_adventurer_teal", "bottom_adventurer_sand",
  "top_mint", "bottom_forest", "top_warrior_navy", "bottom_warrior_cocoa",
  "hat_straw", "hat_leather", "shoes_sandals", "shoes_boots", "ring_power", "ring_mind", "ring_chant", "trinket_moon",
  "book_survivor", "book_gathering", "book_lightning", "book_tree_basic_magic", "book_tree_basic_body", "book_tree_basic_combat",
];

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
  }

  get open(): boolean {
    return !this.win.classList.contains("hidden");
  }

  // Whose shop it is (the window's title).
  keeper(name: string, title: string): void {
    const h = this.win.querySelector(".window-bar h2");
    if (h) h.textContent = `${title} · ${name}`;
  }

  toggle(show = !this.open): void {
    this.win.classList.toggle("hidden", !show);
    if (show) {
      this.status.textContent = "ยินดีต้อนรับจ้า ยา เสื้อผ้า คัมภีร์ มีครบ ของในกระเป๋าก็รับซื้อนะ";
      this.render();
    }
  }

  // Opened from the talk window on buying or selling.
  show(tab: "buy" | "sell"): void {
    this.tab = tab;
    this.toggle(true);
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

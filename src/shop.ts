// The shop window: buy potions, weapons, off-hand gear and clothes for gold, sell back anything
// in the bag that isn't worn. Any shopkeeper opens it (src/npcs.ts, role "shop"); the
// merchant's sprite is the first adventurer body generated in Oriverse (8 directions, standing).

import { ITEMS, itemSlot, sellPrice, stackLimit } from "./items";
import { el, itemTip, makeWindow } from "./ui";
import type { Inventory } from "./inventory";
import type { Img } from "./types";

const pct = (v: number) => `${Math.round(v * 100)}%`;

export const MERCHANT = { x: 900, y: 690, name: "มิร่า", title: "ร้านค้า" };

// Only the basics: potions, weapons and off-hand gear, and plain clothes. Books, hats, shoes, rings
// and trinkets are found in the game.
export const STOCK = [
  "potion_red", "potion_red_big", "potion_blue", "potion_blue_big",
  "sword_1h", "sword_2h", "axe", "axe_2h", "mace", "spear_1h", "spear_2h", "dagger", "staff", "bow", "knuckle", "claw",
  "buckler", "kite_shield", "alchemy_flask", "spell_tome", "grimoire",
  "top_priestess_white", "bottom_priestess_white", "top_adventurer_teal", "bottom_adventurer_sand",
  "top_mint", "bottom_forest", "top_warrior_navy", "bottom_warrior_cocoa",
];

// The wandering merchant's book: a share off what the shop charges (at most 50%) and a share more
// for what it buys (at most double).
export interface Deal {
  buy: number;
  sell: number;
}

// What the shop charges for one, after the discount.
export function buyPrice(id: string, deal: Deal): number {
  const price = ITEMS[id]?.price ?? 0;
  return price && Math.max(1, Math.round(price * (1 - Math.min(0.5, deal.buy))));
}

// What the shop pays for one, after the bonus; never as much as it charges for the same thing,
// so buying to sell back never pays.
export function sellFor(id: string, deal: Deal): number {
  const base = sellPrice(id), more = Math.floor(base * (1 + Math.min(1, deal.sell)));
  return STOCK.includes(id) ? Math.max(base, Math.min(more, buyPrice(id, deal) - 1)) : more;
}

// ---- shop window ----
export class ShopUI {
  inv: Inventory;
  icons: (id: string) => Img | null;
  deal: () => Deal;
  win: HTMLElement;
  tab: "buy" | "sell" = "buy";
  tabs: HTMLElement;
  list: HTMLElement;
  gold: HTMLElement;
  status: HTMLElement;
  tip: HTMLElement;
  qty = new Map<string, number>();
  shown = new Set<string>(); // rows opened to show what their item does
  wearable: (id: string) => string | null;

  // deal(): the discount and the sale bonus the player has now; wearable(id): why an item can't
  // be worn yet (as the bag says), or null
  constructor(inv: Inventory, icons: (id: string) => Img | null, deal: () => Deal = () => ({ buy: 0, sell: 0 }),
    wearable: (id: string) => string | null = () => null) {
    this.inv = inv;
    this.icons = icons;
    this.deal = deal;
    this.wearable = wearable;
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
    // hovering an item shows what it does, as in the bag; tapping one opens it in its row
    this.tip = el("div", "inv-tip hidden", document.body);
    const rowOf = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>(".shop-icon, .shop-info")?.closest<HTMLElement>(".shop-row") : null);
    this.list.addEventListener("pointerover", (e) => {
      const row = rowOf(e.target);
      if (!row || e.pointerType !== "mouse" || this.shown.has(row.dataset.key!)) return this.tip.classList.add("hidden");
      this.tip.innerHTML = this.details(row.dataset.id!);
      this.tip.classList.remove("hidden");
      const r = this.tip.getBoundingClientRect();
      this.tip.style.left = `${Math.min(innerWidth - r.width - 8, e.clientX + 16)}px`;
      this.tip.style.top = `${Math.min(innerHeight - r.height - 8, e.clientY + 16)}px`;
    });
    this.list.addEventListener("pointerout", (e) => {
      if (!rowOf(e.relatedTarget)) this.tip.classList.add("hidden");
    });
    this.list.addEventListener("click", (e) => {
      const row = rowOf(e.target);
      if (!row) return;
      const key = row.dataset.key!;
      if (!this.shown.delete(key)) this.shown.add(key);
      this.tip.classList.add("hidden");
      this.render();
    });
    inv.onChange(() => this.render());
  }

  details(id: string): string {
    return itemTip(id, itemSlot(id) ? this.wearable(id) : null);
  }

  // A row for an item (key: what keeps it open across redraws), with its details under it when
  // opened.
  row(id: string, key: string): HTMLElement {
    const row = el("div", "shop-row", this.list);
    row.dataset.id = id;
    row.dataset.key = key;
    row.classList.toggle("open", this.shown.has(key));
    return row;
  }

  detailUnder(row: HTMLElement): void {
    if (row.classList.contains("open")) el("div", "shop-detail", row).innerHTML = this.details(row.dataset.id!);
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
    if (!show) this.tip.classList.add("hidden");
    if (show) {
      const { buy, sell } = this.deal();
      this.status.textContent = buy || sell
        ? `พ่อค้าด้วยกันนี่นา ลดให้ ${pct(Math.min(0.5, buy))} รับซื้อเพิ่มให้ ${pct(Math.min(1, sell))} เลยจ้า`
        : "ยินดีต้อนรับจ้า ยา อาวุธ เสื้อผ้า มีครบ ของในกระเป๋าก็รับซื้อนะ · แตะไอเท็มเพื่อดูรายละเอียด";
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
    this.gold.innerHTML = `<img src="assets/skills/gold_coin.png" alt="">${this.inv.gold.toLocaleString()} ทอง`;
    this.list.replaceChildren();
    if (this.tab === "buy") this.renderBuy();
    else this.renderSell();
  }

  renderBuy(): void {
    const deal = this.deal();
    for (const id of STOCK) {
      const item = ITEMS[id], price = buyPrice(id, deal);
      const row = this.row(id, `buy:${id}`);
      this.iconCell(row, id);
      const info = el("div", "shop-info", row);
      el("strong", "", info).textContent = item.name;
      el("span", "sk-sub", info).textContent = `${item.note ?? ""}${this.inv.count(id) ? ` · มีอยู่ ${this.inv.count(id)}` : ""}${price < (item.price ?? 0) ? ` · ปกติ ${(item.price ?? 0).toLocaleString()} ทอง` : ""}`;
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
      this.detailUnder(row);
    }
  }

  renderSell(): void {
    const deal = this.deal();
    const sellable = this.inv.slots.map((s, i) => [s, i] as const).filter(([s]) => s && sellPrice(s.id) > 0);
    const mats = sellable.filter(([s]) => ITEMS[s!.id].kind === "material");
    if (mats.length) {
      const all = el("button", "wr-choice shop-sellall", this.list);
      all.type = "button";
      const total = mats.reduce((t, [s]) => t + sellFor(s!.id, deal) * s!.count, 0);
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
      const id = s!.id, item = ITEMS[id], each = sellFor(id, deal);
      const row = this.row(id, `sell:${i}:${id}`);
      this.iconCell(row, id);
      const info = el("div", "shop-info", row);
      el("strong", "", info).textContent = `${item.name}${s!.count > 1 ? ` × ${s!.count}` : ""}`;
      el("span", "sk-sub", info).textContent = `ชิ้นละ ${each.toLocaleString()} ทอง${each > sellPrice(id) ? ` (ปกติ ${sellPrice(id).toLocaleString()})` : ""}`;
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
      this.detailUnder(row);
    }
  }
}

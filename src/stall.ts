// The merchant's stall (docs/v05_jobs.md section 4). Her job's skill "เปิดร้าน" (skills.ts, type
// "stall") opens its window in a town: she puts up to STALL_SLOTS goods from the bag on it (more
// with the stat stallSlots), prices each and names the shop. Opened, the goods leave the bag, a
// sign with the shop's name stands over her head and she stays where she is: a step closes it,
// and what is left goes back to the bag (main.ts). A stall left open when the page closed is
// emptied back into the bag on the next start.
//
// Who buys is kept apart (Buyers): for now the townsfolk, who come by one every 8-15 s (sooner
// with stallRate) and always buy at or under the fair price (shop.ts fairPrice), less and less
// likely above it, never past fair x (1.3 + stallMarkup). Online, other players will buy instead.

import { ITEMS, stackLimit } from "./items";
import { fairPrice } from "./shop";
import { saveKey, readJson } from "./save";
import { mapX, mapY } from "./projection";
import { el, makeWindow } from "./ui";
import type { Floaters } from "./combat";
import type { Inventory } from "./inventory";
import type { Img, Vec2, View } from "./types";

export const STALL_SLOTS = 6;
const NAME_MAX = 24;
const LOG_MAX = 30;
const PRICE_MAX = 99_999_999;

// One good on the stall: how many are left and what one costs.
export interface Good {
  id: string;
  count: number;
  price: number;
}

// Who comes to buy. update() runs every frame while the stall is open; a buyer who takes
// something calls stall.sell, one who walks off stall.pass.
export interface Buyers {
  reset(stall: Stall): void; // the stall has just opened
  update(dt: number, stall: Stall): void;
}

export interface StallDeps {
  inv: Inventory;
  floaters: Floaters;
  at: () => Vec2;                                                         // where she stands
  stats: () => { stallSlots: number; stallRate: number; stallMarkup: number };
  why: () => string | null;                                               // why no stall can open here
  drop: (id: string, count: number) => void;                              // what the bag can't take back
}

// The chance a buyer pays `price` for a good worth `fair`: sure up to it, then less and less, none
// from fair x (1.3 + markup).
export function buyChance(price: number, fair: number, markup: number): number {
  if (price <= fair) return 1;
  const top = fair * (1.3 + markup);
  return price >= top ? 0 : (top - price) / (top - fair);
}

export class Stall {
  deps: StallDeps;
  buyers: Buyers;
  name = "";
  goods: Good[] = [];
  open = false;
  earned = 0;            // gold taken since it opened
  log: string[] = [];    // what happened at it, newest first
  listeners = new Set<() => void>();
  private key = saveKey("stall.v1");

  constructor(deps: StallDeps, buyers: Buyers) {
    this.deps = deps;
    this.buyers = buyers;
    // a stall still open when the page went away: its goods go back to the bag
    const saved = readJson<{ name?: string; goods?: Good[] }>(this.key);
    this.name = typeof saved?.name === "string" ? saved.name.slice(0, NAME_MAX) : "";
    const left = (saved?.goods ?? []).filter((g) => ITEMS[g.id] && g.count > 0);
    if (left.length) {
      this.goods = left;
      this.giveBack();
    }
  }

  onChange(fn: () => void): void {
    this.listeners.add(fn);
  }

  changed(): void {
    this.save();
    for (const fn of this.listeners) fn();
  }

  // How many goods fit on the stall.
  slots(): number {
    return STALL_SLOTS + Math.round(this.deps.stats().stallSlots);
  }

  markup(): number {
    return this.deps.stats().stallMarkup;
  }

  // Open with these goods under this name: they leave the bag. Why not, or null.
  start(name: string, goods: Good[]): string | null {
    const no = this.deps.why();
    if (no) return no;
    if (!goods.length) return "ยังไม่มีของบนแผง";
    if (goods.length > this.slots()) return `วางของได้ ${this.slots()} ช่อง`;
    const inv = this.deps.inv;
    if (goods.some((g) => g.count < 1 || inv.count(g.id) < g.count)) return "ของในกระเป๋าไม่พอ";
    for (const g of goods) inv.take(g.id, g.count);
    this.name = name.trim().slice(0, NAME_MAX) || "ร้านค้า";
    this.goods = goods.map((g) => ({ ...g, price: Math.max(1, Math.min(PRICE_MAX, Math.floor(g.price))) }));
    this.open = true;
    this.earned = 0;
    this.log = [];
    this.buyers.reset(this);
    const at = this.deps.at();
    this.deps.floaters.add(at.x, at.y, 170, `เปิดร้าน "${this.name}"`, "level");
    this.changed();
    return null;
  }

  // Close (why: the words over her head, if any): what is left goes back to the bag.
  close(why: string | null = null): void {
    if (!this.open) return;
    this.open = false;
    this.giveBack();
    const at = this.deps.at();
    if (why) this.deps.floaters.add(at.x, at.y, 170, why, "info");
    this.changed();
  }

  private giveBack(): void {
    for (const g of this.goods) {
      const left = this.deps.inv.add(g.id, g.count, { silent: true });
      if (left) this.deps.drop(g.id, left);
    }
    this.goods = [];
    this.deps.inv.changed();
    this.save();
  }

  // A buyer takes n of good i for its price; the gold goes into the purse.
  sell(i: number, n: number, who: string): void {
    const g = this.goods[i];
    if (!this.open || !g || g.count < n || n < 1) return;
    const gold = g.price * n;
    g.count -= n;
    this.earned += gold;
    this.deps.inv.gold += gold;
    this.deps.inv.changed();
    const name = `${ITEMS[g.id].name}${n > 1 ? ` ×${n}` : ""}`;
    this.note(`${who} ซื้อ${name} ${gold.toLocaleString()} ทอง`);
    const at = this.deps.at();
    this.deps.floaters.add(at.x, at.y, 190, `ขาย${name} +${gold.toLocaleString()} ทอง`, "loot");
    if (this.goods.every((x) => x.count <= 0)) this.close("ขายหมดแล้ว ร้านปิด");
    else this.changed();
  }

  // A buyer looked at good i and walked off: too dear.
  pass(i: number, who: string): void {
    const g = this.goods[i];
    if (!g) return;
    this.note(`${who} มาดู${ITEMS[g.id].name} แล้วบ่นว่าแพงไป`);
    this.changed();
  }

  private note(line: string): void {
    this.log.unshift(line);
    this.log.length = Math.min(this.log.length, LOG_MAX);
  }

  update(dt: number): void {
    if (this.open) this.buyers.update(dt, this);
  }

  save(): void {
    try {
      localStorage.setItem(this.key, JSON.stringify({ name: this.name, goods: this.open ? this.goods : [] }));
    } catch {
      // not kept: the goods are already back in the bag, or on the stall until it closes
    }
  }

  // The sign over her head while it is open: the shop's name on a board.
  drawSign(ctx: CanvasRenderingContext2D, view: View): void {
    if (!this.open) return;
    const { k, ox, oy } = view, at = this.deps.at();
    const x = mapX(at.x, at.y) * k + ox, y = mapY(at.x, at.y) * k + oy - 158 * k;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = `600 ${15 * k}px Kanit, system-ui, sans-serif`;
    const w = ctx.measureText(this.name).width + 40 * k, h = 26 * k;
    // two cords up from the board, as if it hung from a pole
    ctx.strokeStyle = "#6b3f24";
    ctx.lineWidth = 2 * k;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.3, y - h / 2);
    ctx.lineTo(x - w * 0.22, y - h / 2 - 9 * k);
    ctx.moveTo(x + w * 0.3, y - h / 2);
    ctx.lineTo(x + w * 0.22, y - h / 2 - 9 * k);
    ctx.stroke();
    ctx.fillStyle = "#7a4a28";
    ctx.strokeStyle = "#f4d27a";
    ctx.lineWidth = 2 * k;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 6 * k);
    ctx.fill();
    ctx.stroke();
    // a coin before the name
    ctx.fillStyle = "#f4d27a";
    ctx.beginPath();
    ctx.arc(x - w / 2 + 14 * k, y, 6 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a8692a";
    ctx.fillRect(x - w / 2 + 13 * k, y - 3 * k, 2 * k, 6 * k);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff2c2";
    ctx.fillText(this.name, x + 8 * k, y + k);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }
}

// ---- the buyers: the townsfolk ----
const FOLK = ["ป้าแช่ม", "ลุงบุญมี", "หนูนิด", "พ่อค้าเร่", "ทหารยาม", "นักผจญภัยผ่านทาง", "แม่บ้าน", "เด็กส่งของ", "นักบวชฝึกหัด", "ช่างไม้", "ชาวประมง", "นักเดินทาง", "คุณนายใจดี", "เด็กฝึกงานช่างตีเหล็ก"];
const pick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

export class Townsfolk implements Buyers {
  wait = 0;

  reset(stall: Stall): void {
    this.wait = this.next(stall);
  }

  // s until the next one comes by
  next(stall: Stall): number {
    return (8 + Math.random() * 7) / (1 + stall.deps.stats().stallRate);
  }

  update(dt: number, stall: Stall): void {
    if ((this.wait -= dt) > 0) return;
    this.wait = this.next(stall);
    const on = stall.goods.map((g, i) => [g, i] as const).filter(([g]) => g.count > 0);
    if (!on.length) return;
    const [g, i] = pick(on), who = pick(FOLK);
    if (Math.random() >= buyChance(g.price, fairPrice(g.id), stall.markup())) return stall.pass(i, who);
    // a stack may go a few at a time
    const n = stackLimit(g.id) > 1 ? Math.min(g.count, 1 + Math.floor(Math.random() * 3)) : 1;
    stall.sell(i, n, who);
  }
}

// ---- the window: setting the stall up, then watching it ----
export class StallUI {
  stall: Stall;
  inv: Inventory;
  icons: (id: string) => Img | null;
  win: HTMLElement;
  gold: HTMLElement;
  body: HTMLElement;
  status: HTMLElement;
  draft: Good[] = [];   // the goods picked before it opens
  shopName: string;
  wasOpen = false;      // the stall was open at the last render (it has closed since: say so)

  constructor(stall: Stall, inv: Inventory, icons: (id: string) => Img | null, owner: string) {
    this.stall = stall;
    this.inv = inv;
    this.icons = icons;
    this.shopName = stall.name || `ร้านของ${owner}`.slice(0, NAME_MAX);
    this.win = makeWindow("stall", "ตั้งร้าน", "F");
    const top = el("div", "shop-top", this.win);
    el("span", "sk-sub", top).textContent = "ร้านของพ่อค้า";
    this.gold = el("span", "inv-gold", top);
    this.body = el("div", "shop-list", this.win);
    this.status = el("p", "inv-status", this.win);
    stall.onChange(() => this.render());
    inv.onChange(() => this.render());
  }

  get open(): boolean {
    return !this.win.classList.contains("hidden");
  }

  toggle(show = !this.open): void {
    this.win.classList.toggle("hidden", !show);
    if (show) {
      this.say(this.stall.open ? "ร้านเปิดอยู่ ชาวเมืองจะแวะมาซื้อเรื่อย ๆ เดินเมื่อไรร้านปิด"
        : "เลือกของจากกระเป๋ามาวางบนแผง ตั้งราคา แล้วเปิดร้าน · ไม่แพงกว่าราคากลางขายได้แน่ แพงกว่านั้นโอกาสขายลดลง");
      this.render();
    }
  }

  say(msg: string, good = false): void {
    this.status.textContent = msg;
    this.status.classList.toggle("good", good);
  }

  render(): void {
    if (this.wasOpen && !this.stall.open) this.say("ร้านปิดแล้ว ของที่เหลือกลับเข้ากระเป๋า");
    this.wasOpen = this.stall.open;
    if (!this.open) return;
    this.gold.innerHTML = `<img src="assets/skills/gold_coin.png" alt="">${this.inv.gold.toLocaleString()} ทอง`;
    this.body.replaceChildren();
    if (this.stall.open) this.renderOpen();
    else this.renderSetup();
  }

  row(id: string): HTMLElement {
    const row = el("div", "shop-row", this.body);
    const cell = el("span", "inv-cell shop-icon", row);
    const icon = this.icons(id);
    if (icon) {
      const c = icon.cloneNode(true) as Img;
      if (c instanceof HTMLCanvasElement) c.getContext("2d")!.drawImage(icon, 0, 0);
      c.classList.add("inv-icon");
      cell.append(c);
    }
    return row;
  }

  button(parent: HTMLElement, text: string, ok: boolean, act: () => void, cls = "shop-buy"): HTMLButtonElement {
    const b = el("button", cls, parent);
    b.type = "button";
    b.textContent = text;
    b.disabled = !ok;
    b.addEventListener("click", act);
    return b;
  }

  // ---- before it opens ----
  renderSetup(): void {
    // the goods picked keep to what the bag still holds
    this.draft = this.draft.filter((g) => this.inv.count(g.id) > 0).map((g) => ({ ...g, count: Math.min(g.count, this.inv.count(g.id)) }));
    const head = el("div", "st-name", this.body);
    el("label", "", head).textContent = "ชื่อร้าน";
    const name = el("input", "", head);
    name.type = "text";
    name.maxLength = NAME_MAX;
    name.value = this.shopName;
    name.addEventListener("input", () => (this.shopName = name.value));

    const slots = this.stall.slots(), markup = this.stall.markup();
    el("h4", "ws-craft", this.body).textContent = `ของบนแผง ${this.draft.length}/${slots}`;
    if (!this.draft.length) el("p", "wr-note", this.body).textContent = "ยังไม่มีของ เลือกจากกระเป๋าด้านล่าง";
    for (const g of this.draft) {
      const row = this.row(g.id), fair = fairPrice(g.id);
      const info = el("div", "shop-info", row);
      el("strong", "", info).textContent = `${ITEMS[g.id].name} ×${g.count}`;
      const sub = el("span", "sk-sub", info);
      const hint = () => (sub.textContent = `ราคากลาง ${fair.toLocaleString()} ทอง · โอกาสขาย ${Math.round(buyChance(g.price, fair, markup) * 100)}%`);
      hint();
      const have = this.inv.count(g.id);
      if (have > 1) {
        const q = el("div", "shop-qty", row);
        this.button(q, "−", g.count > 1, () => this.setCount(g, g.count - (g.count > 10 ? 5 : 1)), "bt-move");
        this.button(q, "+", g.count < have, () => this.setCount(g, g.count + (g.count >= 10 ? 5 : 1)), "bt-move");
      }
      const price = el("input", "st-price", row);
      price.type = "number";
      price.min = "1";
      price.max = String(PRICE_MAX);
      price.value = String(g.price);
      price.title = "ราคาต่อชิ้น (ทอง)";
      price.addEventListener("input", () => {
        g.price = Math.max(1, Math.min(PRICE_MAX, Math.floor(Number(price.value) || 1)));
        hint();
      });
      this.button(row, "เอาออก", true, () => {
        this.draft = this.draft.filter((x) => x !== g);
        this.render();
      }, "shop-buy alt");
    }
    const go = el("button", "wr-choice st-open", this.body);
    go.type = "button";
    go.textContent = "เปิดร้าน";
    go.disabled = !this.draft.length;
    go.addEventListener("click", () => {
      const no = this.stall.start(this.shopName, this.draft);
      if (no) return this.say(no);
      this.draft = [];
      this.say("เปิดร้านแล้ว ยืนรอลูกค้าได้เลย เดินเมื่อไรร้านปิด", true);
    });

    el("h4", "ws-craft", this.body).textContent = "ของในกระเป๋า";
    const ids = [...new Set(this.inv.slots.filter((s) => s).map((s) => s!.id))]
      .filter((id) => fairPrice(id) > 0 && !this.draft.some((g) => g.id === id));
    if (!ids.length) el("p", "wr-note", this.body).textContent = "ไม่มีของที่วางขายได้ (ของที่สวมใส่อยู่ต้องถอดก่อน)";
    const full = this.draft.length >= slots;
    for (const id of ids) {
      const row = this.row(id), info = el("div", "shop-info", row), n = this.inv.count(id);
      el("strong", "", info).textContent = `${ITEMS[id].name}${n > 1 ? ` ×${n}` : ""}`;
      el("span", "sk-sub", info).textContent = `ราคากลาง ${fairPrice(id).toLocaleString()} ทอง`;
      this.button(row, "วางขาย", !full, () => {
        this.draft.push({ id, count: n, price: fairPrice(id) });
        this.render();
      });
    }
  }

  setCount(g: Good, n: number): void {
    g.count = Math.max(1, Math.min(this.inv.count(g.id), n));
    this.render();
  }

  // ---- while it is open ----
  renderOpen(): void {
    const s = this.stall;
    el("h4", "ws-craft", this.body).textContent = `${s.name} · ขายได้แล้ว ${s.earned.toLocaleString()} ทอง`;
    s.goods.forEach((g) => {
      const row = this.row(g.id), info = el("div", "shop-info", row);
      el("strong", "", info).textContent = `${ITEMS[g.id].name} · เหลือ ${g.count}`;
      el("span", "sk-sub", info).textContent = g.count ? `ชิ้นละ ${g.price.toLocaleString()} ทอง · ราคากลาง ${fairPrice(g.id).toLocaleString()}` : "ขายหมดแล้ว";
    });
    el("h4", "ws-craft", this.body).textContent = "ลูกค้า";
    const log = el("div", "st-log", this.body);
    if (!s.log.length) el("p", "wr-note", log).textContent = "ยังไม่มีลูกค้า รอสักครู่…";
    for (const line of s.log) el("p", "", log).textContent = line;
    const shut = el("button", "wr-choice st-open", this.body);
    shut.type = "button";
    shut.textContent = "ปิดร้าน";
    shut.addEventListener("click", () => s.close("ปิดร้านแล้ว ของที่เหลือกลับเข้ากระเป๋า"));
  }
}

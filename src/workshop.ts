// The workshop: refining gear with the sky and star stones, and making tier gear from materials.
// A smith in town (npcs role "smith") does both for anyone, for a fee: gold for each refine, and
// for each piece made (any tier up to the player's level, with no name on it). Whoever knows a
// craft (an inventor's branch, or the craft's book) opens it anywhere with the craft's skills
// (progression.ts craftMastery), free of fees: making what the craft makes, at the tiers its level
// opens, with the maker's name and a chance of +1, and refining what it makes.

import { ITEMS, WEAPON_TYPES, GEAR_TIERS, TIER_NAMES, tierId, joinId, splitId, stoneFor, refineStats, REFINE_MAX, statText, EQUIP_SLOTS } from "./items";
import type { EquipSlot, WeaponId } from "./items";
import { CRAFT_TIER_AT, CRAFT_BONUS, CRAFT_REFINE, MASTERIES } from "./progression";
import type { Progress } from "./progression";
import { luckFactor } from "./stats";
import { el, makeWindow, itemTip } from "./ui";
import type { Inventory } from "./inventory";
import type { Img } from "./types";

const pct = (v: number) => `${Math.round(v * 100)}%`;

// ---- refining ----
// The chance to reach each level (+1 to +10): sure up to +4, then less and less. A failure costs
// the stone and the gold; the piece keeps its level.
export const REFINE_CHANCE = [1, 1, 1, 1, 0.85, 0.7, 0.55, 0.4, 0.3, 0.2];
export function refineGold(id: string): number {
  const item = ITEMS[id];
  return Math.round(100 * ((item?.refine ?? 0) + 1) * (1 + (item?.tier ?? 0) / 60));
}

export type Craft = "weaponcraft" | "armorcraft" | "jewelcraft";
// What each craft makes (tier slots, items.ts).
export const CRAFTS: Record<Craft, string[]> = {
  weaponcraft: Object.keys(WEAPON_TYPES),
  armorcraft: ["top", "bottom", "hat", "shoes"],
  jewelcraft: ["ring", "trinket"],
};
// The craft that makes a piece of gear (and so helps refine it); off-hand gear has none.
export function craftOf(id: string): Craft | null {
  const k = ITEMS[id]?.kind;
  if (k === "weapon") return "weaponcraft";
  if (k === "top" || k === "bottom" || k === "hat" || k === "shoes") return "armorcraft";
  return k === "ring" || k === "trinket" ? "jewelcraft" : null;
}
// The chance the next refine of a piece succeeds: its level's, luckier with luck, surer for
// those who know the craft that makes it.
export function refineChance(id: string, progress: Progress, stats: { luck: number }): number {
  const plus = ITEMS[id]?.refine ?? 0;
  if (plus >= REFINE_MAX) return 0;
  const craft = craftOf(id);
  return Math.min(1, REFINE_CHANCE[plus] * luckFactor(stats) + (craft ? (progress.mastery[craft] ?? 0) * CRAFT_REFINE : 0));
}

// ---- crafting ----
// What a tier piece takes: its craft's material and monster cores, more the higher the tier
// (two-handed weapons half again as much ore), and gold.
export function recipe(tier: number, slot: string): { mats: [string, number][]; gold: number } {
  const k = tier / 30;
  if (slot in WEAPON_TYPES) {
    const two = WEAPON_TYPES[slot as WeaponId].twoHanded ? 1.5 : 1;
    return { mats: [["iron_ore", Math.round((3 * k + 2) * two)], ["monster_core", k]], gold: 300 * k };
  }
  if (slot === "ring" || slot === "trinket") return { mats: [["gem_shard", 2 * k + 2], ["monster_core", k]], gold: 300 * k };
  return { mats: [["beast_hide", slot === "top" || slot === "bottom" ? 3 * k + 2 : 2 * k + 1], ["monster_core", k]], gold: 250 * k };
}
// The tiers a craft level makes.
export function craftTiers(level: number): number[] {
  return GEAR_TIERS.filter((t) => level >= CRAFT_TIER_AT[t]);
}
// A maker's name as it goes in an item id (no ~ or ^, which mark the id's parts).
export const makerName = (name: string) => name.replace(/[~^]/g, "").trim() || "ไร้นาม";

// ---- the window ----
type Where = EquipSlot | number; // an equipped slot, or a bag slot

export class WorkshopUI {
  inv: Inventory;
  progress: Progress;
  stats: () => { luck: number };
  icons: (id: string) => Img | null;
  maker: string;
  win: HTMLElement;
  title: HTMLElement;
  tab: "refine" | "craft" = "refine";
  smith: string | null = null; // at a smith's (fees), else opened by a craft's skill
  only: Craft | null = null;   // the craft whose skill opened it
  tier = 30;
  tabs: HTMLElement;
  gold: HTMLElement;
  list: HTMLElement;
  status: HTMLElement;
  shown = new Set<string>(); // rows opened to show what their item does

  // stats(): the player's (luck); maker: the name made pieces carry
  constructor(inv: Inventory, progress: Progress, stats: () => { luck: number }, icons: (id: string) => Img | null, maker: string) {
    this.inv = inv;
    this.progress = progress;
    this.stats = stats;
    this.icons = icons;
    this.maker = makerName(maker);
    this.win = makeWindow("workshop", "โรงช่าง", "F");
    this.title = this.win.querySelector(".window-bar h2")!;
    const top = el("div", "shop-top", this.win);
    this.tabs = el("div", "sk-tabs", top);
    for (const [id, name] of [["refine", "ตีบวก"], ["craft", "สร้างไอเทม"]] as const) {
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
    this.list.addEventListener("click", (e) => {
      const row = e.target instanceof Element ? e.target.closest<HTMLElement>(".shop-icon, .shop-info")?.closest<HTMLElement>(".shop-row") : null;
      if (!row) return;
      if (!this.shown.delete(row.dataset.key!)) this.shown.add(row.dataset.key!);
      this.render();
    });
    inv.onChange(() => this.render());
    progress.onChange(() => this.render());
  }

  get open(): boolean {
    return !this.win.classList.contains("hidden");
  }

  toggle(show = !this.open): void {
    this.win.classList.toggle("hidden", !show);
    if (show) this.render();
  }

  // Open at a smith's (smith: its name), or from a craft's skill (craft) on one tab.
  show(o: { smith?: string; craft?: Craft; tab: "refine" | "craft" }): void {
    this.smith = o.smith ?? null;
    this.only = o.smith ? null : o.craft ?? null;
    this.tab = o.tab;
    this.title.textContent = this.smith ? `โรงช่าง · ${this.smith}` : this.tab === "craft" ? `${MASTERIES[this.only!].name} (สกิล)` : "ตีบวก (สกิล)";
    this.tabs.classList.toggle("hidden", !this.smith);
    this.status.textContent = this.tab === "refine"
      ? `ตีบวกด้วยหินนภา (อาวุธ แหวน) หรือหินดารา (ชุด หมวก รองเท้า จี้ มือรอง) ถึง +4 สำเร็จเสมอ พลาดแล้วเสียหิน${this.smith ? "กับค่าจ้าง" : ""} ของยังเหมือนเดิม`
      : this.smith ? "ช่างสร้างอุปกรณ์ตามเลเวลให้จากวัตถุดิบ (ไม่เกินเลเวลของเจ้า) คิดค่าจ้างเป็นทอง" : "สร้างอุปกรณ์จากวัตถุดิบ ไม่เสียค่าจ้าง ของที่สร้างมีชื่อเจ้า";
    this.toggle(true);
  }

  say(msg: string, good = false): void {
    this.status.textContent = msg;
    this.status.classList.toggle("good", good);
    this.status.classList.remove("warn");
    void this.status.offsetWidth;
    this.status.classList.add("warn");
  }

  row(id: string, key: string): HTMLElement {
    const row = el("div", "shop-row", this.list);
    row.dataset.key = key;
    row.classList.toggle("open", this.shown.has(key));
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

  button(row: HTMLElement, text: string, ok: boolean, act: () => void): void {
    const b = el("button", "shop-buy", row);
    b.type = "button";
    b.textContent = text;
    b.disabled = !ok;
    b.addEventListener("click", act);
  }

  detail(row: HTMLElement, id: string): void {
    if (row.classList.contains("open")) el("div", "shop-detail", row).innerHTML = itemTip(id);
  }

  render(): void {
    if (!this.open) return;
    for (const b of this.tabs.children) b.classList.toggle("on", (b as HTMLElement).dataset.tab === this.tab);
    this.gold.innerHTML = `<img src="assets/skills/gold_coin.png" alt="">${this.inv.gold.toLocaleString()} ทอง`;
    this.list.replaceChildren();
    if (this.tab === "refine") this.renderRefine();
    else this.renderCraft();
  }

  // ---- refining ----
  // The gear that can be refined: what is worn first, then the bag.
  // (a craft's skill refines only what that craft makes)
  pieces(): { id: string; where: Where }[] {
    const out: { id: string; where: Where }[] = [];
    const ok = (id: string) => !!stoneFor(id) && (!!this.smith || craftOf(id) === this.only);
    for (const { slot } of EQUIP_SLOTS) {
      const id = this.inv.equipped[slot];
      if (id && ok(id)) out.push({ id, where: slot });
    }
    this.inv.slots.forEach((s, i) => {
      if (s && ok(s.id)) out.push({ id: s.id, where: i });
    });
    return out;
  }

  // What a refine costs in gold: the smith's fee, nothing by a skill.
  fee(id: string): number {
    return this.smith ? refineGold(id) : 0;
  }

  renderRefine(): void {
    const list = this.pieces();
    if (!list.length) el("p", "wr-note", this.list).textContent = this.smith ? "ไม่มีอุปกรณ์ที่ตีบวกได้" : `ไม่มีของที่${MASTERIES[this.only!].name}ตีบวกได้`;
    for (const { id, where } of list) {
      const item = ITEMS[id], plus = item.refine ?? 0, stone = stoneFor(id)!;
      const row = this.row(id, `refine:${where}:${id}`);
      const info = el("div", "shop-info", row);
      el("strong", "", info).textContent = `${item.name}${typeof where === "string" ? " (สวมอยู่)" : ""}`;
      const sub = el("span", "sk-sub", info);
      if (plus >= REFINE_MAX) {
        sub.textContent = `ตีบวกถึง +${REFINE_MAX} แล้ว`;
        this.detail(row, id);
        continue;
      }
      const base = ITEMS[splitId(id).base];
      const step = refineStats(base, 1);
      const have = this.inv.count(stone), gold = this.fee(id), chance = refineChance(id, this.progress, this.stats());
      sub.innerHTML = `+${plus + 1}: ${statText(step)} · <span class="${have ? "" : "ws-short"}">${ITEMS[stone].name} ${have}/1</span>`
        + (gold ? ` · <span class="${this.inv.gold >= gold ? "" : "ws-short"}">ค่าจ้าง ${gold.toLocaleString()} ทอง</span>` : "") + ` · โอกาส ${pct(chance)}`;
      this.button(row, "ตีบวก", have > 0 && this.inv.gold >= gold, () => this.refine(id, where));
      this.detail(row, id);
    }
  }

  refine(id: string, where: Where): void {
    const stone = stoneFor(id), gold = this.fee(id), chance = refineChance(id, this.progress, this.stats());
    const now = typeof where === "string" ? this.inv.equipped[where] : this.inv.slots[where]?.id;
    if (!stone || now !== id || !chance) return;
    if (this.inv.gold < gold) return this.say("ทองไม่พอ");
    if (!this.inv.take(stone, 1)) return this.say(`ไม่มี${ITEMS[stone].name}`);
    this.inv.gold -= gold;
    const { base, plus, maker } = splitId(id);
    if (Math.random() < chance) {
      const next = joinId(base, plus + 1, maker);
      if (typeof where === "string") this.inv.equipped[where] = next;
      else this.inv.slots[where] = { id: next, count: 1 };
      this.inv.changed();
      this.say(`ตีบวกสำเร็จ! ได้ ${ITEMS[next].name}`, true);
    } else {
      this.inv.changed();
      this.say(`ตีบวกไม่สำเร็จ ${ITEMS[stone].name}แตกไป ${ITEMS[id].name} ยังเหมือนเดิม`);
    }
  }

  // ---- crafting ----
  // What can be made here: everything at a smith's, the skill's craft otherwise; and the tiers
  // (a smith's: up to the player's level; a craft's: what its level opens).
  crafts(): Craft[] {
    return this.smith ? (Object.keys(CRAFTS) as Craft[]) : this.only && this.progress.masteries().includes(this.only) ? [this.only] : [];
  }

  tiersFor(c: Craft): number[] {
    return this.smith ? GEAR_TIERS.filter((t) => t <= this.progress.level) : craftTiers(this.progress.mastery[c] ?? 0);
  }

  renderCraft(): void {
    const known = this.crafts();
    if (!known.length) {
      el("p", "wr-note", this.list).textContent = "ยังสร้างไอเทมไม่ได้";
      return;
    }
    const level = (c: Craft) => this.progress.mastery[c] ?? 0;
    const open = new Set(known.flatMap((c) => this.tiersFor(c)));
    const tiers = el("div", "ws-tiers", this.list);
    for (const t of GEAR_TIERS) {
      const b = el("button", `wr-choice${this.tier === t ? " on" : ""}`, tiers);
      b.type = "button";
      b.textContent = `Lv ${t}`;
      b.disabled = !open.has(t);
      b.title = open.has(t) ? TIER_NAMES[t] : this.smith ? `ต้องเลเวล ${t}` : `ต้องความเชี่ยวชาญการสร้างระดับ ${CRAFT_TIER_AT[t]}`;
      b.addEventListener("click", () => {
        this.tier = t;
        this.render();
      });
    }
    if (!open.has(this.tier)) {
      el("p", "wr-note", this.list).textContent = open.size ? "เลือกเลเวลของที่จะสร้าง" : this.smith ? "ช่างสร้างของเลเวล 30 ขึ้นไป ต้องเลเวล 30 ก่อน" : "ยังสร้างไม่ได้";
      return;
    }
    for (const c of known) {
      if (!this.tiersFor(c).includes(this.tier)) continue;
      el("h4", "ws-craft", this.list).textContent = this.smith
        ? MASTERIES[c].name
        : `${MASTERIES[c].name} (ระดับ ${level(c)}) · ได้ +1 ${pct(Math.min(1, level(c) * CRAFT_BONUS * luckFactor(this.stats())))}`;
      for (const slot of CRAFTS[c]) {
        const id = tierId(this.tier, slot), { mats } = recipe(this.tier, slot), gold = this.craftFee(slot);
        const row = this.row(id, `craft:${id}`);
        const info = el("div", "shop-info", row);
        el("strong", "", info).textContent = ITEMS[id].name;
        const enough = mats.every(([m, n]) => this.inv.count(m) >= n) && this.inv.gold >= gold;
        el("span", "sk-sub", info).innerHTML = [...mats.map(([m, n]) => {
          const have = this.inv.count(m);
          return `<span class="${have >= n ? "" : "ws-short"}">${ITEMS[m].name} ${have}/${n}</span>`;
        }), ...(gold ? [`<span class="${this.inv.gold >= gold ? "" : "ws-short"}">ค่าจ้าง ${gold.toLocaleString()} ทอง</span>`] : [])].join(" · ");
        this.button(row, "สร้าง", enough, () => this.craft(c, slot));
        this.detail(row, id);
      }
    }
  }

  // A smith's fee for making a piece (nothing by a skill).
  craftFee(slot: string): number {
    return this.smith ? recipe(this.tier, slot).gold : 0;
  }

  craft(c: Craft, slot: string): void {
    const tier = this.tier, { mats } = recipe(tier, slot), gold = this.craftFee(slot), lv = this.progress.mastery[c] ?? 0;
    if (!this.tiersFor(c).includes(tier)) return;
    if (!mats.every(([m, n]) => this.inv.count(m) >= n)) return this.say("วัตถุดิบไม่พอ");
    if (this.inv.gold < gold) return this.say("ทองไม่พอ");
    if (this.inv.full) return this.say("กระเป๋าเต็ม");
    for (const [m, n] of mats) this.inv.take(m, n);
    this.inv.gold -= gold;
    // made by the player's own hand: its name, and a chance of +1
    const fine = !this.smith && Math.random() < lv * CRAFT_BONUS * luckFactor(this.stats());
    const id = joinId(tierId(tier, slot), fine ? 1 : 0, this.smith ? null : this.maker);
    this.inv.add(id, 1, { silent: true });
    this.inv.changed();
    this.say(fine ? `ฝีมือเยี่ยม! สร้างได้ ${ITEMS[id].name}` : `สร้าง ${ITEMS[id].name} สำเร็จ`, true);
  }
}

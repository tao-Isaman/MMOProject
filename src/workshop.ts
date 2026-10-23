// The workshop (U): refining gear with the sky and star stones (anyone can), and making tier gear
// (whoever knows a craft: an inventor's branch, or the craft's book).

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
  tab: "refine" | "craft" = "refine";
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
    this.win = makeWindow("workshop", "โรงช่าง", "U");
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
    if (show) {
      this.status.textContent = this.tab === "refine"
        ? "ตีบวกด้วยหินนภา (อาวุธ แหวน) หรือหินดารา (ชุด หมวก รองเท้า จี้ มือรอง) ถึง +4 สำเร็จเสมอ พลาดแล้วเสียแค่หินกับทอง"
        : "สร้างอุปกรณ์ตามเลเวลจากวัตถุดิบที่มอนสเตอร์ดรอป ของที่สร้างมีชื่อผู้สร้างติดอยู่";
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
  pieces(): { id: string; where: Where }[] {
    const out: { id: string; where: Where }[] = [];
    for (const { slot } of EQUIP_SLOTS) {
      const id = this.inv.equipped[slot];
      if (id && stoneFor(id)) out.push({ id, where: slot });
    }
    this.inv.slots.forEach((s, i) => {
      if (s && stoneFor(s.id)) out.push({ id: s.id, where: i });
    });
    return out;
  }

  renderRefine(): void {
    const list = this.pieces();
    if (!list.length) el("p", "wr-note", this.list).textContent = "ไม่มีอุปกรณ์ที่ตีบวกได้";
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
      const have = this.inv.count(stone), gold = refineGold(id), chance = refineChance(id, this.progress, this.stats());
      sub.innerHTML = `+${plus + 1}: ${statText(step)} · <span class="${have ? "" : "ws-short"}">${ITEMS[stone].name} ${have}/1</span>`
        + ` · <span class="${this.inv.gold >= gold ? "" : "ws-short"}">${gold.toLocaleString()} ทอง</span> · โอกาส ${pct(chance)}`;
      this.button(row, "ตีบวก", have > 0 && this.inv.gold >= gold, () => this.refine(id, where));
      this.detail(row, id);
    }
  }

  refine(id: string, where: Where): void {
    const stone = stoneFor(id), gold = refineGold(id), chance = refineChance(id, this.progress, this.stats());
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
  crafts(): Craft[] {
    return (Object.keys(CRAFTS) as Craft[]).filter((c) => this.progress.masteries().includes(c));
  }

  renderCraft(): void {
    const known = this.crafts();
    if (!known.length) {
      el("p", "wr-note", this.list).textContent = "ยังสร้างไอเทมไม่ได้: ต้องเรียนความเชี่ยวชาญการสร้าง (สร้างอาวุธ สร้างชุด หรือสร้างประดับ) จากอาชีพนักประดิษฐ์ หรือจากตำราที่มอนสเตอร์ดรอป";
      return;
    }
    const level = (c: Craft) => this.progress.mastery[c] ?? 0;
    const open = new Set(known.flatMap((c) => craftTiers(level(c))));
    const tiers = el("div", "ws-tiers", this.list);
    for (const t of GEAR_TIERS) {
      const b = el("button", `wr-choice${this.tier === t ? " on" : ""}`, tiers);
      b.type = "button";
      b.textContent = `Lv ${t}`;
      b.disabled = !open.has(t);
      b.title = open.has(t) ? TIER_NAMES[t] : `ต้องความเชี่ยวชาญการสร้างระดับ ${CRAFT_TIER_AT[t]}`;
      b.addEventListener("click", () => {
        this.tier = t;
        this.render();
      });
    }
    if (!open.has(this.tier)) {
      el("p", "wr-note", this.list).textContent = open.size
        ? "เลือกเลเวลของที่จะสร้าง"
        : `อัปความเชี่ยวชาญการสร้างถึงระดับ ${CRAFT_TIER_AT[30]} เพื่อสร้างของเลเวล 30 (หน้าต่างสกิล K แท็บความเชี่ยวชาญ)`;
      return;
    }
    for (const c of known) {
      if (!craftTiers(level(c)).includes(this.tier)) continue;
      el("h4", "ws-craft", this.list).textContent = `${MASTERIES[c].name} (ระดับ ${level(c)}) · ได้ +1 ${pct(Math.min(1, level(c) * CRAFT_BONUS * luckFactor(this.stats())))}`;
      for (const slot of CRAFTS[c]) {
        const id = tierId(this.tier, slot), { mats, gold } = recipe(this.tier, slot);
        const row = this.row(id, `craft:${id}`);
        const info = el("div", "shop-info", row);
        el("strong", "", info).textContent = ITEMS[id].name;
        const enough = mats.every(([m, n]) => this.inv.count(m) >= n) && this.inv.gold >= gold;
        el("span", "sk-sub", info).innerHTML = [...mats.map(([m, n]) => {
          const have = this.inv.count(m);
          return `<span class="${have >= n ? "" : "ws-short"}">${ITEMS[m].name} ${have}/${n}</span>`;
        }), `<span class="${this.inv.gold >= gold ? "" : "ws-short"}">${gold.toLocaleString()} ทอง</span>`].join(" · ");
        this.button(row, "สร้าง", enough, () => this.craft(c, slot));
        this.detail(row, id);
      }
    }
  }

  craft(c: Craft, slot: string): void {
    const tier = this.tier, { mats, gold } = recipe(tier, slot), lv = this.progress.mastery[c] ?? 0;
    if (!craftTiers(lv).includes(tier)) return;
    if (!mats.every(([m, n]) => this.inv.count(m) >= n)) return this.say("วัตถุดิบไม่พอ");
    if (this.inv.gold < gold) return this.say("ทองไม่พอ");
    if (this.inv.full) return this.say("กระเป๋าเต็ม");
    for (const [m, n] of mats) this.inv.take(m, n);
    this.inv.gold -= gold;
    const fine = Math.random() < lv * CRAFT_BONUS * luckFactor(this.stats());
    const id = joinId(tierId(tier, slot), fine ? 1 : 0, this.maker);
    this.inv.add(id, 1, { silent: true });
    this.inv.changed();
    this.say(fine ? `ฝีมือเยี่ยม! สร้างได้ ${ITEMS[id].name}` : `สร้าง ${ITEMS[id].name} สำเร็จ`, true);
  }
}

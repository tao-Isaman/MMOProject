// The workshop: refining gear with the sky and star stones, and making tier gear from materials.
// A smith in town (npcs role "smith") does both for anyone, for a fee: gold for each refine, and
// for each piece made (any tier up to the player's level, with no name on it). Whoever knows a
// craft (an inventor's branch, or the craft's book) opens it anywhere with the craft's skills
// (progression.ts craftMastery), free of fees: making what the craft makes, at the tiers its level
// opens, with the maker's name and a chance of +1, and refining what it makes. Whoever knows
// brewing opens its tab the same way: the strong potions from materials.

import { ITEMS, WEAPON_TYPES, GEAR_TIERS, TIER_NAMES, tierId, joinId, splitId, stoneFor, refineStats, REFINE_MAX, statText, EQUIP_SLOTS, stackLimit } from "./items";
import { CORES, MAX_SOULS, MAX_STONES, SET_CHANCE, SLOT_NAMES, socketsOf, withSockets, socketable, coreFits, partOf, statWords } from "./sockets";
import type { EquipSlot, WeaponId } from "./items";
import { CRAFT_TIER_AT, CRAFT_BONUS, CRAFT_REFINE, MASTERIES, BREW_AT, BREW_BONUS } from "./progression";
import type { Progress } from "./progression";
import { luckFactor } from "./stats";
import { el, makeWindow, itemTip } from "./ui";
import type { Inventory } from "./inventory";
import type { Img } from "./types";

const pct = (v: number) => `${Math.round(v * 100)}%`;

// ---- refining ----
// The chance to reach each level (+1 to +10): sure up to +3, then less and less. A failure costs
// the stone and the gold, and from +4 on can break the piece too (REFINE_BREAK: the chance a
// failed try at that level breaks it, gone for good with all set in it); else it keeps its level.
// What each level adds grows faster from +4 (items.ts refineSteps).
export const REFINE_CHANCE = [1, 1, 1, 0.8, 0.7, 0.55, 0.45, 0.35, 0.25, 0.15];
export const REFINE_BREAK = [0, 0, 0, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5];
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

// ---- brewing ----
// What each strong potion is brewed from: jelly from Eden's slimes (the potion makers' base, as
// Lilia says), gem shards and monster cores, and for the white the slimes' rare leaf. Even at what
// the shops pay for them they cost a small part of the potion's price.
export const BREWS: Record<string, [string, number][]> = {
  potion_orange: [["jelly", 3], ["gem_shard", 1]],
  potion_yellow: [["jelly", 4], ["gem_shard", 2], ["monster_core", 1]],
  potion_white: [["jelly", 5], ["gem_shard", 3], ["monster_core", 2], ["sprout", 1]],
};
const BREW_BATCH = 10; // the second button brews this many at once (or as many as there is for)

// ---- the window ----
type Where = EquipSlot | number; // an equipped slot, or a bag slot
type Tab = "refine" | "socket" | "craft" | "brew";

export class WorkshopUI {
  inv: Inventory;
  progress: Progress;
  stats: () => { luck: number };
  icons: (id: string) => Img | null;
  maker: string;
  win: HTMLElement;
  title: HTMLElement;
  tab: Tab = "refine";
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
    for (const [id, name] of [["refine", "ตีบวก"], ["socket", "เสริมพลัง"], ["craft", "สร้างไอเทม"]] as const) {
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

  // Open at a smith's (smith: its name), or from a craft's skill (craft) on one tab; brewing's
  // skill opens the brewing tab.
  show(o: { smith?: string; craft?: Craft | "brewing"; tab: "refine" | "craft" }): void {
    this.smith = o.smith ?? null;
    const brew = !o.smith && o.craft === "brewing";
    this.only = o.smith || brew ? null : (o.craft as Craft | undefined) ?? null;
    this.tab = brew ? "brew" : o.tab;
    this.title.textContent = this.smith ? `โรงช่าง · ${this.smith}` : brew ? "ปรุงยา (สกิล)" : this.tab === "craft" ? `${MASTERIES[this.only!].name} (สกิล)` : "ตีบวก (สกิล)";
    this.tabs.classList.toggle("hidden", !this.smith);
    this.status.textContent = brew ? "ปรุงยาจากวัตถุดิบ ไม่เสียค่าจ้าง ยิ่งความเชี่ยวชาญสูง ยิ่งมีโอกาสได้ยาเพิ่ม"
      : this.tab === "refine"
        ? `ตีบวกด้วยหินนภา (อาวุธ แหวน) หรือหินดารา (ชุด หมวก รองเท้า จี้ มือรอง) ถึง +3 สำเร็จเสมอ ตั้งแต่ +4 อาจพลาด (เสียหิน${this.smith ? "กับค่าจ้าง" : ""}) และมีโอกาสที่ไอเทมแตกหายไป แต่ได้ค่าเพิ่มมากขึ้น`
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
    const b = el("button", "shop-buy", row.querySelector<HTMLElement>(".ws-sock-btns") ?? row);
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
    else if (this.tab === "socket") this.renderSockets();
    else if (this.tab === "brew") this.renderBrew();
    else this.renderCraft();
  }

  // ---- refining ----
  // The gear that can be refined: what is worn first, then the bag.
  // (a craft's skill refines only what that craft makes)
  pieces(ok = (id: string) => !!stoneFor(id) && (!!this.smith || craftOf(id) === this.only)): { id: string; where: Where }[] {
    const out: { id: string; where: Where }[] = [];
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
      // what the next level adds over this one
      const next = refineStats(base, plus + 1), now = refineStats(base, plus);
      const step = Object.fromEntries(Object.entries(next).map(([k, v = 0]) => [k, v - (now[k] ?? 0)]));
      const have = this.inv.count(stone), gold = this.fee(id), chance = refineChance(id, this.progress, this.stats());
      const crack = REFINE_BREAK[plus] ?? 0;
      sub.innerHTML = `+${plus + 1}: ${statText(step)} · <span class="${have ? "" : "ws-short"}">${ITEMS[stone].name} ${have}/1</span>`
        + (gold ? ` · <span class="${this.inv.gold >= gold ? "" : "ws-short"}">ค่าจ้าง ${gold.toLocaleString()} ทอง</span>` : "") + ` · โอกาส ${pct(chance)}`
        + (crack && chance < 1 ? ` · <span class="ws-short">ถ้าไม่สำเร็จ ไอเทมแตก ${pct(crack)}</span>` : "");
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
    const { base, plus, maker, sockets } = splitId(id);
    if (Math.random() < chance) {
      const next = joinId(base, plus + 1, maker, sockets);
      this.put(where, next);
      this.say(`ตีบวกสำเร็จ! ได้ ${ITEMS[next].name}`, true);
    } else if (Math.random() < (REFINE_BREAK[plus] ?? 0)) {
      this.put(where, null);
      this.say(`ตีบวกไม่สำเร็จ ${ITEMS[id].name} แตกหายไปแล้ว`);
    } else {
      this.inv.changed();
      this.say(`ตีบวกไม่สำเร็จ ${ITEMS[stone].name}แตกไป ${ITEMS[id].name} ยังเหมือนเดิม`);
    }
  }

  // Put a piece back where it was (null: it is gone).
  put(where: Where, id: string | null): void {
    if (typeof where === "string") this.inv.equipped[where] = id;
    else this.inv.slots[where] = id ? { id, count: 1 } : null;
    this.inv.changed();
  }

  // ---- sockets (at a smith's): monster cores, soul fragments and element stones ----
  // The chance the next soul fragment or element stone (with n already in) takes.
  setChance(n: number): number {
    return n >= SET_CHANCE.length ? 0 : Math.min(1, SET_CHANCE[n] * luckFactor(this.stats()));
  }

  renderSockets(): void {
    el("p", "wr-note", this.list).textContent = `แกนมอนสเตอร์ใส่ได้ 1 ชิ้นต่ออุปกรณ์ เฉพาะส่วนที่แกนระบุ ติดแน่นอนและติดถาวร · ชิ้นส่วนวิญญาณและศิลาธาตุใส่ได้อย่างละ ${MAX_SOULS} ชิ้น ยิ่งใส่มากยิ่งติดยาก ไม่ติดของที่ใส่จะหายไป`;
    const list = this.pieces((id) => socketable(id));
    if (!list.length) el("p", "wr-note", this.list).textContent = "ไม่มีอุปกรณ์ที่เสริมพลังได้";
    const bag = [...new Set(this.inv.slots.filter((x) => x && ITEMS[x.id]?.socket).map((x) => x!.id))];
    const of = (kind: string) => bag.filter((x) => ITEMS[x].socket === kind);
    const cores = of("core"), souls = of("soul"), stones = of("stone");
    for (const { id, where } of list) {
      const s = socketsOf(id), row = this.row(id, `socket:${where}:${id}`);
      const info = el("div", "shop-info", row);
      el("strong", "", info).textContent = `${ITEMS[id].name}${typeof where === "string" ? " (สวมอยู่)" : ""}`;
      el("span", "sk-sub", info).textContent = `แกน: ${s.core ? CORES[s.core]?.name ?? "-" : "ว่าง"} · ชิ้นส่วนวิญญาณ ${s.souls.length}/${MAX_SOULS} · ศิลาธาตุ ${s.stones.length}/${MAX_STONES}`;
      el("div", "ws-sock-btns", row);
      for (const c of cores) if (coreFits(c, id)) this.button(row, `ใส่${ITEMS[c].name}`, true, () => this.setCore(id, where, c));
      if (s.souls.length < MAX_SOULS)
        for (const x of souls) this.button(row, `ใส่${ITEMS[x].name} (${pct(this.setChance(s.souls.length))})`, true, () => this.setPart(id, where, x, "souls"));
      if (s.stones.length < MAX_STONES)
        for (const x of stones) this.button(row, `ใส่${ITEMS[x].name} (${pct(this.setChance(s.stones.length))})`, true, () => this.setPart(id, where, x, "stones"));
      this.detail(row, id);
    }
  }

  // Whether the piece is still where the row said (the bag may have moved).
  still(id: string, where: Where): boolean {
    return (typeof where === "string" ? this.inv.equipped[where] : this.inv.slots[where]?.id) === id;
  }

  setCore(id: string, where: Where, core: string): void {
    if (!this.still(id, where) || !coreFits(core, id) || !this.inv.take(core, 1)) return;
    const next = withSockets(id, { ...socketsOf(id), core });
    this.put(where, next);
    this.say(`ใส่${ITEMS[core].name}แล้ว: ${statWords(CORES[core].stats) || SLOT_NAMES[CORES[core].slot]}`, true);
  }

  // Set a soul fragment or an element stone (what), with the value it carries.
  setPart(id: string, where: Where, what: string, into: "souls" | "stones"): void {
    const s = socketsOf(id), chance = this.setChance(s[into].length), name = ITEMS[what]?.name;
    if (!this.still(id, where) || !chance || !this.inv.take(what, 1)) return;
    if (Math.random() >= chance) {
      this.inv.changed();
      return this.say(`${name} ไม่ติด หายไปแล้ว`);
    }
    const part = partOf(what, ITEMS[id].tier ?? 0);
    if (!part) return;
    this.put(where, withSockets(id, { ...s, [into]: [...s[into], part] }));
    this.say(`${name} ติดแล้ว`, true);
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

  // ---- brewing ----
  renderBrew(): void {
    const level = this.progress.mastery.brewing ?? 0;
    el("h4", "ws-craft", this.list).textContent = `ปรุงยา (ระดับ ${level}) · ได้ยาเพิ่มอีกขวด ${pct(this.extraChance())}`;
    for (const [id, mats] of Object.entries(BREWS)) {
      const row = this.row(id, `brew:${id}`), at = BREW_AT[id];
      const info = el("div", "shop-info", row);
      el("strong", "", info).textContent = `${ITEMS[id].name}${this.inv.count(id) ? ` · มีอยู่ ${this.inv.count(id)}` : ""}`;
      const sub = el("span", "sk-sub", info);
      if (level < at) {
        sub.textContent = `ต้องความเชี่ยวชาญปรุงยาระดับ ${at}`;
        this.detail(row, id);
        continue;
      }
      sub.innerHTML = mats.map(([m, n]) => `<span class="${this.inv.count(m) >= n ? "" : "ws-short"}">${ITEMS[m].name} ${this.inv.count(m)}/${n}</span>`).join(" · ");
      const can = this.brewable(id);
      this.button(row, "ปรุง", can >= 1, () => this.brew(id, 1));
      this.button(row, `×${Math.max(2, Math.min(BREW_BATCH, can))}`, can >= 2, () => this.brew(id, Math.min(BREW_BATCH, can)));
      this.detail(row, id);
    }
  }

  // The chance a brew gives one potion more (luck helps, as with a fine piece).
  extraChance(): number {
    return Math.min(1, (this.progress.mastery.brewing ?? 0) * BREW_BONUS * luckFactor(this.stats()));
  }

  // How many of a potion the bag has the materials for.
  brewable(id: string): number {
    return Math.min(...BREWS[id].map(([m, n]) => Math.floor(this.inv.count(m) / n)));
  }

  // Room in the bag for more of an item: its stacks' and the free slots'.
  room(id: string): number {
    const max = stackLimit(id);
    return this.inv.slots.reduce((n, s) => n + (!s ? max : s.id === id ? max - s.count : 0), 0);
  }

  // Brew `times` potions, each with its chance of one more.
  brew(id: string, times: number): void {
    if ((this.progress.mastery.brewing ?? 0) < BREW_AT[id] || this.brewable(id) < times) return this.say("วัตถุดิบไม่พอ");
    let got = 0;
    for (let i = 0; i < times; i++) got += Math.random() < this.extraChance() ? 2 : 1;
    if (this.room(id) < got) return this.say("กระเป๋าเต็ม");
    for (const [m, n] of BREWS[id]) this.inv.take(m, n * times);
    this.inv.add(id, got, { silent: true });
    this.inv.changed();
    const more = got - times;
    this.say(`ปรุง${ITEMS[id].name}ได้ ${got} ขวด${more ? ` (ฝีมือดี ได้เพิ่ม ${more} ขวด)` : ""}`, true);
  }
}

// Character UI: the HP/MP/EXP panel, the class picker, the profile window (P), the settings
// window (O) and the skill window (K) with its three tabs: skill books, masteries and elements.

import { el, makeWindow, HAIRSTYLES } from "./ui";
import type { Look } from "./ui";
import { skillIcon, hasArt, icon } from "./icons";
import {
  TREES, MASTERIES, ELEMENTS, ELEMENT_IDS, ELEMENT_STAT_NAMES, ACTIVES, NODES, STAT_NAMES, PERCENT_STATS, MAX_LEVEL, needMet, needText, RACES, RACE_NAMES, jobName, jobIcon, mpCost,
  JOBS, AUTOCAST, jobGlyph,
} from "./progression";
import { WEAPON_TYPES, ITEMS, EQUIP_SLOTS, statText, offhandKind } from "./items";
import type { WeaponId } from "./items";
import type { Inventory } from "./inventory";
import { starterForm, defaultStart } from "./starter";
import type { Start } from "./starter";
import type { Progress, SkillDef, StatBag, TreeNode } from "./progression";
import { REGEN_TICK } from "./hero";
import type { Hero } from "./hero";
import { skillPower } from "./stats";
import type { Stats } from "./stats";
import type { Img } from "./types";

// (regen arrives every REGEN_TICK seconds: shown as what each tick brings)
const fmt = (key: string, v: number) => (PERCENT_STATS.has(key) ? `${(v * 100).toFixed(1)}%` : key.endsWith("Regen") ? `${Math.round(v * REGEN_TICK)} / ${REGEN_TICK} วิ` : Math.round(v).toString());

// Time left on a buff: seconds, or minutes and seconds for the long blessings ("2:45").
const buffTime = (t: number) => {
  const s = Math.ceil(t);
  return s < 60 ? `${s}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
// The emblem by the job's name: its picture, or the glyph of a third job not drawn yet.
const glyphPics = new Map<string, string>();
function roleIcon(p: Progress): string | null {
  const g = jobGlyph(p);
  if (!g) return jobIcon(p);
  const key = g.join();
  if (!glyphPics.has(key)) glyphPics.set(key, icon(g[0], g[1]).toDataURL());
  return glyphPics.get(key)!;
}

// Tooltip text for an active skill at a rank.
export function skillTip(id: string, rank: number): string {
  const a = ACTIVES[id], s = a.skill;
  const r = Math.max(1, rank);
  const desc = typeof a.desc === "function" ? a.desc(r) : a.desc;
  const where = a.source.tree ? `ต้น${TREES[a.source.tree].name}` : `ความเชี่ยวชาญ${MASTERIES[a.source.mastery!].name} ระดับ ${a.source.at}`;
  // what its hits are made of, for the skills that do damage
  const element = s.mult ? ` · ${s.element ? `<span style="color:${ELEMENTS[s.element].color}">ธาตุ${ELEMENTS[s.element].name}</span>` : "ไร้ธาตุ"}` : "";
  return `<strong>${a.name}${a.max > 1 ? ` · ระดับ ${rank}/${a.max}` : ""}</strong>${where}<br>MP ${mpCost(id, r)} · คูลดาวน์ ${s.cd} วิ${s.cast ? ` · ร่าย ${s.cast} วิ` : ""}${element}<br>${desc}`;
}

// ---- HP / MP / EXP ----
interface Bar {
  fill: HTMLElement;
  extra: HTMLElement;
  text: HTMLElement;
}

export class Vitals {
  progress: Progress;
  hero: Hero;
  root: HTMLElement;
  lv: HTMLElement;
  cls: HTMLElement;
  sp: HTMLElement;
  hp: Bar;
  mp: Bar;
  xp: Bar;
  buffs: HTMLElement;
  last = "";

  constructor(root: HTMLElement, progress: Progress, hero: Hero, name = "") {
    this.progress = progress;
    this.hero = hero;
    this.root = root;
    if (name) el("div", "vt-name", root).textContent = name;
    const head = el("div", "vt-head", root);
    this.lv = el("span", "vt-lv", head);
    this.cls = el("span", "vt-cls", head);
    this.sp = el("span", "vt-sp", head);
    const bar = (cls: string): Bar => {
      const b = el("div", `vt-bar ${cls}`, root);
      const fill = el("i", "", b);
      const extra = el("b", "", b);
      const text = el("span", "", b);
      return { fill, extra, text };
    };
    this.hp = bar("hp");
    this.mp = bar("mp");
    this.xp = bar("xp");
    this.buffs = el("div", "vt-buffs", root);
  }

  update(): void {
    const p = this.progress, h = this.hero, s = h.stats;
    const xpNeed = p.xpNeed;
    const key = [p.level, p.cls, p.job, p.job3, p.free, Math.ceil(h.hp), Math.ceil(h.mp), Math.round(s.maxHp), Math.round(s.maxMp), p.xp,
      Math.round(h.shield?.amount ?? 0), h.buffs.map((b) => `${b.id}${Math.ceil(b.t)}`).join()].join("|");
    if (key === this.last) return;
    this.last = key;
    this.lv.textContent = `Lv ${p.level}`;
    this.cls.replaceChildren(p.cls ? jobName(p) : "ยังไม่เลือกคลาส");
    const pic = roleIcon(p);
    if (pic) this.cls.prepend(Object.assign(el("img", "role-ic"), { src: pic, alt: "" }));
    this.sp.textContent = p.free > 0 ? `แต้มสกิล ${p.free}` : "";
    this.hp.fill.style.width = `${(100 * h.hp) / s.maxHp}%`;
    this.hp.extra.style.width = `${Math.min(100, (100 * (h.shield?.amount ?? 0)) / s.maxHp)}%`;
    this.hp.text.textContent = `${Math.ceil(h.hp)} / ${Math.round(s.maxHp)}${h.shield ? ` +${Math.round(h.shield.amount)}` : ""}`;
    this.mp.fill.style.width = `${(100 * h.mp) / s.maxMp}%`;
    this.mp.text.textContent = `${Math.floor(h.mp)} / ${Math.round(s.maxMp)}`;
    const f = p.level >= MAX_LEVEL ? 1 : p.xp / xpNeed;
    this.xp.fill.style.width = `${100 * f}%`;
    this.xp.text.textContent = p.level >= MAX_LEVEL ? "เลเวลสูงสุด" : `EXP ${(100 * f).toFixed(1)}%`;
    this.buffs.replaceChildren(...h.buffs.map((b) => {
      const t = el("span", b.id.startsWith("ail_") ? "vt-buff ail" : "vt-buff");
      t.textContent = `${b.name} ${buffTime(b.t)}`;
      return t;
    }));
  }
}

// ---- class picker ----
// For a character made before classes were picked when it was created: its class, first skill
// book and element (src/starter.ts).
export class ClassPicker {
  root: HTMLElement;

  constructor(onPick: (s: Start) => void) {
    this.root = el("div", "picker hidden", document.body);
    const box = el("div", "picker-box", this.root);
    el("h2", "", box).textContent = "เลือกอาชีพ";
    el("p", "picker-note", box).textContent = "เลือกอาชีพ ตำราสกิลเริ่มต้น และธาตุ ตำราอื่นหาได้ในเกม";
    const start = defaultStart("mage");
    starterForm(el("div", "title-start", box), start);
    const ok = el("button", "title-btn primary", box);
    ok.type = "button";
    ok.textContent = "ยืนยัน";
    ok.addEventListener("click", () => {
      this.hide();
      onPick(start);
    });
  }

  show(): void {
    this.root.classList.remove("hidden");
  }

  hide(): void {
    this.root.classList.add("hidden");
  }
}

// ---- profile window ----
// Who the character is: class, level, what it wears (with what each piece gives), its stats and
// elemental attack and defence, what it has learned, and its hairstyle.
interface ProfileDeps {
  name: string;
  inv: Inventory;
  look: Look;
  icon: (id: string) => Img | null;
  onLook: () => void; // the look changed: rebuild the sheets
}

export class ProfileUI {
  progress: Progress;
  hero: Hero;
  d: ProfileDeps;
  win: HTMLElement;
  head: HTMLElement;
  gear: HTMLElement;
  looks: HTMLElement;
  table: HTMLElement;
  elements: HTMLElement;
  learned: HTMLElement;

  constructor(progress: Progress, hero: Hero, deps: ProfileDeps) {
    this.progress = progress;
    this.hero = hero;
    this.d = deps;
    this.win = makeWindow("status", "โปรไฟล์", "P");
    const body = el("div", "st-body", this.win);
    this.head = el("div", "st-head", body);
    el("div", "st-sub", body).textContent = "ของที่สวมใส่";
    this.gear = el("div", "st-gear", body);
    this.looks = el("div", "st-looks", body);
    el("div", "st-sub", body).textContent = "ค่าสเตตัส";
    this.table = el("div", "st-table", body);
    this.elements = el("div", "st-elements", body);
    this.learned = el("div", "st-learned", body);
    el("p", "wr-note", body).textContent = "ค่าสเตตัสมาจากอาชีพ เลเวล ธาตุ สกิลติดตัว ความเชี่ยวชาญของอาวุธที่ถือ ของที่สวมใส่ และบัฟ";
    deps.inv.onChange(() => this.render());
    progress.onChange(() => this.render());
  }

  toggle(show = this.win.classList.contains("hidden")): void {
    this.win.classList.toggle("hidden", !show);
    if (show) this.render();
  }

  render(): void {
    if (this.win.classList.contains("hidden")) return;
    const p = this.progress, s = this.hero.stats, inv = this.d.inv;
    const pic = roleIcon(p);
    // (a third job: the second it came from beside it)
    const job = `${jobName(p)}${p.job3 && p.job ? ` (${JOBS[p.job].name})` : ""}`;
    this.head.innerHTML = `<strong>${this.d.name}</strong> · ${pic ? `<img class="role-ic" src="${pic}" alt="">` : ""}${job} · Lv ${p.level} / ${MAX_LEVEL}` +
      `<br>EXP ${Math.floor(p.xp)} / ${p.level >= MAX_LEVEL ? "-" : p.xpNeed} · แต้มสกิล ${p.free} / ${p.points} · ทอง ${inv.gold}`;
    // what it wears, slot by slot
    this.gear.replaceChildren(...EQUIP_SLOTS.map(({ slot, name }) => {
      const id = inv.equipped[slot], item = id ? ITEMS[id] : null;
      const row = el("div", `st-gear-row${item ? "" : " empty"}`);
      const cell = el("span", "st-gear-icon", row);
      const art = id ? this.d.icon(id) : null;
      if (art) {
        const c = el("canvas", "", cell);
        c.width = art.width;
        c.height = art.height;
        c.getContext("2d")!.drawImage(art, 0, 0);
      }
      const txt = el("span", "st-gear-text", row);
      el("small", "", txt).textContent = name;
      el("b", "", txt).textContent = item?.name ?? (slot === "top" || slot === "bottom" ? "ชุดสีน้ำตาล" : "—");
      const what = !item ? "" : item.kind === "weapon"
        ? `ดาเมจ ${WEAPON_TYPES[item.weapon!].damage.join("–")} · ตีทุก ${WEAPON_TYPES[item.weapon!].interval} วิ`
        : statText(item.stats);
      if (what) el("span", "", txt).textContent = what;
      return row;
    }));
    this.renderLooks();
    this.table.replaceChildren(...Object.entries(STAT_NAMES).map(([k, name]) => {
      const row = el("div", "st-row");
      el("span", "", row).textContent = name;
      el("b", "", row).textContent = fmt(k, s[k as keyof Stats]);
      return row;
    }));
    // attack / defence in every element the character knows (and any other it has some of)
    const open = new Set(p.elementsOpen());
    const shown = ELEMENT_IDS.filter((e) => open.has(e) || s[`${e}Atk`] || s[`${e}Def`]);
    const head = el("div", "st-sub");
    head.textContent = "พลังธาตุ โจมตี / ป้องกัน (หักลบกัน 1 แต้ม = 1%)";
    const grid = el("div", "st-table");
    grid.replaceChildren(...shown.map((e) => {
      const row = el("div", "st-row");
      const name = el("span", "", row);
      name.textContent = ELEMENTS[e].name;
      name.style.color = ELEMENTS[e].color;
      el("b", "", row).textContent = `${Math.round(s[`${e}Atk`])} / ${Math.round(s[`${e}Def`])}`;
      return row;
    }));
    this.elements.replaceChildren(head, grid);
    // what it has learned
    const list = (title: string, names: string[]) => {
      const r = el("div", "st-row st-learn");
      el("span", "", r).textContent = title;
      el("b", "", r).textContent = names.join(" · ") || "—";
      return r;
    };
    const sub = el("div", "st-sub");
    sub.textContent = "ที่เรียนแล้ว (ตำราอื่นหาได้จากมอนสเตอร์)";
    this.learned.replaceChildren(sub,
      list("ตำราสกิล", p.trees().map((t) => TREES[t].name)),
      list("ความเชี่ยวชาญ", p.masteries().map((m) => MASTERIES[m].name)),
      list("ธาตุ", p.elementsOpen().map((e) => ELEMENTS[e].name)));
  }

  // The hairstyles it has learned (a female character; a male one keeps his own hair), when
  // there is more than one to pick from. The hair colour is picked once, when the character is
  // made (src/title.ts).
  renderLooks(): void {
    const look = this.d.look;
    this.looks.replaceChildren();
    const styles = look.gender === "female" ? HAIRSTYLES.filter((x) => look.styles?.includes(x.id)) : [];
    if (styles.length < 2) return;
    el("div", "st-sub", this.looks).textContent = "ทรงผม";
    const row = el("div", "wr-choices", this.looks);
    for (const h of styles) {
      const b = el("button", `wr-choice${look.hair === h.id ? " on" : ""}`, row);
      b.type = "button";
      b.textContent = h.name;
      b.addEventListener("click", () => {
        look.hair = h.id;
        this.d.onLook();
        this.renderLooks();
      });
    }
  }
}

// ---- settings window ----
// Back to the character list, or out of the game.
export class SettingsUI {
  win: HTMLElement;

  constructor(onSwitch: () => void, onExit: () => void) {
    this.win = makeWindow("settings", "ตั้งค่า", "O");
    const body = el("div", "st-body", this.win);
    const row = el("div", "st-actions", body);
    const sw = el("button", "wr-choice", row);
    sw.type = "button";
    sw.textContent = "เลือกตัวละคร";
    sw.addEventListener("click", onSwitch);
    const out = el("button", "wr-choice danger", row);
    out.type = "button";
    out.textContent = "ออกจากเกม";
    out.addEventListener("click", onExit);
    el("p", "wr-note", body).textContent = "เกมเซฟให้อัตโนมัติ ทั้งเลเวล ของในกระเป๋า และตำแหน่งที่ยืน";
  }

  toggle(show = this.win.classList.contains("hidden")): void {
    this.win.classList.toggle("hidden", !show);
  }
}

// ---- skill window ----
// Stat bag keys as shown to the player, and which of them are fractions.
const BAG_NAMES: Record<string, string> = {
  ...STAT_NAMES, ...ELEMENT_STAT_NAMES, atkPct: "พลังโจมตี", matkPct: "พลังเวท", defPct: "ป้องกัน", mdefPct: "ต้านเวท", maxHpPct: "HP สูงสุด",
  maxMpPct: "MP สูงสุด", mpRegenPct: "ฟื้น MP", pierce: "เจาะเกราะ", xpPct: "ค่าประสบการณ์", drop: "โอกาสได้ของ",
  dmg: "ดาเมจ", reach: "ระยะโจมตี", stunHit: "โอกาสตีให้มึน",
  healPct: "พลังรักษา", multiShot: "โอกาสยิงซ้อน", poisonHit: "โอกาสตีติดพิษ", huntDmg: "ดาเมจใส่ศัตรูติดสถานะ", buffTime: "เวลาบัฟ",
  lifesteal: "ดูดเลือด", lowHpDmg: "ดาเมจเมื่อเลือดน้อย", falconChance: "โอกาสเหยี่ยวโจมตี", falconPower: "พลังเหยี่ยว", poisonPct: "พลังพิษ",
  buyDisc: "ซื้อของจาก NPC ถูกลง", sellBonus: "ขายของให้ NPC ได้เพิ่ม", bagSlots: "ช่องกระเป๋า", goldPct: "ทองจากมอนสเตอร์", fareDisc: "ค่าเดินทางถูกลง",
  ...Object.fromEntries(RACES.map((r) => [`${r}Dmg`, `ดาเมจใส่${RACE_NAMES[r]}`])),
};
const isPct = (k: string) => k.endsWith("Pct") || k.endsWith("Dmg") && k !== "critDmg" && !k.endsWith("Atk") || PERCENT_STATS.has(k)
  || ["pierce", "drop", "dmg", "reach", "stunHit", "multiShot", "poisonHit", "huntDmg", "buffTime", "lifesteal", "lowHpDmg", "falconChance", "falconPower", "buyDisc", "sellBonus", "fareDisc"].includes(k);
const pct = (v: number) => `${+(v * 100).toFixed(1)}%`;
const num = (v: number) => `${+v.toFixed(1)}`;
const signed = (k: string, v: number) => `${v < 0 ? "−" : "+"}${isPct(k) ? pct(Math.abs(v)) : num(Math.abs(v))}`;
// (an autocast stat: the skill it casts by itself, and how often)
const bagText = (b: StatBag) => Object.entries(b).map(([k, v = 0]) => k.startsWith(AUTOCAST)
  ? `ตีแล้วร่าย${ACTIVES[k.slice(AUTOCAST.length)]?.name ?? k}เอง ${pct(v)}` : `${BAG_NAMES[k] ?? k} ${signed(k, v)}`).join(" · ");
const statName = (s: SkillDef) => (s.stat === "matk" ? "พลังเวท" : s.stat === "both" ? "พลังผสม (60% พลังโจมตี + 60% พลังเวท)" : "พลังโจมตี");

// The element a skill's hits are made of, for a skill that does damage: its words and colour.
function hitElement(s: SkillDef | undefined): { text: string; color: string } | null {
  if (!s?.mult) return null;
  return s.element ? { text: `ธาตุ${ELEMENTS[s.element].name}`, color: ELEMENTS[s.element].color } : { text: "ไร้ธาตุ", color: "#c9c2ad" };
}

// What one rank of a node gives, as short parts: the headline number first.
function rankParts(node: TreeNode, r: number): string[] {
  if (node.kind === "passive") return node.stats ? [bagText(node.stats(r))] : [];
  const s = node.skill!, out: string[] = [];
  if (s.mult) out.push(`${pct(s.mult(r))} ของ${statName(s)}${s.hits ? ` × ${s.hits}` : s.pulses ? ` × ${s.pulses}` : s.ticks ? ` × ${s.ticks}` : ""}`);
  if (s.heal) out.push(`ฟื้น ${pct(s.heal(r))} HP สูงสุด`);
  if (s.base) out.push(s.type === "summon" || s.type === "decoy" ? `HP ${pct(s.base(r))} ของ HP สูงสุด` : `โล่ ${pct(s.base(r))} MP สูงสุด`);
  if (s.combo) out.push(`คอมโบ +${pct(s.combo.more(r))}`);
  if (s.manaBurn) out.push(`ใส่ตัวร่ายเวท +${pct(s.manaBurn(r))}`);
  if (s.stun) out.push(`มึน ${num(s.stun(r))} วิ`);
  if (s.slow) out.push(`ช้า ${num(s.slow(r))} วิ`);
  if (s.freeze) out.push(`หยุด ${num(s.freeze(r))} วิ`);
  if (s.poison) out.push(`พิษ ${pct(s.poison(r))} ของดาเมจ`);
  if (s.weaken) out.push(`ศัตรูตีเบาลง ${pct(s.weaken(r))}`);
  if (s.expose) out.push(`ศัตรูโดนแรงขึ้น ${pct(s.expose(r))}`);
  if (s.blind) out.push(`ตาบอด ${num(s.blind(r))} วิ`);
  if (s.buff) out.push(bagText(s.buff(r)));
  out.push(`MP ${mpCost(node.id, r)}`);
  return out;
}

// How much one more rank adds over the one before, for the headline number.
function rankGain(node: TreeNode, r: number): string {
  if (r <= 1) return "";
  if (node.kind === "passive" && node.stats) {
    const a = node.stats(r), b = node.stats(r - 1);
    return Object.keys(a).map((k) => {
      const d = (a[k as keyof StatBag] ?? 0) - (b[k as keyof StatBag] ?? 0);
      return signed(k, d);
    }).join(" ");
  }
  // (a passive with only a terrain table: its numbers differ by map, no single gain to show)
  const s = node.skill;
  if (!s) return "";
  if (s.mult) return `+${pct(s.mult(r) - s.mult(r - 1))}`;
  if (s.buff) {
    const a = s.buff(r), b = s.buff(r - 1);
    return Object.keys(a).map((k) => {
      const d = (a[k as keyof StatBag] ?? 0) - (b[k as keyof StatBag] ?? 0);
      return d ? signed(k, d) : "";
    }).filter(Boolean).join(" ");
  }
  if (s.heal) return `+${pct(s.heal(r) - s.heal(r - 1))}`;
  return "";
}

interface SkillUIDeps {
  weapon: () => string | null;
  weaponImg: (type: WeaponId) => Img | undefined;
  onDropSkill: (id: string, x: number, y: number) => void;
}

// A point planned in the skill window: shown raised at once, spent when the plan is confirmed.
type Step = { kind: "node"; tree: string; id: string } | { kind: "mastery"; id: string } | { kind: "element"; id: string };

function take(p: Progress, s: Step): boolean {
  if (s.kind === "node") return p.raiseNode(s.tree, s.id);
  return s.kind === "mastery" ? p.raiseMastery(s.id) : p.raiseElement(s.id);
}

// Tree drawing: node centres by column (a share of the width; 3 columns at least) and row (px).
const colX = (c: number, cols: number) => (c + 0.5) / Math.max(3, cols);
const rowY = (r: number) => 58 + r * 128;

export class SkillUI {
  real: Progress;     // the character's
  progress: Progress; // what the window shows: the character's, or a copy with the plan taken
  plan: Step[] = [];
  hero: Hero;
  weapon: () => string | null;
  weaponImg: (type: WeaponId) => Img | undefined;
  onDropSkill: (id: string, x: number, y: number) => void;
  win: HTMLElement;
  points: HTMLElement;
  tabs: HTMLElement;
  tab: "trees" | "mastery" | "elements" = "trees";
  body: HTMLElement;
  tip: HTMLElement;
  help: HTMLElement;
  planBar: HTMLElement;
  tree: string | null = null;      // tree shown on the trees tab
  picked: string | null = null;    // node shown in the detail panel

  // weaponImg(type): weapon art image; onDropSkill(id, x, y): dropped at a screen point
  constructor(progress: Progress, hero: Hero, { weaponImg, onDropSkill, weapon }: SkillUIDeps) {
    this.real = this.progress = progress;
    this.hero = hero;
    this.weaponImg = weaponImg;
    this.onDropSkill = onDropSkill;
    this.weapon = weapon;
    this.win = makeWindow("skills", "สกิล", "K");
    this.win.classList.add("sk-window");
    const top = el("div", "sk-top", this.win);
    this.points = el("span", "sk-points", top);
    this.tabs = el("div", "sk-tabs", top);
    for (const [id, name] of [["trees", "ตำราสกิล"], ["mastery", "ความเชี่ยวชาญ"], ["elements", "ธาตุ"]] as const) {
      const b = el("button", "sk-tab", this.tabs);
      b.type = "button";
      b.dataset.tab = id;
      b.textContent = name;
      b.addEventListener("click", () => {
        this.tab = id;
        this.render();
      });
    }
    // under the points, where it stays in sight however long the window is
    this.planBar = el("div", "sk-plan hidden", this.win);
    this.body = el("div", "sk-body", this.win);
    this.tip = el("div", "inv-tip hidden", document.body);
    this.help = el("p", "wr-note sk-help", this.win);
    progress.onChange(() => {
      this.replan();
      this.render();
    });
    this.bindDrag();
  }

  toggle(show = this.win.classList.contains("hidden")): void {
    this.win.classList.toggle("hidden", !show);
    this.tip.classList.add("hidden");
    if (show) this.render();
  }

  render(): void {
    if (this.win.classList.contains("hidden")) return;
    const p = this.progress;
    this.points.innerHTML = `แต้มสกิล <b>${p.free}</b> / ${p.points}${this.plan.length ? ` · จองไว้ ${this.plan.length}` : ""}`;
    this.renderPlan();
    for (const b of this.tabs.children) b.classList.toggle("on", (b as HTMLElement).dataset.tab === this.tab);
    const scroll = this.body.scrollTop;
    this.body.replaceChildren();
    this.tip.classList.add("hidden");
    if (this.tab === "trees") this.renderTrees();
    else if (this.tab === "mastery") this.renderMastery();
    else this.renderElements();
    this.body.scrollTop = scroll;
    this.help.textContent = this.tab === "trees"
      ? "กด + จองแต้มได้หลายแต้ม (− คืน) แล้วกดยืนยันทีเดียว · คลิกสกิลเพื่อดูรายละเอียด · เส้นบอกว่าต้องอัพสกิลไหนถึงระดับเท่าไรก่อน · ลากไอคอนสกิลที่เรียนแล้วไปวางที่แถบสกิล หรือดับเบิลคลิกเพื่อใส่ช่องว่าง"
      : "กด + จองแต้มได้หลายแต้ม (− คืน) แล้วกดยืนยันทีเดียว · อัพเป็นเส้นตรง ระดับละ 1 แต้ม · ถึงจุดบนเส้นเมื่อไรได้ความสามารถพิเศษเพิ่ม · ชี้ที่จุดเพื่อดูรายละเอียด";
  }

  plus(parent: HTMLElement, enabled: boolean, why: string | null, onClick: () => void, text = "+"): HTMLButtonElement {
    const b = el("button", "sk-plus", parent);
    b.type = "button";
    b.textContent = text;
    b.disabled = !enabled;
    if (why) b.title = why;
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    return b;
  }

  // `id`: the skill whose picture to show if it has one (null for trees, masteries, elements)
  // The weapon type in the off hand (null: empty, or not a weapon).
  offWeapon(): string | null {
    return offhandKind(this.hero.offhand());
  }

  skillIcon(parent: HTMLElement, id: string | null, glyph: string, color: string, activeId: string | null | undefined, learned: boolean): HTMLElement {
    const wrap = el("span", `sk-icon${learned ? "" : " dim"}`, parent);
    const c = skillIcon(id, glyph, color);
    const cv = el("canvas", "", wrap);
    cv.width = c.width;
    cv.height = c.height;
    cv.getContext("2d")!.drawImage(c, 0, 0);
    if (activeId && learned) {
      wrap.dataset.skill = activeId;
      wrap.classList.add("drag");
    }
    return wrap;
  }

  hoverTip(node: HTMLElement, html: () => string): void {
    node.addEventListener("pointerenter", (e) => {
      this.tip.innerHTML = html();
      this.tip.classList.remove("hidden");
      const r = this.tip.getBoundingClientRect();
      this.tip.style.left = `${Math.min(innerWidth - r.width - 8, e.clientX + 16)}px`;
      this.tip.style.top = `${Math.min(innerHeight - r.height - 8, e.clientY + 16)}px`;
    });
    node.addEventListener("pointerleave", () => this.tip.classList.add("hidden"));
  }

  // ---- the plan: + takes a point on the copy shown, − gives the last one back, and one
  // confirm spends them all (points don't come back) ----
  replan(): void {
    if (!this.plan.length) {
      this.progress = this.real;
      return;
    }
    const d = this.real.draft();
    // a step that no longer fits (one it needed was taken back) drops out
    this.plan = this.plan.filter((st) => take(d, st));
    this.progress = this.plan.length ? d : this.real;
  }

  add(st: Step): void {
    this.plan.push(st);
    this.replan();
    this.render();
  }

  // Give back the last planned point of a node, mastery or element.
  undo(kind: Step["kind"], id: string): void {
    for (let i = this.plan.length - 1; i >= 0; i--) {
      if (this.plan[i].kind !== kind || this.plan[i].id !== id) continue;
      this.plan.splice(i, 1);
      break;
    }
    this.replan();
    this.render();
  }

  // How many points the plan puts into one node, mastery or element.
  planned(kind: Step["kind"], id: string): number {
    return this.plan.filter((st) => st.kind === kind && st.id === id).length;
  }

  confirmPlan(): void {
    const steps = this.plan;
    this.plan = [];
    this.progress = this.real;
    for (const st of steps) take(this.real, st);
    this.hero.recompute();
    this.render();
  }

  clearPlan(): void {
    this.plan = [];
    this.replan();
    this.render();
  }

  // The bar under the window while points are planned: what they go into, confirm or clear.
  renderPlan(): void {
    const bar = this.planBar;
    bar.replaceChildren();
    bar.classList.toggle("hidden", !this.plan.length);
    if (!this.plan.length) return;
    const parts = new Map<string, { name: string; n: number }>();
    for (const st of this.plan) {
      const key = `${st.kind}:${st.id}`;
      const name = st.kind === "node" ? NODES[st.id].node.name : st.kind === "mastery" ? MASTERIES[st.id].name : `ธาตุ${ELEMENTS[st.id].name}`;
      const part = parts.get(key) ?? { name, n: 0 };
      part.n++;
      parts.set(key, part);
    }
    const text = el("div", "sk-plan-text", bar);
    el("strong", "", text).textContent = `จะใช้ ${this.plan.length} แต้ม`;
    el("span", "", text).textContent = [...parts.values()].map((x) => `${x.name} +${x.n}`).join(" · ");
    el("small", "", text).textContent = "ยืนยันแล้วคืนแต้มไม่ได้";
    const ok = el("button", "title-btn primary", bar);
    ok.type = "button";
    ok.textContent = "ยืนยัน";
    ok.addEventListener("click", () => this.confirmPlan());
    const no = el("button", "title-btn", bar);
    no.type = "button";
    no.textContent = "ล้าง";
    no.addEventListener("click", () => this.clearPlan());
  }

  // A − beside a +, when the plan has points in it.
  minus(parent: HTMLElement, kind: Step["kind"], id: string, text = "−"): HTMLButtonElement | null {
    if (!this.planned(kind, id)) return null;
    const b = this.plus(parent, true, "เอาแต้มที่จองไว้คืน", () => this.undo(kind, id), text);
    b.classList.add("minus");
    return b;
  }

  // ---- trees: a list of trees, the chosen one drawn with its links, and the picked node ----
  renderTrees(): void {
    const p = this.progress;
    const open = p.trees();
    if (!this.tree || !open.includes(this.tree)) this.tree = open[0] ?? null;
    const view = el("div", "sk-treeview", this.body);
    const list = el("div", "sk-treelist", view);
    for (const treeId of open) {
      const t = TREES[treeId];
      const b = el("button", `sk-treetab${treeId === this.tree ? " on" : ""}`, list);
      b.type = "button";
      b.style.setProperty("--tree", t.color);
      this.skillIcon(b, `tree_${treeId}`, t.glyph, t.color, null, true);
      const txt = el("span", "", b);
      el("strong", "", txt).textContent = t.name;
      el("small", "", txt).textContent = `ลงแล้ว ${p.pointsIn(treeId)} แต้ม`;
      b.addEventListener("click", () => {
        this.tree = treeId;
        this.picked = null;
        this.render();
      });
    }
    if (!this.tree) return;
    const tree = TREES[this.tree], treeId = this.tree;
    if (!this.picked || !tree.nodes.some((n) => n.id === this.picked)) this.picked = tree.nodes[0].id;

    // the drawing: links first (SVG), then the nodes over them
    const box = el("div", "sk-canvas", view);
    box.style.setProperty("--tree", tree.color);
    const head = el("div", "sk-canvas-head", box);
    el("strong", "", head).textContent = tree.name;
    el("span", "", head).textContent = tree.note;
    const rows = Math.max(...tree.nodes.map((n) => n.pos[1])) + 1;
    const cols = Math.max(...tree.nodes.map((n) => n.pos[0])) + 1;
    const stage = el("div", "sk-stage", box);
    const height = rowY(rows - 1) + 70;
    stage.style.height = `${height}px`;
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "sk-links");
    svg.setAttribute("viewBox", `0 0 100 ${height}`);
    svg.setAttribute("preserveAspectRatio", "none");
    stage.append(svg);
    const at = (n: TreeNode) => ({ x: colX(n.pos[0], cols) * 100, y: rowY(n.pos[1]) });
    for (const n of tree.nodes) {
      for (const [id, need] of n.req ?? []) {
        const from = at(NODES[id].node), to = at(n);
        const met = (p.ranks[id] ?? 0) >= need;
        const y1 = from.y + 34, y2 = to.y - 34, my = (y1 + y2) / 2;
        const path = document.createElementNS(NS, "path");
        path.setAttribute("d", `M ${from.x} ${y1} C ${from.x} ${my}, ${to.x} ${my}, ${to.x} ${y2}`);
        path.setAttribute("class", met ? "met" : "");
        path.setAttribute("vector-effect", "non-scaling-stroke");
        svg.append(path);
        // the level it needs, halfway along; the whole sentence on hover and in the details
        const tag = el("span", `sk-req${met ? " met" : ""}`, stage);
        tag.style.left = `${(from.x + to.x) / 2}%`;
        tag.style.top = `${my}px`;
        tag.textContent = `${met ? "✓ " : ""}Lv ${need}`;
        tag.title = `${n.name} ต้องมี ${NODES[id].node.name} ระดับ ${need}`;
      }
    }
    for (const n of tree.nodes) {
      const rank = p.ranks[n.id] ?? 0;
      const why = p.blockNode(treeId, n);
      const reqOk = !p.missing(n).length;
      const node = el("div", `sk-tnode${rank ? " learned" : ""}${rank >= n.max ? " max" : ""}${!why ? " can" : ""}${reqOk ? "" : " blocked"}${n.id === this.picked ? " picked" : ""}`, stage);
      node.style.left = `${colX(n.pos[0], cols) * 100}%`;
      node.style.top = `${rowY(n.pos[1])}px`;
      node.tabIndex = 0;
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", `${n.name} ระดับ ${rank}/${n.max}`);
      // only a skill it already knows goes on the skill bar, not one just planned
      const known = (this.real.ranks[n.id] ?? 0) > 0;
      const ic = this.skillIcon(node, n.id, n.glyph, tree.color, n.kind === "active" && known ? n.id : null, rank > 0);
      if (!reqOk) el("span", "sk-lockmark", ic).textContent = "🔒";
      const more = this.planned("node", n.id);
      if (more) node.classList.add("planned");
      el("span", "sk-rank", node).textContent = `${rank}/${n.max}${more ? ` (+${more})` : ""}`;
      el("span", "sk-tname", node).textContent = n.name;
      const kind = el("span", "sk-tkind", node);
      kind.textContent = n.kind === "active" ? "สกิล" : "ติดตัว";
      const hits = hitElement(n.skill);
      if (hits) {
        kind.append(" · ");
        const tag = el("span", "sk-tel", kind);
        tag.textContent = hits.text;
        tag.style.color = hits.color;
      }
      if (!why) this.plus(node, true, "จองอัพ 1 ระดับ", () => this.add({ kind: "node", tree: treeId, id: n.id })).classList.add("mini");
      this.minus(node, "node", n.id)?.classList.add("mini");
      const pick = () => {
        this.picked = n.id;
        this.render();
      };
      node.addEventListener("click", pick);
      node.addEventListener("keydown", (e) => {
        if (e.key === "Enter") pick();
      });
    }
    this.renderNode(view, treeId, tree.nodes.find((n) => n.id === this.picked)!);
  }

  // The picked node: what it does now, every rank's numbers, what it needs and opens.
  renderNode(parent: HTMLElement, treeId: string, n: TreeNode): void {
    const p = this.progress, tree = TREES[treeId];
    const rank = p.ranks[n.id] ?? 0;
    const panel = el("div", "sk-detail", parent);
    panel.style.setProperty("--tree", tree.color);
    const head = el("div", "sk-detail-head", panel);
    this.skillIcon(head, n.id, n.glyph, tree.color, n.kind === "active" && (this.real.ranks[n.id] ?? 0) > 0 ? n.id : null, rank > 0);
    const t = el("div", "", head);
    el("strong", "", t).textContent = n.name;
    const sub = el("span", "sk-sub", t);
    sub.textContent = `${n.kind === "active" ? "สกิลกดใช้" : "สกิลติดตัว (ได้ผลตลอด)"} · ระดับ ${rank}/${n.max}`;
    const hits = hitElement(n.skill);
    if (hits) {
      sub.append(" · ");
      const tag = el("b", "sk-tel", sub);
      tag.textContent = `โจมตี${hits.text}`;
      tag.style.color = hits.color;
    }
    el("p", "sk-desc", panel).textContent = n.desc(Math.max(1, rank));
    if (n.need) {
      const ok = needMet(n.need, this.weapon(), this.offWeapon());
      el("p", ok ? "sk-ok" : "sk-miss", panel).textContent = `${ok ? "✓" : "✗"} ${n.kind === "active" ? "ใช้ได้เมื่อถือ" : "ได้ผลเมื่อถือ"}${needText(n.need, (w) => WEAPON_TYPES[w].name)}`;
    }
    if (n.kind === "active" && n.skill) {
      const s = n.skill;
      // the cast time as this hero reads it out (its castRed), and the plain one beside it
      const red = s.type === "flower" ? 0 : this.hero.stats.castRed;
      const cast = s.cast ? ` · ร่าย ${+(s.cast * (1 - red)).toFixed(2)} วิ${red ? ` (ปกติ ${s.cast})` : ""}` : "";
      // (MP grows with the rank: the next rank's is shown while it can still be raised)
      const mpNow = mpCost(n.id, Math.max(1, rank)), mpNext = rank && rank < n.max ? mpCost(n.id, rank + 1) : mpNow;
      el("p", "sk-meta", panel).textContent = `MP ${mpNow}${mpNext !== mpNow ? ` (ระดับถัดไป ${mpNext})` : ""} · คูลดาวน์ ${s.cd} วิ${cast}`;
    }

    // requirements
    const reqs = n.req ?? [];
    const need = el("div", "sk-needs", panel);
    el("h4", "", need).textContent = "ต้องอัพก่อน";
    if (!reqs.length) el("p", "sk-ok", need).textContent = "✓ อัพได้ทันที ไม่ต้องมีสกิลอื่นก่อน";
    for (const [id, lv] of reqs) {
      const have = p.ranks[id] ?? 0, ok = have >= lv;
      el("p", ok ? "sk-ok" : "sk-miss", need).textContent = `${ok ? "✓" : "✗"} ${NODES[id].node.name} ระดับ ${lv} (ตอนนี้ ${have})`;
    }
    const opens = tree.nodes.filter((o) => o.req?.some(([id]) => id === n.id));
    if (opens.length) {
      el("h4", "", need).textContent = "เปิดทางไปสู่";
      for (const o of opens) {
        const lv = o.req!.find(([id]) => id === n.id)![1];
        el("p", rank >= lv ? "sk-ok" : "sk-next", need).textContent = `${rank >= lv ? "✓" : "→"} ${o.name} เมื่อสกิลนี้ถึงระดับ ${lv}`;
      }
    }

    // every rank
    const tableWrap = el("div", "sk-ranks", panel);
    el("h4", "", tableWrap).textContent = n.kind === "active" ? "ความแรงแต่ละระดับ" : "ค่าที่ได้แต่ละระดับ";
    const table = el("table", "", tableWrap);
    const hr = el("tr", "", el("thead", "", table));
    for (const h of ["ระดับ", n.kind === "active" ? "ผล" : "รวม", "เพิ่ม", n.kind === "active" && n.skill?.mult ? "ดาเมจตอนนี้*" : ""]) {
      if (h) el("th", "", hr).textContent = h;
    }
    const tb = el("tbody", "", table);
    const w = WEAPON_TYPES[this.weapon() as WeaponId] ?? null;
    for (let r = 1; r <= n.max; r++) {
      const tr = el("tr", r === rank ? "now" : r === rank + 1 ? "next" : r < rank ? "done" : "", tb);
      el("td", "", tr).textContent = `${r}${r === rank ? " ◀" : ""}`;
      el("td", "", tr).textContent = rankParts(n, r).join(" · ");
      el("td", "gain", tr).textContent = rankGain(n, r);
      if (n.kind === "active" && n.skill?.mult) el("td", "num", tr).textContent = `≈ ${Math.round(skillPower(this.hero.stats, p.elements, n.skill, r, w))}`;
    }
    if (n.kind === "active" && n.skill?.mult) {
      el("p", "sk-meta", tableWrap).textContent = `*ต่อครั้งที่โดน จาก${statName(n.skill)}ตอนนี้ ${Math.round(n.skill.stat === "matk" ? this.hero.stats.matk : n.skill.stat === "both" ? 0.6 * (this.hero.stats.atk + this.hero.stats.matk) : this.hero.stats.atk)} รวมอาวุธ ธาตุไฟ ก่อนหักการป้องกัน`;
    }

    // actions
    const act = el("div", "sk-actions", panel);
    const why = p.blockNode(treeId, n);
    const b = this.plus(act, !why, why, () => this.add({ kind: "node", tree: treeId, id: n.id }), rank ? `จองอัพเป็นระดับ ${Math.min(n.max, rank + 1)} (1 แต้ม)` : "จองเรียนสกิลนี้ (1 แต้ม)");
    b.classList.add("wide");
    this.minus(act, "node", n.id, `คืนแต้มที่จองไว้ (จองไว้ ${this.planned("node", n.id)})`)?.classList.add("wide");
    if (why) el("p", "sk-why", act).textContent = why;
    const real = this.real;
    if (n.kind === "active" && (real.ranks[n.id] ?? 0) > 0) {
      const slot = el("button", "wr-choice", act);
      slot.type = "button";
      slot.textContent = real.hotbar.includes(n.id) ? `อยู่ในแถบสกิลช่อง ${(real.hotbar.indexOf(n.id) + 1) % 10}` : "ใส่แถบสกิล";
      slot.disabled = real.hotbar.includes(n.id);
      slot.addEventListener("click", () => {
        real.autoSlot(n.id);
        real.changed();
      });
    }
  }

  // ---- masteries and elements: a line from 0 to max with a dot at every milestone ----
  // (a line's second-book part shows only once that book is read: max is where it ends now)
  track(parent: HTMLElement, opts: {
    lv: number; max: number; color: string;
    marks: { at: number; name: string; glyph: string; active?: string; tip: () => string }[];
  }): void {
    const { lv, max, color } = opts;
    const marks = opts.marks.filter((m) => m.at <= max);
    const tr = el("div", `sk-track${marks.length > 6 ? " dense" : ""}`, parent);
    tr.style.setProperty("--fill", color);
    const line = el("div", "sk-line-bar", tr);
    el("i", "", line).style.width = `${(100 * lv) / max}%`;
    const here = el("span", "sk-here", tr);
    here.style.left = `${(100 * lv) / max}%`;
    here.textContent = String(lv);
    const next = marks.find((m) => lv < m.at);
    marks.forEach((m, i) => {
      const got = lv >= m.at;
      const dot = el("div", `sk-dot${got ? " got" : ""}${m === next ? " next" : ""}${marks.length > 6 && i % 2 ? " alt" : ""}`, tr);
      dot.style.left = `${(100 * m.at) / max}%`;
      el("span", "sk-dot-lv", dot).textContent = `Lv ${m.at}`;
      const ic = this.skillIcon(dot, m.active ?? null, m.glyph, got ? color : "#9aa08a", m.active ?? null, got);
      ic.classList.add("small");
      el("span", "sk-dot-name", dot).textContent = m.name;
      this.hoverTip(dot, m.tip);
    });
  }

  renderMastery(): void {
    const p = this.progress;
    const list = el("div", "sk-lines", this.body);
    const holding = this.weapon();
    for (const id of p.masteries()) {
      const m = MASTERIES[id];
      const lv = p.mastery[id] ?? 0;
      const row = el("div", `sk-line${m.weapons?.includes(holding as WeaponId) ? " holding" : ""}`, list);
      const top = el("div", "sk-line-top", row);
      const art = el("span", "sk-icon", top);
      const img = m.weapons && !hasArt(`mastery_${id}`) ? this.weaponImg(m.weapons[0]) : null;
      if (img) {
        const c = el("canvas", "sk-weapon", art);
        c.width = c.height = 64;
        const g = c.getContext("2d")!;
        g.imageSmoothingEnabled = false;
        const s = 56 / Math.max(img.width, img.height);
        g.translate(32, 32);
        if (img.height > img.width * 1.6) g.rotate(Math.PI / 4);
        g.drawImage(img, (-img.width * s) / 2, (-img.height * s) / 2, img.width * s, img.height * s);
      } else {
        art.replaceWith(this.skillIcon(top, `mastery_${id}`, m.glyph, "#8fbf6a", null, true));
      }
      const info = el("div", "sk-info", top);
      const cap = p.masteryMax(id);
      el("strong", "", info).textContent = `${m.name} · ระดับ ${lv}/${cap}${this.planned("mastery", id) ? ` (+${this.planned("mastery", id)})` : ""}${m.weapons?.includes(holding as WeaponId) ? " · ถืออยู่" : ""}`;
      el("span", "sk-sub", info).textContent = `${m.perDesc}${lv && Object.keys(m.per).length ? ` · ตอนนี้ ${bagText(Object.fromEntries(Object.entries(m.per).map(([k, v = 0]) => [k, v * lv])))}` : ""}`;
      const full = lv >= cap;
      if (this.planned("mastery", id)) row.classList.add("planned");
      this.minus(top, "mastery", id);
      this.plus(top, !full && p.free > 0, full ? "เต็มแล้ว" : p.free > 0 ? "จองอัพ 1 ระดับ" : "แต้มสกิลไม่พอ", () => this.add({ kind: "mastery", id }));
      const realLv = this.real.mastery[id] ?? 0;
      this.track(row, {
        lv, max: cap, color: "#f4d27a",
        marks: m.rewards.map((r) => ({
          at: r.at, name: r.name, glyph: r.glyph ?? (r.kind === "active" ? "star" : "up"), active: r.kind === "active" && realLv >= r.at ? r.id : undefined,
          tip: () => r.kind === "active" && r.id
            ? `${skillTip(r.id, lv >= r.at ? 1 : 0)}<br><b>ได้เมื่อ${m.name}ระดับ ${r.at}</b>${m.weapons ? " · ต้องถืออาวุธนี้" : ""}`
            : `<strong>${r.name}</strong>ติดตัวเมื่อ${m.name}ระดับ ${r.at}${lv >= r.at ? " ✓" : ` (อีก ${r.at - lv} ระดับ)`}<br>${r.desc}`,
        })),
      });
    }
  }

  renderElements(): void {
    const p = this.progress;
    const list = el("div", "sk-lines", this.body);
    for (const id of p.elementsOpen()) {
      const e = ELEMENTS[id];
      const lv = p.elements[id] ?? 0;
      const row = el("div", "sk-line", list);
      row.style.setProperty("--fill", e.color);
      const top = el("div", "sk-line-top", row);
      this.skillIcon(top, `element_${id}`, e.glyph, e.color, null, true);
      const info = el("div", "sk-info", top);
      const cap = p.elementMax(id);
      el("strong", "", info).textContent = `ธาตุ${e.name} · เด่นด้าน${e.side} · ระดับ ${lv}/${cap}${this.planned("element", id) ? ` (+${this.planned("element", id)})` : ""}`;
      el("span", "sk-sub", info).textContent = `ต่อระดับ: ${bagText(e.per)} · ${e.skill}`;
      if (lv) el("span", "sk-sub now", info).textContent = `ตอนนี้: ${bagText(Object.fromEntries(Object.entries(e.per).map(([k, v = 0]) => [k, v * lv])))}`;
      const full = lv >= cap;
      if (this.planned("element", id)) row.classList.add("planned");
      this.minus(top, "element", id);
      this.plus(top, !full && p.free > 0, full ? "เต็มแล้ว" : p.free > 0 ? "จองอัพ 1 ระดับ" : "แต้มสกิลไม่พอ", () => this.add({ kind: "element", id }));
      this.track(row, {
        lv, max: cap, color: e.color,
        marks: e.marks.map((m) => ({
          at: m.at, name: m.name, glyph: m.stats ? "up" : e.glyph,
          tip: () => `<strong>${m.name}</strong>เมื่อธาตุ${e.name}ระดับ ${m.at}${lv >= m.at ? " ✓" : ` (อีก ${m.at - lv} ระดับ)`}<br>${m.desc}`,
        })),
      });
    }
  }

  // Drag learned active skills onto the skill bar; double-click puts one in a free slot.
  bindDrag(): void {
    let drag: { id: string; ghost: HTMLCanvasElement; x: number; y: number; moved: boolean } | null = null;
    const iconAt = (e: Event) => (e.target instanceof Element ? e.target.closest<HTMLElement>(".sk-icon.drag") : null);
    this.win.addEventListener("dblclick", (e) => {
      const ic = iconAt(e);
      if (ic?.dataset.skill) {
        this.real.autoSlot(ic.dataset.skill);
        this.real.changed();
      }
    });
    this.win.addEventListener("pointerdown", (e) => {
      const ic = iconAt(e);
      const src = ic?.querySelector("canvas");
      if (!ic?.dataset.skill || !src || e.button !== 0) return;
      e.preventDefault();
      const ghost = document.createElement("canvas");
      ghost.width = src.width;
      ghost.height = src.height;
      ghost.getContext("2d")!.drawImage(src, 0, 0);
      ghost.className = "inv-ghost";
      drag = { id: ic.dataset.skill, ghost, x: e.clientX, y: e.clientY, moved: false };
    });
    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) {
        drag.moved = true;
        document.body.append(drag.ghost);
        this.tip.classList.add("hidden");
      }
      if (drag.moved) {
        drag.ghost.style.left = `${e.clientX}px`;
        drag.ghost.style.top = `${e.clientY}px`;
      }
    });
    window.addEventListener("pointerup", (e) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      d.ghost.remove();
      if (d.moved) this.onDropSkill(d.id, e.clientX, e.clientY);
    });
    window.addEventListener("pointercancel", () => {
      drag?.ghost.remove();
      drag = null;
    });
  }
}

// The buff row under the HP/MP/EXP bars (Ragnarok style): a small square icon for each buff the
// player has, then each ailment on her (red rim), with the time left in the corner; under 5 s the
// icon blinks. Hover (a tap on a phone) shows what it gives, how long it has left and where it came
// from, in a floating tip like the bag's. The row hangs below the panel, so however many icons
// there are, the bars and the rest of the HUD stay put. The DOM is rebuilt only when the set of
// effects changes; the time labels are touched only when their whole second changes.
// The warlock's orbs are not here: they have their own dots beside the skill bar.

import { el } from "./ui";
import { icon, skillIcon } from "./icons";
import { ACTIVES, ELEMENTS, ELEMENT_STAT_NAMES, STAT_NAMES, PERCENT_STATS, RACES, RACE_NAMES, AUTOCAST, TREES } from "./progression";
import type { StatBag } from "./progression";
import { ITEMS } from "./items";
import { COATINGS } from "./poisons";
import type { Buff, Hero } from "./hero";
import type { Img } from "./types";

// Stat bag keys as the player reads them (as the skill window words them).
const NAMES: Record<string, string> = {
  ...STAT_NAMES, ...ELEMENT_STAT_NAMES, atkPct: "พลังโจมตี", matkPct: "พลังเวท", defPct: "ป้องกัน", mdefPct: "ต้านเวท", maxHpPct: "HP สูงสุด",
  maxMpPct: "MP สูงสุด", mpRegenPct: "ฟื้น MP", pierce: "เจาะเกราะ", xpPct: "ค่าประสบการณ์", drop: "โอกาสได้ของ", dmg: "ดาเมจ", reach: "ระยะโจมตี",
  stunHit: "โอกาสตีให้มึน", healPct: "พลังรักษา", multiShot: "โอกาสยิงซ้อน", poisonHit: "โอกาสตีติดพิษ", huntDmg: "ดาเมจใส่ศัตรูติดสถานะ",
  buffTime: "เวลาบัฟ", lifesteal: "ดูดเลือด", lowHpDmg: "ดาเมจเมื่อเลือดน้อย", falconChance: "โอกาสเหยี่ยวโจมตี", falconPower: "พลังเหยี่ยว",
  poisonPct: "พลังพิษ", potion: "ยาฟื้นแรงขึ้น", goldPct: "ทองจากมอนสเตอร์",
  ...Object.fromEntries(RACES.map((r) => [`${r}Dmg`, `ดาเมจใส่${RACE_NAMES[r]}`])),
};
const PCT = new Set(["pierce", "drop", "dmg", "reach", "stunHit", "multiShot", "poisonHit", "huntDmg", "buffTime", "lifesteal", "lowHpDmg", "falconChance", "falconPower", "potion"]);
const isPct = (k: string) => k.endsWith("Pct") || (k.endsWith("Dmg") && k !== "critDmg") || PERCENT_STATS.has(k) || PCT.has(k);
const num = (k: string, v: number) => (isPct(k) ? `${+(Math.abs(v) * 100).toFixed(1)}%` : `${+Math.abs(v).toFixed(1)}`);
// One line a stat ("ความเร็วโจมตี −20%"); stealth is a state, not a number.
function statLines(b: StatBag): string[] {
  return Object.entries(b).filter(([, v]) => v).map(([k, v = 0]) => k === "stealth" ? "ซ่อนตัวจากมอนสเตอร์"
    : k.startsWith(AUTOCAST) ? `ตีแล้วร่าย${ACTIVES[k.slice(AUTOCAST.length)]?.name ?? k}เอง ${+(v * 100).toFixed(1)}%`
    : `${NAMES[k] ?? k} <b class="${v < 0 ? "bad" : "good"}">${v < 0 ? "−" : "+"}${num(k, v)}</b>`);
}

// Time left: seconds, or minutes and seconds past a minute ("1:30").
const clock = (t: number) => {
  const s = Math.ceil(t);
  return s < 60 ? `${s}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// The ailments' pictures (src/main.ts AILMENTS, BITE_AILS and the burn): frost, mud, a dimmed
// eye, heavy feet, stone and fire.
const AIL_ICONS: Record<string, [string, string]> = {
  ice: ["freeze", "#7fcfff"], mud: ["drop", "#9a7448"], dark: ["eye", "#7a5ec8"],
  slow: ["shoes", "#8f96a8"], petrify: ["earth", "#9c9888"], burn: ["flame", "#ff7a3a"],
};
const AIL_FROM: Record<string, string> = { ice: "กัดธาตุน้ำแข็ง", mud: "กัดธาตุโคลน", dark: "กัดธาตุความมืด", slow: "กัดให้เชื่องช้า", petrify: "สาปหิน" };

// One icon's worth: what it is, its picture, its time, and its tip lines.
interface Effect {
  key: string;         // what it is (the row is rebuilt when the keys change)
  name: string;
  bad: boolean;        // an ailment
  left: () => number;  // seconds left now
  steady: boolean;     // kept fresh while something lasts (resting, by a statue, in smoke): no countdown
  label?: () => string; // what the corner shows instead of a countdown (a value that moves)
  pic: () => Img;
  lines: () => string[];
  from: string;
}

interface Shown { e: Effect; box: HTMLElement; time: HTMLElement; sec: number; low: boolean; text: string }

export class BuffBar {
  hero: Hero;
  root: HTMLElement;
  tip: HTMLElement;
  itemIcon: (id: string) => Img;
  burn: () => { t: number; dmg: number };
  shown: Shown[] = [];
  last = "";
  open: Shown | null = null; // the icon whose tip is up

  // parent: the vitals panel; itemIcon: an item's bag icon (for a coating's vial); burn: the fire
  // on her now (main.ts keeps it outside the buffs)
  constructor(parent: HTMLElement, hero: Hero, itemIcon: (id: string) => Img, burn: () => { t: number; dmg: number }) {
    this.hero = hero;
    this.itemIcon = itemIcon;
    this.root = el("div", "buffrow", parent);
    this.root.setAttribute("aria-label", "บัฟและสถานะผิดปกติ");
    this.tip = el("div", "inv-tip buff-tip hidden", document.body);
    this.burn = burn;
    // a tap anywhere else puts the tip away (phones have no hover to leave)
    document.addEventListener("pointerdown", (e) => {
      if (this.open && !this.root.contains(e.target as Node)) this.hideTip();
    }, true);
  }

  // Everything on her now: the buffs and her shield first, the ailments after.
  effects(): Effect[] {
    const h = this.hero, good: Effect[] = [], bad: Effect[] = [];
    for (const b of h.buffs) (b.id.startsWith("ail_") ? bad : good).push(this.describe(b));
    // the low-HP rages (the berserker's frenzy, the axe book's hot blood): passives, each shown under its own name while her HP is down
    for (const p of this.rageParts()) if (p.v > 0) good.push(this.describeRage(p.id));
    if (h.shield) good.push({ key: "shield", name: "โล่", bad: false, left: () => h.shield?.t ?? 0, steady: false, pic: () => icon("shield", "#d6a35c"),
      lines: () => [`ดูดซับความเสียหายได้อีก <b class="good">${Math.round(h.shield?.amount ?? 0)}</b>`], from: "" });
    if (this.burn().t > 0) bad.push({ key: "ail_burn", name: "ไฟลวก", bad: true, left: () => this.burn().t, steady: false, pic: () => icon(...AIL_ICONS.burn),
      lines: () => [`เสีย <b class="bad">${this.burn().dmg}</b> HP ทุกวินาที`], from: "โดนมอนสเตอร์ไฟกัด" });
    return [...good, ...bad];
  }

  // What the row is made of: changes when a buff, the shield or the burn comes or goes.
  key(): string {
    return `${this.hero.buffs.map((b) => `${b.id}:${b.name}`).join("|")}|${this.hero.shield ? "S" : ""}|${this.burn().t > 0 ? "B" : ""}|${this.rageParts().filter((p) => p.v > 0).map((p) => p.id).join(",")}`;
  }

  // What each low-HP rage gives her now: its bonus at her HP (0 at full HP). The stat adds both up,
  // so the frenzy is read from its own node and the rest is the axe's hot blood.
  rageParts(): { id: string; name: string; v: number }[] {
    const h = this.hero, progress = h.progress, down = Math.max(0, 1 - h.hp / h.stats.maxHp);
    const node = (tree: string, id: string) => TREES[tree].nodes.find((n) => n.id === id)!;
    const own = (tree: string, id: string) => {
      const r = progress.ranks[id], n = node(tree, id);
      return r && progress.trees().includes(tree) && n.stats ? n.stats(r).lowHpDmg ?? 0 : 0;
    };
    const frenzy = own("berserker", "berserker_frenzy"), axe = Math.max(0, (h.stats.lowHpDmg ?? 0) - frenzy);
    return [
      { id: "berserker_frenzy", name: node("berserker", "berserker_frenzy").name, v: frenzy * down },
      { id: "berserk_axe_rage", name: node("berserk_axe", "berserk_axe_rage").name, v: axe * down },
    ];
  }

  describeRage(id: string): Effect {
    const part = () => this.rageParts().find((p) => p.id === id)!;
    const pct = () => `${Math.round(part().v * 100)}%`;
    return {
      key: id, name: part().name, bad: false, left: () => 0, steady: true, label: () => `+${pct()}`,
      pic: () => skillIcon(id, "rage", "#ff8a6a"),
      lines: () => [`ดาเมจเพิ่ม <b class="good">+${pct()}</b> (HP เหลือ ${Math.round((this.hero.hp / this.hero.stats.maxHp) * 100)}%)`],
      from: `สกิล ${part().name}`,
    };
  }

  // A buff as an icon: its picture and where it came from, by its id (a skill's own id; hot_,
  // copy_, smoke_ and ally_ before a skill's id; ail_ an ailment; coating, rest, wind_rush).
  describe(b: Buff): Effect {
    // (the same buff cast again is a new object: read the one she has now)
    const now = () => this.hero.buffs.find((x) => x.id === b.id) ?? b;
    const pre = /^(hot|copy|smoke|ally|ail)_(.+)$/.exec(b.id), kind = pre?.[1] ?? "", sid = pre ? pre[2] : b.id, a = ACTIVES[sid];
    const e: Effect = {
      key: `${b.id}:${b.name}`, name: b.name, bad: kind === "ail", left: () => now().t, steady: b.duration <= 1,
      pic: () => (a ? skillIcon(sid, a.glyph, a.color) : icon("star", "#f4d27a")),
      lines: () => {
        const c = now(), out = statLines(c.stats);
        if (c.enchant) out.unshift(`อาวุธโจมตีเป็น<span style="color:${ELEMENTS[c.enchant].color}">ธาตุ${ELEMENTS[c.enchant].name}</span>`);
        if (c.form) out.unshift("แปลงร่างอยู่");
        if (c.terrain) out.push("ค่าเปลี่ยนไปตามพื้นที่");
        return out;
      },
      from: a ? `สกิล ${a.name}` : "",
    };
    if (kind === "hot") e.lines = () => ["ฟื้น HP ทีละส่วนทุกวินาที"];
    else if (kind === "copy") e.lines = () => ["ใช้การโจมตีที่ก๊อปมาจากมอนสเตอร์ได้"];
    else if (kind === "smoke") e.from = `อยู่ในม่านควัน${a ? ` (${a.name})` : ""}`;
    else if (kind === "ally") e.from = "ยืนอยู่ใกล้ผู้ช่วย";
    else if (kind === "ail") {
      const [g, c] = AIL_ICONS[sid] ?? ["skull", "#c0504a"];
      e.pic = () => icon(g, c);
      e.from = `โดนมอนสเตอร์${AIL_FROM[sid] ?? "ทำร้าย"}`;
    } else if (b.id === "rest") {
      e.pic = () => icon("heal", "#9df0b4");
      e.from = "นั่งพักฟื้น (ลุกขึ้นแล้วหายไป)";
    } else if (b.id === "wind_rush") {
      e.pic = () => skillIcon("element_wind", ELEMENTS.wind.glyph, ELEMENTS.wind.color);
      e.from = "ธาตุลม: ใช้สกิลแล้ววิ่งเร็วขึ้นชั่วครู่";
    } else if (b.id === "coating") {
      // which vial: the one whose name the buff carries
      const vial = Object.keys(COATINGS).find((id) => b.name === `เคลือบ${ITEMS[id]?.name}`);
      e.pic = () => (vial ? this.itemIcon(vial) : icon("drop", "#8fdc4a"));
      e.from = vial ? `ไอเทม ${ITEMS[vial].name}` : "ยาเคลือบอาวุธ";
    }
    return e;
  }

  // Each frame: rebuild if the set changed, else just the labels whose second ticked over.
  update(): void {
    const key = this.key();
    if (key !== this.last) {
      this.last = key;
      this.build(this.effects());
    }
    for (const s of this.shown) this.tick(s);
  }

  build(list: Effect[]): void {
    const wasOpen = this.open?.e.key;
    this.hideTip();
    this.shown = list.map((e) => {
      const box = el("div", `bf${e.bad ? " bad" : ""}`);
      const c = el("canvas", "", box);
      c.width = c.height = 48;
      c.getContext("2d")!.drawImage(e.pic(), 0, 0, 48, 48);
      const time = el("span", "bf-t", box);
      const s: Shown = { e, box, time, sec: -1, low: false, text: "" };
      box.addEventListener("pointerenter", (ev) => ev.pointerType === "mouse" && this.showTip(s));
      box.addEventListener("pointerleave", (ev) => ev.pointerType === "mouse" && this.hideTip());
      // a tap: the tip, or away again
      box.addEventListener("pointerdown", (ev) => {
        if (ev.pointerType === "mouse") return;
        ev.preventDefault();
        if (this.open === s) this.hideTip();
        else this.showTip(s);
      });
      return s;
    });
    this.root.replaceChildren(...this.shown.map((s) => s.box));
    const again = this.shown.find((s) => s.e.key === wasOpen);
    if (again) this.showTip(again);
  }

  tick(s: Shown): void {
    if (s.e.label) {
      const text = s.e.label();
      if (text === s.text) return;
      s.text = s.time.textContent = text;
      if (this.open === s) this.fillTip(s);
      return;
    }
    const t = s.e.left(), sec = s.e.steady ? 0 : Math.ceil(t);
    if (sec === s.sec) return;
    s.sec = sec;
    s.time.textContent = s.e.steady ? "" : clock(t);
    const low = !s.e.steady && t < 5;
    if (low !== s.low) s.box.classList.toggle("low", (s.low = low));
    if (this.open === s) this.fillTip(s);
  }

  showTip(s: Shown): void {
    this.open = s;
    this.fillTip(s);
    this.tip.classList.remove("hidden");
    // under the icon, kept on screen
    const at = s.box.getBoundingClientRect(), r = this.tip.getBoundingClientRect();
    this.tip.style.left = `${Math.max(8, Math.min(innerWidth - r.width - 8, at.left))}px`;
    const below = at.bottom + 6;
    this.tip.style.top = `${below + r.height > innerHeight - 8 ? Math.max(8, at.top - r.height - 6) : below}px`;
  }

  fillTip(s: Shown): void {
    const e = s.e, lines = e.lines();
    const time = e.label ? "ตราบที่ HP ยังไม่เต็ม" : e.steady ? "ต่อเนื่อง (ระหว่างที่ยังทำอยู่)" : `เหลือ ${clock(e.left())} วินาที`.replace(/(\d+:\d+) วินาที/, "$1 นาที");
    this.tip.innerHTML = `<strong class="${e.bad ? "bad" : ""}">${e.name}</strong>`
      + `<span class="inv-tip-kind">${e.bad ? "สถานะผิดปกติ" : "บัฟ"} · ${time}</span>`
      + (lines.length ? lines.join("<br>") : "")
      + (e.from ? `<span class="buff-tip-from">${e.from}</span>` : "");
  }

  hideTip(): void {
    this.open = null;
    this.tip.classList.add("hidden");
  }
}

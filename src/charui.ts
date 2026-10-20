// Character UI: the HP/MP/EXP panel, the class picker, the status window (P) and the skill
// window (K) with its three tabs: skill trees, masteries and elements.

import { el, makeWindow } from "./ui";
import { icon } from "./icons";
import {
  CLASSES, TREES, MASTERIES, ELEMENTS, ACTIVES, STAT_NAMES, PERCENT_STATS, MAX_LEVEL,
} from "./progression";
import { ITEMS } from "./items";
import type { WeaponId } from "./items";
import type { ClassId, Progress } from "./progression";
import type { Hero } from "./hero";
import type { Stats } from "./stats";
import type { Img } from "./types";

const fmt = (key: string, v: number) => (PERCENT_STATS.has(key) ? `${(v * 100).toFixed(1)}%` : key.endsWith("Regen") ? v.toFixed(1) : Math.round(v).toString());

// Tooltip text for an active skill at a rank.
export function skillTip(id: string, rank: number): string {
  const a = ACTIVES[id], s = a.skill;
  const r = Math.max(1, rank);
  const desc = typeof a.desc === "function" ? a.desc(r) : a.desc;
  const where = a.source.tree ? `ต้น${TREES[a.source.tree].name}` : `ความเชี่ยวชาญ${MASTERIES[a.source.mastery!].name} ระดับ ${a.source.at}`;
  return `<strong>${a.name}${a.max > 1 ? ` · ระดับ ${rank}/${a.max}` : ""}</strong>${where}<br>MP ${s.mp} · คูลดาวน์ ${s.cd} วิ${s.cast ? ` · ร่าย ${s.cast} วิ` : ""}<br>${desc}`;
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

  constructor(root: HTMLElement, progress: Progress, hero: Hero) {
    this.progress = progress;
    this.hero = hero;
    this.root = root;
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
    const key = [p.level, p.cls, p.free, Math.ceil(h.hp), Math.ceil(h.mp), Math.round(s.maxHp), Math.round(s.maxMp), p.xp,
      Math.round(h.shield?.amount ?? 0), h.buffs.map((b) => `${b.id}${Math.ceil(b.t)}`).join()].join("|");
    if (key === this.last) return;
    this.last = key;
    this.lv.textContent = `Lv ${p.level}`;
    this.cls.textContent = p.cls ? CLASSES[p.cls].name : "ยังไม่เลือกคลาส";
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
      const t = el("span", "vt-buff");
      t.textContent = `${b.name} ${Math.ceil(b.t)}`;
      return t;
    }));
  }
}

// ---- class picker ----
export class ClassPicker {
  root: HTMLElement;

  // onPick(cls)
  constructor(onPick: (cls: ClassId) => void) {
    this.root = el("div", "picker hidden", document.body);
    const box = el("div", "picker-box", this.root);
    el("h2", "", box).textContent = "เลือกคลาส";
    el("p", "picker-note", box).textContent = "คลาสกำหนดค่าสเตตัสและต้นสกิลเริ่มต้น 3 ต้น เปลี่ยนได้ภายหลังที่หน้าต่างสถานะ (แต้มสกิลคืนทั้งหมด)";
    const row = el("div", "picker-row", box);
    for (const [id, c] of Object.entries(CLASSES) as [ClassId, (typeof CLASSES)[ClassId]][]) {
      const b = el("button", "picker-card", row);
      b.type = "button";
      el("strong", "", b).textContent = c.name;
      el("span", "", b).textContent = c.note;
      const trees = el("span", "picker-trees", b);
      trees.textContent = `ต้นสกิล: ${c.trees.map((t) => TREES[t].name).join(" · ")}`;
      b.addEventListener("click", () => {
        this.hide();
        onPick(id);
      });
    }
  }

  show(): void {
    this.root.classList.remove("hidden");
  }

  hide(): void {
    this.root.classList.add("hidden");
  }
}

// ---- status window ----
export class StatusUI {
  progress: Progress;
  hero: Hero;
  win: HTMLElement;
  head: HTMLElement;
  table: HTMLElement;

  // onClassChange(): open the picker
  constructor(progress: Progress, hero: Hero, onClassChange: () => void) {
    this.progress = progress;
    this.hero = hero;
    this.win = makeWindow("status", "สถานะ", "P");
    const body = el("div", "st-body", this.win);
    this.head = el("div", "st-head", body);
    this.table = el("div", "st-table", body);
    const actions = el("div", "st-actions", body);
    const refund = el("button", "wr-choice", actions);
    refund.type = "button";
    refund.textContent = "คืนแต้มสกิลทั้งหมด";
    refund.addEventListener("click", () => {
      progress.refund();
      hero.recompute();
    });
    const change = el("button", "wr-choice", actions);
    change.type = "button";
    change.textContent = "เปลี่ยนคลาส";
    change.addEventListener("click", onClassChange);
    el("p", "wr-note", body).textContent = "ค่าสเตตัสมาจากคลาส เลเวล ธาตุ สกิลติดตัว ความเชี่ยวชาญของอาวุธที่ถือ และบัฟ";
  }

  toggle(show = this.win.classList.contains("hidden")): void {
    this.win.classList.toggle("hidden", !show);
    if (show) this.render();
  }

  render(): void {
    if (this.win.classList.contains("hidden")) return;
    const p = this.progress, s = this.hero.stats;
    this.head.innerHTML = `<strong>${p.cls ? CLASSES[p.cls].name : "-"}</strong> · Lv ${p.level} / ${MAX_LEVEL}` +
      `<br>EXP ${Math.floor(p.xp)} / ${p.level >= MAX_LEVEL ? "-" : p.xpNeed} · แต้มสกิล ${p.free} / ${p.points}`;
    this.table.replaceChildren(...Object.entries(STAT_NAMES).map(([k, name]) => {
      const row = el("div", "st-row");
      el("span", "", row).textContent = name;
      el("b", "", row).textContent = fmt(k, s[k as keyof Stats]);
      return row;
    }));
  }
}

// ---- skill window ----
interface SkillUIDeps {
  weapon: () => string | null;
  weaponImg: (type: WeaponId) => Img | undefined;
  onDropSkill: (id: string, x: number, y: number) => void;
}

export class SkillUI {
  progress: Progress;
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

  // weaponImg(type): weapon art image; onDropSkill(id, x, y): dropped at a screen point
  constructor(progress: Progress, hero: Hero, { weaponImg, onDropSkill, weapon }: SkillUIDeps) {
    this.progress = progress;
    this.hero = hero;
    this.weaponImg = weaponImg;
    this.onDropSkill = onDropSkill;
    this.weapon = weapon;
    this.win = makeWindow("skills", "สกิล", "K");
    this.win.classList.add("sk-window");
    const top = el("div", "sk-top", this.win);
    this.points = el("span", "sk-points", top);
    this.tabs = el("div", "sk-tabs", top);
    for (const [id, name] of [["trees", "ต้นสกิล"], ["mastery", "ความเชี่ยวชาญ"], ["elements", "ธาตุ"]] as const) {
      const b = el("button", "sk-tab", this.tabs);
      b.type = "button";
      b.dataset.tab = id;
      b.textContent = name;
      b.addEventListener("click", () => {
        this.tab = id;
        this.render();
      });
    }
    this.body = el("div", "sk-body", this.win);
    this.tip = el("div", "inv-tip hidden", document.body);
    el("p", "wr-note sk-help", this.win).textContent = "กด + เพื่อลงแต้ม · ลากไอคอนสกิลที่เรียนแล้วไปวางที่แถบสกิล หรือดับเบิลคลิกเพื่อใส่ช่องว่าง";
    progress.onChange(() => this.render());
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
    this.points.innerHTML = `แต้มสกิล <b>${p.free}</b> / ${p.points}`;
    for (const b of this.tabs.children) b.classList.toggle("on", (b as HTMLElement).dataset.tab === this.tab);
    this.body.replaceChildren();
    if (this.tab === "trees") this.renderTrees();
    else if (this.tab === "mastery") this.renderMastery();
    else this.renderElements();
  }

  plus(parent: HTMLElement, enabled: boolean, why: string | null, onClick: () => void): HTMLButtonElement {
    const b = el("button", "sk-plus", parent);
    b.type = "button";
    b.textContent = "+";
    b.disabled = !enabled;
    if (why) b.title = why;
    b.addEventListener("click", onClick);
    return b;
  }

  skillIcon(parent: HTMLElement, glyph: string, color: string, activeId: string | null | undefined, learned: boolean): HTMLElement {
    const wrap = el("span", `sk-icon${learned ? "" : " dim"}`, parent);
    const c = icon(glyph, color);
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

  renderTrees(): void {
    const p = this.progress;
    const grid = el("div", "sk-trees", this.body);
    for (const treeId of p.trees()) {
      const tree = TREES[treeId];
      const col = el("div", "sk-tree", grid);
      col.style.setProperty("--tree", tree.color);
      const h = el("div", "sk-tree-head", col);
      this.skillIcon(h, tree.glyph, tree.color, null, true);
      const t = el("div", "", h);
      el("strong", "", t).textContent = tree.name;
      el("span", "sk-sub", t).textContent = `${tree.note} · ลงแล้ว ${p.pointsIn(treeId)}`;
      for (const n of tree.nodes) {
        const rank = p.ranks[n.id] ?? 0;
        const row = el("div", `sk-node${rank ? " learned" : ""}`, col);
        this.skillIcon(row, n.glyph, tree.color, n.kind === "active" ? n.id : null, rank > 0);
        const info = el("div", "sk-info", row);
        el("strong", "", info).textContent = n.name;
        el("span", "sk-sub", info).textContent = `${n.kind === "active" ? "สกิล" : "ติดตัว"} · ${rank}/${n.max}${n.need ? ` · ต้องลง ${n.need}` : ""}`;
        const why = p.blockNode(treeId, n);
        this.plus(row, !why, why, () => {
          p.raiseNode(treeId, n.id);
          this.hero.recompute();
        });
        this.hoverTip(row, () => n.kind === "active" ? skillTip(n.id, rank)
          : `<strong>${n.name} · ระดับ ${rank}/${n.max}</strong>สกิลติดตัว<br>${n.desc(Math.max(1, rank))}${rank < n.max ? `<br>ระดับถัดไป: ${n.desc(rank + 1)}` : ""}`);
      }
    }
    for (const treeId of p.lockedTrees()) {
      const tree = TREES[treeId];
      const col = el("div", "sk-tree locked", grid);
      const h = el("div", "sk-tree-head", col);
      this.skillIcon(h, tree.glyph, tree.color, null, false);
      const t = el("div", "", h);
      el("strong", "", t).textContent = `${tree.name} 🔒`;
      el("span", "sk-sub", t).textContent = tree.note;
      el("p", "sk-lock", col).textContent = `ปลดล็อคด้วย ${ITEMS[tree.book ?? ""]?.name ?? "คัมภีร์"} (ดรอปจากสไลม์)`;
    }
  }

  renderMastery(): void {
    const p = this.progress;
    const list = el("div", "sk-lines", this.body);
    const holding = this.weapon();
    for (const id of Object.keys(MASTERIES)) {
      const m = MASTERIES[id];
      const open = p.masteries().includes(id);
      const lv = p.mastery[id] ?? 0;
      const row = el("div", `sk-line${open ? "" : " locked"}${m.weapons?.includes(holding as WeaponId) ? " holding" : ""}`, list);
      const art = el("span", "sk-icon", row);
      const img = m.weapons ? this.weaponImg(m.weapons[0]) : null;
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
        art.replaceWith(this.skillIcon(row, m.glyph, "#8fbf6a", null, open));
      }
      const info = el("div", "sk-info", row);
      el("strong", "", info).textContent = `${m.name}${open ? "" : " 🔒"}`;
      el("span", "sk-sub", info).textContent = open ? `ระดับ ${lv}/${m.max} · ${m.perDesc}` : `ปลดล็อคด้วย ${ITEMS[m.book ?? ""]?.name ?? "คัมภีร์"}`;
      const bar = el("div", "sk-progress", info);
      el("i", "", bar).style.width = `${(100 * lv) / m.max}%`;
      const chips = el("div", "sk-chips", info);
      for (const r of m.rewards) {
        const got = lv >= r.at;
        const chip = el("span", `sk-chip${got ? " got" : ""}${r.kind === "active" ? " active" : ""}`, chips);
        if (r.kind === "active") {
          const ic = this.skillIcon(chip, r.glyph ?? "star", "#ffe6a8", r.id, got);
          ic.classList.add("small");
        }
        el("span", "", chip).textContent = `${r.at}: ${r.name}`;
        this.hoverTip(chip, () => r.kind === "active" && r.id ? skillTip(r.id, got ? 1 : 0) + (m.weapons ? "<br>ต้องถืออาวุธนี้" : "")
          : `<strong>${r.name}</strong>ติดตัวเมื่อระดับ ${r.at}<br>${r.desc}`);
      }
      if (open) {
        const full = lv >= m.max;
        this.plus(row, !full && p.free > 0, full ? "เต็มแล้ว" : p.free > 0 ? null : "แต้มสกิลไม่พอ", () => {
          p.raiseMastery(id);
          this.hero.recompute();
        });
      }
    }
  }

  renderElements(): void {
    const p = this.progress;
    const list = el("div", "sk-lines", this.body);
    for (const id of Object.keys(ELEMENTS)) {
      const e = ELEMENTS[id];
      const open = p.elementsOpen().includes(id);
      const lv = p.elements[id] ?? 0;
      const row = el("div", `sk-line${open ? "" : " locked"}`, list);
      this.skillIcon(row, e.glyph, e.color, null, open);
      const info = el("div", "sk-info", row);
      el("strong", "", info).textContent = `ธาตุ${e.name} · เด่นด้าน${e.side}${open ? "" : " 🔒"}`;
      const per = Object.entries(e.per).map(([k, v = 0]) => `${STAT_NAMES[k]} +${PERCENT_STATS.has(k) ? `${(v * 100).toFixed(1)}%` : v}`).join(" · ");
      el("span", "sk-sub", info).textContent = open ? `ระดับ ${lv}/${e.max} · ต่อระดับ: ${per}` : `ปลดล็อคด้วย ${ITEMS[e.book ?? ""]?.name ?? "คัมภีร์"}`;
      const bar = el("div", "sk-progress", info);
      bar.style.setProperty("--fill", e.color);
      el("i", "", bar).style.width = `${(100 * lv) / e.max}%`;
      const chips = el("div", "sk-chips", info);
      el("span", `sk-chip${lv > 0 ? " got" : ""}`, chips).textContent = `เสริมสกิล: ${e.skill}`;
      el("span", `sk-chip${lv >= 10 ? " got" : ""}`, chips).textContent = `10: ${e.at10}`;
      if (open) {
        const full = lv >= e.max;
        this.plus(row, !full && p.free > 0, full ? "เต็มแล้ว" : p.free > 0 ? null : "แต้มสกิลไม่พอ", () => {
          p.raiseElement(id);
          this.hero.recompute();
        });
      }
    }
  }

  // Drag learned active skills onto the skill bar; double-click puts one in a free slot.
  bindDrag(): void {
    let drag: { id: string; ghost: HTMLCanvasElement; x: number; y: number; moved: boolean } | null = null;
    const iconAt = (e: Event) => (e.target instanceof Element ? e.target.closest<HTMLElement>(".sk-icon.drag") : null);
    this.win.addEventListener("dblclick", (e) => {
      const ic = iconAt(e);
      if (ic?.dataset.skill) {
        this.progress.autoSlot(ic.dataset.skill);
        this.progress.changed();
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
  }
}


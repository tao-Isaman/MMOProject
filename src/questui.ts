// Talking to the townsfolk, and the quests on screen (src/quests.ts): the talk window anyone
// opens when spoken to (what they say, their business: buying and selling, healing, travel, and
// their quests to take, hand in or be reminded of), the quest log (J) with what is on, what can
// be taken and what is done, and the tracker under HP/MP that shows the steps under way. Only the
// step under way shows (what comes after is for the player to find out), with where to go: the
// place someone stands at, the field the monsters live in, and a guide button that walks there.

import { el, makeWindow } from "./ui";
import { ITEMS } from "./items";
import { MAP_NAMES } from "./maps";
import { QUESTS, QUEST_BY_ID, questJob, rewardText } from "./quests";
import { JOB_POINTS, TREES } from "./progression";
import { monsterField, placeOf, questDest } from "./guide";
import type { QuestDef, Quests } from "./quests";
import type { MapId } from "./maps";

const itemName = (id: string) => ITEMS[id]?.name ?? id;
const townName = (map: MapId) => (MAP_NAMES as Record<string, string>)[map] ?? map;

// What a step needs, with how far it has got and where ("ปราบสไลม์เขียว 3/5 (ทุ่งนอกเมือง)",
// "ไปคุยกับท่านนาดีม (บาฮามัส · โอเอซิส)").
function stepLine(quests: Quests, q: QuestDef): string {
  const st = quests.step(q.id);
  if (!st) return "";
  const p = quests.progress(q.id), g = st.goal;
  const count = g.kind === "kill" || g.kind === "collect" ? ` ${p.have}/${p.need}` : "";
  const field = g.kind === "kill" ? g.what[0] : g.kind === "collect" ? g.from?.[0] : undefined;
  const where = g.kind === "talk" ? placeOf(st.to) : field ? townName(monsterField(field)) : "";
  return `${st.task}${count}${where && !st.task.includes(where) ? ` (${where})` : ""}`;
}

// What the step is waiting on once its goal is met.
function handInLine(quests: Quests, q: QuestDef): string {
  const st = quests.step(q.id);
  if (!st || !quests.ready(q.id) || st.goal.kind === "talk") return "";
  return `ส่งได้ที่ ${st.to.name} (${placeOf(st.to)})`;
}

// ---- talking to someone ----
export interface Speaker {
  name: string;
  title: string;
  map: MapId;
  npc: string;
  line: string;                                     // what they say first
  // their business (buy, sell, heal, travel...): one that answers with a line keeps the window
  // open on it, the others close it (the shop, the map)
  actions: { label: string; run: () => string | void }[];
}

export class TalkDialog {
  quests: Quests;
  box: HTMLElement;
  head: HTMLElement;
  text: HTMLElement;
  list: HTMLElement;
  buttons: HTMLElement;
  who: Speaker | null = null;
  onGuide: ((q: QuestDef) => void) | null = null; // the guide button: walk to where the step leads

  constructor(quests: Quests) {
    this.quests = quests;
    this.box = el("section", "qd hidden", document.body);
    this.box.setAttribute("role", "dialog");
    this.head = el("header", "qd-head", this.box);
    this.text = el("p", "qd-text", this.box);
    this.list = el("div", "qd-list", this.box);
    this.buttons = el("div", "qd-buttons", this.box);
  }

  get open(): boolean {
    return !this.box.classList.contains("hidden");
  }

  close(): void {
    this.box.classList.add("hidden");
    this.who = null;
  }

  // What they say, their business and their quests; a quest picked shows its page.
  show(who: Speaker): void {
    this.who = who;
    this.box.classList.remove("hidden");
    this.home();
  }

  private header(sub = ""): void {
    const w = this.who!;
    this.head.replaceChildren();
    el("b", "qd-name", this.head).textContent = w.name;
    el("span", "qd-title", this.head).textContent = sub || w.title;
    const x = el("button", "window-close", this.head);
    x.type = "button";
    x.textContent = "×";
    x.addEventListener("click", () => this.close());
  }

  private button(label: string, run: () => void, cls = ""): void {
    const b = el("button", `qd-btn ${cls}`, this.buttons);
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", run);
  }

  home(): void {
    const w = this.who;
    if (!w) return;
    const o = this.quests.optionsFor(w.map, w.npc);
    this.header();
    this.text.textContent = w.line;
    this.list.replaceChildren();
    const row = (tag: string, text: string, cls: string, run: () => void) => {
      const b = el("button", `qd-quest ${cls}`, this.list);
      b.type = "button";
      el("span", "qd-tag", b).textContent = tag;
      el("span", "", b).textContent = text;
      b.addEventListener("click", run);
    };
    // their business first, then their quests: to hand in, to take, under way
    for (const a of w.actions) row("▸", a.label, "biz", () => {
      const said = a.run();
      if (!said) return this.close();
      w.line = said;
      this.home();
    });
    for (const q of o.ready) row("ส่งเควส", q.name, "ready", () => this.page(q));
    for (const q of o.offers) row("เควส", q.name, "offer", () => this.page(q));
    for (const q of o.busy) row("กำลังทำ", q.name, "busy", () => this.page(q));
    for (const q of o.locked) row("ยังรับไม่ได้", q.name, "busy", () => this.page(q));
    this.buttons.replaceChildren();
    this.button("ลาก่อน", () => this.close());
  }

  // One quest: the offer and its reward, or the step to hand in, or a reminder.
  page(q: QuestDef): void {
    const w = this.who;
    if (!w) return;
    const quests = this.quests;
    this.header(q.repeat ? `${q.name} · ทำซ้ำได้` : q.name);
    this.list.replaceChildren();
    this.buttons.replaceChildren();
    const st = quests.step(q.id);
    const forMe = st && st.to.map === w.map && st.to.npc === w.npc;
    if (!quests.isActive(q.id)) {
      this.text.textContent = q.offer;
      const why = quests.why(q);
      if (why) {
        // a job quest it can't take yet: what it takes
        el("p", "qd-reward qd-why", this.list).textContent = `ยังรับไม่ได้: ${why}`;
        this.button("กลับ", () => this.home());
        return;
      }
      el("p", "qd-reward", this.list).textContent = `รางวัล: ${rewardText(q.reward, itemName)}`;
      this.button("รับเควส", () => {
        quests.accept(q.id);
        this.home();
      }, "main");
    } else if (forMe && quests.ready(q.id) && questJob(q) && quests.s.active[q.id].step === q.steps.length - 1) {
      this.branches(q);
      return;
    } else if (forMe && quests.ready(q.id)) {
      const last = quests.s.active[q.id].step === q.steps.length - 1;
      this.text.textContent = st!.goal.kind === "talk" ? st!.say : `${st!.task} — ครบแล้ว`;
      if (last) el("p", "qd-reward", this.list).textContent = `รางวัล: ${rewardText(q.reward, itemName)}`;
      this.button(st!.goal.kind === "talk" ? "ตกลง" : "ส่งเควส", () => {
        const said = quests.handIn(q.id);
        if (said && st!.goal.kind !== "talk") {
          // what they say on taking it, then back to the list
          this.text.textContent = said;
          this.list.replaceChildren();
          this.buttons.replaceChildren();
          this.button("ตกลง", () => this.home(), "main");
        } else this.home();
      }, "main");
    } else {
      this.text.textContent = `ยังไม่เสร็จ: ${stepLine(quests, q)}`;
      const at = handInLine(quests, q);
      if (at) el("p", "qd-reward", this.list).textContent = at;
      const guide = this.onGuide;
      if (guide && questDest(quests, q)) this.button("นำทาง", () => {
        this.close();
        guide(q);
      });
    }
    this.button("กลับ", () => this.home());
  }

  // The last hand-in of a job quest: the master tells of the job's branches; the player picks one
  // (a second press on it confirms) and takes the job.
  branches(q: QuestDef, picked: string | null = null): void {
    const job = questJob(q)!, quests = this.quests;
    this.header(`${job.name} · เลือกสาย`);
    this.text.textContent = `${job.name}มี ${job.branches.length} สาย เลือกได้เพียงสายเดียว และเปลี่ยนภายหลังไม่ได้ เลือกแล้วได้ต้นสกิลของสายนั้นพร้อมแต้มสกิล ${JOB_POINTS} แต้ม`;
    this.list.replaceChildren();
    this.buttons.replaceChildren();
    for (const id of job.branches) {
      const t = TREES[id];
      const b = el("button", `qd-branch${picked === id ? " on" : ""}`, this.list);
      b.type = "button";
      b.style.setProperty("--tree", t.color);
      el("b", "", b).textContent = t.name;
      el("span", "qd-branch-note", b).textContent = t.note;
      const skills = t.nodes.filter((n) => n.kind === "active").slice(0, 5).map((n) => n.name).join(" · ");
      el("span", "qd-branch-skills", b).textContent = `สกิล: ${skills} ...`;
      b.addEventListener("click", () => {
        if (picked !== id) return this.branches(q, id);
        const said = quests.handIn(q.id, id);
        if (!said) {
          this.text.textContent = quests.why(q) ?? "ยังเปลี่ยนอาชีพไม่ได้";
          return;
        }
        this.text.textContent = said;
        this.list.replaceChildren();
        el("p", "qd-reward", this.list).textContent = `เปลี่ยนอาชีพเป็น${job.name} · ${t.name} แล้ว`;
        this.buttons.replaceChildren();
        this.button("ตกลง", () => this.home(), "main");
      });
    }
    if (picked) el("p", "qd-reward", this.list).textContent = `กดที่ "${TREES[picked].name}" อีกครั้งเพื่อยืนยัน`;
    this.button("กลับ", () => this.home());
  }
}

// ---- the quest log (J) ----
export class QuestLog {
  quests: Quests;
  win: HTMLElement;
  tabs: HTMLElement;
  list: HTMLElement;
  tab: "on" | "open" | "done" = "on";
  onGuide: ((q: QuestDef) => void) | null = null;

  constructor(quests: Quests) {
    this.quests = quests;
    this.win = makeWindow("quests", "เควส", "J");
    const top = el("div", "shop-top", this.win);
    this.tabs = el("div", "sk-tabs", top);
    for (const [id, name] of [["on", "กำลังทำ"], ["open", "รับได้"], ["done", "สำเร็จแล้ว"]] as const) {
      const b = el("button", "sk-tab", this.tabs);
      b.type = "button";
      b.dataset.tab = id;
      b.textContent = name;
      b.addEventListener("click", () => {
        this.tab = id;
        this.render();
      });
    }
    this.list = el("div", "ql-list", this.win);
    quests.onChange(() => this.render());
    this.render();
  }

  get open(): boolean {
    return !this.win.classList.contains("hidden");
  }

  toggle(show = !this.open): void {
    this.win.classList.toggle("hidden", !show);
    if (show) this.render();
  }

  render(): void {
    if (!this.open) return;
    const quests = this.quests;
    for (const b of this.tabs.children) (b as HTMLElement).classList.toggle("on", (b as HTMLElement).dataset.tab === this.tab);
    this.list.replaceChildren();
    const card = (q: QuestDef) => {
      const c = el("div", "ql-card", this.list);
      const h = el("div", "ql-head", c);
      el("b", "", h).textContent = q.name;
      el("span", `ql-kind${q.repeat ? " repeat" : ""}`, h).textContent = q.repeat ? "ทำซ้ำได้" : "ครั้งเดียว";
      el("p", "ql-who", c).textContent = `${q.giver.name} · ${placeOf(q.giver)}${q.level ? ` · Lv ${q.level}+` : ""}`;
      return c;
    };
    if (this.tab === "on") {
      const on = QUESTS.filter((q) => quests.isActive(q.id));
      if (!on.length) el("p", "ql-empty", this.list).textContent = "ยังไม่มีเควสที่ทำอยู่ ดูเควสที่รับได้ในแท็บ \"รับได้\" แล้วไปคุยกับคนให้เควส";
      for (const q of on) {
        const c = card(q);
        el("p", `ql-step${quests.ready(q.id) ? " ready" : ""}`, c).textContent = `ตอนนี้: ${stepLine(quests, q)}`;
        const at = handInLine(quests, q);
        if (at) el("p", "ql-at", c).textContent = at;
        el("p", "ql-reward", c).textContent = `รางวัล: ${rewardText(q.reward, itemName)}`;
        const guide = this.onGuide;
        if (guide && questDest(quests, q)) {
          const g = el("button", "ql-guide", c);
          g.type = "button";
          g.textContent = "นำทาง";
          g.addEventListener("click", () => {
            this.toggle(false);
            guide(q);
          });
        }
        const x = el("button", "ql-drop", c);
        x.type = "button";
        x.textContent = "ยกเลิกเควส";
        x.addEventListener("click", () => {
          if (x.dataset.sure) quests.abandon(q.id);
          else {
            x.dataset.sure = "1";
            x.textContent = "กดอีกครั้งเพื่อยืนยัน";
          }
        });
      }
    } else if (this.tab === "open") {
      // the ones that can be taken now first, then the rest with why not yet
      const all = QUESTS.filter((q) => !quests.isActive(q.id) && (q.repeat || !quests.timesDone(q.id)));
      all.sort((a, b) => Number(!quests.available(a)) - Number(!quests.available(b)) || (a.level ?? 1) - (b.level ?? 1));
      for (const q of all) {
        const c = card(q), why = quests.why(q);
        c.classList.toggle("locked", !!why);
        el("p", "ql-step", c).textContent = why ?? q.offer;
        el("p", "ql-reward", c).textContent = `รางวัล: ${rewardText(q.reward, itemName)}`;
      }
    } else {
      const done = QUESTS.filter((q) => quests.timesDone(q.id));
      if (!done.length) el("p", "ql-empty", this.list).textContent = "ยังไม่มีเควสที่สำเร็จ";
      for (const q of done) {
        const c = card(q);
        el("p", "ql-step", c).textContent = q.repeat ? `สำเร็จแล้ว ${quests.timesDone(q.id)} ครั้ง` : "สำเร็จแล้ว";
      }
    }
  }
}

// ---- the tracker under HP/MP: the steps under way ----
export class QuestTracker {
  quests: Quests;
  box: HTMLElement;
  onGuide: ((q: QuestDef) => void) | null = null;

  constructor(quests: Quests, onOpen: () => void) {
    this.quests = quests;
    this.box = el("aside", "qt hidden", document.body);
    this.box.addEventListener("click", onOpen);
    quests.onChange(() => this.render());
    this.render();
  }

  render(): void {
    const quests = this.quests;
    const on = QUESTS.filter((q) => quests.isActive(q.id));
    this.box.classList.toggle("hidden", !on.length);
    this.box.replaceChildren();
    el("b", "qt-title", this.box).textContent = "เควส";
    for (const q of on.slice(0, 4)) {
      const r = el("div", `qt-row${quests.ready(q.id) ? " ready" : ""}`, this.box);
      el("span", "qt-name", r).textContent = q.name;
      el("span", "qt-step", r).textContent = quests.ready(q.id) && quests.step(q.id)?.goal.kind !== "talk" ? `✓ ${handInLine(quests, q)}` : stepLine(quests, q);
      const guide = this.onGuide;
      if (guide && questDest(quests, q)) {
        const g = el("button", "qt-guide", r);
        g.type = "button";
        g.textContent = "นำทาง";
        g.title = "เดินไปยังจุดหมายของเควสนี้";
        g.addEventListener("click", (e) => {
          e.stopPropagation(); // (the box itself opens the log)
          guide(q);
        });
      }
    }
    if (on.length > 4) el("span", "qt-more", this.box).textContent = `และอีก ${on.length - 4} เควส`;
  }
}

export { QUEST_BY_ID };

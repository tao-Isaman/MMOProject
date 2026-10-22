// Bot window (B): start/stop, what the bot is doing, and its settings — skill rules in priority
// order, which slimes to hunt, the hunting area, when to rest. While it runs, the ออโต้ button
// by the skill bar says so.

import { el, makeWindow } from "./ui";
import { icon } from "./icons";
import { ACTIVES } from "./progression";
import { VARIANTS } from "./monsters";
import { STATE_TEXT, defaultSettings, isSupport } from "./bot";
import type { Bot, BotSettings, Cond, SkillRule } from "./bot";
import type { Progress } from "./progression";

const clock = (s: number) => {
  const m = Math.floor(s / 60);
  return `${Math.floor(m / 60) ? `${Math.floor(m / 60)}:` : ""}${String(m % 60).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

// What "ready" means for each kind of skill, in the condition menu.
function readyText(rule: SkillRule): string {
  const t = ACTIVES[rule.id].skill.type;
  if (t === "heal") return "ระหว่างสู้ เมื่อเลือดไม่เต็ม";
  if (t === "shield") return "ระหว่างสู้ เมื่อไม่มีโล่";
  if (t === "buff") return "ระหว่างสู้ เมื่อบัฟหมด";
  return "ทันทีที่เป้าหมายอยู่ในระยะ";
}

export class BotUI {
  bot: Bot;
  progress: Progress;
  win: HTMLElement;
  run: HTMLButtonElement;
  state: HTMLElement;
  numbers: HTMLElement;
  rules: HTMLElement;
  form: HTMLElement;
  menuBtn: HTMLElement | null;

  constructor(bot: Bot, progress: Progress) {
    this.bot = bot;
    this.progress = progress;
    this.win = makeWindow("bot", "บอทล่ามอนสเตอร์", "B");
    const body = el("div", "bt-body", this.win);

    const top = el("div", "bt-top", body);
    this.run = el("button", "bt-run", top);
    this.run.type = "button";
    this.run.addEventListener("click", () => bot.toggle());
    const info = el("div", "bt-info", top);
    this.state = el("div", "bt-state", info);
    this.numbers = el("div", "bt-numbers", info);

    el("h3", "bt-h", body).textContent = "สกิล (บนสุดใช้ก่อน)";
    this.rules = el("div", "bt-rules", body);
    this.form = el("div", "bt-form", body);
    el("p", "wr-note", body).textContent = "กดเดิน คลิก หรือใช้สกิลเองได้ตลอด บอทจะหยุดรอ 2.5 วินาทีแล้วทำต่อ";

    this.menuBtn = document.getElementById("btn-auto");

    bot.onChange(() => this.render());
    this.render();
  }

  toggle(show = this.win.classList.contains("hidden")): void {
    this.win.classList.toggle("hidden", !show);
    if (show) this.render();
  }

  get open(): boolean {
    return !this.win.classList.contains("hidden");
  }

  // ---- whole window, when the settings or the bot's on/off change ----
  render(): void {
    const b = this.bot;
    this.run.textContent = b.on ? "หยุดบอท" : "เริ่มบอท";
    this.run.classList.toggle("on", b.on);
    if (this.menuBtn) {
      this.menuBtn.classList.toggle("on", b.on);
      this.menuBtn.textContent = b.on ? "■ หยุดออโต้" : "▶ ออโต้";
    }
    this.tick();
    if (!this.open) return;
    this.renderRules();
    this.renderForm();
  }

  // ---- live lines, a few times a second ----
  tick(): void {
    const b = this.bot, st = b.stats;
    const what = b.on ? STATE_TEXT[b.state] + (b.target && (b.state === "fight" || b.state === "approach") ? ` · ${b.target.variant.name} Lv ${b.target.level}` : "") : STATE_TEXT.off;
    const perHour = st.time > 30 ? Math.round((st.xp / st.time) * 3600) : 0;
    if (!this.open) return;
    this.state.textContent = what;
    this.numbers.textContent = b.on || st.time
      ? `เวลา ${clock(st.time)} · ล่า ${st.kills} ตัว · EXP +${st.xp}${perHour ? ` (${perHour.toLocaleString()}/ชม.)` : ""} · ทอง +${st.gold.toLocaleString()} · ของ ${st.items} ชิ้น · ดื่มยา ${st.potions}`
      : "ตั้งค่าด้านล่าง แล้วกดเริ่ม บอทจะล่ารอบจุดที่ยืนอยู่ตอนเริ่ม";
  }

  save(): void {
    this.bot.save();
  }

  renderRules(): void {
    const s = this.bot.settings;
    const shown = s.rules.filter((r) => this.progress.skillRank(r.id) > 0);
    if (!shown.length) {
      const p = el("p", "wr-note");
      p.textContent = "ยังไม่มีสกิลที่เรียนแล้ว บอทจะใช้การโจมตีปกติอย่างเดียว";
      this.rules.replaceChildren(p);
      return;
    }
    this.rules.replaceChildren(...shown.map((r, i) => {
      const a = ACTIVES[r.id];
      const row = el("div", `bt-rule${r.on ? "" : " off"}`);
      const on = el("input", "", row);
      on.type = "checkbox";
      on.checked = r.on;
      on.title = "ใช้สกิลนี้";
      on.addEventListener("change", () => {
        r.on = on.checked;
        this.save();
      });
      const ic = el("span", "sk-icon small", row);
      ic.append(icon(a.glyph, a.color));
      const name = el("span", "bt-name", row);
      name.textContent = a.name;
      name.title = isSupport(a.skill) ? "สกิลช่วยเหลือ" : "สกิลโจมตี";

      const cond = el("select", "bt-select", row);
      cond.setAttribute("aria-label", `เงื่อนไขของ${a.name}`);
      const opts: [Cond, string][] = [["ready", readyText(r)], ["hp", "เมื่อ HP ต่ำกว่า (%)"],
        ["mobs", isSupport(a.skill) ? "เมื่อมอนรอบตัวอย่างน้อย (ตัว)" : "เมื่อมอนในวงสกิลอย่างน้อย (ตัว)"]];
      for (const [v, text] of opts) {
        const o = el("option", "", cond);
        o.value = v;
        o.textContent = text;
      }
      cond.value = r.cond;
      const num = el("input", "bt-num", row);
      num.type = "number";
      num.setAttribute("aria-label", "ค่าของเงื่อนไข");
      const limits = () => (r.cond === "hp" ? [5, 95, 5] : [1, 8, 1]);
      const setNum = () => {
        const [lo, hi, step] = limits();
        num.min = String(lo);
        num.max = String(hi);
        num.step = String(step);
        num.value = String(r.value);
        num.hidden = r.cond === "ready";
      };
      cond.addEventListener("change", () => {
        r.cond = cond.value as Cond;
        const [lo, hi] = limits();
        r.value = r.cond === "hp" ? Math.min(hi, Math.max(lo, r.value > 8 ? r.value : 50)) : Math.min(hi, Math.max(lo, r.value <= 8 ? r.value : 2));
        setNum();
        this.save();
      });
      num.addEventListener("change", () => {
        const [lo, hi] = limits();
        r.value = Math.min(hi, Math.max(lo, Number(num.value) || lo));
        num.value = String(r.value);
        this.save();
      });
      setNum();

      const move = (d: number) => {
        const other = shown[i + d];
        if (!other) return;
        const a1 = s.rules.indexOf(r), a2 = s.rules.indexOf(other);
        [s.rules[a1], s.rules[a2]] = [s.rules[a2], s.rules[a1]];
        this.save();
      };
      for (const [d, text, label] of [[-1, "▲", "เลื่อนขึ้น"], [1, "▼", "เลื่อนลง"]] as const) {
        const btn = el("button", "bt-move", row);
        btn.type = "button";
        btn.textContent = text;
        btn.setAttribute("aria-label", label);
        btn.disabled = !shown[i + d];
        btn.addEventListener("click", () => move(d));
      }
      return row;
    }));
  }

  renderForm(): void {
    const s = this.bot.settings;
    const f = this.form;
    f.replaceChildren();
    const check = (parent: HTMLElement, text: string, key: keyof BotSettings) => {
      const lab = el("label", "bt-check", parent);
      const box = el("input", "", lab);
      box.type = "checkbox";
      box.checked = !!s[key];
      box.addEventListener("change", () => {
        (s[key] as boolean) = box.checked;
        this.save();
      });
      lab.append(text);
    };
    const slider = (parent: HTMLElement, label: (v: number) => string, key: keyof BotSettings, min: number, max: number, step: number) => {
      const lab = el("label", "bt-slider", parent);
      const text = el("span", "", lab);
      const range = el("input", "", lab);
      range.type = "range";
      range.min = String(min);
      range.max = String(max);
      range.step = String(step);
      range.value = String(s[key]);
      text.textContent = label(s[key] as number);
      range.addEventListener("input", () => {
        (s[key] as number) = Number(range.value);
        text.textContent = label(s[key] as number);
      });
      range.addEventListener("change", () => this.save());
    };

    check(f, "โจมตีปกติระหว่างรอคูลดาวน์สกิล", "basic");

    el("h3", "bt-h", f).textContent = "เป้าหมาย";
    const kinds = el("div", "bt-kinds", f);
    // the kinds living on this map with their levels (the slimes on a map without monsters)
    const here = new Map<string, { name: string; lo: number; hi: number }>();
    for (const m of this.bot.d.monsters) {
      if (m.temp) continue;
      const k = here.get(m.variant.id);
      if (k) [k.lo, k.hi] = [Math.min(k.lo, m.level), Math.max(k.hi, m.level)];
      else here.set(m.variant.id, { name: m.variant.name, lo: m.level, hi: m.level });
    }
    if (!here.size) for (const v of VARIANTS) here.set(v.id, { name: v.name, lo: v.level, hi: v.level });
    for (const [id, k] of here) {
      const lab = el("label", "bt-check", kinds);
      const box = el("input", "", lab);
      box.type = "checkbox";
      box.checked = s.targets[id] !== false;
      box.addEventListener("change", () => {
        s.targets[id] = box.checked;
        this.save();
      });
      lab.append(`${k.name} Lv ${k.lo === k.hi ? k.lo : `${k.lo}-${k.hi}`}`);
    }
    const pref = el("label", "bt-row", f);
    el("span", "", pref).textContent = "เลือกตัวที่";
    const sel = el("select", "bt-select", pref);
    for (const [v, text] of [["near", "ใกล้ที่สุด"], ["weak", "เลือดน้อยที่สุด"], ["strong", "เลเวลสูงที่สุด"]]) {
      const o = el("option", "", sel);
      o.value = v;
      o.textContent = text;
    }
    sel.value = s.prefer;
    sel.addEventListener("change", () => {
      s.prefer = sel.value as BotSettings["prefer"];
      this.save();
    });
    check(f, "สู้กับตัวที่โจมตีเราก่อนเสมอ (แม้ไม่ได้เลือกไว้)", "defend");

    el("h3", "bt-h", f).textContent = "พื้นที่ล่า";
    check(f, "ล่าทั้งแผนที่ (ไม่จำกัดรัศมี)", "wholeMap");
    if (!s.wholeMap) {
      slider(f, (v) => `รัศมีรอบจุดศูนย์กลาง ${(v / 100).toFixed(0)} ม.`, "radius", 300, 2500, 100);
      const here = el("button", "wr-choice", f);
      here.type = "button";
      here.textContent = "ย้ายจุดศูนย์กลางมาที่ตัวละคร";
      here.addEventListener("click", () => this.bot.setAnchorHere());
    }

    el("h3", "bt-h", f).textContent = "ยา";
    const pots = el("p", "wr-note", f);
    pots.textContent = `ในกระเป๋า: ยาแดง ${this.bot.d.potions?.("hp") ?? 0} ขวด · ยาฟ้า ${this.bot.d.potions?.("mp") ?? 0} ขวด (ซื้อเพิ่มได้ที่ร้านของมิร่าข้างรถเข็น)`;
    slider(f, (v) => (v ? `ดื่มยาแดงเมื่อ HP ต่ำกว่า ${v}%` : "ไม่ดื่มยาแดง"), "potHp", 0, 90, 5);
    slider(f, (v) => (v ? `ดื่มยาฟ้าเมื่อ MP ต่ำกว่า ${v}%` : "ไม่ดื่มยาฟ้า"), "potMp", 0, 90, 5);

    el("h3", "bt-h", f).textContent = "พักฟื้นและ MP";
    slider(f, (v) => (v ? `นั่งพักเมื่อ HP ต่ำกว่า ${v}%` : "ไม่พักเพราะ HP"), "restHp", 0, 90, 5);
    slider(f, (v) => (v ? `นั่งพักเมื่อ MP ต่ำกว่า ${v}%` : "ไม่พักเพราะ MP"), "restMp", 0, 90, 5);
    slider(f, (v) => `พักจน HP และ MP ถึง ${v}%`, "resume", 50, 100, 5);
    slider(f, (v) => (v ? `เก็บ MP ${v}% ไว้ให้สกิลช่วยเหลือ` : "สกิลโจมตีใช้ MP ได้หมด"), "saveMp", 0, 60, 5);

    el("h3", "bt-h", f).textContent = "อื่น ๆ";
    check(f, "หยุดเมื่อกระเป๋าเต็ม", "stopFull");
    check(f, "เดินไปเก็บของที่ดรอป", "loot");
    const reset = el("button", "wr-choice", f);
    reset.type = "button";
    reset.textContent = "คืนค่าเริ่มต้น";
    reset.addEventListener("click", () => {
      const rules = this.bot.settings.rules;
      this.bot.settings = { ...defaultSettings(), rules: [] };
      rules.length = 0;
      this.bot.syncRules();
      this.save();
    });
  }
}

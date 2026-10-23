// Title screen: pick one of your characters (up to MAX_CHARACTERS), delete one, or make a new
// one — name, build, hair and eye colour, then its class, first skill book and first element
// (src/starter.ts; the weapon mastery is its class's), with a turning preview. Everyone starts in the plain
// brown clothes with the plain bob; other hairstyles and clothes are found in the game.
// Resolves with the id of the character to play.

import { el } from "./ui";
import { GENDERS, HAIR_COLORS, EYE_COLORS, swatchColor } from "./ui";
import type { Look, ColorChoice } from "./ui";
import { CLASSES, JOBS, Progress, jobName, jobIcon } from "./progression";
import type { JobId } from "./progression";
import { SHAPES, FALLBACK_SHAPE } from "./items";
import type { Gender } from "./items";
import { starterForm, defaultStart, startGear } from "./starter";
import type { Start } from "./starter";
import { Inventory, NO_GEAR } from "./inventory";
import type { Equipped } from "./inventory";
import {
  loadRoster, saveRoster, newCharacterId, deleteCharacter, useCharacter, saveKey, readJson, MAX_CHARACTERS,
} from "./save";
import type { CharEntry, Roster } from "./save";
import type { Looks } from "./look";
import { isTouch, goLandscape } from "./touch";

const CELL = 96;

export class Title {
  looks: Looks;
  root: HTMLElement;
  box: HTMLElement;
  roster: Roster;
  selected: string | null;
  tapped = 0; // when a character card was last tapped
  done!: (id: string) => void;

  constructor(looks: Looks) {
    this.looks = looks;
    this.roster = loadRoster();
    this.selected = this.roster.last ?? this.roster.chars[0]?.id ?? null;
    this.root = el("div", "title", document.body);
    this.box = el("div", "title-box", this.root);
  }

  // Shows the title screen; resolves with the character to play.
  run(): Promise<string> {
    return new Promise((resolve) => {
      this.done = (id) => {
        this.root.remove();
        resolve(id);
      };
      if (this.roster.chars.length) this.list();
      else this.create();
    });
  }

  heading(text: string, sub: string): void {
    const h = el("header", "title-head", this.box);
    el("h1", "", h).textContent = "Flower Field";
    el("p", "title-sub", h).textContent = sub;
    el("h2", "", h).textContent = text;
  }

  // A standing frame of a look, drawn into a canvas when its sheets have loaded.
  portrait(cv: HTMLCanvasElement, look: Look, equipped: Equipped, dir = 0): void {
    this.looks.build(look, equipped, ["idle"]).then(({ sheets }) => {
      const g = cv.getContext("2d")!;
      g.clearRect(0, 0, cv.width, cv.height);
      g.imageSmoothingEnabled = false;
      g.drawImage(sheets.idle, 0, dir * CELL, CELL, CELL, 0, 0, cv.width, cv.height);
    });
  }

  // ---- your characters ----
  list(): void {
    this.box.replaceChildren();
    this.heading("เลือกตัวละคร", "ลานหมู่บ้านแห่งเวทมนตร์");
    const row = el("div", "title-chars", this.box);
    const byPlayed = [...this.roster.chars].sort((a, b) => b.played - a.played);
    for (const c of byPlayed) {
      const card = el("button", `title-char${c.id === this.selected ? " on" : ""}`, row);
      card.type = "button";
      const cv = el("canvas", "", card);
      cv.width = cv.height = 192;
      const look = readJson<Look>(saveKey("look.v1", c.id)) ?? { gender: "female", hair: "bob", hairColor: "silver", eyes: "teal" };
      const eq = { ...NO_GEAR, ...readJson<{ equipped?: Equipped }>(saveKey("inventory.v3", c.id))?.equipped };
      this.portrait(cv, look, eq);
      el("strong", "", card).textContent = c.name;
      const job = readJson<{ job?: JobId | null }>(saveKey("character.v1", c.id))?.job ?? null;
      const who = { cls: CLASSES[c.cls] ? c.cls : null, job: job && JOBS[job] ? job : null };
      const line = el("span", "", card);
      line.textContent = `${who.cls ? jobName(who) : "-"} · Lv ${c.level}`;
      const pic = jobIcon(who);
      if (pic) line.prepend(Object.assign(el("img", "role-ic"), { src: pic, alt: "" }));
      card.addEventListener("click", () => {
        // a second tap soon after the first starts (phones don't always send dblclick)
        if (this.selected === c.id && performance.now() - this.tapped < 450) return this.start(c.id);
        this.tapped = performance.now();
        this.selected = c.id;
        this.list();
      });
    }
    if (this.roster.chars.length < MAX_CHARACTERS) {
      const add = el("button", "title-char add", row);
      add.type = "button";
      el("span", "title-plus", add).textContent = "+";
      el("strong", "", add).textContent = "สร้างตัวละครใหม่";
      el("span", "", add).textContent = `${this.roster.chars.length} / ${MAX_CHARACTERS}`;
      add.addEventListener("click", () => this.create());
    }
    const actions = el("div", "title-actions", this.box);
    const start = el("button", "title-btn primary", actions);
    start.type = "button";
    start.textContent = "เริ่มเกม";
    start.disabled = !this.selected;
    start.addEventListener("click", () => this.selected && this.start(this.selected));
    const del = el("button", "title-btn", actions);
    del.type = "button";
    del.textContent = "ลบตัวละคร";
    del.disabled = !this.selected;
    del.addEventListener("click", () => {
      const c = this.roster.chars.find((e) => e.id === this.selected);
      if (!c) return;
      actions.replaceChildren();
      el("p", "title-warn", actions).textContent = `ลบ ${c.name} (Lv ${c.level}) ถาวร? เลเวล ของ และทองจะหายทั้งหมด`;
      const yes = el("button", "title-btn danger", actions);
      yes.type = "button";
      yes.textContent = "ลบ";
      yes.addEventListener("click", () => {
        deleteCharacter(this.roster, c.id);
        this.selected = this.roster.chars[0]?.id ?? null;
        if (this.roster.chars.length) this.list();
        else this.create();
      });
      const no = el("button", "title-btn", actions);
      no.type = "button";
      no.textContent = "ยกเลิก";
      no.addEventListener("click", () => this.list());
    });
    el("p", "title-note", this.box).textContent = isTouch()
      ? "แตะตัวละครสองครั้งเพื่อเริ่มเลย · ในเกมกลับมาหน้านี้ได้จากเมนูตั้งค่า"
      : "ดับเบิลคลิกที่ตัวละครเพื่อเริ่มเลย · ในเกมกลับมาหน้านี้ได้จากเมนูตั้งค่า (O)";
  }

  start(id: string): void {
    this.roster.last = id;
    const c = this.roster.chars.find((e) => e.id === id);
    if (c) c.played = Date.now();
    saveRoster(this.roster);
    void goLandscape(); // phones: full screen, turned sideways (still inside the tap)
    this.done(id);
  }

  // ---- a new character ----
  create(): void {
    this.box.replaceChildren();
    this.heading("สร้างตัวละคร", "เลือกอาชีพ ตำราสกิล และธาตุ");
    const look: Look = { gender: "female", hair: "bob", hairColor: "silver", eyes: "teal", styles: ["bob"] };
    const start: Start = defaultStart("mage");
    let name = "";
    let turn = 0;

    const body = el("div", "title-create", this.box);
    const left = el("div", "title-preview", body);
    const cv = el("canvas", "", left);
    cv.width = cv.height = 288;
    const turnRow = el("div", "wr-turn", left);
    el("p", "wr-note", left).textContent = "เริ่มด้วยชุดสีน้ำตาลและผมบ็อบ ทรงผมกับชุดอื่นหาได้ในเกม";
    const right = el("div", "title-form", body);

    // the preview holds the weapon it will start with
    const draw = () => this.portrait(cv, look, { ...NO_GEAR, ...startGear(start) }, turn);
    for (const [d, text] of [[1, "◀"], [-1, "▶"]] as const) {
      const b = el("button", "wr-btn", turnRow);
      b.type = "button";
      b.textContent = text;
      b.addEventListener("click", () => {
        turn = (turn + d + 8) % 8;
        draw();
      });
    }

    // name
    el("h3", "title-h", right).textContent = "ชื่อตัวละคร";
    const input = el("input", "title-name", right);
    input.maxLength = 16;
    input.placeholder = "ตั้งชื่อ 2–16 ตัวอักษร";
    input.addEventListener("input", () => {
      name = input.value.trim();
      make.disabled = name.length < 2;
    });

    el("h3", "title-h", right).textContent = "เพศ";
    const genderRow = el("div", "wr-choices", right);
    el("h3", "title-h", right).textContent = "สีผม";
    const hairColors = el("div", "wr-swatches", right);
    el("h3", "title-h", right).textContent = "สีตา";
    const eyeColors = el("div", "wr-swatches", right);
    starterForm(el("div", "title-start", right), start, draw);

    const swatches = (parent: HTMLElement, list: ColorChoice[], key: "hairColor" | "eyes") => {
      parent.replaceChildren();
      for (const c of list) {
        const b = el("button", `wr-swatch${look[key] === c.id ? " on" : ""}`, parent);
        b.type = "button";
        b.title = c.name;
        b.style.setProperty("--swatch", swatchColor(c, key));
        b.addEventListener("click", () => {
          look[key] = c.id;
          refresh();
        });
      }
    };
    const refresh = () => {
      genderRow.replaceChildren();
      for (const g of GENDERS) {
        if (!this.looks.ready(SHAPES.top[FALLBACK_SHAPE[g.id as Gender]].body)) continue; // a build whose body isn't in yet
        const b = el("button", `wr-choice${look.gender === g.id ? " on" : ""}`, genderRow);
        b.type = "button";
        b.textContent = g.name;
        b.addEventListener("click", () => {
          look.gender = g.id;
          refresh();
        });
      }
      swatches(hairColors, HAIR_COLORS, "hairColor");
      swatches(eyeColors, EYE_COLORS, "eyes");
      draw();
    };

    const actions = el("div", "title-actions", this.box);
    const make = el("button", "title-btn primary", actions);
    make.type = "button";
    make.textContent = "สร้างตัวละคร";
    make.disabled = true;
    make.addEventListener("click", () => {
      if (name.length < 2) return;
      this.start(this.makeCharacter(name, start, look));
    });
    if (this.roster.chars.length) {
      const back = el("button", "title-btn", actions);
      back.type = "button";
      back.textContent = "กลับ";
      back.addEventListener("click", () => this.list());
    }
    refresh();
    if (!isTouch()) input.focus(); // on a phone the keyboard would cover the form
  }

  // Write a new character's saves: its class and what it knows (src/starter.ts), its first
  // weapon and off-hand item (no clothes: the plain brown ones; the bag holds only potions), and
  // the look.
  makeCharacter(name: string, s: Start, look: Look): string {
    const id = newCharacterId(this.roster);
    useCharacter(id);
    const progress = new Progress();
    progress.reset(s.cls);
    progress.start(s.tree, s.element, s.mastery);
    new Inventory().outfit({ ...startGear(s), top: null, bottom: null });
    try {
      localStorage.setItem(saveKey("look.v1"), JSON.stringify(look));
    } catch {
      // not persisted
    }
    const entry: CharEntry = { id, name, cls: s.cls, level: 1, created: Date.now(), played: Date.now() };
    this.roster.chars.push(entry);
    saveRoster(this.roster);
    return id;
  }
}


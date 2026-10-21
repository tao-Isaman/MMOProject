// Title screen: pick one of your characters (up to MAX_CHARACTERS), delete one, or make a new
// one — name, build, class, a top and a bottom from the shapes that are ready, hairstyle, hair
// and eye colour, with a turning preview. Resolves with the id of the character to play.

import { el } from "./ui";
import { GENDERS, HAIRSTYLES, HAIR_COLORS, EYE_COLORS } from "./ui";
import type { Look, ColorChoice } from "./ui";
import { CLASSES, TREES, Progress } from "./progression";
import type { ClassId } from "./progression";
import { SHAPES, ITEMS, FALLBACK_SHAPE } from "./items";
import type { Gender } from "./items";
import { Inventory } from "./inventory";
import type { Equipped } from "./inventory";
import {
  loadRoster, saveRoster, newCharacterId, deleteCharacter, useCharacter, saveKey, readJson, MAX_CHARACTERS,
} from "./save";
import type { CharEntry, Roster } from "./save";
import type { Looks } from "./look";
import { isTouch, goLandscape } from "./touch";

// what each class starts with in the off hand (mages and priests: a tome; archers' bows take
// both hands)
const CLASS_OFFHAND: Partial<Record<ClassId, string>> = { mage: "spell_tome", warrior: "buckler", priest: "spell_tome" };
const CELL = 96;

// The item id of a shape's own-colour piece.
// The undyed item of a shape; null for the bare shape (the brown T-shirt and trousers worn with
// the slot empty).
function plainItem(slot: "top" | "bottom", shape: string): string | null {
  return Object.keys(ITEMS).find((id) => ITEMS[id].kind === slot && ITEMS[id].shape === shape && !ITEMS[id].dye) ?? null;
}

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
      const look = readJson<Look>(saveKey("look.v1", c.id)) ?? { gender: "female", hair: "twintail", hairColor: "silver", eyes: "teal" };
      const eq = readJson<{ equipped?: Equipped }>(saveKey("inventory.v3", c.id))?.equipped ?? { weapon: null, offhand: null, top: null, bottom: null };
      this.portrait(cv, look, eq);
      el("strong", "", card).textContent = c.name;
      el("span", "", card).textContent = `${CLASSES[c.cls]?.name ?? "-"} · Lv ${c.level}`;
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
      ? "แตะตัวละครสองครั้งเพื่อเริ่มเลย · ในเกมกลับมาหน้านี้ได้จากหน้าต่างสถานะ"
      : "ดับเบิลคลิกที่ตัวละครเพื่อเริ่มเลย · ในเกมกลับมาหน้านี้ได้จากหน้าต่างสถานะ (P)";
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
    this.heading("สร้างตัวละคร", "เลือกอาชีพ ชุด และทรงผม");
    const look: Look = { gender: "female", hair: "twintail", hairColor: "silver", eyes: "teal" };
    let cls: ClassId = "mage";
    let top = "mage", bottom = "mage";
    let name = "";
    let turn = 0;

    const body = el("div", "title-create", this.box);
    const left = el("div", "title-preview", body);
    const cv = el("canvas", "", left);
    cv.width = cv.height = 288;
    const turnRow = el("div", "wr-turn", left);
    const note = el("p", "wr-note", left);
    const right = el("div", "title-form", body);

    const equipped = (): Equipped => ({ weapon: null, offhand: null, top: plainItem("top", top), bottom: plainItem("bottom", bottom) });
    const draw = () => {
      this.portrait(cv, look, equipped(), turn);
      note.textContent = this.looks.note(look, equipped());
    };
    for (const [d, text] of [[1, "◀"], [-1, "▶"]] as const) {
      const b = el("button", "wr-btn", turnRow);
      b.type = "button";
      b.textContent = text;
      b.addEventListener("click", () => {
        turn = (turn + d + 8) % 8;
        draw();
      });
    }

    const section = (title: string) => {
      el("h3", "title-h", right).textContent = title;
      return el("div", "wr-choices", right);
    };
    // name
    el("h3", "title-h", right).textContent = "ชื่อตัวละคร";
    const input = el("input", "title-name", right);
    input.maxLength = 16;
    input.placeholder = "ตั้งชื่อ 2–16 ตัวอักษร";
    input.addEventListener("input", () => {
      name = input.value.trim();
      make.disabled = name.length < 2;
    });

    // choices redraw themselves when the build changes
    const genderRow = section("เพศ");
    const clsRow = section("อาชีพ");
    clsRow.classList.add("title-classes");
    const topRow = section("เสื้อ");
    const bottomRow = section("กางเกง / กระโปรง");
    const hairRow = section("ทรงผม");
    el("h3", "title-h", right).textContent = "สีผม";
    const hairColors = el("div", "wr-swatches", right);
    el("h3", "title-h", right).textContent = "สีตา";
    const eyeColors = el("div", "wr-swatches", right);

    const choice = (parent: HTMLElement, text: string, on: boolean, ok: boolean, pick: () => void, sub = "") => {
      const b = el("button", `wr-choice${on ? " on" : ""}`, parent);
      b.type = "button";
      b.disabled = !ok;
      b.textContent = text;
      if (sub) el("small", "", b).textContent = sub;
      b.addEventListener("click", () => {
        pick();
        refresh();
      });
    };
    const swatches = (parent: HTMLElement, list: ColorChoice[], key: "hairColor" | "eyes") => {
      parent.replaceChildren();
      for (const c of list) {
        const b = el("button", `wr-swatch${look[key] === c.id ? " on" : ""}`, parent);
        b.type = "button";
        b.title = c.name;
        b.style.setProperty("--swatch", c.hue === null || c.hue === undefined ? (key === "eyes" ? "#3fb7a6" : "#d9d6e8") : `hsl(${c.hue} ${Math.round(c.sat * 100)}% ${key === "eyes" ? 50 : 62 + (c.light ?? 0) * 40}%)`);
        b.addEventListener("click", () => {
          look[key] = c.id;
          refresh();
        });
      }
    };
    const refresh = () => {
      genderRow.replaceChildren();
      for (const g of GENDERS) {
        const ready = this.looks.ready(SHAPES.top[FALLBACK_SHAPE[g.id as Gender]].body);
        choice(genderRow, g.name, look.gender === g.id, ready, () => {
          look.gender = g.id;
          top = bottom = FALLBACK_SHAPE[g.id as Gender];
        }, ready ? "" : "รอสร้างตัวละคร");
      }
      clsRow.replaceChildren();
      for (const [id, c] of Object.entries(CLASSES) as [ClassId, (typeof CLASSES)[ClassId]][]) {
        choice(clsRow, c.name, cls === id, true, () => (cls = id), `${c.note} · ${c.trees.map((t) => TREES[t].name).join(" · ")}`);
      }
      for (const [row, slot] of [[topRow, "top"], [bottomRow, "bottom"]] as const) {
        row.replaceChildren();
        for (const [id, sh] of Object.entries(SHAPES[slot])) {
          if (sh.gender !== look.gender) continue;
          const ready = this.looks.ready(sh.body);
          if (sh.bare && !ready) continue; // the plain clothes show up once their body is in
          const on = (slot === "top" ? top : bottom) === id;
          choice(row, sh.name, on, ready, () => (slot === "top" ? (top = id) : (bottom = id)), ready ? "" : "รอท่าทางจาก Oriverse");
        }
      }
      hairRow.replaceChildren();
      const own = !this.looks.bodies[SHAPES.top[top].body]?.hairless;
      for (const h of HAIRSTYLES) {
        const ready = this.looks.hairstyles.has(h.id) || (h.id === "twintail" && own);
        choice(hairRow, h.name, look.hair === h.id, ready && !own, () => (look.hair = h.id), ready ? "" : "กำลังสร้าง");
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
      this.start(this.makeCharacter(name, cls, look, plainItem("top", top), plainItem("bottom", bottom)));
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

  // Write a new character's saves: class progress, the class weapon and off-hand item and the
  // chosen clothes worn (the bag holds only potions), and the look.
  makeCharacter(name: string, cls: ClassId, look: Look, top: string | null, bottom: string | null): string {
    const id = newCharacterId(this.roster);
    useCharacter(id);
    const progress = new Progress();
    progress.reset(cls);
    new Inventory().outfit({ weapon: CLASSES[cls].weapon, offhand: CLASS_OFFHAND[cls] ?? null, top, bottom });
    try {
      localStorage.setItem(saveKey("look.v1"), JSON.stringify(look));
    } catch {
      // not persisted
    }
    const entry: CharEntry = { id, name, cls, level: 1, created: Date.now(), played: Date.now() };
    this.roster.chars.push(entry);
    saveRoster(this.roster);
    return id;
  }
}

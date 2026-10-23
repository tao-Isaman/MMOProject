// The codex (C, "สารบัญ"): everything about the game in one book, read from the game's own tables:
// the monsters (numbers, where they live, what they leave), the items (where each comes from), the
// job changes (who, where, what it takes, the branches), the lore (to be told later) and how the
// towns came to be.

import { ITEMS, GEAR_TIERS, TIER_SLOTS, tierId, sellPrice } from "./items";
import type { ItemKind } from "./items";
import { MONSTERS, statsFor } from "./bestiary";
import type { MonsterDef, MonsterKind } from "./bestiary";
import { VARIANTS } from "./monsters";
import { fieldDrops, gearTierAt, TIER_DROP } from "./drops";
import { FIELDS, MAP_NAMES, TOWNS } from "./maps";
import type { MapId, TownId } from "./maps";
import { BOOKS, BOOK_CHANCE, TIER2_DROP_LEVEL, CLASSES, JOBS, TREES, ELEMENTS, RACE_NAMES, RACE_ICONS } from "./progression";
import type { ElementId, JobId } from "./progression";
import { QUESTS } from "./quests";
import { STOCK } from "./shop";
import { el, makeWindow, itemTip } from "./ui";
import { icon } from "./icons";
import type { Img } from "./types";

type Tab = "monsters" | "items" | "jobs" | "lore" | "towns";
const TABS: [Tab, string][] = [["monsters", "มอนสเตอร์"], ["items", "ไอเทม"], ["jobs", "เปลี่ยนอาชีพ"], ["lore", "ตำนาน"], ["towns", "ที่มาของเมือง"]];

const KIND_NAMES: Record<MonsterKind, string> = { normal: "ธรรมดา", tank: "ถึก", fast: "ว่องไว", caster: "ร่ายเวท", rare: "หายาก", boss: "บอส" };
const BEHAVE_NAMES: Record<string, string> = {
  charge: "พุ่งชนจากระยะไกล", pack: "พวกเดียวกันรุมช่วย", ranged: "โจมตีจากระยะไกล", fly: "ลอยตัว", heal: "ฟื้นตัวเองตอนบาดเจ็บ",
  flee: "หนีเมื่อใกล้ตาย", reflect: "สะท้อนดาเมจ", slow: "กัดให้ช้าลง", burn: "กัดติดไฟ", petrify: "กัดให้กลายเป็นหิน",
  slam: "ทุบพื้นรอบตัว", explode: "ระเบิดตอนตาย", steal: "ขโมยทอง", dodge: "หลบเก่ง", slowwalk: "เดินช้า", summon: "เรียกลูกน้อง",
  human: "มนุษย์", boss: "บอส: ทีละตัว เกิดใหม่ทุก 1 ชั่วโมง",
};
// A chance as the codex prints it: 40%, 1.2%, 0.04%.
const pct = (c: number) => `${c >= 0.1 ? Math.round(c * 100) : c >= 0.01 ? +(c * 100).toFixed(1) : +(c * 100).toFixed(2)}%`;
const itemName = (id: string) => ITEMS[id]?.name ?? id;

// How each town came to be.
export const TOWN_LORE: Record<TownId, string> = {
  eden: "อีเดนเริ่มจากหมู่บ้านชาวประมงริมอ่าวที่อุดมสมบูรณ์ที่สุดของแผ่นดิน เมื่อราชวงศ์แรกรวมเผ่าทั้งหลายเข้าด้วยกัน ก็สร้างมหาวิหารและพระราชวังขึ้นที่นี่ "
    + "ถนนสี่สายจากสี่แยกกลางเมืองมุ่งไปยังทุกทิศของอาณาจักร ทุกวันนี้อีเดนเป็นเมืองหลวง เป็นที่ที่นักผจญภัยหน้าใหม่ทุกคนเริ่มต้น และท่าเรือของมันส่งเรือไปถึงโยเดียและโอซากิ",
  iceberg: "ไอซ์เบิร์กสร้างโดยนักล่าวาฬจากทางเหนือที่หลบพายุหิมะเข้ามาในอ่าวน้ำแข็ง พวกเขาสร้างโถงใหญ่ไม้สนไว้รวมคนในฤดูหนาวที่ยาวนาน "
    + "เหล็กที่ตีท่ามกลางความหนาวของที่นี่แกร่งเลื่องชื่อ ช่างตีเหล็กและนักประดิษฐ์จึงมารวมกันที่เมืองนี้ ขุนศึกเหนือยังเฝ้าช่องเขาน้ำแข็งไว้จากอสูรที่ลงมากับหิมะ",
  trunrada: "ทรุนราดาเป็นค่ายของชนเผ่าเร่ร่อนแห่งทุ่งหญ้าที่ไม่เคยอยู่ที่ใดนาน จนวันหนึ่งหัวหน้าเผ่ารุ่นแรกปักโอโบหินไว้ที่ทางแยกริมแม่น้ำ "
    + "แล้วสาบานว่าเผ่าจะกลับมาพบกันที่นี่ทุกฤดูใบไม้ผลิ กระโจมจึงกลายเป็นบ้าน กังหันลมบดแป้งให้ทั้งเมือง และนักธนูบนหลังม้ายังคงคุ้มกันฝูงสัตว์ในสเตปป์",
  kradia: "คราเดียเกิดจากป้อมปราการที่อาณาจักรสร้างไว้ยันแนวชายแดนตะวันตก เมื่อพบสายแร่ใต้ภูเขา คนงานเหมืองก็ตามมาตั้งรกรากรอบกำแพง "
    + "อัศวินของป้อมฝึกดาบกันทุกเช้าในลาน ดาบที่ชุบน้ำผลึกจากเหมืองที่นี่ฟันอสูรเข้า คราเดียจึงเป็นด่านหน้าของอาณาจักรมาตลอดหลายร้อยปี",
  bahamas: "บาฮามัสคือโอเอซิสกลางทะเลทรายใหญ่ ตำนานเล่าว่าผู้นำกองคาราวานคนหนึ่งเดินตามดาวเหนือมาเจอบ่อน้ำใต้ต้นอินทผลัม "
    + "เขาสร้างวังโดมฟ้าครอบบ่อนั้น และกองคาราวานจากอีเดนถึงโยเดียก็มาพักที่นี่ไม่ขาด จอมเวทแห่งทะเลทรายยังเฝ้าตำราเวทโบราณที่ขุดได้จากสุสานฟาโรห์",
  yodia: "โยเดียเริ่มจากตลาดน้ำของชาวบ้านริมแม่น้ำที่ไหลลงทะเลใต้ เรือสินค้าจากต่างแดนแวะซื้อปลาและผลไม้จนท่าเรือเล็กๆ กลายเป็นเมืองท่า "
    + "วัดริมน้ำเป็นที่พึ่งของชาวเมือง ผู้เฒ่าที่ชายป่ายังเล่าเรื่องป่าดิบแดนใต้ และในซอกซอยของตลาดปลาก็มีกลุ่มเงาที่ไม่มีใครรู้ว่าเริ่มเมื่อไร",
  osaki: "โอซากิเป็นเกาะที่พระธุดงค์รูปแรกพายเรือข้ามทะเลมาเพื่อหาที่สงบนั่งสมาธิ เขาปลูกซากุระต้นแรกไว้หน้าวัดบนเนิน "
    + "ผู้คนที่หนีสงครามบนแผ่นดินใหญ่ตามมาสร้างบ้าน โรงเหล้าสาเก และโรงฝึกดาบ อาจารย์ดาบเวทของเกาะสอนว่าใจต้องนิ่งก่อน ดาบและเวทจึงจะคม",
  noa: "โนอาคือเมืองหลวงแรกของอาณาจักร ราชวงศ์แรกสร้างวังและท่อส่งน้ำหินยาวหลายลี้ไว้กลางที่ราบ เมื่อผู้คนมากขึ้นจนแผ่นดินไม่พอ ราชสำนักจึงย้ายไปอีเดนที่ติดทะเล "
    + "วังเก่าเหลือเพียงซุ้มโค้งกับเสา แต่ถนนทุกสายของทวีปตะวันตกยังมาบรรจบกันที่นี่ โนอาจึงยังเป็นชุมทางของพ่อค้าและนักผจญภัยไม่เคยเงียบเหงา",
  suzhou: "ซูโจวคือเมืองท่าที่อยู่ปลายสุดของทวีปทางตะวันตก พ่อค้าจากทะเลตะวันตกนำใบชา ผ้าไหม และเครื่องเคลือบมาแลกกับเหล็กและธัญพืชของแผ่นดินใหญ่ "
    + "คลองเล็กๆ ไหลผ่านทุกตรอก เจดีย์หลายชั้นริมท่าเป็นประภาคารให้เรือสำเภาที่กลับจากพายุ ชาวเมืองเชื่อว่ามังกรทะเลที่แหลมตะวันตกคุ้มครองพวกเขาอยู่",
  highland: "ไฮแลนด์ ฮิลตั้งอยู่เชิงเขาหิมะ ตำนานเล่าว่าบรรพบุรุษของคนทั้งแผ่นดินลงมาจากภูเขาและตั้งรกรากครั้งแรกที่นี่ หินบรรพบุรุษกลางเมืองยังจารึกชื่อของพวกเขาไว้ "
    + "ถึงหิมะจะคลุมเกือบทั้งปี ชาวไร่ก็ยังปลูกมันฝรั่ง กะหล่ำ และข้าวบาร์เลย์ในเรือนกระจกได้ ผู้เฒ่าของเมืองยังเฝ้ารักษาเรื่องเล่าก่อนจะมีอาณาจักร",
  venezia: "เวนิชเซียสร้างบนเกาะเล็กเกาะน้อยกลางลากูน ชาวประมงตอกเสาไม้ลงโคลนทีละต้นจนกลายเป็นเมืองที่มีคลองแทนถนน และกอนโดลาแทนเกวียน "
    + "ท่าเรือใหญ่ของเมืองส่งเรือไปทุกเมืองท่า ทุกปีชาวเมืองสวมหน้ากากออกงานรื่นเริงริมจัตุรัสมหาวิหาร และกองคาราวานก็ขึ้นเหนือผ่านที่ราบแห้งแล้งไปถึงบาฮามัส",
};

export class CodexUI {
  win: HTMLElement;
  tabs: HTMLElement;
  bar: HTMLElement;
  search: HTMLInputElement;
  list: HTMLElement;
  tab: Tab = "monsters";
  kind: string = "all"; // the item list's filter
  shown = new Set<string>();
  icons: (id: string) => Img | null;
  sheets: Promise<Record<string, { cell: number }>> | null = null;
  sources: Map<string, string[]> | null = null;

  constructor(icons: (id: string) => Img | null) {
    this.icons = icons;
    this.win = makeWindow("codex", "สารบัญ", "C");
    const top = el("div", "shop-top", this.win);
    this.tabs = el("div", "sk-tabs", top);
    for (const [id, name] of TABS) {
      const b = el("button", "sk-tab", this.tabs);
      b.type = "button";
      b.dataset.tab = id;
      b.textContent = name;
      b.addEventListener("click", () => {
        this.tab = id;
        this.render();
      });
    }
    this.bar = el("div", "cx-bar", this.win);
    this.search = el("input", "cx-search", this.bar);
    this.search.type = "search";
    this.search.placeholder = "ค้นหาชื่อ…";
    this.search.addEventListener("input", () => this.render());
    // keys typed here are for the box, not the game
    this.search.addEventListener("keydown", (e) => e.stopPropagation());
    this.list = el("div", "shop-list cx-list", this.win);
    this.list.addEventListener("click", (e) => {
      const row = e.target instanceof Element ? e.target.closest<HTMLElement>(".cx-head")?.closest<HTMLElement>(".shop-row") : null;
      if (!row) return;
      if (!this.shown.delete(row.dataset.key!)) this.shown.add(row.dataset.key!);
      this.render();
    });
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
    for (const b of this.tabs.children) b.classList.toggle("on", (b as HTMLElement).dataset.tab === this.tab);
    this.bar.style.display = this.tab === "monsters" || this.tab === "items" ? "" : "none";
    this.list.replaceChildren();
    const find = this.search.value.trim();
    if (this.tab === "monsters") this.renderMonsters(find);
    else if (this.tab === "items") this.renderItems(find);
    else if (this.tab === "jobs") this.renderJobs();
    else if (this.tab === "lore") this.renderLore();
    else this.renderTowns();
  }

  // A row: its head (picture, name, a line under it) opens its body.
  row(key: string, pic: HTMLElement | null, name: string, sub: string): HTMLElement | null {
    const row = el("div", "shop-row cx-row", this.list);
    row.dataset.key = key;
    const head = el("div", "cx-head", row);
    if (pic) head.append(pic);
    const info = el("div", "shop-info", head);
    el("strong", "", info).textContent = name;
    el("span", "sk-sub", info).textContent = sub;
    const open = this.shown.has(key);
    row.classList.toggle("open", open);
    return open ? el("div", "shop-detail cx-body", row) : null;
  }

  // ---- monsters ----
  // A monster's picture: the first frame of its sheet, else the badge of what it is.
  portrait(id: string, race: keyof typeof RACE_ICONS): HTMLElement {
    const cell = el("span", "inv-cell shop-icon cx-pic");
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    c.className = "inv-icon";
    cell.append(c);
    const [glyph, color] = RACE_ICONS[race];
    const g = c.getContext("2d")!;
    g.drawImage(icon(glyph, color), 8, 8, 48, 48);
    this.sheets ??= fetch("assets/monsters/index.json").then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    void this.sheets.then((meta) => {
      const m = meta[id];
      if (!m) return;
      const img = new Image();
      img.onload = () => {
        g.clearRect(0, 0, 64, 64);
        g.imageSmoothingEnabled = false;
        g.drawImage(img, 0, 0, m.cell, m.cell, 0, 0, 64, 64);
      };
      img.src = `assets/monsters/${id}.png`;
    });
    return cell;
  }

  renderMonsters(find: string): void {
    const match = (name: string) => !find || name.includes(find);
    // the slimes round Eden first, then the fields by their levels
    const slimes = VARIANTS.filter((v) => match(v.name));
    if (slimes.length) {
      el("h4", "ws-craft", this.list).textContent = `${MAP_NAMES.field} (เลเวล 1–9)`;
      for (const v of slimes) {
        const body = this.row(`slime:${v.id}`, this.portrait("", "formless"), `Lv ${v.level} ${v.name}`, `สไลม์ · ไร้รูป${v.element ? ` · ธาตุ${ELEMENTS[v.element].name}` : ""}`);
        if (!body) continue;
        body.innerHTML = `HP ${v.hp} · พลังโจมตี ${v.atk} · ป้องกัน ${v.def} · ต้านเวท ${v.mdef} · EXP ${v.xp}<br>${v.aggro ? "โจมตีก่อน" : "ไม่โจมตีก่อน"}`
          + `<br>${eleDefText(v.eleDef ?? {})}<br><b>ของดรอป:</b> ${v.drops.map(([id, c]) => `${itemName(id)} ${pct(c)}`).join(" · ")}`;
      }
    }
    const fields = (Object.keys(FIELDS) as (keyof typeof FIELDS)[]).sort((a, b) => FIELDS[a].levels[0] - FIELDS[b].levels[0]);
    for (const f of fields) {
      const here = MONSTERS.filter((m) => m.field === f && match(m.name)).sort((a, b) => a.levels[0] - b.levels[0]);
      if (!here.length) continue;
      el("h4", "ws-craft", this.list).textContent = `${FIELDS[f].name} (เลเวล ${FIELDS[f].levels.join("–")})`;
      for (const m of here) {
        const lv = m.levels[0] === m.levels[1] ? `${m.levels[0]}` : m.levels.join("–");
        const body = this.row(`m:${m.id}`, this.portrait(m.id, m.race ?? "brute"), `Lv ${lv} ${m.name}`,
          `${KIND_NAMES[m.kind]} · ${RACE_NAMES[m.race ?? "brute"]}${m.element ? ` · ธาตุ${ELEMENTS[m.element].name}` : " · ไร้ธาตุ"}`);
        if (body) body.innerHTML = monsterText(m);
      }
    }
    if (!this.list.childElementCount) el("p", "wr-note", this.list).textContent = "ไม่พบมอนสเตอร์ชื่อนี้";
  }

  // ---- items ----
  renderItems(find: string): void {
    this.sources ??= itemSources();
    const kinds: [string, string, (k: ItemKind) => boolean][] = [
      ["all", "ทั้งหมด", () => true], ["weapon", "อาวุธ", (k) => k === "weapon"], ["offhand", "มือรอง", (k) => k === "offhand"],
      ["wear", "ชุด", (k) => k === "top" || k === "bottom"], ["gear", "หมวก รองเท้า แหวน จี้", (k) => k === "hat" || k === "shoes" || k === "ring" || k === "trinket"],
      ["potion", "ยา", (k) => k === "potion"], ["book", "ตำรา", (k) => k === "book" || k === "style"], ["material", "วัตถุดิบ", (k) => k === "material"],
    ];
    const chips = el("div", "ws-tiers", this.list);
    for (const [id, name] of kinds) {
      const b = el("button", `wr-choice${this.kind === id ? " on" : ""}`, chips);
      b.type = "button";
      b.textContent = name;
      b.addEventListener("click", () => {
        this.kind = id;
        this.render();
      });
    }
    const test = kinds.find(([id]) => id === this.kind)![2];
    const ids = Object.keys(ITEMS).filter((id) => test(ITEMS[id].kind) && (!find || ITEMS[id].name.includes(find)));
    for (const id of ids.slice(0, 400)) {
      const from = this.sources.get(id) ?? [];
      const pic = el("span", "inv-cell shop-icon");
      const img = this.icons(id);
      if (img) {
        const c = img.cloneNode(true) as Img;
        if (c instanceof HTMLCanvasElement) c.getContext("2d")!.drawImage(img, 0, 0);
        c.classList.add("inv-icon");
        pic.append(c);
      }
      const body = this.row(`i:${id}`, pic, ITEMS[id].name, from.length ? from[0] + (from.length > 1 ? ` และอีก ${from.length - 1} ที่` : "") : "ยังไม่มีที่ให้หา");
      if (body) body.innerHTML = `${itemTip(id)}<br><b>ที่มา:</b><br>${from.length ? from.map((t) => `· ${t}`).join("<br>") : "ยังไม่มีที่ให้หา"}${sellPrice(id) ? `<br>ขายให้ร้าน ${sellPrice(id).toLocaleString()} ทอง` : ""}`;
    }
    if (ids.length > 400) el("p", "wr-note", this.list).textContent = `แสดง 400 จาก ${ids.length} ชิ้น พิมพ์ค้นหาเพื่อแคบลง`;
    if (!ids.length) el("p", "wr-note", this.list).textContent = "ไม่พบไอเทมชื่อนี้";
  }

  // ---- job changes ----
  renderJobs(): void {
    el("h4", "ws-craft", this.list).textContent = "อาชีพแรก (เลือกตอนสร้างตัวละคร)";
    for (const [id, c] of Object.entries(CLASSES)) {
      const body = this.row(`c:${id}`, null, c.name, c.note);
      if (body) body.innerHTML = `ตำราสกิลของอาชีพ: ${c.trees.map((t) => TREES[t].name).join(" · ")}`;
    }
    el("h4", "ws-craft", this.list).textContent = `อาชีพที่ 2 (เลเวล 30 ขึ้นไป เปลี่ยนได้ครั้งเดียว)`;
    for (const [id, j] of Object.entries(JOBS) as [JobId, (typeof JOBS)[JobId]][]) {
      const q = QUESTS.find((x) => x.job === id);
      const where = q ? `${q.giver.name} · ${MAP_NAMES[q.giver.map as MapId]}` : "-";
      const body = this.row(`j:${id}`, null, j.name, `${where} · ${j.from ? `ต้องเป็น${j.from.map((c) => CLASSES[c].name).join(" หรือ ")}` : "อาชีพไหนก็ได้"}`);
      if (!body) continue;
      body.innerHTML = `${j.note}<br><b>เจ้าอาชีพ:</b> ${where}`
        + (q ? `<br><b>เควส ${q.name}:</b><br>${q.steps.map((s, i) => `${i + 1}. ${s.task}`).join("<br>")}` : "")
        + `<br><b>สาย:</b><br>${j.branches.map((b) => `· ${TREES[b].name}: ${TREES[b].note}`).join("<br>")}`;
    }
  }

  // ---- lore, towns ----
  renderLore(): void {
    const p = el("p", "cx-page", this.list);
    p.textContent = "ตำนานของโลกนี้ยังไม่ถูกบันทึก… เรื่องราวจะถูกเล่าในภายหลัง";
  }

  renderTowns(): void {
    for (const t of TOWNS) {
      const body = this.row(`t:${t}`, null, MAP_NAMES[t], TOWN_LORE[t].slice(0, 60) + "…");
      if (body) body.textContent = TOWN_LORE[t];
    }
  }
}

// A monster's page: its numbers at both ends of its levels, its ways, its defences and its drops.
function monsterText(m: MonsterDef): string {
  const lo = statsFor(m.levels[0], m.kind), hi = statsFor(m.levels[1], m.kind);
  const range = (a: number, b: number) => (a === b ? `${a.toLocaleString()}` : `${a.toLocaleString()}–${b.toLocaleString()}`);
  const ways = m.behave.map((b) => {
    const [name, arg] = b.split(":");
    if (name === "summon") return `${BEHAVE_NAMES.summon} (${MONSTERS.find((x) => x.id === arg)?.name ?? arg})`;
    return BEHAVE_NAMES[name] ?? b;
  });
  const drops = fieldDrops(m).map(([id, c]) => `${itemName(id)} ${pct(c)}`);
  const tier = gearTierAt(m.levels[0]);
  if (tier) drops.push(`อุปกรณ์เลเวล ${tier} (สุ่ม 1 ชิ้น) ${pct(TIER_DROP[m.kind])}`);
  drops.push(`หมวก รองเท้า แหวน จี้ของร้าน (สุ่ม) ${pct(m.kind === "boss" ? 0.6 : m.kind === "rare" ? 0.25 : 0.012)}`);
  drops.push(`ตำราที่ยังเรียนได้ (สุ่ม) ${pct(m.kind === "boss" ? BOOK_CHANCE.boss : m.kind === "rare" ? BOOK_CHANCE.rare : BOOK_CHANCE.normal)}${m.levels[1] >= TIER2_DROP_LEVEL ? " รวมตำราขั้นสอง" : ""}`);
  return `<b>ที่อยู่:</b> ${MAP_NAMES[m.field]}<br>`
    + `HP ${range(lo.hp, hi.hp)} · พลังโจมตี ${range(lo.atk, hi.atk)} · ป้องกัน ${range(lo.def, hi.def)} · ต้านเวท ${range(lo.mdef, hi.mdef)} · EXP ${range(lo.xp, hi.xp)}<br>`
    + `${m.aggro ? "โจมตีก่อน" : "ไม่โจมตีก่อน"}${ways.length ? ` · ${ways.join(" · ")}` : ""}<br>`
    + `${eleDefText(m.eleDef)}<br><i>${m.look}</i><br><b>ของดรอป:</b> ${drops.join(" · ")}`;
}

function eleDefText(d: Partial<Record<ElementId, number>>): string {
  const parts = Object.entries(d).map(([e, v]) => `${ELEMENTS[e].name} ${v! > 0 ? "+" : ""}${v}`);
  return parts.length ? `ป้องกันธาตุ: ${parts.join(" · ")}` : "ไม่มีป้องกันธาตุ";
}

// Where every item comes from: the shop, the monsters that leave it, the tiers' bands, the
// workshop, the quests that give or ask for it.
function itemSources(): Map<string, string[]> {
  const src = new Map<string, string[]>();
  const add = (id: string, text: string) => {
    let list = src.get(id);
    if (!list) src.set(id, (list = []));
    list.push(text);
  };
  for (const id of STOCK) add(id, `ร้านค้า ${(ITEMS[id].price ?? 0).toLocaleString()} ทอง`);
  for (const v of VARIANTS) for (const [id, c] of v.drops) add(id, `${v.name} (${MAP_NAMES.field}) ${pct(c)}`);
  for (const m of MONSTERS) for (const [id, c] of fieldDrops(m)) add(id, `${m.name} (${MAP_NAMES[m.field]}) ${pct(c)}`);
  const top = Math.max(...MONSTERS.map((m) => m.levels[1]));
  for (const t of GEAR_TIERS) for (const slot of TIER_SLOTS) {
    const id = tierId(t, slot);
    if (t <= top) add(id, `มอนสเตอร์เลเวล ${t}–${t + 29} (ตัวธรรมดา ${pct(TIER_DROP.normal)} ตัวหายาก ${pct(TIER_DROP.rare)} บอส ${pct(TIER_DROP.boss)})`);
    add(id, "สร้างที่ช่างตีเหล็ก (เสียค่าจ้าง) หรือด้วยสกิลความเชี่ยวชาญการสร้าง");
  }
  for (const [id, item] of Object.entries(ITEMS)) {
    if ((item.kind === "hat" || item.kind === "shoes" || item.kind === "ring" || item.kind === "trinket") && !item.tier) add(id, "มอนสเตอร์ในฟิลด์ทุกตัว สุ่มชิ้นใดก็ได้ (1.2% · ตัวหายาก 25% · บอส 60%)");
  }
  for (const [id, b] of Object.entries(BOOKS)) {
    const second = b.kind === "mastery2" || b.kind === "element2";
    add(id, `มอนสเตอร์ในฟิลด์${second ? `เลเวล ${TIER2_DROP_LEVEL} ขึ้นไป` : ""} สุ่มตำราที่ยังเรียนได้ (${pct(BOOK_CHANCE.normal)} · ตัวหายาก ${pct(BOOK_CHANCE.rare)} · บอส ${pct(BOOK_CHANCE.boss)})`);
  }
  for (const q of QUESTS) {
    for (const [id] of q.reward.items ?? []) add(id, `รางวัลเควส "${q.name}"`);
    for (const s of q.steps) {
      const g = s.goal;
      if (g.kind === "collect" && g.from) add(g.item, `ระหว่างเควส "${q.name}" จาก${g.from.map((f) => MONSTERS.find((m) => m.id === f)?.name ?? f).join(" ")}`);
    }
  }
  return src;
}

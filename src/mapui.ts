// Maps: the minimap in the top right corner, and the map window (M): first the map you are on,
// then the world. The picture of a game map is the 3D scenery seen from straight above
// (World3D.snapshot), north up; the townsfolk, warps, monsters and the player are drawn over
// it. Tapping the minimap opens the window too (phones have no M key). A click on the map walks
// there (on someone: up to them, to talk); on the world map, to the way out to a place.
//
// The world map is the grid of src/worldmap.ts, every map's square its picture from above; it
// zooms (the wheel, the + and - buttons) and drags, and shows where the player stands in her
// map's square.

import { el, makeWindow } from "./ui";
import { isTouch } from "./touch";
import { PLACES, GRID, SEAS, groundAt, tileArea } from "./worldmap";
import type { Place, Ground } from "./worldmap";
import { FIELDS } from "./maps";
import { fieldLevels, levelText } from "./bestiary";
import type { GameMap } from "./maps";
import type { Npc, NpcRole } from "./npcs";
import type { Monster } from "./monsters";
import type { Vec2 } from "./types";

// What a travel guide charges to take you to a town: 1,000 gold at least, 600 a square of the
// world map as the crow flies.
export const TRAVEL_FEE_MIN = 1000;
// cut: the share off (the wandering merchant's book, at most half)
export function travelFee(from: string, to: string, cut = 0): number {
  const a = PLACES.find((p) => p.id === from), b = PLACES.find((p) => p.id === to);
  const fee = !a || !b ? TRAVEL_FEE_MIN : Math.max(TRAVEL_FEE_MIN, Math.round((Math.hypot(a.col - b.col, a.row - b.row) * 600) / 100) * 100);
  return Math.round((fee * (1 - Math.min(0.5, cut))) / 10) * 10;
}

export interface MapState {
  player: Vec2;
  facing: Vec2;    // the way she faces, a unit world vector
  yaw: number;     // the camera's heading (0 = looking north)
  npcs: Npc[];
  monsters: Monster[];
  route: Vec2[] | null; // a walk under way: from the player through the waypoints left
}

type View = "local" | "world";
type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

// What a map's picture shows: its walkable bounds and 10 m round them (the warps stand near
// the edge).
export function mapArea(map: GameMap): Bounds {
  const b = map.bounds;
  return { minX: b.minX - 1000, maxX: b.maxX + 1000, minY: b.minY - 1000, maxY: b.maxY + 1000 };
}
type Hit = { x: number; y: number; text: string; npc?: Npc; to?: Vec2 };

// each kind of townsperson's dot and label (a smith glows like a forge)
const NPC_COLORS: Record<NpcRole, string> = { shop: "#f4d27a", heal: "#9df0b4", talk: "#fbf6e8", travel: "#9fd4ff", smith: "#ffa45c" };

// the levels each field square names: its monsters' average ± FIELD_BAND (bestiary.ts
// fieldLevels; the first field's slimes, 1-9, average 5)
const LEVELS: Record<string, [number, number]> = { field: [1, 10], ...Object.fromEntries(Object.keys(FIELDS).flatMap((id) => { const lv = fieldLevels(id); return lv ? [[id, lv]] : []; })) };
// an empty square's colours: ground and marks
const GROUND_COLORS: Record<Ground, [string, string]> = {
  "~": ["#235f82", "rgba(220, 240, 255, 0.28)"], "^": ["#d9dee0", "#8f8a7e"], "#": ["#93b46a", "#6f9150"],
  "%": ["#5f8f52", "#3e6b3a"], ":": ["#dcc48e", "#b0925a"], M: ["#7d8c62", "#5d6b48"],
};

export class MapUI {
  win: HTMLElement;
  title: HTMLElement;
  tabs: Record<View, HTMLButtonElement>;
  canvas: HTMLCanvasElement;
  info: HTMLElement;
  mini: HTMLCanvasElement;
  miniName: HTMLElement;
  view: View = "local";
  map: GameMap | null = null;
  pic: HTMLCanvasElement | null = null;
  names: Record<string, string>;
  hits: Hit[] = [];
  hover: { x: number; y: number } | null = null;
  picked: Place | null = null;
  note: { text: string; t: number } | null = null; // a word after a click, over the usual text
  time = 0;
  miniClock = 1; // s since the minimap was drawn
  onWalk: (to: Vec2, npc?: Npc) => string | null;
  onTravel: (id: string, byShip: boolean) => string | null;
  guide = false; // opened by a travel guide: a click on a town goes there
  fareCut = () => 0; // the share off a guide's fare
  ports: string[] | null = null; // opened by a ship's captain: the towns the ship sails to
  // the world map: css pixels a square, the grid point (in squares) at the canvas's middle, a
  // drag under way, whether to frame it afresh, and the squares' pictures as they load
  wz = 0;
  wc = { x: 0, y: 0 };
  drag: { x: number; y: number; cx: number; cy: number; moved: boolean } | null = null;
  reframe = true;
  tiles = new Map<string, HTMLImageElement | null>();
  zoom: HTMLElement;

  // names: map id -> its name (for the warps' "to ..."); onWalk(to, npc): walk there, or up to
  // npc to talk; returns why not, or null; onTravel(id, byShip): a travel guide's (or ship's)
  // trip to that town, or why not (the fare)
  constructor(names: Record<string, string>, onWalk: (to: Vec2, npc?: Npc) => string | null, onTravel: (id: string, byShip: boolean) => string | null) {
    this.names = names;
    this.onWalk = onWalk;
    this.onTravel = onTravel;
    this.win = makeWindow("map", "แผนที่", "M");
    const bar = this.win.querySelector(".window-bar")!;
    this.title = bar.querySelector("h2")!;
    const tabs = el("div", "mp-tabs");
    bar.insertBefore(tabs, bar.querySelector("kbd"));
    const tab = (v: View, text: string) => {
      const b = el("button", "sk-tab", tabs);
      b.type = "button";
      b.textContent = text;
      b.addEventListener("click", () => this.show(v));
      return b;
    };
    this.tabs = { local: tab("local", "แผนที่นี้"), world: tab("world", "แผนที่โลก") };
    const stage = el("div", "mp-stage", this.win);
    this.canvas = el("canvas", "mp-canvas", stage);
    this.info = el("div", "mp-info", stage);
    this.canvas.addEventListener("pointermove", (e) => {
      this.hover = { x: e.offsetX, y: e.offsetY };
      const d = this.drag;
      if (!d) return;
      // the world map follows the pointer once it has moved a little
      if (!d.moved && Math.hypot(e.offsetX - d.x, e.offsetY - d.y) > 6) d.moved = true;
      if (d.moved) this.look(d.cx - (e.offsetX - d.x) / this.wz, d.cy - (e.offsetY - d.y) / this.wz);
    });
    this.canvas.addEventListener("pointerleave", () => (this.hover = null));
    this.canvas.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      this.hover = { x: e.offsetX, y: e.offsetY };
      if (this.view === "world") {
        this.drag = { x: e.offsetX, y: e.offsetY, cx: this.wc.x, cy: this.wc.y, moved: false };
        this.canvas.setPointerCapture(e.pointerId);
      } else this.pickPoint(e.offsetX, e.offsetY);
    });
    this.canvas.addEventListener("pointerup", (e) => {
      const d = this.drag;
      this.drag = null;
      if (d && !d.moved && this.view === "world") this.pickPlace(e.offsetX, e.offsetY);
    });
    this.canvas.addEventListener("pointercancel", () => (this.drag = null));
    this.canvas.addEventListener("wheel", (e) => {
      if (this.view !== "world") return;
      e.preventDefault();
      this.zoomAt(e.deltaY < 0 ? 1.25 : 0.8, e.offsetX, e.offsetY);
    }, { passive: false });
    this.zoom = el("div", "mp-zoom", stage);
    for (const [text, f] of [["+", 1.4], ["−", 1 / 1.4]] as [string, number][]) {
      const b = el("button", "mp-zoom-btn", this.zoom);
      b.type = "button";
      b.textContent = text;
      b.addEventListener("click", () => this.zoomAt(f));
    }
    // fit when the window opens (not on the window manager's own class changes: front, collapsed)
    let wasOpen = this.open;
    new MutationObserver(() => {
      if (this.open !== wasOpen && (wasOpen = this.open)) this.fit();
    }).observe(this.win, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", () => this.open && this.fit());

    const box = el("div", "minimap", document.body);
    box.setAttribute("role", "button");
    box.setAttribute("aria-label", "แผนที่ (M)");
    this.mini = el("canvas", "", box);
    this.miniName = el("div", "mm-name", box);
    box.addEventListener("click", () => (this.open && this.view === "local" ? this.toggle(false) : this.show("local")));
  }

  get open(): boolean {
    return !this.win.classList.contains("hidden");
  }

  // M: this map, and M again closes it (the world map is a tab in the window).
  cycle(): void {
    this.guide = false;
    if (!this.open) this.show("local");
    else this.toggle(false);
  }

  show(v: View): void {
    this.view = v;
    this.picked = null;
    this.reframe = true;
    this.win.classList.remove("hidden");
    this.fit();
  }

  toggle(show = !this.open): void {
    if (show) this.show(this.view);
    else {
      this.win.classList.add("hidden");
      this.guide = false;
    }
  }

  // A travel guide's world map (or a ship's: only its ports): pick a town to go to.
  travel(ports?: string[]): void {
    this.guide = true;
    this.ports = ports ?? null;
    this.show("world");
  }

  // A new map and its picture from above.
  setMap(map: GameMap, pic: HTMLCanvasElement | null): void {
    this.map = map;
    this.pic = pic;
    this.miniName.textContent = map.name;
    if (this.open) this.fit();
  }

  // Size the window's canvas to the picture and the screen.
  fit(): void {
    for (const v of ["local", "world"] as View[]) this.tabs[v].classList.toggle("on", v === this.view);
    this.tabs.local.textContent = this.map ? this.map.name : "แผนที่นี้";
    this.title.textContent = this.guide && this.ports ? "ขึ้นเรือ · เลือกท่าเรือ" : this.guide ? "วาร์ป · เลือกเมือง" : this.view === "world" ? "แผนที่โลก" : "แผนที่";
    const [w, h] = this.view === "world" || !this.pic ? [GRID.cols * 100, GRID.rows * 100] : [this.pic.width, this.pic.height];
    const touch = isTouch();
    const maxW = Math.min(touch ? 2000 : 900, innerWidth - (touch ? 28 : 56));
    const maxH = innerHeight - (touch ? 70 : 200);
    const s = Math.min(maxW / w, maxH / h);
    const cw = Math.floor(w * s), ch = Math.floor(h * s), dpr = Math.min(2, devicePixelRatio || 1);
    this.canvas.style.width = `${cw}px`;
    this.canvas.style.height = `${ch}px`;
    this.canvas.width = Math.round(cw * dpr);
    this.canvas.height = Math.round(ch * dpr);
    this.zoom.classList.toggle("hidden", this.view !== "world");
    if (this.view === "world") {
      // a guide's or a ship's map shows the whole world; otherwise a closer look round here
      const here = PLACES.find((p) => p.id === this.map?.id);
      if (this.reframe) {
        this.wz = this.guide || !here ? 0 : cw / 6;
        this.wc = here && !this.guide ? { x: here.col + 0.5, y: here.row + 0.5 } : { x: GRID.col0 + GRID.cols / 2, y: GRID.row0 + GRID.rows / 2 };
        this.reframe = false;
      }
      this.look(this.wc.x, this.wc.y);
    }
  }

  // ---- the world map's zoom and drag ----
  // the closest and the farthest it goes, in css pixels a square
  zoomRange(): [number, number] {
    const w = parseFloat(this.canvas.style.width), h = parseFloat(this.canvas.style.height);
    return [Math.min(w / GRID.cols, h / GRID.rows), w / 2.2];
  }

  // Centre on grid point (x, y), kept so the grid fills the view as far as it can.
  look(x: number, y: number): void {
    const [lo, hi] = this.zoomRange();
    this.wz = Math.max(lo, Math.min(hi, this.wz || lo));
    const w = parseFloat(this.canvas.style.width) / this.wz / 2, h = parseFloat(this.canvas.style.height) / this.wz / 2;
    const keep = (v: number, a: number, b: number, half: number) => (b - a <= half * 2 ? (a + b) / 2 : Math.max(a + half, Math.min(b - half, v)));
    this.wc = { x: keep(x, GRID.col0, GRID.col0 + GRID.cols, w), y: keep(y, GRID.row0, GRID.row0 + GRID.rows, h) };
  }

  // Zoom by f, keeping the grid point under (x, y) css pixels (default: the middle) where it is.
  zoomAt(f: number, x?: number, y?: number): void {
    const w = parseFloat(this.canvas.style.width), h = parseFloat(this.canvas.style.height);
    const px = x ?? w / 2, py = y ?? h / 2;
    const gx = this.wc.x + (px - w / 2) / this.wz, gy = this.wc.y + (py - h / 2) / this.wz;
    const [lo, hi] = this.zoomRange();
    this.wz = Math.max(lo, Math.min(hi, this.wz * f));
    this.look(gx - (px - w / 2) / this.wz, gy - (py - h / 2) / this.wz);
  }

  // A word for a moment in place of the usual text.
  say(text: string): void {
    this.note = { text, t: 2.5 };
  }

  // A click at (x, y) css pixels on this map: walk there, into a warp, or up to someone.
  pickPoint(x: number, y: number): void {
    const map = this.map;
    if (!map) return;
    const b = mapArea(map), w = parseFloat(this.canvas.style.width), sc = w / (b.maxY - b.minY), dpr = this.canvas.width / w;
    const hit = this.hitAt(x * dpr, y * dpr);
    const why = this.onWalk(hit?.npc ?? hit?.to ?? { x: b.maxX - y / sc, y: b.maxY - x / sc }, hit?.npc);
    if (why) this.say(why);
    else if (isTouch()) this.toggle(false); // the map covers a phone: let her be seen walking
    else this.say(hit?.npc ? `กำลังเดินไปหา${hit.npc.spec.name}` : "กำลังเดินไป");
  }

  // A click on the world map: an open place next door walks to the way out there.
  pickPlace(x: number, y: number): void {
    const p = (this.picked = this.placeAt(x, y)), map = this.map;
    if (this.guide) {
      // a travel guide sends you to any open town
      if (!p || !map) return;
      if (p.id === map.id) return this.say(`ตอนนี้อยู่ที่${p.name}แล้ว`);
      if (this.ports && !this.ports.includes(p.id)) return this.say(`เรือลำนี้ไม่ได้แล่นไป${p.name}`);
      if (!p.open || p.kind === "field") return this.say(`ผู้นำทางยังพาไป${p.name}ไม่ได้`);
      const why = this.onTravel(p.id, !!this.ports);
      if (why) return this.say(why);
      this.toggle(false);
      return;
    }
    if (!p || !map || !p.open || p.id === map.id) return;
    const warp = map.warps.find((w) => w.to === p.id);
    if (!warp) return this.say(`ทางไป${p.name}ไม่ได้อยู่ในแผนที่นี้`);
    const why = this.onWalk(warp);
    if (why) this.say(why);
    else if (isTouch()) this.toggle(false);
    else this.say(`กำลังเดินไปทางออกสู่${p.name}`);
  }

  // The mark nearest a canvas point (device pixels), if one is close.
  hitAt(x: number, y: number): Hit | null {
    const r = 14 * (this.canvas.width / parseFloat(this.canvas.style.width));
    return this.hits.reduce<Hit | null>((best, h) => (Math.hypot(h.x - x, h.y - y) < r && (!best || Math.hypot(h.x - x, h.y - y) < Math.hypot(best.x - x, best.y - y)) ? h : best), null);
  }

  frame(dt: number, st: MapState): void {
    this.time += dt;
    if (this.note && (this.note.t -= dt) <= 0) this.note = null;
    // (the minimap 15 times a second is plenty, and a phone spares the redraws)
    if ((this.miniClock += dt) >= 1 / 15) {
      this.miniClock = 0;
      this.drawMini(st);
    }
    if (!this.open) return;
    if (this.view === "world") this.drawWorld(st);
    else this.drawLocal(st);
  }

  // ---- this map ----
  drawLocal(st: MapState): void {
    const map = this.map, c = this.canvas, g = c.getContext("2d")!;
    if (!map) return;
    const b = mapArea(map), sc = c.width / (b.maxY - b.minY), dpr = c.width / parseFloat(c.style.width);
    const at = (p: Vec2): [number, number] => [(b.maxY - p.y) * sc, (b.maxX - p.x) * sc];
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#1b2614";
    g.fillRect(0, 0, c.width, c.height);
    if (this.pic) g.drawImage(this.pic, 0, 0, c.width, c.height);
    this.hits = [];
    g.textAlign = "center";
    g.lineJoin = "round";
    const label = (x: number, y: number, text: string, size: number, color: string) => {
      g.font = `600 ${size * dpr}px Kanit, sans-serif`;
      const half = g.measureText(text).width / 2 + 4 * dpr; // kept inside the picture
      x = Math.max(half, Math.min(c.width - half, x));
      g.lineWidth = 3.5 * dpr;
      g.strokeStyle = "rgba(12, 16, 8, 0.85)";
      g.strokeText(text, x, y);
      g.fillStyle = color;
      g.fillText(text, x, y);
    };
    // monsters, then the townsfolk, the warps and the shut gates
    for (const m of st.monsters) {
      if (!m.alive) continue;
      const [x, y] = at(m);
      dot(g, x, y, 3.2 * dpr, "#ff6a5a");
    }
    for (const w of map.warps) {
      const [x, y] = at(w);
      warpMark(g, x, y, 7 * dpr, this.time);
      const text = `ไป${this.names[w.to] ?? w.to}`;
      label(x, y - 12 * dpr, text, 12, "#a9e4ff");
      this.hits.push({ x, y, text: `วงแสงวาร์ป: เดินเข้าไปเพื่อ${text}`, to: w });
    }
    for (const cl of map.closed) {
      const [x, y] = at(cl);
      cross(g, x, y, 5 * dpr);
      this.hits.push({ x, y, text: cl.text });
    }
    for (const l of map.labels) {
      if (l.kind === "small" && c.width / dpr < 700) continue; // no room on a phone
      const [x, y] = at(l);
      if (l.kind === "gate") label(x, y, l.text, 11.5, "#ffd9a8");
      else label(x, y, l.text, l.kind === "small" ? 11.5 : 15, l.kind === "small" ? "#e8e2cf" : "#fff3cf");
    }
    for (const n of st.npcs) {
      const [x, y] = at(n), role = n.spec.role;
      dot(g, x, y, (role === "talk" ? 3.4 : 4.6) * dpr, NPC_COLORS[role]);
      if (role !== "talk") label(x, y - 8 * dpr, n.spec.title.split(" · ")[0], 11.5, NPC_COLORS[role]);
      this.hits.push({ x, y, text: `${n.spec.name} · ${n.spec.title}`, npc: n });
    }
    if (st.route) route(g, st.route.map(at), dpr);
    const [px, py] = at(st.player);
    viewCone(g, px, py, st.yaw, 46 * dpr);
    arrow(g, px, py, st.facing, 8 * dpr);
    // what is under the pointer
    let text = isTouch() ? "แตะที่ไหนก็ได้เพื่อเดินไป · แตะชาวเมืองเพื่อเดินไปคุย"
      : "คลิกที่ไหนก็ได้เพื่อเดินไป · คลิกชาวเมืองเพื่อเดินไปคุย · จุดเหลือง ร้านค้า · จุดเขียว นักบวช · วงฟ้า ทางออก · กด M อีกครั้งเพื่อดูแผนที่โลก";
    const near = this.hover && this.hitAt(this.hover.x * dpr, this.hover.y * dpr);
    if (near) text = near.text;
    if (this.note) text = this.note.text;
    if (this.info.textContent !== text) this.info.textContent = text;
  }

  // ---- the world ----
  // The place whose square is under (x, y) css pixels.
  placeAt(x: number, y: number): Place | null {
    const w = parseFloat(this.canvas.style.width), h = parseFloat(this.canvas.style.height);
    const col = Math.floor(this.wc.x + (x - w / 2) / this.wz), row = Math.floor(this.wc.y + (y - h / 2) / this.wz);
    return PLACES.find((p) => p.col === col && p.row === row) ?? null;
  }

  // A square's picture, asked for the first time it is drawn (null: there is none).
  tile(id: string): HTMLImageElement | null {
    if (!this.tiles.has(id)) {
      const img = new Image();
      img.onerror = () => this.tiles.set(id, null);
      img.src = `assets/worldmap/${id}.webp`;
      this.tiles.set(id, img);
    }
    const img = this.tiles.get(id);
    return img && img.complete && img.naturalWidth ? img : null;
  }

  // Whether a guide (or a ship) can take you to a place.
  reachable(p: Place): boolean {
    if (this.ports) return this.ports.includes(p.id);
    return p.open && p.kind !== "field";
  }

  drawWorld(st: MapState): void {
    const c = this.canvas, g = c.getContext("2d")!, dpr = c.width / parseFloat(c.style.width), k = this.wz * dpr;
    const X = (gx: number) => (gx - this.wc.x) * k + c.width / 2, Y = (gy: number) => (gy - this.wc.y) * k + c.height / 2;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = GROUND_COLORS["~"][0];
    g.fillRect(0, 0, c.width, c.height);
    g.lineJoin = "round";
    const text = (t: string, x: number, y: number, size: number, color: string) => {
      g.font = `600 ${size}px Kanit, sans-serif`;
      g.lineWidth = Math.max(2.5, size * 0.24);
      g.strokeStyle = "rgba(14, 12, 6, 0.85)";
      g.strokeText(t, x, y);
      g.fillStyle = color;
      g.fillText(t, x, y);
    };
    // the squares in view
    const c0 = Math.max(GRID.col0, Math.floor(this.wc.x - c.width / 2 / k)), c1 = Math.min(GRID.col0 + GRID.cols - 1, Math.floor(this.wc.x + c.width / 2 / k));
    const r0 = Math.max(GRID.row0, Math.floor(this.wc.y - c.height / 2 / k)), r1 = Math.min(GRID.row0 + GRID.rows - 1, Math.floor(this.wc.y + c.height / 2 / k));
    const at = new Map(PLACES.map((p) => [`${p.col},${p.row}`, p]));
    for (let row = r0; row <= r1; row++)
      for (let col = c0; col <= c1; col++) {
        const p = at.get(`${col},${row}`), x = X(col), y = Y(row);
        const img = p ? this.tile(p.id) : null;
        if (img) g.drawImage(img, x, y, k + 0.5, k + 0.5);
        else groundSquare(g, groundAt(col, row), x, y, k, col * 31 + row * 17);
      }
    // the lines between the squares
    g.strokeStyle = "rgba(20, 24, 16, 0.55)";
    g.lineWidth = Math.max(1, dpr);
    g.beginPath();
    for (let col = c0; col <= c1 + 1; col++) {
      g.moveTo(X(col), Y(r0));
      g.lineTo(X(col), Y(r1 + 1));
    }
    for (let row = r0; row <= r1 + 1; row++) {
      g.moveTo(X(c0), Y(row));
      g.lineTo(X(c1 + 1), Y(row));
    }
    g.stroke();
    g.textAlign = "center";
    const css = k / dpr; // a square's size on screen
    for (const s of SEAS) text(s.text, X(s.x), Y(s.y), Math.max(11 * dpr, k * 0.13), "rgba(214, 238, 255, 0.8)");

    const here = this.map?.id;
    const hovered = this.hover && !this.drag?.moved ? this.placeAt(this.hover.x, this.hover.y) : null;
    for (const p of PLACES) {
      if (p.col < c0 || p.col > c1 || p.row < r0 || p.row > r1) continue;
      const x = X(p.col), y = Y(p.row);
      // a guide's map dims what it can't take you to
      if (this.guide && !this.reachable(p)) {
        g.fillStyle = "rgba(10, 14, 20, 0.5)";
        g.fillRect(x, y, k, k);
      }
      if (p === hovered || p === this.picked) {
        g.fillStyle = "rgba(255, 255, 255, 0.16)";
        g.fillRect(x, y, k, k);
        g.strokeStyle = "rgba(255, 255, 255, 0.9)";
        g.lineWidth = 2 * dpr;
        g.strokeRect(x + dpr, y + dpr, k - 2 * dpr, k - 2 * dpr);
      }
      if (p.id === here) {
        // "you are here": the square's edge glows and breathes
        g.strokeStyle = `rgba(255, 226, 122, ${0.65 + 0.35 * Math.sin(this.time * 4)})`;
        g.lineWidth = 3 * dpr;
        g.strokeRect(x + 1.5 * dpr, y + 1.5 * dpr, k - 3 * dpr, k - 3 * dpr);
      }
      // the name along the square's foot (towns only when the squares are small), its levels under it
      const town = p.kind !== "field";
      if (css < 80 && !town) continue;
      const size = Math.max(10 * dpr, Math.min(17 * dpr, k * (town ? 0.14 : 0.12)));
      const lv = LEVELS[p.id];
      const showLv = lv && css >= 92;
      text(p.name, x + k / 2, y + k - (showLv ? size * 1.45 : size * 0.55), size, town ? "#ffe39a" : "#fff6dc");
      if (showLv) text(`Lv ${levelText(lv)}`, x + k / 2, y + k - size * 0.45, size * 0.78, "#cfe8ff");
      if (!p.open) text("ยังไม่เปิด", x + k / 2, y + k * 0.2, size * 0.8, "#f0b9a4");
    }
    // where she stands in her square
    const me = PLACES.find((p) => p.id === here);
    if (me && this.map) {
      const a = tileArea(this.map.bounds), side = a.maxX - a.minX;
      const px = X(me.col + (a.maxY - st.player.y) / side), py = Y(me.row + (a.maxX - st.player.x) / side);
      arrow(g, px, py, st.facing, Math.max(5 * dpr, k * 0.06));
      if (css >= 92) {
        g.textAlign = "left";
        text("คุณอยู่ที่นี่", px + 8 * dpr, py - 8 * dpr, 12 * dpr, "#ffe27a");
        g.textAlign = "center";
      }
    }

    const p = hovered ?? this.picked;
    // a guide's fare to an open town
    const fare = p && this.guide && !this.ports && this.map && p.id !== this.map.id && this.reachable(p)
      ? ` · ค่าเดินทาง ${travelFee(this.map.id, p.id, this.fareCut()).toLocaleString()} ทอง` : "";
    let info = p ? `${p.name}${fare} · ${p.region} — ${p.desc}${p.open ? "" : " (ยังไม่เปิด)"}`
      : this.guide && this.ports ? `${isTouch() ? "แตะ" : "คลิก"}ท่าเรือที่จะไป: ${this.ports.map((id) => PLACES.find((q) => q.id === id)?.name ?? id).join(" หรือ ")}`
      : this.guide ? `${isTouch() ? "แตะ" : "คลิก"}เมืองที่จะไป ผู้นำทางพาไปถึงในพริบตา (ค่าเดินทาง ${TRAVEL_FEE_MIN.toLocaleString()} ทองขึ้นไป ไกลยิ่งแพง)`
      : isTouch() ? "ลากเพื่อเลื่อน · ปุ่ม + − ซูม · แตะช่องข้างๆ เพื่อเดินไปทางออกนั้น"
      : "ลากเพื่อเลื่อน · ล้อเมาส์หรือปุ่ม + − ซูม · ชี้ที่ช่องเพื่ออ่านเรื่องของที่นั้น · คลิกช่องข้างๆ เพื่อเดินไปทางออกนั้น · กด M อีกครั้งเพื่อปิด";
    if (this.note) info = this.note.text;
    if (this.info.textContent !== info) this.info.textContent = info;
  }

  // ---- the minimap: about 60 m round the player, north up ----
  drawMini(st: MapState): void {
    const c = this.mini, css = c.clientWidth;
    if (!css) return;
    const dpr = Math.min(2, devicePixelRatio || 1), size = Math.round(css * dpr);
    if (c.width !== size) c.width = c.height = size;
    const g = c.getContext("2d")!, map = this.map;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#1b2614";
    g.fillRect(0, 0, size, size);
    if (!map) return;
    const area = mapArea(map), range = Math.min(isTouch() ? 4800 : 6000, area.maxX - area.minX, area.maxY - area.minY), sc = size / range;
    const at = (p: Vec2): [number, number] => [size / 2 + (st.player.y - p.y) * sc, size / 2 + (st.player.x - p.x) * sc];
    if (this.pic) {
      const b = area, k = this.pic.width / (b.maxY - b.minY);
      // the part of the picture under the minimap, clipped to the picture
      const sx = (b.maxY - st.player.y - range / 2) * k, sy = (b.maxX - st.player.x - range / 2) * k, sw = range * k;
      const x0 = Math.max(0, sx), y0 = Math.max(0, sy), x1 = Math.min(this.pic.width, sx + sw), y1 = Math.min(this.pic.height, sy + sw);
      if (x1 > x0 && y1 > y0) g.drawImage(this.pic, x0, y0, x1 - x0, y1 - y0, ((x0 - sx) / sw) * size, ((y0 - sy) / sw) * size, ((x1 - x0) / sw) * size, ((y1 - y0) / sw) * size);
    }
    for (const m of st.monsters) {
      if (!m.alive) continue;
      const [x, y] = at(m);
      dot(g, x, y, 2.6 * dpr, "#ff6a5a");
    }
    for (const w of map.warps) {
      const [x, y] = at(w);
      warpMark(g, x, y, 5 * dpr, this.time);
    }
    for (const n of st.npcs) {
      const [x, y] = at(n);
      dot(g, x, y, (n.spec.role === "talk" ? 2.6 : 3.4) * dpr, NPC_COLORS[n.spec.role]);
    }
    if (st.route) route(g, st.route.map(at), dpr * 0.8);
    viewCone(g, size / 2, size / 2, st.yaw, size * 0.32);
    arrow(g, size / 2, size / 2, st.facing, 6 * dpr);
    // north
    g.font = `600 ${10 * dpr}px Kanit, sans-serif`;
    g.textAlign = "center";
    g.lineWidth = 3 * dpr;
    g.strokeStyle = "rgba(12, 16, 8, 0.85)";
    g.strokeText("N", size / 2, 11 * dpr);
    g.fillStyle = "#f4d27a";
    g.fillText("N", size / 2, 11 * dpr);
  }
}

// ---- marks ----
function dot(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  g.fillStyle = "rgba(12, 16, 8, 0.9)";
  g.beginPath();
  g.arc(x, y, r + Math.max(1, r * 0.35), 0, Math.PI * 2);
  g.fill();
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

function warpMark(g: CanvasRenderingContext2D, x: number, y: number, r: number, t: number): void {
  g.strokeStyle = "rgba(12, 30, 50, 0.8)";
  g.lineWidth = r * 0.75;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = `rgba(127, 208, 255, ${0.75 + 0.25 * Math.sin(t * 4)})`;
  g.lineWidth = r * 0.4;
  g.stroke();
}

function cross(g: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  g.lineCap = "round";
  for (const [w, col] of [[r * 0.9, "rgba(12, 16, 8, 0.9)"], [r * 0.45, "#ff8a7a"]] as [number, string][]) {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x - r, y - r);
    g.lineTo(x + r, y + r);
    g.moveTo(x + r, y - r);
    g.lineTo(x - r, y + r);
    g.stroke();
  }
}

// A walk under way: a dashed line along the waypoints and a flag where it ends (k: pixel scale).
function route(g: CanvasRenderingContext2D, pts: [number, number][], k: number): void {
  g.setLineDash([5 * k, 4 * k]);
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const [w, col] of [[4 * k, "rgba(12, 16, 8, 0.75)"], [2 * k, "#ffe27a"]] as [number, string][]) {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
  }
  g.setLineDash([]);
  const [x, y] = pts[pts.length - 1];
  g.strokeStyle = "rgba(12, 16, 8, 0.9)";
  g.lineWidth = 2.4 * k;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x, y - 15 * k);
  g.stroke();
  g.fillStyle = "#ff6a5a";
  g.lineWidth = k;
  g.beginPath();
  g.moveTo(x, y - 15 * k);
  g.lineTo(x + 10 * k, y - 11.5 * k);
  g.lineTo(x, y - 8 * k);
  g.closePath();
  g.fill();
  g.stroke();
}

// The player: an arrow the way she faces (north up: world +X is up, -Y is right).
function arrow(g: CanvasRenderingContext2D, x: number, y: number, f: Vec2, r: number): void {
  const a = Math.atan2(-f.x, -f.y); // screen angle of world (f.x, f.y)
  g.save();
  g.translate(x, y);
  g.rotate(a);
  g.beginPath();
  g.moveTo(r * 1.3, 0);
  g.lineTo(-r * 0.8, r * 0.85);
  g.lineTo(-r * 0.35, 0);
  g.lineTo(-r * 0.8, -r * 0.85);
  g.closePath();
  g.fillStyle = "#fff6dc";
  g.fill();
  g.lineWidth = r * 0.3;
  g.strokeStyle = "#c9302c";
  g.stroke();
  g.restore();
}

// Where the camera looks: a soft fan from the player.
function viewCone(g: CanvasRenderingContext2D, x: number, y: number, yaw: number, r: number): void {
  const a = Math.atan2(-Math.cos(yaw), -Math.sin(yaw));
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, "rgba(255, 246, 220, 0.35)");
  gr.addColorStop(1, "rgba(255, 246, 220, 0)");
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(x, y);
  g.arc(x, y, r, a - 0.6, a + 0.6);
  g.closePath();
  g.fill();
}

// An empty square of the world map: its ground, and a few marks drawn the same way every time
// (seed): waves on the sea, peaks on the mountains, trees in the forest, dunes on the sand, tufts
// on the grass.
function groundSquare(g: CanvasRenderingContext2D, ground: Ground, x: number, y: number, k: number, seed: number): void {
  const [fill, mark] = GROUND_COLORS[ground];
  g.fillStyle = fill;
  g.fillRect(x, y, k + 0.5, k + 0.5);
  let s = (seed * 16807 + 12345) % 2147483647 || 1;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  g.strokeStyle = mark;
  g.fillStyle = mark;
  g.lineWidth = Math.max(1, k * 0.012);
  const n = ground === "~" ? 7 : ground === "^" ? 4 : 9;
  for (let i = 0; i < n; i++) {
    const u = x + (0.15 + rnd() * 0.7) * k, v = y + (0.15 + rnd() * 0.7) * k, r = k * (0.035 + rnd() * 0.03);
    g.beginPath();
    if (ground === "~") {
      g.arc(u, v, r, Math.PI * 1.15, Math.PI * 1.85);
      g.arc(u + r * 1.7, v, r, Math.PI * 1.15, Math.PI * 1.85);
      g.stroke();
    } else if (ground === "^") {
      const h = r * 3.2;
      g.moveTo(u - h, v + h * 0.6);
      g.lineTo(u, v - h * 0.6);
      g.lineTo(u + h, v + h * 0.6);
      g.closePath();
      g.fill();
      g.fillStyle = "#f6f9fb";
      g.beginPath();
      g.moveTo(u - h * 0.35, v - h * 0.18);
      g.lineTo(u, v - h * 0.6);
      g.lineTo(u + h * 0.35, v - h * 0.18);
      g.closePath();
      g.fill();
      g.fillStyle = mark;
    } else if (ground === "%") {
      g.arc(u, v, r * 1.3, 0, Math.PI * 2);
      g.fill();
    } else if (ground === ":") {
      g.arc(u, v + r, r * 1.6, Math.PI * 1.2, Math.PI * 1.8);
      g.stroke();
    } else {
      g.moveTo(u - r * 0.6, v);
      g.lineTo(u - r * 0.2, v - r);
      g.moveTo(u + r * 0.2, v);
      g.lineTo(u + r * 0.6, v - r);
      g.stroke();
    }
  }
}

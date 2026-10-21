// Maps: the minimap in the top right corner, and the map window (M): first the map you are on,
// then the world. The picture of a game map is the 3D scenery seen from straight above
// (World3D.snapshot), north up; the townsfolk, warps, monsters and the player are drawn over
// it. Tapping the minimap opens the window too (phones have no M key). A click on the map walks
// there (on someone: up to them, to talk); on the world map, to the way out to a place.

import { el, makeWindow } from "./ui";
import { isTouch } from "./touch";
import { PLACES, REGIONS, WORLD_W, WORLD_H, paintWorld, drawPlace } from "./worldmap";
import type { Place } from "./worldmap";
import type { GameMap } from "./maps";
import type { Npc } from "./npcs";
import type { Monster } from "./monsters";
import type { Vec2 } from "./types";

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

const NPC_COLORS: Record<string, string> = { shop: "#f4d27a", heal: "#9df0b4", talk: "#fbf6e8", travel: "#9fd4ff" };

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
  world: HTMLCanvasElement | null = null;
  hits: Hit[] = [];
  hover: { x: number; y: number } | null = null;
  picked: Place | null = null;
  note: { text: string; t: number } | null = null; // a word after a click, over the usual text
  time = 0;
  onWalk: (to: Vec2, npc?: Npc) => string | null;
  onTravel: (id: string) => void;
  guide = false; // opened by a travel guide: a click on a town goes there
  ports: string[] | null = null; // opened by a ship's captain: the towns the ship sails to

  // names: map id -> its name (for the warps' "to ..."); onWalk(to, npc): walk there, or up to
  // npc to talk; returns why not, or null; onTravel(id): a travel guide's trip to that town
  constructor(names: Record<string, string>, onWalk: (to: Vec2, npc?: Npc) => string | null, onTravel: (id: string) => void) {
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
    this.canvas.addEventListener("pointermove", (e) => (this.hover = { x: e.offsetX, y: e.offsetY }));
    this.canvas.addEventListener("pointerleave", () => (this.hover = null));
    this.canvas.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      this.hover = { x: e.offsetX, y: e.offsetY };
      if (this.view === "world") this.pickPlace(e.offsetX, e.offsetY);
      else this.pickPoint(e.offsetX, e.offsetY);
    });
    new MutationObserver(() => this.open && this.fit()).observe(this.win, { attributes: true, attributeFilter: ["class"] });
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

  // M: this map, then the world, then closed.
  cycle(): void {
    this.guide = false;
    if (!this.open) this.show("local");
    else if (this.view === "local") this.show("world");
    else this.toggle(false);
  }

  show(v: View): void {
    this.view = v;
    this.picked = null;
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
    this.show("world");
    this.guide = true;
    this.ports = ports ?? null;
    this.fit();
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
    this.title.textContent = this.guide && this.ports ? "ขึ้นเรือ · เลือกท่าเรือ" : this.guide ? "เดินทาง · เลือกเมือง" : this.view === "world" ? "แผนที่โลก" : "แผนที่";
    const [w, h] = this.view === "world" || !this.pic ? [WORLD_W, WORLD_H] : [this.pic.width, this.pic.height];
    const touch = isTouch();
    const maxW = Math.min(touch ? 2000 : 900, innerWidth - (touch ? 28 : 56));
    const maxH = innerHeight - (touch ? 70 : 200);
    const s = Math.min(maxW / w, maxH / h);
    const cw = Math.floor(w * s), ch = Math.floor(h * s), dpr = Math.min(2, devicePixelRatio || 1);
    this.canvas.style.width = `${cw}px`;
    this.canvas.style.height = `${ch}px`;
    this.canvas.width = Math.round(cw * dpr);
    this.canvas.height = Math.round(ch * dpr);
    if (this.view === "world" && !this.world) this.world = paintWorld(2);
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
      if (!p.open || p.kind === "field" || p.kind === "castle") return this.say(`ผู้นำทางยังพาไป${p.name}ไม่ได้`);
      this.toggle(false);
      this.onTravel(p.id);
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
    this.drawMini(st);
    if (!this.open) return;
    if (this.view === "world") this.drawWorld();
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
  placeAt(x: number, y: number): Place | null {
    const s = parseFloat(this.canvas.style.width) / WORLD_W;
    return PLACES.reduce<Place | null>((best, p) => (Math.hypot(p.x * s - x, (p.y - 6) * s - y) < 20 && (!best || Math.hypot(p.x * s - x, p.y * s - y) < Math.hypot(best.x * s - x, best.y * s - y)) ? p : best), null);
  }

  drawWorld(): void {
    const c = this.canvas, g = c.getContext("2d")!, s = c.width / WORLD_W, dpr = c.width / parseFloat(c.style.width);
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (this.world) g.drawImage(this.world, 0, 0, c.width, c.height);
    g.textAlign = "center";
    g.lineJoin = "round";
    const text = (t: string, x: number, y: number, size: number, color: string, outline = "rgba(20, 16, 8, 0.85)") => {
      g.font = `600 ${size}px Kanit, sans-serif`;
      g.lineWidth = Math.max(2.5, size * 0.22);
      g.strokeStyle = outline;
      g.strokeText(t, x, y);
      g.fillStyle = color;
      g.fillText(t, x, y);
    };
    const px = (n: number) => Math.max(n * dpr * 0.75, n * s); // a size in map units, never too small to read
    for (const r of REGIONS) text(r.text, r.x * s, r.y * s, px(13), r.sea ? "rgba(214, 238, 255, 0.75)" : "rgba(255, 248, 225, 0.72)", r.sea ? "rgba(10, 40, 60, 0.5)" : "rgba(40, 30, 10, 0.45)");
    const here = this.map?.id;
    const hovered = this.hover ? this.placeAt(this.hover.x, this.hover.y) : null;
    for (const p of PLACES) {
      const x = p.x * s, y = p.y * s;
      if (p.id === here) {
        // "you are here": a ring that keeps opening
        const t = (this.time * 0.8) % 1;
        g.strokeStyle = `rgba(255, 226, 122, ${1 - t})`;
        g.lineWidth = 2.5 * dpr;
        g.beginPath();
        g.arc(x, y - 6 * s, px(12) + t * px(16), 0, Math.PI * 2);
        g.stroke();
      }
      if (p === hovered || p === this.picked) {
        g.fillStyle = "rgba(255, 255, 255, 0.22)";
        g.beginPath();
        g.arc(x, y - 6 * s, px(16), 0, Math.PI * 2);
        g.fill();
      }
      drawPlace(g, p, x, y, Math.max(s, dpr * 0.8));
      const big = p.kind === "capital";
      if (p.side === "left") {
        g.textAlign = "right";
        text(p.name, x - px(13), y + px(2), px(14), "#fff3cf");
        g.textAlign = "center";
      } else text(p.name, x, y + px(big ? 20 : 17), px(big ? 17 : 14), p.open ? "#fff3cf" : "#d9d1c0");
      if (p.id === here) {
        g.textAlign = p.side === "left" ? "right" : "left";
        text("คุณอยู่ที่นี่", x + (p.side === "left" ? -px(13) : px(16)), y - px(p.side === "left" ? 14 : 6), px(12), "#ffe27a");
        g.textAlign = "center";
      }
      else if (!p.open) text("ยังไม่เปิด", x, y + px(big ? 33 : 29), px(10.5), "#e8b7a4");
    }
    const p = hovered ?? this.picked;
    let info = p ? `${p.name} · ${p.region} — ${p.desc}${p.open ? "" : " (ยังไม่เปิด)"}`
      : this.guide && this.ports ? `${isTouch() ? "แตะ" : "คลิก"}ท่าเรือที่จะไป: ${this.ports.map((id) => PLACES.find((q) => q.id === id)?.name ?? id).join(" หรือ ")}`
      : this.guide ? `${isTouch() ? "แตะ" : "คลิก"}เมืองที่จะไป ผู้นำทางพาไปถึงในพริบตา`
      : isTouch() ? "" : "ชี้ที่เมืองเพื่ออ่านเรื่องของเมืองนั้น · คลิกที่ที่เปิดแล้วเพื่อเดินไปทางออกนั้น · กด M อีกครั้งเพื่อปิด";
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

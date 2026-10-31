import { mapX, mapY, groundAt, fromView, setYaw, yaw, heightAt } from "./projection";
import { loadAll, mipChain, bakeGround, glow, tint } from "./assets";
import { World3D } from "./world3d/view";
import { SPAWN, debugShapes } from "./world";
import { Particles, GROUND_GLOW, SORTED, AIR_GLOW, groundSprites } from "./particles";
import { Player, directionIndex, viewRow } from "./player";
import { SkillBar, slotForCode } from "./hud";
import { Motes } from "./motes";
import { ITEMS, WEAPON_TYPES, DUAL_WIELD_SLOWDOWN, GEAR_SLOTS, offhandWeapon, weaponType, garmentLook, tierId, usable } from "./items";
import type { OffhandArt, Gender } from "./items";
import type { WeaponId } from "./items";
import { Inventory, NO_GEAR, BAG_BASE } from "./inventory";
import { InventoryUI, loadLook, saveLook, HAIRSTYLES, itemTip } from "./ui";
import { Combat, Floaters, weaponStats, attackRange, formWeapon } from "./combat";
import { gearTierAt, TIER_DROP, tierPool } from "./drops";
import { WorkshopUI } from "./workshop";
import { CodexUI } from "./codex";
import type { Craft } from "./workshop";
import { slimeSheets, spawnMonsters, rollDrops, MonsterLooks, Monster, variantOf, shots, updateShots, drawShots } from "./monsters";
import { Ground } from "./loot";
import type { MonsterCtx, Person } from "./monsters";
import { MONSTER_BY_ID, PEOPLE, behaviour, fieldMonsters } from "./bestiary";
import type { MonsterDef } from "./bestiary";
import { Looks } from "./look";
import { dressed } from "./outfits";
import type { BodyDef, HairData } from "./look";
import { WEAPON_ART } from "./weapons";
import type { WeaponArt } from "./weapons";
import { Progress, ACTIVES, BOOKS, ELEMENTS, JOBS, JOBS3, JOBS4, TREES, JOB_POINTS, TIER2_DROP_LEVEL, BOOK_CHANCE, CLASSES, levelPoints, slotItem, ITEM_PREFIX } from "./progression";
import { Hero } from "./hero";
import { Skills, lockReach } from "./skills";
import { aimKind, aimPreview, groundSpot } from "./aim";
import type { AimKind } from "./aim";
import { Allies, Ally, lookSheet } from "./allies";
import { jobMasters } from "./jobmasters";
import { COATINGS } from "./poisons";
import { terrainOf } from "./terrain";
import { monsterDamage, lucky, resists } from "./stats";
import type { ElementId, StatBag } from "./progression";

import { Vitals, ClassPicker, ProfileUI, SettingsUI, SkillUI, skillTip } from "./charui";
import { startGear } from "./starter";
import { icon, itemGlyph, skillIcon, loadSkillArt, hasArt } from "./icons";
import { Bot } from "./bot";
import { Title } from "./title";
import { useCharacter, loadRoster, touchCharacter, saveKey, readJson } from "./save";
import { ShopUI } from "./shop";
import { Stall, StallUI, Townsfolk } from "./stall";
import { Npc, TALK_RANGE } from "./npcs";
import { loadMap, MAP_NAMES, TOWNS } from "./maps";
import { MapUI, mapArea, travelFee } from "./mapui";
import { closeTop, setCloser } from "./windows";
import type { GameMap, MapId, TownId } from "./maps";
import { findPath, blocked, SOLIDS, clearShot, shortOf } from "./world";
import { RADIUS } from "./player";
import { BotUI } from "./botui";
import { garmentIcon } from "./garments";
import { detectTouch, onTouchMode, goLandscape, Joystick, isTouch } from "./touch";
import type { Spell } from "./spell";
import { Quests } from "./quests";
import { BuffBar } from "./buffbar";
import { rolledDrop } from "./sockets";
import { loadPixelFx, pixelFx } from "./pixelfx";
import { TalkDialog, QuestLog, QuestTracker } from "./questui";
import type { Speaker } from "./questui";
import { nextHop, questDest } from "./guide";
import type { Dest } from "./guide";
import type { QuestDef } from "./quests";
import { LOOKS, circleTextures } from "./circles";
import { sound } from "./audio";
import type { Atlas, Img, Textures, View } from "./types";

// What an elemental bite can leave on the player (a buff whose id starts with "ail_").
const AILMENTS: Partial<Record<ElementId, { name: string; stats: StatBag; t: number }>> = {
  ice: { name: "หนาวสั่น", stats: { aspd: -0.2 }, t: 3 },
  mud: { name: "โคลนติดเท้า", stats: { move: -0.3 }, t: 3 },
  dark: { name: "ตาพร่า", stats: { hit: -30 }, t: 4 },
};
// What some monsters' bites leave (src/bestiary.ts: slow, petrify; burn is a fire that bites
// every second).
const BITE_AILS: Record<string, { name: string; stats: StatBag; t: number }> = {
  slow: { name: "เชื่องช้า", stats: { move: -0.35 }, t: 3 },
  petrify: { name: "ตัวแข็งเป็นหิน", stats: { move: -0.85, aspd: -0.5 }, t: 1.5 },
};

const MOVE_KEYS: Record<string, [number, number]> = {
  KeyW: [1, 0], ArrowUp: [1, 0],
  KeyS: [-1, 0], ArrowDown: [-1, 0],
  KeyA: [0, 1], ArrowLeft: [0, 1],
  KeyD: [0, -1], ArrowRight: [0, -1],
};

const ICON = 40; // inventory icon size, css px

// A page reloaded onto a newer version in the middle of a trip: the character and the trip to
// finish (sessionStorage, this tab only).
const RESUME = "mmoproject.resume";
// Whether loading a map failed because its file is gone (a newer version went up since the page
// was opened: the old build's chunk names no longer exist).
function staleBuild(err: unknown): boolean {
  const m = err instanceof Error ? err.message : String(err);
  return /dynamically imported module|Importing a module script failed|error loading dynamically|Failed to fetch|Unable to preload/i.test(m);
}

const canvas = document.getElementById("game") as HTMLCanvasElement;
const worldCanvas = document.getElementById("world") as HTMLCanvasElement;
let world: World3D | null = null;
const ctx = canvas.getContext("2d")!;
let showDebug = new URLSearchParams(location.search).has("debug");

// ---- the loading screen: the files at the start, then entering the game and every map change
// wait behind it until the map is built, its townsfolk dressed and its shaders compiled ----
const loadingEl = document.getElementById("loading")!;
const loadingText = loadingEl.querySelector(".loading-title")!;
const loadingBar = document.getElementById("loading-bar") as HTMLProgressElement;
// two frames: whatever changed on screen has been painted before the work that follows
const painted = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
async function loading(text: string, progress: number): Promise<void> {
  loadingEl.classList.remove("done");
  loadingText.textContent = text;
  loadingBar.value = progress;
  await painted();
}
const loaded = () => loadingEl.classList.add("done");

// far: a debug zoom-out (__game.zoomOut); user: the player's own zoom (the mouse wheel); scale:
// how much of the screen's own resolution is drawn (adapt below lowers it when frames run slow)
const screen = { w: 0, h: 0, dpr: 1, zoom: 1, far: 1, user: 1, scale: 1 };
function resize() {
  // phones draw at up to 1.5 pixels per CSS pixel, to keep it smooth; slow frames draw fewer
  screen.dpr = Math.max(0.6, Math.min(window.devicePixelRatio || 1, isTouch() ? 1.5 : 2) * screen.scale);
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = Math.round(w * screen.dpr);
  canvas.height = Math.round(h * screen.dpr);
  screen.w = w;
  screen.h = h;
  // show about 15 x 9 m of the courtyard (map pixels are centimetres)
  screen.zoom = Math.max(0.5, Math.min(w / 1500, h / 900));
  world?.resize(w, h, screen.dpr);
}

// How far the wheel zooms: out to about 1.5 times the courtyard, in to nearly twice as close.
const ZOOM_MIN = 0.65, ZOOM_MAX = 1.8;
const zoomKey = "mmo.zoom.v1";
let zoomTo = 1;
try {
  const v = parseFloat(localStorage.getItem(zoomKey) ?? "");
  if (v >= ZOOM_MIN && v <= ZOOM_MAX) zoomTo = screen.user = v;
} catch {
  // a fresh zoom
}

// Smallest mip level whose cells are still at least r device pixels wide.
function mipFor(atlas: Atlas, r: number): number {
  const cell = atlas.levels[0].width / atlas.cols;
  let level = 0;
  while (level + 1 < atlas.levels.length && cell / 2 ** (level + 1) >= r) level++;
  return level;
}

// An item icon: the art fitted into a square canvas (long weapons lie diagonally, like RO).
function makeIcon(img: Img, { diagonal = false } = {}): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const dpr = 2;
  c.width = c.height = ICON * dpr;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  const size = ICON * dpr * 0.86;
  if (diagonal) {
    const s = size / Math.hypot(img.width, img.height) * 1.0;
    g.translate(c.width / 2, c.height / 2);
    g.rotate(Math.PI / 4);
    g.drawImage(img, (-img.width * s) / 2, (-img.height * s) / 2, img.width * s, img.height * s);
  } else {
    const s = size / Math.max(img.width, img.height);
    g.drawImage(img, (c.width - img.width * s) / 2, (c.height - img.height * s) / 2, img.width * s, img.height * s);
  }
  g.setTransform(1, 0, 0, 1, 0, 0); // upright again for any badge drawn on top
  return c;
}

// Off-hand gear sprites, pixel art at the scale of the weapon sprites: shields, a flask, books.
function offhandSprite(art: OffhandArt): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const g = c.getContext("2d")!;
  const px = (x: number, y: number, w: number, h: number, color: string) => {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  };
  if (art === "buckler" || art === "kite") {
    const kite = art === "kite";
    c.width = kite ? 24 : 26;
    c.height = kite ? 34 : 26;
    g.beginPath();
    if (kite) {
      g.moveTo(1, 2); g.lineTo(23, 2); g.lineTo(23, 16); g.lineTo(12, 33); g.lineTo(1, 16); g.closePath();
    } else g.arc(13, 13, 12.5, 0, Math.PI * 2);
    g.fillStyle = "#1c2416";
    g.fill();
    g.save();
    g.clip();
    px(0, 0, c.width, c.height, kite ? "#c9d3dd" : "#8a5a32");
    if (kite) {
      px(10, 2, 4, 30, "#2f5fb8");
      px(2, 10, 20, 4, "#2f5fb8");
      px(0, 0, 3, c.height, "#eef3f8");
    } else {
      for (let x = 5; x < 26; x += 6) px(x, 0, 1, 26, "#6b4324");
      g.strokeStyle = "#9aa3ad";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(13, 13, 11, 0, Math.PI * 2);
      g.stroke();
      px(10, 10, 6, 6, "#c9d3dd");
    }
    g.restore();
  } else if (art === "flask") {
    c.width = 18;
    c.height = 24;
    px(7, 0, 4, 3, "#a8763f");
    px(6, 3, 6, 5, "#dfe9f2");
    g.beginPath();
    g.arc(9, 15, 8, 0, Math.PI * 2);
    g.fillStyle = "#dfe9f2";
    g.fill();
    g.save();
    g.clip();
    px(0, 14, 18, 10, "#59e07a");
    g.restore();
    px(4, 11, 2, 3, "#ffffff");
  } else {
    const grim = art === "grimoire";
    c.width = 22;
    c.height = 26;
    px(1, 1, 20, 24, "#1c2416");
    px(2, 2, 18, 22, grim ? "#5b2f8a" : "#8a5a32");
    px(18, 3, 2, 20, "#f0e3c6");
    for (const [x, y] of [[2, 2], [16, 2], [2, 20], [16, 20]]) px(x, y, 4, 4, "#e0b84a");
    if (grim) px(8, 9, 6, 7, "#7ff0ff");
    else px(7, 8, 8, 2, "#e0b84a");
  }
  return c;
}

// A canvas of its own with the same picture (one canvas can't stand in two places).
function copyCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  c.getContext("2d")!.drawImage(src, 0, 0);
  return c;
}

// A small plate with a word on it ("II"), in the bottom right corner of an icon `size` wide.
function itemBadge(g: CanvasRenderingContext2D, text: string, size: number): void {
  const h = Math.round(size * 0.36);
  g.save();
  g.font = `900 ${Math.round(h * 0.72)}px serif`;
  const w = Math.round(Math.max(h * 1.25, g.measureText(text).width + h * 0.5)), x = size - w - 2, y = size - h - 2;
  g.fillStyle = "#2a1a08";
  g.strokeStyle = "#ffd36b";
  g.lineWidth = 3;
  g.beginPath();
  g.roundRect(x, y, w, h, 6);
  g.fill();
  g.stroke();
  g.fillStyle = "#ffe9a8";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, x + w / 2, y + h / 2 + 1);
  g.restore();
}

// A refined item's "+N" in the top left corner.
function itemPlus(g: CanvasRenderingContext2D, plus: number, size: number): void {
  g.save();
  g.font = `900 ${Math.round(size * 0.3)}px sans-serif`;
  g.textBaseline = "top";
  g.lineWidth = 4;
  g.strokeStyle = "#1a0f08";
  g.strokeText(`+${plus}`, 4, 3);
  g.fillStyle = plus >= 7 ? "#ff9a6a" : "#9fe7ff";
  g.fillText(`+${plus}`, 4, 3);
  g.restore();
}

// A round flask of coloured liquid with a cork; big ones are wider.
function potionIcon(color: string, big: boolean): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = ICON * 2;
  const g = c.getContext("2d")!;
  const cx = c.width / 2, r = big ? 26 : 21, cy = 50;
  g.lineWidth = 4;
  g.strokeStyle = "#1c2416";
  // neck and cork
  g.fillStyle = "#dfe9f2";
  g.fillRect(cx - 8, cy - r - 16, 16, 18);
  g.strokeRect(cx - 8, cy - r - 16, 16, 18);
  g.fillStyle = "#a8763f";
  g.fillRect(cx - 9, cy - r - 24, 18, 10);
  g.strokeRect(cx - 9, cy - r - 24, 18, 10);
  // body: glass, then the liquid with a highlight
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fillStyle = "rgba(225, 240, 250, 0.9)";
  g.fill();
  g.save();
  g.clip();
  g.fillStyle = color;
  g.fillRect(cx - r, cy - r * 0.35, r * 2, r * 2);
  g.fillStyle = "rgba(255, 255, 255, 0.35)";
  g.fillRect(cx - r, cy - r * 0.35, r * 2, 4);
  g.restore();
  g.stroke();
  g.fillStyle = "rgba(255, 255, 255, 0.75)";
  g.beginPath();
  g.ellipse(cx - r * 0.45, cy - r * 0.45, r * 0.18, r * 0.3, -0.5, 0, Math.PI * 2);
  g.fill();
  return c;
}

// One cell of a sheet cropped to its opaque pixels.
function trimmed(sheet: Img, row: number, cell = 96): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = cell;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(sheet, 0, row * cell, cell, cell, 0, 0, cell, cell);
  const px = g.getImageData(0, 0, cell, cell).data;
  let x0 = cell, y0 = cell, x1 = 0, y1 = 0;
  for (let i = 3; i < px.length; i += 4) {
    if (!px[i]) continue;
    const p = (i - 3) / 4, x = p % cell, y = Math.floor(p / cell);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  if (x1 < x0) return c;
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext("2d")!.drawImage(c, -x0, -y0);
  return out;
}

async function boot(): Promise<void> {
  const bar = document.getElementById("loading-bar") as HTMLProgressElement;
  const files: Record<string, string> = {
    flowers: "assets/flower_atlas.png",
    petals: "assets/petal_atlas.png",
    rune: "assets/rune_circle.png",
    ring: "assets/ring_glow.png",
    icon: "assets/icon_flower.png",
    slime_idle: "assets/slime_idle.png",
    slime_hop: "assets/slime_hop.png",
    slime_hurt: "assets/slime_hurt.png",
    slime_die: "assets/slime_die.png",
    jelly: "assets/items/jelly.png",
    sprout: "assets/items/sprout.png",
    arrow: "assets/items/arrow.png",
    merchant: "assets/npc/merchant_idle.png",
  };
  const weaponIds = Object.keys(WEAPON_TYPES) as WeaponId[];
  const weaponArt = new Set(weaponIds.map((t) => WEAPON_ART[t].art ?? t));
  for (const id of weaponArt) files[`weapon_${id}`] = `assets/weapons/${id}.png`;
  const [images, bodies, hair] = await Promise.all([
    loadAll(files, (f) => (bar.value = f)),
    fetch("assets/chars/bodies.json").then((r) => r.json() as Promise<Record<string, BodyDef>>),
    fetch("assets/chars/hair.json").then((r) => r.json() as Promise<HairData>),
    loadSkillArt(),
  ]);

  // tinted glows and rings for skill effects, made on first use
  const tinted = new Map<string, Img>();
  const hexRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ");
  const tex: Textures = {
    rune: images.rune,
    ring: tint(images.ring, "#c4f8dc"),
    mint: glow("rgba(140, 255, 190, 1)"),
    column: glow("rgba(190, 255, 215, 1)"),
    sparkle: glow("rgba(205, 255, 222, 1)"),
    flash: glow("rgba(236, 255, 240, 1)"),
    dissolve: glow("rgba(205, 218, 255, 1)"),
    flowers: bakeGround(images.flowers, 3, 3, 128, 8, 2),
    flowerTop: { levels: [images.flowers], cols: 3, rows: 3 },
    petals: { levels: mipChain(images.petals, 2), cols: 2, rows: 2 },
    ember: glow("rgba(255, 140, 70, 1)"),
    glowFor(color) {
      let t = tinted.get(`g${color}`);
      if (!t) tinted.set(`g${color}`, (t = glow(`rgba(${hexRgb(color)}, 1)`)));
      return t;
    },
    ringFor(color) {
      let t = tinted.get(`r${color}`);
      if (!t) tinted.set(`r${color}`, (t = tint(images.ring, color)));
      return t;
    },
  };

  // ---- the 3D courtyard (src/world3d), lighter on phones ----
  detectTouch();
  const quality = isTouch() ? { flowers: 0.6, shadow: 1024, light: true } : { flowers: 1, shadow: 4096 };
  world = new World3D(worldCanvas, quality);
  const w3d = world;

  // ---- title screen: which character to play ----
  const looks = new Looks({ bodies, hair });
  document.getElementById("loading")?.classList.add("done");
  const charId = await new Title(looks).run();
  await loading("กำลังเตรียมตัวละคร…", 0.1);
  useCharacter(charId);
  const entry = loadRoster().chars.find((c) => c.id === charId);

  // ---- inventory, character, looks, icons ----
  const inv = new Inventory();
  const progress = new Progress();
  const GEAR_DROPS = Object.keys(ITEMS).filter((i) => ["hat", "shoes", "ring", "trinket"].includes(ITEMS[i].kind) && !ITEMS[i].tier);
  // what adds stats besides the hands: the clothes (tier armour has some) and the gear slots
  const hero = new Hero(progress, () => inv.equipped.weapon, () => inv.equipped.offhand, () => [inv.equipped.top, inv.equipped.bottom, ...GEAR_SLOTS.map((g) => inv.equipped[g])]);
  // the bag's size follows the slots the skills give (the wandering merchant's book)
  const fitBag = () => inv.resize(BAG_BASE + hero.stats.bagSlots);
  fitBag();
  const look = loadLook(looks.hairstyles);
  // What the player shows: the weapons in hand and the job's outfit (src/outfits.ts); the
  // armour worn only adds stats. Rebuild the sheets when the look, the hands or the job change;
  // a newer change wins over one still loading.
  const wear = () => dressed(inv.equipped, look.gender as Gender, progress);
  let currentLook = looks.key(look, wear()), lookSeq = 0;
  const first = await looks.build(look, wear());
  const applyLook = async () => {
    const key = looks.key(look, wear());
    if (key === currentLook) return;
    currentLook = key;
    const seq = ++lookSeq;
    const built = await looks.build(look, wear());
    if (seq === lookSeq) player.setSheets(built.sheets, built.hands, built.builtin);
  };

  const weapons = {} as Record<WeaponId, { img: Img; art: WeaponArt }>;
  for (const t of weaponIds) {
    const art = WEAPON_ART[t];
    weapons[t] = { img: images[`weapon_${art.art ?? t}`], art };
  }
  // off-hand gear held like a weapon: upright in the left hand
  const offhandArt = Object.fromEntries((["buckler", "kite", "flask", "tome", "grimoire"] as OffhandArt[])
    .map((a) => [a, { img: offhandSprite(a), art: { grip: 0.5, upright: true, scale: 1.4 } as WeaponArt }])) as Record<OffhandArt, { img: Img; art: WeaponArt }>;
  const icons = new Map<string, Img>();
  const iconFor = (id: string): Img => {
    const known = icons.get(id);
    if (known) return known;
    const item = ITEMS[id];
    let c: HTMLCanvasElement;
    if (item.kind === "weapon") {
      const w = weapons[item.weapon!];
      c = makeIcon(w.img, { diagonal: w.img.height > w.img.width * 1.6 });
      if (w.art.pair) {
        // two daggers crossed
        const g = c.getContext("2d")!;
        g.save();
        g.translate(c.width, 0);
        g.scale(-1, 1);
        g.drawImage(makeIcon(w.img, { diagonal: true }), 0, 0);
        g.restore();
      }
    } else if (item.kind === "top" || item.kind === "bottom") {
      // the garment on its own (src/garments.ts), at a whole-pixel scale, as this build wears it
      const worn = garmentLook(item, look.gender as Gender);
      const art = garmentIcon(item.kind, worn.shape!, worn.dye);
      c = document.createElement("canvas");
      c.width = c.height = ICON * 2;
      if (art) {
        const t = trimmed(art, 0, art.width);
        const s = Math.floor((c.width * 0.92) / Math.max(t.width, t.height));
        const g = c.getContext("2d")!;
        g.imageSmoothingEnabled = false;
        g.drawImage(t, Math.round((c.width - t.width * s) / 2), Math.round((c.height - t.height * s) / 2), t.width * s, t.height * s);
      }
    } else if (item.kind === "offhand") {
      c = makeIcon(offhandArt[item.art!].img);
    } else if (item.kind === "potion" && !hasArt(id)) {
      c = potionIcon(item.icon.color ?? "#ff6a5a", id.endsWith("_big"));
    } else if (item.icon.glyph) {
      // Prefer item artwork; missing artwork falls back to a transparent, colored glyph.
      c = document.createElement("canvas");
      c.width = c.height = ICON * 2;
      const g = c.getContext("2d")!;
      const art = item.icon.art;
      const glyph = item.icon.glyph;
      const color = item.icon.color ?? "#c9a86a";
      g.drawImage(art && hasArt(art) ? skillIcon(art, glyph, color) : itemGlyph(glyph, color), 4, 4, c.width - 8, c.height - 8);
    } else c = makeIcon(images[item.icon.sheet ?? "jelly"]);
    // a badge in the bottom corner ("II": a second book), the refine on top
    const g = c.getContext("2d")!;
    if (item.icon.badge) itemBadge(g, item.icon.badge, c.width);
    if (item.refine) itemPlus(g, item.refine, c.width);
    icons.set(id, c);
    return c;
  };

  // ---- world: a new character starts in Eden, the others where they left off ----
  const placeKey = saveKey("place.v2"); // v2: Eden at TOWN_SCALE (v1 spots were full size)
  const left = readJson<{ map: MapId; x: number; y: number }>(placeKey);
  const startMap: MapId = left && left.map in MAP_NAMES ? left.map : "eden";
  await loading(`กำลังสร้าง${MAP_NAMES[startMap]}…`, 0.3);
  let current: GameMap = await loadMap(startMap, quality);
  w3d.load(current.level);
  const fx = new Particles();
  if (isTouch()) fx.max = 4000; // a phone draws fewer sparks at once
  const player = new Player(SPAWN.x, SPAWN.y, first.sheets, first.hands, glow("rgba(255, 110, 120, 1)"));
  // back on the spot, unless something now stands there
  if (left?.map === startMap && Number.isFinite(left.x) && Number.isFinite(left.y) && !blocked(left, RADIUS)) {
    player.x = left.x;
    player.y = left.y;
  }
  player.builtin = first.builtin;
  applyLook();
  // townsfolk, made once per map: the merchant's own sprite, or dressed through the wardrobe
  // (dressing: each map's sheets still loading, which the loading screen waits for)
  const folk = new Map<MapId, Npc[]>(), dressing = new Map<MapId, Promise<unknown>>();
  function townsfolk(map: GameMap): Npc[] {
    let list = folk.get(map.id);
    if (list) return list;
    const sheets: Promise<unknown>[] = [];
    // (the third jobs' masters stand in the towns by their own list, src/jobmasters.ts)
    list = [...map.npcs, ...jobMasters(map.id)].map((spec) => {
      const npc = new Npc(spec);
      if (spec.sprite === "merchant") npc.sheet = images.merchant;
      else if (spec.look) {
        const { top, bottom, ...l } = spec.look;
        sheets.push(looks.build(l, { ...NO_GEAR, top, bottom }, ["idle"]).then((b) => (npc.sheet = b.sheets.idle)).catch(console.error));
      }
      return npc;
    });
    folk.set(map.id, list);
    dressing.set(map.id, Promise.all(sheets));
    return list;
  }
  let npcs = townsfolk(current);
  const motes = new Motes(fx, glow("rgba(232, 255, 112, 1)"));
  motes.update(0, { x: player.x, y: player.y });
  motes.prewarm();
  const spells: Spell[] = [];
  const floaters = new Floaters();
  // the people among the monsters are dressed like townsfolk, their weapon in hand
  const dress = async (d: MonsterDef): Promise<Person | null> => {
    const p = PEOPLE[d.id];
    if (!p) return null;
    const { top, bottom, ...l } = p.look;
    const built = await looks.build(l, { ...NO_GEAR, weapon: p.weapon, top, bottom }, ["idle", "walk", p.motion]);
    return { sheets: built.sheets, hands: built.hands, builtin: built.builtin, weapon: weapons[p.weapon] ?? null, motion: p.motion };
  };
  const monLooks = new MonsterLooks(slimeSheets({
    idle: images.slime_idle, hop: images.slime_hop, hurt: images.slime_hurt, die: images.slime_die,
  }), dress);
  // A map's monsters: towns have none; a field its own from the bestiary and its visitors from
  // other fields (and those its boss calls up), their sheets loaded first.
  async function populate(map: GameMap): Promise<Monster[]> {
    shots.length = 0;
    if (map.town) return [];
    const pool = fieldMonsters(map.id);
    const called = pool.map((d) => behaviour(d, "summon")).filter((id): id is string => !!id && !!MONSTER_BY_ID[id]).map((id) => MONSTER_BY_ID[id]);
    await monLooks.prepare([...pool, ...called]);
    return spawnMonsters(monLooks, { spots: map.spots, pool, spawn: map.spawn });
  }
  // the list stays the same array (combat, skills and the bot hold it)
  const monsters: Monster[] = await populate(current);
  hero.setTerrain(terrainOf(current.id));
  // what they drop lies on the ground until it is picked up (src/loot.ts)
  const ground = new Ground();
  // quests (src/quests.ts): the bag, the level, and the rewards paid here
  const quests = new Quests({
    count: (id) => inv.count(id),
    take: (id, n) => {
      if (n > 0) inv.take(id, n);
    },
    give: (id, n) => {
      const left = inv.add(id, n);
      for (let i = 0; i < left; i++) ground.drop(id, player); // a full bag: at the feet
    },
    level: () => progress.level,
    jobBlock: (job) => progress.jobBlock(job),
    takeJob(job, branch) {
      if (!progress.takeJob(job, branch)) return false;
      // the new job: its name over the player, its branch's tree in the skill window
      floaters.add(player.x, player.y, 200, `เปลี่ยนอาชีพเป็น${JOBS[job].name}!`, "level");
      floaters.add(player.x, player.y, 185, `${TREES[branch].name} · แต้มสกิล +${JOB_POINTS}`, "level");
      hero.recompute();
      void applyLook(); // the new job's outfit
      skills.sparkleUp(player.x, player.y, tex.glowFor("#ffe27a"), 60);
      skills.ring(player.x, player.y, "#ffe27a", 260, 0.9);
      return true;
    },
    job3Block: (job) => progress.job3Block(job),
    takeJob3(job, branch) {
      if (!progress.takeJob3(job, branch)) return false;
      floaters.add(player.x, player.y, 200, `เปลี่ยนอาชีพเป็น${JOBS3[job].name}!`, "level");
      floaters.add(player.x, player.y, 185, `${TREES[branch].name} · แต้มสกิล +${JOB_POINTS}`, "level");
      hero.recompute();
      void applyLook();
      skills.sparkleUp(player.x, player.y, tex.glowFor("#ffe27a"), 80);
      skills.ring(player.x, player.y, "#ffe27a", 320, 1);
      return true;
    },
    job4Block: (job) => progress.job4Block(job),
    takeJob4(job, branch) {
      if (!progress.takeJob4(job, branch)) return false;
      floaters.add(player.x, player.y, 200, `เปลี่ยนอาชีพเป็น${JOBS4[job].name}!`, "level");
      floaters.add(player.x, player.y, 185, `${TREES[branch].name} · แต้มสกิล +${JOB_POINTS}`, "level");
      hero.recompute();
      void applyLook();
      skills.sparkleUp(player.x, player.y, tex.glowFor("#ffe27a"), 100);
      skills.ring(player.x, player.y, "#ffe27a", 380, 1.1);
      return true;
    },
    pastLimit: () => progress.limit,
    reward(r, q) {
      sound.play("quest-complete", q.id.length);
      floaters.add(player.x, player.y, 175, `สำเร็จเควส: ${q.name}`, "level");
      if (r.gold) {
        inv.gold += r.gold;
        sound.play("coin", r.gold);
        floaters.add(player.x, player.y, 150, `+${r.gold.toLocaleString()} ทอง`, "loot");
      }
      for (const [id, n] of r.items ?? []) {
        const left = inv.add(id, n);
        for (let i = 0; i < left; i++) ground.drop(id, player);
      }
      inv.changed();
      if (r.points) {
        progress.bonus += r.points;
        floaters.add(player.x, player.y, 130, `แต้มสกิล +${r.points}`, "level");
      }
      if (r.xp) {
        floaters.add(player.x, player.y, 112, `+${r.xp.toLocaleString()} EXP`, "info");
        const gained = progress.addXp(r.xp);
        if (gained > 0) levelUp(gained);
        else progress.changed();
      } else if (r.points) progress.changed();
      // the king's quest: past the limit, at level 100 at once (said over the quest's line)
      if (r.limit && progress.breakLimit()) levelUp(1, "ทลายขีดจำกัด!", 260);
      skills.sparkleUp(player.x, player.y, tex.glowFor("#ffe27a"), 30);
      noteClock = 1.6; // the reward's lines first
    },
    note: (text) => questNotes.push(text),
  });
  // quest lines over the player one at a time (several can come at once: a step handed in, the
  // next one, a level)
  const questNotes: string[] = [];
  let noteClock = 0;
  const combat = new Combat({
    fx, tex, floaters, monsters, hero,
    onReflect(_m, dmg) {
      const r = hero.takeDamage(dmg);
      if (r.lost) {
        floaters.add(player.x, player.y, 110, `-${Math.round(r.lost)}`, "hurt");
        sound.playHit({ kind: "enemy", theme: "", weapon: "" });
      }
      if (r.died) {
        sound.play("player-death");
        player.target = player.attack = null;
      }
    },
    onKill(m) {
      pixelFx(fx, "death", m.x, m.y, 0, Math.max(260, m.radius * 6)); // a puff where it fell (pixelfx)
      const gold = Math.round((1.5 + Math.random() * 2) * m.level * (1 + hero.stats.drop + hero.stats.goldPct + hero.stats.luck / 200)) + 1;
      // gold and experience go straight in, with no words over the body; loot falls round it
      inv.gold += gold;
      sound.play("coin", gold);
      for (const id of rollDrops(m.variant, hero.stats.drop + hero.stats.luck / 200)) ground.drop(rolledDrop(id, m.level), m);
      // what the quests count, and what they want dropped
      const kind = m.entry?.id ?? m.variant.id;
      quests.onKill(kind, m.variant.name);
      for (const [id, chance] of quests.drops(kind)) if (Math.random() < chance) ground.drop(id, m);
      // a field monster very seldom leaves a book the player can still learn (a second book only
      // from level TIER2_DROP_LEVEL up) and now and then a hat, shoes, a ring or a trinket; a rare
      // one more often, a boss a book one time in four (hairstyles don't drop)
      if (m.entry) {
        const k = m.entry.kind, more = 1 + hero.stats.drop + hero.stats.luck / 200;
        const roll = (chance: number, pool: string[]) => {
          if (pool.length && Math.random() < chance * more) ground.drop(pool[Math.floor(Math.random() * pool.length)], m);
        };
        const lying = new Set(ground.items.map((l) => l.id));
        const tier2 = (b: string) => BOOKS[b].kind === "mastery2" || BOOKS[b].kind === "element2";
        roll(k === "boss" ? BOOK_CHANCE.boss : k === "rare" ? BOOK_CHANCE.rare : BOOK_CHANCE.normal, Object.keys(BOOKS).filter((b) => progress.canRead(b) && !inv.has(b) && !lying.has(b) && (!tier2(b) || m.level >= TIER2_DROP_LEVEL)));
        roll(k === "boss" ? 0.6 : k === "rare" ? 0.25 : 0.012, GEAR_DROPS);
        // gear of the tier the monster's level falls in (drops.ts): half the time the weapon the
        // player holds (or their class's, holding none), else any piece alike
        const tier = gearTierAt(m.level);
        if (tier && Math.random() < TIER_DROP[k] * more) {
          const own = weaponType(inv.equipped.weapon) ?? (progress.cls ? CLASSES[progress.cls].weapon : null);
          const pool = tierPool(tier);
          ground.drop(own && own in WEAPON_TYPES && Math.random() < 0.5 ? tierId(tier, own) : pool[Math.floor(Math.random() * pool.length)], m);
        }
      }
      // experience shrinks for monsters far below the player's level
      const gap = progress.level - m.level;
      const xp = Math.max(1, Math.round(m.variant.xp * Math.max(0.1, Math.min(1, 1 - (gap - 5) * 0.1)) * (1 + hero.stats.xpPct)));
      bot.noteKill(xp, gold);
      inv.changed();
      const gained = progress.addXp(xp);
      if (gained > 0) levelUp(gained);
    },
  });
  // the merchant's stall (src/stall.ts): townsfolk buy from it while she stands in town
  const stall = new Stall({
    inv, floaters, at: () => player, stats: () => hero.stats, drop: (id, n) => { for (let i = 0; i < n; i++) ground.drop(id, player); },
    why: () => (!hero.alive ? "ล้มอยู่" : TOWNS.includes(current.id as TownId) ? null : "เปิดร้านได้ในเมืองเท่านั้น"),
  }, new Townsfolk());
  const stallUI = new StallUI(stall, inv, iconFor, entry?.name ?? "");
  // the player's allies: summons and the decoy (src/allies.ts)
  const allies = new Allies({ hero, player, monsters, combat, fx, tex, floaters, weapon: () => weaponStats(inv.equipped.weapon, hero.stats) });
  const skills = new Skills({
    progress, hero, player, combat, monsters, fx, tex, floaters, spells, allies, weapon: () => weaponType(inv.equipped.weapon),
    // the thief's stealing blows: gold by the monster's level, or one of its drops (by their chances)
    steal(m, what) {
      if (what === "gold") {
        const got = Math.round(m.level * (4 + Math.random() * 4) * (1 + hero.stats.goldPct));
        inv.gold += got;
        sound.play("coin", got);
        inv.changed();
        floaters.add(m.x, m.y, m.height + 70, `ขโมย +${got} ทอง`, "level");
        return;
      }
      const list = m.variant.drops, total = list.reduce((t, [, c]) => t + c, 0);
      let pick = Math.random() * total;
      const got = list.find(([, c]) => (pick -= c) <= 0)?.[0];
      if (!got) return void floaters.add(m.x, m.y, m.height + 70, "ไม่มีอะไรให้ขโมย", "info");
      ground.drop(got, m);
      floaters.add(m.x, m.y, m.height + 70, `ขโมย ${ITEMS[got].name}`, "level");
    },
    // a craft's skill: the workshop on the spot, free of fees
    workshop: (b) => workshopUI.show({ craft: b.craft as Craft | "brewing", tab: b.tab }),
    // the merchant's: gold her skills pay, how full her bag is, her stall's window
    purse: {
      gold: () => inv.gold,
      pay: (n) => {
        inv.gold = Math.max(0, inv.gold - n);
        inv.changed();
      },
      fill: () => inv.slots.filter((x) => x).length / inv.slots.length,
    },
    stall(dry) {
      if (dry) return stall.open ? null : stall.deps.why();
      stallUI.toggle(true);
      return null;
    },
    // a make skill (poison vials): the materials out of the bag, what it makes in
    make(mk, rank, dry) {
      const short = mk.from.filter(([id, n]) => inv.count(id) < n);
      if (short.length) return `วัตถุดิบไม่พอ: ${short.map(([id, n]) => `${ITEMS[id].name} ${inv.count(id)}/${n}`).join(", ")}`;
      if (dry) return null;
      for (const [id, n] of mk.from) inv.take(id, n);
      const n = Math.max(1, Math.round(mk.count(rank)));
      const left = inv.add(mk.item, n);
      for (let i = 0; i < left; i++) ground.drop(mk.item, player);
      inv.changed();
      return `ได้${ITEMS[mk.item].name} ×${n}`;
    },
  });
  // an enchanted weapon's element riders, the falcon and the autocasts after a normal hit
  combat.onElement = (m, el, dmg) => skills.elementHit(m, el, dmg, 1);
  combat.onFalcon = (m) => skills.falconStrike(m);
  combat.onHeal = (got) => floaters.add(player.x, player.y, 130, `+${Math.round(got)}`, "heal");
  void loadPixelFx(); // the pixel art effects (assets/fx): they play as soon as their sheets are in
  combat.onBasicHit = (m) => skills.autocast(m);
  // In a form (a druid's) she is the form skill's look and her normal attack is its formAttack:
  // the form she is in, and what she swings.
  const formSkill = () => (hero.form ? ACTIVES[hero.form.id]?.skill : undefined);
  const swingWeapon = () => {
    const fa = formSkill()?.formAttack;
    return fa ? formWeapon(fa, hero.stats) : weaponStats(inv.equipped.weapon, hero.stats);
  };
  let formWas: string | null = null;

  // `gained` levels up to the one now, said `z` over the player: the points they gave show under
  // it when past the limit they gave more than one a level (11 at 100, 3 at 105, 110 ...)
  function levelUp(gained: number, title = "LEVEL UP!", z = 150) {
    sound.play("level-up", progress.level);
    hero.refill();
    floaters.add(player.x, player.y, z, `${title} Lv ${progress.level}`, "level");
    let points = 0;
    for (let lv = progress.level - gained + 1; lv <= progress.level; lv++) points += levelPoints(lv);
    if (points > gained) floaters.add(player.x, player.y, z - 45, `แต้มสกิล +${points}`, "level");
    skills.ring(player.x, player.y, "#ffe27a", 260, 0.8);
    skills.sparkleUp(player.x, player.y, tex.flash, 40);
  }

  // ---- skill bar ----
  const hud = new SkillBar(document.getElementById("skillbar")!, useSlot, (i) => progress.clearSlot(i), (i, j) => progress.swapSlots(i, j));
  function refreshBar() {
    progress.hotbar.forEach((id, i) => {
      // an item's shortcut: its icon and how many the bag holds (dimmed at none, RO-style)
      const item = slotItem(id);
      if (item) {
        const n = inv.count(item);
        return hud.set(i, { id: id!, name: ITEMS[item].name, icon: iconFor(item), tip: itemTip(item), missing: !n, count: n });
      }
      const a = id && ACTIVES[id];
      if (!a) return hud.set(i, null);
      const rank = progress.skillRank(id);
      // greyed out until learned, or while the hands don't hold what it needs
      hud.set(i, { id, name: a.name, icon: skillIcon(id, a.glyph, a.color), tip: skillTip(id, rank), missing: !rank || !skills.wields(id) });
    });
  }
  inv.onChange(refreshBar);
  let rosterLine = `${progress.level}|${progress.cls}|${progress.job}`;
  progress.onChange(() => {
    refreshBar();
    hero.recompute();
    fitBag();
    // keep the title screen's line for this character up to date
    const line = `${progress.level}|${progress.cls}|${progress.job}`;
    if (line !== rosterLine && progress.cls) {
      rosterLine = line;
      touchCharacter({ level: progress.level, cls: progress.cls });
    }
  });
  refreshBar();

  // ---- auto-hunt bot ----
  const bot = new Bot({
    player, hero, progress, skills, monsters, inv,
    weapon: swingWeapon,
    weaponId: () => inv.equipped.weapon,
    onSkill(id) {
      const i = progress.hotbar.indexOf(id);
      if (i >= 0) hud.pulse(i, "flash");
    },
    say: (text) => floaters.add(player.x, player.y, 150, text, "info"),
    loot: ground.items,
    drink,
    potions: (kind) => inv.slots.reduce((n, s) => n + (s && ITEMS[s.id].restore?.[kind] ? s.count : 0), 0),
  });

  // Drink a potion from bag slot i; null when it went down, else why not.
  // (no cooldown: one sip after another)
  function drinkAt(i: number): string | null {
    const stack = inv.slots[i];
    const item = stack && ITEMS[stack.id];
    if (!item?.restore) return "ดื่มไม่ได้";
    if (!hero.alive) return "ล้มอยู่";
    const r = item.restore;
    if ((!r.hp || hero.hp >= hero.stats.maxHp) && (!r.mp || hero.mp >= hero.stats.maxMp)) return "เต็มอยู่แล้ว";
    sound.play(r.hp ? "potion-hp" : "potion-mp", i);
    const boost = 1 + hero.stats.potion; // the alchemy flask
    if (r.hp) floaters.add(player.x, player.y, 130, `+${Math.round(hero.heal(r.hp * boost))}`, "heal");
    if (r.mp) {
      const before = hero.mp;
      hero.mp = Math.min(hero.stats.maxMp, hero.mp + r.mp * boost);
      floaters.add(player.x, player.y, 150, `+${Math.round(hero.mp - before)} MP`, "magic");
    }
    skills.sparkleUp(player.x, player.y, r.hp ? tex.glowFor("#ff8a7a") : tex.glowFor("#8cc8ff"), 14);
    inv.discard(i, 1);
    return null;
  }
  // The bot's sip: the smallest potion of that kind that still covers what's missing.
  function drink(kind: "hp" | "mp"): boolean {
    const missing = (kind === "hp" ? hero.stats.maxHp - hero.hp : hero.stats.maxMp - hero.mp) / (1 + hero.stats.potion);
    const options = inv.slots.map((s, i) => [s, i] as const).filter(([s]) => s && ITEMS[s.id].restore?.[kind])
      .sort((a, b) => ITEMS[a[0]!.id].restore![kind]! - ITEMS[b[0]!.id].restore![kind]!);
    const pick = options.find(([s]) => ITEMS[s!.id].restore![kind]! >= missing * 0.8) ?? options[options.length - 1];
    return !!pick && drinkAt(pick[1]) === null;
  }

  // Use what is in bag slot i (a double-click or the item menu in the bag, or the item's shortcut
  // on the bar); returns what to say. Anything but a potion gets her up from a rest.
  function useBagSlot(i: number): string {
    const stack = inv.slots[i];
    if (!stack) return "";
    // a poison vial: the weapon is coated (an enchant: the poison element, and its stats) for a while
    const coat = COATINGS[stack.id];
    if (coat) {
      if (!hero.alive) return "ล้มอยู่";
      const name = ITEMS[stack.id].name;
      hero.addBuff("coating", `เคลือบ${name}`, coat.stats, coat.time * (1 + hero.stats.buffTime), coat.element);
      skills.sparkleUp(player.x, player.y, tex.glowFor("#8fdc4a"), 18);
      stand();
      inv.discard(i, 1);
      return `เคลือบอาวุธด้วย${name}แล้ว`;
    }
    if (ITEMS[stack.id].kind === "potion") return drinkAt(i) ?? `ดื่ม${ITEMS[stack.id].name}แล้ว`;
    if (ITEMS[stack.id].kind === "style") {
      // a hairstyle: learned, and worn at once
      const id = ITEMS[stack.id].style!, styles = (look.styles ??= ["bob"]);
      if (styles.includes(id)) return "เรียนทรงผมนี้ไปแล้ว";
      styles.push(id);
      stand();
      look.hair = id;
      saveLook(look);
      void applyLook();
      stack.count -= 1;
      if (stack.count <= 0) inv.slots[i] = null;
      inv.changed();
      statusUI.render();
      return `เรียนทรงผม${HAIRSTYLES.find((h) => h.id === id)?.name ?? ""}แล้ว เปลี่ยนทรงได้ที่หน้าโปรไฟล์`;
    }
    const read = progress.readBook(stack.id);
    if (!read.ok) return read.text;
    stand();
    stack.count -= 1;
    if (stack.count <= 0) inv.slots[i] = null;
    inv.changed();
    statusUI.render();
    skillUI.render();
    return read.text;
  }
  const invUI = new InventoryUI(inv, iconFor, useBagSlot, (id) => {
    // gear of a higher level (armour fits every build: the outfit seen is the job's)
    const item = ITEMS[id];
    if (item.lv && progress.level < item.lv) return `ต้องเลเวล ${item.lv} จึงใส่ได้`;
    return null;
  });
  // a usable item dragged from the bag onto the bar: a shortcut to it there (it stays in the bag)
  invUI.onDropOut = (i, x, y) => {
    const slot = hud.slotAt(x, y), id = inv.slots[i]?.id;
    if (slot < 0 || !id) return false;
    if (!usable(id)) invUI.flash("ใส่แถบสกิลได้เฉพาะยาและตำราที่ใช้ได้");
    else progress.setSlot(slot, ITEM_PREFIX + id);
    return true;
  };

  // ---- character windows ----
  const vitals = new Vitals(document.getElementById("vitals")!, progress, hero, entry?.name ?? "");
  // the buff and ailment icons under the bars (the burn lives in the loop below)
  const buffBar = new BuffBar(document.getElementById("vitals")!, hero, iconFor, () => burning);
  // (a character from before classes were picked at its making picks one now, keeping its level)
  const picker = new ClassPicker((start) => {
    const level = progress.level, xp = progress.xp;
    progress.reset(start.cls);
    Object.assign(progress, { level, xp });
    progress.start(start.tree, start.element, start.mastery);
    hero.refill();
    void applyLook(); // the class's outfit
    const { weapon } = startGear(start);
    if (inv.equipped.weapon !== weapon) {
      if (!inv.has(weapon)) inv.add(weapon, 1, { silent: true });
      const i = inv.slots.findIndex((s) => s?.id === weapon);
      if (i >= 0) inv.equip(i);
    }
  });
  const statusUI = new ProfileUI(progress, hero, {
    name: entry?.name ?? "", inv, look, icon: iconFor,
    onLook: () => {
      saveLook(look);
      void applyLook();
    },
  });
  // settings: back to the character list (the title screen comes up on a fresh load), or out
  const settingsUI = new SettingsUI(() => {
    savePlace();
    location.reload();
  }, () => {
    savePlace();
    const bye = document.createElement("div");
    bye.className = "goodbye";
    bye.innerHTML = `<div class="goodbye-box"><h2>ออกจากเกมแล้ว</h2><p>เซฟเรียบร้อย ปิดแท็บนี้ได้เลย</p><button type="button" class="title-btn primary">กลับเข้าเกม</button></div>`;
    bye.querySelector("button")!.addEventListener("click", () => location.reload());
    document.body.append(bye);
    travelling = true; // the game stops underneath
  });
  const skillUI = new SkillUI(progress, hero, {
    weapon: () => weaponType(inv.equipped.weapon),
    weaponImg: (t) => weapons[t]?.img,
    onDropSkill: (id, x, y) => {
      const i = hud.slotAt(x, y);
      if (i >= 0) progress.setSlot(i, id);
    },
  });
  if (!progress.cls) picker.show();
  const botUI = new BotUI(bot, progress);
  const shopUI = new ShopUI(inv, iconFor, () => ({ buy: hero.stats.buyDisc, sell: hero.stats.sellBonus }), (id) => invUI.wearable(id));
  const workshopUI = new WorkshopUI(inv, progress, () => hero.stats, iconFor, entry?.name ?? "");
  const codexUI = new CodexUI(iconFor);
  const talkDialog = new TalkDialog(quests);
  const questLog = new QuestLog(quests);
  const questTracker = new QuestTracker(quests, () => questLog.toggle(true));
  inv.onChange(() => quests.onBag()); // collect steps count the bag
  // the minimap and the map window (M); each map's picture from above is taken while it loads
  // and kept
  // a guide's trip costs gold (a ship's passage doesn't)
  const mapUI = new MapUI(MAP_NAMES, goTo, (id, byShip) => {
    if (travelling) return "กำลังเดินทางอยู่"; // (and nothing is charged)
    const fee = byShip ? 0 : travelFee(current.id, id, hero.stats.fareDisc);
    if (inv.gold < fee) return `ค่าเดินทาง ${fee.toLocaleString()} ทอง ทองไม่พอ`;
    if (fee) {
      inv.gold -= fee;
      inv.changed();
      floaters.add(player.x, player.y, 140, `จ่ายค่าเดินทาง ${fee.toLocaleString()} ทอง`, "info");
    }
    void enterMap(id as MapId).then((went) => {
      // a trip that failed gives the fare back (one the page reloads to finish isn't one)
      if (went || !fee || sessionStorage.getItem(RESUME)) return;
      inv.gold += fee;
      inv.changed();
      floaters.add(player.x, player.y, 160, `คืนค่าเดินทาง ${fee.toLocaleString()} ทอง`, "info");
    });
    return null;
  });
  // where you get up after falling: a town a guide kept for you, else Eden
  const spawnKey = saveKey("respawn.v1");
  let savePoint = readJson<{ map: MapId; x: number; y: number }>(spawnKey);
  if (savePoint && !(savePoint.map in MAP_NAMES)) savePoint = null;
  const saveSpawn = (): string => {
    savePoint = { map: current.id, x: Math.round(player.x), y: Math.round(player.y) };
    try {
      localStorage.setItem(spawnKey, JSON.stringify(savePoint));
    } catch {
      // not persisted
    }
    return `บันทึกจุดเกิดที่${current.name}แล้ว ล้มเมื่อไรจะฟื้นที่นี่`;
  };
  const pictures = new Map<MapId, HTMLCanvasElement>();
  mapUI.fareCut = () => hero.stats.fareDisc;
  mapUI.setMap(current, null);
  // The rest of a map's loading: its townsfolk dressed (10 s at most), every material compiled,
  // its picture from above taken.
  async function settle(map: GameMap): Promise<void> {
    await loading("กำลังแต่งตัวชาวเมือง…", 0.55);
    await Promise.race([dressing.get(map.id), new Promise((r) => setTimeout(r, 10000))]);
    await loading("กำลังเตรียมกราฟิก…", 0.75);
    await w3d.compile();
    await loading("กำลังวาดแผนที่…", 0.9);
    if (!pictures.has(map.id)) pictures.set(map.id, w3d.snapshot(mapArea(map), isTouch() ? 1280 : 2048));
    mapUI.setMap(map, pictures.get(map.id)!);
    loadingBar.value = 1;
  }
  // walking somewhere along a path round the solids: up to someone clicked on (then talking to
  // them), or to a spot picked on the map window; `stuck` counts the seconds without moving
  let walkTo: { path: { x: number; y: number }[]; npc?: Npc; stuck: number } | null = null;
  let shopKeeper: Npc | null = null;
  let smithAt: Npc | null = null; // the smith whose workshop is open
  let talkingTo: Npc | null = null; // whom the talk window is with
  // Anyone spoken to opens the talk window: what they say, their business (buying and selling,
  // healing, travel, keeping the save point) and their quests.
  function act(npc: Npc): void {
    sound.play("talk", npc.spec.id.length);
    walkTo = null;
    const shop = (tab: "buy" | "sell") => () => {
      shopKeeper = npc;
      shopUI.keeper(npc.name, npc.spec.title, current.id);
      shopUI.show(tab);
    };
    const heal = (): string => {
      if (!hero.alive) return "ฟื้นขึ้นมาก่อนนะ แล้วค่อยมาให้รักษา";
      hero.refill();
      sound.play("heal");
      floaters.add(player.x, player.y, 140, "HP และ MP เต็มแล้ว", "heal");
      skills.sparkleUp(player.x, player.y, tex.glowFor("#ffe9a8"), 24);
      return "เรียบร้อย HP และ MP ของเจ้าเต็มแล้ว ขอให้เดินทางปลอดภัย";
    };
    const actions: Speaker["actions"] = [];
    const role = npc.spec.role;
    if (role === "shop") actions.push({ label: "ซื้อของ", run: shop("buy") }, { label: "ขายของ", run: shop("sell") });
    if (role === "heal") actions.push({ label: "รักษา (HP และ MP เต็ม)", run: heal });
    if (role === "smith") {
      const bench = (tab: "refine" | "craft") => () => {
        smithAt = npc;
        workshopUI.show({ smith: npc.name, tab });
      };
      actions.push({ label: "ตีบวก (เสียค่าจ้าง)", run: bench("refine") }, { label: "สร้างไอเทม (เสียค่าจ้าง)", run: bench("craft") });
    }
    if (role === "travel" && npc.spec.ports) actions.push({ label: "ขึ้นเรือ", run: () => mapUI.travel(npc.spec.ports) });
    if (role === "travel" && !npc.spec.ports) {
      actions.push({ label: "เซฟจุดเกิด", run: saveSpawn });
      actions.push({ label: "วาร์ป", run: () => mapUI.travel() });
    }
    talkDialog.show({ name: npc.name, title: npc.spec.title, map: current.id, npc: npc.spec.id, line: npc.nextLine(), actions });
    talkingTo = npc;
  }
  function talkTo(npc: Npc): void {
    if (npc.distance(player) <= TALK_RANGE) return act(npc);
    const away = Math.hypot(player.x - npc.x, player.y - npc.y) || 1;
    const goal = { x: npc.x + ((player.x - npc.x) / away) * 90, y: npc.y + ((player.y - npc.y) / away) * 90 };
    walkTo = { npc, path: findPath(player, goal, RADIUS) ?? [], stuck: 0 };
  }
  // A spot picked on the map: walk there (or up to someone there, and talk). Why not, or null.
  function goTo(to: { x: number; y: number }, npc?: Npc): string | null {
    if (!hero.alive) return "ล้มอยู่";
    bot.noteManual();
    player.target = null;
    if (npc) {
      talkTo(npc);
      return null;
    }
    const path = findPath(player, to, RADIUS);
    if (!path) return "ไปที่นั่นไม่ได้";
    walkTo = { path, stuck: 0 };
    return null;
  }
  const nearestNpc = (range: number): Npc | null =>
    npcs.reduce<Npc | null>((best, n) => (n.distance(player) <= range && (!best || n.distance(player) < best.distance(player)) ? n : best), null);

  // ---- going from map to map ----
  const banner = document.createElement("div");
  banner.className = "map-banner";
  document.body.append(banner);
  let bannerTimer = 0;
  // (travelling: a map change under way behind the loading screen; the game waits)
  let travelling = false;
  // (from: the map a warp leaves, whose gate in the new map is where she arrives). False when it
  // didn't go.
  async function enterMap(id: MapId, at?: { x: number; y: number }, from?: string): Promise<boolean> {
    if (travelling) return false;
    travelling = true;
    await loading(`กำลังเดินทางไป${MAP_NAMES[id]}…`, 0.25);
    try {
      current = await loadMap(id, quality);
    } catch (err) {
      console.error(err);
      // a newer version went up while this page was open: its maps' files are gone. Come back
      // on the new version, as this character, and finish the trip there.
      if (staleBuild(err)) {
        savePlace();
        try {
          sessionStorage.setItem(RESUME, JSON.stringify({ id: charId, map: id, at: at ?? null, from: from ?? null }));
        } catch {
          // no session storage: the title screen will do
        }
        floaters.add(player.x, player.y, 140, "เกมมีเวอร์ชันใหม่ กำลังโหลดใหม่…", "info");
        window.setTimeout(() => location.reload(), 600);
        return false;
      }
      // a town that fails to build: stay where you are
      loadMap(current.id, quality).catch(console.error); // its solids current again
      loaded();
      travelling = false;
      floaters.add(player.x, player.y, 140, `เดินทางไป${MAP_NAMES[id]}ไม่สำเร็จ`, "info");
      return false;
    }
    w3d.load(current.level);
    stand();
    monsters.length = 0;
    monsters.push(...(await populate(current)));
    ground.clear();
    skills.interrupt(null);
    // allies, clouds and traps stay behind; the ground underfoot is another kind
    allies.clear();
    skills.leaveMap();
    hero.setTerrain(terrainOf(current.id));
    npcs = townsfolk(current);
    const there = (from && current.gates[from]) || at || current.spawn;
    player.x = there.x;
    player.y = there.y;
    player.target = null;
    player.attack = null;
    walkTo = null;
    shopUI.toggle(false);
    stall.close();
    if (bot.on) bot.anchor = { x: player.x, y: player.y };
    cam.x = mapX(player.x, player.y);
    cam.y = mapY(player.x, player.y) - 50;
    await settle(current);
    loaded();
    travelling = false;
    sound.play("travel", current.id.length);
    quests.onEnter(current.id);
    guideStep(); // a quest guide under way goes on from here
    savePlace(); // the new map at once, in case the page closes right away
    banner.textContent = current.name;
    banner.classList.add("show");
    clearTimeout(bannerTimer);
    bannerTimer = window.setTimeout(() => banner.classList.remove("show"), 2600);
    return true;
  }
  let closedSaid = 0;
  inv.onChange(() => {
    applyLook();
    hero.recompute();
  });

  // ---- the quest guide: walking to where a quest's step leads, map after map ----
  // (guideWalk: the walk the guide set going; any other walk, a key or a click, ends the guide)
  let guide: Dest | null = null;
  let guideWalk: { path: { x: number; y: number }[]; stuck: number } | null = null;
  function startGuide(q: QuestDef): void {
    const d = questDest(quests, q);
    if (!d) return void floaters.add(player.x, player.y, 160, "เควสนี้ไม่มีที่ให้เดินไป", "info");
    if (!hero.alive) return;
    bot.noteManual();
    player.target = null;
    guide = d;
    guideStep();
  }
  // The next leg: up to whoever it is in this map, or out by the way that leads on (or to the
  // ship's captain where only a ship goes there).
  function guideStep(): void {
    const d = guide;
    if (!d || travelling) return;
    const say = (text: string) => floaters.add(player.x, player.y, 160, text, "info");
    guide = null;
    if (current.id === d.map) {
      if (!d.npc) return say(`ถึง${d.name}แล้ว`);
      const n = npcs.find((x) => x.spec.id === d.npc);
      if (!n) return say(`ไม่เห็น${d.name}ในแผนที่นี้`);
      return talkTo(n);
    }
    const hop = nextHop(current.id, d.map);
    if (!hop) return say(`เดินไปหา${d.name}ไม่ได้ ให้ผู้นำทางวาร์ปไปแทน`);
    if ("ship" in hop) {
      const n = npcs.find((x) => x.spec.id === hop.ship);
      say(`ไป${MAP_NAMES[d.map]}ต้องนั่งเรือ`);
      return void (n && talkTo(n));
    }
    const w = current.warps.find((x) => x.to === hop.walk);
    const path = w && findPath(player, w, RADIUS);
    if (!path) return say(`หาทางออกไป${MAP_NAMES[hop.walk]}ไม่เจอ`);
    walkTo = guideWalk = { path, stuck: 0 };
    guide = d;
    say(`นำทางไป${d.name} · ผ่าน${MAP_NAMES[hop.walk]}`);
  }
  talkDialog.onGuide = questLog.onGuide = questTracker.onGuide = startGuide;
  questTracker.render();

  // The ground point under the mouse, or null without a mouse.
  function aimPoint(): { x: number; y: number } | null {
    if (!pointer || !view) return null;
    const p = toMap(pointer);
    return groundAt(p.x, p.y);
  }

  let denyText = 0;
  // The monster nearest the player within `range` cm (edge to edge), or null.
  function nearestMonster(range: number): Monster | null {
    let best: Monster | null = null, bestD = range;
    for (const m of monsters) {
      if (!m.alive) continue;
      const d = Math.hypot(m.x - player.x, m.y - player.y) - m.radius;
      if (d < bestD) {
        best = m;
        bestD = d;
      }
    }
    return best;
  }

  // A skill went off (why: null) or didn't, on the bar's slot i.
  function report(i: number, id: string | null, why: string | null): void {
    if (why) {
      sound.play("ui-error", i);
      hud.pulse(i, "denied");
      if (id && performance.now() - denyText > 600) {
        denyText = performance.now();
        floaters.add(player.x, player.y, 150, why, "info");
      }
      return;
    }
    walkTo = null; // a skill stops a walk (a cast would end at the next step)
    hud.pulse(i, "flash");
  }

  // With a mouse, a skill is aimed before it goes (src/aim.ts has the kinds and their shapes):
  // its key or its slot picks it up, the cursor turns to a crosshair, and a click (or its key
  // again) lets it go at the monster, the spot or the way picked; a right click, Escape, another
  // skill, falling, a new map or a talk lets it go for nothing. A single-target skill clicked on
  // a monster out of its reach walks up to it first (chase). Heals, buffs and the like go at
  // once, and so does everything on a phone. An invoke (and a mimic's copy) is aimed as what it
  // would cast now.
  const castSkill = (id: string) => (skills.copy?.id === id ? skills.copySkill(skills.copy) : skills.spellFor(id)?.s ?? ACTIVES[id].skill);
  let aim: { slot: number; id: string; kind: AimKind; map: string } | null = null;
  // (clock: s to the next path; left: s before she gives up; best: the closest she has got, cm
  // from its edge; still: s since she last got closer)
  let chase: { slot: number; id: string; m: Monster; clock: number; left: number; best: number; still: number } | null = null;
  let rightDown: { x: number; y: number } | null = null; // where a right click went down while aiming
  let cursorWas = "";
  const CHASE_TIME = 7;    // s a walk up to cast may take at most
  const CHASE_STALL = 1.5; // s without getting closer before it is given up
  function stopAiming(): void {
    aim = null;
    rightDown = null;
    hud.setAiming(-1);
    w3d.setAim(null);
    w3d.setRange(null);
    w3d.setHover(null);
    w3d.setShape(null);
    setCursor("");
  }
  function setCursor(cls: string): void {
    if (cls === cursorWas) return;
    cursorWas = cls;
    canvas.classList.remove("aim-target", "aim-area", "aim-lock", "aim-far");
    if (cls) canvas.classList.add(...cls.split(" "));
  }
  // The monster under the mouse: the one drawn there, else one standing by the ground point.
  function monsterAtPointer(): Monster | null {
    if (!pointer || !view) return null;
    const { x, y } = toMap(pointer), at = groundAt(x, y);
    return monsters.find((m) => m.alive && m.contains(x, y))
      ?? monsters.find((m) => m.alive && Math.hypot(m.x - at.x, m.y - at.y) - m.radius < 30) ?? null;
  }
  const inReach = (id: string, m: Monster) => Math.hypot(m.x - player.x, m.y - player.y) - m.radius <= lockReach(castSkill(id));
  // A single-target skill at monster m: at once in reach, else walk up to it and go then.
  function castAt(slot: number, id: string, m: Monster): void {
    const no = skills.why(id);
    if (no) return report(slot, id, no);
    if (inReach(id, m)) {
      player.target = m;
      return report(slot, id, skills.use(id, { x: m.x, y: m.y }));
    }
    player.target = null;
    chase = { slot, id, m, clock: 0, left: CHASE_TIME, best: Infinity, still: 0 };
  }
  // Let the aimed skill go: from a click (click) or its key pressed again.
  function castAim(click: boolean): void {
    if (!aim) return;
    const { slot, id, kind } = aim;
    if (kind === "target") {
      const m = monsterAtPointer() ?? (click ? null : player.target?.alive && monsters.includes(player.target as Monster) ? player.target as Monster : nearestMonster(lockReach(castSkill(id))));
      if (!m) {
        if (click) return hint("เลือกเป้าหมาย");
        stopAiming();
        return report(slot, id, "ไม่มีเป้าหมายในระยะ");
      }
      stopAiming();
      return castAt(slot, id, m);
    }
    const at = aimPoint();
    // a ground skill goes only where its disc was seen: with the mouse off the game (over the
    // bar, or a pen lifted) it waits for a spot
    if (kind === "ground" && !at) return hint("ชี้จุดบนพื้นที่จะร่ายก่อน");
    stopAiming();
    report(slot, id, skills.use(id, at && kind === "ground" ? groundSpot(castSkill(id), player, at) : at));
  }
  // A word over her head while still aiming (no more than one in 0.6 s).
  function hint(text: string): void {
    if (performance.now() - denyText < 600) return;
    denyText = performance.now();
    floaters.add(player.x, player.y, 150, text, "info");
  }

  function useSlot(i: number): void {
    const id = progress.hotbar[i];
    const item = slotItem(id);
    if (item) return useItemSlot(i, id!, item);
    chase = null;
    if (id) stand(); // a skill gets her up from a rest
    if (id && ACTIVES[id] && !isTouch()) {
      if (aim?.slot === i) return castAim(false);
      const kind = aimKind(castSkill(id));
      if (kind !== "instant") {
        stopAiming();
        const no = skills.why(id);
        if (no) return report(i, id, no);
        aim = { slot: i, id, kind, map: current.id };
        hud.setAiming(i);
        return;
      }
    }
    stopAiming();
    // aim: the mouse, else the target, else (touch) the nearest monster in sight
    const at = aimPoint() ?? (player.target?.alive ? player.target : null) ?? nearestMonster(900);
    report(i, id, id ? skills.use(id, at) : "ช่องว่าง");
  }
  // An item's shortcut on the bar: one is used from the bag (the smallest stack first, as the bag
  // takes them) just as a double-click there would, with its sounds and sparkles and the potions'
  // wait between sips; with none left it says so.
  function useItemSlot(i: number, entry: string, id: string): void {
    chase = null;
    stopAiming();
    const stacks = inv.slots.map((s, j) => [s, j] as const).filter(([s]) => s?.id === id).sort((a, b) => a[0]!.count - b[0]!.count);
    if (!stacks.length) return report(i, entry, `ไม่มี${ITEMS[id].name}เหลือ`);
    const before = inv.count(id), text = useBagSlot(stacks[0][1]);
    if (inv.count(id) >= before) return report(i, entry, text || "ใช้ไม่ได้");
    report(i, entry, null);
    // (a potion shows what it gave; a book or a vial says what it did)
    if (!ITEMS[id].restore && text) floaters.add(player.x, player.y, 150, text, "info");
  }
  // Each frame: the aimed skill's preview on the ground and the cursor (let go when she falls,
  // the map changes, a talk opens, the skill leaves its slot or the phone controls take over),
  // and a chase toward the monster a skill was aimed at.
  function aimFrame(dt: number): void {
    if (aim && (!hero.alive || talkDialog.open || aim.map !== current.id || progress.hotbar[aim.slot] !== aim.id || isTouch())) stopAiming();
    if (aim) {
      const s = castSkill(aim.id), at = aimPoint(), pv = aimPreview(s, player, at, player.facing());
      w3d.setRange(pv.range ? player : null, pv.range, pv.color);
      w3d.setShape(pv.shape);
      w3d.setAim(pv.disc, pv.disc?.r ?? 0, pv.color);
      const m = aim.kind === "target" ? monsterAtPointer() : null, near = m && inReach(aim.id, m);
      w3d.setHover(m, m ? m.radius + 24 : 0, near ? "#ffd27a" : "#ff6a5a");
      setCursor(aim.kind !== "target" ? "aim-area" : m ? `aim-target ${near ? "aim-lock" : "aim-far"}` : "aim-target");
    }
    const c = chase;
    if (!c) return;
    // (the bot keeps out of it while she goes; the cooldown or the MP gone meanwhile ends it)
    bot.noteManual();
    const no = skills.why(c.id), d = Math.hypot(c.m.x - player.x, c.m.y - player.y) - c.m.radius;
    if (d < c.best - 10) [c.best, c.still] = [d, 0];
    else c.still += dt;
    if (!hero.alive || !c.m.alive || !monsters.includes(c.m) || talkDialog.open || progress.hotbar[c.slot] !== c.id) chase = null;
    else if (no) {
      chase = null;
      report(c.slot, c.id, no);
    } else if (inReach(c.id, c.m)) {
      chase = null;
      walkTo = null;
      player.target = c.m;
      report(c.slot, c.id, skills.use(c.id, { x: c.m.x, y: c.m.y }));
    } else if ((c.left -= dt) <= 0 || c.still > CHASE_STALL || ((c.clock -= dt) <= 0 && !walkToward(chaseGoal(c.id, c.m)))) {
      // no way up to it, or the way ends short of its reach (a monster on a cell she can't
      // stand on), or it keeps away from her
      chase = null;
      walkTo = null;
      floaters.add(player.x, player.y, 150, "เดินไปไม่ถึง", "info");
    } else if (c.clock <= 0) c.clock = 0.25;
  }
  // Where a chase walks: for a shot (a bolt, the falcon, a mimic's copy), only into its reach
  // straight toward the monster, which may be up on a ledge or down below one (it flies there
  // all the same; the way round by a ramp would take her off the other way); for a blow, the
  // monster itself.
  function chaseGoal(id: string, m: Monster): { x: number; y: number } {
    const s = castSkill(id);
    return s.type !== "cone" && clearShot(player, m) ? shortOf(player, m, lockReach(s) * 0.8 + m.radius) : m;
  }

  // Space: lock on to the monster by the mouse pointer and keep attacking it (none there: a
  // swing that way); without a pointer (touch), the nearest one in reach.
  function quickAttack() {
    if (!hero.alive) return;
    const w = swingWeapon();
    if (pointer && view) {
      const p = toMap(pointer), at = groundAt(p.x, p.y);
      let near: Monster | null = null, best = 260;
      for (const m of monsters) {
        const d = m.alive ? Math.hypot(m.x - at.x, m.y - at.y) - m.radius : Infinity;
        if (d < best) [near, best] = [m, d];
      }
      if (near) {
        player.target = near;
        walkTo = null;
        return;
      }
      player.target = null;
      player.startAttack(w, at);
      return;
    }
    player.target = null;
    player.startAttack(w, nearestMonster(attackRange(w) + 40));
  }

  // The touch attack button: keep on the current target, else lock onto the nearest monster
  // within 7 m (the player walks up and keeps hitting it), else swing where she faces.
  function touchAttack() {
    if (!hero.alive) return;
    bot.noteManual();
    walkTo = null;
    if (player.target?.alive) return;
    const m = nearestMonster(700);
    if (m) player.target = m;
    else player.startAttack(swingWeapon(), null);
  }

  // ---- resting (X, or the rest button on a phone): she sits still and HP and MP come back fast
  // (hero.rest, the bot's own rest) until she moves, attacks, uses a skill or an item that isn't
  // a potion, is hurt, talks to someone, falls or changes map. Not with a monster after her. ----
  let resting = false, restClock = 0;
  const restBtn = document.getElementById("btn-rest")!;
  restBtn.append(icon("heal", "#9df0b4"));
  function toggleRest(): void {
    if (resting) return stand();
    if (!hero.alive) return;
    if (bot.threats().length) return void floaters.add(player.x, player.y, 150, "มีศัตรูอยู่ใกล้ ๆ", "info");
    bot.noteManual();
    stopAiming();
    chase = null;
    walkTo = null;
    player.target = null;
    player.attack = null;
    if (skills.pending) skills.interrupt();
    resting = true;
    restClock = 0;
    restBtn.classList.add("on");
    floaters.add(player.x, player.y, 150, "นั่งพักฟื้น", "heal");
  }
  function stand(): void {
    if (!resting) return;
    resting = false;
    restBtn.classList.remove("on");
    hero.standUp();
  }
  // Each frame, after where she'd walk is known: up on any of the above, else the rest kept going.
  function restFrame(dt: number, move: { x: number; y: number }): void {
    if (!resting) return;
    if (move.x || move.y || player.target || player.attack || skills.pending || hero.hurt > 0 || talkDialog.open || !hero.alive) return stand();
    if ((restClock -= dt) <= 0) {
      restClock = 0.5;
      hero.rest();
    }
  }
  restBtn.addEventListener("click", () => toggleRest());

  // ---- input ----
  const held = new Set<string>();
  // keys typed into a number box or a menu are not game keys (checkboxes and sliders are)
  const typing = (e: Event) => e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement
    || (e.target instanceof HTMLInputElement && !["checkbox", "range", "button"].includes(e.target.type));
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || typing(e)) return;
    if (MOVE_KEYS[e.code]) {
      held.add(e.code);
      e.preventDefault();
      return;
    }
    const slot = slotForCode(e.code, e.shiftKey); // Shift: the second row
    if (slot >= 0) {
      e.preventDefault();
      if (!e.repeat) useSlot(slot);
      return;
    }
    if (e.code === "Space") {
      e.preventDefault();
      if (!e.repeat) {
        bot.noteManual();
        chase = null;
        quickAttack();
      }
      return;
    }
    if (e.code === "KeyI" && !e.repeat) invUI.toggle();
    if (e.code === "KeyP" && !e.repeat) statusUI.toggle();
    if (e.code === "KeyO" && !e.repeat) settingsUI.toggle();
    if (e.code === "KeyK" && !e.repeat) skillUI.toggle();
    if (e.code === "KeyB" && !e.repeat) botUI.toggle();
    if (e.code === "KeyJ" && !e.repeat) questLog.toggle();
    if (e.code === "KeyC" && !e.repeat) codexUI.toggle();
    if (e.code === "KeyM" && !e.repeat) mapUI.cycle();
    if (e.code === "KeyX" && !e.repeat) toggleRest();
    if (e.code === "KeyF" && !e.repeat) {
      if (shopUI.open) shopUI.toggle(false);
      else if (workshopUI.open) workshopUI.toggle(false);
      else if (stallUI.open) stallUI.toggle(false);
      else if (talkDialog.open) talkDialog.close();
      else {
        const n = nearestNpc(TALK_RANGE * 1.6);
        if (n) talkTo(n);
      }
    }
    // Esc, one thing at a time: an aimed skill lets go, else the front window closes, else the talk window
    if (e.code === "Escape") {
      if (aim) stopAiming();
      else if (chase) chase = null;
      else if (!closeTop()) talkDialog.close();
    }
    if (e.code === "Backquote") showDebug = !showDebug;
  });
  // a window closed by its × or Esc closes as its owner would close it (tooltips, sounds, the map's guide)
  for (const ui of [invUI, statusUI, settingsUI, skillUI, botUI, shopUI, workshopUI, stallUI, codexUI, mapUI, questLog]) setCloser(ui.win, () => ui.toggle(false));
  const buttons: [string, () => void][] = [["btn-inventory", () => invUI.toggle()],
    ["btn-status", () => statusUI.toggle()], ["btn-skills", () => skillUI.toggle()], ["btn-settings", () => settingsUI.toggle()],
    ["btn-bot", () => botUI.toggle()], ["btn-auto", () => bot.toggle()], ["btn-map", () => mapUI.cycle()], ["btn-quests", () => questLog.toggle()],
    ["btn-codex", () => codexUI.toggle()]];
  for (const [id, fn] of buttons) {
    document.getElementById(id)?.addEventListener("click", (e) => {
      (e.currentTarget as HTMLElement).blur();
      fn();
    });
  }
  // click a slime to walk up to it and keep attacking; click the ground to swing that way
  let view: View | null = null;
  let pointer: { clientX: number; clientY: number } | null = null; // last mouse position on screen (the camera may move under it)
  const toMap = (e: { clientX: number; clientY: number }) => {
    const v = view!;
    return { x: (e.clientX * screen.dpr - v.ox) / v.k, y: (e.clientY * screen.dpr - v.oy) / v.k };
  };
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse") pointer = { clientX: e.clientX, clientY: e.clientY };
  });
  canvas.addEventListener("pointerleave", () => (pointer = null));
  // A click or tap on the game: the merchant, a monster to chase, or a swing toward the ground.
  // walk: a click on the ground walks there (with a mouse; Shift swings there instead), a tap
  // on a phone swings there. Returns whether it started a walk.
  function tapAt(e: { clientX: number; clientY: number }, walk = false): boolean {
    if (!view || !hero.alive) return false;
    bot.noteManual();
    const { x: mx, y: my } = toMap(e);
    const who = npcs.find((n) => n.contains(mx, my));
    if (who) {
      player.target = null;
      talkTo(who);
      return false;
    }
    walkTo = null;
    const m = monsters.find((mon) => mon.contains(mx, my));
    if (m) {
      player.target = m;
      return false;
    }
    // something lying on the ground: walk over to pick it up
    const l = ground.at(mx, my);
    if (l) {
      player.target = null;
      walkToward(l);
      return false;
    }
    player.target = null;
    if (walk) return walkToward(groundAt(mx, my));
    player.startAttack(swingWeapon(), groundAt(mx, my));
    return false;
  }
  // Walking over loot picks it up (what doesn't fit stays where it lies).
  let fullSaid = 0;
  function pickUp(dt: number): void {
    ground.update(dt);
    fullSaid -= dt;
    if (!hero.alive) return;
    let took = false;
    for (const l of ground.within(player)) {
      if (inv.add(l.id, 1) > 0) {
        if (fullSaid <= 0) floaters.add(player.x, player.y, 140, "กระเป๋าเต็ม", "info");
        fullSaid = 3;
        continue;
      }
      ground.take(l);
      took = true;
      sound.play(l.id === "zenny" ? "coin" : "loot-pickup", l.seed * 1000);
      floaters.add(player.x, player.y, 120, ITEMS[l.id].name, "loot");
      bot.notePick();
    }
    if (took) inv.changed();
  }
  // A walk to a ground point round the solids (none if there is no way).
  function walkToward(at: { x: number; y: number }): boolean {
    const path = findPath(player, at, RADIUS);
    walkTo = path ? { path, stuck: 0 } : null;
    return !!path;
  }
  // holding the button down keeps walking toward the pointer, like Ragnarok
  let holdWalk = false, holdClock = 0;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    if (aim) {
      // aiming a skill: a click lets it go; a right click lets the aim go, but only if the button
      // comes up where it went down (a drag with it turns the camera, below)
      if (e.button === 0) castAim(true);
      else if (e.button === 2) rightDown = { x: e.clientX, y: e.clientY };
      return;
    }
    if (e.button === 0) {
      chase = null;
      holdWalk = tapAt(e, !e.shiftKey);
    }
  });
  window.addEventListener("pointerup", (e) => {
    if (e.button === 0) holdWalk = false;
    if (e.button === 2 && rightDown && aim && Math.hypot(e.clientX - rightDown.x, e.clientY - rightDown.y) < 6) stopAiming();
    if (e.button === 2) rightDown = null;
  });
  window.addEventListener("keyup", (e) => held.delete(e.code));
  // (leaving the window lets an aimed skill go: the keys and buttons up meanwhile go unseen)
  window.addEventListener("blur", () => {
    held.clear();
    if (aim) stopAiming();
  });

  resize();
  window.addEventListener("resize", resize);

  const cam = { x: mapX(player.x, player.y), y: mapY(player.x, player.y) - 50 };
  let uiClock = 0;

  // ---- the camera turns freely: drag with the right mouse button (a sideways swipe on a phone) ----
  function turnCamera(a: number): void {
    setYaw(a);
    // the follow camera works in map coordinates, which turn with the view: jump to the player
    cam.x = mapX(player.x, player.y);
    cam.y = mapY(player.x, player.y) - 50;
  }
  let dragTurn: { x: number; yaw: number } | null = null;
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  // the mouse wheel zooms in and out (kept for next time); a wheel over a window scrolls it
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const dy = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 800 : 1);
    zoomTo = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomTo * Math.exp(-dy * 0.0015)));
    try {
      localStorage.setItem(zoomKey, zoomTo.toFixed(3));
    } catch {
      // not kept
    }
  }, { passive: false });
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 2) return;
    dragTurn = { x: e.clientX, yaw };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragTurn) turnCamera(dragTurn.yaw - (e.clientX - dragTurn.x) * 0.0065);
  });
  const endDrag = () => (dragTurn = null);
  canvas.addEventListener("pointerup", (e) => e.button === 2 && endDrag());
  canvas.addEventListener("lostpointercapture", (e) => e.pointerType !== "touch" && endDrag());

  // ---- touch: a thumb on the left third walks (joystick); elsewhere a tap acts like a click
  // and a sideways swipe turns the camera ----
  const stick = new Joystick();
  const swipes = new Map<number, { x: number; y: number; yaw: number; turning: boolean }>();
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") return;
    canvas.setPointerCapture(e.pointerId);
    if (!stick.active && e.clientX < innerWidth * 0.38) {
      stick.start(e);
      bot.noteManual();
      walkTo = null;
      return;
    }
    swipes.set(e.pointerId, { x: e.clientX, y: e.clientY, yaw, turning: false });
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "touch") return;
    if (e.pointerId === stick.id) return stick.move(e);
    const s = swipes.get(e.pointerId);
    if (!s) return;
    if (!s.turning && Math.abs(e.clientX - s.x) > 14) s.turning = true;
    if (s.turning) turnCamera(s.yaw - (e.clientX - s.x) * 0.0085);
  });
  const touchUp = (e: PointerEvent, tap: boolean) => {
    if (e.pointerType !== "touch") return;
    if (e.pointerId === stick.id) return stick.end(e);
    const s = swipes.get(e.pointerId);
    swipes.delete(e.pointerId);
    if (tap && s && !s.turning && Math.hypot(e.clientX - s.x, e.clientY - s.y) < 14) tapAt(e);
  };
  canvas.addEventListener("pointerup", (e) => touchUp(e, true));
  canvas.addEventListener("pointercancel", (e) => touchUp(e, false));

  // on-screen buttons: attack, the two potions, full screen
  const attackBtn = document.getElementById("btn-attack")!;
  attackBtn.append(icon("sword", "#ffd27a"));
  attackBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    touchAttack();
  });
  const potionBtns = (["hp", "mp"] as const).map((kind) => {
    const b = document.getElementById(`btn-pot-${kind}`)!;
    const pic = kind === "hp" ? "potion_red" : "potion_blue";
    b.prepend(hasArt(pic) ? copyCanvas(skillIcon(pic, "drop", "#ff6a5a")) : potionIcon(kind === "hp" ? "#ff6a5a" : "#5aa8ff", false));
    b.addEventListener("click", () => {
      bot.noteManual();
      if (!drink(kind)) floaters.add(player.x, player.y, 150, hero.alive && (kind === "hp" ? hero.hp >= hero.stats.maxHp : hero.mp >= hero.stats.maxMp) ? "เต็มอยู่แล้ว" : "ไม่มียา", "info");
    });
    return [kind, b.querySelector("span")!] as const;
  });
  const countPotions = () => {
    for (const [kind, span] of potionBtns) span.textContent = String(inv.slots.reduce((n, s) => n + (s && ITEMS[s.id].restore?.[kind] ? s.count : 0), 0));
  };
  inv.onChange(countPotions);
  countPotions();
  const fullBtn = document.getElementById("btn-full")!;
  fullBtn.hidden = !document.fullscreenEnabled;
  fullBtn.addEventListener("click", () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void goLandscape();
  });
  // phones: one window at a time, so a window never hides another under it
  onTouchMode(() => {
    const wins = [...document.querySelectorAll<HTMLElement>(".window")];
    const watch = new MutationObserver((changes) => {
      for (const c of changes) {
        const w = c.target as HTMLElement;
        if (!w.classList.contains("hidden")) for (const o of wins) if (o !== w) o.classList.add("hidden");
      }
    });
    for (const w of wins) watch.observe(w, { attributes: true, attributeFilter: ["class"] });
  });
  const deathNote = document.getElementById("death")!;
  let burning = { t: 0, acc: 0, dmg: 0 };
  // what monsters need from the player: where to chase and how a bite lands; whom of the
  // player's allies (the jester's copy first) they go for instead of her (src/allies.ts)
  const monsterCtx: MonsterCtx = {
    player,
    hero,
    unseen: () => hero.hidden,
    foe: (m) => allies.foeFor(m, !hero.hidden),
    bite(m: Monster, foe?: { x: number; y: number } | null) {
      if (foe instanceof Ally) return allies.hurt(foe, m);
      if (hero.hidden) return; // a blow already on its way finds nobody
      // a spell may miss outright (smoke); a blinded monster misses half its bites (more with
      // luck); a weakened one bites softer
      if (m.magical && hero.stats.magicDodge > 0 && lucky(hero.stats.magicDodge, hero.stats)) {
        floaters.add(player.x, player.y, 120, "หลบเวท", "miss");
        return;
      }
      if (m.blind > 0 && lucky(0.5, hero.stats)) {
        floaters.add(player.x, player.y, 120, "พลาด", "miss");
        return;
      }
      const bite = monsterDamage(m, hero.stats);
      if (bite === null) {
        floaters.add(player.x, player.y, 120, "พลาด", "miss");
        return;
      }
      const r = hero.takeDamage(bite.dmg);
      if (r.absorbed) floaters.add(player.x, player.y, 120, `-${Math.round(r.absorbed)}`, "shield");
      if (r.lost) floaters.add(player.x, player.y, 110, `-${Math.round(r.lost)}`, bite.crit ? "crit" : "hurt");
      if (r.lost) sound.playHit({ kind: "enemy", theme: "", weapon: "" });
      if (r.died) {
        sound.play("player-death");
        player.target = null;
        player.attack = null;
        player.cast = null;
        burning.t = 0;
        return;
      }
      // the counter: a blow from close by may be struck straight back
      if (hero.stats.counter > 0 && Math.hypot(m.x - player.x, m.y - player.y) - m.radius < 220 && lucky(hero.stats.counter, hero.stats)) {
        combat.counter(m, player, swingWeapon());
        if (!player.busy) player.startMotion("swing", { x: m.x - player.x, y: m.y - player.y }, skills.weaponStats(), 0.3);
      }
      // metal: part of the bite goes back at the biter
      if (hero.stats.reflect > 0) {
        const back = Math.round(bite.dmg * hero.stats.reflect);
        const d = Math.hypot(m.x - player.x, m.y - player.y) || 1;
        if (back > 0) combat.apply(m, { dmg: back, crit: false, magic: false, miss: false }, { x: (m.x - player.x) / d, y: (m.y - player.y) / d }, 0);
      }
      // an ice, mud or dark bite may leave an ailment, less likely the better the player's
      // defence in that element, shorter with plant, none at plant 50; gold may shrug any
      // ailment off (statusRes)
      const ail = m.element ? AILMENTS[m.element] : undefined;
      const plant = hero.progress.elementLv("plant");
      const shrug = () => {
        if (!resists(hero.stats)) return false;
        floaters.add(player.x, player.y, 140, "ต้านทาน", "miss");
        return true;
      };
      if (ail && plant < 50 && Math.random() < 0.15 * Math.max(0, 1 - hero.stats[`${m.element!}Def`] / 100) && !shrug()) {
        hero.addBuff(`ail_${m.element}`, ail.name, ail.stats, ail.t * (1 - 0.01 * plant));
        floaters.add(player.x, player.y, 140, ail.name, "hurt");
      }
      // some bites slow, turn to stone for a moment or set alight
      for (const a of m.ails) {
        if (Math.random() >= 0.2 || shrug()) continue;
        if (a === "burn") burning = { t: 3.5, acc: 0, dmg: Math.max(1, Math.round(m.atk * 0.15)) };
        else hero.addBuff(`ail_${a}`, BITE_AILS[a].name, BITE_AILS[a].stats, BITE_AILS[a].t);
        floaters.add(player.x, player.y, 140, a === "burn" ? "ไฟลวก" : BITE_AILS[a].name, "hurt");
      }
      // a thief takes some gold and runs
      if (m.steals && inv.gold > 0 && Math.random() < 0.2) {
        const took = Math.min(inv.gold, Math.round(m.level * (2 + Math.random() * 2)));
        inv.gold -= took;
        inv.changed();
        floaters.add(player.x, player.y, 160, `-${took} ทอง`, "info");
        m.fleeT = 2.5;
      }
    },
    note(m, text) {
      floaters.add(m.x, m.y, m.height + 40, text, "heal");
    },
    // a boss calls up others, angry from the start, gone for good once they fall
    summon(m, id, n) {
      const def = MONSTER_BY_ID[id];
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = variantOf(def, def.level);
        const c = new Monster(v, { x: m.x + Math.cos(a) * (m.radius + 120), y: m.y + Math.sin(a) * (m.radius + 120) }, monLooks.of(v), monLooks.person(v));
        c.temp = true;
        c.angry = 12;
        c.kin = monsters;
        monsters.push(c);
      }
      floaters.add(m.x, m.y, m.height + 60, "เรียกพวก!", "info");
    },
  };
  let last = performance.now();
  let fps = 60;
  // Adaptive resolution: over each 2 s of frames, a slow average (under ~45 fps) draws 10% fewer
  // pixels, down to half; three fast windows in a row (over ~70 fps) give 10% back. A gap of
  // more than a quarter second (the tab hidden, a map loading) starts the window over.
  const adaptive = { time: 0, frames: 0, fast: 0 };
  function adapt(gap: number): void {
    if (gap > 250) return void Object.assign(adaptive, { time: 0, frames: 0 });
    adaptive.time += gap;
    adaptive.frames++;
    if (adaptive.time < 2000) return;
    const avg = adaptive.time / adaptive.frames;
    adaptive.time = adaptive.frames = 0;
    if (avg > 22 && screen.scale > 0.5) {
      screen.scale = Math.max(0.5, screen.scale - 0.1);
      adaptive.fast = 0;
      resize();
    } else if (avg < 14 && screen.scale < 1 && ++adaptive.fast >= 3) {
      screen.scale = Math.min(1, screen.scale + 0.1);
      adaptive.fast = 0;
      resize();
    } else if (avg >= 14) adaptive.fast = 0;
  }
  let footstepDistance = 0;

  function frame(now: number): void {
    if (travelling) {
      last = now;
      requestAnimationFrame(frame);
      return;
    }
    const gap = now - last, dt = Math.min(0.05, gap / 1000);
    last = now;
    fps += (1 / Math.max(dt, 1e-3) - fps) * 0.05;
    adapt(gap);

    // ---- update ----
    // keys move relative to the camera: W is always up the screen
    let fwd = 0, left = 0;
    for (const code of held) {
      fwd += MOVE_KEYS[code][0];
      left += MOVE_KEYS[code][1];
    }
    if (stick.active) {
      const s = stick.steps;
      fwd += s.fwd;
      left += s.left;
    }
    let move = fromView(fwd, left);
    if (hero.update(dt) === "respawn") {
      // back on your feet at the save point (a town a guide kept, else Eden), like Ragnarok
      const at = savePoint ?? { map: "eden" as MapId, x: SPAWN.x, y: SPAWN.y };
      if (current.id !== at.map) void enterMap(at.map, { x: at.x, y: at.y });
      else {
        player.x = at.x;
        player.y = at.y;
      }
      floaters.add(player.x, player.y, 140, "ฟื้นแล้ว", "heal");
    }
    // the bot walks when the keys don't
    if (fwd || left) {
      bot.noteManual();
      walkTo = null;
      chase = null; // (the aim itself stays while she walks)
    }
    if (guide && walkTo !== guideWalk && !travelling) guide = null; // walked off somewhere else
    if ((noteClock -= dt) <= 0 && questNotes.length) {
      floaters.add(player.x, player.y, 165, questNotes.shift()!, "info");
      noteClock = 0.8;
    }
    // (by the clock, not game time: a slow frame rate must not stretch it)
    if (now - placeSavedAt > 2000) savePlace();
    const auto = bot.update(dt);
    if (!fwd && !left && bot.on) move = auto;
    if (holdWalk && pointer && view && (holdClock -= dt) <= 0) {
      holdClock = 0.2;
      const p = toMap(pointer), goal = groundAt(p.x, p.y), end = walkTo?.path[walkTo.path.length - 1];
      if (!end || Math.hypot(end.x - goal.x, end.y - goal.y) > 60) walkToward(goal);
    }
    if (walkTo && !fwd && !left) {
      while (walkTo.path.length > 1 && Math.hypot(walkTo.path[0].x - player.x, walkTo.path[0].y - player.y) < 25) walkTo.path.shift();
      const next = walkTo.path[0];
      const there = !next || (walkTo.path.length === 1 && Math.hypot(next.x - player.x, next.y - player.y) < 20);
      if (walkTo.npc && (there || walkTo.npc.distance(player) <= TALK_RANGE - 20)) act(walkTo.npc);
      else if (there) walkTo = null;
      else move = { x: next.x - player.x, y: next.y - player.y };
    }
    restFrame(dt, move);
    for (const n of npcs) n.update(dt, player);
    if (shopUI.open && shopKeeper && shopKeeper.distance(player) > TALK_RANGE * 2.5) shopUI.toggle(false);
    if (workshopUI.open && workshopUI.smith && smithAt && smithAt.distance(player) > TALK_RANGE * 2.5) workshopUI.toggle(false);
    if (talkDialog.open && (!talkingTo || !npcs.includes(talkingTo) || talkingTo.distance(player) > TALK_RANGE * 2.5)) talkDialog.close();
    player.dead = !hero.alive;
    player.speedMul = 1 + hero.stats.move;
    player.hurtFlash = hero.hurt;
    // in a form: drawn as its look, swinging its blow (the hands rest); in one or out of one (its
    // time up, used again, falling, a new map), the bar greys what she can't use
    const shape = formSkill();
    player.shape = shape?.look ? lookSheet(shape.look) : null;
    player.orbs = hero.orbs.map((o) => tex.glowFor(ELEMENTS[o.el].color));
    if ((hero.form?.id ?? null) !== formWas) {
      if (formWas && !hero.form && hero.alive) {
        floaters.add(player.x, player.y, 170, "คืนร่าง", "info");
        skills.burst(player.x, player.y, "#e8f0d8", 70);
      }
      formWas = hero.form?.id ?? null;
      refreshBar();
    }
    const w = swingWeapon();
    const offW = shape ? null : offhandWeapon(inv.equipped.offhand);
    if (offW) w.interval *= DUAL_WIELD_SLOWDOWN; // two weapons swing a little slower
    // walking (the keys, a click on the ground) lets a cast go; the bot waits for it
    if (skills.pending && (fwd || left || walkTo) && (move.x || move.y)) skills.interrupt();
    // a merchant keeps to her stall: a step closes it
    if (stall.open && (move.x || move.y)) stall.close("ปิดร้านแล้ว ของที่เหลือกลับเข้ากระเป๋า");
    stall.update(dt);
    const was = { x: player.x, y: player.y };
    if (player.update(dt, player.dead ? { x: 0, y: 0 } : move, w) && hero.alive) {
      if (shape?.formAttack) combat.formStrike(player, shape.formAttack, progress.skillRank(hero.form!.id), w, shape.color);
      else combat.strike(player, inv.equipped.weapon, offW);
    }
    const walked = Math.hypot(player.x - was.x, player.y - was.y);
    if (walked > 0.1 && hero.alive) {
      footstepDistance += walked;
      if (footstepDistance >= 118) {
        footstepDistance %= 118;
        sound.playFootstep(current.id);
      }
    }
    // a walk that stops getting anywhere (held up by a fight, or by someone in the way) ends
    if (walkTo && !fwd && !left) {
      walkTo.stuck = Math.hypot(player.x - was.x, player.y - was.y) < 0.5 ? walkTo.stuck + dt : 0;
      if (walkTo.stuck > 1.2) walkTo = null;
    }
    allies.update(dt);
    for (const m of monsters) m.update(dt, monsterCtx);
    pickUp(dt);
    updateShots(dt, monsterCtx);
    // those a boss called up are gone for good once they fall
    for (let i = monsters.length - 1; i >= 0; i--) if (monsters[i].temp && monsters[i].state === "gone") monsters.splice(i, 1);
    // burning: the fire bites every second
    if (burning.t > 0 && hero.alive) {
      burning.t -= dt;
      burning.acc += dt;
      if (burning.acc >= 1) {
        burning.acc -= 1;
        const r = hero.takeDamage(burning.dmg);
        if (r.lost) {
          floaters.add(player.x, player.y, 110, `-${Math.round(r.lost)}`, "hurt");
          sound.playHit({ kind: "enemy", theme: "", weapon: "" });
        }
        if (r.died) {
          sound.play("player-death");
          burning.t = 0;
        }
      }
    }
    // warps to the next map; gates that are shut say so
    for (const w of current.warps) {
      if (Math.hypot(player.x - w.x, player.y - w.y) < w.r && hero.alive) {
        void enterMap(w.to as MapId, w.arrive, current.id);
        break;
      }
    }
    for (const c of current.closed) {
      if (Math.hypot(player.x - c.x, player.y - c.y) < c.r && now - closedSaid > 4000) {
        closedSaid = now;
        floaters.add(player.x, player.y, 150, c.text, "info");
      }
    }
    combat.update(dt);
    skills.update(dt);
    floaters.update(dt);
    for (let i = spells.length - 1; i >= 0; i--) {
      spells[i].update(dt);
      if (spells[i].done) spells.splice(i, 1);
    }
    fx.update(dt);
    motes.update(dt, { x: player.x, y: player.y });
    // (an invoke: the cooldown and the name of the spell it would cast now; the orbs beside the bar)
    // (a potion's shortcut: the wait between sips)
    progress.hotbar.forEach((id, i) => {
      const item = slotItem(id);
      if (item) {
        hud.setCooldown(i, 0, 1);
        return hud.setNote(i, "");
      }
      const a = id ? ACTIVES[id] : null, sp = a ? skills.spellFor(id!) : null, key = sp?.key ?? id;
      hud.setCooldown(i, key ? hero.cooldowns.get(key) ?? 0 : 0, key ? hero.cdTotal.get(key) ?? 1 : 1);
      if (a?.skill.type === "invoke") hud.setNote(i, sp?.name ?? (hero.orbKey ? "ไม่มีเวท" : ""), sp?.s.color ?? "#b8b8b8");
      else hud.setNote(i, "");
    });
    hud.setOrbs(hero.orbs.map((o) => ({ name: ELEMENTS[o.el].name, color: ELEMENTS[o.el].color })),
      hero.orbs.length > 0 || progress.hotbar.some((id) => id && ACTIVES[id]?.skill.type === "orb"));
    vitals.update();
    buffBar.update();
    uiClock += dt;
    if (uiClock > 0.25) {
      uiClock = 0;
      statusUI.render();
      botUI.tick();
      deathNote.classList.toggle("hidden", hero.alive);
      if (!hero.alive) deathNote.textContent = `ล้มลงแล้ว · ฟื้นที่จุดเกิดในอีก ${Math.ceil(hero.dead)} วินาที`;
    }

    // ---- camera: follow the player, easing to the wheel's zoom ----
    screen.user += (zoomTo - screen.user) * (1 - Math.exp(-dt * 12));
    const k = screen.zoom * screen.dpr * screen.far * screen.user;
    const tx = mapX(player.x, player.y), ty = mapY(player.x, player.y) - 50;
    const ease = 1 - Math.exp(-dt * 6);
    cam.x += (tx - cam.x) * ease;
    cam.y += (ty - cam.y) * ease;
    const vw: View = {
      k,
      ox: Math.round(canvas.width / 2 - cam.x * k),
      oy: Math.round(canvas.height / 2 - cam.y * k),
      w: canvas.width,
      h: canvas.height,
      mipFor,
    };
    view = vw;

    // ---- draw: the 3D courtyard with the characters standing in it ----
    w3d.sync(vw, yaw);
    // the bot's hunting area and the ring under the slime being attacked lie on the ground
    w3d.setArea((bot.on || botUI.open) && !bot.settings.wholeMap ? (bot.on ? bot.anchor : player) : null, bot.settings.radius);
    // (or, walking to a spot picked on the map, under that spot)
    // the skill being aimed: its reach, its area, the monster under the mouse
    aimFrame(dt);
    w3d.setRing(player.target?.alive ? player.target : bot.on && bot.target?.alive ? bot.target
      : walkTo && !walkTo.npc ? walkTo.path[walkTo.path.length - 1] ?? null : null);
    const mainType = weaponType(inv.equipped.weapon);
    const inHand = mainType ? weapons[mainType] : null;
    const offItem = inv.equipped.offhand ? ITEMS[inv.equipped.offhand] : null;
    const inOff = offItem?.weapon ? weapons[offItem.weapon] : offItem?.art ? offhandArt[offItem.art] : null;
    // each character a billboard drawn by its own 2D code (only those near the screen)
    const onScreen = (x: number, y: number, pad: number) => {
      const sx = mapX(x, y) * k + vw.ox, sy = mapY(x, y) * k + vw.oy;
      return sx > -pad * k && sx < vw.w + pad * k && sy > -pad * k && sy < vw.h + pad * k * 2;
    };
    w3d.beginActors();
    for (const m of monsters) {
      m.focus = m === player.target || (bot.on && m === bot.target); // its name and HP show under it
      if (m.state === "gone" || !onScreen(m.x, m.y, 200)) continue;
      w3d.actor(m, { x: m.x, y: m.y, ...m.board }, vw, (c, v) => m.draw(c, v));
    }
    for (const n of npcs) {
      if (!onScreen(n.x, n.y, 300)) continue;
      const near = n.distance(player) <= TALK_RANGE * 1.6;
      w3d.actor(n, { x: n.x, y: n.y, w: 300, h: 240, foot: 30 }, vw, (c, v) => n.draw(c, v, near));
    }
    for (const l of ground.items) {
      if (onScreen(l.x, l.y, 100)) w3d.actor(l, Ground.box(l), vw, (c, v) => ground.draw(c, v, l, iconFor(l.id)));
    }
    // the allies: a clone drawn as its own figure, the decoy as the player where it stands
    const figure = (c: CanvasRenderingContext2D, v: View, body: Player | null, at: { x: number; y: number }) => {
      if (body) return body.draw(c, v, inHand, inOff);
      const was = { x: player.x, y: player.y };
      player.x = at.x;
      player.y = at.y;
      player.draw(c, v, inHand, inOff);
      Object.assign(player, was);
    };
    for (const a of allies.list) {
      if (a.alive && onScreen(a.x, a.y, 200)) w3d.actor(a, allies.box(a), vw, (c, v) => allies.draw(c, v, a, figure));
    }
    w3d.actor(player, { x: player.x, y: player.y, w: 340, h: 300, foot: 50 }, vw, (c, v) => player.draw(c, v, inHand, inOff), true);
    w3d.endActors();
    // what lies on the ground (glows, the spell's flowers) goes into the 3D view, under the feet
    const sorted = fx.layer(SORTED);
    w3d.ground([...groundSprites(fx.layer(GROUND_GLOW), true, tex.flowerTop), ...groundSprites(sorted.filter((p) => p.flat), false, tex.flowerTop)]);
    w3d.render(dt);

    // ---- on top, in 2D: spell effects, projectiles, damage numbers ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "low"; // textures carry their own mip levels
    // in the air (petals): over the scene, back to front
    const air = sorted.filter((p) => !p.flat);
    for (const p of air) p.depth = mapY(p.x, p.y);
    air.sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));
    fx.draw(ctx, vw, air);

    combat.draw(ctx, vw, images.arrow);
    drawShots(ctx, vw);
    ctx.globalCompositeOperation = "lighter";
    fx.draw(ctx, vw, fx.layer(AIR_GLOW));
    ctx.globalCompositeOperation = "source-over";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // monsters' names and HP under their feet, over the scene (in their billboards the ground
    // in front of them would hide what hangs below the feet)
    for (const m of monsters)
      if (m.state !== "gone" && onScreen(m.x, m.y, 200)) m.drawPlate(ctx, mapX(m.x, m.y) * k + vw.ox, mapY(m.x, m.y) * k + vw.oy, k);
    stall.drawSign(ctx, vw);
    floaters.draw(ctx, vw);

    mapUI.frame(dt, { player, facing: player.facing(), yaw, npcs, monsters, route: walkTo?.path.length ? [player, ...walkTo.path] : null });
    if (showDebug) drawDebug(vw, player, fx, fps);
    requestAnimationFrame(frame);
  }

  // Exposed for automated checks and console poking.
  (window as unknown as { __game: unknown }).__game = { player, fx, spells, useSlot, inv, monsters, combat, look, looks, applyLook, invUI, quickAttack, directionIndex,
    progress, hero, skills, allies, statusUI, skillUI, picker, turnCamera, world: w3d, bot, botUI, shopUI, mapUI, drink, enterMap, ground, stall, stallUI, workshopUI,
    get npcs() { return npcs; }, get map() { return current; }, get walk() { return walkTo; },
    zoomOut: (f: number) => (screen.far = 1 / f), nav: { findPath, blocked, solids: SOLIDS },
    draw: { mapX, mapY, viewRow, WEAPON_ART, heightAt }, // for test scripts drawing the player by hand
    circles: { LOOKS, circleTextures }, // and looking at the cast circles
    quests, talkDialog, questLog, questTracker, startGuide, get guide() { return guide; }, talk: (id: string) => { const n = npcs.find((x) => x.spec.id === id); if (n) act(n); } };

  // Back from a reload onto a newer version: finish the trip that was under way.
  let resume: { map?: MapId; at?: { x: number; y: number } | null; from?: string | null } | null = null;
  try {
    resume = JSON.parse(sessionStorage.getItem(RESUME) || "null");
    sessionStorage.removeItem(RESUME);
  } catch {
    // nothing to finish
  }
  if (resume?.map && resume.map in MAP_NAMES && resume.map !== current.id) void enterMap(resume.map, resume.at ?? undefined, resume.from ?? undefined);

  // Where the character stands, for the next session: every couple of seconds while alive, and
  // when the page goes away (closing the tab, or back to the title, which reloads it).
  let placeSaved = "", placeSavedAt = 0;
  function savePlace(): void {
    placeSavedAt = performance.now();
    if (!hero.alive) return; // the dead get up at their save point; keep where they last stood alive
    const place = JSON.stringify({ map: current.id, x: Math.round(player.x), y: Math.round(player.y) });
    if (place === placeSaved) return;
    placeSaved = place;
    try {
      localStorage.setItem(placeKey, place);
    } catch {
      // not persisted
    }
  }
  window.addEventListener("pagehide", savePlace);
  document.addEventListener("visibilitychange", () => document.hidden && savePlace());

  await settle(current);
  loaded();
  quests.onEnter(current.id);
  requestAnimationFrame((t) => {
    last = t;
    frame(t);
  });
}

function drawDebug(view: View, player: Player, fx: Particles, fps: number): void {
  const { k, ox, oy } = view;
  ctx.setTransform(k, 0, 0, k, ox, oy);
  ctx.lineWidth = 2 / k;
  ctx.strokeStyle = "rgba(255, 60, 60, 0.9)";
  for (const s of debugShapes()) {
    ctx.beginPath();
    if ("circle" in s) {
      const [x, y, r] = s.circle;
      ctx.ellipse(x, y, r, r * Math.SQRT1_2, 0, 0, Math.PI * 2);
    } else {
      s.poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
    }
    ctx.stroke();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `${12 * screen.dpr}px monospace`;
  ctx.fillStyle = "#fff";
  ctx.fillText(
    `${fps.toFixed(0)} fps  particles ${fx.list.length}  pos ${player.x.toFixed(0)}, ${player.y.toFixed(0)}`,
    12 * screen.dpr, canvas.height - 90 * screen.dpr,
  );
}

boot().catch((err) => {
  console.error(err);
  const title = document.querySelector(".loading-title");
  if (title) title.textContent = "โหลดไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err));
});


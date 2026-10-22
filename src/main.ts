import { mapX, mapY, groundAt, fromView, setYaw, yaw } from "./projection";
import { loadAll, mipChain, bakeGround, glow, tint } from "./assets";
import { World3D } from "./world3d/view";
import { SPAWN, debugShapes } from "./world";
import { Particles, GROUND_GLOW, SORTED, AIR_GLOW, groundSprites } from "./particles";
import { Player, directionIndex } from "./player";
import { SkillBar, slotForCode } from "./hud";
import { Motes } from "./motes";
import { ITEMS, WEAPON_TYPES, SHAPES, DUAL_WIELD_SLOWDOWN, offhandWeapon } from "./items";
import type { OffhandArt } from "./items";
import type { WeaponId } from "./items";
import { Inventory } from "./inventory";
import { InventoryUI, loadLook } from "./ui";
import { Combat, Floaters, weaponStats, attackRange } from "./combat";
import { slimeSheets, spawnMonsters, rollDrops, MonsterLooks, Monster, variantOf, shots, updateShots, drawShots } from "./monsters";
import type { MonsterCtx } from "./monsters";
import { MONSTERS, MONSTER_BY_ID, behaviour } from "./bestiary";
import { Looks } from "./look";
import type { BodyDef, HairData } from "./look";
import { WEAPON_ART } from "./weapons";
import type { WeaponArt } from "./weapons";
import { Progress, ACTIVES, CLASSES } from "./progression";
import { Hero } from "./hero";
import { Skills } from "./skills";
import { monsterDamage } from "./stats";
import type { ElementId, StatBag } from "./progression";

import { Vitals, ClassPicker, StatusUI, SkillUI, skillTip } from "./charui";
import { icon } from "./icons";
import { Bot } from "./bot";
import { Title } from "./title";
import { useCharacter, loadRoster, touchCharacter, saveKey, readJson } from "./save";
import { ShopUI } from "./shop";
import { Npc, TALK_RANGE } from "./npcs";
import { loadMap, MAP_NAMES } from "./maps";
import { MapUI, mapArea } from "./mapui";
import type { GameMap, MapId } from "./maps";
import { findPath, blocked, SOLIDS } from "./world";
import { RADIUS } from "./player";
import { BotUI } from "./botui";
import { garmentIcon } from "./garments";
import { detectTouch, onTouchMode, goLandscape, Joystick, isTouch } from "./touch";
import type { FlowerSpell } from "./spell";
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

const screen = { w: 0, h: 0, dpr: 1, zoom: 1, far: 1 }; // far: a debug zoom-out (__game.zoomOut)
function resize() {
  // phones draw the 3D courtyard at up to 1.5 pixels per CSS pixel, to keep it smooth
  screen.dpr = Math.min(window.devicePixelRatio || 1, isTouch() ? 1.5 : 2);
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = Math.round(w * screen.dpr);
  canvas.height = Math.round(h * screen.dpr);
  screen.w = w;
  screen.h = h;
  // show about 15 x 9 m of the courtyard (map pixels are centimetres)
  screen.zoom = Math.max(0.5, Math.min(w / 1500, h / 900));
  world?.resize(w, h, screen.dpr);
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
  const quality = isTouch() ? { flowers: 0.6, shadow: 2048 } : { flowers: 1, shadow: 4096 };
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
  const hero = new Hero(progress, () => inv.equipped.weapon, () => inv.equipped.offhand);
  const look = loadLook(looks.hairstyles);
  // Rebuild the player's sheets when the look or the clothes change; a newer change wins
  // over one still loading.
  let currentLook = looks.key(look, inv.equipped), lookSeq = 0;
  const first = await looks.build(look, inv.equipped);
  const applyLook = async () => {
    const key = looks.key(look, inv.equipped);
    if (key === currentLook) return;
    currentLook = key;
    const seq = ++lookSeq;
    const built = await looks.build(look, inv.equipped);
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
      // the garment on its own (src/garments.ts), at a whole-pixel scale
      const art = garmentIcon(item.kind, item.shape!, item.dye ?? null);
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
    } else if (item.kind === "potion") {
      c = potionIcon(item.icon.color ?? "#ff6a5a", (item.restore?.hp ?? item.restore?.mp ?? 0) > 0.3);
    } else if (item.kind === "book") {
      c = document.createElement("canvas");
      c.width = c.height = ICON * 2;
      c.getContext("2d")!.drawImage(icon(item.icon.glyph ?? "star", item.icon.color ?? "#c9a86a"), 4, 4, c.width - 8, c.height - 8);
    } else c = makeIcon(images[item.icon.sheet ?? "jelly"]);
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
  const player = new Player(SPAWN.x, SPAWN.y, first.sheets, first.hands, glow("rgba(255, 110, 120, 1)"));
  // back on the spot, unless something now stands there
  if (left?.map === startMap && Number.isFinite(left.x) && Number.isFinite(left.y) && !blocked(left, RADIUS)) {
    player.x = left.x;
    player.y = left.y;
  }
  w3d.focus = player;
  player.builtin = first.builtin;
  applyLook();
  // townsfolk, made once per map: the merchant's own sprite, or dressed through the wardrobe
  // (dressing: each map's sheets still loading, which the loading screen waits for)
  const folk = new Map<MapId, Npc[]>(), dressing = new Map<MapId, Promise<unknown>>();
  function townsfolk(map: GameMap): Npc[] {
    let list = folk.get(map.id);
    if (list) return list;
    const sheets: Promise<unknown>[] = [];
    list = map.npcs.map((spec) => {
      const npc = new Npc(spec);
      if (spec.sprite === "merchant") npc.sheet = images.merchant;
      else if (spec.look) {
        const { top, bottom, ...l } = spec.look;
        sheets.push(looks.build(l, { weapon: null, offhand: null, top, bottom }, ["idle"]).then((b) => (npc.sheet = b.sheets.idle)).catch(console.error));
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
  const spells: FlowerSpell[] = [];
  const floaters = new Floaters();
  const monLooks = new MonsterLooks(slimeSheets({
    idle: images.slime_idle, hop: images.slime_hop, hurt: images.slime_hurt, die: images.slime_die,
  }));
  // A map's monsters: towns have none; a field its own from the bestiary (and those its boss
  // calls up), their sheets loaded first.
  async function populate(map: GameMap): Promise<Monster[]> {
    shots.length = 0;
    if (map.town) return [];
    const pool = MONSTERS.filter((d) => d.field === map.id);
    const called = pool.map((d) => behaviour(d, "summon")).filter((id): id is string => !!id && !!MONSTER_BY_ID[id]).map((id) => MONSTER_BY_ID[id]);
    await monLooks.prepare([...pool, ...called]);
    return spawnMonsters(monLooks, { spots: map.spots, levels: map.levels, pool, spawn: map.spawn });
  }
  // the list stays the same array (combat, skills and the bot hold it)
  const monsters: Monster[] = await populate(current);
  const combat = new Combat({
    fx, tex, floaters, monsters, hero,
    onReflect(_m, dmg) {
      const r = hero.takeDamage(dmg);
      if (r.lost) floaters.add(player.x, player.y, 110, `-${Math.round(r.lost)}`, "hurt");
      if (r.died) player.target = player.attack = null;
    },
    onKill(m) {
      let got = 0;
      const gold = Math.round((1.5 + Math.random() * 2) * m.level * (1 + hero.stats.drop)) + 1;
      // gold, loot and experience go straight in, with no words over the body
      inv.gold += gold;
      for (const id of rollDrops(m.variant, hero.stats.drop)) if (!inv.add(id, 1)) got++;
      // experience shrinks for monsters far below the player's level
      const gap = progress.level - m.level;
      const xp = Math.max(1, Math.round(m.variant.xp * Math.max(0.1, Math.min(1, 1 - (gap - 5) * 0.1)) * (1 + hero.stats.xpPct)));
      bot.noteKill(xp, got, gold);
      inv.changed();
      if (progress.addXp(xp) > 0) levelUp();
    },
  });
  const skills = new Skills({ progress, hero, player, combat, monsters, fx, tex, floaters, spells, weapon: () => inv.equipped.weapon });

  function levelUp() {
    hero.refill();
    floaters.add(player.x, player.y, 150, `LEVEL UP! Lv ${progress.level}`, "level");
    skills.ring(player.x, player.y, "#ffe27a", 260, 0.8);
    skills.sparkleUp(player.x, player.y, tex.flash, 40);
  }

  // ---- skill bar ----
  const hud = new SkillBar(document.getElementById("skillbar")!, useSlot, (i) => {
    progress.hotbar[i] = null;
    progress.changed();
  });
  function refreshBar() {
    progress.hotbar.forEach((id, i) => {
      const a = id && ACTIVES[id];
      if (!a) return hud.set(i, null);
      const rank = progress.skillRank(id);
      hud.set(i, { id, name: a.name, icon: icon(a.glyph, a.color), tip: skillTip(id, rank), missing: !rank });
    });
  }
  let rosterLine = `${progress.level}|${progress.cls}`;
  progress.onChange(() => {
    refreshBar();
    hero.recompute();
    // keep the title screen's line for this character up to date
    const line = `${progress.level}|${progress.cls}`;
    if (line !== rosterLine && progress.cls) {
      rosterLine = line;
      touchCharacter({ level: progress.level, cls: progress.cls });
    }
  });
  refreshBar();

  // ---- auto-hunt bot ----
  const bot = new Bot({
    player, hero, progress, skills, monsters, inv,
    weapon: () => weaponStats(inv.equipped.weapon, hero.stats),
    weaponId: () => inv.equipped.weapon,
    onSkill(id) {
      const i = progress.hotbar.indexOf(id);
      if (i >= 0) hud.pulse(i, "flash");
    },
    say: (text) => floaters.add(player.x, player.y, 150, text, "info"),
    drink,
    potions: (kind) => inv.slots.reduce((n, s) => n + (s && ITEMS[s.id].restore?.[kind] ? s.count : 0), 0),
  });

  // Drink a potion from bag slot i; null when it went down, else why not.
  let potionCd = 0;
  function drinkAt(i: number): string | null {
    const stack = inv.slots[i];
    const item = stack && ITEMS[stack.id];
    if (!item?.restore) return "ดื่มไม่ได้";
    if (!hero.alive) return "ล้มอยู่";
    if (potionCd > 0) return "รอสักครู่";
    const r = item.restore;
    if ((!r.hp || hero.hp >= hero.stats.maxHp) && (!r.mp || hero.mp >= hero.stats.maxMp)) return "เต็มอยู่แล้ว";
    potionCd = 0.8;
    const boost = 1 + hero.stats.potion; // the alchemy flask
    if (r.hp) floaters.add(player.x, player.y, 130, `+${Math.round(hero.heal(hero.stats.maxHp * r.hp * boost))}`, "heal");
    if (r.mp) {
      const before = hero.mp;
      hero.mp = Math.min(hero.stats.maxMp, hero.mp + hero.stats.maxMp * r.mp * boost);
      floaters.add(player.x, player.y, 150, `+${Math.round(hero.mp - before)} MP`, "magic");
    }
    skills.sparkleUp(player.x, player.y, r.hp ? tex.glowFor("#ff8a7a") : tex.glowFor("#8cc8ff"), 14);
    inv.discard(i, 1);
    return null;
  }
  // The bot's sip: the smallest potion of that kind that still covers what's missing.
  function drink(kind: "hp" | "mp"): boolean {
    const missing = kind === "hp" ? 1 - hero.hp / hero.stats.maxHp : 1 - hero.mp / hero.stats.maxMp;
    const options = inv.slots.map((s, i) => [s, i] as const).filter(([s]) => s && ITEMS[s.id].restore?.[kind])
      .sort((a, b) => ITEMS[a[0]!.id].restore![kind]! - ITEMS[b[0]!.id].restore![kind]!);
    const pick = options.find(([s]) => ITEMS[s!.id].restore![kind]! >= missing * 0.8) ?? options[options.length - 1];
    return !!pick && drinkAt(pick[1]) === null;
  }

  const invUI = new InventoryUI(inv, iconFor, (i) => {
    const stack = inv.slots[i];
    if (!stack) return "";
    if (ITEMS[stack.id].kind === "potion") return drinkAt(i) ?? `ดื่ม${ITEMS[stack.id].name}แล้ว`;
    const msg = progress.readBook(stack.id);
    if (!msg) return "อ่านเล่มนี้ไปแล้ว";
    stack.count -= 1;
    if (stack.count <= 0) inv.slots[i] = null;
    inv.changed();
    statusUI.render();
    skillUI.render();
    return `ปลดล็อค${msg}แล้ว`;
  }, (id) => {
    // clothes whose body has no animations yet, or that are for the other build
    const item = ITEMS[id];
    if ((item.kind !== "top" && item.kind !== "bottom") || !item.shape) return null;
    const sh = SHAPES[item.kind][item.shape];
    if (sh.gender !== look.gender) return `ใส่ได้เฉพาะตัวละคร${sh.gender === "male" ? "ชาย" : "หญิง"}`;
    if (!looks.ready(sh.body)) return `ยังใส่ไม่ได้: ทรง${sh.name}กำลังสร้างท่าเดินและท่าโจมตีใน Oriverse ใส่ได้เมื่อเสร็จ`;
    return null;
  });

  // ---- character windows ----
  const vitals = new Vitals(document.getElementById("vitals")!, progress, hero, entry?.name ?? "");
  const picker = new ClassPicker((cls) => {
    const first = !progress.cls;
    const level = progress.level, xp = progress.xp, unlocked = progress.unlocked;
    progress.reset(cls);
    if (!first) Object.assign(progress, { level, xp, unlocked });
    progress.changed();
    hero.refill();
    // a new character starts with the class's weapon in hand
    if (first && inv.equipped.weapon !== CLASSES[cls].weapon) {
      if (!inv.has(CLASSES[cls].weapon)) inv.add(CLASSES[cls].weapon, 1, { silent: true });
      const i = inv.slots.findIndex((s) => s?.id === CLASSES[cls].weapon);
      if (i >= 0) inv.equip(i);
    }
  });
  const statusUI = new StatusUI(progress, hero, () => picker.show(), () => location.reload());
  const skillUI = new SkillUI(progress, hero, {
    weapon: () => inv.equipped.weapon,
    weaponImg: (t) => weapons[t]?.img,
    onDropSkill: (id, x, y) => {
      const i = hud.slotAt(x, y);
      if (i >= 0) progress.setSlot(i, id);
    },
  });
  if (!progress.cls) picker.show();
  const botUI = new BotUI(bot, progress);
  const shopUI = new ShopUI(inv, iconFor);
  // the minimap and the map window (M); each map's picture from above is taken while it loads
  // and kept
  const mapUI = new MapUI(MAP_NAMES, goTo, (id) => void enterMap(id as MapId));
  const pictures = new Map<MapId, HTMLCanvasElement>();
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
  function act(npc: Npc): void {
    walkTo = null;
    if (npc.spec.role === "shop") {
      shopKeeper = npc;
      shopUI.keeper(npc.name, npc.spec.title);
      shopUI.toggle(true);
      return;
    }
    npc.talk();
    // a travel guide: the world map, to pick a town to go to
    if (npc.spec.role === "travel") mapUI.travel(npc.spec.ports);
    if (npc.spec.role === "heal" && hero.alive) {
      hero.refill();
      floaters.add(player.x, player.y, 140, "HP และ MP เต็มแล้ว", "heal");
      skills.sparkleUp(player.x, player.y, tex.glowFor("#ffe9a8"), 24);
    }
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
  // (from: the map a warp leaves, whose gate in the new map is where she arrives)
  async function enterMap(id: MapId, at?: { x: number; y: number }, from?: string): Promise<void> {
    if (travelling) return;
    travelling = true;
    await loading(`กำลังเดินทางไป${MAP_NAMES[id]}…`, 0.25);
    try {
      current = await loadMap(id, quality);
    } catch (err) {
      // a town that fails to build: stay where you are
      console.error(err);
      loadMap(current.id, quality).catch(console.error); // its solids current again
      loaded();
      travelling = false;
      floaters.add(player.x, player.y, 140, `เดินทางไป${MAP_NAMES[id]}ไม่สำเร็จ`, "info");
      return;
    }
    w3d.load(current.level);
    monsters.length = 0;
    monsters.push(...(await populate(current)));
    npcs = townsfolk(current);
    const there = (from && current.gates[from]) || at || current.spawn;
    player.x = there.x;
    player.y = there.y;
    player.target = null;
    player.attack = null;
    walkTo = null;
    shopUI.toggle(false);
    if (bot.on) bot.anchor = { x: player.x, y: player.y };
    cam.x = mapX(player.x, player.y);
    cam.y = mapY(player.x, player.y) - 50;
    await settle(current);
    loaded();
    travelling = false;
    savePlace(); // the new map at once, in case the page closes right away
    banner.textContent = current.name;
    banner.classList.add("show");
    clearTimeout(bannerTimer);
    bannerTimer = window.setTimeout(() => banner.classList.remove("show"), 2600);
  }
  let closedSaid = 0;
  inv.onChange(() => {
    applyLook();
    hero.recompute();
  });

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

  function useSlot(i: number): void {
    const id = progress.hotbar[i];
    // aim: the mouse, else the target, else (touch) the nearest monster in sight
    const aim = aimPoint() ?? (player.target?.alive ? player.target : null) ?? nearestMonster(900);
    const why = id ? skills.use(id, aim) : "ช่องว่าง";
    if (why) {
      hud.pulse(i, "denied");
      if (id && performance.now() - denyText > 600) {
        denyText = performance.now();
        floaters.add(player.x, player.y, 150, why, "info");
      }
      return;
    }
    hud.pulse(i, "flash");
  }

  // Space: attack toward the mouse pointer; without one (touch), the nearest slime in reach.
  function quickAttack() {
    if (!hero.alive) return;
    const w = weaponStats(inv.equipped.weapon, hero.stats);
    if (pointer && view) {
      const p = toMap(pointer);
      player.target = null;
      player.startAttack(w, groundAt(p.x, p.y));
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
    else player.startAttack(weaponStats(inv.equipped.weapon, hero.stats), null);
  }

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
    const slot = slotForCode(e.code);
    if (slot >= 0) {
      e.preventDefault();
      if (!e.repeat) useSlot(slot);
      return;
    }
    if (e.code === "Space") {
      e.preventDefault();
      if (!e.repeat) {
        bot.noteManual();
        quickAttack();
      }
      return;
    }
    if (e.code === "KeyI" && !e.repeat) invUI.toggle();
    if (e.code === "KeyP" && !e.repeat) statusUI.toggle();
    if (e.code === "KeyK" && !e.repeat) skillUI.toggle();
    if (e.code === "KeyB" && !e.repeat) botUI.toggle();
    if (e.code === "KeyM" && !e.repeat) mapUI.cycle();
    if (e.code === "KeyF" && !e.repeat) {
      if (shopUI.open) shopUI.toggle(false);
      else {
        const n = nearestNpc(TALK_RANGE * 1.6);
        if (n) talkTo(n);
      }
    }
    if (e.code === "Escape") {
      invUI.toggle(false);
      statusUI.toggle(false);
      skillUI.toggle(false);
      botUI.toggle(false);
      shopUI.toggle(false);
      mapUI.toggle(false);
    }
    if (e.code === "Backquote") showDebug = !showDebug;
  });
  const buttons: [string, () => void][] = [["btn-inventory", () => invUI.toggle()],
    ["btn-status", () => statusUI.toggle()], ["btn-skills", () => skillUI.toggle()],
    ["btn-bot", () => botUI.toggle()], ["btn-auto", () => bot.toggle()], ["btn-map", () => mapUI.cycle()]];
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
    player.target = null;
    if (walk) return walkToward(groundAt(mx, my));
    player.startAttack(weaponStats(inv.equipped.weapon, hero.stats), groundAt(mx, my));
    return false;
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
    if (e.pointerType !== "touch" && e.button === 0) holdWalk = tapAt(e, !e.shiftKey);
  });
  window.addEventListener("pointerup", (e) => {
    if (e.button === 0) holdWalk = false;
  });
  window.addEventListener("keyup", (e) => held.delete(e.code));
  window.addEventListener("blur", () => held.clear());

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
    b.prepend(potionIcon(kind === "hp" ? "#ff6a5a" : "#5aa8ff", false));
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
  // what monsters need from the player: where to chase and how a bite lands
  const monsterCtx: MonsterCtx = {
    player,
    hero,
    bite(m: Monster) {
      // a blinded monster misses half its bites; a weakened one bites softer
      if (m.blind > 0 && Math.random() < 0.5) {
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
      if (r.died) {
        player.target = null;
        player.attack = null;
        player.cast = null;
        burning.t = 0;
        return;
      }
      // metal: part of the bite goes back at the biter
      if (hero.stats.reflect > 0) {
        const back = Math.round(bite.dmg * hero.stats.reflect);
        const d = Math.hypot(m.x - player.x, m.y - player.y) || 1;
        if (back > 0) combat.apply(m, { dmg: back, crit: false, magic: false, miss: false }, { x: (m.x - player.x) / d, y: (m.y - player.y) / d }, 0);
      }
      // an ice, mud or dark bite may leave an ailment, less likely the better the player's
      // defence in that element, shorter with plant, none at plant 50
      const ail = m.element ? AILMENTS[m.element] : undefined;
      const plant = hero.progress.elements.plant ?? 0;
      if (ail && plant < 50 && Math.random() < 0.15 * Math.max(0, 1 - hero.stats[`${m.element!}Def`] / 100)) {
        hero.addBuff(`ail_${m.element}`, ail.name, ail.stats, ail.t * (1 - 0.01 * plant));
        floaters.add(player.x, player.y, 140, ail.name, "hurt");
      }
      // some bites slow, turn to stone for a moment or set alight
      for (const a of m.ails) {
        if (Math.random() >= 0.2) continue;
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
        const a = Math.random() * Math.PI * 2, v = variantOf(def, def.levels[0]);
        const c = new Monster(v, { x: m.x + Math.cos(a) * (m.radius + 120), y: m.y + Math.sin(a) * (m.radius + 120) }, monLooks.of(v));
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

  function frame(now: number): void {
    if (travelling) {
      last = now;
      requestAnimationFrame(frame);
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    fps += (1 / Math.max(dt, 1e-3) - fps) * 0.05;

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
      // back on your feet in the city, like Ragnarok's save point
      if (current.id !== "eden") void enterMap("eden");
      player.x = SPAWN.x;
      player.y = SPAWN.y;
      floaters.add(player.x, player.y, 140, "ฟื้นแล้ว", "heal");
    }
    // the bot walks when the keys don't
    if (fwd || left) {
      bot.noteManual();
      walkTo = null;
    }
    potionCd = Math.max(0, potionCd - dt);
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
    for (const n of npcs) n.update(dt, player);
    if (shopUI.open && shopKeeper && shopKeeper.distance(player) > TALK_RANGE * 2.5) shopUI.toggle(false);
    player.dead = !hero.alive;
    player.speedMul = 1 + hero.stats.move;
    player.hurtFlash = hero.hurt;
    const w = weaponStats(inv.equipped.weapon, hero.stats);
    const offW = offhandWeapon(inv.equipped.offhand);
    if (offW) w.interval *= DUAL_WIELD_SLOWDOWN; // two weapons swing a little slower
    const was = { x: player.x, y: player.y };
    if (player.update(dt, player.dead ? { x: 0, y: 0 } : move, w) && hero.alive) combat.strike(player, inv.equipped.weapon, offW);
    // a walk that stops getting anywhere (held up by a fight, or by someone in the way) ends
    if (walkTo && !fwd && !left) {
      walkTo.stuck = Math.hypot(player.x - was.x, player.y - was.y) < 0.5 ? walkTo.stuck + dt : 0;
      if (walkTo.stuck > 1.2) walkTo = null;
    }
    for (const m of monsters) m.update(dt, monsterCtx);
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
        if (r.lost) floaters.add(player.x, player.y, 110, `-${Math.round(r.lost)}`, "hurt");
        if (r.died) burning.t = 0;
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
    progress.hotbar.forEach((id, i) => hud.setCooldown(i, id ? hero.cooldowns.get(id) ?? 0 : 0, id ? hero.cdTotal.get(id) ?? 1 : 1));
    vitals.update();
    uiClock += dt;
    if (uiClock > 0.25) {
      uiClock = 0;
      statusUI.render();
      botUI.tick();
      deathNote.classList.toggle("hidden", hero.alive);
      if (!hero.alive) deathNote.textContent = `ล้มลงแล้ว · ฟื้นที่จุดเกิดในอีก ${Math.ceil(hero.dead)} วินาที`;
    }

    // ---- camera: follow the player ----
    const k = screen.zoom * screen.dpr * screen.far;
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
    w3d.setRing(player.target?.alive ? player.target : bot.on && bot.target?.alive ? bot.target
      : walkTo && !walkTo.npc ? walkTo.path[walkTo.path.length - 1] ?? null : null);
    const inHand = inv.equipped.weapon ? weapons[inv.equipped.weapon as WeaponId] : null;
    const offItem = inv.equipped.offhand ? ITEMS[inv.equipped.offhand] : null;
    const inOff = offItem?.weapon ? weapons[offItem.weapon] : offItem?.art ? offhandArt[offItem.art] : null;
    // each character a billboard drawn by its own 2D code (only those near the screen)
    const onScreen = (x: number, y: number, pad: number) => {
      const sx = mapX(x, y) * k + vw.ox, sy = mapY(x, y) * k + vw.oy;
      return sx > -pad * k && sx < vw.w + pad * k && sy > -pad * k && sy < vw.h + pad * k * 2;
    };
    w3d.beginActors();
    for (const m of monsters) {
      if (m.state === "gone" || !onScreen(m.x, m.y, 200)) continue;
      w3d.actor(m, { x: m.x, y: m.y, ...m.board }, vw, (c, v) => m.draw(c, v));
    }
    for (const n of npcs) {
      if (!onScreen(n.x, n.y, 300)) continue;
      const near = n.distance(player) <= TALK_RANGE * 1.6;
      // talking ones need room above the head for the balloon
      w3d.actor(n, { x: n.x, y: n.y, w: 300, h: n.bubble ? 360 : 240, foot: 30 }, vw, (c, v) => n.draw(c, v, near));
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
    floaters.draw(ctx, vw);

    mapUI.frame(dt, { player, facing: player.facing(), yaw, npcs, monsters, route: walkTo?.path.length ? [player, ...walkTo.path] : null });
    if (showDebug) drawDebug(vw, player, fx, fps);
    requestAnimationFrame(frame);
  }

  // Exposed for automated checks and console poking.
  (window as unknown as { __game: unknown }).__game = { player, fx, spells, useSlot, inv, monsters, combat, look, looks, applyLook, invUI, quickAttack, directionIndex,
    progress, hero, skills, statusUI, skillUI, picker, turnCamera, world: w3d, bot, botUI, shopUI, mapUI, drink, enterMap,
    get npcs() { return npcs; }, get map() { return current; }, get walk() { return walkTo; },
    zoomOut: (f: number) => (screen.far = 1 / f), nav: { findPath, blocked, solids: SOLIDS } };

  // Where the character stands, for the next session: every couple of seconds while alive, and
  // when the page goes away (closing the tab, or back to the title, which reloads it).
  let placeSaved = "", placeSavedAt = 0;
  function savePlace(): void {
    placeSavedAt = performance.now();
    if (!hero.alive) return; // the dead get up in Eden; keep where they last stood alive
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


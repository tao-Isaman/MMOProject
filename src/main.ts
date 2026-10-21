import { MAP_W, MAP_H, mapX, mapY, groundFromMap, fromView, setYaw, yaw } from "./projection";
import { loadAll, loadImage, mipChain, bakeGround, glow, tint } from "./assets";
import { Occluders } from "./occluders";
import { SPAWN, debugShapes } from "./world";
import { Particles, GROUND_GLOW, SORTED, AIR_GLOW } from "./particles";
import { Player, directionIndex } from "./player";
import { SkillBar, slotForCode } from "./hud";
import { Motes } from "./motes";
import { ITEMS, WEAPON_TYPES, DYES } from "./items";
import type { WeaponId } from "./items";
import { Inventory } from "./inventory";
import { InventoryUI, WardrobeUI, loadLook } from "./ui";
import type { Look } from "./ui";
import { Combat, Floaters, weaponStats, attackRange } from "./combat";
import { slimeSheets, spawnMonsters, rollDrops } from "./monsters";
import type { Monster, MonsterCtx } from "./monsters";
import { Looks } from "./look";
import type { BodyDef, HairData } from "./look";
import { WEAPON_ART } from "./weapons";
import type { WeaponArt } from "./weapons";
import { dyePixel, mapColors, rgbToHsl } from "./recolor";
import type { Dye } from "./recolor";
import { Progress, ACTIVES } from "./progression";
import { Hero } from "./hero";
import { Skills } from "./skills";
import { monsterDamage } from "./stats";
import { Vitals, ClassPicker, StatusUI, SkillUI, skillTip } from "./charui";
import { icon } from "./icons";
import { Bot } from "./bot";
import { BotUI } from "./botui";
import type { FlowerSpell } from "./spell";
import type { OccluderData } from "./occluders";
import type { Atlas, Img, Textures, View } from "./types";

const MOVE_KEYS: Record<string, [number, number]> = {
  KeyW: [1, 0], ArrowUp: [1, 0],
  KeyS: [-1, 0], ArrowDown: [-1, 0],
  KeyA: [0, 1], ArrowLeft: [0, 1],
  KeyD: [0, -1], ArrowRight: [0, -1],
};

const ICON = 40; // inventory icon size, css px

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
let showDebug = new URLSearchParams(location.search).has("debug");

const screen = { w: 0, h: 0, dpr: 1, zoom: 1 };
function resize() {
  screen.dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = Math.round(w * screen.dpr);
  canvas.height = Math.round(h * screen.dpr);
  screen.w = w;
  screen.h = h;
  // show about 15 x 9 m of the courtyard (map pixels are centimetres)
  screen.zoom = Math.max(0.5, Math.min(w / 1500, h / 900));
}

// Smallest mip level whose cells are still at least r device pixels wide.
function mipFor(atlas: Atlas, r: number): number {
  const cell = atlas.levels[0].width / atlas.cols;
  let level = 0;
  while (level + 1 < atlas.levels.length && cell / 2 ** (level + 1) >= r) level++;
  return level;
}

// An item icon: the art fitted into a square canvas (long weapons lie diagonally, like RO).
function makeIcon(img: Img, { diagonal = false, dye = null as Dye | null } = {}): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const dpr = 2;
  c.width = c.height = ICON * dpr;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  // dye only the grey cloth, not the gold trim or the outline
  const src = dye ? mapColors(img, (r, gg, b) => {
    const [, sat, l] = rgbToHsl(r, gg, b);
    return sat < 0.2 && l > 0.25 ? dyePixel(r, gg, b, dye) : null;
  }) : img;
  const size = ICON * dpr * 0.86;
  if (diagonal) {
    const s = size / Math.hypot(img.width, img.height) * 1.0;
    g.translate(c.width / 2, c.height / 2);
    g.rotate(Math.PI / 4);
    g.drawImage(src, (-img.width * s) / 2, (-img.height * s) / 2, img.width * s, img.height * s);
  } else {
    const s = size / Math.max(img.width, img.height);
    g.drawImage(src, (c.width - img.width * s) / 2, (c.height - img.height * s) / 2, img.width * s, img.height * s);
  }
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
    map: "assets/maps/map_y0.jpg",
    flowers: "assets/flower_atlas.png",
    petals: "assets/petal_atlas.png",
    rune: "assets/rune_circle.png",
    ring: "assets/ring_glow.png",
    icon: "assets/icon_flower.png",
    slime_idle: "assets/slime_idle.png",
    slime_hop: "assets/slime_hop.png",
    slime_hurt: "assets/slime_hurt.png",
    slime_die: "assets/slime_die.png",
    coat: "assets/items/coat.png",
    legs: "assets/items/legs.png",
    jelly: "assets/items/jelly.png",
    sprout: "assets/items/sprout.png",
    arrow: "assets/items/arrow.png",
  };
  const weaponIds = Object.keys(WEAPON_TYPES) as WeaponId[];
  const weaponArt = new Set(weaponIds.map((t) => WEAPON_ART[t].art ?? t));
  for (const id of weaponArt) files[`weapon_${id}`] = `assets/weapons/${id}.png`;
  const [images, bodies, hair, occluderData] = await Promise.all([
    loadAll(files, (f) => (bar.value = f)),
    fetch("assets/chars/bodies.json").then((r) => r.json() as Promise<Record<string, BodyDef>>),
    fetch("assets/chars/hair.json").then((r) => r.json() as Promise<HairData>),
    fetch("assets/maps/occluders.json").then((r) => (r.ok ? (r.json() as Promise<OccluderData>) : null)).catch(() => null),
  ]);

  // stitched Oriverse capture; the scale allows tiles captured below 1 px per cm
  const map: { image: Img; scale: number } = { image: images.map, scale: images.map.width / MAP_W };
  // the other camera angles load on first use (assets/maps/map_y<yaw>.jpg)
  const maps: Promise<Img>[] = [Promise.resolve(images.map)];
  const mapFor = (k: number) => (maps[k] ??= loadImage(`assets/maps/map_y${k}.jpg`));
  const occluders = new Occluders(occluderData);
  occluders.load(0);

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

  // ---- inventory, character, looks, icons ----
  const inv = new Inventory();
  const progress = new Progress();
  const hero = new Hero(progress, () => inv.equipped.weapon);
  const looks = new Looks({ bodies, hair });
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
    } else if (item.kind === "costume") {
      // the costume's body in its own colours, filled in once its sheet has loaded
      const cv = (c = document.createElement("canvas"));
      cv.width = cv.height = ICON * 2;
      looks.build(look, { weapon: null, costume: id, top: null, bottom: null }, ["idle"]).then(({ sheets }) => {
        const art = trimmed(sheets.idle, 7);
        const s = (cv.width * 0.94) / Math.max(art.width, art.height);
        const g = cv.getContext("2d")!;
        g.imageSmoothingEnabled = false;
        g.drawImage(art, (cv.width - art.width * s) / 2, (cv.height - art.height * s) / 2, art.width * s, art.height * s);
        invUI.render();
      });
    } else if (item.kind === "book") {
      c = document.createElement("canvas");
      c.width = c.height = ICON * 2;
      c.getContext("2d")!.drawImage(icon(item.icon.glyph ?? "star", item.icon.color ?? "#c9a86a"), 4, 4, c.width - 8, c.height - 8);
    } else if (item.kind === "top") c = makeIcon(images.coat, { dye: DYES[item.dye!] });
    else if (item.kind === "bottom") c = makeIcon(images.legs, { dye: item.dye === "black" ? { hue: 250, sat: 0.2, light: -0.55 } : { ...DYES[item.dye!], light: -0.45 } });
    else c = makeIcon(images[item.icon.sheet ?? "jelly"]);
    icons.set(id, c);
    return c;
  };

  // ---- world ----
  const fx = new Particles();
  const player = new Player(SPAWN.x, SPAWN.y, first.sheets, first.hands, glow("rgba(255, 110, 120, 1)"));
  player.builtin = first.builtin;
  applyLook();
  const motes = new Motes(fx, glow("rgba(232, 255, 112, 1)"));
  motes.update(0, { x: player.x, y: player.y });
  motes.prewarm();
  const spells: FlowerSpell[] = [];
  const floaters = new Floaters();
  const monsters = spawnMonsters(slimeSheets({
    idle: images.slime_idle, hop: images.slime_hop, hurt: images.slime_hurt, die: images.slime_die,
  }));
  const combat = new Combat({
    fx, tex, floaters, monsters, hero,
    onKill(m) {
      let got = 0;
      for (const id of rollDrops(m.variant, hero.stats.drop)) {
        const left = inv.add(id, 1);
        if (!left) got++;
        floaters.add(m.x, m.y, m.height + 20, left ? "กระเป๋าเต็ม" : `+ ${ITEMS[id].name}`, left ? "info" : "loot");
      }
      // experience shrinks for monsters far below the player's level
      const gap = progress.level - m.level;
      const xp = Math.max(1, Math.round(m.variant.xp * Math.max(0.1, Math.min(1, 1 - (gap - 5) * 0.1)) * (1 + hero.stats.xpPct)));
      floaters.add(m.x, m.y, m.height + 45, `+${xp} EXP`, "loot");
      bot.noteKill(xp, got);
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
  progress.onChange(() => {
    refreshBar();
    hero.recompute();
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
  });

  const invUI = new InventoryUI(inv, iconFor, (i) => {
    const stack = inv.slots[i];
    if (!stack) return "";
    const msg = progress.readBook(stack.id);
    if (!msg) return "อ่านเล่มนี้ไปแล้ว";
    stack.count -= 1;
    if (stack.count <= 0) inv.slots[i] = null;
    inv.changed();
    statusUI.render();
    skillUI.render();
    return `ปลดล็อค${msg}แล้ว`;
  });

  // ---- character windows ----
  const vitals = new Vitals(document.getElementById("vitals")!, progress, hero);
  const picker = new ClassPicker((cls) => {
    const first = !progress.cls;
    const level = progress.level, xp = progress.xp, unlocked = progress.unlocked;
    progress.reset(cls);
    if (!first) Object.assign(progress, { level, xp, unlocked });
    progress.changed();
    hero.refill();
    // a new character starts with the class's weapon in hand
    if (first && inv.equipped.weapon !== CLASS_WEAPON[cls]) {
      const i = inv.slots.findIndex((s) => s?.id === CLASS_WEAPON[cls]);
      if (i >= 0) inv.equip(i);
    }
  });
  const CLASS_WEAPON = { mage: "staff", warrior: "sword_1h" };
  const statusUI = new StatusUI(progress, hero, () => picker.show());
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
  const wardrobe = new WardrobeUI(look, drawPreview, () => applyLook(), looks.hairstyles, (lk) => looks.note(lk, inv.equipped));
  inv.onChange(() => {
    applyLook();
    hero.recompute();
    if (!wardrobe.win.classList.contains("hidden")) wardrobe.sync();
  });

  // Wardrobe preview: the idle frame of the chosen direction, recoloured, scaled up.
  let previewSeq = 0;
  async function drawPreview(cv: HTMLCanvasElement, lk: Look, turn: number): Promise<void> {
    const seq = ++previewSeq;
    const { sheets } = await looks.build(lk, inv.equipped, ["idle"]);
    if (seq !== previewSeq) return;
    const g = cv.getContext("2d")!;
    const cell = sheets.idle.height / 8;
    g.clearRect(0, 0, cv.width, cv.height);
    g.imageSmoothingEnabled = false;
    g.drawImage(sheets.idle, 0, turn * cell, cell, cell, 0, 0, cv.width, cv.height);
  }

  // The ground point under the mouse, or null without a mouse.
  function aimPoint(): { x: number; y: number } | null {
    if (!pointer || !view) return null;
    const p = toMap(pointer);
    return groundFromMap(p.x, p.y);
  }

  let denyText = 0;
  function useSlot(i: number): void {
    const id = progress.hotbar[i];
    const aim = aimPoint() ?? (player.target?.alive ? player.target : null);
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
      player.startAttack(w, groundFromMap(p.x, p.y));
      return;
    }
    let best = null, bestD = attackRange(w) + 40;
    for (const m of monsters) {
      if (!m.alive) continue;
      const d = Math.hypot(m.x - player.x, m.y - player.y) - m.radius;
      if (d < bestD) {
        best = m;
        bestD = d;
      }
    }
    player.target = null;
    player.startAttack(w, best);
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
    if (e.code === "KeyC" && !e.repeat) wardrobe.toggle();
    if (e.code === "KeyP" && !e.repeat) statusUI.toggle();
    if (e.code === "KeyK" && !e.repeat) skillUI.toggle();
    if (e.code === "KeyB" && !e.repeat) botUI.toggle();
    if (e.code === "Escape") {
      invUI.toggle(false);
      wardrobe.toggle(false);
      statusUI.toggle(false);
      skillUI.toggle(false);
      botUI.toggle(false);
    }
    if (e.code === "Backquote") showDebug = !showDebug;
    if ((e.code === "KeyQ" || e.code === "KeyE") && !e.repeat) rotateCamera(e.code === "KeyQ" ? -1 : 1);
  });
  const buttons: [string, () => void][] = [["btn-inventory", () => invUI.toggle()], ["btn-wardrobe", () => wardrobe.toggle()],
    ["btn-status", () => statusUI.toggle()], ["btn-skills", () => skillUI.toggle()],
    ["btn-bot", () => botUI.toggle()], ["btn-auto", () => bot.toggle()]];
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
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !view || !hero.alive) return;
    bot.noteManual();
    const { x: mx, y: my } = toMap(e);
    const m = monsters.find((mon) => mon.contains(mx, my));
    if (m) {
      player.target = m;
      return;
    }
    player.target = null;
    player.startAttack(weaponStats(inv.equipped.weapon, hero.stats), groundFromMap(mx, my));
  });
  window.addEventListener("keyup", (e) => held.delete(e.code));
  window.addEventListener("blur", () => held.clear());

  resize();
  window.addEventListener("resize", resize);

  const cam = { x: mapX(player.x, player.y), y: mapY(player.x, player.y) - 50 };
  const hint = document.getElementById("hint");
  let walkedFor = 0;
  let uiClock = 0;

  // ---- camera turns in 90 degree steps (Q / E) ----
  let turning: { t: number; dur: number; snap: HTMLCanvasElement; delta: number } | null = null, turnBusy = false;
  const turnBuf = document.createElement("canvas");
  async function rotateCamera(delta: number): Promise<void> {
    if (turning || turnBusy) return;
    turnBusy = true;
    const k = (yaw + delta + 4) % 4;
    try {
      const [img] = await Promise.all([mapFor(k), occluders.load(k)]);
      const snap = document.createElement("canvas");
      snap.width = canvas.width;
      snap.height = canvas.height;
      snap.getContext("2d")!.drawImage(canvas, 0, 0);
      setYaw(k);
      map.image = img;
      map.scale = img.width / MAP_W;
      cam.x = mapX(player.x, player.y);
      cam.y = mapY(player.x, player.y) - 50;
      turning = { t: 0, dur: 0.45, snap, delta };
    } catch {
      floaters.add(player.x, player.y, 150, "มุมกล้องนี้ยังโหลดไม่ได้", "info");
    }
    turnBusy = false;
  }
  // The new view swings in from the side while the old one swings out and fades.
  function drawTurn(dt: number): void {
    const tr = turning;
    if (!tr) return;
    tr.t += dt;
    const u = Math.min(1, tr.t / tr.dur), e = 1 - (1 - u) ** 3;
    if (turnBuf.width !== canvas.width || turnBuf.height !== canvas.height) {
      turnBuf.width = canvas.width;
      turnBuf.height = canvas.height;
    }
    const tb = turnBuf.getContext("2d")!;
    tb.setTransform(1, 0, 0, 1, 0, 0);
    tb.drawImage(canvas, 0, 0);
    const cx = canvas.width / 2, cy = canvas.height / 2, q = (tr.delta * Math.PI) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#16210f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const spin = (img: Img, a: number, alpha: number) => {
      ctx.globalAlpha = alpha;
      ctx.setTransform(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), cx, cy);
      ctx.drawImage(img, -cx, -cy);
    };
    spin(turnBuf, -q * (1 - e), 1);
    spin(tr.snap, q * e, 1 - e);
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (u >= 1) turning = null;
  }
  const deathNote = document.getElementById("death")!;
  // what monsters need from the player: where to chase and how a bite lands
  const monsterCtx: MonsterCtx = {
    player,
    hero,
    bite(m: Monster) {
      const dmg = monsterDamage(m.atk, hero.stats);
      const r = hero.takeDamage(dmg);
      if (r.absorbed) floaters.add(player.x, player.y, 120, `-${Math.round(r.absorbed)}`, "shield");
      if (r.lost) floaters.add(player.x, player.y, 110, `-${Math.round(r.lost)}`, "hurt");
      if (r.died) {
        player.target = null;
        player.attack = null;
        player.cast = null;
      }
    },
  };
  let last = performance.now();
  let fps = 60;

  function frame(now: number): void {
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
    let move = fromView(fwd, left);
    if (hero.update(dt) === "respawn") {
      player.x = SPAWN.x;
      player.y = SPAWN.y;
      floaters.add(player.x, player.y, 140, "ฟื้นแล้ว", "heal");
    }
    // the bot walks when the keys don't
    if (fwd || left) bot.noteManual();
    const auto = bot.update(dt);
    if (!fwd && !left && bot.on) move = auto;
    player.dead = !hero.alive;
    player.speedMul = 1 + hero.stats.move;
    player.hurtFlash = hero.hurt;
    const w = weaponStats(inv.equipped.weapon, hero.stats);
    if (player.update(dt, player.dead ? { x: 0, y: 0 } : move, w) && hero.alive) combat.strike(player, inv.equipped.weapon);
    if (player.moving) {
      walkedFor += dt;
      if (walkedFor > 1.5) hint?.classList.add("faded");
    }
    for (const m of monsters) m.update(dt, monsterCtx);
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

    // ---- camera: follow the player, stay inside the map ----
    const k = screen.zoom * screen.dpr;
    const halfW = screen.w / screen.zoom / 2, halfH = screen.h / screen.zoom / 2;
    const tx = mapX(player.x, player.y), ty = mapY(player.x, player.y) - 50;
    const ease = 1 - Math.exp(-dt * 6);
    cam.x += (tx - cam.x) * ease;
    cam.y += (ty - cam.y) * ease;
    cam.x = halfW * 2 >= MAP_W ? MAP_W / 2 : Math.max(halfW, Math.min(MAP_W - halfW, cam.x));
    cam.y = halfH * 2 >= MAP_H ? MAP_H / 2 : Math.max(halfH, Math.min(MAP_H - halfH, cam.y));
    const vw: View = {
      k,
      ox: Math.round(canvas.width / 2 - cam.x * k),
      oy: Math.round(canvas.height / 2 - cam.y * k),
      w: canvas.width,
      h: canvas.height,
      mipFor,
    };
    view = vw;

    // ---- draw ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#16210f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "low"; // textures carry their own mip levels

    // visible part of the map
    const x0 = Math.max(0, -vw.ox / k), y0 = Math.max(0, -vw.oy / k);
    const x1 = Math.min(MAP_W, (canvas.width - vw.ox) / k), y1 = Math.min(MAP_H, (canvas.height - vw.oy) / k);
    if (x1 > x0 && y1 > y0) {
      const s = map.scale;
      ctx.drawImage(map.image, x0 * s, y0 * s, (x1 - x0) * s, (y1 - y0) * s,
        x0 * k + vw.ox, y0 * k + vw.oy, (x1 - x0) * k, (y1 - y0) * k);
    }

    ctx.globalCompositeOperation = "lighter";
    fx.draw(ctx, vw, fx.layer(GROUND_GLOW));
    ctx.globalCompositeOperation = "source-over";

    // the bot's hunting area
    if (bot.on || botUI.open) {
      const a = bot.on ? bot.anchor : player;
      ctx.save();
      ctx.setLineDash([10 * k, 8 * k]);
      ctx.strokeStyle = "rgba(244, 210, 122, 0.45)";
      ctx.lineWidth = 2 * k;
      ctx.beginPath();
      const r = bot.settings.radius;
      ctx.ellipse(mapX(a.x, a.y) * k + vw.ox, mapY(a.x, a.y) * k + vw.oy, r * k, r * Math.SQRT1_2 * k, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // target ring under the slime being attacked (or the one the bot is heading for)
    const ringed = player.target?.alive ? player.target : bot.on && bot.target?.alive ? bot.target : null;
    if (ringed) {
      const t = ringed;
      ctx.strokeStyle = "rgba(255, 214, 120, 0.9)";
      ctx.lineWidth = 2.5 * k;
      ctx.beginPath();
      ctx.ellipse(mapX(t.x, t.y) * k + vw.ox, mapY(t.x, t.y) * k + vw.oy, 34 * k, 15 * k, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // characters, flowers and petals sorted by their ground point
    const sorted = fx.layer(SORTED);
    for (const p of sorted) p.depth = mapY(p.x, p.y);
    sorted.sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));
    const inHand = inv.equipped.weapon ? weapons[inv.equipped.weapon as WeaponId] : null;
    // the player's box on the map, to see which cutouts hide them
    const pb = { x: mapX(player.x, player.y) - 40, y: mapY(player.x, player.y) - 140, w: 80, h: 140 };
    const actors = [...monsters.map((m) => ({ depth: m.depth, draw: () => m.draw(ctx, vw) })),
      { depth: player.depth, draw: () => player.draw(ctx, vw, inHand) },
      ...occluders.items.map((it) => {
        const hides = player.depth < it.depth && pb.x < it.mx + it.w && pb.x + pb.w > it.mx && pb.y < it.my + it.h && pb.y + pb.h > it.my
          && occluders.covers(it, pb);
        return { depth: it.depth, draw: () => occluders.draw(ctx, vw, it, hides) };
      })];
    actors.sort((a, b) => a.depth - b.depth);
    let from = 0;
    for (const a of actors) {
      let to = from;
      while (to < sorted.length && (sorted[to].depth ?? 0) <= a.depth) to++;
      if (to > from) fx.draw(ctx, vw, sorted.slice(from, to));
      from = to;
      a.draw();
    }
    if (from < sorted.length) fx.draw(ctx, vw, sorted.slice(from));

    combat.draw(ctx, vw, images.arrow);
    ctx.globalCompositeOperation = "lighter";
    fx.draw(ctx, vw, fx.layer(AIR_GLOW));
    ctx.globalCompositeOperation = "source-over";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    floaters.draw(ctx, vw);

    if (turning) drawTurn(dt);
    if (showDebug) drawDebug(vw, player, fx, fps);
    requestAnimationFrame(frame);
  }

  // Exposed for automated checks and console poking.
  (window as unknown as { __game: unknown }).__game = { player, fx, spells, useSlot, inv, monsters, combat, look, looks, applyLook, invUI, wardrobe, quickAttack, directionIndex,
    progress, hero, skills, statusUI, skillUI, picker, rotateCamera, occluders, bot, botUI };

  document.getElementById("loading")?.classList.add("done");
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


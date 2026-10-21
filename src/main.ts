import { mapX, mapY, groundFromMap, fromView, setYaw, yaw } from "./projection";
import { loadAll, mipChain, bakeGround, glow, tint } from "./assets";
import { Scene } from "./scene";
import { SPAWN, debugShapes } from "./world";
import { Particles, GROUND_GLOW, SORTED, AIR_GLOW } from "./particles";
import { Player, directionIndex } from "./player";
import { SkillBar, slotForCode } from "./hud";
import { Motes } from "./motes";
import { ITEMS, WEAPON_TYPES, DYES, SHAPES, DUAL_WIELD_SLOWDOWN, offhandWeapon } from "./items";
import type { OffhandArt } from "./items";
import type { WeaponId } from "./items";
import { Inventory } from "./inventory";
import { InventoryUI, loadLook } from "./ui";
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
import { Title } from "./title";
import { useCharacter, loadRoster, touchCharacter } from "./save";
import { Npc, ShopUI, MERCHANT, TALK_RANGE } from "./shop";
import { findPath } from "./world";
import { RADIUS } from "./player";
import { BotUI } from "./botui";
import { detectTouch, onTouchMode, goLandscape, Joystick } from "./touch";
import type { FlowerSpell } from "./spell";
import type { SceneData } from "./scene";
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
    coat: "assets/items/coat.png",
    legs: "assets/items/legs.png",
    jelly: "assets/items/jelly.png",
    sprout: "assets/items/sprout.png",
    arrow: "assets/items/arrow.png",
    merchant: "assets/npc/merchant_idle.png",
  };
  const weaponIds = Object.keys(WEAPON_TYPES) as WeaponId[];
  const weaponArt = new Set(weaponIds.map((t) => WEAPON_ART[t].art ?? t));
  for (const id of weaponArt) files[`weapon_${id}`] = `assets/weapons/${id}.png`;
  const [images, bodies, hair, sceneData] = await Promise.all([
    loadAll(files, (f) => (bar.value = f)),
    fetch("assets/chars/bodies.json").then((r) => r.json() as Promise<Record<string, BodyDef>>),
    fetch("assets/chars/hair.json").then((r) => r.json() as Promise<HairData>),
    fetch("assets/maps/scene.json").then((r) => (r.ok ? (r.json() as Promise<SceneData>) : null)).catch(() => null),
  ]);
  // the courtyard: rotating ground plus standing props (src/scene.ts)
  const scene = new Scene(sceneData);
  await scene.load();

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

  // ---- title screen: which character to play ----
  detectTouch();
  const looks = new Looks({ bodies, hair });
  document.getElementById("loading")?.classList.add("done");
  const charId = await new Title(looks).run();
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
      // a plain shirt or trousers until the garment's own half of its body has loaded
      const slot = item.kind;
      c = slot === "top" ? makeIcon(images.coat, { dye: DYES[item.dye ?? "white"] })
        : makeIcon(images.legs, { dye: item.dye === "black" || !item.dye ? { hue: 250, sat: 0.2, light: -0.55 } : { ...DYES[item.dye], light: -0.45 } });
      const cv = c;
      looks.garmentArt(slot, item.shape!, item.dye ?? null).then((art) => {
        if (!art) return;
        const t = trimmed(art, 0, Math.max(art.width, art.height));
        const g = cv.getContext("2d")!;
        g.clearRect(0, 0, cv.width, cv.height);
        g.imageSmoothingEnabled = false;
        const s = (cv.width * 0.92) / Math.max(t.width, t.height);
        g.drawImage(t, (cv.width - t.width * s) / 2, (cv.height - t.height * s) / 2, t.width * s, t.height * s);
        window.dispatchEvent(new Event("item-icons"));
      });
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

  // ---- world ----
  const fx = new Particles();
  const player = new Player(SPAWN.x, SPAWN.y, first.sheets, first.hands, glow("rgba(255, 110, 120, 1)"));
  player.builtin = first.builtin;
  applyLook();
  const merchant = new Npc(MERCHANT, images.merchant);
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
      const gold = Math.round((1.5 + Math.random() * 2) * m.level * (1 + hero.stats.drop)) + 1;
      inv.gold += gold;
      floaters.add(m.x, m.y, m.height + 70, `+${gold} ทอง`, "level");
      for (const id of rollDrops(m.variant, hero.stats.drop)) {
        const left = inv.add(id, 1);
        if (!left) got++;
        floaters.add(m.x, m.y, m.height + 20, left ? "กระเป๋าเต็ม" : `+ ${ITEMS[id].name}`, left ? "info" : "loot");
      }
      // experience shrinks for monsters far below the player's level
      const gap = progress.level - m.level;
      const xp = Math.max(1, Math.round(m.variant.xp * Math.max(0.1, Math.min(1, 1 - (gap - 5) * 0.1)) * (1 + hero.stats.xpPct)));
      floaters.add(m.x, m.y, m.height + 45, `+${xp} EXP`, "loot");
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
    if (first && inv.equipped.weapon !== CLASS_WEAPON[cls]) {
      const i = inv.slots.findIndex((s) => s?.id === CLASS_WEAPON[cls]);
      if (i >= 0) inv.equip(i);
    }
  });
  const CLASS_WEAPON = { mage: "staff", warrior: "sword_1h" };
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
  // walking over to the merchant after a click on her (path around the solids)
  let toMerchant: { path: { x: number; y: number }[] } | null = null;
  function talkToMerchant(): void {
    if (merchant.distance(player) <= TALK_RANGE) {
      toMerchant = null;
      shopUI.toggle(true);
      return;
    }
    const goal = { x: merchant.x - 90, y: merchant.y };
    toMerchant = { path: findPath(player, goal, RADIUS) ?? [] };
  }
  inv.onChange(() => {
    applyLook();
    hero.recompute();
  });

  // The ground point under the mouse, or null without a mouse.
  function aimPoint(): { x: number; y: number } | null {
    if (!pointer || !view) return null;
    const p = toMap(pointer);
    return groundFromMap(p.x, p.y);
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
      player.startAttack(w, groundFromMap(p.x, p.y));
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
    toMerchant = null;
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
    if (e.code === "KeyF" && !e.repeat) {
      if (shopUI.open) shopUI.toggle(false);
      else if (merchant.distance(player) <= TALK_RANGE * 1.6) talkToMerchant();
    }
    if (e.code === "Escape") {
      invUI.toggle(false);
      statusUI.toggle(false);
      skillUI.toggle(false);
      botUI.toggle(false);
      shopUI.toggle(false);
    }
    if (e.code === "Backquote") showDebug = !showDebug;
    if ((e.code === "KeyQ" || e.code === "KeyE") && !e.repeat) rotateCamera(e.code === "KeyQ" ? -1 : 1);
  });
  const buttons: [string, () => void][] = [["btn-inventory", () => invUI.toggle()],
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
  // A click or tap on the game: the merchant, a monster to chase, or a swing toward the ground.
  function tapAt(e: { clientX: number; clientY: number }): void {
    if (!view || !hero.alive) return;
    bot.noteManual();
    const { x: mx, y: my } = toMap(e);
    if (merchant.contains(mx, my)) {
      player.target = null;
      talkToMerchant();
      return;
    }
    toMerchant = null;
    const m = monsters.find((mon) => mon.contains(mx, my));
    if (m) {
      player.target = m;
      return;
    }
    player.target = null;
    player.startAttack(weaponStats(inv.equipped.weapon, hero.stats), groundFromMap(mx, my));
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch" && e.button === 0) tapAt(e);
  });
  window.addEventListener("keyup", (e) => held.delete(e.code));
  window.addEventListener("blur", () => held.clear());

  resize();
  window.addEventListener("resize", resize);

  const cam = { x: mapX(player.x, player.y), y: mapY(player.x, player.y) - 50 };
  let uiClock = 0;

  // ---- the camera turns freely: drag with the right mouse button, or Q / E for 45 degrees ----
  let turnTo: { from: number; to: number; t: number } | null = null;
  function turnCamera(a: number): void {
    setYaw(a);
    // the follow camera works in map coordinates, which turn with the view: jump to the player
    cam.x = mapX(player.x, player.y);
    cam.y = mapY(player.x, player.y) - 50;
  }
  function rotateCamera(delta: number): void {
    if (!scene.turns) {
      floaters.add(player.x, player.y, 150, "มุมกล้องยังหมุนไม่ได้", "info");
      return;
    }
    const step = Math.PI / 4, base = turnTo ? turnTo.to : yaw;
    turnTo = { from: yaw, to: (Math.round(base / step) + delta) * step, t: 0 };
    // turn the short way round
    while (turnTo.to - turnTo.from > Math.PI) turnTo.to -= Math.PI * 2;
    while (turnTo.from - turnTo.to > Math.PI) turnTo.to += Math.PI * 2;
  }
  let dragTurn: { x: number; yaw: number } | null = null;
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 2 || !scene.turns) return;
    turnTo = null;
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
      toMerchant = null;
      return;
    }
    swipes.set(e.pointerId, { x: e.clientX, y: e.clientY, yaw, turning: false });
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "touch") return;
    if (e.pointerId === stick.id) return stick.move(e);
    const s = swipes.get(e.pointerId);
    if (!s || !scene.turns) return;
    if (!s.turning && Math.abs(e.clientX - s.x) > 14) {
      s.turning = true;
      turnTo = null;
    }
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
    if (stick.active) {
      const s = stick.steps;
      fwd += s.fwd;
      left += s.left;
    }
    let move = fromView(fwd, left);
    if (hero.update(dt) === "respawn") {
      player.x = SPAWN.x;
      player.y = SPAWN.y;
      floaters.add(player.x, player.y, 140, "ฟื้นแล้ว", "heal");
    }
    // the bot walks when the keys don't
    if (fwd || left) {
      bot.noteManual();
      toMerchant = null;
    }
    potionCd = Math.max(0, potionCd - dt);
    const auto = bot.update(dt);
    if (!fwd && !left && bot.on) move = auto;
    if (toMerchant && !fwd && !left) {
      while (toMerchant.path.length > 1 && Math.hypot(toMerchant.path[0].x - player.x, toMerchant.path[0].y - player.y) < 25) toMerchant.path.shift();
      const next = toMerchant.path[0];
      if (!next || merchant.distance(player) <= TALK_RANGE - 20) {
        toMerchant = null;
        shopUI.toggle(true);
      } else move = { x: next.x - player.x, y: next.y - player.y };
    }
    merchant.update(dt, player);
    if (shopUI.open && merchant.distance(player) > TALK_RANGE * 2.5) shopUI.toggle(false);
    player.dead = !hero.alive;
    player.speedMul = 1 + hero.stats.move;
    player.hurtFlash = hero.hurt;
    const w = weaponStats(inv.equipped.weapon, hero.stats);
    const offW = offhandWeapon(inv.equipped.offhand);
    if (offW) w.interval *= DUAL_WIELD_SLOWDOWN; // two weapons swing a little slower
    if (player.update(dt, player.dead ? { x: 0, y: 0 } : move, w) && hero.alive) combat.strike(player, inv.equipped.weapon, offW);
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

    // ---- camera: Q / E turns ease over 0.35 s; follow the player ----
    if (turnTo) {
      turnTo.t = Math.min(1, turnTo.t + dt / 0.35);
      const e = 1 - (1 - turnTo.t) ** 3;
      turnCamera(turnTo.from + (turnTo.to - turnTo.from) * e);
      if (turnTo.t >= 1) turnTo = null;
    }
    const k = screen.zoom * screen.dpr;
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

    // ---- draw ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#16210f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "low"; // textures carry their own mip levels

    scene.drawGround(ctx, vw);

    ctx.globalCompositeOperation = "lighter";
    fx.draw(ctx, vw, fx.layer(GROUND_GLOW));
    ctx.globalCompositeOperation = "source-over";

    // the bot's hunting area
    if ((bot.on || botUI.open) && !bot.settings.wholeMap) {
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
    const offItem = inv.equipped.offhand ? ITEMS[inv.equipped.offhand] : null;
    const inOff = offItem?.weapon ? weapons[offItem.weapon] : offItem?.art ? offhandArt[offItem.art] : null;
    // the player's box on the map, to see which props hide them
    const pb = { x: mapX(player.x, player.y) - 40, y: mapY(player.x, player.y) - 140, w: 80, h: 140 };
    const actors = [...monsters.map((m) => ({ depth: m.depth, draw: () => m.draw(ctx, vw) })),
      { depth: player.depth, draw: () => player.draw(ctx, vw, inHand, inOff) },
      { depth: merchant.depth, draw: () => merchant.draw(ctx, vw, merchant.distance(player) <= TALK_RANGE * 1.6) },
      ...scene.place().map((p) => {
        const hides = player.depth < p.depth && scene.covers(p, pb);
        return { depth: p.depth, draw: () => scene.draw(ctx, vw, p, hides) };
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

    if (showDebug) drawDebug(vw, player, fx, fps);
    requestAnimationFrame(frame);
  }

  // Exposed for automated checks and console poking.
  (window as unknown as { __game: unknown }).__game = { player, fx, spells, useSlot, inv, monsters, combat, look, looks, applyLook, invUI, quickAttack, directionIndex,
    progress, hero, skills, statusUI, skillUI, picker, rotateCamera, turnCamera, scene, bot, botUI, shopUI, merchant, drink };

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


import { MAP_W, MAP_H, mapX, mapY, groundFromMap } from "./projection.js";
import { loadAll, mipChain, bakeGround, glow, tint } from "./assets.js";
import { SPAWN, debugShapes } from "./world.js";
import { Particles, GROUND_GLOW, SORTED, AIR_GLOW } from "./particles.js";
import { Player, directionIndex } from "./player.js";
import { FlowerSpell, CAST_TIME, HOVER_END } from "./spell.js";
import { SkillBar, slotForCode } from "./hud.js";
import { Motes } from "./motes.js";
import { ITEMS, WEAPON_TYPES, DYES } from "./items.js";
import { Inventory } from "./inventory.js";
import { InventoryUI, WardrobeUI, loadLook } from "./ui.js";
import { Combat, Floaters, weaponStats, attackRange } from "./combat.js";
import { slimeSheets, spawnMonsters, rollDrops } from "./monsters.js";
import { Looks } from "./look.js";
import { WEAPON_ART } from "./weapons.js";
import { dyePixel, mapColors, rgbToHsl } from "./recolor.js";

const SKILLS = [
  {
    name: "ทุ่งดอกไม้",
    icon: "assets/icon_flower.png",
    cast: CAST_TIME,
    cooldown: 9,
    // explicit breaks: Thai has no spaces to wrap at
    description:
      "ร่าย 1.5 วินาที · คูลดาวน์ 9 วินาที<br>วงเวทเปิดใต้เท้า ผู้ร่ายลอยขึ้น<br>ดอกไม้บานเป็นวงกว้างรอบตัว<br>แล้วสลายเป็นกลีบลอยขึ้นฟ้า",
  },
  null, null, null, null, null, null, null, null, null,
];

const MOVE_KEYS = {
  KeyW: [1, 0], ArrowUp: [1, 0],
  KeyS: [-1, 0], ArrowDown: [-1, 0],
  KeyA: [0, 1], ArrowLeft: [0, 1],
  KeyD: [0, -1], ArrowRight: [0, -1],
};

const ICON = 40; // inventory icon size, css px

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
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
function mipFor(atlas, r) {
  const cell = atlas.levels[0].width / atlas.cols;
  let level = 0;
  while (level + 1 < atlas.levels.length && cell / 2 ** (level + 1) >= r) level++;
  return level;
}

// An item icon: the art fitted into a square canvas (long weapons lie diagonally, like RO).
function makeIcon(img, { diagonal = false, dye = null } = {}) {
  const c = document.createElement("canvas");
  const dpr = 2;
  c.width = c.height = ICON * dpr;
  const g = c.getContext("2d");
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
function trimmed(sheet, row, cell = 96) {
  const c = document.createElement("canvas");
  c.width = c.height = cell;
  const g = c.getContext("2d", { willReadFrequently: true });
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
  out.getContext("2d").drawImage(c, -x0, -y0);
  return out;
}

async function boot() {
  const bar = document.getElementById("loading-bar");
  const files = {
    map: "assets/map.jpg",
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
  const weaponArt = new Set(Object.keys(WEAPON_TYPES).map((t) => WEAPON_ART[t].art ?? t));
  for (const id of weaponArt) files[`weapon_${id}`] = `assets/weapons/${id}.png`;
  const [images, bodies, hair] = await Promise.all([
    loadAll(files, (f) => (bar.value = f)),
    fetch("assets/chars/bodies.json").then((r) => r.json()),
    fetch("assets/chars/hair.json").then((r) => r.json()),
  ]);

  // stitched Oriverse capture; the scale allows tiles captured below 1 px per cm
  const map = { image: images.map, scale: images.map.width / MAP_W };

  const tex = {
    rune: images.rune,
    ring: tint(images.ring, "#c4f8dc"),
    mint: glow("rgba(140, 255, 190, 1)"),
    column: glow("rgba(190, 255, 215, 1)"),
    sparkle: glow("rgba(205, 255, 222, 1)"),
    flash: glow("rgba(236, 255, 240, 1)"),
    dissolve: glow("rgba(205, 218, 255, 1)"),
    flowers: bakeGround(images.flowers, 3, 3, 128, 8, 2),
    petals: { levels: mipChain(images.petals, 2), cols: 2, rows: 2 },
  };

  // ---- inventory, looks, icons ----
  const inv = new Inventory();
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
    if (seq === lookSeq) player.setSheets(built.sheets, built.hands);
  };

  const weapons = {};
  for (const t of Object.keys(WEAPON_TYPES)) {
    const art = WEAPON_ART[t];
    weapons[t] = { img: images[`weapon_${art.art ?? t}`], art };
  }
  const icons = new Map();
  const iconFor = (id) => {
    if (icons.has(id)) return icons.get(id);
    const item = ITEMS[id];
    let c = null;
    if (item.kind === "weapon") {
      const w = weapons[item.weapon];
      c = makeIcon(w.img, { diagonal: w.img.height > w.img.width * 1.6 });
      if (w.art.pair) {
        // two daggers crossed
        const g = c.getContext("2d");
        g.save();
        g.translate(c.width, 0);
        g.scale(-1, 1);
        g.drawImage(makeIcon(w.img, { diagonal: true }), 0, 0);
        g.restore();
      }
    } else if (item.kind === "costume") {
      // the costume's body in its own colours, filled in once its sheet has loaded
      c = document.createElement("canvas");
      c.width = c.height = ICON * 2;
      looks.build(look, { costume: id, top: null, bottom: null }, ["idle"]).then(({ sheets }) => {
        const art = trimmed(sheets.idle, 7);
        const s = (c.width * 0.94) / Math.max(art.width, art.height);
        const g = c.getContext("2d");
        g.imageSmoothingEnabled = false;
        g.drawImage(art, (c.width - art.width * s) / 2, (c.height - art.height * s) / 2, art.width * s, art.height * s);
        invUI.render();
      });
    } else if (item.kind === "top") c = makeIcon(images.coat, { dye: DYES[item.dye] });
    else if (item.kind === "bottom") c = makeIcon(images.legs, { dye: item.dye === "black" ? { hue: 250, sat: 0.2, light: -0.55 } : { ...DYES[item.dye], light: -0.45 } });
    else c = makeIcon(images[item.icon.sheet]);
    icons.set(id, c);
    return c;
  };

  // ---- world ----
  const fx = new Particles();
  const player = new Player(SPAWN.x, SPAWN.y, first.sheets, first.hands, glow("rgba(255, 110, 120, 1)"));
  applyLook();
  const motes = new Motes(fx, glow("rgba(232, 255, 112, 1)"));
  motes.update(0, { x: player.x, y: player.y });
  motes.prewarm();
  const spells = [];
  const cooldowns = SKILLS.map(() => 0);
  const floaters = new Floaters();
  const monsters = spawnMonsters(slimeSheets({
    idle: images.slime_idle, hop: images.slime_hop, hurt: images.slime_hurt, die: images.slime_die,
  }));
  const combat = new Combat({
    fx, tex, floaters, monsters,
    onKill(m) {
      for (const id of rollDrops(m.variant)) {
        const left = inv.add(id, 1);
        floaters.add(m.x, m.y, m.height + 20, left ? "กระเป๋าเต็ม" : `+ ${ITEMS[id].name}`, left ? "info" : "loot");
      }
    },
  });

  const hud = new SkillBar(document.getElementById("skillbar"), SKILLS, useSlot);
  const invUI = new InventoryUI(inv, iconFor);
  const wardrobe = new WardrobeUI(look, drawPreview, () => applyLook(), looks.hairstyles, (lk) => looks.note(lk, inv.equipped));
  inv.onChange(() => {
    applyLook();
    if (!wardrobe.win.classList.contains("hidden")) wardrobe.sync();
  });

  // Wardrobe preview: the idle frame of the chosen direction, recoloured, scaled up.
  let previewSeq = 0;
  async function drawPreview(cv, lk, turn) {
    const seq = ++previewSeq;
    const { sheets } = await looks.build(lk, inv.equipped, ["idle"]);
    if (seq !== previewSeq) return;
    const g = cv.getContext("2d");
    const cell = sheets.idle.height / 8;
    g.clearRect(0, 0, cv.width, cv.height);
    g.imageSmoothingEnabled = false;
    g.drawImage(sheets.idle, 0, turn * cell, cell, cell, 0, 0, cv.width, cv.height);
  }

  function useSlot(i) {
    const skill = SKILLS[i];
    if (!skill || cooldowns[i] > 0 || player.casting) {
      hud.pulse(i, "denied");
      return;
    }
    cooldowns[i] = skill.cooldown;
    hud.pulse(i, "flash");
    player.startCast(skill.cast, HOVER_END);
    spells.push(new FlowerSpell(fx, tex, player.x, player.y, player));
  }

  // Space: hit the nearest slime within reach, else swing where she faces.
  function quickAttack() {
    const w = weaponStats(inv.equipped.weapon);
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
  const held = new Set();
  const typing = (e) => e.target instanceof HTMLInputElement;
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
      if (!e.repeat) quickAttack();
      return;
    }
    if (e.code === "KeyI" && !e.repeat) invUI.toggle();
    if (e.code === "KeyC" && !e.repeat) wardrobe.toggle();
    if (e.code === "Escape") {
      invUI.toggle(false);
      wardrobe.toggle(false);
    }
    if (e.code === "Backquote") showDebug = !showDebug;
  });
  for (const [id, fn] of [["btn-inventory", () => invUI.toggle()], ["btn-wardrobe", () => wardrobe.toggle()]]) {
    document.getElementById(id).addEventListener("click", (e) => {
      e.currentTarget.blur();
      fn();
    });
  }
  // click a slime to walk up to it and keep attacking; click the ground to swing that way
  let view = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !view) return;
    const mx = (e.clientX * screen.dpr - view.ox) / view.k, my = (e.clientY * screen.dpr - view.oy) / view.k;
    const m = monsters.find((mon) => mon.contains(mx, my));
    if (m) {
      player.target = m;
      return;
    }
    player.target = null;
    player.startAttack(weaponStats(inv.equipped.weapon), groundFromMap(mx, my));
  });
  window.addEventListener("keyup", (e) => held.delete(e.code));
  window.addEventListener("blur", () => held.clear());

  resize();
  window.addEventListener("resize", resize);

  const cam = { x: mapX(player.y), y: mapY(player.x) - 50 };
  const hint = document.getElementById("hint");
  let walkedFor = 0;
  let last = performance.now();
  let fps = 60;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    fps += (1 / Math.max(dt, 1e-3) - fps) * 0.05;

    // ---- update ----
    const move = { x: 0, y: 0 };
    for (const code of held) {
      move.x += MOVE_KEYS[code][0];
      move.y += MOVE_KEYS[code][1];
    }
    const w = weaponStats(inv.equipped.weapon);
    if (player.update(dt, move, w)) combat.strike(player, inv.equipped.weapon);
    if (player.moving) {
      walkedFor += dt;
      if (walkedFor > 1.5) hint.classList.add("faded");
    }
    for (const m of monsters) m.update(dt);
    combat.update(dt);
    floaters.update(dt);
    for (let i = spells.length - 1; i >= 0; i--) {
      spells[i].update(dt);
      if (spells[i].done) spells.splice(i, 1);
    }
    fx.update(dt);
    motes.update(dt, { x: player.x, y: player.y });
    for (let i = 0; i < cooldowns.length; i++) {
      if (!SKILLS[i]) continue;
      cooldowns[i] = Math.max(0, cooldowns[i] - dt);
      hud.setCooldown(i, cooldowns[i], SKILLS[i].cooldown);
    }

    // ---- camera: follow the player, stay inside the map ----
    const k = screen.zoom * screen.dpr;
    const halfW = screen.w / screen.zoom / 2, halfH = screen.h / screen.zoom / 2;
    const tx = mapX(player.y), ty = mapY(player.x) - 50;
    const ease = 1 - Math.exp(-dt * 6);
    cam.x += (tx - cam.x) * ease;
    cam.y += (ty - cam.y) * ease;
    cam.x = halfW * 2 >= MAP_W ? MAP_W / 2 : Math.max(halfW, Math.min(MAP_W - halfW, cam.x));
    cam.y = halfH * 2 >= MAP_H ? MAP_H / 2 : Math.max(halfH, Math.min(MAP_H - halfH, cam.y));
    view = {
      k,
      ox: Math.round(canvas.width / 2 - cam.x * k),
      oy: Math.round(canvas.height / 2 - cam.y * k),
      w: canvas.width,
      h: canvas.height,
      mipFor,
    };

    // ---- draw ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#16210f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "low"; // textures carry their own mip levels

    // visible part of the map
    const x0 = Math.max(0, -view.ox / k), y0 = Math.max(0, -view.oy / k);
    const x1 = Math.min(MAP_W, (canvas.width - view.ox) / k), y1 = Math.min(MAP_H, (canvas.height - view.oy) / k);
    if (x1 > x0 && y1 > y0) {
      const s = map.scale;
      ctx.drawImage(map.image, x0 * s, y0 * s, (x1 - x0) * s, (y1 - y0) * s,
        x0 * k + view.ox, y0 * k + view.oy, (x1 - x0) * k, (y1 - y0) * k);
    }

    ctx.globalCompositeOperation = "lighter";
    fx.draw(ctx, view, fx.layer(GROUND_GLOW));
    ctx.globalCompositeOperation = "source-over";

    // target ring under the slime being attacked
    if (player.target?.alive) {
      const t = player.target;
      ctx.strokeStyle = "rgba(255, 214, 120, 0.9)";
      ctx.lineWidth = 2.5 * k;
      ctx.beginPath();
      ctx.ellipse(mapX(t.y) * k + view.ox, mapY(t.x, 0) * k + view.oy, 34 * k, 15 * k, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // characters, flowers and petals sorted by their ground point
    const sorted = fx.layer(SORTED);
    for (const p of sorted) p.depth = mapY(p.x, 0);
    sorted.sort((a, b) => a.depth - b.depth);
    const inHand = inv.equipped.weapon ? weapons[inv.equipped.weapon] : null;
    const actors = [...monsters.map((m) => ({ depth: m.depth, draw: () => m.draw(ctx, view) })),
      { depth: player.depth, draw: () => player.draw(ctx, view, inHand) }];
    actors.sort((a, b) => a.depth - b.depth);
    let from = 0;
    for (const a of actors) {
      let to = from;
      while (to < sorted.length && sorted[to].depth <= a.depth) to++;
      if (to > from) fx.draw(ctx, view, sorted.slice(from, to));
      from = to;
      a.draw();
    }
    if (from < sorted.length) fx.draw(ctx, view, sorted.slice(from));

    combat.draw(ctx, view, images.arrow);
    ctx.globalCompositeOperation = "lighter";
    fx.draw(ctx, view, fx.layer(AIR_GLOW));
    ctx.globalCompositeOperation = "source-over";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    floaters.draw(ctx, view);

    if (showDebug) drawDebug(view, player, fx, fps);
    requestAnimationFrame(frame);
  }

  // Exposed for automated checks and console poking.
  window.__game = { player, fx, spells, cooldowns, useSlot, inv, monsters, combat, look, looks, applyLook, invUI, wardrobe, quickAttack, directionIndex };

  document.getElementById("loading").classList.add("done");
  requestAnimationFrame((t) => {
    last = t;
    frame(t);
  });
}

function drawDebug(view, player, fx, fps) {
  const { k, ox, oy } = view;
  ctx.setTransform(k, 0, 0, k, ox, oy);
  ctx.lineWidth = 2 / k;
  ctx.strokeStyle = "rgba(255, 60, 60, 0.9)";
  for (const s of debugShapes()) {
    ctx.beginPath();
    if (s.circle) {
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
  document.querySelector(".loading-title").textContent = "โหลดไม่สำเร็จ: " + err.message;
});


import { MAP_W, MAP_H, mapX, mapY } from "./projection.js";
import { loadAll, mipChain, bakeGround, glow, tint } from "./assets.js";
import { SPAWN, paintStandIn, debugShapes } from "./world.js";
import { Particles, GROUND_GLOW, SORTED, AIR_GLOW } from "./particles.js";
import { Player } from "./player.js";
import { FlowerSpell, CAST_TIME, HOVER_END } from "./spell.js";
import { SkillBar, slotForCode } from "./hud.js";
import { Motes } from "./motes.js";

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

async function boot() {
  const bar = document.getElementById("loading-bar");
  const images = await loadAll(
    {
      map: { src: "assets/map.jpg", optional: true },
      front: "assets/mage_front.png",
      back: "assets/mage_back.png",
      left: "assets/mage_left.png",
      right: "assets/mage_right.png",
      flowers: "assets/flower_atlas.png",
      petals: "assets/petal_atlas.png",
      rune: "assets/rune_circle.png",
      ring: "assets/ring_glow.png",
      icon: "assets/icon_flower.png",
    },
    (f) => (bar.value = f),
  );

  const map = images.map ? { image: images.map, scale: images.map.width / MAP_W } : paintStandIn();
  if (!images.map) {
    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = "แผนที่ชั่วคราว · รอภาพฉากจาก Oriverse";
    document.body.append(badge);
  }

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

  const fx = new Particles();
  const player = new Player(SPAWN.x, SPAWN.y, {
    front: images.front, back: images.back, left: images.left, right: images.right,
  });
  const motes = new Motes(fx, glow("rgba(232, 255, 112, 1)"));
  motes.update(0, { x: player.x, y: player.y });
  motes.prewarm();
  const spells = [];
  const cooldowns = SKILLS.map(() => 0);

  const hud = new SkillBar(document.getElementById("skillbar"), SKILLS, useSlot);

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

  // ---- input ----
  const held = new Set();
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
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
    if (e.code === "Backquote") showDebug = !showDebug;
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
    player.update(dt, move);
    if (player.moving) {
      walkedFor += dt;
      if (walkedFor > 1.5) hint.classList.add("faded");
    }
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
    const view = {
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

    // flowers and petals sorted by their ground point, split around the player
    const sorted = fx.layer(SORTED);
    for (const p of sorted) p.depth = mapY(p.x, 0);
    sorted.sort((a, b) => a.depth - b.depth);
    const pd = player.depth;
    let split = sorted.findIndex((p) => p.depth > pd);
    if (split < 0) split = sorted.length;
    fx.draw(ctx, view, sorted.slice(0, split));
    player.draw(ctx, view);
    fx.draw(ctx, view, sorted.slice(split));

    ctx.globalCompositeOperation = "lighter";
    fx.draw(ctx, view, fx.layer(AIR_GLOW));
    ctx.globalCompositeOperation = "source-over";
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (showDebug) drawDebug(view, player, fx, fps);
    requestAnimationFrame(frame);
  }

  // Exposed for automated checks and console poking.
  window.__game = { player, fx, spells, cooldowns, useSlot, standIn: !images.map };

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

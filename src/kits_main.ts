// kits.html: a gallery of the town kits (src/world3d/kits). Every item of a kit laid out in
// rows on that town's ground, or the kit's sample scene; the game's camera (orthographic,
// pitched 45 degrees) that pans, turns and zooms.
//
// URL: ?town=<kit id>&mode=grid|sample&item=<item id>&yaw=<degrees>&zoom=<px per metre>

import * as THREE from "three";
import { KIT_LIST } from "./world3d/kits";
import { build } from "./world3d/kits/types";
import type { Kit } from "./world3d/kits/types";
import { place } from "./world3d/geo";
import type { V3 } from "./world3d/geo";
import { groundTexture, material } from "./world3d/textures";
import { wind } from "./world3d/trees";

const params = new URLSearchParams(location.search);
const loaded = new Map<string, Kit>();
async function load(id: string): Promise<Kit> {
  let k = loaded.get(id);
  if (!k) {
    const entry = KIT_LIST.find((e) => e.id === id) ?? KIT_LIST[0];
    loaded.set(id, (k = await entry.load()));
  }
  return k;
}
let kit: Kit;
let mode: "grid" | "sample" = params.get("mode") === "sample" ? "sample" : "grid";

const canvas = document.getElementById("view") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const scene = new THREE.Scene();
const DIST = 8000;
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, DIST * 3);
const hemi = new THREE.HemisphereLight("#d6ecff", "#5f7f45", 1.35);
const sun = new THREE.DirectionalLight("#ffe2b0", 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 2;
scene.add(hemi, sun, sun.target);

const SKY: Record<string, [string, string]> = {
  grass: ["#7fa95c", "#5f7f45"], sand: ["#d9c08a", "#b89a62"], snow: ["#cfdcea", "#9fb0c0"], steppe: ["#a8ad78", "#7f8452"],
  jungle: ["#4f7f3a", "#3b5f2a"], moss: ["#7d9a5c", "#5d7448"], dirt: ["#b89464", "#8f6f45"], rock: ["#9c968c", "#77726a"],
};

let root = new THREE.Group();
scene.add(root);
let spots: { id: string; name: string; obj: THREE.Object3D; box: THREE.Box3 }[] = [];
let target = new THREE.Vector3();
let k = 0.12; // screen pixels per centimetre
let yaw = Number(params.get("yaw") ?? 0);

const labels = document.getElementById("labels")!;
const bar = document.getElementById("bar")!;
const info = document.getElementById("info")!;

function ground(kind: string, w: number, d: number, cx: number, cz: number): THREE.Mesh {
  const tex = groundTexture(kind);
  tex.repeat.set(w / 400, d / 400);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  mesh.position.set(cx, 0, cz);
  mesh.receiveShadow = true;
  return mesh;
}

function fitShadow(box: THREE.Box3): void {
  const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const r = Math.max(size.x, size.z) * 0.75 + 600;
  sun.position.copy(c).add(new THREE.Vector3(-0.5, 0.62, -0.6).normalize().multiplyScalar(r + 4000));
  sun.target.position.copy(c);
  Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 100, far: r * 2 + 9000 });
  sun.shadow.camera.updateProjectionMatrix();
}

function clear(): void {
  scene.remove(root);
  root = new THREE.Group();
  scene.add(root);
  spots = [];
  labels.replaceChildren();
}

function layoutGrid(): THREE.Box3 {
  const built = kit.items.map((item) => {
    const obj = build(item);
    const box = new THREE.Box3().setFromObject(obj);
    return { item, obj, box, w: box.max.z - box.min.z, d: box.max.x - box.min.x };
  });
  // biggest first, in rows across the screen (+Z in three.js), rows going down the screen (-X)
  built.sort((a, b) => b.w * b.d - a.w * a.d);
  const gap = 180;
  const area = built.reduce((t, b) => t + (b.w + gap) * (b.d + gap), 0);
  const rowW = Math.max(2400, Math.sqrt(area) * 1.5);
  let z = 0, x = 0, rowDepth = 0;
  for (const b of built) {
    if (z > 0 && z + b.w > rowW) {
      x -= rowDepth + gap * 1.6;
      z = 0;
      rowDepth = 0;
    }
    b.obj.position.set(x - b.box.max.x, 0, z - b.box.min.z);
    root.add(b.obj);
    z += b.w + gap;
    rowDepth = Math.max(rowDepth, b.d);
  }
  for (const b of built) spots.push({ id: b.item.id, name: b.item.name, obj: b.obj, box: new THREE.Box3().setFromObject(b.obj) });
  const all = new THREE.Box3();
  for (const s of spots) all.union(s.box);
  if (all.isEmpty()) all.set(new THREE.Vector3(-500, 0, -500), new THREE.Vector3(500, 100, 500));
  return all;
}

function layoutSample(): THREE.Box3 {
  const cache = new Map<string, THREE.Object3D>();
  const put = (what: string | THREE.Object3D, at: V3, heading = 0, s = 1) => {
    let obj: THREE.Object3D;
    if (typeof what === "string") {
      const [kitId, itemId] = what.includes(":") ? what.split(":") : [kit.id, what];
      const key = `${kitId}:${itemId}`;
      let proto = cache.get(key);
      if (!proto) {
        const item = loaded.get(kitId)?.items.find((i) => i.id === itemId);
        if (!item) {
          console.warn("no kit item", key);
          return;
        }
        cache.set(key, (proto = build(item)));
      }
      obj = proto.clone();
    } else obj = what;
    root.add(place(obj, at, heading, s));
  };
  kit.sample?.(put);
  const all = new THREE.Box3().setFromObject(root);
  if (all.isEmpty()) all.set(new THREE.Vector3(-2000, 0, -2000), new THREE.Vector3(2000, 100, 2000));
  return all;
}

function show(): void {
  clear();
  const box = mode === "grid" ? layoutGrid() : layoutSample();
  const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const [sky, low] = SKY[kit.ground] ?? SKY.grass;
  scene.background = new THREE.Color(sky);
  hemi.groundColor = new THREE.Color(low);
  const span = Math.max(size.x, size.z) + 6000;
  if (mode === "sample" && kit.sea) {
    // the sea along the world's -Y edge (three.js +Z) past 22 m, its surface 12 cm below the ground
    const shore = 2200;
    const land = ground(kit.ground, span * 2, span + shore, c.x, (shore - span) / 2);
    root.add(land);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(span * 2, span).rotateX(-Math.PI / 2), material("WaterSea"));
    sea.position.set(c.x, -12, shore + span / 2 - 5);
    sea.receiveShadow = true;
    root.add(sea);
  } else root.add(ground(kit.ground, span * 2, span * 2, c.x, c.z));
  fitShadow(box);
  renderer.shadowMap.needsUpdate = true;
  // labels for the grid
  for (const s of spots) {
    const el = document.createElement("div");
    el.className = "label";
    el.textContent = s.name;
    el.title = s.id;
    el.addEventListener("click", () => focus(s.id));
    labels.append(el);
    (s as unknown as { el: HTMLElement }).el = el;
  }
  // frame it all
  target.copy(c).setY(0);
  const w = innerWidth, h = innerHeight - 120;
  k = Math.min(w / (size.z + 600), h / ((size.x + 600) * Math.SQRT1_2 + size.y * Math.SQRT1_2));
  if (params.get("zoom")) k = Number(params.get("zoom")) / 100;
  const want = params.get("item");
  if (want) focus(want);
  drawBar();
}

function focus(id: string): void {
  const s = spots.find((x) => x.id === id);
  if (!s) return;
  const c = s.box.getCenter(new THREE.Vector3()), size = s.box.getSize(new THREE.Vector3());
  target.set(c.x, c.y * 0.5, c.z);
  k = Math.min(innerWidth / (Math.max(size.x, size.z) * 1.6 + 200), (innerHeight - 140) / (size.y + Math.max(size.x, size.z) * 0.8 + 200));
  for (const o of spots) (o as unknown as { el: HTMLElement }).el?.classList.toggle("on", o.id === id);
}

function drawBar(): void {
  bar.replaceChildren();
  for (const x of KIT_LIST) {
    const b = document.createElement("button");
    b.textContent = x.name;
    b.className = x.id === kit.id ? "on" : "";
    b.addEventListener("click", () => void open(x.id));
    bar.append(b);
  }
  bar.append(Object.assign(document.createElement("span"), { className: "sep" }));
  for (const [m, text] of [["grid", `ของทั้งหมด (${kit.items.length})`], ["sample", "ตัวอย่างเมือง"]] as const) {
    if (m === "sample" && !kit.sample) continue;
    const b = document.createElement("button");
    b.textContent = text;
    b.className = mode === m ? "on" : "";
    b.addEventListener("click", () => {
      mode = m;
      show();
    });
    bar.append(b);
  }
  info.innerHTML = "";
  const h1 = document.createElement("h1");
  h1.textContent = kit.name;
  const p = document.createElement("p");
  p.textContent = [kit.region, kit.desc].filter(Boolean).join(" · ") || "ยังไม่มีของในชุดนี้";
  info.append(h1, p);
}

// ---- camera ----
const dir = new THREE.Vector3();
function frame(): void {
  const w = innerWidth, h = innerHeight;
  const c = Math.cos((yaw * Math.PI) / 180), s = Math.sin((yaw * Math.PI) / 180), a = Math.SQRT1_2;
  dir.set(c * a, -a, -s * a);
  camera.position.copy(target).addScaledVector(dir, -DIST);
  camera.up.set(c * a, a, -s * a);
  camera.lookAt(target);
  Object.assign(camera, { left: -w / 2 / k, right: w / 2 / k, top: h / 2 / k, bottom: -h / 2 / k });
  camera.updateProjectionMatrix();
}
function resize(): void {
  renderer.setSize(innerWidth, innerHeight, false);
}
addEventListener("resize", resize);
resize();

// pan with a drag, turn with a right drag (or shift), zoom with the wheel or a pinch
const pointers = new Map<number, { x: number; y: number }>();
let turning = false;
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  turning = e.button === 2 || e.shiftKey;
});
canvas.addEventListener("pointermove", (e) => {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const before = Math.hypot(a.x - b.x, a.y - b.y);
    p.x = e.clientX;
    p.y = e.clientY;
    const [a2, b2] = [...pointers.values()];
    const after = Math.hypot(a2.x - b2.x, a2.y - b2.y);
    if (before > 10) k = Math.max(0.01, Math.min(2, (k * after) / before));
    return;
  }
  p.x = e.clientX;
  p.y = e.clientY;
  if (turning) {
    yaw += dx * 0.4;
    return;
  }
  const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize();
  const fwd = new THREE.Vector3(dir.x, 0, dir.z).normalize();
  target.addScaledVector(right, -dx / k).addScaledVector(fwd, dy / k / Math.SQRT1_2);
});
const up = (e: PointerEvent) => pointers.delete(e.pointerId);
canvas.addEventListener("pointerup", up);
canvas.addEventListener("pointercancel", up);
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  k = Math.max(0.01, Math.min(2, k * Math.exp(-e.deltaY * 0.0012)));
}, { passive: false });
addEventListener("keydown", (e) => {
  if (e.key === "q" || e.key === "Q") yaw -= 45;
  if (e.key === "e" || e.key === "E") yaw += 45;
});

// ---- loop ----
const v = new THREE.Vector3();
let last = performance.now(), time = 0, frames = 0;
function tick(now: number): void {
  time += (now - last) / 1000;
  last = now;
  wind.value = time;
  frame();
  renderer.render(scene, camera);
  for (const s of spots) {
    const el = (s as unknown as { el?: HTMLElement }).el;
    if (!el) continue;
    v.set((s.box.min.x + s.box.max.x) / 2, s.box.max.y + 20, (s.box.min.z + s.box.max.z) / 2).project(camera);
    const inView = v.x > -1.1 && v.x < 1.1 && v.y > -1.1 && v.y < 1.1;
    el.style.display = inView ? "" : "none";
    if (inView) el.style.left = `${((v.x + 1) / 2) * innerWidth}px`, el.style.top = `${((1 - v.y) / 2) * innerHeight}px`;
  }
  if (++frames === 2) document.body.dataset.ready = "1";
  requestAnimationFrame(tick);
}
// a kit and the shared ones its sample may use
async function open(id: string): Promise<void> {
  try {
    await Promise.all([load("common"), load("flora")]);
    kit = await load(id);
  } catch (e) {
    console.error(e);
    kit = { id, name: KIT_LIST.find((x) => x.id === id)?.name ?? id, region: "", desc: `โหลดไม่ได้: ${e}`, ground: "grass", items: [] };
  }
  if (!kit.sample) mode = "grid";
  show();
}
void open(params.get("town") ?? KIT_LIST[0].id).then(() => requestAnimationFrame(tick));

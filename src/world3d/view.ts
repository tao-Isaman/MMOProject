// The 3D courtyard on screen (three.js, WebGL), under the game's 2D canvas.
//
// The camera is orthographic and pitched 45 degrees, exactly the projection of src/projection.ts
// (one world centimetre per map pixel), and follows the game's View every frame, so everything
// the 2D canvas draws on top (effects, damage numbers, clicks) still lines up with the world.
//
// Characters stay 2D sprites, Ragnarok style: each one is drawn by its own draw code into a
// small canvas that becomes a camera-facing billboard standing on its feet, so props in front
// hide it by depth. The player also gets a faint copy drawn over everything, so she shows
// through a tree or the house (a ghost).

import * as THREE from "three";
import { buildCourtyard } from "./courtyard";
import { buildGround, buildGrass } from "./ground";
import { wind } from "./trees";
import { groundFromMap, mapX, mapY } from "../projection";
import { blocked, BOUNDS } from "../world";
import type { View } from "../types";

const DIST = 6000; // camera distance from what it looks at, cm
const BIAS = 14;   // billboards sit this much toward the camera (their ground shadow clears the ground)

interface Billboard {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  sprite: THREE.Sprite;
  ghost: THREE.Sprite | null;
  used: boolean;
}

// What an actor billboard needs: its feet, its box (cm: width, height, room below the feet).
export interface ActorBox {
  x: number;
  y: number;
  w: number;
  h: number;
  foot: number;
}

export class World3D {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, DIST * 3);
  dir = new THREE.Vector3();
  boards = new Map<object, Billboard>();
  ring: THREE.Mesh;
  area: THREE.LineLoop;
  time = 0;

  constructor(canvas: HTMLCanvasElement, quality: { grass: number; flowers: number; shadow: number }) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // nothing in the courtyard moves but leaves and grass: draw the sun's shadows once
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;

    const s = this.scene;
    s.background = new THREE.Color("#3d5a2a");
    s.fog = new THREE.Fog("#c9dcc2", DIST + 600, DIST + 5200);

    // light: a sky dome and a warm low sun from the front left of the starting view
    s.add(new THREE.HemisphereLight("#d6ecff", "#5f7f45", 1.35));
    const sun = new THREE.DirectionalLight("#ffe2b0", 2.6);
    const centre = new THREE.Vector3(1300, 0, -650);
    sun.position.copy(centre).add(new THREE.Vector3(-0.5, 0.62, -0.6).normalize().multiplyScalar(5000));
    sun.target.position.copy(centre);
    sun.castShadow = true;
    sun.shadow.mapSize.set(quality.shadow, quality.shadow);
    Object.assign(sun.shadow.camera, { left: -3400, right: 3400, top: 3400, bottom: -3400, near: 100, far: 11000 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 2;
    sun.shadow.radius = 3;
    s.add(sun, sun.target);

    // ground, grass, props, trees, flowers
    const ground = buildGround();
    s.add(ground.mesh);
    const open = (x: number, y: number) => ground.dirt(x, y) < 0.35 && !blocked({ x, y }, 6);
    s.add(buildGrass(quality.grass, { x0: BOUNDS.minX - 600, y0: BOUNDS.minY - 600, x1: BOUNDS.maxX + 600, y1: BOUNDS.maxY + 600 }, open));
    s.add(buildCourtyard(open, { flowerScale: quality.flowers }).root);

    // the target ring and the bot's hunting circle lie on the ground
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(30, 36, 40).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: "#ffd678", transparent: true, opacity: 0.9, depthWrite: false }),
    );
    this.ring.position.y = 1.5;
    this.ring.visible = false;
    s.add(this.ring);
    const circle = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 96 }, (_, i) => {
      const a = (i / 96) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    }));
    this.area = new THREE.LineLoop(circle, new THREE.LineDashedMaterial({ color: "#f4d27a", dashSize: 0.06, gapSize: 0.05, transparent: true, opacity: 0.6, depthWrite: false }));
    this.area.computeLineDistances();
    this.area.position.y = 2;
    this.area.visible = false;
    s.add(this.area);
  }

  resize(w: number, h: number, dpr: number): void {
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
  }

  // Point the camera like the 2D view: same zoom, same scroll, heading `yaw`.
  sync(view: View, yaw: number): void {
    const { k, w, h } = view;
    const g = groundFromMap((w / 2 - view.ox) / k, (h / 2 - view.oy) / k);
    const target = new THREE.Vector3(g.x, 0, -g.y);
    const c = Math.cos(yaw), s = Math.sin(yaw), a = Math.SQRT1_2;
    this.dir.set(c * a, -a, -s * a);
    const cam = this.camera;
    cam.position.copy(target).addScaledVector(this.dir, -DIST);
    cam.up.set(c * a, a, -s * a);
    cam.lookAt(target);
    cam.left = -w / 2 / k;
    cam.right = w / 2 / k;
    cam.top = h / 2 / k;
    cam.bottom = -h / 2 / k;
    cam.updateProjectionMatrix();
  }

  // ---- characters ----
  beginActors(): void {
    for (const b of this.boards.values()) b.used = false;
  }

  // Draw one character (key: the object it belongs to) into its billboard: draw(ctx, view) is
  // its usual 2D draw code, given a view that puts its feet in the right place on the canvas.
  actor(key: object, box: ActorBox, view: View, draw: (ctx: CanvasRenderingContext2D, v: View) => void, ghost = false): void {
    const k = view.k;
    const cw = Math.ceil(box.w * k), ch = Math.ceil(box.h * k);
    let b = this.boards.get(key);
    if (!b || b.canvas.width !== cw || b.canvas.height !== ch) {
      if (b) this.drop(key, b);
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = tex.magFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
      this.scene.add(sprite);
      let g: THREE.Sprite | null = null;
      if (ghost) {
        g = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, opacity: 0.4, fog: false }));
        g.renderOrder = 10;
        this.scene.add(g);
      }
      b = { canvas, ctx: canvas.getContext("2d")!, tex, sprite, ghost: g, used: true };
      this.boards.set(key, b);
    }
    b.used = true;
    const ctx = b.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    const local: View = { ...view, ox: cw / 2 - mapX(box.x, box.y) * k, oy: ch - box.foot * k - mapY(box.x, box.y) * k, w: cw, h: ch };
    draw(ctx, local);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    b.tex.needsUpdate = true;
    for (const sp of [b.sprite, b.ghost]) {
      if (!sp) continue;
      sp.visible = true;
      sp.position.set(box.x, 0, -box.y).addScaledVector(this.dir, -BIAS);
      sp.scale.set(cw / k, ch / k, 1);
      sp.center.set(0.5, (box.foot * k) / ch);
    }
  }

  endActors(): void {
    for (const [key, b] of this.boards) {
      if (b.used) continue;
      b.sprite.visible = false;
      if (b.ghost) b.ghost.visible = false;
      // forget characters that are gone for good (keeps a few spare)
      if (this.boards.size > 40) this.drop(key, b);
    }
  }

  drop(key: object, b: Billboard): void {
    this.scene.remove(b.sprite);
    if (b.ghost) this.scene.remove(b.ghost);
    b.sprite.material.dispose();
    b.ghost?.material.dispose();
    b.tex.dispose();
    this.boards.delete(key);
  }

  // ---- ground markers ----
  setRing(at: { x: number; y: number } | null): void {
    this.ring.visible = !!at;
    if (at) this.ring.position.set(at.x, 1.5, -at.y);
  }
  setArea(at: { x: number; y: number } | null, radius = 0): void {
    this.area.visible = !!at;
    if (!at) return;
    this.area.position.set(at.x, 2, -at.y);
    this.area.scale.set(radius, 1, radius);
    const m = this.area.material as THREE.LineDashedMaterial;
    m.dashSize = 60 / radius;
    m.gapSize = 48 / radius;
  }

  render(dt: number): void {
    this.time += dt;
    wind.value = this.time;
    this.renderer.render(this.scene, this.camera);
  }
}

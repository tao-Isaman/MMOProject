// The 3D courtyard on screen (three.js, WebGL), under the game's 2D canvas.
//
// The camera is orthographic and pitched 45 degrees, exactly the projection of src/projection.ts
// (one world centimetre per map pixel), and follows the game's View every frame, so everything
// the 2D canvas draws on top (effects, damage numbers, clicks) still lines up with the world.
//
// Characters stay 2D sprites, Ragnarok style: each one is drawn by its own draw code into a
// small canvas that becomes a camera-facing billboard standing on its feet, so props in front
// hide it by depth. The player also gets a faint copy drawn over everything, so she shows
// through a tree or the house (a ghost), and whatever stands between her and the camera opens
// up around her (a dithered cutaway), so a street between tall houses stays in view.

import * as THREE from "three";
import { wind } from "./trees";
import { groundFromMap, mapX, mapY } from "../projection";
import type { View } from "../types";

const DIST = 6000; // camera distance from what it looks at, cm
const BIAS = 14;   // billboards sit this much toward the camera (their ground shadow clears the ground)
const CUT_R = 260; // the cutaway's radius on screen, cm

interface Billboard {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  sprite: THREE.Sprite;
  ghost: THREE.Sprite | null;
  used: boolean;
}

// Something lying flat on the ground for one frame (a rune circle, a ripple, a bloomed flower):
// centre and size in cm, turn in radians, opacity, its image and the part of it (uv: u0, v0,
// u1, v1, v from the top), and whether it adds light (glows) or lays over (flowers).
export interface GroundSprite {
  x: number;
  y: number;
  size: number;
  rot: number;
  alpha: number;
  img: CanvasImageSource & { width: number; height: number };
  uv: [number, number, number, number];
  add: boolean;
}

// What an actor billboard needs: its feet, its box (cm: width, height, room below the feet).
export interface ActorBox {
  x: number;
  y: number;
  w: number;
  h: number;
  foot: number;
}

// One map's scenery (src/world3d/levels.ts): everything but the characters.
export interface Level {
  root: THREE.Object3D;
  sky: string;                     // the colour past the edge of the ground
  warps?: { x: number; y: number }[]; // warp portals to draw
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
  quality: { flowers: number; shadow: number };
  sun: THREE.DirectionalLight;
  level: THREE.Object3D | null = null;
  portals: THREE.Object3D[] = [];
  target = new THREE.Vector3();
  shadowAt = new THREE.Vector3(1e9, 0, 0);
  focus: { x: number; y: number } | null = null; // who the cutaway keeps in view
  groundSets = new Map<string, { mesh: THREE.Mesh; geo: THREE.BufferGeometry; cap: number }>();
  groundTex = new Map<object, THREE.Texture>();

  constructor(canvas: HTMLCanvasElement, quality: { flowers: number; shadow: number }) {
    this.quality = quality;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // nothing in the scenery moves but leaves: the sun's shadows are drawn again only when the
    // view has moved far enough that the area they cover needs to follow it
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;

    const s = this.scene;
    s.background = new THREE.Color("#3d5a2a");
    s.fog = new THREE.Fog("#c9dcc2", DIST + 600, DIST + 5200);

    // light: a sky dome and a warm low sun from the front left of the starting view
    s.add(new THREE.HemisphereLight("#d6ecff", "#5f7f45", 1.35));
    const sun = (this.sun = new THREE.DirectionalLight("#ffe2b0", 2.6));
    sun.castShadow = true;
    sun.shadow.mapSize.set(quality.shadow, quality.shadow);
    Object.assign(sun.shadow.camera, { left: -3400, right: 3400, top: 3400, bottom: -3400, near: 100, far: 11000 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 2;
    sun.shadow.radius = 3;
    s.add(sun, sun.target);

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

  // Show a map's scenery instead of the last one's.
  load(level: Level): void {
    if (this.level) this.scene.remove(this.level);
    this.level = level.root;
    this.scene.add(level.root);
    level.root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) cutaway(m);
    });
    this.scene.background = new THREE.Color(level.sky);
    this.portals = (level.warps ?? []).map((w) => {
      const p = portal();
      p.position.set(w.x, 0, -w.y);
      level.root.add(p);
      return p;
    });
    this.shadowAt.set(1e9, 0, 0);
  }

  resize(w: number, h: number, dpr: number): void {
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
  }

  // Point the camera like the 2D view: same zoom, same scroll, heading `yaw`.
  sync(view: View, yaw: number): void {
    const { k, w, h } = view;
    const g = groundFromMap((w / 2 - view.ox) / k, (h / 2 - view.oy) / k);
    const target = this.target.set(g.x, 0, -g.y);
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

  // ---- effects on the ground: one mesh of flat quads per image and blend, refilled every frame,
  // drawn before the characters (who stand on them) and hidden by anything in front ----
  ground(list: GroundSprite[]): void {
    const groups = new Map<string, GroundSprite[]>();
    for (const sp of list) {
      let tex = this.groundTex.get(sp.img);
      if (!tex) {
        tex = new THREE.Texture(sp.img as TexImageSource);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        this.groundTex.set(sp.img, tex);
      }
      const key = `${tex.id}|${sp.add ? 1 : 0}`;
      const g = groups.get(key);
      if (g) g.push(sp);
      else groups.set(key, [sp]);
    }
    for (const [key, set] of this.groundSets) if (!groups.has(key)) set.mesh.visible = false;
    for (const [key, sprites] of groups) {
      let set = this.groundSets.get(key);
      if (!set || set.cap < sprites.length) {
        const cap = Math.max(64, 2 ** Math.ceil(Math.log2(sprites.length)));
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(cap * 12), 3).setUsage(THREE.DynamicDrawUsage));
        geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(cap * 8), 2).setUsage(THREE.DynamicDrawUsage));
        geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(cap * 16), 4).setUsage(THREE.DynamicDrawUsage));
        const index = new Uint32Array(cap * 6);
        for (let i = 0; i < cap; i++) index.set([i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3], i * 6);
        geo.setIndex(new THREE.BufferAttribute(index, 1));
        const add = key.endsWith("|1");
        const mat = new THREE.MeshBasicMaterial({ map: this.groundTex.get(sprites[0].img)!, transparent: true, depthWrite: false, vertexColors: true,
          blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.frustumCulled = false;
        mesh.renderOrder = add ? -2 : -1;
        if (set) {
          this.scene.remove(set.mesh);
          set.geo.dispose();
          (set.mesh.material as THREE.Material).dispose();
        }
        set = { mesh, geo, cap };
        this.groundSets.set(key, set);
        this.scene.add(mesh);
      }
      set.mesh.visible = true;
      const pos = set.geo.getAttribute("position") as THREE.BufferAttribute, uv = set.geo.getAttribute("uv") as THREE.BufferAttribute;
      const col = set.geo.getAttribute("color") as THREE.BufferAttribute;
      const P = pos.array as Float32Array, U = uv.array as Float32Array, C = col.array as Float32Array;
      sprites.forEach((sp, i) => {
        const h = sp.size / 2, c = Math.cos(sp.rot) * h, s = Math.sin(sp.rot) * h;
        const [u0, v0, u1, v1] = sp.uv;
        // corners: the image's top towards north (+X), its left towards west (+Y); y up 3 cm
        const corners: [number, number, number, number][] = [[-1, -1, u0, 1 - v0], [1, -1, u1, 1 - v0], [-1, 1, u0, 1 - v1], [1, 1, u1, 1 - v1]];
        corners.forEach(([a, b, u, v], j) => {
          const wx = sp.x - b * c - a * s, wy = sp.y - a * c + b * s;
          P.set([wx, 3 + (sp.add ? 0 : 0.5), -wy], (i * 4 + j) * 3);
          U.set([u, v], (i * 4 + j) * 2);
          C.set(sp.add ? [sp.alpha, sp.alpha, sp.alpha, 1] : [1, 1, 1, sp.alpha], (i * 4 + j) * 4);
        });
      });
      set.geo.setDrawRange(0, sprites.length * 6);
      pos.needsUpdate = uv.needsUpdate = col.needsUpdate = true;
    }
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
    // the shadows cover 68 m around the view; past 15 m of drift they are drawn again around it
    if (this.shadowAt.distanceTo(this.target) > 1500) {
      this.shadowAt.copy(this.target);
      this.sun.target.position.copy(this.target);
      this.sun.position.copy(this.target).add(new THREE.Vector3(-0.5, 0.62, -0.6).normalize().multiplyScalar(5000));
      this.renderer.shadowMap.needsUpdate = true;
    }
    for (const p of this.portals) {
      p.rotation.y = this.time * 0.8;
      const beam = p.children[1] as THREE.Mesh;
      (beam.material as THREE.MeshBasicMaterial).opacity = 0.32 + 0.12 * Math.sin(this.time * 3);
    }
    this.camera.updateMatrixWorld();
    if (this.focus) {
      const v = new THREE.Vector3(this.focus.x, 100, -this.focus.y).applyMatrix4(this.camera.matrixWorldInverse);
      CUT.value.set(v.x, v.y, v.z, CUT_R);
    } else CUT.value.w = 0;
    this.renderer.render(this.scene, this.camera);
  }

  // Compile every material in the scene now (behind the loading screen) rather than on the
  // frames that first show it.
  async compile(): Promise<void> {
    this.camera.updateMatrixWorld();
    await this.renderer.compileAsync(this.scene, this.camera);
  }

  // The scenery inside `b` seen from straight above, north (+X) up, `long` pixels along its
  // longer side: the map window's and the minimap's picture. It is rendered in tiles into a
  // corner of the game's own canvas (so every material keeps the shader it already has) and
  // copied out before the frame is shown; the next frame draws over that corner.
  snapshot(b: { minX: number; maxX: number; minY: number; maxY: number }, long: number): HTMLCanvasElement {
    const r = this.renderer, gl = r.domElement, pr = r.getPixelRatio();
    const s = long / Math.max(b.maxX - b.minX, b.maxY - b.minY); // pixels per cm
    const W = Math.round((b.maxY - b.minY) * s), H = Math.round((b.maxX - b.minX) * s);
    const out = document.createElement("canvas");
    out.width = W;
    out.height = H;
    const g = out.getContext("2d")!;
    const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;

    // put away what is not scenery: the characters, the target ring, the cutaway, the fog
    const hidden: THREE.Object3D[] = [this.ring, this.area, ...[...this.boards.values()].flatMap((bb) => (bb.ghost ? [bb.sprite, bb.ghost] : [bb.sprite]))].filter((o) => o.visible);
    for (const o of hidden) o.visible = false;
    const fog = this.scene.fog as THREE.Fog | null, fogWas = fog ? [fog.near, fog.far] : null;
    if (fog) [fog.near, fog.far] = [1e7, 2e7];
    CUT.value.w = 0;
    // the sun's shadows over the whole map, from higher than in play so they stay short
    const sc = this.sun.shadow.camera, half = Math.hypot(W, H) / s / 2 + 1000;
    this.sun.target.position.set(cx, 0, -cy);
    this.sun.position.set(cx, 0, -cy).add(new THREE.Vector3(-0.35, 1, -0.42).normalize().multiplyScalar(40000));
    Object.assign(sc, { left: -half, right: half, top: half, bottom: -half, near: 100, far: 80000 });
    sc.updateProjectionMatrix();
    r.shadowMap.needsUpdate = true;

    // tiles as large as the canvas allows; the camera looks down with +X up the picture
    const T = Math.max(64, Math.min(1024, gl.width, gl.height));
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 10, 20000);
    cam.position.set(cx, 9000, -cy);
    cam.up.set(1, 0, 0);
    cam.lookAt(cx, 0, -cy);
    r.setScissorTest(true);
    r.setViewport(0, 0, T / pr, T / pr);
    r.setScissor(0, 0, T / pr, T / pr);
    for (let y0 = 0; y0 < H; y0 += T)
      for (let x0 = 0; x0 < W; x0 += T) {
        cam.left = (x0 - W / 2) / s;
        cam.right = (x0 + T - W / 2) / s;
        cam.top = (H / 2 - y0) / s;
        cam.bottom = (H / 2 - y0 - T) / s;
        cam.updateProjectionMatrix();
        r.render(this.scene, cam);
        g.drawImage(gl, 0, gl.height - T, Math.min(T, W - x0), Math.min(T, H - y0), x0, y0, Math.min(T, W - x0), Math.min(T, H - y0));
      }

    // and back as it was
    r.setScissorTest(false);
    const size = r.getSize(new THREE.Vector2());
    r.setViewport(0, 0, size.x, size.y);
    Object.assign(sc, { left: -3400, right: 3400, top: 3400, bottom: -3400, near: 100, far: 11000 });
    sc.updateProjectionMatrix();
    this.shadowAt.set(1e9, 0, 0);
    if (fog && fogWas) [fog.near, fog.far] = fogWas;
    for (const o of hidden) o.visible = true;
    return out;
  }
}

// ---- the cutaway: lit surfaces more than 70 cm up and nearer the camera than the player are
// dithered away in a circle round her on screen ----
const CUT = { value: new THREE.Vector4(0, 0, 0, 0) }; // the player in view space, the radius
const cutDone = new WeakSet<THREE.Material>();
function cutaway(m: THREE.Material): void {
  const lit = m as THREE.Material & { isMeshStandardMaterial?: boolean; isMeshLambertMaterial?: boolean; isMeshPhongMaterial?: boolean };
  if (cutDone.has(m) || !(lit.isMeshStandardMaterial || lit.isMeshLambertMaterial || lit.isMeshPhongMaterial)) return;
  cutDone.add(m);
  // keep the material's own changes, and its own program apart from others'
  const prev = m.onBeforeCompile, key = m.customProgramCacheKey();
  m.onBeforeCompile = (shader, renderer) => {
    prev.call(m, shader, renderer);
    shader.uniforms.uCut = CUT;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vCutY;")
      .replace("#include <project_vertex>", `#include <project_vertex>
        vec4 cutW = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
        cutW = instanceMatrix * cutW;
        #endif
        vCutY = (modelMatrix * cutW).y;`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vCutY;\nuniform vec4 uCut;")
      .replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>
        if (uCut.w > 0.0 && vCutY > 70.0 && -vViewPosition.z > uCut.z + 80.0) {
          float r = length(-vViewPosition.xy - uCut.xy) / uCut.w;
          float n = fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711056, 0.00583715))));
          if (r < 1.0 && n > smoothstep(0.65, 1.0, r)) discard;
        }`);
  };
  m.customProgramCacheKey = () => key + "|cut";
  m.needsUpdate = true;
}

// A warp portal as Ragnarok draws one: a glowing ring on the ground and a soft column of light.
function portal(): THREE.Group {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(55, 95, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: "#7fd0ff", transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  ring.position.y = 2;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(70, 95, 260, 32, 1, true).translate(0, 130, 0),
    new THREE.MeshBasicMaterial({ color: "#5fb8ff", transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  );
  const swirl = new THREE.Mesh(
    new THREE.RingGeometry(20, 50, 6).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: "#d8f2ff", transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  swirl.position.y = 3;
  g.add(ring, beam, swirl);
  return g;
}

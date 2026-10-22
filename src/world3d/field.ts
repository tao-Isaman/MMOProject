// What every field is built with: open country between the towns, put together like a town
// (src/world3d/town.ts: kit pieces placed by name, instanced, scaled by TOWN_SCALE) on ground
// that rises and falls (src/world3d/terrain.ts: hills, plateaus with cliffs, ramps up them),
// tracks of bare earth between its ways in and out, water, and the spots where its monsters
// live. A rim of thick woods, rock or water stands round the walkable box so its edge never
// shows.
//
// Like a town it is laid out at full size in its own centimetres (north +X, east -Y) and scaled
// as a whole in finish. Its ways out are warps to the maps next door (src/maps.ts): `exit(to,
// at, back)` puts the warp at `at` and says that whoever comes back from `to` arrives at `back`.

import * as THREE from "three";
import { material } from "./textures";
import { buildPaved } from "./paved";
import type { Paved, PavedSpec, Poly } from "./paved";
import { Terrain } from "./terrain";
import { Terrain as LegacyTerrain } from "./terrain_legacy"; // TEMP
const LEGACY = typeof location !== "undefined" && location.search.includes("legacyTerrain"); // TEMP
import type { TerrainSpec } from "./terrain";
import { TownBuilder, protoOf, solidsOf } from "./town";
import type { Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import type { MapLabel } from "../maps";

type XY = [number, number];
type Box = { x0: number; x1: number; y0: number; y1: number };

export class FieldBuilder extends TownBuilder {
  declare terrain: Terrain;
  warps: Town["warps"] = [];
  gates: Record<string, { x: number; y: number }> = {};
  spots: { x: number; y: number }[] = [];

  constructor(seed: number, terrain: TerrainSpec) {
    super(seed);
    this.terrain = (LEGACY ? new LegacyTerrain(terrain) : new Terrain(terrain)) as Terrain; // TEMP
  }

  // The ground: a plane over `area` raised to the terrain (its points moved onto the tops and
  // feet of the cliffs), with tracks of bare earth (`roads`, unless `track: false` makes them
  // cobbles) and `water` cut out of it.
  ground(spec: Omit<PavedSpec, "height" | "place">): Paved {
    return buildPaved({ track: true, ...spec, height: (x, y) => this.terrain.height(x, y), ...(LEGACY ? {} : { place: (x: number, y: number, cell: number) => this.terrain.place(x, y, cell) }) }); // TEMP
  }

  // The ground's height at a point (full size, before the scale).
  h = (x: number, y: number): number => this.terrain.height(x, y);

  // A way out to map `to`: a warp at `at`, r across; whoever comes back from `to` arrives at
  // `back` (a few metres inside, clear of the warp).
  exit(to: string, at: XY, back: XY, r = 160): void {
    this.warps.push({ x: at[0], y: at[1], r, to });
    this.gates[to] = { x: back[0], y: back[1] };
  }

  // Water: a flat sheet at `level` under the ground (it shows where the ground's `water` polygons
  // cut holes), for finish's scenery.
  waterSheet(box: Box, level = -14, mat = "WaterSea"): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(box.x1 - box.x0, box.y1 - box.y0).rotateX(-Math.PI / 2), material(mat));
    m.position.set((box.x0 + box.x1) / 2, level, -(box.y0 + box.y1) / 2);
    m.receiveShadow = true;
    return m;
  }

  // Solids that keep everyone out of a river or a lake shore: boxes along a polyline `width`
  // across, every `step` cm, except within `gapR` of each point in `gaps` (a bridge, a ford).
  blockBand(pts: XY[], width: number, o: { gaps?: XY[]; gapR?: number; step?: number; kind?: string } = {}): void {
    const step = o.step ?? 250, gapR = o.gapR ?? 260;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L / step));
      const rot = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
        if ((o.gaps ?? []).some(([gx, gy]) => Math.hypot(gx - x, gy - y) < gapR)) continue;
        this.extra.push({ kind: o.kind ?? "water", x, y, w: L / n + 40, d: width, rot });
      }
    }
  }

  // A round pond or lake (a solid disc).
  blockDisc(at: XY, r: number, kind = "water"): void {
    this.extra.push({ kind, x: at[0], y: at[1], r });
  }

  // Where the monsters live: a jittered grid over `box`, on level open ground (not a track or
  // water, not walled in by cliffs), clear of everything placed so far, `away` cm from every
  // way out, and not where `keepOut` says; no more than `max`, kept evenly spread. Call it after
  // the props are placed.
  monsterSpots(ground: Paved, box: Box, o: { step?: number; away?: number; max?: number; keepOut?: (x: number, y: number) => boolean } = {}): void {
    const step = o.step ?? 900, away = o.away ?? 1200, rnd = this.rnd, found: { x: number; y: number }[] = [];
    const solids: SolidSpec[] = [...this.extra, ...this.terrain.solids()];
    for (const pl of this.puts) solids.push(...solidsOf(pl, protoOf(pl.ref, pl.colours)));
    // within 1.8 m of a solid (a box measured to its sides, so a long cliff only clears a strip)
    const near = (x: number, y: number) =>
      solids.some((s) => {
        if ("r" in s) return Math.hypot(s.x - x, s.y - y) < s.r + 180;
        const a = (s.rot * Math.PI) / 180, dx = x - s.x, dy = y - s.y;
        const u = Math.abs(dx * Math.cos(a) + dy * Math.sin(a)) - s.w / 2, v = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a)) - s.d / 2;
        return Math.hypot(Math.max(0, u), Math.max(0, v)) < 180;
      });
    for (let x = box.x0 + step / 2; x < box.x1; x += step)
      for (let y = box.y0 + step / 2; y < box.y1; y += step) {
        const px = x + (rnd() - 0.5) * step * 0.6, py = y + (rnd() - 0.5) * step * 0.6;
        if (ground.kind(px, py) !== 0 || !this.terrain.level(px, py, 200) || this.terrain.walledOff(px, py) || near(px, py)) continue;
        if (this.warps.some((w) => Math.hypot(w.x - px, w.y - py) < away) || o.keepOut?.(px, py)) continue;
        found.push({ x: px, y: py });
      }
    // too many: each next the one farthest from those kept
    const max = o.max ?? 60;
    if (found.length > max) {
      const kept = [found.shift()!];
      const gap = found.map((p) => Math.hypot(p.x - kept[0].x, p.y - kept[0].y));
      while (kept.length < max && found.length) {
        let best = 0;
        for (let i = 1; i < found.length; i++) if (gap[i] > gap[best]) best = i;
        const [p] = found.splice(best, 1);
        gap.splice(best, 1);
        kept.push(p);
        found.forEach((q, i) => (gap[i] = Math.min(gap[i], Math.hypot(q.x - p.x, q.y - p.y))));
      }
      found.length = 0;
      found.push(...kept);
    }
    this.spots.push(...found);
  }

  // Everything into the game's terms (see TownBuilder.finish), with the field's ways out, the
  // gates back in and the monsters' spots.
  finishField(o: {
    ground: Paved;
    scenery?: THREE.Object3D[];
    sky: string;
    flowers?: { box: { x: number; y: number; w: number; h: number }; open: (x: number, y: number) => boolean; density: number };
    late?: SolidSpec[];
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
    spawn: { x: number; y: number };
    npcs?: NpcSpec[];
    closed?: Town["closed"];
    labels: MapLabel[];
  }): Town {
    { // TEMP
      const legacy = new LegacyTerrain(this.terrain.spec);
      (window as unknown as { __terrainDiff: unknown }).__terrainDiff = this.puts
        .map((pl) => ({ ref: pl.ref, at: [Math.round(pl.x), Math.round(pl.y)], d: Math.round(this.terrain.height(pl.x, pl.y) - legacy.height(pl.x, pl.y)) }))
        .filter((p) => Math.abs(p.d) > 25);
    }
    return this.finish({ ...o, npcs: o.npcs ?? [], closed: o.closed ?? [], warps: this.warps, gates: this.gates, spots: this.spots });
  }
}

// A placeholder field until the real one is built: flat grass, a ring of trees, a way back to
// each map next door along the edges.
export function placeholderField(seed: number, ways: { to: string; side: "n" | "s" | "e" | "w" }[]): Town {
  const f = new FieldBuilder(seed, {});
  const R = 4000;
  const ground = f.ground({ area: { x0: -R - 3000, y0: -R - 3000, x1: R + 3000, y1: R + 3000 }, roads: [] as Poly[], plazas: [] });
  for (const w of ways) {
    const d: XY = w.side === "n" ? [1, 0] : w.side === "s" ? [-1, 0] : w.side === "w" ? [0, 1] : [0, -1];
    f.exit(w.to, [d[0] * (R - 200), d[1] * (R - 200)], [d[0] * (R - 900), d[1] * (R - 900)]);
  }
  f.woods({ x0: -R - 3000, x1: R + 3000, y0: -R - 3000, y1: R + 3000 }, ["BigOak", "RoundTree", "SmallTree"], (x, y) => Math.abs(x) < R + 300 && Math.abs(y) < R + 300, { count: 160 });
  f.monsterSpots(ground, { x0: -R + 400, x1: R - 400, y0: -R + 400, y1: R - 400 });
  return f.finishField({ ground, sky: "#3d5a2a", bounds: { minX: -R, maxX: R, minY: -R, maxY: R }, spawn: { x: 0, y: 0 }, labels: [] });
}

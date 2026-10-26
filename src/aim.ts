// Aiming a skill with the mouse (main.ts does the input; touch and the bot don't aim). A skill's
// key or its slot picks it up, and what it waits for depends on the kind of skill it casts:
//   target     a single-target skill (skills.ts singleTarget): a monster clicked within the
//              ring of its reach (one farther off is walked up to first)
//   ground     one placed on a spot (groundTarget): a disc under the mouse, no farther than the
//              ring of its range
//   direction  one that goes out from the player along a line or a wedge (wide cone, fan,
//              beam, a piercing shot, a dash): its shape turns toward the mouse
//   self       one round the player (nova, storm): its circle follows her
//   instant    the rest (heals, buffs, shields, orbs, forms, summons without a range...) go off
//              at once as before
// The shapes are the areas the skill really hits, from the same numbers (and the same defaults)
// its hit code in skills.ts goes by.

import { groundTarget, lockReach, singleTarget } from "./skills";
import type { SkillDef } from "./progression";
import type { Vec2 } from "./types";

export type AimKind = "target" | "ground" | "direction" | "self" | "instant";

export function aimKind(s: SkillDef): AimKind {
  if (singleTarget(s)) return "target";
  if (groundTarget(s)) return "ground";
  switch (s.type) {
    case "cone": case "fan": case "beam": case "bolt": case "dash": return "direction";
    case "nova": case "storm": return "self";
    default: return "instant";
  }
}

// A shape lying on the ground from (x, y) toward (dirX, dirY), cm: a circle of r round it, a
// wedge r long and `arc` degrees wide, or a strip `len` long and `width` across.
export interface AimShape {
  kind: "circle" | "sector" | "rect";
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  r: number;
  arc?: number;
  len?: number;
  width?: number;
  color: string;
}

// What an aimed skill shows: the ring of how far it reaches round the player (0: none), its
// shape, and the disc where it lands (a ground skill's spot, a dash's end).
export interface AimPreview {
  range: number;
  shape: AimShape | null;
  disc: { x: number; y: number; r: number } | null;
  color: string;
}

export const aimColor = (s: SkillDef) => s.color ?? "#ffd27a";

// How far a ground skill can be put down (trap: skills.ts effect; blast, summon, smoke: as they
// land) and how wide what lands there is (a summon has no area: a mark where it stands up).
export function groundReach(s: SkillDef): number {
  return s.type === "trap" ? s.range ?? 400 : s.range ?? 500;
}
function groundRadius(s: SkillDef): number {
  return s.type === "trap" ? s.radius ?? 90 : s.type === "smoke" ? s.radius ?? 220 : s.type === "summon" ? s.radius ?? 60 : s.radius ?? 150;
}

// The spot a ground skill lands on for a point under the mouse: there, or as far as it reaches
// that way.
export function groundSpot(s: SkillDef, from: Vec2, at: Vec2): Vec2 {
  const range = groundReach(s), dx = at.x - from.x, dy = at.y - from.y, d = Math.hypot(dx, dy);
  return d <= range ? { x: at.x, y: at.y } : { x: from.x + (dx / d) * range, y: from.y + (dy / d) * range };
}

// The preview of skill s aimed by the player at `from` toward the ground point `at` (null: the
// mouse is off the game, so she aims the way she faces).
export function aimPreview(s: SkillDef, from: Vec2, at: Vec2 | null, facing: Vec2): AimPreview {
  const color = aimColor(s), kind = aimKind(s);
  const out: AimPreview = { range: 0, shape: null, disc: null, color };
  let dir = facing;
  if (at) {
    const dx = at.x - from.x, dy = at.y - from.y, d = Math.hypot(dx, dy);
    if (d > 1) dir = { x: dx / d, y: dy / d };
  }
  const shape = (kind: AimShape["kind"], r: number, more: Partial<AimShape> = {}): AimShape =>
    ({ kind, x: from.x, y: from.y, dirX: dir.x, dirY: dir.y, r, color, ...more });
  if (kind === "target") out.range = lockReach(s);
  else if (kind === "ground") {
    out.range = groundReach(s);
    if (at) out.disc = { ...groundSpot(s, from, at), r: groundRadius(s) };
  } else if (kind === "self") out.shape = shape("circle", s.radius ?? 200);
  else if (kind === "direction") {
    switch (s.type) {
      case "cone": out.shape = shape("sector", s.reach ?? 150, { arc: s.arc ?? 90 }); break;
      case "fan": out.shape = shape("sector", s.range ?? 500, { arc: s.spread ?? 40 }); break;
      case "beam": out.shape = shape("rect", 0, { len: s.length ?? 500, width: s.width ?? 40 }); break;
      // a piercing shot: the strip its shot sweeps, as wide as the shot
      case "bolt": out.shape = shape("rect", 0, { len: s.range ?? 500, width: (s.radius ?? 30) * 2 }); break;
      case "dash": {
        // the way she goes (what she passes within `width` is struck) and where she stops
        const len = s.distance ?? 200, w = s.width ?? 60;
        out.shape = shape("rect", 0, { len, width: w * 2 });
        out.disc = { x: from.x + dir.x * len, y: from.y + dir.y * len, r: w };
        break;
      }
    }
  }
  return out;
}

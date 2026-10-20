// Weapons drawn into the character's hand while attacking or casting.
//
// The character sprite is empty-handed. tools/hand_anchors.py finds the hands in every attack
// and cast frame (assets/hand_anchors.json); the weapon is drawn with its grip on the hand,
// pointing out from the body along the arm.

import { toView } from "./projection.js";

const DEG = Math.PI / 180;

// Weapon art: where the grip is (fraction of the sprite's height from the top), how far the
// sprite sits behind the hand, and whether a second copy goes in the other hand.
export const WEAPON_ART = {
  sword_1h: { grip: 0.81 },
  sword_2h: { grip: 0.83 },
  axe: { grip: 0.82 },
  mace: { grip: 0.84 },
  spear_1h: { grip: 0.75 },
  spear_2h: { grip: 0.69 },
  dagger: { grip: 0.75 },
  dual_daggers: { grip: 0.75, art: "dagger", pair: true },
  staff: { grip: 0.6, scale: 0.75, upright: true }, // drawn at the 128 px sprite's pixel size
  bow: { grip: 0.5, upright: true },
};

// Angle (radians, 0 = pointing up the screen, clockwise) of a weapon held at hand h by a body
// centred at c, in sprite px. Hands close to the body hold the weapon along the facing.
export function weaponAngle(h, c, facingAngle) {
  const dx = h[0] - c[0], dy = h[1] - c[1];
  const d = Math.hypot(dx, dy);
  if (d < 6) return facingAngle;
  const arm = Math.atan2(dx, -dy);
  // blend toward the facing so a weapon held low still points ahead
  const w = Math.min(1, (d - 6) / 14);
  return lerpAngle(facingAngle, arm, w);
}

function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  return a + d * t;
}

// Screen angle (0 = up, clockwise) of a world facing vector; the forward axis is squashed.
export function screenAngle(v) {
  const s = toView(v.x, v.y);
  return Math.atan2(-s.left, s.fwd * Math.SQRT1_2);
}

// Draw one weapon sprite with its grip at (x, y) screen px.
export function drawWeapon(ctx, img, art, x, y, angle, scale, alpha = 1) {
  if (!img) return;
  const w = img.width * scale, h = img.height * scale;
  ctx.globalAlpha = alpha;
  const a = art.upright ? angle * 0.25 : angle;
  ctx.setTransform(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), x, y);
  ctx.drawImage(img, -w / 2, -h * art.grip, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
}

// Tip of a drawn weapon (for the staff gem glow and projectile origins), screen px.
export function weaponTip(img, art, x, y, angle, scale) {
  const len = img.height * scale * art.grip;
  return { x: x + Math.sin(angle) * len, y: y - Math.cos(angle) * len };
}

export { DEG };

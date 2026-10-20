"""Walk and attack sheets made from the 8 direction frames of the idle sheet.

usage: python3 tools/animate_sprite.py assets/mage_idle.png assets/

Oriverse's sprite action generation failed for this character (every job: "Animation first
frame differs from its retained input"), so the motion is built here instead: the boots step
alternately while the body bobs, and the attack leans back then lunges toward the facing
direction. Also prints the staff gem position per direction (GEMS in src/player.js)."""
import math, sys
import numpy as np
from PIL import Image

IDLE, OUT = sys.argv[1], sys.argv[2]
C = 128
idle = np.array(Image.open(IDLE))
# screen-space facing per sheet row (x right, y down), Oriverse order S, SW, W, NW, N, NE, E, SE
FACE = [(0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1), (1, 0), (1, 1)]

def shift(img, dx, dy):
    out = np.zeros_like(img)
    h, w = img.shape[:2]
    xs0, xs1 = max(0, -dx), min(w, w - dx)
    ys0, ys1 = max(0, -dy), min(h, h - dy)
    out[ys0 + dy:ys1 + dy, xs0 + dx:xs1 + dx] = img[ys0:ys1, xs0:xs1]
    return out

def over(dst, src):
    m = src[..., 3] > 0
    dst[m] = src[m]
    return dst

def leg_top(frame):
    # the coat hem is the last wide row; legs start where the silhouette narrows below it
    a = frame[..., 3] > 0
    widths = a.sum(1)
    for y in range(127, 80, -1):
        if widths[y] > widths[120] * 1.6:
            return y + 1
    return 108

def walk_frames(frame, d):
    top = leg_top(frame)
    body = frame.copy(); body[top:] = 0
    # legs start a few rows under the hem so a bobbing body never opens a gap
    legs = frame.copy(); legs[:top - 3] = 0
    cols = np.where(legs[..., 3].any(0))[0]
    mid = int(np.median(cols)) if len(cols) else 64
    left = legs.copy(); left[:, mid:] = 0
    right = legs.copy(); right[:, :mid] = 0
    fx, fy = FACE[d]
    out = []
    for f in range(8):
        s = math.sin(2 * math.pi * f / 8)
        bob = -round(abs(s) * 2)
        lift_l, lift_r = round(max(0, s) * 5), round(max(0, -s) * 5)
        # side-on views also swing the lifted foot forward a little
        swing = 3 if fy == 0 else 2
        img = np.zeros_like(frame)
        over(img, shift(left, round(fx * swing * max(0, s)), -lift_l))
        over(img, shift(right, round(fx * swing * max(0, -s)), -lift_r))
        over(img, shift(body, 0, bob))
        out.append(img)
    return out

def attack_frames(frame, d):
    fx, fy = FACE[d]
    # (lean px toward facing: negative = wind back), lift px
    keys = [(0, 0), (-2, 1), (-4, 2), (-4, 3), (3, 0), (6, -1), (5, 0), (2, 0)]
    top = leg_top(frame)
    out = []
    for lean, lift in keys:
        upper = frame.copy(); upper[top:] = 0
        lower = frame.copy(); lower[:top - 3] = 0
        # shear the upper body: rows higher up move further
        sheared = np.zeros_like(upper)
        for y in range(top):
            k = (top - y) / top
            row = upper[y:y + 1]
            sheared[y:y + 1] = shift(row, round(fx * lean * k * 1.5), 0)
        img = np.zeros_like(frame)
        over(img, lower)
        over(img, shift(sheared, round(fx * lean * 0.5), -lift + round(fy * lean * 0.5)))
        out.append(img)
    return out

walk = np.zeros((C * 8, C * 8, 4), np.uint8)
atk = np.zeros((C * 8, C * 8, 4), np.uint8)
for d in range(8):
    frame = idle[d * C:(d + 1) * C]
    for f, img in enumerate(walk_frames(frame, d)):
        walk[d * C:(d + 1) * C, f * C:(f + 1) * C] = img
    for f, img in enumerate(attack_frames(frame, d)):
        atk[d * C:(d + 1) * C, f * C:(f + 1) * C] = img
# staff gem (red) centre per direction, for the glow drawn by the web client
gems = []
for d in range(8):
    f = idle[d * C:(d + 1) * C].astype(int)
    red = (f[..., 3] > 0) & (f[..., 0] > 170) & (f[..., 1] < 70) & (f[..., 2] < 80)
    red[60:] = False  # the gem sits high on the staff; ignore ribbons and trim below
    ys, xs = np.where(red)
    if len(xs):
        gems.append([int(round(xs.mean())), int(round(ys.mean()))])
    else:  # gem turned away: use the staff's tip, the topmost pixel
        ys, xs = np.where(f[..., 3] > 0)
        top = ys.min()
        gems.append([int(round(xs[ys == top].mean())), int(top) + 3])
print("gems", gems)
Image.fromarray(walk, "RGBA").save(f"{OUT}/mage_walk.png", optimize=True)
Image.fromarray(atk, "RGBA").save(f"{OUT}/mage_attack.png", optimize=True)

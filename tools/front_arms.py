"""Redraw the front-facing frame's arms in a natural A-pose.

usage: python3 tools/front_arms.py assets/mage_idle.png south.png south-west.png south-east.png

The generated front view draws each sleeve as a flat-topped box standing beside the coat, so
the arms look detached. The diagonal views draw natural arms, so this takes the screen-left
arm from the south-west frame and the screen-right arm from the south-east frame (preview
sheets, as for tools/sprite_cells.py), tilts them outward, tucks their tops under the capelet
and lets them overlap the coat edge below it; the old sleeves are replaced with hair. Writes
row 0 of the idle sheet; run tools/animate_sprite.py afterwards.
"""
import sys
import numpy as np
from PIL import Image
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from sprite_cells import cells

SHEET, SOUTH, SOUTH_WEST, SOUTH_EAST = sys.argv[1:5]
TILT = 0.25      # px outward per px down
CAPE = 64        # above this row the arm goes behind the coat and capelet
front = cells(SOUTH)[0].copy()
sw = cells(SOUTH_WEST)[0]
se = cells(SOUTH_EAST)[0]

def hairish(px):
    r, g, b, a = [int(v) for v in px]
    return a > 0 and b > r + 6

def armish(px):
    r, g, b, a = [int(v) for v in px]
    return a > 0 and not (b > r + 6)

staff = np.zeros((128, 128), bool)
for y in range(40, 124):
    for x in range(89, 97):
        r, g, b, a = [int(v) for v in front[y, x]]
        if a and r > g > b and r - b > 60 and not (r > 240 and g > 230):
            staff[y, x] = True

def hair_at(y, x, away):
    # keep the hair texture: whole-block shifts first, nearest hair pixel as a last resort
    for d in (12, 18, 24, 8, 30):
        sx = x + away * d
        if 0 <= sx < 128 and hairish(front[y, sx]):
            return front[y, sx]
    for d in range(1, 30):
        for dy in (0, -2, 2):
            sx, sy = x + away * d, y + dy
            if 0 <= sx < 128 and 0 <= sy < 128 and hairish(front[sy, sx]):
                return front[sy, sx]
    return np.zeros(4, np.uint8)

# body layer: the front frame with its box sleeves replaced by hair
body = front.copy()
coat = np.zeros((128, 128), bool)
for (x0, x1, away) in ((34, 49, -1), (80, 95, +1)):
    for y in range(52, 90):
        for x in range(x0, x1):
            if armish(front[y, x]) and not staff[y, x]:
                body[y, x] = hair_at(y, x, away)
# coat pixels (kept above the arm's top, under the capelet)
for y in range(40, 100):
    for x in range(44, 85):
        if armish(body[y, x]):
            coat[y, x] = True

def arm_mask(img, rect, seed):
    x0, y0, x1, y1 = rect
    m = np.zeros(img.shape[:2], bool)
    stack = [seed]
    while stack:
        x, y = stack.pop()
        if not (x0 <= x < x1 and y0 <= y < y1) or m[y, x] or not armish(img[y, x]):
            continue
        m[y, x] = True
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return m

out = body.copy()
pasted = np.zeros((128, 128), bool)
OUTLINE = np.array([0x5C, 0x30, 0x28, 255], np.uint8)
def paste(img, m, dx, outward):
    ys, xs = np.where(m)
    top = ys.min()
    for y, x in zip(ys, xs):
        tx = x + dx + outward * round((y - top) * TILT)
        if not (0 <= tx < 128):
            continue
        if y < CAPE and coat[y, tx]:
            continue  # tucked under the capelet
        out[y, tx] = img[y, x]
        pasted[y, tx] = True
    # the tilt shifts rows in steps; close the outer outline where a light sleeve pixel
    # now touches hair or empty space
    ys, xs = np.where(pasted)
    for y, x in zip(ys, xs):
        r, g, b, a = [int(v) for v in out[y, x]]
        if r + g + b < 360:
            continue
        nx = x + outward
        if 0 <= nx < 128 and not pasted[y, nx] and not coat[y, nx]:
            out[y, nx] = OUTLINE

lm = arm_mask(sw, (28, 50, 47, 92), (40, 68))
rm = arm_mask(se, (82, 50, 101, 92), (87, 68))
paste(sw, lm, 5, -1)
paste(se, rm, -4, +1)
out[staff] = front[staff]
sheet = np.array(Image.open(SHEET).convert("RGBA"))
sheet[0:128] = out
Image.fromarray(sheet, "RGBA").save(SHEET, optimize=True)
print("front arms redrawn in", SHEET)

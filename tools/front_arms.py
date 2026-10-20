"""Redraw the front-facing frame's shoulders and arms: each sleeve runs in one piece from the
collar over the shoulder and down to a bell cuff.

usage: python3 tools/front_arms.py assets/mage_idle.png south.png

The generated front view draws each sleeve as a flat-topped box standing beside the coat, so
the arms look detached. This replaces the boxes with hair and paints, in the sprite's own flat
palette: from the collar the shoulder rounds over and turns straight into the sleeve, as on the
character sheet; the sleeve hangs slightly away from the body and widens into a bell at the
wrist, with a gold cuff and the hand below. `south.png` is the Oriverse preview sheet
of the front direction (as for tools/sprite_cells.py). Writes row 0 of the idle sheet; run
tools/animate_sprite.py afterwards.
"""
import sys
import numpy as np
from PIL import Image
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from sprite_cells import cells

SHEET, SOUTH = sys.argv[1:3]
MIRROR = 129     # x + mirrored x: the front view is symmetric about x = 64.5
COLLAR = 67      # the original collar and lapels (coat pixels above this row) stay on top
# screen-left sleeve, sprite px: the shoulder line rounds from NECK out to SHOULDER, where the
# outer edge turns down and flares out to OUTER_CUFF; the body-side edge runs along INNER
NECK = (51.0, 51.0)
SHOULDER = (43.5, 59.0)
CUFF = 84
INNER = (51.0, 48.0)
OUTER_CUFF = 35.0
CUFF_RISE = 2    # the cuff's outer corner sits this much higher than its inner corner
BAND = 2         # gold cuff, rows

def rgba(h):
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)] + [255], np.uint8)

# the front sprite's own flat palette
LIGHT, MID, SHADE = rgba("fdf9f2"), rgba("fae5d7"), rgba("ceaaa6")
OUTLINE, GOLD, GOLD_SHADE = rgba("5c3028"), rgba("c88845"), rgba("ad6d38")
SKIN, SKIN_SHADE = rgba("fcdbc4"), rgba("e7c2b6")

front = cells(SOUTH)[0].copy()

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
for (x0, x1, away) in ((34, 49, -1), (80, 95, +1)):
    for y in range(52, 90):
        for x in range(x0, x1):
            if armish(front[y, x]) and not staff[y, x]:
                body[y, x] = hair_at(y, x, away)
collar = np.zeros((128, 128), bool)
for y in range(44, COLLAR):
    for x in range(49, 81):
        if armish(body[y, x]):
            collar[y, x] = True


def outline(layer, shape, also=None):
    """1 px outline inside the silhouette (and wherever `also` says, e.g. cuff above hand)."""
    for y, x in zip(*np.where(shape)):
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if not shape[ny, nx] or (also is not None and also(y, x, ny, nx)):
                layer[y, x] = OUTLINE
                break


def paint_left_arm():
    """Screen-left sleeve and hand as an RGBA layer, plus a mask of the hand pixels."""
    layer = np.zeros((128, 128, 4), np.uint8)
    (nx, ny), (sx, sy) = NECK, SHOULDER
    xi0, xi1 = INNER

    def edges(y):
        hi = xi0 + (xi1 - xi0) * min(1.0, max(0.0, (y - ny) / (CUFF - ny)))
        if y < sy:  # rounded shoulder
            k = np.sqrt(max(0.0, 1 - ((sy - y) / (sy - ny)) ** 2))
            return nx - k * (nx - sx), hi
        t = (y - sy) / (CUFF - sy)
        return sx + (OUTER_CUFF - sx) * t ** 1.4, hi

    def cuff_y(x):  # bottom of the sleeve under column x
        return CUFF - CUFF_RISE * (xi1 - x) / (xi1 - OUTER_CUFF)

    sleeve = np.zeros((128, 128), bool)
    across = np.zeros((128, 128))  # 0 outer edge .. 1 body side
    for y in range(int(ny), CUFF + 1):
        lo, hi = edges(y)
        for x in range(int(lo), int(hi) + 2):
            if lo - 0.5 <= x <= hi + 0.5 and y <= cuff_y(x) + 0.5:
                sleeve[y, x] = True
                across[y, x] = (x - lo) / max(1.0, hi - lo)
    mid = (OUTER_CUFF + xi1) / 2
    hand_c = (mid + 1.0, cuff_y(mid) + 3.5)
    hand = np.zeros((128, 128), bool)
    for y in range(CUFF - 6, CUFF + 9):
        for x in range(int(OUTER_CUFF) - 2, int(xi1) + 3):
            if ((x - hand_c[0]) / 4.0) ** 2 + ((y - hand_c[1]) / 4.2) ** 2 <= 1:
                hand[y, x] = True
    hand &= ~sleeve
    for y, x in zip(*np.where(hand)):
        lit = (x - hand_c[0]) < 1.5 and (y - hand_c[1]) < 1.5
        layer[y, x] = SKIN if lit else SKIN_SHADE
    for y, x in zip(*np.where(sleeve)):
        u = across[y, x]
        if y > cuff_y(x) - BAND:
            layer[y, x] = GOLD if u < 0.6 else GOLD_SHADE
            continue
        layer[y, x] = LIGHT if u < 0.55 else MID if u < 0.82 else SHADE
        # one crease down the bell
        if y > sy:
            lo, hi = edges(y)
            t = (y - sy) / (CUFF - sy)
            if t > 0.5 and abs(x - (lo + (hi - lo) * (0.62 - 0.3 * t))) < 0.5:
                layer[y, x] = MID
    outline(layer, sleeve | hand, lambda y, x, ny, nx: sleeve[y, x] and hand[ny, nx])
    return layer, hand


def mirror(img):
    out = np.zeros_like(img)
    out[:, MIRROR - 127:] = img[:, ::-1][:, :127 - (MIRROR - 127) + 1]
    return out


arm, hand = paint_left_arm()
out = body.copy()
for layer, grip in ((arm, hand), (mirror(arm), mirror(hand))):
    for y, x in zip(*np.where(layer[..., 3] > 0)):
        if collar[y, x]:
            continue  # the original collar and lapels sit on top
        if staff[y, x] and not (grip is not None and grip[y, x]):
            continue  # the staff stands in front, behind the gripping hand
        out[y, x] = layer[y, x]
sheet = np.array(Image.open(SHEET).convert("RGBA"))
sheet[0:128] = out
Image.fromarray(sheet, "RGBA").save(SHEET, optimize=True)
print("front shoulders and arms redrawn in", SHEET)

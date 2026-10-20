"""Draw the weapon and item pixel art.

usage: python3 tools/draw_items.py assets

Writes assets/weapons/<type>.png (upright: tip at the top, grip at the bottom, at the
character's pixel size) and assets/items/<name>.png (inventory icons and the arrow). The art
follows the Oriverse sprites: black outline, flat shading ramps lit from the upper left,
one bright specular line per surface.
"""
import math
import os
import sys
import numpy as np
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else "assets"


def hexc(h):
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)


INK = hexc("140f14")
STEEL = [hexc(c) for c in ("4a4f63", "7a8299", "aab2c6", "d6dcea", "ffffff")]
GOLD = [hexc(c) for c in ("6b4214", "a8692a", "d9a441", "f4d27a", "fff2c2")]
WOOD = [hexc(c) for c in ("40261a", "6b3f24", "93592f", "b9783f", "d99a5a")]
LEATHER = [hexc(c) for c in ("2e1c16", "4f2f22", "6e4330", "8c5a41")]
RED = [hexc(c) for c in ("4d1220", "8e1f33", "c9384a", "ee6a72")]
WHITE = [hexc(c) for c in ("8f8a99", "c9c4d2", "eceaf2", "ffffff")]
MINT = [hexc(c) for c in ("1f6b52", "3fa77f", "79dcae", "c9ffe0", "ffffff")]
LEAF = [hexc(c) for c in ("1d4a1f", "2f7a2c", "4fae3f", "8fdc63")]


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = np.zeros((h, w, 4), np.uint8)

    def set(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y, x] = c

    def filled(self, x, y):
        return 0 <= x < self.w and 0 <= y < self.h and self.px[y, x, 3] > 0

    def outline(self, color=INK):
        a = self.px[..., 3] > 0
        edge = np.zeros_like(a)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            edge |= np.roll(np.roll(a, dy, 0), dx, 1)
        edge &= ~a
        # np.roll wraps around; clear the wrapped borders
        self.px[edge] = color
        return self

    def save(self, path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        Image.fromarray(self.px, "RGBA").save(path, optimize=True)


def shade(ramp, t):
    """t in 0..1 across a surface lit from the left: 0 = lit edge, 1 = far edge."""
    i = min(len(ramp) - 2, max(0, int((1 - t) * (len(ramp) - 1))))
    return ramp[i]


def blade(cv, cx, top, bottom, half, tip, ramp=STEEL, ridge=True):
    """Straight double-edged blade from row top (tip) to bottom, half-width `half`."""
    for y in range(top, bottom + 1):
        k = (y - top) / max(1, tip)
        hw = half * min(1.0, k) if tip else half
        if hw < 0.5:
            cv.set(cx, y, ramp[3])
            continue
        x0, x1 = cx - hw, cx + hw
        for x in range(int(math.floor(x0 + 0.5)), int(math.floor(x1 + 0.5)) + 1):
            t = (x - x0) / max(1e-6, x1 - x0)
            c = ramp[3] if t < 0.3 else ramp[2] if t < 0.55 else ramp[1]
            if ridge and abs(x - cx) < 0.5 and y > top + tip:
                c = ramp[4]
            if t > 0.88:
                c = ramp[0]
            cv.set(x, y, c)
    # glint near the tip
    cv.set(cx - 1, top + tip + 2, ramp[4])


def bar(cv, x0, x1, y, h, ramp=GOLD):
    """Horizontal guard: lit top row, dark bottom row, rounded ends."""
    for yy in range(h):
        c = ramp[3] if yy == 0 else ramp[1] if yy == h - 1 else ramp[2]
        for x in range(x0, x1 + 1):
            if (x in (x0, x1)) and yy in (0, h - 1) and h > 2:
                continue
            cv.set(x, y + yy, c)
    cv.set(x0 + 1, y, ramp[4])


def grip(cv, cx, top, bottom, half=1, ramp=LEATHER):
    """Wrapped grip: diagonal wraps every two rows."""
    for y in range(top, bottom + 1):
        for x in range(cx - half, cx + half + 1):
            band = ((y - top) + (x - cx)) % 3 == 0
            c = ramp[1] if band else (ramp[3] if x < cx else ramp[2])
            cv.set(x, y, c)


def disc(cv, cx, cy, r, ramp=GOLD):
    for y in range(int(cy - r - 1), int(cy + r + 2)):
        for x in range(int(cx - r - 1), int(cx + r + 2)):
            d = math.hypot(x - cx, y - cy)
            if d <= r + 0.3:
                lx, ly = x - cx, y - cy
                lit = -(lx + ly) / (r * 1.5 + 1e-6)
                c = ramp[3] if lit > 0.35 else ramp[2] if lit > -0.25 else ramp[1]
                cv.set(x, y, c)
    cv.set(cx - r * 0.4, cy - r * 0.4, ramp[-1])


def shaft(cv, cx, top, bottom, width=2, ramp=WOOD):
    for y in range(top, bottom + 1):
        for i in range(width):
            c = ramp[3] if i == 0 else ramp[1] if i == width - 1 else ramp[2]
            cv.set(cx - width // 2 + i, y, c)
        if (y - top) % 11 == 5:
            cv.set(cx - width // 2, y, ramp[4])


def sword_1h():
    cv = Canvas(13, 40)
    blade(cv, 6, 1, 26, 2.2, 5)
    bar(cv, 1, 11, 27, 3)
    grip(cv, 6, 30, 35)
    disc(cv, 6, 37, 1.6)
    return cv.outline()


def sword_2h():
    cv = Canvas(17, 56)
    blade(cv, 8, 1, 38, 3.4, 7)
    # fuller: a darker groove down the middle of the blade
    for y in range(10, 36):
        cv.set(8, y, STEEL[1])
        cv.set(7, y, STEEL[4] if y % 6 == 0 else STEEL[3])
    bar(cv, 1, 15, 39, 3)
    cv.set(1, 38, GOLD[2]); cv.set(15, 38, GOLD[1])
    grip(cv, 8, 42, 51)
    disc(cv, 8, 53, 1.8)
    return cv.outline()


def axe():
    cv = Canvas(22, 40)
    shaft(cv, 13, 2, 37, 3)
    # crescent head on the left of the haft
    cx, cy = 13, 11
    for y in range(1, 22):
        for x in range(1, 13):
            d1 = math.hypot((x - cx) * 0.95, y - cy)
            d2 = math.hypot((x - cx - 5) * 0.95, y - cy)
            if d1 <= 11 and d2 >= 8.5 and abs(y - cy) <= 10:
                edge = 11 - d1
                c = STEEL[4] if edge < 1.2 else STEEL[3] if edge < 2.5 else STEEL[2] if y < cy else STEEL[1]
                cv.set(x, y, c)
    for y in range(6, 17):
        cv.set(12, y, GOLD[2] if y % 2 else GOLD[1])
    # back spike
    for i, y in enumerate(range(9, 14)):
        for x in range(16, 19 - abs(y - 11)):
            cv.set(x, y, STEEL[2] if y <= 11 else STEEL[1])
    grip(cv, 13, 29, 36)
    return cv.outline()


def mace():
    cv = Canvas(18, 38)
    shaft(cv, 9, 12, 35, 2)
    # square hammer head with a gold band
    for y in range(2, 13):
        for x in range(2, 16):
            t = (x - 2) / 13
            c = STEEL[3] if y == 2 else STEEL[0] if y == 12 else shade(STEEL, t)
            if x in (2,):
                c = STEEL[3]
            cv.set(x, y, c)
    for y in range(2, 13):
        cv.set(8, y, GOLD[3])
        cv.set(9, y, GOLD[2])
        cv.set(10, y, GOLD[1])
    for x in range(3, 15, 4):
        cv.set(x, 4, STEEL[4])
    cv.set(1, 6, STEEL[1]); cv.set(1, 7, STEEL[1]); cv.set(16, 6, STEEL[1]); cv.set(16, 7, STEEL[1])
    grip(cv, 9, 28, 35)
    disc(cv, 9, 1, 1.2)
    return cv.outline()


def leaf_head(cv, cx, top, length, half):
    for y in range(top, top + length):
        k = (y - top) / length
        hw = half * math.sin(math.pi * min(1, k * 1.1)) ** 0.8
        for x in range(int(cx - hw - 0.5), int(cx + hw + 0.5) + 1):
            t = (x - (cx - hw)) / max(1e-6, 2 * hw)
            c = STEEL[3] if t < 0.4 else STEEL[2] if t < 0.7 else STEEL[1]
            if abs(x - cx) < 0.5 and k > 0.2:
                c = STEEL[4] if k < 0.7 else STEEL[2]
            cv.set(x, y, c)


def spear_1h():
    cv = Canvas(11, 58)
    shaft(cv, 5, 14, 56, 2)
    leaf_head(cv, 5, 1, 13, 3.0)
    # red tassel under the head
    for i, (x, y0) in enumerate(((3, 15), (4, 15), (6, 15), (7, 15))):
        for y in range(y0, y0 + 6 - i % 2):
            cv.set(x, y, RED[2] if (y + i) % 3 else RED[1])
    for x in range(3, 8):
        cv.set(x, 14, GOLD[2])
    grip(cv, 5, 40, 47, 1)
    return cv.outline()


def spear_2h():
    cv = Canvas(19, 72)
    shaft(cv, 9, 12, 70, 3)
    leaf_head(cv, 9, 1, 13, 2.4)
    # axe blade on the left, spike on the right
    for y in range(13, 26):
        for x in range(1, 9):
            d = math.hypot((x - 9) * 1.1, (y - 19) * 0.9)
            if d <= 8 and x <= 8 and abs(y - 19) <= 6 + (x - 1) * 0.15:
                edge = 8 - d
                c = STEEL[4] if edge < 1 else STEEL[3] if edge < 2.2 else STEEL[2] if y < 19 else STEEL[1]
                cv.set(x, y, c)
    for i, y in enumerate(range(16, 22)):
        for x in range(11, 17 - abs(y - 18)):
            cv.set(x, y, STEEL[2] if y <= 18 else STEEL[1])
    for x in range(6, 13):
        cv.set(x, 12, GOLD[3])
        cv.set(x, 26, GOLD[2])
    grip(cv, 9, 46, 54, 1)
    return cv.outline()


def dagger():
    cv = Canvas(9, 24)
    blade(cv, 4, 1, 13, 1.6, 4, ridge=False)
    for y in range(6, 13):
        cv.set(4, y, STEEL[4] if y % 3 == 0 else STEEL[2])
    bar(cv, 0, 8, 14, 2)
    grip(cv, 4, 16, 20, 1)
    disc(cv, 4, 22, 1.2)
    return cv.outline()


def bow():
    """Recurve bow standing upright: limbs bow out to the left, string straight on the right."""
    cv = Canvas(16, 52)
    top, bottom = 2, 49
    mid = (top + bottom) / 2
    tip_x = 12
    limb = []
    for y in range(top, bottom + 1):
        k = (y - mid) / (mid - top)
        x = tip_x - 9 * (1 - k * k) ** 0.85
        if abs(k) > 0.86:  # recurved tips flick back toward the string side
            x -= (abs(k) - 0.86) * 18
        limb.append((x, y, abs(k)))
    for x, y, ak in limb:
        width = 3 if ak < 0.7 else 2
        for i in range(width):
            c = WOOD[3] if i == 0 else WOOD[2] if i == 1 else WOOD[1]
            cv.set(x + i, y, c)
        if ak < 0.1:  # leather grip
            for i in range(3):
                cv.set(x + i, y, LEATHER[3] if i == 0 else LEATHER[2])
        if 0.4 < ak < 0.45:
            cv.set(x, y, GOLD[3]); cv.set(x + 1, y, GOLD[2])
    # string from tip to tip
    x0 = limb[0][0] + 1
    for y in range(top + 1, bottom):
        cv.set(tip_x + 1, y, WHITE[2] if y % 5 else WHITE[3])
    for x, y in ((limb[0][0] + 1, top), (limb[-1][0] + 1, bottom)):
        cv.set(x, y, GOLD[3])
    return cv.outline()


def arrow():
    cv = Canvas(36, 9)
    for x in range(5, 30):
        cv.set(x, 4, WOOD[3] if x % 7 else WOOD[4])
        cv.set(x, 5, WOOD[1])
    for i, x in enumerate(range(29, 35)):
        h = (34 - x) * 0.6
        for y in range(int(4.5 - h), int(4.5 + h) + 1):
            cv.set(x, y, STEEL[3] if y <= 4 else STEEL[1])
    cv.set(34, 4, STEEL[4])
    for i, x in enumerate(range(1, 8)):
        cv.set(x, 2 + (i % 2), WHITE[2]); cv.set(x, 1 + (i % 2), WHITE[3])
        cv.set(x, 6 - (i % 2), WHITE[1]); cv.set(x, 7 - (i % 2), WHITE[2])
    return cv.outline()


def coat():
    """White coat icon: shoulders run into bell sleeves, gold trim, red clasp (dyeable)."""
    cv = Canvas(32, 32)
    for y in range(4, 30):
        k = (y - 4) / 26
        hw = 6 + 4 * k
        for x in range(int(16 - hw), int(16 + hw) + 1):
            t = (x - (16 - hw)) / (2 * hw)
            c = WHITE[3] if t < 0.35 else WHITE[2] if t < 0.75 else WHITE[1]
            cv.set(x, y, c)
    # sleeves: from the shoulders down and out into bells
    for side in (-1, 1):
        for y in range(5, 24):
            k = (y - 5) / 19
            xc = 16 + side * (8 + 5 * k)
            hw = 2.2 + 2.6 * k ** 1.5
            for x in range(int(xc - hw), int(xc + hw) + 1):
                t = (x - (xc - hw)) / (2 * hw)
                c = WHITE[3] if (t < 0.5) == (side < 0) else WHITE[1]
                cv.set(x, y, c)
            if y >= 22:
                for x in range(int(xc - hw), int(xc + hw) + 1):
                    cv.set(x, y, GOLD[2])
    # opening, collar, hem trim
    for y in range(6, 30):
        cv.set(16, y, GOLD[2] if y % 5 else GOLD[3])
    for x in range(10, 23):
        cv.set(x, 29, GOLD[2])
    for x in range(12, 21):
        cv.set(x, 4, GOLD[3] if x < 16 else GOLD[2])
    disc(cv, 16, 6, 1.1, RED)
    return cv.outline()


def leggings():
    """Leggings icon in neutral grey (dyeable): waistband, two tapering legs."""
    cv = Canvas(26, 32)
    for y in range(2, 5):
        for x in range(4, 22):
            cv.set(x, y, WHITE[3] if y == 2 else WHITE[2])
    for side in (-1, 1):
        for y in range(5, 30):
            k = (y - 5) / 25
            cx = 13 + side * (4.2 + 1.2 * k)
            hw = 4.6 - 1.6 * k
            for x in range(int(round(cx - hw)), int(round(cx + hw)) + 1):
                t = (x - (cx - hw)) / (2 * hw)
                c = WHITE[3] if t < 0.3 else WHITE[2] if t < 0.75 else WHITE[1]
                cv.set(x, y, c)
    for x in range(10, 17):
        cv.set(x, 5, WHITE[2])
    cv.set(13, 3, GOLD[3])
    return cv.outline()


def jelly():
    cv = Canvas(22, 22)
    for y in range(3, 20):
        for x in range(2, 20):
            dx, dy = (x - 11) / 8.5, (y - 12) / 7.5
            top = y < 9 and abs(x - 11) > (9 - y) * 1.3
            if dx * dx + dy * dy <= 1 and not top:
                lit = -(dx + dy)
                c = MINT[3] if lit > 0.6 else MINT[2] if lit > -0.2 else MINT[1]
                cv.set(x, y, c)
    for (x, y) in ((7, 9), (8, 9), (7, 10), (6, 11)):
        cv.set(x, y, MINT[4])
    return cv.outline()


def sprout():
    cv = Canvas(22, 22)
    for y in range(10, 20):
        cv.set(11, y, LEAF[2] if y % 2 else LEAF[1])
    for side in (-1, 1):
        for y in range(3, 12):
            for x in range(1, 21):
                cx, cy = 11 + side * 5.5, 8
                dx, dy = (x - cx) / 5.5, (y - cy) / 3.2
                if dx * dx + dy * dy <= 1 and (x - 11) * side > 0:
                    c = LEAF[3] if dy < 0 else LEAF[2]
                    cv.set(x, y, c)
        cv.set(11 + side * 4, 7, LEAF[3])
    for x in range(8, 15):
        cv.set(x, 20, WOOD[1])
    return cv.outline()


WEAPONS = {"sword_1h": sword_1h, "sword_2h": sword_2h, "axe": axe, "mace": mace, "spear_1h": spear_1h,
           "spear_2h": spear_2h, "dagger": dagger, "bow": bow}
ITEMS = {"arrow": arrow, "coat": coat, "legs": leggings, "jelly": jelly, "sprout": sprout}

if __name__ == "__main__":
    for name, fn in WEAPONS.items():
        fn().save(f"{OUT}/weapons/{name}.png")
    for name, fn in ITEMS.items():
        fn().save(f"{OUT}/items/{name}.png")
    print("drew", len(WEAPONS), "weapons and", len(ITEMS), "items into", OUT)

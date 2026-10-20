"""Join the sleeves to the shoulders in the front-facing idle frame.

usage: python3 tools/touchup_front.py assets/mage_idle.png

The generated front view (row 0 of the idle sheet) draws each sleeve as a flat-topped box
beside the coat, outlined all round, so the arms read as separate pieces. This slopes each
sleeve top up into the coat's shoulder, puts hair back above the slope, and turns the dark
seam between sleeve and coat into a soft crease. Run tools/animate_sprite.py afterwards so the
walk and attack sheets pick up the change.
"""
import sys
import numpy as np
from PIL import Image

OUTLINE = (0x5C, 0x30, 0x28, 255)
WHITE = (0xFD, 0xF9, 0xF2, 255)
SHADE = (0xFA, 0xE5, 0xD7, 255)
CREASE = (0xCE, 0xAA, 0xA6, 255)

path = sys.argv[1]
sheet = np.array(Image.open(path).convert("RGBA"))
f = sheet[0:128]  # front-facing row; edited in place
src = f.copy()


def is_outline(px):
    return tuple(px[:3]) == OUTLINE[:3]


def side(inner_x, slope, outer_x, step):
    """inner_x: the sleeve's edge against the coat; slope: {row: x} of the new shoulder
    contour, from the coat's shoulder (row 53) out to the sleeve's outer edge; step: -1 for
    the left arm (outer edge to the left), +1 for the right."""
    for y, x_out in slope.items():
        x = inner_x
        while x != x_out:
            f[y, x] = WHITE if abs(x - x_out) > 2 else SHADE
            x += step
        f[y, x_out] = OUTLINE
        # beyond the contour, where the flat sleeve top used to be: hair from further out
        if y >= 54:
            x = x_out + step
            while (x - outer_x) * step <= 0:
                f[y, x] = src[y, x + 4 * step]
                x += step
    # soften the dark seam between sleeve and coat down to the elbow
    for y in range(54, 66):
        for x in range(inner_x - 1, inner_x + 5) if step > 0 else range(inner_x - 1, inner_x + 2):
            if is_outline(f[y, x]):
                f[y, x] = CREASE


side(inner_x=48, slope={53: 45, 54: 44, 55: 43, 56: 42, 57: 41, 58: 40}, outer_x=40, step=-1)
side(inner_x=80, slope={53: 83, 54: 84, 55: 85, 56: 86, 57: 87, 58: 88}, outer_x=88, step=+1)
Image.fromarray(sheet, "RGBA").save(path, optimize=True)
print("touched up", path)

"""Split Oriverse character sprites into bodies and hairstyle head layers.

A body sprite (generated with short hair) loses its head in every frame; a hairstyle sprite
(generated standing, in red clothes so the hair separates by colour) gives up its head and hair
as a layer. The game draws the head layer back onto every body frame (src/look.js).

  python3 tools/char_layers.py body NAME NECK0..NECK7 SHEETS...
      SHEETS are assets/chars/NAME_<clip>.png (idle first). Tracks the head through every frame
      (offset from the idle head), erases it in place, and writes head.anchor/head.offsets into
      assets/chars/bodies.json under NAME.
  python3 tools/char_layers.py hair NAME REST.png [--drape]
      REST.png is the 8-direction rest sheet of a hairstyle sprite. Writes
      assets/chars/hair_NAME.png (column 0: hair that hangs behind the body, column 1: head and
      hair in front) and its anchor into assets/chars/hair.json. --drape keeps hair below the
      neck in front of the body in every view (braids worn over the shoulder).

Directions are rows in Oriverse order: 0 front, then clockwise seen from above (1 front-left,
2 left, 3 back-left, 4 back, 5 back-right, 6 right, 7 front-right).
"""
import colorsys
import json
import sys
import numpy as np
from PIL import Image

CELL = 96
BACK_VIEWS = {3, 4, 5}


def cells(path):
    im = np.array(Image.open(path).convert("RGBA"))
    rows, cols = im.shape[0] // CELL, im.shape[1] // CELL
    return [[im[d * CELL:(d + 1) * CELL, f * CELL:(f + 1) * CELL].copy() for f in range(cols)] for d in range(rows)]


def save_cells(grid, path):
    rows, cols = len(grid), len(grid[0])
    out = np.zeros((rows * CELL, cols * CELL, 4), np.uint8)
    for d in range(rows):
        for f in range(cols):
            out[d * CELL:(d + 1) * CELL, f * CELL:(f + 1) * CELL] = grid[d][f]
    Image.fromarray(out).save(path, optimize=True)


def hls(rgb):
    h, l, s = colorsys.rgb_to_hls(*(v / 255 for v in rgb))
    return h * 360, l, s


def head_template(cell, neck):
    """Opaque pixels above the neck line: (ys, xs, colours)."""
    a = cell[..., 3] > 0
    a[neck:] = False
    ys, xs = np.nonzero(a)
    return ys, xs, cell[ys, xs, :3].astype(int)


def track(tpl, cell, search=((-10, 10), (-12, 8))):
    """Offset (dx, dy) where the template matches the frame best."""
    ys, xs, col = tpl
    best, arg = None, (0, 0)
    for dy in range(search[1][0], search[1][1] + 1):
        for dx in range(search[0][0], search[0][1] + 1):
            y, x = ys + dy, xs + dx
            ok = (y >= 0) & (y < CELL) & (x >= 0) & (x < CELL)
            if ok.sum() < len(ys) * 0.8:
                continue
            px = cell[y[ok], x[ok]]
            diff = np.abs(px[:, :3].astype(int) - col[ok]).sum(1)
            diff[px[:, 3] == 0] = 255 * 3
            score = np.minimum(diff, 200).mean() + (len(ys) - ok.sum()) * 0.5
            # prefer small moves on ties
            score += 0.02 * (abs(dx) + abs(dy))
            if best is None or score < best:
                best, arg = score, (dx, dy)
    return arg, best


def erase_head(cell, tpl, off, tol=60):
    """Clear the pixels where the shifted head template matches (weapons and effects that pass
    over the head keep their colours), then the outline crumbs left around it."""
    ys, xs, col = tpl
    dx, dy = off
    y, x = ys + dy, xs + dx
    ok = (y >= 0) & (y < CELL) & (x >= 0) & (x < CELL)
    y, x, col = y[ok], x[ok], col[ok]
    out = cell.copy()
    near = np.abs(out[y, x, :3].astype(int) - col).sum(1) < tol * 3
    out[y[near], x[near], 3] = 0
    return out


def is_cloth(rgb):
    """The red clothes hairstyle sprites are generated in."""
    h, l, s = hls(rgb)
    return (h >= 335 or h <= 22) and s >= 0.35 and 0.12 <= l <= 0.8


def is_skin(rgb):
    h, l, s = hls(rgb)
    return 8 <= h <= 40 and s >= 0.3 and l >= 0.55


def find_neck(cell):
    """Top row of the red clothes near the middle of the body."""
    a = cell[..., 3] > 0
    xs = np.nonzero(a.any(0))[0]
    mid = int((xs.min() + xs.max()) / 2)
    for y in range(CELL):
        for x in range(mid - 6, mid + 7):
            if a[y, x] and is_cloth(cell[y, x, :3]):
                return y
    return None


def head_anchor(cell, neck):
    """Centre of the face and ears (skin above the neck); the head's middle in views without."""
    a = cell[..., 3] > 0
    xs = [x for y in range(neck) for x in range(CELL) if a[y, x] and is_skin(cell[y, x, :3])]
    if len(xs) < 4:
        xs = list(np.nonzero(a[:neck].any(0))[0])
    return [round(float(np.median(xs)), 1), neck]


def split_hair(cell, neck, front_all):
    """(back, front) layers: the head above the neck, plus hair below it reached from the head
    through hair-coloured pixels (clothes and skin stop the fill)."""
    a = cell[..., 3] > 0
    hairy = np.zeros_like(a)
    for y in range(neck, CELL):
        for x in range(CELL):
            if a[y, x] and not is_cloth(cell[y, x, :3]) and not is_skin(cell[y, x, :3]):
                hairy[y, x] = True
    below = np.zeros_like(a)
    stack = [(x, neck) for x in range(CELL) if hairy[neck, x] and a[neck - 1, x]]
    for x, y in stack:
        below[y, x] = True
    while stack:
        x, y = stack.pop()
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                nx, ny = x + dx, y + dy
                if 0 <= nx < CELL and neck <= ny < CELL and hairy[ny, nx] and not below[ny, nx]:
                    below[ny, nx] = True
                    stack.append((nx, ny))
    head = a.copy()
    head[neck:] = False
    back = np.zeros_like(cell)
    front = np.zeros_like(cell)
    front[head] = cell[head]
    (front if front_all else back)[below] = cell[below]
    return back, front


def make_hair(name, rest_path, drape=False):
    rest = cells(rest_path)
    necks = [find_neck(rest[d][0]) for d in range(8)]
    # the neck sits at the same height in every view; front views see the collar best
    seen = [necks[d] for d in (0, 1, 7, 2, 6) if necks[d]]
    neck = int(np.median(seen))
    grid, anchors = [], []
    for d in range(8):
        back, front = split_hair(rest[d][0], neck, drape or d in BACK_VIEWS)
        grid.append([back, front])
        anchors.append(head_anchor(rest[d][0], neck))
    save_cells(grid, f"assets/chars/hair_{name}.png")
    data = json.load(open("assets/chars/hair.json"))
    data["styles"][name] = {"anchor": anchors, "neck": neck}
    json.dump(data, open("assets/chars/hair.json", "w"), indent=1)
    print(name, "neck", neck, "necks", necks)


if __name__ == "__main__":
    print(__doc__)

"""Split Oriverse character sprites into bodies and hairstyle head layers.

A body sprite (generated with short hair) loses its head in every frame; a hairstyle sprite
(generated standing, in red clothes so the hair separates by colour) gives up its head and hair
as a layer. The game draws the head layer back onto every body frame (src/look.js).

  python3 tools/char_layers.py body NAME RAW_DIR NECK[,NECK1..NECK7]
      RAW_DIR holds the sheets NAME_<clip>.png as cut from Oriverse (tools/sprite_cells.py).
      The head above the neck row of the idle frame is tracked through every frame, erased,
      and the headless sheets go to public/assets/chars; head.anchor and head.offsets go into
      public/assets/chars/bodies.json under NAME.
  python3 tools/char_layers.py hair NAME REST.png [--drape]
      REST.png is the 8-direction rest sheet of a hairstyle sprite. Writes
      public/assets/chars/hair_NAME.png (column 0: hair that hangs behind the body, column 1: head and
      hair in front) and its anchor into public/assets/chars/hair.json. --drape keeps hair below the
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
    """Top row of the red clothes near the middle of the body: the first of three rows that
    each have at least 5 clothes pixels across the middle (a red hair tie or ribbon has fewer;
    the pink of the face isn't clothes)."""
    a = cell[..., 3] > 0
    xs = np.nonzero(a.any(0))[0]
    mid = int((xs.min() + xs.max()) / 2)
    band = [sum(1 for x in range(mid - 6, mid + 7) if a[y, x] and is_cloth(cell[y, x, :3]) and not is_skin(cell[y, x, :3]))
            for y in range(CELL)]
    for y in range(CELL - 2):
        if min(band[y:y + 3]) >= 5:
            return y
    return None


def head_anchor(cell, neck):
    """Where the head joins the body. Oriverse centres every character on the same pivot, so
    heads from different sprites line up by canvas column; only the neck height differs."""
    return [CELL / 2, neck]


TIE = 40        # px: a red patch this small below the neck is a hair tie, not clothes
TIE_BELOW = 8   # rows under the neck where a hair tie can start
COLLAR = 4      # rows above the neck where red is the collar seen from behind


def patches(mask):
    """8-connected patches of a mask, as lists of (x, y)."""
    seen = np.zeros_like(mask)
    out = []
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]:
            continue
        stack, patch = [(x0, y0)], []
        seen[y0, x0] = True
        while stack:
            x, y = stack.pop()
            patch.append((x, y))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < CELL and 0 <= ny < CELL and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((nx, ny))
        out.append(patch)
    return out


def split_hair(cell, neck, front_all):
    """(back, front) layers: the head above the neck, plus hair below it reached from the head
    through pixels that aren't clothes or skin, and the outline around them."""
    a = cell[..., 3] > 0
    # anything that isn't clothes, skin or outline, and the dark outline pixels touching it; the
    # clothes' own outlines are not hair and would carry the fill over the whole body
    colour = np.zeros_like(a)
    dark = np.zeros_like(a)
    for y in range(neck, CELL):
        for x in range(CELL):
            if not a[y, x] or is_cloth(cell[y, x, :3]) or is_skin(cell[y, x, :3]):
                continue
            dark[y, x] = hls(cell[y, x, :3])[1] < 0.2
            colour[y, x] = not dark[y, x]
    near = np.zeros_like(a)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            near |= np.roll(np.roll(colour, dy, 0), dx, 1)
    hairy = colour | (dark & near)
    # a hair tie: a small patch of the clothes' red apart from the clothes themselves, well below
    # the neck (bits of the collar showing between the hair are small patches too)
    red = np.zeros_like(a)
    for y in range(neck, CELL):
        for x in range(CELL):
            red[y, x] = a[y, x] and is_cloth(cell[y, x, :3]) and not is_skin(cell[y, x, :3])
    for patch in patches(red):
        if len(patch) <= TIE and min(y for _, y in patch) > neck + TIE_BELOW:
            for x, y in patch:
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
    # the collar is higher at the back: its red just above the neck row isn't head
    for y in range(max(0, neck - COLLAR), neck):
        for x in range(CELL):
            if head[y, x] and is_cloth(cell[y, x, :3]) and not is_skin(cell[y, x, :3]):
                head[y, x] = False
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
    save_cells(grid, f"public/assets/chars/hair_{name}.png")
    data = json.load(open("public/assets/chars/hair.json"))
    data["styles"][name] = {"anchor": anchors, "neck": neck}
    json.dump(data, open("public/assets/chars/hair.json", "w"), indent=1)
    print(name, "neck", neck, "necks", necks)


def erase_head_loose(cell, tpl, off, reach=2, tol=48):
    """Clear the head where it sits in this frame, allowing for a slightly turned or squashed
    head: a pixel within `reach` of the shifted template (sideways or above, never below the
    neck) goes if its colour is close to any template colour near that spot."""
    ys, xs, col = tpl
    dx, dy = off
    lut = {}
    for y, x, c in zip(ys + dy, xs + dx, col):
        lut[(int(y), int(x))] = c
    out = cell.copy()
    neck = int(ys.max()) + dy
    for (y, x), _ in list(lut.items()):
        for ny in range(y - reach, y + reach + 1):
            if ny < 0 or ny >= CELL or ny > neck:
                continue
            for nx in range(x - reach, x + reach + 1):
                if nx < 0 or nx >= CELL or out[ny, nx, 3] == 0:
                    continue
                px = out[ny, nx, :3].astype(int)
                for qy in range(ny - reach, ny + reach + 1):
                    for qx in range(nx - reach, nx + reach + 1):
                        c = lut.get((qy, qx))
                        if c is not None and np.abs(px - c).sum() < tol * 3:
                            out[ny, nx, 3] = 0
                            break
                    if out[ny, nx, 3] == 0:
                        break
    return out


def make_body(name, raw_dir, necks, clips=("idle", "walk", "swing", "thrust", "shoot", "cast")):
    """raw_dir holds the untouched sheets NAME_<clip>.png; writes headless ones to public/assets/chars."""
    idle = cells(f"{raw_dir}/{name}_idle.png")
    tpls = [head_template(idle[d][0], necks[d]) for d in range(8)]
    anchors = [head_anchor(idle[d][0], necks[d]) for d in range(8)]
    offsets = {}
    for clip in clips:
        grid = cells(f"{raw_dir}/{name}_{clip}.png")
        offsets[clip] = []
        for d in range(8):
            row = []
            for f, cell in enumerate(grid[d]):
                off = (0, 0) if clip == "idle" else track(tpls[d], cell)[0]
                grid[d][f] = erase_head_loose(cell, tpls[d], off)
                row.append(list(off))
            offsets[clip].append(row)
        save_cells(grid, f"public/assets/chars/{name}_{clip}.png")
        print(clip, "done")
    path = "public/assets/chars/bodies.json"
    bodies = json.load(open(path))
    bodies.setdefault(name, {})
    bodies[name]["hairless"] = True
    bodies[name]["head"] = {"anchor": anchors, "offsets": offsets}
    json.dump(bodies, open(path, "w"), separators=(",", ":"))


if __name__ == "__main__":
    cmd = sys.argv[1:2]
    if cmd == ["body"]:
        name, raw = sys.argv[2], sys.argv[3]
        necks = [int(v) for v in sys.argv[4].split(",")]
        make_body(name, raw, necks if len(necks) == 8 else necks * 8)
    elif cmd == ["hair"]:
        make_hair(sys.argv[2], sys.argv[3], "--drape" in sys.argv)
    else:
        print(__doc__)

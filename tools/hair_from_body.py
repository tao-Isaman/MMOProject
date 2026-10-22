"""A hairstyle cut from the head a hairless body was generated with.

usage: python3 tools/hair_from_body.py STYLE BODY RAW_IDLE.png

RAW_IDLE.png is the body's 8-direction idle sheet as cut from Oriverse, before
tools/char_layers.py erased its head (the plain bob: plainf). The neck rows are the body's own
head anchors (bodies.json), so the layer sits exactly where it came from; just above the neck
only hair, skin and the outline touching them are kept (not the shirt's collar); below it,
hair-coloured pixels (hair.json's hair region) reached from the head. Writes
public/assets/chars/hair_STYLE.png and the style in hair.json, marked `from` the body (it fits
that body with no head lift)."""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from char_layers import cells, save_cells, hls, BACK_VIEWS, CELL  # noqa: E402

STYLE, BODY, RAW = sys.argv[1], sys.argv[2], sys.argv[3]
root = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "chars") + "/"
bodies = json.load(open(root + "bodies.json"))
hair = json.load(open(root + "hair.json"))
reg = hair["regions"]["hair"]
anch = bodies[BODY]["head"]["anchor"]

def is_hair(rgb):
    h, l, s = hls(rgb)
    return reg["h"][0] <= h <= reg["h"][1] and s >= reg["s"][0] and reg["l"][0] <= l <= reg["l"][1]

rest = cells(RAW)
grid = []
for d in range(8):
    cell = rest[d][0]
    neck = int(anch[d][1])
    a = cell[..., 3] > 0
    colour = np.zeros_like(a); dark = np.zeros_like(a)
    for y in range(neck, CELL):
        for x in range(CELL):
            if not a[y, x]:
                continue
            if is_hair(cell[y, x, :3]):
                colour[y, x] = True
            elif hls(cell[y, x, :3])[1] < 0.2:
                dark[y, x] = True
    near = np.zeros_like(a)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            near |= np.roll(np.roll(colour, dy, 0), dx, 1)
    hairy = colour | (dark & near)
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
    head = a.copy(); head[neck:] = False
    # the T-shirt's collar just above the neck row is not head: keep only hair, skin and the
    # outline touching them there
    keep = np.zeros_like(a)
    for y in range(max(0, neck - 6), neck):
        for x in range(CELL):
            if a[y, x]:
                h, l, s_ = hls(cell[y, x, :3])
                keep[y, x] = is_hair(cell[y, x, :3]) or (h <= 45 and l >= 0.66) or h >= 340
    around = np.zeros_like(a)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            around |= np.roll(np.roll(keep, dy, 0), dx, 1)
    for y in range(max(0, neck - 6), neck):
        for x in range(CELL):
            if head[y, x] and not keep[y, x] and not (hls(cell[y, x, :3])[1] < 0.2 and around[y, x]):
                head[y, x] = False
    back = np.zeros_like(cell); front = np.zeros_like(cell)
    front[head] = cell[head]
    (front if d in BACK_VIEWS else back)[below] = cell[below]
    grid.append([back, front])
    print(d, "neck", neck, "head px", int(head.sum()), "below px", int(below.sum()))
save_cells(grid, root + f"hair_{STYLE}.png")
hair["styles"][STYLE] = {"anchor": [list(a_) for a_ in anch], "neck": int(np.median([a_[1] for a_ in anch])), "from": BODY}
json.dump(hair, open(root + "hair.json", "w"), indent=1)

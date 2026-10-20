"""Cut the 128x128 frame cells out of Oriverse preview_sprite sheets.

usage: python3 tools/sprite_cells.py assets/mage_idle.png south.png south-west.png ... south-east.png

With eight preview sheets (one per direction, Oriverse order: front then clockwise from above,
height_px=128), writes the idle sheet: one 128 px row per direction.

Cells are drawn on an 8 px checkerboard of (88,88,88)/(136,136,136) over a dark sheet
background; pixels showing the checkerboard become transparent, the rest are the sprite's
exact pixels (nearest-neighbour, binary alpha). Returns cells in reading order."""
import sys
import numpy as np
from PIL import Image

def cells(path, size=128):
    a = np.array(Image.open(path).convert("RGB")).astype(int)
    checker = ((a == 88).all(-1)) | ((a == 136).all(-1))
    # a cell's top-left corner: checker pixel with no checker above or to the left, and
    # long checker runs along the top row and left column (the sprite stays off the corner)
    H, W = checker.shape
    found = []
    ys, xs = np.where(checker)
    for y, x in zip(ys, xs):
        if (y > 0 and checker[y - 1, x]) or (x > 0 and checker[y, x - 1]):
            continue
        if y + size > H or x + size > W:
            continue
        if checker[y, x:x + size].mean() > 0.6 and checker[y:y + size, x].mean() > 0.6:
            found.append((y, x))
    found.sort(key=lambda p: (round(p[0] / 40), p[1]))
    out = []
    for y, x in found:
        c = a[y:y + size, x:x + size]
        chk = checker[y:y + size, x:x + size]
        alpha = np.where(chk, 0, 255)
        cell = np.dstack([c, alpha]).astype(np.uint8)
        # the preview draws its pivot cross (pure #ff50b4) over the bottom centre; replace it
        # with the pixel beside it
        for yy in range(size - 10, size):
            for xx in range(size // 2 - 4, size // 2 + 5):
                if tuple(cell[yy, xx, :3]) == (255, 80, 180):
                    cell[yy, xx] = cell[yy, xx - 1] if tuple(cell[yy, xx - 1, :3]) != (255, 80, 180) else cell[yy, xx + 1]
        out.append(cell)
    return out

if __name__ == "__main__":
    out, sheets = sys.argv[1], sys.argv[2:]
    assert len(sheets) == 8, "need one preview sheet per direction"
    rows = [cells(p)[0] for p in sheets]
    Image.fromarray(np.concatenate(rows, axis=0), "RGBA").save(out, optimize=True)
    print(out, len(rows), "directions")

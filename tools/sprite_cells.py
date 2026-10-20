"""Cut the frame cells out of Oriverse preview_sprite sheets.

usage: python3 tools/sprite_cells.py [--size 96] [--frames 8] out.png south.png south-west.png ... south-east.png

With one preview sheet per direction (1, 4 or 8; Oriverse order: front then clockwise from above,
height_px equal to the sprite's canvas), writes a sheet with one row per direction and one
column per frame: the first `frames` samples of each preview (default 1, the rest view).

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

def samples(path, size=128):
    """One cell per preview sample: with height_px equal to the canvas, the preview draws
    each sample twice (native and gameplay view) at the same size, so keep the first of each
    identical pair."""
    found = cells(path, size)
    if len(found) % 2 == 0 and all((found[i] == found[i + 1]).all() for i in range(0, len(found), 2)):
        found = found[0::2]
    return found

if __name__ == "__main__":
    args = sys.argv[1:]
    size, frames = 128, 1
    while args[0].startswith("--"):
        if args[0] == "--size":
            size = int(args[1])
        elif args[0] == "--frames":
            frames = int(args[1])
        args = args[2:]
    out, sheets = args[0], args[1:]
    assert len(sheets) in (1, 4, 8), "need one preview sheet per direction (1, 4 or 8)"
    rows = []
    for p in sheets:
        got = samples(p, size)
        assert len(got) >= frames, f"{p}: {len(got)} samples, need {frames}"
        rows.append(np.concatenate(got[:frames], axis=1))
    Image.fromarray(np.concatenate(rows, axis=0), "RGBA").save(out, optimize=True)
    print(out, len(rows), "directions x", frames, "frames")

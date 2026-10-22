"""Build a monster's sheet from its Oriverse preview_sprite sheets.

usage: python3 tools/monster_atlas.py <id> <cell> south.png west.png north.png east.png

Each preview is of clips ["Walk", "Attack"] (4 frames each) in one direction, height_px equal
to the sprite's canvas (`cell`). Writes public/assets/monsters/<id>.png: one row per direction
(south, west, north, east), columns standing, walk 0-3, attack 0-3; and adds the monster to
public/assets/monsters/index.json with its cell, where its feet are (px up from the cell's
bottom: the sprite's pivot is its bottom centre) and how tall it stands (px from its feet to
the top of its standing frames)."""
import fcntl
import json
import os
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from sprite_cells import samples  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "monsters")


def main():
    mid, cell, paths = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
    assert len(paths) == 4, "one preview per direction: south west north east"
    rows = []
    for p in paths:
        s = samples(p, cell)
        # Walk: frames 0-3, before end, loop wrap, back to rest; Attack the same
        assert len(s) == 14, f"{p}: {len(s)} samples, expected 14"
        rows.append([s[6], *s[0:4], *s[7:11]])
    sheet = np.zeros((cell * 4, cell * 9, 4), np.uint8)
    for r, row in enumerate(rows):
        for c, img in enumerate(row):
            sheet[r * cell:(r + 1) * cell, c * cell:(c + 1) * cell] = img
    os.makedirs(ROOT, exist_ok=True)
    Image.fromarray(sheet).save(os.path.join(ROOT, f"{mid}.png"), optimize=True)
    # how tall it stands: the highest opaque pixel of its standing frames
    top = 0
    for row in rows:
        ys = np.where(row[0][:, :, 3] > 0)[0]
        if len(ys):
            top = max(top, cell - ys.min())
    # several of these may run at once: take turns with the index
    index_path = os.path.join(ROOT, "index.json")
    with open(os.path.join(ROOT, ".index.lock"), "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        index = json.load(open(index_path)) if os.path.exists(index_path) else {}
        index[mid] = {"cell": cell, "foot": 0, "top": int(top), "walk": 4, "attack": 4}
        with open(index_path, "w") as f:
            json.dump(dict(sorted(index.items())), f, indent=1)
            f.write("\n")
    print(mid, index[mid])


if __name__ == "__main__":
    main()

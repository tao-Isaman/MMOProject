"""Cut a sheet of skill icons (an Oriverse picture laid out as a grid of framed square icons on a
flat background) into public/assets/skills/<id>.png, 96 px each, and list them in
public/assets/skills/index.json (src/icons.ts loads every listed one).

    python3 tools/skill_icons.py <sheet.png> <cols> <rows> <id> [<id> ...]

Ids run row by row, left to right; "-" skips a cell. Each icon is found as the bounding box of the
pixels that differ from the background (sampled at the sheet's corners) inside its grid cell.
"""

import json
import os
import sys

from PIL import Image

SIZE = 96
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "skills")


def main() -> None:
    sheet, cols, rows, ids = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4:]
    im = Image.open(sheet).convert("RGB")
    w, h = im.size
    px = im.load()
    corners = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
    bg = tuple(sorted(c[i] for c in corners)[1] for i in range(3))

    def off(x: int, y: int) -> bool:
        return sum(abs(a - b) for a, b in zip(px[x, y], bg)) > 40

    os.makedirs(OUT, exist_ok=True)
    index_path = os.path.join(OUT, "index.json")
    index = json.load(open(index_path)) if os.path.exists(index_path) else []
    for n, sid in enumerate(ids):
        if sid == "-":
            continue
        c, r = n % cols, n // cols
        x0, x1 = c * w // cols, (c + 1) * w // cols
        y0, y1 = r * h // rows, (r + 1) * h // rows
        xs = [x for x in range(x0, x1) if sum(off(x, y) for y in range(y0, y1, 2)) > (y1 - y0) // 8]
        ys = [y for y in range(y0, y1) if sum(off(x, y) for x in range(x0, x1, 2)) > (x1 - x0) // 8]
        if not xs or not ys:
            print(f"{sid}: no icon found in cell {c},{r}")
            continue
        box = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
        side = max(box[2] - box[0], box[3] - box[1])
        cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
        square = (round(cx - side / 2), round(cy - side / 2), round(cx + side / 2), round(cy + side / 2))
        im.crop(square).resize((SIZE, SIZE), Image.LANCZOS).save(os.path.join(OUT, f"{sid}.png"))
        if sid not in index:
            index.append(sid)
        print(f"{sid}: cell {c},{r} box {box} -> {SIZE}px")
    json.dump(sorted(index), open(index_path, "w"), indent=1)


if __name__ == "__main__":
    main()

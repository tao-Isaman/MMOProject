"""Find the hands in every attack and cast frame, for drawing weapons into them.

usage: python3 tools/hand_anchors.py assets/hand_anchors.json assets/mage_swing.png assets/mage_thrust.png ...

Each sheet has one row per direction and one square cell per frame (tools/sprite_cells.py);
its clip name is the file name after "mage_". Hands are the skin-coloured blobs other than the
face. In each frame the hand farthest from the body centre is the one holding the weapon ("r"),
the other one ("l") takes the second dagger. Frames where a hand is hidden behind the body
borrow it from the nearest frame where it shows. Writes, per clip, direction and frame:
{"r": [x, y], "l": [x, y] or null, "c": [x, y]} in cell pixels.
"""
import colorsys
import json
import sys
import numpy as np
from PIL import Image


def skin_mask(cell):
    h, w = cell.shape[:2]
    m = np.zeros((h, w), bool)
    for y in range(h):
        for x in range(w):
            r, g, b, a = [int(v) for v in cell[y, x]]
            if a == 0:
                continue
            hh, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            hh *= 360
            if (hh <= 32 or hh >= 345) and s >= 0.45 and 0.6 <= l <= 0.92:
                m[y, x] = True
    return m


def components(mask):
    h, w = mask.shape
    seen = np.zeros_like(mask)
    out = []
    for y in range(h):
        for x in range(w):
            if not mask[y, x] or seen[y, x]:
                continue
            stack, pts = [(x, y)], []
            seen[y, x] = True
            while stack:
                cx, cy = stack.pop()
                pts.append((cx, cy))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and mask[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True
                            stack.append((nx, ny))
            out.append(np.array(pts))
    return out


def frame_hands(cell):
    a = cell[..., 3] > 0
    ys, xs = np.where(a)
    c = [float(xs.mean()), float(ys.mean())]
    top = ys.min()
    height = ys.max() - top
    comps = [p for p in components(skin_mask(cell)) if len(p) >= 3]
    # the face: the biggest skin patch in the upper part of the figure
    head = [p for p in comps if p[:, 1].mean() < top + 0.45 * height]
    face = max(head, key=len) if head else None
    # hands sit below the eyes (skin-coloured hair ties and ears do not count)
    hands = [p for p in comps if p is not face and p[:, 1].mean() > top + 0.3 * height]
    pts = sorted(([float(p[:, 0].mean()), float(p[:, 1].mean())] for p in hands),
                 key=lambda q: -np.hypot(q[0] - c[0], q[1] - c[1]))
    return {"r": pts[0] if pts else None, "l": pts[1] if len(pts) > 1 else None, "c": c}


def fill_gaps(frames, key):
    known = [i for i, f in enumerate(frames) if f[key]]
    for i, f in enumerate(frames):
        if f[key] or not known:
            continue
        j = min(known, key=lambda k: abs(k - i))
        f[key] = frames[j][key]


def main():
    out_path, sheets = sys.argv[1], sys.argv[2:]
    result = {}
    for path in sheets:
        clip = path.rsplit("/", 1)[-1].removeprefix("mage_").removesuffix(".png")
        img = np.array(Image.open(path).convert("RGBA"))
        size = img.shape[0] // 8
        rows = []
        for d in range(8):
            frames = [frame_hands(img[d * size:(d + 1) * size, f * size:(f + 1) * size])
                      for f in range(img.shape[1] // size)]
            fill_gaps(frames, "r")
            for f in frames:
                for k in ("r", "l", "c"):
                    if f[k]:
                        f[k] = [round(v, 1) for v in f[k]]
            rows.append(frames)
        result[clip] = rows
        found = sum(1 for row in rows for f in row if f["r"])
        print(f"{clip}: hand found in {found}/{sum(len(r) for r in rows)} frames")
    with open(out_path, "w") as fh:
        json.dump(result, fh, separators=(",", ":"))


if __name__ == "__main__":
    main()

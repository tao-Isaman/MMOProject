"""Find where the eyes are in every frame of a body that draws its own hair (the male bodies),
so the eye colour can be changed there (src/look.ts, eyesOf).

    python3 tools/eye_track.py plainm warrior

The eyes are boxes picked by hand on the standing frame of each direction (BOXES below; the
back views have none). For every frame of every clip the patch around them in the standing
frame is matched against the frame, within SEARCH px of where the head has moved to (the
body's head offsets); a close match (under CLOSE) moves the eyes there, otherwise they move
with the head (a face drawn differently, as in a squint down an arrow, matches nowhere). Writes
bodies.json[body]["eyes"] = {"natural", "iris", "boxes", "offsets": {clip: [direction][frame] -> [dx, dy]}}.
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "public" / "assets" / "chars"
CELL = 96
SEARCH = 2  # px each way around the head's offset
PAD = 2     # px of face around the boxes that is matched too
CLOSE = 8000  # summed colour difference of a match that is the same face

# [x0, y0, x1, y1] inclusive, in the standing frame's cell, per direction (S, SW, W, NW, N, NE, E, SE)
BOXES = {
    "plainm": [
        [[41, 28, 44, 31], [51, 28, 54, 31]],
        [[38, 28, 39, 31], [46, 28, 48, 31]],
        [[38, 27, 39, 30]],
        [], [], [],
        [[55, 27, 55, 30]],
        [[47, 28, 50, 31], [56, 28, 57, 31]],
    ],
    "warrior": [
        [[42, 29, 44, 31], [53, 29, 55, 31]],
        [[39, 28, 40, 30], [47, 28, 49, 31]],
        [[41, 27, 43, 30]],
        [], [], [],
        [[53, 27, 54, 30]],
        [[47, 28, 49, 31], [57, 28, 58, 30]],
    ],
    "swordsman_m": [
        [[41, 28, 44, 29], [50, 28, 54, 29]],
        [[38, 28, 39, 29], [45, 28, 48, 29]],
        [[39, 26, 40, 29]],
        [], [], [],
        [[54, 27, 56, 29]],
        [[48, 28, 51, 29], [56, 28, 57, 29]],
    ],
}
NATURAL = {"plainm": "amber", "warrior": "amber", "swordsman_m": "blue"}  # the EYE_COLORS id they are drawn in
IRIS = {  # the colour of that iris
    "amber": {"h": [18, 45], "s": [0.6, 1], "l": [0.28, 0.66]},
    "blue": {"h": [195, 240], "s": [0.35, 1], "l": [0.15, 0.8]},
}


def patch(boxes):
    pts = set()
    for x0, y0, x1, y1 in boxes:
        for y in range(y0 - PAD, y1 + PAD + 1):
            for x in range(x0 - PAD, x1 + PAD + 1):
                pts.add((x, y))
    return sorted(pts)


def cost(px, ref, ox, oy, sx, sy):
    total = 0
    for (x, y), r in ref:
        p = px[ox + x + sx, oy + y + sy]
        if (p[3] > 0) != (r[3] > 0):
            total += 3 * 255
        elif r[3] > 0:
            total += abs(p[0] - r[0]) + abs(p[1] - r[1]) + abs(p[2] - r[2])
    return total


def track(body, boxes, heads):
    idle = Image.open(ROOT / f"{body}_idle.png").convert("RGBA").load()
    offsets = {}
    for clip in ("idle", "walk", "swing", "thrust", "shoot", "cast"):
        path = ROOT / f"{body}_{clip}.png"
        if not path.exists():
            continue
        im = Image.open(path).convert("RGBA")
        px = im.load()
        per_dir = []
        for d in range(8):
            frames = []
            pts = patch(boxes[d])
            ref = [((x, y), idle[x, d * CELL + y]) for x, y in pts]
            head = heads.get(clip, [[]] * 8)[d]
            for f in range(im.width // CELL):
                if not pts:
                    frames.append([0, 0])
                    continue
                hx, hy = head[f] if f < len(head) else (0, 0)
                best = None
                for sy in range(hy - SEARCH, hy + SEARCH + 1):
                    for sx in range(hx - SEARCH, hx + SEARCH + 1):
                        c = cost(px, ref, f * CELL, d * CELL, sx, sy) + 40 * (abs(sx - hx) + abs(sy - hy))
                        if best is None or c < best[0]:
                            best = (c, sx, sy)
                frames.append([best[1], best[2]] if best[0] < CLOSE else [hx, hy])
            per_dir.append(frames)
        offsets[clip] = per_dir
    return offsets


def main():
    path = ROOT / "bodies.json"
    bodies = json.loads(path.read_text())
    for body in sys.argv[1:] or BOXES:
        natural = NATURAL[body]
        offsets = track(body, BOXES[body], bodies[body]["head"]["offsets"])
        bodies[body]["eyes"] = {"natural": natural, "iris": IRIS[natural], "boxes": BOXES[body], "offsets": offsets}
        print(body, "done")
    path.write_text(json.dumps(bodies, separators=(",", ":")))


if __name__ == "__main__":
    main()

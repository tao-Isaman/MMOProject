"""Find the hands in every attack and cast frame, for drawing weapons into them.

usage: python3 tools/hand_anchors.py BODY public/assets/chars/BODY_thrust.png public/assets/chars/BODY_cast.png ...

Each sheet has one row per direction and one square cell per frame (tools/sprite_cells.py);
its clip name is the file name after "BODY_". Hands are the skin-coloured blobs other than the
face and the feet (a bare arm's hand is the end of it). In each frame the hand farthest from the body centre is the one holding the weapon ("r"),
the other one ("l") takes the second dagger. Frames where a hand is hidden behind the body
borrow it from the nearest frame where it shows; a direction where it never shows (a back view)
takes the mirror image of the opposite side's (NW from NE, and so on). A body in gloves (GLOVES)
has its hands in their colour as well, less the belt it shares it with; one whose fist shows no
skin in some directions (REACH) thrusts with the point of the figure farthest out in front.
Writes into public/assets/chars/bodies.json under BODY.hands, per clip, direction and frame:
{"r": [x, y], "l": [x, y] or null, "c": [x, y]} in cell pixels.
"""
import colorsys
import json
import sys
import numpy as np
from PIL import Image


FEET = 20  # px above the soles where nothing is a hand
ARM = 40   # a skin patch bigger than this is a bare arm with the hand at its end
FIST = 3.5 # px around the end of an arm that make the hand
NECK = 8   # a headless body's neck: a patch this close to the top middle
FACE = 13  # px either side of the neck that the face takes up
CHIN = 3   # px below the neck that a face may still reach (a mouth drawn at the chin)
OTHER = 12 # px at least between the two hands
BELT = (4, 14)  # px above and below the waist, and either side of the middle, where the gloves' colour is the belt
# bodies whose weapon fist shows no skin in some directions (the knight's right gauntlet is steel
# like the rest of his armour, the ranger's gloves are leather like his bracers), so that no
# colour finds it there: in a thrust in those directions the weapon hand is taken as the farthest
# point out in front, at arm height
REACH = {"knight_m": (5, 6, 7), "ranger_m": (3, 5)}
SIDE = [0, -1, -1, -1, 0, 1, 1, 1]  # which way (on screen) a direction faces: -1 left, 1 right
ARMS = 3  # px below the neck where an arm thrust out at shoulder height starts
GLOVES = {  # bodies whose hands are gloved, and the gloves' colour: h either side of 0, s, l
    "knight_f": {"h": [335, 12], "s": [0.2, 0.6], "l": [0.12, 0.32]},
}


def skin_mask(cell, gloves=None):
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
            elif gloves and (hh >= gloves["h"][0] or hh <= gloves["h"][1]) \
                    and gloves["s"][0] <= s <= gloves["s"][1] and gloves["l"][0] <= l <= gloves["l"][1]:
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


def fist(p, c):
    """A hand patch's centre; on a bare arm (a big patch) the end of it farthest from the body."""
    if len(p) <= ARM:
        return [float(p[:, 0].mean()), float(p[:, 1].mean())]
    d = np.hypot(p[:, 0] - c[0], p[:, 1] - c[1])
    far = p[np.argmax(d)]
    end = p[np.hypot(p[:, 0] - far[0], p[:, 1] - far[1]) <= FIST]
    return [float(end[:, 0].mean()), float(end[:, 1].mean())]


def frame_hands(cell, headless=False, face_box=None, gloves=None, waist=None):
    """face_box: (x, y) of the neck in this frame, for a body that draws its own head: skin
    above it (and CHIN px below) and within FACE px either side is the face. gloves: the colour
    of the body's gloves, which its belt at row `waist` shares."""
    a = cell[..., 3] > 0
    ys, xs = np.where(a)
    c = [float(xs.mean()), float(ys.mean())]
    top = ys.min()
    height = ys.max() - top
    # skin patches on the figure itself (not on a loose spark or slash beside it)
    figure = max(components(a), key=len)
    on = np.zeros(a.shape, bool)
    on[figure[:, 1], figure[:, 0]] = True
    skin = skin_mask(cell, gloves)
    if gloves and waist:
        skin[waist - BELT[0]:waist + BELT[0] + 1, max(0, int(c[0] - BELT[1])):int(c[0] + BELT[1]) + 1] = False
    if face_box:  # cut the face away first, so an arm raised beside it stays an arm
        nx, ny = face_box
        skin[:max(0, int(ny) + CHIN), max(0, int(nx - FACE)):int(nx + FACE) + 1] = False
    comps = [p for p in components(skin) if len(p) >= 3 and on[p[:, 1], p[:, 0]].any()]
    # without a known neck the face is the biggest skin patch in the upper part of the figure (a
    # body drawn without its head has none: a patch up there is a raised arm)
    head = [p for p in comps if p[:, 1].mean() < top + 0.45 * height]
    face = max(head, key=len) if head and not headless and not face_box else None
    # hands sit below the eyes (skin-coloured hair ties and ears do not count) and above the
    # feet (brown shoes are skin-coloured)
    bottom = ys.max()
    low = 0 if headless or face_box else top + 0.3 * height
    hands = [p for p in comps if p is not face and low < p[:, 1].mean() < bottom - FEET]
    if headless:  # the stump of the neck
        hands = [p for p in hands if not (p[:, 1].mean() < top + NECK and abs(p[:, 0].mean() - c[0]) < NECK)]
    pts = sorted((fist(p, c) for p in hands), key=lambda q: -np.hypot(q[0] - c[0], q[1] - c[1]))
    # the other hand: the next one out that isn't more skin on the same arm (a bandaged arm
    # shows through in stripes)
    other = [q for q in pts[1:] if np.hypot(q[0] - pts[0][0], q[1] - pts[0][1]) > OTHER]
    return {"r": pts[0] if pts else None, "l": other[0] if other else None, "c": c}


def fill_gaps(frames, key):
    known = [i for i, f in enumerate(frames) if f[key]]
    for i, f in enumerate(frames):
        if f[key] or not known:
            continue
        j = min(known, key=lambda k: abs(k - i))
        f[key] = frames[j][key]


def reach(cell, side, neck_y, waist, r):
    """The farthest point of the figure out to `side` between the shoulders and the waist, when
    it reaches farther out than r (by more than FIST px): the fist of an arm thrust forward."""
    a = cell[..., 3] > 0
    figure = max(components(a), key=len)
    on = np.zeros(a.shape, bool)
    on[figure[:, 1], figure[:, 0]] = True
    band = on[int(neck_y + ARMS):int(waist) + 1]
    ys, xs = np.where(band)
    if not len(xs):
        return r
    edge = xs.max() if side > 0 else xs.min()
    if r is not None and (edge - r[0]) * side <= FIST * 2:
        return r
    near = np.abs(xs - edge) <= FIST
    return [float(xs[near].mean()), float(ys[near].mean() + int(neck_y + ARMS))]


def mirror_gaps(rows, size):
    """A direction with no hand in any frame copies the opposite side's, mirrored."""
    for d, frames in enumerate(rows):
        if any(f["r"] for f in frames):
            continue
        src = rows[(8 - d) % 8]
        for f, g in zip(frames, src):
            for k in ("r", "l"):
                if g[k] and not f[k]:
                    f[k] = [size - g[k][0], g[k][1]]


def main():
    body, sheets = sys.argv[1], sys.argv[2:]
    store = "public/assets/chars/bodies.json"
    with open(store) as fh:
        bodies = json.load(fh)
    headless = bodies.get(body, {}).get("hairless", False)
    # a body with its own head and a known neck (split row, head anchor and per-frame offsets)
    own = bodies.get(body, {})
    neck = None if headless or "split" not in own or "head" not in own else (own["head"]["anchor"], own["head"]["offsets"])
    gloves = GLOVES.get(body)
    waist = own.get("waist")
    result = {}
    for path in sheets:
        clip = path.rsplit("/", 1)[-1].removeprefix(f"{body}_").removesuffix(".png")
        img = np.array(Image.open(path).convert("RGBA"))
        size = img.shape[0] // 8
        rows = []
        for d in range(8):
            frames = []
            for f in range(img.shape[1] // size):
                box = None
                if neck:
                    off = (neck[1].get(clip) or [[]] * 8)[d]
                    dx, dy = off[f] if f < len(off) else (0, 0)
                    box = (neck[0][d][0] + dx, own["split"] + dy)
                cell = img[d * size:(d + 1) * size, f * size:(f + 1) * size]
                h = frame_hands(cell, headless, box, gloves, waist)
                if d in REACH.get(body, ()) and clip == "thrust" and SIDE[d] and box:
                    h["r"] = reach(cell, SIDE[d], box[1], waist, h["r"])
                frames.append(h)
            fill_gaps(frames, "r")
            rows.append(frames)
        found = sum(1 for row in rows for f in row if f["r"])
        mirror_gaps(rows, size)
        for frames in rows:
            for f in frames:
                for k in ("r", "l", "c"):
                    if f[k]:
                        f[k] = [round(v, 1) for v in f[k]]
        result[clip] = rows
        print(f"{clip}: hand found in {found}/{sum(len(r) for r in rows)} frames")
    bodies.setdefault(body, {})["hands"] = result
    with open(store, "w") as fh:
        json.dump(bodies, fh, separators=(",", ":"))


if __name__ == "__main__":
    main()

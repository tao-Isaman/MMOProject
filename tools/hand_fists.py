"""Put the hands found by tools/hand_anchors.py on the fists, in every attack and cast frame.

usage: python3 tools/hand_fists.py [BODY ...]   (every body with hands in bodies.json by default)

hand_anchors.py took each hand as the end of its skin patch farthest from the body's middle. On
an arm hanging beside the body that is the elbow or the shoulder, so weapons floated off the
arm; a hand could also land on the face, the stump of the neck or a skin-coloured spark. Here
the face (or the neck's stump) goes first, around the body's neck in that frame, skin split by
an outline is joined into whole arms, and a hand is the end of its arm farthest from the
shoulders: the fist, wherever the arm points.

"r" stays on the arm hand_anchors.py chose, moved to its fist (the farthest reaching arm when
that was the face, the neck or a spark). "l" is the fist of the farthest reaching other arm. Frames where the off hand is hidden behind the body borrow it (kept at the
same place against the neck) from the nearest frame where it shows and are marked "lh": its
gear is drawn behind the body. A direction where it never shows keeps null.
"""
import json
import sys
import numpy as np
from PIL import Image
from hand_anchors import components

FEET = 20     # px above the soles where nothing is a hand
FACE = 13     # px either side of the neck that the face (or its stump) takes up
BELOW = 4     # px under the neck that are still neck
FIST = 3.5    # px around the end of an arm that make the hand
NEAR = 6      # px from the old weapon hand that are still its arm
OTHER = 12    # px at least between the two hands
SHOULDER = 8  # px below the neck to the shoulders
NECK = 5      # px around the neck that its stump reaches
RAISED = 10   # skin px at least in a fist up beside the head


def skin_mask(cell):
    """Skin-coloured pixels: hand_anchors.py's test, but saturated enough that a beige shirt
    (the plain male body's) is not skin."""
    rgb = cell[..., :3].astype(float) / 255
    hi, lo = rgb.max(axis=2), rgb.min(axis=2)
    l = (hi + lo) / 2
    d = hi - lo
    with np.errstate(divide="ignore", invalid="ignore"):
        s = np.where(l > 0.5, d / (2 - hi - lo), d / (hi + lo))
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        h = np.where(hi == r, (g - b) / d % 6, np.where(hi == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    h = np.nan_to_num(h)
    return (cell[..., 3] > 0) & ((h <= 32) | (h >= 345)) & (s >= 0.58) & (l >= 0.6) & (l <= 0.92) & (d > 0)


def arms(cell, neck, face, guessed):
    """Skin on the figure joined across one-pixel outlines into arms, as (pixels, high) with
    high: up beside the head, where an off hand hardly ever is but ears and hair ties are. The
    face goes first: face is True for a body that draws its own head (its biggest skin patch
    above the neck), False for a headless one (only the stump of the neck, which a raised fist
    over it must not take with it). guessed: the neck is a fixed guess, not this frame's."""
    a = cell[..., 3] > 0
    figure = max(components(a), key=len)
    on = np.zeros(a.shape, bool)
    on[figure[:, 1], figure[:, 0]] = True
    top, bottom = figure[:, 1].min(), figure[:, 1].max()
    skin = skin_mask(cell) & on
    skin[int(bottom - FEET):] = False
    nx, ny = neck
    if face:
        # seen from behind there is no face, so only a patch up by the neck can be one (with no
        # neck on record, the biggest patch in the upper part of the figure, as hand_anchors.py)
        def up_top(p):
            if guessed:
                return p[:, 1].mean() < top + 0.45 * (bottom - top)
            return p[:, 1].mean() < ny and abs(p[:, 0].mean() - nx) < FACE + 6
        head = [p for p in components(skin) if up_top(p)]
        if head:
            p = max(head, key=len)
            skin[p[:, 1], p[:, 0]] = False
    grown = skin.copy()
    grown[1:] |= skin[:-1]
    grown[:-1] |= skin[1:]
    grown[:, 1:] |= skin[:, :-1]
    grown[:, :-1] |= skin[:, 1:]
    out = []
    for g in components(grown):
        p = g[skin[g[:, 1], g[:, 0]]]
        if len(p) < 3:
            continue
        if not face and p[:, 1].mean() < ny + BELOW + 2 and np.hypot(p[:, 0] - nx, p[:, 1] - ny).min() <= NECK:
            continue
        high = p[:, 1].mean() < ny + BELOW and abs(p[:, 0].mean() - nx) < FACE + 4
        out.append((p, high))
    return out


def fist(p, shoulder):
    d = np.hypot(p[:, 0] - shoulder[0], p[:, 1] - shoulder[1])
    far = p[np.argmax(d)]
    end = p[np.hypot(p[:, 0] - far[0], p[:, 1] - far[1]) <= FIST]
    return [float(end[:, 0].mean()), float(end[:, 1].mean())], float(d.max())


def frame(cell, r, neck, face, guessed):
    shoulder = (neck[0], neck[1] + SHOULDER)
    found = [(p, *fist(p, shoulder), high) for p, high in arms(cell, neck, face, guessed)]
    low = [t for t in found if not t[3]]
    if r is not None:
        # a fist raised beside the head counts, bits of a face cut up by the hair do not
        near = [t for t in found if (not t[3] or len(t[0]) >= RAISED)
                and np.hypot(t[0][:, 0] - r[0], t[0][:, 1] - r[1]).min() <= NEAR]
        if near:
            r = min(near, key=lambda t: np.hypot(t[0][:, 0] - r[0], t[0][:, 1] - r[1]).min())[1]
        elif low:
            # it was on the face, the neck or a skin-coloured spark: the arm reaching farthest
            r = max(low, key=lambda t: t[2])[1]
    others = [t for t in low if r is None or np.hypot(t[1][0] - r[0], t[1][1] - r[1]) > OTHER]
    l = max(others, key=lambda t: t[2])[1] if others else None
    return r, l


def main():
    store = "public/assets/chars/bodies.json"
    with open(store) as fh:
        bodies = json.load(fh)
    names = sys.argv[1:] or [n for n, b in bodies.items() if b.get("hands")]
    for name in names:
        body = bodies[name]
        head = body.get("head")
        for clip, rows in body["hands"].items():
            img = np.array(Image.open(f"public/assets/chars/{name}_{clip}.png").convert("RGBA"))
            size = img.shape[0] // 8
            shown = 0
            for d, frames in enumerate(rows):
                necks = []
                for f, h in enumerate(frames):
                    if head:
                        off = (head["offsets"].get(clip) or [[]] * 8)[d]
                        dx, dy = off[f] if f < len(off) else (0, 0)
                        neck = (head["anchor"][d][0] + dx, head["anchor"][d][1] + dy)
                    else:
                        neck = (size / 2, body.get("neck", size * 0.36))
                    necks.append(neck)
                    r, l = frame(img[d * size:(d + 1) * size, f * size:(f + 1) * size], h["r"], neck, not body.get("hairless"), not head)
                    h["r"] = [round(v, 1) for v in r] if r else None
                    h["l"] = [round(v, 1) for v in l] if l else None
                    h.pop("lh", None)
                    shown += bool(l)
                known = [i for i, h in enumerate(frames) if h["l"] and not h.get("lh")]
                for i, h in enumerate(frames):
                    if h["l"] or not known:
                        continue
                    j = min(known, key=lambda k: abs(k - i))
                    lx, ly = frames[j]["l"]
                    h["l"] = [round(lx - necks[j][0] + necks[i][0], 1), round(ly - necks[j][1] + necks[i][1], 1)]
                    h["lh"] = 1
            total = sum(len(r) for r in rows)
            print(f"{name} {clip}: off hand shows in {shown}/{total} frames")
    with open(store, "w") as fh:
        json.dump(bodies, fh, separators=(",", ":"))


if __name__ == "__main__":
    main()

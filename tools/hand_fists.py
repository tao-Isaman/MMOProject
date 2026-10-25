"""Put the hands found by tools/hand_anchors.py on the fists, in every attack and cast frame.

usage: python3 tools/hand_fists.py [BODY ...]   (every body with hands in bodies.json by default)

hand_anchors.py took each hand as the end of its skin patch farthest from the body's middle. On
an arm hanging beside the body that is the elbow or the shoulder, so weapons floated off the
arm; a hand could also land on the face, the stump of the neck or a skin-coloured spark. Here
the face (or the neck's stump) goes first, around the body's neck in that frame, skin split by
an outline is joined into whole arms, and a hand is the end of its arm farthest from the
shoulders: the fist, wherever the arm points.

"r" stays on the arm hand_anchors.py chose, moved to its fist (the farthest reaching arm when
that was the face, the neck or a spark), past a cuff or a leather bracer that parts the skin of
the arm. "l" is the fist of the farthest reaching other arm (never the weapon arm's own skin short
of its bracer). Frames where the off hand is hidden behind the body borrow it (kept at the
same place against the neck) from the nearest frame where it shows and are marked "lh": its
gear is drawn behind the body. A direction where it never shows keeps null. A borrowed place
that is off the figure in this frame (she lunged or turned) comes in toward her middle.
"""
import json
import sys
import numpy as np
from PIL import Image
from hand_anchors import BELT, CHIN, GLOVES, REACH, SIDE, components

FEET = 20     # px above the soles where nothing is a hand
FACE = 13     # px either side of the neck that the face (or its stump) takes up
BELOW = 4     # px under the neck that are still neck
FIST = 3.5    # px around the end of an arm that make the hand
NEAR = 6      # px from the old weapon hand that are still its arm
OTHER = 12    # px at least between the two hands
SHOULDER = 8  # px below the neck to the shoulders
NECK = 5      # px around the neck that its stump reaches
RAISED = 10   # skin px at least in a fist up beside the head
GAP = 16      # px a cuff or a wrapping may part the skin of one arm by
BEND = -0.6   # cosine of the sharpest turn from the shoulders an arm takes at the elbow
INWARD = 6    # px an arm followed past its wrapping may come in toward the middle
# frames whose weapon fist holds a slash drawn into the source sprite, the slash crossing the face
# so that a piece of the face passes for a raised fist: (clip, direction, frame) -> the frame of
# the same direction whose weapon hand (moved with the neck) is taken instead
SLASHED = {"wizard_m": {("thrust", 0, 1): 2}}


def skin_mask(cell, gloves=None, waist=None):
    """Skin-coloured pixels: hand_anchors.py's test, but saturated enough that a beige shirt
    (the plain male body's) is not skin. With gloves (hand_anchors.GLOVES) their colour is
    skin too, but for the belt that shares it at row `waist`."""
    rgb = cell[..., :3].astype(float) / 255
    hi, lo = rgb.max(axis=2), rgb.min(axis=2)
    l = (hi + lo) / 2
    d = hi - lo
    with np.errstate(divide="ignore", invalid="ignore"):
        s = np.where(l > 0.5, d / (2 - hi - lo), d / (hi + lo))
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        h = np.where(hi == r, (g - b) / d % 6, np.where(hi == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    h = np.nan_to_num(h)
    m = (cell[..., 3] > 0) & ((h <= 32) | (h >= 345)) & (s >= 0.58) & (l >= 0.6) & (l <= 0.92) & (d > 0)
    if gloves:
        g = (cell[..., 3] > 0) & (d > 0) & ((h >= gloves["h"][0]) | (h <= gloves["h"][1])) \
            & (s >= gloves["s"][0]) & (s <= gloves["s"][1]) & (l >= gloves["l"][0]) & (l <= gloves["l"][1])
        if waist:
            xs = np.where(cell[..., 3] > 0)[1]
            cx = xs.mean() if len(xs) else cell.shape[1] / 2
            g[waist - BELT[0]:waist + BELT[0] + 1, max(0, int(cx - BELT[1])):int(cx + BELT[1]) + 1] = False
        m |= g
    return m


def arms(cell, neck, face, guessed, gloves=None, waist=None):
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
    skin = skin_mask(cell, gloves, waist) & on
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
        if not guessed:  # and a mouth drawn apart from it at the chin (too small to be a fist)
            for p in components(skin):
                if len(p) < RAISED and p[:, 1].mean() < ny + CHIN and abs(p[:, 0].mean() - nx) < FACE:
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


def solid(a, p, q):
    """The figure runs unbroken from p to q (an arm, not a gap beside one)."""
    n = int(np.hypot(q[0] - p[0], q[1] - p[1]) * 2) + 1
    for k in range(n + 1):
        x, y = p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n
        if not a[int(round(y)), int(round(x))]:
            return False
    return True


def wrapped(cell, p, q):
    """Between p and q lies a wrapping or a cuff (near-white or greyish cloth, a brown leather
    bracer, and their dark outline), not the shirt across the body to the other hand."""
    n = int(np.hypot(q[0] - p[0], q[1] - p[1]) * 2) + 1
    seen = wrap = 0
    for k in range(1, n):
        x, y = p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n
        r, g, b, a = [int(v) / 255 for v in cell[int(round(y)), int(round(x))]]
        if not a:
            return False
        hi, lo = max(r, g, b), min(r, g, b)
        l = (hi + lo) / 2
        s = 0 if hi == lo else (hi - lo) / (2 - hi - lo if l > 0.5 else hi + lo)
        h = 0 if hi == lo else (60 * ((g - b) / (hi - lo) % 6) if hi == r else 60 * ((b - r) / (hi - lo) + 2) if hi == g else 60 * ((r - g) / (hi - lo) + 4))
        if (h <= 32 or h >= 345) and s >= 0.58 and 0.6 <= l <= 0.92:
            continue  # the skin at either end
        seen += 1
        wrap += l < 0.2 or l >= 0.85 or (l >= 0.45 and s < 0.4) or (8 <= h <= 40 and s >= 0.25 and l < 0.5)
    return seen == 0 or wrap >= 0.75 * seen


def along(t, found, cell, shoulder):
    """Follow an arm past a wrapping or a cuff that hides its skin (the adventurer's bandaged
    forearms, past which the skin of the elbow is all that shows): on to the patch that starts
    within GAP px of this one's end, across wrapping only, not back the way the arm came nor in
    toward the middle (a white dress between the hands is not a wrapping), and reaching about as
    far from the shoulders or farther."""
    def out(p):
        return abs(p[:, 0].mean() - shoulder[0])
    been = [t[0]]
    while True:
        p, (ex, ey), reach, _ = t
        ux, uy = ex - shoulder[0], ey - shoulder[1]
        un = np.hypot(ux, uy) or 1.0
        best = None
        for u in found:
            if any(u[0] is q for q in been) or u[2] < reach - 2 or out(u[0]) < out(p) - INWARD:
                continue
            d = np.hypot(u[0][:, 0] - ex, u[0][:, 1] - ey)
            i = int(np.argmin(d))
            if d[i] > GAP or d[i] < 1.5:
                continue
            qx, qy = u[0][i]
            vx, vy = qx - ex, qy - ey
            if (ux * vx + uy * vy) / (un * d[i]) < BEND or not wrapped(cell, (ex, ey), (qx, qy)):
                continue
            if best is None or u[2] > best[2]:
                best = u
        if best is None:
            return t
        t = best
        been.append(t[0])


def frame(cell, r, neck, face, guessed, gloves=None, waist=None):
    shoulder = (neck[0], neck[1] + SHOULDER)
    found = [(p, *fist(p, shoulder), high) for p, high in arms(cell, neck, face, guessed, gloves, waist)]
    low = [t for t in found if not t[3]]
    rt = None
    if r is not None:
        # a fist raised beside the head counts, bits of a face cut up by the hair do not
        near = [t for t in found if (not t[3] or len(t[0]) >= RAISED)
                and np.hypot(t[0][:, 0] - r[0], t[0][:, 1] - r[1]).min() <= NEAR]
        if near:
            first = min(near, key=lambda t: np.hypot(t[0][:, 0] - r[0], t[0][:, 1] - r[1]).min())
            rt = along(first, low, cell, shoulder)
        elif low:
            # it was on the face, the neck or a skin-coloured spark: the arm reaching farthest
            rt = along(max(low, key=lambda t: t[2]), low, cell, shoulder)
        if rt is not None:
            r = rt[1]
    # the off hand: the farthest reaching other arm, followed out to its fist; not the skin of the
    # weapon arm itself short of its cuff or bracer (followed out, it ends at the same fist)
    ends = [along(t, low, cell, shoulder) for t in low]
    others = [e for e in ends if not (rt is not None and e[0] is rt[0])
              and (r is None or np.hypot(e[1][0] - r[0], e[1][1] - r[1]) > OTHER)]
    l = max(others, key=lambda t: t[2])[1] if others else None
    return r, l


def onto(cell, p, c):
    """p if it is on the figure (an opaque pixel within 1 px), else the first point on it going
    from p toward c (the figure's middle), 1 px in."""
    a = cell[..., 3] > 0
    h, w = a.shape

    def on(x, y):
        x, y = int(round(x)), int(round(y))
        return a[max(0, y - 1):min(h, y + 2), max(0, x - 1):min(w, x + 2)].any()
    if on(*p):
        return p
    d = np.hypot(c[0] - p[0], c[1] - p[1])
    n = int(d * 2) + 1
    for k in range(1, n + 1):
        x, y = p[0] + (c[0] - p[0]) * k / n, p[1] + (c[1] - p[1]) * k / n
        if on(x, y):
            t = min(1.0, (k / n) + 1.0 / max(d, 1.0))
            return [p[0] + (c[0] - p[0]) * t, p[1] + (c[1] - p[1]) * t]
    return p


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
                    r, l = frame(img[d * size:(d + 1) * size, f * size:(f + 1) * size], h["r"], neck, not body.get("hairless"), not head,
                                 GLOVES.get(name), body.get("waist"))
                    if d in REACH.get(name, ()) and clip == "thrust" and SIDE[d]:
                        r = h["r"]  # the fist hand_anchors.py found out in front, which no skin marks
                    h["r"] = [round(v, 1) for v in r] if r else None
                    h["l"] = [round(v, 1) for v in l] if l else None
                    h.pop("lh", None)
                    shown += bool(l)
                for (c, dd, f), j in SLASHED.get(name, {}).items():
                    if c == clip and dd == d and frames[j]["r"]:
                        rx, ry = frames[j]["r"]
                        h = frames[f]
                        h["r"] = [round(rx - necks[j][0] + necks[f][0], 1), round(ry - necks[j][1] + necks[f][1], 1)]
                        if h["l"] and np.hypot(h["l"][0] - h["r"][0], h["l"][1] - h["r"][1]) <= OTHER:
                            h["l"] = None  # that was the weapon arm: the off hand is borrowed below
                known = [i for i, h in enumerate(frames) if h["l"] and not h.get("lh")]
                for i, h in enumerate(frames):
                    if h["l"] or not known:
                        continue
                    j = min(known, key=lambda k: abs(k - i))
                    lx, ly = frames[j]["l"]
                    h["l"] = [round(lx - necks[j][0] + necks[i][0], 1), round(ly - necks[j][1] + necks[i][1], 1)]
                    h["lh"] = 1
                # a hand whose place was borrowed from another frame (the weapon hand hidden too,
                # in hand_anchors.py) stays on her: where that place is off the figure (she lunged
                # or turned between the frames) it comes in toward her middle
                for f, h in enumerate(frames):
                    cell = img[d * size:(d + 1) * size, f * size:(f + 1) * size]
                    for k in ("r", "l"):
                        if h[k]:
                            h[k] = [round(v, 1) for v in onto(cell, h[k], h["c"])]
            total = sum(len(r) for r in rows)
            print(f"{name} {clip}: off hand shows in {shown}/{total} frames")
    with open(store, "w") as fh:
        json.dump(bodies, fh, separators=(",", ":"))


if __name__ == "__main__":
    main()

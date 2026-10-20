"""Cut the courtyard's standing objects out of the map, one set per camera angle.

usage: python3 tools/occluders.py CAPTURES [--yaws 0,1,2,3]

CAPTURES holds the playtest tiles of the-hero-fighter oriverse/frieren/courtyard_occluders.weave
(the capture world on a flat magenta plane, no terrain or grass) named B_y<yaw>_r<row>c<col>.png,
taken with the same cameras as the map (tools/capture_tiles.json turned to each yaw). For each
yaw the magenta is keyed out into an alpha mask; the colours come from assets/maps/map_y<yaw>.jpg
so a cutout matches the map exactly. Every masked pixel is given to the object (src/world.js
SOLIDS) standing under it, each object becomes one cutout, and the cutouts are packed into
assets/maps/occluders_y<yaw>.png. assets/maps/occluders.json lists, per yaw, where each cutout
sits on the map, the depth (map y) of the front of its footprint, and a coarse mask the game
uses to tell whether it covers the player (src/occluders.js).
"""
import argparse
import json
import math
import re
import numpy as np
from PIL import Image

S2 = math.sqrt(0.5)
MAP_W, MAP_H = 4096, 3072
CX, CY = 1733, 550
TILE_W, TILE_H = 2048, 1024
CAPTION = (144, 21)  # playtest caption in each tile's top-left corner
FORWARD = [(1, 0), (0, 1), (-1, 0), (0, -1)]
# height (cm) of each kind of solid, and how far its top spreads past its footprint (cm)
SHAPE = {
    "house": (1000, 120), "tree": (900, 380), "hedge": (320, 140), "well": (480, 120),
    "box": (150, 40), "post": (160, 30), "bush": (170, 70), "rock": (70, 20),
}


def solids():
    src = open("src/world.js").read()
    out = []
    for m in re.finditer(r"\{ kind: \"(\w+)\", ([^}]*)\}", src):
        kind, body = m.group(1), m.group(2)
        vals = dict((k, float(v)) for k, v in re.findall(r"(\w+): (-?[\d.]+)", body))
        out.append({"kind": kind, **vals})
    return out


def project(yaw, x, y, z=0.0):
    fx, fy = FORWARD[yaw]
    dx, dy = x - CX, y - CY
    fwd, left = dx * fx + dy * fy, -dx * fy + dy * fx
    return MAP_W / 2 - left, MAP_H / 2 - (fwd + z) * S2


def footprint(s):
    if "r" in s:
        return [(s["x"] + s["r"] * math.cos(a), s["y"] + s["r"] * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 12, endpoint=False)]
    c, sn = math.cos(math.radians(s.get("rot", 0))), math.sin(math.radians(s.get("rot", 0)))
    pts = []
    for ux, uy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        lx, ly = ux * s["w"] / 2, uy * s["d"] / 2
        pts.append((s["x"] + lx * c - ly * sn, s["y"] + lx * sn + ly * c))
    return pts


def stitch(captures, yaw):
    canvas = np.zeros((MAP_H, MAP_W, 3), np.uint8)
    for r in range(3):
        for c in range(2):
            im = np.array(Image.open(f"{captures}/B_y{yaw}_r{r}c{c}.png").convert("RGB"))
            if im.shape[:2] != (TILE_H, TILE_W):
                raise SystemExit(f"tile y{yaw} r{r}c{c} is {im.shape[1]}x{im.shape[0]}, expected {TILE_W}x{TILE_H}")
            im[:CAPTION[1], :CAPTION[0]] = (255, 0, 255)
            canvas[r * TILE_H:(r + 1) * TILE_H, c * TILE_W:(c + 1) * TILE_W] = im
    return canvas


def key_alpha(rgb):
    """1 on objects, 0 on the magenta ground (lit, shaded or in shadow), soft in between."""
    f = rgb.astype(np.float32) / 255
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    # magenta: red and blue together well above green
    m = np.minimum(r, b) - g
    lum = (r + b) / 2
    magenta = np.clip((m / np.maximum(lum, 0.05) - 0.35) / 0.35, 0, 1)
    return (1 - magenta)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("captures")
    ap.add_argument("--yaws", default="0,1,2,3")
    args = ap.parse_args()
    objs = [s for s in solids() if s["kind"] in SHAPE]
    try:
        data = json.load(open("assets/maps/occluders.json"))
    except FileNotFoundError:
        data = {"yaws": {}}
    for yaw in [int(v) for v in args.yaws.split(",")]:
        color = np.array(Image.open(f"assets/maps/map_y{yaw}.jpg").convert("RGB"))
        alpha = key_alpha(stitch(args.captures, yaw))
        alpha[alpha < 0.08] = 0
        # every object's screen box: footprint front/back depth, horizontal reach, top
        boxes = []
        for i, s in enumerate(objs):
            h, spread = SHAPE[s["kind"]]
            pts = [project(yaw, x, y) for x, y in footprint(s)]
            xs, ys = [p[0] for p in pts], [p[1] for p in pts]
            bx, by = project(yaw, s["x"], s["y"])
            boxes.append({"i": i, "bx": bx, "by": by, "x0": min(xs) - spread, "x1": max(xs) + spread,
                          "front": max(ys), "top": min(ys) - h * S2 - spread * S2})
        ys, xs = np.nonzero(alpha > 0)
        owner = np.full(alpha.shape, -1, np.int32)
        best = np.full(len(xs), np.inf)
        own = np.full(len(xs), -1)
        for b in boxes:
            inside = (xs >= b["x0"]) & (xs <= b["x1"]) & (ys <= b["front"] + 12) & (ys >= b["top"])
            half = max(1.0, (b["x1"] - b["x0"]) / 2)
            score = np.abs(xs - b["bx"]) / half + np.clip(ys - b["by"], 0, None) / 60
            take = inside & (score < best)
            best[take] = score[take]
            own[take] = b["i"]
        owner[ys, xs] = own
        items, crops = [], []
        for b in boxes:
            m = owner == b["i"]
            if m.sum() < 60:
                continue
            yy, xx = np.nonzero(m)
            y0, y1, x0, x1 = yy.min(), yy.max() + 1, xx.min(), xx.max() + 1
            a = np.where(m[y0:y1, x0:x1], alpha[y0:y1, x0:x1], 0)
            rgba = np.dstack([color[y0:y1, x0:x1], (a * 255).astype(np.uint8)])
            # coarse mask: which cells of the cutout are mostly solid
            gr, gc = 10, 8
            mask = []
            for r in range(gr):
                row = ""
                for c in range(gc):
                    cell = a[r * a.shape[0] // gr:(r + 1) * a.shape[0] // gr, c * a.shape[1] // gc:(c + 1) * a.shape[1] // gc]
                    row += "1" if cell.size and cell.mean() > 0.35 else "0"
                mask.append(row)
            s = objs[b["i"]]
            items.append({"kind": s["kind"], "mx": int(x0), "my": int(y0), "w": int(x1 - x0), "h": int(y1 - y0),
                          "depth": round(b["front"], 1), "mask": mask})
            crops.append(rgba)
        # shelf-pack the cutouts into one atlas
        order = sorted(range(len(crops)), key=lambda i: -crops[i].shape[0])
        width, x, y, shelf, placed = 2048, 0, 0, 0, {}
        width = max(width, max((c.shape[1] for c in crops), default=1))
        for i in order:
            h, w = crops[i].shape[:2]
            if x + w > width:
                x, y, shelf = 0, y + shelf + 2, 0
            placed[i] = (x, y)
            x += w + 2
            shelf = max(shelf, h)
        atlas = np.zeros((y + shelf, width, 4), np.uint8)
        for i, (px, py) in placed.items():
            h, w = crops[i].shape[:2]
            atlas[py:py + h, px:px + w] = crops[i]
            items[i]["sx"], items[i]["sy"] = px, py
        name = f"occluders_y{yaw}.png"
        Image.fromarray(atlas).save(f"assets/maps/{name}", optimize=True)
        data["yaws"][str(yaw)] = {"atlas": name, "items": items}
        print(f"yaw {yaw}: {len(items)} cutouts, atlas {atlas.shape[1]}x{atlas.shape[0]}")
    json.dump(data, open("assets/maps/occluders.json", "w"), separators=(",", ":"))


if __name__ == "__main__":
    main()

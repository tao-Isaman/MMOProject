"""Build the free-turning courtyard (src/scene.ts) from Oriverse captures.

usage: python3 tools/scene360.py CAPTURES [--full public/assets/maps/map_y0.jpg]

CAPTURES holds the playtest tiles listed in tools/scene_views.json (ortho_half_h_cm 512,
capture_size 2048x1024, one view per call):
  G_r<row>c<col>.png       the-hero-fighter oriverse/frieren/courtyard_ground.weave at yaw 0:
                           terrain, paths and flowers with nothing standing on them
  O_y<k>_r<row>c<col>.png  courtyard_occluders.weave (everything that stands up, on a flat
                           magenta plane) at heading k * 360 / 8 degrees

Writes to public/assets/maps/:
  ground.webp       the ground at yaw 0, cropped to the courtyard plus a margin, with the
                    objects' shadows (read off the magenta plane from every heading) baked in
  props_y<k>.webp   every object cut out of heading k, packed into one atlas
  scene.json        where the ground sits, and per object (src/world.ts SPECS, in order) its
                    base point, footprint and, per heading, its cutout, base anchor and a
                    coarse mask

--full, the old full-scene map at yaw 0, calibrates how dark the baked shadows are.
"""
import argparse
import json
import math
import re
import numpy as np
from PIL import Image

S2 = math.sqrt(0.5)
CX, CY = 1733, 550
TW, TH = 2048, 1024
CAPTION = (144, 21)
BOUNDS = (60, 2650, -760, 2050)  # src/world.ts BOUNDS: minX, maxX, minY, maxY
MARGIN = 1100                     # cm of ground kept around the walkable bounds
HEADINGS = 8
OUT = "public/assets/maps"
# height (cm) of each kind of object and how far its top spreads past its footprint (cm)
SHAPE = {
    "house": (1000, 120), "tree": (900, 380), "hedge": (320, 140), "well": (480, 120),
    "box": (150, 40), "post": (160, 30), "bush": (170, 70), "rock": (70, 20),
}
# Rough 3-D stand-ins for deciding which object a pixel shows: a pixel belongs to the stand-in
# its view ray hits first. ("box", extra cm around the footprint, top[, bottom]) or ("ellipsoid",
# extra radius, centre height, vertical radius); the house is walls plus a roof with eaves,
# the gazebo posts plus a roof, trees a trunk plus a crown.
PROXY = {
    "house": [("box", 8, 520), ("box", 110, 1080, 470)], "well": [("box", 2, 205), ("box", 8, 280, 204), ("box", -45, 365, 280)],
    "box": [("box", 12, None)],  # height from its size: cart, bench or fence, crate
    "post": [("box", 20, 170)], "rock": [("ellipsoid", 12, 15, 45)],
    "bush": [("ellipsoid", 30, 80, 95)], "hedge": [("ellipsoid", 60, 150, 190)],
    "tree": [("box", 10, 420), ("ellipsoid", 330, 600, 330)],
}


def solids():
    src = open("src/world.ts").read()
    out = []
    for m in re.finditer(r"\{ kind: \"(\w+)\", ([^}]*)\}", src):
        vals = dict((k, float(v)) for k, v in re.findall(r"(\w+): (-?[\d.]+)", m.group(2)))
        out.append({"kind": m.group(1), **vals})
    return out


def footprint(s, n=8):
    if "r" in s:
        return [(s["x"] + s["r"] * math.cos(a), s["y"] + s["r"] * math.sin(a)) for a in np.linspace(0, 2 * math.pi, n, endpoint=False)]
    c, sn = math.cos(math.radians(s.get("rot", 0))), math.sin(math.radians(s.get("rot", 0)))
    return [(s["x"] + ux * s["w"] / 2 * c - uy * s["d"] / 2 * sn, s["y"] + ux * s["w"] / 2 * sn + uy * s["d"] / 2 * c)
            for ux, uy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]


def project(theta, x, y, z=0.0):
    """World point -> screen offset (px) from the courtyard centre at heading theta."""
    fx, fy = math.cos(theta), math.sin(theta)
    dx, dy = np.asarray(x, float) - CX, np.asarray(y, float) - CY
    fwd, left = dx * fx + dy * fy, -dx * fy + dy * fx
    return -left, -(fwd + z) * S2


FOLIAGE = {"tree", "hedge", "bush"}


def leafy(rgb):
    """Pixels that look like leaves: green clearly above red and blue."""
    f = rgb.astype(np.int16)
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    return (g > r + 8) & (g > b + 20)


def ray_hits(theta, s, sx, sy, leaves=None):
    """Distance along the view ray (smaller = nearer the camera) at which each screen point
    (offsets from the centre) first meets the object's stand-in; inf where it misses. leaves:
    per point, whether it looks like foliage (rounded stand-ins only claim those)."""
    fx, fy = math.cos(theta), math.sin(theta)
    x0, y0 = unproject(theta, sx, sy)  # where the ray meets the ground; P(t) = (x0, y0, 0) + t (fx, fy, -1)
    best = np.full(np.shape(sx), np.inf)
    for part in PROXY[s["kind"]]:
        if part[0] == "box":
            pad, height = part[1], part[2]
            if height is None:
                big, small = max(s["w"], s["d"]), min(s["w"], s["d"])
                height = 230 if small >= 100 else 115 if big >= 150 else 75
            bottom = part[3] if len(part) > 3 else 0.0
            if "r" in s:
                hw = hd = s["r"] + pad
                c, sn = 1.0, 0.0
            else:
                hw, hd = s["w"] / 2 + pad, s["d"] / 2 + pad
                c, sn = math.cos(math.radians(s.get("rot", 0))), math.sin(math.radians(s.get("rot", 0)))
            ox, oy = x0 - s["x"], y0 - s["y"]
            lx, ly = ox * c + oy * sn, -ox * sn + oy * c        # ray origin in the box frame
            dx, dy = fx * c + fy * sn, -fx * sn + fy * c        # ray direction in the box frame
            t0 = np.full(np.shape(sx), -np.inf)
            t1 = np.full(np.shape(sx), np.inf)
            for o, d, h in ((lx, dx, hw), (ly, dy, hd)):
                if abs(d) < 1e-9:
                    inside = np.abs(o) <= h
                    t0 = np.where(inside, t0, np.inf)
                else:
                    a, b = (-h - o) / d, (h - o) / d
                    t0 = np.maximum(t0, np.minimum(a, b))
                    t1 = np.minimum(t1, np.maximum(a, b))
            # height: z = -t between the bottom and the top
            t0 = np.maximum(t0, -height)
            t1 = np.minimum(t1, -bottom)
            t = np.where(t0 <= t1, t0, np.inf)
        else:
            pad, cz, rz = part[1], part[2], part[3]
            r = (s["r"] if "r" in s else max(s["w"], s["d"]) / 2) + pad
            ox, oy = x0 - s["x"], y0 - s["y"]
            A = 1 / r ** 2 + 1 / rz ** 2
            B = 2 * ((ox * fx + oy * fy) / r ** 2 + cz / rz ** 2)
            C = (ox ** 2 + oy ** 2) / r ** 2 + cz ** 2 / rz ** 2 - 1
            disc = B * B - 4 * A * C
            t = np.where(disc >= 0, (-B - np.sqrt(np.maximum(disc, 0))) / (2 * A), np.inf)
            # a crown or bush stand-in is rounder than the real leaves: it only claims leaf pixels
            if leaves is not None:
                t = np.where(leaves, t, np.inf)
        best = np.minimum(best, t)
    return best


def unproject(theta, sx, sy):
    """Screen offset at heading theta -> world point on the ground."""
    fx, fy = math.cos(theta), math.sin(theta)
    fwd, left = -np.asarray(sy, float) / S2, -np.asarray(sx, float)
    return CX + fwd * fx - left * fy, CY + fwd * fy + left * fx


def stitch(paths, rows, cols, caption_fill=None):
    canvas = np.zeros((rows * TH, cols * TW, 3), np.uint8)
    for r in range(rows):
        for c in range(cols):
            im = np.array(Image.open(paths(r, c)).convert("RGB"))
            if im.shape[:2] != (TH, TW):
                raise SystemExit(f"{paths(r, c)} is {im.shape[1]}x{im.shape[0]}, expected {TW}x{TH}")
            # cover the caption with the mirrored strip below it
            im[:CAPTION[1], :CAPTION[0]] = im[CAPTION[1]:2 * CAPTION[1], :CAPTION[0]][::-1]
            canvas[r * TH:(r + 1) * TH, c * TW:(c + 1) * TW] = im
    return canvas


def key(rgb):
    """Alpha (1 on objects, 0 on the magenta plane, lit or shaded) and the plane's brightness.

    The lit plane renders as (255, 188, 255) with red and blue clipped, its shadows as darker
    purples like (198, 80, 242): green well below the smaller of red and blue. Brightness is
    read off green, the one channel that doesn't clip."""
    f = rgb.astype(np.float32) / 255
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    mn = np.minimum(r, b)
    m = (mn - g) / np.maximum(mn, 0.05)
    magenta = np.clip((m - 0.08) / 0.09, 0, 1)
    return 1 - magenta, g


def despill(rgb, alpha):
    """Take the magenta fringe out of soft edge pixels."""
    f = rgb.astype(np.float32)
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    spill = np.clip(np.minimum(r, b) - g, 0, None) * np.clip(1.4 * (1 - alpha), 0, 1)
    f[..., 0] -= spill
    f[..., 2] -= spill
    return np.clip(f, 0, 255).astype(np.uint8)


def sample(img, x, y):
    """Bilinear sample of a 2-D array at float pixel coordinates (nan outside)."""
    h, w = img.shape
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    fx, fy = x - x0, y - y0
    ok = (x0 >= 0) & (y0 >= 0) & (x0 < w - 1) & (y0 < h - 1)
    x0c, y0c = np.clip(x0, 0, w - 2), np.clip(y0, 0, h - 2)
    v = (img[y0c, x0c] * (1 - fx) * (1 - fy) + img[y0c, x0c + 1] * fx * (1 - fy)
         + img[y0c + 1, x0c] * (1 - fx) * fy + img[y0c + 1, x0c + 1] * fx * fy)
    return np.where(ok, v, np.nan)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("captures")
    ap.add_argument("--full", default=f"{OUT}/map_y0.jpg")
    ap.add_argument("--views", default="tools/scene_views.json")
    args = ap.parse_args()
    views = json.load(open(args.views))
    objs = [s for s in solids() if s["kind"] in SHAPE]

    props = [{"kind": s["kind"], "x": s["x"], "y": s["y"],
              "foot": [[round(x, 1), round(y, 1)] for x, y in footprint(s)], "views": []} for s in objs]
    atlases = []
    shadow_maps = []  # per heading: (theta, x0, y0, darkness with nan on objects)

    for k in range(HEADINGS):
        v = views["objects"][str(k)]
        theta = math.radians(v["theta_deg"])
        x0, y0 = v["x0"], v["y0"]
        rgb = stitch(lambda r, c: f"{args.captures}/O_y{k}_r{r}c{c}.png", v["rows"], v["cols"], (255, 0, 255))
        alpha, lum = key(rgb)
        alpha[alpha < 0.08] = 0
        plane = alpha == 0
        lit = np.percentile(lum[plane], 96)
        dark = np.where(plane, np.clip(1 - lum / lit, 0, 1), np.nan)
        for r in range(v["rows"]):  # the captions say nothing about shadows
            for c in range(v["cols"]):
                dark[r * TH:r * TH + CAPTION[1], c * TW:c * TW + CAPTION[0]] = np.nan
        shadow_maps.append((theta, x0, y0, dark))

        # every object's screen box at this heading (canvas px)
        boxes = []
        for i, s in enumerate(objs):
            h, spread = SHAPE[s["kind"]]
            fp = footprint(s)
            px, py = project(theta, [p[0] for p in fp], [p[1] for p in fp])
            bx, by = project(theta, s["x"], s["y"])
            boxes.append({"i": i, "bx": float(bx) - x0, "by": float(by) - y0,
                          "x0": px.min() - spread - x0, "x1": px.max() + spread - x0,
                          "front": py.max() - y0, "top": py.min() - h * S2 - spread * S2 - y0})
        ys, xs = np.nonzero(alpha > 0)
        green = leafy(rgb)[ys, xs]
        best = np.full(len(xs), np.inf)
        own = np.full(len(xs), -1)
        far = np.full(len(xs), np.inf)
        near = np.full(len(xs), -1)
        for b in boxes:
            # the nearest stand-in along the view ray wins the pixel
            cand = (xs >= b["x0"] - 40) & (xs <= b["x1"] + 40) & (ys <= b["front"] + 40) & (ys >= b["top"] - 40)
            if cand.any():
                t = ray_hits(theta, objs[b["i"]], xs[cand] + x0, ys[cand] + y0, green[cand] if objs[b["i"]]["kind"] in FOLIAGE else None)
                idx = np.nonzero(cand)[0]
                take = t < best[idx]
                best[idx[take]] = t[take]
                own[idx[take]] = b["i"]
            # fallback for pixels no stand-in covers: the nearest box edge
            d = np.hypot(np.clip(np.maximum(b["x0"] - xs, xs - b["x1"]), 0, None),
                         np.clip(np.maximum(b["top"] - ys, ys - b["front"]), 0, None))
            closer = d < far
            far[closer] = d[closer]
            near[closer] = b["i"]
        own = np.where(own >= 0, own, near)
        owner = np.full(alpha.shape, -1, np.int32)
        owner[ys, xs] = own
        clean = despill(rgb, alpha)

        crops, metas = [], []
        for b in boxes:
            m = owner == b["i"]
            if m.sum() < 60:
                metas.append(None)
                crops.append(None)
                continue
            yy, xx = np.nonzero(m)
            cy0, cy1, cx0, cx1 = yy.min(), yy.max() + 1, xx.min(), xx.max() + 1
            a = np.where(m[cy0:cy1, cx0:cx1], alpha[cy0:cy1, cx0:cx1], 0)
            crops.append(np.dstack([clean[cy0:cy1, cx0:cx1], (a * 255).astype(np.uint8)]))
            gr, gc = 10, 8
            mask = []
            for r in range(gr):
                row = ""
                for c in range(gc):
                    cell = a[r * a.shape[0] // gr:(r + 1) * a.shape[0] // gr, c * a.shape[1] // gc:(c + 1) * a.shape[1] // gc]
                    row += "1" if cell.size and cell.mean() > 0.35 else "0"
                mask.append(row)
            metas.append({"a": k, "w": int(cx1 - cx0), "h": int(cy1 - cy0),
                          "ax": round(b["bx"] - cx0, 1), "ay": round(b["by"] - cy0, 1), "mask": mask})
        # shelf-pack this heading's cutouts
        order = sorted([i for i, c in enumerate(crops) if c is not None], key=lambda i: -crops[i].shape[0])
        width = max([2048] + [crops[i].shape[1] for i in order])
        x, y, shelf, placed = 0, 0, 0, {}
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
            metas[i]["sx"], metas[i]["sy"] = px, py
        name = f"props_y{k}.webp"
        Image.fromarray(atlas).save(f"{OUT}/{name}", quality=90, method=6)
        atlases.append(name)
        for i, meta in enumerate(metas):
            props[i]["views"].append(meta)
        print(f"heading {k}: {len(order)} cutouts, atlas {atlas.shape[1]}x{atlas.shape[0]}")

    # ---- ground ----
    g = views["ground"]
    ground = stitch(lambda r, c: f"{args.captures}/G_r{r}c{c}.png", g["rows"], g["cols"], None)
    gx0, gy0 = g["x0"], g["y0"]
    # crop to the walkable bounds plus a margin, as seen at yaw 0
    corners = [(x, y) for x in (BOUNDS[0] - MARGIN, BOUNDS[1] + MARGIN) for y in (BOUNDS[2] - MARGIN, BOUNDS[3] + MARGIN)]
    px, py = project(0.0, [c[0] for c in corners], [c[1] for c in corners])
    cx0 = int(max(gx0, math.floor(px.min()))); cx1 = int(min(gx0 + ground.shape[1], math.ceil(px.max())))
    cy0 = int(max(gy0, math.floor(py.min()))); cy1 = int(min(gy0 + ground.shape[0], math.ceil(py.max())))
    ground = ground[cy0 - gy0:cy1 - gy0, cx0 - gx0:cx1 - gx0].astype(np.float32)

    # shadow darkness on the ground, averaged over every heading that sees that spot, at
    # quarter resolution (shadows are soft)
    q = 4
    gh, gw = ground.shape[:2]
    vv, uu = np.mgrid[0:gh:q, 0:gw:q].astype(np.float32)
    wx, wy = unproject(0.0, uu + cx0, vv + cy0)
    acc = np.zeros(uu.shape, np.float32)
    cnt = np.zeros(uu.shape, np.float32)
    for theta, x0, y0, dark in shadow_maps:
        sx, sy = project(theta, wx, wy)
        seen = np.isfinite(dark)
        d = sample(np.where(seen, dark, 0), sx - x0, sy - y0)
        # only where all four neighbours are on the plane (not on an object)
        ok = np.isfinite(d) & (sample(seen.astype(np.float32), sx - x0, sy - y0) > 0.999)
        acc[ok] += d[ok]
        cnt[ok] += 1
    shade = np.where(cnt > 0, acc / np.maximum(cnt, 1), 0)
    shade = np.array(Image.fromarray(shade.astype(np.float32)).resize((gw, gh), Image.BILINEAR))

    # how dark a full shadow is, per channel, from the old full-scene render at yaw 0
    strength = np.array([0.55, 0.5, 0.42], np.float32)
    try:
        full = np.array(Image.open(args.full).convert("RGB"), np.float32)
        fx0, fy0 = -full.shape[1] // 2, -full.shape[0] // 2
        theta, x0, y0, dark0 = shadow_maps[0]
        # pixels seen at yaw 0 by both the full map and the ground crop, not on an object
        ys_, xs_ = np.mgrid[0:full.shape[0]:3, 0:full.shape[1]:3]
        gx, gy = xs_ + fx0 - cx0, ys_ + fy0 - cy0
        dx_, dy_ = xs_ + fx0 - x0, ys_ + fy0 - y0
        ok = (gx >= 0) & (gy >= 0) & (gx < gw) & (gy < gh) & (dx_ >= 0) & (dy_ >= 0) & (dx_ < dark0.shape[1]) & (dy_ < dark0.shape[0])
        gx, gy, dx_, dy_, fxs, fys = gx[ok], gy[ok], dx_[ok], dy_[ok], xs_[ok], ys_[ok]
        dd = dark0[dy_, dx_]
        sel = np.isfinite(dd) & (dd > 0.15)
        G = ground[gy[sel], gx[sel]]
        F = full[fys[sel], fxs[sel]]
        d = dd[sel][:, None]
        # F = G (1 - s d)  ->  s = sum(d (1 - F/G)) / sum(d^2)
        ratio = np.clip(F / np.maximum(G, 8), 0, 2)
        strength = np.clip((d * (1 - ratio)).sum(0) / (d * d).sum(0), 0.2, 0.95).astype(np.float32)
        print("shadow strength from the full map:", np.round(strength, 3), f"({sel.sum()} samples)")
    except FileNotFoundError:
        print("no full map: default shadow strength", strength)
    ground = ground * (1 - strength[None, None, :] * shade[..., None])
    Image.fromarray(np.clip(ground, 0, 255).astype(np.uint8)).save(f"{OUT}/ground.webp", quality=88, method=6)
    print(f"ground {gw}x{gh} at ({cx0}, {cy0})")

    scene = {"ground": {"image": "ground.webp", "x0": cx0, "y0": cy0}, "headings": HEADINGS, "atlases": atlases, "props": props}
    json.dump(scene, open(f"{OUT}/scene.json", "w"), separators=(",", ":"))


if __name__ == "__main__":
    main()

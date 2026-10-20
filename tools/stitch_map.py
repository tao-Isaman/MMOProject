"""Stitch the six Oriverse ortho captures into assets/map.jpg.

usage: python3 tools/stitch_map.py r0c0 r0c1 r1c0 r1c1 r2c0 r2c1 [-o assets/map.jpg]

Tiles are the playtest views listed in tools/capture_tiles.json, row-major: row 0 is the far
(top) band, column 0 the left half. Each covers 2048 x 1024 cm of the image plane, so the
map comes out at 1 px per cm, which is what src/projection.js expects.
"""
import argparse
from PIL import Image

TILE_W, TILE_H = 2048, 1024
COLS, ROWS = 2, 3

ap = argparse.ArgumentParser()
ap.add_argument("tiles", nargs=COLS * ROWS)
ap.add_argument("-o", "--out", default="assets/map.jpg")
ap.add_argument("-q", "--quality", type=int, default=86)
args = ap.parse_args()

canvas = Image.new("RGB", (TILE_W * COLS, TILE_H * ROWS))
for i, path in enumerate(args.tiles):
    im = Image.open(path).convert("RGB")
    if im.size != (TILE_W, TILE_H):
        print(f"warning: {path} is {im.size[0]}x{im.size[1]}, resampling to {TILE_W}x{TILE_H}")
        im = im.resize((TILE_W, TILE_H), Image.LANCZOS)
    canvas.paste(im, ((i % COLS) * TILE_W, (i // COLS) * TILE_H))
canvas.save(args.out, quality=args.quality, optimize=True, progressive=True)
print(args.out, canvas.size)

"""Stitch the six Oriverse ortho captures of one camera angle into public/assets/maps/map_y<yaw>.jpg.

usage: python3 tools/stitch_map.py r0c0 r0c1 r1c0 r1c1 r2c0 r2c1 [-o public/assets/maps/map_y0.jpg]

Tiles are the playtest views listed in tools/capture_tiles.json, row-major: row 0 is the far
(top) band, column 0 the left half. Each covers 2048 x 1024 cm of the image plane; at the
full 2048 x 1024 capture size the map comes out at 1 px per cm. Smaller captures work too:
the client reads the scale from the image width.

Playtest captures stamp a small caption ("0s sky full") in each tile's top-left corner; it is
covered with the mirrored strip of ground just below it.
"""
import argparse
from PIL import Image, ImageOps

COLS, ROWS = 2, 3

ap = argparse.ArgumentParser()
ap.add_argument("tiles", nargs=COLS * ROWS)
ap.add_argument("-o", "--out", default="public/assets/maps/map_y0.jpg")
ap.add_argument("-q", "--quality", type=int, default=86)
ap.add_argument("--caption", type=int, nargs=2, default=(144, 21), metavar=("W", "H"),
                help="size of the capture caption to cover, in pixels of a 2048-wide tile")
args = ap.parse_args()

tiles = [Image.open(p).convert("RGB") for p in args.tiles]
tw, th = tiles[0].size
if any(t.size != (tw, th) for t in tiles):
    raise SystemExit("all tiles must have the same size: " + ", ".join(f"{t.size[0]}x{t.size[1]}" for t in tiles))

k = tw / 2048
cw, ch = round(args.caption[0] * k), round(args.caption[1] * k)
canvas = Image.new("RGB", (tw * COLS, th * ROWS))
for i, im in enumerate(tiles):
    below = im.crop((0, ch, cw, ch * 2))
    im.paste(ImageOps.flip(below), (0, 0))
    canvas.paste(im, ((i % COLS) * tw, (i // COLS) * th))
canvas.save(args.out, quality=args.quality, optimize=True, progressive=True)
print(args.out, canvas.size)

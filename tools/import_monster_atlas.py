"""Crop a generated 9x4 monster atlas and register it with the game.

usage: python tools/import_monster_atlas.py <monster-id> <image.png> [--cell 96|128]

The source may be an exact 9x4 sheet or a centered sheet padded to 1536x1024.
"""
import argparse
import json
import re
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MONSTER_DIR = ROOT / "public" / "assets" / "monsters"
INDEX_PATH = MONSTER_DIR / "index.json"


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("monster_id", help="Bestiary ID and output PNG basename")
    parser.add_argument("image", type=Path, help="Generated PNG source")
    parser.add_argument("--cell", type=int, choices=(96, 128), default=128)
    parser.add_argument("--force", action="store_true", help="Replace an existing sprite sheet")
    return parser.parse_args()


def main():
    args = parse_args()
    if not re.fullmatch(r"[a-z0-9_]+", args.monster_id):
        raise SystemExit("monster_id must contain lowercase letters, digits, and underscores")

    target = MONSTER_DIR / f"{args.monster_id}.png"
    if target.exists() and not args.force:
        raise SystemExit(f"Refusing to overwrite {target}; pass --force to replace it")

    with Image.open(args.image) as opened:
        source = opened.convert("RGBA")
    alpha = source.getchannel("A")
    if alpha.getextrema() == (255, 255):
        raise SystemExit("Source PNG has no transparent pixels")

    cell = args.cell
    sheet_width, sheet_height = cell * 9, cell * 4
    if source.size == (sheet_width, sheet_height):
        sheet = source
    elif source.size == (1536, 1024):
        left = (source.width - sheet_width) // 2
        top = (source.height - sheet_height) // 2
        sheet = source.crop((left, top, left + sheet_width, top + sheet_height))
    else:
        raise SystemExit(
            f"Expected {sheet_width}x{sheet_height} or 1536x1024 source, got "
            f"{source.width}x{source.height}"
        )

    top_height = 0
    for row in range(4):
        idle = sheet.crop((0, row * cell, cell, (row + 1) * cell))
        bounds = idle.getchannel("A").getbbox()
        if bounds:
            top_height = max(top_height, cell - bounds[1])
    if top_height <= 0:
        raise SystemExit("No visible pixels found in idle frames")

    MONSTER_DIR.mkdir(parents=True, exist_ok=True)
    sheet.save(target, format="PNG", optimize=True)

    index = json.loads(INDEX_PATH.read_text(encoding="utf-8")) if INDEX_PATH.exists() else {}
    index[args.monster_id] = {
        "cell": cell,
        "foot": 0,
        "top": top_height,
        "walk": 4,
        "attack": 4,
    }
    INDEX_PATH.write_text(
        json.dumps(dict(sorted(index.items())), ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )
    print(f"Registered {args.monster_id}: {sheet_width}x{sheet_height}, cell={cell}, top={top_height}")


if __name__ == "__main__":
    main()

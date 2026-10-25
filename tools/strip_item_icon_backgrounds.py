"""Remove the framed tile behind inventory artwork while preserving the item art.

By default writes preview copies under tmp/item-icon-cutouts. Pass --write to replace
the matching item artwork PNGs in public/assets/skills.
"""

from __future__ import annotations

import re
import sys
from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SKILL_ART = ROOT / "public" / "assets" / "skills"
ITEMS_TS = ROOT / "src" / "items.ts"


def item_art_paths() -> list[Path]:
    source = ITEMS_TS.read_text(encoding="utf-8")
    base = source.split("const BASE: Record<string, Item> = {", 1)[1].split("\n};", 1)[0]
    ids = set(re.findall(r"(?m)^  ([A-Za-z0-9_]+):", base))
    tier_art = source.split("const TIER_ART:", 1)[1].split("};", 1)[0]
    ids.update(re.findall(r':\s*"([A-Za-z0-9_]+)"', tier_art))
    return sorted(path for item_id in ids if (path := SKILL_ART / f"{item_id}.png").is_file())


def flood_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    remove = bytearray(width * height)

    def outer_backdrop(x: int, y: int) -> bool:
        r, g, b, _ = pixels[x, y]
        chroma = max(r, g, b) - min(r, g, b)
        gray = (r + g + b) / 3
        # The generated icons use a neutral bevel around the square tile as well as
        # the flat gray matte. Treat the connected neutral frame as background too.
        return chroma <= 42 and 34 <= gray <= 246

    def tile_backdrop(x: int, y: int) -> bool:
        r, g, b, _ = pixels[x, y]
        chroma = max(r, g, b) - min(r, g, b)
        gray = (r + g + b) / 3
        blue_tile = r < 58 and g < 76 and b < 104 and b >= g + 5 and g >= r + 4
        neutral_tile = chroma <= 34 and gray < 96
        return blue_tile or neutral_tile

    def flood(seeds: list[tuple[int, int]], predicate) -> None:
        queue: deque[tuple[int, int]] = deque()
        for x, y in seeds:
            i = y * width + x
            if not remove[i] and predicate(x, y):
                remove[i] = 1
                queue.append((x, y))
        while queue:
            x, y = queue.popleft()
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if not (0 <= nx < width and 0 <= ny < height):
                    continue
                i = ny * width + nx
                if not remove[i] and predicate(nx, ny):
                    remove[i] = 1
                    queue.append((nx, ny))

    outer_seeds = ([(x, 0) for x in range(width)] + [(x, height - 1) for x in range(width)]
                   + [(0, y) for y in range(height)] + [(width - 1, y) for y in range(height)])
    flood(outer_seeds, outer_backdrop)

    # The dark blue tile is enclosed by its bevel, so seed its inner edge separately.
    inset = max(4, round(min(width, height) * 0.09))
    inner_seeds = ([(x, inset) for x in range(inset, width - inset)]
                   + [(x, height - inset - 1) for x in range(inset, width - inset)]
                   + [(inset, y) for y in range(inset, height - inset)]
                   + [(width - inset - 1, y) for y in range(inset, height - inset)]
                   + [(width // 2, height // 2)])
    flood(inner_seeds, tile_backdrop)

    alpha = rgba.getchannel("A")
    alpha_pixels = alpha.load()
    for y in range(height):
        for x in range(width):
            if remove[y * width + x]:
                alpha_pixels[x, y] = 0
    rgba.putalpha(alpha)
    return rgba


def main() -> None:
    write = "--write" in sys.argv[1:]
    paths = item_art_paths()
    output = ROOT / "tmp" / "item-icon-cutouts"
    if not write:
        output.mkdir(parents=True, exist_ok=True)
    for path in paths:
        result = flood_background(Image.open(path))
        target = path if write else output / path.name
        result.save(target, optimize=True)
    print(f"{'Updated' if write else 'Previewed'} {len(paths)} item icons" + ("." if write else f" in {output.relative_to(ROOT)}"))


if __name__ == "__main__":
    main()

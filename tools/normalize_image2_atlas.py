"""Convert a transparent 8x4 Image 2 atlas into the game's 9x4 monster atlas.

Usage:
    python tools/normalize_image2_atlas.py source.png destination.png
    python tools/normalize_image2_atlas.py source.png destination.png --force

The eight source columns are 192px wide. Source row bands are detected from
the transparent gaps because GPT Image 2 may space the four rows unevenly.
Output cells are 128x128; visible sprite content is scaled to fit within
112x112, centered horizontally, and bottom-aligned at y=124.
"""

import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


SOURCE_SIZE = (1536, 1024)
SOURCE_CELL_WIDTH = 192
OUTPUT_CELL = 128
OUTPUT_COLUMNS = 9
OUTPUT_ROWS = 4
MAX_SPRITE_SIZE = 112
BASELINE_Y = 124
ROW_GAP_BRIDGE = 10
ROW_EDGE_PADDING = 2


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Transparent RGBA 1536x1024 source PNG")
    parser.add_argument("destination", type=Path, help="Output 1152x512 atlas PNG")
    parser.add_argument("--force", action="store_true", help="Replace an existing destination")
    return parser.parse_args()


def detect_row_sprites(source):
    """Cluster visible sprites into four direction rows, including variable columns."""
    alpha = np.asarray(source.getchannel("A"))
    mask = np.where(alpha >= 64, 255, 0).astype(np.uint8)
    cv2.setNumThreads(1)
    component_count, _, stats, _ = cv2.connectedComponentsWithStats(mask, 8)

    components = []
    for component_index in range(1, component_count):
        x, y, width, height, area = stats[component_index]
        if area >= 1500 and width >= 20 and height >= 30:
            components.append(
                (float(y + height / 2), int(x), int(y), int(width), int(height), int(area))
            )

    components.sort(key=lambda item: item[0])
    if len(components) < OUTPUT_ROWS * 6:
        raise SystemExit(f"Only {len(components)} sprites were detectable in the source")

    gaps = sorted(
        range(len(components) - 1),
        key=lambda index: components[index + 1][0] - components[index][0],
        reverse=True,
    )
    split_points = sorted(gaps[: OUTPUT_ROWS - 1])
    split_sizes = [
        components[split_points[0] + 1][0] - components[split_points[0]][0],
        components[split_points[1] + 1][0] - components[split_points[1]][0],
        components[split_points[2] + 1][0] - components[split_points[2]][0],
    ]
    if min(split_sizes) < 40:
        raise SystemExit(
            "Could not reliably separate the four direction rows; "
            f"largest center gaps were {split_sizes}"
        )

    rows = []
    start = 0
    for split in split_points:
        rows.append(components[start : split + 1])
        start = split + 1
    rows.append(components[start:])

    for row_index, row in enumerate(rows):
        if len(row) > 8:
            row = sorted(row, key=lambda item: item[5], reverse=True)[:8]
        row.sort(key=lambda item: item[1] + item[3] / 2)
        if len(row) < 6:
            raise SystemExit(
                f"Direction row {row_index + 1} has only {len(row)} detectable sprites"
            )
        rows[row_index] = row
    return rows


def source_column_map(source_count):
    """Map the generated row to idle, four walk frames, and four attack frames."""
    if source_count >= 8:
        return [0, 1, 2, 3, 4, 5, 6, 7, 6]
    if source_count == 7:
        return [0, 1, 2, 3, 4, 5, 6, 5, 6]
    return [0, 1, 2, 3, 4, 5, 4, 5, 4]


def main():
    args = parse_args()
    if args.destination.exists() and not args.force:
        raise SystemExit(
            f"Refusing to overwrite {args.destination}; pass --force to replace it"
        )

    try:
        with Image.open(args.source) as opened:
            if opened.format != "PNG":
                raise SystemExit("Source must be a PNG image")
            if opened.mode != "RGBA":
                raise SystemExit(f"Source must be RGBA, got {opened.mode}")
            if opened.size != SOURCE_SIZE:
                raise SystemExit(
                    f"Source must be {SOURCE_SIZE[0]}x{SOURCE_SIZE[1]}, got "
                    f"{opened.width}x{opened.height}"
                )
            source = opened.copy()
    except OSError as error:
        raise SystemExit(f"Could not read source PNG: {error}") from error

    if source.getchannel("A").getextrema() == (255, 255):
        raise SystemExit("Source must contain transparent pixels")

    sprite_rows = detect_row_sprites(source)
    atlas = Image.new(
        "RGBA",
        (OUTPUT_COLUMNS * OUTPUT_CELL, OUTPUT_ROWS * OUTPUT_CELL),
        (0, 0, 0, 0),
    )
    for row, components in enumerate(sprite_rows):
        for output_column, source_column in enumerate(source_column_map(len(components))):
            _, x, y, width, height, _ = components[source_column]
            sprite = source.crop((x, y, x + width, y + height))
            scale = min(
                MAX_SPRITE_SIZE / sprite.width,
                MAX_SPRITE_SIZE / sprite.height,
                1.0,
            )
            width = max(1, round(sprite.width * scale))
            height = max(1, round(sprite.height * scale))
            if sprite.size != (width, height):
                sprite = sprite.resize((width, height), Image.Resampling.LANCZOS)

            x = output_column * OUTPUT_CELL + (OUTPUT_CELL - width) // 2
            y = row * OUTPUT_CELL + BASELINE_Y - height
            atlas.alpha_composite(sprite, (x, y))

    args.destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        with args.destination.open("xb") as output:
            atlas.save(output, format="PNG", optimize=True)
    except FileExistsError:
        if args.force:
            atlas.save(args.destination, format="PNG", optimize=True)
        else:
            raise SystemExit(
                f"Refusing to overwrite {args.destination}; pass --force to replace it"
            )
    except OSError as error:
        raise SystemExit(f"Could not write destination PNG: {error}") from error

    print(
        f"Wrote {args.destination}: {OUTPUT_COLUMNS * OUTPUT_CELL}x"
        f"{OUTPUT_ROWS * OUTPUT_CELL}, cell={OUTPUT_CELL}"
    )


if __name__ == "__main__":
    main()

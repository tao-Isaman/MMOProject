"""Generate and register missing monster sheets with the bundled ImageGen CLI.

The API key is read from the ignored repository-root key.txt file. Generated
sources and intermediate files are kept under output/imagegen and tmp/imagegen.
"""

import argparse
import concurrent.futures
import json
import os
from pathlib import Path
import re
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
MONSTER_DIR = ROOT / "public" / "assets" / "monsters"
INDEX_PATH = MONSTER_DIR / "index.json"
ART_DIRECTION_PATH = ROOT / "docs" / "monster_sprite_art_direction.md"
IMAGEGEN_DIR = Path.home() / ".codex" / "skills" / ".system" / "imagegen"
IMAGEGEN_CLI = IMAGEGEN_DIR / "scripts" / "image_gen.py"
REMOVE_KEY = IMAGEGEN_DIR / "scripts" / "remove_chroma_key.py"
NORMALIZER = ROOT / "tools" / "normalize_image2_atlas.py"
IMPORTER = ROOT / "tools" / "import_monster_atlas.py"
REFERENCE = MONSTER_DIR / "canyon_wolf.png"
OUTPUT_DIR = ROOT / "output" / "imagegen" / "monster-sprites"
TEMP_DIR = ROOT / "tmp" / "imagegen" / "monster-sprites"


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ids", nargs="+", help="Only generate these monster IDs")
    parser.add_argument("--limit", type=int, help="Limit this run to the first N missing IDs")
    parser.add_argument("--concurrency", type=int, default=3)
    parser.add_argument("--quality", choices=("low", "medium", "high", "auto"), default="medium")
    parser.add_argument("--force", action="store_true", help="Regenerate existing intermediate images")
    return parser.parse_args()


def monster_ids():
    source = (ROOT / "src" / "bestiary.ts").read_text(encoding="utf-8")
    section = re.search(
        r"export const MONSTERS: MonsterDef\[\] = \[([\s\S]*?)\n\];", source
    )
    if not section:
        raise RuntimeError("Could not find MONSTERS in src/bestiary.ts")
    return re.findall(r'\bid:\s*"([^"]+)"', section.group(1))


def descriptions():
    source = ART_DIRECTION_PATH.read_text(encoding="utf-8")
    result = {}
    for line in source.splitlines():
        match = re.match(r"\s*-\s+`?([a-z0-9_]+)`?\s+—\s+(.*)$", line)
        if match:
            result[match.group(1)] = match.group(2).strip()
    return result


def image_prompt(monster_id, description):
    return (
        "Edit the supplied reference game sprite atlas. Replace every wolf with "
        f"one consistent monster design for {monster_id}: {description}. "
        "Preserve the reference's outlined illustrated fantasy game-sprite style: "
        "confident dark contour, clean interior ink lines, compact readable shapes, "
        "layered color and restrained cel shading. Preserve the atlas composition "
        "with four horizontal direction rows in this order: south, west, north, east. "
        "Keep one character centered in each evenly spaced frame, with consistent "
        "scale and aligned feet across each row. Use a simple readable idle pose, "
        "distinct walk poses, then clear attacks appropriate to this monster. "
        "Keep every pose fully inside its frame. Fill all background pixels with a "
        "perfectly flat pure green #00FF00 for later alpha removal; no green spill, "
        "shadows, halos, scenery, text, border, or grid lines."
    )


def paths_for(monster_id):
    return (
        OUTPUT_DIR / f"{monster_id}-gpt-image-2.png",
        TEMP_DIR / f"{monster_id}-alpha.png",
        TEMP_DIR / f"{monster_id}-normalized.png",
    )


def run_command(args, env, label):
    result = subprocess.run(args, cwd=ROOT, env=env, text=True, capture_output=True)
    if result.returncode:
        details = (result.stdout + "\n" + result.stderr).strip()
        raise RuntimeError(f"{label} failed (exit {result.returncode}):\n{details}")
    return result.stdout.strip()


def prepare_one(monster_id, description, args, env):
    raw_path, alpha_path, normalized_path = paths_for(monster_id)
    raw_path.parent.mkdir(parents=True, exist_ok=True)
    alpha_path.parent.mkdir(parents=True, exist_ok=True)

    if args.force or not raw_path.exists():
        run_command(
            [
                sys.executable,
                str(IMAGEGEN_CLI),
                "edit",
                "--model",
                "gpt-image-2",
                "--image",
                str(REFERENCE),
                "--prompt",
                image_prompt(monster_id, description),
                "--size",
                "1536x1024",
                "--quality",
                args.quality,
                "--output-format",
                "png",
                "--out",
                str(raw_path),
                "--force",
            ],
            env,
            f"Image generation for {monster_id}",
        )

    if args.force or not alpha_path.exists():
        run_command(
            [
                sys.executable,
                str(REMOVE_KEY),
                "--input",
                str(raw_path),
                "--out",
                str(alpha_path),
                "--auto-key",
                "corners",
                "--soft-matte",
                "--transparent-threshold",
                "12",
                "--opaque-threshold",
                "48",
                "--despill",
                "--force",
            ],
            env,
            f"Background removal for {monster_id}",
        )

    if args.force or not normalized_path.exists():
        run_command(
            [
                sys.executable,
                str(NORMALIZER),
                str(alpha_path),
                str(normalized_path),
                "--force",
            ],
            env,
            f"Atlas normalization for {monster_id}",
        )

    return monster_id, normalized_path


def main():
    args = parse_args()
    if args.concurrency < 1 or args.concurrency > 8:
        raise SystemExit("--concurrency must be between 1 and 8")
    if args.limit is not None and args.limit < 1:
        raise SystemExit("--limit must be at least 1")

    key_path = ROOT / "key.txt"
    if not key_path.is_file():
        raise SystemExit("Missing repository-root key.txt")
    api_key = key_path.read_text(encoding="utf-8").strip()
    if not api_key:
        raise SystemExit("key.txt is empty")

    for required in (IMAGEGEN_CLI, REMOVE_KEY, NORMALIZER, IMPORTER, REFERENCE):
        if not required.is_file():
            raise SystemExit(f"Required file is missing: {required}")

    env = os.environ.copy()
    env["OPENAI_API_KEY"] = api_key
    for proxy_name in (
        "HTTP_PROXY",
        "HTTPS_PROXY",
        "ALL_PROXY",
        "http_proxy",
        "https_proxy",
        "all_proxy",
    ):
        env.pop(proxy_name, None)

    ids = monster_ids()
    prompts = descriptions()
    index = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    missing = [
        monster_id
        for monster_id in ids
        if not (
            monster_id in index
            and (MONSTER_DIR / f"{monster_id}.png").is_file()
        )
    ]

    if args.ids:
        requested = set(args.ids)
        unknown = requested.difference(ids)
        if unknown:
            raise SystemExit(f"Unknown monster IDs: {', '.join(sorted(unknown))}")
        missing = [monster_id for monster_id in missing if monster_id in requested]
    if args.limit is not None:
        missing = missing[: args.limit]
    if not missing:
        print("No missing monster sheets selected.")
        return

    undescribed = [monster_id for monster_id in missing if monster_id not in prompts]
    if undescribed:
        raise SystemExit(
            "Art direction is missing for: " + ", ".join(undescribed)
        )

    print(f"Preparing {len(missing)} monster sheets with gpt-image-2")
    ready = []
    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        future_ids = {
            pool.submit(prepare_one, monster_id, prompts[monster_id], args, env): monster_id
            for monster_id in missing
        }
        for future in concurrent.futures.as_completed(future_ids):
            monster_id = future_ids[future]
            try:
                ready.append(future.result())
                print(f"Prepared {monster_id}")
            except Exception as error:  # retain successful outputs for import below
                failures.append((monster_id, str(error)))
                print(f"FAILED {monster_id}: {error}", file=sys.stderr)

    for monster_id, normalized_path in sorted(ready):
        run_command(
            [
                sys.executable,
                str(IMPORTER),
                monster_id,
                str(normalized_path),
                "--cell",
                "128",
            ],
            env,
            f"Sprite registration for {monster_id}",
        )
        print(f"Registered {monster_id}")

    if failures:
        raise SystemExit(
            f"{len(failures)} generation job(s) failed; successful sheets were imported."
        )


if __name__ == "__main__":
    main()

#!/usr/bin/env python3

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
CHEESES_TXT = ROOT / "public" / "cheeses.txt"
CHEESE_IMAGES_DIR = ROOT / "public" / "cheese"
METADATA_JSONL = ROOT / "public" / "metadata.jsonl"
OUTPUT_JSON = ROOT / "src" / "db" / "cheeses.json"


def load_cheese_names() -> set[str]:
    return {
        line.strip()
        for line in CHEESES_TXT.read_text(encoding="utf-8").splitlines()
        if line.strip()
    }


def load_metadata_by_basename() -> dict[str, dict]:
    metadata_by_basename: dict[str, dict] = {}

    for line_number, line in enumerate(
        METADATA_JSONL.read_text(encoding="utf-8").splitlines(),
        start=1,
    ):
        if not line.strip():
            continue

        record = json.loads(line)
        basename = Path(record["file_path"]).name

        if basename in metadata_by_basename:
            raise ValueError(
                f"Duplicate metadata entry for image {basename!r} on line {line_number}"
            )

        metadata_by_basename[basename] = record

    return metadata_by_basename


def build_cheese_index() -> dict[str, dict[str, str]]:
    cheeses = load_cheese_names()
    metadata_by_basename = load_metadata_by_basename()
    cheese_index: dict[str, dict[str, str]] = {}

    for image_path in sorted(CHEESE_IMAGES_DIR.iterdir(), key=lambda path: path.name.lower()):
        if not image_path.is_file():
            continue

        metadata = metadata_by_basename.get(image_path.name)
        if metadata is None:
            raise ValueError(f"Missing metadata for image {image_path.name!r}")

        cheese_name = metadata["label"]
        if cheese_name not in cheeses:
            raise ValueError(
                f"Metadata label {cheese_name!r} is not present in {CHEESES_TXT}"
            )

        if cheese_name in cheese_index:
            raise ValueError(f"Duplicate selected image for cheese {cheese_name!r}")

        cheese_index[cheese_name] = {
            "image": f"public/cheese/{image_path.name}",
            "source": metadata["url"],
            "license": metadata["license"],
        }

    return dict(sorted(cheese_index.items()))


def main() -> None:
    cheese_index = build_cheese_index()
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON.write_text(
        json.dumps(cheese_index, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(cheese_index)} cheeses to {OUTPUT_JSON}")


if __name__ == "__main__":
    main()

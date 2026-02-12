#!/usr/bin/env python3
import csv
import json
from datetime import datetime


def load_french_labels(path: str) -> dict[str, str]:
    mapping: dict[str, str] = {}
    with open(path, "r", encoding="utf-8") as f:
        for lineno, raw_line in enumerate(f, start=1):
            line = raw_line.strip()
            if not line:
                continue
            if "_" not in line:
                continue
            sci_name, fr_name = line.split("_", 1)
            sci_name = sci_name.strip()
            fr_name = fr_name.strip()
            if sci_name:
                mapping[sci_name] = fr_name
    return mapping


def convert_birddb_to_records(birddb_path: str, labels: dict[str, str]) -> list[dict]:
    records: list[dict] = []

    with open(birddb_path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")

        for row in reader:
            date_str = (row.get("Date") or "").strip()
            time_str = (row.get("Time") or "").strip()
            sci_name = (row.get("Sci_Name") or "").strip()
            confidence_str = (row.get("Confidence") or "").strip()

            if not (date_str and time_str and sci_name and confidence_str):
                continue

            try:
                dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M:%S")
            except ValueError:
                continue

            try:
                confidence = float(confidence_str)
            except ValueError:
                continue

            french_name = labels.get(sci_name, "")

            records.append(
                {
                    "datetime": dt.isoformat(),
                    "sci_name": sci_name,
                    "com_name": french_name,
                    "confidence": confidence,
                }
            )

    return records


def main() -> None:
    labels = load_french_labels("labels.txt")
    records = convert_birddb_to_records("BirdDB.txt", labels)
    print(json.dumps(records, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

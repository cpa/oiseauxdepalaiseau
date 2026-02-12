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
            if not (date_str and time_str and sci_name):
                continue

            try:
                dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M:%S")
            except ValueError:
                continue

            french_name = labels.get(sci_name, "")

            records.append(
                {
                    "dt": dt,
                    "sci_name": sci_name,
                    "com_name": french_name,
                }
            )

    records.sort(key=lambda item: item["dt"], reverse=True)

    grouped: list[dict] = []
    for row in records:
        last = grouped[-1] if grouped else None
        if last and last["sci_name"] == row["sci_name"]:
            last["datetime_end"] = row["dt"].isoformat()
            continue

        grouped.append(
            {
                "datetime_start": row["dt"].isoformat(),
                "datetime_end": row["dt"].isoformat(),
                "sci_name": row["sci_name"],
                "com_name": row["com_name"],
            }
        )

    return grouped


def main() -> None:
    labels = load_french_labels("labels.txt")
    records = convert_birddb_to_records("BirdDB.txt", labels)
    print(json.dumps(records, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

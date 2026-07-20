#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Yuvarlama batch: id öneki ve eksik soru metni düzeltmeleri."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "yuvarlama-gemini-raw.json"
PREFIX = "mat3_yuvarlama_"

FIXES: dict[str, dict] = {
    "mat3_yuvarlama_079": {
        "text": "Buna göre A yerine yazılabilecek kaç farklı rakam vardır?",
    },
}


def rename_id(old: str) -> str:
    m = re.match(r"mat3_(\d+)$", old)
    if not m:
        return old
    return f"{PREFIX}{int(m.group(1)):03d}"


def main() -> int:
    data = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    for q in data:
        q["id"] = rename_id(q["id"])
    by_id = {q["id"]: i for i, q in enumerate(data)}
    for qid, patch in FIXES.items():
        if qid not in by_id:
            raise SystemExit(f"Bulunamadi: {qid}")
        data[by_id[qid]].update(patch)

    RAW_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Guncellendi: {len(data)} soru, id on eki {PREFIX}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

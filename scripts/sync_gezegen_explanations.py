#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gezegen-gemini-raw.json içindeki açıklamaları v2 sürümüyle günceller."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "gezegen-gemini-raw.json"
EXPL = ROOT / "data" / "gezegen-explanations-v2.json"


def main() -> int:
    expl = json.loads(EXPL.read_text(encoding="utf-8"))
    qs = json.loads(RAW.read_text(encoding="utf-8"))
    updated = 0
    for q in qs:
        qid = q.get("id")
        if qid in expl:
            q["explanation"] = expl[qid]
            updated += 1
    RAW.write_text(json.dumps(qs, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Güncellendi: {updated}/{len(qs)} açıklama -> {RAW}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

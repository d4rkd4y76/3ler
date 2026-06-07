#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""dllwrld.json slug topic anahtarlarını t03–t08 olarak düzeltir."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from s3_turkce_topics import TOPICS

DLLWRLD = ROOT / "dllwrld.json"


def main() -> int:
    data = json.loads(DLLWRLD.read_text(encoding="utf-8"))
    topics = data["championData"]["headings"]["SINIF3"]["lessons"]["lesson_turkce"]["topics"]

    for cfg in TOPICS:
        tid = cfg["id"]
        slug = cfg["slug"]
        if slug in topics and tid not in topics:
            topics[tid] = topics.pop(slug)
            print(f"Taşındı: {slug} -> {tid}")
        elif slug in topics and tid in topics:
            # slug sil, t id kalsın
            topics.pop(slug)
            print(f"Silindi (duplicate slug): {slug}")
        if tid in topics:
            topics[tid]["name"] = cfg["title"]
            topics[tid]["order"] = int(tid[1:])
            topics[tid]["active"] = True

    DLLWRLD.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("dllwrld.json güncellendi.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

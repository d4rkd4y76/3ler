#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Türkçe yazım ve karakter denetimi — soru paketlerinde hatalı i/ı, şik vb."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

# de_shout bozulmasından kalan bilinen hatalar
BAD_PATTERNS: list[tuple[str, str, re.Pattern[str]]] = [
    ("yaklaşik", "yaklaşık", re.compile(r"Yaklaşik|yaklaşik")),
    ("koklamamaliyiz", "koklamamalıyız", re.compile(r"Koklamamaliyiz|koklamamaliyiz")),
    ("alamayiz", "alamayız", re.compile(r"Alamayiz|alamayiz")),
    ("dokerken", "dolaşırken", re.compile(r"dokerken", re.I)),
    ("shout_caps", "BÜYÜK HARF", re.compile(r"\b[A-ZÇĞİÖŞÜ]{4,}\b")),
]

FIELDS = ("text", "premise", "correct", "wrong1", "wrong2", "explanation")


def audit_file(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    qs = data.get("questions") if isinstance(data, dict) else data
    if not isinstance(qs, list):
        return []
    hits: list[dict] = []
    for q in qs:
        qid = q.get("id", "?")
        for field in FIELDS:
            val = q.get(field)
            if not val:
                continue
            s = str(val)
            for label, fix, pat in BAD_PATTERNS:
                m = pat.search(s)
                if not m:
                    continue
                if label == "shout_caps" and re.fullmatch(r"[IVXLCDM]+", m.group(0)):
                    continue
                hits.append(
                    {
                        "file": path.name,
                        "id": qid,
                        "field": field,
                        "issue": label,
                        "suggest": fix,
                        "snippet": s[max(0, m.start() - 20) : m.end() + 20],
                    }
                )
                break
    return hits


def main() -> int:
    paths = [Path(p) for p in sys.argv[1:]] if len(sys.argv) > 1 else sorted((ROOT / "data").glob("*-s3-150.json"))
    total = 0
    for path in paths:
        if not path.is_file():
            continue
        hits = audit_file(path)
        if hits:
            print(f"\n=== {path.name} ({len(hits)} sorun) ===")
            for h in hits[:15]:
                print(f"  {h['id']} [{h['field']}] {h['issue']}: ...{h['snippet']}...")
            if len(hits) > 15:
                print(f"  ... +{len(hits) - 15} daha")
            total += len(hits)
    if total == 0:
        print("OK: Bilinen Türkçe yazım hatası bulunamadı.")
        return 0
    print(f"\nTOPLAM: {total} sorun")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

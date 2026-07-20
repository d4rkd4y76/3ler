#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""3. sınıf Matematik paketlerinde kalite denetimi."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from s3_matematik_topics import TOPICS

YUKARI_RE = re.compile(r"Yukarıdaki", re.I)
SHOUT_RE = re.compile(r"\b[A-ZÇĞİÖŞÜ]{3,}\b")
ROMAN_RE = re.compile(r"^[IVXLCDM]+$")
SPOILER_RE = re.compile(
    r"\[\[(?:geo|sekil|cisim|shape|solid|fracbar|frac)[^\]]*\]\]", re.I
)


def audit_topic(topic_id: str, data_file: str) -> dict:
    path = ROOT / "data" / data_file
    if not path.is_file():
        return {"topic": topic_id, "missing": True}
    pack = json.loads(path.read_text(encoding="utf-8"))
    qs = pack.get("questions") or pack
    stats = {
        "topic": topic_id,
        "count": len(qs),
        "yukari": 0,
        "shout": 0,
        "premise_spoiler": 0,
        "no_buna_gore": 0,
        "samples": [],
    }
    for q in qs:
        qid = q.get("id", "?")
        prem = (q.get("premise") or "").strip()
        text = (q.get("text") or "").strip()
        expl = (q.get("explanation") or "").strip()
        combined = " ".join(filter(None, [prem, text, expl]))

        if YUKARI_RE.search(combined):
            stats["yukari"] += 1
            if len(stats["samples"]) < 3:
                stats["samples"].append(f"{qid}: yukari in text/expl")

        for field in (text, prem, expl, q.get("correct"), q.get("wrong1"), q.get("wrong2")):
            if not field:
                continue
            m = SHOUT_RE.search(str(field))
            if m and not ROMAN_RE.match(m.group(0)):
                stats["shout"] += 1
                if len(stats["samples"]) < 5:
                    stats["samples"].append(f"{qid}: CAPS '{m.group(0)}'")
                break

        if prem and SPOILER_RE.search(prem):
            stats["premise_spoiler"] += 1
            if len(stats["samples"]) < 6:
                stats["samples"].append(f"{qid}: spoiler in premise")

        if prem and text and not text.lower().startswith("buna göre"):
            stats["no_buna_gore"] += 1
            if len(stats["samples"]) < 8:
                stats["samples"].append(f"{qid}: no Buna göre -> {text[:60]}...")

    return stats


def main() -> int:
    topic_ids = sys.argv[1:] if len(sys.argv) > 1 else [t["id"] for t in TOPICS[:13]]
    total = {"yukari": 0, "shout": 0, "premise_spoiler": 0, "no_buna_gore": 0, "count": 0}
    for tid in topic_ids:
        cfg = next(t for t in TOPICS if t["id"] == tid)
        s = audit_topic(tid, cfg["data_file"])
        if s.get("missing"):
            print(f"{tid}: DOSYA YOK — {cfg['data_file']}")
            continue
        total["count"] += s["count"]
        for k in ("yukari", "shout", "premise_spoiler", "no_buna_gore"):
            total[k] += s[k]
        print(
            f"{tid}: {s['count']} soru | yukari={s['yukari']} shout={s['shout']} "
            f"spoiler={s['premise_spoiler']} no_buna={s['no_buna_gore']}"
        )
        for sample in s.get("samples", []):
            print(f"  - {sample}")

    print("--- TOPLAM ---")
    print(
        f"{total['count']} soru | yukari={total['yukari']} shout={total['shout']} "
        f"spoiler={total['premise_spoiler']} no_buna={total['no_buna_gore']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

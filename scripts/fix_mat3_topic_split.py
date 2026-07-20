#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Para/Tartma konu ayrımı: t12'deki yanlış tartma verisini temizler, t12-t14 adlarını düzeltir."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

from s3_matematik_topics import TOPICS, HEADING_ID, LESSON_ID

DLLWRLD_PATH = ROOT / "dllwrld.json"
PROJECT = "dllwrld-e5419"


def firebase_cmd() -> list[str]:
    npm = Path.home() / "AppData" / "Roaming" / "npm" / "firebase.cmd"
    return [str(npm)] if npm.is_file() else ["firebase"]


def push_topic(topic_id: str, name: str, order: int, questions: dict | None = None) -> None:
    topic_base = f"championData/headings/{HEADING_ID}/lessons/{LESSON_ID}/topics/{topic_id}"
    qs = questions or {}
    payload = {
        "name": name,
        "order": order,
        "active": True,
        "questions": qs,
        "questionIds": {k: True for k in qs},
    }
    tmp = ROOT / "dist" / f"_fix_{topic_id}.json"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    tmp.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    subprocess.run(
        firebase_cmd()
        + ["database:update", "/" + topic_base, str(tmp), "--project", PROJECT, "--force"],
        check=True,
        cwd=str(ROOT),
    )
    print(f"Firebase {topic_id}: {name} ({len(qs)} soru)")


def main() -> int:
    topics_by_id = {t["id"]: t for t in TOPICS}

    with open(DLLWRLD_PATH, encoding="utf-8") as f:
        data = json.load(f)

    mat = data["championData"]["headings"][HEADING_ID]["lessons"][LESSON_ID]["topics"]

    # Eski t13 (Veri) içeriğini koru
    old_veri = mat.get("t13", {"questions": {}, "questionIds": {}})

    for tid in ("t12", "t13"):
        cfg = topics_by_id.get(tid)
        if not cfg:
            continue
        mat[tid] = {
            "active": True,
            "name": cfg["name"],
            "order": cfg["order"],
            "questions": {},
            "questionIds": {},
        }

    cfg14 = topics_by_id.get("t14")
    if cfg14:
        mat["t14"] = {
            "active": True,
            "name": cfg14["name"],
            "order": cfg14["order"],
            "questions": old_veri.get("questions", {}),
            "questionIds": old_veri.get("questionIds", {}),
        }

    with open(DLLWRLD_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    print("dllwrld.json güncellendi.")

    for tid in ("t12", "t13", "t14"):
        cfg = topics_by_id.get(tid)
        if cfg:
            push_topic(tid, cfg["name"], cfg["order"])

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

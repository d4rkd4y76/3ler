#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Matematik konu anahtarlarını slug → t01 biçimine taşır; yanlış slug düğümünü siler."""
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
OLD_SLUG = "topic_01_uc_basamakli_dogal_sayilar_okuma"


def firebase_cmd() -> list[str]:
    npm = Path.home() / "AppData" / "Roaming" / "npm" / "firebase.cmd"
    return [str(npm)] if npm.is_file() else ["firebase"]


def migrate_dllwrld() -> None:
    data = json.loads(DLLWRLD_PATH.read_text(encoding="utf-8"))
    lesson = data["championData"]["headings"][HEADING_ID]["lessons"][LESSON_ID]
    old_topics = lesson.get("topics") or {}

    slug_data = old_topics.pop(OLD_SLUG, None)
    new_topics: dict = {}
    for cfg in TOPICS:
        tid = cfg["id"]
        prev = old_topics.get(tid) or {}
        entry = {
            "name": cfg["name"],
            "active": True,
            "order": cfg["order"],
            "questions": prev.get("questions") or {},
            "questionIds": prev.get("questionIds") or {},
        }
        if tid == "t01" and slug_data:
            entry["questions"] = slug_data.get("questions") or entry["questions"]
            entry["questionIds"] = slug_data.get("questionIds") or entry["questionIds"]
        new_topics[tid] = entry

    lesson["topics"] = new_topics
    DLLWRLD_PATH.write_text(
        json.dumps(data, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"dllwrld: {OLD_SLUG} -> t01, {len(new_topics)} konu")


def remove_firebase_slug() -> None:
    path = (
        f"championData/headings/{HEADING_ID}/lessons/{LESSON_ID}/topics/{OLD_SLUG}"
    )
    subprocess.run(
        firebase_cmd() + ["database:remove", "/" + path, "--project", PROJECT, "--force"],
        check=True,
        cwd=str(ROOT),
    )
    print(f"Firebase: silindi {OLD_SLUG}")


def main() -> int:
    migrate_dllwrld()
    remove_firebase_slug()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

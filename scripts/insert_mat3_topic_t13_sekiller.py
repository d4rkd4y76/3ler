#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Geometri (t12) sonrasına t13 Geometrik Şekil ve Cisimler ekler; t13→t14, t14→t15 kaydırır."""
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


def topic_cfg(tid: str) -> dict:
    for t in TOPICS:
        if t["id"] == tid:
            return t
    raise KeyError(tid)


def push_meta(tid: str) -> None:
    cfg = topic_cfg(tid)
    qs = {}
    if DLLWRLD_PATH.is_file():
        data = json.loads(DLLWRLD_PATH.read_text(encoding="utf-8"))
        node = (
            data.get("championData", {})
            .get("headings", {})
            .get(HEADING_ID, {})
            .get("lessons", {})
            .get(LESSON_ID, {})
            .get("topics", {})
            .get(tid, {})
        )
        qs = node.get("questions") or {}
    payload = {
        "name": cfg["name"],
        "order": cfg["order"],
        "active": True,
        "questions": qs,
        "questionIds": {k: True for k in qs},
    }
    tmp = ROOT / "dist" / f"_migrate_{tid}.json"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    tmp.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    base = f"championData/headings/{HEADING_ID}/lessons/{LESSON_ID}/topics/{tid}"
    subprocess.run(
        firebase_cmd()
        + ["database:update", "/" + base, str(tmp), "--project", PROJECT, "--force"],
        check=True,
        cwd=str(ROOT),
    )
    print(f"Firebase {tid}: {cfg['name']} ({len(qs)} soru)")


def main() -> int:
    topics_by_id = {t["id"]: t for t in TOPICS}

    with open(DLLWRLD_PATH, encoding="utf-8") as f:
        data = json.load(f)

    mat = data["championData"]["headings"][HEADING_ID]["lessons"][LESSON_ID]["topics"]

    old_t13 = mat.pop("t13", {"questions": {}, "questionIds": {}, "active": True})
    old_t14 = mat.pop("t14", {"questions": {}, "questionIds": {}, "active": True})

    cfg13 = topics_by_id["t13"]
    cfg14 = topics_by_id["t14"]
    cfg15 = topics_by_id["t15"]

    mat["t13"] = {
        "active": True,
        "name": cfg13["name"],
        "order": cfg13["order"],
        "questions": {},
        "questionIds": {},
    }
    mat["t14"] = {
        "active": True,
        "name": cfg14["name"],
        "order": cfg14["order"],
        "questions": old_t13.get("questions") or {},
        "questionIds": old_t13.get("questionIds") or {},
    }
    mat["t15"] = {
        "active": True,
        "name": cfg15["name"],
        "order": cfg15["order"],
        "questions": old_t14.get("questions") or {},
        "questionIds": old_t14.get("questionIds") or {},
    }

    # t12 adı/sırası güncel kalsın
    cfg12 = topics_by_id.get("t12")
    if cfg12 and "t12" in mat:
        mat["t12"]["name"] = cfg12["name"]
        mat["t12"]["order"] = cfg12["order"]
        mat["t12"]["active"] = True

    with open(DLLWRLD_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    print("dllwrld.json: t13 Geometrik Şekil ve Cisimler eklendi; t14 Çevre; t15 Veri.")

    for tid in ("t13", "t14", "t15"):
        try:
            push_meta(tid)
        except subprocess.CalledProcessError as e:
            print(f"Firebase uyarı ({tid}): {e}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

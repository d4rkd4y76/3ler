#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tek bir 3. sınıf Türkçe konusunu Firebase + Bunny'ye yükler (t03–t08)."""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

from question_build_common import to_app_payload
from s3_turkce_topics import TOPICS, get_topic

CDN_ADMIN = ROOT / "cdn-admin.local.json"
DATA_DIR = ROOT / "data"
PROJECT = "dllwrld-e5419"
HEADING = "SINIF3"
LESSON = "lesson_turkce"

REGION_HOST = {
    "de": "storage.bunnycdn.com",
    "ny": "ny.storage.bunnycdn.com",
    "la": "la.storage.bunnycdn.com",
    "sg": "sg.storage.bunnycdn.com",
    "syd": "syd.storage.bunnycdn.com",
}


def firebase_cmd() -> list[str]:
    npm = Path.home() / "AppData" / "Roaming" / "npm" / "firebase.cmd"
    return [str(npm)] if npm.is_file() else ["firebase"]


def load_cdn_admin() -> dict:
    return json.loads(CDN_ADMIN.read_text(encoding="utf-8"))


def load_questions(cfg: dict) -> list[dict]:
    path = DATA_DIR / cfg["data_file"]
    pack = json.loads(path.read_text(encoding="utf-8"))
    return pack["questions"]


def bunny_put(host, zone, api_key, rpath, body):
    url = f"https://{host}/{quote(zone, safe='')}/" + "/".join(quote(p, safe="") for p in rpath.split("/"))
    req = urllib.request.Request(url, data=body, method="PUT")
    req.add_header("AccessKey", api_key)
    req.add_header("Content-Type", "application/json; charset=utf-8")
    with urllib.request.urlopen(req, timeout=120):
        pass


def push_one(cfg: dict) -> None:
    topic = cfg["id"]
    topic_base = f"championData/headings/{HEADING}/lessons/{LESSON}/topics/{topic}"
    questions = load_questions(cfg)
    payload = {
        "questions": {q["id"]: (q.get("app") or to_app_payload(q)) for q in questions},
        "questionIds": {q["id"]: True for q in questions},
        "active": True,
    }

    tmp = ROOT / "dist" / f"_push_{topic}.json"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    tmp.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    subprocess.run(
        firebase_cmd()
        + ["database:update", "/" + topic_base, str(tmp), "--project", PROJECT, "--force"],
        check=True,
        cwd=str(ROOT),
    )
    print(f"Firebase: {topic} ({len(questions)} soru)")

    cdn = load_cdn_admin()
    zone = cdn["storageZone"]
    api_key = cdn["storageApiKey"]
    version = int(cdn.get("version") or 1)
    host = REGION_HOST.get(str(cdn.get("region") or "de"), REGION_HOST["de"])

    for q in questions:
        app = q.get("app") or to_app_payload(q)
        body = json.dumps(app, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        bunny_put(host, zone, api_key, f"v{version}/rtdb/{topic_base}/questions/{q['id']}.json", body)

    idx = json.dumps(payload["questionIds"], ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    bunny_put(host, zone, api_key, f"v{version}/rtdb/{topic_base}/questionIds.json", idx)
    bunny_put(host, zone, api_key, f"v{version}/rtdb/{topic_base}/active.json", b"true")
    print(f"Bunny: {topic} tamam.")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("topic", nargs="?", help="t03..t08 veya 'all'")
    args = ap.parse_args()

    targets = TOPICS if (not args.topic or args.topic == "all") else [get_topic(args.topic)]
    for cfg in targets:
        push_one(cfg)
    print("Tüm hedefler yüklendi.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kelime Dağarcığı 150 soruyu Firebase RTDB + Bunny CDN'e yükler."""
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

CDN_ADMIN = ROOT / "cdn-admin.local.json"
DATA_JSON = ROOT / "data" / "kelime-dagarcigi-s3-150.json"

HEADING = "SINIF3"
LESSON = "lesson_turkce"
TOPIC = "t02"
PROJECT = "dllwrld-e5419"
TOPIC_BASE = f"championData/headings/{HEADING}/lessons/{LESSON}/topics/{TOPIC}"
FIREBASE_TOPIC_PATH = "/" + TOPIC_BASE

REGION_HOST = {
    "de": "storage.bunnycdn.com",
    "ny": "ny.storage.bunnycdn.com",
    "la": "la.storage.bunnycdn.com",
    "sg": "sg.storage.bunnycdn.com",
    "syd": "syd.storage.bunnycdn.com",
}


def load_cdn_admin() -> dict:
    if not CDN_ADMIN.is_file():
        raise SystemExit(f"cdn-admin.local.json bulunamadı: {CDN_ADMIN}")
    return json.loads(CDN_ADMIN.read_text(encoding="utf-8"))


def load_questions() -> list[dict]:
    if not DATA_JSON.is_file():
        raise SystemExit(f"Önce build çalıştırın: {DATA_JSON}")
    pack = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    return pack["questions"]


def firebase_cmd() -> list[str]:
    npm = Path.home() / "AppData" / "Roaming" / "npm" / "firebase.cmd"
    return [str(npm)] if npm.is_file() else ["firebase"]


def push_firebase(payload: dict) -> None:
    tmp = ROOT / "dist" / "_push_kelime_dagarcigi_topic.json"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    tmp.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    cmd = firebase_cmd() + [
        "database:update",
        FIREBASE_TOPIC_PATH,
        str(tmp),
        "--project",
        PROJECT,
        "--force",
    ]
    print("Firebase:", " ".join(cmd))
    subprocess.run(cmd, check=True, cwd=str(ROOT))


def bunny_put(host: str, zone: str, api_key: str, rpath: str, body: bytes) -> None:
    zone_q = quote(zone, safe="")
    url = f"https://{host}/{zone_q}/" + "/".join(quote(p, safe="") for p in rpath.split("/"))
    req = urllib.request.Request(url, data=body, method="PUT")
    req.add_header("AccessKey", api_key)
    req.add_header("Content-Type", "application/json; charset=utf-8")
    with urllib.request.urlopen(req, timeout=120):
        pass


def push_bunny(questions: list[dict], cfg: dict) -> None:
    zone = cfg["storageZone"]
    api_key = cfg["storageApiKey"]
    region = str(cfg.get("region") or "de")
    version = int(cfg.get("version") or 1)
    host = REGION_HOST.get(region, "storage.bunnycdn.com")

    question_ids = {}
    for q in questions:
        qid = q["id"]
        question_ids[qid] = True
        app = q.get("app") or to_app_payload(q)
        body = json.dumps(app, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        rpath = f"v{version}/rtdb/{TOPIC_BASE}/questions/{qid}.json"
        bunny_put(host, zone, api_key, rpath, body)
        print(f"Bunny: {rpath}")

    idx_body = json.dumps(question_ids, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    bunny_put(host, zone, api_key, f"v{version}/rtdb/{TOPIC_BASE}/questionIds.json", idx_body)
    print(f"Bunny: v{version}/rtdb/{TOPIC_BASE}/questionIds.json")

    active_body = json.dumps(True, separators=(",", ":")).encode("utf-8")
    bunny_put(host, zone, api_key, f"v{version}/rtdb/{TOPIC_BASE}/active.json", active_body)
    print(f"Bunny: v{version}/rtdb/{TOPIC_BASE}/active.json")
    print(f"Bunny: {len(questions)} soru + questionIds + active yüklendi (v{version}).")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    questions = load_questions()
    payload = {
        "questions": {q["id"]: (q.get("app") or to_app_payload(q)) for q in questions},
        "questionIds": {q["id"]: True for q in questions},
        "active": True,
    }

    if args.dry_run:
        print(f"Dry-run: {len(questions)} soru -> {TOPIC}")
        return 0

    push_firebase(payload)
    print("Firebase RTDB güncellendi.")
    push_bunny(questions, load_cdn_admin())
    print("Tamam: Firebase + Bunny senkron.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

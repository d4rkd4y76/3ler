#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Metin Türleri 150 soruyu canlı Firebase RTDB + Bunny CDN'e yükler.
GitHub gerekmez — yerel cdn-admin.local.json + Firebase CLI kullanır.

  python scripts/push-metin-turleri-live.py
  python scripts/push-metin-turleri-live.py --dry-run
"""
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
DLLWRLD = ROOT / "dllwrld.json"
CDN_ADMIN = ROOT / "cdn-admin.local.json"
DATA_JSON = ROOT / "data" / "metin-turleri-s3-150.json"

HEADING = "SINIF3"
LESSON = "lesson_turkce"
TOPIC = "t01"
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


def load_topic_payload() -> dict:
    if DATA_JSON.is_file():
        pack = json.loads(DATA_JSON.read_text(encoding="utf-8"))
        questions = {}
        question_ids = {}
        for it in pack.get("questions", []):
            qid = it["id"]
            app = it.get("app") or it
            questions[qid] = {
                "question": app.get("question")
                or {
                    "text": it["text"],
                    "info": it.get("premise"),
                    "infoBlocks": (
                        [{"type": "text", "content": it["premise"]}]
                        if it.get("premise")
                        else None
                    ),
                },
                "correct": app.get("correct") or it["correct"],
                "wrong1": app.get("wrong1") or it["wrong1"],
                "wrong2": app.get("wrong2") or it["wrong2"],
                "explanation": app.get("explanation") or it.get("explanation"),
                "url": None,
            }
            question_ids[qid] = True
        return {"questions": questions, "questionIds": question_ids, "active": True}

    data = json.loads(DLLWRLD.read_text(encoding="utf-8"))
    topic = (
        data["championData"]["headings"][HEADING]["lessons"][LESSON]["topics"][TOPIC]
    )
    return {
        "questions": topic.get("questions") or {},
        "questionIds": topic.get("questionIds") or {},
        "active": True,
    }


def bunny_put(host: str, zone: str, api_key: str, remote_path: str, body: bytes, ct: str) -> None:
    zone_q = quote(zone, safe="")
    parts = [p for p in remote_path.replace("\\", "/").split("/") if p]
    path_q = "/".join(quote(p, safe="") for p in parts)
    url = f"https://{host}/{zone_q}/{path_q}"
    req = urllib.request.Request(url, data=body, method="PUT")
    req.add_header("AccessKey", api_key)
    req.add_header("Content-Type", ct)
    with urllib.request.urlopen(req, timeout=120) as res:
        if res.status not in (200, 201):
            raise RuntimeError(f"Bunny PUT {res.status}: {remote_path}")


def firebase_cmd() -> list[str]:
    npm = Path.home() / "AppData" / "Roaming" / "npm" / "firebase.cmd"
    if npm.is_file():
        return [str(npm)]
    return ["firebase"]


def push_firebase(payload: dict, dry_run: bool) -> None:
    tmp = ROOT / "dist" / "_push_metin_turleri_topic.json"
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
    if dry_run:
        print(f"  (dry-run) {len(payload.get('questions', {}))} soru yazılacak")
        return
    subprocess.run(cmd, check=True, cwd=str(ROOT))
    print("Firebase RTDB güncellendi.")


def push_bunny(payload: dict, cfg: dict, dry_run: bool) -> None:
    zone = cfg.get("storageZone") or cfg.get("zone") or ""
    api_key = cfg.get("storageApiKey") or cfg.get("apiKey") or ""
    region = str(cfg.get("region") or "de")
    version = int(cfg.get("version") or 1)
    host = REGION_HOST.get(region, REGION_HOST["de"])
    if not zone or not api_key:
        raise SystemExit("cdn-admin.local.json içinde storageZone / storageApiKey gerekli")

    questions = payload.get("questions") or {}
    qids = payload.get("questionIds") or {}
    uploaded = 0

    for qid, qval in questions.items():
        rpath = f"v{version}/rtdb/{TOPIC_BASE}/questions/{qid}.json"
        body = json.dumps(qval, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        print(f"Bunny: {rpath}")
        if not dry_run:
            bunny_put(host, zone, api_key, rpath, body, "application/json; charset=utf-8")
        uploaded += 1

    idx_path = f"v{version}/rtdb/{TOPIC_BASE}/questionIds.json"
    idx_body = json.dumps(qids, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    print(f"Bunny: {idx_path}")
    if not dry_run:
        bunny_put(host, zone, api_key, idx_path, idx_body, "application/json; charset=utf-8")

    active_path = f"v{version}/rtdb/{TOPIC_BASE}/active.json"
    active_body = json.dumps(True, separators=(",", ":")).encode("utf-8")
    print(f"Bunny: {active_path}")
    if not dry_run:
        bunny_put(host, zone, api_key, active_path, active_body, "application/json; charset=utf-8")

    print(f"Bunny: {uploaded} soru + questionIds + active yüklendi (v{version}).")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--bunny-only", action="store_true")
    ap.add_argument("--firebase-only", action="store_true")
    args = ap.parse_args()

    payload = load_topic_payload()
    n = len(payload.get("questions") or {})
    if n != 150:
        print(f"Uyarı: {n} soru bulundu (150 bekleniyordu).", file=sys.stderr)

    cfg = load_cdn_admin()

    if not args.bunny_only:
        push_firebase(payload, args.dry_run)
    if not args.firebase_only:
        push_bunny(payload, cfg, args.dry_run)

    if args.dry_run:
        print("Dry-run tamam — canlı yükleme yapılmadı.")
    else:
        print("Tamam: Firebase + Bunny senkron.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

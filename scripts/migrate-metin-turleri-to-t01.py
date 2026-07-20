#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Yanlış slug konuya yüklenen 150 soruyu t01'e taşır, duplicate topic siler."""
from __future__ import annotations

import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
CDN_ADMIN = ROOT / "cdn-admin.local.json"
DATA_JSON = ROOT / "data" / "metin-turleri-s3-150.json"
PROJECT = "dllwrld-e5419"

HEADING = "SINIF3"
LESSON = "lesson_turkce"
CORRECT_TOPIC = "t01"
WRONG_TOPIC = "topic_01_metin_turleri_hik_ye_edici_metin"

CORRECT_BASE = f"championData/headings/{HEADING}/lessons/{LESSON}/topics/{CORRECT_TOPIC}"
WRONG_BASE = f"championData/headings/{HEADING}/lessons/{LESSON}/topics/{WRONG_TOPIC}"

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


def load_payload() -> dict:
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


def load_cdn_admin() -> dict:
    return json.loads(CDN_ADMIN.read_text(encoding="utf-8"))


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


def bunny_delete(host: str, zone: str, api_key: str, remote_path: str) -> None:
    zone_q = quote(zone, safe="")
    parts = [p for p in remote_path.replace("\\", "/").split("/") if p]
    path_q = "/".join(quote(p, safe="") for p in parts)
    url = f"https://{host}/{zone_q}/{path_q}"
    req = urllib.request.Request(url, method="DELETE")
    req.add_header("AccessKey", api_key)
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            pass
    except urllib.error.HTTPError as e:
        if e.code not in (404, 200, 201, 204):
            raise


def main() -> int:
    payload = load_payload()
    n = len(payload["questions"])
    print(f"{n} soru -> {CORRECT_TOPIC}")

    tmp = ROOT / "dist" / "_migrate_metin_turleri_t01.json"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    tmp.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    cmd = firebase_cmd() + [
        "database:update",
        "/" + CORRECT_BASE,
        str(tmp),
        "--project",
        PROJECT,
        "--force",
    ]
    subprocess.run(cmd, check=True, cwd=str(ROOT))
    print("Firebase: t01 güncellendi")

    rm_cmd = firebase_cmd() + [
        "database:remove",
        "/" + WRONG_BASE,
        "--project",
        PROJECT,
        "--force",
    ]
    subprocess.run(rm_cmd, check=True, cwd=str(ROOT))
    print(f"Firebase: {WRONG_TOPIC} silindi")

    cfg = load_cdn_admin()
    zone = cfg.get("storageZone") or ""
    api_key = cfg.get("storageApiKey") or ""
    region = str(cfg.get("region") or "de")
    version = int(cfg.get("version") or 1)
    host = REGION_HOST.get(region, REGION_HOST["de"])

    for qid, qval in payload["questions"].items():
        rpath = f"v{version}/rtdb/{CORRECT_BASE}/questions/{qid}.json"
        body = json.dumps(qval, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        bunny_put(host, zone, api_key, rpath, body, "application/json; charset=utf-8")

    idx_body = json.dumps(payload["questionIds"], ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    bunny_put(host, zone, api_key, f"v{version}/rtdb/{CORRECT_BASE}/questionIds.json", idx_body, "application/json; charset=utf-8")
    bunny_put(host, zone, api_key, f"v{version}/rtdb/{CORRECT_BASE}/active.json", b"true", "application/json; charset=utf-8")

    for qid in payload["questions"]:
        wrong_path = f"v{version}/rtdb/{WRONG_BASE}/questions/{qid}.json"
        bunny_delete(host, zone, api_key, wrong_path)
    for suffix in ("questionIds.json", "active.json"):
        bunny_delete(host, zone, api_key, f"v{version}/rtdb/{WRONG_BASE}/{suffix}")

    print(f"Bunny: {n} soru t01'e taşındı, slug topic CDN temizlendi")
    return 0


if __name__ == "__main__":
    sys.exit(main())

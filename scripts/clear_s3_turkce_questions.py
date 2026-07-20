#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""3. sınıf Türkçe konularını (t01–t08) korur; soruları Firebase, Bunny ve dllwrld.json'dan siler."""
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
DLLWRLD = ROOT / "dllwrld.json"
PROJECT = "dllwrld-e5419"
HEADING = "SINIF3"
LESSON = "lesson_turkce"
TOPICS = [f"t0{i}" for i in range(1, 9)]

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


def bunny_delete(host: str, zone: str, api_key: str, remote_path: str) -> None:
    zone_q = quote(zone, safe="")
    parts = [p for p in remote_path.replace("\\", "/").split("/") if p]
    path_q = "/".join(quote(p, safe="") for p in parts)
    url = f"https://{host}/{zone_q}/{path_q}"
    req = urllib.request.Request(url, method="DELETE")
    req.add_header("AccessKey", api_key)
    try:
        with urllib.request.urlopen(req, timeout=60):
            pass
    except urllib.error.HTTPError as e:
        if e.code not in (404, 200, 201, 204):
            raise


def bunny_put(host: str, zone: str, api_key: str, remote_path: str, body: bytes) -> None:
    zone_q = quote(zone, safe="")
    parts = [p for p in remote_path.replace("\\", "/").split("/") if p]
    path_q = "/".join(quote(p, safe="") for p in parts)
    url = f"https://{host}/{zone_q}/{path_q}"
    req = urllib.request.Request(url, data=body, method="PUT")
    req.add_header("AccessKey", api_key)
    req.add_header("Content-Type", "application/json; charset=utf-8")
    with urllib.request.urlopen(req, timeout=120):
        pass


def clear_topic_firebase(topic_base: str) -> None:
    payload = {"questions": {}, "questionIds": {}}
    tmp = ROOT / "dist" / f"_clear_{topic_base.split('/')[-1]}.json"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    tmp.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    subprocess.run(
        firebase_cmd()
        + ["database:update", "/" + topic_base, str(tmp), "--project", PROJECT, "--force"],
        check=True,
        cwd=str(ROOT),
    )


def clear_topic_bunny(
    host: str,
    zone: str,
    api_key: str,
    version: int,
    topic_base: str,
    question_ids: list[str],
) -> None:
    prefix = f"v{version}/rtdb/{topic_base}"
    for qid in question_ids:
        bunny_delete(host, zone, api_key, f"{prefix}/questions/{qid}.json")
    bunny_put(host, zone, api_key, f"{prefix}/questionIds.json", b"{}")
    bunny_put(host, zone, api_key, f"{prefix}/active.json", b"true")


def main() -> int:
    data = json.loads(DLLWRLD.read_text(encoding="utf-8"))
    topics = data["championData"]["headings"][HEADING]["lessons"][LESSON]["topics"]

    cdn = load_cdn_admin()
    zone = cdn["storageZone"]
    api_key = cdn["storageApiKey"]
    version = int(cdn.get("version") or 1)
    host = REGION_HOST.get(str(cdn.get("region") or "de"), REGION_HOST["de"])

    total_removed = 0
    for tid in TOPICS:
        if tid not in topics:
            print(f"Atlandı (yok): {tid}")
            continue
        topic = topics[tid]
        qids = list((topic.get("questions") or {}).keys())
        n = len(qids)
        topic["questions"] = {}
        topic["questionIds"] = {}
        total_removed += n

        topic_base = f"championData/headings/{HEADING}/lessons/{LESSON}/topics/{tid}"
        clear_topic_firebase(topic_base)
        clear_topic_bunny(host, zone, api_key, version, topic_base, qids)
        print(f"{tid}: {n} soru silindi (Firebase + Bunny)")

    DLLWRLD.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"dllwrld.json güncellendi. Toplam {total_removed} soru kaldırıldı; konular korundu.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

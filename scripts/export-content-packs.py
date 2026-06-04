#!/usr/bin/env python3
"""
Firebase RTDB yedeğinden (dllwrld.json) Bunny CDN paketleri üretir.

Çıktı: dist/cdn/v{version}/rtdb/{path}.json  (+ store/manifest.json)

Kullanım:
  python scripts/export-content-packs.py
  python scripts/export-content-packs.py --input dllwrld.json --version 2
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]

# Sadece statik içerik — canlı oyun durumu hariç
CONTENT_ROOTS = (
    "championData",
    "fillBlanks",
    "dailyPuzzles",
    "matchingGame",
    "classContent",
    "denemeQuestions",
    "store",
    "lessonVideoLookup",
)

SKIP_PREFIXES = (
    "classes/",
    "duels/",
    "matchmaking/",
    "duelQueue/",
    "loggedinPlayers/",
    "homeworks/",
    "homeworkResults/",
    "analytics/",
    "friendships/",
    "autoMatchCoordinator/",
    "adminPanelUsers/",
    "admin/",
)

SKIP_EXACT = frozenset({"platformMeta/cdn"})


def should_export_path(path: str) -> bool:
    if not path or path in SKIP_EXACT:
        return False
    for p in SKIP_PREFIXES:
        if path.startswith(p):
            return False
    if path.startswith("platformMeta/") and path not in (
        "platformMeta/hikayeVideo",
        "platformMeta/mainScreenBgVideo",
    ):
        return False
    for root in CONTENT_ROOTS:
        if path == root or path.startswith(root + "/"):
            return True
    return False


def write_json_file(out_dir: Path, rtdb_path: str, node: Any, stats: dict) -> None:
    rel = rtdb_path.replace("/", os.sep) + ".json"
    target = out_dir / "rtdb" / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", encoding="utf-8") as f:
        json.dump(node, f, ensure_ascii=False, separators=(",", ":"))
    stats["files"] += 1
    stats["bytes"] += target.stat().st_size


def walk_export(node: Any, prefix: str, out_dir: Path, stats: dict) -> None:
    """Her RTDB düğüm yoluna bir JSON (readValCached ile birebir)."""
    if prefix and should_export_path(prefix):
        write_json_file(out_dir, prefix, node, stats)

    if not isinstance(node, dict):
        return

    for key, child in node.items():
        if key.startswith("_"):
            continue
        child_path = f"{prefix}/{key}" if prefix else key
        walk_export(child, child_path, out_dir, stats)


def build_store_manifest(data: dict) -> dict:
    store = data.get("store") or {}
    return {
        "profilePhotosIndex": store.get("profilePhotosIndex") or {},
        "categoryMeta": store.get("categoryMeta") or {},
        "profilePhotos": store.get("profilePhotos") or {},
        "nameFrames": store.get("nameFrames") or {},
        "battleHeroes": store.get("battleHeroes") or {},
        "battleHeroLevelConfig": store.get("battleHeroLevelConfig") or {},
    }


def export_tree(data: dict, version: int, input_path: Path) -> Path:
    out_dir = ROOT / "dist" / "cdn" / f"v{version}"
    if out_dir.exists():
        import shutil

        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    stats = {"files": 0, "bytes": 0}

    for root in CONTENT_ROOTS:
        if root not in data:
            continue
        walk_export(data[root], root, out_dir, stats)

    # platformMeta/hikayeVideo (küçük pointer)
    pm = data.get("platformMeta") or {}
    for meta_key in ("hikayeVideo", "mainScreenBgVideo"):
        if pm.get(meta_key) is not None:
            p = out_dir / "rtdb" / "platformMeta" / f"{meta_key}.json"
            p.parent.mkdir(parents=True, exist_ok=True)
            with p.open("w", encoding="utf-8") as f:
                json.dump(pm[meta_key], f, ensure_ascii=False, separators=(",", ":"))
            stats["files"] += 1

    manifest = build_store_manifest(data)
    sm = out_dir / "store" / "manifest.json"
    sm.parent.mkdir(parents=True, exist_ok=True)
    with sm.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, separators=(",", ":"))
    stats["files"] += 1
    stats["bytes"] += sm.stat().st_size

    meta = {
        "version": version,
        "source": str(input_path.name),
        "files": stats["files"],
        "bytes": stats["bytes"],
        "cdnPathPattern": "/v{version}/rtdb/{rtdbPath}.json",
        "storeManifest": "/v{version}/store/manifest.json",
    }
    with (out_dir / "manifest.json").open("w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f"OK: {out_dir}")
    print(f"  files={stats['files']}  bytes={stats['bytes']:,}")
    return out_dir


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default=str(ROOT / "dllwrld.json"))
    ap.add_argument("--version", type=int, default=1)
    args = ap.parse_args()

    input_path = Path(args.input)
    if not input_path.is_file():
        print(f"Hata: {input_path} bulunamadı.", file=sys.stderr)
        return 1

    print(f"Okunuyor: {input_path} ({input_path.stat().st_size:,} byte)")
    with input_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    export_tree(data, args.version, input_path)
    print()
    print("Sonraki adım: python scripts/upload-bunny-storage.py --version", args.version)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

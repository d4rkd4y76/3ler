#!/usr/bin/env python3
"""
Ağır statik dosyaları Bunny Storage paketine kopyalar.

Çıktı: dist/cdn/v{version}/assets/{hero,assets,egg_open,video,...}

Kullanım:
  python scripts/export-static-assets.py
  python scripts/export-static-assets.py --version 1
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

COPY_DIRS = (
    "hero",
    "assets",
    "egg_open",
)

ROOT_MEDIA = (
    "duello-bg-loop.mp4",
    "ana_ekran_egg.mp4",
    "yeni_loading.mp4",
)

ALLOWED_EXT = frozenset(
    {
        ".webp",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".svg",
        ".mp4",
        ".webm",
        ".json",
        ".woff",
        ".woff2",
    }
)

SKIP_NAMES = frozenset({".gitkeep", "Thumbs.db", "desktop.ini"})


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def should_copy(path: Path) -> bool:
    if not path.is_file():
        return False
    if path.name in SKIP_NAMES:
        return False
    if path.suffix.lower() not in ALLOWED_EXT:
        return False
    if path.stat().st_size <= 0:
        return False
    return True


def copy_tree(src_rel: str, out_assets: Path, manifest: dict) -> None:
    src = ROOT / src_rel
    if not src.is_dir():
        print(f"  atlandı (klasör yok): {src_rel}")
        return
    for local in src.rglob("*"):
        if not should_copy(local):
            continue
        rel = local.relative_to(ROOT).as_posix()
        target = out_assets / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(local, target)
        size = target.stat().st_size
        manifest["files"].append(
            {
                "path": rel,
                "bytes": size,
                "sha256": file_sha256(target),
            }
        )
        manifest["bytes"] += size
        manifest["count"] += 1


def copy_root_media(out_assets: Path, manifest: dict) -> None:
    video_dir = out_assets / "video"
    for name in ROOT_MEDIA:
        src = ROOT / name
        if not src.is_file():
            continue
        target = video_dir / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, target)
        rel = target.relative_to(out_assets).as_posix()
        size = target.stat().st_size
        manifest["files"].append(
            {
                "path": "video/" + name,
                "bytes": size,
                "sha256": file_sha256(target),
                "source": name,
            }
        )
        manifest["bytes"] += size
        manifest["count"] += 1


def export_assets(version: int) -> Path:
    out_dir = ROOT / "dist" / "cdn" / f"v{version}"
    out_assets = out_dir / "assets"
    out_assets.mkdir(parents=True, exist_ok=True)

    manifest = {
        "version": version,
        "kind": "static-assets",
        "count": 0,
        "bytes": 0,
        "files": [],
        "cdnPathPattern": f"/v{version}/assets/{{relativePath}}",
    }

    for d in COPY_DIRS:
        copy_tree(d, out_assets, manifest)

    copy_root_media(out_assets, manifest)

    manifest["files"].sort(key=lambda x: x["path"])
    manifest_path = out_assets / "manifest.json"
    with manifest_path.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"OK: {out_assets}")
    print(f"  files={manifest['count']}  bytes={manifest['bytes']:,}")
    return out_assets


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", type=int, default=1)
    args = ap.parse_args()
    export_assets(args.version)
    print()
    print("Sonraki adım: Upload-BunnyCDN.ps1 -AssetsOnly -Version", args.version)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

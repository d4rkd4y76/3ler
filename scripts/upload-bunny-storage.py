#!/usr/bin/env python3
"""
dist/cdn/v{N} içeriğini Bunny Storage Zone'a yükler.

Gerekli ortam değişkenleri:
  BUNNY_STORAGE_ZONE     — Storage zone adı (ör. duellox-assets)
  BUNNY_STORAGE_API_KEY  — Storage zone Password (FTP/API şifresi)
  BUNNY_STORAGE_REGION   — opsiyonel: de | ny | la | sg | syd (varsayılan de)

Kullanım:
  set BUNNY_STORAGE_ZONE=duellox-assets
  set BUNNY_STORAGE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  python scripts/upload-bunny-storage.py --version 1
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from urllib.parse import quote

try:
    import urllib.error
    import urllib.request
except ImportError:
    pass


def safe_print(msg: str) -> None:
    """Windows konsolunda Türkçe yol adları için güvenli yazdırma."""
    try:
        print(msg)
    except UnicodeEncodeError:
        print(msg.encode("ascii", errors="replace").decode("ascii"))


def encode_storage_url(host: str, zone: str, remote_path: str) -> str:
    """Bunny Storage PUT URL — Türkçe/Unicode yol segmentlerini güvenli kodlar."""
    zone_q = quote(zone, safe="")
    parts = [p for p in remote_path.replace("\\", "/").split("/") if p]
    path_q = "/".join(quote(p, safe="") for p in parts)
    return f"https://{host}/{zone_q}/{path_q}"

ROOT = Path(__file__).resolve().parents[1]

REGION_HOST = {
    "": "storage.bunnycdn.com",
    "de": "storage.bunnycdn.com",
    "ny": "ny.storage.bunnycdn.com",
    "la": "la.storage.bunnycdn.com",
    "sg": "sg.storage.bunnycdn.com",
    "syd": "syd.storage.bunnycdn.com",
}


def upload_file(host: str, zone: str, api_key: str, remote_path: str, local_path: Path) -> None:
    url = encode_storage_url(host, zone, remote_path.lstrip("/"))
    data = local_path.read_bytes()
    req = urllib.request.Request(url, data=data, method="PUT")
    req.add_header("AccessKey", api_key)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            if resp.status not in (200, 201):
                raise RuntimeError(f"HTTP {resp.status} {remote_path}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code} {remote_path}: {body}") from e


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", type=int, default=1)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    zone = os.environ.get("BUNNY_STORAGE_ZONE", "").strip()
    api_key = os.environ.get("BUNNY_STORAGE_API_KEY", "").strip()
    region = os.environ.get("BUNNY_STORAGE_REGION", "de").strip().lower()

    if not zone or not api_key:
        print(
            "Hata: BUNNY_STORAGE_ZONE ve BUNNY_STORAGE_API_KEY ortam değişkenlerini ayarlayın.",
            file=sys.stderr,
        )
        return 1

    src = ROOT / "dist" / "cdn" / f"v{args.version}"
    if not src.is_dir():
        print(f"Hata: {src} yok. Önce: python scripts/export-content-packs.py --version {args.version}", file=sys.stderr)
        return 1

    host = REGION_HOST.get(region, REGION_HOST["de"])
    files = [p for p in src.rglob("*") if p.is_file()]
    safe_print(f"Yuklenecek: {len(files)} dosya -> zone={zone} host={host}")

    ok = 0
    failed = 0
    for i, local in enumerate(files, 1):
        rel = local.relative_to(src).as_posix()
        remote = f"v{args.version}/{rel}"
        if args.dry_run:
            safe_print(f"  [{i}/{len(files)}] PUT {remote}")
            ok += 1
            continue
        try:
            upload_file(host, zone, api_key, remote, local)
            ok += 1
        except Exception as e:
            failed += 1
            safe_print(f"  HATA [{i}/{len(files)}] {remote}: {e}")
            if failed > 25:
                safe_print("Cok fazla hata; durduruldu.")
                return 1
        if i % 50 == 0 or i == len(files):
            safe_print(f"  [{i}/{len(files)}] {rel}")

    safe_print(f"Tamam: {ok} dosya. Hata: {failed}.")
    if failed:
        return 1
    print()
    print("Firebase RTDB'ye ekleyin (platformMeta/cdn):")
    print(json_platform_meta_hint(args.version))
    return 0


def json_platform_meta_hint(version: int) -> str:
    return (
        '  platformMeta/cdn: {\n'
        '    "enabled": true,\n'
        '    "base": "https://SIZIN-PULL-ZONE.b-cdn.net",\n'
        f'    "version": {version},\n'
        '    "duelRefsOnly": true\n'
        "  }"
    )


if __name__ == "__main__":
    raise SystemExit(main())

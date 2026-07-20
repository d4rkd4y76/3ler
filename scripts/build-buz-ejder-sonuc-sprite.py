#!/usr/bin/env python3
"""Buz Ejderi sonuç geçişi — arka plan temizleme yok, tam kare WebP sprite."""
from __future__ import annotations

import json
import math
import os
import sys

import imageio.v3 as iio
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(ROOT, "hero", "ice_dragon", "true", "sonuc.mp4")
OUT_DIR = os.path.join(ROOT, "hero", "ice_dragon", "sprite", "sonuc")
SHEET_WEBP = os.path.join(OUT_DIR, "buz-ejder-sonuc.webp")
MANIFEST_JS = os.path.join(ROOT, "js", "ui", "012td-nova-buz-ejder-sonuc-manifest.js")

TARGET_FPS = 18
TARGET_FRAME_COUNT = 72
TARGET_FRAME_H = 840
MAX_SHEET_W = 4096
MAX_SHEET_H = 15800
WEBP_QUALITY = 92


def resolve_video() -> str:
    if os.path.isfile(VIDEO):
        return VIDEO
    true_dir = os.path.dirname(VIDEO)
    for name in os.listdir(true_dir):
        if name.lower().startswith("sonuc") and name.lower().endswith(".mp4"):
            return os.path.join(true_dir, name)
    return VIDEO


def subsample_frames(frames: list[np.ndarray], target: int) -> list[np.ndarray]:
    if len(frames) <= target:
        return frames
    idx = np.linspace(0, len(frames) - 1, target)
    return [frames[int(round(i))] for i in idx]


def to_rgba(frame: np.ndarray) -> np.ndarray:
    if frame.shape[2] == 4:
        return frame
    h, w = frame.shape[:2]
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = frame[:, :, :3]
    rgba[:, :, 3] = 255
    return rgba


def resize_to_h(rgba: np.ndarray, target_h: int) -> np.ndarray:
    h, w = rgba.shape[:2]
    nw = max(1, int(round(w * target_h / h)))
    if h == target_h and w == nw:
        return rgba
    return np.array(Image.fromarray(rgba, "RGBA").resize((nw, target_h), Image.Resampling.LANCZOS))


def content_bbox_rgba(rgba: np.ndarray, thr: int = 22) -> tuple[int, int, int, int]:
    rgb = rgba[:, :, :3]
    mx = np.max(rgb, axis=2)
    mask = mx > thr
    if not np.any(mask):
        h, w = rgba.shape[:2]
        return 0, 0, w, h
    ys, xs = np.where(mask)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def union_content_bbox(frames: list[np.ndarray], pad: int = 6) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = 10**9, 10**9, 0, 0
    fh, fw = frames[0].shape[:2]
    for frame in frames:
        bx0, by0, bx1, by1 = content_bbox_rgba(frame)
        x0 = min(x0, bx0)
        y0 = min(y0, by0)
        x1 = max(x1, bx1)
        y1 = max(y1, by1)
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(fw, x1 + pad)
    y1 = min(fh, y1 + pad)
    if x1 <= x0 or y1 <= y0:
        return 0, 0, fw, fh
    return x0, y0, x1, y1


def crop_frame(rgba: np.ndarray, box: tuple[int, int, int, int]) -> np.ndarray:
    x0, y0, x1, y1 = box
    return rgba[y0:y1, x0:x1].copy()


def place_cell(crop: np.ndarray, cw: int, ch: int) -> np.ndarray:
    cell = np.zeros((ch, cw, 4), dtype=np.uint8)
    fh, fw = crop.shape[:2]
    ox = max(0, (cw - fw) // 2)
    oy = max(0, (ch - fh) // 2)
    cell[oy : oy + fh, ox : ox + fw] = crop
    return cell


def pick_cols(n: int, cw: int, ch: int) -> int:
    best, score = 6, 1e18
    for cols in range(4, 13):
        rows = int(math.ceil(n / cols))
        sw = cols * cw
        sh = rows * ch
        if sw > MAX_SHEET_W or sh > MAX_SHEET_H:
            continue
        s = sw * sh
        if s < score:
            score, best = s, cols
    return best


def main() -> int:
    video = resolve_video()
    if not os.path.isfile(video):
        print("Missing:", video, file=sys.stderr)
        return 1

    all_raw: list[np.ndarray] = []
    for frame in iio.imiter(video, plugin="pyav"):
        all_raw.append(to_rgba(frame))

    if len(all_raw) < 4:
        print("Too few frames", file=sys.stderr)
        return 1

    raw = subsample_frames(all_raw, TARGET_FRAME_COUNT)
    sized = [resize_to_h(f, TARGET_FRAME_H) for f in raw]
    trim_box = union_content_bbox(sized)
    crops = [crop_frame(f, trim_box) for f in sized]
    cell_h = max(c.shape[0] for c in crops)
    cell_w = max(c.shape[1] for c in crops)
    cells = [place_cell(c, cell_w, cell_h) for c in crops]

    n = len(cells)
    cols = pick_cols(n, cell_w, cell_h)
    rows = int(math.ceil(n / cols))
    sheet_w, sheet_h = cols * cell_w, rows * cell_h
    sheet = np.zeros((sheet_h, sheet_w, 4), dtype=np.uint8)
    for idx, cell in enumerate(cells):
        c, r = idx % cols, idx // cols
        x, y = c * cell_w, r * cell_h
        sheet[y : y + cell_h, x : x + cell_w] = cell

    os.makedirs(OUT_DIR, exist_ok=True)
    Image.fromarray(sheet, "RGBA").save(SHEET_WEBP, quality=WEBP_QUALITY, method=6, lossless=False)

    mb = os.path.getsize(SHEET_WEBP) / (1024 * 1024)
    manifest = {
        "version": 1,
        "base": "hero/ice_dragon/sprite/sonuc/",
        "sheet": "buz-ejder-sonuc.webp",
        "frameWidth": cell_w,
        "frameHeight": cell_h,
        "cols": cols,
        "rows": rows,
        "frameCount": n,
        "loopEnd": n,
        "fps": TARGET_FPS,
        "sheetWidth": sheet_w,
        "sheetHeight": sheet_h,
        "cover": True,
    }

    js = "/* AUTO: scripts/build-buz-ejder-sonuc-sprite.py */\n"
    js += "window.NOVA_BUZ_EJDER_SONUC_BASE=" + json.dumps(manifest["base"]) + ";\n"
    js += "window.NOVA_BUZ_EJDER_SONUC_MANIFEST="
    js += json.dumps(manifest, separators=(",", ":")) + ";\n"
    with open(MANIFEST_JS, "w", encoding="utf-8") as f:
        f.write(js)

    print("frames", n, "cell", cell_w, "x", cell_h, "MB", round(mb, 2))
    print("manifest", MANIFEST_JS)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

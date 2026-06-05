#!/usr/bin/env python3
"""Açılış boot animasyonu — MP4 -> WebP sprite (chroma yok, arka plan korunur)."""
from __future__ import annotations

import json
import math
import os
import sys

import imageio.v3 as iio
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "boot-loading")
MANIFEST_JS = os.path.join(ROOT, "js", "ui", "nova-boot-sprite-manifest.js")

TARGET_FPS = 24
TARGET_H = 420
MAX_SHEET_W = 4096
PAD = 4
BG = (8, 12, 28)

VIDEO_CANDIDATES = [
    "yeni_loading.mp4",
    "kaynaklar_yukleniyor.mp4",
    "kaynaklar_yükleniyor.mp4",
]


def pick_video() -> str:
    for name in VIDEO_CANDIDATES:
        path = os.path.join(ROOT, name)
        if os.path.isfile(path):
            return path
    raise SystemExit("Boot videosu bulunamadi: " + ", ".join(VIDEO_CANDIDATES))


def resize_cover(rgb: np.ndarray, tw: int, th: int) -> np.ndarray:
    h, w = rgb.shape[:2]
    scale = max(tw / w, th / h)
    nw = max(1, int(round(w * scale)))
    nh = max(1, int(round(h * scale)))
    img = Image.fromarray(rgb, "RGB").resize((nw, nh), Image.Resampling.LANCZOS)
    arr = np.array(img)
    x0 = max(0, (nw - tw) // 2)
    y0 = max(0, (nh - th) // 2)
    return arr[y0 : y0 + th, x0 : x0 + tw]


def pick_cols(n: int, cw: int, ch: int) -> int:
    best, score = 6, 1e18
    for cols in range(4, 14):
        rows = int(math.ceil(n / cols))
        sw = cols * cw
        if sw > MAX_SHEET_W:
            continue
        s = max(sw, rows * ch)
        if s < score:
            score, best = s, cols
    return best


def main() -> None:
    video = pick_video()
    meta = iio.immeta(video, plugin="pyav")
    src_fps = float(meta.get("fps", 24) or 24)
    step = max(1, int(round(src_fps / TARGET_FPS)))

    raw: list[np.ndarray] = []
    for i, frame in enumerate(iio.imiter(video, plugin="pyav")):
        if i % step != 0:
            continue
        if frame.shape[2] == 4:
            frame = frame[:, :, :3]
        raw.append(frame)

    if len(raw) < 4:
        raise SystemExit("Cok az kare: " + video)

    ref_h = TARGET_H
    ref_w = max(1, int(round(raw[0].shape[1] * ref_h / raw[0].shape[0])))
    cells = [resize_cover(f, ref_w, ref_h) for f in raw]
    cell_w, cell_h = ref_w, ref_h
    n = len(cells)
    cols = pick_cols(n, cell_w, cell_h)
    rows = int(math.ceil(n / cols))
    sheet = np.zeros((rows * cell_h, cols * cell_w, 3), dtype=np.uint8)
    sheet[:, :] = BG

    for idx, cell in enumerate(cells):
        c, r = idx % cols, idx // cols
        x, y = c * cell_w, r * cell_h
        sheet[y : y + cell_h, x : x + cell_w] = cell

    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, "boot-main.webp")
    Image.fromarray(sheet, "RGB").save(out_path, quality=88, method=6)

    manifest = {
        "version": 1,
        "base": "assets/boot-loading/",
        "sheet": "boot-main.webp",
        "frameWidth": cell_w,
        "frameHeight": cell_h,
        "cols": cols,
        "rows": rows,
        "frameCount": n,
        "loopEnd": n,
        "fps": TARGET_FPS,
        "sheetWidth": cols * cell_w,
        "sheetHeight": rows * cell_h,
        "sourceVideo": os.path.basename(video),
    }

    js = (
        "/* AUTO: scripts/build-boot-sprites.py */\n"
        "window.NOVA_BOOT_SPRITE_MANIFEST = "
        + json.dumps(manifest, ensure_ascii=False)
        + ";\n"
    )
    with open(MANIFEST_JS, "w", encoding="utf-8") as f:
        f.write(js)

    mb = os.path.getsize(out_path) / (1024 * 1024)
    print("Boot sprite:", out_path, f"{mb:.2f} MB", f"{n} frames", f"{cell_w}x{cell_h}")


if __name__ == "__main__":
    main()

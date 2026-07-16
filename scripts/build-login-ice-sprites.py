#!/usr/bin/env python3
"""GİRİŞ EKRANI.mp4 → kesintisiz WebP spritesheet + manifest (buz ejder + çerçeve)."""
from __future__ import annotations

import json
import math
import os
import sys

import imageio.v3 as iio
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "login-ice")
SHEET_NAME = "login-ice-loop.webp"
MANIFEST_JS = os.path.join(ROOT, "js", "ui", "nova-login-ice-manifest.js")

TARGET_FPS = 12
TARGET_W = 360
BLEND = 10
MAX_SHEET_W = 4096
PAD = 4


def find_login_video() -> str:
    for name in os.listdir(ROOT):
        if not name.lower().endswith(".mp4"):
            continue
        path = os.path.join(ROOT, name)
        # Exact drop from user (~1.2MB portrait login art)
        if os.path.getsize(path) == 1268302:
            return path
        low = name.lower()
        if "gir" in low and "ekran" in low:
            return path
    # UTF-8 / CP1254 mangled names
    for name in os.listdir(ROOT):
        if name.lower().endswith(".mp4") and "EKRAN" in name.upper():
            path = os.path.join(ROOT, name)
            if os.path.basename(path) != "ana_ekran_egg.mp4":
                return path
    raise SystemExit("GİRİŞ EKRANI.mp4 bulunamadı")


def dark_mask(rgb: np.ndarray) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    # Koyu lacivert zemin + çerçeve içi boşluk
    dark = (r < 58) & (g < 78) & (b < 110) & (b + 8 >= r) & (b + 8 >= g * 0.85)
    # Çok koyu nötr
    dark |= (r < 28) & (g < 36) & (b < 52)
    return dark


def chroma_frame(rgb: np.ndarray) -> np.ndarray:
    a = np.where(dark_mask(rgb), 0, 255).astype(np.uint8)
    # Kenar yumuşatma
    from PIL import ImageFilter

    alpha_img = Image.fromarray(a, "L").filter(ImageFilter.GaussianBlur(radius=0.8))
    a2 = np.array(alpha_img, dtype=np.uint8)
    # İçerikte koyu gölgeleri koru: sadece neredeyse tamamen koyu + kenara yakın sil
    out = np.dstack([rgb, a2])
    return out


def alpha_bbox(rgba: np.ndarray) -> tuple[int, int, int, int]:
    a = rgba[:, :, 3] > 24
    ys, xs = np.where(a)
    if len(xs) == 0:
        h, w = rgba.shape[:2]
        return 0, 0, w, h
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def resize_w(rgba: np.ndarray, tw: int) -> np.ndarray:
    h, w = rgba.shape[:2]
    th = max(1, int(round(h * (tw / float(w)))))
    img = Image.fromarray(rgba, "RGBA").resize((tw, th), Image.Resampling.LANCZOS)
    return np.array(img, dtype=np.uint8)


def smoothstep(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def blend_cells(a: np.ndarray, b: np.ndarray, t: float) -> np.ndarray:
    t = smoothstep(t)
    af = a.astype(np.float32)
    bf = b.astype(np.float32)
    aa = af[:, :, 3:4] / 255.0
    ba = bf[:, :, 3:4] / 255.0
    out_a = aa * (1.0 - t) + ba * t
    out_rgb = (af[:, :, :3] * aa * (1.0 - t) + bf[:, :, :3] * ba * t) / np.maximum(out_a, 1e-4)
    out = np.zeros_like(af)
    out[:, :, :3] = np.clip(out_rgb, 0, 255)
    out[:, :, 3] = np.clip(out_a[:, :, 0] * 255.0, 0, 255)
    return out.astype(np.uint8)


def pick_cols(n: int, cw: int, ch: int) -> int:
    best, score = 6, 1e18
    for cols in range(4, 14):
        rows = int(math.ceil(n / cols))
        sw = cols * cw
        if sw > MAX_SHEET_W:
            continue
        s = abs(sw - rows * ch) + sw * 0.01
        if s < score:
            score, best = s, cols
    return best


def best_loop_end(frames: list[np.ndarray]) -> int:
    """frame[0] ≈ frame[k] olan en iyi k (kapanış noktası)."""
    first = frames[0].astype(np.float32)
    best = (1e18, len(frames) - 1)
    start = max(len(frames) // 2, 8)
    for i in range(start, len(frames)):
        mae = float(np.mean(np.abs(first - frames[i].astype(np.float32))))
        if mae < best[0]:
            best = (mae, i)
    return best[1]


def detect_hole_frac(rgb: np.ndarray) -> dict:
    h, w = rgb.shape[:2]
    dark = dark_mask(rgb)
    cx = w // 2
    col = dark[:, cx]
    runs = []
    s = None
    for i, v in enumerate(col):
        if v and s is None:
            s = i
        if (not v) and s is not None:
            runs.append((s, i - 1))
            s = None
    if s is not None:
        runs.append((s, h - 1))
    best = None
    for y0, y1 in runs:
        if y1 - y0 < 80 or y0 < 60:
            continue
        mid = (y0 + y1) / 2
        score = (y1 - y0) - abs(mid - h * 0.58)
        if best is None or score > best[0]:
            best = (score, y0, y1)
    if not best:
        return {"left": 0.22, "top": 0.40, "right": 0.78, "bottom": 0.86}
    y0, y1 = best[1], best[2]
    row = dark[(y0 + y1) // 2, :]
    runs = []
    s = None
    for i, v in enumerate(row):
        if v and s is None:
            s = i
        if (not v) and s is not None:
            runs.append((s, i - 1))
            s = None
    if s is not None:
        runs.append((s, w - 1))
    x0, x1 = max(runs, key=lambda t: t[1] - t[0])
    # Biraz içeri çek — çerçeve kenarına taşmasın
    pad_x = (x1 - x0) * 0.04
    pad_y = (y1 - y0) * 0.05
    return {
        "left": round((x0 + pad_x) / w, 4),
        "top": round((y0 + pad_y) / h, 4),
        "right": round((x1 - pad_x) / w, 4),
        "bottom": round((y1 - pad_y) / h, 4),
    }


def main() -> int:
    video = find_login_video()
    print("video:", video)

    meta = iio.immeta(video, plugin="pyav")
    src_fps = float(meta.get("fps", 24) or 24)
    step = max(1, int(round(src_fps / TARGET_FPS)))

    raw: list[np.ndarray] = []
    for i, frame in enumerate(iio.imiter(video, plugin="pyav")):
        if i % step != 0:
            continue
        if frame.ndim == 3 and frame.shape[2] == 4:
            frame = frame[:, :, :3]
        raw.append(frame)

    if len(raw) < 8:
        print("Çok az kare:", len(raw), file=sys.stderr)
        return 1

    loop_i = best_loop_end(raw)
    raw = raw[: loop_i + 1]
    print("frames used:", len(raw), "loop_end_idx", loop_i, "step", step)

    hole = detect_hole_frac(raw[0])
    print("hole frac:", hole)

    keyed = [chroma_frame(f) for f in raw]
    boxes = [alpha_bbox(c) for c in keyed]
    gx0 = max(0, min(b[0] for b in boxes) - PAD)
    gy0 = max(0, min(b[1] for b in boxes) - PAD)
    gx1 = min(keyed[0].shape[1], max(b[2] for b in boxes) + PAD)
    gy1 = min(keyed[0].shape[0], max(b[3] for b in boxes) + PAD)

    crops = [resize_w(c[gy0:gy1, gx0:gx1], TARGET_W) for c in keyed]
    # Align to same cell size
    cw = max(c.shape[1] for c in crops)
    ch = max(c.shape[0] for c in crops)
    cells = []
    for crop in crops:
        cell = np.zeros((ch, cw, 4), dtype=np.uint8)
        fh, fw = crop.shape[:2]
        ox = (cw - fw) // 2
        oy = (ch - fh) // 2
        cell[oy : oy + fh, ox : ox + fw] = crop
        cells.append(cell)

    content_n = len(cells)
    first, last = cells[0], cells[-1]
    for bi in range(1, BLEND + 1):
        t = bi / (BLEND + 1)
        cells.append(blend_cells(last, first, t))

    n = len(cells)
    cols = pick_cols(n, cw, ch)
    rows = int(math.ceil(n / cols))
    sheet = np.zeros((rows * ch, cols * cw, 4), dtype=np.uint8)
    for idx, cell in enumerate(cells):
        c, r = idx % cols, idx // cols
        sheet[r * ch : r * ch + ch, c * cw : c * cw + cw] = cell

    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, SHEET_NAME)
    Image.fromarray(sheet, "RGBA").save(out_path, quality=90, method=6)
    mb = os.path.getsize(out_path) / (1024 * 1024)

    # Hole fractions relative to full video frame → adjust for crop
    # After crop, hole coords change: map original hole through crop box
    oh, ow = raw[0].shape[:2]
    hx0 = hole["left"] * ow
    hy0 = hole["top"] * oh
    hx1 = hole["right"] * ow
    hy1 = hole["bottom"] * oh
    # relative to crop
    hole_cell = {
        "left": round((hx0 - gx0) / max(1, gx1 - gx0), 4),
        "top": round((hy0 - gy0) / max(1, gy1 - gy0), 4),
        "right": round((hx1 - gx0) / max(1, gx1 - gx0), 4),
        "bottom": round((hy1 - gy0) / max(1, gy1 - gy0), 4),
    }

    manifest = {
        "version": 1,
        "base": "assets/login-ice/",
        "sheet": SHEET_NAME,
        "frameWidth": cw,
        "frameHeight": ch,
        "cols": cols,
        "rows": rows,
        "frameCount": n,
        "contentFrames": content_n,
        "loopEnd": n,
        "fps": TARGET_FPS,
        "blendFrames": BLEND,
        "sheetWidth": cols * cw,
        "sheetHeight": rows * ch,
        "hole": hole_cell,
        "seamless": True,
    }

    js = "/* AUTO: scripts/build-login-ice-sprites.py */\n"
    js += "window.NOVA_LOGIN_ICE_MANIFEST = " + json.dumps(manifest, separators=(",", ":")) + ";\n"
    with open(MANIFEST_JS, "w", encoding="utf-8") as f:
        f.write(js)
    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print("->", out_path, round(mb, 2), "MB", cw, "x", ch, "cells", n, "cols", cols)
    print("manifest ->", MANIFEST_JS)
    print("hole_cell", hole_cell)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Buz Ejderi: video -> temiz alpha sprite (hizalı, küçük WebP)."""
from __future__ import annotations

import json
import math
import os
import sys
from collections import deque

import imageio.v3 as iio
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(ROOT, "hero", "ice_dragon", "icedragonvitrin.mp4")
OUT_DIR = os.path.join(ROOT, "hero", "ice_dragon", "sprite")
MANIFEST_JS = os.path.join(ROOT, "js", "ui", "012t-nova-buz-ejder-sprite-manifest.js")
SHEET_WEBP = os.path.join(OUT_DIR, "buz-ejder-idle.webp")
MANIFEST_JSON = os.path.join(OUT_DIR, "manifest.json")

TARGET_FPS = 12
MAX_FRAMES = 36
BLEND_FRAMES = 6
TARGET_H = 268
MAX_SHEET_W = 3600
PAD = 4


def sample_key_rgb(frame: np.ndarray) -> tuple[int, int, int]:
    h, w = frame.shape[:2]
    m = 8
    strips = [
        frame[:m, :, :3],
        frame[h - m :, :, :3],
        frame[:, :m, :3],
        frame[:, w - m :, :3],
    ]
    px = np.concatenate([s.reshape(-1, 3) for s in strips], axis=0)
    return tuple(int(x) for x in np.median(px, axis=0))


def alpha_from_key(rgb: np.ndarray, key: np.ndarray, tol: float, soft: float) -> np.ndarray:
    rgbf = rgb.astype(np.float32) / 255.0
    d = np.sqrt(np.sum((rgbf - key) ** 2, axis=2))
    a = np.clip((d - tol) / max(soft, 1e-5), 0.0, 1.0)
    mx = np.max(rgbf, axis=2)
    mn = np.min(rgbf, axis=2)
    sat = mx - mn
    lum = 0.299 * rgbf[:, :, 0] + 0.587 * rgbf[:, :, 1] + 0.114 * rgbf[:, :, 2]
    gray = (sat < 0.08) & (lum > 0.18) & (lum < 0.96) & (d < tol + soft + 0.05)
    a[gray] = 0.0
    return a


def flood_erase_background(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    h, w = out.shape[:2]
    rgb = out[:, :, :3].astype(np.float32)
    kr, kg, kb = key
    dist = np.sqrt((rgb[:, :, 0] - kr) ** 2 + (rgb[:, :, 1] - kg) ** 2 + (rgb[:, :, 2] - kb) ** 2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    bg = (dist < 50) | ((sat < 34) & (dist < 78))
    seen = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if bg[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if bg[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        out[y, x, 3] = 0
        out[y, x, :3] = 0
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and bg[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    return out


def despill_rgba(rgba: np.ndarray, key: np.ndarray) -> np.ndarray:
    out = rgba.copy()
    a = out[:, :, 3].astype(np.float32) / 255.0
    edge = (a > 0.02) & (a < 0.98)
    if not np.any(edge):
        return out
    k = key.astype(np.float32)
    rgb = out[:, :, :3].astype(np.float32)
    spill = np.maximum(0.0, np.sum((rgb - k) * np.array([0.333, 0.333, 0.334]), axis=2))
    for c in range(3):
        ch = rgb[:, :, c]
        excess = np.maximum(0.0, ch - k[c])
        rgb[:, :, c] = np.where(edge, ch - excess * spill * 0.7, ch)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    return out


def chroma_frame(frame: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    key_arr = np.array(key, dtype=np.float32)
    rgb = frame[:, :, :3]
    a = alpha_from_key(rgb, key_arr / 255.0, tol=0.05, soft=0.07)
    rgba = np.zeros((frame.shape[0], frame.shape[1], 4), dtype=np.uint8)
    rgba[:, :, :3] = rgb
    rgba[:, :, 3] = (a * 255).astype(np.uint8)
    rgba = flood_erase_background(rgba, key)
    rgba = despill_rgba(rgba, key_arr)
    rgba[rgba[:, :, 3] < 32, 3] = 0
    rgba[rgba[:, :, 3] < 32, :3] = 0
    return rgba


def alpha_bbox(rgba: np.ndarray, thr: int = 28) -> tuple[int, int, int, int]:
    ys, xs = np.where(rgba[:, :, 3] > thr)
    if len(xs) == 0:
        h, w = rgba.shape[:2]
        return 0, 0, w, h
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def scrub_floor_shadow(crop: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = crop.copy()
    h = out.shape[0]
    y0 = int(h * 0.72)
    band = out[y0:, :, :]
    r = band[:, :, 0].astype(np.float32)
    g = band[:, :, 1].astype(np.float32)
    b = band[:, :, 2].astype(np.float32)
    a = band[:, :, 3].astype(np.float32)
    kr, kg, kb = key
    dist = np.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2)
    sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    kill = (a < 200) | (dist < 72) | ((sat < 42) & (dist < 90))
    band[kill, 3] = 0
    band[kill, 0] = 0
    band[kill, 1] = 0
    band[kill, 2] = 0
    out[y0:, :, :] = band
    return out


def place_in_cell(crop: np.ndarray, cw: int, ch: int) -> np.ndarray:
    cell = np.zeros((ch, cw, 4), dtype=np.uint8)
    fh, fw = crop.shape[:2]
    ox = (cw - fw) // 2
    oy = (ch - fh) // 2
    cell[oy : oy + fh, ox : ox + fw] = crop
    return cell


def scrub_cell(cell: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = cell.copy()
    r = out[:, :, 0].astype(np.float32)
    g = out[:, :, 1].astype(np.float32)
    b = out[:, :, 2].astype(np.float32)
    a = out[:, :, 3].astype(np.float32)
    kr, kg, kb = key
    dist = np.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2)
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = mx - mn
    mask = (a < 60) | (dist < 58) | ((sat < 40) & (a < 215))
    out[mask, 3] = 0
    out[mask, 0] = 0
    out[mask, 1] = 0
    out[mask, 2] = 0
    return out


def resize_h(rgba: np.ndarray, h: int) -> np.ndarray:
    w = max(1, int(round(rgba.shape[1] * h / rgba.shape[0])))
    return np.array(Image.fromarray(rgba, "RGBA").resize((w, h), Image.Resampling.LANCZOS))


def blend_cells(a: np.ndarray, b: np.ndarray, t: float) -> np.ndarray:
    return np.clip(a.astype(np.float32) * (1 - t) + b.astype(np.float32) * t, 0, 255).astype(np.uint8)


def pick_cols(n: int, cw: int, ch: int) -> int:
    best, score = 5, 1e18
    for cols in range(4, 9):
        rows = int(math.ceil(n / cols))
        sw, sh = cols * cw, rows * ch
        if sw > MAX_SHEET_W:
            continue
        s = max(sw, sh)
        if s < score:
            score, best = s, cols
    return best


def main() -> int:
    if not os.path.isfile(VIDEO):
        print("Video missing:", VIDEO, file=sys.stderr)
        return 1

    meta = iio.immeta(VIDEO, plugin="pyav")
    src_fps = float(meta.get("fps", 24) or 24)
    step = max(1, int(round(src_fps / TARGET_FPS)))

    raw_frames: list[np.ndarray] = []
    for i, frame in enumerate(iio.imiter(VIDEO, plugin="pyav")):
        if i % step != 0:
            continue
        if frame.shape[2] == 4:
            frame = frame[:, :, :3]
        raw_frames.append(frame)
        if len(raw_frames) >= MAX_FRAMES:
            break

    if len(raw_frames) < 4:
        print("Too few frames", file=sys.stderr)
        return 1

    keys = [sample_key_rgb(f) for f in raw_frames]
    key = tuple(int(np.median([k[i] for k in keys])) for i in range(3))
    print("key rgb", key)

    chroma = [chroma_frame(f, key) for f in raw_frames]

    boxes = [alpha_bbox(c) for c in chroma]
    gx0 = min(b[0] for b in boxes) - PAD
    gy0 = min(b[1] for b in boxes) - PAD
    gx1 = max(b[2] for b in boxes) + PAD
    gy1 = max(b[3] for b in boxes) + PAD
    gx0 = max(0, gx0)
    gy0 = max(0, gy0)
    gx1 = min(chroma[0].shape[1], gx1)
    gy1 = min(chroma[0].shape[0], gy1)

    crops = []
    for c in chroma:
        crop = resize_h(c[gy0:gy1, gx0:gx1], TARGET_H)
        crops.append(scrub_floor_shadow(crop, key))

    cell_h = max(c.shape[0] for c in crops)
    cell_w = max(c.shape[1] for c in crops)
    cells = [scrub_cell(place_in_cell(c, cell_w, cell_h), key) for c in crops]

    first, last = cells[0], cells[-1]
    for bi in range(1, BLEND_FRAMES + 1):
        t = bi / (BLEND_FRAMES + 1)
        cells.append(scrub_cell(blend_cells(last, first, t), key))

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
    Image.fromarray(sheet, "RGBA").save(SHEET_WEBP, quality=85, method=6, lossless=False)

    loop_end = len(crops)
    manifest = {
        "version": 4,
        "base": "hero/ice_dragon/sprite/",
        "sheet": "buz-ejder-idle.webp",
        "frameWidth": cell_w,
        "frameHeight": cell_h,
        "cols": cols,
        "rows": rows,
        "frameCount": n,
        "loopEnd": loop_end,
        "fps": TARGET_FPS,
        "blendFrames": BLEND_FRAMES,
        "sheetWidth": sheet_w,
        "sheetHeight": sheet_h,
        "anchor": "center",
    }
    with open(MANIFEST_JSON, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    js = "/* AUTO: scripts/build-buz-ejder-sprite.py */\n"
    js += "window.NOVA_BUZ_EJDER_SPRITE_BASE=" + json.dumps(manifest["base"]) + ";\n"
    js += "window.NOVA_BUZ_EJDER_SPRITE_MANIFEST = "
    js += json.dumps(manifest, separators=(",", ":")) + ";\n"
    with open(MANIFEST_JS, "w", encoding="utf-8") as f:
        f.write(js)

    mb = os.path.getsize(SHEET_WEBP) / (1024 * 1024)
    print("frames", loop_end, "+ blend", BLEND_FRAMES, "cell", cell_w, "x", cell_h)
    print("sheet", sheet_w, "x", sheet_h, "webp", round(mb, 2), "MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

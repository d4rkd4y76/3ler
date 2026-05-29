#!/usr/bin/env python3
"""Alev Ejderi vitrin: premium alpha, ayak hizalı, Buz Ejderi ile eş boy."""
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
VIDEO = os.path.join(ROOT, "hero", "flame_dragon", "alev_ejderi_vitrin.mp4")
OUT_DIR = os.path.join(ROOT, "hero", "flame_dragon", "sprite")
MANIFEST_JS = os.path.join(ROOT, "js", "ui", "012v-nova-alev-ejder-sprite-manifest.js")
SHEET_WEBP = os.path.join(OUT_DIR, "alev-ejder-idle.webp")
MANIFEST_JSON = os.path.join(OUT_DIR, "manifest.json")

TARGET_FPS = 12
MAX_FRAMES = 36
BLEND_FRAMES = 8
TARGET_H = 280
TARGET_FILL_W = 372
MAX_SHEET_W = 3600
PAD = 4


def sample_key_rgb(frame: np.ndarray) -> tuple[int, int, int]:
    h, w = frame.shape[:2]
    m = 10
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
    gray = (sat < 0.09) & (lum > 0.12) & (lum < 0.97) & (d < tol + soft + 0.04)
    a[gray] = 0.0
    green_edge = (rgbf[:, :, 1] > rgbf[:, :, 0] + 0.06) & (rgbf[:, :, 1] > rgbf[:, :, 2] + 0.06) & (d < tol + soft + 0.12)
    a[green_edge] = np.minimum(a[green_edge], 0.15)
    return a


def flood_erase_background(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    h, w = out.shape[:2]
    rgb = out[:, :, :3].astype(np.float32)
    kr, kg, kb = key
    dist = np.sqrt((rgb[:, :, 0] - kr) ** 2 + (rgb[:, :, 1] - kg) ** 2 + (rgb[:, :, 2] - kb) ** 2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    bg = (dist < 55) | ((sat < 32) & (dist < 82))
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
    spill_g = np.maximum(0.0, rgb[:, :, 1] - k[1])
    spill_all = np.maximum(0.0, np.sum((rgb - k) * np.array([0.333, 0.333, 0.334]), axis=2))
    for c in range(3):
        ch = rgb[:, :, c]
        excess = np.maximum(0.0, ch - k[c])
        cut = excess * spill_all * 0.82 + (spill_g * 0.35 if c == 1 else 0.0)
        rgb[:, :, c] = np.where(edge, ch - cut, ch)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    return out


def chroma_frame(frame: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    key_arr = np.array(key, dtype=np.float32)
    rgb = frame[:, :, :3]
    a = alpha_from_key(rgb, key_arr / 255.0, tol=0.045, soft=0.065)
    rgba = np.zeros((frame.shape[0], frame.shape[1], 4), dtype=np.uint8)
    rgba[:, :, :3] = rgb
    rgba[:, :, 3] = (a * 255).astype(np.uint8)
    rgba = flood_erase_background(rgba, key)
    rgba = despill_rgba(rgba, key_arr)
    rgba[rgba[:, :, 3] < 36, 3] = 0
    rgba[rgba[:, :, 3] < 36, :3] = 0
    return rgba


def alpha_bbox(rgba: np.ndarray, thr: int = 30) -> tuple[int, int, int, int]:
    ys, xs = np.where(rgba[:, :, 3] > thr)
    if len(xs) == 0:
        h, w = rgba.shape[:2]
        return 0, 0, w, h
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def resize_h(rgba: np.ndarray, h: int) -> np.ndarray:
    w = max(1, int(round(rgba.shape[1] * h / rgba.shape[0])))
    return np.array(Image.fromarray(rgba, "RGBA").resize((w, h), Image.Resampling.LANCZOS))


def scale_to_fill_w(rgba: np.ndarray, target_w: int) -> np.ndarray:
    fh, fw = rgba.shape[:2]
    if fw >= target_w * 0.92:
        return rgba
    scale = min(1.28, (target_w * 0.94) / max(fw, 1))
    nw = max(1, int(round(fw * scale)))
    nh = max(1, int(round(fh * scale)))
    return np.array(Image.fromarray(rgba, "RGBA").resize((nw, nh), Image.Resampling.LANCZOS))


def scrub_floor_shadow(crop: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = crop.copy()
    h = out.shape[0]
    y0 = int(h * 0.7)
    band = out[y0:, :, :]
    r = band[:, :, 0].astype(np.float32)
    g = band[:, :, 1].astype(np.float32)
    b = band[:, :, 2].astype(np.float32)
    a = band[:, :, 3].astype(np.float32)
    kr, kg, kb = key
    dist = np.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2)
    sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    kill = (a < 210) | (dist < 78) | ((sat < 44) & (dist < 96))
    band[kill, 3] = 0
    band[kill, :3] = 0
    out[y0:, :, :] = band
    return out


def align_crops_foot(crops: list[np.ndarray]) -> tuple[list[np.ndarray], int, int]:
    ch = max(c.shape[0] for c in crops)
    cw = max(c.shape[1] for c in crops)
    aligned: list[np.ndarray] = []
    for crop in crops:
        cell = np.zeros((ch, cw, 4), dtype=np.uint8)
        fh, fw = crop.shape[:2]
        ox = (cw - fw) // 2
        oy = ch - fh
        cell[oy : oy + fh, ox : ox + fw] = crop
        aligned.append(cell)
    return aligned, cw, ch


def trim_sheet_width(cells: list[np.ndarray], pad: int = 3) -> tuple[list[np.ndarray], int, int]:
    ch = cells[0].shape[0]
    x0 = cells[0].shape[1]
    x1 = 0
    for cell in cells:
        ys, xs = np.where(cell[:, :, 3] > 28)
        if len(xs) == 0:
            continue
        x0 = min(x0, int(xs.min()))
        x1 = max(x1, int(xs.max()) + 1)
    x0 = max(0, x0 - pad)
    x1 = min(cells[0].shape[1], x1 + pad)
    cw = max(8, x1 - x0)
    trimmed = [cell[:, x0:x1].copy() for cell in cells]
    return trimmed, cw, ch


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
    mask = (a < 64) | (dist < 62) | ((sat < 38) & (a < 220))
    out[mask, 3] = 0
    out[mask, :3] = 0
    return out


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
    gx0 = max(0, min(b[0] for b in boxes) - PAD)
    gy0 = max(0, min(b[1] for b in boxes) - PAD)
    gx1 = min(chroma[0].shape[1], max(b[2] for b in boxes) + PAD)
    gy1 = min(chroma[0].shape[0], max(b[3] for b in boxes) + PAD)

    crops = []
    for c in chroma:
        crop = resize_h(c[gy0:gy1, gx0:gx1], TARGET_H)
        crop = scale_to_fill_w(crop, TARGET_FILL_W)
        crops.append(scrub_floor_shadow(crop, key))

    cells, cell_w, cell_h = align_crops_foot(crops)
    cells, cell_w, cell_h = trim_sheet_width(cells)
    cells = [scrub_cell(c, key) for c in cells]

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
    Image.fromarray(sheet, "RGBA").save(SHEET_WEBP, quality=92, method=6, lossless=False)

    loop_end = len(crops)
    manifest = {
        "version": 4,
        "base": "hero/flame_dragon/sprite/",
        "sheet": "alev-ejder-idle.webp",
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
        "anchor": "bottom",
    }
    with open(MANIFEST_JSON, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    mb = os.path.getsize(SHEET_WEBP) / (1024 * 1024)
    print("frames", loop_end, "+ blend", BLEND_FRAMES, "cell", cell_w, "x", cell_h)
    print("sheet", sheet_w, "x", sheet_h, "webp", round(mb, 2), "MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

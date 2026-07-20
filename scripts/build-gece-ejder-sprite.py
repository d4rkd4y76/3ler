#!/usr/bin/env python3
"""Gece Ejderi vitrin — gradyan arka plan, kanat/kuyruk koruma."""
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
VIDEO = os.path.join(ROOT, "hero", "dark_dragon", "dark_dragon_vitrin.mp4")
OUT_DIR = os.path.join(ROOT, "hero", "dark_dragon", "sprite")
SHEET_WEBP = os.path.join(OUT_DIR, "gece-ejder-idle.webp")
MANIFEST_JSON = os.path.join(OUT_DIR, "manifest.json")

TARGET_FPS = 12
MAX_FRAMES = 36
BLEND_FRAMES = 8
TARGET_H = 278
MAX_SHEET_W = 3600
PAD = 14


def sample_bg_keys(frames: list[np.ndarray]) -> tuple[tuple[int, int, int], tuple[int, int, int]]:
    tops, bots = [], []
    for f in frames[:8]:
        h, w = f.shape[:2]
        tops.append(np.median(f[: max(12, h // 10), :, :3].reshape(-1, 3), axis=0))
        bots.append(np.median(f[h - max(12, h // 10) :, :, :3].reshape(-1, 3), axis=0))
    top = tuple(int(x) for x in np.median(tops, axis=0))
    bot = tuple(int(x) for x in np.median(bots, axis=0))
    return top, bot


def color_dist(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    kr, kg, kb = key
    return np.sqrt((r - kr) ** 2 + (g - kg) ** 2 * 1.2 + (b - kb) ** 2)


def is_gece_dragon_pixel(rgb: np.ndarray) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    void_black = lum < 24
    dark_scale = (lum < 100) & ((b > r * 0.5) | (r < 95))
    purple_glow = (b > 65) & (r > 30) & (b > g * 0.82) & (lum > 26)
    cyan_eye = (g > 105) & (b > 125) & (r < 130)
    violet_edge = (r > 70) & (b > 95) & (g < r * 0.98) & (lum > 38)
    return void_black | dark_scale | purple_glow | cyan_eye | violet_edge


def bg_candidate_mask(rgb: np.ndarray, key_top: tuple[int, int, int], key_bot: tuple[int, int, int]) -> np.ndarray:
    d = np.minimum(color_dist(rgb, key_top), color_dist(rgb, key_bot))
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    dragon = is_gece_dragon_pixel(rgb)
    return (d < 72) & ~dragon


def flood_border_bg(rgba: np.ndarray, bg: np.ndarray) -> np.ndarray:
    out = rgba.copy()
    h, w = out.shape[:2]
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


def despill_soft(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    a = out[:, :, 3].astype(np.float32) / 255.0
    edge = (a > 0.04) & (a < 0.92)
    if not np.any(edge):
        return out
    rgb = out[:, :, :3].astype(np.float32)
    kg = float(key[1])
    spill = np.maximum(0.0, rgb[:, :, 1] - kg)
    rgb[:, :, 1] = np.where(edge, rgb[:, :, 1] - spill * 0.55, rgb[:, :, 1])
    rgb[:, :, 0] = np.where(edge, rgb[:, :, 0] + spill * 0.06, rgb[:, :, 0])
    rgb[:, :, 2] = np.where(edge, rgb[:, :, 2] + spill * 0.06, rgb[:, :, 2])
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    return out


def refine_alpha(rgba: np.ndarray) -> np.ndarray:
    out = rgba.copy()
    a = out[:, :, 3].astype(np.float32)
    seed = a > 85
    keep = is_gece_dragon_pixel(out[:, :, :3]) & seed
    a[keep] = np.maximum(a[keep], 245.0)
    out[:, :, 3] = np.clip(a, 0, 255).astype(np.uint8)
    return out


def chroma_frame(frame: np.ndarray, key_top: tuple[int, int, int], key_bot: tuple[int, int, int]) -> np.ndarray:
    rgb = frame[:, :, :3]
    d = np.minimum(color_dist(rgb, key_top), color_dist(rgb, key_bot))
    a = np.clip((d - 26.0) / 36.0, 0.0, 1.0)
    keep = is_gece_dragon_pixel(rgb)
    a[keep & (a > 0.35)] = np.maximum(a[keep & (a > 0.35)], 0.96)
    rgba = np.zeros((frame.shape[0], frame.shape[1], 4), dtype=np.uint8)
    rgba[:, :, :3] = rgb
    rgba[:, :, 3] = (a * 255).astype(np.uint8)
    bg = bg_candidate_mask(rgb, key_top, key_bot)
    rgba = flood_border_bg(rgba, bg)
    rgba = refine_alpha(rgba)
    mid_key = tuple(int((key_top[i] + key_bot[i]) / 2) for i in range(3))
    rgba = despill_soft(rgba, mid_key)
    rgba[rgba[:, :, 3] < 18, 3] = 0
    rgba[rgba[:, :, 3] < 18, :3] = 0
    return rgba


def alpha_bbox(rgba: np.ndarray, thr: int = 24) -> tuple[int, int, int, int]:
    ys, xs = np.where(rgba[:, :, 3] > thr)
    if len(xs) == 0:
        h, w = rgba.shape[:2]
        return 0, 0, w, h
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def resize_h(rgba: np.ndarray, h: int) -> np.ndarray:
    w = max(1, int(round(rgba.shape[1] * h / rgba.shape[0])))
    return np.array(Image.fromarray(rgba, "RGBA").resize((w, h), Image.Resampling.LANCZOS))


def place_in_cell(crop: np.ndarray, cw: int, ch: int) -> np.ndarray:
    cell = np.zeros((ch, cw, 4), dtype=np.uint8)
    fh, fw = crop.shape[:2]
    ox = (cw - fw) // 2
    oy = (ch - fh) // 2
    cell[oy : oy + fh, ox : ox + fw] = crop
    return cell


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

    key_top, key_bot = sample_bg_keys(raw_frames)
    print("bg keys top", key_top, "bot", key_bot)

    chroma = [chroma_frame(f, key_top, key_bot) for f in raw_frames]
    boxes = [alpha_bbox(c) for c in chroma]
    gx0 = max(0, min(b[0] for b in boxes) - PAD)
    gy0 = max(0, min(b[1] for b in boxes) - PAD)
    gx1 = min(chroma[0].shape[1], max(b[2] for b in boxes) + PAD)
    gy1 = min(chroma[0].shape[0], max(b[3] for b in boxes) + PAD)

    crops = [resize_h(c[gy0:gy1, gx0:gx1], TARGET_H) for c in chroma]
    # Buz ile eş görünüm: geniş hücreyi hedef genişliğe ölçekle
    target_w = 378
    scaled = []
    for crop in crops:
        fh, fw = crop.shape[:2]
        if fw > target_w:
            nh = max(1, int(round(fh * target_w / fw)))
            scaled.append(np.array(Image.fromarray(crop, "RGBA").resize((target_w, nh), Image.Resampling.LANCZOS)))
        else:
            scaled.append(crop)
    crops = scaled
    cell_h = max(c.shape[0] for c in crops)
    cell_w = max(c.shape[1] for c in crops)
    cells = [place_in_cell(c, cell_w, cell_h) for c in crops]

    first, last = cells[0], cells[-1]
    for bi in range(1, BLEND_FRAMES + 1):
        t = bi / (BLEND_FRAMES + 1)
        cells.append(blend_cells(last, first, t))

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
    Image.fromarray(sheet, "RGBA").save(SHEET_WEBP, quality=93, method=6, lossless=False)

    loop_end = len(crops)
    manifest = {
        "version": 4,
        "base": "hero/dark_dragon/sprite/",
        "sheet": "gece-ejder-idle.webp",
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

    mb = os.path.getsize(SHEET_WEBP) / (1024 * 1024)
    cell0 = sheet[:cell_h, :cell_w]
    cov = (cell0[:, :, 3] > 80).mean()
    print("frames", loop_end, "+ blend", BLEND_FRAMES, "cell", cell_w, "x", cell_h)
    print("opaque coverage", round(cov * 100, 1), "%")
    print("sheet", sheet_w, "x", sheet_h, "webp", round(mb, 2), "MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

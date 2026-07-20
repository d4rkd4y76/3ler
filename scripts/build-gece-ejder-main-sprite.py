#!/usr/bin/env python3
"""Gece Ejderi ana ekran: dark_dragon_anaekran.mp4 (yeşil) -> seamless WebP sprite."""
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
VIDEO = os.path.join(ROOT, "hero", "dark_dragon", "dark_dragon_anaekran.mp4")
OUT_DIR = os.path.join(ROOT, "hero", "dark_dragon", "sprite")
SHEET_WEBP = os.path.join(OUT_DIR, "gece-ejder-main.webp")
STORE_MANIFEST = os.path.join(OUT_DIR, "manifest.json")
MANIFEST_JS = os.path.join(ROOT, "js", "ui", "012y-nova-gece-ejder-sprite-manifest.js")

TARGET_FPS = 12
MIN_LOOP_FRAMES = 28
TARGET_H = 296
MAX_SHEET_W = 4096
PAD = 6
WEBP_QUALITY = 92


def sample_green_key(frames: list[np.ndarray]) -> tuple[int, int, int]:
    keys = []
    for f in frames[:6]:
        h, w = f.shape[:2]
        m = 12
        strips = [f[:m, :, :3], f[h - m :, :, :3], f[:, :m, :3], f[:, w - m :, :3]]
        px = np.concatenate([s.reshape(-1, 3) for s in strips], axis=0)
        keys.append(np.median(px, axis=0))
    med = np.median(keys, axis=0)
    return tuple(int(x) for x in med)


def color_dist(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    kr, kg, kb = key
    return np.sqrt((r - kr) ** 2 + (g - kg) ** 2 * 1.35 + (b - kb) ** 2)


def is_pure_green_bg(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    d = color_dist(rgb, key)
    return (g > r + 16) & (g > b + 12) & (g > 54) & (d < 98)


def is_dragon_eye(rgb: np.ndarray) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    return (g > 88) & (b > 55) & (r < 130) & ((g > r + 4) | (b > r + 8))


def is_gece_dragon_pixel(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    """Ejder parçası — asla düz yeşil arka plan değil."""
    pure = is_pure_green_bg(rgb, key)
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    dark_body = (lum < 128) & ~pure
    purple = (b > 52) & (r > 18) & (b > g * 0.68) & ~pure
    return dark_body | purple | is_dragon_eye(rgb)


def alpha_green(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    d = color_dist(rgb, key)
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    a = np.clip((d - 26.0) / 38.0, 0.0, 1.0)
    green_dom = (g > r + 28) & (g > b + 28) & (g > 80)
    a[green_dom & (d < 95)] = 0.0
    dragon = is_gece_dragon_pixel(rgb, key)
    keep = dragon & (a > 0.14)
    a[keep] = np.maximum(a[keep], 0.94)
    return a


def flood_green(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    h, w = out.shape[:2]
    rgb = out[:, :, :3].astype(np.float32)
    d = color_dist(rgb, key)
    bg = (d < 72) | (
        (rgb[:, :, 1] > rgb[:, :, 0] + 20)
        & (rgb[:, :, 1] > rgb[:, :, 2] + 20)
        & (d < 110)
    )
    bg = bg & ~is_gece_dragon_pixel(out[:, :, :3], key)
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


def scrub_remaining_green(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    rgb = out[:, :, :3]
    kill = is_pure_green_bg(rgb, key) & (out[:, :, 3] > 0)
    out[kill, 3] = 0
    out[kill, :3] = 0
    return out


def scrub_green_spill(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    """Ayak/kuyruk yeşil yansıması — gözleri koru."""
    out = rgba.copy()
    rgb = out[:, :, :3].astype(np.float32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    eyes = is_dragon_eye(out[:, :, :3])
    spill = (
        (g > r + 10)
        & (g > b + 6)
        & (lum > 32)
        & (lum < 145)
        & ~eyes
        & (out[:, :, 3] > 0)
    )
    out[spill, 3] = 0
    out[spill, :3] = 0
    return out


def despill_green(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    a = out[:, :, 3].astype(np.float32) / 255.0
    edge = (a > 0.03) & (a < 0.95)
    if not np.any(edge):
        return out
    rgb = out[:, :, :3].astype(np.float32)
    kg = float(key[1])
    excess_g = np.maximum(0.0, rgb[:, :, 1] - kg)
    for c in range(3):
        if c == 1:
            rgb[:, :, 1] = np.where(edge, rgb[:, :, 1] - excess_g * 0.85, rgb[:, :, 1])
        else:
            rgb[:, :, c] = np.where(edge, rgb[:, :, c] + excess_g * 0.08, rgb[:, :, c])
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    return out


def chroma_frame(frame: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    rgb = frame[:, :, :3]
    a = alpha_green(rgb, key)
    rgba = np.zeros((frame.shape[0], frame.shape[1], 4), dtype=np.uint8)
    rgba[:, :, :3] = rgb
    rgba[:, :, 3] = (a * 255).astype(np.uint8)
    rgba = flood_green(rgba, key)
    rgba = scrub_remaining_green(rgba, key)
    rgba = scrub_green_spill(rgba, key)
    rgba = despill_green(rgba, key)
    rgba[rgba[:, :, 3] < 24, 3] = 0
    rgba[rgba[:, :, 3] < 24, :3] = 0
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


def trim_cells_width(cells: list[np.ndarray], pad: int = 4) -> tuple[list[np.ndarray], int, int]:
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


def pick_cols(n: int, cw: int, ch: int) -> int:
    best, score = 6, 1e18
    for cols in range(5, 10):
        rows = int(math.ceil(n / cols))
        sw = cols * cw
        if sw > MAX_SHEET_W:
            continue
        s = max(sw, rows * ch)
        if s < score:
            score, best = s, cols
    return best


def frame_sig(cell: np.ndarray) -> np.ndarray:
    a = cell[:, :, 3].astype(np.float32) / 255.0
    rgb = cell[:, :, :3].astype(np.float32)
    weighted = (rgb * a[..., None]).sum(axis=2)
    small = Image.fromarray(weighted.clip(0, 255).astype(np.uint8)).resize(
        (56, 56), Image.Resampling.BILINEAR
    )
    return np.array(small, dtype=np.float32) / 255.0


def find_loop_window(cells: list[np.ndarray]) -> tuple[int, int, float]:
    n = len(cells)
    sigs = [frame_sig(c) for c in cells]
    best_start, best_end, best_score = 0, n, 1e18
    for start in range(0, max(1, n - MIN_LOOP_FRAMES)):
        for end in range(start + MIN_LOOP_FRAMES, n + 1):
            length = end - start
            closure = float(np.mean((sigs[start] - sigs[end - 1]) ** 2))
            if end - start >= 3:
                vel_in = sigs[start + 1] - sigs[start]
                vel_out = sigs[end - 1] - sigs[end - 2]
                motion = float(np.mean((vel_in - vel_out) ** 2))
            else:
                motion = 0.0
            length_penalty = 0.00008 * max(0, 44 - length) ** 2
            score = closure + motion * 0.35 + length_penalty
            if score < best_score:
                best_score = score
                best_start, best_end = start, end
    return best_start, best_end, best_score


def green_opaque_count(cell: np.ndarray) -> int:
    a = cell[:, :, 3]
    r = cell[:, :, 0].astype(int)
    g = cell[:, :, 1].astype(int)
    b = cell[:, :, 2].astype(int)
    return int(((g > r + 14) & (g > b + 10) & (a > 80)).sum())


def build_main_sheet() -> dict:
    if not os.path.isfile(VIDEO):
        print("Video missing:", VIDEO, file=sys.stderr)
        raise SystemExit(1)

    meta = iio.immeta(VIDEO, plugin="pyav")
    src_fps = float(meta.get("fps", 24) or 24)
    step = max(1, int(round(src_fps / TARGET_FPS)))

    raw: list[np.ndarray] = []
    for i, frame in enumerate(iio.imiter(VIDEO, plugin="pyav")):
        if i % step != 0:
            continue
        if frame.shape[2] == 4:
            frame = frame[:, :, :3]
        raw.append(frame)

    if len(raw) < 8:
        print("Too few frames", file=sys.stderr)
        raise SystemExit(1)

    key = sample_green_key(raw)
    print("main key rgb", key)

    chroma = [chroma_frame(f, key) for f in raw]
    boxes = [alpha_bbox(c) for c in chroma]
    gx0 = max(0, min(b[0] for b in boxes) - PAD)
    gy0 = max(0, min(b[1] for b in boxes) - PAD)
    gx1 = min(chroma[0].shape[1], max(b[2] for b in boxes) + PAD)
    gy1 = min(chroma[0].shape[0], max(b[3] for b in boxes) + PAD)

    crops = [resize_h(c[gy0:gy1, gx0:gx1], TARGET_H) for c in chroma]
    cells, cell_w, cell_h = align_crops_foot(crops)
    cells, cell_w, cell_h = trim_cells_width(cells)

    loop_start, loop_end_idx, closure = find_loop_window(cells)
    cells = cells[loop_start:loop_end_idx]

    green_px = sum(green_opaque_count(c) for c in cells)
    opaque_px = sum(int((c[:, :, 3] > 80).sum()) for c in cells)
    print(
        "main loop window",
        loop_start,
        "->",
        loop_end_idx,
        "len",
        len(cells),
        "closure",
        round(closure, 6),
    )
    print("green opaque px", green_px, "of", opaque_px)

    n = len(cells)
    cols = pick_cols(n, cell_w, cell_h)
    rows = int(math.ceil(n / cols))
    sheet = np.zeros((rows * cell_h, cols * cell_w, 4), dtype=np.uint8)
    for idx, cell in enumerate(cells):
        c, r = idx % cols, idx // cols
        x, y = c * cell_w, r * cell_h
        sheet[y : y + cell_h, x : x + cell_w] = cell

    os.makedirs(OUT_DIR, exist_ok=True)
    Image.fromarray(sheet, "RGBA").save(
        SHEET_WEBP, quality=WEBP_QUALITY, method=6, lossless=False
    )

    main = {
        "sheet": "gece-ejder-main.webp",
        "frameWidth": cell_w,
        "frameHeight": cell_h,
        "cols": cols,
        "rows": rows,
        "frameCount": n,
        "loopEnd": n,
        "fps": TARGET_FPS,
        "blendFrames": 0,
        "sheetWidth": cols * cell_w,
        "sheetHeight": rows * cell_h,
        "anchor": "bottom",
    }
    mb = os.path.getsize(SHEET_WEBP) / (1024 * 1024)
    print("main frames", n, "cell", cell_w, "x", cell_h)
    print("main sheet", main["sheetWidth"], "x", main["sheetHeight"], "webp", round(mb, 2), "MB")
    return main


def write_manifest(main: dict) -> None:
    store = {
        "version": 4,
        "base": "hero/dark_dragon/sprite/",
        "sheet": "gece-ejder-idle.webp",
        "frameWidth": 318,
        "frameHeight": 278,
        "cols": 6,
        "rows": 8,
        "frameCount": 44,
        "loopEnd": 36,
        "fps": 12,
        "blendFrames": 8,
        "sheetWidth": 1908,
        "sheetHeight": 2224,
        "anchor": "center",
    }
    if os.path.isfile(STORE_MANIFEST):
        with open(STORE_MANIFEST, encoding="utf-8") as f:
            store = json.load(f)

    combined = {
        "version": 5,
        "base": "hero/dark_dragon/sprite/",
        "sheet": store.get("sheet", "gece-ejder-idle.webp"),
        "frameWidth": store["frameWidth"],
        "frameHeight": store["frameHeight"],
        "cols": store["cols"],
        "rows": store["rows"],
        "frameCount": store["frameCount"],
        "loopEnd": store["loopEnd"],
        "fps": store.get("fps", 12),
        "blendFrames": store.get("blendFrames", 8),
        "sheetWidth": store["sheetWidth"],
        "sheetHeight": store["sheetHeight"],
        "anchor": store.get("anchor", "center"),
        "main": main,
        "scale": {"store": 1.14, "detail": 1.38, "main": 1.32},
    }
    with open(STORE_MANIFEST, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2)
    js = "/* AUTO: scripts/build-gece-ejder-main-sprite.py */\n"
    js += "window.NOVA_GECE_EJDER_SPRITE_BASE=" + json.dumps(combined["base"]) + ";\n"
    js += "window.NOVA_GECE_EJDER_SPRITE_MANIFEST = "
    js += json.dumps(combined, separators=(",", ":")) + ";\n"
    with open(MANIFEST_JS, "w", encoding="utf-8") as f:
        f.write(js)


def main() -> int:
    main_data = build_main_sheet()
    write_manifest(main_data)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

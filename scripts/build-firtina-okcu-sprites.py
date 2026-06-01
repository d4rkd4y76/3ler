#!/usr/bin/env python3
"""Fırtına Okçusu — vitrin, ana ekran, DOĞRU -> seamless WebP sprite sheets."""
from __future__ import annotations

import glob
import json
import math
import os
import sys
from collections import deque

import imageio.v3 as iio
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERO_DIR = os.path.join(ROOT, "hero", "firtina_okcusu")
OUT_DIR = os.path.join(HERO_DIR, "sprite")
TRUE_DIR = os.path.join(OUT_DIR, "true")
MANIFEST_JS = os.path.join(ROOT, "js", "ui", "012aa-nova-firtina-okcu-sprite-manifest.js")
TRUE_MANIFEST_JS = os.path.join(ROOT, "js", "ui", "012ac-nova-firtina-okcu-true-manifest.js")
MANIFEST_JSON = os.path.join(OUT_DIR, "manifest.json")

MAX_SHEET_W = 4096
WEBP_QUALITY = 93


def find_video(*patterns: str) -> str:
    for pat in patterns:
        hits = glob.glob(os.path.join(HERO_DIR, pat))
        if hits:
            return hits[0]
    return os.path.join(HERO_DIR, patterns[0])


VITRIN_VIDEO = find_video("firtina_okcusu_vitrin.mp4", "*vitrin*.mp4")
MAIN_VIDEO = find_video("firtina_okcusu_ana_ekran.mp4", "*ana_ekran*.mp4")
TRUE_VIDEO = find_video("DOGRU.mp4", "DO?RU.mp4", "*dogru*.mp4", "*DO*RU*.mp4")


def sample_green_key(frames: list[np.ndarray]) -> tuple[int, int, int]:
    keys = []
    for f in frames[:8]:
        h, w = f.shape[:2]
        m = max(12, min(h, w) // 12)
        strips = [f[:m, :, :3], f[h - m :, :, :3], f[:, :m, :3], f[:, w - m :, :3]]
        px = np.concatenate([s.reshape(-1, 3) for s in strips], axis=0)
        keys.append(np.median(px, axis=0))
    return tuple(int(x) for x in np.median(keys, axis=0))


def color_dist(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    kr, kg, kb = key
    return np.sqrt((r - kr) ** 2 + (g - kg) ** 2 * 1.4 + (b - kb) ** 2)


def is_greenish(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    d = color_dist(rgb, key)
    return (g > r + 12) & (g > b + 8) & (g > 42) & (d < 105)


def is_foreground(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    green = is_greenish(rgb, key)
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    return (~green) & ((lum > 32) | (sat > 18))


def alpha_green(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    d = color_dist(rgb, key)
    a = np.clip((d - 22.0) / 38.0, 0.0, 1.0)
    a[is_greenish(rgb, key)] = 0.0
    fg = is_foreground(rgb, key)
    a[fg] = np.maximum(a[fg], 0.95)
    return a


def flood_green(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    h, w = out.shape[:2]
    bg = is_greenish(out[:, :, :3], key) & ~is_foreground(out[:, :, :3], key)
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


def despill_green(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    a = out[:, :, 3].astype(np.float32) / 255.0
    edge = (a > 0.03) & (a < 0.96)
    if not np.any(edge):
        return out
    rgb = out[:, :, :3].astype(np.float32)
    kg = float(key[1])
    excess = np.maximum(0.0, rgb[:, :, 1] - kg)
    rgb[:, :, 1] = np.where(edge, rgb[:, :, 1] - excess * 0.88, rgb[:, :, 1])
    rgb[:, :, 0] = np.where(edge, rgb[:, :, 0] + excess * 0.08, rgb[:, :, 0])
    rgb[:, :, 2] = np.where(edge, rgb[:, :, 2] + excess * 0.08, rgb[:, :, 2])
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    return out


def chroma_frame(frame: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    rgb = frame[:, :, :3]
    a = alpha_green(rgb, key)
    rgba = np.zeros((frame.shape[0], frame.shape[1], 4), dtype=np.uint8)
    rgba[:, :, :3] = rgb
    rgba[:, :, 3] = (a * 255).astype(np.uint8)
    rgba = flood_green(rgba, key)
    rgba = despill_green(rgba, key)
    rgba[rgba[:, :, 3] < 22, 3] = 0
    rgba[rgba[:, :, 3] < 22, :3] = 0
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


def place_center(crop: np.ndarray, cw: int, ch: int) -> np.ndarray:
    cell = np.zeros((ch, cw, 4), dtype=np.uint8)
    fh, fw = crop.shape[:2]
    ox = (cw - fw) // 2
    oy = (ch - fh) // 2
    cell[oy : oy + fh, ox : ox + fw] = crop
    return cell


def align_foot(crops: list[np.ndarray]) -> tuple[list[np.ndarray], int, int]:
    ch = max(c.shape[0] for c in crops)
    cw = max(c.shape[1] for c in crops)
    cells = []
    for crop in crops:
        cell = np.zeros((ch, cw, 4), dtype=np.uint8)
        fh, fw = crop.shape[:2]
        ox = (cw - fw) // 2
        oy = ch - fh
        cell[oy : oy + fh, ox : ox + fw] = crop
        cells.append(cell)
    return cells, cw, ch


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
    for cols in range(4, 10):
        rows = int(math.ceil(n / cols))
        sw = cols * cw
        if sw > MAX_SHEET_W:
            continue
        s = max(sw, rows * ch)
        if s < score:
            score, best = s, cols
    return best


def pack_sheet(cells: list[np.ndarray], cell_w: int, cell_h: int) -> tuple[np.ndarray, int, int]:
    n = len(cells)
    cols = pick_cols(n, cell_w, cell_h)
    rows = int(math.ceil(n / cols))
    sheet = np.zeros((rows * cell_h, cols * cell_w, 4), dtype=np.uint8)
    for idx, cell in enumerate(cells):
        c, r = idx % cols, idx // cols
        x, y = c * cell_w, r * cell_h
        sheet[y : y + cell_h, x : x + cell_w] = cell
    return sheet, cols, rows


def read_frames(video: str, target_fps: int, max_frames: int | None) -> list[np.ndarray]:
    if not os.path.isfile(video):
        print("Missing:", video, file=sys.stderr)
        raise SystemExit(1)
    meta = iio.immeta(video, plugin="pyav")
    src_fps = float(meta.get("fps", 24) or 24)
    step = max(1, int(round(src_fps / target_fps)))
    raw: list[np.ndarray] = []
    for i, frame in enumerate(iio.imiter(video, plugin="pyav")):
        if i % step != 0:
            continue
        if frame.shape[2] == 4:
            frame = frame[:, :, :3]
        raw.append(frame)
        if max_frames and len(raw) >= max_frames:
            break
    if len(raw) < 4:
        print("Too few frames in", video, file=sys.stderr)
        raise SystemExit(1)
    return raw


def build_loop_sheet(
    video: str,
    out_webp: str,
    *,
    target_fps: int = 12,
    max_frames: int = 36,
    blend_frames: int = 8,
    target_h: int = 288,
    pad: int = 8,
    foot_align: bool = False,
    anchor: str = "center",
) -> dict:
    raw = read_frames(video, target_fps, max_frames)
    key = sample_green_key(raw)
    print("  key", key, "frames", len(raw), "from", os.path.basename(video))

    chroma = [chroma_frame(f, key) for f in raw]
    boxes = [alpha_bbox(c) for c in chroma]
    gx0 = max(0, min(b[0] for b in boxes) - pad)
    gy0 = max(0, min(b[1] for b in boxes) - pad)
    gx1 = min(chroma[0].shape[1], max(b[2] for b in boxes) + pad)
    gy1 = min(chroma[0].shape[0], max(b[3] for b in boxes) + pad)
    crops = [resize_h(c[gy0:gy1, gx0:gx1], target_h) for c in chroma]

    if foot_align:
        cells, cell_w, cell_h = align_foot(crops)
    else:
        cell_h = max(c.shape[0] for c in crops)
        cell_w = max(c.shape[1] for c in crops)
        cells = [place_center(c, cell_w, cell_h) for c in crops]

    first, last = cells[0], cells[-1]
    for bi in range(1, blend_frames + 1):
        t = bi / (blend_frames + 1)
        cells.append(blend_cells(last, first, t))

    sheet, cols, rows = pack_sheet(cells, cell_w, cell_h)
    os.makedirs(os.path.dirname(out_webp), exist_ok=True)
    Image.fromarray(sheet, "RGBA").save(out_webp, quality=WEBP_QUALITY, method=6, lossless=False)

    loop_end = len(crops)
    mb = os.path.getsize(out_webp) / (1024 * 1024)
    print(
        "  ->",
        os.path.basename(out_webp),
        loop_end,
        "f +",
        blend_frames,
        "blend",
        cell_w,
        "x",
        cell_h,
        round(mb, 2),
        "MB",
    )
    return {
        "sheet": os.path.basename(out_webp),
        "frameWidth": cell_w,
        "frameHeight": cell_h,
        "cols": cols,
        "rows": rows,
        "frameCount": len(cells),
        "loopEnd": loop_end,
        "fps": target_fps,
        "blendFrames": blend_frames,
        "sheetWidth": cols * cell_w,
        "sheetHeight": rows * cell_h,
        "anchor": anchor,
    }


def build_true_sheet(video: str, out_webp: str) -> dict:
    target_fps = 20
    target_count = 72
    raw = read_frames(video, target_fps, None)
    if len(raw) > target_count:
        idx = np.linspace(0, len(raw) - 1, target_count)
        raw = [raw[int(round(i))] for i in idx]

    key = sample_green_key(raw)
    print("  true key", key, "frames", len(raw))

    chroma = [chroma_frame(f, key) for f in raw]
    boxes = [alpha_bbox(c, 20) for c in chroma]
    gx0 = max(0, min(b[0] for b in boxes) - 6)
    gy0 = max(0, min(b[1] for b in boxes) - 28)
    gx1 = min(chroma[0].shape[1], max(b[2] for b in boxes) + 6)
    gy1 = min(chroma[0].shape[0], max(b[3] for b in boxes) + 40)
    crops = [resize_h(c[gy0:gy1, gx0:gx1], 300) for c in chroma]
    cells, cell_w, cell_h = align_foot(crops)
    sheet, cols, rows = pack_sheet(cells, cell_w, cell_h)

    os.makedirs(os.path.dirname(out_webp), exist_ok=True)
    Image.fromarray(sheet, "RGBA").save(out_webp, quality=91, method=6, lossless=False)

    n = len(cells)
    mb = os.path.getsize(out_webp) / (1024 * 1024)
    print("  ->", os.path.basename(out_webp), n, "frames", cell_w, "x", cell_h, round(mb, 2), "MB")
    return {
        "id": "dogru",
        "sheet": os.path.basename(out_webp),
        "frameWidth": cell_w,
        "frameHeight": cell_h,
        "cols": cols,
        "rows": rows,
        "frameCount": n,
        "loopEnd": n,
        "fps": target_fps,
        "routine": 0,
    }


def write_js(path: str, preamble: str, assignments: list[str]) -> None:
    body = preamble + "\n"
    for line in assignments:
        body += line + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(body)


def main() -> int:
    print("Vitrin:", VITRIN_VIDEO)
    print("Ana ekran:", MAIN_VIDEO)
    print("DOGRU:", TRUE_VIDEO)

    idle = build_loop_sheet(
        VITRIN_VIDEO,
        os.path.join(OUT_DIR, "firtina-okcu-idle.webp"),
        target_fps=12,
        max_frames=36,
        blend_frames=8,
        target_h=290,
        foot_align=False,
        anchor="center",
    )

    main_data = build_loop_sheet(
        MAIN_VIDEO,
        os.path.join(OUT_DIR, "firtina-okcu-main.webp"),
        target_fps=12,
        max_frames=None,
        blend_frames=8,
        target_h=300,
        foot_align=True,
        anchor="bottom",
    )

    true_clip = build_true_sheet(
        TRUE_VIDEO,
        os.path.join(TRUE_DIR, "firtina-okcu-true-dogru.webp"),
    )

    combined = {
        "version": 1,
        "base": "hero/firtina_okcusu/sprite/",
        "sheet": idle["sheet"],
        "frameWidth": idle["frameWidth"],
        "frameHeight": idle["frameHeight"],
        "cols": idle["cols"],
        "rows": idle["rows"],
        "frameCount": idle["frameCount"],
        "loopEnd": idle["loopEnd"],
        "fps": idle["fps"],
        "blendFrames": idle["blendFrames"],
        "sheetWidth": idle["sheetWidth"],
        "sheetHeight": idle["sheetHeight"],
        "anchor": idle["anchor"],
        "main": main_data,
        "scale": {"store": 1.12, "detail": 1.5, "main": 1.42},
    }

    true_root = {
        "version": 1,
        "base": "hero/firtina_okcusu/sprite/true/",
        "clips": [true_clip],
    }

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(MANIFEST_JSON, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2)

    write_js(
        MANIFEST_JS,
        "/* AUTO: scripts/build-firtina-okcu-sprites.py */",
        [
            'window.NOVA_FIRTINA_OKCU_SPRITE_BASE="hero/firtina_okcusu/sprite/";',
            "window.NOVA_FIRTINA_OKCU_SPRITE_MANIFEST = "
            + json.dumps(combined, separators=(",", ":"))
            + ";",
        ],
    )

    write_js(
        TRUE_MANIFEST_JS,
        "/* AUTO: scripts/build-firtina-okcu-sprites.py */",
        [
            'window.NOVA_FIRTINA_OKCU_TRUE_BASE="hero/firtina_okcusu/sprite/true/";',
            "window.NOVA_FIRTINA_OKCU_TRUE_MANIFEST = "
            + json.dumps(true_root, separators=(",", ":"))
            + ";",
        ],
    )

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

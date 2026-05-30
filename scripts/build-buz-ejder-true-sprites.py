#!/usr/bin/env python3
"""Buz Ejderi doğru cevap klipleri -> temiz alpha WebP sprite (yazı korumalı)."""
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
TRUE_DIR = os.path.join(ROOT, "hero", "ice_dragon", "true")
OUT_DIR = os.path.join(ROOT, "hero", "ice_dragon", "sprite", "true")
MANIFEST_JS = os.path.join(ROOT, "js", "ui", "012tb-nova-buz-ejder-true-manifest.js")

TARGET_FPS = 18
TARGET_FRAME_COUNT = 64
TARGET_H = 300
MAX_SHEET_W = 4096
BBOX_THR = 4
H_MARGIN = 0.0
PAD_TOP = 12
PAD_BOTTOM = 32
WEBP_QUALITY = 89

CLIP_SPECS = [
    ("cok_iyiydi", "cok_iyiydi.mp4", "buz-ejder-true-cok-iyiydi.webp", 0),
    ("iste_bu", "iste_bu.mp4", "buz-ejder-true-iste-bu.webp", 1),
    ("mukemmel", "mukemmel.mp4", "buz-ejder-true-mukemmel.webp", 2),
]


def resolve_video(name: str) -> str:
    exact = os.path.join(TRUE_DIR, name)
    if os.path.isfile(exact):
        return exact
    stem = os.path.splitext(name)[0]
    hits = glob.glob(os.path.join(TRUE_DIR, stem + ".mp4"))
    if hits:
        return hits[0]
    for h in glob.glob(os.path.join(TRUE_DIR, "*.mp4")):
        if stem in os.path.basename(h).lower().replace("ü", "u").replace("ö", "o"):
            return h
    return exact


def sample_green_key(frames: list[np.ndarray]) -> tuple[int, int, int]:
    keys = []
    for f in frames[:10]:
        h, w = f.shape[:2]
        m = 16
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
    return np.sqrt((r - kr) ** 2 + (g - kg) ** 2 * 1.5 + (b - kb) ** 2)


def is_pure_green_bg(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    d = color_dist(rgb, key)
    return (g > r + 14) & (g > b + 10) & (g > 48) & (d < 98)


def is_greenish(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    d = color_dist(rgb, key)
    green_dom = g - np.maximum(r, b)
    return is_pure_green_bg(rgb, key) | (
        (green_dom > 5) & (g > 40) & (d < 118)
    )


def is_buz_foreground(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    green = is_greenish(rgb, key)
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    green_dom = g - np.maximum(r, b)

    light_text = (lum > 125) & (green_dom < 22) & ~green
    ice_dragon = (
        (b > r + 4)
        & (sat > 16)
        & (green_dom < 28)
        & (lum > 28)
        & ~green
    )
    colored = (sat > 24) & (green_dom < 18) & (lum > 35) & ~green
    dark_ink = (lum < 92) & (sat > 10) & (green_dom < 12) & ~green
    frost = (b > 70) & (g > 50) & (r < 180) & ~green
    return light_text | ice_dragon | colored | dark_ink | frost


def alpha_green(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    d = color_dist(rgb, key)
    a = np.clip((d - 20.0) / 40.0, 0.0, 1.0)
    a[is_greenish(rgb, key)] = 0.0
    fg = is_buz_foreground(rgb, key)
    a[fg] = np.maximum(a[fg], 0.94)
    return a


def flood_green(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    h, w = out.shape[:2]
    bg = is_greenish(out[:, :, :3], key) & ~is_buz_foreground(out[:, :, :3], key)
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
    kill = is_greenish(out[:, :, :3], key) & (out[:, :, 3] > 0)
    out[kill, 3] = 0
    out[kill, :3] = 0
    return out


def scrub_green_spill(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    rgb = out[:, :, :3].astype(np.float32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    spill = (
        (g > r + 8)
        & (g > b + 5)
        & (lum > 30)
        & (lum < 150)
        & (out[:, :, 3] > 0)
        & ~is_buz_foreground(out[:, :, :3], key)
    )
    out[spill, 3] = 0
    out[spill, :3] = 0
    return out


def despill_green(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    a = out[:, :, 3].astype(np.float32) / 255.0
    edge = (a > 0.04) & (a < 0.96)
    if not np.any(edge):
        return out
    rgb = out[:, :, :3].astype(np.float32)
    kg = float(key[1])
    excess_g = np.maximum(0.0, rgb[:, :, 1] - kg)
    for c in range(3):
        if c == 1:
            rgb[:, :, 1] = np.where(edge, rgb[:, :, 1] - excess_g * 0.82, rgb[:, :, 1])
        else:
            rgb[:, :, c] = np.where(edge, rgb[:, :, c] + excess_g * 0.07, rgb[:, :, c])
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


def alpha_bbox(rgba: np.ndarray, thr: int = 28) -> tuple[int, int, int, int]:
    ys, xs = np.where(rgba[:, :, 3] > thr)
    if len(xs) == 0:
        h, w = rgba.shape[:2]
        return 0, 0, w, h
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def stage_frames(chroma: list[np.ndarray]) -> list[np.ndarray]:
    """Tek global sahne: yatayda tam genişlik, dikeyde birleşik kırpma."""
    fh, fw = chroma[0].shape[:2]
    mx = max(0, int(fw * H_MARGIN))
    boxes = [alpha_bbox(c, thr=BBOX_THR) for c in chroma]
    y0 = max(0, min(b[1] for b in boxes) - PAD_TOP)
    y1 = min(fh, max(b[3] for b in boxes) + PAD_BOTTOM)
    return [c[y0:y1, mx : fw - mx] for c in chroma]


def subsample_frames(frames: list[np.ndarray], target: int) -> list[np.ndarray]:
    if len(frames) <= target:
        return frames
    idx = np.linspace(0, len(frames) - 1, target)
    return [frames[int(round(i))] for i in idx]


def resize_h(rgba: np.ndarray, h: int) -> np.ndarray:
    w = max(1, int(round(rgba.shape[1] * h / rgba.shape[0])))
    return np.array(Image.fromarray(rgba, "RGBA").resize((w, h), Image.Resampling.LANCZOS))


def place_cell(crop: np.ndarray, cw: int, ch: int) -> np.ndarray:
    cell = np.zeros((ch, cw, 4), dtype=np.uint8)
    fh, fw = crop.shape[:2]
    ox = max(0, (cw - fw) // 2)
    oy = max(0, ch - fh)
    cell[oy : oy + fh, ox : ox + fw] = crop
    return cell


def finalize_cell(cell: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = cell.copy()
    kill = is_greenish(out[:, :, :3], key) | (out[:, :, 3] < 28)
    out[kill, 3] = 0
    out[kill, :3] = 0
    return out


def pick_cols(n: int, cw: int) -> int:
    best, score = 4, 1e18
    for cols in range(3, 13):
        rows = int(math.ceil(n / cols))
        sw = cols * cw
        if sw > MAX_SHEET_W:
            continue
        s = sw * rows * cw
        if s < score:
            score, best = s, cols
    return best


def build_clip(spec: tuple[str, str, str, int], key_hint: tuple[int, int, int] | None) -> dict:
    cid, src_name, out_name, routine = spec
    video = resolve_video(src_name)
    if not os.path.isfile(video):
        raise FileNotFoundError(video)

    meta = iio.immeta(video, plugin="pyav")

    all_raw: list[np.ndarray] = []
    for frame in iio.imiter(video, plugin="pyav"):
        if frame.shape[2] == 4:
            frame = frame[:, :, :3]
        all_raw.append(frame)

    raw = subsample_frames(all_raw, TARGET_FRAME_COUNT)
    if len(raw) < 4:
        raise RuntimeError("too few frames: " + video)

    key = key_hint or sample_green_key(raw)
    chroma = [chroma_frame(f, key) for f in raw]
    staged = stage_frames(chroma)
    crops = [resize_h(c, TARGET_H) for c in staged]
    cell_h = max(c.shape[0] for c in crops)
    cell_w = max(c.shape[1] for c in crops)
    cells = [finalize_cell(place_cell(c, cell_w, cell_h), key) for c in crops]

    n = len(cells)
    cols = pick_cols(n, cell_w)
    rows = int(math.ceil(n / cols))
    sheet_w, sheet_h = cols * cell_w, rows * cell_h
    sheet = np.zeros((sheet_h, sheet_w, 4), dtype=np.uint8)
    for idx, cell in enumerate(cells):
        c, r = idx % cols, idx // cols
        x, y = c * cell_w, r * cell_h
        sheet[y : y + cell_h, x : x + cell_w] = cell

    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, out_name)
    Image.fromarray(sheet, "RGBA").save(
        out_path, quality=WEBP_QUALITY, method=6, lossless=False
    )

    mb = os.path.getsize(out_path) / (1024 * 1024)
    sample = cells[0]
    ca = sample[:, :, 3]
    transp = (ca == 0).sum() / ca.size * 100
    print(
        cid,
        "frames",
        n,
        "cell",
        cell_w,
        "x",
        cell_h,
        "transp%",
        round(transp, 1),
        "MB",
        round(mb, 2),
    )

    return {
        "id": cid,
        "routine": routine,
        "sheet": out_name,
        "frameWidth": cell_w,
        "frameHeight": cell_h,
        "cols": cols,
        "rows": rows,
        "frameCount": n,
        "loopEnd": n,
        "fps": TARGET_FPS,
        "blendFrames": 0,
        "sheetWidth": sheet_w,
        "sheetHeight": sheet_h,
        "anchor": "bottom",
    }


def main() -> int:
    if not os.path.isdir(TRUE_DIR):
        print("Missing:", TRUE_DIR, file=sys.stderr)
        return 1

    sample_video = resolve_video(CLIP_SPECS[0][1])
    probe = []
    for i, frame in enumerate(iio.imiter(sample_video, plugin="pyav")):
        if i >= 10:
            break
        probe.append(frame[:, :, :3])
    key = sample_green_key(probe)
    print("green key", key)

    clips = []
    for spec in CLIP_SPECS:
        clips.append(build_clip(spec, key))

    manifest = {
        "version": 3,
        "base": "hero/ice_dragon/sprite/true/",
        "fps": TARGET_FPS,
        "scale": {"sp": 1.0},
        "clips": clips,
    }

    js = "/* AUTO: scripts/build-buz-ejder-true-sprites.py */\n"
    js += "window.NOVA_BUZ_EJDER_TRUE_BASE=" + json.dumps(manifest["base"]) + ";\n"
    js += "window.NOVA_BUZ_EJDER_TRUE_MANIFEST="
    js += json.dumps(manifest, separators=(",", ":")) + ";\n"
    with open(MANIFEST_JS, "w", encoding="utf-8") as f:
        f.write(js)

    print("manifest", MANIFEST_JS)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Ejderha yumurtası — yeşil ekran MP4 -> WebP sprite + manifest.js"""
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
OUT_BASE = os.path.join(ROOT, "assets", "dragon-eggs")
MANIFEST_JS = os.path.join(ROOT, "js", "ui", "nova-dragon-egg-manifest.js")

TARGET_FPS_CRACK = 24
TARGET_FPS_HUB = 12
TARGET_H_CRACK = 320
TARGET_H_HUB = 280
MAX_SHEET_W = 4096
PAD = 8
BLEND_HUB = 8

JOBS = [
    {
        "key": "fire",
        "video": os.path.join(ROOT, "egg_open", "firedragon_egg_open.mp4"),
        "out_dir": os.path.join(OUT_BASE, "fire"),
        "sheet": "fire-crack.webp",
        "profile": "crack",
        "fps": TARGET_FPS_CRACK,
        "target_h": TARGET_H_CRACK,
        "loop": False,
    },
    {
        "key": "ice",
        "video": os.path.join(ROOT, "egg_open", "icedragon_egg_open.mp4"),
        "out_dir": os.path.join(OUT_BASE, "ice"),
        "sheet": "ice-crack.webp",
        "profile": "crack",
        "fps": TARGET_FPS_CRACK,
        "target_h": TARGET_H_CRACK,
        "loop": False,
    },
    {
        "key": "night",
        "video": os.path.join(ROOT, "egg_open", "night_egg_open.mp4"),
        "out_dir": os.path.join(OUT_BASE, "night"),
        "sheet": "night-crack.webp",
        "profile": "crack",
        "fps": TARGET_FPS_CRACK,
        "target_h": TARGET_H_CRACK,
        "loop": False,
    },
    {
        "key": "hub",
        "video": os.path.join(ROOT, "ana_ekran_egg.mp4"),
        "out_dir": os.path.join(OUT_BASE, "hub"),
        "sheet": "hub-main.webp",
        "profile": "hub",
        "fps": TARGET_FPS_HUB,
        "target_h": TARGET_H_HUB,
        "loop": True,
    },
]


def sample_green_key(frames: list[np.ndarray]) -> tuple[int, int, int]:
    keys = []
    for f in frames[:8]:
        h, w = f.shape[:2]
        m = 14
        strips = [f[:m, :, :3], f[h - m :, :, :3], f[:, :m, :3], f[:, w - m :, :3]]
        px = np.concatenate([s.reshape(-1, 3) for s in strips], axis=0)
        keys.append(np.median(px, axis=0))
    med = np.median(keys, axis=0)
    return tuple(int(x) for x in med)


def alpha_green(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    kr, kg, kb = key
    dist = np.sqrt((r - kr) ** 2 + (g - kg) ** 2 * 1.35 + (b - kb) ** 2)
    a = np.clip((dist - 24.0) / 36.0, 0.0, 1.0)
    green_dom = (g > r + 24) & (g > b + 24) & (g > 72)
    a[green_dom & (dist < 92)] = 0.0
    return a


def flood_green(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    h, w = out.shape[:2]
    rgb = out[:, :, :3].astype(np.float32)
    kr, kg, kb = key
    dist = np.sqrt((rgb[:, :, 0] - kr) ** 2 + (rgb[:, :, 1] - kg) ** 2 + (rgb[:, :, 2] - kb) ** 2)
    bg = (dist < 72) | ((rgb[:, :, 1] > rgb[:, :, 0] + 18) & (rgb[:, :, 1] > rgb[:, :, 2] + 18) & (dist < 108))
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


def chroma_frame(frame: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    rgb = frame[:, :, :3]
    a = alpha_green(rgb, key)
    rgba = np.zeros((frame.shape[0], frame.shape[1], 4), dtype=np.uint8)
    rgba[:, :, :3] = rgb
    rgba[:, :, 3] = (a * 255).astype(np.uint8)
    rgba = flood_green(rgba, key)
    rgba[rgba[:, :, 3] < 20, 3] = 0
    rgba[rgba[:, :, 3] < 20, :3] = 0
    return rgba


def alpha_bbox(rgba: np.ndarray, thr: int = 22) -> tuple[int, int, int, int]:
    ys, xs = np.where(rgba[:, :, 3] > thr)
    if len(xs) == 0:
        h, w = rgba.shape[:2]
        return 0, 0, w, h
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def resize_h(rgba: np.ndarray, h: int) -> np.ndarray:
    w = max(1, int(round(rgba.shape[1] * h / rgba.shape[0])))
    return np.array(Image.fromarray(rgba, "RGBA").resize((w, h), Image.Resampling.LANCZOS))


def align_center(crops: list[np.ndarray]) -> tuple[list[np.ndarray], int, int]:
    ch = max(c.shape[0] for c in crops)
    cw = max(c.shape[1] for c in crops)
    out: list[np.ndarray] = []
    for crop in crops:
        cell = np.zeros((ch, cw, 4), dtype=np.uint8)
        fh, fw = crop.shape[:2]
        ox = (cw - fw) // 2
        oy = (ch - fh) // 2
        cell[oy : oy + fh, ox : ox + fw] = crop
        out.append(cell)
    return out, cw, ch


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
    for cols in range(4, 12):
        rows = int(math.ceil(n / cols))
        sw = cols * cw
        if sw > MAX_SHEET_W:
            continue
        s = max(sw, rows * ch)
        if s < score:
            score, best = s, cols
    return best


def build_job(job: dict) -> dict:
    video = job["video"]
    if not os.path.isfile(video):
        print("Missing:", video, file=sys.stderr)
        raise SystemExit(1)

    meta = iio.immeta(video, plugin="pyav")
    src_fps = float(meta.get("fps", 24) or 24)
    step = max(1, int(round(src_fps / job["fps"])))

    raw: list[np.ndarray] = []
    for i, frame in enumerate(iio.imiter(video, plugin="pyav")):
        if i % step != 0:
            continue
        if frame.shape[2] == 4:
            frame = frame[:, :, :3]
        raw.append(frame)

    if len(raw) < 6:
        print("Too few frames:", video, file=sys.stderr)
        raise SystemExit(1)

    key = sample_green_key(raw)
    print(job["key"], "key", key, "frames", len(raw))

    chroma = [chroma_frame(f, key) for f in raw]
    boxes = [alpha_bbox(c) for c in chroma]
    gx0 = max(0, min(b[0] for b in boxes) - PAD)
    gy0 = max(0, min(b[1] for b in boxes) - PAD)
    gx1 = min(chroma[0].shape[1], max(b[2] for b in boxes) + PAD)
    gy1 = min(chroma[0].shape[0], max(b[3] for b in boxes) + PAD)

    crops = [resize_h(c[gy0:gy1, gx0:gx1], job["target_h"]) for c in chroma]
    cells, cell_w, cell_h = align_center(crops)
    content_n = len(cells)

    if job.get("loop"):
        first, last = cells[0], cells[-1]
        for bi in range(1, BLEND_HUB + 1):
            t = bi / (BLEND_HUB + 1)
            cells.append(blend_cells(last, first, t))

    n = len(cells)
    cols = pick_cols(n, cell_w, cell_h)
    rows = int(math.ceil(n / cols))
    sheet = np.zeros((rows * cell_h, cols * cell_w, 4), dtype=np.uint8)
    for idx, cell in enumerate(cells):
        c, r = idx % cols, idx // cols
        x, y = c * cell_w, r * cell_h
        sheet[y : y + cell_h, x : x + cell_w] = cell

    os.makedirs(job["out_dir"], exist_ok=True)
    out_path = os.path.join(job["out_dir"], job["sheet"])
    Image.fromarray(sheet, "RGBA").save(out_path, quality=91, method=6)

    loop_end = content_n if not job.get("loop") else content_n
    manifest = {
        "base": "assets/dragon-eggs/" + job["key"] + "/",
        "sheet": job["sheet"],
        "frameWidth": cell_w,
        "frameHeight": cell_h,
        "cols": cols,
        "rows": rows,
        "frameCount": n,
        "loopEnd": loop_end,
        "fps": job["fps"],
        "blendFrames": BLEND_HUB if job.get("loop") else 0,
        "sheetWidth": cols * cell_w,
        "sheetHeight": rows * cell_h,
        "anchor": "center",
        "playOnce": not job.get("loop"),
    }
    mb = os.path.getsize(out_path) / (1024 * 1024)
    print("  ->", out_path, round(mb, 2), "MB", manifest["frameWidth"], "x", manifest["frameHeight"], "frames", loop_end)
    return manifest


def write_manifest_js(all_manifests: dict) -> None:
    payload = {"version": 1, "base": "assets/dragon-eggs/", "eggs": all_manifests}
    js = "/* AUTO: scripts/build-dragon-egg-sprites.py */\n"
    js += "window.NOVA_DRAGON_EGG_MANIFEST = " + json.dumps(payload, separators=(",", ":")) + ";\n"
    with open(MANIFEST_JS, "w", encoding="utf-8") as f:
        f.write(js)
    with open(os.path.join(OUT_BASE, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)


def main() -> int:
    out: dict = {}
    for job in JOBS:
        out[job["key"]] = build_job(job)
    write_manifest_js(out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

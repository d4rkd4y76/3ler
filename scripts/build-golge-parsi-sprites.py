#!/usr/bin/env python3
"""Gölge Parsı — vitrin, ana ekran, DOĞRU -> seamless WebP sprite sheets."""
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
WEB_BASE = "hero/golge_parsi/sprite/"


def resolve_hero_dir() -> str:
    hero_root = os.path.join(ROOT, "hero")
    candidates: list[str] = []
    for name in ("gölge_parsı", "golge_parsi", "golge_parsı"):
        p = os.path.join(hero_root, name)
        if os.path.isdir(p):
            candidates.append(p)
    if os.path.isdir(hero_root):
        for name in os.listdir(hero_root):
            low = name.lower()
            if "pars" in low and ("golge" in low or "gölge" in low or "g\u00f6lge" in low):
                p = os.path.join(hero_root, name)
                if p not in candidates:
                    candidates.append(p)
    for p in candidates:
        if glob.glob(os.path.join(p, "*ana*ekran*.mp4")) or glob.glob(
            os.path.join(p, "*vitrin*.mp4")
        ):
            return p
    if candidates:
        return candidates[0]
    raise SystemExit("hero/gölge_parsı klasörü bulunamadı (vitrin + ana ekran + DOĞRU mp4)")


HERO_DIR = resolve_hero_dir()
OUT_DIR = os.path.join(ROOT, "hero", "golge_parsi", "sprite")
TRUE_DIR = os.path.join(OUT_DIR, "true")
MANIFEST_JS = os.path.join(ROOT, "js", "ui", "012am-nova-golge-parsi-sprite-manifest.js")
TRUE_MANIFEST_JS = os.path.join(ROOT, "js", "ui", "012ao-nova-golge-parsi-true-manifest.js")
MANIFEST_JSON = os.path.join(OUT_DIR, "manifest.json")

MAX_SHEET_W = 4096
WEBP_QUALITY = 93
MIN_LOOP_FRAMES = 28
TARGET_LOOP_FRAMES = 36


def find_video(*patterns: str) -> str:
    for pat in patterns:
        exact = os.path.join(HERO_DIR, pat)
        if os.path.isfile(exact):
            return exact
        hits = sorted(glob.glob(os.path.join(HERO_DIR, pat)))
        if hits:
            return hits[0]
    return os.path.join(HERO_DIR, patterns[0])


VITRIN_VIDEO = find_video("golge_parsi_vitrin.mp4", "gölge_parsı_vitrin.mp4", "*vitrin*.mp4", "*pars*vitrin*")
MAIN_VIDEO = find_video("golge_parsi_ana_ekran.mp4", "gölge_parsı_ana_ekran.mp4", "*ana_ekran*.mp4", "*pars*ana*")
TRUE_VIDEO = find_video("DOGRU.mp4", "DO?RU.mp4", "*dogru*.mp4", "*DO*RU*.mp4")


def sample_border_key(frames: list[np.ndarray]) -> tuple[int, int, int]:
    keys = []
    for f in frames[:8]:
        h, w = f.shape[:2]
        m = max(12, min(h, w) // 12)
        strips = [f[:m, :, :3], f[h - m :, :, :3], f[:, :m, :3], f[:, w - m :, :3]]
        px = np.concatenate([s.reshape(-1, 3) for s in strips], axis=0)
        keys.append(np.median(px, axis=0))
    return tuple(int(x) for x in np.median(keys, axis=0))


sample_green_key = sample_border_key


def color_dist(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    kr, kg, kb = key
    return np.sqrt((r - kr) ** 2 + (g - kg) ** 2 * 1.4 + (b - kb) ** 2)


def is_key_color(rgb: np.ndarray, key: tuple[int, int, int], tol: float = 108.0) -> np.ndarray:
    return color_dist(rgb, key) < tol


is_greenish = is_key_color


def is_foreground(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    keyish = is_key_color(rgb, key)
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    purple_glow = (b > 48) & (r > 38) & (g < np.maximum(r, b) * 0.95)
    dark_body = (lum < 95) & (sat > 10)
    return (~keyish) & ((lum > 32) | (sat > 18) | purple_glow | dark_body)


def alpha_chroma(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    d = color_dist(rgb, key)
    a = np.clip((d - 20.0) / 36.0, 0.0, 1.0)
    a[is_key_color(rgb, key)] = 0.0
    fg = is_foreground(rgb, key)
    a[fg] = np.maximum(a[fg], 0.95)
    return a


alpha_green = alpha_chroma


def flood_screen(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    h, w = out.shape[:2]
    bg = is_key_color(out[:, :, :3], key) & ~is_foreground(out[:, :, :3], key)
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


flood_green = flood_screen


def despill_key(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    a = out[:, :, 3].astype(np.float32) / 255.0
    edge = (a > 0.03) & (a < 0.96)
    if not np.any(edge):
        return out
    rgb = out[:, :, :3].astype(np.float32)
    kr, kg, kb = float(key[0]), float(key[1]), float(key[2])
    dominant = int(np.argmax([kr, kg, kb]))
    kvals = [kr, kg, kb]
    kv = kvals[dominant]
    excess = np.maximum(0.0, rgb[:, :, dominant] - kv)
    rgb[:, :, dominant] = np.where(edge, rgb[:, :, dominant] - excess * 0.9, rgb[:, :, dominant])
    for ch in range(3):
        if ch == dominant:
            continue
        rgb[:, :, ch] = np.where(edge, rgb[:, :, ch] + excess * 0.09, rgb[:, :, ch])
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    return out


despill_green = despill_key


def scrub_key_spill(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    d = color_dist(out[:, :, :3], key)
    spill = (
        (d < 92)
        & (out[:, :, 3] > 0)
        & ~is_foreground(out[:, :, :3], key)
    )
    out[spill, 3] = 0
    out[spill, :3] = 0
    return out


scrub_green_spill = scrub_key_spill


def scrub_remaining_green(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    kill = is_key_color(out[:, :, :3], key) & (out[:, :, 3] > 0)
    out[kill, 3] = 0
    out[kill, :3] = 0
    return out


def scrub_green_spill_fringe(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    """Yarı saydam kenarlardaki yeşil sızıntı — mor gövdeyi koru."""
    out = rgba.copy()
    rgb = out[:, :, :3].astype(np.float32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    gd = g - np.maximum(r, b)
    spill = (
        (g > r + 7)
        & (g > b + 5)
        & (gd > 4)
        & (lum > 26)
        & (lum < 175)
        & (out[:, :, 3] > 0)
        & ~is_foreground(out[:, :, :3], key)
    )
    out[spill, 3] = 0
    out[spill, :3] = 0
    return out


def scrub_purple_edge_green(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    """Mor parıltılı tüy kenarındaki yeşil hale — opaklığı düşür veya nötrle."""
    out = rgba.copy()
    rgb = out[:, :, :3].astype(np.float32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    a = out[:, :, 3].astype(np.float32)
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    gd = g - np.maximum(r, b)
    d = color_dist(out[:, :, :3], key)
    fg = is_foreground(out[:, :, :3], key)
    fringe = (
        (a > 14)
        & (a < 230)
        & (gd > 3)
        & (gd < 58)
        & (d < 88)
        & (b > r * 0.7)
        & fg
    )
    if not np.any(fringe):
        return out
    t = np.clip(gd / 42.0, 0.12, 0.9)[:, :, np.newaxis]
    target = np.stack(
        [
            np.clip(r * 0.92 + b * 0.12, 0, 255),
            np.clip(g - gd * 0.95, 0, 255),
            np.clip(b * 0.98 + r * 0.06, 0, 255),
        ],
        axis=-1,
    )
    rgb = np.where(fringe[:, :, np.newaxis], rgb * (1 - t) + target * t, rgb)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    kill = fringe & (gd > 14) & (a < 90)
    out[kill, 3] = 0
    out[kill, :3] = 0
    return out


def finalize_cell(cell: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = cell.copy()
    kill = is_key_color(out[:, :, :3], key) | (out[:, :, 3] < 28)
    out[kill, 3] = 0
    out[kill, :3] = 0
    return out


def chroma_frame(frame: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    rgb = frame[:, :, :3]
    a = alpha_green(rgb, key)
    rgba = np.zeros((frame.shape[0], frame.shape[1], 4), dtype=np.uint8)
    rgba[:, :, :3] = rgb
    rgba[:, :, 3] = (a * 255).astype(np.uint8)
    rgba = flood_screen(rgba, key)
    rgba = scrub_remaining_green(rgba, key)
    rgba = scrub_green_spill_fringe(rgba, key)
    rgba = scrub_key_spill(rgba, key)
    rgba = despill_key(rgba, key)
    rgba = scrub_purple_edge_green(rgba, key)
    rgba = scrub_remaining_green(rgba, key)
    rgba[rgba[:, :, 3] < 26, 3] = 0
    rgba[rgba[:, :, 3] < 26, :3] = 0
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


def frame_sig(cell: np.ndarray) -> np.ndarray:
    a = cell[:, :, 3].astype(np.float32) / 255.0
    rgb = cell[:, :, :3].astype(np.float32)
    weighted = (rgb * a[..., None]).sum(axis=2)
    small = Image.fromarray(weighted.clip(0, 255).astype(np.uint8)).resize(
        (56, 56), Image.Resampling.BILINEAR
    )
    return np.array(small, dtype=np.float32) / 255.0


def opaque_pixels(cell: np.ndarray, thr: int = 24) -> int:
    return int((cell[:, :, 3] > thr).sum())


def drop_empty_cells(cells: list[np.ndarray], min_px: int = 1400) -> list[np.ndarray]:
    out = [c for c in cells if opaque_pixels(c) >= min_px]
    return out if len(out) >= 8 else cells


def find_loop_window(cells: list[np.ndarray]) -> tuple[int, int, float]:
    n = len(cells)
    if n <= MIN_LOOP_FRAMES:
        return 0, n, 0.0
    sigs = [frame_sig(c) for c in cells]
    best_start, best_end, best_score = 0, n, 1e18
    for start in range(0, max(1, n - MIN_LOOP_FRAMES)):
        for end in range(start + MIN_LOOP_FRAMES, n + 1):
            length = end - start
            closure = float(np.mean((sigs[start] - sigs[end - 1]) ** 2))
            if length >= 3:
                vel_in = sigs[start + 1] - sigs[start]
                vel_out = sigs[end - 1] - sigs[end - 2]
                motion = float(np.mean((vel_in - vel_out) ** 2))
            else:
                motion = 0.0
            length_penalty = 0.00006 * max(0, TARGET_LOOP_FRAMES - length) ** 2
            score = closure + motion * 0.38 + length_penalty
            if score < best_score:
                best_score = score
                best_start, best_end = start, end
    return best_start, best_end, best_score


def refine_loop_start(cells: list[np.ndarray]) -> tuple[list[np.ndarray], float]:
    """İlk kareyi, son kareye en yakın içerik karesine kaydır (döngü sıçramasını azalt)."""
    n = len(cells)
    if n < MIN_LOOP_FRAMES + 2:
        return cells, 0.0
    sigs = [frame_sig(c) for c in cells]
    last = sigs[-1]
    best_i, best_score = 0, 1e18
    for i in range(0, n - MIN_LOOP_FRAMES + 1):
        score = float(np.mean((sigs[i] - last) ** 2))
        if score < best_score:
            best_score = score
            best_i = i
    if best_i > 0:
        cells = cells[best_i:]
        print("  loop refine start", best_i, "closure", round(best_score, 5))
    return cells, best_score


def find_seamless_cycle(cells: list[np.ndarray]) -> tuple[list[np.ndarray], float]:
    """Başlangıç ve bitiş karesi en yakın döngü dilimini seç; blend yok."""
    n = len(cells)
    if n <= MIN_LOOP_FRAMES:
        return cells, 0.0
    sigs = [frame_sig(c) for c in cells]
    best_score = 1e18
    best_start, best_end = 0, n - 1
    for start in range(0, n - MIN_LOOP_FRAMES + 1):
        for end in range(start + MIN_LOOP_FRAMES - 1, n):
            closure = float(np.mean((sigs[start] - sigs[end]) ** 2))
            length = end - start + 1
            len_pen = 0.00008 * (length - TARGET_LOOP_FRAMES) ** 2
            motion = 0.0
            if end > start + 1:
                va = sigs[start + 1] - sigs[start]
                vb = sigs[end] - sigs[end - 1]
                motion = float(np.mean((va - vb) ** 2)) * 0.22
            score = closure + len_pen + motion
            if score < best_score:
                best_score = score
                best_start, best_end = start, end
    out = [np.array(c, copy=True) for c in cells[best_start : best_end + 1]]
    print(
        "  seamless cycle",
        best_start,
        "->",
        best_end,
        "len",
        len(out),
        "closure",
        round(best_score, 5),
    )
    if best_score > 0.006:
        out[-1] = np.array(out[0], copy=True)
        print("  snap last=first (closure still > 0.006)")
    return out, best_score


def lock_cell_grid(
    cells: list[np.ndarray], target_w: int, target_h: int
) -> tuple[list[np.ndarray], int, int]:
    """Mevcut vitrin boyutlarına sabitle (254x290 vb.)."""
    out = []
    for cell in cells:
        fh, fw = cell.shape[:2]
        scale = min(target_w / max(fw, 1), target_h / max(fh, 1), 1.0)
        if scale < 0.999:
            nh = max(1, int(round(fh * scale)))
            nw = max(1, int(round(fw * scale)))
            cell = np.array(
                Image.fromarray(cell, "RGBA").resize((nw, nh), Image.Resampling.LANCZOS)
            )
        out.append(place_center(cell, target_w, target_h))
    return out, target_w, target_h


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


def read_frames(
    video: str,
    target_fps: int,
    max_frames: int | None,
    *,
    native_fps: bool = False,
) -> tuple[list[np.ndarray], int]:
    if not os.path.isfile(video):
        print("Missing:", video, file=sys.stderr)
        raise SystemExit(1)
    meta = iio.immeta(video, plugin="pyav")
    src_fps = float(meta.get("fps", 24) or 24)
    out_fps = max(12, int(round(src_fps)))
    step = 1 if native_fps else max(1, int(round(src_fps / max(target_fps, 1))))
    if not native_fps:
        out_fps = target_fps
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
    return raw, out_fps


def build_loop_sheet(
    video: str,
    out_webp: str,
    *,
    target_fps: int = 12,
    max_frames: int | None = 36,
    blend_frames: int = 8,
    target_h: int = 288,
    pad: int = 8,
    foot_align: bool = False,
    anchor: str = "center",
    optimize_loop: bool = True,
    lock_cell: tuple[int, int] | None = None,
    hard_seam: bool = False,
    native_fps: bool = False,
) -> dict:
    raw, out_fps = read_frames(video, target_fps, max_frames, native_fps=native_fps)
    key = sample_border_key(raw)
    print(
        "  key",
        key,
        "frames",
        len(raw),
        "fps",
        out_fps,
        "native" if native_fps else "sampled",
        "from",
        os.path.basename(video),
    )

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

    if not native_fps:
        cells = drop_empty_cells(cells)
    if hard_seam and len(cells) >= MIN_LOOP_FRAMES:
        cells, _ = find_seamless_cycle(cells)
        blend_frames = 0
    elif optimize_loop and len(cells) >= MIN_LOOP_FRAMES + 4:
        loop_start, loop_end_idx, closure = find_loop_window(cells)
        cells = cells[loop_start:loop_end_idx]
        print(
            "  loop window",
            loop_start,
            "->",
            loop_end_idx,
            "len",
            len(cells),
            "closure",
            round(closure, 5),
        )
        cells, _ = refine_loop_start(cells)

    cells = [finalize_cell(c, key) for c in cells]

    if lock_cell and lock_cell[0] and lock_cell[1]:
        cells, cell_w, cell_h = lock_cell_grid(cells, int(lock_cell[0]), int(lock_cell[1]))
        cells = [finalize_cell(c, key) for c in cells]
    elif not foot_align:
        cell_h = max(c.shape[0] for c in cells)
        cell_w = max(c.shape[1] for c in cells)
        cells = [place_center(c, cell_w, cell_h) for c in cells]

    loop_end = len(cells)
    if blend_frames > 0 and not hard_seam:
        first, last = cells[0], cells[-1]
        for bi in range(1, blend_frames + 1):
            t = bi / (blend_frames + 1)
            cells.append(blend_cells(last, first, t))

    sheet, cols, rows = pack_sheet(cells, cell_w, cell_h)
    os.makedirs(os.path.dirname(out_webp), exist_ok=True)
    Image.fromarray(sheet, "RGBA").save(out_webp, quality=WEBP_QUALITY, method=6, lossless=False)

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
        "fps": out_fps,
        "blendFrames": blend_frames,
        "sheetWidth": cols * cell_w,
        "sheetHeight": rows * cell_h,
        "anchor": anchor,
    }


def build_true_sheet(video: str, out_webp: str) -> dict:
    """Buz Ejder doğru klipleriyle aynı süre: 96 kare @ 20fps (~4.8sn)."""
    target_fps = 20
    target_count = 96
    raw, _ = read_frames(video, target_fps, None)
    if len(raw) > target_count:
        idx = np.linspace(0, len(raw) - 1, target_count)
        raw = [raw[int(round(i))] for i in idx]
    elif len(raw) < target_count and len(raw) > 0:
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
    cells = [finalize_cell(c, key) for c in cells]
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


def load_existing_manifest() -> dict:
    if os.path.isfile(MANIFEST_JSON):
        with open(MANIFEST_JSON, encoding="utf-8") as f:
            return json.load(f)
    return {
        "version": 1,
        "base": "hero/golge_parsi/sprite/",
        "scale": {"store": 1.12, "detail": 1.28, "main": 1.42},
    }


def write_sprite_manifest(combined: dict) -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(MANIFEST_JSON, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2)
    write_js(
        MANIFEST_JS,
        "/* AUTO: scripts/build-golge-parsi-sprites.py */",
        [
            'window.NOVA_GOLGE_PARSI_SPRITE_BASE="hero/golge_parsi/sprite/";',
            "window.NOVA_GOLGE_PARSI_SPRITE_MANIFEST = "
            + json.dumps(combined, separators=(",", ":"))
            + ";",
        ],
    )


def main() -> int:
    true_only = "--true-only" in sys.argv
    idle_only = "--idle-only" in sys.argv
    main_only = "--main-only" in sys.argv
    print("Vitrin:", VITRIN_VIDEO)
    print("Ana ekran:", MAIN_VIDEO)
    print("DOGRU:", TRUE_VIDEO)

    if main_only:
        print("Rebuilding MAIN from:", os.path.abspath(MAIN_VIDEO))
        main_data = build_loop_sheet(
            MAIN_VIDEO,
            os.path.join(OUT_DIR, "golge-parsi-main.webp"),
            target_fps=12,
            max_frames=None,
            blend_frames=8,
            target_h=300,
            foot_align=True,
            anchor="bottom",
            optimize_loop=True,
        )
        combined = load_existing_manifest()
        scale = combined.get("scale") or {"store": 1.12, "detail": 1.28, "main": 1.42}
        combined.update(
            {
                "version": 1,
                "base": "hero/golge_parsi/sprite/",
                "main": main_data,
                "scale": scale,
            }
        )
        if "sheet" not in combined:
            idle = build_loop_sheet(
                VITRIN_VIDEO,
                os.path.join(OUT_DIR, "golge-parsi-idle.webp"),
                target_fps=12,
                max_frames=None,
                blend_frames=0,
                target_h=290,
                pad=8,
                foot_align=False,
                anchor="center",
                optimize_loop=False,
                hard_seam=False,
                native_fps=True,
                lock_cell=(254, 290),
            )
            for k, v in idle.items():
                if k != "main":
                    combined[k] = v
        write_sprite_manifest(combined)
        print("Done (main-only). main", main_data["frameWidth"], "x", main_data["frameHeight"])
        return 0

    if true_only:
        true_clip = build_true_sheet(
            TRUE_VIDEO,
            os.path.join(TRUE_DIR, "golge-parsi-true-dogru.webp"),
        )
        true_root = {
            "version": 1,
            "base": "hero/golge_parsi/sprite/true/",
            "scale": {"sp": 1},
            "holdMs": 520,
            "clips": [true_clip],
        }
        write_js(
            TRUE_MANIFEST_JS,
            "/* AUTO: scripts/build-golge-parsi-sprites.py */",
            [
                'window.NOVA_GOLGE_PARSI_TRUE_BASE="hero/golge_parsi/sprite/true/";',
                "window.NOVA_GOLGE_PARSI_TRUE_MANIFEST = "
                + json.dumps(true_root, separators=(",", ":"))
                + ";",
            ],
        )
        print("Done (true-only).")
        return 0

    if idle_only:
        vitrin_path = os.path.abspath(VITRIN_VIDEO)
        print("  VITRIN SOURCE:", vitrin_path)
        if "vitrin" not in os.path.basename(vitrin_path).lower():
            print("  WARN: vitrin dosya adi beklenmiyor", file=sys.stderr)
        lock_cell: tuple[int, int] | None = (254, 290)
        manifest_path = os.path.join(OUT_DIR, "manifest.json")
        if os.path.isfile(manifest_path):
            with open(manifest_path, encoding="utf-8") as f:
                prev = json.load(f)
            w, h = int(prev.get("frameWidth") or 0), int(prev.get("frameHeight") or 0)
            if w > 0 and h > 0:
                lock_cell = (w, h)
        idle = build_loop_sheet(
            VITRIN_VIDEO,
            os.path.join(OUT_DIR, "golge-parsi-idle.webp"),
            target_fps=12,
            max_frames=None,
            blend_frames=0,
            target_h=290,
            pad=8,
            foot_align=False,
            anchor="center",
            optimize_loop=False,
            hard_seam=False,
            native_fps=True,
            lock_cell=lock_cell,
        )
        manifest_path = os.path.join(OUT_DIR, "manifest.json")
        if os.path.isfile(manifest_path):
            with open(manifest_path, encoding="utf-8") as f:
                combined = json.load(f)
        else:
            combined = {"version": 1, "base": "hero/golge_parsi/sprite/", "scale": {"store": 1.12, "detail": 1.5, "main": 1.42}}
        for k, v in idle.items():
            if k != "main":
                combined[k] = v
        write_js(
            MANIFEST_JS,
            "/* AUTO: scripts/build-golge-parsi-sprites.py */",
            [
                'window.NOVA_GOLGE_PARSI_SPRITE_BASE="hero/golge_parsi/sprite/";',
                "window.NOVA_GOLGE_PARSI_SPRITE_MANIFEST = "
                + json.dumps(combined, separators=(",", ":"))
                + ";",
            ],
        )
        with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
            json.dump(combined, f, indent=2)
        print("Done (idle-only).")
        return 0

    idle = build_loop_sheet(
        VITRIN_VIDEO,
        os.path.join(OUT_DIR, "golge-parsi-idle.webp"),
        target_fps=12,
        max_frames=None,
        blend_frames=0,
        target_h=290,
        pad=8,
        foot_align=False,
        anchor="center",
        optimize_loop=False,
        hard_seam=False,
        native_fps=True,
        lock_cell=(254, 290),
    )

    main_data = build_loop_sheet(
        MAIN_VIDEO,
        os.path.join(OUT_DIR, "golge-parsi-main.webp"),
        target_fps=12,
        max_frames=None,
        blend_frames=8,
        target_h=300,
        foot_align=True,
        anchor="bottom",
        optimize_loop=True,
    )

    true_clip = build_true_sheet(
        TRUE_VIDEO,
        os.path.join(TRUE_DIR, "golge-parsi-true-dogru.webp"),
    )

    combined = {
        "version": 1,
        "base": "hero/golge_parsi/sprite/",
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
        "scale": {"store": 1.12, "detail": 1.28, "main": 1.42},
    }

    true_root = {
        "version": 1,
        "base": "hero/golge_parsi/sprite/true/",
        "scale": {"sp": 1},
        "holdMs": 520,
        "clips": [true_clip],
    }

    write_sprite_manifest(combined)

    write_js(
        TRUE_MANIFEST_JS,
        "/* AUTO: scripts/build-golge-parsi-sprites.py */",
        [
            'window.NOVA_GOLGE_PARSI_TRUE_BASE="hero/golge_parsi/sprite/true/";',
            "window.NOVA_GOLGE_PARSI_TRUE_MANIFEST = "
            + json.dumps(true_root, separators=(",", ":"))
            + ";",
        ],
    )

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

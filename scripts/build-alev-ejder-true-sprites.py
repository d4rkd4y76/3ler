#!/usr/bin/env python3
"""Alev Ejderi doğru cevap klipleri -> temiz alpha WebP sprite (yazı korumalı)."""
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
TRUE_DIR = os.path.join(ROOT, "hero", "flame_dragon", "true")
OUT_DIR = os.path.join(ROOT, "hero", "flame_dragon", "sprite", "true")
MANIFEST_JS = os.path.join(ROOT, "js", "ui", "012tb-nova-alev-ejder-true-manifest.js")

TARGET_FPS = 20
TARGET_FRAME_COUNT = 96
TARGET_H = 300
MAX_SHEET_W = 4096
BBOX_THR = 4
H_MARGIN = 0.0
PAD_TOP = 32
PAD_BOTTOM = 52
WEBP_QUALITY = 91

# routine sırası Buz Ejderi ile aynı: 0 çok iyi, 1 işte bu, 2 mükemmel, 3 sen dahi
CLIP_SPECS = [
    ("cok_iyi", "cok_iyi.mp4", "alev-ejder-true-cok-iyi.webp", 0),
    ("alev_sahane", "alev_sahane.mp4", "alev-ejder-true-alev-sahane.webp", 1),
    ("mutlak_guc", "mutlak_guc", "alev-ejder-true-mutlak-guc.webp", 2),
    ("bilgece_cevap", "bilgece_cevap.mp4", "alev-ejder-true-bilgece-cevap.webp", 3),
    ("ice_super", "yeni_dogru.mp4", "alev-ejder-true-ice-super.webp", 4),
]


def norm_name(s: str) -> str:
    s = s.lower()
    for a, b in (
        ("ü", "u"), ("ö", "o"), ("ı", "i"), ("ş", "s"), ("ğ", "g"), ("ç", "c"),
        ("â", "a"), ("î", "i"), ("û", "u"), (" ", "_"), ("-", "_"),
    ):
        s = s.replace(a, b)
    return s


def resolve_video(name: str) -> str:
    if not name.endswith(".mp4"):
        name = name + ".mp4"
    exact = os.path.join(TRUE_DIR, name)
    if os.path.isfile(exact):
        return exact
    stem = norm_name(os.path.splitext(name)[0])
    hits = glob.glob(os.path.join(TRUE_DIR, "*.mp4"))
    for path in hits:
        base = norm_name(os.path.splitext(os.path.basename(path))[0])
        if base == stem or stem in base or base.startswith(stem):
            return path
    for path in hits:
        base = norm_name(os.path.splitext(os.path.basename(path))[0])
        if stem[:6] and stem[:6] in base:
            return path
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


def is_alev_foreground(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    green = is_greenish(rgb, key)
    r = rgb[:, :, 0].astype(np.float32)
    g = rgb[:, :, 1].astype(np.float32)
    b = rgb[:, :, 2].astype(np.float32)
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    green_dom = g - np.maximum(r, b)

    light_text = (lum > 82) & (green_dom < 38) & ~green
    fire_text = (lum > 110) & (sat < 95) & (green_dom < 42) & ~green
    warm_dragon = (
        (r > b + 5)
        & (sat > 14)
        & (green_dom < 30)
        & (lum > 26)
        & ~green
    )
    ember = (r > 88) & (g > 38) & (g < 170) & (b < 95) & ~green
    colored = (sat > 22) & (green_dom < 20) & (lum > 34) & ~green
    dark_ink = (lum < 94) & (sat > 10) & (green_dom < 14) & ~green
    flame_core = (r > 120) & (g > 55) & (b < 110) & ~green
    return light_text | fire_text | warm_dragon | ember | colored | dark_ink | flame_core


def alpha_green(rgb: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    d = color_dist(rgb, key)
    a = np.clip((d - 20.0) / 40.0, 0.0, 1.0)
    a[is_greenish(rgb, key)] = 0.0
    fg = is_alev_foreground(rgb, key)
    a[fg] = np.maximum(a[fg], 0.94)
    return a


def flood_green(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    out = rgba.copy()
    h, w = out.shape[:2]
    bg = is_greenish(out[:, :, :3], key) & ~is_alev_foreground(out[:, :, :3], key)
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


def scrub_text_green_fringe(rgba: np.ndarray, key: tuple[int, int, int]) -> np.ndarray:
    """Yazı ve alev kenarındaki yeşil hale — opak metne dokunmadan temizle."""
    out = rgba.copy()
    rgb = out[:, :, :3].astype(np.float32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    gd = g - np.maximum(r, b)
    d = color_dist(out[:, :, :3], key)
    fg = is_alev_foreground(out[:, :, :3], key)
    fringe = (
        (out[:, :, 3] > 12)
        & (lum > 68)
        & (gd > 3)
        & (gd < 62)
        & (d < 92)
        & ~fg
    )
    if not np.any(fringe):
        return out
    t = np.clip(gd / 48.0, 0.15, 0.92)[:, :, np.newaxis]
    warm = np.stack(
        [
            np.clip(lum * 0.92 + r * 0.12, 0, 255),
            np.clip(lum * 0.86 + g * 0.06, 0, 255),
            np.clip(lum * 0.78 + b * 0.04, 0, 255),
        ],
        axis=-1,
    )
    rgb = np.where(fringe[:, :, np.newaxis], rgb * (1 - t) + warm * t, rgb)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    spill_kill = (
        (out[:, :, 3] > 0)
        & (lum > 55)
        & (gd > 8)
        & (g > r + 6)
        & (d < 75)
        & ~fg
        & (sat < 100)
    )
    out[spill_kill, 3] = 0
    out[spill_kill, :3] = 0
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
        & ~is_alev_foreground(out[:, :, :3], key)
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
    excess_g = np.maximum(0.0, rgb[:, :, 1] - np.maximum(kg * 0.92, rgb[:, :, 1] * 0.55))
    for c in range(3):
        if c == 1:
            rgb[:, :, 1] = np.where(edge, rgb[:, :, 1] - excess_g * 0.92, rgb[:, :, 1])
        else:
            rgb[:, :, c] = np.where(edge, rgb[:, :, c] + excess_g * 0.1, rgb[:, :, c])
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
    rgba = scrub_text_green_fringe(rgba, key)
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


def load_manifest_from_js() -> dict | None:
    if not os.path.isfile(MANIFEST_JS):
        return None
    try:
        text = open(MANIFEST_JS, encoding="utf-8").read()
        marker = "window.NOVA_ALEV_EJDER_TRUE_MANIFEST="
        i = text.find(marker)
        if i < 0:
            return None
        raw = text[i + len(marker) :].strip()
        if raw.endswith(";"):
            raw = raw[:-1]
        return json.loads(raw)
    except Exception:
        return None


def write_manifest(manifest: dict) -> None:
    js = "/* AUTO: scripts/build-alev-ejder-true-sprites.py */\n"
    js += "window.NOVA_ALEV_EJDER_TRUE_BASE=" + json.dumps(manifest["base"]) + ";\n"
    js += "window.NOVA_ALEV_EJDER_TRUE_MANIFEST="
    js += json.dumps(manifest, separators=(",", ":")) + ";\n"
    with open(MANIFEST_JS, "w", encoding="utf-8") as f:
        f.write(js)


def main() -> int:
    if not os.path.isdir(TRUE_DIR):
        print("Missing:", TRUE_DIR, file=sys.stderr)
        return 1

    append_ids: set[str] = set()
    if "--append" in sys.argv:
        for arg in sys.argv[1:]:
            if arg != "--append" and not arg.startswith("-"):
                append_ids.add(arg)

    specs = CLIP_SPECS
    if append_ids:
        specs = [s for s in CLIP_SPECS if s[0] in append_ids]
        if not specs:
            print("No matching clip ids:", append_ids, file=sys.stderr)
            return 1

    sample_video = resolve_video("yeni_dogru.mp4")
    if not os.path.isfile(sample_video):
        sample_video = resolve_video("bilgece_cevap.mp4")
    if not os.path.isfile(sample_video):
        sample_video = resolve_video(CLIP_SPECS[0][1])
    probe = []
    for i, frame in enumerate(iio.imiter(sample_video, plugin="pyav")):
        if i >= 10:
            break
        probe.append(frame[:, :, :3])
    key = sample_green_key(probe)
    print("green key", key)

    built: list[dict] = []
    for spec in specs:
        if not os.path.isfile(resolve_video(spec[1])):
            print("SKIP missing source:", spec[0], spec[1])
            continue
        built.append(build_clip(spec, key))

    if append_ids:
        prev = load_manifest_from_js() or {
            "version": 3,
            "base": "hero/flame_dragon/sprite/true/",
            "fps": TARGET_FPS,
            "scale": {"sp": 1.0},
            "clips": [],
        }
        by_id = {c["id"]: c for c in prev.get("clips") or []}
        for clip in built:
            by_id[clip["id"]] = clip
        clips = sorted(by_id.values(), key=lambda c: int(c.get("routine", 0)))
    else:
        clips = built
        if len(clips) < len(CLIP_SPECS):
            prev = load_manifest_from_js()
            if prev and prev.get("clips"):
                by_id = {c["id"]: c for c in clips}
                for c in prev["clips"]:
                    if c["id"] not in by_id and os.path.isfile(
                        os.path.join(OUT_DIR, c.get("sheet", ""))
                    ):
                        by_id[c["id"]] = c
                clips = sorted(by_id.values(), key=lambda c: int(c.get("routine", 0)))

    manifest = {
        "version": 3,
        "base": "hero/flame_dragon/sprite/true/",
        "fps": TARGET_FPS,
        "scale": {"sp": 1.0},
        "clips": clips,
    }

    write_manifest(manifest)
    print("manifest", MANIFEST_JS, "clips", len(clips))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

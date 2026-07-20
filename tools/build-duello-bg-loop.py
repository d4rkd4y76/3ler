"""Yeni yıldız videosu -> duello-bg-loop.mp4"""
import glob
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(r"C:\Users\D4RKD4Y\Desktop\DLLWORLD")
OUT = ROOT / "duello-bg-loop.mp4"

candidates = sorted(
    [Path(p) for p in glob.glob(str(ROOT / "*20260531*.mp4"))],
    key=lambda p: p.stat().st_mtime,
    reverse=True,
)
# Kaynak video: köke yeni bir *2026*.mp4 koyun veya duello-bg-loop.mp4 üzerine yazın.
SRC = candidates[0] if candidates else ROOT / "duello-bg-loop.mp4"

# Kare analizi: 2.5s -> 5.958s en uyumlu segment (frame 60-143)
START_F = 60
END_F = 143
XFADE_F = 12

cap = cv2.VideoCapture(str(SRC))
if not cap.isOpened():
    raise SystemExit(f"cannot open {SRC}")

fps = cap.get(cv2.CAP_PROP_FPS) or 24
all_frames = []
while True:
    ok, frame = cap.read()
    if not ok:
        break
    all_frames.append(frame)
cap.release()

segment = all_frames[START_F : END_F + 1]
n = len(segment)
out_frames = [f.copy() for f in segment]

for i in range(XFADE_F):
    t = (i + 1) / (XFADE_F + 1)
    t = t * t * (3 - 2 * t)
    tail_idx = n - XFADE_F + i
    head_idx = i
    out_frames[tail_idx] = cv2.addWeighted(
        segment[tail_idx], 1.0 - t, segment[head_idx], t, 0
    )

out_frames[-1] = cv2.addWeighted(segment[-1], 0.1, segment[0], 0.9, 0)

import imageio

rgb_frames = [cv2.cvtColor(f, cv2.COLOR_BGR2RGB) for f in out_frames]
writer = imageio.get_writer(
    str(OUT),
    fps=fps,
    codec="libx264",
    quality=5,
    pixelformat="yuv420p",
    output_params=["-crf", "28", "-preset", "fast", "-movflags", "+faststart"],
)
for fr in rgb_frames:
    writer.append_data(fr)
writer.close()

d0 = float(
    np.mean(
        np.abs(
            cv2.cvtColor(out_frames[-1], cv2.COLOR_BGR2GRAY).astype(np.float32)
            - cv2.cvtColor(out_frames[0], cv2.COLOR_BGR2GRAY).astype(np.float32)
        )
    )
)

manifest = {
    "source": SRC.name,
    "output": OUT.name,
    "fps": fps,
    "frames": len(out_frames),
    "durationSec": round(len(out_frames) / fps, 4),
    "sourceSegment": f"{START_F/fps:.4f}s-{END_F/fps:.4f}s",
    "xfadeFrames": XFADE_F,
    "lastVsFirstDiff": round(d0, 4),
}
(ROOT / "tools" / "loop-analysis" / "duello-bg-loop-manifest.json").write_text(
    json.dumps(manifest, indent=2), encoding="utf-8"
)
print(json.dumps(manifest))

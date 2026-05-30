"""sonduelloarka.mp4 -> sonduelloarka-loop.mp4 (gömülü crossfade, native loop)"""
import glob
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(r"C:\Users\D4RKD4Y\Desktop\DLLWORLD")
src = ROOT / "sonduelloarka.mp4"
if not src.exists():
    matches = glob.glob(str(ROOT / "son*.mp4"))
    src = Path(matches[0]) if matches else src

OUT = ROOT / "sonduelloarka-loop.mp4"
START_F = 31   # 1.292s
END_F = 141    # 5.875s
XFADE_F = 10   # ~420ms @24fps

cap = cv2.VideoCapture(str(src))
if not cap.isOpened():
    raise SystemExit(f"cannot open {src}")

fps = cap.get(cv2.CAP_PROP_FPS) or 24
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

all_frames = []
while True:
    ok, frame = cap.read()
    if not ok:
        break
    all_frames.append(frame)
cap.release()

segment = all_frames[START_F : END_F + 1]
n = len(segment)
if n < XFADE_F * 2 + 8:
    raise SystemExit("segment too short")

out_frames = [f.copy() for f in segment]

# Son kareleri başa doğru yumuşak morph — loop birleşimi dosyada
for i in range(XFADE_F):
    t = (i + 1) / (XFADE_F + 1)
    t = t * t * (3 - 2 * t)  # smoothstep
    tail_idx = n - XFADE_F + i
    head_idx = i
    out_frames[tail_idx] = cv2.addWeighted(
        segment[tail_idx], 1.0 - t, segment[head_idx], t, 0
    )

# Son kare ≈ ilk kare (native loop için)
out_frames[-1] = cv2.addWeighted(segment[-1], 0.15, segment[0], 0.85, 0)

fourcc = cv2.VideoWriter_fourcc(*"mp4v")
writer = cv2.VideoWriter(str(OUT), fourcc, fps, (w, h))
for f in out_frames:
    writer.write(f)
writer.release()

# doğrulama
d0 = float(np.mean(np.abs(
    cv2.cvtColor(out_frames[-1], cv2.COLOR_BGR2GRAY).astype(np.float32)
    - cv2.cvtColor(out_frames[0], cv2.COLOR_BGR2GRAY).astype(np.float32)
)))
d1 = float(np.mean(np.abs(
    cv2.cvtColor(out_frames[-2], cv2.COLOR_BGR2GRAY).astype(np.float32)
    - cv2.cvtColor(out_frames[0], cv2.COLOR_BGR2GRAY).astype(np.float32)
)))

manifest = {
    "src": OUT.name,
    "fps": fps,
    "frames": len(out_frames),
    "durationSec": round(len(out_frames) / fps, 4),
    "sourceSegment": f"{START_F/fps:.3f}s-{END_F/fps:.3f}s",
    "xfadeFrames": XFADE_F,
    "lastVsFirstDiff": round(d0, 4),
    "last-1VsFirstDiff": round(d1, 4),
}
(ROOT / "tools" / "loop-analysis" / "sonduello-loop-manifest.json").write_text(
    json.dumps(manifest, indent=2), encoding="utf-8"
)
print(json.dumps(manifest))
print("written", OUT, "size", OUT.stat().st_size)

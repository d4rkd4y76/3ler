import cv2
import json
import numpy as np
from pathlib import Path

import glob

paths = glob.glob(str(Path(r"C:\Users\D4RKD4Y\Desktop\DLLWORLD") / "son*.mp4"))
if not paths:
    raise SystemExit("video not found")
path = Path(paths[0])
cap = cv2.VideoCapture(str(path))
if not cap.isOpened():
    raise SystemExit("cannot open")

fps = cap.get(cv2.CAP_PROP_FPS) or 24
frames = []
while True:
    ok, frame = cap.read()
    if not ok:
        break
    small = cv2.resize(frame, (180, 320), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY).astype(np.float32)
    frames.append(gray)
cap.release()

n = len(frames)
print(f"frames={n} fps={fps:.3f} duration={n/fps:.4f}s")

# first vs last
d0 = float(np.mean(np.abs(frames[-1] - frames[0])))
d1 = float(np.mean(np.abs(frames[-1] - frames[1])))
d2 = float(np.mean(np.abs(frames[-2] - frames[0])))
print(f"last_vs_first={d0:.4f} last_vs_second={d1:.4f} last-1_vs_first={d2:.4f}")

best = None
results = []
for start in range(0, max(1, int(n * 0.08))):
    ref = np.mean(np.stack(frames[start : start + 2], axis=0), axis=0)
    for end in range(int(n * 0.55), n):
        diff = float(np.mean(np.abs(frames[end] - ref)))
        motion = float(
            np.mean([np.mean(np.abs(frames[i] - frames[i - 1])) for i in range(start + 1, end + 1)])
        )
        score = diff + motion * 0.25
        results.append((score, diff, motion, start, end))
        if best is None or score < best[0]:
            best = (score, diff, motion, start, end)

results.sort(key=lambda x: x[0])
print("Top 6:")
for row in results[:6]:
    score, diff, motion, start, end = row
    print(
        f"  in={start/fps:.4f}s out={end/fps:.4f}s len={(end-start)/fps:.4f}s "
        f"diff={diff:.4f} motion={motion:.4f} score={score:.4f}"
    )

# full video loop if start=0
full_end = n - 1
ref0 = np.mean(np.stack(frames[:2], axis=0), axis=0)
full_diff = float(np.mean(np.abs(frames[full_end] - ref0)))
print(f"full_0_to_end diff={full_diff:.4f} end_time={full_end/fps:.4f}s")

score, diff, motion, start, end = best
use_full = full_diff <= diff * 1.08 and start <= 1
if use_full:
    start, end, diff = 0, full_end, full_diff
    print("Using FULL video loop (start=0)")

manifest = {
    "src": path.name,
    "fps": fps,
    "frames": n,
    "duration": round(n / fps, 4),
    "loopInSec": round(start / fps, 4),
    "loopOutSec": round(end / fps, 4),
    "loopInFrame": start,
    "loopOutFrame": end,
    "seamDiff": round(diff, 4),
    "crossfadeSec": 0.1 if diff < 4 else 0.12,
    "fullLoop": use_full,
}
out = Path(r"C:\Users\D4RKD4Y\Desktop\DLLWORLD\tools\loop-analysis\sonduello-manifest.json")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
print("manifest:", json.dumps(manifest))

import cv2
import numpy as np
from pathlib import Path

path = Path(r"C:\Users\D4RKD4Y\Desktop\DLLWORLD\arkaplangalaksi.mp4")
cap = cv2.VideoCapture(str(path))
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

# Exhaustive search for best loop segment length >= 2.5s
best = None
results = []
for start in range(0, n - int(2.5 * fps)):
    ref = np.mean(np.stack(frames[start : start + 2], axis=0), axis=0)
    for end in range(start + int(2.0 * fps), min(n, start + int(5.5 * fps))):
        diff = float(np.mean(np.abs(frames[end] - ref)))
        motion = float(np.mean([np.mean(np.abs(frames[i] - frames[i - 1])) for i in range(start + 1, end + 1)]))
        score = diff + motion * 0.35
        results.append((score, diff, motion, start, end))
        if best is None or score < best[0]:
            best = (score, diff, motion, start, end)

results.sort(key=lambda x: x[0])
print("Top 8 loop candidates:")
for row in results[:8]:
    score, diff, motion, start, end = row
    print(
        f"  start={start/fps:.3f}s end={end/fps:.3f}s len={(end-start)/fps:.3f}s "
        f"diff={diff:.3f} motion={motion:.3f} score={score:.3f}"
    )

score, diff, motion, start, end = best
print("\nBEST:")
print(f"LOOP_IN={start/fps:.4f}")
print(f"LOOP_OUT={end/fps:.4f}")
print(f"LOOP_LEN={(end-start)/fps:.4f}")
print(f"end_vs_start_diff={diff:.4f}")

# Crossfade need: compare consecutive diffs around seam
seam_diff = diff
# Also check frame end vs start+1
seam_diff2 = float(np.mean(np.abs(frames[end] - frames[start + 1])))
print(f"end_vs_start+1_diff={seam_diff2:.4f}")

# Find minimal crossfade duration where intermediate frames help
for cf_frames in [2, 3, 4, 5, 6, 8]:
    if end + 1 >= n or start < cf_frames:
        continue
    # simulate blend of last cf frames with first cf frames
    errs = []
    for k in range(cf_frames):
        a = frames[end - cf_frames + 1 + k]
        b = frames[start + k]
        errs.append(float(np.mean(np.abs(a - b))))
    print(f"cf={cf_frames} avg_err={np.mean(errs):.3f} max_err={max(errs):.3f}")

# Save seam comparison images
out = Path(r"C:\Users\D4RKD4Y\Desktop\DLLWORLD\tools\loop-analysis")
cap = cv2.VideoCapture(str(path))
for label, fi in [
    ("loop_in", start),
    ("loop_in1", start + 1),
    ("loop_out", end),
    ("loop_out-1", end - 1),
]:
    cap.set(cv2.CAP_PROP_POS_FRAMES, fi)
    ok, fr = cap.read()
    if ok:
        cv2.imwrite(str(out / f"{label}.jpg"), fr)
cap.release()

# Write JSON manifest for JS
manifest = {
    "fps": fps,
    "frames": n,
    "duration": n / fps,
    "loopInSec": round(start / fps, 4),
    "loopOutSec": round(end / fps, 4),
    "loopInFrame": start,
    "loopOutFrame": end,
    "seamDiff": round(diff, 4),
    "crossfadeSec": 0.12,
}
import json

(out / "loop-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
print("\nmanifest:", json.dumps(manifest))

import cv2
import numpy as np
from pathlib import Path

path = Path(r"C:\Users\D4RKD4Y\Desktop\DLLWORLD\arkaplangalaksi.mp4")
cap = cv2.VideoCapture(str(path))
if not cap.isOpened():
    raise SystemExit("cannot open video")

fps = cap.get(cv2.CAP_PROP_FPS) or 24
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
duration = frame_count / fps if fps else 0

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
print(f"frames={n} fps={fps:.3f} duration={duration:.3f}s")

ref = np.mean(np.stack(frames[:3], axis=0), axis=0)
sim_to_start = []
for f in frames:
    sim_to_start.append(float(np.mean(np.abs(f - ref))))
sim_to_start = np.array(sim_to_start)

search_from = int(n * 0.55)
best_end = search_from + int(np.argmin(sim_to_start[search_from:]))
print(
    f"best_end_frame={best_end} time={best_end/fps:.4f}s diff={sim_to_start[best_end]:.3f}"
)

best = None
for start in range(0, int(n * 0.15)):
    ref2 = np.mean(np.stack(frames[start : start + 3], axis=0), axis=0)
    for end in range(int(n * 0.65), n):
        diff = float(np.mean(np.abs(frames[end] - ref2)))
        if best is None or diff < best[0]:
            best = (diff, start, end)

print(
    f"best_loop start_frame={best[1]} ({best[1]/fps:.4f}s) "
    f"end_frame={best[2]} ({best[2]/fps:.4f}s) diff={best[0]:.3f}"
)

motion = [0.0]
for i in range(1, n):
    motion.append(float(np.mean(np.abs(frames[i] - frames[i - 1]))))
motion = np.array(motion)

win = max(3, int(fps * 0.35))
best_win = None
for s in range(int(n * 0.68), n - win):
    avg_motion = motion[s : s + win].mean()
    end_diff = float(np.mean(np.abs(frames[min(s + win - 1, n - 1)] - ref)))
    score = avg_motion * 0.55 + end_diff * 0.45
    if best_win is None or score < best_win[0]:
        best_win = (score, s, s + win - 1)

print(
    f"crossfade_start_frame={best_win[1]} ({best_win[1]/fps:.4f}s) "
    f"crossfade_end_frame={best_win[2]} ({best_win[2]/fps:.4f}s) score={best_win[0]:.3f}"
)

last_diff = float(np.mean(np.abs(frames[-1] - frames[0])))
mid_diff = float(np.mean(np.abs(frames[n // 2] - frames[0])))
print(f"last_vs_first_diff={last_diff:.3f} mid_vs_first={mid_diff:.3f}")

out = Path(r"C:\Users\D4RKD4Y\Desktop\DLLWORLD\tools\loop-analysis")
out.mkdir(parents=True, exist_ok=True)
for label, fi in [("start0", 0), ("start1", 1), ("end_best", best[2]), ("end_last", n - 1)]:
    cap = cv2.VideoCapture(str(path))
    cap.set(cv2.CAP_PROP_POS_FRAMES, fi)
    ok, fr = cap.read()
    cap.release()
    if ok:
        cv2.imwrite(str(out / f"{label}.jpg"), fr)
print("saved thumbs to", out)

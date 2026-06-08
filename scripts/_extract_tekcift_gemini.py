#!/usr/bin/env python3
import json
import re
from pathlib import Path

CANDIDATES = [
    Path(
        r"C:\Users\D4RKD4Y\.cursor\projects\1780577222580\agent-transcripts"
        r"\eef3dad6-9e58-4f07-8c5e-3fe1d67b59e4\eef3dad6-9e58-4f07-8c5e-3fe1d67b59e4.jsonl"
    ),
]
OUT = Path(__file__).resolve().parents[1] / "data" / "tekcift-gemini-raw.json"
MARKER = '"id": "mat3_tekcift_001"'

raw = None
for transcript in CANDIDATES:
    if not transcript.is_file():
        continue
    for line in transcript.open(encoding="utf-8"):
        if MARKER not in line or "Tek ve" not in line:
            continue
        obj = json.loads(line)
        if obj.get("role") != "user":
            continue
        msg = obj.get("message", {}) or {}
        content = msg.get("content", [])
        text = content if isinstance(content, str) else "".join(
            c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text"
        )
        if MARKER not in text:
            continue
        m = re.search(r"\[\s*\n?\s*\{", text)
        if not m:
            continue
        chunk = text[m.start() :]
        depth = 0
        end = 0
        for i, ch in enumerate(chunk):
            if ch == "[":
                depth += 1
            elif ch == "]":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        raw = chunk[:end]
        break
    if raw:
        break

if not raw:
    raise SystemExit("JSON bulunamadi")

data = json.loads(raw)
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"saved {len(data)} questions -> {OUT}")

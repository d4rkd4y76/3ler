#!/usr/bin/env python3
import json
import re
from pathlib import Path

TRANSCRIPT = Path(
    r"C:\Users\D4RKD4Y\.cursor\projects\1780577222580\agent-transcripts"
    r"\eef3dad6-9e58-4f07-8c5e-3fe1d67b59e4\eef3dad6-9e58-4f07-8c5e-3fe1d67b59e4.jsonl"
)
OUT = Path(__file__).resolve().parents[1] / "data" / "kelime-gemini-raw.json"

raw = None
for line in TRANSCRIPT.open(encoding="utf-8"):
    if "kelime3_001" not in line:
        continue
    obj = json.loads(line)
    if obj.get("role") != "user":
        continue
    msg = obj.get("message", {}) or {}
    content = msg.get("content", [])
    if isinstance(content, str):
        text = content
    else:
        text = "".join(
            c.get("text", "")
            for c in content
            if isinstance(c, dict) and c.get("type") == "text"
        )
    if "KELİME DAĞARCIĞI" not in text.upper() and "kelime3_001" not in text:
        continue
    m = re.search(r"\[\s*\n?\s*\{", text)
    if not m or "kelime3_001" not in text[m.start() : m.start() + 500]:
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

if not raw:
    raise SystemExit("JSON bulunamadi")

data = json.loads(raw)
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"saved {len(data)} questions -> {OUT}")

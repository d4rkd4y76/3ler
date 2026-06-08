#!/usr/bin/env python3
import json
import re
from pathlib import Path

CANDIDATES = [
    Path(
        r"C:\Users\D4RKD4Y\.cursor\projects\1780577222580\agent-transcripts"
        r"\eef3dad6-9e58-4f07-8c5e-3fe1d67b59e4\eef3dad6-9e58-4f07-8c5e-3fe1d67b59e4.jsonl"
    ),
    Path(
        r"C:\Users\D4RKD4Y\.cursor\projects\C-Users-D4RKD4Y-AppData-Local-Temp-f6a19b17-846f-482f-8d17-ef5dbf15051f"
        r"\agent-transcripts\eef3dad6-9e58-4f07-8c5e-3fe1d67b59e4\eef3dad6-9e58-4f07-8c5e-3fe1d67b59e4.jsonl"
    ),
]
OUT = Path(__file__).resolve().parents[1] / "data" / "yazim-gemini-raw.json"

# Çift "text" anahtarı olan sorular (JSON son text'i tutar)
DUP_TEXT_FIX = {
    "yazim3_009": {
        "premise": "'Annem_ akşam_ pazara_ gidecek_'",
        "text": "Bu cümleyi soru cümlesi yapmak için boşluklara sırasıyla hangi kelime ve noktalama işareti gelmelidir?",
    },
    "yazim3_108": {
        "premise": "'Ali____ okul____ kalemini kaybetmiş____?'",
        "text": "Cümlesinin doğru ve anlamlı olması için boşluklara sırasıyla ne gelmelidir?",
    },
}


def fix_duplicate_text_keys(raw: str) -> str:
    for qid, fix in DUP_TEXT_FIX.items():
        pattern = (
            rf'(\{{"id": "{qid}"[^}}]*?"premise": null,\s*)'
            rf'"text": "[^"]+",\s*'
            rf'"text": '
        )
        repl = rf'\1"premise": {json.dumps(fix["premise"], ensure_ascii=False)}, "text": '
        raw = re.sub(pattern, repl, raw, count=1)
    return raw


raw = None
for transcript in CANDIDATES:
    if not transcript.is_file():
        continue
    for line in transcript.open(encoding="utf-8"):
        if "yazim3_001" not in line:
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
        if "yazim3_001" not in text:
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
        raw = fix_duplicate_text_keys(chunk[:end])
        break
    if raw:
        break

if not raw:
    raise SystemExit("JSON bulunamadi")

data = json.loads(raw)
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"saved {len(data)} questions -> {OUT}")

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extract carpma questions from parent transcript into carpma-gemini-raw.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRANSCRIPT = Path(
    r"C:\Users\D4RKD4Y\.cursor\projects\1780577222580\agent-transcripts"
    r"\eef3dad6-9e58-4f07-8c5e-3fe1d67b59e4\eef3dad6-9e58-4f07-8c5e-3fe1d67b59e4.jsonl"
)
OUT_PATH = ROOT / "data" / "carpma-gemini-raw.json"


def main() -> int:
    line = TRANSCRIPT.read_text(encoding="utf-8").splitlines()[1143]
    data = json.loads(line)
    text = data["message"]["content"][0]["text"]
    idx = text.find("[\n  {")
    if idx == -1:
        idx = text.find("[")
    arr_text = text[idx:].split("</user_query>")[0].rstrip()
    questions = json.loads(arr_text)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(questions, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    loaded = json.loads(OUT_PATH.read_text(encoding="utf-8"))
    assert len(loaded) == 50, f"expected 50 items, got {len(loaded)}"
    for i, q in enumerate(loaded, 1):
        assert q["id"] == f"mat3_carp_{i:03d}", q["id"]
        for key in ("id", "level", "premise", "text", "correct", "wrong1", "wrong2", "explanation"):
            assert key in q, f"missing {key} in {q['id']}"

    print(f"Written: {OUT_PATH}")
    print(f"Count: {len(loaded)}")
    print(f"IDs: {loaded[0]['id']} .. {loaded[-1]['id']}")
    print("Verification: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

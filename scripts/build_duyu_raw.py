#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build duyu-gemini-raw.json from parent conversation transcript."""
from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRANSCRIPT = Path(
    r"C:\Users\D4RKD4Y\.cursor\projects\1781445650710\agent-transcripts"
    r"\5735d9ea-9339-41a8-bc0d-89e993fea8f6\5735d9ea-9339-41a8-bc0d-89e993fea8f6.jsonl"
)
OUT = ROOT / "data" / "duyu-gemini-raw.json"

# Manual fixes for known quality issues
PREMISE_FIXES: dict[str, str | None] = {
    "fen3_duyu_068": "Odanın bir köşesine sıkılan parfümün kokusu, kısa süre sonra odanın diğer köşesinden de alınabilir.",
}
STEM_FIXES: dict[str, str] = {
    "fen3_duyu_068": "Kokuların bize kadar ulaşmasını sağlayan nedir?",
}
# Q099: question was placed in premise with no text field
STEM_FROM_PREMISE: set[str] = {"fen3_duyu_099"}


def extract_array_text() -> str:
    line = TRANSCRIPT.read_text(encoding="utf-8").splitlines()[115]
    obj = json.loads(line)
    text = obj["message"]["content"][0]["text"]
    start = text.index("[")
    end = text.rindex("]") + 1
    return text[start:end]


def parse_questions(arr_text: str) -> list[dict]:
    entries: list[dict] = []
    parts = re.split(r'(?=\{"id": "fen3_duyu_)', arr_text)
    for part in parts:
        if not part.startswith('{"id"'):
            continue
        part = part.strip().rstrip(",").rstrip("]").rstrip()
        entries.append(json.loads(part))
    return entries


def apply_fixes(q: dict) -> tuple[dict, list[str]]:
    fixes: list[str] = []
    qid = q.get("id", "")

    if qid in PREMISE_FIXES:
        q["premise"] = PREMISE_FIXES[qid]
        fixes.append(f"{qid}: split duplicate text into premise+text")

    if qid in STEM_FIXES:
        q["text"] = STEM_FIXES[qid]

    if qid in STEM_FROM_PREMISE:
        if not (q.get("text") or "").strip() and (q.get("premise") or "").strip():
            q["text"] = q["premise"]
            q["premise"] = None
            fixes.append(f"{qid}: moved question from premise to text")

    if q.get("premise") == "null":
        q["premise"] = None
        fixes.append(f"{qid}: premise string 'null' -> JSON null")

    return q, fixes


def validate(questions: list[dict]) -> None:
    ids = [q["id"] for q in questions]
    expected = {f"fen3_duyu_{i:03d}" for i in range(1, 141)}
    missing = expected - set(ids)
    extra = set(ids) - expected
    dupes = [k for k, v in Counter(ids).items() if v > 1]
    if missing:
        raise SystemExit(f"Missing IDs: {sorted(missing)}")
    if extra:
        raise SystemExit(f"Unexpected IDs: {sorted(extra)}")
    if dupes:
        raise SystemExit(f"Duplicate IDs: {dupes}")
    for q in questions:
        opts = {q["correct"], q["wrong1"], q["wrong2"]}
        if len(opts) < 3:
            raise SystemExit(f"Non-distinct options: {q['id']} -> {opts}")
        for k in ("id", "level", "text", "correct", "wrong1", "wrong2", "explanation"):
            if k not in q or not str(q.get(k, "")).strip():
                raise SystemExit(f"Missing/empty {k}: {q.get('id')}")


def main() -> None:
    arr_text = extract_array_text()
    questions = parse_questions(arr_text)
    all_fixes: list[str] = []

    fixed: list[dict] = []
    for q in questions:
        item, fixes = apply_fixes(dict(q))
        all_fixes.extend(fixes)
        fixed.append(item)

    fixed.sort(key=lambda x: x["id"])
    validate(fixed)

    ordered = [
        {
            "id": q["id"],
            "level": q["level"],
            "premise": q.get("premise"),
            "text": q["text"],
            "correct": q["correct"],
            "wrong1": q["wrong1"],
            "wrong2": q["wrong2"],
            "explanation": q["explanation"],
        }
        for q in fixed
    ]
    OUT.write_text(
        json.dumps(ordered, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    levels = Counter(q["level"] for q in fixed)
    print(f"Wrote {len(fixed)} questions to {OUT}")
    print(f"First: {fixed[0]['id']}, Last: {fixed[-1]['id']}")
    print("Level distribution:", dict(sorted(levels.items())))
    if all_fixes:
        print("Fixes applied:")
        for f in all_fixes:
            print(f"  - {f}")
    else:
        print("Fixes applied: none")


if __name__ == "__main__":
    main()

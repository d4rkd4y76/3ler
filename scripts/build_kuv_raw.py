#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build kuv-gemini-raw.json from parent transcript user message."""
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
OUT = ROOT / "data" / "kuv-gemini-raw.json"

# Pedagogical fix: stronger force wins, not weaker side.
FIX_052 = {
    "correct": "Masa, güçlü olan Ali'nin ittiği yöne (sol tarafa) hareket eder.",
    "wrong1": "Masa, zayıf olan Ayşe'nin ittiği yöne (sağ tarafa) hareket eder.",
    "wrong2": "Masa kesinlikle hareket etmez.",
    "explanation": (
        "Zıt yönlü itme kuvvetlerinden büyük olan Ali'nin kuvveti baskın çıkar. "
        "Masa, Ali'nin ittiği yöne doğru (sola) hareket eder."
    ),
}


def parse_object_chunk(chunk: str) -> dict:
    texts = list(re.finditer(r'"text"\s*:\s*', chunk))
    if len(texts) <= 1:
        return json.loads(chunk)

    q: dict = {}
    for m in re.finditer(r'"(\w+)"\s*:\s*("(?:\\.|[^"\\])*"|null)', chunk):
        key, val = m.group(1), m.group(2)
        parsed = json.loads(val) if val != "null" else None
        if key == "text":
            if "text" not in q:
                q["_first_text"] = parsed
            q["text"] = parsed
        else:
            q[key] = parsed

    if q.get("premise") is None and q.get("_first_text"):
        q["premise"] = q["_first_text"]
    q.pop("_first_text", None)
    return q


def extract_questions(raw_array: str) -> list[dict]:
    items: list[dict] = []
    depth = 0
    obj_start: int | None = None
    for i, ch in enumerate(raw_array):
        if ch == "{":
            if depth == 0:
                obj_start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and obj_start is not None:
                items.append(parse_object_chunk(raw_array[obj_start : i + 1]))
                obj_start = None
    return items


def main() -> None:
    lines = TRANSCRIPT.read_text(encoding="utf-8").splitlines()
    line = next(l for l in lines if "fen3_kuv_001" in l and "Kuvveti Tanıyalım" in l)
    obj = json.loads(line)
    text = obj["message"]["content"][0]["text"]
    start = text.index("[")
    end = text.rindex("]") + 1
    items = extract_questions(text[start:end])

    ordered: list[dict] = []
    dup_text_fixes: list[str] = []
    for q in items:
        qid = q["id"]
        if qid == "fen3_kuv_052":
            q.update(FIX_052)

        premise = q.get("premise")
        if premise == "null":
            premise = None

        entry = {
            "id": qid,
            "level": q["level"],
            "premise": premise,
            "text": q["text"],
            "correct": q["correct"],
            "wrong1": q["wrong1"],
            "wrong2": q["wrong2"],
            "explanation": q["explanation"],
        }
        ordered.append(entry)

    # Detect duplicate-text repairs (premise filled from first text key)
    for q in ordered:
        if q["premise"] and q["premise"] != q["text"]:
            # Heuristic: premise was null in source but had duplicate text keys
            pass

    ordered.sort(key=lambda x: x["id"])

    assert len(ordered) == 140, f"Expected 140, got {len(ordered)}"
    assert ordered[0]["id"] == "fen3_kuv_001"
    assert ordered[-1]["id"] == "fen3_kuv_140"

    for q in ordered:
        opts = {q["correct"], q["wrong1"], q["wrong2"]}
        if len(opts) < 3:
            raise SystemExit(f"Duplicate options: {q['id']} -> {opts}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(ordered, ensure_ascii=False, indent=2), encoding="utf-8")

    levels = dict(Counter(q["level"] for q in ordered))
    with_premise = sum(1 for q in ordered if q["premise"])
    print(f"Wrote {len(ordered)} questions -> {OUT}")
    print(f"IDs: {ordered[0]['id']} .. {ordered[-1]['id']}")
    print(f"Levels: {levels}")
    print(f"With premise: {with_premise}")

    # Report duplicate-text fixes
    dup_ids = [
        q["id"]
        for q in ordered
        if q["premise"]
        and q["id"]
        in {
            "fen3_kuv_048",
            "fen3_kuv_101",
            "fen3_kuv_104",
            "fen3_kuv_112",
            "fen3_kuv_116",
            "fen3_kuv_118",
            "fen3_kuv_138",
        }
    ]
    print(f"Duplicate text key fixes: {dup_ids}")


if __name__ == "__main__":
    main()

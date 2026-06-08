#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""uclu-basamakli-toplama: uc sayili premise sorularinda addsol aciklamalarini duzelt."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from patch_toplama_gemini import (  # noqa: E402
    build_multi_add_explanation,
    extract_addends_from_premise,
)

JSON_PATH = ROOT / "data" / "uclu-basamakli-toplama-s3-150.json"
ADDSOL_RE = re.compile(r"\[\[\s*addsol\s*:\s*((?:\d+\s*\+\s*)+\d+)\s*\]\]")


def addsol_sum(markup: str) -> int | None:
    m = ADDSOL_RE.search(markup or "")
    if not m:
        return None
    nums = [int(x.strip()) for x in m.group(1).split("+")]
    return sum(nums)


def audit_questions(questions: list[dict]) -> list[str]:
    issues: list[str] = []
    for q in questions:
        qid = q.get("id", "?")
        correct = int(q["correct"]) if str(q.get("correct", "")).isdigit() else None
        if correct is None:
            continue
        exp = q.get("explanation") or ""
        shown = addsol_sum(exp)
        triple = extract_addends_from_premise(q.get("premise", "") or q.get("text", ""), correct)
        if triple and shown is not None and shown != correct:
            issues.append(f"{qid}: addsol={shown}, correct={correct}, premise={triple}")
    return issues


def patch_questions(questions: list[dict]) -> int:
    fixed = 0
    for q in questions:
        correct = int(q["correct"]) if str(q.get("correct", "")).isdigit() else None
        if correct is None:
            continue
        triple = extract_addends_from_premise(q.get("premise", "") or q.get("text", ""), correct)
        if not triple:
            continue
        exp = q.get("explanation") or ""
        shown = addsol_sum(exp)
        if shown == correct:
            continue
        new_exp = build_multi_add_explanation(triple, correct)
        q["explanation"] = new_exp
        app = q.get("app")
        if isinstance(app, dict):
            app["explanation"] = new_exp
        fixed += 1
        print(f"fixed {q.get('id')}: {triple} -> {correct}")
    return fixed


def main() -> int:
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    questions = data.get("questions") or data
    if isinstance(questions, dict):
        questions = questions.get("questions", [])
    before = audit_questions(questions)
    if before:
        print("before:", *before, sep="\n  ")
    fixed = patch_questions(questions)
    after = audit_questions(questions)
    if after:
        print("after:", *after, sep="\n  ")
        return 1
    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK: {fixed} soru duzeltildi, {JSON_PATH.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

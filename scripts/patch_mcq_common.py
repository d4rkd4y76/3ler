# -*- coding: utf-8 -*-
"""MCQ şık dengesi ve açıklama yazım düzeltmeleri — ortak."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TYPO_FIXES_PATH = ROOT / "data" / "explanation-typo-fixes.json"

_TYPO_FIXES: dict[str, str] | None = None


def load_typo_fixes() -> dict[str, str]:
    global _TYPO_FIXES
    if _TYPO_FIXES is None:
        if TYPO_FIXES_PATH.is_file():
            _TYPO_FIXES = json.loads(TYPO_FIXES_PATH.read_text(encoding="utf-8"))
        else:
            _TYPO_FIXES = {}
    return _TYPO_FIXES


def apply_mcq_balance(q: dict) -> dict:
    from mcq_option_balance import balance_options

    return balance_options(q)


def apply_explanation_typo(q: dict) -> dict:
    qid = q.get("id") or ""
    fix = load_typo_fixes().get(qid)
    if fix:
        q["explanation"] = fix
    return q


def apply_mcq_enhancements(q: dict) -> dict:
    q = apply_mcq_balance(q)
    q = apply_explanation_typo(q)
    return q

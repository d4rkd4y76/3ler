#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kullanıcı mesajındaki Gezegen sorularını gezegen-gemini-raw.json olarak yazar."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "gezegen-gemini-raw.json"

# Kullanıcı tarafından sağlanan 140 soru
QUESTIONS: list[dict] = json.loads(
    (Path(__file__).resolve().parent / "gezegen_user_payload.json").read_text(encoding="utf-8")
)

if __name__ == "__main__":
    OUT.write_text(json.dumps(QUESTIONS, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(QUESTIONS)} questions -> {OUT}")

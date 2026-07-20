# -*- coding: utf-8 -*-
"""3. sınıf Fen Bilimleri konuları — ortak yapılandırma."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORD_DIR = Path.home() / "Desktop" / "SORULAR WORD"
HEADING_ID = "SINIF3"
LESSON_ID = "lesson_fen_bilimleri"

_CURRICULUM = json.loads((ROOT / "data" / "tymm-curriculum.json").read_text(encoding="utf-8"))
_FEN_TOPICS: list[str] = next(
    les["topics"]
    for g in _CURRICULUM["grades"]
    if g["grade"] == 3
    for les in g["lessons"]
    if les["id"] == LESSON_ID
)

_KEY_PREFIX = {
    1: "fen3_gezegen_",
    2: "fen3_duyu_",
    3: "fen3_kuv_",
    4: "fen3_madde_",
    5: "fen3_isik_ses_",
    6: "fen3_canli_",
    7: "fen3_elektrik_",
}

_RAW_FILE = {
    1: "gezegen-gemini-raw.json",
    2: "duyu-gemini-raw.json",
    3: "kuv-gemini-raw.json",
    4: "madde-gemini-raw.json",
    5: "isik-ses-gemini-raw.json",
    6: "canli-gemini-raw.json",
    7: "elektrik-gemini-raw.json",
}

TOPICS: list[dict] = [
    {
        "id": f"t{i:02d}",
        "order": i,
        "name": name,
        "title": name,
        "key_prefix": _KEY_PREFIX.get(i, f"fen3_t{i:02d}_"),
        "raw_file": _RAW_FILE.get(i, f"fen3-t{i:02d}-gemini-raw.json"),
        "data_file": f"fen3-t{i:02d}-s3-150.json",
        "word_file": f"{name.split('(')[0].strip()} (3. Sınıf) - 150 Soru - GÜNCEL v4.docx",
        "word_subtitle": f"Konu: {name}",
    }
    for i, name in enumerate(_FEN_TOPICS, start=1)
]


def get_topic(topic_id: str) -> dict:
    for t in TOPICS:
        if t["id"] == topic_id:
            return t
    raise KeyError(topic_id)

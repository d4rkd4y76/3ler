# -*- coding: utf-8 -*-
"""3. sınıf Matematik konuları — ortak yapılandırma.

ÖNEMLİ: Firebase/dllwrld konu anahtarları TYMM ile uyumlu t01, t02, … olmalıdır.
Uzun slug (topic_01_…) kullanılmaz; aksi halde arayüzde teknik id görünür.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORD_DIR = Path.home() / "Desktop" / "SORULAR WORD"
HEADING_ID = "SINIF3"
LESSON_ID = "lesson_matematik"

_CURRICULUM = json.loads((ROOT / "data" / "tymm-curriculum.json").read_text(encoding="utf-8"))
_MAT_TOPICS: list[str] = next(
    les["topics"]
    for g in _CURRICULUM["grades"]
    if g["grade"] == 3
    for les in g["lessons"]
    if les["id"] == LESSON_ID
)

TOPICS: list[dict] = [
    {
        "id": f"t{i:02d}",
        "order": i,
        "name": name,
        "title": name,
        "key_prefix": (
            "mat3_sayilar_"
            if i == 1
            else "mat3_yuvarlama_"
            if i == 2
            else "mat3_tekcift_"
            if i == 3
            else "mat3_toplama_"
            if i == 4
            else "mat3_cikarma_"
            if i == 5
            else f"mat3_t{i:02d}_"
        ),
        "raw_file": (
            "sayilar-gemini-raw.json"
            if i == 1
            else "yuvarlama-gemini-raw.json"
            if i == 2
            else "tekcift-gemini-raw.json"
            if i == 3
            else "toplama-gemini-raw.json"
            if i == 4
            else "cikarma-gemini-raw.json"
            if i == 5
            else f"mat3-t{i:02d}-gemini-raw.json"
        ),
        "data_file": (
            "uc-basamakli-sayilar-s3-150.json"
            if i == 1
            else "yuvarlama-siralama-romen-s3-150.json"
            if i == 2
            else "tek-cift-sayilar-s3-150.json"
            if i == 3
            else "uclu-basamakli-toplama-s3-150.json"
            if i == 4
            else "uclu-basamakli-cikarma-s3-150.json"
            if i == 5
            else f"mat3-t{i:02d}-s3-150.json"
        ),
        "word_file": "Üç Basamaklı Doğal Sayılar (3. Sınıf) - 150 Soru - GÜNCEL v4.docx"
        if i == 1
        else f"{name.split('(')[0].strip()} (3. Sınıf) - 150 Soru - GÜNCEL v4.docx",
        "word_subtitle": f"Konu: {name}",
    }
    for i, name in enumerate(_MAT_TOPICS, start=1)
]


def get_topic(topic_id: str) -> dict:
    for t in TOPICS:
        if t["id"] == topic_id:
            return t
    raise KeyError(topic_id)

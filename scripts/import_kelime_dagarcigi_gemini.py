#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gemini'den gelen Kelime Dağarcığı sorularını uygulama formatına işler."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))

from question_build_common import (
    normalize_question,
    patch_dllwrld,
    write_json_pack,
    write_word_doc,
)

RAW_PATH = ROOT / "data" / "kelime-gemini-raw.json"
DATA_PATH = ROOT / "data" / "kelime-dagarcigi-s3-150.json"
DLLWRLD_PATH = ROOT / "dllwrld.json"
WORD_DIR = Path.home() / "Desktop" / "SORULAR WORD"
WORD_PATH = WORD_DIR / "Kelime Dağarcığı (3. Sınıf) - 150 Soru - GÜNCEL v4.docx"

TOPIC_ID = "t02"
TITLE = "Kelime Dağarcığı (Eş ve zıt anlamlı kelimeler, Eş Sesli/Sesteş kelimeler)"
KEY_PREFIX = "kelime3_"


def fix_premise_text_split(q: dict) -> dict:
    premise = (q.get("premise") or "").strip() or None
    text = (q.get("text") or "").strip() or None

    if premise and not text:
        if premise.endswith("?"):
            q["text"] = premise
            q["premise"] = None
        return q

    if premise and text:
        t = text
        if t.startswith("Buna göre"):
            q["text"] = "Yukarıdaki bilgilere göre" + t[9:]
        elif t.startswith("Bu bilgiye göre"):
            q["text"] = "Yukarıdaki bilgilere göre" + t[15:]
        elif t.startswith("Bu kurala göre"):
            q["text"] = "Yukarıdaki kurala göre" + t[15:]
        elif t.startswith("Bu metin") or t.startswith("Bu cümle"):
            q["text"] = "Yukarıdaki" + t[2:]
        elif t.startswith("Bu ") and "Yukarı" not in t:
            q["text"] = "Yukarıdaki " + t[3:].lower()
    return q


def capitalize_after_yukaridaki(text: str) -> str:
    for marker in (
        "Yukarıdaki metne göre ",
        "Yukarıdaki bilgilere göre ",
        "Yukarıdaki kurala göre ",
    ):
        if text.startswith(marker):
            i = len(marker)
            if i < len(text) and text[i].islower():
                return text[:i] + text[i].upper() + text[i + 1 :]
            break
    return text


def prepare_question(q: dict) -> dict:
    q = fix_premise_text_split(dict(q))
    q = normalize_question(q)
    if q.get("premise") and q.get("text"):
        t = q["text"]
        if "Yukarı" not in t and "yukarı" not in t.lower():
            q["text"] = "Yukarıdaki bilgilere göre " + t[0].lower() + t[1:]
    if q.get("text"):
        q["text"] = capitalize_after_yukaridaki(q["text"])
    return q


def load_raw(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict) and "questions" in data:
        return data["questions"]
    if isinstance(data, list):
        return data
    raise ValueError("Beklenen JSON: liste veya {questions: [...]}")


def validate(questions: list[dict]) -> None:
    if len(questions) != 150:
        raise SystemExit(f"150 soru bekleniyordu, {len(questions)} bulundu.")
    if len({q["id"] for q in questions}) != 150:
        raise SystemExit("Tekrarlayan id var.")
    for i, q in enumerate(questions, 1):
        if not (q.get("text") or "").strip():
            raise SystemExit(f"Boş text: {q.get('id', i)}")
        for k in ("correct", "wrong1", "wrong2", "explanation", "level"):
            if not q.get(k):
                raise SystemExit(f"Eksik {k}: {q.get('id', i)}")


def main() -> int:
    raw_path = Path(sys.argv[1]) if len(sys.argv) > 1 else RAW_PATH
    if not raw_path.is_file():
        raise SystemExit(f"Dosya yok: {raw_path}")

    questions = [prepare_question(q) for q in load_raw(raw_path)]
    validate(questions)

    write_json_pack(
        questions,
        data_path=DATA_PATH,
        topic_id=TOPIC_ID,
        title=TITLE,
    )
    patch_dllwrld(
        questions,
        dllwrld_path=DLLWRLD_PATH,
        topic_id=TOPIC_ID,
    )
    write_word_doc(
        questions,
        word_path=WORD_PATH,
        title=TITLE,
        key_prefix=KEY_PREFIX,
        subtitle="Konu: Eş anlamlı, zıt anlamlı ve eş sesli (sesteş) kelimeler",
    )

    levels: dict[str, int] = {}
    with_premise = 0
    for q in questions:
        levels[q["level"]] = levels.get(q["level"], 0) + 1
        if q.get("premise"):
            with_premise += 1

    print(f"OK: {len(questions)} soru işlendi")
    print(f"  Kolay/Orta/Zor: {levels.get('kolay',0)}/{levels.get('orta',0)}/{levels.get('zor',0)}")
    print(f"  Öncüllü: {with_premise}")
    print(f"JSON: {DATA_PATH}")
    print(f"Word: {WORD_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

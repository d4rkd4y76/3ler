#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gemini'den gelen Üç Basamaklı Doğal Sayılar sorularını işler."""
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
from s3_matematik_topics import get_topic, HEADING_ID, LESSON_ID

TOPIC = get_topic("t01")
RAW_PATH = ROOT / "data" / "sayilar-gemini-raw.json"
DATA_PATH = ROOT / "data" / TOPIC["data_file"]
DLLWRLD_PATH = ROOT / "dllwrld.json"
WORD_PATH = Path.home() / "Desktop" / "SORULAR WORD" / TOPIC["word_file"]

TOPIC_ID = TOPIC["id"]
TITLE = TOPIC["title"]
KEY_PREFIX = TOPIC["key_prefix"]


def strip_markdown(s: str) -> str:
    return re.sub(r"\*\*(.+?)\*\*", r"\1", s or "")


def fix_premise_text_split(q: dict) -> dict:
    for key in ("text", "correct", "wrong1", "wrong2", "explanation"):
        if q.get(key):
            q[key] = strip_markdown(str(q[key])).strip()
    if q.get("premise"):
        q["premise"] = strip_markdown(str(q["premise"])).strip() or None

    premise = q.get("premise")
    text = (q.get("text") or "").strip() or None
    q["text"] = text

    if premise and not text:
        if premise.endswith("?"):
            q["text"] = premise
            q["premise"] = None
        return q

    if not text:
        return q

    if premise and text.startswith("Buna göre"):
        q["text"] = "Yukarıdaki bilgilere göre" + text[9:]
    elif premise and text.startswith("Bu bilgiye göre"):
        q["text"] = "Yukarıdaki bilgilere göre" + text[15:]
    elif premise and text.startswith("Bu kurala göre"):
        q["text"] = "Yukarıdaki kurala göre" + text[15:]
    elif premise and text.startswith("Efe'nin"):
        q["text"] = "Yukarıdaki bilgilere göre " + text[0].lower() + text[1:]
    return q


def prepare_question(q: dict) -> dict:
    q = fix_premise_text_split(dict(q))
    q = normalize_question(q)
    if q.get("premise") and q.get("text"):
        t = q["text"]
        if "Yukarı" not in t and "yukarı" not in t.lower():
            p = q["premise"]
            if len(p) > 20 and not p.endswith("?"):
                q["text"] = "Yukarıdaki bilgilere göre " + t[0].lower() + t[1:]
    return q


def load_raw(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict) and "questions" in data:
        return data["questions"]
    if isinstance(data, list):
        return data
    raise ValueError("Beklenen JSON: liste veya {questions: [...]}")


def validate(questions: list[dict]) -> None:
    if not questions:
        raise SystemExit("Hiç soru bulunamadı.")
    if len({q["id"] for q in questions}) != len(questions):
        raise SystemExit("Tekrarlayan id var.")
    for i, q in enumerate(questions, 1):
        if not (q.get("text") or "").strip():
            raise SystemExit(f"Boş text: {q.get('id', i)}")
        for k in ("correct", "wrong1", "wrong2", "explanation", "level"):
            if not q.get(k):
                raise SystemExit(f"Eksik {k}: {q.get('id', i)}")
        opts = {q["correct"], q["wrong1"], q["wrong2"]}
        if len(opts) < 3:
            raise SystemExit(f"Yinelenen şık: {q.get('id', i)} -> {opts}")


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
        lesson_id_kw=LESSON_ID,
    )
    patch_dllwrld(
        questions,
        dllwrld_path=DLLWRLD_PATH,
        topic_id=TOPIC_ID,
        heading_id=HEADING_ID,
        lesson_id_kw=LESSON_ID,
        topic_name=TOPIC["name"],
        topic_order=TOPIC["order"],
    )
    write_word_doc(
        questions,
        word_path=WORD_PATH,
        title=TITLE,
        key_prefix=KEY_PREFIX,
        subtitle=TOPIC.get("word_subtitle", ""),
        subject_label="3. Sınıf Matematik",
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

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gemini'den gelen Noktalama İşaretleri sorularını işler."""
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
    parse_roman_items,
    patch_dllwrld,
    write_json_pack,
    write_word_doc,
)
from s3_turkce_topics import get_topic

TOPIC = get_topic("t08")
RAW_PATH = ROOT / "data" / "noktalama-gemini-raw.json"
DATA_PATH = ROOT / "data" / TOPIC["data_file"]
DLLWRLD_PATH = ROOT / "dllwrld.json"
WORD_PATH = Path.home() / "Desktop" / "SORULAR WORD" / TOPIC["word_file"].replace("v3", "v4")

TOPIC_ID = TOPIC["id"]
TITLE = TOPIC["title"]
KEY_PREFIX = "noktalama3_"


def strip_markdown(s: str) -> str:
    return re.sub(r"\*\*(.+?)\*\*", r"\1", s or "")


def clean_premise_quotes(premise: str | None) -> str | None:
    if not premise:
        return None
    p = premise.strip()
    if len(p) >= 2 and p[0] in "\"'" and p[-1] == p[0]:
        p = p[1:-1].strip()
    return p or None


def fix_premise_text_split(q: dict) -> dict:
    for key in ("text", "correct", "wrong1", "wrong2", "explanation"):
        if q.get(key):
            q[key] = strip_markdown(str(q[key])).strip()
    if q.get("premise"):
        q["premise"] = clean_premise_quotes(strip_markdown(str(q["premise"])))

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
    elif premise and text.startswith("Bu cümlede"):
        q["text"] = "Yukarıdaki cümlede" + text[len("Bu cümlede") :]
    return q


def fix_yukaridaki_caps(text: str) -> str:
    for bad, good in (
        ("Yukarıdaki bilgilere göre A", "Yukarıdaki bilgilere göre a"),
        ("Yukarıdaki kurala göre A", "Yukarıdaki kurala göre a"),
        ("Yukarıdaki cümlede A", "Yukarıdaki cümlede a"),
    ):
        if text.startswith(bad):
            return good + text[len(bad) :]
    return text


def prepare_question(q: dict) -> dict:
    q = fix_premise_text_split(dict(q))
    q = normalize_question(q)
    if q.get("premise") and q.get("text"):
        t = q["text"]
        if "Yukarı" not in t and "yukarı" not in t.lower():
            p = q["premise"]
            if parse_roman_items(p) or re.search(r"^I\.", p.strip(), re.MULTILINE):
                q["text"] = "Yukarıdaki bilgilere göre " + t[0].lower() + t[1:]
            elif len(p) > 30 and not p.endswith("?"):
                q["text"] = "Yukarıdaki bilgilere göre " + t[0].lower() + t[1:]
    if q.get("text"):
        q["text"] = fix_yukaridaki_caps(q["text"])
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
        subtitle=TOPIC.get("word_subtitle", ""),
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

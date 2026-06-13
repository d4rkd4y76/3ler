#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gemini'den gelen 3. sınıf Matematik sorularını işler (t01, t02, …)."""
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

DLLWRLD_PATH = ROOT / "dllwrld.json"

BUNA_GORE = (
    ("Buna göre", "Yukarıdaki bilgilere göre"),
    ("Bu bilgiye göre", "Yukarıdaki bilgilere göre"),
    ("Bu kurala göre", "Yukarıdaki kurala göre"),
    ("Yukarıdaki sıralamada", "Yukarıdaki sıralamada"),
    ("Yukarıdaki eşitsizlikte", "Yukarıdaki eşitsizlikte"),
    ("Yukarıdaki eşitsizliklerden", "Yukarıdaki eşitsizliklerden"),
    ("Yukarıdaki karşılaştırmada", "Yukarıdaki karşılaştırmada"),
    ("Yukarıdaki karşılıklı konuşmada", "Yukarıdaki karşılıklı konuşmada"),
)


def strip_markdown(s: str) -> str:
    return re.sub(r"\*\*(.+?)\*\*", r"\1", s or "")


def apply_topic_patches(topic_id: str, questions: list[dict]) -> list[dict]:
    if topic_id == "t07":
        from patch_bolme_gemini import patch_question

        return [patch_question(dict(q)) for q in questions]
    if topic_id == "t08":
        from patch_kesir_gemini import patch_question

        return [patch_question(dict(q)) for q in questions]
    if topic_id == "t09":
        from patch_zaman_gemini import patch_question

        return [patch_question(dict(q)) for q in questions]
    if topic_id in ("t10", "t11"):
        from patch_para_tartma_gemini import filter_for_topic, patch_question

        scoped = filter_for_topic(topic_id, questions)
        return [patch_question(dict(q)) for q in scoped]
    return questions


def fix_premise_text_split(q: dict) -> dict:
    for key in ("text", "correct", "wrong1", "wrong2"):
        if q.get(key):
            q[key] = strip_markdown(str(q[key])).strip()
    if q.get("explanation"):
        expl = str(q["explanation"]).strip()
        if "[[" not in expl:
            q["explanation"] = strip_markdown(expl)
        else:
            q["explanation"] = expl
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

    if not text or not premise:
        return q

    for src, dst in BUNA_GORE:
        if text.startswith(src):
            rest = text[len(src) :]
            q["text"] = dst + rest
            break

    if premise and q["text"].startswith("Ali'nin"):
        q["text"] = "Yukarıdaki bilgilere göre " + q["text"][0].lower() + q["text"][1:]
    elif premise and q["text"].startswith("Ali "):
        q["text"] = "Yukarıdaki bilgilere göre " + q["text"][0].lower() + q["text"][1:]
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
    topic_id = sys.argv[1] if len(sys.argv) > 1 else "t02"
    topic = get_topic(topic_id)
    raw_path = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "data" / topic["raw_file"]
    if not raw_path.is_file():
        raise SystemExit(f"Dosya yok: {raw_path}")

    data_path = ROOT / "data" / topic["data_file"]
    word_path = Path.home() / "Desktop" / "SORULAR WORD" / topic["word_file"]

    questions = [prepare_question(q) for q in load_raw(raw_path)]
    questions = apply_topic_patches(topic_id, questions)
    validate(questions)

    write_json_pack(
        questions,
        data_path=data_path,
        topic_id=topic["id"],
        title=topic["title"],
        lesson_id_kw=LESSON_ID,
    )
    patch_dllwrld(
        questions,
        dllwrld_path=DLLWRLD_PATH,
        topic_id=topic["id"],
        heading_id=HEADING_ID,
        lesson_id_kw=LESSON_ID,
        topic_name=topic["name"],
        topic_order=topic["order"],
    )
    write_word_doc(
        questions,
        word_path=word_path,
        title=topic["title"],
        key_prefix=topic["key_prefix"],
        subtitle=topic.get("word_subtitle", ""),
        subject_label="3. Sınıf Matematik",
    )

    levels: dict[str, int] = {}
    with_premise = 0
    for q in questions:
        levels[q["level"]] = levels.get(q["level"], 0) + 1
        if q.get("premise"):
            with_premise += 1

    print(f"OK: {topic_id} — {len(questions)} soru")
    print(f"  Kolay/Orta/Zor: {levels.get('kolay',0)}/{levels.get('orta',0)}/{levels.get('zor',0)}")
    print(f"  Öncüllü: {with_premise}")
    print(f"JSON: {data_path}")
    print(f"Word: {word_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

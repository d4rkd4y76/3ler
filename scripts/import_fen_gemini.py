#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gemini'den gelen 3. sınıf Fen Bilimleri sorularını işler (t01, t02, …)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))

from question_build_common import patch_dllwrld, write_json_pack, write_word_doc
from mat3_question_quality import finalize_question, prepare_question_light
from s3_fen_topics import get_topic, HEADING_ID, LESSON_ID

DLLWRLD_PATH = ROOT / "dllwrld.json"


def apply_topic_patches(topic_id: str, questions: list[dict]) -> list[dict]:
    if topic_id == "t01":
        from patch_gezegen_gemini import enhance_question

        return [enhance_question(dict(q)) for q in questions]
    if topic_id == "t02":
        from patch_duyu_gemini import enhance_question

        return [enhance_question(dict(q)) for q in questions]
    if topic_id == "t03":
        from patch_kuv_gemini import enhance_question

        return [enhance_question(dict(q)) for q in questions]
    return questions


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
    topic_id = sys.argv[1] if len(sys.argv) > 1 else "t01"
    topic = get_topic(topic_id)
    raw_path = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "data" / topic["raw_file"]
    if not raw_path.is_file():
        raise SystemExit(f"Dosya yok: {raw_path}")

    data_path = ROOT / "data" / topic["data_file"]
    word_path = Path.home() / "Desktop" / "SORULAR WORD" / topic["word_file"]

    raw = load_raw(raw_path)
    questions = []
    for i, q in enumerate(raw, 1):
        item = prepare_question_light(dict(q))
        if not item.get("id"):
            item["id"] = f"{topic['key_prefix']}{i:03d}"
        questions.append(item)

    questions = apply_topic_patches(topic_id, questions)
    questions = [finalize_question(q) for q in questions]
    if topic_id == "t02":
        from patch_duyu_gemini import fix_stem_after_finalize

        questions = [fix_stem_after_finalize(q) for q in questions]
    if topic_id == "t03":
        from patch_kuv_gemini import fix_stem_after_finalize

        questions = [fix_stem_after_finalize(q) for q in questions]
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
        subject_label="3. Sınıf Fen Bilimleri",
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

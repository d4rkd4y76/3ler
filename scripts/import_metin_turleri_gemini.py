#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gemini'den gelen Metin Türleri sorularını uygulama formatına işler ve yükler."""
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
    to_app_payload,
    write_json_pack,
    write_word_doc,
)

RAW_PATH = ROOT / "data" / "metin-gemini-raw.json"
DATA_PATH = ROOT / "data" / "metin-turleri-s3-150.json"
DLLWRLD_PATH = ROOT / "dllwrld.json"
WORD_DIR = Path.home() / "Desktop" / "SORULAR WORD"
WORD_PATH = WORD_DIR / "Metin Türleri (3. Sınıf) - 150 Soru - GÜNCEL v4.docx"

TOPIC_ID = "t01"
TITLE = "Metin Türleri (Hikâye edici metinler, bilgilendirici metinler ve şiir)"
KEY_PREFIX = "metin3_"

_ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]


def arabic_lines_to_roman(premise: str) -> str:
    """1. 2. 3. satırlarını I. II. III. yap (karşılaştırma öncülleri)."""
    out: list[str] = []
    for line in (premise or "").split("\n"):
        s = line.strip()
        m = re.match(r"^(\d+)\.\s*(.+)$", s)
        if m:
            n = int(m.group(1))
            if 1 <= n <= len(_ROMAN):
                out.append(f"{_ROMAN[n - 1]}. {m.group(2).strip()}")
                continue
        out.append(line)
    return "\n".join(out)


def fix_premise_text_split(q: dict) -> dict:
    """Eksik text veya öncülde birleşik soru düzeltmeleri."""
    premise = (q.get("premise") or "").strip() or None
    text = (q.get("text") or "").strip() or None

    if premise and not text:
        if premise.endswith("?"):
            q["text"] = premise
            q["premise"] = None
        return q

    if premise and text:
        t = text.strip()
        if t.startswith("Bu metin") or t.startswith("Bu cümle") or t.startswith("Bu tekerleme"):
            text = "Yukarıdaki" + t[2:]  # Bu -> Yukarıdaki
            q["text"] = text
        elif t.startswith("Bu ") and "Yukarı" not in t:
            text = "Yukarıdaki " + t[3:].lower()
            q["text"] = text
        return q

    return q


def prepare_question(q: dict) -> dict:
    q = fix_premise_text_split(dict(q))
    if q.get("premise"):
        q["premise"] = arabic_lines_to_roman(q["premise"])
    q = normalize_question(q)
    if q.get("premise") and q.get("text"):
        t = q["text"]
        p = q["premise"]
        if "Yukarı" not in t and "yukarı" not in t.lower():
            if len(p) > 40 and not re.match(r"^I\.", p.strip()):
                q["text"] = "Yukarıdaki metne göre " + t[0].lower() + t[1:]
            elif re.search(r"^I\.", p.strip(), re.MULTILINE):
                if "hangileri" in t.lower() or "hangisi" in t.lower():
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
    if len(questions) != 150:
        raise SystemExit(f"150 soru bekleniyordu, {len(questions)} bulundu.")
    ids = [q["id"] for q in questions]
    if len(set(ids)) != 150:
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
        subtitle="Konu: Masal, fabl, hikâye, bilgilendirici metin, şiir, mektup, günlük, anı",
    )

    levels = {}
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

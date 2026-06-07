#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""3. sınıf Kelime Dağarcığı — 150 soru üret, dllwrld.json güncelle, Word dosyası oluştur."""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))

from question_build_common import patch_dllwrld, write_json_pack, write_word_doc

DATA_PATH = ROOT / "data" / "kelime-dagarcigi-s3-150.json"
DLLWRLD_PATH = ROOT / "dllwrld.json"
WORD_DIR = Path.home() / "Desktop" / "SORULAR WORD"
WORD_PATH = WORD_DIR / "Kelime Dağarcığı (3. Sınıf) - 150 Soru - GÜNCEL.docx"

TOPIC_ID = "t02"
HEADING_ID = "SINIF3"
LESSON_ID = "lesson_turkce"
KEY_PREFIX = "kelime3_"
TITLE = "Kelime Dağarcığı (Eş ve zıt anlamlı kelimeler, Eş Sesli/Sesteş kelimeler)"


def build_questions() -> list[dict]:
    bank_path = SCRIPTS / "kelime_dagarcigi_s3_bank.py"
    spec = importlib.util.spec_from_file_location("kelime_dagarcigi_s3_bank", bank_path)
    bank = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bank)
    return bank.get_questions()


def main() -> int:
    questions = build_questions()
    if len(questions) != 150:
        raise SystemExit(f"Beklenen 150 soru, üretilen: {len(questions)}")

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
    )

    print(f"OK: {len(questions)} soru")
    print(f"JSON: {DATA_PATH}")
    print(f"dllwrld: {TOPIC_ID}")
    print(f"Word: {WORD_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

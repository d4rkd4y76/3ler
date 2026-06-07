#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tek bir 3. sınıf Türkçe konusu için build (JSON + dllwrld + Word)."""
from __future__ import annotations

import argparse
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

from question_build_common import patch_dllwrld, write_json_pack, write_word_doc
from s3_turkce_topics import TOPICS, WORD_DIR, get_topic

DLLWRLD_PATH = ROOT / "dllwrld.json"
DATA_DIR = ROOT / "data"


def load_bank(module_name: str):
    path = SCRIPTS / f"{module_name}.py"
    if not path.is_file():
        raise SystemExit(f"Bank dosyası yok: {path}")
    spec = importlib.util.spec_from_file_location(module_name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.get_questions()


def build_one(cfg: dict) -> list[dict]:
    questions = load_bank(cfg["bank_module"])
    if len(questions) != 150:
        raise SystemExit(f"{cfg['id']}: beklenen 150, üretilen {len(questions)}")

    data_path = DATA_DIR / cfg["data_file"]
    word_path = WORD_DIR / cfg["word_file"]

    write_json_pack(
        questions,
        data_path=data_path,
        topic_id=cfg["id"],
        title=cfg["title"],
    )
    patch_dllwrld(questions, dllwrld_path=DLLWRLD_PATH, topic_id=cfg["id"])
    write_word_doc(
        questions,
        word_path=word_path,
        title=cfg["title"],
        key_prefix=cfg["key_prefix"],
    )
    print(f"OK {cfg['id']}: {len(questions)} soru | JSON: {data_path.name} | Word: {word_path.name}")
    return questions


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("topic", nargs="?", help="t03..t08 veya 'all'")
    args = ap.parse_args()

    if not args.topic or args.topic == "all":
        for cfg in TOPICS:
            build_one(cfg)
        return 0

    build_one(get_topic(args.topic))
    return 0


if __name__ == "__main__":
    sys.exit(main())

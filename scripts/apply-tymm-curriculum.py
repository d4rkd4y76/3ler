#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TYMM müfredatını championData/headings yapısına yazar.
Mevcut tüm ders/konu/soruları siler; konular boş questions ile oluşturulur.

Kullanım:
  python scripts/apply-tymm-curriculum.py --dry-run
  python scripts/apply-tymm-curriculum.py --patch-dllwrld
  python scripts/apply-tymm-curriculum.py --patch-dllwrld --clear-class-questions
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CURRICULUM_PATH = ROOT / "data" / "tymm-curriculum.json"
DLLWRLD_PATH = ROOT / "dllwrld.json"


def slug_ascii(text: str, max_len: int = 48) -> str:
    tr = str.maketrans(
        "çğıöşüÇĞİÖŞÜ",
        "cgiosuCGIOSU",
    )
    s = text.translate(tr).lower()
    s = re.sub(r"[^a-z0-9]+", "_", s).strip("_")
    if not s:
        s = "konu"
    return s[:max_len]


def build_champion_headings(curriculum: dict) -> dict[str, Any]:
    headings: dict[str, Any] = {}
    for grade_block in curriculum.get("grades", []):
        g = int(grade_block["grade"])
        hid = f"SINIF{g}"
        lessons_out: dict[str, Any] = {}
        for li, lesson in enumerate(grade_block.get("lessons", []), start=1):
            lid = lesson["id"]
            topics_out: dict[str, Any] = {}
            for i, topic_name in enumerate(lesson.get("topics", []), start=1):
                tid = f"t{i:02d}"
                topics_out[tid] = {
                    "name": topic_name,
                    "active": True,
                    "order": i,
                    "questions": {},
                    "questionIds": {},
                }
            lessons_out[lid] = {
                "name": lesson["name"],
                "order": li,
                "topics": topics_out,
            }
        headings[hid] = {
            "name": grade_block.get("headingName") or f"{g}.SINIF",
            "lessons": lessons_out,
        }
    return headings


def clear_class_content_questions(data: dict) -> None:
    cc = data.setdefault("classContent", {})
    for key in list(cc.keys()):
        if not (key.startswith("sinif") or key.startswith("class_")):
            continue
        block = cc[key]
        if not isinstance(block, dict):
            continue
        for game in ("fillBlanks", "dailyPuzzles", "matchingGame"):
            if game in block and isinstance(block[game], dict):
                block[game]["questions"] = {}
                block[game]["questionIds"] = {}
        if "denemeQuestions" in block:
            block["denemeQuestions"] = {}


def stats(headings: dict) -> dict[str, int]:
    lessons = topics = 0
    for h in headings.values():
        for l in (h.get("lessons") or {}).values():
            lessons += 1
            topics += len((l.get("topics") or {}))
    return {"headings": len(headings), "lessons": lessons, "topics": topics}


def main() -> int:
    parser = argparse.ArgumentParser(description="TYMM müfredatını uygula")
    parser.add_argument("--dry-run", action="store_true", help="Sadece özet yaz")
    parser.add_argument("--patch-dllwrld", action="store_true", help="dllwrld.json güncelle")
    parser.add_argument(
        "--clear-class-questions",
        action="store_true",
        help="classContent içindeki fillBlanks/dailyPuzzles/matchingGame/deneme sorularını da sil",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=ROOT / "dist" / "tymm-champion-headings.json",
        help="Dışa aktarım dosyası",
    )
    args = parser.parse_args()

    if not CURRICULUM_PATH.is_file():
        print(f"Bulunamadı: {CURRICULUM_PATH}", file=sys.stderr)
        return 1

    with CURRICULUM_PATH.open(encoding="utf-8") as f:
        curriculum = json.load(f)

    headings = build_champion_headings(curriculum)
    st = stats(headings)
    print(f"TYMM müfredat: {st['headings']} sınıf, {st['lessons']} ders, {st['topics']} konu (soru yok)")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as f:
        json.dump({"headings": headings}, f, ensure_ascii=False, indent=2)
    print(f"Yazıldı: {args.out}")

    if args.dry_run and not args.patch_dllwrld:
        return 0

    if args.patch_dllwrld:
        if not DLLWRLD_PATH.is_file():
            print(f"dllwrld.json yok: {DLLWRLD_PATH}", file=sys.stderr)
            return 1
        with DLLWRLD_PATH.open(encoding="utf-8") as f:
            data = json.load(f)
        cd = data.setdefault("championData", {})
        cd["headings"] = headings
        data["lessonVideoLookup"] = {}
        if "topicVideoUrls" in data:
            data["topicVideoUrls"] = {}
        if args.clear_class_questions:
            clear_class_content_questions(data)
            print("classContent oyun/deneme soruları temizlendi.")
        with DLLWRLD_PATH.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        print(f"Güncellendi: {DLLWRLD_PATH}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

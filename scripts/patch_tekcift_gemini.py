#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tek/çift batch tekrarlarini ozgun sorularla degistirir."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "tekcift-gemini-raw.json"

REPLACEMENTS: dict[str, dict] = {
    "mat3_tekcift_094": {
        "level": "orta",
        "premise": None,
        "text": "Rakamları birbirinden farklı iki basamaklı en küçük ÇİFT sayı kaçtır?",
        "correct": "10",
        "wrong1": "12",
        "wrong2": "20",
        "explanation": "İki basamaklı en küçük çift sayı 10'dur. Rakamları 1 ve 0 olduğu için birbirinden farklıdır.",
    },
    "mat3_tekcift_095": {
        "level": "orta",
        "premise": None,
        "text": "Rakamları birbirinden farklı iki basamaklı en büyük TEK sayı kaçtır?",
        "correct": "97",
        "wrong1": "99",
        "wrong2": "89",
        "explanation": "İki basamaklı en büyük tek sayı 99'dur fakat rakamları aynıdır. Rakamları farklı en büyük tek sayı 97'dir.",
    },
    "mat3_tekcift_096": {
        "level": "orta",
        "premise": None,
        "text": "Rakamları toplamı 6 olan en küçük iki basamaklı ÇİFT sayı kaçtır?",
        "correct": "24",
        "wrong1": "15",
        "wrong2": "42",
        "explanation": "İki basamaklı çift sayılar 10'dan başlar. Rakamları toplamı 6 olan en küçük çift sayı 24'tür (2+4=6).",
    },
    "mat3_tekcift_111": {
        "level": "orta",
        "premise": "Ardışık üç çift sayı düşünüldüğünde (Örn: 10, 12, 14).",
        "text": "Buna göre ardışık üç çift sayının toplamı her zaman ne tür bir sayıdır?",
        "correct": "Daima ÇİFT sayıdır.",
        "wrong1": "Daima TEK sayıdır.",
        "wrong2": "Bazen tek, bazen çift olur.",
        "explanation": "Çift + Çift + Çift = Çift kuralı gereği üç çift sayının toplamı daima çifttir. (Örn: 10+12+14=36).",
    },
}


def main() -> int:
    data = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    by_id = {q["id"]: i for i, q in enumerate(data)}
    for qid, repl in REPLACEMENTS.items():
        if qid not in by_id:
            raise SystemExit(f"Bulunamadi: {qid}")
        data[by_id[qid]] = {"id": qid, **repl}

    RAW_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Guncellendi: {len(REPLACEMENTS)} tekrar -> {RAW_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

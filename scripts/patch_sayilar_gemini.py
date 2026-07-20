#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gemini batch'teki hatalı/tekrarlayan sayılar sorularını düzeltir."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "sayilar-gemini-raw.json"

FIXES: dict[str, dict] = {
    "mat3_sayilar_018": {
        "level": "kolay",
        "premise": None,
        "text": "718 sayısının okunuşu aşağıdakilerden hangisidir?",
        "correct": "Yedi yüz on sekiz",
        "wrong1": "Yedi yüz seksen bir",
        "wrong2": "Yedi yüz on altı",
        "explanation": "718 sayısı 'Yedi yüz on sekiz' şeklinde okunur.",
    },
    "mat3_sayilar_030": {
        "wrong1": "225",
    },
    "mat3_sayilar_032": {
        "level": "kolay",
        "premise": None,
        "text": "Okunuşu 'Altı yüz otuz bir' olan doğal sayı aşağıdakilerden hangisidir?",
        "correct": "631",
        "wrong1": "613",
        "wrong2": "63",
        "explanation": "'Altı yüz otuz bir' olarak okunan sayı 6 yüzlük, 3 onluk ve 1 birlikten oluşur. Rakamla yazılışı 631'dir.",
    },
    "mat3_sayilar_035": {
        "level": "kolay",
        "premise": None,
        "text": "Okunuşu 'Yüz elli dört' olan doğal sayı aşağıdakilerden hangisidir?",
        "correct": "154",
        "wrong1": "145",
        "wrong2": "15",
        "explanation": "'Yüz elli dört' olarak okunan sayı 1 yüzlük, 5 onluk ve 4 birlikten oluşur. Rakamla yazılışı 154'tür.",
    },
    "mat3_sayilar_041": {
        "wrong1": "8",
        "wrong2": "80",
        "explanation": "Üç basamaklı sayılarda en sağdaki rakam birler basamağını gösterir. 887 sayısının birler basamağında 7 rakamı vardır.",
    },
    "mat3_sayilar_059": {
        "wrong1": "10",
        "wrong2": "50",
        "explanation": "550 sayısında 0 rakamı birler basamağındadır. Basamak değeri 0 x 1 = 0 olur.",
    },
    "mat3_sayilar_076": {
        "level": "orta",
        "premise": "Bir rakamın bulunduğu basamağa göre aldığı değere basamak değeri denir.",
        "text": "348 sayısındaki 4 rakamının basamak değeri kaçtır?",
        "correct": "40",
        "wrong1": "4",
        "wrong2": "400",
        "explanation": "348 sayısında 4 rakamı onlar basamağındadır. Basamak değeri 4 x 10 = 40 olur.",
    },
    "mat3_sayilar_081": {"wrong2": "626"},
    "mat3_sayilar_087": {"wrong2": "431"},
    "mat3_sayilar_090": {"wrong2": "986"},
    "mat3_sayilar_093": {"wrong2": "816"},
    "mat3_sayilar_096": {"wrong2": "771"},
    "mat3_sayilar_098": {"wrong2": "474"},
    "mat3_sayilar_099": {"wrong2": "340"},
}


def main() -> int:
    data = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    by_id = {q["id"]: i for i, q in enumerate(data)}

    for qid, patch in FIXES.items():
        if qid not in by_id:
            raise SystemExit(f"Bulunamadı: {qid}")
        data[by_id[qid]].update(patch)

    RAW_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Düzeltildi: {len(FIXES)} soru -> {RAW_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

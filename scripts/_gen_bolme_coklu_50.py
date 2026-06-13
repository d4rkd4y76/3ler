#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""131–180 arası 50 çoklu adım bölme sorusu üretir ve raw JSON'a ekler."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "bolme-gemini-raw.json"


def q(n, level, premise, text, correct, wrong1, wrong2, explanation):
    return {
        "id": f"mat3_bol_{n:03d}",
        "level": level,
        "premise": premise,
        "text": text,
        "correct": correct,
        "wrong1": wrong1,
        "wrong2": wrong2,
        "explanation": explanation,
    }


def build_coklu_50() -> tuple[list[dict], dict[str, list]]:
    items: list[dict] = []
    two_step: dict[str, list] = {}

    money = [
        (131, "Elif", 48, 12, 6, 6),
        (132, "Can", 50, 14, 4, 9),
        (133, "Deniz", 60, 18, 6, 7),
        (134, "Ece", 45, 15, 5, 6),
        (135, "Burak", 72, 24, 8, 6),
        (136, "Selin", 56, 16, 8, 5),
        (137, "Mert", 63, 15, 6, 8),
        (138, "Zeynep", 40, 16, 3, 8),
        (139, "Ayşe", 55, 19, 4, 9),
        (140, "Kerem", 68, 20, 8, 6),
        (141, "Defne", 52, 12, 5, 8),
        (142, "Ali", 46, 10, 6, 6),
        (143, "Sude", 64, 22, 7, 6),
        (144, "Emre", 58, 18, 5, 8),
        (145, "Cem", 75, 27, 8, 6),
    ]
    for n, name, total, spend, groups, ans in money:
        rem = total - spend
        qid = f"mat3_bol_{n:03d}"
        items.append(
            q(
                n,
                "zor",
                f"{name}'nin {total} lirası vardı. {spend} lirasına bir oyuncak aldı. "
                f"Kalan parasıyla tanesi eşit fiyatta olan {groups} adet defter aldı.",
                "Buna göre bir defterin fiyatı kaç liradır?",
                str(ans),
                str(ans + 1),
                str(ans - 1),
                f"Önce kalan parayı buluruz: {total} - {spend} = {rem} TL. "
                f"Kalan parayı eşit şekilde paylaştırdığı için böleriz: {rem} ÷ {groups} = {ans} TL.",
            )
        )
        two_step[qid] = [("sub", total, spend, rem), ("div", rem, groups, ans)]

    books = [
        (146, 22, 26, 6, 8),
        (147, 24, 18, 6, 7),
        (148, 15, 25, 5, 8),
        (149, 19, 23, 7, 6),
        (150, 28, 14, 6, 7),
        (151, 16, 32, 8, 6),
        (152, 25, 20, 5, 9),
        (153, 17, 19, 4, 9),
        (154, 23, 25, 8, 6),
        (155, 14, 28, 7, 6),
        (156, 21, 27, 6, 8),
        (157, 18, 30, 8, 6),
        (158, 26, 22, 6, 8),
        (159, 20, 16, 4, 9),
        (160, 24, 24, 8, 6),
    ]
    labels = [
        ("masal", "şiir"),
        ("hikâye", "şiir"),
        ("masal", "fıkra"),
        ("dergi", "hikâye"),
        ("masal", "şiir"),
        ("bilim", "masal"),
        ("şiir", "masal"),
        ("hikâye", "masal"),
        ("masal", "şiir"),
        ("fıkra", "masal"),
        ("şiir", "hikâye"),
        ("masal", "dergi"),
        ("hikâye", "fıkra"),
        ("masal", "şiir"),
        ("bilim", "masal"),
    ]
    for i, (n, a, b, shelves, ans) in enumerate(books):
        tot = a + b
        t1, t2 = labels[i]
        qid = f"mat3_bol_{n:03d}"
        items.append(
            q(
                n,
                "zor",
                f"Okul kütüphanesinde {a} {t1} kitabı ve {b} {t2} kitabı vardır. "
                f"Bu kitapları {shelves} rafa eşit sayıda dizmek istiyoruz.",
                "Her bir rafa kaç kitap düşer?",
                str(ans),
                str(ans + 1),
                str(ans - 1),
                f"Önce toplam kitap sayısını buluruz: {a} + {b} = {tot}. "
                f"Sonra raf sayısına böleriz: {tot} ÷ {shelves} = {ans} kitap.",
            )
        )
        two_step[qid] = [("add", a, b, tot), ("div", tot, shelves, ans)]

    farm = [
        (161, 32, 4, 8),
        (162, 40, 5, 10),
        (163, 24, 3, 6),
        (164, 44, 6, 10),
        (165, 36, 5, 8),
        (166, 52, 7, 12),
        (167, 30, 4, 7),
        (168, 48, 8, 8),
        (169, 26, 3, 7),
        (170, 38, 5, 9),
        (171, 28, 4, 6),
        (172, 34, 4, 9),
        (173, 42, 5, 11),
        (174, 50, 6, 13),
        (175, 36, 7, 4),
    ]
    for n, feet, cows, chicks in farm:
        cow_feet = cows * 4
        chick_feet = feet - cow_feet
        qid = f"mat3_bol_{n:03d}"
        items.append(
            q(
                n,
                "zor",
                f"Bir çiftlikte inekler ve tavuklar vardır. Toplam ayak sayısı {feet}'tir. "
                f"Çiftlikte {cows} inek olduğuna göre;",
                "Çiftlikte kaç tane tavuk vardır?",
                str(chicks),
                str(chicks + 1),
                str(chicks - 1),
                f"İneklerin ayak sayısı {cows} × 4 = {cow_feet}. "
                f"Tavuklara kalan ayak sayısı: {feet} - {cow_feet} = {chick_feet}. "
                f"Bir tavuğun 2 ayağı olduğu için: {chick_feet} ÷ 2 = {chicks} tavuk.",
            )
        )
        two_step[qid] = [
            ("mul", cows, 4, cow_feet),
            ("sub", feet, cow_feet, chick_feet),
            ("div", chick_feet, 2, chicks),
        ]

    extra = [
        (
            176,
            "zor",
            "Bir pakette 50 adet şeker vardı. Ayşe 20 tanesini yedi. Kalan şekerleri 5 arkadaşına eşit paylaştırdı.",
            "Her bir arkadaşına kaç şeker düşer?",
            "6",
            "7",
            "5",
            [("sub", 50, 20, 30), ("div", 30, 5, 6)],
        ),
        (
            177,
            "zor",
            "Mert'in 48 bilyesi vardı. 18 tanesini kaybetti. Kalan bilyeleri 6 kutuya eşit sayıda koydu.",
            "Her bir kutuda kaç bilye olur?",
            "5",
            "6",
            "4",
            [("sub", 48, 18, 30), ("div", 30, 6, 5)],
        ),
        (
            178,
            "zor",
            "Bahçeden 24 elma ve 18 armut toplandı. Bu meyveler 7 sepete eşit sayıda kondu.",
            "Her bir sepette kaç meyve olur?",
            "6",
            "7",
            "5",
            [("add", 24, 18, 42), ("div", 42, 7, 6)],
        ),
        (
            179,
            "zor",
            "Sınıfta 56 kalem vardı. 20 tanesi kullanıldı. Kalan kalemler 9 öğrenciye eşit paylaştırıldı.",
            "Her bir öğrenciye kaç kalem düşer?",
            "4",
            "5",
            "3",
            [("sub", 56, 20, 36), ("div", 36, 9, 4)],
        ),
        (
            180,
            "zor",
            "Küçük bir ahırda toplam 28 ayak vardır. Ahırda 3 inek bulunduğuna göre;",
            "Ahırda kaç tane tavuk vardır?",
            "8",
            "9",
            "7",
            [("mul", 3, 4, 12), ("sub", 28, 12, 16), ("div", 16, 2, 8)],
        ),
    ]
    for n, level, premise, text, cor, w1, w2, steps in extra:
        qid = f"mat3_bol_{n:03d}"
        expl_parts = []
        for op, a, b, res in steps:
            if op == "sub":
                expl_parts.append(f"{a} - {b} = {res}")
            elif op == "add":
                expl_parts.append(f"{a} + {b} = {res}")
            elif op == "mul":
                expl_parts.append(f"{a} × {b} = {res}")
            elif op == "div":
                expl_parts.append(f"{res if res else a} ÷ {b}")
        items.append(q(n, level, premise, text, cor, w1, w2, ". ".join(expl_parts) + "."))
        two_step[qid] = steps

    assert len(items) == 50, len(items)
    return items, two_step


def main() -> int:
    existing = json.loads(RAW.read_text(encoding="utf-8"))
    if len(existing) != 130:
        raise SystemExit(f"Beklenen 130 mevcut soru, bulunan {len(existing)}")

    new_items, two_step = build_coklu_50()
    merged = existing + new_items
    RAW.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")

    map_path = ROOT / "scripts" / "_bolme_coklu_two_step.json"
    map_path.write_text(json.dumps(two_step, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK: {len(new_items)} yeni soru eklendi → toplam {len(merged)}")
    print(f"TWO_STEP haritası: {map_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

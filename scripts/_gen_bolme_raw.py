#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""130 bölme sorusunu bolme-gemini-raw.json olarak üretir."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "bolme-gemini-raw.json"


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


def build_all() -> list[dict]:
    items: list[dict] = []

    items += [
        q(1, "kolay", None, "Bölme işleminde paylaştırılan, eşit parçalara ayrılan bütüne ne denir?", "Bölünen", "Bölen", "Bölüm", "Bölme işleminde paylaştırılacak asıl sayıya bölünen denir."),
        q(2, "kolay", None, "Bölme işleminin sonucuna ne ad verilir?", "Bölüm", "Kalan", "Bölen", "İşlem sonucunda her bir gruba düşen miktar bölümdür, yani sonuçtur."),
        q(3, "kolay", None, "Bir bölme işleminde paylaştırılamayan, geriye artan sayıya ne denir?", "Kalan", "Bölüm", "Fark", "Eşit olarak dağıtıldıktan sonra geriye artan sayıya kalan denir."),
        q(4, "kolay", None, "Ardışık çıkarma işleminin kısa yolu olan işlem hangisidir?", "Bölme", "Çarpma", "Toplama", "Bölme işlemi, aynı sayıyı sürekli çıkarmanın kısa yoldan yapılışıdır."),
        q(5, "kolay", None, "Sıfır hariç bir sayının kendisine bölümünün sonucu kaçtır?", "1", "0", "Sayının kendisi", "Bir sayıyı kendisine bölersek her gruba 1 düşer (Örn: 5 ÷ 5 = 1)."),
        q(6, "kolay", None, "Bir sayının 1'e bölümünün sonucu nedir?", "Sayının kendisi", "1", "0", "Bir sayıyı 1'e bölmek, onu tek bir gruba vermek demektir, sonuç değişmez."),
        q(7, "kolay", None, "Sıfırın, sıfırdan farklı bir doğal sayıya bölümü kaçtır?", "0", "1", "Sayının kendisi", "Sıfır tane nesne paylaştırılamayacağı için sonuç her zaman sıfırdır."),
        q(8, "kolay", None, "Aşağıdaki sembollerden hangisi bölme işlemi için kullanılmaz?", "+", "÷", "/", "Toplama işlemi + ile gösterilirken, bölme için ÷ veya / kullanılır."),
        q(9, "kolay", None, "Bir bölme işleminde kalan sayı ile bölen sayı arasındaki altın kural nedir?", "Kalan, bölenden küçük olmalıdır", "Kalan, bölenden büyük olmalıdır", "Kalan, bölene eşit olmalıdır", "Bölme işleminin bitmesi için kalanın bölenden her zaman küçük olması gerekir."),
        q(10, "kolay", None, "Kalansız bir bölme işleminde bölünen sayıyı bulmak için hangi işlem yapılır?", "Bölen ile bölüm çarpılır", "Bölen ile kalan toplanır", "Bölüm ile bölen toplanır", "Bölünen = Bölen x Bölüm formülüyle bulunur."),
    ]

    zihinden = [
        (11, 30, "3", "4", "2"), (12, 20, "2", "3", "1"), (13, 60, "6", "7", "5"),
        (14, 70, "7", "8", "6"), (15, 50, "5", "6", "4"), (16, 80, "8", "9", "7"),
        (17, 90, "9", "10", "8"), (18, 40, "4", "5", "3"), (19, 30, "3", "4", "2"),
        (20, 80, "8", "9", "7"),
    ]
    for n, num, cor, w1, w2 in zihinden:
        items.append(q(
            n, "kolay", None,
            f"{num} sayısını zihinden kısa yoldan 10'a bölersek sonuç kaç olur?",
            cor, w1, w2,
            f"Bir sayıyı zihinden 10'a bölerken sayının sonundaki bir tane sıfırı sileriz. {num} ÷ 10 = {cor}.",
        ))

    ardisik = [
        (21, "15 - 5 = 10\n10 - 5 = 5\n5 - 5 = 0", "15 ÷ 5 = 3", "15 ÷ 3 = 5", "10 ÷ 5 = 2", "15'in içinden 5 sayısı 3 defa ardışık olarak çıkarılmıştır."),
        (22, "24 - 8 = 16\n16 - 8 = 8\n8 - 8 = 0", "24 ÷ 8 = 3", "24 ÷ 3 = 8", "16 ÷ 8 = 2", "24'ün içinden 8 sayısı 3 defa ardışık olarak çıkarılmıştır."),
        (23, "12 - 4 = 8\n8 - 4 = 4\n4 - 4 = 0", "12 ÷ 4 = 3", "12 ÷ 3 = 4", "8 ÷ 4 = 2", "12'nin içinden 4 sayısı 3 defa ardışık olarak çıkarılmıştır."),
        (24, "20 - 5 = 15\n15 - 5 = 10\n10 - 5 = 5\n5 - 5 = 0", "20 ÷ 5 = 4", "20 ÷ 4 = 5", "15 ÷ 5 = 3", "20'nin içinden 5 sayısı 4 defa ardışık olarak çıkarılmıştır."),
        (25, "18 - 6 = 12\n12 - 6 = 6\n6 - 6 = 0", "18 ÷ 6 = 3", "18 ÷ 3 = 6", "12 ÷ 6 = 2", "18'in içinden 6 sayısı 3 defa ardışık olarak çıkarılmıştır."),
    ]
    for n, chain, cor, w1, w2, expl in ardisik:
        items.append(q(
            n, "kolay", "Ardışık çıkarma işlemi bölmenin temelidir.",
            f"Yukarıda verilen ardışık çıkarma işleminin bölme olarak gösterimi hangisidir?\n{chain}",
            cor, w1, w2, expl,
        ))

    primary = [
        (26, "14 ÷ 2", "7", "8", "6"), (27, "54 ÷ 9", "6", "7", "5"), (28, "24 ÷ 3", "8", "9", "7"),
        (29, "45 ÷ 5", "9", "10", "8"), (30, "32 ÷ 8", "4", "5", "3"), (31, "49 ÷ 7", "7", "8", "6"),
        (32, "18 ÷ 3", "6", "7", "5"), (33, "20 ÷ 4", "5", "6", "4"), (34, "12 ÷ 6", "2", "3", "4"),
        (35, "16 ÷ 8", "2", "3", "4"), (36, "81 ÷ 9", "9", "10", "8"), (37, "21 ÷ 7", "3", "4", "2"),
        (38, "36 ÷ 6", "6", "7", "5"), (39, "15 ÷ 5", "3", "4", "2"), (40, "12 ÷ 3", "4", "5", "3"),
    ]
    expl_map = {
        26: "Çarpım tablosundan 2 x 7 = 14 olduğunu hatırlarız.",
        27: "Çarpım tablosundan 9 x 6 = 54 olduğunu hatırlarız.",
        28: "Çarpım tablosundan 3 x 8 = 24 olduğunu hatırlarız.",
        29: "Çarpım tablosundan 5 x 9 = 45 olduğunu hatırlarız.",
        30: "Çarpım tablosundan 8 x 4 = 32 olduğunu hatırlarız.",
        31: "Çarpım tablosundan 7 x 7 = 49 olduğunu hatırlarız.",
        32: "Çarpım tablosundan 3 x 6 = 18 olduğunu hatırlarız.",
        33: "Çarpım tablosundan 4 x 5 = 20 olduğunu hatırlarız.",
        34: "Çarpım tablosundan 6 x 2 = 12 olduğunu hatırlarız.",
        35: "Çarpım tablosundan 8 x 2 = 16 olduğunu hatırlarız.",
        36: "Çarpım tablosundan 9 x 9 = 81 olduğunu hatırlarız.",
        37: "Çarpım tablosundan 7 x 3 = 21 olduğunu hatırlarız.",
        38: "Çarpım tablosundan 6 x 6 = 36 olduğunu hatırlarız.",
        39: "Çarpım tablosundan 5 x 3 = 15 olduğunu hatırlarız.",
        40: "Çarpım tablosundan 3 x 4 = 12 olduğunu hatırlarız.",
    }
    for n, expr, cor, w1, w2 in primary:
        items.append(q(n, "kolay", None, f"{expr} işleminin sonucu kaçtır?", cor, w1, w2, expl_map[n]))

    half = [(41, 46, "23", "25", "22"), (42, 56, "28", "30", "27"), (43, 24, "12", "14", "11"),
            (44, 32, "16", "18", "15"), (45, 60, "30", "32", "29"), (46, 28, "14", "16", "13"), (47, 36, "18", "20", "17")]
    for n, num, cor, w1, w2 in half:
        items.append(q(n, "kolay", "Bir bütünün yarısını bulmak için sayıyı 2'ye böleriz.", f"{num} sayısının yarısı kaçtır?", cor, w1, w2, f"Yarım kavramı bütünü iki eşit parçaya ayırmaktır. {num} ÷ 2 = {cor}."))

    quarter = [(48, 28, "7", "8", "5"), (49, 56, "14", "15", "12"), (50, 72, "18", "19", "16"),
               (51, 36, "9", "10", "7"), (52, 24, "6", "7", "4"), (53, 76, "19", "20", "17"), (54, 80, "20", "21", "18"), (55, 40, "10", "11", "8")]
    for n, num, cor, w1, w2 in quarter:
        items.append(q(n, "orta", "Bir bütünün çeyreğini bulmak için sayıyı 4'e böleriz.", f"{num} sayısının çeyreği kaçtır?", cor, w1, w2, f"Çeyrek kavramı bütünü dört eşit parçaya ayırmaktır. {num} ÷ 4 = {cor}."))

    share = [
        (56, "Kerem", 21, 3, "7", "8", "6"), (57, "Mert", 30, 5, "6", "7", "5"), (58, "Kerem", 56, 7, "8", "9", "7"),
        (59, "Ali", 48, 6, "8", "9", "7"), (60, "Ali", 36, 6, "6", "7", "5"), (61, "Ali", 40, 5, "8", "9", "7"),
        (62, "Selin", 64, 8, "8", "9", "7"), (63, "Zeynep", 42, 7, "6", "7", "5"), (64, "Burak", 21, 3, "7", "8", "6"),
        (65, "Mert", 32, 8, "4", "5", "3"), (66, "Kerem", 15, 3, "5", "6", "4"), (67, "Zeynep", 35, 7, "5", "6", "4"),
        (68, "Defne", 12, 3, "4", "5", "3"), (69, "Mert", 28, 7, "4", "5", "3"), (70, "Kerem", 35, 7, "5", "6", "4"),
    ]
    objs = ["elma", "bilye", "ceviz", "elma", "şeker", "kalem", "çikolata", "bilye", "ceviz", "silgi", "elma", "silgi", "ceviz", "çikolata", "şeker"]
    for i, (n, name, total, friends, cor, w1, w2) in enumerate(share):
        obj = objs[i]
        items.append(q(
            n, "kolay",
            f"{name}, elindeki {total} {obj}yi {friends} arkadaşına eşit olarak paylaştırmak istiyor.",
            f"Her bir arkadaşına kaç {obj} düşer?",
            cor, w1, w2,
            f"Eşit paylaştırma problemlerinde bölme işlemi yaparız. {total} ÷ {friends} = {cor}.",
        ))

    max_rem = [(71, 12, "11"), (72, 11, "10"), (73, 8, "7"), (74, 7, "6"), (75, 12, "11"), (76, 11, "10"), (77, 12, "11")]
    for n, div, cor in max_rem:
        items.append(q(
            n, "orta", f"Bir bölme işleminde bölen sayı {div}'dir.",
            "Bu işlemde kalanın alabileceği EN BÜYÜK değer kaçtır?",
            cor, str(div), str(int(cor) - 1 if int(cor) > 0 else 0),
            f"Kalan sayı, bölen sayıdan her zaman küçük olmak zorundadır. Bölen {div} olduğu için kalan en fazla {cor} olabilir.",
        ))

    rem_find = [(78, 60, 8, "4", "5", "0"), (79, 66, 7, "3", "4", "0"), (80, 41, 6, "5", "6", "0"),
                (81, 30, 4, "2", "3", "0"), (82, 96, 9, "6", "7", "0"), (83, 26, 6, "2", "3", "0"),
                (84, 59, 7, "3", "4", "0"), (85, 39, 4, "3", "4", "0")]
    for n, a, b, cor, w1, w2 in rem_find:
        q_val, r = divmod(a, b)
        items.append(q(
            n, "orta", f"Bir bölme işleminde bölünen {a}, bölen {b}'tür.",
            "Bu bölme işleminde kalan sayı kaçtır?",
            cor, w1, w2,
            f"{a} içinde {b}, {q_val} kere vardır ({b} x {q_val} = {b*q_val}). Geriye {a} - {b*q_val} = {cor} kalır.",
        ))

    find_div = [(86, 7, 8, 1, 57), (87, 5, 7, 1, 36), (88, 4, 9, 1, 37), (89, 8, 10, 3, 83),
                (90, 7, 8, 6, 62), (91, 7, 11, 1, 78), (92, 6, 8, 3, 51), (93, 6, 8, 3, 51),
                (94, 5, 10, 2, 52), (95, 6, 8, 5, 53)]
    find_wrong = {
        86: ("56", "64"), 87: ("35", "41"), 88: ("36", "41"), 89: ("80", "91"),
        90: ("56", "69"), 91: ("77", "85"), 92: ("48", "57"), 93: ("48", "57"),
        94: ("50", "57"), 95: ("48", "59"),
    }
    for n, b, quot, r, dividend in find_div:
        w1, w2 = find_wrong[n]
        items.append(q(
            n, "orta", f"Bir bölme işleminde bölen {b}, bölüm {quot} ve kalan {r}'dir.",
            "Buna göre bölünen sayı kaçtır?",
            str(dividend), w1, w2,
            f"Bölüneni bulmak için (Bölen x Bölüm) + Kalan formülü kullanılır. ({b} x {quot}) + {r} = {b*quot} + {r} = {dividend}.",
        ))

    max_div = [(96, 7, 10, "76", "70", "77"), (97, 9, 8, "80", "72", "81"), (98, 8, 8, "71", "64", "72"),
               (99, 9, 8, "80", "72", "81"), (100, 5, 10, "54", "50", "55")]
    for n, b, quot, cor, w1, w2 in max_div:
        items.append(q(
            n, "zor", f"Bir bölme işleminde bölen {b} ve bölüm {quot}'dir.",
            "Buna göre bölünen sayının alabileceği EN BÜYÜK değer kaçtır?",
            cor, w1, w2,
            f"Bölünenin en büyük olması için kalanın alabileceği en büyük değeri alması gerekir. Bölen {b} olduğundan kalan en fazla {b-1} olur. ({b} x {quot}) + {b-1} = {cor}.",
        ))

    missing = [(101, 72, 9, "8"), (102, 48, 6, "8"), (103, 66, 6, "11"), (104, 72, 8, "9"),
               (105, 48, 6, "8"), (106, 81, 9, "9"), (107, 36, 6, "6"), (108, 55, 5, "11"),
               (109, 25, 5, "5"), (110, 63, 9, "7")]
    for n, prod, fac, ans in missing:
        items.append(q(
            n, "orta", f"Hangi sayının {fac} katı {prod} eder?",
            "Bu problemi çözmek için hangi işlemi yapmalıyız ve cevap kaçtır?",
            f"Bölme, {ans}", f"Çarpma, {prod*fac}", f"Toplama, {prod+fac}",
            f"Çarpma işleminde verilmeyen çarpanı bulmak için çarpımı, verilen çarpana böleriz. {prod} ÷ {fac} = {ans}.",
        ))

    money = [
        (111, "Selin", 44, 12, 8, "4"), (112, "Ali", 59, 19, 8, "5"), (113, "Selin", 57, 15, 6, "7"),
        (114, "Mert", 53, 17, 6, "6"), (115, "Zeynep", 55, 15, 5, "8"), (116, "Ayşe", 71, 15, 7, "8"),
        (117, "Mert", 62, 14, 8, "6"),
    ]
    for n, name, total, toy, books, ans in money:
        rem = total - toy
        items.append(q(
            n, "zor",
            f"{name}'nin {total} lirası vardı. {toy} lirasına bir oyuncak aldı. Kalan parasıyla tanesi eşit fiyatta olan {books} adet defter aldı.",
            "Buna göre bir defterin fiyatı kaç liradır?",
            ans, str(int(ans)+1), str(int(ans)-1),
            f"Önce kalan parayı buluruz: {total} - {toy} = {rem} TL. Kalan parayı eşit şekilde paylaştırdığı için böleriz: {rem} ÷ {books} = {ans} TL.",
        ))

    books = [
        (118, 20, 25, 5, "9"), (119, 27, 27, 6, "9"), (120, 18, 24, 6, "7"),
        (121, 29, 27, 8, "7"), (122, 26, 16, 6, "7"), (123, 19, 17, 6, "6"), (124, 21, 28, 7, "7"),
    ]
    for n, m, s, raf, ans in books:
        tot = m + s
        items.append(q(
            n, "zor",
            f"Sınıfımızdaki kitaplıkta {m} masal kitabı, {s} şiir kitabı vardır. Bu kitapları {raf} rafa eşit sayıda dizmek istiyoruz.",
            "Her bir rafa kaç kitap düşer?",
            ans, str(int(ans)+2), str(int(ans)-1),
            f"Önce toplam kitap sayısını buluruz: {m} + {s} = {tot}. Sonra raf sayısına böleriz: {tot} ÷ {raf} = {ans} kitap.",
        ))

    farm = [
        (125, 28, 5, "4", "5", "2"), (126, 20, 4, "2", "3", "5"), (127, 34, 3, "11", "12", "9"),
        (128, 20, 3, "4", "5", "2"), (129, 36, 4, "10", "11", "8"), (130, 36, 2, "14", "15", "12"),
    ]
    for n, feet, cows, ans, w1, w2 in farm:
        cow_feet = cows * 4
        chick_feet = feet - cow_feet
        chicks = chick_feet // 2
        items.append(q(
            n, "zor",
            f"Bir çiftlikte inekler ve tavuklar vardır. Toplam ayak sayısı {feet}'dir. Çiftlikte {cows} inek olduğuna göre;",
            "Çiftlikte kaç tane tavuk vardır?",
            ans, w1, w2,
            f"İneklerin ayak sayısı {cows} x 4 = {cow_feet}. Tavuklara kalan ayak sayısı: {feet} - {cow_feet} = {chick_feet}. Bir tavuğun 2 ayağı olduğu için: {chick_feet} ÷ 2 = {chicks} tavuk.",
        ))

    assert len(items) == 130, f"Beklenen 130 soru, bulunan {len(items)}"
    return items


if __name__ == "__main__":
    questions = build_all()
    OUT.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK: {len(questions)} soru -> {OUT}")

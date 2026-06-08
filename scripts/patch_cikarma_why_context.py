#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cikarma (t05) aciklamalarina 'neden cikariyoruz' baglami ekler."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "uclu-basamakli-cikarma-s3-150.json"

OPERATION_STARTERS = (
    "Onluk bozmadan çıkarma",
    "Onluk bozarak çıkarma",
    "Onluk ve yüzlük bozarak çıkarma",
    "Eldeli toplama",
    "Eldesiz toplama",
    "İki adımlı problem",
    "Tahmini fark",
    "Gerçek fark",
    "Eksilen + çıkan",
    "Eksilen =",
    "700 tam",
    "Sadece yüzlük",
    "Onluklardan",
    "98 onluk",
    "6 yüzlük",
    "Bu soru çıkarma",
    "Çıkarma işleminde",
    "0 (sıfır)",
    "Eksilenin artması",
    "Eksilene eklemek",
    "Birler:",
    "Ters işlem",
)

WHY_BY_ID: dict[str, str] = {
    "mat3_cikarma_001": "Bu soru çıkarma ile ilgili bir kavram sorusudur; en büyük sayının **Eksilen** olduğunu öğreniriz.",
    "mat3_cikarma_002": "Bu soru çıkarma ile ilgili bir kavram sorusudur; işlemin sonucunun **Fark** (kalan) olduğunu öğreniriz.",
    "mat3_cikarma_003": "Bu soru çıkarma ile ilgili bir kavram sorusudur; **0** sayısının çıkarmada etkisiz eleman olduğunu anlarız.",
    "mat3_cikarma_004": "Bu soruda **485** ile **234** sayılarının farkını bularak işlemin sonucunu hesaplamamız isteniyor.",
    "mat3_cikarma_005": "Bu soruda **679** ile **452** sayılarının farkını bularak işlemin sonucunu hesaplamamız isteniyor.",
    "mat3_cikarma_006": "Bu soruda **956** ile **541** sayılarının farkını bularak işlemin sonucunu hesaplamamız isteniyor.",
    "mat3_cikarma_007": "Bu soruda **837** ile **316** sayılarının farkını bularak işlemin sonucunu hesaplamamız isteniyor.",
    "mat3_cikarma_008": "**568** sayısının **245 eksiği** demek, bu sayıdan 245 çıkarmamız gerektiği anlamına gelir.",
    "mat3_cikarma_009": "**700 − 300** işleminde sadece yüzlükleri zihinden çıkarırız; büyük tam yüzlükten küçük yüzlüğü eksiltiriz.",
    "mat3_cikarma_010": "**850 − 40** işleminde onluk basamağında zihinden çıkarma yaparız; yüzükler değişmeden kalır.",
    "mat3_cikarma_011": "Bu soruda **600** ile **200** sayılarının farkını bularak işlemin sonucunu hesaplamamız isteniyor.",
    "mat3_cikarma_012": "**980 − 50** işleminde onlukları zihinden çıkarırız; 98 onluktan 5 onluk eksilir.",
    "mat3_cikarma_013": "**470 − 60** işleminde onluk basamağında zihinden çıkarma yaparak sonucu buluruz.",
    "mat3_cikarma_014": "Okunmayan sayfa bulunur; toplam sayfadan okunan kısmı çıkarmak için **350 − 120** işlemini yaparız.",
    "mat3_cikarma_015": "Harcanan para eksilir; kalan parayı bulmak için **480 − 250** çıkarma işlemini yaparız.",
    "mat3_cikarma_016": "Satılmayan ekmek sayısı için pişirilen toplam ekmekten satılanları çıkarırız: **456 − 234**.",
    "mat3_cikarma_017": "Ağaçta kalan elma sayısı için düşen elmalar çıkarılır: **275 − 142**.",
    "mat3_cikarma_018": "Erkek öğrenci sayısı, toplam öğrenciden kız öğrenciler çıkarılarak bulunur: **895 − 452**.",
    "mat3_cikarma_019": "Kalan yol, toplam mesafeden yürünen kısım çıkarılarak bulunur: **650 − 320**.",
    "mat3_cikarma_020": "Satılmayan kalem sayısı için **785 − 350** çıkarma işlemini yaparız.",
    "mat3_cikarma_021": "Kaybedilen misketler çıkarılır; kalan misket sayısı için **58 − 23** işlemini yaparız.",
    "mat3_cikarma_022": "Fark bulunur; **Eksilen − Çıkan = Fark** kuralına göre **648 − 215** işlemini yaparız.",
    "mat3_cikarma_023": "Depoda kalan patates, toplam miktarından satılanlar çıkarılarak bulunur: **960 − 420**.",
    "mat3_cikarma_024": "Bu soruda **777** ile **222** sayılarının farkını bularak işlemin sonucunu hesaplamamız isteniyor.",
    "mat3_cikarma_025": "Yaş farkını bulmak için büyük yaştan küçük yaşı çıkarırız: **68 − 15**.",
    "mat3_cikarma_026": "Bu soruda **542** ile **128** sayılarının farkını bularak işlemin sonucunu hesaplamamız isteniyor.",
    "mat3_cikarma_027": "Bu soruda **715** ile **342** sayılarının farkını bularak işlemin sonucunu hesaplamamız isteniyor.",
    "mat3_cikarma_028": "Bu soruda **834** ile **567** sayılarının farkını bularak işlemin sonucunu hesaplamamız isteniyor.",
    "mat3_cikarma_029": "Bu soruda **623** ile **248** sayılarının farkını bularak işlemin sonucunu hesaplamamız isteniyor.",
    "mat3_cikarma_030": "Eksilen bilinmiyor; **? − 145 = 320** için fark ile çıkan toplanır: **320 + 145**.",
    "mat3_cikarma_031": "Çıkan bilinmiyor; **600 − ? = 240** için eksilenden fark çıkarılır: **600 − 240**.",
    "mat3_cikarma_032": "Eksilen = Çıkan + Fark kuralı uygulanır; **258 + 146** toplama işlemi yapılır.",
    "mat3_cikarma_033": "Çıkanı bulmak için eksilenden fark çıkarılır: **512 − 185**.",
    "mat3_cikarma_034": "Kalan para bulunur; **435 − 289** çıkarma işlemini yaparız.",
    "mat3_cikarma_035": "Hikâye kitabı sayısı, toplam kitaptan romanlar çıkarılarak bulunur: **812 − 456**.",
    "mat3_cikarma_036": "Önce okunan sayfalar toplanır, sonra toplam sayfadan çıkarılır; kalan okunmamış sayfa bulunur.",
    "mat3_cikarma_037": "Satılan gömlek sayısı, başlangıçtaki stoktan kalanlar çıkarılarak bulunur: **605 − 148**.",
    "mat3_cikarma_038": "Boy farkı bulunur; uzun olan ile kısa olanın boyları çıkarılır: **142 − 115**.",
    "mat3_cikarma_039": "Satılmayan bilet sayısı için **500 − 215** çıkarma işlemini yaparız.",
    "mat3_cikarma_040": "Önce **725** sayısı oluşturulur, ardından **348** çıkarılarak sonuç bulunur.",
    "mat3_cikarma_041": "Erkek üye sayısı, toplam üyeden kadın üyeler çıkarılarak bulunur: **412 − 186**.",
    "mat3_cikarma_042": "Eksilen aranır; **? − 185 = 340** için ters işlemle **340 + 185** toplanır.",
    "mat3_cikarma_043": "Ali'nin yaşı, Veli'nin yaşından **15** çıkarılarak bulunur: **42 − 15**.",
    "mat3_cikarma_044": "Sağlam elma sayısı, toplam elmadan çürükler çıkarılarak bulunur: **510 − 245**.",
    "mat3_cikarma_045": "Eksilen = Çıkan + Fark kuralı uygulanır; **198 + 235** toplama işlemi yapılır.",
    "mat3_cikarma_046": "A ile B'nin farkı istenir; **342 − 168** çıkarma işlemini yaparız.",
    "mat3_cikarma_047": "Kalan mesafe, toplam parkurdan koşulan kısım çıkarılarak bulunur: **650 − 275**.",
    "mat3_cikarma_048": "En büyük üç basamaklı sayıdan **450** çıkarılır: **987 − 450**.",
    "mat3_cikarma_049": "Çıkan aranır; **400 − 165** ile hangi sayının çıkarıldığı bulunur.",
    "mat3_cikarma_050": "Bu soruda **813** ile **465** sayılarının farkını bularak işlemin sonucunu hesaplamamız isteniyor.",
    "mat3_cikarma_051": "Bu soruda **700** ile **286** sayılarının farkını bularak işlemin sonucunu hesaplamamız isteniyor.",
    "mat3_cikarma_052": "Bu soruda **502** ile **167** sayılarının farkını bularak işlemin sonucunu hesaplamamız isteniyor.",
    "mat3_cikarma_053": "Tahmini ve gerçek fark karşılaştırılır; önce yuvarlanmış sayılarla **580 − 240**, sonra **584 − 239** işlemi yapılır.",
    "mat3_cikarma_054": "Tahmini fark bulunur; **814** ve **485** en yakın onluğa yuvarlanır, ardından **810 − 490** yapılır.",
    "mat3_cikarma_055": "Önce satılan şekerler toplanır, sonra depodaki toplam miktardan çıkarılır; kalan bulunur.",
    "mat3_cikarma_056": "Eksilen + çıkan + fark = 2 × eksilen kuralı kullanılır; eksilen **840 ÷ 2** ile bulunur.",
    "mat3_cikarma_057": "Önce aklımdaki sayı bulunur, ardından **120** çıkarılarak kalan hesaplanır.",
    "mat3_cikarma_058": "En büyük çift üç basamaklı ile en küçük tek üç basamaklı sayı çıkarılır: **986 − 103**.",
    "mat3_cikarma_059": "Bu soru çıkarma ile ilgili bir kavram sorusudur; eksilen artınca ve çıkan azalınca farkın nasıl değiştiğini düşünürüz.",
    "mat3_cikarma_060": "Önce gidilen km'ler toplanır, sonra hedef km'den çıkarılır; kalan yol bulunur.",
    "mat3_cikarma_061": "Önce A ve B ayrı ayrı bulunur, sonra **A − B** farkı hesaplanır.",
    "mat3_cikarma_062": "Önce erkek seyirci sayısı bulunur, yetişkinler toplanır, sonra toplam koltuktan çıkarılır; çocuk sayısı bulunur.",
    "mat3_cikarma_063": "En büyük ve en küçük sayı belirlenir, aralarındaki fark **840 − 408** ile bulunur.",
    "mat3_cikarma_064": "Önce aklındaki sayı bulunur, sonra **300** çıkarılarak kalan hesaplanır.",
    "mat3_cikarma_065": "Önce yıpranan kitaplar çıkarılır, sonra yeni kitaplar eklenir; son durum hesaplanır.",
    "mat3_cikarma_066": "Ters işlem yapılır; önce **500 − 140**, sonra **360 + 275** ile sayı bulunur.",
    "mat3_cikarma_067": "Önce harcanan para toplanır, sonra **850** TL'den çıkarılır; kalan para bulunur.",
    "mat3_cikarma_068": "Bu soru çıkarma ile ilgili bir kavram sorusudur; eksilene ekleme ve çıkandan çıkarmanın farkı nasıl etkilediğini düşünürüz.",
    "mat3_cikarma_069": "Basamak değerleri kullanılarak **6A4 − 27B = 381** işleminden A ve B bulunur.",
    "mat3_cikarma_070": "En küçük üç basamaklı ile en büyük iki basamaklı sayı belirlenir; **800 − 49** ile fark bulunur.",
    "mat3_cikarma_071": "Eksilen + çıkan + fark kuralı ile eksilen bulunur, ardından fark **300 − 125** ile hesaplanır.",
    "mat3_cikarma_072": "Önce okunan sayfalar toplanır, hedef sayfadan çıkarılır; 3. gün okunması gereken sayfa bulunur.",
    "mat3_cikarma_073": "Önce dikilen fidanlar toplanır, hedeften çıkarılır; kalan fidan sayısı bulunur.",
    "mat3_cikarma_074": "Kaç yıl önce sorusu, şimdiki yaştan o yaş çıkarılarak bulunur: **38 − 29**.",
    "mat3_cikarma_075": "Çıkan sayıdaki bilinmeyen rakam bulunur; **384 − 238 = 146** kontrolü yapılır.",
}


def operation_body(explanation: str) -> str:
    exp = (explanation or "").strip()
    multi = re.search(r"\*\*\d+ adımlı problem\*\*", exp)
    if multi:
        return exp[multi.start() :].strip()
    for starter in OPERATION_STARTERS:
        idx = exp.find(starter)
        if idx >= 0:
            return exp[idx:].strip()
    if "[[subsol:" in exp or "[[addsol:" in exp:
        idx = exp.find("[[")
        if idx >= 0:
            return exp[idx:].strip()
    return exp


def prepend_why(why: str, explanation: str) -> str:
    body = operation_body(explanation)
    if body == (explanation or "").strip() and why in (explanation or ""):
        return explanation
    return f"{why.strip()}\n\n{body}"


def patch_question(q: dict) -> tuple[dict, bool]:
    qid = q.get("id", "")
    why = WHY_BY_ID.get(qid)
    if not why:
        return q, False
    exp = q.get("explanation") or ""
    new_exp = prepend_why(why, exp)
    if new_exp == exp:
        return q, False
    q = dict(q)
    q["explanation"] = new_exp
    app = dict(q.get("app") or {})
    app["explanation"] = new_exp
    q["app"] = app
    return q, True


def main() -> int:
    if not DATA_PATH.is_file():
        raise SystemExit(f"Once patch_cikarma_gemini.py calistirin: {DATA_PATH}")
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    patched = 0
    for i, q in enumerate(data.get("questions") or []):
        new_q, changed = patch_question(q)
        data["questions"][i] = new_q
        if changed:
            patched += 1
    if patched != len(WHY_BY_ID):
        missing = [k for k in WHY_BY_ID if k not in {q["id"] for q in data["questions"]}]
        if missing:
            raise SystemExit(f"Why eksik sorular: {missing}")
    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Why baglami: {patched}/{len(WHY_BY_ID)} soru")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Toplama (t04) aciklamalarina 'neden topluyoruz' baglami ekler; dikey cozum ayni kalir."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "uclu-basamakli-toplama-s3-150.json"

OPERATION_STARTERS = (
    "Eldeli toplama",
    "Eldesiz toplama",
    "İki adımlı problem",
    "Verilmeyen toplananı",
    "300 tam yüzlük",
    "500 tam yüzlük",
    "600 tam yüzlük",
    "8 yüzlüğe",
    "Onluklar toplanır",
    "Toplama işleminde 0",
)

WHY_BY_ID: dict[str, str] = {
    "mat3_toplama_001": (
        "Bu soruda **243** ile **125** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_002": (
        "Bu soruda **402** ile **351** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_003": (
        "Bu soruda **114** ile **230** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_004": (
        "Bu soruda **521** ile **246** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_005": (
        "Ali'nin elindeki bilyeler ile arkadaşının verdiği bilyeler bir arada düşünülür; "
        "toplam bilye sayısını bulmak için **142 + 215** toplamasını yaparız."
    ),
    "mat3_toplama_006": (
        "Okunan sayfa ile kalan sayfa birlikte kitabın tamamını verir; "
        "kitabın toplam sayfa sayısını bulmak için **234 + 123** toplamasını yaparız."
    ),
    "mat3_toplama_007": (
        "Tavuk ve horoz sayıları birleştirilerek çiftlikteki toplam kümes hayvanı sayısı bulunur; "
        "**304 + 182** toplamasını yaparız."
    ),
    "mat3_toplama_008": (
        "Mont ve gömleğin fiyatları toplanarak kasaya ödenecek toplam tutar hesaplanır; "
        "**430 + 125** toplamasını yaparız."
    ),
    "mat3_toplama_009": (
        "**300 + 40** işlemini zihinden yapmak için tam yüzlüğe onluk ekleriz; "
        "böylece deftere yazmadan sonucu hızlıca buluruz."
    ),
    "mat3_toplama_010": (
        "**500 + 70** işleminde 500 tam yüzlüktür; üzerine 7 onluk (70) ekleyerek "
        "zihinden toplamayı yaparız."
    ),
    "mat3_toplama_011": (
        "**600 + 8** işleminde büyük sayıya küçük birlik sayısı eklenir; "
        "birler basamağı değişerek zihinden sonuç bulunur."
    ),
    "mat3_toplama_012": (
        "Sarı ve mavi boncuklar birlikte kullanıldığı için toplam boncuk sayısını bulmak amacıyla "
        "**120 + 230** toplamasını yaparız."
    ),
    "mat3_toplama_013": (
        "**800 + 100** işleminde yüzler basamağındaki rakamlar toplanır; "
        "kaç yüzlük oluştuğunu bulmak için bu toplamayı yaparız."
    ),
    "mat3_toplama_014": (
        "Bu soruda **253** ile **104** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_015": (
        "“250 fazlası” demek, o sayıya 250 eklemek demektir; "
        "**416 + 250** toplamasını yaparak sonucu buluruz."
    ),
    "mat3_toplama_016": (
        "İki ayda biriktirilen paralar birleşir; kumbaradaki toplam parayı bulmak için "
        "**210 + 115** toplamasını yaparız."
    ),
    "mat3_toplama_017": (
        "Bu soruda **345** ile **123** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_018": (
        "Bu soru toplama ile ilgili bir kavram sorusudur; **0** sayısının toplamı değiştirmediğini "
        "(etkisiz eleman) anlamak için düşünürüz."
    ),
    "mat3_toplama_019": (
        "Dikilen çam ve meşe fidanları birlikte değerlendirilir; bahçedeki toplam fidan sayısı için "
        "**112 + 205** toplamasını yaparız."
    ),
    "mat3_toplama_020": (
        "Bu soruda **734** ile **142** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_021": (
        "Fatih'in cevizleri ile abisinin verdiği cevizler bir arada sayılır; "
        "toplam ceviz sayısı için **140 + 200** toplamasını yaparız."
    ),
    "mat3_toplama_022": (
        "Bu soruda **400** ile **400** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_023": (
        "Bu soruda **362** ile **215** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_024": (
        "**250 + 120** işleminde onlukları zihinden toplarız; "
        "25 onluk ile 12 onluğu birleştirerek sonucu buluruz."
    ),
    "mat3_toplama_025": (
        "Trendeki erkek ve kadın yolcular birlikte sayılır; "
        "toplam yolcu sayısı için **214 + 132** toplamasını yaparız."
    ),
    "mat3_toplama_026": (
        "Bu soruda **348** ile **225** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_027": (
        "Bu soruda **456** ile **182** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_028": (
        "Bu soruda **275** ile **146** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_029": (
        "Sabah ve akşam satılan ekmekler bir arada düşünülür; "
        "gün boyunca satılan toplam ekmek sayısı için **286 + 355** toplamasını yaparız."
    ),
    "mat3_toplama_030": (
        "Hikâye ve şiir kitapları kütüphanedeki kitapların tamamını oluşturur; "
        "toplam kitap sayısı için **394 + 128** toplamasını yaparız."
    ),
    "mat3_toplama_031": (
        "Toplama işleminde noktalı yerdeki eksik toplananı bulmak gerekir; "
        "**245 + ? = 612** eşitliği için **245 + 367** toplama kontrolünü yaparız."
    ),
    "mat3_toplama_032": (
        "Verilmeyen toplananı bulmak için bilinen toplanan ile toplam bir arada düşünülür; "
        "**? + 189 = 504** için **189 + 315** kontrol toplamasını yaparız."
    ),
    "mat3_toplama_033": (
        "Toplam ödeme, ayakkabı ve çanta fiyatlarının toplamına eşittir; "
        "çanta fiyatını doğrulamak için **365 + 235 = 600** toplama kontrolünü yaparız."
    ),
    "mat3_toplama_034": (
        "Bu soruda **509** ile **294** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_035": (
        "Telefonun fiyatı, Ahmet'in parası ile ihtiyaç duyduğu parayı birleştirince oluşur; "
        "**350 + 485 = 835** toplamasını yaparız."
    ),
    "mat3_toplama_036": (
        "İki toplanan verildiğinde sonucu bulmak için doğrudan toplama yapılır; "
        "**278 + 345** toplamasını yaparız."
    ),
    "mat3_toplama_037": (
        "Bu soruda **672** ile **159** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_038": (
        "A ve B değerleri verildiğine göre toplamları istenir; "
        "**265 + 378** toplamasını yaparak **A + B** sonucunu buluruz."
    ),
    "mat3_toplama_039": (
        "Cumartesi ve pazar günü dikilen fidanlar birleştirilir; "
        "hafta sonu toplam fidan sayısı için **456 + 385** toplamasını yaparız."
    ),
    "mat3_toplama_040": (
        "Aklındaki sayıya **285** eklenince **600** oluyor; bulunan sayıyı doğrulamak için "
        "**285 + 315 = 600** toplama kontrolünü yaparız."
    ),
    "mat3_toplama_041": (
        "Basamak değerlerinden **384** sayısı oluşur; bu sayı ile **267** toplanarak sonuç bulunur."
    ),
    "mat3_toplama_042": (
        "Okunan sayfa ile kalan sayfa, kitabın tüm sayfa sayısını verir; "
        "okunan miktarı doğrulamak için **145 + 323 = 468** kontrol toplamasını yaparız."
    ),
    "mat3_toplama_043": (
        "Bu soruda **298** ile **434** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_044": (
        "“195 fazlası 482” ifadesi, bilinmeyen sayıya 195 eklenince 482 olur demektir; "
        "**195 + 287 = 482** kontrol toplamasını yaparız."
    ),
    "mat3_toplama_045": (
        "İki salondaki izleyiciler bir arada sayılır; "
        "toplam kişi sayısı için **189 + 245** toplamasını yaparız."
    ),
    "mat3_toplama_046": (
        "Bu soruda **377** ile **249** sayılarının toplamını bularak işlemin sonucunu hesaplamamız isteniyor."
    ),
    "mat3_toplama_047": (
        "İlkokul ve ortaokul öğrenci sayıları birleştirilir; "
        "okuldaki toplam öğrenci sayısı için **482 + 378** toplamasını yaparız."
    ),
    "mat3_toplama_048": (
        "**349 + ? = 716** işleminde eksik toplananı bulmak için "
        "**349 + 367 = 716** toplama kontrolünü yaparız."
    ),
    "mat3_toplama_049": (
        "Birler basamağı 8 olan en büyük iki basamaklı sayı **98**'dir; "
        "bu sayı ile **385** toplanarak sonuç bulunur."
    ),
    "mat3_toplama_050": (
        "Sabah ve öğleden sonra satılan elmalar birlikte 420 kg eder; "
        "öğleden sonraki miktarı doğrulamak için **185 + 235 = 420** kontrol toplamasını yaparız."
    ),
    "mat3_toplama_051": (
        "İki günde okunan sayfalar toplanarak toplam bulunur; ikinci günde **48** sayfa fazla okunduğu "
        "için bu farkı hesaba katarak toplamaya geçeriz."
    ),
    "mat3_toplama_052": (
        "Toplam kümes hayvanı sayısı için horoz sayısı tavuklardan **75** fazladır; "
        "tavuk sayısı ile bu farkı toplayarak toplamı buluruz."
    ),
    "mat3_toplama_053": (
        "Kumbaradaki üç destenin parası bir araya gelir; "
        "Okan'ın toplam parasını bulmak için **145 + 230 + 155** toplamasını yaparız."
    ),
    "mat3_toplama_054": (
        "Tahmin yaparken sayılar en yakın onluğa yuvarlanır; "
        "**350 + 210** yuvarlanmış toplama ile tahmini sonuç bulunur."
    ),
    "mat3_toplama_055": (
        "Tahmini ve gerçek toplam arasındaki fark bulunur; önce yuvarlanmış sayılar "
        "**490 + 300** ile toplanır, sonra gerçek sonuçla karşılaştırılır."
    ),
    "mat3_toplama_056": (
        "Müşteri hem pantolon hem ayakkabı aldığı için iki ürünün fiyatları toplanır; "
        "ayakkabı pantolondan **130 TL** pahalı olduğundan önce bu fark hesaplanır."
    ),
    "mat3_toplama_057": (
        "Üç sınıfın diktiği fidanlar birleştirilir; "
        "etkinlikteki toplam fidan sayısı için **148 + 165 + 203** toplamasını yaparız."
    ),
    "mat3_toplama_058": (
        "Babam ile dedemin yaşları bir arada düşünülür; dedem **28** yaş büyük olduğundan "
        "yaşları toplayarak toplam yaşı buluruz."
    ),
    "mat3_toplama_059": (
        "Otobüse binen yolcular bir önceki yolcu sayısına eklenir; "
        "son durumdaki toplam yolcu için **115 + 48 + 36** toplamasını yaparız."
    ),
    "mat3_toplama_060": (
        "Önce en büyük çift üç basamaklı (**986**) ve en büyük iki basamaklı (**98**) sayılar belirlenir; "
        "sonra toplamları bulunur."
    ),
    "mat3_toplama_061": (
        "Önce aklımdaki sayı bulunur, ardından istenen **250 fazlası** hesaplanır; "
        "bu adımlarda toplama kullanılır."
    ),
    "mat3_toplama_062": (
        "Tahmini toplam bulmak için **394** ve **208** en yakın onluğa yuvarlanır; "
        "**390 + 210** toplaması tahmini sonucu verir."
    ),
    "mat3_toplama_063": (
        "Hafta sonu lunaparka gelen kişiler cumartesi ve pazar günleri toplanır; "
        "pazar günü **126** kişi fazla geldiği için toplamayı kullanırız."
    ),
    "mat3_toplama_064": (
        "Önce A ve B ayrı ayrı bulunur, sonra istenen **A + B** değerini hesaplamak için "
        "elde edilen sayılar toplanır."
    ),
    "mat3_toplama_065": (
        "Üç günde satılan ekmekler birleştirilir; "
        "toplam satış için **235 + 315 + 380** toplamasını yaparız."
    ),
    "mat3_toplama_066": (
        "Önce Zeynep'in aklındaki sayı bulunur, sonra **180 fazlası** istenir; "
        "bu süreçte toplama yapılır."
    ),
    "mat3_toplama_067": (
        "Sarı gül sayısı, kırmızı güllere eklenen fazlalıklarla adım adım bulunur; "
        "her adımda toplama yaparak **184 + 36 + 25** ile sonuca ulaşırız."
    ),
    "mat3_toplama_068": (
        "Verilen rakamlarla en büyük (**741**) ve en küçük (**147**) üç basamaklı sayılar yazılır; "
        "toplamları istenir."
    ),
    "mat3_toplama_069": (
        "Önce hikâye kitabı sayısı bulunur, sonra masal ve hikâye kitapları toplanır; "
        "**345 + 128** ile toplam kitap sayısına ulaşırız."
    ),
    "mat3_toplama_070": (
        "Tahmin ile gerçek sonuç karşılaştırılır; yuvarlanmış **420 + 350** toplaması "
        "tahmini sonucu verir, fark bulunur."
    ),
    "mat3_toplama_071": (
        "Önce üç kardeşin toplam ağırlığı bulunur; babanın ağırlığı bu toplamdan **15 kg** eksik "
        "olduğu için kardeşlerin ağırlıkları toplanır."
    ),
    "mat3_toplama_072": (
        "Üç ayda bağışlanan kitaplar birleştirilir; "
        "toplam bağış için **218 + 198 + 236** toplamasını yaparız."
    ),
    "mat3_toplama_073": (
        "Önce Selim'in aklındaki sayı bulunur, sonra **275 fazlası** hesaplanır; "
        "bu adımlarda toplama kullanılır."
    ),
    "mat3_toplama_074": (
        "Yüzler basamağı 4 olan en büyük üç basamaklı (**499**) ile yüzler basamağı 2 olan "
        "en küçük (**200**) sayı belirlenir ve toplanır."
    ),
    "mat3_toplama_075": (
        "Üç günde çözülen sorular bir araya getirilir; "
        "toplam soru sayısı için **125 + 135 + 145** toplamasını yaparız."
    ),
}


def operation_body(explanation: str) -> str:
    exp = (explanation or "").strip()
    for starter in OPERATION_STARTERS:
        idx = exp.find(starter)
        if idx >= 0:
            return exp[idx:].strip()
    return exp


def already_has_why(explanation: str) -> bool:
    first = (explanation or "").split("\n", 1)[0].strip()
    if first.startswith(("Eldeli toplama", "Eldesiz toplama", "İki adımlı", "Verilmeyen")):
        return False
    if first.startswith(("300 tam", "500 tam", "600 tam", "8 yüzlüğe", "Onluklar", "Toplama işleminde 0")):
        return False
    return "toplam" in first.lower() or "toplama" in first.lower() or "toplan" in first.lower()


def prepend_why(why: str, explanation: str) -> str:
    body = operation_body(explanation)
    return f"{why.strip()}\n\n{body}"


def patch_question(q: dict) -> tuple[dict, bool]:
    qid = q.get("id", "")
    why = WHY_BY_ID.get(qid)
    if not why:
        return q, False

    exp = q.get("explanation") or ""
    if already_has_why(exp) and operation_body(exp) != exp:
        new_exp = prepend_why(why, exp)
    else:
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
        raise SystemExit(f"Dosya yok: {DATA_PATH}")

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    questions = data.get("questions") or []
    patched = 0
    missing = []

    for i, q in enumerate(questions):
        new_q, changed = patch_question(q)
        questions[i] = new_q
        if changed:
            patched += 1
        elif new_q.get("id") not in WHY_BY_ID:
            missing.append(new_q.get("id"))

    if missing:
        raise SystemExit(f"Why metni eksik sorular: {missing}")
    if patched != len(WHY_BY_ID):
        raise SystemExit(f"Beklenen {len(WHY_BY_ID)} guncelleme, yapilan {patched}")

    data["questions"] = questions
    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Guncellendi: {patched}/{len(questions)} soru (why baglami eklendi)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

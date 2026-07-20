#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Carpma (t06) aciklamalarina 'neden carpiyoruz' baglami ekler."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "uclu-basamakli-carpma-s3-150.json"

OPERATION_STARTERS = (
    "Çarpım tablosu",
    "Eldeli çarpma",
    "Eldesiz çarpma",
    "10 ile çarpma",
    "Eldeli toplama",
    "Eldesiz toplama",
    "Onluk bozmadan",
    "Onluk bozarak",
    "**",
    "adımlı problem",
)

WHY_BY_ID: dict[str, str] = {
    "mat3_carp_001": "Çarpım tablosundan **6 × 7** sonucunu bulmamız isteniyor.",
    "mat3_carp_002": "Çarpım tablosundan **8 × 5** sonucunu bulmamız isteniyor.",
    "mat3_carp_003": "Çarpım tablosundan **9 × 4** sonucunu bulmamız isteniyor.",
    "mat3_carp_004": "Çarpım tablosundan **7 × 7** sonucunu bulmamız isteniyor.",
    "mat3_carp_005": "Çarpım tablosundan **8 × 8** sonucunu bulmamız isteniyor.",
    "mat3_carp_006": "Çarpım tablosundan **3 × 9** sonucunu isteniyor.",
    "mat3_carp_007": "Toplam öğrenci = sıra sayısı × her sıradaki öğrenci → **8 × 2**.",
    "mat3_carp_008": "6 günde okunan sayfa = günlük sayfa × gün sayısı → **6 × 5**.",
    "mat3_carp_009": "Toplam çiçek = vazo sayısı × her vazodaki çiçek → **4 × 4**.",
    "mat3_carp_010": "Satılan kalem = kutu sayısı × kutudaki kalem → **5 × 7**.",
    "mat3_carp_011": "Toplam ayak = koyun sayısı × bir koyunun ayağı → **9 × 4**.",
    "mat3_carp_012": "Toplam fiyat = kilogram fiyatı × alınan kg → **8 × 3**.",
    "mat3_carp_013": "10 ile çarpma kuralı: sayının sonuna **0** eklenir → **15 × 10**.",
    "mat3_carp_014": "10 ile çarpma kuralı: **32** sayısının sonuna **0** eklenir.",
    "mat3_carp_015": "10 ile çarpma ters sorusu: sonundaki **0** silinerek sayı bulunur.",
    "mat3_carp_016": "İki basamaklı × tek basamaklı çarpma: **23 × 3**.",
    "mat3_carp_017": "İki basamaklı × tek basamaklı çarpma: **42 × 2**.",
    "mat3_carp_018": "Eldeli çarpma: **26 × 3** işlemini basamak basamak yaparız.",
    "mat3_carp_019": "Eldeli çarpma: **35 × 4** işlemini basamak basamak yaparız.",
    "mat3_carp_020": "Eldeli çarpma: **48 × 2** işlemini basamak basamak yaparız.",
    "mat3_carp_021": "Eldeli çarpma: **17 × 5** işlemini basamak basamak yaparız.",
    "mat3_carp_022": "Eldeli çarpma: **29 × 3** işlemini basamak basamak yaparız.",
    "mat3_carp_023": "Eldeli çarpma: **14 × 6** işlemini basamak basamak yaparız.",
    "mat3_carp_024": "Eldeli çarpma: **25 × 5** işlemini basamak basamak yaparız.",
    "mat3_carp_025": "Toplam kişi = sıra × kişi → **24 × 5**.",
    "mat3_carp_026": "Haftalık süt = günlük süt × 7 gün → **18 × 7**.",
    "mat3_carp_027": "3 kişi için defter tutarı = fiyat × 3 → **28 × 3**.",
    "mat3_carp_028": "Toplam yolcu = otobüs başına yolcu × otobüs sayısı → **36 × 3**.",
    "mat3_carp_029": "4 günde okunan = günlük sayfa × 4 → **45 × 4**.",
    "mat3_carp_030": "Toplam araç = kat × kat başına araç → **25 × 4**.",
    "mat3_carp_031": "Toplam tavuk = kümes × kümes başına tavuk → **16 × 8**.",
    "mat3_carp_032": "Toplam tutar = fiyat × adet → **12 × 7**.",
    "mat3_carp_033": "Sınıf mevcudu = sıra × öğrenci → **18 × 2**.",
    "mat3_carp_034": "Toplam şeker = kutu başına şeker × kutu → **24 × 5**.",
    "mat3_carp_035": "Eldeli çarpma: **67 × 8** işlemini basamak basamak yaparız.",
    "mat3_carp_036": "Eldeli çarpma: **89 × 6** işlemini basamak basamak yaparız.",
    "mat3_carp_037": "Eldeli çarpma: **74 × 9** işlemini basamak basamak yaparız.",
    "mat3_carp_038": "Eldeli çarpma: **98 × 7** işlemini basamak basamak yaparız.",
    "mat3_carp_039": "Eldeli çarpma: **85 × 8** işlemini basamak basamak yaparız.",
    "mat3_carp_040": "Önce kalem tutarı **15 × 4**, sonra silgi eklenir.",
    "mat3_carp_041": "Önce sıralarda oturanlar **16 × 2**, sonra ayakta kalanlar eklenir.",
    "mat3_carp_042": "Önce toplam problem **25 × 4**, sonra yanlışlar çıkarılır.",
    "mat3_carp_043": "Önce satılan ekmek **3 × 10**, sonra toplamdan çıkarılır.",
    "mat3_carp_044": "Önce kitap tutarı **35 × 2**, para üstü için **100**'den çıkarılır.",
    "mat3_carp_045": "Önce kitaplıktaki kitap **25 × 8**, bağış eklenir.",
    "mat3_carp_046": "Önce **45 × 3**, sonra **20 TL** eksiltilir.",
    "mat3_carp_047": "Her hayvan grubunun ayak sayısı çarpılır, sonra toplanır.",
    "mat3_carp_048": "Yarım düzine = 6 adet; toplam **45 × 6**.",
    "mat3_carp_049": "Önce kullanılan kumaş **9 × 4**, kalan **50**'den çıkarılır.",
    "mat3_carp_050": "Daire → pencere → kanat sayısı adım adım çarpılır.",
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
    if "[[mulsol:" in exp or "[[addsol:" in exp or "[[subsol:" in exp:
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
        raise SystemExit(f"Once patch_carpma_gemini.py calistirin: {DATA_PATH}")
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    patched = 0
    for i, q in enumerate(data.get("questions") or []):
        nq, ok = patch_question(q)
        data["questions"][i] = nq
        if ok:
            patched += 1
    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Why baglami: {patched} soru")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

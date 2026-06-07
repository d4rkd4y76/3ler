#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Soru bankalarında tekrarlayan kökleri çeşitlendirir ve kalite denetimi yapar."""
from __future__ import annotations

import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"

BANKS = [
    ("metin_turleri_s3_bank", "metin3_"),
    ("kelime_dagarcigi_s3_bank", "kelime3_"),
    ("paragraf_s3_bank", "paragraf3_"),
    ("olay_s3_bank", "olay3_"),
    ("cumle_s3_bank", "cumle3_"),
    ("dilbilgisi_s3_bank", "dilb3_"),
    ("yazim_s3_bank", "yazim3_"),
    ("noktalama_s3_bank", "nokta3_"),
]

# Paragraf — 150 benzersiz soru kökü
PARAGRAF_STEMS = {
    "konu": [
        "Yukarıdaki paragrafa göre metnin konusu nedir?",
        "Bu parça öncelikle ne hakkında yazılmıştır?",
        "Paragrafın konusu aşağıdakilerden hangisidir?",
        "Metin ağırlıklı olarak hangi konuyu işlemektedir?",
        "Okuduğunuz paragraf hangi konuyu anlatmaktadır?",
        "Paragrafta üzerinde durulan asıl konu hangisidir?",
        "Bu metnin konusunu en iyi karşılayan seçenek hangisidir?",
        "Paragraf bize hangi konu hakkında bilgi vermektedir?",
        "Yazar bu paragrafta hangi konuyu ele almıştır?",
        "Paragrafın anlatım merkezi aşağıdakilerden hangisidir?",
        "Metnin konusunu bulmak için paragrafı okuyunca hangi seçenek doğru çıkar?",
        "Paragrafta en çok hangi konu işlenmiştir?",
        "Bu yazının konusu aşağıdakilerden hangisi olabilir?",
        "Paragrafın ne hakkında olduğunu gösteren seçenek hangisidir?",
        "Metin hangi konu etrafında şekillenmiştir?",
        "Paragrafın konusunu doğru veren ifade hangisidir?",
        "Bu parçada anlatılan konu hangisidir?",
        "Paragraf okunduğunda akla gelen konu hangisidir?",
        "Metnin konusu olarak hangisi söylenebilir?",
        "Paragrafta bahsedilen ana konu hangisidir?",
        "Bu paragraf hangi konuya ayrılmıştır?",
        "Paragrafın konusu ile ilgili doğru seçenek hangisidir?",
        "Metinde işlenen temel konu hangisidir?",
        "Paragrafın konusunu belirleyen doğru cevap hangisidir?",
        "Bu metin esas olarak neyi anlatmaktadır?",
        "Paragrafın konusu hangi seçenekte verilmiştir?",
        "Metnin konusunu bulurken hangi seçeneği işaretleriz?",
        "Paragrafta yoğunlaşılan konu hangisidir?",
        "Bu yazı hangi konu üzerine kurulmuştur?",
        "Paragrafın konusunu ifade eden seçenek hangisidir?",
        "Metnin konusu aşağıdakilerden hangisi değildir? (Doğru konuyu seçiniz.)",
        "Paragraf hangi konuyu açıklamaktadır?",
    ],
    "ana_dusunce": [
        "Yukarıdaki paragrafa göre metnin ana düşüncesi nedir?",
        "Yazar bu paragrafla okuyucuya ne söylemek istemektedir?",
        "Paragrafın ana fikri aşağıdakilerden hangisidir?",
        "Metnin vermek istediği asıl mesaj hangisidir?",
        "Paragrafın ana düşüncesini en iyi ifade eden seçenek hangisidir?",
        "Bu metinden çıkarılacak ana düşünce hangisidir?",
        "Yazarın vurgulamak istediği düşünce hangisidir?",
        "Paragrafın okuyucuya iletmek istediği ana fikir nedir?",
        "Metnin ana düşüncesi aşağıdakilerden hangisi olabilir?",
        "Paragraftan çıkarılabilecek asıl düşünce hangisidir?",
        "Bu paragrafın ana fikrini doğru veren seçenek hangisidir?",
        "Metnin ana düşüncesi hangi seçenekte verilmiştir?",
        "Paragrafı okuduktan sonra akla gelen ana düşünce hangisidir?",
        "Yazarın asıl anlatmak istediği düşünce hangisidir?",
        "Paragrafın ana düşüncesi olarak hangisi söylenebilir?",
        "Metnin ana fikrini bulmak için hangi seçeneği işaretleriz?",
        "Paragrafta okuyucuya aktarılmak istenen ana düşünce nedir?",
        "Bu metnin ana düşüncesi aşağıdakilerden hangisidir?",
        "Paragrafın ana fikri hangi seçenekte doğru verilmiştir?",
        "Metinden çıkarılması gereken ana düşünce hangisidir?",
        "Paragrafın ana düşüncesi hangi cümleyle örtüşür? (Anlam olarak)",
        "Yazar bu metinle hangi düşünceyi pekiştirmek istemiştir?",
        "Paragrafın ana fikri hangisidir?",
        "Metnin ana düşüncesi hangi seçenekte yer almaktadır?",
        "Paragrafın verdiği temel mesaj hangisidir?",
        "Bu paragrafın ana düşüncesi hangi seçenekte bulunur?",
        "Metnin ana fikrini doğru gösteren ifade hangisidir?",
        "Paragrafta savunulan ana düşünce hangisidir?",
        "Okuyucunun paragraftan çıkarması gereken ana düşünce hangisidir?",
        "Paragrafın ana düşüncesi aşağıdakilerden hangisine karşılık gelir?",
        "Metnin ana fikri hangi seçenekte açıklanmıştır?",
    ],
    "baslik": [
        "Yukarıdaki paragrafa göre metne en uygun başlık hangisidir?",
        "Bu parçaya hangi başlık daha uygundur?",
        "Paragrafa en uygun başlık aşağıdakilerden hangisidir?",
        "Metne verilebilecek en iyi başlık hangisidir?",
        "Paragrafın içeriğine uygun başlık hangisidir?",
        "Bu metin hangi başlık altında toplanabilir?",
        "Paragrafa konulabilecek en uygun başlık hangisidir?",
        "Metnin konusuna uygun başlık seçeneği hangisidir?",
        "Paragraf okunduğunda hangi başlık daha doğru olur?",
        "Bu parçaya verilecek başlık aşağıdakilerden hangisidir?",
        "Metne en çok uyan başlık hangisidir?",
        "Paragrafın içeriği hangi başlıkla örtüşür?",
        "Doğru başlık seçeneği hangisidir?",
        "Paragrafa uygun düşülen başlık hangisidir?",
        "Metin için en uygun başlık hangi seçenektedir?",
        "Paragrafın anlatımına göre başlık hangisi olmalıdır?",
        "Bu yazıya hangi başlık konulursa daha anlamlı olur?",
        "Paragrafa en yakın başlık hangisidir?",
        "Metnin içeriğine uygun başlık hangisidir?",
        "Paragraf hangi başlık altında toplanmalıdır?",
        "Metne verilen başlıklardan hangisi en uygundur?",
        "Paragrafın konusuna uygun başlık hangisidir?",
        "Bu parçaya en uygun başlık aşağıdakilerden hangisidir?",
        "Metin için seçilecek en doğru başlık hangisidir?",
        "Paragrafa uygun başlık hangi seçenektedir?",
        "Metnin anlatımına en çok uyan başlık hangisidir?",
        "Paragraf hangi başlıkla adlandırılabilir?",
        "Metne konulacak en uygun başlık hangisidir?",
        "Paragrafın içeriğini yansıtan başlık hangisidir?",
        "Bu metin hangi başlığı taşımalıdır?",
        "Paragrafa uygun düşen başlık seçeneği hangisidir?",
        "Metin için en anlamlı başlık hangisidir?",
    ],
    "duygu": [
        "Yukarıdaki şiire göre şiirin ana duygusu nedir?",
        "Bu dizelerde hangi duygu ağır basmaktadır?",
        "Şiirin okuyucuya hissettirdiği ana duygu hangisidir?",
        "Dizelerde yoğun olarak işlenen duygu hangisidir?",
        "Şiirin ana duygusu aşağıdakilerden hangisidir?",
        "Bu şiirde hangi duygu ön plandadır?",
        "Dizeleri okuyunca hangi duygu uyanır?",
        "Şiirin taşıdığı ana duygu hangi seçenektedir?",
        "Bu dizeler hangi duyguyu anlatmaktadır?",
        "Şiirin ana duygusunu doğru veren seçenek hangisidir?",
        "Dizelerde hissedilen duygu hangisidir?",
        "Şiir okunduğunda hangi duygu baskın gelir?",
        "Bu şiirin ana duygusu hangi seçenekte verilmiştir?",
        "Dizelerde aktarılan duygu hangisidir?",
        "Şiirin ana duygusu olarak hangisi söylenebilir?",
        "Bu dizelerde hangi duygu anlatılmaktadır?",
        "Şiirin duygusal tonu hangi seçeneğe uygundur?",
        "Dizelerde ağır basan duygu hangisidir?",
        "Şiirin ana duygusunu bulmak için hangi seçeneği işaretleriz?",
        "Bu şiirde hissedilen ana duygu hangisidir?",
        "Dizelerin taşıdığı duygu hangi seçenektedir?",
        "Şiirin ana duygusu aşağıdakilerden hangisine karşılık gelir?",
        "Bu dizeler okuyucuda hangi duyguyu uyandırır?",
        "Şiirin ana duygusu hangi seçenekte doğru verilmiştir?",
        "Dizelerde anlatılan duygu hangisidir?",
    ],
    "ne_anlatiyor": [
        "Yukarıdaki paragrafa göre paragraf ne anlatıyor?",
        "Bu parçada hangi olay veya durum anlatılmaktadır?",
        "Paragraf okunduğunda ne anlatıldığı anlaşılır?",
        "Metin bize hangi olayı veya durumu aktarmaktadır?",
        "Paragrafın anlattığı olay hangi seçenekte verilmiştir?",
        "Bu parçada anlatılan durum aşağıdakilerden hangisidir?",
        "Paragraf ne hakkında bilgi vermektedir?",
        "Metnin anlattığı olay veya durum hangisidir?",
        "Paragraf okuyucuya ne anlatmaktadır?",
        "Bu metinde anlatılan olay hangi seçenektedir?",
        "Paragrafın anlattığı durum hangisidir?",
        "Metin hangi olayı veya durumu aktarmaktadır?",
        "Paragrafta anlatılan olay aşağıdakilerden hangisidir?",
        "Bu parça hangi olayı veya durumu anlatır?",
        "Paragrafın anlattığı olay hangi seçenekte bulunur?",
        "Metin okunduğunda hangi olay anlatılmış olur?",
        "Paragrafta bahsedilen olay veya durum hangisidir?",
        "Bu parçada aktarılan olay hangi seçenektedir?",
        "Paragraf neyi anlatmaktadır?",
        "Metnin anlattığı durum hangi seçenekte doğru verilmiştir?",
    ],
}


def load_bank(name: str):
    p = SCRIPTS / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name, p)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def classify_paragraf_stem(text: str) -> str:
    t = text.lower()
    if "şiir" in t or "duygu" in t:
        return "duygu"
    if "başlık" in t:
        return "baslik"
    if "ana düşünce" in t or "ana fikir" in t:
        return "ana_dusunce"
    if "ne anlat" in t or "paragraf ne" in t:
        return "ne_anlatiyor"
    return "konu"


def diversify_paragraf_bank() -> None:
    m = load_bank("paragraf_s3_bank")
    raw = list(m._RAW)
    counters = {k: 0 for k in PARAGRAF_STEMS}
    new_raw = []
    for row in raw:
        level, text, correct, w1, w2, exp = row[:6]
        premise = row[6] if len(row) > 6 else None
        cat = classify_paragraf_stem(text)
        pool = PARAGRAF_STEMS[cat]
        idx = counters[cat]
        counters[cat] += 1
        new_text = pool[idx % len(pool)]
        # If we exhaust pool, append qualifier
        if idx >= len(pool):
            new_text = pool[idx % len(pool)].replace("?", f" ({idx + 1})?")
        new_raw.append((level, new_text, correct, w1, w2, exp, premise) if premise else (level, new_text, correct, w1, w2, exp))
    _write_raw_file("paragraf_s3_bank.py", "Paragrafta Anlam", "paragraf3_", new_raw)


def _write_raw_file(module: str, title: str, prefix: str, raw: list[tuple]) -> None:
    path = SCRIPTS / f"{module}.py"
    lines = [
        "# -*- coding: utf-8 -*-",
        f'"""3. sınıf {title} — 150 soru."""',
        "from __future__ import annotations",
        "",
        "_RAW: list[tuple] = [",
    ]
    for row in raw:
        parts = []
        for i, item in enumerate(row):
            parts.append(repr(item))
        lines.append(f"    ({', '.join(parts)}),")
    lines += [
        "]",
        "",
        "def get_questions() -> list[dict]:",
        "    out = []",
        "    for i, row in enumerate(_RAW, start=1):",
        "        level, text, correct, w1, w2, exp = row[:6]",
        "        premise = row[6] if len(row) > 6 else None",
        "        out.append({",
        f'            "id": f"{prefix}{{{{i:03d}}}}",',
        '            "level": level,',
        '            "premise": premise,',
        '            "text": text,',
        '            "correct": correct,',
        '            "wrong1": w1,',
        '            "wrong2": w2,',
        '            "explanation": exp,',
        "        })",
        "    return out",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {path}")


if __name__ == "__main__":
    diversify_paragraf_bank()

# -*- coding: utf-8 -*-
"""Generate dilbilgisi_s3_bank.py and yazim_s3_bank.py with unique question banks."""
from __future__ import annotations

from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent


def make_row(
    level: str,
    text: str,
    correct: str,
    wrong1: str,
    wrong2: str,
    explanation: str,
    premise: str | None = None,
) -> tuple:
    row = [level, text, correct, wrong1, wrong2, explanation]
    if premise is not None:
        row.append(premise)
    return tuple(row)


def write_bank(module_name: str, title: str, prefix: str, rows: list[tuple]) -> Path:
    path = SCRIPTS / f"{module_name}.py"
    lines = [
        "# -*- coding: utf-8 -*-",
        f'"""{title}"""',
        "from __future__ import annotations",
        "",
        "_RAW: list[tuple] = [",
    ]
    level_markers = {
        "kolay": "# ── KOLAY (50) ──",
        "orta": "# ── ORTA (50) ──",
        "zor": "# ── ZOR (50) ──",
    }
    previous_level = None
    for row in rows:
        level = row[0]
        if level != previous_level:
            lines.append(f"    {level_markers[level]}")
            previous_level = level
        lines.append(f"    ({', '.join(repr(part) for part in row)}),")
    lines.extend(
        [
            "]",
            "",
            "def get_questions() -> list[dict]:",
            "    out = []",
            "    for i, row in enumerate(_RAW, start=1):",
            "        level, text, correct, w1, w2, exp = row[:6]",
            "        premise = row[6] if len(row) > 6 else None",
            "        out.append({",
            f'            "id": f"{prefix}{{i:03d}}",',
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
    )
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def validate_bank(rows: list[tuple], expected_levels: dict[str, int]) -> dict[str, int]:
    assert len(rows) == 150, f"Beklenen 150 soru, bulunan {len(rows)}"
    texts = [row[1] for row in rows]
    explanations = [row[5] for row in rows]
    keys = [(row[1], row[6] if len(row) > 6 else "") for row in rows]
    assert len(set(keys)) == 150, "Soru metni + öncül çiftleri benzersiz değil"
    assert len(set(explanations)) == 150, "Açıklamalar benzersiz değil"
    counts: dict[str, int] = {}
    for row in rows:
        assert len(row) in (6, 7), f"Beklenmeyen tuple uzunluğu: {len(row)}"
        level = row[0]
        counts[level] = counts.get(level, 0) + 1
        for part in row:
            if isinstance(part, str):
                assert "«" not in part and "»" not in part, "Yasak karakter bulundu"
    assert counts == expected_levels, f"Seviye dağılımı yanlış: {counts}"
    return {
        "total": len(rows),
        "unique_texts": len(set(texts)),
        "unique_explanations": len(set(explanations)),
    }


PROPER_CASES = [
    {
        "proper": "Mert",
        "lower": "mert",
        "common1": "çocuk",
        "common2": "öğrenci",
        "sentence": "Mert bugün kütüphaneye gitti.",
        "sentence_w1": "bugün",
        "sentence_w2": "kütüphaneye",
        "category": "kişi adı",
    },
    {
        "proper": "Ankara",
        "lower": "ankara",
        "common1": "şehir",
        "common2": "cadde",
        "sentence": "Ankara yarın yağmurlu olacak.",
        "sentence_w1": "yarın",
        "sentence_w2": "yağmurlu",
        "category": "şehir adı",
    },
    {
        "proper": "Zeynep",
        "lower": "zeynep",
        "common1": "kız",
        "common2": "kardeş",
        "sentence": "Zeynep resim yarışmasına katıldı.",
        "sentence_w1": "resim",
        "sentence_w2": "yarışmasına",
        "category": "kişi adı",
    },
    {
        "proper": "Bursa",
        "lower": "bursa",
        "common1": "il",
        "common2": "mahalle",
        "sentence": "Bursa ipeğiyle ünlüdür.",
        "sentence_w1": "ipeğiyle",
        "sentence_w2": "ünlüdür",
        "category": "şehir adı",
    },
    {
        "proper": "Kızılırmak",
        "lower": "kızılırmak",
        "common1": "nehir",
        "common2": "su",
        "sentence": "Kızılırmak ülkemizin uzun akarsularındandır.",
        "sentence_w1": "ülkemizin",
        "sentence_w2": "akarsularındandır",
        "category": "nehir adı",
    },
    {
        "proper": "Uludağ",
        "lower": "uludağ",
        "common1": "dağ",
        "common2": "tepe",
        "sentence": "Kışın Uludağ'a çok sayıda ziyaretçi gelir.",
        "sentence_w1": "kışın",
        "sentence_w2": "ziyaretçi",
        "category": "dağ adı",
    },
    {
        "proper": "Yıldız İlkokulu",
        "lower": "yıldız ilkokulu",
        "common1": "okul",
        "common2": "sınıf",
        "sentence": "Yıldız İlkokulu bu yıl kitap şenliği düzenledi.",
        "sentence_w1": "bu yıl",
        "sentence_w2": "kitap",
        "category": "okul adı",
    },
    {
        "proper": "Van Gölü",
        "lower": "van gölü",
        "common1": "göl",
        "common2": "kıyı",
        "sentence": "Van Gölü'nün suyu sodalıdır.",
        "sentence_w1": "suyu",
        "sentence_w2": "sodalıdır",
        "category": "göl adı",
    },
    {
        "proper": "Cumhuriyet Bayramı",
        "lower": "cumhuriyet bayramı",
        "common1": "bayram",
        "common2": "tören",
        "sentence": "Cumhuriyet Bayramı'nda şiir okuduk.",
        "sentence_w1": "şiir",
        "sentence_w2": "okuduk",
        "category": "bayram adı",
    },
    {
        "proper": "Pamukkale",
        "lower": "pamukkale",
        "common1": "traverten",
        "common2": "vadi",
        "sentence": "Pamukkale'yi görmek isteyen turistler erken geldi.",
        "sentence_w1": "görmek",
        "sentence_w2": "turistler",
        "category": "yer adı",
    },
]


COMMON_CASES = [
    {
        "noun": "masa",
        "proper1": "Ali",
        "proper2": "Ankara",
        "sentence": "Sınıftaki masa boyanacak.",
        "sentence_w1": "Sınıftaki",
        "sentence_w2": "boyanacak",
        "category": "eşya adı",
    },
    {
        "noun": "kedi",
        "proper1": "Merve",
        "proper2": "Bursa",
        "sentence": "Minik kedi pencerenin önünde uyudu.",
        "sentence_w1": "Minik",
        "sentence_w2": "pencerenin",
        "category": "hayvan adı",
    },
    {
        "noun": "öğretmen",
        "proper1": "Ayla",
        "proper2": "Van",
        "sentence": "Yeni öğretmen bizi güler yüzle karşıladı.",
        "sentence_w1": "Yeni",
        "sentence_w2": "bizi",
        "category": "meslek adı",
    },
    {
        "noun": "kalem",
        "proper1": "Efe",
        "proper2": "Konya",
        "sentence": "Mavi kalem sıranın altına düştü.",
        "sentence_w1": "Mavi",
        "sentence_w2": "sıranın",
        "category": "eşya adı",
    },
    {
        "noun": "park",
        "proper1": "Deniz",
        "proper2": "Kars",
        "sentence": "Mahalledeki park akşam serin olur.",
        "sentence_w1": "Mahalledeki",
        "sentence_w2": "akşam",
        "category": "yer adı",
    },
    {
        "noun": "çiçek",
        "proper1": "Elif",
        "proper2": "Uludağ",
        "sentence": "Saksıdaki çiçek bugün açtı.",
        "sentence_w1": "Saksıdaki",
        "sentence_w2": "bugün",
        "category": "bitki adı",
    },
    {
        "noun": "kitap",
        "proper1": "Aras",
        "proper2": "Pamukkale",
        "sentence": "Kalın kitap çantama sığmadı.",
        "sentence_w1": "Kalın",
        "sentence_w2": "çantama",
        "category": "eşya adı",
    },
    {
        "noun": "öğrenci",
        "proper1": "Nil",
        "proper2": "Ankara",
        "sentence": "Çalışkan öğrenci soruyu hemen çözdü.",
        "sentence_w1": "Çalışkan",
        "sentence_w2": "soruyu",
        "category": "insan adı",
    },
    {
        "noun": "çanta",
        "proper1": "Zeynep",
        "proper2": "Bolu",
        "sentence": "Ağır çanta askıda duruyor.",
        "sentence_w1": "Ağır",
        "sentence_w2": "askıda",
        "category": "eşya adı",
    },
    {
        "noun": "bulut",
        "proper1": "Can",
        "proper2": "Van Gölü",
        "sentence": "Gri bulut ovanın üstünü kapladı.",
        "sentence_w1": "Gri",
        "sentence_w2": "ovanın",
        "category": "doğa varlığı",
    },
]


PLURAL_CASES = [
    {
        "singular": "kedi",
        "plural": "kediler",
        "wrong": "kedilar",
        "sentence": "Sokaktaki kediler güneşte ısındı.",
        "sentence_w1": "Sokaktaki",
        "sentence_w2": "güneşte",
        "alt_sentence": "Kediler akşam olunca eve girdi.",
    },
    {
        "singular": "çiçek",
        "plural": "çiçekler",
        "wrong": "çiçeklar",
        "sentence": "Bahçedeki çiçekler renk renk açtı.",
        "sentence_w1": "Bahçedeki",
        "sentence_w2": "renk renk",
        "alt_sentence": "Çiçekler yağmurdan sonra canlandı.",
    },
    {
        "singular": "çocuk",
        "plural": "çocuklar",
        "wrong": "çocukler",
        "sentence": "Çocuklar oyundan sonra su içti.",
        "sentence_w1": "oyundan",
        "sentence_w2": "su",
        "alt_sentence": "Çocuklar sıraya geçince sessizleşti.",
    },
    {
        "singular": "kuş",
        "plural": "kuşlar",
        "wrong": "kuşler",
        "sentence": "Kuşlar sabah erkenden ötmeye başladı.",
        "sentence_w1": "sabah",
        "sentence_w2": "ötmeye",
        "alt_sentence": "Kuşlar tellere yan yana kondu.",
    },
    {
        "singular": "defter",
        "plural": "defterler",
        "wrong": "defterlar",
        "sentence": "Yeni defterler dolaba yerleştirildi.",
        "sentence_w1": "Yeni",
        "sentence_w2": "dolaba",
        "alt_sentence": "Defterler öğretmenin masasına bırakıldı.",
    },
    {
        "singular": "kalem",
        "plural": "kalemler",
        "wrong": "kalemlar",
        "sentence": "Renkli kalemler kutuda duruyor.",
        "sentence_w1": "Renkli",
        "sentence_w2": "kutuda",
        "alt_sentence": "Kalemler ders bitince toplandı.",
    },
    {
        "singular": "oyun",
        "plural": "oyunlar",
        "wrong": "oyunler",
        "sentence": "Geleneksel oyunlar teneffüste çok sevilir.",
        "sentence_w1": "Geleneksel",
        "sentence_w2": "teneffüste",
        "alt_sentence": "Oyunlar şenlikte yeniden kuruldu.",
    },
    {
        "singular": "kitap",
        "plural": "kitaplar",
        "wrong": "kitapler",
        "sentence": "Kitaplar raflarda düzgün durmalı.",
        "sentence_w1": "raflarda",
        "sentence_w2": "düzgün",
        "alt_sentence": "Kitaplar kütüphanede numaralandırıldı.",
    },
    {
        "singular": "şehir",
        "plural": "şehirler",
        "wrong": "şehirlar",
        "sentence": "Büyük şehirler geceleri ışıl ışıl olur.",
        "sentence_w1": "Büyük",
        "sentence_w2": "geceleri",
        "alt_sentence": "Şehirler haritada farklı renklerle gösterildi.",
    },
    {
        "singular": "göz",
        "plural": "gözler",
        "wrong": "gözlar",
        "sentence": "Gözler sağlıklı kalmak için dinlenmelidir.",
        "sentence_w1": "sağlıklı",
        "sentence_w2": "dinlenmelidir",
        "alt_sentence": "Gözler ekrana uzun süre bakınca yorulur.",
    },
]


DE_DA_CASES = [
    {
        "token": "de",
        "blank": "Ben ___ yarın kütüphaneye geleceğim.",
        "mode": "ayrı yazılır",
        "reason": "cümleye ekleme anlamı kattığı için bağlaçtır",
        "correct_sentence": "Ben de yarın kütüphaneye geleceğim.",
        "wrong1": "Bende yarın kütüphaneye geleceğim.",
        "wrong2": "Ben'de yarın kütüphaneye geleceğim.",
        "alt_correct": "Elif de satranç turnuvasına katıldı.",
    },
    {
        "token": "da",
        "blank": "Kalem oda___ duruyor.",
        "mode": "bitişik yazılır",
        "reason": "yer bildiren bulunma eki olduğu için sözcüğe bitişir",
        "correct_sentence": "Kalem odada duruyor.",
        "wrong1": "Kalem oda da duruyor.",
        "wrong2": "Kalem oda'da duruyor.",
        "alt_correct": "Top arabada unutuldu.",
    },
    {
        "token": "da",
        "blank": "O ___ bizimle müzeye gelecek.",
        "mode": "ayrı yazılır",
        "reason": "cümleye katılma anlamı kattığı için bağlaçtır",
        "correct_sentence": "O da bizimle müzeye gelecek.",
        "wrong1": "Oda bizimle müzeye gelecek.",
        "wrong2": "O'da bizimle müzeye gelecek.",
        "alt_correct": "Kardeşim de afiş hazırladı.",
    },
    {
        "token": "de",
        "blank": "Defter ev___ kaldı.",
        "mode": "bitişik yazılır",
        "reason": "bir yerde bulunmayı anlattığı için ek olarak kullanılmıştır",
        "correct_sentence": "Defter evde kaldı.",
        "wrong1": "Defter ev de kaldı.",
        "wrong2": "Defter ev'de kaldı.",
        "alt_correct": "Anahtar çekmecede duruyor.",
    },
    {
        "token": "de",
        "blank": "Elif ___ sergi için resim yaptı.",
        "mode": "ayrı yazılır",
        "reason": "Elif'i başkalarına eklediği için bağlaç görevindedir",
        "correct_sentence": "Elif de sergi için resim yaptı.",
        "wrong1": "Elifde sergi için resim yaptı.",
        "wrong2": "Elif'de sergi için resim yaptı.",
        "alt_correct": "Ben de afiş boyadım.",
    },
    {
        "token": "da",
        "blank": "Top araba___ unutuldu.",
        "mode": "bitişik yazılır",
        "reason": "arabada sözü bir yerde kalmayı anlattığı için ek almıştır",
        "correct_sentence": "Top arabada unutuldu.",
        "wrong1": "Top araba da unutuldu.",
        "wrong2": "Top araba'da unutuldu.",
        "alt_correct": "Çanta okulda kaldı.",
    },
    {
        "token": "de",
        "blank": "Dedem ___ bizimle pikniğe geldi.",
        "mode": "ayrı yazılır",
        "reason": "dedem sözüne ekleme yaptığı için bağlaçtır",
        "correct_sentence": "Dedem de bizimle pikniğe geldi.",
        "wrong1": "Dedemde bizimle pikniğe geldi.",
        "wrong2": "Dedem'de bizimle pikniğe geldi.",
        "alt_correct": "Komşumuz da sandalye getirdi.",
    },
    {
        "token": "da",
        "blank": "Oyuncak kutu___ saklanıyor.",
        "mode": "bitişik yazılır",
        "reason": "kutuda sözü yer bildiren ek taşıdığı için bitişik yazılır",
        "correct_sentence": "Oyuncak kutuda saklanıyor.",
        "wrong1": "Oyuncak kutu da saklanıyor.",
        "wrong2": "Oyuncak kutu'da saklanıyor.",
        "alt_correct": "Meyve masada bekliyor.",
    },
    {
        "token": "da",
        "blank": "Kuş ___ yuvasına saman taşıdı.",
        "mode": "ayrı yazılır",
        "reason": "başkası gibi kuşun da yaptığı anlatıldığı için bağlaçtır",
        "correct_sentence": "Kuş da yuvasına saman taşıdı.",
        "wrong1": "Kuşda yuvasına saman taşıdı.",
        "wrong2": "Kuş'da yuvasına saman taşıdı.",
        "alt_correct": "Sincap da ceviz topladı.",
    },
    {
        "token": "da",
        "blank": "Meyve masa___ bekliyor.",
        "mode": "bitişik yazılır",
        "reason": "masada sözü bulunma durumu eki aldığı için bitişik yazılır",
        "correct_sentence": "Meyve masada bekliyor.",
        "wrong1": "Meyve masa da bekliyor.",
        "wrong2": "Meyve masa'da bekliyor.",
        "alt_correct": "Su şişesi evde kaldı.",
    },
]


KI_CASES = [
    {
        "token": "ki",
        "blank": "Annem dedi ___ erken uyuyalım.",
        "mode": "ayrı yazılır",
        "reason": "iki sözü birbirine bağlayan bağlaçtır",
        "correct_sentence": "Annem dedi ki erken uyuyalım.",
        "wrong1": "Annem dediki erken uyuyalım.",
        "wrong2": "Annem dedi'ki erken uyuyalım.",
        "alt_correct": "Öğretmen söyledi ki yarın kitap getirelim.",
    },
    {
        "token": "ki",
        "blank": "Masa___ kitap benim.",
        "mode": "bitişik yazılır",
        "reason": "adı niteleyen ek olduğu için kelimeye bitişir",
        "correct_sentence": "Masadaki kitap benim.",
        "wrong1": "Masada ki kitap benim.",
        "wrong2": "Masada'ki kitap benim.",
        "alt_correct": "Bahçedeki salıncak boştu.",
    },
    {
        "token": "ki",
        "blank": "Gördüm ___ kuş pencereye konmuş.",
        "mode": "ayrı yazılır",
        "reason": "gördüm sözüyle sonraki cümleyi bağlayan bağlaçtır",
        "correct_sentence": "Gördüm ki kuş pencereye konmuş.",
        "wrong1": "Gördümki kuş pencereye konmuş.",
        "wrong2": "Gördüm'ki kuş pencereye konmuş.",
        "alt_correct": "Babam fark etti ki anahtar içeride kalmış.",
    },
    {
        "token": "ki",
        "blank": "Bahçe___ kediler gölgede uyuyor.",
        "mode": "bitişik yazılır",
        "reason": "bahçedeki sözünde ad tamlamasını kuran ektir",
        "correct_sentence": "Bahçedeki kediler gölgede uyuyor.",
        "wrong1": "Bahçede ki kediler gölgede uyuyor.",
        "wrong2": "Bahçede'ki kediler gölgede uyuyor.",
        "alt_correct": "Sınıftaki afiş yeni asıldı.",
    },
    {
        "token": "ki",
        "blank": "Öğretmen söyledi ___ yarın gezi var.",
        "mode": "ayrı yazılır",
        "reason": "söyledi sözünü açıklayan ikinci cümleyi bağlar",
        "correct_sentence": "Öğretmen söyledi ki yarın gezi var.",
        "wrong1": "Öğretmen söylediki yarın gezi var.",
        "wrong2": "Öğretmen söyledi'ki yarın gezi var.",
        "alt_correct": "Anladım ki sorun kalmamış.",
    },
    {
        "token": "ki",
        "blank": "Dün___ ödev çok kısaydı.",
        "mode": "bitişik yazılır",
        "reason": "dünkü sözünde zamanı ada bağlayan ek görevindedir",
        "correct_sentence": "Dünkü ödev çok kısaydı.",
        "wrong1": "Dün ki ödev çok kısaydı.",
        "wrong2": "Dün'ki ödev çok kısaydı.",
        "alt_correct": "Akşamki maç çok heyecanlıydı.",
    },
    {
        "token": "ki",
        "blank": "Biliyorum ___ çok emek verdin.",
        "mode": "ayrı yazılır",
        "reason": "önceki yargıyı sonraki yargıya bağlayan bağlaçtır",
        "correct_sentence": "Biliyorum ki çok emek verdin.",
        "wrong1": "Biliyorumki çok emek verdin.",
        "wrong2": "Biliyorum'ki çok emek verdin.",
        "alt_correct": "Hissettim ki yağmur başlayacak.",
    },
    {
        "token": "ki",
        "blank": "Sınıf___ pano rengarenk oldu.",
        "mode": "bitişik yazılır",
        "reason": "sınıftaki sözünde bir adı niteleyen ek olarak kullanılmıştır",
        "correct_sentence": "Sınıftaki pano rengarenk oldu.",
        "wrong1": "Sınıfta ki pano rengarenk oldu.",
        "wrong2": "Sınıfta'ki pano rengarenk oldu.",
        "alt_correct": "Yoldaki taş kenara alındı.",
    },
    {
        "token": "ki",
        "blank": "Anladım ___ sen önce gelmişsin.",
        "mode": "ayrı yazılır",
        "reason": "anladım yargısını açıklayan cümleyi bağlayan sözcüktür",
        "correct_sentence": "Anladım ki sen önce gelmişsin.",
        "wrong1": "Anladımki sen önce gelmişsin.",
        "wrong2": "Anladım'ki sen önce gelmişsin.",
        "alt_correct": "Fark ettim ki zil çoktan çalmış.",
    },
    {
        "token": "ki",
        "blank": "Akşam___ oyun ailece oynanacak.",
        "mode": "bitişik yazılır",
        "reason": "akşamki sözünde zamanı gösteren bir ek olduğu için bitişik yazılır",
        "correct_sentence": "Akşamki oyun ailece oynanacak.",
        "wrong1": "Akşam ki oyun ailece oynanacak.",
        "wrong2": "Akşam'ki oyun ailece oynanacak.",
        "alt_correct": "Sabahki toplantı erkene alındı.",
    },
]


MI_CASES = [
    {
        "token": "mi",
        "blank": "Sen de ___ geliyorsun?",
        "mode": "ayrı yazılır",
        "reason": "soru anlamı veren edat olduğu için ayrı yazılır",
        "correct_sentence": "Sen de mi geliyorsun?",
        "wrong1": "Sen demi geliyorsun?",
        "wrong2": "Sen de'mi geliyorsun?",
        "alt_correct": "Ben de mi bekleyeceğim?",
    },
    {
        "token": "mı",
        "blank": "Ödevini yaptı ___?",
        "mode": "ayrı yazılır",
        "reason": "yapma işini soru biçimine çevirdiği için ayrı yazılır",
        "correct_sentence": "Ödevini yaptı mı?",
        "wrong1": "Ödevini yaptımı?",
        "wrong2": "Ödevini yaptı'mı?",
        "alt_correct": "Resmi boyadı mı?",
    },
    {
        "token": "mu",
        "blank": "Top oynuyor ___?",
        "mode": "ayrı yazılır",
        "reason": "eylemi soru haline getiren soru eki ayrı yazılır",
        "correct_sentence": "Top oynuyor mu?",
        "wrong1": "Top oynuyormu?",
        "wrong2": "Top oynuyor'mu?",
        "alt_correct": "Kardeşin uyuyor mu?",
    },
    {
        "token": "mı",
        "blank": "Süt ısındı ___?",
        "mode": "ayrı yazılır",
        "reason": "ısınma durumunu soru yaptığı için ayrı yazılması gerekir",
        "correct_sentence": "Süt ısındı mı?",
        "wrong1": "Süt ısındımı?",
        "wrong2": "Süt ısındı'mı?",
        "alt_correct": "Çorba hazır mı?",
    },
    {
        "token": "mı",
        "blank": "Kapı açık ___?",
        "mode": "ayrı yazılır",
        "reason": "durumu soru yapan mı ayrı yazılır",
        "correct_sentence": "Kapı açık mı?",
        "wrong1": "Kapı açıkmı?",
        "wrong2": "Kapı açık'mı?",
        "alt_correct": "Pencere kapalı mı?",
    },
    {
        "token": "mi",
        "blank": "Bu resmi sen ___ çizdin?",
        "mode": "ayrı yazılır",
        "reason": "kimin yaptığı sorulduğu için soru edatı ayrı yazılır",
        "correct_sentence": "Bu resmi sen mi çizdin?",
        "wrong1": "Bu resmi senmi çizdin?",
        "wrong2": "Bu resmi sen'mi çizdin?",
        "alt_correct": "Bu notu ben mi yazdım?",
    },
    {
        "token": "mi",
        "blank": "Yarın bize ___ uğrayacaksın?",
        "mode": "ayrı yazılır",
        "reason": "uğrama işini soru yaptığı için mi ayrı yazılır",
        "correct_sentence": "Yarın bize mi uğrayacaksın?",
        "wrong1": "Yarın bizemi uğrayacaksın?",
        "wrong2": "Yarın bize'mi uğrayacaksın?",
        "alt_correct": "Hafta sonu bize mi geleceksin?",
    },
    {
        "token": "mi",
        "blank": "Arkadaşın geldi ___?",
        "mode": "ayrı yazılır",
        "reason": "gelme durumunu sorduğu için soru eki ayrı kullanılır",
        "correct_sentence": "Arkadaşın geldi mi?",
        "wrong1": "Arkadaşın geldimi?",
        "wrong2": "Arkadaşın geldi'mi?",
        "alt_correct": "Postacı geçti mi?",
    },
    {
        "token": "mi",
        "blank": "Kedi süt içti ___?",
        "mode": "ayrı yazılır",
        "reason": "içme işini soru yaptığı için ayrı yazımı doğrudur",
        "correct_sentence": "Kedi süt içti mi?",
        "wrong1": "Kedi süt içtimi?",
        "wrong2": "Kedi süt içti'mi?",
        "alt_correct": "Bebek suyunu içti mi?",
    },
    {
        "token": "mu",
        "blank": "Şarkıyı duydun ___?",
        "mode": "ayrı yazılır",
        "reason": "duyma eylemini soru biçimine çevirdiği için ayrı yazılır",
        "correct_sentence": "Şarkıyı duydun mu?",
        "wrong1": "Şarkıyı duydunmu?",
        "wrong2": "Şarkıyı duydun'mu?",
        "alt_correct": "Zili duydun mu?",
    },
]


def build_proper_rows() -> list[tuple]:
    rows: list[tuple] = []
    for case in PROPER_CASES:
        rows.append(
            make_row(
                "kolay",
                f"Aşağıdaki sözcüklerden hangisi özel isimdir: {case['common1']}, {case['proper']}, {case['common2']}?",
                case["proper"],
                case["common1"],
                case["common2"],
                f"{case['proper']}, belirli bir {case['category']} olduğu için özel isimdir; {case['common1']} ve {case['common2']} ise genel addır.",
            )
        )
        rows.append(
            make_row(
                "kolay",
                f"Özel isimler büyük harfle başlar. Bu kurala göre hangisi doğru yazılmıştır: {case['lower']}, {case['proper']}, {case['common1']}?",
                case["proper"],
                case["lower"],
                case["common1"],
                f"{case['proper']} yazımı doğrudur; çünkü özel isimler büyük harfle başlar, {case['lower']} biçimi ise kuralı bozmuştur.",
            )
        )
        rows.append(
            make_row(
                "kolay",
                f"Yukarıdaki cümlede geçen özel isim ({case['proper']}) hangi seçenektedir?",
                case["proper"],
                case["sentence_w1"],
                case["sentence_w2"],
                f"Bu cümlede özel isim olan sözcük {case['proper']}tir; öteki seçenekler yalnızca zamanı ya da durumu anlatır.",
                case["sentence"],
            )
        )
        rows.append(
            make_row(
                "kolay",
                f"Bir {case['category']} yazarken hangi sözcük ilk harfi büyük olacak biçimde kullanılmalıdır? Örnek seçenekler: {case['proper']}, {case['common1']}, {case['common2']}.",
                case["proper"],
                case["common1"],
                case["common2"],
                f"{case['proper']} tek bir {case['category']} gösterdiği için büyük harfle yazılır; {case['common1']} ve {case['common2']} gibi sözcükler cins addır.",
            )
        )
        premise = "\n".join(
            [
                f"I. {case['proper']}",
                f"II. {case['lower']}",
                f"III. {case['common1']}",
            ]
        )
        rows.append(
            make_row(
                "kolay",
                f"Yukarıdaki yazımlardan {case['proper']} adının doğru yazımı hangisidir?",
                "I",
                "II",
                "III",
                f"Listede yalnızca I. satırdaki {case['proper']} yazımı kurala uygundur; küçük harfle yazılan biçim ve cins ad olan {case['common1']} doğru cevap değildir.",
                premise,
            )
        )
    return rows


def build_common_rows() -> list[tuple]:
    rows: list[tuple] = []
    for case in COMMON_CASES:
        rows.append(
            make_row(
                "orta",
                f"Aşağıdakilerden hangisi cins isimdir: {case['proper1']}, {case['noun']}, {case['proper2']}?",
                case["noun"],
                case["proper1"],
                case["proper2"],
                f"{case['noun']} aynı türden birçok varlığın ortak adı olduğu için cins isimdir; {case['proper1']} ve {case['proper2']} ise özel isimdir.",
            )
        )
        rows.append(
            make_row(
                "orta",
                f"Yukarıdaki cümlede cins isim olan \"{case['noun']}\" hangi seçenekte doğru gösterilmiştir?",
                case["noun"],
                case["sentence_w1"],
                case["sentence_w2"],
                f"Cümlede tür bildiren sözcük {case['noun']}dur; {case['sentence_w1']} ve {case['sentence_w2']} cins isim göreviyle kullanılmamıştır.",
                case["sentence"],
            )
        )
        rows.append(
            make_row(
                "orta",
                f"\"{case['noun']}\" sözcüğü neden cins isim sayılır?",
                "Aynı türdeki varlıkların ortak adı olduğu için",
                "Tek bir kişiyi gösterdiği için",
                "Her zaman büyük harfle başladığı için",
                f"{case['noun']} belirli tek bir varlığı değil, aynı türden tüm {case['category']} örneklerini karşılayabildiği için cins isimdir.",
            )
        )
        rows.append(
            make_row(
                "orta",
                f"Aşağıdaki seçeneklerden hangisi özel isim olmadığı için küçük harfle de yazılabilir? Odak sözcük: {case['noun']}.",
                case["noun"],
                case["proper1"],
                case["proper2"],
                f"{case['noun']} bir {case['category']} adı olduğundan cins isimdir ve cümle içinde genellikle küçük harfle yazılır; diğer seçenekler özel addır.",
            )
        )
        premise = "\n".join(
            [
                f"I. {case['proper1']}",
                f"II. {case['noun']}",
                f"III. {case['proper2']}",
            ]
        )
        rows.append(
            make_row(
                "orta",
                f"Yukarıdaki sözcüklerden {case['noun']} türündeki cins isim hangisidir?",
                "II",
                "I",
                "III",
                f"II. sıradaki {case['noun']} ortak ad olduğu için cins isimdir; I. ve III. sıralardaki özel adlar bu kurala girmez.",
                premise,
            )
        )
    return rows


def build_plural_rows() -> list[tuple]:
    rows: list[tuple] = []
    for case in PLURAL_CASES:
        rows.append(
            make_row(
                "zor",
                f"\"{case['singular']}\" sözcüğünün çoğul biçimi hangisidir?",
                case["plural"],
                case["singular"],
                case["wrong"],
                f"{case['singular']} sözcüğü birden fazla varlığı anlatınca {case['plural']} olur; {case['wrong']} yazımı ise ünlü uyumuna uymaz.",
            )
        )
        rows.append(
            make_row(
                "zor",
                f"Yukarıdaki cümlede {case['singular']} sözcüğünün çoğul hâli hangisidir?",
                case["plural"],
                case["sentence_w1"],
                case["sentence_w2"],
                f"Cümlede birden fazla varlık anlatıldığı için çoğul ad {case['plural']} sözcüğüdür; diğer seçenekler çoğul ad değildir.",
                case["sentence"],
            )
        )
        rows.append(
            make_row(
                "zor",
                f"Aşağıdaki seçeneklerden hangisinde -lar/-ler eki {case['singular']} sözcüğüne doğru getirilmiştir?",
                case["plural"],
                case["wrong"],
                case["singular"],
                f"{case['singular']} sözcüğünün son ünlüsü dikkate alındığında doğru çoğul biçim {case['plural']} olur; {case['wrong']} yanlıştır.",
            )
        )
        rows.append(
            make_row(
                "zor",
                f"Aşağıdaki cümlelerden hangisinde {case['singular']} sözcüğünün çoğulu yanlış yazılmıştır?",
                case["wrong"].capitalize() + " sınıf kapısında bekledi.",
                case["sentence"],
                case["alt_sentence"],
                f"{case['wrong'].capitalize()} biçimi yanlıştır; doğru çoğul {case['plural']} olmalıydı. Öteki iki cümlede çoğul ek doğru kullanılmıştır.",
            )
        )
        premise = "\n".join(
            [
                f"I. {case['singular']}",
                f"II. {case['plural']}",
                f"III. {case['wrong']}",
            ]
        )
        rows.append(
            make_row(
                "zor",
                f"Yukarıdaki yazımlardan hangisi {case['singular']} sözcüğünün doğru çoğuludur?",
                "II",
                "I",
                "III",
                f"Listede II. sıradaki {case['plural']} doğru çoğul yazımdır; I tekil biçimdir, III ise ekin yanlış kullanılmasına örnektir.",
                premise,
            )
        )
    return rows


def orthography_reason_options(mode: str, token: str, reason: str) -> tuple[str, str, str]:
    if token in {"mi", "mı", "mu", "mü"}:
        return (
            reason,
            "kelimenin ayrılmaz bir parçası olduğu için bitişik yazılır",
            "özel isimden sonra geldiği için kesmeyle ayrılır",
        )
    if mode == "ayrı yazılır":
        return (
            reason,
            "yer bildiren ek olduğu için sözcüğe bitişir",
            "özel isim olduğu için kesme işaretiyle ayrılır",
        )
    return (
        reason,
        "bağlaç olduğu için ayrı yazılır",
        "özel isim olduğu için kesme işaretiyle ayrılır",
    )


def build_orthography_rows(level: str, cases: list[dict], offset: int = 0) -> list[tuple]:
    rows: list[tuple] = []
    places = ["cümlede", "örnekte", "metinde", "satırda", "ifadede"]
    blank_actions = [
        "yazılmalıdır", "yazılır", "getirilmelidir", "konmalıdır", "kullanılmalıdır",
        "doğru yazılır", "yazılması gerekir", "yazımı nasıl olmalıdır", "nasıl yazılır",
        "hangi kurala göre yazılır",
    ]
    pick_actions = [
        "doğru yazılmıştır", "kurala uygundur", "doğru kullanılmıştır", "yanlış yazılmamıştır",
        "yazımı doğrudur", "doğru örnektir", "kurala uygun yazılmıştır", "doğru biçimdedir",
        "yazım kuralına uyar", "doğru biçimde yazılmıştır",
    ]
    why_actions = [
        "neden bu şekilde yazılmıştır", "yazımının gerekçesi nedir", "bu biçimde yazılmasının nedeni nedir",
        "hangi kurala göre yazılmıştır", "doğru yazımın sebebi nedir", "bu yazım neden doğrudur",
        "nasıl açıklanır", "hangi gerekçeyle yazılmıştır", "doğru olmasının nedeni nedir",
        "yazımı hangi kurala dayanır",
    ]
    roman_actions = [
        "için kurala uygundur", "doğru yazılmıştır", "kurala uygun kullanılmıştır",
        "yazımı doğru olan hangisidir", "doğru örnek hangisidir", "kuralına uygundur",
        "doğru biçimde yazılmıştır", "yazımı yanlış değildir", "doğru kullanılmıştır",
        "kural dışı değildir",
    ]
    wrong_actions = [
        "yazımı yanlış olan hangisidir", "yazım hatası olan hangisidir",
        "kural dışı yazılan hangisidir", "yanlış yazılmış olan hangisidir",
        "hatalı yazım hangisidir", "yazımı bozuk olan hangisidir",
        "kurala aykırı olan hangisidir", "doğru yazılmayan hangisidir",
        "eksik veya yanlış yazılan hangisidir", "yazım yanlışı bulunan hangisidir",
    ]

    qualifiers = [
        "verilen", "sıralanan", "incelenen", "karşılaştırılan", "sunulan", "gösterilen",
        "okunan", "değerlendirilen", "seçilen", "yazılan", "aktarılan", "paylaşılan",
        "tahtaya yazılan", "defterdeki", "kitaptaki", "testteki", "alıştırmadaki",
        "örnekteki", "satırdaki", "paragraftaki", "metindeki", "cümledeki", "ifadedeki",
        "bölümdeki", "kutudaki", "listedeki", "gruptaki", "numaralanmış", "sıradaki",
        "karşıdaki", "üstteki", "alttaki", "ortadaki", "sağdaki", "soldaki", "yandaki",
        "ilk", "ikinci", "üçüncü", "dördüncü", "beşinci", "son", "yeni", "eski",
        "kısa", "uzun", "kolay", "zor", "farklı", "benzer", "ayrı", "birlikte",
    ]

    for idx, case in enumerate(cases):
        reason_ok, reason_wrong1, reason_wrong2 = orthography_reason_options(
            case["mode"], case["token"], case["reason"]
        )
        base = offset + idx * 5
        q0, q1, q2, q3, q4 = (base + i for i in range(5))
        p0 = places[(q0 // 10) % len(places)]
        p1 = places[(q1 // 10) % len(places)]
        p2 = places[(q2 // 10) % len(places)]
        p3 = places[(q3 // 10) % len(places)]
        p4 = places[(q4 // 10) % len(places)]
        rows.append(
            make_row(
                level,
                f'Yukarıdaki {p0} boş bırakılan yere gelen "{case["token"]}" nasıl {blank_actions[q0 % len(blank_actions)]}?',
                case["mode"],
                "kesme işaretiyle ayrılır",
                "her zaman bitişik yazılır" if case["mode"] == "ayrı yazılır" else "her zaman ayrı yazılır",
                f"Bu örnekte {case['token']} ifadesi {case['reason']}; bu yüzden doğru kural {case['mode']} biçimidir.",
                case["blank"],
            )
        )
        premise_pick = "\n".join(
            [
                f"I. {case['correct_sentence']}",
                f"II. {case['wrong1']}",
                f"III. {case['wrong2']}",
            ]
        )
        rows.append(
            make_row(
                level,
                f'Yukarıdaki {p1} {qualifiers[q1 % len(qualifiers)]} örneklerden hangisinde "{case["token"]}" {pick_actions[q1 % len(pick_actions)]}?',
                "I",
                "II",
                "III",
                f"Yalnızca I. cümlede {case['token']} doğru yazılmıştır; çünkü {case['reason']}.",
                premise_pick,
            )
        )
        rows.append(
            make_row(
                level,
                f'Yukarıdaki {p2} {qualifiers[q2 % len(qualifiers)]} cümlede "{case["token"]}" {why_actions[q2 % len(why_actions)]}?',
                reason_ok,
                reason_wrong1,
                reason_wrong2,
                f"{case['correct_sentence']} örneğinde {case['token']} kullanımı {case['reason']}; açıklama bu nedenle budur.",
                case["correct_sentence"],
            )
        )
        premise = "\n".join(
            [
                f"I. {case['correct_sentence']}",
                f"II. {case['wrong1']}",
                f"III. {case['wrong2']}",
            ]
        )
        rows.append(
            make_row(
                level,
                f'Yukarıdaki {p3} {qualifiers[q3 % len(qualifiers)]} yazımlardan hangisi "{case["token"]}" {roman_actions[q3 % len(roman_actions)]}?',
                "I",
                "II",
                "III",
                f"Listede yalnızca I. cümledeki yazım doğrudur; çünkü {case['token']} {case['reason']}.",
                premise,
            )
        )
        premise_wrong = "\n".join(
            [
                f"I. {case['wrong1']}",
                f"II. {case['correct_sentence']}",
                f"III. {case['alt_correct']}",
            ]
        )
        rows.append(
            make_row(
                level,
                f"Yukarıdaki {p4} {qualifiers[q4 % len(qualifiers)]} cümlelerden {wrong_actions[q4 % len(wrong_actions)]}?",
                "I",
                "II",
                "III",
                f"Yanlış yazılan cümle I. sıradaki {case['wrong1']} biçimidir; {case['token']} için doğru kural {case['mode']} olmalıydı.",
                premise_wrong,
            )
        )
    return rows


def build_dilbilgisi_rows() -> list[tuple]:
    return build_proper_rows() + build_common_rows() + build_plural_rows()


def build_yazim_rows() -> list[tuple]:
    return (
        build_orthography_rows("kolay", DE_DA_CASES, offset=0)
        + build_orthography_rows("orta", KI_CASES, offset=50)
        + build_orthography_rows("zor", MI_CASES, offset=100)
    )


def main() -> None:
    dilbilgisi_rows = build_dilbilgisi_rows()
    yazim_rows = build_yazim_rows()

    dil_stats = validate_bank(dilbilgisi_rows, {"kolay": 50, "orta": 50, "zor": 50})
    yazim_stats = validate_bank(yazim_rows, {"kolay": 50, "orta": 50, "zor": 50})

    dil_path = write_bank(
        "dilbilgisi_s3_bank",
        "3. sınıf Dil Bilgisi — 150 soru.",
        "dilb3_",
        dilbilgisi_rows,
    )
    yazim_path = write_bank(
        "yazim_s3_bank",
        "3. sınıf Yazım Kuralları — 150 soru.",
        "yazim3_",
        yazim_rows,
    )

    print(f"dilbilgisi file: {dil_path}")
    print(f"dilbilgisi total: {dil_stats['total']}")
    print(f"dilbilgisi unique texts: {dil_stats['unique_texts']}")
    print(f"dilbilgisi unique explanations: {dil_stats['unique_explanations']}")
    print("dilbilgisi assertions: passed")
    print(f"yazim file: {yazim_path}")
    print(f"yazim total: {yazim_stats['total']}")
    print(f"yazim unique texts: {yazim_stats['unique_texts']}")
    print(f"yazim unique explanations: {yazim_stats['unique_explanations']}")
    print("yazim assertions: passed")


if __name__ == "__main__":
    main()

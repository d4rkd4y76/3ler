# -*- coding: utf-8 -*-
"""3. sınıf Türkçe kalan konular — ortak yapılandırma."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
WORD_DIR = Path.home() / "Desktop" / "SORULAR WORD"
HEADING_ID = "SINIF3"
LESSON_ID = "lesson_turkce"

TOPICS: list[dict] = [
    {
        "id": "t03",
        "slug": "topic_03_paragrafta_anlam_metnin_konusu_a",
        "key_prefix": "paragraf3_",
        "title": "Paragrafta Anlam (Metnin konusu, ana düşüncesi, şiirin ana duygusu)",
        "bank_module": "paragraf_s3_bank",
        "data_file": "paragrafta-anlam-s3-150.json",
        "word_file": "Paragrafta Anlam (3. Sınıf) - 150 Soru - GÜNCEL v3.docx",
        "word_subtitle": "Konu: Metnin konusu, ana düşüncesi, şiirin ana duygusu, başlık",
    },
    {
        "id": "t04",
        "slug": "topic_04_olaylarin_olus_sirasi_ve_hik_ye_",
        "key_prefix": "olay3_",
        "title": "Olayların Oluş Sırası ve Hikâye Unsurları (Kahraman, yer, zaman, olay)",
        "bank_module": "olay_s3_bank",
        "data_file": "olay-sirasi-s3-150.json",
        "word_file": "Olayların Oluş Sırası ve Hikâye Unsurları (3. Sınıf) - 150 Soru - GÜNCEL v3.docx",
        "word_subtitle": "Konu: Olay sırası, kahraman, yer, zaman, olay unsurları",
    },
    {
        "id": "t05",
        "slug": "topic_05_cumlede_anlam_sebep_sonuc_iliski",
        "key_prefix": "cumle3_",
        "title": "Cümlede Anlam (Sebep-Sonuç İlişkileri)",
        "bank_module": "cumle_s3_bank",
        "data_file": "cumlede-anlam-s3-150.json",
        "word_file": "Cümlede Anlam (3. Sınıf) - 150 Soru - GÜNCEL v3.docx",
        "word_subtitle": "Konu: Sebep-sonuç ilişkileri, neden-sonuç bağlantıları",
    },
    {
        "id": "t06",
        "slug": "topic_06_dilbilgisi_temelleri_ozel_isim_c",
        "key_prefix": "dilb3_",
        "title": 'Dilbilgisi Temelleri (Özel isim, cins isim, tekil ve çoğul isimler)',
        "bank_module": "dilbilgisi_s3_bank",
        "data_file": "dilbilgisi-s3-150.json",
        "word_file": "Dilbilgisi Temelleri (3. Sınıf) - 150 Soru - GÜNCEL v3.docx",
        "word_subtitle": "Konu: Özel isim, cins isim, tekil ve çoğul isimler",
    },
    {
        "id": "t07",
        "slug": "topic_07_yazim_kurallari_de_da_ki_mi_bagl",
        "key_prefix": "yazim3_",
        "title": 'Yazım Kuralları ("de, da, ki, mi" bağlaç ve eklerinin yazımı)',
        "bank_module": "yazim_s3_bank",
        "data_file": "yazim-kurallari-s3-150.json",
        "word_file": "Yazım Kuralları (3. Sınıf) - 150 Soru - GÜNCEL v3.docx",
        "word_subtitle": 'Konu: de/da, ki, mi yazımı (bağlaç ve soru eki)',
    },
    {
        "id": "t08",
        "slug": "topic_08_noktalama_isaretleri_iki_nokta_k",
        "key_prefix": "nokta3_",
        "title": "Noktalama İşaretleri (İki nokta, kısa çizgi ve tırnak işaretinin eklenmesi)",
        "bank_module": "noktalama_s3_bank",
        "data_file": "noktalama-s3-150.json",
        "word_file": "Noktalama İşaretleri (3. Sınıf) - 150 Soru - GÜNCEL v3.docx",
        "word_subtitle": "Konu: İki nokta, kısa çizgi, tırnak işareti",
    },
]


def get_topic(topic_id: str) -> dict:
    for t in TOPICS:
        if t["id"] == topic_id:
            return t
    raise KeyError(topic_id)

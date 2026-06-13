#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Zaman Ölçme ham sorularını düzeltir ve 30 yeni soru ekler."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "zaman-gemini-raw.json"

RAW_FIXES: dict[str, dict] = {
    "zaman3_035": {
        "text": "Analog saatte peş peşe gelen iki sayı arası, 1 ile 2 arası gibi, kaç dakikadır?",
    },
    "zaman3_040": {
        "text": "Yukarıdaki saatte yelkovan tam 10 rakamının üzerindeyken saate kaç var denir?",
        "premise": None,
    },
    "zaman3_020": {
        "explanation": "Yelkovan 6'da iken saat buçuktur. Akrep 4'ü geçmiş ama 5 olmamıştır. Saat 04:30'dur.",
    },
    "zaman3_050": {
        "wrong2": "Gece yarısından hemen önce",
    },
    "zaman3_106": {
        "premise": None,
        "text": "Emre'nin kol saati gerçek saatten 10 dakika ileri. Saati 14:20 gösterirken gerçek saat kaçtır?",
    },
    "zaman3_107": {
        "premise": None,
        "text": "Selin'in kol saati gerçek saatten 15 dakika geri. Saati 09:45 gösterirken gerçek saat kaçtır?",
    },
    "zaman3_109": {
        "premise": None,
        "text": "Teyzem 18:25'te yemek yapmaya başladı. Yemek 1 saat 15 dakika sürdü. Sonra 30 dakika dinlendi. Teyzem dinlenmeyi saat kaçta bitirdi?",
    },
    "zaman3_116": {
        "text": "09:30'da başlayan bir toplantıda her konuşmacı 15 dakika konuştu. Toplam 6 konuşmacı vardı. Toplantı saat kaçta bitti?",
    },
    "zaman3_120": {
        "premise": None,
        "text": "Bir saat kulesindeki çan her yarım saatte bir çalar. Sabah 08:00 ile öğlen 12:00 arasında çan toplam kaç kez çalar? 08:00 ve 12:00 saatleri de sayılır.",
    },
    "zaman3_121": {
        "text": "155 dakika toplam kaç saat kaç dakikaya eşittir?",
        "premise": None,
    },
    "zaman3_123": {
        "explanation": "1. ilaç 09:00'da. 2. ilaç 17:00'de. 3. ilaç 8 saat sonra gece 01:00'de içilir.",
    },
    "zaman3_126": {
        "premise": "Hesaplarken 1 ayı 30 gün say.",
        "text": "1 yıl, 2 ay ve 3 hafta toplam kaç gün eder?",
    },
    "zaman3_129": {
        "premise": None,
    },
}

NEW_QUESTIONS = [
    {
        "id": "zaman3_131",
        "level": "kolay",
        "premise": None,
        "text": "Ayşe okula saat 08:15'te girdi. Derste 35 dakika oturdu. Dersten çıktığında saat kaçtır?",
        "correct": "08:50",
        "wrong1": "08:45",
        "wrong2": "09:00",
        "explanation": "08:15'e 35 dakika eklersek 08:50 olur.",
    },
    {
        "id": "zaman3_132",
        "level": "kolay",
        "premise": None,
        "text": "Okul zili 12:30'da çaldı. Öğle arası 40 dakika sürdü. Dersler saat kaçta yeniden başladı?",
        "correct": "13:10",
        "wrong1": "13:00",
        "wrong2": "12:70",
        "explanation": "12:30'a 40 dakika eklersek 13:10 olur.",
    },
    {
        "id": "zaman3_133",
        "level": "kolay",
        "premise": None,
        "text": "Dedem bize saat 19:00'da geldi. 1 saat kaldı. Dedem saat kaçta ayrıldı?",
        "correct": "20:00",
        "wrong1": "19:30",
        "wrong2": "21:00",
        "explanation": "19:00'a 1 saat eklersek 20:00 olur.",
    },
    {
        "id": "zaman3_134",
        "level": "kolay",
        "premise": None,
        "text": "Zeynep kitap okuma yarışmasında her gün 20 dakika okudu. 5 günde toplam kaç dakika okumuştur?",
        "correct": "100 dakika",
        "wrong1": "80 dakika",
        "wrong2": "120 dakika",
        "explanation": "20 x 5 = 100 dakika eder.",
    },
    {
        "id": "zaman3_135",
        "level": "kolay",
        "premise": None,
        "text": "Sinema filmi saat 15:00'te başladı. Film 1 saat sürdü. Film saat kaçta bitti?",
        "correct": "16:00",
        "wrong1": "15:30",
        "wrong2": "17:00",
        "explanation": "15:00'a 1 saat eklersek 16:00 olur.",
    },
    {
        "id": "zaman3_136",
        "level": "orta",
        "premise": None,
        "text": "Murat 07:40'ta evden çıktı. Okula gitmek 25 dakika sürdü. Murat okula saat kaçta vardı?",
        "correct": "08:05",
        "wrong1": "08:15",
        "wrong2": "07:65",
        "explanation": "07:40'a 25 dakika eklersek 08:05 olur.",
    },
    {
        "id": "zaman3_137",
        "level": "orta",
        "premise": None,
        "text": "Anne keki 16:20'de fırından çıkardı. Kekin soğuması 30 dakika sürdü. Kek saat kaçta soğumuş oldu?",
        "correct": "16:50",
        "wrong1": "16:40",
        "wrong2": "17:00",
        "explanation": "16:20'ye 30 dakika eklersek 16:50 olur.",
    },
    {
        "id": "zaman3_138",
        "level": "orta",
        "premise": None,
        "text": "Futbol antrenmanı 17:00'de başladı. Antrenman 45 dakika sürdü. Antrenman saat kaçta bitti?",
        "correct": "17:45",
        "wrong1": "17:30",
        "wrong2": "18:00",
        "explanation": "17:00'e 45 dakika eklersek 17:45 olur.",
    },
    {
        "id": "zaman3_139",
        "level": "orta",
        "premise": None,
        "text": "Elif her gün 15 dakika piyano çalıyor. 4 günde toplam kaç dakika çalmış olur?",
        "correct": "60 dakika",
        "wrong1": "45 dakika",
        "wrong2": "75 dakika",
        "explanation": "15 x 4 = 60 dakika eder.",
    },
    {
        "id": "zaman3_140",
        "level": "orta",
        "premise": None,
        "text": "Okul servisi 08:05'te hareket etti. Yolculuk 35 dakika sürdü. Servis durakta saat kaçta durdu?",
        "correct": "08:40",
        "wrong1": "08:35",
        "wrong2": "08:45",
        "explanation": "08:05'e 35 dakika eklersek 08:40 olur.",
    },
    {
        "id": "zaman3_141",
        "level": "orta",
        "premise": None,
        "text": "90 dakika kaç saat kaç dakikaya eşittir?",
        "correct": "1 saat 30 dakika",
        "wrong1": "1 saat 20 dakika",
        "wrong2": "2 saat",
        "explanation": "90 dakikanın içinde 60 dakika vardır. Geriye 30 dakika kalır. Sonuç 1 saat 30 dakikadır.",
    },
    {
        "id": "zaman3_142",
        "level": "orta",
        "premise": None,
        "text": "95 dakika kaç saat kaç dakikaya eşittir?",
        "correct": "1 saat 35 dakika",
        "wrong1": "1 saat 25 dakika",
        "wrong2": "2 saat 5 dakika",
        "explanation": "95 - 60 = 35 dakika kalır. Sonuç 1 saat 35 dakikadır.",
    },
    {
        "id": "zaman3_143",
        "level": "orta",
        "premise": None,
        "text": "Saat 11:50 iken 15 dakika sonra saat kaç olur?",
        "correct": "12:05",
        "wrong1": "12:15",
        "wrong2": "11:65",
        "explanation": "50 + 15 = 65 dakika. Bu 1 saat 5 dakikadır. 11:50 + 15 dk = 12:05 olur.",
    },
    {
        "id": "zaman3_144",
        "level": "orta",
        "premise": None,
        "text": "Saat 09:55 iken 10 dakika sonra saat kaç olur?",
        "correct": "10:05",
        "wrong1": "10:15",
        "wrong2": "09:65",
        "explanation": "55 + 10 = 65 dakika. Saat bir ilerler, 10:05 olur.",
    },
    {
        "id": "zaman3_145",
        "level": "zor",
        "premise": None,
        "text": "Saat 16:35 iken 40 dakika sonra saat kaç olur?",
        "correct": "17:15",
        "wrong1": "16:75",
        "wrong2": "17:05",
        "explanation": "35 + 40 = 75 dakika. 75 dakika 1 saat 15 dakikadır. 16:35 + 40 dk = 17:15 olur.",
    },
    {
        "id": "zaman3_146",
        "level": "zor",
        "premise": None,
        "text": "Saat 07:25 iken 50 dakika sonra saat kaç olur?",
        "correct": "08:15",
        "wrong1": "07:75",
        "wrong2": "08:05",
        "explanation": "25 + 50 = 75 dakika. 75 dakika 1 saat 15 dakikadır. 07:25 + 50 dk = 08:15 olur.",
    },
    {
        "id": "zaman3_147",
        "level": "zor",
        "premise": None,
        "text": "Saat 13:10 iken 55 dakika önce saat kaçtı?",
        "correct": "12:15",
        "wrong1": "12:25",
        "wrong2": "13:55",
        "explanation": "10 dakikadan 55 dakika çıkmaz. 1 saat alırız. 70 - 55 = 15 dakika kalır. Saat 12:15 olur.",
    },
    {
        "id": "zaman3_148",
        "level": "zor",
        "premise": None,
        "text": "Saat 10:05 iken 35 dakika önce saat kaçtı?",
        "correct": "09:30",
        "wrong1": "09:40",
        "wrong2": "09:25",
        "explanation": "5 dakikadan 35 dakika çıkmaz. 1 saat alırız. 65 - 35 = 30 dakika kalır. Saat 09:30 olur.",
    },
    {
        "id": "zaman3_149",
        "level": "zor",
        "premise": None,
        "text": "Can 18:00'de ders çalışmaya başladı. 45 dakika çalıştı, 10 dakika mola verdi, sonra 35 dakika daha çalıştı. Can en son saat kaçta çalışmayı bitirdi?",
        "correct": "19:30",
        "wrong1": "19:20",
        "wrong2": "19:00",
        "explanation": "Toplam süre 45 + 10 + 35 = 90 dakikadır. 90 dakika 1 saat 30 dakikadır. 18:00 + 1 saat 30 dk = 19:30 olur.",
    },
    {
        "id": "zaman3_150",
        "level": "zor",
        "premise": None,
        "text": "Okul gezisi 09:00'da başladı. 1 saat müze gezildi, 20 dakika yemek molası verildi, 50 dakika park gezildi. Gezi saat kaçta bitti?",
        "correct": "11:10",
        "wrong1": "11:00",
        "wrong2": "10:50",
        "explanation": "Toplam süre 1 saat + 20 dk + 50 dk = 2 saat 10 dakikadır. 09:00 + 2 saat 10 dk = 11:10 olur.",
    },
    {
        "id": "zaman3_151",
        "level": "kolay",
        "premise": None,
        "text": "Yelkovan 8 rakamının üzerindeyken saat kaç geçiyor demektir?",
        "correct": "40 geçiyor",
        "wrong1": "8 geçiyor",
        "wrong2": "35 geçiyor",
        "explanation": "8 rakamı 8 x 5 = 40 dakikayı gösterir.",
    },
    {
        "id": "zaman3_152",
        "level": "kolay",
        "premise": None,
        "text": "Yelkovan 7 rakamının üzerindeyken saate kaç var denir?",
        "correct": "25 var",
        "wrong1": "35 var",
        "wrong2": "20 var",
        "explanation": "7'den 12'ye 5 tane 5 dakikalık dilim kalır. 5 x 5 = 25 var denir.",
    },
    {
        "id": "zaman3_153",
        "level": "orta",
        "premise": None,
        "text": "Yukarıdaki saatte akrep tam 5'i, yelkovan 6'yı gösteriyorsa saat kaçtır?",
        "correct": "05:30",
        "wrong1": "06:30",
        "wrong2": "05:06",
        "explanation": "Akrep 5'te, yelkovan 6'da ise saat buçuktur. Sonuç 05:30'dur.",
    },
    {
        "id": "zaman3_154",
        "level": "orta",
        "premise": None,
        "text": "Yukarıdaki saatte akrep 9 ile 10 arasında, yelkovan 3'ü gösteriyorsa saat kaçtır?",
        "correct": "09:15",
        "wrong1": "10:15",
        "wrong2": "09:03",
        "explanation": "Yelkovan 3'te ise 15 dakika geçmiştir. Akrep 9'u geçmiş ama 10 olmamıştır. Saat 09:15'tir.",
    },
    {
        "id": "zaman3_155",
        "level": "orta",
        "premise": None,
        "text": "Yukarıdaki dijital saat 09:05'i gösteriyor. Bu saat günlük konuşmada nasıl okunur?",
        "correct": "Sabah 9'u 5 geçiyor",
        "wrong1": "Sabah 9'a 5 var",
        "wrong2": "Akşam 9'u 5 geçiyor",
        "explanation": "09:05 sabah saatidir. 5 dakika geçtiği için '9'u 5 geçiyor' denir.",
    },
    {
        "id": "zaman3_156",
        "level": "orta",
        "premise": None,
        "text": "Yukarıdaki dijital saat 18:45'i gösteriyor. Bu saat günlük konuşmada nasıl okunur?",
        "correct": "Akşam 7'ye çeyrek var",
        "wrong1": "Akşam 6'yı çeyrek geçiyor",
        "wrong2": "Akşam 8'e çeyrek var",
        "explanation": "18:45 akşam saat 6'yı 45 geçiyor demektir. Bir sonraki saate 15 dakika kaldığı için '7'ye çeyrek var' denir.",
    },
    {
        "id": "zaman3_157",
        "level": "zor",
        "premise": None,
        "text": "Berfin 14:25'te yürüyüşe çıktı. 1 saat 5 dakika yürüdü. Yürüyüş saat kaçta bitti?",
        "correct": "15:30",
        "wrong1": "15:25",
        "wrong2": "15:20",
        "explanation": "14:25 + 1 saat = 15:25. Üzerine 5 dakika eklersek 15:30 olur.",
    },
    {
        "id": "zaman3_158",
        "level": "zor",
        "premise": None,
        "text": "Otobüs 11:40'ta hareket etti. Yolculuk 2 saat 15 dakika sürdü. Otobüs varış yerine saat kaçta ulaştı?",
        "correct": "13:55",
        "wrong1": "13:45",
        "wrong2": "14:05",
        "explanation": "11:40 + 2 saat = 13:40. Üzerine 15 dakika eklersek 13:55 olur.",
    },
    {
        "id": "zaman3_159",
        "level": "zor",
        "premise": None,
        "text": "Ödev 20:10'da bitti. Ödev 55 dakika sürmüştü. Ödev saat kaçta başlamıştı?",
        "correct": "19:15",
        "wrong1": "19:25",
        "wrong2": "19:05",
        "explanation": "20:10'dan 55 dakika geriye gidersek 19:15 olur.",
    },
    {
        "id": "zaman3_160",
        "level": "zor",
        "premise": None,
        "text": "Hastane randevusu 08:45'te. Randevuya 30 dakika kala yola çıkıldı. Yolculuk 25 dakika sürdü. Kişi randevuya zamanında yetişmiş midir?",
        "correct": "Evet, 5 dakika erken varmıştır",
        "wrong1": "Hayır, 5 dakika geç kalmıştır",
        "wrong2": "Tam randevu saatinde varmıştır",
        "explanation": "30 dakika kala yola çıkılırsa 08:15'te yola çıkılır. 25 dakika yolculuk sonrası 08:40'ta varılır. Randevuya 5 dakika erken yetişilir.",
    },
]


def main() -> int:
    items = json.loads(RAW.read_text(encoding="utf-8"))
    for q in items:
        fix = RAW_FIXES.get(q["id"])
        if fix:
            q.update(fix)
    existing = {q["id"] for q in items}
    for q in NEW_QUESTIONS:
        if q["id"] not in existing:
            items.append(q)
    RAW.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK: {len(items)} soru -> {RAW}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

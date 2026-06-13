#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Zaman Ölçme: saat görselleri, yeşil yay açıklamaları, Türkçe düzeltmeler."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "zaman-gemini-raw.json"
OUT_PATH = ROOT / "data" / "zaman-olcme-s3-160.json"

# Sadece saat okuma sorularında öncülde görsel
READ_CLOCK_PREMISE: dict[str, tuple[str, int, int]] = {
    "mat3_zaman_015": ("a", 3, 0),
    "mat3_zaman_016": ("a", 3, 30),
    "mat3_zaman_017": ("a", 3, 15),
    "mat3_zaman_018": ("a", 11, 45),
    "mat3_zaman_019": ("a", 8, 0),
    "mat3_zaman_020": ("a", 4, 30),
    "mat3_zaman_036": ("a", 3, 5),
    "mat3_zaman_037": ("a", 3, 10),
    "mat3_zaman_038": ("a", 4, 20),
    "mat3_zaman_039": ("a", 6, 25),
    "mat3_zaman_040": ("a", 11, 50),
    "mat3_zaman_041": ("a", 1, 0),
    "mat3_zaman_042": ("a", 4, 0),
    "mat3_zaman_043": ("a", 7, 0),
    "mat3_zaman_044": ("a", 9, 0),
    "mat3_zaman_045": ("a", 11, 0),
    "mat3_zaman_046": ("d", 14, 0),
    "mat3_zaman_047": ("d", 17, 30),
    "mat3_zaman_048": ("d", 20, 15),
    "mat3_zaman_049": ("d", 19, 45),
    "mat3_zaman_050": ("d", 0, 0),
    "mat3_zaman_153": ("a", 5, 30),
    "mat3_zaman_154": ("a", 9, 15),
    "mat3_zaman_155": ("d", 9, 5),
    "mat3_zaman_156": ("d", 18, 45),
}

# Açıklamada yeşil yaylı analog saat: (saat, dk, yay başlangıç rakamı, yay bitiş rakamı)
EXPL_ARC: dict[str, tuple[int, int, int, int]] = {
    "mat3_zaman_016": (3, 30, 12, 6),
    "mat3_zaman_017": (3, 15, 12, 3),
    "mat3_zaman_018": (11, 45, 9, 12),
    "mat3_zaman_036": (3, 5, 12, 1),
    "mat3_zaman_037": (3, 10, 12, 2),
    "mat3_zaman_038": (4, 20, 12, 4),
    "mat3_zaman_039": (6, 25, 12, 5),
    "mat3_zaman_040": (11, 50, 10, 12),
    "mat3_zaman_151": (4, 40, 12, 8),
    "mat3_zaman_152": (6, 35, 7, 12),
}

OPTION_PLAIN: dict[str, dict[str, str]] = {
    "mat3_zaman_019": {"correct": "08:00", "wrong1": "12:40", "wrong2": "08:30"},
    "mat3_zaman_020": {"correct": "04:30", "wrong1": "05:30", "wrong2": "04:15"},
    "mat3_zaman_041": {"correct": "13:00", "wrong1": "01:00", "wrong2": "11:00"},
    "mat3_zaman_042": {"correct": "16:00", "wrong1": "14:00", "wrong2": "04:00"},
    "mat3_zaman_043": {"correct": "19:00", "wrong1": "07:00", "wrong2": "17:00"},
    "mat3_zaman_044": {"correct": "21:00", "wrong1": "19:00", "wrong2": "22:00"},
    "mat3_zaman_045": {"correct": "23:00", "wrong1": "11:00", "wrong2": "21:00"},
    "mat3_zaman_050": {"correct": "00:00", "wrong1": "12:00", "wrong2": "Gece yarısından hemen önce"},
    "mat3_zaman_071": {"correct": "15:50", "wrong1": "16:10", "wrong2": "15:40"},
    "mat3_zaman_091": {"correct": "11:15", "wrong1": "10:75", "wrong2": "11:05"},
    "mat3_zaman_131": {"correct": "08:50", "wrong1": "08:45", "wrong2": "09:00"},
    "mat3_zaman_145": {"correct": "17:15", "wrong1": "17:05", "wrong2": "16:75"},
    "mat3_zaman_146": {"correct": "08:15", "wrong1": "08:05", "wrong2": "07:75"},
}

QUESTION_TEXT: dict[str, str] = {
    "mat3_zaman_015": "Analog saatte yelkovan tam 12 rakamının üzerindeyse saat nasıl okunur?",
    "mat3_zaman_016": "Analog saatte yelkovan 6 rakamının üzerindeyse saat nasıl okunur?",
    "mat3_zaman_017": "Analog saatte yelkovan 3 rakamının üzerindeyse saat nasıl okunur?",
    "mat3_zaman_018": "Analog saatte yelkovan 9 rakamının üzerindeyse saat nasıl okunur?",
    "mat3_zaman_019": "Akrep 8'in üzerinde ve yelkovan 12'nin üzerindeyse saat kaçtır?",
    "mat3_zaman_020": "Akrep 4 ile 5 arasında ve yelkovan 6'nın üzerindeyse saat kaçtır?",
    "mat3_zaman_036": "Yelkovan tam 1 rakamının üzerindeyken saat kaç geçiyordur?",
    "mat3_zaman_037": "Yelkovan tam 2 rakamının üzerindeyken saat kaç geçiyordur?",
    "mat3_zaman_038": "Yelkovan tam 4 rakamının üzerindeyken saat kaç geçiyordur?",
    "mat3_zaman_039": "Yelkovan tam 5 rakamının üzerindeyken saat kaç geçiyordur?",
    "mat3_zaman_040": "Yelkovan tam 10 rakamının üzerindeyken saate kaç var denir?",
    "mat3_zaman_046": "Dijital saatte 14:00 günlük konuşmada nasıl okunur?",
    "mat3_zaman_047": "Dijital saatte 17:30 günlük konuşmada nasıl okunur?",
    "mat3_zaman_048": "Dijital saatte 20:15 günlük konuşmada nasıl okunur?",
    "mat3_zaman_049": "Dijital saatte 19:45 günlük konuşmada nasıl okunur?",
    "mat3_zaman_153": "Akrep tam 5'i, yelkovan 6'yı gösteriyorsa saat kaçtır?",
    "mat3_zaman_154": "Akrep 9 ile 10 arasında, yelkovan 3'ü gösteriyorsa saat kaçtır?",
    "mat3_zaman_155": "Dijital saat 09:05'i gösteriyor. Bu saat günlük konuşmada nasıl okunur?",
    "mat3_zaman_156": "Dijital saat 18:45'i gösteriyor. Bu saat günlük konuşmada nasıl okunur?",
}

FIXES: dict[str, dict[str, str]] = {
    "mat3_zaman_020": {
        "explanation": "Yelkovan 6'da iken saat buçuktur. Akrep 4'ü geçmiş ama 5 olmamıştır. Saat 04:30'dur.",
    },
    "mat3_zaman_021": {
        "explanation": "1 saat 60 dakikadır. 60 dakikayı 2 kez toplarsak veya 60 ile 2'yi çarparsak 120 dakika ederiz.",
    },
    "mat3_zaman_152": {
        "explanation": "7'den 12'ye 5 tane 5 dakikalık dilim kalır. 5 x 5 = 25 var denir.",
    },
}

HINT_PREFIXES = (
    "Dakikalar toplanırken",
    "Süre çıkarılırken",
    "Gerçek yaşam problemlerinde",
    "Zaman problemleri ardışık",
    "Saatleri ayarlarken",
    "Gece uykusu hesaplanırken",
    "Okul planlamalarında",
    "Mola süreleri",
    "Günler hesaplanırken",
    "Yolculuk süreçlerinde",
    "Çok günlü çalışma",
    "Bozuk saatler",
    "Haftalık rutinlerin",
    "Süreçlerin kalan",
    "Farklı zaman birimleriyle",
    "Bitişik olayların",
    "Büyük dakikaları geriye",
    "Gündüz ve gece",
    "Spor müsabakalarında",
    "Zaman dilimleri içindeki",
    "Dakikalar saate çevrilirken",
    "Yarım günler birleştirilerek",
    "Periyodik olaylarda",
    "Uzun süreli işler",
    "Geceye sarkan",
    "Farklı zaman dilimlerini",
    "Vapur gibi",
    "Saatleri dakikaya",
    "Hız ve mesafe",
    "Aylar ve haftalar",
    "Geçen süreyi bulmak",
    "İleri doğru zaman",
    "Geriye doğru zaman",
    "Farklı zaman birimlerini toplarken",
    "Büyük dakikaları saat ve dakikaya",
    "Takvim hesaplamalarında",
    "1 saat 60",
    "1 gün 24",
    "1 hafta 7",
    "1 yıl 12",
    "Matematik problemlerinde 1 ay",
    "Akrep saatleri",
    "Öğleden sonraki",
    "Akşam saatleri",
    "Gece saatleri",
    "Problemlerde hesaplama",
    "Haftanın günleri",
    "Zamanı doğru",
    "Hesaplarken 1 ayı",
    "Buna göre öğleden",
    "Akrep saatleri, yelkovan",
)

PROPER_NAMES = (
    "Emre",
    "Selin",
    "Ayşe",
    "Mehmet",
    "Berfin",
    "Can",
    "Ali",
    "Zeynep",
    "Murat",
    "Elif",
    "Kardeşim",
    "Teyzem",
    "Dedem",
    "Anne",
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma",
    "Cumartesi",
    "Pazar",
)

CLOCK_IN_OPTION_RE = re.compile(
    r"\[\[\s*clock\s*:\s*(?:a|analog|d|digital)?\s*:?\s*(\d{1,2})\s*:\s*(\d{2})\s*\]\]",
    re.I,
)


def normalize_id(qid: str) -> str:
    qid = (qid or "").strip()
    if qid.startswith("zaman3_"):
        return qid.replace("zaman3_", "mat3_zaman_")
    if qid.startswith("mat3_t09_"):
        return qid.replace("mat3_t09_", "mat3_zaman_")
    return qid


def clock_tag(kind: str, hour: int, minute: int) -> str:
    return f"[[clock:{kind}:{hour}:{minute:02d}]]"


def clockarc_tag(hour: int, minute: int, from_num: int, to_num: int) -> str:
    return f"[[clockarc:{hour}:{minute:02d}:{from_num}:{to_num}]]"


def is_hint_line(line: str) -> bool:
    p = line.strip()
    if not p or "[[clock" in p or "[[clockarc" in p:
        return bool(not p)
    return any(p.startswith(prefix) for prefix in HINT_PREFIXES)


def strip_hint_premise(premise: str | None) -> str | None:
    if not premise:
        return None
    kept = [p.strip() for p in premise.split("\n") if p.strip() and not is_hint_line(p)]
    if not kept:
        return None
    return "\n\n".join(kept)


def clean_parens(text: str) -> str:
    if not text:
        return text
    text = re.sub(r"\s*\(hızlıdır\)", "", text, flags=re.I)
    text = re.sub(r"\s*\(yavaştır\)", "", text, flags=re.I)
    text = re.sub(r"\s*\(Aralarda boşluk yoktur\)", "", text, flags=re.I)
    text = re.sub(r" her yarım saatte \(30 dk\) bir", " her yarım saatte bir", text)
    text = re.sub(r" \(1 ay 30 gün alınacak\)", "", text)
    text = re.sub(r"Selin'nin", "Selin'in", text)
    return text.strip()


def strip_yukaridaki(text: str) -> str:
    text = re.sub(r"^Yukarıdakine göre\s+", "", text, flags=re.I)
    text = re.sub(r"^Yukarıdaki metne göre\s+", "", text, flags=re.I)
    text = re.sub(r"^Yukarıdaki bilgilere göre\s+", "", text, flags=re.I)
    text = re.sub(r"^Yukarıdaki saati incele\.\s*", "", text, flags=re.I)
    text = re.sub(r"^Yukarıdaki dijital saati incele\.\s*", "", text, flags=re.I)
    text = re.sub(r"^Yukarıdaki saate bak\.\s*", "", text, flags=re.I)
    text = re.sub(r"^Buna göre\s+", "", text, flags=re.I)
    return text.strip()


def fix_proper_names(text: str) -> str:
    for name in PROPER_NAMES:
        text = re.sub(rf"(?<![A-Za-zÇĞİÖŞÜçğıöşü]){name.lower()}(?=')", name, text, flags=re.I)
        text = re.sub(rf"\b{name.lower()}\b", name, text, flags=re.I)
    return text


def capitalize_tr(text: str) -> str:
    text = (text or "").strip()
    if not text:
        return text
    text = fix_proper_names(text)
    if text[0].islower():
        text = text[0].upper() + text[1:]
    return text


def plain_option(value: str) -> str:
    m = CLOCK_IN_OPTION_RE.search(value or "")
    if m:
        return f"{int(m.group(1)):02d}:{int(m.group(2)):02d}"
    return value


def polish_fields(q: dict) -> None:
    qid = q["id"]

    for key in ("text", "correct", "wrong1", "wrong2", "explanation", "premise"):
        if q.get(key):
            q[key] = clean_parens(str(q[key]))

    if qid in OPTION_PLAIN:
        q.update(OPTION_PLAIN[qid])
    for key in ("correct", "wrong1", "wrong2"):
        if q.get(key):
            q[key] = plain_option(str(q[key]))

    text = strip_yukaridaki(q.get("text") or "")
    if qid in QUESTION_TEXT:
        text = QUESTION_TEXT[qid]
    q["text"] = capitalize_tr(text)

    if q.get("explanation"):
        q["explanation"] = capitalize_tr(strip_yukaridaki(str(q["explanation"])))

    q["premise"] = strip_hint_premise(q.get("premise"))


def patch_question(q: dict) -> dict:
    q = dict(q)
    q["id"] = normalize_id(q.get("id", ""))
    qid = q["id"]

    if qid in FIXES:
        q.update(FIXES[qid])

    if qid in READ_CLOCK_PREMISE:
        kind, hour, minute = READ_CLOCK_PREMISE[qid]
        q["premise"] = clock_tag(kind, hour, minute)
    else:
        q["premise"] = None

    expl = (q.get("explanation") or "").strip()
    if qid in EXPL_ARC and expl:
        h, m, fnum, tnum = EXPL_ARC[qid]
        arc = clockarc_tag(h, m, fnum, tnum)
        if arc not in expl:
            q["explanation"] = f"{expl}\n\n{arc}"

    polish_fields(q)
    return q


def load_raw() -> list[dict]:
    data = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    if isinstance(data, dict) and "questions" in data:
        items = data["questions"]
    elif isinstance(data, list):
        items = data
    else:
        raise ValueError("Beklenen JSON: liste veya {questions: [...]}")
    for q in items:
        q["id"] = normalize_id(q.get("id", ""))
    return items


def main() -> int:
    if not RAW_PATH.is_file():
        raise SystemExit(f"Dosya yok: {RAW_PATH}")
    out = [patch_question(q) for q in load_raw()]
    from question_build_common import write_json_pack

    write_json_pack(
        out,
        data_path=OUT_PATH,
        topic_id="t09",
        title="Zaman Ölçme (Saat ve dakika ilişkisi, problem çözme)",
        lesson_id_kw="lesson_matematik",
    )
    print(f"OK: {len(out)} soru -> {OUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

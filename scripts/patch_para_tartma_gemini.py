#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Paralarımız + Tartma: para görselleri, terazi, Türkçe düzeltmeler."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "para-tartma-gemini-raw.json"

HINT_PREFIXES = (
    "Para üstü bulurken",
    "Büyük paraları küçük",
    "Bir bütünün yarısını",
    "İndirim miktarını",
    "Ortak ödemelerde",
    "Kar (kazanç) bulmak",
    "1 düzine",
    "Boş kabın ağırlığına",
    "Brüt kütle",
    "Kurutulan meyveler",
    "Yarım kavramı",
    "Çeyrek kavramı",
)

PROPER_NAMES = (
    "Ayşe",
    "Ali",
    "Mert",
    "Selin",
    "Veli",
    "Can",
    "Emre",
    "Mehmet",
    "Türkiye",
    "Türk",
)

# öncülde para görseli — SADECE toplama/hesap soruları (cevap vermeyen)
PREMISE_PARA: dict[str, str] = {
    "mat3_para_tartma_008": "50kr|50kr",
    "mat3_para_tartma_009": "25kr|25kr|25kr|25kr",
    "mat3_para_tartma_010": "10kr|10kr|10kr|10kr|10kr|10kr|10kr|10kr|10kr|10kr",
    "mat3_para_tartma_020": "50TL|100TL|200TL",
    "mat3_para_tartma_021": "5kr|10kr|25kr|50kr|1TL",
    "mat3_para_tartma_024": "10TL|10TL|10TL|5TL",
    "mat3_para_tartma_032": "1TL|1TL|1TL|1TL|50kr|50kr",
    "mat3_para_tartma_036": "20TL|20TL|50TL",
    "mat3_para_tartma_038": "50kr|50kr|50kr",
    "mat3_para_tartma_055": "5TL|5TL|5TL|5TL|5TL",
    "mat3_para_tartma_060": "50kr|50kr|50kr|50kr|50kr|50kr|50kr|50kr|50kr|50kr|50kr|50kr",
    # yeni sorular — görsel destekli toplama
    "mat3_para_tartma_131": "20TL|20TL|10TL|5TL|5TL|5TL",
    "mat3_para_tartma_132": "25kr|25kr|25kr|25kr|25kr|25kr",
    "mat3_para_tartma_137": "10kr|10kr|10kr|10kr|50kr|50kr|50kr|50kr|50kr|50kr",
    "mat3_para_tartma_142": "50kr|50kr|50kr|1TL|1TL|1TL|1TL|1TL",
    "mat3_para_tartma_149": "1TL|1TL|50kr|50kr|50kr|25kr",
}

# öncülde terazi — sadece denge kurulumu cevabı vermeyen
PREMISE_TERAZI: dict[str, str] = {
    "mat3_para_tartma_119": "L:20:R:35",
}

def terazi_tag(spec: str) -> str:
    return f"[[terazi:{spec}]]"

# açıklamada ek görsel
EXPL_EXTRA: dict[str, str] = {
    # bilgi soruları — görseller açıklamada
    "mat3_para_tartma_004": "[[para:200TL]]",
    "mat3_para_tartma_005": "[[para:5TL]]",
    "mat3_para_tartma_006": "[[para:1TL|50kr|25kr|10kr|5kr]]",
    "mat3_para_tartma_008": "[[para:50kr|50kr]]",
    "mat3_para_tartma_013": "[[para:1TL|1TL|1TL]]",
    "mat3_para_tartma_015": "[[para:1TL|1TL|1TL|1TL]]",
    "mat3_para_tartma_017": "[[para:1TL|50kr]]",
    "mat3_para_tartma_019": "[[para:1TL|1TL|1TL|50kr]]",
    "mat3_para_tartma_022": "[[para:1TL|1TL]]",
    "mat3_para_tartma_032": "[[para:1TL|1TL|1TL|1TL|50kr|50kr]]",
    "mat3_para_tartma_038": "[[para:50kr|50kr|50kr]]",
    "mat3_para_tartma_051": "[[para:25kr|25kr|25kr|25kr|25kr|25kr|25kr|25kr]]",
    "mat3_para_tartma_059": "[[para:10kr|10kr|10kr|10kr|10kr|10kr|10kr|10kr|10kr|10kr]]",
    "mat3_para_tartma_060": "[[para:50kr|50kr|50kr|50kr|50kr|50kr|50kr|50kr|50kr|50kr|50kr|50kr]]",
    "mat3_para_tartma_104": "[[terazi:L:2,3:R:5]]",
    "mat3_para_tartma_119": "[[terazi:L:20,15:R:35]]",
    "mat3_para_tartma_071": "1 kg = 1000 g",
    "mat3_para_tartma_086": "1 kg (1000 g) + 500 g = 1500 g",
    "mat3_para_tartma_093": "4 × 250 g = 1000 g = 1 kg",
    # yeni para soruları
    "mat3_para_tartma_131": "[[para:20TL|20TL|10TL|5TL|5TL|5TL]]",
    "mat3_para_tartma_132": "[[para:25kr|25kr|25kr|25kr|25kr|25kr]]",
    "mat3_para_tartma_137": "[[para:10kr|10kr|10kr|10kr|50kr|50kr|50kr|50kr|50kr|50kr]]",
    "mat3_para_tartma_142": "[[para:50kr|50kr|50kr|1TL|1TL|1TL|1TL|1TL]]",
    "mat3_para_tartma_148": "[[para:25kr|25kr|25kr|25kr|25kr|25kr|25kr|25kr]]",
    "mat3_para_tartma_149": "[[para:1TL|1TL|50kr|50kr|50kr|25kr]]",
    # yeni tartma soruları
    "mat3_para_tartma_160": "[[terazi:L:3250:R:1750,1500]]",
    "mat3_para_tartma_168": "[[terazi:L:32,16:R:48]]",
    "mat3_para_tartma_169": "2 yarım kg = 1 kg, 1 çeyrek kg = 250 g",
    "mat3_para_tartma_177": "2 yarım kg = 1 kg, 3 çeyrek kg = 750 g",
    "mat3_para_tartma_178": "Brüt 5800 g − dara 800 g = 5000 g = 5 kg",
}

FIXES: dict[str, dict[str, str]] = {
    "mat3_para_tartma_006": {
        "text": "Kullandığımız en büyük madeni paramız hangisidir?",
        "explanation": "Madeni paralarımız arasında en yüksek değerli olan 1 Türk Lirasıdır.",
    },
    "mat3_para_tartma_004": {
        "explanation": "Günümüzde tedavülde olan en büyük kağıt paramız 200 Türk Lirası'dır.",
    },
    "mat3_para_tartma_005": {
        "explanation": "Kağıt (banknot) paralarımız 5 TL'den başlar. En küçüğü 5 TL'dir.",
    },
    "mat3_para_tartma_023": {
        "premise": None,
        "text": "Kasiyere 50 TL verdim, aldıklarım 35 TL tuttu. Kaç TL para üstü alırım?",
    },
    "mat3_para_tartma_027": {
        "premise": None,
        "text": "20 TL'nin içinde toplam kaç tane 5 TL vardır?",
    },
    "mat3_para_tartma_028": {
        "premise": None,
        "text": "100 TL'nin içinde toplam kaç tane 20 TL vardır?",
    },
    "mat3_para_tartma_031": {
        "premise": None,
        "text": "50 TL paramın yarısını harcadım. Geriye kaç TL param kaldı?",
    },
    "mat3_para_tartma_037": {
        "premise": None,
        "text": "Fiyatı 75 TL olan ayakkabı, indirimle 60 TL oldu. Ayakkabıya kaç TL indirim yapılmıştır?",
    },
    "mat3_para_tartma_042": {
        "premise": None,
        "text": "60 TL'lik hesabı 3 arkadaş eşit olarak paylaştı. Kişi başı kaç TL öderler?",
    },
    "mat3_para_tartma_053": {
        "premise": None,
        "text": "Bakkal amca 15 TL'ye aldığı defteri 20 TL'ye satıyor. Bakkal 5 defter sattığında toplam kaç TL kar elde eder?",
    },
    "mat3_para_tartma_056": {
        "premise": None,
        "text": "Düzinesi 60 TL olan kurşun kalemlerin 1 tanesi kaç TL'dir?",
    },
    "mat3_para_tartma_072": {
        "premise": None,
        "text": "Yarım kilogram kaç grama eşittir?",
    },
    "mat3_para_tartma_073": {
        "premise": None,
        "text": "Çeyrek kilogram kaç grama eşittir?",
    },
    "mat3_para_tartma_097": {
        "premise": None,
        "text": "Boşken 2 kg gelen bir kasa, elma ile doluyken 15 kg geliyor. İçindeki elmalar net kaç kg'dır?",
    },
    "mat3_para_tartma_103": {
        "premise": None,
        "text": "Boşken 300 gram gelen bir kavanoza 600 gram bal konuyor. Dolu kavanozun brüt kütlesi kaç gramdır?",
    },
    "mat3_para_tartma_125": {
        "premise": None,
        "text": "Taze yaş üzüm kurutulduğunda her 1 kilogramda 200 gram fire veriyor. 5 kg yaş üzüm kurutulursa geriye kaç kg kuru üzüm kalır?",
    },
}


def para_tag(spec: str) -> str:
    return f"[[para:{spec}]]"


def strip_yukaridaki(text: str) -> str:
    text = re.sub(r"^Yukarıdakine göre\s+", "", text or "", flags=re.I)
    text = re.sub(r"^Yukarıdaki metne göre\s+", "", text or "", flags=re.I)
    text = re.sub(r"^Yukarıdaki bilgilere göre\s+", "", text, flags=re.I)
    text = re.sub(r"^Buna göre\s+", "", text, flags=re.I)
    return text.strip()


def is_hint_line(line: str) -> bool:
    p = (line or "").strip()
    if not p or "[[para:" in p or "[[terazi:" in p:
        return not p
    return any(p.startswith(prefix) for prefix in HINT_PREFIXES)


def strip_hint_premise(premise: str | None) -> str | None:
    if not premise:
        return None
    kept = [p.strip() for p in premise.split("\n") if p.strip() and not is_hint_line(p)]
    if not kept:
        return None
    return "\n\n".join(kept)


def fix_proper_names(text: str) -> str:
    for name in PROPER_NAMES:
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


def patch_question(q: dict) -> dict:
    q = dict(q)
    qid = q.get("id", "")

    if qid in FIXES:
        q.update(FIXES[qid])

    if qid in PREMISE_PARA:
        q["premise"] = para_tag(PREMISE_PARA[qid])
    elif qid in PREMISE_TERAZI:
        q["premise"] = terazi_tag(PREMISE_TERAZI[qid])
    elif q.get("premise") and not is_hint_line(str(q.get("premise"))):
        q["premise"] = strip_hint_premise(str(q["premise"]))
    else:
        q["premise"] = None

    expl = (q.get("explanation") or "").strip()
    if qid in EXPL_EXTRA and expl:
        extra = EXPL_EXTRA[qid]
        if extra not in expl:
            q["explanation"] = f"{expl}\n\n{extra}"

    for key in ("text", "correct", "wrong1", "wrong2", "explanation"):
        if q.get(key):
            q[key] = capitalize_tr(strip_yukaridaki(str(q[key])))

    return q


def load_raw() -> list[dict]:
    data = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    if isinstance(data, dict) and "questions" in data:
        items = data["questions"]
    elif isinstance(data, list):
        items = data
    else:
        raise ValueError("Beklenen JSON: liste veya {questions: [...]}")
    return items


def question_num(qid: str) -> int:
    m = re.search(r"_(\d+)$", qid or "")
    return int(m.group(1)) if m else 0


def filter_for_topic(topic_id: str, items: list[dict]) -> list[dict]:
    if topic_id == "t10":
        return [
            q
            for q in items
            if question_num(q.get("id", "")) <= 65
            or 131 <= question_num(q.get("id", "")) <= 155
        ]
    if topic_id == "t11":
        return [
            q
            for q in items
            if 66 <= question_num(q.get("id", "")) <= 130
            or 156 <= question_num(q.get("id", "")) <= 180
        ]
    return items

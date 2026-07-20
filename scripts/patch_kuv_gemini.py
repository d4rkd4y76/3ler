# -*- coding: utf-8 -*-
"""Kuvveti Tanıyalım — soru düzeltmeleri ve 3. sınıf açıklamaları."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPLANATIONS_PATH = ROOT / "data" / "kuv-explanations-v2.json"

_EXPLANATIONS: dict[str, str] | None = None
_RAW_STEMS: dict[str, str] | None = None

PREMISE_FIXES: dict[str, str] = {
    "fen3_kuv_048": "Buzdolabı kapaklarının etrafında gizli mıknatıs şeritleri bulunur.",
    "fen3_kuv_101": "Bir kalemtıraş (açacak) ile kurşun kalemimizin ucunu açan bir öğrenci, kalemi yuvanın içinde sürekli sağa çeviriyor.",
    "fen3_kuv_104": "Buzdolabından su içmek için buzdolabının kapağını önce açmalı, suyu aldıktan sonra kapağı kapamalıyız.",
    "fen3_kuv_112": "Gitar veya saz çalan bir müzisyen, enstrümandan ses çıkarmak için tellere parmağıyla vurur veya çeker.",
    "fen3_kuv_116": "Sert cisimlerin yapısını bozmak için yeterli büyüklükte kuvvet gerekir.",
    "fen3_kuv_118": "Kağıt havlu rulosundan bir parça koparmak istiyoruz.",
    "fen3_kuv_138": "Bowling oyununda atılan top lobutlara (hedef şişelere) çarptığında lobutlar devrilip etrafa saçılır.",
}

STEM_FIXES: dict[str, str] = {
    "fen3_kuv_048": "Buzdolabı kapağını açmaya çalıştığımızda biraz zorlanmamızın sebebi nedir?",
    "fen3_kuv_101": "Bu işlem sırasında kalemin hareket türü nedir?",
    "fen3_kuv_104": "Bu iki işlem sırasıyla hangi kuvvetleri barındırır?",
    "fen3_kuv_112": "Müzisyenin tellere uyguladığı bu kuvvet tellerde hangi hareketi yaratır?",
    "fen3_kuv_116": "Buna göre sert cisimlerin yapısını bozmak için aşağıdakilerden hangisi şarttır?",
    "fen3_kuv_118": "Kağıdı koparmak için rulodan hangi kuvveti uygulayarak asılırız?",
    "fen3_kuv_138": "Bu olay kuvvetin hangi etkisiyle açıklanır?",
}

STEM_CAPS: list[tuple[str, str]] = [
    (" KENDİLİĞİNDEN ", " kendiliğinden "),
    (" GEREKLİDİR", " gereklidir"),
    (" DOĞRU ", " doğru "),
    (" YAVAŞLAMA ", " yavaşlama "),
    (" HIZLANMA ", " hızlanma "),
    (" YÖN DEĞİŞTİRME ", " yön değiştirme "),
    (" DÖNME ", " dönme "),
    (" SALLANMA ", " sallanma "),
    (" DOĞRU ÇIKARKEN", " doğru çıkarken"),
    (" DÜŞERKEN", " düşerken"),
    (" EN BÜYÜK ", " en büyük "),
    (" ASLA ", " asla "),
    (" KESİNLİKLE ", " kesinlikle "),
    (" DEĞİLDİR", " değildir"),
    (" ZORLANMAZ", " zorlanmaz"),
    (" YAPILMALIDIR", " yapılmalıdır"),
    (" OLAMAZ", " olamaz"),
    (" HEM ", " hem "),
    (" HANGİ ", " hangi "),
    (" İLK ", " ilk "),
    (" DİREKT ", " doğrudan "),
    (" ALAMAYIZ", " alamayız"),
    (" GİYİLMELİDİR", " giyilmelidir"),
    (" EN İYİ ", " en iyi "),
    (" ŞARTTIR", " şarttır"),
    (" GÜVENLİ ", " güvenli "),
    (" TEHLİKELİ", " tehlikeli"),
    (" ÇOK ", " çok "),
    (" TAMAMEN ", " tamamen "),
    (" BİRDEN ", " birden "),
    (" ANİ ", " ani "),
]


def load_explanations() -> dict[str, str]:
    global _EXPLANATIONS
    if _EXPLANATIONS is None:
        if EXPLANATIONS_PATH.is_file():
            _EXPLANATIONS = json.loads(EXPLANATIONS_PATH.read_text(encoding="utf-8"))
        else:
            _EXPLANATIONS = {}
    return _EXPLANATIONS


def clean_stem_caps(text: str) -> str:
    for old, new in STEM_CAPS:
        text = text.replace(old, new)
    return text


def load_final_stems() -> dict[str, str]:
    global _RAW_STEMS
    if _RAW_STEMS is not None:
        return _RAW_STEMS
    from mat3_question_quality import normalize_stem_prefix

    raw_path = ROOT / "data" / "kuv-gemini-raw.json"
    _RAW_STEMS = {}
    if raw_path.is_file():
        for q in json.loads(raw_path.read_text(encoding="utf-8")):
            qid = q["id"]
            text = STEM_FIXES.get(qid) or clean_stem_caps((q.get("text") or "").strip())
            premise = PREMISE_FIXES.get(qid) or q.get("premise")
            _RAW_STEMS[qid] = normalize_stem_prefix(text, premise)
    return _RAW_STEMS


def fix_caps_in_options(q: dict) -> dict:
    for key in ("text", "correct", "wrong1", "wrong2", "explanation", "premise"):
        val = q.get(key)
        if not val:
            continue
        s = clean_stem_caps(str(val))
        s = re.sub(r"\bOLMAZ\b", "olmaz", s)
        s = re.sub(r"\bOLUR\b", "olur", s)
        q[key] = s
    return q


def enhance_question(q: dict) -> dict:
    qid = q.get("id") or ""
    if qid in PREMISE_FIXES:
        q["premise"] = PREMISE_FIXES[qid]
    if qid in STEM_FIXES:
        q["text"] = STEM_FIXES[qid]
    expl = load_explanations().get(qid)
    if expl:
        q["explanation"] = expl
    from patch_mcq_common import apply_mcq_enhancements

    q = apply_mcq_enhancements(q)
    return fix_caps_in_options(q)


def fix_stem_after_finalize(q: dict) -> dict:
    qid = q.get("id") or ""
    stem = load_final_stems().get(qid)
    if stem:
        q["text"] = stem
        q["_stem_locked"] = True
    return q

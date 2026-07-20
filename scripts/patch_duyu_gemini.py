# -*- coding: utf-8 -*-
"""Beş Duyumuz — soru düzeltmeleri ve 3. sınıf açıklamaları."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPLANATIONS_PATH = ROOT / "data" / "duyu-explanations-v2.json"

_EXPLANATIONS: dict[str, str] | None = None

PREMISE_FIXES: dict[str, str] = {
    "fen3_duyu_068": "Odanın bir köşesine parfüm sıkıldığında kısa süre sonra odanın diğer köşesinden de kokusu alınabilir.",
}

STEM_FIXES: dict[str, str] = {
    "fen3_duyu_068": "Kokuların bize kadar ulaşmasını sağlayan nedir?",
}

# finalize_question içindeki de_shout Türkçe İ harfini bozar — ham metinden düzgün kök üret
_RAW_STEMS: dict[str, str] | None = None

STEM_CAPS: list[tuple[str, str]] = [
    ("DİĞER İNSANLARA GÖRE", "diğer insanlara göre"),
    ("HANGİ İKİ", "hangi iki"),
    ("BÜYÜMESİNİN", "büyümesinin"),
    ("İLK MÜDAHALE", "ilk müdahale"),
    ("HANGİ ince", "hangi ince"),
    ("HANGİ durumunu", "hangi durumunu"),
    ("ETKİLERE", "etkilere"),
    ("DIŞINDAKİ", "dışındaki"),
    ("İŞLEMDEN", "işlemden"),
    ("ALAMAYIZ", "alamayız"),
    ("DİREKT", "doğrudan"),
    ("YUTMAMIZDAKİ", "yutmamızdaki"),
    ("EN İYİ", "en iyi"),
    ("GİYİLMELİDİR", "giyilmelidir"),
    ("HANGİ duyuyu", "hangi duyuyu"),
    (" DEĞİLDİR", " değildir"),
    (" ZORLANMAZ", " zorlanmaz"),
    (" ŞARTTIR", " şarttır"),
    ("ASLA KULLANMAMALIYIZ", "asla kullanmamalıyız"),
    (" KORUDUĞUNA", " koruduğuna"),
    (" YAPISINI BOZAR", " yapısını bozar"),
    (" DOĞRU bir", " doğru bir"),
    ("KESİNLİKLE", "kesinlikle"),
    (" EN BÜYÜK ", " en büyük "),
]


def clean_stem_caps(text: str) -> str:
    for old, new in STEM_CAPS:
        text = text.replace(old, new)
    return text


def load_final_stems() -> dict[str, str]:
    global _RAW_STEMS
    if _RAW_STEMS is not None:
        return _RAW_STEMS
    from mat3_question_quality import normalize_stem_prefix

    raw_path = ROOT / "data" / "duyu-gemini-raw.json"
    _RAW_STEMS = {}
    if raw_path.is_file():
        for q in json.loads(raw_path.read_text(encoding="utf-8")):
            text = clean_stem_caps((q.get("text") or "").strip())
            premise = q.get("premise")
            _RAW_STEMS[q["id"]] = normalize_stem_prefix(text, premise)
    return _RAW_STEMS


def fix_stem_after_finalize(q: dict) -> dict:
    qid = q.get("id") or ""
    stem = load_final_stems().get(qid)
    if stem:
        q["text"] = stem
        q["_stem_locked"] = True
    return q


def load_explanations() -> dict[str, str]:
    global _EXPLANATIONS
    if _EXPLANATIONS is None:
        if EXPLANATIONS_PATH.is_file():
            _EXPLANATIONS = json.loads(EXPLANATIONS_PATH.read_text(encoding="utf-8"))
        else:
            _EXPLANATIONS = {}
    return _EXPLANATIONS


def fix_caps_in_options(q: dict) -> dict:
    for key in ("text", "correct", "wrong1", "wrong2", "explanation", "premise"):
        val = q.get(key)
        if not val:
            continue
        s = str(val)
        s = s.replace(" DEĞİLDİR", " değildir")
        s = s.replace(" OLAMAZ", " olamaz")
        s = s.replace(" ASLA ", " asla ")
        s = s.replace(" EN AZ ", " en az ")
        s = s.replace(" EN BÜYÜK ", " en büyük ")
        s = s.replace(" EN ÖNEMLİ ", " en önemli ")
        s = s.replace(" DOĞRU ", " doğru ")
        s = s.replace(" YANLIŞ ", " yanlış ")
        s = s.replace(" KESİNLİKLE ", " kesinlikle ")
        s = s.replace(" ZORLANMAZ", " zorlanmaz")
        s = s.replace(" DİĞER ", " diğer ")
        s = s.replace(" BİRLİKTE ", " birlikte ")
        s = s.replace(" YOĞUN ", " yoğun ")
        s = re.sub(r"\bOLMAZ\b", "olmaz", s)
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

# -*- coding: utf-8 -*-
"""Gezegenimizi Tanıyalım — ham soru düzeltmeleri ve 3. sınıf açıklamaları."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPLANATIONS_PATH = ROOT / "data" / "gezegen-explanations-v2.json"

_EXPLANATIONS: dict[str, str] | None = None


def load_explanations() -> dict[str, str]:
    global _EXPLANATIONS
    if _EXPLANATIONS is None:
        if EXPLANATIONS_PATH.is_file():
            _EXPLANATIONS = json.loads(EXPLANATIONS_PATH.read_text(encoding="utf-8"))
        else:
            _EXPLANATIONS = {}
    return _EXPLANATIONS

# JSON'da çift "text" anahtarı yüzünden kaybolan öncüller
PREMISE_FIXES: dict[str, str] = {
    "fen3_gezegen_102": "Dünya'nın şekli eski zamanlardan beri merak edilmiştir.",
    "fen3_gezegen_106": "Bir pilot, Türkiye'den havalanıp uçağın rotasını hep 'Doğu' olarak belirliyor.",
    "fen3_gezegen_131": "Dünya'nın şekli eski çağlarda bazı hayvanların üzerine benzetilmiştir.",
}

STEM_FIXES: dict[str, str] = {
    "fen3_gezegen_106": "Bu pilot eninde sonunda nereye varır?",
    "fen3_gezegen_102": "Deniz fenerinin önce ışığı sonra kendisi görülür. Bu durum neye işarettir?",
    "fen3_gezegen_131": "Eski inançlara göre depremler neden olurdu?",
}


def fix_caps_in_options(q: dict) -> dict:
    """Şıklardaki gereksiz BÜYÜK harfleri düzelt (DOĞRUDUR vb.)."""
    for key in ("text", "correct", "wrong1", "wrong2", "explanation", "premise"):
        val = q.get(key)
        if not val:
            continue
        s = str(val)
        s = s.replace(" DOĞRUDUR", " doğrudur")
        s = s.replace(" DOĞRUDUR.", " doğrudur.")
        s = s.replace(" DEĞİLDİR", " değildir")
        s = s.replace(" OLAMAZ", " olamaz")
        s = s.replace(" OLAMAZ?", " olamaz?")
        s = s.replace(" GERÇEKLEŞMEZ", " gerçekleşmez")
        s = s.replace(" GERÇEKLEŞMEZ?", " gerçekleşmez?")
        s = s.replace(" GÖZLEMLENEBİLEN", " gözlemlenebilen")
        s = s.replace(" GÖZLEMLENEMEYEN", " gözlemlenemeyen")
        s = s.replace(" İÇME SUYU", " içme suyu")
        s = s.replace(" YUVARLAK", " yuvarlak")
        s = s.replace(" BİLİMSEL DEĞİLDİR", " bilimsel değildir")
        s = s.replace(" SAVUNMAMIŞTIR", " savunmamıştır")
        s = s.replace(" İLGİLİDİR", " ilgilidir")
        s = s.replace(" İMKANSIZDIR", " imkansızdır")
        s = s.replace(" KESİNLİKLE", " kesinlikle")
        s = s.replace(" DIŞTAN İÇE", " dıştan içe")
        s = s.replace(" EN SICAK", " en sıcak")
        s = s.replace(" EN SON", " en son")
        s = s.replace(" EN ÖNEMLİ", " en önemli")
        s = s.replace(" EN FAZLA", " en fazla")
        s = s.replace(" EN İÇ", " en iç")
        s = s.replace(" EN DIŞ", " en dış")
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

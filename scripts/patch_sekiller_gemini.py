#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Geometrik şekil ve cisim soruları: açıklamada etiketli _expl görseli.

Öncül kuralı: Cevabı ele veren şekil/cisim görselleri SORU öncülünde KULLANILMAZ.
Şekil yalnızca açıklamada veya şekil üzerinden doğrudan sorulan (açınım vb.) durumlarda öncülde olabilir.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "geometrik-sekil-cisim-gemini-raw.json"

MARKUP_RE = re.compile(r"\[\[(?:sekil|cisim):[^\]]+\]\]\s*")

# Yalnızca öncülde şekil şart olan sorular (açınım, örüntü dizisi vb.)
PREMISE_VIS: dict[int, str] = {
    118: "cisim:kup",  # küp açınımı — hangi dizilim katlanır
}

EXPL_VIS: dict[int, str] = {
    5: "sekil:cember_vs_daire",
    6: "sekil:cember",
    9: "sekil:kare",
    10: "sekil:ucgen",
    14: "sekil:cember",
    21: "sekil:ucgen",
    23: "sekil:dikdortgen",
    25: "sekil:kare",
    45: "sekil:kare",
    57: "cisim:kup",
    58: "cisim:kare_prizma",
    59: "cisim:ucgen_prizma",
    60: "cisim:silindir",
    61: "sekil:dikdortgen",
    62: "sekil:daire",
    65: "cisim:kup",
    75: "sekil:sekizgen",
    76: "sekil:daire",
    81: "sekil:kare",
    98: "sekil:daire",
    101: "sekil:cember",
    102: "sekil:daire",
    111: "sekil:daire",
    112: "sekil:dikdortgen",
    113: "sekil:kare",
    114: "sekil:kare",
    115: "sekil:daire",
    116: "sekil:dikdortgen",
    117: "cisim:piramit",
    120: "sekil:cember_vs_daire",
    122: "sekil:kare",
    123: "sekil:kare",
    124: "cisim:kare_prizma",
    125: "cisim:silindir",
}

EXPL_HINT: dict[str, str] = {
    "ucgen_expl": "Her **köşede** bir nokta vardır; **3 kenar** birleşince **üçgen** oluşur.",
    "kare_expl": "Etiketlere bak: **4 kenar** eşit, **4 köşe** vardır.",
    "dikdortgen_expl": "**4 köşe** vardır; karşılıklı **kenarlar eşit** uzunluktadır.",
    "daire_expl": "İçi **dolu** yuvarlak bölge; **köşe ve kenar yoktur**.",
    "cember_expl": "Sadece **yuvarlak çizgi**; içi **boş**tur (halka gibi).",
    "cember_vs_daire_expl": "Soldaki **içi boş çember**, sağdaki **içi dolu daire** — fark burada!",
    "besgen_expl": "**5 kenar** ve **5 köşe** vardır; her kenar bir doğru parçasıdır.",
    "altigen_expl": "**6 kenar** ve **6 köşe** vardır; arı petekleri böyledir.",
    "sekizgen_expl": "**8 kenar** ve **8 köşe** vardır; DUR tabelası gibi düzenli bir sekizgendir.",
    "kup_expl": "**6 yüz** (hepsi kare), **8 köşe**, **12 ayrıt** — etiketlere dikkat!",
    "kare_prizma_expl": "Alt-üst **kare** taban; **4 yan yüz** dikdörtgendir.",
    "dikdortgen_prizma_expl": "**6 yüz**ün hepsi dikdörtgen; **8 köşe**, **12 ayrıt**.",
    "ucgen_prizma_expl": "**2 üçgen** taban + **3 dikdörtgen** yan = **5 yüz**, **6 köşe**, **9 ayrıt**.",
    "silindir_expl": "**2 daire** taban + **1 eğri yan**; **köşe ve ayrıt yoktur**.",
    "koni_expl": "Alt **daire** taban, üst **sivri tepe**; **köşe yoktur**.",
    "kure_expl": "Tamamen **yuvarlak**; **1 eğri yüz**, **köşe/ayrıt yok**.",
    "piramit_expl": "Alt **kare** taban, **4 üçgen** yan yüz; tepede **1 sivri köşe** daha.",
}

DETECT_3D: list[tuple[str, str]] = [
    (r"üçgen\s*prizma|ucgen\s*prizma", "ucgen_prizma"),
    (r"dikdörtgenler\s*prizma|dikdortgenler\s*prizma", "dikdortgen_prizma"),
    (r"kare\s*prizma", "kare_prizma"),
    (r"piramit", "piramit"),
    (r"silindir|soba\s*borusu|pil\b|konserve", "silindir"),
    (r"\bkoni\b|külah|şapka|duba", "koni"),
    (r"\bküre\b|\bkure\b|futbol\s*topu|portakal|top\s*şekli", "kure"),
    (r"\bküp\b|\bkup\b|zar\b|zeka\s*küp", "kup"),
]

DETECT_2D: list[tuple[str, str]] = [
    (r"sekizgen|8\s*kenar", "sekizgen"),
    (r"altıgen|altigen|6\s*kenar|arı\s*petek", "altigen"),
    (r"beşgen|besgen|5\s*kenar", "besgen"),
    (r"çember|cember|içi\s*boş.*yuvarlak|halka|yüzük|simit", "cember"),
    (r"\bdaire\b|madeni\s*para|pizza|bisküvi", "daire"),
    (r"üçgen|ucgen", "ucgen"),
    (r"\bkare\b", "kare"),
    (r"dikdörtgen|dikdortgen", "dikdortgen"),
]

TEXT_CAPS_FIXES: list[tuple[str, str]] = [
    ("DİĞERLERİNDEN AZDIR", "diğerlerinden azdır"),
    ("EN FAZLADIR", "en fazladır"),
    ("KÖŞEGENİ YOKTUR", "köşegeni yoktur"),
    ("AYRITI (kenar çizgisi) YOKTUR", "ayrıtı (kenar çizgisi) yoktur"),
    ("KÖŞESİ YOKTUR", "köşesi yoktur"),
    ("YOKTUR", "yoktur"),
    ("HEM DE", "hem de"),
    ("HEM eğri", "hem eğri"),
    ("EN ÖNEMLİ", "en önemli"),
    ("HER İKİ", "her iki"),
    ("SADECE", "sadece"),
]

STEM_PREFIX_RE = re.compile(
    r"^(?:Yukarıdaki metne göre|Yukarıdaki bilgilere göre|Yukarıdakine göre|Yukarıdaki)\s+",
    re.I,
)


def normalize_id(qid: str) -> str:
    qid = (qid or "").strip()
    if qid.startswith("geo3_"):
        n = qid.replace("geo3_", "")
        return f"mat3_sekil_{n}"
    if qid.startswith("mat3_t13_"):
        return qid.replace("mat3_t13_", "mat3_sekil_")
    return qid


def question_num(qid: str) -> int:
    m = re.search(r"_(\d+)$", qid or "")
    return int(m.group(1)) if m else 0


def vis_tag(ns: str, kind: str) -> str:
    return f"[[{ns}:{kind}]]"


def parse_vis(spec: str) -> tuple[str, str]:
    if ":" in spec:
        ns, kind = spec.split(":", 1)
        return ns.strip(), kind.strip()
    return "sekil", spec.strip()


def strip_premise_markup(text: str | None) -> str | None:
    if not text:
        return None
    s = MARKUP_RE.sub("", str(text))
    s = re.sub(r"\n{3,}", "\n\n", s).strip()
    return s or None


def detect_from_blob(blob: str, prefer_3d: bool = False) -> tuple[str, str] | None:
    blob = blob.lower()
    order = DETECT_3D + DETECT_2D if prefer_3d else DETECT_2D + DETECT_3D
    for pat, kind in order:
        if re.search(pat, blob, re.I):
            ns = "cisim" if kind in {
                "kup",
                "kare_prizma",
                "dikdortgen_prizma",
                "ucgen_prizma",
                "silindir",
                "koni",
                "kure",
                "piramit",
            } else "sekil"
            return ns, kind
    return None


def premise_vis(n: int, q: dict) -> str | None:
    """Öncülde şekil yalnızca açık izin listesinde."""
    if n in PREMISE_VIS:
        ns, kind = parse_vis(PREMISE_VIS[n])
        return vis_tag(ns, kind)
    return None


def expl_vis(n: int, q: dict) -> str | None:
    if n in EXPL_VIS:
        ns, kind = parse_vis(EXPL_VIS[n])
        tag = vis_tag(ns, kind if kind.endswith("_expl") else f"{kind}_expl")
        return tag.replace("_expl_expl", "_expl")
    blob = " ".join(filter(None, [q.get("explanation"), q.get("correct"), q.get("text")]))
    hit = detect_from_blob(blob, prefer_3d=n >= 26)
    if hit:
        return vis_tag(hit[0], f"{hit[1]}_expl")
    return None


def expl_hint_for_tag(tag: str) -> str:
    for kind, hint in EXPL_HINT.items():
        if f":{kind}]]" in tag or f":{kind.replace('_expl', '')}_expl]]" in tag:
            return hint
    m = re.search(r"\[\[(?:sekil|cisim):([a-z0-9_]+)\]\]", tag or "")
    if m:
        base = m.group(1).replace("_expl", "")
        return EXPL_HINT.get(
            f"{base}_expl",
            "Şekildeki **etiketlere** dikkat et; her parçanın adını gösterir.",
        )
    return "Şekildeki **etiketlere** dikkat et; her parçanın adını gösterir."


def normalize_stem_prefix(text: str, premise: str | None) -> str:
    """Öncül varsa yalnızca 'Buna göre'; yoksa doğrudan soru kökü."""
    text = (text or "").strip()
    if not text:
        return text

    while True:
        new = STEM_PREFIX_RE.sub("", text).strip()
        new = re.sub(r"^(Buna göre\s+)+", "", new, flags=re.I).strip()
        if new == text:
            break
        text = new

    lower = text.lower()
    if premise and not lower.startswith("buna göre"):
        text = "Buna göre " + text[0].lower() + text[1:]
    return text


def clean_explanation_body(expl: str, expl_tag: str | None) -> str:
    body = (expl or "").strip()
    if expl_tag and expl_tag in body:
        body = re.sub(re.escape(expl_tag) + r"\s*", "", body, count=1).strip()
    body = MARKUP_RE.sub("", body).strip()
    body = re.sub(r"\n{3,}", "\n\n", body)
    return body


def fix_question_wording(q: dict) -> dict:
    """Türkçe yazım ve soru kökü — asla 'Yukarıdaki metne göre' kullanılmaz."""
    text = (q.get("text") or "").strip()
    premise = strip_premise_markup(q.get("premise"))

    for old, new in TEXT_CAPS_FIXES:
        text = text.replace(old, new)

    text = normalize_stem_prefix(text, premise)

    q["text"] = text
    if premise:
        q["premise"] = premise
    elif q.get("premise"):
        q["premise"] = strip_premise_markup(q.get("premise"))
    q["_stem_locked"] = True
    return q


def prepend_markup(text: str | None, tag: str | None) -> str | None:
    if not tag:
        return text
    base = (text or "").strip()
    if MARKUP_RE.search(base):
        return base or None
    if base:
        return f"{tag}\n\n{base}"
    return tag


def fix_duplicate_text(q: dict) -> dict:
    text = (q.get("text") or "").strip()
    premise = (q.get("premise") or "").strip() if q.get("premise") else ""
    if premise and text == premise:
        q["text"] = None
    return q


def enhance_question(q: dict) -> dict:
    q = dict(q)
    q = fix_duplicate_text(q)
    qid = normalize_id(q.get("id", ""))
    q["id"] = qid
    n = question_num(qid)

    prem_tag = premise_vis(n, q)
    q["premise"] = prepend_markup(q.get("premise"), prem_tag)

    expl = (q.get("explanation") or "").strip()
    expl_tag = expl_vis(n, q)
    if expl and expl_tag:
        body = clean_explanation_body(expl, expl_tag)
        q["explanation"] = f"{expl_tag}\n\n{body}" if body else expl_tag
    elif expl:
        q["explanation"] = expl

    return q


def patch_question(q: dict) -> dict:
    return enhance_question(q)


def load_raw() -> list[dict]:
    data = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    if isinstance(data, dict) and "questions" in data:
        items = data["questions"]
    elif isinstance(data, list):
        items = data
    else:
        raise ValueError("Beklenen JSON: liste veya {questions: [...]}")
    return items


def main() -> int:
    if not RAW_PATH.is_file():
        raise SystemExit(f"Dosya yok: {RAW_PATH}")
    out = [enhance_question(q) for q in load_raw()]
    print(f"OK: {len(out)} soru islendi")
    prem = sum(1 for q in out if q.get("premise") and "[[" in str(q.get("premise")))
    print(f"  Oncul gorselli: {prem}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

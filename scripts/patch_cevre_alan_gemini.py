#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Çevre ve Alan (t14): açıklamalarda görsel + işlem etiketleri, metin düzeltmeleri."""
from __future__ import annotations

import copy
import re

MARKUP_RE = re.compile(r"\[\[")

# Öncülde kural/tekrar metni — cevabı ele vermemeli
RULE_PREMISE_OK = True

EXPL_VIS: dict[int, str] = {
    1: "sekil:dikdortgen_expl",
    2: "sekil:kare_expl|kenar",
    3: "sekil:dikdortgen_expl",
    4: "sekil:kare_expl|kenar",
    5: "sekil:kare_expl|kenar",
    6: "sekil:dikdortgen_expl",
    7: "geo:kareli",
    8: "geo:kareli",
    9: "sekil:kare_expl|kenar",
    10: "sekil:ucgen_expl|kenar",
    11: "sekil:kare_expl|kenar",
    12: "sekil:kare_expl|kenar",
    13: "sekil:kare_expl|kenar",
    14: "sekil:kare_expl|kenar",
    15: "sekil:kare_expl|kenar",
    16: "sekil:kare_expl|kenar",
    17: "sekil:kare_expl|kenar",
    18: "sekil:kare_expl|kenar",
    19: "sekil:kare_expl|kenar",
    20: "sekil:kare_expl|kenar",
    21: "sekil:kare_expl|kenar",
    22: "sekil:kare_expl|kenar",
    23: "sekil:kare_expl|kenar",
    24: "sekil:kare_expl|kenar",
    25: "sekil:kare_expl|kenar",
    26: "sekil:kare_expl|kenar",
    27: "sekil:kare_expl|kenar",
    28: "sekil:kare_expl|kenar",
    29: "sekil:kare_expl|kenar",
    30: "sekil:kare_expl|kenar",
    31: "sekil:dikdortgen_expl|kenar",
    32: "sekil:dikdortgen_expl|kenar",
    33: "sekil:dikdortgen_expl|kenar",
    34: "sekil:dikdortgen_expl|kenar",
    35: "sekil:dikdortgen_expl|kenar",
    36: "sekil:dikdortgen_expl|kenar",
    37: "sekil:dikdortgen_expl|kenar",
    38: "sekil:dikdortgen_expl|kenar",
    39: "sekil:dikdortgen_expl|kenar",
    40: "sekil:dikdortgen_expl|kenar",
    51: "sekil:ucgen_expl|kenar",
    52: "sekil:ucgen_expl|kenar",
    53: "sekil:ucgen_expl|kenar",
    54: "sekil:ucgen_expl|kenar",
    55: "sekil:ucgen_expl|kenar",
    56: "sekil:ucgen_expl|kenar",
    57: "sekil:ucgen_expl|kenar",
    58: "sekil:ucgen_expl|kenar",
    59: "sekil:ucgen_expl|kenar",
    60: "sekil:ucgen_expl|kenar",
    61: "sekil:ucgen_expl|kenar",
    62: "sekil:ucgen_expl|kenar",
    63: "sekil:ucgen_expl|kenar",
    64: "sekil:ucgen_expl|kenar",
    65: "sekil:ucgen_expl|kenar",
    66: "sekil:ucgen_expl|kenar",
    67: "sekil:ucgen_expl|kenar",
    68: "sekil:ucgen_expl|kenar",
    69: "sekil:ucgen_expl|kenar",
    70: "sekil:ucgen_expl|kenar",
    81: "geo:kareli",
    82: "geo:kareli",
    83: "sekil:dikdortgen_expl",
    84: "sekil:kare_expl",
    85: "sekil:dikdortgen_expl",
    86: "geo:kareli",
    87: "geo:kareli",
    88: "geo:kareli",
    89: "geo:kareli",
    90: "geo:kareli",
    96: "sekil:kare_expl|kenar",
    97: "sekil:kare_expl|kenar",
    98: "sekil:dikdortgen_expl|kenar",
    99: "sekil:dikdortgen_expl|kenar",
    100: "sekil:ucgen_expl|kenar",
    116: "sekil:dikdortgen_expl|kenar",
    117: "sekil:dikdortgen_expl|kenar",
    118: "sekil:dikdortgen_expl|kenar",
    119: "sekil:dikdortgen_expl|kenar",
    120: "sekil:dikdortgen_expl|kenar",
}

EXPL_HINT: dict[str, str] = {
    "sekil:kare_expl|kenar": (
        "Mavi numaralar **kenarları** gösterir. Çevre bulurken dış kenarların "
        "uzunluklarını toplarız (veya eş kenarlarda kısa yol kullanırız)."
    ),
    "sekil:dikdortgen_expl|kenar": (
        "**a** ve **b** ile işaretli kenarları say: 2 kısa + 2 uzun kenar vardır. "
        "Çevre = (kısa + uzun) × 2 formülüyle bulunur."
    ),
    "sekil:ucgen_expl|kenar": (
        "Üçgenin **3 kenarı** vardır. Çevre için üç kenar uzunluğunu toplarız."
    ),
    "sekil:dikdortgen_expl": (
        "Dikdörtgende **iç bölge** alanı kaplar; kenarlar çevreyi oluşturur."
    ),
    "sekil:dikdortgen_expl|alan": (
        "Şeklin **içini kaplayan bölge** alandır. Boyama, halı serme gibi işlerde alanı hesaplarız."
    ),
    "sekil:kare_expl": (
        "Karenin **4 eşit kenarı** vardır. Alan, içini kaplayan birim karelerle; "
        "çevre, dış kenar uzunluklarıyla bulunur."
    ),
    "geo:kareli": (
        "Kareli kağıtta **içteki tam kareleri sayarak alan**, **dış çizgileri sayarak çevre** bulunur."
    ),
}

TEXT_FIXES: dict[str, str] = {
    "Boya kutusu miktarını hesaplamak için duvarın nesini bulmalıyız?": (
        "Boya kutusu miktarını hesaplamak için duvarın hangi özelliğini bulmalıyız?"
    ),
}

PREMISE_FIXES: dict[str, str] = {
    "Karenin çevresi 4'e bölünerek bir kenarı bulunur.": (
        "Karenin dört kenarı birbirine eşittir. Çevreyi 4'e bölerek bir kenar uzunluğu bulunur."
    ),
    "Eşkenar üçgenin çevresi 3'e bölünerek bir kenarı bulunur.": (
        "Eşkenar üçgenin üç kenarı birbirine eşittir. Çevreyi 3'e bölerek bir kenar uzunluğu bulunur."
    ),
}


def question_num(qid: str) -> int:
    m = re.search(r"_(\d+)$", qid or "")
    return int(m.group(1)) if m else 0


def normalize_id(qid: str) -> str:
    qid = (qid or "").strip()
    return qid.replace("mat3_alan_cevre_", "mat3_cevre_")


def mul_tag(a: int | str, b: int | str) -> str:
    return f"[[mul:{a}×{b}]]"


def div_tag(a: int | str, b: int | str) -> str:
    return f"[[div:{a}÷{b}]]"


def inject_calc_markup(expl: str) -> str:
    """Açıklamadaki basit işlemlere görsel etiket ekle."""
    def repl_mul(m: re.Match) -> str:
        return mul_tag(m.group(1), m.group(2))

    def repl_div(m: re.Match) -> str:
        return div_tag(m.group(1), m.group(2))

    s = expl
    s = re.sub(r"(?<!\[\[mul:)(\d+)\s*[x×]\s*(\d+)(?!\]\])", repl_mul, s)
    s = re.sub(r"(?<!\[\[div:)(\d+)\s*÷\s*(\d+)(?!\]\])", repl_div, s)
    return s


def prepend_visual(expl: str, tag: str) -> str:
    if not tag or tag in expl:
        return expl
    hint = EXPL_HINT.get(tag, "")
    block = f"[[{tag}]]"
    if hint:
        block += f"\n\n{hint}"
    body = (expl or "").strip()
    return f"{block}\n\n{body}" if body else block


def enhance_question(q: dict) -> dict:
    q = copy.deepcopy(q)
    q["id"] = normalize_id(q.get("id", ""))

    if q.get("text") in TEXT_FIXES:
        q["text"] = TEXT_FIXES[q["text"]]

    prem = (q.get("premise") or "").strip() or None
    if prem and prem in PREMISE_FIXES:
        q["premise"] = PREMISE_FIXES[prem]

    n = question_num(q["id"])
    expl = (q.get("explanation") or "").strip()

    vis = EXPL_VIS.get(n)
    if vis and not MARKUP_RE.search(expl[:80] if expl else ""):
        expl = prepend_visual(expl, vis)

    expl = inject_calc_markup(expl)

    q["explanation"] = expl
    return q

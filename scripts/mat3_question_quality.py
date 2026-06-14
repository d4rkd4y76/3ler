#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""3. sınıf Matematik soruları — ortak kalite: öncül, kök, açıklama, yazım."""
from __future__ import annotations

import re

MARKUP_ANY_RE = re.compile(r"\[\[[^\]]+\]\]")
SPOILER_PREMISE_RE = re.compile(
    r"\[\[(?:geo|sekil|cisim|shape|solid|fracbar|frac)[^\]]*\]\]",
    re.I,
)
ALLOWED_PREMISE_RE = re.compile(
    r"\[\[(?:clock|clockarc|para|terazi|add|sub|mul|div|mulsol|divsol|addsol|subsol|stephr|result)(?::[^\]]*)?\]\]",
    re.I,
)

STEM_PREFIX_RE = re.compile(
    r"^(?:Yukarıdaki metne göre|Yukarıdaki bilgilere göre|Yukarıdakine göre|Yukarıdaki)\s+",
    re.I,
)
SHOUT_WORD_RE = re.compile(r"\b[A-ZÇĞİÖŞÜ]{3,}\b")
ROMAN_NUMERAL_RE = re.compile(r"^[IVXLCDM]+$")

CAPS_REPLACEMENTS: list[tuple[str, str]] = [
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
    (" OLMAZ", " olmaz"),
    (" OLUR", " olur"),
    (" DEĞİLDİR", " değildir"),
    (" DEĞİL", " değil"),
    ("TEK sayı", "tek sayı"),
    ("ÇİFT sayı", "çift sayı"),
    (" ADI ", " adı "),
]

FILLER_HINT_PATTERNS = [
    r"^Şekildeki \*\*etiketlere\*\* dikkat et.*$",
    r"^Şekildeki \*\*oklu etiketlere\*\* dikkat et.*$",
    r"^Etiketlere bak:.*$",
    r"^Soldaki .* sağdaki .* — fark burada!$",
    r"^Saatin \*\*kollarına\*\* bak:.*$",
]


def strip_markdown(s: str) -> str:
    return re.sub(r"\*\*(.+?)\*\*", r"\1", s or "")


def de_shout(text: str) -> str:
    if not text:
        return text
    for old, new in CAPS_REPLACEMENTS:
        text = text.replace(old, new)

    def lower_word(m: re.Match) -> str:
        w = m.group(0)
        if ROMAN_NUMERAL_RE.match(w):
            return w
        if w.isupper() and len(w) >= 3:
            return w[0] + w[1:].lower()
        return w

    return SHOUT_WORD_RE.sub(lower_word, text)


def strip_premise_markup(text: str | None) -> str | None:
    if not text:
        return None
    s = str(text).strip()
    s = re.sub(r"\n{3,}", "\n\n", s).strip()
    return s or None


def extract_spoiler_markup(text: str | None) -> tuple[str | None, list[str]]:
    """Öncülden spoiler görselleri ayır; kalan metni döndür."""
    if not text:
        return None, []
    s = str(text).strip()
    removed = SPOILER_PREMISE_RE.findall(s)
    s = SPOILER_PREMISE_RE.sub("", s)
    s = re.sub(r"\n{3,}", "\n\n", s).strip()
    return (s or None), removed


def sanitize_premise(premise: str | None) -> str | None:
    prem, _ = extract_spoiler_markup(premise)
    return prem


def normalize_stem_prefix(text: str, premise: str | None) -> str:
    text = (text or "").strip()
    if not text:
        return text

    while True:
        new = STEM_PREFIX_RE.sub("", text).strip()
        new = re.sub(r"^(Buna göre\s+)+", "", new, flags=re.I).strip()
        if new == text:
            break
        text = new

    text = de_shout(text)

    if premise and premise.strip():
        if not text.lower().startswith("buna göre"):
            text = "Buna göre " + text[0].lower() + text[1:]
    return text


def clean_explanation_text(expl: str) -> str:
    if not expl:
        return expl
    body = expl.strip()
    body = STEM_PREFIX_RE.sub("", body)
    body = re.sub(r"^(Buna göre\s+)+", "", body, flags=re.I).strip()
    body = re.sub(
        r"Yukarıdaki sayının\s+\*\*birler basamağını aşağıya indiririz",
        "Sonraki adımda sayının **birler basamağını aşağıya indiririz",
        body,
        flags=re.I,
    )
    body = de_shout(body)

    lines = []
    for line in body.split("\n"):
        stripped = line.strip()
        if not stripped:
            lines.append("")
            continue
        skip = False
        for pat in FILLER_HINT_PATTERNS:
            if re.match(pat, stripped, re.I):
                skip = True
                break
        if not skip:
            lines.append(line)
    body = "\n".join(lines)
    body = re.sub(r"\n{3,}", "\n\n", body).strip()
    return body


def prepare_question_light(q: dict) -> dict:
    """Ham soru: markdown temizliği, normalize_question öncesi ekleme yok."""
    q = dict(q)
    for key in ("text", "correct", "wrong1", "wrong2"):
        if q.get(key):
            q[key] = strip_markdown(str(q[key])).strip()
    if q.get("explanation"):
        expl = str(q["explanation"]).strip()
        q["explanation"] = expl if "[[" in expl else strip_markdown(expl)
    if q.get("premise"):
        q["premise"] = strip_markdown(str(q["premise"])).strip() or None

    premise = q.get("premise")
    text = (q.get("text") or "").strip() or None
    q["text"] = text

    if premise and not text:
        if str(premise).endswith("?"):
            q["text"] = premise
            q["premise"] = None
    elif premise and text and text == premise:
        q["text"] = None

    return q


def finalize_question(q: dict) -> dict:
    """Tüm konular için son kalite geçişi."""
    q = dict(q)
    premise_raw = q.get("premise")
    prem, removed_tags = extract_spoiler_markup(premise_raw)
    q["premise"] = prem

    if removed_tags:
        expl = (q.get("explanation") or "").strip()
        prefix = [tag for tag in removed_tags if tag not in expl]
        if prefix:
            block = "\n\n".join(prefix)
            q["explanation"] = f"{block}\n\n{expl}".strip() if expl else block

    for key in ("text", "correct", "wrong1", "wrong2", "premise"):
        if q.get(key):
            q[key] = de_shout(str(q[key]).strip())

    if q.get("text"):
        q["text"] = normalize_stem_prefix(q["text"], q.get("premise"))

    if q.get("explanation"):
        q["explanation"] = clean_explanation_text(str(q["explanation"]))

    q["_stem_locked"] = True
    return q

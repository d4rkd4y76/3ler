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
    "ucgen_expl": (
        "Şekilde **yalnızca sorulan parça** gösterilir. Mor numaralar **köşeleri**, "
        "mavi numaralar **kenarları** saymana yardım eder."
    ),
    "kare_expl": (
        "Şekilde **yalnızca sorulan parça** vurgulanır. Numaraları sırayla say."
    ),
    "dikdortgen_expl": (
        "Mor **1-4** köşeleri, mavi **1-4** kenarları gösterir — toplam **4 köşe, 4 kenar**. "
        "**a** ile işaretli üst ve alt kenarlar **eşit**, **b** ile işaretli sağ ve sol kenarlar **eşittir**. "
        "Karşılıklı kenarlar birbirine eşit olur."
    ),
    "daire_expl": (
        "Daire **içi dolu** yuvarlak bir bölgedir. Köşe noktası yoktur, düz kenar da yoktur — "
        "her yer **yuvarlaktır**. Madeni para veya pizza dilimi gibi düşünebilirsin."
    ),
    "cember_expl": (
        "Çember yalnızca **yuvarlak bir çizgidir**; ortası **boştur** (halka, yüzük gibi). "
        "Köşe ve düz kenar yoktur. İçi dolu olan şekle **daire** denir."
    ),
    "cember_vs_daire_expl": (
        "Soldaki **çember**: sadece çizgi, **içi boş**. Sağdaki **daire**: çizginin içi **dolu**. "
        "İkisi de yuvarlaktır ama biri çizgi, diğeri alandır."
    ),
    "besgen_expl": (
        "Mor numaralarla köşeleri 1'den 5'e say — **5 köşe**. Mavi numaralarla kenarları say — **5 kenar**. "
        "Her kenar bir **doğru parçasıdır**; beşgen düzenli bir kapalı şekildir."
    ),
    "altigen_expl": (
        "Köşeleri mor numaralarla 1'den 6'ya say — **6 köşe**. Kenarları mavi numaralarla say — **6 kenar**. "
        "Arı petekleri altıgen şeklindedir."
    ),
    "sekizgen_expl": (
        "Köşeleri mor numaralarla 1'den 8'e say — **8 köşe**. Kenarları mavi numaralarla say — **8 kenar**. "
        "DUR trafik tabelası düzenli bir sekizgendir."
    ),
    "kup_expl": (
        "Cismi parmağınla çevirerek bak. **Koyu çizgiler** kenarlardır (ayrıttır). "
        "Yüzler **kare** şeklindedir. Küpte **6 yüz, 8 köşe, 12 ayrıt** vardır."
    ),
    "kare_prizma_expl": (
        "Alt ve üst yüz **karedir**. Yan taraftaki yüzler **dikdörtgendir**. "
        "**Koyu çizgiler** kenarlardır. Toplam **6 yüz, 8 köşe, 12 ayrıt** vardır."
    ),
    "dikdortgen_prizma_expl": (
        "Tüm yüzler **dikdörtgendir**. Karşılıklı yüzler birbirine **eşittir**. "
        "Süt kutusu veya ayakkabı kutusu gibi düşün. **6 yüz, 8 köşe, 12 ayrıt**."
    ),
    "ucgen_prizma_expl": (
        "İki uçta **üçgen taban** vardır (üst ve alt). Aradaki **3 yan yüz dikdörtgendir**. "
        "**Koyu çizgiler** kenarlardır. Toplam **5 yüz, 6 köşe, 9 ayrıt**."
    ),
    "silindir_expl": (
        "Üstte ve altta **①② daire taban** vardır. Yan kısım **eğri bir yüzeydir**. "
        "Köşe ve ayrıt **yoktur** — konserve kutusu veya pil gibi."
    ),
    "koni_expl": (
        "Altta **daire taban**, üstte **tek bir tepe noktası** vardır. Yan yüz **eğridir**. "
        "Dondurma külahı gibi; köşe yoktur, sadece **1 tepe** vardır."
    ),
    "kure_expl": (
        "Küre tamamen **yuvarlaktır** — futbol topu veya portakal gibi. "
        "Tek **eğri yüz** vardır; **köşe ve ayrıt yoktur**."
    ),
    "piramit_expl": (
        "Altta **kare taban**, yanlarda **üçgen yüzler** vardır. Tepede **1 sivri köşe** daha bulunur. "
        "**Koyu çizgiler** kenarlardır. Toplam **5 yüz, 5 köşe, 8 ayrıt**."
    ),
}

DETECT_3D: list[tuple[str, str]] = [
    (r"üçgen\s*prizma|ucgen\s*prizma", "ucgen_prizma"),
    (r"dikdörtgenler\s*prizma|dikdortgenler\s*prizma", "dikdortgen_prizma"),
    (r"kare\s*prizma", "kare_prizma"),
    (r"piramit", "piramit"),
    (r"silindir|soba\s*borusu|pil\b|konserve", "silindir"),
    (r"\bkoni\b|külah|şapka|duba", "koni"),
    (r"küre|kure|futbol\s*topu|portakal|top\s*şekli", "kure"),
    (r"küp|kup|zar\b|zeka\s*küp", "kup"),
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


def vis_tag(ns: str, kind: str, focus: str | None = None) -> str:
    base = kind if kind.endswith("_expl") else f"{kind}_expl"
    if focus and focus != "temel":
        return f"[[{ns}:{base}|{focus}]]"
    return f"[[{ns}:{base}]]"


def detect_focus(q: dict) -> str:
    """Soru köküne göre görselde yalnızca ilgili parça gösterilir."""
    text = " ".join(filter(None, [q.get("text"), q.get("premise")])).lower()

    if re.search(r"kaç.*köşegen|köşegen.*kaç", text):
        return "kosegen"
    if re.search(r"kaç.*ayrıt|ayrıt.*kaç|kaç.*çizgi", text):
        return "ayrit"
    if re.search(r"kaç.*köşe|köşe.*kaç|köşesi vardır|köşesi yok", text):
        return "kose"
    if re.search(r"kaç.*yüz|yüz.*kaç|yüzeyi vardır|yüzey", text):
        return "yuz"
    if re.search(r"kaç.*kenar|kenar.*kaç", text):
        return "kenar"
    if any(
        p in text
        for p in (
            "ne ad verilir",
            "hangisidir",
            "aşağıdakilerden hangisi",
            "modelidir",
            "örneğidir",
            "benzer",
        )
    ):
        return "temel"
    if "köşegen" in text:
        return "kosegen"
    if "ayrıt" in text or "ayrit" in text:
        return "ayrit"
    if "köşe" in text:
        return "kose"
    if "yüz" in text:
        return "yuz"
    if "kenar" in text:
        return "kenar"
    if "eşit" in text and "karşılıklı" in text:
        return "esit"
    if "çember" in text and "daire" in text:
        return "karsilastir"
    return "temel"


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
        return f"[[{ns}:{kind}]]"
    return None


def is_multi_solid_question(q: dict) -> bool:
    """Birden fazla cisim sayılan sorularda tek cisim görseli yanıltıcı olur."""
    text = " ".join(
        filter(None, [q.get("text"), q.get("premise"), q.get("correct")])
    ).lower()
    if re.search(r"1\s*küp\s*ve\s*1|1\s*kup\s*ve\s*1", text, re.I):
        return True
    if re.search(r"2\s*tane\s*cisim|iki\s*cisim", text, re.I):
        return True
    if re.search(r"\d+\s*tane\s*küp.*prizma|\d+\s*tane\s*kup.*prizma", text, re.I):
        return True
    if re.search(r"2\s*tane\s*küp|2\s*tane\s*kup", text, re.I) and "prizma" in text:
        return True
    if re.search(r"toplam\s+(?:köşe|kose|ayrıt|ayrit|yüz|yuz)", text, re.I):
        kup = len(re.findall(r"küp|kup", text, re.I))
        prizma = len(re.findall(r"prizma", text, re.I))
        if kup + prizma >= 2:
            return True
    return False


def expl_vis(n: int, q: dict) -> str | None:
    if is_multi_solid_question(q):
        return None
    focus = detect_focus(q)
    if n in EXPL_VIS:
        ns, kind = parse_vis(EXPL_VIS[n])
        kind = kind.replace("_expl", "")
        return vis_tag(ns, kind, focus)
    blob = " ".join(
        filter(
            None,
            [q.get("premise"), q.get("text"), q.get("explanation"), q.get("correct")],
        )
    )
    hit = detect_from_blob(blob, prefer_3d=n >= 26)
    if hit:
        if hit[1] == "cember_vs_daire":
            focus = "karsilastir"
        return vis_tag(hit[0], hit[1], focus)
    return None


def contextual_hint(tag: str, q: dict) -> str:
    """Soru köküne göre ekranda görünen parçalarla sayım anlatımı."""
    text = " ".join(
        filter(None, [q.get("text"), q.get("premise"), q.get("explanation")])
    ).lower()
    is_cisim = "cisim:" in tag

    if "ayrıt" in text or "ayrit" in text:
        if "ucgen_prizma" in tag:
            return (
                "Cismi çevirerek bak: **koyu çizgiler ayrıttır** (kenar çizgileri). "
                "Üst üçgende **3**, alt üçgende **3**, birleştiren dikey çizgilerde **3** olmak üzere "
                "toplam **9 ayrıt** vardır."
            )
        if "kup" in tag:
            return (
                "Cismi çevirerek bak: **koyu çizgiler ayrıttır**. "
                "Üst karede **4**, alt karede **4**, birleştiren dikey çizgilerde **4** → "
                "toplam **12 ayrıt**."
            )
        if "kare_prizma" in tag or "dikdortgen_prizma" in tag:
            return (
                "Cismi çevirerek bak: **koyu çizgiler ayrıttır**. "
                "Üst tabanda **4**, alt tabanda **4**, birleştiren dikey çizgilerde **4** → "
                "toplam **12 ayrıt**."
            )
        if "piramit" in tag:
            return (
                "Cismi çevirerek bak: **koyu çizgiler ayrıttır**. "
                "Kare piramitte taban kenarları ve yan üçgenlerin kenarları birlikte **8 ayrıt** eder."
            )

    if "köşe" in text or "kose" in text:
        if "ucgen_prizma" in tag:
            return (
                "Cismi çevirerek bak: **kırmızı noktalar köşelerdir**. "
                "Üst üçgende **3**, alt üçgende **3** olmak üzere toplam **6 köşe** vardır."
            )
        if "kup" in tag or "prizma" in tag:
            return (
                "Cismi çevirerek bak: **kırmızı noktalar köşelerdir**. "
                "Bu prizmada **8 köşe** vardır (üstte 4, altta 4)."
            )

    if "yüz" in text or "yuz" in text:
        if "ucgen_prizma" in tag:
            return (
                "Cismi çevirerek bak: **2 üçgen taban** (üst ve alt) + **3 dikdörtgen yan yüz** = "
                "toplam **5 yüz**."
            )
        if "kup" in tag:
            return "Cismi çevirerek bak: **6 kare yüz** görürsün (alt, üst ve 4 yan)."
        if "kure" in tag or "küre" in text:
            return "Küre **tek eğri yüzeyden** oluşur; düz yüzü yoktur → **1 yüz**."

    if "köşegen" in text:
        if "kare" in tag:
            return (
                "Karede köşegen, **karşılıklı köşeleri birleştiren** kesik çizgidir. "
                "4 köşeden **2 farklı köşegen** çizilebilir."
            )

    if is_cisim:
        return expl_hint_for_tag(tag)
    return expl_hint_for_tag(tag)


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
    if expl_tag:
        hint = contextual_hint(expl_tag, q) if "|" in expl_tag else ""
        body = clean_explanation_body(expl, expl_tag)
        parts = [expl_tag]
        if hint and hint not in body:
            parts.append(hint)
        if body:
            parts.append(body)
        q["explanation"] = "\n\n".join(parts)
    elif expl:
        body = clean_explanation_body(expl, None)
        if is_multi_solid_question(q):
            body = re.sub(
                r"Mor\s+\*\*[^*]+\*\*[^.\n]*\.\s*",
                "",
                body,
                flags=re.I,
            )
            body = re.sub(
                r"Şekilde\s+\*\*mavi[^.\n]*\.\s*",
                "",
                body,
                flags=re.I,
            )
        q["explanation"] = body.strip() if body else expl

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

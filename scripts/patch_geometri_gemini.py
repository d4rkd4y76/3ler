#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Geometri soruları: öncül görseli + açıklamada etiketli _expl görseli."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "geometri-gemini-raw.json"

MARKUP_RE = re.compile(r"\[\[")

PREMISE_GEO: dict[int, str] = {
    5: "harf_i",
    15: "kareli",
    17: "ucgen_abc",
    36: "dogru_to_isin",
    37: "parca",
    71: "kare",
    72: "ucgen_abc",
    84: "makas_acik",
    86: "kapi_acik",
    88: "aci_dik",
    90: "aci_dik",
    91: "aci_dar",
    92: "aci_genis",
    93: "aci_genis",
    94: "aci_dar",
    95: "aci_dik",
    98: "aci_dar",
    99: "aci_genis",
    100: "aci_dogru",
    101: "yatay",
    102: "dikey",
    103: "egik",
    104: "egik",
    105: "yatay",
    106: "dikey",
    107: "dikey",
    108: "egik",
    109: "yatay",
    110: "egik",
    111: "kalem_esit",
    112: "aci_dik",
    113: "harf_h",
    114: "harf_v",
    115: "harf_o",
    116: "harf_t",
    117: "harf_o",
    118: "dikdortgen",
    119: "ucgen_abc",
    120: "dogru",
    121: "parca",
    122: "parca",
    123: "aci_dogru",
    124: "aci_dik",
    125: "kareli",
    126: "makas_acik",
    127: "bilardo",
    128: "dogru",
    129: "ucgen_abc",
    130: "parca",
}

# Açıklama görseli sorudan farklı olabilir
EXPL_KIND_OVERRIDE: dict[int, str] = {
    112: "aci_uzat",
    121: "dogru_to_isin",
    122: "parca_to_dogru",
    123: "ogrenci_dogru_aci",
    124: "ogrenci_dik",
    126: "makas_kapali",
    127: "bilardo",
    128: "ortak_duz",
    129: "ucgen_kollar",
}

CLOCK_PREMISE: dict[int, tuple[int, int]] = {
    96: (3, 0),
    97: (9, 0),
    98: (2, 0),
    99: (5, 0),
    100: (6, 0),
}

CLOCK_EXPL_ACI: dict[int, str] = {
    96: "aci_dik",
    97: "aci_dik",
    98: "aci_dar",
    99: "aci_genis",
    100: "aci_dogru",
}

EXPL_HINT: dict[str, str] = {
    "nokta_expl": "Kırmızı **A noktası** tek bir yeri gösterir; boyutu yoktur, ölçülemez.",
    "dogru_expl": "Her iki uçtaki **oklar** çizginin sonsuza gittiğini gösterir.",
    "isin_expl": "**A** başlangıç noktasıdır; ok yönünde sonsuza gider.",
    "parca_expl": "**A** ve **B** arası sabittir; cetvelle **ölçülebilir**.",
    "aci_dik_expl": "**Köşede** iki kol birleşir; kare işareti **90° dik açı** demektir.",
    "aci_dar_expl": "Kollar birbirine **yakınsa** sarı bölge **dar açıdır**.",
    "aci_genis_expl": "Kollar birbirinden **uzaksa** sarı bölge **geniş açıdır**.",
    "aci_dogru_expl": "Kollar **zıt yönde** ise **180° doğru açı** (düz çizgi) oluşur.",
    "aci_uzat_expl": "Kesikli çizgiler kolların **uzatılmış** halidir. Sarı **açı bölgesi aynı** kalır!",
    "kapi_acik_expl": "**Menteşe** köşedir; **duvar** ile **kapı** arasındaki boşluk **açıdır**.",
    "makas_acik_expl": "**Pivot** köşedir; iki **kol** arasındaki açıklık **açıdır**.",
    "makas_kapali_expl": "Kollar **üst üste** gelince arada açıklık kalmaz; **açı oluşmaz**.",
    "ucgen_abc_expl": "Her **kenar** bir **doğru parçasıdır**; 3 kenar = üçgen.",
    "ucgen_kollar_expl": "Her açının **2 kolu** vardır; 3 açı × 2 = **6 ışın**.",
    "kare_expl": "Karenin **4 kenarı** vardır; her kenar bir doğru parçasıdır.",
    "dikdortgen_expl": "**4 köşe** = **4 açı**; televizyon, kapı, tahta gibi.",
    "yatay_expl": "**Yatay** çizgi yere paralel, sağa-sola uzanır.",
    "dikey_expl": "**Dikey** çizgi yukarı-aşağı, dümdüz durur.",
    "egik_expl": "**Eğik** çizgi ne tam yatay ne tam dikeydir; **çapraz** gider.",
    "harf_h_expl": "Etiketlere bak: iki **dikey** + ortada bir **yatay** doğru parçası.",
    "harf_v_expl": "**V** harfinin kolları **eğik** doğru parçalarıdır.",
    "harf_t_expl": "Yatay ve dikey çizgi **dik açı** ile kesişir.",
    "harf_o_expl": "**O** yuvarlaktır; düz kenarı ve **açısı yoktur**.",
    "harf_l_expl": "**L** harfi **dik açı** modelidir (90°).",
    "harf_i_expl": "**i** harfinin üstündeki nokta geometrideki **noktayı** gösterir.",
    "kalem_esit_expl": "Yatay ve dikey dursa da **boyları eşittir**; yön boyu değiştirmez!",
    "bilardo_expl": "Topun gidişi **başlangıç** ve **bitiş** bellidir → **doğru parçası**.",
    "ortak_duz_expl": "Doğru, ışın ve doğru parçasının ortak özelliği: **dümdüz** olmalarıdır.",
    "dogru_to_isin_expl": "Bir uçtaki **ok silinip nokta** konunca **ışın** olur.",
    "parca_to_dogru_expl": "İki uca **ok eklenince** sınırlı çizgi **doğru**ya dönüşür.",
    "isin_to_parca_expl": "Sağdaki **ok kaldırılıp B noktası** konunca **doğru parçası** olur.",
    "ogrenci_dogru_aci_expl": "Kollar **iki yana** açılınca **180° doğru açı** oluşur.",
    "ogrenci_dik_expl": "Bir kol **yukarı**, bir kol **yana** → **dik açı (L)** oluşur.",
    "kareli_expl": "Kareli defterde çizgilerin **kesiştiği** her nokta bir **noktadır**.",
}


def normalize_id(qid: str) -> str:
    qid = (qid or "").strip()
    if qid.startswith("geo3_"):
        return qid.replace("geo3_", "mat3_t12_")
    return qid


def question_num(qid: str) -> int:
    m = re.search(r"_(\d+)$", qid or "")
    return int(m.group(1)) if m else 0


def geo_tag(kind: str, focus: str | None = None) -> str:
    if focus and focus != "temel":
        return f"[[geo:{kind}|{focus}]]"
    return f"[[geo:{kind}]]"


def detect_geo_focus(q: dict) -> str:
    text = " ".join(filter(None, [q.get("text"), q.get("premise")])).lower()
    if "kenar" in text and any(
        k in text for k in ("doğru parça", "dogru parca", "kaç kenar", "üçgen", "ucgen", "kare")
    ):
        return "kenar"
    if "köşe" in text or ("nokta" in text and "kaç" in text):
        return "kose"
    return "temel"


def clock_tag(hour: int, minute: int = 0) -> str:
    return f"[[clock:a:{hour}:{minute:02d}]]"


def default_geo_kind(n: int) -> str | None:
    if 1 <= n <= 20:
        return "nokta"
    if 21 <= n <= 40:
        return "dogru"
    if 41 <= n <= 60:
        return "isin"
    if 61 <= n <= 80:
        return "parca"
    if 81 <= n <= 100:
        return "aci_dik"
    if 101 <= n <= 110:
        return "yatay"
    return None


def premise_kind(n: int) -> str | None:
    if n in CLOCK_PREMISE:
        return None
    return PREMISE_GEO.get(n) or default_geo_kind(n)


def expl_kind(n: int) -> str | None:
    if n in EXPL_KIND_OVERRIDE:
        base = EXPL_KIND_OVERRIDE[n]
        return base if base.endswith("_expl") else f"{base}_expl"
    if n in CLOCK_PREMISE:
        aci = CLOCK_EXPL_ACI.get(n)
        return f"{aci}_expl" if aci else None
    base = PREMISE_GEO.get(n) or default_geo_kind(n)
    if not base:
        return None
    return f"{base}_expl"


def resolve_premise_visual(n: int) -> str | None:
    """Öncülde yalnızca saat (veri); geometri şekli cevap spoiler olur."""
    if n in CLOCK_PREMISE:
        h, m = CLOCK_PREMISE[n]
        return clock_tag(h, m)
    return None


def resolve_expl_visual(n: int, q: dict | None = None) -> str | None:
    q = q or {}
    if n in CLOCK_PREMISE:
        h, m = CLOCK_PREMISE[n]
        parts = [clock_tag(h, m)]
        aci = expl_kind(n)
        if aci:
            parts.append(geo_tag(aci))
        return "\n\n".join(parts)
    kind = expl_kind(n)
    if not kind:
        return None
    focus = "temel"
    base = kind.replace("_expl", "")
    if base in ("ucgen_abc", "kare", "dikdortgen"):
        focus = detect_geo_focus(q)
    return geo_tag(kind, focus)


def expl_hint_for_tag(tag: str) -> str:
    for kind, hint in EXPL_HINT.items():
        if f"[[geo:{kind}]]" in tag:
            return hint
    if "[[clock:" in tag:
        return "Saatin **kollarına** bak: aralarındaki açıklık açının büyüklüğünü gösterir."
    return "Şekildeki **oklu etiketlere** dikkat et; her parçanın adını gösterir."


def prepend_markup(text: str | None, tag: str | None) -> str | None:
    if not tag:
        return text
    base = (text or "").strip()
    if MARKUP_RE.search(base):
        return base or None
    if base:
        return f"{tag}\n\n{base}"
    return tag


def enhance_question(q: dict) -> dict:
    q = dict(q)
    qid = normalize_id(q.get("id", ""))
    q["id"] = qid
    n = question_num(qid)

    prem_tag = resolve_premise_visual(n)
    q["premise"] = prepend_markup(q.get("premise"), prem_tag)

    expl = (q.get("explanation") or "").strip()
    expl_tag = resolve_expl_visual(n, q)
    if expl and expl_tag:
        body = expl
        if expl_tag in body:
            body = re.sub(re.escape(expl_tag) + r"\s*", "", body, count=1).strip()
        for old in re.findall(r"\[\[geo:[^\]]+\]\]", body):
            if old != expl_tag and "_expl" not in old:
                body = body.replace(old, "").strip()
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
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

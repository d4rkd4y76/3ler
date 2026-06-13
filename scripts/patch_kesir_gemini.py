#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kesir soruları: [[n/d]] kesir markup + görsel model + bölme çözümleri."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "kesir-gemini-raw.json"
OUT_PATH = ROOT / "data" / "kesirler-s3-130.json"

FRAC_BARE = re.compile(r"(?<!\[\[)(\d{1,2})/(\d{1,2})(?!\])")
FRAC_OF = re.compile(
    r"(\d{1,3})\s*sayısının\s*\[\[(\d+)/(\d+)\]\]'?(?:ünü|u|i)?",
    re.I,
)
FRAC_OF2 = re.compile(
    r"(\d{1,3})\s*sayısının\s*(\d{1,2})/(\d{1,2})'?(?:ünü|u|i)?",
    re.I,
)
DIV_EQ = re.compile(r"(\d{1,3})\s*÷\s*(\d{1,2})\s*=\s*(\d{1,3})")
STEP_DIVIDER = "[[stephr]]"

FRACBAR_PREMISE = {
    "mat3_kesir_019": "3/8",
    "mat3_kesir_020": "2/6",
}

COMPARE_FIX = {
    "mat3_kesir_036": {
        "correct": "[[1/2]] kesri daha büyüktür",
        "wrong1": "[[1/4]] kesri daha büyüktür",
        "wrong2": "İkisi de eşittir",
    },
    "mat3_kesir_037": {
        "correct": "[[1/3]]",
        "wrong1": "[[1/6]]",
        "wrong2": "[[1/9]]",
    },
    "mat3_kesir_038": {
        "correct": "[[1/10]]",
        "wrong1": "[[1/5]]",
        "wrong2": "[[1/2]]",
    },
    "mat3_kesir_039": {
        "correct": "[[1/4]]",
        "wrong1": "[[1/7]]",
        "wrong2": "[[1/8]]",
    },
    "mat3_kesir_040": {
        "correct": "[[1/12]]",
        "wrong1": "[[1/6]]",
        "wrong2": "[[1/3]]",
    },
    "mat3_kesir_041": {
        "correct": "[[1/2]] > [[1/5]] > [[1/8]]",
        "wrong1": "[[1/8]] > [[1/5]] > [[1/2]]",
        "wrong2": "[[1/5]] > [[1/2]] > [[1/8]]",
    },
    "mat3_kesir_042": {
        "correct": "[[1/10]] < [[1/6]] < [[1/3]]",
        "wrong1": "[[1/3]] < [[1/6]] < [[1/10]]",
        "wrong2": "[[1/6]] < [[1/3]] < [[1/10]]",
    },
}

UNIT_FRAC_OF: dict[str, tuple[int, int, int]] = {
    f"mat3_kesir_{n:03d}": data
    for n, data in {
        46: (20, 4, 5),
        47: (30, 5, 6),
        48: (42, 6, 7),
        49: (56, 7, 8),
        50: (72, 8, 9),
        51: (81, 9, 9),
        52: (45, 5, 9),
        53: (64, 8, 8),
        54: (36, 4, 9),
        55: (48, 6, 8),
        56: (90, 10, 9),
        57: (70, 10, 7),
        58: (54, 9, 6),
        59: (28, 7, 4),
        60: (32, 8, 4),
        61: (24, 3, 8),
        62: (27, 9, 3),
        63: (40, 5, 8),
        64: (49, 7, 7),
        65: (16, 4, 4),
        66: (30, 5, 6),
        67: (42, 6, 7),
        68: (56, 7, 8),
        69: (48, 8, 6),
        70: (63, 9, 7),
        71: (72, 8, 9),
        72: (45, 5, 9),
        73: (64, 8, 8),
        74: (54, 6, 9),
        75: (36, 4, 9),
        76: (80, 10, 8),
        77: (40, 8, 5),
        78: (35, 7, 5),
        79: (24, 3, 8),
        80: (27, 9, 3),
        81: (24, 2, 12),
        82: (32, 4, 8),
        83: (48, 6, 8),
        84: (60, 4, 15),
        85: (60, 2, 30),
    }.items()
}


def normalize_id(qid: str) -> str:
    qid = (qid or "").strip()
    if qid.startswith("kesir3_"):
        return qid.replace("kesir3_", "mat3_kesir_")
    if qid.startswith("mat3_t08_"):
        return qid.replace("mat3_t08_", "mat3_kesir_")
    return qid


def inject_fracs(text: str) -> str:
    if not text:
        return text
    return FRAC_BARE.sub(r"[[\1/\2]]", text)


def inject_field(text: str | None) -> str | None:
    if text is None:
        return None
    return inject_fracs(str(text).strip())


def fmt_result(n: int | str) -> str:
    return f"Sonuç: [[result:{n}]]"


def build_unit_frac_explanation(n: int, d: int, result: int) -> str:
    from patch_bolme_gemini import build_div_explanation

    lines = [
        f"Bir çokluğun birim kesrini bulmak için sayıyı **payda**ya böleriz.",
        f"**{n}** sayısının **[[1/{d}]]**'ini bulmak için **{n} ÷ {d}** işlemini yaparız.",
    ]
    body = build_div_explanation(n, d, result=result, step_only=True)
    lines.append(body)
    lines.append(STEP_DIVIDER)
    lines.append(fmt_result(result))
    return "\n".join(lines)


def enhance_concept_explanation(q: dict) -> str:
    qid = q.get("id", "")
    expl = inject_fracs(q.get("explanation") or "")

    if qid == "mat3_kesir_004":
        return (
            "Bir bütün **eş parçalara** ayrılır. Pay **1** olduğunda yalnızca **bir parça** alınmış demektir.\n\n"
            "Örnek: [[fracbar:1/4]] → [[1/4]] birim kesirdir.\n"
            + expl
        )
    if qid == "mat3_kesir_009":
        return (
            expl
            + "\n\n[[fracbar:1/2]] bir bütünün **yarım**ını gösterir → [[1/2]] = **Yarım**"
        )
    if qid == "mat3_kesir_010":
        return (
            expl
            + "\n\n[[fracbar:1/4]] bir bütünün **çeyrek**ini gösterir → [[1/4]] = **Çeyrek**"
        )
    if qid in ("mat3_kesir_011", "mat3_kesir_012", "mat3_kesir_013"):
        m = re.search(r"\[\[1/(\d+)\]\]", q.get("text") or "")
        if m:
            d = m.group(1)
            return expl + f"\n\n[[1/{d}]] → [[fracbar:1/{d}]]"
    return expl


def patch_question(q: dict) -> dict:
    q = dict(q)
    q["id"] = normalize_id(q.get("id", ""))
    qid = q["id"]

    if qid in COMPARE_FIX:
        q.update(COMPARE_FIX[qid])

    for key in ("premise", "text", "correct", "wrong1", "wrong2"):
        if q.get(key):
            q[key] = inject_field(q[key])

    if qid in FRACBAR_PREMISE:
        frac = FRACBAR_PREMISE[qid]
        bar = f"[[fracbar:{frac}]]"
        prem = q.get("premise") or ""
        if bar not in prem:
            q["premise"] = f"{prem}\n\n{bar}".strip()

    if qid in UNIT_FRAC_OF:
        n, d, res = UNIT_FRAC_OF[qid]
        q["explanation"] = build_unit_frac_explanation(n, d, res)
    elif qid.startswith("mat3_kesir_") and qid >= "mat3_kesir_086":
        expl = inject_fracs(q.get("explanation") or "")
        m = DIV_EQ.search(expl)
        if m:
            a, b, r = int(m.group(1)), int(m.group(2)), int(m.group(3))
            from patch_bolme_gemini import build_div_explanation

            if "−" in expl or "-" in expl or "kalan" in expl.lower() or "geriye" in expl.lower():
                q["explanation"] = expl
            else:
                q["explanation"] = expl + "\n\n" + build_div_explanation(
                    a, b, result=r, step_only=True
                ) + f"\n{STEP_DIVIDER}\n{fmt_result(r)}"
        else:
            q["explanation"] = enhance_concept_explanation(q) if qid <= "mat3_kesir_020" else expl
    else:
        q["explanation"] = enhance_concept_explanation(q)

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
        topic_id="t08",
        title="Kesirler (Birim kesirler, pay ve payda kavramı, kesri sayı doğrusunda gösterme)",
        lesson_id_kw="lesson_matematik",
    )
    print(f"OK: {len(out)} soru -> {OUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Carpma sorulari: dikey carpma markup + ilkokul cozum aciklamalari (cikarma mantigi)."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "carpma-gemini-raw.json"
OUT_PATH = ROOT / "data" / "uclu-basamakli-carpma-s3-150.json"

MUL_PAIR = re.compile(r"(\d{1,4})\s*[x×X*]\s*(\d{1,4})")

STEP_DIVIDER = "[[stephr]]"

PLACE_SHORT = {
    "birler": "Birler",
    "onlar": "Onlar",
    "yüzler": "Yüzler",
}

TABLE_ONLY = {f"mat3_carp_{i:03d}" for i in range(1, 7)}

TEN_TRICK = {
    "mat3_carp_013": (15, 10),
    "mat3_carp_014": (32, 10),
    "mat3_carp_015": (24, 10),
}

TWO_STEP: dict[str, list[tuple[str, int, int, int | None]]] = {
    "mat3_carp_040": [("mul", 15, 4, 60), ("add", 60, 20, 80)],
    "mat3_carp_041": [("mul", 16, 2, 32), ("add", 32, 3, 35)],
    "mat3_carp_042": [("mul", 25, 4, 100), ("sub", 100, 12, 88)],
    "mat3_carp_043": [("mul", 3, 10, 30), ("sub", 45, 30, 15)],
    "mat3_carp_044": [("mul", 35, 2, 70), ("sub", 100, 70, 30)],
    "mat3_carp_045": [("mul", 25, 8, 200), ("add", 200, 40, 240)],
    "mat3_carp_046": [("mul", 45, 3, 135), ("sub", 135, 20, 115)],
    "mat3_carp_047": [
        ("mul", 14, 4, 56),
        ("mul", 18, 2, 36),
        ("mul", 6, 4, 24),
        ("add", 56, 36, 92),
        ("add", 92, 24, 116),
    ],
    "mat3_carp_049": [("mul", 9, 4, 36), ("sub", 50, 36, 14)],
    "mat3_carp_050": [
        ("mul", 4, 4, 16),
        ("mul", 16, 5, 80),
        ("mul", 80, 2, 160),
    ],
}

PRIMARY_MUL: dict[str, tuple[int, int]] = {
    "mat3_carp_007": (8, 2),
    "mat3_carp_008": (6, 5),
    "mat3_carp_009": (4, 4),
    "mat3_carp_010": (7, 5),
    "mat3_carp_011": (9, 4),
    "mat3_carp_012": (8, 3),
    "mat3_carp_025": (24, 5),
    "mat3_carp_026": (18, 7),
    "mat3_carp_027": (28, 3),
    "mat3_carp_028": (36, 3),
    "mat3_carp_029": (45, 4),
    "mat3_carp_030": (25, 4),
    "mat3_carp_031": (16, 8),
    "mat3_carp_032": (12, 7),
    "mat3_carp_033": (18, 2),
    "mat3_carp_034": (24, 5),
    "mat3_carp_048": (45, 6),
}


def fmt_final_result(n: int) -> str:
    return f"Sonuç: [[result:{n}]]"


def place_label(place: str) -> str:
    return PLACE_SHORT.get(place, place.capitalize())


def place_names(length: int) -> list[str]:
    from math_place_utils import place_names as _pn

    return _pn(length)


def sonraki_basamak(place: str) -> str:
    from math_place_utils import sonraki_basamak as _sb

    return _sb(place)


def mul_layout(a: int, b: int) -> tuple[int, int]:
    """Carpan tek basamakli ise o altta; carpilan (ust) daha uzun basamakli."""
    if len(str(a)) > len(str(b)):
        return a, b
    if len(str(b)) > len(str(a)):
        return b, a
    return (a, b) if a >= b else (b, a)


def compute_mul_steps(multiplicand: int, multiplier: int) -> tuple[list[dict], int, bool]:
    sa = str(multiplicand)
    m = multiplier
    da = [int(c) for c in sa]
    names = place_names(len(da))
    carry = 0
    steps: list[dict] = []
    any_carry = False
    for i in range(len(da) - 1, -1, -1):
        carry_in = carry
        total = da[i] * m + carry_in
        digit = total % 10
        carry_out = total // 10
        if carry_out or carry_in:
            any_carry = True
        place = names[i] if i < len(names) else f"{i + 1}. basamak"
        steps.append(
            {
                "place": place,
                "da": da[i],
                "mult": m,
                "carry_in": carry_in,
                "product": da[i] * m,
                "total": total,
                "digit": digit,
                "carry_out": carry_out,
            },
        )
        carry = carry_out
    return steps, multiplicand * multiplier, any_carry


def mul_title(any_carry: bool) -> str:
    return "Eldeli çarpma" if any_carry else "Eldesiz çarpma"


def mul_step_line(step: dict, *, is_last: bool = False) -> str:
    from math_place_utils import rakam_accusative

    label = place_label(step["place"])
    d, m = step["da"], step["mult"]
    prod = step["product"]
    total = step["total"]
    digit = step["digit"]
    cin, cout = step["carry_in"], step["carry_out"]

    intro = f"{d} ile {rakam_accusative(m)} çarparız: {d} × {m} = **{prod}**"
    if cin and not cout:
        body = (
            f"{intro}. Elde **{cin}** eklenince **{total}** olur. "
            f"Alta **{digit}** yazılır."
        )
    elif cin and cout:
        if is_last:
            hedef = sonraki_basamak(step["place"])
            body = (
                f"{intro}. Elde **{cin}** eklenince **{total}** olur. "
                f"Alta **{digit}** yazılır. **{cout}** elde olur ve "
                f"sonucun **{hedef}** basamağına yazılır."
            )
        else:
            body = (
                f"{intro}. Elde **{cin}** eklenince **{total}** olur. "
                f"Alta **{digit}** yazılır, **{cout}** elde olur."
            )
    elif cout and is_last and cout > 0:
        hedef = sonraki_basamak(step["place"])
        body = (
            f"{intro}. Alta **{digit}** yazılır. "
            f"**{cout}** elde olur ve sonucun **{hedef}** basamağına yazılır."
        )
    elif cout:
        body = (
            f"{intro}. Alta **{digit}** yazılır, **{cout}** elde olur."
        )
    else:
        body = f"{intro}. Alta **{digit}** yazılır."

    return f"**{label} basamağı**\n{body}"


def build_table_explanation(a: int, b: int, result: int) -> str:
    return (
        f"Çarpım tablosu:\n[[mul:{a}×{b}]]\n"
        f"**{a}** ile **{b}** çarpılır, sonuç **{result}** olur."
    )


def build_ten_explanation(a: int, b: int, result: int, qid: str) -> str:
    if qid == "mat3_carp_015":
        return (
            "10 ile çarpma kuralı: Sonundaki **0** silinir.\n"
            f"**{result}** sayısının sonundaki 0 silinince **{a}** kalır."
        )
    n = a if b == 10 else b
    return (
        "10 ile çarpma kuralı: Sayının sonuna **0** eklenir.\n"
        f"[[mul:{n}×10]]\n"
        f"**{n}** sayısının sonuna 0 eklenince **{result}** olur."
    )


def build_mul_explanation(
    a: int, b: int, result: int | None = None, *, step_only: bool = False
) -> str:
    top, bottom = mul_layout(a, b)
    steps, calc, any_carry = compute_mul_steps(top, bottom)
    if result is None:
        result = calc
    title = mul_title(any_carry)
    lines = [f"{title}:", f"[[mulsol:{top}×{bottom}]]"]
    for i, s in enumerate(steps):
        if i > 0:
            lines.append(STEP_DIVIDER)
        lines.append(mul_step_line(s, is_last=(i == len(steps) - 1)))
    if step_only:
        lines.append(f"→ **{result}**")
    else:
        lines.append(fmt_final_result(result))
    return "\n".join(lines)


def add_step_short(step: dict) -> str:
    p = place_label(step["place"])
    da, db = step["da"], step["db"]
    cin, cout, digit = step["carry_in"], step["carry_out"], step["digit"]
    total = da + db + cin
    if cin and cout:
        body = (
            f"{da} + {db} + elde {cin} = **{total}** eder. "
            f"Alta **{digit}** yazılır, **1** elde olur."
        )
    elif cout:
        body = f"{da} + {db} = **{total}** eder. Alta **{digit}** yazılır, **1** elde olur."
    elif cin:
        body = f"{da} + {db} + elde {cin} = **{total}** eder. Alta **{digit}** yazılır."
    else:
        body = f"{da} + {db} = **{total}** eder. Alta **{digit}** yazılır."
    return f"**{p} basamağı**\n{body}"


def build_add_explanation_short(a: int, b: int, result: int | None = None, *, step_only: bool = False) -> str:
    from patch_toplama_gemini import compute_add_steps

    steps, calc = compute_add_steps(a, b)
    if result is None:
        result = calc
    eldeli = any(s["carry_out"] for s in steps)
    title = "Eldeli toplama" if eldeli else "Eldesiz toplama"
    lines = [f"{title}:", f"[[addsol:{a}+{b}]]"]
    for i, s in enumerate(steps):
        if i > 0:
            lines.append(STEP_DIVIDER)
        lines.append(add_step_short(s))
    if step_only:
        lines.append(f"→ **{result}**")
    else:
        lines.append(fmt_final_result(result))
    return "\n".join(lines)


def build_sub_explanation_short(a: int, b: int, result: int | None = None, *, step_only: bool = False) -> str:
    from patch_cikarma_gemini import build_sub_explanation

    return build_sub_explanation(a, b, result, step_only=step_only)


def build_two_step_explanation(steps: list[tuple[str, int, int, int | None]]) -> str:
    n = len(steps)
    lines = [f"**{n} adımlı problem**:"]
    for i, item in enumerate(steps, 1):
        if i > 1:
            lines.append(STEP_DIVIDER)
        op, a, b, res = item
        lines.append(f"**{i}. adım**")
        if op == "mul":
            body = build_mul_explanation(a, b, res, step_only=True)
        elif op == "add":
            body = build_add_explanation_short(a, b, res, step_only=True)
        else:
            body = build_sub_explanation_short(a, b, res, step_only=True)
        lines.extend(body.split("\n"))
    last = steps[-1]
    final = last[3] if last[3] is not None else (last[1] * last[2] if last[0] == "mul" else None)
    lines.append(STEP_DIVIDER)
    lines.append(fmt_final_result(final))
    return "\n".join(lines)


def normalize_mul_markup(text: str) -> str:
    t = text or ""
    while "[[mul:[[mul:" in t:
        t = t.replace("[[mul:[[mul:", "[[mul:").replace("]]]]", "]]")
    return t


def find_mul_in_text(text: str) -> tuple[int, int] | None:
    m = MUL_PAIR.search(text or "")
    if m:
        return int(m.group(1)), int(m.group(2))
    return None


def patch_question(q: dict) -> dict:
    q = dict(q)
    qid = q.get("id", "")
    text = normalize_mul_markup((q.get("text") or "").strip())
    q["text"] = text

    if qid in TWO_STEP:
        q["explanation"] = build_two_step_explanation(TWO_STEP[qid])
        return apply_why(q)

    if qid in TEN_TRICK:
        a, b = TEN_TRICK[qid]
        res = int(q["correct"]) if str(q.get("correct", "")).isdigit() else a * b
        q["explanation"] = build_ten_explanation(a, b, res, qid)
        return apply_why(q)

    if qid in TABLE_ONLY:
        m = find_mul_in_text(text)
        if m:
            a, b = m
            q["text"] = MUL_PAIR.sub(r"[[mul:\1×\2]]", text, count=1)
            q["explanation"] = build_table_explanation(a, b, int(q["correct"]))
        return apply_why(q)

    if qid in PRIMARY_MUL:
        a, b = PRIMARY_MUL[qid]
        q["explanation"] = build_mul_explanation(a, b)
        return apply_why(q)

    m = find_mul_in_text(text)
    if m and "[[mul:" not in text:
        a, b = m
        big, small = (a, b) if a >= b else (b, a)
        q["text"] = MUL_PAIR.sub(r"[[mul:\1×\2]]", text, count=1)
        if big >= 10 or small >= 10:
            q["explanation"] = build_mul_explanation(a, b, int(q["correct"]) if str(q.get("correct", "")).isdigit() else None)
        else:
            q["explanation"] = build_table_explanation(a, b, int(q["correct"]))
        return apply_why(q)

    m = MUL_PAIR.search(q.get("explanation") or "")
    if m and str(q.get("correct", "")).isdigit():
        a, b = int(m.group(1)), int(m.group(2))
        if max(a, b) >= 10:
            q["explanation"] = build_mul_explanation(a, b, int(q["correct"]))
        return apply_why(q)

    return apply_why(q)


def apply_why(q: dict) -> dict:
    try:
        from patch_carpma_why_context import patch_question as why_patch
    except ImportError:
        from scripts.patch_carpma_why_context import patch_question as why_patch  # type: ignore
    patched, _ = why_patch(q)
    return patched


def main() -> int:
    if not RAW_PATH.is_file():
        raise SystemExit(f"Dosya yok: {RAW_PATH}")
    raw = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    out = [patch_question(q) for q in raw]

    from question_build_common import write_json_pack

    write_json_pack(
        out,
        data_path=OUT_PATH,
        topic_id="t06",
        title="Çarpma İşlemi (Çarpım tablosunun tamamlanması, iki basamaklıyla bir basamaklıyı çarpma)",
        grade=3,
        lesson_id="lesson_matematik",
    )
    vertical = sum(1 for q in out if "[[mul:" in q.get("text", ""))
    mulsol = sum(1 for q in out if "[[mulsol:" in q.get("explanation", ""))
    print(f"Guncellendi: {len(out)} soru, {vertical} dikey soru metni, {mulsol} mulsol aciklama")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

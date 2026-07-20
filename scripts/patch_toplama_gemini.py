#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Toplama sorulari: dikey toplama markup + ilkokul cozum aciklamalari."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "toplama-gemini-raw.json"

ADD_PAIR = re.compile(r"(\d{2,4})\s*\+\s*(\d{2,4})")
ADD_EQ = re.compile(r"(\d{2,4})\s*\+\s*(\d{2,4})\s*=\s*(\d{2,4})")
ADD_THREE = re.compile(r"(\d{2,4})\s*\+\s*(\d{2,4})\s*\+\s*(\d{2,4})")

SKIP_TEXT_VERTICAL = (
    "zihinden",
    "......",
    "toplanan",
    "rakamları",
    "rakamlari",
    "a + b",
    "a +",
    "görevi",
    "gorevi",
    "yuvarla",
    "tahmini",
    "fark",
    "en büyük",
    "en buyuk",
    "en küçük",
    "en kucuk",
    "rakamları birbirinden",
    "rakamlari birbirinden",
    "yüzlük eder",
    "yupluk eder",
)


def compute_add_steps(a: int, b: int) -> tuple[list[dict], int]:
    from math_place_utils import place_names

    sa, sb = str(a), str(b)
    length = max(len(sa), len(sb))
    da = [int(c) for c in sa.zfill(length)]
    db = [int(c) for c in sb.zfill(length)]
    names = place_names(length)
    steps: list[dict] = []
    carry = 0
    result_digits: list[int] = []
    for i in range(length - 1, -1, -1):
        total = da[i] + db[i] + carry
        digit = total % 10
        new_carry = 1 if total >= 10 else 0
        place = names[i] if i < len(names) else names[0]
        steps.append(
            {
                "place": place,
                "da": da[i],
                "db": db[i],
                "carry_in": carry,
                "digit": digit,
                "carry_out": new_carry,
            }
        )
        result_digits.insert(0, digit)
        carry = new_carry
    return steps, int("".join(str(d) for d in result_digits) or "0")


def step_line(step: dict) -> str:
    p = step["place"].capitalize()
    da, db = step["da"], step["db"]
    cin, cout, digit = step["carry_in"], step["carry_out"], step["digit"]
    if cin and cout:
        total = da + db + cin
        return (
            f"• {p} basamağı: {da} + {db} + elde ({cin}) = {total} → "
            f"alta **{digit}** yazılır, sol basamağa **1 elde** taşınır."
        )
    if cout:
        total = da + db
        return (
            f"• {p} basamağı: {da} + {db} = {total} → "
            f"alta **{digit}** yazılır, sol basamağa **1 elde** taşınır."
        )
    if cin:
        total = da + db + cin
        return (
            f"• {p} basamağı: {da} + {db} + elde ({cin}) = {total} → "
            f"alta **{digit}** yazılır."
        )
    return f"• {p} basamağı: {da} + {db} = {digit} → alta **{digit}** yazılır."


def build_add_explanation(a: int, b: int, result: int | None = None) -> str:
    steps, calc = compute_add_steps(a, b)
    if result is None:
        result = calc
    eldeli = any(s["carry_out"] for s in steps)
    title = "Eldeli toplama" if eldeli else "Eldesiz toplama"
    lines = [f"{title} — alt alta:", f"[[addsol:{a}+{b}]]"]
    lines.extend(step_line(s) for s in steps)
    lines.append(f"Sonuç: **{result}**.")
    return "\n".join(lines)


def compute_add_steps_multi(addends: list[int]) -> tuple[list[dict], int]:
    from math_place_utils import place_names

    if len(addends) < 2:
        return [], addends[0] if addends else 0
    total = sum(addends)
    length = max(len(str(n)) for n in addends + [total])
    digit_rows = [[int(c) for c in str(n).zfill(length)] for n in addends]
    names = place_names(length)
    steps: list[dict] = []
    carry = 0
    result_digits: list[int] = []
    for i in range(length - 1, -1, -1):
        digits = [row[i] for row in digit_rows]
        total_col = sum(digits) + carry
        digit = total_col % 10
        new_carry = total_col // 10
        place = names[i] if i < len(names) else names[0]
        steps.append(
            {
                "place": place,
                "digits": digits,
                "carry_in": carry,
                "digit": digit,
                "carry_out": new_carry,
            }
        )
        result_digits.insert(0, digit)
        carry = new_carry
    return steps, int("".join(str(d) for d in result_digits) or "0")


def step_line_multi(step: dict) -> str:
    p = step["place"].capitalize()
    digits = step["digits"]
    cin, cout, digit = step["carry_in"], step["carry_out"], step["digit"]
    parts = " + ".join(str(d) for d in digits)
    if cin:
        parts += f" + elde ({cin})"
    total = sum(digits) + cin
    if cout:
        carry_txt = f"**{cout} elde**" if cout > 1 else "**1 elde**"
        return (
            f"• {p} basamağı: {parts} = {total} → "
            f"alta **{digit}** yazılır, sol basamağa {carry_txt} taşınır."
        )
    return f"• {p} basamağı: {parts} = {digit} → alta **{digit}** yazılır."


def build_multi_add_explanation(addends: list[int], result: int | None = None) -> str:
    steps, calc = compute_add_steps_multi(addends)
    if result is None:
        result = calc
    ops = "+".join(str(n) for n in addends)
    eldeli = any(s["carry_out"] for s in steps)
    title = "Eldeli toplama" if eldeli else "Eldesiz toplama"
    lines = [f"{title} — alt alta:", f"[[addsol:{ops}]]"]
    lines.extend(step_line_multi(s) for s in steps)
    lines.append(f"Sonuç: **{result}**.")
    return "\n".join(lines)


def extract_addends_from_premise(premise: str, correct: int) -> list[int] | None:
    nums = [int(m.group(1)) for m in re.finditer(r"\b(\d{2,4})\b", premise or "")]
    if len(nums) < 3:
        return None
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            for k in range(j + 1, len(nums)):
                triple = [nums[i], nums[j], nums[k]]
                if sum(triple) == correct:
                    return triple
    return None


def build_three_add_explanation(a: int, b: int, c: int, result: int) -> str:
    return build_multi_add_explanation([a, b, c], result)


def find_addition(q: dict) -> tuple[int, int, int | None] | None:
    exp = q.get("explanation") or ""
    text = q.get("text") or ""

    m3 = ADD_THREE.search(exp)
    if m3:
        a, b, c = int(m3.group(1)), int(m3.group(2)), int(m3.group(3))
        return a, b, a + b + c

    m = ADD_EQ.search(exp)
    if m:
        return int(m.group(1)), int(m.group(2)), int(m.group(3))

    m = ADD_PAIR.search(exp)
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        correct = q.get("correct", "")
        if str(correct).isdigit():
            return a, b, int(correct)
        return a, b, a + b

    m = ADD_PAIR.search(text)
    if m and str(q.get("correct", "")).isdigit():
        return int(m.group(1)), int(m.group(2)), int(q["correct"])

    return None


def normalize_add_markup(text: str) -> str:
    t = text or ""
    while "[[add:[[add:" in t:
        t = t.replace("[[add:[[add:", "[[add:").replace("]]]]", "]]")
    return t


def should_vertical_in_text(text: str) -> bool:
    t = (text or "").lower()
    if any(s in t for s in SKIP_TEXT_VERTICAL):
        return False
    return bool(ADD_PAIR.search(text or ""))


def build_two_step_explanation(exp: str) -> str | None:
    pairs = ADD_EQ.findall(exp)
    if len(pairs) < 2:
        return None
    lines = ["İki adımlı problem — her adımda alt alta toplama:"]
    for i, (a, b, res) in enumerate(pairs, 1):
        a_i, b_i, res_i = int(a), int(b), int(res)
        lines.append(f"{i}. adım: [[addsol:{a_i}+{b_i}]]")
        lines.extend(step_line(s) for s in compute_add_steps(a_i, b_i)[0])
        lines.append(f"→ **{res_i}**")
    if "Sonuç" in exp or "toplam" in exp.lower():
        last = pairs[-1]
        lines.append(f"Sonuç: **{last[2]}**.")
    return "\n".join(lines)


def apply_why_context(q: dict) -> dict:
    """Mevcut aciklamaya 'neden topluyoruz' on ekini uygular (dikey cozum ayni kalir)."""
    try:
        from patch_toplama_why_context import patch_question as why_patch
    except ImportError:
        from scripts.patch_toplama_why_context import patch_question as why_patch  # type: ignore
    patched, _ = why_patch(q)
    return patched


def patch_question(q: dict) -> dict:
    q = dict(q)
    text = normalize_add_markup((q.get("text") or "").strip())
    exp = q.get("explanation") or ""
    q["text"] = text

    if should_vertical_in_text(text) and "[[add:" not in text:
        q["text"] = ADD_PAIR.sub(r"[[add:\1+\2]]", text, count=1)

    sub = re.search(r"(\d{2,4})\s*-\s*(\d{2,4})\s*=\s*(\d{2,4})", exp)
    if sub and any(
        k in exp.lower()
        for k in ("toplamdan", "çıkar", "cikar", "ters işlem", "eksilen", "verilmeyen")
    ):
        tot, subtrahend, ans = int(sub.group(1)), int(sub.group(2)), int(sub.group(3))
        q["explanation"] = (
            "Verilmeyen toplananı bulmak için toplamdan diğer sayıyı çıkarırız:\n"
            f"[[addsol:{subtrahend}+{ans}]] kontrolü: {subtrahend} + {ans} = {tot}\n"
            f"Ters işlem: {tot} − {subtrahend} = **{ans}**."
        )
        return apply_why_context(q)

    two = build_two_step_explanation(exp)
    if two:
        q["explanation"] = two
        return apply_why_context(q)

    correct = int(q["correct"]) if str(q.get("correct", "")).isdigit() else None
    if correct is not None:
        triple = extract_addends_from_premise(q.get("premise", "") or text, correct)
        if triple:
            q["explanation"] = build_multi_add_explanation(triple, correct)
            return apply_why_context(q)

    m3 = ADD_THREE.search(exp)
    if m3:
        a3, b3, c3 = int(m3.group(1)), int(m3.group(2)), int(m3.group(3))
        q["explanation"] = build_three_add_explanation(a3, b3, c3, a3 + b3 + c3)
        return apply_why_context(q)

    found = find_addition(q)
    if found:
        a, b, res = found
        q["explanation"] = build_add_explanation(a, b, res)

    return apply_why_context(q)


def main() -> int:
    if not RAW_PATH.is_file():
        raise SystemExit(f"Dosya yok: {RAW_PATH}")
    data = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    out = [patch_question(q) for q in data]
    RAW_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    vertical_text = sum(1 for q in out if "[[add:" in q.get("text", ""))
    print(f"Guncellendi: {len(out)} soru, {vertical_text} soruda dikey toplama gosterimi")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

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
    sa, sb = str(a), str(b)
    length = max(len(sa), len(sb))
    da = [int(c) for c in sa.zfill(length)]
    db = [int(c) for c in sb.zfill(length)]
    if length == 3:
        names = ["yüzler", "onlar", "birler"]
    elif length == 2:
        names = ["onlar", "birler"]
    else:
        names = [f"{i + 1}. basamak" for i in range(length)]
    steps: list[dict] = []
    carry = 0
    result_digits: list[int] = []
    for i in range(length - 1, -1, -1):
        total = da[i] + db[i] + carry
        digit = total % 10
        new_carry = 1 if total >= 10 else 0
        place = names[i] if i < len(names) else f"{i + 1}. basamak"
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


def build_three_add_explanation(a: int, b: int, c: int, result: int) -> str:
    mid = a + b
    lines = [
        "Üç sayıyı alt alta toplarken önce ilk ikisini, sonra üçüncüyü ekleriz.",
        f"1. adım: [[addsol:{a}+{b}]] → {mid}",
        f"2. adım: [[addsol:{mid}+{c}]] → {result}",
        f"Sonuç: **{result}**.",
    ]
    return "\n".join(lines)


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
        return q

    two = build_two_step_explanation(exp)
    if two:
        q["explanation"] = two
        return q

    m3 = ADD_THREE.search(exp)
    if m3:
        a3, b3, c3 = int(m3.group(1)), int(m3.group(2)), int(m3.group(3))
        q["explanation"] = build_three_add_explanation(a3, b3, c3, a3 + b3 + c3)
        return q

    found = find_addition(q)
    if found:
        a, b, res = found
        q["explanation"] = build_add_explanation(a, b, res)

    return q


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

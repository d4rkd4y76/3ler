#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Bölme soruları: dikey bölme markup + ilkokul çözüm açıklamaları."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "bolme-gemini-raw.json"
OUT_PATH = ROOT / "data" / "bolme-islemi-s3-180.json"

DIV_PAIR = re.compile(r"(\d{1,4})\s*[÷/:]\s*(\d{1,4})")
DIV_EQ = re.compile(r"(\d{1,4})\s*[÷/:]\s*(\d{1,4})\s*=\s*(\d{1,4})")
SUB_LINE = re.compile(r"^(\d{1,4})\s*-\s*(\d{1,4})\s*=\s*(\d{1,4})\s*$", re.M)

STEP_DIVIDER = "[[stephr]]"

CONCEPT_ONLY = {
    f"mat3_bol_{i:03d}" for i in range(1, 11)
} | {
    "mat3_bol_071",
    "mat3_bol_072",
    "mat3_bol_073",
    "mat3_bol_074",
    "mat3_bol_075",
    "mat3_bol_076",
    "mat3_bol_077",
}

SKIP_TEXT_VERTICAL = (
    "ne denir",
    "ne ad verilir",
    "hangi işlem",
    "hangi sembol",
    "altın kural",
    "en büyük değer kaçtır",
    "en buyuk deger kactir",
    "ardışık çıkarma",
    "ardisik cikarma",
    "hangi işlemi yapmalıyız",
    "hangi islemi yapmaliyiz",
    "bölme olarak gösterimi",
    "bolme olarak gosterimi",
)

ZIHINDEN_10 = {f"mat3_bol_{i:03d}" for i in range(11, 21)}

ARDISIK = {f"mat3_bol_{i:03d}" for i in range(21, 26)}

PRIMARY_DIV: dict[str, tuple[int, int]] = {
    f"mat3_bol_{i:03d}": pair
    for i, pair in {
        26: (14, 2),
        27: (54, 9),
        28: (24, 3),
        29: (45, 5),
        30: (32, 8),
        31: (49, 7),
        32: (18, 3),
        33: (20, 4),
        34: (12, 6),
        35: (16, 8),
        36: (81, 9),
        37: (21, 7),
        38: (36, 6),
        39: (15, 5),
        40: (12, 3),
    }.items()
}

HALF: dict[str, tuple[int, int]] = {
    f"mat3_bol_{i:03d}": (n, 2)
    for i, n in {
        41: 46,
        42: 56,
        43: 24,
        44: 32,
        45: 60,
        46: 28,
        47: 36,
    }.items()
}

QUARTER: dict[str, tuple[int, int]] = {
    f"mat3_bol_{i:03d}": (n, 4)
    for i, n in {
        48: 28,
        49: 56,
        50: 72,
        51: 36,
        52: 24,
        53: 76,
        54: 80,
        55: 40,
    }.items()
}

WORD_SHARE: dict[str, tuple[int, int]] = {
    f"mat3_bol_{i:03d}": pair
    for i, pair in {
        56: (21, 3),
        57: (30, 5),
        58: (56, 7),
        59: (48, 6),
        60: (36, 6),
        61: (40, 5),
        62: (64, 8),
        63: (42, 7),
        64: (21, 3),
        65: (32, 8),
        66: (15, 3),
        67: (35, 7),
        68: (12, 3),
        69: (28, 7),
        70: (35, 7),
    }.items()
}

REMAINDER_FIND: dict[str, tuple[int, int]] = {
    f"mat3_bol_{i:03d}": pair
    for i, pair in {
        78: (60, 8),
        79: (66, 7),
        80: (41, 6),
        81: (30, 4),
        82: (96, 9),
        83: (26, 6),
        84: (59, 7),
        85: (39, 4),
    }.items()
}

FIND_DIVIDEND: dict[str, tuple[int, int, int, int]] = {
    f"mat3_bol_{i:03d}": data
    for i, data in {
        86: (7, 8, 1, 57),
        87: (5, 7, 1, 36),
        88: (4, 9, 1, 37),
        89: (8, 10, 3, 83),
        90: (7, 8, 6, 62),
        91: (7, 11, 1, 78),
        92: (6, 8, 3, 51),
        93: (6, 8, 3, 51),
        94: (5, 10, 2, 52),
        95: (6, 8, 5, 53),
    }.items()
}

MAX_DIVIDEND: dict[str, tuple[int, int]] = {
    f"mat3_bol_{i:03d}": pair
    for i, pair in {
        96: (7, 10),
        97: (9, 8),
        98: (8, 8),
        99: (9, 8),
        100: (5, 10),
    }.items()
}

MISSING_FACTOR: dict[str, tuple[int, int]] = {
    f"mat3_bol_{i:03d}": pair
    for i, pair in {
        101: (72, 9),
        102: (48, 6),
        103: (66, 6),
        104: (72, 8),
        105: (48, 6),
        106: (81, 9),
        107: (36, 6),
        108: (55, 5),
        109: (25, 5),
        110: (63, 9),
    }.items()
}

TWO_STEP: dict[str, list[tuple[str, int, int, int | None]]] = {
    "mat3_bol_111": [("sub", 44, 12, 32), ("div", 32, 8, 4)],
    "mat3_bol_112": [("sub", 59, 19, 40), ("div", 40, 8, 5)],
    "mat3_bol_113": [("sub", 57, 15, 42), ("div", 42, 6, 7)],
    "mat3_bol_114": [("sub", 53, 17, 36), ("div", 36, 6, 6)],
    "mat3_bol_115": [("sub", 55, 15, 40), ("div", 40, 5, 8)],
    "mat3_bol_116": [("sub", 71, 15, 56), ("div", 56, 7, 8)],
    "mat3_bol_117": [("sub", 62, 14, 48), ("div", 48, 8, 6)],
    "mat3_bol_118": [("add", 20, 25, 45), ("div", 45, 5, 9)],
    "mat3_bol_119": [("add", 27, 27, 54), ("div", 54, 6, 9)],
    "mat3_bol_120": [("add", 18, 24, 42), ("div", 42, 6, 7)],
    "mat3_bol_121": [("add", 29, 27, 56), ("div", 56, 8, 7)],
    "mat3_bol_122": [("add", 26, 16, 42), ("div", 42, 6, 7)],
    "mat3_bol_123": [("add", 19, 17, 36), ("div", 36, 6, 6)],
    "mat3_bol_124": [("add", 21, 28, 49), ("div", 49, 7, 7)],
    "mat3_bol_125": [("mul", 5, 4, 20), ("sub", 28, 20, 8), ("div", 8, 2, 4)],
    "mat3_bol_126": [("mul", 4, 4, 16), ("sub", 20, 16, 4), ("div", 4, 2, 2)],
    "mat3_bol_127": [("mul", 3, 4, 12), ("sub", 34, 12, 22), ("div", 22, 2, 11)],
    "mat3_bol_128": [("mul", 3, 4, 12), ("sub", 20, 12, 8), ("div", 8, 2, 4)],
    "mat3_bol_129": [("mul", 4, 4, 16), ("sub", 36, 16, 20), ("div", 20, 2, 10)],
    "mat3_bol_130": [("mul", 2, 4, 8), ("sub", 36, 8, 28), ("div", 28, 2, 14)],
    "mat3_bol_131": [("sub", 48, 12, 36), ("div", 36, 6, 6)],
    "mat3_bol_132": [("sub", 50, 14, 36), ("div", 36, 4, 9)],
    "mat3_bol_133": [("sub", 60, 18, 42), ("div", 42, 6, 7)],
    "mat3_bol_134": [("sub", 45, 15, 30), ("div", 30, 5, 6)],
    "mat3_bol_135": [("sub", 72, 24, 48), ("div", 48, 8, 6)],
    "mat3_bol_136": [("sub", 56, 16, 40), ("div", 40, 8, 5)],
    "mat3_bol_137": [("sub", 63, 15, 48), ("div", 48, 6, 8)],
    "mat3_bol_138": [("sub", 40, 16, 24), ("div", 24, 3, 8)],
    "mat3_bol_139": [("sub", 55, 19, 36), ("div", 36, 4, 9)],
    "mat3_bol_140": [("sub", 68, 20, 48), ("div", 48, 8, 6)],
    "mat3_bol_141": [("sub", 52, 12, 40), ("div", 40, 5, 8)],
    "mat3_bol_142": [("sub", 46, 10, 36), ("div", 36, 6, 6)],
    "mat3_bol_143": [("sub", 64, 22, 42), ("div", 42, 7, 6)],
    "mat3_bol_144": [("sub", 58, 18, 40), ("div", 40, 5, 8)],
    "mat3_bol_145": [("sub", 75, 27, 48), ("div", 48, 8, 6)],
    "mat3_bol_146": [("add", 22, 26, 48), ("div", 48, 6, 8)],
    "mat3_bol_147": [("add", 24, 18, 42), ("div", 42, 6, 7)],
    "mat3_bol_148": [("add", 15, 25, 40), ("div", 40, 5, 8)],
    "mat3_bol_149": [("add", 19, 23, 42), ("div", 42, 7, 6)],
    "mat3_bol_150": [("add", 28, 14, 42), ("div", 42, 6, 7)],
    "mat3_bol_151": [("add", 16, 32, 48), ("div", 48, 8, 6)],
    "mat3_bol_152": [("add", 25, 20, 45), ("div", 45, 5, 9)],
    "mat3_bol_153": [("add", 17, 19, 36), ("div", 36, 4, 9)],
    "mat3_bol_154": [("add", 23, 25, 48), ("div", 48, 8, 6)],
    "mat3_bol_155": [("add", 14, 28, 42), ("div", 42, 7, 6)],
    "mat3_bol_156": [("add", 21, 27, 48), ("div", 48, 6, 8)],
    "mat3_bol_157": [("add", 18, 30, 48), ("div", 48, 8, 6)],
    "mat3_bol_158": [("add", 26, 22, 48), ("div", 48, 6, 8)],
    "mat3_bol_159": [("add", 20, 16, 36), ("div", 36, 4, 9)],
    "mat3_bol_160": [("add", 24, 24, 48), ("div", 48, 8, 6)],
    "mat3_bol_161": [("mul", 4, 4, 16), ("sub", 32, 16, 16), ("div", 16, 2, 8)],
    "mat3_bol_162": [("mul", 5, 4, 20), ("sub", 40, 20, 20), ("div", 20, 2, 10)],
    "mat3_bol_163": [("mul", 3, 4, 12), ("sub", 24, 12, 12), ("div", 12, 2, 6)],
    "mat3_bol_164": [("mul", 6, 4, 24), ("sub", 44, 24, 20), ("div", 20, 2, 10)],
    "mat3_bol_165": [("mul", 5, 4, 20), ("sub", 36, 20, 16), ("div", 16, 2, 8)],
    "mat3_bol_166": [("mul", 7, 4, 28), ("sub", 52, 28, 24), ("div", 24, 2, 12)],
    "mat3_bol_167": [("mul", 4, 4, 16), ("sub", 30, 16, 14), ("div", 14, 2, 7)],
    "mat3_bol_168": [("mul", 8, 4, 32), ("sub", 48, 32, 16), ("div", 16, 2, 8)],
    "mat3_bol_169": [("mul", 3, 4, 12), ("sub", 26, 12, 14), ("div", 14, 2, 7)],
    "mat3_bol_170": [("mul", 5, 4, 20), ("sub", 38, 20, 18), ("div", 18, 2, 9)],
    "mat3_bol_171": [("mul", 4, 4, 16), ("sub", 28, 16, 12), ("div", 12, 2, 6)],
    "mat3_bol_172": [("mul", 4, 4, 16), ("sub", 34, 16, 18), ("div", 18, 2, 9)],
    "mat3_bol_173": [("mul", 5, 4, 20), ("sub", 42, 20, 22), ("div", 22, 2, 11)],
    "mat3_bol_174": [("mul", 6, 4, 24), ("sub", 50, 24, 26), ("div", 26, 2, 13)],
    "mat3_bol_175": [("mul", 7, 4, 28), ("sub", 36, 28, 8), ("div", 8, 2, 4)],
    "mat3_bol_176": [("sub", 50, 20, 30), ("div", 30, 5, 6)],
    "mat3_bol_177": [("sub", 48, 18, 30), ("div", 30, 6, 5)],
    "mat3_bol_178": [("add", 24, 18, 42), ("div", 42, 7, 6)],
    "mat3_bol_179": [("sub", 56, 20, 36), ("div", 36, 9, 4)],
    "mat3_bol_180": [("mul", 3, 4, 12), ("sub", 28, 12, 16), ("div", 16, 2, 8)],
}


def fmt_final_result(val: str | int) -> str:
    return f"Sonuç: [[result:{val}]]"


def normalize_id(qid: str) -> str:
    return qid.replace("bolme3_", "mat3_bol_")


def fmt_final_result_num(n: int) -> str:
    return fmt_final_result(n)


def _sayi_suffix(n: int, *, iyelik: bool = True) -> str:
    """Türkçe iyelik/belirtme eki — 40'ın, 20'nin, 40'ı, 20'yi …"""
    s = str(n)
    last = s[-1]
    if last == "0" and len(s) > 1:
        tens = s[-2]
        if iyelik:
            m = {
                "1": "'un",
                "2": "'nin",
                "3": "'un",
                "4": "'ın",
                "5": "'nin",
                "6": "'nın",
                "7": "'nin",
                "8": "'in",
                "9": "'un",
            }
        else:
            m = {
                "1": "'u",
                "2": "'yi",
                "3": "'ü",
                "4": "'ı",
                "5": "'i",
                "6": "'yı",
                "7": "'yi",
                "8": "'i",
                "9": "'u",
            }
        default = "'ın" if iyelik else "'ı"
        return f"{n}{m.get(tens, default)}"
    if iyelik:
        m = {
            "0": "'ın",
            "1": "'in",
            "2": "'nin",
            "3": "'ün",
            "4": "'ün",
            "5": "'in",
            "6": "'nın",
            "7": "'nin",
            "8": "'in",
            "9": "'un",
        }
    else:
        m = {
            "0": "'ı",
            "1": "'i",
            "2": "'yi",
            "3": "'ü",
            "4": "'ü",
            "5": "'i",
            "6": "'yı",
            "7": "'yi",
            "8": "'i",
            "9": "'u",
        }
    return f"{n}{m[last]}"


def sayi_gen(n: int) -> str:
    return _sayi_suffix(n, iyelik=True)


def bolunen_form(n: int) -> str:
    return _sayi_suffix(n, iyelik=False)


def bolen_form(n: int) -> str:
    last = str(n)[-1]
    if last == "2":
        return f"{n}'ye"
    if last == "6":
        return f"{n}'ya"
    if last in "09":
        return f"{n}'a"
    if last in "37":
        return f"{n}'e"
    return f"{n}'e"


def sayi_icinde(n: int) -> str:
    return f"{sayi_gen(n)} içinde"


def sayi_altina(n: int) -> str:
    return f"{sayi_gen(n)} altına"


def fix_typos(text: str) -> str:
    return (text or "").replace("kalemyi", "kalemi")


def div_intro(a: int, b: int) -> str:
    return f"{bolunen_form(a)} {bolen_form(b)} böleriz."


def div_why_open(a: int, b: int, *, reason: str = "") -> str:
    if reason:
        return reason
    return (
        f"Soruda verilen sayıyı **{b}**'erli eşit gruplara ayırmamız gerekiyor. "
        f"Bunun için **{bolunen_form(a)} {bolen_form(b)}** bölüyoruz — "
        f"bölme, paylaştırmanın ve gruplamanın kısa yoludur."
    )


def div_formula_check(a: int, b: int, q: int | None = None, r: int | None = None) -> str:
    qv = a // b if q is None else q
    rv = a % b if r is None else r
    if rv:
        return (
            f"**Kontrol:** (Bölen × Bölüm) + Kalan = ({b} × {qv}) + {rv} = "
            f"**{b * qv + rv}** → bölünen **{a}** olur."
        )
    return f"**Kontrol:** Bölen × Bölüm = {b} × {qv} = **{a}** → doğru."


def compute_div_steps(dividend: int, divisor: int) -> list[str]:
    """İlkokul bölme adımları — 1-2 basamaklı bölünen, tek basamaklı bölen."""
    b = divisor
    ds = str(dividend)
    steps: list[str] = []

    if len(ds) == 1:
        d = int(ds[0])
        q, rem = divmod(d, b)
        steps.append(
            f"**{sayi_gen(d)}** içinde **{b}** kaç kez vardır? **{q}** kez. Bölüme **{q}** yazarız."
        )
        if q * b:
            steps.append(
                f"**{sayi_gen(d)}** altına **{q * b}** yazıp çıkarırız: **{d} − {q * b} = {rem}**."
            )
        if rem:
            steps.append(f"Kalan **{rem}**'dir.")
        return steps

    if len(ds) == 2:
        d1, d2 = int(ds[0]), int(ds[1])
        if d1 >= b:
            q1, r1 = divmod(d1, b)
            steps.append(
                f"**{dividend}** sayısında **onlar basamağına ({d1})** bakarız. "
                f"**{sayi_gen(d1)}** içinde **{b}** kaç kez vardır? **{q1}** kez. Bölüme **{q1}** yazarız."
            )
            steps.append(
                f"**{sayi_gen(d1)}** altına **{q1 * b}** yazıp çıkarırız: **{d1} − {q1 * b} = {r1}**."
            )
            work = r1 * 10 + d2
            steps.append(
                f"Sonraki adımda sayının **birler basamağını aşağıya indiririz ({d2})** → **{work}** olur. "
                f"**{sayi_gen(work)}** içinde **{b}** kaç kez vardır? **{work // b if work else 0}** kez. "
                f"Bölüme **{work // b if work else 0}** yazarız."
            )
            if work:
                p2 = (work // b) * b
                r2 = work % b
                steps.append(
                    f"**{sayi_gen(work)}** altına **{p2}** yazıp çıkarırız: "
                    f"**{work} − {p2} = {r2}**."
                )
            return steps

        else:
            work = d1 * 10 + d2
            q, rem = divmod(work, b)
            steps.append(
                f"**{dividend}** sayısında **onlar basamağı ({d1})** {b}'ten küçük; "
                f"yukarıdaki sayının **birler basamağını aşağıya indiririz ({d2})** → **{work}** olur."
            )
            steps.append(
                f"**{sayi_gen(work)}** içinde **{b}** kaç kez vardır? **{q}** kez. Bölüme **{q}** yazarız."
            )
            steps.append(
                f"**{sayi_gen(work)}** altına **{q * b}** yazıp çıkarırız: **{work} − {q * b} = {rem}**."
            )
            if rem:
                steps.append(f"Kalan **{rem}**'dir.")
            return steps

    # 3+ basamak — genel kısa yol
    q, rem = divmod(dividend, b)
    steps.append(
        f"**{sayi_gen(dividend)}** içinde **{b}** kaç kez vardır? **{q}** kez."
    )
    steps.append(f"Bölüme **{q}** yazarız.")
    if rem:
        steps.append(f"Kalan **{rem}**'dir.")
    return steps


def append_div_step_lines(lines: list[str], step_lines: list[str], a: int, b: int) -> None:
    for i, sl in enumerate(step_lines, 1):
        if i > 1:
            lines.append(STEP_DIVIDER)
        lines.append(f"[[divstep:{a}÷{b}:{i}]]")
        lines.append(f"**{i}. adım**")
        lines.append(sl)


def build_div_explanation(
    a: int,
    b: int,
    *,
    result: int | str | None = None,
    step_only: bool = False,
    ask_remainder: bool = False,
    why: str = "",
) -> str:
    quotient, remainder = divmod(a, b)
    if ask_remainder:
        final = remainder
    elif result is not None:
        final = result
    else:
        final = quotient
    lines = [div_why_open(a, b, reason=why)]
    append_div_step_lines(lines, compute_div_steps(a, b), a, b)
    if not step_only:
        lines.append(STEP_DIVIDER)
        if not ask_remainder:
            lines.append(div_formula_check(a, b, quotient, remainder))
        lines.append(fmt_final_result(final))
    return "\n".join(lines)


def build_table_div_explanation(a: int, b: int, result: int) -> str:
    why = (
        f"Çarpım tablosunu kullanarak **{bolunen_form(a)} {bolen_form(b)}** bölüyoruz. "
        f"Çünkü **{b} × ? = {a}** sorusunun cevabını arıyoruz."
    )
    lines = [why]
    append_div_step_lines(lines, compute_div_steps(a, b), a, b)
    lines.append(STEP_DIVIDER)
    lines.append(div_formula_check(a, b, result, a % b))
    lines.append(fmt_final_result_num(result))
    return "\n".join(lines)


def build_half_explanation(n: int, result: int) -> str:
    lines = [
        f"**Yarım** demek, bütünü **2 eşit parçaya** bölmek demektir. "
        f"{n} sayısının yarısını bulmak için {bolunen_form(n)} 2'ye böleriz.",
    ]
    append_div_step_lines(lines, compute_div_steps(n, 2), n, 2)
    lines.append(STEP_DIVIDER)
    lines.append(div_formula_check(n, 2, result, n - result * 2))
    lines.append(fmt_final_result_num(result))
    return "\n".join(lines)


def build_quarter_explanation(n: int, result: int) -> str:
    lines = [
        f"**Çeyrek** demek, bütünü **4 eşit parçaya** bölmek demektir. "
        f"{n} sayısının çeyreğini bulmak için {bolunen_form(n)} 4'e böleriz.",
    ]
    append_div_step_lines(lines, compute_div_steps(n, 4), n, 4)
    lines.append(STEP_DIVIDER)
    lines.append(div_formula_check(n, 4, result, n - result * 4))
    lines.append(fmt_final_result_num(result))
    return "\n".join(lines)


def build_share_explanation(total: int, groups: int, result: int) -> str:
    why = (
        f"**{total}** tane nesneyi **{groups}** kişiye veya gruba **eşit** paylaştırmak için "
        f"{bolunen_form(total)} {bolen_form(groups)} böleriz."
    )
    lines = [why]
    append_div_step_lines(lines, compute_div_steps(total, groups), total, groups)
    lines.append(STEP_DIVIDER)
    lines.append(div_formula_check(total, groups, result, total - result * groups))
    lines.append(fmt_final_result_num(result))
    return "\n".join(lines)


def build_zihinden_10_explanation(n: int, result: int) -> str:
    return (
        "Zihinden **10**'a bölerken sayının sonundaki **bir sıfırı sileriz**.\n\n"
        f"[[div:{n}÷10]]\n"
        f"**{n} ÷ 10 = {result}**\n"
        + fmt_final_result_num(result)
    )


def build_max_remainder_explanation(divisor: int, result: int) -> str:
    return (
        "Bölme işleminde **kalan, bölen sayıdan küçük** olmalıdır.\n\n"
        f"Bölen **{divisor}** olduğuna göre kalan en fazla **{divisor - 1}** olabilir.\n"
        + fmt_final_result(result)
    )


def build_find_dividend_explanation(b: int, q: int, r: int, dividend: int) -> str:
    lines = [
        "Bölünen sorulmadığı için **(Bölen × Bölüm) + Kalan = Bölünen** kuralını kullanırız.",
        f"**({b} × {q}) + {r} = {b * q} + {r} = {dividend}** → bölünen **{dividend}** olmalı.",
        f"Doğrulamak için {bolunen_form(dividend)} {bolen_form(b)} bölelim:",
    ]
    append_div_step_lines(lines, compute_div_steps(dividend, b), dividend, b)
    lines.append(STEP_DIVIDER)
    lines.append(div_formula_check(dividend, b, q, r))
    lines.append(fmt_final_result_num(dividend))
    return "\n".join(lines)


def build_max_dividend_explanation(b: int, q: int, result: int) -> str:
    max_rem = b - 1
    return (
        "Bölünenin en büyük olması için kalanın alabileceği **en büyük değeri** alırız.\n\n"
        f"Bölen **{b}** → kalan en fazla **{max_rem}**.\n"
        f"**({b} × {q}) + {max_rem} = {result}**\n"
        + fmt_final_result_num(result)
    )


def build_missing_factor_explanation(product: int, factor: int, result: int) -> str:
    why = (
        f"**{factor} × ? = {product}** sorusunun cevabını bulmak için "
        f"{bolunen_form(product)} {bolen_form(factor)} böleriz."
    )
    lines = [why]
    append_div_step_lines(lines, compute_div_steps(product, factor), product, factor)
    lines.append(STEP_DIVIDER)
    lines.append(div_formula_check(product, factor, result, product - result * factor))
    lines.append(f"Doğru cevap: Bölme, {result}")
    return "\n".join(lines)


SUB_MARKUP_LINE = re.compile(r"\[\[sub:(\d+)-(\d+)\]\]\s*=\s*(\d+)")
SUB_INLINE = re.compile(r"^(\d{1,4})\s*-\s*(\d{1,4})\s*=\s*(\d{1,4})\s*$")


def parse_ardisik_subs(text: str) -> list[tuple[int, int, int]]:
    subs: list[tuple[int, int, int]] = []
    for m in SUB_MARKUP_LINE.finditer(text or ""):
        subs.append((int(m.group(1)), int(m.group(2)), int(m.group(3))))
    if subs:
        return subs
    for line in (text or "").splitlines():
        m = SUB_INLINE.match(line.strip())
        if m:
            subs.append((int(m.group(1)), int(m.group(2)), int(m.group(3))))
    return subs


def ardisik_steps_text(subs: list[tuple[int, int, int]]) -> str:
    lines = []
    for i, (a, b, c) in enumerate(subs, 1):
        lines.append(f"**{i}. adım:** {a} − {b} = **{c}**")
    return "\n".join(lines)


def build_ardisik_explanation(q: dict, subs: list[tuple[int, int, int]] | None = None) -> str:
    subs = subs or parse_ardisik_subs(q.get("text") or "")
    div_m = DIV_EQ.search(q.get("correct") or "")
    if not subs or not div_m:
        return q.get("explanation") or ""
    start, sub_val, _ = subs[0]
    a, b, res = int(div_m.group(1)), int(div_m.group(2)), int(div_m.group(3))
    div_lines: list[str] = []
    append_div_step_lines(div_lines, compute_div_steps(a, b), a, b)
    div_lines.append(STEP_DIVIDER)
    div_lines.append(div_formula_check(a, b, res, a % b))
    div_lines.append(fmt_final_result_num(res))
    return (
        f"**{start}** sayısından **{sub_val}**'er **{sub_val}**'er çıkarıyoruz:\n\n"
        f"{ardisik_steps_text(subs)}\n\n"
        f"Aynı sayıyı tekrar tekrar çıkarmak yerine kısa yol **bölmedir**: "
        f"**{sub_val}**, **{sayi_gen(start)}** içinde tam **{res}** kez vardır → **{a} ÷ {b} = {res}**.\n\n"
        + "\n".join(div_lines)
        + f"\n{STEP_DIVIDER}\nDoğru cevap: **{q['correct']}**"
    )


def build_sub_explanation_short(a: int, b: int, result: int | None = None, *, step_only: bool = False) -> str:
    from patch_cikarma_gemini import build_sub_explanation

    return build_sub_explanation(a, b, result, step_only=step_only)


def build_add_explanation_short(a: int, b: int, result: int | None = None, *, step_only: bool = False) -> str:
    from patch_toplama_gemini import build_add_explanation

    body = build_add_explanation(a, b, result)
    if step_only:
        body = body.replace(fmt_final_result_num(result if result is not None else a + b), f"→ **{result if result is not None else a + b}**")
    return body


def build_mul_explanation_short(a: int, b: int, result: int | None = None, *, step_only: bool = False) -> str:
    from patch_carpma_gemini import build_mul_explanation

    return build_mul_explanation(a, b, result, step_only=step_only)


def build_two_step_explanation(steps: list[tuple[str, int, int, int | None]]) -> str:
    n = len(steps)
    lines = [f"**{n} adımlı problem**:"]
    for i, item in enumerate(steps, 1):
        if i > 1:
            lines.append(STEP_DIVIDER)
        op, a, b, res = item
        lines.append(f"**{i}. adım**")
        if op == "div":
            body = build_div_explanation(a, b, result=res, step_only=True)
        elif op == "mul":
            body = build_mul_explanation_short(a, b, res, step_only=True)
        elif op == "add":
            body = build_add_explanation_short(a, b, res, step_only=True)
        else:
            body = build_sub_explanation_short(a, b, res, step_only=True)
        lines.extend(body.split("\n"))
    last = steps[-1]
    final = last[3]
    lines.append(STEP_DIVIDER)
    lines.append(fmt_final_result(final))
    return "\n".join(lines)


def patch_ardisik_question(q: dict) -> dict:
    text = q.get("text") or ""
    subs = parse_ardisik_subs(text)
    intro = (q.get("premise") or "Ardışık çıkarma işlemi bölmenin temelidir.").strip()
    q["premise"] = intro + "\n\n" + ardisik_steps_text(subs)
    q["text"] = (
        "Yukarıdaki ardışık çıkarma işleminin bölme olarak gösterimi hangisidir?"
    )
    q["explanation"] = build_ardisik_explanation(q, subs)
    return q


def should_vertical_in_text(text: str) -> bool:
    t = (text or "").lower()
    return not any(k in t for k in SKIP_TEXT_VERTICAL)


def find_div_in_text(text: str) -> tuple[int, int] | None:
    m = DIV_PAIR.search(text or "")
    if m:
        return int(m.group(1)), int(m.group(2))
    return None


def patch_question(q: dict) -> dict:
    q = dict(q)
    q["id"] = normalize_id(q.get("id", ""))
    qid = q["id"]
    text = fix_typos((q.get("text") or "").strip())
    q["text"] = text
    if q.get("premise"):
        q["premise"] = fix_typos(str(q["premise"]).strip())

    if qid in CONCEPT_ONLY:
        return enhance_concept_explanation(q)

    if qid in TWO_STEP:
        q["explanation"] = build_two_step_explanation(TWO_STEP[qid])
        return q

    if qid in ARDISIK:
        q = patch_ardisik_question(q)
        return q

    if qid in ZIHINDEN_10:
        m = DIV_PAIR.search(text)
        n = int(m.group(1)) if m else int(q["correct"]) * 10
        res = int(q["correct"])
        q["text"] = DIV_PAIR.sub(r"[[div:\1÷\2]]", text, count=1) if m else text
        q["explanation"] = build_zihinden_10_explanation(n, res)
        return q

    if qid in PRIMARY_DIV:
        a, b = PRIMARY_DIV[qid]
        res = int(q["correct"])
        q["text"] = DIV_PAIR.sub(r"[[div:\1÷\2]]", text, count=1) if "[[div:" not in text else text
        q["explanation"] = build_table_div_explanation(a, b, res)
        return q

    if qid in HALF:
        n, _ = HALF[qid]
        res = int(q["correct"])
        q["explanation"] = build_half_explanation(n, res)
        return q

    if qid in QUARTER:
        n, _ = QUARTER[qid]
        res = int(q["correct"])
        q["explanation"] = build_quarter_explanation(n, res)
        return q

    if qid in WORD_SHARE:
        total, groups = WORD_SHARE[qid]
        res = int(q["correct"])
        q["explanation"] = build_share_explanation(total, groups, res)
        return q

    if qid in REMAINDER_FIND:
        a, b = REMAINDER_FIND[qid]
        res = int(q["correct"])
        q["explanation"] = build_div_explanation(a, b, result=res, ask_remainder=True)
        return q

    if qid in FIND_DIVIDEND:
        b, quot, rem, dividend = FIND_DIVIDEND[qid]
        q["explanation"] = build_find_dividend_explanation(b, quot, rem, dividend)
        return q

    if qid in MAX_DIVIDEND:
        b, quot = MAX_DIVIDEND[qid]
        res = int(q["correct"])
        q["explanation"] = build_max_dividend_explanation(b, quot, res)
        return q

    if qid in MISSING_FACTOR:
        product, factor = MISSING_FACTOR[qid]
        _, result_str = q["correct"].split(", ")
        result = int(result_str.strip())
        q["explanation"] = build_missing_factor_explanation(product, factor, result)
        return q

    if qid in {f"mat3_bol_{i:03d}" for i in range(71, 78)}:
        m = re.search(r"bölen sayı (\d+)", q.get("premise") or "", re.I)
        divisor = int(m.group(1)) if m else int(q["correct"]) + 1
        q["explanation"] = build_max_remainder_explanation(divisor, int(q["correct"]))
        return q

    if should_vertical_in_text(text) and "[[div:" not in text:
        found = find_div_in_text(text)
        if found:
            a, b = found
            q["text"] = DIV_PAIR.sub(r"[[div:\1÷\2]]", text, count=1)
            if str(q.get("correct", "")).isdigit():
                q["explanation"] = build_div_explanation(a, b, result=int(q["correct"]))
            return q

    m = DIV_PAIR.search(q.get("explanation") or "")
    if m and str(q.get("correct", "")).isdigit():
        a, b = int(m.group(1)), int(m.group(2))
        q["explanation"] = build_div_explanation(a, b, result=int(q["correct"]))
        return q

    return q


def enhance_concept_explanation(q: dict) -> dict:
    expl = (q.get("explanation") or "").strip()
    qid = q.get("id", "")
    if qid == "mat3_bol_010" and "Bölünen = Bölen" not in expl:
        q["explanation"] = (
            expl
            + "\n\n**Bölünen = Bölen × Bölüm** formülünü kullanırız.\n"
            "Örnek: [[div:24÷6]] → [[divsol:24÷6]] → **6 × 4 = 24**"
        )
    elif qid == "mat3_bol_004":
        q["explanation"] = (
            "Bölme, aynı sayıyı tekrar tekrar çıkarmanın kısa yoludur.\n\n"
            "Örnek: 15 − 5 − 5 − 5 = 0\n"
            "[[subsol:15-5]] → [[subsol:10-5]] → [[subsol:5-5]]\n"
            "Bu işlem **15 ÷ 5 = 3** ile aynıdır.\n"
            "[[div:15÷5]]\n[[divsol:15÷5]]"
        )
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
    raw = load_raw()
    out = [patch_question(q) for q in raw]

    from question_build_common import write_json_pack

    write_json_pack(
        out,
        data_path=OUT_PATH,
        topic_id="t07",
        title="Bölme İşlemi (Kalanlı ve kalansız bölme)",
        grade=3,
        lesson_id="lesson_matematik",
    )
    vertical = sum(1 for q in out if "[[div:" in q.get("text", ""))
    divstep = sum(1 for q in out if "[[divstep:" in q.get("explanation", ""))
    print(f"Guncellendi: {len(out)} soru, {vertical} dikey soru metni, {divstep} divstep aciklama")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

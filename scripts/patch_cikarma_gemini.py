#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cikarma sorulari: dikey cikarma markup + ilkokul cozum aciklamalari."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "cikarma-gemini-raw.json"
OUT_PATH = ROOT / "data" / "uclu-basamakli-cikarma-s3-150.json"

SUB_PAIR = re.compile(r"(\d{2,4})\s*-\s*(\d{2,4})")
SUB_EQ = re.compile(r"(\d{2,4})\s*-\s*(\d{2,4})\s*=\s*(\d{2,4})")
ADD_EQ = re.compile(r"(\d{2,4})\s*\+\s*(\d{2,4})\s*=\s*(\d{2,4})")
ADD_PAIR = re.compile(r"(\d{2,4})\s*\+\s*(\d{2,4})")
EKSIK = re.compile(r"(\d{2,4})\s+eksiği", re.I)

SKIP_TEXT_VERTICAL = (
    "zihinden",
    "......",
    "ne ad verilir",
    "sonucuna ne ad",
    "etkisiz",
    "nasıl değişir",
    "nasıl degisir",
    "fark nasıl",
    "fark nasil",
    "yeni fark",
    "toplamı 840",
    "toplamı 600",
    "a + b",
    "a +",
    "rakamları birbirinden",
    "rakamlari birbirinden",
    "en büyük",
    "en buyuk",
    "en küçük",
    "en kucuk",
    "yuvarla",
    "tahmini sonuç kaç",
    "tahmini sonuc kac",
    "6a4",
    "1■6",
    "■",
)

CONCEPT_ONLY = {
    "mat3_cikarma_001",
    "mat3_cikarma_002",
    "mat3_cikarma_003",
    "mat3_cikarma_059",
    "mat3_cikarma_068",
    "mat3_cikarma_069",
}

TWO_STEP: dict[str, list[tuple[str, int, int, int | None]]] = {
    "mat3_cikarma_036": [("add", 128, 145, 273), ("sub", 450, 273, 177)],
    "mat3_cikarma_055": [("add", 245, 368, 613), ("sub", 900, 613, 287)],
    "mat3_cikarma_057": [("sub", 600, 245, 355), ("sub", 355, 120, 235)],
    "mat3_cikarma_060": [("add", 803, 248, 1051), ("add", 1051, 175, 1226), ("sub", 1500, 1226, 274)],
    "mat3_cikarma_061": [("add", 180, 245, 425), ("sub", 450, 160, 290), ("sub", 425, 290, 135)],
    "mat3_cikarma_062": [("sub", 186, 35, 151), ("add", 186, 151, 337), ("sub", 500, 337, 163)],
    "mat3_cikarma_064": [("add", 185, 265, 450), ("sub", 450, 300, 150)],
    "mat3_cikarma_065": [("sub", 904, 146, 758), ("add", 758, 215, 973)],
    "mat3_cikarma_066": [("sub", 500, 140, 360), ("add", 360, 275, 635)],
    "mat3_cikarma_067": [("add", 345, 185, 530), ("sub", 850, 530, 320)],
    "mat3_cikarma_072": [("add", 285, 340, 625), ("sub", 900, 625, 275)],
    "mat3_cikarma_073": [("add", 314, 256, 570), ("sub", 800, 570, 230)],
}

REVERSE_ADD: dict[str, tuple[int, int, int]] = {
    "mat3_cikarma_030": (320, 145, 465),
    "mat3_cikarma_032": (258, 146, 404),
    "mat3_cikarma_042": (340, 185, 525),
    "mat3_cikarma_045": (198, 235, 433),
    "mat3_cikarma_064": (185, 265, 450),
}

PRIMARY_SUB: dict[str, tuple[int, int]] = {
    "mat3_cikarma_008": (568, 245),
    "mat3_cikarma_014": (350, 120),
    "mat3_cikarma_015": (480, 250),
    "mat3_cikarma_016": (456, 234),
    "mat3_cikarma_017": (275, 142),
    "mat3_cikarma_018": (895, 452),
    "mat3_cikarma_019": (650, 320),
    "mat3_cikarma_020": (785, 350),
    "mat3_cikarma_021": (58, 23),
    "mat3_cikarma_022": (648, 215),
    "mat3_cikarma_023": (960, 420),
    "mat3_cikarma_025": (68, 15),
    "mat3_cikarma_031": (600, 240),
    "mat3_cikarma_033": (512, 185),
    "mat3_cikarma_034": (435, 289),
    "mat3_cikarma_035": (812, 456),
    "mat3_cikarma_037": (605, 148),
    "mat3_cikarma_038": (142, 115),
    "mat3_cikarma_039": (500, 215),
    "mat3_cikarma_040": (725, 348),
    "mat3_cikarma_041": (412, 186),
    "mat3_cikarma_043": (42, 15),
    "mat3_cikarma_044": (510, 245),
    "mat3_cikarma_046": (342, 168),
    "mat3_cikarma_047": (650, 275),
    "mat3_cikarma_048": (987, 450),
    "mat3_cikarma_049": (400, 165),
    "mat3_cikarma_053": (584, 239),
    "mat3_cikarma_058": (986, 103),
    "mat3_cikarma_063": (840, 408),
    "mat3_cikarma_070": (800, 49),
    "mat3_cikarma_074": (38, 29),
    "mat3_cikarma_075": (384, 238),
}

ZIHINDEN: dict[str, tuple[int, int, str]] = {
    "mat3_cikarma_009": (700, 300, "Sadece yüzlükleri düşün: 7 yüzlük − 3 yüzlük = 4 yüzlük."),
    "mat3_cikarma_010": (850, 40, "Onluk basamağında işlem yap: 5 onluk − 4 onluk = 1 onluk."),
    "mat3_cikarma_011": (600, 200, "Yüzlükleri çıkar: 6 yüzlük − 2 yüzlük = 4 yüzlük."),
    "mat3_cikarma_012": (980, 50, "Onlukları düşün: 98 onluk − 5 onluk = 93 onluk."),
    "mat3_cikarma_013": (470, 60, "Onluk basamağında: 7 onluk − 6 onluk = 1 onluk."),
}


STEP_DIVIDER = "[[stephr]]"

PLACE_SHORT = {
    "birler": "Birler",
    "onlar": "Onlar",
    "yüzler": "Yüzler",
}


def fmt_final_result(n: int) -> str:
    return f"Sonuç: [[result:{n}]]"


def place_label(place: str) -> str:
    return PLACE_SHORT.get(place, place.capitalize())


def place_names(length: int) -> list[str]:
    from math_place_utils import place_names as _pn

    return _pn(length)


def compute_sub_steps(a: int, b: int) -> tuple[list[dict], int, bool, bool]:
    sa, sb = str(a), str(b)
    length = max(len(sa), len(sb))
    da = [int(c) for c in sa.zfill(length)]
    db = [int(c) for c in sb.zfill(length)]
    names = place_names(length)
    work = da[:]
    steps: list[dict] = []
    any_borrow = False
    hundred_borrow = False

    for i in range(length - 1, -1, -1):
        available = work[i]
        bottom = db[i]
        borrowed = False
        borrow_from = None
        borrow_from_name = None
        cascade_zero = False
        top = available
        if top < bottom:
            any_borrow = True
            borrowed = True
            k = i - 1
            zero_idxs: list[int] = []
            while k >= 0 and work[k] == 0:
                zero_idxs.append(k)
                work[k] = 9
                k -= 1
            if zero_idxs:
                cascade_zero = True
            if k >= 0:
                borrow_from = k
                borrow_from_name = names[k] if k < len(names) else None
                if k == 0 and length == 3:
                    hundred_borrow = True
                work[k] -= 1
            top = work[i] + 10
        digit = top - bottom
        place = names[i] if i < len(names) else f"{i + 1}. basamak"
        lent = (not borrowed) and available < da[i]
        lent_to_name = names[i + 1] if lent and i + 1 < len(names) else None
        steps.append(
            {
                "place": place,
                "da": da[i],
                "db": bottom,
                "available": available,
                "top": top,
                "borrowed": borrowed,
                "borrow_from_name": borrow_from_name,
                "cascade_zero": cascade_zero,
                "lent": lent,
                "lent_to_name": lent_to_name,
                "digit": digit,
            },
        )
    return steps, a - b, any_borrow, hundred_borrow


def sub_title(any_borrow: bool, hundred_borrow: bool) -> str:
    if not any_borrow:
        return "Onluk bozmadan çıkarma"
    if hundred_borrow:
        return "Onluk ve yüzlük bozarak çıkarma"
    return "Onluk bozarak çıkarma"


def sub_step_line(step: dict) -> str:
    from math_place_utils import rakam_ablative

    label = place_label(step["place"])
    da, db, digit = step["da"], step["db"], step["digit"]
    if step["borrowed"]:
        eff = step["available"]
        top = step["top"]
        kaynak = rakam_ablative(eff)
        if step.get("cascade_zero"):
            calc = f"{top} − {db} = **{digit}**"
            body = f"{kaynak} {db} çıkmaz · sola boz · {calc}"
        else:
            calc = f"{top} − {db} = **{digit}**"
            body = f"{kaynak} {db} çıkmaz · onluk al · {calc}"
    elif step.get("lent"):
        avail = step["available"]
        body = f"Onluk verdik · {avail} − {db} = **{digit}**"
    else:
        avail = step.get("available", da)
        body = f"{avail} − {db} = **{digit}**"
    return f"**{label} basamağı**\n{body}"


def build_zihinden_explanation(a: int, b: int, hint: str) -> str:
    _, calc, any_borrow, _ = compute_sub_steps(a, b)
    title = sub_title(any_borrow, False)
    return f"{hint}\n\n{title}:\n[[subsol:{a}-{b}]]\n{fmt_final_result(calc)}"


def build_sub_explanation(
    a: int, b: int, result: int | None = None, *, step_only: bool = False
) -> str:
    steps, calc, any_borrow, hundred_borrow = compute_sub_steps(a, b)
    if result is None:
        result = calc
    title = sub_title(any_borrow, hundred_borrow)
    lines = [f"{title}:", f"[[subsol:{a}-{b}]]"]
    for i, s in enumerate(steps):
        if i > 0:
            lines.append(STEP_DIVIDER)
        lines.append(sub_step_line(s))
    if step_only:
        lines.append(f"→ **{result}**")
    else:
        lines.append(fmt_final_result(result))
    return "\n".join(lines)


def compute_add_steps(a: int, b: int) -> tuple[list[dict], int]:
    from patch_toplama_gemini import compute_add_steps as _add

    return _add(a, b)


def add_step_line(step: dict) -> str:
    from patch_toplama_gemini import step_line

    return step_line(step)


def build_add_explanation(
    a: int, b: int, result: int | None = None, *, step_only: bool = False
) -> str:
    steps, calc = compute_add_steps(a, b)
    if result is None:
        result = calc
    eldeli = any(s["carry_out"] for s in steps)
    title = "Eldeli toplama" if eldeli else "Eldesiz toplama"
    lines = [f"{title} (ters işlem):", f"[[addsol:{a}+{b}]]"]
    for i, s in enumerate(steps):
        if i > 0:
            lines.append(STEP_DIVIDER)
        lines.append(add_step_line_short(s))
    if step_only:
        lines.append(f"→ **{result}**")
    else:
        lines.append(fmt_final_result(result))
    return "\n".join(lines)


def add_step_line_short(step: dict) -> str:
    p = place_label(step["place"])
    da, db = step["da"], step["db"]
    cin, cout, digit = step["carry_in"], step["carry_out"], step["digit"]
    if cin and cout:
        body = f"{da} + {db} + elde {cin} = **{digit}** · 1 elde"
    elif cout:
        body = f"{da} + {db} = **{digit}** · 1 elde"
    elif cin:
        body = f"{da} + {db} + elde {cin} = **{digit}**"
    else:
        body = f"{da} + {db} = **{digit}**"
    return f"**{p} basamağı**\n{body}"


def build_two_step_explanation(steps: list[tuple[str, int, int, int | None]]) -> str:
    n = len(steps)
    lines = [f"**{n} adımlı problem**:"]
    for i, item in enumerate(steps, 1):
        if i > 1:
            lines.append(STEP_DIVIDER)
        op, a, b, res = item
        lines.append(f"**{i}. adım**")
        if op == "sub":
            body = build_sub_explanation(a, b, res, step_only=True)
        else:
            body = build_add_explanation(a, b, res, step_only=True)
        lines.extend(body.split("\n"))
    last = steps[-1]
    if last[0] == "sub":
        _, a, b, res = last
        final = res if res is not None else a - b
    else:
        _, a, b, res = last
        final = res if res is not None else a + b
    lines.append(STEP_DIVIDER)
    lines.append(fmt_final_result(final))
    return "\n".join(lines)


def normalize_sub_markup(text: str) -> str:
    t = text or ""
    while "[[sub:[[sub:" in t:
        t = t.replace("[[sub:[[sub:", "[[sub:").replace("]]]]", "]]")
    return t


def should_vertical_in_text(text: str) -> bool:
    t = (text or "").lower()
    if any(s in t for s in SKIP_TEXT_VERTICAL):
        return False
    return bool(SUB_PAIR.search(text or ""))


def find_subtraction_in_text(text: str) -> tuple[int, int] | None:
    m = SUB_PAIR.search(text or "")
    if m:
        return int(m.group(1)), int(m.group(2))
    return None


def patch_question(q: dict) -> dict:
    q = dict(q)
    qid = q.get("id", "")
    text = normalize_sub_markup((q.get("text") or "").strip())
    q["text"] = text

    if qid in CONCEPT_ONLY:
        return apply_why(q)

    if qid in TWO_STEP:
        q["explanation"] = build_two_step_explanation(TWO_STEP[qid])
        return apply_why(q)

    if qid in REVERSE_ADD:
        a, b, res = REVERSE_ADD[qid]
        q["explanation"] = build_add_explanation(a, b, res)
        return apply_why(q)

    if qid == "mat3_cikarma_056":
        q["explanation"] = (
            "Eksilen + çıkan + fark = 2 × eksilen kuralı uygulanır.\n"
            "840 ÷ 2 = **420** → eksilen **420**'dir."
        )
        return apply_why(q)

    if qid == "mat3_cikarma_053":
        q["explanation"] = (
            "584 → **580**, 239 → **240** (en yakın onluğa yuvarlama).\n"
            "Tahmini fark:\n"
            + build_sub_explanation(580, 240, 340, step_only=True)
            + "\n"
            + STEP_DIVIDER
            + "\nGerçek fark:\n"
            + build_sub_explanation(584, 239, 345, step_only=True)
            + f"\n\n345 − 340 = **5** fark vardır."
        )
        return apply_why(q)

    if qid == "mat3_cikarma_054":
        q["explanation"] = (
            "814 → **810**, 485 → **490** (en yakın onluğa yuvarlama).\n"
            "Tahmini fark:\n"
            + build_sub_explanation(810, 490, 320)
        )
        return apply_why(q)

    if qid in ZIHINDEN:
        a, b, hint = ZIHINDEN[qid]
        q["explanation"] = build_zihinden_explanation(a, b, hint)
        if "[[sub:" not in text:
            q["text"] = SUB_PAIR.sub(r"[[sub:\1-\2]]", text, count=1) if SUB_PAIR.search(text) else text
        return apply_why(q)

    if qid == "mat3_cikarma_071":
        q["explanation"] = (
            "Eksilen = 600 ÷ 2 = **300**.\n"
            + build_sub_explanation(300, 125, 175)
        )
        return apply_why(q)

    if qid in PRIMARY_SUB:
        a, b = PRIMARY_SUB[qid]
        q["explanation"] = build_sub_explanation(a, b)
        return apply_why(q)

    if should_vertical_in_text(text) and "[[sub:" not in text:
        found = find_subtraction_in_text(text)
        if found:
            a, b = found
            q["text"] = SUB_PAIR.sub(r"[[sub:\1-\2]]", text, count=1)
            q["explanation"] = build_sub_explanation(a, b, int(q["correct"]) if str(q.get("correct", "")).isdigit() else None)
            return apply_why(q)

    m = SUB_EQ.search(q.get("explanation") or "")
    if m:
        a, b, res = int(m.group(1)), int(m.group(2)), int(m.group(3))
        q["explanation"] = build_sub_explanation(a, b, res)
        return apply_why(q)

    m = SUB_PAIR.search(q.get("explanation") or "")
    if m and str(q.get("correct", "")).isdigit():
        a, b = int(m.group(1)), int(m.group(2))
        q["explanation"] = build_sub_explanation(a, b, int(q["correct"]))
        return apply_why(q)

    return apply_why(q)


def apply_why(q: dict) -> dict:
    try:
        from patch_cikarma_why_context import patch_question as why_patch
    except ImportError:
        from scripts.patch_cikarma_why_context import patch_question as why_patch  # type: ignore
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
        topic_id="t05",
        title="Çıkarma İşlemi (Onluk ve yüzlük bozarak çıkarma)",
        grade=3,
        lesson_id="lesson_matematik",
    )
    vertical = sum(1 for q in out if "[[sub:" in q.get("text", ""))
    subsol = sum(1 for q in out if "[[subsol:" in q.get("explanation", ""))
    print(f"Guncellendi: {len(out)} soru, {vertical} dikey soru metni, {subsol} subsol aciklama")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

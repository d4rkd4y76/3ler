# -*- coding: utf-8 -*-
"""Generate noktalama_s3_bank.py and paragraf_s3_bank.py — 150 unique stems each."""
from __future__ import annotations

import importlib.util
import sys
from collections import Counter
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))

from _nokta_paragraf_content import build_noktalama_rows, build_paragraf_rows


def write_seed(module: str, rows: list[tuple]) -> Path:
    path = SCRIPTS / f"{module}.py"
    lines = [
        "# -*- coding: utf-8 -*-",
        f'"""Seed data for {module} — 150 paired question rows."""',
        "from __future__ import annotations",
        "",
        "_ROWS: list[tuple] = [",
    ]
    for row in rows:
        parts = [repr(x) for x in row]
        lines.append(f"    ({', '.join(parts)}),")
    lines += [
        "]",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def load_seed_rows(module: str) -> list[tuple]:
    path = SCRIPTS / f"{module}.py"
    spec = importlib.util.spec_from_file_location(module, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return list(mod._ROWS)


def write_bank(module: str, title: str, prefix: str, raw: list[tuple]) -> Path:
    path = SCRIPTS / f"{module}.py"
    lines = [
        "# -*- coding: utf-8 -*-",
        f'"""3. sınıf {title} — 150 soru."""',
        "from __future__ import annotations",
        "",
        "_RAW: list[tuple] = [",
    ]
    level_markers = {"kolay": "# ── KOLAY (50) ──", "orta": "# ── ORTA (50) ──", "zor": "# ── ZOR (50) ──"}
    prev: str | None = None
    for row in raw:
        level = row[0]
        if level != prev and level in level_markers:
            lines.append(f"    {level_markers[level]}")
            prev = level
        parts = [repr(x) for x in row]
        lines.append(f"    ({', '.join(parts)}),")
    lines += [
        "]",
        "",
        "def get_questions() -> list[dict]:",
        "    out = []",
        "    for i, row in enumerate(_RAW, start=1):",
        "        level, text, correct, w1, w2, exp = row[:6]",
        "        premise = row[6] if len(row) > 6 else None",
        "        out.append({",
        f'            "id": f"{prefix}{{i:03d}}",',
        '            "level": level,',
        '            "premise": premise,',
        '            "text": text,',
        '            "correct": correct,',
        '            "wrong1": w1,',
        '            "wrong2": w2,',
        '            "explanation": exp,',
        "        })",
        "    return out",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def validate_bank(raw: list[tuple], label: str) -> dict:
    stems = [r[1] for r in raw]
    exps = [r[5] for r in raw]
    levels = [r[0] for r in raw]
    errors: list[str] = []

    if len(raw) != 150:
        errors.append(f"{label}: len={len(raw)}, expected 150")
    if len(set(stems)) != len(stems):
        dup = len(stems) - len(set(stems))
        errors.append(f"{label}: {dup} duplicate stem(s)")
    if len(set(exps)) != len(exps):
        dup = len(exps) - len(set(exps))
        errors.append(f"{label}: {dup} duplicate explanation(s)")
    if Counter(levels) != Counter({"kolay": 50, "orta": 50, "zor": 50}):
        errors.append(f"{label}: level distribution {dict(Counter(levels))}")

    bad_stem = ("benzersiz", "(Açıklama ", "sorusu zor", "(kolay-", "(orta-")
    for i, row in enumerate(raw):
        blob = "".join(str(x) for x in row)
        if "\u00ab" in blob or "\u00bb" in blob:
            errors.append(f"{label}: guillemet at row {i + 1}")
        stem = row[1]
        if any(b in stem for b in bad_stem):
            errors.append(f"{label}: bad stem hack at row {i + 1}: {stem[:60]}")
        for ans_idx in (2, 3, 4):
            ans = str(row[ans_idx])
            if ans in ("Birinci seçenek", "İkinci seçenek", "Üçüncü seçenek"):
                errors.append(f"{label}: placeholder answer at row {i + 1}")

    return {
        "label": label,
        "total": len(raw),
        "unique_stems": len(set(stems)),
        "unique_explanations": len(set(exps)),
        "errors": errors,
    }


def main() -> int:
    print("Building seed rows...")
    nokta_rows = build_noktalama_rows()
    paragraf_rows = build_paragraf_rows()

    nokta_seed = write_seed("noktalama_seed", nokta_rows)
    paragraf_seed = write_seed("paragraf_seed", paragraf_rows)
    print(f"Wrote {nokta_seed}")
    print(f"Wrote {paragraf_seed}")

    nokta_raw = load_seed_rows("noktalama_seed")
    paragraf_raw = load_seed_rows("paragraf_seed")

    nokta_val = validate_bank(nokta_raw, "noktalama")
    paragraf_val = validate_bank(paragraf_raw, "paragraf")

    for val in (nokta_val, paragraf_val):
        if val["errors"]:
            print(f"VALIDATION ERRORS ({val['label']}):")
            for e in val["errors"]:
                print(f"  - {e}")
        else:
            print(f"Validation OK: {val['label']}")

    if nokta_val["errors"] or paragraf_val["errors"]:
        print("\n--- RESULTS (not written) ---")
        for val in (nokta_val, paragraf_val):
            print(
                f"{val['label']}: total={val['total']}, "
                f"unique_stems={val['unique_stems']}, "
                f"unique_explanations={val['unique_explanations']}"
            )
        return 1

    nokta_path = write_bank(
        "noktalama_s3_bank",
        "Noktalama İşaretleri — iki nokta, kısa çizgi, tırnak",
        "nokta3_",
        nokta_raw,
    )
    paragraf_path = write_bank("paragraf_s3_bank", "Paragrafta Anlam", "paragraf3_", paragraf_raw)

    print(f"\nWrote {nokta_path}")
    print(f"Wrote {paragraf_path}")

    print("\n--- RESULTS ---")
    for val in (nokta_val, paragraf_val):
        print(
            f"{val['label']}: total={val['total']}, "
            f"unique_stems={val['unique_stems']}, "
            f"unique_explanations={val['unique_explanations']}"
        )

    for name, prefix in (("noktalama_s3_bank", "nokta3_"), ("paragraf_s3_bank", "paragraf3_")):
        spec = importlib.util.spec_from_file_location(name, SCRIPTS / f"{name}.py")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        qs = mod.get_questions()
        assert len(qs) == 150, f"{name} get_questions() != 150"
        assert qs[0]["id"] == f"{prefix}001"
        assert qs[-1]["id"] == f"{prefix}150"

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

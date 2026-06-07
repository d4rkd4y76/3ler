# -*- coding: utf-8 -*-
from __future__ import annotations

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parent

from bank_generators import build_kelime, build_metin


def validate(questions: list[tuple], prefix: str) -> None:
    texts = [q[1] for q in questions]
    exps = [q[5] for q in questions]
    assert len(questions) == 150
    assert len(set(texts)) == 150, f"{prefix} duplicate stems: {150-len(set(texts))}"
    assert len(set(exps)) == 150, f"{prefix} duplicate exps: {150-len(set(exps))}"
    for i, q in enumerate(questions, 1):
        blob = "".join(str(x) for x in q)
        assert "\u00ab" not in blob and "\u00bb" not in blob
        if len(q) > 6 and q[6]:
            assert "Yukarıdaki" in q[1], f"{prefix} #{i} premise without Yukarıdaki"


def dump(path: Path, doc: str, prefix: str, rows: list[tuple]) -> None:
    validate(rows, prefix)
    body = "\n".join(f"    {r!r}," for r in rows)
    text = (
        "# -*- coding: utf-8 -*-\n"
        f'"""{doc}"""\n'
        "from __future__ import annotations\n\n"
        "_RAW: list[tuple] = [\n"
        f"{body}\n"
        "]\n\n\n"
        "def get_questions() -> list[dict]:\n"
        "    out = []\n"
        "    for i, row in enumerate(_RAW, start=1):\n"
        "        level, text, correct, w1, w2, exp = row[:6]\n"
        "        premise = row[6] if len(row) > 6 else None\n"
        "        out.append({\n"
        f'            "id": f"{prefix}_{{i:03d}}",\n'
        '            "level": level,\n'
        '            "premise": premise,\n'
        '            "text": text,\n'
        '            "correct": correct,\n'
        '            "wrong1": w1,\n'
        '            "wrong2": w2,\n'
        '            "explanation": exp,\n'
        "        })\n"
        "    return out\n"
    )
    path.write_text(text, encoding="utf-8")
    print(path.name, "stems", len(set(q[1] for q in rows)), "exps", len(set(q[5] for q in rows)))


def main():
    dump(ROOT / "kelime_dagarcigi_s3_bank.py", "3. sınıf Kelime Dağarcığı — 150 soru.", "kelime3", build_kelime())
    dump(ROOT / "metin_turleri_s3_bank.py", "3. sınıf Metin Türleri — 150 soruluk el yapımı soru bankası.", "metin3", build_metin())
    print("Done.")


if __name__ == "__main__":
    main()

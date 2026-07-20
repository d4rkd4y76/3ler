# -*- coding: utf-8 -*-
"""MCQ şık uzunluk dengesi — doğru cevap her zaman en uzun olmasın."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OVERRIDES_PATH = ROOT / "data" / "mcq-option-overrides.json"

_SHORTEN_PHRASES: list[tuple[str, str]] = [
    (r"\([^)]*\)", ""),
    (r"\s+", " "),
    ("duyusunun eksikliğini", "eksikliğini"),
    ("duyusuyla", "duyusu ile"),
    ("Görme duyusunun", "Görme"),
    ("işitme (kulak)", "işitme"),
    ("dokunma (deri)", "dokunma"),
    ("Temizliğe (hijyene) dikkat etmek ve ", ""),
    ("aslında ", ""),
    ("genellikle ", ""),
    ("tam ve doğru bir şekilde, ", ""),
    ("farklı özellikleriyle algılayıp ", ""),
    ("uygun büyüklükte ", ""),
    ("Dışarıdan bir kuvvet (itme veya çekme) uygulanması", "Dışarıdan itme veya çekme uygulanması"),
    ("Mıknatısın dolap gövdesine uyguladığı çekme (yapışma) kuvvetini yenmeye çalışmamız", "Mıknatısın kapıyı gövdeye yapıştırması"),
    ("Banta çarpınca yön değiştirir ve sürtünmeden dolayı yavaşlar", "Yön değiştirir ve yavaşlar"),
    ("Cisme uygun büyüklükte itme veya çekme kuvveti uygulamak", "Cisme itme veya çekme uygulamak"),
    ("Şekil üzerinde etki yaratsa da asıl olarak itme (sıkıştırma) kuvvetinin bir uygulamasıdır", "Süngere itme (sıkıştırma) uygulanması"),
    ("Rüzgârın yelkenlere uyguladığı itme kuvveti", "Rüzgârın yelkenlere itme kuvveti"),
    ("Dünya'nın cisimlere uyguladığı Çekme kuvvetidir", "Dünya'nın cisimleri aşağı çekmesi"),
    ("Görme duyusunun eksikliğini, dokunma (deri) ve işitme (kulak) duyusuyla dengelemek", "Görme eksikliğini dokunma ve işitmeyle dengelemek"),
    ("Çevreyi tam ve doğru bir şekilde, farklı özellikleriyle algılayıp tehlikelerden korunmak için", "Tehlikelerden korunmak ve çevreyi doğru algılamak"),
    ("Temizliğe (hijyene) dikkat etmek ve tehlikeli maddelerden uzak durmak", "Temizliğe dikkat etmek ve tehlikeli maddelerden kaçınmak"),
    ("Ses dalgalarını titretemeyeceği için işitme kaybı (sağırlık) yaşanır", "Ses dalgalarını iletemeyince işitme kaybı olur"),
    ("Gözü nemli tutmak ve yabancı maddeleri temizlemek", "Gözü nemli tutmak ve temizlemek"),
    ("Göze daha fazla ışık alarak görmeyi kolaylaştırmak", "Göze daha fazla ışık almak"),
    ("Gözyaşını göz yüzeyine yayarak gözün kurumasını engellemek", "Gözyaşı ile gözü nemli tutmak"),
]

_EXPAND_SUFFIXES: list[str] = []  # Yanlış şıkları anlamsız eklerle uzatmıyoruz


def _load_overrides() -> dict[str, dict[str, str]]:
    if not OVERRIDES_PATH.is_file():
        return {}
    return json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))


def option_len(text: str) -> int:
    return len((text or "").strip())


def is_imbalanced(q: dict, ratio: float = 1.35, min_gap: int = 12) -> bool:
    c = option_len(q.get("correct", ""))
    w1 = option_len(q.get("wrong1", ""))
    w2 = option_len(q.get("wrong2", ""))
    if not c:
        return False
    avg_wrong = (w1 + w2) / 2
    if avg_wrong <= 0:
        return False
    return c == max(c, w1, w2) and c > avg_wrong * ratio and c - min(w1, w2) > min_gap


def _shorten(text: str) -> str:
    s = (text or "").strip().rstrip(".")
    for pat, repl in _SHORTEN_PHRASES:
        if pat.startswith("(") and pat.endswith(")"):
            s = re.sub(pat, repl, s)
        else:
            s = s.replace(pat, repl)
    s = re.sub(r"\s+", " ", s).strip(" ,;.")
    if len(s) > 55 and "," in s:
        parts = [p.strip() for p in s.split(",") if p.strip()]
        if parts:
            s = parts[0]
    if len(s) > 55 and " ve " in s:
        left, right = s.split(" ve ", 1)
        if len(left) >= 20:
            s = left.strip()
    return s.strip()


def _expand(text: str, target: int) -> str:
    s = (text or "").strip().rstrip(".")
    if option_len(s) >= target:
        return s
    for suffix in _EXPAND_SUFFIXES:
        candidate = s + suffix
        if option_len(candidate) >= target * 0.85:
            return candidate.rstrip(".")
    if not s.endswith("için") and "için" not in s[-8:]:
        candidate = s + " için"
        if option_len(candidate) >= target * 0.8:
            return candidate
    return s


def balance_options(q: dict, overrides: dict[str, dict[str, str]] | None = None) -> dict:
    qid = q.get("id") or ""
    ov = (overrides or _load_overrides()).get(qid)
    if ov:
        for key in ("correct", "wrong1", "wrong2"):
            if ov.get(key):
                q[key] = ov[key].strip()
        return q

    if not is_imbalanced(q):
        return q

    correct = _shorten(q.get("correct", ""))
    w1 = (q.get("wrong1") or "").strip().rstrip(".")
    w2 = (q.get("wrong2") or "").strip().rstrip(".")
    target = max(option_len(correct), int((option_len(w1) + option_len(w2)) / 2) + 8)
    target = min(target, 52)

    if option_len(correct) > target + 5:
        correct = _shorten(correct)

    w1 = _expand(w1, target)
    w2 = _expand(w2, target)

    # Doğru cevap hâlâ bariz uzunsa yanlışları biraz daha uzat
    while is_imbalanced({"correct": correct, "wrong1": w1, "wrong2": w2}, ratio=1.25, min_gap=8):
        w1 = _expand(w1, option_len(correct) - 2)
        w2 = _expand(w2, option_len(correct) - 2)
        if option_len(w1) > 60 and option_len(w2) > 60:
            break

    q["correct"] = correct
    q["wrong1"] = w1
    q["wrong2"] = w2
    return q


def apply_balance_to_questions(questions: list[dict], overrides: dict | None = None) -> list[dict]:
    ov = overrides if overrides is not None else _load_overrides()
    return [balance_options(dict(q), ov) for q in questions]

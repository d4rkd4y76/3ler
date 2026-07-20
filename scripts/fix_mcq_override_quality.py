# -*- coding: utf-8 -*-
"""Fix bad MCQ overrides — banned phrases and awkward auto-expanded distractors."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
DATA_PY = SCRIPTS / "mcq_overrides_data.py"
OVERRIDES_PATH = ROOT / "data" / "mcq-option-overrides.json"
MAX_SPREAD = 15

RAW_BY_TOPIC = {
    "fen3_gezegen": ROOT / "data" / "gezegen-gemini-raw.json",
    "fen3_kuv": ROOT / "data" / "kuv-gemini-raw.json",
    "paragraf3": ROOT / "data" / "paragraf-gemini-raw.json",
    "metin3": ROOT / "data" / "metin-gemini-raw.json",
    "kelime3": ROOT / "data" / "kelime-gemini-raw.json",
    "olay3": ROOT / "data" / "olay-gemini-raw.json",
    "sebepsonuc3": ROOT / "data" / "cumle-gemini-raw.json",
}

BANNED = re.compile(
    r"olduğunu sanmak|olduğunu düşünmek|gerektiğini sanmak|yeterlidir|sanısı",
    re.I,
)
AWKWARD = re.compile(
    r"ile ilgili konular|konusu konusu|Bu cümle metindeki olayları anlatır|"
    r"Bu yargı metinde geçer|hakkındaki bilgiler|ile alakalı durumlar|"
    r"Başka anlamda kullanılan|\(hikâye unsuru\)|Sık sık .* konusu|"
    r"Bu ifade metinden|Bu düşünce metinde|Bu örnek metinde",
    re.I,
)

sys.path.insert(0, str(SCRIPTS))
from build_turkce_mcq_overrides import MANUAL, _ends_sentence, _shorten_correct, _strip_parens
from mcq_overrides_data import OVERRIDES


def _load_raw() -> dict[str, dict]:
    out: dict[str, dict] = {}
    for path in RAW_BY_TOPIC.values():
        if not path.is_file():
            continue
        for q in json.loads(path.read_text(encoding="utf-8")):
            out[q["id"]] = q
    return out


def _is_bad(text: str) -> bool:
    return bool(BANNED.search(text) or AWKWARD.search(text))


def _needs_fix(qid: str, ov: dict[str, str]) -> bool:
    blob = " ".join(ov.values())
    if _is_bad(blob):
        return True
    if AWKWARD.search(blob):
        return True
    if qid.startswith(("fen3_gezegen_", "fen3_kuv_")):
        return bool(re.search(r"sanmak|düşünmek|olduğunu olduğunu", blob, re.I))
    return False


def _topic_prefix(qid: str) -> str:
    return qid.rsplit("_", 1)[0]


TRUNCATED_CORRECT = re.compile(
    r"(meden|madan|takılmadan|olmalı|değil|yerine|dayanışma|pes etmeden|kendilerini değil)\.\s*$",
    re.I,
)


def _is_truncated_correct(text: str, raw_correct: str) -> bool:
    s = (text or "").strip()
    raw = (raw_correct or "").strip()
    if not s:
        return True
    if TRUNCATED_CORRECT.search(s):
        return True
    if raw.startswith(s.rstrip(".")) and len(raw) > len(s) + 8:
        return True
    if len(s) < len(raw) * 0.72:
        return True
    return False


def _format_kelime_wrong(word: str, correct: str) -> str:
    w = (word or "").strip().rstrip(".")
    if not w:
        return w
    low = w.lower()
    if low.endswith(("mak", "mek")):
        return f"{low[0].upper()}{low[1:]} anlamında fiil"
    if len(w.split()) == 1:
        return f"{w} sözcüğünün diğer anlamı"
    return w


def _mirror_topic_tail(wrong: str, correct: str) -> str:
    return wrong.strip().rstrip(".")


def _natural_pad(text: str, target: int, correct: str = "", qid: str = "") -> str:
    s = (text or "").strip().rstrip(".")
    if len(s) >= target:
        return s

    pf = _topic_prefix(qid)
    if pf == "kelime3":
        return _format_kelime_wrong(s, correct)

    if _ends_sentence(s):
        return s if s.endswith(".") else s + "."

    if pf in ("paragraf3", "metin3"):
        mirrored = _mirror_topic_tail(s, correct)
        if len(mirrored) >= target - 2:
            return mirrored

    if pf == "olay3":
        return s

    if pf == "sebepsonuc3":
        if s.lower().startswith("sık sık "):
            return s[7:].strip().capitalize() + s[7:][1:] if len(s) > 7 else s
        return s

    # fen topics — light normalization
    if pf.startswith("fen3_"):
        if pf.endswith("gezegen") and len(s.split()) <= 2:
            if "katman" not in s.lower() and s.lower() not in ("ağır küre", "kara katmanı", "su katmanı"):
                return s
            if s.lower() == "ağır küre":
                return "Ağır küre katmanı"
            if s.lower() == "kara katmanı":
                return "Kara katmanı (yer kabuğu)"
        return s

    return s


def _balance(correct: str, wrong1: str, wrong2: str, qid: str) -> dict[str, str]:
    c = correct.strip()
    w1 = wrong1.strip()
    w2 = wrong2.strip()

    if _ends_sentence(c) or (_ends_sentence(w1) and _ends_sentence(w2)):
        target = min(max(len(c), len(w1), len(w2), 35), 72)
        if len(c) > target + 12:
            c = _shorten_correct(c, target + 5)
        return {"correct": c, "wrong1": w1, "wrong2": w2}

    target = max(len(c), len(w1), len(w2), 22)
    target = min(target + 4, 52)
    if len(c) > target + 10:
        c = _shorten_correct(c, target)

    w1 = _natural_pad(w1, max(target - 2, len(c) - 4), c, qid)
    w2 = _natural_pad(w2, max(target - 2, len(c) - 4), c, qid)

    for _ in range(5):
        lengths = [len(c), len(w1), len(w2)]
        if max(lengths) - min(lengths) <= MAX_SPREAD:
            break
        pad_target = max(lengths) - MAX_SPREAD + 2
        if len(w1) < pad_target:
            w1 = _natural_pad(w1, pad_target, c, qid)
        if len(w2) < pad_target:
            w2 = _natural_pad(w2, pad_target, c, qid)

    return {"correct": c.strip(), "wrong1": w1.strip(), "wrong2": w2.strip()}


def _fix_fen(qid: str, ov: dict[str, str], raw: dict) -> dict[str, str]:
    correct = ov.get("correct") or raw.get("correct", "")
    w1 = (raw.get("wrong1") or "").strip()
    w2 = (raw.get("wrong2") or "").strip()

    # Normalize common fen layer labels to match existing good overrides
    layer_map = {
        "Ağır Küre": "Ağır küre katmanı",
        "Kara Katmanı": "Kara katmanı (yer kabuğu)",
        "Su Katmanı": "Su katmanı (su küre)",
        "Hava Katmanı": "Hava katmanı (Atmosfer)",
    }
    w1 = layer_map.get(w1, w1)
    w2 = layer_map.get(w2, w2)

    return _balance(correct, w1, w2, qid)


def _clean_correct(text: str, qid: str) -> str:
    s = (text or "").strip()
    s = re.sub(r"\s*\(hikâye unsuru\)\s*", "", s).strip()
    s = re.sub(r"\s+ile ilgili konular\s*$", "", s, flags=re.I).strip()
    s = re.sub(r"\s+konusu(\s+konusu)*\s*$", "", s, flags=re.I).strip()
    if _is_bad(s) or AWKWARD.search(s):
        return ""
    return s


def _fix_turkish(qid: str, ov: dict[str, str], raw: dict) -> dict[str, str]:
    if qid in MANUAL and not _needs_fix(qid, MANUAL[qid]):
        return dict(MANUAL[qid])

    raw_correct = (raw.get("correct") or "").strip()
    cleaned = _clean_correct(ov.get("correct", ""), qid)
    if cleaned and not _is_truncated_correct(cleaned, raw_correct):
        correct = cleaned
    else:
        correct = raw_correct

    w1 = re.sub(r"\s*\(hikâye (?:unsuru|ögesi)\)\s*", "", (raw.get("wrong1") or "")).strip()
    w2 = re.sub(r"\s*\(hikâye (?:unsuru|ögesi)\)\s*", "", (raw.get("wrong2") or "")).strip()

    pf = _topic_prefix(qid)
    if pf == "kelime3":
        w1 = _format_kelime_wrong(w1, correct)
        w2 = _format_kelime_wrong(w2, correct)
    elif pf in ("paragraf3", "metin3"):
        w1 = _mirror_topic_tail(w1, correct)
        w2 = _mirror_topic_tail(w2, correct)
    elif pf == "olay3":
        w1 = re.sub(r"\s*\(hikâye unsuru\)\s*", "", w1).strip()
        w2 = re.sub(r"\s*\(hikâye unsuru\)\s*", "", w2).strip()
    elif pf == "sebepsonuc3":
        w1 = re.sub(r"^Sık sık\s+", "", w1, flags=re.I).strip()
        w2 = re.sub(r"^Sık sık\s+", "", w2, flags=re.I).strip()

    result = _balance(correct, w1, w2, qid)
    if _is_truncated_correct(result["correct"], raw_correct):
        result["correct"] = raw_correct
    return result


def _sync_files(overrides: dict[str, dict[str, str]]) -> None:
    OVERRIDES_PATH.write_text(
        json.dumps(overrides, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    text = DATA_PY.read_text(encoding="utf-8")
    start = text.index("OVERRIDES = {")
    end = text.index("\nTYPO_FIXES", start)
    lines = ["OVERRIDES = {"]
    for qid in sorted(overrides.keys()):
        ov = overrides[qid]
        c = ov["correct"].replace("\\", "\\\\").replace('"', '\\"')
        w1 = ov["wrong1"].replace("\\", "\\\\").replace('"', '\\"')
        w2 = ov["wrong2"].replace("\\", "\\\\").replace('"', '\\"')
        lines.append(f'    "{qid}": {{"correct": "{c}", "wrong1": "{w1}", "wrong2": "{w2}"}},')
    lines.append("}")
    DATA_PY.write_text(text[:start] + "\n".join(lines) + "\n\n" + text[end:], encoding="utf-8")


def main() -> None:
    raw = _load_raw()
    updated = dict(OVERRIDES)
    counts: dict[str, int] = {}

    topic_rules = {
        "fen3_gezegen": _fix_fen,
        "fen3_kuv": _fix_fen,
        "paragraf3": _fix_turkish,
        "metin3": _fix_turkish,
        "kelime3": _fix_turkish,
        "olay3": _fix_turkish,
        "sebepsonuc3": _fix_turkish,
    }

    for qid, ov in list(updated.items()):
        if qid.startswith("fen3_duyu_"):
            continue
        pf = _topic_prefix(qid)
        if pf not in topic_rules:
            continue
        raw_q = raw.get(qid)
        if not raw_q:
            continue
        needs = (
            pf.startswith("fen3_gezegen")
            or pf.startswith("fen3_kuv")
            or pf in ("kelime3", "paragraf3", "metin3", "olay3", "sebepsonuc3")
            or _needs_fix(qid, ov)
        )
        if not needs:
            continue
        fixed = topic_rules[pf](qid, ov, raw_q)
        if fixed != ov:
            updated[qid] = fixed
            counts[pf] = counts.get(pf, 0) + 1

    _sync_files(updated)

    banned_left = 0
    for ov in updated.values():
        if BANNED.search(" ".join(ov.values())):
            banned_left += 1

    print("Fixed counts per topic:")
    for pf in [
        "fen3_gezegen",
        "fen3_kuv",
        "paragraf3",
        "metin3",
        "kelime3",
        "olay3",
        "sebepsonuc3",
    ]:
        print(f"  {pf}: {counts.get(pf, 0)}")
    print(f"Total fixed: {sum(counts.values())}")
    print(f"Banned phrase entries remaining: {banned_left}")


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""Generate balanced MCQ overrides for Turkish 3rd grade topics."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent

RAW_FILES = [
    ROOT / "data" / "paragraf-gemini-raw.json",
    ROOT / "data" / "metin-gemini-raw.json",
    ROOT / "data" / "kelime-gemini-raw.json",
    ROOT / "data" / "olay-gemini-raw.json",
    ROOT / "data" / "cumle-gemini-raw.json",
]
OVERRIDES_PATH = ROOT / "data" / "mcq-option-overrides.json"
DATA_PY_PATH = SCRIPTS / "mcq_overrides_data.py"
MAX_SPREAD = 15

# Hand-crafted overrides where auto-balance cannot preserve meaning/quality.
MANUAL: dict[str, dict[str, str]] = {
    "paragraf3_002": {
        "correct": "Ana fikir veya ana düşünce",
        "wrong1": "Metnin konusu veya başlığı",
        "wrong2": "Paragrafın giriş cümlesi",
    },
    "paragraf3_006": {
        "correct": "Sağlıklı bir hayat için su içmek çok önemlidir.",
        "wrong1": "Bu yüzden hemen hastaneye gitmemiz gerekir.",
        "wrong2": "Fakat onlar da aslında çok haklıydılar.",
    },
    "paragraf3_007": {
        "correct": "Kısacası, planlı çalışan kişi hedefine ulaşır.",
        "wrong1": "İlk olarak masamızı düzenli tutmalıyız.",
        "wrong2": "Bugün parka gidip oyun oynamak istiyordum.",
    },
    "olay3_001": {
        "correct": "Kahraman (şahıs kadrosu)",
        "wrong1": "Yer unsuru (mekân)",
        "wrong2": "Zaman unsuru (vakit)",
    },
    "kelime3_101": {
        "correct": "Suda ilerlemek (yüzmek)",
        "wrong1": "Kitap okumak (okumak)",
        "wrong2": "Para birimi (lira)",
    },
    "kelime3_104": {
        "correct": "Binek hayvanı olan at",
        "wrong1": "Araba kullanmak eylemi",
        "wrong2": "Kaçmak fiili (kaçmak)",
    },
    "kelime3_105": {
        "correct": "İçilen sıcak içecek (çay)",
        "wrong1": "Büyük su kütlesi (deniz)",
        "wrong2": "Kahve içeceği (kahve)",
    },
    "sebepsonuc3_001": {
        "correct": "Yağmurun çok şiddetli yağması",
        "wrong1": "Sokaklarda su birikmesi",
        "wrong2": "Şemsiyenin açılması",
    },
    "sebepsonuc3_015": {
        "correct": "Dişlerini düzenli fırçalamaması",
        "wrong1": "Dişlerinde çürükler oluşması",
        "wrong2": "Çok fazla şeker yemesi",
    },
    "sebepsonuc3_020": {
        "correct": "Sürekli abur cubur yemesi",
        "wrong1": "Kilo alması ve şişmanlaması",
        "wrong2": "Meyve yememesi alışkanlığı",
    },
    "paragraf3_067": {
        "correct": "Eğitim sabır ister; gelecekte büyük faydalar sağlar.",
        "wrong1": "Ağaç dikmek doğayı korumak için en iyi yoldur.",
        "wrong2": "Çınar ağaçları her zaman bol meyve verir.",
    },
    "metin3_080": {
        "correct": "Zaman belirsiz bir geçmişi anlatır, tam tarih vermez.",
        "wrong1": "Zaman ifadesi tamamen şimdiki zamandır.",
        "wrong2": "Metinde zaman ifadesi hiç kullanılmamıştır.",
    },
    "metin3_132": {
        "correct": "Küçük gördüğümüz kişiler bile büyük yardımlar edebilir.",
        "wrong1": "Fareler aslanlardan her zaman daha güçlüdür.",
        "wrong2": "Ormanda aslanlar her gün avlanmaya çıkar.",
    },
    "kelime3_121": {
        "correct": "Üzerinde yaşadığımız toprak parçası",
        "wrong1": "Siyahın karşıtı olan beyaz renk",
        "wrong2": "Karadan büyük su kütlesi (deniz)",
    },
    "kelime3_125": {
        "correct": "Eşyaları sıraya koymak (dizmek)",
        "wrong1": "İnsan vücudundaki kol uzvu",
        "wrong2": "Eşyaları etrafa dağıtmak eylemi",
    },
    "kelime3_130": {
        "correct": "Bir şeyi serbest bırakmak (salmak)",
        "wrong1": "Bir şeyi sıkıca bağlamak eylemi",
        "wrong2": "Elimizle bir şeyi tutmak eylemi",
    },
    "kelime3_134": {
        "correct": "Bir şeyi havaya tutturmak (asmak)",
        "wrong1": "Bahçede yetişen ağaç bitkisi",
        "wrong2": "Bir şeyi aşağı indirmek eylemi",
    },
    "kelime3_136": {
        "correct": "Göl kenarında yetişen uzun otlar",
        "wrong1": "Müzik aleti olarak keman çalgısı",
        "wrong2": "Bahçede yetişen ağaç bitkisi",
    },
    "kelime3_139": {
        "correct": "Eskiden su konulan topraktan kap",
        "wrong1": "Yuvarlak silindir şeklinde cisim",
        "wrong2": "İçine sıvı konulan cam şişe",
    },
    "kelime3_146": {
        "correct": "Üzerine desen basılmış pamuklu kumaş",
        "wrong1": "Yürürken yere basılan tek adım",
        "wrong2": "Üzerimize giydiğimiz kıyafet",
    },
    "kelime3_148": {
        "correct": "Aynaların arkasına sürülen madde",
        "wrong1": "Duvarları boyamak için kullanılan boya",
        "wrong2": "Herkesin duyabileceği açık sır",
    },
    "sebepsonuc3_057": {
        "correct": "Arkadaşının doğum gününe katılamaması",
        "wrong1": "Aniden ciddi bir hastalık geçirmesi",
        "wrong2": "Doğum günü hediyesi alamaması",
    },
    "sebepsonuc3_055": {
        "correct": "Sekizinci kata merdivenle çıkmak zorunda kalması",
        "wrong1": "Binadaki asansörün birden arızalanması",
        "wrong2": "Merdiven çıkınca çok fazla yorulması",
    },
}


def _strip_parens(text: str) -> str:
    return re.sub(r"\s*\([^)]*\)", "", text or "").strip()


def _ends_sentence(text: str) -> bool:
    return bool(text) and text.rstrip().endswith((".", "!", "?"))


def _prefix(qid: str) -> str:
    return qid.rsplit("_", 1)[0]


def _expand_phrase(text: str, target: int, correct: str = "", qid: str = "") -> str:
    s = (text or "").strip().rstrip(".")
    if len(s) >= target:
        return s

    pf = _prefix(qid)

    if pf == "kelime3":
        if len(s.split()) == 1:
            candidates = [
                f"Başka anlamda kullanılan {s.lower()} sözcüğü",
                f"{s} kelimesinin farklı anlamı",
                f"Metinde geçen {s.lower()} ifadesi",
                f"{s} sözcüğünün karşılığı",
            ]
        elif s.endswith(("mak", "mek")):
            candidates = [f"{s} eylemi", f"{s} fiili", f"Bir şeyi {s.lower()} hareketi"]
        else:
            candidates = [f"{s} anlamı", f"{s} ifadesi", f"{s} kavramı"]
        for c in candidates:
            if len(c) >= target - 2:
                return c
        return candidates[-1]

    if pf.startswith("sebepsonuc"):
        base = s
        if base.lower().startswith("sık sık "):
            base = base[7:]
        candidates = [
            f"Sık sık {base[0].lower()}{base[1:]}" if base else base,
            f"Sürekli {base[0].lower()}{base[1:]}" if base else base,
            f"Ani olarak {base[0].lower()}{base[1:]}" if base else base,
            f"{base} durumu",
            f"{base} olayı",
        ]
        for c in candidates:
            if len(c) >= target - 2:
                return c
        return candidates[0]

    if pf == "olay3":
        candidates = [
            f"{s} (hikâye unsuru)",
            f"{s} unsuru",
            f"Hikâyedeki {s.lower()} unsuru",
            f"Metindeki {s.lower()} ögesi",
        ]
        for c in candidates:
            if len(c) >= target - 2:
                return c
        return candidates[0]

    # paragraf / metin topic labels
    if " ve " in correct and " ve " not in s:
        tail = correct.split(" ve ", 1)[1]
        first_tail = tail.split()[0] if tail else "özellikleri"
        candidates = [
            f"{s} ve {first_tail}",
            f"{s} ile ilgili {first_tail}",
        ]
        if "önem" in correct:
            candidates.insert(0, f"{s} ve önemi")
        if "fayda" in correct:
            candidates.insert(0, f"{s} ve faydaları")
        if "zarar" in correct or "etki" in correct:
            candidates.insert(0, f"{s} ve olumsuz etkileri")
        for c in candidates:
            if len(c) >= target - 2:
                return c

    candidates = [
        f"{s} konusu",
        f"{s} ile ilgili konular",
        f"{s} hakkındaki bilgiler",
        f"Metinde geçen {s.lower()}",
        f"{s} ile alakalı durumlar",
    ]
    for c in candidates:
        if len(c) >= target - 2:
            return c
    return candidates[0]


def _expand_sentence(text: str, target: int, correct: str = "") -> str:
    s = (text or "").strip()
    if not s.endswith("."):
        s = s + "."
    if len(s) >= target:
        return s

    body = s.rstrip(".")
    suffixes = [
        " Bu yargı metinde geçer.",
        " Bu ifade paragrafta yer alır.",
        " Bu cümle metinden alınmıştır.",
        " Bu düşünce metinde vurgulanır.",
        " Bu örnek metinde anlatılır.",
    ]
    if "ana fikir" in (correct or "").lower() or len(correct or "") > 50:
        suffixes = [
            " Bu cümle metindeki olayları anlatır.",
            " Bu ifade metinde geçen bir ayrıntıdır.",
            " Bu yargı metindeki örnekle ilgilidir.",
            " Bu düşünce metinde ara bilgi verir.",
        ] + suffixes

    prefixes = []
    if len(body) < target - 20:
        prefixes = ["Metinde ", "Paragrafta ", "Bu metinde "]

    for prefix in [""] + prefixes:
        for suffix in suffixes:
            candidate = prefix + body[0].lower() + body[1:] if prefix and body else body
            if prefix:
                candidate = prefix + body[0].lower() + body[1:]
            else:
                candidate = body
            candidate = candidate + suffix
            if len(candidate) >= target - 2:
                return candidate
    return s


def _shorten_correct(text: str, target: int) -> str:
    s = _strip_parens(text).strip().rstrip(".")
    if len(s) <= target + 3:
        return s + ("." if _ends_sentence(text) else "")
    if ", " in s:
        parts = [p.strip() for p in s.split(",") if p.strip()]
        if parts and len(parts[0]) >= 20:
            s = parts[0]
    if " ve " in s and len(s) > target + 5:
        left, right = s.split(" ve ", 1)
        if len(left) >= 18:
            s = left
    if len(s) > target + 8 and " için " in s:
        s = s.split(" için ", 1)[0] + " için gerekir"
    if _ends_sentence(text) and not s.endswith("."):
        s += "."
    return s


def _mirror_topic_phrase(wrong: str, correct: str) -> str:
    w = wrong.strip().rstrip(".")
    c = correct.strip()
    if " ve " in c and " ve " not in w:
        if "önemi" in c or "fayda" in c:
            return f"{w} ve önemi"
        if "zarar" in c or "etki" in c:
            return f"{w} ve olumsuz sonuçları"
        if "yol" in c or "kural" in c:
            return f"{w} ve uygulama kuralları"
        tail = c.split(" ve ", 1)[1]
        word = tail.split()[0] if tail else "özellikleri"
        return f"{w} ve {word}"
    if len(w) < 22:
        return f"{w} konusu"
    return w


def _balance_question(q: dict) -> dict[str, str]:
    qid = q["id"]
    if qid in MANUAL:
        return MANUAL[qid]

    correct = (q.get("correct") or "").strip()
    wrong1 = (q.get("wrong1") or "").strip()
    wrong2 = (q.get("wrong2") or "").strip()

    c = _strip_parens(correct) if not _ends_sentence(correct) else correct
    w1, w2 = wrong1, wrong2

    all_sentences = _ends_sentence(c) and _ends_sentence(w1) and _ends_sentence(w2)
    any_sentence = _ends_sentence(c) or _ends_sentence(w1) or _ends_sentence(w2)

    if all_sentences or (_ends_sentence(c) and not _ends_sentence(w1)):
        target = max(len(c), len(w1), len(w2))
        target = min(max(target, 35), 72)
        c = _shorten_correct(c, target + 5) if len(c) > target + 12 else c
        w1 = _expand_sentence(w1, max(len(c) - 8, len(w1) + 10), c)
        w2 = _expand_sentence(w2, max(len(c) - 10, len(w2) + 12), c)
    elif any_sentence:
        target = max(len(c), len(w1), len(w2), 28)
        c = _shorten_correct(c, target + 3) if len(c) > target + 10 else c
        if _ends_sentence(w1):
            w1 = _expand_sentence(w1, max(len(c) - 5, 30), c)
        elif _prefix(qid) != "kelime3":
            w1 = _mirror_topic_phrase(w1, c)
            w1 = _expand_phrase(w1, max(len(c) - 5, len(w1) + 8), c, qid)
        else:
            w1 = _expand_phrase(w1, max(len(c) - 5, len(w1) + 8), c, qid)
        if _ends_sentence(w2):
            w2 = _expand_sentence(w2, max(len(c) - 5, 30), c)
        elif _prefix(qid) != "kelime3":
            w2 = _mirror_topic_phrase(w2, c)
            w2 = _expand_phrase(w2, max(len(c) - 5, len(w2) + 10), c, qid)
        else:
            w2 = _expand_phrase(w2, max(len(c) - 5, len(w2) + 10), c, qid)
    else:
        target = max(len(c), len(w1), len(w2), 22)
        target = min(target + 5, 48)
        if len(c) > target + 10:
            c = _shorten_correct(c, target)
        if _prefix(qid) != "kelime3":
            w1 = _mirror_topic_phrase(w1, c)
            w2 = _mirror_topic_phrase(w2, c)
        w1 = _expand_phrase(w1, max(target - 2, len(c) - 3), c, qid)
        w2 = _expand_phrase(w2, max(target - 2, len(c) - 3), c, qid)
        if len(c) < target - 5 and " (" not in correct:
            c = _expand_phrase(c, target - 2, c, qid)

    # Preserve original parenthetical gloss for short labels
    paren = re.search(r"\(([^)]+)\)", correct)
    if paren and len(c) < 30 and paren.group(1).lower() not in c.lower():
        c = f"{c} ({paren.group(1)})"

    result = {"correct": c.strip(), "wrong1": w1.strip(), "wrong2": w2.strip()}

    # Iterative fix for remaining imbalance
    for _ in range(6):
        lengths = [len(result[k]) for k in ("correct", "wrong1", "wrong2")]
        if max(lengths) - min(lengths) <= MAX_SPREAD:
            break
        c_len = lengths[0]
        if c_len == max(lengths) and c_len - min(lengths[1:]) > MAX_SPREAD:
            result["correct"] = _shorten_correct(result["correct"], max(lengths[1:]) + MAX_SPREAD - 2)
        for key in ("wrong1", "wrong2"):
            if len(result[key]) < max(lengths) - MAX_SPREAD:
                if _ends_sentence(result[key]):
                    result[key] = _expand_sentence(result[key], max(lengths) - MAX_SPREAD + 2, c)
                else:
                    result[key] = _expand_phrase(result[key], max(lengths) - MAX_SPREAD + 2, c, qid)

    return result


def _load_existing() -> dict:
    if OVERRIDES_PATH.is_file():
        return json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))
    return {}


def _collect_imbalanced() -> list[dict]:
    import sys

    sys.path.insert(0, str(SCRIPTS))
    from mcq_option_balance import is_imbalanced

    out: list[dict] = []
    for path in RAW_FILES:
        for q in json.loads(path.read_text(encoding="utf-8")):
            if is_imbalanced(q):
                out.append(q)
    return out


def _validate(overrides: dict[str, dict[str, str]]) -> tuple[int, list[str]]:
    import sys

    sys.path.insert(0, str(SCRIPTS))
    from mcq_option_balance import is_imbalanced

    remaining: list[str] = []
    for path in RAW_FILES:
        for q in json.loads(path.read_text(encoding="utf-8")):
            qid = q["id"]
            if qid not in overrides:
                if is_imbalanced(q):
                    remaining.append(qid)
                continue
            merged = dict(q)
            merged.update(overrides[qid])
            if is_imbalanced(merged):
                remaining.append(qid)
    return len(remaining), remaining


def main() -> None:
    imbalanced = _collect_imbalanced()
    generated: dict[str, dict[str, str]] = {}
    for q in imbalanced:
        generated[q["id"]] = _balance_question(q)

    existing = _load_existing()
    fen_count = sum(1 for k in existing if k.startswith("fen3_"))
    new_keys = [k for k in generated if k not in existing]
    merged = {**existing, **generated}

    OVERRIDES_PATH.write_text(
        json.dumps(merged, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    remaining_count, remaining_ids = _validate(merged)
    print(f"Existing fen overrides preserved: {fen_count}")
    print(f"New turkce overrides added: {len(new_keys)}")
    print(f"Total overrides in file: {len(merged)}")
    print(f"Remaining imbalanced after merge: {remaining_count}")
    if remaining_ids[:20]:
        print("Sample remaining:", remaining_ids[:20])

    # Update mcq_overrides_data.py OVERRIDES dict
    _sync_data_py(merged)


def _sync_data_py(all_overrides: dict) -> None:
    text = DATA_PY_PATH.read_text(encoding="utf-8")
    start = text.index("OVERRIDES = {")
    end = text.index("\nTYPO_FIXES", start)
    lines = ["OVERRIDES = {"]
    for qid in sorted(all_overrides.keys()):
        ov = all_overrides[qid]
        c = ov["correct"].replace("\\", "\\\\").replace('"', '\\"')
        w1 = ov["wrong1"].replace("\\", "\\\\").replace('"', '\\"')
        w2 = ov["wrong2"].replace("\\", "\\\\").replace('"', '\\"')
        lines.append(f'    "{qid}": {{"correct": "{c}", "wrong1": "{w1}", "wrong2": "{w2}"}},')
    lines.append("}")
    new_block = "\n".join(lines)
    DATA_PY_PATH.write_text(text[:start] + new_block + "\n\n" + text[end:], encoding="utf-8")


if __name__ == "__main__":
    main()

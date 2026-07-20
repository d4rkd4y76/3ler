#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Veri toplama soruları: öncülde tablo/çetele/şekil grafiği görselleri + açıklama zenginleştirme."""
from __future__ import annotations

import copy
import re

MARKUP_RE = re.compile(r"\[\[")

EMOJI: dict[str, str] = {
    "elma": "🍎",
    "armut": "🍐",
    "muz": "🍌",
    "kiraz": "🍒",
    "çilek": "🍓",
    "cilek": "🍓",
    "portakal": "🍊",
    "kırmızı": "🔴",
    "kirmizi": "🔴",
    "mavi": "🔵",
    "sarı": "🟡",
    "sari": "🟡",
    "futbol": "⚽",
    "basketbol": "🏀",
    "tenis": "🎾",
    "voleybol": "🏐",
    "kedi": "🐱",
    "köpek": "🐶",
    "kopek": "🐶",
    "kuş": "🐦",
    "kus": "🐦",
    "roman": "📕",
    "masal": "📚",
    "şiir": "📝",
    "siir": "📝",
    "hikaye": "📖",
    "kalem": "✏️",
    "kitap": "📚",
    "gül": "🌹",
    "gul": "🌹",
    "lale": "🌷",
    "papatya": "🌼",
    "araba": "🚗",
    "kamyon": "🚚",
    "otobüs": "🚌",
    "otobus": "🚌",
    "çam": "🌲",
    "cam": "🌲",
    "meşe": "🌳",
    "mese": "🌳",
    "kavak": "🌳",
    "inek": "🐄",
    "koyun": "🐑",
    "tavuk": "🐔",
    "aslan": "🦁",
    "bilye": "🔵",
    "top": "⚽",
    "dondurma": "🍦",
    "simit": "🥨",
    "kumbara": "🐷",
    "para": "💰",
    "çocuk": "👧",
    "cocuk": "👧",
    "öğrenci": "👦",
    "ogrenci": "👦",
    "kız": "👧",
    "kiz": "👧",
    "erkek": "👦",
    "ali": "👦",
    "veli": "👨",
    "park": "🏞️",
    "duvar": "🧱",
    "zemin": "🟫",
}


def question_num(qid: str) -> int:
    m = re.search(r"_(\d+)$", qid or "")
    return int(m.group(1)) if m else 0


def normalize_id(qid: str) -> str:
    qid = (qid or "").strip()
    if qid.startswith("veri3_"):
        return qid.replace("veri3_", "mat3_veri_")
    return qid


def emoji_for(label: str) -> str:
    low = label.lower()
    for key, em in EMOJI.items():
        if key in low:
            return em + " "
    return "📊 "


def mul_tag(a: int | str, b: int | str) -> str:
    return f"[[mul:{a}×{b}]]"


def div_tag(a: int | str, b: int | str) -> str:
    return f"[[div:{a}÷{b}]]"


def inject_calc_markup(expl: str) -> str:
    s = expl

    def repl_mul(m: re.Match) -> str:
        return mul_tag(m.group(1), m.group(2))

    def repl_div(m: re.Match) -> str:
        return div_tag(m.group(1), m.group(2))

    s = re.sub(r"(?<!\[\[mul:)(\d+)\s*[x×]\s*(\d+)(?!\]\])", repl_mul, s)
    s = re.sub(r"(?<!\[\[div:)(\d+)\s*÷\s*(\d+)(?!\]\])", repl_div, s)
    return s


def parse_siklik_premise(prem: str) -> str | None:
    m = re.match(r"^Sıklık Tablosu:\s*(.+)\.?\s*$", prem, re.I)
    if not m:
        return None
    body = m.group(1)
    parts = ["📊 Sıklık Tablosu"]
    for chunk in re.split(r",\s*", body):
        chunk = chunk.strip().rstrip(".")
        if not chunk:
            continue
        m2 = re.match(r"^(.+?)\s*\((\d+)\)\.?$", chunk)
        if m2:
            label = m2.group(1).strip()
            val = m2.group(2)
            parts.append(f"{emoji_for(label)}{label}:{val}")
            continue
        m3 = re.match(
            r"^(.+?)\s+(\d+)\s*(?:kg|adet|tane|kişi|öğrenci|bilet|sayfa|puan|TL|lira|Seans)?\.?$",
            chunk,
            re.I,
        )
        if m3:
            label = m3.group(1).strip()
            parts.append(f"{emoji_for(label)}{label}:{m3.group(2)}")
            continue
        m4 = re.match(r"^(\d+\.\s*Seans)\s+(\d+)$", chunk, re.I)
        if m4:
            parts.append(f"🎫 {m4.group(1)}:{m4.group(2)}")
    if len(parts) < 2:
        return None
    return "[[veri:siklik|" + "|".join(parts) + "]]"


def cetele_spec_from_text(text: str) -> str:
    text = text.strip()
    m = re.search(r"(\d+)\s*tam\s*grup", text, re.I)
    groups = int(m.group(1)) if m else 0
    m2 = re.search(r"(\d+)\s*(?:tekli\s*)?çizgi", text, re.I)
    singles = int(m2.group(1)) if m2 else 0
    if groups and singles:
        return f"{groups}g+{singles}"
    if groups:
        return f"{groups}g"
    m3 = re.search(r"(\d+)\s*grup", text, re.I)
    if m3:
        return f"{int(m3.group(1))}g"
    return text


def parse_cetele_premise(prem: str) -> str | None:
    if not prem.lower().startswith("çetele tablosu"):
        return None
    body = re.sub(r"^Çetele Tablosu:\s*", "", prem, flags=re.I).strip().rstrip(".")
    parts = ["Çetele Tablosu"]
    segments = re.split(r",\s*(?=[A-ZÇĞİÖŞÜ0-9])", body)
    for seg in segments:
        seg = seg.strip()
        if not seg:
            continue
        m = re.match(
            r"^(?:([A-ZÇĞİÖŞÜ])\s+)?(.+?)\s+(\d+\s*tam\s*grup(?:\s*ve\s*\d+\s*(?:tekli\s*)?çizgi)?|\d+\s*tam\s*grup|\d+\s*grup(?:\s*ve\s*\d+\s*çizgi)?)",
            seg,
            re.I,
        )
        if m:
            letter = (m.group(1) or "").strip()
            name = m.group(2).strip()
            spec_raw = m.group(3)
            label = f"{letter} {name}".strip() if letter else name
            spec = cetele_spec_from_text(spec_raw)
            parts.append(f"{emoji_for(name)}{label}:{spec}")
        else:
            m2 = re.match(r"^(.+?)\s+(\d+\s*tam\s*grup.*)$", seg, re.I)
            if m2:
                name = m2.group(1).strip()
                spec = cetele_spec_from_text(m2.group(2))
                parts.append(f"{emoji_for(name)}{name}:{spec}")
    if len(parts) < 2:
        return None
    return "[[veri:cetele|" + "|".join(parts) + "]]"


def parse_grafik_note_premise(prem: str) -> str | None:
    m = re.match(r"^Şekil Grafiği Notu:\s*(.+)\.?\s*$", prem, re.I)
    if not m:
        return None
    note = m.group(1).strip()
    return f"[[veri:not|{note}]]"


def parse_cetele_single_premise(prem: str) -> str | None:
    m = re.match(
        r"^Bir çetele tablosunda\s+(.+?)\s+için\s+(\d+)\s*tane\s*tam\s*grup(?:\s*ve\s*(\d+)\s*tekli\s*çizgi)?",
        prem,
        re.I,
    )
    if m:
        label = m.group(1).strip()
        groups = int(m.group(2))
        singles = int(m.group(3)) if m.group(3) else 0
        spec = f"{groups}g+{singles}" if singles else f"{groups}g"
        return f"[[veri:cetele|Çetele Tablosu|{emoji_for(label)}{label}:{spec}]]"

    patterns = [
        (r"Hayvanat bahçesinde\s+(\d+)\s*tam\s*grup\s+(.+?)\s+vardır", lambda m: ("🦁 " + m.group(2).strip(), f"{m.group(1)}g")),
        (r"Kalem sayısı\s+(\d+)\s*tam\s*grup", lambda m: ("✏️ Kalem", f"{m.group(1)}g")),
        (r"Simit sayısı\s+(\d+)\s*tam\s*grup", lambda m: ("🥨 Simit", f"{m.group(1)}g")),
        (r"Misket sayısı\s+(\d+)\s*tam\s*grup\s*ve\s*(\d+)\s*çizgi", lambda m: ("🔵 Misket", f"{m.group(1)}g+{m.group(2)}")),
        (r"çetele tablosunda bir veri\s+(\d+)\s*tam\s*grup\s*ile", lambda m: ("📊 Veri", f"{m.group(1)}g")),
        (r"çetele tablosunda bir veri\s+(\d+)\s*tam\s*grup\s*ve\s*(\d+)\s*çizgi", lambda m: ("📊 Veri", f"{m.group(1)}g+{m.group(2)}")),
        (r"toplam\s+(\d+)\s*tam\s*grup\s*çizilmiştir", lambda m: ("📊 Toplam", f"{m.group(1)}g")),
        (r"toplam\s+(\d+)\s*tam\s*grup\s*ve\s*ekstra\s*(\d+)\s*tekli\s*çizgi", lambda m: ("📊 Toplam", f"{m.group(1)}g+{m.group(2)}")),
    ]
    for pat, builder in patterns:
        m = re.search(pat, prem, re.I)
        if m:
            label, spec = builder(m)
            return f"[[veri:cetele|Çetele|{label}:{spec}]]"

    m = re.search(r"(\d+)\s*tam\s*grup\s*ve\s*(\d+)\s*(?:tekli\s*)?çizgi", prem, re.I)
    if m and "çetele" in prem.lower():
        spec = f"{m.group(1)}g+{m.group(2)}"
        return f"[[veri:cetele|Çetele|📊 Veri:{spec}]]"
    return None


def parse_grafik_full_premise(prem: str) -> str | None:
    """Not + şekil sayıları içeren öncüller."""
    if "Şekil Grafiği" not in prem and "şekil" not in prem.lower():
        return None
    note = extract_grafik_note(prem)
    if not note:
        return None
    shapes = extract_shape_rows(prem)
    if not shapes:
        return parse_grafik_note_premise(f"Şekil Grafiği Notu: {note}.")
    parts = ["📊 Şekil Grafiği", f"not:{note}"]
    for label, cnt in shapes:
        parts.append(f"{emoji_for(label)}{label}:{cnt}")
    return "[[veri:grafik|" + "|".join(parts) + "]]"


def extract_grafik_note(text: str) -> str | None:
    m = re.search(r"(Her şekil\s+[^.]+(?:gösterir|gösterir\.|temsil eder)[^.]*)", text, re.I)
    if m:
        return m.group(1).strip().rstrip(".")
    m = re.search(r"Şekil Grafiği Notu:\s*(Her şekil\s+[^.]+)", text, re.I)
    if m:
        return m.group(1).strip().rstrip(".")
    return None


def extract_shape_rows(text: str) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    seen: set[str] = set()
    patterns = [
        r"Grafikte\s+(.+?)\s+için\s+(\d+)\s*şekil",
        r"([A-ZÇĞİÖŞÜ]\s*(?:nesnesi|mev(?:esi|si)|verisi|takımı|kulübü|bilyesi|ürünü|sınıfı))\s+(?:için\s+)?(\d+)\s*şekil",
        r"((?:Kırmızı|Mavi|Kedi|Köpek|Kuş|Gül|Lale|Çam|Meşe|Kavak|Araba|Otobüs|Kamyon|Ali|Veli|Muz|"
        r"Kumbaradaki Para|Parktaki Çocuklar|Sepetteki elmalar|Sepetteki armutlar|"
        r"A verisi|B verisi|A ürünü|B ürünü|A kulübü|B kulübü|A takımı|B takımı|A sınıfı|B sınıfı|"
        r"A meyvesi|B meyvesi|A kalemi|B kalemi))\s+(?:için\s+)?(\d+)\s*şekil",
        r"([A-Za-zÇĞİÖŞÜçğıöşü\s']+?)\s+(?:için\s+)?(\d+)\s*şekil(?:\s|,|\.|ile)",
    ]
    for pat in patterns:
        for m in re.finditer(pat, text, re.I):
            label = re.sub(r"\s+", " ", m.group(1).strip())
            label = re.sub(r"^Grafikte\s+", "", label, flags=re.I).strip()
            if not label or re.match(r"Her\s+şekil", label, re.I):
                continue
            key = label.lower()
            if key in seen:
                continue
            seen.add(key)
            rows.append((label, m.group(2)))
    return rows


def parse_story_cetele_premise(prem: str) -> str | None:
    """Hikâye içinde geçen çetele verileri → tablo."""
    if "tam grup" not in prem.lower() and "çizgi" not in prem.lower():
        return None
    if prem.lower().startswith("çetele tablosu"):
        return None
    rows: list[tuple[str, str]] = []
    for m in re.finditer(
        r"([A-Za-zÇĞİÖŞÜçğıöşü\s]+?)\s+(?:çetele tablosunda\s+)?(\d+)\s*tam\s*grup(?:\s*ve\s*(\d+)\s*(?:tekli\s*)?çizgi)?",
        prem,
        re.I,
    ):
        label = m.group(1).strip()
        label = re.sub(r"^(Bir|Toplam|İnekler|Koyunlar|Hayvanat bahçesinde)\s+", "", label, flags=re.I).strip()
        if not label or len(label) > 40:
            continue
        groups = int(m.group(2))
        singles = int(m.group(3)) if m.group(3) else 0
        spec = f"{groups}g+{singles}" if singles else f"{groups}g"
        rows.append((label, spec))
    if len(rows) < 1:
        return None
    parts = ["Çetele Tablosu"]
    for label, spec in rows:
        parts.append(f"{emoji_for(label)}{label}:{spec}")
    return "[[veri:cetele|" + "|".join(parts) + "]]"


def rebuild_grafik_premise(q: dict, raw_prem: str | None, raw_text: str | None) -> None:
    combined = " ".join(filter(None, [raw_prem, raw_text]))
    if "şekil" not in combined.lower():
        return
    note = extract_grafik_note(combined)
    if not note:
        return
    shapes = extract_shape_rows(combined)
    if not shapes:
        return
    parts = ["📊 Şekil Grafiği", f"not:{note}"]
    for label, cnt in shapes:
        parts.append(f"{emoji_for(label)}{label}:{cnt}")
    q["premise"] = "[[veri:grafik|" + "|".join(parts) + "]]"


def fix_stem_text(text: str, premise: str | None) -> str:
    t = (text or "").strip()
    prem = premise or ""
    if prem and "veri:grafik" in prem:
        if re.search(r"nesnesi.*şekil|kulüp.*şekil|hayvan.*şekil", t, re.I):
            if "toplam" in t.lower():
                return "Toplam nesne sayısı kaçtır?"
            if "fazladır" in t.lower() or "fark" in t.lower():
                pass
        if "iki kulüp" in t.lower() or "i̇ki kulüp" in t.lower():
            return "Toplam öğrenci sayısından 15 kişi ayrılırsa geriye kaç kişi kalır?"
        m = re.match(
            r"^(.+?\d+\s*şekil[^.]*\.\s*)+(Toplam.+?\?)$",
            t,
            re.I | re.S,
        )
        if m:
            return m.group(m.lastindex).strip()
        if re.search(r",\s*[AB]\s", t) and "toplam" in t.lower():
            t = re.sub(r"^[^.]+\.\s*", "", t, count=1, flags=re.I)
    if premise:
        for prefix in ("Tabloya göre ", "tabloya göre ", "Grafikte ", "grafikte "):
            if t.lower().startswith(prefix.lower()):
                t = t[len(prefix) :].strip()
                if t:
                    t = t[0].upper() + t[1:]
                break
    replacements = {
        "A ve B meyvelerinin toplam sayısı kaçtır?": "Toplam kaç meyve vardır?",
        "A ve B renklerinin toplam sayısı kaçtır?": "Toplam kaç renk vardır?",
        "A ve B sporlarını sevenlerin toplam sayısı kaçtır?": "Toplam kaç kişi vardır?",
        "A ve B hayvanlarının toplam sayısı kaçtır?": "Toplam kaç hayvan vardır?",
        "A ve B kalemlerinin sayıları arasındaki fark, 1 silginin fiyatına eşittir. Buna göre 3 silgi kaç liradır?": "İki kalemin sayıları arasındaki fark 1 silginin fiyatına eşittir. 3 silgi kaç liradır?",
    }
    return replacements.get(t, t)


def premise_to_visual(prem: str | None) -> str | None:
    if not prem:
        return None
    if MARKUP_RE.search(prem):
        return prem
    for fn in (
        parse_siklik_premise,
        parse_cetele_premise,
        parse_grafik_full_premise,
        parse_story_cetele_premise,
        parse_cetele_single_premise,
        parse_grafik_note_premise,
    ):
        vis = fn(prem)
        if vis:
            return vis
    return prem


def explanation_visual(n: int, expl: str, q: dict) -> str:
    expl = (expl or "").strip()
    if MARKUP_RE.search(expl[:120]):
        return expl
    prem = q.get("premise") or ""

    if n in (2, 4, 6):
        block = "[[veri:cetele_grup]]"
        return f"{block}\n\n{expl}" if expl else block
    if n in (7, 8, 9, 10):
        num_map = {7: 3, 8: 7, 9: 10, 10: 15}
        block = f"[[veri:cetele_sayi|{num_map.get(n, 7)}]]"
        return f"{block}\n\n{expl}" if expl else block
    if n == 3 and "sıklık" in expl.lower():
        demo = "[[veri:siklik|Örnek|🍎 Elma:12|🍌 Muz:18|🍒 Kiraz:9]]"
        return f"{demo}\n\n{expl}"
    if "çetele" in expl.lower() and re.search(r"\b(\d+)\b", expl):
        m = re.search(r"(\d+)\s*tam\s*grup", expl, re.I)
        if m:
            total = int(m.group(1)) * 5
            m2 = re.search(r"(\d+)\s*(?:tekli\s*)?çizgi", expl, re.I)
            if m2:
                total += int(m2.group(1))
            block = f"[[veri:cetele_sayi|{total}]]"
            return f"{block}\n\n{expl}"
    if "şekil grafiği" in prem.lower() or "her şekil" in prem.lower():
        if not MARKUP_RE.search(expl):
            note_m = re.search(r"Her şekil\s+(\d+)", prem, re.I)
            if note_m:
                return f"[[veri:not|Her şekil {note_m.group(1)} nesneyi gösterir.]]\n\n{expl}"
    return expl


def enhance_question(q: dict) -> dict:
    q = copy.deepcopy(q)
    q["id"] = normalize_id(q.get("id", ""))
    n = question_num(q["id"])

    raw_prem = (q.get("premise") or "").strip() or None
    raw_text = (q.get("text") or "").strip()

    if raw_prem:
        q["premise"] = premise_to_visual(raw_prem)

    rebuild_grafik_premise(q, raw_prem, raw_text)

    if q.get("text"):
        q["text"] = fix_stem_text(q["text"], q.get("premise"))

    expl = q.get("explanation") or ""
    expl = explanation_visual(n, expl, q)
    expl = inject_calc_markup(expl)
    q["explanation"] = expl

    return q

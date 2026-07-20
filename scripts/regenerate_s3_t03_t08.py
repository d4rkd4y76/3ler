#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""t03–t08 soru bankalarını öncül/soru mantığına göre yeniden üretir."""
from __future__ import annotations

import importlib.util
import re
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
ROOT = SCRIPTS.parent
sys.path.insert(0, str(SCRIPTS))

from _gen_banks import (
    build_dilbilgisi_rows,
    build_yazim_rows,
    validate_bank,
    write_bank,
)
from question_build_common import normalize_question, parse_roman_items

PARAGRAF_STEMS = [
    "Yukarıdaki paragrafa göre metnin konusu nedir?",
    "Yukarıdaki metne göre anlatılan konu hangisidir?",
    "Yukarıdaki parçada üzerinde durulan konu hangisidir?",
    "Yukarıdaki paragrafa göre metnin ana düşüncesi nedir?",
    "Yukarıdaki metnin vermek istediği asıl mesaj hangisidir?",
    "Yukarıdaki paragrafa göre yazar ne söylemek istemiştir?",
    "Yukarıdaki paragrafa en uygun başlık hangisidir?",
    "Yukarıdaki metne verilebilecek en iyi başlık hangisidir?",
    "Yukarıdaki paragrafa göre metne hangi başlık uyar?",
    "Yukarıdaki şiire göre ana duygu hangisidir?",
    "Yukarıdaki dizelerde yoğun olarak işlenen duygu hangisidir?",
    "Yukarıdaki şiirin okuyucuya hissettirdiği duygu hangisidir?",
    "Yukarıdaki paragrafa göre metnin ana fikri hangisidir?",
    "Yukarıdaki metinden çıkarılacak ana düşünce hangisidir?",
    "Yukarıdaki parçada vurgulanan düşünce hangisidir?",
]

CUMLE_STEMS = {
    "sebep": [
        "Yukarıdaki cümlede sebep hangisidir?",
        "Yukarıdaki örnekte neden bildiren bölüm hangisidir?",
        "Yukarıdaki cümlede olayı başlatan neden hangisidir?",
    ],
    "sonuc": [
        "Yukarıdaki cümlede sonuç hangisidir?",
        "Yukarıdaki örnekte sebebin ardından gelen durum hangisidir?",
        "Yukarıdaki cümlede nedenin doğurduğu sonuç hangisidir?",
    ],
    "blank": [
        "Yukarıdaki cümlede boş bırakılan yere hangi sözcük gelmelidir?",
        "Yukarıdaki örnekte boşluğa hangi bağlaç uyar?",
        "Yukarıdaki cümlede noktalı yere hangi sözcük yazılmalıdır?",
    ],
    "multi": [
        "Yukarıdaki cümlelerden hangisinde sebep-sonuç ilişkisi vardır?",
        "Yukarıdaki örneklerden hangisinde neden-sonuç kurulmuştur?",
        "Yukarıdaki cümlelerin hangisinde sebep ile sonuç birbirine bağlanmıştır?",
    ],
    "define": None,
}

OLAY_STEMS = {
    "sentence": [
        "Yukarıdaki cümlede kahraman kimdir?",
        "Yukarıdaki cümlede olayların geçtiği yer neresidir?",
        "Yukarıdaki cümlede zaman unsuru hangisidir?",
        "Yukarıdaki cümlede yaşanan olay hangisidir?",
        "Yukarıdaki cümlede hikâye kahramanı hangisidir?",
        "Yukarıdaki cümlede olay nerede geçmektedir?",
        "Yukarıdaki cümlede olay ne zaman olmuştur?",
        "Yukarıdaki cümlede anlatılan iş hangisidir?",
    ],
    "sequence": [
        "Yukarıdaki cümlelerde önce gerçekleşen olay hangisidir?",
        "Yukarıdaki olaylar arasında sonraki olay hangisidir?",
        "Yukarıdaki numaralı olaylardan ilk sıradaki hangisidir?",
        "Yukarıdaki cümlelerde en son gerçekleşen olay hangisidir?",
    ],
    "passage": [
        "Yukarıdaki metinde kahraman kimdir?",
        "Yukarıdaki metinde olay nerede geçmektedir?",
        "Yukarıdaki metinde zaman unsuru hangisidir?",
        "Yukarıdaki metinde yaşanan olay hangisidir?",
        "Yukarıdaki parçada olayların oluş sırası hangi seçenekte doğrudur?",
    ],
}


def load_bank(name: str):
    path = SCRIPTS / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.get_questions()


def fix_paragraf_stem(text: str) -> str:
    if "Yukarı" in text or "yukarı" in text.lower():
        return text
    t = text.strip()
    prefixes = [
        "Bu parça ",
        "Paragraf ",
        "Metin ",
        "Okuduğunuz paragraf ",
        "Yazar bu paragrafla ",
        "Bu metinden ",
        "Bu yazının ",
        "Parçada ",
        "Dizelerde ",
        "Şiirin ",
        "Bu dizeler ",
    ]
    for p in prefixes:
        if t.startswith(p):
            rest = t[len(p) :]
            return "Yukarıdaki paragrafa göre " + rest[0].lower() + rest[1:]
    return "Yukarıdaki paragrafa göre " + t[0].lower() + t[1:]


def fix_paragraf(qs: list[dict]) -> list[dict]:
    out = []
    for q in qs:
        q = normalize_question(dict(q))
        premise = (q.get("premise") or "").strip()
        if premise:
            q["text"] = fix_paragraf_stem(q["text"])
        out.append(q)
    return out


def extract_cumle_premise(text: str) -> tuple[str, str | None]:
    m = re.match(r"^(.+?[.!?])\s+(.+)$", text.strip())
    if m and len(m.group(1)) > 12:
        stem = m.group(2).strip()
        if stem.lower().startswith("bu cümlede"):
            stem = "Yukarıdaki cümlede" + stem[10:]
        elif stem.lower().startswith("hangisinde"):
            stem = "Yukarıdaki cümlelerden hangisinde" + stem[10:]
        elif "Yukarı" not in stem and "yukarı" not in stem.lower():
            stem = "Yukarıdaki cümlede " + stem[0].lower() + stem[1:]
        return stem, m.group(1).strip()
    return text, None


def fix_cumle(qs: list[dict]) -> list[dict]:
    out = []
    for q in qs:
        q = normalize_question(dict(q))
        text = q["text"]
        if not q.get("premise"):
            new_text, prem = extract_cumle_premise(text)
            if prem:
                q["premise"] = prem
                q["text"] = new_text

        if q.get("premise") and "Yukarı" not in q["text"]:
            t = q["text"]
            if t.lower().startswith("bu cümlede"):
                t = "Yukarıdaki cümlede" + t[10:]
            elif t.lower().startswith("hangisinde"):
                t = "Yukarıdaki cümlelerden hangisinde" + t[10:]
            elif t.lower().startswith("aşağıdaki"):
                t = t.replace("Aşağıdaki", "Yukarıdaki", 1)
            else:
                t = "Yukarıdaki cümlede " + t[0].lower() + t[1:]
            q["text"] = t
        out.append(q)
    return out


def fix_olay(qs: list[dict]) -> list[dict]:
    out = []
    si = seq_i = pass_i = 0
    for q in qs:
        q = normalize_question(dict(q))
        text = q["text"]
        if not q.get("premise"):
            m = re.match(r"^(.+?[.!?])\s+cümlesinde(.+)$", text, re.I)
            if m:
                q["premise"] = m.group(1)
                q["text"] = "Yukarıdaki cümlede" + m.group(2)
            m = re.match(r"^Verilen cümlede (.+)$", text, re.I)
            if m and not q.get("premise"):
                parts = text.split(":", 1)
                if len(parts) == 2:
                    q["premise"] = parts[1].strip()
                    q["text"] = "Yukarıdaki cümlede kahramanı söyleyin."
            m = re.match(r"^(.+?[.!?])\s+Önce .+", text)
            if m and not q.get("premise"):
                sentences = text.split(". ")
                if len(sentences) >= 2:
                    q["premise"] = ". ".join(sentences[:-1]).strip()
                    if not q["premise"].endswith("."):
                        q["premise"] += "."
                    q["text"] = sentences[-1].strip()
                    if "Yukarı" not in q["text"]:
                        q["text"] = OLAY_STEMS["sequence"][seq_i % len(OLAY_STEMS["sequence"])]
                        seq_i += 1
            m = re.match(r"^(\d+\).+?\.\s+\d+\).+?\.) (.+)$", text)
            if m and not q.get("premise"):
                q["premise"] = m.group(1)
                q["text"] = m.group(2)
                if "Yukarı" not in q["text"]:
                    q["text"] = OLAY_STEMS["sequence"][seq_i % len(OLAY_STEMS["sequence"])]
                    seq_i += 1

        if q.get("premise") and len(q["premise"]) > 80 and "Yukarı" not in q["text"]:
            q["text"] = "Yukarıdaki metne göre " + q["text"][0].lower() + q["text"][1:]
        elif q.get("premise") and "Yukarı" not in q["text"]:
            q["text"] = "Yukarıdaki cümlede " + q["text"][0].lower() + q["text"][1:]
        out.append(q)
    return out


def fix_noktalama(qs: list[dict]) -> list[dict]:
    blank_stems = [
        "Yukarıdaki cümlede boş bırakılan yere hangi noktalama işareti gelmelidir?",
        "Yukarıdaki örnekte noktalı yere hangi işaret yazılmalıdır?",
        "Yukarıdaki cümlede eksik olan noktalama işareti hangisidir?",
    ]
    pick_stems = [
        "Yukarıdaki cümlelerden hangisinde noktalama doğru kullanılmıştır?",
        "Yukarıdaki örneklerden hangisinde işaret yeri doğrudur?",
        "Yukarıdaki cümlelerin hangisinde noktalama kuralına uyulmuştur?",
    ]
    out = []
    bi = pi = 0
    for q in qs:
        q = normalize_question(dict(q))
        text = q["text"]
        if not q.get("premise"):
            m = re.match(
                r"^Boş bırakılan yere hangi .+?\? (.+)$",
                text,
                re.I,
            )
            if m and "_____" in m.group(1):
                q["premise"] = m.group(1).strip()
                q["text"] = blank_stems[bi % len(blank_stems)]
                bi += 1
            elif text.startswith("Aşağıdaki cümlelerden"):
                q["text"] = text.replace("Aşağıdaki cümlelerden", "Yukarıdaki cümlelerden")
        if parse_roman_items(q.get("premise") or ""):
            q["text"] = pick_stems[pi % len(pick_stems)]
            pi += 1
        out.append(q)
    return out


def rows_from_questions(qs: list[dict], prefix: str) -> list[tuple]:
    rows = []
    for q in qs:
        row = [q["level"], q["text"], q["correct"], q["wrong1"], q["wrong2"], q["explanation"]]
        if q.get("premise"):
            row.append(q["premise"])
        rows.append(tuple(row))
    return rows


def validate_premise_rules(qs: list[dict], name: str) -> None:
    bad = []
    for q in qs:
        prem = (q.get("premise") or "").strip()
        text = q["text"]
        if "Cümle:" in text or "Odak cümle:" in text:
            bad.append((q["id"], "cümle metinde"))
        if prem and "Yukarı" not in text and "yukarı" not in text.lower():
            if len(prem) > 20 or parse_roman_items(prem):
                bad.append((q["id"], "öncül var ama yukarıdaki yok"))
    if bad:
        print(f"UYARI {name}: {len(bad)} öncül hatası")
        for item in bad[:5]:
            print(" ", item)


def main() -> int:
    dil_rows = build_dilbilgisi_rows()
    yazim_rows = build_yazim_rows()
    validate_bank(dil_rows, {"kolay": 50, "orta": 50, "zor": 50})
    validate_bank(yazim_rows, {"kolay": 50, "orta": 50, "zor": 50})
    write_bank("dilbilgisi_s3_bank", "3. sınıf Dilbilgisi — 150 soru.", "dilb3_", dil_rows)
    write_bank("yazim_s3_bank", "3. sınıf Yazım Kuralları — 150 soru.", "yazim3_", yazim_rows)
    print("OK dilbilgisi + yazim")

    paragraf = fix_paragraf(load_bank("paragraf_s3_bank"))
    cumle = fix_cumle(load_bank("cumle_s3_bank"))
    olay = fix_olay(load_bank("olay_s3_bank"))
    noktalama = fix_noktalama(load_bank("noktalama_s3_bank"))

    for name, qs, prefix, title in [
        ("paragraf_s3_bank", paragraf, "paragraf3_", "3. sınıf Paragrafta Anlam — 150 soru."),
        ("cumle_s3_bank", cumle, "cumle3_", "3. sınıf Cümlede Anlam — 150 soru."),
        ("olay_s3_bank", olay, "olay3_", "3. sınıf Olay Sırası ve Hikâye Unsurları — 150 soru."),
        ("noktalama_s3_bank", noktalama, "nokta3_", "3. sınıf Noktalama — 150 soru."),
    ]:
        rows = rows_from_questions(qs, prefix)
        validate_bank(rows, {"kolay": 50, "orta": 50, "zor": 50})
        validate_premise_rules(qs, name)
        write_bank(name, title, prefix, rows)
        print(f"OK {name}: {len(qs)} soru")

    return 0


if __name__ == "__main__":
    sys.exit(main())

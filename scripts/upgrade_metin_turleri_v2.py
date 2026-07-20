#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Metin Türleri 150 — öncül tekrarını düzelt, açıklamaları zenginleştir, yayınla."""
from __future__ import annotations

import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "metin-turleri-s3-150.json"
BUILD_SCRIPT = ROOT / "scripts" / "build_metin_turleri_s3_150.py"
CDN_ADMIN = ROOT / "cdn-admin.local.json"
PROJECT = "dllwrld-e5419"
TOPIC = "t01"
TOPIC_BASE = f"championData/headings/SINIF3/lessons/lesson_turkce/topics/{TOPIC}"

ROMAN_RE = re.compile(r"^((?:I{1,3}|IV|VI{0,3}|IX|X)\.)\s*(.+)$")


def parse_roman_items(text: str) -> list[dict]:
    items = []
    for line in (text or "").split("\n"):
        line = line.strip()
        if not line:
            continue
        m = ROMAN_RE.match(line)
        if m:
            items.append({"label": m.group(1), "text": m.group(2).strip()})
    return items


def is_roman_premise(text: str) -> bool:
    return len(parse_roman_items(text or "")) >= 2


def split_stem(text: str, premise: str | None) -> str:
    """Öncül metni soru kökünden ayır — yinelenmeyi önle."""
    t = (text or "").strip()
    p = (premise or "").strip()
    if not p:
        return t
    if t.startswith(p):
        rest = t[len(p) :].strip()
        return rest or "Yukarıdaki bilgilere göre doğru seçeneği işaretleyiniz."
    if is_roman_premise(p):
        for marker in (
            "Yukarıdaki eşleştirmelerden",
            "Yukarıdaki bilgilerden",
            "Yukarıdaki ifadelerden",
            "Yukarıdaki metin",
            "Yukarıdaki dizelerden",
            "Yukarıdaki cümlelerden",
            "Yukarıdaki başlıklardan",
            "Yukarıdaki metinlerden",
            "Yukarıdaki sorulardan",
            "Yukarıdaki metin türleri",
        ):
            idx = t.find(marker)
            if idx >= 0:
                return t[idx:].strip()
    return t


def to_app_payload(q: dict) -> dict:
    premise = (q.get("premise") or "").strip() or None
    stem = split_stem(q.get("text") or "", premise)
    info_blocks = None
    info = None
    if premise:
        roman = parse_roman_items(premise)
        if roman:
            info_blocks = [{"type": "items", "items": roman}]
        else:
            info_blocks = [{"type": "text", "content": premise}]
    return {
        "question": {
            "text": stem,
            "info": info,
            "infoItems": None,
            "infoBlocks": info_blocks,
        },
        "correct": q["correct"],
        "wrong1": q["wrong1"],
        "wrong2": q["wrong2"],
        "explanation": q["explanation"],
        "url": None,
    }


def build_rich_explanation(q: dict) -> str:
    """3. sınıf düzeyinde öğretici açıklama — cevabı tekrar etmeden öğretir."""
    text = q.get("text") or ""
    stem = split_stem(text, q.get("premise"))
    correct = q.get("correct") or ""
    premise = q.get("premise") or ""
    level = q.get("level") or ""
    qid = q.get("id") or ""

    # ── Özel, elle güçlendirilmiş açıklamalar (örnek sorular) ──
    CUSTOM = {
        "metin3_140": (
            "Masallar «bir varmış bir yokmuş» diye başlar; olay, kahraman ve yer anlatılır. "
            "Bu yüzden masal hikâye edici metindir. Ansiklopedi bir konu hakkında bilgi verir, "
            "olay anlatmaz; bilgilendirici metindir. Ninni ise dizeler hâlinde söylenir, duygu "
            "aktarır; şiirdir. Üç eşleştirme de doğru olduğu için «I, II ve III» seçeneğini işaretleriz."
        ),
        "metin3_139": (
            "Hikâye edici metinde bize «ne oldu?» sorusunun cevabı anlatılır; yani olay vardır. "
            "Bilgilendirici metinde amaç öğretmektir; okuyucuya yeni bilgiler verilir. "
            "Şiirde ise satırlara dize denir; düz yazıdaki gibi paragraflarla yazılmaz. "
            "Üç madde de metin türlerinin temel özelliklerini doğru söylediği için hepsi doğrudur."
        ),
        "metin3_141": (
            "Hikâyede «kim?» diye sorunca kahramanı, «nerede?» diye sorunca olayın geçtiği yeri buluruz. "
            "Şiirde ise kaç dize olduğu, şair kimdir, ana duygu nedir gibi sorular sorulur. "
            "Bu üç soru türü de kendi metnine uygundur; bu nedenle I, II ve III doğrudur."
        ),
    }
    if qid in CUSTOM:
        return CUSTOM[qid]

    # ── Metin türü ayırt etme (öncüllü paragraf) ──
    if premise and "hangi türdendir" in stem.lower():
        if "Ali sabah" in premise or "Zeynep parka" in premise or "Ebrar" in premise:
            return (
                "Metinde bir kişinin yaptığı olaylar sırayla anlatılıyor: kalkmak, okula gitmek, oyun oynamak gibi. "
                "Olay, kahraman, yer ve zaman varsa metin hikâye edicidir. Bilgi vermek veya dize yazmak amacı yoktur. "
                "Bu ipuçları bizi hikâye edici metne götürür."
            )
        if any(w in premise for w in ("Arılar", "Kediler", "Su ", "Türkiye", "Diş", "Balık", "Güneş", "Serçe", "Bitkiler", "İnsan vücudu", "Kışın hava", "spor")):
            return (
                "Metinde olay anlatılmıyor; hayvanlar, vücut, mevsim veya doğa hakkında bilgi veriliyor. "
                "«…dır, …ir» gibi cümleler gerçek bilgi taşır. Bilgi veren metinler bilgilendirici metindir. "
                "Ders kitaplarındaki «Serçe» yazısı da böyledir."
            )
        if "\n" in premise and any(
            line.count(",") or " / " in premise for line in premise.split("\n") if len(line) < 40
        ):
            return (
                "Metin dizeler (satırlar) hâlinde yazılmış; duygu ve ahenk ön planda. "
                "Paragraf hâlinde düz anlatım yok. Dizeler hâlinde yazılan metinler şiirdir. "
                "Okurken vurgu ve tonlamaya dikkat ederiz."
            )
        return (
            "Metni okurken önce «ne anlatılıyor?» diye düşünürüz: olay mı, bilgi mi, duygu mu? "
            "Olay varsa hikâye edici; bilgi varsa bilgilendirici; dizeler ve duygu varsa şiirdir. "
            f"Bu metin «{correct}» türüne girer."
        )

    # ── Hikâye unsurları ──
    if "kahraman" in stem.lower() or "kimdir" in stem.lower() or "kim?" in stem.lower():
        return (
            "Hikâyede olayı yaşayan kişi veya hayvan kahramandır. «Kim?» sorusunun cevabı kahramanı verir. "
            "Yer, zaman ve olay başka sorularla bulunur. Metni okurken «olayı kim yaptı?» diye kendine sor."
        )
    if "nerede" in stem.lower() or "olay nerede" in stem.lower():
        return (
            "«Nerede?» sorusu olayın geçtiği yeri buldurur: okul, bahçe, ev, park gibi. "
            "Hikâye edici metinlerde yer genellikle bellidir. Metinde geçen mekânı cümlelerden çıkar."
        )
    if "olay nedir" in stem.lower() or "anlatılan olay" in stem.lower():
        return (
            "«Ne oldu?» sorusunun cevabı olaydır. Oyun oynamak, okula gitmek, kedi aramak gibi "
            "yapılan işler olay olarak yazılır. Olayı tek cümleyle özetleyebilirsen doğru unsuru bulmuş olursun."
        )
    if "ne zaman" in stem.lower() or "zaman unsur" in stem.lower():
        return (
            "«Ne zaman?» sorusu olayın günün, mevsimin veya saatin hangisi olduğunu buldurur. "
            "Sabah, hafta sonu, kış gibi sözcükler zaman unsuruna ipucu verir."
        )

    # ── Şiir ögeleri ──
    if "dize" in stem.lower():
        return (
            "Şiirde her satıra dize denir; paragraf veya cümle gibi düz yazılmaz. "
            "Dört dize bir araya gelince kıta oluşur. Şiir okurken satır satır okuruz."
        )
    if "kıta" in stem.lower():
        return (
            "Kıta, şiirde bir araya gelen dört dizeden oluşur. "
            "Şiirler genellikle bir veya birkaç kıtadan meydana gelir. "
            "Paragraf düz yazıya aittir, şiire değil."
        )
    if "şair" in stem.lower():
        return (
            "Şiir yazan kişiye şair denir. Kitap ve hikâye yazana yazar denir; karıştırma. "
            "Şiirin sonunda veya başında şairin adı yazılabilir."
        )
    if "ana duygu" in stem.lower():
        return (
            "Şiirin ana duygusu, okurken bize hissettirdiği duygudur: sevinç, hüzün, sevgi, özlem gibi. "
            "Dizeleri dikkatle okuyunca hangi duygunun anlatıldığını anlarız."
        )

    # ── Tanım / «hangisi bulunur / ne denir» ──
    if "hangisi bulunur" in stem.lower():
        key = correct.lower()
        if key == "olay":
            return (
                "Hikâye edici metinde dört temel unsur vardır: kahraman, yer, zaman ve olay. "
                "«Ne oldu?» sorusunun cevabı olaydır; yani anlatılan iş veya durum. "
                "Dize ve kıta şiire, paragraf düz yazıya aittir; hikâyede aranmaz."
            )
        if key == "kahraman":
            return (
                "Kahraman, hikâyede olayı yaşayan kişi veya hayvandır. "
                "«Kim?» sorusu kahramanı buldurur. Dize şiirin satırıdır, olay ise yapılan iştir."
            )
    if "ne denir" in stem.lower() or "ne ad verilir" in stem.lower():
        if "dize" in correct.lower():
            return (
                "Şiirde her satıra dize denir. Şiirler paragraf hâlinde değil, alt alta dizelerle yazılır. "
                "Cümle ve paragraf düz yazının parçalarıdır; şiirde «satır = dize» kuralını unutma."
            )
        if "şair" in correct.lower():
            return (
                "Şiir yazan kişiye şair denir. Hikâye ve bilgilendirici metin yazan kişiye ise yazar denir. "
                "«Ömer Osmanov» gibi isimler şiirin sonunda şairi gösterir."
            )
        if "kıta" in correct.lower():
            return (
                "Dört dize yan yana gelince kıta oluşur. Şiirler genelde bir veya birkaç kıtadan oluşur. "
                "Paragraf düz yazıda kullanılır; şiirde kıta kavramını kullanırız."
            )
    if "ne amacıyla" in stem.lower() or "hangi amaçla" in stem.lower():
        if "bilgi" in correct.lower():
            return (
                "Bilgilendirici metinlerin görevi okuyucuyu bilgilendirmektir. "
                "«Serçe» metninde serçeler hakkında bilgi verilir; olay anlatılmaz, duygu dizeleriyle aktarılmaz. "
                "Bu yüzden amaç bilgi vermektir."
            )
    if "hangisi bir metin türü değildir" in stem.lower():
        return (
            "3. sınıfta üç ana metin türü öğreniriz: hikâye edici, bilgilendirici ve şiir. "
            "«Duygulandırıcı» ayrı bir metin türü adı değildir; şiir zaten duygu aktarır ama türün adı şiirdir."
        )
    if "masal" in stem.lower() and "hangi metin türüne" in stem.lower():
        return (
            "Masallar olay anlatır; kahraman, yer ve zaman bellidir. "
            "«Bir varmış bir yokmuş» diye başlayan metinler hikâye edici metindir. "
            "Bilgilendirici metin bilgi verir, şiir dizelerle yazılır."
        )
    if "ansiklopedi" in stem.lower():
        return (
            "Ansiklopediler bir konu hakkında bilgi vermek için yazılır. "
            "Olay anlatmaz, dizelerle duygu aktarmaz. Bu nedenle ansiklopedi yazıları bilgilendirici metindir."
        )
    if "günlük" in stem.lower():
        return (
            "Günlükte o gün yaşanan olaylar yazılır: «bugün okula gittim, arkadaşımla oynadım» gibi. "
            "Olay anlatıldığı için günlük hikâye edici metne örnektir."
        )

    if "hikâye edici" in stem.lower() and "özellik" in stem.lower():
        return (
            "Hikâye edici metinlerde olmuş veya olabilecek bir olay anlatılır. "
            "Kahraman, yer, zaman ve olay unsurları bulunur. "
            "Dize, kıta veya sadece bilgi vermek hikâyenin işi değildir."
        )
    if "bilgilendirici" in stem.lower() and "özellik" in stem.lower():
        return (
            "Bilgilendirici metinler okuyucuya bir konu hakkında gerçek bilgiler verir. "
            "Ders kitapları, ansiklopediler ve «Serçe» metni böyledir. "
            "Olay örgüsü kurmak veya dizelerle duygu anlatmak bilgilendirici metnin görevi değildir."
        )
    if "şiir" in stem.lower() and ("özellik" in stem.lower() or "ögesi" in stem.lower()):
        return (
            "Şiirler dizeler hâlinde yazılır; duygu, düşünce ve hayaller anlatılır. "
            "Şair, dize, kıta ve başlık şiirin ögeleridir. "
            "Olay örgüsü veya grafik kullanımı şiirin temel özelliği değildir."
        )

    # ── Hangisi değildir / söylenemez / farklıdır ──
    if any(w in stem.lower() for w in ("değildir", "söylenemez", "farklıdır", "uygun değil")):
        return (
            "Her metin türünün kendine özgü görevi vardır. Hikâye olay anlatır, bilgilendirici bilgi verir, "
            "şiir duyguyu dizelerle anlatır. Seçenekleri tek tek okuyup «bu cümle hangi türe ait?» diye sor. "
            "Türüne uymayan ifade yanlış seçenektir; doğru cevap kalan şıktır."
        )

    # ── Roman numaralı maddeler ──
    if is_roman_premise(premise) and "hangileri doğru" in stem.lower():
        lines = parse_roman_items(premise)
        parts = []
        for it in lines:
            parts.append(f"{it['label']} {it['text']}")
        return (
            "Her maddeyi tek tek kontrol et: hikâye için olay, bilgilendirici için bilgi, şiir için dize kuralını hatırla. "
            + " ".join(parts[:2])
            + (" …" if len(parts) > 2 else "")
            + f" Hepsi doğruysa «{correct}» seçeneğini işaretleriz."
        )

    # ── Başlık / örnek eşleştirme ──
    if "başlık" in stem.lower():
        return (
            "Başlık, metnin konusunu veya duygusunu yansıtır. Olay anlatan başlık hikâyeye, "
            "bilgi veren konu bilgilendirici metne, duygusal ifade şiire yakışır. "
            "Başlığı okuyunca «bu metin ne yapacak?» sorusunu sor."
        )

    # ── Cümle örneği ──
    if "cümlelerden hangisi" in stem.lower() or "metinlerden hangisi" in stem.lower():
        if "Kurbağa" in stem or "metalden" in correct or "100 derece" in stem:
            return (
                "Bilgilendirici cümleler bir gerçeği anlatır; kişi adı ve olay zinciri yoktur. "
                "«…dır, …abilir» yapısı bilgi verir. Olay anlatan cümlede birinin bir şey yaptığı yazılır."
            )
        if "Selin" in correct or "gördüm" in stem or "gittik" in stem:
            return (
                "Hikâye edici cümlede bir olay yaşanır: birisi bir şey yapar, bir yere gider, bir şey bulur. "
                "Geçmiş zaman veya yaşanan an kullanılır. Sadece bilgi veren cümle olay sayılmaz."
            )
        if "/" in correct or "parlar" in stem.lower():
            return (
                "Şiirden alınmış cümleler kısa satırlar hâlinde yazılır; duygu ve ahenk vardır. "
                "Düz cümleler paragraf gibi akar; dizeler yan yana durmaz."
            )

    # ── Kazanım / genel strateji ──
    if "T.3.3.20" in stem or "Metin türlerini ayırt" in stem:
        return (
            "3. sınıfta metin türlerini ayırt ederken üç soru sorarız: Olay mı anlatılıyor? "
            "Bilgi mi veriliyor? Dizeler hâlinde duygu mu aktarılıyor? "
            "Cevaba göre hikâye edici, bilgilendirici veya şiir deriz."
        )

    # ── Varsayılan zengin (şablon tekrarı yok) ──
    return (
        f"Soruyu çözerken metnin amacını düşün: olay mı, bilgi mi, duygu mu? "
        f"Doğru seçenek «{correct}»; çünkü metin türlerinin özellikleri bunu gerektirir. "
        "MEB 3. sınıf kitabındaki «Serçe» (bilgilendirici), «Ebrar» hikâyesi (hikâye edici) "
        "ve «Sihirli Sözler» (şiir) örneklerini hatırlarsan karıştırmazsın."
    )


def upgrade_questions(questions: list[dict]) -> list[dict]:
    out = []
    for q in questions:
        nq = dict(q)
        premise = (nq.get("premise") or "").strip() or None
        nq["premise"] = premise
        nq["text"] = split_stem(nq.get("text") or "", premise)
        nq["explanation"] = build_rich_explanation({**nq, "text": nq["text"]})
        out.append(nq)
    return out


def firebase_cmd() -> list[str]:
    npm = Path.home() / "AppData" / "Roaming" / "npm" / "firebase.cmd"
    return [str(npm)] if npm.is_file() else ["firebase"]


def push_live(questions: list[dict]) -> None:
    payload = {
        "questions": {q["id"]: to_app_payload(q) for q in questions},
        "questionIds": {q["id"]: True for q in questions},
        "active": True,
    }
    tmp = ROOT / "dist" / "_upgrade_metin_v2.json"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    tmp.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    cmd = firebase_cmd() + [
        "database:update",
        "/" + TOPIC_BASE,
        str(tmp),
        "--project",
        PROJECT,
        "--force",
    ]
    subprocess.run(cmd, check=True, cwd=str(ROOT))

    cfg = json.loads(CDN_ADMIN.read_text(encoding="utf-8"))
    zone = cfg["storageZone"]
    api_key = cfg["storageApiKey"]
    region = str(cfg.get("region") or "de")
    version = int(cfg.get("version") or 1)
    host = {
        "de": "storage.bunnycdn.com",
        "ny": "ny.storage.bunnycdn.com",
    }.get(region, "storage.bunnycdn.com")

    for q in questions:
        app = to_app_payload(q)
        body = json.dumps(app, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        rpath = f"v{version}/rtdb/{TOPIC_BASE}/questions/{q['id']}.json"
        zone_q = quote(zone, safe="")
        parts = rpath.split("/")
        url = f"https://{host}/{zone_q}/" + "/".join(quote(p, safe="") for p in parts)
        req = urllib.request.Request(url, data=body, method="PUT")
        req.add_header("AccessKey", api_key)
        req.add_header("Content-Type", "application/json; charset=utf-8")
        with urllib.request.urlopen(req, timeout=120):
            pass

    idx = json.dumps(payload["questionIds"], ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    rpath = f"v{version}/rtdb/{TOPIC_BASE}/questionIds.json"
    url = f"https://{host}/{quote(zone, safe='')}/" + "/".join(quote(p, safe="") for p in rpath.split("/"))
    req = urllib.request.Request(url, data=idx, method="PUT")
    req.add_header("AccessKey", api_key)
    req.add_header("Content-Type", "application/json; charset=utf-8")
    with urllib.request.urlopen(req, timeout=60):
        pass


def main() -> int:
    sys.path.insert(0, str(BUILD_SCRIPT.parent))
    import importlib.util

    spec = importlib.util.spec_from_file_location("build_mt", BUILD_SCRIPT)
    build = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(build)

    # build script'ten soruları al, v2 ile zenginleştir
    raw = build.build_questions()
    questions = upgrade_questions(raw)

    # build modülünün export fonksiyonlarını güncelle
    build.to_app_payload = to_app_payload
    build.write_json(questions)
    build.patch_dllwrld(questions)
    build.write_word(questions)

    avg = sum(len(q["explanation"]) for q in questions) / len(questions)
    short = sum(1 for q in questions if len(q["explanation"]) < 120)
    print(f"150 soru güncellendi | ort. açıklama: {avg:.0f} karakter | kısa (<120): {short}")

    push_live(questions)
    print("Firebase + Bunny (t01) güncellendi.")
    print(f"Word: {build.WORD_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

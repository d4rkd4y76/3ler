#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""noktalama3_043 ve noktalama3_075–087 tekrarlarını özgün sorularla değiştirir."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "noktalama-gemini-raw.json"

REPLACEMENTS: dict[str, dict] = {
    "noktalama3_043": {
        "level": "orta",
        "premise": "Okul gezimiz pazartesi ( ) cuma günleri arasındaydı.",
        "text": "Bu cümlede günler arasına hangi noktalama işareti gelmelidir?",
        "correct": "Kısa çizgi (-)",
        "wrong1": "İki nokta (:)",
        "wrong2": "Tırnak işareti (' ')",
        "explanation": "İki gün veya tarih arasındaki aralığı belirtmek için kısa çizgi kullanılır.",
    },
    "noktalama3_075": {
        "level": "orta",
        "premise": "Tavşan ( ) Yavrum, havuçları yavaş ye.\nKaplumbağa ( ) Teşekkür ederim dostum.",
        "text": "Bu karşılıklı konuşmada boş bırakılan yerlere hangi noktalama işareti gelmelidir?",
        "correct": "İki nokta (:)",
        "wrong1": "Kısa çizgi (-)",
        "wrong2": "Tırnak işareti (' ')",
        "explanation": "Masal ve diyalog metinlerinde konuşan kişinin adından sonra iki nokta konur.",
    },
    "noktalama3_076": {
        "level": "kolay",
        "premise": None,
        "text": "Aşağıdaki cümlelerin hangisinde konuşmadan önce iki nokta (:) DOĞRU kullanılmıştır?",
        "correct": "Babam balkondan seslendi: Akşam yemeğine gelin.",
        "wrong1": "Babam balkondan: seslendi akşam yemeğine gelin.",
        "wrong2": "Babam: balkondan seslendi akşam yemeğine gelin.",
        "explanation": "Konuşma sözünden hemen önce iki nokta konur; cümlenin ortasına rastgele konmaz.",
    },
    "noktalama3_077": {
        "level": "orta",
        "premise": None,
        "text": "Aşağıdaki cümlelerin hangisinde iki nokta (:) YANLIŞ kullanılmıştır?",
        "correct": "Öğretmen: sınıfa girdi ve dersi anlatmaya başladı.",
        "wrong1": "Öğretmen sınıfa girdi ve dedi: Defterlerinizi açın.",
        "wrong2": "Kardeşim bağırdı: Bahçede top oynayalım!",
        "explanation": "İki nokta konuşma sözünden hemen önce gelir. Kişi adından sonra doğrudan eylem geliyorsa iki nokta kullanılmaz.",
    },
    "noktalama3_078": {
        "level": "kolay",
        "premise": "Kurt ( ) Kuzu, nereye gidiyorsun?\nKuzu ( ) Çayıra ot yemeye gidiyorum.",
        "text": "Bu masal diyaloğunda boş bırakılan yerlere hangi noktalama işareti gelmelidir?",
        "correct": "İki nokta (:)",
        "wrong1": "Virgül (,)",
        "wrong2": "Kısa çizgi (-)",
        "explanation": "Karşılıklı konuşmalarda konuşan hayvanın veya kişinin adından sonra iki nokta kullanılır.",
    },
    "noktalama3_079": {
        "level": "orta",
        "premise": "Sınıf başkanı duyuru yaptı( )",
        "text": "Bu cümlenin sonuna hangi noktalama işareti gelmelidir?",
        "correct": "İki nokta (:)",
        "wrong1": "Nokta (.)",
        "wrong2": "Kısa çizgi (-)",
        "explanation": "Yapılacak duyuru veya söylenecek söz aktarılmadan hemen önce iki nokta konur.",
    },
    "noktalama3_080": {
        "level": "kolay",
        "premise": None,
        "text": "Aşağıdaki cümlelerin hangisinde iki nokta (:) DOĞRU kullanılmıştır?",
        "correct": "Öğretmenimiz tahtaya yazdı: Bugün fen dersi var.",
        "wrong1": "Öğretmenimiz: tahtaya yazdı bugün fen dersi var.",
        "wrong2": "Öğretmenimiz tahtaya: yazdı bugün fen dersi var.",
        "explanation": "Yazılacak veya söylenecek sözden hemen önce iki nokta kullanılır.",
    },
    "noktalama3_081": {
        "level": "orta",
        "premise": "Dedem torununa masal okumaya başladı( )",
        "text": "Bu cümlenin sonuna hangi noktalama işareti gelmelidir?",
        "correct": "İki nokta (:)",
        "wrong1": "Tırnak işareti (' ')",
        "wrong2": "Virgül (,)",
        "explanation": "Okunacak masal metni aktarılmadan önce cümlenin sonuna iki nokta konur.",
    },
    "noktalama3_082": {
        "level": "kolay",
        "premise": "Antrenör takıma seslendi( )",
        "text": "Bu cümlenin sonuna hangi noktalama işareti gelmelidir?",
        "correct": "İki nokta (:)",
        "wrong1": "Kısa çizgi (-)",
        "wrong2": "Soru işareti (?)",
        "explanation": "Söylenecek söz aktarılmadan hemen önce iki nokta kullanılır.",
    },
    "noktalama3_083": {
        "level": "orta",
        "premise": None,
        "text": "Aşağıdaki cümlelerin hangisinde iki nokta (:) konuşma öncesinde DOĞRU kullanılmıştır?",
        "correct": "Veterinerimiz söyledi: Hayvanlara düzenli su verin.",
        "wrong1": "Veterinerimiz: söyledi hayvanlara düzenli su verin.",
        "wrong2": "Veterinerimiz söyledi hayvanlara: düzenli su verin.",
        "explanation": "Başkasının sözü aktarılırken konuşmadan hemen önce iki nokta konur.",
    },
    "noktalama3_084": {
        "level": "kolay",
        "premise": "Kütüphaneci bize fısıldayarak dedi( )",
        "text": "Bu cümlenin sonuna hangi noktalama işareti gelmelidir?",
        "correct": "İki nokta (:)",
        "wrong1": "Ünlem işareti (!)",
        "wrong2": "Kısa çizgi (-)",
        "explanation": "Söylenecek cümle aktarılmadan önce iki nokta kullanılır.",
    },
    "noktalama3_085": {
        "level": "orta",
        "premise": "Ayşe ( ) Bugün okuldan erken çıkacağım.\nFatma ( ) Ben de seninle gelirim.",
        "text": "Bu karşılıklı konuşmada boş bırakılan yerlere hangi noktalama işareti gelmelidir?",
        "correct": "İki nokta (:)",
        "wrong1": "Nokta (.)",
        "wrong2": "Tırnak işareti (' ')",
        "explanation": "İki kişinin karşılıklı konuşmasında konuşan kişinin adından sonra iki nokta konur.",
    },
    "noktalama3_086": {
        "level": "kolay",
        "premise": None,
        "text": "Matematikte 24 ÷ 3 = 8 işleminde bölme işareti yerine hangi noktalama işareti kullanılabilir?",
        "correct": "İki nokta (:)",
        "wrong1": "Kısa çizgi (-)",
        "wrong2": "Virgül (,)",
        "explanation": "İki nokta (:) matematikte bölme işlemini göstermek için de kullanılır. Örnek: 24 : 3 = 8",
    },
    "noktalama3_087": {
        "level": "orta",
        "premise": None,
        "text": "Aşağıdaki cümlelerin hangisinde iki nokta (:) YANLIŞ kullanılmıştır?",
        "correct": "Sabah erken: kalktım ve okula gittim.",
        "wrong1": "En sevdiğim meyveler: elma, armut, kiraz.",
        "wrong2": "Annem mutfaktan seslendi: Sofraya gelin çocuklar.",
        "explanation": "İki nokta, örnek veya açıklamadan ya da konuşmadan hemen önce konur. Cümlenin ortasına rastgele konmaz.",
    },
}


def main() -> int:
    data = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    by_id = {q["id"]: i for i, q in enumerate(data)}

    for qid, repl in REPLACEMENTS.items():
        if qid not in by_id:
            raise SystemExit(f"Bulunamadı: {qid}")
        data[by_id[qid]] = {"id": qid, **repl}

    RAW_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Güncellendi: {len(REPLACEMENTS)} soru -> {RAW_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

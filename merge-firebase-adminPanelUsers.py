# -*- coding: utf-8 -*-
"""
Mevcut firebase-database kurallarına adminPanelUsers ekler.
Kullanım: Bu klasörde rules-source.json dosyasına mevcut kurallarınızın TAM içeriğini yapıştırın, sonra:
  python merge-firebase-adminPanelUsers.py
Çıktı: firebase-database-rules.json
"""
from pathlib import Path

OLD = """    "admin": {
      ".read": true,
      ".write": true
    },
    "classes":"""

NEW = """    "admin": {
      ".read": true,
      ".write": true
    },
    "adminPanelUsers": {
      "$classId": {
        "$studentId": {
          ".read": true,
          ".write": true
        }
      }
    },
    "classes":"""

HERE = Path(__file__).resolve().parent
src = HERE / "rules-source.json"
dst = HERE / "firebase-database-rules.json"
if not src.is_file():
    raise SystemExit("rules-source.json bulunamadı. Mevcut kurallarınızı bu dosyaya kaydedin.")
text = src.read_text(encoding="utf-8")
if OLD not in text:
    # CRLF / LF farkı
    text2 = text.replace("\r\n", "\n")
    old2 = OLD.replace("\r\n", "\n")
    new2 = NEW.replace("\r\n", "\n")
    if old2 not in text2:
        raise SystemExit("admin / classes deseni bulunamadı. rules-source.json içeriğini kontrol edin.")
    out = text2.replace(old2, new2, 1).replace("\n", "\r\n") if "\r\n" in text[:200] else text2.replace(old2, new2, 1)
else:
    out = text.replace(OLD, NEW, 1)
dst.write_text(out, encoding="utf-8")
print("Tamam:", dst)

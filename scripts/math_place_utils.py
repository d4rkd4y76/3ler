#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ilkokul basamak adlari — birler, onlar, yuzler."""


def place_names(length: int) -> list[str]:
    """Soldan saga (yuksekten dusuge): yuzler, onlar, birler."""
    if length <= 1:
        return ["birler"]
    if length == 2:
        return ["onlar", "birler"]
    if length == 3:
        return ["yüzler", "onlar", "birler"]
    if length == 4:
        return ["binler", "yüzler", "onlar", "birler"]
    return [f"{i + 1}. basamak" for i in range(length)]


def sonraki_basamak(place: str) -> str:
    """Elde veya onluk bir sonraki (sol) basamaga gider."""
    return {
        "birler": "onlar",
        "onlar": "yüzler",
        "yüzler": "binler",
    }.get(place, "üst")


# Rakam + ek (Türkçe okunuşa göre: 2'den, 3'ten, 9'dan …)
_RAKAM_ABLATIVE = {
    0: "dan",
    1: "den",
    2: "den",
    3: "ten",
    4: "ten",
    5: "ten",
    6: "dan",
    7: "den",
    8: "den",
    9: "dan",
}

_RAKAM_ACCUSATIVE = {
    0: "ı",
    1: "i",
    2: "yi",
    3: "ü",
    4: "ü",
    5: "i",
    6: "yı",
    7: "yi",
    8: "i",
    9: "u",
}


def rakam_ablative(n: int) -> str:
    """Çıkarma: 2'den 8 çıkmaz, 0'dan 4 çıkmaz."""
    d = abs(int(n)) % 10
    return f"{n}'{_RAKAM_ABLATIVE[d]}"


def rakam_accusative(n: int) -> str:
    """Çarpma: 6 ile 3'ü çarparız."""
    d = abs(int(n)) % 10
    return f"{n}'{_RAKAM_ACCUSATIVE[d]}"

/**
 * BİRLEŞTİRELİM — Türkiye Yüzyılı Maarif Modeli
 * 1. grup sesler: a · n · e · t · i · l (ANETİL)
 * Pedagogi: ses → hece → kelime; yalnızca o ana kadar öğrenilen sesler.
 */
(function (global) {
  "use strict";

  var GROUP1_SOUNDS = [
    {
      id: "a",
      letter: "a",
      displayUpper: "A",
      displayLower: "a",
      color: "#e4572e",
      glow: "rgba(228,87,46,.45)",
      title: "a sesi",
      hint: "İlk sesimizi tanıyalım",
      icon: "🅰️",
      introSpeak: "Merhaba! Bu a sesi. Hadi birlikte a diyelim!",
      phoneme: "aaa",
      fusions: [
        {
          id: "a_intro",
          type: "intro",
          parts: ["a"],
          steps: [["a"]],
          result: "a",
          kind: "ses",
          label: "a sesini dinle",
          narration: "Bak, bu a. Ağzını aç, a!",
          celebrate: "Harika! a sesini öğrendin!"
        }
      ]
    },
    {
      id: "n",
      letter: "n",
      displayUpper: "N",
      displayLower: "n",
      color: "#2a9d8f",
      glow: "rgba(42,157,143,.45)",
      title: "n sesi",
      hint: "a ile n birleşiyor",
      icon: "𝑁",
      introSpeak: "Şimdi n sesi geldi. nn diye uzatalım!",
      phoneme: "nnn",
      fusions: [
        {
          id: "an",
          type: "hece",
          parts: ["a", "n"],
          steps: [["a", "n"]],
          result: "an",
          kind: "hece",
          label: "a + n → an",
          narration: "a ile n birleşiyor. Dinle: an!",
          celebrate: "Süper! an hecesini okuduk!"
        },
        {
          id: "na",
          type: "hece",
          parts: ["n", "a"],
          steps: [["n", "a"]],
          result: "na",
          kind: "hece",
          label: "n + a → na",
          narration: "n ile a birleşiyor. na!",
          celebrate: "Aferin! na hecesi tamam!"
        },
        {
          id: "ana",
          type: "kelime",
          parts: ["a", "n", "a"],
          mode: "chain",
          steps: [["a", "n"], ["an", "a"]],
          result: "ana",
          kind: "kelime",
          mediaKey: "ana",
          label: "a + n + a → ana",
          narration: "Şimdi ana kelimesini birleştirelim!",
          celebrate: "Yaşasın! Ana kelimesini okudun!"
        }
      ]
    },
    {
      id: "e",
      letter: "e",
      displayUpper: "E",
      displayLower: "e",
      color: "#457b9d",
      glow: "rgba(69,123,157,.45)",
      title: "e sesi",
      hint: "a · n · e ile yeni heceler",
      icon: "EE",
      introSpeak: "e sesi geldi. e diye söyleyelim!",
      phoneme: "eee",
      fusions: [
        {
          id: "en",
          type: "hece",
          parts: ["e", "n"],
          steps: [["e", "n"]],
          result: "en",
          kind: "hece",
          label: "e + n → en",
          narration: "e ile n birleşiyor: en!",
          celebrate: "Bravo! en hecesi!"
        },
        {
          id: "ne",
          type: "hece",
          parts: ["n", "e"],
          steps: [["n", "e"]],
          result: "ne",
          kind: "hece",
          label: "n + e → ne",
          narration: "n ile e birleşiyor: ne!",
          celebrate: "Harika! ne hecesi!"
        },
        {
          id: "anne",
          type: "kelime",
          parts: ["a", "n", "n", "e"],
          mode: "syllables",
          syllables: [["a", "n"], ["n", "e"]],
          steps: [["a", "n"], ["n", "e"]],
          result: "anne",
          kind: "kelime",
          mediaKey: "anne",
          label: "an + ne → anne",
          narration: "Önce an, sonra ne; en sonda anne!",
          celebrate: "Muhteşem! Anne kelimesini okudun!"
        },
        {
          id: "nane",
          type: "kelime",
          parts: ["n", "a", "n", "e"],
          mode: "syllables",
          syllables: [["n", "a"], ["n", "e"]],
          steps: [["n", "a"], ["n", "e"]],
          result: "nane",
          kind: "kelime",
          mediaKey: "nane",
          label: "na + ne → nane",
          narration: "Önce na, sonra ne; en sonda nane!",
          celebrate: "Süper! Nane kelimesi tamam!"
        },
        {
          id: "nene",
          type: "kelime",
          parts: ["n", "e", "n", "e"],
          mode: "syllables",
          syllables: [["n", "e"], ["n", "e"]],
          steps: [["n", "e"], ["n", "e"]],
          result: "nene",
          kind: "kelime",
          mediaKey: "nene",
          label: "ne + ne → nene",
          narration: "Önce ne, sonra ne; en sonda nene!",
          celebrate: "Aferin! Nene kelimesini okudun!"
        }
      ]
    },
    {
      id: "t",
      letter: "t",
      displayUpper: "T",
      displayLower: "t",
      color: "#9b5de5",
      glow: "rgba(155,93,229,.45)",
      title: "t sesi",
      hint: "a · n · e · t ile kelimeler",
      icon: "TT",
      introSpeak: "t sesi geldi. Kısa ve net: t!",
      phoneme: "tı",
      fusions: [
        {
          id: "at",
          type: "hece",
          parts: ["a", "t"],
          steps: [["a", "t"]],
          result: "at",
          kind: "kelime",
          mediaKey: "at",
          label: "a + t → at",
          narration: "a ile t birleşiyor. at!",
          celebrate: "Harika! At kelimesi!"
        },
        {
          id: "ta",
          type: "hece",
          parts: ["t", "a"],
          steps: [["t", "a"]],
          result: "ta",
          kind: "hece",
          label: "t + a → ta",
          narration: "t ile a birleşiyor: ta!",
          celebrate: "Süper! ta hecesi!"
        },
        {
          id: "et",
          type: "hece",
          parts: ["e", "t"],
          steps: [["e", "t"]],
          result: "et",
          kind: "kelime",
          mediaKey: "et",
          label: "e + t → et",
          narration: "e ile t birleşiyor. et!",
          celebrate: "Bravo! et kelimesi!"
        },
        {
          id: "te",
          type: "hece",
          parts: ["t", "e"],
          steps: [["t", "e"]],
          result: "te",
          kind: "hece",
          label: "t + e → te",
          narration: "t ile e birleşiyor: te!",
          celebrate: "Aferin! te hecesi!"
        },
        {
          id: "ata",
          type: "kelime",
          parts: ["a", "t", "a"],
          mode: "chain",
          steps: [["a", "t"], ["at", "a"]],
          result: "ata",
          kind: "kelime",
          mediaKey: "ata",
          label: "at + a → ata",
          narration: "at ile a birleşiyor. ata!",
          celebrate: "Yaşasın! Ata kelimesi!"
        },
        {
          id: "tane",
          type: "kelime",
          parts: ["t", "a", "n", "e"],
          mode: "syllables",
          syllables: [["t", "a"], ["n", "e"]],
          steps: [["t", "a"], ["n", "e"]],
          result: "tane",
          kind: "kelime",
          mediaKey: "tane",
          label: "ta + ne → tane",
          narration: "Önce ta, sonra ne; en sonda tane!",
          celebrate: "Muhteşem! Tane kelimesini okudun!"
        }
      ]
    },
    {
      id: "i",
      letter: "i",
      displayUpper: "İ",
      displayLower: "i",
      color: "#f4a261",
      glow: "rgba(244,162,97,.45)",
      title: "i sesi",
      hint: "a · n · e · t · i ile heceler",
      icon: "İİ",
      introSpeak: "i sesi geldi. Gülümseyerek i!",
      phoneme: "iii",
      fusions: [
        {
          id: "in",
          type: "hece",
          parts: ["i", "n"],
          steps: [["i", "n"]],
          result: "in",
          kind: "hece",
          label: "i + n → in",
          narration: "i ile n birleşiyor: in!",
          celebrate: "Harika! in hecesi!"
        },
        {
          id: "ni",
          type: "hece",
          parts: ["n", "i"],
          steps: [["n", "i"]],
          result: "ni",
          kind: "hece",
          label: "n + i → ni",
          narration: "n ile i birleşiyor: ni!",
          celebrate: "Süper! ni hecesi!"
        },
        {
          id: "it",
          type: "hece",
          parts: ["i", "t"],
          steps: [["i", "t"]],
          result: "it",
          kind: "hece",
          label: "i + t → it",
          narration: "i ile t birleşiyor: it!",
          celebrate: "Bravo! it hecesi!"
        },
        {
          id: "ti",
          type: "hece",
          parts: ["t", "i"],
          steps: [["t", "i"]],
          result: "ti",
          kind: "hece",
          label: "t + i → ti",
          narration: "t ile i birleşiyor: ti!",
          celebrate: "Aferin! ti hecesi!"
        },
        {
          id: "eti",
          type: "kelime",
          parts: ["e", "t", "i"],
          mode: "chain",
          steps: [["e", "t"], ["et", "i"]],
          result: "eti",
          kind: "kelime",
          mediaKey: "eti",
          label: "et + i → eti",
          narration: "et ile i birleşiyor. eti!",
          celebrate: "Yaşasın! eti kelimesi!"
        },
        {
          id: "teni",
          type: "kelime",
          parts: ["t", "e", "n", "i"],
          mode: "syllables",
          syllables: [["t", "e"], ["n", "i"]],
          steps: [["t", "e"], ["n", "i"]],
          result: "teni",
          kind: "kelime",
          mediaKey: "teni",
          label: "te + ni → teni",
          narration: "Önce te, sonra ni; en sonda teni!",
          celebrate: "Harika! teni kelimesi!"
        }
      ]
    },
    {
      id: "l",
      letter: "l",
      displayUpper: "L",
      displayLower: "l",
      color: "#06d6a0",
      glow: "rgba(6,214,160,.45)",
      title: "l sesi",
      hint: "1. grup tamam! A N E T İ L",
      icon: "LL",
      introSpeak: "Son sesimiz l! Dilini yukarı dokundur: l!",
      phoneme: "lll",
      fusions: [
        {
          id: "al",
          type: "hece",
          parts: ["a", "l"],
          steps: [["a", "l"]],
          result: "al",
          kind: "kelime",
          mediaKey: "al",
          label: "a + l → al",
          narration: "a ile l birleşiyor. al!",
          celebrate: "Süper! al kelimesi!"
        },
        {
          id: "la",
          type: "hece",
          parts: ["l", "a"],
          steps: [["l", "a"]],
          result: "la",
          kind: "hece",
          label: "l + a → la",
          narration: "l ile a birleşiyor: la!",
          celebrate: "Bravo! la hecesi!"
        },
        {
          id: "el",
          type: "hece",
          parts: ["e", "l"],
          steps: [["e", "l"]],
          result: "el",
          kind: "kelime",
          mediaKey: "el",
          label: "e + l → el",
          narration: "e ile l birleşiyor. el!",
          celebrate: "Harika! el kelimesi!"
        },
        {
          id: "le",
          type: "hece",
          parts: ["l", "e"],
          steps: [["l", "e"]],
          result: "le",
          kind: "hece",
          label: "l + e → le",
          narration: "l ile e birleşiyor: le!",
          celebrate: "Aferin! le hecesi!"
        },
        {
          id: "il",
          type: "hece",
          parts: ["i", "l"],
          steps: [["i", "l"]],
          result: "il",
          kind: "hece",
          label: "i + l → il",
          narration: "i ile l birleşiyor: il!",
          celebrate: "Süper! il hecesi!"
        },
        {
          id: "li",
          type: "hece",
          parts: ["l", "i"],
          steps: [["l", "i"]],
          result: "li",
          kind: "hece",
          label: "l + i → li",
          narration: "l ile i birleşiyor: li!",
          celebrate: "Bravo! li hecesi!"
        },
        {
          id: "ala",
          type: "kelime",
          parts: ["a", "l", "a"],
          mode: "chain",
          steps: [["a", "l"], ["al", "a"]],
          result: "ala",
          kind: "kelime",
          mediaKey: "ala",
          label: "al + a → ala",
          narration: "al ile a birleşiyor. ala!",
          celebrate: "Muhteşem! ala kelimesi!"
        },
        {
          id: "ali",
          type: "kelime",
          parts: ["a", "l", "i"],
          mode: "chain",
          steps: [["a", "l"], ["al", "i"]],
          result: "ali",
          kind: "kelime",
          mediaKey: "ali",
          label: "al + i → ali",
          narration: "al ile i birleşiyor. Ali!",
          celebrate: "Yaşasın! Ali ismini okudun!"
        },
        {
          id: "lale",
          type: "kelime",
          parts: ["l", "a", "l", "e"],
          mode: "syllables",
          syllables: [["l", "a"], ["l", "e"]],
          steps: [["l", "a"], ["l", "e"]],
          result: "lale",
          kind: "kelime",
          mediaKey: "lale",
          label: "la + le → lale",
          narration: "Önce la, sonra le; en sonda lale!",
          celebrate: "Harika! Lale kelimesini okudun!"
        },
        {
          id: "elle",
          type: "kelime",
          parts: ["e", "l", "l", "e"],
          mode: "syllables",
          syllables: [["e", "l"], ["l", "e"]],
          steps: [["e", "l"], ["l", "e"]],
          result: "elle",
          kind: "kelime",
          mediaKey: "elle",
          label: "el + le → elle",
          narration: "Önce el, sonra le; en sonda elle!",
          celebrate: "Süper! elle kelimesi!"
        }
      ]
    }
  ];

  function allMediaKeys() {
    var keys = [];
    var seen = {};
    GROUP1_SOUNDS.forEach(function (s) {
      (s.fusions || []).forEach(function (f) {
        if (f.mediaKey && !seen[f.mediaKey]) {
          seen[f.mediaKey] = true;
          keys.push({
            key: f.mediaKey,
            label: f.result,
            soundId: s.id,
            kind: f.kind || "kelime"
          });
        }
      });
    });
    return keys;
  }

  /** Admin: tüm hece/kelime sesleri (birleşme sonuçları + ara parçalar) */
  function allAudioSlots() {
    var seen = {};
    var out = [];
    function add(token, kind, soundId) {
      token = String(token || "").trim().toLowerCase();
      if (!token || seen[token]) return;
      seen[token] = true;
      out.push({
        key: token,
        label: token,
        kind: kind || "hece",
        soundId: soundId || ""
      });
    }
    GROUP1_SOUNDS.forEach(function (s) {
      (s.fusions || []).forEach(function (f) {
        (f.parts || []).forEach(function (p) {
          if (String(p).length > 1) add(p, "parça", s.id);
        });
        (f.steps || []).forEach(function (step) {
          (step || []).forEach(function (p) {
            if (String(p).length > 1) add(p, "parça", s.id);
          });
          if (step && step.length === 2) {
            add(String(step[0]) + String(step[1]), "birleşim", s.id);
          }
        });
        if (f.result) add(f.result, f.kind || "sonuç", s.id);
        if (f.mediaKey) add(f.mediaKey, f.kind || "kelime", s.id);
      });
    });
    out.sort(function (a, b) {
      if (a.key.length !== b.key.length) return a.key.length - b.key.length;
      return a.key.localeCompare(b.key, "tr");
    });
    return out;
  }

  function letterKeys() {
    return GROUP1_SOUNDS.map(function (s) {
      return { key: s.id, label: s.letter, title: s.title };
    });
  }

  function getSound(id) {
    id = String(id || "").toLowerCase();
    for (var i = 0; i < GROUP1_SOUNDS.length; i++) {
      if (GROUP1_SOUNDS[i].id === id) return GROUP1_SOUNDS[i];
    }
    return null;
  }

  function getFusion(soundId, fusionId) {
    var s = getSound(soundId);
    if (!s) return null;
    for (var i = 0; i < (s.fusions || []).length; i++) {
      if (s.fusions[i].id === fusionId) return s.fusions[i];
    }
    return null;
  }

  global.NovaBirlestirelimData = {
    GROUP1_ID: "grup1",
    GROUP1_TITLE: "1. Grup Sesler",
    GROUP1_SUBTITLE: "A · N · E · T · İ · L",
    GROUP1_TAGLINE: "Maarif Modeli · Sesleri birleştirelim",
    GROUP1_SOUNDS: GROUP1_SOUNDS,
    allMediaKeys: allMediaKeys,
    allAudioSlots: allAudioSlots,
    letterKeys: letterKeys,
    getSound: getSound,
    getFusion: getFusion
  };
})(typeof window !== "undefined" ? window : globalThis);

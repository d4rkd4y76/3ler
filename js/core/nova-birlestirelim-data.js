/**
 * BİRLEŞTİRELİM — Türkiye Yüzyılı Maarif Modeli
 * Ses grupları (kümülatif): 1) a n e t i l  2) o k u r ı m
 * 3) ü s ö y d z  4) ç b g c ş  5) p h v ğ f j
 * Yalnızca o ana kadar öğretilen seslerle hece/kelime.
 */
(function (global) {
  "use strict";

  /* ── helpers ─────────────────────────────────────────────── */

  var TR_VOWELS = "aeıioöuü";

  function isTrVowel(ch) {
    return TR_VOWELS.indexOf(String(ch || "").toLocaleLowerCase("tr-TR")) >= 0;
  }

  /** MEB heceleme: a-na, an-ne, fi-de, kar-deş */
  function syllabifyTR(word) {
    word = String(word || "").toLocaleLowerCase("tr-TR");
    if (!word) return [];
    var ch = Array.from(word);
    var marks = [];
    for (var i = 0; i < ch.length; i++) {
      if (isTrVowel(ch[i])) marks.push(i);
    }
    if (marks.length <= 1) return [word];
    var cuts = [];
    for (var k = 0; k < marks.length - 1; k++) {
      var v1 = marks[k];
      var v2 = marks[k + 1];
      var cons = v2 - v1 - 1;
      if (cons <= 0) cuts.push(v1 + 1);
      else if (cons === 1) cuts.push(v1 + 1); /* V | CV */
      else if (cons === 2) cuts.push(v1 + 2); /* VC | CV */
      else cuts.push(v1 + Math.min(3, cons)); /* VCC | CV */
    }
    var parts = [];
    var prev = 0;
    for (var c = 0; c < cuts.length; c++) {
      parts.push(ch.slice(prev, cuts[c]).join(""));
      prev = cuts[c];
    }
    parts.push(ch.slice(prev).join(""));
    return parts.filter(Boolean);
  }

  /** Heceyi sahne birleştirmesi için en fazla 2 parçaya böl (f-i, ka-n) */
  function sylParts(syl) {
    var c = Array.from(String(syl || ""));
    if (!c.length) return [""];
    if (c.length === 1) return [c[0]];
    if (c.length === 2) return [c[0], c[1]];
    /* Kapalı hece: açık hece + son sessiz → ka + n */
    return [c.slice(0, c.length - 1).join(""), c[c.length - 1]];
  }

  function intro(letter, opts) {
    opts = opts || {};
    return {
      id: opts.id || letter + "_intro",
      type: "intro",
      parts: [letter],
      steps: [[letter]],
      result: letter,
      kind: "ses",
      label: opts.label || letter + " sesini dinle",
      narration: opts.narration || ("Bak, bu " + letter + ". Ağzını aç, " + letter + "!"),
      celebrate: opts.celebrate || ("Harika! " + letter + " sesini öğrendin!")
    };
  }

  function hece(a, b, opts) {
    opts = opts || {};
    var result = opts.result != null ? opts.result : a + b;
    var isWord = !!opts.mediaKey || opts.kind === "kelime";
    var o = {
      id: opts.id || result,
      type: "hece",
      parts: [a, b],
      steps: [[a, b]],
      result: result,
      kind: opts.kind || (isWord ? "kelime" : "hece"),
      label: opts.label || a + " + " + b + " → " + result,
      narration:
        opts.narration ||
        (a + " ile " + b + " birleşiyor" + (isWord ? ". " : ": ") + result + "!"),
      celebrate: opts.celebrate || ((isWord ? "Harika! " : "Süper! ") + result + (isWord ? " kelimesi!" : " hecesi!"))
    };
    if (opts.mediaKey) o.mediaKey = opts.mediaKey === true ? result : opts.mediaKey;
    return o;
  }

  /** 3 harfli kapalı hece (tek hece): t+e→te, te+n→ten — tray’de hece kırılmaz */
  function chain(a, b, c, opts) {
    opts = opts || {};
    var result = opts.result != null ? opts.result : a + b + c;
    return wordFusion(result, opts);
  }

  /** Harf listesinden doğru heceli kelime birleştirmesi */
  function fuse(letters, opts) {
    opts = opts || {};
    var result = opts.result != null ? opts.result : (letters || []).join("");
    return wordFusion(result, opts);
  }

  function capitalizeTR(word) {
    var chars = Array.from(String(word || ""));
    if (!chars.length) return "";
    chars[0] = chars[0].toLocaleUpperCase("tr-TR");
    return chars.join("");
  }

  /** Maarif: özel isimler büyük harfle (Ali, Ata, Lale…). “anne” özel isim değildir. */
  var PROPER_NAMES = {
    ali: 1,
    ata: 1,
    nil: 1,
    ela: 1,
    lale: 1,
    nene: 1,
    nalan: 1,
    nail: 1,
    naile: 1,
    talat: 1,
    /* Grup 3 piramit özne adları */
    ümit: 1,
    ülkü: 1,
    ünal: 1,
    tülin: 1,
    ilker: 1,
    umut: 1,
    suna: 1,
    sinan: 1,
    aslı: 1,
    selim: 1,
    osman: 1,
    sultan: 1,
    ömer: 1,
    öner: 1,
    ömür: 1,
    önal: 1,
    ayla: 1,
    oya: 1,
    kaya: 1,
    yaman: 1,
    yasin: 1,
    aykut: 1,
    arda: 1,
    eda: 1,
    didem: 1,
    derya: 1,
    damla: 1,
    dursun: 1,
    zeki: 1,
    ziya: 1,
    azra: 1,
    zerrin: 1,
    ozan: 1,
    zekiye: 1,
    /* Grup 4 piramit özne adları */
    çetin: 1,
    ayça: 1,
    selçuk: 1,
    seçil: 1,
    orçun: 1,
    tunç: 1,
    burak: 1,
    berna: 1,
    bora: 1,
    batu: 1,
    betül: 1,
    banu: 1,
    bülent: 1,
    gamze: 1,
    tolga: 1,
    gül: 1,
    gizem: 1,
    gaye: 1,
    gürsel: 1,
    gürkan: 1,
    cem: 1,
    can: 1,
    ceren: 1,
    ceyhun: 1,
    ceyda: 1,
    candan: 1,
    cengiz: 1,
    şaban: 1,
    şermin: 1,
    şenol: 1,
    şenay: 1,
    şükrü: 1,
    şule: 1,
        şakir: 1,
    /* Grup 5 piramit / metin özne adları */
    polat: 1,
    pelin: 1,
    alper: 1,
    pınar: 1,
    toprak: 1,
    serpil: 1,
    poyraz: 1,
    hasan: 1,
    hande: 1,
    hakan: 1,
    hale: 1,
    halil: 1,
    hira: 1,
    hamza: 1,
    hülya: 1,
    veli: 1,
    vedat: 1,
    sevgi: 1,
    volkan: 1,
    merve: 1,
    vildan: 1,
    veysel: 1,
    sevim: 1,
    uğur: 1,
    çağla: 1,
    yiğit: 1,
    yağız: 1,
    tuğçe: 1,
    oğuz: 1,
    doğa: 1,
    fatih: 1,
    elif: 1,
    funda: 1,
    efe: 1,
    furkan: 1,
    defne: 1,
    fikret: 1,
    jale: 1,
    ejder: 1,
    tanju: 1,
    müjde: 1,
    jülide: 1,
    ajda: 1,
    çağdaş: 1
  };

  function isProperName(word) {
    return !!PROPER_NAMES[String(word || "").toLocaleLowerCase("tr-TR")];
  }

  /** Küçük harfli heceleri görünen (büyük harfli) kelimeye hizala: Ali → A + li */
  function alignSyllableDisplay(displayWord, lowerSyllables) {
    var chars = Array.from(String(displayWord || ""));
    var out = [];
    var idx = 0;
    for (var i = 0; i < (lowerSyllables || []).length; i++) {
      var n = Array.from(lowerSyllables[i]).length;
      out.push(chars.slice(idx, idx + n).join("") || lowerSyllables[i]);
      idx += n;
    }
    return out;
  }

  function formatDisplayWord(lowerWord, forceCapital) {
    lowerWord = String(lowerWord || "").toLocaleLowerCase("tr-TR");
    /* Cümle başı (forceCapital) veya özel isim → büyük; anne özel isim değil */
    if (forceCapital || isProperName(lowerWord)) return capitalizeTR(lowerWord);
    return lowerWord;
  }

  function wordFusion(result, opts) {
    opts = opts || {};
    var lower = String(result || "").toLocaleLowerCase("tr-TR");
    var display = formatDisplayWord(lower, !!opts.proper);
    result = lower;
    var syls = syllabifyTR(result);
    var displaySyls = alignSyllableDisplay(display, syls);
    var letters = Array.from(result);

    if (syls.length <= 1) {
      if (letters.length <= 2) {
        var h = hece(letters[0] || "", letters[1] || "", {
          id: opts.id,
          mediaKey: opts.mediaKey === false ? false : opts.mediaKey || true,
          kind: "kelime",
          label: opts.label,
          narration: opts.narration,
          celebrate: opts.celebrate
        });
        h.result = display;
        h.label = opts.label || (displaySyls.join(" + ") || letters.join(" + ")) + " → " + display;
        return h;
      }
      /*
       * Tek heceli kelime (tren, kart, renk…): HECEYE AYRILMAZ.
       * Harf harf tr→tre→tren YANLIŞ — “tr” ünlüsüz, hece değildir.
       * Doğru birleştirme: kapalı hece = gövde + son ünsüz → tre + n → tren
       */
      var monoParts = sylParts(result);
      var monoDisplay = alignSyllableDisplay(display, monoParts);
      var oMono = {
        id: opts.id || result,
        type: "kelime",
        mode: "simple",
        parts: monoParts,
        steps: [monoDisplay.slice()],
        result: display,
        say: result,
        kind: "kelime",
        label: opts.label || monoDisplay.join(" + ") + " → " + display,
        narration:
          opts.narration ||
          (display + " tek hecedir. " + monoDisplay.join(" + ") + " → " + display + "!"),
        celebrate: opts.celebrate || ("Muhteşem! " + display + "!")
      };
      if (opts.mediaKey !== false) {
        oMono.mediaKey = opts.mediaKey && opts.mediaKey !== true ? opts.mediaKey : result;
      }
      return oMono;
    }

    /* Çok heceli: fi-de, a-na, an-ne — ekranda özel isim büyük harfli */
    var syllables = displaySyls.map(function (ds, i) {
      var parts = sylParts(syls[i]);
      if (!isProperName(result) && !opts.proper) return parts;
      /* İlk hecenin ilk harfi büyük kalsın: A + li */
      var dChars = Array.from(ds);
      var pChars = [];
      var p = 0;
      for (var pi = 0; pi < parts.length; pi++) {
        var plen = Array.from(parts[pi]).length;
        pChars.push(dChars.slice(p, p + plen).join("") || parts[pi]);
        p += plen;
      }
      return pChars;
    });
    var leftLabel = displaySyls.join(" + ");
    var o = {
      id: opts.id || result,
      type: "kelime",
      mode: "syllables",
      parts: letters,
      syllables: syllables,
      displaySyllables: displaySyls,
      say: result,
      steps: syllables.map(function (s) {
        return s.slice();
      }),
      result: display,
      kind: "kelime",
      label: opts.label || leftLabel + " → " + display,
      narration:
        syls.length === 2
          ? opts.narration || ("Önce " + displaySyls[0] + ", sonra " + displaySyls[1] + "; en sonda " + display + "!")
          : opts.narration || ("Heceleri birleştirelim: " + displaySyls.join(" · ") + " → " + display + "!"),
      celebrate: opts.celebrate || ("Süper! " + display + " kelimesi!")
    };
    if (opts.mediaKey !== false) {
      o.mediaKey = opts.mediaKey && opts.mediaKey !== true ? opts.mediaKey : result;
    }
    return o;
  }

  /** syl(a,b,c,d,word) veya syl([[a,b],[c,d]], word, opts) — heceler doğrulanır */
  function syl(a, b, c, d, word, opts) {
    var syllables;
    var result;
    if (Array.isArray(a)) {
      opts = c || {};
      result = String(b || "").toLocaleLowerCase("tr-TR");
      /* Verilen parçalar yerine Türkçe hecelemeyi kullan */
      return wordFusion(result, opts);
    }
    result = String(word || a + b + c + d).toLocaleLowerCase("tr-TR");
    opts = opts || {};
    return wordFusion(result, opts);
  }

  /** Yanlış chain/fuse kalıntılarını düzelt */
  function normalizeFusion(f) {
    if (!f || typeof f !== "object") return f;
    if (f.type === "intro" || f.kind === "ses") return f;
    if (f.kind === "cumle" || f.type === "cumle" || f.mode === "sentence") return f;
    if (f.kind === "metin" || f.type === "metin" || f.mode === "text") return f;
    if (f.kind === "piramit" || f.type === "piramit" || f.mode === "pyramid") return f;
    var word = String(f.result || "").toLocaleLowerCase("tr-TR");
    if (word.length < 3) return f;
    if (f.kind !== "kelime" && f.type !== "kelime" && !f.mediaKey && f.mode !== "chain" && f.mode !== "syllables") {
      return f;
    }
    /* İki harfli hece — dokunma */
    if (word.length === 2 && f.mode !== "chain" && f.mode !== "syllables") return f;

    var fixed = wordFusion(word, {
      id: f.id,
      mediaKey: f.mediaKey === undefined ? true : f.mediaKey,
      label: f.label,
      narration: f.narration,
      celebrate: f.celebrate
    });
    /* mediaKey false korunması */
    if (f.mediaKey === false) {
      delete fixed.mediaKey;
    } else if (f.mediaKey && f.mediaKey !== true) {
      fixed.mediaKey = f.mediaKey;
    }
    if (f.id) fixed.id = f.id;
    return fixed;
  }

  function sound(cfg, groupId, fusions) {
    var letter = cfg.letter;
    return {
      id: cfg.id || letter,
      letter: letter,
      displayUpper: cfg.displayUpper || letter.toLocaleUpperCase("tr-TR"),
      displayLower: cfg.displayLower || letter,
      color: cfg.color,
      glow: cfg.glow,
      title: cfg.title || letter + " sesi",
      hint: cfg.hint || "",
      icon: cfg.icon || letter.toLocaleUpperCase("tr-TR"),
      introSpeak: cfg.introSpeak || ("Bu " + letter + " sesi. Hadi birlikte söyleyelim!"),
      phoneme: cfg.phoneme || letter,
      groupId: groupId,
      fusions: fusions || [intro(letter)]
    };
  }

  function W(key) { return { mediaKey: key === true || key == null ? true : key, kind: "kelime" }; }

  /* ═══════════════════════════════════════════════════════════
   * GROUP 1 — a n e t i l
   * ═══════════════════════════════════════════════════════════ */

  var GROUP1_SOUNDS = [
    sound(
      {
        id: "a",
        letter: "a",
        color: "#e4572e",
        glow: "rgba(228,87,46,.45)",
        hint: "İlk sesimizi tanıyalım",
        icon: "🅰️",
        introSpeak: "Merhaba! Bu a sesi. Hadi birlikte a diyelim!",
        phoneme: "aaa"
      },
      "grup1",
      [
        intro("a", {"narration":"Bak, bu a. Ağzını aç, a!","celebrate":"Harika! a sesini öğrendin!"})
      ]
    )
    ,
    sound(
      {
        id: "n",
        letter: "n",
        color: "#2a9d8f",
        glow: "rgba(42,157,143,.45)",
        hint: "a ile n birleşiyor",
        icon: "𝑁",
        introSpeak: "Şimdi n sesi geldi. nn diye uzatalım!",
        phoneme: "nnn"
      },
      "grup1",
      [
        intro("n"),
        hece("a", "n", {"narration":"a ile n birleşiyor. Dinle: an!","celebrate":"Süper! an hecesini okuduk!"}),
        hece("n", "a", {"narration":"n ile a birleşiyor. na!","celebrate":"Aferin! na hecesi tamam!"}),
        chain("a", "n", "a", {"mediaKey":"ana","narration":"Şimdi ana kelimesini birleştirelim!","celebrate":"Yaşasın! Ana kelimesini okudun!"})
      ]
    )
    ,
    sound(
      {
        id: "e",
        letter: "e",
        color: "#457b9d",
        glow: "rgba(69,123,157,.45)",
        hint: "a · n · e ile yeni heceler",
        icon: "EE",
        introSpeak: "e sesi geldi. e diye söyleyelim!",
        phoneme: "eee"
      },
      "grup1",
      [
        intro("e"),
        hece("e", "n"),
        hece("n", "e"),
        hece("e", "a"),
        chain("e", "n", "a", {"mediaKey":"ena"}),
        chain("a", "n", "e", {"mediaKey":"ane"}),
        syl("a", "n", "n", "e", "anne", {"narration":"Önce an, sonra ne; en sonda anne!","celebrate":"Muhteşem! anne kelimesini okudun!"}),
        syl("n", "a", "n", "e", "nane", {"narration":"Önce na, sonra ne; en sonda nane!","celebrate":"Süper! Nane kelimesi tamam!"}),
        syl("n", "e", "n", "e", "nene", {"narration":"Önce ne, sonra ne; en sonda nene!","celebrate":"Aferin! Nene kelimesini okudun!"})
      ]
    )
    ,
    sound(
      {
        id: "t",
        letter: "t",
        color: "#9b5de5",
        glow: "rgba(155,93,229,.45)",
        hint: "a · n · e · t ile kelimeler",
        icon: "TT",
        introSpeak: "t sesi geldi. Kısa ve net: t!",
        phoneme: "tı"
      },
      "grup1",
      [
        intro("t"),
        hece("a", "t", {"mediaKey":"at","kind":"kelime","narration":"a ile t birleşiyor. at!","celebrate":"Harika! At kelimesi!"}),
        hece("t", "a"),
        hece("e", "t", {"mediaKey":"et","kind":"kelime","narration":"e ile t birleşiyor. et!","celebrate":"Bravo! et kelimesi!"}),
        hece("t", "e"),
        chain("t", "e", "n", {"mediaKey":"ten","narration":"te ile n: ten!","celebrate":"Süper! ten!"}),
        chain("n", "a", "t", {"mediaKey":"nat"}),
        chain("t", "a", "t", {"mediaKey":"tat","narration":"ta ile t: tat!","celebrate":"Harika! Tat kelimesi!"}),
        chain("n", "e", "t", {"mediaKey":"net","narration":"ne ile t: net!","celebrate":"Bravo! net!"}),
        chain("t", "a", "n", {"mediaKey":"tan","narration":"ta ile n: tan!","celebrate":"Aferin! tan!"}),
        chain("a", "t", "a", {"mediaKey":"ata","narration":"at ile a birleşiyor. ata!","celebrate":"Yaşasın! Ata kelimesi!"}),
        syl("t", "a", "n", "e", "tane", {"narration":"Önce ta, sonra ne; en sonda tane!","celebrate":"Muhteşem! Tane kelimesini okudun!"}),
        syl("n", "a", "t", "e", "nate"),
        syl("e", "t", "e", "n", "eten")
      ]
    )
    ,
    sound(
      {
        id: "i",
        letter: "i",
        displayUpper: "İ",
        color: "#f4a261",
        glow: "rgba(244,162,97,.45)",
        hint: "a · n · e · t · i ile heceler",
        icon: "İİ",
        introSpeak: "i sesi geldi. Gülümseyerek i!",
        phoneme: "iii"
      },
      "grup1",
      [
        intro("i"),
        hece("i", "n"),
        hece("n", "i"),
        hece("i", "t"),
        hece("t", "i"),
        chain("e", "t", "i", {"mediaKey":"eti","narration":"et ile i birleşiyor. eti!","celebrate":"Yaşasın! eti kelimesi!"}),
        chain("i", "n", "a", {"mediaKey":"ina"}),
        chain("a", "n", "i", {"mediaKey":"ani"}),
        chain("i", "n", "e", {"mediaKey":"ine"}),
        chain("n", "i", "t", {"mediaKey":"nit"}),
        chain("t", "i", "n", {"mediaKey":"tin"}),
        chain("i", "t", "i", {"mediaKey":"iti"}),
        fuse(["i","n","e","t"], {"mediaKey":"inet"}),
        fuse(["n","i","t","e"], {"mediaKey":"nite"}),
        fuse(["t","i","n","i"], {"mediaKey":"tini"}),
        syl("t", "e", "n", "i", "teni", {"narration":"Önce te, sonra ni; en sonda teni!","celebrate":"Harika! teni kelimesi!"}),
        syl("a", "n", "t", "i", "anti"),
        syl("n", "e", "t", "i", "neti")
      ]
    )
    ,
    sound(
      {
        id: "l",
        letter: "l",
        color: "#06d6a0",
        glow: "rgba(6,214,160,.45)",
        hint: "1. grup tamam! A N E T İ L",
        icon: "LL",
        introSpeak: "Son sesimiz l! Dilini yukarı dokundur: l!",
        phoneme: "lll"
      },
      "grup1",
      [
        intro("l"),
        hece("a", "l", {"mediaKey":"al","kind":"kelime","narration":"a ile l birleşiyor. al!","celebrate":"Süper! al kelimesi!"}),
        hece("l", "a"),
        hece("e", "l", {"mediaKey":"el","kind":"kelime","narration":"e ile l birleşiyor. el!","celebrate":"Harika! el kelimesi!"}),
        hece("l", "e"),
        hece("i", "l"),
        hece("l", "i"),
        chain("a", "l", "a", {"mediaKey":"ala","narration":"al ile a birleşiyor. ala!","celebrate":"Muhteşem! ala kelimesi!"}),
        chain("a", "l", "i", {"mediaKey":"ali","narration":"al ile i birleşiyor. Ali!","celebrate":"Yaşasın! Ali ismini okudun!"}),
        chain("e", "l", "i", {"mediaKey":"eli"}),
        chain("i", "l", "e", {"mediaKey":"ile","narration":"il ile e: ile!","celebrate":"Harika! ile!"}),
        chain("e", "l", "e", {"mediaKey":"ele"}),
        chain("l", "e", "l", {"mediaKey":"lel"}),
        chain("n", "a", "l", {"mediaKey":"nal","narration":"na ile l: nal!","celebrate":"Süper! Nal kelimesi!"}),
        chain("l", "a", "n", {"mediaKey":"lan"}),
        chain("t", "e", "l", {"mediaKey":"tel","narration":"te ile l: tel!","celebrate":"Bravo! Tel kelimesi!"}),
        chain("l", "a", "t", {"mediaKey":"lat"}),
        chain("t", "i", "l", {"mediaKey":"til"}),
        chain("l", "i", "t", {"mediaKey":"lit"}),
        chain("a", "l", "t", {"mediaKey":"alt"}),
        fuse(["i","l","e","t"], {"mediaKey":"ilet"}),
        syl("l", "a", "l", "e", "lale", {"narration":"Önce la, sonra le; en sonda lale!","celebrate":"Harika! Lale kelimesini okudun!"}),
        syl("e", "l", "l", "e", "elle", {"narration":"Önce el, sonra le; en sonda elle!","celebrate":"Süper! elle kelimesi!"}),
        syl("l", "i", "l", "a", "lila"),
        syl("e", "l", "a", "l", "elal"),
        syl("a", "l", "e", "l", "alel"),
        syl("n", "e", "l", "i", "neli"),
        syl("t", "e", "l", "i", "teli")
      ]
    )
  ];

  /* GROUP 2 — o k u r ı m (+ G1) */
  var GROUP2_SOUNDS = [
    sound(
      {
        id: "o",
        letter: "o",
        color: "#e76f51",
        glow: "rgba(231,111,81,.45)",
        hint: "2. grup · o",
        icon: "OO",
        introSpeak: "o sesi geldi. Yuvarlak ağız: o!",
        phoneme: "ooo"
      },
      "grup2",
      [
        intro("o"),
        hece("o", "n"),
        hece("n", "o", {"mediaKey":"no","kind":"kelime"}),
        hece("o", "t", {"mediaKey":"ot","kind":"kelime"}),
        hece("t", "o"),
        hece("o", "l", {"mediaKey":"ol","kind":"kelime"}),
        hece("l", "o"),
        hece("o", "a"),
        hece("a", "o"),
        hece("o", "e"),
        hece("e", "o"),
        hece("o", "i"),
        hece("i", "o"),
        chain("o", "t", "o", {"mediaKey":"oto","narration":"ot ile o: oto!","celebrate":"Yaşasın! Oto kelimesi!"}),
        chain("o", "l", "a", {"mediaKey":"ola"}),
        chain("a", "l", "o", {"mediaKey":"alo","narration":"al ile o: alo!","celebrate":"Harika! Alo!"}),
        chain("t", "o", "n", {"mediaKey":"ton"}),
        chain("n", "o", "t", {"mediaKey":"not","narration":"no ile t: not!","celebrate":"Süper! Not kelimesi!"}),
        chain("o", "n", "a", {"mediaKey":"ona"}),
        chain("t", "o", "l", {"mediaKey":"tol"}),
        chain("l", "o", "t", {"mediaKey":"lot"}),
        chain("o", "n", "i", {"mediaKey":"oni"}),
        chain("o", "l", "i", {"mediaKey":"oli"}),
        syl("o", "n", "a", "t", "onat"),
        syl("n", "o", "t", "a", "nota"),
        syl("t", "e", "l", "o", "telo"),
        syl("a", "l", "t", "o", "alto"),
        syl("o", "l", "a", "n", "olan"),
        syl("n", "o", "n", "o", "nono")
      ]
    )
    ,
    sound(
      {
        id: "k",
        letter: "k",
        color: "#264653",
        glow: "rgba(38,70,83,.45)",
        hint: "2. grup · k",
        icon: "KK",
        introSpeak: "k sesi geldi. Kısa ve sert: k!",
        phoneme: "kı"
      },
      "grup2",
      [
        intro("k"),
        hece("k", "a"),
        hece("a", "k", {"mediaKey":"ak","kind":"kelime"}),
        hece("k", "e"),
        hece("e", "k", {"mediaKey":"ek","kind":"kelime"}),
        hece("k", "i"),
        hece("i", "k"),
        hece("k", "o"),
        hece("o", "k", {"mediaKey":"ok","kind":"kelime"}),
        hece("k", "e", {"id":"dup"}),
        chain("k", "e", "k", {"mediaKey":"kek","narration":"ke ile k: kek!","celebrate":"Yaşasın! Kek kelimesi!"}),
        chain("t", "e", "k", {"mediaKey":"tek","narration":"te ile k: tek!","celebrate":"Harika! tek!"}),
        chain("t", "o", "k", {"mediaKey":"tok"}),
        chain("k", "a", "n", {"mediaKey":"kan"}),
        chain("k", "o", "l", {"mediaKey":"kol","narration":"ko ile l: kol!","celebrate":"Süper! Kol kelimesi!"}),
        chain("l", "o", "k", {"mediaKey":"lok"}),
        chain("k", "i", "l", {"mediaKey":"kil"}),
        chain("n", "a", "k", {"mediaKey":"nak"}),
        fuse(["k","a","l","e"], {"mediaKey":"kale","narration":"kale kelimesini birleştirelim!","celebrate":"Muhteşem! Kale!"}),
        fuse(["i","n","e","k"], {"mediaKey":"inek","narration":"inek kelimesini birleştirelim!","celebrate":"Yaşasın! İnek!"}),
        fuse(["k","o","l","a"], {"mediaKey":"kola"}),
        fuse(["k","a","n","o"], {"mediaKey":"kano"}),
        fuse(["k","i","l","o"], {"mediaKey":"kilo"}),
        fuse(["k","o","l","i"], {"mediaKey":"koli"}),
        fuse(["e","k","i","n"], {"mediaKey":"ekin"}),
        fuse(["t","a","k","i"], {"mediaKey":"taki"}),
        fuse(["o","k","a","l"], {"mediaKey":"okal"}),
        syl("k", "e", "k", "e", "keke"),
        syl("e", "k", "e", "k", "ekek"),
        syl("a", "k", "i", "l", "akil"),
        syl("k", "a", "l", "a", "kala"),
        syl("n", "a", "k", "a", "naka"),
        syl("t", "e", "k", "e", "teke")
      ]
    )
    ,
    sound(
      {
        id: "u",
        letter: "u",
        color: "#3a86ff",
        glow: "rgba(58,134,255,.45)",
        hint: "2. grup · u",
        icon: "UU",
        introSpeak: "u sesi geldi. Dudaklarını büz: u!",
        phoneme: "uuu"
      },
      "grup2",
      [
        intro("u"),
        hece("u", "n", {"mediaKey":"un","kind":"kelime"}),
        hece("n", "u"),
        hece("u", "t"),
        hece("t", "u"),
        hece("u", "l"),
        hece("l", "u"),
        hece("u", "k"),
        hece("k", "u"),
        hece("u", "a"),
        hece("a", "u"),
        hece("u", "e"),
        hece("e", "u"),
        hece("u", "i"),
        hece("i", "u"),
        hece("u", "o"),
        hece("o", "u"),
        chain("k", "u", "n", {"mediaKey":"kun"}),
        chain("t", "u", "t", {"mediaKey":"tut"}),
        chain("k", "u", "l", {"mediaKey":"kul"}),
        chain("l", "u", "k", {"mediaKey":"luk"}),
        chain("u", "l", "u", {"mediaKey":"ulu"}),
        chain("n", "u", "n", {"mediaKey":"nun"}),
        fuse(["k","u","t","u"], {"mediaKey":"kutu","narration":"kutu kelimesini birleştirelim!","celebrate":"Yaşasın! Kutu!"}),
        fuse(["o","k","u","l"], {"mediaKey":"okul","narration":"okul kelimesini birleştirelim!","celebrate":"Muhteşem! Okul!"}),
        fuse(["k","o","k","u"], {"mediaKey":"koku","narration":"koku kelimesini birleştirelim!","celebrate":"Süper! Koku!"}),
        fuse(["k","u","l","e"], {"mediaKey":"kule"}),
        fuse(["k","u","l","a"], {"mediaKey":"kula"}),
        fuse(["k","u","l","a","k"], {"mediaKey":"kulak","narration":"kulak: ku + lak!","celebrate":"Harika! Kulak!"}),
        fuse(["t","u","t","u"], {"mediaKey":"tutu"}),
        fuse(["k","u","k","u"], {"mediaKey":"kuku"}),
        fuse(["u","n","l","u"], {"mediaKey":"unlu"}),
        fuse(["t","u","l","u"], {"mediaKey":"tulu"}),
        fuse(["k","o","l","u"], {"mediaKey":"kolu"}),
        syl("k", "u", "l", "u", "kulu"),
        syl("n", "u", "n", "u", "nunu"),
        syl("t", "u", "t", "a", "tuta"),
        syl("u", "n", "i", "t", "unit")
      ]
    )
    ,
    sound(
      {
        id: "r",
        letter: "r",
        color: "#ff006e",
        glow: "rgba(255,0,110,.45)",
        hint: "2. grup · r",
        icon: "RR",
        introSpeak: "r sesi geldi. Titretelim: r!",
        phoneme: "rrr"
      },
      "grup2",
      [
        intro("r"),
        hece("a", "r", {"mediaKey":"ar","kind":"kelime"}),
        hece("r", "a"),
        hece("e", "r", {"mediaKey":"er","kind":"kelime"}),
        hece("r", "e"),
        hece("i", "r"),
        hece("r", "i"),
        hece("o", "r", {"mediaKey":"or","kind":"kelime"}),
        hece("r", "o"),
        hece("u", "r"),
        hece("r", "u"),
        chain("a", "r", "a", {"mediaKey":"ara","narration":"ar ile a: ara!","celebrate":"Yaşasın! Ara kelimesi!"}),
        chain("k", "a", "r", {"mediaKey":"kar","narration":"ka ile r: kar!","celebrate":"Harika! Kar kelimesi!"}),
        chain("n", "a", "r", {"mediaKey":"nar","narration":"na ile r: nar!","celebrate":"Süper! Nar kelimesi!"}),
        chain("t", "a", "r", {"mediaKey":"tar"}),
        chain("t", "u", "r", {"mediaKey":"tur"}),
        chain("n", "u", "r", {"mediaKey":"nur"}),
        chain("k", "o", "r", {"mediaKey":"kor"}),
        chain("k", "u", "r", {"mediaKey":"kur"}),
        chain("r", "a", "k", {"mediaKey":"rak"}),
        chain("r", "o", "k", {"mediaKey":"rok"}),
        fuse(["k","a","r","e"], {"mediaKey":"kare","narration":"kare kelimesini birleştirelim!","celebrate":"Muhteşem! Kare!"}),
        fuse(["n","a","r","a"], {"mediaKey":"nara"}),
        fuse(["k","o","r","u"], {"mediaKey":"koru","narration":"koru kelimesini birleştirelim!","celebrate":"Harika! Koru!"}),
        fuse(["k","u","r","u"], {"mediaKey":"kuru","narration":"kuru kelimesini birleştirelim!","celebrate":"Süper! Kuru!"}),
        fuse(["k","i","r","a"], {"mediaKey":"kira"}),
        fuse(["r","o","k","a"], {"mediaKey":"roka"}),
        fuse(["r","u","l","o"], {"mediaKey":"rulo"}),
        fuse(["o","k","u","r"], {"mediaKey":"okur","narration":"okur kelimesini birleştirelim!","celebrate":"Yaşasın! Okur!"}),
        fuse(["o","r","a","l"], {"mediaKey":"oral"}),
        fuse(["t","e","r","a"], {"mediaKey":"tera"}),
        fuse(["k","o","r","o"], {"mediaKey":"koro"}),
        syl("a", "r", "a", "r", "arar"),
        syl("k", "a", "r", "a", "kara", {"narration":"ka + ra → kara!","celebrate":"Muhteşem! Kara!"}),
        syl("n", "e", "r", "e", "nere"),
        syl("t", "e", "r", "i", "teri"),
        syl("k", "u", "r", "a", "kura")
      ]
    )
    ,
    sound(
      {
        id: "ı",
        letter: "ı",
        displayUpper: "I",
        color: "#fb5607",
        glow: "rgba(251,86,7,.45)",
        hint: "2. grup · ı",
        icon: "I",
        introSpeak: "ı sesi geldi. Gülümsemeden ı!",
        phoneme: "ııı"
      },
      "grup2",
      [
        intro("ı"),
        hece("ı", "n"),
        hece("n", "ı"),
        hece("ı", "t"),
        hece("t", "ı"),
        hece("ı", "l"),
        hece("l", "ı"),
        hece("ı", "k"),
        hece("k", "ı"),
        hece("ı", "r"),
        hece("r", "ı"),
        hece("ı", "a"),
        hece("a", "ı"),
        hece("ı", "e"),
        hece("e", "ı"),
        hece("ı", "i"),
        hece("i", "ı"),
        hece("ı", "o"),
        hece("o", "ı"),
        hece("ı", "u"),
        hece("u", "ı"),
        chain("k", "ı", "r", {"mediaKey":"kır","narration":"kı ile r: kır!","celebrate":"Harika! kır!"}),
        chain("t", "ı", "k", {"mediaKey":"tık"}),
        chain("n", "ı", "n", {"mediaKey":"nın"}),
        chain("k", "ı", "l", {"mediaKey":"kıl"}),
        chain("l", "ı", "k", {"mediaKey":"lık"}),
        chain("k", "ı", "n", {"mediaKey":"kın"}),
        chain("r", "ı", "t", {"mediaKey":"rıt"}),
        fuse(["a","k","ı","l"], {"mediaKey":"akıl","narration":"akıl kelimesini birleştirelim!","celebrate":"Muhteşem! Akıl!"}),
        fuse(["a","l","ı","n"], {"mediaKey":"alın"}),
        fuse(["k","a","l","ı","n"], {"mediaKey":"kalın","narration":"kalın kelimesini birleştirelim!","celebrate":"Harika! Kalın!"}),
        fuse(["k","a","r","ı","n"], {"mediaKey":"karın"}),
        fuse(["ı","r","a","k"], {"mediaKey":"ırak"}),
        fuse(["k","ı","r","ı","k"], {"mediaKey":"kırık","narration":"kırık kelimesini birleştirelim!","celebrate":"Süper! Kırık!"}),
        syl([["ı","l"],["ı","k"]], "ılık", {"narration":"ı + lık → ılık!","celebrate":"Yaşasın! Ilık!"}),
        fuse(["k","a","r","ı"], {"mediaKey":"karı"}),
        fuse(["t","a","r","ı"], {"mediaKey":"tarı"}),
        fuse(["n","a","r","ı"], {"mediaKey":"narı"}),
        syl("k", "ı", "r", "ı", "kırı"),
        syl("t", "ı", "k", "ı", "tıkı"),
        syl("a", "r", "ı", "k", "arık"),
        syl("k", "ı", "l", "ı", "kılı")
      ]
    )
    ,
    sound(
      {
        id: "m",
        letter: "m",
        color: "#8338ec",
        glow: "rgba(131,56,236,.45)",
        hint: "2. grup · m",
        icon: "MM",
        introSpeak: "m sesi geldi. Dudaklar kapalı: m!",
        phoneme: "mmm"
      },
      "grup2",
      [
        intro("m"),
        hece("a", "m"),
        hece("m", "a"),
        hece("e", "m"),
        hece("m", "e"),
        hece("i", "m"),
        hece("m", "i"),
        hece("o", "m"),
        hece("m", "o"),
        hece("u", "m"),
        hece("m", "u"),
        hece("ı", "m"),
        hece("m", "ı"),
        chain("m", "a", "m", {"mediaKey":"mam"}),
        chain("k", "a", "m", {"mediaKey":"kam"}),
        chain("k", "u", "m", {"mediaKey":"kum","narration":"ku ile m: kum!","celebrate":"Harika! Kum kelimesi!"}),
        chain("m", "a", "l", {"mediaKey":"mal","narration":"ma ile l: mal!","celebrate":"Süper! mal!"}),
        chain("m", "i", "l", {"mediaKey":"mil"}),
        chain("t", "i", "m", {"mediaKey":"tim"}),
        chain("r", "u", "m", {"mediaKey":"rum"}),
        chain("k", "e", "m", {"mediaKey":"kem"}),
        chain("k", "i", "m", {"mediaKey":"kim","narration":"ki ile m: kim!","celebrate":"Yaşasın! Kim!"}),
        chain("k", "o", "m", {"mediaKey":"kom"}),
        chain("m", "u", "m", {"mediaKey":"mum","narration":"mu ile m: mum!","celebrate":"Harika! Mum kelimesi!"}),
        chain("m", "i", "n", {"mediaKey":"min"}),
        fuse(["m","a","m","a"], {"mediaKey":"mama","narration":"mama kelimesini birleştirelim!","celebrate":"Muhteşem! Mama!"}),
        fuse(["e","l","m","a"], {"mediaKey":"elma","narration":"elma kelimesini birleştirelim!","celebrate":"Yaşasın! Elma!"}),
        fuse(["a","l","m","a"], {"mediaKey":"alma"}),
        fuse(["e","m","e","k"], {"mediaKey":"emek"}),
        fuse(["k","a","l","e","m"], {"mediaKey":"kalem","narration":"kalem kelimesini birleştirelim!","celebrate":"Süper! Kalem!"}),
        fuse(["u","m","u","t"], {"mediaKey":"umut"}),
        fuse(["m","u","r","a","t"], {"mediaKey":"murat"}),
        fuse(["o","r","m","a","n"], {"mediaKey":"orman","narration":"orman kelimesini birleştirelim!","celebrate":"Harika! Orman!"}),
        fuse(["l","i","m","a","n"], {"mediaKey":"liman","narration":"liman: li + man!","celebrate":"Yaşasın! Liman!"}),
        fuse(["m","i","n","i"], {"mediaKey":"mini"}),
        fuse(["t","a","m","a","m"], {"mediaKey":"tamam"}),
        fuse(["m","a","r","a"], {"mediaKey":"mara"}),
        fuse(["k","a","m","u"], {"mediaKey":"kamu"}),
        fuse(["r","a","m","a"], {"mediaKey":"rama"}),
        syl("k", "e", "m", "e", "keme"),
        syl("m", "i", "n", "e", "mine"),
        syl("t", "e", "m", "e", "teme"),
        syl("m", "u", "m", "u", "mumu"),
        syl("a", "m", "a", "n", "aman", {"narration":"a + man? am+an → aman!","celebrate":"Bravo! Aman!"})
      ]
    )
  ];

  /* GROUP 3 — ü s ö y d z */
  var GROUP3_SOUNDS = [
    sound(
      {
        id: "ü",
        letter: "ü",
        color: "#ffbe0b",
        glow: "rgba(255,190,11,.45)",
        hint: "3. grup · ü",
        icon: "ÜÜ",
        introSpeak: "ü sesi geldi. Gülümseyip büz: ü!",
        phoneme: "üüü"
      },
      "grup3",
      [
        intro("ü"),
        hece("ü", "n"),
        hece("n", "ü"),
        hece("ü", "t"),
        hece("t", "ü"),
        hece("ü", "l"),
        hece("l", "ü"),
        hece("ü", "k"),
        hece("k", "ü"),
        hece("ü", "r"),
        hece("r", "ü"),
        hece("ü", "m"),
        hece("m", "ü"),
        hece("ü", "a"),
        hece("a", "ü"),
        hece("ü", "e"),
        hece("e", "ü"),
        hece("ü", "i"),
        hece("i", "ü"),
        hece("ü", "o"),
        hece("o", "ü"),
        hece("ü", "u"),
        hece("u", "ü"),
        hece("ü", "ı"),
        hece("ı", "ü"),
        chain("k", "ü", "l", {"mediaKey":"kül","narration":"kü ile l: kül!","celebrate":"Harika! Kül!"}),
        chain("t", "ü", "r", {"mediaKey":"tür"}),
        chain("k", "ü", "r", {"mediaKey":"kür"}),
        chain("ü", "t", "ü", {"mediaKey":"ütü","narration":"üt ile ü: ütü!","celebrate":"Yaşasın! Ütü!"}),
        chain("m", "ü", "r", {"mediaKey":"mür"}),
        chain("n", "ü", "n", {"mediaKey":"nün"}),
        chain("l", "ü", "t", {"mediaKey":"lüt"}),
        fuse(["ü","r","ü","n"], {"mediaKey":"ürün"}),
        fuse(["t","ü","r","ü"], {"mediaKey":"türü"}),
        fuse(["k","ü","r","ü"], {"mediaKey":"kürü"}),
        fuse(["ü","l","k","ü"], {"mediaKey":"ülkü"}),
        fuse(["m","ü","m","ü"], {"mediaKey":"mümü"}),
        syl("k", "ü", "l", "ü", "külü"),
        syl("t", "ü", "t", "ü", "tütü"),
        syl("ü", "n", "i", "t", "ünit"),
        syl("m", "ü", "r", "ü", "mürü")
      ]
    )
    ,
    sound(
      {
        id: "s",
        letter: "s",
        color: "#00bbf9",
        glow: "rgba(0,187,249,.45)",
        hint: "3. grup · s",
        icon: "SS",
        introSpeak: "s sesi geldi. Yılan gibi: sss!",
        phoneme: "sss"
      },
      "grup3",
      [
        intro("s"),
        hece("a", "s"),
        hece("s", "a"),
        hece("e", "s"),
        hece("s", "e"),
        hece("i", "s"),
        hece("s", "i"),
        hece("o", "s"),
        hece("s", "o"),
        hece("u", "s"),
        hece("s", "u", {"mediaKey":"su","kind":"kelime"}),
        hece("ı", "s"),
        hece("s", "ı"),
        hece("ü", "s"),
        hece("s", "ü"),
        chain("s", "ü", "t", {"mediaKey":"süt","narration":"sü ile t: süt!","celebrate":"Yaşasın! Süt kelimesi!"}),
        chain("s", "e", "s", {"mediaKey":"ses","narration":"se ile s: ses!","celebrate":"Harika! Ses kelimesi!"}),
        chain("a", "s", "a", {"mediaKey":"asa"}),
        chain("s", "a", "t", {"mediaKey":"sat"}),
        chain("s", "a", "l", {"mediaKey":"sal"}),
        chain("s", "i", "t", {"mediaKey":"sit"}),
        chain("s", "o", "n", {"mediaKey":"son","narration":"so ile n: son!","celebrate":"Süper! Son kelimesi!"}),
        chain("k", "a", "s", {"mediaKey":"kas"}),
        chain("k", "i", "s", {"mediaKey":"kis"}),
        chain("m", "i", "s", {"mediaKey":"mis"}),
        chain("s", "u", "s", {"mediaKey":"sus"}),
        chain("t", "a", "s", {"mediaKey":"tas","narration":"ta ile s: tas!","celebrate":"Bravo! Tas kelimesi!"}),
        chain("n", "e", "s", {"mediaKey":"nes"}),
        chain("s", "i", "n", {"mediaKey":"sin"}),
        fuse(["i","s","i","m"], {"mediaKey":"isim"}),
        fuse(["s","i","n","i"], {"mediaKey":"sini"}),
        fuse(["s","e","l","i"], {"mediaKey":"seli"}),
        fuse(["s","u","l","u"], {"mediaKey":"sulu"}),
        fuse(["k","ı","s","ı"], {"mediaKey":"kısı"}),
        fuse(["s","ı","r","a"], {"mediaKey":"sıra"}),
        fuse(["s","o","k","a","k"], {"mediaKey":"sokak","narration":"sokak kelimesini birleştirelim!","celebrate":"Muhteşem! Sokak!"}),
        fuse(["m","a","s","a"], {"mediaKey":"masa","narration":"masa kelimesini birleştirelim!","celebrate":"Yaşasın! Masa!"}),
        fuse(["s","a","a","t"], {"mediaKey":"saat","narration":"saat kelimesini birleştirelim!","celebrate":"Harika! Saat!"})
      ]
    )
    ,
    sound(
      {
        id: "ö",
        letter: "ö",
        color: "#f15bb5",
        glow: "rgba(241,91,181,.45)",
        hint: "3. grup · ö",
        icon: "ÖÖ",
        introSpeak: "ö sesi geldi. Yuvarlak ve gülümseyen ö!",
        phoneme: "ööö"
      },
      "grup3",
      [
        intro("ö"),
        hece("ö", "n"),
        hece("n", "ö"),
        hece("ö", "t"),
        hece("t", "ö"),
        hece("ö", "l"),
        hece("l", "ö"),
        hece("ö", "k"),
        hece("k", "ö"),
        hece("ö", "r"),
        hece("r", "ö"),
        hece("ö", "m"),
        hece("m", "ö"),
        hece("ö", "s"),
        hece("s", "ö"),
        chain("ö", "n", "ü", {"mediaKey":"önü"}),
        chain("k", "ö", "r", {"mediaKey":"kör"}),
        chain("k", "ö", "k", {"mediaKey":"kök","narration":"kö ile k: kök!","celebrate":"Harika! Kök!"}),
        chain("s", "ö", "n", {"mediaKey":"sön"}),
        chain("ö", "r", "t", {"mediaKey":"ört"}),
        chain("m", "ö", "n", {"mediaKey":"mön"}),
        fuse(["ö","r","ü","k"], {"mediaKey":"örük"}),
        fuse(["k","ö","r","ü"], {"mediaKey":"körü"}),
        fuse(["s","ö","n","ü"], {"mediaKey":"sönü"}),
        fuse(["ö","n","e","k"], {"mediaKey":"önek"}),
        fuse(["t","ö","r","ü"], {"mediaKey":"törü"}),
        syl("k", "ö", "k", "ü", "kökü"),
        syl("ö", "n", "e", "m", "önem"),
        syl("s", "ö", "m", "e", "söme"),
        syl("ö", "r", "e", "n", "ören")
      ]
    )
    ,
    sound(
      {
        id: "y",
        letter: "y",
        color: "#9b5de5",
        glow: "rgba(155,93,229,.45)",
        hint: "3. grup · y",
        icon: "YY",
        introSpeak: "y sesi geldi. İnce bir y!",
        phoneme: "yı"
      },
      "grup3",
      [
        intro("y"),
        hece("a", "y", {"mediaKey":"ay","kind":"kelime"}),
        hece("y", "a"),
        hece("e", "y"),
        hece("y", "e"),
        hece("i", "y"),
        hece("y", "i"),
        hece("o", "y", {"mediaKey":"oy","kind":"kelime"}),
        hece("y", "o"),
        hece("u", "y"),
        hece("y", "u"),
        hece("ı", "y"),
        hece("y", "ı"),
        hece("ü", "y"),
        hece("y", "ü"),
        hece("ö", "y"),
        hece("y", "ö"),
        chain("y", "a", "n", {"mediaKey":"yan"}),
        chain("y", "a", "t", {"mediaKey":"yat"}),
        chain("y", "o", "l", {"mediaKey":"yol","narration":"yo ile l: yol!","celebrate":"Yaşasın! Yol kelimesi!"}),
        chain("y", "e", "r", {"mediaKey":"yer","narration":"ye ile r: yer!","celebrate":"Harika! Yer kelimesi!"}),
        chain("y", "ü", "n", {"mediaKey":"yün"}),
        chain("a", "y", "ı", {"mediaKey":"ayı"}),
        chain("k", "a", "y", {"mediaKey":"kay"}),
        chain("t", "a", "y", {"mediaKey":"tay"}),
        chain("m", "a", "y", {"mediaKey":"may"}),
        chain("s", "a", "y", {"mediaKey":"say"}),
        chain("y", "ı", "l", {"mediaKey":"yıl","narration":"yı ile l: yıl!","celebrate":"Süper! Yıl!"}),
        fuse(["a","y","a","k"], {"mediaKey":"ayak","narration":"ayak kelimesini birleştirelim!","celebrate":"Muhteşem! Ayak!"}),
        fuse(["y","a","k","a"], {"mediaKey":"yaka"}),
        fuse(["y","a","l","ı"], {"mediaKey":"yalı"}),
        fuse(["k","a","y","a"], {"mediaKey":"kaya"}),
        fuse(["y","u","n","u"], {"mediaKey":"yunu"}),
        fuse(["y","e","m","e","k"], {"mediaKey":"yemek","narration":"yemek kelimesini birleştirelim!","celebrate":"Yaşasın! Yemek!"}),
        fuse(["ö","y","k","ü"], {"mediaKey":"öykü"}),
        fuse(["y","ü","k","ü"], {"mediaKey":"yükü"}),
        fuse(["s","a","y","ı"], {"mediaKey":"sayı"}),
        fuse(["t","a","y","ı","n"], {"mediaKey":"tayın"}),
        syl("y", "a", "y", "a", "yaya"),
        syl("y", "e", "s", "i", "yesi"),
        syl("y", "o", "l", "u", "yolu"),
        syl("a", "y", "n", "a", "ayna", {"narration":"ay + na → ayna!","celebrate":"Harika! Ayna!"}),
        syl("y", "ı", "l", "ı", "yılı")
      ]
    )
    ,
    sound(
      {
        id: "d",
        letter: "d",
        color: "#00f5d4",
        glow: "rgba(0,245,212,.45)",
        hint: "3. grup · d",
        icon: "DD",
        introSpeak: "d sesi geldi. Dilini dişlere: d!",
        phoneme: "dı"
      },
      "grup3",
      [
        intro("d"),
        hece("a", "d", {"mediaKey":"ad","kind":"kelime"}),
        hece("d", "a"),
        hece("e", "d"),
        hece("d", "e"),
        hece("i", "d"),
        hece("d", "i"),
        hece("o", "d", {"mediaKey":"od","kind":"kelime"}),
        hece("d", "o"),
        hece("u", "d"),
        hece("d", "u"),
        hece("ı", "d"),
        hece("d", "ı"),
        hece("ü", "d"),
        hece("d", "ü"),
        hece("ö", "d"),
        hece("d", "ö"),
        chain("d", "a", "n", {"mediaKey":"dan"}),
        chain("d", "e", "n", {"mediaKey":"den"}),
        chain("d", "e", "d", {"mediaKey":"ded"}),
        chain("d", "i", "l", {"mediaKey":"dil","narration":"di ile l: dil!","celebrate":"Harika! Dil kelimesi!"}),
        chain("d", "u", "r", {"mediaKey":"dur"}),
        chain("d", "o", "k", {"mediaKey":"dok"}),
        chain("d", "a", "l", {"mediaKey":"dal","narration":"da ile l: dal!","celebrate":"Süper! Dal kelimesi!"}),
        chain("a", "d", "a", {"mediaKey":"ada","narration":"ad ile a: ada!","celebrate":"Yaşasın! Ada!"}),
        chain("d", "e", "r", {"mediaKey":"der"}),
        chain("y", "a", "d", {"mediaKey":"yad"}),
        fuse(["d","e","d","e"], {"mediaKey":"dede","narration":"dede kelimesini birleştirelim!","celebrate":"Muhteşem! Dede!"}),
        fuse(["d","a","y","ı"], {"mediaKey":"dayı","narration":"dayı kelimesini birleştirelim!","celebrate":"Yaşasın! Dayı!"}),
        fuse(["d","o","r","u","k"], {"mediaKey":"doruk"}),
        fuse(["d","u","r","u"], {"mediaKey":"duru"}),
        fuse(["d","e","r","e"], {"mediaKey":"dere"}),
        fuse(["d","i","l","e","k"], {"mediaKey":"dilek"}),
        fuse(["k","a","d","ı","n"], {"mediaKey":"kadın"}),
        fuse(["d","a","m","a"], {"mediaKey":"dama"}),
        fuse(["d","ü","n","ü"], {"mediaKey":"dünü"}),
        fuse(["ö","d","ü","l"], {"mediaKey":"ödül"}),
        fuse(["d","ü","r","ü"], {"mediaKey":"dürü"}),
        syl("d", "a", "l", "a", "dala"),
        syl("d", "i", "l", "i", "dili"),
        syl("a", "d", "e", "t", "adet"),
        syl("d", "o", "l", "u", "dolu", {"narration":"do + lu → dolu!","celebrate":"Harika! Dolu!"}),
        syl("y", "e", "d", "i", "yedi", {"narration":"ye + di → yedi!","celebrate":"Süper! Yedi!"})
      ]
    )
    ,
    sound(
      {
        id: "z",
        letter: "z",
        color: "#fee440",
        glow: "rgba(254,228,64,.45)",
        hint: "3. grup · z",
        icon: "ZZ",
        introSpeak: "z sesi geldi. Arı gibi: zzz!",
        phoneme: "zzz"
      },
      "grup3",
      [
        intro("z"),
        hece("a", "z", {"mediaKey":"az","kind":"kelime"}),
        hece("z", "a"),
        hece("e", "z"),
        hece("z", "e"),
        hece("i", "z"),
        hece("z", "i"),
        hece("o", "z"),
        hece("z", "o"),
        hece("u", "z"),
        hece("z", "u"),
        hece("ı", "z"),
        hece("z", "ı"),
        hece("ü", "z"),
        hece("z", "ü"),
        hece("ö", "z", {"mediaKey":"öz","kind":"kelime"}),
        hece("z", "ö"),
        chain("s", "ö", "z", {"mediaKey":"söz","narration":"sö ile z: söz!","celebrate":"Yaşasın! Söz kelimesi!"}),
        chain("y", "ü", "z", {"mediaKey":"yüz","narration":"yü ile z: yüz!","celebrate":"Harika! Yüz kelimesi!"}),
        chain("k", "ı", "z", {"mediaKey":"kız","narration":"kı ile z: kız!","celebrate":"Süper! Kız!"}),
        chain("t", "e", "z", {"mediaKey":"tez"}),
        chain("z", "e", "r", {"mediaKey":"zer"}),
        chain("z", "a", "m", {"mediaKey":"zam"}),
        chain("u", "z", "a", {"mediaKey":"uza"}),
        chain("ö", "z", "ü", {"mediaKey":"özü"}),
        fuse(["d","e","n","i","z"], {"mediaKey":"deniz","narration":"deniz kelimesini birleştirelim!","celebrate":"Muhteşem! Deniz!"}),
        fuse(["ü","z","ü","m"], {"mediaKey":"üzüm","narration":"üzüm kelimesini birleştirelim!","celebrate":"Yaşasın! Üzüm!"}),
        fuse(["k","e","z","e"], {"mediaKey":"keze"}),
        fuse(["z","e","m","i","n"], {"mediaKey":"zemin"}),
        fuse(["y","a","z","ı"], {"mediaKey":"yazı"}),
        fuse(["k","a","z","a"], {"mediaKey":"kaza"}),
        fuse(["t","e","m","i","z"], {"mediaKey":"temiz"}),
        fuse(["u","z","u","n"], {"mediaKey":"uzun","narration":"uzun kelimesini birleştirelim!","celebrate":"Harika! Uzun!"}),
        syl("z", "e", "r", "e", "zere"),
        syl("a", "z", "ı", "k", "azık"),
        syl("ö", "z", "ü", "m", "özüm"),
        syl("k", "ı", "z", "ı", "kızı")
      ]
    )
  ];

  /* GROUP 4 — ç b g c ş */
  var GROUP4_SOUNDS = [
    sound(
      {
        id: "ç",
        letter: "ç",
        color: "#f72585",
        glow: "rgba(247,37,133,.45)",
        hint: "4. grup · ç",
        icon: "ÇÇ",
        introSpeak: "ç sesi geldi. Şişirip bırak: ç!",
        phoneme: "çı"
      },
      "grup4",
      [
        intro("ç"),
        hece("ç", "a"),
        hece("a", "ç", {"mediaKey":"aç","kind":"kelime"}),
        hece("ç", "e"),
        hece("e", "ç"),
        hece("ç", "i"),
        hece("i", "ç"),
        hece("ç", "o"),
        hece("o", "ç"),
        hece("ç", "u"),
        hece("u", "ç", {"mediaKey":"uç","kind":"kelime"}),
        hece("ç", "ı"),
        hece("ı", "ç"),
        hece("ç", "ü"),
        hece("ü", "ç", {"mediaKey":"üç","kind":"kelime"}),
        hece("ç", "ö"),
        hece("ö", "ç"),
        chain("ç", "a", "y", {"mediaKey":"çay","narration":"ça ile y: çay!","celebrate":"Yaşasın! Çay kelimesi!"}),
        chain("ç", "i", "l", {"mediaKey":"çil"}),
        chain("ç", "i", "k", {"mediaKey":"çık"}),
        chain("ç", "ı", "k", {"mediaKey":"çık"}),
        chain("a", "ç", "ı", {"mediaKey":"açı"}),
        chain("ü", "ç", "ü", {"mediaKey":"üçü"}),
        chain("ç", "o", "k", {"mediaKey":"çok","narration":"ço ile k: çok!","celebrate":"Harika! Çok!"}),
        chain("ç", "e", "k", {"mediaKey":"çek"}),
        chain("ç", "ö", "z", {"mediaKey":"çöz"}),
        chain("s", "e", "ç", {"mediaKey":"seç"}),
        chain("i", "ç", "e", {"mediaKey":"içe"}),
        fuse(["ç","i","ç","e","k"], {"mediaKey":"çiçek","narration":"çiçek kelimesini birleştirelim!","celebrate":"Muhteşem! Çiçek!"}),
        fuse(["ç","a","k","ı"], {"mediaKey":"çakı"}),
        fuse(["ç","o","k","u"], {"mediaKey":"çoku"}),
        fuse(["ç","e","k","i","ç"], {"mediaKey":"çekiç"}),
        fuse(["ç","i","n","e"], {"mediaKey":"çine"}),
        fuse(["i","ç","i","n"], {"mediaKey":"için"}),
        fuse(["ç","a","k","a","l"], {"mediaKey":"çakal"}),
        syl("ç", "a", "y", "ı", "çayı"),
        syl("ç", "e", "k", "e", "çeke"),
        syl("a", "ç", "e", "l", "açel"),
        syl("ç", "o", "z", "u", "çozu"),
        syl("ç", "i", "l", "i", "çili"),
        fuse(["ç", "i", "l", "e", "k"], {"mediaKey": "çilek", "narration": "çilek kelimesini birleştirelim!", "celebrate": "Harika! Çilek!"}),
        fuse(["u", "ç", "ur", "t", "m", "a"], {"mediaKey": "uçurtma", "narration": "uçurtma kelimesini birleştirelim!", "celebrate": "Süper! Uçurtma!"}),
        fuse(["ç", "a", "d", "ı", "r"], {"mediaKey": "çadır"}),
        fuse(["ç", "a", "t", "ı"], {"mediaKey": "çatı"}),
        fuse(["ç", "i", "m", "e", "n"], {"mediaKey": "çimen"}),
        fuse(["d", "e", "m", "l", "i"], {"mediaKey": "demli"}),
        syl("ç", "i", "l", "e", "çile"),
        syl("u", "ç", "ur", "t", "uçur")
      ]
    )
    ,
    sound(
      {
        id: "b",
        letter: "b",
        color: "#4361ee",
        glow: "rgba(67,97,238,.45)",
        hint: "4. grup · b",
        icon: "BB",
        introSpeak: "b sesi geldi. Dudaklarını patlat: b!",
        phoneme: "bı"
      },
      "grup4",
      [
        intro("b"),
        hece("b", "a"),
        hece("a", "b"),
        hece("b", "e"),
        hece("e", "b"),
        hece("b", "i"),
        hece("i", "b"),
        hece("b", "o"),
        hece("o", "b"),
        hece("b", "u"),
        hece("u", "b"),
        hece("b", "ı"),
        hece("ı", "b"),
        hece("b", "ü"),
        hece("ü", "b"),
        hece("b", "ö"),
        hece("ö", "b"),
        chain("b", "a", "b", {"mediaKey":"bab"}),
        chain("b", "a", "l", {"mediaKey":"bal","narration":"ba ile l: bal!","celebrate":"Yaşasın! Bal kelimesi!"}),
        chain("b", "e", "n", {"mediaKey":"ben","narration":"be ile n: ben!","celebrate":"Harika! Ben!"}),
        chain("b", "i", "r", {"mediaKey":"bir","narration":"bi ile r: bir!","celebrate":"Süper! Bir!"}),
        chain("b", "u", "z", {"mediaKey":"buz","narration":"bu ile z: buz!","celebrate":"Bravo! Buz!"}),
        chain("b", "o", "y", {"mediaKey":"boy"}),
        chain("b", "e", "z", {"mediaKey":"bez"}),
        chain("a", "b", "i", {"mediaKey":"abi"}),
        chain("b", "ü", "y", {"mediaKey":"büy"}),
        fuse(["b","a","b","a"], {"mediaKey":"baba","narration":"baba kelimesini birleştirelim!","celebrate":"Muhteşem! Baba!"}),
        fuse(["b","e","b","e","k"], {"mediaKey":"bebek","narration":"bebek kelimesini birleştirelim!","celebrate":"Yaşasın! Bebek!"}),
        fuse(["b","a","l","ı","k"], {"mediaKey":"balık","narration":"balık kelimesini birleştirelim!","celebrate":"Harika! Balık!"}),
        fuse(["b","u","r","u","n"], {"mediaKey":"burun"}),
        fuse(["b","i","n","a"], {"mediaKey":"bina"}),
        fuse(["b","o","y","a"], {"mediaKey":"boya"}),
        fuse(["b","e","r","e"], {"mediaKey":"bere"}),
        fuse(["b","a","k","a","l"], {"mediaKey":"bakal"}),
        fuse(["ö","b","ü","r"], {"mediaKey":"öbür"}),
        fuse(["b","ü","y","ü","k"], {"mediaKey":"büyük"}),
        syl("b", "e", "n", "i", "beni"),
        syl("b", "i", "r", "i", "biri"),
        syl("b", "a", "l", "ı", "balı"),
        syl("k", "ü", "b", "e", "kübe"),
        fuse(["b", "a", "l", "o", "n"], {"mediaKey": "balon", "narration": "balon kelimesini birleştirelim!", "celebrate": "Harika! Balon!"}),
        fuse(["b", "ö", "r", "e", "k"], {"mediaKey": "börek", "narration": "börek kelimesini birleştirelim!", "celebrate": "Süper! Börek!"}),
        fuse(["b", "a", "r", "d", "a", "k"], {"mediaKey": "bardak"}),
        fuse(["b", "i", "s", "i", "k", "l", "e", "t"], {"mediaKey": "bisiklet"}),
        fuse(["b", "a", "k", "k", "a", "l"], {"mediaKey": "bakkal"}),
        fuse(["b", "i", "l", "y", "e"], {"mediaKey": "bilye"}),
        fuse(["b", "o", "t", "a"], {"mediaKey": "bota"}),
        syl("b", "a", "k", "k", "bakka"),
        syl("b", "ö", "r", "e", "böre")
      ]
    )
    ,
    sound(
      {
        id: "g",
        letter: "g",
        color: "#4cc9f0",
        glow: "rgba(76,201,240,.45)",
        hint: "4. grup · g",
        icon: "GG",
        introSpeak: "g sesi geldi. Boğazdan g!",
        phoneme: "gı"
      },
      "grup4",
      [
        intro("g"),
        hece("g", "a"),
        hece("a", "g"),
        hece("g", "e"),
        hece("e", "g"),
        hece("g", "i"),
        hece("i", "g"),
        hece("g", "o"),
        hece("o", "g"),
        hece("g", "u"),
        hece("u", "g"),
        hece("g", "ı"),
        hece("ı", "g"),
        hece("g", "ü"),
        hece("ü", "g"),
        hece("g", "ö"),
        hece("ö", "g"),
        chain("g", "e", "l", {"mediaKey":"gel"}),
        chain("g", "ü", "l", {"mediaKey":"gül","narration":"gü ile l: gül!","celebrate":"Yaşasın! Gül kelimesi!"}),
        chain("g", "ö", "z", {"mediaKey":"göz","narration":"gö ile z: göz!","celebrate":"Harika! Göz kelimesi!"}),
        chain("g", "ö", "l", {"mediaKey":"göl"}),
        chain("g", "ü", "n", {"mediaKey":"gün","narration":"gü ile n: gün!","celebrate":"Süper! Gün!"}),
        chain("g", "a", "z", {"mediaKey":"gaz"}),
        chain("g", "e", "z", {"mediaKey":"gez"}),
        chain("g", "i", "t", {"mediaKey":"git"}),
        chain("a", "g", "a", {"mediaKey":"aga"}),
        fuse(["g","ü","z","e","l"], {"mediaKey":"güzel","narration":"güzel kelimesini birleştirelim!","celebrate":"Muhteşem! Güzel!"}),
        fuse(["g","e","l","i","n"], {"mediaKey":"gelin"}),
        fuse(["g","ö","m","ü","k"], {"mediaKey":"gömük"}),
        fuse(["g","ö","r","ü"], {"mediaKey":"görü"}),
        fuse(["g","e","n","ç"], {"mediaKey":"genç"}),
        fuse(["g","ö","k","e"], {"mediaKey":"göke"}),
        syl("g", "e", "l", "e", "gele"),
        syl("g", "ü", "l", "ü", "gülü"),
        syl("g", "ö", "z", "ü", "gözü"),
        syl("g", "ü", "n", "ü", "günü"),
        fuse(["g", "ö", "z", "l", "ü", "k"], {"mediaKey": "gözlük", "narration": "gözlük kelimesini birleştirelim!", "celebrate": "Harika! Gözlük!"}),
        fuse(["g", "i", "t", "a", "r"], {"mediaKey": "gitar", "narration": "gitar kelimesini birleştirelim!", "celebrate": "Süper! Gitar!"}),
        fuse(["g", "e", "m", "i"], {"mediaKey": "gemi"}),
        fuse(["g", "a", "z", "e", "t", "e"], {"mediaKey": "gazete"}),
        fuse(["s", "i", "l", "g", "i"], {"mediaKey": "silgi"}),
        fuse(["k", "a", "y", "ı", "k"], {"mediaKey": "kayık"}),
        syl("g", "a", "z", "e", "gaze"),
        syl("g", "i", "t", "a", "gita")
      ]
    )
    ,
    sound(
      {
        id: "c",
        letter: "c",
        color: "#7209b7",
        glow: "rgba(114,9,183,.45)",
        hint: "4. grup · c",
        icon: "CC",
        introSpeak: "c sesi geldi. Yumuşak c!",
        phoneme: "cı"
      },
      "grup4",
      [
        intro("c"),
        hece("c", "a"),
        hece("a", "c"),
        hece("c", "e"),
        hece("e", "c"),
        hece("c", "i"),
        hece("i", "c"),
        hece("c", "o"),
        hece("o", "c"),
        hece("c", "u"),
        hece("u", "c"),
        hece("c", "ı"),
        hece("ı", "c"),
        hece("c", "ü"),
        hece("ü", "c"),
        hece("c", "ö"),
        hece("ö", "c"),
        chain("c", "a", "n", {"mediaKey":"can","narration":"ca ile n: can!","celebrate":"Yaşasın! Can!"}),
        chain("c", "e", "n", {"mediaKey":"cen"}),
        chain("c", "i", "t", {"mediaKey":"cit"}),
        chain("a", "c", "ı", {"mediaKey":"acı"}),
        chain("g", "e", "c", {"mediaKey":"gec"}),
        chain("n", "e", "c", {"mediaKey":"nec"}),
        fuse(["g","e","c","e"], {"mediaKey":"gece","narration":"gece kelimesini birleştirelim!","celebrate":"Muhteşem! Gece!"}),
        fuse(["c","a","m","ı"], {"mediaKey":"camı"}),
        fuse(["ç","o","c","u","k"], {"mediaKey":"çocuk","narration":"çocuk kelimesini birleştirelim!","celebrate":"Yaşasın! Çocuk!"}),
        fuse(["c","i","d","d","i"], {"mediaKey":"ciddi"}),
        fuse(["i","n","c","i"], {"mediaKey":"inci"}),
        fuse(["c","e","m","i","l"], {"mediaKey":"cemil"}),
        fuse(["b","a","c","a","k"], {"mediaKey":"bacak"}),
        syl("c", "a", "n", "a", "cana"),
        syl("c", "e", "m", "i", "cemi"),
        syl("a", "c", "ı", "k", "acık"),
        syl("c", "i", "l", "t", "cilt"),
        chain("c", "a", "m", {"mediaKey":"cam","narration":"ca ile m: cam!","celebrate":"Harika! Cam kelimesi!"}),
        fuse(["i","n","c","i","r"], {"mediaKey":"incir","narration":"incir kelimesini birleştirelim!","celebrate":"Harika! İncir!"}),
        fuse(["c","e","k","e","t"], {"mediaKey":"ceket","narration":"ceket kelimesini birleştirelim!","celebrate":"Süper! Ceket!"}),
        fuse(["c","ü","c","e"], {"mediaKey":"cüce"}),
        fuse(["o","c","a","k"], {"mediaKey":"ocak"}),
        fuse(["t","e","n","c","e","r","e"], {"mediaKey":"tencere"}),
        syl("c", "e", "k", "e", "ceke"),
        syl("i", "n", "c", "i", "inci")
      ]
    )
    ,
    sound(
      {
        id: "ş",
        letter: "ş",
        color: "#f77f00",
        glow: "rgba(247,127,0,.45)",
        hint: "4. grup · ş",
        icon: "ŞŞ",
        introSpeak: "ş sesi geldi. Sus gibi: şşş!",
        phoneme: "şşş"
      },
      "grup4",
      [
        intro("ş"),
        hece("ş", "a"),
        hece("a", "ş", {"mediaKey":"aş","kind":"kelime"}),
        hece("ş", "e"),
        hece("e", "ş", {"mediaKey":"eş","kind":"kelime"}),
        hece("ş", "i"),
        hece("i", "ş", {"mediaKey":"iş","kind":"kelime"}),
        hece("ş", "o"),
        hece("o", "ş"),
        hece("ş", "u"),
        hece("u", "ş"),
        hece("ş", "ı"),
        hece("ı", "ş"),
        hece("ş", "ü"),
        hece("ü", "ş"),
        hece("ş", "ö"),
        hece("ö", "ş"),
        chain("ş", "e", "y", {"mediaKey":"şey"}),
        chain("a", "ş", "ı", {"mediaKey":"aşı"}),
        chain("i", "ş", "e", {"mediaKey":"işe"}),
        chain("k", "ı", "ş", {"mediaKey":"kış","narration":"kı ile ş: kış!","celebrate":"Yaşasın! Kış!"}),
        chain("d", "i", "ş"),
        chain("d", "i", "ş", {"mediaKey":"diş","narration":"di ile ş: diş!","celebrate":"Harika! Diş!"}),
        chain("k", "u", "ş", {"mediaKey":"kuş","narration":"ku ile ş: kuş!","celebrate":"Süper! Kuş!"}),
        chain("ş", "a", "l", {"mediaKey":"şal"}),
        chain("b", "a", "ş", {"mediaKey":"baş","narration":"ba ile ş: baş!","celebrate":"Bravo! Baş!"}),
        chain("y", "a", "ş", {"mediaKey":"yaş"}),
        chain("ş", "ö", "n", {"mediaKey":"şön"}),
        fuse(["ş","e","k","e","r"], {"mediaKey":"şeker","narration":"şeker kelimesini birleştirelim!","celebrate":"Muhteşem! Şeker!"}),
        fuse(["ş","i","ş","e"], {"mediaKey":"şişe"}),
        fuse(["k","a","ş","ı","k"], {"mediaKey":"kaşık"}),
        fuse(["g","ü","m","ü","ş"], {"mediaKey":"gümüş"}),
        fuse(["ş","a","r","k","ı"], {"mediaKey":"şarkı"}),
        fuse(["d","ö","ş","e","k"], {"mediaKey":"döşek"}),
        fuse(["b","a","ş","ı"], {"mediaKey":"başı"}),
        syl("ş", "e", "k", "e", "şeke"),
        syl("k", "u", "ş", "u", "kuşu"),
        syl("y", "a", "ş", "a", "yaşa"),
        syl("i", "ş", "e", "k", "işek"),
        syl("b", "e", "ş", "e", "beşe"),
        chain("b", "e", "ş", {"mediaKey":"beş","narration":"be ile ş: beş!","celebrate":"Harika! Beş!"}),
        fuse(["ş","i","i","r"], {"mediaKey":"şiir","narration":"şiir kelimesini birleştirelim!","celebrate":"Harika! Şiir!"}),
        fuse(["ş","e","r","b","e","t"], {"mediaKey":"şerbet"}),
        fuse(["b","e","ş","i","k"], {"mediaKey":"beşik"}),
        syl("ş", "i", "i", "r", "şiir"),
        syl("ş", "e", "r", "b", "şerb"),
        chain("ş", "i", "ş", {"mediaKey":"şiş"})
      ]
    )
  ];

  /* GROUP 5 — p h v ğ f j */
  var GROUP5_SOUNDS = [
    sound(
      {
        id: "p",
        letter: "p",
        color: "#ef476f",
        glow: "rgba(239,71,111,.45)",
        hint: "5. grup · p",
        icon: "PP",
        introSpeak: "p sesi geldi. Patlat: p!",
        phoneme: "pı"
      },
      "grup5",
      [
        intro("p"),
        hece("p", "a"),
        hece("a", "p"),
        hece("p", "e"),
        hece("e", "p"),
        hece("p", "i"),
        hece("i", "p", {"mediaKey":"ip","kind":"kelime"}),
        hece("p", "o"),
        hece("o", "p", {"mediaKey":"op","kind":"kelime"}),
        hece("p", "u"),
        hece("u", "p"),
        hece("p", "ı"),
        hece("ı", "p"),
        hece("p", "ü"),
        hece("ü", "p"),
        hece("p", "ö"),
        hece("ö", "p", {"mediaKey":"öp","kind":"kelime"}),
        chain("t", "o", "p", {"mediaKey":"top","narration":"to ile p: top!","celebrate":"Yaşasın! Top kelimesi!"}),
        chain("p", "a", "n", {"mediaKey":"pan"}),
        chain("p", "a", "r", {"mediaKey":"par"}),
        chain("i", "p", "e", {"mediaKey":"ipe"}),
        chain("k", "a", "p", {"mediaKey":"kap"}),
        chain("s", "a", "p", {"mediaKey":"sap"}),
        chain("p", "i", "n", {"mediaKey":"pin"}),
        chain("p", "ü", "r", {"mediaKey":"pür"}),
        fuse(["p","a","r","a"], {"mediaKey":"para","narration":"para kelimesini birleştirelim!","celebrate":"Muhteşem! Para!"}),
        fuse(["k","a","p","ı"], {"mediaKey":"kapı","narration":"kapı kelimesini birleştirelim!","celebrate":"Yaşasın! Kapı!"}),
        fuse(["p","i","l","i"], {"mediaKey":"pili"}),
        fuse(["s","e","p","e","t"], {"mediaKey":"sepet"}),
        fuse(["t","e","p","e"], {"mediaKey":"tepe"}),
        fuse(["p","a","m","u","k"], {"mediaKey":"pamuk"}),
        fuse(["ö","p","ü","c","ü","k"], {"mediaKey":"öpücük"}),
        fuse(["k","ö","p","ü","k"], {"mediaKey":"köpük"}),
        syl("t", "o", "p", "u", "topu"),
        syl("k", "a", "p", "a", "kapa"),
        syl("p", "e", "k", "i", "peki"),
        fuse(["p","e","y","n","i","r"], {"mediaKey":"peynir","narration":"peynir kelimesini birleştirelim!","celebrate":"Harika! Peynir!"}),
        fuse(["p","a","l","t","o"], {"mediaKey":"palto","narration":"palto kelimesini birleştirelim!","celebrate":"Yaşasın! Palto!"}),
        fuse(["p","u","s","u","l","a"], {"mediaKey":"pusula","narration":"pusula kelimesini birleştirelim!","celebrate":"Süper! Pusula!"}),
        fuse(["p","a","r","k"], {"mediaKey":"park"}),
        fuse(["p","a","k","e","t"], {"mediaKey":"paket"}),
        fuse(["p","a","t","a","t","e","s"], {"mediaKey":"patates"}),
        fuse(["p","ı","r","a","s","a"], {"mediaKey":"pırasa"}),
        fuse(["p","o","ş","e","t"], {"mediaKey":"poşet"}),
        chain("p", "a", "t", {"mediaKey":"pat"}),
        syl("p", "e", "y", "n", "peyn"),
        syl("i", "p", "e", "k", "ipek", {"narration":"i + pek? ip+ek → ipek!","celebrate":"Harika! İpek!"})
      ]
    )
    ,
    sound(
      {
        id: "h",
        letter: "h",
        color: "#06d6a0",
        glow: "rgba(6,214,160,.45)",
        hint: "5. grup · h",
        icon: "HH",
        introSpeak: "h sesi geldi. Üfle: h!",
        phoneme: "hı"
      },
      "grup5",
      [
        intro("h"),
        hece("h", "a"),
        hece("a", "h", {"mediaKey":"ah","kind":"kelime"}),
        hece("h", "e"),
        hece("e", "h"),
        hece("h", "i"),
        hece("i", "h"),
        hece("h", "o"),
        hece("o", "h"),
        hece("h", "u"),
        hece("u", "h"),
        hece("h", "ı"),
        hece("ı", "h"),
        hece("h", "ü"),
        hece("ü", "h"),
        hece("h", "ö"),
        hece("ö", "h"),
        chain("h", "a", "p", {"mediaKey":"hap","narration":"ha ile p: hap!","celebrate":"Yaşasın! Hap!"}),
        chain("h", "a", "r", {"mediaKey":"har"}),
        chain("h", "a", "l", {"mediaKey":"hal"}),
        chain("h", "e", "n", {"mediaKey":"hen"}),
        chain("a", "h", "u", {"mediaKey":"ahu"}),
        chain("s", "a", "h", {"mediaKey":"sah"}),
        chain("r", "u", "h", {"mediaKey":"ruh"}),
        fuse(["h","a","l","ı"], {"mediaKey":"halı","narration":"halı kelimesini birleştirelim!","celebrate":"Harika! Halı!"}),
        fuse(["h","a","b","e","r"], {"mediaKey":"haber"}),
        fuse(["h","e","m","e","n"], {"mediaKey":"hemen"}),
        fuse(["s","a","h","i","l"], {"mediaKey":"sahil"}),
        fuse(["h","a","k","a","n"], {"mediaKey":"hakan"}),
        fuse(["o","h","a","n"], {"mediaKey":"ohan"}),
        fuse(["t","a","h","ı","l"], {"mediaKey":"tahıl"}),
        syl("h", "a", "p", "ı", "hapı"),
        syl("h", "a", "l", "a", "hala"),
        syl("s", "a", "h", "a", "saha", {"narration":"sa + ha → saha!","celebrate":"Süper! Saha!"}),
        fuse(["ı","h","l","a","m","u","r"], {"mediaKey":"ıhlamur","narration":"ıhlamur kelimesini birleştirelim!","celebrate":"Harika! Ihlamur!"}),
        fuse(["h","o","r","o","z"], {"mediaKey":"horoz","narration":"horoz kelimesini birleştirelim!","celebrate":"Yaşasın! Horoz!"}),
        fuse(["h","e","d","i","y","e"], {"mediaKey":"hediye","narration":"hediye kelimesini birleştirelim!","celebrate":"Süper! Hediye!"}),
        fuse(["h","a","r","i","t","a"], {"mediaKey":"harita"}),
        fuse(["h","ı","r","k","a"], {"mediaKey":"hırka"}),
        fuse(["h","i","k","a","y","e"], {"mediaKey":"hikaye"}),
        fuse(["h","i","n","d","i"], {"mediaKey":"hindi"}),
        fuse(["h","e","k","i","m"], {"mediaKey":"hekim"}),
        chain("h", "i", "p", {"mediaKey":"hip"}),
        syl("h", "o", "r", "o", "horo"),
        syl("h", "e", "m", "e", "heme")
      ]
    )
    ,
    sound(
      {
        id: "v",
        letter: "v",
        color: "#118ab2",
        glow: "rgba(17,138,178,.45)",
        hint: "5. grup · v",
        icon: "VV",
        introSpeak: "v sesi geldi. Diş-dudak: v!",
        phoneme: "vı"
      },
      "grup5",
      [
        intro("v"),
        hece("v", "a"),
        hece("a", "v", {"mediaKey":"av","kind":"kelime"}),
        hece("v", "e"),
        hece("e", "v", {"mediaKey":"ev","kind":"kelime"}),
        hece("v", "i"),
        hece("i", "v"),
        hece("v", "o"),
        hece("o", "v", {"mediaKey":"ov","kind":"kelime"}),
        hece("v", "u"),
        hece("u", "v"),
        hece("v", "ı"),
        hece("ı", "v"),
        hece("v", "ü"),
        hece("ü", "v"),
        hece("v", "ö"),
        hece("ö", "v"),
        chain("v", "a", "r", {"mediaKey":"var"}),
        chain("v", "e", "r", {"mediaKey":"ver"}),
        chain("a", "v", "a", {"mediaKey":"ava"}),
        chain("e", "v", "i", {"mediaKey":"evi"}),
        chain("v", "a", "t", {"mediaKey":"vat"}),
        chain("h", "a", "v", {"mediaKey":"hav"}),
        chain("n", "e", "v", {"mediaKey":"nev"}),
        fuse(["v","a","z","o"], {"mediaKey":"vazo","narration":"vazo kelimesini birleştirelim!","celebrate":"Muhteşem! Vazo!"}),
        fuse(["m","a","v","i"], {"mediaKey":"mavi","narration":"mavi kelimesini birleştirelim!","celebrate":"Yaşasın! Mavi!"}),
        fuse(["h","a","v","a"], {"mediaKey":"hava","narration":"hava kelimesini birleştirelim!","celebrate":"Harika! Hava!"}),
        fuse(["v","e","r","i"], {"mediaKey":"veri"}),
        fuse(["d","e","v","e"], {"mediaKey":"deve"}),
        fuse(["k","i","v","i"], {"mediaKey":"kivi"}),
        fuse(["s","e","v","i","n"], {"mediaKey":"sevin"}),
        fuse(["y","a","v","r","u"], {"mediaKey":"yavru"}),
        syl("e", "v", "e", "t", "evet", {"narration":"e + vet? ev+et → evet!","celebrate":"Süper! Evet!"}),
        fuse(["v","a","p","u","r"], {"mediaKey":"vapur","narration":"vapur kelimesini birleştirelim!","celebrate":"Harika! Vapur!"}),
        fuse(["v","i","ş","n","e"], {"mediaKey":"vişne","narration":"vişne kelimesini birleştirelim!","celebrate":"Yaşasın! Vişne!"}),
        fuse(["v","a","l","i","z"], {"mediaKey":"valiz","narration":"valiz kelimesini birleştirelim!","celebrate":"Süper! Valiz!"}),
        fuse(["v","i","d","a"], {"mediaKey":"vida"}),
        fuse(["h","a","v","l","u"], {"mediaKey":"havlu"}),
        fuse(["t","a","v","ş","a","n"], {"mediaKey":"tavşan"}),
        fuse(["m","a","r","t","ı"], {"mediaKey":"martı"}),
        fuse(["s","i","m","i","t"], {"mediaKey":"simit"}),
        chain("v", "a", "p", {"mediaKey":"vap"}),
        syl("v", "a", "p", "u", "vapu"),
        syl("v", "a", "r", "a", "vara")
      ]
    )
    ,
    sound(
      {
        id: "ğ",
        letter: "ğ",
        color: "#073b4c",
        glow: "rgba(7,59,76,.45)",
        hint: "5. grup · ğ",
        icon: "ĞĞ",
        introSpeak: "ğ sesi geldi. Yumuşak ğ!",
        phoneme: "ğı"
      },
      "grup5",
      [
        intro("ğ"),
        hece("ğ", "a"),
        hece("a", "ğ"),
        hece("ğ", "e"),
        hece("e", "ğ"),
        hece("ğ", "i"),
        hece("i", "ğ"),
        hece("ğ", "o"),
        hece("o", "ğ"),
        hece("ğ", "u"),
        hece("u", "ğ"),
        hece("ğ", "ı"),
        hece("ı", "ğ"),
        hece("ğ", "ü"),
        hece("ü", "ğ"),
        hece("ğ", "ö"),
        hece("ö", "ğ"),
        chain("a", "ğ", "a", {"mediaKey":"ağa"}),
        chain("d", "a", "ğ", {"mediaKey":"dağ","narration":"da ile ğ: dağ!","celebrate":"Yaşasın! Dağ!"}),
        chain("y", "a", "ğ", {"mediaKey":"yağ","narration":"ya ile ğ: yağ!","celebrate":"Harika! Yağ!"}),
        chain("b", "a", "ğ", {"mediaKey":"bağ"}),
        chain("t", "u", "ğ", {"mediaKey":"tuğ"}),
        chain("ğ", "u", "r", {"mediaKey":"ğur"}),
        fuse(["a","ğ","a","ç"], {"mediaKey":"ağaç","narration":"ağaç kelimesini birleştirelim!","celebrate":"Muhteşem! Ağaç!"}),
        fuse(["d","e","ğ","e","r"], {"mediaKey":"değer"}),
        fuse(["y","a","ğ","ı"], {"mediaKey":"yağı"}),
        fuse(["b","a","ğ","ı"], {"mediaKey":"bağı"}),
        fuse(["ö","ğ","r","e"], {"mediaKey":"öğre"}),
        fuse(["d","ü","ğ","ü","n"], {"mediaKey":"düğün"}),
        fuse(["ç","i","ğ","d","e","m"], {"mediaKey":"çiğdem"}),
        fuse(["s","o","ğ","u","k"], {"mediaKey":"soğuk"}),
        syl("d", "a", "ğ", "a", "dağa"),
        syl("y", "a", "ğ", "a", "yağa"),
        syl("b", "a", "ğ", "a", "bağa"),
        fuse(["y","a","ğ","m","u","r"], {"mediaKey":"yağmur","narration":"yağmur kelimesini birleştirelim!","celebrate":"Harika! Yağmur!"}),
        fuse(["s","o","ğ","a","n"], {"mediaKey":"soğan","narration":"soğan kelimesini birleştirelim!","celebrate":"Yaşasın! Soğan!"}),
        fuse(["k","u","r","b","a","ğ","a"], {"mediaKey":"kurbağa","narration":"kurbağa kelimesini birleştirelim!","celebrate":"Süper! Kurbağa!"}),
        fuse(["i","ğ","n","e"], {"mediaKey":"iğne"}),
        fuse(["k","a","ğ","ı","t"], {"mediaKey":"kağıt"}),
        fuse(["s","a","r","ı","m","s","a","k"], {"mediaKey":"sarımsak"}),
        fuse(["k","a","r","l","ı"], {"mediaKey":"karlı"}),
        fuse(["y","ü","k","s","e","k"], {"mediaKey":"yüksek"}),
        chain("o", "ğ", "u", {"mediaKey":"oğu"}),
        syl("y", "a", "ğ", "m", "yağm"),
        syl("ö", "ğ", "ü", "n", "öğün")
      ]
    )
    ,
    sound(
      {
        id: "f",
        letter: "f",
        color: "#ffd166",
        glow: "rgba(255,209,102,.45)",
        hint: "5. grup · f",
        icon: "FF",
        introSpeak: "f sesi geldi. Diş-dudak üfle: f!",
        phoneme: "fı"
      },
      "grup5",
      [
        intro("f"),
        hece("f", "a"),
        hece("a", "f"),
        hece("f", "e"),
        hece("e", "f"),
        hece("f", "i"),
        hece("i", "f"),
        hece("f", "o"),
        hece("o", "f", {"mediaKey":"of","kind":"kelime"}),
        hece("f", "u"),
        hece("u", "f"),
        hece("f", "ı"),
        hece("ı", "f"),
        hece("f", "ü"),
        hece("ü", "f"),
        hece("f", "ö"),
        hece("ö", "f"),
        chain("f", "a", "n", {"mediaKey":"fan"}),
        chain("f", "i", "l", {"mediaKey":"fil","narration":"fi ile l: fil!","celebrate":"Yaşasın! Fil kelimesi!"}),
        chain("a", "f", "i", {"mediaKey":"afi"}),
        chain("k", "a", "f", {"mediaKey":"kaf"}),
        chain("s", "e", "f", {"mediaKey":"sef"}),
        chain("f", "a", "r", {"mediaKey":"far"}),
        chain("t", "e", "f", {"mediaKey":"tef"}),
        fuse(["d","e","f","t","e","r"], {"mediaKey":"defter","narration":"defter kelimesini birleştirelim!","celebrate":"Muhteşem! Defter!"}),
        fuse(["k","a","f","a"], {"mediaKey":"kafa"}),
        fuse(["f","i","d","e"], {"mediaKey":"fide"}),
        fuse(["s","e","f","a"], {"mediaKey":"sefa"}),
        fuse(["f","a","r","e"], {"mediaKey":"fare","narration":"fare kelimesini birleştirelim!","celebrate":"Harika! Fare!"}),
        fuse(["ü","f","l","e"], {"mediaKey":"üfle"}),
        fuse(["f","ı","r","ı","n"], {"mediaKey":"fırın"}),
        fuse(["z","ü","r","a","f","a"], {"mediaKey":"zürafa"}),
        syl("f", "i", "l", "i", "fili"),
        syl("f", "a", "r", "a", "fara"),
        syl("d", "e", "f", "e", "defe"),
        fuse(["f","ı","n","d","ı","k"], {"mediaKey":"fındık","narration":"fındık kelimesini birleştirelim!","celebrate":"Harika! Fındık!"}),
        fuse(["f","ı","s","t","ı","k"], {"mediaKey":"fıstık","narration":"fıstık kelimesini birleştirelim!","celebrate":"Yaşasın! Fıstık!"}),
        fuse(["f","l","ü","t"], {"mediaKey":"flüt","narration":"flüt kelimesini birleştirelim!","celebrate":"Süper! Flüt!"}),
        fuse(["f","a","y","t","o","n"], {"mediaKey":"fayton"}),
        fuse(["f","i","d","a","n"], {"mediaKey":"fidan"}),
        fuse(["f","ı","r","ç","a"], {"mediaKey":"fırça"}),
        fuse(["p","o","ğ","a","ç","a"], {"mediaKey":"poğaça"}),
        fuse(["f","ı","ş","k","ı","r"], {"mediaKey":"fışkır"}),
        chain("f", "i", "d", {"mediaKey":"fid"}),
        syl("f", "l", "ü", "t", "flüte"),
        syl("f", "e", "n", "e", "fene")
      ]
    )
    ,
    sound(
      {
        id: "j",
        letter: "j",
        color: "#06d6a0",
        glow: "rgba(6,214,160,.35)",
        hint: "5. grup · j",
        icon: "JJ",
        introSpeak: "j sesi geldi. Fransız j!",
        phoneme: "jı"
      },
      "grup5",
      [
        intro("j"),
        hece("j", "a"),
        hece("a", "j"),
        hece("j", "e"),
        hece("e", "j"),
        hece("j", "i"),
        hece("i", "j"),
        hece("j", "o"),
        hece("o", "j"),
        hece("j", "u"),
        hece("u", "j"),
        hece("j", "ü"),
        hece("ü", "j"),
        chain("j", "e", "t", {"mediaKey":"jet"}),
        chain("j", "a", "r", {"mediaKey":"jar"}),
        chain("a", "j", "a", {"mediaKey":"aja"}),
        chain("j", "e", "l", {"mediaKey":"jel"}),
        chain("t", "a", "j", {"mediaKey":"taj"}),
        fuse(["j","i","l","e"], {"mediaKey":"jile"}),
        fuse(["j","a","k","e","t"], {"mediaKey":"jaket"}),
        fuse(["j","ü","r","i"], {"mediaKey":"jüri"}),
        fuse(["m","a","j","ö","r"], {"mediaKey":"majör"}),
        fuse(["j","e","o","l","o","j","i"], {"mediaKey":"jeoloji"}),
        syl("j", "e", "t", "e", "jete"),
        syl("j", "e", "l", "e", "jele"),
        fuse(["p","i","j","a","m","a"], {"mediaKey":"pijama","narration":"pijama kelimesini birleştirelim!","celebrate":"Harika! Pijama!"}),
        fuse(["j","i","p"], {"mediaKey":"jip","narration":"jip kelimesini birleştirelim!","celebrate":"Yaşasın! Jip!"}),
        fuse(["j","u","d","o"], {"mediaKey":"judo","narration":"judo kelimesini birleştirelim!","celebrate":"Süper! Judo!"}),
        fuse(["j","a","n","t"], {"mediaKey":"jant"}),
        fuse(["j","ö","l","e"], {"mediaKey":"jöle"}),
        fuse(["j","i","l","e","t"], {"mediaKey":"jilet"}),
        fuse(["j","a","n","d","a","r","m","a"], {"mediaKey":"jandarma"}),
        fuse(["b","a","g","a","j"], {"mediaKey":"bagaj"}),
        chain("j", "o", "k", {"mediaKey":"jok"}),
        syl("j", "a", "n", "t", "jantı"),
        syl("a", "j", "a", "n", "ajan", {"narration":"a + jan? aj+an → ajan!","celebrate":"Süper! Ajan!"})
      ]
    )
  ];

  var GROUPS = [
    {
      id: "grup1",
      order: 1,
      title: "1. Grup",
      subtitle: "A · N · E · T · İ · L",
      tagline: "Maarif Modeli · Sesleri birleştirelim",
      weeks: 6,
      emoji: "1️⃣",
      color: "#e4572e",
      sounds: GROUP1_SOUNDS
    },
    {
      id: "grup2",
      order: 2,
      title: "2. Grup",
      subtitle: "O · K · U · R · I · M",
      tagline: "İkinci ses grubu",
      weeks: 4,
      emoji: "2️⃣",
      color: "#3a86ff",
      sounds: GROUP2_SOUNDS
    },
    {
      id: "grup3",
      order: 3,
      title: "3. Grup",
      subtitle: "Ü · S · Ö · Y · D · Z",
      tagline: "Maarif · Ü S Ö Y D Z · cümle, piramit ve hikâye",
      weeks: 2,
      emoji: "3️⃣",
      color: "#ffbe0b",
      sounds: GROUP3_SOUNDS
    },
    {
      id: "grup4",
      order: 4,
      title: "4. Grup",
      subtitle: "Ç · B · G · C · Ş",
      tagline: "Dördüncü ses grubu",
      weeks: 2,
      emoji: "4️⃣",
      color: "#f72585",
      sounds: GROUP4_SOUNDS
    },
    {
      id: "grup5",
      order: 5,
      title: "5. Grup",
      subtitle: "P · H · V · Ğ · F · J",
      tagline: "Beşinci ses grubu",
      weeks: 2,
      emoji: "5️⃣",
      color: "#06d6a0",
      sounds: GROUP5_SOUNDS
    }
  ];

  /**
   * 1. sınıf kelime bankası — yalnız çocukların anlayacağı anlamlı Türkçe sözcükler.
   * Uydurma / yabancı isim (nina, tina…) ve gereksiz adlar yok.
   * Her seste yalnızca o ana kadar öğrenilen harfler geçer.
   */
  var WORD_BANK = {
    a: [],
    n: ["ana"],
    e: ["anne", "nane", "nene"],
    t: ["at", "et", "ata", "tane", "anten", "tat", "net"],
    i: ["eti", "inat", "nine", "ninni"],
    l: [
      "al", "el", "ali", "eli", "ile", "nal", "tel", "alt",
      "lale", "elle", "elli", "ilan", "aile", "alet", "lila", "atlet", "ilet", "telli",
      "anlat", "etli", "anten", "tane"
    ],
    o: ["ot", "ol", "oto", "ona", "not", "nota", "olta", "alo", "otel", "olan"],
    k: [
      "kek", "tek", "kan", "kol", "tak", "ilk", "iki",
      "kale", "inek", "kola", "kilo", "leke", "elek", "ekle", "toka", "kilit", "kekik",
      "kantin", "otlak", "konak", "kakao", "tekne", "kalk"
    ],
    u: [
      "un", "okul", "kutu", "koku", "kule", "unut", "kulak",
      "konuk", "tutkal", "kukla", "okullu", "kutulu"
    ],
    r: [
      "ara", "kar", "nar", "tar", "kare", "kara", "kira", "lira",
      "koru", "kuru", "okur", "iri", "erik", "renk", "kart", "orta", "tren",
      "roket", "kurt", "korku", "karne", "erken", "arı", "karton"
    ],
    ı: [
      "kır", "tık", "akıl", "alın", "kalın", "karın", "kırık", "ılık",
      "nalın", "kartı", "arı"
    ],
    m: [
      "ama", "mum", "kum", "mor", "elma", "mama", "kalem", "emek", "ekmek", "liman",
      "orman", "umut", "tamam", "keman", "motor", "maket", "marul", "limon", "armut",
      "makarna", "market", "minik", "komik", "tamir", "mola", "metre", "mısır"
    ],
    ü: [
      "ütü", "ürün", "tüm", "kül", "ümit", "türlü", "küme",
      "ülke", "tünel", "ünlü", "ülkem", "kütük", "kürk", "ün",
      "kürek", "mülk", "tül", "ünite", "tülü"
    ],
    s: [
      "su", "ses", "son", "sus", "saat", "masa", "isim", "sıra", "sokak", "usta",
      "simit", "kasa", "süt", "sütlü", "eski", "susam", "resim", "sakin", "süs",
      "sırt", "süslü", "süre", "kesim", "sevim", "sumak", "sosis", "suluk",
      "askı", "sıska", "sıralı", "suskun", "simitli", "kasalı", "salata",
      "sütun", "sütlük", "maske", "arsa", "sil", "somun", "musluk", "kısa",
      "keser", "sirke", "seri", "eser", "nesne", "tas", "ters", "mısır",
      "resimli", "kasım", "kısım", "susamlı"
    ],
    ö: [
      "kök", "örtü", "örnek", "kömür", "önlük", "öteki", "körük",
      "örme", "kömürü", "kökü", "örnekli", "önlüklü", "mönü", "tören", "köse"
    ],
    y: [
      "ay", "oy", "yan", "yat", "yol", "yer", "ayı", "yıl", "ayak", "yaka", "kaya",
      "oyun", "yemek", "ayna", "iyi", "uyu", "yük", "yay", "köy", "öykü",
      "yürek", "yumak", "yunus", "yirmi", "yayla", "yüksek", "yün",
      "yemekli", "yastık", "yaylı", "köylü", "oyunlu", "yayın", "öykülü",
      "yelek", "uyku", "uyan", "yünlü", "sayı", "soy", "soya", "suyu",
      "yasak", "yırtık", "yemeklik"
    ],
    d: [
      "ad", "dal", "dil", "ada", "dede", "dayı", "dere", "dilek", "kadın",
      "dolu", "yedi", "odun", "dana", "deri", "dudak", "kedi", "dört", "dost",
      "dünya", "dikkat", "dükkan", "dondurma", "domates",
      "ödül", "yardım", "duman", "dümen", "doyum", "dürüm", "döküm",
      "odalı", "dayanak", "dostluk", "odunluk", "dondurmalı",
      "dilim", "dirsek", "doktor", "dokun", "dolma", "müdür",
      "seda", "yolda", "yoldan"
    ],
    z: [
      "az", "söz", "yüz", "kız", "muz", "deniz", "yazı", "temiz", "uzun",
      "kuzu", "üzüm", "taze", "zil", "tuz", "sözlük", "zeka",
      "yazlık", "tuzlu", "üzümlü", "zemin", "özel", "kazık",
      "sözlü", "yüzük", "kızıl", "temizlik", "uzunluk", "yazılı",
      "zeytin", "zaman", "zar", "yıldız", "yüzme", "kuzey",
      "özür", "özlem", "düz", "düzen", "uzak", "uzay", "yaz", "yazar",
      "kazan", "kazı", "tuzsuz"
    ],
    ç: [
      "aç", "uç", "üç", "çay", "çok", "çek", "saç", "çiçek", "için", "çakı", "çekiç",
      "uçak", "çilek", "ölçü", "çanta", "çamur", "çikolata", "çocuk", "çatı", "çene",
      "uçurtma", "çim", "çukur", "çizgi", "çember"
    ],
    b: [
      "bal", "ben", "bir", "buz", "boy", "abi", "baba", "bebek", "balık", "burun",
      "boya", "büyük", "börek", "boru", "bere", "bardak", "bulut", "bisiklet",
      "bakkal", "biber", "bayram", "böcek", "balıkçı", "boncuk"
    ],
    g: [
      "gel", "gül", "göz", "göl", "gün", "gez", "git", "güzel", "gaga",
      "gölge", "gemi", "gözlük", "gökyüzü", "gitar", "gıdık", "gülücük"
    ],
    c: ["can", "cam", "acı", "gece", "çocuk", "inci", "bacak", "amca", "cuma", "ocak", "cümle", "cami", "cüce", "cadde"],
    ş: [
      "aş", "eş", "iş", "kuş", "baş", "yaş", "beş", "şeker", "şişe", "kaşık", "şarkı",
      "diş", "kış", "boş", "koşu", "yaşa", "şemsiye", "aşçı", "kaş", "şimşek", "şirin", "şaşkın"
    ],
    p: [
      "ip", "top", "kap", "sap", "para", "kapı", "sepet", "tepe", "pamuk", "köpük",
      "ipek", "pide", "pil", "pul", "kupa", "portakal", "papatya", "park",
      "parmak", "pasta", "şapka", "patates", "piyano", "pati"
    ],
    h: [
      "hala", "halı", "haber", "hemen", "sahil", "hoca", "bahar", "sabah",
      "harita", "hediye", "helva", "hikaye", "horoz", "hurma", "hayır"
    ],
    v: [
      "ev", "var", "ver", "vazo", "mavi", "hava", "deve", "kivi", "evet", "yuva",
      "sevgi", "ceviz", "vatan", "valiz", "kova", "tavuk", "çivi", "vapur", "vakit",
      "havuç", "hayvan", "hafta"
    ],
    ğ: [
      "dağ", "yağ", "bağ", "ağaç", "yağmur", "düğün", "soğuk", "doğa", "ağır",
      "düğme", "öğle", "kağıt", "oğlak", "tuğla", "öğrenci", "soğan", "yağlı"
    ],
    f: [
      "fil", "kafa", "fide", "fare", "defter", "fırın", "zürafa", "futbol",
      "fındık", "fasulye", "fırça", "fermuar", "fener", "filiz", "çiftçi", "şeftali"
    ],
    j: ["jet", "jel", "jöle", "jaket", "jilet"]
  };

  /* Standart 2 harfli heceler (ilkokul tabloları: CV / VC — ünlü+ünlü yok) */
  var HECE_BANK = {
    n: ["an", "na"],
    e: ["en", "ne", "et", "te", "an", "na"],
    t: ["at", "ta", "et", "te", "an", "na", "en", "ne"],
    i: ["in", "ni", "it", "ti", "an", "na", "en", "ne", "at", "ta", "et", "te"],
    l: ["al", "la", "el", "le", "il", "li", "an", "na", "en", "ne", "in", "ni", "at", "ta", "et", "te", "it", "ti"],
    o: ["on", "ot", "to", "ol", "lo", "an", "na", "en", "ne", "al", "la", "el", "le", "in", "ni", "at", "ta", "et", "te", "il", "li"],
    k: ["ak", "ka", "ek", "ke", "ik", "ki", "ok", "ko", "an", "na", "el", "le", "ol", "lo", "at", "ta", "et", "te", "il", "li", "al", "la"],
    u: ["un", "nu", "ut", "tu", "ul", "lu", "uk", "ku", "an", "na", "ok", "ko", "ol", "lo", "ak", "ka", "el", "le", "at", "ta", "ek", "ke"],
    r: ["ar", "ra", "er", "re", "ir", "ri", "or", "ro", "ur", "ru", "an", "na", "el", "le", "ok", "ko", "un", "nu", "ak", "ka", "ol", "lo"],
    ı: ["ık", "kı", "ıl", "lı", "ın", "nı", "ıt", "tı", "ır", "rı", "ak", "ka", "ar", "ra", "an", "na", "el", "le", "ok", "ko", "un", "nu"],
    m: ["am", "ma", "em", "me", "im", "mi", "om", "mo", "um", "mu", "ım", "mı", "an", "na", "el", "le", "ok", "ko", "ar", "ra", "ak", "ka"],
    ü: ["ün", "nü", "üt", "tü", "ül", "lü", "ük", "kü", "ür", "rü", "üm", "mü", "an", "na", "el", "le", "ok", "ko", "am", "ma", "um", "mu"],
    s: ["as", "sa", "es", "se", "is", "si", "os", "so", "us", "su", "ıs", "sı", "üs", "sü", "an", "na", "el", "le", "um", "mu", "ün", "nü"],
    ö: ["ön", "nö", "öt", "tö", "öl", "lö", "ök", "kö", "ör", "rö", "öm", "mö", "ös", "sö", "an", "na", "el", "le", "um", "mu", "üs", "sü"],
    y: ["ay", "ya", "ey", "ye", "iy", "yi", "oy", "yo", "uy", "yu", "ıy", "yı", "üy", "yü", "öy", "yö", "an", "na", "el", "le", "ok", "ko", "ös", "sö"],
    d: ["ad", "da", "ed", "de", "id", "di", "od", "do", "ud", "du", "ıd", "dı", "üd", "dü", "öd", "dö", "an", "na", "ay", "ya", "el", "le", "oy", "yo"],
    z: ["az", "za", "ez", "ze", "iz", "zi", "oz", "zo", "uz", "zu", "ız", "zı", "üz", "zü", "öz", "zö", "an", "na", "ay", "ya", "el", "le", "ad", "da"],
    ç: ["aç", "ça", "eç", "çe", "iç", "çi", "oç", "ço", "uç", "çu", "ıç", "çı", "üç", "çü", "öç", "çö", "an", "na", "ay", "ya", "az", "za"],
    b: ["ab", "ba", "eb", "be", "ib", "bi", "ob", "bo", "ub", "bu", "ıb", "bı", "üb", "bü", "öb", "bö", "an", "na", "al", "la", "ay", "ya", "aç", "ça"],
    g: ["ag", "ga", "eg", "ge", "ig", "gi", "og", "go", "ug", "gu", "ıg", "gı", "üg", "gü", "ög", "gö", "an", "na", "el", "le", "ay", "ya", "ab", "ba"],
    c: ["ac", "ca", "ec", "ce", "ic", "ci", "oc", "co", "uc", "cu", "ıc", "cı", "üc", "cü", "öc", "cö", "an", "na", "aç", "ça", "ab", "ba", "ag", "ga"],
    ş: ["aş", "şa", "eş", "şe", "iş", "şi", "oş", "şo", "uş", "şu", "ış", "şı", "üş", "şü", "öş", "şö", "an", "na", "ay", "ya", "ab", "ba", "ac", "ca"],
    p: ["ap", "pa", "ep", "pe", "ip", "pi", "op", "po", "up", "pu", "ıp", "pı", "üp", "pü", "öp", "pö", "an", "na", "ay", "ya", "aş", "şa", "ab", "ba"],
    h: ["ah", "ha", "eh", "he", "ih", "hi", "oh", "ho", "uh", "hu", "ıh", "hı", "üh", "hü", "öh", "hö", "an", "na", "ap", "pa", "ay", "ya", "aş", "şa"],
    v: ["av", "va", "ev", "ve", "iv", "vi", "ov", "vo", "uv", "vu", "ıv", "vı", "üv", "vü", "öv", "vö", "an", "na", "ah", "ha", "ay", "ya", "ap", "pa"],
    ğ: ["ağ", "ğa", "eğ", "ğe", "iğ", "ği", "oğ", "ğo", "uğ", "ğu", "ığ", "ğı", "üğ", "ğü", "öğ", "ğö", "an", "na", "ay", "ya", "av", "va", "ah", "ha"],
    f: ["af", "fa", "ef", "fe", "if", "fi", "of", "fo", "uf", "fu", "ıf", "fı", "üf", "fü", "öf", "fö", "an", "na", "ay", "ya", "ağ", "ğa", "av", "va"],
    j: ["aj", "ja", "ej", "je", "ij", "ji", "oj", "jo", "uj", "ju", "ıj", "jı", "üj", "jü", "öj", "jö", "an", "na", "af", "fa", "ay", "ya", "ağ", "ğa"]
  };

  /* Kesin yasak: uydurma, yabancı isim, uygunsuz veya 1. sınıf düzeyine aykırı */
  var WORD_BLOCKLIST = {
    nina: 1, tina: 1, lita: 1, atila: 1, nail: 1, talat: 1, nalan: 1, naile: 1,
    elina: 1, nil: 1, okan: 1, kenan: 1, atakan: 1, rana: 1, mert: 1, murat: 1,
    emel: 1, mete: 1, kemal: 1, melike: 1, mine: 1, hakan: 1, onat: 1, inan: 1,
    ene: 1, ane: 1, ala: 1, ele: 1, tal: 1, il: 1, loto: 1, kelek: 1, teknik: 1,
    tutku: 1, kutlu: 1, kulun: 1, kutla: 1, unutkan: 1, tokluk: 1, kula: 1, ulu: 1,
    olum: 1, ölüm: 1, kor: 1, kör: 1, kaza: 1, omur: 1, ömür: 1, sonuk: 1, sönük: 1,
    ajan: 1, juri: 1, jüri: 1, jaguar: 1, firma: 1, afacan: 1, foto: 1, far: 1,
    cimri: 1, cikcik: 1, helal: 1, zemzem: 1, zambak: 1, cetin: 1, çetin: 1,
    cakal: 1, çakal: 1, cozum: 1, çözüm: 1, secim: 1, seçim: 1, cini: 1, çini: 1,
    genc: 1, genç: 1, gelin: 1, gida: 1, gıda: 1, gures: 1, güreş: 1, gurultu: 1, gürültü: 1,
    gelenek: 1, giysi: 1, gormek: 1, görmek: 1, gaz: 1, bina: 1, bolge: 1, bölge: 1,
    battaniye: 1, bezelye: 1, buzlu: 1, dollar: 1, dolar: 1, demlik: 1, dakika: 1,
    deger: 1, değer: 1, domuz: 1, durust: 1, dürüst: 1, adet: 1, sandal: 1,
    yali: 1, yalı: 1, yavru: 1, yillik: 1, yıllık: 1, yasemin: 1, yikama: 1, yıkama: 1,
    yunmak: 1, yenmek: 1, yalama: 1, yuklu: 1, yüklü: 1, sayil: 1, sayıl: 1,
    oren: 1, ören: 1, odeme: 1, ödeme: 1, sonmek: 1, sönmek: 1, ortmek: 1, örtmek: 1,
    ortulu: 1, örtülü: 1, kokten: 1, kökten: 1, orten: 1, örten: 1, komurluk: 1, kömürlük: 1,
    us: 1, üs: 1, sorma: 1, surme: 1, sürme: 1, sila: 1, sıla: 1, sabir: 1, sabır: 1,
    esas: 1, surekli: 1, sürekli: 1, sert: 1, sinif: 1, sınıf: 1, kusursuz: 1, sicak: 1, sıcak: 1,
    utum: 1, ütüm: 1, utulemek: 1, ütülemek: 1, urunlu: 1, ürünlü: 1, turu: 1, türü: 1,
    utulu: 1, ütülü: 1, unlem: 1, ünlem: 1, kultur: 1, kültür: 1, lule: 1, lüle: 1, tur: 1, tür: 1,
    ulku: 1, ülkü: 1, koklu: 1, köklü: 1, onem: 1, önem: 1, tokat: 1, orak: 1, katkı: 1, katki: 1,
    kiril: 1, kırıl: 1,
    lama: 1, mala: 1, mamut: 1, imam: 1, emir: 1, kamer: 1, mekik: 1, tirmik: 1, tırmık: 1,
    meltem: 1, ormanlik: 1, ormanlık: 1, elmaci: 1, elmacı: 1, kumsal: 1, mini: 1,
    irak: 1, ırak: 1, kıran: 1, alınan: 1, alik: 1, alık: 1, tiril: 1, tırıl: 1, kitir: 1, kıtır: 1,
    inal: 1, ınal: 1, kari: 1, karı: 1, alinlik: 1, alınlık: 1, ilikca: 1, ılıkça: 1, arilar: 1, arılar: 1,
    kurak: 1, kareli: 1, trafik: 1, trafiku: 1, trafikü: 1, ürküt: 1, trafik: 1, tert: 1, ertesi: 1, trafik: 1, trafiknak: 1,
    trafik: 1, karinca: 1, karınca: 1, kilitli: 1, ten: 1, tan: 1, an: 1
  };

  var HECE_BLOCKLIST = {
    ea: 1, ae: 1, oa: 1, ao: 1, oe: 1, eo: 1, oi: 1, io: 1, ua: 1, au: 1, ue: 1, eu: 1,
    ui: 1, iu: 1, uo: 1, ou: 1, ia: 1, ai: 1, ie: 1, ei: 1, no: 1,
    oç: 1, ıb: 1, ıg: 1, ıj: 1, ıh: 1, ıv: 1, ıf: 1, ıd: 1, öb: 1, öc: 1, öj: 1, öh: 1, öv: 1, öf: 1, öş: 1, öç: 1,
    ug: 1, ag: 1, eg: 1, ig: 1, og: 1, ğo: 1, ğa: 1, ğe: 1, ği: 1, ğu: 1, ğı: 1, ğü: 1, ğö: 1
  };

  var VOWELS_TR = { a: 1, e: 1, ı: 1, i: 1, o: 1, ö: 1, u: 1, ü: 1 };

  var LETTER_ORDER = [
    "a", "n", "e", "t", "i", "l",
    "o", "k", "u", "r", "ı", "m",
    "ü", "s", "ö", "y", "d", "z",
    "ç", "b", "g", "c", "ş",
    "p", "h", "v", "ğ", "f", "j"
  ];

  function allowedLettersFor(soundId) {
    var idx = LETTER_ORDER.indexOf(String(soundId || "").toLocaleLowerCase("tr-TR"));
    if (idx < 0) return null;
    var set = {};
    for (var i = 0; i <= idx; i++) set[LETTER_ORDER[i]] = true;
    return set;
  }

  function wordLettersOk(word, allowed) {
    if (!allowed) return true;
    var chars = Array.from(String(word || "").toLocaleLowerCase("tr-TR"));
    for (var i = 0; i < chars.length; i++) {
      if (!allowed[chars[i]]) return false;
    }
    return chars.length > 0;
  }

  function isVowelVowelHece(token) {
    token = String(token || "").toLocaleLowerCase("tr-TR");
    if (token.length !== 2) return false;
    var chars = Array.from(token);
    return !!(VOWELS_TR[chars[0]] && VOWELS_TR[chars[1]]);
  }

  function rebuildMeaningfulWords() {
    GROUPS.forEach(function (g) {
      (g.sounds || []).forEach(function (s) {
        var allowed = allowedLettersFor(s.id);
        var letter = String(s.letter || s.id || "").toLocaleLowerCase("tr-TR");
        var intros = [];
        var wordSet = {};
        var kelimeler = [];

        /* Önce kelimeler — al/el/at gibi anlamlılar yalnız burada kalsın */
        (WORD_BANK[s.id] || []).forEach(function (w) {
          w = String(w || "").toLocaleLowerCase("tr-TR");
          if (!w || wordSet[w] || WORD_BLOCKLIST[w]) return;
          if (!wordLettersOk(w, allowed)) return;
          if (w.indexOf(letter) < 0) return;
          wordSet[w] = true;
          kelimeler.push(
            wordFusion(w, {
              mediaKey: w,
              celebrate: "Harika! " + w + " kelimesini okudun!"
            })
          );
        });

        var heceSeen = {};
        var heceler = [];
        function pushHece(token) {
          token = String(token || "").toLocaleLowerCase("tr-TR");
          if (!token || token.length !== 2 || heceSeen[token]) return;
          /* Kelime bölümünde olanı heceye tekrar koyma (el, at, un…) */
          if (wordSet[token]) return;
          if (HECE_BLOCKLIST[token] || isVowelVowelHece(token)) return;
          if (!wordLettersOk(token, allowed)) return;
          if (token.indexOf(letter) < 0) return;
          heceSeen[token] = true;
          var chars = Array.from(token);
          heceler.push(hece(chars[0], chars[1]));
        }

        (s.fusions || []).forEach(function (f) {
          if (!f) return;
          if (f.type === "intro" || f.kind === "ses") {
            intros.push(f);
            return;
          }
          if (f.mode === "syllables" || f.mode === "chain") return;
          if (f.kind === "kelime" || f.type === "kelime" || f.mediaKey) return;
          if (f.type === "hece" || f.kind === "hece") pushHece(f.result);
        });

        (HECE_BANK[s.id] || []).forEach(pushHece);

        var cumleler = [];
        (SENTENCE_BANK[s.id] || []).forEach(function (raw) {
          var f = sentenceFusion(raw);
          if (!f) return;
          if (!sentenceLettersOk(f, allowed)) return;
          cumleler.push(f);
        });

        var piramitler = [];
        (PYRAMID_BANK[s.id] || []).forEach(function (entry) {
          var f = pyramidFusion(entry);
          if (!f) return;
          if (!entry.skipLetterCheck && !pyramidLettersOk(f, allowed)) return;
          piramitler.push(f);
        });

        var metinler = [];
        (TEXT_BANK[s.id] || []).forEach(function (entry) {
          var f = textFusion(entry);
          if (!f) return;
          /* Yazar metni: skipLetterCheck ile harf filtresi atlanır (verdiği metin aynen kalır) */
          if (!entry.skipLetterCheck && !textLettersOk(f, allowed)) return;
          metinler.push(f);
        });

        /* Sıra: hece → kelime → cümle → piramit (hızlı okuma) → hikâye */
        s.fusions = intros.concat(heceler, kelimeler, cumleler, piramitler, metinler);
      });
    });
  }

  /**
   * Maarif Modeli (TYMM Türkçe Öğretim Programı):
   * 1. harf grubunda (ANETİL) → ses, hece, sözcük.
   * 2. harf grubundan (o) itibaren → cümle, piramit (hızlı okuma) ve metin.
   * Piramit: satır satır uzayan akıcılık metni; cümle ile hikâye arasında.
   */
  /**
   * Cümle / piramit / metin sözcükleri.
   * Virgül: kaynakta varsa korunur; ardışık özel isimlerde (anne Ali → anne, Ali) otomatik eklenir.
   * TTS’te virgül okunmaz; gösterimde kalır.
   */
  function parsePhraseTokens(tokens) {
    tokens = (tokens || []).filter(Boolean);
    if (!tokens.length) return [];

    function stripPunct(tok) {
      return String(tok || "").replace(/^[,;:]+|[,;:.!?]+$/g, "");
    }

    function tokenHasComma(tok) {
      return /,(?=[.!?]*$)/.test(String(tok || "").trim());
    }

    var words = [];
    for (var i = 0; i < tokens.length; i++) {
      var tok = String(tokens[i] || "").trim();
      var clean = stripPunct(tok);
      if (!clean) continue;
      var say = clean.toLocaleLowerCase("tr-TR");
      var nextClean = i + 1 < tokens.length ? stripPunct(tokens[i + 1]).toLocaleLowerCase("tr-TR") : "";
      var comma = tokenHasComma(tok);
      /* Ali, Lale · anne, Ali — ardışık kişi adlarında virgül */
      if (
        !comma &&
        nextClean &&
        nextClean !== "ile" &&
        ((isProperName(say) && isProperName(nextClean)) ||
          (say === "anne" && isProperName(nextClean)) ||
          (isProperName(say) && nextClean === "anne"))
      ) {
        comma = true;
      }
      /* Yalnız cümle/satır başı + özel isimler büyük; diğerleri küçük */
      var shown = formatDisplayWord(say, words.length === 0 || isProperName(say));
      var syls = syllabifyTR(say);
      var displaySyls = alignSyllableDisplay(shown, syls);
      words.push({
        text: comma ? shown + "," : shown,
        say: say,
        syllables: syls,
        displaySyllables: displaySyls
      });
    }
    return words;
  }

  function sentenceFusion(text, opts) {
    opts = opts || {};
    text = String(text || "").trim();
    if (!text) return null;
    var display = /[.!?]$/.test(text) ? text : text + ".";
    var body = display.replace(/[.!?]+$/g, "");
    var tokens = body.split(/\s+/).filter(Boolean);
    if (!tokens.length) return null;

    var words = parsePhraseTokens(tokens);
    if (!words.length) return null;

    /* result metnini düzeltilmiş büyük/küçük harflerle yeniden kur */
    display =
      words
        .map(function (w) {
          return w.text;
        })
        .join(" ") + ".";

    var idBase = words
      .map(function (w) {
        return w.say;
      })
      .join("_");
    return {
      id: opts.id || "cumle_" + idBase,
      type: "cumle",
      kind: "cumle",
      mode: "sentence",
      result: display,
      words: words,
      parts: words.map(function (w) {
        return w.say;
      }),
      label:
        opts.label ||
        words
          .map(function (w) {
            return (w.displaySyllables || w.syllables).join("-");
          })
          .join(" · "),
      narration: opts.narration || "Cümleyi hece hece okuyalım!",
      celebrate: opts.celebrate || "Harika! Cümleyi okudun!"
    };
  }

  function sentenceLettersOk(fusion, allowed) {
    if (!fusion || !fusion.words) return false;
    for (var i = 0; i < fusion.words.length; i++) {
      if (!wordLettersOk(fusion.words[i].say, allowed)) return false;
    }
    return true;
  }

  /*
   * 2–4. grup cümleler — yalnız mantıklı, çocuk dünyasına uygun eylemler.
   * Yasak örnek: “temizlik al”, “nalın al”, “akıl al”, “kulak al”, “otel al”…
   * Fiiller: al (satın al), ara (bul/bak), tat, tak, oku — somut nesne/kişi/yer.
   * Her ses: ~15 özgün cümle (yalnız özne değiştirerek kopya yok).
   * Harfler kümülatif: o ana kadar öğretilen sesler.
   */
  var SENTENCE_BANK = {
    o: [
      "Ali oto al.",
      "anne oto al.",
      "Lale oto al.",
      "Ata not al.",
      "Ali not al.",
      "anne not al.",
      "Lale not al.",
      "anne, Ali not al.",
      "Ali olta al.",
      "anne olta al.",
      "Lale olta al.",
      "Ali nota al.",
      "anne nota al.",
      "Ali ile anne el ele.",
      "Lale ile Ata el ele.",
      "Ali ile Lale oto al.",
      "Ata ile Ali not al.",
      "anne, Lale olta al."
    ],
    k: [
      "Ali kek al.",
      "anne kek al.",
      "Lale kek al.",
      "Ali kek tat.",
      "Lale kek tat.",
      "Lale toka tak.",
      "anne toka tak.",
      "Ata toka al.",
      "anne, Lale toka al.",
      "Ali kilit al.",
      "anne kilit al.",
      "Ali kola al.",
      "Lale kola al.",
      "Ali iki kek al.",
      "anne iki toka al.",
      "Ali kekik al.",
      "anne elek al.",
      "Ali ile Lale kek al.",
      "anne, Ali kek al.",
      "Ata ile Ali toka tak.",
      "Ali kek ile kola al."
    ],
    u: [
      "anne kutu al.",
      "Ali kutu al.",
      "Lale kutu al.",
      "Ali un al.",
      "anne un al.",
      "Ali kukla al.",
      "anne kukla al.",
      "Lale kukla al.",
      "Ata kutu al.",
      "Ali tutkal al.",
      "anne tutkal al.",
      "Ali not oku.",
      "anne not oku.",
      "Lale not oku.",
      "Ali toka tak.",
      "Ali kutu ile un al.",
      "Ali ile Lale kukla al.",
      "anne, Ali kutu al.",
      "Lale un ile kutu al."
    ],
    r: [
      "Ali nar al.",
      "anne nar al.",
      "Lale nar al.",
      "Ali nar tat.",
      "Lale nar tat.",
      "Ali erik al.",
      "anne erik al.",
      "Lale erik tat.",
      "Ali kart al.",
      "anne kart al.",
      "Ata kart al.",
      "Ali tren ara.",
      "anne tren ara.",
      "Ali iri nar al.",
      "anne kara erik al.",
      "Ali iri erik al.",
      "Ali ile Lale nar al.",
      "anne, Ali erik al.",
      "Lale ile Ata kart al."
    ],
    ı: [
      "Ali arı ara.",
      "anne arı ara.",
      "Lale arı ara.",
      "Ali atkı al.",
      "anne atkı al.",
      "Lale atkı al.",
      "Ali atkı tak.",
      "Lale atkı tak.",
      "Ali takı al.",
      "anne takı al.",
      "Lale takı tak.",
      "Ali kalın atkı al.",
      "anne kalın atkı al.",
      "Ali kartı al.",
      "anne kartı al.",
      "Ali ile Lale arı ara.",
      "anne, Ali atkı al.",
      "Ata ile Ali takı al."
    ],
    m: [
      "anne elma al.",
      "Ali elma al.",
      "Lale elma al.",
      "Ali elma tat.",
      "Lale elma tat.",
      "Ali kalem al.",
      "anne kalem al.",
      "Ata kalem al.",
      "anne ekmek al.",
      "Ali ekmek al.",
      "Ali limon al.",
      "anne limon al.",
      "Ali armut al.",
      "Ali armut tat.",
      "anne marul al.",
      "Ali mor kalem al.",
      "anne minik elma al.",
      "Ali keman al.",
      "Ali elma ile limon al.",
      "Ali ile Lale elma al.",
      "anne, Ali kalem al.",
      "Lale ile Ata armut al."
    ],
    ü: [
      "Ali kürek al.",
      "anne kürek al.",
      "Lale kürek al.",
      "Ali kürek ara.",
      "anne kürek ara.",
      "anne ütü al.",
      "Ali ütü al.",
      "anne ütü ara.",
      "Ali minik kürek al.",
      "Lale mor kürek al.",
      "Ali ürün al.",
      "anne ürün al.",
      "Ali türlü ürün al.",
      "Ali ile Lale kürek al.",
      "anne, Ali kürek al.",
      "Ata ile Ali ütü al."
    ],
    s: [
      "Ali süt al.",
      "anne süt al.",
      "Lale süt al.",
      "Ali su al.",
      "anne su al.",
      "Ali simit al.",
      "anne simit al.",
      "Ali simit tat.",
      "Lale simit tat.",
      "Ali salata al.",
      "anne salata tat.",
      "Ali saat al.",
      "anne saat al.",
      "Ali maske tak.",
      "Lale maske tak.",
      "anne maske al.",
      "Ali mısır al.",
      "Ali mısır tat.",
      "anne masa al.",
      "Ali eski masa al.",
      "Ali ile Lale süt al.",
      "anne, Ali simit al.",
      "Ata ile Ali su al."
    ],
    ö: [
      "Ali önlük al.",
      "anne önlük al.",
      "Lale önlük al.",
      "Ali önlük tak.",
      "Lale önlük tak.",
      "Ali örtü al.",
      "anne örtü al.",
      "Ali mönü oku.",
      "anne mönü oku.",
      "Lale mönü oku.",
      "Ali mor önlük al.",
      "anne eski örtü al.",
      "Ali kömür al.",
      "Ali ile Lale önlük al.",
      "anne, Ali örtü al.",
      "Ata ile Ali mönü oku."
    ],
    y: [
      "Ali yol ara.",
      "anne yol ara.",
      "Lale yol ara.",
      "Ali yemek al.",
      "anne yemek al.",
      "Ali ayı ara.",
      "anne ayı ara.",
      "Lale ayı ara.",
      "Ali ayna al.",
      "anne ayna al.",
      "Ali oyun al.",
      "Lale oyun al.",
      "Ali öykü oku.",
      "anne öykü oku.",
      "Lale öykü oku.",
      "Ali sayı oku.",
      "Lale sayı oku.",
      "Ali yün al.",
      "anne yastık al.",
      "Ali yelek al.",
      "Ali ile Lale öykü oku.",
      "anne, Ali yemek al.",
      "Ata ile Ali oyun al."
    ],
    d: [
      "Ali kedi ara.",
      "anne kedi ara.",
      "Lale kedi ara.",
      "Ali dede ara.",
      "anne dede ara.",
      "Ali dayı ara.",
      "anne dayı ara.",
      "Ali dondurma al.",
      "anne dondurma al.",
      "Ali dondurma tat.",
      "Lale dondurma tat.",
      "Ali domates al.",
      "anne domates al.",
      "Ali dürüm al.",
      "Ali dürüm tat.",
      "Ali dolma tat.",
      "Ali dört elma al.",
      "anne yedi domates al.",
      "Ali ile Lale kedi ara.",
      "anne, Ali dondurma al.",
      "Ata ile Ali dede ara."
    ],
    z: [
      "Ali üzüm al.",
      "anne üzüm al.",
      "Lale üzüm al.",
      "Ali üzüm tat.",
      "Lale üzüm tat.",
      "Ata deniz ara.",
      "Ali deniz ara.",
      "anne deniz ara.",
      "Ali muz al.",
      "anne muz al.",
      "Ali muz tat.",
      "Ali tuz al.",
      "anne tuz al.",
      "Ali zil al.",
      "Lale zil al.",
      "Ali yazı oku.",
      "anne yazı oku.",
      "Ali kuzu ara.",
      "Lale kuzu ara.",
      "Ali zeytin al.",
      "anne zeytin tat.",
      "Ali taze üzüm al.",
      "anne temiz su al.",
      "Ali yıldız ara.",
      "Ali ile Lale üzüm al.",
      "anne, Ali deniz ara.",
      "Ata ile Ali muz al."
    ],
    /* 4. grup · ç b g c ş — kümülatif harf + mevcut kelimeler; özgün eylem/nesne */
    ç: [
      "Ali çay al.",
      "anne çilek al.",
      "Lale çiçek al.",
      "Ali çanta al.",
      "anne çikolata tat.",
      "Ali uçak ara.",
      "Lale uçurtma al.",
      "Çetin çekiç al.",
      "Ayça üç çilek al.",
      "Ali çakı al.",
      "anne ölçü al.",
      "Lale saç ara.",
      "Ali çok çay al.",
      "Ali ile Ayça çiçek al.",
      "anne, Ali çanta al."
    ],
    b: [
      "Ali bal al.",
      "anne börek al.",
      "Lale boya al.",
      "Burak balık ara.",
      "anne bebek ara.",
      "Ali biber al.",
      "Lale börek tat.",
      "Ali bardak al.",
      "anne buz al.",
      "Ali bisiklet al.",
      "Berna bere tak.",
      "Ali büyük bal al.",
      "Bora bakkal ara.",
      "Ali ile Burak balık al.",
      "anne, Ali boya al."
    ],
    g: [
      "Ali gül al.",
      "anne gözlük al.",
      "Lale gitar al.",
      "Ali gemi ara.",
      "Gül göl ara.",
      "anne gözlük tak.",
      "Tolga gitar al.",
      "Ali güzel çiçek al.",
      "Gamze gül al.",
      "Ali gökyüzü ara.",
      "Lale gölge ara.",
      "Ali minik gemi al.",
      "Gaye gaga ara.",
      "Ali ile Gül gemi ara.",
      "anne, Ali gözlük al."
    ],
    c: [
      "Ali cam al.",
      "anne inci al.",
      "Can cami ara.",
      "Ali çocuk ara.",
      "Cem inci al.",
      "anne ocak ara.",
      "Lale acı biber al.",
      "Candan cadde ara.",
      "Ali cümle oku.",
      "Lale cüce ara.",
      "Ata amca ara.",
      "Ceren cam al.",
      "Ali gece yıldız ara.",
      "Ali ile Can çocuk ara.",
      "anne, Ali inci al."
    ],
    ş: [
      "Ali şeker al.",
      "anne kaşık al.",
      "Lale şişe al.",
      "Ali kuş ara.",
      "Şule şarkı oku.",
      "anne şemsiye al.",
      "Ali beş şeker al.",
      "Lale şeker tat.",
      "Şermin şişe al.",
      "Ali şirin kuş ara.",
      "anne aşçı ara.",
      "Şenol şarkı oku.",
      "Ali kaşık ile şeker al.",
      "Ali ile Şule şarkı oku.",
      "anne, Ali şemsiye al."
    ]
  };

  /**
   * Piramit (akıcı / hızlı okuma) satırı.
   * Gerçek sınıf piramidi = ELMAS: üstte çekirdek → dorukta en uzun → altta ayna.
   * Her basamakta tek sözcük eklenir/çıkar; çekirdek (nesne+eylem) tekrarlanır.
   */
  function pyramidLineWords(text) {
    text = String(text || "").trim().replace(/[.!?]+$/g, "");
    if (!text) return null;
    var tokens = text.split(/\s+/).filter(Boolean);
    if (!tokens.length) return null;
    var words = parsePhraseTokens(tokens);
    return words.length ? words : null;
  }

  /** Yalnız yükselen basamaklar → tam elmas (doruk 1 kez; aşağı ayna). 6 basamak → 11 satır. */
  function pyramidDiamond(ascLines) {
    var asc = (ascLines || [])
      .map(function (t) {
        return String(t || "").trim();
      })
      .filter(Boolean);
    if (asc.length < 5) return asc;
    return asc.concat(asc.slice(0, -1).reverse());
  }

  function pyramidFusion(entry, opts) {
    opts = opts || {};
    if (!entry || typeof entry !== "object") return null;
    var title = String(entry.title || "").trim();
    var rawLines = entry.lines || [];
    if (entry.asc && entry.asc.length) rawLines = pyramidDiamond(entry.asc);
    if (!title || !rawLines.length) return null;
    var lines = [];
    for (var i = 0; i < rawLines.length; i++) {
      var words = pyramidLineWords(rawLines[i]);
      if (!words || !words.length) continue;
      lines.push({
        text: words
          .map(function (w) {
            return w.text;
          })
          .join(" "),
        words: words
      });
    }
    if (lines.length < 9) return null;
    var slug = String(entry.id || ("piramit_" + title))
      .toLocaleLowerCase("tr-TR")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9çğıöşü_]/gi, "");
    return {
      id: slug,
      type: "piramit",
      kind: "piramit",
      mode: "pyramid",
      title: title,
      result: title,
      label: opts.label || lines.length + " satır",
      lines: lines,
      narration:
        opts.narration ||
        "Yukarıdan aşağı oku. Ortaya kadar uzar, sonra kısalır. Aynı çekirdeği tekrar et.",
      celebrate: opts.celebrate || ("Harika! “" + title + "” piramidini okudun!")
    };
  }

  function pyramidLettersOk(fusion, allowed) {
    if (!fusion || !fusion.lines || !fusion.lines.length) return false;
    for (var i = 0; i < fusion.lines.length; i++) {
      var words = fusion.lines[i].words || [];
      for (var j = 0; j < words.length; j++) {
        if (!wordLettersOk(words[j].say, allowed)) return false;
      }
    }
    return true;
  }

  /**
   * Piramit metinler — sınıf pratiği / Maarif ses sırası (o→z, grup 2–3).
   * Biçim: elmas (9–11 satır). Mantık: çekirdek tekrar + her satırda tek sözcük.
   * Örnek kalıp: Nesne → Nesne eylem → Özne … → yer/sayı/sıfat doruk → ayna.
   * Yasak: ve / bir / bu. Yalnız o ana kadar öğrenilen harfler.
   */
  var PYRAMID_BANK = {
    "o": [
      {
        id: "piramit_o_oto",
        title: "Oto",
        asc: ["oto","oto al","Ali oto al","Lale, Ali oto al","Ata, Lale, Ali oto al","anne, Ata, Lale, Ali oto al"]
      },
      {
        id: "piramit_o_not",
        title: "Not",
        asc: ["not","not al","Ali not al","Lale, Ali not al","Ata, Lale, Ali not al","anne, Ata, Lale, Ali not al"]
      },
      {
        id: "piramit_o_olta",
        title: "Olta",
        asc: ["olta","olta al","Ata olta al","Ali, Ata olta al","Lale, Ali, Ata olta al","anne, Lale, Ali, Ata olta al"]
      },
      {
        id: "piramit_o_ele",
        title: "El ele",
        asc: ["el","el ele","Ali el ele","Lale, Ali el ele","anne, Lale, Ali el ele","Ata, anne, Lale, Ali el ele"]
      }
    ],
    "k": [
      {
        id: "piramit_k_kek",
        title: "Kek",
        asc: ["kek","kek tat","Ali kek tat","Lale, Ali kek tat","Ata, Lale, Ali kek tat","anne, Ata, Lale, Ali kek tat"]
      },
      {
        id: "piramit_k_toka",
        title: "Toka",
        asc: ["toka","toka tak","Lale toka tak","Lale iki toka tak","anne, Lale iki toka tak","Ali, anne, Lale iki toka tak"]
      },
      {
        id: "piramit_k_kola",
        title: "Kola",
        asc: ["kola","kola al","Ali kola al","Ali iki kola al","Lale, Ali iki kola al","Ata, Lale, Ali iki kola al"]
      },
      {
        id: "piramit_k_elek",
        title: "Elek",
        asc: ["elek","elek al","anne elek al","Lale, anne elek al","Ali, Lale, anne elek al","Ata, Ali, Lale, anne elek al"]
      }
    ],
    "u": [
      {
        id: "piramit_u_kutu",
        title: "Kutu",
        asc: ["kutu","kutu al","Ali kutu al","Ali iki kutu al","Lale, Ali iki kutu al","Ata, Lale, Ali iki kutu al"]
      },
      {
        id: "piramit_u_un",
        title: "Un",
        asc: ["un","un al","anne un al","anne, Ali un al","Lale, anne, Ali un al","Ata, Lale, anne, Ali un al"]
      },
      {
        id: "piramit_u_kukla",
        title: "Kukla",
        asc: ["kukla","kukla al","Lale kukla al","Lale iki kukla al","Ali, Lale iki kukla al","anne, Ali, Lale iki kukla al"]
      },
      {
        id: "piramit_u_koku",
        title: "Koku",
        asc: ["koku","koku al","Ali koku al","Lale, Ali koku al","anne, Lale, Ali koku al","Ata, anne, Lale, Ali koku al"]
      }
    ],
    "r": [
      {
        id: "piramit_r_nar",
        title: "Nar",
        asc: ["nar","nar al","Ali nar al","Ali iri nar al","Lale, Ali iri nar al","Ata, Lale, Ali iri nar al"]
      },
      {
        id: "piramit_r_erik",
        title: "Erik",
        asc: ["erik","erik al","Lale erik al","Lale iri erik al","Ali, Lale iri erik al","Ata, Ali, Lale iri erik al"]
      },
      {
        id: "piramit_r_kart",
        title: "Kart",
        asc: ["kart","kart al","Ali kart al","Ali iki kart al","Lale, Ali iki kart al","anne, Lale, Ali iki kart al"]
      },
      {
        id: "piramit_r_roket",
        title: "Roket",
        asc: ["roket","roket al","Ata roket al","Ali, Ata roket al","Lale, Ali, Ata roket al","anne, Lale, Ali, Ata roket al"]
      }
    ],
    "ı": [
      {
        id: "piramit_i_nalin",
        title: "Nalın",
        asc: ["nalın","nalın al","anne nalın al","anne kalın nalın al","Lale, anne kalın nalın al","Ali, Lale, anne kalın nalın al"]
      },
      {
        id: "piramit_i_ari",
        title: "Arı",
        asc: ["arı","arı ara","Ali arı ara","Ali iri arı ara","Lale, Ali iri arı ara","Ata, Lale, Ali iri arı ara"]
      },
      {
        id: "piramit_i_kirik",
        title: "Kırık",
        asc: ["kırık","kırık ara","Ali kırık ara","Lale, Ali kırık ara","anne, Lale, Ali kırık ara","Ata, anne, Lale, Ali kırık ara"]
      },
      {
        id: "piramit_i_karti",
        title: "Kartı",
        asc: ["kartı","kartı al","Ali kartı al","Lale, Ali kartı al","anne, Lale, Ali kartı al","Ata, anne, Lale, Ali kartı al"]
      }
    ],
    "m": [
      {
        id: "piramit_m_elma",
        title: "Elma",
        asc: ["elma","elma al","Ali elma al","Ali iri elma al","Lale, Ali iri elma al","Ata, Lale, Ali iri elma al"]
      },
      {
        id: "piramit_m_kalem",
        title: "Kalem",
        asc: ["kalem","kalem al","Lale kalem al","Lale minik kalem al","Ali, Lale minik kalem al","anne, Ali, Lale minik kalem al"]
      },
      {
        id: "piramit_m_ekmek",
        title: "Ekmek",
        asc: ["ekmek","ekmek al","anne ekmek al","Ali, anne ekmek al","Lale, Ali, anne ekmek al","Ata, Lale, Ali, anne ekmek al"]
      },
      {
        id: "piramit_m_limon",
        title: "Limon",
        asc: ["limon","limon al","Ali limon al","Ali iri limon al","Lale, Ali iri limon al","Ata, Lale, Ali iri limon al"]
      }
    ],
    "ü": [
      {
        id: "piramit_u_umit",
        title: "Ümit",
        asc: ["Ümit", "Ümit ütü", "Ümit ütü al", "Ümit telli ütü al", "Ümit iki telli ütü al"]
      },
      {
        id: "piramit_u_ulku",
        title: "Ülkü",
        asc: ["Ülkü", "Ülkü tül", "Ülkü tül tak", "Ülkü mor tül tak", "Ülkü telli mor tül tak"]
      },
      {
        id: "piramit_u_unal",
        title: "Ünal",
        asc: ["Ünal", "Ünal it", "Ünal kütük it", "Ünal kuru kütük it", "Ünal ormana kuru kütük it"]
      },
      {
        id: "piramit_u_tulin",
        title: "Tülin",
        asc: ["Tülin", "Tülin al", "Tülin kürk al", "Tülin kalın kürk al", "Tülin kaliteli kalın kürk al"]
      },
      {
        id: "piramit_u_ilker",
        title: "İlker",
        asc: ["İlker", "İlker oku", "İlker türkü oku", "İlker mutlu türkü oku", "İlker koro ile türkü oku"]
      },
      {
        id: "piramit_u_umut",
        title: "Umut",
        asc: ["Umut", "Umut in", "Umut tünele in", "Umut karanlık tünele in", "Umut motorla karanlık tünele in"]
      }
    ],
    "s": [
      {
        id: "piramit_s_suna",
        title: "Suna",
        asc: ["Suna", "Suna al", "Suna su al", "Suna serin su al", "Suna testine serin su al"]
      },
      {
        id: "piramit_s_sinan",
        title: "Sinan",
        asc: ["Sinan", "Sinan sat", "Sinan simit sat", "Sinan susamlı simit sat", "Sinan sokakta susamlı simit sat"]
      },
      {
        id: "piramit_s_asli",
        title: "Aslı",
        asc: ["Aslı", "Aslı as", "Aslı süs as", "Aslı sarı süs as", "Aslı salona sarı süs as"]
      },
      {
        id: "piramit_s_selim",
        title: "Selim",
        asc: ["Selim", "Selim sil", "Selim masa sil", "Selim sarı masa sil", "Selim ıslak sarı masa sil"]
      },
      {
        id: "piramit_s_osman",
        title: "Osman",
        asc: ["Osman", "Osman al", "Osman saksı al", "Osman sarı saksı al", "Osman okula sarı saksı al"]
      },
      {
        id: "piramit_s_sultan",
        title: "Sultan",
        asc: ["Sultan", "Sultan mısır", "Sultan mısır tat", "Sultan sarı mısır tat", "Sultan sulu sarı mısır tat"]
      }
    ],
    "ö": [
      {
        id: "piramit_o_omer",
        title: "Ömer",
        asc: ["Ömer", "Ömer tak", "Ömer önlük tak", "Ömer ütülü önlük tak", "Ömer sarı ütülü önlük tak"]
      },
      {
        id: "piramit_o_oner",
        title: "Öner",
        asc: ["Öner", "Öner ör", "Öner atkı ör", "Öner kalın atkı ör", "Öner sarı kalın atkı ör"]
      },
      {
        id: "piramit_o_omer_onlem",
        title: "Önlem",
        asc: ["Ömer", "Ömer al", "Ömer önlem al", "Ömer sel önlemi al", "Ömer erken sel önlemi al"]
      },
      {
        id: "piramit_o_omur",
        title: "Ömür",
        asc: ["Ömür", "Ömür at", "Ömür kömür at", "Ömür isli kömür at", "Ömür kutulara isli kömür at"]
      },
      {
        id: "piramit_o_onal",
        title: "Önal",
        asc: ["Önal", "Önal ört", "Önal örtü ört", "Önal masana örtü ört", "Önal masana sarı örtü ört"]
      },
      {
        id: "piramit_o_omur_kutlu",
        title: "Kutlu",
        asc: ["Ömür", "Ömür kutlu", "Ömer ömür kutlu", "Ömer ulu ömür kutlu", "Ömer sana ulu ömür kutlu"]
      }
    ],
    "y": [
      {
        id: "piramit_y_ayla",
        title: "Ayla",
        asc: ["Ayla", "Ayla al", "Ayla yay al", "Ayla yeni yay al", "Ayla sarı yeni yay al"]
      },
      {
        id: "piramit_y_oya",
        title: "Oya",
        asc: ["Oya", "Oya sil", "Oya ayna sil", "Oya sarı ayna sil", "Oya ıslak sarı ayna sil"]
      },
      {
        id: "piramit_y_kaya",
        title: "Kaya",
        asc: ["Kaya", "Kaya tak", "Kaya yaka tak", "Kaya sarı yaka tak", "Kaya ütülü sarı yaka tak"]
      },
      {
        id: "piramit_y_yaman",
        title: "Yaman",
        asc: ["Yaman", "Yaman al", "Yaman yelek al", "Yaman tüylü yelek al", "Yaman sarı tüylü yelek al"]
      },
      {
        id: "piramit_y_yasin",
        title: "Yasin",
        asc: ["Yasin", "Yasin al", "Yasin yastık al", "Yasin sarı yastık al", "Yasin tüylü sarı yastık al"]
      },
      {
        id: "piramit_y_aykut",
        title: "Aykut",
        asc: ["Aykut", "Aykut yut", "Aykut ayran yut", "Aykut serin ayran yut", "Aykut yayık serin ayran yut"]
      }
    ],
    "d": [
      {
        id: "piramit_d_arda",
        title: "Arda",
        asc: ["Arda", "Arda öttür", "Arda düdük öttür", "Arda yeni düdük öttür", "Arda sarı yeni düdük öttür"]
      },
      {
        id: "piramit_d_eda",
        title: "Eda",
        asc: ["Eda", "Eda al", "Eda kedi al", "Eda sokaktan kedi al", "Eda sokaktan sarı kedi al"]
      },
      {
        id: "piramit_d_didem",
        title: "Didem",
        asc: ["Didem", "Didem ye", "Didem dut ye", "Didem tatlı dut ye", "Didem sarı tatlı dut ye"]
      },
      {
        id: "piramit_d_derya",
        title: "Derya",
        asc: ["Derya", "Derya ye", "Derya dondurma ye", "Derya naneli dondurma ye", "Derya tatlı naneli dondurma ye"]
      },
      {
        id: "piramit_d_damla",
        title: "Damla",
        asc: ["Damla", "Damla dal", "Damla dereye dal", "Damla derin dereye dal", "Damla serin derin dereye dal"]
      },
      {
        id: "piramit_d_dursun",
        title: "Dursun",
        asc: ["Dursun", "Dursun kır", "Dursun odun kır", "Dursun ormanda odun kır", "Dursun ormanda kuru odun kır"]
      }
    ],
    "z": [
      {
        id: "piramit_z_zeki",
        title: "Zeki",
        asc: ["Zeki", "Zeki al", "Zeki zil al", "Zeki sarı zil al", "Zeki eline sarı zil al"]
      },
      {
        id: "piramit_z_ziya",
        title: "Ziya",
        asc: ["Ziya", "Ziya ye", "Ziya zeytin ye", "Ziya tuzlu zeytin ye", "Ziya taze tuzlu zeytin ye"]
      },
      {
        id: "piramit_z_azra",
        title: "Azra",
        asc: ["Azra", "Azra al", "Azra kiraz al", "Azra taze kiraz al", "Azra sulu taze kiraz al"]
      },
      {
        id: "piramit_z_zerrin",
        title: "Zerrin",
        asc: ["Zerrin", "Zerrin tak", "Zerrin yüzük tak", "Zerrin sarı yüzük tak", "Zerrin eline sarı yüzük tak"]
      },
      {
        id: "piramit_z_ozan",
        title: "Ozan",
        asc: ["Ozan", "Ozan al", "Ozan saz al", "Ozan telli saz al", "Ozan uzun telli saz al"]
      },
      {
        id: "piramit_z_zekiye",
        title: "Zekiye",
        asc: ["Zekiye", "Zekiye dinle", "Zekiye müzik dinle", "Zekiye odada müzik dinle", "Zekiye odada sesli müzik dinle"]
      }
    ],
    "ç": [
      {
        id: "piramit_ç_cetin",
        title: "Çetin",
        asc: ["Çetin", "Çetin iç", "Çetin çay iç", "Çetin demli çay iç", "Çetin taze demli çay iç", "Çetin taze demli çayı iç"]
      },
      {
        id: "piramit_ç_ayca",
        title: "Ayça",
        asc: ["Ayça", "Ayça uçur", "Ayça uçurtma uçur", "Ayça telli uçurtma uçur", "Ayça çatıda telli uçurtma uçur", "Ayça ulu çatıda telli uçurtma uçur"]
      },
      {
        id: "piramit_ç_selcuk",
        title: "Selçuk",
        asc: ["Selçuk", "Selçuk seç", "Selçuk çilek seç", "Selçuk tatlı çilek seç", "Selçuk iri tatlı çilek seç", "Selçuk kırmızı iri tatlı çilek seç"]
      },
      {
        id: "piramit_ç_secil",
        title: "Seçil",
        asc: ["Seçil", "Seçil tak", "Seçil taç tak", "Seçil sarı taç tak", "Seçil telli sarı taç tak", "Seçil süslü telli sarı taç tak"]
      },
      {
        id: "piramit_ç_orcun",
        title: "Orçun",
        asc: ["Orçun", "Orçun sula", "Orçun çimen sula", "Orçun kuru çimen sula", "Orçun tarlada kuru çimen sula", "Orçun tarlada kuru çimeni sula"]
      },
      {
        id: "piramit_ç_tunc",
        title: "Tunç",
        asc: ["Tunç", "Tunç tara", "Tunç saç tara", "Tunç ıslak saç tara", "Tunç tarakla ıslak saç tara", "Tunç sarı tarakla ıslak saç tara"]
      },
      {
        id: "piramit_ç_cetin_cekic",
        title: "Çetin",
        asc: ["Çetin", "Çetin al", "Çetin çekiç al", "Çetin demir çekiç al", "Çetin kalın demir çekiç al", "Çetin ulu kalın demir çekiç al"]
      }
    ],
    "b": [
      {
        id: "piramit_b_burak",
        title: "Burak",
        asc: ["Burak", "Burak bak", "Burak balıklara bak", "Burak suda balıklara bak", "Burak serin suda balıklara bak", "Burak serin suda iri balıklara bak"]
      },
      {
        id: "piramit_b_berna",
        title: "Berna",
        asc: ["Berna", "Berna ye", "Berna börek ye", "Berna etli börek ye", "Berna tabakta etli börek ye", "Berna masada tabakta etli börek ye"]
      },
      {
        id: "piramit_b_bora",
        title: "Bora",
        asc: ["Bora", "Bora al", "Bora balon al", "Bora sarı balon al", "Bora bakkaldan sarı balon al", "Bora bakkaldan telli sarı balon al"]
      },
      {
        id: "piramit_b_batu",
        title: "Batu",
        asc: ["Batu", "Batu bin", "Batu bota bin", "Batu sarı bota bin", "Batu derede sarı bota bin", "Batu serin derede sarı bota bin"]
      },
      {
        id: "piramit_b_betul",
        title: "Betül",
        asc: ["Betül", "Betül boya", "Betül kutuyu boya", "Betül büyük kutuyu boya", "Betül büyük kutuyu mor boya", "Betül odada büyük kutuyu mor boya"]
      },
      {
        id: "piramit_b_banu",
        title: "Banu",
        asc: ["Banu", "Banu sil", "Banu bardakları sil", "Banu kirli bardakları sil", "Banu masadaki kirli bardakları sil", "Banu masadaki ıslak kirli bardakları sil"]
      },
      {
        id: "piramit_b_bulent",
        title: "Bülent",
        asc: ["Bülent", "Bülent bul", "Bülent bilye bul", "Bülent demir bilye bul", "Bülent kumda demir bilye bul", "Bülent sarı kumda demir bilye bul"]
      }
    ],
    "g": [
      {
        id: "piramit_g_gamze",
        title: "Gamze",
        asc: ["Gamze", "Gamze tak", "Gamze gözlük tak", "Gamze sarı gözlük tak", "Gamze odada sarı gözlük tak", "Gamze aydınlık odada sarı gözlük tak"]
      },
      {
        id: "piramit_g_tolga",
        title: "Tolga",
        asc: ["Tolga", "Tolga bak", "Tolga gemiye bak", "Tolga büyük gemiye bak", "Tolga denizde büyük gemiye bak", "Tolga engin denizde büyük gemiye bak"]
      },
      {
        id: "piramit_g_gul",
        title: "Gül",
        asc: ["Gül", "Gül oku", "Gül gazete oku", "Gül uzun gazete oku", "Gül balkonda uzun gazete oku", "Gül serin balkonda uzun gazete oku"]
      },
      {
        id: "piramit_g_gizem",
        title: "Gizem",
        asc: ["Gizem", "Gizem çal", "Gizem gitar çal", "Gizem güzel gitar çal", "Gizem odada güzel gitar çal", "Gizem büyük odada güzel gitar çal"]
      },
      {
        id: "piramit_g_gaye",
        title: "Gaye",
        asc: ["Gaye", "Gaye gez", "Gaye gölde gez", "Gaye durgun gölde gez", "Gaye kayıkla durgun gölde gez", "Gaye büyük kayıkla durgun gölde gez"]
      },
      {
        id: "piramit_g_gursel",
        title: "Gürsel",
        asc: ["Gürsel", "Gürsel al", "Gürsel silgi al", "Gürsel kokulu silgi al", "Gürsel bakkaldan kokulu silgi al", "Gürsel bakkaldan büyük kokulu silgi al"]
      },
      {
        id: "piramit_g_gurkan",
        title: "Gürkan",
        asc: ["Gürkan", "Gürkan git", "Gürkan geziye git", "Gürkan arabayla geziye git", "Gürkan büyük arabayla geziye git", "Gürkan kalabalık büyük arabayla geziye git"]
      }
    ],
    "c": [
      {
        id: "piramit_c_cem",
        title: "Cem",
        asc: ["Cem", "Cem al", "Cem incir al", "Cem taze incir al", "Cem bakkaldan taze incir al", "Cem bakkaldan on taze incir al"]
      },
      {
        id: "piramit_c_can",
        title: "Can",
        asc: ["Can", "Can giy", "Can ceket giy", "Can yeni ceket giy", "Can yakalı yeni ceket giy", "Can sarı yakalı yeni ceket giy"]
      },
      {
        id: "piramit_c_ceren",
        title: "Ceren",
        asc: ["Ceren", "Ceren sil", "Ceren camı sil", "Ceren kirli camı sil", "Ceren odadaki kirli camı sil", "Ceren bezi al kirli camı sil"]
      },
      {
        id: "piramit_c_ceyhun",
        title: "Ceyhun",
        skipLetterCheck: true,
        asc: ["Ceyhun", "Ceyhun bul", "Ceyhun cüce bul", "Ceyhun ormanda cüce bul", "Ceyhun ormanda tatlı cüce bul", "Ceyhun derin ormanda tatlı cüce bul"]
      },
      {
        id: "piramit_c_ceyda",
        title: "Ceyda",
        asc: ["Ceyda", "Ceyda yak", "Ceyda ocak yak", "Ceyda odada ocak yak", "Ceyda büyük odada ocak yak", "Ceyda serin büyük odada ocak yak"]
      },
      {
        id: "piramit_c_candan",
        title: "Candan",
        asc: ["Candan", "Candan aç", "Candan tencere aç", "Candan sıcak tencere aç", "Candan ocaktaki sıcak tencere aç", "Candan ocaktaki koca sıcak tencere aç"]
      },
      {
        id: "piramit_c_cengiz",
        title: "Cengiz",
        asc: ["Cengiz", "Cengiz izle", "Cengiz karıncayı izle", "Cengiz yerdeki karıncayı izle", "Cengiz yerdeki küçük karıncayı izle", "Cengiz yerdeki küçük sarı karıncayı izle"]
      }
    ],
    "ş": [
      {
        id: "piramit_ş_saban",
        title: "Şaban",
        asc: ["Şaban", "Şaban ye", "Şaban şeker ye", "Şaban tatlı şeker ye", "Şaban bakkaldan tatlı şeker ye", "Şaban bakkaldan alınan tatlı şeker ye"]
      },
      {
        id: "piramit_ş_sermin",
        title: "Şermin",
        asc: ["Şermin", "Şermin al", "Şermin şişe al", "Şermin cam şişe al", "Şermin masadan cam şişe al", "Şermin masadan yeşil cam şişe al"]
      },
      {
        id: "piramit_ş_senol",
        title: "Şenol",
        asc: ["Şenol", "Şenol iç", "Şenol şerbet iç", "Şenol tatlı şerbet iç", "Şenol bardakla tatlı şerbet iç", "Şenol büyük bardakla tatlı şerbet iç"]
      },
      {
        id: "piramit_ş_senay",
        title: "Şenay",
        asc: ["Şenay", "Şenay oku", "Şenay şiir oku", "Şenay güzel şiir oku", "Şenay okulda güzel şiir oku", "Şenay okulda coşkulu güzel şiir oku"]
      },
      {
        id: "piramit_ş_sukru",
        title: "Şükrü",
        asc: ["Şükrü", "Şükrü at", "Şükrü taş at", "Şükrü suya taş at", "Şükrü göldeki suya taş at", "Şükrü göldeki serin suya taş at"]
      },
      {
        id: "piramit_ş_sule",
        title: "Şule",
        asc: ["Şule", "Şule tut", "Şule kuş tut", "Şule minik kuş tut", "Şule daldaki minik kuşu tut", "Şule yeşil daldaki minik kuşu tut"]
      },
      {
        id: "piramit_ş_sakir",
        title: "Şakir",
        asc: ["Şakir", "Şakir al", "Şakir kaşık al", "Şakir demir kaşık al", "Şakir büyük demir kaşık al", "Şakir masadan büyük demir kaşık al"]
      }
    ]
,
    "p": [
      {
        id: "piramit_p_polat",
        title: "Polat",
        skipLetterCheck: true,
        asc: ["Polat", "Polat ye", "Polat peynir ye", "Polat taze peynir ye", "Polat tabakta taze peynir ye", "Polat masada tabakta taze peynir ye", "Polat sarı masada tabakta taze peynir ye"]
      },
      {
        id: "piramit_p_pelin",
        title: "Pelin",
        skipLetterCheck: true,
        asc: ["Pelin", "Pelin giy", "Pelin palto giy", "Pelin kalın palto giy", "Pelin pembe kalın palto giy", "Pelin kışın pembe kalın palto giy", "Pelin karda kışın pembe kalın palto giy"]
      },
      {
        id: "piramit_p_alper",
        title: "Alper",
        skipLetterCheck: true,
        asc: ["Alper", "Alper al", "Alper pusula al", "Alper yeni pusula al", "Alper sarı yeni pusula al", "Alper dükkandan sarı yeni pusula al", "Alper koca dükkandan sarı yeni pusula al"]
      },
      {
        id: "piramit_p_pinar",
        title: "Pınar",
        skipLetterCheck: true,
        asc: ["Pınar", "Pınar soy", "Pınar patates soy", "Pınar taze patates soy", "Pınar tabakta taze patates soy", "Pınar masada tabakta taze patates soy", "Pınar büyük masada tabakta taze patates soy"]
      },
      {
        id: "piramit_p_toprak",
        title: "Toprak",
        skipLetterCheck: true,
        asc: ["Toprak", "Toprak taşı", "Toprak paket taşı", "Toprak büyük paket taşı", "Toprak postadan büyük paket taşı", "Toprak postadan sarı büyük paket taşı", "Toprak postadan iki sarı büyük paket taşı"]
      },
      {
        id: "piramit_p_serpil",
        title: "Serpil",
        skipLetterCheck: true,
        asc: ["Serpil", "Serpil kes", "Serpil pırasa kes", "Serpil uzun pırasa kes", "Serpil masada uzun pırasa kes", "Serpil temiz masada uzun pırasa kes", "Serpil odada temiz masada uzun pırasa kes"]
      },
      {
        id: "piramit_p_poyraz",
        title: "Poyraz",
        skipLetterCheck: true,
        asc: ["Poyraz", "Poyraz bul", "Poyraz panda bul", "Poyraz tatlı panda bul", "Poyraz parkta tatlı panda bul", "Poyraz büyük parkta tatlı panda bul", "Poyraz yeşil büyük parkta tatlı panda bul"]
      }
    ],
    "h": [
      {
        id: "piramit_h_hasan",
        title: "Hasan",
        skipLetterCheck: true,
        asc: ["Hasan", "Hasan iç", "Hasan ıhlamur iç", "Hasan sıcak ıhlamur iç", "Hasan hastayken sıcak ıhlamur iç", "Hasan kışın hastayken sıcak ıhlamur iç", "Hasan serin kışın hastayken sıcak ıhlamur iç"]
      },
      {
        id: "piramit_h_hande",
        title: "Hande",
        skipLetterCheck: true,
        asc: ["Hande", "Hande as", "Hande halı as", "Hande kalın halı as", "Hande balkona kalın halı as", "Hande temiz balkona kalın halı as", "Hande ipe temiz balkona kalın halı as"]
      },
      {
        id: "piramit_h_hakan",
        title: "Hakan",
        skipLetterCheck: true,
        asc: ["Hakan", "Hakan al", "Hakan horoz al", "Hakan çilli horoz al", "Hakan pazardan çilli horoz al", "Hakan büyük pazardan çilli horoz al", "Hakan çok büyük pazardan çilli horoz al"]
      },
      {
        id: "piramit_h_hale",
        title: "Hale",
        skipLetterCheck: true,
        asc: ["Hale", "Hale aç", "Hale hediye aç", "Hale büyük hediye aç", "Hale paketteki büyük hediye aç", "Hale süslü paketteki büyük hediye aç", "Hale sarı süslü paketteki büyük hediye aç"]
      },
      {
        id: "piramit_h_halil",
        title: "Halil",
        skipLetterCheck: true,
        asc: ["Halil", "Halil bul", "Halil harita bul", "Halil eski harita bul", "Halil odada eski harita bul", "Halil büyük odada eski harita bul", "Halil dolapta büyük odada eski harita bul"]
      },
      {
        id: "piramit_h_hira",
        title: "Hira",
        skipLetterCheck: true,
        asc: ["Hira", "Hira giy", "Hira hırka giy", "Hira kalın hırka giy", "Hira kışın kalın hırka giy", "Hira kışın kırmızı kalın hırka giy", "Hira ayaz kışın kırmızı kalın hırka giy"]
      },
      {
        id: "piramit_h_hamza",
        title: "Hamza",
        skipLetterCheck: true,
        asc: ["Hamza", "Hamza oku", "Hamza hikaye oku", "Hamza uzun hikaye oku", "Hamza resimli uzun hikaye oku", "Hamza odada resimli uzun hikaye oku", "Hamza odada tatlı resimli uzun hikaye oku"]
      }
    ],
    "v": [
      {
        id: "piramit_v_veli",
        title: "Veli",
        skipLetterCheck: true,
        asc: ["Veli", "Veli izle", "Veli vapur izle", "Veli büyük vapur izle", "Veli denizde büyük vapur izle", "Veli engin denizde büyük vapur izle", "Veli mavi engin denizde büyük vapur izle"]
      },
      {
        id: "piramit_v_vedat",
        title: "Vedat",
        skipLetterCheck: true,
        asc: ["Vedat", "Vedat al", "Vedat vazo al", "Vedat cam vazo al", "Vedat masaya cam vazo al", "Vedat masaya süslü cam vazo al", "Vedat masaya sarı süslü cam vazo al"]
      },
      {
        id: "piramit_v_sevgi",
        title: "Sevgi",
        skipLetterCheck: true,
        asc: ["Sevgi", "Sevgi ye", "Sevgi vişne ye", "Sevgi sulu vişne ye", "Sevgi taze sulu vişne ye", "Sevgi tabakta taze sulu vişne ye", "Sevgi tabakta kırmızı taze sulu vişne ye"]
      },
      {
        id: "piramit_v_volkan",
        title: "Volkan",
        skipLetterCheck: true,
        asc: ["Volkan", "Volkan taşı", "Volkan valiz taşı", "Volkan koca valiz taşı", "Volkan tekerli koca valiz taşı", "Volkan yolda tekerli koca valiz taşı", "Volkan uzun yolda tekerli koca valiz taşı"]
      },
      {
        id: "piramit_v_merve",
        title: "Merve",
        skipLetterCheck: true,
        asc: ["Merve", "Merve sık", "Merve vida sık", "Merve uzun vida sık", "Merve tahtaya uzun vida sık", "Merve masada tahtaya uzun vida sık", "Merve usta masada tahtaya uzun vida sık"]
      },
      {
        id: "piramit_v_vildan",
        title: "Vildan",
        skipLetterCheck: true,
        asc: ["Vildan", "Vildan katla", "Vildan havlu katla", "Vildan büyük havlu katla", "Vildan büyük mavi havlu katla", "Vildan dolaba büyük mavi havlu katla", "Vildan dolaba ütülü büyük mavi havlu katla"]
      },
      {
        id: "piramit_v_veysel",
        title: "Veysel",
        skipLetterCheck: true,
        asc: ["Veysel", "Veysel sev", "Veysel tavşan sev", "Veysel beyaz tavşan sev", "Veysel kırda beyaz tavşan sev", "Veysel yeşil kırda beyaz tavşan sev", "Veysel yeşil kırda sevimli beyaz tavşan sev"]
      }
    ],
    "ğ": [
      {
        id: "piramit_ğ_ugur",
        title: "Uğur",
        skipLetterCheck: true,
        asc: ["Uğur", "Uğur tırman", "Uğur dağa tırman", "Uğur yüksek dağa tırman", "Uğur karlı yüksek dağa tırman", "Uğur kışın karlı yüksek dağa tırman", "Uğur kışın soğuk karlı yüksek dağa tırman"]
      },
      {
        id: "piramit_ğ_cagla",
        title: "Çağla",
        skipLetterCheck: true,
        asc: ["Çağla", "Çağla dik", "Çağla ağaç dik", "Çağla yeşil ağaç dik", "Çağla bahçeye yeşil ağaç dik", "Çağla büyük bahçeye yeşil ağaç dik", "Çağla okula büyük bahçeye yeşil ağaç dik"]
      },
      {
        id: "piramit_ğ_yigit",
        title: "Yiğit",
        skipLetterCheck: true,
        asc: ["Yiğit", "Yiğit ye", "Yiğit soğan ye", "Yiğit taze soğan ye", "Yiğit yemekte taze soğan ye", "Yiğit akşam yemekte taze soğan ye", "Yiğit masada akşam yemekte taze soğan ye"]
      },
      {
        id: "piramit_ğ_yagiz",
        title: "Yağız",
        skipLetterCheck: true,
        asc: ["Yağız", "Yağız izle", "Yağız yağmur izle", "Yağız yağan yağmuru izle", "Yağız cama yağan yağmuru izle", "Yağız odadan cama yağan yağmuru izle", "Yağız sıcak odadan cama yağan yağmuru izle"]
      },
      {
        id: "piramit_ğ_tugce",
        title: "Tuğçe",
        skipLetterCheck: true,
        asc: ["Tuğçe", "Tuğçe al", "Tuğçe iğne al", "Tuğçe sivri iğne al", "Tuğçe kutudan sivri iğne al", "Tuğçe dikiş kutusundan sivri iğne al", "Tuğçe odada dikiş kutusundan sivri iğne al"]
      },
      {
        id: "piramit_ğ_oguz",
        title: "Oğuz",
        skipLetterCheck: true,
        asc: ["Oğuz", "Oğuz katla", "Oğuz kağıt katla", "Oğuz beyaz kağıt katla", "Oğuz masada beyaz kağıt katla", "Oğuz temiz masada beyaz kağıt katla", "Oğuz okulda temiz masada beyaz kağıt katla"]
      },
      {
        id: "piramit_ğ_doga",
        title: "Doğa",
        skipLetterCheck: true,
        asc: ["Doğa", "Doğa tut", "Doğa kurbağa tut", "Doğa yeşil kurbağa tut", "Doğa derede yeşil kurbağa tut", "Doğa serin derede yeşil kurbağa tut", "Doğa ormanda serin derede yeşil kurbağa tut"]
      }
    ],
    "f": [
      {
        id: "piramit_f_fatih",
        title: "Fatih",
        skipLetterCheck: true,
        asc: ["Fatih", "Fatih ye", "Fatih fındık ye", "Fatih taze fındık ye", "Fatih tabaktan taze fındık ye", "Fatih tabaktan kavrulmuş taze fındık ye", "Fatih odada tabaktan kavrulmuş taze fındık ye"]
      },
      {
        id: "piramit_f_elif",
        title: "Elif",
        skipLetterCheck: true,
        asc: ["Elif", "Elif dik", "Elif fidan dik", "Elif çam fidanı dik", "Elif ormana çam fidanı dik", "Elif geniş ormana çam fidanı dik", "Elif okula geniş ormana çam fidanı dik"]
      },
      {
        id: "piramit_f_funda",
        title: "Funda",
        skipLetterCheck: true,
        asc: ["Funda", "Funda bin", "Funda faytona bin", "Funda süslü faytona bin", "Funda adada süslü faytona bin", "Funda adada atlı süslü faytona bin", "Funda güzel adada atlı süslü faytona bin"]
      },
      {
        id: "piramit_f_efe",
        title: "Efe",
        skipLetterCheck: true,
        asc: ["Efe", "Efe çal", "Efe flüt çal", "Efe yeni flüt çal", "Efe odada yeni flüt çal", "Efe odada beyaz yeni flüt çal", "Efe masada odada beyaz yeni flüt çal"]
      },
      {
        id: "piramit_f_furkan",
        title: "Furkan",
        skipLetterCheck: true,
        asc: ["Furkan", "Furkan izle", "Furkan fil izle", "Furkan büyük fil izle", "Furkan ormanda büyük fil izle", "Furkan ormanda boz büyük fil izle", "Furkan sıcak ormanda boz büyük fil izle"]
      },
      {
        id: "piramit_f_defne",
        title: "Defne",
        skipLetterCheck: true,
        asc: ["Defne", "Defne git", "Defne fırına git", "Defne sabah fırına git", "Defne sabah sıcak fırına git", "Defne sabah sıcak ekmek fırınına git", "Defne yoldan sabah sıcak ekmek fırınına git"]
      },
      {
        id: "piramit_f_fikret",
        title: "Fikret",
        skipLetterCheck: true,
        asc: ["Fikret", "Fikret tut", "Fikret fare tut", "Fikret minik fare tut", "Fikret kilerde minik fare tut", "Fikret kilerde gri minik fare tut", "Fikret karanlık kilerde gri minik fare tut"]
      }
    ],
    "j": [
      {
        id: "piramit_j_jale",
        title: "Jale",
        skipLetterCheck: true,
        asc: ["Jale", "Jale giy", "Jale pijama giy", "Jale çizgili pijama giy", "Jale odada çizgili pijama giy", "Jale odada temiz çizgili pijama giy", "Jale serin odada temiz çizgili pijama giy"]
      },
      {
        id: "piramit_j_ejder",
        title: "Ejder",
        skipLetterCheck: true,
        asc: ["Ejder", "Ejder bin", "Ejder jipe bin", "Ejder büyük jipe bin", "Ejder dağda büyük jipe bin", "Ejder dağda kırmızı büyük jipe bin", "Ejder ulu dağda kırmızı büyük jipe bin"]
      },
      {
        id: "piramit_j_tanju",
        title: "Tanju",
        skipLetterCheck: true,
        asc: ["Tanju", "Tanju yap", "Tanju judo yap", "Tanju salonda judo yap", "Tanju salonda minderde judo yap", "Tanju salonda yumuşak minderde judo yap", "Tanju spor salonda yumuşak minderde judo yap"]
      },
      {
        id: "piramit_j_mujde",
        title: "Müjde",
        skipLetterCheck: true,
        asc: ["Müjde", "Müjde sil", "Müjde jant sil", "Müjde arabanın jantını sil", "Müjde arabanın kirli jantını sil", "Müjde arabanın çamurlu kirli jantını sil", "Müjde bezle arabanın çamurlu kirli jantını sil"]
      },
      {
        id: "piramit_j_julide",
        title: "Jülide",
        skipLetterCheck: true,
        asc: ["Jülide", "Jülide sür", "Jülide jöle sür", "Jülide saçına jöle sür", "Jülide ıslak saçına jöle sür", "Jülide uzun ıslak saçına jöle sür", "Jülide aynada uzun ıslak saçına jöle sür"]
      },
      {
        id: "piramit_j_selcuk",
        title: "Selçuk",
        skipLetterCheck: true,
        asc: ["Selçuk", "Selçuk al", "Selçuk jilet al", "Selçuk kutudan jilet al", "Selçuk kutudan keskin jilet al", "Selçuk kutudan çok keskin jilet al", "Selçuk dolaptaki kutudan çok keskin jilet al"]
      },
      {
        id: "piramit_j_ajda",
        title: "Ajda",
        skipLetterCheck: true,
        asc: ["Ajda", "Ajda tak", "Ajda bagaj tak", "Ajda arabaya bagaj tak", "Ajda arabaya büyük bagaj tak", "Ajda arabaya siyah büyük bagaj tak", "Ajda tatile arabaya siyah büyük bagaj tak"]
      }
    ]
  };

  /** Kısa ilkokuma metni: 3–5 somut cümle (TYMM: anlaşılır, mantık hatasız) */
  function textFusion(entry, opts) {
    opts = opts || {};
    if (!entry || typeof entry !== "object") return null;
    var title = String(entry.title || "").trim();
    var lines = entry.lines || entry.sentences || [];
    if (!title || !lines.length) return null;
    var sentences = [];
    for (var i = 0; i < lines.length; i++) {
      var s = sentenceFusion(lines[i]);
      if (s) sentences.push(s);
    }
    if (!sentences.length) return null;
    var slug = String(entry.id || ("metin_" + title))
      .toLocaleLowerCase("tr-TR")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9çğıöşü_]/gi, "");
    var mediaKey = entry.mediaKey || slug;
    return {
      id: slug,
      type: "metin",
      kind: "metin",
      mode: "text",
      title: title,
      result: title,
      label: opts.label || sentences.length + " cümle",
      sentences: sentences,
      lines: sentences.map(function (sf) {
        return sf.result;
      }),
      mediaKey: mediaKey,
      narration: opts.narration || ("Hikâyemiz: " + title),
      celebrate: opts.celebrate || ("Harika! “" + title + "” hikâyesini okudun!")
    };
  }

  function textLettersOk(fusion, allowed) {
    if (!fusion || !fusion.sentences || !fusion.sentences.length) return false;
    for (var i = 0; i < fusion.sentences.length; i++) {
      if (!sentenceLettersOk(fusion.sentences[i], allowed)) return false;
    }
    return true;
  }

  /**
   * Okuma hikâyeleri — anlamlı kurgu (TYMM).
   * 2. grup: ses ilerledikçe sayı artar (o:2 … m:5).
   * 3. grup: her seste 5 hikâye; 2. gruptan biraz daha uzun.
   * Harf birikimine sadık; ve/bir/bu yok.
   */
  var TEXT_BANK = {
    "o": [
      {
        id: "metin_o_ali_oto",
        title: "Ali'nin Otosu",
        mediaKey: "metin_o_ali_oto",
        lines: ["Ali oto al.","Lale oto al.","Ali ile Lale el ele.","anne not al.","Ata not al."]
      },
      {
        id: "metin_o_olta_gunu",
        title: "Olta Günü",
        mediaKey: "metin_o_olta_gunu",
        lines: ["Ata olta al.","Ali olta al.","Lale not al.","anne, Ali not al.","Ata ile Ali el ele."]
      }
    ],
    "k": [
      {
        id: "metin_k_kek",
        title: "Kek Günü",
        mediaKey: "metin_k_kek",
        lines: ["anne kek al.","Ali kek tat.","Lale kek tat.","Ali kola al.","Ata ile Ali kek al."]
      },
      {
        id: "metin_k_toka",
        title: "Toka",
        mediaKey: "metin_k_toka",
        lines: ["Lale toka al.","Lale toka tak.","anne toka al.","Ali elek al.","Lale ile anne el ele."]
      }
    ],
    "u": [
      {
        id: "metin_u_kukla",
        title: "Kukla",
        mediaKey: "metin_u_kukla",
        lines: ["Lale kukla al.","Ali kukla al.","anne kutu al.","Ali un al.","Lale, Ali kukla al.","Ata ile Ali el ele."]
      },
      {
        id: "metin_u_okul_notu",
        title: "Okul Notu",
        mediaKey: "metin_u_okul_notu",
        lines: ["Ali not oku.","Lale not oku.","anne not al.","Ata kutu al.","Ali ile Lale not oku."]
      },
      {
        id: "metin_u_koku",
        title: "Koku",
        mediaKey: "metin_u_koku",
        lines: ["anne koku al.","Lale koku al.","Ali kutu al.","Ata un al.","anne, Lale koku al."]
      }
    ],
    "r": [
      {
        id: "metin_r_nar",
        title: "Nar",
        mediaKey: "metin_r_nar",
        lines: ["Ali nar al.","Ali nar tat.","Lale erik al.","Lale erik tat.","anne kart al.","Ali ile Lale nar al."]
      },
      {
        id: "metin_r_roket",
        title: "Roket",
        mediaKey: "metin_r_roket",
        lines: ["Ata roket al.","Ali roket al.","Lale kart al.","anne nar al.","Ata, Ali roket al."]
      },
      {
        id: "metin_r_kurt",
        title: "Kurt",
        mediaKey: "metin_r_kurt",
        lines: ["Ali kurt ara.","Lale kurt ara.","Ata kara kurt ara.","anne nar al.","Ali ile Ata el ele."]
      }
    ],
    "ı": [
      {
        id: "metin_i_ari",
        title: "Arı",
        mediaKey: "metin_i_ari",
        lines: ["Ali arı ara.","Lale arı ara.","Ata iri arı ara.","anne nalın al.","Ali, Lale arı ara."]
      },
      {
        id: "metin_i_nalin",
        title: "Nalın",
        mediaKey: "metin_i_nalin",
        lines: ["anne nalın al.","anne kalın nalın al.","Lale nalın al.","Ali kartı al.","anne, Lale nalın al."]
      },
      {
        id: "metin_i_kirik",
        title: "Kırık",
        mediaKey: "metin_i_kirik",
        lines: ["Ali kırık ara.","Ata kırık ara.","Lale kartı al.","anne nalın al.","Ali ile Ata kırık ara."]
      },
      {
        id: "metin_i_karti_hikaye",
        title: "Kartı",
        mediaKey: "metin_i_karti_hikaye",
        lines: ["Ali kartı al.","Lale kartı al.","anne nalın al.","Ata arı ara.","Ali, Lale kartı al."]
      }
    ],
    "m": [
      {
        id: "metin_m_elma",
        title: "Elma",
        mediaKey: "metin_m_elma",
        lines: ["Ali elma al.","Ali elma tat.","Lale limon al.","anne ekmek al.","Ata elma al.","Ali ile Lale elma tat."]
      },
      {
        id: "metin_m_kalem",
        title: "Kalem",
        mediaKey: "metin_m_kalem",
        lines: ["Lale kalem al.","Ali kalem al.","anne minik kalem al.","Ata limon al.","Lale, Ali kalem al."]
      },
      {
        id: "metin_m_market",
        title: "Market",
        mediaKey: "metin_m_market",
        lines: ["anne market ara.","Ali ekmek al.","Lale limon al.","Ata elma al.","anne, Ali ekmek al.","Lale ile Ata el ele."]
      },
      {
        id: "metin_m_orman",
        title: "Orman",
        mediaKey: "metin_m_orman",
        lines: ["Ata orman ara.","Ali orman ara.","Lale elma al.","anne ekmek al.","Ata, Ali orman ara."]
      },
      {
        id: "metin_m_keman",
        title: "Keman",
        mediaKey: "metin_m_keman",
        lines: ["Lale keman al.","Ali keman al.","anne kalem al.","Ata limon al.","Lale, Ali keman al."]
      }
    ],
    "ü": [
      {
        id: "metin_u_utu_hikaye",
        title: "Ütü",
        mediaKey: "metin_u_utu_hikaye",
        lines: ["anne ütü al.","Lale ütü al.","Ali ürün al.","Ata kürk al.","anne, Lale ütü al.","Ali ile Ata el ele."]
      },
      {
        id: "metin_u_aku_hikaye",
        title: "Akü",
        mediaKey: "metin_u_aku_hikaye",
        lines: ["Ali akü al.","Ali otona akü tak.","Ata akü al.","Lale ürün al.","anne ütü al.","Ali, Ata otona akü tak."]
      },
      {
        id: "metin_u_tunel_hikaye",
        title: "Tünel",
        mediaKey: "metin_u_tunel_hikaye",
        lines: ["Ali tünel ara.","Ata tünel ara.","Lale küme ara.","anne ürün al.","Ali ile Ata tünel ara."]
      },
      {
        id: "metin_u_kurk_hikaye",
        title: "Kürk",
        mediaKey: "metin_u_kurk_hikaye",
        lines: ["Lale kürk al.","anne kürk al.","Ali ütü al.","Ata ürün al.","Lale, anne kürk al."]
      },
      {
        id: "metin_u_urun_hikaye",
        title: "Ürün",
        mediaKey: "metin_u_urun_hikaye",
        lines: ["Ali ürün al.","Lale ürün al.","anne tüm ürün al.","Ata ütü al.","Ali, Lale ürün al."]
      }
    ],
    "s": [
      {
        id: "metin_s_simit",
        title: "Simit",
        mediaKey: "metin_s_simit",
        lines: ["Ali simit al.","Ali simit tat.","Lale somun al.","anne süt al.","Ata susam al.","Ali ile Lale simit tat."]
      },
      {
        id: "metin_s_resim",
        title: "Resim",
        mediaKey: "metin_s_resim",
        lines: ["Lale resim al.","Ali resim al.","anne masa al.","Ata kasa al.","Lale, Ali resim al."]
      },
      {
        id: "metin_s_sut",
        title: "Süt",
        mediaKey: "metin_s_sut",
        lines: ["anne süt al.","Ali süt al.","Lale simit al.","Ata somun al.","anne, Ali süt al."]
      },
      {
        id: "metin_s_sokak",
        title: "Sokak",
        mediaKey: "metin_s_sokak",
        lines: ["Ali sokak ara.","Lale sokak ara.","Ata masa al.","anne süt al.","Ali ile Lale sokak ara."]
      },
      {
        id: "metin_s_masa",
        title: "Masa",
        mediaKey: "metin_s_masa",
        lines: ["anne masa al.","Lale eski masa al.","Ali kasa al.","Ata resim al.","anne, Lale masa al."]
      }
    ],
    "ö": [
      {
        id: "metin_o_onluk_hikaye",
        title: "Önlük",
        mediaKey: "metin_o_onluk_hikaye",
        lines: ["Lale önlük al.","Lale önlük tak.","anne örtü al.","Ali kök ara.","Ata kömür al.","Lale, anne önlük al."]
      },
      {
        id: "metin_o_kok_hikaye",
        title: "Kök",
        mediaKey: "metin_o_kok_hikaye",
        lines: ["Ali kök ara.","Ata kök ara.","Lale örnek ara.","anne örtü al.","Ali ile Ata kök ara."]
      },
      {
        id: "metin_o_komur_hikaye",
        title: "Kömür",
        mediaKey: "metin_o_komur_hikaye",
        lines: ["Ata kömür al.","Ali kömür al.","anne örtü al.","Lale önlük al.","Ata, Ali kömür al."]
      },
      {
        id: "metin_o_ornek_hikaye",
        title: "Örnek",
        mediaKey: "metin_o_ornek_hikaye",
        lines: ["Ali örnek ara.","Lale örnek ara.","anne körük al.","Ata kök ara.","Ali, Lale örnek ara."]
      },
      {
        id: "metin_o_ortu_hikaye",
        title: "Örtü",
        mediaKey: "metin_o_ortu_hikaye",
        lines: ["anne örtü al.","Lale örtü al.","Ali önlük al.","Ata kömür al.","anne, Lale örtü al."]
      }
    ],
    "y": [
      {
        id: "metin_y_oyun_hikaye",
        title: "Yeni Oyun",
        mediaKey: "metin_y_oyun_hikaye",
        lines: ["Ali oyun al.","Ali yeni oyun al.","Lale ayna al.","anne yemek al.","Ata yol ara.","Ali ile Lale oyun al."]
      },
      {
        id: "metin_y_koy_hikaye",
        title: "Köy",
        mediaKey: "metin_y_koy_hikaye",
        lines: ["Ata köy ara.","Ali köy ara.","Lale yol ara.","anne yemek al.","Ata, Ali köy ara."]
      },
      {
        id: "metin_y_yemek_hikaye",
        title: "Yemek",
        mediaKey: "metin_y_yemek_hikaye",
        lines: ["anne yemek al.","anne yeni yemek al.","Ali yemek al.","Lale ayna al.","anne, Ali yemek al."]
      },
      {
        id: "metin_y_ayna_hikaye",
        title: "Ayna",
        mediaKey: "metin_y_ayna_hikaye",
        lines: ["Lale ayna al.","Lale yeni ayna al.","Ali oyun al.","Ata yük al.","Lale, Ali ayna al."]
      },
      {
        id: "metin_y_yol_hikaye",
        title: "Yol",
        mediaKey: "metin_y_yol_hikaye",
        lines: ["Ali yol ara.","Lale yol ara.","Ata köy ara.","anne yemek al.","Ali ile Lale yol ara."]
      }
    ],
    "d": [
      {
        id: "metin_d_kedi_hikaye",
        title: "Minik Kedi",
        mediaKey: "metin_d_kedi_hikaye",
        lines: ["Ali kedi ara.","Ali minik kedi ara.","Lale kedi ara.","anne dayı ara.","Ata odun al.","Ali, Lale minik kedi ara."]
      },
      {
        id: "metin_d_ada_hikaye",
        title: "Ada",
        mediaKey: "metin_d_ada_hikaye",
        lines: ["Lale ada ara.","Ata ada ara.","Ali dere ara.","anne dilim al.","Lale ile Ata ada ara."]
      },
      {
        id: "metin_d_odun_hikaye",
        title: "Odun",
        mediaKey: "metin_d_odun_hikaye",
        lines: ["Ata odun al.","Ali odun al.","Lale dere ara.","anne dayı ara.","Ata, Ali odun al."]
      },
      {
        id: "metin_d_dayi_hikaye",
        title: "Dayı",
        mediaKey: "metin_d_dayi_hikaye",
        lines: ["Ali dayı ara.","Lale dayı ara.","anne dayı ara.","Ata odun al.","Ali, Lale dayı ara."]
      },
      {
        id: "metin_d_dilim_hikaye",
        title: "Dilim",
        mediaKey: "metin_d_dilim_hikaye",
        lines: ["Ali dilim al.","Ali iki dilim al.","Lale dilim al.","anne kedi ara.","Ali ile Lale dilim al."]
      }
    ],
    "z": [
      {
        id: "metin_z_muz_hikaye",
        title: "Muz",
        mediaKey: "metin_z_muz_hikaye",
        lines: ["Ali muz al.","Ali muz tat.","Lale üzüm al.","anne deniz ara.","Ata yıldız ara.","Ali ile Lale muz tat."]
      },
      {
        id: "metin_z_deniz_hikaye",
        title: "Deniz",
        mediaKey: "metin_z_deniz_hikaye",
        lines: ["Ali deniz ara.","Ata deniz ara.","Lale kuzu ara.","anne yazı oku.","Ali, Ata deniz ara."]
      },
      {
        id: "metin_z_yazi_hikaye",
        title: "Yazı",
        mediaKey: "metin_z_yazi_hikaye",
        lines: ["Ali yazı oku.","Lale yazı oku.","anne yazı oku.","Ata söz ara.","Ali, Lale yazı oku."]
      },
      {
        id: "metin_z_kuzu_hikaye",
        title: "Kuzu",
        mediaKey: "metin_z_kuzu_hikaye",
        lines: ["Lale kuzu ara.","Lale minik kuzu ara.","Ali kuzu ara.","anne muz al.","Lale, Ali kuzu ara."]
      },
      {
        id: "metin_z_yildiz_hikaye",
        title: "Yıldız",
        mediaKey: "metin_z_yildiz_hikaye",
        lines: ["Ali yıldız ara.","Ata yıldız ara.","Lale deniz ara.","anne üzüm al.","Ali ile Ata yıldız ara."]
      }
    ],
    "ç": [
      {
        id: "metin_ç_cilek_receli",
        title: "Çilek Reçeli",
        mediaKey: "metin_ç_cilek_receli",
        skipLetterCheck: true,
        lines: [
          "Ayça taze tatlı çilek al.",
          "Çilekleri tek tek seç.",
          "Çilekleri temiz su ile yıka.",
          "Annen ile taze çilek reçeli et.",
          "Reçel çok tatlı olur.",
          "Ekmek üstüne reçel sür.",
          "Reçeli tatlı tatlı tüket.",
          "Çilek reçeli kırmızı olur.",
          "Çilek kokusu odaya dolar.",
          "Ayça reçel yerken üstünü kirletme.",
          "Elleri temiz tut."
        ]
      },
      {
        id: "metin_ç_ucurtma",
        title: "Uçurtma",
        mediaKey: "metin_ç_ucurtma",
        skipLetterCheck: true,
        lines: [
          "Selçuk sarı uçurtma al.",
          "Uçurtma renkli renkli telli olsun.",
          "Çetin ile kıra in.",
          "Kırda uçurtma uçur.",
          "Esinti artar uçurtma uçar.",
          "Uçurtma uçar uçar durur.",
          "Teli sıkı sıkı tut.",
          "Selçuk uçurtma ile çok koş.",
          "Süslü uçurtman ne tatlı.",
          "Uçurtma tellere takılmasın.",
          "Selçuk uçurtma ile çok mutlu ol."
        ]
      },
      {
        id: "metin_ç_cadir_kur",
        title: "Çadır Kur",
        mediaKey: "metin_ç_cadir_kur",
        skipLetterCheck: true,
        lines: [
          "Tunç ormana in.",
          "Ormanda dere kenarına çadır kur.",
          "Çadırın içi serin olur.",
          "Çadırın önüne kilim ser.",
          "Çadırda taze demli çay iç.",
          "Tunç çadırda çay suyu ısıt.",
          "Çay ısıt, çay iç.",
          "Çadırdan ormana çık.",
          "Ormanda çalı bul.",
          "Çadır kenarına çalı diz.",
          "Çadırda mutlu mutlu otur."
        ]
      },
      {
        id: "metin_ç_catida_cekic",
        title: "Çatıda Çekiç",
        mediaKey: "metin_ç_catida_cekic",
        skipLetterCheck: true,
        lines: [
          "Çetin çekiç al.",
          "Çetin demir çekiç al.",
          "Çekiç ile kütük kır.",
          "Çatıya çık çatı onar.",
          "Çatı akarsa çekiç ile kiremit kır.",
          "Çetin usta çatıya çık.",
          "Çekiç sesleri duyuldu.",
          "Çekiç tak tak ses eder.",
          "Çetin usta çatıyı onar.",
          "Çekiç ile usta ol.",
          "Çekiç tutarken elini ezme.",
          "Çetin usta dikkatli ol."
        ]
      },
      {
        id: "metin_ç_temiz_saclar",
        title: "Temiz Saçlar",
        mediaKey: "metin_ç_temiz_saclar",
        skipLetterCheck: true,
        lines: [
          "Ayça saçını tara.",
          "Ayça ıslak saçlarını tara.",
          "Sarı tarak ile saç tara.",
          "Ayça saçlarına taç tak.",
          "Telli taç tak, çok süslü ol.",
          "Tunç senin de saçların uzadı.",
          "Tunç saçlarını kestir.",
          "Temiz temiz saçların olsun.",
          "Ayça uzun saçlarını örsün.",
          "Ayça ile Tunç saçlarını iyi kollasın.",
          "Uzun saçları temiz tutsun."
        ]
      }
    ],
    "b": [
      {
        id: "metin_b_baba_bebek",
        title: "Baba ile Bebek",
        mediaKey: "metin_b_baba_bebek",
        skipLetterCheck: true,
        lines: [
          "Baba bebeklere bak.",
          "Bebek uyudu mu bak.",
          "Bebek uyanırsa mama yedir.",
          "Biberon ile süt içir.",
          "Bebek sütünü bitirsin.",
          "Baba bebekleri eline al.",
          "Bebek banyo etsin.",
          "Sabunla bebekleri yıka.",
          "Bol su ile yıka.",
          "Bebek mis koksun.",
          "Baba bebekle usul usul uyu.",
          "Bebek tatlı tatlı uyusun.",
          "Bebek büyüsün."
        ]
      },
      {
        id: "metin_b_balik_tutma",
        title: "Balık Tutma",
        mediaKey: "metin_b_balik_tutma",
        skipLetterCheck: true,
        lines: [
          "Burak balık tut.",
          "Burak oltanı al, dereye in.",
          "Derede büyük balıklar olur.",
          "Oltanı suya at, bekle.",
          "Balıklar yemi alsın.",
          "Burak on balık tut.",
          "Tutulan balıkları kutuya at.",
          "Kutu su ile dolsun.",
          "Balıkları kediye yedir.",
          "Kediler balık yerse mutlu olur.",
          "Burak o kediyi besle.",
          "Kediler balık ile doysun."
        ]
      },
      {
        id: "metin_b_bakkaldan_al",
        title: "Bakkaldan Al",
        mediaKey: "metin_b_bakkaldan_al",
        skipLetterCheck: true,
        lines: [
          "Batu bakkala in.",
          "Bakkaldan ekmek al.",
          "Bakkalda taze ekmek olur.",
          "Batu bakkaldan süt, bal, börek al.",
          "Bal tatlı olur, börek etli olur.",
          "Bakkala bilye sor.",
          "Bakkal sana bilye satsın.",
          "Aldıklarını çantana at.",
          "Batu bakkaldan ayrıl.",
          "Aldıklarını odana ilet.",
          "Annen börekleri masaya koysun.",
          "Beraber oturarak yiyin."
        ]
      },
      {
        id: "metin_b_boyalar_resim",
        title: "Boyalar ile Resim",
        mediaKey: "metin_b_boyalar_resim",
        skipLetterCheck: true,
        lines: [
          "Banu boya al.",
          "Banu bakkaldan sulu boya al.",
          "Sulu boya ile resim çiz.",
          "Banu büyük resimler çiz.",
          "Resmine bir araba çiz.",
          "Arabayı kırmızı boya.",
          "Bulutları mor boya.",
          "Sarı renkli bir çatı çiz.",
          "Banu renkleri birbirine kat.",
          "Ortaya yeni renkler çıksın.",
          "Banu resmini odana as."
        ]
      },
      {
        id: "metin_b_bisiklet",
        title: "Bisiklet",
        mediaKey: "metin_b_bisiklet",
        skipLetterCheck: true,
        lines: [
          "Bülent bisiklete bin.",
          "Bülent kırmızı bisiklete bin.",
          "Bisikletin tekerine bak.",
          "Tekeri indi ise onar.",
          "Bülent dikkatli bin.",
          "Bisiklet ile yolda kalma.",
          "Bisiklet kornasını çal.",
          "Düt düt düt!",
          "İnsanlar sese baksın.",
          "Bülent bisikleti dikkatli sür.",
          "Bisikletini kırma, tekerini sil, temiz tut.",
          "Kazalara dikkat et."
        ]
      }
    ],
    "g": [
      {
        id: "metin_g_gemi_deniz",
        title: "Gemi ile Deniz",
        mediaKey: "metin_g_gemi_deniz",
        skipLetterCheck: true,
        lines: [
          "Tolga denize bak.",
          "Denizde dalgalar büyüdü.",
          "Dalgalar kıyıya daldı.",
          "Denizde bir gemi belirdi.",
          "Gemi usul usul ilerledi.",
          "Tolga geminin kornasını duydu mu?",
          "Gemiler denizde ne güzel gider.",
          "Tolga gemiye el salla.",
          "Gemidekiler sana gülsün.",
          "Denizde gemi ile gezmek güzeldir.",
          "Gemiler çok ulu durur."
        ]
      },
      {
        id: "metin_g_guzel_gozluk",
        title: "Güzel Gözlük",
        mediaKey: "metin_g_guzel_gozluk",
        skipLetterCheck: true,
        lines: [
          "Gamze gözlük al.",
          "Gamze sarı telli gözlük al.",
          "Gözlerini koru, gözlük tak.",
          "Gözlük ile net gör.",
          "Gamze gözlükleri kutulara koy.",
          "Gözlük telini mendil ile sil.",
          "Gözlükleri bezle sil.",
          "Gözlük tak, gözlerin yorulmasın.",
          "Gamze yeni gözlüklerin ne güzel.",
          "Gözlüksüz yola çıkma."
        ]
      },
      {
        id: "metin_g_gitar_cal",
        title: "Gitar Çal",
        mediaKey: "metin_g_gitar_cal",
        skipLetterCheck: true,
        lines: [
          "Gizem gitar al.",
          "Gizem tellerine dokun, gitar çal.",
          "Gitarın sesi ne güzel.",
          "Melodiler odaya dolsun.",
          "Gürsel sen de türkü söyle.",
          "Beraber güzel sesler duyurun.",
          "Gitar ile ritim tut.",
          "Gizem gitar dersine git.",
          "Derslerde müzikler bil.",
          "Gitarını çantasına koy, dikkatli tut.",
          "Müzik insanı dinlendirir."
        ]
      },
      {
        id: "metin_g_gol_kenari",
        title: "Göl Kenarı",
        mediaKey: "metin_g_gol_kenari",
        skipLetterCheck: true,
        lines: [
          "Gaye göle in.",
          "Gölün kenarında gezin.",
          "Gölde kazlar yüzer.",
          "Kazlara yem at.",
          "Gökyüzü bulutsuz, sular serin.",
          "Gaye göl kenarında otur.",
          "Gölde yüzen kayıklara bak.",
          "Kayıklar usul usul gider.",
          "Göl rüzgarla dalgalanır.",
          "Gölde ördekler de yüzer.",
          "Ördekler suya dalar dalar çıkar.",
          "Kazlar uçsun."
        ]
      },
      {
        id: "metin_g_gazete_oku",
        title: "Gazete Oku",
        mediaKey: "metin_g_gazete_oku",
        skipLetterCheck: true,
        lines: [
          "Gül gazete al.",
          "Gül bayiden büyük gazete al.",
          "Gazetede resimlere bak.",
          "Günlük yazıları gazeteden oku.",
          "Gürkan gazetenin son ekini alsın.",
          "Gazete oku, bilgi dol.",
          "Büyükler erken saatlerde gazete okur.",
          "Sen de gazetelere göz at.",
          "Gazetede yazanları dedene anlat.",
          "Gazeteyi okuduktan sonra masaya bırak.",
          "Düzenli gazete oku."
        ]
      }
    ],
    "c": [
      {
        id: "metin_c_incir_badem",
        title: "İncir ile Badem",
        mediaKey: "metin_c_incir_badem",
        skipLetterCheck: true,
        lines: [
          "Cem incir al.",
          "Cem daldan incir al.",
          "İncirin derisi ince olur.",
          "İncir içi çok lezzetlidir.",
          "Can sen de badem al.",
          "İncir ile badem ye.",
          "İkisi de insana güç katar.",
          "Cem incirleri tabaklara diz, Can bademleri koysun.",
          "Beraber tatlı tatlı yiyin.",
          "İncir ile badem çok lezzetlidir.",
          "İnciri doya doya ye."
        ]
      },
      {
        id: "metin_c_yeni_ceket",
        title: "Yeni Ceket",
        mediaKey: "metin_c_yeni_ceket",
        skipLetterCheck: true,
        lines: [
          "Ceyda ceket giy.",
          "Ceyda kırmızı ceket giy.",
          "Ceketinin yakası ne kadar güzel.",
          "Ceketin cebine ellerini at.",
          "Günler serinleyince ceket giyilir.",
          "Cengiz ceketini askıya as.",
          "Ceket kirlenmesin, temiz kalsın.",
          "Ceket giyen çocuklar donmaz.",
          "Ceyda ceketini giy, yola çık.",
          "Ceket seni korur."
        ]
      },
      {
        id: "metin_c_camlari_sil",
        title: "Camları Sil",
        mediaKey: "metin_c_camlari_sil",
        skipLetterCheck: true,
        lines: [
          "Ceren camlar kirlendi.",
          "Ceren bir bez al, camları sil.",
          "Camları silerken dikkat et.",
          "Cengiz camları silen Ceren'e su uzat.",
          "Camlar mis gibi koksun.",
          "Tertemiz camlardan yola bak.",
          "Yoldan geçen arabaları izle.",
          "Temiz cam nuru içeri alır.",
          "Camları temiz tutmak çok güzeldir.",
          "Camda leke kalmasın."
        ]
      },
      {
        id: "metin_c_kucuk_karinca",
        title: "Küçük Karınca",
        mediaKey: "metin_c_kucuk_karinca",
        skipLetterCheck: true,
        lines: [
          "Candan yere dikkatli bak.",
          "Yerde minik bir karınca yürüyor.",
          "Karınca kırıntı buldu.",
          "O kırıntıyı oraya iletecek.",
          "Karıncalar çok yorulur.",
          "Dinlenmeden yoluna gider.",
          "Karıncayı incitme, ona yol aç.",
          "Karıncalar ne kadar da güçlü.",
          "Yükleri kendilerinden büyüktür.",
          "Karınca ile dost ol."
        ]
      },
      {
        id: "metin_c_gece_gokyuzu",
        title: "Gece Gökyüzü",
        mediaKey: "metin_c_gece_gokyuzu",
        skipLetterCheck: true,
        lines: [
          "Gece oldu, karanlık çöktü.",
          "Gökyüzünde yıldızlar belirdi.",
          "Cengiz gece yıldızlara bak.",
          "Yıldızlar inci gibi duruyor.",
          "Can aya bak, ay kocaman.",
          "Gece rüyalara dalma zamanıdır.",
          "Gözlerini ört, uyu.",
          "Ceyda yatakta uyu.",
          "Üstünü ört.",
          "Geceleri iyi dinlen, erken saatlerde dinç uyan.",
          "Cici uykular dileriz."
        ]
      }
    ],
    "ş": [
      {
        id: "metin_ş_kuslar",
        title: "Kuşlar",
        mediaKey: "metin_ş_kuslar",
        skipLetterCheck: true,
        lines: [
          "Şule gökyüzüne bak.",
          "Kuşlar neşe ile uçuyor.",
          "Şakir kuşlara yem at.",
          "Kuşlar balkona insin, yemi yesin.",
          "Sarı kuşlar, yeşil kuşlar uçuşuyor.",
          "Şermin kuş sesi dinle.",
          "Kuşların sesi çok güzeldir.",
          "Ormanda dala otlar taşımışlar.",
          "Orada minik kuşlar olur.",
          "Onları ürkütmeden izle.",
          "Uçan kuşlar çok tatlı."
        ]
      },
      {
        id: "metin_ş_siir_oku",
        title: "Şiir Oku",
        mediaKey: "metin_ş_siir_oku",
        skipLetterCheck: true,
        lines: [
          "Şenay şiir ezberle.",
          "Şiiri okulda arkadaşlarına oku.",
          "Sesli sesli, coşkuyla oku.",
          "Şiir okurken gülümse.",
          "Şenol da sana eşlik etsin.",
          "İkiniz ortada şiir okuyun.",
          "İnsanlar sizi alkışlasın.",
          "Şiir okumak insanın içini ısıtır.",
          "Şiir eserlerini çok oku.",
          "Okudukça yeni şiirler bilirsin.",
          "Güzel şiirler oku."
        ]
      },
      {
        id: "metin_ş_gunesli_gunler",
        title: "Güneşli Günler",
        mediaKey: "metin_ş_gunesli_gunler",
        skipLetterCheck: true,
        lines: [
          "Kış bitti, yaz geldi.",
          "Güneş sımsıcak gülümsedi.",
          "Şükrü dışarı çık, güneşlen.",
          "Güneşli günlerde gölgeye geç.",
          "Şemsiye al, gölgede otur.",
          "Şule şemsiyeni aç, sıcaktan korun.",
          "Güneş çiçekleri büyütür, açtırır.",
          "Güneşten güç alırız.",
          "Akşam olunca güneş batar, ay çıkar.",
          "Güneşli günlerin tadını çıkar, oyunlar oyna."
        ]
      },
      {
        id: "metin_ş_sise_su",
        title: "Şişe ile Su",
        mediaKey: "metin_ş_sise_su",
        skipLetterCheck: true,
        lines: [
          "Şermin şişeye su doldur.",
          "Şişe camdan üretilmiş.",
          "Cam şişeden su içmek iyidir.",
          "Şişeyi buzdolabına koy, serinlet.",
          "Şakir serin su iç, serinle.",
          "Şişenin üstünü sıkıca ört.",
          "Su dökülmesin, ziyan olmasın.",
          "Şişeyi masaya dikkatli bırak.",
          "Kırılırsa elini kesebilirsin.",
          "Cam kırıkları çok kesicidir.",
          "Temiz sular iç."
        ]
      },
      {
        id: "metin_ş_besikteki_bebek",
        title: "Beşikteki Bebek",
        mediaKey: "metin_ş_besikteki_bebek",
        skipLetterCheck: true,
        lines: [
          "Beşik usul usul sallanıyor.",
          "Bebek beşikte tatlı tatlı uyuyor.",
          "Şaban bebek için battaniye al, üstünü ört.",
          "Beşik yanında ninniler söyle.",
          "Bebek ninnilerle uykuya daldı.",
          "Şükrü sakın yüksek ses çıkarma.",
          "Bebek uyanınca sızlanmaya başlar.",
          "Beşik sallandıkça bebek rüyalara uçar.",
          "Şenay beşik ucunu usulca salla.",
          "Bebek büyüyecek, oyunlar oynayacak."
        ]
      }
    ]
,
    "p": [
      {
        id: "metin_p_pazar_gunu",
        title: "Pazar Günü",
        mediaKey: "metin_p_pazar_gunu",
        skipLetterCheck: true,
        lines: [
          "Polat pazara git.",
          "Pazardan patates, pırasa, portakal al.",
          "Portakalları poşete koy.",
          "Poşetleri arabaya diz.",
          "Pazardan peynir de al.",
          "Peynir taze olsun.",
          "Sarı peynir, beyaz peynir al.",
          "Pazarcı amcaya para öde.",
          "Pazardan dön, aldıklarını masaya koy."
        ]
      },
      {
        id: "metin_p_pembe_palto",
        title: "Pembe Palto",
        mediaKey: "metin_p_pembe_palto",
        skipLetterCheck: true,
        lines: [
          "Pelin pembe palto giy.",
          "Palto seni kışın korur.",
          "Karda kışta palto ile oyna.",
          "Pelin pembe paltoya cep dik.",
          "Ceplere ellerini sakla, üşüme.",
          "Pelin karda patik de giy.",
          "Karda iz bırak, mutlu ol."
        ]
      },
      {
        id: "metin_p_pilli_araba",
        title: "Pilli Araba ve Köpek",
        mediaKey: "metin_p_pilli_araba",
        skipLetterCheck: true,
        lines: [
          "Toprak pilli araba al.",
          "Pilli arabayı parkta sür.",
          "Arabanın pili biterse, yeni pil tak.",
          "Parkta bir köpek de olsun.",
          "O köpek Pamuk olsun.",
          "Pamuk pilli araba ile yarışsın.",
          "Toprak Pamuk ile çok koş.",
          "Pamuk yorulunca ona su içir."
        ]
      },
      {
        id: "metin_p_postaci_geldi",
        title: "Postacı Geldi",
        mediaKey: "metin_p_postaci_geldi",
        skipLetterCheck: true,
        lines: [
          "Kapı çaldı, postacı geldi.",
          "Postacı sana bir paket getirdi.",
          "Paketi aç, içine bak.",
          "Paketten sarı bir pusula çıktı.",
          "Pusula ile yönünü bul.",
          "Poyraz pusula ile ormana git.",
          "Ormanda yolunu kaybetme.",
          "Postacı amcaya selam söyle."
        ]
      },
      {
        id: "metin_p_piknik_zamani",
        title: "Piknik Zamanı",
        mediaKey: "metin_p_piknik_zamani",
        skipLetterCheck: true,
        lines: [
          "Alper piknik sepetini al.",
          "Sepete taze pide, peynir, pasta koy.",
          "Pınarın yanına örtü ser.",
          "Pınardan su iç, serinle.",
          "Pastayı dilimle, tabağa koy.",
          "Ailecek masada pastayı ye.",
          "Piknikte top oyna, ipe tırman.",
          "Piknik bitince çöpleri poşete topla."
        ]
      }
    ],
    "h": [
      {
        id: "metin_h_hastalik_ihlamur",
        title: "Hastalık ve Ihlamur",
        mediaKey: "metin_h_hastalik_ihlamur",
        skipLetterCheck: true,
        lines: [
          "Hasan kışın hasta oldu.",
          "Hemen odasına yattı.",
          "Hekim geldi, Hasan'a hap yazdı.",
          "Annesi ona ıhlamur demledi.",
          "Ihlamurun içine bal koydu.",
          "Hasan ıhlamuru yudum yudum içti.",
          "Hasan bol bol dinlendi.",
          "Hastalık çabucak bitti.",
          "Hasan artık çok iyi oldu."
        ]
      },
      {
        id: "metin_h_horoz_hindi",
        title: "Horoz ile Hindi",
        mediaKey: "metin_h_horoz_hindi",
        skipLetterCheck: true,
        lines: [
          "Hamza köyde sabah erken kalk.",
          "Bahçede horoz ötüyor.",
          "Horoz ü ürü üüü diye sesleniyor.",
          "Horozun sesi herkesi uyandırır.",
          "Kümeste hindi de bulunsun.",
          "Hindi ile horoza yem at, mısır at.",
          "Horoz ile hindi yemleri gaga ile toplar.",
          "Hamza onlara çok bakar.",
          "Onlara her sabah su taşır."
        ]
      },
      {
        id: "metin_h_hediye_kutusu",
        title: "Hediye Kutusu",
        mediaKey: "metin_h_hediye_kutusu",
        skipLetterCheck: true,
        lines: [
          "Hande sana hediye geldi.",
          "Hediyeyi heyecanla aç.",
          "Kutunun içinden bir harita çıktı.",
          "Haritada ormanlar, denizler olur.",
          "Hande haritayı masaya ser.",
          "Şehirleri tek tek bul.",
          "Hakan da haritaya baksın.",
          "Harita okumak insana akıl katar.",
          "Hande bu hediyeyi çok benimsedi."
        ]
      },
      {
        id: "metin_h_hali_yikama",
        title: "Halı Yıkama",
        mediaKey: "metin_h_hali_yikama",
        skipLetterCheck: true,
        lines: [
          "Hale pazar günü halı yıka.",
          "Halıyı balkona ser.",
          "Üzerine bol su dök.",
          "Büyük bez ile halıyı sil.",
          "Halı köpük köpük oldu.",
          "Sonra halıyı durula.",
          "Halı tertemiz, mis gibi koktu.",
          "Halıyı kuruması için ipe as.",
          "Kuru halıyı odaya koy.",
          "Oda halı ile çok güzel oldu."
        ]
      },
      {
        id: "metin_h_hikaye_kitabi",
        title: "Hikaye Kitabı",
        mediaKey: "metin_h_hikaye_kitabi",
        skipLetterCheck: true,
        lines: [
          "Hülya hikaye kitabı al.",
          "Kitaptaki resimlere uzun uzun bak.",
          "Hikayede kahraman ormana gitmiş.",
          "Orada aslan, kaplan bulmuş.",
          "Kahraman onlarla konuşmuş.",
          "Hülya hikayeyi sesli oku.",
          "Halil de seni dinlesin.",
          "Hikaye okumak kelimeleri artırır.",
          "Hülya her gece hikaye oku, sonra uyu."
        ]
      }
    ],
    "v": [
      {
        id: "metin_v_vapur_marti",
        title: "Vapur ve Martı",
        mediaKey: "metin_v_vapur_marti",
        skipLetterCheck: true,
        lines: [
          "Volkan iskeleye in, vapura bin.",
          "Vapur denizde bata çıka ilerliyor.",
          "Vapurun sireni vuu vuu diye ötüyor.",
          "Havada martılar uçuşuyor.",
          "Vapurdan martılara simit at.",
          "Martılar simitleri havada yakalar.",
          "Deniz havası insana iyi gelir.",
          "Vapur ile yolculuk çok iyidir."
        ]
      },
      {
        id: "metin_v_vazo_cicekler",
        title: "Vazo ve Çiçekler",
        mediaKey: "metin_v_vazo_cicekler",
        skipLetterCheck: true,
        lines: [
          "Vildan masaya cam vazo koy.",
          "Vazonun içine su doldur.",
          "Kırmızı laleleri vazoya diz.",
          "Çiçekler mis gibi kokar.",
          "Cam vazo çok narindir.",
          "Dikkat et, vazoyu devirme.",
          "Vazo düşerse cam kırılır, sular dökülür.",
          "Vazonun yanına bez koy, suyu sil.",
          "Evini hep temiz tut."
        ]
      },
      {
        id: "metin_v_visne_suyu",
        title: "Vişne Suyu",
        mediaKey: "metin_v_visne_suyu",
        skipLetterCheck: true,
        lines: [
          "Vedat daldan vişne topla.",
          "Vişneler kırmızı, vişneler sulu.",
          "Vişneleri tencereye doldur.",
          "Annem o vişnelerden vişne suyu yapsın.",
          "Merve bir bardak vişne suyu iç.",
          "Vişne suyu biraz tatlı, biraz ekşi olur.",
          "İçine buz at, serin serin yudumla.",
          "Vişne çekirdeklerini yere atma."
        ]
      },
      {
        id: "metin_v_tavsan_havuc",
        title: "Tavşan ve Havuç",
        mediaKey: "metin_v_tavsan_havuc",
        skipLetterCheck: true,
        lines: [
          "Sevim kırda yürürken bir tavşan gördü.",
          "Tavşan beyaz, kulakları uzundur.",
          "Tavşana havuç uzattı.",
          "Tavşan havucu kıtır kıtır yedi.",
          "Veysel sen de tavşanın tüylerini sev.",
          "Tavşan çok sevimli bir hayvandır.",
          "Tavşan korkarsa hemen yuvasına kaçar.",
          "Tavşanı ürkütmeden izle."
        ]
      },
      {
        id: "metin_v_valiz_yolculuk",
        title: "Valiz ve Yolculuk",
        mediaKey: "metin_v_valiz_yolculuk",
        skipLetterCheck: true,
        lines: [
          "Merve valizi odana getir.",
          "İçine kazak, pantolon, havlu koy.",
          "Yolculuk vakti geldi.",
          "Valizin kemerini sıkıca çek.",
          "Vedat valizi arabaya taşı.",
          "Araba ile uzun yola çık.",
          "Yollarda tepeler, ovalar var.",
          "Tatil vakti ne kadar neşeli."
        ]
      }
    ],
    "ğ": [
      {
        id: "metin_ğ_yagmur_doga",
        title: "Yağmur ve Doğa",
        mediaKey: "metin_ğ_yagmur_doga",
        skipLetterCheck: true,
        lines: [
          "Gökyüzünü kara bulutlar sardı.",
          "Birazdan yağmur yağdı.",
          "Yağız yağmurda ıslanma.",
          "Şemsiyeni aç, yağmurdan korun.",
          "Ağaçlar, çiçekler yağmur suyu ile beslenir.",
          "Yağmur dindikten sonra gökkuşağı çıktı.",
          "Doğa yağmurdan sonra pırıl pırıl oldu.",
          "Toprak mis gibi koktu.",
          "Herkes doğayı çok sever."
        ]
      },
      {
        id: "metin_ğ_sogan_sarimsak",
        title: "Soğan ve Sarımsak",
        mediaKey: "metin_ğ_sogan_sarimsak",
        skipLetterCheck: true,
        lines: [
          "Çağla yemek için soğan soy.",
          "Soğanı doğrarken gözlerin yaşarır.",
          "Soğanı tencereye at.",
          "Biraz da sarımsak ez.",
          "Sarımsak bizi hastalıklara karşı korur.",
          "Yiğit soğanlı yemek ye, güçlü ol.",
          "Soğanın kabuğunu çöpe at.",
          "Sağlıklı yaşamak için soğan tüket."
        ]
      },
      {
        id: "metin_ğ_kurbaga_gol",
        title: "Kurbağa ve Göl",
        mediaKey: "metin_ğ_kurbaga_gol",
        skipLetterCheck: true,
        lines: [
          "Oğuz dere kenarında yürüyor.",
          "Derede yeşil bir kurbağa var.",
          "Kurbağa vırak vırak ses çıkarır.",
          "Sinek yakalamak için dilini uzatır.",
          "Kurbağanın derisi kaygandır.",
          "Oğuz kurbağayı ürkütme.",
          "Kurbağa taştan taşa zıplar, suya dalar.",
          "Deredeki kurbağaları izlemek çok hoştur."
        ]
      },
      {
        id: "metin_ğ_dag_yolu",
        title: "Dağ Yolu",
        mediaKey: "metin_ğ_dag_yolu",
        skipLetterCheck: true,
        lines: [
          "Uğur dağa doğru tırman.",
          "Dağın tepesi karlı ve soğuktur.",
          "Dağda ulu ağaçlar var.",
          "Kuşlar dağda özgürce uçar.",
          "Dağın yamacında yürürken dikkat et.",
          "Taşlara takılıp düşme.",
          "Dağ havası çok temizdir, ciğerleri açar.",
          "Yorulunca büyük bir kayanın üstüne otur."
        ]
      },
      {
        id: "metin_ğ_igne_iplik",
        title: "İğne İplik ve Kağıt",
        mediaKey: "metin_ğ_igne_iplik",
        skipLetterCheck: true,
        lines: [
          "Tuğçe iğne ile iplik al.",
          "Sökük düğmeni iğne ile dik.",
          "İğnenin ucu sivridir, eline batırma.",
          "Çağdaş sen de masaya kağıt koy.",
          "Kağıda resim çiz, boya.",
          "Kağıttan uçak yap, havaya at.",
          "Kağıtlar ağaçlardan üretilir.",
          "Ağaçları ve ormanı koru, kağıdı boş yere atma."
        ]
      }
    ],
    "f": [
      {
        id: "metin_f_findik_fistik",
        title: "Fındık ve Fıstık",
        mediaKey: "metin_f_findik_fistik",
        skipLetterCheck: true,
        lines: [
          "Fatih tabağa fındık ile fıstık koy.",
          "Fıstıklar tuzlu, fındıklar taze olsun.",
          "Funda fındıkları afiyetle yedi.",
          "Fındık beynimizi besler, güçlü yapar.",
          "Fıstıkların kabuklarını yere fırlatma.",
          "Kabukları çöp poşetine at.",
          "Ailecek fındık fıstık yemek çok keyiflidir.",
          "Sağlıklı atıştırmalıklar bizi dinç tutar."
        ]
      },
      {
        id: "metin_f_ormanda_fil",
        title: "Ormanda Fil",
        mediaKey: "metin_f_ormanda_fil",
        skipLetterCheck: true,
        lines: [
          "Furkan belgesel izlerken bir fil gördü.",
          "Filin hortumu uzun, kulakları yaprak gibi kocamandır.",
          "Fil hortumuyla suyu çekti, sırtına fışkırttı.",
          "Filler ot yer, ormanda ağır ağır yürür.",
          "Filin yavrusu annesinin peşinden ayrılmaz.",
          "Filler doğanın en büyük canlılarıdır.",
          "Onlara zarar vermemeliyiz."
        ]
      },
      {
        id: "metin_f_firinda_ekmek",
        title: "Fırında Ekmek",
        mediaKey: "metin_f_firinda_ekmek",
        skipLetterCheck: true,
        lines: [
          "Defne sabah erkenden kalk, fırına git.",
          "Fırından sıcak, taze ekmek al.",
          "Fırın mis gibi hamur kokuyor.",
          "Fırıncı fırçayla ekmeklerin üstünü siliyor.",
          "Efe fırından sıcak poğaça da al.",
          "Kahvaltıda sıcak ekmeğin içine peynir koy.",
          "Fırıncılara teşekkür etmeyi unutma."
        ]
      },
      {
        id: "metin_f_flut_calan_efe",
        title: "Flüt Çalan Efe",
        mediaKey: "metin_f_flut_calan_efe",
        skipLetterCheck: true,
        lines: [
          "Efe okulda müzik dersinde flüt çalıyor.",
          "Flütün deliklerini parmaklarıyla kapatıyor.",
          "Flütten ince, tatlı sesler çıkıyor.",
          "Elif Efe'nin çaldığı melodiyi dinliyor.",
          "Flüt çalmak nefes kontrolü ister.",
          "Efe flütünü bezle silip kutusuna koydu.",
          "Flüt, müziğe başlamak için harika bir alettir."
        ]
      },
      {
        id: "metin_f_fayton_fare",
        title: "Fayton ve Fare",
        mediaKey: "metin_f_fayton_fare",
        skipLetterCheck: true,
        lines: [
          "Funda adaya gezmeye gitti.",
          "Adada atların çektiği faytonlar var.",
          "Faytonun tekerlekleri dönerken tık tık ses yapıyor.",
          "O sırada yoldan küçük bir fare geçti.",
          "Fareyi gören at biraz ürktü.",
          "Fikret atı sakinleştirdi.",
          "Fayton turu adanın sokaklarında neşeyle devam etti.",
          "Fayton adada en güzel ulaşım aracıdır."
        ]
      }
    ],
    "j": [
      {
        id: "metin_j_pijamali_jale",
        title: "Pijamalı Jale",
        mediaKey: "metin_j_pijamali_jale",
        skipLetterCheck: true,
        lines: [
          "Jale akşam olunca pijamalarını giydi.",
          "Pijaması pembe çizgili ve çok rahattı.",
          "Gündüz kıyafetleriyle yatmak iyi değildir, yatak kirlenir.",
          "Yatmadan önce pijamalarını giyip dişlerini fırçaladı.",
          "Jülide de pijamasını giydi, ikisi yatağa uzandı.",
          "Temiz pijamalarla uyumak rüyaları bile güzelleştirir.",
          "Sabah uyanınca pijama katlanır, dolaba kaldırılır.",
          "Jale ve Jülide yeni güne neşeyle başlar."
        ]
      },
      {
        id: "metin_j_jip_dag_yolu",
        title: "Jip ve Dağ Yolu",
        mediaKey: "metin_j_jip_dag_yolu",
        skipLetterCheck: true,
        lines: [
          "Ejder amca yeni bir jip aldı.",
          "Jip dağ yollarında çok rahat gidiyor.",
          "Jipin jantları pırıl pırıl parlıyor.",
          "Ejder amca bagaja eşyaları ve kamp malzemelerini yükledi.",
          "Tanju sen de jipe bin, maceraya katıl.",
          "Dağda yollar taşlık ve çamurludur ama jip sarsılmaz.",
          "Jiple doğayı gezmek çok heyecan vericidir.",
          "Vadi manzarası oradan çok güzel görünür."
        ]
      },
      {
        id: "metin_j_judo_sporu",
        title: "Judo Sporu",
        mediaKey: "metin_j_judo_sporu",
        skipLetterCheck: true,
        lines: [
          "Tanju spor salonunda judo yapıyor.",
          "Judo aslında Japonya ülkesinin milli sporudur.",
          "Judo yaparken beyaz kuşak takarsın, başarıkça renkli kuşaklara geçersin.",
          "Müjde de antrenmanı izlemeye geldi.",
          "Salonda mindere düşerken çok dikkatli olmak gerekir.",
          "Her sporun kuralı farklıdır.",
          "Judo sporu saygıya dayanır, rakipler birbirini selamlar.",
          "Spor sayesinde bedenimiz güçlü kalır."
        ]
      },
      {
        id: "metin_j_saclara_jole",
        title: "Saçlara Jöle",
        mediaKey: "metin_j_saclara_jole",
        skipLetterCheck: true,
        lines: [
          "Jülide bugün arkadaşlarıyla buluşacak.",
          "Aynanın karşısına geçti.",
          "Saçları uçuşmasın diye biraz jöle sürdü.",
          "Jöle saçları sabit tutar ve parlak gösterir.",
          "Ancak saçta jöle çok kalırsa saça zarar verebilir.",
          "Akşam dönünce saçını şampuanla yıkamalıdır.",
          "Ajda sen saçına jöle yerine toka takabilirsin.",
          "Doğal saç her zaman daha havalı ve temizdir."
        ]
      },
      {
        id: "metin_j_jandarma",
        title: "Jandarma Bizi Korur",
        mediaKey: "metin_j_jandarma",
        skipLetterCheck: true,
        lines: [
          "Köyde güvenliği jandarma sağlar.",
          "Jandarma abiler yeşil üniforma giyer.",
          "Arabalarının üstünde mavi kırmızı lamba yanar.",
          "Ejder amca jandarma komutanıdır.",
          "Herkesin güvenliği için gece gündüz nöbet tutarlar.",
          "Kurallara uymayan sürücüleri uyarır, adaleti sağlarlar.",
          "Bir sorun yaşarsan jandarmadan yardım iste.",
          "Onlar ülkemizin huzuru için varlar."
        ]
      }
    ]
  };

  rebuildMeaningfulWords();

  function allSounds() {
    var out = [];
    GROUPS.forEach(function (g) {
      (g.sounds || []).forEach(function (s) { out.push(s); });
    });
    return out;
  }

  function allMediaKeys() {
    var keys = [];
    var seen = {};
    allSounds().forEach(function (s) {
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

  function allAudioSlots() {
    var seen = {};
    var out = [];
    function add(token, kind, soundId) {
      token = String(token || "").trim().toLowerCase();
      if (!token || seen[token]) return;
      seen[token] = true;
      out.push({ key: token, label: token, kind: kind || "hece", soundId: soundId || "" });
    }
    allSounds().forEach(function (s) {
      (s.fusions || []).forEach(function (f) {
        if (f.kind === "metin" || f.mode === "text") {
          if (f.mediaKey) add(f.mediaKey, "metin", s.id);
          return;
        }
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
    return allSounds().map(function (s) {
      return { key: s.id, label: s.letter, title: s.title, groupId: s.groupId || "" };
    });
  }

  function getGroup(id) {
    id = String(id || "").toLowerCase();
    for (var i = 0; i < GROUPS.length; i++) {
      if (GROUPS[i].id === id) return GROUPS[i];
    }
    return GROUPS[0] || null;
  }

  /** Admin’den kaldırılan birleştirmeler: { [soundId]: { [fusionId]: true } } */
  var removedFusions = {};

  function setRemovedFusions(map) {
    removedFusions = map && typeof map === "object" ? map : {};
  }

  function getRemovedFusions() {
    return removedFusions;
  }

  function isFusionRemoved(soundId, fusionId) {
    soundId = String(soundId || "").toLowerCase();
    fusionId = String(fusionId || "");
    return !!(removedFusions[soundId] && removedFusions[soundId][fusionId]);
  }

  function markFusionRemoved(soundId, fusionId) {
    soundId = String(soundId || "").toLowerCase();
    fusionId = String(fusionId || "");
    if (!soundId || !fusionId) return;
    if (!removedFusions[soundId]) removedFusions[soundId] = {};
    removedFusions[soundId][fusionId] = true;
  }

  function visibleFusions(sound) {
    if (!sound) return [];
    return (sound.fusions || []).filter(function (f) {
      return f && !isFusionRemoved(sound.id, f.id);
    });
  }

  function getSound(id) {
    id = String(id || "").toLowerCase();
    var list = allSounds();
    var raw = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        raw = list[i];
        break;
      }
    }
    if (!raw) return null;
    if (!removedFusions[raw.id]) return raw;
    return Object.assign({}, raw, { fusions: visibleFusions(raw) });
  }

  function getFusion(soundId, fusionId) {
    var s = getSound(soundId);
    if (!s) return null;
    for (var i = 0; i < (s.fusions || []).length; i++) {
      if (s.fusions[i].id === fusionId) return s.fusions[i];
    }
    return null;
  }

  /* Tüm kelime birleştirmelerini Türkçe hecelemeye çevir */
  GROUPS.forEach(function (g) {
    (g.sounds || []).forEach(function (s) {
      s.fusions = (s.fusions || []).map(normalizeFusion);
    });
  });

  global.NovaBirlestirelimData = {
    GROUP1_ID: "grup1",
    GROUP1_TITLE: "1. Grup Sesler",
    GROUP1_SUBTITLE: "A · N · E · T · İ · L",
    GROUP1_TAGLINE: "Maarif Modeli · Sesleri birleştirelim",
    GROUP1_SOUNDS: GROUP1_SOUNDS,
    GROUPS: GROUPS,
    allMediaKeys: allMediaKeys,
    allAudioSlots: allAudioSlots,
    letterKeys: letterKeys,
    allSounds: allSounds,
    getGroup: getGroup,
    getSound: getSound,
    getFusion: getFusion,
    setRemovedFusions: setRemovedFusions,
    getRemovedFusions: getRemovedFusions,
    markFusionRemoved: markFusionRemoved,
    isFusionRemoved: isFusionRemoved,
    visibleFusions: visibleFusions,
    syllabifyTR: syllabifyTR
  };
})(typeof window !== "undefined" ? window : globalThis);

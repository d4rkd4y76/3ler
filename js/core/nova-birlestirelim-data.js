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

  function wordFusion(result, opts) {
    opts = opts || {};
    result = String(result || "").toLocaleLowerCase("tr-TR");
    var syls = syllabifyTR(result);
    var letters = Array.from(result);

    if (syls.length <= 1) {
      if (letters.length <= 2) {
        return hece(letters[0] || "", letters[1] || "", {
          id: opts.id,
          mediaKey: opts.mediaKey === false ? false : opts.mediaKey || true,
          kind: "kelime",
          label: opts.label,
          narration: opts.narration,
          celebrate: opts.celebrate
        });
      }
      /* Tek heceli kapalı (CVC…): harfleri sırayla birleştir — hâlâ tek hece */
      var steps = [];
      var acc = letters[0];
      for (var i = 1; i < letters.length; i++) {
        if (i === 1) {
          steps.push([letters[0], letters[1]]);
          acc = letters[0] + letters[1];
        } else {
          steps.push([acc, letters[i]]);
          acc = acc + letters[i];
        }
      }
      var oMono = {
        id: opts.id || result,
        type: "kelime",
        mode: "chain",
        parts: letters,
        steps: steps,
        result: result,
        kind: "kelime",
        label: opts.label || letters.join(" + ") + " → " + result,
        narration: opts.narration || ("Şimdi " + result + " kelimesini birleştirelim!"),
        celebrate: opts.celebrate || ("Muhteşem! " + result + "!")
      };
      if (opts.mediaKey !== false) {
        oMono.mediaKey = opts.mediaKey && opts.mediaKey !== true ? opts.mediaKey : result;
      }
      return oMono;
    }

    /* Çok heceli: fi-de, a-na, an-ne */
    var syllables = syls.map(sylParts);
    var leftLabel = syls.join(" + ");
    var o = {
      id: opts.id || result,
      type: "kelime",
      mode: "syllables",
      parts: letters,
      syllables: syllables,
      steps: syllables.map(function (s) {
        return s.slice();
      }),
      result: result,
      kind: "kelime",
      label: opts.label || leftLabel + " → " + result,
      narration:
        syls.length === 2
          ? opts.narration || ("Önce " + syls[0] + ", sonra " + syls[1] + "; en sonda " + result + "!")
          : opts.narration || ("Heceleri birleştirelim: " + syls.join(" · ") + " → " + result + "!"),
      celebrate: opts.celebrate || ("Süper! " + result + " kelimesi!")
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
        syl("a", "n", "n", "e", "anne", {"narration":"Önce an, sonra ne; en sonda anne!","celebrate":"Muhteşem! Anne kelimesini okudun!"}),
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
        hece("i", "a"),
        hece("a", "i"),
        hece("i", "e"),
        hece("e", "i"),
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
        syl("ç", "i", "l", "i", "çili")
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
        syl("k", "ü", "b", "e", "kübe")
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
        syl("g", "ü", "n", "ü", "günü")
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
        chain("c", "a", "m", {"mediaKey":"cam","narration":"ca ile m: cam!","celebrate":"Harika! Cam kelimesi!"})
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
        chain("b", "e", "ş", {"mediaKey":"beş","narration":"be ile ş: beş!","celebrate":"Harika! Beş!"})
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
      tagline: "Üçüncü ses grubu",
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

  function getSound(id) {
    id = String(id || "").toLowerCase();
    var list = allSounds();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
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
    syllabifyTR: syllabifyTR
  };
})(typeof window !== "undefined" ? window : globalThis);

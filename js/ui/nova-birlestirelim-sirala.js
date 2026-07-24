/**
 * Ses Yuvası — Hece Avı / Kelime / Ejderha Yuvası içinde “sıra sende”
 * Hece: yuva = harf sırası. Kelime: yuva = hece sırası.
 * Cümle (o+): yuva = kelime sırası — Maarif 2. gruptan itibaren.
 */
(function (global) {
  "use strict";

  var SLOT_MAX = 5;
  var END_ACT_COUNT = 3;
  var POOL_MERGE_SRC = "assets/birles/ses_birlestirme.mp4?v=opt1";
  var POOL_BOOM_SRC = "assets/birles/ses_patlama.mp4?v=opt1";
  /* Ejderha Yuvası Sıra sende — ejderha mağara (ses/kelime havuzu değil) */
  var CUMLE_MERGE_SRC = "assets/birles/cumle_loop.mp4?v=opt1";
  var CUMLE_BOOM_SRC = "assets/birles/cumle_patlama.mp4?v=opt1";
  var ONCUL_MP3 =
    "https://dlxstore.b-cdn.net/SES%20SIRA%20SENDE%20%C3%96NC%C3%9CL.MP3";
  var ONCUL_23_MP3 = "https://dlxstore.b-cdn.net/SIRA%20SENDE%202-3.MP3";
  /* Maarif: duyduğunu yazma — ilk anlamlı kısa sözcükler (at, et) ile t sesinde başlar */
  var KELIME_SIRALA_START = "t";
  var KELIME_ONCUL_1 = "https://dlxstore.b-cdn.net/KEL%C4%B0MESON1.MP3";
  var KELIME_ONCUL_23 = "https://dlxstore.b-cdn.net/KEL%C4%B0MESON%202.MP3";
  /* Maarif TYMM: 1. grupta yalnız ses/hece/sözcük; 2. gruptan (o) itibaren cümle */
  var CUMLE_SIRALA_START = "o";
  var CUMLE_ONCUL_1 = KELIME_ONCUL_1;
  var CUMLE_ONCUL_23 = KELIME_ONCUL_23;

  var hostEl = null;
  var onDoneCb = null;
  var soundRef = null;
  var openToken = 0;
  var activityRef = null;
  var finishing = false;
  var placements = [];
  var dragState = null;
  var layoutBound = null;
  var instructAudio = null;
  var laneMode = false;
  var laneProgressText = "";
  var nextUnlocked = false;
  var introLock = false;
  var introSeq = 0;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normLabel(s) {
    return String(s || "")
      .trim()
      .toLocaleLowerCase("tr-TR");
  }

  function resolveAudio(token) {
    var t = normLabel(token);
    if (!t) return "";
    try {
      var KV = global.NovaKidsVoice;
      if (KV && typeof KV.resolveAudioUrl === "function") {
        var u = String(KV.resolveAudioUrl(t) || "").trim();
        if (u) return u;
      }
    } catch (_) {}
    return "";
  }

  function hashSeed(str) {
    var h = 2166136261;
    var s = String(str || "");
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seededShuffle(arr, seed) {
    var a = (arr || []).slice();
    var s = seed >>> 0;
    for (var i = a.length - 1; i > 0; i--) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      var j = s % (i + 1);
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function findGroupForSound(sound) {
    var D = global.NovaBirlestirelimData;
    if (!D || !D.GROUPS) return null;
    var sid = sound && sound.id;
    var gid = sound && (sound.groupId || sound.group);
    if (gid && D.getGroup) {
      var g0 = D.getGroup(gid);
      if (g0) return g0;
    }
    for (var i = 0; i < D.GROUPS.length; i++) {
      var g = D.GROUPS[i];
      var arr = (g && g.sounds) || [];
      for (var j = 0; j < arr.length; j++) {
        if (arr[j] && arr[j].id === sid) return g;
      }
    }
    return D.GROUPS[0] || null;
  }

  function unlockedLetters(sound) {
    var g = findGroupForSound(sound);
    var out = [];
    var seen = {};
    var arr = (g && g.sounds) || [];
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i];
      if (!s) continue;
      var L = normLabel(s.letter || s.id);
      if (L && !seen[L]) {
        seen[L] = true;
        out.push(L);
      }
      if (s.id === (sound && sound.id)) break;
    }
    if (!out.length && sound) {
      var one = normLabel(sound.letter || sound.id);
      if (one) out.push(one);
    }
    return out;
  }

  function fusionParts(f) {
    if (!f) return [];
    if (Array.isArray(f.parts) && f.parts.length) {
      return f.parts.map(function (p) {
        return normLabel(p);
      }).filter(Boolean);
    }
    if (Array.isArray(f.steps) && f.steps[0] && f.steps[0].length) {
      return f.steps[0].map(function (p) {
        return normLabel(p);
      }).filter(Boolean);
    }
    var r = normLabel(f.result || f.id);
    if (r.length === 2) return [r.charAt(0), r.charAt(1)];
    return [];
  }

  function isPureHeceFusion(f) {
    if (!f) return false;
    var kind = String(f.kind || f.type || "hece").toLowerCase();
    if (kind !== "hece") return false;
    if (f.mediaKey) return false;
    if (f.mode === "chain" || f.mode === "syllables" || f.mode === "simple") return false;
    if (kind === "kelime" || f.type === "kelime") return false;
    var parts = fusionParts(f);
    if (parts.length !== 2) return false;
    /* Her parça tek harf olmalı — “ke”+“k” (kek) gibi kelime parçaları elenir */
    if (parts[0].length !== 1 || parts[1].length !== 1) return false;
    var result = normLabel(f.result || parts.join(""));
    if (result.length !== 2) return false;
    if (result !== parts[0] + parts[1]) return false;
    return true;
  }

  function collectHeceCandidates(sound, heceList) {
    var seen = {};
    var out = [];
    function addFusion(f) {
      if (!isPureHeceFusion(f)) return;
      var parts = fusionParts(f);
      var result = normLabel(f.result || parts.join(""));
      if (!result || seen[result]) return;
      seen[result] = true;
      out.push({ result: result, parts: parts });
    }

    /* Sadece Hece Avı listesi */
    (heceList || []).forEach(addFusion);

    if (out.length >= END_ACT_COUNT) return out;

    /* Yetmezse aynı gruptaki önceki seslerin Hece Avı hecelerinden doldur */
    var g = findGroupForSound(sound);
    var arr = (g && g.sounds) || [];
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i];
      if (!s) continue;
      ((s.fusions) || []).forEach(function (f) {
        var kind = String((f && (f.kind || f.type)) || "hece").toLowerCase();
        if (kind === "hece" && !f.mediaKey) addFusion(f);
      });
      if (s.id === (sound && sound.id)) break;
      if (out.length >= END_ACT_COUNT * 2) break;
    }
    return out;
  }

  function pickEndHeces(sound, heceList) {
    var cands = collectHeceCandidates(sound, heceList);
    if (!cands.length) return [];
    var seed = hashSeed((sound && sound.id) || "x");
    var shuffled = seededShuffle(cands, seed);
    return shuffled.slice(0, Math.min(END_ACT_COUNT, shuffled.length));
  }

  function buildRackSounds(parts, sound) {
    var need = [];
    var seen = {};
    (parts || []).forEach(function (p) {
      var L = normLabel(p);
      if (!L || seen[L]) return;
      seen[L] = true;
      need.push(L);
    });
    var pool = unlockedLetters(sound).slice();
    var g = findGroupForSound(sound);
    ((g && g.sounds) || []).forEach(function (s) {
      var L = normLabel(s && (s.letter || s.id));
      if (L && pool.indexOf(L) < 0) pool.push(L);
    });
    var extras = seededShuffle(
      pool.filter(function (L) {
        return !seen[L];
      }),
      hashSeed(((sound && sound.id) || "") + ":" + need.join(""))
    );
    var labels = need.slice();
    for (var i = 0; i < extras.length && labels.length < SLOT_MAX; i++) {
      labels.push(extras[i]);
    }
    return labels.map(function (L) {
      return { label: L, audioUrl: resolveAudio(L) };
    });
  }

  /** Hece Avı sonunda 3 otomatik “Sıra sende” etkinliği */
  function buildEndActivities(sound, heceList) {
    var picked = pickEndHeces(sound, heceList);
    return picked.map(function (h, idx) {
      var sounds = buildRackSounds(h.parts, sound);
      return normalizeActivity(
        {
          id: "auto_" + ((sound && sound.id) || "x") + "_" + (idx + 1),
          title: "Sıra sende " + (idx + 1),
          result: h.result,
          resultAudioUrl: resolveAudio(h.result),
          correctOrder: h.parts.join(","),
          instructionAudioUrl: idx === 0 ? ONCUL_MP3 : ONCUL_23_MP3,
          endIndex: idx + 1,
          heceStep: 0,
          mode: "hece",
          sounds: sounds
        },
        idx
      );
    });
  }

  /**
   * Maarif Modeli: duyduğunu yazma, ANETİL’de ilk anlamlı kısa sözcüklerle
   * (at / et) t sesinde başlar → t ve sonraki tüm seslerde açılır.
   */
  function soundAllowsKelimeSirala(sound) {
    if (!sound) return false;
    var D = global.NovaBirlestirelimData;
    var groups = (D && D.GROUPS) || [];
    var pastStart = false;
    var sid = sound.id;
    for (var gi = 0; gi < groups.length; gi++) {
      var arr = (groups[gi] && groups[gi].sounds) || [];
      for (var si = 0; si < arr.length; si++) {
        var s = arr[si];
        if (!s) continue;
        var lid = normLabel(s.id || s.letter);
        if (lid === KELIME_SIRALA_START || s.id === KELIME_SIRALA_START) {
          pastStart = true;
        }
        if (s.id === sid) return pastStart;
      }
    }
    return false;
  }

  function isKelimeLaneFusion(f) {
    if (!f) return false;
    var kind = String(f.kind || f.type || "").toLowerCase();
    return kind === "kelime" || !!f.mediaKey;
  }

  /** Kelime → hece listesi (a-ta, an-ne…). Tek heceliler elenir. */
  function kelimeSyllableParts(f) {
    var result = normLabel((f && (f.say || f.result)) || "");
    if (!result) {
      var fp = fusionParts(f);
      result = normLabel(fp.join(""));
    }
    if (!result) return [];

    if (f && Array.isArray(f.displaySyllables) && f.displaySyllables.length >= 2) {
      return f.displaySyllables.map(normLabel).filter(Boolean);
    }
    if (f && Array.isArray(f.syllables) && f.syllables.length >= 2) {
      if (typeof f.syllables[0] === "string") {
        return f.syllables.map(normLabel).filter(Boolean);
      }
    }
    var D = global.NovaBirlestirelimData;
    if (D && typeof D.syllabifyTR === "function") {
      var syls = D.syllabifyTR(result) || [];
      if (syls.length >= 2) return syls.map(normLabel).filter(Boolean);
    }
    return [];
  }

  function collectKelimeCandidates(sound, kelimeList) {
    var seen = {};
    var out = [];

    function addFusion(f) {
      if (!isKelimeLaneFusion(f)) return;
      var result = normLabel((f && (f.say || f.result)) || "");
      if (!result) {
        var fp = fusionParts(f);
        result = normLabel(fp.join(""));
      }
      if (!result || seen[result]) return;
      var parts = kelimeSyllableParts(f);
      if (parts.length < 2 || parts.length > Math.min(4, SLOT_MAX)) return;
      seen[result] = true;
      out.push({ result: result, parts: parts });
    }

    (kelimeList || []).forEach(addFusion);
    if (out.length >= END_ACT_COUNT) return out;

    /* Yetmezse t’den bu sese kadar kelime adaylarından doldur */
    if (!soundAllowsKelimeSirala(sound)) return out;
    var D = global.NovaBirlestirelimData;
    var groups = (D && D.GROUPS) || [];
    var pastStart = false;
    for (var gi = 0; gi < groups.length; gi++) {
      var arr = (groups[gi] && groups[gi].sounds) || [];
      for (var si = 0; si < arr.length; si++) {
        var s = arr[si];
        if (!s) continue;
        var lid = normLabel(s.id || s.letter);
        if (lid === KELIME_SIRALA_START || s.id === KELIME_SIRALA_START) {
          pastStart = true;
        }
        if (!pastStart) continue;
        ((s.fusions) || []).forEach(addFusion);
        if (s.id === (sound && sound.id)) return out;
        if (out.length >= END_ACT_COUNT * 2) return out;
      }
    }
    return out;
  }

  function pickEndKelimes(sound, kelimeList) {
    var cands = collectKelimeCandidates(sound, kelimeList);
    if (!cands.length) return [];
    var seed = hashSeed("kelime:" + ((sound && sound.id) || "x"));
    var shuffled = seededShuffle(cands, seed);
    return shuffled.slice(0, Math.min(END_ACT_COUNT, shuffled.length));
  }

  /** Öğretilmiş hece havuzu — rafta çeldirici heceler için */
  function unlockedHeces(sound) {
    var out = [];
    var seen = {};
    function add(h) {
      var L = normLabel(h);
      if (!L || L.length < 1 || seen[L]) return;
      seen[L] = true;
      out.push(L);
    }
    var g = findGroupForSound(sound);
    var arr = (g && g.sounds) || [];
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i];
      if (!s) continue;
      ((s.fusions) || []).forEach(function (f) {
        if (isPureHeceFusion(f)) {
          add(f.result || fusionParts(f).join(""));
          return;
        }
        if (isKelimeLaneFusion(f)) {
          kelimeSyllableParts(f).forEach(add);
        }
      });
      if (s.id === (sound && sound.id)) break;
    }
    /* Önceki gruplardan da hece (t sonrası kelimeler için) */
    var D = global.NovaBirlestirelimData;
    var groups = (D && D.GROUPS) || [];
    for (var gi = 0; gi < groups.length; gi++) {
      var gs = groups[gi];
      if (g && gs && gs.id === g.id) break;
      ((gs && gs.sounds) || []).forEach(function (s2) {
        ((s2 && s2.fusions) || []).forEach(function (f2) {
          if (isPureHeceFusion(f2)) add(f2.result || fusionParts(f2).join(""));
          else if (isKelimeLaneFusion(f2)) kelimeSyllableParts(f2).forEach(add);
        });
      });
    }
    return out;
  }

  /** Rafta heceler (tekrarlı hece varsa iki kez) + çeldirici heceler */
  function buildKelimeRackSounds(parts, sound) {
    var labels = [];
    var seenUnique = {};
    (parts || []).forEach(function (p) {
      var L = normLabel(p);
      if (!L) return;
      labels.push(L);
      seenUnique[L] = true;
    });
    var pool = unlockedHeces(sound);
    var extras = seededShuffle(
      pool.filter(function (L) {
        return !seenUnique[L] && String(L).length >= 2;
      }),
      hashSeed("kw:" + ((sound && sound.id) || "") + ":" + labels.join(""))
    );
    if (extras.length < SLOT_MAX - labels.length) {
      var more = seededShuffle(
        pool.filter(function (L) {
          return !seenUnique[L] && extras.indexOf(L) < 0;
        }),
        hashSeed("kw2:" + ((sound && sound.id) || "") + ":" + labels.join(""))
      );
      extras = extras.concat(more);
    }
    for (var i = 0; i < extras.length && labels.length < SLOT_MAX; i++) {
      labels.push(extras[i]);
    }
    return labels.map(function (L) {
      return { label: L, audioUrl: resolveAudio(L) };
    });
  }

  /** Kelime Bahçesi sonunda 3 otomatik “Sıra sende / duyduğunu yaz” (hece sırala) */
  function buildEndKelimeActivities(sound, kelimeList) {
    if (!soundAllowsKelimeSirala(sound)) return [];
    var picked = pickEndKelimes(sound, kelimeList);
    return picked.map(function (w, idx) {
      var sounds = buildKelimeRackSounds(w.parts, sound);
      return normalizeActivity(
        {
          id: "auto_kelime_" + ((sound && sound.id) || "x") + "_" + (idx + 1),
          title: "Sıra sende " + (idx + 1),
          result: w.result,
          resultAudioUrl: resolveAudio(w.result),
          correctOrder: w.parts.join(","),
          instructionAudioUrl: idx === 0 ? KELIME_ONCUL_1 : KELIME_ONCUL_23,
          endIndex: idx + 1,
          heceStep: 0,
          mode: "kelime",
          sounds: sounds
        },
        idx
      );
    });
  }

  /**
   * Maarif TYMM: 1. harf grubunda cümle yok; 2. gruptan (o) itibaren cümle.
   * Ejderha Yuvası sonunda kelime sıralama (boş yuvalara doğru sıra).
   */
  function soundAllowsCumleSirala(sound) {
    if (!sound) return false;
    var D = global.NovaBirlestirelimData;
    var groups = (D && D.GROUPS) || [];
    var pastStart = false;
    var sid = sound.id;
    for (var gi = 0; gi < groups.length; gi++) {
      var arr = (groups[gi] && groups[gi].sounds) || [];
      for (var si = 0; si < arr.length; si++) {
        var s = arr[si];
        if (!s) continue;
        var lid = normLabel(s.id || s.letter);
        if (lid === CUMLE_SIRALA_START || s.id === CUMLE_SIRALA_START) {
          pastStart = true;
        }
        if (s.id === sid) return pastStart;
      }
    }
    return false;
  }

  function isCumleLaneFusion(f) {
    if (!f) return false;
    var kind = String(f.kind || f.type || "").toLowerCase();
    return kind === "cumle" || f.mode === "sentence";
  }

  /** Cümle → kelime parçaları (gösterim + ses anahtarı). Virgül gösterime alınmaz. */
  function cumleWordParts(f) {
    var words = (f && f.words) || [];
    var out = [];
    if (words.length) {
      words.forEach(function (w) {
        var say = normLabel((w && (w.say || w.text)) || "");
        if (!say) return;
        var label = String((w && (w.text || w.say)) || "")
          .trim()
          .replace(/^[,;:]+|[,;:.!?]+$/g, "");
        if (!label) label = say;
        out.push({ say: say, label: label });
      });
      return out;
    }
    var raw = String((f && (f.result || f.label)) || "")
      .replace(/[.!?]+$/g, "")
      .trim();
    if (!raw) return [];
    raw.split(/\s+/).forEach(function (tok) {
      var label = String(tok || "")
        .trim()
        .replace(/^[,;:]+|[,;:.!?]+$/g, "");
      var say = normLabel(label);
      if (!say) return;
      out.push({ say: say, label: label || say });
    });
    return out;
  }

  function collectCumleCandidates(sound, cumleList) {
    var seen = {};
    var out = [];

    function addFusion(f) {
      if (!isCumleLaneFusion(f)) return;
      var parts = cumleWordParts(f);
      if (parts.length < 2 || parts.length > SLOT_MAX) return;
      var result = String((f && f.result) || "")
        .trim()
        .replace(/[.!?]+$/g, "");
      if (!result) {
        result = parts
          .map(function (p) {
            return p.label;
          })
          .join(" ");
      }
      var key = parts
        .map(function (p) {
          return p.say;
        })
        .join("|");
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push({
        result: /[.!?]$/.test(String((f && f.result) || "").trim())
          ? String(f.result).trim()
          : result + ".",
        parts: parts
      });
    }

    (cumleList || []).forEach(addFusion);
    if (out.length >= END_ACT_COUNT) return out;

    if (!soundAllowsCumleSirala(sound)) return out;
    var D = global.NovaBirlestirelimData;
    var groups = (D && D.GROUPS) || [];
    var pastStart = false;
    for (var gi = 0; gi < groups.length; gi++) {
      var arr = (groups[gi] && groups[gi].sounds) || [];
      for (var si = 0; si < arr.length; si++) {
        var s = arr[si];
        if (!s) continue;
        var lid = normLabel(s.id || s.letter);
        if (lid === CUMLE_SIRALA_START || s.id === CUMLE_SIRALA_START) {
          pastStart = true;
        }
        if (!pastStart) continue;
        ((s.fusions) || []).forEach(addFusion);
        if (s.id === (sound && sound.id)) return out;
        if (out.length >= END_ACT_COUNT * 2) return out;
      }
    }
    return out;
  }

  function pickEndCumles(sound, cumleList) {
    var cands = collectCumleCandidates(sound, cumleList);
    if (!cands.length) return [];
    var seed = hashSeed("cumle:" + ((sound && sound.id) || "x"));
    var shuffled = seededShuffle(cands, seed);
    return shuffled.slice(0, Math.min(END_ACT_COUNT, shuffled.length));
  }

  /** Rafta yalnızca cümlenin kelimeleri (karışık) — çeldirici yok */
  function buildCumleRackSounds(parts) {
    return (parts || []).map(function (p) {
      var say = p && p.say ? p.say : normLabel(p && p.label);
      var label = (p && p.label) || say;
      return { label: label, audioUrl: resolveAudio(say) };
    });
  }

  /** Ejderha Yuvası sonunda 3 otomatik “Sıra sende” (kelime sırala) — o+ */
  function buildEndCumleActivities(sound, cumleList) {
    if (!soundAllowsCumleSirala(sound)) return [];
    var picked = pickEndCumles(sound, cumleList);
    return picked.map(function (c, idx) {
      var sounds = buildCumleRackSounds(c.parts);
      var orderSays = c.parts.map(function (p) {
        return p.say;
      });
      return normalizeActivity(
        {
          id: "auto_cumle_" + ((sound && sound.id) || "x") + "_" + (idx + 1),
          title: "Sıra sende " + (idx + 1),
          result: c.result,
          resultAudioUrl: resolveAudio(
            String(c.result || "")
              .replace(/[.!?]+$/g, "")
              .trim()
          ),
          correctOrder: orderSays.join(","),
          instructionAudioUrl: idx === 0 ? CUMLE_ONCUL_1 : CUMLE_ONCUL_23,
          endIndex: idx + 1,
          heceStep: 0,
          mode: "cumle",
          sounds: sounds
        },
        idx
      );
    });
  }

  function normalizeSound(row) {
    var r = row && typeof row === "object" ? row : {};
    return {
      label: String(r.label || r.text || r.token || "").trim(),
      audioUrl: String(r.audioUrl || r.mp3 || r.url || "").trim()
    };
  }

  function parseCorrectOrder(raw, sounds) {
    var out = [];
    if (Array.isArray(raw)) {
      raw.forEach(function (x) {
        var t = String(x || "").trim();
        if (t) out.push(t);
      });
    } else if (raw != null && String(raw).trim()) {
      String(raw)
        .split(/[,;]+/)
        .forEach(function (p) {
          var t = p.trim();
          if (t) out.push(t);
        });
    }
    if (out.length) return out;
    return (sounds || [])
      .map(function (s) {
        return s.label;
      })
      .filter(Boolean);
  }

  function normalizeActivity(raw, idx) {
    var row = raw && typeof raw === "object" ? raw : {};
    var soundsIn = Array.isArray(row.sounds) ? row.sounds : Array.isArray(row.slots) ? row.slots : [];
    var mode = String(row.mode || "").trim().toLowerCase();
    if (mode !== "kelime" && mode !== "cumle") mode = "hece";
    var slotCap = Math.max(SLOT_MAX, soundsIn.length || 0);
    if (mode === "cumle") slotCap = Math.max(slotCap, SLOT_MAX);
    var sounds = [];
    for (var i = 0; i < slotCap; i++) {
      var s = normalizeSound(soundsIn[i]);
      if (s.label || s.audioUrl) sounds.push(s);
    }
    var correctOrder = parseCorrectOrder(row.correctOrder || row.order || row.nests, sounds);
    var heceStep = parseInt(row.heceStep, 10);
    if (!isFinite(heceStep) || heceStep < 1) heceStep = 0;
    var endIndex = parseInt(row.endIndex, 10);
    if (!isFinite(endIndex) || endIndex < 1) {
      var idm = String(row.id || "").match(/_(\d+)$/);
      endIndex = idm ? parseInt(idm[1], 10) : idx + 1;
    }
    if (!isFinite(endIndex) || endIndex < 1) endIndex = idx + 1;
    return {
      id: String(row.id || "s" + (idx + 1)).trim() || "s" + (idx + 1),
      title: String(row.title || "").trim(),
      result: String(row.result || row.title || "").trim(),
      resultAudioUrl: String(
        row.resultAudioUrl || row.resultUrl || row.heceAudioUrl || ""
      ).trim(),
      heceStep: heceStep,
      endIndex: endIndex,
      mode: mode,
      correctOrder: correctOrder,
      instructionAudioUrl: String(
        row.instructionAudioUrl || row.instructionUrl || row.promptAudioUrl || ""
      ).trim(),
      sounds: sounds
    };
  }

  function listActivities(pack) {
    var k = pack && pack.sirala;
    if (!k || typeof k !== "object") return [];
    var list = Array.isArray(k.activities) ? k.activities : [];
    if (!list.length && Array.isArray(k.sounds)) list = [k];
    return list
      .map(function (a, i) {
        return normalizeActivity(a, i);
      })
      .filter(function (a) {
        return a.sounds.length >= 2 && a.correctOrder.length >= 2;
      });
  }

  function hasSirala(pack) {
    return listActivities(pack).length > 0;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  var sfxCtx = null;

  function ensureSfxCtx() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!sfxCtx) sfxCtx = new AC();
    if (sfxCtx.state === "suspended") {
      try {
        sfxCtx.resume();
      } catch (_) {}
    }
    return sfxCtx;
  }

  /** Yüksek, net tik — doğru yerleştirme */
  function playCorrectTickSfx() {
    var ctx = ensureSfxCtx();
    if (!ctx) return;
    var t0 = ctx.currentTime;
    function ping(freq, delay, gainPeak, dur) {
      var osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t0 + delay);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0 + delay);
      g.gain.exponentialRampToValueAtTime(gainPeak, t0 + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0 + delay);
      osc.stop(t0 + delay + dur + 0.02);
    }
    /* Kısa tık + parlak tik */
    ping(1200, 0, 0.72, 0.09);
    ping(1680, 0.05, 0.58, 0.12);
    ping(2100, 0.11, 0.4, 0.14);
    ping(2640, 0.18, 0.28, 0.11);
  }

  /** Yüksek cız / buzz — yanlış yerleştirme */
  function playWrongBuzzSfx() {
    var ctx = ensureSfxCtx();
    if (!ctx) return;
    var t0 = ctx.currentTime;
    function buzz(type, freqStart, freqEnd, delay, gainPeak, dur) {
      var osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, t0 + delay);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t0 + delay + dur);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0 + delay);
      g.gain.exponentialRampToValueAtTime(gainPeak, t0 + delay + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0 + delay);
      osc.stop(t0 + delay + dur + 0.03);
    }
    buzz("sawtooth", 420, 110, 0, 0.62, 0.22);
    buzz("square", 280, 90, 0.08, 0.48, 0.2);
    buzz("triangle", 180, 70, 0.16, 0.38, 0.18);
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function showCorrectMarks() {
    if (!hostEl) return;
    hostEl.querySelectorAll(".birles-sirala__nest.is-filled").forEach(function (nest) {
      nest.classList.remove("is-wrong");
      nest.classList.add("is-correct");
      var oldX = nest.querySelector(".birles-sirala__nest-x");
      if (oldX) oldX.remove();
      if (!nest.querySelector(".birles-sirala__nest-check")) {
        var mark = document.createElement("span");
        mark.className = "birles-sirala__nest-check";
        mark.setAttribute("aria-hidden", "true");
        mark.textContent = "✓";
        nest.appendChild(mark);
      }
      var chip = nest.querySelector(".birles-sirala__chip");
      if (chip) {
        chip.classList.remove("is-wrong");
        chip.classList.add("is-correct");
      }
    });
  }

  function showWrongMarks() {
    if (!hostEl) return;
    hostEl.querySelectorAll(".birles-sirala__nest.is-filled").forEach(function (nest) {
      nest.classList.remove("is-correct");
      nest.classList.add("is-wrong");
      var oldCheck = nest.querySelector(".birles-sirala__nest-check");
      if (oldCheck) oldCheck.remove();
      if (!nest.querySelector(".birles-sirala__nest-x")) {
        var mark = document.createElement("span");
        mark.className = "birles-sirala__nest-x";
        mark.setAttribute("aria-hidden", "true");
        mark.textContent = "✕";
        nest.appendChild(mark);
      }
      var chip = nest.querySelector(".birles-sirala__chip");
      if (chip) {
        chip.classList.remove("is-correct");
        chip.classList.add("is-wrong");
      }
    });
  }

  function stopInstruct() {
    if (instructAudio) {
      try {
        instructAudio.pause();
        instructAudio.removeAttribute("src");
        instructAudio.load();
      } catch (_) {}
      instructAudio = null;
    }
  }

  function playUrl(url) {
    stopInstruct();
    if (!url) return Promise.resolve();
    return new Promise(function (resolve) {
      var a = new Audio();
      instructAudio = a;
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }
      a.addEventListener("ended", finish, { once: true });
      a.addEventListener("error", finish, { once: true });
      a.src = url;
      var p = a.play();
      if (p && typeof p.catch === "function") p.catch(finish);
      setTimeout(finish, 30000);
    });
  }

  function softPause(v) {
    if (!v) return;
    try {
      v.pause();
    } catch (_) {}
  }

  function viewportSize() {
    var w = Math.max(window.innerWidth || 0, 1);
    var h = Math.max(window.innerHeight || 0, 1);
    try {
      var vv = window.visualViewport;
      if (vv && vv.width > 0 && vv.height > 0) {
        w = Math.max(w, Math.ceil(vv.width));
        h = Math.max(h, Math.ceil(vv.height));
      }
    } catch (_) {}
    return { w: w, h: h };
  }

  function layoutStage() {
    if (!hostEl) return;
    var box = hostEl.querySelector(".birles-sirala__stagebox");
    if (!box) return;
    var vp = viewportSize();
    var w = vp.w;
    var h = Math.round((vp.w * 16) / 9);
    if (h < vp.h) {
      h = vp.h;
      w = Math.round((vp.h * 9) / 16);
    }
    if (w < vp.w) w = vp.w;
    if (h < vp.h) h = vp.h;
    w += 6;
    h += 6;
    box.style.position = "absolute";
    box.style.left = "50%";
    box.style.top = "50%";
    box.style.width = w + "px";
    box.style.height = h + "px";
    box.style.transform = "translate(-50%, -50%)";
  }

  function bindLayout() {
    unbindLayout();
    layoutBound = function () {
      layoutStage();
    };
    window.addEventListener("resize", layoutBound);
    window.addEventListener("orientationchange", layoutBound);
    try {
      if (window.visualViewport) window.visualViewport.addEventListener("resize", layoutBound);
    } catch (_) {}
  }

  function unbindLayout() {
    if (!layoutBound) return;
    window.removeEventListener("resize", layoutBound);
    window.removeEventListener("orientationchange", layoutBound);
    try {
      if (window.visualViewport) window.visualViewport.removeEventListener("resize", layoutBound);
    } catch (_) {}
    layoutBound = null;
  }

  function setPoolFs(on) {
    try {
      document.body.classList.toggle("birles-sirala-fs", !!on);
      if (typeof window.novaSyncPerfRuntime === "function") {
        window.novaSyncPerfRuntime();
      } else if (on) {
        document.body.style.zoom = "1";
      }
    } catch (_) {}
  }

  function nestCount() {
    return (activityRef && activityRef.correctOrder && activityRef.correctOrder.length) || 0;
  }

  function filledCount() {
    var n = 0;
    for (var i = 0; i < placements.length; i++) {
      if (placements[i] != null) n++;
    }
    return n;
  }

  function setNextEnabled(on) {
    nextUnlocked = !!on;
    if (!hostEl) return;
    var next = hostEl.querySelector("#birles-sirala-next");
    if (!next) return;
    if (on) {
      next.disabled = false;
      next.classList.remove("is-locked");
      next.setAttribute("aria-disabled", "false");
      next.textContent = "İlerle";
      next.removeAttribute("title");
    } else {
      next.disabled = true;
      next.classList.add("is-locked");
      next.setAttribute("aria-disabled", "true");
      next.textContent = "Bekle";
      next.setAttribute("title", "Gösterim bitince açılır");
    }
  }

  function dockHtml() {
    var prog = laneProgressText || "·";
    return (
      '<div class="birles-fs-dock" id="birles-sirala-dock" role="toolbar" aria-label="Oyun kontrolleri">' +
      '  <div class="birles-fs-dock__bar">' +
      '    <span class="birles-fs-dock__prog" aria-live="polite">' +
      esc(prog) +
      "</span>" +
      '    <div class="birles-fs-dock__actions">' +
      '      <button type="button" class="birles-fs-dock__btn birles-fs-dock__btn--replay" id="birles-sirala-replay" aria-label="Tekrar" title="Tekrar">🔁</button>' +
      '      <button type="button" class="birles-fs-dock__btn birles-fs-dock__btn--soft" id="birles-sirala-all">Tümü</button>' +
      '      <button type="button" class="birles-fs-dock__btn birles-fs-dock__btn--go is-locked" id="birles-sirala-next" disabled aria-disabled="true" title="Gösterim bitince açılır">Bekle</button>' +
      "    </div>" +
      "  </div>" +
      "</div>"
    );
  }

  function bindDock() {
    if (!hostEl) return;
    var replay = hostEl.querySelector("#birles-sirala-replay");
    var allBtn = hostEl.querySelector("#birles-sirala-all");
    var next = hostEl.querySelector("#birles-sirala-next");
    if (replay) {
      replay.addEventListener("click", function () {
        if (finishing && !nextUnlocked) return;
        mountActivity();
      });
    }
    if (allBtn) {
      allBtn.addEventListener("click", function () {
        var cb = onDoneCb;
        close();
        if (typeof cb === "function") cb({ success: false, goGallery: true });
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        if (!nextUnlocked) return;
        finishSuccess();
      });
    }
  }

  function restoreChipToRack(chip, beforeEl) {
    if (!chip || !hostEl) return;
    chip.classList.remove("is-dragging", "is-lifted", "is-placed");
    chip.style.cssText = "";
    var rack = hostEl.querySelector(".birles-sirala__rack");
    if (!rack) return;
    if (beforeEl && beforeEl.parentNode === rack) {
      rack.insertBefore(chip, beforeEl);
    } else {
      rack.appendChild(chip);
    }
  }

  function endDrag(cancel) {
    if (!dragState) return;
    try {
      if (dragState.capEl && dragState.pointerId != null) {
        dragState.capEl.releasePointerCapture(dragState.pointerId);
      }
    } catch (_) {}

    var chip = dragState.chip;
    var ph = dragState.placeholder;
    var nestI = dragState.nestI;
    var soundI = dragState.soundI;

    dragState = null;
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("pointerup", onPointerUp, true);
    document.removeEventListener("pointercancel", onPointerUp, true);

    if (hostEl) {
      hostEl.querySelectorAll(".birles-sirala__nest.is-target").forEach(function (n) {
        n.classList.remove("is-target");
      });
    }

    if (chip) {
      chip.classList.remove("is-dragging", "is-lifted");
      chip.style.cssText = "";
    }

    if (!cancel && nestI != null && soundI != null && chip) {
      if (ph && ph.parentNode) ph.parentNode.removeChild(ph);
      placeChipInNest(soundI, nestI, chip);
    } else if (chip) {
      if (ph && ph.parentNode) {
        restoreChipToRack(chip, ph);
        ph.parentNode.removeChild(ph);
      } else {
        restoreChipToRack(chip);
      }
    } else if (ph && ph.parentNode) {
      ph.parentNode.removeChild(ph);
    }
  }

  function close() {
    openToken += 1;
    introSeq += 1;
    introLock = false;
    finishing = false;
    nextUnlocked = false;
    stopInstruct();
    unbindLayout();
    endDrag(true);
    setPoolFs(false);
    if (hostEl && hostEl.parentNode) hostEl.parentNode.removeChild(hostEl);
    hostEl = null;
    soundRef = null;
    onDoneCb = null;
    activityRef = null;
    placements = [];
    laneMode = false;
    laneProgressText = "";
  }

  function hardCutBoom(on) {
    if (!hostEl) return;
    var mergeL = hostEl.querySelector(".birles-sirala__layer--merge");
    var boomL = hostEl.querySelector(".birles-sirala__layer--boom");
    if (mergeL) mergeL.style.opacity = on ? "0" : "1";
    if (boomL) boomL.style.opacity = on ? "1" : "0";
  }

  function waitBoomEnded(boom) {
    return new Promise(function (resolve) {
      var finished = false;
      function done() {
        if (finished) return;
        finished = true;
        resolve();
      }
      if (!boom) {
        done();
        return;
      }
      function onEnded() {
        boom.removeEventListener("ended", onEnded);
        done();
      }
      boom.addEventListener("ended", onEnded);
      setTimeout(done, 12000);
    });
  }

  /** Patlama videosunda progress (0–1) oranına gelince resolve — zirve anı */
  function waitBoomAtProgress(boom, progress) {
    progress = Math.max(0.05, Math.min(0.95, Number(progress) || 0.4));
    var fallbackMs = Math.round(5080 * progress);
    return new Promise(function (resolve) {
      var finished = false;
      var started = Date.now();
      function done() {
        if (finished) return;
        finished = true;
        resolve();
      }
      function cleanup() {
        if (!boom) return;
        boom.removeEventListener("ended", onEnded);
        boom.removeEventListener("timeupdate", onTime);
        boom.removeEventListener("loadedmetadata", onMeta);
      }
      function onEnded() {
        cleanup();
        done();
      }
      function check() {
        if (!hostEl) {
          cleanup();
          done();
          return;
        }
        var d = boom && boom.duration;
        if (d && isFinite(d) && d > 0 && boom.currentTime >= d * progress) {
          cleanup();
          done();
          return;
        }
        /* Telefonda duration/timeupdate gecikebilir — duvar saati yedek */
        if (Date.now() - started >= fallbackMs) {
          cleanup();
          done();
        }
      }
      function onTime() {
        check();
      }
      function onMeta() {
        check();
      }
      if (!boom) {
        done();
        return;
      }
      if (boom.ended) {
        done();
        return;
      }
      boom.addEventListener("ended", onEnded);
      boom.addEventListener("timeupdate", onTime);
      boom.addEventListener("loadedmetadata", onMeta);
      check();
      setTimeout(function () {
        cleanup();
        done();
      }, Math.max(fallbackMs + 800, 3500));
    });
  }

  async function playCumleResultVoice() {
    if (!activityRef) return;
    var order = activityRef.correctOrder || [];
    var sounds = activityRef.sounds || [];
    var played = false;

    async function speakOne(token, fallbackUrl) {
      var t = String(token || "").trim();
      var url =
        String(fallbackUrl || "").trim() ||
        resolveAudio(t) ||
        resolveAudio(normLabel(t));
      if (!url) return false;
      await playUrl(url);
      return true;
    }

    for (var i = 0; i < order.length; i++) {
      if (!hostEl) return;
      var tok = order[i];
      var match = null;
      for (var j = 0; j < sounds.length; j++) {
        var s = sounds[j];
        if (!s) continue;
        if (normLabel(s.label) === normLabel(tok)) {
          match = s;
          break;
        }
      }
      var ok = await speakOne(tok, match && match.audioUrl);
      if (ok) played = true;
      await sleep(140);
    }

    if (!played) {
      var full = String(activityRef.resultAudioUrl || "").trim();
      if (!full && activityRef.result) {
        full = resolveAudio(
          String(activityRef.result || "")
            .replace(/[.!?]+$/g, "")
            .trim()
        );
      }
      if (full) await playUrl(full);
    }
  }

  async function playFinale() {
    if (!hostEl || finishing || !activityRef) return;
    finishing = true;
    hostEl.classList.add("is-done");

    var merge = hostEl.querySelector(".birles-sirala__vid--merge");
    var boom = hostEl.querySelector(".birles-sirala__vid--boom");
    var burst = hostEl.querySelector(".birles-sirala__burst");
    var flash = hostEl.querySelector(".birles-sirala__flash");
    var board = hostEl.querySelector(".birles-sirala__board");
    var isCumleFinale = activityRef.mode === "cumle";

    if (board) board.classList.add("is-finale");
    softPause(merge);

    if (boom) {
      boom.removeAttribute("hidden");
      boom.muted = false;
      boom.loop = false;
      try {
        boom.volume = 1;
      } catch (_) {}
      try {
        boom.currentTime = 0;
      } catch (_) {}
    }
    hardCutBoom(true);

    if (flash) {
      flash.hidden = false;
      flash.classList.remove("is-on");
      void flash.offsetWidth;
      flash.classList.add("is-on");
    }

    if (boom) {
      try {
        await boom.play();
      } catch (_) {
        try {
          boom.muted = true;
          await boom.play();
          boom.muted = false;
        } catch (_) {}
      }
    }

    /* Cümle: metin patlamanın zirvesinde; diğerleri kısa gecikme */
    if (isCumleFinale) {
      await waitBoomAtProgress(boom, 0.44);
    } else {
      await new Promise(function (r) {
        setTimeout(r, 620);
      });
    }
    if (!hostEl) return;

    var word = activityRef.result || activityRef.title || "";
    if (!word) {
      word = activityRef.correctOrder.join(isCumleFinale ? " " : "");
    }
    if (burst) {
      burst.hidden = false;
      burst.style.opacity = "1";
      burst.style.visibility = "visible";
      burst.innerHTML =
        '<span class="birles-sirala__burst-chip' +
        (isCumleFinale ? " birles-sirala__burst-chip--cumle" : "") +
        '">' +
        esc(word) +
        "</span>";
      burst.classList.remove("is-boom-in");
      void burst.offsetWidth;
      burst.classList.add("is-boom-in");
    }

    /* Cümle: kelime kelime sesli oku (tam cümle MP3 yok) — patlama sesini kıs */
    if (isCumleFinale) {
      if (boom) {
        try {
          boom.volume = 0.22;
        } catch (_) {}
      }
      try {
        await playCumleResultVoice();
      } catch (_) {}
    } else {
      var resultAudio = String(activityRef.resultAudioUrl || "").trim();
      if (resultAudio) {
        try {
          playUrl(resultAudio);
        } catch (_) {}
      }
    }

    await waitBoomEnded(boom);
    if (!hostEl) return;

    softPause(boom);
    if (flash) {
      flash.classList.remove("is-on");
      flash.hidden = true;
    }

    setNextEnabled(true);
  }

  function finishSuccess() {
    var cb = onDoneCb;
    close();
    if (typeof cb === "function") cb({ success: true });
  }

  async function runSuccessSequence() {
    if (!hostEl || !activityRef || finishing) return;
    introLock = true;
    hostEl.classList.add("is-success-hold");

    showCorrectMarks();
    try {
      playCorrectTickSfx();
    } catch (_) {}
    await sleep(950);
    if (!hostEl) return;

    hostEl.classList.remove("is-success-hold");
    await playFinale();
  }

  async function runWrongSequence() {
    if (!hostEl || !activityRef || finishing) return;
    introLock = true;
    hostEl.classList.add("is-success-hold");

    showWrongMarks();
    var nests = hostEl.querySelector(".birles-sirala__nests");
    if (nests) {
      nests.classList.remove("is-shake");
      void nests.offsetWidth;
      nests.classList.add("is-shake");
    }
    try {
      playWrongBuzzSfx();
    } catch (_) {}
    await sleep(900);
    if (!hostEl || finishing) return;

    hostEl.classList.remove("is-success-hold");
    introLock = false;
    resetPlacements();
  }

  function checkComplete() {
    if (!activityRef || finishing) return;
    var order = activityRef.correctOrder;
    if (filledCount() < order.length) return;

    var ok = true;
    for (var i = 0; i < order.length; i++) {
      var soundI = placements[i];
      if (soundI == null) {
        ok = false;
        break;
      }
      var lab = activityRef.sounds[soundI] && activityRef.sounds[soundI].label;
      if (normLabel(lab) !== normLabel(order[i])) {
        ok = false;
        break;
      }
    }

    if (ok) {
      runSuccessSequence();
      return;
    }

    runWrongSequence();
  }

  function resetPlacements() {
    if (!activityRef || !hostEl) return;
    var n = nestCount();
    placements = [];
    for (var i = 0; i < n; i++) placements.push(null);
    hostEl.querySelectorAll(".birles-sirala__nest").forEach(function (nest) {
      nest.classList.remove("is-filled", "is-correct", "is-wrong");
      var check = nest.querySelector(".birles-sirala__nest-check");
      if (check) check.remove();
      var xMark = nest.querySelector(".birles-sirala__nest-x");
      if (xMark) xMark.remove();
      var slot = nest.querySelector(".birles-sirala__nest-slot");
      if (slot) slot.innerHTML = "";
    });
    var rack = hostEl.querySelector(".birles-sirala__rack");
    if (rack) {
      var order = shuffle(
        activityRef.sounds.map(function (_, i) {
          return i;
        })
      );
      rack.innerHTML = rackHtml(order);
      bindChips();
    }
  }

  function placeChipInNest(soundI, nestI, chipEl) {
    if (!activityRef || finishing || introLock || !hostEl) return;
    var n = nestCount();
    if (nestI < 0 || nestI >= n) return;
    if (placements[nestI] != null) return;

    for (var i = 0; i < placements.length; i++) {
      if (placements[i] === soundI) {
        placements[i] = null;
        var oldNest = hostEl.querySelector('.birles-sirala__nest[data-nest="' + i + '"]');
        if (oldNest) {
          oldNest.classList.remove("is-filled", "is-correct");
          var os = oldNest.querySelector(".birles-sirala__nest-slot");
          if (os) os.innerHTML = "";
          var oldCheck = oldNest.querySelector(".birles-sirala__nest-check");
          if (oldCheck) oldCheck.remove();
        }
      }
    }

    placements[nestI] = soundI;
    var nest = hostEl.querySelector('.birles-sirala__nest[data-nest="' + nestI + '"]');
    var chip =
      chipEl ||
      (hostEl &&
        hostEl.querySelector('.birles-sirala__chip[data-sound-i="' + soundI + '"]')) ||
      document.querySelector(
        '#birles-sirala-overlay .birles-sirala__chip.is-lifted[data-sound-i="' + soundI + '"]'
      );
    if (nest && chip) {
      nest.classList.add("is-filled");
      var slot = nest.querySelector(".birles-sirala__nest-slot");
      if (slot) {
        chip.classList.add("is-placed");
        chip.classList.remove("is-dragging", "is-lifted");
        chip.style.cssText = "";
        slot.appendChild(chip);
      }
    }

    var s = activityRef.sounds[soundI];
    var chipUrl = (s && s.audioUrl) || resolveAudio(s && s.label);
    var shouldEvaluate = filledCount() >= nestCount();
    if (shouldEvaluate) introLock = true;

    /* Önce harf sesi bitsin, sonra doğruluk / patlama */
    Promise.resolve()
      .then(function () {
        return chipUrl ? playUrl(chipUrl) : null;
      })
      .then(function () {
        if (!hostEl || finishing) return;
        if (shouldEvaluate) checkComplete();
        else introLock = false;
      })
      .catch(function () {
        if (!hostEl || finishing) return;
        if (shouldEvaluate) checkComplete();
        else introLock = false;
      });
  }

  function nestAtPoint(x, y) {
    if (!hostEl) return null;
    var nests = hostEl.querySelectorAll(".birles-sirala__nest:not(.is-filled)");
    for (var i = 0; i < nests.length; i++) {
      var r = nests[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return Number(nests[i].getAttribute("data-nest"));
      }
    }
    return null;
  }

  function moveLifted(x, y) {
    if (!dragState || !dragState.chip) return;
    dragState.chip.style.left = x - dragState.ox + "px";
    dragState.chip.style.top = y - dragState.oy + "px";
  }

  function onPointerMove(e) {
    if (!dragState) return;
    if (dragState.pointerId != null && e.pointerId !== dragState.pointerId) return;
    e.preventDefault();
    moveLifted(e.clientX, e.clientY);
    var nestI = nestAtPoint(e.clientX, e.clientY);
    dragState.nestI = nestI;
    if (hostEl) {
      hostEl.querySelectorAll(".birles-sirala__nest").forEach(function (el) {
        var i = Number(el.getAttribute("data-nest"));
        el.classList.toggle("is-target", nestI === i);
      });
    }
  }

  function onPointerUp(e) {
    if (!dragState) return;
    if (dragState.pointerId != null && e.pointerId !== dragState.pointerId) return;
    if (e && e.clientX != null) {
      dragState.nestI = nestAtPoint(e.clientX, e.clientY);
    }
    endDrag(false);
  }

  /** Gerçek kutuyu kaldır — yerinde sabit boşluk, diğerleri kaymaz */
  function startDrag(chip, e) {
    if (finishing || introLock || !chip || dragState) return;
    if (chip.classList.contains("is-placed")) return;
    var soundI = Number(chip.getAttribute("data-sound-i"));
    if (isNaN(soundI)) return;

    e.preventDefault();
    e.stopPropagation();

    var rect = chip.getBoundingClientRect();
    var parent = chip.parentNode;
    if (!parent) return;

    var ph = document.createElement("div");
    ph.className = "birles-sirala__chip-ph";
    ph.style.width = Math.round(rect.width) + "px";
    ph.style.height = Math.round(rect.height) + "px";
    ph.style.flex = "0 0 " + Math.round(rect.width) + "px";
    parent.insertBefore(ph, chip);

    /* Asıl kutuyu overlay içinde taşı — body’ye alınca z-index altında kayboluyordu */
    hostEl.appendChild(chip);
    chip.classList.add("is-lifted", "is-dragging");
    chip.style.position = "fixed";
    chip.style.left = rect.left + "px";
    chip.style.top = rect.top + "px";
    chip.style.width = rect.width + "px";
    chip.style.height = rect.height + "px";
    chip.style.margin = "0";
    chip.style.zIndex = "15000";
    chip.style.transform = "scale(1.08)";
    chip.style.boxShadow = "0 14px 32px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,236,170,0.95)";
    chip.style.pointerEvents = "none";
    chip.style.touchAction = "none";
    chip.style.visibility = "visible";
    chip.style.opacity = "1";
    chip.style.display = "inline-flex";
    chip.style.alignItems = "center";
    chip.style.justifyContent = "center";

    dragState = {
      chip: chip,
      placeholder: ph,
      soundI: soundI,
      nestI: null,
      ox: Math.max(8, Math.min(rect.width - 8, e.clientX - rect.left)),
      oy: Math.max(8, Math.min(rect.height - 8, e.clientY - rect.top)),
      pointerId: e.pointerId,
      capEl: hostEl || document.body
    };

    moveLifted(e.clientX, e.clientY);

    try {
      dragState.capEl.setPointerCapture(e.pointerId);
    } catch (_) {}

    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerUp, true);
  }

  function nestHtml(n) {
    var html = "";
    for (var i = 0; i < n; i++) {
      html +=
        '<div class="birles-sirala__nest" data-nest="' +
        i +
        '">' +
        '<span class="birles-sirala__nest-num">' +
        (i + 1) +
        "</span>" +
        '<span class="birles-sirala__nest-slot"></span>' +
        "</div>";
    }
    return html;
  }

  function rackHtml(order) {
    var html = "";
    order.forEach(function (origIdx) {
      var s = activityRef.sounds[origIdx];
      html +=
        '<button type="button" class="birles-sirala__chip" data-sound-i="' +
        origIdx +
        '">' +
        '<span class="birles-sirala__chip-label">' +
        esc(s.label || "?") +
        "</span>" +
        "</button>";
    });
    return html;
  }

  function bindChips() {
    if (!hostEl) return;
    hostEl.querySelectorAll(".birles-sirala__chip").forEach(function (chip) {
      chip.addEventListener(
        "pointerdown",
        function (e) {
          if (e.button != null && e.button !== 0) return;
          startDrag(chip, e);
        },
        { passive: false }
      );
    });
  }

  function bindNests() {
    if (!hostEl) return;
    hostEl.querySelectorAll(".birles-sirala__nest").forEach(function (nest) {
      nest.addEventListener("click", function () {
        if (finishing || introLock) return;
        var nestI = Number(nest.getAttribute("data-nest"));
        if (placements[nestI] == null) return;
        var soundI = placements[nestI];
        placements[nestI] = null;
        nest.classList.remove("is-filled");
        var slot = nest.querySelector(".birles-sirala__nest-slot");
        var chip = slot && slot.querySelector(".birles-sirala__chip");
        if (chip) restoreChipToRack(chip);
        if (slot) slot.innerHTML = "";
      });
    });
  }

  function setTutorHighlight(on) {
    if (!hostEl) return;
    hostEl.classList.toggle("is-tutor", !!on);
    hostEl.querySelectorAll(".birles-sirala__nest").forEach(function (el) {
      el.classList.toggle("is-tutor-pulse", !!on);
    });
    hostEl.querySelectorAll(".birles-sirala__chip:not(.is-placed)").forEach(function (el) {
      el.classList.toggle("is-tutor-pulse", !!on);
    });
  }

  function guideMp3ForActivity(act) {
    if (act && act.mode === "cumle") {
      if (act.endIndex > 1) return CUMLE_ONCUL_23;
      return CUMLE_ONCUL_1;
    }
    if (act && act.mode === "kelime") {
      if (act.endIndex > 1) return KELIME_ONCUL_23;
      return KELIME_ONCUL_1;
    }
    if (!act) return ONCUL_MP3;
    if (act.endIndex > 1) return ONCUL_23_MP3;
    return ONCUL_MP3;
  }

  function playHeceOnly() {
    if (!activityRef || finishing) return;
    var heceUrl = String(activityRef.resultAudioUrl || "").trim();
    if (!heceUrl && activityRef.result) heceUrl = resolveAudio(activityRef.result);
    if (heceUrl) playUrl(heceUrl);
  }

  async function playIntroSequence() {
    if (!hostEl || !activityRef) return;
    var seq = ++introSeq;
    introLock = true;
    hostEl.classList.add("is-intro");
    setTutorHighlight(false);

    var heceUrl = String(activityRef.resultAudioUrl || "").trim();
    if (!heceUrl && activityRef.result) heceUrl = resolveAudio(activityRef.result);
    if (heceUrl) {
      await playUrl(heceUrl);
    }
    if (seq !== introSeq || !hostEl) return;

    var guideUrl = guideMp3ForActivity(activityRef);
    setTutorHighlight(true);
    await playUrl(guideUrl);
    if (seq !== introSeq || !hostEl) return;

    setTutorHighlight(false);
    hostEl.classList.remove("is-intro");
    introLock = false;
  }

  function mountActivity() {
    if (!activityRef || !hostEl) return;
    endDrag(true);
    introSeq++;
    introLock = false;
    var n = nestCount();
    placements = [];
    for (var i = 0; i < n; i++) placements.push(null);
    finishing = false;
    nextUnlocked = false;
    hostEl.classList.remove("is-done", "is-intro", "is-tutor");
    setNextEnabled(false);

    var nests = hostEl.querySelector(".birles-sirala__nests");
    if (nests) {
      nests.classList.remove("is-shake");
      nests.innerHTML = nestHtml(n);
    }
    var rack = hostEl.querySelector(".birles-sirala__rack");
    if (rack) {
      var order = shuffle(
        activityRef.sounds.map(function (_, i) {
          return i;
        })
      );
      rack.innerHTML = rackHtml(order);
    }
    var burst = hostEl.querySelector(".birles-sirala__burst");
    if (burst) {
      burst.hidden = true;
      burst.classList.remove("is-boom-in");
      burst.innerHTML = "";
    }
    var board = hostEl.querySelector(".birles-sirala__board");
    if (board) board.classList.remove("is-finale");

    bindChips();
    bindNests();
    hardCutBoom(false);

    var isCumleMode = !!(activityRef && activityRef.mode === "cumle");
    var mergeSrc = isCumleMode ? CUMLE_MERGE_SRC : POOL_MERGE_SRC;
    var boomSrc = isCumleMode ? CUMLE_BOOM_SRC : POOL_BOOM_SRC;

    var merge = hostEl.querySelector(".birles-sirala__vid--merge");
    if (merge) {
      merge.muted = true;
      merge.loop = true;
      if (merge.getAttribute("src") !== mergeSrc) {
        merge.setAttribute("src", mergeSrc);
        try {
          merge.load();
        } catch (_) {}
      }
      var p = merge.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    }
    var boom = hostEl.querySelector(".birles-sirala__vid--boom");
    if (boom) {
      if (boom.getAttribute("src") !== boomSrc) {
        boom.setAttribute("src", boomSrc);
        try {
          boom.load();
        } catch (_) {}
      }
    }

    function clearSiralaBoot() {
      if (!hostEl) return;
      hostEl.classList.remove("is-booting");
      var boot = hostEl.querySelector(".birles-sirala__boot");
      if (boot) {
        boot.classList.add("is-leaving");
        setTimeout(function () {
          if (boot && boot.parentNode) boot.parentNode.removeChild(boot);
        }, 240);
      }
    }

    function waitMergeReady() {
      return new Promise(function (resolve) {
        var done = false;
        function finish() {
          if (done) return;
          done = true;
          resolve();
        }
        if (!merge) {
          finish();
          return;
        }
        function ok() {
          try {
            if (merge.readyState >= 2) {
              finish();
              return true;
            }
          } catch (_) {}
          return false;
        }
        if (ok()) return;
        merge.addEventListener("canplay", finish, { once: true });
        merge.addEventListener("loadeddata", finish, { once: true });
        merge.addEventListener("error", finish, { once: true });
        setTimeout(finish, 5000);
      });
    }

    waitMergeReady().then(function () {
      return sleep(220);
    }).then(function () {
      if (!hostEl) return;
      clearSiralaBoot();
      setTimeout(function () {
        playIntroSequence();
      }, 120);
    });
  }

  function open(opts) {
    opts = opts || {};
    close();
    var token = ++openToken;
    soundRef = opts.sound || null;
    onDoneCb = typeof opts.onDone === "function" ? opts.onDone : null;
    laneMode = !!opts.laneMode;
    laneProgressText = String(opts.laneProgress || "").trim();
    finishing = false;
    nextUnlocked = false;

    if (opts.activity) {
      activityRef = normalizeActivity(opts.activity, 0);
    } else {
      var acts = listActivities(opts.letterPack || {});
      activityRef = acts[0] || null;
    }

    if (!activityRef || activityRef.sounds.length < 2 || activityRef.correctOrder.length < 2) {
      if (typeof onDoneCb === "function") onDoneCb({ success: false, empty: true });
      return;
    }

    var box = document.createElement("div");
    box.id = "birles-sirala-overlay";
    box.className =
      "birles-sirala" +
      (activityRef.mode === "cumle"
        ? " birles-sirala--cumle"
        : activityRef.mode === "kelime"
          ? " birles-sirala--kelime"
          : "");
    box.innerHTML =
      '<div class="birles-sirala__boot is-open" id="birles-sirala-boot" role="status" aria-live="polite">' +
      '  <div class="birles-sirala__boot-orb" aria-hidden="true"></div>' +
      '  <p class="birles-sirala__boot-title">Sıra Sende</p>' +
      '  <p class="birles-sirala__boot-text">Hazırlanıyor…</p>' +
      '  <div class="birles-sirala__boot-bar" aria-hidden="true"><i></i></div>' +
      "</div>" +
      '<div class="birles-sirala__backdrop"></div>' +
      '<div class="birles-sirala__stage">' +
      '  <div class="birles-sirala__stagebox">' +
      '    <div class="birles-sirala__layer birles-sirala__layer--merge" style="opacity:1">' +
      '      <video class="birles-sirala__vid birles-sirala__vid--merge" playsinline muted loop preload="auto"></video>' +
      "    </div>" +
      '    <div class="birles-sirala__layer birles-sirala__layer--boom" style="opacity:0">' +
      '      <video class="birles-sirala__vid birles-sirala__vid--boom" playsinline preload="auto"></video>' +
      "    </div>" +
      '    <div class="birles-sirala__flash" hidden></div>' +
      '    <div class="birles-sirala__board">' +
      '      <div class="birles-sirala__nests"></div>' +
      '      <div class="birles-sirala__rack"></div>' +
      '      <button type="button" class="birles-sirala__replay" data-sirala-instruct="1" aria-label="' +
      (activityRef.mode === "cumle"
        ? "Cümleyi dinle"
        : activityRef.mode === "kelime"
          ? "Kelimeyi dinle"
          : "Heceyi dinle") +
      '">🔊</button>' +
      "    </div>" +
      '    <p class="birles-sirala__burst" hidden aria-live="polite"></p>' +
      "  </div>" +
      "</div>" +
      '<button type="button" class="birles-sirala__close" data-sirala-close="1" aria-label="Kapat">✕</button>' +
      dockHtml();

    (document.documentElement || document.body).appendChild(box);
    hostEl = box;
    hostEl.classList.add("is-booting");
    setPoolFs(true);
    bindLayout();
    layoutStage();
    bindDock();

    box.querySelectorAll("[data-sirala-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        if (finishing && nextUnlocked) {
          finishSuccess();
          return;
        }
        var cb = onDoneCb;
        close();
        if (typeof cb === "function") cb({ success: false, closed: true });
      });
    });
    box.querySelectorAll("[data-sirala-instruct]").forEach(function (el) {
      el.addEventListener("click", function () {
        if (finishing) return;
        playHeceOnly();
      });
    });

    mountActivity();
    requestAnimationFrame(function () {
      if (token !== openToken) return;
      layoutStage();
    });
  }

  global.NovaBirlestirelimSirala = {
    open: open,
    close: close,
    hasSirala: hasSirala,
    listActivities: listActivities,
    buildEndActivities: buildEndActivities,
    buildEndKelimeActivities: buildEndKelimeActivities,
    buildEndCumleActivities: buildEndCumleActivities,
    pickEndHeces: pickEndHeces,
    pickEndKelimes: pickEndKelimes,
    pickEndCumles: pickEndCumles,
    soundAllowsKelimeSirala: soundAllowsKelimeSirala,
    soundAllowsCumleSirala: soundAllowsCumleSirala,
    ONCUL_MP3: ONCUL_MP3,
    ONCUL_23_MP3: ONCUL_23_MP3,
    KELIME_ONCUL_1: KELIME_ONCUL_1,
    KELIME_ONCUL_23: KELIME_ONCUL_23,
    KELIME_SIRALA_START: KELIME_SIRALA_START,
    CUMLE_SIRALA_START: CUMLE_SIRALA_START,
    END_ACT_COUNT: END_ACT_COUNT,
    normalize: normalizeActivity,
    SLOT_MAX: SLOT_MAX
  };
})(typeof window !== "undefined" ? window : this);

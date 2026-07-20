/**
 * Türkçe öncül metinlerinde satır sonu heceleme (yumuşak tire U+00AD).
 * Satıra sığmayan kelimeler Türkçe hece kurallarına göre bölünür; tire yalnızca satır kırılınca görünür.
 */
(function (global) {
  var VOWELS = "aâeêıiîoöuüAÂEÊİIÎOÖUÜ";

  function isVowel(ch) {
    return VOWELS.indexOf(ch) >= 0;
  }

  function isLetter(ch) {
    if (!ch) return false;
    var c = ch.charCodeAt(0);
    return (
      (c >= 0x41 && c <= 0x5a) ||
      (c >= 0x61 && c <= 0x7a) ||
      (c >= 0xc0 && c <= 0x24f) ||
      c === 0x130 ||
      c === 0x131
    );
  }

  /** Kelime içinde hece sınırı (tire, bu indexten sonra gelir). */
  function syllableBreakAfterIndices(word) {
    var chars = Array.from(word);
    if (chars.length < 4) return [];

    var vowelIdx = [];
    for (var i = 0; i < chars.length; i++) {
      if (isVowel(chars[i])) vowelIdx.push(i);
    }
    if (vowelIdx.length <= 1) return [];

    var breaks = [];
    for (var v = 0; v < vowelIdx.length - 1; v++) {
      var v1 = vowelIdx[v];
      var v2 = vowelIdx[v + 1];
      var n = v2 - v1 - 1;
      if (n <= 0) continue;

      var splitAfter;
      if (n === 1) {
        splitAfter = v1;
      } else if (n === 2) {
        splitAfter = v1 + 1;
      } else {
        splitAfter = v1 + 1;
      }

      if (splitAfter >= 0 && splitAfter < chars.length - 1) {
        breaks.push(splitAfter);
      }
    }
    return breaks;
  }

  function shouldHyphenateWord(word) {
    if (!word || word.length < 4) return false;
    if (word.indexOf("\u00ad") >= 0) return false;
    if (/^\d+$/.test(word)) return false;
    if (/^[IVXLC]+$/i.test(word)) return false;
    var letters = 0;
    for (var i = 0; i < word.length; i++) {
      if (isLetter(word[i])) letters++;
    }
    return letters >= 4;
  }

  function hyphenateWord(word) {
    if (!shouldHyphenateWord(word)) return word;

    if (word.indexOf("'") >= 0 || word.indexOf("\u2019") >= 0) {
      return word
        .split(/(['\u2019])/)
        .map(function (part) {
          return /['\u2019]/.test(part) ? part : hyphenateWord(part);
        })
        .join("");
    }

    var breaks = syllableBreakAfterIndices(word);
    if (!breaks.length) return word;

    var out = "";
    for (var i = 0; i < word.length; i++) {
      out += word[i];
      if (breaks.indexOf(i) >= 0) out += "\u00ad";
    }
    return out;
  }

  function hyphenatePlainText(text) {
    return String(text || "").replace(/[^\s\u00a0]+/g, function (token) {
      var lead = "";
      var trail = "";
      var core = token;
      while (core.length && !isLetter(core[0])) {
        lead += core[0];
        core = core.slice(1);
      }
      while (core.length && !isLetter(core[core.length - 1])) {
        trail = core[core.length - 1] + trail;
        core = core.slice(0, -1);
      }
      if (!core) return token;
      return lead + hyphenateWord(core) + trail;
    });
  }

  var SKIP_PARENT =
    ".q-frac, .q-mul, .q-div, .q-shape, .q-solid, .q-bunny-video, script, style, code";

  function processTextNode(node) {
    if (!node || !node.nodeValue) return;
    var parent = node.parentElement;
    if (parent && parent.closest && parent.closest(SKIP_PARENT)) return;
    if (node.nodeValue.indexOf("\u00ad") >= 0) return;

    var next = hyphenatePlainText(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  }

  function applyToPreamble(root) {
    if (!root) return;
    root.setAttribute("lang", "tr");

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      processTextNode(node);
    }
  }

  global.NovaTurkishHyphen = {
    hyphenateWord: hyphenateWord,
    hyphenatePlainText: hyphenatePlainText,
    applyToPreamble: applyToPreamble,
  };
})(typeof window !== "undefined" ? window : globalThis);

/**
 * Soru metni: kesirler [[1/3]], kesir modeli [[fracbar:3/8]], dikey toplama [[add:243+125]], dikey cikarma [[sub:485-234]],
 * cozum [[addsol:348+225]] / [[subsol:485-234]],
 * dikey çarpma [[mul:23×45]], bölme [[div:144÷12]], çözüm [[divsol:18÷3]], adım [[divstep:72÷4:1]]
 * geometri [[shape:kare:5:cm]], temel geo [[geo:nokta]] [[geo:dogru]] [[geo:isin]] [[geo:parca]] [[geo:aci_dik]],
 * şekil/cisim [[sekil:ucgen]] [[sekil:kare]] [[cisim:kup]] [[cisim:silindir]],
 * cisim [[solid:kup:4:cm]], saat [[clock:a:8:00]] / [[clock:d:14:30]], para [[para:10TL|5TL]], terazi [[terazi:L:2,3:R:5]], Bunny video [[bunny:host:videoId]]
 * Vurgu: {kirmizi:kelime} {mavi:kelime} {yesil:kelime} veya **kalın**
 * Öncül: infoBlocks (metin, madde, görsel, video) + geriye dönük info / infoItems
 */
(function (global) {
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const FRAC_RE = /\[\[\s*(\d+)\s*[\/|]\s*(\d+)\s*\]\]/g;
  const FRACBAR_RE = /\[\[\s*fracbar\s*:\s*(\d+)\s*[\/|]\s*(\d+)\s*\]\]/gi;
  const CLOCK_RE =
    /\[\[\s*clock\s*:\s*(?:(a|analog|d|digital)\s*:)?\s*(\d{1,2})\s*:\s*(\d{2})\s*\]\]/gi;
  const CLOCKARC_RE =
    /\[\[\s*clockarc\s*:\s*(\d{1,2})\s*:\s*(\d{2})\s*:\s*(\d{1,2})\s*:\s*(\d{1,2})\s*\]\]/gi;
  const ADD_MULTI_RE = /\[\[\s*add\s*:\s*((?:\d+\s*\+\s*)+\d+)\s*\]\]/gi;
  const ADDSOL_MULTI_RE = /\[\[\s*addsol\s*:\s*((?:\d+\s*\+\s*)+\d+)\s*\]\]/gi;
  const SUB_PAIR_RE = /\[\[\s*sub\s*:\s*(\d+)\s*-\s*(\d+)\s*\]\]/gi;
  const SUBSOL_RE = /\[\[\s*subsol\s*:\s*(\d+)\s*-\s*(\d+)\s*\]\]/gi;
  const STEPHR_RE = /\[\[\s*stephr\s*\]\]/gi;
  const RESULT_RE = /\[\[\s*result\s*:\s*(\d+)\s*\]\]/gi;
  const MUL_RE = /\[\[\s*mul\s*:\s*(\d+)\s*[×x*]\s*(\d+)\s*\]\]/gi;
  const MULSOL_RE = /\[\[\s*mulsol\s*:\s*(\d+)\s*[×x*]\s*(\d+)\s*\]\]/gi;
  const DIVSTEP_RE = /\[\[\s*divstep\s*:\s*(\d+)\s*[÷\/]\s*(\d+)\s*:\s*(\d+)\s*\]\]/gi;
  const DIVSOL_RE = /\[\[\s*divsol\s*:\s*(\d+)\s*[÷\/]\s*(\d+)\s*\]\]/gi;
  const DIV_RE = /\[\[\s*div\s*:\s*(\d+)\s*[÷\/]\s*(\d+)\s*\]\]/gi;
  const SHAPE_RE = /\[\[\s*shape\s*:\s*([a-zçğıöşü_]+)\s*:\s*([^:\]]+)(?:\s*:\s*([a-zçğıöşü]+))?\s*\]\]/gi;
  const SOLID_RE = /\[\[\s*solid\s*:\s*([a-zçğıöşü_]+)\s*:\s*([^:\]]+)(?:\s*:\s*([a-zçğıöşü]+))?\s*\]\]/gi;
  const BUNNY_VID_RE = /\[\[\s*bunny\s*:\s*([^:\]]*)\s*:\s*([a-f0-9-]{8,})\s*\]\]/gi;
  const PARA_RE = /\[\[\s*para\s*:\s*([^\]]+?)\s*\]\]/gi;
  const TERAZI_RE = /\[\[\s*terazi\s*:\s*L\s*:\s*([^:\]]+?)\s*:\s*R\s*:\s*([^\]]+?)\s*\]\]/gi;
  const GEO_BASIC_RE = /\[\[\s*geo\s*:\s*([a-z0-9_]+)\s*\]\]/gi;
  const SEKIL_RE = /\[\[\s*sekil\s*:\s*([a-z0-9_]+)\s*\]\]/gi;
  const CISIM_RE = /\[\[\s*cisim\s*:\s*([a-z0-9_]+)\s*\]\]/gi;
  const EM_TAG_RE = /\{(kirmizi|mavi|yesil|kalin|k|m|y)\s*:\s*([^{}]+?)\}/gi;
  const IMG_RE = /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i;
  const BUNNY_IMG_RE = /^https?:\/\/[^/]+\.b-cdn\.net\/.+/i;

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function defaultRoman(i) {
    return (ROMAN[i] || String(i + 1)) + ".";
  }

  function isImageUrl(s) {
    const v = String(s || "").trim();
    return IMG_RE.test(v) || BUNNY_IMG_RE.test(v);
  }

  function normalizeBunnyHost(name) {
    let n = String(name || "").trim();
    if (!n) return "";
    n = n.replace(/^https?:\/\//i, "");
    n = n.replace(/\.b-cdn\.net.*$/i, "");
    n = n.replace(/\/+$/g, "");
    return n;
  }

  function buildBunnyEmbedUrl(libraryId, videoId) {
    return (
      "https://iframe.mediadelivery.net/embed/" +
      libraryId +
      "/" +
      videoId +
      "?autoplay=true&loop=false&muted=false&preload=true&responsive=true&rememberPosition=false"
    );
  }

  function bunnyVideoWrap(inner, embedSrc) {
    return (
      '<div class="q-bunny-video" data-qbunny="1"' +
      (embedSrc ? ' data-embed-src="' + escapeHtml(embedSrc) + '"' : "") +
      '">' +
      '<div class="q-bunny-video__frame">' +
      inner +
      "</div>" +
      '<button type="button" class="q-bunny-replay" aria-label="Videoyu tekrar oynat">↻ Tekrar oynat</button>' +
      "</div>"
    );
  }

  function tryPlayVideoEl(video) {
    if (!video) return;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    var p = video.play();
    if (p && typeof p.catch === "function") {
      p.catch(function () {
        video.muted = true;
        video.play().catch(function () {});
      });
    }
  }

  function initBunnyVideos(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".q-bunny-video[data-qbunny]").forEach(function (wrap) {
      if (wrap.getAttribute("data-qbunny-wired") === "1") return;
      wrap.setAttribute("data-qbunny-wired", "1");

      const video = wrap.querySelector("video.q-bunny-video__mp4");
      const iframe = wrap.querySelector("iframe");
      const replayBtn = wrap.querySelector(".q-bunny-replay");

      if (video) {
        video.autoplay = true;
        video.controls = true;
        video.preload = "auto";
        tryPlayVideoEl(video);
      }

      if (replayBtn) {
        replayBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (video) {
            video.currentTime = 0;
            video.muted = false;
            tryPlayVideoEl(video);
            return;
          }
          if (iframe) {
            const src =
              iframe.getAttribute("data-src-backup") ||
              wrap.getAttribute("data-embed-src") ||
              iframe.src;
            if (src) {
              iframe.src = "";
              iframe.src = src;
            }
          }
        });
      }

      if (iframe && !iframe.getAttribute("data-src-backup")) {
        iframe.setAttribute("data-src-backup", iframe.src || "");
      }
    });
  }

  function buildBunnyMp4Url(host, videoId) {
    return "https://" + host + ".b-cdn.net/" + videoId + "/play_720p.mp4";
  }

  function stackedFractionHtml(num, den) {
    const n = escapeHtml(num);
    const d = escapeHtml(den);
    return (
      '<span class="q-frac" role="math" aria-label="' +
      n +
      " bölü " +
      d +
      '">' +
      '<span class="q-frac__num">' +
      n +
      '</span><span class="q-frac__bar" aria-hidden="true"></span>' +
      '<span class="q-frac__den">' +
      d +
      "</span></span>"
    );
  }

  function fracBarHtml(num, den) {
    var n = parseInt(num, 10) || 0;
    var d = parseInt(den, 10) || 1;
    if (d < 1) d = 1;
    if (n < 0) n = 0;
    if (n > d) n = d;
    var cells = [];
    var i;
    for (i = 0; i < d; i++) {
      cells.push(
        '<span class="q-fracbar__cell' +
          (i < n ? " q-fracbar__cell--on" : "") +
          '" aria-hidden="true"></span>'
      );
    }
    return (
      '<span class="q-fracbar" role="img" aria-label="' +
      escapeHtml(String(n) + " bölü " + String(d) + " model") +
      '">' +
      '<span class="q-fracbar__grid" style="--fracbar-cols:' +
      d +
      '">' +
      cells.join("") +
      "</span></span>"
    );
  }

  function padMathNums(a, b, resultLen) {
    const len = resultLen || Math.max(String(a).length, String(b).length);
    return {
      len: len,
      top: String(a).padStart(len, "\u00a0"),
      bottom: String(b).padStart(len, "\u00a0"),
    };
  }

  function parseAddOperands(raw) {
    return String(raw)
      .split("+")
      .map(function (s) {
        return parseInt(String(s).trim(), 10);
      })
      .filter(function (n) {
        return !isNaN(n) && n >= 0;
      });
  }

  function computeAddColumns(a, b) {
    const na = parseInt(a, 10) || 0;
    const nb = parseInt(b, 10) || 0;
    const sa = String(na);
    const sb = String(nb);
    const sr = String(na + nb);
    const len = Math.max(sa.length, sb.length, sr.length);
    const digitsA = sa.padStart(len, "0").split("").map(Number);
    const digitsB = sb.padStart(len, "0").split("").map(Number);
    const carryRow = Array(len).fill("\u00a0");
    const steps = [];
    let carry = 0;
    const resultDigits = [];
    for (let pos = len - 1; pos >= 0; pos--) {
      const da = digitsA[pos];
      const db = digitsB[pos];
      const total = da + db + carry;
      const digit = total % 10;
      const newCarry = total >= 10 ? 1 : 0;
      const place =
        pos === len - 1 ? "birler" : pos === len - 2 ? "onlar" : pos === len - 3 ? "yüzler" : "basamak";
      steps.unshift({
        place: place,
        da: da,
        db: db,
        carryIn: carry,
        digit: digit,
        carryOut: newCarry,
      });
      if (newCarry && pos > 0) carryRow[pos - 1] = "1";
      resultDigits.unshift(digit);
      carry = newCarry;
    }
    return {
      len: len,
      top: sa.padStart(len, "\u00a0"),
      bottom: sb.padStart(len, "\u00a0"),
      result: sr.padStart(len, "\u00a0"),
      carryRow: carryRow,
      steps: steps,
      sum: na + nb,
      rows: null,
    };
  }

  function computeAddColumnsFromOperands(addends) {
    if (!addends || addends.length < 2) {
      return computeAddColumns(addends && addends[0] != null ? addends[0] : 0, addends && addends[1] != null ? addends[1] : 0);
    }
    if (addends.length === 2) {
      var two = computeAddColumns(addends[0], addends[1]);
      two.rows = [two.top, two.bottom];
      return two;
    }
    var sum = 0;
    for (var si = 0; si < addends.length; si++) sum += addends[si];
    var sr = String(sum);
    var len = sr.length;
    for (var lj = 0; lj < addends.length; lj++) {
      if (String(addends[lj]).length > len) len = String(addends[lj]).length;
    }
    var digitRows = [];
    for (var r = 0; r < addends.length; r++) {
      digitRows.push(String(addends[r]).padStart(len, "0").split("").map(Number));
    }
    var carryRow = Array(len).fill("\u00a0");
    var carry = 0;
    var resultDigits = [];
    for (var pos = len - 1; pos >= 0; pos--) {
      var total = carry;
      for (var dr = 0; dr < digitRows.length; dr++) total += digitRows[dr][pos];
      var digit = total % 10;
      var newCarry = Math.floor(total / 10);
      if (newCarry > 0 && pos > 0) carryRow[pos - 1] = String(newCarry);
      resultDigits.unshift(digit);
      carry = newCarry;
    }
    var paddedRows = addends.map(function (n) {
      return String(n).padStart(len, "\u00a0");
    });
    return {
      len: len,
      top: paddedRows[0],
      bottom: paddedRows[paddedRows.length - 1],
      rows: paddedRows,
      result: sr.padStart(len, "\u00a0"),
      carryRow: carryRow,
      sum: sum,
      multi: true,
    };
  }

  function splitPaddedDigits(padded, len) {
    return String(padded)
      .padStart(len, "\u00a0")
      .split("")
      .map(function (c) {
        return c === "\u00a0" ? "" : c;
      });
  }

  function buildAddGridHtml(cols, withSolution) {
    var len = cols.len;
    var rows = cols.rows || [cols.top, cols.bottom];
    var resD = splitPaddedDigits(cols.result, len);
    var parts = ['<span class="q-vmath__grid" style="--q-add-cols:' + len + '">'];

    if (withSolution) {
      parts.push('<span class="q-vmath__grid-row q-vmath__grid-row--carry">');
      parts.push('<span class="q-vmath__gcol q-vmath__gcol--sign" aria-hidden="true"></span>');
      for (var ci = 0; ci < len; ci++) {
        var cval = cols.carryRow[ci];
        var hasCarry = cval && String(cval).trim() && cval !== "\u00a0";
        parts.push(
          '<span class="q-vmath__gcol">' +
            (hasCarry
              ? '<span class="q-vmath__carry" title="Elde">' + escapeHtml(String(cval)) + "</span>"
              : '<span class="q-vmath__carry q-vmath__carry--empty" aria-hidden="true">&nbsp;</span>') +
            "</span>"
        );
      }
      parts.push("</span>");
    }

    for (var ri = 0; ri < rows.length; ri++) {
      var rowD = splitPaddedDigits(rows[ri], len);
      var isLast = ri === rows.length - 1;
      parts.push('<span class="q-vmath__grid-row q-vmath__grid-row--op">');
      parts.push(
        '<span class="q-vmath__gcol q-vmath__gcol--sign" aria-hidden="true">' +
          (isLast && rows.length > 1 ? '<span class="q-vmath__sign">+</span>' : "") +
          "</span>"
      );
      for (var di = 0; di < len; di++) {
        parts.push(
          '<span class="q-vmath__gcol"><span class="q-vmath__digit">' +
            (rowD[di] ? escapeHtml(rowD[di]) : "&nbsp;") +
            "</span></span>"
        );
      }
      parts.push("</span>");
    }

    parts.push('<span class="q-vmath__grid-row q-vmath__grid-row--bar">');
    parts.push('<span class="q-vmath__gcol q-vmath__gcol--sign" aria-hidden="true"></span>');
    parts.push('<span class="q-vmath__bar-line" aria-hidden="true"></span>');
    parts.push("</span>");

    if (withSolution) {
      parts.push('<span class="q-vmath__grid-row q-vmath__grid-row--result">');
      parts.push('<span class="q-vmath__gcol q-vmath__gcol--sign" aria-hidden="true"></span>');
      for (var ri2 = 0; ri2 < len; ri2++) {
        parts.push(
          '<span class="q-vmath__gcol"><span class="q-vmath__digit q-vmath__digit--result">' +
            (resD[ri2] ? escapeHtml(resD[ri2]) : "&nbsp;") +
            "</span></span>"
        );
      }
      parts.push("</span>");
    }

    parts.push("</span>");
    return parts.join("");
  }

  function verticalAddFromOperands(nums) {
    if (!nums || nums.length < 2) return escapeHtml(String(nums && nums[0] != null ? nums[0] : ""));
    var cols = computeAddColumnsFromOperands(nums);
    var label = nums.join(" artı ");
    var cls = "q-vmath q-vmath--add" + (nums.length > 2 ? " q-vmath--add-multi" : "");
    return (
      '<span class="' +
      cls +
      '" role="math" aria-label="' +
      escapeHtml(label) +
      '">' +
      buildAddGridHtml(cols, false) +
      "</span>"
    );
  }

  function verticalAddSolutionFromOperands(nums) {
    if (!nums || nums.length < 2) return escapeHtml(String(nums && nums[0] != null ? nums[0] : ""));
    var cols = computeAddColumnsFromOperands(nums);
    var label = nums.join(" artı ") + " eşittir " + String(cols.sum);
    var cls = "q-vmath q-vmath--add q-vmath--addsol" + (nums.length > 2 ? " q-vmath--add-multi" : "");
    return (
      '<span class="' +
      cls +
      '" role="math" aria-label="' +
      escapeHtml(label) +
      '">' +
      buildAddGridHtml(cols, true) +
      "</span>"
    );
  }

  function verticalAddHtml(a, b) {
    return verticalAddFromOperands([parseInt(a, 10) || 0, parseInt(b, 10) || 0]);
  }

  function verticalAddSolutionHtml(a, b) {
    return verticalAddSolutionFromOperands([parseInt(a, 10) || 0, parseInt(b, 10) || 0]);
  }

  function subTopDigitHtml(orig, adj, changed) {
    if (!changed) {
      return (
        '<span class="q-vmath__gcol"><span class="q-vmath__digit">' +
        (orig ? escapeHtml(String(orig)) : "&nbsp;") +
        "</span></span>"
      );
    }
    var adjStr = String(adj);
    var wide = adjStr.length > 1 ? " q-vmath__adj--wide" : "";
    return (
      '<span class="q-vmath__gcol q-vmath__gcol--stack">' +
      '<span class="q-vmath__adj' +
      wide +
      '" title="Onluk bozma sonrası">' +
      escapeHtml(adjStr) +
      "</span>" +
      '<span class="q-vmath__digit q-vmath__digit--struck">' +
      '<span class="q-vmath__digit-inner">' +
      escapeHtml(String(orig)) +
      "</span>" +
      '<span class="q-vmath__strike" aria-hidden="true"></span>' +
      "</span></span>"
    );
  }

  function computeSubColumns(a, b) {
    var na = parseInt(a, 10) || 0;
    var nb = parseInt(b, 10) || 0;
    var sa = String(na);
    var sb = String(nb);
    var sr = String(na - nb);
    var len = Math.max(sa.length, sb.length, sr.length);
    var da = sa.padStart(len, "0").split("").map(Number);
    var db = sb.padStart(len, "0").split("").map(Number);
    var work = da.slice();
    var adjustedTop = da.slice();
    var anyBorrow = false;
    var i;
    var k;

    for (i = len - 1; i >= 0; i--) {
      if (work[i] < db[i]) {
        anyBorrow = true;
        k = i - 1;
        while (k >= 0 && work[k] === 0) {
          work[k] = 9;
          adjustedTop[k] = 9;
          k--;
        }
        if (k >= 0) {
          work[k] -= 1;
          adjustedTop[k] = work[k];
        }
        adjustedTop[i] = work[i] + 10;
      } else {
        adjustedTop[i] = work[i];
      }
    }

    var topChanged = [];
    var origTop = sa.padStart(len, "\u00a0");
    var origD = splitPaddedDigits(origTop, len);

    for (var j = 0; j < len; j++) {
      var o = da[j];
      var adj = adjustedTop[j];
      topChanged[j] = anyBorrow && o !== adj;
    }

    return {
      len: len,
      top: origTop,
      bottom: sb.padStart(len, "\u00a0"),
      result: sr.padStart(len, "\u00a0"),
      origDigits: origD,
      da: da,
      adjustedTop: adjustedTop,
      topChanged: topChanged,
      anyBorrow: anyBorrow,
      diff: na - nb,
    };
  }

  function buildSubGridHtml(cols, withSolution) {
    var len = cols.len;
    var origD = cols.origDigits || splitPaddedDigits(cols.top, len);
    var botD = splitPaddedDigits(cols.bottom, len);
    var resD = splitPaddedDigits(cols.result, len);
    var parts = ['<span class="q-vmath__grid q-vmath__grid--sub" style="--q-add-cols:' + len + '">'];

    parts.push('<span class="q-vmath__grid-row q-vmath__grid-row--op">');
    parts.push('<span class="q-vmath__gcol q-vmath__gcol--sign" aria-hidden="true"></span>');
    for (var ti = 0; ti < len; ti++) {
      var origChar = origD[ti] || (cols.da ? String(cols.da[ti]) : "");
      if (withSolution && cols.anyBorrow && cols.topChanged[ti]) {
        parts.push(subTopDigitHtml(origChar, cols.adjustedTop[ti], true));
      } else {
        parts.push(subTopDigitHtml(origChar, origChar, false));
      }
    }
    parts.push("</span>");

    parts.push('<span class="q-vmath__grid-row q-vmath__grid-row--op q-vmath__grid-row--sub">');
    parts.push('<span class="q-vmath__gcol q-vmath__gcol--sign" aria-hidden="true"><span class="q-vmath__sign">−</span></span>');
    for (var si = 0; si < len; si++) {
      parts.push(
        '<span class="q-vmath__gcol"><span class="q-vmath__digit">' +
          (botD[si] ? escapeHtml(botD[si]) : "&nbsp;") +
          "</span></span>"
      );
    }
    parts.push("</span>");

    parts.push('<span class="q-vmath__grid-row q-vmath__grid-row--bar">');
    parts.push('<span class="q-vmath__gcol q-vmath__gcol--sign" aria-hidden="true"></span>');
    parts.push('<span class="q-vmath__bar-line" aria-hidden="true"></span>');
    parts.push("</span>");

    if (withSolution) {
      parts.push('<span class="q-vmath__grid-row q-vmath__grid-row--result">');
      parts.push('<span class="q-vmath__gcol q-vmath__gcol--sign" aria-hidden="true"></span>');
      for (var ri = 0; ri < len; ri++) {
        parts.push(
          '<span class="q-vmath__gcol"><span class="q-vmath__digit q-vmath__digit--result">' +
            (resD[ri] ? escapeHtml(resD[ri]) : "&nbsp;") +
            "</span></span>"
        );
      }
      parts.push("</span>");
    }

    parts.push("</span>");
    return parts.join("");
  }

  function verticalSubHtml(a, b) {
    var na = parseInt(a, 10) || 0;
    var nb = parseInt(b, 10) || 0;
    var cols = computeSubColumns(na, nb);
    return (
      '<span class="q-vmath q-vmath--sub" role="math" aria-label="' +
      escapeHtml(String(na) + " eksi " + String(nb)) +
      '">' +
      buildSubGridHtml(cols, false) +
      "</span>"
    );
  }

  function verticalSubSolutionHtml(a, b) {
    var na = parseInt(a, 10) || 0;
    var nb = parseInt(b, 10) || 0;
    var cols = computeSubColumns(na, nb);
    return (
      '<span class="q-vmath q-vmath--sub q-vmath--subsol" role="math" aria-label="' +
      escapeHtml(String(na) + " eksi " + String(nb) + " eşittir " + String(cols.diff)) +
      '">' +
      buildSubGridHtml(cols, true) +
      "</span>"
    );
  }

  function computeMulColumns(a, b) {
    var na = parseInt(a, 10) || 0;
    var nb = parseInt(b, 10) || 0;
    var sa = String(na);
    var m = nb;
    var da = sa.split("").map(Number);
    var mcLen = da.length;
    var carryRow = Array(mcLen).fill("\u00a0");
    var carry = 0;
    var resultDigits = [];
    var i;
    for (i = mcLen - 1; i >= 0; i--) {
      var total = da[i] * m + carry;
      var digit = total % 10;
      carry = Math.floor(total / 10);
      resultDigits.unshift(String(digit));
      if (carry > 0 && i > 0) {
        carryRow[i - 1] = String(carry);
      }
    }
    if (carry > 0) {
      resultDigits.unshift(String(carry));
      carryRow.unshift("\u00a0");
    }
    var gridLen = Math.max(mcLen, resultDigits.length, String(m).length);
    var top = sa.padStart(gridLen, "\u00a0");
    var bottom = String(m).padStart(gridLen, "\u00a0");
    while (carryRow.length < gridLen) {
      carryRow.unshift("\u00a0");
    }
    if (carryRow.length > gridLen) {
      carryRow = carryRow.slice(carryRow.length - gridLen);
    }
    return {
      len: gridLen,
      top: top,
      bottom: bottom,
      result: resultDigits.join("").padStart(gridLen, "\u00a0"),
      carryRow: carryRow,
      product: na * nb,
    };
  }

  function buildMulGridHtml(cols, withSolution) {
    var len = cols.len;
    var topD = splitPaddedDigits(cols.top, len);
    var botD = splitPaddedDigits(cols.bottom, len);
    var resD = splitPaddedDigits(cols.result, len);
    var parts = ['<span class="q-vmath__grid q-vmath__grid--mul" style="--q-add-cols:' + len + '">'];

    if (withSolution) {
      parts.push('<span class="q-vmath__grid-row q-vmath__grid-row--carry">');
      parts.push('<span class="q-vmath__gcol q-vmath__gcol--sign" aria-hidden="true"></span>');
      for (var ci = 0; ci < len; ci++) {
        var cval = cols.carryRow[ci];
        var hasCarry = cval && String(cval).trim() && cval !== "\u00a0";
        parts.push(
          '<span class="q-vmath__gcol">' +
            (hasCarry
              ? '<span class="q-vmath__carry" title="Elde">' + escapeHtml(String(cval)) + "</span>"
              : '<span class="q-vmath__carry q-vmath__carry--empty" aria-hidden="true">&nbsp;</span>') +
            "</span>"
        );
      }
      parts.push("</span>");
    }

    parts.push('<span class="q-vmath__grid-row q-vmath__grid-row--op">');
    parts.push('<span class="q-vmath__gcol q-vmath__gcol--sign" aria-hidden="true"></span>');
    for (var ti = 0; ti < len; ti++) {
      parts.push(
        '<span class="q-vmath__gcol"><span class="q-vmath__digit">' +
          (topD[ti] ? escapeHtml(topD[ti]) : "&nbsp;") +
          "</span></span>"
      );
    }
    parts.push("</span>");

    parts.push('<span class="q-vmath__grid-row q-vmath__grid-row--op q-vmath__grid-row--mul">');
    parts.push('<span class="q-vmath__gcol q-vmath__gcol--sign" aria-hidden="true"><span class="q-vmath__sign">×</span></span>');
    for (var si = 0; si < len; si++) {
      parts.push(
        '<span class="q-vmath__gcol"><span class="q-vmath__digit">' +
          (botD[si] ? escapeHtml(botD[si]) : "&nbsp;") +
          "</span></span>"
      );
    }
    parts.push("</span>");

    parts.push('<span class="q-vmath__grid-row q-vmath__grid-row--bar">');
    parts.push('<span class="q-vmath__gcol q-vmath__gcol--sign" aria-hidden="true"></span>');
    parts.push('<span class="q-vmath__bar-line" aria-hidden="true"></span>');
    parts.push("</span>");

    if (withSolution) {
      parts.push('<span class="q-vmath__grid-row q-vmath__grid-row--result">');
      parts.push('<span class="q-vmath__gcol q-vmath__gcol--sign" aria-hidden="true"></span>');
      for (var ri = 0; ri < len; ri++) {
        parts.push(
          '<span class="q-vmath__gcol"><span class="q-vmath__digit q-vmath__digit--result">' +
            (resD[ri] ? escapeHtml(resD[ri]) : "&nbsp;") +
            "</span></span>"
        );
      }
      parts.push("</span>");
    }

    parts.push("</span>");
    return parts.join("");
  }

  function verticalMulHtml(a, b) {
    var na = parseInt(a, 10) || 0;
    var nb = parseInt(b, 10) || 0;
    var cols = computeMulColumns(na, nb);
    return (
      '<span class="q-vmath q-vmath--mul" role="math" aria-label="' +
      escapeHtml(String(na) + " çarpı " + String(nb)) +
      '">' +
      buildMulGridHtml(cols, false) +
      "</span>"
    );
  }

  function verticalMulSolutionHtml(a, b) {
    var na = parseInt(a, 10) || 0;
    var nb = parseInt(b, 10) || 0;
    var cols = computeMulColumns(na, nb);
    return (
      '<span class="q-vmath q-vmath--mul q-vmath--mulsol" role="math" aria-label="' +
      escapeHtml(String(na) + " çarpı " + String(nb) + " eşittir " + String(cols.product)) +
      '">' +
      buildMulGridHtml(cols, true) +
      "</span>"
    );
  }

  function computeDivision(dividend, divisor) {
    const na = parseInt(dividend, 10) || 0;
    const nb = parseInt(divisor, 10) || 1;
    const quotient = nb ? Math.floor(na / nb) : 0;
    const product = quotient * nb;
    const remainder = na - product;
    return { dividend: na, divisor: nb, quotient: quotient, product: product, remainder: remainder };
  }

  function padDivDigits(n, width) {
    return String(n).padStart(Math.max(width, String(n).length), "0");
  }

  function divDigitWidth(n) {
    return Math.max(2, String(n).length);
  }

  function mkDivState(cols, quotient, rows, bringCol) {
    return {
      cols: cols,
      quotient: quotient || "",
      rows: rows || [],
      hasWork: (rows || []).length > 0,
      bringCol: bringCol == null ? undefined : bringCol,
    };
  }

  function computeDivProgressSteps(na, nb) {
    const ds = String(na);
    const cols = ds.split("");
    const n = cols.length;
    const steps = [];

    if (n === 1) {
      const d = parseInt(cols[0], 10);
      const q = Math.floor(d / nb);
      const p = q * nb;
      const rem = d - p;
      steps.push(mkDivState(cols, String(q), []));
      var done1 = mkDivState(cols, String(q), [
        { type: "sub", val: String(p), start: 0 },
        { type: "bar" },
        { type: "num", val: String(rem), start: 0 },
      ]);
      steps.push(done1);
      if (rem > 0) steps.push(done1);
      return steps;
    }

    if (n === 2) {
      const d1 = parseInt(cols[0], 10);
      const d2 = parseInt(cols[1], 10);
      if (d1 >= nb) {
        const q1 = Math.floor(d1 / nb);
        const p1 = q1 * nb;
        const r1 = d1 - p1;
        const work = r1 * 10 + d2;
        const q2 = Math.floor(work / nb);
        const p2 = q2 * nb;
        const r2 = work - p2;
        const fullQ = String(q1) + String(q2);
        const remStr = padDivDigits(r2, n);
        const downCol = n - 1;
        const p2Str = String(p2);
        const subP2Start = n - p2Str.length;
        var afterFirst = [
          { type: "sub", val: String(p1), start: 0 },
          { type: "bar" },
        ];
        var step2Rows = afterFirst.concat([{ type: "num", val: String(r1), start: 0 }]);
        var step3Rows = afterFirst.concat([
          { type: "bringWork", partial: String(r1), down: String(d2) },
        ]);
        var step4Rows = step3Rows.concat([
          { type: "sub", val: p2Str, start: subP2Start },
          { type: "bar" },
          { type: "num", val: remStr, start: 0 },
        ]);

        steps.push(mkDivState(cols, String(q1), [{ type: "sub", val: String(p1), start: 0 }]));
        steps.push(mkDivState(cols, String(q1), step2Rows));
        steps.push(mkDivState(cols, fullQ, step3Rows, downCol));
        if (work > 0) {
          steps.push(mkDivState(cols, fullQ, step4Rows, downCol));
        }
        return steps;
      }

      const work = d1 * 10 + d2;
      const q = Math.floor(work / nb);
      const p = q * nb;
      const rem = work - p;
      const pStr = String(p);
      const remStr = padDivDigits(rem, n);
      steps.push(mkDivState(cols, "", []));
      steps.push(mkDivState(cols, String(q), []));
      var done2 = mkDivState(cols, String(q), [
        { type: "sub", val: pStr, start: n - pStr.length },
        { type: "bar" },
        { type: "num", val: remStr, start: n - remStr.length },
      ]);
      steps.push(done2);
      if (rem > 0) steps.push(done2);
      return steps;
    }

    const parts = computeDivision(na, nb);
    const pStr = String(parts.product);
    const remStr = padDivDigits(parts.remainder, n);
    steps.push(
      mkDivState(cols, String(parts.quotient), [
        { type: "sub", val: pStr, start: n - pStr.length },
        { type: "bar" },
        { type: "num", val: remStr, start: n - remStr.length },
      ])
    );
    return steps;
  }

  function appendDivGridSign(parts, ch) {
    parts.push(
      '<span class="q-vmath__sign"' +
        (ch ? "" : ' aria-hidden="true"') +
        ">" +
        (ch ? escapeHtml(ch) : "") +
        "</span>"
    );
  }

  function appendDivGridDigits(parts, colCount, value, startCol, extraCls) {
    var s = String(value);
    var i;
    for (i = 0; i < colCount; i++) {
      var ch = i >= startCol && i < startCol + s.length ? s[i - startCol] : "\u00a0";
      parts.push(
        '<span class="q-vmath__dcol' +
          (extraCls || "") +
          '">' +
          escapeHtml(ch) +
          "</span>"
      );
    }
  }

  function buildDivLeftColHtml(state) {
    var cols = state.cols;
    var n = cols.length;
    var parts = [];
    var i;
    parts.push('<span class="q-vmath__left-col" style="--div-cols:' + n + '">');
    parts.push('<span class="q-vmath__div-grid-left">');

    appendDivGridSign(parts, "");
    for (i = 0; i < n; i++) {
      var bringSrc = state.bringCol === i;
      parts.push(
        '<span class="q-vmath__dcol q-vmath__dcol--dividend' +
          (bringSrc ? " q-vmath__dcol--bring-src" : "") +
          '">' +
          escapeHtml(cols[i]) +
          (bringSrc
            ? '<span class="q-vmath__bring-arrow q-vmath__bring-arrow--src" aria-hidden="true">↓</span>'
            : "") +
          "</span>"
      );
    }

    for (i = 0; i < state.rows.length; i++) {
      var row = state.rows[i];
      if (row.type === "sub") {
        appendDivGridSign(parts, "−");
        appendDivGridDigits(parts, n, row.val, row.start, " q-vmath__dcol--sub");
      } else if (row.type === "bar") {
        appendDivGridSign(parts, "");
        parts.push(
          '<span class="q-vmath__bar-span" style="grid-column:2 / span ' +
            n +
            '"><span class="q-vmath__divsol-bar" aria-hidden="true"></span></span>'
        );
      } else if (row.type === "num") {
        appendDivGridSign(parts, "");
        appendDivGridDigits(parts, n, row.val, row.start, " q-vmath__dcol--partial");
      } else if (row.type === "bringWork") {
        appendDivGridSign(parts, "");
        var bpi;
        for (bpi = 0; bpi < n; bpi++) {
          if (bpi === 0) {
            parts.push(
              '<span class="q-vmath__dcol q-vmath__dcol--work">' +
                escapeHtml(String(row.partial)) +
                "</span>"
            );
          } else if (bpi === n - 1) {
            parts.push(
              '<span class="q-vmath__dcol q-vmath__dcol--work">' +
                escapeHtml(String(row.down)) +
                "</span>"
            );
          } else {
            parts.push('<span class="q-vmath__dcol">\u00a0</span>');
          }
        }
      } else if (row.type === "workLine") {
        appendDivGridSign(parts, "");
        appendDivGridDigits(parts, n, row.val, row.start, " q-vmath__dcol--work");
      }
    }

    parts.push("</span></span>");
    return parts.join("");
  }

  function verticalDivStepHtml(dividend, divisor, stepNum) {
    var na = parseInt(dividend, 10) || 0;
    var nb = parseInt(divisor, 10) || 1;
    var allSteps = computeDivProgressSteps(na, nb);
    var idx = Math.min(Math.max(1, parseInt(stepNum, 10) || 1), allSteps.length) - 1;
    var state = allSteps[idx];
    var solCls = " q-vmath__div-grid--sol";
    var bracketSol = state.quotient !== "" || state.hasWork;
    return (
      '<span class="q-vmath q-vmath--div q-vmath--divstep" role="math" aria-label="' +
      escapeHtml(String(na) + " bölü " + String(nb) + " adım " + String(stepNum)) +
      '">' +
      '<span class="q-vmath__div-grid' +
      solCls +
      '">' +
      buildDivLeftColHtml(state) +
      buildDivBracketHtml(nb, bracketSol, state.quotient, true) +
      "</span></span>"
    );
  }

  function buildDivBracketHtml(divisor, withQuotient, quotient, extendLine) {
    const v = escapeHtml(String(divisor));
    var colCls = withQuotient ? " q-vmath__bracket-col--sol" : "";
    if (!withQuotient && extendLine) colCls = " q-vmath__bracket-col--long";
    var fullVline = withQuotient || extendLine;
    if (fullVline) {
      var html = '<span class="q-vmath__bracket-col' + colCls + '">';
      html +=
        '<span class="q-vmath__bracket-vline q-vmath__bracket-vline--full" aria-hidden="true"></span>';
      html += '<span class="q-vmath__bracket-stack">';
      html += '<span class="q-vmath__divisor">' + v + "</span>";
      html += '<span class="q-vmath__bracket-hline" aria-hidden="true"></span>';
      if (withQuotient) {
        html +=
          '<span class="q-vmath__quotient">' + escapeHtml(String(quotient)) + "</span>";
      } else {
        html +=
          '<span class="q-vmath__quotient q-vmath__quotient--empty" aria-hidden="true"></span>';
      }
      html += "</span></span>";
      return html;
    }
    return (
      '<span class="q-vmath__bracket-col">' +
      '<span class="q-vmath__bracket-head">' +
      '<span class="q-vmath__bracket-vline" aria-hidden="true"></span>' +
      '<span class="q-vmath__divisor">' +
      v +
      "</span></span>" +
      '<span class="q-vmath__bracket-hline" aria-hidden="true"></span>' +
      '<span class="q-vmath__quotient q-vmath__quotient--empty" aria-hidden="true"></span>' +
      "</span>"
    );
  }

  function buildDivLeftColSimple(dividendStr) {
    var cols = String(dividendStr).split("");
    var n = cols.length;
    var parts = [];
    var i;
    parts.push('<span class="q-vmath__left-col" style="--div-cols:' + n + '">');
    parts.push('<span class="q-vmath__div-grid-left">');
    appendDivGridSign(parts, "");
    for (i = 0; i < n; i++) {
      parts.push(
        '<span class="q-vmath__dcol q-vmath__dcol--dividend">' + escapeHtml(cols[i]) + "</span>"
      );
    }
    parts.push("</span></span>");
    return parts.join("");
  }

  function verticalDivHtml(dividend, divisor) {
    const aria = String(dividend) + " bölü " + String(divisor);
    return (
      '<span class="q-vmath q-vmath--div" role="math" aria-label="' +
      escapeHtml(aria) +
      '">' +
      '<span class="q-vmath__div-grid">' +
      buildDivLeftColSimple(String(dividend)) +
      buildDivBracketHtml(divisor, false, "", true) +
      "</span></span>"
    );
  }

  function verticalDivSolutionHtml(dividend, divisor) {
    const parts = computeDivision(dividend, divisor);
    const dStr = String(parts.dividend);
    const allSteps = computeDivProgressSteps(parts.dividend, parts.divisor);
    const state = allSteps[allSteps.length - 1];
    const aria =
      dStr +
      " bölü " +
      String(parts.divisor) +
      " eşittir bölüm " +
      String(parts.quotient) +
      (parts.remainder ? ", kalan " + String(parts.remainder) : "");
    return (
      '<span class="q-vmath q-vmath--div q-vmath--divsol" role="math" aria-label="' +
      escapeHtml(aria) +
      '">' +
      '<span class="q-vmath__div-grid q-vmath__div-grid--sol">' +
      buildDivLeftColHtml(state) +
      buildDivBracketHtml(parts.divisor, true, state.quotient || String(parts.quotient)) +
      "</span></span>"
    );
  }

  const SHAPE_EDGE_CONFIG = {
    kare: {
      prompts: ["Kenar uzunluğu (4 kenar eşit)"],
      expand: function (vals) {
        const e = vals[0] || "?";
        return [e, e, e, e];
      },
    },
    dikdortgen: {
      prompts: ["Üst kenar", "Sağ kenar", "Alt kenar", "Sol kenar"],
    },
    dikdörtgen: {
      prompts: ["Üst kenar", "Sağ kenar", "Alt kenar", "Sol kenar"],
    },
    ucgen: {
      prompts: ["Sol kenar", "Alt kenar", "Sağ kenar"],
    },
    üçgen: {
      prompts: ["Sol kenar", "Alt kenar", "Sağ kenar"],
    },
    daire: {
      prompts: ["Çap"],
    },
    besgen: {
      prompts: ["1. kenar", "2. kenar", "3. kenar", "4. kenar", "5. kenar"],
    },
    altigen: {
      prompts: ["1. kenar", "2. kenar", "3. kenar", "4. kenar", "5. kenar", "6. kenar"],
    },
  };

  function getShapeEdgeConfig(shapeKey) {
    const k = String(shapeKey || "").toLowerCase().replace(/\s+/g, "_");
    return SHAPE_EDGE_CONFIG[k] || { prompts: ["Kenar uzunluğu"] };
  }

  function parseEdgeSpec(spec, minCount) {
    const parts = String(spec || "")
      .split(/[,|]/)
      .map(function (p) {
        return p.trim();
      })
      .filter(Boolean);
    if (!parts.length) {
      return Array(minCount || 1).fill("?");
    }
    return parts;
  }

  function resolveShapeEdges(shapeKey, spec) {
    const cfg = getShapeEdgeConfig(shapeKey);
    const min = cfg.prompts ? cfg.prompts.length : 1;
    let vals = parseEdgeSpec(spec, min);
    if (cfg.expand) {
      vals = cfg.expand(vals);
    } else while (vals.length < min) {
      vals.push(vals[vals.length - 1] || "?");
    }
    return vals;
  }

  function geoLabel(val, unit, x, y, anchor, extra) {
    const text = escapeHtml(val) + " " + escapeHtml(unit || "cm");
    return (
      '<text class="q-geo-label"' +
      (extra || "") +
      ' x="' +
      x +
      '" y="' +
      y +
      '" text-anchor="' +
      (anchor || "middle") +
      '">' +
      text +
      "</text>"
    );
  }

  const SHAPE_ALIASES = {
    kare: "square",
    dikdortgen: "rectangle",
    dikdörtgen: "rectangle",
    ucgen: "triangle",
    üçgen: "triangle",
    daire: "circle",
    besgen: "pentagon",
    altigen: "hexagon",
    square: "square",
    rectangle: "rectangle",
    triangle: "triangle",
    circle: "circle",
    pentagon: "pentagon",
    hexagon: "hexagon",
  };

  const SOLID_ALIASES = {
    kup: "cube",
    küp: "cube",
    dikdortgenler_prizmasi: "box",
    dikdörtgenler_prizması: "box",
    kure: "sphere",
    küre: "sphere",
    silindir: "cylinder",
    koni: "cone",
    piramit: "pyramid",
    cube: "cube",
    box: "box",
    sphere: "sphere",
    cylinder: "cylinder",
    cone: "cone",
    pyramid: "pyramid",
  };

  function parseSizeSpec(spec) {
    const edges = parseEdgeSpec(spec, 1);
    if (edges.length >= 2) {
      return { w: edges[0], h: edges[1] };
    }
    return { w: edges[0], h: edges[0] };
  }

  function geometryShapeSvg(kind, spec, unit) {
    const u = unit || "cm";
    const edges = resolveShapeEdges(kind, spec);

    if (kind === "square") {
      const e = edges;
      const labels = e.map(function (v) {
        return escapeHtml(v) + " " + escapeHtml(u);
      });
      return (
        '<svg class="q-geo-svg" viewBox="0 0 180 180" role="img" aria-label="Kare">' +
        '<rect class="q-geo-fill" x="40" y="40" width="100" height="100" rx="4"></rect>' +
        '<line class="q-geo-edge" x1="40" y1="40" x2="140" y2="40"></line>' +
        '<line class="q-geo-edge" x1="140" y1="40" x2="140" y2="140"></line>' +
        '<line class="q-geo-edge" x1="140" y1="140" x2="40" y2="140"></line>' +
        '<line class="q-geo-edge" x1="40" y1="140" x2="40" y2="40"></line>' +
        geoLabel(e[0], u, 90, 30) +
        geoLabel(e[1], u, 158, 94, "start") +
        geoLabel(e[2], u, 90, 168) +
        geoLabel(e[3], u, 22, 94, "end") +
        "</svg>"
      );
    }
    if (kind === "rectangle") {
      const top = edges[0];
      const right = edges[1];
      const bottom = edges[2];
      const left = edges[3];
      return (
        '<svg class="q-geo-svg" viewBox="0 0 210 160" role="img" aria-label="Dikdörtgen">' +
        '<rect class="q-geo-fill" x="25" y="40" width="160" height="75" rx="4"></rect>' +
        '<line class="q-geo-edge" x1="25" y1="40" x2="185" y2="40"></line>' +
        '<line class="q-geo-edge" x1="185" y1="40" x2="185" y2="115"></line>' +
        '<line class="q-geo-edge" x1="185" y1="115" x2="25" y2="115"></line>' +
        '<line class="q-geo-edge" x1="25" y1="115" x2="25" y2="40"></line>' +
        geoLabel(top, u, 105, 30) +
        geoLabel(right, u, 198, 82, "start") +
        geoLabel(bottom, u, 105, 138) +
        geoLabel(left, u, 12, 82, "end") +
        "</svg>"
      );
    }
    if (kind === "triangle") {
      const left = edges[0];
      const bottom = edges[1];
      const right = edges[2];
      return (
        '<svg class="q-geo-svg" viewBox="0 0 200 170" role="img" aria-label="Üçgen">' +
        '<polygon class="q-geo-fill" points="100,25 170,140 30,140"></polygon>' +
        '<line class="q-geo-edge" x1="100" y1="25" x2="30" y2="140"></line>' +
        '<line class="q-geo-edge" x1="30" y1="140" x2="170" y2="140"></line>' +
        '<line class="q-geo-edge" x1="170" y1="140" x2="100" y2="25"></line>' +
        geoLabel(left, u, 52, 78, "end") +
        geoLabel(bottom, u, 100, 158) +
        geoLabel(right, u, 148, 78, "start") +
        "</svg>"
      );
    }
    if (kind === "circle") {
      const dia = edges[0];
      return (
        '<svg class="q-geo-svg" viewBox="0 0 170 170" role="img" aria-label="Daire">' +
        '<circle class="q-geo-fill" cx="85" cy="88" r="55"></circle>' +
        '<circle class="q-geo-edge" cx="85" cy="88" r="55" fill="none"></circle>' +
        '<line class="q-geo-measure" x1="30" y1="88" x2="140" y2="88"></line>' +
        geoLabel(dia, u, 85, 80) +
        "</svg>"
      );
    }
    if (kind === "pentagon") {
      const pts = "85,18 155,68 130,148 40,148 15,68";
      const mid = [
        [112, 38],
        [148, 112],
        [85, 162],
        [22, 112],
        [42, 38],
      ];
      let labels = "";
      for (let i = 0; i < 5; i++) {
        labels += geoLabel(edges[i] || "?", u, mid[i][0], mid[i][1]);
      }
      return (
        '<svg class="q-geo-svg" viewBox="0 0 170 175" role="img" aria-label="Beşgen">' +
        '<polygon class="q-geo-fill" points="' +
        pts +
        '"></polygon>' +
        labels +
        "</svg>"
      );
    }
    if (kind === "hexagon") {
      const pts = "85,12 150,45 150,115 85,148 20,115 20,45";
      const mid = [
        [118, 24],
        [162, 82],
        [118, 140],
        [52, 140],
        [8, 82],
        [52, 24],
      ];
      let labels = "";
      for (let i = 0; i < 6; i++) {
        labels += geoLabel(edges[i] || "?", u, mid[i][0], mid[i][1]);
      }
      return (
        '<svg class="q-geo-svg" viewBox="0 0 170 160" role="img" aria-label="Altıgen">' +
        '<polygon class="q-geo-fill" points="' +
        pts +
        '"></polygon>' +
        labels +
        "</svg>"
      );
    }
    return "";
  }

  function geometrySolidSvg(kind, spec, unit) {
    const u = escapeHtml(unit || "cm");
    const sz = parseSizeSpec(spec);
    const e = escapeHtml(sz.w) + " " + u;

    if (kind === "cube") {
      return (
        '<svg class="q-geo-svg q-geo-svg--solid" viewBox="0 0 180 160" role="img" aria-label="Küp ' +
        e +
        '">' +
        '<polygon class="q-geo-solid-top" points="55,35 115,15 175,35 115,55"></polygon>' +
        '<polygon class="q-geo-solid-left" points="55,35 55,115 115,135 115,55"></polygon>' +
        '<polygon class="q-geo-solid-right" points="115,55 175,35 175,115 115,135"></polygon>' +
        '<text class="q-geo-label" x="115" y="152" text-anchor="middle">' +
        e +
        "</text></svg>"
      );
    }
    if (kind === "box") {
      const h = escapeHtml(sz.h) + " " + u;
      return (
        '<svg class="q-geo-svg q-geo-svg--solid" viewBox="0 0 200 150" role="img" aria-label="Dikdörtgenler prizması">' +
        '<polygon class="q-geo-solid-top" points="40,40 130,20 190,45 100,65"></polygon>' +
        '<polygon class="q-geo-solid-left" points="40,40 40,110 100,130 100,65"></polygon>' +
        '<polygon class="q-geo-solid-right" points="100,65 190,45 190,115 100,130"></polygon>' +
        '<text class="q-geo-label" x="115" y="18" text-anchor="middle">' +
        e +
        '</text><text class="q-geo-label" x="198" y="82" text-anchor="start">' +
        h +
        "</text></svg>"
      );
    }
    if (kind === "sphere") {
      return (
        '<svg class="q-geo-svg q-geo-svg--solid" viewBox="0 0 160 160" role="img" aria-label="Küre ' +
        e +
        '">' +
        '<circle class="q-geo-fill" cx="80" cy="80" r="52"></circle>' +
        '<ellipse class="q-geo-solid-ring" cx="80" cy="80" rx="52" ry="14"></ellipse>' +
        '<text class="q-geo-label" x="80" y="148" text-anchor="middle">r=' +
        e +
        "</text></svg>"
      );
    }
    if (kind === "cylinder") {
      return (
        '<svg class="q-geo-svg q-geo-svg--solid" viewBox="0 0 140 170" role="img" aria-label="Silindir">' +
        '<ellipse class="q-geo-solid-top" cx="70" cy="35" rx="48" ry="14"></ellipse>' +
        '<rect class="q-geo-solid-body" x="22" y="35" width="96" height="95" rx="0"></rect>' +
        '<ellipse class="q-geo-solid-base" cx="70" cy="130" rx="48" ry="14"></ellipse>' +
        '<text class="q-geo-label" x="70" y="158" text-anchor="middle">' +
        e +
        "</text></svg>"
      );
    }
    if (kind === "cone") {
      return (
        '<svg class="q-geo-svg q-geo-svg--solid" viewBox="0 0 150 170" role="img" aria-label="Koni">' +
        '<polygon class="q-geo-solid-cone" points="75,18 130,130 20,130"></polygon>' +
        '<ellipse class="q-geo-solid-base" cx="75" cy="130" rx="55" ry="16"></ellipse>' +
        '<text class="q-geo-label" x="75" y="158" text-anchor="middle">' +
        e +
        "</text></svg>"
      );
    }
    if (kind === "pyramid") {
      return (
        '<svg class="q-geo-svg q-geo-svg--solid" viewBox="0 0 170 170" role="img" aria-label="Piramit">' +
        '<polygon class="q-geo-solid-top" points="85,20 145,95 25,95"></polygon>' +
        '<polygon class="q-geo-solid-left" points="25,95 85,145 145,95 85,20" fill-opacity="0.5"></polygon>' +
        '<line class="q-geo-edge" x1="25" y1="95" x2="145" y2="95"></line>' +
        '<text class="q-geo-label" x="85" y="162" text-anchor="middle">' +
        e +
        "</text></svg>"
      );
    }
    return "";
  }

  function bunnyVideoHtml(host, libraryId, videoId) {
    const vid = escapeHtml(videoId);
    const libId = String(libraryId || "").trim();
    const h = normalizeBunnyHost(host);
    if (libId) {
      const embed = buildBunnyEmbedUrl(libId, videoId);
      return bunnyVideoWrap(
        '<iframe src="' +
          escapeHtml(embed) +
          '" loading="eager" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Soru videosu"></iframe>',
        embed
      );
    }
    if (h) {
      const mp4 = buildBunnyMp4Url(h, videoId);
      return bunnyVideoWrap(
        '<video class="q-bunny-video__mp4" controls playsinline autoplay preload="auto" src="' +
          escapeHtml(mp4) +
          '"></video>',
        ""
      );
    }
    return '<span class="q-bunny-video q-bunny-video--missing">Video yapılandırması eksik</span>';
  }

  function parseClockTime(h, m) {
    var hour = parseInt(h, 10);
    var min = parseInt(m, 10);
    if (isNaN(hour)) hour = 0;
    if (isNaN(min)) min = 0;
    hour = ((hour % 24) + 24) % 24;
    min = ((min % 60) + 60) % 60;
    return { hour: hour, min: min };
  }

  function clockAriaLabel(hour, min) {
    return (
      String(hour).padStart(2, "0") +
      " saat " +
      String(min).padStart(2, "0") +
      " dakika"
    );
  }

  function clockNumAngle(num) {
    var n = parseInt(num, 10) || 12;
    if (n === 12) n = 0;
    return ((n * 30 - 90) * Math.PI) / 180;
  }

  function annularSectorPath(cx, cy, r0, r1, ang0, ang1) {
    var sweep = ang1 - ang0;
    if (sweep <= 0) sweep += Math.PI * 2;
    var large = sweep > Math.PI ? 1 : 0;
    var x0o = cx + r1 * Math.cos(ang0);
    var y0o = cy + r1 * Math.sin(ang0);
    var x1o = cx + r1 * Math.cos(ang1);
    var y1o = cy + r1 * Math.sin(ang1);
    var x1i = cx + r0 * Math.cos(ang1);
    var y1i = cy + r0 * Math.sin(ang1);
    var x0i = cx + r0 * Math.cos(ang0);
    var y0i = cy + r0 * Math.sin(ang0);
    return (
      "M" +
      x0o +
      " " +
      y0o +
      " A" +
      r1 +
      " " +
      r1 +
      " 0 " +
      large +
      " 1 " +
      x1o +
      " " +
      y1o +
      " L" +
      x1i +
      " " +
      y1i +
      " A" +
      r0 +
      " " +
      r0 +
      " 0 " +
      large +
      " 0 " +
      x0i +
      " " +
      y0i +
      " Z"
    );
  }

  function analogClockHtml(h, m, arcFrom, arcTo) {
    var t = parseClockTime(h, m);
    var hour = t.hour;
    var min = t.min;
    var cx = 50;
    var cy = 50;
    var r = 44;
    var hourAngle = (((hour % 12) * 30 + min * 0.5 - 90) * Math.PI) / 180;
    var minAngle = ((min * 6 - 90) * Math.PI) / 180;
    var hourLen = 22;
    var minLen = 34;
    var hx = cx + hourLen * Math.cos(hourAngle);
    var hy = cy + hourLen * Math.sin(hourAngle);
    var mx = cx + minLen * Math.cos(minAngle);
    var my = cy + minLen * Math.sin(minAngle);
    var nums = [];
    var n;
    for (n = 1; n <= 12; n += 1) {
      var ang = ((n * 30 - 90) * Math.PI) / 180;
      var tx = cx + 34 * Math.cos(ang);
      var ty = cy + 34 * Math.sin(ang) + 3.5;
      nums.push(
        '<text x="' +
          tx +
          '" y="' +
          ty +
          '" text-anchor="middle" class="q-clock__num">' +
          n +
          "</text>"
      );
    }
    var ticks = [];
    for (n = 0; n < 60; n += 1) {
      if (n % 5 === 0) continue;
      var tAng = ((n * 6 - 90) * Math.PI) / 180;
      ticks.push(
        '<line class="q-clock__tick" x1="' +
          (cx + 37 * Math.cos(tAng)) +
          '" y1="' +
          (cy + 37 * Math.sin(tAng)) +
          '" x2="' +
          (cx + 42 * Math.cos(tAng)) +
          '" y2="' +
          (cy + 42 * Math.sin(tAng)) +
          '"/>'
      );
    }
    var arcSvg = "";
    if (arcFrom != null && arcTo != null) {
      var a0 = clockNumAngle(arcFrom);
      var a1 = clockNumAngle(arcTo);
      arcSvg =
        '<path class="q-clock__arc" d="' +
        annularSectorPath(cx, cy, 14, 40, a0, a1) +
        '"/>';
    }
    var svg =
      '<svg class="q-clock__svg" viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle class="q-clock__face" cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="' +
      r +
      '"/>' +
      arcSvg +
      ticks.join("") +
      nums.join("") +
      '<line class="q-clock__hand q-clock__hand--min" x1="' +
      cx +
      '" y1="' +
      cy +
      '" x2="' +
      mx +
      '" y2="' +
      my +
      '"/>' +
      '<line class="q-clock__hand q-clock__hand--hour" x1="' +
      cx +
      '" y1="' +
      cy +
      '" x2="' +
      hx +
      '" y2="' +
      hy +
      '"/>' +
      '<circle class="q-clock__center" cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="2.5"/>' +
      "</svg>";
    return (
      '<span class="q-clock q-clock--analog' +
      (arcSvg ? " q-clock--arc" : "") +
      '" role="img" aria-label="' +
      escapeHtml(clockAriaLabel(hour, min)) +
      '">' +
      svg +
      "</span>"
    );
  }

  function analogClockArcHtml(h, m, fromNum, toNum) {
    return analogClockHtml(h, m, fromNum, toNum);
  }

  function analogClockHtmlPlain(h, m) {
    return analogClockHtml(h, m, null, null);
  }

  function digitalClockHtml(h, m) {
    var t = parseClockTime(h, m);
    var hh = String(t.hour).padStart(2, "0");
    var mm = String(t.min).padStart(2, "0");
    return (
      '<span class="q-clock q-clock--digital" role="img" aria-label="' +
      escapeHtml(clockAriaLabel(t.hour, t.min)) +
      '"><span class="q-clock__lcd">' +
      hh +
      '<span class="q-clock__colon">:</span>' +
      mm +
      "</span></span>"
    );
  }

  var PARA_CDN_BASE = "https://duellox-cdn.b-cdn.net/v1/paralar/";
  var PARA_FILE_MAP = {
    "5TL": "5TL.jpg",
    "10TL": "10TL.jpg",
    "20TL": "20TL.jpg",
    "50TL": "50TL.jpg",
    "100TL": "100TL.jpg",
    "200TL": "200TL.jpg",
    "5kr": "madeni_5krs.png",
    "10kr": "madeni_10krs.png",
    "25kr": "madeni_25krs.png",
    "50kr": "madeni_50krs.png",
    "1TL": "1TL.png",
    "5TLm": "madeni_5TL.png",
  };

  function paraFileForKey(key) {
    var k = String(key || "")
      .trim()
      .replace(/\s+/g, "");
    if (!k) return "";
    if (PARA_FILE_MAP[k]) return PARA_FILE_MAP[k];
    var low = k.toLowerCase();
    if (PARA_FILE_MAP[low]) return PARA_FILE_MAP[low];
    if (/^\d+TL$/i.test(k)) return k.replace(/tl/i, "TL") + ".jpg";
    if (/^\d+kr$/i.test(k)) {
      var n = k.match(/^(\d+)/i)[1];
      return "madeni_" + n + "krs.png";
    }
    return k;
  }

  function paraImgHtml(spec) {
    var parts = String(spec || "")
      .split(/[|,]/)
      .map(function (p) {
        return p.trim();
      })
      .filter(Boolean);
    if (!parts.length) return "";
    return (
      '<span class="q-para-row" role="img" aria-label="Para görseli">' +
      parts
        .map(function (key) {
          var file = paraFileForKey(key);
          var url = PARA_CDN_BASE + encodeURIComponent(file).replace(/%2F/g, "/");
          return (
            '<img class="q-para-img" src="' +
            escapeHtml(url) +
            '" alt="' +
            escapeHtml(key) +
            '" loading="lazy">'
          );
        })
        .join("") +
      "</span>"
    );
  }

  function teraziHtml(leftSpec, rightSpec) {
    var left = String(leftSpec || "")
      .split(",")
      .map(function (x) {
        return x.trim();
      })
      .filter(Boolean);
    var right = String(rightSpec || "")
      .split(",")
      .map(function (x) {
        return x.trim();
      })
      .filter(Boolean);
    var leftSum = left.reduce(function (a, b) {
      return a + (parseFloat(b) || 0);
    }, 0);
    var rightSum = right.reduce(function (a, b) {
      return a + (parseFloat(b) || 0);
    }, 0);
    var tilt = leftSum === rightSum ? 0 : leftSum > rightSum ? 8 : -8;
    var beam =
      '<g transform="rotate(' +
      tilt +
      ' 50 42)"><rect class="q-terazi__beam" x="18" y="40" width="64" height="4" rx="2"/></g>';
    var pans = "";
    var i;
    for (i = 0; i < left.length; i += 1) {
      pans +=
        '<text class="q-terazi__label" x="24" y="' +
        (58 + i * 11) +
        '">' +
        escapeHtml(left[i]) +
        " kg</text>";
    }
    for (i = 0; i < right.length; i += 1) {
      pans +=
        '<text class="q-terazi__label" x="68" y="' +
        (58 + i * 11) +
        '">' +
        escapeHtml(right[i]) +
        " kg</text>";
    }
    var svg =
      '<svg class="q-terazi__svg" viewBox="0 0 100 88" aria-hidden="true">' +
      '<polygon class="q-terazi__stand" points="50,82 42,68 58,68"/>' +
      '<rect class="q-terazi__pole" x="48" y="28" width="4" height="42" rx="2"/>' +
      beam +
      '<line class="q-terazi__cord" x1="24" y1="42" x2="24" y2="52"/>' +
      '<line class="q-terazi__cord" x1="76" y1="42" x2="76" y2="52"/>' +
      '<ellipse class="q-terazi__pan" cx="24" cy="56" rx="14" ry="5"/>' +
      '<ellipse class="q-terazi__pan" cx="76" cy="56" rx="14" ry="5"/>' +
      pans +
      "</svg>";
    return (
      '<span class="q-terazi" role="img" aria-label="Terazi">' + svg + "</span>"
    );
  }

  function wrapFracInlinePhrases(html) {
    if (!html || html.indexOf("q-frac") < 0) return html;
    html = html.replace(
      /(\d+\s+sayısının\s+)(<span class="q-frac"[\s\S]*?<\/span>)([^<]*?(?:kaçtır\?|nedir\?|kaç\s))/gi,
      '<span class="q-frac-sentence">$1$2$3</span>'
    );
    html = html.replace(
      /(\d+\s*['\u2019]?(?:un|ın|in|ün|nın|nin|nun|nün)\s+)(<span class="q-frac"[\s\S]*?<\/span>)([^<]{0,36})/gi,
      '<span class="q-frac-sentence">$1$2$3</span>'
    );
    html = html.replace(
      /(<span class="q-frac"[\s\S]*?<\/span>\s*(?:[<>&;]|&lt;|&gt;|≤|≥)\s*)+<span class="q-frac"[\s\S]*?<\/span>/gi,
      function (chunk) {
        return '<span class="q-frac-chain">' + chunk + "</span>";
      }
    );
    return html;
  }

  function emClassForTag(tag) {
    const t = String(tag || "").toLowerCase();
    if (t === "kirmizi" || t === "k") return "q-em q-em--red";
    if (t === "mavi" || t === "m") return "q-em q-em--blue";
    if (t === "yesil" || t === "y") return "q-em q-em--green";
    if (t === "kalin") return "q-em q-em--bold";
    return "q-em";
  }

  function renderEmphasisTags(html) {
    return html.replace(EM_TAG_RE, function (_, tag, inner) {
      const cls = emClassForTag(tag);
      const safe = String(inner);
      if (String(tag).toLowerCase() === "kalin") {
        return '<strong class="' + cls + '">' + safe + "</strong>";
      }
      return '<span class="' + cls + '">' + safe + "</span>";
    });
  }

  function geometryBasicMarkupHtml(kind) {
    const fn =
      typeof global.__novaGeometryBasicSvg === "function"
        ? global.__novaGeometryBasicSvg
        : null;
    if (!fn) return "";
    const svg = fn(String(kind || "").toLowerCase());
    return svg || "";
  }

  function sekilCisimMarkupHtml(type, kind) {
    const k = String(kind || "").toLowerCase();
    const fn =
      type === "cisim"
        ? typeof global.__novaCisimSvg === "function"
          ? global.__novaCisimSvg
          : null
        : typeof global.__novaSekilSvg === "function"
          ? global.__novaSekilSvg
          : null;
    if (!fn) return "";
    const svg = fn(k);
    return svg || "";
  }

  function renderMarkupHtml(raw) {
    if (raw == null || raw === "") return "";
    let s = escapeHtml(String(raw));
    s = s.replace(GEO_BASIC_RE, function (_, kind) {
      const svg = geometryBasicMarkupHtml(kind);
      return svg || "[[geo:" + kind + "]]";
    });
    s = s.replace(SEKIL_RE, function (_, kind) {
      const svg = sekilCisimMarkupHtml("sekil", kind);
      return svg || "[[sekil:" + kind + "]]";
    });
    s = s.replace(CISIM_RE, function (_, kind) {
      const svg = sekilCisimMarkupHtml("cisim", kind);
      return svg || "[[cisim:" + kind + "]]";
    });
    s = s.replace(FRAC_RE, function (_, a, b) {
      return stackedFractionHtml(a, b);
    });
    s = s.replace(FRACBAR_RE, function (_, a, b) {
      return fracBarHtml(a, b);
    });
    s = s.replace(CLOCKARC_RE, function (_, h, m, fromNum, toNum) {
      return analogClockArcHtml(h, m, fromNum, toNum);
    });
    s = s.replace(CLOCK_RE, function (_, kind, h, m) {
      var k = String(kind || "a").toLowerCase();
      if (k === "d" || k === "digital") {
        return digitalClockHtml(h, m);
      }
      return analogClockHtmlPlain(h, m);
    });
    s = s.replace(PARA_RE, function (_, spec) {
      return paraImgHtml(spec);
    });
    s = s.replace(TERAZI_RE, function (_, left, right) {
      return teraziHtml(left, right);
    });
    s = s.replace(ADDSOL_MULTI_RE, function (_, ops) {
      return verticalAddSolutionFromOperands(parseAddOperands(ops));
    });
    s = s.replace(SUBSOL_RE, function (_, a, b) {
      return verticalSubSolutionHtml(a, b);
    });
    s = s.replace(SUB_PAIR_RE, function (_, a, b) {
      return verticalSubHtml(a, b);
    });
    s = s.replace(MULSOL_RE, function (_, a, b) {
      return verticalMulSolutionHtml(a, b);
    });
    s = s.replace(ADD_MULTI_RE, function (_, ops) {
      return verticalAddFromOperands(parseAddOperands(ops));
    });
    s = s.replace(MUL_RE, function (_, a, b) {
      return verticalMulHtml(a, b);
    });
    s = s.replace(DIVSTEP_RE, function (_, a, b, step) {
      return verticalDivStepHtml(a, b, step);
    });
    s = s.replace(DIVSOL_RE, function (_, a, b) {
      return verticalDivSolutionHtml(a, b);
    });
    s = s.replace(DIV_RE, function (_, a, b) {
      return verticalDivHtml(a, b);
    });
    s = s.replace(SHAPE_RE, function (_, name, spec, unit) {
      const kind = SHAPE_ALIASES[String(name).toLowerCase().replace(/\s+/g, "_")] || "square";
      const svg = geometryShapeSvg(kind, spec, unit || "cm");
      return svg ? '<span class="q-geo q-geo--shape">' + svg + "</span>" : "";
    });
    s = s.replace(SOLID_RE, function (_, name, spec, unit) {
      const kind = SOLID_ALIASES[String(name).toLowerCase().replace(/\s+/g, "_")] || "cube";
      const svg = geometrySolidSvg(kind, spec, unit || "cm");
      return svg ? '<span class="q-geo q-geo--solid">' + svg + "</span>" : "";
    });
    s = s.replace(BUNNY_VID_RE, function (_, host, vid) {
      const parts = String(host || "").trim();
      if (/^\d+$/.test(parts)) {
        return bunnyVideoHtml("", parts, vid);
      }
      return bunnyVideoHtml(parts, "", vid);
    });
    s = s.replace(STEPHR_RE, '<hr class="q-step-divider" aria-hidden="true">');
    s = s.replace(RESULT_RE, function (_, n) {
      return '<span class="q-final-result">' + escapeHtml(n) + "</span>";
    });
    s = renderEmphasisTags(s);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong class="q-em q-em--bold">$1</strong>');
    s = s.replace(/\n/g, "<br>");
    s = wrapFracInlinePhrases(s);
    return s;
  }

  /** Öncül metnini maddelere ayır */
  function parsePreambleItems(info, infoItems) {
    if (Array.isArray(infoItems) && infoItems.length) {
      return infoItems
        .map(function (t, i) {
          const s = String(t || "").trim();
          if (!s) return null;
          const m = s.match(/^((?:I{1,3}|IV|VI{0,3}|IX|X)\.|\(\d+\)|\d+\.)\s*([\s\S]*)$/);
          if (m) return { label: m[1].trim(), text: m[2].trim() };
          return { label: defaultRoman(i), text: s };
        })
        .filter(Boolean);
    }

    const text = String(info || "").trim();
    if (!text) return [];

    if (isImageUrl(text)) return [];

    const romanParts = text.split(/(?=^\s*(?:I{1,3}|IV|VI{0,3}|IX|X)\.\s+)/m).filter(function (p) {
      return p.trim();
    });
    if (romanParts.length > 1) {
      return romanParts.map(function (block) {
        const m = block.match(/^\s*((?:I{1,3}|IV|VI{0,3}|IX|X)\.)\s*([\s\S]*)$/);
        return m ? { label: m[1], text: m[2].trim() } : { text: block.trim() };
      });
    }

    const parenParts = text.split(/(?=^\s*\(\d+\)\s+)/m).filter(function (p) {
      return p.trim();
    });
    if (parenParts.length > 1) {
      return parenParts.map(function (block) {
        const m = block.match(/^\s*(\(\d+\))\s*([\s\S]*)$/);
        return m ? { label: m[1], text: m[2].trim() } : { text: block.trim() };
      });
    }

    const lines = text
      .split(/\n+/)
      .map(function (l) {
        return l.trim();
      })
      .filter(Boolean);
    if (lines.length > 1) {
      return lines.map(function (line, i) {
        const m = line.match(/^((?:I{1,3}|IV|VI{0,3}|IX|X)\.|\(\d+\)|\d+\.)\s*([\s\S]*)$/);
        if (m) return { label: m[1], text: m[2].trim() };
        return { label: defaultRoman(i), text: line };
      });
    }

    return [{ text: text }];
  }

  function serializePreambleItems(items) {
    if (!items || !items.length) return "";
    return items
      .filter(function (it) {
        return it && String(it.text || it).trim();
      })
      .map(function (it, i) {
        const body = String(it.text != null ? it.text : it).trim();
        const label = it.label ? String(it.label).trim() : defaultRoman(i);
        if (/^(?:I{1,3}|IV|VI{0,3}|IX|X)\.$/.test(label) || /^\(\d+\)$/.test(label)) {
          return label + " " + body;
        }
        return body;
      })
      .join("\n\n");
  }

  function normalizeBlockItem(raw) {
    if (!raw || typeof raw !== "object") return null;
    const type = String(raw.type || "").toLowerCase();
    if (type === "text") {
      const content = String(raw.content || raw.text || "").trim();
      return content ? { type: "text", content: content } : null;
    }
    if (type === "items") {
      const items = Array.isArray(raw.items)
        ? raw.items
            .map(function (it, i) {
              if (typeof it === "string") {
                const s = it.trim();
                if (!s) return null;
                const m = s.match(/^((?:I{1,3}|IV|VI{0,3}|IX|X)\.|\(\d+\))\s*([\s\S]*)$/);
                return m
                  ? { label: m[1], text: m[2].trim() }
                  : { label: defaultRoman(i), text: s };
              }
              if (it && it.text) {
                return {
                  label: it.label || defaultRoman(i),
                  text: String(it.text).trim(),
                };
              }
              return null;
            })
            .filter(Boolean)
        : [];
      return items.length ? { type: "items", items: items } : null;
    }
    if (type === "image") {
      const url = String(raw.url || raw.src || "").trim();
      return url ? { type: "image", url: url } : null;
    }
    if (type === "video") {
      const videoId = String(raw.videoId || "").trim();
      if (!videoId) return null;
      return {
        type: "video",
        libraryName: normalizeBunnyHost(raw.libraryName || raw.host || ""),
        libraryId: String(raw.libraryId || "").trim(),
        videoId: videoId,
      };
    }
    return null;
  }

  function blocksFromLegacy(info, infoItems) {
    const blocks = [];
    const infoVal = String(info || "").trim();
    if (infoVal && isImageUrl(infoVal)) {
      blocks.push({ type: "image", url: infoVal });
    } else {
      const items = parsePreambleItems(info, infoItems);
      if (items.length > 1 || (items.length === 1 && items[0].label)) {
        blocks.push({ type: "items", items: items });
      } else if (items.length === 1 && items[0].text) {
        blocks.push({ type: "text", content: items[0].text });
      } else if (infoVal && !isGenericPrompt(info)) {
        blocks.push({ type: "text", content: infoVal });
      }
    }
    return blocks;
  }

  function getInfoBlocks(info, infoItems, infoBlocks) {
    if (Array.isArray(infoBlocks) && infoBlocks.length) {
      return infoBlocks.map(normalizeBlockItem).filter(Boolean);
    }
    return blocksFromLegacy(info, infoItems);
  }

  function blocksToLegacy(blocks) {
    if (!blocks || !blocks.length) {
      return { info: null, infoItems: null, infoBlocks: null };
    }
    const normalized = blocks.map(normalizeBlockItem).filter(Boolean);
    if (!normalized.length) {
      return { info: null, infoItems: null, infoBlocks: null };
    }

    let info = null;
    let infoItems = null;

    if (normalized.length === 1) {
      const b = normalized[0];
      if (b.type === "text") {
        info = b.content;
      } else if (b.type === "items") {
        infoItems = b.items.map(function (it) {
          return (it.label ? it.label + " " : "") + it.text;
        });
        info = serializePreambleItems(b.items);
      } else if (b.type === "image") {
        info = b.url;
      } else if (b.type === "video") {
        info = "[[bunny:" + (b.libraryName || b.libraryId || "") + ":" + b.videoId + "]]";
      }
    } else {
      const parts = normalized.map(function (b) {
        if (b.type === "text") return b.content;
        if (b.type === "items") return serializePreambleItems(b.items);
        if (b.type === "image") return b.url;
        if (b.type === "video") {
          return "[[bunny:" + (b.libraryName || b.libraryId || "") + ":" + b.videoId + "]]";
        }
        return "";
      });
      info = parts.filter(Boolean).join("\n\n");
    }

    return { info: info, infoItems: infoItems, infoBlocks: normalized };
  }

  function itemsListHtml(items) {
    if (!items || !items.length) return "";
    if (items.length === 1 && !items[0].label) {
      return (
        '<div class="question-info-text q-markup">' + renderMarkupHtml(items[0].text) + "</div>"
      );
    }
    return (
      '<ol class="question-preamble-list" role="list">' +
      items
        .map(function (it) {
          const label = it.label
            ? '<span class="question-preamble-label">' + escapeHtml(it.label) + "</span>"
            : "";
          return (
            '<li class="question-preamble-item">' +
            label +
            '<span class="question-preamble-body q-markup">' +
            renderMarkupHtml(it.text) +
            "</span></li>"
          );
        })
        .join("") +
      "</ol>"
    );
  }

  function blockHtml(block) {
    if (!block) return "";
    if (block.type === "text") {
      return (
        '<div class="question-preamble-block question-preamble-block--text q-markup">' +
        renderMarkupHtml(block.content) +
        "</div>"
      );
    }
    if (block.type === "items") {
      return (
        '<div class="question-preamble-block question-preamble-block--items">' +
        itemsListHtml(block.items) +
        "</div>"
      );
    }
    if (block.type === "image") {
      return (
        '<div class="question-preamble-block question-preamble-block--image">' +
        '<img class="question-info-image" src="' +
        escapeHtml(block.url) +
        '" alt="Öncül görseli" loading="lazy">' +
        "</div>"
      );
    }
    if (block.type === "video") {
      return (
        '<div class="question-preamble-block question-preamble-block--video">' +
        bunnyVideoHtml(block.libraryName, block.libraryId, block.videoId) +
        "</div>"
      );
    }
    return "";
  }

  function isGenericPrompt(info) {
    return /doğru seçeneği işaretleyin\.?/i.test(String(info || "").trim());
  }

  function preambleHtml(info, infoItems, infoBlocks) {
    const blocks = getInfoBlocks(info, infoItems, infoBlocks);
    if (!blocks.length) return "";
    return (
      '<div class="question-preamble-wrap">' +
      blocks.map(blockHtml).join("") +
      "</div>"
    );
  }

  function applyPreambleHyphenation(wrap) {
    try {
      if (global.NovaTurkishHyphen && typeof global.NovaTurkishHyphen.applyToPreamble === "function") {
        global.NovaTurkishHyphen.applyToPreamble(wrap);
      }
    } catch (_) {}
  }

  function mountPreambleBlocks(parent, info, infoItems, infoBlocks) {
    const blocks = getInfoBlocks(info, infoItems, infoBlocks);
    if (!blocks.length) return false;

    const wrap = document.createElement("div");
    wrap.className = "question-preamble-wrap";
    wrap.innerHTML = blocks.map(blockHtml).join("");
    parent.appendChild(wrap);
    applyPreambleHyphenation(wrap);
    return true;
  }

  function applyQuestionMediaFlags(container, opts) {
    opts = opts || {};
    const blocks = getInfoBlocks(opts.info, opts.infoItems, opts.infoBlocks);
    const hasVideo = blocks.some(function (b) {
      return b && b.type === "video";
    });
    const hasImage =
      blocks.some(function (b) {
        return b && b.type === "image";
      }) || isImageUrl(String(opts.info || "").trim());
    if (container) {
      container.setAttribute("data-q-has-video", hasVideo ? "1" : "");
      container.setAttribute("data-q-has-image", hasImage ? "1" : "");
      try {
        if (typeof global.novaUpdateQuestionTypeBadges === "function") {
          global.novaUpdateQuestionTypeBadges(container);
        }
      } catch (_) {}
    }
    return { hasVideo: hasVideo, hasImage: hasImage };
  }

  /** Öncül + soru kökünü konteynere yerleştir */
  function mountQuestionText(container, opts) {
    opts = opts || {};
    const info = opts.info || "";
    const infoItems = opts.infoItems;
    const infoBlocks = opts.infoBlocks;
    const question = opts.question || "";

    applyQuestionMediaFlags(container, opts);

    const textContainer = document.createElement("div");
    textContainer.className = "question-text-container";

    const hasPreamble = mountPreambleBlocks(textContainer, info, infoItems, infoBlocks);

    if (hasPreamble) {
      const divider = document.createElement("div");
      divider.className = "question-divider";
      divider.setAttribute("role", "separator");
      divider.setAttribute("aria-hidden", "true");
      textContainer.appendChild(divider);
    } else {
      textContainer.classList.add("no-preamble");
    }

    const questionText = document.createElement("div");
    questionText.className = "question-actual-text q-markup";
    questionText.innerHTML = renderMarkupHtml(question);
    textContainer.appendChild(questionText);

    container.appendChild(textContainer);
    initBunnyVideos(textContainer);
    applyQuestionMediaFlags(container, opts);
    if (typeof global.requestAnimationFrame === "function") {
      global.requestAnimationFrame(function () {
        initBunnyVideos(textContainer);
      });
    }
    return textContainer;
  }

  function fillMarkupElement(el, raw) {
    if (!el) return;
    el.classList.add("q-markup");
    el.innerHTML = renderMarkupHtml(raw);
    initBunnyVideos(el);
  }

  function mountDenemePreamble(parent, info, infoItems, infoBlocks) {
    const blocks = getInfoBlocks(info, infoItems, infoBlocks);
    if (!blocks.length) return;

    const pre = document.createElement("div");
    pre.className = "deneme-q-pre";
    pre.innerHTML = blocks.map(blockHtml).join("");
    parent.appendChild(pre);
    initBunnyVideos(pre);
    applyPreambleHyphenation(pre);
  }

  function insertAtCursor(input, token) {
    if (!input) return;
    const start = input.selectionStart != null ? input.selectionStart : input.value.length;
    const end = input.selectionEnd != null ? input.selectionEnd : start;
    const v = input.value;
    input.value = v.slice(0, start) + token + v.slice(end);
    const pos = start + token.length;
    input.focus();
    if (input.setSelectionRange) input.setSelectionRange(pos, pos);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function wrapSelection(input, left, right) {
    if (!input) return false;
    const start = input.selectionStart != null ? input.selectionStart : input.value.length;
    const end = input.selectionEnd != null ? input.selectionEnd : start;
    if (start === end) return false;
    const v = input.value;
    const sel = v.slice(start, end);
    input.value = v.slice(0, start) + left + sel + right + v.slice(end);
    const ns = start + left.length;
    const ne = ns + sel.length;
    input.focus();
    if (input.setSelectionRange) input.setSelectionRange(ns, ne);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  function wrapEmphasis(input, kind) {
    if (!input) return false;
    const k = String(kind || "").toLowerCase();
    if (k === "kalin") {
      return wrapSelection(input, "**", "**");
    }
    if (k === "kirmizi" || k === "mavi" || k === "yesil") {
      return wrapSelection(input, "{" + k + ":", "}");
    }
    return false;
  }

  function insertFraction(input, num, den) {
    insertAtCursor(input, "[[" + (num || "1") + "/" + (den || "3") + "]]");
  }

  function insertMul(input, a, b) {
    insertAtCursor(input, "[[mul:" + a + "×" + b + "]]");
  }

  function insertDiv(input, a, b) {
    insertAtCursor(input, "[[div:" + a + "÷" + b + "]]");
  }

  function insertShape(input, shape, edgesSpec, unit) {
    insertAtCursor(input, "[[shape:" + shape + ":" + edgesSpec + ":" + (unit || "cm") + "]]");
  }

  function promptShapeEdges(shapeKey) {
    const cfg = getShapeEdgeConfig(shapeKey);
    const prompts = cfg.prompts || ["Kenar uzunluğu"];
    const vals = [];
    for (let i = 0; i < prompts.length; i++) {
      const v = prompt(prompts[i] + ":", i === 0 ? "5" : "");
      if (v == null) return null;
      const t = v.trim();
      if (!t) {
        alert("Kenar uzunluğu boş bırakılamaz.");
        return null;
      }
      vals.push(t);
    }
    const unit = prompt("Birim:", "cm");
    if (unit == null) return null;
    return { edgesSpec: vals.join(","), unit: unit.trim() || "cm" };
  }

  function insertSolid(input, solid, size, unit) {
    insertAtCursor(input, "[[solid:" + solid + ":" + size + ":" + (unit || "cm") + "]]");
  }

  global.NovaQuestionMarkup = {
    escapeHtml: escapeHtml,
    renderMarkupHtml: renderMarkupHtml,
    parsePreambleItems: parsePreambleItems,
    serializePreambleItems: serializePreambleItems,
    getInfoBlocks: getInfoBlocks,
    blocksFromLegacy: blocksFromLegacy,
    blocksToLegacy: blocksToLegacy,
    normalizeBlockItem: normalizeBlockItem,
    preambleHtml: preambleHtml,
    blockHtml: blockHtml,
    applyQuestionMediaFlags: applyQuestionMediaFlags,
    mountQuestionText: mountQuestionText,
    fillMarkupElement: fillMarkupElement,
    mountDenemePreamble: mountDenemePreamble,
    initBunnyVideos: initBunnyVideos,
    bunnyVideoHtml: bunnyVideoHtml,
    isImageUrl: isImageUrl,
    insertAtCursor: insertAtCursor,
    wrapSelection: wrapSelection,
    wrapEmphasis: wrapEmphasis,
    insertFraction: insertFraction,
    insertMul: insertMul,
    insertDiv: insertDiv,
    insertShape: insertShape,
    insertSolid: insertSolid,
    promptShapeEdges: promptShapeEdges,
    getShapeEdgeConfig: getShapeEdgeConfig,
    SHAPE_EDGE_CONFIG: SHAPE_EDGE_CONFIG,
    SHAPE_ALIASES: SHAPE_ALIASES,
    SOLID_ALIASES: SOLID_ALIASES,
  };
})(typeof window !== "undefined" ? window : globalThis);

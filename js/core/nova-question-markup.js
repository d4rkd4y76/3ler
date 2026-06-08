/**
 * Soru metni: kesirler [[1/3]], dikey toplama [[add:243+125]], çözüm [[addsol:348+225]],
 * dikey çarpma [[mul:23×45]], bölme [[div:144÷12]],
 * geometri [[shape:kare:5:cm]], cisim [[solid:kup:4:cm]], Bunny video [[bunny:host:videoId]]
 * Öncül: infoBlocks (metin, madde, görsel, video) + geriye dönük info / infoItems
 */
(function (global) {
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const FRAC_RE = /\[\[\s*(\d+)\s*[\/|]\s*(\d+)\s*\]\]/g;
  const ADD_RE = /\[\[\s*add\s*:\s*(\d+)\s*\+\s*(\d+)\s*\]\]/gi;
  const ADDSOL_RE = /\[\[\s*addsol\s*:\s*(\d+)\s*\+\s*(\d+)\s*\]\]/gi;
  const MUL_RE = /\[\[\s*mul\s*:\s*(\d+)\s*[×x*]\s*(\d+)\s*\]\]/gi;
  const DIV_RE = /\[\[\s*div\s*:\s*(\d+)\s*[÷\/]\s*(\d+)\s*\]\]/gi;
  const SHAPE_RE = /\[\[\s*shape\s*:\s*([a-zçğıöşü_]+)\s*:\s*([^:\]]+)(?:\s*:\s*([a-zçğıöşü]+))?\s*\]\]/gi;
  const SOLID_RE = /\[\[\s*solid\s*:\s*([a-zçğıöşü_]+)\s*:\s*([^:\]]+)(?:\s*:\s*([a-zçğıöşü]+))?\s*\]\]/gi;
  const BUNNY_VID_RE = /\[\[\s*bunny\s*:\s*([^:\]]*)\s*:\s*([a-f0-9-]{8,})\s*\]\]/gi;
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

  function padMathNums(a, b, resultLen) {
    const len = resultLen || Math.max(String(a).length, String(b).length);
    return {
      len: len,
      top: String(a).padStart(len, "\u00a0"),
      bottom: String(b).padStart(len, "\u00a0"),
    };
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
    var topD = splitPaddedDigits(cols.top, len);
    var botD = splitPaddedDigits(cols.bottom, len);
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

    parts.push('<span class="q-vmath__grid-row q-vmath__grid-row--top">');
    parts.push('<span class="q-vmath__gcol q-vmath__gcol--sign" aria-hidden="true"></span>');
    for (var ti = 0; ti < len; ti++) {
      parts.push(
        '<span class="q-vmath__gcol"><span class="q-vmath__digit">' +
          (topD[ti] ? escapeHtml(topD[ti]) : "&nbsp;") +
          "</span></span>"
      );
    }
    parts.push("</span>");

    parts.push('<span class="q-vmath__grid-row q-vmath__grid-row--op">');
    parts.push('<span class="q-vmath__gcol q-vmath__gcol--sign"><span class="q-vmath__sign">+</span></span>');
    for (var bi = 0; bi < len; bi++) {
      parts.push(
        '<span class="q-vmath__gcol"><span class="q-vmath__digit">' +
          (botD[bi] ? escapeHtml(botD[bi]) : "&nbsp;") +
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

  function verticalAddHtml(a, b) {
    var cols = computeAddColumns(a, b);
    return (
      '<span class="q-vmath q-vmath--add" role="math" aria-label="' +
      String(a) +
      " artı " +
      String(b) +
      '">' +
      buildAddGridHtml(cols, false) +
      "</span>"
    );
  }

  function verticalAddSolutionHtml(a, b) {
    var cols = computeAddColumns(a, b);
    return (
      '<span class="q-vmath q-vmath--add q-vmath--addsol" role="math" aria-label="' +
      String(a) +
      " artı " +
      String(b) +
      " eşittir " +
      String(cols.sum) +
      '">' +
      buildAddGridHtml(cols, true) +
      "</span>"
    );
  }

  function verticalMulHtml(a, b) {
    const x = escapeHtml(a);
    const y = escapeHtml(b);
    return (
      '<span class="q-vmath q-vmath--mul" role="math" aria-label="' +
      x +
      " çarpı " +
      y +
      '">' +
      '<span class="q-vmath__col">' +
      '<span class="q-vmath__row q-vmath__row--top">' +
      x +
      '</span><span class="q-vmath__row q-vmath__row--op"><span class="q-vmath__sign">×</span>' +
      y +
      '</span><span class="q-vmath__bar" aria-hidden="true"></span>' +
      "</span></span>"
    );
  }

  function verticalDivHtml(dividend, divisor) {
    const d = escapeHtml(dividend);
    const v = escapeHtml(divisor);
    return (
      '<span class="q-vmath q-vmath--div" role="math" aria-label="' +
      d +
      " bölü " +
      v +
      '">' +
      '<span class="q-vmath__long">' +
      '<span class="q-vmath__dividend">' +
      d +
      '</span><span class="q-vmath__bracket">' +
      '<span class="q-vmath__divisor">' +
      v +
      '</span><span class="q-vmath__work" aria-hidden="true"></span>' +
      "</span></span></span>"
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

  function renderMarkupHtml(raw) {
    if (raw == null || raw === "") return "";
    let s = escapeHtml(String(raw));
    s = s.replace(FRAC_RE, function (_, a, b) {
      return stackedFractionHtml(a, b);
    });
    s = s.replace(ADDSOL_RE, function (_, a, b) {
      return verticalAddSolutionHtml(a, b);
    });
    s = s.replace(ADD_RE, function (_, a, b) {
      return verticalAddHtml(a, b);
    });
    s = s.replace(MUL_RE, function (_, a, b) {
      return verticalMulHtml(a, b);
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
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\n/g, "<br>");
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

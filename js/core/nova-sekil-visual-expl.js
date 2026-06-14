/**
 * Geometrik şekil/cisim açıklama görselleri — etiketli _expl varyantları
 * NovaQuestionMarkup.renderMarkupHtml sonrasında [[sekil:…]] / [[cisim:…]] işler.
 */
(function (global) {
  "use strict";

  var origSekil =
    typeof global.__novaSekilSvg === "function" ? global.__novaSekilSvg : null;
  var origCisim =
    typeof global.__novaCisimSvg === "function" ? global.__novaCisimSvg : null;

  var SEKIL_RE = /\[\[\s*sekil\s*:\s*([a-z0-9_]+)\s*\]\]/gi;
  var CISIM_RE = /\[\[\s*cisim\s*:\s*([a-z0-9_]+)\s*\]\]/gi;

  function wrap(inner, label, w, h, cls) {
    return (
      '<span class="q-geo q-geo--sekil q-geo--expl ' +
      (cls || "") +
      '">' +
      '<svg class="q-geo-svg q-geo-svg--sekil q-geo-svg--expl" viewBox="0 0 ' +
      w +
      " " +
      h +
      '" role="img" aria-label="' +
      label +
      '">' +
      inner +
      "</svg></span>"
    );
  }

  function wrapSolid(inner, label, w, h) {
    return wrap(inner, label, w, h, "q-geo--solid");
  }

  function callout(x, y, text, anchor) {
    return (
      '<text class="q-geo-callout" x="' +
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

  function poly(pts, cls) {
    return (
      '<polygon class="' +
      (cls || "q-geo-fill") +
      '" points="' +
      pts +
      '"></polygon>'
    );
  }

  function line(x1, y1, x2, y2, cls) {
    return (
      '<line class="' +
      (cls || "q-geo-edge") +
      '" x1="' +
      x1 +
      '" y1="' +
      y1 +
      '" x2="' +
      x2 +
      '" y2="' +
      y2 +
      '"></line>'
    );
  }

  function circle(cx, cy, r, cls) {
    return (
      '<circle class="' +
      (cls || "q-geo-fill") +
      '" cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="' +
      r +
      '"></circle>'
    );
  }

  function point(x, y) {
    return (
      '<circle class="q-geo-point q-geo-point--top" cx="' +
      x +
      '" cy="' +
      y +
      '" r="5"></circle>'
    );
  }

  var OCT8 =
    "90,22 131,39 148,80 131,121 90,138 49,121 32,80 49,39";

  function oct8Edges(cls) {
    var pts = OCT8.split(" ");
    var g = "";
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i].split(",");
      var b = pts[(i + 1) % pts.length].split(",");
      g += line(+a[0], +a[1], +b[0], +b[1], cls);
    }
    return g;
  }

  function oct8Points() {
    var pts = OCT8.split(" ");
    var g = "";
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i].split(",");
      g += point(+p[0], +p[1]);
    }
    return g;
  }

  /** Kenar orta noktasından dışarı etiket */
  function edgeLabel(cx, cy, x1, y1, x2, y2, text, dist) {
    dist = dist || 15;
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2;
    var dx = mx - cx;
    var dy = my - cy;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var lx = mx + (dx / len) * dist;
    var ly = my + (dy / len) * dist;
    var anchor = "middle";
    if (Math.abs(dx) > Math.abs(dy) * 1.2) {
      anchor = dx > 0 ? "start" : "end";
    }
    return callout(lx, ly, text, anchor);
  }

  function renderSekilExpl(base) {
    base = String(base || "").toLowerCase();

    if (base === "ucgen") {
      var ax = 90,
        ay = 28,
        bx = 158,
        by = 142,
        cx = 22,
        cy = 142,
        gcx = 90,
        gcy = 104;
      return wrap(
        poly(ax + "," + ay + " " + bx + "," + by + " " + cx + "," + cy, "q-geo-fill") +
          line(ax, ay, bx, by) +
          line(bx, by, cx, cy) +
          line(cx, cy, ax, ay) +
          point(ax, ay) +
          point(bx, by) +
          point(cx, cy) +
          callout(ax, ay - 10, "köşe") +
          callout(bx + 10, by + 4, "köşe", "start") +
          callout(cx - 10, by + 4, "köşe", "end") +
          edgeLabel(gcx, gcy, ax, ay, bx, by, "kenar", 16) +
          edgeLabel(gcx, gcy, bx, by, cx, cy, "kenar", 18) +
          edgeLabel(gcx, gcy, cx, cy, ax, ay, "kenar", 16),
        "Üçgen açıklama",
        180,
        170
      );
    }
    if (base === "kare") {
      return wrap(
        '<rect class="q-geo-fill" x="42" y="42" width="96" height="96" rx="3"></rect>' +
          line(42, 42, 138, 42) +
          line(138, 42, 138, 138) +
          line(138, 138, 42, 138) +
          line(42, 138, 42, 42) +
          line(42, 42, 138, 138, "q-geo-edge q-geo-edge--dash") +
          line(138, 42, 42, 138, "q-geo-edge q-geo-edge--dash") +
          point(42, 42) +
          point(138, 42) +
          point(138, 138) +
          point(42, 138) +
          callout(42, 32, "köşe", "start") +
          callout(148, 42, "köşe", "start") +
          callout(148, 148, "köşe", "start") +
          callout(42, 148, "köşe", "start") +
          edgeLabel(90, 90, 42, 42, 138, 42, "kenar", 12) +
          edgeLabel(90, 90, 138, 42, 138, 138, "kenar", 12) +
          edgeLabel(90, 90, 138, 138, 42, 138, "kenar", 12) +
          edgeLabel(90, 90, 42, 138, 42, 42, "kenar", 12) +
          callout(90, 98, "köşegen"),
        "Kare açıklama",
        180,
        170
      );
    }
    if (base === "dikdortgen") {
      return wrap(
        '<rect class="q-geo-fill" x="28" y="52" width="124" height="72" rx="3"></rect>' +
          line(28, 52, 152, 52) +
          line(152, 52, 152, 124) +
          line(152, 124, 28, 124) +
          line(28, 124, 28, 52) +
          point(28, 52) +
          point(152, 52) +
          point(152, 124) +
          point(28, 124) +
          callout(90, 42, "uzun kenar") +
          callout(168, 88, "kısa kenar", "start") +
          callout(90, 138, "uzun kenar") +
          callout(14, 88, "kısa kenar", "end") +
          callout(28, 42, "köşe", "start"),
        "Dikdörtgen açıklama",
        180,
        170
      );
    }
    if (base === "daire") {
      return wrap(
        circle(90, 80, 58, "q-geo-fill") +
          '<circle class="q-geo-edge" cx="90" cy="80" r="58" fill="none"></circle>' +
          callout(90, 80, "iç dolu") +
          callout(90, 14, "köşe yok"),
        "Daire açıklama",
        180,
        160
      );
    }
    if (base === "cember") {
      return wrap(
        '<circle class="q-geo-edge q-geo-edge--thick" cx="90" cy="80" r="58" fill="none"></circle>' +
          callout(90, 80, "iç boş") +
          callout(90, 14, "çember çizgisi"),
        "Çember açıklama",
        180,
        160
      );
    }
    if (base === "cember_vs_daire") {
      return wrap(
        '<circle class="q-geo-edge q-geo-edge--thick" cx="52" cy="80" r="42" fill="none"></circle>' +
          circle(138, 80, 42, "q-geo-fill") +
          '<circle class="q-geo-edge" cx="138" cy="80" r="42" fill="none"></circle>' +
          callout(52, 132, "çember") +
          callout(138, 132, "daire") +
          callout(52, 28, "içi boş") +
          callout(138, 28, "içi dolu"),
        "Çember ve daire karşılaştırma",
        190,
        160
      );
    }
    if (base === "besgen") {
      var bp = "90,24 158,58 140,132 40,132 22,58";
      return wrap(
        poly(bp, "q-geo-fill") +
          line(90, 24, 158, 58) +
          line(158, 58, 140, 132) +
          line(140, 132, 40, 132) +
          line(40, 132, 22, 58) +
          line(22, 58, 90, 24) +
          point(90, 24) +
          point(158, 58) +
          point(140, 132) +
          point(40, 132) +
          point(22, 58) +
          callout(90, 12, "5 köşe") +
          edgeLabel(90, 82, 90, 24, 158, 58, "kenar", 14) +
          edgeLabel(90, 82, 140, 132, 40, 132, "kenar", 14),
        "Beşgen açıklama",
        180,
        160
      );
    }
    if (base === "altigen") {
      var hp = "90,22 150,52 150,108 90,138 30,108 30,52";
      return wrap(
        poly(hp, "q-geo-fill") +
          line(90, 22, 150, 52) +
          line(150, 52, 150, 108) +
          line(150, 108, 90, 138) +
          line(90, 138, 30, 108) +
          line(30, 108, 30, 52) +
          line(30, 52, 90, 22) +
          point(90, 22) +
          point(150, 52) +
          point(150, 108) +
          point(90, 138) +
          point(30, 108) +
          point(30, 52) +
          callout(90, 10, "6 köşe") +
          edgeLabel(90, 80, 90, 22, 150, 52, "kenar", 14) +
          edgeLabel(90, 80, 30, 108, 90, 138, "kenar", 14),
        "Altıgen açıklama",
        180,
        160
      );
    }
    if (base === "sekizgen") {
      return wrap(
        poly(OCT8, "q-geo-fill") +
          oct8Edges() +
          oct8Points() +
          callout(90, 8, "8 köşe") +
          edgeLabel(90, 80, 90, 22, 131, 39, "kenar", 14) +
          edgeLabel(90, 80, 148, 80, 131, 121, "kenar", 14) +
          edgeLabel(90, 80, 49, 121, 32, 80, "kenar", 14) +
          callout(90, 156, "8 kenar"),
        "Sekizgen açıklama",
        180,
        170
      );
    }
    return null;
  }

  function renderCisimExpl(base) {
    base = String(base || "").toLowerCase();

    if (base === "kup") {
      return wrapSolid(
        poly("55,35 115,15 175,35 115,55", "q-geo-solid-top") +
          poly("55,35 55,115 115,135 115,55", "q-geo-solid-left") +
          poly("115,55 175,35 175,115 115,135", "q-geo-solid-right") +
          callout(115, 8, "yüz") +
          callout(178, 78, "ayrıt", "start") +
          callout(55, 35, "köşe", "end") +
          callout(115, 148, "6 yüz · 8 köşe · 12 ayrıt"),
        "Küp açıklama",
        210,
        165
      );
    }
    if (base === "kare_prizma") {
      return wrapSolid(
        poly("45,38 125,18 185,42 105,62", "q-geo-solid-top") +
          poly("45,38 45,108 105,128 105,62", "q-geo-solid-left") +
          poly("105,62 185,42 185,112 105,128", "q-geo-solid-right") +
          callout(125, 8, "kare taban") +
          callout(188, 78, "dikdörtgen yan", "start") +
          callout(105, 148, "5 yüz · 8 köşe · 12 ayrıt"),
        "Kare prizma açıklama",
        220,
        165
      );
    }
    if (base === "dikdortgen_prizma") {
      return wrapSolid(
        poly("30,42 140,22 200,48 90,68", "q-geo-solid-top") +
          poly("30,42 30,118 90,138 90,68", "q-geo-solid-left") +
          poly("90,68 200,48 200,124 90,138", "q-geo-solid-right") +
          callout(115, 10, "dikdörtgen yüz") +
          callout(205, 88, "ayrıt", "start") +
          callout(115, 152, "6 yüz · 8 köşe · 12 ayrıt"),
        "Dikdörtgenler prizması açıklama",
        230,
        170
      );
    }
    if (base === "ucgen_prizma") {
      return wrapSolid(
        poly("90,18 158,52 22,52", "q-geo-solid-top") +
          poly("22,52 22,118 90,152 90,86", "q-geo-solid-left") +
          poly("90,86 158,52 158,118 90,152", "q-geo-solid-right") +
          line(22, 52, 158, 52, "q-geo-edge") +
          callout(90, 10, "üçgen taban") +
          callout(168, 88, "dikdörtgen yan", "start") +
          callout(90, 162, "5 yüz · 6 köşe · 9 ayrıt"),
        "Üçgen prizma açıklama",
        190,
        175
      );
    }
    if (base === "silindir") {
      return wrapSolid(
        '<ellipse class="q-geo-solid-top" cx="95" cy="38" rx="58" ry="16"></ellipse>' +
          '<rect class="q-geo-solid-body" x="37" y="38" width="116" height="88"></rect>' +
          line(37, 38, 37, 126, "q-geo-edge") +
          line(153, 38, 153, 126, "q-geo-edge") +
          '<ellipse class="q-geo-solid-base" cx="95" cy="126" rx="58" ry="16"></ellipse>' +
          callout(95, 24, "daire taban") +
          callout(168, 82, "eğri yan", "start") +
          callout(95, 148, "köşe/ayrıt yok"),
        "Silindir açıklama",
        200,
        165
      );
    }
    if (base === "koni") {
      return wrapSolid(
        '<ellipse class="q-geo-solid-base" cx="95" cy="118" rx="62" ry="16"></ellipse>' +
          poly("95,22 157,118 33,118", "q-geo-solid-cone") +
          line(33, 118, 157, 118, "q-geo-edge") +
          callout(95, 12, "sivri tepe") +
          callout(95, 134, "daire taban") +
          callout(168, 78, "eğri yan", "start"),
        "Koni açıklama",
        200,
        155
      );
    }
    if (base === "kure") {
      return wrapSolid(
        circle(95, 78, 52, "q-geo-solid-body") +
          '<ellipse class="q-geo-solid-ring" cx="95" cy="78" rx="52" ry="14"></ellipse>' +
          callout(95, 78, "eğri yüz") +
          callout(95, 142, "köşe/ayrıt yok"),
        "Küre açıklama",
        190,
        160
      );
    }
    if (base === "piramit") {
      return wrapSolid(
        poly("95,18 158,108 32,108", "q-geo-solid-cone") +
          line(32, 108, 158, 108) +
          line(32, 108, 95, 18) +
          line(158, 108, 95, 18) +
          callout(95, 8, "tepe köşe") +
          callout(95, 124, "kare taban") +
          callout(168, 78, "üçgen yan", "start") +
          callout(95, 148, "5 köşe"),
        "Piramit açıklama",
        200,
        160
      );
    }
    return null;
  }

  function renderSekil(kind) {
    kind = String(kind || "").toLowerCase();
    if (kind.endsWith("_expl")) {
      var expl = renderSekilExpl(kind.slice(0, -5));
      if (expl) return expl;
    }
    return origSekil ? origSekil(kind) : "";
  }

  function renderCisim(kind) {
    kind = String(kind || "").toLowerCase();
    if (kind.endsWith("_expl")) {
      var expl = renderCisimExpl(kind.slice(0, -5));
      if (expl) return expl;
    }
    return origCisim ? origCisim(kind) : "";
  }

  function sekilMarkup(kind) {
    var svg = renderSekil(kind);
    return svg || "";
  }

  function cisimMarkup(kind) {
    var svg = renderCisim(kind);
    return svg || "";
  }

  function patchRenderMarkupHtml() {
    var mq = global.NovaQuestionMarkup;
    if (!mq || typeof mq.renderMarkupHtml !== "function") return;
    if (mq.__novaSekilPatched) return;
    var orig = mq.renderMarkupHtml;
    mq.renderMarkupHtml = function (raw) {
      var html = orig.call(mq, raw);
      if (!html) return html;
      html = html.replace(SEKIL_RE, function (_, kind) {
        return sekilMarkup(kind) || "[[sekil:" + kind + "]]";
      });
      html = html.replace(CISIM_RE, function (_, kind) {
        return cisimMarkup(kind) || "[[cisim:" + kind + "]]";
      });
      return html;
    };
    mq.__novaSekilPatched = true;
  }

  global.__novaSekilExplSvg = renderSekilExpl;
  global.__novaCisimExplSvg = renderCisimExpl;
  global.__novaSekilSvg = renderSekil;
  global.__novaCisimSvg = renderCisim;

  patchRenderMarkupHtml();
  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", patchRenderMarkupHtml);
  }
})(typeof window !== "undefined" ? window : globalThis);

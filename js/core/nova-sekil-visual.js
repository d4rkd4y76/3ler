/**
 * 3. sınıf geometrik şekil ve cisim görselleri
 * [[sekil:ucgen]], [[sekil:kare]], … [[cisim:kup]], [[cisim:silindir]], …
 */
(function (global) {
  "use strict";

  var SEKIL_RE = /\[\[\s*sekil\s*:\s*([a-z0-9_]+)\s*\]\]/gi;
  var CISIM_RE = /\[\[\s*cisim\s*:\s*([a-z0-9_]+)\s*\]\]/gi;

  function wrap(inner, label, w, h, cls) {
    return (
      '<span class="q-geo q-geo--sekil ' +
      (cls || "") +
      '">' +
      '<svg class="q-geo-svg q-geo-svg--sekil" viewBox="0 0 ' +
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

  var OCT8 =
    "90,22 131,39 148,80 131,121 90,138 49,121 32,80 49,39";

  function oct8Edges() {
    var pts = OCT8.split(" ");
    var g = "";
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i].split(",");
      var b = pts[(i + 1) % pts.length].split(",");
      g += line(+a[0], +a[1], +b[0], +b[1]);
    }
    return g;
  }

  function renderSekil(kind) {
    kind = String(kind || "").toLowerCase();
    if (kind.endsWith("_expl")) return "";

    if (kind === "ucgen") {
      return wrap(
        poly("90,28 158,142 22,142", "q-geo-fill") +
          line(90, 28, 158, 142) +
          line(158, 142, 22, 142) +
          line(22, 142, 90, 28),
        "Üçgen",
        180,
        160
      );
    }
    if (kind === "kare") {
      return wrap(
        '<rect class="q-geo-fill" x="42" y="42" width="96" height="96" rx="3"></rect>' +
          line(42, 42, 138, 42) +
          line(138, 42, 138, 138) +
          line(138, 138, 42, 138) +
          line(42, 138, 42, 42),
        "Kare",
        180,
        160
      );
    }
    if (kind === "dikdortgen") {
      return wrap(
        '<rect class="q-geo-fill" x="28" y="52" width="124" height="72" rx="3"></rect>' +
          line(28, 52, 152, 52) +
          line(152, 52, 152, 124) +
          line(152, 124, 28, 124) +
          line(28, 124, 28, 52),
        "Dikdörtgen",
        180,
        160
      );
    }
    if (kind === "daire") {
      return wrap(
        circle(90, 80, 58, "q-geo-fill") +
          '<circle class="q-geo-edge" cx="90" cy="80" r="58" fill="none"></circle>',
        "Daire",
        180,
        160
      );
    }
    if (kind === "cember") {
      return wrap(
        '<circle class="q-geo-edge q-geo-edge--thick" cx="90" cy="80" r="58" fill="none" stroke-width="4"></circle>',
        "Çember",
        180,
        160
      );
    }
    if (kind === "besgen") {
      return wrap(
        poly("90,24 158,58 140,132 40,132 22,58", "q-geo-fill") +
          line(90, 24, 158, 58) +
          line(158, 58, 140, 132) +
          line(140, 132, 40, 132) +
          line(40, 132, 22, 58) +
          line(22, 58, 90, 24),
        "Beşgen",
        180,
        160
      );
    }
    if (kind === "altigen") {
      return wrap(
        poly("90,22 150,52 150,108 90,138 30,108 30,52", "q-geo-fill") +
          line(90, 22, 150, 52) +
          line(150, 52, 150, 108) +
          line(150, 108, 90, 138) +
          line(90, 138, 30, 108) +
          line(30, 108, 30, 52) +
          line(30, 52, 90, 22),
        "Altıgen",
        180,
        160
      );
    }
    if (kind === "sekizgen") {
      return wrap(
        poly(OCT8, "q-geo-fill") + oct8Edges(),
        "Sekizgen",
        180,
        160
      );
    }
    return "";
  }

  function renderCisim(kind) {
    kind = String(kind || "").toLowerCase();
    if (kind.endsWith("_expl")) return "";

    if (kind === "kup") {
      return wrapSolid(
        poly("55,35 115,15 175,35 115,55", "q-geo-solid-top") +
          poly("55,35 55,115 115,135 115,55", "q-geo-solid-left") +
          poly("115,55 175,35 175,115 115,135", "q-geo-solid-right"),
        "Küp",
        200,
        150
      );
    }
    if (kind === "kare_prizma") {
      return wrapSolid(
        poly("45,38 125,18 185,42 105,62", "q-geo-solid-top") +
          poly("45,38 45,108 105,128 105,62", "q-geo-solid-left") +
          poly("105,62 185,42 185,112 105,128", "q-geo-solid-right"),
        "Kare prizma",
        210,
        145
      );
    }
    if (kind === "dikdortgen_prizma") {
      return wrapSolid(
        poly("30,42 140,22 200,48 90,68", "q-geo-solid-top") +
          poly("30,42 30,118 90,138 90,68", "q-geo-solid-left") +
          poly("90,68 200,48 200,124 90,138", "q-geo-solid-right"),
        "Dikdörtgenler prizması",
        220,
        155
      );
    }
    if (kind === "ucgen_prizma") {
      return wrapSolid(
        poly("90,18 158,52 22,52", "q-geo-solid-top") +
          poly("22,52 22,118 90,152 90,86", "q-geo-solid-left") +
          poly("90,86 158,52 158,118 90,152", "q-geo-solid-right") +
          line(22, 52, 158, 52, "q-geo-edge"),
        "Üçgen prizma",
        180,
        165
      );
    }
    if (kind === "silindir") {
      return wrapSolid(
        '<ellipse class="q-geo-solid-top" cx="95" cy="38" rx="58" ry="16"></ellipse>' +
          '<rect class="q-geo-solid-body" x="37" y="38" width="116" height="88" rx="0"></rect>' +
          line(37, 38, 37, 126, "q-geo-edge") +
          line(153, 38, 153, 126, "q-geo-edge") +
          '<ellipse class="q-geo-solid-base" cx="95" cy="126" rx="58" ry="16"></ellipse>',
        "Silindir",
        190,
        150
      );
    }
    if (kind === "koni") {
      return wrapSolid(
        '<ellipse class="q-geo-solid-base" cx="95" cy="118" rx="62" ry="16"></ellipse>' +
          poly("95,22 157,118 33,118", "q-geo-solid-cone") +
          line(33, 118, 157, 118, "q-geo-edge"),
        "Koni",
        190,
        145
      );
    }
    if (kind === "kure") {
      return wrapSolid(
        circle(95, 78, 52, "q-geo-solid-body") +
          '<ellipse class="q-geo-solid-ring" cx="95" cy="78" rx="52" ry="14"></ellipse>',
        "Küre",
        190,
        150
      );
    }
    if (kind === "piramit") {
      return wrapSolid(
        poly("95,18 158,108 32,108", "q-geo-solid-cone") +
          poly("32,108 158,108 158,108", "q-geo-solid-base") +
          line(32, 108, 158, 108) +
          line(32, 108, 95, 18) +
          line(158, 108, 95, 18) +
          line(95, 18, 95, 108, "q-geo-edge q-geo-edge--dash"),
        "Piramit",
        190,
        130
      );
    }
    return "";
  }

  global.__novaSekilSvg = renderSekil;
  global.__novaCisimSvg = renderCisim;
  global.__novaSekilRe = SEKIL_RE;
  global.__novaCisimRe = CISIM_RE;
})(typeof window !== "undefined" ? window : globalThis);

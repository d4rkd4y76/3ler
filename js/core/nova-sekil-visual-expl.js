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

  var SEKIL_RE = /\[\[\s*sekil\s*:\s*([a-z0-9_|]+)\s*\]\]/gi;
  var CISIM_RE = /\[\[\s*cisim\s*:\s*([a-z0-9_|]+)\s*\]\]/gi;

  function splitExplKind(kind) {
    kind = String(kind || "").toLowerCase();
    var focus = "temel";
    if (kind.indexOf("|") >= 0) {
      var parts = kind.split("|");
      kind = parts[0];
      focus = (parts[1] || "temel").trim();
    }
    if (kind.endsWith("_expl")) {
      kind = kind.slice(0, -5);
    }
    return { base: kind, focus: focus };
  }

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

  /** Araçtaki gibi numaralı köşe etiketi */
  function vtxLabel(x, y, n, anchor) {
    return (
      '<text class="q-geo-vtx-label" x="' +
      x +
      '" y="' +
      y +
      '" text-anchor="' +
      (anchor || "middle") +
      '">' +
      n +
      "</text>"
    );
  }

  /** Numaralı kenar etiketi */
  function edgeNum(x, y, n, anchor) {
    return (
      '<text class="q-geo-edge-num" x="' +
      x +
      '" y="' +
      y +
      '" text-anchor="' +
      (anchor || "middle") +
      '">' +
      n +
      "</text>"
    );
  }

  function measureLine(x1, y1, x2, y2) {
    return line(x1, y1, x2, y2, "q-geo-measure");
  }

  /** Alt bilgi satırı — araç anlatımı özeti */
  function caption(x, y, text, anchor) {
    return (
      '<text class="q-geo-caption" x="' +
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

  /** Çokgen köşelerine sırayla numara + nokta */
  function polyVerts(ptsStr, startNum) {
    var pts = ptsStr.split(" ");
    var g = "";
    var n = startNum || 1;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i].split(",");
      var px = +p[0];
      var py = +p[1];
      g += point(px, py);
      var lx = px;
      var ly = py - 12;
      if (py < 40) ly = py - 8;
      if (py > 120) ly = py + 14;
      if (px < 50) lx = px - 10;
      if (px > 130) lx = px + 10;
      g += vtxLabel(lx, ly, n);
      n++;
    }
    return g;
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

  /** Kenar orta noktasına numara */
  function edgeMidLabel(x1, y1, x2, y2, n, dist) {
    dist = dist || 0;
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2;
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = (-dy / len) * dist;
    var ny = (dx / len) * dist;
    return edgeNum(mx + nx, my + ny, n);
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
        cy = 142;
      return wrap(
        poly(ax + "," + ay + " " + bx + "," + by + " " + cx + "," + cy, "q-geo-fill") +
          line(ax, ay, bx, by) +
          line(bx, by, cx, cy) +
          line(cx, cy, ax, ay) +
          point(ax, ay) +
          point(bx, by) +
          point(cx, cy) +
          vtxLabel(ax, ay - 8, "1") +
          vtxLabel(bx + 12, by + 6, "2", "start") +
          vtxLabel(cx - 12, by + 6, "3", "end") +
          edgeNum(128, 88, "1") +
          edgeNum(90, 156, "2") +
          edgeNum(52, 88, "3") +
          measureLine(102, 42, 148, 132) +
          measureLine(38, 132, 84, 42) +
          callout(ax - 4, ay + 14, "köşe", "end") +
          callout(128, 72, "kenar") +
          caption(90, 166, "3 köşe · 3 kenar"),
        "Üçgen açıklama",
        180,
        175
      );
    }
    if (base === "kare") {
      var kx = 42,
        ky = 42,
        ks = 96;
      return wrap(
        '<rect class="q-geo-fill" x="' +
          kx +
          '" y="' +
          ky +
          '" width="' +
          ks +
          '" height="' +
          ks +
          '" rx="3"></rect>' +
          line(kx, ky, kx + ks, ky) +
          line(kx + ks, ky, kx + ks, ky + ks) +
          line(kx + ks, ky + ks, kx, ky + ks) +
          line(kx, ky + ks, kx, ky) +
          line(kx, ky, kx + ks, ky + ks, "q-geo-edge q-geo-edge--dash") +
          line(kx + ks, ky, kx, ky + ks, "q-geo-edge q-geo-edge--dash") +
          point(kx, ky) +
          point(kx + ks, ky) +
          point(kx + ks, ky + ks) +
          point(kx, ky + ks) +
          vtxLabel(kx - 6, ky - 4, "1", "end") +
          vtxLabel(kx + ks + 6, ky - 4, "2", "start") +
          vtxLabel(kx + ks + 6, ky + ks + 10, "3", "start") +
          vtxLabel(kx - 6, ky + ks + 10, "4", "end") +
          edgeNum(90, 28, "1") +
          edgeNum(156, 90, "2") +
          edgeNum(90, 156, "3") +
          edgeNum(24, 90, "4") +
          measureLine(kx + 14, ky - 10, kx + ks - 14, ky - 10) +
          measureLine(kx + ks + 10, ky + 14, kx + ks + 10, ky + ks - 14) +
          measureLine(kx + 14, ky + ks + 10, kx + ks - 14, ky + ks + 10) +
          measureLine(kx - 10, ky + 14, kx - 10, ky + ks - 14) +
          callout(90, 98, "köşegen") +
          caption(90, 168, "4 köşe · 4 kenar · hepsi eşit"),
        "Kare açıklama",
        180,
        175
      );
    }
    if (base === "dikdortgen") {
      var dx = 28,
        dy = 52,
        dw = 124,
        dh = 72;
      return wrap(
        '<rect class="q-geo-fill" x="' +
          dx +
          '" y="' +
          dy +
          '" width="' +
          dw +
          '" height="' +
          dh +
          '" rx="3"></rect>' +
          line(dx, dy, dx + dw, dy) +
          line(dx + dw, dy, dx + dw, dy + dh) +
          line(dx + dw, dy + dh, dx, dy + dh) +
          line(dx, dy + dh, dx, dy) +
          point(dx, dy) +
          point(dx + dw, dy) +
          point(dx + dw, dy + dh) +
          point(dx, dy + dh) +
          vtxLabel(dx - 8, dy - 4, "1", "end") +
          vtxLabel(dx + dw + 8, dy - 4, "2", "start") +
          vtxLabel(dx + dw + 8, dy + dh + 12, "3", "start") +
          vtxLabel(dx - 8, dy + dh + 12, "4", "end") +
          edgeNum(90, 38, "1") +
          edgeNum(168, 88, "2") +
          edgeNum(90, 138, "3") +
          edgeNum(14, 88, "4") +
          measureLine(dx + 16, dy - 10, dx + dw - 16, dy - 10) +
          measureLine(dx + 16, dy + dh + 10, dx + dw - 16, dy + dh + 10) +
          measureLine(dx + dw + 10, dy + 14, dx + dw + 10, dy + dh - 14) +
          measureLine(dx - 10, dy + 14, dx - 10, dy + dh - 14) +
          callout(90, 30, "a", "middle") +
          callout(90, 140, "a", "middle") +
          callout(176, 88, "b", "start") +
          callout(8, 88, "b", "end") +
          caption(90, 162, "4 köşe · karşılıklı kenarlar eşit"),
        "Dikdörtgen açıklama",
        180,
        175
      );
    }
    if (base === "daire") {
      return wrap(
        circle(90, 78, 56, "q-geo-fill") +
          '<circle class="q-geo-edge" cx="90" cy="78" r="56" fill="none"></circle>' +
          callout(90, 78, "iç dolu") +
          callout(90, 12, "köşe yok") +
          callout(158, 78, "kenar yok", "start") +
          caption(90, 152, "Yuvarlak · köşesiz · kenarsız"),
        "Daire açıklama",
        180,
        165
      );
    }
    if (base === "cember") {
      return wrap(
        '<circle class="q-geo-edge q-geo-edge--thick" cx="90" cy="78" r="56" fill="none"></circle>' +
          callout(90, 78, "iç boş") +
          callout(90, 12, "sadece çizgi") +
          callout(158, 78, "kenar yok", "start") +
          caption(90, 152, "Yuvarlak çizgi · içi boş"),
        "Çember açıklama",
        180,
        165
      );
    }
    if (base === "cember_vs_daire") {
      return wrap(
        '<circle class="q-geo-edge q-geo-edge--thick" cx="52" cy="78" r="42" fill="none"></circle>' +
          circle(138, 78, 42, "q-geo-fill") +
          '<circle class="q-geo-edge" cx="138" cy="78" r="42" fill="none"></circle>' +
          callout(52, 130, "çember") +
          callout(138, 130, "daire") +
          callout(52, 24, "içi boş") +
          callout(138, 24, "içi dolu") +
          caption(95, 152, "Çember = çizgi · Daire = dolu alan"),
        "Çember ve daire karşılaştırma",
        190,
        165
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
          polyVerts(bp) +
          edgeNum(128, 38, "1") +
          edgeNum(156, 98, "2", "start") +
          edgeNum(90, 144, "3") +
          edgeNum(24, 98, "4", "end") +
          edgeNum(52, 38, "5") +
          caption(90, 160, "5 köşe · 5 kenar"),
        "Beşgen açıklama",
        180,
        170
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
          polyVerts(hp) +
          edgeNum(124, 32, "1") +
          edgeNum(168, 82, "2", "start") +
          edgeNum(124, 128, "3") +
          edgeNum(56, 128, "4") +
          edgeNum(12, 82, "5", "end") +
          edgeNum(56, 32, "6") +
          caption(90, 158, "6 köşe · 6 kenar"),
        "Altıgen açıklama",
        180,
        170
      );
    }
    if (base === "sekizgen") {
      return wrap(
        poly(OCT8, "q-geo-fill") +
          oct8Edges() +
          polyVerts(OCT8) +
          edgeNum(112, 26, "1") +
          edgeNum(158, 58, "2", "start") +
          edgeNum(168, 98, "3", "start") +
          edgeNum(112, 148, "4") +
          caption(90, 166, "8 köşe · 8 kenar"),
        "Sekizgen açıklama",
        180,
        175
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
          line(55, 35, 115, 15) +
          line(115, 15, 175, 35) +
          line(175, 35, 175, 115) +
          line(175, 115, 115, 135) +
          line(115, 135, 55, 115) +
          line(55, 115, 55, 35) +
          line(55, 35, 115, 55, "q-geo-edge q-geo-edge--dash") +
          line(115, 15, 115, 55) +
          line(115, 55, 115, 135) +
          point(55, 35) +
          point(115, 15) +
          point(175, 35) +
          point(55, 115) +
          point(175, 115) +
          point(115, 135) +
          vtxLabel(44, 28, "1", "end") +
          vtxLabel(115, 4, "2") +
          vtxLabel(186, 28, "3", "start") +
          vtxLabel(44, 122, "4", "end") +
          edgeMidLabel(115, 15, 175, 35, "1", -12) +
          edgeMidLabel(175, 35, 175, 115, "2", 12) +
          edgeMidLabel(175, 115, 115, 135, "3", 12) +
          edgeMidLabel(55, 115, 55, 35, "4", -14) +
          edgeMidLabel(115, 15, 115, 55, "5", -14) +
          edgeMidLabel(115, 55, 115, 135, "6", 14) +
          callout(115, 28, "yüz (kare)") +
          callout(22, 78, "üst 4 ayrıt", "end") +
          callout(188, 78, "yan 4 ayrıt", "start") +
          callout(115, 128, "alt 4 ayrıt") +
          caption(115, 152, "6 yüz · 8 köşe · 12 ayrıt"),
        "Küp açıklama",
        220,
        168
      );
    }
    if (base === "kare_prizma") {
      return wrapSolid(
        poly("45,38 125,18 185,42 105,62", "q-geo-solid-top") +
          poly("45,38 45,108 105,128 105,62", "q-geo-solid-left") +
          poly("105,62 185,42 185,112 105,128", "q-geo-solid-right") +
          line(45, 38, 125, 18) +
          line(125, 18, 185, 42) +
          line(45, 38, 45, 108) +
          line(185, 42, 185, 112) +
          point(45, 38) +
          point(125, 18) +
          point(185, 42) +
          point(45, 108) +
          point(105, 128) +
          vtxLabel(125, 8, "1") +
          vtxLabel(198, 38, "2", "start") +
          callout(125, 28, "kare taban") +
          callout(198, 78, "dikdörtgen yan", "start") +
          caption(115, 148, "6 yüz · 8 köşe · 12 ayrıt"),
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
          line(30, 42, 140, 22) +
          line(140, 22, 200, 48) +
          line(30, 42, 30, 118) +
          line(200, 48, 200, 124) +
          point(30, 42) +
          point(140, 22) +
          point(200, 48) +
          point(90, 138) +
          measureLine(48, 32, 122, 32) +
          measureLine(48, 128, 122, 128) +
          callout(115, 12, "dikdörtgen yüz") +
          callout(208, 88, "ayrıt", "start") +
          caption(115, 156, "6 yüz · 8 köşe · 12 ayrıt"),
        "Dikdörtgenler prizması açıklama",
        230,
        170
      );
    }
    if (base === "ucgen_prizma") {
      var t1 = [100, 22],
        t2 = [168, 58],
        t3 = [32, 58],
        b1 = [100, 112],
        b2 = [168, 148],
        b3 = [32, 148];
      return wrapSolid(
        poly(t1[0] + "," + t1[1] + " " + t2[0] + "," + t2[1] + " " + t3[0] + "," + t3[1], "q-geo-solid-top") +
          poly(t3[0] + "," + t3[1] + " " + t3[0] + "," + b3[1] + " " + b1[0] + "," + b1[1] + " " + t1[0] + "," + t1[1], "q-geo-solid-left") +
          poly(t1[0] + "," + t1[1] + " " + t2[0] + "," + t2[1] + " " + b2[0] + "," + b2[1] + " " + b1[0] + "," + b1[1], "q-geo-solid-right") +
          line(t1[0], t1[1], t2[0], t2[1]) +
          line(t2[0], t2[1], t3[0], t3[1]) +
          line(t3[0], t3[1], t1[0], t1[1]) +
          line(b1[0], b1[1], b2[0], b2[1]) +
          line(b2[0], b2[1], b3[0], b3[1]) +
          line(b3[0], b3[1], b1[0], b1[1]) +
          line(t1[0], t1[1], b1[0], b1[1]) +
          line(t2[0], t2[1], b2[0], b2[1]) +
          line(t3[0], t3[1], b3[0], b3[1]) +
          line(t2[0], t2[1], b2[0], b2[1], "q-geo-edge q-geo-edge--dash") +
          point(t1[0], t1[1]) +
          point(t2[0], t2[1]) +
          point(t3[0], t3[1]) +
          point(b1[0], b1[1]) +
          point(b2[0], b2[1]) +
          point(b3[0], b3[1]) +
          vtxLabel(t1[0], t1[1] - 8, "1") +
          vtxLabel(t2[0] + 10, t2[1] - 4, "2", "start") +
          vtxLabel(t3[0] - 10, t3[1] - 4, "3", "end") +
          vtxLabel(b1[0], b1[1] + 14, "4") +
          vtxLabel(b2[0] + 10, b2[1] + 4, "5", "start") +
          vtxLabel(b3[0] - 10, b3[1] + 4, "6", "end") +
          edgeMidLabel(t1[0], t1[1], t2[0], t2[1], "1", -12) +
          edgeMidLabel(t2[0], t2[1], t3[0], t3[1], "2", 14) +
          edgeMidLabel(t3[0], t3[1], t1[0], t1[1], "3", -12) +
          edgeMidLabel(b1[0], b1[1], b2[0], b2[1], "4", 14) +
          edgeMidLabel(b2[0], b2[1], b3[0], b3[1], "5", 14) +
          edgeMidLabel(b3[0], b3[1], b1[0], b1[1], "6", 14) +
          edgeMidLabel(t1[0], t1[1], b1[0], b1[1], "7", -14) +
          edgeMidLabel(t2[0], t2[1], b2[0], b2[1], "8", 14) +
          edgeMidLabel(t3[0], t3[1], b3[0], b3[1], "9", -14) +
          callout(100, 42, "üst △ 1-2-3") +
          callout(100, 132, "alt △ 4-5-6") +
          callout(182, 102, "yan 7-8-9", "start") +
          caption(100, 168, "5 yüz · 6 köşe · 9 ayrıt"),
        "Üçgen prizma açıklama",
        210,
        180
      );
    }
    if (base === "silindir") {
      return wrapSolid(
        '<ellipse class="q-geo-solid-top" cx="95" cy="38" rx="58" ry="16"></ellipse>' +
          '<rect class="q-geo-solid-body" x="37" y="38" width="116" height="88"></rect>' +
          line(37, 38, 37, 126, "q-geo-edge") +
          line(153, 38, 153, 126, "q-geo-edge") +
          '<ellipse class="q-geo-solid-base" cx="95" cy="126" rx="58" ry="16"></ellipse>' +
          callout(95, 38, "①") +
          callout(95, 126, "②") +
          callout(95, 22, "daire taban") +
          callout(168, 82, "eğri yan", "start") +
          caption(95, 148, "2 daire taban · köşe/ayrıt yok"),
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
          point(95, 22) +
          callout(95, 12, "tepe (1 nokta)") +
          callout(95, 134, "daire taban") +
          callout(168, 78, "eğri yan", "start") +
          caption(95, 152, "1 tepe · 1 daire taban · köşe yok"),
        "Koni açıklama",
        200,
        160
      );
    }
    if (base === "kure") {
      return wrapSolid(
        circle(95, 78, 52, "q-geo-solid-body") +
          '<ellipse class="q-geo-solid-ring" cx="95" cy="78" rx="52" ry="14"></ellipse>' +
          callout(95, 78, "eğri yüz") +
          callout(95, 142, "köşe/ayrıt yok · tek yüz"),
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
          line(32, 108, 158, 108, "q-geo-edge") +
          point(95, 18) +
          point(32, 108) +
          point(158, 108) +
          vtxLabel(95, 8, "1") +
          vtxLabel(32, 120, "2", "end") +
          vtxLabel(168, 108, "3", "start") +
          callout(95, 124, "kare taban") +
          callout(168, 72, "üçgen yan", "start") +
          caption(95, 148, "5 yüz · 5 köşe · 8 ayrıt"),
        "Piramit açıklama",
        200,
        160
      );
    }
    return null;
  }

  function renderSekil(kind) {
    kind = String(kind || "").toLowerCase();
    var parsed = splitExplKind(kind);
    if (kind.indexOf("_expl") >= 0 || kind.indexOf("|") >= 0) {
      if (typeof global.__novaRenderSekilFocus === "function") {
        var focused = global.__novaRenderSekilFocus(parsed.base, parsed.focus);
        if (focused) return focused;
      }
      var expl = renderSekilExpl(parsed.base);
      if (expl) return expl;
    }
    return origSekil ? origSekil(kind) : "";
  }

  function renderCisim(kind) {
    kind = String(kind || "").toLowerCase();
    var parsed = splitExplKind(kind);
    if (kind.indexOf("_expl") >= 0 || kind.indexOf("|") >= 0) {
      if (typeof global.__novaRenderCisimFocus === "function") {
        var focused = global.__novaRenderCisimFocus(parsed.base, parsed.focus);
        if (focused) return focused;
      }
      var expl = renderCisimExpl(parsed.base);
      if (expl) return expl;
    }
    return origCisim ? origCisim(kind) : "";
  }

  function sekilMarkup(kind) {
    var svg = renderSekil(kind);
    return svg || "";
  }

  function cisimMarkup(kind) {
    kind = String(kind || "").toLowerCase();
    if (
      global.NovaCisim3DViewer &&
      typeof global.NovaCisim3DViewer.isCisimExpl === "function" &&
      global.NovaCisim3DViewer.isCisimExpl(kind) &&
      typeof global.NovaCisim3DViewer.markup === "function"
    ) {
      var html3d = global.NovaCisim3DViewer.markup(kind);
      if (html3d) return html3d;
    }
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
      if (
        global.NovaCisim3DViewer &&
        typeof global.NovaCisim3DViewer.scheduleMount === "function"
      ) {
        global.NovaCisim3DViewer.scheduleMount();
      }
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

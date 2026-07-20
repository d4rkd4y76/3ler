/**
 * 3. sınıf geometri — nokta, doğru, ışın, doğru parçası, açı görselleri
 * Kullanım: [[geo:nokta]], [[geo:dogru]], [[geo:isin]], [[geo:parca]], [[geo:aci_dik]], …
 * Çizim sırası: çizgiler → yay → etiket → nokta (nokta her zaman en üstte)
 */
(function (global) {
  "use strict";

  var GEO_BASIC_RE = /\[\[\s*geo\s*:\s*([a-z0-9_]+)\s*\]\]/gi;

  function wrap(inner, label, w, h) {
    return (
      '<span class="q-geo q-geo--basic">' +
      '<svg class="q-geo-svg q-geo-svg--basic" viewBox="0 0 ' +
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

  function arrowHead(x, y, dir, size) {
    size = size || 10;
    if (dir === "right") {
      return (
        '<polygon class="q-geo-arrow" points="' +
        x +
        "," +
        y +
        " " +
        (x - size) +
        "," +
        (y - size * 0.55) +
        " " +
        (x - size) +
        "," +
        (y + size * 0.55) +
        '"></polygon>'
      );
    }
    if (dir === "left") {
      return (
        '<polygon class="q-geo-arrow" points="' +
        x +
        "," +
        y +
        " " +
        (x + size) +
        "," +
        (y - size * 0.55) +
        " " +
        (x + size) +
        "," +
        (y + size * 0.55) +
        '"></polygon>'
      );
    }
    if (dir === "up") {
      return (
        '<polygon class="q-geo-arrow" points="' +
        x +
        "," +
        y +
        " " +
        (x - size * 0.55) +
        "," +
        (y + size) +
        " " +
        (x + size * 0.55) +
        "," +
        (y + size) +
        '"></polygon>'
      );
    }
    return (
      '<polygon class="q-geo-arrow" points="' +
      x +
      "," +
      y +
      " " +
      (x - size * 0.55) +
      "," +
      (y - size) +
      " " +
      (x + size * 0.55) +
      "," +
      (y - size) +
      '"></polygon>'
    );
  }

  /** Sadece nokta dairesi — her zaman en son çizilir */
  function pointCircle(x, y, r) {
    return (
      '<circle class="q-geo-point q-geo-point--top" cx="' +
      x +
      '" cy="' +
      y +
      '" r="' +
      (r || 7) +
      '"></circle>'
    );
  }

  function pointLabel(x, y, label, lx, ly) {
    if (!label) return "";
    return (
      '<text class="q-geo-label q-geo-label--top" x="' +
      (lx != null ? lx : x + 10) +
      '" y="' +
      (ly != null ? ly : y - 10) +
      '">' +
      label +
      "</text>"
    );
  }

  /** Nokta + etiket — çizgilerden sonra kullan */
  function pointOnTop(x, y, r, label, lx, ly) {
    return pointCircle(x, y, r) + pointLabel(x, y, label, lx, ly);
  }

  function lineSeg(x1, y1, x2, y2, cls) {
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

  function vecUnit(dx, dy) {
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) return { x: 0, y: 0 };
    return { x: dx / len, y: dy / len };
  }

  /** İki ışın arasında yay — köşeden r mesafede */
  function angleArcPath(vx, vy, x1, y1, x2, y2, r) {
    var dx1 = x1 - vx;
    var dy1 = y1 - vy;
    var dx2 = x2 - vx;
    var dy2 = y2 - vy;
    if (Math.abs(dx1) + Math.abs(dy1) < 1 || Math.abs(dx2) + Math.abs(dy2) < 1) {
      return "";
    }
    var u1 = vecUnit(dx1, dy1);
    var u2 = vecUnit(dx2, dy2);
    var ax = vx + u1.x * r;
    var ay = vy + u1.y * r;
    var bx = vx + u2.x * r;
    var by = vy + u2.y * r;
    var cross = u1.x * u2.y - u1.y * u2.x;
    var sweep = cross > 0 ? 1 : 0;
    var dot = u1.x * u2.x + u1.y * u2.y;
    var large = dot < 0 ? 1 : 0;
    return (
      '<path class="q-geo-angle-arc" fill="none" d="M' +
      ax +
      "," +
      ay +
      " A" +
      r +
      "," +
      r +
      " 0 " +
      large +
      "," +
      sweep +
      " " +
      bx +
      "," +
      by +
      '"></path>'
    );
  }

  /** Açı bölgesi — hafif sarı dolgu + yay (3. sınıf için daha anlaşılır) */
  function angleArcWedge(vx, vy, x1, y1, x2, y2, r) {
    var dx1 = x1 - vx;
    var dy1 = y1 - vy;
    var dx2 = x2 - vx;
    var dy2 = y2 - vy;
    if (Math.abs(dx1) + Math.abs(dy1) < 1 || Math.abs(dx2) + Math.abs(dy2) < 1) {
      return "";
    }
    var u1 = vecUnit(dx1, dy1);
    var u2 = vecUnit(dx2, dy2);
    var ax = vx + u1.x * r;
    var ay = vy + u1.y * r;
    var bx = vx + u2.x * r;
    var by = vy + u2.y * r;
    var cross = u1.x * u2.y - u1.y * u2.x;
    var sweep = cross > 0 ? 1 : 0;
    var dot = u1.x * u2.x + u1.y * u2.y;
    var large = dot < 0 ? 1 : 0;
    var arc =
      "M" +
      ax +
      "," +
      ay +
      " A" +
      r +
      "," +
      r +
      " 0 " +
      large +
      "," +
      sweep +
      " " +
      bx +
      "," +
      by;
    return (
      '<path class="q-geo-angle-wedge" d="M' +
      vx +
      "," +
      vy +
      " L" +
      arc +
      ' Z"></path>' +
      '<path class="q-geo-angle-arc" fill="none" d="' +
      arc +
      '"></path>'
    );
  }

  /** Dik açı — küçük kare işareti */
  function rightAngleMark(vx, vy, x1, y1, x2, y2, sz) {
    sz = sz || 18;
    var u1 = vecUnit(x1 - vx, y1 - vy);
    var u2 = vecUnit(x2 - vx, y2 - vy);
    var px = vx + u1.x * sz;
    var py = vy + u1.y * sz;
    var qx = vx + u1.x * sz + u2.x * sz;
    var qy = vy + u1.y * sz + u2.y * sz;
    var rx = vx + u2.x * sz;
    var ry = vy + u2.y * sz;
    return (
      '<path class="q-geo-angle-arc q-geo-angle-arc--dik" fill="none" d="M' +
      px +
      "," +
      py +
      " L" +
      qx +
      "," +
      qy +
      " L" +
      rx +
      "," +
      ry +
      '"></path>'
    );
  }

  /**
   * Açı figürü: önce kollar, sonra yay, sonra etiket, en son köşe noktası
   * vx,vy = köşe; x1,y1 ve x2,y2 = kolların uç noktaları
   */
  function angleFigure(vx, vy, x1, y1, x2, y2, opts) {
    opts = opts || {};
    var g = "";
    g += lineSeg(vx, vy, x1, y1);
    g += lineSeg(vx, vy, x2, y2);
    if (opts.right) {
      g += rightAngleMark(vx, vy, x1, y1, x2, y2, opts.markSize || 18);
    } else {
      g += angleArcWedge(vx, vy, x1, y1, x2, y2, opts.arcR || 26);
    }
    if (opts.label) {
      g +=
        '<text class="q-geo-label" x="' +
        (opts.labelX != null ? opts.labelX : vx + 32) +
        '" y="' +
        (opts.labelY != null ? opts.labelY : vy - 8) +
        '">' +
        opts.label +
        "</text>";
    }
    g += pointCircle(vx, vy, opts.dotR || 7);
    return g;
  }

  function geometryBasicSvg(kind) {
    kind = String(kind || "").toLowerCase();

    var VX = 52;
    var VY = 118;
    var UP = { x: VX, y: 38 };
    var RIGHT = { x: 138, y: VY };
    var DAR = { x: 118, y: 72 };
    var GENIS = { x: 142, y: 142 };

    if (kind === "nokta") {
      return wrap(pointOnTop(90, 70, 8, "A", 102, 58), "Nokta A", 180, 100);
    }
    if (kind === "nokta_abc") {
      return wrap(
        lineSeg(40, 110, 140, 110, "q-geo-edge") +
          lineSeg(140, 110, 90, 30, "q-geo-edge") +
          lineSeg(90, 30, 40, 110, "q-geo-edge") +
          pointOnTop(40, 110, 6, "A", 28, 98) +
          pointOnTop(140, 110, 6, "B", 148, 98) +
          pointOnTop(90, 30, 6, "C", 98, 22),
        "Noktalar A B C",
        180,
        130
      );
    }
    if (kind === "kareli") {
      var g = "";
      for (var i = 0; i <= 4; i++) {
        g += lineSeg(20 + i * 32, 20, 20 + i * 32, 148, "q-geo-grid");
        g += lineSeg(20, 20 + i * 32, 148, 20 + i * 32, "q-geo-grid");
      }
      g += pointCircle(52, 52, 5);
      g += pointCircle(84, 84, 5);
      g += pointCircle(116, 116, 5);
      return wrap(g, "Kareli zemin", 170, 170);
    }
    if (kind === "dogru") {
      return wrap(
        lineSeg(25, 80, 155, 80) +
          arrowHead(25, 80, "left") +
          arrowHead(155, 80, "right") +
          '<text class="q-geo-label" x="90" y="62" text-anchor="middle">d doğrusu</text>',
        "Doğru",
        180,
        100
      );
    }
    if (kind === "isin") {
      return wrap(
        lineSeg(35, 80, 155, 80) +
          arrowHead(155, 80, "right") +
          pointOnTop(35, 80, 7, "A", 22, 58),
        "Işın",
        180,
        100
      );
    }
    if (kind === "parca") {
      return wrap(
        lineSeg(35, 80, 145, 80) +
          pointOnTop(35, 80, 7, "A", 22, 58) +
          pointOnTop(145, 80, 7, "B", 152, 58),
        "Doğru parçası AB",
        180,
        100
      );
    }
    if (kind === "dogru_to_isin") {
      return wrap(
        '<text class="q-geo-label" x="90" y="22" text-anchor="middle">Sol ok silindi →</text>' +
          lineSeg(35, 80, 155, 80) +
          arrowHead(155, 80, "right") +
          pointOnTop(35, 80, 7, "A", 22, 58),
        "Doğru parçasından ışına",
        180,
        110
      );
    }
    if (kind === "isin_to_parca") {
      return wrap(
        '<text class="q-geo-label" x="90" y="22" text-anchor="middle">Sağ ok silindi →</text>' +
          lineSeg(35, 80, 145, 80) +
          pointOnTop(35, 80, 7, "A", 22, 58) +
          pointOnTop(145, 80, 7, "B", 152, 58),
        "Işın ucu kapatıldı",
        180,
        110
      );
    }
    if (kind === "parca_to_dogru") {
      return wrap(
        lineSeg(25, 80, 155, 80) +
          arrowHead(25, 80, "left") +
          arrowHead(155, 80, "right"),
        "Doğru parçası uzatıldı",
        180,
        100
      );
    }
    if (kind === "aci_dik") {
      return wrap(
        angleFigure(VX, VY, UP.x, UP.y, RIGHT.x, RIGHT.y, {
          right: true,
          label: "90°",
          labelX: 78,
          labelY: 102,
        }),
        "Dik açı",
        180,
        140
      );
    }
    if (kind === "aci_dar") {
      return wrap(
        angleFigure(VX, VY, UP.x, UP.y, DAR.x, DAR.y, { arcR: 24 }),
        "Dar açı",
        180,
        140
      );
    }
    if (kind === "aci_genis") {
      return wrap(
        angleFigure(VX, VY, UP.x, UP.y, GENIS.x, GENIS.y, { arcR: 28 }),
        "Geniş açı",
        180,
        150
      );
    }
    if (kind === "aci_dogru") {
      return wrap(
        lineSeg(20, 90, 160, 90) +
          '<text class="q-geo-label" x="90" y="72" text-anchor="middle">180° — düz çizgi</text>' +
          pointCircle(90, 90, 7),
        "Doğru açı",
        180,
        110
      );
    }
    if (kind === "makas_acik") {
      var mx = 90;
      var my = 105;
      return wrap(
        lineSeg(mx, my, 42, 38) +
          lineSeg(mx, my, 138, 38) +
          angleArcWedge(mx, my, 42, 38, 138, 38, 22) +
          pointCircle(mx, my, 7),
        "Açık makas",
        180,
        120
      );
    }
    if (kind === "makas_kapali") {
      var mx2 = 90;
      var my2 = 105;
      return wrap(
        lineSeg(mx2, my2, 58, 38) +
          lineSeg(mx2, my2, 122, 38) +
          pointCircle(mx2, my2, 7),
        "Kapalı makas",
        180,
        120
      );
    }
    if (kind === "kapi_acik") {
      var hx = 48;
      var hy = 118;
      var wallUp = { x: hx, y: 26 };
      var floorEnd = { x: 132, y: hy };
      var doorEnd = { x: 118, y: 44 };
      return wrap(
        lineSeg(hx, hy, wallUp.x, wallUp.y, "q-geo-wall") +
          lineSeg(hx, hy, floorEnd.x, floorEnd.y, "q-geo-wall") +
          lineSeg(hx, hy, doorEnd.x, doorEnd.y, "q-geo-door") +
          angleArcWedge(hx, hy, wallUp.x, wallUp.y, doorEnd.x, doorEnd.y, 28) +
          pointCircle(hx, hy, 7),
        "Açık kapı açısı",
        175,
        135
      );
    }
    if (kind === "ucgen_abc") {
      return wrap(
        lineSeg(35, 115, 145, 115) +
          lineSeg(145, 115, 90, 25) +
          lineSeg(90, 25, 35, 115) +
          pointOnTop(90, 25, 6, "C", 98, 18) +
          pointOnTop(35, 115, 6, "A", 22, 112) +
          pointOnTop(145, 115, 6, "B", 152, 112),
        "Üçgen ABC",
        180,
        130
      );
    }
    if (kind === "kare") {
      return wrap(
        lineSeg(45, 45, 135, 45) +
          lineSeg(135, 45, 135, 135) +
          lineSeg(135, 135, 45, 135) +
          lineSeg(45, 135, 45, 45) +
          pointCircle(45, 45, 5) +
          pointCircle(135, 45, 5) +
          pointCircle(135, 135, 5) +
          pointCircle(45, 135, 5),
        "Kare — 4 kenar",
        180,
        150
      );
    }
    if (kind === "yatay") {
      return wrap(
        lineSeg(25, 80, 155, 80) +
          arrowHead(155, 80, "right") +
          '<text class="q-geo-label" x="90" y="62" text-anchor="middle">Yatay</text>',
        "Yatay çizgi",
        180,
        100
      );
    }
    if (kind === "dikey") {
      return wrap(
        lineSeg(90, 25, 90, 145) +
          arrowHead(90, 25, "up") +
          '<text class="q-geo-label" x="112" y="88">Dikey</text>',
        "Dikey çizgi",
        180,
        160
      );
    }
    if (kind === "egik") {
      return wrap(
        lineSeg(30, 120, 150, 40) +
          '<text class="q-geo-label" x="90" y="28" text-anchor="middle">Eğik</text>',
        "Eğik çizgi",
        180,
        130
      );
    }
    if (kind === "harf_h") {
      return wrap(
        lineSeg(50, 30, 50, 120) +
          lineSeg(130, 30, 130, 120) +
          lineSeg(50, 75, 130, 75) +
          '<text class="q-geo-label" x="90" y="18" text-anchor="middle">H</text>',
        "H harfi",
        180,
        130
      );
    }
    if (kind === "harf_t") {
      return wrap(
        lineSeg(50, 40, 130, 40) +
          lineSeg(90, 40, 90, 120) +
          rightAngleMark(90, 40, 50, 40, 90, 120, 12) +
          '<text class="q-geo-label" x="90" y="28" text-anchor="middle">T</text>',
        "T harfi",
        180,
        130
      );
    }
    if (kind === "harf_v") {
      return wrap(
        lineSeg(50, 40, 90, 120) +
          lineSeg(90, 120, 130, 40) +
          '<text class="q-geo-label" x="90" y="28" text-anchor="middle">V</text>',
        "V harfi",
        180,
        130
      );
    }
    if (kind === "harf_o") {
      return wrap(
        '<ellipse class="q-geo-edge" cx="90" cy="75" rx="42" ry="38" fill="none"></ellipse>' +
          '<text class="q-geo-label" x="90" y="28" text-anchor="middle">O</text>',
        "O harfi",
        180,
        130
      );
    }
    if (kind === "harf_z") {
      return wrap(
        lineSeg(50, 45, 130, 45) +
          lineSeg(130, 45, 50, 115) +
          lineSeg(50, 115, 130, 115) +
          '<text class="q-geo-label" x="90" y="28" text-anchor="middle">Z</text>',
        "Z harfi",
        180,
        130
      );
    }
    if (kind === "harf_l") {
      return wrap(
        angleFigure(55, 115, 55, 40, 120, 115, { right: true, markSize: 16 }) +
          '<text class="q-geo-label" x="90" y="28" text-anchor="middle">L</text>',
        "L harfi — dik açı",
        180,
        130
      );
    }
    if (kind === "harf_i") {
      return wrap(
        lineSeg(90, 50, 90, 115) +
          pointOnTop(90, 38, 5, "i", 108, 42),
        "i harfi",
        180,
        130
      );
    }
    if (kind === "kalen") {
      return wrap(
        lineSeg(35, 100, 145, 100) +
          lineSeg(35, 100, 35, 40) +
          lineSeg(145, 100, 145, 40) +
          lineSeg(35, 40, 145, 40),
        "Kale direkleri",
        180,
        110
      );
    }
    if (kind === "dikdortgen") {
      return wrap(
        lineSeg(40, 50, 140, 50) +
          lineSeg(140, 50, 140, 110) +
          lineSeg(140, 110, 40, 110) +
          lineSeg(40, 110, 40, 50) +
          pointCircle(40, 50, 4) +
          pointCircle(140, 50, 4) +
          pointCircle(140, 110, 4) +
          pointCircle(40, 110, 4) +
          '<text class="q-geo-label" x="90" y="38" text-anchor="middle">4 köşe</text>',
        "Dikdörtgen",
        180,
        120
      );
    }
    if (kind === "kalem_esit") {
      return wrap(
        lineSeg(38, 95, 88, 95, "q-geo-hl-yatay") +
          lineSeg(118, 118, 118, 68, "q-geo-hl-dikey"),
        "İki kalem — aynı boy",
        185,
        140
      );
    }
    if (kind === "bilardo") {
      return wrap(
        lineSeg(32, 82, 148, 82) +
          pointCircle(32, 82, 6) +
          pointCircle(148, 82, 6),
        "Bilardo topu yolu",
        180,
        100
      );
    }
    return "";
  }

  global.__novaGeometryBasicSvg = geometryBasicSvg;
  global.__novaGeoBasicRe = GEO_BASIC_RE;

  if (global.NovaQuestionMarkup) {
    global.NovaQuestionMarkup.geometryBasicSvg = geometryBasicSvg;
  }
})(typeof window !== "undefined" ? window : globalThis);

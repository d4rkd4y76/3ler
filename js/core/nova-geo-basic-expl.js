/**
 * Geometri açıklama görselleri — etiketli _expl varyantları
 * Sorudaki şekilden farklı: parçaları oklarla gösterir, çocuğa neyin ne olduğunu anlatır.
 */
(function (global) {
  "use strict";

  var origSvg =
    typeof global.__novaGeometryBasicSvg === "function"
      ? global.__novaGeometryBasicSvg
      : null;

  function wrap(inner, label, w, h) {
    return (
      '<span class="q-geo q-geo--basic q-geo--expl">' +
      '<svg class="q-geo-svg q-geo-svg--basic q-geo-svg--expl" viewBox="0 0 ' +
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

  function dashLine(x1, y1, x2, y2) {
    return (
      '<line class="q-geo-edge q-geo-edge--dash" x1="' +
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

  function arrowHead(x, y, dir, size) {
    size = size || 9;
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
    return "";
  }

  function vecUnit(dx, dy) {
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) return { x: 0, y: 0 };
    return { x: dx / len, y: dy / len };
  }

  function angleArcWedge(vx, vy, x1, y1, x2, y2, r) {
    var u1 = vecUnit(x1 - vx, y1 - vy);
    var u2 = vecUnit(x2 - vx, y2 - vy);
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
      ' Z"></path><path class="q-geo-angle-arc" fill="none" d="' +
      arc +
      '"></path>'
    );
  }

  function rightAngleMark(vx, vy, x1, y1, x2, y2, sz) {
    sz = sz || 16;
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

  function renderExpl(base) {
    base = String(base || "").toLowerCase();
    var VX = 52;
    var VY = 118;

    if (base === "nokta") {
      return wrap(
        callout(90, 22, "← Tek bir yer", "middle") +
          pointCircle(90, 72, 9) +
          callout(90, 92, "A noktası", "middle") +
          callout(90, 108, "Boyutu yok / ölçülemez", "middle"),
        "Nokta açıklama",
        180,
        120
      );
    }

    if (base === "dogru") {
      return wrap(
        lineSeg(20, 82, 160, 82) +
          arrowHead(20, 82, "left") +
          arrowHead(160, 82, "right") +
          callout(32, 66, "← sonsuz", "middle") +
          callout(148, 66, "sonsuz →", "middle") +
          callout(90, 102, "Her iki uçta ok = doğru", "middle"),
        "Doğru açıklama",
        180,
        115
      );
    }

    if (base === "isin") {
      return wrap(
        lineSeg(38, 82, 158, 82) +
          arrowHead(158, 82, "right") +
          pointCircle(38, 82, 8) +
          callout(38, 58, "A — başlangıç", "middle") +
          callout(130, 58, "ok → gider (sonsuz)", "middle") +
          callout(90, 108, "Işın = nokta + tek yön", "middle"),
        "Işın açıklama",
        180,
        115
      );
    }

    if (base === "parca") {
      return wrap(
        lineSeg(38, 82, 142, 82) +
          callout(90, 58, "← cetvelle ölçülür →", "middle") +
          pointCircle(38, 82, 8) +
          pointCircle(142, 82, 8) +
          callout(38, 102, "A", "middle") +
          callout(142, 102, "B", "middle") +
          callout(90, 118, "İki uç kapalı = doğru parçası", "middle"),
        "Doğru parçası açıklama",
        180,
        125
      );
    }

    if (base === "aci_dik") {
      return wrap(
        lineSeg(VX, VY, VX, 40) +
          lineSeg(VX, VY, 136, VY) +
          rightAngleMark(VX, VY, VX, 40, 136, VY, 18) +
          angleArcWedge(VX, VY, VX, 40, 136, VY, 26) +
          callout(VX - 18, 78, "Kol 1", "end") +
          callout(98, VY + 18, "Kol 2", "middle") +
          callout(82, 98, "90° dik açı", "middle") +
          pointCircle(VX, VY, 8) +
          callout(VX + 14, VY - 10, "köşe", "start"),
        "Dik açı açıklama",
        180,
        145
      );
    }

    if (base === "aci_dar") {
      return wrap(
        lineSeg(VX, VY, VX, 42) +
          lineSeg(VX, VY, 118, 74) +
          angleArcWedge(VX, VY, VX, 42, 118, 74, 24) +
          callout(68, 92, "dar açı", "middle") +
          callout(VX - 16, 78, "yakın kollar", "end") +
          pointCircle(VX, VY, 8),
        "Dar açı açıklama",
        180,
        140
      );
    }

    if (base === "aci_genis") {
      return wrap(
        lineSeg(VX, VY, VX, 42) +
          lineSeg(VX, VY, 142, 140) +
          angleArcWedge(VX, VY, VX, 42, 142, 140, 28) +
          callout(78, 108, "geniş açı", "middle") +
          callout(118, 128, "uzak kollar", "middle") +
          pointCircle(VX, VY, 8),
        "Geniş açı açıklama",
        180,
        150
      );
    }

    if (base === "aci_dogru") {
      return wrap(
        lineSeg(18, 92, 162, 92) +
          callout(90, 72, "180° — dümdüz çizgi", "middle") +
          callout(90, 112, "doğru açı", "middle") +
          pointCircle(90, 92, 8) +
          callout(90, 108, "köşe", "middle"),
        "Doğru açı açıklama",
        180,
        120
      );
    }

    if (base === "aci_uzat") {
      var vx = 58;
      var vy = 120;
      return wrap(
        lineSeg(vx, vy, vx, 78) +
          lineSeg(vx, vy, 108, vy) +
          dashLine(vx, vy, vx, 28) +
          dashLine(vx, vy, 158, vy) +
          angleArcWedge(vx, vy, vx, 78, 108, vy, 24) +
          callout(72, 98, "AÇI AYNI!", "middle") +
          callout(vx - 20, 48, "Kol 1 uzatıldı", "end") +
          callout(138, 68, "Kol 2 uzatıldı", "middle") +
          callout(vx + 14, vy - 12, "köşe", "start") +
          pointCircle(vx, vy, 8) +
          callout(90, 138, "Kesikli = uzatma · Sarı bölge değişmez", "middle"),
        "Kollar uzatılınca açı aynı",
        185,
        155
      );
    }

    if (base === "kapi_acik") {
      var hx = 48;
      var hy = 118;
      return wrap(
        lineSeg(hx, hy, hx, 28, "q-geo-wall") +
          lineSeg(hx, hy, 128, hy, "q-geo-wall") +
          lineSeg(hx, hy, 116, 44, "q-geo-door") +
          angleArcWedge(hx, hy, hx, 28, 116, 44, 26) +
          callout(hx - 8, 52, "duvar", "end") +
          callout(116, 44, "kapı", "start") +
          callout(72, 98, "← bu boşluk = AÇI", "middle") +
          pointCircle(hx, hy, 8) +
          callout(hx + 12, hy - 10, "menteşe", "start"),
        "Kapı açısı açıklama",
        175,
        140
      );
    }

    if (base === "makas_acik") {
      var mx = 90;
      var my = 106;
      return wrap(
        lineSeg(mx, my, 44, 36) +
          lineSeg(mx, my, 136, 36) +
          angleArcWedge(mx, my, 44, 36, 136, 36, 22) +
          callout(90, 88, "açı", "middle") +
          callout(52, 28, "kol", "middle") +
          callout(128, 28, "kol", "middle") +
          pointCircle(mx, my, 8) +
          callout(mx, my + 22, "köşe (pivot)", "middle"),
        "Makas açıklama",
        180,
        125
      );
    }

    if (base === "makas_kapali") {
      return wrap(
        lineSeg(90, 106, 58, 38) +
          lineSeg(90, 106, 122, 38) +
          callout(90, 88, "kollar üst üste", "middle") +
          callout(90, 124, "açı YOK (0°)", "middle") +
          pointCircle(90, 106, 8),
        "Kapalı makas açıklama",
        180,
        135
      );
    }

    if (base === "ucgen_abc") {
      return wrap(
        lineSeg(38, 115, 142, 115) +
          lineSeg(142, 115, 90, 28) +
          lineSeg(90, 28, 38, 115) +
          callout(90, 108, "kenar", "middle") +
          callout(122, 68, "kenar", "middle") +
          callout(58, 68, "kenar", "middle") +
          callout(90, 18, "3 kenar = 3 doğru parçası", "middle") +
          pointCircle(38, 115, 6) +
          pointCircle(142, 115, 6) +
          pointCircle(90, 28, 6) +
          callout(28, 118, "A", "middle") +
          callout(152, 118, "B", "middle") +
          callout(98, 24, "C", "start"),
        "Üçgen açıklama",
        180,
        130
      );
    }

    if (base === "ucgen_kollar") {
      return wrap(
        lineSeg(90, 28, 38, 115) +
          lineSeg(90, 28, 142, 115) +
          lineSeg(38, 115, 142, 115) +
          callout(52, 68, "kol", "middle") +
          callout(128, 68, "kol", "middle") +
          callout(90, 108, "kol", "middle") +
          callout(90, 18, "3 açı × 2 kol = 6 ışın", "middle") +
          pointCircle(90, 28, 6) +
          pointCircle(38, 115, 6) +
          pointCircle(142, 115, 6),
        "Üçgende 6 kol",
        180,
        130
      );
    }

    if (base === "kare") {
      return wrap(
        lineSeg(48, 48, 132, 48) +
          lineSeg(132, 48, 132, 132) +
          lineSeg(132, 132, 48, 132) +
          lineSeg(48, 132, 48, 48) +
          callout(90, 38, "4 eşit kenar", "middle") +
          callout(148, 90, "kenar", "start") +
          callout(90, 148, "kenar", "middle") +
          pointCircle(48, 48, 5) +
          pointCircle(132, 48, 5) +
          pointCircle(132, 132, 5) +
          pointCircle(48, 132, 5),
        "Kare açıklama",
        180,
        155
      );
    }

    if (base === "dikdortgen") {
      return wrap(
        lineSeg(42, 52, 138, 52) +
          lineSeg(138, 52, 138, 108) +
          lineSeg(138, 108, 42, 108) +
          lineSeg(42, 108, 42, 52) +
          callout(42, 46, "1", "middle") +
          callout(138, 46, "2", "middle") +
          callout(138, 114, "3", "middle") +
          callout(42, 114, "4", "middle") +
          callout(90, 34, "4 köşe = 4 açı", "middle") +
          pointCircle(42, 52, 5) +
          pointCircle(138, 52, 5) +
          pointCircle(138, 108, 5) +
          pointCircle(42, 108, 5),
        "Dikdörtgen açıklama",
        180,
        125
      );
    }

    if (base === "yatay") {
      return wrap(
        lineSeg(22, 82, 158, 82) +
          arrowHead(158, 82, "right") +
          callout(90, 62, "↔ yatay — yere paralel", "middle") +
          callout(90, 102, "sağa-sola uzanır", "middle"),
        "Yatay açıklama",
        180,
        115
      );
    }

    if (base === "dikey") {
      return wrap(
        lineSeg(90, 28, 90, 148) +
          arrowHead(90, 28, "up") +
          callout(118, 88, "↕ dikey", "start") +
          callout(90, 108, "yukarı-aşağı", "middle"),
        "Dikey açıklama",
        180,
        155
      );
    }

    if (base === "egik") {
      return wrap(
        lineSeg(28, 122, 152, 42) +
          callout(90, 28, "eğik — ne yatay ne dikey", "middle") +
          callout(118, 72, "↗", "middle") +
          callout(90, 118, "çapraz gider", "middle"),
        "Eğik açıklama",
        180,
        130
      );
    }

    if (base === "harf_h") {
      return wrap(
        lineSeg(50, 32, 50, 118, "q-geo-hl-dikey") +
          lineSeg(130, 32, 130, 118, "q-geo-hl-dikey") +
          lineSeg(50, 76, 130, 76, "q-geo-hl-yatay") +
          callout(50, 22, "dikey ↕", "middle") +
          callout(130, 22, "dikey ↕", "middle") +
          callout(90, 68, "yatay ↔", "middle") +
          callout(90, 132, "H = 2 dikey + 1 yatay parça", "middle"),
        "H harfi açıklama",
        180,
        140
      );
    }

    if (base === "harf_v") {
      return wrap(
        lineSeg(52, 42, 90, 118, "q-geo-hl-egik") +
          lineSeg(90, 118, 128, 42, "q-geo-hl-egik") +
          callout(62, 68, "eğik", "middle") +
          callout(118, 68, "eğik", "middle") +
          callout(90, 132, "V = 2 eğik doğru parçası", "middle"),
        "V harfi açıklama",
        180,
        140
      );
    }

    if (base === "harf_t") {
      return wrap(
        lineSeg(50, 42, 130, 42) +
          lineSeg(90, 42, 90, 118) +
          rightAngleMark(90, 42, 50, 42, 90, 118, 12) +
          callout(90, 30, "yatay", "middle") +
          callout(108, 78, "dikey", "start") +
          callout(90, 132, "kesişimde dik açı", "middle") +
          pointCircle(90, 42, 6),
        "T harfi açıklama",
        180,
        140
      );
    }

    if (base === "harf_o") {
      return wrap(
        '<ellipse class="q-geo-edge" cx="90" cy="78" rx="40" ry="36" fill="none"></ellipse>' +
          callout(90, 28, "O — yuvarlak", "middle") +
          callout(90, 128, "köşe yok · açı yok · düz kenar yok", "middle"),
        "O harfi açıklama",
        180,
        140
      );
    }

    if (base === "harf_l") {
      return wrap(
        lineSeg(56, 42, 56, 116) +
          lineSeg(56, 116, 122, 116) +
          rightAngleMark(56, 116, 56, 42, 122, 116, 14) +
          callout(42, 78, "dikey", "end") +
          callout(88, 130, "yatay", "middle") +
          callout(100, 98, "dik açı", "start") +
          pointCircle(56, 116, 7),
        "L harfi açıklama",
        180,
        140
      );
    }

    if (base === "harf_i") {
      return wrap(
        lineSeg(90, 52, 90, 116) +
          pointCircle(90, 40, 6) +
          callout(108, 40, "← nokta", "start") +
          callout(108, 88, "gövde = parça", "start") +
          callout(90, 132, "i harfindeki nokta = geometri noktası", "middle"),
        "i harfi açıklama",
        180,
        140
      );
    }

    if (base === "kalem_esit") {
      return wrap(
        lineSeg(38, 95, 88, 95, "q-geo-hl-yatay") +
          lineSeg(118, 118, 118, 68, "q-geo-hl-dikey") +
          callout(63, 78, "aynı boy", "middle") +
          callout(138, 93, "aynı boy", "start") +
          callout(63, 112, "yatay kalem", "middle") +
          callout(148, 93, "dikey kalem", "start") +
          callout(90, 138, "Yön değişir, boy değişmez!", "middle"),
        "Kalemler eşit boy",
        185,
        150
      );
    }

    if (base === "bilardo") {
      return wrap(
        lineSeg(32, 82, 148, 82) +
          pointCircle(32, 82, 7) +
          pointCircle(148, 82, 7) +
          callout(32, 62, "başlangıç", "middle") +
          callout(148, 62, "bitiş (duvar)", "middle") +
          callout(90, 108, "Baş + son belli = doğru parçası", "middle"),
        "Bilardo yolu açıklama",
        180,
        120
      );
    }

    if (base === "ortak_duz") {
      return wrap(
        lineSeg(22, 52, 158, 52) +
          arrowHead(22, 52, "left") +
          arrowHead(158, 52, "right") +
          lineSeg(38, 82, 142, 82) +
          arrowHead(142, 82, "right") +
          pointCircle(38, 82, 6) +
          lineSeg(38, 112, 142, 112) +
          pointCircle(38, 112, 6) +
          pointCircle(142, 112, 6) +
          callout(90, 38, "doğru — düz", "middle") +
          callout(90, 68, "ışın — düz", "middle") +
          callout(90, 98, "doğru parçası — düz", "middle") +
          callout(90, 132, "Hepsi dümdüz çizgidir!", "middle"),
        "Ortak özellik düz çizgi",
        180,
        145
      );
    }

    if (base === "dogru_to_isin") {
      return wrap(
        lineSeg(38, 82, 152, 82) +
          arrowHead(152, 82, "right") +
          pointCircle(38, 82, 8) +
          callout(38, 58, "nokta koyduk", "middle") +
          callout(118, 58, "tek ok kaldı", "middle") +
          callout(90, 108, "→ IŞIN oldu", "middle"),
        "Doğru → ışın açıklama",
        180,
        115
      );
    }

    if (base === "parca_to_dogru") {
      return wrap(
        lineSeg(22, 82, 158, 82) +
          arrowHead(22, 82, "left") +
          arrowHead(158, 82, "right") +
          callout(90, 58, "iki uca ok ekledik", "middle") +
          callout(90, 108, "→ DOĞRU oldu", "middle"),
        "Parça → doğru açıklama",
        180,
        115
      );
    }

    if (base === "isin_to_parca") {
      return wrap(
        lineSeg(38, 82, 142, 82) +
          pointCircle(38, 82, 8) +
          pointCircle(142, 82, 8) +
          callout(90, 58, "sağ ok silindi, B noktası", "middle") +
          callout(90, 108, "→ DOĞRU PARÇASI oldu", "middle"),
        "Işın → parça açıklama",
        180,
        115
      );
    }

    if (base === "ogrenci_dogru_aci") {
      return wrap(
        lineSeg(28, 92, 152, 92) +
          callout(90, 72, "kollar zıt yön", "middle") +
          callout(90, 112, "180° doğru açı", "middle") +
          pointCircle(90, 92, 8),
        "T pozu doğru açı",
        180,
        120
      );
    }

    if (base === "ogrenci_dik") {
      return wrap(
        lineSeg(90, 118, 90, 38) +
          lineSeg(90, 118, 148, 118) +
          rightAngleMark(90, 118, 90, 38, 148, 118, 16) +
          callout(72, 78, "dikey kol", "end") +
          callout(118, 132, "yatay kol", "middle") +
          callout(118, 98, "dik açı", "start") +
          pointCircle(90, 118, 8),
        "L pozu dik açı",
        180,
        140
      );
    }

    if (base === "kareli") {
      var g = "";
      for (var i = 0; i <= 4; i++) {
        g += lineSeg(20 + i * 32, 20, 20 + i * 32, 148, "q-geo-grid");
        g += lineSeg(20, 20 + i * 32, 148, 20 + i * 32, "q-geo-grid");
      }
      g += pointCircle(52, 52, 6);
      g += pointCircle(116, 116, 6);
      g += callout(52, 38, "nokta", "middle");
      g += callout(116, 102, "nokta", "middle");
      g += callout(90, 168, "Kesişimler = nokta", "middle");
      return wrap(g, "Kareli zemin açıklama", 170, 175);
    }

    return null;
  }

  global.__novaGeometryBasicExplSvg = renderExpl;

  global.__novaGeometryBasicSvg = function (kind) {
    kind = String(kind || "").toLowerCase();
    if (kind.slice(-5) === "_expl") {
      var expl = renderExpl(kind.slice(0, -5));
      if (expl) return expl;
    }
    return origSvg ? origSvg(kind) : "";
  };

  if (global.NovaQuestionMarkup) {
    global.NovaQuestionMarkup.geometryBasicSvg = global.__novaGeometryBasicSvg;
  }
})(typeof window !== "undefined" ? window : globalThis);

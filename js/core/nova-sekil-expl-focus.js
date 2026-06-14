/**
 * Soruya özel geometrik şekil/cisim açıklama görselleri.
 * focus: kose | kenar | ayrit | yuz | kosegen | esit | karsilastir | temel
 */
(function (global) {
  "use strict";

  function wrap(inner, label, w, h, cls) {
    var pad = 20;
    return (
      '<span class="q-geo q-geo--sekil q-geo--expl q-geo--focus ' +
      (cls || "") +
      '">' +
      '<svg class="q-geo-svg q-geo-svg--sekil q-geo-svg--expl" viewBox="' +
      -pad +
      " " +
      -pad +
      " " +
      (w + pad * 2) +
      " " +
      (h + pad * 2) +
      '" overflow="visible" role="img" aria-label="' +
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

  function point(x, y) {
    return (
      '<circle class="q-geo-point q-geo-point--top" cx="' +
      x +
      '" cy="' +
      y +
      '" r="6"></circle>'
    );
  }

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

  function caption(x, y, text) {
    return (
      '<text class="q-geo-caption" x="' +
      x +
      '" y="' +
      y +
      '" text-anchor="middle">' +
      text +
      "</text>"
    );
  }

  function edgeMidLabel(x1, y1, x2, y2, n, dist) {
    dist = dist || 0;
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2;
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    return edgeNum(mx + (-dy / len) * dist, my + (dx / len) * dist, n);
  }

  function parseFocus(kind) {
    kind = String(kind || "temel").toLowerCase();
    if (kind.indexOf("|") >= 0) {
      var p = kind.split("|");
      return (p[1] || "temel").trim();
    }
    return kind || "temel";
  }

  /* ── 2D şekiller ── */

  function sekilUcgen(focus) {
    var ax = 90,
      ay = 32,
      bx = 158,
      by = 138,
      cx = 22,
      cy = 138;
    var g =
      poly(ax + "," + ay + " " + bx + "," + by + " " + cx + "," + cy, "q-geo-fill") +
      line(ax, ay, bx, by) +
      line(bx, by, cx, cy) +
      line(cx, cy, ax, ay);
    if (focus === "kose") {
      g +=
        point(ax, ay) +
        point(bx, by) +
        point(cx, cy) +
        vtxLabel(ax, ay - 6, "1") +
        vtxLabel(bx + 10, by + 4, "2", "start") +
        vtxLabel(cx - 10, by + 4, "3", "end") +
        caption(90, 152, "3 köşe — numaraları say");
    } else if (focus === "kenar") {
      g +=
        edgeMidLabel(ax, ay, bx, by, "1", -14) +
        edgeMidLabel(bx, by, cx, cy, "2", 14) +
        edgeMidLabel(cx, cy, ax, ay, "3", -14) +
        caption(90, 152, "3 kenar — numaraları say");
    } else {
      g += caption(90, 152, "üçgen");
    }
    return wrap(g, "Üçgen", 180, 160);
  }

  function sekilKare(focus) {
    var kx = 42,
      ky = 42,
      ks = 96;
    var g =
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
      line(kx, ky + ks, kx, ky);
    if (focus === "kose") {
      g +=
        point(kx, ky) +
        point(kx + ks, ky) +
        point(kx + ks, ky + ks) +
        point(kx, ky + ks) +
        vtxLabel(kx - 4, ky - 4, "1", "end") +
        vtxLabel(kx + ks + 4, ky - 4, "2", "start") +
        vtxLabel(kx + ks + 4, ky + ks + 8, "3", "start") +
        vtxLabel(kx - 4, ky + ks + 8, "4", "end") +
        caption(90, 152, "4 köşe");
    } else if (focus === "kenar") {
      g +=
        edgeMidLabel(kx, ky, kx + ks, ky, "1", -12) +
        edgeMidLabel(kx + ks, ky, kx + ks, ky + ks, "2", 12) +
        edgeMidLabel(kx + ks, ky + ks, kx, ky + ks, "3", 12) +
        edgeMidLabel(kx, ky + ks, kx, ky, "4", -12) +
        caption(90, 152, "4 kenar");
    } else if (focus === "kosegen") {
      g +=
        line(kx, ky, kx + ks, ky + ks, "q-geo-edge q-geo-edge--dash") +
        line(kx + ks, ky, kx, ky + ks, "q-geo-edge q-geo-edge--dash") +
        callout(90, 92, "köşegen") +
        caption(90, 152, "2 köşegen çizilebilir");
    } else if (focus === "esit") {
      g +=
        callout(90, 32, "eşit") +
        callout(156, 90, "eşit", "start") +
        callout(90, 152, "eşit") +
        callout(24, 90, "eşit", "end") +
        caption(90, 168, "tüm kenarlar eşit");
    } else {
      g += caption(90, 152, "kare");
    }
    return wrap(g, "Kare", 180, 168);
  }

  function sekilDikdortgen(focus) {
    var dx = 28,
      dy = 52,
      dw = 124,
      dh = 72;
    var g =
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
      line(dx, dy + dh, dx, dy);
    if (focus === "kose") {
      g +=
        point(dx, dy) +
        point(dx + dw, dy) +
        point(dx + dw, dy + dh) +
        point(dx, dy + dh) +
        vtxLabel(dx - 6, dy - 4, "1", "end") +
        vtxLabel(dx + dw + 6, dy - 4, "2", "start") +
        vtxLabel(dx + dw + 6, dy + dh + 10, "3", "start") +
        vtxLabel(dx - 6, dy + dh + 10, "4", "end") +
        caption(90, 140, "4 köşe");
    } else if (focus === "kenar") {
      g +=
        edgeMidLabel(dx, dy, dx + dw, dy, "1", -12) +
        edgeMidLabel(dx + dw, dy, dx + dw, dy + dh, "2", 12) +
        edgeMidLabel(dx + dw, dy + dh, dx, dy + dh, "3", 12) +
        edgeMidLabel(dx, dy + dh, dx, dy, "4", -12) +
        caption(90, 140, "4 kenar");
    } else if (focus === "esit") {
      g +=
        callout(90, 42, "a = a") +
        callout(90, 138, "a = a") +
        callout(168, 88, "b = b", "start") +
        callout(12, 88, "b = b", "end") +
        caption(90, 152, "karşılıklı kenarlar eşit");
    } else {
      g += caption(90, 140, "dikdörtgen");
    }
    return wrap(g, "Dikdörtgen", 180, 160);
  }

  function sekilDaire(focus) {
    var g =
      circle(90, 78, 56, "q-geo-fill") +
      '<circle class="q-geo-edge" cx="90" cy="78" r="56" fill="none"></circle>';
    if (focus === "kose" || focus === "kenar") {
      g += callout(90, 78, "yok") + caption(90, 148, "köşe ve kenar yok");
    } else {
      g += callout(90, 78, "iç dolu") + caption(90, 148, "daire");
    }
    return wrap(g, "Daire", 180, 160);
  }

  function sekilCember(focus) {
    var g =
      '<circle class="q-geo-edge q-geo-edge--thick" cx="90" cy="78" r="56" fill="none"></circle>';
    if (focus === "kose" || focus === "kenar") {
      g += callout(90, 78, "yok") + caption(90, 148, "köşe ve kenar yok");
    } else {
      g += callout(90, 78, "iç boş") + caption(90, 148, "çember");
    }
    return wrap(g, "Çember", 180, 160);
  }

  function sekilCemberVsDaire() {
    return wrap(
      '<circle class="q-geo-edge q-geo-edge--thick" cx="52" cy="78" r="42" fill="none"></circle>' +
        circle(138, 78, 42, "q-geo-fill") +
        '<circle class="q-geo-edge" cx="138" cy="78" r="42" fill="none"></circle>' +
        callout(52, 130, "içi boş") +
        callout(138, 130, "içi dolu") +
        caption(95, 148, "çember · daire"),
      "Çember ve daire",
      190,
      160
    );
  }

  function sekilCokgen(pts, n, name) {
    return function (focus) {
      var ptsArr = pts.split(" ");
      var g = poly(pts, "q-geo-fill");
      for (var i = 0; i < ptsArr.length; i++) {
        var a = ptsArr[i].split(",");
        var b = ptsArr[(i + 1) % ptsArr.length].split(",");
        g += line(+a[0], +a[1], +b[0], +b[1]);
      }
      if (focus === "kose") {
        for (var j = 0; j < ptsArr.length; j++) {
          var p = ptsArr[j].split(",");
          g += point(+p[0], +p[1]);
          g += vtxLabel(+p[0], +p[1] - 10, String(j + 1));
        }
        g += caption(90, 158, n + " köşe");
      } else if (focus === "kenar") {
        for (var k = 0; k < ptsArr.length; k++) {
          var c = ptsArr[k].split(",");
          var d = ptsArr[(k + 1) % ptsArr.length].split(",");
          g += edgeMidLabel(+c[0], +c[1], +d[0], +d[1], String(k + 1), 14);
        }
        g += caption(90, 158, n + " kenar");
      } else {
        g += caption(90, 158, name);
      }
      return wrap(g, name, 180, 168);
    };
  }

  /* ── 3D cisimler ── */

  function cisimUcgenPrizma(focus) {
    var t1 = [100, 30],
      t2 = [168, 58],
      t3 = [32, 58],
      b1 = [100, 112],
      b2 = [168, 148],
      b3 = [32, 148];
    var body =
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
      line(t3[0], t3[1], b3[0], b3[1]);
    var g = body;
    if (focus === "kose") {
      g +=
        point(t1[0], t1[1]) +
        point(t2[0], t2[1]) +
        point(t3[0], t3[1]) +
        point(b1[0], b1[1]) +
        point(b2[0], b2[1]) +
        point(b3[0], b3[1]) +
        vtxLabel(t1[0], t1[1] - 8, "1") +
        vtxLabel(t2[0] + 8, t2[1] - 2, "2", "start") +
        vtxLabel(t3[0] - 8, t3[1] - 2, "3", "end") +
        vtxLabel(b1[0], b1[1] + 12, "4") +
        vtxLabel(b2[0] + 8, b2[1] + 4, "5", "start") +
        vtxLabel(b3[0] - 8, b3[1] + 4, "6", "end") +
        caption(100, 162, "6 köşe — 1'den 6'ya say");
    } else if (focus === "ayrit") {
      g +=
        edgeMidLabel(t1[0], t1[1], t2[0], t2[1], "1", -12) +
        edgeMidLabel(t2[0], t2[1], t3[0], t3[1], "2", 14) +
        edgeMidLabel(t3[0], t3[1], t1[0], t1[1], "3", -12) +
        edgeMidLabel(b1[0], b1[1], b2[0], b2[1], "4", 14) +
        edgeMidLabel(b2[0], b2[1], b3[0], b3[1], "5", 14) +
        edgeMidLabel(b3[0], b3[1], b1[0], b1[1], "6", 14) +
        edgeMidLabel(t1[0], t1[1], b1[0], b1[1], "7", -14) +
        edgeMidLabel(t2[0], t2[1], b2[0], b2[1], "8", 14) +
        edgeMidLabel(t3[0], t3[1], b3[0], b3[1], "9", -14) +
        caption(100, 162, "9 ayrıt — 1'den 9'a say");
    } else if (focus === "yuz") {
      g +=
        callout(100, 44, "▲ üçgen") +
        callout(100, 132, "▲ üçgen") +
        callout(175, 100, "▭ yan", "start") +
        caption(100, 162, "2 üçgen + 3 dikdörtgen = 5 yüz");
    } else {
      g += caption(100, 162, "üçgen prizma");
    }
    return wrapSolid(g, "Üçgen prizma", 210, 175);
  }

  function cisimKup(focus) {
    var body =
      poly("55,35 115,15 175,35 115,55", "q-geo-solid-top") +
      poly("55,35 55,115 115,135 115,55", "q-geo-solid-left") +
      poly("115,55 175,35 175,115 115,135", "q-geo-solid-right") +
      line(55, 35, 115, 15) +
      line(115, 15, 175, 35) +
      line(175, 35, 175, 115) +
      line(175, 115, 115, 135) +
      line(115, 135, 55, 115) +
      line(55, 115, 55, 35) +
      line(115, 15, 115, 55) +
      line(115, 55, 115, 135);
    var g = body;
    if (focus === "kose") {
      g +=
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
        vtxLabel(186, 122, "5", "start") +
        vtxLabel(115, 148, "6") +
        caption(115, 158, "8 köşe — numaraları say");
    } else if (focus === "ayrit") {
      g +=
        edgeMidLabel(115, 15, 175, 35, "1", -12) +
        edgeMidLabel(175, 35, 175, 115, "2", 12) +
        edgeMidLabel(175, 115, 115, 135, "3", 12) +
        edgeMidLabel(55, 115, 55, 35, "4", -14) +
        edgeMidLabel(115, 15, 115, 55, "5", -14) +
        edgeMidLabel(115, 55, 115, 135, "6", 14) +
        caption(115, 158, "12 ayrıt — üst 4 + alt 4 + yan 4");
    } else if (focus === "yuz") {
      g +=
        callout(115, 28, "kare") +
        callout(28, 72, "kare", "end") +
        callout(188, 72, "kare", "start") +
        caption(115, 158, "6 kare yüz");
    } else {
      g += caption(115, 158, "küp");
    }
    return wrapSolid(g, "Küp", 220, 168);
  }

  function cisimKoni(focus) {
    var g =
      '<ellipse class="q-geo-solid-base" cx="95" cy="118" rx="62" ry="16"></ellipse>' +
      poly("95,22 157,118 33,118", "q-geo-solid-cone") +
      line(33, 118, 157, 118, "q-geo-edge");
    if (focus === "kose") {
      g += point(95, 22) + callout(95, 12, "tepe") + caption(95, 148, "köşe yok · 1 tepe noktası");
    } else if (focus === "yuz") {
      g +=
        callout(95, 132, "daire taban") +
        callout(95, 72, "eğri yan") +
        caption(95, 148, "2 yüz");
    } else {
      g += caption(95, 148, "koni");
    }
    return wrapSolid(g, "Koni", 200, 160);
  }

  function cisimSilindir(focus) {
    var g =
      '<ellipse class="q-geo-solid-top" cx="95" cy="38" rx="58" ry="16"></ellipse>' +
      '<rect class="q-geo-solid-body" x="37" y="38" width="116" height="88"></rect>' +
      line(37, 38, 37, 126, "q-geo-edge") +
      line(153, 38, 153, 126, "q-geo-edge") +
      '<ellipse class="q-geo-solid-base" cx="95" cy="126" rx="58" ry="16"></ellipse>';
    if (focus === "kose" || focus === "ayrit") {
      g += callout(95, 82, "yok") + caption(95, 148, "köşe ve ayrıt yok");
    } else if (focus === "yuz") {
      g +=
        callout(95, 38, "daire") +
        callout(95, 126, "daire") +
        callout(95, 82, "eğri yan") +
        caption(95, 148, "3 yüz");
    } else {
      g += caption(95, 148, "silindir");
    }
    return wrapSolid(g, "Silindir", 200, 160);
  }

  function cisimKure(focus) {
    var g =
      circle(95, 78, 52, "q-geo-solid-body") +
      '<ellipse class="q-geo-solid-ring" cx="95" cy="78" rx="52" ry="14"></ellipse>';
    if (focus === "kose" || focus === "ayrit") {
      g += callout(95, 78, "yok") + caption(95, 142, "köşe ve ayrıt yok");
    } else if (focus === "yuz") {
      g += callout(95, 78, "eğri yüz") + caption(95, 142, "1 yüz");
    } else {
      g += caption(95, 142, "küre");
    }
    return wrapSolid(g, "Küre", 190, 155);
  }

  function cisimPrizmaGeneric(name, captionYuz, captionText) {
    return function (focus, drawBody) {
      var g = drawBody();
      if (focus === "kose") {
        g += caption(115, 158, "8 köşe");
      } else if (focus === "ayrit") {
        g += caption(115, 158, "12 ayrıt");
      } else if (focus === "yuz") {
        g += caption(115, 158, captionYuz);
      } else {
        g += caption(115, 158, captionText);
      }
      return wrapSolid(g, name, 220, 168);
    };
  }

  function cisimKarePrizma(focus) {
    var body =
      poly("45,38 125,18 185,42 105,62", "q-geo-solid-top") +
      poly("45,38 45,108 105,128 105,62", "q-geo-solid-left") +
      poly("105,62 185,42 185,112 105,128", "q-geo-solid-right") +
      line(45, 38, 125, 18) +
      line(125, 18, 185, 42) +
      line(45, 38, 45, 108) +
      line(185, 42, 185, 112);
    var g = body;
    if (focus === "yuz") {
      g += callout(125, 28, "kare taban") + callout(198, 78, "dikdörtgen yan", "start");
    }
    return cisimPrizmaGeneric("Kare prizma", "6 yüz", "kare prizma")(focus, function () {
      return g;
    });
  }

  function cisimDikdortgenPrizma(focus) {
    var body =
      poly("30,42 140,22 200,48 90,68", "q-geo-solid-top") +
      poly("30,42 30,118 90,138 90,68", "q-geo-solid-left") +
      poly("90,68 200,48 200,124 90,138", "q-geo-solid-right") +
      line(30, 42, 140, 22) +
      line(140, 22, 200, 48) +
      line(30, 42, 30, 118) +
      line(200, 48, 200, 124);
    var g = body;
    if (focus === "yuz") {
      g += callout(115, 12, "dikdörtgen yüz");
    }
    return cisimPrizmaGeneric("Dikdörtgenler prizması", "6 yüz", "dikdörtgenler prizması")(focus, function () {
      return g;
    });
  }

  function cisimPiramit(focus) {
    var g =
      poly("95,18 158,108 32,108", "q-geo-solid-cone") +
      line(32, 108, 158, 108) +
      line(32, 108, 95, 18) +
      line(158, 108, 95, 18);
    if (focus === "kose") {
      g +=
        point(95, 18) +
        point(32, 108) +
        point(158, 108) +
        vtxLabel(95, 8, "1") +
        callout(95, 124, "4 taban köşesi") +
        caption(95, 148, "5 köşe");
    } else if (focus === "ayrit") {
      g += caption(95, 148, "8 ayrıt");
    } else if (focus === "yuz") {
      g += callout(95, 124, "kare taban") + callout(168, 72, "üçgen yan", "start") + caption(95, 148, "5 yüz");
    } else {
      g += caption(95, 148, "piramit");
    }
    return wrapSolid(g, "Piramit", 200, 160);
  }

  var SEKIL = {
    ucgen: sekilUcgen,
    kare: sekilKare,
    dikdortgen: sekilDikdortgen,
    daire: sekilDaire,
    cember: sekilCember,
    cember_vs_daire: function () {
      return sekilCemberVsDaire();
    },
    besgen: sekilCokgen("90,24 158,58 140,132 40,132 22,58", 5, "beşgen"),
    altigen: sekilCokgen("90,22 150,52 150,108 90,138 30,108 30,52", 6, "altıgen"),
    sekizgen: sekilCokgen("90,22 131,39 148,80 131,121 90,138 49,121 32,80 49,39", 8, "sekizgen"),
  };

  var CISIM = {
    kup: cisimKup,
    kare_prizma: cisimKarePrizma,
    dikdortgen_prizma: cisimDikdortgenPrizma,
    ucgen_prizma: cisimUcgenPrizma,
    silindir: cisimSilindir,
    koni: cisimKoni,
    kure: cisimKure,
    piramit: cisimPiramit,
  };

  function renderSekilFocus(base, focus) {
    focus = parseFocus(focus);
    if (base === "cember_vs_daire") return SEKIL.cember_vs_daire();
    var fn = SEKIL[base];
    return fn ? fn(focus) : null;
  }

  function renderCisimFocus(base, focus) {
    focus = parseFocus(focus);
    var fn = CISIM[base];
    return fn ? fn(focus) : null;
  }

  global.__novaRenderSekilFocus = renderSekilFocus;
  global.__novaRenderCisimFocus = renderCisimFocus;
  global.__novaParseExplFocus = parseFocus;
})(typeof window !== "undefined" ? window : globalThis);

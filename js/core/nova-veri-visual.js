/**
 * Veri toplama görselleri — sıklık tablosu, çetele, şekil grafiği
 * [[veri:siklik|Başlık|🍎 Elma:15|🍌 Muz:22]]
 * [[veri:cetele|Başlık|🍎 Elma:4g|🍌 Muz:2g+3]]
 * [[veri:grafik|Başlık|not:Her şekil 2 meyveyi gösterir|🍌 Muz:4|🐱 Kedi:5]]
 * [[veri:cetele_sayi:7]]  — 7 sayısının çetelesi
 * [[veri:cetele_grup]]    — 1 tam grup (5 çizgi) örneği
 */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Tek dikey çizgi */
  function tallyLine(extraClass) {
    return (
      '<span class="q-veri-tally-line' +
      (extraClass ? " " + extraClass : "") +
      '" aria-hidden="true"></span>'
    );
  }

  /** 1 tam grup: 4 dikey + 1 çapraz */
  function tallyGroupHtml() {
    return (
      '<span class="q-veri-tally-group" title="1 tam grup = 5">' +
      tallyLine() +
      tallyLine() +
      tallyLine() +
      tallyLine() +
      '<span class="q-veri-tally-slash" aria-hidden="true"></span>' +
      "</span>"
    );
  }

  /** n adet çetele çizgisi (gruplu) — showCount: öğrenci sayacak */
  function tallyCountHtml(total, showCount) {
    var n = Math.max(0, parseInt(total, 10) || 0);
    if (!n) {
      return '<span class="q-veri-tally-empty">—</span>';
    }
    var groups = Math.floor(n / 5);
    var singles = n % 5;
    var html = '<span class="q-veri-tally">';
    var g;
    for (g = 0; g < groups; g++) {
      html += tallyGroupHtml();
    }
    for (g = 0; g < singles; g++) {
      html += tallyLine(" q-veri-tally-line--single");
    }
    if (showCount) {
      html += '<span class="q-veri-tally-count">' + n + "</span>";
    }
    html += "</span>";
    return html;
  }

  /** "4g", "2g+3" → çetele HTML (soru: sayı gösterme) */
  function tallySpecHtml(spec, showCount) {
    if (showCount === undefined) showCount = false;
    var s = String(spec || "").trim().toLowerCase();
    if (!s) return tallyCountHtml(0);
    var m = s.match(/^(\d+)\s*g(?:\+(\d+))?$/);
    if (m) {
      var groups = parseInt(m[1], 10) || 0;
      var singles = parseInt(m[2], 10) || 0;
      return tallyCountHtml(groups * 5 + singles, showCount);
    }
    var n = parseInt(s, 10);
    if (!isNaN(n)) return tallyCountHtml(n, showCount);
    return esc(spec);
  }

  function parsePairs(parts, startIdx) {
    var rows = [];
    var i;
    for (i = startIdx; i < parts.length; i++) {
      var p = String(parts[i] || "").trim();
      if (!p) continue;
      if (/^not\s*:/i.test(p)) continue;
      var idx = p.lastIndexOf(":");
      if (idx <= 0) continue;
      rows.push({
        label: p.slice(0, idx).trim(),
        value: p.slice(idx + 1).trim(),
      });
    }
    return rows;
  }

  function findNote(parts) {
    var i;
    for (i = 0; i < parts.length; i++) {
      var p = String(parts[i] || "").trim();
      var m = p.match(/^not\s*:\s*(.+)$/i);
      if (m) return m[1].trim();
    }
    return "";
  }

  function tableWrap(title, typeLabel, bodyHtml, footnote) {
    var foot =
      footnote ?
        '<div class="q-veri-foot">📝 <strong>Not:</strong> ' + esc(footnote) + "</div>"
      : "";
    return (
      '<div class="q-veri q-veri--' +
      esc(typeLabel) +
      '">' +
      (title ?
        '<div class="q-veri-title">' + esc(title) + "</div>"
      : "") +
      bodyHtml +
      foot +
      "</div>"
    );
  }

  function siklikTableHtml(parts) {
    var title = String(parts[0] || "Sıklık Tablosu").trim();
    var note = findNote(parts);
    var rows = parsePairs(parts, note ? 0 : 1);
    if (!rows.length && parts.length > 1 && !note) {
      rows = parsePairs(parts, 1);
    }
    if (!rows.length) {
      rows = parsePairs(parts, 0);
    }
    var maxVal = 0;
    rows.forEach(function (r) {
      var n = parseInt(r.value, 10);
      if (!isNaN(n) && n > maxVal) maxVal = n;
    });
    var html =
      '<table class="q-veri-table q-veri-table--siklik"><thead><tr>' +
      "<th>Seçenek</th><th>Sayı</th><th>Görsel</th>" +
      "</tr></thead><tbody>";
    rows.forEach(function (r) {
      var n = parseInt(r.value, 10) || 0;
      var pct = maxVal > 0 ? Math.round((n / maxVal) * 100) : 0;
      html +=
        "<tr>" +
        '<td class="q-veri-label">' +
        esc(r.label) +
        "</td>" +
        '<td class="q-veri-num"><strong>' +
        esc(r.value) +
        "</strong></td>" +
        '<td class="q-veri-bar-cell"><div class="q-veri-bar" style="width:' +
        pct +
        '%" title="' +
        esc(r.value) +
        '"></div></td>' +
        "</tr>";
    });
    html += "</tbody></table>";
    return tableWrap(title, "siklik", html, note);
  }

  function ceteleTableHtml(parts) {
    var title = String(parts[0] || "Çetele Tablosu").trim();
    var rows = parsePairs(parts, 1);
    if (!rows.length) rows = parsePairs(parts, 0);
    var html =
      '<table class="q-veri-table q-veri-table--cetele"><thead><tr>' +
      "<th>Seçenek</th><th>Çetele</th>" +
      "</tr></thead><tbody>";
    rows.forEach(function (r) {
      html +=
        "<tr>" +
        '<td class="q-veri-label">' +
        esc(r.label) +
        "</td>" +
        '<td class="q-veri-tally-cell">' +
        tallySpecHtml(r.value, false) +
        "</td>" +
        "</tr>";
    });
    html += "</tbody></table>";
    return tableWrap(title, "cetele", html, "Her tam grup = 5 çizgi (4 dikey + 1 eğik)");
  }

  function pictogramHtml(parts) {
    var title = String(parts[0] || "Şekil Grafiği").trim();
    var note = findNote(parts);
    var rows = [];
    var i;
    for (i = 1; i < parts.length; i++) {
      var p = String(parts[i] || "").trim();
      if (!p || /^not\s*:/i.test(p)) continue;
      var idx = p.lastIndexOf(":");
      if (idx <= 0) continue;
      rows.push({
        label: p.slice(0, idx).trim(),
        count: parseInt(p.slice(idx + 1).trim(), 10) || 0,
      });
    }
    if (!rows.length) {
      for (i = 0; i < parts.length; i++) {
        p = String(parts[i] || "").trim();
        if (/^not\s*:/i.test(p)) continue;
        idx = p.lastIndexOf(":");
        if (idx > 0 && !/^not/i.test(p)) {
          rows.push({
            label: p.slice(0, idx).trim(),
            count: parseInt(p.slice(idx + 1).trim(), 10) || 0,
          });
        }
      }
    }
    var html = '<div class="q-veri-picto-wrap">';
    rows.forEach(function (r) {
      var symbols = "";
      var c;
      var sym = r.label.split(" ")[0];
      if (sym.length > 2) sym = "⬤";
      for (c = 0; c < r.count; c++) {
        symbols += '<span class="q-veri-picto-sym">' + esc(sym) + "</span>";
      }
      html +=
        '<div class="q-veri-picto-row">' +
        '<span class="q-veri-picto-label">' +
        esc(r.label) +
        "</span>" +
        '<span class="q-veri-picto-symbols">' +
        (symbols || '<span class="q-veri-tally-empty">—</span>') +
        "</span>" +
        "</div>";
    });
    html += "</div>";
    return tableWrap(title, "grafik", html, note);
  }

  function ceteleSayiHtml(n) {
    return (
      '<div class="q-veri q-veri--cetele-demo">' +
      '<div class="q-veri-title">🔢 ' +
      esc(String(n)) +
      " sayısının çetele gösterimi</div>" +
      '<div class="q-veri-tally-demo">' +
      tallyCountHtml(n, false) +
      "</div>" +
      '<div class="q-veri-hint">4 dikey çizgi + 1 eğik çizgi = <strong>1 tam grup (5)</strong></div>' +
      "</div>"
    );
  }

  function ceteleGrupHtml() {
    return (
      '<div class="q-veri q-veri--cetele-demo">' +
      '<div class="q-veri-title">✏️ 1 tam çetele grubu</div>' +
      '<div class="q-veri-tally-demo q-veri-tally-demo--large">' +
      tallyGroupHtml() +
      '<span class="q-veri-tally-count">= 5</span></div>' +
      '<div class="q-veri-hint">Beşerli gruplar saymayı kolaylaştırır.</div>' +
      "</div>"
    );
  }

  function notBlockHtml(text) {
    return (
      '<div class="q-veri q-veri--not">' +
      '<div class="q-veri-not">📝 <strong>Not:</strong> ' +
      esc(text) +
      "</div></div>"
    );
  }

  /**
   * @param {string} kind
   * @param {string} spec pipe-separated payload
   */
  function veriMarkupHtml(kind, spec) {
    kind = String(kind || "").toLowerCase();
    var parts = String(spec || "")
      .split("|")
      .map(function (p) {
        return p.trim();
      });

    if (kind === "siklik" || kind === "frekans" || kind === "tablo_siklik") {
      return siklikTableHtml(parts);
    }
    if (kind === "cetele" || kind === "tablo_cetele") {
      return ceteleTableHtml(parts);
    }
    if (kind === "grafik" || kind === "sekil" || kind === "picto") {
      return pictogramHtml(parts);
    }
    if (kind === "cetele_sayi" || kind === "sayi") {
      return ceteleSayiHtml(parts[0] || spec);
    }
    if (kind === "cetele_grup" || kind === "grup") {
      return ceteleGrupHtml();
    }
    if (kind === "not") {
      return notBlockHtml(parts.join("|") || spec);
    }
    return "";
  }

  global.NovaVeriVisual = {
    veriMarkupHtml: veriMarkupHtml,
    tallyCountHtml: tallyCountHtml,
    tallySpecHtml: tallySpecHtml,
  };
})(typeof window !== "undefined" ? window : globalThis);

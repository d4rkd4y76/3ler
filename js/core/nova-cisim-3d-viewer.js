/**
 * Açıklama panelinde geometrik cisimler — araçtaki 3B model (sürükleyerek döndür).
 * [[cisim:kup_expl|ayrit]] → tools/geometri/embed.html iframe
 */
(function (global) {
  "use strict";

  var SHAPE_MAP = {
    kup: "cube",
    kare_prizma: "squarePrism",
    dikdortgen_prizma: "rectangularPrism",
    ucgen_prizma: "triangularPrism",
    piramit: "squarePyramid",
    silindir: "cylinder",
    koni: "cone",
    kure: "sphere",
  };

  var SHAPE_LABEL = {
    kup: "Küp",
    kare_prizma: "Kare prizma",
    dikdortgen_prizma: "Dikdörtgenler prizması",
    ucgen_prizma: "Üçgen prizma",
    piramit: "Kare piramit",
    silindir: "Silindir",
    koni: "Koni",
    kure: "Küre",
  };

  function splitKind(kind) {
    kind = String(kind || "").toLowerCase();
    var focus = "temel";
    if (kind.indexOf("|") >= 0) {
      var p = kind.split("|");
      kind = p[0];
      focus = (p[1] || "temel").trim();
    }
    if (kind.endsWith("_expl")) {
      kind = kind.slice(0, -5);
    }
    return { base: kind, focus: focus };
  }

  function embedBase() {
    try {
      return new URL("tools/geometri/embed.html", global.location.href).pathname;
    } catch (_) {
      return "tools/geometri/embed.html";
    }
  }

  function markup(kind) {
    var parsed = splitKind(kind);
    var toolShape = SHAPE_MAP[parsed.base];
    if (!toolShape) return "";
    var label = SHAPE_LABEL[parsed.base] || parsed.base;
    var src =
      embedBase() +
      "?shape=" +
      encodeURIComponent(toolShape) +
      "&focus=" +
      encodeURIComponent(parsed.focus);
    return (
      '<div class="q-cisim-3d" role="img" aria-label="' +
      label +
      ' — sürükleyerek çevir">' +
      '<iframe class="q-cisim-3d-frame" src="' +
      src +
      '" title="' +
      label +
      '" loading="lazy" tabindex="-1"></iframe>' +
      '<p class="q-cisim-3d-hint">↔ Parmağınla sürükleyerek cismin etrafında gez</p>' +
      "</div>"
    );
  }

  function mountAll(root) {
    /* iframe self-contained; nothing to mount */
    if (!root) return;
    root.querySelectorAll(".q-cisim-3d-frame").forEach(function (frame) {
      if (frame.dataset.ready) return;
      frame.dataset.ready = "1";
    });
  }

  function scheduleMount() {
    if (typeof requestAnimationFrame !== "function") return;
    requestAnimationFrame(function () {
      var roots = document.querySelectorAll(
        "#explanation-container, #single-player-game-screen .explanation-container"
      );
      for (var i = 0; i < roots.length; i++) {
        mountAll(roots[i]);
      }
    });
  }

  function isCisimExpl(kind) {
    kind = String(kind || "").toLowerCase();
    return kind.indexOf("_expl") >= 0 || kind.indexOf("|") >= 0;
  }

  global.NovaCisim3DViewer = {
    markup: markup,
    mountAll: mountAll,
    scheduleMount: scheduleMount,
    splitKind: splitKind,
    isCisimExpl: isCisimExpl,
    SHAPE_MAP: SHAPE_MAP,
  };
})(typeof window !== "undefined" ? window : globalThis);

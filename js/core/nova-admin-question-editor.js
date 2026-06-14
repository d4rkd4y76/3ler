/**
 * Admin soru editörü — blok tabanlı öncül, Bunny medya, ilkokul matematik & geometri araçları
 */
(function (global) {
  const NQM = function () {
    return global.NovaQuestionMarkup;
  };

  function escAttr(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function getQuestionFields(q) {
    const questionText =
      typeof q.question === "object" ? q.question.text || "" : q.question || "";
    const questionInfo =
      typeof q.question === "object" ? q.question.info || "" : q.info || "";
    const infoItems =
      typeof q.question === "object" && Array.isArray(q.question.infoItems)
        ? q.question.infoItems
        : Array.isArray(q.infoItems)
          ? q.infoItems
          : null;
    const infoBlocks =
      typeof q.question === "object" && Array.isArray(q.question.infoBlocks)
        ? q.question.infoBlocks
        : Array.isArray(q.infoBlocks)
          ? q.infoBlocks
          : null;
    return { questionText, questionInfo, infoItems, infoBlocks };
  }

  function blockTypeLabel(type) {
    return (
      {
        text: "Metin",
        items: "Madde listesi",
        image: "Görsel",
        video: "Bunny video",
      }[type] || type
    );
  }

  function blockCardHtml(block, idx) {
    const mq = NQM();
    const type = block.type || "text";
    let body = "";

    if (type === "text") {
      body =
        '<textarea class="q-field-textarea q-block-text q-insert-target" rows="3" placeholder="Paragraf veya yönerge…" data-field-label="Öncül metni">' +
        escAttr(block.content || "") +
        "</textarea>";
    } else if (type === "items") {
      const rows = (block.items || []).map(function (it, i) {
        return itemRowHtml(it, i);
      });
      if (!rows.length) rows.push(itemRowHtml({ label: "I.", text: "" }, 0));
      body =
        '<p class="q-editor-hint">Her madde ayrı kutuda görünür (I., II., III. …)</p>' +
        '<div class="q-block-items">' +
        rows.join("") +
        "</div>" +
        '<button type="button" class="btn small q-block-add-item">+ Madde ekle</button>';
    } else if (type === "image") {
      body =
        '<label class="q-field-label">Görsel URL (Bunny CDN veya https://…)</label>' +
        '<input class="q-field-input q-block-image-url" type="url" value="' +
        escAttr(block.url || "") +
        '" placeholder="https://vz-xxxxx.b-cdn.net/…/image.png">' +
        '<p class="q-editor-hint">Bunny Storage/CDN adresini yapıştırın veya herhangi bir görsel linki.</p>';
    } else if (type === "video") {
      body =
        '<div class="q-block-video-grid">' +
        '<div><label class="q-field-label">Bunny kütüphane adı (vz-…)</label>' +
        '<input class="q-field-input q-block-video-host" type="text" value="' +
        escAttr(block.libraryName || "") +
        '" placeholder="vz-xxxxx"></div>' +
        '<div><label class="q-field-label">Kütüphane ID (opsiyonel)</label>' +
        '<input class="q-field-input q-block-video-libid" type="text" value="' +
        escAttr(block.libraryId || "") +
        '" placeholder="Embed için"></div>' +
        '<div style="grid-column:1/-1"><label class="q-field-label">Video ID (GUID)</label>' +
        '<input class="q-field-input q-block-video-id" type="text" value="' +
        escAttr(block.videoId || "") +
        '" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"></div></div>' +
        '<p class="q-editor-hint">Bunny Stream panelinden kopyalayın. Kütüphane adı veya ID yeterli.</p>';
    }

    return (
      '<div class="q-block-card" data-block-idx="' +
      idx +
      '" data-block-type="' +
      escAttr(type) +
      '">' +
      '<div class="q-block-card__head">' +
      '<span class="q-block-card__badge">' +
      blockTypeLabel(type) +
      "</span>" +
      '<div class="q-block-card__actions">' +
      '<button type="button" class="btn small q-block-up" title="Yukarı">↑</button>' +
      '<button type="button" class="btn small q-block-down" title="Aşağı">↓</button>' +
      '<button type="button" class="btn small err q-block-del" title="Sil">✕</button>' +
      "</div></div>" +
      '<div class="q-block-card__body">' +
      body +
      "</div></div>"
    );
  }

  function itemRowHtml(it, i) {
    const mq = NQM();
    const label =
      (it && it.label) ||
      (mq && i < 10 ? ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][i] + "." : i + 1 + ".");
    return (
      '<div class="q-info-item-row">' +
      '<span class="q-info-item-label">' +
      escAttr(label) +
      "</span>" +
      '<textarea class="q-info-item-text q-insert-target" rows="2" placeholder="Madde metni…" data-field-label="Öncül maddesi">' +
      escAttr((it && it.text) || "") +
      "</textarea>" +
      '<button type="button" class="btn small err q-info-del" title="Sil">✕</button>' +
      "</div>"
    );
  }

  function buildBlocksHtml(blocks) {
    if (!blocks || !blocks.length) {
      return '<p class="q-blocks-empty">Henüz öncül yok. Aşağıdaki butonlarla metin, madde, görsel veya video ekleyin.</p>';
    }
    return blocks.map(blockCardHtml).join("");
  }

  function mathToolbarHtml() {
    return (
      '<div class="q-editor-tool-group">' +
      '<span class="q-editor-tool-group__title">Kesir</span>' +
      '<div class="q-math-toolbar">' +
      '<button type="button" class="btn small q-insert-frac" data-num="1" data-den="2">½</button>' +
      '<button type="button" class="btn small q-insert-frac" data-num="1" data-den="3">⅓</button>' +
      '<button type="button" class="btn small q-insert-frac" data-num="1" data-den="4">¼</button>' +
      '<button type="button" class="btn small q-insert-frac" data-num="2" data-den="3">⅔</button>' +
      '<button type="button" class="btn small q-insert-frac" data-num="3" data-den="4">¾</button>' +
      '<button type="button" class="btn small q-insert-frac-custom">Özel…</button>' +
      "</div></div>" +
      '<div class="q-editor-tool-group">' +
      '<span class="q-editor-tool-group__title">Alt alta işlem</span>' +
      '<div class="q-math-toolbar">' +
      '<button type="button" class="btn small q-insert-mul">Çarpma…</button>' +
      '<button type="button" class="btn small q-insert-div">Bölme…</button>' +
      "</div></div>" +
      '<div class="q-editor-tool-group">' +
      '<span class="q-editor-tool-group__title">Geometrik şekil</span>' +
      '<div class="q-math-toolbar q-math-toolbar--wrap">' +
      '<button type="button" class="btn small q-insert-shape" data-shape="kare">Kare</button>' +
      '<button type="button" class="btn small q-insert-shape" data-shape="dikdortgen">Dikdörtgen</button>' +
      '<button type="button" class="btn small q-insert-shape" data-shape="ucgen">Üçgen</button>' +
      '<button type="button" class="btn small q-insert-shape" data-shape="daire">Daire</button>' +
      '<button type="button" class="btn small q-insert-shape" data-shape="besgen">Beşgen</button>' +
      '<button type="button" class="btn small q-insert-shape" data-shape="altigen">Altıgen</button>' +
      "</div></div>" +
      '<div class="q-editor-tool-group">' +
      '<span class="q-editor-tool-group__title">Geometrik cisim</span>' +
      '<div class="q-math-toolbar q-math-toolbar--wrap">' +
      '<button type="button" class="btn small q-insert-solid" data-solid="kup">Küp</button>' +
      '<button type="button" class="btn small q-insert-solid" data-solid="dikdortgenler_prizmasi">Prizma</button>' +
      '<button type="button" class="btn small q-insert-solid" data-solid="kure">Küre</button>' +
      '<button type="button" class="btn small q-insert-solid" data-solid="silindir">Silindir</button>' +
      '<button type="button" class="btn small q-insert-solid" data-solid="koni">Koni</button>' +
      '<button type="button" class="btn small q-insert-solid" data-solid="piramit">Piramit</button>' +
      "</div></div>"
    );
  }

  function emphasisToolbarHtml() {
    return (
      '<div class="q-editor-em-bar">' +
      '<span class="q-editor-em-bar__title">Metin vurgulama</span>' +
      '<p class="q-editor-hint q-editor-hint--inline">Kelimeyi seçin, sonra stile tıklayın. Soru, öncül, şık ve açıklamada geçerlidir.</p>' +
      '<div class="q-em-toolbar">' +
      '<button type="button" class="btn small q-wrap-em q-wrap-em--bold" data-em="kalin" title="Seçili metni kalın yap">𝐁 Kalın</button>' +
      '<button type="button" class="btn small q-wrap-em q-wrap-em--red" data-em="kirmizi" title="Parlak kırmızı">Kırmızı</button>' +
      '<button type="button" class="btn small q-wrap-em q-wrap-em--blue" data-em="mavi" title="Parlak mavi">Mavi</button>' +
      '<button type="button" class="btn small q-wrap-em q-wrap-em--green" data-em="yesil" title="Parlak yeşil">Yeşil</button>' +
      "</div></div>"
    );
  }

  function enhancedEditorHtml(q, prefix, opts) {
    opts = opts || {};
    const fields = getQuestionFields(q);
    const mq = NQM();
    const blocks = mq
      ? mq.getInfoBlocks(fields.questionInfo, fields.infoItems, fields.infoBlocks)
      : [];

    const optionsBlock =
      '<div class="q-editor-options">' +
      '<p class="q-editor-hint">Şıklara tıklayıp imleci oraya getirin; üstteki araçlar buraya da eklenir.</p>' +
      '<label class="q-field-label">Doğru cevap</label>' +
      '<input class="q-field-input q-insert-target" id="' +
      prefix +
      '_correct" type="text" value="' +
      escAttr(q.correct || "") +
      '" placeholder="Doğru şık metni" data-field-label="Doğru cevap">' +
      '<label class="q-field-label">Yanlış şık 1</label>' +
      '<input class="q-field-input q-insert-target" id="' +
      prefix +
      '_wrong1" type="text" value="' +
      escAttr(q.wrong1 || "") +
      '" data-field-label="Yanlış şık 1">' +
      '<label class="q-field-label">Yanlış şık 2</label>' +
      '<input class="q-field-input q-insert-target" id="' +
      prefix +
      '_wrong2" type="text" value="' +
      escAttr(q.wrong2 || "") +
      '" data-field-label="Yanlış şık 2">' +
      (opts.wrong3
        ? '<label class="q-field-label">Yanlış şık 3</label><input class="q-field-input q-insert-target" id="' +
          prefix +
          '_wrong3" type="text" value="' +
          escAttr(q.wrong3 || "") +
          '" data-field-label="Yanlış şık 3">'
        : "") +
      (opts.subject
        ? '<label class="q-field-label">Ders etiketi</label><input class="q-field-input" id="' +
          prefix +
          '_subject" type="text" value="' +
          escAttr(q.subject || "") +
          '" placeholder="MATEMATİK">'
        : "") +
      "</div>";

    return (
      '<div class="q-editor-root" data-prefix="' +
      escAttr(prefix) +
      '">' +
      '<div class="q-editor-math-bar">' +
      '<span class="q-editor-math-bar__title">İlkokul araçları</span>' +
      '<p class="q-editor-active-field" id="' +
      prefix +
      '_active_field">Aktif alan: <strong>Soru metni</strong></p>' +
      mathToolbarHtml() +
      '<p class="q-editor-hint q-editor-hint--inline">Soru, öncül, şık veya açıklama kutusuna tıklayın; araç imlecin olduğu alana eklenir.</p>' +
      "</div>" +
      emphasisToolbarHtml() +
      '<div class="q-editor-columns">' +
      '<div class="q-editor-col q-editor-col--main">' +
      '<section class="q-editor-section">' +
      '<label class="q-field-label" for="' +
      prefix +
      '_text">Soru metni</label>' +
      '<p class="q-editor-hint">Öğrencinin cevaplayacağı asıl soru. Kesir, çarpma, geometri araçlarını burada da kullanabilirsiniz.</p>' +
      '<textarea class="q-field-textarea q-field-textarea--stem q-insert-target" id="' +
      prefix +
      '_text" rows="3" placeholder="Örn: Yukarıdaki şeklin alanı kaç santimetrekaredir?" data-field-label="Soru metni">' +
      escAttr(fields.questionText) +
      "</textarea>" +
      "</section>" +
      '<section class="q-editor-section q-editor-section--preamble">' +
      '<div class="q-preamble-head">' +
      '<label class="q-field-label">Öncül <span class="q-optional">(isteğe bağlı)</span></label>' +
      '<p class="q-editor-hint">Sorudan önce gösterilecek metin, madde listesi, Bunny görsel veya video. İstediğiniz sırayla birden fazla blok ekleyebilirsiniz.</p>' +
      "</div>" +
      '<div class="q-blocks-list" id="' +
      prefix +
      '_blocks">' +
      buildBlocksHtml(blocks) +
      "</div>" +
      '<div class="q-block-add-bar">' +
      '<span class="q-block-add-bar__label">Öncüle ekle:</span>' +
      '<button type="button" class="btn small q-add-block" data-block-type="text">📝 Metin</button>' +
      '<button type="button" class="btn small q-add-block" data-block-type="items">📋 Madde listesi</button>' +
      '<button type="button" class="btn small q-add-block" data-block-type="image">🖼️ Görsel</button>' +
      '<button type="button" class="btn small q-add-block" data-block-type="video">🎬 Bunny video</button>' +
      "</div>" +
      "</section>" +
      (opts.explanation !== false
        ? '<section class="q-editor-section">' +
          '<label class="q-field-label" for="' +
          prefix +
          '_exp">Açıklama <span class="q-optional">(isteğe bağlı)</span></label>' +
          '<p class="q-editor-hint">Kesir, işlem ve geometri araçları açıklamada da kullanılabilir.</p>' +
          '<textarea class="q-field-textarea q-insert-target" id="' +
          prefix +
          '_exp" rows="3" placeholder="Yanlış cevaptan sonra gösterilebilir…" data-field-label="Açıklama">' +
          escAttr(q.explanation || "") +
          "</textarea></section>"
        : "") +
      "</div>" +
      '<div class="q-editor-col q-editor-col--side">' +
      optionsBlock +
      '<section class="q-editor-section q-editor-section--preview">' +
      '<div class="q-live-preview" id="' +
      prefix +
      '_preview">' +
      '<div class="q-live-preview__title">Öğrenci önizlemesi</div>' +
      '<div class="q-live-preview__body"></div>' +
      '<div class="q-live-preview__opts" id="' +
      prefix +
      '_preview_opts"></div>' +
      '<div class="q-live-preview__exp" id="' +
      prefix +
      '_preview_exp"></div>' +
      "</div></section>" +
      "</div></div></div>"
    );
  }

  function readBlockFromCard(card) {
    const mq = NQM();
    const type = card.getAttribute("data-block-type") || "text";
    if (type === "text") {
      const ta = card.querySelector(".q-block-text");
      const content = ta ? ta.value.trim() : "";
      return content ? { type: "text", content: content } : null;
    }
    if (type === "items") {
      const items = Array.from(card.querySelectorAll(".q-info-item-row"))
        .map(function (row, i) {
          const labelEl = row.querySelector(".q-info-item-label");
          const ta = row.querySelector(".q-info-item-text");
          const text = ta ? ta.value.trim() : "";
          if (!text) return null;
          return {
            label: labelEl ? labelEl.textContent.trim() : "",
            text: text,
          };
        })
        .filter(Boolean);
      return items.length ? { type: "items", items: items } : null;
    }
    if (type === "image") {
      const inp = card.querySelector(".q-block-image-url");
      const url = inp ? inp.value.trim() : "";
      return url ? { type: "image", url: url } : null;
    }
    if (type === "video") {
      const host = card.querySelector(".q-block-video-host");
      const libId = card.querySelector(".q-block-video-libid");
      const vid = card.querySelector(".q-block-video-id");
      const videoId = vid ? vid.value.trim() : "";
      if (!videoId) return null;
      return {
        type: "video",
        libraryName: host ? host.value.trim() : "",
        libraryId: libId ? libId.value.trim() : "",
        videoId: videoId,
      };
    }
    return null;
  }

  function readBlocksFromForm(dlg, prefix) {
    const list = dlg.querySelector("#" + prefix + "_blocks");
    if (!list) return [];
    return Array.from(list.querySelectorAll(".q-block-card"))
      .map(readBlockFromCard)
      .filter(Boolean);
  }

  function readPreambleFromForm(dlg, prefix) {
    const mq = NQM();
    const blocks = readBlocksFromForm(dlg, prefix);
    if (!blocks.length) {
      return { info: null, infoItems: null, infoBlocks: null };
    }
    if (mq) {
      return mq.blocksToLegacy(blocks);
    }
    return { info: null, infoItems: null, infoBlocks: blocks };
  }

  function readQuestionPayload(dlg, prefix, opts) {
    opts = opts || {};
    const preamble = readPreambleFromForm(dlg, prefix);

    const payload = {
      question: {
        text: (dlg.querySelector("#" + prefix + "_text") || {}).value.trim(),
        info: preamble.info,
        infoItems: preamble.infoItems,
        infoBlocks: preamble.infoBlocks,
      },
      correct: (dlg.querySelector("#" + prefix + "_correct") || {}).value.trim(),
      wrong1: (dlg.querySelector("#" + prefix + "_wrong1") || {}).value.trim(),
      wrong2: (dlg.querySelector("#" + prefix + "_wrong2") || {}).value.trim(),
    };

    if (opts.wrong3) {
      payload.wrong3 = (dlg.querySelector("#" + prefix + "_wrong3") || {}).value.trim();
    }
    if (opts.explanation !== false) {
      payload.explanation =
        (dlg.querySelector("#" + prefix + "_exp") || {}).value.trim() || null;
    }
    if (opts.subject) {
      payload.subject =
        (dlg.querySelector("#" + prefix + "_subject") || {}).value.trim() || "GENEL";
    }
    return payload;
  }

  function fieldLabel(el) {
    if (!el) return "Metin alanı";
    return el.getAttribute("data-field-label") || el.id || "Metin alanı";
  }

  function setActiveField(dlg, prefix, el) {
    dlg.querySelectorAll(".q-field-focus").forEach(function (x) {
      x.classList.remove("q-field-focus");
    });
    if (el) el.classList.add("q-field-focus");
    const hint = dlg.querySelector("#" + prefix + "_active_field");
    if (hint) {
      hint.innerHTML =
        'Aktif alan: <strong>' + escAttr(fieldLabel(el)) + "</strong>";
    }
  }

  function wireInsertTarget(dlg, prefix, el, onInput) {
    if (!el || !el.classList.contains("q-insert-target")) return;
    el.addEventListener("focus", function () {
      setActiveField(dlg, prefix, el);
    });
    el.addEventListener("input", function () {
      if (onInput) onInput();
    });
  }

  function updatePreview(dlg, prefix, opts) {
    opts = opts || {};
    const mq = NQM();
    const box = dlg.querySelector("#" + prefix + "_preview .q-live-preview__body");
    if (!mq || !box) return;

    const blocks = readBlocksFromForm(dlg, prefix);
    const stem = (dlg.querySelector("#" + prefix + "_text") || {}).value || "";
    const legacy = mq.blocksToLegacy(blocks);

    let html = "";
    if (blocks.length) {
      html += mq.preambleHtml(legacy.info, legacy.infoItems, blocks);
      html +=
        '<div class="question-divider" style="height:1px;background:#cbd5e1;margin:12px 0"></div>';
    }
    html +=
      '<div class="question-actual-text q-markup" style="font-weight:700">' +
      mq.renderMarkupHtml(stem) +
      "</div>";
    box.innerHTML =
      html || '<span class="q-preview-empty">Önizleme için soru metni yazın…</span>';

    const optsBox = dlg.querySelector("#" + prefix + "_preview_opts");
    if (optsBox) {
      const correct = (dlg.querySelector("#" + prefix + "_correct") || {}).value || "";
      const wrong1 = (dlg.querySelector("#" + prefix + "_wrong1") || {}).value || "";
      const wrong2 = (dlg.querySelector("#" + prefix + "_wrong2") || {}).value || "";
      const wrong3El = dlg.querySelector("#" + prefix + "_wrong3");
      const wrong3 = wrong3El ? wrong3El.value || "" : "";
      const optRows = [
        { label: "Doğru", val: correct, ok: true },
        { label: "Yanlış 1", val: wrong1 },
        { label: "Yanlış 2", val: wrong2 },
      ];
      if (opts.wrong3 || wrong3El) optRows.push({ label: "Yanlış 3", val: wrong3 });
      const anyOpt = optRows.some(function (r) {
        return String(r.val || "").trim();
      });
      if (anyOpt) {
        optsBox.innerHTML =
          '<div class="q-preview-opts-title">Şıklar</div>' +
          optRows
            .filter(function (r) {
              return String(r.val || "").trim();
            })
            .map(function (r) {
              return (
                '<div class="q-preview-opt' +
                (r.ok ? " q-preview-opt--ok" : "") +
                '"><span class="q-preview-opt__label">' +
                escAttr(r.label) +
                '</span><span class="q-preview-opt__body q-markup">' +
                mq.renderMarkupHtml(r.val) +
                "</span></div>"
              );
            })
            .join("");
        optsBox.style.display = "";
      } else {
        optsBox.innerHTML = "";
        optsBox.style.display = "none";
      }
    }

    const expBox = dlg.querySelector("#" + prefix + "_preview_exp");
    if (expBox) {
      const exp = (dlg.querySelector("#" + prefix + "_exp") || {}).value || "";
      if (String(exp).trim()) {
        expBox.innerHTML =
          '<div class="q-preview-opts-title">Açıklama</div>' +
          '<div class="q-preview-exp-body q-markup">' +
          mq.renderMarkupHtml(exp) +
          "</div>";
        expBox.style.display = "";
      } else {
        expBox.innerHTML = "";
        expBox.style.display = "none";
      }
    }
  }

  function renumberItemLabels(card) {
    Array.from(card.querySelectorAll(".q-info-item-row")).forEach(function (row, i) {
      const lab = row.querySelector(".q-info-item-label");
      if (lab) {
        const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
        lab.textContent = (romans[i] || String(i + 1)) + ".";
      }
    });
  }

  function wireBlockCard(dlg, prefix, card, opts) {
    opts = opts || {};
    const mq = NQM();
    const list = dlg.querySelector("#" + prefix + "_blocks");
    if (!list || !card) return;

    const refresh = function () {
      updatePreview(dlg, prefix, opts);
    };

    card.querySelectorAll("textarea.q-insert-target, input.q-insert-target").forEach(function (el) {
      wireInsertTarget(dlg, prefix, el, refresh);
    });

    const delBtn = card.querySelector(".q-block-del");
    if (delBtn) {
      delBtn.addEventListener("click", function () {
        card.remove();
        const empty = list.querySelector(".q-blocks-empty");
        if (!list.querySelector(".q-block-card")) {
          if (!empty) {
            list.innerHTML =
              '<p class="q-blocks-empty">Henüz öncül yok. Aşağıdaki butonlarla metin, madde, görsel veya video ekleyin.</p>';
          }
        }
        refresh();
      });
    }

    const upBtn = card.querySelector(".q-block-up");
    if (upBtn) {
      upBtn.addEventListener("click", function () {
        const prev = card.previousElementSibling;
        if (prev && prev.classList.contains("q-block-card")) {
          list.insertBefore(card, prev);
          refresh();
        }
      });
    }

    const downBtn = card.querySelector(".q-block-down");
    if (downBtn) {
      downBtn.addEventListener("click", function () {
        const next = card.nextElementSibling;
        if (next && next.classList.contains("q-block-card")) {
          list.insertBefore(next, card);
          refresh();
        }
      });
    }

    card.querySelectorAll(".q-info-del").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const row = btn.closest(".q-info-item-row");
        if (row) {
          row.remove();
          renumberItemLabels(card);
          refresh();
        }
      });
    });

    const addItemBtn = card.querySelector(".q-block-add-item");
    if (addItemBtn) {
      addItemBtn.addEventListener("click", function () {
        const itemsWrap = card.querySelector(".q-block-items");
        const i = itemsWrap ? itemsWrap.querySelectorAll(".q-info-item-row").length : 0;
        const row = document.createElement("div");
        row.innerHTML = itemRowHtml({ text: "" }, i);
        const rowEl = row.firstElementChild;
        itemsWrap.appendChild(rowEl);
        rowEl.querySelector(".q-info-del").addEventListener("click", function () {
          rowEl.remove();
          renumberItemLabels(card);
          refresh();
        });
        wireInsertTarget(dlg, prefix, rowEl.querySelector(".q-info-item-text"), refresh);
        renumberItemLabels(card);
        refresh();
      });
    }
  }

  function addBlock(dlg, prefix, type, opts) {
    opts = opts || {};
    const list = dlg.querySelector("#" + prefix + "_blocks");
    if (!list) return;

    const empty = list.querySelector(".q-blocks-empty");
    if (empty) empty.remove();

    const idx = list.querySelectorAll(".q-block-card").length;
    const block =
      type === "items"
        ? { type: "items", items: [{ label: "I.", text: "" }] }
        : type === "image"
          ? { type: "image", url: "" }
          : type === "video"
            ? { type: "video", libraryName: "", libraryId: "", videoId: "" }
            : { type: "text", content: "" };

    const wrap = document.createElement("div");
    wrap.innerHTML = blockCardHtml(block, idx);
    const card = wrap.firstElementChild;
    list.appendChild(card);
    wireBlockCard(dlg, prefix, card, opts);
    updatePreview(dlg, prefix, opts);

    const focusEl = card.querySelector("textarea, input");
    if (focusEl) focusEl.focus();
  }

  function wireEditor(dlg, prefix, opts) {
    opts = opts || {};
    const mq = NQM();
    if (!mq) return;

    function refreshPreview() {
      updatePreview(dlg, prefix, opts);
    }

    function activeField() {
      return (
        dlg.querySelector(".q-field-focus") ||
        dlg.querySelector("#" + prefix + "_text")
      );
    }

    dlg.querySelectorAll(".q-insert-target").forEach(function (el) {
      wireInsertTarget(dlg, prefix, el, refreshPreview);
    });

    setActiveField(dlg, prefix, dlg.querySelector("#" + prefix + "_text"));

    function afterInsert() {
      refreshPreview();
    }

    dlg.querySelectorAll(".q-insert-frac").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const field = activeField();
        if (!field) {
          alert("Önce bir metin alanına tıklayın (soru, şık veya açıklama).");
          return;
        }
        mq.insertFraction(
          field,
          btn.getAttribute("data-num"),
          btn.getAttribute("data-den")
        );
        afterInsert();
      });
    });

    const customFrac = dlg.querySelector(".q-insert-frac-custom");
    if (customFrac) {
      customFrac.addEventListener("click", function () {
        const field = activeField();
        if (!field) {
          alert("Önce bir metin alanına tıklayın (soru, şık veya açıklama).");
          return;
        }
        const a = prompt("Pay (üstteki sayı):", "1");
        if (a == null) return;
        const b = prompt("Payda (alttaki sayı):", "3");
        if (b == null) return;
        if (!/^\d+$/.test(a) || !/^\d+$/.test(b) || Number(b) === 0) {
          alert("Geçerli pozitif tam sayı girin.");
          return;
        }
        mq.insertFraction(field, a, b);
        afterInsert();
      });
    }

    const mulBtn = dlg.querySelector(".q-insert-mul");
    if (mulBtn) {
      mulBtn.addEventListener("click", function () {
        const field = activeField();
        if (!field) {
          alert("Önce bir metin alanına tıklayın (soru, şık veya açıklama).");
          return;
        }
        const a = prompt("Üstteki sayı (çarpılan):", "23");
        if (a == null) return;
        const b = prompt("Alttaki sayı (çarpan):", "45");
        if (b == null) return;
        if (!/^\d+$/.test(a) || !/^\d+$/.test(b)) {
          alert("Geçerli tam sayı girin.");
          return;
        }
        mq.insertMul(field, a, b);
        afterInsert();
      });
    }

    const divBtn = dlg.querySelector(".q-insert-div");
    if (divBtn) {
      divBtn.addEventListener("click", function () {
        const field = activeField();
        if (!field) {
          alert("Önce bir metin alanına tıklayın (soru, şık veya açıklama).");
          return;
        }
        const a = prompt("Bölünen (üstteki sayı):", "144");
        if (a == null) return;
        const b = prompt("Bölen (alttaki sayı):", "12");
        if (b == null) return;
        if (!/^\d+$/.test(a) || !/^\d+$/.test(b) || Number(b) === 0) {
          alert("Geçerli tam sayı girin (bölen sıfır olamaz).");
          return;
        }
        mq.insertDiv(field, a, b);
        afterInsert();
      });
    }

    dlg.querySelectorAll(".q-insert-shape").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const field = activeField();
        if (!field) {
          alert("Önce bir metin alanına tıklayın (soru, şık veya açıklama).");
          return;
        }
        const shape = btn.getAttribute("data-shape") || "kare";
        const picked = mq.promptShapeEdges(shape);
        if (!picked) return;
        mq.insertShape(field, shape, picked.edgesSpec, picked.unit);
        afterInsert();
      });
    });

    dlg.querySelectorAll(".q-insert-solid").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const field = activeField();
        if (!field) {
          alert("Önce bir metin alanına tıklayın (soru, şık veya açıklama).");
          return;
        }
        const solid = btn.getAttribute("data-solid") || "kup";
        const size = prompt("Kenar / yarıçap uzunluğu (prizma için 8,5 gibi):", "4");
        if (size == null || !size.trim()) return;
        const unit = prompt("Birim:", "cm") || "cm";
        mq.insertSolid(field, solid, size.trim(), unit.trim());
        afterInsert();
      });
    });

    dlg.querySelectorAll(".q-wrap-em").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const field = activeField();
        if (!field) {
          alert("Önce bir metin alanına tıklayın (soru, öncül, şık veya açıklama).");
          return;
        }
        const em = btn.getAttribute("data-em") || "kalin";
        if (typeof mq.wrapEmphasis === "function") {
          if (!mq.wrapEmphasis(field, em)) {
            alert("Önce vurgulanacak kelimeyi veya metni seçin.");
            return;
          }
        }
        afterInsert();
      });
    });

    dlg.querySelectorAll(".q-add-block").forEach(function (btn) {
      btn.addEventListener("click", function () {
        addBlock(dlg, prefix, btn.getAttribute("data-block-type"), opts);
      });
    });

    dlg.querySelectorAll(".q-block-card").forEach(function (card) {
      wireBlockCard(dlg, prefix, card, opts);
    });

    refreshPreview();
  }

  global.NovaAdminQuestionEditor = {
    enhancedEditorHtml: enhancedEditorHtml,
    wireEditor: wireEditor,
    readQuestionPayload: readQuestionPayload,
  };
})(typeof window !== "undefined" ? window : globalThis);

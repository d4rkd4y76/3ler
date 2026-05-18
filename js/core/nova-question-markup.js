/**
 * Soru metni: kesirler [[1/3]], öncül maddeleri (I., II. veya (1) (2))
 * Öğrenci + admin önizleme — güvenli HTML (sadece izinli etiketler)
 */
(function (global) {
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const FRAC_RE = /\[\[\s*(\d+)\s*[\/|]\s*(\d+)\s*\]\]/g;
  const IMG_RE = /^https?:\/\/\S+\.(png|jpe?g|gif|webp)(\?\S*)?$/i;

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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

  function renderMarkupHtml(raw) {
    if (raw == null || raw === "") return "";
    let s = escapeHtml(String(raw));
    s = s.replace(FRAC_RE, function (_, a, b) {
      return stackedFractionHtml(a, b);
    });
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\n/g, "<br>");
    return s;
  }

  function defaultRoman(i) {
    return (ROMAN[i] || String(i + 1)) + ".";
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

    if (IMG_RE.test(text)) return [];

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

    const lines = text.split(/\n+/).map(function (l) {
      return l.trim();
    }).filter(Boolean);
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

  function isGenericPrompt(info) {
    return /doğru seçeneği işaretleyin\.?/i.test(String(info || "").trim());
  }

  function preambleHtml(info, infoItems) {
    const items = parsePreambleItems(info, infoItems);
    if (!items.length) return "";
    if (items.length === 1 && !items[0].label) {
      return (
        '<div class="question-info-text q-markup">' +
        renderMarkupHtml(items[0].text) +
        "</div>"
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

  /** Öncül + soru kökünü konteynere yerleştir */
  function mountQuestionText(container, opts) {
    opts = opts || {};
    const info = opts.info || "";
    const infoItems = opts.infoItems;
    const question = opts.question || "";
    const infoValue = String(info || "").trim();
    const hasInfoImage = IMG_RE.test(infoValue);
    const hasInfoText =
      (!!infoValue || (infoItems && infoItems.length)) && !hasInfoImage && !isGenericPrompt(info);

    const textContainer = document.createElement("div");
    textContainer.className = "question-text-container";

    if (hasInfoImage) {
      const infoImage = document.createElement("img");
      infoImage.src = infoValue;
      infoImage.alt = "Öncül görseli";
      infoImage.className = "question-info-image";
      textContainer.appendChild(infoImage);
    } else if (hasInfoText) {
      const wrap = document.createElement("div");
      wrap.className = "question-preamble-wrap";
      wrap.innerHTML = preambleHtml(info, infoItems);
      textContainer.appendChild(wrap);
    }

    if (hasInfoImage || hasInfoText) {
      const divider = document.createElement("div");
      divider.className = "question-divider";
      textContainer.appendChild(divider);
    } else {
      textContainer.classList.add("no-preamble");
    }

    const questionText = document.createElement("div");
    questionText.className = "question-actual-text q-markup";
    questionText.innerHTML = renderMarkupHtml(question);
    textContainer.appendChild(questionText);

    container.appendChild(textContainer);
    return textContainer;
  }

  function fillMarkupElement(el, raw) {
    if (!el) return;
    el.classList.add("q-markup");
    el.innerHTML = renderMarkupHtml(raw);
  }

  function mountDenemePreamble(parent, info, infoItems) {
    const infoValue = String(info || "").trim();
    if (IMG_RE.test(infoValue)) {
      const pre = document.createElement("div");
      pre.className = "deneme-q-pre";
      const im = document.createElement("img");
      im.src = infoValue;
      im.alt = "Öncül";
      pre.appendChild(im);
      parent.appendChild(pre);
      return;
    }
    const items = parsePreambleItems(info, infoItems);
    if (!items.length) return;
    const pre = document.createElement("div");
    pre.className = "deneme-q-pre q-markup";
    pre.innerHTML = preambleHtml(info, infoItems);
    parent.appendChild(pre);
  }

  global.NovaQuestionMarkup = {
    escapeHtml: escapeHtml,
    renderMarkupHtml: renderMarkupHtml,
    parsePreambleItems: parsePreambleItems,
    serializePreambleItems: serializePreambleItems,
    preambleHtml: preambleHtml,
    mountQuestionText: mountQuestionText,
    fillMarkupElement: fillMarkupElement,
    mountDenemePreamble: mountDenemePreamble,
    isImageUrl: function (s) {
      return IMG_RE.test(String(s || "").trim());
    },
    insertFraction: function (input, num, den) {
      if (!input) return;
      const token = "[[" + (num || "1") + "/" + (den || "3") + "]]";
      const start = input.selectionStart != null ? input.selectionStart : input.value.length;
      const end = input.selectionEnd != null ? input.selectionEnd : start;
      const v = input.value;
      input.value = v.slice(0, start) + token + v.slice(end);
      const pos = start + token.length;
      input.focus();
      if (input.setSelectionRange) input.setSelectionRange(pos, pos);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    },
  };
})(typeof window !== "undefined" ? window : globalThis);

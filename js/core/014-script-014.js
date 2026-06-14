// === Nova: Single-player Explanation Feature (v3 — net özet) ===
function escapeHTML(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[&<>"']/g, function (s) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s];
  });
}

function getExplanationOnly(q) {
  if (!q || typeof q !== "object") return "";
  var raw =
    q.explanation || q.aciklama || q["açıklama"] || "";
  return String(raw || "").trim();
}

function novaMarkupHtml(raw, readable) {
  try {
    if (
      window.NovaQuestionMarkup &&
      typeof window.NovaQuestionMarkup.renderMarkupHtml === "function"
    ) {
      return (
        '<span class="q-markup' +
        (readable ? " q-markup--readable" : "") +
        '">' +
        window.NovaQuestionMarkup.renderMarkupHtml(raw || "") +
        "</span>"
      );
    }
  } catch (_) {}
  return escapeHTML(String(raw || ""));
}

function showExplanationAndNext() {
  try {
    const currentQuestion = gameQuestions[currentQuestionIndex];
    const expl = document.getElementById("explanation-container");
    if (!expl) {
      proceedToNextQuestion();
      return;
    }
    const wrongReviewActive = !!window.NOVA_WRONG_REVIEW_ACTIVE;
    const wrongReviewItems = wrongReviewActive ? (window.__novaWrongReviewItems || []) : [];
    const wrongReviewPos = wrongReviewActive ? (Number(window.__novaWrongReviewPos) || 0) : 0;
    const isLast =
      Array.isArray(gameQuestions) &&
      currentQuestionIndex >= gameQuestions.length - 1;
    const correctText =
      currentQuestion && currentQuestion.correct
        ? String(currentQuestion.correct)
        : "";
    const noteText = getExplanationOnly(currentQuestion);
    const chosenBtn = document.querySelector(".option-button.option-chosen");
    let chosenRaw = chosenBtn
      ? String(
          chosenBtn.getAttribute("data-opt-text") ||
            chosenBtn.innerText ||
            chosenBtn.textContent ||
            ""
        ).trim()
      : "";
    if (wrongReviewActive && wrongReviewItems[wrongReviewPos]) {
      var stored = String(wrongReviewItems[wrongReviewPos].chosen || "").trim();
      if (typeof window.novaResolveOptionLabel === "function") {
        chosenRaw = window.novaResolveOptionLabel(stored, currentQuestion);
      } else if (stored) {
        chosenRaw = stored;
      }
    } else if (chosenRaw && typeof window.novaResolveOptionLabel === "function") {
      chosenRaw = window.novaResolveOptionLabel(chosenRaw, currentQuestion);
    }
    const isCorrect = wrongReviewActive
      ? false
      : chosenBtn
        ? chosenBtn.classList.contains("correct")
        : false;

    var footerHtml = "";
    if (wrongReviewActive && wrongReviewItems.length) {
      var hasPrev = wrongReviewPos > 0;
      var hasNext = wrongReviewPos < wrongReviewItems.length - 1;
      footerHtml =
        '<div class="explanation-nav-row">' +
        '<button type="button" id="wrong-review-prev" class="next-question-button next-question-button--secondary"' +
        (hasPrev ? "" : " disabled") +
        ">← Önceki</button>" +
        '<button type="button" id="wrong-review-next" class="next-question-button"' +
        (hasNext ? "" : " disabled") +
        ">" +
        (hasNext ? "Sonraki →" : "Sonraki yok") +
        "</button></div>" +
        '<button type="button" id="wrong-review-exit" class="next-question-button next-question-button--ghost">Sonuç Ekranına Dön</button>';
    } else {
      footerHtml =
        '<button type="button" id="next-question-button" class="next-question-button">' +
        (isLast ? (window.NOVA_SP_REVIEW_MODE ? "Kontrolü Bitir" : "Sonuçları Gör") : "Sonraki Soru") +
        "</button>";
    }

    expl.innerHTML =
      '<div class="explanation-card ' +
      (isCorrect ? "is-correct" : "is-wrong") +
      '">' +
      '<div class="explanation-head">' +
      '<div class="explanation-title">Sonuç</div>' +
      '<div class="explanation-status">' +
      (isCorrect ? "✅ Doğru" : "❌ Yanlış") +
      "</div></div>" +
      '<div class="explanation-answers">' +
      (chosenRaw
        ? '<div class="explanation-answer explanation-answer--chosen">' +
          '<span class="explanation-k">Senin cevabın</span>' +
          '<div class="explanation-v">' +
          novaMarkupHtml(chosenRaw, true) +
          "</div></div>"
        : "") +
      '<div class="explanation-answer explanation-answer--correct">' +
      '<span class="explanation-k">Doğru cevap</span>' +
      '<div class="explanation-v">' +
      novaMarkupHtml(correctText, true) +
      "</div></div></div>" +
      (noteText
        ? '<div class="explanation-note">' +
          '<span class="explanation-note__label">Açıklama</span>' +
          '<div class="explanation-note__body">' +
          novaMarkupHtml(noteText, true) +
          "</div></div>"
        : "") +
      footerHtml +
      "</div>";

    expl.style.display = "block";

    try {
      if (
        window.NovaQuestionMarkup &&
        window.NovaQuestionMarkup.initBunnyVideos
      ) {
        window.NovaQuestionMarkup.initBunnyVideos(expl);
      }
      if (
        window.NovaCisim3DViewer &&
        typeof window.NovaCisim3DViewer.mountAll === "function"
      ) {
        window.NovaCisim3DViewer.mountAll(expl);
      }
    } catch (_) {}

    if (wrongReviewActive && wrongReviewItems.length) {
      var prevBtn = document.getElementById("wrong-review-prev");
      var nextBtn = document.getElementById("wrong-review-next");
      var exitBtn = document.getElementById("wrong-review-exit");
      if (prevBtn) {
        prevBtn.onclick = function () {
          if (wrongReviewPos <= 0) return;
          expl.style.display = "none";
          expl.innerHTML = "";
          if (typeof window.novaShowWrongReviewAt === "function") {
            window.novaShowWrongReviewAt(wrongReviewPos - 1);
          }
        };
      }
      if (nextBtn) {
        nextBtn.onclick = function () {
          if (wrongReviewPos >= wrongReviewItems.length - 1) return;
          expl.style.display = "none";
          expl.innerHTML = "";
          if (typeof window.novaShowWrongReviewAt === "function") {
            window.novaShowWrongReviewAt(wrongReviewPos + 1);
          }
        };
      }
      if (exitBtn) {
        exitBtn.onclick = function () {
          if (typeof window.novaReturnToSpResultScreen === "function") {
            window.novaReturnToSpResultScreen();
          }
        };
      }
      return;
    }

    const nxt = document.getElementById("next-question-button");
    if (nxt) {
      nxt.onclick = function () {
        try {
          nxt.disabled = true;
        } catch (_) {}
        expl.style.display = "none";
        expl.innerHTML = "";
        try {
          if (isLast) {
            if (typeof window.endGame === "function") window.endGame();
            else if (typeof endGame === "function") endGame();
            return;
          }
          proceedToNextQuestion();
        } catch (e) {
          console.error("showExplanationAndNext next", e);
          try {
            if (isLast && typeof window.endGame === "function") window.endGame();
            else proceedToNextQuestion();
          } catch (_) {}
        }
      };
    }
  } catch (e) {
    console.error("showExplanationAndNext error", e);
    try {
      const isLast =
        Array.isArray(gameQuestions) &&
        currentQuestionIndex >= gameQuestions.length - 1;
      if (isLast && typeof window.endGame === "function") window.endGame();
      else proceedToNextQuestion();
    } catch (_) {}
  }
}

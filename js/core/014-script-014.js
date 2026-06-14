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
    const isLast =
      Array.isArray(gameQuestions) &&
      currentQuestionIndex >= gameQuestions.length - 1;
    const correctText =
      currentQuestion && currentQuestion.correct
        ? String(currentQuestion.correct)
        : "";
    const noteText = getExplanationOnly(currentQuestion);
    const chosenBtn = document.querySelector(".option-button.option-chosen");
    const chosenRaw = chosenBtn
      ? String(
          chosenBtn.getAttribute("data-opt-text") ||
            chosenBtn.innerText ||
            chosenBtn.textContent ||
            ""
        ).trim()
      : "";
    const isCorrect = chosenBtn
      ? chosenBtn.classList.contains("correct")
      : false;

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
      '<button type="button" id="next-question-button" class="next-question-button">' +
      (isLast ? (window.NOVA_SP_REVIEW_MODE ? "Kontrolü Bitir" : "Sonuçları Gör") : "Sonraki Soru") +
      "</button></div>";

    expl.style.display = "block";

    try {
      if (
        window.NovaQuestionMarkup &&
        window.NovaQuestionMarkup.initBunnyVideos
      ) {
        window.NovaQuestionMarkup.initBunnyVideos(expl);
      }
    } catch (_) {}

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

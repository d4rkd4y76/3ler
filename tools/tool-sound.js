/**
 * DÜELLOMATİK — ortak seslendirme (Türkçe)
 * Kullanım: ToolSound.bind("toggle-sound"); ToolSound.speak("metin");
 */
(function (global) {
  let enabled = false;

  function speak(text) {
    if (!enabled || !text || !global.speechSynthesis) return;
    try {
      global.speechSynthesis.cancel();
      const u = new global.SpeechSynthesisUtterance(String(text));
      u.lang = "tr-TR";
      u.rate = 0.92;
      global.speechSynthesis.speak(u);
    } catch (_) {}
  }

  function bind(buttonId) {
    const btn = global.document.getElementById(buttonId || "toggle-sound");
    if (!btn) return { speak, isOn: () => enabled };
    btn.addEventListener("click", () => {
      enabled = !enabled;
      btn.setAttribute("aria-pressed", enabled ? "true" : "false");
      if (enabled) speak("Ses açık");
      else if (global.speechSynthesis) global.speechSynthesis.cancel();
    });
    return { speak, isOn: () => enabled };
  }

  global.ToolSound = { bind, speak, isOn: () => enabled };
})(typeof window !== "undefined" ? window : globalThis);

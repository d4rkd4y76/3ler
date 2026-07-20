const canvas = document.getElementById("matter-canvas");
const ctx = canvas.getContext("2d");
const tempSlider = document.getElementById("temp-slider");
const tempValue = document.getElementById("temp-value");
const phaseButtons = Array.from(document.querySelectorAll(".phase-btn"));
const eventButtons = Array.from(document.querySelectorAll(".event-btn"));
const styleButtons = Array.from(document.querySelectorAll(".style-btn"));
const eventPanel = document.querySelector(".event-panel");
const eventToggleBtn = document.getElementById("event-toggle-btn");
const eventDrawer = document.getElementById("event-drawer");
const stylePanel = document.querySelector(".style-panel");
const styleToggleBtn = document.getElementById("style-toggle-btn");
const styleDrawer = document.getElementById("style-drawer");
const phaseDesc = document.getElementById("phase-desc");
const eventDesc = document.getElementById("event-desc");
const orderText = document.getElementById("order-text");
const motionText = document.getElementById("motion-text");
const sampleText = document.getElementById("sample-text");
const quizText = document.getElementById("quiz-text");
const pointInfo = document.getElementById("point-info");
const autoAlert = document.getElementById("auto-alert");
const phasePill = document.getElementById("phase-pill");
const energyPill = document.getElementById("energy-pill");
const backBtn = document.getElementById("back-btn");
if (window.ToolSound) window.ToolSound.bind("toggle-sound");

const PHASE_INFO = {
  solid: {
    title: "Katı",
    desc: "Katıda tanecikler çok yakın durur. Birbirine sıkı tutunur ve sadece titreşir.",
    order: "Tanecikler düzenli sıra halinde ve çok yakındır.",
    motion: "Yer değiştirmezler, sadece bulundukları noktada titreşirler.",
    sample: "Buz küpü, taş, metal kaşık",
    quiz: "Sence buz neden kendi şeklini koruyabiliyor?"
  },
  liquid: {
    title: "Sıvı",
    desc: "Sıvıda tanecikler yakın ama daha özgürdür. Birbirinin üzerinden kayarak akar.",
    order: "Tanecikler birbirine yakındır ancak düzen tam değildir.",
    motion: "Akışkan hareket ederler ve kabın şeklini alırlar.",
    sample: "Su, süt, meyve suyu",
    quiz: "Neden suyu farklı bardaklara koyunca şekli değişiyor?"
  },
  gas: {
    title: "Gaz",
    desc: "Gazda tanecikler çok uzaktadır ve çok hızlı hareket eder.",
    order: "Tanecikler arasında büyük boşluklar vardır.",
    motion: "Her yöne hızlıca yayılırlar.",
    sample: "Su buharı, hava, parfüm kokusu",
    quiz: "Parfüm kokusu odada neden hızlı yayılır?"
  }
};

const EVENT_INFO = {
  melt: { text: "Erime: Buz ısı alınca sıvı suya dönüşür.", phase: "liquid", temp: 2 },
  freeze: { text: "Donma: Su ısı kaybedince katı buz olur.", phase: "solid", temp: -3 },
  evaporate: { text: "Kaynama/Buharlaşma: Su 100°C civarında hızla gaza dönüşür.", phase: "gas", temp: 100 },
  condense: { text: "Yoğunlaşma: Gaz soğuyunca küçük su damlacıkları oluşur.", phase: "liquid", temp: 40 }
};

const state = {
  phase: "liquid",
  temp: 25,
  style: "pro",
  particles: [],
  transition: 1,
  eventText: "İpucu: Hal değişimi düğmelerine bas ve sıcaklığı değiştir.",
  lessonEffect: null,
  freezeShown: false,
  boilShown: false,
  alertMeta: null
};

function resizeCanvas() {
  const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const w = Math.max(320, Math.floor(canvas.clientWidth * ratio));
  const h = Math.max(220, Math.floor(canvas.clientHeight * ratio));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    buildParticles();
  }
}

function buildParticles() {
  const count = Math.max(64, Math.min(120, Math.floor(canvas.width / 11)));
  state.particles = [];
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x: canvas.width * (0.2 + Math.random() * 0.6),
      y: canvas.height * (0.2 + Math.random() * 0.62),
      tx: 0,
      ty: 0,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: Math.max(2.2, Math.min(5, canvas.width * 0.004)),
      seed: Math.random() * 1000
    });
  }
  assignTargets();
}

function showToast(text, durationMs = 3000) {
  if (!pointInfo) return;
  pointInfo.textContent = text;
  pointInfo.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => pointInfo.classList.remove("show"), durationMs);
}

function showAutoAlert(text, opts = {}) {
  if (!autoAlert) return;
  const meta = {
    min: opts.min ?? null,
    max: opts.max ?? null,
    until: performance.now() + (opts.durationMs ?? 3600)
  };
  state.alertMeta = meta;
  autoAlert.textContent = text;
  autoAlert.classList.add("show");
}

function hideAutoAlert() {
  if (!autoAlert) return;
  autoAlert.classList.remove("show");
  autoAlert.textContent = "";
  state.alertMeta = null;
}

function refreshAutoAlertByTemp() {
  if (!state.alertMeta) return;
  const now = performance.now();
  const expired = now > state.alertMeta.until;
  const below = state.alertMeta.min !== null && state.temp < state.alertMeta.min;
  const above = state.alertMeta.max !== null && state.temp > state.alertMeta.max;
  if (expired || below || above) hideAutoAlert();
}

function updatePills() {
  const p = PHASE_INFO[state.phase];
  if (phasePill) phasePill.textContent = `Hal: ${p.title}`;
  let energy = "Düşük";
  if (state.temp >= 80) energy = "Çok yüksek";
  else if (state.temp >= 30) energy = "Orta";
  if (state.temp < 0) energy = "Çok düşük";
  if (energyPill) energyPill.textContent = `Enerji: ${energy}`;
}

function setPhase(phase, fromEvent = false) {
  if (state.phase !== phase) state.transition = 0;
  state.phase = phase;
  assignTargets();
  phaseButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.phase === phase));
  const info = PHASE_INFO[phase];
  phaseDesc.textContent = info.desc;
  orderText.textContent = info.order;
  motionText.textContent = info.motion;
  sampleText.textContent = info.sample;
  if (quizText) quizText.textContent = info.quiz;
  if (!fromEvent) state.eventText = "İpucu: Hal değişimi düğmelerine bas ve sıcaklığı değiştir.";
  eventDesc.textContent = state.eventText;
  updatePills();
  if (window.ToolSound) window.ToolSound.speak(`${info.title}. ${info.desc}`);
}

function assignTargets() {
  const w = canvas.width;
  const h = canvas.height;
  const left = w * 0.15;
  const right = w * 0.85;
  const top = h * 0.12;
  const bottom = h * 0.88;
  const cols = Math.max(8, Math.floor(Math.sqrt(state.particles.length)));
  const cellW = ((right - left) * 0.84) / cols;
  const cellH = ((bottom - top) * 0.5) / cols;
  const startX = left + (right - left) * 0.08;
  const startY = top + (bottom - top) * 0.3;

  state.particles.forEach((p, i) => {
    if (state.phase === "solid") {
      const c = i % cols;
      const r = Math.floor(i / cols);
      p.tx = startX + c * cellW;
      p.ty = startY + r * cellH;
    } else if (state.phase === "liquid") {
      p.tx = left + Math.random() * (right - left);
      p.ty = h * 0.54 + Math.random() * h * 0.3;
    } else {
      p.tx = left + Math.random() * (right - left);
      p.ty = top + Math.random() * (bottom - top);
    }
  });
}

function drawContainer() {
  const w = canvas.width;
  const h = canvas.height;
  const x = w * 0.13;
  const y = h * 0.07;
  const cw = w * 0.74;
  const ch = h * 0.86;

  const glass = ctx.createLinearGradient(x, y, x + cw, y + ch);
  glass.addColorStop(0, "rgba(255,255,255,0.22)");
  glass.addColorStop(1, "rgba(255,255,255,0.05)");
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.roundRect(x, y, cw, ch, Math.min(30, w * 0.04));
  ctx.fill();

  ctx.strokeStyle = state.style === "neon" ? "rgba(45,212,191,0.6)" : "rgba(30,64,175,0.34)";
  ctx.lineWidth = Math.max(2, w * 0.0035);
  ctx.stroke();
}

function applyLessonEffect(t) {
  if (!state.lessonEffect) return;
  const age = t - state.lessonEffect.start;
  if (age > 3200) {
    state.lessonEffect = null;
    return;
  }
  const p = age / 3200;
  const w = canvas.width;
  const h = canvas.height;
  if (state.lessonEffect.type === "freeze") {
    ctx.strokeStyle = `rgba(147,197,253,${0.4 * (1 - p)})`;
    for (let i = 0; i < 18; i += 1) {
      const xx = (i / 18) * w;
      ctx.beginPath();
      ctx.moveTo(xx, h * 0.58);
      ctx.lineTo(xx + Math.sin(i + p * 8) * 20, h * 0.22);
      ctx.stroke();
    }
  } else if (state.lessonEffect.type === "evaporate") {
    ctx.strokeStyle = `rgba(191,219,254,${0.4 * (1 - p)})`;
    for (let i = 0; i < 8; i += 1) {
      const xx = w * (0.24 + i * 0.08);
      ctx.beginPath();
      ctx.moveTo(xx, h * 0.6);
      ctx.bezierCurveTo(xx - 8, h * 0.44, xx + 10, h * 0.3, xx + Math.sin(i + p * 9) * 12, h * 0.15);
      ctx.stroke();
    }
  } else if (state.lessonEffect.type === "melt") {
    ctx.fillStyle = `rgba(59,130,246,${0.18 * (1 - p)})`;
    ctx.fillRect(0, h * (0.48 + p * 0.14), w, h);
  } else if (state.lessonEffect.type === "condense") {
    ctx.fillStyle = `rgba(125,211,252,${0.45 * (1 - p)})`;
    for (let i = 0; i < 24; i += 1) {
      const xx = w * 0.18 + ((i * 37) % (w * 0.64));
      const yy = h * 0.15 + ((i * 17) % (h * 0.26)) + p * 34;
      ctx.beginPath();
      ctx.arc(xx, yy, 2 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function animateParticles(t) {
  const heatFactor = (state.temp + 20) / 140;
  const speed = 0.6 + heatFactor * 2.6;
  state.transition = Math.min(1, state.transition + 0.02);

  const left = canvas.width * 0.16;
  const right = canvas.width * 0.84;
  const top = canvas.height * 0.11;
  const bottom = canvas.height * 0.88;

  state.particles.forEach((p, i) => {
    const pull = state.phase === "solid" ? 0.26 : state.phase === "liquid" ? 0.11 : 0.045;
    p.x += (p.tx - p.x) * pull * state.transition;
    p.y += (p.ty - p.y) * pull * state.transition;

    if (state.phase === "solid") {
      const amp = 0.18 + speed * 0.12;
      p.vx = Math.sin(t * 0.003 + p.seed) * amp;
      p.vy = Math.cos(t * 0.0032 + p.seed) * amp;
    } else if (state.phase === "liquid") {
      p.vx += Math.sin((t * 0.0018) + i) * 0.025;
      p.vy += Math.cos((t * 0.0014) + i) * 0.018;
      p.vx *= 0.95;
      p.vy *= 0.95;
    } else {
      p.vx += (Math.random() - 0.5) * 0.55;
      p.vy += (Math.random() - 0.5) * 0.55;
      p.vx = Math.max(-3.6, Math.min(3.6, p.vx));
      p.vy = Math.max(-3.6, Math.min(3.6, p.vy));
    }

    p.x += p.vx * speed * 0.38;
    p.y += p.vy * speed * (state.phase === "liquid" ? 0.24 : 0.34);
    if (p.x < left || p.x > right) p.vx *= -1;
    if (p.y < top || p.y > bottom) p.vy *= -1;
    p.x = Math.max(left, Math.min(right, p.x));
    p.y = Math.max(top, Math.min(bottom, p.y));
  });
}

function drawBackground(t) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (state.style === "neon") {
    grad.addColorStop(0, "#0b1731");
    grad.addColorStop(1, "#0f2c53");
  } else if (state.style === "comic") {
    grad.addColorStop(0, "#fff5cf");
    grad.addColorStop(1, "#ffe6ad");
  } else {
    grad.addColorStop(0, "#f8fbff");
    grad.addColorStop(1, "#e9f4ff");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state.phase === "liquid") {
    const ly = canvas.height * 0.52;
    ctx.fillStyle = "rgba(59,130,246,0.16)";
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.14, canvas.height * 0.9);
    ctx.lineTo(canvas.width * 0.14, ly + Math.sin(t * 0.0024) * 6);
    for (let x = canvas.width * 0.14; x <= canvas.width * 0.86; x += 9) {
      const y = ly + Math.sin(x * 0.035 + t * 0.0032) * 4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width * 0.86, canvas.height * 0.9);
    ctx.closePath();
    ctx.fill();
  }

  if (state.phase === "gas" || state.temp > 80) {
    ctx.strokeStyle = state.style === "neon" ? "rgba(148,163,184,0.3)" : "rgba(71,85,105,0.18)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 7; i += 1) {
      const x = canvas.width * (0.25 + i * 0.08);
      ctx.beginPath();
      ctx.moveTo(x, canvas.height * 0.58);
      ctx.bezierCurveTo(x - 9, canvas.height * 0.47, x + 9, canvas.height * 0.35, x + Math.sin((t * 0.002) + i) * 10, canvas.height * 0.2);
      ctx.stroke();
    }
  }
}

function drawSolidLinks() {
  if (state.phase !== "solid") return;
  ctx.strokeStyle = state.style === "neon" ? "rgba(34,211,238,0.34)" : "rgba(59,130,246,0.22)";
  ctx.lineWidth = 1;
  for (let i = 0; i < state.particles.length; i += 1) {
    const a = state.particles[i];
    for (let j = i + 1; j < state.particles.length; j += 1) {
      const b = state.particles[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 34) {
        ctx.globalAlpha = (1 - d / 34) * 0.65;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}

function drawParticles() {
  state.particles.forEach((p) => {
    const glow = ctx.createRadialGradient(p.x, p.y, 0.5, p.x, p.y, p.r * 2.8);
    if (state.style === "neon") {
      glow.addColorStop(0, "rgba(34,211,238,0.95)");
      glow.addColorStop(1, "rgba(168,85,247,0)");
      ctx.fillStyle = "#22d3ee";
    } else if (state.style === "comic") {
      glow.addColorStop(0, "rgba(251,146,60,0.92)");
      glow.addColorStop(1, "rgba(251,146,60,0)");
      ctx.fillStyle = "#ea580c";
    } else {
      glow.addColorStop(0, "rgba(59,130,246,0.9)");
      glow.addColorStop(1, "rgba(6,182,212,0)");
      ctx.fillStyle = "#2563eb";
    }
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.fillStyle = state.style === "comic" ? "#f97316" : state.style === "neon" ? "#22d3ee" : "#2f58d9";
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    if (state.style === "comic") {
      ctx.strokeStyle = "rgba(15,23,42,0.65)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
}

function drawScene(t) {
  drawBackground(t);
  drawContainer();
  drawSolidLinks();
  applyLessonEffect(t);
  drawParticles();
}

function updatePhaseFromTemp() {
  let next = "solid";
  if (state.temp >= 100) next = "gas";
  else if (state.temp >= 0) next = "liquid";
  setPhase(next, false);

  if (Math.abs(state.temp) <= 1 && !state.freezeShown) {
    state.freezeShown = true;
    showToast("0°C kritik eşik: donma ve erime görülebilir.");
    showAutoAlert("0°C civarı: donma-erime gözlenir.", { min: -5, max: 6, durationMs: 5000 });
  }
  if (Math.abs(state.temp) > 1) state.freezeShown = false;

  if (Math.abs(state.temp - 100) <= 1 && !state.boilShown) {
    state.boilShown = true;
    showToast("100°C kritik eşik: kaynama başlar.");
    showAutoAlert("100°C civarı: su hızla buhara dönüşür.", { min: 95, max: 120, durationMs: 5000 });
  }
  if (Math.abs(state.temp - 100) > 1) state.boilShown = false;
}

function frame(t) {
  resizeCanvas();
  animateParticles(t);
  drawScene(t);
  refreshAutoAlertByTemp();
  requestAnimationFrame(frame);
}

tempSlider.addEventListener("input", () => {
  state.temp = Number(tempSlider.value || 0);
  tempValue.textContent = `${state.temp}°C`;
  updatePhaseFromTemp();
});

phaseButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setPhase(btn.dataset.phase, false);
    showToast(`${PHASE_INFO[btn.dataset.phase].title} hali inceleniyor.`);
  });
});

eventButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const meta = EVENT_INFO[btn.dataset.event];
    if (!meta) return;
    state.temp = meta.temp;
    tempSlider.value = String(meta.temp);
    tempValue.textContent = `${meta.temp}°C`;
    state.eventText = meta.text;
    eventDesc.textContent = meta.text;
    state.lessonEffect = { type: btn.dataset.event, start: performance.now() };
    setPhase(meta.phase, true);
    showAutoAlert(meta.text, { durationMs: 4500, min: meta.temp - 20, max: meta.temp + 20 });
    if (typeof gsap !== "undefined") {
      gsap.fromTo(canvas, { scale: 0.985, filter: "brightness(1.1)" }, { scale: 1, filter: "brightness(1)", duration: 0.38, ease: "power2.out" });
      gsap.fromTo(eventDesc, { y: -6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: "power2.out" });
    }
  });
});

styleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const style = btn.dataset.style || "pro";
    state.style = style;
    document.body.setAttribute("data-style", style);
    styleButtons.forEach((b) => b.classList.toggle("active", b === btn));
    if (typeof gsap !== "undefined") {
      gsap.fromTo(canvas, { opacity: 0.9, scale: 0.99 }, { opacity: 1, scale: 1, duration: 0.24, ease: "power1.out" });
    }
  });
});

if (styleToggleBtn && stylePanel && styleDrawer) {
  styleToggleBtn.addEventListener("click", () => {
    const open = !stylePanel.classList.contains("is-open");
    stylePanel.classList.toggle("is-open", open);
    styleToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    styleDrawer.setAttribute("aria-hidden", open ? "false" : "true");
  });
}

if (eventToggleBtn && eventPanel && eventDrawer) {
  eventToggleBtn.addEventListener("click", () => {
    const open = !eventPanel.classList.contains("is-open");
    eventPanel.classList.toggle("is-open", open);
    eventToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    eventDrawer.setAttribute("aria-hidden", open ? "false" : "true");
  });
}

backBtn.addEventListener("click", () => {
  window.location.href = "../../index.html";
});

document.body.setAttribute("data-style", "pro");
setPhase("liquid");
buildParticles();
updatePhaseFromTemp();
requestAnimationFrame(frame);

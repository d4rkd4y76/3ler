const canvas = document.getElementById("matter-canvas");
const ctx = canvas.getContext("2d");

const tempSlider = document.getElementById("temp-slider");
const tempValue = document.getElementById("temp-value");
const phaseButtons = Array.from(document.querySelectorAll(".phase-btn"));
const eventButtons = Array.from(document.querySelectorAll(".event-btn"));
const eventPanel = document.querySelector(".event-panel");
const eventToggleBtn = document.getElementById("event-toggle-btn");
const eventDrawer = document.getElementById("event-drawer");
const styleButtons = Array.from(document.querySelectorAll(".style-btn"));
const stylePanel = document.querySelector(".style-panel");
const styleToggleBtn = document.getElementById("style-toggle-btn");
const styleDrawer = document.getElementById("style-drawer");
const phaseDesc = document.getElementById("phase-desc");
const eventDesc = document.getElementById("event-desc");
const orderText = document.getElementById("order-text");
const motionText = document.getElementById("motion-text");
const sampleText = document.getElementById("sample-text");
const pointInfo = document.getElementById("point-info");
const backBtn = document.getElementById("back-btn");

const PHASE_INFO = {
  solid: {
    desc: "Su katı halde buz olur. Tanecikler düzenli dizilir ve yerinde titreşir.",
    order: "Tanecikler çok yakındır ve düzenli sıra halindedir.",
    motion: "Çok az hareket ederler; yer değiştirmezler.",
    sample: "Buz küpü, dondurulmuş su"
  },
  liquid: {
    desc: "Su sıvı halde akar. Tanecikler yakın ama kayarak hareket eder.",
    order: "Tanecikler düzensizdir; aralarında küçük boşluklar vardır.",
    motion: "Birbirlerinin üzerinden kayabilirler.",
    sample: "Bardaktaki su, yağmur damlası"
  },
  gas: {
    desc: "Su gaz halde buhar olur. Tanecikler uzak ve çok hızlıdır.",
    order: "Tanecikler arasında büyük boşluklar vardır.",
    motion: "Her yöne hızlı hareket ederler.",
    sample: "Çaydanlıktan çıkan buhar"
  }
};

const EVENT_INFO = {
  melt: {
    text: "Erime: Buz 0°C'de çözülmeye başlar ve suya döner.",
    phase: "liquid",
    temp: 0
  },
  freeze: {
    text: "Donma: Su 0°C'de buz olmaya başlar.",
    phase: "solid",
    temp: 0
  },
  evaporate: {
    text: "Buharlaşma/Kaynama: Su 100°C'de hızla buhara dönüşür.",
    phase: "gas",
    temp: 100
  },
  condense: {
    text: "Yoğunlaşma: Buhar soğuk yüzeyde damlacıklara dönüşür.",
    phase: "liquid",
    temp: 40
  }
};

const state = {
  phase: "liquid",
  temp: 25,
  style: "pro",
  particles: [],
  transition: 1,
  eventText: "İpucu: Erime, donma, buharlaşma ve yoğunlaşmaya tıklayıp izle.",
  lessonEffect: null,
  shownAt: { freeze: false, boil: false }
};

function resizeCanvas() {
  const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const w = Math.max(320, Math.floor(canvas.clientWidth * ratio));
  const h = Math.max(190, Math.floor(canvas.clientHeight * ratio));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    buildParticles();
  }
}

function buildParticles() {
  const count = 72;
  state.particles = [];
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x: canvas.width * 0.2 + Math.random() * canvas.width * 0.6,
      y: canvas.height * 0.2 + Math.random() * canvas.height * 0.6,
      vx: 0,
      vy: 0,
      tx: 0,
      ty: 0,
      radius: Math.max(3.2, Math.min(8.5, canvas.width * 0.0085)),
      seed: Math.random() * 1000
    });
  }
  assignTargets();
}

function setPointInfo(text) {
  if (!pointInfo) return;
  pointInfo.textContent = text;
  pointInfo.classList.add("show");
  if (typeof gsap !== "undefined") {
    gsap.fromTo(pointInfo, { y: -6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22 });
  }
  clearTimeout(setPointInfo._t);
  setPointInfo._t = setTimeout(() => pointInfo.classList.remove("show"), 2600);
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
  if (!fromEvent) {
    state.eventText = "İpucu: Erime, donma, buharlaşma ve yoğunlaşmaya tıklayıp izle.";
  }
  eventDesc.textContent = state.eventText;
}

function assignTargets() {
  const w = canvas.width;
  const h = canvas.height;
  const cols = 9;
  const cellW = w * 0.052;
  const cellH = h * 0.064;
  const startX = w * 0.23;
  const startY = h * 0.22;
  const liquidTop = h * 0.5;

  state.particles.forEach((p, i) => {
    if (state.phase === "solid") {
      const c = i % cols;
      const r = Math.floor(i / cols);
      p.tx = startX + c * cellW;
      p.ty = startY + r * cellH;
    } else if (state.phase === "liquid") {
      p.tx = w * 0.2 + Math.random() * w * 0.6;
      p.ty = liquidTop + Math.random() * h * 0.32;
    } else {
      p.tx = w * 0.16 + Math.random() * w * 0.68;
      p.ty = h * 0.12 + Math.random() * h * 0.75;
    }
  });
}

function updatePhaseFromTemp() {
  let next = "solid";
  if (state.temp >= 100) next = "gas";
  else if (state.temp >= 0) next = "liquid";
  setPhase(next);

  if (state.temp === 0 && !state.shownAt.freeze) {
    setPointInfo("0°C: Kritik nokta! Su donabilir, buz eriyebilir.");
    state.shownAt.freeze = true;
  }
  if (state.temp !== 0) state.shownAt.freeze = false;

  if (state.temp === 100 && !state.shownAt.boil) {
    setPointInfo("100°C: Su kaynar ve buhar artar.");
    state.shownAt.boil = true;
  }
  if (state.temp !== 100) state.shownAt.boil = false;
}

function drawJar() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.strokeStyle = state.style === "neon" ? "rgba(34,211,238,0.62)" : "rgba(45,84,145,0.45)";
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.beginPath();
  ctx.roundRect(w * 0.13, h * 0.07, w * 0.74, h * 0.86, 18);
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
  if (state.lessonEffect.type === "melt") {
    ctx.fillStyle = `rgba(56,189,248,${0.1 + 0.15 * (1 - p)})`;
    ctx.fillRect(0, canvas.height * (0.42 + p * 0.12), canvas.width, canvas.height * 0.6);
  } else if (state.lessonEffect.type === "freeze") {
    ctx.strokeStyle = `rgba(147,197,253,${0.35 * (1 - p)})`;
    for (let i = 0; i < 18; i += 1) {
      const x = (i / 18) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, canvas.height * 0.55);
      ctx.lineTo(x + Math.sin(i * 1.8 + p * 7) * 18, canvas.height * 0.24);
      ctx.stroke();
    }
  } else if (state.lessonEffect.type === "evaporate") {
    ctx.strokeStyle = `rgba(191,219,254,${0.4 * (1 - p)})`;
    for (let i = 0; i < 9; i += 1) {
      const x = canvas.width * 0.24 + i * canvas.width * 0.06;
      ctx.beginPath();
      ctx.moveTo(x, canvas.height * 0.58);
      ctx.bezierCurveTo(x - 8, canvas.height * 0.45, x + 10, canvas.height * 0.3, x + Math.sin(i + p * 9) * 14, canvas.height * (0.16 + p * 0.12));
      ctx.stroke();
    }
  } else if (state.lessonEffect.type === "condense") {
    ctx.fillStyle = `rgba(125,211,252,${0.55 * (1 - p)})`;
    for (let i = 0; i < 26; i += 1) {
      const x = canvas.width * 0.18 + ((i * 37) % (canvas.width * 0.64));
      const y = canvas.height * 0.16 + ((i * 19) % (canvas.height * 0.28)) + p * 36;
      ctx.beginPath();
      ctx.arc(x, y, 2.2 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function animateParticles(t) {
  const speed = 0.28 + ((state.temp + 20) / 140) * 2.4;
  state.transition = Math.min(1, state.transition + 0.017);

  state.particles.forEach((p, i) => {
    const pull = state.phase === "solid" ? 0.24 : state.phase === "liquid" ? 0.1 : 0.05;
    p.x += (p.tx - p.x) * pull * state.transition;
    p.y += (p.ty - p.y) * pull * state.transition;

    if (state.phase === "solid") {
      const j = 0.52 + speed * 0.35;
      p.vx = Math.sin(t * 0.002 + p.seed) * j * 0.06;
      p.vy = Math.cos(t * 0.0024 + p.seed) * j * 0.06;
    } else if (state.phase === "liquid") {
      p.vx += Math.sin(t * 0.0015 + i) * 0.018;
      p.vy += Math.cos(t * 0.0013 + i) * 0.012;
      p.vx *= 0.96;
      p.vy *= 0.96;
    } else {
      p.vx += (Math.random() - 0.5) * 0.56;
      p.vy += (Math.random() - 0.5) * 0.56;
      p.vx = Math.max(-3.1, Math.min(3.1, p.vx));
      p.vy = Math.max(-3.1, Math.min(3.1, p.vy));
    }

    p.x += p.vx * speed;
    p.y += p.vy * speed * (state.phase === "liquid" ? 0.72 : 1);

    const left = canvas.width * 0.16;
    const right = canvas.width * 0.84;
    const top = canvas.height * 0.11;
    const bottom = canvas.height * 0.88;
    if (p.x < left || p.x > right) p.vx *= -1;
    if (p.y < top || p.y > bottom) p.vy *= -1;
    p.x = Math.max(left, Math.min(right, p.x));
    p.y = Math.max(top, Math.min(bottom, p.y));
  });
}

function drawScene(t) {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (state.style === "neon") {
    grad.addColorStop(0, "#0a1530");
    grad.addColorStop(1, "#10284d");
  } else if (state.style === "comic") {
    grad.addColorStop(0, "#fff7d6");
    grad.addColorStop(1, "#ffe9b8");
  } else {
    grad.addColorStop(0, "#f8fbff");
    grad.addColorStop(1, "#e8f2ff");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawJar();

  if (state.phase === "liquid") {
    const ly = canvas.height * 0.5;
    ctx.fillStyle = "rgba(79,124,255,0.11)";
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.14, canvas.height * 0.9);
    ctx.lineTo(canvas.width * 0.14, ly + Math.sin(t * 0.002) * 4);
    for (let x = canvas.width * 0.14; x <= canvas.width * 0.86; x += 8) {
      const y = ly + Math.sin(x * 0.04 + t * 0.003) * 3;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width * 0.86, canvas.height * 0.9);
    ctx.closePath();
    ctx.fill();
  }

  if (state.phase === "solid") {
    ctx.strokeStyle = state.style === "neon" ? "rgba(34,211,238,0.3)" : "rgba(60,98,178,0.2)";
    ctx.lineWidth = 1;
    for (let i = 0; i < state.particles.length; i += 1) {
      const a = state.particles[i];
      for (let j = i + 1; j < state.particles.length; j += 1) {
        const b = state.particles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 38) {
          ctx.globalAlpha = (1 - d / 38) * 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  if (state.phase === "gas") {
    ctx.strokeStyle = state.style === "neon" ? "rgba(45,212,191,0.22)" : "rgba(36,84,145,0.16)";
    ctx.lineWidth = 1;
    state.particles.forEach((p) => {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 5, p.y - p.vy * 5);
      ctx.stroke();
    });
  }

  if ((state.phase === "liquid" && state.temp >= 70) || (state.lessonEffect && state.lessonEffect.type === "evaporate")) {
    ctx.strokeStyle = state.style === "neon" ? "rgba(186,230,253,0.24)" : "rgba(148,163,184,0.22)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 7; i += 1) {
      const x = canvas.width * (0.24 + i * 0.08);
      ctx.beginPath();
      ctx.moveTo(x, canvas.height * 0.58);
      ctx.bezierCurveTo(
        x - 6,
        canvas.height * 0.5,
        x + 8,
        canvas.height * 0.38,
        x + Math.sin((t * 0.002) + i) * 10,
        canvas.height * 0.26
      );
      ctx.stroke();
    }
  }

  applyLessonEffect(t);

  state.particles.forEach((p) => {
    const glow = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.radius * 2.5);
    if (state.style === "neon") {
      glow.addColorStop(0, "rgba(34,211,238,0.92)");
      glow.addColorStop(1, "rgba(167,139,250,0)");
    } else if (state.style === "comic") {
      glow.addColorStop(0, "rgba(255,145,75,0.88)");
      glow.addColorStop(1, "rgba(255,214,110,0)");
    } else {
      glow.addColorStop(0, "rgba(79,124,255,0.82)");
      glow.addColorStop(1, "rgba(25,195,162,0)");
    }
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (state.style === "neon") ctx.fillStyle = "#22d3ee";
    else if (state.style === "comic") ctx.fillStyle = "#f97316";
    else ctx.fillStyle = "#2f58d9";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();

    if (state.style === "comic") {
      ctx.strokeStyle = "rgba(24,24,24,0.75)";
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
  });
}

function frame(t) {
  resizeCanvas();
  animateParticles(t);
  drawScene(t);
  requestAnimationFrame(frame);
}

tempSlider.addEventListener("input", () => {
  state.temp = Number(tempSlider.value || 0);
  tempValue.textContent = `${state.temp}°C`;
  updatePhaseFromTemp();
});

phaseButtons.forEach((btn) => {
  btn.addEventListener("click", () => setPhase(btn.dataset.phase, false));
});

eventButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const meta = EVENT_INFO[btn.dataset.event];
    if (!meta) return;
    state.temp = meta.temp;
    tempSlider.value = String(meta.temp);
    tempValue.textContent = `${meta.temp}°C`;
    state.eventText = meta.text;
    state.lessonEffect = { type: btn.dataset.event, start: performance.now() };
    if (typeof gsap !== "undefined") {
      gsap.fromTo(canvas, { scale: 0.985, filter: "brightness(1.16)" }, { scale: 1, filter: "brightness(1)", duration: 0.42, ease: "power2.out" });
      gsap.fromTo(eventDesc, { y: -6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32, ease: "power2.out" });
    }
    if (btn.dataset.event === "evaporate") setPointInfo("100°C'de su kaynar ve buhar artar.");
    if (btn.dataset.event === "freeze" || btn.dataset.event === "melt") {
      setPointInfo("0°C: Kritik nokta! Donma ve erime bu sıcaklıkta olur.");
    }
    setPhase(meta.phase, true);
  });
});

styleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const style = btn.dataset.style || "pro";
    state.style = style;
    document.body.setAttribute("data-style", style);
    styleButtons.forEach((b) => b.classList.toggle("active", b === btn));
    if (typeof gsap !== "undefined") {
      gsap.fromTo(canvas, { opacity: 0.9, scale: 0.99 }, { opacity: 1, scale: 1, duration: 0.25, ease: "power1.out" });
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

const $ = (sel) => document.querySelector(sel);

const backBtn = $("#back-btn");
const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
const segButtons = Array.from(document.querySelectorAll(".seg-btn"));

const denomDec = $("#denom-dec");
const denomInc = $("#denom-inc");
const denomOut = $("#denom-out");
const numerRange = $("#numer");
const numerOut = $("#numer-out");
const fracOut = $("#frac-out");

const bigNum = $("#big-num");
const bigDen = $("#big-den");
const bigName = $("#big-name");
const toast = $("#toast");

const modePill = $("#mode-pill");
const scorePill = $("#score-pill");

const taskCard = $("#task-card");
const taskTitle = $("#task-title");
const taskSub = $("#task-sub");
const taskFraction = $("#task-fraction");
const taskMsg = $("#task-msg");
const newTaskBtn = $("#new-task-btn");
const checkBtn = $("#check-btn");
const hintBtn = $("#hint-btn");

const pizzaSvg = $("#pizza-svg");
const barWrap = $("#bar-wrap");
const barEl = $("#bar");

const factFrac = $("#fact-frac");
const factType = $("#fact-type");
const factRead = $("#fact-read");

const state = {
  tab: "learn", // learn | practice
  model: "pizza", // pizza | bar
  denom: 4,
  numer: 1,
  score: 0,
  task: null,
  toastMeta: null
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function trLower(v) {
  return String(v || "").toLocaleLowerCase("tr-TR");
}

function capitalizeTr(s) {
  const v = String(s || "");
  if (!v) return v;
  return v[0].toLocaleUpperCase("tr-TR") + v.slice(1);
}

function numberToTr(n) {
  const m = {
    0: "sıfır",
    1: "bir",
    2: "iki",
    3: "üç",
    4: "dört",
    5: "beş",
    6: "altı",
    7: "yedi",
    8: "sekiz",
    9: "dokuz",
    10: "on",
    11: "on bir",
    12: "on iki"
  };
  return m[n] || String(n);
}

function fractionReadTr(numer, denom) {
  if (denom === 2) return `${numberToTr(numer)} bölü iki`;
  if (denom === 3) return `${numberToTr(numer)} bölü üç`;
  if (denom === 4) return `${numberToTr(numer)} bölü dört`;
  if (denom === 5) return `${numberToTr(numer)} bölü beş`;
  if (denom === 6) return `${numberToTr(numer)} bölü altı`;
  if (denom === 7) return `${numberToTr(numer)} bölü yedi`;
  if (denom === 8) return `${numberToTr(numer)} bölü sekiz`;
  return `${numer}/${denom}`;
}

function fractionReadTrDual(numer, denom) {
  const bolu = fractionReadTr(numer, denom);
  const de = `${numberToTr(denom)}’de ${numberToTr(numer)}`;
  return `${bolu} — ${de}`;
}

function fractionType(numer, denom) {
  if (numer === 0) return "Sıfır kesir";
  if (numer < denom) return "Basit kesir";
  if (numer === denom) return "Bütün (1)";
  return "Bileşik kesir";
}

function showToast(text, opts = {}) {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("show");
  const meta = {
    until: performance.now() + (opts.durationMs ?? 2600)
  };
  state.toastMeta = meta;
  if (typeof gsap !== "undefined") {
    try {
      gsap.fromTo(toast, { y: -4, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, ease: "power2.out" });
    } catch (_) {}
  }
}

function tickToast() {
  if (!state.toastMeta) return;
  if (performance.now() > state.toastMeta.until) {
    toast.classList.remove("show");
    toast.textContent = "";
    state.toastMeta = null;
  }
}

function setScore(delta) {
  state.score = Math.max(0, state.score + delta);
  if (scorePill) scorePill.textContent = `Puan: ${state.score}`;
}

function setTab(tab) {
  state.tab = tab;
  tabButtons.forEach((b) => {
    const active = b.dataset.tab === tab;
    b.classList.toggle("active", active);
    b.setAttribute("aria-selected", active ? "true" : "false");
  });
  try {
    document.body.classList.toggle("is-practice", tab === "practice");
  } catch (_) {}
  if (modePill) {
    const map = { learn: "Öğren", practice: "Uygula" };
    modePill.textContent = `Mod: ${map[tab] || "Öğren"}`;
  }
  syncTaskCard();
  if (tab === "learn") showToast("Önce payda ve pay ile oyna. Sonra görevlere geç.", { durationMs: 2800 });
  if (tab === "practice") showToast("Görevi tamamla: istenen kesri yap!", { durationMs: 2600 });
}

function setModel(model) {
  state.model = model;
  segButtons.forEach((b) => b.classList.toggle("active", b.dataset.model === model));
  const isPizza = model === "pizza";
  // Tekli gösterim: Pizza seçiliyken sadece pizza, Çubuk seçiliyken sadece çubuk.
  if (pizzaSvg) pizzaSvg.hidden = !isPizza;
  if (barWrap) barWrap.hidden = isPizza;
  const visual = $("#visual");
  if (visual) {
    visual.classList.toggle("focus-pizza", isPizza);
    visual.classList.toggle("focus-bar", !isPizza);
  }
  render();
}

function setDenom(next) {
  const v = clamp(Number(next || 0), 2, 8);
  state.denom = v;
  if (denomOut) denomOut.textContent = String(v);
  numerRange.max = String(v);
  if (state.numer > v) state.numer = v;
  numerRange.value = String(state.numer);
  render();
}

function setNumer(next) {
  const v = clamp(Number(next || 0), 0, state.denom);
  state.numer = v;
  numerRange.value = String(v);
  render();
}

function updateFractionTexts() {
  if (numerOut) numerOut.textContent = String(state.numer);
  if (fracOut) fracOut.textContent = String(state.denom);
  if (bigNum) bigNum.textContent = String(state.numer);
  if (bigDen) bigDen.textContent = String(state.denom);

  const read = fractionReadTr(state.numer, state.denom);
  const dual = fractionReadTrDual(state.numer, state.denom);
  if (bigName) bigName.textContent = `“${capitalizeTr(dual)}”`;
  if (factFrac) factFrac.textContent = `${state.numer}/${state.denom}`;
  if (factType) factType.textContent = fractionType(state.numer, state.denom);
  if (factRead) factRead.textContent = capitalizeTr(dual);
}

function polarToXY(r, angRad) {
  return [Math.cos(angRad) * r, Math.sin(angRad) * r];
}

function slicePath(rOuter, rInner, a0, a1) {
  const [x0, y0] = polarToXY(rOuter, a0);
  const [x1, y1] = polarToXY(rOuter, a1);
  const [xi1, yi1] = polarToXY(rInner, a1);
  const [xi0, yi0] = polarToXY(rInner, a0);
  const large = (a1 - a0) > Math.PI ? 1 : 0;
  return [
    `M ${xi0.toFixed(3)} ${yi0.toFixed(3)}`,
    `L ${x0.toFixed(3)} ${y0.toFixed(3)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x1.toFixed(3)} ${y1.toFixed(3)}`,
    `L ${xi1.toFixed(3)} ${yi1.toFixed(3)}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${xi0.toFixed(3)} ${yi0.toFixed(3)}`,
    "Z"
  ].join(" ");
}

function renderPizza() {
  if (!pizzaSvg) return;
  const d = state.denom;
  const n = state.numer;
  const rOuter = 92;
  const rInner = 18;
  const start = -Math.PI / 2;
  const step = (Math.PI * 2) / d;

  const crustGradId = "crustGrad";
  const cheeseGradId = "cheeseGrad";
  const defs = `
    <defs>
      <filter id="cheeseNoise" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="8" result="noise" />
        <feColorMatrix type="matrix" values="
          1 0 0 0 0
          0 1 0 0 0
          0 0 1 0 0
          0 0 0 0.18 0" in="noise" result="n2"/>
        <feBlend in="SourceGraphic" in2="n2" mode="multiply" />
      </filter>
      <radialGradient id="${cheeseGradId}" cx="35%" cy="25%" r="75%">
        <stop offset="0%" stop-color="#fff7d6" />
        <stop offset="60%" stop-color="#ffe08a" />
        <stop offset="100%" stop-color="#fbbf24" />
      </radialGradient>
      <radialGradient id="${crustGradId}" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#ffe8c7" />
        <stop offset="70%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#b45309" />
      </radialGradient>
      <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="rgba(15,23,42,.22)" />
      </filter>
    </defs>
  `;

  const crust = `
    <circle r="${rOuter + 10}" fill="url(#${crustGradId})" opacity="0.95"></circle>
    <circle r="${rOuter}" fill="url(#${cheeseGradId})" filter="url(#softShadow)"></circle>
    <circle r="${rOuter - 2}" fill="rgba(255,255,255,0.08)" filter="url(#cheeseNoise)"></circle>
  `;

  const slices = [];
  for (let i = 0; i < d; i += 1) {
    const a0 = start + i * step;
    const a1 = a0 + step;
    const filled = i < n;
    const fill = filled ? "rgba(37,99,235,0.92)" : "rgba(255,255,255,0.72)";
    const stroke = filled ? "rgba(6,182,212,0.75)" : "rgba(30,64,175,0.15)";
    const path = slicePath(rOuter, rInner, a0, a1);
    slices.push(
      `<path data-i="${i}" d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="1.2" />`
    );
  }

  const cutLines = [];
  for (let i = 0; i < d; i += 1) {
    const ang = start + i * step;
    const [x, y] = polarToXY(rOuter, ang);
    cutLines.push(`<path d="M 0 0 L ${x.toFixed(2)} ${y.toFixed(2)}" stroke="rgba(15,23,42,0.14)" stroke-width="1.3" />`);
  }

  const topping = `
    <defs>
      <radialGradient id="pep" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="rgba(255,210,210,0.9)" />
        <stop offset="50%" stop-color="rgba(239,68,68,0.92)" />
        <stop offset="100%" stop-color="rgba(153,27,27,0.92)" />
      </radialGradient>
      <filter id="topShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="rgba(15,23,42,.22)" />
      </filter>
    </defs>
    <g opacity="0.92" filter="url(#topShadow)">
      <circle cx="-34" cy="-18" r="8" fill="url(#pep)" />
      <circle cx="26" cy="-12" r="7" fill="url(#pep)" />
      <circle cx="12" cy="30" r="8" fill="url(#pep)" />
      <circle cx="-18" cy="32" r="7" fill="url(#pep)" />
      <circle cx="38" cy="22" r="6.5" fill="url(#pep)" />
      <path d="M -6 -42 C -14 -46 -22 -36 -12 -28 C -6 -23 1 -30 -6 -42 Z" fill="rgba(34,197,94,0.75)" />
      <path d="M -10 4 C -18 0 -20 12 -10 14 C -4 16 -2 10 -10 4 Z" fill="rgba(34,197,94,0.7)" />
    </g>
  `;

  pizzaSvg.innerHTML = `${defs}${crust}<g>${slices.join("")}</g><g>${cutLines.join("")}</g>${topping}<circle r="${rInner}" fill="rgba(15,23,42,0.06)" />`;
}

function renderBar() {
  if (!barEl) return;
  const d = state.denom;
  const n = state.numer;
  const parts = [];
  for (let i = 0; i < d; i += 1) {
    const filled = i < n;
    parts.push(
      `<div class="bar-part ${filled ? "filled" : ""}" style="--i:${i};"></div>`
    );
  }
  barEl.innerHTML = parts.join("");

  const css = document.getElementById("bar-style") || document.createElement("style");
  css.id = "bar-style";
  css.textContent = `
    .bar-part{
      position:relative;
      border-right: 1px solid rgba(59,130,246,.18);
      background: linear-gradient(180deg, rgba(255,255,255,.95), rgba(226,232,240,.85));
    }
    .bar-part:last-child{ border-right:0; }
    .bar-part.filled{
      background: linear-gradient(135deg, rgba(37,99,235,.95), rgba(6,182,212,.88));
      box-shadow: inset 0 1px 0 rgba(255,255,255,.28);
    }
    .bar-part.filled::after{
      content:"";
      position:absolute; inset:0;
      background: radial-gradient(120px 60px at 25% 25%, rgba(255,255,255,.22), transparent 55%);
      opacity:.95;
      pointer-events:none;
    }
    .bar-part::before{
      content:"";
      position:absolute;
      left:8%;
      top:10%;
      width:84%;
      height:8px;
      border-radius:999px;
      background: linear-gradient(90deg, rgba(255,255,255,.45), rgba(255,255,255,0));
      opacity:0.55;
      pointer-events:none;
    }
    .bar-part.filled::before{
      opacity:0.85;
      background: linear-gradient(90deg, rgba(255,255,255,.55), rgba(255,255,255,0));
    }
  `;
  document.head.appendChild(css);
}

function syncTaskCard() {
  const show = state.tab === "practice";
  if (taskCard) taskCard.style.display = show ? "block" : "none";
  if (!show) return;
  if (!state.task) newTask();
}

function newTask() {
  const denom = clamp(2 + Math.floor(Math.random() * 7), 2, 8);
  const numer = clamp(1 + Math.floor(Math.random() * (denom - 1)), 1, denom - 1);
  state.task = { denom, numer, tries: 0 };
  if (taskFraction) taskFraction.textContent = `${numer}/${denom}`;
  taskTitle.textContent = "Görev";
  taskSub.textContent = "Aşağıdaki kesri görselde göster.";
  taskMsg.textContent = "";
  taskMsg.className = "task-msg";
  showToast("Hedef kesri yapmak için kaydırıcıları kullan.", { durationMs: 2400 });
}

function checkTask() {
  if (!state.task) return;
  const ok = state.numer === state.task.numer && state.denom === state.task.denom;
  state.task.tries += 1;

  if (ok) {
    taskMsg.textContent = "Süper! Doğru yaptın.";
    taskMsg.className = "task-msg good";
    setScore(6);
    confettiPulse();
    setTimeout(newTask, 650);
    return;
  }

  taskMsg.textContent = "Henüz değil. Tekrar dene!";
  taskMsg.className = "task-msg bad";
  setScore(0);

  if (state.task.tries >= 2) {
    showToast("İpucu alabilirsin: Payda ve payı hedefe yaklaştır.", { durationMs: 2600 });
  }
}

function giveHint() {
  if (!state.task) return;
  const dn = state.task.denom;
  const nu = state.task.numer;
  const parts = [];
  if (state.denom !== dn) parts.push(`Payda ${dn} olmalı.`);
  if (state.numer !== nu) parts.push(`Pay ${nu} olmalı.`);
  if (!parts.length) parts.push("Zaten doğru!");
  showToast(parts.join(" "), { durationMs: 3400 });

  // Soft “magnet” towards the target for kids.
  if (state.tab === "practice") {
    const nextD = state.denom === dn ? dn : (state.denom < dn ? state.denom + 1 : state.denom - 1);
    setDenom(nextD);
    const maxN = Math.min(state.denom, dn);
    const nextN = clamp(state.numer + Math.sign(nu - state.numer), 0, maxN);
    setNumer(nextN);
  }
}

function confettiPulse() {
  if (typeof gsap === "undefined") return;
  const el = document.body;
  try {
    gsap.fromTo(el, { filter: "brightness(1.08)" }, { filter: "brightness(1)", duration: 0.42, ease: "power2.out" });
  } catch (_) {}
}

function render() {
  updateFractionTexts();
  // Her zaman ikisini de güncelle: odak sadece boyutu/konumu değiştirir.
  renderPizza();
  renderBar();

  // Animate only the “filled” highlight quickly for attention.
  if (typeof gsap !== "undefined") {
    try {
      if (state.model === "pizza") {
        const filled = pizzaSvg.querySelectorAll("path[fill^=\"rgba(37,99,235\"]");
        gsap.fromTo(filled, { scale: 0.98, transformOrigin: "0px 0px" }, { scale: 1, duration: 0.25, ease: "power2.out", stagger: 0.01 });
      } else {
        const filled = barEl.querySelectorAll(".bar-part.filled");
        gsap.fromTo(filled, { y: 2, opacity: 0.7 }, { y: 0, opacity: 1, duration: 0.22, ease: "power2.out", stagger: 0.01 });
      }
    } catch (_) {}
  }
}

function bind() {
  backBtn?.addEventListener("click", () => {
    window.location.href = "../../index.html";
  });

  denomDec?.addEventListener("click", () => setDenom(state.denom - 1));
  denomInc?.addEventListener("click", () => setDenom(state.denom + 1));

  numerRange?.addEventListener("input", () => setNumer(Number(numerRange.value || 0)));

  tabButtons.forEach((b) => {
    b.addEventListener("click", () => setTab(b.dataset.tab || "learn"));
  });

  segButtons.forEach((b) => {
    b.addEventListener("click", () => setModel(b.dataset.model || "pizza"));
  });

  newTaskBtn?.addEventListener("click", newTask);
  checkBtn?.addEventListener("click", checkTask);
  hintBtn?.addEventListener("click", giveHint);
}

function tick() {
  tickToast();
  requestAnimationFrame(tick);
}

bind();
setDenom(4);
setNumer(1);
setTab("learn");
setModel("pizza");
requestAnimationFrame(tick);

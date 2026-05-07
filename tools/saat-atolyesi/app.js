const $ = (sel) => document.querySelector(sel);

const backBtn = $("#back-btn");
const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));

const digitalEl = $("#digital");
const readKac = $("#read-kac");
const readKacAk = $("#read-kacak");
const readPeriod = $("#read-period");
const amBtn = $("#am-btn");
const pmBtn = $("#pm-btn");

const modePill = $("#mode-pill");
const scorePill = $("#score-pill");
const toast = $("#toast");

const clockSvg = $("#clock");
const ticksG = $("#ticks");
const numsG = $("#nums");
const handMinute = $("#hand-minute");
const handHour = $("#hand-hour");
const handSecond = $("#hand-second");

const taskCard = $("#task-card");
const taskTarget = $("#task-target");
const newTaskBtn = $("#new-task-btn");
const checkBtn = $("#check-btn");
const hintBtn = $("#hint-btn");
const taskMsg = $("#task-msg");

const state = {
  tab: "learn",
  hour: 3,
  minute: 0,
  period: "am", // am = Öğleden Önce, pm = Öğleden Sonra
  score: 0,
  toastMeta: null,
  drag: null,
  task: null,
  lastDragMinute: null
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function pad2(n) {
  const v = Math.floor(Math.abs(n)) % 100;
  return v < 10 ? `0${v}` : `${v}`;
}

function hourTo24(hour12, period) {
  const h = clamp(Math.floor(hour12), 1, 12);
  const p = period === "pm" ? "pm" : "am";
  if (p === "am") return h === 12 ? 0 : h;
  return h === 12 ? 12 : h + 12;
}

function setScore(delta) {
  state.score = Math.max(0, state.score + delta);
  if (scorePill) scorePill.textContent = `Puan: ${state.score}`;
}

function showToast(text, durationMs = 2200) {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("show");
  state.toastMeta = { until: performance.now() + durationMs };
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
    12: "on iki",
    13: "on üç",
    14: "on dört",
    15: "on beş",
    16: "on altı",
    17: "on yedi",
    18: "on sekiz",
    19: "on dokuz",
    20: "yirmi",
    25: "yirmi beş",
    30: "otuz",
    35: "otuz beş",
    40: "kırk",
    45: "kırk beş",
    50: "elli",
    55: "elli beş"
  };
  return m[n] || String(n);
}

function kacGecKacKalaText(hour, minute) {
  const h = ((hour % 12) + 12) % 12 || 12;
  if (minute === 0) return { kac: `${numberToTr(h)}`, kacak: "Tam" };
  if (minute === 30) return { kac: `${numberToTr(h)}`, kacak: "Buçuk" };
  if (minute < 30) return { kac: `${numberToTr(h)}`, kacak: `${numberToTr(minute)} geçe` };
  const next = (h % 12) + 1;
  const kalan = 60 - minute;
  return { kac: `${numberToTr(next)}`, kacak: `${numberToTr(kalan)} kala` };
}

function syncReadouts() {
  const t = kacGecKacKalaText(state.hour, state.minute);
  if (readKac) readKac.textContent = t.kac;
  if (readKacAk) readKacAk.textContent = t.kacak;
  if (readPeriod) readPeriod.textContent = state.period === "pm" ? "Öğleden sonra" : "Öğleden önce";
  // Tek dijital: ÖÖ -> 00-11, ÖS -> 12-23 olarak göster
  const h24 = hourTo24(state.hour, state.period);
  const hh = digitalEl?.querySelector?.(".digital__hh");
  const mm = digitalEl?.querySelector?.(".digital__mm");
  if (hh && mm) {
    hh.textContent = pad2(h24);
    mm.textContent = pad2(state.minute);
  } else if (digitalEl) {
    digitalEl.textContent = `${pad2(h24)}:${pad2(state.minute)}`;
  }
}

function setPeriod(period) {
  state.period = period === "pm" ? "pm" : "am";
  amBtn?.classList.toggle("active", state.period === "am");
  pmBtn?.classList.toggle("active", state.period === "pm");
  amBtn?.setAttribute("aria-pressed", state.period === "am" ? "true" : "false");
  pmBtn?.setAttribute("aria-pressed", state.period === "pm" ? "true" : "false");
  syncReadouts();
}

function setTime(hour, minute, fromDrag = false) {
  state.hour = clamp(Math.floor(hour), 1, 12);
  state.minute = clamp(Math.floor(minute), 0, 59);
  syncReadouts();
  renderHands(fromDrag);
}

function renderHands(fromDrag = false) {
  const mAng = (state.minute / 60) * 360;
  const hFrac = ((state.hour % 12) / 12) + (state.minute / 720);
  const hAng = hFrac * 360;
  handMinute?.setAttribute("transform", `rotate(${mAng})`);
  handHour?.setAttribute("transform", `rotate(${hAng})`);

  if (!fromDrag && typeof gsap !== "undefined") {
    try {
      gsap.fromTo([handMinute, handHour], { scale: 0.995 }, { scale: 1, duration: 0.18, ease: "power1.out" });
    } catch (_) {}
  }
}

function buildFace() {
  if (!ticksG || !numsG) return;
  const ticks = [];
  const nums = [];
  for (let i = 0; i < 60; i += 1) {
    const a = (i / 60) * Math.PI * 2;
    const r0 = i % 5 === 0 ? 86 : 92;
    const r1 = 98;
    const x0 = Math.cos(a - Math.PI / 2) * r0;
    const y0 = Math.sin(a - Math.PI / 2) * r0;
    const x1 = Math.cos(a - Math.PI / 2) * r1;
    const y1 = Math.sin(a - Math.PI / 2) * r1;
    const w = i % 5 === 0 ? 3.2 : 1.6;
    const op = i % 5 === 0 ? 0.55 : 0.25;
    ticks.push(`<path d="M ${x0.toFixed(2)} ${y0.toFixed(2)} L ${x1.toFixed(2)} ${y1.toFixed(2)}" stroke="rgba(15,23,42,${op})" stroke-width="${w}" stroke-linecap="round"/>`);
  }
  for (let h = 1; h <= 12; h += 1) {
    const a = (h / 12) * Math.PI * 2;
    const r = 70;
    const x = Math.cos(a - Math.PI / 2) * r;
    const y = Math.sin(a - Math.PI / 2) * r + 7;
    nums.push(
      `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-size="18" font-weight="900" fill="rgba(15,23,42,.78)">${h}</text>`
    );
  }
  ticksG.innerHTML = ticks.join("");
  numsG.innerHTML = nums.join("");
}

function angleFromPointer(evt) {
  const pt = clockSvg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const ctm = clockSvg.getScreenCTM();
  if (!ctm) return 0;
  const local = pt.matrixTransform(ctm.inverse());
  const ang = Math.atan2(local.y, local.x); // -pi..pi (0=+x)
  // Convert so 12 o'clock = 0deg, clockwise positive
  let deg = (ang * 180) / Math.PI + 90;
  if (deg < 0) deg += 360;
  return deg;
}

function chooseHandFromPointerDeg(deg) {
  // Pointer yönüne en yakın eli seç (tıklamak zor olmasın)
  const mAng = (state.minute / 60) * 360;
  const hFrac = ((state.hour % 12) / 12) + (state.minute / 720);
  const hAng = hFrac * 360;
  const dist = (a, b) => {
    const d = Math.abs(a - b) % 360;
    return Math.min(d, 360 - d);
  };
  const dm = dist(deg, mAng);
  const dh = dist(deg, hAng);
  // dakika eli daha uzun: biraz daha öncelik ver
  return dm <= dh + 10 ? "minute" : "hour";
}

function snapMinuteFromDeg(deg) {
  const raw = (deg / 360) * 60;
  return clamp(Math.round(raw), 0, 59);
}

function snapHourFromDeg(deg) {
  const raw = (deg / 360) * 12;
  const h = Math.round(raw) % 12;
  return h === 0 ? 12 : h;
}

function startDrag(which, evt) {
  evt.preventDefault?.();
  state.drag = { which, pointerId: evt.pointerId };
  if (which === "minute") state.lastDragMinute = state.minute;
  try {
    evt.currentTarget?.setPointerCapture?.(evt.pointerId);
  } catch (_) {}
  window.addEventListener("pointermove", moveDrag, { passive: false });
  window.addEventListener("pointerup", endDrag, { passive: true });
  window.addEventListener("pointercancel", endDrag, { passive: true });
}

function moveDrag(evt) {
  if (!state.drag) return;
  evt.preventDefault?.();
  const deg = angleFromPointer(evt);
  if (state.drag.which === "minute") {
    const m = snapMinuteFromDeg(deg);
    // Dakika 59->0 veya 0->59 geçişinde saati de taşı
    if (state.lastDragMinute != null) {
      const prev = state.lastDragMinute;
      if (prev >= 50 && m <= 10) {
        const nh = state.hour + 1 > 12 ? 1 : state.hour + 1;
        state.hour = nh;
      } else if (prev <= 10 && m >= 50) {
        const nh = state.hour - 1 <= 0 ? 12 : state.hour - 1;
        state.hour = nh;
      }
    }
    state.lastDragMinute = m;
    setTime(state.hour, m, true);
  } else {
    const h = snapHourFromDeg(deg);
    setTime(h, state.minute, true);
  }
}

function endDrag() {
  if (!state.drag) return;
  state.drag = null;
  state.lastDragMinute = null;
  window.removeEventListener("pointermove", moveDrag);
  window.removeEventListener("pointerup", endDrag);
  window.removeEventListener("pointercancel", endDrag);
  showToast("Harika! Şimdi dijital saati oku.", 1800);
}

function setTab(tab) {
  state.tab = tab;
  tabButtons.forEach((b) => {
    const active = b.dataset.tab === tab;
    b.classList.toggle("active", active);
    b.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.body.classList.toggle("is-practice", tab === "practice");
  if (modePill) modePill.textContent = `Mod: ${tab === "practice" ? "Uygula" : "Öğren"}`;
  if (tab === "practice") {
    if (!state.task) newTask();
    showToast("Görevi yap: hedef saati analogda göster!", 2400);
  } else {
    showToast("Akrep‑yelkovanı sürükle. Dakikayı yelkovandan oku.", 2400);
  }
}

function newTask() {
  // Primary school-friendly: 5 dakikalık adımlar + özel zamanlar
  const minutesPool = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const m = minutesPool[Math.floor(Math.random() * minutesPool.length)];
  const h = 1 + Math.floor(Math.random() * 12);
  const p = Math.random() < 0.5 ? "am" : "pm";
  state.task = { hour: h, minute: m, period: p };
  if (taskTarget) taskTarget.textContent = `${pad2(h)}:${pad2(m)} ${p === "pm" ? "ÖS" : "ÖÖ"}`;
  if (taskMsg) {
    taskMsg.textContent = "";
    taskMsg.className = "task-msg";
  }
}

function checkTask() {
  if (!state.task) return;
  const ok = state.hour === state.task.hour && state.minute === state.task.minute && state.period === state.task.period;
  if (ok) {
    taskMsg.textContent = "Süper! Doğru yaptın.";
    taskMsg.className = "task-msg good";
    setScore(8);
    if (typeof gsap !== "undefined") {
      try {
        gsap.fromTo(clockSvg, { scale: 0.985, filter: "brightness(1.08)" }, { scale: 1, filter: "brightness(1)", duration: 0.35, ease: "power2.out" });
      } catch (_) {}
    }
    setTimeout(newTask, 650);
    return;
  }
  taskMsg.textContent = "Henüz değil. Biraz daha çevir!";
  taskMsg.className = "task-msg bad";
}

function giveHint() {
  if (!state.task) return;
  const t = kacGecKacKalaText(state.task.hour, state.task.minute);
  const per = state.task.period === "pm" ? "öğleden sonra" : "öğleden önce";
  showToast(`İpucu: ${per} ${t.kac} ${t.kacak}`, 3200);
}

function bind() {
  backBtn?.addEventListener("click", () => {
    window.location.href = "../../index.html";
  });

  tabButtons.forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab || "learn")));

  amBtn?.addEventListener("click", () => setPeriod("am"));
  pmBtn?.addEventListener("click", () => setPeriod("pm"));

  newTaskBtn?.addEventListener("click", newTask);
  checkBtn?.addEventListener("click", checkTask);
  hintBtn?.addEventListener("click", giveHint);

  handMinute?.addEventListener("pointerdown", (e) => startDrag("minute", e));
  handHour?.addEventListener("pointerdown", (e) => startDrag("hour", e));
  // Saatin herhangi bir yerinden de tutabilsin (mouse ile kolay)
  clockSvg?.addEventListener("pointerdown", (e) => {
    const deg = angleFromPointer(e);
    const which = chooseHandFromPointerDeg(deg);
    startDrag(which, e);
  }, { passive: false });
}

function raf() {
  tickToast();
  requestAnimationFrame(raf);
}

buildFace();
bind();
setTime(3, 0);
setPeriod("am");
setTab("learn");
newTask();
requestAnimationFrame(raf);


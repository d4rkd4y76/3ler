const $ = (sel) => document.querySelector(sel);

const backBtn = $("#back-btn");
const infoButtons = Array.from(document.querySelectorAll(".info-btn"));

const digitalEl = $("#digital");
const readPeriod = $("#read-period");
const readLine = $("#read-line");
const amBtn = $("#am-btn");
const pmBtn = $("#pm-btn");
const infoText = $("#info-text");
const infoDock = $("#info-dock");

const toast = $("#toast");

const clockSvg = $("#clock");
const ticksG = $("#ticks");
const numsG = $("#nums");
const handMinute = $("#hand-minute");
const handHour = $("#hand-hour");
const handSecond = $("#hand-second");

const state = {
  hour: 3,
  minute: 0,
  period: "am", // am = Öğleden Önce, pm = Öğleden Sonra
  toastMeta: null,
  drag: null,
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

function hourWordTR(h) {
  const v = ((Math.floor(h) % 12) + 12) % 12 || 12;
  return numberToTr(v);
}

function hourAccusativeTR(h) {
  // “beşi / dördü” gibi (okunuşta: “beşi on geçiyor”)
  const v = ((Math.floor(h) % 12) + 12) % 12 || 12;
  const map = {
    1: "biri",
    2: "ikiyi",
    3: "üçü",
    4: "dördü",
    5: "beşi",
    6: "altıyı",
    7: "yediyi",
    8: "sekizi",
    9: "dokuzu",
    10: "onu",
    11: "on biri",
    12: "on ikiyi"
  };
  return map[v] || hourWordTR(v);
}

function hourDativeTR(h) {
  // “dörde / beşe” gibi (okunuşta: “dörde on var”)
  const v = ((Math.floor(h) % 12) + 12) % 12 || 12;
  const map = {
    1: "bire",
    2: "ikiye",
    3: "üçe",
    4: "dörde",
    5: "beşe",
    6: "altıya",
    7: "yedİye",
    8: "sekize",
    9: "dokuza",
    10: "ona",
    11: "on bire",
    12: "on ikiye"
  };
  // “yedİye” yazım hatasına karşı düzelt
  return (map[v] || hourWordTR(v)).replace("yedİ", "yedi");
}

function readingTR(hour, minute) {
  const h = ((Math.floor(hour) % 12) + 12) % 12 || 12;
  const m = clamp(Math.floor(minute), 0, 59);
  if (m === 0) return { hourText: hourWordTR(h), minuteText: "tam" };
  if (m === 30) return { hourText: hourWordTR(h), minuteText: "buçuk" };
  if (m === 15) return { hourText: hourAccusativeTR(h), minuteText: "on beş geçiyor (çeyrek geçiyor)" };
  if (m < 30) return { hourText: hourAccusativeTR(h), minuteText: `${numberToTr(m)} geçiyor` };
  const next = (h % 12) + 1;
  const kalan = 60 - m;
  if (m === 45) return { hourText: hourDativeTR(next), minuteText: "on beş var (çeyrek var)" };
  return { hourText: hourDativeTR(next), minuteText: `${numberToTr(kalan)} var` };
}

function syncReadouts() {
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

  const r = readingTR(state.hour, state.minute);
  if (readLine) {
    readLine.innerHTML = `<span class="reading-hour">${r.hourText}</span> <span class="reading-minute">${r.minuteText}</span>`;
  }

  if (digitalEl) {
    digitalEl.classList.remove("tick");
    // eslint-disable-next-line no-unused-expressions
    digitalEl.offsetWidth;
    digitalEl.classList.add("tick");
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

function showNote(kind) {
  const notes = {
    am: "Öğleden önce (ÖÖ), gece yarısından öğleye kadar olan zamandır. Dijital saat 00:00–11:59 arası olur.",
    pm: "Öğleden sonra (ÖS), öğleden gece yarısına kadar olan zamandır. Dijital saat 12:00–23:59 arası olur.",
    hour: "Akrep saati gösterir. Kısa ve kalındır. Dakika arttıkça bir sonraki saate doğru yavaşça ilerler.",
    minute: "Yelkovan dakikayı gösterir. Uzun ve incedir. Saatteki her sayı 5 dakikayı temsil eder."
  };
  const text = notes[kind] || "Bilgi notu bulunamadı.";
  if (infoText) infoText.textContent = text;
  if (infoDock) {
    infoDock.classList.remove("flash");
    // eslint-disable-next-line no-unused-expressions
    infoDock.offsetWidth;
    infoDock.classList.add("flash");
  }
  if (typeof gsap !== "undefined") {
    try {
      const target = kind === "hour" ? handHour : kind === "minute" ? handMinute : null;
      if (target) gsap.fromTo(target, { scale: 1 }, { scale: 1.06, yoyo: true, repeat: 1, duration: 0.18, ease: "power2.out" });
    } catch (_) {}
  }
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

// Uygula/mini görev kaldırıldı.

function bind() {
  backBtn?.addEventListener("click", () => {
    window.location.href = "../../index.html";
  });

  amBtn?.addEventListener("click", () => setPeriod("am"));
  pmBtn?.addEventListener("click", () => setPeriod("pm"));
  infoButtons.forEach((b) => b.addEventListener("click", () => showNote(b.dataset.note)));

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
requestAnimationFrame(raf);


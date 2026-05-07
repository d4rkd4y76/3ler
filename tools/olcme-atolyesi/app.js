const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const backBtn = $("#back-btn");
const toolBtns = $$(".tool-btn");
const sceneLen = $("#scene-len");
const sceneMass = $("#scene-mass");

const taskPill = $("#task-pill");
const scorePill = $("#score-pill");
const unitPill = $("#unit-pill");
const newTaskBtn = $("#new-task-btn");
const hintBtn = $("#hint-btn");
const toast = $("#toast");

// length refs
const rail = $("#ruler-rail");
const marker = $("#len-marker");
const objectEl = $("#len-object");
const outCm = $("#len-cm");
const outMm = $("#len-mm");
const outM = $("#len-m");

// mass refs
const weightsWrap = $("#weights");
const panLeftItems = $("#pan-left-items");
const panRightItems = $("#pan-right-items");
const massG = $("#mass-g");
const massKg = $("#mass-kg");
const clearWeightsBtn = $("#clear-weights-btn");
const checkMassBtn = $("#check-mass-btn");
const panDrops = $$(".pan__drop");
const beam = $("#beam");

const state = {
  tool: "len",
  score: 0,
  toastMeta: null,

  // length
  targetLenCm: 12,
  objectLenCm: 18,
  markerCm: 12,
  drag: null,

  // mass
  targetMassG: 0,
  left: [],
  right: []
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function showToast(text, ms = 2200) {
  toast.textContent = text;
  toast.classList.add("show");
  state.toastMeta = { until: performance.now() + ms };
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
  scorePill.textContent = `Puan: ${state.score}`;
}

function setTool(tool) {
  state.tool = tool === "mass" ? "mass" : "len";
  toolBtns.forEach((b) => {
    const active = (b.dataset.tool || "len") === state.tool;
    b.classList.toggle("active", active);
    b.setAttribute("aria-selected", active ? "true" : "false");
  });
  sceneLen.hidden = state.tool !== "len";
  sceneMass.hidden = state.tool !== "mass";
  unitPill.textContent = state.tool === "len" ? "Birim: cm • mm • m" : "Birim: g • kg";
  newTask();
}

// ---------- LENGTH ----------
function fmtTR(n, digits = 2) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function railMetrics() {
  const r = rail.getBoundingClientRect();
  const pad = 16; // matches css
  const left = r.left + pad;
  const right = r.right - pad;
  return { left, right, width: right - left };
}

function cmToX(cm) {
  const m = railMetrics();
  const t = clamp(cm / 30, 0, 1);
  return m.left + t * m.width;
}

function xToCm(x) {
  const m = railMetrics();
  const t = clamp((x - m.left) / m.width, 0, 1);
  // 0.5cm adımı (3. sınıf için yeterince hassas)
  return Math.round(t * 30 * 2) / 2;
}

function renderLength() {
  // marker position
  const mx = cmToX(state.markerCm);
  const r = rail.getBoundingClientRect();
  marker.style.left = `${mx - r.left}px`;
  marker.setAttribute("aria-valuenow", String(state.markerCm));

  // object length
  const m = railMetrics();
  const pxPerCm = m.width / 30;
  objectEl.style.width = `${Math.max(120, state.objectLenCm * pxPerCm)}px`;

  // readout based on marker (teaching)
  const cm = state.markerCm;
  outCm.textContent = String(cm).replace(".5", ",5");
  outMm.textContent = String(Math.round(cm * 10)).replace(".0", "");
  outM.textContent = fmtTR(cm / 100, 2);
}

function pickLenTask() {
  // 3. sınıf: 0.5cm adımı, 2–25 cm arası
  const cm = (Math.floor(Math.random() * 47) + 4) / 2; // 2..25 step .5
  state.targetLenCm = cm;
  // object length: target +/- küçük fark, görsel “yaklaştır” görevi
  const off = (Math.floor(Math.random() * 9) - 4) / 2; // -2..+2 step .5
  state.objectLenCm = clamp(cm + off, 2, 28);
  state.markerCm = clamp(cm, 0, 30);
  taskPill.textContent = `Görev: İmleci ${String(cm).replace(".5", ",5")} cm yap.`;
  showToast("İmleci sürükle ve ölçümü bul.", 2200);
}

function checkLen() {
  const ok = Math.abs(state.markerCm - state.targetLenCm) < 0.001;
  if (ok) {
    setScore(6);
    showToast("Süper! Doğru ölçtün.", 2000);
    if (typeof gsap !== "undefined") {
      try {
        gsap.fromTo(marker, { scale: 0.98 }, { scale: 1, duration: 0.22, ease: "power2.out" });
      } catch (_) {}
    }
    setTimeout(pickLenTask, 650);
    return true;
  }
  showToast("Biraz daha dene. Cetvelin çizgilerine dikkat et.", 2400);
  return false;
}

function startDrag(kind, evt) {
  evt.preventDefault?.();
  state.drag = { kind };
  window.addEventListener("pointermove", onDrag, { passive: false });
  window.addEventListener("pointerup", endDrag, { passive: true });
  window.addEventListener("pointercancel", endDrag, { passive: true });
}

function onDrag(evt) {
  if (!state.drag) return;
  evt.preventDefault?.();
  if (state.tool !== "len") return;
  if (state.drag.kind === "marker") {
    state.markerCm = xToCm(evt.clientX);
    renderLength();
  } else if (state.drag.kind === "object") {
    // object dragging just for fun; clamp within rail
    const r = rail.getBoundingClientRect();
    const x = clamp(evt.clientX - r.left, 20, r.width - 60);
    objectEl.style.left = `${x}px`;
  }
}

function endDrag() {
  if (!state.drag) return;
  const k = state.drag.kind;
  state.drag = null;
  window.removeEventListener("pointermove", onDrag);
  window.removeEventListener("pointerup", endDrag);
  window.removeEventListener("pointercancel", endDrag);
  if (k === "marker") checkLen();
}

// ---------- MASS ----------
const WEIGHTS = [
  { g: 1000, label: "1 kg" },
  { g: 500, label: "500 g" },
  { g: 200, label: "200 g" },
  { g: 100, label: "100 g" },
  { g: 50, label: "50 g" },
  { g: 20, label: "20 g" },
  { g: 10, label: "10 g" }
];

function sumG(list) {
  return list.reduce((a, w) => a + w.g, 0);
}

function renderMass() {
  const leftG = sumG(state.left);
  const rightG = sumG(state.right);
  const total = leftG + rightG;
  massG.textContent = String(total);
  massKg.textContent = (total / 1000).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // beam tilt: left-heavy negative, right-heavy positive
  const diff = rightG - leftG;
  const deg = clamp(diff / 1200, -1, 1) * 8; // up to 8deg
  if (typeof gsap !== "undefined") {
    gsap.to(beam, { rotate: deg, transformOrigin: "50% 50%", duration: 0.25, ease: "power2.out" });
  } else {
    beam.style.transform = `translateX(-50%) rotate(${deg}deg)`;
  }

  panLeftItems.innerHTML = state.left.map((w) => `<span class="chip">${w.label}</span>`).join("");
  panRightItems.innerHTML = state.right.map((w) => `<span class="chip">${w.label}</span>`).join("");
}

function buildWeights() {
  weightsWrap.innerHTML = WEIGHTS
    .map((w) => `<button class="weight" type="button" draggable="false" data-g="${w.g}" aria-label="${w.label}">${w.label}</button>`)
    .join("");
  weightsWrap.querySelectorAll(".weight").forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const g = Number(btn.dataset.g || 0);
      const item = WEIGHTS.find((x) => x.g === g);
      if (!item) return;
      state.drag = { kind: "weight", weight: item };
      btn.setPointerCapture?.(e.pointerId);
      btn.classList.add("is-drag");
      window.addEventListener("pointermove", onWeightDrag, { passive: false });
      window.addEventListener("pointerup", endWeightDrag, { passive: true });
      window.addEventListener("pointercancel", endWeightDrag, { passive: true });
    });
  });
}

function onWeightDrag(e) {
  if (!state.drag || state.drag.kind !== "weight") return;
  e.preventDefault?.();
}

function endWeightDrag(e) {
  if (!state.drag || state.drag.kind !== "weight") return;
  const w = state.drag.weight;
  state.drag = null;
  window.removeEventListener("pointermove", onWeightDrag);
  window.removeEventListener("pointerup", endWeightDrag);
  window.removeEventListener("pointercancel", endWeightDrag);

  const x = e.clientX;
  const y = e.clientY;
  let dropped = false;
  panDrops.forEach((d) => {
    const r = d.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      const pan = d.dataset.pan;
      if (pan === "left") state.left.push(w);
      else state.right.push(w);
      dropped = true;
    }
  });
  if (dropped) {
    renderMass();
  } else {
    showToast("Ağırlığı kefenin üstüne bırak.", 1800);
  }
}

function pickMassTask() {
  // hedef 100..2000g, 10'luk adımlar
  const g = (Math.floor(Math.random() * 191) + 10) * 10;
  state.targetMassG = g;
  state.left = [];
  state.right = [];
  renderMass();
  taskPill.textContent = `Görev: Toplamı ${g} g yap.`;
  showToast("Ağırlıkları kefelere bırak ve toplamı bul.", 2400);
}

function checkMass() {
  const total = sumG(state.left) + sumG(state.right);
  if (total === state.targetMassG) {
    setScore(8);
    showToast("Harika! Doğru tarttın.", 2000);
    setTimeout(pickMassTask, 650);
    return true;
  }
  showToast("Henüz değil. Toplamı tekrar kontrol et.", 2400);
  return false;
}

function clearMass() {
  state.left = [];
  state.right = [];
  renderMass();
  showToast("Kefeler temizlendi.", 1400);
}

// ---------- TASK / HINT ----------
function newTask() {
  if (state.tool === "len") pickLenTask();
  else pickMassTask();
}

function hint() {
  if (state.tool === "len") {
    showToast("İpucu: 1 cm = 10 mm. 2,5 cm = 25 mm.", 4200);
  } else {
    showToast("İpucu: 1 kg = 1000 g. 500 g + 200 g = 700 g.", 4200);
  }
}

// ---------- INIT ----------
function bind() {
  backBtn?.addEventListener("click", () => (window.location.href = "../../index.html"));
  toolBtns.forEach((b) => b.addEventListener("click", () => setTool(b.dataset.tool || "len")));
  newTaskBtn?.addEventListener("click", newTask);
  hintBtn?.addEventListener("click", hint);

  marker?.addEventListener("pointerdown", (e) => startDrag("marker", e));
  objectEl?.addEventListener("pointerdown", (e) => startDrag("object", e));

  clearWeightsBtn?.addEventListener("click", clearMass);
  checkMassBtn?.addEventListener("click", checkMass);
}

function raf() {
  tickToast();
  requestAnimationFrame(raf);
}

buildWeights();
bind();
renderLength();
renderMass();
newTask();
requestAnimationFrame(raf);


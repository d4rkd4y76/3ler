const canvas = document.getElementById("sceneCanvas");
const ctx = canvas.getContext("2d");

const backBtn = document.getElementById("backToDuellomatik");
const topicNav = document.getElementById("topicNav");
const topicHeading = document.getElementById("topicHeading");
const symbolStrip = document.getElementById("symbolStrip");
const topicExplain = document.getElementById("topicExplain");
const topicBullets = document.getElementById("topicBullets");
const finePrint = document.getElementById("finePrint");
const boardTip = document.getElementById("boardTip");

const openLifeBtn = document.getElementById("openLifeExamples");
const lifeModal = document.getElementById("lifeModal");
const lifeModalBackdrop = document.getElementById("lifeModalBackdrop");
const lifeModalClose = document.getElementById("closeLifeModal");
const lifeModalSub = document.getElementById("lifeModalSub");
const lifeModalBody = document.getElementById("lifeModalBody");

const toggleSoundBtn = document.getElementById("toggleSound");

const TAU = Math.PI * 2;
const GRID = { cols: 15, rows: 12 };

const sound = { enabled: false, voice: null };

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function resizeCanvas() {
  const ratio = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
  const w = Math.round(canvas.clientWidth * ratio);
  const h = Math.round(canvas.clientHeight * ratio);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h };
}

function canvasCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const { w, h } = resizeCanvas();
  const x = ((clientX - rect.left) / Math.max(rect.width, 1)) * w;
  const y = ((clientY - rect.top) / Math.max(rect.height, 1)) * h;
  return { x, y, w, h };
}

function layout(w, h) {
  const pad = Math.max(18, Math.min(w, h) * 0.06);
  const cols = GRID.cols;
  const rows = GRID.rows;
  const cellW = (w - 2 * pad) / (cols - 1);
  const cellH = (h - 2 * pad) / (rows - 1);
  return { pad, cellW, cellH, cols, rows };
}

function toPixel(gx, gy, lay) {
  return { x: lay.pad + gx * lay.cellW, y: lay.pad + gy * lay.cellH };
}

function toGrid(x, y, lay) {
  const gx = Math.round((x - lay.pad) / lay.cellW);
  const gy = Math.round((y - lay.pad) / lay.cellH);
  return {
    gx: clamp(gx, 1, lay.cols - 2),
    gy: clamp(gy, 1, lay.rows - 2),
  };
}

function pickTurkishVoice() {
  try {
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    return voices.find((v) => (v.lang || "").toLowerCase().startsWith("tr")) || voices[0] || null;
  } catch {
    return null;
  }
}

function speak(text) {
  if (!sound.enabled || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "tr-TR";
    if (!sound.voice) sound.voice = pickTurkishVoice();
    if (sound.voice) u.voice = sound.voice;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

function setSound(on) {
  sound.enabled = !!on;
  toggleSoundBtn.setAttribute("aria-pressed", on ? "true" : "false");
  toggleSoundBtn.textContent = on ? "🔈 Ses" : "🔊 Ses";
  if (!on && window.speechSynthesis) window.speechSynthesis.cancel();
}

const TOPICS = [
  {
    key: "point",
    label: "Nokta",
    heading: "Nokta",
    symbolStrip: "Örnek yazılış: “· A” veya “A noktası”",
    explain:
      "Kalemin defterde bıraktığı ize nokta denir. Noktanın boyu ve eni yoktur; bir yeri gösterir. Noktayı alfabemizin büyük harfleriyle adlandırırız (örneğin A noktası).",
    bullets: [
      "İki doğru kesişince kesişim yeri de bir noktadır.",
      "Aynı yerde üst üste binen noktalar tek nokta sayılır.",
    ],
    tip: "A noktasını parmağınla ızgarada sürükle. Yatay ve dikey doğrular sana “kesişim” fikrini hatırlatır; oklar (>) sonsuza gider.",
    finePrint:
      "Kitapta olduğu gibi: doğruyu sonsuza götüren uçlarda ok (>) kullanılır. Nokta ise küçük bir “iz” gibidir.",
  },
  {
    key: "segment",
    label: "Doğru parçası",
    heading: "Doğru parçası",
    symbolStrip: "Gösterim: • ———— •  (iki uçta nokta)",
    explain:
      "Başlangıç ve bitiş noktası belli olan düz çizgiye doğru parçası denir. Belli bir uzunluğu vardır. Uçlarına nokta koyarız ve çizgiyi iki nokta arasında düşünürüz.",
    bullets: ["İki uç noktadır (örnek: A ve B).", "Yatay, dikey veya eğik olabilir.", "Doğru ve ışından farkı: iki yanı da biter."],
    tip: "A ve B noktalarını sürükleyerek doğru parçasını oynat. Uçlarda hep nokta görürsün.",
    finePrint: "Kitaptaki gibi uçlar nokta ile biter; sonsuzluk oku (>) yoktur.",
  },
  {
    key: "ray",
    label: "Işın",
    heading: "Işın",
    symbolStrip: "Gösterim: • ————>  (bir uçta nokta, diğer uçta ok)",
    explain:
      "Başlangıcı belli olan ve bir yönde sonsuza kadar uzayan düz çizgiye ışın denir. Başladığı yer noktadır; gittiği tarafta ok (>) ile sonsuza gittiğini gösteririz.",
    bullets: ["Bir ucu nokta (başlangıç).", "Diğer uçta ok (>) vardır.", "El feneri ışığı gibi tek yönde devam eder."],
    tip: "A başlangıç noktasıdır. B’yi sürükleyerek ışının yönünü değiştir; ok ucu gittiği yönü gösterir.",
    finePrint: "Ok (>), çizginin o yönde bitmediğini ve uzayıp gittiğini anlatır.",
  },
  {
    key: "line",
    label: "Doğru",
    heading: "Doğru",
    symbolStrip: "Gösterim: > ———— <  (iki uçta da ok; her iki yöne sonsuz)",
    explain:
      "Her iki yönünde de sonsuza kadar uzayan düzgün çizgiye doğru denir. Başlangıç ve bitiş noktası yoktur; iki yanda ok (>) ile sonsuza gittiğini gösteririz.",
    bullets: ["İki yönde de sonsuzdur.", "Üzerinde sonsuz çok nokta vardır.", "Doğru parçasından farkı: uçları yoktur, oklar vardır."],
    tip: "A ve B doğrunun üzerinde iki noktadır; sürükleyerek doğrunun yönünü değiştir. Oklar her iki yönde sonsuzluğu hatırlatır.",
    finePrint: "Çizimde iki uçta da > kullanılır: çizgi iki yönde de uzar.",
  },
  {
    key: "angle",
    label: "Açı",
    heading: "Açı",
    symbolStrip: "İki ışın; tepe noktasında köşe, kol boylarında ok (>)",
    explain:
      "Başlangıç noktaları aynı olan iki ışının oluşturduğu açıklığa açı denir. Ortak başlangıç noktasına köşe (tepe), ışınlara kenar deriz.",
    bullets: ["Köşe: iki kenarın birleştiği tepe noktası.", "Kenar: tepe noktasından çıkan ışınlar.", "Işın olduğu için kenar ucunda ok (>) vardır."],
    tip: "A köşedir. B ve C’yi sürükleyerek açıklığı aç veya daralt.",
    finePrint: "Kitaptaki gibi kenarlar ışındır; uçlarda ok (>) sonsuzluğu gösterir.",
  },
];

const state = {
  topic: 0,
  grid: {
    point: { A: { gx: 7, gy: 6 } },
    segment: { A: { gx: 4, gy: 6 }, B: { gx: 11, gy: 6 } },
    ray: { A: { gx: 5, gy: 6 }, B: { gx: 11, gy: 4 } },
    line: { A: { gx: 4, gy: 9 }, B: { gx: 12, gy: 5 } },
    angle: { A: { gx: 7, gy: 7 }, B: { gx: 12, gy: 7 }, C: { gx: 9, gy: 3 } },
  },
  drag: null,
};

function getTopic() {
  return TOPICS[state.topic];
}

function getPoints() {
  return state.grid[getTopic().key];
}

/** Kitaba yakın “>” ok ucu (iki çizgi) */
function drawChevronHead(tipX, tipY, fromX, fromY, len, color, lineW) {
  const ang = Math.atan2(tipY - fromY, tipX - fromX);
  const wing = 0.52;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineW;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - Math.cos(ang - wing) * len, tipY - Math.sin(ang - wing) * len);
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - Math.cos(ang + wing) * len, tipY - Math.sin(ang + wing) * len);
  ctx.stroke();
  ctx.restore();
}

function drawGridPaper(w, h, lay) {
  ctx.fillStyle = "#e8f4fc";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(59, 130, 246, 0.28)";
  ctx.lineWidth = Math.max(1, w * 0.0015);
  for (let i = 0; i < lay.cols; i += 1) {
    const x = lay.pad + i * lay.cellW;
    ctx.beginPath();
    ctx.moveTo(x, lay.pad);
    ctx.lineTo(x, h - lay.pad);
    ctx.stroke();
  }
  for (let j = 0; j < lay.rows; j += 1) {
    const y = lay.pad + j * lay.cellH;
    ctx.beginPath();
    ctx.moveTo(lay.pad, y);
    ctx.lineTo(w - lay.pad, y);
    ctx.stroke();
  }
}

function drawPointMarker(x, y, label, color) {
  const w = canvas.width;
  const h = canvas.height;
  const rr = Math.max(10, Math.min(w, h) * 0.018);
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = color || "#1e293b";
  ctx.arc(x, y, rr, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = "rgba(255,255,255,.95)";
  ctx.arc(x - rr * 0.22, y - rr * 0.22, rr * 0.28, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.font = `900 ${Math.round(rr * 1.05)}px Segoe UI, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(label, x, y - rr - 4);
  ctx.restore();
}

function firstRayHit(Ax, Ay, ux, uy, w, h) {
  let tHit = Infinity;
  const add = (t) => {
    if (t > 0.02) tHit = Math.min(tHit, t);
  };
  if (Math.abs(ux) > 1e-9) {
    add((0 - Ax) / ux);
    add((w - Ax) / ux);
  }
  if (Math.abs(uy) > 1e-9) {
    add((0 - Ay) / uy);
    add((h - Ay) / uy);
  }
  if (!Number.isFinite(tHit)) tHit = Math.max(w, h) * 2;
  return { x: Ax + ux * tHit, y: Ay + uy * tHit };
}

function drawInfiniteDoubleArrow(Ax, Ay, Bx, By, color, lw) {
  const dx = Bx - Ax;
  const dy = By - Ay;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const diag = Math.hypot(canvas.width, canvas.height) * 1.2;
  const mx = (Ax + Bx) / 2;
  const my = (Ay + By) / 2;
  const x1 = mx - ux * diag;
  const y1 = my - uy * diag;
  const x2 = mx + ux * diag;
  const y2 = my + uy * diag;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const ch = Math.max(14, lw * 3.8);
  drawChevronHead(x1, y1, x1 + ux * ch * 2, y1 + uy * ch * 2, ch, color, Math.max(2.8, lw * 0.85));
  drawChevronHead(x2, y2, x2 - ux * ch * 2, y2 - uy * ch * 2, ch, color, Math.max(2.8, lw * 0.85));
  ctx.restore();
}

function drawRayWithArrow(Ax, Ay, Bx, By, color, lw) {
  const dx = Bx - Ax;
  const dy = By - Ay;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const end = firstRayHit(Ax, Ay, ux, uy, canvas.width, canvas.height);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(Ax, Ay);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  const ch = Math.max(14, lw * 3.8);
  drawChevronHead(end.x, end.y, end.x - ux * ch * 2.8, end.y - uy * ch * 2.8, ch, color, Math.max(2.8, lw * 0.85));
  ctx.restore();
}

function drawSegmentSolid(x1, y1, x2, y2, color, lw) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Açı yayı: Canvas açıları (atan2(y,x), y aşağı) ile uyumlu.
 * İki ışın arasındaki küçük açıyı doldurur; derece etiketi buna eşittir.
 */
function drawAngleWedge(Ax, Ay, Bx, By, Cx, Cy, r, fillA) {
  const aB = Math.atan2(By - Ay, Bx - Ax);
  const aC = Math.atan2(Cy - Ay, Cx - Ax);
  let d = aC - aB;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  const end = aB + d;
  const anticlockwise = d < 0;
  const deg = Math.round((Math.abs(d) * 180) / Math.PI);

  const p1x = Ax + Math.cos(aB) * r;
  const p1y = Ay + Math.sin(aB) * r;

  const v1x = Bx - Ax;
  const v1y = By - Ay;
  const v2x = Cx - Ax;
  const v2y = Cy - Ay;
  const n1 = Math.hypot(v1x, v1y) || 1;
  const n2 = Math.hypot(v2x, v2y) || 1;
  const bx = v1x / n1 + v2x / n2;
  const by = v1y / n1 + v2y / n2;
  const ml = Math.hypot(bx, by) || 1;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(Ax, Ay);
  ctx.lineTo(p1x, p1y);
  ctx.arc(Ax, Ay, r, aB, end, anticlockwise);
  ctx.closePath();
  ctx.fillStyle = fillA;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(Ax, Ay);
  ctx.lineTo(p1x, p1y);
  ctx.arc(Ax, Ay, r, aB, end, anticlockwise);
  ctx.closePath();
  ctx.strokeStyle = "#ea580c";
  ctx.lineWidth = Math.max(2.5, Math.min(canvas.width, canvas.height) * 0.006);
  ctx.stroke();
  ctx.fillStyle = "#0f172a";
  ctx.font = `900 ${Math.max(13, Math.min(canvas.width, canvas.height) * 0.032)}px Segoe UI`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${deg}°`, Ax + (bx / ml) * (r + 18), Ay + (by / ml) * (r + 18));
  ctx.restore();
}

function draw() {
  const { w, h } = resizeCanvas();
  const lay = layout(w, h);
  const topic = getTopic();
  const pts = getPoints();

  ctx.clearRect(0, 0, w, h);
  drawGridPaper(w, h, lay);

  const lw = Math.max(3.5, Math.min(w, h) * 0.009);

  if (topic.key === "point") {
    const pA = toPixel(pts.A.gx, pts.A.gy, lay);
    const yH = pA.y;
    const xV = pA.x;
    drawInfiniteDoubleArrow(20, yH, w - 20, yH, "#e11d48", lw);
    drawInfiniteDoubleArrow(xV, 20, xV, h - 20, "#0891b2", lw);
    drawPointMarker(pA.x, pA.y, "A", "#b45309");
  } else if (topic.key === "segment") {
    const pA = toPixel(pts.A.gx, pts.A.gy, lay);
    const pB = toPixel(pts.B.gx, pts.B.gy, lay);
    drawSegmentSolid(pA.x, pA.y, pB.x, pB.y, "#1d4ed8", lw + 0.5);
    drawPointMarker(pA.x, pA.y, "A", "#1e40af");
    drawPointMarker(pB.x, pB.y, "B", "#1e40af");
  } else if (topic.key === "ray") {
    const pA = toPixel(pts.A.gx, pts.A.gy, lay);
    const pB = toPixel(pts.B.gx, pts.B.gy, lay);
    drawRayWithArrow(pA.x, pA.y, pB.x, pB.y, "#047857", lw + 0.5);
    drawPointMarker(pA.x, pA.y, "A", "#0f766e");
    drawPointMarker(pB.x, pB.y, "B", "#0d9488");
  } else if (topic.key === "line") {
    const pA = toPixel(pts.A.gx, pts.A.gy, lay);
    const pB = toPixel(pts.B.gx, pts.B.gy, lay);
    drawInfiniteDoubleArrow(pA.x, pA.y, pB.x, pB.y, "#6d28d9", lw + 0.5);
    drawPointMarker(pA.x, pA.y, "A", "#5b21b6");
    drawPointMarker(pB.x, pB.y, "B", "#5b21b6");
  } else if (topic.key === "angle") {
    const pA = toPixel(pts.A.gx, pts.A.gy, lay);
    const pB = toPixel(pts.B.gx, pts.B.gy, lay);
    const pC = toPixel(pts.C.gx, pts.C.gy, lay);
    const rArc = Math.min(w, h) * 0.11;
    drawAngleWedge(pA.x, pA.y, pB.x, pB.y, pC.x, pC.y, rArc, "rgba(251, 146, 60, 0.22)");
    drawRayWithArrow(pA.x, pA.y, pB.x, pB.y, "#1d4ed8", lw);
    drawRayWithArrow(pA.x, pA.y, pC.x, pC.y, "#047857", lw);
    drawPointMarker(pA.x, pA.y, "A", "#b45309");
    drawPointMarker(pB.x, pB.y, "B", "#1e40af");
    drawPointMarker(pC.x, pC.y, "C", "#0f766e");
  }
}

function pickDragKey(clientX, clientY) {
  const { x, y, w, h } = canvasCoords(clientX, clientY);
  const lay = layout(w, h);
  const topic = getTopic();
  const pts = getPoints();
  const keys = Object.keys(pts);
  let best = null;
  let bestD = Infinity;
  keys.forEach((k) => {
    const p = toPixel(pts[k].gx, pts[k].gy, lay);
    const d = Math.hypot(x - p.x, y - p.y);
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  });
  const need = Math.max(28, Math.min(lay.cellW, lay.cellH) * 0.9);
  if (bestD > need) return null;
  return best;
}

function bindCanvas() {
  canvas.addEventListener("pointerdown", (e) => {
    const key = pickDragKey(e.clientX, e.clientY);
    if (!key) return;
    canvas.setPointerCapture(e.pointerId);
    state.drag = { key, pid: e.pointerId };
    e.preventDefault();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!state.drag || e.pointerId !== state.drag.pid) return;
    const { x, y, w, h } = canvasCoords(e.clientX, e.clientY);
    const lay = layout(w, h);
    const g = toGrid(x, y, lay);
    const pts = getPoints();
    pts[state.drag.key].gx = g.gx;
    pts[state.drag.key].gy = g.gy;

    if (getTopic().key === "segment" || getTopic().key === "line") {
      if (pts.A.gx === pts.B.gx && pts.A.gy === pts.B.gy) {
        pts.B.gx = clamp(pts.B.gx + 1, 1, lay.cols - 2);
      }
    }
    if (getTopic().key === "ray") {
      if (pts.A.gx === pts.B.gx && pts.A.gy === pts.B.gy) {
        pts.B.gx = clamp(pts.B.gx + 1, 1, lay.cols - 2);
      }
    }
    draw();
    e.preventDefault();
  });

  const end = (e) => {
    if (state.drag && e.pointerId === state.drag.pid) {
      state.drag = null;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
}

function buildTopicNav() {
  topicNav.innerHTML = "";
  TOPICS.forEach((t, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "topic-chip" + (i === state.topic ? " active" : "");
    b.textContent = t.label;
    b.addEventListener("click", () => {
      state.topic = i;
      updateUI();
      speak(`${t.heading}. ${t.explain}`);
    });
    topicNav.appendChild(b);
  });
}

function updateUI() {
  const t = getTopic();
  topicHeading.textContent = t.heading;
  symbolStrip.textContent = t.symbolStrip;
  topicExplain.textContent = t.explain;
  topicBullets.innerHTML = t.bullets.map((b) => `<li>${b}</li>`).join("");
  boardTip.textContent = t.tip;
  finePrint.textContent = t.finePrint;
  buildTopicNav();
  draw();
}

function lifeCardsHTML(key) {
  const blocks = {
    point: [
      {
        title: "Kalem ucu",
        text: "Deftere dokunan kurşun kalem ucu çok küçük bir iz bırakır; bu iz noktaya benzer.",
        inner:
          '<div class="life-stage"><div class="anim-dot"></div><span style="position:absolute;left:8px;bottom:6px;font-size:1.6rem" aria-hidden="true">✏️</span></div>',
      },
      {
        title: "Yıldız",
        text: "Gökyüzünde parlayan yıldızlar uzaktan nokta gibi görünür.",
        inner: '<div class="life-stage" style="background:linear-gradient(180deg,#1e3a5f,#0f172a)"><div class="anim-dot" style="left:30%;top:35%;animation-delay:.3s"></div><div class="anim-dot" style="left:70%;top:55%;width:10px;height:10px;margin:-5px 0 0 -5px;animation-delay:.6s"></div><span style="position:absolute;right:10px;top:8px;font-size:1.4rem">⭐</span></div>',
      },
      {
        title: "Haritada yer",
        text: "Haritada bir şehri işaretleyen küçük nokta, tam o yeri gösterir.",
        inner:
          '<div class="life-stage"><div class="anim-dot" style="left:62%;top:58%;background:#2563eb"></div><span style="position:absolute;left:10px;bottom:6px;font-size:1.8rem">🗺️</span></div>',
      },
    ],
    segment: [
      {
        title: "Cetvelin kenarı",
        text: "Cetvelin düz kenarı iki ucu belli bir doğru parçası gibidir.",
        inner: '<div class="life-stage"><div class="anim-seg-cap anim-seg-cap--l"></div><div class="anim-seg-cap anim-seg-cap--r"></div><div class="anim-seg-bar"></div><span style="position:absolute;left:8px;top:8px;font-size:1.5rem">📏</span></div>',
      },
      {
        title: "Kitabın kenarı",
        text: "Kitabın kısa kenarı başı ve sonu belli bir doğru parçasıdır.",
        inner:
          '<div class="life-stage"><div style="position:absolute;left:50%;top:50%;width:46%;height:38%;margin:-19% 0 0 -23%;border:3px solid #92400e;border-radius:4px;background:#fffbeb"></div><span style="position:absolute;right:8px;bottom:6px;font-size:1.6rem">📚</span></div>',
      },
      {
        title: "Telefon kablosu (düz kısım)",
        text: "İki ucu tuttuğun düz ip parçası doğru parçası gibidir.",
        inner:
          '<div class="life-stage"><div class="anim-seg-cap anim-seg-cap--l" style="left:22%"></div><div class="anim-seg-cap anim-seg-cap--r" style="right:22%"></div><div class="anim-seg-bar" style="left:22%;right:22%;animation-duration:2.8s"></div><span style="position:absolute;left:8px;top:8px;font-size:1.4rem">📱</span></div>',
      },
    ],
    ray: [
      {
        title: "El feneri",
        text: "Işık elinden çıkar ve bir yönde ilerler; ışın gibi tek yönde sonsuzmuş gibi düşünülür.",
        inner: '<div class="life-stage"><div class="anim-ray-start"></div><div class="anim-ray-beam"></div><span style="position:absolute;left:6px;bottom:4px;font-size:1.6rem">🔦</span></div>',
      },
      {
        title: "Güneş ışığı",
        text: "Buluttan çıkan tek bir ışık huzmesi bir yönde uzar.",
        inner:
          '<div class="life-stage" style="background:linear-gradient(180deg,#bae6fd,#e0f2fe)"><div class="anim-ray-start" style="left:45%;top:72%"></div><div class="anim-ray-beam" style="top:42%;transform:rotate(-65deg);transform-origin:left center;width:55%"></div><span style="position:absolute;right:8px;top:6px;font-size:1.6rem">☀️</span></div>',
      },
      {
        title: "Lazer gösterimi",
        text: "Düz çizgi halinde giden ışık, başlangıcı belli bir ışın gibi düşünülebilir.",
        inner:
          '<div class="life-stage" style="background:#0f172a"><div class="anim-ray-start" style="left:20%;top:50%;background:#fca5a5"></div><div style="position:absolute;left:20%;top:50%;width:65%;height:3px;margin-top:-1.5px;background:#f87171;box-shadow:0 0 12px #ef4444"></div><span style="position:absolute;right:10px;top:8px;font-size:1.2rem;color:#fecaca">▸</span></div>',
      },
    ],
    line: [
      {
        title: "Ufuk çizgisi",
        text: "Denizde gökyüzüyle denizin birleştiği yer uzar gider; iki yönde de sonsuzmuş gibi hayal edilir.",
        inner:
          '<div class="life-stage" style="background:linear-gradient(180deg,#7dd3fc 55%,#0ea5e9 55%)"><div class="anim-line-track" style="top:55%"></div><span class="anim-arrow-fake anim-arrow-fake--l" style="top:52%;transform:scaleX(-1)">&gt;</span><span class="anim-arrow-fake anim-arrow-fake--r" style="top:52%">&gt;</span><span style="position:absolute;left:8px;top:8px;font-size:1.4rem">🌊</span></div>',
      },
      {
        title: "Demir yolu rayı",
        text: "Raylar dümdüz gider; iki yönde de uzayıp gittiğini düşünebiliriz.",
        inner:
          '<div class="life-stage" style="background:#e7e5e4"><div class="anim-line-track" style="background:#44403c;top:50%"></div><span class="anim-arrow-fake anim-arrow-fake--l" style="color:#292524;top:48%;transform:scaleX(-1)">&gt;</span><span class="anim-arrow-fake anim-arrow-fake--r" style="color:#292524;top:48%">&gt;</span><span style="position:absolute;right:8px;bottom:6px;font-size:1.5rem">🚃</span></div>',
      },
      {
        title: "Orman yolu",
        text: "Düz bir patika iki yönde de uzayıp gidebilir; doğru modeli gibidir.",
        inner:
          '<div class="life-stage" style="background:linear-gradient(180deg,#bbf7d0,#86efac)"><div class="anim-line-track" style="background:#166534;top:48%;transform:rotate(-6deg)"></div><span style="position:absolute;left:10px;bottom:8px;font-size:1.5rem">🌲</span></div>',
      },
    ],
    angle: [
      {
        title: "Makas",
        text: "Makasın iki kolu tepe noktasından açılır; bu bir açı modelidir.",
        inner: '<div class="life-stage"><div class="anim-angle-scissor" aria-hidden="true">✂️</div></div>',
      },
      {
        title: "Kapı",
        text: "Kapı çerçeve ile kapı levhası arasında bir açıklık oluşur.",
        inner:
          '<div class="life-stage" style="background:linear-gradient(90deg,#cbd5e1,#e2e8f0)"><div style="position:absolute;left:28%;top:22%;width:8%;height:56%;background:#92400e;border-radius:2px"></div><div style="position:absolute;left:34%;top:28%;width:22%;height:46%;background:#fdba74;transform-origin:left center;animation:life-scissor 2.5s ease-in-out infinite;border-radius:2px"></div><span style="position:absolute;right:10px;bottom:8px;font-size:1.4rem">🚪</span></div>',
      },
      {
        title: "Saat akrebi ve yelkovanı",
        text: "Saatte iki kol aynı merkezden çıkar; aradaki açıklık açıdır.",
        inner:
          '<div class="life-stage"><div style="position:absolute;left:50%;top:52%;width:3px;height:32%;margin:-32% 0 0 -1.5px;background:#0f172a;transform-origin:50% 100%;transform:rotate(-60deg);animation:life-scissor 3s ease-in-out infinite"></div><div style="position:absolute;left:50%;top:52%;width:2px;height:26%;margin:-26% 0 0 -1px;background:#dc2626;transform-origin:50% 100%;transform:rotate(20deg)"></div><span style="position:absolute;left:8px;top:8px;font-size:1.5rem">🕐</span></div>',
      },
      {
        title: "Açık kitap",
        text: "Kitap iki sayfa arasında açıklık oluşturur.",
        inner:
          '<div class="life-stage" style="background:#fff7ed"><div style="position:absolute;left:50%;top:22%;width:3px;height:56%;margin-left:-1.5px;background:#78716c"></div><div style="position:absolute;left:50%;top:28%;width:24%;height:42%;margin-left:-2px;background:#fef3c7;border:2px solid #d97706;transform-origin:left bottom;transform:rotate(-18deg);animation:life-scissor 2.8s ease-in-out infinite;border-radius:4px"></div><div style="position:absolute;left:50%;top:28%;width:24%;height:42%;margin-left:2px;background:#fef9c3;border:2px solid #ca8a04;transform-origin:right bottom;transform:rotate(18deg);animation:life-scissor 2.8s ease-in-out infinite reverse;border-radius:4px"></div><span style="position:absolute;right:8px;bottom:6px;font-size:1.4rem">📖</span></div>',
      },
    ],
  };
  const list = blocks[key] || [];
  return list
    .map(
      (c) => `
    <article class="life-card">
      <h3>${c.title}</h3>
      <p>${c.text}</p>
      ${c.inner}
    </article>`
    )
    .join("");
}

function openLifeModal() {
  const t = getTopic();
  lifeModalSub.textContent = `Şu anki konu: ${t.heading}`;
  lifeModalBody.innerHTML = lifeCardsHTML(t.key);
  lifeModal.hidden = false;
  lifeModal.setAttribute("aria-hidden", "false");
}

function closeLifeModal() {
  lifeModal.setAttribute("aria-hidden", "true");
  lifeModal.hidden = true;
}

function init() {
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "../../index.html";
    });
  }

  setSound(false);
  toggleSoundBtn.addEventListener("click", () => {
    setSound(!sound.enabled);
    if (sound.enabled) speak(`${getTopic().heading}. ${getTopic().explain}`);
  });
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      sound.voice = pickTurkishVoice();
    };
  }

  openLifeBtn.addEventListener("click", openLifeModal);
  lifeModalClose.addEventListener("click", closeLifeModal);
  lifeModalBackdrop.addEventListener("click", closeLifeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lifeModal.hidden) closeLifeModal();
  });

  buildTopicNav();
  updateUI();
  bindCanvas();

  window.addEventListener("resize", () => draw());
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
  }
}

init();

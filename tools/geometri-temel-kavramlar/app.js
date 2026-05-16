const canvas = document.getElementById("sceneCanvas");
const ctx = canvas.getContext("2d");

const backBtn = document.getElementById("backToDuellomatik");
const topicNav = document.getElementById("topicNav");
const topicHeading = document.getElementById("topicHeading");
const symbolStrip = document.getElementById("symbolStrip");
const topicExplain = document.getElementById("topicExplain");
const topicBullets = document.getElementById("topicBullets");

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
    symbolStrip: "Kitapta: “· A” veya “A noktası” diye yazarız",
    explain:
      "Nokta, bir yeri göstermek için kullandığımız çok küçük bir işarettir. Boyu ve eni yokmuş gibi düşünürüz. Noktalara genelde A, B, C gibi büyük harfle isim veririz.",
    bullets: [
      "İki doğru çizip kesiştirdiğinde, kesiştikleri yer bir noktadır.",
      "Tam üst üste gelen iki nokta aslında tek noktadır.",
    ],
  },
  {
    key: "segment",
    label: "Doğru parçası",
    heading: "Doğru parçası",
    symbolStrip: "Gösterim: • ———— •  (iki uçta nokta; çizgi burada biter)",
    explain:
      "Başlangıcı ve sonu belli olan düz çizgiye doğru parçası denir. Yani bir A noktasından bir B noktasına kadar gider; uzunluğu ölçülebilir.",
    bullets: [
      "İki uçta nokta vardır (örnek: A ve B).",
      "Düz gidebilir: yatay, dikey veya eğik.",
      "Doğru ve ışından farkı: burada iki yan da biter; ok yoktur.",
    ],
  },
  {
    key: "ray",
    label: "Işın",
    heading: "Işın",
    symbolStrip: "Gösterim: • ————>  (bir uçta nokta; diğer uçta sonsuzluğu gösteren ok)",
    explain:
      "Bir ucu belli olan ve öbür tarafa doğru düz bir çizgi gibi uzayıp giden doğruya ışın denir. Başladığı yer noktadır. Gittiği tarafta ok (>) ile “burada bitmiyor, devam ediyor” deriz.",
    bullets: [
      "Bir ucu başlangıç noktasıdır.",
      "Diğer uçta ok (>) vardır; o yönde sonsuza gider.",
      "Hayatta tek yöne doğru düz giden yolu düşün: örneğin düz bir koşu pistinde ileri doğru koşmak.",
    ],
  },
  {
    key: "line",
    label: "Doğru",
    heading: "Doğru",
    symbolStrip: "Gösterim: > ———— <  (iki uçta da ok; iki yöne sonsuz)",
    explain:
      "Her iki yönde de durmadan uzayan düz çizgiye doğru denir. Başlangıç ve bitiş noktası yoktur; üzerinde sonsuz tane nokta vardır. Çizimde iki uçta ok (>) kullanırız.",
    bullets: [
      "İki yönde de sonsuzdur.",
      "Üzerinde sonsuz çok nokta vardır.",
      "Doğru parçasından farkı: uçları yoktur; iki yanda ok vardır.",
    ],
  },
  {
    key: "angle",
    label: "Açı",
    heading: "Açı",
    symbolStrip: "İki ışın; ortada köşe (tepe), kollarda ok (>)",
    explain:
      "Aynı noktadan çıkan iki ışının arasında kalan açıklığa açı denir. Ortak başlangıç noktasına köşe veya tepe deriz. Çıkan iki düz yola da kenar deriz; bunlar ışındır.",
    bullets: [
      "Köşe (tepe): iki kenarın birleştiği ortak nokta.",
      "Kenar: köşeden çıkan ışınlar.",
      "Kenar ucunda ok (>) vardır; kenarın sonsuza uzadığını gösterir.",
    ],
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

/** Kitaptaki gibi tek “>” ok ucu (iki çizgi) */
function drawChevronHead(tipX, tipY, fromX, fromY, len, color, lineW) {
  const ang = Math.atan2(tipY - fromY, tipX - fromX);
  const wing = 0.58;
  const L = len * 1.08;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineW;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - Math.cos(ang - wing) * L, tipY - Math.sin(ang - wing) * L);
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - Math.cos(ang + wing) * L, tipY - Math.sin(ang + wing) * L);
  ctx.stroke();
  ctx.restore();
}

function pathRoundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

/** Geometrik nokta: küçük dolu daire (defterdeki gibi) */
function drawConceptPoint(x, y, label, color) {
  const w = canvas.width;
  const h = canvas.height;
  const rr = Math.max(5.5, Math.min(11, Math.min(w, h) * 0.014));
  ctx.save();
  ctx.fillStyle = color || "#0f172a";
  ctx.beginPath();
  ctx.arc(x, y, rr, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = Math.max(1, rr * 0.14);
  ctx.stroke();
  ctx.fillStyle = "#0f172a";
  ctx.font = `800 ${Math.round(rr + 9)}px Segoe UI, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(label, x, y - rr - 3);
  ctx.restore();
}

/** Sürükleme tutamacı: sevimli emoji (harf yok — köşe adı sanılmasın) */
const DRAG_HANDLE_EMOJI = {
  ray: { B: "🔦" },
  line: { A: "↔️", B: "↔️" },
  angle: { B: "💙", C: "💚" },
};

function drawDragHandle(x, y, color, emoji) {
  const w = canvas.width;
  const h = canvas.height;
  const half = Math.max(15, Math.min(22, Math.min(w, h) * 0.03));
  const stroke = color || "#334155";
  const icon = emoji || "🖐️";
  ctx.save();
  pathRoundRect(ctx, x - half, y - half, half * 2, half * 2, 8);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(2.2, half * 0.12);
  ctx.stroke();
  ctx.shadowColor = "rgba(15, 23, 42, 0.18)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  const fontPx = Math.round(half * 1.35);
  ctx.font = `${fontPx}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(icon, x, y + 1);
  ctx.restore();
}

/** Ok ucuna yakın: gidiş yönünde küçük noktalar (“uzayıp gidiyor” fikri) */
function drawInfinityTrailDotsNearTip(Ax, Ay, ex, ey, color) {
  const vx = ex - Ax;
  const vy = ey - Ay;
  const L = Math.hypot(vx, vy) || 1;
  const ux = vx / L;
  const uy = vy / L;
  const d0 = L * 0.68;
  const d1 = L * 0.9;
  const n = 5;
  ctx.save();
  for (let i = 0; i < n; i += 1) {
    const u = n === 1 ? 0.5 : i / (n - 1);
    const s = d0 + (d1 - d0) * u;
    const x = Ax + ux * s;
    const y = Ay + uy * s;
    const alpha = 0.22 + u * 0.55;
    const rr = Math.max(2.2, Math.min(L, canvas.width) * 0.006);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** Sonsuz doğru: her iki uçtan köşeye doğru küçük noktalar (sonsuzluk izlenimi) */
function drawLineInfinityTrailDots(x1, y1, x2, y2, mx, my, color) {
  const placeSide = (tipX, tipY) => {
    const vx = mx - tipX;
    const vy = my - tipY;
    const span = Math.hypot(vx, vy) || 1;
    const ux = vx / span;
    const uy = vy / span;
    const n = 4;
    for (let i = 0; i < n; i += 1) {
      const t = 0.28 + (0.62 * i) / Math.max(1, n - 1);
      const s = span * t;
      const x = tipX + ux * s;
      const y = tipY + uy * s;
      const alpha = 0.2 + (i / Math.max(1, n - 1)) * 0.48;
      const rr = Math.max(2, Math.min(canvas.width, canvas.height) * 0.005);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, TAU);
      ctx.fill();
    }
  };
  ctx.save();
  placeSide(x1, y1);
  placeSide(x2, y2);
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
  const ch = Math.max(15, lw * 4);
  drawLineInfinityTrailDots(x1, y1, x2, y2, mx, my, color);
  drawChevronHead(x1, y1, x1 + ux * ch * 2.4, y1 + uy * ch * 2.4, ch, color, Math.max(2.8, lw * 0.88));
  drawChevronHead(x2, y2, x2 - ux * ch * 2.4, y2 - uy * ch * 2.4, ch, color, Math.max(2.8, lw * 0.88));
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
  drawInfinityTrailDotsNearTip(Ax, Ay, end.x, end.y, color);
  const ch = Math.max(15, lw * 4);
  drawChevronHead(end.x, end.y, end.x - ux * ch * 2.8, end.y - uy * ch * 2.8, ch, color, Math.max(2.8, lw * 0.88));
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
  ctx.restore();
  return deg;
}

/** Derece etiketi — köşe noktasının üstünde, 180° gibi düz açılarda okunaklı */
function drawAngleDegreeLabel(Ax, Ay, Bx, By, Cx, Cy, r, deg) {
  const v1x = Bx - Ax;
  const v1y = By - Ay;
  const v2x = Cx - Ax;
  const v2y = Cy - Ay;
  const n1 = Math.hypot(v1x, v1y) || 1;
  const n2 = Math.hypot(v2x, v2y) || 1;
  const bx = v1x / n1 + v2x / n2;
  const by = v1y / n1 + v2y / n2;
  const ml = Math.hypot(bx, by) || 1;
  const ux = bx / ml;
  const uy = by / ml;

  let lx;
  let ly;
  const pad = Math.max(22, r + 14);
  if (deg >= 150) {
    lx = Ax;
    ly = Ay - pad;
  } else if (deg <= 25) {
    lx = Ax + ux * pad;
    ly = Ay + uy * pad;
  } else {
    lx = Ax + ux * (r + 22);
    ly = Ay + uy * (r + 22);
  }

  const fs = Math.max(14, Math.min(canvas.width, canvas.height) * 0.034);
  const label = `${deg}°`;
  ctx.save();
  ctx.font = `900 ${fs}px Segoe UI, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(label).width;
  const boxPadX = 8;
  const boxPadY = 5;
  const bw = tw + boxPadX * 2;
  const bh = fs + boxPadY * 2;
  pathRoundRect(ctx, lx - bw / 2, ly - bh / 2, bw, bh, 8);
  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  ctx.fill();
  ctx.strokeStyle = "rgba(234, 88, 12, 0.55)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#c2410c";
  ctx.fillText(label, lx, ly + 1);
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
    drawConceptPoint(pA.x, pA.y, "A", "#b45309");
  } else if (topic.key === "segment") {
    const pA = toPixel(pts.A.gx, pts.A.gy, lay);
    const pB = toPixel(pts.B.gx, pts.B.gy, lay);
    drawSegmentSolid(pA.x, pA.y, pB.x, pB.y, "#1d4ed8", lw + 0.5);
    drawConceptPoint(pA.x, pA.y, "A", "#1e40af");
    drawConceptPoint(pB.x, pB.y, "B", "#1e40af");
  } else if (topic.key === "ray") {
    const pA = toPixel(pts.A.gx, pts.A.gy, lay);
    const pB = toPixel(pts.B.gx, pts.B.gy, lay);
    drawRayWithArrow(pA.x, pA.y, pB.x, pB.y, "#047857", lw + 0.5);
    drawConceptPoint(pA.x, pA.y, "A", "#0f766e");
    drawDragHandle(pB.x, pB.y, "#047857", DRAG_HANDLE_EMOJI.ray.B);
  } else if (topic.key === "line") {
    const pA = toPixel(pts.A.gx, pts.A.gy, lay);
    const pB = toPixel(pts.B.gx, pts.B.gy, lay);
    drawInfiniteDoubleArrow(pA.x, pA.y, pB.x, pB.y, "#6d28d9", lw + 0.5);
    drawDragHandle(pA.x, pA.y, "#5b21b6", DRAG_HANDLE_EMOJI.line.A);
    drawDragHandle(pB.x, pB.y, "#5b21b6", DRAG_HANDLE_EMOJI.line.B);
  } else if (topic.key === "angle") {
    const pA = toPixel(pts.A.gx, pts.A.gy, lay);
    const pB = toPixel(pts.B.gx, pts.B.gy, lay);
    const pC = toPixel(pts.C.gx, pts.C.gy, lay);
    const rArc = Math.min(w, h) * 0.11;
    const deg = drawAngleWedge(pA.x, pA.y, pB.x, pB.y, pC.x, pC.y, rArc, "rgba(251, 146, 60, 0.22)");
    drawRayWithArrow(pA.x, pA.y, pB.x, pB.y, "#1d4ed8", lw);
    drawRayWithArrow(pA.x, pA.y, pC.x, pC.y, "#047857", lw);
    drawConceptPoint(pA.x, pA.y, "A", "#b45309");
    drawDragHandle(pB.x, pB.y, "#1d4ed8", DRAG_HANDLE_EMOJI.angle.B);
    drawDragHandle(pC.x, pC.y, "#047857", DRAG_HANDLE_EMOJI.angle.C);
    drawAngleDegreeLabel(pA.x, pA.y, pB.x, pB.y, pC.x, pC.y, rArc, deg);
  }
}

function dragHitRadiusPx(topicKey, key, lay) {
  const cell = Math.min(lay.cellW, lay.cellH);
  const base = Math.max(26, cell * 0.88);
  if (topicKey === "ray" && key === "B") return Math.max(base, 40);
  if (topicKey === "line") return Math.max(base, 40);
  if (topicKey === "angle" && (key === "B" || key === "C")) return Math.max(base, 40);
  return base;
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
    const maxD = dragHitRadiusPx(topic.key, k, lay);
    if (d <= maxD && d < bestD) {
      bestD = d;
      best = k;
    }
  });
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
  buildTopicNav();
  draw();
}

function lifeScene(mod, art, hint) {
  return (
    '<div class="life-stage life-stage--' +
    mod +
    '"><div class="life-art">' +
    art +
    '</div><p class="life-geo-hint">' +
    hint +
    "</p></div>"
  );
}

function lifeCardsHTML(key) {
  const blocks = {
    point: [
      {
        title: "Kalemle işaret",
        text: "Deftere çok hafif dokunduğunda küçücük bir nokta bırakırsın. Geometride nokta, tam bir yeri göstermek için kullanılır.",
        note: "Gerçekte izin çok az kalınlığı olabilir; biz onu nokta gibi düşünürüz.",
        inner:
          '<div class="life-stage life-stage--desk"><div class="life-desk-shade"></div><div class="anim-dot"></div><span class="life-emoji life-emoji--corner" aria-hidden="true">✏️</span></div>',
      },
      {
        title: "Yıldızlar",
        text: "Gece gökyüzünde yıldızlar çok uzaktadır; bize küçük parlak noktalar gibi görünürler.",
        inner:
          '<div class="life-stage life-stage--night"><div class="life-night-glow"></div><div class="anim-dot" style="left:30%;top:35%;animation-delay:.3s"></div><div class="anim-dot anim-dot--small" style="left:70%;top:55%;animation-delay:.6s"></div><span class="life-emoji life-emoji--corner-tr" aria-hidden="true">⭐</span></div>',
      },
      {
        title: "Haritada nokta",
        text: "Haritada bir şehri gösteren küçük işaret, tam o yeri anlatır. Tıpkı geometrideki nokta gibi bir yeri seçer.",
        inner:
          '<div class="life-stage life-stage--map"><div class="life-map-grid"></div><div class="anim-dot" style="left:62%;top:58%;background:#1d4ed8"></div><span class="life-emoji life-emoji--corner" aria-hidden="true">🗺️</span></div>',
      },
    ],
    segment: [
      {
        title: "Cetvelin kenarı",
        text: "Cetvelin düz kenarı iki uç arasında biter. Başı ve sonu belli bir doğru parçası gibidir.",
        inner: '<div class="life-stage life-stage--wood"><div class="life-wood-grain"></div><div class="anim-seg-cap anim-seg-cap--l"></div><div class="anim-seg-cap anim-seg-cap--r"></div><div class="anim-seg-bar"></div><span class="life-emoji life-emoji--corner" aria-hidden="true">📏</span></div>',
      },
      {
        title: "Kitabın kenarı",
        text: "Kitabın düz kenarı da iki nokta arasında düşünülebilir: kenarın bir ucundan diğer ucuna kadar.",
        inner:
          '<div class="life-stage life-stage--paper-seg"><div class="life-book-3d"><div class="life-book-spine-seg"></div><div class="life-book-pages"></div><div class="life-book-seg-line"></div></div></div>',
      },
      {
        title: "İki direk arası ip",
        text: "İki ağaç veya direk arasına gerilmiş düz ip, iki ucu belli bir doğru parçasıdır.",
        inner:
          '<div class="life-stage life-stage--outdoor"><div class="life-pole life-pole--l"></div><div class="life-pole life-pole--r"></div><div class="anim-seg-bar anim-seg-bar--rope" style="left:26%;right:26%"></div><span class="life-emoji life-emoji--corner" aria-hidden="true">🪢</span></div>',
      },
    ],
    ray: [
      {
        title: "El feneri",
        text: "El fenerinde ışığın gittiği yön bellidir. Geometride ışın, bir ucu belli ve bir yöne doğru uzayan düz çizgidir.",
        note: "Gerçek ışık hafifçe yayılır; burada çizgiyi matematikteki ışın gibi düşünüyoruz.",
        inner: '<div class="life-stage life-stage--flashlight"><div class="anim-ray-device"></div><div class="anim-ray-beam anim-ray-beam--from-device"></div><span class="life-emoji life-emoji--corner" aria-hidden="true">🔦</span></div>',
      },
      {
        title: "Pencereden giren güneş",
        text: "Odanın içine düz bir şerit halinde giren güneş ışığı yönü gösterir. Başlangıcı pencere kenarına yakındır; gidişi tek yöndedir.",
        note: "Havadaki tozlar ışığı biraz dağıtabilir; modelimizde düz çizgi kullanıyoruz.",
        inner:
          '<div class="life-stage life-stage--window"><div class="life-window-frame"></div><div class="anim-ray-device anim-ray-device--small" style="left:44%;top:70%"></div><div class="anim-ray-beam anim-ray-beam--sun" style="top:40%;left:44%;width:52%"></div><span class="life-emoji life-emoji--corner-tr" aria-hidden="true">☀️</span></div>',
      },
      {
        title: "Sınıfta lazer çizgisi",
        text: "Tahtada gösterilen düz lazer çizgisi, başlangıcı belli ve yönü net bir ışın gibi düşünülebilir.",
        note: "Gerçek lazer de çok hafif yayılır; ama çizimde tek yönlü düz çizgi gibi gösteririz.",
        inner:
          '<div class="life-stage life-stage--laser"><div class="life-laser-haze"></div><div class="anim-ray-device anim-ray-device--tiny" style="left:18%;top:50%"></div><div class="life-laser-line"></div><span class="life-emoji life-emoji--corner-tr" style="color:#fecaca;font-size:1.05rem;font-weight:900" aria-hidden="true">&gt;</span></div>',
      },
    ],
    line: [
      {
        title: "Ufuk çizgisi",
        text: "Denizde gökyüzü ile suyun birleştiği çizgiyi uzun süre izlersen, iki yöne de uzayıp gittiğini hayal edebilirsin. Doğru buna benzetilir.",
        inner:
          '<div class="life-stage life-stage--horizon"><div class="life-sun"></div><div class="life-sky-band"></div><div class="life-sea-band"><div class="life-wave"></div><div class="life-wave life-wave--2"></div></div><div class="life-horizon-line"></div><span class="life-line-arrow life-line-arrow--l" aria-hidden="true"></span><span class="life-line-arrow life-line-arrow--r" aria-hidden="true"></span></div>',
      },
      {
        title: "Demir yolu",
        text: "Raylar dümdüz gider. İki yönde de uzayıp gittiğini düşünürsek, sonsuz doğruya benzer.",
        inner:
          '<div class="life-stage life-stage--rail"><div class="life-rail-sky"></div><div class="life-rail-bed"></div><div class="life-rail-tie life-rail-tie--1"></div><div class="life-rail-tie life-rail-tie--2"></div><div class="life-rail-tie life-rail-tie--3"></div><div class="life-rail-steel-pair"></div><span class="life-line-arrow life-line-arrow--l life-line-arrow--dark" aria-hidden="true"></span><span class="life-line-arrow life-line-arrow--r life-line-arrow--dark" aria-hidden="true"></span><span class="life-rail-train" aria-hidden="true"></span></div>',
      },
      {
        title: "Düz orman yolu",
        text: "İki yöne de uzayan düz bir patika, aklında doğruyu canlandırmana yardım eder. Yolun sonunu görmesen de dümdüz devam eder.",
        inner:
          '<div class="life-stage life-stage--forest-path"><div class="life-forest-trees life-forest-trees--back"></div><div class="life-forest-trees life-forest-trees--front"></div><div class="life-path-ground"></div><div class="life-path-center-line"></div><span class="life-line-arrow life-line-arrow--l life-line-arrow--green" aria-hidden="true"></span><span class="life-line-arrow life-line-arrow--r life-line-arrow--green" aria-hidden="true"></span></div>',
      },
    ],
    angle: [
      {
        title: "Makas",
        text: "Makasın ortadaki vidası köşe gibidir. İki bıçak açılınca arada bir açıklık oluşur; bu açıya benzer.",
        inner: lifeScene(
          "ang-scissor",
          '<span class="life-illus life-illus--scissor"><span class="life-illus__emoji">✂️</span><span class="life-illus__arc life-illus__arc--sm"></span></span>',
          "Vida = köşe · Bıçaklar = kenarlar"
        ),
      },
      {
        title: "Açılmış kapı",
        text: "Kapıyı içeri doğru araladığında, kapı ile duvardaki kapı çerçevesi arasında bir boşluk oluşur. Bu boşluğun büyüklüğü bir açıdır.",
        inner: lifeScene(
          "ang-door",
          '<span class="life-illus life-illus--door"><span class="life-illus__wall"></span><span class="life-illus__door"></span><span class="life-illus__arc"></span></span>',
          "Kapı ile duvar arası = açı"
        ),
      },
      {
        title: "Saatte kollar",
        text: "Akrep ile yelkovan ortadaki noktadan çıkar. Aralarındaki boşluk bir açıdır; saat okurken bu boşluğa bakarız.",
        note: "Genelde akrep saati, yelkovan dakikayı gösterir.",
        inner: lifeScene(
          "ang-clock",
          '<span class="life-illus life-illus--clock"><span class="life-illus__clock-face"></span><span class="life-illus__clock-fan"></span><span class="life-illus__clock-hour"></span><span class="life-illus__clock-minute"></span></span>',
          "Akrep–yelkovan arası = açı"
        ),
      },
      {
        title: "Açık kitap",
        text: "Kitabı ortadan açınca iki sayfa birleşme yerinden (sırt) ayrılır. Sayfalar arasındaki açıklık da açı fikrini hatırlatır.",
        inner: lifeScene(
          "ang-book",
          '<span class="life-illus life-illus--book"><span class="life-illus__spine"></span><span class="life-illus__page life-illus__page--l"></span><span class="life-illus__page life-illus__page--r"></span><span class="life-illus__arc life-illus__arc--book"></span></span>',
          "Açık sayfalar arası = açı"
        ),
      },
    ],
  };
  const list = blocks[key] || [];
  return list
    .map(
      (c) => `
    <article class="life-card">
      <h3>${c.title}</h3>
      <p class="life-card__text">${c.text}</p>
      ${c.note ? `<p class="life-card__note">${c.note}</p>` : ""}
      ${c.inner}
    </article>`
    )
    .join("");
}

function openLifeModal() {
  const t = getTopic();
  lifeModalSub.textContent = `Şimdi “${t.heading}” konusuna bakıyorsun. Aşağıdaki örnekler sadece fikir verir.`;
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

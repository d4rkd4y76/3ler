(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const shapeChips = $("shapeChips");
  const svgWrap = $("svgWrap");
  const shapeTitle = $("shapeTitle");
  const learnKicker = $("learnKicker");
  const learnText = $("learnText");
  const miniList = $("miniList");
  const stepPill = $("stepPill");
  const replayBtn = $("replayBtn");
  const backBtn = $("backBtn");
  const warningBox = $("warningBox");

  const STEPS = /** @type {const} */ (["corners", "edges", "equal"]);
  const STEP_LABEL = {
    corners: "Köşeler",
    edges: "Kenarlar",
    equal: "Eşitlikler",
  };

  /** Helpers **/
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function safeCloseOrHome() {
    try {
      // If opened via window.open, closing should work.
      window.close();
    } catch {}
    // Fallback: go back to app home.
    window.location.href = "../../index.html";
  }

  backBtn?.addEventListener("click", safeCloseOrHome);

  const SHAPES = [
    {
      id: "square",
      emoji: "🟦",
      name: "Kare",
      corners: 4,
      edges: 4,
      equal: "Karede 4 kenarın hepsi eşittir.",
      mini: [
        "4 köşe (köşeler noktadır).",
        "4 kenar (kenarlar doğru parçalarıdır).",
        "Tüm kenarlar eşit olduğu için kare “eşit kenarlı”dır.",
      ],
      svg: () => {
        // Square centered in 200x200 viewBox
        return `
          <svg viewBox="0 0 200 200" role="img" aria-label="Kare" xmlns="http://www.w3.org/2000/svg">
            <rect class="shape-fill" x="40" y="40" width="120" height="120" rx="6"></rect>
            <line class="edge" data-edge="0" x1="40" y1="40" x2="160" y2="40"></line>
            <line class="edge" data-edge="1" x1="160" y1="40" x2="160" y2="160"></line>
            <line class="edge" data-edge="2" x1="160" y1="160" x2="40" y2="160"></line>
            <line class="edge" data-edge="3" x1="40" y1="160" x2="40" y2="40"></line>
            <circle class="vtx" data-vtx="0" cx="40" cy="40" r="8"></circle>
            <circle class="vtx" data-vtx="1" cx="160" cy="40" r="8"></circle>
            <circle class="vtx" data-vtx="2" cx="160" cy="160" r="8"></circle>
            <circle class="vtx" data-vtx="3" cx="40" cy="160" r="8"></circle>
            <text class="vtx-label" data-vtx-label="0" x="24" y="28" text-anchor="middle">1</text>
            <text class="vtx-label" data-vtx-label="1" x="176" y="28" text-anchor="middle">2</text>
            <text class="vtx-label" data-vtx-label="2" x="176" y="188" text-anchor="middle">3</text>
            <text class="vtx-label" data-vtx-label="3" x="24" y="188" text-anchor="middle">4</text>
            <text class="edge-label" data-edge-label="0" x="100" y="18" text-anchor="middle">1</text>
            <text class="edge-label" data-edge-label="1" x="186" y="104" text-anchor="middle">2</text>
            <text class="edge-label" data-edge-label="2" x="100" y="198" text-anchor="middle">3</text>
            <text class="edge-label" data-edge-label="3" x="14" y="104" text-anchor="middle">4</text>

            <!-- measurement -->
            <line class="measure" data-measure="a" x1="55" y1="28" x2="145" y2="28"></line>
            <text class="m-label" data-mlabel="a" x="100" y="22" text-anchor="middle"></text>
            <line class="measure" data-measure="a2" x1="172" y1="55" x2="172" y2="145"></line>
            <text class="m-label" data-mlabel="a2" x="178" y="104" text-anchor="start"></text>
            <line class="measure" data-measure="a3" x1="55" y1="172" x2="145" y2="172"></line>
            <text class="m-label" data-mlabel="a3" x="100" y="196" text-anchor="middle"></text>
            <line class="measure" data-measure="a4" x1="28" y1="55" x2="28" y2="145"></line>
            <text class="m-label" data-mlabel="a4" x="22" y="104" text-anchor="end"></text>
          </svg>
        `;
      },
    },
    {
      id: "rectangle",
      emoji: "🟦",
      name: "Dikdörtgen",
      corners: 4,
      edges: 4,
      equal: "Dikdörtgende karşılıklı kenarlar eşittir.",
      mini: [
        "4 köşe, 4 kenar.",
        "Üst–alt kenar eşit, sağ–sol kenar eşittir.",
        "Köşeler “dik”tir (90°).",
      ],
      svg: () => {
        return `
          <svg viewBox="0 0 220 200" role="img" aria-label="Dikdörtgen" xmlns="http://www.w3.org/2000/svg">
            <rect class="shape-fill" x="40" y="55" width="140" height="90" rx="6"></rect>
            <line class="edge" data-edge="0" x1="40" y1="55" x2="180" y2="55"></line>
            <line class="edge" data-edge="1" x1="180" y1="55" x2="180" y2="145"></line>
            <line class="edge" data-edge="2" x1="180" y1="145" x2="40" y2="145"></line>
            <line class="edge" data-edge="3" x1="40" y1="145" x2="40" y2="55"></line>
            <circle class="vtx" data-vtx="0" cx="40" cy="55" r="8"></circle>
            <circle class="vtx" data-vtx="1" cx="180" cy="55" r="8"></circle>
            <circle class="vtx" data-vtx="2" cx="180" cy="145" r="8"></circle>
            <circle class="vtx" data-vtx="3" cx="40" cy="145" r="8"></circle>
            <text class="vtx-label" data-vtx-label="0" x="22" y="46" text-anchor="middle">1</text>
            <text class="vtx-label" data-vtx-label="1" x="198" y="46" text-anchor="middle">2</text>
            <text class="vtx-label" data-vtx-label="2" x="198" y="174" text-anchor="middle">3</text>
            <text class="vtx-label" data-vtx-label="3" x="22" y="174" text-anchor="middle">4</text>
            <text class="edge-label" data-edge-label="0" x="110" y="32" text-anchor="middle">1</text>
            <text class="edge-label" data-edge-label="1" x="208" y="105" text-anchor="middle">2</text>
            <text class="edge-label" data-edge-label="2" x="110" y="198" text-anchor="middle">3</text>
            <text class="edge-label" data-edge-label="3" x="12" y="105" text-anchor="middle">4</text>

            <line class="measure" data-measure="a" x1="58" y1="40" x2="162" y2="40"></line>
            <text class="m-label" data-mlabel="a" x="110" y="34" text-anchor="middle"></text>
            <line class="measure" data-measure="a2" x1="58" y1="160" x2="162" y2="160"></line>
            <text class="m-label" data-mlabel="a2" x="110" y="194" text-anchor="middle"></text>

            <line class="measure" data-measure="b" x1="195" y1="70" x2="195" y2="130"></line>
            <text class="m-label" data-mlabel="b" x="202" y="105" text-anchor="start"></text>
            <line class="measure" data-measure="b2" x1="25" y1="70" x2="25" y2="130"></line>
            <text class="m-label" data-mlabel="b2" x="18" y="105" text-anchor="end"></text>
          </svg>
        `;
      },
    },
    {
      id: "triangle",
      emoji: "🔺",
      name: "Üçgen",
      corners: 3,
      edges: 3,
      equal: "Bazı üçgenlerde 2 kenar eşit olabilir (ikizkenar).",
      mini: [
        "3 köşe, 3 kenar.",
        "Üçgenin kenarları doğru parçalarıdır.",
        "İkizkenar üçgende 2 kenar eşittir.",
      ],
      svg: () => {
        return `
          <svg viewBox="0 0 220 200" role="img" aria-label="Üçgen" xmlns="http://www.w3.org/2000/svg">
            <path class="shape-fill" d="M110 35 L185 160 L35 160 Z"></path>
            <line class="edge" data-edge="0" x1="110" y1="35" x2="185" y2="160"></line>
            <line class="edge" data-edge="1" x1="185" y1="160" x2="35" y2="160"></line>
            <line class="edge" data-edge="2" x1="35" y1="160" x2="110" y2="35"></line>
            <circle class="vtx" data-vtx="0" cx="110" cy="35" r="8"></circle>
            <circle class="vtx" data-vtx="1" cx="185" cy="160" r="8"></circle>
            <circle class="vtx" data-vtx="2" cx="35" cy="160" r="8"></circle>
            <text class="vtx-label" data-vtx-label="0" x="110" y="18" text-anchor="middle">1</text>
            <text class="vtx-label" data-vtx-label="1" x="204" y="188" text-anchor="middle">2</text>
            <text class="vtx-label" data-vtx-label="2" x="16" y="188" text-anchor="middle">3</text>
            <text class="edge-label" data-edge-label="0" x="160" y="96" text-anchor="middle">1</text>
            <text class="edge-label" data-edge-label="1" x="110" y="186" text-anchor="middle">2</text>
            <text class="edge-label" data-edge-label="2" x="60" y="96" text-anchor="middle">3</text>

            <line class="measure" data-measure="a" x1="120" y1="50" x2="180" y2="150"></line>
            <text class="m-label" data-mlabel="a" x="170" y="92" text-anchor="middle"></text>
            <line class="measure" data-measure="a2" x1="40" y1="150" x2="100" y2="50"></line>
            <text class="m-label" data-mlabel="a2" x="50" y="92" text-anchor="middle"></text>
          </svg>
        `;
      },
    },
    {
      id: "circle",
      emoji: "⭕",
      name: "Daire",
      corners: 0,
      edges: 0,
      equal: "Dairede köşe ve kenar yoktur. Her yer yuvarlaktır.",
      mini: [
        "Köşe yok.",
        "Kenar (düz çizgi) yok.",
        "Daire yuvarlaktır.",
      ],
      svg: () => {
        return `
          <svg viewBox="0 0 200 200" role="img" aria-label="Daire" xmlns="http://www.w3.org/2000/svg">
            <circle class="shape-fill" cx="100" cy="100" r="70"></circle>
            <circle class="edge" data-edge="0" cx="100" cy="100" r="70" fill="none"></circle>
          </svg>
        `;
      },
    },
  ];

  let activeShapeId = "square";
  let activeStep = "corners";
  let playToken = 0;

  function setStep(step) {
    if (!STEPS.includes(step)) step = "corners";
    activeStep = step;
    document.body.dataset.step = step;

    document.querySelectorAll(".tab").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-step") === step);
    });

    const idx = STEPS.indexOf(step);
    stepPill.textContent = `${idx + 1} / ${STEPS.length}`;
    learnKicker.textContent = STEP_LABEL[step] || "Anlatım";

    renderText();
    play();
  }

  function setShape(id) {
    activeShapeId = id;

    document.querySelectorAll(".chip").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-shape") === id);
    });

    const shape = SHAPES.find((s) => s.id === id) || SHAPES[0];
    shapeTitle.textContent = shape.name;
    svgWrap.innerHTML = shape.svg();
    injectLuxDefs();

    renderText();
    play();
  }

  function setWarning(html) {
    if (!warningBox) return;
    if (!html) {
      warningBox.hidden = true;
      warningBox.innerHTML = "";
      return;
    }
    warningBox.hidden = false;
    warningBox.innerHTML = html;
  }

  function injectLuxDefs() {
    const svg = svgWrap.querySelector("svg");
    if (!svg) return;
    if (svg.querySelector("#luxVtxGrad")) return;
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <linearGradient id="luxVtxGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#a78bfa"></stop>
        <stop offset="55%" stop-color="#7c3aed"></stop>
        <stop offset="100%" stop-color="#2563eb"></stop>
      </linearGradient>
    `;
    svg.insertBefore(defs, svg.firstChild);
  }

  function renderText() {
    const shape = SHAPES.find((s) => s.id === activeShapeId) || SHAPES[0];
    const step = activeStep;

    miniList.innerHTML = "";
    for (const item of shape.mini) {
      const li = document.createElement("li");
      li.textContent = item;
      miniList.appendChild(li);
    }

    if (step === "corners") {
      if (shape.corners === 0) {
        learnText.textContent = "Dairede köşe yoktur. Çünkü düz kenarı yok, her yeri yuvarlaktır.";
        setWarning(
          `<div class="k"><span aria-hidden="true">ℹ️</span><span>Uyarı</span></div>` +
          `<div class="t">Daire <b>köşesizdir</b>. Köşe, kenarların birleştiği noktadır; dairede böyle bir nokta yoktur.</div>`
        );
      } else {
        learnText.textContent = `${shape.name} ${shape.corners} köşelidir. Köşeler, kenarların birleştiği noktalardır.`;
        setWarning("");
      }
      return;
    }

    if (step === "edges") {
      if (shape.edges === 0) {
        learnText.textContent = "Dairede düz kenar yoktur. Kenar yerine yuvarlak bir çizgi vardır.";
        setWarning(
          `<div class="k"><span aria-hidden="true">ℹ️</span><span>Uyarı</span></div>` +
          `<div class="t">Dairede <b>düz kenar yoktur</b>. Bu yüzden kenar animasyonu oynatılmaz.</div>`
        );
      } else {
        learnText.textContent = `${shape.name} ${shape.edges} kenarlıdır. Kenarlar düz çizgi parçası gibidir.`;
        setWarning("");
      }
      return;
    }

    setWarning("");
    learnText.textContent = shape.equal;
  }

  function clearMarks() {
    svgWrap.querySelectorAll(".vtx").forEach((n) => n.classList.remove("active"));
    svgWrap.querySelectorAll(".vtx-label").forEach((n) => n.classList.remove("active"));
    svgWrap.querySelectorAll(".edge").forEach((n) => n.classList.remove("active"));
    svgWrap.querySelectorAll(".edge-label").forEach((n) => n.classList.remove("active"));
    svgWrap.querySelectorAll(".measure").forEach((n) => n.classList.remove("show"));
    svgWrap.querySelectorAll(".m-label").forEach((n) => n.classList.remove("show"));
  }

  async function playCorners(shape, token) {
    const corners = shape.corners;
    const vtx = [...svgWrap.querySelectorAll(".vtx")].sort((a, b) => {
      return Number(a.getAttribute("data-vtx") || 0) - Number(b.getAttribute("data-vtx") || 0);
    });
    const labels = [...svgWrap.querySelectorAll(".vtx-label")].sort((a, b) => {
      return Number(a.getAttribute("data-vtx-label") || 0) - Number(b.getAttribute("data-vtx-label") || 0);
    });
    if (token !== playToken) return;

    if (corners === 0) {
      // No corner animation for circle
      return;
    }

    for (let i = 0; i < vtx.length; i++) {
      if (token !== playToken) return;
      vtx.forEach((n) => n.classList.remove("active"));
      labels.forEach((n) => n.classList.remove("active"));
      if (vtx[i]) vtx[i].classList.add("active");
      if (labels[i]) labels[i].classList.add("active");
      await sleep(520);
    }
    // Keep it calm: end with a short "all corners" emphasis, then stop.
    if (token !== playToken) return;
    vtx.forEach((n) => n.classList.add("active"));
    labels.forEach((n) => n.classList.add("active"));
    await sleep(700);
    if (token !== playToken) return;
    vtx.forEach((n) => n.classList.remove("active"));
    labels.forEach((n) => n.classList.remove("active"));
  }

  async function playEdges(shape, token) {
    const edges = shape.edges;
    const edgeEls = [...svgWrap.querySelectorAll(".edge")].sort((a, b) => {
      return Number(a.getAttribute("data-edge") || 0) - Number(b.getAttribute("data-edge") || 0);
    });
    const edgeLabels = [...svgWrap.querySelectorAll(".edge-label")].sort((a, b) => {
      return Number(a.getAttribute("data-edge-label") || 0) - Number(b.getAttribute("data-edge-label") || 0);
    });
    if (token !== playToken) return;

    if (edges === 0) {
      // No edge animation for circle
      return;
    }

    for (let i = 0; i < edgeEls.length; i++) {
      if (token !== playToken) return;
      edgeEls.forEach((n) => n.classList.remove("active"));
      edgeLabels.forEach((n) => n.classList.remove("active"));
      if (edgeEls[i]) edgeEls[i].classList.add("active");
      if (edgeLabels[i]) edgeLabels[i].classList.add("active");
      await sleep(550);
    }
    edgeEls.forEach((n) => n.classList.add("active"));
    edgeLabels.forEach((n) => n.classList.add("active"));
  }

  async function playEqual(shape, token) {
    const setLabel = (key, text) => {
      const lbl = svgWrap.querySelector(`[data-mlabel="${key}"]`);
      if (lbl) lbl.textContent = text;
    };
    const show = (key, text) => {
      const line = svgWrap.querySelector(`[data-measure="${key}"]`);
      const lbl = svgWrap.querySelector(`[data-mlabel="${key}"]`);
      if (lbl && typeof text === "string") lbl.textContent = text;
      if (line) line.classList.add("show");
      if (lbl) lbl.classList.add("show");
    };
    const activateAllEdges = () => {
      svgWrap.querySelectorAll(".edge").forEach((n) => n.classList.add("active"));
    };

    if (token !== playToken) return;
    if (shape.id === "square") {
      // Emphasize: all 4 sides are equal
      activateAllEdges();
      const sym = "🍭";
      setLabel("a", sym);
      setLabel("a2", sym);
      setLabel("a3", sym);
      setLabel("a4", sym);
      show("a", sym);
      await sleep(520);
      if (token !== playToken) return;
      show("a2", sym);
      await sleep(260);
      if (token !== playToken) return;
      show("a3", sym);
      await sleep(260);
      if (token !== playToken) return;
      show("a4", sym);
      return;
    }
    if (shape.id === "rectangle") {
      const longSym = "🍎";
      const shortSym = "🍌";
      setLabel("a", longSym);
      setLabel("a2", longSym);
      setLabel("b", shortSym);
      setLabel("b2", shortSym);
      show("a", longSym);
      await sleep(420);
      if (token !== playToken) return;
      show("a2", longSym);
      await sleep(420);
      if (token !== playToken) return;
      show("b", shortSym);
      await sleep(420);
      if (token !== playToken) return;
      show("b2", shortSym);
      return;
    }
    if (shape.id === "triangle") {
      const sym = "⭐";
      setLabel("a", sym);
      setLabel("a2", sym);
      show("a", sym);
      await sleep(520);
      if (token !== playToken) return;
      show("a2", sym);
      return;
    }
    // Circle: no radius/measure animation requested
  }

  async function play() {
    const token = ++playToken;
    const shape = SHAPES.find((s) => s.id === activeShapeId) || SHAPES[0];
    clearMarks();
    await sleep(60);
    if (token !== playToken) return;

    if (activeStep === "corners") return playCorners(shape, token);
    if (activeStep === "edges") return playEdges(shape, token);
    return playEqual(shape, token);
  }

  function renderChips() {
    shapeChips.innerHTML = "";
    for (const s of SHAPES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.setAttribute("data-shape", s.id);
      btn.innerHTML = `<span class="emoji" aria-hidden="true">${s.emoji}</span><span>${s.name}</span>`;
      btn.addEventListener("click", () => setShape(s.id));
      shapeChips.appendChild(btn);
    }
  }

  // Tabs
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => setStep(btn.getAttribute("data-step")));
  });

  replayBtn?.addEventListener("click", () => play());

  // Init
  renderChips();
  setShape(activeShapeId);
  setStep(activeStep);

  // Resize guard: avoid tiny SVG on very small heights
  function tightenIfNeeded() {
    const h = window.innerHeight || 0;
    const svg = svgWrap.querySelector("svg");
    if (!svg) return;
    const max = clamp(Math.floor(h * 0.42), 220, 420);
    svg.style.maxHeight = `${max}px`;
  }
  window.addEventListener("resize", tightenIfNeeded, { passive: true });
  tightenIfNeeded();
})();


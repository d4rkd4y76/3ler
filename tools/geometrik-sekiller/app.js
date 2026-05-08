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
  const infoToggleBtn = $("infoToggleBtn");
  const learnArea = $("learnArea");

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
            <g class="m-icon" data-mlabel="a" transform="translate(100 14)"></g>
            <line class="measure" data-measure="a2" x1="172" y1="55" x2="172" y2="145"></line>
            <g class="m-icon" data-mlabel="a2" transform="translate(188 104)"></g>
            <line class="measure" data-measure="a3" x1="55" y1="172" x2="145" y2="172"></line>
            <g class="m-icon" data-mlabel="a3" transform="translate(100 190)"></g>
            <line class="measure" data-measure="a4" x1="28" y1="55" x2="28" y2="145"></line>
            <g class="m-icon" data-mlabel="a4" transform="translate(12 104)"></g>
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
            <g class="m-icon" data-mlabel="a" transform="translate(110 24)"></g>
            <line class="measure" data-measure="a2" x1="58" y1="160" x2="162" y2="160"></line>
            <g class="m-icon" data-mlabel="a2" transform="translate(110 188)"></g>

            <line class="measure" data-measure="b" x1="195" y1="70" x2="195" y2="130"></line>
            <g class="m-icon" data-mlabel="b" transform="translate(210 105)"></g>
            <line class="measure" data-measure="b2" x1="25" y1="70" x2="25" y2="130"></line>
            <g class="m-icon" data-mlabel="b2" transform="translate(10 105)"></g>
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
            <g class="m-icon" data-mlabel="a" transform="translate(165 104)"></g>
            <line class="measure" data-measure="a2" x1="40" y1="150" x2="100" y2="50"></line>
            <g class="m-icon" data-mlabel="a2" transform="translate(55 104)"></g>
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
    svgWrap.querySelectorAll(".m-icon").forEach((n) => n.classList.remove("show"));
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
    const setIcon = (key, type) => {
      const node = svgWrap.querySelector(`.m-icon[data-mlabel="${key}"]`);
      if (!node) return;
      node.innerHTML = makeIconMarkup(type);
    };
    const show = (key, type) => {
      const line = svgWrap.querySelector(`[data-measure="${key}"]`);
      const node = svgWrap.querySelector(`.m-icon[data-mlabel="${key}"]`);
      if (node && typeof type === "string") node.innerHTML = makeIconMarkup(type);
      if (line) line.classList.add("show");
      if (node) node.classList.add("show");
    };
    const activateAllEdges = () => {
      svgWrap.querySelectorAll(".edge").forEach((n) => n.classList.add("active"));
    };

    const makeIconMarkup = (type) => {
      // Consistent "fun" icons drawn as vectors (no emoji font differences).
      // Everything is centered at (0,0) and kept small so it never touches lines.
      if (type === "lollipop") {
        return `
          <g transform="scale(.92)">
            <circle cx="0" cy="0" r="8.6" fill="#ffffff" opacity=".95"></circle>
            <circle cx="0" cy="0" r="7.6" fill="url(#luxVtxGrad)"></circle>
            <path d="M0,-7.6 A7.6,7.6 0 0 1 6.6,3.8" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="2.4" stroke-linecap="round"></path>
            <path d="M-5.6,-2.6 C -2.8,-6.6, 2.8,-6.6, 5.6,-2.6 C 2.8,1.6, -2.8,1.6, -5.6,-2.6Z"
              fill="rgba(255,255,255,.22)"></path>
            <path d="M4.2,6.2 L9.6,11.6" stroke="#f59e0b" stroke-width="2.4" stroke-linecap="round"></path>
            <path d="M5.4,5.0 L10.8,10.4" stroke="rgba(255,255,255,.55)" stroke-width="1.3" stroke-linecap="round"></path>
          </g>
        `;
      }
      if (type === "apple") {
        return `
          <g transform="scale(.9)">
            <path d="M0,-8 C3.6,-10 7.6,-6.8 7.2,-2.2 C6.8,2.4 3.6,8 0,8 C-3.6,8 -6.8,2.4 -7.2,-2.2 C-7.6,-6.8 -3.6,-10 0,-8Z"
              fill="#ef4444"></path>
            <path d="M1.4,-8.8 C2.8,-11.2 5.8,-11.6 7.2,-10.0 C5.2,-9.2 3.4,-8.2 1.4,-8.8Z" fill="#22c55e"></path>
            <path d="M0.6,-10.6 C0.6,-8.8 -0.4,-8.0 -1.6,-7.2" fill="none" stroke="#7c2d12" stroke-width="1.6" stroke-linecap="round"></path>
            <path d="M-2.2,-1.0 C-0.6,-3.6 1.0,-3.8 2.6,-1.4 C1.2,0.0 -1.0,0.2 -2.2,-1.0Z" fill="rgba(255,255,255,.28)"></path>
          </g>
        `;
      }
      if (type === "banana") {
        return `
          <g transform="scale(.92)">
            <path d="M-7,-2 C-3,7 6,9 9,2 C5,6 -1,4 -4,-4 Z" fill="#f59e0b"></path>
            <path d="M-6,-2 C-2,6 6,7 8,2" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.8" stroke-linecap="round"></path>
            <circle cx="-7.5" cy="-2.2" r="1.4" fill="#7c2d12"></circle>
          </g>
        `;
      }
      if (type === "star") {
        return `
          <g transform="scale(.9)">
            <path d="M0,-10 L2.8,-3.2 L10,-3.2 L4.2,1.2 L6.8,8.8 L0,4.8 L-6.8,8.8 L-4.2,1.2 L-10,-3.2 L-2.8,-3.2 Z"
              fill="#7c3aed"></path>
            <path d="M0,-8 L2.2,-2.8 L8,-2.8 L3.5,0.8 L5.5,6.8 L0,3.8 L-5.5,6.8 L-3.5,0.8 L-8,-2.8 L-2.2,-2.8 Z"
              fill="rgba(255,255,255,.24)"></path>
          </g>
        `;
      }
      return `<circle cx="0" cy="0" r="7" fill="#2563eb"></circle>`;
    };

    if (token !== playToken) return;
    if (shape.id === "square") {
      // Emphasize: all 4 sides are equal
      activateAllEdges();
      const type = "lollipop";
      setIcon("a", type);
      setIcon("a2", type);
      setIcon("a3", type);
      setIcon("a4", type);
      show("a", type);
      await sleep(740);
      if (token !== playToken) return;
      show("a2", type);
      await sleep(420);
      if (token !== playToken) return;
      show("a3", type);
      await sleep(420);
      if (token !== playToken) return;
      show("a4", type);
      return;
    }
    if (shape.id === "rectangle") {
      const longType = "apple";
      const shortType = "banana";
      setIcon("a", longType);
      setIcon("a2", longType);
      setIcon("b", shortType);
      setIcon("b2", shortType);
      show("a", longType);
      await sleep(560);
      if (token !== playToken) return;
      show("a2", longType);
      await sleep(560);
      if (token !== playToken) return;
      show("b", shortType);
      await sleep(560);
      if (token !== playToken) return;
      show("b2", shortType);
      return;
    }
    if (shape.id === "triangle") {
      const type = "star";
      setIcon("a", type);
      setIcon("a2", type);
      show("a", type);
      await sleep(740);
      if (token !== playToken) return;
      show("a2", type);
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

  function isMobile() {
    return window.matchMedia && window.matchMedia("(max-width: 480px)").matches;
  }

  function setInfoCollapsed(collapsed) {
    document.body.dataset.infoCollapsed = collapsed ? "1" : "0";
    if (infoToggleBtn) {
      infoToggleBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      infoToggleBtn.textContent = collapsed ? "Bilgileri göster" : "Bilgileri küçült";
    }
    updateSvgSize();
  }

  infoToggleBtn?.addEventListener("click", () => {
    const collapsed = document.body.dataset.infoCollapsed === "1";
    setInfoCollapsed(!collapsed);
  });

  // Init
  renderChips();
  setShape(activeShapeId);
  setStep(activeStep);

  // Resize guard: avoid tiny SVG on very small heights
  function updateSvgSize() {
    const svg = svgWrap.querySelector("svg");
    if (!svg) return;

    // Compute remaining height inside the app for the SVG area.
    const app = document.querySelector(".app");
    const topbar = document.querySelector(".topbar");
    const selector = document.querySelector(".selector");
    const stageHead = document.querySelector(".stage-head");
    const bottom = document.querySelector(".bottom");
    const infoToggleRow = document.querySelector(".info-toggle-row");

    const vh = window.innerHeight || 0;
    const padTop = 10;
    const padBottom = 12;
    const used =
      (topbar?.getBoundingClientRect().height || 0) +
      (selector?.getBoundingClientRect().height || 0) +
      (stageHead?.getBoundingClientRect().height || 0) +
      (warningBox && !warningBox.hidden ? warningBox.getBoundingClientRect().height : 0) +
      (infoToggleRow?.getBoundingClientRect().height || 0) +
      (bottom?.getBoundingClientRect().height || 0) +
      // If learn is visible, count it; otherwise 0
      (learnArea && document.body.dataset.infoCollapsed !== "1" ? learnArea.getBoundingClientRect().height : 0) +
      // gaps / paddings
      (app ? 34 : 24) +
      padTop +
      padBottom;

    const avail = clamp(vh - used, 240, Math.floor(vh * 0.72));
    svg.style.maxHeight = `${avail}px`;
  }

  function tightenIfNeeded() {
    // On mobile, default to collapsed info for maximum shape size.
    if (isMobile() && document.body.dataset.infoCollapsed == null) {
      setInfoCollapsed(true);
    } else {
      updateSvgSize();
    }
  }

  window.addEventListener("resize", tightenIfNeeded, { passive: true });
  // Also react after layout changes (step warnings etc.)
  const _origSetWarning = setWarning;
  setWarning = (html) => {
    _origSetWarning(html);
    updateSvgSize();
  };
  tightenIfNeeded();
})();


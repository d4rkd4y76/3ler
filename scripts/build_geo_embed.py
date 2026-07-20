#!/usr/bin/env python3
"""tools/geometri/app.js → embed.js (açıklama paneli 3B görüntüleyici)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
src = (ROOT / "tools" / "geometri" / "app.js").read_text(encoding="utf-8")
start = src.index("function prismModel")
ui_start = src.index("function syncToggleOpenLabel()")
render_start = src.index("function resizeCanvas(canvas)")
render_end = src.index("function renderNet()")
chunk = src[start:ui_start] + src[render_start:render_end]

header = r"""(() => {
"use strict";
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const params = new URLSearchParams(location.search);
const shapeKey = params.get("shape") || "cube";
const focus = params.get("focus") || "temel";
const showFaces = { checked: true };
const showEdges = { checked: true };
const showVertices = { checked: false };
if (focus === "kose") {
  showVertices.checked = true;
} else if (focus === "yuz") {
  showVertices.checked = false;
} else if (focus === "ayrit") {
  showVertices.checked = false;
}
const SHAPES = {
  cube: { props: { faces: 6, edges: 12, vertices: 8 }, model: () => prismModel(2, 2, 2) },
  squarePrism: { props: { faces: 6, edges: 12, vertices: 8 }, model: () => prismModel(2, 3, 2) },
  rectangularPrism: { props: { faces: 6, edges: 12, vertices: 8 }, model: () => prismModel(3.2, 2, 1.8) },
  triangularPrism: { props: { faces: 5, edges: 9, vertices: 6 }, model: () => triangularPrismModel(2.8, 2.2, 2.2) },
  squarePyramid: { props: { faces: 5, edges: 8, vertices: 5 }, model: () => squarePyramidModel(2.5, 2.8) },
  cylinder: { props: { faces: 3, edges: 0, vertices: 0 }, model: () => cylinderModel(1.1, 2.6, 20) },
  cone: { props: { faces: 2, edges: 0, vertices: 0 }, model: () => coneModel(1.25, 2.8, 24) },
  sphere: { props: { faces: 1, edges: 0, vertices: 0 }, model: () => sphereModel(1.45, 10, 16) },
};
const state = { shapeKey, rotX: -0.6, rotY: 0.8, drag: null, explodeValue: 0 };
const mainCanvas = canvas;
const mainCtx = ctx;

"""

footer = r"""
function resizeCanvas(c) {
  const r = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const w = Math.round(c.clientWidth * r);
  const h = Math.round(c.clientHeight * r);
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  return { w, h };
}

function animate() {
  requestAnimationFrame(animate);
  renderMain();
}

function bindDrag() {
  const start = (x, y) => {
    state.drag = { x, y, rotX: state.rotX, rotY: state.rotY };
  };
  const move = (x, y) => {
    if (!state.drag) return;
    state.rotY = state.drag.rotY + (x - state.drag.x) * 0.01;
    state.rotX = Math.max(-1.5, Math.min(1.5, state.drag.rotX + (y - state.drag.y) * 0.01));
  };
  const end = () => {
    state.drag = null;
  };
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    start(e.clientX, e.clientY);
  });
  canvas.addEventListener(
    "pointermove",
    (e) => {
      if (state.drag) e.preventDefault();
      move(e.clientX, e.clientY);
    },
    { passive: false }
  );
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches.length) return;
      e.preventDefault();
      start(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: false }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!state.drag || !e.touches.length) return;
      e.preventDefault();
      move(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: false }
  );
  canvas.addEventListener("touchend", end, { passive: true });
}

window.addEventListener("resize", () => renderMain());
bindDrag();
animate();
})();
"""

out = ROOT / "tools" / "geometri" / "embed.js"
out.write_text(header + chunk + footer, encoding="utf-8")
print(f"OK: {out} ({out.stat().st_size} bytes)")

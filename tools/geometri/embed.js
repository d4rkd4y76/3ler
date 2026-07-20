(() => {
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

function prismModel(w, h, d) {
  const x = w / 2;
  const y = h / 2;
  const z = d / 2;
  return {
    vertices: [
      [-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z],
      [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ],
    faces: [
      [4, 5, 6, 7], [0, 1, 2, 3], [1, 5, 6, 2],
      [0, 4, 7, 3], [3, 2, 6, 7], [0, 1, 5, 4]
    ]
  };
}

function triangularPrismModel(base, height, depth) {
  const b = base / 2;
  const h = height / 2;
  const d = depth / 2;
  return {
    vertices: [
      [-b, -h, -d], [b, -h, -d], [0, h, -d],
      [-b, -h, d], [b, -h, d], [0, h, d]
    ],
    edges: [
      [0, 1], [1, 2], [2, 0],
      [3, 4], [4, 5], [5, 3],
      [0, 3], [1, 4], [2, 5]
    ],
    faces: [
      [0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]
    ]
  };
}

function squarePyramidModel(base, height) {
  const b = base / 2;
  return {
    vertices: [
      [-b, -b, -b], [b, -b, -b], [b, -b, b], [-b, -b, b], [0, height / 1.7, 0]
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [0, 4], [1, 4], [2, 4], [3, 4]
    ],
    faces: [
      [0, 1, 2, 3], [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]
    ]
  };
}

function cylinderModel(radius, height, segments) {
  const vertices = [];
  const edges = [];
  const faces = [];
  const topY = height / 2;
  const botY = -height / 2;

  for (let i = 0; i < segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    vertices.push([x, topY, z]);
    vertices.push([x, botY, z]);
  }

  for (let i = 0; i < segments; i += 1) {
    const ni = (i + 1) % segments;
    const t0 = i * 2;
    const b0 = i * 2 + 1;
    const t1 = ni * 2;
    const b1 = ni * 2 + 1;
    edges.push([t0, t1], [b0, b1], [t0, b0]);
    faces.push([t0, t1, b1, b0]);
  }

  return { vertices, edges, faces };
}

const CYLINDER_NET_W = 180;
const CYLINDER_NET_H = 120;
const CYLINDER_NET_SEG_X = 14;
const CYLINDER_NET_SEG_Y = 5;
const CYLINDER_NET_CIRCLE_STEPS = 28;
/** `renderNet` / `coneNet` ile aynı — gelişmiş sektör açısı 2πr / L */
const CONE_NET_R = 1.25;
const CONE_NET_H = 2.8;

/** Dikdörtgen çevresi (CCW), silindir yan yüzeyini ince çokgen olarak morflamak için. */
function rectOutlineCCW(x, y, w, h, segX, segY) {
  const p = [];
  for (let i = 0; i <= segX; i += 1) p.push([x + (w * i) / segX, y]);
  for (let j = 1; j <= segY; j += 1) p.push([x + w, y + (h * j) / segY]);
  for (let i = segX - 1; i >= 0; i -= 1) p.push([x + (w * i) / segX, y + h]);
  for (let j = segY - 1; j > 0; j -= 1) p.push([x, y + (h * j) / segY]);
  return p;
}

/** Açılım morfı: yan = silindire sarılmış çokgen şerit + iki daire; `cylinderNet` ile köşe sayıları eşleşir. */
function cylinderMorphModelForNet(radius, height, circleSteps, segX, segY, wNet, hNet) {
  const hh = height / 2;
  const twoPi = Math.PI * 2;
  const verts = [];
  const sideOutline = rectOutlineCCW(0, 0, wNet, hNet, segX, segY);
  const foldedSide = sideOutline.map(([ox, oy]) => {
    const u = wNet > 0 ? ox / wNet : 0;
    const v = hNet > 0 ? oy / hNet : 0;
    const a = u >= 1 ? twoPi - 1e-4 : u * twoPi;
    const y = hh - v * (2 * hh);
    return [radius * Math.cos(a), y, radius * Math.sin(a)];
  });
  verts.push(...foldedSide);
  const topStart = verts.length;
  for (let i = 0; i < circleSteps; i += 1) {
    const a = (i / circleSteps) * twoPi;
    verts.push([radius * Math.cos(a), hh, radius * Math.sin(a)]);
  }
  const botStart = verts.length;
  for (let i = 0; i < circleSteps; i += 1) {
    const a = (i / circleSteps) * twoPi;
    verts.push([radius * Math.cos(a), -hh, radius * Math.sin(a)]);
  }
  const sideIdx = foldedSide.map((_, i) => i);
  const topRing = [];
  const botRing = [];
  for (let i = 0; i < circleSteps; i += 1) {
    topRing.push(topStart + i);
    botRing.push(botStart + i);
  }
  return {
    vertices: verts,
    edges: [],
    faces: [sideIdx, topRing, botRing]
  };
}

/** Düz koni yan yüzünün gelişmiş sektör açısı (radyan): tam daire değil, 2πr/L. */
function coneDevelopedSectorRadians(radius, height) {
  const L = Math.hypot(radius, height);
  if (L < 1e-9) return { start: -Math.PI, end: Math.PI };
  const span = (2 * Math.PI * radius) / L;
  return { start: -span / 2, end: span / 2 };
}

/** Koni açılım morfı: 2 yüzey (sektör + taban dairesi), `coneNet` ile aynı köşe sayıları. */
function coneMorphModelForNet(radius, height, sectorSteps = 36, baseSteps = 36) {
  const hh = height / 2;
  const { start: startA, end: endA } = coneDevelopedSectorRadians(radius, height);
  const verts = [];
  verts.push([0, hh, 0]);
  for (let i = 0; i <= sectorSteps; i += 1) {
    const t = i / sectorSteps;
    const fullA = -Math.PI + t * Math.PI * 2;
    verts.push([radius * Math.cos(fullA), -hh, radius * Math.sin(fullA)]);
  }
  const baseStart = verts.length;
  for (let i = 0; i < baseSteps; i += 1) {
    const ang = (i / baseSteps) * Math.PI * 2;
    verts.push([radius * Math.cos(ang), -hh, radius * Math.sin(ang)]);
  }
  const sectorIdx = [];
  for (let i = 0; i < verts.length - baseSteps; i += 1) sectorIdx.push(i);
  const baseIdx = [];
  for (let i = 0; i < baseSteps; i += 1) baseIdx.push(baseStart + i);
  return { vertices: verts, edges: [], faces: [sectorIdx, baseIdx] };
}

function coneModel(radius, height, segments) {
  const vertices = [[0, height / 2, 0]];
  const edges = [];
  const faces = [];
  const baseY = -height / 2;

  for (let i = 0; i < segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    vertices.push([Math.cos(a) * radius, baseY, Math.sin(a) * radius]);
  }

  for (let i = 1; i <= segments; i += 1) {
    const ni = i === segments ? 1 : i + 1;
    edges.push([0, i], [i, ni]);
    faces.push([0, i, ni]);
  }
  return { vertices, edges, faces };
}

function sphereModel(radius, latSeg, lonSeg) {
  const vertices = [];
  const edges = [];
  const faces = [];

  for (let lat = 0; lat <= latSeg; lat += 1) {
    const v = lat / latSeg;
    const phi = v * Math.PI;
    const y = Math.cos(phi) * radius;
    const r = Math.sin(phi) * radius;
    for (let lon = 0; lon < lonSeg; lon += 1) {
      const u = lon / lonSeg;
      const theta = u * Math.PI * 2;
      vertices.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
    }
  }

  const row = lonSeg;
  for (let lat = 0; lat < latSeg; lat += 1) {
    for (let lon = 0; lon < lonSeg; lon += 1) {
      const nextLon = (lon + 1) % lonSeg;
      const a = lat * row + lon;
      const b = lat * row + nextLon;
      const c = (lat + 1) * row + nextLon;
      const d = (lat + 1) * row + lon;
      edges.push([a, b], [a, d]);
      faces.push([a, b, c, d]);
    }
  }
  return { vertices, edges, faces };
}

function prismNet(w, h, d) {
  const gap = Math.max(w, h, d) * 0.45;
  return [
    { closed: rect(0, 0, w, h), open: rect(0, 0, w, h), color: "#a9c3ff" },
    { closed: rect(0, 0, w, h), open: rect(w + gap, 0, d, h), color: "#8fb1ff" },
    { closed: rect(0, 0, w, h), open: rect(w + d + gap * 2, 0, w, h), color: "#a9c3ff" },
    { closed: rect(0, 0, w, h), open: rect(-(d + gap), 0, d, h), color: "#8fb1ff" },
    { closed: rect(0, 0, w, h), open: rect(0, -(d + gap), w, d), color: "#c2d5ff" },
    { closed: rect(0, 0, w, h), open: rect(0, h + gap, w, d), color: "#c2d5ff" }
  ];
}

function triangularPrismNet(edge, triH, len) {
  const gap = Math.max(edge, len) * 0.35;
  const closedQuad = rect(0, 0, edge, len);
  const closedTri = [[0, 0], [edge, 0], [edge / 2, -triH]];
  // Sıra triangularPrismModel().faces ile AYNI: [0,1,2], [3,4,5], [0,1,4,3], [1,2,5,4], [2,0,3,5]
  // open köşe sırası model yüz dolaşımı ile birebir → 3B morf (küp gibi) doğru çalışır.
  return [
    { closed: closedTri, open: [[0, 0], [edge, 0], [edge / 2, -triH]], color: "#d2ecff" },
    { closed: closedTri, open: [[0, len], [edge, len], [edge / 2, len + triH]], color: "#d2ecff" },
    { closed: closedQuad, open: rect(0, 0, edge, len), color: "#8fc5ff" },
    { closed: closedQuad, open: rect(edge + gap, 0, edge, len), color: "#a7d4ff" },
    { closed: closedQuad, open: rect(-edge, 0, edge, len), color: "#8fc5ff" }
  ];
}

function squarePyramidNet(base, triH) {
  const gap = base * 0.5;
  const square = rect(0, 0, base, base);
  const topTri = [[0, 0], [base, 0], [base / 2, -triH]];
  const rightTri = [[0, 0], [base, 0], [base / 2, -triH]];
  const bottomTri = [[0, 0], [base, 0], [base / 2, triH]];
  const leftTri = [[0, 0], [base, 0], [base / 2, -triH]];
  const topClosed = [[0, 0], [base, 0], [base / 2, base / 2]];
  const rightClosed = [[base, 0], [base, base], [base / 2, base / 2]];
  const bottomClosed = [[0, base], [base, base], [base / 2, base / 2]];
  const leftClosed = [[0, 0], [0, base], [base / 2, base / 2]];
  return [
    { closed: square, open: square, color: "#ffd084" },
    { closed: topClosed, open: offsetPolygon(topTri, 0, -gap), color: "#ffc06a" },
    { closed: rightClosed, open: rotateAndOffset(rightTri, Math.PI / 2, base + gap, 0), color: "#ffc06a" },
    { closed: bottomClosed, open: offsetPolygon(bottomTri, 0, base + gap), color: "#ffc06a" },
    { closed: leftClosed, open: rotateAndOffset(leftTri, -Math.PI / 2, -gap, base), color: "#ffc06a" }
  ];
}

function circlePolygon(cx, cy, r, steps = 28) {
  const pts = [];
  for (let i = 0; i < steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

function sectorPolygon(cx, cy, r, startA, endA, steps = 28) {
  const pts = [[cx, cy]];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const a = startA + (endA - startA) * t;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

function cylinderNet(w, h, r) {
  const gap = h * 0.45;
  const steps = CYLINDER_NET_CIRCLE_STEPS;
  const segX = CYLINDER_NET_SEG_X;
  const segY = CYLINDER_NET_SEG_Y;
  const openSide = rectOutlineCCW(0, 0, w, h, segX, segY);
  const cx = w / 2;
  const cy = h / 2;
  const closedSide = openSide.map(([px, py]) => [cx + (px - cx) * 0.22, cy + (py - cy) * 0.22]);
  return [
    { closed: closedSide, open: openSide, color: "#a7d4ff" },
    { closed: circlePolygon(cx, cy, r, steps), open: circlePolygon(w * 0.5, -(r + gap * 0.6), r, steps), color: "#d2ecff" },
    { closed: circlePolygon(cx, cy, r, steps), open: circlePolygon(w * 0.5, h + (r + gap * 0.6), r, steps), color: "#d2ecff" }
  ];
}

function coneNet(_baseRadius, sectorRadius, baseCircleR) {
  const gap = sectorRadius * 0.3;
  const steps = 36;
  const { start: s0, end: s1 } = coneDevelopedSectorRadians(CONE_NET_R, CONE_NET_H);
  const sector = sectorPolygon(0, 0, sectorRadius, s0, s1, steps);
  const collapsedSector = sectorPolygon(
    0,
    -baseCircleR * 0.35,
    sectorRadius * 0.42,
    s0 * 0.42,
    s1 * 0.42,
    steps
  );
  const closedCircle = circlePolygon(0, 0, baseCircleR, steps);
  return [
    { closed: collapsedSector, open: sector, color: "#ffc06a" },
    { closed: closedCircle, open: circlePolygon(0, sectorRadius + baseCircleR + gap, baseCircleR, steps), color: "#ffd084" }
  ];
}

function sphereNet(width, height) {
  const strips = 6;
  const closedR = Math.min(width, height) * 0.23;
  const openGap = width * 0.18;
  const faces = [];
  for (let i = 0; i < strips; i += 1) {
    const x = (i - (strips - 1) / 2) * openGap;
    const strip = [
      [x - width * 0.08, -height * 0.46],
      [x + width * 0.08, -height * 0.46],
      [x + width * 0.12, 0],
      [x + width * 0.08, height * 0.46],
      [x - width * 0.08, height * 0.46],
      [x - width * 0.12, 0]
    ];
    const closedStrip = strip.map((_, k) => {
      const a = (k / strip.length) * Math.PI * 2;
      return [Math.cos(a) * closedR, Math.sin(a) * closedR];
    });
    faces.push({
      closed: closedStrip,
      open: strip,
      color: i % 2 === 0 ? "#a9c3ff" : "#8fb1ff"
    });
  }
  return faces;
}

function rect(x, y, w, h) {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}

function offsetPolygon(poly, ox, oy) {
  return poly.map(([x, y]) => [x + ox, y + oy]);
}

function rotateAndOffset(poly, rad, ox, oy) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return poly.map(([x, y]) => [x * c - y * s + ox, x * s + y * c + oy]);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function smoothStep01(t) {
  const k = clamp(t, 0, 1);
  return k * k * (3 - 2 * k);
}

function moveTowards(current, target, speed) {
  if (Math.abs(target - current) <= speed) return target;
  return current + Math.sign(target - current) * speed;
}

function getOpenTargetMax() {
  const faceCount = SHAPES[state.shapeKey].net().length;
  return 1 + Math.max(0, faceCount - 1) * OPEN_STAGGER;
}

function canShowEdges(shape) {
  if (["cylinder", "cone", "sphere"].includes(state.shapeKey)) return false;
  return shape.props.edges > 0;
}

function canShowVertices(shape) {
  if (["cylinder", "cone", "sphere"].includes(state.shapeKey)) return false;
  return shape.props.vertices > 0;
}

function resizeCanvas(canvas) {
  const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const w = Math.round(canvas.clientWidth * ratio);
  const h = Math.round(canvas.clientHeight * ratio);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h, ratio };
}

function rotatePoint([x, y, z], ax, ay) {
  const cosY = Math.cos(ay);
  const sinY = Math.sin(ay);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;

  const cosX = Math.cos(ax);
  const sinX = Math.sin(ax);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  return [x1, y2, z2];
}

function projectPoint([x, y, z], w, h, scale) {
  const cam = 7.5;
  const p = cam / (cam - z);
  return [w / 2 + x * scale * p, h / 2 - y * scale * p, z];
}

function drawEllipse(ctx, x, y, rx, ry, fill, stroke) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function projectRotatedPoint(x, y, z, w, h, scale) {
  const rotated = rotatePoint([x, y, z], state.rotX, state.rotY);
  const projected = projectPoint(rotated, w, h, scale);
  return { x: projected[0], y: projected[1], z: projected[2] };
}

function responsiveMainScale(w, h, baseFactor = 0.2) {
  const shortSide = Math.min(w, h);
  const aspect = w / Math.max(h, 1);
  const boost = aspect > 1.2 ? Math.min(1.32, 1 + (aspect - 1.2) * 0.18) : 1;
  return shortSide * baseFactor * boost;
}

function drawPathFromPoints(ctx, points, closePath) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  if (closePath) ctx.closePath();
}

function renderCylinderMain(w, h) {
  const radius = 1.25;
  const halfH = 1.35;
  const scale = responsiveMainScale(w, h, 0.205);
  const seg = 30;
  const top = [];
  const bottom = [];
  const faces = [];

  for (let i = 0; i < seg; i += 1) {
    const a = (i / seg) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    top.push(projectRotatedPoint(x, halfH, z, w, h, scale));
    bottom.push(projectRotatedPoint(x, -halfH, z, w, h, scale));
  }

  for (let i = 0; i < seg; i += 1) {
    const ni = (i + 1) % seg;
    const quad = [top[i], top[ni], bottom[ni], bottom[i]];
    const avgZ = quad.reduce((s, p) => s + p.z, 0) / quad.length;
    faces.push({ quad, avgZ, shade: i / seg });
  }
  const topAvgZ = top.reduce((s, p) => s + p.z, 0) / top.length;
  const bottomAvgZ = bottom.reduce((s, p) => s + p.z, 0) / bottom.length;
  faces.sort((a, b) => a.avgZ - b.avgZ);

  if (showFaces.checked) {
    faces.forEach((f) => {
      const shade = 0.55 + 0.35 * Math.sin(f.shade * Math.PI * 2 + state.rotY);
      mainCtx.fillStyle = `rgba(${Math.round(120 + shade * 50)}, ${Math.round(170 + shade * 40)}, 255, 0.75)`;
      drawPathFromPoints(mainCtx, f.quad, true);
      mainCtx.fill();
    });

    const caps = [
      { pts: top, z: topAvgZ, fill: "#d8ecffdd" },
      { pts: bottom, z: bottomAvgZ, fill: "#b8d8ffdd" }
    ].sort((a, b) => a.z - b.z);
    caps.forEach((cap) => {
      drawPathFromPoints(mainCtx, cap.pts, true);
      mainCtx.fillStyle = cap.fill;
      mainCtx.fill();
    });
  }

  if (showEdges.checked) {
    mainCtx.strokeStyle = "#2240b6";
    mainCtx.lineWidth = 1.6;
    drawPathFromPoints(mainCtx, top, true);
    mainCtx.stroke();
    drawPathFromPoints(mainCtx, bottom, true);
    mainCtx.stroke();
  }
}

function renderConeMain(w, h) {
  const radius = 1.35;
  const height = 2.8;
  const scale = responsiveMainScale(w, h, 0.205);
  const seg = 34;
  const apex = projectRotatedPoint(0, height / 2, 0, w, h, scale);
  const base = [];
  const faces = [];

  for (let i = 0; i < seg; i += 1) {
    const a = (i / seg) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    base.push(projectRotatedPoint(x, -height / 2, z, w, h, scale));
  }

  for (let i = 0; i < seg; i += 1) {
    const ni = (i + 1) % seg;
    const tri = [apex, base[i], base[ni]];
    const avgZ = tri.reduce((s, p) => s + p.z, 0) / tri.length;
    faces.push({ tri, shade: i / seg, avgZ });
  }
  faces.sort((a, b) => a.avgZ - b.avgZ);

  if (showFaces.checked) {
    faces.forEach((f) => {
      const shade = 0.5 + 0.4 * Math.sin(f.shade * Math.PI * 2 + state.rotY * 0.8);
      mainCtx.fillStyle = `rgba(${Math.round(240 + shade * 10)}, ${Math.round(170 + shade * 45)}, ${Math.round(90 + shade * 35)}, 0.78)`;
      drawPathFromPoints(mainCtx, f.tri, true);
      mainCtx.fill();
    });
  }

  // Konide eğitimsel gösterimde ayrıt/köşe vurgusu kullanılmıyor.
}

function renderSphereMain(w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const r = responsiveMainScale(w, h, 0.21);

  const hlx = cx + Math.cos(state.rotY + Math.PI) * r * 0.35;
  const hly = cy + Math.sin(state.rotX) * r * 0.25 - r * 0.25;
  if (showFaces.checked) {
    const grad = mainCtx.createRadialGradient(hlx, hly, r * 0.08, cx, cy, r);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.5, "#a9c6ff");
    grad.addColorStop(1, "#6f91df");
    mainCtx.fillStyle = grad;
    mainCtx.beginPath();
    mainCtx.arc(cx, cy, r, 0, Math.PI * 2);
    mainCtx.fill();
  }

  const ring1 = [];
  const ring2 = [];
  const step = 56;
  for (let i = 0; i < step; i += 1) {
    const a = (i / step) * Math.PI * 2;
    ring1.push(projectRotatedPoint(Math.cos(a), 0.28, Math.sin(a), w, h, r));
    ring2.push(projectRotatedPoint(Math.cos(a) * 0.66, Math.sin(a), 0, w, h, r));
  }
  mainCtx.strokeStyle = "#3357c377";
  mainCtx.lineWidth = 1.5;
  drawPathFromPoints(mainCtx, ring1, true);
  mainCtx.stroke();
  drawPathFromPoints(mainCtx, ring2, true);
  mainCtx.stroke();
}

function renderMain() {
  const { w, h } = resizeCanvas(mainCanvas);
  mainCtx.clearRect(0, 0, w, h);

  const shape = SHAPES[state.shapeKey];
  if (state.shapeKey === "cylinder") {
    renderCylinderMain(w, h);
    return;
  }
  if (state.shapeKey === "cone") {
    renderConeMain(w, h);
    return;
  }
  if (state.shapeKey === "sphere") {
    renderSphereMain(w, h);
    return;
  }

  const model = shape.model();
  const explode = state.explodeValue * 0.55;
  const scale = responsiveMainScale(w, h, 0.205);
  const shapeHasEdges = canShowEdges(shape);
  const shapeHasVertices = canShowVertices(shape);

  const facesWithDepth = model.faces.map((face) => {
    const center = face.reduce((acc, idx) => {
      const v = model.vertices[idx];
      acc[0] += v[0];
      acc[1] += v[1];
      acc[2] += v[2];
      return acc;
    }, [0, 0, 0]).map((n) => n / face.length);

    const pushed = center.map((c) => c * explode);

    const pts3d = face.map((idx) => {
      const [x, y, z] = model.vertices[idx];
      return [x + pushed[0], y + pushed[1], z + pushed[2]];
    });

    const rotated = pts3d.map((p) => rotatePoint(p, state.rotX, state.rotY));
    const pts2d = rotated.map((p) => projectPoint(p, w, h, scale));
    const avgZ = rotated.reduce((sum, p) => sum + p[2], 0) / rotated.length;
    return { pts2d, avgZ };
  });

  facesWithDepth.sort((a, b) => a.avgZ - b.avgZ);

  if (showFaces.checked) {
    mainCtx.fillStyle = "#8fb1ff88";
    facesWithDepth.forEach((f) => {
      drawPolygon(mainCtx, f.pts2d.map((p) => [p[0], p[1]]), true, false);
    });
  }

  if (showEdges.checked && shapeHasEdges) {
    mainCtx.lineWidth = 2.2;
    mainCtx.strokeStyle = "#2240b6";
    model.edges.forEach(([a, b]) => {
      const va = rotatePoint(model.vertices[a], state.rotX, state.rotY);
      const vb = rotatePoint(model.vertices[b], state.rotX, state.rotY);
      const pa = projectPoint([
        va[0] * (1 + explode),
        va[1] * (1 + explode),
        va[2] * (1 + explode)
      ], w, h, scale);
      const pb = projectPoint([
        vb[0] * (1 + explode),
        vb[1] * (1 + explode),
        vb[2] * (1 + explode)
      ], w, h, scale);
      mainCtx.beginPath();
      mainCtx.moveTo(pa[0], pa[1]);
      mainCtx.lineTo(pb[0], pb[1]);
      mainCtx.stroke();
    });
  }

  if (showVertices.checked && shapeHasVertices) {
    mainCtx.fillStyle = "#ef476f";
    model.vertices.forEach((v) => {
      const rv = rotatePoint(v, state.rotX, state.rotY);
      const p = projectPoint([
        rv[0] * (1 + explode),
        rv[1] * (1 + explode),
        rv[2] * (1 + explode)
      ], w, h, scale);
      mainCtx.beginPath();
      mainCtx.arc(p[0], p[1], 4.5, 0, Math.PI * 2);
      mainCtx.fill();
    });
  }
}

function drawPolygon(ctx, points, fill, stroke) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function polygonArea2(points) {
  let area2 = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area2 += x1 * y2 - y1 * x2;
  }
  return area2;
}

function convexHull(points) {
  if (points.length <= 3) return points.slice();
  const pts = [...points].sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}


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

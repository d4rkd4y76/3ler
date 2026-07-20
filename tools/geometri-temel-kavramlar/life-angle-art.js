/**
 * Günlük hayat — açı örnekleri (profesyonel SVG)
 * Açı yayı, canvas drawAngleWedge ile aynı mantıkta (y aşağı).
 */
(function (global) {
  const TAU = Math.PI * 2;

  function svgWedgePath(vx, vy, x1, y1, x2, y2, r) {
    const aB = Math.atan2(y1 - vy, x1 - vx);
    const aC = Math.atan2(y2 - vy, x2 - vx);
    let d = aC - aB;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    const end = aB + d;
    const sweep = d < 0 ? 0 : 1;
    const large = Math.abs(d) > Math.PI ? 1 : 0;
    const px1 = vx + Math.cos(aB) * r;
    const py1 = vy + Math.sin(aB) * r;
    const px2 = vx + Math.cos(end) * r;
    const py2 = vy + Math.sin(end) * r;
    return `M ${vx} ${vy} L ${px1} ${py1} A ${r} ${r} 0 ${large} ${sweep} ${px2} ${py2} Z`;
  }

  function svgArcStroke(vx, vy, x1, y1, x2, y2, r) {
    const aB = Math.atan2(y1 - vy, x1 - vx);
    const aC = Math.atan2(y2 - vy, x2 - vx);
    let d = aC - aB;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    const end = aB + d;
    const sweep = d < 0 ? 0 : 1;
    const large = Math.abs(d) > Math.PI ? 1 : 0;
    const px1 = vx + Math.cos(aB) * r;
    const py1 = vy + Math.sin(aB) * r;
    const px2 = vx + Math.cos(end) * r;
    const py2 = vy + Math.sin(end) * r;
    return `M ${px1} ${py1} A ${r} ${r} 0 ${large} ${sweep} ${px2} ${py2}`;
  }

  function wrap(viewBox, aria, body) {
    return (
      '<svg class="life-svg" viewBox="' +
      viewBox +
      '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
      aria +
      '">' +
      body +
      "</svg>"
    );
  }

  function scissor() {
    const vx = 120;
    const vy = 128;
    const lTip = { x: 38, y: 52 };
    const rTip = { x: 202, y: 52 };
    const wedge = svgWedgePath(vx, vy, lTip.x, lTip.y, rTip.x, rTip.y, 38);
    const arc = svgArcStroke(vx, vy, lTip.x, lTip.y, rTip.x, rTip.y, 44);

    return wrap(
      "0 0 240 180",
      "Makas: vida köşe, bıçaklar arası açı",
      '<defs>' +
        '<linearGradient id="la-sc-bg" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fde68a"/>' +
        "</linearGradient>" +
        '<linearGradient id="la-sc-blade" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#94a3b8"/><stop offset="100%" stop-color="#475569"/>' +
        "</linearGradient>" +
        '<linearGradient id="la-sc-handle" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#fca5a5"/><stop offset="100%" stop-color="#dc2626"/>' +
        "</linearGradient>" +
        '<radialGradient id="la-sc-wedge" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#fde047" stop-opacity="0.85"/>' +
        '<stop offset="100%" stop-color="#f97316" stop-opacity="0.35"/>' +
        "</radialGradient>" +
        '<filter id="la-sc-sh" x="-20%" y="-20%" width="140%" height="140%">' +
        '<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.12"/>' +
        "</filter>" +
        "</defs>" +
        '<rect width="240" height="180" fill="url(#la-sc-bg)"/>' +
        '<path class="la-wedge" d="' +
        wedge +
        '" fill="url(#la-sc-wedge)" stroke="#ea580c" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="' +
        arc +
        '" fill="none" stroke="#ea580c" stroke-width="3" stroke-linecap="round"/>' +
        '<g filter="url(#la-sc-sh)">' +
        '<path d="M' +
        vx +
        " " +
        vy +
        " L" +
        lTip.x +
        " " +
        lTip.y +
        " L" +
        (lTip.x - 14) +
        " " +
        (lTip.y + 10) +
        " L" +
        (vx - 10) +
        " " +
        (vy - 6) +
        ' Z" fill="url(#la-sc-blade)" stroke="#334155" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M' +
        vx +
        " " +
        vy +
        " L" +
        rTip.x +
        " " +
        rTip.y +
        " L" +
        (rTip.x + 14) +
        " " +
        (rTip.y + 10) +
        " L" +
        (vx + 10) +
        " " +
        (vy - 6) +
        ' Z" fill="url(#la-sc-blade)" stroke="#334155" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M' +
        (vx - 22) +
        " " +
        vy +
        " L" +
        (vx - 18) +
        " " +
        (vy + 42) +
        " Q" +
        (vx - 28) +
        " " +
        (vy + 52) +
        " " +
        (vx - 38) +
        " " +
        (vy + 48) +
        " L" +
        (vx - 42) +
        " " +
        (vy + 38) +
        ' Z" fill="url(#la-sc-handle)" stroke="#b91c1c" stroke-width="1.2"/>' +
        '<path d="M' +
        (vx + 22) +
        " " +
        vy +
        " L" +
        (vx + 18) +
        " " +
        (vy + 42) +
        " Q" +
        (vx + 28) +
        " " +
        (vy + 52) +
        " " +
        (vx + 38) +
        " " +
        (vy + 48) +
        " L" +
        (vx + 42) +
        " " +
        (vy + 38) +
        ' Z" fill="url(#la-sc-handle)" stroke="#b91c1c" stroke-width="1.2"/>' +
        "</g>" +
        '<circle cx="' +
        vx +
        '" cy="' +
        vy +
        '" r="11" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>' +
        '<circle cx="' +
        vx +
        '" cy="' +
        vy +
        '" r="4" fill="#64748b"/>' +
        '<circle cx="' +
        vx +
        '" cy="' +
        vy +
        '" r="2.5" fill="#f8fafc" opacity="0.9"/>' +
        '<circle cx="' +
        vx +
        '" cy="' +
        vy +
        '" r="5" fill="none" stroke="#2563eb" stroke-width="2"/>' +
        '<text x="' +
        vx +
        '" y="' +
        (vy + 22) +
        '" text-anchor="middle" font-size="11" font-weight="800" fill="#1d4ed8" font-family="system-ui,sans-serif">köşe</text>'
    );
  }

  function door() {
    const hx = 72;
    const hy = 148;
    const frameTop = { x: 72, y: 28 };
    const doorTop = { x: 115, y: 51 };
    const wedge = svgWedgePath(hx, hy, frameTop.x, frameTop.y, doorTop.x, doorTop.y, 42);
    const arc = svgArcStroke(hx, hy, frameTop.x, frameTop.y, doorTop.x, doorTop.y, 48);

    return wrap(
      "0 0 240 180",
      "Açılmış kapı: çerçeve ile kapı arasındaki açı",
      '<defs>' +
        '<linearGradient id="la-dr-wall" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#cbd5e1"/><stop offset="100%" stop-color="#e2e8f0"/>' +
        "</linearGradient>" +
        '<linearGradient id="la-dr-floor" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#a8a29e"/><stop offset="100%" stop-color="#78716c"/>' +
        "</linearGradient>" +
        '<linearGradient id="la-dr-door" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#fdba74"/><stop offset="100%" stop-color="#ea580c"/>' +
        "</linearGradient>" +
        '<linearGradient id="la-dr-jamb" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#78350f"/><stop offset="100%" stop-color="#92400e"/>' +
        "</linearGradient>" +
        '<radialGradient id="la-dr-wedge" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#93c5fd" stop-opacity="0.9"/>' +
        '<stop offset="100%" stop-color="#3b82f6" stop-opacity="0.25"/>' +
        "</radialGradient>" +
        '<filter id="la-dr-sh" x="-10%" y="-10%" width="120%" height="120%">' +
        '<feDropShadow dx="2" dy="3" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.15"/>' +
        "</filter>" +
        "</defs>" +
        '<rect width="240" height="132" fill="url(#la-dr-wall)"/>' +
        '<rect y="132" width="240" height="48" fill="url(#la-dr-floor)"/>' +
        '<line x1="0" y1="132" x2="240" y2="132" stroke="#57534e" stroke-width="1"/>' +
        '<rect x="58" y="24" width="18" height="124" fill="url(#la-dr-jamb)" rx="2" stroke="#451a03" stroke-width="1"/>' +
        '<path class="la-wedge" d="' +
        wedge +
        '" fill="url(#la-dr-wedge)" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="' +
        arc +
        '" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>' +
        '<line x1="' +
        hx +
        '" y1="' +
        hy +
        '" x2="' +
        frameTop.x +
        '" y2="' +
        frameTop.y +
        '" stroke="#451a03" stroke-width="4" stroke-linecap="round"/>' +
        '<g filter="url(#la-dr-sh)" transform="rotate(-24 ' +
        hx +
        " " +
        hy +
        ')">' +
        '<rect x="74" y="42" width="52" height="106" fill="url(#la-dr-door)" stroke="#9a3412" stroke-width="2" rx="3"/>' +
        '<circle cx="82" cy="130" r="4" fill="#fcd34d" stroke="#b45309" stroke-width="1"/>' +
        "</g>" +
        '<line x1="' +
        hx +
        '" y1="' +
        hy +
        '" x2="' +
        doorTop.x +
        '" y2="' +
        doorTop.y +
        '" stroke="#9a3412" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 4"/>' +
        '<circle cx="' +
        hx +
        '" cy="' +
        hy +
        '" r="6" fill="#2563eb" stroke="#1d4ed8" stroke-width="2"/>' +
        '<text x="' +
        (hx + 8) +
        '" y="' +
        (hy + 20) +
        '" font-size="11" font-weight="800" fill="#1d4ed8" font-family="system-ui,sans-serif">köşe</text>'
    );
  }

  function clock() {
    const cx = 120;
    const cy = 100;
    const hourEnd = { x: 108, y: 58 };
    const minEnd = { x: 152, y: 72 };
    const wedge = svgWedgePath(cx, cy, hourEnd.x, hourEnd.y, minEnd.x, minEnd.y, 36);
    const arc = svgArcStroke(cx, cy, hourEnd.x, hourEnd.y, minEnd.x, minEnd.y, 42);

    return wrap(
      "0 0 240 200",
      "Saat: akrep ile yelkovan arasındaki açı",
      '<defs>' +
        '<linearGradient id="la-cl-face" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#f1f5f9"/>' +
        "</linearGradient>" +
        '<radialGradient id="la-cl-wedge" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#fde047" stop-opacity="0.9"/>' +
        '<stop offset="100%" stop-color="#f97316" stop-opacity="0.3"/>' +
        "</radialGradient>" +
        '<filter id="la-cl-sh" x="-15%" y="-15%" width="130%" height="130%">' +
        '<feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.12"/>' +
        "</filter>" +
        "</defs>" +
        '<rect width="240" height="200" fill="#e2e8f0"/>' +
        '<g filter="url(#la-cl-sh)">' +
        '<circle cx="' +
        cx +
        '" cy="' +
        cy +
        '" r="78" fill="url(#la-cl-face)" stroke="#334155" stroke-width="3"/>' +
        "</g>" +
        '<path class="la-wedge" d="' +
        wedge +
        '" fill="url(#la-cl-wedge)" stroke="#ea580c" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="' +
        arc +
        '" fill="none" stroke="#ea580c" stroke-width="3" stroke-linecap="round"/>' +
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
          .map(function (i) {
            const a = (i / 12) * TAU - Math.PI / 2;
            const x1 = cx + Math.cos(a) * 68;
            const y1 = cy + Math.sin(a) * 68;
            const x2 = cx + Math.cos(a) * (i % 3 === 0 ? 58 : 62);
            const y2 = cy + Math.sin(a) * (i % 3 === 0 ? 58 : 62);
            return (
              '<line x1="' +
              x1 +
              '" y1="' +
              y1 +
              '" x2="' +
              x2 +
              '" y2="' +
              y2 +
              '" stroke="#334155" stroke-width="' +
              (i % 3 === 0 ? 2.5 : 1.5) +
              '" stroke-linecap="round"/>'
            );
          })
          .join("") +
        '<line x1="' +
        cx +
        '" y1="' +
        cy +
        '" x2="' +
        hourEnd.x +
        '" y2="' +
        hourEnd.y +
        '" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>' +
        '<line x1="' +
        cx +
        '" y1="' +
        cy +
        '" x2="' +
        minEnd.x +
        '" y2="' +
        minEnd.y +
        '" stroke="#dc2626" stroke-width="3.5" stroke-linecap="round"/>' +
        '<circle cx="' +
        cx +
        '" cy="' +
        cy +
        '" r="6" fill="#0f172a"/>' +
        '<circle cx="' +
        cx +
        '" cy="' +
        cy +
        '" r="2.5" fill="#f8fafc"/>' +
        '<text x="' +
        cx +
        '" y="36" text-anchor="middle" font-size="12" font-weight="700" fill="#64748b" font-family="system-ui,sans-serif">12</text>' +
        '<text x="188" y="105" text-anchor="middle" font-size="12" font-weight="700" fill="#64748b" font-family="system-ui,sans-serif">3</text>' +
        '<text x="' +
        cx +
        '" y="178" text-anchor="middle" font-size="12" font-weight="700" fill="#64748b" font-family="system-ui,sans-serif">6</text>' +
        '<text x="52" y="105" text-anchor="middle" font-size="12" font-weight="700" fill="#64748b" font-family="system-ui,sans-serif">9</text>' +
        '<text x="128" y="52" font-size="10" font-weight="800" fill="#0f172a" font-family="system-ui,sans-serif">akrep</text>' +
        '<text x="162" y="88" font-size="10" font-weight="800" fill="#dc2626" font-family="system-ui,sans-serif">yelkovan</text>'
    );
  }

  function book() {
    const vx = 120;
    const vy = 158;
    const lEdge = { x: 42, y: 48 };
    const rEdge = { x: 198, y: 48 };
    const wedge = svgWedgePath(vx, vy, lEdge.x, lEdge.y, rEdge.x, rEdge.y, 40);
    const arc = svgArcStroke(vx, vy, lEdge.x, lEdge.y, rEdge.x, rEdge.y, 46);

    return wrap(
      "0 0 240 180",
      "Açık kitap: sırt köşesinde sayfalar arası açı",
      '<defs>' +
        '<linearGradient id="la-bk-bg" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fde68a"/>' +
        "</linearGradient>" +
        '<linearGradient id="la-bk-page-l" x1="1" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fde68a"/>' +
        "</linearGradient>" +
        '<linearGradient id="la-bk-page-r" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#fef9c3"/><stop offset="100%" stop-color="#fef08a"/>' +
        "</linearGradient>" +
        '<linearGradient id="la-bk-spine" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#57534e"/><stop offset="50%" stop-color="#78716c"/><stop offset="100%" stop-color="#57534e"/>' +
        "</linearGradient>" +
        '<radialGradient id="la-bk-wedge" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#fde047" stop-opacity="0.85"/>' +
        '<stop offset="100%" stop-color="#f97316" stop-opacity="0.3"/>' +
        "</radialGradient>" +
        '<filter id="la-bk-sh" x="-10%" y="-10%" width="120%" height="120%">' +
        '<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#78350f" flood-opacity="0.12"/>' +
        "</filter>" +
        "</defs>" +
        '<rect width="240" height="180" fill="url(#la-bk-bg)"/>' +
        '<ellipse cx="120" cy="172" rx="88" ry="8" fill="#d6d3d1" opacity="0.5"/>' +
        '<path class="la-wedge" d="' +
        wedge +
        '" fill="url(#la-bk-wedge)" stroke="#ea580c" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="' +
        arc +
        '" fill="none" stroke="#ea580c" stroke-width="3" stroke-linecap="round"/>' +
        '<g filter="url(#la-bk-sh)">' +
        '<path d="M' +
        vx +
        " " +
        vy +
        " L" +
        lEdge.x +
        " " +
        lEdge.y +
        " Q" +
        (lEdge.x + 20) +
        " 32 " +
        (vx - 8) +
        " 38 L" +
        (vx - 6) +
        " " +
        vy +
        ' Z" fill="url(#la-bk-page-l)" stroke="#b45309" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M' +
        vx +
        " " +
        vy +
        " L" +
        rEdge.x +
        " " +
        rEdge.y +
        " Q" +
        (rEdge.x - 20) +
        " 32 " +
        (vx + 8) +
        " 38 L" +
        (vx + 6) +
        " " +
        vy +
        ' Z" fill="url(#la-bk-page-r)" stroke="#b45309" stroke-width="1.8" stroke-linejoin="round"/>' +
        "</g>" +
        '<rect x="114" y="44" width="12" height="118" fill="url(#la-bk-spine)" rx="2" stroke="#44403c" stroke-width="1"/>' +
        [58, 72, 86, 100].map(function (y) {
          return (
            '<line x1="52" y1="' +
            y +
            '" x2="108" y2="' +
            (y + 2) +
            '" stroke="rgba(120,53,15,0.2)" stroke-width="1.2"/>'
          );
        }).join("") +
        [58, 72, 86, 100].map(function (y) {
          return (
            '<line x1="132" y1="' +
            (y + 2) +
            '" x2="188" y2="' +
            y +
            '" stroke="rgba(120,53,15,0.2)" stroke-width="1.2"/>'
          );
        }).join("") +
        '<line x1="' +
        vx +
        '" y1="' +
        vy +
        '" x2="' +
        lEdge.x +
        '" y2="' +
        lEdge.y +
        '" stroke="#b45309" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="' +
        vx +
        '" y1="' +
        vy +
        '" x2="' +
        rEdge.x +
        '" y2="' +
        rEdge.y +
        '" stroke="#b45309" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="' +
        vx +
        '" cy="' +
        vy +
        '" r="5" fill="none" stroke="#2563eb" stroke-width="2"/>' +
        '<text x="' +
        vx +
        '" y="' +
        (vy + 18) +
        '" text-anchor="middle" font-size="11" font-weight="800" fill="#1d4ed8" font-family="system-ui,sans-serif">sırt (köşe)</text>'
    );
  }

  global.LIFE_ANGLE_SVG = {
    scissor: scissor(),
    door: door(),
    clock: clock(),
    book: book(),
  };
})(typeof window !== "undefined" ? window : globalThis);

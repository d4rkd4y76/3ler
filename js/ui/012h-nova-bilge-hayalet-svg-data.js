/* Bilge Hayalet — premium vektör (aura + rune halo + scroll) */
window.NOVA_BILGE_HAYALET_SVG_TEMPLATE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 360" fill="none" aria-hidden="true">'
  + '<defs>'
  + '<linearGradient id="bgBody__UID__" x1="0%" y1="0%" x2="0%" y2="100%">'
  + '<stop offset="0%" stop-color="#d1fae5"/><stop offset="35%" stop-color="#5eead4"/><stop offset="70%" stop-color="#14b8a6"/><stop offset="100%" stop-color="#0f766e"/>'
  + '</linearGradient>'
  + '<linearGradient id="bgEdge__UID__" x1="0%" y1="0%" x2="100%" y2="0%">'
  + '<stop offset="0%" stop-color="#99f6e4"/><stop offset="55%" stop-color="#34d399"/><stop offset="100%" stop-color="#22d3ee"/>'
  + '</linearGradient>'
  + '<radialGradient id="bgAura__UID__" cx="50%" cy="42%" r="62%">'
  + '<stop offset="0%" stop-color="#e0f2fe" stop-opacity=".75"/><stop offset="38%" stop-color="#5eead4" stop-opacity=".38"/><stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>'
  + '</radialGradient>'
  + '<linearGradient id="bgRune__UID__" x1="0%" y1="0%" x2="100%" y2="0%">'
  + '<stop offset="0%" stop-color="#fffbeb"/><stop offset="45%" stop-color="#fde047"/><stop offset="100%" stop-color="#22d3ee"/>'
  + '</linearGradient>'
  + '<linearGradient id="bgScroll__UID__" x1="0%" y1="0%" x2="0%" y2="100%">'
  + '<stop offset="0%" stop-color="#fff7ed"/><stop offset="55%" stop-color="#fde68a"/><stop offset="100%" stop-color="#f59e0b"/>'
  + '</linearGradient>'
  + '<filter id="bgShadow__UID__" x="-55%" y="-25%" width="210%" height="210%">'
  + '<feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#020617" flood-opacity=".55"/>'
  + '</filter>'
  + '<filter id="bgGlow__UID__" x="-70%" y="-70%" width="240%" height="240%">'
  + '<feGaussianBlur stdDeviation="4.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>'
  + '</filter>'
  + '</defs>'

  + '<ellipse cx="120" cy="346" rx="78" ry="10" fill="#020617" opacity=".22"/>'

  /* Aura */
  + '<g class="nova-hero__aura">'
  + '<circle class="nova-hero__core-glow" cx="120" cy="178" r="72" fill="url(#bgAura__UID__)" opacity=".22"/>'
  + '</g>'

  /* Rune halo (rotate) */
  + '<g class="nova-hero__runes" filter="url(#bgGlow__UID__)" style="transform-origin:120px 118px">'
  + '<circle class="nova-hero__rune-ring" cx="120" cy="118" r="52" stroke="url(#bgRune__UID__)" stroke-width="2" opacity=".32" stroke-dasharray="6 10"/>'
  + '<circle class="nova-hero__rune-ring2" cx="120" cy="118" r="38" stroke="#e0f2fe" stroke-width="1.6" opacity=".18" stroke-dasharray="2 8"/>'
  + '<circle class="nova-hero__rune-dot" cx="120" cy="66" r="4" fill="#fde047" opacity=".75"/>'
  + '<circle class="nova-hero__rune-dot" cx="82" cy="92" r="3" fill="#22d3ee" opacity=".55"/>'
  + '<circle class="nova-hero__rune-dot" cx="158" cy="92" r="3" fill="#99f6e4" opacity=".55"/>'
  + '</g>'

  /* Body */
  + '<g class="nova-hero__body" filter="url(#bgShadow__UID__)" style="transform-origin:120px 210px">'
  + '<path class="nova-hero__ghost" d="M120 62 C86 62 64 92 64 132 L64 250 C64 276 76 300 94 306 C104 300 110 292 120 292 C130 292 136 300 146 306 C164 300 176 276 176 250 L176 132 C176 92 154 62 120 62 Z" fill="url(#bgBody__UID__)"/>'
  + '<path d="M120 76 C98 76 84 96 84 122 L84 228 C84 240 90 252 98 256 C106 250 112 244 120 244 C128 244 134 250 142 256 C150 252 156 240 156 228 L156 122 C156 96 142 76 120 76 Z" fill="#ffffff" opacity=".10"/>'
  + '<path class="nova-hero__edge" d="M70 132 C70 96 90 70 120 70 C150 70 170 96 170 132 L170 248 C170 268 162 286 150 292 C140 286 132 278 120 278 C108 278 100 286 90 292 C78 286 70 268 70 248 Z" stroke="url(#bgEdge__UID__)" stroke-width="6" opacity=".55"/>'
  + '</g>'

  /* Face */
  + '<g class="nova-hero__head" style="transform-origin:120px 122px">'
  + '<circle class="nova-hero__eye-l" cx="102" cy="128" r="16" fill="#ffffff" opacity=".95"/>'
  + '<circle class="nova-hero__eye-r" cx="142" cy="128" r="12" fill="#ffffff" opacity=".95"/>'
  + '<circle cx="102" cy="128" r="10" fill="#0f172a" opacity=".78"/>'
  + '<circle cx="142" cy="128" r="7" fill="#0f172a" opacity=".78"/>'
  + '<circle cx="98" cy="124" r="4" fill="#e0f2fe" opacity=".9"/>'
  + '<circle cx="140" cy="124" r="3.2" fill="#e0f2fe" opacity=".9"/>'
  + '<path class="nova-hero__smile" d="M96 158 Q120 174 150 158" stroke="#0f766e" stroke-width="10" stroke-linecap="round" opacity=".55"/>'
  + '</g>'

  /* Arms */
  + '<g class="nova-hero__arm-l" style="transform-origin:66px 186px">'
  + '<path d="M76 178 C52 174 34 186 28 206 C40 206 56 204 74 192 Z" fill="url(#bgBody__UID__)" opacity=".96"/>'
  + '<path d="M70 186 C52 186 40 194 34 206" stroke="#e0f2fe" stroke-width="4" opacity=".22" stroke-linecap="round"/>'
  + '</g>'
  + '<g class="nova-hero__arm-r" style="transform-origin:174px 186px">'
  + '<path d="M164 178 C188 174 206 186 212 206 C200 206 184 204 166 192 Z" fill="url(#bgBody__UID__)" opacity=".96"/>'
  + '<path d="M170 186 C188 186 200 194 206 206" stroke="#e0f2fe" stroke-width="4" opacity=".22" stroke-linecap="round"/>'
  + '</g>'

  /* Scroll (wisdom prop) */
  + '<g class="nova-hero__scroll" filter="url(#bgShadow__UID__)" style="transform-origin:120px 232px">'
  + '<rect x="84" y="218" width="72" height="30" rx="12" fill="url(#bgScroll__UID__)" opacity=".98"/>'
  + '<rect x="90" y="224" width="60" height="18" rx="9" fill="#fff" opacity=".22"/>'
  + '<circle cx="86" cy="233" r="10" fill="#92400e" opacity=".55"/>'
  + '<circle cx="154" cy="233" r="10" fill="#92400e" opacity=".55"/>'
  + '<path d="M102 234 H138" stroke="#7c2d12" stroke-width="3" opacity=".35" stroke-linecap="round"/>'
  + '<path d="M104 228 H136" stroke="#7c2d12" stroke-width="2.4" opacity=".22" stroke-linecap="round"/>'
  + '</g>'

  /* Particles */
  + '<g class="nova-hero__sparks" opacity="0">'
  + '<circle cx="56" cy="238" r="3.6" fill="#e0f2fe"/><circle cx="188" cy="244" r="3.1" fill="#22d3ee"/>'
  + '<circle cx="120" cy="92" r="2.7" fill="#fffbeb"/><circle cx="206" cy="170" r="3.2" fill="#99f6e4"/>'
  + '<circle cx="34" cy="170" r="2.8" fill="#a7f3d0"/><circle cx="166" cy="116" r="2.2" fill="#fffbeb"/>'
  + '</g>'

  /* Wisdom beam (shown in FX) */
  + '<g class="nova-hero__beam" opacity="0">'
  + '<path class="nova-hero__beam-c" d="M120 168 C112 204 114 256 120 332 C126 256 128 204 120 168 Z" fill="url(#bgRune__UID__)" opacity=".55"/>'
  + '<path class="nova-hero__beam-l" d="M94 178 C74 216 70 264 66 330 C86 270 92 214 94 178 Z" fill="url(#bgRune__UID__)" opacity=".35"/>'
  + '<path class="nova-hero__beam-r" d="M146 178 C166 216 170 264 174 330 C154 270 148 214 146 178 Z" fill="url(#bgRune__UID__)" opacity=".35"/>'
  + '</g>'

  + '</svg>';


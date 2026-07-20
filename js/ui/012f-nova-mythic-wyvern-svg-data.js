/* Efsunlu Vayvern — ultra premium vektör (yüksek detay + orbit + shard katmanları) */
window.NOVA_MYTHIC_WYVERN_SVG_TEMPLATE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 360" fill="none" aria-hidden="true">'
  + '<defs>'
  + '<linearGradient id="mwBody__UID__" x1="0%" y1="0%" x2="0%" y2="100%">'
  + '<stop offset="0%" stop-color="#e0e7ff"/><stop offset="30%" stop-color="#a5b4fc"/><stop offset="70%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#1e1b4b"/>'
  + '</linearGradient>'
  + '<linearGradient id="mwWing__UID__" x1="0%" y1="0%" x2="100%" y2="0%">'
  + '<stop offset="0%" stop-color="#f5f3ff"/><stop offset="35%" stop-color="#c4b5fd"/><stop offset="70%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#0ea5e9"/>'
  + '</linearGradient>'
  + '<linearGradient id="mwWingDeep__UID__" x1="50%" y1="0%" x2="50%" y2="100%">'
  + '<stop offset="0%" stop-color="#7c3aed"/><stop offset="70%" stop-color="#312e81"/><stop offset="100%" stop-color="#0b1220"/>'
  + '</linearGradient>'
  + '<linearGradient id="mwGold__UID__" x1="0%" y1="0%" x2="100%" y2="0%">'
  + '<stop offset="0%" stop-color="#fffbeb"/><stop offset="45%" stop-color="#fde047"/><stop offset="100%" stop-color="#f59e0b"/>'
  + '</linearGradient>'
  + '<radialGradient id="mwCoreGlow__UID__" cx="50%" cy="45%" r="60%">'
  + '<stop offset="0%" stop-color="#e9d5ff" stop-opacity=".8"/><stop offset="45%" stop-color="#a78bfa" stop-opacity=".35"/><stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>'
  + '</radialGradient>'
  + '<linearGradient id="mwBreath__UID__" x1="50%" y1="100%" x2="50%" y2="0%">'
  + '<stop offset="0%" stop-color="#1e1b4b"/><stop offset="35%" stop-color="#7c3aed"/><stop offset="70%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#e0f2fe"/>'
  + '</linearGradient>'
  + '<filter id="mwShadow__UID__" x="-55%" y="-25%" width="210%" height="210%">'
  + '<feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#020617" flood-opacity=".55"/>'
  + '</filter>'
  + '<filter id="mwGlow__UID__" x="-70%" y="-70%" width="240%" height="240%">'
  + '<feGaussianBlur stdDeviation="4.2" result="b"/>'
  + '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>'
  + '</filter>'
  + '</defs>'

  + '<ellipse cx="120" cy="346" rx="78" ry="10" fill="#020617" opacity=".22"/>'

  /* Breath / energy stream (shown in FX) */
  + '<g class="nova-hero__flames" opacity="0">'
  + '<path class="nova-hero__flame nova-hero__flame-c" d="M120 214 C108 250 110 296 120 334 C130 296 132 250 120 214 Z" fill="url(#mwBreath__UID__)" opacity=".85"/>'
  + '<path class="nova-hero__flame nova-hero__flame-l" d="M96 222 C66 260 60 298 56 334 C84 298 92 254 96 222 Z" fill="url(#mwBreath__UID__)" opacity=".62"/>'
  + '<path class="nova-hero__flame nova-hero__flame-r" d="M144 222 C174 260 180 298 184 334 C156 298 148 254 144 222 Z" fill="url(#mwBreath__UID__)" opacity=".62"/>'
  + '</g>'

  /* Orbit rings (rotate in idle/epic) */
  + '<g class="nova-hero__orbits" opacity=".95">'
  + '<circle class="nova-hero__orbit nova-hero__orbit--1" cx="120" cy="198" r="64" stroke="#c4b5fd" stroke-width="2.2" opacity=".35" stroke-dasharray="8 10"/>'
  + '<circle class="nova-hero__orbit nova-hero__orbit--2" cx="120" cy="198" r="50" stroke="#60a5fa" stroke-width="2" opacity=".26" stroke-dasharray="4 9"/>'
  + '<circle class="nova-hero__orbit nova-hero__orbit--3" cx="120" cy="198" r="36" stroke="#e9d5ff" stroke-width="1.6" opacity=".22" stroke-dasharray="2 8"/>'
  + '</g>'

  /* Aura / core glow */
  + '<g class="nova-hero__aura">'
  + '<circle class="nova-hero__core-glow" cx="120" cy="198" r="62" fill="url(#mwCoreGlow__UID__)" opacity="0"/>'
  + '</g>'

  /* Shards (spark burst) */
  + '<g class="nova-hero__shards" opacity="0">'
  + '<path class="nova-hero__shard" d="M40 190 L56 184 L52 202 Z" fill="#c4b5fd" opacity=".85"/>'
  + '<path class="nova-hero__shard" d="M198 196 L210 186 L212 206 Z" fill="#60a5fa" opacity=".85"/>'
  + '<path class="nova-hero__shard" d="M78 120 L94 112 L90 132 Z" fill="#e9d5ff" opacity=".75"/>'
  + '<path class="nova-hero__shard" d="M156 124 L170 112 L172 132 Z" fill="#c4b5fd" opacity=".75"/>'
  + '<path class="nova-hero__shard" d="M112 300 L120 286 L128 300 L120 312 Z" fill="#60a5fa" opacity=".6"/>'
  + '</g>'

  /* Wings */
  + '<g class="nova-hero__wings" filter="url(#mwShadow__UID__)">'
  + '<g class="nova-hero__wing-l" style="transform-origin:92px 186px">'
  + '<path d="M108 182 C72 154 28 170 18 214 C8 258 40 292 86 284 C128 276 148 238 146 206 C144 190 126 186 108 182 Z" fill="url(#mwWingDeep__UID__)" opacity=".92"/>'
  + '<path d="M104 186 C80 178 52 198 44 228 C36 258 54 274 80 270 C112 266 128 242 130 216 C132 200 120 190 104 186 Z" fill="url(#mwWing__UID__)" opacity=".95"/>'
  + '<path d="M110 208 C88 222 68 248 64 276" stroke="#f5f3ff" stroke-width="1.4" opacity=".16" fill="none"/>'
  + '</g>'
  + '<g class="nova-hero__wing-r" style="transform-origin:148px 186px">'
  + '<path d="M132 182 C168 154 212 170 222 214 C232 258 200 292 154 284 C112 276 92 238 94 206 C96 190 114 186 132 182 Z" fill="url(#mwWingDeep__UID__)" opacity=".92"/>'
  + '<path d="M136 186 C160 178 188 198 196 228 C204 258 186 274 160 270 C128 266 112 242 110 216 C108 200 120 190 136 186 Z" fill="url(#mwWing__UID__)" opacity=".95"/>'
  + '<path d="M130 208 C152 222 172 248 176 276" stroke="#f5f3ff" stroke-width="1.4" opacity=".16" fill="none"/>'
  + '</g>'
  + '</g>'

  /* Tail + legs base */
  + '<g class="nova-hero__legs" filter="url(#mwShadow__UID__)" opacity=".98">'
  + '<path d="M120 238 C104 256 92 280 86 308 C104 294 116 280 120 266 C124 280 136 294 154 308 C148 280 136 256 120 238 Z" fill="url(#mwWingDeep__UID__)" opacity=".9"/>'
  + '<path d="M120 246 C110 262 106 278 106 298 C114 288 120 280 120 272 C120 280 126 288 134 298 C134 278 130 262 120 246 Z" fill="url(#mwWing__UID__)" opacity=".55"/>'
  + '</g>'

  /* Body */
  + '<g class="nova-hero__body" filter="url(#mwShadow__UID__)" style="transform-origin:120px 214px">'
  + '<path d="M120 132 C100 136 88 152 90 176 C92 230 110 254 120 270 C130 254 148 230 150 176 C152 152 140 136 120 132 Z" fill="url(#mwBody__UID__)"/>'
  + '<path d="M120 144 C110 146 104 156 104 172 C104 210 114 232 120 242 C126 232 136 210 136 172 C136 156 130 146 120 144 Z" fill="#f5f3ff" opacity=".08"/>'
  + '<path class="nova-hero__chest-ring" d="M120 166 C106 170 102 182 104 196 C108 218 114 232 120 240 C126 232 132 218 136 196 C138 182 134 170 120 166 Z" fill="url(#mwGold__UID__)" opacity=".22"/>'
  + '</g>'

  /* Head */
  + '<g class="nova-hero__head" filter="url(#mwShadow__UID__)" style="transform-origin:120px 110px">'
  + '<path d="M120 60 C102 62 90 74 90 94 C90 122 110 140 120 144 C130 140 150 122 150 94 C150 74 138 62 120 60 Z" fill="url(#mwBody__UID__)"/>'
  + '<path d="M106 72 C114 60 118 54 120 52 C122 54 126 60 134 72" fill="#e9d5ff" opacity=".16"/>'
  + '<ellipse class="nova-hero__eye-l" cx="110" cy="96" rx="7.8" ry="8.8" fill="#0f172a" opacity=".92"/>'
  + '<ellipse class="nova-hero__eye-r" cx="130" cy="96" rx="7.8" ry="8.8" fill="#0f172a" opacity=".92"/>'
  + '<circle cx="108.6" cy="93.4" r="3.4" fill="#fff7ed" opacity=".9"/>'
  + '<circle cx="128.6" cy="93.4" r="3.4" fill="#fff7ed" opacity=".9"/>'
  + '<path class="nova-hero__beak" d="M120 102 L154 114 L120 130 L86 114 Z" fill="url(#mwGold__UID__)" opacity=".98"/>'
  + '<path class="nova-hero__visor-shine" d="M104 84 Q120 76 136 84" stroke="#fff7ed" stroke-width="2.2" opacity=".16" stroke-linecap="round"/>'
  + '</g>'

  /* Sparks */
  + '<g class="nova-hero__sparks" opacity="0">'
  + '<circle cx="52" cy="250" r="3.6" fill="#e9d5ff"/><circle cx="188" cy="244" r="3.1" fill="#60a5fa"/>'
  + '<circle cx="120" cy="102" r="2.7" fill="#fff7ed"/><circle cx="208" cy="178" r="3.2" fill="#c4b5fd"/>'
  + '<circle cx="34" cy="182" r="2.8" fill="#a5b4fc"/><circle cx="166" cy="118" r="2.2" fill="#fff7ed"/>'
  + '</g>'

  + '</svg>';


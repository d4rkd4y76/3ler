/* Buz Ejderi — epik gerçekçi katmanlı ejderha (girintili kanatlar, anatomik kafa, yoğun pullar) */
(function () {
  'use strict';

  function scalePlate(x, y, w, h, rot, fill, stroke, op) {
    var cx = x + w * 0.5;
    var cy = y + h * 0.5;
    var d = 'M' + x + ' ' + (y + h * 0.12)
      + ' C' + (x + w * 0.15) + ' ' + (y - h * 0.08) + ' ' + (x + w * 0.85) + ' ' + (y - h * 0.1) + ' ' + (x + w) + ' ' + (y + h * 0.18)
      + ' C' + (x + w * 0.95) + ' ' + (y + h * 0.58) + ' ' + (x + w * 0.52) + ' ' + (y + h * 1.05) + ' ' + cx + ' ' + (y + h)
      + ' C' + (x + w * 0.48) + ' ' + (y + h * 1.05) + ' ' + (x + w * 0.05) + ' ' + (y + h * 0.58) + ' ' + x + ' ' + (y + h * 0.18) + ' Z';
    var tr = rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : '';
    var st = stroke ? ' stroke="' + stroke + '" stroke-width="0.55"' : '';
    return '<path class="nova-hero__scale"' + tr + ' d="' + d + '" fill="' + fill + '" opacity="' + op + '"' + st + '/>';
  }

  function buildSpineRow(uid, cx, startY, count, gapY) {
    var html = '';
    var i, y, wobble;
    for (i = 0; i < count; i++) {
      y = startY + i * gapY;
      wobble = (i % 2 ? -4 : 4);
      html += '<path class="nova-hero__spine" d="M' + (cx + wobble) + ' ' + y
        + ' L' + (cx - 9 + wobble) + ' ' + (y - 18)
        + ' L' + cx + ' ' + (y - 26)
        + ' L' + (cx + 9 + wobble) + ' ' + (y - 18) + ' Z" fill="url(#beHorn__' + uid + ')" opacity="' + (0.74 + (i % 3) * 0.09) + '"/>';
      html += '<path d="M' + cx + ' ' + (y - 22) + ' L' + cx + ' ' + (y - 6) + '" stroke="#a5f3fc" stroke-width="1.4" opacity=".4"/>';
    }
    return html;
  }

  function buildScaleField(uid, ox, oy, rows, cols, pw, ph, gapX, gapY, tone) {
    var fills = [
      'url(#beScaleD__' + uid + ')',
      'url(#beScaleM__' + uid + ')',
      'url(#beScaleH__' + uid + ')'
    ];
    var strokes = ['#0c4a6e', '#155e75', '#164e63'];
    var html = '';
    var r, c, x, y, fi;
    for (r = 0; r < rows; r++) {
      for (c = 0; c < cols; c++) {
        x = ox + c * gapX + (r % 2) * (gapX * 0.46);
        y = oy + r * gapY;
        fi = (r + c + tone) % 3;
        html += scalePlate(
          x, y,
          pw * (0.86 + (c % 3) * 0.07),
          ph * (0.88 + (r % 2) * 0.12),
          (r % 2 ? -5 : 4) + (c % 3) - 1,
          fills[fi],
          strokes[fi],
          0.8 + ((r * cols + c) % 5) * 0.045
        );
      }
    }
    return html;
  }

  /* Üst kanatlar — kıvrımlı, damarlı, yan kanatla birleşik */
  function buildUpperDragonWings(u) {
    var s = '';
    s += '<g class="nova-hero__wings-upper" filter="url(#beShadow__' + u + ')">';
    s += '<g class="nova-hero__wing-up-l" style="transform-origin:108px 198px">';
    s += '<path d="M100 218 C94 208 84 192 72 170 C58 144 42 112 28 80 C18 56 10 36 12 22 C16 10 32 8 48 20 C64 34 78 56 88 82 C96 108 100 142 102 178 C103 198 102 210 100 218 Z" fill="url(#beWingDeep__' + u + ')" opacity=".76"/>';
    s += '<path class="nova-hero__wing-up-membrane-l" d="M102 216 C96 204 86 186 74 162 C60 134 44 100 30 68 C22 48 18 32 22 24 C28 14 42 16 56 30 C72 48 86 74 94 102 C100 132 102 168 102 200 C102 208 102 212 102 216 Z" fill="url(#beWingMem__' + u + ')" opacity=".7"/>';
    s += '<path d="M28 80 L24 74 L30 70 L26 64 L32 58 L28 52 L34 46 L30 40 L36 34" stroke="#a5f3fc" stroke-width="1.4" opacity=".45" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<path d="M48 20 L44 14 L50 10 L46 4" stroke="#ecfeff" stroke-width="1.1" opacity=".35" fill="none" stroke-linecap="round"/>';
    s += '<path d="M100 218 C88 198 72 168 52 132 C36 100 24 68 20 40 C18 28 20 18 28 14" stroke="url(#beWingBone__' + u + ')" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".9"/>';
    s += '<path d="M100 218 C82 188 58 148 38 108 C28 82 22 54 24 32" stroke="url(#beWingBone__' + u + ')" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".75"/>';
    s += '<path d="M100 218 C90 178 76 138 62 102 C54 84 48 68 46 52" stroke="url(#beWingBone__' + u + ')" stroke-width="2" stroke-linecap="round" fill="none" opacity=".62"/>';
    s += '<path d="M72 170 C64 158 56 146 50 134 M42 112 C36 102 30 92 26 82" stroke="#67e8f9" stroke-width="1.3" opacity=".38" stroke-linecap="round"/>';
    s += '<path d="M100 218 L102 220 L108 234 L114 252 L108 268 L102 248 L100 218 Z" fill="url(#beWingMem__' + u + ')" opacity=".62"/>';
    s += '</g>';
    s += '<g class="nova-hero__wing-up-r" style="transform-origin:132px 198px">';
    s += '<path d="M140 218 C146 208 156 192 168 170 C182 144 198 112 212 80 C222 56 230 36 228 22 C224 10 208 8 192 20 C176 34 162 56 152 82 C144 108 140 142 138 178 C137 198 138 210 140 218 Z" fill="url(#beWingDeep__' + u + ')" opacity=".76"/>';
    s += '<path class="nova-hero__wing-up-membrane-r" d="M138 216 C144 204 154 186 166 162 C180 134 196 100 210 68 C218 48 222 32 218 24 C212 14 198 16 184 30 C168 48 154 74 146 102 C140 132 138 168 138 200 C138 208 138 212 138 216 Z" fill="url(#beWingMem__' + u + ')" opacity=".7"/>';
    s += '<path d="M212 80 L216 74 L210 70 L214 64 L208 58 L212 52 L206 46 L210 40 L204 34" stroke="#a5f3fc" stroke-width="1.4" opacity=".45" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<path d="M192 20 L196 14 L190 10 L194 4" stroke="#ecfeff" stroke-width="1.1" opacity=".35" fill="none" stroke-linecap="round"/>';
    s += '<path d="M140 218 C152 198 168 168 188 132 C204 100 216 68 220 40 C222 28 220 18 212 14" stroke="url(#beWingBone__' + u + ')" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".9"/>';
    s += '<path d="M140 218 C158 188 182 148 202 108 C212 82 218 54 216 32" stroke="url(#beWingBone__' + u + ')" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".75"/>';
    s += '<path d="M140 218 C150 178 164 138 178 102 C186 84 192 68 194 52" stroke="url(#beWingBone__' + u + ')" stroke-width="2" stroke-linecap="round" fill="none" opacity=".62"/>';
    s += '<path d="M168 170 C176 158 184 146 190 134 M198 112 C204 102 210 92 214 82" stroke="#67e8f9" stroke-width="1.3" opacity=".38" stroke-linecap="round"/>';
    s += '<path d="M140 218 L138 220 L132 234 L126 252 L132 268 L138 248 L140 218 Z" fill="url(#beWingMem__' + u + ')" opacity=".62"/>';
    s += '</g>';
    s += '</g>';
    return s;
  }

  /* Görkemli ejder kanatları — geniş açılı, omuz hizası, damarlı */
  function buildSpreadDragonWings(u) {
    var s = '';
    s += '<g class="nova-hero__wings" filter="url(#beShadow__' + u + ')">';
    s += '<g class="nova-hero__wing-l" style="transform-origin:98px 218px">';
    s += '<path d="M100 218 L38 228 L4 258 L0 298 L6 336 L34 354 L72 352 L108 328 L124 282 L130 232 L124 218 L100 218 Z" fill="url(#beWingDeep__' + u + ')" opacity=".92"/>';
    s += '<path class="nova-hero__wing-membrane-l" d="M102 220 L48 232 L14 262 L6 292 L10 322 L36 348 L74 346 L110 322 L122 278 L128 228 L120 218 L102 220 Z" fill="url(#beWingMem__' + u + ')" opacity=".88"/>';
    s += '<path d="M102 220 L100 218 L104 200 L110 178 L118 158 L124 218 L102 220 Z" fill="url(#beWingMem__' + u + ')" opacity=".72"/>';
    s += '<path d="M102 220 L110 228 L118 222 L116 210 L106 208 L102 220 Z" fill="url(#beWingMem__' + u + ')" opacity=".55"/>';
    s += '<path d="M100 218 L34 242 L6 278 L0 308 L8 342 L40 356 L80 352 L118 318 L132 268 L126 218" stroke="url(#beWingBone__' + u + ')" stroke-width="3.8" stroke-linecap="round" fill="none" opacity=".93"/>';
    s += '<path d="M100 218 L52 236 L18 268 L4 298" stroke="url(#beWingBone__' + u + ')" stroke-width="2.8" stroke-linecap="round" fill="none" opacity=".78"/>';
    s += '<path d="M100 218 L72 248 L42 278 L22 308" stroke="url(#beWingBone__' + u + ')" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".65"/>';
    s += '<path d="M100 218 L82 258 L58 292 L38 328" stroke="#a5f3fc" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".48"/>';
    s += '<path d="M38 228 L22 242 L10 258 M14 262 L2 278 L0 298 M52 236 L36 252 L24 268" stroke="#67e8f9" stroke-width="1.4" opacity=".36" stroke-linecap="round"/>';
    s += '<path d="M4 258 L0 272 L4 286 M34 354 L44 344 L54 334" stroke="#ecfeff" stroke-width="1.2" opacity=".28" stroke-linecap="round"/>';
    s += '</g>';
    s += '<g class="nova-hero__wing-r" style="transform-origin:142px 218px">';
    s += '<path d="M140 218 L202 228 L236 258 L240 298 L234 336 L206 354 L168 352 L132 328 L116 282 L110 232 L116 218 L140 218 Z" fill="url(#beWingDeep__' + u + ')" opacity=".92"/>';
    s += '<path class="nova-hero__wing-membrane-r" d="M138 220 L192 232 L226 262 L234 292 L230 322 L204 348 L166 346 L130 322 L118 278 L112 228 L120 218 L138 220 Z" fill="url(#beWingMem__' + u + ')" opacity=".88"/>';
    s += '<path d="M138 220 L140 218 L136 200 L130 178 L122 158 L116 218 L138 220 Z" fill="url(#beWingMem__' + u + ')" opacity=".72"/>';
    s += '<path d="M138 220 L130 228 L122 222 L124 210 L134 208 L138 220 Z" fill="url(#beWingMem__' + u + ')" opacity=".55"/>';
    s += '<path d="M140 218 L206 242 L234 278 L240 308 L232 342 L200 356 L160 352 L122 318 L108 268 L114 218" stroke="url(#beWingBone__' + u + ')" stroke-width="3.8" stroke-linecap="round" fill="none" opacity=".93"/>';
    s += '<path d="M140 218 L188 236 L222 268 L236 298" stroke="url(#beWingBone__' + u + ')" stroke-width="2.8" stroke-linecap="round" fill="none" opacity=".78"/>';
    s += '<path d="M140 218 L168 248 L198 278 L218 308" stroke="url(#beWingBone__' + u + ')" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".65"/>';
    s += '<path d="M140 218 L158 258 L182 292 L202 328" stroke="#a5f3fc" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".48"/>';
    s += '<path d="M202 228 L218 242 L230 258 M226 262 L238 278 L240 298 M188 236 L204 252 L216 268" stroke="#67e8f9" stroke-width="1.4" opacity=".36" stroke-linecap="round"/>';
    s += '<path d="M236 258 L240 272 L236 286 M206 354 L196 344 L186 334" stroke="#ecfeff" stroke-width="1.2" opacity=".28" stroke-linecap="round"/>';
    s += '</g>';
    s += '</g>';
    return s;
  }

  /* Buz kristal tac — çok katmanlı epik taç */
  function buildIceCrown(u) {
    var s = '';
    s += '<g class="nova-hero__crown" filter="url(#beGlow__' + u + ')">';
    s += '<path d="M118 6 L104 30 L132 30 Z" fill="url(#beHorn__' + u + ')" opacity=".95"/>';
    s += '<path d="M118 10 L110 26 L126 26 Z" fill="#ecfeff" opacity=".75"/>';
    s += '<path d="M118 6 L118 14" stroke="#f0fdfa" stroke-width="1.4" opacity=".85"/>';
    s += '<path class="nova-hero__crown-spire-l" d="M96 24 L86 42 L100 38 L94 32 Z" fill="url(#beHorn__' + u + ')" opacity=".9"/>';
    s += '<path class="nova-hero__crown-spire-r" d="M140 24 L150 42 L136 38 L142 32 Z" fill="url(#beHorn__' + u + ')" opacity=".9"/>';
    s += '<path d="M88 36 L78 52 L92 48 L86 42 Z" fill="url(#beHorn__' + u + ')" opacity=".78"/>';
    s += '<path d="M148 36 L158 52 L144 48 L150 42 Z" fill="url(#beHorn__' + u + ')" opacity=".78"/>';
    s += '<path d="M92 34 L118 28 L144 34 L140 42 L96 42 Z" fill="#a5f3fc" opacity=".35"/>';
    s += '<path d="M98 38 L118 32 L138 38 L134 44 L102 44 Z" fill="#ecfeff" opacity=".55"/>';
    s += '<path d="M104 40 L118 36 L132 40" stroke="#f0fdfa" stroke-width="1.2" opacity=".7" fill="none"/>';
    s += '<circle cx="118" cy="30" r="2.2" fill="#fff" opacity=".9"/>';
    s += '<circle cx="104" cy="36" r="1.4" fill="#ecfeff" opacity=".85"/>';
    s += '<circle cx="132" cy="36" r="1.4" fill="#ecfeff" opacity=".85"/>';
    s += '<path d="M110 42 L114 38 L118 42 L122 38 L126 42" stroke="#67e8f9" stroke-width="1" opacity=".5" fill="none"/>';
    s += '</g>';
    return s;
  }

  /* Ejderha kafası — sevimli, parlayan göz, kulaklı */
  function buildHeroHead(u) {
    var s = '';
    s += buildIceCrown(u);

    s += '<g class="nova-hero__head" filter="url(#beShadow__' + u + ')" style="transform-origin:118px 72px">';

    s += '<g class="nova-hero__ear-l">';
    s += '<path d="M88 70 L76 54 L72 74 L78 90 L92 94 L98 80 Z" fill="url(#beBodyMass__' + u + ')" opacity=".9"/>';
    s += '<path d="M86 72 L80 62 L78 78 L84 88 L90 86 Z" fill="url(#beBelly__' + u + ')" opacity=".32"/>';
    s += '</g>';
    s += '<g class="nova-hero__ear-r">';
    s += '<path d="M148 70 L160 54 L164 74 L158 90 L144 94 L138 80 Z" fill="url(#beBodyMass__' + u + ')" opacity=".9"/>';
    s += '<path d="M150 72 L156 62 L158 78 L152 88 L146 86 Z" fill="url(#beBelly__' + u + ')" opacity=".32"/>';
    s += '</g>';

    s += '<path d="M118 38 L96 48 L84 68 L86 94 L100 112 L118 120 L136 112 L150 94 L152 68 L140 48 Z" fill="url(#beBodyMass__' + u + ')"/>';
    s += '<path d="M118 48 L102 54 L94 72 L96 92 L108 106 L118 110 L128 106 L140 92 L142 72 L134 54 Z" fill="url(#beBelly__' + u + ')" opacity=".32"/>';
    s += '<ellipse cx="96" cy="96" rx="5" ry="3.5" fill="#67e8f9" opacity=".12"/>';
    s += '<ellipse cx="140" cy="96" rx="5" ry="3.5" fill="#67e8f9" opacity=".12"/>';
    s += '<g class="nova-hero__scales nova-hero__scales--head">';
    s += buildScaleField(u, 94, 54, 3, 6, 5.5, 4.5, 6.5, 5.2, 5);
    s += buildScaleField(u, 98, 74, 2, 6, 5, 4.2, 6, 5, 6);
    s += '</g>';

    s += '<path class="nova-hero__brow" d="M100 78 Q108 74 114 78" stroke="#a5f3fc" stroke-width="1.6" opacity=".28" fill="none" stroke-linecap="round"/>';
    s += '<path class="nova-hero__brow" d="M136 78 Q128 74 122 78" stroke="#a5f3fc" stroke-width="1.6" opacity=".28" fill="none" stroke-linecap="round"/>';

    s += '<ellipse class="nova-hero__eye-glow-l" cx="106" cy="86" rx="10" ry="9" fill="url(#beEyeGlow__' + u + ')" opacity=".35"/>';
    s += '<ellipse class="nova-hero__eye-glow-r" cx="130" cy="86" rx="10" ry="9" fill="url(#beEyeGlow__' + u + ')" opacity=".35"/>';
    s += '<g class="nova-hero__eye-l" filter="url(#beGlow__' + u + ')">';
    s += '<ellipse cx="106" cy="86" rx="7.5" ry="8.5" fill="#fff" opacity=".98"/>';
    s += '<ellipse cx="106" cy="87" rx="5.5" ry="6.5" fill="url(#beEyeGlow__' + u + ')" opacity=".99"/>';
    s += '<ellipse cx="106" cy="88" rx="2.6" ry="3.2" fill="#0891b2" opacity=".28"/>';
    s += '<circle cx="103" cy="83" r="2.4" fill="#fff" opacity=".99"/>';
    s += '<circle cx="108" cy="89" r="1.1" fill="#ecfeff" opacity=".9"/>';
    s += '</g>';
    s += '<g class="nova-hero__eye-r" filter="url(#beGlow__' + u + ')">';
    s += '<ellipse cx="130" cy="86" rx="7.5" ry="8.5" fill="#fff" opacity=".98"/>';
    s += '<ellipse cx="130" cy="87" rx="5.5" ry="6.5" fill="url(#beEyeGlow__' + u + ')" opacity=".99"/>';
    s += '<ellipse cx="130" cy="88" rx="2.6" ry="3.2" fill="#0891b2" opacity=".28"/>';
    s += '<circle cx="133" cy="83" r="2.4" fill="#fff" opacity=".99"/>';
    s += '<circle cx="128" cy="89" r="1.1" fill="#ecfeff" opacity=".9"/>';
    s += '</g>';

    s += '<path class="nova-hero__snout" d="M118 102 L108 106 L104 114 L108 122 L118 126 L128 122 L132 114 L128 106 Z" fill="url(#beBodyMass__' + u + ')" opacity=".9"/>';
    s += '<path d="M118 102 L112 106 L110 114 L118 120 L126 114 L124 106 Z" fill="url(#beBelly__' + u + ')" opacity=".22"/>';
    s += '<g class="nova-hero__scales nova-hero__scales--snout">';
    s += buildScaleField(u, 112, 106, 2, 4, 4.2, 3.5, 5, 4.2, 9);
    s += '</g>';
    s += '<ellipse class="nova-hero__nostril" cx="114" cy="116" rx="1.2" ry=".9" fill="#0e7490" opacity=".18"/>';
    s += '<ellipse class="nova-hero__nostril" cx="122" cy="116" rx="1.2" ry=".9" fill="#0e7490" opacity=".18"/>';

    s += '<g class="nova-hero__jaw" style="transform-origin:118px 120px">';
    s += '<path class="nova-hero__upper-lip" d="M110 114 Q118 110 126 114" stroke="#a5f3fc" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/>';
    s += '<path d="M110 118 Q118 126 126 118 L124 116 Q118 114 112 116 Z" fill="#083344" opacity=".4"/>';
    s += '<path d="M112 118 Q118 122 124 118" stroke="#67e8f9" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"/>';
    s += '<path d="M114 120 Q118 121 122 120" stroke="#ecfeff" stroke-width="1.2" fill="none" opacity=".55"/>';
    s += '</g>';
    s += '<circle class="nova-hero__mouth" cx="118" cy="120" r="1.8" fill="#cffafe" opacity=".12"/>';
    s += '</g>';
    return s;
  }

  /* Kuyruk tabanı — gövdenin arkasından çıkar */
  function buildTailBehind(u) {
    var s = '';
    s += '<g class="nova-hero__tail-behind" filter="url(#beShadow__' + u + ')" style="transform-origin:128px 268px">';
    s += '<path d="M128 268 C118 270 112 276 110 284 C108 292 112 300 122 306 C138 314 158 312 172 302 C186 292 196 278 200 262 C196 256 188 252 178 252 C162 252 148 258 136 264 C130 266 128 268 128 268 Z" fill="url(#beWingDeep__' + u + ')" opacity=".82"/>';
    s += '<path d="M128 270 C120 272 116 278 116 286 C118 296 128 304 148 308 C168 310 186 300 194 284 C190 276 180 270 168 268 C152 266 138 268 128 270 Z" fill="url(#beBodyMass__' + u + ')" opacity=".9"/>';
    s += '<path class="nova-hero__tail-spine" d="M128 268 C138 272 152 278 168 286 C182 294 194 304 202 316" stroke="#7dd3fc" stroke-width="2.8" opacity=".38" stroke-linecap="round" fill="none"/>';
    s += '</g>';
    return s;
  }

  /* Kuyruk ön segment + buz ucu — net görünür */
  function buildTailFront(u) {
    var s = '';
    s += '<g class="nova-hero__tail" filter="url(#beShadow__' + u + ')" style="transform-origin:188px 310px">';
    s += '<path d="M168 288 C182 296 196 308 206 322 C214 334 220 344 224 352 L232 356 C226 344 218 328 206 312 C192 296 178 286 162 282 C156 280 160 284 168 288 Z" fill="url(#beBodyMass__' + u + ')" opacity=".96"/>';
    s += '<path d="M172 290 C186 298 200 310 210 324 C218 336 224 346 228 354" stroke="#7dd3fc" stroke-width="3.4" opacity=".5" stroke-linecap="round" fill="none"/>';
    s += '<g class="nova-hero__scales nova-hero__scales--tail">';
    s += buildScaleField(u, 174, 292, 2, 4, 8, 6, 9, 7, 2);
    s += buildScaleField(u, 188, 308, 2, 3, 7, 5.5, 8, 6.5, 3);
    s += '</g>';
    s += '<path d="M182 296 L190 290 L186 302 Z" fill="#164e63" opacity=".38"/>';
    s += '<path d="M200 314 L208 308 L204 320 Z" fill="#164e63" opacity=".35"/>';
    s += '<path class="nova-hero__tail-frost" d="M178 292 C194 306 210 322 222 338 C228 346 232 352 236 356 C220 338 202 316 184 300 Z" fill="#ecfeff" opacity=".16"/>';

    s += '<g class="nova-hero__tail-ice-burst">';
    s += '<ellipse class="nova-hero__tail-ice-glow" cx="228" cy="352" rx="24" ry="20" fill="url(#beTailIce__' + u + ')" opacity=".68"/>';
    s += '<path class="nova-hero__tail-tip" d="M214 346 L240 358 L230 342 L218 336 L206 342 Z" fill="#67e8f9" opacity=".96" filter="url(#beGlow__' + u + ')"/>';
    s += '<path class="nova-hero__tail-tip" d="M224 338 L242 352 L228 348 Z" fill="#ecfeff" opacity=".92"/>';
    s += '<path class="nova-hero__tail-ice-shard" d="M202 344 L218 332 L210 352 Z" fill="#a5f3fc" opacity=".9"/>';
    s += '<path class="nova-hero__tail-ice-shard" d="M236 348 L240 360 L226 354 Z" fill="#cffafe" opacity=".85"/>';
    s += '<path class="nova-hero__tail-ice-shard" d="M220 354 L236 360 L226 364 Z" fill="#ecfeff" opacity=".8"/>';
    s += '<circle class="nova-hero__tail-ice-spark" cx="210" cy="348" r="2.2" fill="#fff" opacity=".92"/>';
    s += '<circle class="nova-hero__tail-ice-spark" cx="234" cy="354" r="1.8" fill="#ecfeff" opacity=".88"/>';
    s += '</g>';
    s += '</g>';
    return s;
  }

  function buildTemplate(uid) {
    var u = uid;
    var s = '';

    s += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 360" fill="none" aria-hidden="true">';
    s += '<defs>';
    s += '<clipPath id="beSilhouette__' + u + '"><ellipse cx="118" cy="188" rx="88" ry="118"/></clipPath>';

    s += '<linearGradient id="beScaleD__' + u + '" x1="0%" y1="0%" x2="100%" y2="100%">'
      + '<stop offset="0%" stop-color="#0c4a6e"/><stop offset="55%" stop-color="#164e63"/><stop offset="100%" stop-color="#042f2e"/>'
      + '</linearGradient>';
    s += '<linearGradient id="beScaleM__' + u + '" x1="20%" y1="0%" x2="80%" y2="100%">'
      + '<stop offset="0%" stop-color="#155e75"/><stop offset="40%" stop-color="#0e7490"/><stop offset="100%" stop-color="#083344"/>'
      + '</linearGradient>';
    s += '<linearGradient id="beScaleH__' + u + '" x1="0%" y1="0%" x2="100%" y2="100%">'
      + '<stop offset="0%" stop-color="#ecfeff"/><stop offset="35%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#0e7490"/>'
      + '</linearGradient>';
    s += '<linearGradient id="beWingMem__' + u + '" x1="0%" y1="0%" x2="100%" y2="100%">'
      + '<stop offset="0%" stop-color="#f0fdfa"/><stop offset="28%" stop-color="#5eead4"/><stop offset="62%" stop-color="#0891b2"/><stop offset="100%" stop-color="#042f2e"/>'
      + '</linearGradient>';
    s += '<linearGradient id="beWingDeep__' + u + '" x1="0%" y1="0%" x2="100%" y2="100%">'
      + '<stop offset="0%" stop-color="#134e4a"/><stop offset="45%" stop-color="#0e7490"/><stop offset="100%" stop-color="#020617"/>'
      + '</linearGradient>';
    s += '<linearGradient id="beWingBone__' + u + '" x1="0%" y1="0%" x2="100%" y2="0%">'
      + '<stop offset="0%" stop-color="#134e4a"/><stop offset="50%" stop-color="#0e7490"/><stop offset="100%" stop-color="#164e63"/>'
      + '</linearGradient>';
    s += '<linearGradient id="beBodyMass__' + u + '" x1="50%" y1="0%" x2="50%" y2="100%">'
      + '<stop offset="0%" stop-color="#1e5f74"/><stop offset="35%" stop-color="#0e7490"/><stop offset="70%" stop-color="#155e75"/><stop offset="100%" stop-color="#042f2e"/>'
      + '</linearGradient>';
    s += '<linearGradient id="beBelly__' + u + '" x1="50%" y1="0%" x2="50%" y2="100%">'
      + '<stop offset="0%" stop-color="#ecfeff"/><stop offset="45%" stop-color="#67e8f9"/><stop offset="100%" stop-color="#0e7490"/>'
      + '</linearGradient>';
    s += '<linearGradient id="beHorn__' + u + '" x1="0%" y1="100%" x2="0%" y2="0%">'
      + '<stop offset="0%" stop-color="#083344"/><stop offset="40%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#f0fdfa"/>'
      + '</linearGradient>';
    s += '<linearGradient id="beBreath__' + u + '" x1="50%" y1="100%" x2="50%" y2="0%">'
      + '<stop offset="0%" stop-color="#042f2e"/><stop offset="30%" stop-color="#06b6d4"/><stop offset="65%" stop-color="#a5f3fc"/><stop offset="100%" stop-color="#ffffff"/>'
      + '</linearGradient>';
    s += '<radialGradient id="beCore__' + u + '" cx="50%" cy="45%" r="58%">'
      + '<stop offset="0%" stop-color="#ecfeff" stop-opacity=".92"/><stop offset="45%" stop-color="#22d3ee" stop-opacity=".38"/><stop offset="100%" stop-color="#0e7490" stop-opacity="0"/>'
      + '</radialGradient>';
    s += '<radialGradient id="beAurora__' + u + '" cx="50%" cy="38%" r="72%">'
      + '<stop offset="0%" stop-color="#67e8f9" stop-opacity=".38"/><stop offset="50%" stop-color="#818cf8" stop-opacity=".14"/><stop offset="100%" stop-color="#020617" stop-opacity="0"/>'
      + '</radialGradient>';
    s += '<radialGradient id="beEyeGlow__' + u + '" cx="40%" cy="35%" r="65%">'
      + '<stop offset="0%" stop-color="#ecfeff"/><stop offset="55%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#0e7490"/>'
      + '</radialGradient>';
    s += '<radialGradient id="beTailIce__' + u + '" cx="50%" cy="50%" r="50%">'
      + '<stop offset="0%" stop-color="#fff" stop-opacity=".95"/><stop offset="40%" stop-color="#a5f3fc" stop-opacity=".55"/><stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>'
      + '</radialGradient>';

    s += '<filter id="beShadow__' + u + '" x="-60%" y="-30%" width="220%" height="220%">'
      + '<feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#020617" flood-opacity=".55"/>'
      + '</filter>';
    s += '<filter id="beGlow__' + u + '" x="-90%" y="-90%" width="280%" height="280%">'
      + '<feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>'
      + '</filter>';
    s += '<filter id="beIceTex__' + u + '" x="-20%" y="-20%" width="140%" height="140%">'
      + '<feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" seed="8" result="n"/>'
      + '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.9  0 0 0 0 0.95  0 0 0 0 1  0 0 0 0.1 0" result="c"/>'
      + '<feBlend in="SourceGraphic" in2="c" mode="screen"/>'
      + '</filter>';
    s += '</defs>';

    s += '<g class="nova-hero__figure" transform="translate(120 178) scale(0.84) translate(-120 -178)">';
    s += '<ellipse cx="120" cy="342" rx="78" ry="10" fill="#020617" opacity=".26"/>';

    s += '<g class="nova-hero__aurora" opacity=".38">';
    s += '<ellipse cx="118" cy="192" rx="72" ry="58" fill="url(#beAurora__' + u + ')"/>';
    s += '<path class="nova-hero__aurora-band" d="M48 128 Q118 96 188 128" stroke="#a5f3fc" stroke-width="1.6" opacity=".1" fill="none"/>';
    s += '</g>';

    s += '<g class="nova-hero__frost-mist" opacity="0">';
    s += '<ellipse cx="120" cy="208" rx="98" ry="56" fill="#ecfeff" opacity=".16"/>';
    s += '<ellipse cx="120" cy="232" rx="82" ry="42" fill="#cffafe" opacity=".1"/>';
    s += '</g>';

    s += '<g class="nova-hero__ice-breath" opacity="0">';
    s += '<path class="nova-hero__breath-c" d="M118 120 C126 154 128 194 126 234 C122 198 118 158 118 120 Z" fill="url(#beBreath__' + u + ')" opacity=".9"/>';
    s += '<path class="nova-hero__breath-l" d="M118 120 C106 144 100 184 98 224 C108 194 114 154 118 120 Z" fill="url(#beBreath__' + u + ')" opacity=".65"/>';
    s += '<path class="nova-hero__breath-r" d="M118 120 C132 144 140 184 144 228 C134 194 126 154 118 120 Z" fill="url(#beBreath__' + u + ')" opacity=".58"/>';
    s += '<path class="nova-hero__breath-mist" d="M118 124 C102 160 100 200 118 244 C136 200 134 160 118 124 Z" fill="#f0fdfa" opacity=".22"/>';
    s += '</g>';

    s += '<g class="nova-hero__frost-rings" opacity=".72" clip-path="url(#beSilhouette__' + u + ')">';
    s += '<ellipse class="nova-hero__frost-ring nova-hero__frost-ring--1" cx="118" cy="208" rx="52" ry="18" stroke="#a5f3fc" stroke-width="1.6" opacity=".28" stroke-dasharray="5 9"/>';
    s += '<ellipse class="nova-hero__frost-ring nova-hero__frost-ring--2" cx="118" cy="208" rx="38" ry="14" stroke="#67e8f9" stroke-width="1.3" opacity=".22" stroke-dasharray="3 7"/>';
    s += '<ellipse class="nova-hero__frost-ring nova-hero__frost-ring--3" cx="118" cy="208" rx="26" ry="10" stroke="#ecfeff" stroke-width="1" opacity=".16" stroke-dasharray="2 6"/>';
    s += '</g>';

    s += '<g class="nova-hero__snowflakes" opacity="0" clip-path="url(#beSilhouette__' + u + ')">';
    var sf = [[98, 178], [138, 182], [108, 228], [128, 248], [118, 198], [92, 210], [144, 214], [118, 260]];
    for (var si = 0; si < sf.length; si++) {
      s += '<circle class="nova-hero__snowflake" cx="' + sf[si][0] + '" cy="' + sf[si][1] + '" r="' + (1.4 + (si % 3) * 0.4) + '" fill="#f0fdfa"/>';
    }
    s += '</g>';

    s += '<g class="nova-hero__crystals" opacity="0" clip-path="url(#beSilhouette__' + u + ')">';
    var cr = ['M108 196 L118 184 L128 196 Z', 'M104 218 L118 206 L132 218 Z', 'M112 238 L118 228 L124 238 Z',
      'M100 252 L118 242 L136 252 Z', 'M114 268 L118 258 L122 268 Z'];
    for (var ci = 0; ci < cr.length; ci++) {
      s += '<path class="nova-hero__crystal" d="' + cr[ci] + '" fill="#ecfeff" opacity=".85"/>';
    }
    s += '</g>';

    s += buildTailBehind(u);

    s += buildUpperDragonWings(u);

    s += buildSpreadDragonWings(u);

    s += '<g class="nova-hero__legs" filter="url(#beShadow__' + u + ')">';
    s += '<path d="M88 272 L68 332 L96 322 L112 278 Z" fill="url(#beBodyMass__' + u + ')"/>';
    s += '<path d="M88 278 L82 308 L94 302 L100 282 Z" fill="#083344" opacity=".45"/>';
    s += '<path d="M148 272 L168 332 L140 322 L124 278 Z" fill="url(#beBodyMass__' + u + ')"/>';
    s += '<path d="M148 278 L154 308 L142 302 L136 282 Z" fill="#083344" opacity=".45"/>';
    s += '<g class="nova-hero__scales nova-hero__scales--legs">';
    s += buildScaleField(u, 78, 278, 2, 4, 8, 6, 9, 7, 11);
    s += buildScaleField(u, 142, 278, 2, 4, 8, 6, 9, 7, 12);
    s += '</g>';
    s += '<path class="nova-hero__claw" d="M76 328 L66 346 L90 336 Z" fill="#ecfeff" opacity=".94"/>';
    s += '<path class="nova-hero__claw" d="M76 328 L82 342 L88 330 Z" fill="#a5f3fc" opacity=".85"/>';
    s += '<path class="nova-hero__claw" d="M160 328 L170 346 L146 336 Z" fill="#ecfeff" opacity=".94"/>';
    s += '<path class="nova-hero__claw" d="M160 328 L154 342 L148 330 Z" fill="#a5f3fc" opacity=".85"/>';
    s += '</g>';

    s += '<g class="nova-hero__aura"><circle class="nova-hero__core-glow" cx="118" cy="198" r="72" fill="url(#beCore__' + u + ')" opacity="0"/></g>';

    s += '<g class="nova-hero__body" filter="url(#beShadow__' + u + ')" style="transform-origin:118px 232px">';
    s += '<path d="M118 148 C74 154 54 184 56 230 C58 290 84 324 118 340 C152 324 178 290 180 230 C182 184 162 154 118 148 Z" fill="url(#beBodyMass__' + u + ')" filter="url(#beIceTex__' + u + ')"/>';
    s += '<path d="M118 160 C88 164 72 190 74 230 C76 280 94 310 118 320 C142 310 160 280 162 230 C164 190 148 164 118 160 Z" fill="#083344" opacity=".18"/>';
    s += '<path d="M74 200 L68 230 L78 250 L88 230 Z" fill="#0e7490" opacity=".28"/>';
    s += '<path d="M162 200 L168 230 L158 250 L148 230 Z" fill="#0e7490" opacity=".28"/>';
    s += '<path d="M98 180 L88 200 L98 220 L108 200 Z" fill="#164e63" opacity=".22"/>';
    s += '<path d="M138 180 L148 200 L138 220 L128 200 Z" fill="#164e63" opacity=".22"/>';
    s += '<g class="nova-hero__scales nova-hero__scales--body">';
    s += buildScaleField(u, 72, 164, 7, 7, 12.5, 9.5, 12.5, 9.5, 0);
    s += buildScaleField(u, 78, 194, 8, 6, 12, 9, 12, 9, 1);
    s += buildScaleField(u, 84, 224, 7, 6, 11, 8.5, 11.5, 8.5, 2);
    s += buildScaleField(u, 90, 252, 6, 5, 10, 8, 11, 8, 3);
    s += '</g>';
    s += '<g class="nova-hero__spines">';
    s += buildSpineRow(u, 118, 160, 7, 14);
    s += buildSpineRow(u, 118, 240, 6, 15);
    s += '</g>';
    s += '<path class="nova-hero__belly" d="M118 184 C96 188 84 204 84 224 C84 270 98 304 118 318 C138 304 152 270 152 224 C152 204 140 188 118 184 Z" fill="url(#beBelly__' + u + ')" opacity=".44"/>';
    s += '<path class="nova-hero__chest-gem" d="M118 208 C92 214 84 232 86 252 C90 284 102 306 118 316 C134 306 146 284 150 252 C152 232 144 214 118 208 Z" fill="#ecfeff" opacity=".42" filter="url(#beGlow__' + u + ')"/>';
    s += '<path d="M118 224 L118 290" stroke="#a5f3fc" stroke-width="1.4" opacity=".24"/>';
    s += '</g>';

    s += '<g class="nova-hero__forearms" filter="url(#beShadow__' + u + ')">';
    s += '<path d="M78 212 L48 268 L74 258 L96 222 Z" fill="url(#beBodyMass__' + u + ')"/>';
    s += '<path d="M78 218 L62 248 L72 242 L84 228 Z" fill="#083344" opacity=".4"/>';
    s += '<path d="M158 212 L188 268 L162 258 L140 222 Z" fill="url(#beBodyMass__' + u + ')"/>';
    s += '<path d="M158 218 L174 248 L164 242 L152 228 Z" fill="#083344" opacity=".4"/>';
    s += '<g class="nova-hero__scales nova-hero__scales--arm">';
    s += buildScaleField(u, 64, 218, 3, 4, 8, 6.5, 9, 7.5, 7);
    s += buildScaleField(u, 148, 218, 3, 4, 8, 6.5, 9, 7.5, 8);
    s += '</g>';
    s += '<path class="nova-hero__claw" d="M58 262 L46 280 L72 268 Z" fill="#f0fdfa" opacity=".95"/>';
    s += '<path class="nova-hero__claw" d="M58 262 L64 276 L70 264 Z" fill="#a5f3fc" opacity=".88"/>';
    s += '<path class="nova-hero__claw" d="M178 262 L190 280 L164 268 Z" fill="#f0fdfa" opacity=".95"/>';
    s += '<path class="nova-hero__claw" d="M178 262 L172 276 L166 264 Z" fill="#a5f3fc" opacity=".88"/>';
    s += '</g>';

    s += '<g class="nova-hero__neck" filter="url(#beShadow__' + u + ')" style="transform-origin:118px 138px">';
    s += '<path d="M118 122 C94 126 82 138 82 154 C82 172 96 184 118 190 C140 184 154 172 154 154 C154 138 142 126 118 122 Z" fill="url(#beBodyMass__' + u + ')"/>';
    s += '<path d="M118 128 C100 130 90 140 90 154 C90 168 102 178 118 182 C134 178 146 168 146 154 C146 140 136 130 118 128 Z" fill="#083344" opacity=".22"/>';
    s += '<g class="nova-hero__scales nova-hero__scales--neck">';
    s += buildScaleField(u, 98, 128, 4, 5, 8.5, 6.5, 8.8, 6.8, 3);
    s += buildScaleField(u, 100, 148, 3, 5, 8, 6, 8.5, 6.2, 4);
    s += '</g>';
    s += '</g>';

    s += buildTailFront(u);

    s += buildHeroHead(u);

    s += '<g class="nova-hero__sparks" opacity="0" clip-path="url(#beSilhouette__' + u + ')">';
    s += '<circle cx="108" cy="200" r="2.4" fill="#f0fdfa"/><circle cx="128" cy="198" r="2.6" fill="#fff"/>';
    s += '<circle cx="118" cy="224" r="2.2" fill="#67e8f9"/><circle cx="100" cy="240" r="1.8" fill="#a5f3fc"/>';
    s += '<circle cx="136" cy="238" r="1.8" fill="#22d3ee"/>';
    s += '</g>';

    s += '</g>';
    s += '</svg>';
    return s;
  }

  window.NOVA_BUZ_EJDER_SVG_TEMPLATE = buildTemplate('__UID__');
})();

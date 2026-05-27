/* Alev Bot — tek kişilik doğru cevap: özel WAAPI kutlama */
(function () {
  var EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var EASE_SPRING = 'cubic-bezier(0.34, 1.35, 0.64, 1)';

  function q(svg, sel) { return svg ? svg.querySelector(sel) : null; }

  function anim(el, frames, opts) {
    if (!el || typeof el.animate !== 'function') return { finished: Promise.resolve() };
    try { return el.animate(frames, opts); } catch (_) { return { finished: Promise.resolve() }; }
  }

  function resetInline(svg) {
    if (!svg) return;
    svg.querySelectorAll('[style]').forEach(function (el) {
      if (el.getAttribute('style') && el.getAttribute('style').indexOf('transform') >= 0) {
        el.style.transform = '';
      }
    });
    ['.nova-hero__flames', '.nova-hero__sparks'].forEach(function (sel) {
      var g = svg.querySelector(sel);
      if (g) g.style.opacity = '';
    });
  }

  function playSpFx(host, variant) {
    var svg = host && host.querySelector('svg');
    if (!svg) return Promise.resolve();
    resetInline(svg);
    var body = q(svg, '.nova-hero__body');
    var head = q(svg, '.nova-hero__head');
    var armL = q(svg, '.nova-hero__arm-l');
    var armR = q(svg, '.nova-hero__arm-r');
    var flames = q(svg, '.nova-hero__flames');
    var flameC = q(svg, '.nova-hero__flame-c');
    var glow = q(svg, '.nova-hero__core-glow');
    var core = q(svg, '.nova-hero__core');
    var visor = q(svg, '.nova-hero__visor');
    var sparks = q(svg, '.nova-hero__sparks');
    var steps = [];

    steps.push(anim(host, [
      { transform: 'scale(0.7) translateY(28px)', opacity: 0 },
      { transform: 'scale(1.08) translateY(-8px)', opacity: 1 },
      { transform: 'scale(1) translateY(0)', opacity: 1 }
    ], { duration: 500, fill: 'forwards', easing: EASE_SPRING }));

    if (variant === 'cheer') {
      if (visor) {
        steps.push(anim(visor, [
          { filter: 'brightness(1)' },
          { filter: 'brightness(2.2)' },
          { filter: 'brightness(1)' },
          { filter: 'brightness(1.8)' },
          { filter: 'brightness(1)' }
        ], { duration: 900, delay: 200, fill: 'forwards', easing: 'ease-in-out' }));
      }
      if (armL && armR) {
        steps.push(anim(armL, [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(-42deg)' },
          { transform: 'rotate(-18deg)' },
          { transform: 'rotate(-38deg)' },
          { transform: 'rotate(0deg)' }
        ], { duration: 700, delay: 180, fill: 'forwards', easing: EASE_OUT }));
        steps.push(anim(armR, [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(42deg)' },
          { transform: 'rotate(18deg)' },
          { transform: 'rotate(38deg)' },
          { transform: 'rotate(0deg)' }
        ], { duration: 700, delay: 180, fill: 'forwards', easing: EASE_OUT }));
      }
      if (head) {
        steps.push(anim(head, [
          { transform: 'rotate(0deg) translateY(0)' },
          { transform: 'rotate(-8deg) translateY(-6px)' },
          { transform: 'rotate(6deg) translateY(-3px)' },
          { transform: 'rotate(0deg) translateY(0)' }
        ], { duration: 620, delay: 260, fill: 'forwards', easing: EASE_OUT }));
      }
      if (body) {
        steps.push(anim(body, [
          { transform: 'scale(1) translateY(0)' },
          { transform: 'scale(1.06) translateY(-8px)' },
          { transform: 'scale(1.02) translateY(-4px)' },
          { transform: 'scale(1) translateY(0)' }
        ], { duration: 560, delay: 300, fill: 'forwards', easing: EASE_OUT }));
      }
      if (flameC) {
        steps.push(anim(flameC, [
          { transform: 'scaleY(0.7)', opacity: 0.5 },
          { transform: 'scaleY(1.15)', opacity: 1 },
          { transform: 'scaleY(0.95)', opacity: 0.8 }
        ], { duration: 500, delay: 340, fill: 'forwards', easing: EASE_OUT }));
      }
    }

    if (variant === 'fire' || variant === 'epic') {
      if (flames) {
        flames.style.opacity = '1';
        steps.push(anim(flames, [
          { transform: 'scale(0.5)', opacity: 0 },
          { transform: 'scale(1.15)', opacity: 1 },
          { transform: 'scale(1)', opacity: variant === 'epic' ? 0.95 : 0.85 }
        ], { duration: variant === 'epic' ? 720 : 580, delay: 100, fill: 'forwards', easing: EASE_OUT }));
      }
      if (glow) {
        glow.style.opacity = '1';
        steps.push(anim(glow, [
          { transform: 'scale(0.4)', opacity: 0 },
          { transform: 'scale(1.5)', opacity: 1 },
          { transform: 'scale(1.1)', opacity: 0.5 }
        ], { duration: 680, delay: 160, fill: 'forwards', easing: EASE_OUT }));
      }
      if (body) {
        steps.push(anim(body, [
          { transform: 'translateY(0) scale(1)' },
          { transform: 'translateY(-12px) scale(1.08)' },
          { transform: 'translateY(4px) scale(0.98)' },
          { transform: 'translateY(0) scale(1)' }
        ], { duration: variant === 'epic' ? 620 : 500, delay: 200, fill: 'forwards', easing: EASE_SPRING }));
      }
      if (armL && armR) {
        steps.push(anim(armL, [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(-55deg) translateY(-6px)' },
          { transform: 'rotate(-20deg)' }
        ], { duration: 480, delay: 220, fill: 'forwards', easing: EASE_OUT }));
        steps.push(anim(armR, [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(55deg) translateY(-6px)' },
          { transform: 'rotate(20deg)' }
        ], { duration: 480, delay: 220, fill: 'forwards', easing: EASE_OUT }));
      }
      if (sparks) {
        sparks.style.opacity = '1';
        sparks.querySelectorAll('circle, ellipse').forEach(function (p, i) {
          steps.push(anim(p, [
            { transform: 'translate(0, 8px)', opacity: 0 },
            { transform: 'translate(' + ((i % 2 ? 1 : -1) * (12 + i * 3)) + 'px, -' + (18 + i * 4) + 'px)', opacity: 1 },
            { transform: 'translate(' + ((i % 2 ? 1 : -1) * (20 + i * 2)) + 'px, -' + (32 + i * 5) + 'px)', opacity: 0 }
          ], { duration: 750, delay: 280 + i * 40, fill: 'forwards', easing: 'ease-out' }));
        });
      }
      if (core && variant === 'epic') {
        steps.push(anim(core, [
          { transform: 'scale(1) rotate(0deg)' },
          { transform: 'scale(1.5) rotate(180deg)' },
          { transform: 'scale(1.15) rotate(360deg)' }
        ], { duration: 700, delay: 320, fill: 'forwards', easing: EASE_OUT }));
      }
      if (head) {
        steps.push(anim(head, [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-14px) scale(1.05)' },
          { transform: 'translateY(0) scale(1)' }
        ], { duration: 520, delay: 260, fill: 'forwards', easing: EASE_SPRING }));
      }
    }

    return Promise.all(steps.map(function (s) { return s.finished; })).catch(function () {});
  }

  window.novaBlazeBotPlaySpFx = playSpFx;
  window.novaBlazeBotResetSvg = resetInline;
})();

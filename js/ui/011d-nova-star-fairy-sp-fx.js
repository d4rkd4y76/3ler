/* Yıldız Perisi — tek kişilik doğru cevap: özel WAAPI kutlama */
(function () {
  var EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var EASE_SPRING = 'cubic-bezier(0.34, 1.2, 0.64, 1)';

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
    ['.nova-hero__stars', '.nova-hero__sparks', '.nova-hero__aura'].forEach(function (sel) {
      var g = svg.querySelector(sel);
      if (g && g.style) g.style.opacity = '';
    });
  }

  function playSpFx(host, variant) {
    var svg = host && host.querySelector('svg');
    if (!svg) return Promise.resolve();
    resetInline(svg);
    var body = q(svg, '.nova-hero__body');
    var head = q(svg, '.nova-hero__head');
    var wingL = q(svg, '.nova-hero__wing-l');
    var wingR = q(svg, '.nova-hero__wing-r');
    var wand = q(svg, '.nova-hero__wand');
    var halo = q(svg, '.nova-hero__halo');
    var hair = q(svg, '.nova-hero__hair');
    var glow = q(svg, '.nova-hero__core-glow');
    var stars = q(svg, '.nova-hero__stars');
    var sparks = q(svg, '.nova-hero__sparks');
    var core = q(svg, '.nova-hero__core');
    var steps = [];

    steps.push(anim(host, [
      { transform: 'scale(0.75) translateY(20px)', opacity: 0 },
      { transform: 'scale(1.06) translateY(-12px)', opacity: 1 },
      { transform: 'scale(1) translateY(0)', opacity: 1 }
    ], { duration: 520, fill: 'forwards', easing: EASE_SPRING }));

    if (variant === 'cheer') {
      if (wingL && wingR) {
        steps.push(anim(wingL, [
          { transform: 'rotate(0deg) scale(1)' },
          { transform: 'rotate(-18deg) scale(1.08)' },
          { transform: 'rotate(-8deg) scale(1.02)' },
          { transform: 'rotate(-16deg) scale(1.06)' },
          { transform: 'rotate(0deg) scale(1)' }
        ], { duration: 680, delay: 160, fill: 'forwards', easing: EASE_OUT }));
        steps.push(anim(wingR, [
          { transform: 'rotate(0deg) scale(1)' },
          { transform: 'rotate(18deg) scale(1.08)' },
          { transform: 'rotate(8deg) scale(1.02)' },
          { transform: 'rotate(16deg) scale(1.06)' },
          { transform: 'rotate(0deg) scale(1)' }
        ], { duration: 680, delay: 160, fill: 'forwards', easing: EASE_OUT }));
      }
      if (wand) {
        steps.push(anim(wand, [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(-22deg) translateY(-4px)' },
          { transform: 'rotate(12deg)' },
          { transform: 'rotate(-18deg)' },
          { transform: 'rotate(0deg)' }
        ], { duration: 720, delay: 200, fill: 'forwards', easing: EASE_OUT }));
      }
      if (halo) {
        steps.push(anim(halo, [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(1.2)', opacity: 1 },
          { transform: 'scale(1.05)', opacity: 0.95 },
          { transform: 'scale(1.18)', opacity: 1 },
          { transform: 'scale(1)', opacity: 1 }
        ], { duration: 800, delay: 180, fill: 'forwards', easing: 'ease-in-out' }));
      }
      if (hair) {
        steps.push(anim(hair, [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(-4deg)' },
          { transform: 'rotate(3deg)' },
          { transform: 'rotate(0deg)' }
        ], { duration: 900, delay: 240, fill: 'forwards', easing: 'ease-in-out' }));
      }
      if (body) {
        steps.push(anim(body, [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-10px)' },
          { transform: 'translateY(-5px)' },
          { transform: 'translateY(0)' }
        ], { duration: 600, delay: 280, fill: 'forwards', easing: EASE_OUT }));
      }
      if (core) {
        steps.push(anim(core, [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(1.4)', opacity: 1 },
          { transform: 'scale(1.1)', opacity: 0.9 }
        ], { duration: 500, delay: 350, fill: 'forwards', easing: EASE_SPRING }));
      }
    }

    if (variant === 'fire' || variant === 'epic') {
      if (stars) {
        stars.style.opacity = '1';
        steps.push(anim(stars, [
          { transform: 'scale(0.3) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.25) rotate(12deg)', opacity: 1 },
          { transform: 'scale(1) rotate(0deg)', opacity: 0.9 }
        ], { duration: variant === 'epic' ? 780 : 620, delay: 120, fill: 'forwards', easing: EASE_OUT }));
      }
      if (glow) {
        glow.style.opacity = '1';
        steps.push(anim(glow, [
          { transform: 'scale(0.5)', opacity: 0.2 },
          { transform: 'scale(1.6)', opacity: 0.95 },
          { transform: 'scale(1.2)', opacity: 0.45 }
        ], { duration: 700, delay: 150, fill: 'forwards', easing: EASE_OUT }));
      }
      if (wingL && wingR) {
        var spread = variant === 'epic' ? 28 : 20;
        steps.push(anim(wingL, [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(-' + spread + 'deg) scale(1.12)' },
          { transform: 'rotate(-' + (spread * 0.6) + 'deg) scale(1.05)' }
        ], { duration: 550, delay: 200, fill: 'forwards', easing: EASE_OUT }));
        steps.push(anim(wingR, [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(' + spread + 'deg) scale(1.12)' },
          { transform: 'rotate(' + (spread * 0.6) + 'deg) scale(1.05)' }
        ], { duration: 550, delay: 200, fill: 'forwards', easing: EASE_OUT }));
      }
      if (wand) {
        steps.push(anim(wand, [
          { transform: 'rotate(0deg) scale(1)' },
          { transform: 'rotate(-35deg) scale(1.1)' },
          { transform: 'rotate(8deg) scale(1.05)' },
          { transform: 'rotate(-25deg) scale(1.08)' }
        ], { duration: variant === 'epic' ? 680 : 520, delay: 240, fill: 'forwards', easing: EASE_OUT }));
      }
      if (sparks) {
        sparks.style.opacity = '1';
        sparks.querySelectorAll('circle, path').forEach(function (p, i) {
          var angle = (i / 6) * Math.PI * 2;
          var dx = Math.round(Math.cos(angle) * 24);
          var dy = Math.round(Math.sin(angle) * -20);
          steps.push(anim(p, [
            { transform: 'translate(0, 0) scale(0.5)', opacity: 0 },
            { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(1.2)', opacity: 1 },
            { transform: 'translate(' + (dx * 1.4) + 'px, ' + (dy * 1.3) + 'px) scale(0.4)', opacity: 0 }
          ], { duration: 800, delay: 300 + i * 35, fill: 'forwards', easing: 'ease-out' }));
        });
      }
      if (host && variant === 'epic') {
        steps.push(anim(host, [
          { transform: 'translateY(0) scale(1)' },
          { transform: 'translateY(-16px) scale(1.04)' },
          { transform: 'translateY(0) scale(1)' }
        ], { duration: 580, delay: 400, fill: 'forwards', easing: EASE_SPRING }));
      }
      if (head) {
        steps.push(anim(head, [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-8px)' },
          { transform: 'translateY(0)' }
        ], { duration: 480, delay: 280, fill: 'forwards', easing: EASE_OUT }));
      }
    }

    return Promise.all(steps.map(function (s) { return s.finished; })).catch(function () {});
  }

  window.novaStarFairyPlaySpFx = playSpFx;
  window.novaStarFairyResetSvg = resetInline;
})();

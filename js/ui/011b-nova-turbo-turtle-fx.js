/* Kaplumbağa Turbo — özel hareket motoru (Web Animations API) */
(function () {
  var EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var EASE_SPRING = 'cubic-bezier(0.34, 1.35, 0.64, 1)';
  var EASE_SNAP = 'cubic-bezier(0.68, -0.2, 0.32, 1.2)';

  function q(svg, sel) {
    return svg ? svg.querySelector(sel) : null;
  }

  function anim(el, frames, opts) {
    if (!el || typeof el.animate !== 'function') return { finished: Promise.resolve() };
    try {
      return el.animate(frames, opts);
    } catch (_) {
      return { finished: Promise.resolve() };
    }
  }

  function resetInline(svg) {
    if (!svg) return;
    svg.querySelectorAll('[style]').forEach(function (el) {
      if (el.getAttribute('style') && el.getAttribute('style').indexOf('transform') >= 0) {
        el.style.transform = '';
      }
    });
    ['.nova-hero__boost', '.nova-hero__turbo-streaks', '.nova-hero__wake', '.nova-hero__bubbles-burst'].forEach(function (sel) {
      var g = svg.querySelector(sel);
      if (g) g.style.opacity = '';
    });
  }

  function playIdleRipple(svg) {
    var bubbles = svg.querySelectorAll('.nova-hero__bubble');
    bubbles.forEach(function (b, i) {
      anim(b, [
        { transform: 'translateY(0) scale(1)', opacity: 0.35 },
        { transform: 'translateY(-22px) scale(1.15)', opacity: 0.85 },
        { transform: 'translateY(-38px) scale(0.6)', opacity: 0 }
      ], {
        duration: 2200 + i * 380,
        delay: i * 420,
        iterations: Infinity,
        easing: 'ease-out'
      });
    });
  }

  function playStoreIdle(host) {
    if (!host) return;
    var svg = host.querySelector('svg');
    if (!svg || svg.__ttIdleOn) return;
    svg.__ttIdleOn = true;
    playIdleRipple(svg);
    var body = q(svg, '.nova-hero__body');
    var head = q(svg, '.nova-hero__head');
    var armL = q(svg, '.nova-hero__arm-l');
    var armR = q(svg, '.nova-hero__arm-r');
    anim(body, [
      { transform: 'rotate(0deg) translateY(0)' },
      { transform: 'rotate(-1.2deg) translateY(-3px)' },
      { transform: 'rotate(1deg) translateY(-5px)' },
      { transform: 'rotate(0deg) translateY(0)' }
    ], { duration: 4200, iterations: Infinity, easing: 'ease-in-out' });
    anim(head, [
      { transform: 'translateY(0) rotate(0deg)' },
      { transform: 'translateY(-5px) rotate(-2deg)' },
      { transform: 'translateY(-2px) rotate(1.5deg)' },
      { transform: 'translateY(0) rotate(0deg)' }
    ], { duration: 3600, iterations: Infinity, easing: 'ease-in-out' });
    if (armL) {
      anim(armL, [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-22deg)' },
        { transform: 'rotate(4deg)' },
        { transform: 'rotate(0deg)' }
      ], { duration: 1400, iterations: Infinity, easing: 'ease-in-out' });
    }
    if (armR) {
      anim(armR, [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(22deg)' },
        { transform: 'rotate(-4deg)' },
        { transform: 'rotate(0deg)' }
      ], { duration: 1400, iterations: Infinity, easing: 'ease-in-out', delay: 700 });
    }
    var boost = q(svg, '.nova-hero__boost');
    if (boost) {
      boost.style.opacity = '0.2';
      anim(boost, [{ opacity: 0.12 }, { opacity: 0.28 }, { opacity: 0.12 }], {
        duration: 1800, iterations: Infinity, easing: 'ease-in-out'
      });
    }
  }

  function playSpFx(host, variant) {
    var svg = host && host.querySelector('svg');
    if (!svg) return Promise.resolve();
    resetInline(svg);
    var body = q(svg, '.nova-hero__body');
    var head = q(svg, '.nova-hero__head');
    var armL = q(svg, '.nova-hero__arm-l');
    var armR = q(svg, '.nova-hero__arm-r');
    var boost = q(svg, '.nova-hero__boost');
    var streaks = q(svg, '.nova-hero__turbo-streaks');
    var wake = q(svg, '.nova-hero__wake');
    var burst = q(svg, '.nova-hero__bubbles-burst');
    var glow = q(svg, '.nova-hero__core-glow');
    var core = q(svg, '.nova-hero__core');
    var steps = [];

    steps.push(anim(host, [
      { transform: 'scale(0.72) translateY(24px)', opacity: 0 },
      { transform: 'scale(1.05) translateY(-6px)', opacity: 1 },
      { transform: 'scale(1) translateY(0)', opacity: 1 }
    ], { duration: 480, fill: 'forwards', easing: EASE_SPRING }));

    if (variant === 'cheer') {
      if (head) {
        steps.push(anim(head, [
          { transform: 'translateY(28px) scale(0.85)', opacity: 0.6 },
          { transform: 'translateY(-18px) scale(1.08)', opacity: 1 },
          { transform: 'translateY(-8px) scale(1)', opacity: 1 },
          { transform: 'translateY(0) scale(1)', opacity: 1 }
        ], { duration: 720, delay: 120, fill: 'forwards', easing: EASE_SPRING }));
      }
      if (armL && armR) {
        steps.push(anim(armL, [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(-35deg)' },
          { transform: 'rotate(-12deg)' },
          { transform: 'rotate(-28deg)' },
          { transform: 'rotate(0deg)' }
        ], { duration: 650, delay: 200, fill: 'forwards', easing: EASE_OUT }));
        steps.push(anim(armR, [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(35deg)' },
          { transform: 'rotate(12deg)' },
          { transform: 'rotate(28deg)' },
          { transform: 'rotate(0deg)' }
        ], { duration: 650, delay: 200, fill: 'forwards', easing: EASE_OUT }));
      }
      if (body) {
        steps.push(anim(body, [
          { transform: 'rotate(0deg) scale(1)' },
          { transform: 'rotate(-8deg) scale(1.04)' },
          { transform: 'rotate(8deg) scale(1.04)' },
          { transform: 'rotate(0deg) scale(1)' }
        ], { duration: 580, delay: 280, fill: 'forwards', easing: EASE_OUT }));
      }
      if (burst) {
        burst.style.opacity = '1';
        steps.push(anim(burst, [
          { transform: 'scale(0.4)', opacity: 0 },
          { transform: 'scale(1.2)', opacity: 1 },
          { transform: 'scale(1)', opacity: 0.9 }
        ], { duration: 700, delay: 350, fill: 'forwards', easing: EASE_OUT }));
        burst.querySelectorAll('circle').forEach(function (c, i) {
          anim(c, [
            { transform: 'translate(0, 0)', opacity: 0.9 },
            { transform: 'translate(' + ((i % 2 ? 1 : -1) * 18) + 'px, -28px)', opacity: 0 }
          ], { duration: 900, delay: 400 + i * 60, fill: 'forwards', easing: 'ease-out' });
        });
      }
    }

    if (variant === 'fire' || variant === 'epic') {
      if (head && variant === 'epic') {
        steps.push(anim(head, [
          { transform: 'translateY(0)' },
          { transform: 'translateY(32px) scale(0.75)', opacity: 0.3 },
          { transform: 'translateY(-24px) scale(1.1)', opacity: 1 }
        ], { duration: 520, delay: 80, fill: 'forwards', easing: EASE_SNAP }));
      }
      if (streaks) {
        streaks.style.opacity = '1';
        streaks.querySelectorAll('.nova-hero__streak').forEach(function (s, i) {
          var dir = i < 3 ? -1 : 1;
          steps.push(anim(s, [
            { transform: 'translateX(' + (dir * 40) + 'px) scaleX(0.2)', opacity: 0 },
            { transform: 'translateX(' + (dir * -8) + 'px) scaleX(1.1)', opacity: 1 },
            { transform: 'translateX(' + (dir * 4) + 'px) scaleX(1)', opacity: 0.7 }
          ], { duration: 420, delay: 100 + i * 45, fill: 'forwards', easing: EASE_OUT }));
        });
      }
      if (boost) {
        boost.style.opacity = '1';
        steps.push(anim(boost, [
          { transform: 'scaleY(0.3)', opacity: 0 },
          { transform: 'scaleY(1.15)', opacity: 1 },
          { transform: 'scaleY(1)', opacity: 0.95 }
        ], { duration: 500, delay: 180, fill: 'forwards', easing: EASE_OUT }));
        boost.querySelectorAll('.nova-hero__jet').forEach(function (jet, i) {
          anim(jet, [
            { strokeWidth: 4, opacity: 0.3 },
            { strokeWidth: 16, opacity: 1 },
            { strokeWidth: 12, opacity: 0.85 }
          ], { duration: 450, delay: 200 + i * 50, fill: 'forwards', easing: EASE_OUT });
        });
      }
      if (wake) {
        wake.style.opacity = '1';
        steps.push(anim(wake, [
          { transform: 'scaleX(0.6)', opacity: 0 },
          { transform: 'scaleX(1.15)', opacity: 0.8 },
          { transform: 'scaleX(1)', opacity: 0.5 }
        ], { duration: 600, delay: 220, fill: 'forwards', easing: EASE_OUT }));
      }
      if (body) {
        steps.push(anim(body, [
          { transform: 'translateX(0) rotate(0deg)' },
          { transform: 'translateX(-14px) rotate(-3deg)' },
          { transform: 'translateX(16px) rotate(3deg)' },
          { transform: 'translateX(0) rotate(0deg)' }
        ], { duration: variant === 'epic' ? 520 : 420, delay: 240, fill: 'forwards', easing: EASE_OUT }));
      }
      if (glow) {
        glow.style.opacity = '1';
        steps.push(anim(glow, [
          { transform: 'scale(0.5)', opacity: 0 },
          { transform: 'scale(1.35)', opacity: 0.9 },
          { transform: 'scale(1)', opacity: 0.4 }
        ], { duration: 650, delay: 260, fill: 'forwards', easing: EASE_OUT }));
      }
      if (core && variant === 'epic') {
        steps.push(anim(core, [
          { transform: 'scale(1)' },
          { transform: 'scale(1.45)' },
          { transform: 'scale(1.1)' }
        ], { duration: 480, delay: 300, fill: 'forwards', easing: EASE_SPRING }));
      }
      if (burst) {
        burst.style.opacity = '1';
        steps.push(anim(burst, [
          { transform: 'scale(0.5)', opacity: 0 },
          { transform: 'scale(1.4)', opacity: 1 }
        ], { duration: 550, delay: 320, fill: 'forwards', easing: EASE_OUT }));
      }
    }

    return Promise.all(steps.map(function (s) { return s.finished; })).catch(function () {});
  }

  window.novaTurboTurtlePlayStoreIdle = playStoreIdle;
  window.novaTurboTurtlePlaySpFx = playSpFx;
  window.novaTurboTurtleResetSvg = resetInline;

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-nova-hero-host]').forEach(function (host) {
      var card = host.closest('.nova-hero-store-card--turbo, .nova-store-preview--turbo');
      if (card && host.querySelector('svg')) playStoreIdle(host);
    });
  });
})();

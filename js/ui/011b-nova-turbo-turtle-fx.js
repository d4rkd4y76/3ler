/* Kaplumbağa Turbo — WAAPI v3: 3×3 sekans, simetrik, nötr bitiş */
(function () {
  var C = window.novaHeroSpFxCore;
  if (!C) return;

  var OPACITY_RESET = ['.nova-hero__boost', '.nova-hero__turbo-streaks', '.nova-hero__wake', '.nova-hero__bubbles-burst', '.nova-hero__bubbles-idle'];

  function parts(svg) {
    return {
      body: C.q(svg, '.nova-hero__body'),
      head: C.q(svg, '.nova-hero__head'),
      legs: C.q(svg, '.nova-hero__legs'),
      armL: C.q(svg, '.nova-hero__arm-l'),
      armR: C.q(svg, '.nova-hero__arm-r'),
      shell: C.q(svg, '.nova-hero__shell-back'),
      visor: C.q(svg, '.nova-hero__visor'),
      visorShine: C.q(svg, '.nova-hero__visor-shine'),
      smile: C.q(svg, '.nova-hero__smile'),
      eyeL: C.q(svg, '.nova-hero__eye-l'),
      eyeR: C.q(svg, '.nova-hero__eye-r'),
      burst: C.q(svg, '.nova-hero__bubbles-burst'),
      boost: C.q(svg, '.nova-hero__boost'),
      streaks: C.q(svg, '.nova-hero__turbo-streaks'),
      wake: C.q(svg, '.nova-hero__wake'),
      glow: C.q(svg, '.nova-hero__core-glow'),
      core: C.q(svg, '.nova-hero__core'),
      bubblesIdle: C.q(svg, '.nova-hero__bubbles-idle')
    };
  }

  function turboJets(steps, p, delay, epic) {
    if (!p.boost) return;
    p.boost.style.opacity = '1';
    C.pushAnim(steps, p.boost, [
      { transform: 'scaleY(0.15)', opacity: 0 },
      { transform: 'scaleY(' + (epic ? '1.4' : '1.2') + ')', opacity: 1 },
      { transform: 'none', opacity: 0.85 }
    ], { duration: epic ? 700 : 560, delay: delay });
    p.boost.querySelectorAll('.nova-hero__jet').forEach(function (jet, i) {
      C.pushAnim(steps, jet, [
        { strokeWidth: 4, opacity: 0.3 },
        { strokeWidth: epic ? 20 : 16, opacity: 1 },
        { strokeWidth: 10, opacity: 0.75 }
      ], { duration: 480, delay: delay + 40 + i * 40, keepStyle: true });
    });
  }

  function streaksOn(steps, p, delay, epic) {
    if (!p.streaks) return;
    p.streaks.style.opacity = '1';
    p.streaks.querySelectorAll('.nova-hero__streak').forEach(function (s, i) {
      var side = i < 3 ? -1 : 1;
      C.pushAnim(steps, s, [
        { transform: 'translateX(' + (side * (epic ? 64 : 48)) + 'px) scaleX(0.1)', opacity: 0 },
        { transform: 'translateX(' + (side * -4) + 'px) scaleX(1.25)', opacity: 1 },
        { transform: 'none', opacity: 0.5 }
      ], { duration: epic ? 500 : 400, delay: delay + i * 35, particle: true });
    });
  }

  function bubbleBurst(steps, p, delay) {
    if (!p.burst) return;
    p.burst.style.opacity = '1';
    p.burst.querySelectorAll('circle').forEach(function (c, i) {
      var ang = (i / 6) * Math.PI * 2;
      C.pushAnim(steps, c, [
        { transform: 'none', opacity: 0 },
        { transform: 'translate(' + Math.round(Math.cos(ang) * 20) + 'px, ' + Math.round(Math.sin(ang) * -24) + 'px)', opacity: 1 },
        { transform: 'translate(' + Math.round(Math.cos(ang) * 34) + 'px, ' + Math.round(Math.sin(ang) * -40) + 'px)', opacity: 0 }
      ], { duration: 820, delay: delay + i * 45, particle: true });
    });
  }

  /* CHEER */
  function cheer0(svg, host, steps) {
    var p = parts(svg);
    if (p.head) {
      C.pushAnim(steps, p.head, [
        { transform: 'translateY(48px) scale(0.75)', opacity: 0.4 },
        { transform: 'translateY(-26px) scale(1.12)', opacity: 1 },
        { transform: 'translateY(-6px) scale(1.02)', opacity: 1 },
        { transform: 'none', opacity: 1 }
      ], { duration: 860, delay: 70, easing: C.EASE_SNAP });
    }
    C.animArmsSymmetric(steps, p.armL, p.armR, [0, 46, 24, 44, 0], { duration: 760, delay: 300 });
    C.animLegsSymmetric(steps, p.legs, { duration: 720, delay: 300, lift: 6 });
    if (p.shell) {
      C.pushAnim(steps, p.shell, [
        { transform: 'none' },
        { transform: 'scale(1.07) translateY(-4px)' },
        { transform: 'none' }
      ], { duration: 680, delay: 200 });
    }
    bubbleBurst(steps, p, 480);
  }

  function cheer1(svg, host, steps) {
    var p = parts(svg);
    C.animArmsSymmetric(steps, p.armL, p.armR, [0, 40, 55, 32, 0], { duration: 800, delay: 180, easing: C.EASE_SPRING });
    C.animBodySymmetric(steps, p.body, { duration: 700, delay: 240, lift: 10 });
    C.animLegsSymmetric(steps, p.legs, { duration: 700, delay: 240, lift: 7 });
    if (p.eyeL && p.eyeR) {
      C.pushAnim(steps, p.eyeL, [{ transform: 'none' }, { transform: 'scale(1.4)' }, { transform: 'none' }], { duration: 480, delay: 360 });
      C.pushAnim(steps, p.eyeR, [{ transform: 'none' }, { transform: 'scale(1.4)' }, { transform: 'none' }], { duration: 480, delay: 360 });
    }
    if (p.smile) {
      C.pushAnim(steps, p.smile, [{ transform: 'scaleX(0.75)' }, { transform: 'scaleX(1.12)' }, { transform: 'none' }], { duration: 420, delay: 400 });
    }
    if (p.bubblesIdle) {
      p.bubblesIdle.style.opacity = '1';
      p.bubblesIdle.querySelectorAll('.nova-hero__bubble').forEach(function (b, i) {
        C.pushAnim(steps, b, [
          { transform: 'none', opacity: 0.2 },
          { transform: 'translateY(-' + (28 + i * 6) + 'px) scale(1.15)', opacity: 1 },
          { transform: 'none', opacity: 0 }
        ], { duration: 850, delay: 400 + i * 65, particle: true });
      });
    }
    turboJets(steps, p, 460, false);
  }

  function cheer2(svg, host, steps) {
    var p = parts(svg);
    C.pushAnim(steps, p.body, [
      { transform: 'none' },
      { transform: 'rotate(-8deg) translateY(-4px)' },
      { transform: 'rotate(8deg) translateY(-4px)' },
      { transform: 'rotate(-4deg) translateY(-2px)' },
      { transform: 'none' }
    ], { duration: 880, delay: 220, easing: 'ease-in-out' });
    C.animLegsSymmetric(steps, p.legs, { duration: 880, delay: 220, lift: 5 });
    if (p.head) {
      C.pushAnim(steps, p.head, [
        { transform: 'none' },
        { transform: 'translateY(-12px)' },
        { transform: 'none' }
      ], { duration: 620, delay: 280, easing: C.EASE_SPRING });
    }
    if (p.visorShine) {
      C.pushAnim(steps, p.visorShine, [
        { transform: 'translateX(-18px)', opacity: 0.3 },
        { transform: 'translateX(24px)', opacity: 1 },
        { transform: 'none', opacity: 0.6 }
      ], { duration: 600, delay: 340 });
    }
    C.animArmsSymmetric(steps, p.armL, p.armR, [0, 32, 0], { duration: 520, delay: 380 });
    if (p.glow) {
      p.glow.style.opacity = '0.65';
      C.pushAnim(steps, p.glow, [{ transform: 'scale(0.7)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 0.8 }, { transform: 'none', opacity: 0.35 }], { duration: 560, delay: 400 });
    }
  }

  /* FIRE / EPIC base */
  function nitroDash(steps, host, delay, epic) {
    var amp = epic ? 26 : 20;
    C.pushAnim(steps, host, [
      { transform: 'none' },
      { transform: 'translateX(-' + amp + 'px)' },
      { transform: 'translateX(' + amp + 'px)' },
      { transform: 'translateX(-' + Math.round(amp * 0.45) + 'px)' },
      { transform: 'none' }
    ], { duration: epic ? 700 : 540, delay: delay, easing: C.EASE_OUT });
  }

  function fire0(svg, host, steps, epic) {
    var p = parts(svg);
    nitroDash(steps, host, epic ? 260 : 160, epic);
    streaksOn(steps, p, 100, epic);
    turboJets(steps, p, 140, epic);
    C.animArmsSymmetric(steps, p.armL, p.armR, [0, epic ? 42 : 34, 0], { duration: 520, delay: 280 });
    C.animLegsSymmetric(steps, p.legs, { duration: 500, delay: 260, lift: 4 });
    if (p.wake) {
      p.wake.style.opacity = '1';
      C.pushAnim(steps, p.wake, [
        { transform: 'scaleX(0.4)', opacity: 0 },
        { transform: 'scaleX(1.3)', opacity: 0.85 },
        { transform: 'none', opacity: 0.45 }
      ], { duration: epic ? 760 : 600, delay: 180 });
    }
  }

  function fire1(svg, host, steps, epic) {
    var p = parts(svg);
    if (p.head && epic) {
      C.pushAnim(steps, p.head, [
        { transform: 'none', opacity: 1 },
        { transform: 'translateY(52px) scale(0.72)', opacity: 0.3 },
        { transform: 'translateY(-32px) scale(1.14)', opacity: 1 },
        { transform: 'none', opacity: 1 }
      ], { duration: 900, delay: 50, easing: C.EASE_SNAP });
    }
    turboJets(steps, p, 120, epic);
    streaksOn(steps, p, 80, epic);
    C.animBodySymmetric(steps, p.body, { duration: epic ? 640 : 520, delay: 200, lift: epic ? 10 : 7 });
    C.animLegsSymmetric(steps, p.legs, { duration: 520, delay: 200, lift: 5 });
    bubbleBurst(steps, p, epic ? 380 : 300);
    if (p.core) {
      C.pushAnim(steps, p.core, [
        { transform: 'none' },
        { transform: 'scale(' + (epic ? '1.55' : '1.35') + ') rotate(200deg)' },
        { transform: 'none' }
      ], { duration: epic ? 640 : 520, delay: 320 });
    }
  }

  function fire2(svg, host, steps, epic) {
    var p = parts(svg);
    C.pushAnim(steps, host, [
      { transform: 'none' },
      { transform: 'scale(1.05) translateY(-' + (epic ? 12 : 8) + 'px)' },
      { transform: 'none' }
    ], { duration: 560, delay: 180, easing: C.EASE_SPRING });
    turboJets(steps, p, 160, epic);
    C.animArmsSymmetric(steps, p.armL, p.armR, [0, 36, 48, 28, 0], { duration: epic ? 720 : 600, delay: 240 });
    C.animLegsSymmetric(steps, p.legs, { duration: 560, delay: 240, lift: 6 });
    if (p.visor) {
      C.pushAnim(steps, p.visor, [
        { filter: 'brightness(1)' },
        { filter: 'brightness(2.3)' },
        { filter: 'brightness(1)' }
      ], { duration: epic ? 680 : 520, delay: 300, keepStyle: true });
    }
    if (epic) {
      C.pushAnim(steps, host, [
        { transform: 'none' },
        { transform: 'scale(1.1) translateY(-14px)' },
        { transform: 'none' }
      ], { duration: 520, delay: 480, easing: C.EASE_SPRING });
    }
  }

  function playStoreIdle(host) {
    if (!host) return;
    var svg = host.querySelector('svg');
    if (!svg || svg.__ttIdleOn) return;
    svg.__ttIdleOn = true;
    var p = parts(svg);
    svg.querySelectorAll('.nova-hero__bubble').forEach(function (b, i) {
      C.anim(b, [
        { transform: 'none', opacity: 0.35 },
        { transform: 'translateY(-20px) scale(1.1)', opacity: 0.8 },
        { transform: 'none', opacity: 0 }
      ], { duration: 2200 + i * 300, delay: i * 400, iterations: Infinity, easing: 'ease-out', noRest: true });
    });
    if (p.body) C.anim(p.body, [{ transform: 'none' }, { transform: 'translateY(-4px)' }, { transform: 'none' }], { duration: 4000, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    if (p.armL) C.anim(p.armL, [{ transform: 'none' }, { transform: 'rotate(-18deg)' }, { transform: 'none' }], { duration: 1400, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    if (p.armR) C.anim(p.armR, [{ transform: 'none' }, { transform: 'rotate(18deg)' }, { transform: 'none' }], { duration: 1400, iterations: Infinity, noRest: true, easing: 'ease-in-out', delay: 700 });
  }

  var CHEER = [cheer0, cheer1, cheer2];
  var FIRE = [fire0, fire1, fire2];

  function playSpFx(host, variant, routine) {
    var svg = host && host.querySelector('svg');
    if (!svg) return Promise.resolve();
    C.resetSvg(svg, OPACITY_RESET);
    var steps = [];
    C.animHostPop(steps, host);
    var r = typeof routine === 'number' ? (routine % 3) : 0;
    var epic = variant === 'epic';
    if (variant === 'cheer') CHEER[r](svg, host, steps);
    else FIRE[r](svg, host, steps, epic);
    return C.runAll(steps);
  }

  window.novaTurboTurtlePlayStoreIdle = playStoreIdle;
  window.novaTurboTurtlePlaySpFx = playSpFx;
  window.novaTurboTurtleResetSvg = function (svg) { C.resetSvg(svg, OPACITY_RESET); };

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-nova-hero-host]').forEach(function (host) {
      var card = host.closest('.nova-hero-store-card--turbo, .nova-store-preview--turbo');
      if (card && host.querySelector('svg')) playStoreIdle(host);
    });
  });
})();

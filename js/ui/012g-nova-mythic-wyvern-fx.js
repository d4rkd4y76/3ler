/* Efsunlu Vayvern — mağaza/ana ekran idle + tek kişilik FX */
(function () {
  var C = window.novaHeroSpFxCore;
  if (!C) return;

  var OPACITY_RESET = ['.nova-hero__flames', '.nova-hero__sparks', '.nova-hero__aura', '.nova-hero__shards'];
  function waitMs(ms){ return new Promise(function (r) { setTimeout(r, ms); }); }

  function parts(svg) {
    return {
      wings: C.q(svg, '.nova-hero__wings'),
      wingL: C.q(svg, '.nova-hero__wing-l'),
      wingR: C.q(svg, '.nova-hero__wing-r'),
      body: C.q(svg, '.nova-hero__body'),
      head: C.q(svg, '.nova-hero__head'),
      glow: C.q(svg, '.nova-hero__core-glow'),
      flames: C.q(svg, '.nova-hero__flames'),
      flameC: C.q(svg, '.nova-hero__flame-c'),
      sparks: C.q(svg, '.nova-hero__sparks'),
      orbits: C.q(svg, '.nova-hero__orbits'),
      orbit2: C.q(svg, '.nova-hero__orbit--2'),
      orbit3: C.q(svg, '.nova-hero__orbit--3'),
      shards: C.q(svg, '.nova-hero__shards')
    };
  }

  function orbitIdle(p) {
    if (!p.orbits) return;
    C.anim(p.orbits, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
      duration: 7200,
      iterations: Infinity,
      noRest: true,
      easing: 'linear'
    });
    if (p.orbit2) C.anim(p.orbit2, [{ transform: 'none' }, { transform: 'rotate(-360deg)' }], { duration: 6200, iterations: Infinity, noRest: true, easing: 'linear' });
    if (p.orbit3) C.anim(p.orbit3, [{ transform: 'none' }, { transform: 'rotate(360deg)' }], { duration: 4800, iterations: Infinity, noRest: true, easing: 'linear' });
  }

  function playIdle(host) {
    if (!host) return;
    var svg = host.querySelector('svg');
    if (!svg || svg.__mwIdleOn) return;
    svg.__mwIdleOn = true;
    C.resetSvg(svg, OPACITY_RESET);
    var p = parts(svg);
    orbitIdle(p);

    if (p.wings) {
      C.anim(p.wings, [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-12px)' },
        { transform: 'translateY(-4px)' },
        { transform: 'translateY(-14px)' },
        { transform: 'translateY(0)' }
      ], { duration: 2800, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.wingL && p.wingR) {
      C.anim(p.wingL, [{ transform: 'rotate(-6deg)' }, { transform: 'rotate(-22deg)' }, { transform: 'rotate(-10deg)' }, { transform: 'rotate(-26deg)' }, { transform: 'rotate(-6deg)' }], { duration: 1180, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
      C.anim(p.wingR, [{ transform: 'rotate(6deg)' }, { transform: 'rotate(22deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(26deg)' }, { transform: 'rotate(6deg)' }], { duration: 1180, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.body) {
      C.anim(p.body, [{ transform: 'none' }, { transform: 'translateY(-10px) scale(1.03)' }, { transform: 'translateY(-4px) scale(1.01)' }, { transform: 'none' }], { duration: 2600, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.head) {
      C.anim(p.head, [{ transform: 'none' }, { transform: 'translateY(-6px) rotate(-2deg)' }, { transform: 'translateY(-2px) rotate(2deg)' }, { transform: 'none' }], { duration: 2100, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.glow) {
      p.glow.style.opacity = '0.28';
      C.anim(p.glow, [{ transform: 'scale(0.92)', opacity: 0.12 }, { transform: 'scale(1.25)', opacity: 0.62 }, { transform: 'scale(1.02)', opacity: 0.22 }], {
        duration: 2400,
        iterations: Infinity,
        noRest: true,
        easing: 'ease-in-out',
        keepStyle: true
      });
    }
  }

  function ignite(steps, p, delay, epic) {
    if (!p.flames) return;
    p.flames.style.opacity = '1';
    C.pushAnim(steps, p.flames, [{ transform: 'scale(0.35)', opacity: 0 }, { transform: 'scale(' + (epic ? '1.55' : '1.2') + ')', opacity: 1 }, { transform: 'scale(1.05)', opacity: epic ? 0.85 : 0.65 }, { transform: 'none', opacity: 0.18 }], { duration: epic ? 1700 : 1200, delay: delay, easing: 'ease-in-out' });
    if (p.flameC) C.pushAnim(steps, p.flameC, [{ transform: 'scaleY(0.6)' }, { transform: 'scaleY(' + (epic ? '1.85' : '1.35') + ')' }, { transform: 'scaleY(1.1)' }, { transform: 'none' }], { duration: epic ? 1500 : 980, delay: delay + 160, easing: C.EASE_SPRING });
  }

  function sparksSpiral(steps, p, delay) {
    if (!p.sparks) return;
    p.sparks.style.opacity = '1';
    p.sparks.querySelectorAll('circle').forEach(function (node, i) {
      var side = i % 2 ? 1 : -1;
      C.pushAnim(steps, node, [
        { transform: 'none', opacity: 0 },
        { transform: 'translate(' + (side * (10 + i * 2)) + 'px, -' + (10 + i * 2) + 'px) rotate(' + (side * 90) + 'deg)', opacity: 1 },
        { transform: 'translate(' + (side * (26 + i * 2)) + 'px, -' + (28 + i * 3) + 'px) rotate(' + (side * 240) + 'deg)', opacity: 0 }
      ], { duration: 1400, delay: delay + i * 70, particle: true, easing: C.EASE_OUT });
    });
  }

  function shardBurst(steps, p, delay, epic) {
    if (!p.shards) return;
    p.shards.style.opacity = '1';
    p.shards.querySelectorAll('.nova-hero__shard').forEach(function (node, i) {
      var ang = (i / 5) * Math.PI * 2;
      var dx = Math.round(Math.cos(ang) * (epic ? 34 : 24));
      var dy = Math.round(Math.sin(ang) * -(epic ? 28 : 20));
      C.pushAnim(steps, node, [{ transform: 'translate(0, 0) scale(0.6)', opacity: 0 }, { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(1.25)', opacity: 1 }, { transform: 'translate(' + Math.round(dx * 1.3) + 'px, ' + Math.round(dy * 1.25) + 'px) scale(0.35)', opacity: 0 }], {
        duration: epic ? 1500 : 1100,
        delay: delay + i * 70,
        particle: true,
        easing: 'ease-out'
      });
    });
  }

  function orbitSurge(steps, p, delay) {
    if (!p.orbits) return;
    C.pushAnim(steps, p.orbits, [{ transform: 'rotate(0deg) scale(0.9)', opacity: 0.2 }, { transform: 'rotate(240deg) scale(1.15)', opacity: 0.95 }, { transform: 'rotate(540deg) scale(1.02)', opacity: 0.45 }, { transform: 'none', opacity: 0.22 }], {
      duration: 1600,
      delay: delay,
      easing: C.EASE_OUT
    });
  }

  function epic0(svg, host, steps) {
    var p = parts(svg);
    orbitSurge(steps, p, 260);
    if (p.glow) {
      p.glow.style.opacity = '1';
      C.pushAnim(steps, p.glow, [{ transform: 'scale(0.35)', opacity: 0 }, { transform: 'scale(1.95)', opacity: 0.95 }, { transform: 'scale(1.25)', opacity: 0.35 }, { transform: 'none', opacity: 0.18 }], { duration: 1800, delay: 220, easing: 'ease-in-out' });
    }
    if (p.wingL && p.wingR) {
      C.pushAnim(steps, p.wingL, [{ transform: 'rotate(-10deg)' }, { transform: 'rotate(-34deg)' }, { transform: 'rotate(-16deg)' }, { transform: 'none' }], { duration: 1500, delay: 240, easing: 'ease-in-out' });
      C.pushAnim(steps, p.wingR, [{ transform: 'rotate(10deg)' }, { transform: 'rotate(34deg)' }, { transform: 'rotate(16deg)' }, { transform: 'none' }], { duration: 1500, delay: 240, easing: 'ease-in-out' });
    }
    shardBurst(steps, p, 520, true);
    ignite(steps, p, 560, true);
    sparksSpiral(steps, p, 700);
  }

  function epic1(svg, host, steps) {
    var p = parts(svg);
    C.pushAnim(steps, host, [{ transform: 'none' }, { transform: 'translateY(-26px) scale(1.06)' }, { transform: 'translateY(-10px) scale(1.03)' }, { transform: 'none' }], { duration: 1900, delay: 240, easing: 'ease-in-out' });
    orbitSurge(steps, p, 300);
    shardBurst(steps, p, 620, true);
    ignite(steps, p, 660, true);
    if (p.head) C.pushAnim(steps, p.head, [{ transform: 'none' }, { transform: 'translateY(-10px) rotate(-3deg)' }, { transform: 'translateY(-6px) rotate(3deg)' }, { transform: 'none' }], { duration: 1600, delay: 520, easing: 'ease-in-out' });
  }

  function epic2(svg, host, steps) {
    var p = parts(svg);
    orbitSurge(steps, p, 220);
    if (p.wings) C.pushAnim(steps, p.wings, [{ transform: 'none' }, { transform: 'translateY(-18px)' }, { transform: 'translateY(-8px)' }, { transform: 'none' }], { duration: 1750, delay: 220, easing: 'ease-in-out' });
    if (p.glow) {
      p.glow.style.opacity = '1';
      C.pushAnim(steps, p.glow, [{ transform: 'scale(0.45)', opacity: 0 }, { transform: 'scale(1.75)', opacity: 0.9 }, { transform: 'scale(1.1)', opacity: 0.32 }, { transform: 'none', opacity: 0.18 }], { duration: 1650, delay: 220 });
    }
    shardBurst(steps, p, 520, true);
    ignite(steps, p, 640, true);
    sparksSpiral(steps, p, 780);
  }

  function cheer0(svg, host, steps) {
    var p = parts(svg);
    if (!p.glow) return;
    p.glow.style.opacity = '0.55';
    C.pushAnim(steps, p.glow, [{ transform: 'scale(0.7)', opacity: 0 }, { transform: 'scale(1.25)', opacity: 0.8 }, { transform: 'none', opacity: 0.25 }], { duration: 980, delay: 260 });
  }

  function cheer1(svg, host, steps) { orbitSurge(steps, parts(svg), 240); }
  function cheer2(svg, host, steps) { sparksSpiral(steps, parts(svg), 340); }

  function fire0(svg, host, steps, epic) { var p = parts(svg); shardBurst(steps, p, 320, epic); ignite(steps, p, 380, epic); }
  function fire1(svg, host, steps, epic) { var p = parts(svg); orbitSurge(steps, p, 260); shardBurst(steps, p, 420, epic); ignite(steps, p, 520, epic); }
  function fire2(svg, host, steps, epic) { var p = parts(svg); ignite(steps, p, 520, epic); sparksSpiral(steps, p, 640); }

  var CHEER = [cheer0, cheer1, cheer2];
  var FIRE = [fire0, fire1, fire2];
  var EPIC = [epic0, epic1, epic2];

  function playSpFx(host, variant, routine) {
    var svg = host && host.querySelector('svg');
    if (!svg) return Promise.resolve();
    C.resetSvg(svg, OPACITY_RESET);
    var steps = [];
    C.animHostPop(steps, host);
    var r = typeof routine === 'number' ? (routine % 3) : 0;

    if (variant === 'epic') {
      EPIC[r](svg, host, steps);
      return C.runAll(steps).then(function () { return waitMs(2650); });
    }
    if (variant === 'fire') {
      FIRE[r](svg, host, steps, false);
      return C.runAll(steps).then(function () { return waitMs(1800); });
    }
    CHEER[r](svg, host, steps);
    return C.runAll(steps).then(function () { return waitMs(1150); });
  }

  function resetSvg(svg) {
    C.resetSvg(svg, OPACITY_RESET);
    if (svg) svg.__mwIdleOn = false;
  }

  window.novaMythicWyvernPlayIdle = playIdle;
  window.novaMythicWyvernPlaySpFx = playSpFx;
  window.novaMythicWyvernResetSvg = resetSvg;
})();


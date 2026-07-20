/* Buz Ejderi — özgün buz/kristal/kar FX (diğer kahramanlardan ayrı motor) */
(function () {
  var C = window.novaHeroSpFxCore;
  if (!C) return;

  var OPACITY_RESET = [
    '.nova-hero__ice-breath', '.nova-hero__frost-mist', '.nova-hero__snowflakes',
    '.nova-hero__crystals', '.nova-hero__frost-rings', '.nova-hero__sparks', '.nova-hero__aurora'
  ];

  function waitMs(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function frost(host) {
    return (typeof window.novaBuzEjderGetFrost === 'function') ? window.novaBuzEjderGetFrost(host) : null;
  }

  function setFrost(host, intensity, burst) {
    var eng = frost(host);
    if (!eng) return;
    if (typeof intensity === 'number') eng.setIntensity(intensity);
    if (burst) eng.addBurst(burst);
    if (typeof eng.syncOriginFromHost === 'function') eng.syncOriginFromHost(host);
  }

  function parts(svg) {
    return {
      aurora: C.q(svg, '.nova-hero__aurora'),
      auroraBands: svg ? svg.querySelectorAll('.nova-hero__aurora-band') : [],
      mist: C.q(svg, '.nova-hero__frost-mist'),
      breath: C.q(svg, '.nova-hero__ice-breath'),
      breathC: C.q(svg, '.nova-hero__breath-c'),
      breathMist: C.q(svg, '.nova-hero__breath-mist'),
      rings: C.q(svg, '.nova-hero__frost-rings'),
      ring1: C.q(svg, '.nova-hero__frost-ring--1'),
      ring2: C.q(svg, '.nova-hero__frost-ring--2'),
      ring3: C.q(svg, '.nova-hero__frost-ring--3'),
      snow: C.q(svg, '.nova-hero__snowflakes'),
      crystals: C.q(svg, '.nova-hero__crystals'),
      sparks: C.q(svg, '.nova-hero__sparks'),
      wings: C.q(svg, '.nova-hero__wings'),
      wingL: C.q(svg, '.nova-hero__wing-l'),
      wingR: C.q(svg, '.nova-hero__wing-r'),
      wingMemL: C.q(svg, '.nova-hero__wing-membrane-l'),
      wingMemR: C.q(svg, '.nova-hero__wing-membrane-r'),
      body: C.q(svg, '.nova-hero__body'),
      belly: C.q(svg, '.nova-hero__belly'),
      chest: C.q(svg, '.nova-hero__chest-gem'),
      head: C.q(svg, '.nova-hero__head'),
      eyeGlowL: C.q(svg, '.nova-hero__eye-glow-l'),
      eyeGlowR: C.q(svg, '.nova-hero__eye-glow-r'),
      jaw: C.q(svg, '.nova-hero__jaw'),
      crown: C.q(svg, '.nova-hero__crown'),
      wingsUp: C.q(svg, '.nova-hero__wings-upper'),
      wingUpL: C.q(svg, '.nova-hero__wing-up-l'),
      wingUpR: C.q(svg, '.nova-hero__wing-up-r'),
      tailBehind: C.q(svg, '.nova-hero__tail-behind'),
      spines: C.q(svg, '.nova-hero__spines'),
      neck: C.q(svg, '.nova-hero__neck'),
      snout: C.q(svg, '.nova-hero__snout'),
      scalesBody: C.q(svg, '.nova-hero__scales--body'),
      scalePlates: svg ? svg.querySelectorAll('.nova-hero__scale') : [],
      tail: C.q(svg, '.nova-hero__tail'),
      tailTip: C.q(svg, '.nova-hero__tail-tip'),
      tailFrost: C.q(svg, '.nova-hero__tail-frost'),
      tailIceBurst: C.q(svg, '.nova-hero__tail-ice-burst'),
      tailIceGlow: C.q(svg, '.nova-hero__tail-ice-glow'),
      glow: C.q(svg, '.nova-hero__core-glow'),
      scales: C.q(svg, '.nova-hero__scales')
    };
  }

  function frostRingIdle(p) {
    if (!p.rings) return;
    C.anim(p.rings, [{ transform: 'rotateX(58deg) rotate(0deg)' }, { transform: 'rotateX(58deg) rotate(360deg)' }], {
      duration: 9000, iterations: Infinity, noRest: true, easing: 'linear'
    });
    if (p.ring2) {
      C.anim(p.ring2, [{ transform: 'rotateX(62deg) scale(1)' }, { transform: 'rotateX(62deg) scale(1.08)' }, { transform: 'rotateX(62deg) scale(1)' }], {
        duration: 3200, iterations: Infinity, noRest: true, easing: 'ease-in-out'
      });
    }
    if (p.ring3) {
      C.anim(p.ring3, [{ transform: 'rotateX(64deg) rotate(0deg)' }, { transform: 'rotateX(64deg) rotate(-360deg)' }], {
        duration: 6400, iterations: Infinity, noRest: true, easing: 'linear'
      });
    }
  }

  function auroraIdle(p) {
    if (p.aurora) {
      C.anim(p.aurora, [{ opacity: 0.45 }, { opacity: 0.72 }, { opacity: 0.5 }], {
        duration: 3800, iterations: Infinity, noRest: true, easing: 'ease-in-out', keepStyle: true
      });
    }
    if (p.auroraBands && p.auroraBands.length) {
      for (var i = 0; i < p.auroraBands.length; i++) {
        (function (band, idx) {
          C.anim(band, [{ transform: 'translateX(0)', opacity: 0.08 }, { transform: 'translateX(' + (idx ? -6 : 6) + 'px)', opacity: 0.22 }, { transform: 'translateX(0)', opacity: 0.08 }], {
            duration: 4200 + idx * 400, iterations: Infinity, noRest: true, easing: 'ease-in-out', keepStyle: true
          });
        })(p.auroraBands[i], i);
      }
    }
  }

  function mistIdle(p) {
    if (!p.mist) return;
    p.mist.style.opacity = '0.35';
    C.anim(p.mist, [{ transform: 'scale(0.92)', opacity: 0.18 }, { transform: 'scale(1.12)', opacity: 0.42 }, { transform: 'scale(0.96)', opacity: 0.22 }], {
      duration: 2800, iterations: Infinity, noRest: true, easing: 'ease-in-out', keepStyle: true
    });
  }

  function playIdle(host) {
    if (!host) return;
    if (typeof window.novaBuzEjderMountWebGL === 'function') {
      window.novaBuzEjderMountWebGL(host);
    }
    setFrost(host, 0.22, 0);
    var svg = host.querySelector('svg');
    if (!svg || svg.__beIdleOn) return;
    svg.__beIdleOn = true;
    C.resetSvg(svg, OPACITY_RESET);
    var p = parts(svg);
    frostRingIdle(p);
    auroraIdle(p);
    mistIdle(p);

    if (p.wings) {
      C.anim(p.wings, [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-5px)' },
        { transform: 'translateY(-2px)' },
        { transform: 'translateY(-6px)' },
        { transform: 'translateY(0)' }
      ], { duration: 3000, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.wingUpL && p.wingUpR) {
      C.anim(p.wingUpL, [{ transform: 'rotate(-1deg)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(-1deg)' }], { duration: 2600, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
      C.anim(p.wingUpR, [{ transform: 'rotate(1deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(2deg)' }, { transform: 'rotate(7deg)' }, { transform: 'rotate(1deg)' }], { duration: 2600, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.crown) {
      C.anim(p.crown, [{ transform: 'none' }, { transform: 'translateY(-2px)' }, { transform: 'none' }], { duration: 2800, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.tailBehind) {
      C.anim(p.tailBehind, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(1.5deg)' }, { transform: 'rotate(-1deg)' }, { transform: 'rotate(0deg)' }], { duration: 3400, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.wingL && p.wingR) {
      C.anim(p.wingL, [{ transform: 'rotate(-2deg)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(-10deg)' }, { transform: 'rotate(-2deg)' }], { duration: 2400, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
      C.anim(p.wingR, [{ transform: 'rotate(2deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(2deg)' }], { duration: 2400, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.wingMemL && p.wingMemR) {
      C.anim(p.wingMemL, [{ opacity: 0.12 }, { opacity: 0.28 }, { opacity: 0.14 }], { duration: 2200, iterations: Infinity, noRest: true, keepStyle: true });
      C.anim(p.wingMemR, [{ opacity: 0.12 }, { opacity: 0.28 }, { opacity: 0.14 }], { duration: 2400, iterations: Infinity, noRest: true, keepStyle: true });
    }
    if (p.body) {
      C.anim(p.body, [{ transform: 'none' }, { transform: 'translateY(-9px) scale(1.025)' }, { transform: 'translateY(-3px) scale(1.01)' }, { transform: 'none' }], { duration: 2700, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.chest) {
      C.anim(p.chest, [{ opacity: 0.28 }, { opacity: 0.55 }, { opacity: 0.3 }], { duration: 2100, iterations: Infinity, noRest: true, keepStyle: true });
    }
    if (p.head) {
      C.anim(p.head, [{ transform: 'none' }, { transform: 'translateY(-4px) rotate(-1.5deg)' }, { transform: 'translateY(-1px) rotate(1.5deg)' }, { transform: 'none' }], { duration: 2300, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.eyeGlowL) {
      C.anim(p.eyeGlowL, [{ opacity: 0.22 }, { opacity: 0.42 }, { opacity: 0.26 }], { duration: 2600, iterations: Infinity, noRest: true, easing: 'ease-in-out', keepStyle: true });
    }
    if (p.eyeGlowR) {
      C.anim(p.eyeGlowR, [{ opacity: 0.2 }, { opacity: 0.4 }, { opacity: 0.24 }], { duration: 2800, iterations: Infinity, noRest: true, easing: 'ease-in-out', keepStyle: true });
    }
    if (p.jaw) {
      C.anim(p.jaw, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(-1deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0deg)' }], { duration: 1900, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.tail) {
      C.anim(p.tail, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(2deg)' }, { transform: 'rotate(-1.5deg)' }, { transform: 'rotate(0deg)' }], { duration: 3200, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.tailIceGlow) {
      C.anim(p.tailIceGlow, [{ opacity: 0.42, transform: 'scale(0.92)' }, { opacity: 0.72, transform: 'scale(1.12)' }, { opacity: 0.48, transform: 'scale(0.98)' }], {
        duration: 2400, iterations: Infinity, noRest: true, easing: 'ease-in-out', keepStyle: true
      });
    }
    if (p.tailIceBurst) {
      p.tailIceBurst.style.opacity = '1';
      var shards = p.tailIceBurst.querySelectorAll('.nova-hero__tail-ice-shard, .nova-hero__tail-ice-spark');
      for (var ti = 0; ti < shards.length; ti++) {
        (function (node, idx) {
          C.anim(node, [{ opacity: 0.55, transform: 'translateY(0)' }, { opacity: 1, transform: 'translateY(-3px)' }, { opacity: 0.6, transform: 'translateY(0)' }], {
            duration: 1800 + idx * 200, iterations: Infinity, noRest: true, easing: 'ease-in-out', keepStyle: true, delay: idx * 150
          });
        })(shards[ti], ti);
      }
    }
    if (p.neck) {
      C.anim(p.neck, [{ transform: 'none' }, { transform: 'translateY(-3px) rotate(1deg)' }, { transform: 'translateY(-1px) rotate(-1deg)' }, { transform: 'none' }], { duration: 2600, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.spines) {
      C.anim(p.spines, [{ transform: 'translateY(0)' }, { transform: 'translateY(-2px)' }, { transform: 'translateY(0)' }], { duration: 2200, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.scalePlates && p.scalePlates.length > 8) {
      for (var si = 0; si < 8; si++) {
        (function (node, idx) {
          C.anim(node, [{ opacity: 0.7, filter: 'brightness(1)' }, { opacity: 0.95, filter: 'brightness(1.28)' }, { opacity: 0.72, filter: 'brightness(1)' }], {
            duration: 2400 + idx * 180, iterations: Infinity, noRest: true, easing: 'ease-in-out', keepStyle: true, delay: idx * 220
          });
        })(p.scalePlates[(si * 13) % p.scalePlates.length], si);
      }
    }
    if (p.glow) {
      p.glow.style.opacity = '0.3';
      C.anim(p.glow, [{ transform: 'scale(0.88)', opacity: 0.12 }, { transform: 'scale(1.22)', opacity: 0.58 }, { transform: 'scale(0.98)', opacity: 0.2 }], {
        duration: 2600, iterations: Infinity, noRest: true, easing: 'ease-in-out', keepStyle: true
      });
    }
  }

  function blizzardBreath(steps, p, delay, epic) {
    if (!p.breath) return;
    p.breath.style.opacity = '1';
    var sc = epic ? 1.65 : 1.28;
    C.pushAnim(steps, p.breath, [
      { transform: 'scale(0.3) translateY(12px)', opacity: 0 },
      { transform: 'scale(' + sc + ') translateY(-8px)', opacity: 1 },
      { transform: 'scale(1.08) translateY(-2px)', opacity: epic ? 0.88 : 0.62 },
      { transform: 'none', opacity: 0.15 }
    ], { duration: epic ? 1750 : 1250, delay: delay, easing: 'ease-out' });
    if (p.breathC) {
      C.pushAnim(steps, p.breathC, [
        { transform: 'scaleY(0.4) skewX(-6deg)' },
        { transform: 'scaleY(' + (epic ? 1.95 : 1.45) + ') skewX(4deg)' },
        { transform: 'scaleY(1.05) skewX(0deg)' },
        { transform: 'none' }
      ], { duration: epic ? 1500 : 1000, delay: delay + 100, easing: C.EASE_SPRING });
    }
    if (p.breathMist) {
      C.pushAnim(steps, p.breathMist, [{ opacity: 0 }, { opacity: epic ? 0.45 : 0.28 }, { opacity: 0 }], { duration: epic ? 1600 : 1100, delay: delay + 180, keepStyle: true });
    }
  }

  function crystalShatter(steps, p, delay, epic) {
    if (!p.crystals) return;
    p.crystals.style.opacity = '1';
    p.crystals.querySelectorAll('.nova-hero__crystal').forEach(function (node, i) {
      var ang = (i / 6) * Math.PI * 2 + 0.3;
      var dx = Math.round(Math.cos(ang) * (epic ? 42 : 28));
      var dy = Math.round(Math.sin(ang) * -(epic ? 36 : 24));
      C.pushAnim(steps, node, [
        { transform: 'translate(0,0) rotate(0deg) scale(0.4)', opacity: 0 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (ang * 57) + 'deg) scale(1.35)', opacity: 1 },
        { transform: 'translate(' + Math.round(dx * 1.4) + 'px,' + Math.round(dy * 1.3) + 'px) rotate(' + (ang * 90) + 'deg) scale(0.2)', opacity: 0 }
      ], { duration: epic ? 1650 : 1150, delay: delay + i * 55, particle: true, easing: 'ease-out' });
    });
  }

  function snowfallDrift(steps, p, delay, epic) {
    if (!p.snow) return;
    p.snow.style.opacity = '1';
    p.snow.querySelectorAll('.nova-hero__snowflake').forEach(function (node, i) {
      var drift = (i % 2 ? 1 : -1) * (12 + i * 3);
      C.pushAnim(steps, node, [
        { transform: 'translateY(-8px) scale(0.5)', opacity: 0 },
        { transform: 'translate(' + drift + 'px, 12px) scale(1.2)', opacity: 1 },
        { transform: 'translate(' + (drift * 1.6) + 'px, ' + (epic ? 48 : 32) + 'px) scale(0.4)', opacity: 0 }
      ], { duration: epic ? 1500 : 1050, delay: delay + i * 65, particle: true, easing: 'ease-in-out' });
    });
  }

  function frostNova(steps, p, delay) {
    if (!p.rings) return;
    C.pushAnim(steps, p.rings, [
      { transform: 'rotateX(58deg) scale(0.5)', opacity: 0.1 },
      { transform: 'rotateX(58deg) scale(1.35)', opacity: 1 },
      { transform: 'rotateX(58deg) scale(1.05)', opacity: 0.35 },
      { transform: 'rotateX(58deg) scale(1)', opacity: 0.5 }
    ], { duration: 1900, delay: delay, easing: C.EASE_OUT });
    if (p.mist) {
      p.mist.style.opacity = '1';
      C.pushAnim(steps, p.mist, [{ transform: 'scale(0.6)', opacity: 0 }, { transform: 'scale(1.45)', opacity: 0.55 }, { transform: 'scale(1.1)', opacity: 0.2 }], { duration: 1700, delay: delay + 120, keepStyle: true });
    }
  }

  function iceCrackle(steps, p, delay) {
    if (!p.sparks) return;
    p.sparks.style.opacity = '1';
    p.sparks.querySelectorAll('circle').forEach(function (node, i) {
      C.pushAnim(steps, node, [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1.8)', opacity: 1 },
        { transform: 'scale(0.3)', opacity: 0 }
      ], { duration: 520, delay: delay + i * 45, particle: true, easing: C.EASE_SNAP });
    });
  }

  function auroraSurge(steps, p, delay) {
    if (!p.aurora) return;
    C.pushAnim(steps, p.aurora, [{ opacity: 0.3 }, { opacity: 0.95 }, { opacity: 0.4 }], { duration: 1600, delay: delay, keepStyle: true });
  }

  function scaleShimmer(steps, p, delay, epic) {
    if (!p.scalePlates || !p.scalePlates.length) return;
    var n = epic ? 18 : 10;
    var max = Math.min(p.scalePlates.length, n);
    for (var i = 0; i < max; i++) {
      var node = p.scalePlates[(i * 7) % p.scalePlates.length];
      if (!node) continue;
      C.pushAnim(steps, node, [
        { opacity: 0.65, filter: 'brightness(1)' },
        { opacity: 1, filter: 'brightness(' + (epic ? 1.65 : 1.35) + ')' },
        { opacity: 0.75, filter: 'brightness(1)' }
      ], { duration: epic ? 680 : 520, delay: delay + i * 45, keepStyle: true });
    }
  }

  function routineCheer(host, svg, routine) {
    var p = parts(svg);
    var steps = [];
    setFrost(host, 0.85, 0.45);
    if (routine === 0) {
      iceCrackle(steps, p, 200);
      if (p.chest) C.pushAnim(steps, p.chest, [{ opacity: 0.3 }, { opacity: 0.75 }, { opacity: 0.35 }], { duration: 720, delay: 180, keepStyle: true });
    } else if (routine === 1) {
      frostNova(steps, p, 240);
    } else {
      snowfallDrift(steps, p, 280, false);
    }
    if (p.head) C.pushAnim(steps, p.head, [{ transform: 'none' }, { transform: 'translateY(-8px)' }, { transform: 'none' }], { duration: 680, easing: C.EASE_SPRING });
    return C.runAll(steps).then(function () { setFrost(host, 0.34, 0); return waitMs(100); });
  }

  function routineFire(host, svg, routine) {
    var p = parts(svg);
    var steps = [];
    setFrost(host, 1.45, 0.9);
    C.animHostPop(steps, host, { duration: 780 });
    if (routine === 0) {
      blizzardBreath(steps, p, 80, false);
      crystalShatter(steps, p, 320, false);
      scaleShimmer(steps, p, 260, false);
    } else if (routine === 1) {
      frostNova(steps, p, 200);
      blizzardBreath(steps, p, 380, false);
      iceCrackle(steps, p, 520);
    } else {
      snowfallDrift(steps, p, 160, false);
      blizzardBreath(steps, p, 420, false);
    }
    if (p.tailFrost) C.pushAnim(steps, p.tailFrost, [{ opacity: 0.15 }, { opacity: 0.55 }, { opacity: 0.2 }], { duration: 900, delay: 200, keepStyle: true });
    return C.runAll(steps).then(function () { setFrost(host, 0.34, 0); return waitMs(120); });
  }

  function routineEpic(host, svg, routine) {
    var p = parts(svg);
    var steps = [];
    setFrost(host, 2.1, 1.35);
    C.pushAnim(steps, host, [{ transform: 'none' }, { transform: 'translateY(-22px) scale(1.05)' }, { transform: 'translateY(-8px) scale(1.02)' }, { transform: 'none' }], { duration: 1850, delay: 200, easing: 'ease-in-out' });
    auroraSurge(steps, p, 180);
    frostNova(steps, p, 280);
    scaleShimmer(steps, p, 320, true);
    if (routine === 0) {
      blizzardBreath(steps, p, 420, true);
      crystalShatter(steps, p, 520, true);
      snowfallDrift(steps, p, 640, true);
    } else if (routine === 1) {
      if (p.crown) C.pushAnim(steps, p.crown, [{ transform: 'none' }, { transform: 'translateY(-6px) scale(1.04)' }, { transform: 'none' }], { duration: 1200, delay: 400, easing: C.EASE_SPRING });
      if (p.snout) C.pushAnim(steps, p.snout, [{ transform: 'none' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 900, delay: 480, easing: C.EASE_SPRING });
      crystalShatter(steps, p, 480, true);
      blizzardBreath(steps, p, 600, true);
      iceCrackle(steps, p, 720);
    } else {
      if (p.wings) C.pushAnim(steps, p.wings, [{ transform: 'none' }, { transform: 'translateY(-20px) scale(1.02)' }, { transform: 'none' }], { duration: 1700, delay: 300, easing: 'ease-in-out' });
      blizzardBreath(steps, p, 500, true);
      snowfallDrift(steps, p, 620, true);
      crystalShatter(steps, p, 700, true);
    }
    scaleShimmer(steps, p, 780, true);
    if (p.glow) {
      p.glow.style.opacity = '1';
      C.pushAnim(steps, p.glow, [{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(2)', opacity: 0.92 }, { transform: 'scale(1.15)', opacity: 0.28 }], { duration: 1800, delay: 350, keepStyle: true });
    }
    return C.runAll(steps).then(function () { setFrost(host, 0.34, 0); return waitMs(140); });
  }

  function playSpFx(host, variant, routine) {
    if (!host) return waitMs(680);
    if (typeof window.novaBuzEjderPlayTrueClip === 'function' && window.novaBuzEjderHasTrueClips && window.novaBuzEjderHasTrueClips()) {
      if (typeof window.novaBuzEjderEnsureTrueClipsReady === 'function') {
        window.novaBuzEjderEnsureTrueClipsReady();
      }
      if (typeof window.novaBuzEjderPickTrueClipRoutine === 'function') {
        routine = window.novaBuzEjderPickTrueClipRoutine();
      }
      return window.novaBuzEjderPlayTrueClip(host, routine);
    }
    if (typeof window.novaBuzEjderMountWebGL === 'function') {
      window.novaBuzEjderMountWebGL(host);
    }
    var svg = host.querySelector('svg');
    if (!svg) return waitMs(680);
    svg.__beIdleOn = false;
    C.resetSvg(svg, OPACITY_RESET);
    routine = (routine == null ? 0 : routine) % 3;
    if (variant === 'epic') {
      return routineEpic(host, svg, routine).then(function () { playIdle(host); });
    }
    if (variant === 'fire') {
      return routineFire(host, svg, routine).then(function () { playIdle(host); });
    }
    return routineCheer(host, svg, routine).then(function () { playIdle(host); });
  }

  function resetHost(host) {
    if (typeof window.novaBuzEjderTrueUnmount === 'function') {
      window.novaBuzEjderTrueUnmount(host);
    }
    if (typeof window.novaBuzEjderUnmountWebGL === 'function') {
      window.novaBuzEjderUnmountWebGL(host);
    }
    var svg = host && host.querySelector('svg');
    if (svg) {
      svg.__beIdleOn = false;
      C.resetSvg(svg, OPACITY_RESET);
    }
  }

  window.novaBuzEjderPlayIdle = playIdle;
  window.novaBuzEjderPlaySpFx = playSpFx;
  window.novaBuzEjderResetHost = resetHost;
})();

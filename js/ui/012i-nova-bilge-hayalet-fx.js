/* Bilge Hayalet — premium idle + tek kişilik FX */
(function () {
  var C = window.novaHeroSpFxCore;
  if (!C) return;

  var OPACITY_RESET = ['.nova-hero__sparks', '.nova-hero__beam', '.nova-hero__aura'];
  function waitMs(ms){ return new Promise(function (r) { setTimeout(r, ms); }); }

  function parts(svg) {
    return {
      body: C.q(svg, '.nova-hero__body'),
      head: C.q(svg, '.nova-hero__head'),
      armL: C.q(svg, '.nova-hero__arm-l'),
      armR: C.q(svg, '.nova-hero__arm-r'),
      scroll: C.q(svg, '.nova-hero__scroll'),
      runes: C.q(svg, '.nova-hero__runes'),
      glow: C.q(svg, '.nova-hero__core-glow'),
      sparks: C.q(svg, '.nova-hero__sparks'),
      beam: C.q(svg, '.nova-hero__beam')
    };
  }

  function playIdle(host) {
    if (!host) return;
    var svg = host.querySelector('svg');
    if (!svg || svg.__bgIdleOn) return;
    svg.__bgIdleOn = true;
    C.resetSvg(svg, OPACITY_RESET);
    var p = parts(svg);

    if (p.runes) C.anim(p.runes, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 7800, iterations: Infinity, noRest: true, easing: 'linear' });
    if (p.body) C.anim(p.body, [{ transform: 'none' }, { transform: 'translateY(-10px) scale(1.02)' }, { transform: 'translateY(-3px) scale(1.01)' }, { transform: 'none' }], { duration: 2700, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    if (p.head) C.anim(p.head, [{ transform: 'none' }, { transform: 'translateY(-6px) rotate(-1.5deg)' }, { transform: 'translateY(-2px) rotate(1.5deg)' }, { transform: 'none' }], { duration: 2200, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    if (p.armL && p.armR) {
      C.anim(p.armL, [{ transform: 'rotate(-6deg)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(-16deg)' }, { transform: 'rotate(-6deg)' }], { duration: 1900, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
      C.anim(p.armR, [{ transform: 'rotate(6deg)' }, { transform: 'rotate(14deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(16deg)' }, { transform: 'rotate(6deg)' }], { duration: 1900, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.scroll) C.anim(p.scroll, [{ transform: 'none' }, { transform: 'translateY(4px) rotate(-1deg)' }, { transform: 'translateY(2px) rotate(1deg)' }, { transform: 'none' }], { duration: 2400, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    if (p.glow) {
      p.glow.style.opacity = '0.26';
      C.anim(p.glow, [{ transform: 'scale(0.92)', opacity: 0.12 }, { transform: 'scale(1.18)', opacity: 0.55 }, { transform: 'scale(1.02)', opacity: 0.22 }], { duration: 2600, iterations: Infinity, noRest: true, easing: 'ease-in-out', keepStyle: true });
    }
  }

  function sparkWisdom(steps, p, delay) {
    if (!p.sparks) return;
    p.sparks.style.opacity = '1';
    p.sparks.querySelectorAll('circle').forEach(function (node, i) {
      var side = i % 2 ? 1 : -1;
      C.pushAnim(steps, node, [
        { transform: 'translate(0, 0) scale(0.6)', opacity: 0 },
        { transform: 'translate(' + (side * (10 + i * 2)) + 'px, -' + (12 + i * 2) + 'px) scale(1.15)', opacity: 1 },
        { transform: 'translate(' + (side * (24 + i * 2)) + 'px, -' + (30 + i * 3) + 'px) scale(0.35)', opacity: 0 }
      ], { duration: 1350, delay: delay + i * 70, particle: true, easing: C.EASE_OUT });
    });
  }

  function beamCast(steps, p, delay, epic) {
    if (!p.beam) return;
    p.beam.style.opacity = '1';
    C.pushAnim(steps, p.beam, [
      { transform: 'scale(0.55)', opacity: 0 },
      { transform: 'scale(' + (epic ? '1.55' : '1.2') + ')', opacity: 1 },
      { transform: 'scale(1.05)', opacity: epic ? 0.75 : 0.55 },
      { transform: 'none', opacity: 0.16 }
    ], { duration: epic ? 1900 : 1400, delay: delay, easing: 'ease-in-out' });
  }

  function runeSurge(steps, p, delay) {
    if (!p.runes) return;
    C.pushAnim(steps, p.runes, [
      { transform: 'rotate(0deg) scale(0.9)', opacity: 0.2 },
      { transform: 'rotate(260deg) scale(1.18)', opacity: 0.95 },
      { transform: 'rotate(540deg) scale(1.02)', opacity: 0.45 },
      { transform: 'none', opacity: 0.26 }
    ], { duration: 1650, delay: delay, easing: C.EASE_OUT });
  }

  function epic0(svg, host, steps) {
    var p = parts(svg);
    runeSurge(steps, p, 240);
    if (p.glow) {
      p.glow.style.opacity = '1';
      C.pushAnim(steps, p.glow, [
        { transform: 'scale(0.35)', opacity: 0 },
        { transform: 'scale(1.85)', opacity: 0.92 },
        { transform: 'scale(1.18)', opacity: 0.35 },
        { transform: 'none', opacity: 0.18 }
      ], { duration: 1850, delay: 220, easing: 'ease-in-out' });
    }
    if (p.armL && p.armR) C.animArmsSymmetric(steps, p.armL, p.armR, [10, 24, 12], { duration: 1500, delay: 260, easing: 'ease-in-out' });
    beamCast(steps, p, 560, true);
    sparkWisdom(steps, p, 720);
  }

  function epic1(svg, host, steps) {
    var p = parts(svg);
    C.pushAnim(steps, host, [{ transform: 'none' }, { transform: 'translateY(-24px) scale(1.06)' }, { transform: 'translateY(-10px) scale(1.03)' }, { transform: 'none' }], { duration: 1900, delay: 240, easing: 'ease-in-out' });
    runeSurge(steps, p, 320);
    beamCast(steps, p, 620, true);
    if (p.scroll) C.pushAnim(steps, p.scroll, [{ transform: 'none' }, { transform: 'translateY(-10px) rotate(-4deg)' }, { transform: 'translateY(-6px) rotate(2deg)' }, { transform: 'none' }], { duration: 1500, delay: 520, easing: 'ease-in-out' });
  }

  function epic2(svg, host, steps) {
    var p = parts(svg);
    runeSurge(steps, p, 220);
    if (p.body) C.pushAnim(steps, p.body, [{ transform: 'none' }, { transform: 'translateY(-16px) scale(1.04)' }, { transform: 'translateY(-8px) scale(1.02)' }, { transform: 'none' }], { duration: 1750, delay: 220, easing: 'ease-in-out' });
    beamCast(steps, p, 640, true);
    sparkWisdom(steps, p, 820);
  }

  function cheer0(svg, host, steps) { sparkWisdom(steps, parts(svg), 320); }
  function cheer1(svg, host, steps) { runeSurge(steps, parts(svg), 240); }
  function cheer2(svg, host, steps) { var p = parts(svg); beamCast(steps, p, 380, false); }

  function fire0(svg, host, steps, epic) { var p = parts(svg); runeSurge(steps, p, 240); beamCast(steps, p, 420, epic); }
  function fire1(svg, host, steps, epic) { var p = parts(svg); beamCast(steps, p, 320, epic); sparkWisdom(steps, p, 520); }
  function fire2(svg, host, steps, epic) { var p = parts(svg); runeSurge(steps, p, 240); beamCast(steps, p, 560, epic); }

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

    if (variant === 'epic') { EPIC[r](svg, host, steps); return C.runAll(steps).then(function () { return waitMs(2600); }); }
    if (variant === 'fire') { FIRE[r](svg, host, steps, false); return C.runAll(steps).then(function () { return waitMs(1800); }); }
    CHEER[r](svg, host, steps); return C.runAll(steps).then(function () { return waitMs(1150); });
  }

  function resetSvg(svg) { C.resetSvg(svg, OPACITY_RESET); if (svg) svg.__bgIdleOn = false; }

  window.novaBilgeHayaletPlayIdle = playIdle;
  window.novaBilgeHayaletPlaySpFx = playSpFx;
  window.novaBilgeHayaletResetSvg = resetSvg;
})();


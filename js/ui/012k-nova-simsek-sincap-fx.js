/* Parlak Pati — mağaza/ana ekran idle + tek kişilik FX */
(function () {
  var C = window.novaHeroSpFxCore;
  if (!C) return;

  var OPACITY_RESET = ['.nova-hero__flames', '.nova-hero__sparks', '.nova-hero__aura', '.nova-hero__paw-crystal-foot-l', '.nova-hero__paw-crystal-foot-r', '.nova-hero__paw-crystal-hand-l', '.nova-hero__paw-crystal-hand-r'];
  function waitMs(ms){ return new Promise(function (r) { setTimeout(r, ms); }); }

  function parts(svg) {
    return {
      orbits: C.q(svg, '.nova-hero__orbits'),
      orbit1: C.q(svg, '.nova-hero__orbit--1'),
      orbit2: C.q(svg, '.nova-hero__orbit--2'),
      tail: C.q(svg, '.nova-hero__tail'),
      legL: C.q(svg, '.nova-hero__leg-l'),
      legR: C.q(svg, '.nova-hero__leg-r'),
      crystalFootL: C.q(svg, '.nova-hero__paw-crystal-foot-l'),
      crystalFootR: C.q(svg, '.nova-hero__paw-crystal-foot-r'),
      crystalHandL: C.q(svg, '.nova-hero__paw-crystal-hand-l'),
      crystalHandR: C.q(svg, '.nova-hero__paw-crystal-hand-r'),
      pawFootL: C.q(svg, '.nova-hero__paw-foot-l'),
      pawFootR: C.q(svg, '.nova-hero__paw-foot-r'),
      pawHandL: C.q(svg, '.nova-hero__paw-hand-l'),
      pawHandR: C.q(svg, '.nova-hero__paw-hand-r'),
      body: C.q(svg, '.nova-hero__body'),
      head: C.q(svg, '.nova-hero__head'),
      armL: C.q(svg, '.nova-hero__arm-l'),
      armR: C.q(svg, '.nova-hero__arm-r'),
      glow: C.q(svg, '.nova-hero__core-glow'),
      flames: C.q(svg, '.nova-hero__flames'),
      flameC: C.q(svg, '.nova-hero__flame-c'),
      sparks: C.q(svg, '.nova-hero__sparks')
    };
  }

  function crystalGroups(p) {
    return [p.crystalFootL, p.crystalFootR, p.crystalHandL, p.crystalHandR].filter(Boolean);
  }

  function resetCrystalGroup(g) {
    if (!g) return;
    g.style.opacity = '0';
    g.style.transform = 'none';
    g.querySelectorAll('.nova-hero__crystal').forEach(function (c) {
      c.style.opacity = '';
      c.style.transform = '';
    });
  }

  /* Tek pati: kristal parıltı — belir, sön, tamamen kaybol */
  function popCrystalGroup(group, epic) {
    if (!group) return;
    resetCrystalGroup(group);
    var dur = epic ? 620 : 520;
    group.style.opacity = '1';
    var shards = group.querySelectorAll('.nova-hero__crystal');
    var animGroup = group.animate([
      { opacity: 0, transform: 'scale(0.45) rotate(-14deg)' },
      { opacity: 1, transform: 'scale(1.28) rotate(8deg)', offset: 0.18 },
      { opacity: 0.95, transform: 'scale(1.14) rotate(2deg)', offset: 0.42 },
      { opacity: 0, transform: 'scale(0.62) rotate(12deg)' }
    ], { duration: dur, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
    shards.forEach(function (shard, i) {
      var side = i % 2 ? 1 : -1;
      shard.animate([
        { opacity: 0, transform: 'translate(0,0) scale(0.35) rotate(' + (-22 * side) + 'deg)' },
        { opacity: 1, transform: 'translate(' + (side * 4) + 'px,-' + (5 + i * 2) + 'px) scale(1.35) rotate(' + (10 * side) + 'deg)', offset: 0.26 },
        { opacity: 0, transform: 'translate(' + (side * 7) + 'px,-' + (10 + i * 3) + 'px) scale(0.4) rotate(' + (18 * side) + 'deg)' }
      ], { duration: dur, delay: i * 38, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
    });
    animGroup.onfinish = function () { resetCrystalGroup(group); };
  }

  function stopCrystalIdle(svg) {
    if (!svg) return;
    svg.__ppCrystalOn = false;
    if (svg.__ppCrystalTimer) {
      clearTimeout(svg.__ppCrystalTimer);
      svg.__ppCrystalTimer = null;
    }
    crystalGroups(parts(svg)).forEach(resetCrystalGroup);
  }

  /* Mağaza/ana ekran: ara sıra tek patide kristal (sürekli değil) */
  function startCrystalIdle(svg) {
    if (!svg || svg.__ppCrystalOn) return;
    svg.__ppCrystalOn = true;
    function tick() {
      if (!svg.__ppCrystalOn) return;
      var p = parts(svg);
      var list = crystalGroups(p);
      if (list.length) popCrystalGroup(list[Math.floor(Math.random() * list.length)], false);
      svg.__ppCrystalTimer = setTimeout(tick, 2000 + Math.random() * 1800);
    }
    svg.__ppCrystalTimer = setTimeout(tick, 700 + Math.random() * 600);
  }

  function pawCrystalBurst(steps, p, delay, epic) {
    var list = crystalGroups(p);
    list.forEach(function (g, i) {
      if (!g) return;
      C.pushAnim(steps, g, [
        { opacity: 0, transform: 'scale(0.45) rotate(-16deg)' },
        { opacity: 1, transform: 'scale(' + (epic ? '1.32' : '1.18') + ') rotate(6deg)', offset: 0.22 },
        { opacity: 0, transform: 'scale(0.6) rotate(14deg)' }
      ], { duration: epic ? 640 : 540, delay: delay + i * 50, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', keepStyle: true });
      g.querySelectorAll('.nova-hero__crystal').forEach(function (shard, j) {
        var side = j % 2 ? 1 : -1;
        C.pushAnim(steps, shard, [
          { opacity: 0, transform: 'translate(0,0) scale(0.3)' },
          { opacity: 1, transform: 'translate(' + (side * 5) + 'px,-' + (6 + j) + 'px) scale(1.4)', offset: 0.28 },
          { opacity: 0, transform: 'translate(' + (side * 8) + 'px,-' + (12 + j * 2) + 'px) scale(0.35)' }
        ], { duration: epic ? 600 : 500, delay: delay + i * 50 + j * 35, particle: true, easing: C.EASE_OUT });
      });
    });
  }

  function orbitIdle(p) {
    if (!p.orbits) return;
    C.anim(p.orbits, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 6200, iterations: Infinity, noRest: true, easing: 'linear' });
    if (p.orbit2) C.anim(p.orbit2, [{ transform: 'none' }, { transform: 'rotate(-360deg)' }], { duration: 5100, iterations: Infinity, noRest: true, easing: 'linear' });
  }

  function playIdle(host) {
    if (!host) return;
    var svg = host.querySelector('svg');
    if (!svg || svg.__ssIdleOn) return;
    svg.__ssIdleOn = true;
    C.resetSvg(svg, OPACITY_RESET);
    var p = parts(svg);
    orbitIdle(p);
    startCrystalIdle(svg);

    if (p.tail) C.anim(p.tail, [{ transform: 'rotate(-8deg) translateX(0px)' }, { transform: 'rotate(14deg) translateX(-2px)' }, { transform: 'rotate(2deg) translateX(1px)' }, { transform: 'rotate(-8deg) translateX(0px)' }], { duration: 1800, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    if (p.body) C.anim(p.body, [{ transform: 'none' }, { transform: 'translateY(-10px) scale(1.03)' }, { transform: 'translateY(-4px) scale(1.01)' }, { transform: 'none' }], { duration: 2400, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    if (p.head) C.anim(p.head, [{ transform: 'none' }, { transform: 'translateY(-6px) rotate(-2deg)' }, { transform: 'translateY(-2px) rotate(2deg)' }, { transform: 'none' }], { duration: 1900, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    if (p.armL && p.armR) {
      C.anim(p.armL, [{ transform: 'rotate(-6deg)' }, { transform: 'rotate(-18deg)' }, { transform: 'rotate(-10deg)' }, { transform: 'rotate(-22deg)' }, { transform: 'rotate(-6deg)' }], { duration: 1600, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
      C.anim(p.armR, [{ transform: 'rotate(6deg)' }, { transform: 'rotate(18deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(22deg)' }, { transform: 'rotate(6deg)' }], { duration: 1600, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.legL && p.legR) {
      C.anim(p.legL, [{ transform: 'translateY(0px) rotate(0deg)' }, { transform: 'translateY(-2px) rotate(-2deg)' }, { transform: 'translateY(0px) rotate(0deg)' }], { duration: 1200, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
      C.anim(p.legR, [{ transform: 'translateY(0px) rotate(0deg)' }, { transform: 'translateY(-2px) rotate(2deg)' }, { transform: 'translateY(0px) rotate(0deg)' }], { duration: 1200, iterations: Infinity, noRest: true, easing: 'ease-in-out' });
    }
    if (p.glow) {
      p.glow.style.opacity = '0.22';
      C.anim(p.glow, [{ transform: 'scale(0.92)', opacity: 0.10 }, { transform: 'scale(1.22)', opacity: 0.55 }, { transform: 'scale(1.02)', opacity: 0.20 }], { duration: 2100, iterations: Infinity, noRest: true, easing: 'ease-in-out', keepStyle: true });
    }
  }

  function ignite(steps, p, delay, epic) {
    if (!p.flames) return;
    p.flames.style.opacity = '1';
    C.pushAnim(steps, p.flames, [
      { transform: 'scale(0.25)', opacity: 0 },
      { transform: 'scale(' + (epic ? '1.45' : '1.15') + ')', opacity: 1 },
      { transform: 'scale(1.05)', opacity: epic ? 0.85 : 0.65 },
      { transform: 'none', opacity: 0.16 }
    ], { duration: epic ? 1200 : 900, delay: delay, easing: 'ease-in-out' });
    if (p.flameC) {
      C.pushAnim(steps, p.flameC, [
        { transform: 'scale(0.75)' },
        { transform: 'scale(' + (epic ? '1.35' : '1.15') + ')' },
        { transform: 'scale(1.05)' },
        { transform: 'none' }
      ], { duration: epic ? 980 : 760, delay: delay + 80, easing: C.EASE_SPRING });
    }
  }

  function sparkBurst(steps, p, delay) {
    if (!p.sparks) return;
    p.sparks.style.opacity = '1';
    p.sparks.querySelectorAll('circle').forEach(function (node, i) {
      var side = i % 2 ? 1 : -1;
      C.pushAnim(steps, node, [
        { transform: 'translate(0, 0) scale(0.6)', opacity: 0 },
        { transform: 'translate(' + (side * (12 + i * 2)) + 'px, -' + (14 + i * 2) + 'px) scale(1.2)', opacity: 1 },
        { transform: 'translate(' + (side * (26 + i * 2)) + 'px, -' + (32 + i * 3) + 'px) scale(0.35)', opacity: 0 }
      ], { duration: 980, delay: delay + i * 55, particle: true, easing: C.EASE_OUT });
    });
  }

  function orbitSurge(steps, p, delay) {
    if (!p.orbits) return;
    C.pushAnim(steps, p.orbits, [
      { transform: 'rotate(0deg) scale(0.9)', opacity: 0.18 },
      { transform: 'rotate(240deg) scale(1.18)', opacity: 0.85 },
      { transform: 'rotate(520deg) scale(1.04)', opacity: 0.32 },
      { transform: 'none', opacity: 0.22 }
    ], { duration: 1200, delay: delay, easing: C.EASE_OUT });
  }

  function epic0(svg, host, steps) {
    var p = parts(svg);
    orbitSurge(steps, p, 160);
    if (p.tail) C.pushAnim(steps, p.tail, [{ transform: 'rotate(-10deg)' }, { transform: 'rotate(22deg) translateX(-2px)' }, { transform: 'rotate(-6deg)' }, { transform: 'none' }], { duration: 980, delay: 160, easing: 'ease-in-out' });
    if (p.legL && p.legR) {
      C.pushAnim(steps, p.legL, [{ transform: 'translateY(0px)' }, { transform: 'translateY(-10px) rotate(-6deg)' }, { transform: 'translateY(0px)' }], { duration: 820, delay: 220, easing: C.EASE_SPRING });
      C.pushAnim(steps, p.legR, [{ transform: 'translateY(0px)' }, { transform: 'translateY(-10px) rotate(6deg)' }, { transform: 'translateY(0px)' }], { duration: 820, delay: 220, easing: C.EASE_SPRING });
    }
    if (p.armL && p.armR) C.animArmsSymmetric(steps, p.armL, p.armR, [14, 28, 16], { duration: 1100, delay: 180, easing: 'ease-in-out' });
    pawCrystalBurst(steps, p, 300, true);
    ignite(steps, p, 340, true);
    sparkBurst(steps, p, 420);
  }
  function epic1(svg, host, steps) {
    var p = parts(svg);
    C.pushAnim(steps, host, [{ transform: 'none' }, { transform: 'translateY(-24px) scale(1.06)' }, { transform: 'translateY(-10px) scale(1.03)' }, { transform: 'none' }], { duration: 1250, delay: 140, easing: 'ease-in-out' });
    orbitSurge(steps, p, 200);
    if (p.tail) C.pushAnim(steps, p.tail, [{ transform: 'rotate(-6deg)' }, { transform: 'rotate(18deg) translateX(-2px)' }, { transform: 'rotate(0deg)' }, { transform: 'none' }], { duration: 980, delay: 200, easing: 'ease-in-out' });
    pawCrystalBurst(steps, p, 360, true);
    ignite(steps, p, 420, true);
    sparkBurst(steps, p, 520);
  }
  function epic2(svg, host, steps) {
    var p = parts(svg);
    orbitSurge(steps, p, 120);
    if (p.head) C.pushAnim(steps, p.head, [{ transform: 'none' }, { transform: 'translateY(-10px) rotate(-3deg)' }, { transform: 'translateY(-6px) rotate(3deg)' }, { transform: 'none' }], { duration: 1100, delay: 220, easing: 'ease-in-out' });
    if (p.tail) C.pushAnim(steps, p.tail, [{ transform: 'rotate(-8deg)' }, { transform: 'rotate(24deg) translateX(-2px)' }, { transform: 'rotate(-4deg)' }, { transform: 'none' }], { duration: 1020, delay: 160, easing: 'ease-in-out' });
    pawCrystalBurst(steps, p, 320, true);
    ignite(steps, p, 420, true);
    sparkBurst(steps, p, 560);
  }

  function cheer0(svg, host, steps) { var p = parts(svg); orbitSurge(steps, p, 140); pawCrystalBurst(steps, p, 200, false); }
  function cheer1(svg, host, steps) { var p = parts(svg); sparkBurst(steps, p, 240); pawCrystalBurst(steps, p, 260, false); }
  function cheer2(svg, host, steps) { var p = parts(svg); ignite(steps, p, 240, false); pawCrystalBurst(steps, p, 280, false); }

  function fire0(svg, host, steps, epic) { var p = parts(svg); orbitSurge(steps, p, 140); pawCrystalBurst(steps, p, 220, epic); ignite(steps, p, 280, epic); sparkBurst(steps, p, 340); }
  function fire1(svg, host, steps, epic) { var p = parts(svg); pawCrystalBurst(steps, p, 180, epic); ignite(steps, p, 220, epic); sparkBurst(steps, p, 320); }
  function fire2(svg, host, steps, epic) { var p = parts(svg); orbitSurge(steps, p, 180); pawCrystalBurst(steps, p, 260, epic); ignite(steps, p, 340, epic); }

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
    if (variant === 'epic') { EPIC[r](svg, host, steps); return C.runAll(steps).then(function () { return waitMs(1200); }); }
    if (variant === 'fire') { FIRE[r](svg, host, steps, false); return C.runAll(steps).then(function () { return waitMs(860); }); }
    CHEER[r](svg, host, steps); return C.runAll(steps).then(function () { return waitMs(680); });
  }

  function resetSvg(svg) {
    stopCrystalIdle(svg);
    C.resetSvg(svg, OPACITY_RESET);
    if (svg) svg.__ssIdleOn = false;
  }

  window.novaSimsekSincapPlayIdle = playIdle;
  window.novaSimsekSincapPlaySpFx = playSpFx;
  window.novaSimsekSincapResetSvg = resetSvg;
})();


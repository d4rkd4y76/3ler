/* Alev Bot — tek kişilik kutlama: 3×3 sekans, simetrik, nötr bitiş */
(function () {
  var C = window.novaHeroSpFxCore;
  if (!C) return;

  function parts(svg) {
    return {
      body: C.q(svg, '.nova-hero__body'),
      head: C.q(svg, '.nova-hero__head'),
      legs: C.q(svg, '.nova-hero__legs'),
      armL: C.q(svg, '.nova-hero__arm-l'),
      armR: C.q(svg, '.nova-hero__arm-r'),
      flames: C.q(svg, '.nova-hero__flames'),
      flameC: C.q(svg, '.nova-hero__flame-c'),
      glow: C.q(svg, '.nova-hero__core-glow'),
      core: C.q(svg, '.nova-hero__core'),
      visor: C.q(svg, '.nova-hero__visor'),
      sparks: C.q(svg, '.nova-hero__sparks'),
      chest: C.q(svg, '.nova-hero__chest-ring')
    };
  }

  function sparksBurst(steps, p, delay) {
    if (!p.sparks) return;
    p.sparks.style.opacity = '1';
    p.sparks.querySelectorAll('circle, ellipse').forEach(function (node, i) {
      var side = i % 2 ? 1 : -1;
      C.pushAnim(steps, node, [
        { transform: 'none', opacity: 0 },
        { transform: 'translate(' + (side * (10 + i * 2)) + 'px, -' + (14 + i * 3) + 'px)', opacity: 1 },
        { transform: 'translate(' + (side * (18 + i * 2)) + 'px, -' + (28 + i * 4) + 'px)', opacity: 0 }
      ], { duration: 720, delay: delay + i * 40, particle: true });
    });
  }

  function flamesUp(steps, p, delay, epic) {
    if (!p.flames) return;
    p.flames.style.opacity = '1';
    C.pushAnim(steps, p.flames, [
      { transform: 'scale(0.4)', opacity: 0 },
      { transform: 'scale(' + (epic ? '1.3' : '1.15') + ')', opacity: 1 },
      { transform: 'scale(1)', opacity: epic ? 0.9 : 0.75 }
    ], { duration: epic ? 800 : 620, delay: delay });
  }

  /* —— CHEER —— */
  function cheer0(svg, host, steps) {
    var p = parts(svg);
    C.animArmsSymmetric(steps, p.armL, p.armR, [0, 38, 22, 42, 0], { duration: 760, delay: 180 });
    C.animBodySymmetric(steps, p.body, { duration: 640, delay: 260, lift: 9 });
    C.animLegsSymmetric(steps, p.legs, { duration: 640, delay: 260, lift: 6 });
    if (p.visor) {
      C.pushAnim(steps, p.visor, [
        { filter: 'brightness(1)' },
        { filter: 'brightness(2.1)' },
        { filter: 'brightness(1)' },
        { filter: 'brightness(1.7)' },
        { filter: 'brightness(1)' }
      ], { duration: 820, delay: 200, keepStyle: true });
    }
    if (p.head) {
      C.pushAnim(steps, p.head, [
        { transform: 'none' },
        { transform: 'translateY(-5px) rotate(-3deg)' },
        { transform: 'translateY(-3px) rotate(3deg)' },
        { transform: 'none' }
      ], { duration: 700, delay: 300 });
    }
  }

  function cheer1(svg, host, steps) {
    var p = parts(svg);
    C.animArmsSymmetric(steps, p.armL, p.armR, [0, 52, 38, 55, 28, 0], { duration: 820, delay: 160, easing: C.EASE_SPRING });
    C.pushAnim(steps, p.body, [
      { transform: 'none' },
      { transform: 'scale(1.05) translateY(-10px)' },
      { transform: 'none' }
    ], { duration: 680, delay: 240, easing: C.EASE_SPRING });
    C.animLegsSymmetric(steps, p.legs, { duration: 680, delay: 240, lift: 8 });
    if (p.core) {
      C.pushAnim(steps, p.core, [
        { transform: 'none' },
        { transform: 'scale(1.35) rotate(90deg)' },
        { transform: 'none' }
      ], { duration: 700, delay: 320, easing: C.EASE_OUT });
    }
    if (p.flameC) {
      C.pushAnim(steps, p.flameC, [
        { transform: 'scaleY(0.75)' },
        { transform: 'scaleY(1.2)' },
        { transform: 'none' }
      ], { duration: 520, delay: 380 });
    }
  }

  function cheer2(svg, host, steps) {
    var p = parts(svg);
    C.pushAnim(steps, host, [
      { transform: 'none' },
      { transform: 'translateY(-6px) rotate(-2deg)' },
      { transform: 'translateY(-6px) rotate(2deg)' },
      { transform: 'translateY(-4px) rotate(-1deg)' },
      { transform: 'none' }
    ], { duration: 900, delay: 200, easing: 'ease-in-out' });
    C.animArmsSymmetric(steps, p.armL, p.armR, [0, 28, 18, 32, 0], { duration: 720, delay: 220 });
    C.animLegsSymmetric(steps, p.legs, { duration: 720, delay: 220, lift: 5 });
    if (p.chest) {
      C.pushAnim(steps, p.chest, [
        { transform: 'none' },
        { transform: 'rotate(12deg)' },
        { transform: 'rotate(-12deg)' },
        { transform: 'none' }
      ], { duration: 800, delay: 280 });
    }
    sparksBurst(steps, p, 360);
  }

  /* —— FIRE —— */
  function fire0(svg, host, steps, epic) {
    var p = parts(svg);
    flamesUp(steps, p, 100, epic);
    C.animArmsSymmetric(steps, p.armL, p.armR, [0, epic ? 58 : 48, epic ? 24 : 18, 0], { duration: 560, delay: 220, easing: C.EASE_OUT });
    C.animBodySymmetric(steps, p.body, { duration: epic ? 620 : 500, delay: 200, lift: epic ? 12 : 8 });
    C.animLegsSymmetric(steps, p.legs, { duration: 500, delay: 200, lift: 4 });
    if (p.glow) {
      p.glow.style.opacity = '1';
      C.pushAnim(steps, p.glow, [
        { transform: 'scale(0.5)', opacity: 0 },
        { transform: 'scale(1.45)', opacity: 1 },
        { transform: 'none', opacity: 0.35 }
      ], { duration: 700, delay: 160 });
    }
    sparksBurst(steps, p, 300);
  }

  function fire1(svg, host, steps, epic) {
    var p = parts(svg);
    flamesUp(steps, p, 80, epic);
    C.pushAnim(steps, host, [
      { transform: 'none' },
      { transform: 'scale(1.04) translateY(-' + (epic ? 14 : 10) + 'px)' },
      { transform: 'none' }
    ], { duration: 580, delay: 180, easing: C.EASE_SPRING });
    C.animArmsSymmetric(steps, p.armL, p.armR, [0, 35, 50, 30, 0], { duration: epic ? 780 : 640, delay: 240 });
    C.animLegsSymmetric(steps, p.legs, { duration: 520, delay: 240, lift: 6 });
    if (p.head) {
      C.pushAnim(steps, p.head, [
        { transform: 'none' },
        { transform: 'translateY(-' + (epic ? 12 : 8) + 'px)' },
        { transform: 'none' }
      ], { duration: 520, delay: 260, easing: C.EASE_SPRING });
    }
  }

  function fire2(svg, host, steps, epic) {
    var p = parts(svg);
    flamesUp(steps, p, 120, epic);
    if (p.flameC) {
      C.pushAnim(steps, p.flameC, [
        { transform: 'scaleY(0.6)' },
        { transform: 'scaleY(1.35)' },
        { transform: 'scaleY(1)' },
        { transform: 'none' }
      ], { duration: epic ? 680 : 540, delay: 200 });
    }
    C.animArmsSymmetric(steps, p.armL, p.armR, [0, 42, 0], { duration: 480, delay: 280 });
    C.pushAnim(steps, p.body, [
      { transform: 'none' },
      { transform: 'scale(1.02)' },
      { transform: 'none' }
    ], { duration: 420, delay: 300 });
    C.animLegsSymmetric(steps, p.legs, { duration: 480, delay: 280, lift: 7 });
    sparksBurst(steps, p, 340);
  }

  /* —— EPIC: koreografi (hazırlık → şarj → imza patlama → sakin iniş) —— */
  function epic0(svg, host, steps) {
    var p = parts(svg);
    /* Hazırlık: omuzlar sabit, kollar simetrik kalkar */
    C.animArmsSymmetric(steps, p.armL, p.armR, [0, 28, 46, 58, 58, 0], { duration: 980, delay: 220, easing: C.EASE_SPRING });
    C.animLegsSymmetric(steps, p.legs, { duration: 780, delay: 260, lift: 6 });
    /* Şarj: çekirdek döner + parlama büyür */
    if (p.core) {
      C.pushAnim(steps, p.core, [
        { transform: 'none' },
        { transform: 'scale(1.15) rotate(120deg)' },
        { transform: 'scale(1.35) rotate(260deg)' },
        { transform: 'scale(1.55) rotate(420deg)' },
        { transform: 'none' }
      ], { duration: 1200, delay: 320, easing: C.EASE_OUT });
    }
    if (p.glow) {
      p.glow.style.opacity = '1';
      C.pushAnim(steps, p.glow, [
        { transform: 'scale(0.35)', opacity: 0 },
        { transform: 'scale(1.25)', opacity: 0.55 },
        { transform: 'scale(1.75)', opacity: 0.95 },
        { transform: 'scale(1.35)', opacity: 0.5 },
        { transform: 'none', opacity: 0.25 }
      ], { duration: 1350, delay: 260, easing: 'ease-in-out' });
    }
    /* İmza: Alev sütunu + kıvılcım spiral */
    flamesUp(steps, p, 520, true);
    if (p.flameC) {
      C.pushAnim(steps, p.flameC, [
        { transform: 'scaleY(0.55)' },
        { transform: 'scaleY(1.55)' },
        { transform: 'scaleY(1.15)' },
        { transform: 'none' }
      ], { duration: 980, delay: 600, easing: C.EASE_SPRING });
    }
    sparksBurst(steps, p, 680);
    if (p.sparks) {
      p.sparks.querySelectorAll('circle, ellipse').forEach(function (node, i) {
        var side = i % 2 ? 1 : -1;
        C.pushAnim(steps, node, [
          { transform: 'none', opacity: 0 },
          { transform: 'translate(' + (side * (10 + i * 2)) + 'px, -' + (10 + i * 2) + 'px) rotate(' + (side * 90) + 'deg)', opacity: 1 },
          { transform: 'translate(' + (side * (24 + i * 2)) + 'px, -' + (26 + i * 3) + 'px) rotate(' + (side * 220) + 'deg)', opacity: 0 }
        ], { duration: 1100, delay: 720 + i * 55, particle: true, easing: C.EASE_OUT });
      });
    }
    /* Sakin iniş: kafa hafif onay */
    if (p.head) {
      C.pushAnim(steps, p.head, [
        { transform: 'none' },
        { transform: 'translateY(-10px) rotate(-4deg)' },
        { transform: 'translateY(-6px) rotate(3deg)' },
        { transform: 'none' }
      ], { duration: 980, delay: 680, easing: 'ease-in-out' });
    }
  }

  function epic1(svg, host, steps) {
    var p = parts(svg);
    /* “Güç kalkanı”: gövde yükselir, çekirdek şok dalgası */
    C.animBodySymmetric(steps, p.body, { duration: 980, delay: 260, lift: 14 });
    C.animLegsSymmetric(steps, p.legs, { duration: 980, delay: 260, lift: 7 });
    C.animArmsSymmetric(steps, p.armL, p.armR, [0, 22, 44, 44, 18, 0], { duration: 940, delay: 240 });
    if (p.glow) {
      p.glow.style.opacity = '1';
      C.pushAnim(steps, p.glow, [
        { transform: 'scale(0.45)', opacity: 0 },
        { transform: 'scale(1.95)', opacity: 0.95 },
        { transform: 'scale(1.1)', opacity: 0.25 },
        { transform: 'none', opacity: 0.15 }
      ], { duration: 1250, delay: 260, easing: C.EASE_OUT });
    }
    flamesUp(steps, p, 480, true);
    sparksBurst(steps, p, 650);
  }

  function epic2(svg, host, steps) {
    var p = parts(svg);
    /* “Üç vuruş”: vizör tarama + çekirdek vuruş + alev final */
    if (p.visor) {
      C.pushAnim(steps, p.visor, [
        { filter: 'brightness(1)' },
        { filter: 'brightness(2.2)' },
        { filter: 'brightness(1)' },
        { filter: 'brightness(2.4)' },
        { filter: 'brightness(1)' }
      ], { duration: 1200, delay: 260, keepStyle: true, easing: 'ease-in-out' });
    }
    if (p.core) {
      C.pushAnim(steps, p.core, [
        { transform: 'scale(1) rotate(0deg)' },
        { transform: 'scale(1.6) rotate(140deg)' },
        { transform: 'scale(1.25) rotate(260deg)' },
        { transform: 'scale(1.8) rotate(420deg)' },
        { transform: 'none' }
      ], { duration: 1400, delay: 340, easing: C.EASE_SPRING });
    }
    if (p.body) {
      C.pushAnim(steps, p.body, [
        { transform: 'none' },
        { transform: 'translateY(-10px) scale(1.04)' },
        { transform: 'translateY(-6px) scale(1.02)' },
        { transform: 'translateY(-12px) scale(1.05)' },
        { transform: 'none' }
      ], { duration: 1300, delay: 360, easing: 'ease-in-out' });
    }
    flamesUp(steps, p, 620, true);
    sparksBurst(steps, p, 760);
  }

  var CHEER = [cheer0, cheer1, cheer2];
  var FIRE = [fire0, fire1, fire2];
  var EPIC = [epic0, epic1, epic2];

  function playSpFx(host, variant, routine) {
    var svg = host && host.querySelector('svg');
    if (!svg) return Promise.resolve();
    C.resetSvg(svg, ['.nova-hero__flames', '.nova-hero__sparks']);
    var steps = [];
    C.animHostPop(steps, host, { delay: 0 });
    var r = typeof routine === 'number' ? (routine % 3) : 0;
    if (variant === 'cheer') CHEER[r](svg, host, steps);
    else if (variant === 'epic') EPIC[r](svg, host, steps);
    else FIRE[r](svg, host, steps, false);
    return C.runAll(steps);
  }

  window.novaBlazeBotPlaySpFx = playSpFx;
  window.novaBlazeBotResetSvg = function (svg) {
    C.resetSvg(svg, ['.nova-hero__flames', '.nova-hero__sparks']);
  };
})();

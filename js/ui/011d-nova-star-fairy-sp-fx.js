/* Yıldız Perisi — tek kişilik kutlama: 3×3 sekans, simetrik, nötr bitiş */
(function () {
  var C = window.novaHeroSpFxCore;
  if (!C) return;

  var OPACITY_RESET = ['.nova-hero__stars', '.nova-hero__sparks', '.nova-hero__stars-idle', '.nova-hero__aura'];

  function parts(svg) {
    return {
      wings: C.q(svg, '.nova-hero__wings'),
      wingL: C.q(svg, '.nova-hero__wing-l'),
      wingR: C.q(svg, '.nova-hero__wing-r'),
      wand: C.q(svg, '.nova-hero__wand'),
      halo: C.q(svg, '.nova-hero__halo'),
      hair: C.q(svg, '.nova-hero__hair'),
      body: C.q(svg, '.nova-hero__body'),
      legs: C.q(svg, '.nova-hero__legs'),
      dress: C.q(svg, '.nova-hero__dress-shine'),
      glow: C.q(svg, '.nova-hero__core-glow'),
      stars: C.q(svg, '.nova-hero__stars'),
      starsIdle: C.q(svg, '.nova-hero__stars-idle'),
      sparks: C.q(svg, '.nova-hero__sparks'),
      core: C.q(svg, '.nova-hero__core'),
      head: C.q(svg, '.nova-hero__head')
    };
  }

  function wingsSymmetric(steps, p, angles, opts) {
    if (!p.wingL || !p.wingR) return;
    var framesL = [{ transform: 'none' }];
    var framesR = [{ transform: 'none' }];
    angles.forEach(function (deg) {
      framesL.push({ transform: 'rotate(-' + deg + 'deg) scaleY(1.06)' });
      framesR.push({ transform: 'rotate(' + deg + 'deg) scaleY(1.06)' });
    });
    C.pushAnim(steps, p.wingL, framesL, opts);
    C.pushAnim(steps, p.wingR, framesR, opts);
  }

  function sparkOrbit(steps, p, delay, radius, epic) {
    if (!p.sparks) return;
    p.sparks.style.opacity = '1';
    p.sparks.querySelectorAll('circle').forEach(function (node, i) {
      var ang = (i / 6) * Math.PI * 2;
      var dx = Math.round(Math.cos(ang) * radius);
      var dy = Math.round(Math.sin(ang) * -radius * 0.9);
      C.pushAnim(steps, node, [
        { transform: 'none', opacity: 0 },
        { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(1.3)', opacity: 1 },
        { transform: 'translate(' + Math.round(dx * 1.3) + 'px, ' + Math.round(dy * 1.2) + 'px)', opacity: 0 }
      ], { duration: epic ? 920 : 780, delay: delay + i * 50, particle: true });
    });
  }

  function starsNova(steps, p, delay, epic) {
    if (!p.stars) return;
    p.stars.style.opacity = '1';
    C.pushAnim(steps, p.stars, [
      { transform: 'scale(0.2) rotate(-20deg)', opacity: 0 },
      { transform: 'scale(' + (epic ? '1.45' : '1.25') + ') rotate(10deg)', opacity: 1 },
      { transform: 'none', opacity: epic ? 0.85 : 0.7 }
    ], { duration: epic ? 900 : 700, delay: delay });
  }

  /* CHEER */
  function cheer0(svg, host, steps) {
    var p = parts(svg);
    wingsSymmetric(steps, p, [0, 20, 12, 24, 16, 0], { duration: 900, delay: 200 });
    if (p.halo) {
      C.pushAnim(steps, p.halo, [
        { transform: 'none', opacity: 1 },
        { transform: 'scale(1.22) rotate(180deg)', opacity: 1 },
        { transform: 'none', opacity: 1 }
      ], { duration: 950, delay: 180 });
    }
    if (p.wand) {
      C.pushAnim(steps, p.wand, [
        { transform: 'none' },
        { transform: 'rotate(-40deg) translate(-6px, -10px)' },
        { transform: 'rotate(-12deg) translate(0, -14px)' },
        { transform: 'none' }
      ], { duration: 820, delay: 280 });
    }
    C.animBodySymmetric(steps, p.body, { duration: 900, delay: 260, lift: 11 });
    C.animLegsSymmetric(steps, p.legs, { duration: 900, delay: 260, lift: 5 });
  }

  function cheer1(svg, host, steps) {
    var p = parts(svg);
    if (p.wings) {
      C.pushAnim(steps, p.wings, [
        { transform: 'none' },
        { transform: 'translateY(-16px)' },
        { transform: 'translateY(-8px)' },
        { transform: 'none' }
      ], { duration: 1000, delay: 160, easing: 'ease-in-out' });
    }
    wingsSymmetric(steps, p, [0, 16, 28, 18, 0], { duration: 780, delay: 220 });
    if (p.starsIdle) {
      p.starsIdle.style.opacity = '1';
      p.starsIdle.querySelectorAll('circle').forEach(function (c, i) {
        C.pushAnim(steps, c, [
          { transform: 'scale(0.4)', opacity: 0 },
          { transform: 'scale(1.35)', opacity: 1 },
          { transform: 'none', opacity: 0.6 }
        ], { duration: 550, delay: 350 + i * 85 });
      });
    }
    if (p.core) {
      C.pushAnim(steps, p.core, [
        { transform: 'none' },
        { transform: 'scale(1.55)' },
        { transform: 'none' }
      ], { duration: 520, delay: 400, easing: C.EASE_SPRING });
    }
    if (p.hair) {
      C.pushAnim(steps, p.hair, [
        { transform: 'none' },
        { transform: 'rotate(-6deg)' },
        { transform: 'rotate(5deg)' },
        { transform: 'none' }
      ], { duration: 880, delay: 300, easing: 'ease-in-out' });
    }
    C.animLegsSymmetric(steps, p.legs, { duration: 720, delay: 280, lift: 6 });
    sparkOrbit(steps, p, 420, 16, false);
  }

  function cheer2(svg, host, steps) {
    var p = parts(svg);
    C.pushAnim(steps, host, [
      { transform: 'none' },
      { transform: 'translateY(-8px) rotate(-2deg)' },
      { transform: 'translateY(-8px) rotate(2deg)' },
      { transform: 'none' }
    ], { duration: 920, delay: 200, easing: 'ease-in-out' });
    if (p.wand) {
      C.pushAnim(steps, p.wand, [
        { transform: 'none' },
        { transform: 'rotate(-50deg)' },
        { transform: 'rotate(15deg)' },
        { transform: 'rotate(-35deg)' },
        { transform: 'none' }
      ], { duration: 880, delay: 240 });
    }
    wingsSymmetric(steps, p, [0, 22, 0], { duration: 640, delay: 300 });
    if (p.dress) {
      C.pushAnim(steps, p.dress, [
        { opacity: 0.08 },
        { opacity: 0.5 },
        { opacity: 0.12 },
        { opacity: 0.38 },
        { opacity: 0.08 }
      ], { duration: 900, delay: 320, keepStyle: true });
    }
    C.animBodySymmetric(steps, p.body, { duration: 800, delay: 280, lift: 9 });
    C.animLegsSymmetric(steps, p.legs, { duration: 800, delay: 280, lift: 5 });
    if (p.head) {
      C.pushAnim(steps, p.head, [{ transform: 'none' }, { transform: 'translateY(-10px)' }, { transform: 'none' }], { duration: 600, delay: 380 });
    }
  }

  /* FIRE */
  function fire0(svg, host, steps, epic) {
    var p = parts(svg);
    starsNova(steps, p, 90, epic);
    wingsSymmetric(steps, p, [0, epic ? 32 : 24, epic ? 18 : 12, 0], { duration: epic ? 820 : 660, delay: 180 });
    if (p.glow) {
      p.glow.style.opacity = '1';
      C.pushAnim(steps, p.glow, [
        { transform: 'scale(0.45)', opacity: 0 },
        { transform: 'scale(1.65)', opacity: 0.95 },
        { transform: 'none', opacity: 0.4 }
      ], { duration: epic ? 1000 : 780, delay: 140 });
    }
    C.animLegsSymmetric(steps, p.legs, { duration: 560, delay: 220, lift: 5 });
    sparkOrbit(steps, p, 280, epic ? 34 : 24, epic);
  }

  function fire1(svg, host, steps, epic) {
    var p = parts(svg);
    if (p.halo) {
      C.pushAnim(steps, p.halo, [
        { transform: 'scale(0.75) rotate(0deg)' },
        { transform: 'scale(1.3) rotate(' + (epic ? '540' : '360') + 'deg)' },
        { transform: 'none', opacity: 1 }
      ], { duration: epic ? 1100 : 880, delay: 120 });
    }
    if (p.wand) {
      C.pushAnim(steps, p.wand, [
        { transform: 'none' },
        { transform: 'rotate(-52deg) scale(1.1)' },
        { transform: 'rotate(10deg)' },
        { transform: 'none' }
      ], { duration: epic ? 760 : 600, delay: 260 });
    }
    C.animBodySymmetric(steps, p.body, { duration: epic ? 700 : 580, delay: 200, lift: epic ? 14 : 10 });
    C.animLegsSymmetric(steps, p.legs, { duration: 700, delay: 200, lift: 6 });
    starsNova(steps, p, 180, epic);
    sparkOrbit(steps, p, 340, epic ? 30 : 22, epic);
  }

  function fire2(svg, host, steps, epic) {
    var p = parts(svg);
    wingsSymmetric(steps, p, [0, epic ? 36 : 28, epic ? 40 : 30, epic ? 22 : 16, 0], { duration: epic ? 900 : 720, delay: 160 });
    if (epic) {
      C.pushAnim(steps, host, [
        { transform: 'none' },
        { transform: 'translateY(-24px) scale(1.06)' },
        { transform: 'none' }
      ], { duration: 880, delay: 380, easing: C.EASE_SPRING });
      /* EPIC: “büyü çizimi” hissi — asa geniş yay, hale çift tur */
      if (p.wand) {
        C.pushAnim(steps, p.wand, [
          { transform: 'none' },
          { transform: 'rotate(-62deg) translate(-10px, -14px) scale(1.12)' },
          { transform: 'rotate(22deg) translate(4px, -18px) scale(1.06)' },
          { transform: 'rotate(-48deg) translate(-6px, -12px) scale(1.1)' },
          { transform: 'rotate(8deg) translate(0, -8px) scale(1.04)' },
          { transform: 'none' }
        ], { duration: 1450, delay: 340, easing: 'ease-in-out' });
      }
      if (p.halo) {
        C.pushAnim(steps, p.halo, [
          { transform: 'scale(0.75) rotate(0deg)', opacity: 0.6 },
          { transform: 'scale(1.35) rotate(720deg)', opacity: 1 },
          { transform: 'scale(1.05) rotate(720deg)', opacity: 1 },
          { transform: 'none', opacity: 1 }
        ], { duration: 1600, delay: 260, easing: C.EASE_OUT });
      }
    }
    if (p.core) {
      C.pushAnim(steps, p.core, [
        { transform: 'none', filter: 'brightness(1)' },
        { transform: 'scale(1.7)', filter: 'brightness(2)' },
        { transform: 'none', filter: 'brightness(1)' }
      ], { duration: 620, delay: 400, keepStyle: true });
    }
    starsNova(steps, p, 100, epic);
    C.animLegsSymmetric(steps, p.legs, { duration: 640, delay: 240, lift: 7 });
    sparkOrbit(steps, p, 300, epic ? 40 : 28, epic);
    if (p.hair) {
      C.pushAnim(steps, p.hair, [{ transform: 'none' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(7deg)' }, { transform: 'none' }], { duration: 800, delay: 320 });
    }
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

  window.novaStarFairyPlaySpFx = playSpFx;
  window.novaStarFairyResetSvg = function (svg) { C.resetSvg(svg, OPACITY_RESET); };
})();

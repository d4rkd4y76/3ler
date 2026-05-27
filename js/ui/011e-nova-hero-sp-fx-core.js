/* Tek kişilik kahraman FX — ortak motor: simetri, nötr bitiş, çeşitlilik */
(function () {
  var EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var EASE_SPRING = 'cubic-bezier(0.34, 1.35, 0.64, 1)';
  var EASE_SNAP = 'cubic-bezier(0.68, -0.25, 0.32, 1.25)';

  function q(svg, sel) {
    return svg ? svg.querySelector(sel) : null;
  }

  function cancelEl(el) {
    if (!el || !el.getAnimations) return;
    try {
      el.getAnimations().forEach(function (a) { a.cancel(); });
    } catch (_) {}
  }

  function withNeutralEnd(frames, opts) {
    opts = opts || {};
    var out = frames.slice();
    var last = out[out.length - 1] || {};
    if (opts.particle) {
      out.push({ transform: 'none', opacity: 0, offset: 1 });
    } else {
      out.push({
        transform: 'none',
        opacity: last.opacity !== undefined ? last.opacity : 1,
        offset: 1
      });
    }
    return out;
  }

  function anim(el, frames, opts) {
    if (!el || typeof el.animate !== 'function') return Promise.resolve();
    opts = opts || {};
    cancelEl(el);
    var useFrames = opts.noRest ? frames : withNeutralEnd(frames, opts);
    var animOpts = {
      duration: opts.duration || 600,
      delay: opts.delay || 0,
      easing: opts.easing || EASE_OUT,
      fill: 'forwards'
    };
    if (opts.iterations) animOpts.iterations = opts.iterations;
    try {
      var a = el.animate(useFrames, animOpts);
      return a.finished.then(function () {
        if (opts.particle) {
          el.style.transform = '';
          el.style.opacity = '';
        } else if (!opts.keepStyle) {
          el.style.transform = '';
        }
      }).catch(function () {
        el.style.transform = '';
      });
    } catch (_) {
      el.style.transform = '';
      return Promise.resolve();
    }
  }

  function pushAnim(steps, el, frames, opts) {
    steps.push(anim(el, frames, opts));
  }

  function animArmsSymmetric(steps, armL, armR, angleKeyframes, opts) {
    if (!armL || !armR) return;
    opts = opts || {};
    var framesL = [{ transform: 'none' }];
    var framesR = [{ transform: 'none' }];
    angleKeyframes.forEach(function (deg) {
      framesL.push({ transform: 'rotate(-' + deg + 'deg)' });
      framesR.push({ transform: 'rotate(' + deg + 'deg)' });
    });
    pushAnim(steps, armL, framesL, opts);
    pushAnim(steps, armR, framesR, opts);
  }

  function animLegsSymmetric(steps, legs, opts) {
    if (!legs) return;
    opts = opts || {};
    var lift = opts.lift || 5;
    pushAnim(steps, legs, [
      { transform: 'none' },
      { transform: 'translateY(-' + lift + 'px)' },
      { transform: 'none' }
    ], opts);
  }

  function animBodySymmetric(steps, body, opts) {
    if (!body) return;
    opts = opts || {};
    var lift = opts.lift || 8;
    pushAnim(steps, body, [
      { transform: 'none' },
      { transform: 'translateY(-' + lift + 'px) scale(1.03)' },
      { transform: 'translateY(-' + Math.round(lift * 0.4) + 'px) scale(1.01)' },
      { transform: 'none' }
    ], opts);
  }

  function animHostPop(steps, host, opts) {
    opts = opts || {};
    pushAnim(steps, host, [
      { transform: 'scale(0.68) translateY(28px)', opacity: 0 },
      { transform: 'scale(1.06) translateY(-8px)', opacity: 1 },
      { transform: 'none', opacity: 1 }
    ], Object.assign({ duration: 480, easing: EASE_SPRING }, opts));
  }

  function resetSvg(svg, opacitySelectors) {
    if (!svg) return;
    try {
      cancelEl(svg);
      svg.querySelectorAll('*').forEach(function (el) {
        cancelEl(el);
      });
    } catch (_) {}
    svg.querySelectorAll('[style]').forEach(function (el) {
      var st = el.getAttribute('style') || '';
      if (st.indexOf('transform') >= 0) el.style.transform = '';
      if (st.indexOf('opacity') >= 0) el.style.opacity = '';
      if (st.indexOf('filter') >= 0) el.style.filter = '';
    });
    (opacitySelectors || []).forEach(function (sel) {
      var g = svg.querySelector(sel);
      if (g) g.style.opacity = '';
    });
  }

  function pickRoutine(variant, seed) {
    seed = seed || 0;
    var salt = variant === 'epic' ? 2 : (variant === 'fire' ? 1 : 0);
    return (seed + salt) % 3;
  }

  function runAll(steps) {
    return Promise.all(steps).catch(function () {});
  }

  window.novaHeroSpFxCore = {
    EASE_OUT: EASE_OUT,
    EASE_SPRING: EASE_SPRING,
    EASE_SNAP: EASE_SNAP,
    q: q,
    anim: anim,
    pushAnim: pushAnim,
    animArmsSymmetric: animArmsSymmetric,
    animLegsSymmetric: animLegsSymmetric,
    animBodySymmetric: animBodySymmetric,
    animHostPop: animHostPop,
    resetSvg: resetSvg,
    pickRoutine: pickRoutine,
    runAll: runAll
  };
})();

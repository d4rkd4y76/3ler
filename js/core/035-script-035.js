// === NOVA VS HUD — düello kazanma çubukları ===
(function () {
  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function setBar(el, pct, boost, hit) {
    if (!el) return;
    el.style.width = clamp(pct, 4, 96) + '%';
    const wrap = el.closest('.nova-hp');
    if (!wrap) return;
    wrap.classList.remove('nova-boost', 'nova-hit');
    if (boost) wrap.classList.add('nova-boost');
    if (hit) wrap.classList.add('nova-hit');
    if (boost || hit) {
      setTimeout(function () {
        wrap.classList.remove('nova-boost', 'nova-hit');
      }, 750);
    }
  }

  window.__duelInvPower = 50;
  window.__duelInPower = 50;

  window.novaInitDuelHud = function (data) {
    try {
      window.__duelInvPower = 50;
      window.__duelInPower = 50;
      const hud = document.getElementById('nova-vs-hud');
      if (!hud) return;
      setNameWithFrame(
        document.getElementById('novaLeftName'),
        data && data.inviter && data.inviter.name ? data.inviter.name : 'Oyuncu 1',
        data && data.inviter && data.inviter.nameFrame ? data.inviter.nameFrame : 'default'
      );
      setNameWithFrame(
        document.getElementById('novaRightName'),
        data && data.invited && data.invited.name ? data.invited.name : 'Oyuncu 2',
        data && data.invited && data.invited.nameFrame ? data.invited.nameFrame : 'default'
      );
      setBar(document.getElementById('novaLeftHP'), 50, false, false);
      setBar(document.getElementById('novaRightHP'), 50, false, false);
      const lc = document.getElementById('novaLeftCount');
      const rc = document.getElementById('novaRightCount');
      if (lc) lc.textContent = '0';
      if (rc) rc.textContent = '0';
    } catch (e) {
      console.warn('HUD init error', e);
    }
  };

  window.novaApplyDuelPowerFromRound = function (invResp, inResp) {
    const gain = 11;
    const loss = 13;
    if (invResp) {
      window.__duelInvPower = clamp(
        window.__duelInvPower + (invResp.correct ? gain : -loss),
        6,
        94
      );
    }
    if (inResp) {
      window.__duelInPower = clamp(
        window.__duelInPower + (inResp.correct ? gain : -loss),
        6,
        94
      );
    }
  };

  window.novaUpdateDuelHud = function (
    leftScore,
    rightScore,
    leftOld,
    rightOld,
    invResp,
    inResp
  ) {
    try {
      const left = document.getElementById('novaLeftHP');
      const right = document.getElementById('novaRightHP');
      if (!left || !right) return;

      const lc = document.getElementById('novaLeftCount');
      const rc = document.getElementById('novaRightCount');
      if (lc) lc.textContent = String(leftScore || 0);
      if (rc) rc.textContent = String(rightScore || 0);

      const invBoost = invResp && invResp.correct === true;
      const invHit = invResp && invResp.correct === false;
      const inBoost = inResp && inResp.correct === true;
      const inHit = inResp && inResp.correct === false;

      setBar(left, window.__duelInvPower, invBoost, invHit);
      setBar(right, window.__duelInPower, inBoost, inHit);
    } catch (e) {
      console.warn('HUD update error', e);
    }
  };
})();

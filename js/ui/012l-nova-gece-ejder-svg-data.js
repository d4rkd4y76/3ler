/* Gece Ejderi — tek kişilik arena SVG + basit idle/FX */
(function () {
  'use strict';

  window.NOVA_GECE_EJDER_SVG_TEMPLATE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="Gece Ejderi">' +
    '<defs>' +
    '<linearGradient id="geBody__UID__" x1="0%" y1="0%" x2="0%" y2="100%">' +
    '<stop offset="0%" stop-color="#4c1d95"/><stop offset="55%" stop-color="#312e81"/><stop offset="100%" stop-color="#1e1b4b"/>' +
    '</linearGradient>' +
    '<linearGradient id="geWing__UID__" x1="0%" y1="0%" x2="100%" y2="100%">' +
    '<stop offset="0%" stop-color="#7c3aed" stop-opacity=".85"/><stop offset="100%" stop-color="#312e81" stop-opacity=".75"/>' +
    '</linearGradient>' +
    '<radialGradient id="geGlow__UID__" cx="50%" cy="50%" r="50%">' +
    '<stop offset="0%" stop-color="#a78bfa" stop-opacity=".75"/><stop offset="100%" stop-color="#6d28d9" stop-opacity="0"/>' +
    '</radialGradient>' +
    '</defs>' +
    '<g class="nova-hero-gece-stack">' +
    '<ellipse class="nova-hero__core-glow" cx="120" cy="150" rx="58" ry="28" fill="url(#geGlow__UID__)" opacity=".55"/>' +
    '<g class="nova-hero__wings-upper">' +
    '<path class="nova-hero__wing-up-l" d="M92 138 C72 118 52 92 38 62 C28 42 30 28 44 22 C58 18 72 34 82 58 C88 78 90 108 92 132 Z" fill="url(#geWing__UID__)"/>' +
    '<path class="nova-hero__wing-up-r" d="M148 138 C168 118 188 92 202 62 C212 42 210 28 196 22 C182 18 168 34 158 58 C152 78 150 108 148 132 Z" fill="url(#geWing__UID__)"/>' +
    '</g>' +
    '<ellipse class="nova-hero__body" cx="120" cy="152" rx="42" ry="36" fill="url(#geBody__UID__)"/>' +
    '<circle class="nova-hero__head" cx="120" cy="108" r="28" fill="url(#geBody__UID__)"/>' +
    '<circle class="nova-hero__eye-l" cx="110" cy="104" r="4.5" fill="#67e8f9"/>' +
    '<circle class="nova-hero__eye-r" cx="130" cy="104" r="4.5" fill="#67e8f9"/>' +
    '<circle class="nova-hero__chest-gem" cx="120" cy="148" r="7" fill="#c4b5fd" opacity=".9"/>' +
    '<path class="nova-hero__tail" d="M148 168 C168 176 184 188 192 204 C196 214 188 220 176 212 C162 202 152 186 146 172 Z" fill="#5b21b6" opacity=".85"/>' +
    '</g></svg>';

  function waitMs(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function q(host, sel) {
    return host ? host.querySelector(sel) : null;
  }

  function playIdle(host) {
    var svg = host && host.querySelector('svg');
    if (!svg) return;
    var wings = q(svg, '.nova-hero__wings-upper');
    if (wings) {
      wings.style.transformOrigin = '120px 130px';
      wings.style.animation = 'novaGeceWingIdle 2.8s ease-in-out infinite';
    }
  }

  function resetHost(host) {
    if (typeof window.novaGeceEjderTrueUnmount === 'function') {
      window.novaGeceEjderTrueUnmount(host);
    }
    if (!host) return;
    var svg = host.querySelector('svg');
    if (!svg) return;
    svg.querySelectorAll('[style]').forEach(function (el) { el.removeAttribute('style'); });
  }

  function playSpFx(host, variant, routine) {
    if (typeof window.novaGeceEjderPlayTrueClip === 'function' && window.novaGeceEjderHasTrueClips && window.novaGeceEjderHasTrueClips()) {
      if (typeof window.novaGeceEjderEnsureTrueClipsReady === 'function') {
        window.novaGeceEjderEnsureTrueClipsReady();
      }
      if (typeof window.novaGeceEjderPickTrueClipRoutine === 'function') {
        routine = window.novaGeceEjderPickTrueClipRoutine();
      }
      return window.novaGeceEjderPlayTrueClip(host, routine);
    }
    var svg = host && host.querySelector('svg');
    if (svg) {
      var gem = q(svg, '.nova-hero__chest-gem');
      if (gem) gem.style.filter = 'brightness(1.6)';
      var glow = q(svg, '.nova-hero__core-glow');
      if (glow) glow.style.opacity = '0.9';
    }
    var ms = variant === 'epic' ? 1100 : (variant === 'fire' ? 950 : 850);
    return waitMs(ms).then(function () { resetHost(host); });
  }

  window.novaGeceEjderPlayIdle = playIdle;
  window.novaGeceEjderResetHost = resetHost;
  window.novaGeceEjderPlaySpFx = playSpFx;
})();

// Ceza sistemi KALDIRILDI: Nova


// --- Nova: League system (Mobile Legends tarzı rozet, yıldız yok) ---
// Kupa: 1→0-149 Hızlı | 2→150-499 Cesur | 3→500-1199 Güçlü | 4→1200-2499 Kahraman | 5→2500+ Efsane

function getLeagueFromCups(cups) {
  var c = Number(cups);
  if (!isFinite(c) || c < 0) c = 0;
  if (c <= 149) return 1;
  if (c <= 499) return 2;
  if (c <= 1199) return 3;
  if (c <= 2499) return 4;
  return 5;
}

function getLeagueShortName(league) {
  switch (league) {
    case 1: return 'Hızlı';
    case 2: return 'Cesur';
    case 3: return 'Güçlü';
    case 4: return 'Kahraman';
    case 5: return 'Efsane';
    default: return 'Lig';
  }
}

function getLeagueFullName(league) {
  switch (league) {
    case 1: return 'Hızlı Lig';
    case 2: return 'Cesur Lig';
    case 3: return 'Güçlü Lig';
    case 4: return 'Kahraman Lig';
    case 5: return 'Efsane Lig';
    default: return 'Lig';
  }
}

function getStars() {
  return '';
}

function getLeagueEmblemSvg(league) {
  var uid = 'nl' + league + '_' + Math.random().toString(36).slice(2, 8);
  var palettes = {
    1: { a: '#8b5a2b', b: '#d4a574', c: '#5c3d1e', glow: '#fbbf24', gem: '#fde68a' },
    2: { a: '#475569', b: '#94a3b8', c: '#1e293b', glow: '#38bdf8', gem: '#7dd3fc' },
    3: { a: '#92400e', b: '#fbbf24', c: '#78350f', glow: '#f59e0b', gem: '#fef08a' },
    4: { a: '#5b21b6', b: '#fbbf24', c: '#4c1d95', glow: '#a78bfa', gem: '#c4b5fd' },
    5: { a: '#581c87', b: '#f472b6', c: '#3b0764', glow: '#e879f9', gem: '#f5d0fe' }
  };
  var p = palettes[league] || palettes[1];
  var wings = league >= 4
    ? '<path d="M8 34 L1.5 20.5 L12 26 Z" fill="url(#' + uid + 'wg)" opacity="' + (league === 5 ? '1' : '.9') + '"/><path d="M56 34 L62.5 20.5 L52 26 Z" fill="url(#' + uid + 'wg)" opacity="' + (league === 5 ? '1' : '.9') + '"/>'
    : '';
  var crown = league >= 4
    ? '<path d="M22 12 L27.5 18 L32 11.5 L36.5 18 L42 12" fill="none" stroke="' + p.gem + '" stroke-width="' + (league === 5 ? '1.8' : '1.5') + '" stroke-linecap="round"/>'
    : '';
  var icons = {
    1: '<ellipse cx="32" cy="30" rx="9" ry="7" fill="' + p.c + '"/><circle cx="32" cy="22" r="6" fill="' + p.c + '"/><path d="M26 20 Q32 14 38 20" fill="none" stroke="' + p.gem + '" stroke-width="1.2"/>',
    2: '<circle cx="32" cy="24" r="9" fill="' + p.c + '"/><path d="M24 24 Q32 14 40 24" fill="' + p.b + '"/><circle cx="28" cy="23" r="1.6" fill="' + p.glow + '"/><circle cx="36" cy="23" r="1.6" fill="' + p.glow + '"/>',
    3: '<path d="M24 34 L32 18 L40 34 Z" fill="' + p.c + '"/><rect x="29" y="28" width="6" height="8" rx="1" fill="' + p.b + '"/>',
    4: '<circle cx="32" cy="24" r="10" fill="' + p.c + '"/><path d="M22 26 Q32 12 42 26" fill="' + p.b + '"/><circle cx="32" cy="22" r="2.5" fill="' + p.gem + '"/>',
    5: '<path d="M18 30 Q32 9.5 46 30 Q38 37 32 33 Q26 37 18 30 Z" fill="' + p.c + '"/>' +
       '<path d="M20 30 Q32 13 44 30" fill="none" stroke="' + p.b + '" stroke-width="1.3" opacity=".55"/>' +
       '<path d="M24 22 L28 15.5 L32 22 L36 15.5 L40 22" fill="none" stroke="' + p.gem + '" stroke-width="1.8" stroke-linecap="round"/>' +
       '<circle cx="28" cy="24" r="1.9" fill="' + p.glow + '"/><circle cx="36" cy="24" r="1.9" fill="' + p.glow + '"/>' +
       '<path d="M32 26 L34 30 L32 33 L30 30 Z" fill="' + p.gem + '" opacity=".95"/>'
  };

  return (
    '<svg class="nova-lig__svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs>' +
    '<linearGradient id="' + uid + 'm" x1="0%" y1="0%" x2="100%" y2="100%">' +
    '<stop offset="0%" stop-color="' + p.b + '"/><stop offset="45%" stop-color="' + p.a + '"/><stop offset="100%" stop-color="' + p.c + '"/>' +
    '</linearGradient>' +
    '<linearGradient id="' + uid + 'wg" x1="0%" y1="0%" x2="100%" y2="100%">' +
    '<stop offset="0%" stop-color="' + p.b + '"/><stop offset="100%" stop-color="' + p.a + '"/>' +
    '</linearGradient>' +
    '<radialGradient id="' + uid + 'g" cx="50%" cy="35%" r="55%">' +
    '<stop offset="0%" stop-color="' + p.glow + '" stop-opacity=".55"/><stop offset="100%" stop-color="' + p.glow + '" stop-opacity="0"/>' +
    '</radialGradient>' +
    '</defs>' +
    wings +
    '<path d="M32 4 L52 14 L48 50 Q32 58 16 50 L12 14 Z" fill="url(#' + uid + 'm)" stroke="' + p.gem + '" stroke-width="' + (league === 5 ? '2' : '1.5') + '"/>' +
    (league === 5 ? '<path d="M32 6 L50 15 L46.5 49 Q32 56 17.5 49 L14 15 Z" fill="none" stroke="' + p.glow + '" stroke-width="1.2" opacity=".55"/>' : '') +
    '<ellipse cx="32" cy="28" rx="18" ry="14" fill="url(#' + uid + 'g)"/>' +
    icons[league] +
    crown +
    '<circle cx="20" cy="42" r="' + (league === 5 ? '3.2' : '3') + '" fill="' + p.gem + '" opacity=".9"/>' +
    '<circle cx="44" cy="42" r="' + (league === 5 ? '3.2' : '3') + '" fill="' + p.gem + '" opacity=".9"/>' +
    (league === 5 ? '<circle cx="12" cy="18" r="1.6" fill="' + p.gem + '" opacity=".65"/><circle cx="52" cy="18" r="1.6" fill="' + p.gem + '" opacity=".65"/><circle cx="32" cy="10" r="1.4" fill="' + p.gem + '" opacity=".75"/>' : '') +
    '</svg>'
  );
}

function getRankHTML(count, compact) {
  var league = getLeagueFromCups(Number(count) || 0);
  var short = getLeagueShortName(league);
  var cls = 'nova-lig nova-lig--' + league + (compact ? ' nova-lig--compact' : '');
  return (
    '<span class="' + cls + '" title="' + getLeagueFullName(league) + '">' +
    '<span class="nova-lig__halo" aria-hidden="true"></span>' +
    '<span class="nova-lig__frame" aria-hidden="true">' +
    getLeagueEmblemSvg(league) +
    '<span class="nova-lig__shine" aria-hidden="true"></span>' +
    '</span>' +
    '<span class="nova-lig__ribbon"><span class="nova-lig__name">' + short + '</span></span>' +
    '</span>'
  );
}

window.getLeagueFromCups = getLeagueFromCups;
window.getLeagueName = getLeagueFullName;
window.getLeagueShortName = getLeagueShortName;
window.getRankHTML = getRankHTML;

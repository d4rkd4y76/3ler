(function(){
  const FILLBLANK_TEST_UNLIMITED = false; // Canli mod: gunluk tek hak aktif
  try {
    // Scope arena visuals only to the duel game container
    const duel = document.querySelector('.duel-game-container');
    if (duel) {
      duel.classList.add('nova-duel-arena');
      // Remove any existing decorative "orb/planet" elements that might sit above content
      document.querySelectorAll('.nova-orbs, .nova-orb, .nova-force-behind, [class*="orb" i], [class*="planet" i], [class*="gezegen" i]').forEach(el => {
        try { if (duel.contains(el)) el.remove(); } catch(_) {}
      });
      // Also defensively move any stray orb layers behind and hide them
      const stray = document.querySelectorAll('.nova-orbs, .nova-orb, .nova-force-behind');
      stray.forEach(el => { 
        try { el.style.zIndex = '0'; el.style.display = 'none'; el.style.opacity = '0'; } catch(_){}
      });
    }
  } catch(e) { /* no-op */ }
})();

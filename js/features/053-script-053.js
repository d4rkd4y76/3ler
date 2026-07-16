// === NOVA: Diamond reward SFX (shared by bonus games / egg / hero) ===
window.novaPlayDiamondRewardSfx = window.novaPlayDiamondRewardSfx || function () {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = window.__novaRewardAudioCtx || new AC();
    window.__novaRewardAudioCtx = ctx;
    if (ctx.state === 'suspended') ctx.resume().catch(function () {});
    const now = ctx.currentTime + 0.01;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.22, now + 0.03);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    master.connect(ctx.destination);
    const notes = [880, 1174.66, 1567.98, 2093];
    notes.forEach(function (hz, i) {
      const t = now + i * 0.085;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.setValueAtTime(hz, t);
      o.frequency.exponentialRampToValueAtTime(hz * 1.04, t + 0.16);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 0.24);
    });
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(2637, now + 0.25);
    shimmer.frequency.exponentialRampToValueAtTime(2349, now + 0.9);
    shimmerGain.gain.setValueAtTime(0.0001, now + 0.24);
    shimmerGain.gain.exponentialRampToValueAtTime(0.06, now + 0.32);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(master);
    shimmer.start(now + 0.24);
    shimmer.stop(now + 1.02);
  } catch (_) {}
};

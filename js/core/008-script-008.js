// --- Otomatik düello eşleştirme (atomik havuz; çift eşleşme yok) ---
function novaAutoMatchUiReset() {
   const t = document.getElementById('autoMatchTitle');
   const s = document.getElementById('autoMatchSubtext');
   const ov = document.getElementById('autoMatchFoundOverlay');
   const cnt = document.getElementById('autoMatchFoundCount');
   if (t) t.textContent = 'Müsait Oyuncu Aranıyor';
   if (s) s.textContent = 'Sistem, şu an düello arayan oyuncular arasından sana uygun bir rakip seçecek.';
   if (ov) ov.hidden = true;
   if (cnt) cnt.textContent = '3';
}

async function novaResolveDuelSyncEnterAt(duelKey, duelData) {
   let target = Number(duelData && duelData.syncEnterAt) || 0;
   if (!target && window.database && duelKey) {
      try {
         const s = await window.database.ref('duels/' + duelKey + '/syncEnterAt').once('value');
         if (s.exists()) target = Number(s.val()) || 0;
      } catch (_) {}
   }
   if (!target) {
      const createdAt = Number(duelData && duelData.createdAt) || Date.now();
      target = createdAt + 3500;
   }
   return target;
}

async function novaShowFoundBannerThenContinue(duelData, duelKey) {
   const target = await novaResolveDuelSyncEnterAt(duelKey, duelData);
   const mm = document.getElementById('matchmakingScreen');
   const showBanner = mm && getComputedStyle(mm).display !== 'none';
   const ov = document.getElementById('autoMatchFoundOverlay');
   const cnt = document.getElementById('autoMatchFoundCount');
   if (showBanner && ov) ov.hidden = false;
   const serverNow = (typeof window.novaGetServerTimeMs === 'function')
      ? await window.novaGetServerTimeMs()
      : Date.now();
   let remain = Math.ceil(Math.max(0, target - serverNow) / 1000);
   if (remain < 1) remain = 1;
   while (remain > 0) {
      if (showBanner && cnt) cnt.textContent = String(remain);
      await new Promise((r) => setTimeout(r, 1000));
      remain--;
   }
   if (showBanner && ov) ov.hidden = true;
   if (typeof window.novaWaitUntilMs === 'function') {
      await window.novaWaitUntilMs(target);
   } else {
      const wait = Math.max(0, target - Date.now());
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
   }
}

window.novaNudgeInviterStartDuel = async function novaNudgeInviterStartDuel() {
   try {
      if (window.selectedStudent && window.database && window.currentDuelRef) {
         try {
            const snap = await window.currentDuelRef.once('value');
            if (snap.exists()) {
               const d = snap.val() || {};
               const myId = String(window.selectedStudent.studentId);
               if (d.inviter && String(d.inviter.studentId) !== myId) return;
            }
         } catch (_) {}
      } else if (typeof isInviter !== 'undefined' && !isInviter) {
         return;
      }
      if (typeof window.novaEpicInviterCommitStart === 'function') {
         const ok = await window.novaEpicInviterCommitStart();
         if (ok) return;
      }
      var cls = document.getElementById('duel-class-select');
      for (var i = 0; i < 60; i++) {
         if (cls && !cls.value && window.selectedStudent && window.selectedStudent.classId) {
            cls.value = String(window.selectedStudent.classId);
         }
         if (typeof autoSelectDuelSelections === 'function' && cls && cls.value && !window.__novaAutoDuelSelecting) {
            autoSelectDuelSelections();
         }
         var btn = document.getElementById('duel-start-button');
         if (btn && btn.classList.contains('active') && !btn.disabled) {
            btn.click();
            return;
         }
         await new Promise(function (r) { setTimeout(r, 300); });
      }
   } catch (e) {
      console.warn('novaNudgeInviterStartDuel', e);
   }
};

async function novaEnterDuelWithSyncDelay(duelKey, duelData) {
   window.__novaPendingEnterDuel = window.__novaPendingEnterDuel || {};
   if (window.__novaPendingEnterDuel[duelKey]) return;
   window.__novaPendingEnterDuel[duelKey] = true;
   try {
      window.__novaEpicDuelFlow = true;
      window.__novaAutoMatchFlow = true;
      window.__novaSkipDuelIntro039 = true;
      try { if (typeof hideWaitOverlay === 'function') hideWaitOverlay(); } catch (_) {}

      if (typeof window.novaEpicShowMatchFoundSync === 'function') {
         await window.novaEpicShowMatchFoundSync(duelKey, duelData);
      } else {
         await novaShowFoundBannerThenContinue(duelData, duelKey);
      }

      switchToDuelScreen(duelKey);

      if (typeof window.novaEpicRunPrepCountdown === 'function') {
         await window.novaEpicRunPrepCountdown(duelKey, duelData);
      }

      if (typeof window.novaDuelPrepFinishAndLaunch === 'function') {
         await window.novaDuelPrepFinishAndLaunch(duelKey);
      } else {
         await window.novaNudgeInviterStartDuel();
      }
   } finally {
      try { delete window.__novaPendingEnterDuel[duelKey]; } catch (_) {}
   }
}

function stopAutoMatchCoordinator() {
   try {
      if (window.__autoMatchCoordRef && window.__autoMatchCoordHandler) {
         window.__autoMatchCoordRef.off('value', window.__autoMatchCoordHandler);
      }
   } catch (_) {}
   window.__autoMatchCoordRef = null;
   window.__autoMatchCoordHandler = null;
   if (window.__autoMatchEnqueueInterval) {
      clearInterval(window.__autoMatchEnqueueInterval);
      window.__autoMatchEnqueueInterval = null;
   }
}

if (!window.__novaMatchVisibilityBound) {
   document.addEventListener('visibilitychange', function () {
      try {
         if (document.hidden) {
            stopAutoMatchCoordinator();
            return;
         }
         var mm = document.getElementById('matchmakingScreen');
         if (mm && mm.style.display === 'flex' && typeof startAutoMatchCoordinator === 'function') {
            startAutoMatchCoordinator();
         }
      } catch (_) {}
   });
   window.__novaMatchVisibilityBound = true;
}

function buildAutoMatchPoolPayload() {
   return {
      sid: selectedStudent.studentId,
      classId: selectedStudent.classId,
      name: selectedStudent.studentName,
      nameFrame: selectedStudent.nameFrame || 'default',
      photo:
         studentPhoto && studentPhoto.src && !String(studentPhoto.src).includes('via.placeholder')
            ? studentPhoto.src
            : '',
      ts: Date.now()
   };
}

async function removeSelfFromAutoMatchPool() {
   const cid = selectedStudent && selectedStudent.classId;
   const sid = selectedStudent && selectedStudent.studentId;
   if (!cid || !sid) return;
   try {
      await database.ref(`autoMatchCoordinator/${cid}`).transaction((c) => {
         c = c || { pool: {}, match: null };
         const pool = { ...(c.pool || {}) };
         delete pool[sid];
         return { pool, match: c.match || null };
      });
   } catch (_) {}
}

async function clearAutoMatchCoordinatorMatch(matchId, classId) {
   if (!matchId || !classId) return;
   try {
      await database.ref(`autoMatchCoordinator/${classId}`).transaction((c) => {
         if (c && c.match && c.match.id === matchId) {
            return { pool: c.pool || {}, match: null };
         }
         return c;
      });
   } catch (e) {
      console.warn('autoMatch clear match', e);
   }
}

async function checkDuelEligibility(studentId, classId, preloaded){
  try{
    if (preloaded && typeof preloaded === 'object') {
      const cup = Number(preloaded.cup || 0);
      const credits = Number(preloaded.credits || 0);
      return { eligible: cup >= 3 && credits >= 15, cup, credits };
    }
    const [cupSnap, creditsSnap] = await Promise.all([
      database.ref(`classes/${classId}/students/${studentId}/gameCup`).once('value'),
      database.ref(`classes/${classId}/students/${studentId}/duelCredits`).once('value')
    ]);
    const cup = cupSnap.exists() ? Number(cupSnap.val() || 0) : 0;
    const credits = creditsSnap.exists() ? Number(creditsSnap.val() || 0) : 0;
    return { eligible: cup >= 3 && credits >= 15, cup, credits };
  }catch(e){
    console.warn('duel eligibility check failed:', e);
    return { eligible: false, cup: 0, credits: 0 };
  }
}

async function refreshDuelEntryGateNote(){
  try{
    if (!selectedStudent || !selectedStudent.studentId || !selectedStudent.classId) return;
    const note = document.getElementById('duel-entry-gate-note');
    const btn = document.getElementById('findDuelButton');
    if (!note || !btn) return;
    const gate = await checkDuelEligibility(selectedStudent.studentId, selectedStudent.classId);
    const cup = Number(gate.cup || 0);
    const credits = Number(gate.credits || 0);
    const sig = `${gate.eligible ? 1 : 0}:${cup}:${credits}`;
    if (window.__duelGateNoteSig === sig) return;
    window.__duelGateNoteSig = sig;
    if (gate.eligible){
      note.classList.remove('locked');
      note.classList.remove('ready');
      note.textContent = '';
      note.style.display = 'none';
      btn.classList.remove('locked');
      btn.disabled = false;
    } else {
      note.classList.remove('ready');
      note.classList.add('locked');
      note.style.display = '';
      const missCup = Math.max(0, 3 - cup);
      const missCredits = Math.max(0, 15 - credits);
      const parts = [];
      if (missCup > 0) parts.push(`${missCup} kupa`);
      if (missCredits > 0) parts.push(`${missCredits} düello kredisi`);
      note.textContent = `Düelloya katılman için ${parts.join(', ')} daha lazım.`;
      btn.classList.add('locked');
      btn.disabled = true;
    }
  }catch(_){}
}

async function novaHasActiveDuelRecord(studentId) {
   const sid = String(studentId || '').trim();
   if (!sid) return false;
   try {
      const [asInviter, asInvited] = await Promise.all([
         database.ref('duels').orderByChild('inviter/studentId').equalTo(sid).once('value'),
         database.ref('duels').orderByChild('invited/studentId').equalTo(sid).once('value')
      ]);
      const refs = [];
      if (asInviter.exists()) {
         asInviter.forEach((ch) => refs.push(ch.ref));
      }
      if (asInvited.exists()) {
         asInvited.forEach((ch) => refs.push(ch.ref));
      }
      if (!refs.length) return false;

      const seen = new Set();
      for (const duelRef of refs) {
         if (!duelRef || !duelRef.key || seen.has(duelRef.key)) continue;
         seen.add(duelRef.key);
         let duelData = null;
         try {
            const ds = await duelRef.once('value');
            if (!ds.exists()) continue;
            duelData = ds.val() || {};
         } catch (_) {
            continue;
         }
         const inviter = duelData.inviter || {};
         const invited = duelData.invited || {};
         const inviterSid = String(inviter.studentId || '').trim();
         const invitedSid = String(invited.studentId || '').trim();
         const inviterCid = String(inviter.classId || '').trim();
         const invitedCid = String(invited.classId || '').trim();

         // Bozuk düello kaydı: güvenle sil.
         if (!inviterSid || !invitedSid || !inviterCid || !invitedCid) {
            try { await duelRef.remove(); } catch (_) {}
            continue;
         }

         const isVeryOld = (() => {
            const t = Number(duelData.createdAt || 0);
            if (!Number.isFinite(t) || t <= 0) return false;
            return (Date.now() - t) > (2 * 60 * 60 * 1000);
         })();

         let invInDuel = false;
         let inInDuel = false;
         try {
            const [a, b] = await Promise.all([
               database.ref(`classes/${inviterCid}/students/${inviterSid}/inDuel`).once('value'),
               database.ref(`classes/${invitedCid}/students/${invitedSid}/inDuel`).once('value')
            ]);
            invInDuel = a.exists() ? !!a.val() : false;
            inInDuel = b.exists() ? !!b.val() : false;
         } catch (_) {}

         // Her iki taraf da düelloda değilse bu kayıt stale kabul edilir.
         // Ayrıca çok eskiyse (2 saat+) ve aktif değilse temizlenir.
         if ((!invInDuel && !inInDuel) || (isVeryOld && !invInDuel && !inInDuel)) {
            try { await duelRef.remove(); } catch (_) {}
            continue;
         }

         return true;
      }
      return false;
   } catch (e) {
      console.warn('active duel verify fail:', e);
      return false;
   }
}

function tryAutoMatchEnqueueTx() {
   const classId = selectedStudent.classId;
   const me = buildAutoMatchPoolPayload();
   const coordRef = database.ref(`autoMatchCoordinator/${classId}`);
   return new Promise((resolve) => {
      coordRef.transaction(
         (curr) => {
            curr = curr || { pool: {}, match: null };
            let pool = { ...(curr.pool || {}) };
            const now = Date.now();
            Object.keys(pool).forEach((k) => {
               if (now - (pool[k].ts || 0) > 60000) delete pool[k];
            });
            let match = curr.match || null;
            if (match && now - (match.ts || 0) > 38000) {
               match = null;
            }
            if (match) {
               const imPart = match.inviter.sid === me.sid || match.invited.sid === me.sid;
               if (imPart) {
                  return { pool, match };
               }
               pool[me.sid] = {
                  sid: me.sid,
                  classId: me.classId,
                  name: me.name,
                  nameFrame: me.nameFrame || 'default',
                  photo: me.photo || '',
                  ts: now
               };
               return { pool, match };
            }
            pool[me.sid] = {
               sid: me.sid,
               classId: me.classId,
               name: me.name,
               nameFrame: me.nameFrame || 'default',
               photo: me.photo || '',
               ts: now
            };
            const ids = Object.keys(pool);
            if (ids.length >= 2) {
               const i = Math.floor(Math.random() * ids.length);
               let j = Math.floor(Math.random() * ids.length);
               let guard = 0;
               while (j === i && ids.length > 1 && guard++ < 28) {
                  j = Math.floor(Math.random() * ids.length);
               }
               const ida = ids[i];
               const idb = ids[j];
               const A = pool[ida];
               const B = pool[idb];
               const poolNext = { ...pool };
               delete poolNext[ida];
               delete poolNext[idb];
               const inviter = A.sid < B.sid ? A : B;
               const invited = A.sid < B.sid ? B : A;
               const mid = inviter.sid + '_' + invited.sid + '_' + now;
               return { pool: poolNext, match: { id: mid, inviter, invited, ts: now } };
            }
            return { pool, match: null };
         },
         (err, committed, snap) => {
            if (err) console.warn('autoMatch enqueue tx', err);
            resolve(snap && snap.exists() ? snap.val() : null);
         }
      );
   });
}

function markAutoMatchEventSeen(matchId) {
   if (!matchId) return false;
   window.__autoMatchSeenIds = window.__autoMatchSeenIds || new Set();
   const s = window.__autoMatchSeenIds;
   if (s.has(matchId)) return false;
   s.add(matchId);
   if (s.size > 50) {
      const arr = Array.from(s);
      arr.slice(0, arr.length - 40).forEach((k) => s.delete(k));
   }
   return true;
}

function startAutoMatchCoordinator() {
   stopAutoMatchCoordinator();
   novaAutoMatchUiReset();
   const classId = selectedStudent.classId;
   const coordRef = database.ref(`autoMatchCoordinator/${classId}`);
   window.__autoMatchCoordRef = coordRef;

   const handler = (snap) => {
      const v = snap.val();
      if (!v || !v.match) return;
      const m = v.match;
      const my = selectedStudent.studentId;
      if (m.inviter.sid !== my && m.invited.sid !== my) return;
      if (!markAutoMatchEventSeen(m.id)) return;
      processAutoMatchPair(m).catch((e) => console.warn('processAutoMatchPair', e));
   };
   window.__autoMatchCoordHandler = handler;
   coordRef.on('value', handler);

   tryAutoMatchEnqueueTx();
   window.__autoMatchEnqueueInterval = setInterval(() => {
      const mm = document.getElementById('matchmakingScreen');
      if (!mm || mm.style.display !== 'flex') return;
      const now = Date.now();
      if (window.__autoMatchLastEnqueueTs && (now - window.__autoMatchLastEnqueueTs) < 5000) return;
      window.__autoMatchLastEnqueueTs = now;
      tryAutoMatchEnqueueTx();
   }, 5200);
}

async function processAutoMatchPair(m) {
   const classId = selectedStudent.classId;
   const mySid = selectedStudent.studentId;
   const sub = document.getElementById('autoMatchSubtext');
   const title = document.getElementById('autoMatchTitle');

   try {
      await database.ref(`matchmaking/${classId}/${mySid}`).remove();
   } catch (_) {}

   const other = m.inviter.sid === mySid ? m.invited : m.inviter;
   const imInvited = m.invited.sid === mySid;

   if (sub) sub.textContent = 'Rakip bulundu! Son kontroller yapılıyor…';
   if (title) title.textContent = 'Eşleşme hazırlanıyor';

   try {
      const banDataGate = await readInviteBan(mySid, classId);
      if (banDataGate) {
         const ex = banDataGate.expiresAt || 0;
         if (ex > Date.now()) {
            await clearAutoMatchCoordinatorMatch(m.id, classId);
            await showAlert('Şu an düello daveti gönderemezsin. Ceza süren bitince tekrar dene.');
            document.getElementById('matchmakingScreen').style.display = 'none';
            stopAutoMatchCoordinator();
            return;
         }
      }
   } catch (_) {}

   const [inMe, inOth, credMe, credOth, cupMe, cupOth, lpAutoMap] = await Promise.all([
      database.ref(`classes/${classId}/students/${mySid}/inDuel`).once('value'),
      database.ref(`classes/${other.classId}/students/${other.sid}/inDuel`).once('value'),
      database.ref(`classes/${classId}/students/${mySid}/duelCredits`).once('value'),
      database.ref(`classes/${other.classId}/students/${other.sid}/duelCredits`).once('value'),
      database.ref(`classes/${classId}/students/${mySid}/gameCup`).once('value'),
      database.ref(`classes/${other.classId}/students/${other.sid}/gameCup`).once('value'),
      fetchLoggedInPlayersMapLimited()
   ]);
   const inviterSidStr = String(m.inviter.sid);
   let inviterOnlineFromMap = false;
   try {
      inviterOnlineFromMap = Object.values(lpAutoMap || {}).some(function (p) {
         return p && String(p.studentId) === inviterSidStr;
      });
   } catch (_) {}

   // Lig kuralı (auto-match): sadece aynı ligdeki oyuncular eşleşebilir.
   try{
      if (typeof getLeagueFromCups === 'function') {
         const cupsMe = cupMe.exists() ? Number(cupMe.val() || 0) : 0;
         const cupsOth = cupOth.exists() ? Number(cupOth.val() || 0) : 0;
         const leagueMe = getLeagueFromCups(cupsMe);
         const leagueOth = getLeagueFromCups(cupsOth);
         if (leagueMe !== leagueOth) {
            await clearAutoMatchCoordinatorMatch(m.id, classId);
            const t = document.getElementById('autoMatchTitle');
            const s = document.getElementById('autoMatchSubtext');
            if (t) t.textContent = 'Yeni rakip aranıyor';
            if (s) s.textContent = 'Rakip lig uyuşmuyor, yeni rakip aranıyor...';
            tryAutoMatchEnqueueTx();
            return;
         }
      }
   }catch(_){}

  const [eligMe, eligOth] = await Promise.all([
      checkDuelEligibility(mySid, classId, { cup: cupMe.exists() ? Number(cupMe.val()) : 0, credits: credMe.exists() ? Number(credMe.val()) : 0 }),
      checkDuelEligibility(other.sid, other.classId, { cup: cupOth.exists() ? Number(cupOth.val()) : 0, credits: credOth.exists() ? Number(credOth.val()) : 0 })
   ]);
   if (!eligMe.eligible || !eligOth.eligible) {
      await clearAutoMatchCoordinatorMatch(m.id, classId);
      const t = document.getElementById('autoMatchTitle');
      const s = document.getElementById('autoMatchSubtext');
      if (t) t.textContent = 'Yeni rakip aranıyor';
      if (!eligMe.eligible) {
         if (s) s.textContent = 'Düello için en az 3 kupa ve 15 kredi gerekiyor.';
         await showAlert('Düelloya katılmak için en az 3 kupa ve 15 düello kredisi gerekir.');
         document.getElementById('matchmakingScreen').style.display = 'none';
         stopAutoMatchCoordinator();
         return;
      }
      if (s) s.textContent = 'Rakip şartı karşılamıyordu, yeni rakip aranıyor...';
      tryAutoMatchEnqueueTx();
      return;
   }

   let inDuelMe = inMe.exists() ? !!inMe.val() : false;
   let inDuelOth = inOth.exists() ? !!inOth.val() : false;
   if (inDuelMe || inDuelOth) {
      const [realMe, realOth] = await Promise.all([
         inDuelMe ? novaHasActiveDuelRecord(mySid) : Promise.resolve(false),
         inDuelOth ? novaHasActiveDuelRecord(other.sid) : Promise.resolve(false)
      ]);
      if (inDuelMe && !realMe) {
         inDuelMe = false;
         try { await database.ref(`classes/${classId}/students/${mySid}/inDuel`).set(false); } catch (_) {}
      }
      if (inDuelOth && !realOth) {
         inDuelOth = false;
         try { await database.ref(`classes/${other.classId}/students/${other.sid}/inDuel`).set(false); } catch (_) {}
      }
      if (inDuelMe || inDuelOth) {
         await clearAutoMatchCoordinatorMatch(m.id, classId);
         const t = document.getElementById('autoMatchTitle');
         const s = document.getElementById('autoMatchSubtext');
         if (t) t.textContent = 'Yeni rakip aranıyor';
         if (s) s.textContent = 'Bir oyuncu o sırada düellodaydı. Sistem otomatik olarak yeni bir rakip arıyor...';
         tryAutoMatchEnqueueTx();
         return;
      }
   }

   const cMe = credMe.exists() ? Number(credMe.val()) : 0;
   const cOth = credOth.exists() ? Number(credOth.val()) : 0;
   if (cMe < 15 || cOth < 15) {
      await clearAutoMatchCoordinatorMatch(m.id, classId);
      await showAlert('Eşleşme iptal: düello kredisi uygun değil.');
      document.getElementById('matchmakingScreen').style.display = 'none';
      stopAutoMatchCoordinator();
      return;
   }

   // Kupa farkı engeli kaldırıldı: otomatik eşleşmede kupa farkı ne olursa olsun devam edilir.

   if (!inviterOnlineFromMap) {
      await clearAutoMatchCoordinatorMatch(m.id, classId);
      await showAlert('Eşleşme iptal: rakip çevrimiçi görünmüyor.');
      document.getElementById('matchmakingScreen').style.display = 'none';
      stopAutoMatchCoordinator();
      return;
   }

   if (imInvited) {
      try {
         await createDuelSession(
            m.inviter.sid,
            m.inviter.classId,
            m.inviter.name,
            m.inviter.photo || '',
            m.inviter.nameFrame || 'default'
         );
      } catch (e) {
         console.error('Auto-match createDuelSession', e);
         await showAlert('Düello başlatılamadı. Tekrar dene.');
      } finally {
         await clearAutoMatchCoordinatorMatch(m.id, classId);
      }
   } else {
      if (sub) sub.textContent = 'Rakip düelloyu başlatıyor, lütfen bekle…';
   }
}

// Düello Arama butonuna tıklandığında
document.getElementById('findDuelButton').addEventListener('click', async () => {
   const myGate = await checkDuelEligibility(selectedStudent.studentId, selectedStudent.classId);
   if (!myGate.eligible) {
      await showAlert('Düelloya katılmak için en az 3 kupa ve 15 düello kredisi gerekir.');
      return;
   }
   cleanupMatchmakingListeners();
   try {
      if (typeof window.novaEpicShowLeagueReveal === 'function') {
         await window.novaEpicShowLeagueReveal(Number(myGate.cup || 0));
      }
   } catch (e) {
      console.warn('novaEpicShowLeagueReveal', e);
   }

   const matchmakingRef = database.ref(`matchmaking/${selectedStudent.classId}/${selectedStudent.studentId}`);
   matchmakingRef.onDisconnect().remove();

   matchmakingRef
      .set({
         name: selectedStudent.studentName,
         className: selectedStudent.className || '',
         nameFrame: selectedStudent.nameFrame || 'default',
         classId: selectedStudent.classId,
         studentId: selectedStudent.studentId,
         photo:
            studentPhoto && studentPhoto.src && !String(studentPhoto.src).includes('via.placeholder')
               ? studentPhoto.src
               : '',
         timestamp: firebase.database.ServerValue.TIMESTAMP,
         status: 'searching',
         queueMode: 'auto'
      })
      .then(() => {
         showMatchmakingScreen();
      });
});

function showMatchmakingScreen() {
   const matchmakingScreen = document.getElementById('matchmakingScreen');
   try {
      if (window.novaPerfBeforeGameScreen) window.novaPerfBeforeGameScreen('matchmakingScreen');
   } catch (_) {}
   matchmakingScreen.classList.add('nova-duel-mm-visible');
   matchmakingScreen.style.display = 'flex';
   novaAutoMatchUiReset();
   startAutoMatchCoordinator();
}

async function resolveClassNameForUI(classId, fallbackName){
  const id = String(classId || '').trim();
  if (!id) return (fallbackName || '').trim();
  try{
    window.__classLabelCache = window.__classLabelCache || {};
    if (window.__classLabelCache[id]) return window.__classLabelCache[id];
    if (classNameMap && classNameMap[id]) {
      window.__classLabelCache[id] = classNameMap[id];
      return classNameMap[id];
    }
    // 1) Same app flow cache: cachedClasses
    try{
      const cc = localStorage.getItem('cachedClasses');
      if (cc) {
        const arr = JSON.parse(cc) || [];
        const hit = arr.find(x => x && x.id === id && x.name);
        if (hit && hit.name) {
          classNameMap[id] = hit.name;
          window.__classLabelCache[id] = hit.name;
          return hit.name;
        }
      }
    }catch(_){}
    // 2) classesIndex
    const idxSnap = await database.ref(`classesIndex/${id}`).once('value');
    const idxVal = idxSnap.exists() ? idxSnap.val() : null;
    let resolved = '';
    if (typeof idxVal === 'string') resolved = idxVal;
    else if (idxVal && typeof idxVal.name === 'string') resolved = idxVal.name;
    // 3) classes/{id}/name
    if (!resolved) {
      const clsNameSnap = await database.ref(`classes/${id}/name`).once('value');
      if (clsNameSnap.exists()) resolved = String(clsNameSnap.val() || '').trim();
    }
    if (resolved) {
      classNameMap[id] = resolved;
      window.__classLabelCache[id] = resolved;
      return resolved;
    }
  }catch(_){}
  return (fallbackName || '').trim();
}

// Matchmaking dinleyicilerini temizle
function cleanupMatchmakingListeners() {
   stopAutoMatchCoordinator();
   const currentClass = selectedStudent && selectedStudent.classId;
   const sid = selectedStudent && selectedStudent.studentId;
   if (currentClass && sid) {
      try {
         database.ref(`matchmaking/${currentClass}/${sid}`).remove();
      } catch (_) {}
   }
   if (currentClass) {
      const matchmakingRef = database.ref(`matchmaking/${currentClass}`);
      matchmakingRef.off();
   }
}

// Aramayı iptal et
document.getElementById('cancelSearchButton').addEventListener('click', () => {
   const matchmakingScreen = document.getElementById('matchmakingScreen');
   matchmakingScreen.classList.remove('nova-duel-mm-visible');
   matchmakingScreen.style.display = 'none';
   try {
      if (window.novaPerfBeforeMainScreen) window.novaPerfBeforeMainScreen();
   } catch (_) {}
   mainScreen.style.removeProperty('display');
   removeSelfFromAutoMatchPool();
   database.ref(`matchmaking/${selectedStudent.classId}/${selectedStudent.studentId}`).remove();
   cleanupMatchmakingListeners();
   try {
      if (typeof window.novaEpicHideAll === 'function') window.novaEpicHideAll();
   } catch (_) {}
   document.body.classList.remove('nova-duel-epic-active');
});

function listenForDuelCreation() {
   const sid = selectedStudent.studentId;
   const qInv = database.ref('duels').orderByChild('inviter/studentId').equalTo(sid);
   const qInvited = database.ref('duels').orderByChild('invited/studentId').equalTo(sid);
   qInv.off('child_added');
   qInvited.off('child_added');

   const onFound = () => {
      const matchmakingScreen = document.getElementById('matchmakingScreen');
      matchmakingScreen.style.display = 'none';
      database.ref(`matchmaking/${selectedStudent.classId}/${selectedStudent.studentId}`).remove();
      cleanupMatchmakingListeners();
   };

   qInv.on('child_added', onFound);
   qInvited.on('child_added', onFound);
}

// Sayfa kapatıldığında ya da yenilendiğinde
window.addEventListener('beforeunload', () => {
   // Eğer matchmaking'de ise kaydı sil
   if (selectedStudent && selectedStudent.classId && selectedStudent.studentId) {
       database.ref(`matchmaking/${selectedStudent.classId}/${selectedStudent.studentId}`).remove();
   }
});


























const CACHE_KEYS = {
    PHOTOS: 'storePhotos',
    CHAMPION: 'championPhotos',
    PURCHASED: 'purchasedPhotos',
    NAME_FRAMES: 'purchasedNameFrames'
};

const SERIES_AVATAR_FRAME_ITEMS = [
  { id: 'series_world_champ', name: 'Dünya Devleri Tacı', price: 5000, cupBonus: 4, tone: 'worldchamp', unlockBySeries: 'world', unlockRuleText: 'Şart: DünyaDevleri serisinin tamamını satın al.' },
  { id: 'series_girls_rose', name: 'Pembe Yıldız Tacı', price: 5000, cupBonus: 4, tone: 'rosequeen', unlockBySeries: 'girls', unlockRuleText: 'Şart: Kızlar Köşesi serisinin tamamını satın al.' },
  { id: 'series_super_lite', name: 'Süper Lig Çizgisi', price: 5000, cupBonus: 4, tone: 'superlite', unlockBySeries: 'super', unlockRuleText: 'Şart: Süper Lig serisinin tamamını satın al.' },
  { id: 'series_basic_buddy', name: 'Temel Karakter Rozeti', price: 5000, cupBonus: 2, tone: 'basicbuddy', unlockBySeries: 'basic', unlockRuleText: 'Şart: Temel Karakterler serisinin tamamını satın al.' }
];

function getDuelCupBonusByAvatarFrame(frameId){
  const id = String(frameId || 'default');
  if (id === 'series_world_champ' || id === 'series_girls_rose' || id === 'series_super_lite') return 4;
  if (id === 'series_basic_buddy') return 2;
  return 0;
}

const DEFAULT_NAME_FRAME_ITEMS = [
  { id: 'spark', name: 'Parilti', price: 5000, tone: 'spark' },
  { id: 'wind', name: 'Ruzgar', price: 8000, tone: 'wind' },
  { id: 'neon', name: 'Neon', price: 12000, tone: 'neon' },
  { id: 'fire', name: 'Ates', price: 18000, tone: 'fire' },
  { id: 'ice', name: 'Buz', price: 22000, tone: 'ice' },
  { id: 'legend', name: 'Efsane', price: 30000, tone: 'legend' },
  { id: 'inferno', name: 'Cehennem Alevi', price: 34000, tone: 'inferno' },
  { id: 'phoenix', name: 'Anka Kanadi', price: 38000, tone: 'phoenix' },
  { id: 'cosmic', name: 'Kozmik Nebula', price: 42000, tone: 'cosmic' },
  { id: 'magma', name: 'Magma Kabugu', price: 46000, tone: 'magma' },
  { id: 'dragonfire', name: 'Ejder Nefesi', price: 52000, tone: 'dragonfire' },
  { id: 'wildfire', name: 'Uçucu Alev', price: 60000, tone: 'wildfire' }
];
let NAME_FRAME_ITEMS = [...DEFAULT_NAME_FRAME_ITEMS];
let NAME_FRAME_MAP = Object.fromEntries(NAME_FRAME_ITEMS.map(x => [x.id, x]));

function rebuildNameFrameCatalog(items){
  const safe = Array.isArray(items) ? items.filter(Boolean) : [];
  NAME_FRAME_ITEMS = safe;
  NAME_FRAME_MAP = Object.fromEntries(NAME_FRAME_ITEMS.map(x => [x.id, x]));
}
async function loadNameFrameCatalogFromDB(){
  try{
    const snap = await database.ref('store/nameFrames').once('value');
    if (!snap.exists()) return false;
    const raw = snap.val() || {};
    const items = [];
    Object.keys(raw).forEach((id) => {
      const v = raw[id] || {};
      const cleanId = String(id || '').trim();
      const price = Number(v.price || 0);
      if (!cleanId || !Number.isFinite(price) || price < 0) return;
      items.push({
        id: cleanId,
        name: String(v.name || cleanId),
        price,
        tone: String(v.tone || cleanId),
        order: Number.isFinite(Number(v.order)) ? Number(v.order) : 1e9
      });
    });
    if (!items.length) return false;
    items.sort((a,b) => (a.order - b.order) || (a.price - b.price) || String(a.name).localeCompare(String(b.name), 'tr'));
    rebuildNameFrameCatalog(items.map(({order, ...rest}) => rest));
    return true;
  }catch(e){
    console.warn('Name frame catalog load error:', e);
    return false;
  }
}
loadNameFrameCatalogFromDB();

function escapeHtml(s){
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function renderNameWithFrame(name, frameId){
  const n = escapeHtml(name || 'Oyuncu');
  const f = NAME_FRAME_MAP[frameId];
  if (!f){
    if (String(frameId || '') === 'deneme_champion'){
      return `<span class="nova-name-frame nf-denemechamp"><span class="nf-inner">${n}</span></span>`;
    }
    return `<span class="nova-name-basic">${n}</span>`;
  }
  return `<span class="nova-name-frame nf-${f.tone}"><span class="nf-inner">${n}</span></span>`;
}

function isChampionBadgeFrame(frameId){
  return String(frameId || '') === 'deneme_champion';
}
function isChampionBadgeOwnerUser(user){
  if(!user || typeof user !== 'object') return false;
  return isChampionBadgeFrame(user.avatarFrame) || isChampionBadgeFrame(user.nameFrame);
}
function resolveAvatarFrameByName(nameFrame, avatarFrame){
  if (String(nameFrame || '') === 'deneme_champion') return 'deneme_champion';
  return avatarFrame || 'default';
}
function championDiamondMultiplierForUser(user){
  return isChampionBadgeOwnerUser(user) ? 2 : 1;
}
function computeChampionDiamondGain(baseAmount, user){
  var base = Math.max(0, Number(baseAmount || 0));
  var mul = championDiamondMultiplierForUser(user);
  return { base: base, multiplier: mul, total: Math.round(base * mul) };
}
function isSelectedStudentChampion(){
  try{
    var s = (typeof selectedStudent !== 'undefined' && selectedStudent) ? selectedStudent : null;
    if (!s) return false;
    return isChampionBadgeFrame(s.avatarFrame) || isChampionBadgeFrame(s.nameFrame);
  }catch(_){ return false; }
}
function syncChampionDiamondBoosterUi(){
  try{
    var active = isSelectedStudentChampion();
    document.body.classList.toggle('champion-x2-active', !!active);
    var root = document.querySelector('.diamond-stats');
    if(!root) return;
    var badge = root.querySelector('.champion-x2-badge');
    if(active){
      if(!badge){
        badge = document.createElement('div');
        badge.className = 'champion-x2-badge';
        badge.textContent = '👑 x2';
        root.appendChild(badge);
      }
    }else if(badge){
      badge.remove();
    }
    document.querySelectorAll('.nova-fab-reward-tag').forEach(function(el){
      if(!el) return;
      var txt = String(el.textContent || '');
      if(!txt.includes('💎')) return;
      if(!el.dataset.baseReward){
        var m = txt.match(/(\d+)\s*💎/);
        el.dataset.baseReward = m ? String(Number(m[1] || 0)) : '100';
      }
      var base = Math.max(0, Number(el.dataset.baseReward || 0));
      var shown = active ? (base * 2) : base;
      el.textContent = '+' + shown + ' 💎';
    });
  }catch(_){}
}

function normalizeCategoryKeyForSeries(v){
  return String(v || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

function getSeriesAliases(seriesKey){
  if (seriesKey === 'world') return ['DünyaDevleri', 'DunyaDevleri', 'Dünya Devleri'];
  if (seriesKey === 'girls') return ['KizlarKösesi', 'KizlarKosesi', 'KızlarKöşesi', 'KızlarKösesi'];
  if (seriesKey === 'super') return ['SüperLig', 'SuperLig', 'Süperlig'];
  if (seriesKey === 'basic') return ['TemelKarakterler', 'Temel Karakterler'];
  return [];
}

function resolveSeriesCategoryKey(seriesKey){
  const aliases = getSeriesAliases(seriesKey).map(normalizeCategoryKeyForSeries);
  const keys = Object.keys(photoCategories || {});
  for (const k of keys){
    if (aliases.includes(normalizeCategoryKeyForSeries(k))) return k;
  }
  return '';
}

function novaMapStoreCategoryObject(o) {
  return Object.keys(o || {})
    .filter(id => id !== '_meta' && o[id] && typeof o[id].url === 'string' && typeof o[id].price === 'number')
    .map(id => ({
      id,
      url: o[id].url,
      price: o[id].price,
      name: o[id].name || id,
      desc: o[id].desc || '',
      allowedStudents: o[id].allowedStudents || null
    }));
}

async function ensureSeriesCategoryLoaded(category){
  const c = String(category || '').trim();
  if (!c) return;
  if (Array.isArray(photoCategories[c]) && photoCategories[c].length) return;
  try{
    if (window.__novaStoreCdnPhotos && window.__novaStoreCdnPhotos[c]) {
      photoCategories[c] = novaMapStoreCategoryObject(window.__novaStoreCdnPhotos[c]);
      return;
    }
    let ids = null;
    try {
      if (typeof window.novaRtdbShallowKeys === 'function') {
        ids = await window.novaRtdbShallowKeys('store/profilePhotos/' + c);
      }
    } catch (_) {}
    if (ids && ids.length) {
      const out = [];
      const BATCH = 14;
      const rawIds = ids.filter((id) => id !== '_meta');
      for (let i = 0; i < rawIds.length; i += BATCH) {
        const chunk = rawIds.slice(i, i + BATCH);
        const rows = await Promise.all(chunk.map(async (id) => {
          try {
            const snap = await database.ref('store/profilePhotos/' + c + '/' + id).once('value');
            if (!snap.exists()) return null;
            const o = snap.val() || {};
            if (typeof o.url !== 'string' || typeof o.price !== 'number') return null;
            return {
              id: id,
              url: o.url,
              price: o.price,
              name: o.name || id,
              allowedStudents: o.allowedStudents || null
            };
          } catch (_) {
            return null;
          }
        }));
        rows.forEach((row) => { if (row) out.push(row); });
      }
      photoCategories[c] = out;
    } else if (ids === null) {
      const catSnap = await database.ref('store/profilePhotos/' + c).once('value');
      const o = catSnap.exists() ? (catSnap.val() || {}) : {};
      photoCategories[c] = Object.keys(o)
        .filter(id => id !== '_meta' && o[id] && typeof o[id].url === 'string' && typeof o[id].price === 'number')
        .map(id => ({
          id,
          url: o[id].url,
          price: o[id].price,
          name: o[id].name || id,
          allowedStudents: o[id].allowedStudents || null
        }));
    } else {
      photoCategories[c] = [];
    }
  }catch(_){
    if (!photoCategories[c]) photoCategories[c] = [];
  }
}

async function getSeriesAvatarFrameUnlockState(userData){
  const state = {};
  const purchasedPhotos = (userData && userData.purchasedPhotos) || getFromCache(CACHE_KEYS.PURCHASED) || {};
  const visKey = `${selectedStudent.classId}:${selectedStudent.studentId}`;
  if (!Object.keys(photoCategories || {}).length){
    try { await fetchStoreCategoriesFromDB(); } catch(_) {}
  }
  for (const item of SERIES_AVATAR_FRAME_ITEMS){
    const category = resolveSeriesCategoryKey(item.unlockBySeries);
    await ensureSeriesCategoryLoaded(category);
    const source = Array.isArray(photoCategories[category]) ? photoCategories[category] : [];
    const visible = source.filter(p => !p.allowedStudents || p.allowedStudents[visKey]);
    let owned = 0;
    for (const p of visible){
      try { if (purchasedPhotos[btoa(p.url)]) owned++; } catch(_) {}
    }
    const total = visible.length;
    state[item.id] = { done: total > 0 && owned >= total, owned, total };
  }
  return state;
}

async function claimSeriesAvatarFrame(item){
  try{
    const userData = (await getStoreStudentData(true)) || {};
    const studentRef = database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}`);
    const seriesState = await getSeriesAvatarFrameUnlockState(userData);
    const unlock = seriesState[item.id] || { done:false };
    if (!unlock.done){
      await showAlert('Bu çerçeve için önce ilgili seriyi tamamen bitirmelisin.');
      return;
    }
    const cost = Number(item && item.price || 0);
    const currentCredits = Number(userData.duelCredits || 0);
    if (currentCredits < cost){
      await showAlert(`Yetersiz düello kredisi. Gerekli: ${cost}, mevcut: ${currentCredits}.`);
      return;
    }
    const ok = await showConfirmation(`${cost} düello kredisi ile "${item.name}" avatar çerçevesini açmak istiyor musun?`);
    if (!ok) return;
    await studentRef.update({
      duelCredits: currentCredits - cost,
      [`purchasedAvatarFrames/${item.id}`]: true
    });
    const nextData = {
      ...userData,
      duelCredits: currentCredits - cost,
      purchasedAvatarFrames: { ...(userData.purchasedAvatarFrames || {}), [item.id]: true }
    };
    try{
      const key = `${selectedStudent.classId}:${selectedStudent.studentId}`;
      __storeStudentCache = { key, ts: Date.now(), data: nextData };
    }catch(_){}
    await renderAvatarFrameStore(nextData, document.getElementById('profilePhotosContainer'));
    await showAlert(`🏆 ${item.name} açıldı! (${cost} kredi harcandı)`);
    try { await novaRefreshCharacterInventoryIfOpen(); } catch (_) {}
  }catch(e){
    console.error('Series frame claim error:', e);
    await showAlert('Çerçeve açılırken bir hata oluştu.');
  }
}

function setNameWithFrame(el, name, frameId){
  if (!el) return;
  const resolvedName = String(name || '').trim() || 'Oyuncu';
  const resolvedFrame = frameId || 'default';
  try{
    if (el.dataset && el.dataset.playerNameRaw === resolvedName && el.dataset.nameFrame === resolvedFrame) return;
  }catch(_){}
  el.innerHTML = renderNameWithFrame(resolvedName, resolvedFrame);
  try{
    el.dataset.playerNameRaw = resolvedName;
    el.dataset.nameFrame = resolvedFrame;
  }catch(_){}
}
function syncSelectedNameFrame(frameId){
  try {
    if (!window.selectedStudent) return;
    window.selectedStudent.nameFrame = frameId || 'default';
    localStorage.setItem('selectedStudent', JSON.stringify(window.selectedStudent));
  } catch(_) {}
}
function applyOwnNameFrame(){
  try {
    const s = window.selectedStudent || null;
    const el = document.getElementById('student-name');
    if (!el || !s) return;
    setNameWithFrame(el, s.studentName || '', s.nameFrame || 'default');
  } catch(_) {}
}
function enforceKnownNameFrames(){
  try{
    if (document.hidden) return;
    const isVisible = (id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const cs = window.getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    };
    if (window.selectedStudent && window.selectedStudent.studentName){
      setNameWithFrame(document.getElementById('student-name'), window.selectedStudent.studentName, window.selectedStudent.nameFrame || 'default');
    }
    const duelRelatedVisible = isVisible('duel-selection-screen') || isVisible('duel-game-screen');
    if (!duelRelatedVisible) return;
    const d = window.__lastDuelNameFrames;
    if (d && d.inviter && d.invited){
      setNameWithFrame(document.getElementById('duel-inviter-name'), d.inviter.name, d.inviter.frame || 'default');
      setNameWithFrame(document.getElementById('duel-player-inviter-name'), d.inviter.name, d.inviter.frame || 'default');
      setNameWithFrame(document.getElementById('introLName'), d.inviter.name, d.inviter.frame || 'default');
      setNameWithFrame(document.getElementById('tb-left'), d.inviter.name, d.inviter.frame || 'default');
      setNameWithFrame(document.getElementById('novaLeftName'), d.inviter.name, d.inviter.frame || 'default');
      setNameWithFrame(document.getElementById('duel-invited-name'), d.invited.name, d.invited.frame || 'default');
      setNameWithFrame(document.getElementById('duel-player-invited-name'), d.invited.name, d.invited.frame || 'default');
      setNameWithFrame(document.getElementById('introRName'), d.invited.name, d.invited.frame || 'default');
      setNameWithFrame(document.getElementById('tb-right'), d.invited.name, d.invited.frame || 'default');
      setNameWithFrame(document.getElementById('novaRightName'), d.invited.name, d.invited.frame || 'default');
    }
  }catch(_){}
}
setInterval(enforceKnownNameFrames, 2400);

function getUserSpecificCacheKey(key) {
    return `${key}_${selectedStudent.studentId}`;
}

function saveToCache(key, data) {
    try {
        const userKey = getUserSpecificCacheKey(key);
        localStorage.setItem(userKey, JSON.stringify({
            userId: selectedStudent.studentId,
            data: data,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.error('Cache save error:', error);
    }
}

function getFromCache(key) {
    try {
        const userKey = getUserSpecificCacheKey(key);
        const cached = localStorage.getItem(userKey);
        if (!cached) return null;

        const parsedCache = JSON.parse(cached);
        if (parsedCache.userId !== selectedStudent.studentId) {
            localStorage.removeItem(userKey);
            return null;
        }
        return parsedCache.data;
    } catch (error) {
        console.error('Cache read error:', error);
        return null;
    }
}



// Main photo categories with added cache handling (dinamik anahtarlar + admin etiketleri)
let photoCategories = {};
window.storeCategoryMeta = window.storeCategoryMeta || {};

/**
 * Mağaza kategorilerini Firebase üzerinden çeker.
 * store/profilePhotos/{kategori} + store/categoryMeta/{kategori}.label
 */
async function fetchStoreCategoriesFromDB() {
  try {
    if (window.__storeCatsFetchTs && Object.keys(photoCategories || {}).length && (Date.now() - window.__storeCatsFetchTs) < NOVA_STORE_CAT_INDEX_TTL_MS) {
      return;
    }
    if (typeof window.novaCdnFetchStoreManifest === 'function') {
      const manifest = await window.novaCdnFetchStoreManifest();
      if (manifest && typeof manifest === 'object') {
        const indexData = manifest.profilePhotosIndex || {};
        window.storeCategoryMeta = manifest.categoryMeta || {};
        window.__novaStoreCdnPhotos = manifest.profilePhotos || {};
        window.__novaStoreCdnNameFrames = manifest.nameFrames || {};
        window.__novaStoreCdnBattleHeroes = manifest.battleHeroes || {};
        const allKeys = new Set([
          ...Object.keys(indexData),
          ...Object.keys(window.storeCategoryMeta || {})
        ]);
        photoCategories = {};
        allKeys.forEach(k => {
          if (!k || k === '_meta') return;
          if (!photoCategories[k]) photoCategories[k] = [];
        });
        window.__storeCatsFetchTs = Date.now();
        try { renderStoreCategoryButtons(); } catch (e) {}
        return;
      }
    }
    const [snapI, snapM] = await Promise.all([
      database.ref('store/profilePhotosIndex').once('value'),
      database.ref('store/categoryMeta').once('value')
    ]);
    const indexData = snapI.val() || {};
    window.storeCategoryMeta = snapM.exists() ? (snapM.val() || {}) : {};
    const allKeys = new Set([...Object.keys(indexData), ...Object.keys(window.storeCategoryMeta || {})]);
    photoCategories = {};
    allKeys.forEach(k => {
      if (!k || k === '_meta') return;
      if (!photoCategories[k]) photoCategories[k] = [];
    });
    window.__storeCatsFetchTs = Date.now();
    try{ renderStoreCategoryButtons(); }catch(e){}
  } catch (e) {
    console.error('Store categories fetch error:', e);
  }
}

let __storeStudentCache = { key: '', ts: 0, data: null };

window.novaInvalidateStoreStudentCache = function () {
  __storeStudentCache = { key: __storeStudentCache.key || '', ts: 0, data: null };
};
let __storeLoadSeq = 0;
let __storeLastCategory = '';
let __storeLastCategoryTs = 0;

function getStoreRenderBatchConfig(total){
  const isLow = !!((navigator && navigator.deviceMemory && navigator.deviceMemory <= 4) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
  const firstBatch = isLow ? 8 : 12;
  const chunk = isLow ? 6 : 10;
  const frameGap = total > 80 ? 2 : 1; // very large lists: skip one frame between chunks
  return { firstBatch, chunk, frameGap };
}

async function appendCardsProgressively(container, cards, seq){
  if (!container || !Array.isArray(cards) || !cards.length) return;
  const cfg = getStoreRenderBatchConfig(cards.length);
  let i = 0;

  const pushBatch = (count) => {
    const frag = document.createDocumentFragment();
    const end = Math.min(cards.length, i + count);
    for (; i < end; i++) frag.appendChild(cards[i]);
    container.appendChild(frag);
  };

  pushBatch(cfg.firstBatch);
  if (i >= cards.length) return;

  let frameWait = 0;
  while (i < cards.length) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (seq !== __storeLoadSeq) return;
    if (frameWait < cfg.frameGap - 1) { frameWait++; continue; }
    frameWait = 0;
    pushBatch(cfg.chunk);
  }
}

async function getStoreStudentData(force = false){
  if (!selectedStudent || !selectedStudent.classId || !selectedStudent.studentId) return null;
  const key = `${selectedStudent.classId}:${selectedStudent.studentId}`;
  const now = Date.now();
  if (!force && __storeStudentCache.key === key && __storeStudentCache.data && (now - __storeStudentCache.ts) < 6000){
    return __storeStudentCache.data;
  }
  const base = `classes/${selectedStudent.classId}/students/${selectedStudent.studentId}`;
  const fields = ['diamond', 'duelCredits', 'gameCup', 'photo', 'nameFrame', 'avatarFrame', 'battleHero', 'purchasedPhotos', 'purchasedAvatarFrames', 'purchasedBattleHeroes', 'heroLevel', 'heroTrials', 'dragonTrials', 'heroTrialPending', 'dragonTrialPending'];
  const snaps = await Promise.all(fields.map(function (f) {
    return database.ref(base + '/' + f).once('value');
  }));
  const data = {};
  fields.forEach(function (f, i) {
    if (snaps[i].exists()) data[f] = snaps[i].val();
  });
  try {
    var ls = window.selectedStudent;
    if (!ls) {
      var raw = localStorage.getItem('selectedStudent');
      if (raw) ls = JSON.parse(raw);
    }
    if (ls) {
      ['heroTrials', 'dragonTrials', 'heroTrialPending', 'dragonTrialPending'].forEach(function (k) {
        if (ls[k] && typeof ls[k] === 'object') {
          data[k] = Object.assign({}, data[k] || {}, ls[k]);
        }
      });
    }
  } catch (_) {}
  __storeStudentCache = { key, ts: now, data };
  return data;
}

async function useProfilePhoto(photoUrl) {
    try {
        await database
            .ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}/photo`)
            .set(photoUrl);

        ['student-photo'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.src = photoUrl;
        });
        try {
          selectedStudent.photo = photoUrl;
          applyOwnAvatarFrame();
        } catch(_) {}

        saveToCache('currentUserPhoto', photoUrl);
        try { await novaRefreshCharacterInventoryIfOpen(); } catch (_) {}
        try {
          const ov = document.getElementById('profileChangeOverlay');
          if (ov && ov.style.display !== 'none' && typeof window.novaRefreshStoreInPlace === 'function') {
            await window.novaRefreshStoreInPlace();
          }
        } catch (_) {}
        await showAlert('✨ Profil fotoğrafı başarıyla değiştirildi!');
    } catch (error) {
        console.error('Fotoğraf değiştirme hatası:', error);
        await showAlert('❌ Fotoğraf değiştirme işlemi başarısız oldu.');
    }
}

function novaRestoreStoreProductsScroll(container, scrollTop) {
  if (!container) return;
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      container.scrollTop = scrollTop || 0;
    });
  });
}

function novaResolveStoreCategory(category) {
  let cat = category;
  if (cat == null || cat === '') {
    cat = (typeof window.novaGetActiveStoreCategory === 'function' && window.novaGetActiveStoreCategory()) || '';
  }
  if (!cat) {
    cat = (typeof window.novaGetDefaultAvatarCategoryKeys === 'function' && window.novaGetDefaultAvatarCategoryKeys()[0]) || 'bilim_kosesi';
  }
  try {
    if (typeof window.novaStoreHubSyncSubCategory === 'function') window.novaStoreHubSyncSubCategory(cat);
  } catch (_) {}
  return cat;
}

async function loadProfilePhotos(category) {
  const seq = ++__storeLoadSeq;
  if (!window.selectedStudent) {
    // localStorage fallback
    try { window.selectedStudent = JSON.parse(localStorage.getItem('selectedStudent') || 'null'); } catch(_) {}
  }
  if (!window.selectedStudent || !window.selectedStudent.classId || !window.selectedStudent.studentId) {
    const c = document.getElementById('profilePhotosContainer');
    if (c) c.innerHTML = '<div class="error">Öğrenci seçimi bulunamadı. Lütfen giriş yapın.</div>';
    return;
  }

  category = novaResolveStoreCategory(category);

  const now = Date.now();
  if (__storeLastCategory === category && (now - __storeLastCategoryTs) < 250) return;
  __storeLastCategory = category;
  __storeLastCategoryTs = now;

  // Kategori listesi yoksa hafif index/meta çek
  try {
    if (!Object.keys(photoCategories || {}).length) {
      await fetchStoreCategoriesFromDB();
    }
  } catch (e) { console.warn('Kategori tazeleme uyarısı:', e); }

  // İstenen kategorinin detayları yoksa sadece o dalı çek (full tree çekme)
  if (!Array.isArray(photoCategories[category]) || !photoCategories[category].length) {
    try {
      if (window.__novaStoreCdnPhotos && window.__novaStoreCdnPhotos[category]) {
        photoCategories[category] = novaMapStoreCategoryObject(window.__novaStoreCdnPhotos[category]);
      } else {
      const catSnap = await database.ref(`store/profilePhotos/${category}`).once('value');
      const o = catSnap.exists() ? (catSnap.val() || {}) : {};
      photoCategories[category] = novaMapStoreCategoryObject(o);
      }
    } catch (e) {
      console.warn('Kategori detay çekimi uyarısı:', e);
      if (!photoCategories[category]) photoCategories[category] = [];
    }
  }
   const userData = await getStoreStudentData();
   if (seq !== __storeLoadSeq) return;
   
   document.getElementById('currentDiamonds').textContent = userData.diamond || 0;

  if (category === 'duel') {
       const duelStore = document.getElementById('duelCreditsStore');
       const container = document.getElementById('profilePhotosContainer');
       duelStore.style.display = 'block';
       container.style.display = 'none';

       // Sınırsız hak kontrolü
       if (userData.unlimitedCreditsUntil && userData.unlimitedCreditsUntil > Date.now()) {
           // Tüm butonları devre dışı bırak
           document.querySelectorAll('.credit-package .buy-button').forEach(button => {
               button.disabled = true;
               button.style.opacity = '0.5';
               button.style.cursor = 'not-allowed';
               button.textContent = 'Sınırsız Hak Aktif';
               button.onclick = null;
           });

           // Stats güncelle
           const creditsStats = document.getElementById('credits-stats');
           const creditsValue = document.getElementById('duel-credits-value');
           const daysLeft = Math.ceil((userData.unlimitedCreditsUntil - Date.now()) / (1000 * 60 * 60 * 24));
           
           creditsStats.classList.add('unlimited');
           creditsValue.innerHTML = `<span class="unlimited-badge">${daysLeft}GÜN</span>`;
       }
       return;
   }

  if (category === '__nameFrames') {
      const containerNF = document.getElementById('profilePhotosContainer');
      const scrollNF = containerNF ? containerNF.scrollTop : 0;
      containerNF.style.display = 'grid';
      document.getElementById('duelCreditsStore').style.display = 'none';
      await loadNameFrameCatalogFromDB();
      await renderNameFrameStore(userData, containerNF);
      if (seq === __storeLoadSeq) novaRestoreStoreProductsScroll(containerNF, scrollNF);
      return;
  }

  if (category === '__avatarFrames') {
      const containerAF = document.getElementById('profilePhotosContainer');
      const scrollAF = containerAF ? containerAF.scrollTop : 0;
      containerAF.style.display = 'grid';
      document.getElementById('duelCreditsStore').style.display = 'none';
      await renderAvatarFrameStore(userData, containerAF);
      if (seq === __storeLoadSeq) novaRestoreStoreProductsScroll(containerAF, scrollAF);
      return;
  }

   const container = document.getElementById('profilePhotosContainer');
   const scrollTop = container ? container.scrollTop : 0;
   container.style.display = 'grid';
   document.getElementById('duelCreditsStore').style.display = 'none';
   container.innerHTML = '';

   try {
       let purchasedPhotos = getFromCache(CACHE_KEYS.PURCHASED);
       
       if (!purchasedPhotos) {
           const purchasedRef = database.ref(
               `classes/${selectedStudent.classId}/students/${selectedStudent.studentId}/purchasedPhotos`
           );
           const purchasedSnapshot = await purchasedRef.once('value');
           purchasedPhotos = purchasedSnapshot.val() || {};
           saveToCache(CACHE_KEYS.PURCHASED, purchasedPhotos);
       }

       if (seq !== __storeLoadSeq) return;

       // Kişiye özel görünürlük filtresi
       const visKey = `${selectedStudent.classId}:${selectedStudent.studentId}`;
       const cards = [];
       (photoCategories[category] || [])
         .filter(p => !p.allowedStudents || p.allowedStudents[visKey])
         .forEach((photo, index) => {
          const card = createPhotoCard(photo, purchasedPhotos, category, container, index);
          if (card) cards.push(card);
       });
       if (!cards.length) {
         container.innerHTML = '<div class="no-champion">Bu kategoride henüz ürün yok veya sana özel görünür ürün bulunmuyor.</div>';
         if (seq === __storeLoadSeq) novaRestoreStoreProductsScroll(container, scrollTop);
         return;
       }
       await appendCardsProgressively(container, cards, seq);
       if (seq === __storeLoadSeq) novaRestoreStoreProductsScroll(container, scrollTop);
   } catch (error) {
       console.error('Fotoğraf listesi yükleme hatası:', error);
       container.innerHTML = '<div class="error">Fotoğraflar yüklenirken bir hata oluştu</div>';
       if (seq === __storeLoadSeq) novaRestoreStoreProductsScroll(container, scrollTop);
   }
}

function novaStoreInUseMarkup() {
  return '<button type="button" class="profile-photo-button use-button nova-store-in-use-btn" disabled aria-disabled="true">Kullanılıyor</button>';
}
window.novaStoreInUseMarkup = novaStoreInUseMarkup;

function isStoreAvatarActive(photoUrl) {
  try {
    const sp = document.getElementById('student-photo');
    const curRaw = String((selectedStudent && selectedStudent.photo) || (sp && sp.src) || '').trim();
    const nextRaw = String(photoUrl || '').trim();
    if (!curRaw || !nextRaw) return false;

    const norm = (u) => {
      try {
        const url = new URL(u, window.location.href);
        return (url.origin + url.pathname).replace(/\/$/, '');
      } catch (_) {
        return String(u).split('#')[0].split('?')[0].replace(/\/$/, '');
      }
    };

    return norm(curRaw) === norm(nextRaw);
  } catch (_) {
    return false;
  }
}

function createPhotoCard(photo, purchasedPhotos, category, container, index) {
    const div = document.createElement('div');
    div.className = 'profile-photo-item nova-store-card';
    div.style.animationDelay = `${index * 0.06}s`;

    const encodedUrl = btoa(photo.url);
    const isPurchased = purchasedPhotos[encodedUrl];
    const isActive = isPurchased && isStoreAvatarActive(photo.url);
    const actionHtml = isActive
        ? novaStoreInUseMarkup()
        : `<button type="button" class="profile-photo-button ${isPurchased ? 'use-button' : 'buy-button'}">${isPurchased ? 'Kullan' : 'Satın Al'}</button>`;

    div.innerHTML = `
        <div class="nova-store-preview">
        <img src="${photo.url}" class="profile-photo nova-store-avatar-img" alt="${photo.name || 'Avatar'}" loading="lazy" decoding="async" onerror="this.style.opacity=0.35;this.alt='Görsel yüklenemedi'">
        </div>
        <div class="profile-photo-price">
            ${isPurchased ? '' : `${photo.price} <span class="diamond-icon">💎</span>`}
        </div>
        ${actionHtml}
    `;

    const button = div.querySelector('.profile-photo-button');
    if (button) {
      button.onclick = () => isPurchased
        ? useProfilePhoto(photo.url)
        : buyProfilePhoto(photo);
    }

    
    return div;
}

async function renderNameFrameStore(userData, container){
  const owned = userData.purchasedNameFrames || {};
  const active = userData.nameFrame || 'default';
  container.innerHTML = '';

  const defaultCard = document.createElement('div');
  defaultCard.className = 'profile-photo-item nova-store-card';
  defaultCard.innerHTML = `
    <div class="nova-store-preview nova-store-preview--nameframe">
      ${renderNameWithFrame(selectedStudent.studentName || 'Oyuncu', 'default')}
    </div>
    <div class="profile-photo-price"><span class="purchased-badge">Ucretsiz</span></div>
    ${active === 'default' ? novaStoreInUseMarkup() : '<button type="button" class="profile-photo-button use-button">Kullan</button>'}
  `;
  const defaultBtn = defaultCard.querySelector('.profile-photo-button');
  if (defaultBtn) defaultBtn.onclick = () => useNameFrame('default');
  container.appendChild(defaultCard);

  NAME_FRAME_ITEMS.forEach((item, index) => {
    const isOwned = !!owned[item.id];
    const isActive = active === item.id;
    const card = document.createElement('div');
    card.className = 'profile-photo-item nova-store-card';
    card.style.animationDelay = `${(index + 1) * 0.06}s`;
    card.innerHTML = `
      <div class="nova-store-preview nova-store-preview--nameframe">
        ${renderNameWithFrame(selectedStudent.studentName || 'Oyuncu', item.id)}
      </div>
      <div class="profile-photo-price">
        ${isOwned ? '' : `${item.price} <span class="diamond-icon">💎</span>`}
      </div>
      ${isActive ? novaStoreInUseMarkup() : `<button type="button" class="profile-photo-button ${isOwned ? 'use-button' : 'buy-button'}">${isOwned ? 'Kullan' : 'Satın Al'}</button>`}
    `;
    const button = card.querySelector('.profile-photo-button');
    if (button) button.onclick = () => isOwned ? useNameFrame(item.id) : buyNameFrame(item);
    container.appendChild(card);
  });
}

function getAvatarFrameClass(frameId){
  const id = String(frameId || 'default');
  if (id === 'series_world_champ') return 'af-worldchamp';
  if (id === 'series_girls_rose') return 'af-rosequeen';
  if (id === 'series_super_lite') return 'af-superlite';
  if (id === 'series_basic_buddy') return 'af-basicbuddy';
  if (id === 'deneme_champion') return 'af-denemechamp';
  return 'af-default';
}

function applyAvatarFrameToImage(el, frameId){
  if (!el) return;
  const nextFrame = frameId || 'default';
  const all = ['af-worldchamp', 'af-rosequeen', 'af-superlite', 'af-basicbuddy', 'af-denemechamp', 'af-default'];
  el.classList.remove(...all);
  el.classList.add('avatar-framed', getAvatarFrameClass(nextFrame));
  try{
    const parent = el.parentElement;
    if(parent){
      let wrap = parent.classList.contains('avatar-frame-wrap') ? parent : null;
      if(!wrap){
        wrap = document.createElement('span');
        wrap.className = 'avatar-frame-wrap';
        parent.insertBefore(wrap, el);
        wrap.appendChild(el);
      }
      const hideChampionTag =
        !!(el.closest('.ranking-table') || el.closest('#season-ranking-screen') || el.closest('.ranking-list'));
      wrap.classList.toggle('has-champion-mark', nextFrame === 'deneme_champion' && !hideChampionTag);
    }
  }catch(_){}
  try { el.dataset.avatarFrame = nextFrame; } catch(_){}
}

function applyOwnAvatarFrame(){
  const frame = resolveAvatarFrameByName(
    selectedStudent && selectedStudent.nameFrame,
    selectedStudent && selectedStudent.avatarFrame
  );
  applyAvatarFrameToImage(document.getElementById('student-photo'), frame);
  const storeIcon = document.getElementById('profile-icon');
  if (storeIcon) {
    try {
      storeIcon.classList.remove('avatar-framed', 'af-default', 'af-worldchamp', 'af-rosequeen', 'af-superlite', 'af-basicbuddy', 'af-denemechamp');
      delete storeIcon.dataset.avatarFrame;
    } catch(_) {}
  }
  applyAvatarFrameToImage(document.querySelector('#char_inv_hero .char-inv-hero-avatar'), frame);
  applyAvatarFrameToImage(document.getElementById('score-image'), frame);
  syncChampionDiamondBoosterUi();
}

async function useAvatarFrame(frameId){
  try{
    const studentRef = database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}`);
    await studentRef.update({ avatarFrame: frameId || 'default' });
    selectedStudent.avatarFrame = frameId || 'default';
    try{
      const key = `${selectedStudent.classId}:${selectedStudent.studentId}`;
      const prev = (__storeStudentCache && __storeStudentCache.data) ? __storeStudentCache.data : {};
      __storeStudentCache = { key, ts: Date.now(), data: { ...prev, avatarFrame: selectedStudent.avatarFrame } };
    }catch(_){}
    localStorage.setItem('selectedStudent', JSON.stringify(selectedStudent));
    applyOwnAvatarFrame();
    try { if (loggedinPlayerRef) await loggedinPlayerRef.update({ avatarFrame: selectedStudent.avatarFrame }); } catch(_){}
    const storeCat = (typeof window.novaGetActiveStoreCategory === 'function' && window.novaGetActiveStoreCategory()) || '';
    if (storeCat === '__avatarFrames') {
      const userData = (await getStoreStudentData(true)) || {};
      await renderAvatarFrameStore(userData, document.getElementById('profilePhotosContainer'));
    }
    try { await novaRefreshCharacterInventoryIfOpen(); } catch (_) {}
    await showAlert('✨ Avatar çerçevesi uygulandı!');
  }catch(e){
    console.error('Avatar çerçevesi uygulama hatası:', e);
    await showAlert('❌ Avatar çerçevesi uygulanamadı.');
  }
}

async function renderAvatarFrameStore(userData, container){
  const owned = userData.purchasedAvatarFrames || {};
  const active = userData.avatarFrame || 'default';
  container.innerHTML = '';
  const seriesState = await getSeriesAvatarFrameUnlockState(userData || {});

  const defaultCard = document.createElement('div');
  defaultCard.className = 'profile-photo-item nova-store-card';
  const defPhoto = (selectedStudent && selectedStudent.photo) || (document.getElementById('student-photo') && document.getElementById('student-photo').src) || '';
  defaultCard.innerHTML = `
    <div class="nova-store-preview nova-store-preview--avatar">
      <div class="store-avatar-frame af-default">
        <img src="${escapeHtml(defPhoto)}" class="nova-store-avatar-img avatar-framed af-default" alt="Avatar" loading="lazy" onerror="this.style.opacity=0.35">
      </div>
    </div>
    <div class="profile-photo-price"><span class="purchased-badge">Ucretsiz</span></div>
    ${active === 'default' ? novaStoreInUseMarkup() : '<button type="button" class="profile-photo-button use-button">Kullan</button>'}
  `;
  const defaultAfBtn = defaultCard.querySelector('.profile-photo-button');
  if (defaultAfBtn) defaultAfBtn.onclick = () => useAvatarFrame('default');
  container.appendChild(defaultCard);

  SERIES_AVATAR_FRAME_ITEMS.forEach((item, index) => {
    const isOwned = !!owned[item.id];
    const isActive = active === item.id;
    const unlock = seriesState[item.id] || { done:false, owned:0, total:0 };
    const canClaim = !isOwned && !!unlock.done;
    const bonusCup = Number(item.cupBonus || 0);
    const cost = Number(item.price || 0);
    const bonusTier = bonusCup >= 4 ? 'EPİK BONUS' : (bonusCup >= 2 ? 'GÜÇLÜ BONUS' : 'Standart');
    const statusLine = isOwned
      ? (isActive ? 'Şu an aktif — bonus hazır.' : 'Sende var. İstersen hemen tak.')
      : (canClaim ? 'Seri tamam! Şimdi açıp gücünü aktive et.' : 'Seriyi bitir, sonra bu gücü aç.');
    const progressLine = `${unlock.owned}/${unlock.total} seri parçası tamamlandı`;
    const perkLine = bonusCup > 0
      ? `Bu çerçeve takılıyken düello kazanırsan +${bonusCup} ekstra kupa alırsın.`
      : 'Bu çerçevede ekstra kupa bonusu yok.';
    const card = document.createElement('div');
    card.className = 'profile-photo-item nova-store-card';
    card.style.animationDelay = `${(index + 1) * 0.06}s`;
    const stPhoto = (selectedStudent && selectedStudent.photo) || (document.getElementById('student-photo') && document.getElementById('student-photo').src) || '';
    card.innerHTML = `
      <div class="nova-store-preview nova-store-preview--avatar">
        <div class="store-avatar-frame ${getAvatarFrameClass(item.id)}">
          <img src="${escapeHtml(stPhoto)}" class="nova-store-avatar-img avatar-framed ${getAvatarFrameClass(item.id)}" alt="Avatar" loading="lazy" onerror="this.style.opacity=0.35">
        </div>
      </div>
      <div class="profile-photo-price">
        ${isOwned
          ? ''
          : (canClaim
              ? `<span class="purchased-badge">🔥 Seri Tamamlandı • ${cost} kredi</span>`
              : `<span class="series-lock-note">${escapeHtml(item.unlockRuleText || 'Seriyi tamamla')}<br>${unlock.owned}/${unlock.total}</span>`)}
      </div>
      <div class="series-lock-note" style="margin-top:6px;max-width:220px;padding:8px 10px;border-radius:10px;border:1px solid rgba(148,163,184,.3);background:linear-gradient(180deg,rgba(30,41,59,.5),rgba(15,23,42,.65));color:#e2e8f0;line-height:1.35">
        <div style="font-weight:900;letter-spacing:.03em;color:${bonusCup >= 4 ? '#fde047' : (bonusCup >= 2 ? '#93c5fd' : '#cbd5e1')};margin-bottom:4px">⚡ ${bonusTier}</div>
        <div style="margin-bottom:4px">${escapeHtml(perkLine)}</div>
        <div style="font-size:11px;color:#cbd5e1;margin-bottom:3px">🎯 ${escapeHtml(statusLine)}</div>
        <div style="font-size:11px;color:#a5b4fc;margin-bottom:3px">🧩 ${escapeHtml(progressLine)}</div>
        <div style="font-size:11px;color:#fcd34d">💳 Açılış bedeli: ${cost} düello kredisi</div>
      </div>
      ${isActive ? novaStoreInUseMarkup() : `<button type="button" class="profile-photo-button ${isOwned ? 'use-button' : (canClaim ? 'use-button' : 'buy-button')}" ${!isOwned && !canClaim ? 'disabled' : ''}>${isOwned ? 'Kullan' : (canClaim ? `✨ ${cost} Kredi ile Aç` : 'Kilitli')}</button>`}
    `;
    const button = card.querySelector('.profile-photo-button');
    if (button) {
      if (isOwned) button.onclick = () => useAvatarFrame(item.id);
      else button.onclick = canClaim ? () => claimSeriesAvatarFrame(item) : null;
    }
    container.appendChild(card);
  });
}

async function buyNameFrame(item){
  try{
    const studentRef = database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}`);
    const snapshot = await studentRef.once('value');
    const userData = snapshot.val() || {};
    const currentDiamonds = Number(userData.diamond || 0);
    const cost = Number(item.price || 0);
    if (currentDiamonds < cost) {
      await showAlert('Yeterli elmasınız yok!');
      return;
    }
    const ok = await showConfirmation(`${cost} 💎 karşılığında "${item.name}" isim çerçevesini satın almak istiyor musunuz?`);
    if (!ok) return;
    await studentRef.update({
      diamond: currentDiamonds - cost,
      [`purchasedNameFrames/${item.id}`]: true
    });
    try{
      const key = `${selectedStudent.classId}:${selectedStudent.studentId}`;
      __storeStudentCache = { key, ts: Date.now(), data: { ...(userData||{}), diamond: currentDiamonds - cost, purchasedNameFrames: { ...(userData.purchasedNameFrames || {}), [item.id]: true } } };
    }catch(_){}
    document.getElementById('currentDiamonds').textContent = currentDiamonds - cost;
    await showAlert('✅ İsim çerçevesi satın alındı!');
    await renderNameFrameStore({
      ...userData,
      diamond: currentDiamonds - cost,
      purchasedNameFrames: { ...(userData.purchasedNameFrames || {}), [item.id]: true }
    }, document.getElementById('profilePhotosContainer'));
    try { await novaRefreshCharacterInventoryIfOpen(); } catch (_) {}
  }catch(e){
    console.error('İsim çerçevesi satın alma hatası:', e);
    await showAlert('❌ Satın alma sırasında bir hata oluştu.');
  }
}

async function useNameFrame(frameId){
  try{
    const studentRef = database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}`);
    await studentRef.update({ nameFrame: frameId || 'default' });
    selectedStudent.nameFrame = frameId || 'default';
    try{
      const key = `${selectedStudent.classId}:${selectedStudent.studentId}`;
      const prev = (__storeStudentCache && __storeStudentCache.data) ? __storeStudentCache.data : {};
      __storeStudentCache = { key, ts: Date.now(), data: { ...prev, nameFrame: selectedStudent.nameFrame } };
    }catch(_){}
    syncSelectedNameFrame(selectedStudent.nameFrame);
    applyOwnNameFrame();
    try { if (loggedinPlayerRef) await loggedinPlayerRef.update({ nameFrame: selectedStudent.nameFrame }); } catch(_){}
    const storeCat = (typeof window.novaGetActiveStoreCategory === 'function' && window.novaGetActiveStoreCategory()) || '';
    if (storeCat === '__nameFrames') {
      const snap = await studentRef.once('value');
      await renderNameFrameStore(snap.val() || {}, document.getElementById('profilePhotosContainer'));
    }
    try { await novaRefreshCharacterInventoryIfOpen(); } catch (_) {}
    await showAlert('✨ İsim çerçevesi uygulandı!');
  }catch(e){
    console.error('İsim çerçevesi uygulama hatası:', e);
    await showAlert('❌ İsim çerçevesi uygulanamadı.');
  }
}

/**
 * Satın alma akışı – DB'den kullanıcıyı okur, elması yeterliyse düşer ve purchasedPhotos'a işaretler.
 */
async function buyProfilePhoto(photo){
  try {
    const studentRef = database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}`);
    const snapshot = await studentRef.once('value');
    const userData = snapshot.val() || {};
    const currentDiamonds = userData.diamond || 0;
    const cost = Number(photo.price) || 0;
    if (currentDiamonds < cost){
      await showAlert('Yeterli elmasınız yok!');
      return;
    }
    // Onay
    const ok = await showConfirmation(`${cost} 💎 karşılığında bu görseli satın almak istediğinize emin misiniz?`);
    if(!ok) return;

    // purchasedPhotos anahtarını URL üzerinden btoa ile tutuyoruz (mevcut sistemle uyumlu)
    const encodedUrl = btoa(photo.url);
    const purchasedRef = database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}/purchasedPhotos/${encodedUrl}`);

    // Bakiyeden düş ve satın alındı olarak işaretle
    await studentRef.update({ diamond: currentDiamonds - cost });
    await purchasedRef.set(true);
    try{
      const key = `${selectedStudent.classId}:${selectedStudent.studentId}`;
      __storeStudentCache = { key, ts: Date.now(), data: { ...(userData||{}), diamond: currentDiamonds - cost, purchasedPhotos: { ...(userData.purchasedPhotos || {}), [encodedUrl]: true } } };
    }catch(_){}

    // Cache güncelle
    const purchasedCache = getFromCache(CACHE_KEYS.PURCHASED) || {};
    purchasedCache[encodedUrl] = true;
    saveToCache(CACHE_KEYS.PURCHASED, purchasedCache);

    document.getElementById('currentDiamonds').textContent = currentDiamonds - cost;
    await showAlert('✅ Satın alındı! Artık bu resmi kullanabilirsiniz.');

    const cat = novaResolveStoreCategory(
      (typeof window.novaGetActiveStoreCategory === 'function' && window.novaGetActiveStoreCategory()) || ''
    );
    await loadProfilePhotos(cat);
    try { await novaRefreshCharacterInventoryIfOpen(); } catch (_) {}
  } catch(e){
    console.error('Satın alma hatası:', e);
    await showAlert('❌ Satın alma sırasında bir hata oluştu.');
  }
}

document.getElementById('profileCloseButton')?.addEventListener('click', () => {
    if (typeof window.novaForceHideScreenLoader === 'function') window.novaForceHideScreenLoader();
    const ov = document.getElementById('profileChangeOverlay');
    if (ov) ov.style.display = 'none';
    try{ document.body.style.overflow = ''; }catch(_){}
});










// === NOVA: Mağaza açılış yardımcıları ===
async function novaOpenStore() {
  const overlay = document.getElementById('profileChangeOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  try {
    if (!window.__novaSpriteAssetsReady && typeof window.novaSpritePreloadAll === 'function') {
      try { await window.novaSpritePreloadAll(); } catch (_) {}
    }
    if (typeof window.novaShowScreenLoader === 'function') window.novaShowScreenLoader('store');
    await novaOpenStoreFlow();
  } catch(e) {
    console.error('Store init error', e);
  } finally {
    if (typeof window.novaHideScreenLoader === 'function') window.novaHideScreenLoader();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const chip = document.getElementById('nova_store_open_btn') || document.querySelector('.nova-store-chip');
  if (chip) {
    chip.addEventListener('click', function (e) {
      e.preventDefault();
      novaOpenStore();
    });
  }

  const oldFab = document.getElementById('nova_store_fab');
  if (oldFab && oldFab.parentNode) oldFab.parentNode.removeChild(oldFab);
});
// === /NOVA ===


// === NOVA FIX: Dynamic store categories ===
let NOVA_STORE_KEYS = [];

/** Fetch categories and normalize as {cat: [items...]} plus keys array. */
async function novaFetchStoreCategories() {
  const [snapI, snapM] = await Promise.all([
    database.ref('store/profilePhotosIndex').once('value'),
    database.ref('store/categoryMeta').once('value')
  ]);
  const indexData = snapI.val() || {};
  window.storeCategoryMeta = snapM.exists() ? (snapM.val() || {}) : {};
  NOVA_STORE_KEYS = [...new Set([...Object.keys(indexData), ...Object.keys(window.storeCategoryMeta || {})])].filter(k => k && k !== '_meta');
  photoCategories = {};
  NOVA_STORE_KEYS.forEach(k => { photoCategories[k] = photoCategories[k] || []; });
}

/** Render category buttons using NOVA_STORE_KEYS. */
function novaRenderCategoryButtons() {
  const holder = document.querySelector('.profile-categories');
  if (!holder) return;
  holder.innerHTML = '';
  holder.style.display = 'flex';

  if (!NOVA_STORE_KEYS.length) {
    // fallback visible info
    const span = document.createElement('span');
    span.textContent = 'Kategori bulunamadı';
    holder.appendChild(span);
    return;
  }

  const keys = NOVA_STORE_KEYS.slice();
  if (!keys.includes('__nameFrames')) keys.unshift('__nameFrames');
  if (!keys.includes('__avatarFrames')) keys.unshift('__avatarFrames');
  keys.forEach((k, idx) => {
    const btn = document.createElement('button');
    btn.className = 'category-button' + (idx === 0 ? ' active' : '');
    btn.dataset.category = k;
    btn.textContent = (k === '__nameFrames') ? 'İsim Çerçevesi' : (k === '__avatarFrames' ? 'Avatar Çerçevesi' : k);
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;
      document.querySelectorAll('.category-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadProfilePhotos(k);
    });
    holder.appendChild(btn);
  });
}

/** Open store flow: fetch -> hub tabs -> first category list. */
async function novaOpenStoreFlow() {
  await novaFetchStoreCategories();
  if (typeof window.novaStoreHubInit === 'function') {
    await window.novaStoreHubInit();
    return;
  }
  if (typeof window.renderStoreCategoryButtons === 'function') {
    window.renderStoreCategoryButtons();
  } else {
    novaRenderCategoryButtons();
  }
  const active = document.querySelector('.profile-categories .category-button.active');
  const first = (active && active.dataset.category) ? active.dataset.category : ((typeof window.novaGetDefaultAvatarCategoryKeys === 'function' && window.novaGetDefaultAvatarCategoryKeys()[0]) || 'bilim_kosesi');
  await loadProfilePhotos(first);
}
// === /NOVA FIX ===

// === KARAKTER: envanter / kostüm & çerçeve sandığı ===
function novaSyncStudentFromStorage() {
  try {
    if (typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId) {
      try {
        window.selectedStudent = selectedStudent;
      } catch (_) {}
      return true;
    }
    const raw = localStorage.getItem('selectedStudent');
    if (!raw) return false;
    const o = JSON.parse(raw);
    if (!o || !o.studentId) return false;
    if (typeof selectedStudent !== 'undefined') {
      Object.assign(selectedStudent, o);
    }
    window.selectedStudent = o;
    return true;
  } catch (_) {
    return false;
  }
}

function novaCharSafeAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '');
}

function novaFindPhotoMetaByUrl(url) {
  const u = String(url || '').trim();
  if (!u) return null;
  const cats = photoCategories || {};
  for (const k of Object.keys(cats)) {
    if (k === '__nameFrames' || k === 'duel') continue;
    const arr = cats[k];
    if (!Array.isArray(arr)) continue;
    const hit = arr.find((p) => p && p.url === u);
    if (hit) return { ...hit, category: k };
  }
  return null;
}

/** Satın alınan avatar URL’si için mağazada yalnızca gerekli yaprakları oku (tüm kategorileri toplu indirme yok). */
async function novaEnsurePhotoMetaForUrl(url) {
  const u = String(url || '').trim();
  if (!u) return null;
  const cached = novaFindPhotoMetaByUrl(u);
  if (cached) return cached;
  const catKeys = (typeof NOVA_STORE_KEYS !== 'undefined' && NOVA_STORE_KEYS && NOVA_STORE_KEYS.length)
    ? NOVA_STORE_KEYS
    : Object.keys(photoCategories || {});
  const shallowFn = typeof window.novaRtdbShallowKeys === 'function' ? window.novaRtdbShallowKeys : null;
  for (const cat of catKeys) {
    if (!cat || cat === '__nameFrames' || cat === '__avatarFrames' || cat === 'duel') continue;
    if (Array.isArray(photoCategories[cat]) && photoCategories[cat].length) {
      const hit = photoCategories[cat].find((p) => p && p.url === u);
      if (hit) return { ...hit, category: cat };
      continue;
    }
    if (!shallowFn) break;
    let ids = [];
    try {
      ids = await shallowFn('store/profilePhotos/' + cat) || [];
    } catch (_) {
      continue;
    }
    if (!ids.length) continue;
    const BATCH = 10;
    for (let i = 0; i < ids.length; i += BATCH) {
      const chunk = ids.slice(i, i + BATCH).filter((id) => id !== '_meta');
      const metas = await Promise.all(chunk.map(async (id) => {
        try {
          const snap = await database.ref('store/profilePhotos/' + cat + '/' + id).once('value');
          if (!snap.exists()) return null;
          const o = snap.val() || {};
          if (String(o.url || '') !== u) return null;
          if (typeof o.url !== 'string' || typeof o.price !== 'number') return null;
          return {
            id: id,
            url: o.url,
            price: o.price,
            name: o.name || id,
            allowedStudents: o.allowedStudents || null
          };
        } catch (_) {
          return null;
        }
      }));
      const found = metas.find(Boolean);
      if (found) {
        if (!Array.isArray(photoCategories[cat])) photoCategories[cat] = [];
        if (!photoCategories[cat].find((p) => p && p.id === found.id)) photoCategories[cat].push(found);
        return { ...found, category: cat };
      }
    }
  }
  return null;
}

let __charInvRenderInFlight = false;
let __charInvRefreshQueued = false;
let __charInvLastSig = '';
let __charInvStudentCache = { key:'', ts:0, data:null };
let __charInvNameFrameCatalogTs = 0;
let __charInvRenderSeq = 0;

async function getCharacterInventoryStudentData(force = false){
  if (!selectedStudent || !selectedStudent.classId || !selectedStudent.studentId) return null;
  const key = `${selectedStudent.classId}:${selectedStudent.studentId}`;
  const now = Date.now();
  if (!force && __charInvStudentCache.key === key && __charInvStudentCache.data && (now - __charInvStudentCache.ts) < 3500){
    return __charInvStudentCache.data;
  }
  if (!force && __storeStudentCache && __storeStudentCache.key === key && __storeStudentCache.data && (now - __storeStudentCache.ts) < 3500){
    __charInvStudentCache = { key, ts: now, data: __storeStudentCache.data };
    return __storeStudentCache.data;
  }
  const snap = await database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}`).once('value');
  const data = snap.exists() ? (snap.val() || {}) : {};
  __charInvStudentCache = { key, ts: now, data };
  return data;
}

async function ensureNameFrameCatalogFresh(){
  if (__charInvNameFrameCatalogTs && (Date.now() - __charInvNameFrameCatalogTs) < 90000) return;
  await loadNameFrameCatalogFromDB();
  __charInvNameFrameCatalogTs = Date.now();
}

function charInvNodeFromHtml(html){
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

async function charInvEnsurePhotoMetas(entries, renderSeq){
  const list = (entries || []).filter((e) => e && e.url && !e.meta);
  if (!list.length) return;
  const BATCH = 8;
  for (let i = 0; i < list.length; i += BATCH) {
    if (renderSeq !== __charInvRenderSeq) return;
    await Promise.all(list.slice(i, i + BATCH).map(async (entry) => {
      try {
        const meta = await novaEnsurePhotoMetaForUrl(entry.url);
        if (meta) entry.meta = meta;
      } catch (_) {}
    }));
  }
}

function charInvWaitGridImages(rootEl, maxMs){
  return new Promise(function(resolve){
    const cap = maxMs || 2000;
    const timer = setTimeout(resolve, cap);
    if (!rootEl || !rootEl.querySelectorAll) {
      clearTimeout(timer);
      return resolve();
    }
    const imgs = Array.from(rootEl.querySelectorAll('img'));
    if (!imgs.length) {
      clearTimeout(timer);
      return resolve();
    }
    let pending = 0;
    imgs.forEach(function(img){
      if (!img.complete) pending++;
    });
    if (!pending) {
      clearTimeout(timer);
      return resolve();
    }
    const finish = function(){
      pending--;
      if (pending <= 0) {
        clearTimeout(timer);
        resolve();
      }
    };
    imgs.forEach(function(img){
      if (!img.complete) {
        img.addEventListener('load', finish, { once: true });
        img.addEventListener('error', finish, { once: true });
      }
    });
  });
}

async function charInvAppendProgressive(gridEl, nodes, renderSeq){
  if (!gridEl || !Array.isArray(nodes) || !nodes.length) return;
  const isLow = !!((navigator && navigator.deviceMemory && navigator.deviceMemory <= 4) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
  const first = isLow ? 12 : 18;
  const chunk = isLow ? 8 : 12;
  let i = 0;
  const push = (n) => {
    const frag = document.createDocumentFragment();
    const end = Math.min(nodes.length, i + n);
    for (; i < end; i++) frag.appendChild(nodes[i]);
    gridEl.appendChild(frag);
  };
  push(first);
  while (i < nodes.length) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (renderSeq !== __charInvRenderSeq) return;
    push(chunk);
  }
}

async function novaRefreshCharacterInventoryIfOpen() {
  try {
    const ov = document.getElementById('characterInventoryOverlay');
    if (!ov || ov.style.display !== 'flex') return;
    if (__charInvRenderInFlight) {
      __charInvRefreshQueued = true;
      return;
    }
    __charInvRenderInFlight = true;
    await novaRenderCharacterInventory();
    __charInvRenderInFlight = false;
    if (__charInvRefreshQueued) {
      __charInvRefreshQueued = false;
      __charInvRenderInFlight = true;
      await novaRenderCharacterInventory();
      __charInvRenderInFlight = false;
    }
  } catch (_) {}
}

async function novaRenderCharacterInventory() {
  const renderSeq = ++__charInvRenderSeq;
  const hero = document.getElementById('char_inv_hero');
  const panelP = document.getElementById('char_inv_panel_photos');
  const panelF = document.getElementById('char_inv_panel_frames');
  if (!hero || !panelP || !panelF) return;

  novaSyncStudentFromStorage();
  if (typeof selectedStudent === 'undefined' || !selectedStudent || !selectedStudent.studentId || !selectedStudent.classId) {
    hero.innerHTML = '<p class="char-inv-warn">Önce giriş yapmalısın.</p>';
    panelP.innerHTML = '';
    panelF.innerHTML = '';
    return;
  }

  const [, userDataRaw] = await Promise.all([
    ensureNameFrameCatalogFresh(),
    getCharacterInventoryStudentData()
  ]);
  const userData = userDataRaw || {};

  const purchasedRaw = userData.purchasedPhotos || {};
  try {
    saveToCache(CACHE_KEYS.PURCHASED, purchasedRaw);
  } catch (_) {}

  const spEl = document.getElementById('student-photo');
  const currentPhoto = String(userData.photo || (spEl && spEl.src) || '').trim();
  const activeFrame = userData.nameFrame || selectedStudent.nameFrame || 'default';
  const activeAvatarFrame = resolveAvatarFrameByName(
    userData.nameFrame || selectedStudent.nameFrame,
    userData.avatarFrame || selectedStudent.avatarFrame
  );
  const diamonds = Number(userData.diamond || 0);
  const cup = Number(userData.gameCup || 0);
  const rawName = String(userData.name || selectedStudent.studentName || 'Oyuncu').trim() || 'Oyuncu';

  const photoEntries = Object.keys(purchasedRaw)
    .filter((k) => purchasedRaw[k])
    .map((encoded) => {
      let url = '';
      try {
        url = atob(encoded);
      } catch (_) {
        return null;
      }
      if (!url || !/^https?:\/\//i.test(url)) return null;
      const meta = novaFindPhotoMetaByUrl(url);
      return { encoded, url, meta };
    })
    .filter(Boolean);

  photoEntries.sort((a, b) => {
    const ae = a.url === currentPhoto ? 1 : 0;
    const be = b.url === currentPhoto ? 1 : 0;
    return be - ae;
  });

  await charInvEnsurePhotoMetas(photoEntries, renderSeq);
  if (renderSeq !== __charInvRenderSeq) return;

  const ownedFrames = userData.purchasedNameFrames || {};
  const ownedAvatarFrames = userData.purchasedAvatarFrames || {};
  const extraOwned = Object.keys(ownedFrames).filter((id) => ownedFrames[id] && id !== 'default').length;
  const extraOwnedAvatar = Object.keys(ownedAvatarFrames).filter((id) => ownedAvatarFrames[id] && id !== 'default').length;
  const ownedFrameCount = 1 + extraOwned;

  const sig = [
    currentPhoto,
    activeFrame,
    activeAvatarFrame,
    diamonds,
    cup,
    rawName,
    Object.keys(purchasedRaw).length,
    extraOwned,
    extraOwnedAvatar
  ].join('|');
  if (sig === __charInvLastSig) return;
  __charInvLastSig = sig;

  const photoSrc =
    currentPhoto ||
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect fill="%231e293b" width="120" height="120" rx="20"/><text x="60" y="68" text-anchor="middle" font-size="36" fill="%2394a3b8">?</text></svg>'
    );

  let starsHtml = '';
  try {
    if (typeof getStars === 'function') starsHtml = getStars(cup);
  } catch (_) {}

  hero.innerHTML = `
    <div class="char-inv-hero-avatar-wrap">
      <img class="char-inv-hero-avatar avatar-framed ${getAvatarFrameClass(activeAvatarFrame)}" src="${novaCharSafeAttr(photoSrc)}" alt="">
    </div>
    <div>
      <div class="char-inv-hero-name">${renderNameWithFrame(rawName, activeFrame)}</div>
      <div class="char-inv-hero-stats">
        <span class="char-inv-stat-pill"><span class="e">💎</span> ${diamonds}</span>
        <span class="char-inv-stat-pill"><span class="e">🏆</span> ${cup}</span>
      </div>
      <p class="char-inv-summary-line">🎁 Hazine: <b>${photoEntries.length}</b> avatar · <b>${ownedFrameCount}</b> isim süsü · <b>${extraOwnedAvatar}</b> avatar çerçevesi</p>
      ${starsHtml ? `<div class="char-inv-hero-stats" style="margin-top:6px">${starsHtml}</div>` : ''}
    </div>
  `;

  if (!photoEntries.length) {
    panelP.innerHTML = `
      <div class="char-inv-empty">
        <div class="big" aria-hidden="true">🎭</div>
        <h3>Henüz avatarın yok</h3>
        <p>Mağazadan sana özel avatarlar seçebilirsin. Satın aldıkların burada listelenir.</p>
        <button type="button" class="char-inv-cta char-inv-cta-store">Mağazaya git 🛒</button>
      </div>`;
  } else {
    let i = 0;
    panelP.innerHTML = `<div class="char-inv-grid" id="char_inv_grid_photos"></div>`;
    const gridP = document.getElementById('char_inv_grid_photos');
    const photoNodes = photoEntries.map((entry) => {
      const title = escapeHtml((entry.meta && entry.meta.name) || 'Özel avatar');
      const eq = entry.url === currentPhoto;
      const delay = (i++ * 0.05).toFixed(2);
      return charInvNodeFromHtml(`
        <div class="char-inv-card${eq ? ' equipped' : ''}" style="animation-delay:${delay}s">
          ${eq ? '<span class="char-inv-badge">Takılı</span>' : ''}
          <div class="char-inv-thumb-wrap">
            <img class="char-inv-thumb" src="${novaCharSafeAttr(entry.url)}" alt="">
          </div>
          <div class="char-inv-card-title">${title}</div>
          ${eq
            ? '<span class="char-inv-in-use" role="status">Kullanımda</span>'
            : `<button type="button" class="char-inv-action" data-char-use-photo="${novaCharSafeAttr(entry.url)}">👕 Giy</button>`}
        </div>`);
    }).filter(Boolean);
    await charInvAppendProgressive(gridP, photoNodes, renderSeq);
  }

  const framesList = [{ id: 'default', name: 'Klasik çerçeve' }];
  NAME_FRAME_ITEMS.forEach((item) => {
    if (ownedFrames[item.id]) framesList.push({ id: item.id, name: item.name });
  });
  const avatarFramesList = [{ id: 'default', name: 'Klasik avatar çerçevesi' }];
  SERIES_AVATAR_FRAME_ITEMS.forEach((item) => {
    if (ownedAvatarFrames[item.id]) avatarFramesList.push({ id: item.id, name: item.name });
  });

  let j = 0;
  let k = 0;
  panelF.innerHTML =
    `<div class="char-inv-summary-line" style="margin:0 0 10px"><b>✨ İsim Süslerim</b></div>` +
    `<div class="char-inv-grid" id="char_inv_grid_nameframes"></div>` +
    (extraOwnedAvatar === 0
      ? `<p class="char-inv-summary-line" style="margin:10px 0 12px">💡 İpucu: Mağazada “Avatar Çerçevesi” bölümünden neon çerçeveler açabilirsin.</p>`
      : '') +
    `<div class="char-inv-summary-line" style="margin:4px 0 10px"><b>🧿 Avatar Çerçevelerim</b></div>` +
    `<div class="char-inv-grid" id="char_inv_grid_avatarframes"></div>`;

  const nfGrid = document.getElementById('char_inv_grid_nameframes');
  const afGrid = document.getElementById('char_inv_grid_avatarframes');
  const nfNodes = framesList.map((fr) => {
    const fid = fr.id;
    const eq = fid === activeFrame;
    const delay = (j++ * 0.05).toFixed(2);
    const preview = renderNameWithFrame(rawName, fid);
    return charInvNodeFromHtml(`
      <div class="char-inv-card${eq ? ' equipped' : ''}" style="animation-delay:${delay}s">
        ${eq ? '<span class="char-inv-badge">Takılı</span>' : ''}
        <div class="char-inv-frame-preview">${preview}</div>
        <div class="char-inv-card-title">${escapeHtml(fr.name)}</div>
        ${eq
          ? '<span class="char-inv-in-use" role="status">Kullanımda</span>'
          : `<button type="button" class="char-inv-action" data-char-use-frame="${novaCharSafeAttr(fid)}">✨ Tak</button>`}
      </div>`);
  }).filter(Boolean);
  await charInvAppendProgressive(nfGrid, nfNodes, renderSeq);
  if (renderSeq !== __charInvRenderSeq) return;

  const afNodes = avatarFramesList.map((fr) => {
    const fid = fr.id;
    const eq = fid === activeAvatarFrame;
    const delay = (k++ * 0.05).toFixed(2);
    const afClass = getAvatarFrameClass(fid);
    return charInvNodeFromHtml(`
      <div class="char-inv-card${eq ? ' equipped' : ''}" style="animation-delay:${delay}s">
        ${eq ? '<span class="char-inv-badge">Takılı</span>' : ''}
        <div class="char-inv-thumb-wrap char-inv-thumb-wrap--frame">
          <div class="store-avatar-frame ${afClass}">
            <img class="char-inv-thumb avatar-framed ${afClass}" src="${novaCharSafeAttr(photoSrc)}" alt="" data-char-inv-frame="${novaCharSafeAttr(fid)}">
          </div>
        </div>
        <div class="char-inv-card-title">${escapeHtml(fr.name)}</div>
        ${eq
          ? '<span class="char-inv-in-use" role="status">Kullanımda</span>'
          : `<button type="button" class="char-inv-action" data-char-use-avatar-frame="${novaCharSafeAttr(fid)}">✨ Tak</button>`}
      </div>`);
  }).filter(Boolean);
  await charInvAppendProgressive(afGrid, afNodes, renderSeq);
  if (renderSeq !== __charInvRenderSeq) return;

  try {
    applyAvatarFrameToImage(document.querySelector('#char_inv_hero .char-inv-hero-avatar'), activeAvatarFrame);
    afGrid.querySelectorAll('.char-inv-thumb[data-char-inv-frame]').forEach((img) => {
      const fid = img.getAttribute('data-char-inv-frame') || 'default';
      applyAvatarFrameToImage(img, fid);
    });
  } catch (_) {}

  panelP.querySelector('.char-inv-cta-store')?.addEventListener('click', () => {
    novaCloseCharacterInventory();
    novaOpenStore();
  });
  panelF.querySelector('.char-inv-cta-store')?.addEventListener('click', () => {
    novaCloseCharacterInventory();
    novaOpenStore();
  });

  if (renderSeq === __charInvRenderSeq) {
    await Promise.race([
      Promise.all([
        charInvWaitGridImages(panelP, 2200),
        charInvWaitGridImages(panelF, 2200)
      ]),
      new Promise(function(r){ setTimeout(r, 2200); })
    ]);
  }
}

let __charInvActionsBound = false;
function novaBindCharacterInventoryActionsOnce() {
  if (__charInvActionsBound) return;
  __charInvActionsBound = true;
  document.addEventListener('click', async function (ev) {
    const t = ev && ev.target;
    if (!t || typeof t.closest !== 'function') return;
    const btn = t.closest('button[data-char-use-photo], button[data-char-use-frame], button[data-char-use-avatar-frame]');
    if (!btn) return;
    if (btn.classList.contains('is-on')) return;
    try {
      if (btn.hasAttribute('data-char-use-photo')) {
        const u = btn.getAttribute('data-char-use-photo');
        if (!u) return;
        await useProfilePhoto(u);
        return;
      }
      if (btn.hasAttribute('data-char-use-frame')) {
        const fid = btn.getAttribute('data-char-use-frame');
        await useNameFrame(fid || 'default');
        return;
      }
      if (btn.hasAttribute('data-char-use-avatar-frame')) {
        const fid = btn.getAttribute('data-char-use-avatar-frame');
        await useAvatarFrame(fid || 'default');
      }
    } catch (e) {
      console.warn('Karakter envanteri aksiyonu başarısız:', e);
    }
  });
}

async function novaOpenCharacterInventory() {
  novaBindCharacterInventoryActionsOnce();
  novaSyncStudentFromStorage();
  if (typeof selectedStudent === 'undefined' || !selectedStudent || !selectedStudent.studentId) {
    await showAlert('Önce giriş yapmalısın!');
    return;
  }
  const ov = document.getElementById('characterInventoryOverlay');
  if (!ov) return;
  ov.style.display = 'flex';
  ov.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  try {
    if (typeof window.novaShowScreenLoader === 'function') window.novaShowScreenLoader('character');
    __charInvLastSig = '';
    await novaRenderCharacterInventory();
  } catch (e) {
    console.error('Karakter envanteri yüklenemedi:', e);
    await showAlert('Sandık açılırken bir sorun oluştu. Tekrar dene.');
  } finally {
    if (typeof window.novaHideScreenLoader === 'function') window.novaHideScreenLoader();
  }
}

function novaCloseCharacterInventory() {
  try {
    novaCloseLessonStatusPanel();
  } catch (_) {}
  if (typeof window.novaForceHideScreenLoader === 'function') window.novaForceHideScreenLoader();
  const ov = document.getElementById('characterInventoryOverlay');
  if (!ov) return;
  ov.style.display = 'none';
  ov.setAttribute('aria-hidden', 'true');
  try {
    document.body.style.overflow = '';
  } catch (_) {}
}

let __novaPlayerTopicNameMap = null;
let __novaPlayerTopicNameMapTs = 0;
const NOVA_PLAYER_TOPIC_INDEX_MS = NOVA_CHAMPION_HEADINGS_TTL_MS;

async function novaEnsurePlayerTopicNameMap() {
  const now = Date.now();
  if (__novaPlayerTopicNameMap && now - __novaPlayerTopicNameMapTs < NOVA_PLAYER_TOPIC_INDEX_MS) {
    return __novaPlayerTopicNameMap;
  }
  const out = {};
  try {
    const hids = await novaChampionChildKeys('championData/headings');
    if (hids === null) {
      const data = await readValCached('championData/headings', NOVA_CHAMPION_HEADINGS_TTL_MS);
      if (data && typeof data === 'object') {
        Object.keys(data).forEach(function (hid) {
          const lessons = (data[hid] && data[hid].lessons) || {};
          Object.keys(lessons).forEach(function (lid) {
            const topics = (lessons[lid] && lessons[lid].topics) || {};
            Object.keys(topics).forEach(function (tid) {
              const tv = topics[tid] || {};
              out[tid] = tv.name || tv.label || tv.topicName || tid;
            });
          });
        });
      }
    } else {
      for (let hi = 0; hi < hids.length; hi++) {
        const hid = hids[hi];
        const lids = await novaChampionChildKeys('championData/headings/' + hid + '/lessons') || [];
        for (let li = 0; li < lids.length; li++) {
          const lid = lids[li];
          const tids = await novaChampionChildKeys('championData/headings/' + hid + '/lessons/' + lid + '/topics') || [];
          const topicBatch = 18;
          for (let ti = 0; ti < tids.length; ti += topicBatch) {
            const chunk = tids.slice(ti, ti + topicBatch);
            await Promise.all(chunk.map(async function (tid) {
              const nameVal = await novaReadChampionLeaf(
                'championData/headings/' + hid + '/lessons/' + lid + '/topics/' + tid + '/name'
              );
              out[tid] = (nameVal != null && nameVal !== '') ? String(nameVal) : tid;
            }));
          }
        }
      }
    }
  } catch (e) {
    console.warn('Konu adları yüklenemedi:', e);
  }
  __novaPlayerTopicNameMap = out;
  __novaPlayerTopicNameMapTs = now;
  return out;
}

function novaResolvePlayerTopicLabel(raw, map) {
  const key = String(raw || '').trim();
  if (!key) return 'Konu';
  if (map && map[key]) return map[key];
  return key;
}

function novaKidFriendlyTopicCounts(total, correct, wrong) {
  const t = Number(total) || 0;
  const c = Number(correct) || 0;
  const w = Number(wrong) || 0;
  return `${t} soruda ${c} doğru, ${w} yanlış`;
}

function novaKidFriendlyTopicVerdict(total, correct, wrong) {
  const t = Number(total) || 0;
  const c = Number(correct) || 0;
  const w = Number(wrong) || 0;
  if (t < 4) {
    return {
      tone: 'ok',
      emoji: '📚',
      title: 'Daha yeni başlıyorsun',
      text: 'Bu konuda henüz az soru çözdün. Biraz daha oynayınca nasıl gittiğin netleşir.'
    };
  }
  const ratio = t ? c / t : 0;
  if (w === 0) {
    return {
      tone: 'star',
      emoji: '🌟',
      title: 'Süpersin!',
      text: 'Bu konuda hiç yanlışın yok. Böyle devam!'
    };
  }
  if (ratio >= 0.75) {
    return {
      tone: 'ok',
      emoji: '🙂',
      title: 'Güzel gidiyorsun',
      text: 'Çoğu soruyu doğru yapmışsın. Ara sıra tekrar etmek yine de iyi olur.'
    };
  }
  if (c >= w) {
    return {
      tone: 'ok',
      emoji: '💡',
      title: 'Birazcık takılıyor olabilirsin',
      text: 'Doğruların biraz daha fazla; yine de bazı sorular seni zorlamış. Kısa bir tekrar faydalı olur.'
    };
  }
  return {
    tone: 'grow',
    emoji: '🌱',
    title: 'Burada zorlanıyor olabilirsin',
    text: 'Bu konuda yanlışların biraz daha fazla. Öğretmenine sorabilir veya ödevlerinden tekrar edebilirsin — pes etme!'
  };
}

async function novaLoadAndRenderLessonStatus() {
  const body = document.getElementById('char_lesson_status_body');
  if (!body) return;
  body.innerHTML = '<p class="char-inv-summary-line">Yükleniyor…</p>';
  novaSyncStudentFromStorage();
  if (typeof selectedStudent === 'undefined' || !selectedStudent || !selectedStudent.studentId) {
    body.innerHTML = '<p class="char-inv-warn">Önce giriş yapmalısın.</p>';
    return;
  }
  const sid = selectedStudent.studentId;
  let map;
  let perfSnap;
  try {
    map = await novaEnsurePlayerTopicNameMap();
    perfSnap = await database.ref('analytics/topicPerf/' + sid).orderByChild('at').limitToLast(300).once('value');
  } catch (e) {
    console.warn('Ders durumu okuma:', e);
    body.innerHTML =
      '<p class="char-inv-warn">Veriler şu an okunamadı. İnternetini kontrol et veya biraz sonra tekrar dene.</p>';
    return;
  }
  const topicAgg = {};
  if (perfSnap.exists()) {
    perfSnap.forEach((ch) => {
      const v = ch.val() || {};
      const total = Number(v.total || 0);
      const wrong = Number(v.wrong || 0);
      const correct = Math.max(0, total - wrong);
      const tKey = v.topic || '-';
      const tname = novaResolvePlayerTopicLabel(tKey, map);
      if (!topicAgg[tname]) topicAgg[tname] = { total: 0, correct: 0, wrong: 0 };
      topicAgg[tname].total += total;
      topicAgg[tname].correct += correct;
      topicAgg[tname].wrong += wrong;
    });
  }
  const names = Object.keys(topicAgg);
  if (!names.length) {
    body.innerHTML = `
      <div class="char-inv-empty">
        <div class="big" aria-hidden="true">📘</div>
        <h3>Henüz kayıt yok</h3>
        <p>Düello oynadıkça konularına göre özetin burada görünür. Hadi bir düello dene!</p>
      </div>`;
    return;
  }
  const rows = names
    .map((topic) => {
      const v = topicAgg[topic];
      const verdict = novaKidFriendlyTopicVerdict(v.total, v.correct, v.wrong);
      return { topic, ...v, verdict };
    })
    .sort((a, b) => {
      const ra = a.total ? a.correct / a.total : 1;
      const rb = b.total ? b.correct / b.total : 1;
      if (ra !== rb) return ra - rb;
      return b.wrong - a.wrong;
    });

  body.innerHTML = `
    <p class="char-lesson-intro">Burada <b>hangi konularda</b> nasıl gittiğini görüyorsun. <b>Yüzde yok</b> — sadece sayılar ve sana uygun kısa cümleler var. <b>Üstte</b> biraz daha takıldığın konular, <b>aşağıya</b> doğru daha iyi gidenler sıralanır.</p>
    <div class="char-lesson-cards">${rows
      .map((r) => {
        const safeTopic = escapeHtml(r.topic);
        const v = r.verdict;
        return `
      <div class="char-lesson-card char-lesson-tone-${v.tone}">
        <div class="char-lesson-card-top"><span class="char-lesson-emoji" aria-hidden="true">${v.emoji}</span><strong>${safeTopic}</strong></div>
        <p class="char-lesson-numbers">${novaKidFriendlyTopicCounts(r.total, r.correct, r.wrong)}</p>
        <p class="char-lesson-verdict-title">${escapeHtml(v.title)}</p>
        <p class="char-lesson-verdict-text">${escapeHtml(v.text)}</p>
      </div>`;
      })
      .join('')}</div>`;
}

function novaOpenLessonStatusPanel() {
  const p = document.getElementById('char_lesson_status_panel');
  if (!p) return;
  p.hidden = false;
  novaLoadAndRenderLessonStatus();
}

function novaCloseLessonStatusPanel() {
  const p = document.getElementById('char_lesson_status_panel');
  if (!p) return;
  p.hidden = true;
}

function novaWireCharacterInventoryUi() {
  const openBtn = document.getElementById('nova_character_open_btn');
  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      novaOpenCharacterInventory();
    });
    openBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        novaOpenCharacterInventory();
      }
    });
  }
  document.getElementById('char_inv_close')?.addEventListener('click', () => novaCloseCharacterInventory());
  document.getElementById('char_inv_lesson_status')?.addEventListener('click', () => novaOpenLessonStatusPanel());
  document.getElementById('char_lesson_status_back')?.addEventListener('click', () => novaCloseLessonStatusPanel());
  document.getElementById('char_inv_open_store')?.addEventListener('click', () => {
    novaCloseCharacterInventory();
    novaOpenStore();
  });
  const overlayEl = document.getElementById('characterInventoryOverlay');
  overlayEl?.addEventListener('click', (e) => {
    if (e.target === overlayEl) novaCloseCharacterInventory();
  });
  document.querySelectorAll('[data-char-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-char-tab');
      document.querySelectorAll('[data-char-tab]').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      const pPhotos = document.getElementById('char_inv_panel_photos');
      const pFrames = document.getElementById('char_inv_panel_frames');
      const pHeroes = document.getElementById('char_inv_panel_heroes');
      if (tab === 'frames') {
        if (pPhotos) pPhotos.hidden = true;
        if (pFrames) pFrames.hidden = false;
        if (pHeroes) pHeroes.hidden = true;
      } else if (tab === 'heroes') {
        if (pPhotos) pPhotos.hidden = true;
        if (pFrames) pFrames.hidden = true;
        if (pHeroes) pHeroes.hidden = false;
      } else {
        if (pPhotos) pPhotos.hidden = false;
        if (pFrames) pFrames.hidden = true;
        if (pHeroes) pHeroes.hidden = true;
      }
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const ov = document.getElementById('characterInventoryOverlay');
    if (!ov || ov.style.display !== 'flex') return;
    const lesson = document.getElementById('char_lesson_status_panel');
    if (lesson && !lesson.hidden) {
      novaCloseLessonStatusPanel();
      return;
    }
    novaCloseCharacterInventory();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    novaWireCharacterInventoryUi();
  } catch (e) {
    console.warn('Karakter UI bağlama:', e);
  }
  try { setTimeout(refreshDuelEntryGateNote, 700); } catch(_){}
  try { setTimeout(refreshDuelEntryGateNote, 2000); } catch(_){}
});

function novaIsElementVisibleById(id){
  const el = document.getElementById(id);
  if (!el) return false;
  const st = window.getComputedStyle(el);
  return st.display !== 'none' && st.visibility !== 'hidden' && st.opacity !== '0';
}
function novaSyncMainScreenScrollLock(){
  try{
    const root = document.documentElement;
    const mainVisible = novaIsElementVisibleById('main-screen');
    document.body.classList.toggle('nova-main-screen-visible', mainVisible);
    root.classList.toggle('nova-main-screen-visible', mainVisible);
    if (!mainVisible){
      root.classList.remove('nova-lock-main-scroll');
      document.body.classList.remove('nova-lock-main-scroll');
      return;
    }
    const overlayIds = [
      'characterInventoryOverlay',
      'profileOverlay',
      'friends-screen',
      'homework-screen',
      'daily-puzzle-screen',
      'fillblank-screen',
      'match-screen',
      'duel-game-screen',
      'single-player-game-screen'
    ];
    const hasForegroundOverlay = overlayIds.some(novaIsElementVisibleById);
    const main = document.getElementById('main-screen');
    const contentTooTall = !!(main && (main.offsetHeight > (window.innerHeight - 8)));
    const shouldLock = mainVisible && !hasForegroundOverlay && !contentTooTall;
    root.classList.toggle('nova-lock-main-scroll', shouldLock);
    document.body.classList.toggle('nova-lock-main-scroll', shouldLock);
  }catch(_){}
}
setInterval(novaSyncMainScreenScrollLock, 450);
window.addEventListener('resize', novaSyncMainScreenScrollLock);
window.addEventListener('orientationchange', novaSyncMainScreenScrollLock);
// === /KARAKTER ===

// Kayıt sistemi için gerekli DOM elementleri
const registerButton = document.getElementById('register-button');
const registrationOverlay = document.getElementById('registrationOverlay');
const closeRegistration = document.getElementById('closeRegistration');
const registerClassSelect = document.getElementById('registerClassSelect');
const registerUsername = document.getElementById('registerUsername');
const registerPassword = document.getElementById('registerPassword');
const registerEmail = document.getElementById('registerEmail');
const submitRegistration = document.getElementById('submitRegistration');
const registrationError = document.getElementById('registrationError');
const verificationOverlay = document.getElementById('verificationOverlay');

// Modal açma/kapama olayları
if (registerButton) {
    registerButton.addEventListener('click', () => {
        if (registrationOverlay) registrationOverlay.style.display = 'flex';
        loadClassesForRegistration();
        try {
            if (window.novaEnhanceGameSelects && registrationOverlay) {
                window.novaEnhanceGameSelects(registrationOverlay);
            }
        } catch (_) {}
    });
}

if (closeRegistration) {
    closeRegistration.addEventListener('click', () => {
        if (registrationOverlay) registrationOverlay.style.display = 'none';
        resetRegistrationForm();
    });
}

// Sınıf listesini yükleme fonksiyonu (tam /classes ağacı yok)
function appendSortedClassOptions(selectEl, rows) {
    const sorted = (typeof window.novaSortClassGradeRows === 'function')
        ? window.novaSortClassGradeRows(rows)
        : (rows || []).slice();
    sorted.forEach(function (c) {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.name || c.id;
        selectEl.appendChild(option);
    });
}

async function loadClassesForRegistration() {
    registerClassSelect.innerHTML = '<option value="">Sınıf Seçin</option>';
    const cached = localStorage.getItem('cachedClasses');
    if (cached) {
        try {
            const list = JSON.parse(cached) || [];
            appendSortedClassOptions(registerClassSelect, list);
            if (list.length) return;
        } catch (_) {}
    }
    try {
        const snapshot = await database.ref('classesIndex').once('value');
        if (snapshot.exists()) {
            const rows = [];
            snapshot.forEach(childSnapshot => {
                const classId = childSnapshot.key;
                const raw = childSnapshot.val() || {};
                const className = (typeof raw === 'string' ? raw : raw.name) || classId;
                rows.push({ id: classId, name: className });
            });
            appendSortedClassOptions(registerClassSelect, rows);
            return;
        }
        const list = await novaBuildClassListWithoutFullTree();
        appendSortedClassOptions(registerClassSelect, list);
        if (!list.length) {
            registrationError.textContent = 'Sınıf listesi alınamadı.';
        }
    } catch (error) {
        console.error("Sınıf bilgileri yüklenirken hata:", error);
        registrationError.textContent = 'Sınıf bilgileri yüklenemedi';
    }
}

// Form validasyonu için input olayları
[registerClassSelect, registerUsername, registerPassword, registerEmail].forEach(element => {
    element.addEventListener('input', validateRegistrationForm);
});

// Form validasyon fonksiyonu
function validateRegistrationForm() {
    const username = registerUsername.value.trim();
    const password = registerPassword.value;
    const email = registerEmail.value.trim();
    const classId = registerClassSelect.value;
    let isValid = true;
    let errorMessage = '';

    // Tüm alanların doluluğunu kontrol et
    if (!username || !password || !email || !classId) {
        isValid = false;
        errorMessage = 'Tüm alanları doldurun';
    }
    // Kullanıcı adı uzunluk kontrolü
    else if (username.length > 11) {
        isValid = false;
        errorMessage = 'Kullanıcı adı 11 karakterden uzun olamaz';
    }
    // Şifre kontrolü
    else if (password.length < 6) {
        isValid = false;
        errorMessage = 'Şifre en az 6 karakter olmalı';
    }
    else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
        isValid = false;
        errorMessage = 'Şifre en az bir harf ve bir rakam içermeli';
    }
    // Email format kontrolü
    else if (!/\S+@\S+\.\S+/.test(email)) {
        isValid = false;
        errorMessage = 'Geçerli bir e-posta adresi girin';
    }

    submitRegistration.disabled = !isValid;
    registrationError.textContent = errorMessage;
    return isValid;
}

// Kullanıcı adı müsaitlik kontrolü
async function isUsernameAvailable(username, classId) {
    try {
        const snapshot = await database.ref(`classes/${classId}/students`)
            .orderByChild('name')
            .equalTo(username)
            .once('value');
        return !snapshot.exists();
    } catch (error) {
        console.error("Kullanıcı adı kontrolünde hata:", error);
        throw error;
    }
}

// Kayıt formu gönderme işlemi
submitRegistration.addEventListener('click', async () => {
    if (!validateRegistrationForm()) return;

    const username = registerUsername.value.trim();
    const password = registerPassword.value;
    const email = registerEmail.value.trim();
    const classId = registerClassSelect.value;

    try {
        const oldSubmitText = submitRegistration.textContent;
        submitRegistration.disabled = true;
        submitRegistration.textContent = 'Kaydediliyor...';
        // Kullanıcı adı müsaitlik kontrolü
        const usernameAvailable = await isUsernameAvailable(username, classId);
        if (!usernameAvailable) {
            registrationError.textContent = 'Bu kullanıcı adı zaten kullanılıyor';
            submitRegistration.disabled = false;
            submitRegistration.textContent = oldSubmitText;
            return;
        }

        // Firebase Authentication ile kullanıcı oluştur
        const userCredential = await (auth ? auth : null).createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // E-posta doğrulama gönder
        await user.sendEmailVerification();

        // Veritabanına kullanıcı bilgilerini kaydet
        await database.ref(`classes/${classId}/students/${user.uid}`).set({
            name: username,
            password: password,
            email: email,
	    duelCredits: 0,
            diamond: 0,
            photo: "https://cdn.pixabay.com/photo/2025/01/08/21/09/giraffe-9320109_640.jpg",
            gameCup: 0,
            inDuel: false,
            lastDiamondUpdate: firebase.database.ServerValue.TIMESTAMP,
            purchasedPhotos: {
                "aHR0cHM6Ly9zLmNhZmViYXphYXIuaXIvaW1hZ2VzL2ljb25zL2NvbS50cnRjb2N1ay5yYWZhZGFudGF5ZmFtYWhhbGxlbWVzZWxlc2ktZThkZTMyNWMtZWE1My00MDdlLWFhMzEtZmVjZjUzODRlNGNiXzUxMng1MTIucG5nP3gtaW1nPXYxL3Jlc2l6ZSxoXzI1Nix3XzI1Nixsb3NzbGVzc19mYWxzZS9vcHRpbWl6ZQ==": true
            }
        })

        // Kayıt formunu kapat, doğrulama ekranını göster
        registrationOverlay.style.display = 'none';
        verificationOverlay.style.display = 'flex';
        
        // 5 saniye sonra doğrulama ekranını kapat
        setTimeout(() => {
            verificationOverlay.style.display = 'none';
        }, 5000);

        resetRegistrationForm();
        submitRegistration.textContent = oldSubmitText;

    } catch (error) {
        console.error("Kayıt işleminde hata:", error);
        registrationError.textContent = error.message;
        submitRegistration.disabled = false;
        submitRegistration.textContent = 'Kayıt Ol';
    }
});

// Form sıfırlama fonksiyonu
function resetRegistrationForm() {
    registerUsername.value = '';
    registerPassword.value = '';
    registerEmail.value = '';
    registerClassSelect.value = '';
    registrationError.textContent = '';
    submitRegistration.disabled = true;
}

// E-posta doğrulama durumu kontrolü
(auth ? auth : null).onAuthStateChanged((user) => {
    if (user && !user.emailVerified) {
        user.reload().then(() => {
            if (user.emailVerified) {
                verificationOverlay.style.display = 'none';
            }
        });
    }
});









document.querySelectorAll('.category-button').forEach(button => {
    button.addEventListener('click', () => {
        // Aktif kategoriyi güncelle
        document.querySelectorAll('.category-button').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        
        // Doğru içeriği göster
        const duelStore = document.getElementById('duelCreditsStore');
        const photosContainer = document.getElementById('profilePhotosContainer');
        
        if (button.dataset.category === 'duel') {
            duelStore.style.display = 'block';
            photosContainer.style.display = 'none';
        } else {
            duelStore.style.display = 'none';
            photosContainer.style.display = 'grid';
            loadProfilePhotos(button.dataset.category);
        }
    });
});

// Düello kredisi satın alma fonksiyonu
async function purchaseCredits(amount, cost) {
    // Satın almaya başlamadan önce onay soruyoruz
    const confirmed = await showConfirmation("Bu düello biletini satın almak istediğinizden emin misiniz?");
    if (!confirmed) return;
    
    try {
        const studentRef = database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}`);
        const snapshot = await studentRef.once('value');
        const userData = snapshot.val();
        const currentDiamonds = userData.diamond || 0;
        const currentCredits = userData.duelCredits || 0;

        if (currentDiamonds < cost) {
            await showAlert('Yeterli elmasınız yok!');
            return;
        }

        await studentRef.update({
            diamond: currentDiamonds - cost,
            duelCredits: currentCredits + amount
        });
        try{
          const key = `${selectedStudent.classId}:${selectedStudent.studentId}`;
          __storeStudentCache = { key, ts: Date.now(), data: { ...(userData||{}), diamond: currentDiamonds - cost, duelCredits: currentCredits + amount } };
        }catch(_){}

        // Ana ekrandaki değerleri hemen güncelleyelim
        document.getElementById('currentDiamonds').textContent = currentDiamonds - cost;
        document.getElementById('duel-credits-value').textContent = currentCredits + amount;
        try { refreshDuelEntryGateNote(); } catch(_){}
        
        await showAlert('Düello hakkı satın alma başarılı!');
        
    } catch (error) {
        console.error('Satın alma hatası:', error);
        await showAlert('Satın alma işlemi başarısız oldu!');
    }
}


async function purchaseUnlimited(cost) {
    // Satın almaya başlamadan önce kullanıcıdan onay alalım.
    const confirmed = await showConfirmation("Bu ürünü satın almak istediğinizden emin misiniz?");
    if (!confirmed) {
        return;
    }
    
    try {
        const studentRef = database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}`);
        const snapshot = await studentRef.once('value');
        const userData = snapshot.val();
        const currentDiamonds = userData.diamond || 0;

        if (currentDiamonds < cost) {
            await showAlert('Yeterli elmasınız yok!');
            return;
        }

        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        // Yeni sürenin bitiş tarihini hesaplıyoruz.
        const newUnlimitedUntil = Date.now() + thirtyDaysInMs;
        
        await studentRef.update({
            diamond: currentDiamonds - cost,
            unlimitedCreditsUntil: newUnlimitedUntil
        });
        try{
          const key = `${selectedStudent.classId}:${selectedStudent.studentId}`;
          __storeStudentCache = { key, ts: Date.now(), data: { ...(userData||{}), diamond: currentDiamonds - cost, unlimitedCreditsUntil: newUnlimitedUntil } };
        }catch(_){}

        document.getElementById('currentDiamonds').textContent = currentDiamonds - cost;
        const creditsStats = document.getElementById('credits-stats');
        const creditsValue = document.getElementById('duel-credits-value');
       
        creditsStats.classList.add('unlimited');
        // Yeni süreye göre kaç gün kalacağını hesaplayıp görüntülüyoruz.
        creditsValue.innerHTML = `<span class="unlimited-badge">${Math.ceil((newUnlimitedUntil - Date.now())/(1000*60*60*24))}GÜN</span>`;

        // Tüm düello paketi butonlarını devre dışı bırakıyoruz.
        const allPackageButtons = document.querySelectorAll('.credit-package .buy-button');
        allPackageButtons.forEach(button => {
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            button.textContent = 'Sınırsız Hak Aktif';
            button.onclick = null;
        });

        await showAlert('✨ Sınırsız düello hakkı aktifleştirildi!');
       
    } catch (error) {let chosen = shuffleArray(allQuestions).slice(0, 10);
        console.error('Satın alma hatası:', error);
        await showAlert('Satın alma işlemi başarısız oldu!');
    }
}

// JavaScript Kodları

window.classNameMap = window.classNameMap || {};
var classNameMap = window.classNameMap;

function novaSortClassGradeRowsLocal(rows) {
    if (typeof window.novaSortClassGradeRows === 'function') {
        return window.novaSortClassGradeRows(rows);
    }
    return (rows || []).slice().sort(function (a, b) {
        const grade = function (t) {
            const s = String(t || '').trim();
            const m = s.match(/([1-4])\s*\.?\s*SINIF/i);
            if (m) return parseInt(m[1], 10);
            const m2 = s.match(/([1-4])(?:\.|\s|$)/);
            return m2 ? parseInt(m2[1], 10) : 99;
        };
        const ga = grade(a.name);
        const gb = grade(b.name);
        if (ga !== gb) return ga - gb;
        return String(a.name || '').localeCompare(String(b.name || ''), 'tr');
    });
}
try { window.novaSortClassGradeRowsLocal = novaSortClassGradeRowsLocal; } catch (_) {}

/** Soru kontrol: aynı sınıf seviyesindeki yinelenen başlıkları tek satıra indir (SINIF3 tercih). */
function novaDedupeReviewHeadingRows(rows) {
    var CS = window.NovaCurriculumSort;
    var gradeNum = CS && CS.extractGradeNumber
        ? function (label) { return CS.extractGradeNumber(label); }
        : function (label) {
            var m = String(label || '').match(/([1-4])\s*\.?\s*SINIF/i);
            return m ? parseInt(m[1], 10) : 0;
        };
    var canonicalId = CS && CS.canonicalHeadingIdForGrade
        ? function (g) { return CS.canonicalHeadingIdForGrade(g); }
        : function (g) {
            return g >= 1 && g <= 4 ? 'SINIF' + g : '';
        };
    var byGrade = Object.create(null);
    var extras = [];
    (rows || []).forEach(function (item) {
        if (!item || !item.id) return;
        var grade = gradeNum(item.name || item.id);
        if (!grade) {
            extras.push(item);
            return;
        }
        var canon = canonicalId(grade);
        var existing = byGrade[grade];
        if (!existing) {
            byGrade[grade] = item;
            return;
        }
        var newIsCanon = String(item.id).toUpperCase() === String(canon).toUpperCase();
        var oldIsCanon = String(existing.id).toUpperCase() === String(canon).toUpperCase();
        if (newIsCanon && !oldIsCanon) byGrade[grade] = item;
    });
    var out = [];
    [1, 2, 3, 4].forEach(function (g) {
        if (byGrade[g]) out.push(byGrade[g]);
    });
    extras.forEach(function (item) {
        var dup = out.some(function (row) { return String(row.id) === String(item.id); });
        if (!dup) out.push(item);
    });
    return out;
}
try { window.novaDedupeReviewHeadingRows = novaDedupeReviewHeadingRows; } catch (_) {}

async function novaGetServerTimeMs() {
    return new Promise(function (resolve) {
        try {
            firebase.database().ref('.info/serverTimeOffset').once('value', function (s) {
                resolve(Date.now() + (Number(s.val()) || 0));
            }, function () { resolve(Date.now()); });
        } catch (_) { resolve(Date.now()); }
    });
}
try { window.novaGetServerTimeMs = novaGetServerTimeMs; } catch (_) {}

async function novaWaitUntilMs(targetMs) {
    const t = Number(targetMs) || 0;
    if (!t) return;
    const serverNow = await novaGetServerTimeMs();
    const wait = Math.max(0, t - serverNow);
    if (wait > 0) await new Promise(function (r) { setTimeout(r, wait); });
}
try { window.novaWaitUntilMs = novaWaitUntilMs; } catch (_) {}

const NOVA_DUEL_INTRO_MS = 3200;
const NOVA_DUEL_MATCH_FOUND_MS = 2800;
const NOVA_DUEL_PREP_MS = 10000;
const NOVA_DUEL_SYNC_ENTER_MS = NOVA_DUEL_MATCH_FOUND_MS;

        // Arka plan müziği devre dışı (nova-no-music.js)
        const duelMusic = (typeof window.novaCreateMusicNoop === 'function')
            ? window.novaCreateMusicNoop()
            : { pause: function () {}, play: function () { return Promise.resolve(); }, currentTime: 0, paused: true, loop: false };
        const winnerMusic = (typeof window.novaCreateMusicNoop === 'function')
            ? window.novaCreateMusicNoop()
            : duelMusic;
        const singlePlayerQuestionMusic = (typeof window.novaCreateMusicNoop === 'function')
            ? window.novaCreateMusicNoop()
            : duelMusic;

        // "Oyunu Sonlandır" butonuna eklenen event listener
var duelFinalBackBtn = document.getElementById('duel-final-back-button');
if (duelFinalBackBtn) duelFinalBackBtn.addEventListener('click', async () => {
    await showAlert('🏆 Kupa verileriniz güncellendi.');
    if (currentDuelRef) {
        try {
            await currentDuelRef.remove();
            currentDuelRef = null;
            isInviter = false;
            duelGameStarted = false;
            window.location.reload();
        } catch (error) {
            console.error("Düello referansı kaldırılırken hata:", error);
            await showAlert('Düello referansı kaldırılırken hata oluştu.');
        }
    } else {
        window.location.reload();
    }
});


        window.addEventListener('beforeunload', () => {
            if (selectedStudent && selectedStudent.studentId) {
                setLoggedInPlayerInDuel(false);
                database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}/inDuel`).set(false)
                .then(() => console.log("inDuel set to false"))
                .catch(err => console.error("Failed to update inDuel status:", err));

                // Eğer bir düello referansı varsa, düelloyu kaldır ve diğer oyuncunun inDuel durumunu false yap
                if (currentDuelRef) {
                    currentDuelRef.once('value').then(async (snapshot) => {
                        if (snapshot.exists()) {
                            const data = snapshot.val();
                            const inviterRef = database.ref(`classes/${data.inviter.classId}/students/${data.inviter.studentId}/inDuel`);
                            const invitedRef = database.ref(`classes/${data.invited.classId}/students/${data.invited.studentId}/inDuel`);
                            try {
                                await inviterRef.set(false);
                                await invitedRef.set(false);
                                await currentDuelRef.remove();
                            } catch (error) {
                                console.error("Düello referansı kaldırılırken hata:", error);
                            }
                        }
                    });
                }
            }
        });

        // Lütfen kendi firebaseConfig değerlerinizi girin
        const firebaseConfig = {
  apiKey: "AIzaSyAZ8u7pix02x5-MbjOqurra6PWILmLfKGI",
  authDomain: "dllwrld-e5419.firebaseapp.com",
  databaseURL: "https://dllwrld-e5419-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "dllwrld-e5419",
  storageBucket: "dllwrld-e5419.firebasestorage.app",
  messagingSenderId: "244776245953",
  appId: "1:244776245953:web:fbc041505911ae0b951240",
  measurementId: "G-N2L6729PRY"
};
        firebase.initializeApp(firebaseConfig);
    // Nova guard for auth
    try { window.auth = window.auth || (firebase && firebase.auth ? firebase.auth() : null); } catch(e){ window.auth = null; }
        const database = firebase.database();
        try { window.database = database; } catch (_) {}
        const __novaOnceOrig = firebase.database.Reference.prototype.once;
        const __novaOnceInflight = new Map();
        function novaDedupedOnceValue(ref) {
            if (!ref || typeof ref.once !== 'function') {
                return Promise.reject(new Error('novaDedupedOnceValue: invalid ref'));
            }
            var key;
            try { key = ref.toString(); } catch (e) { key = String(ref); }
            var existing = __novaOnceInflight.get(key);
            if (existing) return existing;
            var p = __novaOnceOrig.call(ref, 'value').finally(function () {
                try { __novaOnceInflight.delete(key); } catch (e) {}
            });
            __novaOnceInflight.set(key, p);
            return p;
        }
        try {
            firebase.database.Reference.prototype.once = function (eventType) {
                if (eventType === 'value' && arguments.length <= 1) {
                    return novaDedupedOnceValue(this);
                }
                return __novaOnceOrig.apply(this, arguments);
            };
        } catch (_novaOncePatch) {}
        (function initLandingBundle(){
            var strip = document.getElementById('app-duyuru-strip');
            var c1 = document.getElementById('app-duyuru-c1');
            var c2 = document.getElementById('app-duyuru-c2');
            var track = document.getElementById('app-duyuru-track');
            var ms = document.getElementById('main-screen');
            if (!strip || !c1 || !c2 || !track || !ms) return;
            var loaded = false;
            var GIRIS_SS_KEY = 'nova_giris_panosu_shown_v2';
            function applyPayload(v) {
                var text = (v && typeof v.text === 'string') ? v.text.replace(/\s+/g, ' ').trim() : '';
                var en = !v || v.enabled !== false;
                if (!en || !text) {
                    strip.setAttribute('hidden', '');
                    strip.style.display = 'none';
                    c1.textContent = '';
                    c2.textContent = '';
                    return;
                }
                var sep = '     •     ';
                var line = text + sep;
                c1.textContent = line;
                c2.textContent = line;
                strip.removeAttribute('hidden');
                strip.style.display = '';
                var sec = Math.min(95, Math.max(18, 15 + text.length * 0.32));
                track.style.setProperty('--duyuru-sec', sec + 's');
            }
            function novaGirisYoutubeEmbed(u) {
                var s = String(u || '').trim();
                if (!s) return '';
                var id = '';
                if (/youtube\.com\/embed\/([A-Za-z0-9_-]+)/i.test(s)) {
                    id = RegExp.$1;
                } else if (/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/i.test(s)) {
                    id = RegExp.$1;
                } else if (/[?&]v=([A-Za-z0-9_-]{6,})/.test(s) && /youtube\.com\/watch/i.test(s)) {
                    id = RegExp.$1;
                } else if (/youtu\.be\/([A-Za-z0-9_-]+)/i.test(s)) {
                    id = s.split(/youtu\.be\//i)[1].split(/[?&#]/)[0];
                }
                if (!id) return '';
                return 'https://www.youtube.com/embed/' + id + '?autoplay=1&mute=1&playsinline=1&rel=0';
            }
            function classifyGirisMedia(url, kind) {
                var k = String(kind || 'auto');
                if (k === 'image') return 'image';
                if (k === 'video') return /youtube\.com|youtu\.be/i.test(String(url)) ? 'youtube' : 'video';
                var u = String(url || '');
                if (/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(u)) return 'image';
                if (/youtube\.com|youtu\.be/i.test(u)) return 'youtube';
                if (/\.(mp4|webm|ogg)(\?|$)/i.test(u)) return 'video';
                return 'video';
            }
            function hideGirisMedia(imgEl, vidEl, iframeWrap, iframe) {
                if (imgEl) {
                    imgEl.style.display = 'none';
                    try { imgEl.removeAttribute('src'); } catch (_e) {}
                }
                if (vidEl) {
                    try {
                        vidEl.pause();
                        vidEl.removeAttribute('src');
                        vidEl.load();
                    } catch (_e) {}
                    vidEl.style.display = 'none';
                }
                if (iframeWrap) iframeWrap.style.display = 'none';
                if (iframe) {
                    try { iframe.src = ''; } catch (_e2) {}
                }
            }
            function openGirisPanosuOverlay(cfg) {
                var url0 = String(cfg && cfg.url ? cfg.url : '').trim();
                if (!url0) return;
                function run() {
                    var ov = document.getElementById('giris-panosu-overlay');
                    var btn = document.getElementById('giris-panosu-close');
                    var wait = document.getElementById('giris-panosu-wait');
                    var imgEl = document.getElementById('giris-panosu-img');
                    var vidEl = document.getElementById('giris-panosu-video');
                    var iframeWrap = document.getElementById('giris-panosu-iframe-wrap');
                    var iframe = document.getElementById('giris-panosu-iframe');
                    if (!ov || !btn) {
                        return false;
                    }
                    var url = url0;
                    var mediaKind = classifyGirisMedia(url, (cfg && cfg.kind) ? cfg.kind : 'auto');
                    hideGirisMedia(imgEl, vidEl, iframeWrap, iframe);
                    if (mediaKind === 'image' && imgEl) {
                        imgEl.style.display = 'block';
                        imgEl.alt = 'Giriş görseli';
                        imgEl.src = url;
                    } else if (mediaKind === 'youtube' && iframe && iframeWrap) {
                        var emb = novaGirisYoutubeEmbed(url);
                        if (emb) {
                            iframeWrap.style.display = 'block';
                            iframe.src = emb;
                        } else if (/embed\//i.test(url)) {
                            iframeWrap.style.display = 'block';
                            iframe.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'autoplay=1&mute=1&playsinline=1&rel=0';
                        } else if (vidEl) {
                            vidEl.style.display = 'block';
                            try {
                                vidEl.muted = true;
                                vidEl.playsInline = true;
                                vidEl.setAttribute('playsinline', '');
                                vidEl.src = url;
                                var p0 = vidEl.play();
                                if (p0 && typeof p0.catch === 'function') {
                                    p0.catch(function () {
                                        try {
                                            vidEl.muted = true;
                                            vidEl.play();
                                        } catch (_e) {}
                                    });
                                }
                            } catch (_e) {}
                        }
                    } else if (vidEl) {
                        vidEl.style.display = 'block';
                        try {
                            vidEl.muted = true;
                            vidEl.playsInline = true;
                            vidEl.setAttribute('playsinline', '');
                            vidEl.src = url;
                            var p = vidEl.play();
                            if (p && typeof p.catch === 'function') {
                                p.catch(function () {
                                    try {
                                        vidEl.muted = true;
                                        vidEl.play();
                                    } catch (_e) {}
                                });
                            }
                        } catch (_e) {}
                    }
                    btn.disabled = true;
                    var sec = 3;
                    if (wait) wait.textContent = 'Kapatmak için ' + sec + ' sn';
                    var cd = setInterval(function () {
                        sec -= 1;
                        if (sec <= 0) {
                            clearInterval(cd);
                            btn.disabled = false;
                            if (wait) wait.textContent = '';
                            return;
                        }
                        if (wait) wait.textContent = 'Kapatmak için ' + sec + ' sn';
                    }, 1000);
                    ov.classList.add('open');
                    ov.setAttribute('aria-hidden', 'false');
                    document.body.style.overflow = 'hidden';
                    function closePanel() {
                        clearInterval(cd);
                        try {
                            sessionStorage.setItem(GIRIS_SS_KEY, '1');
                        } catch (_s) {}
                        ov.classList.remove('open');
                        ov.setAttribute('aria-hidden', 'true');
                        document.body.style.overflow = '';
                        hideGirisMedia(imgEl, vidEl, iframeWrap, iframe);
                        btn.onclick = null;
                        document.removeEventListener('keydown', onKey);
                    }
                    function onKey(ev) {
                        if (ev.key === 'Escape' && !btn.disabled) {
                            ev.preventDefault();
                            closePanel();
                        }
                    }
                    btn.onclick = function () {
                        if (!btn.disabled) closePanel();
                    };
                    document.addEventListener('keydown', onKey);
                    return true;
                }
                var tries = 0;
                (function tryOpen() {
                    if (run()) return;
                    tries += 1;
                    if (tries < 40) {
                        setTimeout(tryOpen, 50);
                    }
                })();
            }
            function applyGirisPanosu(v) {
                try {
                    if (sessionStorage.getItem(GIRIS_SS_KEY) === '1') return;
                    if (!v || v.show === false) return;
                    var url = String(v.url || '').trim();
                    if (!url) return;
                    var kind = v.kind || 'auto';
                    function scheduleGiris() {
                        setTimeout(function () {
                            openGirisPanosuOverlay({ url: url, kind: kind });
                        }, 80);
                    }
                    if (typeof window.novaHikayeStoryWillPlay === 'function') {
                        window.novaHikayeStoryWillPlay().then(function (hikayeActive) {
                            if (hikayeActive) return;
                            scheduleGiris();
                        }).catch(function () {
                            scheduleGiris();
                        });
                        return;
                    }
                    scheduleGiris();
                } catch (_e) {}
            }
            function fetchOnce() {
                if (loaded) return;
                loaded = true;
                database.ref('appDuyuru').once('value').then(function (snap) {
                    applyPayload(snap.exists() ? snap.val() : null);
                }).catch(function () {
                    try {
                        strip.setAttribute('hidden', '');
                    } catch (_e) {}
                });
                database.ref('girisPanosu').once('value').then(function (snap) {
                    applyGirisPanosu(snap.exists() ? snap.val() : null);
                }).catch(function () {});
            }
            function mainScreenIsVisible() {
                try {
                    if (ms.getAttribute('hidden') !== null) return false;
                    var d = window.getComputedStyle(ms).display;
                    return d !== 'none' && d !== '';
                } catch (_e) { return false; }
            }
            function tryFetchWhenMainShown() {
                if (loaded) return;
                if (!mainScreenIsVisible()) return;
                fetchOnce();
            }
            /* IntersectionObserver display:none iken güvenilir değil; stil değişimini izle + kısa yedek tarama */
            try {
                var mo = new MutationObserver(function () { tryFetchWhenMainShown(); });
                mo.observe(ms, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
            } catch (_mo) {}
            try {
                var io = new IntersectionObserver(function (entries) {
                    entries.forEach(function (e) {
                        if (e.isIntersecting) tryFetchWhenMainShown();
                    });
                }, { threshold: 0, rootMargin: '0px' });
                io.observe(ms);
            } catch (_io) {}
            var pollUntil = Date.now() + 8000;
            var pollId = setInterval(function () {
                if (loaded || Date.now() > pollUntil) {
                    clearInterval(pollId);
                    return;
                }
                tryFetchWhenMainShown();
            }, 1000);
            try { tryFetchWhenMainShown(); } catch (_e) {}
        })();

        try {
            database.enablePersistence({ synchronizeTabs: true }).catch(function (err) {
                if (err && err.code === 'failed-precondition') {
                    return database.enablePersistence().catch(function () {});
                }
            });
        } catch (_) {}
        const auth = firebase.auth();
        const NOVA_READ_CACHE_MEM = Object.create(null);

        function getSessionCache(key) {
            try {
                const raw = sessionStorage.getItem(key);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                if (!parsed || typeof parsed !== 'object') return null;
                return parsed;
            } catch (_) { return null; }
        }

        function setSessionCache(key, payload) {
            try { sessionStorage.setItem(key, JSON.stringify(payload)); } catch (_) {}
        }

        function readCacheKey(path) {
            var ver = (window.NOVA_CDN && window.NOVA_CDN.version) || 0;
            if (String(path || '').indexOf('championData/') === 0) {
                return 'nova_read_cache_v' + ver + '_' + path;
            }
            return 'nova_read_cache_' + path;
        }

        async function readValCached(path, ttlMs) {
            const now = Date.now();
            const memKey = readCacheKey(path);
            const m = NOVA_READ_CACHE_MEM[memKey];
            if (m && (now - m.ts) < ttlMs) return m.val;

            const storageKey = readCacheKey(path);
            const s = getSessionCache(storageKey);
            if (s && (now - Number(s.ts || 0)) < ttlMs) {
                NOVA_READ_CACHE_MEM[memKey] = { ts: Number(s.ts || now), val: s.val };
                return s.val;
            }

            // Tam champion ağacı: sekme + oturum ötesi (localStorage) — aynı yolu tekrar tekrar indirmeyi keser.
            if (path === 'championData/headings') {
                const lsKey = 'nova_read_cache_ls_championData_headings';
                try {
                    const raw = localStorage.getItem(lsKey);
                    if (raw) {
                        const o = JSON.parse(raw);
                        if (o && (now - Number(o.ts || 0)) < ttlMs) {
                            const payload = { ts: Number(o.ts || now), val: o.val };
                            NOVA_READ_CACHE_MEM[memKey] = payload;
                            setSessionCache(storageKey, payload);
                            return o.val;
                        }
                    }
                } catch (_) {}
            }

            if (typeof window.novaCdnFetchByPath === 'function') {
                try {
                    const cdnVal = await window.novaCdnFetchByPath(path, ttlMs);
                    if (cdnVal !== undefined) {
                        const cdnPayload = { ts: now, val: cdnVal };
                        NOVA_READ_CACHE_MEM[memKey] = cdnPayload;
                        setSessionCache(storageKey, cdnPayload);
                        if (path === 'championData/headings') {
                            try {
                                localStorage.setItem(
                                    'nova_read_cache_ls_championData_headings',
                                    JSON.stringify(cdnPayload)
                                );
                            } catch (_) {}
                        }
                        return cdnVal;
                    }
                } catch (cdnErr) {
                    console.warn('CDN read fallback RTDB:', path, cdnErr && cdnErr.message ? cdnErr.message : cdnErr);
                }
            }

            const snap = await database.ref(path).once('value');
            const val = snap.exists() ? snap.val() : null;
            const payload = { ts: now, val: val };
            NOVA_READ_CACHE_MEM[memKey] = payload;
            setSessionCache(storageKey, payload);
            if (path === 'championData/headings') {
                try {
                    localStorage.setItem('nova_read_cache_ls_championData_headings', JSON.stringify(payload));
                } catch (_) {}
            }
            return val;
        }

        function novaInvalidateReadValCache(path) {
            if (!path) return;
            try {
                const memKey = readCacheKey(path);
                delete NOVA_READ_CACHE_MEM[memKey];
            } catch (_) {}
            try {
                sessionStorage.removeItem(readCacheKey(path));
            } catch (_) {}
        }

        /** Başlık/ders/konu ağacı seyrek değişir; RTDB indirmesini ciddi azaltır. */
        const NOVA_CHAMPION_HEADINGS_TTL_MS = 24 * 60 * 60 * 1000;
        /** Mağaza kategori indeksi + meta birleşik çekim için. */
        const NOVA_STORE_CAT_INDEX_TTL_MS = 12 * 60 * 60 * 1000;
        /** Konu başına soru havuzu; admin güncellemesi için kısa TTL (tekrar oyunlarda trafik düşer). */
        const NOVA_TOPIC_QUESTIONS_TTL_MS = 5 * 60 * 1000;
        /** Deneme soru bankası (büyük payload); admin değişikliği nadir → daha uzun önbellek. */
        const NOVA_DENEME_QUESTIONS_TTL_MS = 8 * 60 * 1000;
        /** Deneme liderlik özeti; tamamlamalar sık olabilir → orta TTL. */
        const NOVA_DENEME_LEADERBOARD_TTL_MS = 90 * 1000;
        /** loggedinPlayers tam ağaç okuması — paylaşımlı bellek önbelleği (TTL). */
        const NOVA_LOGGEDIN_PLAYERS_LIST_TTL_MS = 90 * 1000;
        /** Tam classes ağacı (ağır); varsayılan önbellek süresi. */
        const NOVA_CLASSES_TREE_CACHE_MS = 5 * 60 * 1000;

        try {
            window.novaReadValCached = readValCached;
            window.novaInvalidateReadValCache = novaInvalidateReadValCache;
            window.NOVA_CHAMPION_HEADINGS_TTL_MS = NOVA_CHAMPION_HEADINGS_TTL_MS;
        } catch (_) {}

        /** Şampiyon ağacında tam dal yerine: shallow anahtar + yaprak (name/active) okumaları */
        const NOVA_CHAMPION_SHALLOW_BATCH = 18;

        async function novaRtdbRestJson(path, opts) {
            const shallow = !!(opts && opts.shallow);
            let base = '';
            try {
                base = (firebase.app().options && firebase.app().options.databaseURL) || firebaseConfig.databaseURL || '';
            } catch (_) {
                base = firebaseConfig.databaseURL || '';
            }
            base = String(base).replace(/\/$/, '');
            const segs = String(path || '').split('/').filter(Boolean);
            if (!segs.length) throw new Error('novaRtdbRestJson: empty path');
            const urlPath = segs.map(encodeURIComponent).join('/');
            const qp = [];
            if (shallow) qp.push('shallow=true');
            let token = '';
            try {
                const u = firebase.auth().currentUser;
                if (u) token = await u.getIdToken(false);
            } catch (_) {}
            if (token) qp.push('auth=' + encodeURIComponent(token));
            const url = base + '/' + urlPath + '.json' + (qp.length ? '?' + qp.join('&') : '');
            const res = await fetch(url);
            if (res.status === 401 || res.status === 403) throw new Error('RTDB REST ' + res.status);
            if (!res.ok) throw new Error('RTDB REST ' + res.status);
            const text = await res.text();
            if (!text || text === 'null') return null;
            return JSON.parse(text);
        }

        async function novaChampionChildKeys(path) {
            try {
                const o = await novaRtdbRestJson(path, { shallow: true });
                if (o === null) return null;
                if (!o || typeof o !== 'object') return [];
                return Object.keys(o);
            } catch (e) {
                console.warn('Champion shallow okunamadı, tam dal yedeği kullanılacak:', path, e && e.message ? e.message : e);
                return null;
            }
        }

        async function novaReadChampionLeaf(path) {
            const snap = await database.ref(path).once('value');
            return snap.exists() ? snap.val() : null;
        }

        try {
            window.novaRtdbRestJson = novaRtdbRestJson;
            window.novaRtdbShallowKeys = novaChampionChildKeys;
            window.novaReadRtdbLeaf = novaReadChampionLeaf;
            window.novaDedupedOnceValue = novaDedupedOnceValue;
        } catch (_novaExport) {}

        async function novaFetchChampionHeadingList() {
            const ids = await novaChampionChildKeys('championData/headings');
            if (ids === null) {
                const data = await readValCached('championData/headings', NOVA_CHAMPION_HEADINGS_TTL_MS);
                if (!data || typeof data !== 'object') return [];
                return (window.novaSortClassGradeRows || novaSortClassGradeRowsLocal)(Object.keys(data).map(function (k) {
                    return { id: k, name: (data[k] && data[k].name) ? String(data[k].name) : k };
                }));
            }
            const out = [];
            for (let i = 0; i < ids.length; i += NOVA_CHAMPION_SHALLOW_BATCH) {
                const chunk = ids.slice(i, i + NOVA_CHAMPION_SHALLOW_BATCH);
                const rows = await Promise.all(chunk.map(async function (id) {
                    const nameVal = await novaReadChampionLeaf('championData/headings/' + id + '/name');
                    return { id: id, name: (nameVal != null && nameVal !== '') ? String(nameVal) : id };
                }));
                out.push.apply(out, rows);
            }
            return (window.novaSortClassGradeRows || novaSortClassGradeRowsLocal)(out);
        }

        try {
            window.novaFetchChampionHeadingList = novaFetchChampionHeadingList;
            window.novaFetchLessonsList = novaFetchLessonsList;
            window.novaFetchLessonsListFromRtdb = novaFetchLessonsListFromRtdb;
            window.novaFetchTopicsList = novaFetchTopicsList;
        } catch (_) {}

        async function novaFetchLessonsListFromRtdb(classId) {
            if (!classId) return [];
            try {
                const snap = await database.ref('championData/headings/' + classId + '/lessons').once('value');
                if (!snap.exists()) return [];
                const lessonsVal = snap.val() || {};
                return Object.keys(lessonsVal).map(function (lessonId) {
                    const lv = lessonsVal[lessonId] || {};
                    return {
                        id: lessonId,
                        name: lv.name ? String(lv.name) : lessonId,
                        order: lv.order
                    };
                });
            } catch (e) {
                console.warn('RTDB ders listesi:', classId, e);
                return [];
            }
        }

        async function novaFetchLessonsList(classId) {
            if (!classId) return [];
            const dedupeLessons = function (rows) {
                const seen = Object.create(null);
                const out = [];
                (rows || []).forEach(function (r) {
                    if (!r || !r.id) return;
                    const k = normalizeClassTag(r.name || r.id);
                    if (k && seen[k]) return;
                    if (k) seen[k] = true;
                    out.push(r);
                });
                return out;
            };
            if (/^SINIF[1-4]$/i.test(String(classId))) {
                const rtdbFirst = await novaFetchLessonsListFromRtdb(classId);
                if (rtdbFirst && rtdbFirst.length) {
                    return window.NovaCurriculumSort
                        ? window.NovaCurriculumSort.sortLessons(dedupeLessons(rtdbFirst))
                        : dedupeLessons(rtdbFirst);
                }
            }
            let ids = await novaChampionChildKeys('championData/headings/' + classId + '/lessons');
            if (ids === null || !ids.length) {
                const lessonsVal = await readValCached('championData/headings/' + classId + '/lessons', NOVA_CHAMPION_HEADINGS_TTL_MS);
                if (!lessonsVal || typeof lessonsVal !== 'object') return [];
                const rows = Object.keys(lessonsVal).map(function (lessonId) {
                    var lv = lessonsVal[lessonId] || {};
                    return {
                        id: lessonId,
                        name: lv.name ? String(lv.name) : lessonId,
                        order: lv.order
                    };
                });
                return window.NovaCurriculumSort
                    ? window.NovaCurriculumSort.sortLessons(dedupeLessons(rows))
                    : dedupeLessons(rows);
            }
            const out = [];
            const base = 'championData/headings/' + classId + '/lessons/';
            for (let i = 0; i < ids.length; i += NOVA_CHAMPION_SHALLOW_BATCH) {
                const chunk = ids.slice(i, i + NOVA_CHAMPION_SHALLOW_BATCH);
                const rows = await Promise.all(chunk.map(async function (lessonId) {
                    const pfx = base + lessonId + '/';
                    const [nameVal, orderVal] = await Promise.all([
                        novaReadChampionLeaf(pfx + 'name'),
                        novaReadChampionLeaf(pfx + 'order')
                    ]);
                    return {
                        id: lessonId,
                        name: (nameVal != null && nameVal !== '') ? String(nameVal) : lessonId,
                        order: orderVal
                    };
                }));
                out.push.apply(out, rows);
            }
            var deduped = dedupeLessons(out);
            var sorted = window.NovaCurriculumSort
                ? window.NovaCurriculumSort.sortLessons(deduped)
                : deduped;
            if (!sorted.length) {
                const direct = await novaFetchLessonsListFromRtdb(classId);
                sorted = window.NovaCurriculumSort
                    ? window.NovaCurriculumSort.sortLessons(dedupeLessons(direct))
                    : dedupeLessons(direct);
            }
            return sorted;
        }

        async function novaFetchTopicsList(classId, lessonId) {
            if (!classId || !lessonId) return [];
            let ids = await novaChampionChildKeys('championData/headings/' + classId + '/lessons/' + lessonId + '/topics');
            if (ids === null || !ids.length) {
                const topicsVal = await readValCached('championData/headings/' + classId + '/lessons/' + lessonId + '/topics', NOVA_CHAMPION_HEADINGS_TTL_MS);
                if (!topicsVal || typeof topicsVal !== 'object') return [];
                const topicsData = [];
                Object.keys(topicsVal).forEach(function (topicId) {
                    const v = topicsVal[topicId] || {};
                    if (v.active === false) return;
                    topicsData.push({
                        id: topicId,
                        name: v.name ? String(v.name) : topicId,
                        order: v.order
                    });
                });
                return window.NovaCurriculumSort
                    ? window.NovaCurriculumSort.sortTopics(topicsData)
                    : topicsData;
            }
            const topicsData = [];
            const base = 'championData/headings/' + classId + '/lessons/' + lessonId + '/topics/';
            for (let i = 0; i < ids.length; i += NOVA_CHAMPION_SHALLOW_BATCH) {
                const chunk = ids.slice(i, i + NOVA_CHAMPION_SHALLOW_BATCH);
                const rows = await Promise.all(chunk.map(async function (topicId) {
                    const pfx = base + topicId + '/';
                    const [activeVal, nameVal] = await Promise.all([
                        novaReadChampionLeaf(pfx + 'active'),
                        novaReadChampionLeaf(pfx + 'name')
                    ]);
                    if (activeVal === false) return null;
                    const orderVal = await novaReadChampionLeaf(pfx + 'order');
                    return {
                        id: topicId,
                        name: (nameVal != null && nameVal !== '') ? String(nameVal) : topicId,
                        order: orderVal
                    };
                }));
                rows.forEach(function (r) { if (r) topicsData.push(r); });
            }
            return window.NovaCurriculumSort
                ? window.NovaCurriculumSort.sortTopics(topicsData)
                : topicsData;
        }

        // Diğer değişkenler
        classNameMap = window.classNameMap || (window.classNameMap = {});
        let duelEnded = false; // Eklendi

        const playersOverlay = document.getElementById('playersOverlay');
        const playersCloseButton = document.getElementById('playersCloseButton');
        const playersList = document.getElementById('playersList');
        const invitationOverlay = document.getElementById('invitationOverlay');
        const invitationMessage = document.getElementById('invitationMessage');

        if (playersCloseButton && playersOverlay) {
            playersCloseButton.addEventListener('click', () => {
                playersOverlay.style.display = 'none';
            });
        }

        let loggedinPlayerRef = null;
        let selectedStudent = {
            classId: '',
            studentId: '',
            studentName: '',
            className: '',
            nameFrame: 'default'
        };
        if (typeof window.novaHydrateSessionFromStorage === 'function') {
            window.novaHydrateSessionFromStorage(selectedStudent);
        } else {
            try {
                var __novaStoredStudentRaw = localStorage.getItem('selectedStudent');
                if (__novaStoredStudentRaw) {
                    var __novaStoredStudent = JSON.parse(__novaStoredStudentRaw);
                    if (__novaStoredStudent && __novaStoredStudent.studentId && __novaStoredStudent.classId) {
                        Object.assign(selectedStudent, __novaStoredStudent);
                    }
                }
                window.selectedStudent = selectedStudent;
            } catch (_) {
                try { window.selectedStudent = selectedStudent; } catch (_e) {}
            }
        }
        const NOVA_ACTIVE_STUDENT_FP_KEY = 'nova_active_student_fp';
        function getStudentFingerprint(st) {
            const cid = String((st && st.classId) || '').trim();
            const sid = String((st && st.studentId) || '').trim();
            if (!cid || !sid) return '';
            return cid + '|' + sid;
        }
        function clearStorageByPrefixes(storageObj, prefixes) {
            try {
                if (!storageObj || typeof storageObj.length !== 'number') return;
                for (let i = storageObj.length - 1; i >= 0; i--) {
                    const k = storageObj.key(i);
                    if (!k) continue;
                    if (prefixes.some((p) => k === p || k.indexOf(p) === 0)) {
                        storageObj.removeItem(k);
                    }
                }
            } catch (_) {}
        }
        function resetCrossStudentCaches() {
            clearStorageByPrefixes(localStorage, [
                'cachedChampionData',
                'cachedChampionDataTimestamp',
                'cachedClasses',
                'cachedClassesTimestamp',
                'cachedLessons_',
                'cachedLessonsTimestamp_',
                'cachedTopics_',
                'cachedTopicsTimestamp_',
                'nova_read_cache_ls_',
                'nova_rank_cache_',
                'friendsList_'
            ]);
            clearStorageByPrefixes(sessionStorage, [
                'nova_read_cache_'
            ]);
            try {
                if (typeof NOVA_READ_CACHE_MEM === 'object' && NOVA_READ_CACHE_MEM) {
                    Object.keys(NOVA_READ_CACHE_MEM).forEach((k) => { delete NOVA_READ_CACHE_MEM[k]; });
                }
            } catch (_) {}
        }
        function applyStudentSessionIsolation(st) {
            const nextFp = getStudentFingerprint(st);
            if (!nextFp) return;
            let prevFp = '';
            try { prevFp = String(localStorage.getItem(NOVA_ACTIVE_STUDENT_FP_KEY) || '').trim(); } catch (_) {}
            if (prevFp && prevFp !== nextFp) {
                resetCrossStudentCaches();
            }
            try { localStorage.setItem(NOVA_ACTIVE_STUDENT_FP_KEY, nextFp); } catch (_) {}
        }
        function normalizeClassTag(v) {
            return String(v || '')
                .toLocaleUpperCase('tr-TR')
                .replace(/[^0-9A-ZÇĞİÖŞÜ]/g, '');
        }
        function isLikelyDbKeyLabel(v) {
            const s = String(v || '').trim();
            if (!s) return true;
            if (/[1-4]\s*\.?\s*SINIF/i.test(s)) return false;
            return /^-[A-Za-z0-9_-]{8,}$/.test(s);
        }
        async function ensureSelectedStudentClassName() {
            try {
                const cid = String((selectedStudent && selectedStudent.classId) || '').trim();
                if (!cid) return '';
                const current = String((selectedStudent && selectedStudent.className) || '').trim();
                if (current && !isLikelyDbKeyLabel(current)) return current;
                const mapped = (classNameMap && classNameMap[cid]) ? String(classNameMap[cid] || '').trim() : '';
                if (mapped && !isLikelyDbKeyLabel(mapped)) {
                    selectedStudent.className = mapped;
                    try { localStorage.setItem('selectedStudent', JSON.stringify(selectedStudent)); } catch (_) {}
                    return mapped;
                }
                const snap = await database.ref('classes/' + cid + '/name').once('value');
                const fresh = snap.exists() ? String(snap.val() || '').trim() : '';
                if (fresh) {
                    selectedStudent.className = fresh;
                    classNameMap[cid] = fresh;
                    try { localStorage.setItem('selectedStudent', JSON.stringify(selectedStudent)); } catch (_) {}
                    return fresh;
                }
            } catch (_) {}
            return String((selectedStudent && selectedStudent.className) || '').trim();
        }
        function getScopedClassLabel() {
            const byStudent = String((selectedStudent && selectedStudent.className) || '').trim();
            if (byStudent && !isLikelyDbKeyLabel(byStudent)) return byStudent;
            const byMap = (classNameMap && selectedStudent && selectedStudent.classId)
                ? String(classNameMap[selectedStudent.classId] || '').trim()
                : '';
            if (byMap && !isLikelyDbKeyLabel(byMap)) return byMap;
            return '';
        }
        function extractGradeNumber(v) {
            const m = String(v || '').match(/([1-9])/);
            return m ? Number(m[1]) : 0;
        }
        function resolveSinglePlayerHeadingId() {
            try {
                if (!classSelect || !classSelect.options) return '';
                const scopedLabel = getScopedClassLabel();
                const tag = normalizeClassTag(scopedLabel);
                const grade = extractGradeNumber(scopedLabel);
                if (!tag && !grade) return String(classSelect.value || '').trim();
                for (let i = 0; i < classSelect.options.length; i++) {
                    const op = classSelect.options[i];
                    if (!op || !op.value) continue;
                    const opTag = normalizeClassTag(op.textContent || '');
                    if (tag && opTag === tag) return op.value;
                    if (grade && extractGradeNumber(op.textContent || '') === grade) return op.value;
                }
            } catch (_) {}
            return String((classSelect && classSelect.value) || '').trim();
        }
        function filterHeadingsForStudent(headingsList) {
            const list = headingsList || [];
            const scopedLabel = getScopedClassLabel();
            const tag = normalizeClassTag(scopedLabel);
            const grade = extractGradeNumber(scopedLabel);
            if (!tag && !grade) return list.slice();
            return list.filter(function (item) {
                if (!item || !item.id) return false;
                const itemTag = normalizeClassTag(item.name);
                if (tag && itemTag === tag) return true;
                if (grade && extractGradeNumber(item.name) === grade) return true;
                return false;
            });
        }
        async function resolveBestHeadingFromList(headingsList) {
            const scopedLabel = getScopedClassLabel();
            if (window.NovaCurriculumSort && typeof window.NovaCurriculumSort.resolveStudentHeadingId === 'function') {
                const canonical = window.NovaCurriculumSort.resolveStudentHeadingId(scopedLabel, headingsList);
                if (canonical) {
                    const lessons = await novaFetchLessonsList(canonical);
                    if (lessons && lessons.length) return canonical;
                }
            }
            const matches = filterHeadingsForStudent(headingsList);
            const pool = matches.length ? matches : (headingsList || []);
            if (!pool.length) return '';
            const ordered = [];
            const seen = Object.create(null);
            pool.forEach(function (item) {
                const id = String((item && item.id) || '').trim();
                if (!id || seen[id]) return;
                seen[id] = true;
                ordered.push(id);
            });
            for (let i = 0; i < ordered.length; i++) {
                const lessons = await novaFetchLessonsList(ordered[i]);
                if (lessons && lessons.length) return ordered[i];
            }
            return ordered[0];
        }
        async function resolveBestSinglePlayerHeadingId() {
            let list = window.__novaChampionHeadingsList;
            if (!list || !list.length) {
                try {
                    const fn = window.novaFetchChampionHeadingList;
                    if (typeof fn === 'function') list = await fn();
                    if (list && list.length) window.__novaChampionHeadingsList = list;
                } catch (_) {}
            }
            if (list && list.length) return resolveBestHeadingFromList(list);
            return resolveSinglePlayerHeadingId();
        }
        try {
            window.__novaEnsureSelectedStudentClassName = ensureSelectedStudentClassName;
            window.__novaGetScopedClassLabel = getScopedClassLabel;
            window.__novaNormalizeClassTag = normalizeClassTag;
            window.__novaExtractGradeNumber = extractGradeNumber;
            window.__novaResolveSinglePlayerHeadingId = resolveSinglePlayerHeadingId;
            window.__novaResolveBestSinglePlayerHeadingId = resolveBestSinglePlayerHeadingId;
            window.__novaResolveBestHeadingFromList = resolveBestHeadingFromList;
            window.__novaFilterHeadingsForStudent = filterHeadingsForStudent;
        } catch (_novaExportFns) {}
        let enforceSinglePlayerClassLockPromise = null;

        function applyLockedClassSelectDom(headingId, label) {
            if (!classSelect) return;
            const hid = String(headingId || '').trim();
            const lbl = String(label || 'Sınıf').trim() || 'Sınıf';
            const cur = classSelect.options[0];
            if (
                classSelect.dataset.novaSpClassLocked === '1' &&
                classSelect.options.length === 1 &&
                cur &&
                String(cur.value) === hid &&
                String(cur.textContent || '').trim() === lbl
            ) {
                classSelect.disabled = true;
                classSelect.style.pointerEvents = 'none';
                classSelect.style.cursor = 'not-allowed';
                classSelect.style.opacity = '0.8';
                return false;
            }
            classSelect.innerHTML = '';
            const lockedOption = document.createElement('option');
            lockedOption.value = hid;
            lockedOption.textContent = lbl;
            classSelect.appendChild(lockedOption);
            classSelect.value = hid;
            classSelect.disabled = true;
            classSelect.style.pointerEvents = 'none';
            classSelect.style.cursor = 'not-allowed';
            classSelect.style.opacity = '0.8';
            classSelect.dataset.novaSpClassLocked = '1';
            classSelect.dataset.novaLockedHeadingId = hid;
            classSelect.dataset.novaLockedLabel = lbl;
            if (typeof window.novaRefreshGameSelectMenu === 'function') {
                window.novaRefreshGameSelectMenu(classSelect);
            }
            const wrap = classSelect.closest('.nova-game-select');
            if (wrap) {
                wrap.classList.add('nova-game-select--locked');
                wrap.classList.remove('nova-game-select--empty');
                wrap.classList.add('nova-game-select--filled');
            }
            return true;
        }

        function novaUnlockSpReviewClassSelect() {
            if (!classSelect) return;
            classSelect.disabled = false;
            classSelect.style.pointerEvents = '';
            classSelect.style.cursor = '';
            classSelect.style.opacity = '';
            delete classSelect.dataset.novaSpClassLocked;
            delete classSelect.dataset.novaLockedHeadingId;
            delete classSelect.dataset.novaLockedLabel;
            const wrap = classSelect.closest('.nova-game-select');
            if (wrap) {
                wrap.classList.remove('nova-game-select--locked');
                wrap.classList.toggle('nova-game-select--empty', !classSelect.value);
                wrap.classList.toggle('nova-game-select--filled', !!classSelect.value);
            }
            if (typeof window.novaRefreshGameSelectMenu === 'function') {
                window.novaRefreshGameSelectMenu(classSelect);
            }
        }

        async function enforceSinglePlayerClassLock(opts) {
            if (window.NOVA_SP_REVIEW_MODE) {
                novaUnlockSpReviewClassSelect();
                return;
            }
            if (!classSelect || !selectedStudent || !selectedStudent.classId) return;
            if (enforceSinglePlayerClassLockPromise) {
                return enforceSinglePlayerClassLockPromise;
            }
            opts = opts || {};
            enforceSinglePlayerClassLockPromise = (async function () {
                try {
                    const prevHeadingId = String(classSelect.dataset.novaLockedHeadingId || '').trim();
                    let quickLabel = getScopedClassLabel();
                    if (quickLabel && !isLikelyDbKeyLabel(quickLabel)) {
                        applyLockedClassSelectDom(prevHeadingId || selectedStudent.classId, quickLabel);
                    }

                    await ensureSelectedStudentClassName();
                    let headingId = await resolveBestSinglePlayerHeadingId();
                    if (!headingId) {
                        try {
                            const fn = window.novaFetchChampionHeadingList;
                            if (typeof fn === 'function') {
                                const list = await fn();
                                if (list && list.length) window.__novaChampionHeadingsList = list;
                            }
                        } catch (_) {}
                        headingId = await resolveBestSinglePlayerHeadingId();
                    }

                    let label = getScopedClassLabel();
                    if ((!label || isLikelyDbKeyLabel(label)) && selectionClassSelect && selectedStudent.classId) {
                        const fallbackOpt = selectionClassSelect.querySelector('option[value="' + String(selectedStudent.classId).replace(/"/g, '\\"') + '"]');
                        if (fallbackOpt) label = String(fallbackOpt.textContent || '').trim();
                    }
                    if (!label || isLikelyDbKeyLabel(label)) {
                        try {
                            const classSnap = await database.ref('classes/' + selectedStudent.classId + '/name').once('value');
                            if (classSnap.exists()) label = String(classSnap.val() || '').trim();
                        } catch (_) {}
                    }
                    if ((!label || isLikelyDbKeyLabel(label)) && headingId) {
                        try {
                            const headingName = await novaReadChampionLeaf('championData/headings/' + headingId + '/name');
                            if (headingName != null && headingName !== '') label = String(headingName).trim();
                        } catch (_) {}
                    }
                    if (!label || isLikelyDbKeyLabel(label)) label = 'Sınıf';

                    const headingChanged = applyLockedClassSelectDom(headingId || '', label);
                    const shouldResetLessons = headingChanged || !prevHeadingId || prevHeadingId !== String(headingId || '').trim();

                    if (headingId) {
                        if (shouldResetLessons && !opts.preserveLessons) {
                            if (subjectSelect) subjectSelect.value = '';
                            if (topicSelect) topicSelect.value = '';
                        }
                        if (shouldResetLessons || !subjectSelect || !subjectSelect.options || subjectSelect.options.length <= 1) {
                            await fetchLessons(headingId, subjectSelect);
                        }
                        if (subjectSelect && typeof window.novaRefreshGameSelectMenu === 'function') {
                            window.novaRefreshGameSelectMenu(subjectSelect);
                        }
                        if (topicSelect && typeof window.novaRefreshGameSelectMenu === 'function') {
                            window.novaRefreshGameSelectMenu(topicSelect);
                        }
                    } else {
                        if (subjectSelect) subjectSelect.innerHTML = '<option value="">Bu sınıf için ders yok</option>';
                        if (topicSelect) topicSelect.innerHTML = '<option value="">Bu sınıf için konu yok</option>';
                        if (typeof startGameButton !== 'undefined' && startGameButton) {
                            startGameButton.classList.remove('active');
                            startGameButton.disabled = true;
                        }
                        if (subjectSelect && typeof window.novaRefreshGameSelectMenu === 'function') {
                            window.novaRefreshGameSelectMenu(subjectSelect);
                        }
                        if (topicSelect && typeof window.novaRefreshGameSelectMenu === 'function') {
                            window.novaRefreshGameSelectMenu(topicSelect);
                        }
                    }
                } catch (_) {}
            })();
            try {
                return await enforceSinglePlayerClassLockPromise;
            } finally {
                enforceSinglePlayerClassLockPromise = null;
            }
        }
        try { window.__novaEnforceSinglePlayerClassLock = enforceSinglePlayerClassLock; } catch (_) {}
        try { window.novaUnlockSpReviewClassSelect = novaUnlockSpReviewClassSelect; } catch (_) {}

        const studentPhoto = document.getElementById('student-photo');
        const studentName = document.getElementById('student-name');

        function novaSanitizeLoggedInPlayerKey(studentId) {
            const s = String(studentId == null ? '' : studentId).trim();
            if (!s) return '__empty';
            return s.replace(/[.#$\[\]\/]/g, '_');
        }

        function novaDedupeLoggedInPlayersMap(mapVal) {
            const byId = Object.create(null);
            Object.entries(mapVal || {}).forEach(function (entry) {
                const key = entry[0];
                const raw = entry[1];
                const player = raw || {};
                const id = String(player.studentId || '').trim();
                if (!id) return;
                const row = Object.assign({}, player, { key: key });
                const pref = novaSanitizeLoggedInPlayerKey(id);
                const prev = byId[id];
                const rank = function (k) {
                    if (k === id || k === pref) return 2;
                    return 1;
                };
                if (!prev || rank(key) > rank(prev.key)) {
                    byId[id] = row;
                }
            });
            return Object.keys(byId).map(function (id) { return byId[id]; });
        }

        async function addLoggedInPlayer(student) {
            const sid = String((student && student.studentId) || '').trim();
            if (!sid) return;
            const pathKey = novaSanitizeLoggedInPlayerKey(sid);
            const newRef = database.ref('loggedinPlayers/' + pathKey);
            await newRef.set({
                name: student.studentName,
                className: student.className || '',
                nameFrame: student.nameFrame || 'default',
                avatarFrame: resolveAvatarFrameByName(student.nameFrame, student.avatarFrame),
                photo: (studentPhoto.src && studentPhoto.src !== "") ? studentPhoto.src : "",
                classId: student.classId,
                studentId: student.studentId,
                inDuel: false,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
            newRef.onDisconnect().remove();
            loggedinPlayerRef = newRef;
            try {
                window.__loggedInPlayersListCache = { ts: 0, val: null, promise: null };
            } catch (_) {}
        }

        async function setLoggedInPlayerInDuel(inDuel) {
            try {
                if (loggedinPlayerRef) await loggedinPlayerRef.update({ inDuel: !!inDuel });
                window.__selfInDuelCache = { ts: Date.now(), val: !!inDuel };
            } catch (e) {
                console.error('loggedinPlayers inDuel güncellenemedi:', e);
            }
        }

        /** Tüm çevrimiçi kayıtlar (öğrenci anahtarı + eski push kayıtları); listeler ve çevrimiçi seti paylaşır. */
        async function fetchLoggedInPlayersMapLimited() {
            if (!window.__loggedInPlayersListCache) {
                window.__loggedInPlayersListCache = { ts: 0, val: null, promise: null };
            }
            const st = window.__loggedInPlayersListCache;
            const now = Date.now();
            if (st.val && (now - st.ts) < NOVA_LOGGEDIN_PLAYERS_LIST_TTL_MS) {
                return st.val;
            }
            if (st.promise) return st.promise;
            st.promise = database.ref('loggedinPlayers').once('value').then(function (snap) {
                const v = snap.exists() ? (snap.val() || {}) : {};
                st.val = v;
                st.ts = Date.now();
                st.promise = null;
                return v;
            }).catch(function (e) {
                st.promise = null;
                throw e;
            });
            return st.promise;
        }

 async function showLoggedInPlayers() {
    playersList.innerHTML = '';
    let snapshotVal = null;
    try {
        snapshotVal = await fetchLoggedInPlayersMapLimited();
    } catch (_) {
        snapshotVal = null;
    }
    let playersArr = [];

    if (snapshotVal) {
        playersArr = novaDedupeLoggedInPlayersMap(snapshotVal);

        // Sınıf adına göre sırala (aynı sınıftakiler önce)
        const sameClassPlayers = playersArr.filter(p => p.classId === selectedStudent.classId && p.studentId !== selectedStudent.studentId);
        playersArr = sameClassPlayers;

        // N+1 read'i engelle: loggedinPlayers içindeki anlık snapshot'ı kullan.
        // Kayıt eksikse ekstra DB okumak yerine güvenli fallback göster.
        const preparedPlayers = playersArr.map((player) => {
            const photoURL = (player.photo && String(player.photo).trim() !== '')
                ? player.photo
                : "https://via.placeholder.com/50";
            const inDuel = !!player.inDuel;
            return {
                name: player.name,
                nameFrame: player.nameFrame || 'default',
                classId: player.classId,
                className: classNameMap[player.classId] ? classNameMap[player.classId] : player.classId,
                photo: photoURL,
                inDuel: inDuel,
                studentId: player.studentId
            };
        });

        preparedPlayers.forEach((playerData) => {
            const li = createFriendCard(playerData);
            playersList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = "Şu an oyunda kimse yok.";
        playersList.appendChild(li);
    }
    playersOverlay.style.display = 'flex';
}


        const studentSelectionScreen = document.getElementById('student-selection-screen');
        const mainScreen = document.getElementById('main-screen');
        const singlePlayerScreen = document.getElementById('single-player-screen');
        const singlePlayerGameScreen = document.getElementById('single-player-game-screen');
        const duelSelectionScreen = document.getElementById('duel-selection-screen');
        const duelGameScreen = document.getElementById('duel-game-screen');
        const rankingPanel = document.getElementById('rankingPanel'); // Ranking Panel ID

        const loginButton = document.getElementById('login-button');
        const singlePlayerButton = document.querySelector('.single-player');
        const backButtons = document.querySelectorAll('.back-button');
        const startGameButton = document.getElementById('start-game-button');
        const finalBackButton = document.getElementById('final-back-button');

        const playAgainButton = document.getElementById('btnTekrar');if(playAgainButton && !playAgainButton.dataset.bound){  playAgainButton.dataset.bound='1';  playAgainButton.addEventListener('click', ()=>{ try{ window.scrollTo(0,0);}catch(e){}; location.reload(); });}const selectionClassSelect = document.getElementById('selection-class-select');
        const selectionNameSelect = document.getElementById('selection-name-select');

        const classSelect = document.getElementById('class-select');
        const subjectSelect = document.getElementById('subject-select');
        const topicSelect = document.getElementById('topic-select');

        const studentPasswordInput = document.getElementById('student-password-input');
        const studentSelectionError = document.getElementById('student-selection-error');

        let gameQuestions = [];
        let currentQuestionIndex = 0;
        let score = 0;

        const questionNumber = document.getElementById('question-number');
        const progressBarInner = document.getElementById('progress-bar-inner');
        const questionImage = document.getElementById('question-image');
        const questionText = document.getElementById('question-text');
        const optionsContainer = document.getElementById('options-container');
        const scoreContainer = document.getElementById('score-container');
        const scoreDisplay = document.getElementById('score');
        const scoreMessage = document.getElementById('score-message');
        const scoreImage = document.getElementById('score-image');
        const timerElement = document.getElementById('timer');

        const duelClassSelect = document.getElementById('duel-class-select');
        const duelSubjectSelect = document.getElementById('duel-subject-select');
        const duelTopicSelect = document.getElementById('duel-topic-select');
        const duelStartButton = document.getElementById('duel-start-button');

        let __novaDuelSubjectLazyExpandHandler = null;
        function novaClearDuelSubjectLazyExpand() {
            if (!__novaDuelSubjectLazyExpandHandler || !duelSubjectSelect) return;
            try { duelSubjectSelect.removeEventListener('focus', __novaDuelSubjectLazyExpandHandler); } catch (_) {}
            try { duelSubjectSelect.removeEventListener('pointerdown', __novaDuelSubjectLazyExpandHandler); } catch (_) {}
            __novaDuelSubjectLazyExpandHandler = null;
        }

        const duelInviterPhoto = document.getElementById('duel-inviter-photo');
        const duelInviterName = document.getElementById('duel-inviter-name');
        const duelInvitedPhoto = document.getElementById('duel-invited-photo');
        const duelInvitedName = document.getElementById('duel-invited-name');

        const duelQuestionNumber = document.getElementById('duel-question-number');
        const duelProgressBarInner = document.getElementById('duel-progress-bar-inner');
        const duelTimerElement = document.getElementById('duel-timer');
        const duelQuestionImage = document.getElementById('duel-question-image');
        const duelQuestionText = document.getElementById('duel-question-text');
        const duelOptionsContainer = document.getElementById('duel-options-container');

        const inviterCorrectCountEl = document.getElementById('inviter-correct-count');
        const invitedCorrectCountEl = document.getElementById('invited-correct-count');

        const duelFinalContainer = document.getElementById('duel-final-container');
        const winnerMessage = document.getElementById('winner-message');

        // Ranking Panel Elements
        const kupaSiralamaButton = document.getElementById('kupa-siralama-button');
        const rankingTableBody = document.getElementById('ranking-table-body');
        const rankingBackButton = document.getElementById('rankingBackButton');

        let timer;
        let timeLeft = 45;

        let duelTimer;
        let duelTimeLeft = 45;

        let currentDuelRef = null;
        let isInviter = false;
        let currentInvitation = null;

        let duelQuestions = [];
        let duelCurrentQuestionIndex = 0;
        let duelInviterScore = 0;
        let duelInvitedScore = 0;
        let duelLiveInviterCorrect = 0;
        let duelLiveInvitedCorrect = 0;
        let duelClassId = "";
        let duelSubjectId = "";
        let duelTopicId = "";
        let duelQuestionLocked = false;
        let duelGameStarted = false;

window.onload = async () => {
    try {
        // Cleanup işlemini başlat
        startRejectedInvitesCleanup();
        try { novaBindAdminPortalBtnOnce(); } catch (_) {}
        try { if (typeof window.novaBindSoruKontrolBtnOnce === 'function') window.novaBindSoruKontrolBtnOnce(); } catch (_) {}
        try { if (typeof window.novaBindSoruKontrolBtnOnce === 'function') window.novaBindSoruKontrolBtnOnce(); } catch (_) {}

        // Sınıf ve öğrenci seçimi için event listener'lar
        if (selectionClassSelect) {
            selectionClassSelect.addEventListener('change', () => {
                if (selectionClassSelect.value === "") {
                    if (selectionNameInput) {
                        selectionNameInput.disabled = true;
                        selectionNameInput.value = "";
                    }
                } else if (selectionNameInput) {
                    selectionNameInput.disabled = false;
                }
                checkLoginButtonState();
            });
        }

        if (selectionNameInput) {
            selectionNameInput.addEventListener('input', checkLoginButtonState);
        }

        const storedStudent = localStorage.getItem('selectedStudent');
        if (storedStudent) {
            selectedStudent = JSON.parse(storedStudent);
            if (!selectedStudent.avatarFrame) selectedStudent.avatarFrame = 'default';
            try { window.selectedStudent = selectedStudent; } catch (_) {}
            applyStudentSessionIsolation(selectedStudent);
            
            studentSelectionScreen.style.display = 'none';
            var bootPipelineActive = window.__novaSpriteBootManaged && !window.__novaSpriteBootDone;
            if (!bootPipelineActive) {
              mainScreen.style.removeProperty('display');
            }
            studentSelectionError.textContent = '';
            studentPasswordInput.value = '';

            window.__novaAppMainReady = true;
            try { document.dispatchEvent(new CustomEvent('nova:app-main-ready')); } catch (_) {}
            if (!bootPipelineActive) {
              try {
                if (typeof window.novaApplyMainScreenHudInstant === 'function') {
                  window.novaApplyMainScreenHudInstant();
                }
              } catch (_) {}
            }

            // Fotoğraf / çerçeve — boot prefetch zaten yapıyorsa Firebase tekrarı atlanır
            var skipProfileFetch = bootPipelineActive ||
              window.__novaMainScreenProfileApplied ||
              (window.__novaMainScreenStudentCacheAt && Date.now() - window.__novaMainScreenStudentCacheAt < 120000);
            if (skipProfileFetch) {
              try {
                if (typeof window.novaApplyMainScreenProfileUi === 'function') {
                  await window.novaApplyMainScreenProfileUi();
                } else {
                  syncSelectedNameFrame(selectedStudent.nameFrame || 'default');
                  setNameWithFrame(studentName, selectedStudent.studentName, selectedStudent.nameFrame);
                  try { applyOwnAvatarFrame(); } catch(_) {}
                }
              } catch (_) {}
            } else {
              try {
                const baseRef = database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}`);
                const [photoSnapshot, avatarFrameSnapshot] = await Promise.all([
                  baseRef.child('photo').once('value'),
                  baseRef.child('avatarFrame').once('value')
                ]);

                if (photoSnapshot.exists()) {
                    const photoURL = photoSnapshot.val();
                    studentPhoto.src = photoURL;
                    studentPhoto.style.display = 'block';
                    selectedStudent.photo = photoURL;
                } else {
                    studentPhoto.style.display = 'none';
                }
                if (avatarFrameSnapshot.exists()) {
                    selectedStudent.avatarFrame = avatarFrameSnapshot.val() || 'default';
                }
              } catch (error) {
                console.error("Fotoğraf çekilirken hata:", error);
                studentPhoto.style.display = 'none';
              }

              try{
                const frameSnap = await database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}/nameFrame`).once('value');
                selectedStudent.nameFrame = frameSnap.exists() ? (frameSnap.val() || 'default') : (selectedStudent.nameFrame || 'default');
                selectedStudent.avatarFrame = resolveAvatarFrameByName(selectedStudent.nameFrame, selectedStudent.avatarFrame);
              }catch(_){}
              syncSelectedNameFrame(selectedStudent.nameFrame || 'default');
              setNameWithFrame(studentName, selectedStudent.studentName, selectedStudent.nameFrame);
              try { applyOwnAvatarFrame(); } catch(_) {}
            }
            try { localStorage.setItem('selectedStudent', JSON.stringify(selectedStudent)); } catch(_) {}
            if (window.__novaSpriteBootActive && typeof window.novaWaitSpriteBootComplete === 'function') {
              try { await window.novaWaitSpriteBootComplete(); } catch (_) {}
            } else if (!window.__novaSpriteBootDone && typeof window.novaStartSpriteBoot === 'function' && !window.__novaSpriteBootActive) {
              try { await window.novaStartSpriteBoot({ trigger: 'remembered-onload' }); } catch (_) {}
            } else if (!bootPipelineActive) {
              mainScreen.style.removeProperty('display');
            }

            addLoggedInPlayer(selectedStudent).catch(function(e){ console.error('addLoggedInPlayer', e); });
            startInvitationListener(selectedStudent.studentId);
            if (!bootPipelineActive) {
              if (typeof window.fetchAndDisplayGameCup === 'function' && !window.__novaMainScreenPrefetchDone) {
                window.fetchAndDisplayGameCup(true);
              }
              if (typeof window.novaEnsureMainScreenReady === 'function' && !window.__novaMainScreenBootReady) {
                try { window.novaEnsureMainScreenReady(); } catch (_) {}
              } else if (typeof window.novaStabilizeMainScreen === 'function' && !window.__novaMainScreenBootReady) {
                try { window.novaStabilizeMainScreen(); } catch (_) {}
              } else if (!window.__novaMainScreenBootReady) {
                onMainScreenLoad();
              }
            }
            try { if (typeof window.novaEnsureLoggedInUi === 'function') window.novaEnsureLoggedInUi(); } catch(_) {}
            try { novaBindAdminPortalBtnOnce(); } catch(_) {}
            try { if (typeof window.novaBindSoruKontrolBtnOnce === 'function') window.novaBindSoruKontrolBtnOnce(); } catch (_) {}
            try { await novaSyncAdminPortalFlag(); } catch(_) {}

        } else {
            studentSelectionScreen.style.display = 'flex';
            try { novaUpdateAdminPortalBtn(); } catch(_) {}
        }

        // Önce sınıf adlarını al, sonra champion select'i doldur (scope için önemli)
        if (!window.__novaClassesFetchedForLogin) {
          try { await fetchClassesForSelection(); } catch (e) { console.error('fetchClassesForSelection', e); }
        }
        try{
            if (selectedStudent && selectedStudent.classId) {
                const mapped = (classNameMap && classNameMap[selectedStudent.classId]) ? String(classNameMap[selectedStudent.classId] || '').trim() : '';
                if (mapped && selectedStudent.className !== mapped) {
                    selectedStudent.className = mapped;
                    try { window.selectedStudent = selectedStudent; } catch (_) {}
                    localStorage.setItem('selectedStudent', JSON.stringify(selectedStudent));
                }
            }
        }catch(_){}
        try { await fetchChampionData(); } catch (e) { console.error('fetchChampionData', e); }
        try {
            await enforceSinglePlayerClassLock({ reason: 'boot', preserveLessons: true });
        } catch (e) { console.error('enforceSinglePlayerClassLock', e); }

    } catch (error) {
        console.error("Uygulama başlatma hatası:", error);
    } finally {
        window.__novaAppOnloadDone = true;
        try { document.dispatchEvent(new CustomEvent('nova:app-onload-done')); } catch (_) {}
    }
};
try { window.onMainScreenLoad = onMainScreenLoad; } catch (_) {}
window.addEventListener('pageshow', ()=>{ try{ window.novaEnsureLoggedInUi && window.novaEnsureLoggedInUi(); }catch(_){} });
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden){ try{ window.novaEnsureLoggedInUi && window.novaEnsureLoggedInUi(); }catch(_){} } });

        // Sınıf adları: fetchClassesForSelection + populateClassSelect içinde classNameMap doldurulur (çift tam okuma yok).

        (auth ? auth : null).onAuthStateChanged(user => {
            if (user) {
                console.log("Kullanıcı oturum açtı:", user);
            } else {
                console.log("Kullanıcı oturum açmadı.");
            }
        });

loginButton.addEventListener('click', async () => {
    // Tek login akışını kullan: aynı sorgunun iki kez çalışmasını engeller.
    return handleLogin();
    const selectedClass = selectionClassSelect.value;
    const enteredUsername = selectionNameInput.value.trim(); // Yeni input değerini al
    const enteredPassword = studentPasswordInput.value.trim();

    if (!selectedClass || !enteredUsername) {
        studentSelectionError.textContent = 'Lütfen tüm alanları doldurunuz.';
        return;
    }

    // Kullanıcı ID'sini ve bilgilerini veritabanından al
    try {
        const studentsRef = database.ref(`classes/${selectedClass}/students`);
        const snapshot = await studentsRef.orderByChild('name').equalTo(enteredUsername).once('value');

        if (!snapshot.exists()) {
            studentSelectionError.textContent = 'Kullanıcı bulunamadı.';
            return;
        }

        // Snapshot'tan ilk (ve muhtemelen tek) kullanıcıyı al
        const studentData = Object.entries(snapshot.val())[0];
        const studentId = studentData[0]; // Firebase tarafından oluşturulan ID
        const studentInfo = studentData[1]; // Kullanıcı bilgileri

        // selectedStudent nesnesini güncelle
        selectedStudent.classId = selectedClass;
        selectedStudent.studentId = studentId;
        selectedStudent.studentName = studentInfo.name;
        selectedStudent.className = (classNameMap && classNameMap[selectedClass]) ? classNameMap[selectedClass] : ((selectionClassSelect && selectionClassSelect.options && selectionClassSelect.selectedIndex >= 0) ? (selectionClassSelect.options[selectionClassSelect.selectedIndex].text || '') : '');
        selectedStudent.nameFrame = studentInfo.nameFrame || 'default';
        selectedStudent.avatarFrame = studentInfo.avatarFrame || 'default';
        selectedStudent.photo = studentInfo.photo || '';

        if (enteredPassword === "") {
            studentSelectionError.textContent = 'Lütfen şifrenizi giriniz.';
            return;
        }

        const correctPassword = (studentInfo && Object.prototype.hasOwnProperty.call(studentInfo, 'password')) ? studentInfo.password : undefined;
        if (correctPassword === undefined || correctPassword === null) {
            studentSelectionError.textContent = 'Bu öğrenci için şifre tanımlanmamış.';
            return;
        }
        if (enteredPassword !== String(correctPassword)) {
            studentSelectionError.textContent = 'Yanlış şifre. Lütfen tekrar deneyiniz.';
            return;
        }

        studentSelectionScreen.style.display = 'none';
        mainScreen.style.removeProperty('display');
        studentSelectionError.textContent = '';
        studentPasswordInput.value = '';

        try {
            const photoURL = studentInfo && studentInfo.photo ? String(studentInfo.photo) : '';
            if (photoURL) {
                studentPhoto.src = photoURL;
                studentPhoto.style.display = 'block';
            } else {
                studentPhoto.style.display = 'none';
            }
        } catch (error) {
            console.error("Fotoğraf gösterilirken hata:", error);
            studentPhoto.style.display = 'none';
        }

        setNameWithFrame(studentName, selectedStudent.studentName, selectedStudent.nameFrame);
        (async function () {
            try {
                await addLoggedInPlayer(selectedStudent);
                startInvitationListener(selectedStudent.studentId);
                if (typeof window.fetchAndDisplayGameCup === 'function') window.fetchAndDisplayGameCup();
                onMainScreenLoad();
                localStorage.setItem('selectedStudent', JSON.stringify(selectedStudent));
            } catch (e) {
                console.error(e);
            }
        })();

    } catch (error) {
        console.error("Kullanıcı arama hatası:", error);
        studentSelectionError.textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
    }
});

// Elmas sayısını güncelleme fonksiyonu
// Elmas sayısını güncelleme fonksiyonu
async function updateDiamondCount() {
    if (!selectedStudent?.studentId) return;
    
    try {
        const studentRef = database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}`);
        const [diamondSnap, lastUpdateSnap] = await Promise.all([
          studentRef.child('diamond').once('value'),
          studentRef.child('lastDiamondUpdate').once('value')
        ]);
        const userData = {
          diamond: diamondSnap.exists() ? Number(diamondSnap.val() || 0) : 0,
          lastDiamondUpdate: lastUpdateSnap.exists() ? Number(lastUpdateSnap.val() || 0) : 0
        };
        
        const currentTime = Date.now();
        const lastUpdate = userData.lastDiamondUpdate || currentTime;
        const hoursPassed = Math.floor((currentTime - lastUpdate) / (1000 * 60 * 60));
        
        if (hoursPassed > 0) {
            // Mevcut elmas sayısı
            let currentDiamonds = userData.diamond || 0;
            
            // Eğer mevcut elmas sayısı 30'dan küçükse saatlik artış uygula
            if (currentDiamonds < 30) {
                // Eklenecek elmas sayısı (saatte 1)
                let diamondsToAdd = hoursPassed * 10;
                // Yeni toplam elmas sayısı (maksimum 30)
                let newDiamonds = Math.min(currentDiamonds + diamondsToAdd, 30);
                
                await studentRef.update({
                    diamond: newDiamonds,
                    lastDiamondUpdate: currentTime
                });
                
                document.getElementById('diamond-value').textContent = newDiamonds;
            } else {
                // Elmas sayısı zaten 30 veya üzerindeyse mevcut değeri koru
                document.getElementById('diamond-value').textContent = currentDiamonds;
                await studentRef.update({
                    lastDiamondUpdate: currentTime
                });
            }
        } else {
            document.getElementById('diamond-value').textContent = userData.diamond || 0;
        }
    } catch (error) {
        console.error("Elmas güncelleme hatası:", error);
    }
}

let __mainScreenDiamondIntervalId = null;
let __mainScreenCreditsFetchTs = 0;
let __mainScreenCreditsCache = null;
let __cupFetchInFlight = false;
let __cupFetchLastTs = 0;

function fetchAndDisplayGameCup(force) {
    var student = null;
    try {
      if (typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId) {
        student = selectedStudent;
      }
    } catch (_) {}
    if (!student && window.selectedStudent && window.selectedStudent.studentId) {
      student = window.selectedStudent;
    }
    if (!student?.studentId) return Promise.resolve(false);
    try {
      if (typeof window.novaApplyGameCupLeague === 'function') {
        if (window.__novaCachedGameCup != null) {
          window.novaApplyGameCupLeague(window.__novaCachedGameCup);
        } else if (student.gameCup != null) {
          window.novaApplyGameCupLeague(Number(student.gameCup) || 0);
        }
      }
    } catch (_) {}
    const now = Date.now();
    if (__cupFetchInFlight) {
      if (!force) return Promise.resolve(true);
      return new Promise(function (resolve) {
        var tries = 0;
        (function waitTurn() {
          if (!__cupFetchInFlight || tries > 40) {
            resolve(fetchAndDisplayGameCup(false));
            return;
          }
          tries += 1;
          setTimeout(waitTurn, 50);
        })();
      });
    }
    if (!force && (now - __cupFetchLastTs) < 900) return Promise.resolve(true);
    __cupFetchInFlight = true;
    __cupFetchLastTs = now;
    return database.ref(`classes/${student.classId}/students/${student.studentId}/gameCup`).once('value').then(snapshot => {
        var cnt = 0;
        if (snapshot.exists()) {
            cnt = Number(snapshot.val()) || 0;
        } else {
            database.ref(`classes/${student.classId}/students/${student.studentId}/gameCup`).set(0);
        }
        try {
            if (typeof window.novaApplyGameCupLeague === 'function') {
              window.novaApplyGameCupLeague(cnt);
            } else {
              var cupEl = document.getElementById('game-cup-score');
              if (cupEl) cupEl.textContent = String(cnt);
              var st = document.getElementById('student-stars');
              var rk = document.getElementById('student-rank');
              if (st && typeof getStars === 'function') st.innerHTML = getStars(cnt);
              if (rk && typeof getRankHTML === 'function') rk.innerHTML = getRankHTML(cnt);
            }
        } catch (e) { console.warn('Yıldız/rütbe (kupa) güncellenemedi:', e); }
        try { if (typeof refreshDuelEntryGateNote === 'function') refreshDuelEntryGateNote(); } catch(_){}
        window.__novaLigCupLoaded = true;
        return cnt;
    }).catch(error => {
        console.error("gameCup çekilirken hata:", error);
        try {
          if (typeof window.novaApplyGameCupLeague === 'function') window.novaApplyGameCupLeague(0);
        } catch (_) {}
        try { if (typeof refreshDuelEntryGateNote === 'function') refreshDuelEntryGateNote(); } catch(_){}
        return 0;
    }).finally(function () {
        __cupFetchInFlight = false;
    });
}
try { window.fetchAndDisplayGameCup = fetchAndDisplayGameCup; } catch (_) {}

function applyMainScreenCreditsState(userData){
    try{
      const creditsStats = document.getElementById('credits-stats');
      const creditsValue = document.getElementById('duel-credits-value');
      if (!creditsStats || !creditsValue) return;
      if (userData.unlimitedCreditsUntil && userData.unlimitedCreditsUntil > Date.now()) {
          creditsStats.classList.add('unlimited');
          const daysLeft = Math.ceil((userData.unlimitedCreditsUntil - Date.now()) / (1000 * 60 * 60 * 24));
          creditsValue.innerHTML = `<span class="unlimited-badge">${daysLeft}Gün</span>`;
      } else {
          creditsStats.classList.remove('unlimited');
          creditsValue.textContent = userData.duelCredits || 0;
      }
    }catch(_){}
}

function novaRequestHudFabRelayout(opts){
  opts = opts || {};
  var light = !!opts.light;
  try{
    if (typeof window.novaFixHudFabLayout === 'function'){
      window.novaFixHudFabLayout();
    }
  }catch(_){}
  if (!light) {
    try{
      document.dispatchEvent(new CustomEvent('nova:main-screen-visible'));
    }catch(_){}
    try{
      window.dispatchEvent(new Event('resize'));
    }catch(_){}
  }
  [120, 380].forEach(function(ms){
    setTimeout(function(){
      try{
        if (typeof window.novaFixHudFabLayout === 'function'){
          window.novaFixHudFabLayout();
        }
      }catch(_){}
      try {
        if (typeof window.novaResetMainScreenScroll === 'function') window.novaResetMainScreenScroll();
        if (typeof window.novaSyncMainScreenScrollLock === 'function') window.novaSyncMainScreenScrollLock();
      } catch (_) {}
    }, ms);
  });
}

// Ana ekrana gelindiğinde elmas sayısını güncelle
function onMainScreenLoad() {
    if (window.__novaMainScreenLoadDone) return;
    try { if (typeof window.novaApplyMainScreenHudInstant === 'function') window.novaApplyMainScreenHudInstant(); } catch(_) {}
    try { if (typeof window.novaEnsureLoggedInUi === 'function') window.novaEnsureLoggedInUi({ light: true }); } catch(_) {}
    var lazyTabs = typeof window.novaMainTabsLazyEnabled === 'function' && window.novaMainTabsLazyEnabled();
    if (!lazyTabs) {
      var heroReady = false;
      try {
        if (typeof window.novaMainScreenSlotStatus === 'function') heroReady = !!window.novaMainScreenSlotStatus().hero;
      } catch (_) {}
      if (!heroReady && typeof window.novaRefreshMainScreenHero === 'function') {
        try { window.novaRefreshMainScreenHero(); } catch (_) {}
      }
    }
    novaRequestHudFabRelayout();

    try {
      if (typeof window.novaResetMainScreenScroll === 'function') window.novaResetMainScreenScroll();
      if (typeof window.novaSyncMainScreenScrollLock === 'function') window.novaSyncMainScreenScrollLock();
    } catch (_) {}

    if (!lazyTabs) {
      updateDiamondCount();
      try { applyOwnAvatarFrame(); } catch(_) {}
    
    const now = Date.now();
    var prefetchedCredits = window.__novaMainScreenCreditsPrefetch;
    if (prefetchedCredits && prefetchedCredits.at && now - prefetchedCredits.at < 120000) {
      applyMainScreenCreditsState({
        duelCredits: prefetchedCredits.duelCredits,
        unlimitedCreditsUntil: prefetchedCredits.unlimitedCreditsUntil
      });
      __mainScreenCreditsCache = {
        duelCredits: prefetchedCredits.duelCredits,
        unlimitedCreditsUntil: prefetchedCredits.unlimitedCreditsUntil
      };
      __mainScreenCreditsFetchTs = prefetchedCredits.at;
    } else if (__mainScreenCreditsCache && (now - __mainScreenCreditsFetchTs) < 15000) {
      applyMainScreenCreditsState(__mainScreenCreditsCache);
    } else {
      const studentRef = database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}`);
      Promise.all([
        studentRef.child('duelCredits').once('value'),
        studentRef.child('unlimitedCreditsUntil').once('value')
      ]).then(([creditsSnap, unlimitedSnap]) => {
          const userData = {
            duelCredits: creditsSnap.exists() ? Number(creditsSnap.val() || 0) : 0,
            unlimitedCreditsUntil: unlimitedSnap.exists() ? Number(unlimitedSnap.val() || 0) : 0
          };
          __mainScreenCreditsCache = userData;
          __mainScreenCreditsFetchTs = Date.now();
          applyMainScreenCreditsState(userData);
      });
    }

    if (!__mainScreenDiamondIntervalId) {
      __mainScreenDiamondIntervalId = setInterval(updateDiamondCount, 1000 * 60 * 60);
    }
    } else {
      try { applyOwnAvatarFrame(); } catch(_) {}
    }
    window.__novaMainScreenLoadDone = true;
}

function novaEnsureLoggedInUi(opts){
  opts = opts || {};
  try{
    const ss = document.getElementById('student-selection-screen');
    const ms = document.getElementById('main-screen');
    if (!ss || !ms) return;
    var st = (typeof window.novaGetActiveStudent === 'function')
      ? window.novaGetActiveStudent()
      : (window.selectedStudent || null);
    try {
      if (typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId && selectedStudent.classId) {
        st = selectedStudent;
      }
    } catch (_) {}
    const hasSession = !!(st && st.studentId && st.classId);
    if (hasSession){
      ss.style.display = 'none';
      ms.style.removeProperty('display');
      try { novaRequestHudFabRelayout({ light: !!opts.light }); } catch(_) {}
      try {
      } catch (_) {}
      if (!window.__novaLoginGuardObs){
        window.__novaLoginGuardObs = new MutationObserver(() => {
          try{
            var active = (typeof window.novaGetActiveStudent === 'function')
              ? window.novaGetActiveStudent()
              : (window.selectedStudent || null);
            try {
              if (typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId && selectedStudent.classId) {
                active = selectedStudent;
              }
            } catch (_) {}
            const ok = !!(active && active.studentId && active.classId);
            if (!ok) return;
            if (ss.style.display !== 'none') ss.style.display = 'none';
            if (ms.style.display === 'none') ms.style.removeProperty('display');
          }catch(_){}
        });
        window.__novaLoginGuardObs.observe(ss, { attributes: true, attributeFilter: ['style', 'class'] });
      }
    }
  }catch(_){}
}
try { window.novaEnsureLoggedInUi = novaEnsureLoggedInUi; } catch(_) {}

/** Firebase: adminPanelUsers/{classId}/{studentId} = true → ana ekranda «Yönetici» */
function novaUpdateAdminPortalBtn(){
  try{
    const btn = document.getElementById('nova_admin_portal_btn');
    const slot = document.getElementById('nova_admin_portal_slot');
    const ok = !!(typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId && selectedStudent.classId && selectedStudent.adminPortal);
    if (slot) slot.hidden = !ok;
    if (btn) btn.hidden = !ok;
  }catch(_){}
}
async function novaSyncAdminPortalFlag(){
  try{
    if (typeof selectedStudent === 'undefined' || !selectedStudent || !selectedStudent.classId || !selectedStudent.studentId){
      novaUpdateAdminPortalBtn();
      return;
    }
    const snap = await database.ref('adminPanelUsers/' + selectedStudent.classId + '/' + selectedStudent.studentId).once('value');
    selectedStudent.adminPortal = !!(snap.exists() && snap.val());
    try { localStorage.setItem('selectedStudent', JSON.stringify(selectedStudent)); } catch (_) {}
  } catch (e) {
    console.warn('novaSyncAdminPortalFlag', e);
  }
  novaUpdateAdminPortalBtn();
}
try { window.novaSyncAdminPortalFlag = novaSyncAdminPortalFlag; } catch (_) {}
try { window.novaUpdateAdminPortalBtn = novaUpdateAdminPortalBtn; } catch (_) {}

function novaBindAdminPortalBtnOnce(){
  const btn = document.getElementById('nova_admin_portal_btn');
  if (!btn || btn.dataset.novaBound) return;
  btn.dataset.novaBound = '1';
  btn.addEventListener('click', function () {
    try {
      sessionStorage.setItem('nova_admin_from_student', JSON.stringify({
        ts: Date.now(),
        classId: selectedStudent.classId,
        studentId: selectedStudent.studentId
      }));
    } catch (_) {}
    try { window.location.href = 'admin.html'; } catch (_) { window.location.assign('admin.html'); }
  });
}

// Yeni input elementi için referans
const selectionNameInput = document.getElementById('selection-name-input');

// Login butonuna yeni kontrol fonksiyonu
async function handleLogin() {
    const enteredUsername = selectionNameInput.value.trim();
    const selectedClass = selectionClassSelect.value;
    const enteredPassword = studentPasswordInput.value.trim();

    if (!enteredUsername || !selectedClass || !enteredPassword) {
        studentSelectionError.textContent = 'Lütfen tüm alanları doldurunuz.';
        return;
    }

    try {
        // Kullanıcı adını veritabanında ara
        const studentsRef = database.ref(`classes/${selectedClass}/students`);
        const snapshot = await studentsRef.orderByChild('name').equalTo(enteredUsername).once('value');

        if (!snapshot.exists()) {
            studentSelectionError.textContent = 'Kullanıcı bulunamadı.';
            return;
        }

        // Kullanıcı bilgilerini al
        const studentData = Object.entries(snapshot.val())[0];
        const studentId = studentData[0];
        const studentInfo = studentData[1];

        // Şifre kontrolü
        if (enteredPassword !== studentInfo.password) {
            studentSelectionError.textContent = 'Yanlış şifre.';
            return;
        }

        // Login işlemleri
        selectedStudent = {
            classId: selectedClass,
            studentId: studentId,
            studentName: studentInfo.name,
            className: (classNameMap && classNameMap[selectedClass]) ? classNameMap[selectedClass] : ((selectionClassSelect && selectionClassSelect.options && selectionClassSelect.selectedIndex >= 0) ? (selectionClassSelect.options[selectionClassSelect.selectedIndex].text || '') : ''),
            nameFrame: studentInfo.nameFrame || 'default',
            avatarFrame: studentInfo.avatarFrame || 'default',
            photo: studentInfo.photo || ''
        };
        applyStudentSessionIsolation(selectedStudent);
        if (!selectedStudent.className) {
            try {
                const clsSnap = await database.ref('classes/' + selectedClass + '/name').once('value');
                if (clsSnap.exists()) selectedStudent.className = String(clsSnap.val() || '').trim();
            } catch (_) {}
        }

        try { localStorage.setItem('selectedStudent', JSON.stringify(selectedStudent)); } catch (_) {}

        try {
          document.documentElement.classList.add('nova-has-session', 'nova-boot-pending');
          document.body.classList.remove('nova-login-fast-visible');
        } catch (_) {}

        studentSelectionScreen.style.display = 'none';
        studentSelectionError.textContent = '';
        studentPasswordInput.value = '';

        if (studentInfo.photo) {
            studentPhoto.src = studentInfo.photo;
            studentPhoto.style.display = 'block';
        } else {
            studentPhoto.style.display = 'none';
        }
        applyOwnAvatarFrame();

        if (typeof window.novaStartSpriteBoot === 'function') {
            await window.novaStartSpriteBoot({ trigger: 'login' });
            if (typeof window.novaForceBootHandoff === 'function') {
                try { await window.novaForceBootHandoff('login-complete'); } catch (_) {}
            }
        } else {
            mainScreen.style.removeProperty('display');
        }
        if (typeof window.novaReturnToMainScreen === 'function') {
            window.novaReturnToMainScreen({ skipPerf: true });
        }

        setNameWithFrame(studentName, studentInfo.name, selectedStudent.nameFrame);
        await addLoggedInPlayer(selectedStudent);
        startInvitationListener(selectedStudent.studentId);
        if (typeof window.fetchAndDisplayGameCup === 'function' && !window.__novaMainScreenPrefetchDone) {
          window.fetchAndDisplayGameCup();
        }
        if (!window.__novaMainScreenLoadDone) {
            onMainScreenLoad();
        }
        try {
            await enforceSinglePlayerClassLock({ reason: 'login', preserveLessons: true });
        } catch (_) {}

        await novaSyncAdminPortalFlag();

    } catch (error) {
        console.error("Login hatası:", error);
        studentSelectionError.textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
    }
}

// Ana değişkenler
const friendsButton = document.querySelector('.friends-button');
const friendsScreen = document.getElementById('friends-screen');
const friendSearchInput = document.getElementById('friend-search');
const searchButton = document.getElementById('search-button');
const searchResults = document.getElementById('search-results');
const friendsList = document.getElementById('friends-list');
const FRIENDS_FEATURE_ENABLED = false;

function disableFriendsFeatureUi() {
    try {
        if (friendsButton && friendsButton.parentNode) friendsButton.parentNode.removeChild(friendsButton);
    } catch (_) {}
    try {
        if (friendsScreen) friendsScreen.style.display = 'none';
    } catch (_) {}
}
if (!FRIENDS_FEATURE_ENABLED) disableFriendsFeatureUi();

// Arkadaşlar butonuna tıklama olayı
if (FRIENDS_FEATURE_ENABLED && friendsButton && friendsScreen) {
    friendsButton.addEventListener('click', () => {
        mainScreen.style.setProperty('display', 'none', 'important');
        friendsScreen.style.display = 'flex';
        loadFriendsList(); // Arkadaş listesini yükle
    });
}

// Geri dön butonu için olay dinleyici
if (FRIENDS_FEATURE_ENABLED && friendsScreen) {
    const friendsBackButton = friendsScreen.querySelector('.back-button');
    if (friendsBackButton) {
        friendsBackButton.addEventListener('click', () => {
            friendsScreen.style.display = 'none';
            mainScreen.style.removeProperty('display');
        });
    }
}

// Arkadaş arama işlevi
if (FRIENDS_FEATURE_ENABLED && searchButton && friendSearchInput) {
    searchButton.addEventListener('click', searchFriends);
    friendSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchFriends();
        }
    });
}

async function searchFriends() {
    if (!FRIENDS_FEATURE_ENABLED) return;
    const searchTerm = friendSearchInput.value.toLowerCase().trim();
    if (!searchTerm) return;
    
    searchResults.innerHTML = '<div class="loading">Aranıyor...</div>';
    
    try {
        const cid = selectedStudent.classId;
        let classLabel = (typeof classNameMap !== 'undefined' && classNameMap[cid]) ? classNameMap[cid] : '';
        if (!classLabel) {
            try {
                const ns = await database.ref(`classes/${cid}/name`).once('value');
                classLabel = ns.exists() ? String(ns.val() || '') : '';
            } catch (_) {
                classLabel = '';
            }
        }
        if (!classLabel) classLabel = cid;
        const results = [];
        const studentsRef = database.ref(`classes/${cid}/students`);
        let usedFullScanFallback = false;
        try {
            const prefixSnap = await studentsRef
                .orderByChild('nameLower')
                .startAt(searchTerm)
                .endAt(searchTerm + '\uf8ff')
                .limitToFirst(30)
                .once('value');
            if (prefixSnap.exists()) {
                prefixSnap.forEach(child => {
                    const studentId = child.key;
                    const studentData = child.val() || {};
                    if (studentId === selectedStudent.studentId) return;
                    results.push({
                        studentId,
                        classId: cid,
                        className: classLabel,
                        ...studentData
                    });
                });
            }
        } catch (_) {}

        // Fallback: preserve old "contains" behavior when index is missing or no prefix match.
        if (!results.length) {
            usedFullScanFallback = true;
            const snapshot = await studentsRef.once('value');
            const students = snapshot.exists() ? (snapshot.val() || {}) : {};
            Object.entries(students).forEach(([studentId, studentData]) => {
                if (studentData && studentData.name && String(studentData.name).toLowerCase().includes(searchTerm) &&
                    studentId !== selectedStudent.studentId) {
                    results.push({
                        studentId,
                        classId: cid,
                        className: classLabel,
                        ...studentData
                    });
                }
            });
        }
        if (usedFullScanFallback) {
            console.warn('searchFriends: nameLower index bulunamadı veya sonuç yok, full scan fallback kullanıldı.');
        }
        displaySearchResults(results);
    } catch (error) {
        console.error("Arama hatası:", error);
        searchResults.innerHTML = '<div class="error">Arama hatası oluştu</div>';
    }
}








/**
 * Düello puanlama (tek kaynak):
 * - Oyun normal biter: kazanan +6 kupa +15 düello enerjisi +10 elmas, kaybeden yalnızca -3 kupa alır.
 *   Seri avatar çerçevesi takılıysa (ve kazandıysa) ekstra kupa verir: +4 (Dünya/Kızlar/Süper), +2 (Temel).
 * - Süre doldu (TIME_OUT): kupa +6/-3 (mevcut senaryoya göre).
 * - Eşleşmeden sonra çıkma: çıkan -15 düello enerjisi; kupa değişmez; rakibe kredi verilmez.
 */
async function updateDuelScore(type, data) {
    const {inviterId, inviterClassId, invitedId, invitedClassId} = data;
    
    try {
        switch(type) {
            case 'TIME_OUT':
                // Süre doldu: kupa kuralı — kazanan +6, kaybeden -3 (burada misafir kazanır)
                await Promise.all([
                    database.ref(`classes/${inviterClassId}/students/${inviterId}/gameCup`)
                        .transaction(current => Math.max((current || 0) - 3, 0)),
                    database.ref(`classes/${invitedClassId}/students/${invitedId}/gameCup`)
                        .transaction(current => (current || 0) + 6)
                ]);
                await showAlert('⏰ Süre doldu! Misafir oyuncu kazandı. (Kupa: +6 / -3)');
                break;

            case 'DISCONNECTED':
    // Sadece OYUNDAN ÇIKAN kişiyi banla; kalan kişiye sadece bilgilendirme göster.
    try {
        const dcId = data && (data.disconnectedId || data.playerId || data.uid || data.studentId);
        const dcClassId = data && (data.disconnectedClassId || data.classId || data.classID);
        if (!dcId) {
            console.warn('DISCONNECTED event without dcId, işlem yapılmadı.');
            break;
        }

        // Bu istemci OYUNDAN ÇIKAN kişi mi?
        const currentUid = (auth && (auth ? auth : null).currentUser && (auth ? auth : null).currentUser.uid) ? (auth ? auth : null).currentUser.uid : null;
        const currentStudentId = (typeof currentStudent !== 'undefined' && currentStudent && currentStudent.studentId) ? currentStudent.studentId : null;
        const selectedId = (typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId) ? selectedStudent.studentId : null;
        const localId = currentStudentId || currentUid || selectedId;

        const isLeaver = (localId && (localId === dcId));
        // Eşleşmeden sonra çıkan: sadece çıkan oyuncu -15 düello enerjisi (rakibe kredi verilmez; kupa değişmez)
        try {
            const invId = data && (data.inviterId || data.hostId);
            const invClassId = data && (data.inviterClassId || data.hostClassId);
            const inId = data && (data.invitedId || data.guestId);
            const inClassId = data && (data.invitedClassId || data.guestClassId);
            const dcId2 = data && (data.disconnectedId || data.playerId || data.uid || data.studentId);
            const dcClassId2 = data && (data.disconnectedClassId || data.classId || data.classID);

            if (!isLeaver && dcId2) {
                let leaverId = dcId2, leaverClassId = dcClassId2 || null;
                if (invId && inId) {
                    if (dcId2 === invId) { leaverClassId = leaverClassId || invClassId; }
                    else if (dcId2 === inId) { leaverClassId = leaverClassId || inClassId; }
                }
                if (leaverId && leaverClassId) {
                    await database.ref(`classes/${leaverClassId}/students/${leaverId}/duelCredits`).transaction(v => {
                        const n = (v || 0) - 15;
                        return n < 0 ? 0 : n;
                    });
                }
            }
        } catch (e) {
            console.warn('DISCONNECTED kredi dağıtımı hatası:', e);
        }


        if (isLeaver) {
            // YALNIZCA ayrılan istemcide ban yaz ve uyarı göster
            const TEN_MINUTES_MS = 10 * 60 * 1000;
            const expiresAt = Date.now() + TEN_MINUTES_MS;
            let wrote = false;
            if (typeof database !== 'undefined') {
                try { await database.ref(`inviteBans/${dcId}`).set({ expiresAt }); wrote = true; } catch(e1){ console.warn('inviteBans global yazma hatası:', e1); }
                if (dcClassId) {
                    try { await database.ref(`classes/${dcClassId}/inviteBans/${dcId}`).set({ expiresAt }); wrote = true; } catch(e2){ console.warn('inviteBans class yazma hatası:', e2); }
                }
            }
            if (typeof showAlert === 'function') {
                const msg = wrote 
                    ? 'Bağlantınız kesildi. Kupa değişmedi. 10 dakika davet gönderemezsiniz.'
                    : 'Bağlantınız kesildi. Kupa değişmedi. (Ceza kaydı yazılamadı, loglandı.)';
                await showAlert(msg);
            }
        } else {
            // Bu istemci ayrılan kişi DEĞİL → sadece bilgi ver (ban yazma!)
            if (typeof showAlert === 'function') {
                await showAlert('Rakibiniz oyundan ayrıldı. Çıkan oyuncunun 15 düello enerjisi düşürüldü (kupa değişmedi).');
            }
        }
    } catch (err) {
        console.error('DISCONNECTED işleminde hata:', err);
        if (typeof showAlert === 'function') {
            await showAlert('Bağlantı kesildi olayı işlendi, ancak beklenmeyen bir hata oluştu.');
        }
    }
    break;

            case 'GAME_END':
                
                // Normal oyun sonu: Kazanan +6, Kaybeden -3 (tek sefer)
                const {winnerId, winnerClassId, loserId, loserClassId} = data;
                const winnerAvatarFrame = data && data.winnerAvatarFrame ? String(data.winnerAvatarFrame) : 'default';
                const extraCup = getDuelCupBonusByAvatarFrame(winnerAvatarFrame);

                let canApply = true;
                try {
                    if (typeof currentDuelRef !== 'undefined' && currentDuelRef) {
                        const tx = await currentDuelRef.child('scoreApplied').transaction((val) => {
                            if (val === true) return; // zaten uygulanmış
                            return true;              // ilk uygulama
                        });
                        if (!tx.committed) {
                            canApply = false;
                        }
                    }
                } catch (e) {
                    console.warn('scoreApplied transaction yapılamadı:', e);
                }

                if (canApply && winnerId && loserId) {
                    let duelDiamondGain = 10;
                    var heroCupBonus = 0;
                    var heroCreditBonus = 0;
                    await Promise.all([
                        database.ref(`classes/${winnerClassId}/students/${winnerId}`).transaction(user => {
                          user = user || {};
                          heroCupBonus = (typeof window.NOVA_HERO_LEVEL !== 'undefined' && window.NOVA_HERO_LEVEL.getDuelCupBonus)
                            ? window.NOVA_HERO_LEVEL.getDuelCupBonus(user) : 0;
                          heroCreditBonus = (typeof window.NOVA_HERO_LEVEL !== 'undefined' && window.NOVA_HERO_LEVEL.getDuelCreditBonusOnWin)
                            ? window.NOVA_HERO_LEVEL.getDuelCreditBonusOnWin(user) : 0;
                          user.gameCup = Number(user.gameCup || 0) + 6 + extraCup + heroCupBonus;
                          user.duelCredits = Number(user.duelCredits || 0) + 15 + heroCreditBonus;
                          duelDiamondGain = 10;
                          user.diamond = Math.min(25000, Number(user.diamond || 0) + 10);
                          user.lastDiamondUpdate = Date.now();
                          return user;
                        }),
                        database.ref(`classes/${loserClassId}/students/${loserId}/gameCup`).transaction(current => Math.max((current || 0) - 3, 0))
                    ]);
                    try{
                      var localStu = (typeof selectedStudent !== 'undefined' && selectedStudent) ? selectedStudent : null;
                      if(localStu && localStu.studentId && winnerId === localStu.studentId && typeof window.novaQuestRecord === 'function'){
                        window.novaQuestRecord('duel_win', { winnerId: winnerId, loserId: loserId });
                      }
                    }catch(_){}
                    try{
                      var localStu2 = (typeof selectedStudent !== 'undefined' && selectedStudent) ? selectedStudent : null;
                      if (extraCup > 0 && localStu2 && localStu2.studentId && winnerId === localStu2.studentId) {
                        await showAlert(`🔥 Çerçeve bonusu aktif: +${extraCup} ekstra kupa kazandın!`);
                      }
                      if (heroCupBonus > 0 && localStu2 && localStu2.studentId && winnerId === localStu2.studentId) {
                        await showAlert(`🦸 Kahraman bonusu: +${heroCupBonus} ek kupa${heroCreditBonus > 0 ? (' ve +' + heroCreditBonus + ' düello enerjisi') : ''}!`);
                      } else if (heroCreditBonus > 0 && localStu2 && localStu2.studentId && winnerId === localStu2.studentId) {
                        await showAlert(`🦸 Kahraman bonusu: +${heroCreditBonus} düello enerjisi!`);
                      }
                    }catch(_){}
                } else {
                    console.log('GAME_END: puanlar zaten uygulanmış — ikinci yazım engellendi.');
                }
            
                break;
        }
        return true;
    } catch (error) {
        console.error('Puan güncelleme hatası:', error);
        await showAlert('❌ Puan güncellenirken bir hata oluştu!');
        return false;
    }
}
















async function displaySearchResults(results) {
    if (!FRIENDS_FEATURE_ENABLED) return;
    searchResults.innerHTML = '';
    if (!results.length) {
        searchResults.innerHTML = '<div class="no-results">Sonuç bulunamadı</div>';
        return;
    }

    let friendMap = {};
    try {
        const fsSnap = await database.ref(`friendships/${selectedStudent.studentId}`).once('value');
        friendMap = fsSnap.exists() ? (fsSnap.val() || {}) : {};
    } catch (_) {}

    for (const student of results) {
        const isFriend = !!friendMap[student.studentId];
        const inDuel = !!student.inDuel;

        const li = document.createElement('li');
        li.className = 'player-item';

        const photo = student.photo || 'https://via.placeholder.com/50';
        const className = classNameMap[student.classId] || student.classId;

        // Arkadaşlık durumuna göre buton veya metin gösterme
        let actionHtml = '';
        if (inDuel) {
            actionHtml = '<button class="oyunda-button" disabled>Oyunda</button>';
        } else if (isFriend) {
            actionHtml = '<span class="friend-added-text" style="padding: 8px 14px; background-color: #e9ecef; color: #495057; border-radius: 6px;">Arkadaşsınız</span>';
        } else {
            actionHtml = '<button class="add-friend-button">+ Arkadaş Ekle</button>';
        }

        li.innerHTML = `
            <img src="${photo}" alt="${student.name}" class="player-photo">
            <span class="player-name">${renderNameWithFrame(student.name, student.nameFrame)} / (${className}) </span>
            ${getRankHTML(Number(student.gameCup) || 0, true)}
            ${actionHtml}
        `;

        // Sadece arkadaş değilse ve oyunda değilse buton işlevselliği ekle
        if (!isFriend && !inDuel) {
            const button = li.querySelector('.add-friend-button');
            if (button) {
                button.onclick = () => addFriend({
                    id: student.studentId,
                    name: student.name,
                    classId: student.classId,
                    className,
                    photo: student.photo
                });
            }
        }

        searchResults.appendChild(li);
    }
}


async function addFriend(student) {
    if (!FRIENDS_FEATURE_ENABLED) return;
    try {
        const currentFriendsRef = database.ref(`friendships/${selectedStudent.studentId}`);
        const snapshot = await currentFriendsRef.once('value');
        if (snapshot.numChildren() >= 10) {
            showAlert('En fazla 10 arkadaş ekleyebilirsiniz!');
            return;
        }

        const friendshipData = {
            friendId: student.id,
            friendName: student.name,
            friendNameFrame: student.nameFrame || 'default',
            friendClassId: student.classId,
            friendClassName: student.className,
            friendPhoto: student.photo || null,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        await Promise.all([
            database.ref(`friendships/${selectedStudent.studentId}/${student.id}`).set(friendshipData),
            database.ref(`friendships/${student.id}/${selectedStudent.studentId}`).set({
                friendId: selectedStudent.studentId,
                friendName: selectedStudent.studentName,
                friendNameFrame: selectedStudent.nameFrame || 'default',
                friendClassId: selectedStudent.classId,
                friendClassName: classNameMap[selectedStudent.classId],
                friendPhoto: studentPhoto.src || null,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            })
        ]);

        showAlert('Arkadaş başarıyla eklendi!');
        loadFriendsList();
        searchFriends();
    } catch (error) {
        showAlert('Arkadaş eklenirken hata oluştu');
    }
}

async function checkIfFriend(friendId) {
    if (!FRIENDS_FEATURE_ENABLED) return false;
    const snapshot = await database.ref(`friendships/${selectedStudent.studentId}/${friendId}`).once('value');
    return snapshot.exists();
}

async function addFriend(student) {
    if (!FRIENDS_FEATURE_ENABLED) return;
    try {
        // Önce mevcut arkadaş sayısını kontrol et
        const currentFriendsRef = database.ref(`friendships/${selectedStudent.studentId}`);
        const snapshot = await currentFriendsRef.once('value');
        const currentFriendsCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;

        if (currentFriendsCount >= 10) {
            showAlert('En fazla 10 arkadaş ekleyebilirsiniz!');
            return;
        }

        // Arkadaş zaten ekli mi kontrol et
        const existingFriendRef = database.ref(`friendships/${selectedStudent.studentId}/${student.id}`);
        const existingFriend = await existingFriendRef.once('value');
        
        if (existingFriend.exists()) {
            showAlert('Bu kişi zaten arkadaş listenizde!');
            return;
        }

        const friendshipRef = database.ref(`friendships/${selectedStudent.studentId}/${student.id}`);
        await friendshipRef.set({
            friendId: student.id,
            friendName: student.name,
            friendNameFrame: student.nameFrame || 'default',
            friendClassId: student.classId,
            friendClassName: classNameMap[student.classId] || student.classId,
            friendPhoto: student.photo || null,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });

        showAlert('Arkadaş başarıyla eklendi!');
        loadFriendsList(); // Listeyi yenile

    } catch (error) {
        console.error('Arkadaş ekleme hatası:', error);
        showAlert('Arkadaş eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
}

// Arkadaş listesini yükleme fonksiyonunu güncelle
async function loadFriendsList() {
    if (!FRIENDS_FEATURE_ENABLED) {
        if (friendsList) friendsList.innerHTML = '';
        return;
    }
    try {
        // Cache key oluştur
        const CACHE_KEY = `friendsList_${selectedStudent.studentId}`;
        const CACHE_DURATION = 30000; // 30 saniye

        friendsList.innerHTML = '<div class="loading">Yükleniyor...</div>';

        // Cache kontrolü
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(`${CACHE_KEY}_time`);
        
        if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime)) < CACHE_DURATION) {
            friendsList.innerHTML = '';
            const friends = JSON.parse(cachedData);
            await displayCachedFriends(friends);
            return;
        }

        const friendshipsRef = database.ref(`friendships/${selectedStudent.studentId}`);
        const snapshot = await friendshipsRef.once('value');

        if (!snapshot.exists()) {
            friendsList.innerHTML = '<div class="no-friends">Henüz arkadaşınız yok</div>';
            return;
        }

        friendsList.innerHTML = '';
        const friends = [];

        // Arkadaşları topla (3N yaprak okuma yerine arkadaş başına tek student düğümü okuma).
        const entries = Object.entries(snapshot.val() || {});
        const BATCH = 12;
        for (let i = 0; i < entries.length; i += BATCH) {
            const chunk = entries.slice(i, i + BATCH);
            const rows = await Promise.all(chunk.map(async function ([friendId, friendData]) {
                let liveStudent = null;
                try {
                    const studentSnap = await database.ref(`classes/${friendData.friendClassId}/students/${friendId}`).once('value');
                    liveStudent = studentSnap.exists() ? (studentSnap.val() || {}) : null;
                } catch (_) {
                    liveStudent = null;
                }
                return {
                    studentId: friendId,
                    name: friendData.friendName,
                    classId: friendData.friendClassId,
                    className: friendData.friendClassName,
                    photo: (liveStudent && liveStudent.photo) ? liveStudent.photo : (friendData.friendPhoto || 'https://via.placeholder.com/50'),
                    nameFrame: (liveStudent && liveStudent.nameFrame) ? liveStudent.nameFrame : (friendData.friendNameFrame || 'default'),
                    inDuel: !!(liveStudent && liveStudent.inDuel),
                    isOnline: false
                };
            }));
            rows.forEach(function (row) { friends.push(row); });
        }

        // Tek limitToLast(300) okuma + studentId seti (N ayrı sorgu yerine)
        try {
            const lpObj = await fetchLoggedInPlayersMapLimited();
            const onlineIds = new Set();
            Object.values(lpObj || {}).forEach(function (p) {
                if (p && p.studentId != null && String(p.studentId).trim() !== '') {
                    onlineIds.add(String(p.studentId));
                }
            });
            friends.forEach(function (friend) {
                friend.isOnline = onlineIds.has(String(friend.studentId));
            });
        } catch (_) {
            friends.forEach(function (friend) { friend.isOnline = false; });
        }

        // Stil tanımlaması
        const style = document.createElement('style');
        style.textContent = `
            .remove-friend-button {
                background-color: #dc3545;
                color: white;
                border: none;
                border-radius: 12px;
                width: 25px;
                height: 25px;
                line-height: 25px;
                text-align: center;
                cursor: pointer;
                margin-left: 10px;
                font-size: 14px;
                transition: all 0.3s ease;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            
            .remove-friend-button:hover {
                background-color: #c82333;
                transform: scale(1.1);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
        `;
        document.head.appendChild(style);

        // Cache'e kaydet
        localStorage.setItem(CACHE_KEY, JSON.stringify(friends));
        localStorage.setItem(`${CACHE_KEY}_time`, Date.now().toString());

        // Arkadaş listesini göster
        friends.forEach(friend => {
            const li = document.createElement('li');
            li.className = 'player-item';

            let buttonClass = 'davet-et-button';
            let buttonText = 'Davet Et';
            let isDisabled = false;

            if (friend.inDuel) {
                buttonClass = 'oyunda-button';
                buttonText = 'Oyunda';
                isDisabled = true;
            } else if (!friend.isOnline) {
                buttonClass = 'offline-button';
                buttonText = 'Çevrimdışı';
                isDisabled = true;
            }

            li.innerHTML = `
                <img src="${friend.photo}" alt="${friend.name}" class="player-photo">
                <span class="player-name">${renderNameWithFrame(friend.name, friend.nameFrame)} / (${friend.className})</span>
                <div style="display: flex; align-items: center;">
                    <button class="${buttonClass}" ${isDisabled ? 'disabled' : ''}>${buttonText}</button>
                    <button class="remove-friend-button" title="Arkadaşı Sil">✖</button>
                </div>
            `;

            if (!isDisabled) {
                const davetButton = li.querySelector(`.${buttonClass}`);
                davetButton.onclick = () => sendInvitation(friend);
            }

            const removeButton = li.querySelector('.remove-friend-button');
            removeButton.onclick = async (e) => {
                e.stopPropagation();
                if (await showConfirmation(`${friend.name} arkadaşlıktan çıkarılacak. Emin misiniz?`)) {
                    await removeFriend(friend.studentId);
                    await loadFriendsList();
                }
            };

            friendsList.appendChild(li);
        });

    } catch (error) {
        console.error('Arkadaş listesi yükleme hatası:', error);
        friendsList.innerHTML = '<div class="error">Liste yüklenirken bir hata oluştu</div>';
    }
}

// Cache'den arkadaş listesini gösterme fonksiyonu
async function displayCachedFriends(friends) {
    if (!FRIENDS_FEATURE_ENABLED) return;
    for (const friend of friends) {
        const li = document.createElement('li');
        li.className = 'player-item';

        let buttonClass = 'davet-et-button';
        let buttonText = 'Davet Et';
        let isDisabled = false;

        if (friend.inDuel) {
            buttonClass = 'oyunda-button';
            buttonText = 'Oyunda';
            isDisabled = true;
        } else if (!friend.isOnline) {
            buttonClass = 'offline-button';
            buttonText = 'Çevrimdışı';
            isDisabled = true;
        }

        li.innerHTML = `
            <img src="${friend.photo}" alt="${friend.name}" class="player-photo">
            <span class="player-name">${renderNameWithFrame(friend.name, friend.nameFrame)} / (${friend.className})</span>
            <div style="display: flex; align-items: center;">
                <button class="${buttonClass}" ${isDisabled ? 'disabled' : ''}>${buttonText}</button>
                <button class="remove-friend-button" title="Arkadaşı Sil">✖</button>
            </div>
        `;

        if (!isDisabled) {
            const davetButton = li.querySelector(`.${buttonClass}`);
            davetButton.onclick = () => sendInvitation(friend);
        }

        const removeButton = li.querySelector('.remove-friend-button');
        removeButton.onclick = async (e) => {
            e.stopPropagation();
            if (await showConfirmation(`${friend.name} arkadaşlıktan çıkarılacak. Emin misiniz?`)) {
                await removeFriend(friend.studentId);
                await loadFriendsList();
            }
        };

        friendsList.appendChild(li);
    }
}

// Arkadaş silme fonksiyonu
async function removeFriend(friendId) {
    if (!FRIENDS_FEATURE_ENABLED) return;
    try {
        // Her iki taraftan da arkadaşlığı kaldır
        await database.ref(`friendships/${selectedStudent.studentId}/${friendId}`).remove();
        await database.ref(`friendships/${friendId}/${selectedStudent.studentId}`).remove();
        await showAlert('Arkadaş başarıyla silindi!');
    } catch (error) {
        console.error('Arkadaş silme hatası:', error);
        await showAlert('Arkadaş silinirken bir hata oluştu!');
    }
}

function showConfirmation(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            max-width: 300px;
            width: 90%;
        `;

        dialog.innerHTML = `
            <p style="margin-bottom: 20px;">${message}</p>
            <button id="confirmYes" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 8px 20px;
                border-radius: 5px;
                margin-right: 10px;
                cursor: pointer;
            ">Evet</button>
            <button id="confirmNo" style="
                background: #6c757d;
                color: white;
                border: none;
                padding: 8px 20px;
                border-radius: 5px;
                cursor: pointer;
            ">Hayır</button>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const handleClick = (result) => {
            document.body.removeChild(overlay);
            resolve(result);
        };

        dialog.querySelector('#confirmYes').onclick = () => handleClick(true);
        dialog.querySelector('#confirmNo').onclick = () => handleClick(false);
    });
}




        backButtons.forEach(backButton => {
            backButton.addEventListener('click', () => {
                const currentScreen = backButton.parentElement;
                if(currentScreen.id === 'duel-selection-screen' && currentDuelRef) {
                    // Düello referansını kaldır ve sayfayı yenile
                    currentDuelRef.remove().then(() => {
                        // Her iki oyuncunun inDuel durumunu false yap
                        currentDuelRef.once('value').then(async (snapshot) => {
                            if (snapshot.exists()) {
                                const data = snapshot.val();
                                const inviterRef = database.ref(`classes/${data.inviter.classId}/students/${data.inviter.studentId}/inDuel`);
                                const invitedRef = database.ref(`classes/${data.invited.classId}/students/${data.invited.studentId}/inDuel`);
                                try {
                                    await inviterRef.set(false);
                                    await invitedRef.set(false);
                                } catch (error) {
                                    console.error("inDuel güncellenirken hata:", error);
                                }
                            }
                        });
                        currentDuelRef = null;
                        isInviter = false;
                        duelGameStarted = false;
                        window.location.reload();
                    }).catch(error => {
                        console.error("Düello referansı kaldırılırken hata:", error);
                        showAlert('Düello referansı kaldırılırken hata oluştu.');
                    });
                } else {
                    if (currentScreen && currentScreen.id === 'single-player-screen') {
                        if (window.NOVA_SP_REVIEW_MODE && typeof window.novaExitSpReviewMode === 'function') {
                            window.novaExitSpReviewMode();
                        }
                    }
                    if (currentScreen && currentScreen.id === 'single-player-screen' && typeof window.novaCloseSinglePlayerSelectScreen === 'function') {
                        window.novaCloseSinglePlayerSelectScreen();
                    } else if (currentScreen && currentScreen.id === 'single-player-game-screen' && typeof window.novaCloseSinglePlayerGameScreen === 'function') {
                        window.novaCloseSinglePlayerGameScreen();
                    } else {
                        currentScreen.style.display = 'none';
                        if (typeof window.novaReturnToMainScreen === 'function') {
                            window.novaReturnToMainScreen();
                        } else {
                            try { if (window.novaPerfBeforeMainScreen) window.novaPerfBeforeMainScreen(); } catch (_) {}
                            mainScreen.style.removeProperty('display');
                            novaRequestHudFabRelayout();
                        }
                    }
                    resetGameScreens();
                    try{ if (window.novaSyncPerfRuntime) window.novaSyncPerfRuntime(); }catch(_){}
                    if (typeof window.novaReturnToMainScreen !== 'function') novaRequestHudFabRelayout();
                }
            });
        });

        singlePlayerButton.addEventListener('click', async () => {
            if (typeof window.novaExitSpReviewMode === 'function') window.novaExitSpReviewMode();
            if (window.NovaCurriculumSort && typeof window.NovaCurriculumSort.clearChampionUiCaches === 'function') {
                window.NovaCurriculumSort.clearChampionUiCaches();
            }
            try {
                await fetchChampionData();
            } catch (_) {}
            try {
                await enforceSinglePlayerClassLock({ reason: 'sp-open' });
            } catch (_) {}
            if (typeof window.novaOpenSinglePlayerSelectScreen === 'function') {
                window.novaOpenSinglePlayerSelectScreen();
            } else {
                try { if (window.novaPerfBeforeGameScreen) window.novaPerfBeforeGameScreen('single-player-screen'); } catch (_) {}
                mainScreen.style.setProperty('display', 'none', 'important');
                if (studentSelectionScreen) studentSelectionScreen.style.display = 'none';
                singlePlayerScreen.style.display = 'flex';
            }
            try { if (window.novaEnhanceGameSelects) window.novaEnhanceGameSelects(singlePlayerScreen); } catch (_) {}
            try {
                if (classSelect && typeof window.novaRefreshGameSelectMenu === 'function') {
                    window.novaRefreshGameSelectMenu(classSelect);
                }
            } catch (_) {}
        });

        startGameButton.addEventListener('click', async () => {
            const selectedClass = classSelect.value;
            const selectedSubject = subjectSelect.value;
            const selectedTopic = topicSelect.value;

            if (!selectedClass || !selectedSubject || !selectedTopic) {
                showAlert('Lütfen tüm alanları doldurunuz.');
                return;
            }

            if (window.NOVA_SP_REVIEW_MODE) {
                const prevLabel = startGameButton.textContent;
                startGameButton.disabled = true;
                startGameButton.textContent = 'Sorular yükleniyor…';
                try {
                    await fetchAllTopicQuestionsForReview(selectedClass, selectedSubject, selectedTopic);
                } finally {
                    startGameButton.textContent = prevLabel;
                    try { checkSinglePlayerSelections(); } catch (_) {}
                }
                return;
            }

            fetchQuestions(selectedClass, selectedSubject, selectedTopic);
        });


        async function handlePasswordUpdate(classId, studentId) {
            const newPassword = await showPrompt('Yeni şifreyi giriniz:');
            if (newPassword !== null) {
                if (newPassword.trim() !== "") {
                    database.ref(`classes/${classId}/students/${studentId}/password`).set(newPassword.trim()).then(() => {
                        showAlert('Şifre oluşturuldu/güncellendi.');
                    }).catch(error => {
                        console.error("Şifre güncellenirken hata:", error);
                        showAlert('Şifre güncellerken hata oluştu.');
                    });
                } else {
                    showAlert('Şifre boş olamaz.');
                }
            }
        }



       // GÜNCELLENMİŞ HAL
async function fetchChampionData() {
    const CACHE_KEY = 'cachedChampionData';
    const CACHE_TIMESTAMP_KEY = 'cachedChampionDataTimestamp';
    const CACHE_DURATION = (typeof window.NOVA_CHAMPION_HEADINGS_TTL_MS === 'number')
        ? window.NOVA_CHAMPION_HEADINGS_TTL_MS
        : (24 * 60 * 60 * 1000);
    try {
        if (typeof window.__novaEnsureSelectedStudentClassName === 'function') {
            await window.__novaEnsureSelectedStudentClassName();
        }
    } catch (_) {}

    const cachedChampionData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const now = Date.now();

    if (cachedChampionData && cachedTimestamp) {
        const age = now - parseInt(cachedTimestamp, 10);
        if (age < CACHE_DURATION) {
            // Cache süresi dolmamış, veriyi kullan
            const parsedData = JSON.parse(cachedChampionData);
            try { window.__novaChampionHeadingsList = parsedData; } catch (_) {}
            populateChampionSelect(parsedData);
            return;
        } else {
            // Cache süresi dolmuş, temizle
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        }
    }

    // Cache yok: tam headings ağacını indirmeden shallow + name yaprakları
    try {
        const fetchHeadings = window.novaFetchChampionHeadingList;
        if (typeof fetchHeadings !== 'function') {
            console.warn('novaFetchChampionHeadingList tanımlı değil.');
            return;
        }
        const result = await fetchHeadings();
        if (!result || !result.length) {
            console.warn("Şampiyon sınıf listesi boş.");
            return;
        }
        try { window.__novaChampionHeadingsList = result; } catch (_) {}
        localStorage.setItem(CACHE_KEY, JSON.stringify(result));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
        populateChampionSelect(result);
    } catch (error) {
        console.error("Sınıf bilgileri hata:", error);
    }
}
try { window.fetchChampionData = fetchChampionData; } catch (_) {}

function populateChampionSelect(data) {
    const classSelectEl = document.getElementById('class-select');
    if (!classSelectEl || !data) return;

    if (window.NOVA_SP_REVIEW_MODE) {
        classSelectEl.innerHTML = '<option value="">Seçiniz</option>';
        classSelectEl.disabled = false;
        classSelectEl.style.pointerEvents = '';
        classSelectEl.style.cursor = '';
        classSelectEl.style.opacity = '';
        delete classSelectEl.dataset.novaSpClassLocked;
        delete classSelectEl.dataset.novaLockedHeadingId;
        delete classSelectEl.dataset.novaLockedLabel;
        const reviewWrap = classSelectEl.closest('.nova-game-select');
        if (reviewWrap) {
            reviewWrap.classList.remove('nova-game-select--locked');
        }
        novaSortClassGradeRowsLocal(novaDedupeReviewHeadingRows(data)).forEach(function (item) {
            if (!item || !item.id) return;
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name || item.id;
            classSelectEl.appendChild(option);
        });
        if (typeof window.novaRefreshGameSelectMenu === 'function') {
            window.novaRefreshGameSelectMenu(classSelectEl);
        }
        if (typeof window.novaUnlockSpReviewClassSelect === 'function') {
            window.novaUnlockSpReviewClassSelect();
        }
        try {
            if (typeof window.novaCheckSinglePlayerSelections === 'function') {
                window.novaCheckSinglePlayerSelections();
            }
        } catch (_) {}
        return;
    }

    const student = window.selectedStudent || null;
    if (student && student.classId && !window.NOVA_SP_REVIEW_MODE) {
        if (typeof window.__novaEnforceSinglePlayerClassLock === 'function') {
            window.__novaEnforceSinglePlayerClassLock({ reason: 'champion-populate', preserveLessons: true }).catch(function () {});
        }
        return;
    }

    const getScoped = window.__novaGetScopedClassLabel;
    const normTag = window.__novaNormalizeClassTag;
    const gradeNum = window.__novaExtractGradeNumber;

    if (typeof getScoped === 'function' && typeof normTag === 'function' && typeof gradeNum === 'function') {
        const scopedLabel = getScoped();
        const scopedTag = normTag(scopedLabel);
        const scopedGrade = gradeNum(scopedLabel);
        const scopedRows = [];
        const filterFn = window.__novaFilterHeadingsForStudent;

        if (typeof filterFn === 'function') {
            scopedRows.push.apply(scopedRows, filterFn(data));
        } else {
            data.forEach(function (item) {
                if (!item) return;
                if (scopedTag || scopedGrade) {
                    const itemTag = normTag(item.name);
                    const sameGrade = scopedGrade && gradeNum(item.name) === scopedGrade;
                    if (scopedTag && itemTag !== scopedTag && !sameGrade) return;
                }
                scopedRows.push(item);
            });
        }

        classSelectEl.innerHTML = '<option value="">Seçiniz</option>';
        classSelectEl.disabled = false;
        classSelectEl.style.pointerEvents = '';
        classSelectEl.style.cursor = '';
        classSelectEl.style.opacity = '';
        delete classSelectEl.dataset.novaSpClassLocked;
        scopedRows.forEach(function (item) {
            var opt = document.createElement('option');
            opt.value = item.id;
            opt.textContent = item.name || item.id;
            classSelectEl.appendChild(opt);
        });
        if (typeof window.novaRefreshGameSelectMenu === 'function') {
            window.novaRefreshGameSelectMenu(classSelectEl);
        }
        return;
    }

    classSelectEl.innerHTML = '<option value="">Seçiniz</option>';
    classSelectEl.disabled = false;
    classSelectEl.style.pointerEvents = '';
    classSelectEl.style.cursor = '';
    classSelectEl.style.opacity = '';
    delete classSelectEl.dataset.novaSpClassLocked;
    novaSortClassGradeRowsLocal(data).forEach(function (item) {
        if (!item || !item.id) return;
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name || item.id;
        classSelectEl.appendChild(option);
    });
}



async function fetchLessons(classId, subjectSelectElement) {
    if (!subjectSelectElement) return false;
    if (!subjectSelectElement.__novaLessonsGen) subjectSelectElement.__novaLessonsGen = 0;
    const myGen = ++subjectSelectElement.__novaLessonsGen;

    try {
        if (window.NovaCurriculumSort) {
            let label = '';
            const st = window.selectedStudent;
            if (st) label = String(st.className || st.class || '').trim();
            if (!label && classSelect && classSelect.options && classSelect.options.length) {
                const op = classSelect.options[classSelect.selectedIndex] || classSelect.options[0];
                label = String((op && op.textContent) || '').trim();
            }
            if (!label && classSelect) label = String(classSelect.value || '').trim();
            const list = window.__novaChampionHeadingsList || [];
            const canonical = window.NovaCurriculumSort.resolveStudentHeadingId(label, list);
            if (canonical) classId = canonical;
            else if (/^SINIF[1-4]$/i.test(String(classId))) classId = String(classId).toUpperCase();
        }
    } catch (_) {}

    const CACHE_KEY = `cachedLessons_${classId}`;
    const CACHE_TIMESTAMP_KEY = `cachedLessonsTimestamp_${classId}`;
    const CACHE_DURATION = NOVA_CHAMPION_HEADINGS_TTL_MS;

    if (subjectSelectElement === duelSubjectSelect) {
        novaClearDuelSubjectLazyExpand();
    }

    // Select elementini temizle
    subjectSelectElement.innerHTML = '<option value="">Seçiniz</option>';
    if (!classId) return false;

    function isStale() {
        return myGen !== subjectSelectElement.__novaLessonsGen;
    }

    try {
        // Önce seçimleri Firebase'den kontrol et (davet edilen için)
        if (!isInviter && currentDuelRef) {
            const selectionsSnapshot = await currentDuelRef.child('selections').once('value');
            if (selectionsSnapshot.exists()) {
                const selections = selectionsSnapshot.val();
                if (selections.subject) {
                    // Cache'i kontrol et
                    const cachedLessons = localStorage.getItem(CACHE_KEY);
                    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
                    const now = Date.now();

                    if (cachedLessons && cachedTimestamp && (now - parseInt(cachedTimestamp, 10)) < CACHE_DURATION) {
                        const parsedLessons = JSON.parse(cachedLessons);
                        if (isStale()) return false;
                        populateLessonsSelect(parsedLessons, subjectSelectElement);
                        subjectSelectElement.value = selections.subject;
                        return true;
                    }
                }
            }
        }

        let lessonsData = await novaFetchLessonsList(classId);
        if (!lessonsData || !lessonsData.length) {
            try {
                const directFn = window.novaFetchLessonsListFromRtdb;
                if (typeof directFn === 'function') {
                    const direct = await directFn(classId);
                    if (direct && direct.length) {
                        lessonsData = window.NovaCurriculumSort
                            ? window.NovaCurriculumSort.sortLessons(direct)
                            : direct;
                    }
                }
            } catch (rtdbLessonsErr) {
                console.warn('Doğrudan RTDB ders yedeği:', rtdbLessonsErr);
            }
        }
        if ((!lessonsData || !lessonsData.length) && subjectSelectElement && (
            subjectSelectElement.id === 'subject-select' || subjectSelectElement.id === 'duel-subject-select'
        )) {
            try {
                const resolveBest = window.__novaResolveBestHeadingFromList || window.__novaResolveBestSinglePlayerHeadingId;
                let list = window.__novaChampionHeadingsList;
                if ((!list || !list.length) && typeof window.novaFetchChampionHeadingList === 'function') {
                    list = await window.novaFetchChampionHeadingList();
                    if (list && list.length) window.__novaChampionHeadingsList = list;
                }
                const bestId = (typeof resolveBest === 'function')
                    ? await resolveBest(list || [])
                    : '';
                if (bestId && bestId !== classId && classSelect) {
                    classSelect.dataset.novaSuppressChange = '1';
                    classSelect.value = bestId;
                    delete classSelect.dataset.novaSuppressChange;
                    classId = bestId;
                    try { localStorage.removeItem(CACHE_KEY); } catch (_) {}
                    lessonsData = await novaFetchLessonsList(bestId);
                }
            } catch (e) {
                console.warn('Ders listesi yedek heading denemesi:', e);
            }
        }
        if (lessonsData && lessonsData.length) {
            localStorage.setItem(CACHE_KEY, JSON.stringify(lessonsData));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

            if (isStale()) return false;
            populateLessonsSelect(lessonsData, subjectSelectElement);

            // Davet edilen için seçili dersi ayarla
            if (!isInviter && currentDuelRef) {
                const selections = (await currentDuelRef.child('selections').once('value')).val();
                if (selections && selections.subject) {
                    subjectSelectElement.value = selections.subject;
                }
            }

            return true;
        }
        return false;
    } catch (error) {
        console.error("Dersler yüklenirken hata:", error);
        return false;
    }
}

async function fetchTopics(classId, lessonId, topicSelectElement) {
  try {
    if (window.NovaCurriculumSort) {
      let label = '';
      const st = window.selectedStudent;
      if (st) label = String(st.className || st.class || '').trim();
      if (!label && duelClassSelect && duelClassSelect.options && duelClassSelect.options.length) {
        const op = duelClassSelect.options[duelClassSelect.selectedIndex] || duelClassSelect.options[0];
        label = String((op && op.textContent) || '').trim();
      }
      if (!label && classSelect && classSelect.options && classSelect.options.length) {
        const op = classSelect.options[classSelect.selectedIndex] || classSelect.options[0];
        label = String((op && op.textContent) || '').trim();
      }
      const list = window.__novaChampionHeadingsList || [];
      const canonical = window.NovaCurriculumSort.resolveStudentHeadingId(label, list);
      if (canonical) classId = canonical;
      else if (/^SINIF[1-4]$/i.test(String(classId))) classId = String(classId).toUpperCase();
    }
  } catch (_) {}

  const CACHE_KEY = `cachedTopics_${classId}_${lessonId}`;
  const CACHE_TIMESTAMP_KEY = `cachedTopicsTimestamp_${classId}_${lessonId}`;
  const CACHE_DURATION = NOVA_CHAMPION_HEADINGS_TTL_MS;

  topicSelectElement.innerHTML = '<option value="">Seçiniz</option>';
  if (!classId || !lessonId) return false;

  try {
    // Davetli için cache kontrolü
    if (!isInviter && currentDuelRef) {
      const selectionsSnapshot = await currentDuelRef.child('selections').once('value');
      if (selectionsSnapshot.exists()) {
        const selections = selectionsSnapshot.val();
        if (selections.topic) {
          const cachedTopics = localStorage.getItem(CACHE_KEY);
          const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
          const now = Date.now();
          if (cachedTopics && cachedTimestamp && (now - parseInt(cachedTimestamp, 10)) < CACHE_DURATION) {
            const parsedTopics = JSON.parse(cachedTopics);
            populateTopicsSelect(parsedTopics, topicSelectElement);
            topicSelectElement.value = selections.topic;
            return true;
          }
        }
      }
    }

    let topicsData = await novaFetchTopicsList(classId, lessonId);
    if (!topicsData || !topicsData.length) return false;

    if (window.NovaCurriculumSort) {
      topicsData = window.NovaCurriculumSort.sortTopics(topicsData);
    }

    // Cache ve select doldurma
    localStorage.setItem(CACHE_KEY, JSON.stringify(topicsData));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    populateTopicsSelect(topicsData, topicSelectElement);

    // Davetli için seçimi geri yaz
    if (!isInviter && currentDuelRef) {
      const selections = (await currentDuelRef.child('selections').once('value')).val();
      if (selections && selections.topic) {
        topicSelectElement.value = selections.topic;
      }
    }

    return true;
  } catch (error) {
    console.error("Konular yüklenirken hata:", error);
    return false;
  }
}


// populateSelect fonksiyonları aynı kalabilir
function populateLessonsSelect(lessonsData, subjectSelectElement) {
    if (!subjectSelectElement) return;
    try { subjectSelectElement.dataset.novaCurriculumOrder = '1'; } catch (_) {}
    const wrap = subjectSelectElement.closest('.nova-game-select');
    if (wrap) wrap.__novaMenuSyncing = true;
    try {
        subjectSelectElement.innerHTML = '<option value="">Seçiniz</option>';
        const seenIds = Object.create(null);
        const seenNames = Object.create(null);
        (lessonsData || []).forEach(function (lesson) {
            if (!lesson || !lesson.id) return;
            const id = String(lesson.id);
            const nameKey = String(lesson.name || '').trim().toLowerCase();
            if (seenIds[id]) return;
            if (nameKey && seenNames[nameKey]) return;
            seenIds[id] = true;
            if (nameKey) seenNames[nameKey] = true;
            const option = document.createElement('option');
            option.value = id;
            option.textContent = lesson.name || id;
            subjectSelectElement.appendChild(option);
        });
    } finally {
        if (wrap) wrap.__novaMenuSyncing = false;
    }
    if (typeof window.novaRefreshGameSelectMenu === 'function') {
        window.novaRefreshGameSelectMenu(subjectSelectElement);
    }
}

function populateTopicsSelect(topicsData, topicSelectElement) {
    if (!topicSelectElement) return;
    try { topicSelectElement.dataset.novaCurriculumOrder = '1'; } catch (_) {}
    const wrap = topicSelectElement.closest('.nova-game-select');
    if (wrap) wrap.__novaMenuSyncing = true;
    try {
    topicsData.forEach(topic => {
        const option = document.createElement('option');
        const rawName = String((topic && topic.name) || '').trim();
        const parts = (window.NovaCurriculumSort && typeof window.NovaCurriculumSort.splitLabel === 'function')
            ? window.NovaCurriculumSort.splitLabel(rawName)
            : { title: rawName, detail: '' };
        option.value = topic.id;
        option.textContent = parts.detail ? parts.title + ' ' + parts.detail : parts.title;
        if (parts.title) option.dataset.novaTitle = parts.title;
        if (parts.detail) option.dataset.novaDetail = parts.detail;
        topicSelectElement.appendChild(option);
    });
    } finally {
        if (wrap) wrap.__novaMenuSyncing = false;
    }
    if (topicSelectElement && typeof window.novaRefreshGameSelectMenu === 'function') {
        window.novaRefreshGameSelectMenu(topicSelectElement);
    }
}



        const singlePlayerSelects = singlePlayerScreen.querySelectorAll('select');
        singlePlayerSelects.forEach(select => {
            select.addEventListener('change', checkSinglePlayerSelections);
        });

        function checkSinglePlayerSelections() {
            let allSelected = true;
            singlePlayerSelects.forEach(select => {
                if (select.value === "") {
                    allSelected = false;
                }
            });

            if (allSelected) {
                startGameButton.classList.add('active');
                startGameButton.disabled = false;
            } else {
                startGameButton.classList.remove('active');
                startGameButton.disabled = true;
            }
        }
        try { window.novaCheckSinglePlayerSelections = checkSinglePlayerSelections; } catch (_) {}

selectionClassSelect.addEventListener('change', () => {
    if (selectionClassSelect.value === "") {
        selectionNameInput.disabled = true;
        selectionNameInput.value = "";
    } else {
        selectionNameInput.disabled = false;
    }
    checkLoginButtonState();
});



function checkLoginButtonState() {
    if (selectionClassSelect.value !== "" && selectionNameInput.value.trim() !== "") {
        loginButton.classList.add('active');
        loginButton.disabled = false;
        studentPasswordInput.disabled = false;
    } else {
        loginButton.classList.remove('active');
        loginButton.disabled = true;
        studentPasswordInput.disabled = true;
        studentPasswordInput.value = '';
    }
}

        classSelect.addEventListener('change', () => {
            if (classSelect.dataset.novaSuppressChange === '1') return;
            if (classSelect.disabled) return;
            const selectedClass = classSelect.value;
            if (topicSelect) topicSelect.innerHTML = '<option value="">Seçiniz</option>';
            fetchLessons(selectedClass, subjectSelect);
        });

        subjectSelect.addEventListener('change', () => {
            const selectedClass = classSelect.value;
            const selectedLesson = subjectSelect.value;
            fetchTopics(selectedClass, selectedLesson, topicSelect).then(function () {
                if (topicSelect && typeof window.novaRefreshGameSelectMenu === 'function') {
                    window.novaRefreshGameSelectMenu(topicSelect);
                }
            });
        });

        function resetGameScreens() {
            // Tek Kişilik Oyun Ekranı — sınıf öğrenciye kilitli kalır, yalnızca ders/konu sıfırlanır
            if (subjectSelect) {
                subjectSelect.value = '';
                try {
                    if (typeof window.novaRefreshGameSelectMenu === 'function') {
                        window.novaRefreshGameSelectMenu(subjectSelect);
                    }
                } catch (_) {}
            }
            if (topicSelect) {
                topicSelect.innerHTML = '<option value="">Seçiniz</option>';
                try {
                    if (typeof window.novaRefreshGameSelectMenu === 'function') {
                        window.novaRefreshGameSelectMenu(topicSelect);
                    }
                } catch (_) {}
            }
            if (!window.NOVA_SP_REVIEW_MODE) {
                enforceSinglePlayerClassLock({ preserveLessons: true });
            }
            startGameButton.classList.remove('active');
            startGameButton.disabled = true;

            scoreContainer.style.display = 'none';
            scoreDisplay.textContent = '';
            scoreMessage.textContent = '';
            scoreMessage.className = 'score-message';
            scoreImage.style.display = 'none';

            // Düello Oyun Ekranı
            duelQuestionNumber.textContent = 'Soru 1/10';
            duelProgressBarInner.style.width = '0%';
            duelTimerElement.textContent = '45';
            duelTimerElement.style.color = '#ff0000';

            // Yeni eklenen sıfırlamalar
            gameQuestions = [];
            currentQuestionIndex = 0;
            score = 0;
            clearInterval(timer);

            // Tek Kişilik Oyun Müziğini Durdur
            singlePlayerQuestionMusic.pause();
            singlePlayerQuestionMusic.currentTime = 0;

            // Düello Oyun Müziğini Durdur
            duelMusic.pause();
            duelMusic.currentTime = 0;
        }

// "Çıkış Yap" Butonunu Seçme
const logoutButton = document.getElementById('logout-button');

// "Çıkış Yap" Butonuna Event Listener Ekleme
logoutButton.addEventListener('click', async () => {
   try {
       // Önce seçili öğrencinin inDuel durumunu false yap
       if (selectedStudent && selectedStudent.classId && selectedStudent.studentId) {
           await database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}/inDuel`).set(false);
           await setLoggedInPlayerInDuel(false);
       }

       // Düello referansını temizle
       if (currentDuelRef) {
           await currentDuelRef.remove();
           currentDuelRef = null;
       }

       // Kullanıcıya özel tüm cache'leri temizle
       if (selectedStudent?.studentId) {
           Object.values(CACHE_KEYS).forEach(key => {
               const userKey = getUserSpecificCacheKey(key);
               localStorage.removeItem(userKey);
           });
       }

       // localStorage'ı temizle
       localStorage.removeItem('selectedStudent');
       try {
         if (typeof window.novaSpriteBootReset === 'function') window.novaSpriteBootReset();
       } catch (_) {}

       // Loggedin player'ı kaldır
       if (loggedinPlayerRef) {
           await loggedinPlayerRef.remove();
           console.log("Kullanıcı Firebase'den başarıyla kaldırıldı.");
       }

       // Sayfayı yenile
       window.location.reload();

   } catch (error) {
       console.error("Çıkış yaparken hata oluştu:", error);
       showAlert('Çıkış yaparken bir hata oluştu. Lütfen tekrar deneyin.');
   }
});


        function formatHwQuestionFromRaw(questionData) {
            if (!questionData || typeof questionData !== 'object') return null;
            const qField = questionData.question;
            const infoItems =
              qField && typeof qField === 'object' && Array.isArray(qField.infoItems)
                ? qField.infoItems
                : null;
            const infoBlocks =
              qField && typeof qField === 'object' && Array.isArray(qField.infoBlocks)
                ? qField.infoBlocks
                : null;
            return {
                info: (qField && typeof qField === 'object' && qField.info) ? qField.info : '',
                infoItems: infoItems,
                infoBlocks: infoBlocks,
                actualQuestion: (qField && typeof qField === 'object' && qField.text) ? qField.text : qField,
                question: (qField && typeof qField === 'object' && qField.text) ? qField.text : qField,
                correct: questionData.correct,
                wrong1: questionData.wrong1,
                wrong2: questionData.wrong2,
                explanation: (questionData.explanation || questionData.aciklama || questionData['açıklama'] || '')
            };
        }

        function novaFillOptionButton(button, text) {
            const mq = window.NovaQuestionMarkup;
            const raw = String(text == null ? '' : text);
            if (mq) {
                mq.fillMarkupElement(button, raw);
            } else {
                button.textContent = raw;
            }
            try { button.setAttribute('data-opt-text', raw); } catch (_) {}
        }

        function novaNormalizeHomeworkQuestionIds(raw) {
            if (raw == null) return null;
            if (Array.isArray(raw)) return raw.map(String).filter(function (x) { return x; });
            if (typeof raw === 'object') {
                return Object.keys(raw).sort(function (a, b) { return Number(a) - Number(b); })
                    .map(function (k) { return raw[k]; })
                    .filter(function (x) { return x != null && x !== ''; })
                    .map(String);
            }
            return null;
        }

        async function listTopicQuestionIdsExact(classId, subjectId, topicId) {
            const topicBase = 'championData/headings/' + classId + '/lessons/' + subjectId + '/topics/' + topicId;
            const idxPath = topicBase + '/questionIds';
            const idxVal = await readValCached(idxPath, NOVA_TOPIC_QUESTIONS_TTL_MS);
            if (idxVal && typeof idxVal === 'object') {
                const ids = Object.keys(idxVal).filter(function (k) { return idxVal[k]; });
                if (ids.length) return ids.map(String);
            }
            if (typeof window.novaRtdbShallowKeys === 'function') {
                try {
                    const keys = await window.novaRtdbShallowKeys(topicBase + '/questions');
                    if (Array.isArray(keys) && keys.length) return keys.map(String);
                } catch (_) {}
            }
            return [];
        }

        /** Havuzdan rastgele N soru id — tüm listeyi karıştırmadan (O(N) yerine O(take)). */
        function pickRandomQuestionIds(ids, takeCount) {
            const pool = ids.slice();
            const needed = Math.min(Math.max(1, takeCount), pool.length);
            for (let i = 0; i < needed; i++) {
                const j = i + Math.floor(Math.random() * (pool.length - i));
                const tmp = pool[i];
                pool[i] = pool[j];
                pool[j] = tmp;
            }
            return pool.slice(0, needed);
        }

        async function pickAndLoadTopicQuestionsExact(classId, subjectId, topicId, takeCount) {
            const needed = Math.max(1, Number(takeCount) || 10);
            const ids = await listTopicQuestionIdsExact(classId, subjectId, topicId);
            if (!ids.length || ids.length < needed) return null;
            const selected = pickRandomQuestionIds(ids, needed);
            const qBase = 'championData/headings/' + classId + '/lessons/' + subjectId + '/topics/' + topicId + '/questions/';
            const raws = await Promise.all(selected.map(function (qid) {
                return readValCached(qBase + qid, NOVA_TOPIC_QUESTIONS_TTL_MS);
            }));
            const out = [];
            for (let i = 0; i < raws.length; i++) {
                const fq = formatHwQuestionFromRaw(raws[i]);
                if (!fq) return null;
                out.push(fq);
            }
            return out;
        }

        /** Ödev: sadece atanmış soru id'leri (yaprak okuma), tüm konu havuzu değil */
        async function fetchHomeworkQuestionsByIds(classId, subjectId, topicId, questionIds) {
            if (!classId || !subjectId || !topicId) {
                console.warn('fetchHomeworkQuestionsByIds: eksik yol', classId, subjectId, topicId);
                await showAlert('Ödev kaydında sınıf/ders/konu eksik veya hatalı. Yöneticiye bildirin.');
                return;
            }
            const base = 'championData/headings/' + classId + '/lessons/' + subjectId + '/topics/' + topicId + '/questions/';
            const BATCH = 15;
            const ordered = [];
            const leafTtlMs = NOVA_TOPIC_QUESTIONS_TTL_MS;
            try {
                for (let i = 0; i < questionIds.length; i += BATCH) {
                    const chunk = questionIds.slice(i, i + BATCH);
                    const raws = await Promise.all(chunk.map(function (qid) {
                        return readValCached(base + qid, leafTtlMs);
                    }));
                    for (let j = 0; j < raws.length; j++) {
                        const raw = raws[j];
                        const qid = chunk[j];
                        if (!raw || typeof raw !== 'object') {
                            await showAlert('Ödev sorularından biri bulunamadı: ' + qid);
                            return;
                        }
                        const fq = formatHwQuestionFromRaw(raw);
                        if (!fq) {
                            await showAlert('Ödev sorusu okunamadı: ' + qid);
                            return;
                        }
                        ordered.push(fq);
                    }
                }
            } catch (error) {
                console.error('Ödev soruları yüklenemedi:', error);
                await showAlert('Sorular yüklenirken hata oluştu.');
                return;
            }
            const lim = Math.max(1, Number(window.NOVA_Q_LIMIT) || ordered.length);
            if (ordered.length < lim) {
                await showAlert('Ödev soruları eksik (yüklenen: ' + ordered.length + ').');
                return;
            }
            gameQuestions = ordered.slice(0, lim);
            window.gameQuestions = gameQuestions;
            currentQuestionIndex = 0;
            score = 0;
            if (typeof window.novaHideSinglePlayerSelectForGame === 'function') {
                window.novaHideSinglePlayerSelectForGame();
            } else {
                singlePlayerScreen.style.display = 'none';
            }
            try{ if (window.novaPerfBeforeGameScreen) window.novaPerfBeforeGameScreen('single-player-game-screen'); }catch(_){}
            if (typeof window.novaOpenSinglePlayerGameScreen === 'function') {
                window.novaOpenSinglePlayerGameScreen();
            } else {
                singlePlayerGameScreen.style.display = 'flex';
            }
            try{ if (window.novaSyncPerfRuntime) window.novaSyncPerfRuntime(); }catch(_){}
            scoreContainer.style.display = 'none';
            try{
              var spReset = document.getElementById('single-player-game-screen');
              if(spReset) spReset.classList.remove('nova-sp-result-open', 'nova-sp-wrong-review-active');
              if (typeof window.novaClearWrongReviewState === 'function') window.novaClearWrongReviewState();
              var hudReset = document.querySelector('#single-player-game-screen .nova-sp-game-hud');
              if(hudReset) hudReset.style.display = '';
            }catch(_){}
            displayCurrentQuestion();
            novaSpRefreshHeroRevealAtGameStart();
            singlePlayerQuestionMusic.currentTime = 0;
            singlePlayerQuestionMusic.play().catch(function (err) {
                console.error('Tek Kişilik Oyun Müziği Çalınamadı:', err);
            });
        }

        function novaSpRefreshHeroRevealAtGameStart() {
            try {
                if (typeof window.novaResetPremiumResultSession === 'function') {
                    window.novaResetPremiumResultSession();
                }
                if (!window.NOVA_HERO_LEVEL) return;
                if (typeof window.NOVA_HERO_LEVEL.resetSpRevealForGame === 'function') {
                    window.NOVA_HERO_LEVEL.resetSpRevealForGame();
                }
                if (typeof window.NOVA_HERO_LEVEL.refreshSpHeroFeatureBar === 'function') {
                    window.NOVA_HERO_LEVEL.refreshSpHeroFeatureBar();
                }
                if (typeof window.novaSpPreloadEquippedHeroTrueClips === 'function') {
                    window.novaSpPreloadEquippedHeroTrueClips(true);
                }
                if (typeof window.novaBuzEjderPreloadTrueClipsIfEquipped === 'function') {
                    window.novaBuzEjderPreloadTrueClipsIfEquipped();
                }
                if (typeof window.novaAlevEjderPreloadTrueClipsIfEquipped === 'function') {
                    window.novaAlevEjderPreloadTrueClipsIfEquipped();
                }
                if (typeof window.novaGeceEjderPreloadTrueClipsIfEquipped === 'function') {
                    window.novaGeceEjderPreloadTrueClipsIfEquipped();
                }
                if (typeof window.novaBuzEjderPreloadSonucTransition === 'function') {
                    window.novaBuzEjderPreloadSonucTransition();
                }
            } catch (_) {}
        }

        try {
            window.novaNormalizeHomeworkQuestionIds = novaNormalizeHomeworkQuestionIds;
            window.fetchHomeworkQuestionsByIds = fetchHomeworkQuestionsByIds;
            window.fetchAllTopicQuestionsForReview = fetchAllTopicQuestionsForReview;
            window.__novaFormatHwQuestionFromRaw = formatHwQuestionFromRaw;
        } catch (_) {}

        function openSinglePlayerGameFromQuestions(opts) {
            opts = opts || {};
            if (typeof window.novaHideSinglePlayerSelectForGame === 'function') {
                window.novaHideSinglePlayerSelectForGame();
            } else if (singlePlayerScreen) {
                singlePlayerScreen.style.display = 'none';
            }
            try { if (window.novaPerfBeforeGameScreen) window.novaPerfBeforeGameScreen('single-player-game-screen'); } catch (_) {}
            if (typeof window.novaOpenSinglePlayerGameScreen === 'function') {
                window.novaOpenSinglePlayerGameScreen();
            } else if (singlePlayerGameScreen) {
                singlePlayerGameScreen.style.display = 'flex';
            }
            try { if (window.novaSyncPerfRuntime) window.novaSyncPerfRuntime(); } catch (_) {}
            if (scoreContainer) scoreContainer.style.display = 'none';
            try {
                var spReset = document.getElementById('single-player-game-screen');
                if (spReset) spReset.classList.remove('nova-sp-result-open');
                var hudReset = document.querySelector('#single-player-game-screen .nova-sp-game-hud');
                if (hudReset) hudReset.style.display = '';
            } catch (_) {}
            displayCurrentQuestion();
            if (!opts.skipHeroRefresh) novaSpRefreshHeroRevealAtGameStart();
            if (!opts.skipMusic) {
                singlePlayerQuestionMusic.currentTime = 0;
                singlePlayerQuestionMusic.play().catch(function (err) {
                    console.error('Tek Kişilik Oyun Müziği Çalınamadı:', err);
                });
            }
        }

        function resolveReviewHeadingId(classId) {
            try {
                if (window.NovaCurriculumSort) {
                    const list = window.__novaChampionHeadingsList || [];
                    const classSelectEl = document.getElementById('class-select');
                    let label = '';
                    if (classSelectEl && classSelectEl.options && classSelectEl.selectedIndex >= 0) {
                        const op = classSelectEl.options[classSelectEl.selectedIndex];
                        label = String((op && op.textContent) || '').trim();
                    }
                    const canonical = window.NovaCurriculumSort.resolveStudentHeadingId(label, list);
                    if (canonical) return canonical;
                }
            } catch (_) {}
            if (/^SINIF[1-4]$/i.test(String(classId || ''))) return String(classId).toUpperCase();
            return classId;
        }

        async function fetchAllTopicQuestionsForReview(classId, subjectId, topicId) {
            if (!classId || !subjectId || !topicId) {
                showAlert('Lütfen sınıf, ders ve konu seçin.');
                return;
            }
            classId = resolveReviewHeadingId(classId);
            let ids = await listTopicQuestionIdsExact(classId, subjectId, topicId);
            if (!ids.length) {
                showAlert('Bu konuda soru bulunamadı.');
                return;
            }
            ids = ids.slice().sort(function (a, b) {
                return String(a).localeCompare(String(b), 'tr', { numeric: true, sensitivity: 'base' });
            });

            window.NOVA_Q_LIMIT_REVIEW_BACKUP = window.NOVA_Q_LIMIT;
            window.NOVA_SP_REVIEW_MODE = true;
            window.NOVA_Q_LIMIT = ids.length;
            window.NOVA_SP_REVIEW_CTX = {
                headingId: classId,
                lessonId: subjectId,
                topicId: topicId,
                questionIds: ids.slice()
            };

            const base = 'championData/headings/' + classId + '/lessons/' + subjectId + '/topics/' + topicId + '/questions/';
            const BATCH = 15;
            const ordered = [];
            const leafTtlMs = NOVA_TOPIC_QUESTIONS_TTL_MS;
            let missing = 0;

            try {
                for (let i = 0; i < ids.length; i += BATCH) {
                    const chunk = ids.slice(i, i + BATCH);
                    const raws = await Promise.all(chunk.map(function (qid) {
                        return readValCached(base + qid, leafTtlMs);
                    }));
                    for (let j = 0; j < raws.length; j++) {
                        const raw = raws[j];
                        const qid = chunk[j];
                        if (!raw || typeof raw !== 'object') {
                            missing += 1;
                            console.warn('[soru-kontrol] soru bulunamadı:', qid);
                            continue;
                        }
                        const fq = formatHwQuestionFromRaw(raw);
                        if (!fq) {
                            missing += 1;
                            console.warn('[soru-kontrol] soru okunamadı:', qid);
                            continue;
                        }
                        fq.__qid = qid;
                        ordered.push(fq);
                    }
                }
            } catch (error) {
                console.error('Soru kontrol yüklenemedi:', error);
                showAlert('Sorular yüklenirken hata oluştu.');
                if (typeof window.novaExitSpReviewMode === 'function') window.novaExitSpReviewMode();
                return;
            }

            if (!ordered.length) {
                showAlert('Yüklenen soru yok.');
                if (typeof window.novaExitSpReviewMode === 'function') window.novaExitSpReviewMode();
                return;
            }

            gameQuestions = ordered;
            window.gameQuestions = gameQuestions;
            window.NOVA_Q_LIMIT = ordered.length;
            currentQuestionIndex = 0;
            score = 0;

            if (missing > 0) {
                console.warn('[soru-kontrol] eksik soru:', missing);
            }

            openSinglePlayerGameFromQuestions({ skipMusic: false });
        }

        function fetchQuestions(classId, subjectId, topicId) {
    if (!classId || !subjectId || !topicId) {
        console.warn('fetchQuestions: eksik sınıf/ders/konu', classId, subjectId, topicId);
        showAlert('Soru yolu eksik. Lütfen sınıf, ders ve konuyu yeniden seçin.');
        return;
    }
    const qLimit = Number(window.NOVA_Q_LIMIT || 10);
    pickAndLoadTopicQuestionsExact(classId, subjectId, topicId, qLimit).then(picked => {
        if (Array.isArray(picked) && picked.length >= qLimit) {
            gameQuestions = picked.slice(0, qLimit);
            window.gameQuestions = gameQuestions;
            currentQuestionIndex = 0;
            score = 0;

            if (typeof window.novaHideSinglePlayerSelectForGame === 'function') {
                window.novaHideSinglePlayerSelectForGame();
            } else {
                singlePlayerScreen.style.display = 'none';
            }
            try{ if (window.novaPerfBeforeGameScreen) window.novaPerfBeforeGameScreen('single-player-game-screen'); }catch(_){}
            if (typeof window.novaOpenSinglePlayerGameScreen === 'function') {
                window.novaOpenSinglePlayerGameScreen();
            } else {
                singlePlayerGameScreen.style.display = 'flex';
            }
            try{ if (window.novaSyncPerfRuntime) window.novaSyncPerfRuntime(); }catch(_){}
            scoreContainer.style.display = 'none';
            try{
              var spReset = document.getElementById('single-player-game-screen');
              if(spReset) spReset.classList.remove('nova-sp-result-open');
              var hudReset = document.querySelector('#single-player-game-screen .nova-sp-game-hud');
              if(hudReset) hudReset.style.display = '';
            }catch(_){}
            displayCurrentQuestion();
            novaSpRefreshHeroRevealAtGameStart();

            singlePlayerQuestionMusic.currentTime = 0;
            singlePlayerQuestionMusic.play().catch(error => {
                console.error("Tek Kişilik Oyun Müziği Çalınamadı:", error);
            });
        } else {
            showAlert('Bu konuya ait yeterli soru yok veya soru id listesi bulunamadı.');
        }
    }).catch(error => {
        console.error("Sorular çekme hata:", error);
        showAlert('Sorular çekilirken hata oluştu.');
    });
}

        function shuffleArray(array) {
            let currentIndex = array.length, randomIndex;
            while (currentIndex != 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
            }
            return array;
        }

       function displayCurrentQuestion() {
    // Nova: clear explanation on new question
    (function(){var _e=document.getElementById('explanation-container'); if(_e){_e.style.display='none'; _e.innerHTML='';}})();

    if (currentQuestionIndex >= gameQuestions.length) {
        endGame();
        return;
    }

    const currentQuestion = gameQuestions[currentQuestionIndex];
    const totalQ = Array.isArray(gameQuestions) && gameQuestions.length
        ? gameQuestions.length
        : (window.NOVA_Q_LIMIT || 10);
    const wrongReviewActive = !!window.NOVA_WRONG_REVIEW_ACTIVE;
    const wrongReviewItems = wrongReviewActive ? (window.__novaWrongReviewItems || []) : [];
    const wrongReviewPos = wrongReviewActive ? (Number(window.__novaWrongReviewPos) || 0) : 0;

    if (wrongReviewActive && wrongReviewItems.length) {
        questionNumber.textContent = `Yanlış ${wrongReviewPos + 1}/${wrongReviewItems.length}`;
        progressBarInner.style.width = `${((wrongReviewPos + 1) / wrongReviewItems.length) * 100}%`;
    } else {
        questionNumber.textContent = `Soru ${currentQuestionIndex + 1}/${totalQ}`;
        const progressPercentage = (currentQuestionIndex / totalQ) * 100;
        progressBarInner.style.width = `${progressPercentage}%`;
    }

// Soru konteynerini temizle
const questionContainer = document.querySelector('.question-container');
questionContainer.innerHTML = '';
questionContainer.removeAttribute('data-q-has-image');
questionContainer.removeAttribute('data-q-has-video');
questionContainer.classList.remove('nova-q-enter', 'nova-q-has-image-badge', 'nova-q-has-video');
void questionContainer.offsetWidth;
questionContainer.classList.add('nova-q-enter');

if (currentQuestion.question.startsWith('http')) {
  questionContainer.setAttribute('data-q-has-image', '1');
  if (typeof window.novaUpdateQuestionTypeBadges === 'function') {
    window.novaUpdateQuestionTypeBadges(questionContainer);
  }
  // Eğer soru resim URL'siyse
  const questionImage = document.createElement('img');
  questionImage.src = currentQuestion.question;
  questionImage.className = 'question-image';
  questionImage.style.display = 'block';
  questionImage.alt = "Soru resmi";
  questionContainer.appendChild(questionImage);

  if (currentQuestion.actualQuestion) {
    const questionTextDiv = document.createElement('div');
    questionTextDiv.className = 'question-text q-markup';
    const mqImg = window.NovaQuestionMarkup;
    if (mqImg) mqImg.fillMarkupElement(questionTextDiv, currentQuestion.actualQuestion);
    else questionTextDiv.textContent = currentQuestion.actualQuestion;
    questionContainer.appendChild(questionTextDiv);
  }
} else {
  const mqMain = window.NovaQuestionMarkup;
  if (mqMain) {
    mqMain.mountQuestionText(questionContainer, {
      info: currentQuestion.info,
      infoItems: currentQuestion.infoItems,
      infoBlocks: currentQuestion.infoBlocks,
      question: currentQuestion.question,
    });
  } else {
  const textContainer = document.createElement('div');
textContainer.className = 'question-text-container';
const infoValue = String(currentQuestion.info || '').trim();
const hasInfoImage = /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp)$/i.test(infoValue);
const isGenericPrompt = /doğru seçeneği işaretleyin\.?/i.test(infoValue);
const hasInfoText = !!infoValue && !hasInfoImage && !isGenericPrompt;

if (hasInfoImage) {
  const infoImage = document.createElement('img');
  infoImage.src = infoValue;
  infoImage.alt = 'Öncül görseli';
  infoImage.className = 'question-info-image';
  textContainer.appendChild(infoImage);
} else if (hasInfoText) {
  const infoText = document.createElement('div');
  infoText.className = 'question-info-text';
  infoText.textContent = infoValue;
  textContainer.appendChild(infoText);
}

if (hasInfoImage || hasInfoText) {
  const divider = document.createElement('div');
  divider.className = 'question-divider';
  textContainer.appendChild(divider);
} else {
  textContainer.classList.add('no-preamble');
}

const questionText = document.createElement('div');
questionText.className = 'question-actual-text';
questionText.textContent = currentQuestion.question;
textContainer.appendChild(questionText);

questionContainer.appendChild(textContainer);
  }
}

    // Seçenekleri oluştur
    const options = [
        { text: currentQuestion.correct, correct: true },
        { text: currentQuestion.wrong1, correct: false },
        { text: currentQuestion.wrong2, correct: false }
    ];
    
    const shuffledOptions = shuffleArray(options);
    optionsContainer.innerHTML = '';
    
    shuffledOptions.forEach(option => {
        const button = document.createElement('button');
        button.classList.add('option-button');
        button.classList.add('nova-opt-enter');
        novaFillOptionButton(button, option.text);
        button.dataset.correct = option.correct;
        button.addEventListener('click', selectOption);
        optionsContainer.appendChild(button);
    });
    optionsContainer.querySelectorAll('.option-button.nova-opt-enter').forEach((btn, idx)=>{
      btn.style.animationDelay = (idx * 60) + 'ms';
    });

            // Görünürlük ayarları
            questionNumber.style.display = 'block';
            document.querySelector('.progress-container').style.display = 'block';
            const timerContainerEl = document.querySelector('.timer-container');
            if (timerContainerEl) {
                timerContainerEl.style.display = (window.NOVA_SP_REVIEW_MODE || wrongReviewActive) ? 'none' : 'block';
            }
            document.querySelector('.question-container').style.display = 'flex';
            optionsContainer.style.display = 'flex';

            var reviewEditBar = document.getElementById('nova-sp-review-edit-bar');
            if (window.NOVA_SP_REVIEW_MODE) {
                clearInterval(timer);
                if (!reviewEditBar) {
                    reviewEditBar = document.createElement('div');
                    reviewEditBar.id = 'nova-sp-review-edit-bar';
                    reviewEditBar.className = 'nova-sp-review-edit-bar';
                    var spGameRoot = document.getElementById('single-player-game-screen');
                    if (spGameRoot && optionsContainer && optionsContainer.parentNode) {
                        spGameRoot.insertBefore(reviewEditBar, optionsContainer);
                    }
                }
                reviewEditBar.innerHTML = '';
                var reviewEditBtn = document.createElement('button');
                reviewEditBtn.type = 'button';
                reviewEditBtn.className = 'nova-sp-review-edit-btn';
                reviewEditBtn.textContent = '✏️ Düzenle';
                reviewEditBtn.addEventListener('click', function () {
                    var qid = currentQuestion && currentQuestion.__qid;
                    if (!qid && window.NOVA_SP_REVIEW_CTX && Array.isArray(window.NOVA_SP_REVIEW_CTX.questionIds)) {
                        qid = window.NOVA_SP_REVIEW_CTX.questionIds[currentQuestionIndex];
                    }
                    if (qid && typeof window.novaOpenSpReviewQuestionEditor === 'function') {
                        window.novaOpenSpReviewQuestionEditor(qid, currentQuestionIndex);
                    } else if (typeof showAlert === 'function') {
                        showAlert('Soru düzenleme açılamadı. Sayfayı yenileyip tekrar deneyin.');
                    }
                });
                reviewEditBar.appendChild(reviewEditBtn);
                reviewEditBar.style.display = 'flex';
            } else {
                if (reviewEditBar) reviewEditBar.style.display = 'none';
                if (!wrongReviewActive) {
                    resetTimer();
                    startTimer();
                } else {
                    clearInterval(timer);
                }
            }

            if (wrongReviewActive) {
                var wrItem = wrongReviewItems[wrongReviewPos];
                if (wrItem && typeof window.novaApplyWrongReviewAnswerState === 'function') {
                    window.novaApplyWrongReviewAnswerState(wrItem.chosen, currentQuestion);
                }
                if (typeof showExplanationAndNext === 'function') {
                    showExplanationAndNext();
                }
            }

            if (typeof window.onNewQuestionLoaded === 'function') {
                window.onNewQuestionLoaded();
            }
        }

        function selectOption(e) {
            const selectedButton = e.currentTarget || (e.target && e.target.closest && e.target.closest('.option-button'));
            if (!selectedButton) return;
            if (window.NOVA_WRONG_REVIEW_ACTIVE) return;
            try { window.__novaLastAnsweredIndex = currentQuestionIndex; } catch (_) {}
            const isCorrect = selectedButton.dataset.correct === 'true';

            document.querySelectorAll('.option-button').forEach(button => {
                button.disabled = true;
                if (button !== selectedButton) {
                    button.classList.add('option-faded');
                } else {
                    button.classList.add('option-chosen');
                }
            });

            if (isCorrect) {
                selectedButton.classList.add('correct');
                score++;
            } else {
                selectedButton.classList.add('wrong');
                document.querySelectorAll('.option-button').forEach(button => {
                    if (button.dataset.correct === 'true') {
                        button.classList.add('correct');
                    }
                });
            }

            clearInterval(timer);

            try {
                var cq = gameQuestions[currentQuestionIndex];
                var chosenOpt = String(selectedButton.getAttribute('data-opt-text') || '').trim();
                var qStem = cq
                    ? String(cq.actualQuestion || cq.question || '').trim()
                    : '';
                var infoVal = cq ? String(cq.info || '').trim() : '';
                if (window.NovaTracker && typeof window.NovaTracker.recordAnswer === 'function') {
                    window.NovaTracker.recordAnswer({
                        questionIndex: currentQuestionIndex,
                        chosen: chosenOpt,
                        correct: cq ? String(cq.correct || '').trim() : '',
                        isCorrect: isCorrect,
                        q: qStem,
                        explanation: cq
                            ? String(cq.explanation || cq.aciklama || cq['açıklama'] || '').trim()
                            : '',
                        info: infoVal,
                    });
                }
            } catch (_) {}

            if (isCorrect && typeof window.novaTryPlayKnightCorrectFx === 'function') {
                window.novaTryPlayKnightCorrectFx().then(function () {
                    showExplanationAndNext();
                }).catch(function () {
                    showExplanationAndNext();
                });
            } else {
                showExplanationAndNext();
            }
        }

function proceedToNextQuestion() {
    currentQuestionIndex++;
    const limit = Array.isArray(gameQuestions) ? gameQuestions.length : 0;

    if (currentQuestionIndex < limit) {
        displayCurrentQuestion();
    } else {
        endGame();
    }
}

window.proceedToNextQuestion = proceedToNextQuestion;
window.displayCurrentQuestion = displayCurrentQuestion;

function novaResolveOptionLabel(chosen, q) {
    if (!q) return String(chosen || '').trim();
    var want = String(chosen || '').trim();
    var opts = [q.correct, q.wrong1, q.wrong2]
        .map(function (x) { return String(x || '').trim(); })
        .filter(Boolean);
    if (opts.indexOf(want) >= 0) return want;
    var norm = want.replace(/\s+/g, ' ');
    for (var i = 0; i < opts.length; i++) {
        if (opts[i].replace(/\s+/g, ' ') === norm) return opts[i];
    }
    return want;
}
window.novaResolveOptionLabel = novaResolveOptionLabel;

function novaApplyWrongReviewAnswerState(chosenText, question) {
    var q = question || gameQuestions[currentQuestionIndex];
    var chosen = novaResolveOptionLabel(chosenText, q);
    var opts = document.querySelectorAll('.option-button');
    var chosenBtn = null;
    opts.forEach(function (btn) {
        btn.disabled = true;
        var raw = String(btn.getAttribute('data-opt-text') || '').trim();
        if (!chosenBtn && raw === chosen) chosenBtn = btn;
    });
    opts.forEach(function (btn) {
        if (btn === chosenBtn) {
            btn.classList.add('wrong', 'option-chosen');
        } else {
            btn.classList.add('option-faded');
        }
        if (btn.dataset.correct === 'true') {
            btn.classList.add('correct');
        }
    });
}
window.novaApplyWrongReviewAnswerState = novaApplyWrongReviewAnswerState;

function novaExitResultUiForWrongReview() {
    var spGame = document.getElementById('single-player-game-screen');
    if (spGame) spGame.classList.remove('nova-sp-result-open');
    var sc = scoreContainer || document.getElementById('score-container');
    if (sc) sc.style.display = 'none';
    var nova = document.getElementById('nova-summary');
    if (nova) nova.classList.remove('nz-show');
    if (questionNumber) questionNumber.style.display = 'block';
    var pc = document.querySelector('.progress-container');
    if (pc) pc.style.display = 'block';
    var tc = document.querySelector('.timer-container');
    if (tc) tc.style.display = 'none';
    var qc = document.querySelector('.question-container');
    if (qc) qc.style.display = 'flex';
    if (optionsContainer) optionsContainer.style.display = 'flex';
    var hud = document.querySelector('#single-player-game-screen .nova-sp-game-hud');
    if (hud) hud.style.display = '';
    var expl = document.getElementById('explanation-container');
    if (expl) {
        expl.style.display = 'none';
        expl.innerHTML = '';
    }
    var heroBar = document.getElementById('nova-sp-hero-feature-bar');
    if (heroBar) heroBar.hidden = true;
}

function novaClearWrongReviewState() {
    window.NOVA_WRONG_REVIEW_ACTIVE = false;
    window.__novaWrongReviewItems = null;
    window.__novaWrongReviewPos = 0;
    var spGame = document.getElementById('single-player-game-screen');
    if (spGame) spGame.classList.remove('nova-sp-wrong-review-active');
}
window.novaClearWrongReviewState = novaClearWrongReviewState;

function novaReturnToSpResultScreen() {
    novaClearWrongReviewState();
    var expl = document.getElementById('explanation-container');
    if (expl) {
        expl.style.display = 'none';
        expl.innerHTML = '';
    }
    var qc = document.querySelector('.question-container');
    if (qc) qc.style.display = 'none';
    if (optionsContainer) optionsContainer.style.display = 'none';
    if (questionNumber) questionNumber.style.display = 'none';
    var pc = document.querySelector('.progress-container');
    if (pc) pc.style.display = 'none';
    var tc = document.querySelector('.timer-container');
    if (tc) tc.style.display = 'none';
    var hud = document.querySelector('#single-player-game-screen .nova-sp-game-hud');
    if (hud) hud.style.display = 'none';
    var spGame = document.getElementById('single-player-game-screen');
    if (spGame) {
        spGame.classList.add('nova-sp-result-open');
    }
    var sc = scoreContainer || document.getElementById('score-container');
    if (sc) {
        sc.style.display = 'flex';
        sc.style.visibility = 'visible';
        sc.style.opacity = '1';
    }
    var nova = document.getElementById('nova-summary');
    if (nova) nova.classList.add('nz-show');
}
window.novaReturnToSpResultScreen = novaReturnToSpResultScreen;

function novaShowWrongReviewAt(pos) {
    var items = window.__novaWrongReviewItems || [];
    if (!items.length) {
        novaReturnToSpResultScreen();
        return;
    }
    pos = Math.max(0, Math.min(pos, items.length - 1));
    window.__novaWrongReviewPos = pos;
    var item = items[pos];
    var qList = gameQuestions && gameQuestions.length ? gameQuestions : (window.gameQuestions || []);
    var qIdx = typeof item.questionIndex === 'number' && item.questionIndex >= 0
        ? item.questionIndex
        : -1;
    if (qIdx < 0 || !qList[qIdx]) {
        for (var i = 0; i < qList.length; i++) {
            var qq = qList[i];
            var qt = String((qq && (qq.question || qq.actualQuestion)) || '').trim();
            if (qt && qt === String(item.q || '').trim()) {
                qIdx = i;
                break;
            }
        }
    }
    if (qIdx < 0 || !qList[qIdx]) {
        if (typeof showAlert === 'function') {
            showAlert('Bu yanlış soru yüklenemedi. Sonraki soruya geçiliyor.');
        }
        if (pos < items.length - 1) novaShowWrongReviewAt(pos + 1);
        else novaReturnToSpResultScreen();
        return;
    }
    currentQuestionIndex = qIdx;
    window.__novaLastAnsweredIndex = qIdx;
    displayCurrentQuestion();
}
window.novaShowWrongReviewAt = novaShowWrongReviewAt;

function novaEnterWrongAnswersReview(wrongItems) {
    if (!Array.isArray(wrongItems) || !wrongItems.length) return;
    window.__novaWrongReviewItems = wrongItems.slice();
    window.__novaWrongReviewPos = 0;
    window.NOVA_WRONG_REVIEW_ACTIVE = true;
    try { clearInterval(timer); } catch (_) {}
    try { window.scrollTo(0, 0); } catch (_) {}
    var spGame = document.getElementById('single-player-game-screen');
    if (spGame) spGame.classList.add('nova-sp-wrong-review-active');
    novaExitResultUiForWrongReview();
    novaShowWrongReviewAt(0);
}
window.novaEnterWrongAnswersReview = novaEnterWrongAnswersReview;


        function endGame() {
            if (window.__novaEndGameBusy) return;
            if (!window.__novaEndGameAfterSonuc && typeof window.novaBuzEjderHasSonucTransition === 'function' && window.novaBuzEjderHasSonucTransition() && typeof window.novaBuzEjderPlaySonucTransition === 'function') {
                window.__novaEndGameBusy = true;
                document.body.classList.add('nova-buz-sonuc-active');
                window.novaBuzEjderPlaySonucTransition().then(function () {
                    document.body.classList.remove('nova-buz-sonuc-active');
                    window.__novaEndGameAfterSonuc = true;
                    window.__novaEndGameBusy = false;
                    endGame();
                    window.__novaEndGameAfterSonuc = false;
                }).catch(function () {
                    document.body.classList.remove('nova-buz-sonuc-active');
                    window.__novaEndGameAfterSonuc = true;
                    window.__novaEndGameBusy = false;
                    endGame();
                    window.__novaEndGameAfterSonuc = false;
                });
                return;
            }
            window.__novaEndGameBusy = true;
            try{
            try{ if (timer) clearInterval(timer); }catch(_){}
            try{ if (singlePlayerScreen) singlePlayerScreen.style.display = 'none'; }catch(_){}
            try{
              if (window.novaPerfBeforeGameScreen) window.novaPerfBeforeGameScreen('single-player-game-screen');
              if (typeof window.novaOpenSinglePlayerGameScreen === 'function') {
                window.novaOpenSinglePlayerGameScreen();
              } else if (singlePlayerGameScreen) {
                singlePlayerGameScreen.style.display = 'flex';
              }
              if (window.novaSyncPerfRuntime) window.novaSyncPerfRuntime();
            }catch(_){}
            try{ if (questionNumber) questionNumber.style.display = 'none'; }catch(_){}
            try{ var pc = document.querySelector('.progress-container'); if(pc) pc.style.display = 'none'; }catch(_){}
            try{ var tc = document.querySelector('.timer-container'); if(tc) tc.style.display = 'none'; }catch(_){}
            try{ var qc = document.querySelector('.question-container'); if(qc) qc.style.display = 'none'; }catch(_){}
            try{ if (optionsContainer) optionsContainer.style.display = 'none'; }catch(_){}
            try{ var explEnd = document.getElementById('explanation-container'); if(explEnd){ explEnd.style.display = 'none'; explEnd.innerHTML = ''; } }catch(_){}
            try{ var hudEnd = document.querySelector('#single-player-game-screen .nova-sp-game-hud'); if(hudEnd) hudEnd.style.display = 'none'; }catch(_){}
            try{ var heroBarEnd = document.getElementById('nova-sp-hero-feature-bar'); if(heroBarEnd) heroBarEnd.hidden = true; }catch(_){}
            try{ document.querySelectorAll('.nh-sp-fly-hero').forEach(function(el){ el.remove(); }); }catch(_){}
            try{
              var arenaEnd = document.getElementById('nova-sp-hero-arena');
              if(arenaEnd){
                arenaEnd.classList.remove('is-active','is-centered','is-exiting','is-slamming','is-epic','is-caption-show');
                arenaEnd.setAttribute('aria-hidden','true');
              }
            }catch(_){}
            try{
              var spGame = document.getElementById('single-player-game-screen');
              if(spGame) spGame.classList.add('nova-sp-result-open');
            }catch(_){}

// NOVA: Bazı cihazlarda/akışlarda score container null olabiliyor; crash olmasın.
var __sc = null;
var __sd = null;
var __sm = null;
var __si = null;
try{
  __sc = scoreContainer || document.getElementById('score-container') || document.querySelector('.single-player-game-container .score-container');
  __sd = scoreDisplay || document.getElementById('score');
  __sm = scoreMessage || document.getElementById('score-message');
  __si = scoreImage || document.getElementById('score-image');
}catch(_){}

try{
  if (__sc){
    __sc.style.display = 'flex';
    __sc.style.visibility = 'visible';
    __sc.style.opacity = '1';
  }
}catch(_){}
try{ var rb=document.getElementById('result-back-btn'); if(rb) rb.style.display='inline-flex'; }catch(_){}
try{ window.scrollTo(0,0); }catch(_){}
try{ (function prune(){ if(document.getElementById('nova-summary')) return; const sc=document.querySelector('.single-player-game-container .score-container'); if(sc){ sc.querySelectorAll('div').forEach(n=>{ if(n.id==='score-message'||n.id==='score'||n.id==='score-image'||n.id==='nova-summary'||n.id==='premium-summary') return; const hasChildren=n.children&&n.children.length>0; const t=(n.textContent||'').trim(); if(!hasChildren && !t) n.remove(); }); } })(); }catch(e){};

const totalQ = Array.isArray(window.gameQuestions)
  ? window.gameQuestions.length
  : (window.NOVA_Q_LIMIT || 10);
try{
  if (__sd){
    __sd.textContent = `Doğru Sayısı: ${score}/${totalQ}`;
    __sd.style.display = 'none';
  }
}catch(_){}

try{ document.getElementById('score')?.setAttribute('data-score', String(score)); }catch(e){}
window.score = score;
window.singleScore = score;
window.totalQuestions = totalQ; let message = '';

            let messageClass = '';
            let imageUrl = '';
            try{ if (__sm){ __sm.style.display = 'none'; __sm.textContent = ''; } }catch(_){}

            if (score === 10) {
                message = window.NOVA_SP_REVIEW_MODE ? 'Soru kontrolü tamamlandı' : 'ŞAHANE';
                messageClass = window.NOVA_SP_REVIEW_MODE ? 'green' : 'purple';
                imageUrl = window.NOVA_SP_REVIEW_MODE ? '' : 'https://i.giphy.com/YX8IKLsJJXagt5rZMV.webp';
            } else if (window.NOVA_SP_REVIEW_MODE) {
                message = totalQ + ' sorudan ' + score + ' doğru (kontrol modu)';
                messageClass = 'green';
                imageUrl = '';
            } else if (score >= 8 && score <= 9) {
                message = 'Gayet İyi';
                messageClass = 'green';
                imageUrl = 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHAxM2E0cGY1bmJxcXdvbDYxYXBrZjRncXV0dzJwMXZ4bzJ1bWxzNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/AFmZwgpOXOqWwtcVve/giphy.webp';
            } else if (score >= 6 && score <= 7) {
                message = 'Daha iyisi olabilir.';
                messageClass = 'green';
                imageUrl = 'https://cdn.pixabay.com/photo/2019/10/28/14/35/emoticon-4584554_960_720.png';
            } else if (score >= 3 && score <= 5) {
                message = 'Kendini Geliştirmen Gerek.';
                messageClass = 'blue';
                imageUrl = 'https://cdn.pixabay.com/photo/2019/10/28/14/35/emoticon-4584554_960_720.png';
            } else {
                message = 'Başarısız Sonuç';
                messageClass = 'red';
                imageUrl = 'https://media.tenor.com/rPTWl04F5igAAAAM/byuntear-emoji.gif';
            }

            try{
              if (__sm){
                __sm.textContent = message;
                __sm.classList.remove('purple','green','blue','red');
                if (messageClass !== '') __sm.classList.add(messageClass);
              }
            }catch(_){}

            try{
              if (__si){
                __si.removeAttribute('src');
                __si.style.display = 'none';
              }
            }catch(_){}

            // Müzik çalma işlemi burada
            if (!window.NOVA_SP_REVIEW_MODE && score > 9) { // Örneğin, belirli bir başarı düzeyinde müzik çalınır
                winnerMusic.currentTime = 0;
                winnerMusic.play().catch(error => {
                    console.error("Kazanan müziği çalınamadı:", error);
                });
            }
        
            // NOVA: Homework result writeback
            try {
                if (window.NOVA_ACTIVE_HOMEWORK) {
                    (async function(){
                        try{
                            var d = (typeof firebase!=='undefined' && firebase.database) ? firebase.database() : null;
                            var s = (typeof selectedStudent!=='undefined' && selectedStudent && selectedStudent.studentId) ? selectedStudent.studentId : null;
                            if(d && s){
                                var hw = window.NOVA_ACTIVE_HOMEWORK;
                                var total = Array.isArray(window.gameQuestions) ? window.gameQuestions.length : (window.NOVA_Q_LIMIT||10);
                                var correct = Number(window.score||0);
                                var startedAt = window.NOVA_HW_STARTED_AT || Date.now();
                                var finishedAt = Date.now();
                                var payload = { correct: correct, total: total, startedAt: startedAt, finishedAt: finishedAt, durationMs: Math.max(0, finishedAt - startedAt) };
                                await d.ref('homeworkResults/'+hw.hwId+'/'+s).set(payload);
                                await d.ref('studentHomework/'+s+'/'+hw.hwId).update({ status:'completed', completedAt: finishedAt, correct: correct, total: total });
                                try{
                                  await d.ref('studentHomeworkSummary/'+s+'/pendingCount').transaction(function(curr){
                                    var n = Math.max(0, Math.floor(Number(curr == null ? 0 : curr)));
                                    return Math.max(0, n - 1);
                                  });
                                }catch(_e){}
                                try{
                                  if (typeof window.novaQuestRecord === 'function') {
                                    window.novaQuestRecord('homework_completed', { correct: correct, total: total, hwId: hw.hwId });
                                  }
                                }catch(_){}
                            }
                        }catch(e){ console.warn('Homework write failed', e); }
                        
                        // NOVA_HW_REWARD_HOOK: award diamonds once based on homework percent
                        try{
                          (async ()=>{
                            const hw = window.NOVA_ACTIVE_HOMEWORK;
                            const sObj = (typeof selectedStudent!=='undefined') ? selectedStudent : null;
                            if(hw && sObj && sObj.studentId && sObj.classId){
                              const totalQ = Array.isArray(window.gameQuestions) ? window.gameQuestions.length : (window.NOVA_Q_LIMIT||10);
                              const correctQ = Number(window.score||0);
                              await awardHomeworkDiamonds(hw.hwId, correctQ, totalQ, sObj);
                            }
                          })();
                        }catch(_){ console.warn('HW reward hook failed', _); }
finally{
                            window.NOVA_ACTIVE_HOMEWORK = null;
    // NOVA_HW_BACK_HOOK: Ensure back button is visible on results
    try{
      var endBtn = document.getElementById('final-back-button');
      if (endBtn) endBtn.style.display = 'inline-flex';
    }catch(_){}
    
                            window.NOVA_Q_LIMIT = null;
                            window.NOVA_HW_STARTED_AT = null;
                        }
                    })();
                }
            } catch(_){}
            } catch (e) {
                console.error('endGame', e);
            } finally {
                setTimeout(function () { window.__novaEndGameBusy = false; }, 800);
            }
}

        window.endGame = endGame;

        function novaSpResultGoBack() {
            stopAllMusic();
            if (window.NOVA_SP_REVIEW_MODE) {
                try {
                    if (typeof window.novaCloseSinglePlayerGameScreen === 'function') {
                        window.novaCloseSinglePlayerGameScreen({ showMain: false });
                    } else if (singlePlayerGameScreen) {
                        singlePlayerGameScreen.style.display = 'none';
                    }
                } catch (_) {}
                resetGameScreens();
                try {
                    var spGame = document.getElementById('single-player-game-screen');
                    if (spGame) spGame.classList.remove('nova-sp-result-open');
                } catch (_) {}
                gameQuestions = [];
                currentQuestionIndex = 0;
                score = 0;
                window.NOVA_SP_REVIEW_MODE = true;
                if (typeof window.novaEnterSpReviewMode === 'function') window.novaEnterSpReviewMode();
                if (typeof window.novaOpenSinglePlayerSelectScreen === 'function') {
                    window.novaOpenSinglePlayerSelectScreen();
                } else if (singlePlayerScreen) {
                    singlePlayerScreen.style.display = 'flex';
                }
                return;
            }
            if (typeof window.novaCloseSinglePlayerGameScreen === 'function') {
                window.novaCloseSinglePlayerGameScreen();
            } else {
                singlePlayerGameScreen.style.display = 'none';
                mainScreen.style.removeProperty('display');
            }
            try { if (window.novaSyncPerfRuntime) window.novaSyncPerfRuntime(); } catch (_) {}
            resetGameScreens();
            try {
                var spGame = document.getElementById('single-player-game-screen');
                if (spGame) spGame.classList.remove('nova-sp-result-open');
            } catch (_) {}
            try {
                if (window.NovaTracker && window.NovaTracker.state) {
                    window.NovaTracker.state.finished = false;
                }
            } catch (_) {}
            if (typeof window.novaReturnToMainScreen === 'function') {
                window.novaReturnToMainScreen();
            } else {
                try {
                    if (typeof window.novaEnsureLoggedInUi === 'function') window.novaEnsureLoggedInUi();
                    if (typeof window.novaFixHudFabLayout === 'function') window.novaFixHudFabLayout();
                } catch (_) {}
                novaRequestHudFabRelayout();
            }
        }
        window.novaSpResultGoBack = novaSpResultGoBack;

        if (finalBackButton) {
            finalBackButton.setAttribute('type', 'button');
            finalBackButton.addEventListener('click', function (e) {
                e.preventDefault();
                novaSpResultGoBack();
            });
        }

        // Tüm müzikleri durdurma fonksiyonu
        function stopAllMusic() {
            try {
                duelMusic.pause();
                duelMusic.currentTime = 0;
                winnerMusic.pause();
                winnerMusic.currentTime = 0;
                singlePlayerQuestionMusic.pause();
                singlePlayerQuestionMusic.currentTime = 0;
            } catch (_) {}
        }
        try { window.stopAllMusic = stopAllMusic; } catch (_) {}

        // Kupa Sıralaması Butonuna Event Listener (fallback)
        if (kupaSiralamaButton && !kupaSiralamaButton.dataset.rankOpenBound) {
            kupaSiralamaButton.dataset.rankOpenBound = '1';
            kupaSiralamaButton.addEventListener('click', async () => {
                try{
                  if (typeof window.openSeasonRankingPanel === 'function') {
                    window.openSeasonRankingPanel();
                  } else {
                    rankingPanel.style.display = 'flex';
                    rankingPanel.classList.add('open');
                    rankingPanel.setAttribute('aria-hidden', 'false');
                    loadRanking();
                  }
                }catch(_){}
            });
        }

        // Ranking Back Button Event Listener (Yan Panel Kapatma)
        rankingBackButton.addEventListener('click', () => {
            rankingPanel.classList.remove('open');
            rankingPanel.setAttribute('aria-hidden', 'true');
        });

        // Bu event listener, düello oyununun sonunda "Oyunu Sonlandır" butonunu özel işlevle değiştirir.
        // "Oyunu Sonlandır" butonunun işlevi, önce uyarıyı gösterir, ardından eski işlevini sürdürür.
        // Ayrıca, kazanan ekranında müziğin çalmasını sağlar.
        // (Bu kısım artık düello bitişte kazanan ekranında müzik çaldığı için kaldırıldı)

        function resetTimer() {
            clearInterval(timer);
            timeLeft = 70;
            timerElement.textContent = timeLeft;
            timerElement.style.color = '#ff0000';
        }

        function startTimer() {
            timer = setInterval(() => {
                timeLeft--;
                timerElement.textContent = timeLeft;

                if (timeLeft <= 0) {
                    clearInterval(timer);
                    markQuestionAsWrong();
                    showExplanationAndNext();
                }
            }, 1000);
        }

        function markQuestionAsWrong() {
            document.querySelectorAll('.option-button').forEach(button => {
                if (button.dataset.correct === 'true') {
                    button.classList.add('correct');
                } else {
                    button.classList.add('wrong');
                }
                button.disabled = true;
            });
        }

        // GÜNCELLENMİŞ HAL
/** Tam /classes ağacı indirmeden sınıf id + ad listesi (classesIndex veya shallow + name yaprakları). */
async function novaBuildClassListWithoutFullTree() {
    const db = window.database || (typeof firebase !== 'undefined' && firebase.database && firebase.database());
    if (!db || typeof db.ref !== 'function') return [];
    const out = [];
    try {
        const snapshot = await db.ref('classesIndex').once('value');
        if (snapshot.exists()) {
            snapshot.forEach(function (childSnapshot) {
                const classId = childSnapshot.key;
                const raw = childSnapshot.val() || {};
                const className = (typeof raw === 'string' ? raw : raw.name) || classId;
                out.push({ id: classId, name: className });
            });
        }
    } catch (_) {}
    if (out.length) return out;
    const shallowFn = typeof window.novaRtdbShallowKeys === 'function' ? window.novaRtdbShallowKeys : null;
    let keys = null;
    if (shallowFn) {
        try {
            keys = await shallowFn('classes');
        } catch (_) {
            keys = null;
        }
    }
    if (!keys || !keys.length) return [];
    const BATCH = 12;
    for (let i = 0; i < keys.length; i += BATCH) {
        const chunk = keys.slice(i, i + BATCH);
        const rows = await Promise.all(chunk.map(async function (classId) {
            try {
                const nameSnap = await db.ref('classes/' + classId + '/name').once('value');
                const className = nameSnap.exists() ? String(nameSnap.val() || '') : '';
                return { id: classId, name: className || classId };
            } catch (_) {
                return { id: classId, name: classId };
            }
        }));
        rows.forEach(function (r) { out.push(r); });
    }
    return out;
}

async function fetchClassesForSelection() {
    const CACHE_KEY = 'cachedClasses';
    const CACHE_TIMESTAMP_KEY = 'cachedClassesTimestamp';
    const CACHE_DURATION = 15 * 60 * 1000; // 15 dakika

    const cachedClasses = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const now = Date.now();

    if (cachedClasses && cachedTimestamp) {
        const age = now - parseInt(cachedTimestamp, 10);
        if (age < CACHE_DURATION) {
            // Cache süresi dolmamış, veriyi kullan
            const parsedClasses = JSON.parse(cachedClasses);
            if (Array.isArray(parsedClasses) && parsedClasses.length > 0) {
                populateClassSelect(parsedClasses);
                window.__novaClassesFetchedForLogin = true;
                return;
            }
            // Boş/bozuk cache, canlıdan tekrar dene.
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        } else {
            // Cache süresi dolmuş, temizle
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        }
    }

    const db = window.database || (typeof database !== 'undefined' ? database : null);
    if (!db || typeof db.ref !== 'function') {
        console.warn('fetchClassesForSelection: database yok');
        return;
    }
    const map = window.classNameMap || (window.classNameMap = {});
    const classesIndexRef = db.ref('classesIndex');
    try{
        const snapshot = await classesIndexRef.once('value');
        if (snapshot.exists()) {
            const classesData = [];
            snapshot.forEach(childSnapshot => {
                const classId = childSnapshot.key;
                const raw = childSnapshot.val() || {};
                const className = (typeof raw === 'string' ? raw : raw.name) || classId;
                map[classId] = className;
                classesData.push({ id: classId, name: className });
            });
            classNameMap = map;
            window.classNameMap = map;
            localStorage.setItem(CACHE_KEY, JSON.stringify(classesData));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
            populateClassSelect(classesData);
            window.__novaClassesFetchedForLogin = true;
            return;
        }
    }catch(error){
        console.warn("classesIndex okunamadı, shallow sınıf listesine bakılacak:", error);
    }

    try{
        const classesData = await novaBuildClassListWithoutFullTree();
        if (!classesData.length) {
            console.warn("Seçim için sınıf listesi alınamadı (index ve shallow boş).");
            try{
                const errEl = document.getElementById('student-selection-error');
                if (errEl) errEl.textContent = 'Sınıflar yüklenemedi. İnterneti ve yetkileri kontrol edip sayfayı yenileyin.';
            }catch(_){}
            return;
        }
        classesData.forEach(function (cls) {
            const cid = String((cls && cls.id) || '').trim();
            if (cid) map[cid] = (cls && cls.name) ? String(cls.name) : cid;
        });
        classNameMap = map;
        window.classNameMap = map;
        localStorage.setItem(CACHE_KEY, JSON.stringify(classesData));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
        populateClassSelect(classesData);
        window.__novaClassesFetchedForLogin = true;
    }catch(error){
        console.error("Seçim için sınıf çekme hata:", error);
        try{
            const errEl = document.getElementById('student-selection-error');
            if (errEl) errEl.textContent = 'Sınıflar yüklenemedi. İnterneti ve yetkileri kontrol edip sayfayı yenileyin.';
        }catch(_){}
    }
}

/** Sadece oturumdaki öğrencinin sınıfı için öğrenci listesi (tam ağaç indirmez). */
async function getClassesTreeCached(maxAgeMs) {
    const ttl = (typeof maxAgeMs === 'number' && maxAgeMs > 0) ? maxAgeMs : (5 * 60 * 1000);
    if (!window.__classesTreeCache) {
        window.__classesTreeCache = { ts: 0, val: null, promise: null };
    }
    const now = Date.now();
    const state = window.__classesTreeCache;
    if (state.val && (now - state.ts) < ttl) return state.val;
    if (state.promise) return state.promise;
    const db = window.database || (typeof firebase !== 'undefined' && firebase.database && firebase.database());
    const cid = window.selectedStudent && window.selectedStudent.classId;
    state.promise = (async function () {
        try {
            if (!db || !cid) {
                state.val = null;
                state.ts = Date.now();
                return null;
            }
            const snap = await db.ref('classes/' + cid + '/students').once('value');
            const students = snap.exists() ? (snap.val() || {}) : {};
            const out = {};
            out[cid] = { students: students };
            state.val = out;
            state.ts = Date.now();
            return state.val;
        } catch (e) {
            state.val = null;
            state.ts = Date.now();
            return null;
        } finally {
            state.promise = null;
        }
    })();
    return state.promise;
}

// Doldurma fonksiyonu
function populateClassSelect(classesData) {
    const selectionClassSelectEl = document.getElementById('selection-class-select');
    if (!selectionClassSelectEl) return;
    const map = window.classNameMap || (window.classNameMap = {});
    selectionClassSelectEl.innerHTML = '<option value="">Seçiniz</option>';
    
    novaSortClassGradeRowsLocal(classesData).forEach(function(cls) {
        const cid = String((cls && cls.id) || '').trim();
        const cname = String((cls && cls.name) || '').trim();
        if (!cid || !cname) return;
        if (cid.toLowerCase() === 'undefined' || cname.toLowerCase() === 'undefined') return;
        if (cid.toLowerCase() === 'null' || cname.toLowerCase() === 'null') return;
        map[cid] = cname;
        const option = document.createElement('option');
        option.value = cid;
        option.textContent = cname;
        selectionClassSelectEl.appendChild(option);
    });
    classNameMap = map;
    window.classNameMap = map;
}

(function novaKickLoginClassFetchEarly() {
    try {
        if (window.__novaClassesFetchedForLogin) return;
        var hasSession = false;
        try {
            var raw = localStorage.getItem('selectedStudent');
            if (raw) {
                var o = JSON.parse(raw);
                hasSession = !!(o && o.studentId && o.classId);
            }
        } catch (_) {}
        if (!hasSession && typeof fetchClassesForSelection === 'function') {
            fetchClassesForSelection().catch(function () {});
        }
    } catch (_) {}
})();

        // Alert fonksiyonu
        const alertOverlay = document.getElementById('alertOverlay');
        const alertMessage = document.getElementById('alertMessage');
        const alertOkButton = document.getElementById('alertOkButton');
        function ensureEpicAlertStyles(){
            try{
                if (document.getElementById('nova_epic_alert_style')) return;
                const st = document.createElement('style');
                st.id = 'nova_epic_alert_style';
                st.textContent =
                    '.alert-overlay.nova-epic{backdrop-filter:blur(6px);background:radial-gradient(ellipse at top,rgba(125,211,252,.25),rgba(15,23,42,.75));animation:novaAlertFade .25s ease-out both}' +
                    '.alert-overlay.nova-epic .alert-content{width:min(92vw,430px);border-radius:18px;padding:18px 16px;background:linear-gradient(155deg,#0f172a,#1e1b4b 58%,#312e81);border:1px solid rgba(125,211,252,.35);box-shadow:0 28px 80px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.12);transform:translateY(12px) scale(.98);animation:novaAlertPop .3s cubic-bezier(.2,.8,.2,1) forwards}' +
                    '.alert-overlay.nova-epic .alert-ok-button{border:none;border-radius:12px;padding:12px 16px;font-weight:800;letter-spacing:.01em;color:#fff;background:linear-gradient(135deg,#06b6d4,#2563eb,#7c3aed);box-shadow:0 12px 26px rgba(37,99,235,.35)}' +
                    '.alert-overlay.nova-epic .alert-message{white-space:normal}' +
                    '.nova-alert-title{font-size:22px;font-weight:900;color:#fef9c3;line-height:1.15;text-align:center;text-shadow:0 0 22px rgba(250,204,21,.35);margin-bottom:8px}' +
                    '.nova-alert-body{font-size:15px;line-height:1.55;color:#e2e8f0;text-align:center;white-space:pre-line}' +
                    '@keyframes novaAlertFade{from{opacity:0}to{opacity:1}}' +
                    '@keyframes novaAlertPop{to{transform:translateY(0) scale(1)}}';
                document.head.appendChild(st);
            }catch(_){}
        }
        function escAlertText(v){
            return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        }

        function showAlert(message, showButton = true) {
    ensureEpicAlertStyles();
    const raw = String(message == null ? '' : message).trim();
    const lines = raw.split(/\n+/).map(s=>s.trim()).filter(Boolean);
    let title = 'Bilgilendirme';
    let body = raw || 'İşlem tamamlandı.';
    if (lines.length >= 2) {
        title = lines[0];
        body = lines.slice(1).join('\n');
    } else if (raw.length <= 52) {
        title = raw;
        body = '';
    }
    alertOverlay.classList.add('nova-epic');
    alertMessage.innerHTML = '<div class="nova-alert-title">' + escAlertText(title) + '</div>' +
        (body ? ('<div class="nova-alert-body">' + escAlertText(body) + '</div>') : '');
    alertOverlay.style.display = 'flex';
    alertOkButton.style.display = showButton ? 'block' : 'none';
    alertOkButton.textContent = 'Tamam';
    return new Promise(resolve => {
        if (showButton) {
            alertOkButton.onclick = () => {
                alertOverlay.style.display = 'none';
                resolve();
            };
        } else {
            resolve();
        }
    });
}
        try { window.showAlert = showAlert; } catch(e) {}

        // Prompt fonksiyonu
        const promptOverlay = document.getElementById('promptOverlay');
        const promptMessage = document.getElementById('promptMessage');
        const promptInput = document.getElementById('promptInput');
        const promptCancelButton = document.getElementById('promptCancelButton');
        const promptOkButton = document.getElementById('promptOkButton');

        function showPrompt(message) {
            promptMessage.textContent = message;
            promptInput.value = '';
            promptOverlay.style.display = 'flex';

            return new Promise(resolve => {
                promptOkButton.onclick = () => {
                    const val = promptInput.value;
                    promptOverlay.style.display = 'none';
                    resolve(val);
                };

                promptCancelButton.onclick = () => {
                    promptOverlay.style.display = 'none';
                    resolve(null);
                };
            });
        }

        /** Davet gönderenin bekleme overlay + geri sayımını kapatır (kabul, düello başı, iptal). */
        function clearPendingInviteSenderUI() {
            try {
                if (window.__inviteSendCountdownInterval) {
                    clearInterval(window.__inviteSendCountdownInterval);
                    window.__inviteSendCountdownInterval = null;
                }
                if (window.__inviteSendListener && typeof window.__inviteSendListener === 'function') {
                    try {
                        const path = window.__pendingInvitePath;
                        if (path && typeof database !== 'undefined' && database) {
                            database.ref(path).off('value', window.__inviteSendListener);
                        }
                    } catch (_) {}
                    window.__inviteSendListener = null;
                }
                window.__pendingInvitePath = null;
                const ao = document.getElementById('alertOverlay');
                if (ao) ao.style.display = 'none';
                const ok = document.getElementById('alertOkButton');
                if (ok) ok.style.display = 'block';
            } catch (e) {}
        }

        // Davet Etme ve Dinleme
async function sendInvitation(player) {
    

        // --- INVITE BAN HARD GATE (ilk satırda kontrol) ---
        try {
            const inviterIdForBan = (selectedStudent && selectedStudent.studentId) || (currentStudent && currentStudent.studentId) || (auth && (auth ? auth : null).currentUser && (auth ? auth : null).currentUser.uid);
            const inviterClassForBan = (selectedStudent && selectedStudent.classId) || (currentClassId) || (currentStudent && currentStudent.classId);
            const banDataGate = await readInviteBan(inviterIdForBan, inviterClassForBan);
            if (banDataGate) {
                const expiresAtGate = banDataGate.expiresAt || 0;
                const nowGate = Date.now();
                if (expiresAtGate > nowGate) {
                    const remainingSecGate = Math.ceil((expiresAtGate - nowGate) / 1000);
                    if (typeof showAlert === 'function') {
                        await showAlert(`⚠️ Davet gönderemezsiniz. Kalan ceza süresi: ${remainingSecGate} saniye.`);
                    }
                    return; // kesin dönüş: daveti durdur
                } else {
                    // Süresi geçmiş ban kaydını temizle (ekstra kontrol sorgusu açmadan)
                    try { await database.ref(`inviteBans/${inviterIdForBan}`).remove(); } catch(_) {}
                    if (inviterClassForBan) {
                        try { await database.ref(`classes/${inviterClassForBan}/inviteBans/${inviterIdForBan}`).remove(); } catch(_) {}
                    }
                }
            }
        } catch (eGate) {
            console.warn('Invite ban hard gate kontrolü sırasında hata:', eGate);
            // Hata olsa bile devam etmek yerine fail-safe davranalım:
            // Eğer policy gereği mutlaka engellemek istiyorsan burada return; bırak.
            // Şimdilik devam ediyoruz.
        }
        // --- /INVITE BAN HARD GATE ---
try {
        console.log("Davet gönderilmeye çalışılıyor, oyuncu:", player);

        const [meGate, otherGate] = await Promise.all([
            checkDuelEligibility(selectedStudent.studentId, selectedStudent.classId),
            checkDuelEligibility(player.studentId, player.classId)
        ]);
        if (!meGate.eligible) {
            await showAlert('Düello daveti göndermek için en az 3 kupa ve 15 düello enerjisi gerekir.');
            return;
        }
        if (!otherGate.eligible) {
            await showAlert(`${player.name} düelloya uygun değil (en az 3 kupa ve 15 ⚡ düello enerjisi gerekir).`);
            return;
        }

        // --- 1. Kredi Kontrolleri ---
        // Davet edenin kredi kontrolü
        const inviterCreditsSnap = await database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}/duelCredits`).once('value');
        const inviterCredits = inviterCreditsSnap.exists() ? inviterCreditsSnap.val() : 0;
        if (inviterCredits < 0) {
            await showAlert('Düello başlatmak için en az 3 düello enerjisine sahip olmalısınız.');
            return;
        }

        // Davet edilecek oyuncunun kredi kontrolü
        const invitedCreditsSnap = await database.ref(`classes/${player.classId}/students/${player.studentId}/duelCredits`).once('value');
        const invitedCredits = invitedCreditsSnap.exists() ? invitedCreditsSnap.val() : 0;
        if (invitedCredits < 0) {
            await showAlert(`${player.name} yeterli düello enerjisine sahip değil.`);
            return;
        }
        // --- Kredi Kontrolleri Bitiş ---

        let inviterInLoggedIn = false;
        try {
            const lpInvite = await fetchLoggedInPlayersMapLimited();
            const sid = String(selectedStudent.studentId);
            inviterInLoggedIn = Object.values(lpInvite || {}).some(function (p) {
                return p && String(p.studentId) === sid;
            });
        } catch (_) {}
        if (!inviterInLoggedIn) {
            showAlert('Bağlantı hatası! Lütfen tekrar giriş yapın.');
            return;
        }

        
        // Kupa farkı kuralı kaldırıldı: oyuncular kupa farkı ne olursa olsun düelloya girebilir.
        console.log("Davet gönderilecek oyuncu ID:", player.studentId);
        const invitationPath = `invitations/${player.studentId}`;
        console.log("Davet path:", invitationPath);
        
        const invitationRef = database.ref(invitationPath);
        const activeInviteSnapshot = await invitationRef.once('value');
        
        if (activeInviteSnapshot.exists()) {
            showAlert('Bu oyuncu şu anda başka bir davet değerlendiriyor.');
            return;
        }

        // --- 2. Reddedilen Davet Kontrolü ---
        if (!window.__sendInviteRejectedCache) window.__sendInviteRejectedCache = new Map();
        const rejectedInviteRef = database.ref('rejectedInvites')
            .orderByChild('inviterId')
            .equalTo(selectedStudent.studentId);
        const rejectedCacheKey = `${selectedStudent.studentId}|${player.studentId}`;
        const snapshot = await __cachedInviteCheck(
            window.__sendInviteRejectedCache,
            rejectedCacheKey,
            5000,
            () => rejectedInviteRef.once('value')
        );
        let canSendInvite = true;
        let remainingTime = 0;
        const updates = {};
        let needsUpdate = false;

        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const invite = child.val();
                if (invite.invitedId === player.studentId) {
                    const timeDiff = Date.now() - invite.timestamp;
                    if (timeDiff < 30000) {
                        canSendInvite = false;
                        remainingTime = Math.ceil((30000 - timeDiff) / 1000);
                    } else {
                        // 30 saniyeyi geçen kayıtları silmek için işaretle
                        updates[child.key] = null;
                        needsUpdate = true;
                    }
                }
            });

            if (needsUpdate) {
                await database.ref('rejectedInvites').update(updates);
                // Kayıtlar silindiyse, daveti göndermeye izin ver
                canSendInvite = true;
            }
        }

        if (!canSendInvite) {
            showAlert(`Bu kişi davetinizi reddetti. ${remainingTime} sn sonra tekrar deneyiniz.`);
            return;
        }
        // --- Reddedilen Davet Kontrolü Bitiş ---

        const inDuelSnapshot = await database.ref(`classes/${player.classId}/students/${player.studentId}/inDuel`).once('value');
        const isInDuel = inDuelSnapshot.exists() ? inDuelSnapshot.val() : false;
        
        if (isInDuel) {
            showAlert(`${player.name} zaten bir düelloda!`);
            return;
        }

        const inviterClassNameResolved = await resolveClassNameForUI(
          selectedStudent.classId,
          (classNameMap && classNameMap[selectedStudent.classId]) ? classNameMap[selectedStudent.classId] : ''
        );
        let inviterCupValue = 0;
        let invitedCupValue = 0;
        try{
            const [inviterCupSnap, invitedCupSnap] = await Promise.all([
                database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}/gameCup`).once('value'),
                database.ref(`classes/${player.classId}/students/${player.studentId}/gameCup`).once('value')
            ]);
            inviterCupValue = inviterCupSnap.exists() ? Number(inviterCupSnap.val() || 0) : 0;
            invitedCupValue = invitedCupSnap.exists() ? Number(invitedCupSnap.val() || 0) : 0;
        } catch(_){}

        // Lig kuralı: sadece aynı ligdeki oyuncular eşleşebilir.
        try{
            if (typeof getLeagueFromCups === 'function') {
                const leagueInviter = getLeagueFromCups(inviterCupValue);
                const leagueInvited = getLeagueFromCups(invitedCupValue);
                if (leagueInviter !== leagueInvited) {
                    await showAlert('Düello sadece aynı ligdeki oyuncular arasında yapılır.');
                    return;
                }
            }
        }catch(_){}
        const inviteData = {
            invitedByName: selectedStudent.studentName,
            invitedByNameFrame: selectedStudent.nameFrame || 'default',
            invitedByClassId: selectedStudent.classId,
            invitedByClassName: selectedStudent.className || inviterClassNameResolved || '',
            invitedByStudentId: selectedStudent.studentId,
            invitedByPhoto: studentPhoto.src ? studentPhoto.src : "",
            // Precomputed alanlar: alıcı tarafında tekrar read sayısını azaltır.
            inviterOnline: true,
            inviterInDuel: false,
            inviterCup: inviterCupValue,
            invitedCup: invitedCupValue,
            invitedInDuelAtSend: !!isInDuel,
            expiresAtClient: Date.now() + 10000,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        console.log("Gönderilecek davet verisi:", inviteData);
        await invitationRef.set(inviteData);
        console.log("Davet veritabanına yazıldı");

        // --- 3. Davet sonrası bekleme (showAlert spam yok; kabulde anında kapanır) ---
        clearPendingInviteSenderUI();
        const alertOverlay = document.getElementById('alertOverlay');
        const alertMessage = document.getElementById('alertMessage');
        const alertOkBtn = document.getElementById('alertOkButton');
        let timeLeft = 10;
        window.__pendingInvitePath = invitationPath;
        const onInviteValue = (snapshot) => {
            if (!snapshot.exists()) {
                clearPendingInviteSenderUI();
            }
        };
        window.__inviteSendListener = onInviteValue;
        invitationRef.on('value', onInviteValue);

        window.__inviteSendCountdownInterval = setInterval(() => {
            if (timeLeft > 0) {
                if (alertMessage) {
                    alertMessage.textContent = `Davet gönderildi! Karşı taraf yanıt verene kadar veya ${timeLeft} sn içinde iptal...`;
                }
                if (alertOverlay) alertOverlay.style.display = 'flex';
                if (alertOkBtn) alertOkBtn.style.display = 'none';
                timeLeft--;
            } else {
                clearPendingInviteSenderUI();
                invitationRef.remove().then(() => {
                    console.log("Davet zaman aşımı nedeniyle silindi");
                });
            }
        }, 1000);
        // --- Geri Sayım Bitiş ---
    } catch (error) {
        console.error("Davet gönderme hatası:", error);
        showAlert('Davet gönderilirken bir hata oluştu.');
    }
}

// Periyodik temizleme fonksiyonu - Bu fonksiyonu window.onload içinde çağırın
function startRejectedInvitesCleanup() {
    // Hafifletilmiş sürüm: yalnızca görünür sekmede ve sınırlı sıklıkta çalışır.
    if (window.__rejectedInvitesCleanupInterval) return;
    if (!window.__rejectedInvitesCleanupState) {
        window.__rejectedInvitesCleanupState = { running: false, lastRunAt: 0 };
    }
    const runCleanupIfNeeded = function () {
        try {
            if (document && document.hidden) return;
        } catch (_) {}
        const st = window.__rejectedInvitesCleanupState;
        const now = Date.now();
        if (st.running) return;
        if ((now - st.lastRunAt) < (10 * 60 * 1000)) return; // en fazla 10 dk'da 1
        st.running = true;
        cleanupRejectedInvites()
            .then(function () { st.lastRunAt = Date.now(); })
            .catch(function (err) { console.error("Reddedilen davetler temizliği:", err); })
            .finally(function () { st.running = false; });
    };

    // İlk açılıştan kısa süre sonra bir kez dene.
    setTimeout(runCleanupIfNeeded, 15000);
    // Sonra düşük frekanslı kontrol (çalıştırma koşullu).
    window.__rejectedInvitesCleanupInterval = setInterval(runCleanupIfNeeded, 5 * 60 * 1000);

    // Sekme tekrar görünür olunca bir kez dene.
    try {
        if (!window.__rejectedInvitesVisibilityBound) {
            document.addEventListener('visibilitychange', function () {
                if (!document.hidden) runCleanupIfNeeded();
            });
            window.__rejectedInvitesVisibilityBound = true;
        }
    } catch (_) {}
}

const __inviteValidationCache = {
    rejectedByInviter: new Map(),
    inviterInDuel: new Map()
};
async function __cachedInviteCheck(cacheMap, key, ttlMs, fetcher) {
    const now = Date.now();
    const hit = cacheMap.get(key);
    if (hit && (now - hit.ts) < ttlMs) return hit.val;
    const val = await fetcher();
    cacheMap.set(key, { ts: now, val: val });
    return val;
}

        function startInvitationListener(studentId) {
   const invitationRef = database.ref(`invitations/${studentId}`);
   if (!window.__inviteListenerState) {
       window.__inviteListenerState = {
           lastValidatedInviteKey: null,
           duelRemovedListener: null
       };
   }
   
   // Mevcut dinleyiciyi temizle
   invitationRef.off();

   // Eski reddedilen davetleri temizle
   cleanupOldRejectedInvites(studentId);
   
   // Davetleri dinle
   invitationRef.on('value', async snapshot => {
       try {
           if (snapshot.exists()) {
               const data = snapshot.val();
               const inviteKey = `${data?.invitedByStudentId || ''}|${data?.timestamp || 0}`;
               if (window.__inviteListenerState.lastValidatedInviteKey === inviteKey && invitationOverlay.style.display === 'flex') {
                   currentInvitation = { ...data };
                   return;
               }
               
               // Davet zaten değerlendirilmiş veya timeout olmuşsa çık
               const isExpiredByClientStamp = !!(data && data.expiresAtClient && Date.now() > data.expiresAtClient);
               const isExpiredByServerStamp = !!(data && data.timestamp && (Date.now() - data.timestamp) > 10000);
               if (!data || isExpiredByClientStamp || isExpiredByServerStamp) {
                   await invitationRef.remove();
                   invitationOverlay.style.display = 'none';
                   return;
               }

               // Reddedilen davet kontrolü
               const rejectedInviteRef = database.ref('rejectedInvites')
                   .orderByChild('inviterId')
                   .equalTo(data.invitedByStudentId);

               const rejectedCacheKey = `${data.invitedByStudentId}|${studentId}`;
               const rejectedSnapshot = await __cachedInviteCheck(
                   __inviteValidationCache.rejectedByInviter,
                   rejectedCacheKey,
                   3000,
                   () => rejectedInviteRef.once('value')
               );
               let isRejected = false;

               if (rejectedSnapshot.exists()) {
                   rejectedSnapshot.forEach(child => {
                       const invite = child.val();
                       if (invite.invitedId === studentId) {
                           const timeDiff = Date.now() - invite.timestamp;
                           if (timeDiff >= 30000) {
                               database.ref(`rejectedInvites/${child.key}`).remove();
                           } else {
                               isRejected = true;
                           }
                       }
                   });
               }

               if (isRejected) {
                   await invitationRef.remove();
                   invitationOverlay.style.display = 'none';
                   return;
               }
               
               // Davet gönderenin online durumunu kontrol et (precomputed varsa ek read yapma)
               let inviterOnline = (data && typeof data.inviterOnline === 'boolean') ? data.inviterOnline : true;
               if (!inviterOnline) {
                   await invitationRef.remove();
                   invitationOverlay.style.display = 'none';
                   return;
               }
               
               // Davet gönderen düelloda mı kontrol et (precomputed varsa ek read yapma)
               let inviterInDuel = (data && typeof data.inviterInDuel === 'boolean') ? data.inviterInDuel : null;
               if (inviterInDuel === null) {
                   const inDuelSnapshot = await __cachedInviteCheck(
                       __inviteValidationCache.inviterInDuel,
                       `${data.invitedByClassId}|${data.invitedByStudentId}`,
                       3000,
                       () => database.ref(`classes/${data.invitedByClassId}/students/${data.invitedByStudentId}/inDuel`).once('value')
                   );
                   inviterInDuel = !!inDuelSnapshot.val();
               }
               if (inviterInDuel) {
                   await invitationRef.remove();
                   invitationOverlay.style.display = 'none';
                   return;
               }
               
               // Eğer geçerli bir davetse göster
               currentInvitation = { ...data };
               window.__inviteListenerState.lastValidatedInviteKey = inviteKey;
               await showInvitationModal(data);
               
               // 10 saniyelik geri sayım
               let timeLeft = 10;
               const countdownInterval = setInterval(() => {
                   // Eğer overlay kapalıysa interval'i temizle
                   if (invitationOverlay.style.display !== 'flex') {
                       clearInterval(countdownInterval);
                       return;
                   }
                   
                   // Eski countdown elementini bul ve kaldır
                   const oldCountdown = document.querySelector('.countdown-text');
                   if (oldCountdown) {
                       oldCountdown.remove();
                   }
                   
                   if (timeLeft > 0) {
                       const countdownElement = document.createElement('div');
                       countdownElement.textContent = `${timeLeft} saniye kaldı`;
                       countdownElement.className = 'countdown-text';
                       countdownElement.style.marginTop = '10px';
                       countdownElement.style.color = timeLeft <= 5 ? '#ff0000' : '#000000';
                       invitationMessage.parentElement.appendChild(countdownElement);
                       timeLeft--;
                   } else {
                       clearInterval(countdownInterval);
                       invitationRef.remove();
                       invitationOverlay.style.display = 'none';
                   }
               }, 1000);
           } else {
               // Davet yoksa veya silindiyse overlay'i kapat
               if (invitationOverlay.style.display === 'flex') {
                   invitationOverlay.style.display = 'none';
               }
               window.__inviteListenerState.lastValidatedInviteKey = null;
               currentInvitation = null;
           }
       } catch (error) {
           console.error("Davet işleme hatası:", error);
           invitationOverlay.style.display = 'none';
           window.__inviteListenerState.lastValidatedInviteKey = null;
           currentInvitation = null;
       }
   });

   // Düello dinleyicileri
   const duelInviterRef = database.ref('duels').orderByChild('inviter/studentId').equalTo(studentId);
   const duelInvitedRef = database.ref('duels').orderByChild('invited/studentId').equalTo(studentId);
   
   // Mevcut dinleyicileri temizle
   duelInviterRef.off();
   duelInvitedRef.off();
   
   // Yeni dinleyicileri ekle
   duelInviterRef.on('child_added', snapshot => {
       if (!currentDuelRef) {
           currentDuelRef = snapshot.ref;
           isInviter = true;
           novaEnterDuelWithSyncDelay(snapshot.key, snapshot.val() || {});
       }
   });

   duelInvitedRef.on('child_added', snapshot => {
       if (!currentDuelRef) {
           currentDuelRef = snapshot.ref;
           isInviter = false;
           novaEnterDuelWithSyncDelay(snapshot.key, snapshot.val() || {});
       }
   });

   /* Düello silinme: global duels/child_removed kaldırıldı (RTDB trafik optimizasyonu).
      switchToDuelScreen içinde createdAt yaprak listener kullanılır. */
}

async function showInvitationModal(data) {
   invitationMessage.innerHTML = `${renderNameWithFrame(data.invitedByName, data.invitedByNameFrame || 'default')} seni duelloya davet ediyor.`;
   invitationOverlay.style.display = 'flex';
}

const invitationDeclineButton = document.getElementById('invitationDeclineButton');
const invitationAcceptButton = document.getElementById('invitationAcceptButton');

invitationDeclineButton.addEventListener('click', async () => {
   if (!currentInvitation) {
       console.error("Geçerli davet bulunamadı");
       return;
   }

   try {
       // Önce reddedilen daveti kaydet
       await database.ref('rejectedInvites').push().set({
           inviterId: currentInvitation.invitedByStudentId,
           invitedId: selectedStudent.studentId,
           timestamp: Date.now()
       });

       // Davet referansını oluştur ve kaldır
       const invitationRef = database.ref(`invitations/${selectedStudent.studentId}`);
       await invitationRef.remove();

       // Overlay'i kapat
       invitationOverlay.style.display = 'none';
       
       // currentInvitation'ı temizle
       currentInvitation = null;

       await showAlert('Davet reddedildi');

   } catch (error) {
       console.error("Davet reddetme hatası:", error);
       await showAlert('Davet reddedilirken hata oluştu: ' + error.message);
   }
});

async function cleanupRejectedInvites() {
   const thirtySecondsAgo = Date.now() - 30000;
   const rejectedInvitesRef = database.ref('rejectedInvites');
   const oldInvitesSnapshot = await rejectedInvitesRef
       .orderByChild('timestamp')
       .endAt(thirtySecondsAgo)
       .once('value');

   if (oldInvitesSnapshot.exists()) {
       const updates = {};
       oldInvitesSnapshot.forEach(child => {
           updates[child.key] = null;
       });
       await rejectedInvitesRef.update(updates);
   }
}

// Eski reddedilen davetleri temizleme helper fonksiyonu
async function cleanupOldRejectedInvites(studentId) {
   try {
       const rejectedInvitesRef = database.ref('rejectedInvites');
       const snapshot = await rejectedInvitesRef
           .orderByChild('invitedId')
           .equalTo(studentId)
           .once('value');

       if (snapshot.exists()) {
           const updates = {};
           snapshot.forEach(child => {
               const invite = child.val();
               if (Date.now() - invite.timestamp >= 30000) {
                   updates[child.key] = null;
               }
           });
           
           if (Object.keys(updates).length > 0) {
               await rejectedInvitesRef.update(updates);
           }
       }
   } catch (error) {
       console.error("Eski reddedilen davetleri temizlerken hata:", error);
   }
}

// Periyodik temizlik: startRejectedInvitesCleanup (window.onload) içinde tek interval

async function getOwnInDuelStateFast() {
   try {
       if (typeof currentDuelRef !== 'undefined' && currentDuelRef && !duelEnded) {
           return true;
       }
   } catch (_) {}
   const c = window.__selfInDuelCache;
   if (c && (Date.now() - c.ts) < 5000) return !!c.val;
   const inDuelSnap = await database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}/inDuel`).once('value');
   const isInDuel = inDuelSnap.exists() ? inDuelSnap.val() : false;
   window.__selfInDuelCache = { ts: Date.now(), val: !!isInDuel };
   return !!isInDuel;
}

invitationAcceptButton.addEventListener('click', async () => {
    if (currentInvitation && selectedStudent && selectedStudent.studentId && selectedStudent.classId) {
        const myGate = await checkDuelEligibility(selectedStudent.studentId, selectedStudent.classId);
        if (!myGate.eligible) {
            await showAlert('Düelloya katılmak için en az 3 kupa ve 15 düello enerjisi gerekir.');
            try { await database.ref(`invitations/${selectedStudent.studentId}`).remove(); } catch(_) {}
            invitationOverlay.style.display = 'none';
            currentInvitation = null;
            return;
        }
        try {
            const inviterGate = await checkDuelEligibility(currentInvitation.invitedByStudentId, currentInvitation.invitedByClassId);
            if (!inviterGate.eligible) {
                await showAlert('Davet gönderen oyuncu artık düello şartlarını karşılamıyor.');
                try { await database.ref(`invitations/${selectedStudent.studentId}`).remove(); } catch(_) {}
                invitationOverlay.style.display = 'none';
                currentInvitation = null;
                return;
            }
        } catch(_) {}
    }
    // Kupa farkı kuralı kaldırıldı: davet kabulde kupa farkı engeli yok.
    
   if (currentInvitation && selectedStudent.studentId) {
       try {
           // Önce davet gönderen kişinin hala online olup olmadığını kontrol et
           let inviterOnline = (typeof currentInvitation.inviterOnline === 'boolean') ? currentInvitation.inviterOnline : null;
           if (inviterOnline === null) {
               try {
                   const lpAcc = await fetchLoggedInPlayersMapLimited();
                   const tid = String(currentInvitation.invitedByStudentId);
                   inviterOnline = Object.values(lpAcc || {}).some(function (p) {
                       return p && String(p.studentId) === tid;
                   });
               } catch (_) {
                   inviterOnline = false;
               }
           }
           if (!inviterOnline) {
               await database.ref(`invitations/${selectedStudent.studentId}`).remove();
               invitationOverlay.style.display = 'none';
               currentInvitation = null;
               showAlert('Davet gönderen oyuncu artık çevrimiçi değil!');
               return;
           }

           const isInDuel = await getOwnInDuelStateFast();

           if (isInDuel) {
               showAlert(`Zaten bir düellodasın!`);
               invitationOverlay.style.display = 'none';
               currentInvitation = null;
               return;
           }

           // Lig uyumsuzluğu (eski davet / eşzamanlama): iptal et.
           try{
               if (typeof getLeagueFromCups === 'function' && currentInvitation) {
                   const lInv = getLeagueFromCups(Number(currentInvitation.inviterCup || 0));
                   const lInD = getLeagueFromCups(Number(currentInvitation.invitedCup || 0));
                   if (lInv !== lInD) {
                       await showAlert('Düello uygun değil (lig uyuşmuyor).');
                       try { await database.ref(`invitations/${selectedStudent.studentId}`).remove(); } catch(_){}
                       invitationOverlay.style.display = 'none';
                       currentInvitation = null;
                       return;
                   }
               }
           }catch(_){}

           // Davet verisini hemen kopyala: remove() sonrası listener currentInvitation'ı null yapar
           const acceptedInvite = {
               invitedByStudentId: currentInvitation.invitedByStudentId,
               invitedByClassId: currentInvitation.invitedByClassId,
               invitedByName: currentInvitation.invitedByName,
               invitedByNameFrame: currentInvitation.invitedByNameFrame || 'default',
               invitedByPhoto: currentInvitation.invitedByPhoto
           };

           playersOverlay.style.display = 'none';
           invitationOverlay.style.display = 'none';
           // Daveti sil: davet edenin bekleme ekranı kapanır (listener acceptedInvite'ı etkilemez)
           await database.ref(`invitations/${selectedStudent.studentId}`).remove();

           await createDuelSession(
               acceptedInvite.invitedByStudentId,
               acceptedInvite.invitedByClassId,
               acceptedInvite.invitedByName,
               acceptedInvite.invitedByPhoto,
               acceptedInvite.invitedByNameFrame
           );
       } catch (error) {
           console.error("Düello başlatılırken hata:", error);
           showAlert('Düello başlatılırken bir hata oluştu.');
       }
   }
});


const cupStyle = document.createElement('style');
cupStyle.textContent = `
    .duel-player-cup {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        margin-top: 8px;
        padding: 5px 10px;
        background: linear-gradient(135deg, #ffd700, #ffa500);
        border-radius: 15px;
        box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
        animation: cupGlow 2s infinite alternate;
    }

    .duel-player-cup .cup-icon {
        font-size: 1.2em;
        animation: cupBounce 2s infinite ease-in-out;
    }

    .duel-player-cup .cup-value {
        font-weight: bold;
        color: #fff;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    }

    @keyframes cupGlow {
        from {
            box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
        }
        to {
            box-shadow: 0 2px 12px rgba(255, 215, 0, 0.6);
        }
    }

    @keyframes cupBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
    }
`;
document.head.appendChild(cupStyle);

// Düello başlatma fonksiyonunu güncelle
async function createDuelSession(inviterId, inviterClassId, inviterName, inviterPhoto, inviterNameFrame) {
    const duelRef = database.ref('duels').push();
    
    // Her iki oyuncunun inDuel durumunu izleyen referansları oluştur
    const inviterInDuelRef = database.ref(`classes/${inviterClassId}/students/${inviterId}/inDuel`);
    const invitedInDuelRef = database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}/inDuel`);
    
    // Bağlantı kesildiğinde inDuel durumlarını false yap
    inviterInDuelRef.onDisconnect().set(false);
    invitedInDuelRef.onDisconnect().set(false);

    // Kupa değerlerini al
    const inviterCupRef = database.ref(`classes/${inviterClassId}/students/${inviterId}/gameCup`);
    const invitedCupRef = database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}/gameCup`);
    
    const [inviterCupSnap, invitedCupSnap] = await Promise.all([
        inviterCupRef.once('value'),
        invitedCupRef.once('value')
    ]);
    let inviterFrameResolved = inviterNameFrame || 'default';
    let invitedFrameResolved = (selectedStudent && selectedStudent.nameFrame) ? selectedStudent.nameFrame : 'default';
    let inviterAvatarFrameResolved = 'default';
    let invitedAvatarFrameResolved = (selectedStudent && selectedStudent.avatarFrame) ? selectedStudent.avatarFrame : 'default';
    try{
        const [invFrameSnap, inFrameSnap, invAvatarSnap, inAvatarSnap] = await Promise.all([
            database.ref(`classes/${inviterClassId}/students/${inviterId}/nameFrame`).once('value'),
            database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}/nameFrame`).once('value'),
            database.ref(`classes/${inviterClassId}/students/${inviterId}/avatarFrame`).once('value'),
            database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}/avatarFrame`).once('value')
        ]);
        if (invFrameSnap.exists()) inviterFrameResolved = invFrameSnap.val() || inviterFrameResolved;
        if (inFrameSnap.exists()) invitedFrameResolved = inFrameSnap.val() || invitedFrameResolved;
        if (invAvatarSnap.exists()) inviterAvatarFrameResolved = invAvatarSnap.val() || inviterAvatarFrameResolved;
        if (inAvatarSnap.exists()) invitedAvatarFrameResolved = inAvatarSnap.val() || invitedAvatarFrameResolved;
    }catch(_){}

    await duelRef.set({
        inviter: {
            classId: inviterClassId,
            studentId: inviterId,
            name: inviterName,
            nameFrame: inviterFrameResolved,
            avatarFrame: inviterAvatarFrameResolved,
            photo: inviterPhoto,
            gameCup: inviterCupSnap.val() || 0
        },
        invited: {
            classId: selectedStudent.classId,
            studentId: selectedStudent.studentId,
            name: selectedStudent.studentName,
            nameFrame: invitedFrameResolved,
            avatarFrame: invitedAvatarFrameResolved,
            photo: (studentPhoto.src && studentPhoto.src !== "") ? studentPhoto.src : "",
            gameCup: invitedCupSnap.val() || 0
        },
        selections: {
            class: "",
            subject: "",
            topic: ""
        },
        gameStarted: false,
        questions: [],
        createdAt: firebase.database.ServerValue.TIMESTAMP
    });

    try {
        let createdAtMs = Date.now();
        const cs = await duelRef.child('createdAt').once('value');
        if (cs.exists()) createdAtMs = Number(cs.val()) || createdAtMs;
        const prepStartAt = createdAtMs + NOVA_DUEL_MATCH_FOUND_MS;
        await duelRef.child('syncEnterAt').set(prepStartAt);
        await duelRef.child('prepEndAt').set(prepStartAt + NOVA_DUEL_PREP_MS);
    } catch (e) {
        console.warn('syncEnterAt yazılamadı:', e);
    }

    // İki oyuncunun da inDuel durumunu true yap
    await inviterInDuelRef.set(true);
    await invitedInDuelRef.set(true);
    await setLoggedInPlayerInDuel(true);

    // Bağlantı kesildiğinde düelloyu sil
    duelRef.onDisconnect().remove();

    currentDuelRef = duelRef;
    isInviter = false;
    let duelDataNow = null;
    try {
        const s = await duelRef.once('value');
        duelDataNow = s.exists() ? (s.val() || null) : null;
    } catch (_) {}
    novaEnterDuelWithSyncDelay(duelRef.key, duelDataNow || { createdAt: Date.now() });
}






// ----- 1. Otomatik seçim: tek kişilikle aynı mantık (shallow + yaprak); tüm ders listesi gerekirse seçicide lazy -----
function autoSelectDuelSelections() {
  window.__novaAutoDuelSelecting = true;
  const classId = duelClassSelect.value;
  if (!classId) {
    console.error("duelClassSelect değeri boş!");
    window.__novaAutoDuelSelecting = false;
    return;
  }

  (async function () {
    try {
      const lessonIds = await novaChampionChildKeys('championData/headings/' + classId + '/lessons');
      if (lessonIds === null || !lessonIds.length) {
        await fetchLessons(classId, duelSubjectSelect);
        const lessonOptions = Array.from(duelSubjectSelect.options).filter(opt => opt.value !== "");
        if (lessonOptions.length === 0) {
          console.error("Hiç ders bulunamadı!");
          return;
        }
        const randomLesson = lessonOptions[Math.floor(Math.random() * lessonOptions.length)];
        duelSubjectSelect.value = randomLesson.value;
        if (isInviter) updateDuelSelection('subject', randomLesson.value);
        const selectedLessonName = randomLesson.textContent;
        await finishAutoDuelTopics(classId, randomLesson.value, selectedLessonName);
        return;
      }

      const randomLessonId = lessonIds[Math.floor(Math.random() * lessonIds.length)];
      const lessonNameVal = await novaReadChampionLeaf('championData/headings/' + classId + '/lessons/' + randomLessonId + '/name');
      const lessonLabel = (lessonNameVal != null && lessonNameVal !== '') ? String(lessonNameVal) : randomLessonId;

      duelSubjectSelect.innerHTML = '<option value="">Seçiniz</option>';
      const lo = document.createElement('option');
      lo.value = randomLessonId;
      lo.textContent = lessonLabel;
      duelSubjectSelect.appendChild(lo);
      duelSubjectSelect.value = randomLessonId;
      if (isInviter) updateDuelSelection('subject', randomLessonId);

      novaClearDuelSubjectLazyExpand();
      let lazyExpandStarted = false;
      __novaDuelSubjectLazyExpandHandler = function () {
        if (lazyExpandStarted) return;
        lazyExpandStarted = true;
        novaClearDuelSubjectLazyExpand();
        const keep = duelSubjectSelect.value;
        fetchLessons(classId, duelSubjectSelect).then(function () {
          try { duelSubjectSelect.value = keep; } catch (_) {}
        }).catch(function () {});
      };
      duelSubjectSelect.addEventListener('focus', __novaDuelSubjectLazyExpandHandler);
      duelSubjectSelect.addEventListener('pointerdown', __novaDuelSubjectLazyExpandHandler);

      await finishAutoDuelTopics(classId, randomLessonId, lessonLabel);
    } catch (e) {
      console.error('autoSelectDuelSelections:', e);
    }
  })();
}

async function finishAutoDuelTopics(classId, lessonId, selectedLessonName) {
  await fetchTopics(classId, lessonId, duelTopicSelect);
  const topicOptions = Array.from(duelTopicSelect.options).filter(opt => opt.value !== "");
  if (topicOptions.length === 0) {
    console.error("Hiç konu bulunamadı!");
    return;
  }
  const randomTopic = topicOptions[Math.floor(Math.random() * topicOptions.length)];
  duelTopicSelect.value = randomTopic.value;
  if (isInviter) updateDuelSelection('topic', randomTopic.value);
  const selectedTopicName = randomTopic.textContent;
  animateDuelSelection(selectedLessonName, selectedTopicName);
  if (!window.__novaEpicDuelFlow && !window.__novaDuelPrepBlocking) {
    startDuelAutoCountdown();
  }
}

// ----- 2. Seçimi animasyonlu gösterme fonksiyonu -----
function animateDuelSelection(lessonName, topicName) {

}

// ----- 3. Tek geri sayım: davet eden otomatik başlatır (switchToDuelScreen içindeki eski çift sayaç kaldırıldı) -----
function startDuelAutoCountdown() {
  if (window.__novaEpicDuelFlow || window.__novaDuelPrepBlocking) return;
  const countdownEl = document.getElementById('duelCountdown');
  const startBtn = document.getElementById('duel-start-button');
  if (!countdownEl) return;

  if (window.__duelSelectionCountdownInterval) {
    clearInterval(window.__duelSelectionCountdownInterval);
    window.__duelSelectionCountdownInterval = null;
  }

  countdownEl.style.display = '';
  let timeLeft = 10;
  countdownEl.textContent = timeLeft;
  countdownEl.className = 'countdown green';

  window.__duelSelectionCountdownInterval = setInterval(() => {
    timeLeft--;
    const v = Math.max(0, timeLeft);
    countdownEl.textContent = v;
    if (v > 7) countdownEl.className = 'countdown green';
    else if (v > 3) countdownEl.className = 'countdown orange';
    else countdownEl.className = 'countdown red';

    if (timeLeft <= 0) {
      clearInterval(window.__duelSelectionCountdownInterval);
      window.__duelSelectionCountdownInterval = null;
      countdownEl.textContent = '0';
      if (startBtn && !startBtn.disabled) {
        startBtn.click();
      }
    }
  }, 1000);
}










// ----- RTDB optimizasyonu: düello listener yardımcıları (üst path yerine yaprak dinleyiciler) -----
window.__novaDuelListeners = window.__novaDuelListeners || [];

function novaDuelTrackUnsub(fn) {
    if (typeof fn === 'function') window.__novaDuelListeners.push(fn);
}

function novaDuelTeardownListeners() {
    try {
        (window.__novaDuelListeners || []).forEach(function (fn) {
            try { fn(); } catch (_) {}
        });
    } catch (_) {}
    window.__novaDuelListeners = [];
    try {
        if (typeof window.__novaDuelResponsesUnsub === 'function') window.__novaDuelResponsesUnsub();
    } catch (_) {}
    window.__novaDuelResponsesUnsub = null;
    try {
        if (typeof window.__novaEpicGameWatchUnsub === 'function') window.__novaEpicGameWatchUnsub();
    } catch (_) {}
    window.__novaEpicGameWatchUnsub = null;
    const gsRef = window.__novaDuelGameStartedRef;
    const gsFn = window.__novaDuelGameStartedFn;
    if (gsRef && gsFn) {
        try { gsRef.off('value', gsFn); } catch (_) {}
    }
    window.__novaDuelGameStartedRef = null;
    window.__novaDuelGameStartedFn = null;
}

async function novaBuildDuelStartData(duelRef) {
    if (!duelRef) return null;
    const parts = await Promise.all([
        duelRef.child('questions').once('value'),
        duelRef.child('inviter').once('value'),
        duelRef.child('invited').once('value'),
        duelRef.child('playAt').once('value'),
        duelRef.child('gameStarted').once('value')
    ]);
    if (!parts[4].exists() || parts[4].val() !== true) return null;
    const questions = parts[0].val();
    if (!Array.isArray(questions) || questions.length < 10) return null;
    return {
        gameStarted: true,
        questions: questions,
        inviter: parts[1].val() || {},
        invited: parts[2].val() || {},
        playAt: parts[3].val()
    };
}
try { window.novaBuildDuelStartData = novaBuildDuelStartData; } catch (_) {}

function novaMergeDuelPartyIntoCurrent(side, val) {
    if (!window.__currentDuelData) window.__currentDuelData = {};
    window.__currentDuelData[side] = val || {};
    window.__currentDuelData[side].nameFrame = window.__currentDuelData[side].nameFrame || 'default';
}

async function novaRefreshDuelMetaUi(duelKey, data) {
    if (!data) return;
    data.inviter = data.inviter || {};
    data.invited = data.invited || {};
    data.inviter.nameFrame = data.inviter.nameFrame || 'default';
    data.invited.nameFrame = data.invited.nameFrame || 'default';
    try { window.__currentDuelData = data; } catch (_) {}
    try {
        window.__lastDuelNameFrames = {
            inviter: { name: data.inviter.name, frame: data.inviter.nameFrame || 'default' },
            invited: { name: data.invited.name, frame: data.invited.nameFrame || 'default' }
        };
    } catch (_) {}

    if (window.__novaDuelDigestKey !== duelKey) {
        window.__novaDuelDigestKey = duelKey;
        window.__novaDuelRefDigest = null;
    }
    const sel = data.selections || {};
    const gCup = function (x) { return (x != null && x !== '') ? String(x) : ''; };
    const duelUiDigest = [
        data.gameStarted ? '1' : '0',
        data.inviter.name || '', data.inviter.photo || '', gCup(data.inviter.gameCup),
        data.inviter.nameFrame || '', data.inviter.avatarFrame || '',
        data.invited.name || '', data.invited.photo || '', gCup(data.invited.gameCup),
        data.invited.nameFrame || '', data.invited.avatarFrame || '',
        sel.class || '', sel.subject || '', sel.topic || ''
    ].join('\x1e');
    const skipHeavyUi = (window.__novaDuelRefDigest === duelUiDigest);

    if (!skipHeavyUi) {
        window.__novaDuelRefDigest = duelUiDigest;
        duelInviterPhoto.src = data.inviter.photo || 'https://via.placeholder.com/80';
        setNameWithFrame(duelInviterName, data.inviter.name, data.inviter.nameFrame || 'default');
        duelInvitedPhoto.src = data.invited.photo || 'https://via.placeholder.com/80';
        setNameWithFrame(duelInvitedName, data.invited.name, data.invited.nameFrame || 'default');
        try {
            applyAvatarFrameToImage(duelInviterPhoto, data.inviter.avatarFrame || 'default');
            applyAvatarFrameToImage(duelInvitedPhoto, data.invited.avatarFrame || 'default');
        } catch (_) {}

        const inviterInfo = document.getElementById('duel-inviter-info');
        const invitedInfo = document.getElementById('duel-invited-info');
        document.querySelectorAll('.duel-player-cup').forEach(function (cup) { cup.remove(); });

        if (inviterInfo) {
            const inviterCup = document.createElement('div');
            inviterCup.className = 'duel-player-cup';
            inviterCup.innerHTML = '<span class="cup-icon">🏆</span><span class="cup-value">' + data.inviter.gameCup + '</span>';
            inviterInfo.appendChild(inviterCup);
        }
        if (invitedInfo) {
            const invitedCup = document.createElement('div');
            invitedCup.className = 'duel-player-cup';
            invitedCup.innerHTML = '<span class="cup-icon">🏆</span><span class="cup-value">' + data.invited.gameCup + '</span>';
            invitedInfo.appendChild(invitedCup);
        }

        [duelClassSelect, duelSubjectSelect, duelTopicSelect].forEach(function (select) {
            select.disabled = true;
            select.style.pointerEvents = 'none';
            select.style.cursor = 'not-allowed';
            select.style.opacity = '0.7';
        });

        if (data.selections) {
            try {
                if (data.selections.class) {
                    duelClassSelect.value = data.selections.class;
                    const lessonsLoaded = await fetchLessons(data.selections.class, duelSubjectSelect);
                    if (lessonsLoaded && data.selections.subject) {
                        duelSubjectSelect.value = data.selections.subject;
                        const topicsLoaded = await fetchTopics(data.selections.class, data.selections.subject, duelTopicSelect);
                        if (topicsLoaded && data.selections.topic) {
                            duelTopicSelect.value = data.selections.topic;
                        }
                    }
                }
                if (!isInviter) {
                    const [classOptions, subjectOptions, topicOptions] = await Promise.all([
                        data.selections.class ? getClassOptions() : null,
                        data.selections.subject ? getLessonOptions(data.selections.class) : null,
                        data.selections.topic ? getTopicOptions(data.selections.class, data.selections.subject) : null
                    ]);
                    if (classOptions) {
                        duelClassSelect.innerHTML = classOptions;
                        duelClassSelect.value = data.selections.class;
                    }
                    if (subjectOptions) {
                        duelSubjectSelect.innerHTML = subjectOptions;
                        duelSubjectSelect.value = data.selections.subject;
                    }
                    if (topicOptions) {
                        duelTopicSelect.innerHTML = topicOptions;
                        duelTopicSelect.value = data.selections.topic;
                    }
                }
            } catch (error) {
                console.error('Seçimler senkronize edilirken hata:', error);
            }
        }
    }

    if (!isInviter) {
        duelStartButton.disabled = true;
    } else {
        checkDuelSelections();
    }
}

async function novaHandleDuelNodeRemoved(partyIds) {
    if (duelEnded) return;
    const p = partyIds || window.__novaDuelPartyIds || {};
    try {
        const currentPlayerId = selectedStudent.studentId;
        await updateDuelScore('DISCONNECTED', {
            inviterId: p.inviterId,
            inviterClassId: p.inviterClassId,
            invitedId: p.invitedId,
            invitedClassId: p.invitedClassId,
            disconnectedId: currentPlayerId === p.inviterId ? p.invitedId : p.inviterId,
            disconnectedClassId: currentPlayerId === p.inviterId ? p.invitedClassId : p.inviterClassId
        });
        await Promise.all([
            database.ref('classes/' + p.inviterClassId + '/students/' + p.inviterId + '/inDuel').set(false),
            database.ref('classes/' + p.invitedClassId + '/students/' + p.invitedId + '/inDuel').set(false)
        ]);
        await setLoggedInPlayerInDuel(false);
        window.location.reload();
    } catch (error) {
        console.error('Oyun sonlandırma hatası:', error);
        await showAlert('Oyun sonlandırılırken bir hata oluştu');
        window.location.reload();
    }
}

function novaAttachOptimizedDuelListeners(duelRef, duelKey) {
    window.__novaDuelSelectionDigest = window.__novaDuelSelectionDigest || '';

    function onPartySide(side, snap) {
        if (!snap.exists()) return;
        novaMergeDuelPartyIntoCurrent(side, snap.val() || {});
        novaRefreshDuelMetaUi(duelKey, window.__currentDuelData);
    }

    ['inviter', 'invited'].forEach(function (side) {
        const r = duelRef.child(side);
        const fn = function (snap) { onPartySide(side, snap); };
        r.on('value', fn);
        novaDuelTrackUnsub(function () { try { r.off('value', fn); } catch (_) {} });
    });

    const selRef = duelRef.child('selections');
    const selFn = async function (selectionsSnapshot) {
        if (!window.__currentDuelData) window.__currentDuelData = {};
        const sv = selectionsSnapshot.exists() ? (selectionsSnapshot.val() || {}) : {};
        window.__currentDuelData.selections = sv;
        const digest = (sv.class || '') + '|' + (sv.subject || '') + '|' + (sv.topic || '');
        if (digest === window.__novaDuelSelectionDigest) return;
        window.__novaDuelSelectionDigest = digest;
        await novaRefreshDuelMetaUi(duelKey, window.__currentDuelData);
        if (!isInviter && selectionsSnapshot.exists() && sv.subject && sv.class) {
            try {
                if (duelSubjectSelect.value !== sv.subject) {
                    await fetchLessons(sv.class, duelSubjectSelect);
                    duelSubjectSelect.value = sv.subject;
                }
                if (sv.topic) {
                    if (duelTopicSelect.value !== sv.topic) {
                        await fetchTopics(sv.class, sv.subject, duelTopicSelect);
                        duelTopicSelect.value = sv.topic;
                    }
                } else {
                    duelTopicSelect.value = '';
                }
            } catch (_) {}
        }
    };
    selRef.on('value', selFn);
    novaDuelTrackUnsub(function () { try { selRef.off('value', selFn); } catch (_) {} });

    const leafRef = duelRef.child('createdAt');
    const delFn = function (snap) {
        if (snap.exists()) return;
        novaHandleDuelNodeRemoved(window.__novaDuelPartyIds);
    };
    leafRef.on('value', delFn);
    novaDuelTrackUnsub(function () { try { leafRef.off('value', delFn); } catch (_) {} });
}
try { window.novaDuelTeardownListeners = novaDuelTeardownListeners; } catch (_) {}

function switchToDuelScreen(duelKey) {
    try { window.__novaActiveDuelKey = duelKey; } catch (_) {}
    clearPendingInviteSenderUI();
    try {
        if (typeof novaDuelTeardownListeners === 'function') novaDuelTeardownListeners();
    } catch (_) {}
    try {
        const mm = document.getElementById('matchmakingScreen');
        if (mm) mm.style.display = 'none';
        if (typeof stopAutoMatchCoordinator === 'function') stopAutoMatchCoordinator();
        if (typeof removeSelfFromAutoMatchPool === 'function') {
            removeSelfFromAutoMatchPool();
        }
    } catch (_) {}
    // Diğer ekranları gizle
    if (mainScreen) mainScreen.style.setProperty('display', 'none', 'important');
    if (typeof window.novaHideSinglePlayerSelectForGame === 'function') {
        window.novaHideSinglePlayerSelectForGame();
    } else if (singlePlayerScreen) {
        singlePlayerScreen.style.display = 'none';
    }
    if (typeof window.novaCloseSinglePlayerGameScreen === 'function') {
        window.novaCloseSinglePlayerGameScreen({ showMain: false });
    } else {
        document.body.classList.remove('nova-sp-screen-open', 'nova-sp-game-open');
        if (singlePlayerGameScreen) singlePlayerGameScreen.style.display = 'none';
    }
    try{ if (window.novaSyncPerfRuntime) window.novaSyncPerfRuntime(); }catch(_){}
    if (friendsScreen) friendsScreen.style.display = 'none';
    if (rankingPanel) {
      rankingPanel.classList.remove('open');
      rankingPanel.setAttribute('aria-hidden', 'true');
    }
    if (playersOverlay) playersOverlay.style.display = 'none';
    
    if (window.__novaEpicDuelFlow || window.__novaAutoMatchFlow) {
        document.body.classList.add('nova-duel-epic-active');
    }
    if (typeof window.novaOpenDuelSelectionScreen === 'function') {
        window.novaOpenDuelSelectionScreen();
    } else {
        duelSelectionScreen.style.display = 'flex';
        duelSelectionScreen.classList.add('container');
    }
    if (window.__novaEpicDuelFlow || window.__novaAutoMatchFlow) {
        const selHide = document.getElementById('duel-selection-screen');
        if (selHide) selHide.style.setProperty('display', 'none', 'important');
        const banner = document.getElementById('selecting-student-banner');
        if (banner) banner.style.display = 'none';
        const cd = document.getElementById('duelCountdown');
        if (cd) cd.style.display = 'none';
    }
    try {
        if (window.__novaAutoMatchFlow && typeof hideWaitOverlay === 'function') hideWaitOverlay();
    } catch (_) {}

    const duelRef = database.ref(`duels/${duelKey}`);
    currentDuelRef = duelRef;
    try { window.currentDuelRef = currentDuelRef; } catch (_) {}
    // Yeni düello ekranına her girişte bayrakları temizle; eski oturum state'i kilitlenmeye yol açabiliyor.
    duelGameStarted = false;
    duelEnded = false;
    duelQuestions = [];
    window.__novaStartDuelGameLock = null;
    window.__novaDuelGameActiveKey = null;
    window.__novaDuelPlayAt = 0;
    let inviterId, inviterClassId, invitedId, invitedClassId;

    const gameStartedRef = duelRef.child('gameStarted');
    const gameStartedFn = function (snapshot) {
        if (snapshot.val() !== true) return;
        if (window.__duelSelectionCountdownInterval) {
            clearInterval(window.__duelSelectionCountdownInterval);
            window.__duelSelectionCountdownInterval = null;
        }
        const ce = document.getElementById('duelCountdown');
        if (ce) ce.style.display = 'none';
        if (window.__novaStartDuelGameLock === duelKey) {
            try {
                const ge = document.getElementById('duel-game-screen');
                if (ge && getComputedStyle(ge).display !== 'none') return;
            } catch (_) {}
            window.__novaStartDuelGameLock = null;
        }
        window.__novaStartDuelGameLock = duelKey;
        duelGameStarted = true;
        novaBuildDuelStartData(duelRef).then(function (d) {
            if (!d) return;
            try { if (typeof hideWaitOverlay === 'function') hideWaitOverlay(); } catch (_) {}
            if (window.__novaDuelPrepBlocking) {
                window.__novaQueuedDuelStart = d;
                return;
            }
            if (window.__novaStartDuelGameLock === duelKey) return;
            window.__novaStartDuelGameLock = duelKey;
            startDuelGame(d);
        }).catch(function () {});
    };
    gameStartedRef.off('value', window.__novaDuelGameStartedFn);
    gameStartedRef.on('value', gameStartedFn);
    window.__novaDuelGameStartedRef = gameStartedRef;
    window.__novaDuelGameStartedFn = gameStartedFn;
    novaDuelTrackUnsub(function () {
        try { gameStartedRef.off('value', gameStartedFn); } catch (_) {}
    });

    Promise.all([
        duelRef.child('inviter').once('value'),
        duelRef.child('invited').once('value'),
        duelRef.child('selections').once('value')
    ]).then(function (parts) {
        const invSnap = parts[0];
        const inSnap = parts[1];
        const selSnap = parts[2];
        if (!invSnap.exists() && !inSnap.exists()) return;
        const initialData = {
            inviter: invSnap.exists() ? (invSnap.val() || {}) : {},
            invited: inSnap.exists() ? (inSnap.val() || {}) : {},
            selections: selSnap.exists() ? (selSnap.val() || {}) : {}
        };
        inviterId = initialData.inviter.studentId;
        inviterClassId = initialData.inviter.classId;
        invitedId = initialData.invited.studentId;
        invitedClassId = initialData.invited.classId;
        window.__novaDuelPartyIds = {
            inviterId: inviterId,
            inviterClassId: inviterClassId,
            invitedId: invitedId,
            invitedClassId: invitedClassId
        };
        window.__currentDuelData = initialData;
        novaRefreshDuelMetaUi(duelKey, initialData);

            if (!isInviter) {
                const ce = document.getElementById('duelCountdown');
                if (ce) ce.style.display = 'none';
            }

            // Nova: update framed stars under names in selection panel
            try {
                Promise.all([
                    database.ref(`classes/${inviterClassId}/students/${inviterId}/gameCup`).once('value'),
                    database.ref(`classes/${invitedClassId}/students/${invitedId}/gameCup`).once('value')
                ]).then(function(snaps){
                    var invCountSnap = snaps[0], inCountSnap = snaps[1];
                    var invCount = invCountSnap && invCountSnap.exists() ? Number(invCountSnap.val()) || 0 : 0;
                    var inCount  = inCountSnap && inCountSnap.exists()  ? Number(inCountSnap.val())  || 0 : 0;
                    var invStarsEl = document.getElementById('duel-inviter-stars');
                    var inStarsEl  = document.getElementById('duel-invited-stars');
                    if (invStarsEl) invStarsEl.innerHTML = getStars(invCount);
                    if (inStarsEl)  inStarsEl.innerHTML  = getStars(inCount);
                     var invRankEl = document.getElementById('duel-inviter-rank'); if (invRankEl) invRankEl.innerHTML = getRankHTML(invCount);
                     var inRankEl = document.getElementById('duel-invited-rank'); if (inRankEl) inRankEl.innerHTML = getRankHTML(inCount);
                }).catch(function(e){
                    console.warn('Yıldızlar (selection) yüklenemedi:', e);
                });
            } catch(e) {
                console.warn('Yıldızlar (selection) yüklenemedi:', e);
            }

            
            // Düello kredisi artık oyun başında değil, oyun bittiğinde uygulanır (kazanan +10, kaybeden +5; çıkan -15 ayrı kural).

            // Sınıf adı için yalnızca name yaprağı (tüm sınıf düğümü indirilmez)
            database.ref(`classes/${selectedStudent.classId}/name`).once('value').then(function (nameSnap) {
                if (nameSnap.exists()) {
                    const studentClassName = String(nameSnap.val() || '');

                    var fetchHeadingsFn = window.novaFetchChampionHeadingList;
                    if (typeof fetchHeadingsFn !== 'function') return;
                    fetchHeadingsFn().then(function(list){
                        duelClassSelect.innerHTML = '<option value="">Seçiniz</option>';
                        if (!list || !list.length) return;
                        list.forEach(function(row){
                            const classId = row.id;
                            const championClassName = row.name;
                            if (championClassName !== studentClassName) return;
                            const option = document.createElement('option');
                            option.value = classId;
                            option.textContent = championClassName;
                            duelClassSelect.appendChild(option);
                            duelClassSelect.value = classId;

                            if (isInviter) {
                                fetchLessons(classId, duelSubjectSelect);
                                autoSelectDuelSelections();
                            }
                        });
                    }).catch(function(e){ console.warn('Düello sınıf eşlemesi (headings) okunamadı:', e); });
                }
            }).catch(function (e) { console.warn('Sınıf adı okunamadı:', e); });

            try{hideWaitOverlay();}catch(e){};



        
        // Sadece davet eden kişinin ismini göster
        const selectingStudentBanner = document.getElementById('selecting-student-banner');
        selectingStudentBanner.textContent = `Düello Başlıyor`;
        selectingStudentBanner.style.display = 'block';
});

    if (isInviter && window.__novaDuelDisconnectKey !== duelKey) {
        window.__novaDuelDisconnectKey = duelKey;
        duelRef.onDisconnect().remove();
    }













    novaAttachOptimizedDuelListeners(duelRef, duelKey);
}

async function syncDuelSelections(data) {
    if (!data.selections) return;
    
    try {
        // Sınıf seçimini güncelle
        if (data.selections.class) {
            duelClassSelect.value = data.selections.class;
            
            // Dersleri yükle
            await fetchLessons(data.selections.class, duelSubjectSelect);
            
            // Ders seçimini güncelle
            if (data.selections.subject) {
                duelSubjectSelect.value = data.selections.subject;
                
                // Konuları yükle
                await fetchTopics(data.selections.class, data.selections.subject, duelTopicSelect);
                
                // Konu seçimini güncelle
                if (data.selections.topic) {
                    duelTopicSelect.value = data.selections.topic;
                }
            }
        }
    } catch (error) {
        console.error("Seçimler senkronize edilirken hata:", error);
    }
}














async function getClassOptions() {
   const fetchHeadings = window.novaFetchChampionHeadingList;
   const list = novaSortClassGradeRowsLocal(
       typeof fetchHeadings === 'function' ? await fetchHeadings() : []
   );
   let options = '<option value="">Seçiniz</option>';
   if (list && list.length) {
       list.forEach(function (row) {
           options += `<option value="${row.id}">${row.name}</option>`;
       });
   }
   return options;
}

async function getLessonOptions(classId) {
   const list = await novaFetchLessonsList(classId);
   let options = '<option value="">Seçiniz</option>';
   if (list && list.length) {
       list.forEach(function (row) {
           options += `<option value="${row.id}">${row.name}</option>`;
       });
   }
   return options;
}

async function getTopicOptions(classId, lessonId) {
   const list = await novaFetchTopicsList(classId, lessonId);
   let options = '<option value="">Seçiniz</option>';
   if (list && list.length) {
       list.forEach(function (row) {
           options += `<option value="${row.id}">${row.name}</option>`;
       });
   }
   return options;
}


      function resetDuelGameState() {
            duelQuestionNumber.textContent = 'Soru 1/10';
            duelProgressBarInner.style.width = '0%';
            duelTimerElement.textContent = '45';
            duelTimerElement.style.color = '#ff0000';
            inviterCorrectCountEl.textContent = "0";
            invitedCorrectCountEl.textContent = "0";

            duelQuestions = [];
            duelCurrentQuestionIndex = 0;
            duelInviterScore = 0;
            duelInvitedScore = 0;
            duelLiveInviterCorrect = 0;
            duelLiveInvitedCorrect = 0;
            clearInterval(duelTimer);
            duelQuestionLocked = false;
            duelGameStarted = false;
            duelEnded = true; // Duel bittiğinde bayrağı ayarla

            // Düello Oyun Müziğini Durdur
            duelMusic.pause();
            duelMusic.currentTime = 0;
        }

duelClassSelect.addEventListener('change', (e) => {
    e.preventDefault(); // Değişikliği engelle
    return false;
});

        duelSubjectSelect.addEventListener('change', () => {
            if (isInviter) {
                fetchTopics(duelClassSelect.value, duelSubjectSelect.value, duelTopicSelect);
                updateDuelSelection('subject', duelSubjectSelect.value);
            }
        });

        duelTopicSelect.addEventListener('change', () => {
            if (isInviter) {
                updateDuelSelection('topic', duelTopicSelect.value);
            }
        });

async function updateDuelSelection(field, value) {
    // Eğer referans yoksa çık
    if (!currentDuelRef) return;

    // Sınıf seçimini değiştirmeye çalışıyorsa engelle
    if (field === 'class' && value !== duelClassSelect.value) {
        return;
    }
    
    try {
        // Seçimi veritabanında güncelle
        await currentDuelRef.child('selections').child(field).set(value);

        // Seçime göre bağımlı alanları güncelle
        if (field === 'subject') {
            // Konu seçildiğinde alt konuları yükle
            const topicsLoaded = await fetchTopics(duelClassSelect.value, value, duelTopicSelect);
            if (!topicsLoaded) {
                console.warn('Konular yüklenemedi');
            }
        }

        // Her iki oyuncunun select elementlerini senkronize et
        if (field === 'subject' || field === 'topic') {
            const selections = (await currentDuelRef.child('selections').once('value')).val() || {};
            
            // Davet eden oyuncu için seçimleri güncelle
            if (isInviter) {
                duelSubjectSelect.value = selections.subject || '';
                duelTopicSelect.value = selections.topic || '';
            }
        }

        // Seçimlerin durumunu kontrol et
        checkDuelSelections();

    } catch (error) {
        console.error('Seçim güncellenirken hata:', error);
        showAlert('Seçim güncellenirken bir hata oluştu').catch(console.error);
    }
}

        function checkDuelSelections() {
            if (isInviter) {
                const c = duelClassSelect.value;
                const s = duelSubjectSelect.value;
                const t = duelTopicSelect.value;
                if (c !== "" && s !== "" && t !== "") {
                    duelStartButton.classList.add('active');
                    duelStartButton.disabled = false;
                } else {
                    duelStartButton.classList.remove('active');
                    duelStartButton.disabled = true;
                }
            }
        }

        function formatDuelQuestionsChosen(pickedDuelQs) {
            return pickedDuelQs.slice(0, 10).map(function (q) {
                var infoText = String(q.info || '').trim();
                var infoItems = q.infoItems || null;
                var infoBlocks = q.infoBlocks || null;
                var questionText = '';
                if (typeof q.question === 'object' && q.question !== null) {
                    if (!infoText) infoText = String(q.question.info || '').trim();
                    questionText = String(q.question.text || q.actualQuestion || '').trim();
                    if (!infoItems && Array.isArray(q.question.infoItems)) {
                        infoItems = q.question.infoItems;
                    }
                    if (!infoBlocks && Array.isArray(q.question.infoBlocks)) {
                        infoBlocks = q.question.infoBlocks;
                    }
                } else {
                    questionText = String(q.question || q.actualQuestion || '').trim();
                }
                return {
                    info: infoText,
                    infoItems: infoItems,
                    infoBlocks: infoBlocks,
                    actualQuestion: questionText,
                    question: questionText,
                    correct: q.correct,
                    wrong1: q.wrong1,
                    wrong2: q.wrong2,
                    options: shuffleArray([
                        { text: q.correct, correct: true },
                        { text: q.wrong1, correct: false },
                        { text: q.wrong2, correct: false }
                    ])
                };
            });
        }

        async function novaEpicInviterCommitStart() {
            if (!isInviter || !currentDuelRef) return false;
            try {
                const classId = String(
                    duelClassSelect.value || (selectedStudent && selectedStudent.classId) || ''
                );
                if (!classId) return false;

                const lessonIds = await novaChampionChildKeys(
                    'championData/headings/' + classId + '/lessons'
                );
                if (!lessonIds || !lessonIds.length) return false;
                const subjectId = lessonIds[Math.floor(Math.random() * lessonIds.length)];
                const topicIds = await novaChampionChildKeys(
                    'championData/headings/' + classId + '/lessons/' + subjectId + '/topics'
                );
                if (!topicIds || !topicIds.length) return false;
                const topicId = topicIds[Math.floor(Math.random() * topicIds.length)];

                await currentDuelRef.child('selections').set({
                    class: classId,
                    subject: subjectId,
                    topic: topicId
                });

                const topicIdsList = await listTopicQuestionIdsExact(classId, subjectId, topicId);
                if (!topicIdsList || topicIdsList.length < 10) return false;
                const selectedIds = shuffleArray(topicIdsList.slice()).slice(0, 10);

                duelClassId = classId;
                duelSubjectId = subjectId;
                duelTopicId = topicId;

                var duelUpdate = {
                    playAt: firebase.database.ServerValue.TIMESTAMP,
                    gameStarted: true
                };
                if (
                    typeof window.novaCdnShouldWriteDuelRefsOnly === 'function' &&
                    window.novaCdnShouldWriteDuelRefsOnly() &&
                    typeof window.novaCdnBuildDuelQuestionSource === 'function'
                ) {
                    duelUpdate.questionSource = window.novaCdnBuildDuelQuestionSource(
                        classId,
                        subjectId,
                        topicId,
                        selectedIds
                    );
                    duelUpdate.questions = null;
                } else {
                    const picked = await pickAndLoadTopicQuestionsExact(
                        classId,
                        subjectId,
                        topicId,
                        10
                    );
                    if (!picked || picked.length < 10) return false;
                    duelUpdate.questions = formatDuelQuestionsChosen(picked);
                }

                await currentDuelRef.update(duelUpdate);
                return true;
            } catch (e) {
                console.warn('novaEpicInviterCommitStart', e);
                return false;
            }
        }
        try { window.novaEpicInviterCommitStart = novaEpicInviterCommitStart; } catch (_) {}
        try { window.startDuelGame = startDuelGame; } catch (_) {}

        duelStartButton.addEventListener('click', async () => {
            duelClassId = duelClassSelect.value;
            duelSubjectId = duelSubjectSelect.value;
            duelTopicId = duelTopicSelect.value;

    const classNameSnap = await database.ref(`classes/${selectedStudent.classId}/name`).once('value');
    const championNameVal = await novaReadChampionLeaf('championData/headings/' + duelClassSelect.value + '/name');

    if (!classNameSnap.exists() || championNameVal == null || championNameVal === '') {
        showAlert('Sınıf seçimi ile ilgili bir hata oluştu.');
        return;
    }

    const studentClassName = String(classNameSnap.val() || '');
    const championClassName = String(championNameVal);

    if (studentClassName !== championClassName) {
        showAlert('Sınıf seçimi uyuşmazlığı tespit edildi.');
        return;
    }

            const duelIdsList = await listTopicQuestionIdsExact(duelClassId, duelSubjectId, duelTopicId);
            if (!duelIdsList || duelIdsList.length < 10) {
                showAlert("Bu konuya ait yeterli soru yok veya soru id listesi bulunamadı.");
                return;
            }
            const duelSelectedIds = shuffleArray(duelIdsList.slice()).slice(0, 10);
            var manualDuelUpdate = {
                playAt: firebase.database.ServerValue.TIMESTAMP,
                gameStarted: true
            };
            if (
                typeof window.novaCdnShouldWriteDuelRefsOnly === 'function' &&
                window.novaCdnShouldWriteDuelRefsOnly() &&
                typeof window.novaCdnBuildDuelQuestionSource === 'function'
            ) {
                manualDuelUpdate.questionSource = window.novaCdnBuildDuelQuestionSource(
                    duelClassId,
                    duelSubjectId,
                    duelTopicId,
                    duelSelectedIds
                );
                manualDuelUpdate.questions = null;
            } else {
                const pickedDuelQs = await pickAndLoadTopicQuestionsExact(duelClassId, duelSubjectId, duelTopicId, 10);
                if (!pickedDuelQs || pickedDuelQs.length < 10) {
                    showAlert("Bu konuya ait yeterli soru yok veya soru id listesi bulunamadı.");
                    return;
                }
                manualDuelUpdate.questions = formatDuelQuestionsChosen(pickedDuelQs);
            }
            await currentDuelRef.update(manualDuelUpdate);
        });

        function startDuelGame(data) {
            const activeDuelKey =
                (currentDuelRef && currentDuelRef.key) ||
                window.__novaActiveDuelKey ||
                '';
            if (window.__novaDuelPrepBlocking) {
                window.__novaQueuedDuelStart = data;
                return;
            }
            try {
                if (typeof hideWaitOverlay === 'function') hideWaitOverlay();
                if (typeof window.novaEpicHideAll === 'function') window.novaEpicHideAll();
            } catch (_) {}
            if (activeDuelKey && window.__novaDuelGameActiveKey === activeDuelKey) {
                try {
                    const ge = document.getElementById('duel-game-screen');
                    if (ge && getComputedStyle(ge).display === 'none' && typeof window.novaOpenDuelGameScreen === 'function') {
                        window.__novaDuelGameActiveKey = null;
                    } else {
                        return;
                    }
                } catch (_) {
                    return;
                }
            }
            if (activeDuelKey) window.__novaDuelGameActiveKey = activeDuelKey;
            try {
                if (data && data.playAt) {
                    window.__novaDuelPlayAt = Number(data.playAt) || 0;
                    window.__novaSkipDuelIntro032 = true;
                } else {
                    window.__novaSkipDuelIntro032 = false;
                }
            } catch (_) {}

            const normalizeFrames = async () => {
              try{
                if (!data || !data.inviter || !data.invited) return;
                if (data.inviter.nameFrame && data.invited.nameFrame) return;
                const [invFrameSnap, inFrameSnap] = await Promise.all([
                  database.ref(`classes/${data.inviter.classId}/students/${data.inviter.studentId}/nameFrame`).once('value'),
                  database.ref(`classes/${data.invited.classId}/students/${data.invited.studentId}/nameFrame`).once('value')
                ]);
                data.inviter.nameFrame = invFrameSnap.exists() ? (invFrameSnap.val() || 'default') : (data.inviter.nameFrame || 'default');
                data.invited.nameFrame = inFrameSnap.exists() ? (inFrameSnap.val() || 'default') : (data.invited.nameFrame || 'default');
              }catch(_){}
            };
            // Düello başlarken final ekranı ve skorları resetleyelim
            duelFinalContainer.style.display='none';
            winnerMessage.textContent = '';
            winnerMessage.style.display = '';
            const gameRootReset = document.getElementById('duel-game-screen');
            if (gameRootReset) gameRootReset.classList.remove('ndg-duel-finished');
            const hudReset = document.getElementById('nova-vs-hud');
            if (hudReset) hudReset.style.display = '';
            const metaReset = document.querySelector('#duel-game-screen .ndg-meta-row');
            if (metaReset) metaReset.style.display = '';
            const qReset = document.querySelector('#duel-game-screen .question-container');
            if (qReset) {
              qReset.style.display = '';
              qReset.innerHTML = '';
              qReset.classList.remove('nova-duel-q-panel', 'nova-q-enter');
            }
            const timerReset = document.querySelector('#duel-game-screen .ndg-timer-ring');
            if (timerReset) timerReset.style.display = '';
            duelOptionsContainer.style.display = '';
            const old038 = duelFinalContainer.querySelector('.nova-duel-result');
            if (old038) old038.remove();
            duelFinalContainer.dataset.enhanced = '';
            window.__novaDuelNoConfetti = false;
            if (typeof window.novaDuelHideArenaIntro === 'function') window.novaDuelHideArenaIntro();

            if (typeof window.novaOpenDuelGameScreen === 'function') {
                window.novaOpenDuelGameScreen();
            } else {
                duelSelectionScreen.style.display = 'none';
                duelGameScreen.style.display = 'flex';
            }
            try{ novaInitDuelHud(data); }catch(e){}


            document.getElementById('duel-player-inviter-photo').src = data.inviter.photo ? data.inviter.photo : "https://via.placeholder.com/80";
            document.getElementById('duel-player-invited-photo').src = data.invited.photo ? data.invited.photo : "https://via.placeholder.com/80";
            try{
              applyAvatarFrameToImage(document.getElementById('duel-player-inviter-photo'), data.inviter.avatarFrame || 'default');
              applyAvatarFrameToImage(document.getElementById('duel-player-invited-photo'), data.invited.avatarFrame || 'default');
              applyAvatarFrameToImage(document.getElementById('duel-inviter-photo'), data.inviter.avatarFrame || 'default');
              applyAvatarFrameToImage(document.getElementById('duel-invited-photo'), data.invited.avatarFrame || 'default');
            }catch(_){}
            normalizeFrames().then(() => {
              setNameWithFrame(document.getElementById('duel-player-inviter-name'), data.inviter.name, data.inviter.nameFrame || 'default');
              setNameWithFrame(document.getElementById('duel-player-invited-name'), data.invited.name, data.invited.nameFrame || 'default');
            });

            duelInviterScore = 0;
            duelLiveInviterCorrect = 0;
            duelLiveInvitedCorrect = 0;
            // Nova: populate framed stars under names (in‑game)
            try {
                Promise.all([
                    database.ref(`classes/${data.inviter.classId}/students/${data.inviter.studentId}/gameCup`).once('value'),
                    database.ref(`classes/${data.invited.classId}/students/${data.invited.studentId}/gameCup`).once('value')
                ]).then(function(snaps){
                    var invCountSnap = snaps[0], inCountSnap = snaps[1];
                    var invCount = invCountSnap && invCountSnap.exists() ? Number(invCountSnap.val()) || 0 : 0;
                    var inCount  = inCountSnap && inCountSnap.exists()  ? Number(inCountSnap.val())  || 0 : 0;
                    var invStarsGame = document.getElementById('duel-player-inviter-stars-ingame');
                    var inStarsGame  = document.getElementById('duel-player-invited-stars-ingame');
                    if (invStarsGame) invStarsGame.innerHTML = getStars(invCount);
                    if (inStarsGame)  inStarsGame.innerHTML  = getStars(inCount);
                     var invRankGame = document.getElementById('duel-player-inviter-rank-ingame'); if (invRankGame) invRankGame.innerHTML = getRankHTML(invCount);
                     var inRankGame = document.getElementById('duel-player-invited-rank-ingame'); if (inRankGame) inRankGame.innerHTML = getRankHTML(inCount);
                }).catch(function(e){
                    console.warn('Yıldızlar (in‑game) yüklenemedi:', e);
                });
            } catch(e) {
                console.warn('Yıldızlar (in‑game) yüklenemedi:', e);
            }

            duelInvitedScore = 0;
            inviterCorrectCountEl.textContent = "0";
            invitedCorrectCountEl.textContent = "0";

            duelCurrentQuestionIndex = 0;
            var hasEnoughQuestions = Array.isArray(data.questions) && data.questions.length >= 10;
            var duelQuestionsResolved = hasEnoughQuestions ? data.questions : null;

            function runDuelAfterQuestionsReady() {
                (async function () {
                    const playAt = Number(data.playAt) || Number(window.__novaDuelPlayAt) || 0;
                    const introPad = window.__novaSkipDuelIntro032 ? 700 : NOVA_DUEL_INTRO_MS;
                    if (playAt) await novaWaitUntilMs(playAt + introPad);
                    if (typeof window.novaDuelShowArenaIntro === 'function') {
                        await window.novaDuelShowArenaIntro({
                            title: 'YILDIZ ARENASI',
                            wish: 'Başarılar',
                        });
                    }
                    loadDuelQuestion();
                })();
            }

            if (!hasEnoughQuestions && typeof window.novaCdnResolveDuelQuestions === 'function') {
                (async function () {
                    try {
                        const fromCdn = await window.novaCdnResolveDuelQuestions(
                            data,
                            NOVA_TOPIC_QUESTIONS_TTL_MS
                        );
                        if (fromCdn && fromCdn.length >= 10) {
                            duelQuestions = fromCdn;
                            hasEnoughQuestions = true;
                            runDuelAfterQuestionsReady();
                            return;
                        }
                    } catch (cdnDuelErr) {
                        console.warn('Düello CDN soru çözümleme', cdnDuelErr);
                    }
                    if (!hasEnoughQuestions) {
                        waitForDuelQuestionsPayload();
                    }
                })();
            } else if (hasEnoughQuestions) {
                duelQuestions = duelQuestionsResolved;
                runDuelAfterQuestionsReady();
            } else {
                waitForDuelQuestionsPayload();
            }

            function waitForDuelQuestionsPayload() {
                // gameStarted sinyali sorulardan önce gelebilir; soruları beklerken kullanıcıyı boş ekranda bırakma.
                try {
                    duelOptionsContainer.innerHTML = '';
                    const qBox = document.querySelector('#duel-game-screen .question-container');
                    if (qBox) {
                        qBox.innerHTML =
                          '<div class="nova-tour-wait-auto"><div class="nova-tour-loader"></div><p>Düello soruları hazırlanıyor…</p></div>';
                    }
                } catch (_) {}
                try {
                    if (window.__duelQuestionsWaitUnsub && typeof window.__duelQuestionsWaitUnsub === 'function') {
                        window.__duelQuestionsWaitUnsub();
                    }
                } catch (_) {}
                try {
                    const qRef = currentDuelRef && currentDuelRef.child ? currentDuelRef.child('questions') : null;
                    if (qRef) {
                        const fn = qRef.on('value', async function (qsnap) {
                            const dSnapFull = await currentDuelRef.once('value');
                            const dValFull = dSnapFull.exists() ? (dSnapFull.val() || {}) : {};
                            let qv = qsnap && qsnap.val ? (qsnap.val() || []) : [];
                            if (!Array.isArray(qv) || qv.length < 10) {
                                if (typeof window.novaCdnResolveDuelQuestions === 'function') {
                                    const fromCdn = await window.novaCdnResolveDuelQuestions(
                                        dValFull,
                                        NOVA_TOPIC_QUESTIONS_TTL_MS
                                    );
                                    if (fromCdn && fromCdn.length >= 10) qv = fromCdn;
                                }
                            }
                            if (Array.isArray(qv) && qv.length >= 10) {
                                duelQuestions = qv;
                                try { qRef.off('value', fn); } catch (_) {}
                                window.__duelQuestionsWaitUnsub = null;
                                (async function () {
                                    const playAt = Number(dValFull.playAt) || 0;
                                    const introPad = window.__novaSkipDuelIntro032 ? 700 : NOVA_DUEL_INTRO_MS;
                                    if (playAt) await novaWaitUntilMs(playAt + introPad);
                                    if (typeof window.novaDuelShowArenaIntro === 'function') {
                                        await window.novaDuelShowArenaIntro({
                                            title: 'YILDIZ ARENASI',
                                            wish: 'Başarılar',
                                        });
                                    }
                                    loadDuelQuestion();
                                })();
                            }
                        });
                        window.__duelQuestionsWaitUnsub = function () {
                            try { qRef.off('value', fn); } catch (_) {}
                            window.__duelQuestionsWaitUnsub = null;
                        };
                    }
                } catch (_) {}
            }

            // Düello oyunu başladığında arka plan müziğini çal
            duelMusic.currentTime = 0;
            duelMusic.play().then(() => {
                duelMusic.loop = true;
            }).catch(error => {
                console.error("Müzik çalınamadı:", error);
            });
        }
        function loadDuelQuestion() {
    if (duelCurrentQuestionIndex >= 10) {
        endDuelGame();
        return;
    }
    duelQuestionLocked = false;
    duelLiveInviterCorrect = Number(duelInviterScore || 0);
    duelLiveInvitedCorrect = Number(duelInvitedScore || 0);
    const currentQuestion = duelQuestions[duelCurrentQuestionIndex];
    duelQuestionNumber.textContent = `Soru ${duelCurrentQuestionIndex + 1}/10`;
    const progressPercentage = ((duelCurrentQuestionIndex) / 10) * 100;
    duelProgressBarInner.style.width = `${progressPercentage}%`;

    // Soru konteynerini düello oyun ekranından seçiyoruz
    const questionContainer = document.querySelector('#duel-game-screen .question-container');
    questionContainer.innerHTML = '';
    questionContainer.removeAttribute('data-q-has-image');
    questionContainer.removeAttribute('data-q-has-video');
    questionContainer.classList.add('nova-duel-q-panel');
    questionContainer.classList.remove('nova-q-enter', 'ndg-has-image', 'ndg-has-info-image', 'nova-q-has-image-badge', 'nova-q-has-video');
    void questionContainer.offsetWidth;
    questionContainer.classList.add('nova-q-enter');

    if (currentQuestion.question.startsWith('http')) {
        questionContainer.setAttribute('data-q-has-image', '1');
        if (typeof window.novaUpdateQuestionTypeBadges === 'function') {
            window.novaUpdateQuestionTypeBadges(questionContainer);
        }
        questionContainer.classList.add('ndg-has-image');
        // Eğer soru resim URL'siyse
        const questionImage = document.createElement('img');
        questionImage.src = currentQuestion.question;
        questionImage.className = 'question-image';
        questionImage.style.display = 'block';
        questionImage.alt = "Soru resmi";
        questionImage.decoding = 'async';
        questionContainer.appendChild(questionImage);

        if (currentQuestion.actualQuestion) {
            const questionTextDiv = document.createElement('div');
            questionTextDiv.className = 'question-text q-markup ndg-q-image-caption';
            const mqD = window.NovaQuestionMarkup;
            if (mqD) mqD.fillMarkupElement(questionTextDiv, currentQuestion.actualQuestion);
            else questionTextDiv.textContent = currentQuestion.actualQuestion;
            questionContainer.appendChild(questionTextDiv);
        }
    } else {
        const mqDuel = window.NovaQuestionMarkup;
        const qText = String(
            currentQuestion.actualQuestion || currentQuestion.question || ''
        ).trim();
        const qInfo = String(currentQuestion.info || '').trim();
        if (mqDuel) {
            mqDuel.mountQuestionText(questionContainer, {
                info: qInfo,
                infoItems: currentQuestion.infoItems,
                infoBlocks: currentQuestion.infoBlocks,
                question: qText,
            });
            var hasPreambleImage = mqDuel.isImageUrl(qInfo);
            if (!hasPreambleImage && Array.isArray(currentQuestion.infoBlocks)) {
                hasPreambleImage = currentQuestion.infoBlocks.some(function (b) {
                    return b && b.type === 'image' && b.url;
                });
            }
            if (hasPreambleImage) {
                questionContainer.classList.add('ndg-has-info-image');
            }
        } else {
        const textContainer = document.createElement('div');
        textContainer.className = 'question-text-container';
        const infoValue = String(currentQuestion.info || '').trim();
        const hasInfoImage = /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp)$/i.test(infoValue);
        const isGenericPrompt = /doğru seçeneği işaretleyin\.?/i.test(infoValue);
        const hasInfoText = !!infoValue && !hasInfoImage && !isGenericPrompt;

        if (hasInfoImage) {
            questionContainer.classList.add('ndg-has-info-image');
            const infoImage = document.createElement('img');
            infoImage.src = infoValue;
            infoImage.alt = 'Öncül görseli';
            infoImage.className = 'question-info-image';
            textContainer.appendChild(infoImage);
        } else if (hasInfoText) {
            const infoText = document.createElement('div');
            infoText.className = 'question-info-text';
            infoText.textContent = infoValue;
            textContainer.appendChild(infoText);
        }

        if (hasInfoImage || hasInfoText) {
            const divider = document.createElement('div');
            divider.className = 'question-divider';
            textContainer.appendChild(divider);
        } else {
            textContainer.classList.add('no-preamble');
        }

        const questionText = document.createElement('div');
        questionText.className = 'question-actual-text';
        questionText.textContent = qText;
        textContainer.appendChild(questionText);

        questionContainer.appendChild(textContainer);
        }
    }

    try {
        if (typeof window.onNewQuestionLoaded === 'function') {
            window.onNewQuestionLoaded();
        }
    } catch (_) {}

    duelOptionsContainer.innerHTML = '';
    duelOptionsContainer.classList.remove('nova-duel-reveal', 'nova-duel-waiting-opponent');
    currentQuestion.options.forEach((option, idx) => {
        const button = document.createElement('button');
        button.classList.add('option-button');
        button.classList.add('nova-opt-enter');
        novaFillOptionButton(button, option.text);
        button.dataset.correct = option.correct;
        button.dataset.optionIndex = idx;
        button.addEventListener('click', duelSelectOption);
        duelOptionsContainer.appendChild(button);
    });
    duelOptionsContainer.querySelectorAll('.option-button.nova-opt-enter').forEach((btn, idx)=>{
        btn.style.animationDelay = (idx * 60) + 'ms';
    });

    try {
        questionContainer.querySelectorAll(
            '.question-actual-text, .question-info-text, .question-text'
        ).forEach(function (el) {
            if (/doğru seçeneği işaretleyin\.?/i.test(String(el.textContent || '').trim())) {
                el.classList.add('ndep-hide-generic');
            }
        });
    } catch (_) {}

    try {
        if (typeof window.ndgFitDuelQuestionLayout === 'function') {
            window.ndgFitDuelQuestionLayout(questionContainer);
        } else if (typeof window.ndgFitDuelQuestionMedia === 'function') {
            window.ndgFitDuelQuestionMedia(questionContainer);
        }
    } catch (_) {}

    resetDuelTimer();
    startDuelTimer();
    const qIdx = String(duelCurrentQuestionIndex);
    currentDuelRef.child('responses').child(qIdx).remove().finally(function () {
        listenToResponses();
    });
}



function resetDuelTimer() {
    clearInterval(duelTimer);
    duelTimeLeft = 70;
    duelTimerElement.textContent = duelTimeLeft;
    duelTimerElement.style.color = '#ff0000';
}

function startDuelTimer() {
    duelTimer = setInterval(() => {
        duelTimeLeft--;
        duelTimerElement.textContent = duelTimeLeft;
        if (duelTimeLeft <= 0 && !duelQuestionLocked) {
            clearInterval(duelTimer);
            duelQuestionLocked = true;
            revealDuelAnswerAfterTimeout();
        }
    }, 1000);
}

function novaLockAllDuelOptions(selectedButton) {
    duelOptionsContainer.querySelectorAll('.option-button').forEach(function (b) {
        b.disabled = true;
        b.classList.add('option-locked');
        b.style.pointerEvents = 'none';
        b.setAttribute('aria-disabled', 'true');
        if (selectedButton && b === selectedButton) {
            b.classList.add('option-chosen');
        } else {
            b.classList.add('option-faded');
        }
    });
}

function duelSelectOption(e) {
    if (duelQuestionLocked) return;
    const selectedButton = e.currentTarget;
    if (!selectedButton || !selectedButton.classList.contains('option-button')) return;
    const chosenOptionText = selectedButton.textContent.trim();
    const isCorrect = selectedButton.dataset.correct === 'true';
    const playerId = String(selectedStudent.studentId);

    novaLockAllDuelOptions(selectedButton);
    duelOptionsContainer.classList.add('nova-duel-waiting-opponent');

    currentDuelRef.child('responses').child(String(duelCurrentQuestionIndex)).child(playerId).set({
        chosen: chosenOptionText,
        correct: isCorrect
    });
}

function novaCountDuelAnswersForRow(row) {
    if (!row || typeof row !== 'object') return 0;
    const memo = window.__currentDuelData;
    if (memo && memo.inviter && memo.invited) {
        let n = 0;
        const invId = String(memo.inviter.studentId);
        const inId = String(memo.invited.studentId);
        if (row[invId]) n++;
        if (row[inId]) n++;
        return n;
    }
    return Object.keys(row).length;
}

function listenToResponses() {
    if (typeof window.__novaDuelResponsesUnsub === 'function') {
        try { window.__novaDuelResponsesUnsub(); } catch (_) {}
        window.__novaDuelResponsesUnsub = null;
    }
    if (!currentDuelRef) return;
    const idx = String(duelCurrentQuestionIndex);
    const qRef = currentDuelRef.child('responses').child(idx);

    function processRow(row) {
        if (!row || typeof row !== 'object') return;
        const answeredCount = novaCountDuelAnswersForRow(row);
        if (answeredCount >= 2) {
            try {
                const memo = (window.__currentDuelData && window.__currentDuelData.inviter && window.__currentDuelData.invited)
                  ? window.__currentDuelData
                  : null;
                if (memo) {
                    const inviterId = String(memo.inviter.studentId);
                    const invitedId = String(memo.invited.studentId);
                    let invTotal = duelLiveInviterCorrect;
                    let inTotal = duelLiveInvitedCorrect;
                    if (row[inviterId] && row[inviterId].correct === true) {
                        invTotal += window.NovaDuelPointsPerCorrect || 10;
                    }
                    if (row[invitedId] && row[invitedId].correct === true) {
                        inTotal += window.NovaDuelPointsPerCorrect || 10;
                    }
                    if (invTotal > duelLiveInviterCorrect) {
                        inviterCorrectCountEl.classList.add('score-flash');
                        showScoreIncrementEffect(inviterCorrectCountEl);
                        setTimeout(()=>inviterCorrectCountEl.classList.remove('score-flash'), 600);
                    }
                    if (inTotal > duelLiveInvitedCorrect) {
                        invitedCorrectCountEl.classList.add('score-flash');
                        showScoreIncrementEffect(invitedCorrectCountEl);
                        setTimeout(()=>invitedCorrectCountEl.classList.remove('score-flash'), 600);
                    }
                    const oldInv = duelLiveInviterCorrect;
                    const oldIn = duelLiveInvitedCorrect;
                    duelLiveInviterCorrect = invTotal;
                    duelLiveInvitedCorrect = inTotal;
                    inviterCorrectCountEl.textContent = String(invTotal);
                    invitedCorrectCountEl.textContent = String(inTotal);
                    try{ novaUpdateDuelHud(invTotal, inTotal, oldInv, oldIn); }catch(_){}
                }
            } catch(_){}
        }
        if (answeredCount === 1 && !duelQuestionLocked) {
            const myId = String(selectedStudent.studentId);
            if (row[myId]) {
                novaLockAllDuelOptions(
                    duelOptionsContainer.querySelector('.option-button.option-chosen')
                );
                duelOptionsContainer.classList.add('nova-duel-waiting-opponent');
            }
        }
        if (answeredCount >= 2 && !duelQuestionLocked) {
            duelQuestionLocked = true;
            clearInterval(duelTimer);
            duelOptionsContainer.classList.remove('nova-duel-waiting-opponent');
            revealDuelAnswerAfterTimeout();
        }
    }

    const handler = snap => {
        if (!snap.exists()) return;
        processRow(snap.val() || {});
    };
    qRef.on('value', handler);
    window.__novaDuelResponsesUnsub = function () {
        try { qRef.off('value', handler); } catch (_) {}
    };
    /* İlk snapshot + remove().finally sonrası geç gelen cevaplar için yedek kontrol */
    qRef.once('value').then(function (snap) {
        if (snap.exists()) processRow(snap.val() || {});
    }).catch(function () {});
}

        // Yeni +1 Efekti Fonksiyonu
        function showScoreIncrementEffect(scoreElement) {
            if (!scoreElement) return;
            const plusOne = document.createElement('div');
            plusOne.className = 'score-increment-effect';
            plusOne.textContent = '+' + (window.NovaDuelPointsPerCorrect || 10);
            plusOne.style.cssText = 'position:absolute;color:#22c55e;font-weight:900;font-size:1.1em;pointer-events:none;animation:scorePop .55s ease-out forwards;text-shadow:0 2px 8px rgba(34,197,94,.45);';
            const parent = scoreElement.parentElement || scoreElement;
            const prevPos = parent.style.position;
            if (!prevPos || prevPos === '') parent.style.position = 'relative';
            plusOne.style.left = '50%';
            plusOne.style.top = '-8px';
            plusOne.style.transform = 'translateX(-50%)';
            parent.appendChild(plusOne);
            setTimeout(()=>{ try{ plusOne.remove(); }catch(_){} }, 700);
        }

        function revealDuelAnswerAfterTimeout() {
            setTimeout(() => {
                revealDuelAnswer();
            }, 500);
        }

        function revealDuelAnswer() {
            currentDuelRef.child('responses').child(String(duelCurrentQuestionIndex)).once('value').then(resSnap => {
                const responses = resSnap.val() || {};
                const useDuelData = (ddata) => {
                    if (!ddata || !ddata.inviter || !ddata.invited) return;
                    const invId = ddata.inviter.studentId;
                    const inId = ddata.invited.studentId;

                    novaLockAllDuelOptions(null);
                    duelOptionsContainer.classList.remove('nova-duel-waiting-opponent');
                    duelOptionsContainer.classList.add('nova-duel-reveal');

                    const optionButtons = duelOptionsContainer.querySelectorAll('.option-button');
                    let inviterOldScore = duelInviterScore;
                    let invitedOldScore = duelInvitedScore;
                    const invResp = responses[invId] || null;
                    const inResp = responses[inId] || null;

                    if (invResp && invResp.correct) {
                        duelInviterScore += window.NovaDuelPointsPerCorrect || 10;
                    }
                    if (inResp && inResp.correct) {
                        duelInvitedScore += window.NovaDuelPointsPerCorrect || 10;
                    }

                    if (typeof window.novaDuelFeedbackForAnswer === 'function') {
                        if (invResp) {
                            window.novaDuelFeedbackForAnswer(
                                invId,
                                !!invResp.correct,
                                ddata,
                                invResp.chosen
                            );
                        }
                        if (inResp) {
                            window.novaDuelFeedbackForAnswer(
                                inId,
                                !!inResp.correct,
                                ddata,
                                inResp.chosen
                            );
                        }
                    }

                    optionButtons.forEach(btn => {
                        btn.classList.remove('option-chosen', 'option-faded');
                        if (btn.dataset.correct === 'true') {
                            btn.classList.add('correct');
                        } else {
                            btn.classList.add('wrong');
                        }
                    });

                    const flyDelay =
                        (invResp && invResp.correct) || (inResp && inResp.correct) ? 700 : 0;

                    const applyScoreAndHud = function () {
                        if (duelInviterScore > inviterOldScore) {
                            inviterCorrectCountEl.textContent = duelInviterScore;
                            inviterCorrectCountEl.classList.add('score-flash');
                            setTimeout(
                                () => inviterCorrectCountEl.classList.remove('score-flash'),
                                600
                            );
                        }
                        if (duelInvitedScore > invitedOldScore) {
                            invitedCorrectCountEl.textContent = duelInvitedScore;
                            invitedCorrectCountEl.classList.add('score-flash');
                            setTimeout(
                                () => invitedCorrectCountEl.classList.remove('score-flash'),
                                600
                            );
                        }
                        try {
                            if (typeof window.novaApplyDuelPowerFromRound === 'function') {
                                window.novaApplyDuelPowerFromRound(invResp, inResp);
                            }
                            if (typeof window.novaUpdateDuelHud === 'function') {
                                window.novaUpdateDuelHud(
                                    duelInviterScore,
                                    duelInvitedScore,
                                    inviterOldScore,
                                    invitedOldScore,
                                    invResp,
                                    inResp
                                );
                            }
                        } catch (e) {}
                    };
                    setTimeout(applyScoreAndHud, flyDelay);

                    setTimeout(() => {
                        duelCurrentQuestionIndex++;
                        loadDuelQuestion();
                    }, 2200);
                };
                const memo = (window.__currentDuelData && window.__currentDuelData.inviter && window.__currentDuelData.invited) ? window.__currentDuelData : null;
                if (memo) {
                  useDuelData(memo);
                } else {
                  currentDuelRef.once('value').then(dSnap => useDuelData(dSnap.val() || {}));
                }
            });
        }

function endDuelGame() {
    if (typeof novaDuelTeardownListeners === 'function') novaDuelTeardownListeners();

    window.__novaDuelNoConfetti = true;
    try {
        var oldConf = document.getElementById('duel-confetti');
        if (oldConf) oldConf.remove();
        document.querySelectorAll('body > .confetti').forEach(function (c) {
            try { c.remove(); } catch (_) {}
        });
    } catch (_) {}

    try {
        if (typeof window.novaEpicHideAll === 'function') window.novaEpicHideAll();
    } catch (_) {}
    const gameRoot = document.getElementById('duel-game-screen');
    if (gameRoot) gameRoot.classList.add('ndg-duel-finished');

    const hud = document.getElementById('nova-vs-hud');
    if (hud) hud.style.display = 'none';
    duelQuestionNumber.style.display = 'none';
    const metaRow = document.querySelector('#duel-game-screen .ndg-meta-row');
    if (metaRow) metaRow.style.display = 'none';
    const qBox = document.querySelector('#duel-game-screen .question-container');
    if (qBox) qBox.style.display = 'none';
    const timerBox = document.querySelector('#duel-game-screen .ndg-timer-ring');
    if (timerBox) timerBox.style.display = 'none';
    const playersRow = document.querySelector('#duel-game-screen .players-info-row');
    if (playersRow) playersRow.style.display = 'none';
    duelOptionsContainer.style.display = 'none';
    if (winnerMessage) winnerMessage.style.display = 'none';
    duelFinalContainer.style.display = 'flex';

    const useEndDuelData = async (ddata) => {
        if (!ddata || !ddata.inviter || !ddata.invited) return;
        // Always recalc final scores from DB responses so both winner/loser screens stay consistent.
        try {
          const inviterIdCalc = ddata.inviter.studentId;
          const invitedIdCalc = ddata.invited.studentId;
          const resp = (ddata && ddata.responses) ? ddata.responses : {};
          let invCalc = 0;
          let inCalc = 0;
          Object.keys(resp || {}).forEach((k)=>{
            const row = resp[k] || {};
            const a = row[inviterIdCalc];
            const b = row[invitedIdCalc];
            if (a && a.correct === true) invCalc += window.NovaDuelPointsPerCorrect || 10;
            if (b && b.correct === true) inCalc += window.NovaDuelPointsPerCorrect || 10;
          });
          if (Number.isFinite(invCalc) && Number.isFinite(inCalc)) {
            duelInviterScore = invCalc;
            duelInvitedScore = inCalc;
            if (inviterCorrectCountEl) inviterCorrectCountEl.textContent = String(invCalc);
            if (invitedCorrectCountEl) invitedCorrectCountEl.textContent = String(inCalc);
          }
        } catch(_){}

        let winnerName = '';
        let winnerId = null;
        let loserId = null;
        let winnerClassId = null;
        let loserClassId = null;

        if (duelInviterScore > duelInvitedScore) {
            winnerName = ddata.inviter.name;
            winnerId = ddata.inviter.studentId;
            winnerClassId = ddata.inviter.classId;
            loserId = ddata.invited.studentId;
            loserClassId = ddata.invited.classId;
        } else if (duelInvitedScore > duelInviterScore) {
            winnerName = ddata.invited.name;
            winnerId = ddata.invited.studentId;
            winnerClassId = ddata.invited.classId;
            loserId = ddata.inviter.studentId;
            loserClassId = ddata.inviter.classId;
        }

        // Winner message animation
        const winnerFrame = winnerId
          ? ((winnerId === ddata.inviter.studentId ? ddata.inviter.nameFrame : ddata.invited.nameFrame) || 'default')
          : 'default';
        const finalMessage = winnerId
          ? `👑 ${renderNameWithFrame(winnerName, winnerFrame)} 👑`
          : "🤝 Berabere! 🤝";
        winnerMessage.innerHTML = finalMessage;

        const safe = (v) => String(v || '').replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
        const localId = (selectedStudent && selectedStudent.studentId) ? selectedStudent.studentId : '';
        const localWon = !!(winnerId && localId && winnerId === localId);
        const localLost = !!(winnerId && localId && loserId === localId);
        const winnerAvatarFrame = winnerId
          ? ((winnerId === ddata.inviter.studentId ? ddata.inviter.avatarFrame : ddata.invited.avatarFrame) || 'default')
          : 'default';
        const extraCup = (winnerId && typeof getDuelCupBonusByAvatarFrame === 'function')
          ? Number(getDuelCupBonusByAvatarFrame(winnerAvatarFrame) || 0)
          : 0;
        const winnerCupGain = winnerId ? (6 + Math.max(0, extraCup)) : 0;
        const winnerRows = winnerId
          ? [
              `<li><span>🏆 Kupa</span><b>+${winnerCupGain}</b></li>`,
              `<li><span>💎 Elmas</span><b>+10</b></li>`,
              `<li><span>⚡ Düello Enerjisi</span><b>+15</b></li>`
            ]
          : [`<li><span>🤝 Sonuç</span><b>Berabere</b></li>`];
        const loserRows = winnerId
          ? [
              `<li><span>🏆 Kupa</span><b>-3</b></li>`,
              `<li><span>💎 Elmas</span><b>0</b></li>`,
              `<li><span>⚡ Düello Enerjisi</span><b>0</b></li>`
            ]
          : [`<li><span>🤝 Sonuç</span><b>Berabere</b></li>`];
        duelFinalContainer.classList.remove('nova-duel-final-win','nova-duel-final-lose','nova-duel-final-tie');
        if (!winnerId) duelFinalContainer.classList.add('nova-duel-final-tie');
        else if (localWon) duelFinalContainer.classList.add('nova-duel-final-win');
        else if (localLost) duelFinalContainer.classList.add('nova-duel-final-lose');
        else duelFinalContainer.classList.add('nova-duel-final-tie');

        duelFinalContainer
            .querySelectorAll('.nova-duel-epic-result, .ndg-final-premium, .nova-duel-result')
            .forEach(function (n) {
                try { n.remove(); } catch (_) {}
            });
        const backBtn = document.getElementById('duel-final-back-button');
        if (typeof window.novaBuildDuelFinalPremium === 'function') {
            const premium = window.novaBuildDuelFinalPremium({
                ddata: ddata,
                invScore: duelInviterScore,
                inScore: duelInvitedScore,
                winnerId: winnerId,
                localWon: localWon,
                localLost: localLost,
            });
            if (backBtn) duelFinalContainer.insertBefore(premium, backBtn);
            else duelFinalContainer.appendChild(premium);
        }
        if (backBtn) {
            backBtn.style.display = 'block';
            backBtn.textContent = 'Ana Menü';
        }
        duelFinalContainer.dataset.enhanced = 'premium';

        function animateNumber(el, from, to, opts){
          const options = opts || {};
          const dur = Number(options.duration || 850);
          const suffix = String(options.suffix || '');
          const forceSign = !!options.forceSign;
          const fmt = (v)=>{
            const n = Math.round(v);
            if (forceSign) {
              if (n > 0) return `+${n}${suffix}`;
              if (n < 0) return `${n}${suffix}`;
              return `0${suffix}`;
            }
            return `${n}${suffix}`;
          };
          const t0 = performance.now();
          const fromN = Number(from || 0);
          const toN = Number(to || 0);
          const step = (ts)=>{
            const p = Math.min(1, (ts - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            const cur = fromN + (toN - fromN) * eased;
            el.textContent = fmt(cur);
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
        function renderLocalDelta(){
          const host = document.getElementById('nova_duel_local_delta');
          if (!host) return;
          const cupDelta = localWon ? Number(winnerCupGain || 6) : (localLost ? -3 : 0);
          const diaDelta = localWon ? 10 : 0;
          const crDelta = localWon ? 15 : 0;
          host.innerHTML = `
            <div class="nova-duel-report-head ${localWon ? 'win' : (localLost ? 'lose' : 'tie')}">
              ${localWon ? '🏅 ÖDÜL RAPORU' : (localLost ? '🎯 KAYIP RAPORU' : '🤝 MAÇ RAPORU')}
            </div>
            <div class="nova-duel-report-grid">
              <article class="nova-duel-report-tile ${cupDelta >= 0 ? 'plus' : 'minus'}">
                <div class="icon">🏆</div>
                <div class="label">Kupa</div>
                <div class="value" id="nova_duel_delta_cup">0</div>
              </article>
              ${localWon ? `
              <article class="nova-duel-report-tile plus">
                <div class="icon">💎</div>
                <div class="label">Elmas</div>
                <div class="value" id="nova_duel_delta_dia">0</div>
              </article>
              <article class="nova-duel-report-tile plus">
                <div class="icon">⚡</div>
                <div class="label">Düello Enerjisi</div>
                <div class="value" id="nova_duel_delta_cr">0</div>
              </article>` : ''}
              ${(!localWon && !localLost) ? `
              <article class="nova-duel-report-tile tie">
                <div class="icon">🤝</div>
                <div class="label">Durum</div>
                <div class="value">Berabere</div>
              </article>` : ''}
            </div>
          `;

          const cupEl = document.getElementById('nova_duel_delta_cup');
          if (cupEl) {
            animateNumber(cupEl, 0, cupDelta, { duration: 900, forceSign: true });
          }
          if (localWon) {
            const diaEl = document.getElementById('nova_duel_delta_dia');
            const crEl = document.getElementById('nova_duel_delta_cr');
            if (diaEl) {
              animateNumber(diaEl, 0, diaDelta, { duration: 1000, forceSign: true });
            }
            if (crEl) {
              animateNumber(crEl, 0, crDelta, { duration: 1100, forceSign: true });
            }
          }
        }

        
            // Nova: Apply themed winner/loser visuals
            try{
              if (winnerId && duelInviterScore !== duelInvitedScore){
                const outcome = (duelInviterScore>duelInvitedScore)?'inviterWin':'invitedWin';
                window.novaDecorateDuelResult && window.novaDecorateDuelResult(outcome);
              } else {
                window.novaDecorateDuelResult && window.novaDecorateDuelResult('tie');
              }
            }catch(e){ console.warn(e); }

      // Update scores
// Update scores
if (winnerId && loserId) {
  try {
    // Topic performance log for current student (always record duel result summary)
    try{
      const meId = (selectedStudent && selectedStudent.studentId) ? selectedStudent.studentId : null;
      const inviterId = ddata && ddata.inviter ? ddata.inviter.studentId : null;
      const invitedId = ddata && ddata.invited ? ddata.invited.studentId : null;
      if(meId && (meId === inviterId || meId === invitedId) && typeof window.novaLogTopicPerf === 'function'){
        const myCorrect = (meId === inviterId) ? Number(duelInviterScore||0) : Number(duelInvitedScore||0);
        const totalAsked = 10;
        let topicName = null;
        try{
          const sel = document.getElementById('duel-topic-select');
          const txt = (sel && sel.selectedOptions && sel.selectedOptions[0]) ? String(sel.selectedOptions[0].textContent || '').trim() : '';
          if (txt && txt !== 'Seçiniz' && txt !== 'Düello Konusu:') topicName = txt;
        }catch(_){}
        if(!topicName){
          // Prefer topic id from duel selections; admin panel resolves this id to real topic name.
          topicName = (ddata && ddata.selections && ddata.selections.topic) || (ddata && ddata.topicId) || (ddata && ddata.topicName) || (ddata && ddata.topic) || 'Düello Konusu';
        }
        window.novaLogTopicPerf(topicName, totalAsked, myCorrect);
      }
    }catch(e){ console.warn('duel topic perf fallback log fail', e); }

    await updateDuelScore('GAME_END', {
      winnerId,
      winnerClassId,
      loserId,
      loserClassId,
      winnerAvatarFrame: winnerId === (ddata && ddata.inviter && ddata.inviter.studentId)
        ? ((ddata && ddata.inviter && ddata.inviter.avatarFrame) || 'default')
        : ((ddata && ddata.invited && ddata.invited.avatarFrame) || 'default')
    });

    renderLocalDelta();

    // Puanları görsel olarak güncelle (kupa + düello enerjisi)
    if (selectedStudent.studentId === winnerId || selectedStudent.studentId === loserId) {
      if (typeof window.fetchAndDisplayGameCup === 'function') window.fetchAndDisplayGameCup();
      // Sonuc ekrani acikken ana ekrani zorla gostermeyelim.
      // onMainScreenLoad -> novaEnsureLoggedInUi zinciri, bazi cihazlarda
      // sonucu acarken main-screen'in solda gorunmesine neden olabiliyor.
    }
  } catch (error) {
    console.error("Puan güncelleme hatası:", error);
    await showAlert('❌ Puan güncellenirken bir hata oluştu!');
  }
}

        // Handle music
        duelMusic.pause();
        duelMusic.currentTime = 0;

        if (winnerId || finalMessage.includes("Berabere")) {
            winnerMusic.currentTime = 0;
            winnerMusic.play().catch(error => {
                console.error("Kazanan müziği çalınamadı:", error);
            });
        }

        duelEnded = true;
    };
    (async function () {
        let ddata = (window.__currentDuelData && window.__currentDuelData.inviter && window.__currentDuelData.invited)
            ? Object.assign({}, window.__currentDuelData)
            : null;
        if (currentDuelRef) {
            try {
                const parts = await Promise.all([
                    currentDuelRef.child('inviter').once('value'),
                    currentDuelRef.child('invited').once('value'),
                    currentDuelRef.child('responses').once('value')
                ]);
                ddata = ddata || {};
                if (parts[0].exists()) ddata.inviter = parts[0].val();
                if (parts[1].exists()) ddata.invited = parts[1].val();
                ddata.responses = parts[2].exists() ? (parts[2].val() || {}) : {};
            } catch (_) {}
        }
        if (ddata && ddata.inviter && ddata.invited) {
            useEndDuelData(ddata);
        }
    })();
}

        // Fetch and display gameCup — tanım üstte (fetchAndDisplayGameCup)

        const RANKING_CACHE_KEY = 'rankingCacheV4';
        const RANKING_SUMMARY_ROOT = 'seasonRanking';
        /** Özet varsa tek okuma; yoksa eski.html ile aynı şekilde tek classes okuması (günde bir kez önbellek). */
        const RANKING_CACHE_VERSION = 9;
        const RANKING_PLAYER_LIMIT = 25;
        const RANKING_NET_DEBOUNCE_MS = 600;
        let __rankingLoadInFlight = false;
        let __rankingLastLoadTs = 0;
        let __rankingLastRenderSig = '';
        function getLocalDayKey() {
            const d = new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }
        function normalizeRankingPlayer(raw, fallbackId){
            const it = raw || {};
            const id = String(it.id || it.studentId || it.userId || it.uid || fallbackId || '');
            if (!id) return null;
            function parseHeroOwnership(val) {
                if (!val) return { owned: false, level: 0 };
                if (val === true) return { owned: true, level: 1 };
                if (typeof val === 'object') {
                    return { owned: true, level: Math.max(1, Number(val.level) || 1) };
                }
                return { owned: !!val, level: val ? 1 : 0 };
            }
            let heroId = String(it.battleHero || it.heroId || it.hero || '').trim();
            try{
                if (!heroId && it.purchasedBattleHeroes && typeof it.purchasedBattleHeroes === 'object') {
                    const keys = Object.keys(it.purchasedBattleHeroes).filter(k => !!k && k !== 'null' && k !== 'undefined');
                    if (keys.length) heroId = String(keys[0]).trim();
                }
            }catch(_){}
            let heroLevel = 0;
            try {
                if (it.heroLevel != null) heroLevel = Number(it.heroLevel) || 0;
                if (!heroLevel && it.purchasedBattleHeroes && heroId) {
                    heroLevel = parseHeroOwnership(it.purchasedBattleHeroes[heroId]).level || 0;
                }
            } catch (_) {}
            const resolvedNameFrame = (it.nameFrame || 'default');
            const rawAvatarFrame = (it.avatarFrame || 'default');
            const resolvedAvatarFrame = (resolvedNameFrame === 'deneme_champion') ? 'deneme_champion' : rawAvatarFrame;
            return {
                id: id,
                name: String(it.name || it.studentName || 'Anonim'),
                nameFrame: resolvedNameFrame,
                avatarFrame: resolvedAvatarFrame,
                className: String(it.className || it.class || ''),
                gameCup: Number(it.gameCup || it.cup || 0),
                matchCount: Number(it.matchCount || it.duelCredits || 0),
                heroId: heroId,
                heroLevel: Math.max(0, Math.min(4, Number(heroLevel) || 0)),
                photo: String(it.photo || 'https://via.placeholder.com/50')
            };
        }
        function rankingPlayersFromTopRaw(topRaw) {
            let players = [];
            if (Array.isArray(topRaw)) {
                players = topRaw.map((item, idx) => normalizeRankingPlayer(item, item && (item.id || item.studentId || item.userId) ? '' : ('idx_' + idx))).filter(Boolean);
            } else if (topRaw && typeof topRaw === 'object') {
                players = Object.entries(topRaw).map(([k, v]) => normalizeRankingPlayer(v, k)).filter(Boolean);
            }
            players.sort((a, b) => b.gameCup - a.gameCup);
            return players;
        }
        function parseSeasonRankingRoot(rootVal) {
            let topRaw = null;
            let meta = {};
            if (rootVal == null) return { topRaw: null, meta };
            if (Array.isArray(rootVal)) return { topRaw: rootVal, meta: {} };
            if (typeof rootVal === 'object') {
                topRaw = rootVal.topPlayers != null ? rootVal.topPlayers
                    : (rootVal.players != null ? rootVal.players : null);
                meta = rootVal.meta && typeof rootVal.meta === 'object' ? rootVal.meta : {};
                if (topRaw == null) {
                    topRaw = rootVal.list || rootVal.leaderboard || rootVal.rows || rootVal.data || rootVal.items || null;
                }
            }
            return { topRaw, meta };
        }
        function aggregateRankingFromClasses(classesVal, sid) {
            const players = [];
            if (!classesVal || typeof classesVal !== 'object') {
                return { topPlayers: [], totalPlayers: 0, userRank: 0, userTrophy: 0 };
            }
            function parseHeroOwnership(val) {
                if (!val) return { owned: false, level: 0 };
                if (val === true) return { owned: true, level: 1 };
                if (typeof val === 'object') return { owned: true, level: Math.max(1, Number(val.level) || 1) };
                return { owned: !!val, level: val ? 1 : 0 };
            }
            for (const [classId, classSnap] of Object.entries(classesVal)) {
                if (!classSnap || !classSnap.students) continue;
                const className = classSnap.name || '';
                for (const [studentId, student] of Object.entries(classSnap.students)) {
                    const resolvedNameFrame = (student && student.nameFrame) || 'default';
                    const rawAvatarFrame = (student && student.avatarFrame) || 'default';
                    const resolvedAvatarFrame = (resolvedNameFrame === 'deneme_champion')
                        ? 'deneme_champion'
                        : rawAvatarFrame;
                    let heroId = student && student.battleHero ? String(student.battleHero).trim() : '';
                    try{
                        if (!heroId && student && student.purchasedBattleHeroes && typeof student.purchasedBattleHeroes === 'object') {
                            const keys = Object.keys(student.purchasedBattleHeroes).filter(k => !!k && k !== 'null' && k !== 'undefined');
                            if (keys.length) heroId = String(keys[0]).trim();
                        }
                    }catch(_){}
                    let heroLevel = 0;
                    try {
                        if (student && student.heroLevel != null) heroLevel = Number(student.heroLevel) || 0;
                        if (!heroLevel && student && student.purchasedBattleHeroes && heroId) {
                            heroLevel = parseHeroOwnership(student.purchasedBattleHeroes[heroId]).level || 0;
                        }
                    } catch (_) {}
                    players.push({
                        id: String(studentId),
                        classId: String(classId),
                        name: (student && student.name) || 'Anonim',
                        nameFrame: resolvedNameFrame,
                        avatarFrame: resolvedAvatarFrame,
                        className: className,
                        gameCup: (student && student.gameCup) || 0,
                        matchCount: (student && student.duelCredits) || 0,
                        heroId: heroId,
                        heroLevel: Math.max(0, Math.min(4, Number(heroLevel) || 0)),
                        photo: (student && student.photo) || 'https://via.placeholder.com/50'
                    });
                }
            }
            players.sort((a, b) => b.gameCup - a.gameCup);
            const totalPlayers = players.length;
            const userRank = sid ? (players.findIndex(p => p.id === sid) + 1) : 0;
            let userTrophy = 0;
            if (sid) {
                const me = players.find(p => p.id === sid);
                if (me) userTrophy = Number(me.gameCup) || 0;
            }
            const topPlayers = players.slice(0, RANKING_PLAYER_LIMIT);
            return { topPlayers, totalPlayers, userRank, userTrophy };
        }
        function rankingReadCacheForToday(todayKey) {
            try {
                const raw = localStorage.getItem(RANKING_CACHE_KEY);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                if (!parsed || parsed.v !== RANKING_CACHE_VERSION || parsed.dayKey !== todayKey) return null;
                if (String(parsed.classId || '') !== String((selectedStudent && selectedStudent.classId) || '')) return null;
                if (!Array.isArray(parsed.topPlayers) || !parsed.topPlayers.length) return null;
                return parsed;
            } catch (e) {
                return null;
            }
        }

        async function loadRanking() {
            if (__rankingLoadInFlight) return;
            const todayKey = getLocalDayKey();
            const sid = (typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId)
                ? String(selectedStudent.studentId)
                : '';

            // Nova: Sezon sıralaması her açılışta güncellensin (günlük cache kapalı)
            const cached = null;

            const now = Date.now();
            if ((now - __rankingLastLoadTs) < RANKING_NET_DEBOUNCE_MS) return;
            __rankingLastLoadTs = now;
            __rankingLoadInFlight = true;
            rankingTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:16px;">Yükleniyor…</td></tr>';

            try {
                const classId = String((selectedStudent && selectedStudent.classId) || '');
                try{
                    var pill2 = document.getElementById('rankingClassPill');
                    if (pill2) pill2.textContent = String((selectedStudent && (selectedStudent.className || '')) || '');
                }catch(_){}
                let topPlayers = [];
                let totalPlayers = 0;
                let userRank = 0;
                let userTrophyCount = 0;
                if (classId) {
                    const classSnap = await database.ref('classes/' + classId).once('value');
                    const classVal = classSnap && classSnap.val ? classSnap.val() : null;
                    const scoped = {};
                    if (classVal) scoped[classId] = classVal;
                    const agg = aggregateRankingFromClasses(scoped, sid);
                    topPlayers = agg.topPlayers;
                    totalPlayers = agg.totalPlayers;
                    userRank = agg.userRank;
                    userTrophyCount = agg.userTrophy;
                }

                if (!topPlayers.length) {
                    rankingTableBody.innerHTML = '<tr><td colspan="6">Henüz sıralama yapılmadı.</td></tr>';
                    updateUserStats(0, 0, 0);
                    __rankingLoadInFlight = false;
                    return;
                }

                // Nova: cache yazma kapalı

                displayRankingData(topPlayers, {
                    userRank: userRank,
                    totalPlayers: totalPlayers,
                    userTrophy: userTrophyCount
                });
            } catch (error) {
                console.error('Sıralama yüklenirken hata:', error);
                rankingTableBody.innerHTML = '<tr><td colspan="6">Sıralama yüklenirken bir hata oluştu.</td></tr>';
            }
            __rankingLoadInFlight = false;
        }

        let __rankingRenderSeq = 0;
        async function appendRankingRowsProgressive(tbody, rows, renderSeq){
            if (!tbody || !Array.isArray(rows) || !rows.length) return;
            const isLow = !!((navigator && navigator.deviceMemory && navigator.deviceMemory <= 4) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
            const first = isLow ? 8 : 12;
            const chunk = isLow ? 5 : 8;
            let i = 0;
            const push = (n) => {
                const frag = document.createDocumentFragment();
                const end = Math.min(rows.length, i + n);
                for (; i < end; i++) frag.appendChild(rows[i]);
                tbody.appendChild(frag);
            };
            push(first);
            while (i < rows.length) {
                await new Promise((resolve) => requestAnimationFrame(resolve));
                if (renderSeq !== __rankingRenderSeq) return;
                push(chunk);
            }
        }


        function renderRankingPlayerName(player) {
            const name = (player && player.name) ? String(player.name) : 'Oyuncu';
            const frameId = (player && player.nameFrame) ? String(player.nameFrame) : 'default';
            const esc =
              typeof escapeHtml === 'function'
                ? escapeHtml
                : function (x) {
                    return String(x)
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;');
                  };
            if (typeof renderNameWithFrame === 'function' && frameId && frameId !== 'default') {
                const hasMap =
                  typeof NAME_FRAME_MAP !== 'undefined' &&
                  NAME_FRAME_MAP &&
                  NAME_FRAME_MAP[frameId];
                if (hasMap || frameId === 'deneme_champion') {
                    return renderNameWithFrame(name, frameId);
                }
            }
            return '<span class="ranking-player-name">' + esc(name) + '</span>';
        }

        function buildNsrNameCell(player) {
            return '<div class="nsr-name">' + renderRankingPlayerName(player) + '</div>';
        }

        function buildNsrLeagueCell(player) {
            try {
                if (typeof getRankHTML === 'function') {
                    return '<div class="nsr-lig-wrap">' + getRankHTML(Number((player && player.gameCup) || 0), true) + '</div>';
                }
            } catch (_) {}
            return '<div class="nsr-lig-wrap"></div>';
        }

        function nsrEpicDragonThemeKey(heroId) {
            if (heroId === 'buz_ejder') return 'buz';
            if (heroId === 'alev_ejder') return 'alev';
            if (heroId === 'gece_ejder') return 'gece';
            return '';
        }

        function buildNsrHeroCell(player) {
            var heroId = (player && player.heroId) ? String(player.heroId).trim() : '';
            var lvl = Math.max(0, Math.min(4, Number(player && player.heroLevel) || 0));
            var starsBlock;
            var isEpic = typeof window.novaIsEpicDragonHero === 'function' && window.novaIsEpicDragonHero(heroId);
            if (isEpic) {
                starsBlock = '<div class="nsr-hero-stars nsr-hero-stars--epic"><div class="nsr-hero-epic-slot" data-epic-dragon-slot="1" data-hero-id="' + heroId + '"></div></div>';
            } else {
                var stars = '';
                for (var i = 1; i <= 4; i++) {
                    stars += '<span class="nsr-star' + (i <= lvl ? ' is-on' : '') + '" aria-hidden="true">★</span>';
                }
                starsBlock = '<div class="nsr-hero-stars">' + stars + '</div>';
            }
            var safeId = heroId ? heroId.replace(/"/g, '') : '';
            if (isEpic) {
                var theme = nsrEpicDragonThemeKey(heroId);
                return (
                    '<div class="nsr-hero-wrap nsr-hero-wrap--epic nsr-hero-wrap--' + theme + '">' +
                    '<div class="nsr-hero-frame nsr-hero-frame--' + theme + '">' +
                    '<div class="nsr-hero-pic nsr-hero-pic--epic" data-hero-id="' + safeId + '"></div>' +
                    '</div>' +
                    starsBlock +
                    '</div>'
                );
            }
            return (
                '<div class="nsr-hero-wrap">' +
                '<div class="nsr-hero-pic" data-hero-id="' + safeId + '"></div>' +
                starsBlock +
                '</div>'
            );
        }

        function mountNsrRankingHeroes(root) {
            if (!root) return;
            var pics = root.querySelectorAll('.nsr-hero-pic[data-hero-id]');
            pics.forEach(function (el) {
                var id = (el.getAttribute('data-hero-id') || '').trim();
                if (!id) {
                    el.innerHTML = '<span class="nsr-hero-fallback">—</span>';
                    return;
                }
                try {
                    if (typeof window.novaIsEpicDragonHero === 'function' && window.novaIsEpicDragonHero(id)) {
                        if (typeof window.novaEpicDragonMountSprite === 'function') {
                            window.novaEpicDragonMountSprite(el, id, { profile: 'store', scale: 1.08 });
                            return;
                        }
                    }
                    if (typeof window.novaMountHeroInto === 'function') {
                        window.novaMountHeroInto(el, id);
                        if (el.querySelector('svg') || el.querySelector('canvas')) return;
                    }
                    if (typeof window.novaBuildHeroSvgHtml === 'function') {
                        var html = window.novaBuildHeroSvgHtml(id);
                        if (html) { el.innerHTML = html; return; }
                    }
                } catch (_) {}
                el.innerHTML = '<span class="nsr-hero-fallback">?</span>';
            });
            if (typeof window.novaEpicDragonMountBadge === 'function') {
                root.querySelectorAll('[data-epic-dragon-slot]').forEach(function (slot) {
                    var hid = slot.getAttribute('data-hero-id') || 'buz_ejder';
                    window.novaEpicDragonMountBadge(slot, hid, 'rank');
                });
            }
        }

        async function displayRankingData(players, meta) {
            const renderSeq = ++__rankingRenderSeq;
            const userRank = meta && meta.userRank != null ? meta.userRank : 0;
            const totalPlayers = meta && meta.totalPlayers != null ? meta.totalPlayers : (players && players.length) || 0;
            const userTrophy = meta && meta.userTrophy != null ? meta.userTrophy : 0;

            const list = (players || []).slice(0, RANKING_PLAYER_LIMIT);
            const myId = (typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId)
                ? String(selectedStudent.studentId)
                : '';
            const sig = JSON.stringify({
              ids: list.map(p => `${p.id}:${p.gameCup}:${p.heroId || ''}:${p.heroLevel || 0}:${p.avatarFrame || 'default'}`),
              userRank, totalPlayers, userTrophy
            });
            if (sig === __rankingLastRenderSig) return;
            __rankingLastRenderSig = sig;

            const rows = [];
            const escAttr = function (s) {
                return String(s == null ? '' : s)
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/</g, '&lt;');
            };
            list.forEach((player, index) => {
                const effectiveAvatarFrame = ((player && player.nameFrame) === 'deneme_champion')
                  ? 'deneme_champion'
                  : ((player && player.avatarFrame) || 'default');
                const tr = document.createElement('tr');
                if (index < 3) tr.classList.add('top-' + (index + 1));
                if (myId && player.id === myId) tr.classList.add('current-user-row');

                tr.innerHTML = `
           <td class="nsr-cell nsr-cell--rank">${index + 1}</td>
           <td class="nsr-cell nsr-cell--photo"><img src="${player.photo}" alt="" class="ranking-player-photo nova-player-card-trigger" loading="lazy" decoding="async" width="40" height="40"
               data-class-id="${escAttr(String(player.classId || ''))}" data-student-id="${escAttr(String(player.id || ''))}"
               data-player-name="${escAttr(String(player.name || ''))}" data-name-frame="${escAttr(String(player.nameFrame || 'default'))}"
               data-avatar-frame="${escAttr(String(effectiveAvatarFrame))}" data-game-cup="${Number(player.gameCup) || 0}"
               data-hero-id="${escAttr(String(player.heroId || ''))}" data-hero-level="${Number(player.heroLevel) || 0}"
               role="button" tabindex="0" aria-label="Oyuncu kartını aç"
               onerror="this.src='https://via.placeholder.com/50'"></td>
           <td class="nsr-cell nsr-cell--name">${buildNsrNameCell(player)}</td>
           <td class="nsr-cell nsr-cell--lig">${buildNsrLeagueCell(player)}</td>
           <td class="nsr-cell nsr-cell--hero">${buildNsrHeroCell(player)}</td>
           <td class="nsr-cell nsr-cell--cup"><span class="nsr-cup"><span aria-hidden="true">🏆</span><span>${player.gameCup}</span></span></td>`;
                const photoEl = tr.querySelector('.ranking-player-photo');
                if (photoEl) {
                  try { applyAvatarFrameToImage(photoEl, effectiveAvatarFrame); } catch(_){}
                }
                rows.push(tr);
            });

            rankingTableBody.innerHTML = '';
            await appendRankingRowsProgressive(rankingTableBody, rows, renderSeq);
            if (renderSeq !== __rankingRenderSeq) return;
            mountNsrRankingHeroes(rankingTableBody);
            updateUserStats(userRank, totalPlayers, userTrophy);
            try {
              document.dispatchEvent(new CustomEvent('nova:ranking-rendered'));
            } catch (_) {}
        }

        function updateUserStats(rank, total, trophies) {
            const rankValue = document.querySelector('#userRankNumber .rank-value');
            const totalValue = document.querySelector('#totalPlayers .total-value');
            const trophyValue = document.querySelector('#userTrophyCount');
            if (rankValue) rankValue.textContent = rank > 0 ? '#' + rank : '-';
            if (totalValue) totalValue.textContent = total;
            if (trophyValue) trophyValue.textContent = trophies;
        }

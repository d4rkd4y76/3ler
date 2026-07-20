/**
 * CDN-first okuma: RTDB yolunu Bunny'deki ayna JSON ile eşleştirir.
 * İçerik yoksa undefined → mevcut readValCached / RTDB devreye girer.
 */
(function (global) {
  'use strict';

  var MEM = {};
  var STORE_MANIFEST_MEM = { ts: 0, val: null };
  var STORE_MANIFEST_TTL = 12 * 60 * 60 * 1000;

  function now() {
    return Date.now();
  }

  function memGet(key, ttlMs) {
    var m = MEM[key];
    if (m && now() - m.ts < ttlMs) return m.val;
    return undefined;
  }

  function memSet(key, val, ttlMs) {
    MEM[key] = { ts: now(), val: val };
    try {
      sessionStorage.setItem(
        'nova_cdn_' + key,
        JSON.stringify({ ts: now(), val: val, ttl: ttlMs })
      );
    } catch (_) {}
  }

  function sessionGet(key, ttlMs) {
    try {
      var raw = sessionStorage.getItem('nova_cdn_' + key);
      if (!raw) return undefined;
      var o = JSON.parse(raw);
      if (o && now() - Number(o.ts || 0) < ttlMs) return o.val;
    } catch (_) {}
    return undefined;
  }

  async function fetchJsonUrl(url) {
    var res = await fetch(url, { cache: 'default', credentials: 'omit' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('CDN ' + res.status);
    var text = await res.text();
    if (!text || text === 'null') return null;
    return JSON.parse(text);
  }

  async function novaCdnFetchByPath(path, ttlMs) {
    if (typeof global.novaCdnIsEnabled !== 'function' || !global.novaCdnIsEnabled()) {
      return undefined;
    }
    if (typeof global.novaCdnRtdbPathToUrl !== 'function') return undefined;
    var url = global.novaCdnRtdbPathToUrl(path);
    if (!url) return undefined;

    var ttl = Number(ttlMs) > 0 ? Number(ttlMs) : 5 * 60 * 1000;
    var cacheKey = 'p:' + path + ':v' + (global.NOVA_CDN && global.NOVA_CDN.version);
    var hit = memGet(cacheKey, ttl);
    if (hit !== undefined) return hit;
    hit = sessionGet(cacheKey, ttl);
    if (hit !== undefined) {
      memSet(cacheKey, hit, ttl);
      return hit;
    }

    try {
      var val = await fetchJsonUrl(url);
      if (val === null) return undefined;
      memSet(cacheKey, val, ttl);
      return val;
    } catch (e) {
      console.warn('[nova-cdn] miss', path, e && e.message ? e.message : e);
      return undefined;
    }
  }

  async function novaCdnFetchStoreManifest() {
    if (typeof global.novaCdnStoreManifestUrl !== 'function') return null;
    var url = global.novaCdnStoreManifestUrl();
    if (!url) return null;
    var ttl = STORE_MANIFEST_TTL;
    if (STORE_MANIFEST_MEM.val && now() - STORE_MANIFEST_MEM.ts < ttl) {
      return STORE_MANIFEST_MEM.val;
    }
    try {
      var val = await fetchJsonUrl(url);
      if (!val) return null;
      STORE_MANIFEST_MEM = { ts: now(), val: val };
      return val;
    } catch (e) {
      console.warn('[nova-cdn] store manifest', e);
      return null;
    }
  }

  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length; i > 0; ) {
      var j = Math.floor(Math.random() * i);
      i--;
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function formatDuelFromRaw(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var qField = raw.question;
    var infoItems =
      qField && typeof qField === 'object' && Array.isArray(qField.infoItems)
        ? qField.infoItems
        : null;
    var infoBlocks =
      qField && typeof qField === 'object' && Array.isArray(qField.infoBlocks)
        ? qField.infoBlocks
        : null;
    var questionText =
      qField && typeof qField === 'object' && qField.text
        ? qField.text
        : qField;
    return {
      info: qField && typeof qField === 'object' && qField.info ? qField.info : '',
      infoItems: infoItems,
      infoBlocks: infoBlocks,
      actualQuestion: questionText,
      question: questionText,
      correct: raw.correct,
      wrong1: raw.wrong1,
      wrong2: raw.wrong2,
      explanation: raw.explanation || raw.aciklama || raw['açıklama'] || ''
    };
  }

  function formatDuelQuestionsChosen(picked) {
    return picked.slice(0, 10).map(function (q) {
      var infoText = String(q.info || '').trim();
      var infoItems = q.infoItems || null;
      var infoBlocks = q.infoBlocks || null;
      var questionText = '';
      if (typeof q.question === 'object' && q.question !== null) {
        if (!infoText) infoText = String(q.question.info || '').trim();
        questionText = String(q.question.text || q.actualQuestion || '').trim();
        if (!infoItems && Array.isArray(q.question.infoItems)) infoItems = q.question.infoItems;
        if (!infoBlocks && Array.isArray(q.question.infoBlocks)) infoBlocks = q.question.infoBlocks;
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

  async function novaCdnLoadTopicQuestions(classId, subjectId, topicId, ids, ttlMs) {
    var base =
      'championData/headings/' +
      classId +
      '/lessons/' +
      subjectId +
      '/topics/' +
      topicId +
      '/questions/';
    var raws = await Promise.all(
      ids.map(function (qid) {
        return novaCdnFetchByPath(base + qid, ttlMs);
      })
    );
    var out = [];
    for (var i = 0; i < raws.length; i++) {
      var fq = formatDuelFromRaw(raws[i]);
      if (!fq) return null;
      out.push(fq);
    }
    return out;
  }

  /**
   * Düello: questionSource (CDN) veya legacy questions dizisi.
   */
  async function novaCdnResolveDuelQuestions(data, ttlMs) {
    if (!data || typeof data !== 'object') return null;
    if (Array.isArray(data.questions) && data.questions.length >= 10) {
      return data.questions;
    }
    var src = data.questionSource;
    if (!src || src.kind !== 'cdn') return null;
    var ids = Array.isArray(src.questionIds) ? src.questionIds.map(String) : [];
    if (ids.length < 10) return null;
    var picked = await novaCdnLoadTopicQuestions(
      src.classId,
      src.subjectId,
      src.topicId,
      ids.slice(0, 10),
      ttlMs || 5 * 60 * 1000
    );
    if (!picked || picked.length < 10) return null;
    return formatDuelQuestionsChosen(picked);
  }

  function novaCdnBuildDuelQuestionSource(classId, subjectId, topicId, questionIds) {
    return {
      kind: 'cdn',
      version: (global.NOVA_CDN && global.NOVA_CDN.version) || 1,
      classId: String(classId),
      subjectId: String(subjectId),
      topicId: String(topicId),
      questionIds: questionIds.slice(0, 10).map(String)
    };
  }

  function novaCdnShouldWriteDuelRefsOnly() {
    return (
      typeof global.novaCdnIsEnabled === 'function' &&
      global.novaCdnIsEnabled() &&
      global.NOVA_CDN &&
      global.NOVA_CDN.duelRefsOnly !== false
    );
  }

  global.novaCdnFetchByPath = novaCdnFetchByPath;
  global.novaCdnFetchStoreManifest = novaCdnFetchStoreManifest;
  global.novaCdnResolveDuelQuestions = novaCdnResolveDuelQuestions;
  global.novaCdnBuildDuelQuestionSource = novaCdnBuildDuelQuestionSource;
  global.novaCdnShouldWriteDuelRefsOnly = novaCdnShouldWriteDuelRefsOnly;
  global.novaCdnFormatDuelQuestionsChosen = formatDuelQuestionsChosen;
})(typeof window !== 'undefined' ? window : this);

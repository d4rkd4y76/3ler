/**
 * TYMM müfredat sırası — order alanı + ders adı yedek sırası.
 */
(function (global) {
  'use strict';

  var LESSON_ORDER_BY_NAME = {
    'türkçe': 1,
    matematik: 2,
    'hayat bilgisi': 3,
    'fen bilimleri': 4,
    'sosyal bilgiler': 5,
    ingilizce: 6
  };

  function normLessonName(name) {
    return String(name || '')
      .trim()
      .toLocaleLowerCase('tr-TR')
      .replace(/\s+/g, ' ');
  }

  function normLessonKey(name) {
    return normLessonName(name)
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/\u0307/g, '');
  }

  function lessonOrderFallback(name) {
    var k = normLessonName(name);
    if (Object.prototype.hasOwnProperty.call(LESSON_ORDER_BY_NAME, k)) {
      return LESSON_ORDER_BY_NAME[k];
    }
    var ascii = normLessonKey(name);
    return Object.prototype.hasOwnProperty.call(LESSON_ORDER_BY_NAME, ascii)
      ? LESSON_ORDER_BY_NAME[ascii]
      : 99;
  }

  function topicOrderFromName(name) {
    var m = String(name || '')
      .trim()
      .match(/^(\d+)\s*[-.)]/);
    return m ? parseInt(m[1], 10) : NaN;
  }

  function topicOrderFromId(id) {
    var s = String(id || '');
    var m = s.match(/^t(\d+)$/i) || s.match(/^topic_(\d+)_/i);
    return m ? parseInt(m[1], 10) : NaN;
  }

  function resolveOrder(item, nameKey, isLesson) {
    var o = Number(item && item.order);
    if (Number.isFinite(o)) return o;
    if (isLesson) return lessonOrderFallback(item && item[nameKey]);
    var fromId = topicOrderFromId(item && item.id);
    if (Number.isFinite(fromId)) return fromId;
    var fromName = topicOrderFromName(item && item[nameKey]);
    if (Number.isFinite(fromName)) return fromName;
    return 1e9;
  }

  function sortCurriculum(items, opts) {
    opts = opts || {};
    var nameKey = opts.nameKey || 'name';
    var isLesson = !!opts.lesson;
    return (items || []).slice().sort(function (a, b) {
      var oa = resolveOrder(a, nameKey, isLesson);
      var ob = resolveOrder(b, nameKey, isLesson);
      if (oa !== ob) return oa - ob;
      return String(a[nameKey] || '').localeCompare(String(b[nameKey] || ''), 'tr', {
        numeric: true,
        sensitivity: 'base'
      });
    });
  }

  /** "Başlık (alt açıklama)" → başlık ve parantezli kısım ayrı */
  function splitCurriculumLabel(name) {
    var s = String(name || '').trim();
    if (!s) return { title: '', detail: '' };
    var open = s.indexOf('(');
    if (open <= 0) return { title: s, detail: '' };
    return {
      title: s.slice(0, open).trim(),
      detail: s.slice(open).trim()
    };
  }

  function extractGradeNumber(label) {
    var m = String(label || '').match(/([1-4])\s*\.?\s*S[ıi]N[ıi]F/i);
    if (m && m[1]) return Number(m[1]);
    var d = String(label || '').match(/\b([1-4])\b/);
    return d && d[1] ? Number(d[1]) : 0;
  }

  /** TYMM müfredatı: championData/headings/SINIF1 … SINIF4 */
  function canonicalHeadingIdForGrade(grade) {
    var g = Number(grade);
    if (g >= 1 && g <= 4) return 'SINIF' + g;
    return '';
  }

  /**
   * Öğrenci sınıf etiketinden doğru heading id (eski -Oxxx anahtarlarını atlar).
   */
  function resolveStudentHeadingId(scopedLabel, headingsList) {
    var grade = extractGradeNumber(scopedLabel);
    var canonical = canonicalHeadingIdForGrade(grade);
    if (canonical) {
      var list = headingsList || [];
      var hit = list.find(function (h) {
        return h && String(h.id) === canonical;
      });
      if (hit) return canonical;
      return canonical;
    }
    if (!headingsList || !headingsList.length) return '';
    return String((headingsList[0] && headingsList[0].id) || '').trim();
  }

  function clearChampionUiCaches() {
    var prefixes = [
      'cachedChampionData',
      'cachedChampionDataTimestamp',
      'cachedLessons_',
      'cachedLessonsTimestamp_',
      'cachedTopics_',
      'cachedTopicsTimestamp_',
      'nova_read_cache_ls_championData_headings'
    ];
    try {
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
      }
      keys.forEach(function (k) {
        if (!k) return;
        for (var p = 0; p < prefixes.length; p++) {
          if (k.indexOf(prefixes[p]) === 0) {
            localStorage.removeItem(k);
            break;
          }
        }
      });
    } catch (_) {}
    try {
      var sk = [];
      for (var j = 0; j < sessionStorage.length; j++) {
        sk.push(sessionStorage.key(j));
      }
      sk.forEach(function (k) {
        if (!k) return;
        if (k.indexOf('nova_read_cache_') === 0 || k.indexOf('nova_cdn_') === 0) {
          sessionStorage.removeItem(k);
        }
      });
    } catch (_) {}
    try {
      if (global.NOVA_READ_CACHE_MEM) {
        Object.keys(global.NOVA_READ_CACHE_MEM).forEach(function (k) {
          delete global.NOVA_READ_CACHE_MEM[k];
        });
      }
    } catch (_) {}
    try {
      global.__novaChampionHeadingsList = null;
    } catch (_) {}
  }

  global.NovaCurriculumSort = {
    sort: sortCurriculum,
    sortLessons: function (items) {
      return sortCurriculum(items, { lesson: true, nameKey: 'name' });
    },
    sortTopics: function (items) {
      return sortCurriculum(items, { lesson: false, nameKey: 'name' });
    },
    lessonOrderFallback: lessonOrderFallback,
    extractGradeNumber: extractGradeNumber,
    canonicalHeadingIdForGrade: canonicalHeadingIdForGrade,
    resolveStudentHeadingId: resolveStudentHeadingId,
    clearChampionUiCaches: clearChampionUiCaches,
    splitLabel: splitCurriculumLabel
  };
})(typeof window !== 'undefined' ? window : globalThis);

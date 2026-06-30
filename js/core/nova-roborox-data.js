/**
 * Roborox ile Öğren — sınıf kapsamlı ders/konu veri yardımcıları
 */
(function (global) {
  "use strict";

  var LESSON_ICONS = {
    lesson_turkce: "📖",
    lesson_matematik: "🔢",
    lesson_hayat_bilgisi: "🌍",
    lesson_ingilizce: "🇬🇧",
    lesson_fen_bilimleri: "🔬",
    lesson_sosyal_bilgiler: "🗺️",
  };

  function extractGrade(v) {
    if (typeof global.__novaExtractGradeNumber === "function") {
      var g = global.__novaExtractGradeNumber(v);
      if (g) return g;
    }
    var s = String(v || "");
    var m = s.match(/\b([1-4])\b/);
    return m ? Number(m[1]) : null;
  }

  function roboroxLearnPath(student) {
    var st = student;
    if (!st) {
      try {
        st = global.selectedStudent || JSON.parse(localStorage.getItem("selectedStudent") || "null");
      } catch (_) {
        st = null;
      }
    }
    var classId = String((st && st.classId) || "").trim();
    var className = String((st && st.className) || "").trim();
    var grade = extractGrade(className || classId);
    if (grade === 3) return "roboroxLearn";
    if (grade >= 1 && grade <= 4) return "classContent/sinif" + grade + "/roboroxLearn";
    if (classId) return "classContent/class_" + classId.replace(/[^\w-]/g, "_") + "/roboroxLearn";
    return "roboroxLearn";
  }

  function parseImages(v) {
    if (Array.isArray(v.images)) {
      return v.images.filter(function (u) {
        return typeof u === "string" && u.trim();
      });
    }
    if (v.imageUrls && typeof v.imageUrls === "object") {
      return Object.keys(v.imageUrls)
        .sort()
        .map(function (k) {
          return v.imageUrls[k];
        })
        .filter(function (u) {
          return typeof u === "string" && u.trim();
        });
    }
    return [];
  }

  function normalizeBunnyVideoEntry(raw) {
    if (!raw || typeof raw !== "object") return null;
    var videoId = String(raw.videoId || raw.id || "").trim();
    if (!videoId) return null;
    return {
      libraryName: String(raw.libraryName || raw.host || "").trim(),
      libraryId: String(raw.libraryId || "").trim(),
      videoId: videoId,
    };
  }

  function parseVideos(v) {
    v = v || {};
    if (Array.isArray(v.videos)) {
      return v.videos.map(normalizeBunnyVideoEntry).filter(Boolean);
    }
    if (v.videos && typeof v.videos === "object") {
      return Object.keys(v.videos)
        .sort(function (a, b) {
          var na = Number(a);
          var nb = Number(b);
          if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
          return String(a).localeCompare(String(b), "tr");
        })
        .map(function (k) {
          return normalizeBunnyVideoEntry(v.videos[k]);
        })
        .filter(Boolean);
    }
    if (v.video && typeof v.video === "object") {
      var one = normalizeBunnyVideoEntry(v.video);
      return one ? [one] : [];
    }
    return [];
  }

  function collectTopicPlaylist(topic, section) {
    if (section && section.videos && section.videos.length) {
      return section.videos.slice();
    }
    var out = [];
    if (topic && topic.sections && topic.sections.length) {
      topic.sections.forEach(function (s) {
        if (s.active !== false && s.videos && s.videos.length) {
          out = out.concat(s.videos);
        }
      });
    }
    if (out.length) return out;
    if (topic && topic.videos && topic.videos.length) return topic.videos.slice();
    return [];
  }

  function topicVideoCount(topic) {
    return collectTopicPlaylist(topic, null).length;
  }

  function sectionHasContent(section) {
    return !!(section && section.videos && section.videos.length);
  }

  function parseSection(id, v) {
    v = v || {};
    var videos = parseVideos(v);
    return {
      id: id,
      title: String(v.title || "Bölüm").trim() || "Bölüm",
      order: Number(v.order) || 0,
      active: v.active !== false,
      videos: videos,
      updatedAt: Number(v.updatedAt) || 0,
    };
  }

  function parseSections(v) {
    v = v || {};
    if (v.sections && typeof v.sections === "object" && !Array.isArray(v.sections)) {
      return Object.keys(v.sections)
        .map(function (sid) {
          return parseSection(sid, v.sections[sid]);
        })
        .filter(function (s) {
          return s.active && sectionHasContent(s);
        })
        .sort(function (a, b) {
          return a.order - b.order || a.title.localeCompare(b.title, "tr");
        });
    }
    if (Array.isArray(v.sections)) {
      return v.sections
        .map(function (s, i) {
          return parseSection(String((s && s.id) || "sec_" + i), s);
        })
        .filter(function (s) {
          return s.active && sectionHasContent(s);
        })
        .sort(function (a, b) {
          return a.order - b.order || a.title.localeCompare(b.title, "tr");
        });
    }
    return [];
  }

  function topicHasContent(topic) {
    if (!topic) return false;
    if (topic.sections && topic.sections.length) return true;
    return !!(topic.videos && topic.videos.length);
  }

  function topicUsesSections(topic) {
    return !!(topic && topic.sections && topic.sections.length);
  }

  function topicContentCount(topic) {
    if (!topic) return 0;
    var n = topicVideoCount(topic);
    if (n > 0) return n;
    return topic.images ? topic.images.length : 0;
  }

  function topicContentLabel(topic) {
    if (topicUsesSections(topic)) {
      var videoN = topicVideoCount(topic);
      if (videoN > 0) return videoN + (videoN === 1 ? " Video" : " Video");
      var n = topic.sections.length;
      return n + (n === 1 ? " Bölüm" : " Bölüm");
    }
    var c = topicContentCount(topic);
    return c + (c === 1 ? " Video" : " Video");
  }

  function parseTopic(id, v, lessonId) {
    v = v || {};
    var sections = parseSections(v);
    var videos = sections.length ? [] : parseVideos(v);
    var images = parseImages(v);
    return {
      id: id,
      lessonId: lessonId || "",
      title: String(v.title || "Konu").trim() || "Konu",
      order: Number(v.order) || 0,
      active: v.active !== false,
      sections: sections,
      videos: videos,
      images: images,
      updatedAt: Number(v.updatedAt) || 0,
    };
  }

  function parseLesson(id, v) {
    v = v || {};
    var topicsRaw = v.topics && typeof v.topics === "object" ? v.topics : {};
    var topics = Object.keys(topicsRaw)
      .map(function (tid) {
        return parseTopic(tid, topicsRaw[tid], id);
      })
      .filter(function (t) {
        return t.active && topicHasContent(t);
      })
      .sort(function (a, b) {
        return a.order - b.order || a.title.localeCompare(b.title, "tr");
      });
    return {
      id: id,
      name: String(v.name || id).trim() || id,
      order: Number(v.order) || 0,
      active: v.active !== false,
      icon: String(v.icon || lessonIcon(id) || "📚"),
      topics: topics,
      topicCount: topics.length,
    };
  }

  function parseSnapshot(raw) {
    raw = raw && typeof raw === "object" ? raw : {};
    if (raw.lessons && typeof raw.lessons === "object" && Object.keys(raw.lessons).length) {
      var lessons = Object.keys(raw.lessons)
        .map(function (lid) {
          return parseLesson(lid, raw.lessons[lid]);
        })
        .filter(function (l) {
          return l.active && l.topics.length > 0;
        })
        .sort(function (a, b) {
          return a.order - b.order || a.name.localeCompare(b.name, "tr");
        });
      return { mode: "lessons", lessons: lessons, flatTopics: [] };
    }

    var flatTopics = Object.keys(raw)
      .filter(function (k) {
        return k !== "lessons";
      })
      .map(function (id) {
        return parseTopic(id, raw[id], "");
      })
      .filter(function (t) {
        return t.active && topicHasContent(t);
      })
      .sort(function (a, b) {
        return a.order - b.order || a.title.localeCompare(b.title, "tr");
      });
    return { mode: "flat", lessons: [], flatTopics: flatTopics };
  }

  function lessonIcon(lessonId) {
    return LESSON_ICONS[String(lessonId || "")] || "📚";
  }

  function gradeLabel(grade) {
    return grade ? String(grade) + ". Sınıf" : "";
  }

  function defaultLessonsForGrade(grade) {
    var grades =
      global.NovaTymmCurriculum && global.NovaTymmCurriculum.grades
        ? global.NovaTymmCurriculum.grades
        : [];
    var row = grades.find(function (g) {
      return Number(g.grade) === Number(grade);
    });
    if (!row || !Array.isArray(row.lessons)) return [];
    return row.lessons.map(function (l, i) {
      return {
        id: l.id,
        name: l.name,
        order: i + 1,
        active: true,
        icon: lessonIcon(l.id),
        topics: {},
      };
    });
  }

  global.NovaRoboroxData = {
    extractGrade: extractGrade,
    roboroxLearnPath: roboroxLearnPath,
    parseImages: parseImages,
    parseVideos: parseVideos,
    parseSection: parseSection,
    parseSections: parseSections,
    sectionHasContent: sectionHasContent,
    topicHasContent: topicHasContent,
    topicUsesSections: topicUsesSections,
    topicContentCount: topicContentCount,
    topicContentLabel: topicContentLabel,
    collectTopicPlaylist: collectTopicPlaylist,
    topicVideoCount: topicVideoCount,
    parseTopic: parseTopic,
    parseLesson: parseLesson,
    parseSnapshot: parseSnapshot,
    lessonIcon: lessonIcon,
    gradeLabel: gradeLabel,
    defaultLessonsForGrade: defaultLessonsForGrade,
  };
})(typeof window !== "undefined" ? window : globalThis);

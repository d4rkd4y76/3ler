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

  function parseTopic(id, v, lessonId) {
    v = v || {};
    return {
      id: id,
      lessonId: lessonId || "",
      title: String(v.title || "Konu").trim() || "Konu",
      order: Number(v.order) || 0,
      active: v.active !== false,
      images: parseImages(v),
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
        return t.active && t.images.length > 0;
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
        return t.active && t.images.length > 0;
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
    parseTopic: parseTopic,
    parseLesson: parseLesson,
    parseSnapshot: parseSnapshot,
    lessonIcon: lessonIcon,
    gradeLabel: gradeLabel,
    defaultLessonsForGrade: defaultLessonsForGrade,
  };
})(typeof window !== "undefined" ? window : globalThis);

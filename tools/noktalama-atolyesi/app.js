const $ = (sel) => document.querySelector(sel);

const MARK_META = {
  period: { sym: ".", name: "Nokta", color: "#2563eb" },
  comma: { sym: ",", name: "Virgül", color: "#7c3aed" },
  question: { sym: "?", name: "Soru işareti", color: "#0891b2" },
  exclamation: { sym: "!", name: "Ünlem işareti", color: "#dc2626" },
  ellipsis: { sym: "…", name: "Üç nokta", color: "#64748b" },
  colon: { sym: ":", name: "İki nokta üst üste", color: "#ca8a04" },
  quote: { sym: '"', name: "Tırnak işareti", color: "#059669" },
  apostrophe: { sym: "\u2019", name: "Kesme işareti", color: "#be185d" },
};

const TOPICS = [
  {
    key: "period",
    lead: "Cümle bittiğinde veya kısaltmalardan sonra kullanılır.",
    rules: [
      {
        title: "Tamamlanmış cümlenin sonunda",
        text: "Anlamı biten cümlelerin sonuna nokta koyarız.",
        examples: [
          "Bugün okula gittim.",
          "Kitabımı çantama koydum.",
          "Akşam ödevimi yaptım.",
        ],
      },
      {
        title: "Kısaltmaların sonunda",
        text: "Bazı kısaltmaların sonunda da nokta görülür.",
        examples: [
          "Dr. Ali sınıfa girdi.",
          "Saat 09.00'da buluşalım.",
          "Prof. Yılmaz konuştu.",
        ],
      },
      {
        title: "Kısaltılmış sayılarda",
        text: "Sıra sayıları kısaltılınca sonuna nokta konabilir.",
        examples: [
          "1. sınıfta okuyorum.",
          "3. kata çıktık.",
          "2. ödevi bitirdim.",
        ],
      },
    ],
  },
  {
    key: "comma",
    lead: "Cümle içinde küçük duraklarda ve listelerde kullanılır.",
    rules: [
      {
        title: "Sıralı sözcükleri ayırırken",
        text: "Yan yana yazılan eş tür sözcükleri virgülle ayırırız.",
        examples: [
          "Elma, armut, muz aldık.",
          "Kırmızı, mavi, yeşil kalemlerim var.",
          "Ali, Ayşe, Can parka gitti.",
        ],
      },
      {
        title: "Hitap ederken",
        text: "Konuştuğumuz kişinin adından sonra virgül kullanılır.",
        examples: [
          "Ali, buraya gel.",
          "Öğrenciler, sessiz olun.",
          "Can, pencereyi kapat.",
        ],
      },
      {
        title: "Anlamca bağlı cümleleri birleştirirken",
        text: "Kısa cümleler virgülle bağlanabilir.",
        examples: [
          "Önce ellerini yıka, sonra ye.",
          "Kitabı okudum, çok beğendim.",
          "Yağmur yağıyor, şemsiyemi aldım.",
        ],
      },
    ],
  },
  {
    key: "question",
    lead: "Soru sorulan cümlelerin sonuna konur.",
    rules: [
      {
        title: "Bilgi isteyen sorularda",
        text: "Cevap beklediğimiz sorularda soru işareti kullanılır.",
        examples: [
          "Adın ne?",
          "Saat kaç?",
          "En sevdiğin renk hangisi?",
        ],
      },
      {
        title: "Evet–hayır sorularında",
        text: "mi, mı, mu, mü ile biten sorularda da soru işareti konur.",
        examples: [
          "Bugün okula gidiyor musun?",
          "Bu senin defterin mi?",
          "Yarın pikniğe gidecek miyiz?",
        ],
      },
      {
        title: "Soru sözcüklü cümlelerde",
        text: "Kim, ne, nerede, nasıl gibi sözcüklerle soru kurulunca sonuna soru işareti gelir.",
        examples: [
          "Nereye gidiyorsun?",
          "Nasılsın?",
          "Kim geldi?",
        ],
      },
    ],
  },
  {
    key: "exclamation",
    lead: "Sevinç, şaşırma ve uyarı gibi duyguları güçlendirir.",
    rules: [
      {
        title: "Sevinç ve heyecanda",
        text: "Mutluluk veya coşku duyduğumuzda ünlem işareti kullanılır.",
        examples: [
          "Ne kadar güzel bir gün!",
          "Yaşasın, kazandık!",
          "Harika bir gol attın!",
        ],
      },
      {
        title: "Uyarı ve emirde",
        text: "Dikkat çekmek veya uyarmak için ünlem konur.",
        examples: [
          "Dikkat et!",
          "Yavaş koş!",
          "Dur!",
        ],
      },
      {
        title: "Şaşırma ve hayrette",
        text: "Ani şaşkınlık duygusunu göstermek için kullanılır.",
        examples: [
          "Ne oldu böyle!",
          "İnanamıyorum!",
          "Ah, unuttum!",
        ],
      },
    ],
  },
  {
    key: "colon",
    lead: "Açıklama veya alıntıdan önce kullanılır.",
    rules: [
      {
        title: "dedi ki ifadesinden sonra",
        text: "Konuşma cümlesi gelmeden önce iki nokta üst üste konur.",
        examples: [
          "Öğretmenim dedi ki: \"Ödevlerinizi yapın.\"",
          "Annem bağırdı: \"Yemeğe gelin!\"",
          "Babam söyledi: \"Dikkatli ol.\"",
        ],
      },
      {
        title: "Açıklama yaparken",
        text: "Önemli bir bilgiyi vurgulamak için iki nokta kullanılır.",
        examples: [
          "Şunu unutma: çalışkan ol.",
          "Tek kuralımız: birbirimize saygı.",
          "Not: yarın sınav var.",
        ],
      },
    ],
  },
  {
    key: "quote",
    lead: "Başkasının sözünü veya özel bir ifadeyi belirtir.",
    rules: [
      {
        title: "Konuşma cümlelerinde",
        text: "Söylenen sözler tırnak içine alınır.",
        examples: [
          "Anne dedi: \"Gel içeri.\"",
          "Öğretmen \"Oku\" dedi.",
          "Kardeşim \"Bak\" diye bağırdı.",
        ],
      },
      {
        title: "Özel anlamlı sözcüklerde",
        text: "Vurgulanmak istenen kelime tırnak içinde yazılabilir.",
        examples: [
          "Kitapta \"su\" kelimesi geçiyor.",
          "\"Güzel\" sözcüğünü öğrendik.",
          "Defterime \"çalışkan\" yazdım.",
        ],
      },
    ],
  },
  {
    key: "apostrophe",
    lead: "Kelimelerin bazı harflerinin düşmesini gösterir.",
    rules: [
      {
        title: "Eklerin ayrılmasında",
        text: "Özel isimlere gelen ekler kesme işaretiyle ayrılır.",
        examples: [
          "Türkiye'nin başkenti Ankara'dır.",
          "Ali'nin kitabı masada.",
          "Ayşe'ye hediye aldık.",
        ],
      },
      {
        title: "Kısaltmalarda",
        text: "Bazı kısaltmalarda düşen ses için kesme işareti kullanılır.",
        examples: [
          "TBMM'nin binası görkemli.",
          "Ankara'da yaşıyorum.",
          "Okul'un bahçesi geniş.",
        ],
      },
    ],
  },
  {
    key: "ellipsis",
    lead: "Cümle yarım kaldığında veya düşünce sürer gibi gösterir.",
    rules: [
      {
        title: "Yarım kalan cümlede",
        text: "Söz bitmeden durduğumuzu göstermek için üç nokta kullanılır.",
        examples: [
          "Seni çok özledim…",
          "Belki yarın gelirim…",
          "Bir gün görüşürüz…",
        ],
      },
      {
        title: "Düşünce devam ediyormuş gibi",
        text: "Okurda merak uyandırmak için üç nokta konabilir.",
        examples: [
          "Keşke şimdi deniz kenarında olsak…",
          "Acaba ne olacak…",
          "Umarım güzel geçer…",
        ],
      },
    ],
  },
];

const T = (v) => ({ t: "text", v });
const B = (answer) => ({ t: "blank", answer });

const PRACTICE_POOL = [
  { segments: [T("Bugün okula gittim"), B("period")], hint: "Cümle bitti." },
  { segments: [T("Akşam yemek yedik"), B("period")], hint: "Tamamlanmış cümle." },
  { segments: [T("Kitabımı çantama koydum"), B("period")], hint: "Cümlenin sonu." },
  { segments: [T("Yaz tatilini çok sevdim"), B("period")], hint: "Bittiğini göster." },
  { segments: [T("Perşembe günü pikniğe gideceğiz"), B("period")], hint: "Haber cümlesi bitti." },
  { segments: [T("Adın ne"), B("question")], hint: "Soru soruyorsun." },
  { segments: [T("Saat kaç"), B("question")], hint: "Cevap bekleyen soru." },
  { segments: [T("Bu senin defterin mi"), B("question")], hint: "mi ile soru." },
  { segments: [T("Nereye gidiyorsun"), B("question")], hint: "Soru işareti gerekir." },
  { segments: [T("En sevdiğin renk hangisi"), B("question")], hint: "Soru cümlesi." },
  { segments: [T("Ne kadar güzel bir gün"), B("exclamation")], hint: "Sevinç var!" },
  { segments: [T("Yaşasın kar yağıyor"), B("exclamation")], hint: "Coşku!" },
  { segments: [T("Dikkat et"), B("exclamation")], hint: "Uyarı cümlesi." },
  { segments: [T("Yavaş koş"), B("exclamation")], hint: "Emir ve uyarı." },
  { segments: [T("Harika bir gol attın"), B("exclamation")], hint: "Heyecan!" },
  {
    segments: [T("Elma"), B("comma"), T(" armut"), B("comma"), T(" muz aldık"), B("period")],
    hint: "Sayarken virgül, sonda nokta.",
  },
  {
    segments: [T("Ali"), B("comma"), T(" Ayşe"), B("comma"), T(" Can parka gitti"), B("period")],
    hint: "İsimleri ayır.",
  },
  {
    segments: [T("Önce ellerini yıka"), B("comma"), T(" sonra ye"), B("period")],
    hint: "Sıralı iki işlem.",
  },
  {
    segments: [T("Bahçede kırmızı"), B("comma"), T(" sarı"), B("comma"), T(" mor çiçekler vardı"), B("period")],
    hint: "Renkleri say.",
  },
  {
    segments: [T("Kitabı okudum"), B("comma"), T(" çok beğendim"), B("period")],
    hint: "İki kısa cümle, virgülle.",
  },
  {
    segments: [T("Yağmur yağıyor"), B("comma"), T(" şemsiyemi aldım"), B("period")],
    hint: "Virgülle bağla.",
  },
  {
    segments: [T("Öğretmenim dedi ki"), B("colon"), T(' "Ödevlerinizi yapın"'), B("period")],
    hint: "dedi ki sonrası iki nokta.",
  },
  {
    segments: [T("Annem bağırdı"), B("colon"), T(' "Yemeğe gelin"'), B("exclamation")],
    hint: "Tırnak içi ünlemle bitebilir.",
  },
  {
    segments: [T("Babam sordu"), B("colon"), T(' "Okul nasıldı"'), B("question")],
    hint: "Alıntı soru ise ?",
  },
  {
    segments: [T("Dedem anlattı"), B("colon"), T(" eskiden burası ormanmış"), B("period")],
    hint: "Açıklama gelecek.",
  },
  {
    segments: [T("Şunu hatırla"), B("colon"), T(" çalışkan ol"), B("period")],
    hint: "İki nokta üst üste.",
  },
  {
    segments: [T("Belki yarın gelir"), B("ellipsis")],
    hint: "Emin değil, düşünce devam ediyor.",
  },
  {
    segments: [T("Seni çok özledim"), B("ellipsis")],
    hint: "Duygu devam ediyor gibi…",
  },
  {
    segments: [T("Bir gün yine buluşuruz"), B("ellipsis")],
    hint: "Yarım kalmış his.",
  },
  {
    segments: [T("Anne dedi"), B("colon"), T(" "), B("quote"), T("Gel buraya"), B("quote")],
    hint: "Konuşma tırnak içinde.",
  },
  {
    segments: [T("Öğretmen yazdı"), B("colon"), T(" "), B("quote"), T("Dikkatli dinleyin"), B("quote"), B("period")],
    hint: "Tırnak kapanır, cümle nokta.",
  },
  {
    segments: [T("Kardeşim bağırdı"), B("colon"), T(" "), B("quote"), T("Bak şuna"), B("quote"), B("exclamation")],
    hint: "Tırnak + ünlem.",
  },
  {
    segments: [T("Dr"), B("period"), T(" Ali bize baktı"), B("period")],
    hint: "Kısaltmada nokta.",
  },
  {
    segments: [T("Kitapta "), B("quote"), T("su"), B("quote"), T(" kelimesini buldum"), B("period")],
    hint: "Kelime tırnak içinde vurgulanır.",
  },
  { segments: [T("Çalıştım"), B("comma"), T(" dinlendim"), B("comma"), T(" tekrar çalıştım"), B("period")], hint: "Üç bölüm." },
  { segments: [T("Sınıfta sessiz ol"), B("comma"), T(" lütfen"), B("period")], hint: "Kısa rica." },
  { segments: [T("Bu kalem senin mi"), B("question")], hint: "mi = soru." },
  { segments: [T("Hava soğuk mu"), B("question")], hint: "mu ile soru." },
  { segments: [T("Ne güzel kokuyor"), B("exclamation")], hint: "Hayranlık." },
  { segments: [T("Yardım et lütfen"), B("exclamation")], hint: "Rica eder gibi ünlem." },
  { segments: [T("Pazardan ekmek"), B("comma"), T(" süt"), B("comma"), T(" yumurta aldık"), B("period")], hint: "Liste." },
  { segments: [T("Sabah kalktım"), B("comma"), T(" kahvaltı yaptım"), B("period")], hint: "Virgül + nokta." },
  { segments: [T("Kitapta şöyle yazıyor"), B("colon"), T(" paylaşmak güzeldir"), B("period")], hint: "Alıntı öncesi." },
  { segments: [T("Belki sonra anlarsın"), B("ellipsis")], hint: "Üç nokta." },
  { segments: [T("Top oynayalım mı"), B("question")], hint: "mı ile soru." },
  { segments: [T("Ne kadar hızlı koştun"), B("exclamation")], hint: "Hayret!" },
  { segments: [T("İstanbul"), B("comma"), T(" Ankara"), B("comma"), T(" İzmir büyük şehirdir"), B("period")], hint: "Şehir listesi." },
  { segments: [T("Önce dinle"), B("comma"), T(" sonra konuş"), B("period")], hint: "Sıra." },
  { segments: [T("Dondurma"), B("comma"), T(" çikolata"), B("comma"), T(" meyve severim"), B("period")], hint: "Sevdiğin şeyler." },
  { segments: [T("Baba sordu"), B("colon"), T(" "), B("quote"), T("Ödevin bitti mi"), B("quote"), B("question")], hint: "Konuşma + soru." },
  { segments: [T("Öğretmen dedi"), B("colon"), T(" "), B("quote"), T("Sessiz olun"), B("quote"), B("period")], hint: "Emir tırnak içinde." },
  { segments: [T("Çok yoruldum"), B("ellipsis")], hint: "Devamı var gibi." },
  { segments: [T("Yarın görüşürüz"), B("period")], hint: "Veda cümlesi." },
  { segments: [T("Kim geldi"), B("question")], hint: "Kim sorusu." },
  { segments: [T("Bravo"), B("exclamation"), T(" çok iyi"), B("period")], hint: "Ünlem + devam." },
  { segments: [T("Masanın üzerinde kalem"), B("comma"), T(" silgi"), B("comma"), T(" defter var"), B("period")], hint: "Sayma." },
  { segments: [T("Hemen gel"), B("exclamation")], hint: "Kısa emir." },
  { segments: [T("Okulda en çok resim"), B("comma"), T(" müzik"), B("comma"), T(" beden dersini severim"), B("period")], hint: "Ders listesi." },
  { segments: [T("Anladın mı"), B("question")], hint: "Kısa soru." },
  { segments: [T("Ne kadar güzel şarkı söylüyorsun"), B("exclamation")], hint: "Övgü." },
  { segments: [T("Kapıyı aç"), B("comma"), T(" içeri gir"), B("period")], hint: "İki emir." },
  { segments: [T("Belki cumartesi sinemaya gideriz"), B("ellipsis")], hint: "Emin değiliz." },
  { segments: [T("Annem dedi ki"), B("colon"), T(' "Çabuk hazırlan"'), B("exclamation")], hint: "dedi ki + ünlem." },
  { segments: [T("Kütüphanede sessiz ol"), B("comma"), T(" lütfen"), B("period")], hint: "Rica ederken virgül." },
  { segments: [T("Hangi takımı tutuyorsun"), B("question")], hint: "Hangi ile soru." },
  { segments: [T("Vay canına"), B("exclamation"), T(" ne güzel manzara"), B("exclamation")], hint: "İki ünlem!" },
  { segments: [T("Sınıf başkanı dedi"), B("colon"), T(" "), B("quote"), T("Yarın tören var"), B("quote"), B("period")], hint: "Duyuru tırnak içinde." },
  { segments: [T("Belki de en güzel gün bugündür"), B("ellipsis")], hint: "Düşünce devam ediyor." },
  { segments: [T("Çorba"), B("comma"), T(" pilav"), B("comma"), T(" salata yedik"), B("period")], hint: "Yemek listesi." },
];

const state = {
  topicKey: "period",
  sound: false,
  practiceOrder: [],
  practiceIndex: 0,
  score: 0,
  checked: false,
  selectedToken: null,
  activeSlot: null,
  drag: null,
  ruleExampleIdx: {},
};

const backBtn = $("#back-btn");
const toggleSound = $("#toggle-sound");
const markNav = $("#markNav");
const heroStage = $("#heroStage");
const heroGlow = $("#heroGlow");
const heroSymbol = $("#heroSymbol");
const heroKicker = $("#heroKicker");
const heroTitle = $("#heroTitle");
const heroLead = $("#heroLead");
const rulesList = $("#rulesList");
const openPractice = $("#openPractice");
const learnView = $("#learnView");
const practiceView = $("#practiceView");
const closePractice = $("#closePractice");
const practiceProgress = $("#practiceProgress");
const practiceScore = $("#practiceScore");
const practiceSentence = $("#practiceSentence");
const palette = $("#palette");
const practiceFeedback = $("#practiceFeedback");
const checkPracticeBtn = $("#checkPracticeBtn");
const nextPractice = $("#nextPractice");

let ghostEl = null;

function sym(markKey) {
  return MARK_META[markKey]?.sym || "";
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getTopic() {
  return TOPICS.find((t) => t.key === state.topicKey) || TOPICS[0];
}

function speak(text) {
  if (!state.sound || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "tr-TR";
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}

function pulseHero() {
  if (!heroSymbol) return;
  heroSymbol.style.transform = "none";
  const wrap = heroSymbol.closest(".hero-symbol-wrap");
  if (typeof gsap === "undefined") return;
  try {
    gsap.killTweensOf(heroSymbol);
    if (wrap) gsap.killTweensOf(wrap);
    const target = wrap || heroSymbol;
    gsap.fromTo(target, { opacity: 0.45 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
  } catch (_) {}
}

function renderMarkNav() {
  markNav.innerHTML = TOPICS.map((t) => {
    const m = MARK_META[t.key];
    const active = t.key === state.topicKey ? " active" : "";
    return `<button type="button" class="mark-btn${active}" data-key="${t.key}">
      <span class="mark-btn__sym">${m.sym}</span>
      <span class="mark-btn__name">${m.name}</span>
    </button>`;
  }).join("");

  markNav.querySelectorAll(".mark-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.topicKey = btn.dataset.key;
      renderMarkNav();
      renderLearn();
    });
  });
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMarksInExample(sentence, markKey) {
  const meta = MARK_META[markKey];
  if (!meta?.sym) return sentence;
  const sym = meta.sym;
  const re = new RegExp(escapeRegExp(sym), "g");
  return sentence.replace(re, `<span class="ex-mark">${sym}</span>`);
}

function getRuleExampleIndex(ruleId, len) {
  if (state.ruleExampleIdx[ruleId] == null) state.ruleExampleIdx[ruleId] = 0;
  return state.ruleExampleIdx[ruleId] % len;
}

function showRuleExample(ruleId, markKey, examples) {
  if (!examples?.length) return;
  const card = rulesList?.querySelector(`[data-rule-id="${ruleId}"]`);
  const content = card?.querySelector(".rule-example-content");
  if (!content) return;
  const idx = (getRuleExampleIndex(ruleId, examples.length) + 1) % examples.length;
  state.ruleExampleIdx[ruleId] = idx;
  content.innerHTML = highlightMarksInExample(examples[idx], markKey);
  speak(examples[idx]);
}

function renderLearn() {
  const t = getTopic();
  const m = MARK_META[t.key];
  state.ruleExampleIdx = {};
  heroSymbol.textContent = m.sym;
  heroSymbol.style.color = m.color || "var(--ink)";
  heroSymbol.style.transform = "none";
  heroTitle.textContent = m.name;
  heroKicker.textContent = "Noktalama işareti";
  heroLead.textContent = t.lead;
  if (rulesList && t.rules) {
    rulesList.innerHTML = t.rules
      .map((rule, ri) => {
        const ruleId = `${t.key}-${ri}`;
        const first = highlightMarksInExample(rule.examples[0], t.key);
        const moreBtn =
          rule.examples.length > 1
            ? `<div class="rule-card__actions">
            <button type="button" class="btn-ex-next" data-rule-id="${ruleId}" data-mark="${t.key}" data-rule-index="${ri}">
              Farklı örnek gör
            </button>
          </div>`
            : "";
        return `<article class="rule-card" data-rule-id="${ruleId}">
        <h3 class="rule-card__title">${rule.title}</h3>
        <p class="rule-card__text">${rule.text}</p>
        <div class="rule-example-box rule-example--show" data-example-box="${ruleId}">
          <p class="rule-example-content">${first}</p>
        </div>
        ${moreBtn}
      </article>`;
      })
      .join("");

    rulesList.querySelectorAll(".btn-ex-next").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ri = Number(btn.dataset.ruleIndex);
        const rule = t.rules[ri];
        showRuleExample(btn.dataset.ruleId, btn.dataset.mark, rule.examples);
      });
    });
  }
  if (heroGlow) heroGlow.style.background = `radial-gradient(circle, ${m.color}55, transparent 68%)`;
  if (heroStage) heroStage.style.borderColor = `${m.color}44`;
  pulseHero();
  speak(`${m.name}. ${t.lead}`);
}

function getCurrentPractice() {
  const idx = state.practiceOrder[state.practiceIndex];
  return PRACTICE_POOL[idx];
}

function marksNeeded(item) {
  const set = new Set();
  item.segments.forEach((s) => {
    if (s.t === "blank") set.add(s.answer);
  });
  return set;
}

function buildPalette(needed) {
  const keys = Object.keys(MARK_META);
  const list = [...needed];
  keys.forEach((k) => {
    if (!needed.has(k) && list.length < 7 && Math.random() > 0.55) list.push(k);
  });
  while (list.length < 4) {
    const extra = keys[Math.floor(Math.random() * keys.length)];
    if (!list.includes(extra)) list.push(extra);
  }
  return shuffle(list);
}

function renderPractice() {
  cleanupDrag();
  const item = getCurrentPractice();
  if (!item) return;

  state.checked = false;
  practiceFeedback.textContent = "";
  practiceFeedback.className = "practice-feedback";
  nextPractice.disabled = true;

  practiceProgress.textContent = `${state.practiceIndex + 1} / ${state.practiceOrder.length}`;
  practiceScore.textContent = `Puan: ${state.score}`;

  practiceSentence.innerHTML = "";
  let blankId = 0;
  item.segments.forEach((seg) => {
    if (seg.t === "text") {
      const span = document.createElement("span");
      span.className = "seg-text";
      span.textContent = seg.v;
      practiceSentence.appendChild(span);
    } else {
      blankId += 1;
      practiceSentence.appendChild(createSlot(seg, blankId));
    }
  });

  const needed = marksNeeded(item);
  palette.innerHTML = "";
  buildPalette(needed).forEach((key) => {
    const meta = MARK_META[key];
    const tok = document.createElement("button");
    tok.type = "button";
    tok.className = "drag-token";
    tok.dataset.mark = key;
    tok.textContent = meta.sym;
    tok.title = meta.name;
    tok.setAttribute("aria-label", meta.name);
    tok.addEventListener("pointerdown", (e) => onTokenPointerDown(e, key));
    palette.appendChild(tok);
  });
}

function onSlotClick(slot) {
  if (state.checked) return;
  if (!slot.classList.contains("filled")) return;
  clearSlot(slot);
  practiceFeedback.textContent = "";
  practiceFeedback.className = "practice-feedback";
}


function hideGhost() {
  if (!ghostEl) return;
  ghostEl.hidden = true;
  ghostEl.style.display = "none";
  ghostEl.textContent = "";
}

function showGhost(markKey, x, y) {
  if (!ghostEl) {
    ghostEl = document.createElement("div");
    ghostEl.className = "drag-ghost";
    ghostEl.setAttribute("aria-hidden", "true");
    practiceView.appendChild(ghostEl);
  }
  ghostEl.textContent = sym(markKey);
  ghostEl.hidden = false;
  ghostEl.style.display = "grid";
  moveGhost(x, y);
}

function moveGhost(x, y) {
  if (!ghostEl) return;
  ghostEl.style.left = `${x}px`;
  ghostEl.style.top = `${y}px`;
}

function cleanupDrag() {
  state.drag = null;
  palette?.querySelectorAll(".drag-token").forEach((tok) => {
    tok.classList.remove("dragging", "token--selected");
  });
  practiceSentence?.querySelectorAll(".slot").forEach((s) => {
    s.classList.remove("slot--active", "slot--hover");
  });
  hideGhost();
}

function createSlot(seg, blankId) {
  const slot = document.createElement("span");
  slot.className = "slot";
  slot.dataset.blankId = String(blankId);
  slot.dataset.answer = seg.answer;
  slot.setAttribute("role", "button");
  slot.tabIndex = 0;
  slot.innerHTML = '<span class="slot-pit" aria-hidden="true"></span>';
  slot.addEventListener("click", () => onSlotClick(slot));
  return slot;
}

function clearSlot(slot) {
  delete slot.dataset.placed;
  slot.innerHTML = '<span class="slot-pit" aria-hidden="true"></span>';
  slot.classList.remove("filled", "correct", "wrong", "slot--active", "slot--hover");
}

function fillSlot(slot, markKey) {
  if (!slot || state.checked) return;
  hideGhost();
  slot.dataset.placed = markKey;
  slot.innerHTML = `<span class="slot-fill" aria-hidden="true">${sym(markKey)}</span>`;
  slot.classList.add("filled");
  slot.classList.remove("slot--active", "slot--hover", "correct", "wrong");
  palette?.querySelectorAll(".drag-token").forEach((tok) => tok.classList.remove("token--selected"));
  practiceFeedback.textContent = "";
  practiceFeedback.className = "practice-feedback";
}

function onTokenPointerDown(e, markKey) {
  if (state.checked) return;
  e.preventDefault();

  const tok = e.currentTarget;
  const ptrId = e.pointerId;
  const startX = e.clientX;
  const startY = e.clientY;

  state.drag = { markKey, pointerId: ptrId };

  try {
    tok.setPointerCapture(ptrId);
  } catch (_) {}

  tok.classList.add("dragging");
  showGhost(markKey, startX, startY);

  const onMove = (ev) => {
    if (ev.pointerId !== ptrId) return;
    moveGhost(ev.clientX, ev.clientY);
    practiceSentence.querySelectorAll(".slot").forEach((s) => s.classList.remove("slot--hover"));
    const hover = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.(".slot");
    if (hover) hover.classList.add("slot--hover");
  };

  const onUp = (ev) => {
    if (ev.pointerId !== ptrId) return;
    try {
      tok.releasePointerCapture(ptrId);
    } catch (_) {}
    tok.classList.remove("dragging");
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointercancel", onUp);
    hideGhost();
    practiceSentence.querySelectorAll(".slot").forEach((s) => s.classList.remove("slot--hover"));

    const moved = Math.hypot(ev.clientX - startX, ev.clientY - startY) > 8;
    const slot = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.(".slot");

    if (moved && slot) fillSlot(slot, markKey);

    state.drag = null;
    palette?.querySelectorAll(".drag-token").forEach((btn) => btn.classList.remove("token--selected"));
  };

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onUp);
}

function allSlotsFilled() {
  const slots = practiceSentence.querySelectorAll(".slot");
  return [...slots].every((s) => s.dataset.placed);
}

function checkPracticeAnswer() {
  const slots = practiceSentence.querySelectorAll(".slot");
  if (!slots.length) return;

  if (!allSlotsFilled()) {
    practiceFeedback.textContent = "Önce tüm boşlukları doldur.";
    practiceFeedback.className = "practice-feedback bad";
    return;
  }

  let ok = true;
  slots.forEach((slot) => {
    const correct = slot.dataset.placed === slot.dataset.answer;
    slot.classList.toggle("correct", correct);
    slot.classList.toggle("wrong", !correct);
    if (!correct) ok = false;
  });

  if (ok) {
    state.checked = true;
    state.score += 10;
    practiceScore.textContent = `Puan: ${state.score}`;
    practiceFeedback.textContent = "Harika! Tamamen doğru.";
    practiceFeedback.className = "practice-feedback ok";
    nextPractice.disabled = false;
    speak("Harika, doğru cevap!");
    if (typeof gsap !== "undefined") {
      try {
        gsap.fromTo(practiceSentence, { scale: 1 }, { scale: 1.02, duration: 0.12, yoyo: true, repeat: 1 });
      } catch (_) {}
    }
  } else {
    state.checked = false;
    nextPractice.disabled = true;
    practiceFeedback.textContent = "Bazı işaretler yanlış. Dolu kutuya tekrar dokunarak silip yeniden dene.";
    practiceFeedback.className = "practice-feedback bad";
    speak("Bir daha dene.");
  }
}

function nextPracticeItem() {
  if (state.practiceIndex < state.practiceOrder.length - 1) {
    state.practiceIndex += 1;
    renderPractice();
  } else {
    practiceFeedback.textContent = `Tebrikler! ${state.practiceOrder.length} cümleyi tamamladın. Puanın: ${state.score}`;
    practiceFeedback.className = "practice-feedback ok";
    nextPractice.disabled = true;
    speak("Tebrikler, tüm cümleleri bitirdin!");
  }
}

function openPracticeMode() {
  cleanupDrag();
  state.practiceOrder = shuffle(PRACTICE_POOL.map((_, i) => i));
  state.practiceIndex = 0;
  state.score = 0;
  state.checked = false;
  document.body.classList.remove("mode-learn");
  document.body.classList.add("mode-practice");
  practiceView.hidden = false;
  renderPractice();
  speak("Uygulama modu. Boşluklara doğru işaretleri yerleştir.");
}

function closePracticeMode() {
  cleanupDrag();
  if (practiceSentence) practiceSentence.innerHTML = "";
  if (palette) palette.innerHTML = "";
  practiceFeedback.textContent = "";
  practiceFeedback.className = "practice-feedback";
  state.checked = false;
  practiceView.hidden = true;
  document.body.classList.add("mode-learn");
  document.body.classList.remove("mode-practice");
}

function init() {
  renderMarkNav();
  renderLearn();

  backBtn?.addEventListener("click", () => {
    window.location.href = "../../index.html";
  });

  toggleSound?.addEventListener("click", () => {
    state.sound = !state.sound;
    toggleSound.setAttribute("aria-pressed", state.sound ? "true" : "false");
    if (state.sound) speak("Ses açık");
  });

  openPractice?.addEventListener("click", openPracticeMode);
  closePractice?.addEventListener("click", closePracticeMode);
  checkPracticeBtn?.addEventListener("click", checkPracticeAnswer);
  nextPractice?.addEventListener("click", nextPracticeItem);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !practiceView.hidden) closePracticeMode();
  });
}

init();

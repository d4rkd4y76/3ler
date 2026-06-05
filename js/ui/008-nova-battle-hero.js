/* Savaş kahramanları — mağaza, ana ekran, tek kişilik doğru cevap FX */
(function () {
  /** Test: tüm kahraman satın alma fiyatı 1 elmas (prod öncesi kapat) */
  var NOVA_TEST_HERO_ECONOMY = true;
  try { window.NOVA_TEST_HERO_ECONOMY = NOVA_TEST_HERO_ECONOMY; } catch (_) {}

  function heroPurchaseCost(raw) {
    if (NOVA_TEST_HERO_ECONOMY) return 1;
    return Math.max(0, Number(raw) || 0);
  }

  var HERO_REGISTRY = {
    blaze_robot: {
      id: 'blaze_robot',
      retired: true,
      templateKey: 'NOVA_BLAZE_BOT_SVG_TEMPLATE',
      theme: 'blaze',
      name: 'Alev Bot',
      desc: 'Göğsünden alev fışkırtan eğlenceli savaş robotu. Doğru cevaplarda seni motive eder!',
      price: 5000,
      order: 1,
      equipEmoji: '🔥',
      lines: {
        cheer: [
          { msg: 'Tam isabet! Robot onaylıyor — harikasın!', badge: '✓ DOĞRU' },
          { msg: 'Beynin alev gibi çalışıyor, böyle devam!', badge: '✓ DOĞRU' },
          { msg: 'İşte bu! Süper bir cevap verdin!', badge: '✓ DOĞRU' },
          { msg: 'Doğru bildin — güç modun açıldı!', badge: '✓ DOĞRU' },
          { msg: 'Vay canına, sen gerçek bir şampiyonsun!', badge: '✓ DOĞRU' },
          { msg: 'Mükemmel! Bir sonraki soruya da hazırsın!', badge: '✓ DOĞRU' },
          { msg: 'Robot gözleri parladı: bravo sana!', badge: '✓ DOĞRU' }
        ],
        fire: [
          { msg: 'ALEV PATLAMASI! İnanılmaz bir cevap!', badge: '🔥 SÜPER GÜÇ' },
          { msg: 'Isındın! Tam gaz devam et şampiyon!', badge: '🔥 SÜPER GÜÇ' },
          { msg: 'GÜÇ MODU AÇIK — muhteşem vuruş!', badge: '🔥 SÜPER GÜÇ' }
        ],
        epic: [
          { msg: 'EFSANE CEVAP! Bugün sen kralsın!', badge: '👑 EFSANE' },
          { msg: 'MUHTEŞEM! Robot selam durdu sana!', badge: '👑 EFSANE' },
          { msg: 'Tam puan hissi — inanılmazsın!', badge: '👑 EFSANE' }
        ]
      }
    },
    star_fairy: {
      id: 'star_fairy',
      sprite: 'hero/yildiz_perisi/sprite',
      theme: 'star',
      name: 'Yıldız Perisi',
      desc: 'Kozmik güçle seni kutlayan yıldız perisi. Mağazada, ana ekranda ve doğru cevaplarda seni kutlar!',
      price: 6500,
      order: 2,
      equipEmoji: '✨',
      lines: {
        cheer: [
          { msg: 'Yıldız gibi parladın — peri çok mutlu!', badge: '✨ SİHİR' },
          { msg: 'Harika cevap! Evren seninle dans ediyor!', badge: '✨ SİHİR' },
          { msg: 'Takımyıldızı kadar net bildin, bravo!', badge: '✨ SİHİR' },
          { msg: 'Işığın göz kamaştırıyor — süpersin!', badge: '✨ SİHİR' },
          { msg: 'Sihirli bir cevap! Böyle devam et!', badge: '✨ SİHİR' },
          { msg: 'Peri onayladı: sen harika öğrencisin!', badge: '✨ SİHİR' },
          { msg: 'Gökyüzü bugün senin için parlıyor!', badge: '✨ SİHİR' }
        ],
        fire: [
          { msg: 'YILDIZ PATLAMASI! Kozmik bir cevap!', badge: '💫 KOZMİK' },
          { msg: 'Kozmik güç açık — ışıldıyorsun!', badge: '💫 KOZMİK' },
          { msg: 'Yıldız tozu saçıldı — muhteşemsin!', badge: '💫 KOZMİK' }
        ],
        epic: [
          { msg: 'KOZMİK ZAFER! Galaksi seviyesindesin!', badge: '🌟 GALAKSİ' },
          { msg: 'Yıldızların şampiyonusun bugün — muhteşem!', badge: '🌟 GALAKSİ' },
          { msg: 'EFSANE! Peri seni alkışlıyor!', badge: '🌟 GALAKSİ' }
        ]
      }
    },
    turbo_turtle: {
      id: 'turbo_turtle',
      retired: true,
      templateKey: 'NOVA_TURBO_TURTLE_SVG_TEMPLATE',
      theme: 'turbo',
      name: 'Kaplumbağa Turbo',
      desc: 'Kabuğunda turbo gücü olan sevimli yarışçı. Doğru cevaplarda hızla seni kutlar!',
      price: 5500,
      order: 3,
      equipEmoji: '🐢',
      lines: {
        cheer: [
          { msg: 'Turbo hızında doğru cevap — vınn!', badge: '🏁 TURBO' },
          { msg: 'Harika! Turbo modun açık, devam!', badge: '🏁 TURBO' },
          { msg: 'Kabuğun parlıyor — süpersin!', badge: '🏁 TURBO' },
          { msg: 'Bitiş çizgisine çok yakınsın, bravo!', badge: '🏁 TURBO' },
          { msg: 'Roket gibi gidiyorsun, şampiyon!', badge: '🏁 TURBO' },
          { msg: 'Kaplumbağa gücü + zeka = sen kazandın!', badge: '🏁 TURBO' },
          { msg: 'Doğru cevap! Tekerlekler duman attı!', badge: '🏁 TURBO' }
        ],
        fire: [
          { msg: 'TURBO PATLAMASI! Nitro açıldı!', badge: '💨 NİTRO' },
          { msg: 'Işık hızında doğru — inanılmaz!', badge: '💨 NİTRO' },
          { msg: 'NİTRO MODU: pist senin!', badge: '💨 NİTRO' }
        ],
        epic: [
          { msg: 'TURBO ŞAMPİYON! Pistin kralı sensin!', badge: '🏆 PİST KRALI' },
          { msg: 'EFSANE TUR! Herkes seni alkışlıyor!', badge: '🏆 PİST KRALI' },
          { msg: 'Tam gaz zafer — muhteşem cevap!', badge: '🏆 PİST KRALI' }
        ]
      }
    },
    mythic_wyvern: {
      id: 'mythic_wyvern',
      retired: true,
      templateKey: 'NOVA_MYTHIC_WYVERN_SVG_TEMPLATE',
      theme: 'mythic',
      name: 'Çılgın Kanat',
      desc: 'Gökyüzünde süzülen süper hızlı kuş! Doğru cevaplarda renkli kutlamalar yapar!',
      price: 9900,
      order: 4,
      equipEmoji: '🪽',
      lines: {
        cheer: [
          { msg: 'Harika! Efsun yükseldi — devam!', badge: '✓ DOĞRU' },
          { msg: 'Doğru! Gök seninle parlıyor!', badge: '✓ DOĞRU' },
          { msg: 'Mükemmel! Bir adım daha güçlendin!', badge: '✓ DOĞRU' }
        ],
        fire: [
          { msg: 'SÜPER GÜÇ! Harika vuruş!', badge: '⚡ SÜPER' },
          { msg: 'Çok iyi! Hızın arttı!', badge: '⚡ SÜPER' },
          { msg: 'Müthiş! Tam isabet!', badge: '⚡ SÜPER' }
        ],
        epic: [
          { msg: 'EFSANE! Kanatların uçuyor!', badge: '👑 EFSANE' },
          { msg: 'MUHTEŞEM! Gökyüzü senin!', badge: '👑 EFSANE' },
          { msg: 'SÜPER! Bugün harikasın!', badge: '👑 EFSANE' }
        ]
      }
    }
    ,
    bilge_hayalet: {
      id: 'bilge_hayalet',
      retired: true,
      templateKey: 'NOVA_BILGE_HAYALET_SVG_TEMPLATE',
      theme: 'bilge',
      name: 'Sihirli Buba',
      desc: 'Sihirli Buba sana “aferin!” der. Doğru cevaplarda ışık saçıp kutlama yapar!',
      price: 8800,
      order: 5,
      equipEmoji: '👻',
      lines: {
        cheer: [
          { msg: 'Aferin! Harika bildin!', badge: '✨ AFERİN' },
          { msg: 'Doğru! Çok zekisin!', badge: '✨ AFERİN' },
          { msg: 'Süper! Böyle devam!', badge: '✨ AFERİN' },
          { msg: 'Bravo! Tam isabet!', badge: '✨ AFERİN' }
        ],
        fire: [
          { msg: 'IŞIK PATLAMASI! Çok güçlü cevap!', badge: '💡 SÜPER' },
          { msg: 'Parıldadın! Harikasın!', badge: '💡 SÜPER' },
          { msg: 'Müthiş! Devam et!', badge: '💡 SÜPER' }
        ],
        epic: [
          { msg: 'EFSANE! Buba seninle gurur duyuyor!', badge: '👑 EFSANE' },
          { msg: 'MUHTEŞEM! Harika gidiyorsun!', badge: '👑 EFSANE' },
          { msg: 'ŞAMPİYON! Bugün çok iyisin!', badge: '👑 EFSANE' }
        ]
      }
    }
    ,
    simsek_sincap: {
      id: 'simsek_sincap',
      retired: true,
      templateKey: 'NOVA_SIMSEK_SINCAP_SVG_TEMPLATE',
      theme: 'simsek',
      name: 'Parlak Pati',
      desc: 'Parlak Pati patileriyle parlar! Doğru cevaplarda ışıl ışıl kutlama yapar!',
      price: 9400,
      order: 6,
      equipEmoji: '🐾',
      lines: {
        cheer: [
          { msg: 'Parladın! Harika bildin!', badge: '✨ PARLAK' },
          { msg: 'Süper! Patilerin ışıldı!', badge: '✨ PARLAK' },
          { msg: 'Bravo! Tam isabet!', badge: '✨ PARLAK' },
          { msg: 'Aferin! Çok iyi gidiyorsun!', badge: '✨ PARLAK' }
        ],
        fire: [
          { msg: 'IŞIL IŞIL! Müthiş cevap!', badge: '💫 GÜÇ' },
          { msg: 'Parlak vuruş! Devam!', badge: '💫 GÜÇ' },
          { msg: 'Çok güçlü! Harikasın!', badge: '💫 GÜÇ' }
        ],
        epic: [
          { msg: 'EFSANE! Patilerin parlıyor!', badge: '👑 EFSANE' },
          { msg: 'MUHTEŞEM! Sen tam bir şampiyonsun!', badge: '👑 EFSANE' },
          { msg: 'SÜPER! Bugün inanılmazsın!', badge: '👑 EFSANE' }
        ]
      }
    },
    firtina_okcu: {
      id: 'firtina_okcu',
      sprite: 'hero/firtina_okcusu/sprite',
      theme: 'firtina',
      name: 'Fırtına Okçusu',
      desc: 'Yıldırım hızında ok atan efsane okçu! Mağazada, ana ekranda ve doğru cevaplarda seni kutlar.',
      price: 10200,
      order: 7,
      equipEmoji: '🏹',
      lines: {
        cheer: [
          { msg: 'Tam isabet! Okçu onaylıyor — harikasın!', badge: '✓ DOĞRU' },
          { msg: 'Yıldırım gibi doğru cevap — süpersin!', badge: '✓ DOĞRU' },
          { msg: 'Bravo! Hedefi on ikiden vurdun!', badge: '✓ DOĞRU' },
          { msg: 'Mükemmel nişan — böyle devam!', badge: '✓ DOĞRU' }
        ],
        fire: [
          { msg: 'FIRTINA VURUŞU! Muhteşem cevap!', badge: '⚡ SÜPER' },
          { msg: 'Yıldırım hızında doğru — inanılmaz!', badge: '⚡ SÜPER' },
          { msg: 'Ok fırtınası! Tam gaz devam!', badge: '⚡ SÜPER' }
        ],
        epic: [
          { msg: 'EFSANE OK! Bugün sen kralsın!', badge: '👑 EFSANE' },
          { msg: 'MUHTEŞEM! Fırtına seninle!', badge: '👑 EFSANE' },
          { msg: 'SÜPER! Okçu tacı senin!', badge: '👑 EFSANE' }
        ]
      }
    },
    tas_muhafiz: {
      id: 'tas_muhafiz',
      sprite: 'hero/tas_muhafiz/sprite',
      theme: 'tas',
      name: 'Taş Muhafız',
      desc: 'Taştan dövülmüş koruyucu! Mağazada, ana ekranda ve doğru cevaplarda seni kutlar.',
      price: 10800,
      order: 11,
      equipEmoji: '🗿',
      lines: {
        cheer: [
          { msg: 'Sağlam cevap! Muhafız onayladı — harikasın!', badge: '✓ DOĞRU' },
          { msg: 'Kaya gibi sağlam bildin — süpersin!', badge: '✓ DOĞRU' },
          { msg: 'Bravo! Savunma hattın çelik gibi!', badge: '✓ DOĞRU' },
          { msg: 'Mükemmel! Böyle devam et!', badge: '✓ DOĞRU' }
        ],
        fire: [
          { msg: 'TAŞ DARBESİ! Muhteşem cevap!', badge: '💎 SÜPER' },
          { msg: 'Yer sarsıldı — doğru cevap!', badge: '💎 SÜPER' },
          { msg: 'Granit güç! Tam gaz devam!', badge: '💎 SÜPER' }
        ],
        epic: [
          { msg: 'EFSANE MUHAFIZ! Bugün sen kralsın!', badge: '👑 EFSANE' },
          { msg: 'MUHTEŞEM! Taş kale senin!', badge: '👑 EFSANE' },
          { msg: 'SÜPER! Koruyucu tacı senin!', badge: '👑 EFSANE' }
        ]
      }
    },
    golge_parsi: {
      id: 'golge_parsi',
      sprite: 'hero/golge_parsi/sprite',
      theme: 'golge',
      name: 'Gölge Parsı',
      desc: 'Gölgelerden süzülen çevik avcı! Mağazada, ana ekranda ve doğru cevaplarda seni kutlar.',
      price: 11200,
      order: 12,
      equipEmoji: '🐆',
      lines: {
        cheer: [
          { msg: 'Sessiz ve doğru! Parsı onayladı — harikasın!', badge: '✓ DOĞRU' },
          { msg: 'Gölgeden isabet — süpersin!', badge: '✓ DOĞRU' },
          { msg: 'Bravo! Adımın hafif, cevabın keskin!', badge: '✓ DOĞRU' },
          { msg: 'Mükemmel! Böyle devam et!', badge: '✓ DOĞRU' }
        ],
        fire: [
          { msg: 'GÖLGE SALDIRISI! Muhteşem cevap!', badge: '🌙 SÜPER' },
          { msg: 'Gece pençesi isabet etti — doğru!', badge: '🌙 SÜPER' },
          { msg: 'Çevik vuruş! Tam gaz devam!', badge: '🌙 SÜPER' }
        ],
        epic: [
          { msg: 'EFSANE PARSI! Bugün sen kralsın!', badge: '👑 EFSANE' },
          { msg: 'MUHTEŞEM! Gölge krallığı senin!', badge: '👑 EFSANE' },
          { msg: 'SÜPER! Gece tacı senin!', badge: '👑 EFSANE' }
        ]
      }
    },
    bilge_baykus: {
      id: 'bilge_baykus',
      sprite: 'hero/bilge_baykus/sprite',
      theme: 'baykus',
      name: 'Bilge Baykuş',
      desc: 'Bilgeliği kanatlarıyla taşıyan usta! Mağazada, ana ekranda ve doğru cevaplarda seni kutlar.',
      price: 11400,
      order: 13,
      equipEmoji: '🦉',
      lines: {
        cheer: [
          { msg: 'Doğru cevap! Baykuş onayladı — harikasın!', badge: '✓ DOĞRU' },
          { msg: 'Bilgece bildin — süpersin!', badge: '✓ DOĞRU' },
          { msg: 'Bravo! Gözlerin keskin, cevabın doğru!', badge: '✓ DOĞRU' },
          { msg: 'Mükemmel! Böyle devam et!', badge: '✓ DOĞRU' }
        ],
        fire: [
          { msg: 'BİLGE VURUŞ! Muhteşem cevap!', badge: '🦉 SÜPER' },
          { msg: 'Kanat darbesi isabet etti — doğru!', badge: '🦉 SÜPER' },
          { msg: 'Usta taktik! Tam gaz devam!', badge: '🦉 SÜPER' }
        ],
        epic: [
          { msg: 'EFSANE BAYKUŞ! Bugün sen kralsın!', badge: '👑 EFSANE' },
          { msg: 'MUHTEŞEM! Bilgelik tacı senin!', badge: '👑 EFSANE' },
          { msg: 'SÜPER! Gece avcısı senin!', badge: '👑 EFSANE' }
        ]
      }
    },
    buz_ejder: {
      id: 'buz_ejder',
      epic: true,
      templateKey: 'NOVA_BUZ_EJDER_SVG_TEMPLATE',
      sprite: 'hero/ice_dragon/sprite',
      theme: 'buz',
      name: 'Buz Ejderi',
      desc: 'Kristal pulları ve buz nefesiyle dondurucu güç! Doğru cevaplarda kar fırtınası kopar!',
      price: 12800,
      order: 8,
      equipEmoji: '🐲',
      lines: {
        cheer: [
          { msg: 'Harika! Buz Ejderi seninle gurur duyuyor!', badge: '❄️ BUZ' },
          { msg: 'Doğru cevap! Kristaller parladı!', badge: '❄️ BUZ' },
          { msg: 'Bravo! Donmuş kesinlikle doğru!', badge: '❄️ BUZ' },
          { msg: 'Süper! Buz nefesi onayladı!', badge: '❄️ BUZ' }
        ],
        fire: [
          { msg: 'BUZ FIRTINASI! Muhteşem cevap!', badge: '❄️ GÜÇ' },
          { msg: 'Kristal patlaması! Devam şampiyon!', badge: '❄️ GÜÇ' },
          { msg: 'Dondurucu isabet! İnanılmazsın!', badge: '❄️ GÜÇ' }
        ],
        epic: [
          { msg: 'EFSANE! Kutup tacı senin!', badge: '👑 EFSANE' },
          { msg: 'MUHTEŞEM! Buz krallığı açıldı!', badge: '👑 EFSANE' },
          { msg: 'SÜPER! Kar fırtınası seninle!', badge: '👑 EFSANE' }
        ]
      }
    },
    alev_ejder: {
      id: 'alev_ejder',
      epic: true,
      templateKey: 'NOVA_ALEV_EJDER_SVG_TEMPLATE',
      sprite: 'hero/flame_dragon/sprite',
      theme: 'alev',
      name: 'Alev Ejderi',
      desc: 'Alev pulları ve ateş nefesiyle yakıcı güç! Doğru cevaplarda alev fırtınası kopar!',
      price: 13200,
      order: 9,
      equipEmoji: '🔥',
      lines: {
        cheer: [
          { msg: 'Harika! Alev Ejderi seninle gurur duyuyor!', badge: '🔥 ALEV' },
          { msg: 'Doğru cevap! Alevler parladı!', badge: '🔥 ALEV' },
          { msg: 'Bravo! Kızgın kesinlikle doğru!', badge: '🔥 ALEV' },
          { msg: 'Süper! Ateş nefesi onayladı!', badge: '🔥 ALEV' }
        ],
        fire: [
          { msg: 'ALEV FIRTINASI! Muhteşem cevap!', badge: '🔥 GÜÇ' },
          { msg: 'Alev patlaması! Devam şampiyon!', badge: '🔥 GÜÇ' },
          { msg: 'Yakıcı isabet! İnanılmazsın!', badge: '🔥 GÜÇ' }
        ],
        epic: [
          { msg: 'EFSANE! Alev tacı senin!', badge: '👑 EFSANE' },
          { msg: 'MUHTEŞEM! Ateş krallığı açıldı!', badge: '👑 EFSANE' },
          { msg: 'SÜPER! Alev fırtınası seninle!', badge: '👑 EFSANE' }
        ]
      }
    },
    gece_ejder: {
      id: 'gece_ejder',
      epic: true,
      templateKey: 'NOVA_GECE_EJDER_SVG_TEMPLATE',
      sprite: 'hero/dark_dragon/sprite',
      theme: 'gece',
      name: 'Gece Ejderi',
      desc: 'Gece pulları ve gölge nefesiyle karanlık güç! Doğru cevaplarda ay fırtınası kopar!',
      price: 13600,
      order: 10,
      equipEmoji: '🌙',
      lines: {
        cheer: [
          { msg: 'Harika! Gece Ejderi seninle gurur duyuyor!', badge: '🌙 GECE' },
          { msg: 'Doğru cevap! Yıldızlar parladı!', badge: '🌙 GECE' },
          { msg: 'Bravo! Gölge kesinlikle doğru!', badge: '🌙 GECE' },
          { msg: 'Süper! Ay ışığı onayladı!', badge: '🌙 GECE' }
        ],
        fire: [
          { msg: 'AY FIRTINASI! Muhteşem cevap!', badge: '🌙 GÜÇ' },
          { msg: 'Gece patlaması! Devam şampiyon!', badge: '🌙 GÜÇ' },
          { msg: 'Karanlık isabet! İnanılmazsın!', badge: '🌙 GÜÇ' }
        ],
        epic: [
          { msg: 'EFSANE! Gece tacı senin!', badge: '👑 EFSANE' },
          { msg: 'MUHTEŞEM! Gölge krallığı açıldı!', badge: '👑 EFSANE' },
          { msg: 'SÜPER! Ay fırtınası seninle!', badge: '👑 EFSANE' }
        ]
      }
    }
  };

  var fxBusy = false;
  var correctFxCount = 0;
  var uidSeq = 0;
  var heroCatalogCache = null;
  var mainHeroRefreshTimer = null;
  var mainHeroRefreshGen = 0;
  var mainHeroMounting = false;

  /** Eski SVG temel kahramanlar — performans için devre dışı (sprite kahramanlar kalır). */
  var RETIRED_SVG_HERO_IDS = {
    blaze_robot: true,
    turbo_turtle: true,
    mythic_wyvern: true,
    bilge_hayalet: true,
    simsek_sincap: true
  };

  var SPRITE_HERO_ORDER = [
    'star_fairy', 'tas_muhafiz', 'golge_parsi', 'bilge_baykus', 'firtina_okcu',
    'buz_ejder', 'alev_ejder', 'gece_ejder'
  ];

  function isRetiredSvgHero(heroId) {
    return !!RETIRED_SVG_HERO_IDS[String(heroId || '').trim()];
  }

  function isSpriteHeroDef(def) {
    if (!def || isRetiredSvgHero(def.id)) return false;
    if (def.sprite) return true;
    if (typeof window.novaIsEpicDragonHero === 'function' && window.novaIsEpicDragonHero(def.id)) {
      return typeof window.novaEpicDragonMountSprite === 'function';
    }
    return false;
  }

  function isHeroEquippedOnData(heroId, data) {
    var hid = String(heroId || '').trim();
    if (!hid || !data) return false;
    return String(data.battleHero || '').trim() === hid;
  }

  function canShowEquippedHero(heroId, data) {
    if (!heroId || !isSpriteHeroDef(getHeroDef(heroId))) return false;
    if (ownsHero(data, heroId)) return true;
    if (isHeroEquippedOnData(heroId, data)) return true;
    var s = getStudent();
    return !!(s && String(s.battleHero || '').trim() === String(heroId).trim());
  }

  function resolvePlayableHeroId(heroId, userData) {
    var id = String(heroId || '').trim();
    if (id && !isRetiredSvgHero(id) && isSpriteHeroDef(getHeroDef(id))) {
      if (!userData || ownsHero(userData, id) || isHeroEquippedOnData(id, userData)) return id;
    }
    var i;
    for (i = 0; i < SPRITE_HERO_ORDER.length; i++) {
      var cand = SPRITE_HERO_ORDER[i];
      if (userData && ownsHero(userData, cand) && isSpriteHeroDef(getHeroDef(cand))) return cand;
    }
    return 'star_fairy';
  }

  function getHeroDef(heroId) {
    if (!heroId) return null;
    return HERO_REGISTRY[String(heroId).trim()] || null;
  }

  function isEpicStoreHero(heroOrId) {
    var id = typeof heroOrId === 'string' ? heroOrId : (heroOrId && heroOrId.id);
    if (!id) return false;
    if (typeof window.novaIsEpicDragonHero === 'function' && window.novaIsEpicDragonHero(id)) return true;
    var def = getHeroDef(id);
    return !!(def && def.epic);
  }

  function filterHeroCatalogByStoreCategory(catalog, category) {
    if (!Array.isArray(catalog)) return [];
    if (category === '__battleHeroesEpik') {
      return catalog.filter(function (h) { return isEpicStoreHero(h) && isSpriteHeroDef(getHeroDef(h.id)); });
    }
    if (category === '__battleHeroesTemel') {
      return catalog.filter(function (h) {
        return !isEpicStoreHero(h) && isSpriteHeroDef(getHeroDef(h.id));
      });
    }
    return catalog.filter(function (h) { return isSpriteHeroDef(getHeroDef(h.id)); });
  }

  function getStudent() {
    try {
      if (typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId) {
        return selectedStudent;
      }
      return JSON.parse(localStorage.getItem('selectedStudent') || 'null');
    } catch (_) {
      return null;
    }
  }

  function syncHeroToStudent(data) {
    var s = getStudent();
    if (!s || !data) return;
    if (Object.prototype.hasOwnProperty.call(data, 'battleHero')) {
      s.battleHero = data.battleHero || null;
    }
    if (data.purchasedBattleHeroes) {
      s.purchasedBattleHeroes = data.purchasedBattleHeroes;
    }
    if (data.heroTrials) s.heroTrials = data.heroTrials;
    if (data.dragonTrials) s.dragonTrials = data.dragonTrials;
    if (data.heroTrialPending) s.heroTrialPending = data.heroTrialPending;
    if (data.dragonTrialPending) s.dragonTrialPending = data.dragonTrialPending;
    if (data.dragonEggs) s.dragonEggs = data.dragonEggs;
    if (data.dragonEggMeta) s.dragonEggMeta = data.dragonEggMeta;
    if (Object.prototype.hasOwnProperty.call(data, 'diamond')) s.diamond = data.diamond;
    try {
      window.selectedStudent = s;
      localStorage.setItem('selectedStudent', JSON.stringify(s));
    } catch (_) {}
  }

  function getEquippedHeroId() {
    var s = getStudent();
    return (s && s.battleHero) ? String(s.battleHero).trim() : '';
  }

  function getEquippedHeroDef() {
    return getHeroDef(getEquippedHeroId());
  }

  function isMainScreenVisible() {
    var main = document.getElementById('main-screen');
    if (!main) return false;
    try {
      var st = window.getComputedStyle(main);
      return st.display !== 'none' && st.visibility !== 'hidden';
    } catch (_) {
      return main.style.display !== 'none';
    }
  }

  async function loadBattleHeroFromDb() {
    var s = getStudent();
    if (!s || !s.classId || !s.studentId || typeof database === 'undefined') return '';
    try {
      var snap = await database.ref('classes/' + s.classId + '/students/' + s.studentId + '/battleHero').once('value');
      var heroId = snap.exists() ? String(snap.val() || '').trim() : '';
      syncHeroToStudent({ battleHero: heroId || null });
      return heroId;
    } catch (e) {
      console.warn('loadBattleHeroFromDb', e);
      return getEquippedHeroId();
    }
  }

  function clearMainHeroSlot(slot) {
    var zone = document.getElementById('nova-main-hero-zone');
    if (zone) {
      zone.classList.remove(
        'is-visible',
        'nova-main-hero-zone--blaze', 'nova-main-hero-zone--star', 'nova-main-hero-zone--turbo',
        'nova-main-hero-zone--mythic', 'nova-main-hero-zone--bilge', 'nova-main-hero-zone--simsek',
        'nova-main-hero-zone--firtina', 'nova-main-hero-zone--tas', 'nova-main-hero-zone--golge', 'nova-main-hero-zone--baykus', 'nova-main-hero-zone--buz', 'nova-main-hero-zone--alev', 'nova-main-hero-zone--gece'
      );
      zone.setAttribute('aria-hidden', 'true');
      zone.querySelectorAll('[data-nova-hero-host], [data-nova-main-hero]').forEach(function (h) {
        unmountHeroFromHost(h);
      });
    }
    if (!slot) slot = document.getElementById('nova-main-hero-slot');
    if (!slot) return;
    slot.querySelectorAll('[data-nova-hero-host], [data-nova-main-hero]').forEach(function (h) {
      unmountHeroFromHost(h);
    });
    slot.innerHTML = '';
    slot.classList.remove(
      'nova-main-hero-slot--blaze', 'nova-main-hero-slot--star', 'nova-main-hero-slot--turbo',
      'nova-main-hero-slot--mythic', 'nova-main-hero-slot--bilge', 'nova-main-hero-slot--simsek',
      'nova-main-hero-slot--firtina', 'nova-main-hero-slot--tas', 'nova-main-hero-slot--golge', 'nova-main-hero-slot--baykus', 'nova-main-hero-slot--buz', 'nova-main-hero-slot--alev', 'nova-main-hero-slot--gece'
    );
  }

  function mountMainScreenHero(heroId) {
    var def = getHeroDef(heroId);
    var zone = document.getElementById('nova-main-hero-zone');
    var slot = document.getElementById('nova-main-hero-slot');
    if (!def || !zone || !slot) return;
    if (!isSpriteHeroDef(def)) return;
    if (mainHeroMounting) return;

    var existing = slot.querySelector(':scope > [data-nova-main-hero]');
    if (existing) {
      if (existing.getAttribute('data-nova-main-hero') === heroId) {
        var c = existing.querySelector('canvas');
        if (c && c.width > 0 && c.height > 0) return;
        if (existing.querySelector('svg')) return;
        unmountHeroFromHost(existing);
        existing.remove();
      } else {
        clearMainHeroSlot(slot);
      }
    }

    mainHeroMounting = true;
    try {
      zone.setAttribute('aria-hidden', 'false');
      zone.classList.add('is-visible', 'nova-main-hero-zone--' + def.theme);
      slot.classList.add('nova-main-hero-slot--' + def.theme);
      var host = document.createElement('div');
      host.className = 'nova-hero-svg-host nova-main-hero-host nova-hero-mount--' + heroId.replace(/_/g, '-');
      host.setAttribute('data-nova-main-hero', heroId);
      slot.appendChild(host);
      window.__novaEquippedHeroId = heroId;
      mountHeroInto(host, heroId);
    } finally {
      mainHeroMounting = false;
    }
  }

  async function refreshMainScreenHeroCore() {
    var slot = document.getElementById('nova-main-hero-slot');
    if (!slot) return;
    if (!isMainScreenVisible() && !window.__novaBootMainPrep) {
      clearMainHeroSlot(slot);
      return;
    }
    var s = getStudent();
    if (!s || !s.classId || !s.studentId) {
      clearMainHeroSlot(slot);
      return;
    }
    var heroId = getEquippedHeroId();
    if (!heroId) heroId = await loadBattleHeroFromDb();
    try {
      var data = null;
      var cache = window.__novaMainScreenStudentCache;
      var cacheAt = Number(window.__novaMainScreenStudentCacheAt || 0);
      if (cache && cacheAt && Date.now() - cacheAt < 120000) {
        data = cache;
      } else {
        var snap = await database.ref('classes/' + s.classId + '/students/' + s.studentId).once('value');
        data = snap.val() || {};
        window.__novaMainScreenStudentCache = data;
        window.__novaMainScreenStudentCacheAt = Date.now();
      }
      var dbEquipped = String(data.battleHero || '').trim();
      if (!heroId && dbEquipped) heroId = dbEquipped;
      heroId = resolvePlayableHeroId(heroId, data);
      if (isRetiredSvgHero(data.battleHero) && heroId && data.battleHero !== heroId) {
        try {
          await database.ref('classes/' + s.classId + '/students/' + s.studentId).update({ battleHero: heroId });
          syncHeroToStudent({ battleHero: heroId });
        } catch (_) {}
      }
      var def = getHeroDef(heroId);
      if (!heroId || !def || !canShowEquippedHero(heroId, data)) {
        clearMainHeroSlot(slot);
        return;
      }
      window.__novaEquippedHeroId = heroId;
      try {
        syncHeroToStudent({
          battleHero: heroId,
          purchasedBattleHeroes: data.purchasedBattleHeroes
        });
        window.__novaMainHeroLevelFetched = getHeroLevel(data, heroId);
      } catch (_) {}
      if (typeof window.novaSpritePreloadHero === 'function') {
        try { window.novaSpritePreloadHero(heroId); } catch (_) {}
      }
      mountMainScreenHero(heroId);
      if (heroId === 'firtina_okcu' && typeof window.novaFirtinaOkcuPreloadTrueClipsIfEquipped === 'function') {
        window.novaFirtinaOkcuPreloadTrueClipsIfEquipped();
      }
      if (heroId === 'star_fairy' && typeof window.novaYildizPerisiPreloadTrueClipsIfEquipped === 'function') {
        window.novaYildizPerisiPreloadTrueClipsIfEquipped();
      }
      if (heroId === 'tas_muhafiz' && typeof window.novaTasMuhafizPreloadTrueClipsIfEquipped === 'function') {
        window.novaTasMuhafizPreloadTrueClipsIfEquipped();
      }
      if (heroId === 'golge_parsi' && typeof window.novaGolgeParsiPreloadTrueClipsIfEquipped === 'function') {
        window.novaGolgeParsiPreloadTrueClipsIfEquipped();
      }
      if (heroId === 'bilge_baykus' && typeof window.novaBilgeBaykusPreloadTrueClipsIfEquipped === 'function') {
        window.novaBilgeBaykusPreloadTrueClipsIfEquipped();
      }
      if (heroId === 'buz_ejder' && typeof window.novaBuzEjderPreloadTrueClipsIfEquipped === 'function') {
        window.novaBuzEjderPreloadTrueClipsIfEquipped();
      }
      if (heroId === 'alev_ejder' && typeof window.novaAlevEjderPreloadTrueClipsIfEquipped === 'function') {
        window.novaAlevEjderPreloadTrueClipsIfEquipped();
      }
      if (heroId === 'gece_ejder' && typeof window.novaGeceEjderPreloadTrueClipsIfEquipped === 'function') {
        window.novaGeceEjderPreloadTrueClipsIfEquipped();
      }
    } catch (_) {
      clearMainHeroSlot(slot);
    }
  }

  async function refreshMainScreenHero(opts) {
    opts = opts || {};
    var myGen = ++mainHeroRefreshGen;
    if (mainHeroRefreshTimer) clearTimeout(mainHeroRefreshTimer);
    var delay = opts.urgent || window.__novaBootMainPrep ? 0 : 100;
    if (!delay) {
      if (myGen !== mainHeroRefreshGen) return;
      await refreshMainScreenHeroCore();
      return;
    }
    return new Promise(function (resolve) {
      mainHeroRefreshTimer = setTimeout(async function () {
        mainHeroRefreshTimer = null;
        if (myGen !== mainHeroRefreshGen) {
          resolve();
          return;
        }
        await refreshMainScreenHeroCore();
        resolve();
      }, delay);
    });
  }

  function isHeroEquipped(data) {
    var localId = getEquippedHeroId();
    var dbId = data && data.battleHero ? String(data.battleHero).trim() : '';
    var heroId = localId || dbId;
    if (!heroId || !getHeroDef(heroId)) return false;

    var s = getStudent();
    var purchases = (data && data.purchasedBattleHeroes) || (s && s.purchasedBattleHeroes) || {};
    if (!ownsHero({ purchasedBattleHeroes: purchases }, heroId)) return false;

    if (dbId && localId && dbId !== localId) return localId === heroId;
    return true;
  }

  function parseHeroOwn(val) {
    if (!val) return { owned: false, level: 0 };
    if (val === true) return { owned: true, level: 1 };
    if (typeof val === 'object') {
      return { owned: true, level: Math.min(4, Math.max(1, Number(val.level) || 1)) };
    }
    return { owned: !!val, level: val ? 1 : 0 };
  }

  function getHeroLevel(data, heroId) {
    if (!data || !heroId) return 0;
    var lvl = parseHeroOwn(data.purchasedBattleHeroes && data.purchasedBattleHeroes[heroId]).level;
    if (lvl >= 1) return lvl;
    if (heroTrialUntilMs(data, heroId) > Date.now()) return 1;
    return 0;
  }

  function heroTrialUntilMs(data, heroId) {
    if (!data || !heroId) return 0;
    var now = Date.now();
    var maps = [data.heroTrials, data.dragonTrials];
    var best = 0;
    maps.forEach(function (map) {
      var t = map && map[heroId];
      if (t && Number(t) > now) best = Math.max(best, Number(t));
    });
    return best;
  }

  function ownsHero(data, heroId) {
    if (!heroId) return false;
    if (parseHeroOwn(data && data.purchasedBattleHeroes && data.purchasedBattleHeroes[heroId]).owned) return true;
    if (heroTrialUntilMs(data, heroId) > Date.now()) return true;
    if (isHeroEquippedOnData(heroId, data)) return true;
    return false;
  }

  function defaultCatalog() {
    return Object.keys(HERO_REGISTRY).map(function (id) {
      var h = HERO_REGISTRY[id];
      return {
        id: h.id,
        name: h.name,
        price: heroPurchaseCost(h.price),
        desc: h.desc,
        order: h.order,
        theme: h.theme
      };
    }).filter(function (h) {
      return isSpriteHeroDef(HERO_REGISTRY[h.id]);
    }).sort(function (a, b) { return a.order - b.order; });
  }

  async function loadHeroCatalogFromDB() {
    if (heroCatalogCache) return heroCatalogCache;
    var merged = {};
    defaultCatalog().forEach(function (h) { merged[h.id] = h; });
    try {
      if (typeof database !== 'undefined') {
        var snap = await database.ref('store/battleHeroes').once('value');
        var val = snap.val() || {};
        Object.keys(val).forEach(function (k) {
          var row = val[k] || {};
          if (row.active === false) return;
          var local = HERO_REGISTRY[k];
          merged[k] = {
            id: k,
            name: String(row.name || (local && local.name) || k),
            price: heroPurchaseCost(Number(row.price) || (local && local.price) || 0),
            desc: String(row.desc || (local && local.desc) || ''),
            order: Number(row.order) || (local && local.order) || 1e9,
            theme: (local && local.theme) || 'blaze'
          };
        });
      }
    } catch (e) {
      console.warn('loadHeroCatalogFromDB', e);
    }
    heroCatalogCache = Object.keys(merged).map(function (k) { return merged[k]; })
      .filter(function (h) {
        var loc = HERO_REGISTRY[h.id];
        return !!loc && isSpriteHeroDef(loc);
      })
      .map(function (h) {
        h.price = heroPurchaseCost(h.price);
        return h;
      })
      .sort(function (a, b) { return a.order - b.order; });
    return heroCatalogCache;
  }

  function heroHasStoreArt(def) {
    return isSpriteHeroDef(def);
  }

  var MOUNT_CLASS_LIST = 'nova-hero-mount--blaze-robot nova-hero-mount--star-fairy nova-hero-mount--turbo-turtle nova-hero-mount--mythic-wyvern nova-hero-mount--bilge-hayalet nova-hero-mount--simsek-sincap nova-hero-mount--firtina-okcu nova-hero-mount--tas-muhafiz nova-hero-mount--golge-parsi nova-hero-mount--bilge-baykus nova-hero-mount--buz-ejder nova-hero-mount--alev-ejder nova-hero-mount--gece-ejder';

  function clearMountClasses(host) {
    if (!host) return;
    MOUNT_CLASS_LIST.split(' ').forEach(function (c) { host.classList.remove(c); });
  }

  function unmountHeroFromHost(host) {
    if (!host) return;
    var id = host.getAttribute('data-hero-id') || host.getAttribute('data-nova-main-hero') || '';
    if (typeof window.novaSpriteUnmountHost === 'function') {
      window.novaSpriteUnmountHost(host, id);
      return;
    }
    try { host.innerHTML = ''; } catch (_) {}
  }

  function epicDragonUseSpriteHost(host) {
    if (!host || !host.closest) return true;
    return !host.closest('.nova-sp-hero-arena__host');
  }

  function mountEpicDragonSvg(host, heroId) {
    if (!host) return null;
    host.removeAttribute('data-buz-sprite');
    host.removeAttribute('data-alev-sprite');
    host.removeAttribute('data-gece-sprite');
    host.innerHTML = buildHeroSvgHtml(heroId);
    if (heroId === 'buz_ejder') {
      if (typeof window.novaBuzEjderMountWebGL === 'function') window.novaBuzEjderMountWebGL(host);
      if (typeof window.novaBuzEjderPlayIdle === 'function') {
        requestAnimationFrame(function () { try { window.novaBuzEjderPlayIdle(host); } catch (_) {} });
      }
      return host.querySelector('.nova-hero-buz-stack') || host.querySelector('svg');
    }
    if (heroId === 'alev_ejder') {
      if (typeof window.novaAlevEjderPlayIdle === 'function') {
        requestAnimationFrame(function () { try { window.novaAlevEjderPlayIdle(host); } catch (_) {} });
      }
      return host.querySelector('.nova-hero-alev-stack') || host.querySelector('svg');
    }
    if (heroId === 'gece_ejder') {
      if (typeof window.novaGeceEjderPlayIdle === 'function') {
        requestAnimationFrame(function () { try { window.novaGeceEjderPlayIdle(host); } catch (_) {} });
      }
      return host.querySelector('.nova-hero-gece-stack') || host.querySelector('svg');
    }
    return host.querySelector('svg');
  }

  function mountHeroStorePreview(host, heroId, opts) {
    if (!host) return null;
    var id = heroId || '';
    var profile = (opts && opts.profile) || 'store';
    clearMountClasses(host);
    if (id) host.classList.add('nova-hero-mount--' + id.replace(/_/g, '-'));
    if (id === 'firtina_okcu' && typeof window.novaFirtinaOkcuMountSprite === 'function') {
      return window.novaFirtinaOkcuMountSprite(host, { profile: profile, scale: opts && opts.scale });
    }
    if (id === 'star_fairy' && typeof window.novaYildizPerisiMountSprite === 'function') {
      return window.novaYildizPerisiMountSprite(host, { profile: profile, scale: opts && opts.scale });
    }
    if (id === 'tas_muhafiz' && typeof window.novaTasMuhafizMountSprite === 'function') {
      return window.novaTasMuhafizMountSprite(host, { profile: profile, scale: opts && opts.scale });
    }
    if (id === 'golge_parsi' && typeof window.novaGolgeParsiMountSprite === 'function') {
      var gStoreOpts = { profile: profile };
      if (opts && opts.scale != null) {
        gStoreOpts.scale = opts.scale;
      } else if (profile === 'store') {
        gStoreOpts.scale = 1.33;
      } else if (profile === 'detail') {
        gStoreOpts.scale = 1.55;
      }
      return window.novaGolgeParsiMountSprite(host, gStoreOpts);
    }
    if (id === 'bilge_baykus' && typeof window.novaBilgeBaykusMountSprite === 'function') {
      return window.novaBilgeBaykusMountSprite(host, { profile: profile, scale: opts && opts.scale });
    }
    if (typeof window.novaIsEpicDragonHero === 'function' && window.novaIsEpicDragonHero(id)) {
      return typeof window.novaEpicDragonMountSprite === 'function'
        ? window.novaEpicDragonMountSprite(host, id, { profile: profile })
        : null;
    }
    return mountHeroInto(host, heroId);
  }

  function buildHeroSvgHtml(heroId) {
    var def = getHeroDef(heroId);
    if (!def) return '';
    var uid = 'h' + ++uidSeq;
    var raw = window[def.templateKey] || '';
    if (!raw) return '';
    return raw.split('__UID__').join(uid).replace('<svg ', '<svg class="nova-hero-svg nova-hero-svg--' + def.theme + '" ');
  }

  function mountHeroInto(host, heroId) {
    if (!host) return null;
    var id = heroId || getEquippedHeroId();
    if (isRetiredSvgHero(id) || !isSpriteHeroDef(getHeroDef(id))) return null;
    clearMountClasses(host);
    if (id) host.classList.add('nova-hero-mount--' + id.replace(/_/g, '-'));
    if (id === 'firtina_okcu' && typeof window.novaFirtinaOkcuMountSprite === 'function') {
      var fProfile = (host.classList && host.classList.contains('nova-main-hero-host')) ? 'main' : 'store';
      return window.novaFirtinaOkcuMountSprite(host, { profile: fProfile });
    }
    if (id === 'star_fairy' && typeof window.novaYildizPerisiMountSprite === 'function') {
      var sProfile = (host.classList && host.classList.contains('nova-main-hero-host')) ? 'main' : 'store';
      return window.novaYildizPerisiMountSprite(host, { profile: sProfile });
    }
    if (id === 'tas_muhafiz' && typeof window.novaTasMuhafizMountSprite === 'function') {
      var tProfile = (host.classList && host.classList.contains('nova-main-hero-host')) ? 'main' : 'store';
      return window.novaTasMuhafizMountSprite(host, { profile: tProfile });
    }
    if (id === 'golge_parsi' && typeof window.novaGolgeParsiMountSprite === 'function') {
      var gProfile = (host.classList && host.classList.contains('nova-main-hero-host')) ? 'main' : 'store';
      var gOpts = { profile: gProfile };
      if (gProfile === 'main') {
        try {
          var gMan = window.NOVA_GOLGE_PARSI_SPRITE_MANIFEST;
          var tMan = window.NOVA_TAS_MUHAFIZ_SPRITE_MANIFEST;
          if (gMan && gMan.main && tMan && tMan.main && tMan.main.frameWidth) {
            var baseMain = (gMan.scale && gMan.scale.main) || 1.42;
            gOpts.scale = baseMain * (gMan.main.frameWidth / tMan.main.frameWidth);
          }
        } catch (_) {}
      }
      return window.novaGolgeParsiMountSprite(host, gOpts);
    }
    if (id === 'bilge_baykus' && typeof window.novaBilgeBaykusMountSprite === 'function') {
      var bProfile = (host.classList && host.classList.contains('nova-main-hero-host')) ? 'main' : 'store';
      return window.novaBilgeBaykusMountSprite(host, { profile: bProfile });
    }
    if (typeof window.novaIsEpicDragonHero === 'function' && window.novaIsEpicDragonHero(id)) {
      if (epicDragonUseSpriteHost(host) && typeof window.novaEpicDragonMountSprite === 'function') {
        var profile = (host.classList && host.classList.contains('nova-main-hero-host')) ? 'main' : 'store';
        return window.novaEpicDragonMountSprite(host, id, { profile: profile });
      }
      return mountEpicDragonSvg(host, id);
    }
    host.innerHTML = buildHeroSvgHtml(id);
    var svg = host.querySelector('svg');
    if (id === 'turbo_turtle' && typeof window.novaTurboTurtlePlayStoreIdle === 'function') {
      requestAnimationFrame(function () {
        try { window.novaTurboTurtlePlayStoreIdle(host); } catch (_) {}
      });
    }
    if (id === 'mythic_wyvern' && typeof window.novaMythicWyvernPlayIdle === 'function') {
      requestAnimationFrame(function () {
        try { window.novaMythicWyvernPlayIdle(host); } catch (_) {}
      });
    }
    if (id === 'bilge_hayalet' && typeof window.novaBilgeHayaletPlayIdle === 'function') {
      requestAnimationFrame(function () {
        try { window.novaBilgeHayaletPlayIdle(host); } catch (_) {}
      });
    }
    if (id === 'simsek_sincap' && typeof window.novaSimsekSincapPlayIdle === 'function') {
      requestAnimationFrame(function () {
        try { window.novaSimsekSincapPlayIdle(host); } catch (_) {}
      });
    }
    return svg;
  }

  function waitMs(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function heroDisplayName() {
    var s = getStudent();
    var n = (s && s.studentName) ? String(s.studentName).trim() : '';
    if (!n) return 'Şampiyon';
    if (n.length > 14) return n.slice(0, 13) + '…';
    return n;
  }

  function defaultVariantBadge(variant) {
    if (variant === 'epic') return '⭐ EFSANE';
    if (variant === 'fire') return '🔥 SÜPER';
    return '✓ DOĞRU';
  }

  function heroUsesTrueSpriteClips(heroId) {
    if (heroId === 'firtina_okcu') {
      return typeof window.novaFirtinaOkcuHasTrueClips === 'function'
        && window.novaFirtinaOkcuHasTrueClips();
    }
    if (heroId === 'star_fairy') {
      return typeof window.novaYildizPerisiHasTrueClips === 'function'
        && window.novaYildizPerisiHasTrueClips();
    }
    if (heroId === 'tas_muhafiz') {
      return typeof window.novaTasMuhafizHasTrueClips === 'function'
        && window.novaTasMuhafizHasTrueClips();
    }
    if (heroId === 'golge_parsi') {
      return typeof window.novaGolgeParsiHasTrueClips === 'function'
        && window.novaGolgeParsiHasTrueClips();
    }
    if (heroId === 'bilge_baykus') {
      return typeof window.novaBilgeBaykusHasTrueClips === 'function'
        && window.novaBilgeBaykusHasTrueClips();
    }
    if (heroId === 'buz_ejder') {
      return typeof window.novaBuzEjderHasTrueClips === 'function'
        && window.novaBuzEjderHasTrueClips();
    }
    if (heroId === 'alev_ejder') {
      return typeof window.novaAlevEjderHasTrueClips === 'function'
        && window.novaAlevEjderHasTrueClips();
    }
    if (heroId === 'gece_ejder') {
      return typeof window.novaGeceEjderHasTrueClips === 'function'
        && window.novaGeceEjderHasTrueClips();
    }
    return false;
  }

  function pickCheerPayload(variant) {
    var def = getEquippedHeroDef() || HERO_REGISTRY.star_fairy;
    var pool = def.lines.cheer;
    if (variant === 'epic') pool = def.lines.epic;
    else if (variant === 'fire') pool = def.lines.fire;
    var entry = pool[correctFxCount % pool.length];
    var message = '';
    var badge = defaultVariantBadge(variant);
    if (entry && typeof entry === 'object') {
      message = String(entry.msg || '');
      if (entry.badge) badge = String(entry.badge);
    } else {
      message = String(entry || '').replace(/\{n\}/g, heroDisplayName()).trim();
    }
    return {
      theme: def.theme,
      heroId: def.id,
      heroName: def.name,
      heroEmoji: def.equipEmoji || '✨',
      studentName: heroDisplayName(),
      message: message,
      variant: variant,
      badge: badge
    };
  }

  function getArenaInnerHtml() {
    return '<div class="nova-sp-hero-arena__veil"></div>'
      + '<div class="nova-sp-hero-arena__fx" aria-hidden="true"></div>'
      + '<div class="nova-sp-hero-arena__inner">'
      + '<aside class="nova-sp-hero-speech" aria-live="polite">'
      + '<div class="nova-sp-hero-speech__frame">'
      + '<header class="nova-sp-hero-speech__head">'
      + '<span class="nova-sp-hero-speech__avatar" aria-hidden="true"></span>'
      + '<div class="nova-sp-hero-speech__who">'
      + '<span class="nova-sp-hero-speech__hero-name"></span>'
      + '<span class="nova-sp-hero-speech__to-you">sana diyor ki</span>'
      + '</div></header>'
      + '<p class="nova-sp-hero-speech__student"></p>'
      + '<p class="nova-sp-hero-speech__message"></p>'
      + '<span class="nova-sp-hero-speech__badge" hidden></span>'
      + '</div></aside>'
      + '<div class="nova-sp-hero-arena__host"></div>'
      + '<div class="nova-sp-hero-arena__burst"></div>'
      + '<div class="nova-sp-hero-arena__ring"></div>'
      + '</div>';
  }

  function clearArenaFx(arena){
    if (!arena) return;
    var fx = arena.querySelector('.nova-sp-hero-arena__fx');
    if (!fx) return;
    fx.className = 'nova-sp-hero-arena__fx';
    fx.innerHTML = '';
  }

  function spawnScreenFx(arena, payload){
    if (!arena || !payload) return;
    var fx = arena.querySelector('.nova-sp-hero-arena__fx');
    if (!fx) return;
    clearArenaFx(arena);
    fx.classList.add('is-on', 'fx-theme-' + payload.theme, 'fx-variant-' + payload.variant);

    var perf = false;
    try {
      perf = document.body.classList.contains('nova-perf-ultra');
    } catch (_) { perf = false; }
    var count = payload.variant === 'epic' ? 18 : (payload.variant === 'fire' ? 12 : 8);
    if (!perf) count = payload.variant === 'epic' ? 22 : (payload.variant === 'fire' ? 14 : 10);
    var type = payload.theme === 'turbo'
      ? 'speed'
      : (payload.theme === 'simsek' ? 'spark'
        : (payload.theme === 'buz' ? 'frost'
          : (payload.theme === 'alev' ? 'ember'
            : (payload.theme === 'gece' ? 'star'
              : ((payload.theme === 'star' || payload.theme === 'mythic') ? 'star' : 'ember')))));
    for (var i = 0; i < count; i++){
      var p = document.createElement('i');
      p.className = 'nova-sp-fx-particle p-' + type;
      var x = Math.random() * 100;
      var y = Math.random() * 100;
      var s = 0.65 + Math.random() * 1.4;
      var d = (payload.variant === 'epic' ? 120 : 80) + Math.random() * 520;
      p.style.left = x.toFixed(2) + '%';
      p.style.top = y.toFixed(2) + '%';
      p.style.setProperty('--p-s', s.toFixed(2));
      p.style.setProperty('--p-d', Math.round(d) + 'ms');
      fx.appendChild(p);
    }
  }

  function renderSpeechPanel(arena, payload) {
    if (!arena || !payload) return;
    var panel = arena.querySelector('.nova-sp-hero-speech');
    if (!panel) return;
    panel.className = 'nova-sp-hero-speech nova-sp-hero-speech--' + payload.theme
      + ' nova-sp-hero-speech--' + payload.variant;
    var avatar = panel.querySelector('.nova-sp-hero-speech__avatar');
    var heroName = panel.querySelector('.nova-sp-hero-speech__hero-name');
    var student = panel.querySelector('.nova-sp-hero-speech__student');
    var message = panel.querySelector('.nova-sp-hero-speech__message');
    var badge = panel.querySelector('.nova-sp-hero-speech__badge');
    if (avatar) avatar.textContent = payload.heroEmoji;
    if (heroName) heroName.textContent = payload.heroName;
    if (student) student.textContent = payload.studentName;
    if (message) message.textContent = payload.message;
    if (badge) {
      if (payload.badge) {
        badge.textContent = payload.badge;
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }
    }
  }

  function usesJsSpFx(heroId) {
    return heroId === 'turbo_turtle' || heroId === 'blaze_robot' || heroId === 'star_fairy' || heroId === 'mythic_wyvern' || heroId === 'bilge_hayalet' || heroId === 'simsek_sincap' || heroId === 'firtina_okcu' || heroId === 'tas_muhafiz' || heroId === 'golge_parsi' || heroId === 'bilge_baykus' || heroId === 'buz_ejder' || heroId === 'alev_ejder' || heroId === 'gece_ejder';
  }

  function pickFxRoutine(variant) {
    var salt = variant === 'epic' ? 2 : (variant === 'fire' ? 1 : 0);
    return (correctFxCount + salt) % 3;
  }

  function playHeroSpFx(host, variant, heroId) {
    if (!host) return waitMs(850);
    host.classList.add('nova-sp-fx-js');
    try{
      /* Daha yumuşak ve okunabilir tempo */
      /* Daha akıcı: gereksiz uzatma yok */
      window.__novaHeroFxSlowFactor = (variant === 'epic') ? 1.12 : ((variant === 'fire') ? 1.08 : 1.04);
    }catch(_){}
    var routine = pickFxRoutine(variant);
    if (heroId === 'turbo_turtle' && typeof window.novaTurboTurtlePlaySpFx === 'function') {
      return window.novaTurboTurtlePlaySpFx(host, variant, routine);
    }
    if (heroId === 'blaze_robot' && typeof window.novaBlazeBotPlaySpFx === 'function') {
      return window.novaBlazeBotPlaySpFx(host, variant, routine);
    }
    if (heroId === 'mythic_wyvern' && typeof window.novaMythicWyvernPlaySpFx === 'function') {
      return window.novaMythicWyvernPlaySpFx(host, variant, routine);
    }
    if (heroId === 'bilge_hayalet' && typeof window.novaBilgeHayaletPlaySpFx === 'function') {
      return window.novaBilgeHayaletPlaySpFx(host, variant, routine);
    }
    if (heroId === 'simsek_sincap' && typeof window.novaSimsekSincapPlaySpFx === 'function') {
      return window.novaSimsekSincapPlaySpFx(host, variant, routine);
    }
    if (heroId === 'firtina_okcu' && typeof window.novaFirtinaOkcuPlaySpFx === 'function') {
      return window.novaFirtinaOkcuPlaySpFx(host, variant, routine);
    }
    if (heroId === 'star_fairy' && typeof window.novaYildizPerisiPlaySpFx === 'function') {
      return window.novaYildizPerisiPlaySpFx(host, variant, routine);
    }
    if (heroId === 'tas_muhafiz' && typeof window.novaTasMuhafizPlaySpFx === 'function') {
      return window.novaTasMuhafizPlaySpFx(host, variant, routine);
    }
    if (heroId === 'golge_parsi' && typeof window.novaGolgeParsiPlaySpFx === 'function') {
      return window.novaGolgeParsiPlaySpFx(host, variant, routine);
    }
    if (heroId === 'bilge_baykus' && typeof window.novaBilgeBaykusPlaySpFx === 'function') {
      return window.novaBilgeBaykusPlaySpFx(host, variant, routine);
    }
    if (heroId === 'buz_ejder' && typeof window.novaBuzEjderPlaySpFx === 'function') {
      return window.novaBuzEjderPlaySpFx(host, variant, routine);
    }
    if (heroId === 'alev_ejder' && typeof window.novaAlevEjderPlaySpFx === 'function') {
      return window.novaAlevEjderPlaySpFx(host, variant, routine);
    }
    if (heroId === 'gece_ejder' && typeof window.novaGeceEjderPlaySpFx === 'function') {
      return window.novaGeceEjderPlaySpFx(host, variant, routine);
    }
    host.classList.remove('nova-sp-fx-js');
    return waitMs(850);
  }

  function resetHeroSpFx(host, heroId) {
    if (!host) return;
    var svg = host.querySelector('svg');
    try {
      try{ window.__novaHeroFxSlowFactor = 1; }catch(_){}
      if (heroId === 'turbo_turtle' && typeof window.novaTurboTurtleResetSvg === 'function') {
        window.novaTurboTurtleResetSvg(svg);
      } else if (heroId === 'blaze_robot' && typeof window.novaBlazeBotResetSvg === 'function') {
        window.novaBlazeBotResetSvg(svg);
      } else if (heroId === 'mythic_wyvern' && typeof window.novaMythicWyvernResetSvg === 'function') {
        window.novaMythicWyvernResetSvg(svg);
      } else if (heroId === 'bilge_hayalet' && typeof window.novaBilgeHayaletResetSvg === 'function') {
        window.novaBilgeHayaletResetSvg(svg);
      } else if (heroId === 'simsek_sincap' && typeof window.novaSimsekSincapResetSvg === 'function') {
        window.novaSimsekSincapResetSvg(svg);
      } else if (heroId === 'firtina_okcu' && typeof window.novaFirtinaOkcuTrueUnmount === 'function') {
        window.novaFirtinaOkcuTrueUnmount(host);
      } else if (heroId === 'star_fairy' && typeof window.novaYildizPerisiTrueUnmount === 'function') {
        window.novaYildizPerisiTrueUnmount(host);
      } else if (heroId === 'tas_muhafiz' && typeof window.novaTasMuhafizTrueUnmount === 'function') {
        window.novaTasMuhafizTrueUnmount(host);
      } else if (heroId === 'golge_parsi' && typeof window.novaGolgeParsiTrueUnmount === 'function') {
        window.novaGolgeParsiTrueUnmount(host);
      } else if (heroId === 'bilge_baykus' && typeof window.novaBilgeBaykusTrueUnmount === 'function') {
        window.novaBilgeBaykusTrueUnmount(host);
      } else if (heroId === 'buz_ejder' && typeof window.novaBuzEjderResetHost === 'function') {
        window.novaBuzEjderResetHost(host);
      } else if (heroId === 'alev_ejder' && typeof window.novaAlevEjderResetHost === 'function') {
        window.novaAlevEjderResetHost(host);
      } else if (heroId === 'gece_ejder' && typeof window.novaGeceEjderResetHost === 'function') {
        window.novaGeceEjderResetHost(host);
      }
    } catch (_) {}
  }

  function pickVariant() {
    var n = correctFxCount;
    if (n % 3 === 0) return 'epic';
    if (n % 2 === 0) return 'fire';
    return 'cheer';
  }

  function hideArena(arena) {
    if (!arena) arena = document.getElementById('nova-sp-hero-arena');
    if (!arena) return;
    arena.classList.remove(
      'is-active', 'is-centered', 'is-exiting', 'is-slamming', 'is-epic', 'is-caption-show',
      'nova-sp-theme-blaze', 'nova-sp-theme-star', 'nova-sp-theme-turbo', 'nova-sp-theme-mythic',
      'nova-sp-theme-simsek', 'nova-sp-theme-bilge', 'nova-sp-theme-buz', 'nova-sp-theme-alev', 'nova-sp-theme-gece', 'nova-sp-theme-firtina'
    );
    arena.setAttribute('aria-hidden', 'true');
    var host = arena.querySelector('.nova-sp-hero-arena__host');
    if (host) {
      host.classList.remove(
        'nova-sp-fx-live', 'nova-sp-fx-js', 'nova-sp-fx-epic', 'nova-sp-fx-fire', 'nova-sp-fx-cheer', 'nova-sp-fx-turbo-js'
      );
      host.innerHTML = '';
    }
    arena.classList.remove('nova-sp-hero-arena--sprite-only');
    var speech = arena.querySelector('.nova-sp-hero-speech');
    if (speech) {
      speech.className = 'nova-sp-hero-speech';
    }
    clearArenaFx(arena);
  }

  function ensureArena() {
    var arena = document.getElementById('nova-sp-hero-arena');
    if (!arena) {
      arena = document.createElement('div');
      arena.id = 'nova-sp-hero-arena';
      arena.className = 'nova-sp-hero-arena';
      arena.setAttribute('aria-hidden', 'true');
      arena.innerHTML = getArenaInnerHtml();
      document.body.appendChild(arena);
    } else {
      if (arena.parentElement && arena.parentElement !== document.body) {
        document.body.appendChild(arena);
      }
      if (!arena.querySelector('.nova-sp-hero-speech')) {
        arena.innerHTML = getArenaInnerHtml();
      }
    }
    return arena;
  }

  function spawnArenaFx(arena, variant) {
    arena.classList.remove('is-slamming', 'is-epic');
    void arena.offsetWidth;
    arena.classList.add(variant === 'epic' ? 'is-epic' : 'is-slamming');
    setTimeout(function () {
      arena.classList.remove('is-slamming', 'is-epic');
    }, 1200);
  }

  function triggerGameShake() {
    var game = document.getElementById('single-player-game-screen');
    if (!game) return;
    game.classList.remove('nova-sp-game-shake');
    void game.offsetWidth;
    game.classList.add('nova-sp-game-shake');
    setTimeout(function () { game.classList.remove('nova-sp-game-shake'); }, 450);
  }

  function isSinglePlayerGameVisible() {
    var el = document.getElementById('single-player-game-screen');
    if (!el) return false;
    if (document.body.classList.contains('nova-sp-game-open')) return true;
    try {
      var st = window.getComputedStyle(el);
      return st.display !== 'none' && st.visibility !== 'hidden';
    } catch (_) {
      return el.style.display === 'flex' || el.classList.contains('nova-sp-game-visible');
    }
  }

  function playHeroFx(variant) {
    return new Promise(function (resolve) {
      if (fxBusy || !isSinglePlayerGameVisible()) { resolve(); return; }
      var equippedId = getEquippedHeroId();
      var def = getHeroDef(equippedId);
      if (!def) { resolve(); return; }

      var arena = ensureArena();
      arena.classList.remove('nova-sp-theme-blaze', 'nova-sp-theme-star', 'nova-sp-theme-turbo', 'nova-sp-theme-mythic', 'nova-sp-theme-simsek', 'nova-sp-theme-bilge', 'nova-sp-theme-buz', 'nova-sp-theme-alev', 'nova-sp-theme-gece', 'nova-sp-theme-firtina', 'nova-sp-theme-tas');
      arena.classList.add('nova-sp-theme-' + def.theme);

      var host = arena.querySelector('.nova-sp-hero-arena__host');
      var payload = pickCheerPayload(variant);
      var spriteOnly = heroUsesTrueSpriteClips(equippedId);
      if (spriteOnly) {
        arena.classList.add('nova-sp-hero-arena--sprite-only');
        if (host) host.innerHTML = '';
      } else {
        renderSpeechPanel(arena, payload);
        spawnScreenFx(arena, payload);
        var svg = mountHeroInto(host, equippedId);
        if (!svg) { resolve(); return; }
      }

      fxBusy = true;

      if (spriteOnly) {
        if (equippedId === 'firtina_okcu' && typeof window.novaFirtinaOkcuEnsureTrueClipsReady === 'function') {
          window.novaFirtinaOkcuEnsureTrueClipsReady();
        } else if (equippedId === 'star_fairy' && typeof window.novaYildizPerisiEnsureTrueClipsReady === 'function') {
          window.novaYildizPerisiEnsureTrueClipsReady();
        } else if (equippedId === 'tas_muhafiz' && typeof window.novaTasMuhafizEnsureTrueClipsReady === 'function') {
          window.novaTasMuhafizEnsureTrueClipsReady();
        } else if (equippedId === 'golge_parsi' && typeof window.novaGolgeParsiEnsureTrueClipsReady === 'function') {
          window.novaGolgeParsiEnsureTrueClipsReady();
        } else if (equippedId === 'bilge_baykus' && typeof window.novaBilgeBaykusEnsureTrueClipsReady === 'function') {
          window.novaBilgeBaykusEnsureTrueClipsReady();
        } else if (equippedId === 'buz_ejder' && typeof window.novaBuzEjderEnsureTrueClipsReady === 'function') {
          window.novaBuzEjderEnsureTrueClipsReady();
        } else if (equippedId === 'alev_ejder' && typeof window.novaAlevEjderEnsureTrueClipsReady === 'function') {
          window.novaAlevEjderEnsureTrueClipsReady();
        } else if (equippedId === 'gece_ejder' && typeof window.novaGeceEjderEnsureTrueClipsReady === 'function') {
          window.novaGeceEjderEnsureTrueClipsReady();
        }
      }

      arena.setAttribute('aria-hidden', 'false');
      arena.classList.add('is-active');
      ['is-centered', 'is-exiting', 'is-slamming', 'is-epic', 'is-caption-show'].forEach(function (c) {
        arena.classList.remove(c);
      });

      runHeroSequence(arena, variant).then(function () {
        hideArena(arena);
        fxBusy = false;
        resolve();
      });
    });
  }

  function runHeroSequence(arena, variant) {
    var host = arena.querySelector('.nova-sp-hero-arena__host');
    var heroId = getEquippedHeroId();
    var jsFx = usesJsSpFx(heroId);
    var spriteOnly = heroUsesTrueSpriteClips(heroId);
    return waitMs(spriteOnly ? 16 : 40).then(function () {
      arena.classList.add('is-centered');
      if (!spriteOnly) arena.classList.add('is-caption-show');
      if (host) {
        host.classList.add('nova-sp-fx-live');
        if (!jsFx) host.classList.add('nova-sp-fx-' + variant);
      }
      return waitMs(spriteOnly ? 48 : (jsFx ? 80 : 400));
    }).then(function () {
      if (!spriteOnly) spawnArenaFx(arena, variant);
      if (!spriteOnly && variant === 'epic') setTimeout(triggerGameShake, jsFx ? 300 : 260);
      else if (!spriteOnly && variant === 'fire') setTimeout(triggerGameShake, jsFx ? 340 : 300);
      var tail = spriteOnly
        ? (heroId === 'firtina_okcu' || heroId === 'star_fairy' || heroId === 'tas_muhafiz' || heroId === 'golge_parsi' || heroId === 'bilge_baykus' || heroId === 'buz_ejder' || heroId === 'alev_ejder' ? 280 : 120)
        : (variant === 'epic' ? 360 : (variant === 'fire' ? 260 : 180));
      var fxWait = (jsFx || spriteOnly) && host
        ? playHeroSpFx(host, variant, heroId).then(function () { return waitMs(tail); })
        : waitMs(spriteOnly ? 4200 : 850);
      return fxWait;
    }).then(function () {
      if (host) {
        host.classList.remove(
          'nova-sp-fx-live', 'nova-sp-fx-js', 'nova-sp-fx-epic', 'nova-sp-fx-fire', 'nova-sp-fx-cheer', 'nova-sp-fx-turbo-js'
        );
        resetHeroSpFx(host, heroId);
      }
      try{ window.__novaHeroFxSlowFactor = 1; }catch(_){}
      return waitMs(spriteOnly ? 80 : 180);
    }).then(function () {
      arena.classList.remove('is-centered', 'is-caption-show', 'is-slamming', 'is-epic');
      arena.classList.add('is-exiting');
      return waitMs(spriteOnly ? 480 : 280);
    });
  }

  async function novaTryPlayBattleHeroFx() {
    try {
      var data = null;
      if (typeof getStoreStudentData === 'function') {
        try {
          data = await getStoreStudentData();
        } catch (_) {}
      }
      if (!isHeroEquipped(data)) return;
      correctFxCount++;
      await playHeroFx(pickVariant());
    } catch (e) {
      console.warn('battle hero fx', e);
      fxBusy = false;
    }
  }

  function heroPreviewHtml(heroId, theme) {
    var mount = heroId ? ' nova-hero-mount--' + heroId.replace(/_/g, '-') : '';
    var th = theme || (getHeroDef(heroId) && getHeroDef(heroId).theme) || 'blaze';
    return '<div class="nova-store-preview nova-store-preview--hero nova-store-preview--' + th + ' nova-hero-preview--store-live' + mount + '">'
      + '<div class="nova-hero-svg-host" data-nova-hero-host="1" data-hero-id="' + (heroId || '') + '"></div>'
      + '</div>';
  }

  function heroLevelLabel(lvl) {
    var labels = { 1: 'Giriş', 2: 'Usta', 3: 'Efsane', 4: 'Kozmik' };
    return labels[lvl] || ('Seviye ' + lvl);
  }

  function epicBadgeSlotHtml(heroId) {
    return '<div class="nova-hero-store-epic-slot char-inv-hero-epic-slot" data-epic-dragon-slot="1" data-hero-id="' + heroId + '"></div>';
  }

  function mountEpicBadgesIn(root, heroId, mod) {
    if (!root || !heroId || !isEpicStoreHero(heroId)) return;
    if (typeof window.novaEpicDragonMountBadge !== 'function') return;
    root.querySelectorAll('[data-epic-dragon-slot]').forEach(function (slot) {
      window.novaEpicDragonMountBadge(slot, heroId, mod || 'store');
    });
  }

  function openHeroStoreDetail(hero, userData) {
    if (typeof window.novaOpenStoreDetail !== 'function') return;
    var def = getHeroDef(hero.id);
    if (!def) return;
    var permanentOwned = parseHeroOwn(userData && userData.purchasedBattleHeroes && userData.purchasedBattleHeroes[hero.id]).owned;
    var onTrial = heroTrialUntilMs(userData, hero.id) > Date.now() && !permanentOwned;
    var pendingDays = (typeof window.novaGetHeroTrialPendingDays === 'function')
      ? window.novaGetHeroTrialPendingDays(userData, hero.id) : 0;
    var owned = permanentOwned || onTrial;
    var equipped = userData && userData.battleHero === hero.id;
    var diamonds = Number(userData && userData.diamond) || 0;
    var cost = heroPurchaseCost(Number(hero.price) || def.price);
    var epic = isEpicStoreHero(hero);
    var lvl = owned ? getHeroLevel(userData, hero.id) : 0;
    var name = hero.name || def.name;
    var desc = hero.desc || def.desc || '';
    var trialLeft = (typeof window.novaFormatHeroTrialRemaining === 'function')
      ? window.novaFormatHeroTrialRemaining(userData, hero.id) : '';
    var extra = '';
    if (owned) {
      extra = epic
        ? epicBadgeSlotHtml(hero.id)
        : '<span class="nova-hero-level-badge">★ Seviye ' + lvl + ' · ' + heroLevelLabel(lvl) + '</span>';
    } else if (epic) {
      extra = epicBadgeSlotHtml(hero.id);
    }
    if (onTrial && trialLeft) {
      extra += '<span class="nova-hero-trial-badge">Deneme aktif · ' + trialLeft + '</span>';
    }
    if (pendingDays > 0 && !permanentOwned) {
      extra += '<span class="nova-hero-trial-badge nova-hero-trial-badge--pending">'
        + (onTrial ? '+' : '') + pendingDays + ' gün deneme hakkı</span>';
    }
    var btnClass = 'buy-button';
    var btnText = 'Satın Al';
    var btnDisabled = false;
    var startPendingTrial = false;
    if (!permanentOwned && pendingDays > 0) {
      btnClass = 'use-button';
      btnText = 'Denemeyi Başlat';
      btnDisabled = false;
      startPendingTrial = true;
    } else if (owned && equipped) {
      btnClass = 'use-button';
      btnText = 'Kullanılıyor';
      btnDisabled = true;
    } else if (owned) {
      btnClass = 'use-button';
      btnText = 'Kullan';
      btnDisabled = false;
    } else if (diamonds < cost) {
      btnText = 'Elmas yetersiz';
      btnDisabled = true;
    }
    var showBuySecondary = !permanentOwned && (onTrial || pendingDays > 0);
    var secondaryBtnText = null;
    var secondaryBtnDisabled = false;
    var onSecondaryAction = null;
    if (showBuySecondary) {
      secondaryBtnText = diamonds >= cost ? 'Satın Al' : 'Elmas yetersiz';
      secondaryBtnDisabled = diamonds < cost;
      onSecondaryAction = async function () {
        if (await purchaseBattleHero(hero)) {
          window.novaCloseStoreDetail();
          await refreshBattleHeroStoreInPlace();
        }
      };
    }
    window.novaOpenStoreDetail({
      kicker: 'Kahraman',
      title: name,
      meta: '',
      desc: desc,
      extraHtml: extra,
      onOpened: function () {
        if (!epic) return;
        var extraEl = document.getElementById('nova_store_detail_extra');
        mountEpicBadgesIn(extraEl, hero.id, 'store');
      },
      priceHtml: permanentOwned ? '' : ('💎 ' + cost),
      previewClass: 'nova-store-detail-preview--hero nova-store-detail-preview--' + def.theme,
      previewHtml: '',
      mountPreview: function (box) {
        if (!box || !hero.id) return;
        box.innerHTML = heroPreviewHtml(hero.id, def.theme);
        var stage = box.querySelector('.nova-store-preview--' + def.theme) || box;
        function mountWhenReady(attempt) {
          var h = stage.querySelector('[data-nova-hero-host]');
          if (!h) return;
          var rect = h.getBoundingClientRect();
          if ((!rect.width || !rect.height) && attempt < 14) {
            requestAnimationFrame(function () { mountWhenReady(attempt + 1); });
            return;
          }
          mountHeroStorePreview(h, hero.id, { profile: 'detail' });
        }
        requestAnimationFrame(function () { mountWhenReady(0); });
      },
      btnClass: btnClass,
      btnText: btnText,
      btnDisabled: btnDisabled,
      secondaryBtnClass: 'buy-button',
      secondaryBtnText: secondaryBtnText,
      secondaryBtnDisabled: secondaryBtnDisabled,
      onSecondaryAction: onSecondaryAction,
      inUse: equipped && owned,
      onAction: async function () {
        if (startPendingTrial) {
          if (typeof window.novaStartHeroTrial === 'function') {
            var ok = await window.novaStartHeroTrial(hero.id);
            if (!ok) return;
          }
          await equipBattleHero(hero);
          window.novaCloseStoreDetail();
          await refreshBattleHeroStoreInPlace();
        } else if (!owned) {
          if (await purchaseBattleHero(hero)) {
            window.novaCloseStoreDetail();
            await refreshBattleHeroStoreInPlace();
          }
        } else if (!equipped) {
          await equipBattleHero(hero);
          window.novaCloseStoreDetail();
          await refreshBattleHeroStoreInPlace();
        } else {
          window.novaCloseStoreDetail();
        }
      }
    });
  }

  async function purchaseBattleHero(hero) {
    var s = getStudent();
    if (!s || !s.classId || !s.studentId || !hero) {
      await showAlert('Önce giriş yapmalısın.');
      return false;
    }
    var def = getHeroDef(hero.id);
    if (!def || !isSpriteHeroDef(def)) {
      await showAlert('Bu kahraman mağazada artık satılmıyor.');
      return false;
    }
    var heroId = hero.id;
    var cost = heroPurchaseCost(Number(hero.price) || def.price);
    var heroName = hero.name || def.name;
    try {
      var ref = database.ref('classes/' + s.classId + '/students/' + s.studentId);
      var snap = await ref.once('value');
      var userData = snap.val() || {};
      var diamonds = Number(userData.diamond) || 0;
      if (ownsHero(userData, heroId)) {
        await showAlert('Bu kahraman zaten sende var.');
        return false;
      }
      if (diamonds < cost) {
        await showAlert('Yeterli elmasın yok! ' + cost + ' 💎 gerekli.');
        return false;
      }
      var ok = await showConfirmation(cost + ' 💎 karşılığında ' + heroName + ' satın alınsın mı?');
      if (!ok) return false;

      await ref.update({
        diamond: diamonds - cost,
        ['purchasedBattleHeroes/' + heroId]: { level: 1, purchasedAt: Date.now() }
      });
      try {
        var el = document.getElementById('diamond-value');
        if (el) el.textContent = diamonds - cost;
        var cur = document.getElementById('currentDiamonds');
        if (cur) cur.textContent = diamonds - cost;
      } catch (_) {}
      if (s) {
        s.diamond = diamonds - cost;
        if (!s.purchasedBattleHeroes) s.purchasedBattleHeroes = {};
        s.purchasedBattleHeroes[heroId] = { level: 1, purchasedAt: Date.now() };
        try {
          window.selectedStudent = s;
          localStorage.setItem('selectedStudent', JSON.stringify(s));
        } catch (_) {}
      }
      await showAlert((def.equipEmoji || '✨') + ' ' + heroName + ' artık senin! Mağazadan Kullan ile aktif et.');
      return true;
    } catch (e) {
      console.error('purchaseBattleHero', e);
      await showAlert('Satın alma sırasında hata oluştu.');
      return false;
    }
  }

  async function equipBattleHero(hero) {
    var s = getStudent();
    if (!s || !s.classId || !s.studentId || !hero) return;
    var def = getHeroDef(hero.id);
    if (!def || !isSpriteHeroDef(def)) {
      if (typeof showAlert === 'function') {
        await showAlert('Bu kahraman artık kullanılmıyor. Mağazadan sprite kahraman seç.');
      }
      return;
    }
    try {
      await database.ref('classes/' + s.classId + '/students/' + s.studentId).update({ battleHero: hero.id });
      syncHeroToStudent({ battleHero: hero.id });
      try { refreshMainScreenHero(); } catch (_) {}
      try {
        var eqLvl = 0;
        if (window.NOVA_HERO_LEVEL && typeof window.NOVA_HERO_LEVEL.getHeroLevelFromData === 'function') {
          eqLvl = window.NOVA_HERO_LEVEL.getHeroLevelFromData(s, hero.id) || 0;
        }
        window.__novaMainHeroLevelFetched = eqLvl;
        if (typeof window.novaRefreshMainHeroStars === 'function') window.novaRefreshMainHeroStars();
      } catch (_) {}
      await showAlert((def.equipEmoji || '✨') + ' ' + def.name + ' aktif! Doğru cevaplarda seni motive eder.');
    } catch (e) {
      console.error('equipBattleHero', e);
      await showAlert('Kahraman seçilemedi.');
    }
  }

  function renderHeroStoreCard(hero, userData, container, index) {
    var def = getHeroDef(hero.id);
    if (!def || !heroHasStoreArt(def)) return;

    var permanentOwned = parseHeroOwn(userData && userData.purchasedBattleHeroes && userData.purchasedBattleHeroes[hero.id]).owned;
    var trialUntil = heroTrialUntilMs(userData, hero.id);
    var onTrial = trialUntil > Date.now() && !permanentOwned;
    var pendingDays = (typeof window.novaGetHeroTrialPendingDays === 'function')
      ? window.novaGetHeroTrialPendingDays(userData, hero.id) : 0;
    var owned = permanentOwned || onTrial;
    var trialLeft = (typeof window.novaFormatHeroTrialRemaining === 'function')
      ? window.novaFormatHeroTrialRemaining(userData, hero.id) : '';
    var equipped = userData && userData.battleHero === hero.id;
    var diamonds = Number(userData && userData.diamond) || 0;
    var cost = heroPurchaseCost(Number(hero.price) || def.price);
    var epic = isEpicStoreHero(hero);
    var lvl = owned ? getHeroLevel(userData, hero.id) : 0;
    var heroName = hero.name || def.name;

    var card = document.createElement('div');
    card.className = 'profile-photo-item nova-store-card nova-hero-store-card nova-hero-store-card--' + def.theme
      + (epic ? ' nova-hero-store-card--epic-tier' : '');
    card.style.animationDelay = (index * 0.06) + 's';
    var badgeRow = '';
    if (epic) {
      badgeRow = epicBadgeSlotHtml(hero.id);
    } else if (owned) {
      badgeRow = '<span class="nova-hero-level-badge">★ Sv. ' + lvl + '</span>';
    }
    if (onTrial) {
      badgeRow += '<span class="nova-hero-trial-badge">Deneme aktif</span>'
        + '<span class="nova-hero-trial-remaining">' + (trialLeft || '') + '</span>';
    }
    if (pendingDays > 0 && !permanentOwned) {
      badgeRow += '<span class="nova-hero-trial-badge nova-hero-trial-badge--pending">'
        + (onTrial ? '+' : '') + pendingDays + ' gün deneme</span>'
        + '<span class="nova-hero-trial-remaining">'
        + (onTrial ? 'Üst üste eklemek için başlat' : 'Henüz başlamadı') + '</span>';
    }
    card.innerHTML =
      heroPreviewHtml(hero.id, def.theme)
      + '<div class="nova-hero-store-vitrine-name">' + heroName + '</div>'
      + badgeRow
      + '<div class="profile-photo-price">'
      + (owned ? '' : ('<span class="purchased-badge nova-hero-diamond-price">💎 ' + cost + '</span>'))
      + '</div>'
      + (equipped && owned
        ? ((typeof window.novaStoreInUseMarkup === 'function')
          ? window.novaStoreInUseMarkup()
          : '<button type="button" class="profile-photo-button use-button nova-store-in-use-btn" disabled aria-disabled="true">Kullanılıyor</button>')
        : '<button type="button" class="profile-photo-button"></button>');

    var btn = card.querySelector('.profile-photo-button');
    if (!permanentOwned && pendingDays > 0) {
      btn.className = 'profile-photo-button use-button nova-hero-trial-start-btn';
      btn.textContent = 'Denemeyi Başlat';
      btn.disabled = false;
      btn.onclick = async function (e) {
        e.stopPropagation();
        if (typeof window.novaStartHeroTrial === 'function') {
          var ok = await window.novaStartHeroTrial(hero.id);
          if (!ok) return;
        }
        await equipBattleHero(hero);
        await refreshBattleHeroStoreInPlace();
      };
    } else if (!owned) {
      btn.className = 'profile-photo-button buy-button';
      btn.textContent = diamonds >= cost ? 'Satın Al' : 'Elmas yetersiz';
      btn.disabled = diamonds < cost;
      btn.onclick = async function (e) {
        e.stopPropagation();
        if (await purchaseBattleHero(hero)) await refreshBattleHeroStoreInPlace();
      };
    } else if (!equipped) {
      btn.className = 'profile-photo-button use-button';
      btn.textContent = 'Kullan';
      btn.onclick = async function (e) {
        e.stopPropagation();
        await equipBattleHero(hero);
        await refreshBattleHeroStoreInPlace();
      };
    }

    if (typeof window.novaBindStoreCardDetail === 'function') {
      window.novaBindStoreCardDetail(card, async function () {
        var fresh = userData;
        try {
          if (typeof getStoreStudentData === 'function') fresh = await getStoreStudentData(true);
        } catch (_) {}
        openHeroStoreDetail(hero, fresh || userData);
      });
    }

    container.appendChild(card);
    var host = card.querySelector('[data-nova-hero-host]');
    if (typeof window.novaStoreLazyMountHero === 'function') {
      window.novaStoreLazyMountHero(host, hero.id, function (h) {
        mountHeroStorePreview(h, hero.id);
      });
    } else {
      function mountWhenReady(attempt) {
        if (!host) return;
        var rect = host.getBoundingClientRect();
        if ((!rect.width || !rect.height) && attempt < 12) {
          requestAnimationFrame(function () { mountWhenReady(attempt + 1); });
          return;
        }
        mountHeroStorePreview(host, hero.id);
      }
      requestAnimationFrame(function () { mountWhenReady(0); });
    }
    if (epic) mountEpicBadgesIn(card, hero.id, 'store');
  }

  function getActiveHeroStoreCategory() {
    try {
      if (typeof window.novaStoreHubGetSubCategory === 'function') {
        var sub = window.novaStoreHubGetSubCategory();
        if (sub === '__battleHeroesEpik' || sub === '__battleHeroesTemel') return sub;
        if (sub === '__battleHeroes') return '__battleHeroesTemel';
      }
    } catch (_) {}
    var active = document.querySelector('#novaStoreSubNav .nova-store-sub-btn.active');
    if (active) {
      var c = active.getAttribute('data-category') || active.dataset.category;
      if (c === '__battleHeroesEpik' || c === '__battleHeroesTemel') return c;
    }
    return '__battleHeroesTemel';
  }

  function refreshBattleHeroStoreInPlace() {
    return novaRenderBattleHeroStore(getActiveHeroStoreCategory());
  }

  async function novaRenderBattleHeroStore(category) {
    if (typeof getStoreStudentData !== 'function') return;
    var container = document.getElementById('profilePhotosContainer');
    var duelStore = document.getElementById('duelCreditsStore');
    if (duelStore) duelStore.style.display = 'none';
    if (!container) return;

    var cat = category;
    if (!cat || cat === '__battleHeroes') {
      cat = getActiveHeroStoreCategory();
    }
    if (typeof window.novaStoreHubSyncSubCategory === 'function') {
      window.novaStoreHubSyncSubCategory(cat);
    }

    var scrollTop = container.scrollTop || 0;
    container.style.display = 'grid';
    if (typeof window.novaSpriteUnmountContainer === 'function') {
      window.novaSpriteUnmountContainer(container);
    } else {
      container.innerHTML = '';
    }
    container.classList.add('nova-store-products--heroes');

    var catalog = filterHeroCatalogByStoreCategory(await loadHeroCatalogFromDB(), cat);
    var userData = await getStoreStudentData(true);
    if (!catalog.length) {
      var emptyMsg = cat === '__battleHeroesEpik'
        ? 'Epik kahramanlar yakında'
        : 'Henüz temel kahraman eklenmedi';
      container.innerHTML = '<div class="no-champion">' + emptyMsg + '</div>';
      requestAnimationFrame(function () {
        container.scrollTop = scrollTop;
      });
      return;
    }
    catalog.forEach(function (hero, i) {
      renderHeroStoreCard(hero, userData, container, i);
    });
    if (typeof window.novaStoreMountAllHeroCards === 'function') {
      requestAnimationFrame(function () {
        try { window.novaStoreMountAllHeroCards(container); } catch (_) {}
      });
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        container.scrollTop = scrollTop;
      });
    });
  }

  function patchLoadProfilePhotos() {
    if (typeof loadProfilePhotos !== 'function' || loadProfilePhotos.__novaHeroPatched) return;
    var orig = loadProfilePhotos;
    window.loadProfilePhotos = async function (category) {
      if (category === '__battleHeroes' || category === '__battleHeroesTemel' || category === '__battleHeroesEpik') {
        return novaRenderBattleHeroStore(category === '__battleHeroes' ? '__battleHeroesTemel' : category);
      }
      return orig.apply(this, arguments);
    };
    window.loadProfilePhotos.__novaHeroPatched = true;
  }

  function patchStudentDataLoad() {
    if (typeof getStoreStudentData !== 'function' || getStoreStudentData.__novaHeroPatched) return;
    var orig = getStoreStudentData;
    window.getStoreStudentData = async function (force) {
      var data = await orig.apply(this, arguments);
      syncHeroToStudent(data);
      try {
        if (isMainScreenVisible()) refreshMainScreenHero();
      } catch (_) {}
      return data;
    };
    window.getStoreStudentData.__novaHeroPatched = true;
  }

  function patchSpGameOpen() {
    var open = window.novaOpenSinglePlayerGameScreen;
    if (!open || open.__novaHeroPatched) return;
    window.novaOpenSinglePlayerGameScreen = function () {
      open.apply(this, arguments);
      hideArena();
      if (typeof window.novaFirtinaOkcuPreloadTrueClipsIfEquipped === 'function') {
        window.novaFirtinaOkcuPreloadTrueClipsIfEquipped();
      }
      if (typeof window.novaYildizPerisiPreloadTrueClipsIfEquipped === 'function') {
        window.novaYildizPerisiPreloadTrueClipsIfEquipped();
      }
      if (typeof window.novaYildizPerisiPreloadSprite === 'function') {
        window.novaYildizPerisiPreloadSprite();
      }
      if (typeof window.novaTasMuhafizPreloadTrueClipsIfEquipped === 'function') {
        window.novaTasMuhafizPreloadTrueClipsIfEquipped();
      }
      if (typeof window.novaTasMuhafizPreloadSprite === 'function') {
        window.novaTasMuhafizPreloadSprite();
      }
      if (typeof window.novaGolgeParsiPreloadTrueClipsIfEquipped === 'function') {
        window.novaGolgeParsiPreloadTrueClipsIfEquipped();
      }
      if (typeof window.novaGolgeParsiPreloadSprite === 'function') {
        window.novaGolgeParsiPreloadSprite();
      }
      if (typeof window.novaBilgeBaykusPreloadTrueClipsIfEquipped === 'function') {
        window.novaBilgeBaykusPreloadTrueClipsIfEquipped();
      }
      if (typeof window.novaBilgeBaykusPreloadSprite === 'function') {
        window.novaBilgeBaykusPreloadSprite();
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
    };
    window.novaOpenSinglePlayerGameScreen.__novaHeroPatched = true;
    var close = window.novaCloseSinglePlayerGameScreen;
    if (close && !close.__novaHeroPatched) {
      window.novaCloseSinglePlayerGameScreen = function () {
        close.apply(this, arguments);
        hideArena();
      };
      window.novaCloseSinglePlayerGameScreen.__novaHeroPatched = true;
    }
  }

  function patchMainScreenHeroHooks() {
    if (typeof applyOwnNameFrame === 'function' && !applyOwnNameFrame.__novaHeroPatched) {
      var origApply = applyOwnNameFrame;
      window.applyOwnNameFrame = function () {
        origApply();
        try { refreshMainScreenHero(); } catch (_) {}
      };
      window.applyOwnNameFrame.__novaHeroPatched = true;
    }
    var main = document.getElementById('main-screen');
    if (main && !main.__novaHeroObs) {
      var moTimer = null;
      var obs = new MutationObserver(function () {
        if (moTimer) clearTimeout(moTimer);
        moTimer = setTimeout(function () {
          moTimer = null;
          if (isMainScreenVisible()) refreshMainScreenHero();
          else clearMainHeroSlot(document.getElementById('nova-main-hero-slot'));
        }, 150);
      });
      obs.observe(main, { attributes: true, attributeFilter: ['style', 'class'] });
      main.__novaHeroObs = obs;
    }
  }

  function renderHeroStarsHtml(heroId, lvl) {
    if (typeof window.novaIsEpicDragonHero === 'function' && window.novaIsEpicDragonHero(heroId)) {
      return '<div class="char-inv-hero-epic-slot" data-epic-dragon-slot="1" data-hero-id="' + heroId + '"></div>';
    }
    var html = '<div class="char-inv-hero-stars">';
    for (var i = 1; i <= 4; i++) {
      html += '<span class="char-inv-hero-star ' + (i <= lvl ? 'is-on' : '') + '" aria-hidden="true">★</span>';
    }
    html += '</div>';
    return html;
  }

  function mountCharInvEpicBadges(root) {
    if (!root || typeof window.novaEpicDragonMountBadge !== 'function') return;
    root.querySelectorAll('[data-epic-dragon-slot]').forEach(function (slot) {
      var hid = slot.getAttribute('data-hero-id') || 'buz_ejder';
      window.novaEpicDragonMountBadge(slot, hid, 'inv');
    });
  }

  async function novaFillCharacterInventoryHeroes() {
    var panel = document.getElementById('char_inv_panel_heroes');
    if (!panel) return;
    var s = getStudent();
    if (!s || !s.studentId || !s.classId) {
      panel.innerHTML = '<p class="char-inv-warn">Önce giriş yapmalısın.</p>';
      return;
    }
    var userData = {};
    try {
      if (typeof getCharacterInventoryStudentData === 'function') {
        userData = await getCharacterInventoryStudentData() || {};
      } else if (typeof database !== 'undefined') {
        var snap = await database.ref('classes/' + s.classId + '/students/' + s.studentId).once('value');
        userData = snap.val() || {};
      }
    } catch (_) {}
    syncHeroToStudent(userData);

    var catalog = await loadHeroCatalogFromDB();
    var ownedList = catalog.filter(function (h) {
      return ownsHero(userData, h.id);
    });
    var equippedId = String(userData.battleHero || s.battleHero || '').trim();
    var html = '';

    if (equippedId && ownsHero(userData, equippedId)) {
      var eqDef = getHeroDef(equippedId);
      var eqName = eqDef ? eqDef.name : equippedId;
      var eqLvl = getHeroLevel(userData, equippedId);
      var eqEpic = isEpicStoreHero(equippedId);
      html += '<div class="char-inv-hero-equipped">'
        + '<div class="char-inv-hero-equipped__preview" data-char-inv-hero-host="' + equippedId + '"></div>'
        + '<div class="char-inv-hero-equipped__info">'
        + '<p class="char-inv-kicker" style="margin:0">Aktif kahraman</p>'
        + '<h3>' + eqName + '</h3>'
        + (eqEpic ? '' : ('<p style="margin:4px 0;font-size:12px;color:#94a3b8">Seviye ' + eqLvl + ' · ' + heroLevelLabel(eqLvl) + '</p>'))
        + renderHeroStarsHtml(equippedId, eqLvl)
        + '</div></div>';
    }

    if (!ownedList.length) {
      html += '<div class="char-inv-empty">'
        + '<div class="big" aria-hidden="true">🤖</div>'
        + '<h3>Henüz kahramanın yok</h3>'
        + '<p>Mağazadan kahraman satın alıp seviye atlayabilirsin.</p>'
        + '<button type="button" class="char-inv-cta char-inv-cta-store">Mağazaya git 🛒</button>'
        + '</div>';
    } else {
      html += '<div class="char-inv-grid" id="char_inv_grid_heroes">';
      ownedList.forEach(function (hero) {
        var def = getHeroDef(hero.id);
        if (!def) return;
        var lvl = getHeroLevel(userData, hero.id);
        var eq = hero.id === equippedId;
        var cardEpic = isEpicStoreHero(hero);
        html += '<div class="char-inv-card char-inv-hero-card' + (eq ? ' equipped' : '') + (cardEpic ? ' char-inv-hero-card--epic' : '') + '">'
          + (eq ? '<span class="char-inv-badge">Takılı</span>' : '')
          + '<div class="char-inv-hero-thumb-host" data-char-inv-hero-host="' + hero.id + '"></div>'
          + '<div class="char-inv-card-title">' + (hero.name || def.name) + '</div>'
          + (cardEpic ? '' : ('<p style="margin:0 0 6px;font-size:11px;color:#a5b4fc">★ Sv. ' + lvl + ' · ' + heroLevelLabel(lvl) + '</p>'))
          + renderHeroStarsHtml(hero.id, lvl)
          + (eq
            ? '<span class="char-inv-in-use" role="status">Kullanımda</span>'
            : '<button type="button" class="char-inv-action" data-char-equip-hero="' + hero.id + '">⚔️ Kullan</button>')
          + '</div>';
      });
      html += '</div>';
    }

    panel.innerHTML = html;
    mountCharInvEpicBadges(panel);
    panel.querySelectorAll('[data-char-inv-hero-host]').forEach(function (el) {
      mountHeroInto(el, el.getAttribute('data-char-inv-hero-host'));
    });
    panel.querySelector('.char-inv-cta-store')?.addEventListener('click', function () {
      if (typeof novaCloseCharacterInventory === 'function') novaCloseCharacterInventory();
      if (typeof novaOpenStore === 'function') {
        novaOpenStore();
        setTimeout(function () {
          if (typeof window.novaStoreHubSelectMainTab === 'function') {
            window.novaStoreHubSelectMainTab('heroes', '__battleHeroesTemel');
          }
        }, 400);
      }
    });
    panel.querySelectorAll('[data-char-equip-hero]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var hid = btn.getAttribute('data-char-equip-hero');
        var h = catalog.find(function (x) { return x.id === hid; });
        if (!h) return;
        await equipBattleHero(h);
        if (typeof novaRefreshCharacterInventoryIfOpen === 'function') {
          await novaRefreshCharacterInventoryIfOpen();
        } else {
          await novaFillCharacterInventoryHeroes();
        }
      });
    });
  }

  function patchCharacterInventory() {
    if (typeof window.novaRenderCharacterInventory !== 'function' || window.novaRenderCharacterInventory.__novaHeroInvPatched) return;
    var orig = window.novaRenderCharacterInventory;
    window.novaRenderCharacterInventory = async function () {
      await orig.apply(this, arguments);
      await novaFillCharacterInventoryHeroes();
    };
    window.novaRenderCharacterInventory.__novaHeroInvPatched = true;
  }

  function boot() {
    try {
      if (typeof photoCategories === 'object' && photoCategories) {
        photoCategories.__battleHeroes = photoCategories.__battleHeroes || [];
      }
    } catch (_) {}
    var oldArena = document.getElementById('nova-sp-knight-arena');
    if (oldArena) oldArena.remove();
    patchLoadProfilePhotos();
    patchStudentDataLoad();
    patchSpGameOpen();
    patchMainScreenHeroHooks();
    patchCharacterInventory();
    if (!document.__novaMainHeroVisibleBound) {
      document.__novaMainHeroVisibleBound = true;
      document.addEventListener('nova:main-screen-visible', function () {
        try { refreshMainScreenHero(); } catch (_) {}
      });
    }
    try { refreshMainScreenHero(); } catch (_) {}
  }

  window.novaGetEquippedBattleHeroId = getEquippedHeroId;
  window.novaTryPlayBattleHeroFx = novaTryPlayBattleHeroFx;
  window.novaTryPlayKnightCorrectFx = novaTryPlayBattleHeroFx;
  window.novaRefreshMainScreenHero = refreshMainScreenHero;
  window.NOVA_BATTLE_HERO_REGISTRY = HERO_REGISTRY;
  window.NOVA_HERO_REGISTRY = HERO_REGISTRY;
  window.novaGetHeroLevel = getHeroLevel;
  window.novaMountHeroInto = mountHeroInto;
  window.mountHeroInto = mountHeroInto;
  window.mountHeroStorePreview = mountHeroStorePreview;
  window.novaBuildHeroSvgHtml = buildHeroSvgHtml;
  window.novaRenderBattleHeroStore = novaRenderBattleHeroStore;
  window.novaRefreshBattleHeroStoreInPlace = refreshBattleHeroStoreInPlace;
  window.novaGetActiveHeroStoreCategory = getActiveHeroStoreCategory;
  window.novaIsEpicStoreHero = isEpicStoreHero;
  window.novaHeroTrialUntilMs = heroTrialUntilMs;
  window.novaHeroPreviewHtml = heroPreviewHtml;
  window.novaFilterHeroCatalogByStoreCategory = filterHeroCatalogByStoreCategory;
  window.novaFillCharacterInventoryHeroes = novaFillCharacterInventoryHeroes;
  window.NOVA_BATTLE_HERO_ID = 'star_fairy';
  window.NOVA_RETIRED_SVG_HERO_IDS = RETIRED_SVG_HERO_IDS;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
  setTimeout(boot, 800);
})();

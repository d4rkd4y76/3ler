/**
 * Maarif / dik temel yazı — grup 1–2 + grup 3: ü …
 * viewBox 0 0 200 286 · kılavuz: üst 40, orta 120, alt 200 (üst/alt çerçeve payı geniş)
 */
(function (global) {
  "use strict";

  var LETTERS = {
    a: {
      id: "a",
      label: "a",
      case: "lower",
      title: "Küçük a",
      hamle: 2,
      hint: "2 hamle · açık kâse, sonra sağ dik",
      strokes: [
        {
          id: "a1",
          label: "1",
          /*
           * Tam kapalı o değil: sağda dar ağızlı açık kâse (c’ye yakın, uçlar daha bitişik).
           * sweep=0 + large=1: üstten sola–alta giden büyük yay.
           * Sağ dik (2) ağzın önünden geçerek yuvarlağı tamamlar.
           */
          d: "M 130.5 143.8 A 34.5 34.5 0 1 0 130.5 176.2",
          tip: "Sağ üstten başla, açık kâseyi ters saat yönünde çiz"
        },
        {
          id: "a2",
          label: "2",
          d: "M 132 125.5 L 132 194.5",
          tip: "Sağdan yukarıdan aşağı dik in (kâseyi tamamla)"
        }
      ]
    },
    A: {
      id: "A",
      label: "A",
      case: "upper",
      title: "Büyük A",
      hamle: 3,
      hint: "3 hamle · sol, sağ, orta çizgi",
      strokes: [
        { id: "A1", label: "1", d: "M 100 36 L 42 200", tip: "Tepeden sola aşağı in" },
        { id: "A2", label: "2", d: "M 100 36 L 158 200", tip: "Tepeden sağa aşağı in" },
        { id: "A3", label: "3", d: "M 68 128 L 132 128", tip: "Ortada soldan sağa birleştir" }
      ]
    },

    n: {
      id: "n",
      label: "n",
      case: "lower",
      title: "Küçük n",
      hamle: 2,
      hint: "2 hamle · dik çizgi, sonra kemer",
      strokes: [
        {
          id: "n1",
          label: "1",
          d: "M 70 120 L 70 200",
          tip: "Orta çizgiden aşağı dik in"
        },
        {
          id: "n2",
          label: "2",
          /*
           * Tek SVG elips yayı — iki cubic tepede birleşince “çift tümsek / titreme” olurdu.
           * rx=ry=38: yarım daire (hazır n). Merkez (108,158) → tepe (108,120).
           * sweep=1: üst yay (0 = ters u). Birleşim sol gövdede y=158.
           */
          d: "M 70 158 A 38 38 0 0 1 146 158 L 146 200",
          tip: "Soldan yukarı çık, kemeri orta çizgiye oturt, sağdan aşağı in"
        }
      ]
    },
    N: {
      id: "N",
      label: "N",
      case: "upper",
      title: "Büyük N",
      hamle: 3,
      hint: "3 hamle · sol, çapraz, sağ",
      strokes: [
        { id: "N1", label: "1", d: "M 48 40 L 48 200", tip: "Soldan yukarıdan aşağı in" },
        { id: "N2", label: "2", d: "M 48 40 L 152 200", tip: "Soldan sağa çapraz in" },
        { id: "N3", label: "3", d: "M 152 40 L 152 200", tip: "Sağdan yukarıdan aşağı in" }
      ]
    },

    e: {
      id: "e",
      label: "e",
      case: "lower",
      title: "Küçük e",
      hamle: 2,
      hint: "2 hamle · orta çizgi, sonra ters saat yönü kavis",
      strokes: [
        {
          id: "e1",
          label: "1",
          /*
           * Kırmızı başlangıç: sol orta. Soldan sağa yatay (harfin ortası y=160).
           * x-yükseklik: kesik orta 120 → taban 200.
           */
          d: "M 58 160 L 142 160",
          tip: "Soldan (kırmızı) başla, sağa doğru çiz"
        },
        {
          id: "e2",
          label: "2",
          /*
           * Yatayın sağ ucundan devam: saat yönünün TERSİ (yukarı→sol→alt→sağ alt).
           * Elips merkez (100,160) rx=42 ry=40 → tepe 120, taban 200.
           * sweep=0 + large-arc=1: sağdan üstten giden büyük yay; ağız sağ altta açık.
           */
          d: "M 142 160 A 42 40 0 1 0 132 186",
          tip: "Sağ uçtan yukarı-sola dön, etrafını çiz, sağ altta bırak"
        }
      ]
    },
    E: {
      id: "E",
      label: "E",
      case: "upper",
      title: "Büyük E",
      hamle: 4,
      hint: "4 hamle · dik + üç yatay",
      strokes: [
        { id: "E1", label: "1", d: "M 52 40 L 52 200", tip: "Soldan yukarıdan aşağı in" },
        { id: "E2", label: "2", d: "M 52 40 L 158 40", tip: "Üstte soldan sağa çiz" },
        { id: "E3", label: "3", d: "M 52 120 L 140 120", tip: "Ortada soldan sağa çiz" },
        { id: "E4", label: "4", d: "M 52 200 L 158 200", tip: "Altta soldan sağa çiz" }
      ]
    },

    t: {
      id: "t",
      label: "t",
      case: "lower",
      title: "Küçük t",
      hamle: 2,
      hint: "2 hamle · dik + kanca, sonra orta çizgi",
      strokes: [
        {
          id: "t1",
          label: "1",
          /*
           * Üst çizgi ile orta arası ~yarıdan başla (y=80).
           * Tabana dik in, sonda sağa küçük kanca.
           */
          d: "M 100 80 L 100 186 Q 100 200 124 200",
          tip: "Yukarıdan aşağı dik in, sonda sağa kıvrıl"
        },
        {
          id: "t2",
          label: "2",
          /* Çapraz çubuk orta çizgide · gövdeye göre kısa */
          d: "M 72 120 L 128 120",
          tip: "Orta çizgide soldan sağa çiz"
        }
      ]
    },
    T: {
      id: "T",
      label: "T",
      case: "upper",
      title: "Büyük T",
      hamle: 2,
      hint: "2 hamle · önce çatı, sonra dik",
      strokes: [
        {
          id: "T1",
          label: "1",
          d: "M 40 40 L 160 40",
          tip: "Üstte soldan sağa çatı çiz"
        },
        {
          id: "T2",
          label: "2",
          d: "M 100 40 L 100 200",
          tip: "Ortadan yukarıdan aşağı dik in"
        }
      ]
    },

    i: {
      id: "i",
      label: "i",
      case: "lower",
      title: "Küçük i",
      hamle: 2,
      hint: "2 hamle · kısa dik, sonra nokta",
      strokes: [
        {
          id: "i1",
          label: "1",
          /* Gövde yalnızca orta–taban bandında (pembe alan) */
          d: "M 100 120 L 100 200",
          tip: "Orta çizgiden aşağı dik in"
        },
        {
          id: "i2",
          label: "2",
          /*
           * Nokta: üst bantta (beyaz), gövdenin üstünde.
           * Kısa yukarı→aşağı dokunuş; kalın round cap = nokta görünümü.
           */
          d: "M 100 70 L 100 84",
          tip: "Üste nokta koy"
        }
      ]
    },
    İ: {
      id: "İ",
      label: "İ",
      case: "upper",
      title: "Büyük İ",
      hamle: 2,
      hint: "2 hamle · uzun dik, sonra nokta",
      strokes: [
        {
          id: "I1",
          label: "1",
          /*
           * stroke-width 11 + round cap → uçlar ±5.5 taşar.
           * Merkez çizgi 45.5…194.5 → mürekkep tam üst (40) ve alt (200) çizgiye değer, taşmaz.
           */
          d: "M 100 45.5 L 100 194.5",
          tip: "Üst çizgiden aşağı uzun dik in"
        },
        {
          id: "I2",
          label: "2",
          /*
           * Nokta üst çizginin üstünde; gövde tepesi (y≈40) ile arasında ~10 birim boşluk.
           * Mürekkep alt kenarı ≈30 → bitişik değil.
           */
          d: "M 100 16 L 100 24.5",
          tip: "En üste nokta koy (arada boşluk bırak)"
        }
      ]
    },

    l: {
      id: "l",
      label: "l",
      case: "lower",
      title: "Küçük l",
      hamle: 1,
      hint: "1 hamle · tepeden aşağı, sonda sağa kıvrım",
      strokes: [
        {
          id: "l1",
          label: "1",
          /*
           * Üst çizgiden (görsel 40) tabana dik; sonda sağa hafif kanca.
           * stroke 11 + round: merkez 45.5…194.5 bandı.
           */
          d: "M 100 45.5 L 100 186 Q 100 200 124 200",
          tip: "Üstten aşağı dik in, sonda sağa kıvrıl"
        }
      ]
    },
    L: {
      id: "L",
      label: "L",
      case: "upper",
      title: "Büyük L",
      hamle: 2,
      hint: "2 hamle · dik çizgi, sonra kısa taban",
      strokes: [
        {
          id: "L1",
          label: "1",
          /* Üst–alt çizgiye tam oturur, taşmaz */
          d: "M 60 45.5 L 60 194.5",
          tip: "Üstten aşağı dik in"
        },
        {
          id: "L2",
          label: "2",
          /* Taban çizgisinde sağa · yükseklik ~yarısı kadar kısa */
          d: "M 60 194.5 L 140 194.5",
          tip: "Altta soldan sağa kısa çiz"
        }
      ]
    },

    o: {
      id: "o",
      label: "o",
      case: "lower",
      title: "Küçük o",
      hamle: 1,
      hint: "1 hamle · sağ üstten ters saat yönü",
      strokes: [
        {
          id: "o1",
          label: "1",
          /*
           * Orta–taban bandında daire (görsel 120…200).
           * Başlangıç ~2 yönü; sweep=0 = saat yönünün tersi.
           * r=34.5: stroke 11 taşması sonrası çizgilere tam oturur.
           */
          d: "M 129.9 142.8 A 34.5 34.5 0 1 0 70.1 177.2 A 34.5 34.5 0 1 0 129.9 142.8",
          tip: "Sağ üstten başla, ters saat yönünde yuvarla"
        }
      ]
    },
    O: {
      id: "O",
      label: "O",
      case: "upper",
      title: "Büyük O",
      hamle: 1,
      hint: "1 hamle · sağ üstten ters saat yönü",
      strokes: [
        {
          id: "O1",
          label: "1",
          /*
           * Üst–alt tam yükseklik dairesi (görsel 40…200).
           * r=74.5 + stroke 11 → çizgilere değer, taşmaz.
           */
          d: "M 164.5 82.8 A 74.5 74.5 0 1 0 35.5 157.2 A 74.5 74.5 0 1 0 164.5 82.8",
          tip: "Sağ üstten başla, ters saat yönünde yuvarla"
        }
      ]
    },

    ö: {
      id: "ö",
      label: "ö",
      case: "lower",
      title: "Küçük ö",
      hamle: 3,
      hint: "3 hamle · o gövdesi + iki nokta",
      strokes: [
        {
          id: "ö1",
          label: "1",
          /* Aynı o dairesi */
          d: "M 129.9 142.8 A 34.5 34.5 0 1 0 70.1 177.2 A 34.5 34.5 0 1 0 129.9 142.8",
          tip: "Sağ üstten başla, ters saat yönünde yuvarla"
        },
        {
          id: "ö2",
          label: "2",
          /* Hafif içe, beyaz bantta */
          d: "M 84 88 L 84 100",
          tip: "Sol üste nokta koy"
        },
        {
          id: "ö3",
          label: "3",
          d: "M 116 88 L 116 100",
          tip: "Sağ üste nokta koy"
        }
      ]
    },
    Ö: {
      id: "Ö",
      label: "Ö",
      case: "upper",
      title: "Büyük Ö",
      hamle: 3,
      hint: "3 hamle · O gövdesi + iki nokta",
      strokes: [
        {
          id: "Ö1",
          label: "1",
          d: "M 164.5 82.8 A 74.5 74.5 0 1 0 35.5 157.2 A 74.5 74.5 0 1 0 164.5 82.8",
          tip: "Sağ üstten başla, ters saat yönünde yuvarla"
        },
        {
          id: "Ö2",
          label: "2",
          /* Üst çizginin üstünde, gövdeyle boşluk, hafif içe */
          d: "M 76 14 L 76 24",
          tip: "Sol üste nokta koy"
        },
        {
          id: "Ö3",
          label: "3",
          d: "M 124 14 L 124 24",
          tip: "Sağ üste nokta koy"
        }
      ]
    },

    k: {
      id: "k",
      label: "k",
      case: "lower",
      title: "Küçük k",
      hamle: 2,
      hint: "2 hamle · dik çizgi, sonra V kol",
      strokes: [
        {
          id: "k1",
          label: "1",
          /* Üst–alt tam dik; stroke 11 taşması hesaba katıldı */
          d: "M 72 45.5 L 72 194.5",
          tip: "Üstten aşağı dik in"
        },
        {
          id: "k2",
          label: "2",
          /*
           * Tek hamle V: orta çizgiden (pembe üst) gövdeye (y≈160), sonra tabana sağa.
           * Tüm kol pembe bantta.
           */
          d: "M 132 120 L 72 160 L 132 200",
          tip: "Orta çizgiden gövdeye in, sonra sağa aşağı aç"
        }
      ]
    },
    K: {
      id: "K",
      label: "K",
      case: "upper",
      title: "Büyük K",
      hamle: 3,
      hint: "3 hamle · dik, üst çapraz, alt çapraz",
      strokes: [
        {
          id: "K1",
          label: "1",
          d: "M 70 45.5 L 70 194.5",
          tip: "Üstten aşağı dik in"
        },
        {
          id: "K2",
          label: "2",
          /* Sağ üstten orta çizgide gövdeye */
          d: "M 148 45.5 L 70 120",
          tip: "Sağ üstten gövdeye çapraz in"
        },
        {
          id: "K3",
          label: "3",
          /* Orta birleşimden sağ alta */
          d: "M 70 120 L 148 194.5",
          tip: "Ortadan sağa aşağı çapraz in"
        }
      ]
    },

    u: {
      id: "u",
      label: "u",
      case: "lower",
      title: "Küçük u",
      hamle: 1,
      hint: "1 hamle · kavis + tepeden aşağı (numara hep 1)",
      strokes: [
        {
          id: "u1",
          label: "1",
          d: "M 70 125.5 L 70 165 A 30 29.5 0 0 0 130 165 L 130 125.5",
          tip: "Sol üstten in, alttan kıvrıl, sağdan yukarı çık"
        },
        {
          id: "u2",
          label: "1",
          /* Görsel 2. aşama ama pedagojik aynı hamle — numara yine 1 */
          sameHamle: true,
          d: "M 130 125.5 L 130 194.5",
          tip: "El kaldırmadan tepeden aşağı in"
        }
      ]
    },
    U: {
      id: "U",
      label: "U",
      case: "upper",
      title: "Büyük U",
      hamle: 1,
      hint: "1 hamle · kavis + tepeden aşağı (numara hep 1)",
      strokes: [
        {
          id: "U1",
          label: "1",
          d: "M 60 45.5 L 60 154.5 A 40 40 0 0 0 140 154.5 L 140 45.5",
          tip: "Sol üstten in, alttan kıvrıl, sağdan yukarı çık"
        },
        {
          id: "U2",
          label: "1",
          sameHamle: true,
          d: "M 140 45.5 L 140 194.5",
          tip: "El kaldırmadan tepeden aşağı in"
        }
      ]
    },

    r: {
      id: "r",
      label: "r",
      case: "lower",
      title: "Küçük r",
      hamle: 2,
      hint: "2 hamle · dik çizgi, sonra sağ kulak",
      strokes: [
        {
          id: "r1",
          label: "1",
          /* Pembe bant: orta → taban */
          d: "M 86 125.5 L 86 194.5",
          tip: "Orta çizgiden aşağı dik in"
        },
        {
          id: "r2",
          label: "2",
          /*
           * Önceki konum + hafif daha dolu kavis (küçük n omzu gibi).
           * Üst yay sweep=1; sağ uç neredeyse aynı yükseklik — aşağı inmez.
           */
          d: "M 86 139 A 25 16 0 0 1 136 137",
          tip: "Tepeden sağa kavis çiz"
        }
      ]
    },
    R: {
      id: "R",
      label: "R",
      case: "upper",
      title: "Büyük R",
      hamle: 3,
      hint: "3 hamle · dik, üst kavis, çapraz bacak",
      strokes: [
        {
          id: "R1",
          label: "1",
          d: "M 68 45.5 L 68 194.5",
          tip: "Üstten aşağı dik in"
        },
        {
          id: "R2",
          label: "2",
          /*
           * Üstten sağa kavis (P), orta çizgide gövdeye dön.
           * Tepe 45.5 → birleşim 120.
           */
          d: "M 68 45.5 L 112 45.5 A 40 37.25 0 0 1 112 120 L 68 120",
          tip: "Üstten sağa kavis çiz, ortada gövdeye bağla"
        },
        {
          id: "R3",
          label: "3",
          d: "M 68 120 L 145 194.5",
          tip: "Ortadan sağa aşağı çapraz in"
        }
      ]
    },

    ı: {
      id: "ı",
      label: "ı",
      case: "lower",
      title: "Küçük ı",
      hamle: 1,
      hint: "1 hamle · kısa dik (noktasız)",
      strokes: [
        {
          id: "ı1",
          label: "1",
          /* i gövdesi gibi · nokta yok · orta–taban */
          d: "M 100 125.5 L 100 194.5",
          tip: "Orta çizgiden aşağı dik in"
        }
      ]
    },
    I: {
      id: "I",
      label: "I",
      case: "upper",
      title: "Büyük I",
      hamle: 1,
      hint: "1 hamle · uzun dik (noktasız)",
      strokes: [
        {
          id: "Ix1",
          label: "1",
          /* İ gövdesi gibi · nokta yok · üst–alt çizgilere oturur */
          d: "M 100 45.5 L 100 194.5",
          tip: "Üst çizgiden aşağı uzun dik in"
        }
      ]
    },

    m: {
      id: "m",
      label: "m",
      case: "lower",
      title: "Küçük m",
      hamle: 1,
      hint: "1 hamle · el kaldırmadan dik + iki kemer",
      strokes: [
        {
          id: "m1",
          label: "1",
          d: "M 52 125.5 L 52 194.5",
          tip: "Orta çizgiden aşağı dik in"
        },
        {
          id: "m2",
          label: "1",
          sameHamle: true,
          /*
           * Uçtan devam: tabandan geri çık → 1. kemer → orta bacak.
           * Ayrı SVG yolu = doğrulama karışmaz; pedagojik tek hamle.
           */
          d: "M 52 194.5 L 52 158 A 24 38 0 0 1 100 158 L 100 194.5",
          tip: "El kaldırmadan geri çık, kemeri çiz, ortadan aşağı in"
        },
        {
          id: "m3",
          label: "1",
          sameHamle: true,
          d: "M 100 194.5 L 100 158 A 24 38 0 0 1 148 158 L 148 194.5",
          tip: "El kaldırmadan geri çık, ikinci kemeri çiz, sağdan aşağı in"
        }
      ]
    },
    M: {
      id: "M",
      label: "M",
      case: "upper",
      title: "Büyük M",
      hamle: 4,
      hint: "4 hamle · sol dik, V, sağ dik",
      strokes: [
        {
          id: "M1",
          label: "1",
          d: "M 36 45.5 L 36 194.5",
          tip: "Soldan yukarıdan aşağı dik in"
        },
        {
          id: "M2",
          label: "2",
          d: "M 36 45.5 L 100 194.5",
          tip: "Soldan ortaya aşağı çapraz in"
        },
        {
          id: "M3",
          label: "3",
          d: "M 164 45.5 L 100 194.5",
          tip: "Sağ üstten ortaya aşağı çapraz in"
        },
        {
          id: "M4",
          label: "4",
          d: "M 164 45.5 L 164 194.5",
          tip: "Sağdan yukarıdan aşağı dik in"
        }
      ]
    },

    ü: {
      id: "ü",
      label: "ü",
      case: "lower",
      title: "Küçük ü",
      hamle: 3,
      hint: "3 hamle · u gövdesi (sağ aşağı dahil) + iki nokta",
      strokes: [
        {
          id: "ü1",
          label: "1",
          d: "M 70 125.5 L 70 165 A 30 29.5 0 0 0 130 165 L 130 125.5",
          tip: "Sol üstten in, alttan kıvrıl, sağdan yukarı çık"
        },
        {
          id: "ü1b",
          label: "1",
          sameHamle: true,
          d: "M 130 125.5 L 130 194.5",
          tip: "El kaldırmadan tepeden aşağı in"
        },
        {
          id: "ü2",
          label: "2",
          d: "M 82 88 L 82 100",
          tip: "Sol üste nokta koy"
        },
        {
          id: "ü3",
          label: "3",
          d: "M 118 88 L 118 100",
          tip: "Sağ üste nokta koy"
        }
      ]
    },
    Ü: {
      id: "Ü",
      label: "Ü",
      case: "upper",
      title: "Büyük Ü",
      hamle: 3,
      hint: "3 hamle · U gövdesi (sağ aşağı dahil) + iki nokta",
      strokes: [
        {
          id: "Ü1",
          label: "1",
          d: "M 60 45.5 L 60 154.5 A 40 40 0 0 0 140 154.5 L 140 45.5",
          tip: "Sol üstten in, alttan kıvrıl, sağdan yukarı çık"
        },
        {
          id: "Ü1b",
          label: "1",
          sameHamle: true,
          d: "M 140 45.5 L 140 194.5",
          tip: "El kaldırmadan tepeden aşağı in"
        },
        {
          id: "Ü2",
          label: "2",
          d: "M 74 14 L 74 24",
          tip: "Sol üste nokta koy"
        },
        {
          id: "Ü3",
          label: "3",
          d: "M 126 14 L 126 24",
          tip: "Sağ üste nokta koy"
        }
      ]
    },

    s: {
      id: "s",
      label: "s",
      case: "lower",
      title: "Küçük s",
      hamle: 1,
      hint: "1 hamle · sağ üstten sola S",
      strokes: [
        {
          id: "s1",
          label: "1",
          /*
           * Elips yayları — tepe/taban GEOMETRİK olarak kılavuza oturur.
           * stroke 11: dış kenar orta=120, taban=200 → CL tepe 125.5, CL taban 194.5.
           * Üst yarım elips (cy=142.75 ry=17.25) + omurga + alt yarım elips (cy=177.25).
           */
          d: "M 130 142.75 A 30 17.25 0 0 0 70 142.75 C 70 160 130 160 130 177.25 A 30 17.25 0 0 1 78 189",
          tip: "Sağ üstten sola başla, S şeklinde çiz"
        }
      ]
    },
    S: {
      id: "S",
      label: "S",
      case: "upper",
      title: "Büyük S",
      hamle: 1,
      hint: "1 hamle · sağ üstten sola S",
      strokes: [
        {
          id: "S1",
          label: "1",
          /*
           * Tam boy: dış kenar üst=40, taban=200 → CL 45.5…194.5.
           * Üst cy=82.75 ry=37.25 · alt cy=157.25 · orta birleşim 120.
           */
          d: "M 146 82.75 A 46 37.25 0 0 0 54 82.75 C 54 120 146 120 146 157.25 A 46 37.25 0 0 1 64 180",
          tip: "Sağ üstten sola başla, S şeklinde çiz"
        }
      ]
    },

    y: {
      id: "y",
      label: "y",
      case: "lower",
      title: "Küçük y",
      hamle: 2,
      hint: "2 hamle · u gövdesi, sonra kuyruk",
      strokes: [
        {
          id: "y1",
          label: "1",
          /*
           * Referans: u pembe bantta (orta–taban).
           * Alt yay CL 194.5 → mürekkep tabana oturur.
           */
          d: "M 70 125.5 L 70 165 A 30 29.5 0 0 0 130 165 L 130 125.5",
          tip: "Sol üstten in, alttan kıvrıl, sağdan yukarı çık"
        },
        {
          id: "y2",
          label: "2",
          /*
           * Sağ sap orta çizgiden düz in, tabanı geç, sola kanca + hafif yukarı.
           * Geniş alt çerçeve payına sığar (clip yok).
           */
          d: "M 130 125.5 L 130 216 C 130 252 98 260 78 246",
          tip: "Sağ üstten aşağı in, sonda sola kıvrıl"
        }
      ]
    },
    Y: {
      id: "Y",
      label: "Y",
      case: "upper",
      title: "Büyük Y",
      hamle: 3,
      hint: "3 hamle · iki çapraz, sonra dik gövde",
      strokes: [
        {
          id: "Y1",
          label: "1",
          /* Üst bantta sol çapraz → orta çizgi birleşimi */
          d: "M 52 45.5 L 100 120",
          tip: "Sol üstten ortaya çapraz in"
        },
        {
          id: "Y2",
          label: "2",
          d: "M 148 45.5 L 100 120",
          tip: "Sağ üstten ortaya çapraz in"
        },
        {
          id: "Y3",
          label: "3",
          /* Pembe bantta dik; tabana oturur, altına inmez */
          d: "M 100 120 L 100 194.5",
          tip: "Ortadan aşağı dik in"
        }
      ]
    },

    d: {
      id: "d",
      label: "d",
      case: "lower",
      title: "Küçük d",
      hamle: 2,
      hint: "2 hamle · açık kâse, sonra sağ dik",
      strokes: [
        {
          id: "d1",
          label: "1",
          /*
           * a ile aynı açık kâse (ağzı sağda, uçlar bitişik).
           * Tam o çizilmez; sağ dik (2) yuvarlağı tamamlar.
           */
          d: "M 130.5 143.8 A 34.5 34.5 0 1 0 130.5 176.2",
          tip: "Sağ üstten başla, açık kâseyi ters saat yönünde çiz"
        },
        {
          id: "d2",
          label: "2",
          /* Üst çizgiden tabana — kâse ağzının önünden geçer */
          d: "M 132 45.5 L 132 194.5",
          tip: "Üstten aşağı sağ dik in (kâseyi tamamla)"
        }
      ]
    },
    D: {
      id: "D",
      label: "D",
      case: "upper",
      title: "Büyük D",
      hamle: 2,
      hint: "2 hamle · sol dik, sağ kavis",
      strokes: [
        {
          id: "D1",
          label: "1",
          d: "M 58 45.5 L 58 194.5",
          tip: "Soldan yukarıdan aşağı dik in"
        },
        {
          id: "D2",
          label: "2",
          /*
           * Tepeden sağa açılan kâse, altta gövdeye dön (G1 yumuşak cubic).
           */
          d: "M 58 45.5 C 128 45.5 162 82 162 120 C 162 158 128 194.5 58 194.5",
          tip: "Üstten sağa kavis çiz, altta birleştir"
        }
      ]
    },

    z: {
      id: "z",
      label: "z",
      case: "lower",
      title: "Küçük z",
      hamle: 1,
      hint: "1 hamle · üst çizgi, çapraz, alt çizgi",
      strokes: [
        {
          id: "z1",
          label: "1",
          /*
           * Pembe bant · tek hamle (el kalkmaz):
           * üst soldan sağa → çapraz sol alta → alt soldan sağa.
           */
          d: "M 68 125.5 L 132 125.5 L 68 194.5 L 132 194.5",
          tip: "Üstten sağa, çapraz in, altta sağa çiz"
        }
      ]
    },
    Z: {
      id: "Z",
      label: "Z",
      case: "upper",
      title: "Büyük Z",
      hamle: 1,
      hint: "1 hamle · üst çizgi, çapraz, alt çizgi",
      strokes: [
        {
          id: "Z1",
          label: "1",
          d: "M 48 45.5 L 152 45.5 L 48 194.5 L 152 194.5",
          tip: "Üstten sağa, çapraz in, altta sağa çiz"
        }
      ]
    },

    ç: {
      id: "ç",
      label: "ç",
      case: "lower",
      title: "Küçük ç",
      hamle: 2,
      hint: "2 hamle · c kavisi, sonra alt çizgi",
      strokes: [
        {
          id: "ç1",
          label: "1",
          /*
           * c: sağ üstten açık ağız · a/d’den daha açık.
           * sweep=0 large=1: ters saat yönü.
           */
          d: "M 121.2 132.8 A 34.5 34.5 0 1 0 121.2 187.2",
          tip: "Sağ üstten başla, c şeklinde ters saat yönünde çiz"
        },
        {
          id: "ç2",
          label: "2",
          /*
           * Cedilla: tabanın altında, gövdeye değmez.
           * ü noktaları gibi yukarıdan aşağı kısa dik.
           */
          d: "M 100 212 L 100 228",
          tip: "Altta gövdeye değmeden yukarıdan aşağı çiz"
        }
      ]
    },
    Ç: {
      id: "Ç",
      label: "Ç",
      case: "upper",
      title: "Büyük Ç",
      hamle: 2,
      hint: "2 hamle · C kavisi, sonra alt çizgi",
      strokes: [
        {
          id: "Ç1",
          label: "1",
          d: "M 149.9 64.6 A 74.5 74.5 0 1 0 149.9 175.4",
          tip: "Sağ üstten başla, C şeklinde ters saat yönünde çiz"
        },
        {
          id: "Ç2",
          label: "2",
          d: "M 100 212 L 100 232",
          tip: "Altta gövdeye değmeden yukarıdan aşağı çiz"
        }
      ]
    },

    b: {
      id: "b",
      label: "b",
      case: "lower",
      title: "Küçük b",
      hamle: 2,
      hint: "2 hamle · dik çizgi, sonra sağ kâse",
      strokes: [
        {
          id: "b1",
          label: "1",
          d: "M 72 45.5 L 72 194.5",
          tip: "Üstten aşağı dik in"
        },
        {
          id: "b2",
          label: "2",
          /*
           * a/d aynası: açık kâse sol tarafta (ağız gövdeye bakar).
           * Merkez (104.5,160), r=34.5 · sweep=1 büyük yay sağdan döner.
           * Sol dik ağzı tamamlar.
           */
          d: "M 74 143.8 A 34.5 34.5 0 1 1 74 176.2",
          tip: "Ortadan sağa kâse çiz (gövdeye değmeden bitir)"
        }
      ]
    },
    B: {
      id: "B",
      label: "B",
      case: "upper",
      title: "Büyük B",
      hamle: 2,
      hint: "2 hamle · dik çizgi, sonra iki kavis",
      strokes: [
        {
          id: "B1",
          label: "1",
          d: "M 58 45.5 L 58 194.5",
          tip: "Üstten aşağı dik in"
        },
        {
          id: "B2",
          label: "2",
          /*
           * Yumuşak dairesel loblar (kappa) · üst/alt arasında ufak fark.
           * Üst rx=58 · alt rx=66 · sırtlar 82.75 / 157.25.
           */
          d: "M 58 45.5 C 90.03 45.5 116 62.18 116 82.75 C 116 103.32 90.03 120 58 120 C 94.45 120 124 136.68 124 157.25 C 124 177.82 94.45 194.5 58 194.5",
          tip: "Üstten sağa üst lob, ortada değ, alt lobu çiz"
        }
      ]
    },

    g: {
      id: "g",
      label: "g",
      case: "lower",
      title: "Küçük g",
      hamle: 2,
      hint: "2 hamle · açık kâse, sonra sağ kuyruk",
      strokes: [
        {
          id: "g1",
          label: "1",
          /* a ile aynı: sağda dar ağızlı açık kâse (kapalı o değil) */
          d: "M 130.5 143.8 A 34.5 34.5 0 1 0 130.5 176.2",
          tip: "Sağ üstten başla, açık kâseyi ters saat yönünde çiz"
        },
        {
          id: "g2",
          label: "2",
          /* y gibi: sağdan aşağı, sola kıvrıl (ağızdan inen çizgi) */
          d: "M 132 125.5 L 132 216 C 130 252 98 260 78 246",
          tip: "Sağ üstten aşağı in, sonda sola kıvrıl"
        }
      ]
    },
    G: {
      id: "G",
      label: "G",
      case: "upper",
      title: "Büyük G",
      hamle: 1,
      hint: "1 hamle · açık C + ortada içe çubuk",
      strokes: [
        {
          id: "G1",
          label: "1",
          /*
           * Neredeyse tam daire (O ile aynı merkez/r): 2 gibi sağ üstten başla,
           * ters saat → üst → sol → alt → sağdan ORTA çizgiye kadar daire üzerinde gel,
           * orada 90° içe yatay çubuk. (Ayrı dik sap / taban düzlüğü yok.)
           */
          d: "M 164.52 82.75 A 74.5 74.5 0 1 0 174.5 120 L 96 120",
          tip: "Sağ üstten yuvarla, ortada içe doğru çubuk çek"
        }
      ]
    },

    ğ: {
      id: "ğ",
      label: "ğ",
      case: "lower",
      title: "Küçük ğ",
      hamle: 3,
      hint: "3 hamle · g gövdesi + üst yay",
      strokes: [
        {
          id: "ğ1",
          label: "1",
          /* Aynı g kâsesi */
          d: "M 130.5 143.8 A 34.5 34.5 0 1 0 130.5 176.2",
          tip: "Sağ üstten başla, açık kâseyi ters saat yönünde çiz"
        },
        {
          id: "ğ2",
          label: "2",
          /* Aynı g kuyruğu */
          d: "M 132 125.5 L 132 216 C 130 252 98 260 78 246",
          tip: "Sağ üstten aşağı in, sonda sola kıvrıl"
        },
        {
          id: "ğ3",
          label: "3",
          /* Breve ∪ · beyaz bantta (orta aşağı bakar) */
          d: "M 84 88 Q 100 104 116 88",
          tip: "Üste yay koy"
        }
      ]
    },
    Ğ: {
      id: "Ğ",
      label: "Ğ",
      case: "upper",
      title: "Büyük Ğ",
      hamle: 2,
      hint: "2 hamle · G gövdesi + üst yay",
      strokes: [
        {
          id: "Ğ1",
          label: "1",
          /* Aynı G */
          d: "M 164.52 82.75 A 74.5 74.5 0 1 0 174.5 120 L 96 120",
          tip: "Sağ üstten yuvarla, ortada içe doğru çubuk çek"
        },
        {
          id: "Ğ2",
          label: "2",
          /* Breve ∪ · üst çizginin üstünde */
          d: "M 78 18 Q 100 34 122 18",
          tip: "Üste yay koy"
        }
      ]
    },

    c: {
      id: "c",
      label: "c",
      case: "lower",
      title: "Küçük c",
      hamle: 1,
      hint: "1 hamle · sağ üstten açık yay",
      strokes: [
        {
          id: "c1",
          label: "1",
          /*
           * o dairesi · sağda açık C (kapalı değil).
           * Başlangıç ~2 yönü, ters saat; altta hafif yukarı kıvrılıp sağda biter.
           */
          d: "M 129.88 142.75 A 34.5 34.5 0 1 0 129.88 177.25",
          tip: "Sağ üstten başla, ters saat yönünde açık yay çiz"
        }
      ]
    },
    C: {
      id: "C",
      label: "C",
      case: "upper",
      title: "Büyük C",
      hamle: 1,
      hint: "1 hamle · sağ üstten açık yay",
      strokes: [
        {
          id: "C1",
          label: "1",
          /*
           * O dairesi · sağda açık C (üst–alt değme).
           * Aynı başlangıç; altta hafif yukarı kıvrılıp sağda biter.
           */
          d: "M 164.52 82.75 A 74.5 74.5 0 1 0 164.52 157.25",
          tip: "Sağ üstten başla, ters saat yönünde açık yay çiz"
        }
      ]
    },

    ş: {
      id: "ş",
      label: "ş",
      case: "lower",
      title: "Küçük ş",
      hamle: 2,
      hint: "2 hamle · s gövdesi, sonra alt çizgi",
      strokes: [
        {
          id: "ş1",
          label: "1",
          /* Aynı s gövdesi */
          d: "M 130 142.75 A 30 17.25 0 0 0 70 142.75 C 70 160 130 160 130 177.25 A 30 17.25 0 0 1 78 189",
          tip: "Sağ üstten sola başla, S şeklinde çiz"
        },
        {
          id: "ş2",
          label: "2",
          /* ç cedillası gibi · tabanın altında, gövdeye değmez */
          d: "M 100 212 L 100 228",
          tip: "Altta gövdeye değmeden yukarıdan aşağı çiz"
        }
      ]
    },
    Ş: {
      id: "Ş",
      label: "Ş",
      case: "upper",
      title: "Büyük Ş",
      hamle: 2,
      hint: "2 hamle · S gövdesi, sonra alt çizgi",
      strokes: [
        {
          id: "Ş1",
          label: "1",
          /* Aynı S gövdesi */
          d: "M 146 82.75 A 46 37.25 0 0 0 54 82.75 C 54 120 146 120 146 157.25 A 46 37.25 0 0 1 64 180",
          tip: "Sağ üstten sola başla, S şeklinde çiz"
        },
        {
          id: "Ş2",
          label: "2",
          d: "M 100 212 L 100 232",
          tip: "Altta gövdeye değmeden yukarıdan aşağı çiz"
        }
      ]
    },

    p: {
      id: "p",
      label: "p",
      case: "lower",
      title: "Küçük p",
      hamle: 2,
      hint: "2 hamle · dik sap, sonra sağ kâse",
      strokes: [
        {
          id: "p1",
          label: "1",
          /*
           * Orta çizgiden tabanın altına in (descender).
           * b sapı x=72 · y kuyruk payı gibi düz in.
           */
          d: "M 72 125.5 L 72 246",
          tip: "Ortadan aşağı dik in (tabanı geç)"
        },
        {
          id: "p2",
          label: "2",
          /*
           * b ile aynı: ağzı birleşmeyen açık yuvarlak (ters c / o), saat yönü.
           * Sap solda ağzı tamamlar; tam yarım daire DEĞİL.
           */
          d: "M 74 143.8 A 34.5 34.5 0 1 1 74 176.2",
          tip: "Ortadan sağa açık kâse çiz (saat yönü)"
        }
      ]
    },
    P: {
      id: "P",
      label: "P",
      case: "upper",
      title: "Büyük P",
      hamle: 2,
      hint: "2 hamle · dik çizgi, sonra üst kavis",
      strokes: [
        {
          id: "P1",
          label: "1",
          d: "M 58 45.5 L 58 194.5",
          tip: "Üstten aşağı dik in"
        },
        {
          id: "P2",
          label: "2",
          /*
           * R2 ile aynı yapı (dik temel P kâsesi):
           * üst çizgide sağa omuz → geniş elips yay (saat yönü) → orta çizgide sola sap.
           * Sağ uç ~162 (D genişliği); dar cubic yok.
           */
          d: "M 58 45.5 L 98 45.5 A 52 37.25 0 0 1 98 120 L 58 120",
          tip: "Üstten sağa geniş kavis çiz, ortada sapta birleştir"
        }
      ]
    },

    h: {
      id: "h",
      label: "h",
      case: "lower",
      title: "Küçük h",
      hamle: 2,
      hint: "2 hamle · dik sap, sonra kemer",
      strokes: [
        {
          id: "h1",
          label: "1",
          /* Üst–alt tam boy sap */
          d: "M 72 45.5 L 72 194.5",
          tip: "Üstten aşağı dik in"
        },
        {
          id: "h2",
          label: "2",
          /*
           * n kemeri gibi: tepe TAM orta çizgide (y=120), gövde pembe bantta.
           * Sol sap zaten üst–alt; kemer beyaza ÇIKMAZ.
           */
          d: "M 72 158 A 38 38 0 0 1 148 158 L 148 194.5",
          tip: "Ortadan kemer çiz (tepe orta çizgi), sağdan tabana in"
        }
      ]
    },
    H: {
      id: "H",
      label: "H",
      case: "upper",
      title: "Büyük H",
      hamle: 3,
      hint: "3 hamle · sol dik, sağ dik, orta çizgi",
      strokes: [
        {
          id: "H1",
          label: "1",
          d: "M 58 45.5 L 58 194.5",
          tip: "Soldan yukarıdan aşağı dik in"
        },
        {
          id: "H2",
          label: "2",
          d: "M 142 45.5 L 142 194.5",
          tip: "Sağdan yukarıdan aşağı dik in"
        },
        {
          id: "H3",
          label: "3",
          /* Çubuk tam orta çizgide */
          d: "M 58 120 L 142 120",
          tip: "Ortada soldan sağa çiz"
        }
      ]
    },

    v: {
      id: "v",
      label: "v",
      case: "lower",
      title: "Küçük v",
      hamle: 1,
      hint: "1 hamle · sol in, sağ çık",
      strokes: [
        {
          id: "v1",
          label: "1",
          /* Pembe bant: orta–taban–orta · tek hamle */
          d: "M 68 125.5 L 100 194.5 L 132 125.5",
          tip: "Sol üstten tabana in, sağa yukarı çık"
        }
      ]
    },
    V: {
      id: "V",
      label: "V",
      case: "upper",
      title: "Büyük V",
      hamle: 1,
      hint: "1 hamle · sol in, sağ çık",
      strokes: [
        {
          id: "V1",
          label: "1",
          /* Üst–taban–üst · tek hamle */
          d: "M 48 45.5 L 100 194.5 L 152 45.5",
          tip: "Sol üstten tabana in, sağa yukarı çık"
        }
      ]
    },

    f: {
      id: "f",
      label: "f",
      case: "lower",
      title: "Küçük f",
      hamle: 2,
      hint: "2 hamle · üst kanca + dik, sonra orta çizgi",
      strokes: [
        {
          id: "f1",
          label: "1",
          /*
           * yazF7 kancası aynı · sadece uç hafif kısaltıldı (silgi).
           */
          d: "M 139.7 62.3 C 138.1 51 130 42.6 116 44 C 104 46 100 58 100 76 L 100 194.5",
          tip: "Sağ uçtan yumuşak kanca, aşağı dik in"
        },
        {
          id: "f2",
          label: "2",
          /* Tam orta çizgide · gövdenin iki yanına kısa */
          d: "M 72 120 L 128 120",
          tip: "Orta çizgide soldan sağa çiz"
        }
      ]
    },
    F: {
      id: "F",
      label: "F",
      case: "upper",
      title: "Büyük F",
      hamle: 3,
      hint: "3 hamle · dik + üst yatay + orta yatay",
      strokes: [
        {
          id: "F1",
          label: "1",
          d: "M 58 45.5 L 58 194.5",
          tip: "Üstten aşağı dik in"
        },
        {
          id: "F2",
          label: "2",
          d: "M 58 45.5 L 152 45.5",
          tip: "Üstte soldan sağa çiz"
        },
        {
          id: "F3",
          label: "3",
          /* Orta çizgide, üstten kısa */
          d: "M 58 120 L 130 120",
          tip: "Ortada soldan sağa kısa çiz"
        }
      ]
    },

    j: {
      id: "j",
      label: "j",
      case: "lower",
      title: "Küçük j",
      hamle: 2,
      hint: "2 hamle · dik + sol kanca, sonra nokta",
      strokes: [
        {
          id: "j1",
          label: "1",
          /*
           * Referans: orta çizgiden in, tabanı geç, sola açık kanca.
           * Uç ~10 yönü · gövdeye aşırı kıvrılmaz (y/g kuyruğu gibi açık).
           */
          d: "M 100 125.5 L 100 216 C 100 250 70 256 54 240",
          tip: "Ortadan aşağı in, sola yumuşak kanca"
        },
        {
          id: "j2",
          label: "2",
          /* i noktasından biraz aşağı (beyaz bantta kalır) */
          d: "M 100 88 L 100 102",
          tip: "Üste nokta koy"
        }
      ]
    },
    J: {
      id: "J",
      label: "J",
      case: "upper",
      title: "Büyük J",
      hamle: 1,
      hint: "1 hamle · üstten dik + sol kanca",
      strokes: [
        {
          id: "J1",
          label: "1",
          /*
           * Üst çizgiden in; kanca dibi CL 194.5’e değer (stroke taban çizgisine oturur).
           */
          d: "M 118 45.5 L 118 160 C 118 204 75 204 55 170",
          tip: "Üstten aşağı in, sola yumuşak kanca"
        }
      ]
    }
  };

  var SOUND_MAP = {
    a: ["a", "A"],
    n: ["n", "N"],
    e: ["e", "E"],
    t: ["t", "T"],
    i: ["i", "İ"],
    l: ["l", "L"],
    o: ["o", "O"],
    k: ["k", "K"],
    u: ["u", "U"],
    r: ["r", "R"],
    ı: ["ı", "I"],
    m: ["m", "M"],
    ü: ["ü", "Ü"],
    s: ["s", "S"],
    ö: ["ö", "Ö"],
    y: ["y", "Y"],
    d: ["d", "D"],
    z: ["z", "Z"],
    ç: ["ç", "Ç"],
    b: ["b", "B"],
    g: ["g", "G"],
    ğ: ["ğ", "Ğ"],
    c: ["c", "C"],
    ş: ["ş", "Ş"],
    p: ["p", "P"],
    h: ["h", "H"],
    v: ["v", "V"],
    f: ["f", "F"],
    j: ["j", "J"]
  };

  function getLetter(key) {
    return LETTERS[key] || null;
  }

  function hasWriting(soundId) {
    var id = String(soundId || "").toLocaleLowerCase("tr-TR");
    return !!SOUND_MAP[id];
  }

  function lettersForSound(soundId) {
    var id = String(soundId || "").toLocaleLowerCase("tr-TR");
    var keys = SOUND_MAP[id] || [];
    return keys
      .map(function (k) {
        return LETTERS[k];
      })
      .filter(Boolean);
  }

  global.NovaBirlestirelimYazilisData = {
    LETTERS: LETTERS,
    SOUND_MAP: SOUND_MAP,
    getLetter: getLetter,
    hasWriting: hasWriting,
    lettersForSound: lettersForSound
  };
})(typeof window !== "undefined" ? window : globalThis);

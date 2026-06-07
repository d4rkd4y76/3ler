# -*- coding: utf-8 -*-
"""Complete paired question rows for noktalama and paragraf banks."""
from __future__ import annotations

from bank_diversify import PARAGRAF_STEMS

# ── helpers ──────────────────────────────────────────────────────────────────

def _r(level: str, stem: str, c: str, w1: str, w2: str, exp: str, premise: str | None = None) -> tuple:
    if premise:
        return (level, stem, c, w1, w2, exp, premise)
    return (level, stem, c, w1, w2, exp)


def _rp(*items: tuple[str, str]) -> str:
    return "\n".join(f"{label}. {text}" for label, text in items)


# ── NOKTALAMA: 150 paired rows (50 iki nokta / 50 kısa çizgi / 50 tırnak) ───
# Order: kolay×50, orta×50, zor×50 — each level interleaves 17+17+16 topics

def build_noktalama_rows() -> list[tuple]:
    rows: list[tuple] = []

    # ── KOLAY: iki nokta (17) ──
    rows += [
        _r("kolay", "İki nokta işareti genelde hangi durumda kullanılır?", "Örnek veya liste verirken", "Konuşma yazarken", "Kelime bölerken", "İki nokta, ardından örnek, liste veya açıklama geleceğini bildirir."),
        _r("kolay", "Örnek vermeden hemen önce hangi noktalama işareti konur?", "iki nokta", "tırnak işareti", "kısa çizgi", "Örnek veya sıralama yapmadan hemen önce iki nokta konur."),
        _r("kolay", "Sıralama yapılacaksa hangi işaret kullanılır?", "iki nokta", "soru işareti", "ünlem", "Sıralanan sözcüklerden önce iki nokta kullanılır."),
        _r("kolay", "Liste verilmeden önce hangi işaret gelmelidir?", "iki nokta", "nokta", "tırnak işareti", "Liste öğeleri iki noktadan sonra virgülle ayrılarak yazılır."),
        _r("kolay", "Açıklama yapılacaksa hangi noktalama işareti kullanılır?", "iki nokta", "kısa çizgi", "tırnak işareti", "Açıklanan bölümden hemen önce iki nokta konur."),
        _r("kolay", "İki nokta (:) işareti ne işe yarar?", "Örnek veya açıklama öncesi konur", "Her cümle sonunda konur", "Kelime bölmek için konur", "İki nokta, devamında örnek, liste veya açıklama olacağını gösterir."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde iki nokta doğru kullanılmıştır?", "Meyveler: elma, armut, muz.", "Meyveler elma, armut, muz.", "Meyveler; elma, armut, muz.", "Meyve adları listelenmeden önce iki nokta konmuştur."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde iki nokta eksiktir?", "Sınıf kuralları sessiz ol, sıraya gir, dinle.", "Sınıf kuralları: sessiz ol, sıraya gir, dinle.", "Sınıf kuralları; sessiz ol.", "Kurallar sıralanmadan önce iki nokta olmalıydı; birinci cümlede eksiktir."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde iki nokta yanlış yerde kullanılmıştır?", "Mavi: rengi çok severim.", "Sevdiğim renkler: mavi, yeşil, sarı.", "Derslerim: Türkçe, matematik, fen.", "Renk adından hemen sonra gereksiz iki nokta konmuştur."),
        _r("kolay", "Boş bırakılan yere hangi işaret gelmelidir? En sevdiğim renkler _____ kırmızı, mavi, yeşil.", ":", ";", ".", "Renk listesinden önce iki nokta konmalıdır."),
        _r("kolay", "Boş bırakılan yere hangi işaret gelmelidir? Sınıf kuralları _____ sessiz ol, sıraya gir.", ":", ",", ".", "Kurallar listelenmeden önce iki nokta gelir."),
        _r("kolay", "Boş bırakılan yere hangi işaret gelmelidir? Aldığımız malzemeler _____ un, su, tuz.", ":", ";", "-", "Malzeme listesinden önce iki nokta konur."),
        _r("kolay", "İki noktadan sonra genellikle ne gelir?", "Örnek, liste veya açıklama", "Cümle sonu noktası", "Soru işareti", "İki noktadan sonra örnek verilen sözcükler, liste ya da açıklama gelir."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde örnek vermek için iki nokta kullanılmıştır?", "Bir hayvan gördük: kedi.", "Bir: hayvan gördük kedi.", "Bir hayvan gördük kedi.", "Örnek olan kedi sözcüğünden önce iki nokta konmuştur."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde liste için iki nokta doğrudur?", "Oyunlarımız: saklambaç, körebe, seksek.", "Oyunlarımız saklambaç körebe seksek.", "Oyunlarımız; saklambaç, körebe.", "Oyun adları iki noktadan sonra virgülle sıralanmıştır."),
        _r("kolay", "İki nokta hangi amaçla kullanılmaz?", "Her kelimeden sonra ayırmak", "Liste vermeden önce", "Örnek vermeden önce", "İki nokta rastgele kelime ayırmak için kullanılmaz; belirli amaçlarla konur."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde iki nokta ile açıklama yapılmıştır?", "Tek isteğim var: sabırlı ol.", "Tek: isteğim var sabırlı ol.", "Tek isteğim var sabırlı ol.", "Açıklanan kısımdan önce iki nokta doğru kullanılmıştır."),
    ]

    # ── KOLAY: kısa çizgi (17) ──
    rows += [
        _r("kolay", "Satır sonunda kelime bölmek için hangi işaret kullanılır?", "kısa çizgi", "iki nokta", "nokta", "Satır sonuna sığmayan kelimeler kısa çizgi ile bölünür."),
        _r("kolay", "Kısa çizgi (-) ne zaman kullanılır?", "Satır sonunda kelime bölerken", "Cümle sonunda", "Konuşma yazarken", "Kısa çizgi satır sonunda kelime bölmek için kullanılır."),
        _r("kolay", "Uzun kelimeler satır sonuna sığmazsa ne yapılır?", "Kısa çizgi ile bölünür", "Silinir", "Birleştirilir", "Kelimenin bir kısmı alt satıra geçer; bölme yerinde kısa çizgi konur."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde kısa çizgi doğru kullanılmıştır?", "Okul-umuz bahçede oynuyor.", "Okulumuz bahçe-de oynuyor.", "Okulumuz bahçede o-yunuyor.", "Okulumuz kelimesi okul-umuz şeklinde heceye uygun bölünmüştür."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde kelime bölme yanlıştır?", "Öğret-men sınıfa girdi.", "Öğr-etmen sınıfa girdi.", "Öğretmen sınıfa girdi.", "Öğr-etmen bölmesi hece yapısına uymaz; kelime anlamsız parçalara ayrılmıştır."),
        _r("kolay", "Satır sonunda \"kitaplık\" kelimesi nasıl bölünür?", "kitap-lık", "kit-aplık", "kita-plık", "Kitaplık kelimesi heceye uygun olarak kitap-lık şeklinde bölünür."),
        _r("kolay", "Satır sonunda \"öğretmen\" kelimesi nasıl bölünür?", "öğ-retmen", "öğret-men", "öğre-tmen", "Öğretmen kelimesi öğ-retmen şeklinde heceye uygun bölünür."),
        _r("kolay", "Satır sonunda \"pencere\" kelimesi nasıl bölünür?", "pen-cere", "pence-re", "pencer-e", "Pencere kelimesi pen-cere şeklinde bölünür."),
        _r("kolay", "Satır sonunda \"sandalye\" kelimesi nasıl bölünür?", "san-dalye", "sand-alye", "sandal-ye", "Sandalye kelimesi san-dalye şeklinde bölünebilir."),
        _r("kolay", "Satır sonunda \"kalemlik\" kelimesi nasıl bölünür?", "kalem-lik", "kaleml-ik", "ka-lemlik", "Kalemlik kelimesi kalem-lik şeklinde heceye uygun bölünür."),
        _r("kolay", "Kısa çizgi kelime ortasında keyfi olarak konur mu?", "Hayır, yalnızca satır sonunda bölme için", "Evet, her yerde", "Evet, cümle ortasında", "Kısa çizgi yalnızca satır sonunda kelime bölmek için kullanılır."),
        _r("kolay", "Kısa çizgi ile kelime bölünürken ilk parçanın sonunda ne olur?", "kısa çizgi", "nokta", "virgül", "Bölünen kelimenin ilk parçasının sonuna kısa çizgi konur."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde kısa çizgi kelime bölmek için kullanılmıştır?", "Tatil-lerde denize gideriz.", "Tatillerde denize gideriz.", "Tatillerde deni-ze gideriz.", "Tatiller kelimesi tatil-lerde şeklinde satır sonunda bölünebilir."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde kelime bölme doğrudur?", "Karde-şim okula geldi.", "Kardeş-im okula geldi.", "Kardeşi-m okula geldi.", "Karde-şim bölmesi hece yapısına uygundur; kelime anlamını koruyarak bölünmüştür."),
        _r("kolay", "Boş bırakılan yere hangi bölüm gelmelidir? Öğret-_____ tahtaya yazdı.", "men", "mene", "meni", "Öğretmen kelimesinin ikinci hecesi men olmalıdır."),
        _r("kolay", "Boş bırakılan yere hangi bölüm gelmelidir? Tatil-_____ başladı.", "ler", "lerde", "le", "Tatil kelimesi tatil-ler şeklinde bölünür; ler eki gelir."),
        _r("kolay", "Boş bırakılan yere hangi bölüm gelmelidir? Karde-_____ okula geldi.", "şim", "şimi", "sim", "Kardeşim kelimesi karde-şim şeklinde bölünür."),
    ]

    # ── KOLAY: tırnak (16) ──
    rows += [
        _r("kolay", "Konuşma cümlelerinde hangi noktalama işareti kullanılır?", "tırnak işareti", "iki nokta", "kısa çizgi", "Bir kişinin söylediği sözler tırnak içine alınır."),
        _r("kolay", "Başkasının sözünü olduğu gibi aktarırken hangi işaret kullanılır?", "tırnak işareti", "virgül", "ünlem", "Alıntı ve konuşma sözleri tırnak içinde yazılır."),
        _r("kolay", "Alıntı cümlelerde sözler nasıl yazılır?", "Tırnak içinde", "Parantez içinde", "Altı çizili", "Başkasının sözü veya alıntı tırnak içine alınır."),
        _r("kolay", "Konuşma cümlesinde tırnak nereye konur?", "Söylenen sözün başına ve sonuna", "Sadece cümlenin sonuna", "Sadece dedi kelimesinden önce", "Konuşulan bölümün tamamı tırnak içine alınır."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde tırnak doğru kullanılmıştır?", "Ali \"Ödevimi bitirdim.\" dedi.", "Ali Ödevimi bitirdim dedi.", "Ali \"Ödevimi bitirdim dedi.", "Konuşulan söz tırnak içinde olmalı; dedi sözü tırnak dışında kalır."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde tırnak yanlış kullanılmıştır?", "Annem, \"Sofraya gel.\" dedi.", "Annem \"Sofraya gel dedi.", "Annem, Sofraya gel dedi.", "İkinci cümlede tırnak açılmış ama kapatılmamış ve nokta eksiktir."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde tırnak eksiktir?", "Öğretmen \"Kitaplarınızı açın.\" dedi.", "Öğretmen Kitaplarınızı açın dedi.", "Öğretmen \"Kitaplarınızı açın dedi.\"", "Konuşma sözü tırnak içine alınmadan yazılmıştır."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde konuşma cümlesi doğrudur?", "\"Yarın sinemaya gidelim.\" önerdi kardeşim.", "\"Yarın sinemaya gidelim\" önerdi kardeşim.", "Yarın sinemaya gidelim önerdi kardeşim.", "Önerilen söz tırnak içinde olmalı ve cümle noktayla bitmelidir."),
        _r("kolay", "Konuşma cümlesinde \"dedi\" kelimesi nerede olur?", "Tırnak dışında, cümlenin sonunda", "Tırnak içinde", "Tırnaktan önce", "Dedi, söyledi gibi fiiller konuşma tırnağının dışında kalır."),
        _r("kolay", "Alıntı cümlede tırnak ne işe yarar?", "Alıntılanan sözü ayırır", "Cümleyi bitirir", "Kelime böler", "Tırnak, başkasından alınan sözü metinden ayırır."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde alıntı doğru yazılmıştır?", "Kitapta \"Okuyan kazanır.\" yazıyordu.", "Kitapta Okuyan kazanır yazıyordu.", "Kitapta \"Okuyan kazanır yazıyordu.", "Kitaptan alınan söz tırnak içinde yazılmalıdır."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde tırnak konuşma için kullanılmıştır?", "Baba, \"Eve erken gel.\" dedi.", "Baba Eve erken gel dedi.", "Baba \"Eve erken gel dedi.", "Babanın söylediği emir cümlesi tırnak içinde yazılmıştır."),
        _r("kolay", "Boş bırakılan yere hangi işaret gelmelidir? Annem dedi ki _____", "\"Yemek hazır.\"", "Yemek hazır.", "\"Yemek hazır", "Konuşma sözü tırnak içinde ve noktayla bitmelidir."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde tırnak doğru kapatılmıştır?", "Dedem, \"Hikâye anlatayım.\" dedi.", "Dedem, \"Hikâye anlatayım dedi.", "Dedem, Hikâye anlatayım.\" dedi.", "Tırnak hem açılıp hem kapatılmalıdır."),
        _r("kolay", "Aşağıdaki cümlelerden hangisinde konuşma tırnağı eksiktir?", "Anne bana bak dedi.", "Anne \"Bana bak.\" dedi.", "Anne, \"Bana bak.\" dedi.", "Anne bana bak dedi cümlesinde konuşma sözü tırnak içine alınmamıştır."),
        _r("kolay", "Tırnak işareti hangi cümle türünde çok kullanılır?", "konuşma cümlesi", "soru cümlesi", "haber cümlesi", "Kişinin doğrudan söylediği sözler konuşma cümlesidir ve tırnakla gösterilir."),
    ]

    # ── ORTA: iki nokta (17) ──
    rows += [
        _r("orta", "Aşağıdaki cümlelerden hangisinde iki nokta ve virgül birlikte doğru kullanılmıştır?", "Alışveriş listem: ekmek, süt, peynir.", "Alışveriş listem ekmek süt peynir.", "Alışveriş: listem ekmek, süt.", "Liste öğeleri iki noktadan sonra virgülle ayrılmıştır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde iki nokta ile sıralama yapılmıştır?", "Spor dalları: voleybol, basketbol, futbol.", "Spor dalları voleybol basketbol futbol.", "Spor: dalları voleybol, basketbol.", "Spor dalları iki noktadan sonra virgülle sıralanmıştır."),
        _r("orta", "Boşluğa hangi noktalama gelmelidir? Teneffüste oynadığımız oyunlar _____ seksek, yakalambaç, ip atlama.", ":", ";", ".", "Oyun adları listelenmeden önce iki nokta gelir."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde iki nokta gereksiz kullanılmıştır?", "Ali: bugün okula geldi.", "Sevdiğim renkler: mavi, yeşil.", "Örnek verelim: elma, armut.", "İlk cümlede iki nokta anlamsız yerde kullanılmıştır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde örnek verme amacıyla iki nokta konmuştur?", "Bir kuş gördük: serçe.", "Bir: kuş gördük serçe.", "Bir kuş gördük serçe.", "Örnek olan serçe sözcüğünden önce iki nokta konmuştur."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde iki nokta ile açıklama doğru kurulmuştur?", "Tek ricam var: sabırlı ol.", "Tek: ricam var sabırlı ol.", "Tek ricam var sabırlı ol.", "Rica cümlesinde açıklama kısmından önce iki nokta doğru konmuştur."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde iki nokta eksik bırakılmıştır?", "Derslerimiz Türkçe, matematik, fen.", "Derslerimiz: Türkçe, matematik, fen.", "Derslerimiz; Türkçe, matematik.", "Ders adları sıralanmadan önce iki nokta eksiktir."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde iki nokta anlamsız yerde kullanılmıştır?", "Bugün: hava çok güzel.", "Bugün hava çok güzel.", "Bugün hava: çok güzel.", "İlk cümlede iki nokta gereksiz ve anlamsız yerdedir."),
        _r("orta", "Boşluğa hangi işaret gelmelidir? Çantamdaki eşyalar _____ defter, kalem, silgi, su şişesi.", ":", ",", "-", "Eşya listesinden önce iki nokta konur."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde iki nokta ile örnek verilmiştir?", "Gördüğümüz renkler: sarı, mor, turuncu.", "Gördüğümüz renkler sarı mor turuncu.", "Gördüğümüz: renkler sarı.", "Renk örnekleri iki noktadan sonra verilmiştir."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde iki nokta yanlış kullanılmıştır?", "Ev: işleri süpür, topla.", "Ev işleri: süpür, topla, düzenle.", "Ev işleri süpür topla düzenle.", "Ev sözcüğünden hemen sonra konan iki nokta yanlıştır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde iki nokta doğru yerdedir?", "Hayvanlar: kedi, köpek, kuş.", "Hayvanlar kedi köpek kuş.", "Hayvanlar; kedi, köpek.", "Hayvan listesi iki noktadan önce doğru konmuştur."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde iki nokta ve nokta birlikte doğrudur?", "Okul etkinlikleri: tiyatro, müzik, resim sergisi.", "Okul etkinlikleri tiyatro müzik resim sergisi", "Okul etkinlikleri: tiyatro müzik resim sergisi", "Liste sonunda cümle noktayla bitmeli; iki nokta ve virgüller doğrudur."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde iki nokta ile liste hatalıdır?", "Sebzeler havuç patates soğan.", "Sebzeler: havuç, patates, soğan.", "Sebzeler; havuç, patates.", "Liste öncesi iki nokta olmadan yazılmıştır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde iki nokta örnek verme için yanlış kullanılmıştır?", "Mavi: rengi çok severim.", "Bir meyve seçtik: portakal.", "Örnek: elma.", "Renk adından hemen sonra konan iki nokta örnek verme amacıyla değildir."),
        _r("orta", "Boşluğa hangi işaret gelmelidir? Okul etkinlikleri _____ tiyatro, müzik, resim sergisi.", ":", ";", ".", "Etkinlik listesinden önce iki nokta konur."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde iki nokta ile açıklama hatalıdır?", "Tek: isteğim var sabırlı ol.", "Tek isteğim var: sabırlı ol.", "Tek isteğim var sabırlı ol.", "İstek sözcüğünün ortasına konan iki nokta hatalıdır."),
    ]

    # ── ORTA: kısa çizgi (17) ──
    rows += [
        _r("orta", "Aşağıdaki cümlelerden hangisinde heceye uygun kelime bölme vardır?", "Öğ-renciler bahçede oynuyor.", "Öğren-ciler bahçede oynuyor.", "Öğrenci-ler bahçede oynuyor.", "Öğ-renciler bölmesi hece yapısına uygundur; kelime doğru parçalara ayrılmıştır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde kısa çizgi yanlış kullanılmıştır?", "Okulumuz bahçede o-yunuyor.", "Okul-umuz bahçede oynuyor.", "Okulumuz bahçede oynuyor.", "Oyun sözcüğünün ortasına konan kısa çizgi anlamsızdır."),
        _r("orta", "Satır sonunda \"öğrenciler\" kelimesi nasıl bölünür?", "öğ-ren-ciler", "öğrenci-ler", "öğre-nciler", "Öğrenciler kelimesi öğ-ren-ciler şeklinde bölünür."),
        _r("orta", "Satır sonunda \"bilgisayar\" kelimesi nasıl bölünür?", "bilgi-sayar", "bil-gisayar", "bilgisay-ar", "Bilgisayar kelimesi bilgi-sayar şeklinde bölünür."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde kısa çizgi satır sonu bölmesi değildir?", "Okulumuz bahçede oynuyor.", "Okul-umuz bahçede oynuyor.", "Okul-umuz bahçede o-yunuyor.", "Kısa çizgi olmadan yazılan cümlede satır sonu bölmesi yoktur."),
        _r("orta", "Boşluğa hangi bölüm gelmelidir? Ders-_____ başladı.", "ler", "lerimiz", "le", "Dersler kelimesi ders-ler şeklinde bölünür."),
        _r("orta", "Boşluğa hangi bölüm gelmelidir? Sınıf-_____ temizlendi.", "ımız", "imiz", "ta", "Sınıfımız kelimesi sınıf-ımız şeklinde bölünür."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde kelime bölme kurallara aykırıdır?", "Kütüpha-nede kitap okuduk.", "Kütüphane-de kitap okuduk.", "Kütüphane açıktı.", "Kütüphane-de bölmesi hece yapısına uymaz; kelime yanlış yerden ayrılmıştır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde kısa çizgi ile bölme doğrudur?", "Arka-daşım okula geldi.", "Arkada-şım okula geldi.", "Arka-da-şım okula geldi.", "Arkadaş kelimesi arka-daş şeklinde doğru bölünmüştür."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde kelime anlamsız bölünmüştür?", "Sand-alye başında durdu.", "San-dalye başında durdu.", "Sandalye başında durdu.", "Sandalye kelimesinin sand-alye şeklinde bölünmesi anlamı bozar."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde kısa çizgi doğru, anlam bozulmamıştır?", "Kütüpha-ne açıktı.", "Kütüph-ane açıktı.", "Kütüphane açıktı.", "Kütüphane kelimesi kütüpha-ne şeklinde anlamlı bölünmüştür."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde kısa çizgi gereksiz kullanılmıştır?", "Bugün hava çok güzel.", "Bugün ha-va çok güzel.", "Bugün hava ç-ok güzel.", "Kısa kelimeler bölünmeden yazılmalıdır."),
        _r("orta", "Satır sonunda \"kütüphane\" kelimesi nasıl bölünür?", "kütüpha-ne", "kütüph-ane", "kütüphane", "Kütüphane kelimesi kütüpha-ne şeklinde bölünür."),
        _r("orta", "Satır sonunda \"arkadaş\" kelimesi nasıl bölünür?", "arka-daş", "arkad-aş", "arkada-ş", "Arkadaş kelimesi arka-daş şeklinde bölünür."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde kelime bölme heceye uygundur?", "Öğret-men sınıfa girdi.", "Öğr-etmen sınıfa girdi.", "Öğretmen- sınıfa girdi.", "Öğretmen kelimesi öğret-men şeklinde heceye uygundur."),
        _r("orta", "Boşluğa hangi bölüm gelmelidir? Bahçe-_____ çiçekler açtı.", "mizde", "miz", "de", "Bahçemizde kelimesi bahçe-mizde şeklinde bölünür."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde kısa çizgi kelime bölmek dışında kullanılmıştır?", "Ali - Mehmet okula gitti.", "Ali okul-a gitti.", "Ali okula git-ti.", "İsimler arasına konan kısa çizgi satır sonu bölmesi değildir."),
    ]

    # ── ORTA: tırnak (16) ──
    rows += [
        _r("orta", "Aşağıdaki cümlelerden hangisinde konuşma cümlesinin tırnağı doğrudur?", "Kardeşim, \"Hadi dışarı çıkalım.\" dedi.", "Kardeşim \"Hadi dışarı çıkalım dedi.", "Kardeşim, Hadi dışarı çıkalım.\" dedi.", "Konuşma virgül sonrası tırnakla başlar ve noktayla biter."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde alıntı yanlış yazılmıştır?", "Atatürk \"Hayatta en hakiki mürşit ilimdir.\" demiştir.", "Atatürk Hayatta en hakiki mürşit ilimdir demiştir.", "Atatürk \"Hayatta en hakiki mürşit ilimdir demiştir.", "Ünlü söz tırnak içinde ve noktayla bitmelidir."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde konuşma cümlesi yanlıştır?", "Öğretmen \"Sessiz olun.\" dedi.", "Öğretmen Sessiz olun dedi.", "Öğretmen, \"Sessiz olun.\" dedi.", "Öğretmen Sessiz olun dedi cümlesinde söz tırnak içine alınmamıştır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde alıntı doğru kullanılmıştır?", "Annesi \"Dost kara günde belli olur.\" demiş.", "Annesi Dost kara günde belli olur demiş.", "Annesi \"Dost kara günde belli olur demiş.", "Alıntı söz tırnak içinde ve noktayla bitmelidir."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde tırnak yeri yanlıştır?", "Ali \"Ödevimi bitirdim.\" dedi.", "\"Ali ödevini bitirdi.\" yazdı öğretmen.", "Öğretmen \"Dikkatli dinleyin.\" dedi.", "İkinci cümlede tırnak haber cümlesinin tamamını kapsamamalı; yalnızca alıntı tırnak içinde olmalıdır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde hem tırnak hem nokta doğrudur?", "Anne, \"Yemeği getirdim.\" dedi.", "Anne \"Yemeği getirdim dedi.", "Anne, Yemeği getirdim.\" dedi.", "Tırnak içi cümle noktayla biter ve tırnak kapatılır."),
        _r("orta", "Boşluğa hangi noktalama gelmelidir? Kardeşim bana _____ \"Hadi dışarı çıkalım.\" dedi.", ",", ":", "-", "Konuşmadan önce virgül konur; söz tırnak içinde yazılır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde konuşma cümlesi doğru bitmiştir?", "Baba, \"Eve erken gel.\" dedi.", "Baba \"Eve erken gel dedi.", "Baba, Eve erken gel.\" dedi.", "Konuşma tırnak içinde noktayla bitmelidir."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde alıntı ve noktalama doğrudur?", "Gazetede \"Yarın kar yağacak.\" yazıyordu.", "Gazetede Yarın kar yağacak yazıyordu.", "Gazetede \"Yarın kar yağacak yazıyordu.", "Gazete başlığı tırnak içinde ve noktalı yazılmalıdır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde tırnak açılıp kapanmamıştır?", "Komşu \"Yardımınız için teşekkürler dedi.", "Komşu, \"Yardımınız için teşekkürler.\" dedi.", "Komşu, Yardımınız için teşekkürler dedi.", "Tırnak açılmış ama kapatılmamıştır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde konuşma ve alıntı karışmış hatalıdır?", "Öğretmen şunu söyledi: \"Sıraya girin.\"", "Öğretmen şunu söyledi \"Sıraya girin.\"", "Öğretmen: şunu söyledi \"Sıraya girin\"", "İkinci cümlede iki nokta eksik ve tırnak yeri hatalıdır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde konuşma tırnağı doğru kapatılmıştır?", "\"Ödevini yaptın mı?\" diye sordu annem.", "\"Ödevini yaptın mı diye sordu annem.", "Ödevini yaptın mı? diye sordu annem.", "Soru biçimindeki konuşma tırnak içine alınmış ve kapatılmıştır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde alıntı cümle tırnak içinde değildir?", "Müdür duyurdu: \"Yarın tören var.\"", "Müdür duyurdu \"Yarın tören var.\"", "Müdür duyurdu: Yarın tören var.", "Duyurulan söz tırnak içinde olmalıdır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde tırnak konuşma dışında yanlış kullanılmıştır?", "Bugün \"güzel\" bir gündü.", "Annem \"Yemek hazır.\" dedi.", "Ali \"Geldim.\" dedi.", "Sıradan sözcükleri vurgulamak için tırnak kullanımı burada yanlıştır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde hem iki nokta hem tırnak doğrudur?", "Öğretmen uyarıdı: \"Sessiz olun.\"", "Öğretmen uyarıdı \"Sessiz olun\"", "Öğretmen: uyarıdı Sessiz olun.", "Konuşmadan önce iki nokta, söz tırnak içinde yazılır."),
        _r("orta", "Aşağıdaki cümlelerden hangisinde eksik noktalama en belirgindir?", "Anne yemeği getirdi dedi", "Anne \"Yemeği getirdi dedi.", "Anne, \"Yemeği getirdim.\" dedi.", "İlk cümlede tırnak, virgül ve nokta tamamen eksiktir."),
    ]

    # ── ZOR: iki nokta (16) — Yukarıdaki stems need premise ──
    rows += [
        _r("zor", "Yukarıdaki cümlelerin hangisinde iki nokta doğru kullanılmıştır?", "II", "I", "III",
           "II. cümlede liste öncesi iki nokta doğru kullanılmıştır.",
           _rp(("I", "Malzemeler un su tuz."), ("II", "Malzemeler: un, su, tuz."), ("III", "Malzemeler; un su."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde iki nokta eksiktir?", "I", "II", "III",
           "I. cümlede ders adları sıralanmadan önce iki nokta eksiktir.",
           _rp(("I", "Derslerimiz Türkçe, matematik, fen."), ("II", "Derslerimiz: Türkçe, matematik, fen."), ("III", "Derslerimiz; Türkçe."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde iki nokta yanlış kullanılmıştır?", "III", "I", "II",
           "III. cümlede iki nokta anlamsız yerde kullanılmıştır.",
           _rp(("I", "Sevdiğim renkler: mavi, yeşil."), ("II", "Bir kuş gördük: serçe."), ("III", "Ali: bugün okula geldi."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde iki nokta ile liste doğrudur?", "I", "II", "III",
           "I. cümlede spor dalları iki noktadan sonra virgülle listelenmiştir.",
           _rp(("I", "Spor dalları: voleybol, basketbol, futbol."), ("II", "Spor dalları voleybol basketbol futbol."), ("III", "Spor: dalları voleybol."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde iki nokta gereksizdir?", "II", "I", "III",
           "II. cümlede iki nokta gereksiz ve yanlış yerdedir.",
           _rp(("I", "Ev işleri: süpür, topla, düzenle."), ("II", "Mavi: rengi çok severim."), ("III", "Örnek verelim: elma, armut."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde iki nokta ve virgül doğrudur?", "III", "I", "II",
           "III. cümlede liste öncesi iki nokta ve virgüller doğrudur.",
           _rp(("I", "Listem kalem silgi defter."), ("II", "Listem: kalem silgi defter"), ("III", "Listem: kalem, silgi, defter."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde iki nokta ile örnek verilmiştir?", "II", "I", "III",
           "II. cümlede örnek vermek için iki nokta doğru kullanılmıştır.",
           _rp(("I", "Bugün hava güzel."), ("II", "Bir hayvan gördük: inek."), ("III", "Bir hayvan gördük inek."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde iki nokta anlamsız yerdedir?", "I", "II", "III",
           "I. cümlede iki nokta anlamsız yerde kullanılmıştır.",
           _rp(("I", "Tek: isteğim var sabırlı ol."), ("II", "Tek isteğim var: sabırlı ol."), ("III", "Tek isteğim var sabırlı ol."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde iki nokta ile açıklama doğrudur?", "II", "I", "III",
           "II. cümlede açıklama için iki nokta kurallara uygundur.",
           _rp(("I", "Tek ricam var sabırlı ol."), ("II", "Tek ricam var: sabırlı ol."), ("III", "Tek: ricam var sabırlı ol."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde iki nokta hatalıdır?", "III", "I", "II",
           "III. cümlede iki nokta yanlış yerde kullanılmıştır.",
           _rp(("I", "Okul etkinlikleri: tiyatro, müzik."), ("II", "Çantamdaki eşyalar: defter, kalem."), ("III", "Okul: etkinlikleri tiyatro."))),
        _r("zor", "Aşağıdaki cümlelerden hangisinde iki nokta, virgül ve nokta birlikte doğrudur?", "Okul etkinlikleri: tiyatro, müzik, resim sergisi.", "Okul etkinlikleri tiyatro müzik resim sergisi.", "Okul etkinlikleri: tiyatro müzik resim sergisi", "Liste iki nokta, virgül ve cümle sonu noktasıyla doğru yazılmıştır."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde iki nokta ve liste tamamen doğrudur?", "Gördüğümüz renkler: sarı, mor, turuncu.", "Gördüğümüz renkler sarı mor turuncu.", "Gördüğümüz: renkler sarı.", "Renk listesi iki noktadan sonra virgülle verilmiştir."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde iki nokta örnek verme için doğru kullanılmıştır?", "Bir meyve seçtik: portakal.", "Bir: meyve seçtik portakal.", "Bir meyve seçtik portakal.", "Seçilen örnekten önce iki nokta konmuştur."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde iki nokta gereksiz ve yanlış yerdedir?", "Ali: bugün okula geldi.", "Sevdiğim renkler: mavi, yeşil.", "Örnek verelim: elma, armut.", "İsimden hemen sonra konan iki nokta gereksizdir."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde iki nokta ile açıklama kurallara uygundur?", "Tek isteğim var: sabırlı ol.", "Tek: isteğim var sabırlı ol.", "Tek isteğim var sabırlı ol.", "İstek cümlesinde açıklama bölümünden önce iki nokta kurala uygundur."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde iki nokta eksikliği en belirgindir?", "Sınıf temizlik görevlileri Ayşe, Fatma, Zeynep.", "Sınıf temizlik görevlileri: Ayşe, Fatma, Zeynep.", "Sınıf: temizlik görevlileri Ayşe Fatma Zeynep.", "Görevliler listesinden önce iki nokta eksiktir."),
    ]

    # ── ZOR: kısa çizgi (16) ──
    rows += [
        _r("zor", "Yukarıdaki cümlelerin hangisinde kelime bölme doğrudur?", "II", "I", "III",
           "II. cümlede arkadaş kelimesi arka-daş şeklinde doğru bölünmüştür.",
           _rp(("I", "Arkada-şım geldi."), ("II", "Arka-daşım geldi."), ("III", "Arka-da-şım geldi."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde kelime bölme yanlıştır?", "I", "II", "III",
           "I. cümlede öğretmen kelimesi yanlış bölünmüştür.",
           _rp(("I", "Öğr-etmen geldi."), ("II", "Öğret-men geldi."), ("III", "Öğretmen geldi."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde kısa çizgi yanlış kullanılmıştır?", "III", "I", "II",
           "III. cümlede kelime anlamsız bölünmüştür.",
           _rp(("I", "Okul-umuz bahçede oynuyor."), ("II", "Tatil-lerde denize gideriz."), ("III", "Okulumuz bahçede o-yunuyor."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde kısa çizgi doğru kullanılmıştır?", "I", "II", "III",
           "I. cümlede bilgisayar kelimesi bilgi-sayar şeklinde bölünmüştür.",
           _rp(("I", "Bilgi-sayar açıldı."), ("II", "Bil-gisayar açıldı."), ("III", "Bilgisay-ar açıldı."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde kelime anlamsız bölünmüştür?", "II", "I", "III",
           "II. cümlede sandalye kelimesi anlamsız bölünmüştür.",
           _rp(("I", "San-dalye başında durdu."), ("II", "Sand-alye başında durdu."), ("III", "Sandalye başında durdu."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde kısa çizgi gereksizdir?", "III", "I", "II",
           "III. cümlede kısa çizgi gereksiz kullanılmıştır.",
           _rp(("I", "Kütüpha-ne açıktı."), ("II", "Öğ-ren-ciler bahçede oynuyor."), ("III", "Bugün ha-va çok güzel."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde kelime bölme heceye uygundur?", "II", "I", "III",
           "II. cümlede kalem-lik bölmesi heceye uygundur.",
           _rp(("I", "Kaleml-ik masada duruyor."), ("II", "Kalem-lik masada duruyor."), ("III", "Ka-lemlik masada duruyor."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde kısa çizgi hatalıdır?", "I", "II", "III",
           "I. cümlede kısa çizgi hem bölme hem tırnak açısından hatalıdır.",
           _rp(("I", "Öğret-men \"Dikkat\" dedi."), ("II", "Öğretmen \"Dikkat.\" dedi."), ("III", "Öğret-men Dikkat dedi."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde bölme doğru yapılmıştır?", "III", "I", "II",
           "III. cümlede kütüphane kelimesi kütüpha-ne şeklinde doğru bölünmüştür.",
           _rp(("I", "Kütüph-ane açıktı."), ("II", "Kütüpha-nede kitap okuduk."), ("III", "Kütüpha-ne açıktı."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde kısa çizgi yanlış yerdedir?", "II", "I", "III",
           "II. cümlede kısa çizgi kelime ortasında anlamsız yerdedir.",
           _rp(("I", "Ders-ler başladı."), ("II", "Der-sler başladı."), ("III", "Dersler başladı."))),
        _r("zor", "Aşağıdaki cümlelerden hangisinde kelime bölme ve noktalama birlikte doğrudur?", "Öğret-menimiz, \"Çok çalışın.\" dedi.", "Öğretmen-imiz, \"Çok çalışın.\" dedi.", "Öğretmenimiz \"Çok çalışın dedi.", "Öğretmen kelimesi öğret-men şeklinde bölünür; konuşma tırnak içinde doğru yazılır."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde kısa çizgi doğru, tırnak yanlıştır?", "Okul-umuzda \"Hoş geldiniz.\" yazıyor.", "Okulumuzda \"Hoş geldiniz.\" yazıyor.", "Okul-umuzda Hoş geldiniz yazıyor.", "Üçüncü cümlede hem kelime bölme gereksiz hem tırnak eksiktir."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde hem kısa çizgi hem tırnak doğrudur?", "Arka-daşım, \"Bekle beni.\" dedi.", "Arkada-şım \"Bekle beni dedi.\"", "Arka-daşım Bekle beni dedi.", "Arkadaş kelimesi arka-daş şeklinde bölünür; konuşma tırnak içinde doğru yazılır."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde kısa çizgi ve noktalama yanlıştır?", "Öğret-men \"Dikkat\" dedi.", "Öğretmen \"Dikkat.\" dedi.", "Öğret-men Dikkat dedi.", "İlk cümlede kelime bölme doğru ama tırnak içi noktasız ve eksiktir."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde kelime bölme kurallara en uygundur?", "kitap-lık", "kit-aplık", "kita-plık", "Kitap-lık bölmesi hece yapısına en uygundur; diğer seçenekler yanlış yerden ayrılmıştır."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde kısa çizgi ile bölme tamamen yanlıştır?", "öğ-ren-ciler", "öğrenci-ler", "öğre-nciler", "Öğrenciler kelimesi öğ-ren-ciler şeklinde bölünür; diğerleri yanlıştır."),
    ]

    # ── ZOR: tırnak (18) ──
    rows += [
        _r("zor", "Yukarıdaki cümlelerin hangisinde noktalama doğrudur?", "III", "I", "II",
           "III. cümlede virgül, tırnak ve nokta doğru kullanılmıştır.",
           _rp(("I", "Anne yemeği getirdi dedi"), ("II", "Anne \"Yemeği getirdi dedi."), ("III", "Anne, \"Yemeği getirdim.\" dedi."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde konuşma cümlesi doğrudur?", "II", "I", "III",
           "II. cümlede konuşma tırnak içinde doğru yazılmıştır.",
           _rp(("I", "Annem Yemeği masaya koydu."), ("II", "Annem \"Yemek hazır.\" dedi."), ("III", "Annem \"Yemek hazır dedi."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde alıntı doğru kullanılmıştır?", "III", "I", "II",
           "III. cümlede ünlü söz tırnak içinde ve noktalıdır.",
           _rp(("I", "Annesi Dost kara günde belli olur demiş."), ("II", "Annesi Sabırlı ol demiş."), ("III", "Annesi \"Dost kara günde belli olur.\" demiş."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde tırnak yanlış kullanılmıştır?", "I", "II", "III",
           "I. cümlede gazete başlığı tırnak içinde değildir.",
           _rp(("I", "Gazetede Yarın kar yağacak yazıyordu."), ("II", "Gazetede \"Yarın kar yağacak.\" yazıyordu."), ("III", "Gazetede \"Yarın kar yağacak yazıyordu."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde alıntı ve noktalama doğrudur?", "I", "II", "III",
           "I. cümlede iki noktadan sonra konuşma tırnak içinde verilmiştir.",
           _rp(("I", "Öğretmen uyarıdı: \"Sessiz olun.\""), ("II", "Öğretmen uyarıdı \"Sessiz olun\""), ("III", "Öğretmen: uyarıdı Sessiz olun."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde konuşma cümlesi yanlıştır?", "II", "I", "III",
           "II. cümlede tırnak kapatılmamış ve nokta eksiktir.",
           _rp(("I", "Baba, \"Eve erken gel.\" dedi."), ("II", "Baba \"Eve erken gel dedi."), ("III", "Baba, Eve erken gel.\" dedi."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde tırnak ve noktalama yanlıştır?", "III", "I", "II",
           "III. cümlede tırnak, nokta ve büyük harf eksiktir.",
           _rp(("I", "Kız kardeşim, \"Hadi koş.\" dedi."), ("II", "Kız kardeşim \"Hadi koş.\" dedi."), ("III", "Kız kardeşim hadi koş dedi"))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde eksik noktalama vardır?", "I", "II", "III",
           "I. cümlede tırnak, virgül ve nokta eksiktir.",
           _rp(("I", "Anne yemeği getirdi dedi"), ("II", "Anne, \"Yemeği getirdim.\" dedi."), ("III", "Anne \"Yemeği getirdim.\" dedi."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde alıntı yanlıştır?", "II", "I", "III",
           "II. cümlede alıntı tırnak içinde değildir.",
           _rp(("I", "Kitapta \"Okuyan kazanır.\" yazıyordu."), ("II", "Kitapta Okuyan kazanır yazıyordu."), ("III", "Kitapta \"Okuyan kazanır yazıyordu."))),
        _r("zor", "Yukarıdaki cümlelerin hangisinde hem iki nokta hem tırnak doğrudur?", "I", "II", "III",
           "I. cümlede iki noktadan sonra konuşma tırnak içinde yazılmıştır.",
           _rp(("I", "Öğretmen şunu söyledi: \"Sıraya girin.\""), ("II", "Öğretmen şunu söyledi \"Sıraya girin.\""), ("III", "Öğretmen: şunu söyledi \"Sıraya girin\""))),
        _r("zor", "Aşağıdaki cümlelerden hangisinde konuşma, iki nokta ve tırnak birlikte doğrudur?", "Müdür duyurdu: \"Yarın tören var.\"", "Müdür duyurdu \"Yarın tören var\"", "Müdür: duyurdu Yarın tören var.", "Duyurulan söz iki noktadan sonra tırnak içinde yazılır."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde alıntı ve konuşma birlikte doğru kullanılmıştır?", "Dedem anlattı: \"Eskiden burada dere akardı.\"", "Dedem anlattı \"Eskiden burada dere akardı.\"", "Dedem anlattı: Eskiden burada dere akardı.", "Anlatılan söz iki noktadan sonra tırnak içinde yazılmalıdır."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde tırnak yalnızca konuşma için kullanılmıştır?", "Ali \"Ödevimi bitirdim.\" dedi.", "Bugün \"güzel\" bir gündü.", "Ali - Mehmet okula gitti.", "Birinci cümlede tırnak yalnızca konuşma sözü için kullanılmıştır."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde tırnak, virgül ve nokta birlikte doğrudur?", "Komşu, \"Yardımınız için teşekkürler.\" dedi.", "Komşu \"Yardımınız için teşekkürler dedi.", "Komşu, Yardımınız için teşekkürler dedi.", "Komşu cümlesinde virgül, tırnak, nokta ve dedi kelimesi doğru sırayla kullanılmıştır."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde noktalama kurallarına en uygun yazım vardır?", "Söylediği söz şuydu: \"Sabır, başarının anahtarıdır.\"", "Söylediği söz şuydu \"Sabır başarının anahtarıdır\"", "Söylediği: söz şuydu \"Sabır, başarının anahtarıdır.\"", "Açıklama iki noktayla başlar; alıntı tırnak içinde ve virgül doğru yerdedir."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde hem alıntı hem açıklama doğrudur?", "Öğretmen tahtaya \"Çalışkan olun.\" yazdı.", "Öğretmen tahtaya Çalışkan olun yazdı.", "Öğretmen \"Çalışkan olun.\" tahtaya yazdı.", "Yazılan söz tırnak içine alınmalıdır."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde konuşma cümlesi tamamen doğrudur?", "Baba şöyle dedi: \"Vaktinizi iyi kullanın.\"", "Baba şöyle dedi \"Vaktinizi iyi kullanın\"", "Baba: şöyle dedi Vaktinizi iyi kullanın.", "Dedi ifadesinden sonra iki nokta ve tırnak içi söz gelir."),
        _r("zor", "Aşağıdaki cümlelerden hangisinde tüm noktalama doğrudur?", "Anne, \"Yemeği getirdim.\" dedi.", "Anne \"Yemeği getirdim dedi.", "Anne, Yemeği getirdim.\" dedi.", "Virgül, tırnak, nokta ve dedi kelimesi doğru yerdedir."),
    ]

    assert len(rows) == 150, f"noktalama: {len(rows)}"
    return rows


# ── PARAGRAF: content tuples + stem assignment ───────────────────────────────

PARAGRAF_STEM_EXTRA: dict[str, list[str]] = {
    "konu": [
        "Metnin konusu hangi seçenekte doğru verilmiştir?",
        "Yazar bu paragrafla hangi konuyu işlemiştir?",
        "Paragrafın odaklandığı konu hangisidir?",
        "Bu metin hangi konuya değinmektedir?",
        "Paragrafta işlenen konu hangi seçenektedir?",
        "Metnin konusunu gösteren ifade hangisidir?",
    ],
    "ana_dusunce": [
        "Yazar bu paragrafla ne vurgulamak istemiştir?",
        "Metnin ana düşüncesi hangi seçenekte yer alır?",
        "Paragraftan çıkarılan temel mesaj hangisidir?",
        "Bu parçanın ana fikri hangi seçenekte bulunur?",
        "Yazarın okuyucuya vermek istediği mesaj hangisidir?",
        "Paragrafın ana düşüncesi hangi seçenekle örtüşür?",
        "Metnin asıl düşüncesi aşağıdakilerden hangisidir?",
    ],
    "baslik": [
        "Bu parçaya hangi başlık konulmalıdır?",
        "Paragrafın içeriğine en uygun başlık hangisidir?",
        "Metne verilecek başlık hangi seçenektedir?",
        "Paragraf için en doğru başlık hangisidir?",
        "Bu metnin başlığı hangi seçenek olabilir?",
    ],
    "duygu": [
        "Şiirde baskın olan duygu hangisidir?",
        "Bu dizeler hangi duyguyu yansıtmaktadır?",
        "Şiirin duygusal tonu hangi seçenektedir?",
        "Dizelerdeki ana duygu hangi seçenekte verilmiştir?",
        "Şiir okuyucuda hangi duygu uyandırır?",
        "Bu şiirin taşıdığı duygu hangisidir?",
        "Dizelerin ana duygusu hangi seçenektedir?",
        "Şiirde hissedilen duygu hangi seçenekte doğru verilmiştir?",
        "Bu dizelerde yoğunlaşan duygu hangisidir?",
        "Şiirin ana duygusunu ifade eden seçenek hangisidir?",
        "Dizelerdeki duygusal atmosfer hangi seçeneğe uygundur?",
        "Bu şiirde anlatılan duygu hangi seçenektedir?",
    ],
}

PARAGRAF_TARGETS = {"konu": 38, "ana_dusunce": 38, "baslik": 37, "duygu": 37}

ZOR_CUMLE_STEMS = [
    "Yukarıdaki cümlelere göre paragrafın ana düşüncesi hangi seçenekte verilmiştir?",
    "Yukarıdaki cümlelere göre paragrafın konusu hangi seçenektedir?",
    "Yukarıdaki cümlelere göre paragrafa en uygun başlık hangisidir?",
    "Yukarıdaki cümlelere göre metnin ana düşüncesi hangi seçenektedir?",
    "Yukarıdaki cümlelere göre metnin konusu hangi seçenekte verilmiştir?",
    "Yukarıdaki cümlelere göre paragrafın ana fikri hangi seçenektedir?",
    "Yukarıdaki cümlelere göre metne en uygun başlık hangisidir?",
    "Yukarıdaki cümlelere göre paragrafın konusu nedir?",
    "Yukarıdaki cümlelere göre metnin ana düşüncesi nedir?",
    "Yukarıdaki cümlelere göre şiirin ana duygusu nedir?",
    "Yukarıdaki cümlelere göre paragraf ne anlatıyor?",
    "Yukarıdaki cümlelere göre doğru seçenek hangisidir?",
]


def _full_paragraf_stems(cat: str) -> list[str]:
    pool = list(PARAGRAF_STEMS.get(cat, []))
    pool.extend(PARAGRAF_STEM_EXTRA.get(cat, []))
    return pool


def _is_poem(premise: str | None) -> bool:
    if not premise:
        return False
    lines = [ln.strip() for ln in premise.split("\n") if ln.strip()]
    if len(lines) < 2:
        return False
    if any(ln.startswith(("I.", "II.", "III.")) for ln in lines[:2]):
        return False
    return all(len(ln) < 60 and not ln.endswith(".") for ln in lines[:3])


def _is_roman_premise(premise: str | None) -> bool:
    if not premise:
        return False
    return "I." in premise and "II." in premise


def _classify_paragraf_content(correct: str, exp: str, premise: str | None) -> str:
    if _is_poem(premise):
        return "duygu"
    el = exp.lower()
    if "başlık" in el or "başlığa" in el or "başlığı" in el or "başlığına uyar" in el:
        return "baslik"
    if any(k in el for k in ("ana düşünce", "ana fikir", "mesaj", "vurgula", "öğütler", "öğüt", "ana düşünceyi")):
        return "ana_dusunce"
    if _is_roman_premise(premise):
        if correct in ("I", "II", "III"):
            if "duygu" in el or "dizeler" in el or "şiir" in el:
                return "duygu"
            if "başlık" in el:
                return "baslik"
            if "ana düşünce" in el or "ana fikir" in el or "mesaj" in el:
                return "ana_dusunce"
            return "konu"
        if "duygu" in el or "dizeler" in el or "şiir" in el:
            return "duygu"
        if "konusu" in el or "konu" in el:
            return "konu"
    return "konu"


def _load_paragraf_content() -> list[tuple]:
    """Content-only rows from existing bank: (level, correct, w1, w2, exp, premise?)."""
    import importlib.util
    from pathlib import Path
    path = Path(__file__).resolve().parent / "paragraf_s3_bank.py"
    spec = importlib.util.spec_from_file_location("paragraf_old", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    out = []
    for row in mod._RAW[:150]:
        level = row[0]
        correct, w1, w2, exp = row[2], row[3], row[4], row[5]
        premise = row[6] if len(row) > 6 else None
        out.append((level, correct, w1, w2, exp, premise))
    return out


def build_paragraf_rows() -> list[tuple]:
    content = _load_paragraf_content()
    stem_idx = {k: 0 for k in PARAGRAF_TARGETS}
    zor_stem_i = 0
    rows: list[tuple] = []

    for level, correct, w1, w2, exp, premise in content:
        cat = _classify_paragraf_content(correct, exp, premise)

        if level == "zor" and _is_roman_premise(premise):
            stem = ZOR_CUMLE_STEMS[zor_stem_i % len(ZOR_CUMLE_STEMS)]
            zor_stem_i += 1
            # refine stem by category
            if cat == "baslik":
                stem = "Yukarıdaki cümlelere göre paragrafa en uygun başlık hangisidir?"
            elif cat == "ana_dusunce":
                stem = "Yukarıdaki cümlelere göre paragrafın ana düşüncesi hangi seçenekte verilmiştir?"
            elif cat == "duygu":
                stem = "Yukarıdaki cümlelere göre şiirin ana duygusu nedir?"
            elif cat == "konu":
                stem = "Yukarıdaki cümlelere göre paragrafın konusu hangi seçenektedir?"
        elif _is_poem(premise):
            pool = _full_paragraf_stems("duygu")
            stem = pool[stem_idx["duygu"] % len(pool)]
            stem_idx["duygu"] += 1
        else:
            pool = _full_paragraf_stems(cat)
            stem = pool[stem_idx[cat] % len(pool)]
            stem_idx[cat] += 1

        rows.append(_r(level, stem, correct, w1, w2, exp, premise))

    # Ensure 150 unique stems — collisions resolved within the same category pool
    seen: set[str] = set()
    cat_spare: dict[str, int] = {k: 0 for k in ("konu", "ana_dusunce", "baslik", "duygu")}
    fixed: list[tuple] = []
    for row in rows:
        level, stem, c, w1, w2, exp = row[:6]
        premise = row[6] if len(row) > 6 else None
        cat = _classify_paragraf_content(c, exp, premise)
        pool = _full_paragraf_stems(cat)
        if level == "zor" and _is_roman_premise(premise):
            if cat == "baslik":
                stem = "Yukarıdaki cümlelere göre paragrafa en uygun başlık hangisidir?"
            elif cat == "ana_dusunce":
                stem = "Yukarıdaki cümlelere göre paragrafın ana düşüncesi hangi seçenekte verilmiştir?"
            elif cat == "duygu":
                stem = "Yukarıdaki cümlelere göre şiirin ana duygusu nedir?"
            elif cat == "konu":
                stem = "Yukarıdaki cümlelere göre paragrafın konusu hangi seçenektedir?"
        attempts = 0
        while stem in seen and attempts < len(pool) * 2:
            stem = pool[cat_spare[cat] % len(pool)]
            cat_spare[cat] += 1
            attempts += 1
        seen.add(stem)
        fixed.append(_r(level, stem, c, w1, w2, exp, premise))

    assert len(fixed) == 150, f"paragraf: {len(fixed)}"
    assert len(seen) == 150, f"paragraf stems: {len(seen)}"
    return fixed

# -*- coding: utf-8 -*-
from __future__ import annotations


LEVELS_ES = ["kolay"] * 17 + ["orta"] * 17 + ["zor"] * 16
LEVELS_ZIT = ["kolay"] * 16 + ["orta"] * 17 + ["zor"] * 17
LEVELS_SESTES = ["kolay"] * 17 + ["orta"] * 16 + ["zor"] * 17
TYPE_LABELS = ("Hikaye edici metin", "Bilgilendirici metin", "Şiir")

KELIME_PREMISE_ES = [
    ("Yukarıdaki cümle gruplarından hangisinde eş anlamlı kelimeler birlikte kullanılmıştır?", "II", "I", "III", "II. cümlede hızlı ve çabuk aynı anlama gelir.", "I. Büyük ev küçük bahçeliydi.\nII. Hızlı ve çabuk koşan at birinciydi.\nIII. Okula geç kaldık."),
    ("Yukarıdaki numaralanmış cümlelerden hangisinde aynı anlama gelen iki sözcük vardır?", "III", "I", "II", "III. cümlede hediye ve armağan eş anlamlıdır.", "I. Uzun yol kısa sürdü.\nII. Kalem defter masadaydı.\nIII. Doğum günü hediyesi güzel bir armağandı."),
    ("Yukarıdaki örneklerden hangisinde eş anlamlı sözcük çifti doğru kullanılmıştır?", "I", "II", "III", "I. cümlede öğrenci ve talebe aynı kişiyi anlatır.", "I. Her öğrenci ve talebe sıraya girdi.\nII. Sıcak çay soğuk bardağı ısıttı.\nIII. Koşarak eve döndü."),
    ("Yukarıdaki cümlelerin hangisinde anlamı güçlendiren eş anlamlılar bir arada geçmiştir?", "I", "II", "III", "I. cümlede ev ve konut aynı yeri anlatır.", "I. Yeni evimiz güzel bir konuttu.\nII. Genç dede yaşlı anlatıyordu.\nIII. Kalem kırıldı."),
    ("Yukarıdaki metin parçalarından hangisinde eş anlamlı kelime kullanımı vardır?", "III", "I", "II", "III. cümlede cevap ve yanıt eş anlamlıdır.", "I. Dolu bardak boşaldı.\nII. Kalın kitap ince ciltliydi.\nIII. Sorunun cevabı doğru yanıttı."),
    ("Yukarıdaki örnek cümlelerden hangisinde iki sözcük aynı anlamda yan yana durmuştur?", "I", "II", "III", "I. cümlede dost ve arkadaş eş anlamlıdır.", "I. Dost ve arkadaş birlikte gitti.\nII. Uzun kalem kısa çizgi çizdi.\nIII. Denize girdik."),
    ("Yukarıdaki ifadelerden hangisinde eş anlamlı kelimeler cümleyi zenginleştirmiştir?", "I", "II", "III", "I. cümlede hoş ve güzel eş anlamlıdır.", "I. Hoş ve güzel manzara vardı.\nII. Kitap okudu.\nIII. Açık pencere kapalı kaldı."),
    ("Yukarıdaki cümlelerin hangisinde birbirinin yerine geçebilecek sözcükler birlikte kullanılmıştır?", "I", "II", "III", "I. cümlede yavaş ve ağır burada eş anlamlı kullanılmıştır.", "I. Yavaş ve ağır adımlarla geldi.\nII. Uzun kalem kısa çizgi çizdi.\nIII. Mutlu çocuk."),
    ("Yukarıdaki numaralı satırlardan hangisinde eş anlamlı sözcük eşleşmesi doğrudur?", "III", "I", "II", "III. cümlede sevinçli ve mutlu eş anlamlıdır.", "I. Sıcak çay soğuk günde içildi.\nII. Kalem silgi masadaydı.\nIII. Sevinçli ve mutlu haberi duyduk."),
    ("Yukarıdaki cümle örneklerinden hangisinde eş anlamlı kullanımı görebiliriz?", "I", "II", "III", "I. cümlede zeki ve akıllı eş anlamlıdır.", "I. Zeki ve akıllı öğrenci ödül aldı.\nII. Erken gelen geç kaldı.\nIII. Bahçede çiçek vardı."),
    ("Yukarıdaki gruplardan hangisinde anlamca yakın iki kelime bir arada verilmiştir?", "I", "II", "III", "I. cümlede pak ve temiz eş anlamlıdır.", "I. Pak ve temiz elbiselerini giydi.\nII. Gürültülü sınıf sessiz oldu.\nIII. Top oynadı."),
    ("Yukarıdaki cümlelerden hangisinde eş anlamlı sözcükler anlatımı desteklemiştir?", "I", "II", "III", "I. cümlede masal ve hikâye yakın anlam taşır.", "I. Masal ve hikâye anlatımı dinledik.\nII. Kalın defter ince kalem taşıdı.\nIII. Koştu."),
    ("Yukarıdaki örneklerin hangisinde aynı anlama gelen kelimeler yan yana yazılmıştır?", "I", "II", "III", "I. cümlede mektep ve okul eş anlamlıdır.", "I. Mektep ve okul yakındı.\nII. Tatlı reçel ekşi limonla yendi.\nIII. Kalemi bıraktı."),
    ("Yukarıdaki numaralanmış cümlelerin hangisinde eş anlamlı çift bulunmaktadır?", "I", "II", "III", "I. cümlede bitkin ve yorgun eş anlamlıdır.", "I. Bitkin ve yorgun yolcu dinlendi.\nII. Zengin aile fakir komşuya yardım etti.\nIII. Denize girdi."),
    ("Yukarıdaki cümle setlerinden hangisinde eş anlamlı kelimeler doğru biçimde kullanılmıştır?", "I", "II", "III", "I. cümlede ilk ve başlangıç eş anlamlıdır.", "I. İlk ve başlangıç gününde tanıştık.\nII. Açık kutu kapalı kaldı.\nIII. Resim çizdi."),
    ("Yukarıdaki satırlardan hangisinde iki eş anlamlı sözcük birlikte geçmektedir?", "I", "II", "III", "I. cümlede mutlu ve sevinçli eş anlamlıdır.", "I. Mutlu ve sevinçli çocuklar oynadı.\nII. Sıcak çay soğuk bardağı ısıttı.\nIII. Kitabı okudu."),
]

KELIME_PREMISE_ZIT = [
    ("Yukarıdaki cümle gruplarından hangisinde zıt anlamlı kelimeler bir arada kullanılmıştır?", "I", "II", "III", "I. cümlede açık ve kapalı zıt anlamlıdır.", "I. Açık pencereyi kapalı bıraktı.\nII. Mutlu ve sevinçli çocuklar oynadı.\nIII. Kitabı masaya koydu."),
    ("Yukarıdaki numaralanmış cümlelerden hangisinde karşıt anlamlı iki sözcük vardır?", "I", "II", "III", "I. cümlede temiz ve kirli zıt anlamlıdır.", "I. Temiz elbise kirli oldu.\nII. Dost ve arkadaş konuştu.\nIII. Öğretmen tahtaya yazdı."),
    ("Yukarıdaki örneklerden hangisinde zıt anlamlı sözcük çifti doğru kullanılmıştır?", "I", "II", "III", "I. cümlede erken ve geç zıt anlamlıdır.", "I. Erken gelen geç kalanı bekledi.\nII. Basit ve kolay soruyu çözdü.\nIII. Masal kitabını okudu."),
    ("Yukarıdaki cümlelerin hangisinde birbirine karşıt anlam taşıyan kelimeler geçmiştir?", "I", "II", "III", "I. cümlede sıcak ve soğuk zıt anlamlıdır.", "I. Sıcak günde soğuk su içtik.\nII. Okul mektep yakındı.\nIII. Koşarak gitti."),
    ("Yukarıdaki metin parçalarından hangisinde zıt anlamlı kullanımı vardır?", "I", "II", "III", "I. cümlede gürültülü ve sessiz zıt anlamlıdır.", "I. Gürültülü sınıf bir anda sessiz oldu.\nII. Hızlı araba çabuk gitti.\nIII. Bahçede oturdu."),
    ("Yukarıdaki örnek cümlelerden hangisinde iki zıt sözcük yan yana durmuştur?", "I", "II", "III", "I. cümlede zengin ve fakir zıt anlamlıdır.", "I. Zengin aile fakir komşuya yardım etti.\nII. Hoş ve güzel gün geçirdik.\nIII. Kalemi aldı."),
    ("Yukarıdaki ifadelerden hangisinde zıt anlamlılar karşılaştırma yapmaktadır?", "I", "II", "III", "I. cümlede kuru ve ıslak zıt anlamlıdır.", "I. Kuru kaldı, sonra ıslak oldu.\nII. Minik ve küçük kedi uyudu.\nIII. Parka koştu."),
    ("Yukarıdaki cümlelerin hangisinde anlamca birbirine karşıt kelimeler birlikte kullanılmıştır?", "III", "I", "II", "III. cümlede cesur ve korkak zıt anlamlıdır.", "I. Güzel ve hoş manzara vardı.\nII. Okul mektep yakındı.\nIII. Cesur ama korkak görünen karakter vardı."),
    ("Yukarıdaki numaralı satırlardan hangisinde zıt anlamlı eşleşme doğrudur?", "I", "II", "III", "I. cümlede tatlı ve ekşi zıt anlamlıdır.", "I. Tatlı reçel ekşi limonla yendi.\nII. Cevap yanıt doğruydu.\nIII. Kitap okudu."),
    ("Yukarıdaki cümle örneklerinden hangisinde zıt anlamlı kullanımı görebiliriz?", "I", "II", "III", "I. cümlede dolu ve boş zıt anlamlıdır.", "I. Dolu bardak boşaldı.\nII. Masal hikâye anlattı.\nIII. Yürüdü."),
    ("Yukarıdaki gruplardan hangisinde karşıt anlamlı iki kelime bir arada verilmiştir?", "I", "II", "III", "I. cümlede genç ve yaşlı zıt anlamlıdır.", "I. Genç dede yaşlı anlatıyordu.\nII. Hediye armağan verdi.\nIII. Oyun oynadı."),
    ("Yukarıdaki cümlelerden hangisinde zıt anlamlı sözcükler anlatımı güçlendirmiştir?", "I", "II", "III", "I. cümlede aydınlık ve karanlık zıt anlamlıdır.", "I. Aydınlık oda karanlık oldu.\nII. Okul mektep yakındı.\nIII. Koştu."),
    ("Yukarıdaki örneklerin hangisinde birbirinin tersi anlama gelen kelimeler yazılmıştır?", "I", "II", "III", "I. cümlede hafif ve ağır zıt anlamlıdır.", "I. Hafif çanta ağır geldi.\nII. Sevinçli mutlu haber geldi.\nIII. Yemek yedi."),
    ("Yukarıdaki numaralanmış cümlelerin hangisinde zıt anlamlı çift bulunmaktadır?", "I", "II", "III", "I. cümlede uzun ve kısa zıt anlamlıdır.", "I. Uzun yol kısa sürdü.\nII. Dost arkadaş geldi.\nIII. Uyudu."),
    ("Yukarıdaki cümle setlerinden hangisinde zıt anlamlı kelimeler doğru biçimde kullanılmıştır?", "I", "II", "III", "I. cümlede kalabalık ve tenha zıt anlamlıdır.", "I. Kalabalık meydan tenha sokağa açıldı.\nII. Pak temiz elbise giydi.\nIII. Yüzdü."),
    ("Yukarıdaki satırlardan hangisinde iki zıt anlamlı sözcük birlikte geçmektedir?", "I", "II", "III", "I. cümlede doğru ve yanlış zıt anlamlıdır.", "I. Doğru yol yanlış tabelaya gitti.\nII. Hızlı çabuk koştu.\nIII. Resim yaptı."),
]

KELIME_PREMISE_SESTES = [
    ("Yukarıdaki cümlelerin hangisinde gül kelimesi çiçek anlamında kullanılmıştır?", "I", "II", "III", "I. cümlede bahçedeki çiçek anlatılır.", "I. Bahçede sarı bir gül açtı.\nII. Komik şakaya gülünce alkışladık.\nIII. Fıkra dinleyince hep gülüyordu."),
    ("Yukarıdaki numaralanmış cümlelerden hangisinde yaz sözcüğü mevsim anlamında kullanılmıştır?", "II", "I", "III", "II. cümlede yaz mevsimi anlatılır.", "I. Öğretmen tahtaya yazdı.\nII. Yaz tatilinde denize gittik.\nIII. Güzel bir yaz okuduk."),
    ("Yukarıdaki örneklerden hangisinde yüz kelimesi not/sayı anlamındadır?", "III", "I", "II", "III. cümlede sınav notu olan yüz sayısı vardır.", "I. Yüzünü yıkadı.\nII. Denizde yüz bilmeyen çocuk korktu.\nIII. Matematikten yüz aldı."),
    ("Yukarıdaki cümle gruplarından hangisinde ay gök cismi olarak geçmiştir?", "I", "II", "III", "I. cümlede gökyüzündeki ay anlatılır.", "I. Gece ay parlak görünüyordu.\nII. Bir ay sonra tekrar geldik.\nIII. Ay isimli kız kardeşim var."),
    ("Yukarıdaki satırlardan hangisinde dal sözcüğü ağaç kolu anlamındadır?", "II", "I", "III", "II. cümlede ağacın dalı anlatılır.", "I. Oyun grubuna dalınca sevindi.\nII. Kuş yüksek dala kondu.\nIII. Arkadaşlarına dalıverdi."),
    ("Yukarıdaki cümlelerin hangisinde çay içecek olarak kastedilmiştir?", "III", "I", "II", "III. cümlede içilen çay vardır.", "I. Karadeniz'de uzun bir çay vardır.\nII. Köyün yanından çay akıyordu.\nIII. Misafire sıcak çay sunduk."),
    ("Yukarıdaki numaralanmış cümlelerden hangisinde kar kazanç anlamına gelmektedir?", "I", "II", "III", "I. cümlede elde edilen kar (kazanç) anlatılır.", "I. Dükkan bu ay iyi kar etti.\nII. Sabah kar yağmıştı.\nIII. Kar topu oynadık."),
    ("Yukarıdaki örneklerden hangisinde el sözcüğü ülke adı olarak kullanılmıştır?", "III", "I", "II", "III. cümlede bir ülke adı olan El geçer.", "I. Sol eliyle kalemi tuttu.\nII. Elini yıkamayı unutma.\nIII. El ülkesine yolculuk ettiler."),
    ("Yukarıdaki cümlelerin hangisinde kol huni borusu anlamındadır?", "II", "I", "III", "II. cümlede su aktaran huni (kol) vardır.", "I. Kolunu bandajladılar.\nII. Yağmur suyu kol borusundan aktı.\nIII. Sağ kolu ağrıyordu."),
    ("Yukarıdaki gruplardan hangisinde top savaş aleti anlamında geçmiştir?", "III", "I", "II", "III. cümlede eski savaş aleti top anlatılır.", "I. Futbol topu yuvarlandı.\nII. Bahçede top oynadık.\nIII. Müzedeki top çok büyüktü."),
    ("Yukarıdaki numaralanmış cümlelerden hangisinde ben hayvan adıdır?", "II", "I", "III", "II. cümlede topraktaki ben (hayvan) anlatılır.", "I. Ben de parka gideceğim.\nII. Bahçede minik bir ben gördük.\nIII. Ben bunu yapabilirim."),
    ("Yukarıdaki cümlelerin hangisinde aç fiili bir şeyi açma anlamındadır?", "I", "II", "III", "I. cümlede kapıyı açma eylemi vardır.", "I. Lütfen pencereyi aç.\nII. Sabah erken aç kalktım.\nIII. Çok açım, ekmek ver."),
    ("Yukarıdaki örneklerden hangisinde in kuş yuvası anlamına gelir?", "III", "I", "II", "III. cümlede kuş yuvası (in) anlatılır.", "I. Merdivenlerden yavaşça indi.\nII. Asansörle aşağı indik.\nIII. Ağaçta serçe in yaptı."),
    ("Yukarıdaki satırlardan hangisinde yan yanmak fiili olarak kullanılmıştır?", "I", "II", "III", "I. cümlede mumun yanması anlatılır.", "I. Mum gece boyunca yandı.\nII. Evin yan tarafı boyandı.\nIII. Sağ yana oturdu."),
    ("Yukarıdaki cümlelerin hangisinde ekmek tarla sürme eylemini anlatır?", "II", "I", "III", "II. cümlede tarla ekme (ekmek) eylemi vardır.", "I. Taze ekmek kokusu geldi.\nII. Çiftçi tarlayı ekmek için traktör sürdü.\nIII. Fırından ekmek aldık."),
    ("Yukarıdaki numaralanmış cümlelerden hangisinde sal salmak fiili vardır?", "I", "II", "III", "I. cümlede balığı salmak (salıvermek) vardır.", "I. Balığı suya saldı.\nII. Nehirde eski bir sal vardı.\nIII. Sal ile karşıya geçtiler."),
]


def _expect_unique(rows: list[tuple], name: str) -> list[tuple]:
    texts = [row[1] for row in rows]
    explanations = [row[5] for row in rows]
    assert len(rows) == 150, f"{name}: expected 150 rows, got {len(rows)}"
    assert len(set(texts)) == 150, f"{name}: duplicate text count {150 - len(set(texts))}"
    assert len(set(explanations)) == 150, (
        f"{name}: duplicate explanation count {150 - len(set(explanations))}"
    )
    for row in rows:
        blob = "".join(str(part) for part in row)
        assert "«" not in blob and "»" not in blob, f"{name}: guillemet found"
        if len(row) > 6 and row[6]:
            assert "Yukarıdaki" in row[1], f"{name}: premise row missing Yukarıdaki"
    return rows


def _pick_variant(parts_a: list[str], parts_b: list[str], idx: int) -> tuple[str, str]:
    return parts_a[idx % len(parts_a)], parts_b[(idx // len(parts_a)) % len(parts_b)]


SYNONYM_STEM_A = [
    "Öğretmeninizin tahtaya yazdığı örnek cümleyi inceleyiniz:",
    "Defterdeki kısa cümleyi dikkatle okuyunuz:",
    "Aşağıdaki değil, tam bu satırdaki cümleyi düşününüz:",
    "Sınıfta paylaşılan örnek cümleye göz atınız:",
    "Türkçe etkinliğindeki cümleyi yeniden okuyunuz:",
    "Bu alıştırmadaki cümlenin verdiği anlama bakınız:",
    "Arkadaşınızın sesli okuduğu cümleyi hatırlayınız:",
    "Kısa anlatımdaki kelimeyi bağlamıyla birlikte düşününüz:",
    "Verilen cümledeki sözcüğün görevine dikkat ediniz:",
    "Örnekte yer alan cümleyi anlamca çözümleyiniz:",
]
SYNONYM_STEM_B = [
    '"{word}" sözcüğünün eş anlamlısı hangi seçenektedir?',
    'Bu cümlede geçen "{word}" kelimesiyle aynı anlama gelen seçenek hangisidir?',
    '"{word}" yerine anlamı bozmadan hangi kelime yazılabilir?',
    'Altı çizili gibi düşünülen "{word}" sözcüğüne en yakın anlamlı seçenek nedir?',
    'Cümledeki "{word}" kelimesinin anlam kardeşi hangi cevaptır?',
]

ANTONYM_STEM_A = [
    "Şimdi verilen cümledeki anlam karşıtlığına odaklanınız:",
    "Türkçe kutusundaki cümleyi dikkatle okuyunuz:",
    "Bu kısa örnekte kullanılan sözcüğü inceleyiniz:",
    "Öğretmenin hazırladığı cümledeki kelimeye bakınız:",
    "Defterinizdeki satırı bir kez daha okuyunuz:",
    "Anlam ilişkisini bulmak için cümleyi düşününüz:",
    "Örnek cümlede geçen sözcüğe dikkat kesiliniz:",
    "Bu etkinlikteki cümleyi anlam yönünden inceleyiniz:",
    "Kelimeler arasındaki karşıtlığa bakarak ilerleyiniz:",
    "Verilen cümledeki sözcüğün ters anlamını düşününüz:",
]
ANTONYM_STEM_B = [
    '"{word}" sözcüğünün zıt anlamlısı hangi seçenektedir?',
    'Bu cümledeki "{word}" kelimesinin karşıt anlamı hangisidir?',
    '"{word}" yerine ters anlamlı hangi sözcük düşünülebilir?',
    'Anlamca "{word}" sözcüğünün karşısında duran seçenek nedir?',
    'Cümlede geçen "{word}" kelimesinin zıddı olan cevap hangisidir?',
]

HOMONYM_STEM_A = [
    "Verilen cümledeki sesteş sözcüğün kullanımına bakınız:",
    "Bu örnekte geçen kelimenin hangi anlamı taşıdığını düşününüz:",
    "Aşağıdaki cümlede yer alan sesteş sözcüğü inceleyiniz:",
    "Cümledeki aynı yazılışlı kelimenin anlamını belirleyiniz:",
    "Türkçe çalışmasındaki sesteş kullanımına odaklanınız:",
    "Sözcüğün cümle içindeki görevini dikkatle okuyunuz:",
    "Bu kısa cümledeki sesteş kelimeyi anlamıyla birlikte düşününüz:",
    "Örnekte geçen kelimenin hangi anlamda kullanıldığını bulunuz:",
    "Verilen satırdaki aynı sesli sözcüğe dikkat ediniz:",
    "Cümledeki kelimenin taşıdığı özel anlama bakınız:",
]
HOMONYM_STEM_B = [
    '"{word}" sözcüğü bu cümlede hangi anlamda kullanılmıştır?',
    'Cümledeki "{word}" kelimesinin anlattığı şey hangisidir?',
    '"{word}" burada neyi karşılamaktadır?',
    'Bu kullanımda "{word}" sözcüğünün anlamı hangi seçenektedir?',
    'Verilen cümlede "{word}" kelimesiyle anlatılan nedir?',
]

KELIME_EXPL_A = [
    "Bu soruda anlam ipucu çok açıktır.",
    "Cümledeki bağlam doğru cevabı gösterir.",
    "Kelimenin görevine bakınca seçenek kolayca bulunur.",
    "Anlam ilişkisi cümlede açık biçimde kurulmuştur.",
    "Sözcüğün cümledeki yeri bize önemli bir ipucu verir.",
    "Dikkatli okuma doğru seçeneği hemen ortaya çıkarır.",
    "Bağlamı izleyince yanlış seçenekler elenir.",
    "Cümledeki anlatım kelimenin yönünü belirler.",
    "Sözcük ilişkisini kurunca doğru cevap netleşir.",
    "Anlam bağı iyi okununca seçenekler ayrılır.",
]
KELIME_EXPL_B = [
    "Bu nedenle doğru yanıt budur.",
    "Bu yüzden işaretlenmesi gereken seçenek odur.",
    "Bu ipucu doğru cevabı kesinleştirir.",
    "Böylece uygun kelime kolayca seçilir.",
    "Bu açıklama doğru seçeneği doğrular.",
]

METIN_STEM_A = [
    "Yukarıdaki kısa parçayı dikkatle okuyunuz.",
    "Yukarıdaki satırlara baştan sona göz gezdiriniz.",
    "Yukarıdaki bölümü anlamını bozmadan inceleyiniz.",
    "Yukarıdaki yazıyı sakin biçimde okuyunuz.",
    "Yukarıdaki paragrafı ya da dizeleri dikkatle değerlendiriniz.",
    "Yukarıdaki metni okumayı bitirdikten sonra düşününüz.",
    "Yukarıdaki anlatımı tür özellikleriyle karşılaştırınız.",
    "Yukarıdaki parçanın nasıl yazıldığına odaklanınız.",
    "Yukarıdaki bölümde verilen anlatım biçimini inceleyiniz.",
    "Yukarıdaki metindeki anlatım yolunu belirlemeye çalışınız.",
    "Yukarıdaki satırların ne anlattığı kadar nasıl anlattığına da bakınız.",
    "Yukarıdaki yazılı anlatımı tür yönünden ele alınız.",
    "Yukarıdaki parçadaki ipuçlarını bir araya getiriniz.",
    "Yukarıdaki metnin yapısını dikkatlice düşününüz.",
    "Yukarıdaki dizelerle ya da cümlelerle verilen anlatımı çözünüz.",
]
METIN_STEM_B = [
    "Bu yazının türü hangisidir?",
    "Okuduğunuz bölüm hangi metin türüne girer?",
    "Bu parça aşağıdaki türlerden hangisiyle adlandırılır?",
    "Verilen anlatım için en uygun tür adı nedir?",
    "Bu metni hangi başlık altında toplamak gerekir?",
    "Parçanın yazılış biçimi hangi türü gösterir?",
    "Bu bölüm hangi metin çeşidinin örneğidir?",
    "Okuduğunuz yazı en çok hangi türe benzer?",
    "Bu parçayı hangi tür olarak sınıflandırırız?",
    "Verilen metnin doğru tür adı hangisidir?",
]
METIN_EXPL_A = [
    "Tür özellikleri birlikte düşünülünce sonuç nettir.",
    "Metnin kuruluş biçimi doğru cevabı açıkça gösterir.",
    "Anlatımın amacı dikkatle okununca tür hemen anlaşılır.",
    "Bu parçadaki ipuçları tek bir türde birleşir.",
    "Yazının düzeni ve dili doğru seçeneği destekler.",
    "Parçanın yapısı bize metin türünü doğrudan söyler.",
    "Satırlardaki anlatım özellikleri doğru cevaba götürür.",
    "Metinde kullanılan yol, türü belirlemek için yeterlidir.",
    "Okuma sırasında görülen işaretler aynı sonuca çıkarır.",
    "Parçanın bütününe bakınca tür açıkça seçilir.",
    "Dikkatli bir tür incelemesi doğru yanıtı verir.",
    "Metnin amacı ile biçimi birbirini tamamlar.",
    "Bu bölümdeki anlatım unsurları tek yönde işaret verir.",
    "Türü anlamak için gereken ipuçları metinde yer alır.",
    "Parçadaki dil ve düzen birlikte okunmalıdır.",
]
METIN_EXPL_B = [
    "Bu yüzden doğru cevap budur.",
    "Bu nedenle seçilmesi gereken tür odur.",
    "Bu açıklama doğru seçeneği kesinleştirir.",
    "Böylece uygun tür açıkça ortaya çıkar.",
    "Bu ipuçları doğru türü doğrular.",
    "Sonuç olarak işaretlenmesi gereken cevap budur.",
    "Bu durum doğru yanıtı netleştirir.",
    "Bu özellikler aynı türde birleşir.",
    "Bu yüzden başka seçenekler uygun düşmez.",
    "Böyle düşününce doğru seçenek kolayca bulunur.",
]


SYNONYM_DATA = [
    ("mutlu", "Yarışmayı kazanan Ece bütün gün mutlu dolaştı.", "sevinçli", "üzgün", "yorgun", "ikisi de sevinç duygusunu anlatır"),
    ("küçük", "Küçük kedi kutunun içine saklandı.", "minik", "iri", "geniş", "ikisi de boyutun az olduğunu bildirir"),
    ("büyük", "Büyük balon tavana kadar yükseldi.", "kocaman", "küçük", "dar", "ikisi de çok yer kaplayan şeyi anlatır"),
    ("güzel", "Bahçedeki güzel çiçekleri anneme verdim.", "hoş", "çirkin", "sert", "ikisi de beğenilen görünüşü anlatır"),
    ("hızlı", "Hızlı tren şehre erkenden ulaştı.", "çabuk", "yavaş", "sessiz", "ikisi de kısa sürede hareket etmeyi anlatır"),
    ("siyah", "Siyah kalemimi sıra arkadaşım aldı.", "kara", "beyaz", "mavi", "ikisi de koyu renk tonunu belirtir"),
    ("beyaz", "Beyaz bulutlar gökyüzünde süzüldü.", "ak", "siyah", "sarı", "ikisi de açık ve parlak rengi gösterir"),
    ("cevap", "Öğretmen sorunun cevap bölümünü tahtaya yazdı.", "yanıt", "soru", "ödev", "ikisi de soruya verilen karşılığı anlatır"),
    ("misafir", "Akşam eve gelen misafir için masa kurduk.", "konuk", "ev sahibi", "komşu", "ikisi de ziyaret için gelen kişiyi anlatır"),
    ("akıllı", "Akıllı çocuk oyunun kuralını hemen anladı.", "zeki", "tembel", "dağınık", "ikisi de düşünme gücü yüksek kişiyi anlatır"),
    ("kalp", "Doktor kalbin düzenli çalıştığını söyledi.", "yürek", "bilek", "akciğer", "ikisi de aynı organı karşılar"),
    ("yıl", "Bu yıl okul pikniği mayısta yapılacak.", "sene", "ay", "gün", "ikisi de on iki aylık zamanı anlatır"),
    ("şehir", "Şehir sabah saatlerinde çok sakindi.", "kent", "köy", "sokak", "ikisi de büyük yerleşim yerini anlatır"),
    ("hediye", "Doğum günümde bana renkli bir hediye aldılar.", "armağan", "ceza", "oyuncak", "ikisi de sevinç için verilen şeyi anlatır"),
    ("öykü", "Dedem akşam bize kısa bir öykü okudu.", "hikaye", "şiir", "bilgi", "ikisi de olay anlatan yazıyı karşılar"),
    ("neden", "Bu gecikmenin neden olduğunu öğretmen sordu.", "sebep", "sonuç", "yöntem", "ikisi de bir olayın oluşma gerekçesini anlatır"),
    ("güçlü", "Güçlü sporcu ağır topu kolayca kaldırdı.", "kuvvetli", "zayıf", "sessiz", "ikisi de bedensel gücü fazla olanı anlatır"),
    ("yoksul", "Yoksul aileye okulca yardım toplandı.", "fakir", "zengin", "mutlu", "ikisi de maddi imkanı az olanı bildirir"),
    ("doğa", "Doğayı korumak için çöpleri yere atmadık.", "tabiat", "şehir", "eşya", "ikisi de canlı ve cansız çevreyi anlatır"),
    ("görev", "Sınıf başkanının görev listesini panoya astık.", "vazife", "oyun", "istek", "ikisi de yapılması gereken işi anlatır"),
    ("dost", "Eski dost bir mektup gönderip halimi sordu.", "arkadaş", "düşman", "komşu", "ikisi de yakın ve sevilen kişiyi anlatır"),
    ("yardım", "Komşumuz taşınırken yardım istediklerinde yanlarına gittik.", "destek", "engel", "yarış", "ikisi de birine güç vermeyi anlatır"),
    ("gayret", "Gayret gösteren takım sonunda kupayı aldı.", "çaba", "uyku", "dinlenme", "ikisi de emek vererek uğraşmayı anlatır"),
    ("sınav", "Sınav günü herkes kalemini erkenden hazırladı.", "imtihan", "teneffüs", "öykü", "ikisi de değerlendirme için yapılan yoklamayı anlatır"),
    ("öğrenci", "Öğrenci zil çalınca sınıfa koştu.", "talebe", "öğretmen", "veli", "ikisi de okulda öğrenim gören kişiyi anlatır"),
    ("ulus", "Ulus olarak bayramlarda birlikte seviniriz.", "millet", "sınıf", "takım", "ikisi de aynı ülke halkını anlatır"),
    ("özgür", "Kuş iyileşince yeniden özgür kaldı.", "hür", "kapalı", "üzgün", "ikisi de serbest olmayı anlatır"),
    ("olanak", "Kütüphane bize araştırma için büyük olanak sağladı.", "imkan", "engel", "yasak", "ikisi de yapılabilme fırsatını anlatır"),
    ("anı", "Albümde çocukluğuma ait bir anı saklıyorum.", "hatıra", "plan", "haber", "ikisi de geçmişten kalan hatırlatıcıyı anlatır"),
    ("yöntem", "Bu problemi çözmek için farklı bir yöntem denedik.", "usul", "engel", "şaka", "ikisi de izlenen yolu anlatır"),
    ("gerekli", "Gezi için gerekli belgeleri dosyaya koyduk.", "lazım", "eksik", "boş", "ikisi de ihtiyaç duyulan şeyi anlatır"),
    ("kural", "Oyunun kural maddelerini dikkatle okuduk.", "kaide", "oyuncu", "ödül", "ikisi de uyulması gereken ilkeyi anlatır"),
    ("uyarı", "Kapıdaki uyarı yazısı sessiz olmamızı istedi.", "ikaz", "tebrik", "davet", "ikisi de dikkat çekmek için yapılan bildirimi anlatır"),
    ("kıymet", "Bu eski saatin kıymetini büyükbabam çok iyi bilir.", "değer", "renk", "boy", "ikisi de bir şeyin önemini anlatır"),
    ("düşünce", "Toplantıda herkes düşüncesini sırayla söyledi.", "fikir", "masa", "karar", "ikisi de akıldaki görüşü anlatır"),
    ("hekim", "Hekim hastaya düzenli uyumasını önerdi.", "doktor", "eczacı", "hasta", "ikisi de hastaları muayene eden kişiyi anlatır"),
    ("araç", "Köye giden araç sabah erkenden kalktı.", "taşıt", "durak", "yol", "ikisi de ulaşım için kullanılan şeyi anlatır"),
    ("uygarlık", "Müzede eski uygarlık izlerini gördük.", "medeniyet", "mağara", "orman", "ikisi de toplumların gelişmiş yaşam düzenini anlatır"),
    ("eser", "Sanatçının yeni eseri sergide çok ilgi gördü.", "yapıt", "oyuncu", "seyirci", "ikisi de ortaya konan sanatsal ürünü anlatır"),
    ("kıyı", "Tekne kıyıya yaklaşınca martılar çoğaldı.", "sahil", "orman", "tepe", "ikisi de deniz ya da göl kenarını anlatır"),
    ("yurt", "Sporcular yurt sevgisini anlatan pankartlar taşıdı.", "vatan", "bahçe", "sokak", "ikisi de kişinin ülkesi anlamına gelir"),
    ("yetenek", "Resim yapma yeteneği herkesin dikkatini çekti.", "beceri", "unutkanlık", "yorgunluk", "ikisi de bir işi iyi yapabilme gücünü anlatır"),
    ("ödül", "Kazanan öğrenciye kitap ödül olarak verildi.", "mükafat", "ceza", "soru", "ikisi de başarı karşılığı verilen armağanı anlatır"),
    ("soru", "Soru kökünü okuyunca işlem kolaylaştı.", "sual", "yanıt", "masal", "ikisi de öğrenmek için sorulan ifadeyi anlatır"),
    ("özlem", "Tatil bitince köydeki günlere özlem duydum.", "hasret", "neşe", "öfke", "ikisi de birini ya da bir yeri çok istemeyi anlatır"),
    ("özen", "Defterini özenle dolduran Ada çok dikkatliydi.", "itina", "acele", "gürültü", "ikisi de dikkatli davranmayı anlatır"),
    ("sözcük", "Öğretmen yeni sözcüğü cümlede kullanmamızı istedi.", "kelime", "hece", "nokta", "ikisi de anlamlı dil birimini anlatır"),
    ("umut", "Umut dolu konuşma bütün sınıfı sevindirdi.", "ümit", "korku", "sessizlik", "ikisi de iyi bir sonuç beklemeyi anlatır"),
    ("tamir", "Bisikletin tamiri için ustaya gittik.", "onarım", "boyama", "satış", "ikisi de bozulan şeyi düzeltmeyi anlatır"),
    ("serüven", "Kitaptaki serüven çocukları heyecanlandırdı.", "macera", "uyku", "soru", "ikisi de heyecanlı olaylar dizisini anlatır"),
]

ANTONYM_DATA = [
    ("uzun", "Uzun ipi kutuya sığdırmak zor oldu.", "kısa", "ince", "yeni", "biri boyca fazla, diğeri boyca az olmayı anlatır"),
    ("sıcak", "Sıcak çorbayı üfleyerek içtik.", "soğuk", "ılık", "ekşi", "biri yüksek ısıyı, diğeri düşük ısıyı anlatır"),
    ("yeni", "Yeni ayakkabılarımı bugün ilk kez giydim.", "eski", "temiz", "sert", "biri kullanılmamışı, diğeri uzun süredir kullanılanı anlatır"),
    ("erken", "Erken gelen servis kapıda bizi bekledi.", "geç", "yakın", "ince", "biri zamanında önceliği, diğeri sonralığı anlatır"),
    ("açık", "Açık pencere odayı serinletti.", "kapalı", "dar", "beyaz", "biri aralığı olanı, diğeri kapatılmış olanı anlatır"),
    ("dolu", "Dolu sepeti iki elle taşımak gerekti.", "boş", "derin", "hafif", "biri içinde bir şey bulunanı, diğeri bulunmayanı gösterir"),
    ("hızlı", "Hızlı koşucu yarışı önde bitirdi.", "yavaş", "ince", "geniş", "biri çabukluğu, diğeri ağır ilerlemeyi anlatır"),
    ("sert", "Sert minderin üstünde oturmak rahatsız etti.", "yumuşak", "kalın", "parlak", "biri katı yapıyı, diğeri kolay biçim alan yapıyı bildirir"),
    ("yakın", "Okul bize yakın olduğu için yürüyerek gidiyoruz.", "uzak", "kalabalık", "güzel", "biri mesafenin azlığını, diğeri çokluğunu anlatır"),
    ("neşeli", "Neşeli şarkı herkesi oynattı.", "üzgün", "sessiz", "kızgın", "biri sevinci, diğeri üzüntüyü anlatır"),
    ("kalın", "Kalın kitabı çantama güçlükle koydum.", "ince", "uzun", "büyük", "biri eni çok olanı, diğeri az olanı gösterir"),
    ("ağır", "Ağır valizi tek başıma kaldıramadım.", "hafif", "genç", "geniş", "biri taşınması zor olanı, diğeri kolay olanı anlatır"),
    ("içeri", "Yağmur başlayınca çocuklar içeri girdi.", "dışarı", "aşağı", "erken", "biri kapalı alana yönelmeyi, diğeri dışa çıkmayı anlatır"),
    ("yukarı", "Balon yukarı doğru yükseldi.", "aşağı", "ileri", "yakın", "biri üst yönü, diğeri alt yönü anlatır"),
    ("temiz", "Temiz sıra özenli görünüyordu.", "kirli", "parlak", "sıcak", "biri lekesizliği, diğeri lekeli olmayı anlatır"),
    ("kolay", "Bu yapboz bana çok kolay geldi.", "zor", "yavaş", "uzun", "biri rahat yapılabileni, diğeri güç olanı anlatır"),
    ("aydınlık", "Aydınlık sınıfta kitap okumak rahattı.", "karanlık", "sessiz", "dar", "biri ışığı, diğeri ışıksızlığı anlatır"),
    ("çalışkan", "Çalışkan öğrenci ödevini zamanında teslim etti.", "tembel", "neşeli", "güçlü", "biri çok çalışanı, diğeri çalışmaktan kaçanı anlatır"),
    ("cesur", "Cesur çocuk karanlık depoya girdi.", "korkak", "mutlu", "ince", "biri korkmadan davrananı, diğeri çekineni anlatır"),
    ("gürültülü", "Gürültülü salon ders yapmayı zorlaştırdı.", "sessiz", "renkli", "temiz", "biri çok ses çıkaranı, diğeri az sesli olanı anlatır"),
    ("genç", "Genç fidan rüzgarda esnek kaldı.", "yaşlı", "ince", "derin", "biri az yaşlıyı, diğeri çok yaşlıyı bildirir"),
    ("var", "Dolabımda hala silgim var.", "yok", "çok", "ince", "biri bulunmayı, diğeri bulunmamayı anlatır"),
    ("başlangıç", "Masalın başlangıç bölümü hemen ilgimi çekti.", "bitiş", "orta", "soru", "biri ilk kısmı, diğeri son kısmı anlatır"),
    ("doğru", "Doğru cevabı görünce sevindim.", "yanlış", "kolay", "temiz", "biri gerçeğe uygun olanı, diğeri uygun olmayanı anlatır"),
    ("düzenli", "Düzenli masa aradığımı hemen buldurdu.", "dağınık", "renkli", "temiz", "biri topluluğu, diğeri karışıklığı anlatır"),
    ("kalabalık", "Kalabalık pazar yerinde yürümek zorlaştı.", "tenha", "aydınlık", "genç", "biri çok insanlı yeri, diğeri ıssız yeri anlatır"),
    ("kabul", "Kulüp benim önerimi sevinçle kabul etti.", "ret", "ödül", "başarı", "biri onaylamayı, diğeri geri çevirmeyi anlatır"),
    ("faydalı", "Faydalı alışkanlıklar bizi güçlendirir.", "zararlı", "kolay", "sakin", "biri yarar vereni, diğeri zarar vereni anlatır"),
    ("başarılı", "Başarılı takım turnuvayı birinci bitirdi.", "başarısız", "mutlu", "ince", "biri amacına ulaşanı, diğeri ulaşamayanı anlatır"),
    ("gerçek", "Gerçek altın ışıkta daha çok parlar.", "sahte", "yeni", "ince", "biri hakiki olanı, diğeri taklit olanı anlatır"),
    ("cömert", "Cömert komşumuz kitaplarını bizimle paylaştı.", "cimri", "cesur", "yaramaz", "biri paylaşmayı seveni, diğeri paylaşmaktan kaçanı anlatır"),
    ("dost", "Dost sözler içimi rahatlattı.", "düşman", "öğretmen", "komşu", "biri seven kişiyi, diğeri zarar vermek isteyeni anlatır"),
    ("giriş", "Müzenin giriş kapısında uzun sıra vardı.", "çıkış", "salon", "duvar", "biri içeri girilen yeri, diğeri dışarı çıkılan yeri anlatır"),
    ("mutlu", "Mutlu yüzü görünce herkes rahatladı.", "mutsuz", "yorgun", "parlak", "biri sevinçli olmayı, diğeri sevinçsiz olmayı anlatır"),
    ("nazik", "Nazik konuşması herkesi memnun etti.", "kaba", "sessiz", "neşeli", "biri incelikli davranışı, diğeri kırıcı davranışı anlatır"),
    ("yaş", "Yaş odun hemen tutuşmadı.", "kuru", "ince", "sıcak", "biri ıslaklığı, diğeri kuruluğu anlatır"),
    ("şişman", "Şişman kedi koltuğa zor sığdı.", "zayıf", "uzun", "yaşlı", "biri çok kiloluyu, diğeri az kiloluyu anlatır"),
    ("geniş", "Geniş sınıfta rahatça oyun oynadık.", "dar", "yüksek", "kalın", "biri enli alanı, diğeri sıkışık alanı anlatır"),
    ("kıymetli", "Kıymetli yüzüğü kutuda sakladılar.", "değersiz", "parlak", "ince", "biri değerli olanı, diğeri önemsiz olanı anlatır"),
    ("umutlu", "Umutlu bakışlar bizi çalışmaya yöneltti.", "umutsuz", "sessiz", "kirli", "biri iyi sonuç beklemeyi, diğeri beklememeyi anlatır"),
    ("iyi", "İyi arkadaş zor günde yanında olur.", "kötü", "uzun", "tatlı", "biri olumlu niteliği, diğeri olumsuzu anlatır"),
    ("alçak", "Alçak masa pencerenin altında kaldı.", "yüksek", "ince", "eski", "biri aşağı seviyeyi, diğeri yukarı seviyeyi anlatır"),
    ("bozuk", "Bozuk oyuncak artık çalışmıyordu.", "sağlam", "büyük", "yavaş", "biri arızalı olanı, diğeri çalışır durumda olanı anlatır"),
    ("canlı", "Canlı çiçek düzenli su isteyebilir.", "cansız", "renkli", "ince", "biri yaşamı olanı, diğeri yaşamı olmayanı anlatır"),
    ("ön", "Arabanın ön koltuğuna oturdum.", "arka", "yan", "üst", "biri ileri tarafı, diğeri geri tarafı anlatır"),
    ("savaş", "Savaş yerine çocuklar barışı konuştu.", "barış", "oyun", "yol", "biri çatışmayı, diğeri huzurlu anlaşmayı anlatır"),
    ("parlak", "Parlak yıldız geceyi süsledi.", "mat", "hızlı", "temiz", "biri ışığı çok yansıtmayı, diğeri donuk görünmeyi anlatır"),
    ("uysal", "Uysal köpek çocuklarla sessizce oynadı.", "yaramaz", "genç", "uzun", "biri sakin davrananı, diğeri uslu durmayanı anlatır"),
    ("düz", "Düz yol bisiklet sürmeyi kolaylaştırdı.", "eğimli", "geniş", "uzak", "biri eğimi olmayanı, diğeri eğimli olanı anlatır"),
    ("tok", "Tok olduğum için tatlı istemedim.", "aç", "yorgun", "mutlu", "biri doymuş olmayı, diğeri yemek istemeyi anlatır"),
]

HOMONYM_DATA = [
    ("yüz", "Kerem sabah yüzünü soğuk suyla yıkadı.", "çehre", "yüzmek işi", "yüz sayısı", "burada sözcük kişinin ön tarafındaki çehreyi anlatır"),
    ("yüz", "Ablam yaz gelince havuzda uzun uzun yüzüyor.", "suda kulaç atma işi", "çehre", "yüz sayısı", "burada sözcük su içinde hareket etmeyi anlatır"),
    ("gül", "Bahçedeki pembe gül sabah açtı.", "çiçek", "gülme işi", "kuş sesi", "burada sözcük güzel kokulu çiçeği anlatır"),
    ("gül", "Babamın şakasına herkes yüksek sesle gülmeye başladı.", "gülme işi", "çiçek", "oyuncak", "burada sözcük kahkaha atmayı anlatır"),
    ("yaz", "Yaz gelince deniz kıyısına gitmeyi severiz.", "mevsim", "deftere yazmak", "renk", "burada sözcük yılın sıcak mevsimini anlatır"),
    ("yaz", "Adını karnenin üstüne düzgünce yaz.", "harflerle belirtmek", "mevsim", "boyamak", "burada sözcük kelimeleri harflerle oluşturmayı anlatır"),
    ("çay", "Dedem sabah kahvaltısında açık çay içer.", "içecek", "küçük akarsu", "oyun arası", "burada sözcük içilen sıcak içeceği anlatır"),
    ("çay", "Köyün yanından ince bir çay akıp gidiyordu.", "küçük akarsu", "içecek", "tahta oyun taşı", "burada sözcük dar akarsu anlamındadır"),
    ("dolu", "Öğleden sonra ansızın dolu yağınca herkes eve koştu.", "buz tanecikli yağış", "içi dolu olma durumu", "boş kutu", "burada sözcük gökten düşen buz tanelerini anlatır"),
    ("dolu", "Şişe ağzına kadar dolu olduğu için taşındı.", "içi boş olmayan", "buz tanecikli yağış", "renkli desen", "burada sözcük içinde yer kalmamasını anlatır"),
    ("ocak", "Ocak ayında köy yolları karla kaplandı.", "yılın ilk ayı", "yemek pişirilen araç", "meyve adı", "burada sözcük ay adı olarak kullanılmıştır"),
    ("ocak", "Annem çorbayı ocakta yavaş yavaş ısıttı.", "yemek pişirilen araç", "yılın ilk ayı", "oyun alanı", "burada sözcük pişirme aracını anlatır"),
    ("kaz", "Göletteki beyaz kaz sessizce yüzdü.", "bir su kuşu", "toprağı eşelemek", "tahta kap", "burada sözcük hayvan adı olarak kullanılmıştır"),
    ("kaz", "Fidan dikeceksen önce toprağı iyice kaz.", "toprağı eşelemek", "bir su kuşu", "renk adı", "burada sözcük kürekle açma işini anlatır"),
    ("saç", "Ayşe saçını iki örgü yapıp okula geldi.", "baştaki kıllar", "etrafa serpmek", "ince ip", "burada sözcük başımızdaki kılları anlatır"),
    ("saç", "Masaya su saçma, defterler ıslanır.", "etrafa serpmek", "baştaki kıllar", "bez parçası", "burada sözcük dağıtıp dökmeyi anlatır"),
    ("bağ", "Dedem yaz sonunda bağdan tatlı üzüm toplar.", "üzüm yetişen yer", "ip düğümü", "uzun köprü", "burada sözcük üzüm bahçesi anlamındadır"),
    ("bağ", "Paketin bağını çözünce kutu hemen açıldı.", "ip düğümü", "üzüm yetişen yer", "kuş yuvası", "burada sözcük düğüm ya da bağlama parçasını anlatır"),
    ("kar", "Dağın tepelerine gece boyunca kar yağdı.", "yağış türü", "kazanç", "tahta oyuncak", "burada sözcük beyaz yağışı anlatır"),
    ("kar", "Manav bu satıştan biraz kar etti.", "kazanç", "yağış türü", "boş kavanoz", "burada sözcük elde edilen kazancı anlatır"),
    ("at", "Çiftlikteki at sabah erkenden kişnedi.", "binek hayvanı", "fırlatmak", "oyun kartı", "burada sözcük hayvan adı olarak kullanılmıştır"),
    ("at", "Topu yükseğe at da arkadaşın tutsun.", "fırlatmak", "binek hayvanı", "merdiven basamağı", "burada sözcük elden gönderme işini anlatır"),
    ("koy", "Tekne küçük bir koya yanaşıp durdu.", "deniz girintisi", "bir şeyi bırakmak", "yünlü hayvan", "burada sözcük denizin kara içine girdiği yeri anlatır"),
    ("koy", "Defteri masanın üstüne koy ve sırana geç.", "bir şeyi bırakmak", "deniz girintisi", "yünlü hayvan", "burada sözcük yerleştirme işini anlatır"),
    ("ek", "Türkçede bazı ekler kelimenin sonuna gelir.", "kelime sonuna gelen parça", "bir şey daha katmak", "meyve sepeti", "burada sözcük dil bilgisi unsurunu anlatır"),
    ("ek", "Çorbana biraz daha tuz ek, tadı artsın.", "bir şey daha katmak", "kelime sonuna gelen parça", "rüzgar sesi", "burada sözcük ilave etmeyi anlatır"),
    ("yaş", "Ben bu yıl dokuz yaşına girdim.", "ömrün yılı", "ıslak olma durumu", "bitki dalı", "burada sözcük kişinin kaç yıllık olduğunu anlatır"),
    ("yaş", "Yağmurdan sonra çimenler yaş kaldı.", "ıslak olma durumu", "ömrün yılı", "ince çizgi", "burada sözcük kuruluğun karşıtını anlatır"),
    ("aç", "Okuldan dönünce çok aç hissettim.", "karnı doymamış", "kapalıyı açmak", "ince dal", "burada sözcük yemek isteme durumunu anlatır"),
    ("aç", "Pencereyi aç da oda havalansın.", "kapalıyı aralamak", "karnı doymamış", "renk tonu", "burada sözcük bir şeyi açma işini anlatır"),
    ("in", "Tavşan korkunca hızla inine girdi.", "hayvan yuvası", "taşıttan aşağı inmek", "tahta parçası", "burada sözcük barınak anlamındadır"),
    ("in", "Otobüs durdu, şimdi usulca in.", "taşıttan aşağı inmek", "hayvan yuvası", "ince kumaş", "burada sözcük aşağıya geçme işini anlatır"),
    ("diz", "Koşarken dizimi sıraya çarptım.", "bacak eklemi", "sıraya koymak", "sıcak içecek", "burada sözcük vücuttaki eklemi anlatır"),
    ("diz", "Boncukları ipe tek tek diz.", "sıraya koymak", "bacak eklemi", "gece lambası", "burada sözcük peş peşe yerleştirmeyi anlatır"),
    ("al", "Bayrağımızdaki al renk uzaktan parladı.", "kırmızı renk", "bir şeyi almak", "dalgalı su", "burada sözcük kırmızı rengi anlatır"),
    ("al", "Marketten ekmek almayı unutma.", "bir şeyi edinmek", "kırmızı renk", "kapıyı kapatmak", "burada sözcük elde etme işini anlatır"),
    ("bin", "Kütüphanede bin kitap olduğunu öğrendik.", "sayı adı", "taşıta çıkmak", "çiçek kokusu", "burada sözcük sayı olarak kullanılmıştır"),
    ("bin", "Servis gelince sırayla otobüse bin.", "taşıta çıkmak", "sayı adı", "kapıyı örtmek", "burada sözcük araca çıkmayı anlatır"),
    ("çal", "Akşam töreninde keman çalacakmış.", "müzik aleti çalmak", "bir şeyi izinsiz almak", "ince dal", "burada sözcük müzik üretmeyi anlatır"),
    ("çal", "Başkasının kalemini çalmak doğru değildir.", "bir şeyi izinsiz almak", "müzik aleti çalmak", "oyuncak boyamak", "burada sözcük hırsızlık yapmayı anlatır"),
    ("bel", "Ağır çantayı kaldırınca belim ağrıdı.", "vücudun orta bölümü", "toprağı eşelemeye yarayan araç", "sandalye ayağı", "burada sözcük bedenimizin orta kısmını anlatır"),
    ("bel", "Bahçıvan toprağı bel ile havalandırdı.", "toprağı eşelemeye yarayan araç", "vücudun orta bölümü", "su kabı", "burada sözcük kazma benzeri aracı anlatır"),
    ("dal", "Kuş ince bir dala konup öttü.", "ağaç kolu", "suya atlamak", "defter kenarı", "burada sözcük ağacın kolunu anlatır"),
    ("dal", "Havuz derin ama öğretmen gelmeden suya dalma.", "suya atlamak", "ağaç kolu", "ince çorap", "burada sözcük su içine girmeyi anlatır"),
    ("saz", "Dedem akşam olunca saz çalıp türkü söyledi.", "müzik aleti", "sulak yerde yetişen bitki", "tahta kapak", "burada sözcük telli çalgıyı anlatır"),
    ("saz", "Gölde uzayan sazlar rüzgarda sallandı.", "sulak yerde yetişen bitki", "müzik aleti", "oyun taşı", "burada sözcük kamış benzeri bitkiyi anlatır"),
    ("yat", "Bebek uykusu gelsin diye erken yat.", "uyumak için uzanmak", "lüks tekne", "ince bulut", "burada sözcük dinlenmek için uzanmayı anlatır"),
    ("yat", "Limanın önünde beyaz bir yat demirlemişti.", "lüks tekne", "uyumak için uzanmak", "toprak yolu", "burada sözcük gezinti teknesini anlatır"),
    ("düş", "Gece rengarenk bir düş gördüm.", "rüya", "yere yuvarlanmak", "ince ses", "burada sözcük uyurken görülen rüyayı anlatır"),
    ("düş", "Islak zeminde koşarsan hemen düşersin.", "yere yuvarlanmak", "rüya", "çiçek kokusu", "burada sözcük yere kapaklanmayı anlatır"),
]


STORY_SCENARIOS = [
    ("Elif", "okul bahçesinde", "kopan uçurtma ipini sabırla düzeltti", "arkadaşı ona makara getirdi", "uçurtma yeniden göğe yükselince gülümsedi"),
    ("Mert", "köy yolunda", "yaşlı komşusunun düşen poşetlerini topladı", "rüzgar poşetleri savurdu", "komşusu ona teşekkür edip el salladı"),
    ("Zeynep", "kütüphanede", "aradığı masal kitabını raflarda uzun süre aradı", "görevli teyze doğru bölümü gösterdi", "kitabı bulunca sessizce yerine oturdu"),
    ("Arda", "sınıfta", "fen deneyi için getirdiği tohumu pamuğa yerleştirdi", "su miktarını öğretmeniyle ölçtü", "ertesi gün minik filizi görünce sevindi"),
    ("Defne", "parkta", "kaybolan topunu bankların altında aradı", "küçük kardeşi ona seslendi", "topu çiçeklerin yanında bulup oyuna döndü"),
    ("Can", "mutfakta", "annesiyle meyve salatası hazırladı", "muzları dikkatle doğradı", "sofra kurulunca herkese tabak dağıttı"),
    ("Ece", "sahilde", "kumdan kule yaparken kovasını denize kaptırdı", "abisi kovayı koşup aldı", "ikisi birlikte daha büyük bir kule kurdu"),
    ("Kerem", "serada", "kuruyan fideleri sulama görevini üstlendi", "hortumu taşırken ayakkabısı ıslandı", "çiçekler dik durunca emeğine değdi"),
    ("Lina", "oyun alanında", "arkadaşları için seksek çizgileri çizdi", "tebeşiri kırılınca yenisini buldu", "oyun başlayınca herkesi sıraya dizdi"),
    ("Bora", "atölyede", "tahta kuş yuvasını boyamaya koyuldu", "fırçasını yanlışlıkla yere düşürdü", "yuva kuruyunca ağaca asmaya karar verdi"),
    ("Ada", "bahçede", "domates fidelerinin yanına destek çubukları yerleştirdi", "dedesi ipin nasıl bağlanacağını gösterdi", "fideler dikleşince rahatladı"),
    ("Emir", "spor salonunda", "takımının unutulan su şişelerini topladı", "antrenör ona teşekkür etti", "maç başlamadan herkes ihtiyacını karşıladı"),
    ("İpek", "resim sınıfında", "yarım kalan afişini renklerle tamamladı", "mavi boya kapağı sıkıştı", "arkadaşı kapağı açınca çalışması hızlandı"),
    ("Yiğit", "mahallede", "sokak kedileri için kartondan kulübe yaptı", "komşular eski battaniye verdi", "kediler kulübeye girince çok sevindi"),
    ("Duru", "müzik odasında", "ritim çubuklarını arkadaşlarına paylaştırdı", "sayımı üç kez tekrarladı", "çalışma düzenli başlayınca rahat etti"),
    ("Kaan", "piknik alanında", "uçuşan peçeteleri taşların altına yerleştirdi", "rüzgar bir kez daha esince koştu", "masa düzenlenince ailesi ona sarıldı"),
    ("Naz", "koridorda", "düşen sergi resimlerini tekrar sıraladı", "bant bulmak için öğretmenler odasına gitti", "duvar yeniden renklenince mutlu oldu"),
    ("Deniz", "fırında", "babasına simitleri sepete dizerken yardım etti", "susamlar tezgaha döküldü", "tezgahı temizleyip işini tamamladı"),
    ("Mina", "müzede", "rehberin anlattığı bölümü not defterine yazdı", "kalemi bir an çalışmadı", "yedek kalemle notlarını tamamladı"),
    ("Eymen", "orman yolunda", "izci grubunun işaretlerini dikkatle izledi", "yağrak sesleri onu şaşırttı", "doğru patikayı bulunca grubuna seslendi"),
    ("Asya", "sergi salonunda", "yaptığı seramik kuşu masaya özenle bıraktı", "masanın sallandığını fark etti", "altına karton koyup güvenle sergiledi"),
    ("Poyraz", "kış bahçesinde", "camları buğulanan serayı havalandırdı", "kapıyı açınca serin bir esinti geldi", "bitkiler ferahlayınca içi rahatladı"),
    ("Melis", "okul yolunda", "yağmurdan ıslanan afişleri çantasına aldı", "arkadaşlarıyla saçak altında bekledi", "sınıfa varınca afişleri kuruttu"),
    ("Tuna", "oyuncak odasında", "bozulan robotun vidalarını sıktı", "doğru tornavidayı çekmecede buldu", "robot yeniden yürüyünce alkışlandı"),
    ("Sena", "kümes yanında", "yumurtaları dikkatle sepete yerleştirdi", "bir tavuk ansızın kanat çırptı", "sakin davranınca işi zarar görmeden bitti"),
    ("Baran", "sulama kanalında", "tıkanan yaprakları elle temizledi", "su önce yavaş aktı", "kanal açılınca bahçedeki su arttı"),
    ("Elisa", "sahne arkasında", "gösteri için taçları arkadaşlarına dağıttı", "isimleri karıştırmamak için liste tuttu", "sırası gelen herkes tacını zamanında aldı"),
    ("Mete", "tamir köşesinde", "gevşeyen sandalye ayağını yapıştırdı", "tutkal kapağını güçlükle açtı", "sandalye kuruyunca yeniden sağlamlaştı"),
    ("Nehir", "pazar yerinde", "annesi için taze maydanoz seçti", "kalabalık yüzünden tezgahı zor gördü", "satıcı yardım edince işini bitirdi"),
    ("Doruk", "karlı sokakta", "kapı önündeki karı kürekle temizledi", "elleri üşüyünce kısa bir mola verdi", "komşular geçerken ona teşekkür etti"),
    ("Su", "sınıf kitaplığında", "etiketi düşen kutuları yeniden adlandırdı", "renkli kalemleri tek tek ayırdı", "her kutu yerine dönünce düzen kuruldu"),
    ("Rüzgar", "bisiklet parkında", "gevşeyen zil vidasını sıkmaya çalıştı", "babası ona doğru anahtarı verdi", "zil çalınca ikisi de güldü"),
    ("Selin", "köy meydanında", "bayram süslerini ipin üzerine dizdi", "rüzgar süsleri dolaştırdı", "komşularla birlikte düğümleri çözdü"),
    ("Aren", "dere kenarında", "taşlardan küçük bir köprü kurmayı denedi", "su bazı taşları kaydırdı", "daha düz taşlar seçince geçit tamamlandı"),
    ("Nil", "oyun çadırında", "küçük kardeşine kukla gösterisi hazırladı", "perde ipi gevşeyince tekrar bağladı", "gösteri başlayınca herkes sessizce izledi"),
    ("Atlas", "bahçe kapısında", "gıcırdayan menteşeye yağ sürdü", "eldivenleri biraz kirlendi", "kapı sessiz açılınca derin nefes aldı"),
    ("Lale", "sınıf panosunda", "gezi fotoğraflarını güzelce sıraladı", "bazı fotoğraflar ters durdu", "tek tek düzeltip panoyu tamamladı"),
    ("Ozan", "marangoz masasında", "tahta arabasının tekerini yerine geçirdi", "pimi bulmak için kutuları karıştırdı", "oyuncak yeniden dönünce sevindi"),
    ("Ceren", "gölgelikte", "susayan çiçeklere küçük kaplarla su taşıdı", "kova ağırlaşınca iki kez dinlendi", "toprak yumuşayınca emek verdiğine değdi"),
    ("Kuzey", "sınıf kapısında", "dağıtılacak davetiyeleri numaralara göre ayırdı", "iki zarfın yerini karıştırdı", "listeye bakıp doğru sırayı buldu"),
    ("Aylin", "çiftlikte", "yem kaplarını civcivlerin önüne dikkatle koydu", "bir civciv ayağına dolandı", "sakin davranınca hepsi yemeye başladı"),
    ("Toprak", "okuma köşesinde", "arkadaşına takılan ayraç yapmayı öğretti", "makasın kör olduğunu fark etti", "yenisiyle düzgün bir ayraç hazırladı"),
    ("Yaren", "resim sergisinde", "ziyaretçilere yaptığı tabloyu anlattı", "heyecandan sesi biraz titredi", "derin nefes alınca konuşması düzeldi"),
    ("Bulut", "dede evinin avlusunda", "eski salıncağın ipini kontrol etti", "düğümün gevşediğini gördü", "yeniden bağlayınca kardeşi güvenle sallandı"),
    ("Irmak", "deney masasının başında", "kağıt gemisinin neden battığını gözlemledi", "ikinci denemede daha kalın kağıt kullandı", "gemi su üstünde kalınca not aldı"),
    ("Pars", "kütüphane sırasında", "ödünç aldığı kitabın sayfasını tamir bandıyla düzeltti", "bandı eğri yapıştırdı", "sakin olup ikinci kez düzgün uyguladı"),
    ("Nisa", "çiçek pazarında", "menekşeler için en güneşli yeri seçti", "saksıların etiketlerini okudu", "eve dönünce çiçekleri pencere önüne dizdi"),
    ("Utku", "oyun turnuvasında", "takım arkadaşlarına görev dağılımı yaptı", "ilk turda heyecanlandılar", "plan işe yarayınca herkes daha güvenli oynadı"),
    ("Ezgi", "köy okulunda", "eski kukla perdesine yeni düğmeler dikti", "ip bir kez dolaştı", "sabırla açıp işi bitirdi"),
    ("Meriç", "bahar şenliğinde", "uçan balonları küçük çocuklara ulaştırdı", "balonlardan biri ağaca takıldı", "sopayla indirip sahibine verdi"),
]

INFO_TOPICS = [
    ("arılar", "Arılar çiçeklerden nektar toplar.", "Topladıkları nektardan bal oluşur.", "Kovanda birlikte çalışırlar."),
    ("kaplumbağalar", "Kaplumbağaların sert bir kabuğu vardır.", "Tehlike hissedince başlarını kabuklarına çekerler.", "Yavaş hareket etmeleriyle tanınırlar."),
    ("gökkuşağı", "Gökkuşağı yağmurdan sonra görülebilir.", "Güneş ışığı su damlalarında kırılınca oluşur.", "Birçok renk yan yana görünür."),
    ("diş fırçalama", "Dişler sabah ve akşam fırçalanmalıdır.", "Düzenli fırçalama ağız sağlığını korur.", "Diş macunu temizliği kolaylaştırır."),
    ("karıncalar", "Karıncalar küçük ama çalışkan canlılardır.", "Yiyeceklerini taşırken birlikte hareket ederler.", "Yuvalarında düzenli bir yaşam kurarlar."),
    ("süt", "Süt kemikler için yararlı bir içecektir.", "İçinde büyümeye yardım eden besinler bulunur.", "Yoğurt ve peynir de sütten yapılır."),
    ("trafik ışıkları", "Trafik ışıkları araçların ve yayaların düzenli geçmesini sağlar.", "Kırmızı ışık durmayı anlatır.", "Yeşil ışık geçiş izni verir."),
    ("bulutlar", "Bulutlar gökyüzünde su damlacıklarıyla oluşur.", "Bazı bulutlar yağmur getirir.", "Rüzgar bulutların yerini değiştirebilir."),
    ("geri dönüşüm", "Geri dönüşüm kullanılabilir atıkları yeniden değerlendirir.", "Kağıt, cam ve plastik ayrı toplanabilir.", "Bu alışkanlık doğayı korumaya yardım eder."),
    ("fener", "Fener karanlıkta çevreyi görmemizi sağlar.", "İçindeki pil ya da enerji kaynağı ışık verir.", "Kamp yapanlar feneri sık kullanır."),
    ("kitaplık", "Kitaplık kitapları düzenli tutmak için kullanılır.", "Raflar kitapları boylarına göre ayırmaya yardım eder.", "Düzenli bir kitaplık aranan kitabı çabuk buldurur."),
    ("yağmur", "Yağmur bulutlardan düşen su damlalarından oluşur.", "Bitkiler yağmur suyuyla canlanır.", "Şemsiye yağmurdan korunmaya yardım eder."),
    ("zeytin ağacı", "Zeytin ağacı uzun yıllar yaşayabilir.", "Meyvesinden yağ elde edilir.", "Akdeniz ikliminde sık yetiştirilir."),
    ("postacı", "Postacı mektup ve kargoları adreslere ulaştırır.", "Dağıtıma çıkmadan önce gönderileri sıralar.", "Doğru adrese gitmek için dikkatli çalışır."),
    ("termometre", "Termometre sıcaklığı ölçen araçtır.", "Hastayken vücut sıcaklığımızı öğrenmek için kullanılır.", "Hava durumunda da sıcaklık termometreyle izlenir."),
    ("pusula", "Pusula yön bulmaya yardım eder.", "İğnesi kuzeyi gösterir.", "Gezilerde doğru yolu seçmeyi kolaylaştırır."),
    ("pamuk", "Pamuk yumuşak lifleri için yetiştirilir.", "Bu liflerden kumaş yapılabilir.", "Sıcak bölgelerde yetişmesi kolaydır."),
    ("kirpi", "Kirpinin sırtında sivri dikenler bulunur.", "Bu dikenler onu korumaya yardım eder.", "Tehlike anında top gibi kapanabilir."),
    ("kar tanesi", "Kar taneleri havadaki su buharından oluşur.", "Soğuk havada altı köşeli şekiller görülebilir.", "Her kar tanesi farklı görünebilir."),
    ("yoğurt", "Yoğurt sütten yapılır.", "Kalsiyum içeriğiyle kemiklere destek olur.", "Ayran yapmak için yoğurt suyla karıştırılabilir."),
    ("rüzgar gülü", "Rüzgar gülü rüzgarın yönünü gösterir.", "Açık alanlara yerleştirilir.", "Çiftliklerde ve hava istasyonlarında görülebilir."),
    ("orman", "Orman birçok ağacın bir arada bulunduğu alandır.", "Kuşlar ve başka canlılar burada yaşar.", "Ormanlar havayı temizlemeye yardım eder."),
    ("domates", "Domates yazın sık yetiştirilen bir sebzedir.", "Kırmızı rengiyle kolayca tanınır.", "Salata ve yemeklerde kullanılabilir."),
    ("göl", "Göl karalar arasında kalan su birikintisidir.", "Bazı göller tatlı su taşır.", "Kıyısında kuşlar ve sazlıklar görülebilir."),
    ("kütüphane", "Kütüphane kitap okuma ve araştırma yeridir.", "Kitaplar belirli bir düzene göre yerleştirilir.", "Sessiz olmak kütüphanede önemlidir."),
    ("balıklar", "Balıklar suda yaşayan canlılardır.", "Solungaçlarıyla nefes alırlar.", "Yüzgeçleri hareket etmelerini kolaylaştırır."),
    ("yıldızlar", "Yıldızlar gece gökyüzünde parlak görünür.", "Aslında çok uzak ve çok sıcak gök cisimleridir.", "Bazıları kümeler halinde izlenebilir."),
    ("çadır", "Çadır taşınabilir bir barınaktır.", "Kamp yaparken gece kalmak için kurulur.", "Kazık ve iplerle sabitlenir."),
    ("çam ağacı", "Çam ağacının yaprakları iğne gibidir.", "Dört mevsim yeşil kalabilir.", "Kozalakları tohum taşır."),
    ("buzdolabı", "Buzdolabı yiyecekleri serin tutar.", "Soğuk ortam besinlerin daha geç bozulmasını sağlar.", "Kapısı sık açılırsa içi ısınabilir."),
    ("martılar", "Martılar deniz kıyılarında sık görülen kuşlardır.", "Geniş kanatlarıyla uzun süre süzülebilirler.", "Çoğu zaman yüksek sesle öterler."),
    ("çilek", "Çilek küçük ve kokulu bir meyvedir.", "İlkbahar sonu ile yaz başında toplanır.", "Tatlılarda ve reçelde kullanılabilir."),
    ("dağ", "Dağ çevresine göre yüksek olan yeryüzü şeklidir.", "Hava yükseldikçe serinleyebilir.", "Bazı dağların tepesi yıl boyunca karlı kalır."),
    ("sabun", "Sabun elleri temizlemeye yardım eder.", "Su ile birlikte kullanılır.", "Mikropların azalmasına katkı sağlar."),
    ("baykuş", "Baykuş geceleri daha etkin olan bir kuştur.", "Sessiz uçuşu sayesinde kolay fark edilmez.", "Büyük gözleriyle tanınır."),
    ("takvim", "Takvim günleri, haftaları ve ayları gösterir.", "Önemli tarihleri işaretlemek için kullanılır.", "Yeni yıl gelince takvim de yenilenir."),
    ("tren", "Tren raylar üzerinde giden bir taşıttır.", "Birçok vagonu arka arkaya bağlanabilir.", "Uzak yolculuklarda sık kullanılır."),
    ("limon", "Limon sarı renkli bir meyvedir.", "Ekşi tadıyla bilinir.", "Suyu içeceklere ve yemeklere katılabilir."),
    ("nehir", "Nehir uzun bir akarsu türüdür.", "Bazı nehirler denize dökülür.", "Çevresindeki canlılara su sağlar."),
    ("kuş yuvası", "Kuş yuvası yumurta ve yavruları korur.", "Dallar, yapraklar ve otlarla yapılabilir.", "Ağaç dallarında sık görülür."),
    ("saksı", "Saksı bitki yetiştirmek için kullanılır.", "Altındaki delikler fazla suyun akmasını sağlar.", "Bitkinin kökleri toprak içinde gelişir."),
    ("uçurtma", "Uçurtma rüzgarlı havalarda uçurulur.", "İp yardımıyla kontrol edilir.", "Hafif malzemelerden yapılır."),
    ("defter", "Defter yazı yazmak ve not tutmak için kullanılır.", "Sayfaları sırayla çevrilir.", "Kapak defteri korur."),
    ("şemsiye", "Şemsiye yağmurdan ya da güneşten korunmaya yardım eder.", "Açılıp kapanabilen bir yapısı vardır.", "Rüzgar çok kuvvetli olursa ters dönebilir."),
    ("denizyıldızı", "Denizyıldızı denizde yaşayan bir canlıdır.", "Birçok türünün kolları vardır.", "Kayalık bölgelerde görülebilir."),
    ("fırın", "Fırın yiyecekleri sıcak hava ile pişirir.", "Ekmek ve kek yapmakta kullanılır.", "Çalışırken kapağı dikkatle açmak gerekir."),
    ("kelebek", "Kelebekler renkli kanatlarıyla bilinir.", "Önce tırtıl olarak yaşarlar.", "Çiçeklere konup nektar alabilirler."),
    ("su döngüsü", "Su döngüsünde su buharlaşır, yükselir ve yeniden yağış olarak iner.", "Güneş bu döngünün işlemesine yardım eder.", "Böylece doğadaki su sürekli hareket eder."),
    ("deniz feneri", "Deniz feneri kıyıda gemilere yol gösterir.", "Geceleri güçlü bir ışık yayar.", "Kayalık bölgelerde güvenlik sağlar."),
    ("harita", "Harita bir yerin küçültülmüş çizimidir.", "Yolları, dağları ve suları gösterebilir.", "Yön bulmayı kolaylaştırır."),
]

POEM_THEMES = [
    ("sabah", "Pencereme usulca sabah değdi", "Kuşlar ince ince ışığa ördü sesini", "Yeni gün avuçlarıma gül gibi kondu"),
    ("yağmur", "Çatıya minik davullar vurdu yağmur", "Toprak serin bir koku saldı sokağa", "Su damlaları camda boncuk oldu"),
    ("kar", "Gökyüzü sessizce beyaz mektuplar yolladı", "Avlu pamuk bir örtüye büründü", "Ayak izlerimiz karın üstünde gülümsedi"),
    ("rüzgar", "Rüzgar saçlarımı oyunla karıştırdı", "Ağaçlar ince kollarını salladı", "Gökyüzü mavi bir uçurtma taşıdı"),
    ("güneş", "Güneş altın bir tabak gibi yükseldi", "Pencerem ışıkla doldu sabah sabah", "Gölgem bile benimle sevinçle yürüdü"),
    ("deniz", "Deniz kıyıya mavi sırlar fısıldadı", "Martılar beyaz harfler çizdi havaya", "Dalgalar kumlara serin türküler bıraktı"),
    ("orman", "Orman yeşil bir şal örttü omzuma", "Yapraklar gizli gizli alkış tuttu", "Toprak sessiz bir masal anlattı bana"),
    ("çiçek", "Bahçede çiçekler renk renk uyandı", "Arılar küçük şarkılar topladı", "Sabahın gülüşü taç yapraklara değdi"),
    ("ay", "Ay geceye gümüş bir kandil astı", "Penceremden içeri serin ışık süzüldü", "Uyku yolları sessizce uzadı"),
    ("yıldız", "Yıldızlar karanlık göğe tohum gibi serpildi", "Her biri uzaktan göz kırptı bana", "Gece siyah bir deftere ışık yazdı"),
    ("okul", "Okul kapısı sabaha umut açtı", "Sıralar düzenli bir selam verdi", "Defterlerimiz yeni kelimeler bekledi"),
    ("oyun", "Top bahçede neşeyle sekip durdu", "Çocuk sesleri göğe merdiven kurdu", "Akşam olunca gün cebimize gülümsedi"),
    ("kitap", "Kitabın sayfaları hafifçe deniz oldu", "Kelime tekneleri satırlarda yüzdü", "Her öykü beni başka kıyıya götürdü"),
    ("anne", "Annemin sesi sıcak bir battaniye gibi", "Yorgunluğumu usulca örttü", "Gülüşü mutfağa sabah serpti"),
    ("baba", "Babamın eli gölge gibi korur beni", "Adımları eve güven taşır", "Akşam olunca kapımız ışıkla dolar"),
    ("kardeş", "Kardeşim gülünce evde çanlar çalar", "Küçük adımları halıda kuş gibi gezer", "Oyuncaklar bile onunla sevinir"),
    ("bahar", "Bahar kapımıza yeşil ziller taktı", "Tomurcuklar sessizce açıldı", "Rüzgar taze kokularla saçımı okşadı"),
    ("sonbahar", "Sonbahar yaprakları bakır bir mektup yaptı", "Yollar sarı seslerle doldu", "Ağaçlar hafifleyip göğe baktı"),
    ("göl", "Göl aynasında bulutlar dinlendi", "Sazlar rüzgarla fısıldaştı", "Su üstüne düşen ışık titreyip durdu"),
    ("kuş", "Kuş sabahı minicik kanadında taşıdı", "Dalına bir şarkı astı", "Gökyüzü onunla daha geniş oldu"),
    ("kedi", "Kedi pencere önünde güneşi topladı", "Bıyıkları ışıkla parladı", "Uykusu minderde küçük bir ada kurdu"),
    ("köpek", "Köpek kapıda sevinci havlayarak karşıladı", "Kuyruğu rüzgar gibi sallandı", "Bahçe onunla oyuna dönüştü"),
    ("kelebek", "Kelebek renkli bir mektup gibi geçti", "Çiçekler kanadına gülüş verdi", "Bahçe bir an masala benzedi"),
    ("tren", "Tren uzaklara uzun bir türkü çekti", "Raylar parlak çizgiler gibi uzadı", "Pencerelerde yeni şehirler sallandı"),
    ("dağ", "Dağ göğe sabırlı bir omuz verdi", "Dorukta kar sessizce ışıldadı", "Rüzgar taşların arasından ninni söyledi"),
    ("nehir", "Nehir taşlara değe değe konuştu", "Su ince gümüş yollar çizdi", "Kıyıda söğüt dalları ona eğildi"),
    ("ekmek", "Fırından çıkan ekmek evi sıcacık yaptı", "Kokusu odalara sessizce yayıldı", "Sofra bir anda bayrama döndü"),
    ("süt", "Süt bardağımda ay ışığı gibi durdu", "Beyazlığı sabahı hatırlattı", "Bir yudumla içime güç doldu"),
    ("dostluk", "Dostluk görünmez bir köprü kurar", "Kalpten kalbe sessizce uzanır", "İki gülüşü aynı sevinçte buluşturur"),
    ("umut", "Umut cebimde saklı sıcak bir taş", "Üşüyen günlerde avcumu ısıtır", "Bana yarının kapısını aralar"),
    ("çalışmak", "Çalışmak damla damla göl doldurur", "Emek sessizce büyüyen bir tohumdur", "Sabreden eller sonunda çiçek açar"),
    ("paylaşmak", "Paylaşmak ekmeği çoğaltan gülüştür", "Bir el uzanınca dünya yumuşar", "Sevinç bölünmez, çoğalır"),
    ("sevgi", "Sevgi evin duvarına ışık çizer", "Kalpleri aynı sıcaklıkta buluşturur", "Bir sözle koca günü aydınlatır"),
    ("vatan", "Vatan toprağı ayak izimizi tanır", "Bayrağın sesi göğsümüzde çarpar", "Sevgiyle bakınca her taş parlar"),
    ("bayrak", "Bayrak gökte al bir masal açar", "Rüzgar onu gururla taşır", "Her dalgasında birlik duyarım"),
    ("yaşlı çınar", "Yaşlı çınar gölgede hikaye saklar", "Kabuğunda yılların çizgisi parlar", "Altında oturunca zaman yavaşlar"),
    ("çocukluk", "Çocukluk cebimde kalan renkli misket", "Koşarken dünya bana daha genişti", "Gülüşüm sokaklara güneş serperdi"),
    ("bisiklet", "Bisiklet yola mavi bir şarkı açtı", "Tekerler ritim ritim döndü", "Rüzgar yanımda arkadaş oldu"),
    ("uçurtma", "Uçurtma göğe ince bir mektup bıraktı", "İpi avcumda umut gibi titredi", "Bulutlar ona oyun arkadaşı oldu"),
    ("gece", "Gece sessiz bir örtü gibi indi", "Evlerin ışıkları yıldızla konuştu", "Rüyalar kapımızı yavaşça çaldı"),
    ("gülüş", "Bir gülüş odamı güne çevirdi", "Karanlık düşünce kapıdan çıktı", "İçimde küçük çanlar çalmaya başladı"),
    ("masal", "Masal geceye altın bir kapı açtı", "Kelime atları uzak diyarlara koştu", "Uyku bile dinlemek için bekledi"),
    ("sokak", "Sokak akşam üstü çocuk sesleriyle doldu", "Pencereler oyuna bakıp gülümsedi", "Taşlar bile neşeyi sakladı"),
    ("bahçe", "Bahçe toprağında yazın kokusu vardı", "Domates yaprakları güneşi tuttu", "Arılar dolaşırken zaman hafifledi"),
    ("çınar yaprağı", "Çınar yaprağı avcuma küçük bir yıldız düştü", "Damarları ince yollar gibi uzandı", "Sonbahar bana sessizce el salladı"),
    ("dere", "Dere taşlara gümüş tokalar taktı", "Su sesi öğlene serinlik kattı", "Kurbağalar kıyıda küçük davullar çaldı"),
    ("sınıf", "Sınıf sabah olunca ışıkla doldu", "Tahta yeni bilgiler bekledi", "Arkadaş sesleri günü canlandırdı"),
    ("kalem", "Kalem elimde ince bir yol açtı", "Kelimeler sıraya girip deftere kondu", "Düşünceler kağıtta kanatlandı"),
    ("tohum", "Tohum toprağa minicik bir sır verdi", "Yağmur onu sabırla dinledi", "Bir filiz sessizce güneşe yürüdü"),
    ("dondurma", "Dondurma dilimde serin bir bulut oldu", "Yaz sıcağı bir anda gülümseyip kaçtı", "Tatlı bir serinlik avucuma kondu"),
]


def _build_kelime_question(
    category: str,
    idx: int,
    level: str,
    word: str,
    sentence: str,
    correct: str,
    wrong1: str,
    wrong2: str,
    note: str,
) -> tuple:
    if category == "synonym":
        stem_a, stem_b = _pick_variant(SYNONYM_STEM_A, SYNONYM_STEM_B, idx)
        text = f'{stem_a}\n{sentence}\n{stem_b.format(word=word)}'
        exp_a, exp_b = _pick_variant(KELIME_EXPL_A, KELIME_EXPL_B, idx)
        explanation = (
            f'{exp_a} "{word}" ile "{correct}" eş anlamlıdır; {note}. {exp_b}'
        )
    elif category == "antonym":
        stem_a, stem_b = _pick_variant(ANTONYM_STEM_A, ANTONYM_STEM_B, idx)
        text = f'{stem_a}\n{sentence}\n{stem_b.format(word=word)}'
        exp_a, exp_b = _pick_variant(KELIME_EXPL_A, KELIME_EXPL_B, idx + 50)
        explanation = (
            f'{exp_a} "{word}" ile "{correct}" zıt anlamlıdır; {note}. {exp_b}'
        )
    else:
        stem_a, stem_b = _pick_variant(HOMONYM_STEM_A, HOMONYM_STEM_B, idx)
        text = f'{stem_a}\n{sentence}\n{stem_b.format(word=word)}'
        exp_a, exp_b = _pick_variant(KELIME_EXPL_A, KELIME_EXPL_B, idx + 100)
        explanation = (
            f'{exp_a} "{word}" sözcüğü bu cümlede "{correct}" anlamındadır; {note}. {exp_b}'
        )
    return (level, text, correct, wrong1, wrong2, explanation)


def build_kelime() -> list[tuple]:
    rows: list[tuple] = []
    for idx, item in enumerate(SYNONYM_DATA):
        if idx >= 34:
            text, correct, w1, w2, exp, prem = KELIME_PREMISE_ES[idx - 34]
            rows.append((LEVELS_ES[idx], text, correct, w1, w2, exp, prem))
        else:
            rows.append(_build_kelime_question("synonym", idx, LEVELS_ES[idx], *item))
    for idx, item in enumerate(ANTONYM_DATA):
        if idx >= 34:
            text, correct, w1, w2, exp, prem = KELIME_PREMISE_ZIT[idx - 34]
            rows.append((LEVELS_ZIT[idx], text, correct, w1, w2, exp, prem))
        else:
            rows.append(_build_kelime_question("antonym", idx, LEVELS_ZIT[idx], *item))
    for idx, item in enumerate(HOMONYM_DATA):
        if idx >= 34:
            text, correct, w1, w2, exp, prem = KELIME_PREMISE_SESTES[idx - 34]
            rows.append((LEVELS_SESTES[idx], text, correct, w1, w2, exp, prem))
        else:
            rows.append(_build_kelime_question("homonym", idx, LEVELS_SESTES[idx], *item))
    return _expect_unique(rows, "kelime")


def _story_passage(level: str, person: str, place: str, goal: str, twist: str, result: str) -> str:
    if level == "kolay":
        return (
            f"{person}, {place} {goal}. "
            f"{twist}. "
            f"Sonunda {result}."
        )
    if level == "orta":
        return (
            f"Dün {person}, {place} {goal}. "
            f"Bir ara {twist}. "
            f"Kısa bir uğraştan sonra {result}. "
            f"Eve dönerken yaptıklarını gülümseyerek anlattı."
        )
    return (
        f"Sabah erken saatte {person}, {place} {goal}. "
        f"İşi düşündüğü kadar kolay ilerlemedi; çünkü {twist}. "
        f"Yine de sabırlı davranıp çözüm aradı. "
        f"Bir süre sonra {result} ve içi rahatladı."
    )


def _info_passage(level: str, subject: str, fact1: str, fact2: str, fact3: str) -> str:
    if level == "kolay":
        return f"{fact1} {fact2} {fact3}"
    if level == "orta":
        return (
            f"{subject.capitalize()} hakkında bilgi veren bu parçada şunlar anlatılır: "
            f"{fact1} {fact2} {fact3}"
        )
    return (
        f"{subject.capitalize()} ile ilgili bu açıklamada önce temel özellik verilir: {fact1} "
        f"Ardından başka bir bilgi eklenir: {fact2} "
        f"Son olarak günlük yaşamla ilişkili bir yön belirtilir: {fact3}"
    )


def _poem_passage(level: str, theme: str, line1: str, line2: str, line3: str) -> str:
    if level == "kolay":
        return f"{line1}\n{line2}\n{line3}"
    if level == "orta":
        return f"{line1}\n{line2}\n{line3}\n{theme.capitalize()} içimde sessizce büyüdü"
    return f"{line1}\n{line2}\n{line3}\n{theme.capitalize()} bir düş gibi omzuma kondu"


def _metin_text(global_idx: int, passage: str) -> str:
    stem_a, stem_b = _pick_variant(METIN_STEM_A, METIN_STEM_B, global_idx)
    return f"{stem_a} {stem_b}\n\n{passage}"


def _story_explanation(global_idx: int, person: str, place: str, goal: str) -> str:
    exp_a, exp_b = _pick_variant(METIN_EXPL_A, METIN_EXPL_B, global_idx)
    return (
        f"{exp_a} Metinde {person} adlı kişinin {place} {goal} ve ardından gelişen olaylar "
        f"sırasıyla anlatılıyor; bu yapı hikaye edici metin özelliğidir. {exp_b}"
    )


def _info_explanation(global_idx: int, subject: str, fact1: str, fact2: str) -> str:
    exp_a, exp_b = _pick_variant(METIN_EXPL_A, METIN_EXPL_B, global_idx)
    return (
        f"{exp_a} Parça, {subject} hakkında bilgi vermek için yazılmıştır; "
        f'"{fact1}" ve "{fact2}" gibi öğretici cümleler kullanıldığı için bu metin '
        f"bilgilendirici metindir. {exp_b}"
    )


def _poem_explanation(global_idx: int, theme: str, line1: str) -> str:
    exp_a, exp_b = _pick_variant(METIN_EXPL_A, METIN_EXPL_B, global_idx)
    return (
        f"{exp_a} Metin dizeler halinde kurulmuş ve {theme} temasını "
        f'"{line1}" gibi imgeli bir söyleyişle vermiştir; bu yüzden şiirdir. {exp_b}'
    )


def build_metin() -> list[tuple]:
    rows: list[tuple] = []

    story_levels = ["kolay"] * 17 + ["orta"] * 17 + ["zor"] * 16
    info_levels = ["kolay"] * 17 + ["orta"] * 16 + ["zor"] * 17
    poem_levels = ["kolay"] * 16 + ["orta"] * 17 + ["zor"] * 17

    global_idx = 0
    for idx, (person, place, goal, twist, result) in enumerate(STORY_SCENARIOS):
        level = story_levels[idx]
        passage = _story_passage(level, person, place, goal, twist, result)
        text = _metin_text(global_idx, passage)
        explanation = _story_explanation(global_idx, person, place, goal)
        rows.append((level, text, TYPE_LABELS[0], TYPE_LABELS[1], TYPE_LABELS[2], explanation))
        global_idx += 1

    for idx, (subject, fact1, fact2, fact3) in enumerate(INFO_TOPICS):
        level = info_levels[idx]
        passage = _info_passage(level, subject, fact1, fact2, fact3)
        text = _metin_text(global_idx, passage)
        explanation = _info_explanation(global_idx, subject, fact1, fact2)
        rows.append((level, text, TYPE_LABELS[1], TYPE_LABELS[0], TYPE_LABELS[2], explanation))
        global_idx += 1

    for idx, (theme, line1, line2, line3) in enumerate(POEM_THEMES):
        level = poem_levels[idx]
        passage = _poem_passage(level, theme, line1, line2, line3)
        text = _metin_text(global_idx, passage)
        explanation = _poem_explanation(global_idx, theme, line1)
        rows.append((level, text, TYPE_LABELS[2], TYPE_LABELS[0], TYPE_LABELS[1], explanation))
        global_idx += 1

    return _expect_unique(rows, "metin")

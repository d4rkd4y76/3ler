# -*- coding: utf-8 -*-
"""Generate olay_s3_bank.py and cumle_s3_bank.py — 150 unique questions each."""
from __future__ import annotations
from collections import Counter
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent


def q(level, text, correct, w1, w2, exp, premise=None):
    row = (level, text, correct, w1, w2, exp)
    return row + (premise,) if premise else row


OLAY_KOLAY = [
    q("kolay", "Hikâyede olayları yaşayan kişiye ne ad verilir?", "Kahraman", "Yer", "Zaman", "Kahraman, hikâyede olayları yapan veya yaşayan kişidir."),
    q("kolay", "Olayın geçtiği yere ne ad verilir?", "Yer unsuru", "Kahraman", "Olay unsuru", "Yer unsuru, hikâyedeki olayların geçtiği mekândır."),
    q("kolay", "Olayın hangi gün veya saatte olduğunu anlatan unsura ne denir?", "Zaman unsuru", "Yer unsuru", "Kahraman", "Zaman unsuru, olayın ne zaman gerçekleştiğini söyler."),
    q("kolay", "Hikâyede yaşanan işe ne ad verilir?", "Olay unsuru", "Kahraman", "Başlık", "Olay unsuru, hikâyede anlatılan ve yaşanan iştir."),
    q("kolay", "Kim sorusu hangi hikâye unsurunu buldurur?", "Kahraman", "Yer", "Zaman", "Kim sorusu olayları yaşayan kişiyi, yani kahramanı buldurur."),
    q("kolay", "Nerede sorusu hangi hikâye unsurunu buldurur?", "Yer", "Kahraman", "Olay", "Nerede sorusu olayın geçtiği yeri gösterir."),
    q("kolay", "Ne zaman sorusu hangi hikâye unsurunu buldurur?", "Zaman", "Yer", "Kahraman", "Ne zaman sorusu olayın hangi gün veya saatte olduğunu verir."),
    q("kolay", "Ne oldu sorusu hangi hikâye unsurunu buldurur?", "Olay", "Kahraman", "Yer", "Ne oldu sorusu hikâyede yaşanan işi buldurur."),
    q("kolay", "Hikâyenin dört temel unsuru hangi seçenekte doğru verilmiştir?", "Kahraman, yer, zaman, olay", "Dize, kıta, mısra, şair", "Başlık, sayfa, harf, cümle", "Hikâyede kahraman, yer, zaman ve olay unsurları bulunur."),
    q("kolay", "Olayları oluş sırasına göre anlatmak neden önemlidir?", "Hikâyenin anlaşılması için", "Kitabın kalın olması için", "Resim çizmek için", "Doğru sırada anlatılan hikâye kolayca anlaşılır."),
    q("kolay", "Önce sözcüğü hangi olayı gösterir?", "İlk gelen olayı", "En son gelen olayı", "Hiç olmayan olayı", "Önce kelimesi diğerlerinden önce gerçekleşen ilk olayı belirtir."),
    q("kolay", "Sonra sözcüğü hangi olayı gösterir?", "Daha sonra gelen olayı", "En baştaki olayı", "Olmayan olayı", "Sonra kelimesi bir olaydan sonra gelen sonraki olayı gösterir."),
    q("kolay", "En baştaki olaya genellikle hangi sıra numarası verilir?", "1", "3", "5", "Olayların oluş sırasında ilk olana 1 numarası verilir."),
    q("kolay", "Sıradaki ikinci olaya hangi numara verilir?", "2", "1", "4", "İkinci olaya 2 numarası verilir; böylece sıra belli olur."),
    q("kolay", "Aşağıdakilerden hangisi hikâye unsuru değildir?", "Dize", "Kahraman", "Yer", "Dize şiirin satırıdır; kahraman ve yer hikâye unsurudur."),
    q("kolay", "Verilen cümlede kahramanı söyleyin: Elif sabah erkenden uyandı.", "Elif", "Sabah", "Uyandı", "Uyuyan kişi Elif'tir; kahraman Elif'tir."),
    q("kolay", "Parkta top oynadık. cümlesinde olayların geçtiği yer neresidir?", "Park", "Top", "Biz", "Parkta sözcüğü olayın parkta geçtiğini söyler."),
    q("kolay", "Akşam olunca sokak lambaları yandı. cümlesinde zaman unsuru hangisidir?", "Akşam", "Güneş", "Sokak lambaları", "Akşam sözcüğü olayın hangi vakitte olduğunu anlatır."),
    q("kolay", "Köpek havlayarak bahçeye koştu. cümlesinde yaşanan olay nedir?", "Köpeğin havlayarak koşması", "Köpek", "Bahçe", "Köpeğin havlayarak koşması hikâyede yaşanan olaydır."),
    q("kolay", "Mert annesine çay getirdi. cümlesinde olayları yapan kişi kimdir?", "Mert", "Anne", "Çay", "Çay getiren kişi Mert'tir; kahraman Mert'tir."),
    q("kolay", "Deniz kenarında kumdan kale yaptılar. cümlesinde yer unsuru hangisidir?", "Deniz kenarı", "Kum", "Kale", "Deniz kenarında ifadesi olayın geçtiği yeri gösterir."),
    q("kolay", "Öğle arasında kantinden simit aldı. cümlesinde olay ne zamandır?", "Öğle arası", "Kantin", "Simit", "Öğle arası olayın ne zaman olduğunu söyler."),
    q("kolay", "Yağmur başlayınca pencereyi kapattı. cümlesinde anlatılan iş hangisidir?", "Pencereyi kapatmak", "Yağmur", "Pencere", "Pencereyi kapatmak hikâyede yaşanan iştir."),
    q("kolay", "Sude kütüphaneden kitap seçti. cümlesinde hikâye kahramanı kimdir?", "Sude", "Kütüphane", "Kitap", "Kitap seçen kişi Sude'dur; kahraman Sude'dur."),
    q("kolay", "Pazar günü pikniğe gittik. cümlesinde zaman unsuru hangisidir?", "Pazar günü", "Piknik", "Gittik", "Pazar günü olayın ne zaman olduğunu verir."),
    q("kolay", "Can sabah parka gitti. cümlesinde kim hakkında anlatım yapılmıştır?", "Can", "Sabah", "Park", "Parka giden kişi Can'dır; kahraman Can'dır."),
    q("kolay", "Okulda sınav oldu. cümlesinde olay nerede geçmiştir?", "Okul", "Sınav", "Oldu", "Okulda sözcüğü olayın okulda geçtiğini belirtir."),
    q("kolay", "Gece yarısı fırtına çıktı. cümlesinde olay hangi saatte olmuştur?", "Gece yarısı", "Fırtına", "Çıktı", "Gece yarısı olayın hangi saatte olduğunu anlatır."),
    q("kolay", "Fatma pastayı fırına koydu. cümlesinde yaşanan olay nedir?", "Pastayı fırına koymak", "Fatma", "Pasta", "Fatma'nın pastayı fırına koyması anlatılan iştir."),
    q("kolay", "Bahçede çiçekler açtı. cümlesinde yer unsuru neresidir?", "Bahçe", "Çiçek", "Açmak", "Bahçede sözcüğü olayın bahçede geçtiğini gösterir."),
    q("kolay", "Önce dişlerini fırçaladı. Sonra okula gitti. İlk gerçekleşen olay hangisidir?", "Dişlerini fırçalamak", "Okula gitmek", "Uyumak", "Önce kelimesi diş fırçalamanın ilk geldiğini söyler."),
    q("kolay", "Önce ödevini yaptı. Sonra televizyon izledi. Sonra gerçekleşen olay hangisidir?", "Televizyon izlemek", "Ödev yapmak", "Uyumak", "Sonra kelimesi televizyon izlemenin ödevden sonra geldiğini gösterir."),
    q("kolay", "1) Kapı çaldı. 2) Misafiri karşıladı. Önce olan olay hangisidir?", "Kapı çaldı", "Misafiri karşıladı", "Yemek yedi", "1 numaralı olay ilk sıradadır; kapı çalmadan misafir karşılanamaz."),
    q("kolay", "1) Yemek pişti. 2) Sofrayı kurdu. Sonra olan olay hangisidir?", "Sofrayı kurmak", "Yemek pişirmek", "Televizyon izlemek", "2 numaralı olay ikinci sıradadır; önce yemek pişer, sonra sofra kurulur."),
    q("kolay", "Aşağıdakilerden hangisi yer unsuruna örnektir?", "Orman", "Ayşe", "Sabah", "Orman bir mekândır; Ayşe kahraman, sabah zaman unsurudur."),
    q("kolay", "Aşağıdakilerden hangisi zaman unsuruna örnektir?", "Cumartesi sabahı", "Mehmet", "Sınıf", "Cumartesi sabahı bir zaman bilgisidir; Mehmet kahraman, sınıf yer unsurudur."),
    q("kolay", "Aşağıdakilerden hangisi kahraman olabilir?", "Öğrenci", "Kütüphane", "Kış", "Öğrenci bir kişidir ve hikâyede kahraman olabilir."),
    q("kolay", "Aşağıdakilerden hangisi olaydır?", "Kitap okumak", "Deniz", "Salı", "Kitap okumak yapılan bir iştir; deniz yer, salı zaman olabilir."),
    q("kolay", "Hikâyede olaylar hangi sırayla anlatılmalıdır?", "Oluş sırasına göre", "Rastgele", "Tersten", "Olaylar gerçekte oldukları sırayla anlatılırsa hikâye anlaşılır."),
    q("kolay", "Olayları karışık anlatırsak ne olur?", "Hikâye anlaşılmaz", "Hikâye daha güzel olur", "Hikâye kısalır", "Sıra karışırsa dinleyen hangi olayın önce olduğunu bilemez."),
    q("kolay", "Sıra numarası vermek ne işe yarar?", "Olay sırasını göstermek", "Kitabı uzatmak", "Resim çizmek", "1, 2, 3 gibi numaralar olayların hangi sırayla olduğunu gösterir."),
    q("kolay", "Hikâyede en son olan olaya genellikle hangi numara verilir?", "En büyük numara", "1", "0", "Son olay listede en büyük sıra numarasını alır."),
    q("kolay", "En son kelimesi hangi olayı gösterir?", "Sondaki olayı", "İlk olayı", "Ortadaki olayı", "En son sözcüğü olayların en sonuncusunu belirtir."),
    q("kolay", "Ardından kelimesi ne anlama gelir?", "Hemen sonra", "Çok önce", "Hiç olmaz", "Ardından bir olayın hemen ardından gelen olayı gösterir."),
    q("kolay", "Daha önce kelimesi ne anlama gelir?", "Daha önceki bir zamanda", "Şimdi", "Hiçbir zaman", "Daha önce geçmişte olan bir olayı anlatır."),
    q("kolay", "Hikâye unsurlarından biri olan kahraman neyi anlatır?", "Olayları yaşayan kişiyi", "Olayın geçtiği yeri", "Olayın saatini", "Kahraman hikâyede olayları yapan veya yaşayan kişidir."),
    q("kolay", "Hikâye unsurlarından biri olan yer neyi anlatır?", "Olayın geçtiği mekânı", "Olayı yapan kişiyi", "Olayın saatini", "Yer unsuru olayın hangi mekânda geçtiğini söyler."),
    q("kolay", "Hikâye unsurlarından biri olan zaman neyi anlatır?", "Olayın geçtiği gün veya saati", "Olayı yapan kişiyi", "Olayın adını", "Zaman unsuru olayın ne zaman olduğunu bildirir."),
    q("kolay", "Hikâye unsurlarından biri olan olay neyi anlatır?", "Yaşanan işi veya durumu", "Kitabın kapağını", "Yazarın adını", "Olay unsuru hikâyede yaşanan işleri anlatır."),
    q("kolay", "Olay sırasını doğru vermek dinleyiciye ne sağlar?", "Hikâyeyi kolay anlamasını", "Kitabı uzatmasını", "Resim çizmesini", "Doğru sıra sayesinde olaylar birbirine bağlanır ve hikâye anlaşılır."),
]

OLAY_ORTA = [
    q("orta", "Yukarıdaki metinde olayları yaşayan kişi kimdir?", "Defne", "Okul", "Sabah erkenden", "Defne hikâyede olayları yaşayan kişidir; kahraman Defne'dir.", "Defne sabah erkenden kalktı. Kahvaltısını yaptıktan sonra okula gitti."),
    q("orta", "Yukarıdaki metinde olay nerede geçmektedir?", "Okul", "Defne", "Kahvaltı", "Defne okula gitmiştir; olayın geçtiği yer okuldur.", "Defne sabah erkenden kalktı. Kahvaltısını yaptıktan sonra okula gitti."),
    q("orta", "Yukarıdaki metinde Defne'nin günü hangi vakitte başlamıştır?", "Sabah erkenden", "Defne", "Okul", "Sabah erkenden ifadesi olayın ne zaman başladığını anlatır.", "Defne sabah erkenden kalktı. Kahvaltısını yaptıktan sonra okula gitti."),
    q("orta", "Yukarıdaki metinde anlatılan olaylardan biri hangisidir?", "Okula gitmek", "Defne", "Sabah", "Kahvaltıdan sonra okula gitmek hikâyede yaşanan olaydır.", "Defne sabah erkenden kalktı. Kahvaltısını yaptıktan sonra okula gitti."),
    q("orta", "Yukarıdaki metinde kahvaltı ile okula gitme arasındaki ilişki nasıldır?", "Önce kahvaltı, sonra okula gitme", "Önce okula gitme, sonra kahvaltı", "İkisi aynı anda", "Önce kahvaltı yapılmış, sonra okula gidilmiştir.", "Defne sabah erkenden kalktı. Kahvaltısını yaptıktan sonra okula gitti."),
    q("orta", "Yukarıdaki metinde hikâyenin kahramanı kimdir?", "Ailemiz / biz", "Park", "Cumartesi", "Hikâyede olayları yaşayan kişiler ailemizdir.", "Cumartesi günü ailemizle parka gittik. Orada bisiklete bindik ve dondurma yedik."),
    q("orta", "Yukarıdaki metinde bisiklete binme olayı hangi mekânda geçmiştir?", "Park", "Bisiklet", "Dondurma", "Park olayın geçtiği yerdir.", "Cumartesi günü ailemizle parka gittik. Orada bisiklete bindik ve dondurma yedik."),
    q("orta", "Yukarıdaki metinde olay hangi gün geçmiştir?", "Cumartesi günü", "Pazar", "Pazartesi", "Cumartesi günü zaman unsurudur.", "Cumartesi günü ailemizle parka gittik. Orada bisiklete bindik ve dondurma yedik."),
    q("orta", "Yukarıdaki metinde bisiklete binmek hangi unsurdur?", "Olay", "Kahraman", "Zaman", "Bisiklete binmek hikâyede yaşanan olaydır.", "Cumartesi günü ailemizle parka gittik. Orada bisiklete bindik ve dondurma yedik."),
    q("orta", "Yukarıdaki metinde parka gitmeden önce ne belirtilmiştir?", "Cumartesi günü", "Dondurma yemek", "Uyumak", "Metin cumartesi günü parka gidildiğini söyler.", "Cumartesi günü ailemizle parka gittik. Orada bisiklete bindik ve dondurma yedik."),
    q("orta", "Yukarıdaki metinde masalı anlatan kişi kimdir?", "Dedem", "Masal", "Göz", "Masalı anlatan kişi dedemdir.", "Kış akşamı dedem bize masal anlattı. Dinlerken gözlerimiz yavaş yavaş kapandı."),
    q("orta", "Yukarıdaki metinde olay hangi mevsim akşamında geçmiştir?", "Kış akşamı", "Yaz sabahı", "İlkbahar öğleden sonra", "Kış akşamı zaman unsurudur.", "Kış akşamı dedem bize masal anlattı. Dinlerken gözlerimiz yavaş yavaş kapandı."),
    q("orta", "Yukarıdaki metinde yaşanan olay hangisidir?", "Masal anlatmak", "Dedem", "Kış", "Masal anlatmak hikâyede yaşanan olaydır.", "Kış akşamı dedem bize masal anlattı. Dinlerken gözlerimiz yavaş yavaş kapandı."),
    q("orta", "Yukarıdaki metinde gözlerin kapanması neyi gösterir?", "Masal dinlerken uykunun gelmesi", "Kahramanın adını", "Yer unsurunu", "Gözlerin kapanması masal dinlerken uykunun geldiğini anlatır.", "Kış akşamı dedem bize masal anlattı. Dinlerken gözlerimiz yavaş yavaş kapandı."),
    q("orta", "Yukarıdaki metinde masal anlatma olayı nerede geçmiştir?", "Ev", "Dedem", "Masal", "Masal anlatma olayı evde geçmiştir.", "Kış akşamı dedem bize masal anlattı. Dinlerken gözlerimiz yavaş yavaş kapandı."),
    q("orta", "Önce yağmur yağdı. Sonra gökkuşağı belirdi. İlk olay hangisidir?", "Yağmur yağması", "Gökkuşağı belirmesi", "Güneş batması", "Önce yağmur yağmış; gökkuşağı ondan sonra belirmiştir."),
    q("orta", "Önce fırını ısıttı. Sonra ekmeği pişirdi. Sonraki olay hangisidir?", "Ekmeği pişirmek", "Fırını ısıtmak", "Marketten ekmek almak", "Fırın ısındıktan sonra ekmek pişirilmiştir."),
    q("orta", "1) Çantasını hazırladı. 2) Otobüse bindi. 3) Kamp alanına vardı. Üçüncü olay hangisidir?", "Kamp alanına varmak", "Çanta hazırlamak", "Otobüse binmek", "3 numaralı olay en son gerçekleşen olaydır."),
    q("orta", "1) Tohum ekti. 2) Suladı. 3) Filiz çıktı. İkinci olay hangisidir?", "Sulamak", "Tohum ekmek", "Filiz çıkması", "2 numaralı olay sulamaktır."),
    q("orta", "Önce kitabı okudu. Daha sonra özet çıkardı. Özet çıkarmadan önce ne yapmıştır?", "Kitabı okumuş", "Televizyon izlemiş", "Uyumuş", "Özet çıkarmadan önce kitabı okumuştur."),
    q("orta", "Önce pazar alışverişi yaptı. Ardından yemek pişirdi. Yemek pişirmeden önce ne olmuştur?", "Alışveriş yapılmış", "Misafir gelmiş", "Telefon çalmış", "Ardından kelimesi alışverişten sonra yemek pişirildiğini gösterir."),
    q("orta", "Hikâyede yer unsuru aşağıdakilerden hangisi olabilir?", "Market", "Ali", "Dün", "Market bir mekândır; Ali kahraman, dün zaman olabilir."),
    q("orta", "Hikâyede zaman unsuru aşağıdakilerden hangisi olabilir?", "Gece yarısı", "Park", "Kedi", "Gece yarısı bir zaman bilgisidir."),
    q("orta", "Hikâyede olay unsuru aşağıdakilerden hangisi olabilir?", "Resim yapmak", "Sınıf", "Perşembe", "Resim yapmak bir iştir; sınıf yer, perşembe zaman olabilir."),
    q("orta", "Olay sırasını bozarsak dinleyici neyi anlayamaz?", "Hangi olayın önce olduğunu", "Kahramanın adını", "Kitabın rengini", "Sıra karışırsa önce-sonra ilişkisi kaybolur."),
    q("orta", "Yukarıdaki metinde en son gerçekleşen olay hangisidir?", "Okula yürümek", "Ayakkabı giymek", "Ceket almak", "En son okula yürümüştür; bu olay listede en sondadır.", "Önce ayakkabılarını giydi. Sonra ceketini aldı. En son okula yürüdü."),
    q("orta", "Yukarıdaki metinde sabah rutininin doğru sırası hangisidir?", "Kalk - kahvaltı et - okula git", "Okula git - kalk - kahvaltı et", "Kahvaltı et - okula git - kalk", "Önce uyanılır, sonra kahvaltı edilir, en son okula gidilir.", "Sabah kalktı. Kahvaltı etti. Okula gitti."),
    q("orta", "Yukarıdaki numaralı olayların oluş sırası hangisidir?", "II - III - I", "I - II - III", "III - I - II", "Önce evden çıkılır, bisiklet sürülür, en son parka varılır.", "I. Parka vardı.\nII. Evden çıktı.\nIII. Bisikletini sürdü."),
    q("orta", "Yukarıdaki sofra olaylarından hangisi en başta yapılmalıdır?", "Yemeği pişirmek", "Masayı kurmak", "Sofraya oturmak", "Yemek pişmeden masa kurulamaz; önce yemek pişirilmelidir.", "I. Masayı kurdu.\nII. Yemeği pişirdi.\nIII. Sofraya oturdu."),
    q("orta", "Yukarıdaki olaylardan hangisi mantıklı sırada sona gelir?", "Dinlenmek", "Ödev yapmak", "Ders çalışmak", "Önce ders çalışılır, ödev yapılır, en son dinlenilir.", "I. Ödevini yaptı.\nII. Ders çalıştı.\nIII. Dinlendi."),
    q("orta", "Yukarıdaki metinde proje sunumu hangi gün olmuştur?", "Pazartesi", "Salı", "Çarşamba", "Proje sunumu pazartesi günü gerçekleşmiştir.", "Pazartesi sınıfta proje sundu. Salı günü öğretmeni övdü."),
    q("orta", "Yukarıdaki metinde denize girme olayı hangi mevsimde geçmiştir?", "Yaz", "Kış", "Sonbahar", "Yaz tatili ifadesi olayın yaz mevsiminde olduğunu gösterir.", "Yaz tatilinde kuzenimle denize girdik. Akşamüstü kumsalda oyun oynadık."),
    q("orta", "Yukarıdaki metinde kedinin koşması hangi olaydan önce gerçekleşmiştir?", "Mama verilmesi", "Uyuması", "Oyun oynaması", "Önce kedi koşmuş, sonra mama verilmiştir.", "Kedim miyavlayarak mutfağa koştu. Annem ona mama verdi."),
    q("orta", "Yukarıdaki metinde yola çıkmadan önce ne yapılmıştır?", "Haritayı incelemiş", "Dağa tırmanmış", "Fotoğraf çekmiş", "Yola çıkmadan önce harita incelenmiştir.", "Önce haritayı inceledi. Sonra yola çıktı. En son dağın tepesine ulaştı."),
    q("orta", "Yukarıdaki metinde eve dönme olayı ne zaman gerçekleşmiştir?", "Film bitince", "Film başlamadan", "Sabah erken", "Film bitince ifadesi eve dönmenin ne zaman olduğunu söyler.", "Cuma akşamı ailecek sinemaya gittik. Film bitince eve döndük."),
    q("orta", "Önce kar yağdı. Ardından çocuklar kardan adam yaptı. Kardan adam yapma hangi olaydan sonra gerçekleşmiştir?", "Kar yağması", "Kar erimesi", "Güneş batması", "Kar yağdıktan sonra çocuklar kardan adam yapmıştır."),
    q("orta", "Önce sepeti hazırladık. Sonra ormana yürüdük. Ormana yürümeden önce hangi iş yapılmıştır?", "Sepet hazırlanmış", "Piknik bitmiş", "Uyku uyumuş", "Ormana gitmeden önce sepet hazırlanmıştır."),
    q("orta", "1) Okul zili çaldı. 2) Öğrenciler sınıfa girdi. 3) Ders başladı. Ders başlama olayı kaçıncı sıradadır?", "3", "1", "2", "Ders başlama üçüncü olaydır."),
    q("orta", "1) Tohumları toprağa koydu. 2) Bahçeyi suladı. 3) Sebzeleri topladı. Sebze toplama olayı kaçıncı sıradadır?", "3", "1", "2", "Sebze toplama en son gerçekleşen olaydır."),
    q("orta", "Önce elini kaldırdı. Sonra soruyu cevapladı. Soruyu cevaplamadan önce ne yapmıştır?", "Elini kaldırmış", "Tahtaya yazmış", "Dışarı çıkmış", "Soruyu cevaplamadan önce elini kaldırmıştır."),
    q("orta", "Önce marşı söyledik. Sonra bayrağı göndere çektik. Bayrağı çekme olayı hangi olaydan sonra gelmiştir?", "Marş söyleme", "Teneffüs", "Yemek yeme", "Marş söylendikten sonra bayrak göndere çekilmiştir."),
    q("orta", "Hikâyede olayları anlatırken hangi kelime sonraki olayı gösterir?", "Sonra", "Önce", "Her zaman", "Sonra kelimesi bir olaydan sonra gelen olayı gösterir."),
    q("orta", "Hikâyede olayları anlatırken hangi kelime ilk olayı gösterir?", "Önce", "Sonra", "En son", "Önce kelimesi ilk gerçekleşen olayı gösterir."),
    q("orta", "Aşağıdakilerden hangisi olay sırasını göstermek için kullanılır?", "1, 2, 3 numaraları", "Renkler", "Harfler", "Numaralar olayların hangi sırayla olduğunu gösterir."),
    q("orta", "Hikâyede olayları karışık sırada anlatmak neden yanlıştır?", "Dinleyici kafası karışır", "Kitap kısalır", "Resim azalır", "Karışık sıra hikâyenin anlaşılmasını zorlaştırır."),
    q("orta", "Önce montunu giydi. Sonra dışarı çıktı. Dışarı çıkmadan önce ne yapmıştır?", "Montunu giymiş", "Televizyon izlemiş", "Yemek yemiş", "Dışarı çıkmadan önce mont giyilmiştir."),
    q("orta", "Önce öğretmen tahtaya yazdı. Sonra öğrenciler defterlerine geçti. Öğrenciler ne zaman defterlerine geçmiştir?", "Öğretmen yazdıktan sonra", "Öğretmen yazmadan önce", "Dersten önce", "Öğretmen yazdıktan sonra öğrenciler defterlerine geçmiştir."),
    q("orta", "1) Mektubu yazdı. 2) Zarfına koydu. 3) Postaya verdi. Mektubu zarfına koyma olayı kaçıncı sıradadır?", "2", "1", "3", "Zarfına koyma ikinci olaydır."),
    q("orta", "1) Mektubu yazdı. 2) Zarfına koydu. 3) Postaya verdi. Postaya verme olayı kaçıncı sıradadır?", "3", "1", "2", "Postaya verme en son gerçekleşen olaydır."),
    q("orta", "Hikâye yazarken olayları sıralamak hangi unsurla ilgilidir?", "Olayların oluş sırası", "Kitabın rengi", "Yazarın yaşı", "Olayların oluş sırası hikâyenin anlaşılması için önemlidir."),
]

OLAY_ZOR = [
    q("zor", "Yukarıdaki olayların mantıklı sırası hangisidir?", "II - I - III", "I - II - III", "III - II - I", "Önce ders çalışılır, ödev bitirilir, en son dinlenilir.", "I. Defne ödevini bitirdi.\nII. Defne ders çalışmaya başladı.\nIII. Defne dinlenmek için müziği açtı."),
    q("zor", "Yukarıdaki alışveriş olaylarının doğru sırası hangisidir?", "III - II - I", "I - III - II", "II - I - III", "Önce evden çıkılır, marketten ekmek alınır, bisiklet park edilir.", "I. Bisikletini park etti.\nII. Marketten ekmek aldı.\nIII. Evden çıktı."),
    q("zor", "Yukarıdaki metinde anlatım bozukluğu hangi sebepten kaynaklanır?", "Olaylar karışık sırada", "Metin çok kısa", "Kahraman yok", "Yemekte önce masaya oturulur, çorba içilir, en son eller yıkanır; verilen sıra mantıklı değildir.", "I. Masaya oturdu.\nII. Ellerini yıkadı.\nIII. Çorbayı içti."),
    q("zor", "Yukarıdaki yemekte olayların doğru sırası hangisidir?", "Masaya otur - çorba iç - el yıka", "El yıka - çorba iç - masaya otur", "Çorba iç - masaya otur - el yıka", "Yemekte önce masaya oturulur, çorba içilir, en son eller yıkanır.", "I. Masaya oturdu.\nII. Ellerini yıkadı.\nIII. Çorbayı içti."),
    q("zor", "Yukarıdaki sorulardan hangisi olay unsurunu buldurur?", "III", "I", "II", "III. soru ne oldu diye sorar; bu olay unsurunu buldurur.", "I. Kim?\nII. Nerede?\nIII. Ne oldu?"),
    q("zor", "Yukarıdaki sorulardan hangisi yer unsurunu buldurur?", "II", "I", "III", "II. soru nerede diye sorar; yer unsurunu buldurur.", "I. Kim?\nII. Nerede?\nIII. Ne oldu?"),
    q("zor", "Yukarıdaki ifadelerden hangisi hikâye unsuru değildir?", "Dize", "Kahraman", "Zaman", "Dize şiirin satırıdır; kahraman ve zaman hikâye unsurudur.", "I. Kahraman\nII. Dize\nIII. Zaman"),
    q("zor", "Yukarıdaki ifadelerden hangileri hikâye unsurudur?", "Hepsi", "Yalnız I", "I ve II", "Kahraman, yer ve olay hikâyenin temel unsurlarındandır.", "I. Kahraman\nII. Yer\nIII. Olay"),
    q("zor", "Yukarıdaki metinde kahraman kimdir?", "Berk", "Köy pazarı", "Pazar sabahı", "Berk olayları yaşayan kişidir.", "Pazar sabahı Berk köy pazarına gitti. Sebze aldı, sonra dedesiyle çay içti. Akşam eve döndü."),
    q("zor", "Yukarıdaki metinde Berk nereye gitmiştir?", "Köy pazarı", "Berk", "Dedesi", "Köy pazarı olayın geçtiği yerdir.", "Pazar sabahı Berk köy pazarına gitti. Sebze aldı, sonra dedesiyle çay içti. Akşam eve döndü."),
    q("zor", "Yukarıdaki metinde Berk'in gezintisi hangi gün başlamıştır?", "Pazar sabahı", "Akşam", "Salı", "Pazar sabahı zaman unsurudur.", "Pazar sabahı Berk köy pazarına gitti. Sebze aldı, sonra dedesiyle çay içti. Akşam eve döndü."),
    q("zor", "Yukarıdaki metinde sebze alma olayı hangi olaydan önce gerçekleşmiştir?", "Dedesiyle çay içme", "Eve dönme", "Uyuma", "Önce sebze alınmış, sonra dedesiyle çay içilmiştir.", "Pazar sabahı Berk köy pazarına gitti. Sebze aldı, sonra dedesiyle çay içti. Akşam eve döndü."),
    q("zor", "Yukarıdaki metinde deney yapan kişiler kimdir?", "Biz / sınıf", "Öğretmen", "Salı", "Deneyi yapan kişiler biziz.", "Salı günü sınıfta deney yaptık. Önce malzemeleri hazırladık. Sonra öğretmenimiz bize yardım etti."),
    q("zor", "Yukarıdaki metinde olay nerede geçmiştir?", "Sınıf", "Deney", "Salı", "Sınıf olayın geçtiği yerdir.", "Salı günü sınıfta deney yaptık. Önce malzemeleri hazırladık. Sonra öğretmenimiz bize yardım etti."),
    q("zor", "Yukarıdaki metinde malzeme hazırlama olayı hangi olaydan önce gelmiştir?", "Öğretmenin yardım etmesi", "Deney yapılması", "Teneffüs", "Önce malzemeler hazırlanmış, sonra öğretmen yardım etmiştir.", "Salı günü sınıfta deney yaptık. Önce malzemeleri hazırladık. Sonra öğretmenimiz bize yardım etti."),
    q("zor", "Yukarıdaki metinde üç olayın sırası doğru mudur?", "Evet, sıra doğrudur", "Hayır, tam tersi olmalı", "Sıra önemsizdir", "Önce yağmur, sonra ıslanma, en son eve koşma mantıklı bir sıradır.", "Önce yağmur yağdı. Sonra sokaklar ıslandı. En son çocuklar evlere koştu."),
    q("zor", "Yukarıdaki metinde hangi olay yanlış sırada verilmiştir?", "Diş fırçalamadan önce uyumak", "Yatağa yatmak", "Diş fırçalamak", "Uyumadan önce dişler fırçalanmalıdır; sıra mantıklı değildir.", "Önce uykuya daldı. Sonra dişlerini fırçaladı. En son yatağa yattı."),
    q("zor", "Yukarıdaki olayların oluş sırası hangisidir?", "II - I - III", "I - II - III", "III - I - II", "Önce zil çalar, öğrenciler sınıfa girer, ders başlar.", "I. Okul zili çaldı.\nII. Öğrenciler sınıfa girdi.\nIII. Ders başladı."),
    q("zor", "Yukarıdaki bahçe olaylarının mantıklı sırası hangisidir?", "I - II - III", "III - I - II", "II - III - I", "Önce tohum ekilir, sulama yapılır, en son sebze toplanır.", "I. Tohumları toprağa koydu.\nII. Bahçeyi suladı.\nIII. Sebzeleri topladı."),
    q("zor", "Yukarıdaki sorulardan hangisi kahramanı buldurur?", "II", "I", "III", "Kim sorusu kahramanı buldurur.", "I. Ne zaman?\nII. Kim?\nIII. Nerede?"),
    q("zor", "Yukarıdaki sorulardan hangisi zaman unsurunu buldurur?", "I", "II", "III", "Ne zaman sorusu zaman unsurunu buldurur.", "I. Ne zaman?\nII. Kim?\nIII. Nerede?"),
    q("zor", "Yukarıdaki kitap okuma olaylarının doğru sırası hangisidir?", "II - I - III", "I - II - III", "III - II - I", "Önce son sayfa okunur, kitap kapatılır, rafa konur.", "I. Kitabı kapattı.\nII. Son sayfayı okudu.\nIII. Kitabı rafa koydu."),
    q("zor", "Yukarıdaki metinde kardan adam yapma olayı hangi olaydan sonra gerçekleşmiştir?", "Kar yağması", "Kar erimesi", "Güneş batması", "Kar yağınca çocuklar kardan adam yapmıştır.", "Önce kar yağdı. Ardından çocuklar kardan adam yaptı. En son güneş çıkınca kar eridi."),
    q("zor", "Yukarıdaki metinde ormana yürümeden önce ne yapılmıştır?", "Sepet hazırlanmış", "Piknik bitmiş", "Uyku uyumuş", "Ormana yürümeden önce sepet hazırlanmıştır.", "Cumartesi sabahı pikniğe gittik. Önce sepeti hazırladık. Sonra ormana yürüdük."),
    q("zor", "Yukarıdaki yemek olaylarından hangisi ilk sırada olmalıdır?", "II", "I", "III", "Önce yemek yenir, sonra tabak toplanır, en son el yıkanır.", "I. Ellerini yıkadı.\nII. Yemeğini yedi.\nIII. Tabaklarını topladı."),
    q("zor", "Yukarıdaki yemek olaylarının doğru sırası hangisidir?", "II - III - I", "I - II - III", "III - I - II", "Önce yemek yenir, tabak toplanır, en son eller yıkanır.", "I. Ellerini yıkadı.\nII. Yemeğini yedi.\nIII. Tabaklarını topladı."),
    q("zor", "Yukarıdaki metinde olayların sırası neden yanlıştır?", "Yüzmeden önce havlu alınmış", "Metin çok uzun", "Kahraman yok", "Yüzmeden önce havlu alınır; verilen sırada havlu alma yüzmeden sonra gelmiştir.", "Önce denize girdi. Sonra havluyu aldı. En son güneşlendi."),
    q("zor", "Yukarıdaki plaj olaylarının doğru sırası hangisidir?", "Havlu al - denize gir - güneşlen", "Denize gir - havlu al - güneşlen", "Güneşlen - denize gir - havlu al", "Önce havlu alınır, denize girilir, sonra güneşlenilir.", "Önce denize girdi. Sonra havluyu aldı. En son güneşlendi."),
    q("zor", "Yukarıdaki ifadelerden hangisi yer unsuru değildir?", "Yıldızlar", "Kamp alanı", "Orman", "Yıldızlar gök cismidir; kamp alanı ve orman yer unsuru olabilir.", "I. Orman\nII. Kamp alanı\nIII. Yıldızlar"),
    q("zor", "Yukarıdaki ifadelerden hangisi zaman unsuru değildir?", "Kütüphane", "Gece yarısı", "Pazartesi", "Kütüphane bir mekândır; gece yarısı ve pazartesi zaman unsuru olabilir.", "I. Gece yarısı\nII. Pazartesi\nIII. Kütüphane"),
    q("zor", "Yukarıdaki ifadelerden hangisi olay unsuru değildir?", "Salı günü", "Koşmak", "Yüzmek", "Salı günü zaman unsurudur; koşmak ve yüzmek olaydır.", "I. Koşmak\nII. Salı günü\nIII. Yüzmek"),
    q("zor", "Yukarıdaki metinde ilk olay hangisidir?", "Okula gitmek", "Ödev yapmak", "Televizyon izlemek", "Metinde önce okula gidilmiş, sonra ödev yapılmıştır.", "Önce okula gitti. Sonra ödevini yaptı. En son televizyon izledi."),
    q("zor", "Yukarıdaki metinde en son olay hangisidir?", "Televizyon izlemek", "Okula gitmek", "Ödev yapmak", "En son televizyon izlenmiştir.", "Önce okula gitti. Sonra ödevini yaptı. En son televizyon izledi."),
    q("zor", "Yukarıdaki olaylardan hangisi mantıksız sırada verilmiştir?", "I", "II", "III", "I. olayda önce yemek yenmeli, sonra tabak toplanmalıdır; ters verilmiştir.", "I. Tabaklarını topladı.\nII. Yemeğini yedi.\nIII. Ellerini yıkadı."),
    q("zor", "Yukarıdaki tabak toplama olaylarının doğru sırası hangisidir?", "II - I - III", "I - II - III", "III - II - I", "Önce yemek yenir, sonra tabak toplanır, en son eller yıkanır.", "I. Tabaklarını topladı.\nII. Yemeğini yedi.\nIII. Ellerini yıkadı."),
    q("zor", "Yukarıdaki kütüphane ziyareti hangi mekânda geçmiştir?", "Kütüphane", "Kitap", "Cuma", "Kütüphane olayın geçtiği yerdir.", "Cuma öğleden sonra kütüphanede sessizce kitap okudu. Bitince kitabı rafa koydu."),
    q("zor", "Yukarıdaki metinde olay ne zaman geçmiştir?", "Cuma öğleden sonra", "Sabah", "Gece", "Cuma öğleden sonra zaman unsurudur.", "Cuma öğleden sonra kütüphanede sessizce kitap okudu. Bitince kitabı rafa koydu."),
    q("zor", "Yukarıdaki metinde kitabı rafa koyma olayı hangi olaydan sonra gelmiştir?", "Kitap okuma", "Uyuma", "Yemek yeme", "Önce kitap okunmuş, sonra rafa konmuştur.", "Cuma öğleden sonra kütüphanede sessizce kitap okudu. Bitince kitabı rafa koydu."),
    q("zor", "Yukarıdaki bahçe ekim olaylarının doğru sırası hangisidir?", "I - II - III", "III - I - II", "II - III - I", "Önce tohum ekilir, filiz çıkar, meyve toplanır.", "I. Tohum ekti.\nII. Filiz çıktı.\nIII. Meyve topladı."),
    q("zor", "Yukarıdaki olaylardan hangisi en son gerçekleşir?", "III", "I", "II", "Meyve toplama en son gerçekleşen olaydır.", "I. Tohum ekti.\nII. Filiz çıktı.\nIII. Meyve topladı."),
    q("zor", "Yukarıdaki sorulardan hangisi ne oldu sorusuna karşılık gelir?", "III", "I", "II", "Ne oldu sorusu olay unsurunu buldurur.", "I. Kim?\nII. Ne zaman?\nIII. Ne oldu?"),
    q("zor", "Yukarıdaki sorulardan hangisi nerede sorusuna karşılık gelir?", "III", "I", "II", "Nerede sorusu yer unsurunu buldurur.", "I. Kim?\nII. Ne zaman?\nIII. Nerede?"),
    q("zor", "Yukarıdaki metinde anlatım neden anlaşılmaz?", "Olaylar mantıksız sırada", "Metin çok kısa", "Kahraman çok", "Önce uyumalı, sonra yatak toplanmalı; verilen sıra mantıklı değildir.", "Önce yatağa yattı. Sonra odasını topladı. En son uyudu."),
    q("zor", "Yukarıdaki metinde doğru sıra hangisidir?", "Odayı topla - uyu - yatağa yat", "Yatağa yat - odayı topla - uyu", "Uyu - odayı topla - yatağa yat", "Önce oda toplanır, uyuma ve yatağa yatma en son gelir.", "Önce yatağa yattı. Sonra odasını topladı. En son uyudu."),
    q("zor", "Hikâyede olayları sıralarken en önemli kural hangisidir?", "Oluş sırasına uymak", "Rastgele anlatmak", "Tersten anlatmak", "Olaylar gerçekte oldukları sırayla anlatılmalıdır."),
    q("zor", "Hikâyede kahraman, yer, zaman ve olay unsurları bir arada ne sağlar?", "Hikâyenin anlaşılmasını", "Kitabın incelmesini", "Resmin çizilmesini", "Dört unsur bir arada hikâyenin tam anlaşılmasını sağlar."),
    q("zor", "Olay sırasını numaralandırmak hangi durumda en çok işe yarar?", "Birden fazla olay anlatılırken", "Tek cümle yazılırken", "Başlık seçilirken", "Birden fazla olay varken numaralar sırayı netleştirir."),
    q("zor", "Hikâyede önce-sonra ilişkisi bozulursa ne olur?", "Dinleyici kafası karışır", "Hikâye kısalır", "Kahraman değişir", "Sıra bozulunca olaylar birbirine karışır ve hikâye anlaşılmaz."),
    q("zor", "Aşağıdakilerden hangisi hikâye unsurlarını ve sıralamayı doğru açıklar?", "Kahraman kişidir, olaylar oluş sırasına göre anlatılır", "Yer kişi adıdır, sıra önemsizdir", "Zaman olaydır, tersten anlatılır", "Kahraman kişidir; olaylar oluş sırasına göre anlatılmalıdır."),
    q("zor", "Aşağıdakilerden hangisi olay sırası konusunda yanlıştır?", "Olayları rastgele anlatmak daha iyidir", "Önce ve sonra kelimeleri sırayı gösterir", "Numaralar olay sırasını belirtir", "Olayları rastgele anlatmak hikâyeyi anlaşılmaz yapar."),
]

CUMLE_KOLAY = [
    q("kolay", "Yağmur yağdığı için sokaklar ıslak oldu. Bu cümlede sonuç hangisidir?", "Sokaklar ıslak oldu", "Yağmur yağdığı için", "Yağmur yağdı", "Yağmur yağması sebeptir; sokakların ıslanması bu sebebin sonucudur."),
    q("kolay", "Çok çalıştığım için sınavdan yüksek not aldım. Bu cümlede sebep hangisidir?", "Çok çalışmam", "Yüksek not almam", "Sınav", "Çalışmak bir nedendir; yüksek not almak bu nedenin sonucudur."),
    q("kolay", "Hasta olduğu için okula gelemedi. Bu cümlede sonuç hangisidir?", "Okula gelememesi", "Hasta olması", "Okul", "Hasta olmak sebeptir; okula gelemeyiş bunun sonucudur."),
    q("kolay", "Geç kaldığı için otobüsü kaçırdı. Bu cümlede sebep hangisidir?", "Geç kalması", "Otobüsü kaçırması", "Otobüs", "Geç kalmak nedendir; otobüsü kaçırmak bunun sonucudur."),
    q("kolay", "Aç olduğu için çok yemek yedi. Bu cümlede sonuç hangisidir?", "Çok yemek yemesi", "Aç olması", "Yemek", "Açlık sebeptir; çok yemek yemek bunun sonucudur."),
    q("kolay", "Soğuk hava olduğu için mont giydi. Bu cümlede sebep hangisidir?", "Soğuk hava", "Mont giymesi", "Hava", "Soğuk hava nedendir; mont giymek bunun sonucudur."),
    q("kolay", "Dikkatsiz davrandığı için kalemi kırdı. Bu cümlede sonuç hangisidir?", "Kalemi kırması", "Dikkatsiz davranması", "Kalem", "Dikkatsizlik sebeptir; kalemin kırılması bunun sonucudur."),
    q("kolay", "Çok koştuğu için yoruldu. Bu cümlede sebep hangisidir?", "Çok koşması", "Yorulması", "Koşu", "Çok koşmak nedendir; yorulmak bunun sonucudur."),
    q("kolay", "Elektrik kesildiği için lamba söndü. Bu cümlede sonuç hangisidir?", "Lambanın sönmesi", "Elektriğin kesilmesi", "Elektrik", "Elektriğin kesilmesi sebeptir; lambanın sönmesi sonuçtur."),
    q("kolay", "Susadığı için su içti. Bu cümlede sebep hangisidir?", "Susaması", "Su içmesi", "Su", "Susamak nedendir; su içmek bunun sonucudur."),
    q("kolay", "Annem yemek yaptı, bu yüzden mutfak sıcaktı. Bu cümlede sebep hangisidir?", "Annemin yemek yapması", "Mutfak sıcak olması", "Mutfak", "Yemek yapmak nedendir; mutfağın sıcak olması bunun sonucudur."),
    q("kolay", "Rüzgâr esti, bu yüzden yapraklar uçtu. Bu cümlede sonuç hangisidir?", "Yaprakların uçması", "Rüzgârın esmesi", "Yapraklar", "Rüzgâr sebeptir; yaprakların uçması sonuçtur."),
    q("kolay", "Kalemi düşürdü, bu yüzden kırıldı. Bu cümlede sebep hangisidir?", "Kalemi düşürmesi", "Kalemin kırılması", "Kalem", "Düşürmek nedendir; kırılma bunun sonucudur."),
    q("kolay", "Çok gülünce gözleri doldu. Bu cümlede sonuç hangisidir?", "Gözlerinin dolması", "Çok gülmek", "Gözler", "Çok gülmek sebeptir; gözlerin dolması sonuçtur."),
    q("kolay", "Ödevini bitirmedi, bu yüzden öğretmen uyarı verdi. Bu cümlede sebep hangisidir?", "Ödevini bitirmemesi", "Öğretmenin uyarı vermesi", "Ödev", "Ödevi bitirmemek nedendir; uyarı almak sonuçtur."),
    q("kolay", "Hava soğuk olduğu için pencereyi kapattık. Boşluğa hangi bağlaç gelmelidir?", "için", "ama", "veya", "Soğuk hava bir neden olduğu için pencereyi kapatma sonucunu anlatır."),
    q("kolay", "Çok yorulduğu için erken yattı. Boşluğa hangi sözcük gelmelidir?", "için", "ile", "gibi", "Yorulmak sebeptir; erken yatmak sonuçtur."),
    q("kolay", "Hasta oldu, _____ doktora gitti. Boşluğa hangi sözcük gelmelidir?", "bu yüzden", "ama", "veya", "Hasta olmak nedendir; doktora gitmek sonuçtur."),
    q("kolay", "Yağmur yağdı, _____ şemsiyeyi açtık. Boşluğa hangi sözcük gelmelidir?", "bu yüzden", "fakat", "ya da", "Yağmur yağmak sebeptir; şemsiye açmak sonuçtur."),
    q("kolay", "Çok çalıştı, _____ sınavı kazandı. Boşluğa hangi sözcük gelmelidir?", "dolayısıyla", "ancak", "hem de", "Çalışmak nedendir; sınavı kazanmak sonuçtur."),
    q("kolay", "Hangisinde kar yağması ile okul tatili arasında sebep-sonuç vardır?", "Kar yağınca okul tatil oldu", "Bugün hava güzel", "Ali okula gitti", "Kar yağması sebeptir; okulun tatil olması sonuçtur."),
    q("kolay", "Hangisinde ağlama ile sesin kısılması arasında sebep-sonuç vardır?", "Çok ağladığı için sesi kısıldı", "Ayşe kitap okuyor", "Bahçede çiçek var", "Ağlamak sebeptir; sesin kısılması sonuçtur."),
    q("kolay", "Hangisinde sebep-sonuç ilişkisi kurulmamıştır?", "Kedim süt içti", "Susuz kaldığı için su içti", "Geç kaldığı için koştu", "Kedinin süt içmesi basit bir olaydır; neden-sonuç kurulmamıştır."),
    q("kolay", "Hangisinde yalnızca olay anlatılmış, sebep-sonuç yoktur?", "Parkta top oynadık", "Soğuktan titredi", "Yorulduğu için dinlendi", "Top oynamak tek başına bir eylemdir."),
    q("kolay", "Hangisinde elektrik kesintisi ile televizyon kapanması arasında sebep-sonuç vardır?", "Elektrik gitti, bu yüzden televizyon kapandı", "Televizyon büyük", "Salon geniş", "Elektriğin gitmesi sebeptir; televizyonun kapanması sonuçtur."),
    q("kolay", "Sebep nedir?", "Bir olayın ortaya çıkmasına yol açan neden", "Bir olayın sonunda olan şey", "Bir cümlenin sonu", "Sebep, bir şeyin olmasına neden olan durumdur."),
    q("kolay", "Sonuç nedir?", "Sebepten sonra ortaya çıkan durum", "Bir olayın başlangıcı", "Cümledeki isim", "Sonuç, sebebin ardından meydana gelen olaydır."),
    q("kolay", "Çünkü kelimesi cümlede neyi gösterir?", "Sebebi", "Sonucu", "Zamanı", "Çünkü kelimesi neden bildirir."),
    q("kolay", "Bu yüzden kelimesi cümlede neyi gösterir?", "Sonucu", "Sebebi", "Yeri", "Bu yüzden bağlacı sebepten sonra gelen sonucu anlatır."),
    q("kolay", "Dolayısıyla kelimesi hangi ilişkiyi kurar?", "Sebep-sonuç", "Karşıtlık", "Seçenek", "Dolayısıyla bir nedenin ardından gelen sonucu bağlar."),
    q("kolay", "Çok oynadığı için terledi. Terlemesi hangi tür cümle öğesidir?", "Sonuç", "Sebep", "Özne", "Oynamak sebeptir; terlemek bunun sonucudur."),
    q("kolay", "Kış geldiği için ağaçlar yapraklarını döktü. Sebep hangisidir?", "Kışın gelmesi", "Yaprakların dökülmesi", "Ağaçlar", "Kışın gelmesi nedendir; yaprakların dökülmesi sonuçtur."),
    q("kolay", "Dondurma yediği için boğazı ağrıdı. Sonuç hangisidir?", "Boğazının ağrıması", "Dondurma yemesi", "Dondurma", "Dondurma yemek sebeptir; boğaz ağrısı sonuçtur."),
    q("kolay", "Fırtına çıktığı için dışarı çıkamadık. Sebep hangisidir?", "Fırtınanın çıkması", "Dışarı çıkamamamız", "Dışarı", "Fırtına sebeptir; dışarı çıkamamak sonuçtur."),
    q("kolay", "Kitabı unuttuğu için geri döndü. Sonuç hangisidir?", "Geri dönmesi", "Kitabı unutması", "Kitap", "Kitabı unutmak sebeptir; geri dönmek sonuçtur."),
    q("kolay", "Yağmur ile ıslanma arasındaki doğru eşleştirme hangisidir?", "Sebep: yağmur — Sonuç: ıslanmak", "Sebep: ıslanmak — Sonuç: yağmur", "Sebep: güneş — Sonuç: yağmur", "Yağmur yağması ıslanmaya neden olur."),
    q("kolay", "Açlık ile yemek yeme arasındaki doğru eşleştirme hangisidir?", "Sebep: açlık — Sonuç: yemek yemek", "Sebep: yemek yemek — Sonuç: açlık", "Sebep: uyku — Sonuç: açlık", "Açlık yemek yemeye neden olur."),
    q("kolay", "İçin bağlacı hangi ilişkiyi kurar?", "Sebep-sonuç", "Karşıtlık", "Benzerlik", "İçin bağlacı bir neden ile sonucu birbirine bağlar."),
    q("kolay", "Sebep-sonuç cümlesinde önce genellikle ne gelir?", "Sebep", "Sonuç", "Soru", "Sebep genellikle önce, sonuç sonra söylenir."),
    q("kolay", "Kar yağınca yollar kaygan oldu. Bu cümlede sebep hangisidir?", "Kar yağması", "Yolların kaygan olması", "Yollar", "Kar yağmak nedendir; yolların kaygan olması sonuçtur."),
    q("kolay", "Uykusu geldiği için erken yattı. Bu cümlede sonuç hangisidir?", "Erken yatması", "Uykusunun gelmesi", "Uyku", "Uykunun gelmesi sebeptir; erken yatmak sonuçtur."),
    q("kolay", "Çok bağırdığı için sesi kısıldı. Bu cümlede sebep hangisidir?", "Çok bağırmak", "Sesinin kısılması", "Ses", "Çok bağırmak nedendir; sesin kısılması sonuçtur."),
    q("kolay", "Rüzgar estiği için ağaç dalları sallandı. Bu cümlede sonuç hangisidir?", "Dalların sallanması", "Rüzgarın esmesi", "Ağaç", "Rüzgar sebeptir; dalların sallanması sonuçtur."),
    q("kolay", "Kalemi kaybettiği için yeni kalem aldı. Bu cümlede sebep hangisidir?", "Kalemi kaybetmesi", "Yeni kalem alması", "Kalem", "Kalemi kaybetmek nedendir; yeni kalem almak sonuçtur."),
    q("kolay", "Sınav zor olduğu için çok düşündü. Bu cümlede sonuç hangisidir?", "Çok düşünmesi", "Sınavın zor olması", "Sınav", "Sınavın zor olması sebeptir; çok düşünmek sonuçtur."),
    q("kolay", "Gece geç yattığı için sabah yorgun kalktı. Bu cümlede sebep hangisidir?", "Gece geç yatmak", "Sabah yorgun kalkmak", "Sabah", "Geç yatmak nedendir; yorgun kalkmak sonuçtur."),
    q("kolay", "Çok güneşte kaldığı için cildi kızardı. Bu cümlede sonuç hangisidir?", "Cildin kızarması", "Güneşte kalmak", "Güneş", "Güneşte kalmak sebeptir; cildin kızarması sonuçtur."),
    q("kolay", "Annem yorgun olduğu için dinlendi. Bu cümlede sebep hangisidir?", "Yorgun olması", "Dinlenmesi", "Anne", "Yorgunluk sebeptir; dinlenmek sonuçtur."),
    q("kolay", "Köpek havladığı için uyandık. Bu cümlede sonuç hangisidir?", "Uyanmamız", "Köpeğin havlaması", "Köpek", "Köpeğin havlaması sebeptir; uyanmak sonuçtur."),
    q("kolay", "Buz kaygan olduğu için düştü. Bu cümlede sebep hangisidir?", "Buzun kaygan olması", "Düşmesi", "Buz", "Buzun kaygan olması nedendir; düşmek sonuçtur."),
]

CUMLE_ORTA = [
    q("orta", "Kar fırtınası çıktığı için okul erken kapandı. Bu cümlede sebep hangisidir?", "Kar fırtınasının çıkması", "Okulun erken kapanması", "Okul", "Fırtına sebeptir; okulun erken kapanması sonuçtur."),
    q("orta", "Ödevini zamanında yapmadığı için notu düştü. Bu cümlede sonuç hangisidir?", "Notunun düşmesi", "Ödevini zamanında yapmaması", "Not", "Ödevi yapmamak sebeptir; notun düşmesi sonuçtur."),
    q("orta", "Çok televizyon izlediği için gözleri yoruldu. Bu cümlede sebep hangisidir?", "Çok televizyon izlemesi", "Gözlerinin yorulması", "Televizyon", "Televizyon izlemek sebeptir; göz yorgunluğu sonuçtur."),
    q("orta", "Yağmur yağdığı için piknik iptal oldu. Bu cümlede sonuç hangisidir?", "Pikniğin iptal olması", "Yağmur yağması", "Piknik", "Yağmur sebeptir; pikniğin iptal olması sonuçtur."),
    q("orta", "Kalemi kırıldığı için yeni kalem istedi. Bu cümlede sebep hangisidir?", "Kalemin kırılması", "Yeni kalem istemesi", "Kalem", "Kalemin kırılması sebeptir; yeni kalem istemek sonuçtur."),
    q("orta", "Çalışmadığı için sınavdan düşük not aldı. Bu cümlede sebep-sonuç sırası doğru mudur?", "Evet, doğru", "Hayır, ters", "Sebep-sonuç yok", "Çalışmamak sebep, düşük not sonuçtur; sıra doğrudur."),
    q("orta", "Sınavdan düşük not aldığı için çalışmadı. Bu cümlede sebep-sonuç ilişkisi doğru mu?", "Hayır, yanlış", "Evet, doğru", "İlişki yok", "Düşük not çalışmamanın sonucudur; sebep olarak gösterilmesi yanlıştır."),
    q("orta", "Hasta olmayı sebep gösteren cümle hangisidir?", "Okula gitmedi çünkü hasta oldu", "Hasta oldu okula gitti", "Okul güzel", "Çünkü kelimesi hasta olmayı sebep olarak bildirir."),
    q("orta", "Aşağıdaki cümlelerden hangisinde bu yüzden sonuç bildirir?", "Yağmur yağdı, bu yüzden ıslandık", "Islandık, bu yüzden yağmur yağdı", "Bu yüzden güzel", "Yağmur sebeptir; ıslanmak bu yüzden ile anlatılan sonuçtur."),
    q("orta", "Aşağıdaki cümlelerden hangisinde dolayısıyla doğru kullanılmıştır?", "Çok çalıştı, dolayısıyla başardı", "Başardı, dolayısıyla çalıştı", "Dolayısıyla mavi", "Çalışmak sebeptir; başarmak dolayısıyla ile bağlanan sonuçtur."),
    q("orta", "Sebep-sonuç cümlesi hangisidir?", "Susadığı için su içti", "Su içti", "Susadı", "Susamak sebep, su içmek sonuçtur."),
    q("orta", "Sebep-sonuç cümlesi olmayan hangisidir?", "Bahçede çiçek açtı", "Yorulduğu için dinlendi", "Aç olduğu için yemek yedi", "Çiçek açmak basit bir olaydır; neden-sonuç yoktur."),
    q("orta", "Yukarıdaki ifadelerden hangisi yanlıştır?", "III", "I", "II", "Ama karşıtlık bildirir; sebep-sonuç kurmaz.", "I. Sebep bir olayın nedenidir.\nII. Sonuç sebepten sonra gelir.\nIII. Ama sebep-sonuç kurar."),
    q("orta", "Yukarıdaki bağlaç bilgilerinden hangileri doğrudur?", "Hepsi", "Yalnız I", "I ve II", "Üç ifade de sebep-sonuç bağlaçları hakkında doğrudur.", "I. İçin sebep-sonuç kurar.\nII. Bu yüzden sonuç bildirir.\nIII. Çünkü sebep bildirir."),
    q("orta", "Yağmur yağdı. Bu yüzden şemsiye açtık. Parçada kaç sebep-sonuç ilişkisi vardır?", "Bir", "İki", "Hiç", "Yağmur yağması şemsiye açmaya neden olmuştur; bir ilişki vardır."),
    q("orta", "Yukarıdaki cümlelerden hangisinde sebep-sonuç ilişkisi en açık kurulmuştur?", "I ve II birlikte", "Yalnız III", "Hiçbiri", "Yağmur yağması şemsiye açmaya neden olmuştur.", "I. Yağmur yağdı.\nII. Şemsiye açtık.\nIII. Islanmadık."),
    q("orta", "Yukarıdaki olaylarda geç kalmak hangi olaya neden olmuştur?", "Koşmak", "Otobüse yetişmek", "Uyumak", "Geç kalmak koşmaya neden olmuştur.", "I. Geç kaldı.\nII. Koştu.\nIII. Otobüse yetişti."),
    q("orta", "Yukarıdaki olaylarda sınavı kazanmanın sebebi hangisidir?", "Çok çalışmak", "Ailenin sevinmesi", "Sınav", "Sınavı kazanmanın sebebi çok çalışmaktır.", "I. Çok çalıştı.\nII. Sınavı kazandı.\nIII. Ailesi sevindi."),
    q("orta", "Yukarıdaki olaylarda okula gitmemenin sebebi hangisidir?", "Hasta olmak", "Dinlenmek", "Okul", "Hasta olmak okula gitmemeye neden olmuştur.", "I. Hasta oldu.\nII. Okula gitmedi.\nIII. Dinlendi."),
    q("orta", "Yukarıdaki olaylarda pencere kapanmasının sebebi hangisidir?", "Rüzgarın esmesi", "Odanın serinlemesi", "Pencere", "Rüzgar pencerenin kapanmasına neden olmuştur.", "I. Rüzgar esti.\nII. Pencere kapandı.\nIII. Oda serindi."),
    q("orta", "Cam kırıldığı için dikkatli yürüdü. Bu cümlede sonuç hangisidir?", "Dikkatli yürümesi", "Camın kırılması", "Cam", "Cam kırılması sebeptir; dikkatli yürümek sonuçtur."),
    q("orta", "Çok gürültü olduğu için ders çalışamadı. Bu cümlede sebep hangisidir?", "Çok gürültü olması", "Ders çalışamaması", "Ders", "Gürültü sebeptir; ders çalışamamak sonuçtur."),
    q("orta", "Karnım acıktığı için mutfağa gittim. Bu cümlede sonuç hangisidir?", "Mutfağa gitmem", "Karnımın acıkması", "Mutfak", "Acıkmak sebeptir; mutfağa gitmek sonuçtur."),
    q("orta", "Yollar buzlu olduğu için yavaş yürüdük. Bu cümlede sebep hangisidir?", "Yolların buzlu olması", "Yavaş yürümemiz", "Yollar", "Buzlu yollar sebeptir; yavaş yürümek sonuçtur."),
    q("orta", "Öğretmen anlattığı için defterime yazdım. Bu cümlede sonuç hangisidir?", "Defterime yazmam", "Öğretmenin anlatması", "Defter", "Öğretmenin anlatması sebeptir; deftere yazmak sonuçtur."),
    q("orta", "Müzik çok yüksek olduğu için kulaklık taktı. Bu cümlede sebep hangisidir?", "Müziğin çok yüksek olması", "Kulaklık takması", "Müzik", "Yüksek müzik sebeptir; kulaklık takmak sonuçtur."),
    q("orta", "Okul çantası ağır olduğu için omzum ağrıdı. Bu cümlede sonuç hangisidir?", "Omzumun ağrıması", "Çantanın ağır olması", "Omuz", "Ağır çanta sebeptir; omuz ağrısı sonuçtur."),
    q("orta", "Sıcak olduğu için fanı açtı. Bu cümlede sebep hangisidir?", "Sıcak olması", "Fanı açması", "Fan", "Sıcak hava sebeptir; fan açmak sonuçtur."),
    q("orta", "Kalem yazmadığı için yeni uç taktı. Bu cümlede sonuç hangisidir?", "Yeni uç takması", "Kalemin yazmaması", "Uç", "Kalemin yazmaması sebeptir; yeni uç takmak sonuçtur."),
    q("orta", "Misafir geleceği için evi temizledi. Bu cümlede sebep hangisidir?", "Misafir geleceği", "Evi temizlemesi", "Ev", "Misafir gelmesi sebeptir; evi temizlemek sonuçtur."),
    q("orta", "Soru zor olduğu için uzun düşündü. Bu cümlede sonuç hangisidir?", "Uzun düşünmesi", "Sorunun zor olması", "Soru", "Zor soru sebeptir; uzun düşünmek sonuçtur."),
    q("orta", "Rüzgarlı olduğu için şapkasını tuttu. Bu cümlede sebep hangisidir?", "Rüzgarlı olması", "Şapkasını tutması", "Şapka", "Rüzgar sebeptir; şapka tutmak sonuçtur."),
    q("orta", "Çok oyun oynadığı için geç yattı. Bu cümlede sonuç hangisidir?", "Geç yatması", "Çok oyun oynaması", "Oyun", "Çok oyun oynamak sebeptir; geç yatmak sonuçtur."),
    q("orta", "Sınav yaklaştığı için daha çok çalıştı. Bu cümlede sebep hangisidir?", "Sınavın yaklaşması", "Daha çok çalışması", "Sınav", "Sınavın yaklaşması sebeptir; daha çok çalışmak sonuçtur."),
    q("orta", "Kedisi kaybolduğu için üzgündü. Bu cümlede sonuç hangisidir?", "Üzgün olması", "Kedisinin kaybolması", "Kedi", "Kedinin kaybolması sebeptir; üzülmek sonuçtur."),
    q("orta", "Hediye aldığı için çok mutlu oldu. Bu cümlede sebep hangisidir?", "Hediye alması", "Mutlu olması", "Hediye", "Hediye almak sebeptir; mutlu olmak sonuçtur."),
    q("orta", "Yolda kaldığı için babasını aradı. Bu cümlede sonuç hangisidir?", "Babasını araması", "Yolda kalması", "Baba", "Yolda kalmak sebeptir; babayı aramak sonuçtur."),
    q("orta", "Çok konuştuğu için susması istendi. Bu cümlede sebep hangisidir?", "Çok konuşması", "Susması istenmesi", "Konuşma", "Çok konuşmak sebeptir; susması istenmek sonuçtur."),
    q("orta", "Güneş battığı için sokak lambaları yandı. Bu cümlede sonuç hangisidir?", "Sokak lambalarının yanması", "Güneşin batması", "Sokak", "Güneşin batması sebeptir; lambaların yanması sonuçtur."),
    q("orta", "Kışın soğuk olduğu için kalın mont giydi. Bu cümlede sebep hangisidir?", "Kışın soğuk olması", "Kalın mont giymesi", "Mont", "Soğuk kış sebeptir; kalın mont giymek sonuçtur."),
    q("orta", "Çok kitap okuduğu için kelime dağarcığı genişledi. Bu cümlede sonuç hangisidir?", "Kelime dağarcığının genişlemesi", "Çok kitap okuması", "Kitap", "Kitap okumak sebeptir; kelime dağarcığının genişlemesi sonuçtur."),
    q("orta", "Pil bittiği için oyuncak çalışmadı. Bu cümlede sebep hangisidir?", "Pilin bitmesi", "Oyuncağın çalışmaması", "Oyuncak", "Pilin bitmesi sebeptir; oyuncağın çalışmaması sonuçtur."),
    q("orta", "Sulama yapılmadığı için çiçekler soldu. Bu cümlede sonuç hangisidir?", "Çiçeklerin solması", "Sulama yapılmaması", "Çiçek", "Sulama yapmamak sebeptir; çiçeklerin solması sonuçtur."),
    q("orta", "Çok koştuğu için nefesi kesildi. Bu cümlede sebep hangisidir?", "Çok koşması", "Nefesinin kesilmesi", "Nefes", "Çok koşmak sebeptir; nefesin kesilmesi sonuçtur."),
    q("orta", "Geç uyuduğu için sabah geç kalktı. Bu cümlede sonuç hangisidir?", "Sabah geç kalkması", "Geç uyuması", "Sabah", "Geç uyumak sebeptir; geç kalkmak sonuçtur."),
    q("orta", "Yağmur yağdığı için bahçeye çıkmadı. Bu cümlede sebep hangisidir?", "Yağmur yağması", "Bahçeye çıkmaması", "Bahçe", "Yağmur sebeptir; bahçeye çıkmamak sonuçtur."),
    q("orta", "Kalemi unuttuğu için arkadaşından istedi. Bu cümlede sonuç hangisidir?", "Arkadaşından istemesi", "Kalemi unutması", "Arkadaş", "Kalemi unutmak sebeptir; arkadaşından istemek sonuçtur."),
    q("orta", "Çok güldüğü için karın ağrısı oldu. Bu cümlede sebep hangisidir?", "Çok gülmek", "Karın ağrısı", "Karın", "Çok gülmek sebeptir; karın ağrısı sonuçtur."),
    q("orta", "Fırtına çıktığı için pencereyi kapattı. Bu cümlede sonuç hangisidir?", "Pencereyi kapatması", "Fırtınanın çıkması", "Pencere", "Fırtına sebeptir; pencereyi kapatmak sonuçtur."),
    q("orta", "Sebep-sonuç ilişkisinde sonuç genellikle hangi bağlaçla bildirilir?", "Bu yüzden", "Ama", "Veya", "Bu yüzden bağlacı sebepten sonra gelen sonucu bildirir."),
]

CUMLE_ZOR = [
    q("zor", "Yukarıdaki cümlelerin hangisinde sebep-sonuç ilişkisi yoktur?", "III", "I", "II", "III. cümlede tanım vardır; neden-sonuç kurulmamıştır.", "I. Geç kaldığı için koştu.\nII. Aç olduğu için yemek yedi.\nIII. Koşmak spor yapmak demektir."),
    q("zor", "Yukarıdaki cümlelerin hangisinde sebep-sonuç sırası doğrudur?", "I", "II", "III", "I. cümlede önce sebep (çalışma), sonra sonuç (başarı) gelir.", "I. Çalıştığı için başardı.\nII. Başardığı için çalıştı.\nIII. Başardı çünkü çalıştı."),
    q("zor", "Yukarıdaki cümlelerin hangisinde sebep-sonuç sırası yanlıştır?", "II", "I", "III", "II. cümlede başarı sebep gibi gösterilmiş; çalışmak sebep olmalıdır.", "I. Yağmur yağınca ıslandı.\nII. Başardığı için çalıştı.\nIII. Hasta olduğu için yattı."),
    q("zor", "Yukarıdaki bağlaç tanımlarından hangileri doğrudur?", "I ve II", "Yalnız I", "I, II ve III", "I ve II doğru; dolayısıyla sonuç bildirir, sebep değil.", "I. Çünkü kelimesi sebep bildirir.\nII. Bu yüzden kelimesi sonuç bildirir.\nIII. Dolayısıyla kelimesi sebep bildirir."),
    q("zor", "Yukarıdaki sebep-sonuç tanımlarından hangileri doğrudur?", "I, II ve III", "Yalnız II", "I ve III", "Üç ifade de doğru: sebep neden, sonuç sebebin ardından gelen durum, için bağlaç kurar.", "I. Sebep bir olayın nedenidir.\nII. Sonuç sebepten sonra ortaya çıkar.\nIII. İçin bağlacı sebep-sonuç kurar."),
    q("zor", "Yukarıdaki sebep örneklerinden hangisi yanlıştır?", "Yalnız III", "I ve II", "I, II ve III", "III yanlış: başarı çalışmanın sonucudur, sebebi değil.", "I. Yağmur yağmak ıslanmanın sebebidir.\nII. Geç kalmak otobüsü kaçırmanın sebebidir.\nIII. Başarı çalışmanın sebebidir."),
    q("zor", "Yukarıdaki eşleştirmelerden hangileri doğrudur?", "II ve III", "Yalnız I", "I ve II", "II ve III doğru: hasta-dinlenme ve yağmur-şemsiye. I ters kurulmuştur.", "I. Sebep: ıslanmak — Sonuç: yağmur\nII. Sebep: hasta olmak — Sonuç: dinlenmek\nIII. Sebep: yağmur — Sonuç: şemsiye açmak"),
    q("zor", "Yukarıdaki eşleştirmelerden hangileri yanlıştır?", "I ve III", "Yalnız II", "II ve III", "I ve III yanlış: karanlık sonuçtur, başarı sonuçtur. II doğrudur.", "I. Sebep: karanlık — Sonuç: elektrik kesintisi\nII. Sebep: çalışmak — Sonuç: başarı\nIII. Sebep: başarı — Sonuç: çalışmak"),
    q("zor", "Yukarıdaki parçada kaç sebep-sonuç ilişkisi vardır?", "İki", "Bir", "Üç", "Parçada yağmur-ıslanma ve geç kalma-otobüs kaçırma olmak üzere iki ilişki vardır.", "Yağmur yağınca ıslandık. Sonra geç kaldığımız için otobüsü kaçırdık."),
    q("zor", "Yukarıdaki parçada ilk sebep-sonuç ilişkisinin sebebi hangisidir?", "Yağmur yağması", "Islanmak", "Otobüsü kaçırmak", "İlk ilişkide yağmur yağması ıslanmanın sebebidir.", "Yağmur yağınca ıslandık. Sonra geç kaldığımız için otobüsü kaçırdık."),
    q("zor", "Yukarıdaki parçada ikinci sebep-sonuç ilişkisinin sonucu hangisidir?", "Otobüsü kaçırmak", "Yağmur yağmak", "Islanmak", "İkinci ilişkide geç kalmak sebep, otobüsü kaçırmak sonuçtur.", "Yağmur yağınca ıslandık. Sonra geç kaldığımız için otobüsü kaçırdık."),
    q("zor", "Yukarıdaki parçada sebep-sonuç ilişkisi hangi cümlede vardır?", "II", "I", "III", "II. cümlede çalışmak sebep, kazanmak sonuçtur.", "I. Bugün hava güzel.\nII. Çok çalıştığı için sınavı kazandı.\nIII. Sınav zordu."),
    q("zor", "Hangi seçenekte sebep, sonuç ve bağlaç doğru kullanılmıştır?", "Hasta olduğu için okula gitmedi", "Okula gitmediği için hasta oldu", "Hasta oldu, bu yüzden okula gitti", "Hasta olmak gitmemenin nedenidir; için bağlacı doğru kullanılmıştır."),
    q("zor", "Hangi seçenekte sebep-sonuç ilişkisi yanlış kurulmuştur?", "Başarılı olduğu için çok çalıştı", "Çok çalıştığı için başarılı oldu", "Hasta olduğu için dinlendi", "Başarılı olmak çalışmanın sonucudur; ters kurulmuştur."),
    q("zor", "Hangi seçenekte bu yüzden doğru kullanılmıştır?", "Elektrik kesildi, bu yüzden ders çalışamadık", "Ders çalışamadık, bu yüzden elektrik kesildi", "Bu yüzden güzel", "Elektriğin kesilmesi sebeptir; ders çalışamamak sonuçtur."),
    q("zor", "Fırtına çıktığı için ağaç devrildi. Bu cümlede sonuç hangisidir?", "Ağacın devrilmesi", "Fırtınanın çıkması", "Ağaç", "Fırtına sebeptir; ağacın devrilmesi sonuçtur."),
    q("zor", "Gece geç yattığı için sabah geç kalktı. Bu cümlede sebep hangisidir?", "Gece geç yatmak", "Sabah geç kalkmak", "Sabah", "Geç yatmak nedendir; geç kalkmak sonuçtur."),
    q("zor", "Okula gitmedi çünkü hasta oldu. Bu cümlede sebep hangisidir?", "Hasta olmak", "Okula gitmemek", "Okul", "Bu cümlede çünkü kelimesinden sonra gelen hasta olmak sebebi gösterir."),
    q("zor", "Çok bağırdı, dolayısıyla sesi kısıldı. Bu cümlede sonuç hangisidir?", "Sesinin kısılması", "Bağırmak", "Ses", "Bağırmak sebeptir; sesin kısılması dolayısıyla ile bağlanan sonuçtur."),
    q("zor", "Aşağıdaki cümlelerden hangisinde sebep-sonuç en iyi açıklanmıştır?", "Okula gitmedi çünkü hasta oldu; hasta olmak gitmemesinin nedenidir", "Okula gitmedi", "Hasta oldu", "İlk cümlede hem sonuç hem sebep açıkça belirtilmiştir."),
    q("zor", "Yukarıdaki cümlelerden hangisinde fırtına ile ağaç devrilmesi arasında sebep-sonuç vardır?", "II", "I", "III", "II. cümlede fırtına sebep, ağacın devrilmesi sonuçtur.", "I. Ağaç uzun.\nII. Fırtına çıktığı için ağaç devrildi.\nIII. Fırtına doğa olayıdır."),
    q("zor", "Yukarıdaki parçada birinci sebep-sonuç ilişkisinin sonucu hangisidir?", "Islanmak", "Yağmur yağmak", "Otobüs kaçırmak", "Yağmur yağması ıslanmanın sebebidir; ıslanmak sonuçtur.", "Yağmur yağınca ıslandık. Geç kaldığımız için otobüsü kaçırdık."),
    q("zor", "Yukarıdaki parçada ikinci sebep-sonuç ilişkisinin sebebi hangisidir?", "Geç kalmak", "Otobüsü kaçırmak", "Islanmak", "Geç kalmak otobüsü kaçırmanın sebebidir.", "Yağmur yağınca ıslandık. Geç kaldığımız için otobüsü kaçırdık."),
    q("zor", "Hangi cümlede sebep-sonuç ters kurulmuştur?", "Başardığı için çalıştı", "Çalıştığı için başardı", "Hasta olduğu için yattı", "Başarmak çalışmanın sonucudur; sebep gibi gösterilmesi yanlıştır."),
    q("zor", "Okula gitmeme gerekçesini sebep olarak gösteren cümle hangisidir?", "Okula gitmedi çünkü hasta oldu", "Çünkü okula gitmedi hasta oldu", "Hasta çünkü oldu", "Hasta olmak gitmemenin nedenidir; çünkü doğru kullanılmıştır."),
    q("zor", "Hangi cümlede dolayısıyla kelimesi yanlış kullanılmıştır?", "Güzel dolayısıyla hava", "Çalıştı, dolayısıyla başardı", "Yağmur yağdı, dolayısıyla ıslandık", "Güzel dolayısıyla hava anlamsızdır; sebep-sonuç kurulmamıştır."),
    q("zor", "Sebep-sonuç cümlesinde için bağlacı hangi bölümde kullanılır?", "Sebep bölümünün sonunda", "Sonuç bölümünün sonunda", "Cümlenin başında", "İçin bağlacı sebep bölümünün sonunda kullanılır."),
    q("zor", "Bu yüzden bağlacı hangi bölümden önce gelir?", "Sonuç bölümünden önce", "Sebep bölümünden önce", "Cümlenin sonunda", "Bu yüzden sonuç bölümünden önce gelir ve sonucu bildirir."),
    q("zor", "Aşağıdakilerden hangisi sebep-sonuç cümlesi değildir?", "Bugün pazartesi", "Yağmur yağdığı için ıslandık", "Aç olduğu için yemek yedi", "Bugün pazartesi basit bir bilgidir; sebep-sonuç yoktur."),
    q("zor", "Aşağıdakilerden hangisi sebep-sonuç cümlesidir?", "Soğuk olduğu için mont giydi", "Mont mavi", "Soğuk hava", "Soğuk olmak mont giymenin nedenidir."),
    q("zor", "Yukarıdaki sebep-sonuç kurallarından hangileri doğrudur?", "I ve II", "Yalnız III", "I, II ve III", "I ve II doğru; ama karşıtlık bildirir.", "I. Sebep her zaman sonuçtan önce gelir.\nII. Sonuç sebebin ardından ortaya çıkar.\nIII. Ama sebep-sonuç kurar."),
    q("zor", "Yukarıdaki bağlaç ifadelerinden hangisi yanlıştır?", "III", "I", "II", "Çünkü sebep bildirir, sonuç değil.", "I. İçin sebep-sonuç kurar.\nII. Bu yüzden sonuç bildirir.\nIII. Çünkü sonuç bildirir."),
    q("zor", "Yukarıdaki sebep-sonuç örneklerinden hangileri doğrudur?", "Hepsi", "Yalnız I", "I ve III", "Üç ifade de doğru sebep-sonuç eşleştirmesidir.", "I. Yağmur yağmak ıslanmanın sebebidir.\nII. Çalışmak başarının sebebidir.\nIII. Geç kalmak otobüsü kaçırmanın sebebidir."),
    q("zor", "Yukarıdaki ters eşleştirmelerden hangileri yanlıştır?", "I ve III", "Yalnız II", "II ve III", "I ve III yanlış: karanlık sonuçtur, başarı sonuçtur.", "I. Sebep: karanlık — Sonuç: elektrik kesintisi\nII. Sebep: yağmur — Sonuç: ıslanmak\nIII. Sebep: başarı — Sonuç: çalışmak"),
    q("zor", "Yukarıdaki parçada toplam kaç sebep-sonuç ilişkisi vardır?", "Üç", "Bir", "İki", "Parçada hasta-dinlenme, yağmur-ıslanma ve geç kalma-otobüs kaçırma olmak üzere üç ilişki vardır.", "Hasta olduğu için dinlendi. Yağmur yağınca ıslandı. Geç kaldığı için otobüsü kaçırdı."),
    q("zor", "Yukarıdaki parçada yağmur yağması hangi sonuca neden olmuştur?", "Islanmak", "Dinlenmek", "Otobüs kaçırmak", "Yağmur yağması ıslanmaya neden olmuştur.", "Hasta olduğu için dinlendi. Yağmur yağınca ıslandı. Geç kaldığı için otobüsü kaçırdı."),
    q("zor", "Yukarıdaki parçada hasta olma hangi sonuca neden olmuştur?", "Dinlenmek", "Islanmak", "Otobüs kaçırmak", "Hasta olmak dinlenmeye neden olmuştur.", "Hasta olduğu için dinlendi. Yağmur yağınca ıslandı. Geç kaldığı için otobüsü kaçırdı."),
    q("zor", "Hangi seçenekte sebep-sonuç ilişkisi doğru kurulmuştur?", "Çok çalıştığı için sınavı kazandı", "Sınavı kazandığı için çok çalıştı", "Sınavı kazandı çünkü başarılı", "Çalışmak sebeptir; sınavı kazanmak sonuçtur."),
    q("zor", "Hangi seçenekte için bağlacı yanlış kullanılmıştır?", "Gittiği için okula hasta oldu", "Hasta olduğu için okula gitmedi", "Aç olduğu için yemek yedi", "Okula gitmek hastalığın sebebi olamaz; ters kurulmuştur."),
    q("zor", "Sebep-sonuç ilişkisinde hangi bağlaç sebebi bildirir?", "Çünkü", "Bu yüzden", "Dolayısıyla", "Çünkü kelimesi sebebi bildirir."),
    q("zor", "Sebep-sonuç ilişkisinde hangi bağlaç sonucu bildirir?", "Bu yüzden", "Çünkü", "Ve", "Bu yüzden kelimesi sonucu bildirir."),
    q("zor", "Aşağıdakilerden hangisi sebep-sonuç cümlesi olarak yanlıştır?", "Başarılı olduğu için çalıştı", "Hasta olduğu için dinlendi", "Yağmur yağdığı için ıslandı", "Başarılı olmak çalışmanın sonucudur; sebep gibi gösterilmesi yanlıştır."),
    q("zor", "Aşağıdakilerden hangisi sebep-sonuç cümlesi olarak doğrudur?", "Geç kaldığı için otobüsü kaçırdı", "Otobüsü kaçırdığı için geç kaldı", "Geç kaldı çünkü otobüs", "Geç kalmak otobüsü kaçırmanın nedenidir."),
    q("zor", "Yukarıdaki cümlelerden hangisinde yağmur ile ıslanma arasında sebep-sonuç vardır?", "I", "II", "III", "I. cümlede yağmur sebep, ıslanma sonuçtur.", "I. Yağmur yağınca ıslandı.\nII. Bugün hava güzel.\nIII. Ali okula gitti."),
    q("zor", "Yukarıdaki cümlelerden hangisinde sebep-sonuç kurulmamıştır?", "II", "I", "III", "II. cümlede basit bilgi vardır; sebep-sonuç kurulmamıştır.", "I. Yorulduğu için dinlendi.\nII. Bugün cuma.\nIII. Aç olduğu için yemek yedi."),
    q("zor", "Sebep-sonuç ilişkisini en iyi açıklayan ifade hangisidir?", "Sebep bir olayın nedenidir, sonuç sebebin ardından gelir", "Sebep ve sonuç aynı şeydir", "Sonuç her zaman önce gelir", "Sebep neden, sonuç sebebin ardından ortaya çıkan durumdur."),
    q("zor", "Aşağıdakilerden hangisi sebep-sonuç konusunda yanlıştır?", "Sonuç sebepten önce gelir", "İçin bağlacı sebep-sonuç kurar", "Bu yüzden sonuç bildirir", "Sonuç sebepten sonra gelir; önce gelmesi yanlıştır."),
    q("zor", "Hangi cümlede sebep ve sonuç doğru eşleştirilmiştir?", "Elektrik kesildi, bu yüzden lamba söndü", "Lamba söndü, bu yüzden elektrik kesildi", "Bu yüzden lamba söndü elektrik", "Elektriğin kesilmesi lambanın sönmesine neden olur."),
    q("zor", "Hangi cümlede sebep-sonuç ilişkisi kurulmamıştır?", "Bahçede kırmızı gül var", "Susadığı için su içti", "Yorulduğu için dinlendi", "Gülün rengini anlatmak sebep-sonuç değildir."),
    q("zor", "Sebep-sonuç cümlelerinde en sık kullanılan bağlaç hangisidir?", "İçin", "Ama", "Veya", "İçin bağlacı sebep-sonuç cümlelerinde en sık kullanılır."),
]

def render_file(docstring: str, id_prefix: str, rows: list[tuple]) -> str:
    lines = [
        "# -*- coding: utf-8 -*-",
        f'"""{docstring}"""',
        "from __future__ import annotations",
        "",
        "_RAW: list[tuple] = [",
    ]
    current_level = None
    for row in rows:
        lvl = row[0]
        if lvl != current_level:
            label = {"kolay": "KOLAY", "orta": "ORTA", "zor": "ZOR"}[lvl]
            lines.append(f"    # ── {label} (50) ──")
            current_level = lvl
        parts = []
        for val in row:
            s = val.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
            parts.append(f'"{s}"')
        lines.append(f"    ({', '.join(parts)}),")
    lines += [
        "]",
        "",
        "",
        "def get_questions() -> list[dict]:",
        "    out = []",
        "    for i, row in enumerate(_RAW, start=1):",
        "        level, text, correct, w1, w2, exp = row[:6]",
        "        premise = row[6] if len(row) > 6 else None",
        "        out.append({",
        f'            "id": f"{id_prefix}_{{i:03d}}",',
        '            "level": level,',
        '            "premise": premise,',
        '            "text": text,',
        '            "correct": correct,',
        '            "wrong1": w1,',
        '            "wrong2": w2,',
        '            "explanation": exp,',
        "        })",
        "    return out",
        "",
    ]
    return "\n".join(lines)


def verify(rows: list[tuple], name: str) -> bool:
    texts = [r[1] for r in rows]
    exps = [r[5] for r in rows]
    levels = Counter([r[0] for r in rows])
    lc = dict(levels)
    ut = len(set(texts))
    ue = len(set(exps))
    print(f"\n=== {name} ===")
    print(f"Total: {len(rows)}")
    print(f"Levels: {lc}")
    print(f"Unique texts: {ut}")
    print(f"Unique explanations: {ue}")
    bad = [t for t in texts if "\u00ab" in t or "\u00bb" in t]
    if bad:
        print(f"BAD CHARS: {len(bad)}")
    dup = [t for t, c in Counter(texts).items() if c > 1]
    if dup:
        print(f"DUPLICATE TEXTS: {dup[:3]}")
    ok = len(rows) == 150 and all(lc.get(k, 0) == 50 for k in ("kolay", "orta", "zor")) and ut == 150 and ue == 150
    print("OK" if ok else "FAIL")
    return ok


if __name__ == "__main__":
    olay = OLAY_KOLAY + OLAY_ORTA + OLAY_ZOR
    cumle = CUMLE_KOLAY + CUMLE_ORTA + CUMLE_ZOR

    verify(olay, "olay_s3_bank")
    verify(cumle, "cumle_s3_bank")

    (SCRIPTS / "olay_s3_bank.py").write_text(
        render_file("3. sınıf Olayların Oluş Sırası ve Hikâye Unsurları — 150 soru.", "olay3", olay),
        encoding="utf-8",
    )
    (SCRIPTS / "cumle_s3_bank.py").write_text(
        render_file("3. sınıf Cümlede Anlam — Sebep-Sonuç İlişkileri — 150 soru.", "cumle3", cumle),
        encoding="utf-8",
    )
    print("\nFiles written.")

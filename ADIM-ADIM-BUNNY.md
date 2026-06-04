# Düellox — Bunny CDN kurulumu (sıfırdan, adım adım)

Bu rehber **hiç bilmeyen** biri için yazıldı. Sırayla gidin; bir adım bitmeden sonrakine geçmeyin.

**Ne yapıyoruz?**  
Sorular, mağaza, konu listesi gibi ağır veriler Firebase yerine Bunny (ucuz, hızlı sunucu) üzerinden yüklenecek. Oyun hâlâ Firebase’i kullanacak ama çok daha az (giriş, düello eşleşmesi, elmas, kupa vb.).

**Güvenlik:** Bir adımda takılırsanız `platformMeta/cdn` → `enabled: false` yapın; oyun eskisi gibi çalışır.

---

## Sözlük (1 dakika)

| Kelime | Anlamı |
|--------|--------|
| **Firebase** | Oyunun canlı veritabanı (zaten kullanıyorsunuz) |
| **Bunny** | Dosya ve video barındırma servisi (bunny.net) |
| **Storage Zone** | Dosyaların depolandığı kutu |
| **Pull Zone / CDN** | Oyuncuların dosyayı çektiği internet adresi (`xxxx.b-cdn.net`) |
| **dllwrld.json** | Firebase’in bilgisayarınızdaki yedeği |
| **Export** | Yedeği Bunny’ye yüklenecek küçük dosyalara çevirme |
| **Upload** | Bu dosyaları Bunny’ye gönderme |

---

# BÖLÜM A — Hazırlık (bilgisayarınız)

## Adım 1: Python var mı?

1. **Windows tuşu** → `cmd` yazın → **Komut İstemi** veya **PowerShell** açın.
2. Şunu yazıp Enter:

```powershell
python --version
```

3. `Python 3.10` veya `3.11` gibi bir şey görürseniz → **Adım 2’ye** geçin.
4. `python bulunamadı` derse:
   - https://www.python.org/downloads/ adresinden **Download** → kurun.
   - Kurulumda **“Add python.exe to PATH”** kutusunu **işaretleyin**.
   - Bilgisayarı yeniden başlatın, tekrar `python --version` deneyin.

---

## Adım 2: Proje klasörüne girin

PowerShell’de (tek tek yapıştırabilirsiniz):

```powershell
cd C:\Users\D4RKD4Y\Desktop\DLLWORLD
```

Klasörün doğru olduğunu kontrol:

```powershell
dir index.html
```

`index.html` listelenmeli.

---

## Adım 3: İçerik paketini oluşturun (export)

Bu adım **sadece bilgisayarınızda** çalışır; internet hesabı gerekmez.

```powershell
python scripts/export-content-packs.py --version 1
```

**Başarılı olursa** şuna benzer bir satır görürsünüz:

```text
OK: C:\Users\D4RKD4Y\Desktop\DLLWORLD\dist\cdn\v1
  files=50000+  bytes=...
```

**Kontrol:**

```powershell
dir dist\cdn\v1\manifest.json
```

Dosya varsa export tamam.

> **Not:** `dllwrld.json` eskiyse sorular eksik olabilir. Şimdilik devam edin; ileride Firebase’den yeni yedek alıp export’u tekrarlarsınız (Bölüm F).

---

# BÖLÜM B — Bunny hesabı (web sitesi)

## Adım 4: Bunny’ye kayıt olun

1. Tarayıcıda açın: **https://bunny.net**
2. **Sign Up** → e-posta ile hesap oluşturun.
3. Giriş yapın → **Dashboard** (kontrol paneli) açılır.

---

## Adım 5: Storage Zone oluşturun

Storage = dosyaların durduğu depo.

1. Sol menüden **Storage** → **Add Storage Zone**
2. Alanları doldurun:
   - **Name:** `duellox-assets` (küçük harf, boşluksuz; farklı isim de olur, sonra aynısını kullanın)
   - **Region:** **Falkenstein (DE)** veya size yakın bölge
3. **Add Storage Zone** / **Create** tıklayın.
4. Oluşan zone’a tıklayın.
5. **FTP & API Access** veya **Password** bölümünde **Password** değerini kopyalayın.  
   Bunu bir yere not edin → **STORAGE ŞİFRESİ** (upload için gerekli).

---

## Adım 6: Pull Zone (CDN adresi) oluşturun

Pull Zone = oyuncuların dosyayı okuduğu `https://xxxxx.b-cdn.net` adresi.

1. Sol menü **Pull Zones** → **Add Pull Zone**
2. **Name:** `duellox-cdn` (örnek)
3. **Origin Type:** **Storage Zone**
4. **Storage Zone:** Az önce oluşturduğunuz `duellox-assets` seçin
5. Oluşturun.
6. Pull Zone sayfasında **Hostname** yazar, örnek:

   `duellox-cdn.b-cdn.net`

   Bunu not edin → **CDN ADRESİNİZ** (Firebase’e yazacağız).

Tam adres şöyle olacak: `https://duellox-cdn.b-cdn.net` (https ile, sonunda `/` yok).

---

# BÖLÜM C — Dosyaları Bunny’ye yükleme

## Adım 7: Şifre ve zone adını PowerShell’e verin

PowerShell’i açın, proje klasöründe olun (`cd C:\Users\D4RKD4Y\Desktop\DLLWORLD`).

**Kendi değerlerinizle** değiştirin:

```powershell
$env:BUNNY_STORAGE_ZONE = "duellox-assets"
$env:BUNNY_STORAGE_API_KEY = "BURAYA-STORAGE-SIFRENIZI-YAPIŞTIRIN"
```

- `duellox-assets` → Adım 5’te verdiğiniz zone adı
- Şifre → Adım 5’te kopyaladığınız Password

---

## Adım 8: Önce deneme (dry-run)

Gerçek yükleme yapmadan kaç dosya gideceğini görün:

```powershell
python scripts/upload-bunny-storage.py --version 1 --dry-run
```

Hata yoksa **Adım 9**’a geçin.

**Sık hatalar:**

| Hata | Çözüm |
|------|--------|
| `dist/cdn/v1 yok` | Adım 3’ü tekrar çalıştırın |
| `BUNNY_STORAGE_ZONE` | Adım 7’yi aynı pencerede tekrar yapın |
| `401 Unauthorized` | Storage şifresi yanlış; Bunny panelden Password’u yeniden kopyalayın |

---

## Adım 9: Gerçek yükleme

```powershell
python scripts/upload-bunny-storage.py --version 1
```

- **50.000’e yakın dosya** olduğu için **15–60 dakika** sürebilir.
- Pencereyi kapatmayın; `PUT v1/rtdb/...` satırları aksın.
- En sonda `Tamam: ... dosya` yazmalı.

---

## Adım 10: Bunny panelden kontrol

1. Bunny → **Storage** → `duellox-assets`
2. Dosya listesinde **`v1`** klasörü görünmeli.
3. İçinde `rtdb`, `store` klasörleri olmalı.
4. Rastgele bir dosyaya tıklayıp **Copy URL** / önizleme deneyin; tarayıcıda JSON açılıyorsa tamam.

---

# BÖLÜM D — Firebase’de CDN’i açma

## Adım 11: Firebase Console’a girin

1. https://console.firebase.google.com
2. Projeniz: **dllwrld-e5419** (veya Düellox projesi)
3. Sol menü **Build** → **Realtime Database**
4. Veri ağacı (JSON ağacı) görünür.

---

## Adım 12: `platformMeta/cdn` kaydını ekleyin

1. Ağaçta **`platformMeta`** bulun (yoksa kök seviyede **+** ile `platformMeta` adında klasör oluşturun).
2. `platformMeta` altında **`cdn`** adında alt kayıt oluşturun.
3. `cdn` değerini **object** yapın ve şu alanları girin (**kendi CDN adresinizle**):

| Alan | Değer | Örnek |
|------|--------|--------|
| `enabled` | `true` | boolean |
| `base` | Pull Zone adresi | `https://duellox-cdn.b-cdn.net` |
| `version` | `1` | number |
| `duelRefsOnly` | `true` | boolean |

**Firebase Console’da JSON olarak eklemek için** `cdn` satırına tıklayıp değer olarak yapıştırabilirsiniz:

```json
{
  "enabled": true,
  "base": "https://duellox-cdn.b-cdn.net",
  "version": 1,
  "duelRefsOnly": true
}
```

`https://duellox-cdn.b-cdn.net` kısmını **Adım 6’daki hostname** ile değiştirin.

4. **Kaydedin** (Firebase otomatik kaydeder).

> **İlk test için güvenli yol:** Önce `"enabled": false` yapıp oyunu açın; her şey normal ise `true` yapın.

---

# BÖLÜM E — Oyunu test etme

## Adım 13: Oyunu açın

1. `C:\Users\D4RKD4Y\Desktop\DLLWORLD\index.html` dosyasına çift tıklayın (veya Chrome’da açın).
2. Her zamanki gibi giriş yapın, sınıf seçin.

---

## Adım 14: CDN çalışıyor mu? (F12)

1. Klavyede **F12** → **Network** / **Ağ** sekmesi
2. Sayfayı yenileyin (F5)
3. Filtreye `b-cdn` veya `rtdb` yazın
4. **CDN açıksa** şuna benzer istekler görürsünüz:

   `https://duellox-cdn.b-cdn.net/v1/rtdb/championData/...json`  
   Durum: **200**

5. **Hiç b-cdn isteği yoksa:**
   - `platformMeta/cdn/enabled` gerçekten `true` mu?
   - `base` adresi doğru mu? (https, `.b-cdn.net`, sondaki `/` yok)
   - Bunny’de `v1` klasörü yüklendi mi?

---

## Adım 15: Oyun içi kısa test listesi

Her birini deneyin; hata çıkarsa not alın:

- [ ] Ana ekran açılıyor
- [ ] Tek oyunculu soru açılıyor
- [ ] Mağaza açılıyor
- [ ] Düello başlıyor (mümkünse 2 cihaz veya arkadaşla)
- [ ] Deneme (açıksa) çalışıyor

Hepsi tamamsa CDN kurulumu **başarılı**.

---

# BÖLÜM F — İleride içerik güncelleme

Admin panelden yeni soru eklediğinizde:

1. Firebase’den güncel yedek alın → `dllwrld.json` (veya export aracınız)
2. `python scripts/export-content-packs.py --version 2`
3. `python scripts/upload-bunny-storage.py --version 2`
4. Firebase `platformMeta/cdn/version` → **2** yapın

Eski `v1` dosyaları Bunny’de kalabilir; sadece version numarasını artırmanız yeterli.

---

# BÖLÜM G — Sorun çıkarsa

## Oyun bozuldu / sorular gelmiyor

Firebase → `platformMeta/cdn/enabled` → **false** yapın → sayfayı yenileyin.  
Oyun yine Firebase’den okur (eski sistem).

## Upload yarıda kesildi

Upload script’ini **aynı komutla tekrar** çalıştırın; üzerine yazar.

## “Yeterli soru yok” hatası

- `dllwrld.json` güncel olmayabilir → yeni export + upload + version artırın.
- Veya geçici `enabled: false`.

---

# BÖLÜM H — Şimdilik yapmayın (ileri seviye)

Bunlar **zorunlu değil**; önce yukarıdaki A–E bitsin:

- Video/sprite dosyalarını (`hero/`, `.mp4`) Bunny’ye taşımak
- Firebase’den soru gövdelerini silmek
- Özel alan adı (duellox.com) bağlamak

---

# Özet kontrol listesi

| # | Yaptım mı? |
|---|------------|
| 1 | `python --version` çalışıyor |
| 2 | `export-content-packs.py` → `dist/cdn/v1` oluştu |
| 3 | Bunny hesabı + Storage Zone |
| 4 | Pull Zone hostname not edildi |
| 5 | `upload-bunny-storage.py` bitti |
| 6 | Bunny Storage’da `v1` klasörü var |
| 7 | Firebase `platformMeta/cdn` yazıldı |
| 8 | Oyunda F12’de `b-cdn.net` istekleri 200 |
| 9 | Tek oyuncu + mağaza test OK |

---

# Size lazım olacak not kağıdı (doldurun)

```
Storage Zone adı:     _______________________
Storage Password:     _______________________  (kimseyle paylaşmayın)
CDN hostname:         _______________________.b-cdn.net
CDN tam base:         https://_______________________.b-cdn.net
Firebase version:     1
```

Bu dosyayı doldurduktan sonra takıldığınız **adım numarasını** yazın; o adımdan devam ederiz.

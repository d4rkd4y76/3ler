# Düellox — Bunny CDN tam geçiş (PowerShell)

Sorular, mağaza, sprite sheet’ler ve videolar **Bunny Storage + Pull Zone** üzerinden servis edilir.  
Admin panelindeki her ekleme/silme **Firebase + Bunny**’ye otomatik yazılır (Storage şifresi admin tarayıcısında kayıtlıyken).

---

## 1. Bunny hesabı (bir kez)

1. [bunny.net](https://bunny.net) → **Storage Zone** (ör. `duellox-assets`)
2. **Pull Zone** bağlayın → `https://xxxx.b-cdn.net`
3. Storage **Password** = API anahtarı (upload için)

---

## 2. PowerShell kimlik dosyası

```powershell
cd C:\Users\D4RKD4Y\Desktop\dllworld
Copy-Item scripts\bunny-upload.local.example.ps1 scripts\bunny-upload.local.ps1
notepad scripts\bunny-upload.local.ps1
```

Doldurun:

| Alan | Değer |
|------|--------|
| `BunnyStorageZone` | Storage zone adı |
| `BunnyStorageApiKey` | Storage Password |
| `BunnyStorageRegion` | `de` (veya size yakın bölge) |
| `BunnyPullZoneBase` | `https://xxxx.b-cdn.net` |
| `BunnyContentVersion` | `1` |

---

## 3. Oyun CDN config (ilk açılış hızı)

```powershell
Copy-Item cdn-config.public.example.json cdn-config.public.json
notepad cdn-config.public.json
```

`base` alanına Pull Zone URL’nizi yazın. Bu dosya GitHub’a gidebilir (şifre yok).

---

## 4. Paketleri oluştur (export)

```powershell
cd C:\Users\D4RKD4Y\Desktop\dllworld
.\scripts\Export-BunnyPacks.ps1 -Version 1
```

Bu komut:

- `dllwrld.json` → `dist/cdn/v1/rtdb/...` (tüm sorular, mağaza, konu ağacı)
- `dist/cdn/v1/store/manifest.json`
- `hero/`, `assets/`, `egg_open/`, kök videolar → `dist/cdn/v1/assets/...`

**Not:** `dllwrld.json` güncel değilse önce Firebase’den RTDB export alın.

Sadece sorular:

```powershell
.\scripts\Export-BunnyPacks.ps1 -Version 1 -AssetsOnly:$false -ContentOnly
```

Sadece sprite/video:

```powershell
.\scripts\Export-BunnyPacks.ps1 -Version 1 -ContentOnly -AssetsOnly
# veya
python scripts/export-static-assets.py --version 1
```

---

## 5. Bunny’ye yükle (PowerShell)

Önce deneme (liste):

```powershell
.\scripts\Upload-BunnyCDN.ps1 -Version 1 -DryRun
```

Tam yükleme:

```powershell
.\scripts\Upload-BunnyCDN.ps1 -Version 1
```

Ayrı ayrı:

```powershell
.\scripts\Upload-BunnyCDN.ps1 -Version 1 -ContentOnly   # sorular + mağaza JSON
.\scripts\Upload-BunnyCDN.ps1 -Version 1 -AssetsOnly    # sprite + video (~100 MB)
```

Alternatif (Python):

```powershell
$env:BUNNY_STORAGE_ZONE = "duellox-assets"
$env:BUNNY_STORAGE_API_KEY = "SIFRENIZ"
python scripts/upload-bunny-storage.py --version 1
python scripts/upload-bunny-storage.py --version 1 --assets-only
```

---

## 6. Firebase’de CDN’i aç

Realtime Database → `platformMeta/cdn`:

```json
{
  "enabled": true,
  "base": "https://SIZIN-PULL-ZONE.b-cdn.net",
  "version": 1,
  "duelRefsOnly": true
}
```

---

## 7. Admin panel — otomatik senkron

1. `admin.html` → **CDN Yayın** sekmesi
2. Pull Zone + version kaydedin
3. Storage zone + Password kaydedin → **Bağlantıyı test et**
4. Bundan sonra soru/mağaza/deneme ekleme-silme **anında Bunny’ye** gider

Admin tarafında `nova-admin-cdn.js` Firebase `.set/.update/.remove` işlemlerini dinler.

---

## 8. Doğrulama

Tarayıcıda oyunu açın → Geliştirici araçları → **Ağ**:

| İstek | Beklenen |
|--------|----------|
| `.../v1/rtdb/championData/headings.json` | 200 |
| `.../v1/assets/hero/flame_dragon/sprite/...webp` | 200 |
| `.../v1/store/manifest.json` | 200 |

Telefonda GitHub Pages yerine Bunny URL’leri görünmeli; boot animasyonu ve kahramanlar CDN’den gelmeli.

---

## CDN yol haritası

| Yerel | Bunny Storage |
|-------|----------------|
| `championData/.../questions/{id}` | `v1/rtdb/championData/.../questions/{id}.json` |
| `store/...` | `v1/rtdb/store/...json` + `v1/store/manifest.json` |
| `hero/.../*.webp` | `v1/assets/hero/...` |
| `assets/boot-loading/...` | `v1/assets/assets/boot-loading/...` |
| `egg_open/...` | `v1/assets/egg_open/...` |
| `duello-bg-loop.mp4` | `v1/assets/video/duello-bg-loop.mp4` |

---

## Sorun giderme

| Sorun | Çözüm |
|-------|--------|
| Hâlâ Firebase’den soru iniyor | `platformMeta/cdn.enabled = true` ve `base` doğru mu? |
| Sprite yüklenmiyor | `Upload-BunnyCDN.ps1 -AssetsOnly` çalıştırıldı mı? |
| Admin Bunny’ye yazmıyor | CDN Yayın → Storage şifresi + test |
| Acil geri dönüş | `platformMeta/cdn.enabled = false` |

---

## İçerik güncelleme (yeni sorular)

1. Admin’den ekle → otomatik Bunny (admin açık + storage kayıtlı)
2. Toplu export: yeni `dllwrld.json` → `Export-BunnyPacks.ps1 -Version 2` → `Upload-BunnyCDN.ps1 -Version 2`
3. Firebase: `platformMeta/cdn.version = 2`

# Bunny CDN taşıma — Düellox

Kod tarafı hazır: uygulama önce Bunny’den okur, bulamazsa Firebase’e düşer (mevcut davranış bozulmaz).

## Benim (agent) yaptıklarım

| Dosya | Ne işe yarar |
|-------|----------------|
| `js/core/nova-cdn-config.js` | CDN adresi + sürüm; `platformMeta/cdn` ile açılır |
| `js/core/nova-cdn-fetch.js` | RTDB yolu → `https://…/v1/rtdb/….json` |
| `js/screens/007-script-007.js` | `readValCached` CDN-first; düello `questionSource` |
| `js/core/008-script-008.js` | Mağaza `store/manifest.json` CDN-first |
| `scripts/export-content-packs.py` | `dllwrld.json` → `dist/cdn/v1/` |
| `scripts/upload-bunny-storage.py` | Bunny Storage’a toplu yükleme |

## Sizin yapmanız gerekenler (sırayla)

### 1. Bunny hesabı

1. [bunny.net](https://bunny.net) → **Storage Zone** oluşturun (ör. `duellox-assets`).
2. Aynı zone için **Pull Zone** (CDN) bağlayın → hostname: `xxxx.b-cdn.net`.
3. Storage zone **Password** = API anahtarı (upload script için).

### 2. İçeriği paketleyin (bilgisayarınızda)

```powershell
cd C:\Users\D4RKD4Y\Desktop\DLLWORLD
python scripts/export-content-packs.py --version 1
```

- Girdi: `dllwrld.json` (Firebase yedeğiniz; güncel değilse önce admin/RTDB export alın).
- Çıktı: `dist/cdn/v1/` (binlerce küçük JSON + `store/manifest.json`).

İleride soru ekledikçe: `--version 2` ile yeni klasör, Firebase’de `platformMeta/cdn.version = 2`.

### 3. Bunny Storage’a yükleyin

```powershell
$env:BUNNY_STORAGE_ZONE = "duellox-assets"
$env:BUNNY_STORAGE_API_KEY = "STORAGE-ZONE-ŞİFRENİZ"
python scripts/upload-bunny-storage.py --version 1
```

Önce denemek için: `--dry-run`

### 4. Statik medyayı (video / sprite / hero) yükleyin

Bunny panelinden veya Storage’a:

| Kaynak | Önerilen CDN yolu |
|--------|-------------------|
| `hero/**` webp/png | `/assets/hero/...` |
| `*.mp4` (loading, düello bg) | `/assets/video/...` |
| `tools/**` | `/tools/...` |

Uygulama kodunda bu dosyaların URL’lerini zamanla `https://PULL-ZONE.b-cdn.net/assets/...` olacak şekilde güncelleyebilirsiniz (şimdilik yerel yollar çalışmaya devam eder).

**Bunny Stream** (zaten kullanıyorsunuz): Hikaye + soru videoları — admin’deki kütüphane adı / video GUID aynen kalır.

### 5. Firebase’de CDN’i açın

Realtime Database → `platformMeta/cdn`:

```json
{
  "enabled": true,
  "base": "https://SIZIN-PULL-ZONE.b-cdn.net",
  "version": 1,
  "duelRefsOnly": true
}
```

- `enabled: false` iken her şey eskisi gibi RTDB’den gelir.
- `duelRefsOnly: true` → düello kaydına tam soru dizisi yerine sadece `questionSource` (id listesi) yazılır; RTDB trafiği düşer.

### 6. Doğrulama

1. Tarayıcıda `index.html` açın.
2. Geliştirici araçları → Ağ: `…/v1/rtdb/championData/...` istekleri **200** olmalı.
3. Tek oyuncu / düello / mağaza / deneme kısa test.
4. Sorun yoksa (isteğe bağlı) RTDB’den `championData/.../questions` gövdelerini silmeyin; önce birkaç gün CDN + fallback ile izleyin.

### 7. Canlıya alma / GitHub

- `dist/` commit etmeyin (`.gitignore`’da zaten var).
- Sadece kod değişikliklerini push edin.
- Her içerik güncellemesinde: export → upload → `platformMeta/cdn.version` artırın.

## Firebase’de kalacaklar (taşımayın)

- `classes/.../students/...` (elmas, kredi, kupa, satın almalar)
- `duels/`, `matchmaking/`, `duelQueue/`
- `homeworks/`, `homeworkResults/`
- `denemeMeta`, `denemeProgress`, `denemeLeaderboard`
- `loggedinPlayers/`
- `platformMeta/cdn` (küçük ayar)

## 30.000 soru ölçeği

- Export script her soru yolunu ayrı JSON yapar; Bunny CDN bunu kaldırır.
- İstemci zaten konu başına 7–10 soru seçiyor; tam havuzu indirmez.
- Admin yeni soru ekledikçe: export v(N+1) → upload → version bump.

## Admin panel (otomatik CDN)

`admin.html` → sekme **CDN Yayın**:

1. Pull Zone adresi + version → Firebase `platformMeta/cdn`
2. Storage zone + Password → bu tarayıcıda (localStorage)
3. **Bağlantıyı test et**

Sonrasında soru / mağaza / deneme / boşluk doldurma kayıtları **otomatik** Bunny’ye yazılır (Firebase patch).

## Benim yapamadıklarım (sizin erişiminiz gerekir)

- Bunny hesabına giriş / Storage oluşturma
- API anahtarı verme (güvenlik)
- Canlı Firebase’e `platformMeta/cdn` yazma
- Güncel tam RTDB export (sizdeki `dllwrld.json` eski kalabilir)
- Pull Zone SSL / özel domain
- Bunny Stream’e yeni video yükleme

Sorun olursa: `platformMeta/cdn.enabled = false` → anında eski RTDB moduna dönersiniz.

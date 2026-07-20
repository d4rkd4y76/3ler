# Uygulama Parça

Bu klasör, `düello.html` dosyasının modülerleştirilmiş çıktısını içerir.

## Yapı
- `index.html`: Ana giriş dosyası
- `styles/`: Ayrıştırılmış CSS dosyaları
- `js/core/`: Ortak çekirdek scriptler
- `js/ui/`: UI yardımcı scriptleri
- `js/screens/`: Ekran odaklı scriptler
- `js/features/`: Özellik odaklı scriptler

## Çalıştırma
`index.html` dosyasını tarayıcıda açın.

## Bunny CDN (önerilen — telefon hızı)

**PowerShell rehberi:** `BUNNY-POWERSHELL-KURULUM.md`  
Teknik özet: `BUNNY-MIGRATION.md` · Adım adım: `ADIM-ADIM-BUNNY.md`

```powershell
.\scripts\Export-BunnyPacks.ps1 -Version 1
.\scripts\Upload-BunnyCDN.ps1 -Version 1
```

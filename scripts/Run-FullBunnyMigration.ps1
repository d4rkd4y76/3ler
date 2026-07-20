#Requires -Version 5.1
<#
  Tek komut: export + Bunny yukleme + ozet.
  Sifre: scripts\bunny-password.txt (tek satir) veya -StoragePassword parametresi.

.EXAMPLE
  # Sifreyi dosyaya yazdiyseniz:
  .\scripts\Run-FullBunnyMigration.ps1

  # Veya interaktif:
  .\scripts\Run-FullBunnyMigration.ps1 -StoragePassword (Read-Host -AsSecureString)
#>
param(
    [int]$Version = 1,
    [switch]$SkipExport,
    [switch]$DryRun,
    [Security.SecureString]$StoragePassword
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$ZoneName = "duellox-assets"
$PullZone = "https://duellox-cdn.b-cdn.net"
$PasswordPlain = $null

if ($StoragePassword) {
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($StoragePassword)
    try { $PasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
else {
    $pwFile = Join-Path $Root "scripts\bunny-password.txt"
    if (Test-Path $pwFile) {
        $PasswordPlain = (Get-Content $pwFile -Raw -Encoding UTF8).Trim()
    }
}

if (-not $PasswordPlain -and -not $DryRun) {
    Write-Host ""
    Write-Host "Storage Password gerekli." -ForegroundColor Red
    Write-Host "  Secenek A: scripts\bunny-password.txt olusturun (icine sadece sifre, tek satir)"
    Write-Host "  Secenek B: .\scripts\Run-FullBunnyMigration.ps1 -StoragePassword (Read-Host -AsSecureString)"
    exit 1
}

$localPs1 = Join-Path $Root "scripts\bunny-upload.local.ps1"
@(
    '$script:BunnyStorageZone = "' + $ZoneName + '"'
    '$script:BunnyStorageApiKey = "' + ($PasswordPlain -replace '"', '`"') + '"'
    '$script:BunnyStorageRegion = "de"'
    '$script:BunnyPullZoneBase   = "' + $PullZone + '"'
    '$script:BunnyContentVersion = ' + $Version
) | Set-Content -Path $localPs1 -Encoding UTF8

Write-Host "bunny-upload.local.ps1 olusturuldu (zone: $ZoneName)" -ForegroundColor Green

if (-not $SkipExport) {
    & (Join-Path $Root "scripts\Export-BunnyPacks.ps1") -Version $Version
}

$uploadArgs = @("-Version", $Version)
if ($DryRun) { $uploadArgs += "-DryRun" }
& (Join-Path $Root "scripts\Upload-BunnyCDN.ps1") @uploadArgs

Write-Host ""
Write-Host "=== Firebase (manuel, bir kez) ===" -ForegroundColor Cyan
Write-Host ('platformMeta/cdn -> { "enabled": true, "base": "' + $PullZone + '", "version": ' + $Version + ', "duelRefsOnly": true }')
Write-Host ""
Write-Host "Admin panel -> CDN Yayin -> Storage zone: $ZoneName + ayni sifre -> Baglantiyi test et" -ForegroundColor Cyan

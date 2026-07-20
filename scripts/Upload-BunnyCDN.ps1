#Requires -Version 5.1
<#
.SYNOPSIS
  Upload dist/cdn/v{N} to Bunny Storage (PowerShell).

.EXAMPLE
  .\scripts\Upload-BunnyCDN.ps1
  .\scripts\Upload-BunnyCDN.ps1 -Version 1 -AssetsOnly
  .\scripts\Upload-BunnyCDN.ps1 -DryRun
#>
param(
    [int]$Version = 1,
    [switch]$DryRun,
    [switch]$ContentOnly,
    [switch]$AssetsOnly
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$RegionHosts = @{
    "de"  = "storage.bunnycdn.com"
    "ny"  = "ny.storage.bunnycdn.com"
    "la"  = "la.storage.bunnycdn.com"
    "sg"  = "sg.storage.bunnycdn.com"
    "syd" = "syd.storage.bunnycdn.com"
}

$MimeByExt = @{
    ".json"  = "application/json; charset=utf-8"
    ".webp"  = "image/webp"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".gif"   = "image/gif"
    ".svg"   = "image/svg+xml"
    ".mp4"   = "video/mp4"
    ".webm"  = "video/webm"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
}

function Load-BunnyConfig {
    $localCfg = Join-Path $Root "scripts\bunny-upload.local.ps1"
    if (Test-Path $localCfg) {
        . $localCfg
    }

    if ($env:BUNNY_STORAGE_ZONE) { $script:Zone = $env:BUNNY_STORAGE_ZONE.Trim() }
    elseif ($script:BunnyStorageZone) { $script:Zone = $script:BunnyStorageZone.Trim() }
    else { $script:Zone = "" }

    if ($env:BUNNY_STORAGE_API_KEY) { $script:ApiKey = $env:BUNNY_STORAGE_API_KEY.Trim() }
    elseif ($script:BunnyStorageApiKey) { $script:ApiKey = $script:BunnyStorageApiKey.Trim() }
    else { $script:ApiKey = "" }

    if ($env:BUNNY_STORAGE_REGION) { $script:Region = $env:BUNNY_STORAGE_REGION.Trim().ToLower() }
    elseif ($script:BunnyStorageRegion) { $script:Region = $script:BunnyStorageRegion.Trim().ToLower() }
    else { $script:Region = "de" }

    if (-not $RegionHosts.ContainsKey($script:Region)) { $script:Region = "de" }
    $script:BunnyHost = $RegionHosts[$script:Region]

    if ($script:BunnyPullZoneBase) { $script:PullZone = $script:BunnyPullZoneBase.Trim().TrimEnd("/") }
    else { $script:PullZone = "" }
}

function Get-ContentType {
    param([string]$Path)
    $ext = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()
    if ($MimeByExt.ContainsKey($ext)) { return $MimeByExt[$ext] }
    return "application/octet-stream"
}

function Encode-UriSegment {
    param([string]$Segment)
    return [System.Uri]::EscapeDataString($Segment)
}

function Build-StorageUrl {
    param([string]$RemotePath)
    $zoneEnc = Encode-UriSegment $script:Zone
    if (-not $zoneEnc) { $zoneEnc = "dry-run-zone" }
    $parts = ($RemotePath -replace "\\", "/" -split "/" | Where-Object { $_ })
    $pathEnc = ($parts | ForEach-Object { Encode-UriSegment $_ }) -join "/"
    return "https://$($script:BunnyHost)/$zoneEnc/$pathEnc"
}

function Send-BunnyPut {
    param(
        [string]$LocalPath,
        [string]$RemotePath
    )
    $bytes = [System.IO.File]::ReadAllBytes($LocalPath)

    if ($DryRun) {
        $kb = [math]::Round($bytes.Length / 1KB, 1)
        Write-Host "  [DRY] PUT $RemotePath ($kb KB)"
        return
    }

    $url = Build-StorageUrl $RemotePath
    $ct = Get-ContentType $LocalPath
    $headers = @{
        "AccessKey"    = $script:ApiKey
        "Content-Type" = $ct
    }

    try {
        Invoke-RestMethod -Uri $url -Method Put -Headers $headers -Body $bytes -TimeoutSec 300 | Out-Null
    }
    catch {
        $msg = $_.Exception.Message
        if ($_.ErrorDetails.Message) { $msg = $_.ErrorDetails.Message }
        throw "PUT failed: $RemotePath - $msg"
    }
}

Load-BunnyConfig

if (-not $DryRun -and (-not $script:Zone -or -not $script:ApiKey)) {
    Write-Host ""
    Write-Host "ERROR: Missing Bunny Storage credentials." -ForegroundColor Red
    Write-Host "  Copy scripts\bunny-upload.local.example.ps1 to scripts\bunny-upload.local.ps1"
    Write-Host "  Or set BUNNY_STORAGE_ZONE and BUNNY_STORAGE_API_KEY"
    exit 1
}

$src = Join-Path $Root "dist\cdn\v$Version"
if (-not (Test-Path $src)) {
    Write-Host "ERROR: $src not found. Run Export-BunnyPacks.ps1 first." -ForegroundColor Red
    exit 1
}

$allFiles = Get-ChildItem $src -Recurse -File
$files = @($allFiles)

if ($ContentOnly) {
    $files = @($allFiles | Where-Object {
        $rel = $_.FullName.Substring($src.Length + 1) -replace "\\", "/"
        -not $rel.StartsWith("assets/")
    })
}
elseif ($AssetsOnly) {
    $assetsRoot = Join-Path $src "assets"
    if (-not (Test-Path $assetsRoot)) {
        Write-Host "ERROR: assets folder missing. Run export-static-assets.py first." -ForegroundColor Red
        exit 1
    }
    $files = @(Get-ChildItem $assetsRoot -Recurse -File)
}

Write-Host ""
Write-Host "Bunny Storage upload" -ForegroundColor Green
Write-Host "  Zone    : $($script:Zone)"
Write-Host "  Host    : $($script:BunnyHost)"
Write-Host "  Version : v$Version"
Write-Host "  Files   : $($files.Count)"
if ($DryRun) { Write-Host "  Mode    : DRY-RUN" -ForegroundColor Yellow }

$ok = 0
$fail = 0
$i = 0

foreach ($f in $files) {
    $i++
    if ($AssetsOnly) {
        $rel = $f.FullName.Substring((Join-Path $src "assets").Length + 1) -replace "\\", "/"
        $remote = "v$Version/assets/$rel"
    }
    else {
        $rel = $f.FullName.Substring($src.Length + 1) -replace "\\", "/"
        $remote = "v$Version/$rel"
    }

    try {
        Send-BunnyPut -LocalPath $f.FullName -RemotePath $remote
        $ok++
    }
    catch {
        $fail++
        Write-Host "  FAIL: $remote" -ForegroundColor Red
        Write-Host "        $($_.Exception.Message)" -ForegroundColor DarkRed
        if ($fail -ge 25) {
            Write-Host "Too many errors; stopped." -ForegroundColor Red
            exit 1
        }
    }

    if ($i % 50 -eq 0 -or $i -eq $files.Count) {
        Write-Host "  [$i/$($files.Count)] $rel"
    }
}

Write-Host ""
if ($fail -gt 0) {
    Write-Host "Done: $ok uploaded, $fail failed." -ForegroundColor Yellow
    exit 1
}
Write-Host "Done: $ok uploaded, $fail failed." -ForegroundColor Green

Write-Host ""
Write-Host "Set Firebase platformMeta/cdn:" -ForegroundColor Cyan
$pullBase = if ($script:PullZone) { $script:PullZone } else { "https://YOUR-PULL-ZONE.b-cdn.net" }
Write-Host ('{ "enabled": true, "base": "' + $pullBase + '", "version": ' + $Version + ', "duelRefsOnly": true }')

Write-Host ""
Write-Host "Copy cdn-config.public.example.json to cdn-config.public.json (same base URL)."

if (-not $ContentOnly) {
    Write-Host ""
    Write-Host "Test URLs:" -ForegroundColor DarkGray
    $base = if ($script:PullZone) { $script:PullZone } else { "https://YOUR-PULL-ZONE.b-cdn.net" }
    Write-Host ("  " + $base + "/v" + $Version + "/assets/hero/flame_dragon/sprite/manifest.json")
    Write-Host ("  " + $base + "/v" + $Version + "/rtdb/championData/headings.json")
    Write-Host ("  " + $base + "/v" + $Version + "/store/manifest.json")
}

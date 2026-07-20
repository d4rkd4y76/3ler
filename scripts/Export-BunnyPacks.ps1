#Requires -Version 5.1
param(
    [int]$Version = 1,
    [string]$InputJson = "",
    [switch]$ContentOnly,
    [switch]$AssetsOnly
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Invoke-PythonStep {
    param([string]$Label, [string[]]$Args)
    Write-Host ""
    Write-Host "==> $Label" -ForegroundColor Cyan
    & python @Args
    if ($LASTEXITCODE -ne 0) {
        throw "Python failed: $Label (exit $LASTEXITCODE)"
    }
}

Write-Host "DLLWORLD Bunny export v$Version" -ForegroundColor Green
Write-Host "Folder: $Root"

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw "Python not found. Install Python and add to PATH."
}

if (-not $AssetsOnly) {
    $exportArgs = @("scripts/export-content-packs.py", "--version", $Version)
    if ($InputJson) {
        $exportArgs += @("--input", $InputJson)
    }
    else {
        $defaultJson = Join-Path $Root "dllwrld.json"
        if (-not (Test-Path $defaultJson)) {
            Write-Warning "dllwrld.json missing. Export Firebase RTDB backup first."
        }
    }
    Invoke-PythonStep "Content JSON export (questions, store, tree)" $exportArgs
}

if (-not $ContentOnly) {
    Invoke-PythonStep "Static media export (sprites, videos)" @(
        "scripts/export-static-assets.py",
        "--version", $Version
    )
}

$dist = Join-Path $Root "dist\cdn\v$Version"
if (-not (Test-Path $dist)) {
    throw "Export output missing: $dist"
}

$fileCount = (Get-ChildItem $dist -Recurse -File).Count
$byteSum = (Get-ChildItem $dist -Recurse -File | Measure-Object Length -Sum).Sum
Write-Host ""
Write-Host "Export done." -ForegroundColor Green
Write-Host "  Path  : $dist"
Write-Host "  Files : $fileCount"
Write-Host "  Size  : $([math]::Round($byteSum / 1MB, 2)) MB"
Write-Host ""
Write-Host "Next: .\scripts\Upload-BunnyCDN.ps1 -Version $Version"

# Recompile MannyMarker (the native markdown editor) after editing sources or config.
#
# Usage:  right-click -> Run with PowerShell,  or  from a terminal:  ./compile.ps1
#
# Edit these first if you want to change compiled-in defaults:
#   - src-tauri/tauri.conf.json   -> window default width/height/title
#   - src/styles.css              -> colours, toolbar look
# (Font, size, page width/margin, spellcheck are runtime preferences - no recompile.)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

# Ensure Rust/Cargo is on PATH for this session (rustup installs to ~/.cargo/bin).
$cargoBin = Join-Path $env:USERPROFILE ".cargo\bin"
if (Test-Path $cargoBin) { $env:PATH = "$cargoBin;$env:PATH" }

# A running instance locks the .exe and makes the installer step fail - close it.
Get-Process MannyMarker -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 300

Write-Host "Building release... (first build after a clean is slow; later ones are quick)" -ForegroundColor Cyan
npm run tauri build

$exe = Join-Path $PSScriptRoot "src-tauri\target\release\MannyMarker.exe"
if (Test-Path $exe) {
    Write-Host "`nBuilt: $exe" -ForegroundColor Green
    $launch = Read-Host "Launch it now? (y/n)"
    if ($launch -eq "y") { Start-Process $exe }
} else {
    Write-Host "Build did not produce the exe - check the output above." -ForegroundColor Red
}

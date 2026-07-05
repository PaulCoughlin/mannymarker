# Rebuild MannyMarker and refresh the portable copy in C:\Portable\Manny Marker.
#
# That portable exe is the one associated with .md files, so after this script
# finishes, double-click / "Open with" runs the new build - no install, no manual copy.
#
# Usage:  ./compile-local.ps1
# (compile.ps1 is the full build including the MSI/NSIS installers; this one skips
# the installer bundles, so it is also faster.)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

$portableDir = "C:\Portable\Manny Marker"
$builtExe = Join-Path $PSScriptRoot "src-tauri\target\release\MannyMarker.exe"

# Ensure Rust/Cargo is on PATH for this session (rustup installs to ~/.cargo/bin).
$cargoBin = Join-Path $env:USERPROFILE ".cargo\bin"
if (Test-Path $cargoBin) { $env:PATH = "$cargoBin;$env:PATH" }

# A running instance locks the portable exe and would make the copy fail - close it.
Get-Process MannyMarker -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 300

Write-Host "Building release exe (no installer bundles)..." -ForegroundColor Cyan
npm run tauri build -- --no-bundle
if ($LASTEXITCODE -ne 0) { throw "Build failed - see output above." }

if (-not (Test-Path $builtExe)) { throw "Build did not produce $builtExe" }

if (-not (Test-Path $portableDir)) {
    New-Item -ItemType Directory -Path $portableDir | Out-Null
}
Copy-Item $builtExe -Destination $portableDir -Force

Write-Host "`nPortable copy updated: $portableDir\MannyMarker.exe" -ForegroundColor Green

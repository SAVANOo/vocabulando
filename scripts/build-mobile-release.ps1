param(
  [string]$Abi = "arm64-v8a",
  [string]$Repo = "SAVANOo/vocabulando",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$appJson = Get-Content (Join-Path $root "apps/mobile/app.json") -Raw | ConvertFrom-Json
$versionName = [string]$appJson.expo.version
$versionCode = [int]$appJson.expo.android.versionCode
$packageId = [string]$appJson.expo.android.package
$appName = [string]$appJson.expo.name

if (-not $SkipBuild) {
  $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
  $env:JAVA_TOOL_OPTIONS = "-Dfile.encoding=UTF-8"
  Push-Location (Join-Path $root "apps/mobile/android")
  try {
    & .\gradlew.bat :app:assembleRelease "-PreactNativeArchitectures=$Abi" --no-daemon
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } finally {
    Pop-Location
  }
}

$releaseDir = Join-Path $root "apps/mobile/android/app/build/outputs/apk/release"
$rawApk = Join-Path $releaseDir "app-release.apk"
if (-not (Test-Path $rawApk)) {
  throw "APK nao encontrado em $rawApk"
}

$apkFileName = "vocabulando-v$versionName-$Abi.apk"
$versionedApk = Join-Path $releaseDir $apkFileName
Copy-Item -Force $rawApk $versionedApk

$sizeBytes = (Get-Item $versionedApk).Length
$sha256 = (Get-FileHash $versionedApk -Algorithm SHA256).Hash
$releasedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$manifestPath = Join-Path $root "apps/mobile/release-manifest.json"
$prevChangelog = @("Atualizacao v$versionName")
if (Test-Path $manifestPath) {
  $prev = Get-Content $manifestPath -Raw | ConvertFrom-Json
  if ($prev.changelog) { $prevChangelog = @($prev.changelog) }
}

$manifest = [ordered]@{
  packageId   = $packageId
  name        = $appName
  versionName = $versionName
  versionCode = $versionCode
  minSdk      = 24
  targetSdk   = 36
  abi         = $Abi
  apkFileName = $apkFileName
  apkUrl      = "https://github.com/$Repo/releases/download/v$versionName/$apkFileName"
  iconUrl     = "https://raw.githubusercontent.com/$Repo/main/apps/mobile/assets/logo.png"
  sizeBytes   = $sizeBytes
  sha256      = $sha256
  releasedAt  = $releasedAt
  changelog   = $prevChangelog
}

$json = $manifest | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($manifestPath, $json + "`n", [System.Text.UTF8Encoding]::new($false))
Write-Output "RELEASE_MANIFEST_OK: $manifestPath"
Write-Output "APK_OK: $versionedApk ($sizeBytes bytes, sha256=$sha256)"

param(
  [string]$Abi = "arm64-v8a",
  [string]$Repo = "SAVANOo/vocabulando",
  [string]$StoreRepoPath = "..\savano-store",
  [switch]$SkipBuild,
  [switch]$PublishGitHub,
  [switch]$UpdateStoreCatalog
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$appJson = Get-Content (Join-Path $root "apps/mobile/app.json") -Raw | ConvertFrom-Json
$versionName = [string]$appJson.expo.version
$versionCode = [int]$appJson.expo.android.versionCode
$packageId = [string]$appJson.expo.android.package
$appName = [string]$appJson.expo.name
$tag = "v$versionName"

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

$apkFileName = "vocabulando-$tag-$Abi.apk"
$versionedApk = Join-Path $releaseDir $apkFileName
Copy-Item -Force $rawApk $versionedApk

$sizeBytes = (Get-Item $versionedApk).Length
$sha256 = (Get-FileHash $versionedApk -Algorithm SHA256).Hash
$releasedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$releaseBaseUrl = "https://github.com/$Repo/releases/download/$tag"

$manifestPath = Join-Path $root "apps/mobile/release-manifest.json"
$prevChangelog = @("Atualizacao $tag")
$tagline = "Domine novas palavras todos os dias — 100% offline"
if (Test-Path $manifestPath) {
  $prev = Get-Content $manifestPath -Raw | ConvertFrom-Json
  if ($prev.changelog) { $prevChangelog = @($prev.changelog) }
  if ($prev.tagline) { $tagline = [string]$prev.tagline }
}

$manifest = [ordered]@{
  packageId   = $packageId
  name        = $appName
  tagline     = $tagline
  versionName = $versionName
  versionCode = $versionCode
  minSdk      = 24
  targetSdk   = 36
  abi         = $Abi
  apkFileName = $apkFileName
  apkUrl      = "$releaseBaseUrl/$apkFileName"
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

if ($PublishGitHub) {
  $gh = Get-Command gh -ErrorAction SilentlyContinue
  if (-not $gh) {
    throw "GitHub CLI (gh) nao encontrado. Instale com: winget install --id GitHub.cli -e"
  }
  & gh release view $tag --repo $Repo *> $null
  if ($LASTEXITCODE -eq 0) {
    & gh release upload $tag $versionedApk $manifestPath --repo $Repo --clobber
  } else {
    $notesText = ($prevChangelog | ForEach-Object { "- $_" }) -join "`n"
    & gh release create $tag $versionedApk $manifestPath --repo $Repo --title "$appName $tag" --notes $notesText
  }
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Output "GITHUB_RELEASE_OK: $tag em $Repo"
}

if ($UpdateStoreCatalog) {
  $storeDir = Resolve-Path (Join-Path $root $StoreRepoPath)
  $publishScript = Join-Path $storeDir "scripts/publish-release.mjs"
  $catalogPath = Join-Path $storeDir "catalog/catalog.json"
  if (-not (Test-Path $publishScript)) {
    throw "Script nao encontrado: $publishScript"
  }
  & node $publishScript `
    --manifest $manifestPath `
    --release-base-url $releaseBaseUrl `
    --apk $versionedApk `
    --catalog $catalogPath
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Output "SAVANO_STORE_CATALOG_OK: $catalogPath"
}

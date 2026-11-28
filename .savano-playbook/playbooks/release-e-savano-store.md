# Playbook — Assinatura, GitHub Releases e Savano Store

## 1. Keystore fora do Git
- Nunca commitar `.jks`, `.keystore` ou `keystore.properties`.
- Guardar a keystore em pasta externa ao repositório (ex.: `../savano-store-keys/` ou `~/.<app>-keys/`).
- Gerar `keystore.properties` sempre em **UTF-8 sem BOM** (`[System.Text.UTF8Encoding]::new($false)` no Windows/PowerShell) — com BOM o `Properties.load()` do Gradle falha com `storeFile = null`.
- Configurar `signingConfigs.release` lendo `keystore.properties` (com fallback para variáveis de ambiente em CI) e guardar backup da senha + `.keystore` (ou `.zip`/Base64) no gerenciador de senhas.

## 2. Build Android Release (Windows, CMake & Proguard/R8)
- **Acentos no caminho do Windows (ex.: `Sávio`):** adicionar `android.overridePathCheck=true` em `android/gradle.properties` para o AGP não bloquear o build; e se usar CMake/Ninja (ex.: `expo-modules-core`), redirecionar o staging de módulos `com.android.library` durante a inicialização do plugin:
  ```groovy
  subprojects { sub ->
    sub.plugins.withId("com.android.library") {
      def androidExt = sub.extensions.findByName("android")
      if (androidExt != null && androidExt.hasProperty("externalNativeBuild")) {
        androidExt.externalNativeBuild.cmake.buildStagingDirectory = new File("C:/Temp/vcxx-${sub.name}")
      }
    }
  }
  ```
- **Proguard / R8:** manter classes de widgets nativos (`-keep class <packageId>.** { *; }`) e `com.horcrux.svg.**` em `android/app/proguard-rules.pro`.
- **Versionamento Incremental Padrão:** após publicar ou instalar uma versão (`v1.0.0` / `versionCode = 10000`), **nunca reutilizar o mesmo `versionCode`**. Qualquer ajuste posterior (código, ícone, manifesto) deve incrementar o patch (`1.0.1`, `1.0.2`, ...) com `versionCode = major*10000 + minor*100 + patch` (`10001`, `10002`, ...), gerar nova tag Git (`v1.0.1`), nova GitHub Release e atualizar o `catalog.json` da Savano Store.
- **Nome versionado do APK:** copiar `app-release.apk` para `<app>-v<versionName>-<abi>.apk` (ex.: `vocabulando-v1.0.0-arm64-v8a.apk`) para bater 100% com `apkFileName` e `apkUrl`.

## 3. Contrato `release-manifest.json`
Cada app gera seu `release-manifest.json` contendo:
- `packageId`, `name`, `versionName`, `versionCode`, `abi`
- `apkFileName`, `apkUrl` (`https://github.com/SAVANOo/<repo>/releases/download/v<versionName>/<apkFileName>`), `sizeBytes`, `sha256`, `releasedAt`, `changelog[]`
- `iconUrl` (`https://raw.githubusercontent.com/SAVANOo/<repo>/main/<caminho-do-icone.png>`), `tagline`, `minSdk`, `targetSdk`

## 4. Publicar o APK na Release do GitHub (via `gh`)
Pré-requisito único na máquina: `winget install --id GitHub.cli -e` e `gh auth login`.

- **Criar nova release já com o APK e manifesto:**
  ```powershell
  gh release create v1.0.0 "caminho/<app>-v1.0.0-arm64-v8a.apk" "apps/mobile/release-manifest.json" --repo SAVANOo/MEU_APP --title "Nome v1.0.0" --notes "Notas da versão"
  ```
- **Atualizar/anexar APK em release existente (`--clobber`):**
  ```powershell
  gh release upload v1.0.0 "caminho/<app>-v1.0.0-arm64-v8a.apk" "apps/mobile/release-manifest.json" --repo SAVANOo/MEU_APP --clobber
  ```

## 5. Atualizar o Catálogo da Savano Store
Na pasta `savano-store/`:
```bash
node scripts/publish-release.mjs \
  --manifest ../MEU_APP/release-manifest.json \
  --release-base-url https://github.com/SAVANOo/MEU_APP/releases/download/v1.0.0 \
  --apk caminho/<app>-v1.0.0-arm64-v8a.apk \
  --catalog catalog/catalog.json

git add catalog/catalog.json
git commit -m "chore(catalog): publica MEU_APP v1.0.0"
git push
```

O GitHub Pages de `SAVANOo/savano-store` publica automaticamente em:
`https://savanoo.github.io/savano-store/catalog/catalog.json`

## 6. Apresentação no GitHub (README & Social Preview)
- **README focado no produto:** logo centralizada, badges, imagem de showcase e tabela de benefícios no topo; arquitetura e comandos de dev dentro de `<details>`.
- **Social Preview (`1280×640px` PNG):** usar sempre a **logo oficial** do app (nunca deixar gerador de imagem inventar ícone genérico) e validar visualmente a imagem final após o recorte 2:1.

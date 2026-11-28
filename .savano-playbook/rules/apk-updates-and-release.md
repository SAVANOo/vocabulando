# APK Updates, Releases & Savano Store

**Escopo:** Apps Android distribuídos na Savano Store (`savano-cine`, `vocabulando`, etc.) e catálogo `SAVANOo/savano-store`.  
Referência operacional com comandos e snippets: [../playbooks/release-e-savano-store.md](../playbooks/release-e-savano-store.md).

## Rule 1.0 — APK Updates & Versionamento

- **Rule 1.1 — Incremento Obrigatório de Versão:** Após qualquer modificação para distribuição na Savano Store (código, ícone, manifesto ou build nativo), incrementar o patch de `versionName` (`x.y.Z`) e o `versionCode` (`major*10000 + minor*100 + patch`). Nunca reutilizar um `versionCode` já publicado ou instalado.
- **Rule 1.2 — Keystore Fora do Git & Encoding:** Nunca commitar `.jks`, `.keystore` ou `keystore.properties`. Manter a keystore em diretório externo ao repositório e gerar `keystore.properties` sempre em UTF-8 **sem BOM**.
- **Rule 1.3 — Build Android Release no Windows:** Configurar `android.overridePathCheck=true` em `android/gradle.properties`, definir `$env:JAVA_TOOL_OPTIONS = "-Dfile.encoding=UTF-8"` antes do Gradle e, ao usar CMake/Ninja (`expo-modules-core`), redirecionar `externalNativeBuild.cmake.buildStagingDirectory` de bibliotecas `com.android.library` para `C:/Temp/vcxx-${sub.name}`.
- **Rule 1.4 — ProGuard / R8 & Nome do APK:** Manter keep rules para widgets nativos (`-keep class <packageId>.** { *; }`) e `com.horcrux.svg.**` em `android/app/proguard-rules.pro`. Copiar o APK final para `<app>-v<versionName>-<abi>.apk` casando 100% com `apkFileName` e `apkUrl`.
- **Rule 1.5 — Contrato `release-manifest.json`:** Gerar `release-manifest.json` contendo `packageId`, `name`, `versionName`, `versionCode`, `abi`, `apkFileName`, `apkUrl`, `sizeBytes`, `sha256`, `signerSha256`, `releasedAt`, `changelog[]`, `iconUrl`, `tagline`, `minSdk` e `targetSdk`.
- **Rule 1.6 — Verificação Criptográfica (v2/v3 & `apksigner`):** Assinar sempre com APK Signature Scheme **v2/v3** (nunca depender só de v1) e validar o APK final com `apksigner verify --verbose --print-certs <apk>` antes de publicar, garantindo integridade e `signerSha256` consistente.

## Rule 2.0 — GitHub Releases & Catálogo Savano Store

- **Rule 2.1 — Script Único de Release:** Todo app Android do ecossistema deve manter um script unificado (ex.: `scripts/build-mobile-release.ps1`) para gerar o APK versionado, atualizar o `release-manifest.json`, publicar a release e atualizar o catálogo da Store.
- **Rule 2.2 — Publicação via `gh`:** Após subir novas releases, utilizar obrigatoriamente o GitHub CLI (`gh release create v<versionName>` ou `gh release upload --clobber`) para publicar/anexar o APK versionado e o `release-manifest.json`.
- **Rule 2.3 — Atualização do Catálogo da Savano Store:** Após publicar a release no GitHub, executar `node scripts/publish-release.mjs` no repositório `savano-store` para atualizar `catalog/catalog.json` e realizar commit/push para o GitHub Pages.
- **Rule 2.4 — Apresentação no GitHub:** Manter `README.md` focado no produto (logo, badges, showcase e benefícios no topo; arquitetura/comandos em `<details>`) e Social Preview (`1280×640px` PNG) com a logo oficial do app validada após recorte 2:1.

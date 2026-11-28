---
name: savano-android-release
description: Padrão Savano (Rule 1.0 & Rule 2.0) para incrementar versão, gerar APK release assinado (keystore externa sem BOM), gerar release-manifest.json, publicar via gh release e atualizar catalog/catalog.json da Savano Store.
---

# Savano Android Release Skill

1. **Rule 1.1:** Incrementar `versionName` (patch) e `versionCode` antes de qualquer nova distribuição na Savano Store.
2. **Rule 1.2:** Nunca commitar `.jks`, `.keystore` ou `keystore.properties` (UTF-8 **sem BOM**).
3. **Rule 1.3–1.4:** Gerar APK release com R8/ProGuard e renomear para `<app>-v<versionName>-<abi>.apk`.
4. **Rule 1.5:** Gerar `release-manifest.json` completo (`packageId`, `versionName`, `versionCode`, `sha256`, `signerSha256`, `sizeBytes`, etc.).
5. **Rule 2.2:** Publicar o APK e o manifesto na Release do GitHub via `gh release create` ou `gh release upload --clobber`.
6. **Rule 2.3:** Atualizar `savano-store/catalog/catalog.json` com `node scripts/publish-release.mjs` e fazer push.

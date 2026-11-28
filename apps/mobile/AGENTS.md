# Instruções — `@vocabulando/mobile`

Estende o `AGENTS.md` da raiz. Regras globais permanecem em `../../.savano-playbook/rules/`.

## Comandos Rápidos
- `npx expo start` — Dev server mobile
- `npx expo run:android` — Build/execução local Android
- `powershell -ExecutionPolicy Bypass -File ../../scripts/build-mobile-release.ps1 -PublishGitHub -UpdateStoreCatalog` — Release Android completo (`Rule 1.0`–`Rule 2.0`)

## Regras Específicas Mobile
- **Versionamento (`Rule 1.1`):** incrementar `expo.version` e `expo.android.versionCode` (`major*10000 + minor*100 + patch`) em `app.json` antes de cada nova distribuição na Savano Store (próximo alvo: `10002` para `1.0.2`).
- **UX & TTS (`Rule 5.5`):** envolver formulários/modais com `KeyboardAvoidingView` + `ScrollView`, evitar `<Pressable>` envolvendo áreas roláveis e configurar TTS explicitamente para `pt-BR`.

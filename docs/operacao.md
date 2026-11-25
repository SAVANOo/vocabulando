# Guia Operacional — Vocabulando

Este guia complementa [`architecture.md`](architecture.md), [`security-and-quality.md`](security-and-quality.md) e [`kanban.md`](kanban.md) com os requisitos de máquina, comandos de execução, variáveis de ambiente e fluxos de build nativo.

---

## 1. Requisitos de Ambiente

### Para API, Domínio & Web (Já prontos no Node 22+)
- **Node.js 22+** (usa `node:sqlite` nativo e execução TypeScript integrada)
- **Google Chrome ou Edge** (para suíte Playwright `npm.cmd run test:e2e:browser`)

### Para Compilação Mobile Nativa (`apps/mobile`)
- **Java JDK 17** (necessário para Gradle / AndroidX)
- **Android Studio + Android SDK** (necessário para `androidx.glance` / APK local):
  - Definir `ANDROID_HOME` = `C:\Users\<usuario>\AppData\Local\Android\Sdk`
  - Adicionar `%ANDROID_HOME%\platform-tools` e `%ANDROID_HOME%\emulator` ao `Path`
- **iOS (`WidgetKit` / Swift):** no Windows não compila localmente (exige macOS + Xcode); utilizar **EAS Build** (`eas-cli`) na nuvem da Expo.

---

## 2. Execução em Desenvolvimento (Atalho ou Terminais)

Para subir **API (`4180`) + Web (`5180`) + Expo Metro (`8081`)** em 1 clique, use o atalho **Vocabulando** na Área de Trabalho ou execute:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/launch-vocabulando.ps1
```

Ou manualmente em dois terminais na raiz do repositório:

```powershell
# Terminal 1: API local (padrão http://127.0.0.1:4180)
npm.cmd run dev:api

# Terminal 2: Interface Web Vite (padrão http://127.0.0.1:5180)
npm.cmd run dev:web
```

---

## 3. Variáveis de Ambiente Suportadas

| Variável | Uso | Padrão / Obrigatória em Produção |
| :--- | :--- | :--- |
| `VOCAB_API_PORT` | Porta HTTP da API local | `4180` |
| `VOCAB_API_URL` | URL base usada por `smoke.mjs`, `verify-features.mjs` e proxy Vite | `http://127.0.0.1:4180` |
| `VOCAB_DB_PATH` | Caminho do arquivo SQLite (testes usam caminho temporário isolado) | `data/vocabulando.db` |
| `VOCAB_JWT_SECRET` | Segredo HS256 para assinar tokens JWT (mín. 32 chars) | Efêmero em dev; **obrigatória em `NODE_ENV=production`** |
| `VOCAB_CORS_ORIGIN` | Origem Web permitida além de `localhost`/`127.0.0.1` | não definida |
| `VOCAB_LLM_API_KEY` | Chave opcional do Google Gemini para exemplos contextuais | não definida (usa fallback determinístico local) |

> Nunca registre chaves de API ou segredos no repositório ou nos arquivos de documentação.

---

## 4. Esteira de Qualidade & Testes

| Comando | Descrição |
| :--- | :--- |
| `npm.cmd run doctor` | Diagnóstico do ambiente (`0` OK, `1` avisos, `2` falha bloqueante) |
| `npm.cmd run lint` | Análise estática `oxlint` (`0` warnings / `0` errors) |
| `npm.cmd run typecheck` | Verificação TypeScript estrita (`tsc --noEmit`) |
| `npm.cmd run build` | Typecheck + bundle de produção Vite |
| `npm.cmd run test:unit` | Testes unitários (Domínio, SRS, Hábitos, JWT, Léxico, API+SQLite isolado) |
| `npm.cmd run test:e2e:isolated` | `smoke.mjs` + `verify-features.mjs` em banco temporário isolado |
| `npm.cmd run test:e2e:browser` | Suíte Playwright no Chrome contra API + banco isolado |

---

## 5. Build Mobile Nativo (AndroidX & iOS EAS)

```powershell
cd apps/mobile
npm.cmd install expo react-native expo-sqlite expo-haptics expo-notifications
npx.cmd expo prebuild --platform android
npx.cmd expo run:android
```

Para build iOS em nuvem (Windows):
```powershell
npm.cmd install -g eas-cli
eas login
eas build:configure
eas build -p ios --profile preview
```

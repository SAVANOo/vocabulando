# Vocabulando

> **Beleza contemplativa na superfície; motor cognitivo de retenção por baixo.**

Aplicativo multiplataforma (Mobile Nativo-First em **React Native / Expo** + **Web App** em React/Vite + **API Hardened** em Node.js) focado no ensino diário de novas palavras e expansão de repertório linguístico em Português (preparado para multi-idioma). Une a leveza editorial de um flashcard minimalista à retenção baseada em ciência cognitiva (**SRS**), **ofensiva gentil** e **Widgets nativos**.

---

## Por que o Vocabulando? (Diferenciais & Ganhos)

- **Foco sem Poluição (*Progressive Disclosure*):** frente do card limpa (palavra, fonética IPA, pronúncia falada e 1 definição curta); ao tocar, o card vira em **3D** revelando exemplo real, etimologia visual e sinônimos por contexto.
- **Retenção Real sem Fadiga:** algoritmo de Repetição Espaçada (**SRS**) aliado a ofensivas leves (*3 palavras ou 1 desafio por dia*) com **Escudo de Pausa (*Freeze*)** — sem punição com "vidas" nem paywall bloqueante.
- **Prática Ativa & Nuance:** **Jogo de Sinônimos**, **Quiz Contextual**, **Desafio de Parônimos** (*ratificar vs. retificar*, *iminente vs. eminente*) e **Refinador Lexical** na Web.
- **Offline-First & Privacidade (LGPD):** banco local `expo-sqlite` no celular com fila de eventos idempotentes, cache de 14 dias para **Widgets AndroidX (`Jetpack Glance`)** e **iOS (`WidgetKit`)**, zero vazamento de stack traces (`SafeErrorBoundary`) e exportação/exclusão LGPD.
- **Sem Custo de IA Obrigatória:** conector de **Dicionários Públicos** (`freedictionaryapi.com` + `dicionario-aberto.net`) com cache em SQLite e fallback determinístico local.

---

## Principais Funcionalidades

- **Mobile (`apps/mobile`):** Abertura **I4**, temas **Dia (*Sálvia & Papel*) / Noite (*Noturno Suave*)**, Modo Noturno Automático, Onboarding personalizado (com dedicação de 2/3/5 palavras), Tutorial Guiado, Flashcard 3D com swipe contínuo + áudio na palavra e na frase, **Modo Trajeto (áudio mãos-livres)**, **Trilha Infinita (`LearningPath`)** com 10 atividades (Escuta, Sinônimos, Substitua o Genérico, Escrita, Use na Sua Frase, Radar de Confusão, Parônimos, Desafio 60s e Revisão), **Importador de Leituras**, **Biblioteca Ex-Libris**, `expo-sqlite` com **10.000 palavras PT-BR** em pacotes temáticos + Sync Bidirecional e **Widget AndroidX (`Jetpack Glance`) interativo** ("Já sei ✓" / "Outra ↻").
- **Web (`apps/web`):** Feed por trilhas, seletor multi-idioma (`pt-BR`, `en-US`, `es-ES`), busca em Dicionários Públicos, geração de card **PNG 1080×1080**, Micro-Quiz & Revisão, Coleções personalizadas, Refinador Lexical, **Conta (`Register`/`Login` com `scrypt`) + LGPD** e **Painel Admin (RBAC)** com métricas do acervo (10k palavras / 60k slots).
- **API (`apps/api`):** HTTP *hardened* com `node:sqlite`, **JWT HS256** (*fail-fast* em produção), `scrypt`, namespace `/api/admin/*` (`403` não-admin), validação estrita **Zod**, rate limit com *eviction*, SSRF guard, `/api/packs/:theme`, `/api/me/sync`, telemetria (`analytics_events`) e logger JSONL único com `X-Request-Id`.

---

## Requisitos para Rodar Localmente

- **API, Domínio & Web:**
  - **Node.js 22+** (usa `node:sqlite` e `node:test` nativos)
  - **Google Chrome ou Edge** (para suíte E2E + auditoria WCAG AA via `@axe-core/playwright`)
- **Mobile Nativo Android (Widgets Jetpack Glance):**
  - **Java JDK 17** (`JAVA_HOME`)
  - **Android Studio + Android SDK** (`ANDROID_HOME` + `platform-tools` e `emulator` no `Path`)
- **iOS (`WidgetKit`):** no Windows exige **EAS Build** (`eas-cli`) na nuvem da Expo.

---

## Instalação e Primeiro Uso

1. Instale as dependências do monorepo na raiz:
   ```powershell
   npm.cmd install
   ```
2. Verifique a saúde do ambiente:
   ```powershell
   npm.cmd run doctor
   ```
3. **Subir tudo com 1 clique** (API `4180` + Web `5180` + Expo Metro `8081 --android`):
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/launch-vocabulando.ps1
   ```
   *(Ou use o atalho **Vocabulando** na Área de Trabalho.)*
4. **Instalar a Development Build nativa com o Widget AndroidX no Emulador:**
   ```powershell
   cd apps/mobile
   npx.cmd expo run:android
   ```

---

## Esteira de Qualidade & Testes

| Comando | Descrição |
| :--- | :--- |
| `npm.cmd run doctor` | Diagnóstico de ambiente (`0` OK, `1` avisos, `2` bloqueante) |
| `npm.cmd run lint` | Análise estática `oxlint` (`0` warnings / `0` errors) |
| `npm.cmd run typecheck` | Verificação estrita TypeScript (`tsc --noEmit`) |
| `npm.cmd run build` | Typecheck + bundle de produção Vite |
| `npm.cmd run test:unit` | Testes unitários (Domínio, SRS, Hábitos, JWT, Léxico, API+SQLite isolado) |
| `npm.cmd run test:e2e:isolated` | `smoke.mjs` + `verify-features.mjs` contra banco temporário isolado |
| `npm.cmd run test:e2e:browser` | Suíte Playwright no Chrome + auditoria WCAG AA (`@axe-core/playwright`) |

---

## Documentação Complementar

- [Guia Operacional & Variáveis de Ambiente](docs/operacao.md)
- [Arquitetura do Projeto](docs/architecture.md)
- [Segurança e Qualidade (Regras Inegociáveis)](docs/security-and-quality.md)
- [Kanban Operacional](docs/kanban.md)
- [Backlog Exploratório (Melhoria Contínua)](docs/backlog-exploratorio.md)

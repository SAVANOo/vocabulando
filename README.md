<div align="center">

<img src="apps/mobile/assets/logo.png" alt="Logo do Vocabulando" width="92" />

# Vocabulando

### *Domine novas palavras todos os dias — com leveza editorial e ciência de retenção.*

[![Release](https://img.shields.io/badge/release-v1.0.0-4E9F76?style=for-the-badge)](https://github.com/SAVANOo/vocabulando/releases)
[![Android](https://img.shields.io/badge/Android-APK%20arm64--v8a-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/SAVANOo/vocabulando/releases)
[![Offline First](https://img.shields.io/badge/Offline--First-SQLite%2010k%20palavras-1E242B?style=for-the-badge)](apps/mobile/release-manifest.json)
[![React Native](https://img.shields.io/badge/Expo%20%2F%20React%20Native-Mobile%20%2B%20Web-0F172A?style=for-the-badge&logo=react)](apps/mobile)

<br />

<img src="docs/assets/vocabulando-showcase.jpg" alt="Demonstração do Vocabulando no Android: Card 3D e Trilha de Aprendizado" width="100%" />

</div>

---

## ✨ O que é o Vocabulando?

O **Vocabulando** transforma o hábito de ampliar seu vocabulário em uma experiência visual limpa, rápida e viciante — **sem poluição, sem "vidas" punitivas e funcionando 100% offline**.

Em poucos minutos por dia, você descobre palavras novas em Português, ouve a pronúncia natural em **PT-BR**, explora a origem etimológica e consolida tudo em sessões guiadas com repetição espaçada (**SRS**).

---

## 🎯 Destaques da Experiência

| Recurso | Como funciona na prática |
| :--- | :--- |
| 🃏 **Card 3D Focado** | Frente limpa com palavra, fonética IPA, áudio **PT-BR** e definição direta. Vire o card para explorar frase de contexto, rede etimológica e sinônimos. |
| 🗺️ **Trilha Conectada por Unidades** | Progrida passo a passo por unidades temáticas ilustradas, com barra de acompanhamento, fila de **correção de erros no final** e resumo com XP e precisão. |
| 🎧 **Modo Trajeto (Mãos-Livres)** | Ouça palavras, definições e exemplos em sequência enquanto caminha ou dirige. |
| 📱 **Widget Nativo na Tela Inicial** | Widget Android (*Jetpack Glance*) com palavra do dia e ações rápidas sem nem abrir o app. |
| 🪶 **Ofensiva Gentil** | Metas leves configuráveis (2, 3 ou 5 palavras/dia) com **Escudo de Pausa** automático para dias corridos. |
| 📚 **Acervo Offline + Dicionário** | Base local em SQLite com **10.000 palavras**, busca instantânea, importador de leituras e estante de favoritas. |
| 🌐 **Versão Web + Refinador Lexical** | Feed multi-idioma (`pt-BR`, `en-US`, `es-ES`), exportação de cards em PNG 1080×1080, coleções e refinador de texto. |

---

## 📲 Download (Android v1.0.0)

- Baixe o APK oficial assinado (`arm64-v8a`) na aba **[Releases do GitHub](https://github.com/SAVANOo/vocabulando/releases)**.
- Metadados e `SHA-256` da versão para distribuição em loja própria: [`apps/mobile/release-manifest.json`](apps/mobile/release-manifest.json).

---

<details>
<summary>🛠️ <strong>Detalhes Técnicos, Arquitetura & Como Rodar Localmente</strong></summary>

### Arquitetura do Monorepo
- `apps/mobile` — App nativo React Native / Expo + SQLite offline + Widget Android (*Jetpack Glance*)
- `apps/web` — Web App React + Vite (WCAG AA auditado via `@axe-core/playwright`)
- `apps/api` — API Node.js com `node:sqlite`, autenticação `JWT HS256` + `scrypt`, RBAC admin e sync offline
- `packages/domain` — Regras puras de SRS, ofensivas, ranks, validação Zod e geradores de quiz

### Requisitos
- **Node.js 22+** (para API, Domínio, Web e testes)
- **Java JDK 17+** e **Android SDK** (para compilar o APK Android nativo)

### Rodar localmente
```powershell
npm.cmd install
npm.cmd run doctor
powershell -ExecutionPolicy Bypass -File scripts/launch-vocabulando.ps1
```

### Comandos de Qualidade & Testes
| Comando | O que valida |
| :--- | :--- |
| `npm.cmd run lint` | Análise estática `oxlint` (`0` warnings / `0` errors) |
| `npm.cmd run typecheck` | Verificação estrita TypeScript (`tsc --noEmit`) |
| `npm.cmd run build` | Typecheck + bundle de produção Web |
| `npm.cmd run test:unit` | Suíte unitária (Domínio, SRS, Hábitos, JWT, Léxico, API+SQLite) |
| `npm.cmd run test:e2e:isolated` | Smoke & feature verification em banco temporário isolado |
| `npm.cmd run test:e2e:browser` | Playwright E2E + auditoria de acessibilidade WCAG AA |

### Documentação Interna
- [Arquitetura do Projeto](docs/architecture.md)
- [Guia Operacional & Variáveis de Ambiente](docs/operacao.md)
- [Segurança e Qualidade](docs/security-and-quality.md)
- [Kanban Operacional](docs/kanban.md)
- [Backlog Exploratório](docs/backlog-exploratorio.md)

</details>

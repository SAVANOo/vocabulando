# Arquitetura do Vocabulando

## 1. Objetivo e Decisões Fundacionais

Construir um ecossistema de aprendizado lexical que nasça **Mobile Nativo-First** (aproveitando Widgets, notificações ricas, áudio em cache e resposta tátil) e evolua sem reescrita para uma **Plataforma Web** compartilhando regras de domínio, autenticação e sincronização de progresso em tempo real.

- **Idioma (PT-BR First, Multi-idioma Ready):** o MVP foca 100% em **Português (BR)**, mas toda entidade lexical (`WordEntry`) nasce com `language_code` (`'pt-BR'`), `phonetic_ipa` e trilhas filtráveis por idioma, permitindo adicionar Inglês/Espanhol no futuro apenas como novos pacotes de dados.
- **Stack Mobile Escolhida — React Native (Expo) + Módulos Nativos para Widgets:** é o ponto de equilíbrio entre a **sensação nativa real** (60–120 FPS sem WebView, haptics diretos, player nativo) e o **reaproveitamento do ecossistema TypeScript/React** (lógica de domínio `packages/domain`, Zod, testes e futura expansão Web sem duplicar regras de negócio).

---

## 2. Limites de Responsabilidade (Clean Architecture)

### Domínio (`packages/domain`)
Regras puras, 100% independentes de framework, UI ou banco de dados, cobertas por testes unitários rápidos:
- Entidades: `WordEntry`, `EtymologyRoot`, `Collection`, `UserProgress`, `ReviewCard`
- Motor de Repetição Espaçada (**SRS / FSRS**): cálculo de estabilidade, dificuldade e próxima data de revisão
- Motor de Hábitos: cálculo de ofensiva (*streak*), *Streak Freeze* e XP por profundidade de domínio
- Contratos de eventos idempotentes (`WORD_VIEWED`, `QUIZ_ANSWERED`, `WORD_SAVED`)

### Aplicação
Orquestra casos de uso sem depender de detalhes de UI:
- Carregar lote diário do feed (respeitando nível, categorias e histórico)
- Registrar interação offline na fila local e disparar sincronização
- Gerar micro-quizzes contextuais a partir de palavras vistas/erradas
- Orquestrar geração e cache de exemplos contextuais via IA (V2)

### Infraestrutura
Detalhes substituíveis isolados atrás de interfaces:
- **Mobile:** SQLite local (`expo-sqlite`) com núcleo inicial de 1.000 palavras + pacotes temáticos sob demanda (`data/packs/theme-*.json` de 10.000 palavras PT-BR enriquecidas com Tatoeba), `SharedPreferences` + **Jetpack Glance** (Widget Android interativo) e `expo-speech` / `expo-audio`.
- **Backend:** API Node.js *hardened* com `node:sqlite` (`lexicon_words`, `learning_activities`, `analytics_events`, `srs_cards`, `users` com `scrypt` e `role` RBAC), endpoints paginados (`/api/lexicon/words`, `/api/packs/:theme`, `/api/me/sync`, `/api/admin/*`).
- **IA (Futura V2):** Adaptador de LLM opcional com sanitização de entrada, timeout estrito e cache semântico.

### Apresentação
- **Mobile:** React Native (Expo) + Design System SVG (`AppIcon.tsx` + `themesConfig.ts`) + módulo nativo AndroidX Glance.
- **Web:** React + Vite compartilhando `packages/domain`, com auditoria automatizada WCAG AA (`@axe-core/playwright`).

---

## 3. Estratégia Offline-First, Pacotes Temáticos e Sync Bidirecional

1. **Núcleo Enxuto + Pacotes sob Demanda:** Em vez de carregar um JSON monolítico no boot, o Mobile inicia com `lexicon-core.json` (1.000 palavras) no SQLite e baixa pacotes temáticos (*Cinema & Arte*, *Escola*, *Férias & Praia*, *Trabalho*, *Tecnologia*, *Saúde*, *Gastronomia*) via `/api/packs/:theme`.
2. **Cache dedicado para Widgets:** Os próximos 14 dias ficam pré-materializados no armazenamento compartilhado do SO com ações diretas ("Já sei ✓" / "Outra ↻") — garantindo que o widget funcione mesmo offline.
3. **Eventos Imutáveis Idempotentes & Sync Bidirecional:**
   - Toda ação gera um evento local com `event_id` (UUID v4) e `occurred_at` (ISO-8601 UTC).
   - O backend deduplica por `event_id`, e o Mobile converge progresso da Web via `GET /api/me/sync`.

# Kanban do Vocabulando

Este arquivo é o roteiro operacional completo do projeto. Cada cartão foi quebrado em uma entrega pequena, observável e testável, pronta para ser puxada uma a uma.

---

## Em andamento

| ID | Prioridade | Cartão | Próxima verificação |
| :--- | :--- | :--- | :--- |
| — | — | Nenhum cartão pendente no ciclo atual | Fundação, API hardened, Acervo 5.000 palavras / 30k atividades, Painel Admin Web e Mobile validados |

---

## Ciclo 9 — Física Tátil, Prática Livre, Importador de Leituras & Sync Bidirecional (Concluído)

| ID | Prioridade | Cartão | Resultado esperado / Critério de verificação |
| :--- | :--- | :--- | :--- |
| `C9-01` | P0 | **Física Contínua no Swipe do Card & Marcos de Ofensiva** | `StudyFlipCard` inclina em tempo real durante o arraste (`dragTilt`) e `StreakModal` celebra marcos (`1d`, `7d`, `30d`, `100d`) |
| `C9-02` | P1 | **Prática Livre ("Use na Sua Frase") & Desafio 60s** | `FreeWritingChallenge` avalia frases autorais do usuário e `TimedSprintChallenge` treina reflexo lexical em 60s |
| `C9-03` | P1 | **Importador de Leituras ("Cole um Trecho")** | `ReadingImporterModal` escaneia textos colados contra o acervo local e permite salvar palavras com 1 toque |
| `C9-04` | P0 | **Sync Bidirecional Mobile ↔ Web (`GET /api/me/sync`)** | Endpoint `/api/me/sync` + `pullRemoteProgress` convergindo XP, favoritos e cards entre Mobile e Web |

---

## Ciclo 8 — Identidade Editorial, Enriquecimento Tatoeba & Engajamento (Concluído)

| ID | Prioridade | Cartão | Resultado esperado / Critério de verificação |
| :--- | :--- | :--- | :--- |
| `C8-01` | P0 | **Enriquecimento Real com Tatoeba PT (`enrich_lexicon_packs.py`)** | Corpus `por_sentences` (`446.059` frases) elevou exemplos reais para `6.297` palavras e sinônimos para `9.998` |
| `C8-02` | P0 | **Widget Android Interativo (`MarkWidgetWordAction` + `NextWidgetWordAction`)** | Botões "Já sei ✓" e "Outra ↻" direto no Jetpack Glance sem precisar abrir o app |
| `C8-03` | P1 | **Modo "Substitua o Genérico" & Radar de Confusão Contrastivo** | Elevação lexical com Termômetro de Tom e duelo lado a lado de pares parecidos integrados à Trilha |
| `C8-04` | P1 | **Áudio na Frase, Modo Trajeto & Biblioteca Ex-Libris** | Leitura da frase no card com velocidade `0.85x`/`1.0x`, `CommuteAudioModal` mãos-livres e `ExLibrisShelfModal` com selos por tema |
| `C8-05` | P1 | **Calibragem Automática pela Telemetria** | Sugestão automática de avanço de nível (>90% de precisão) ou revisão etimológica (<1,5s/card) |

---

## Ciclo 7 — Dados PT-BR Reais (10k), Pacotes Temáticos, Tematização Visual & Animações (Concluído)

| ID | Prioridade | Cartão | Resultado esperado / Critério de verificação |
| :--- | :--- | :--- | :--- |
| `C7-01` | P0 | **Extrator PT-BR (`pt.wiktionary.org`) & Pacotes Temáticos (`10.000` palavras)** | `data/packs/theme-*.json` + `lexicon-core.json` (1k no boot), zero definições em inglês e 8 temas do cotidiano (*Cinema*, *Escola*, *Férias & Praia*, *Trabalho*, *Tecnologia*, *Saúde*, *Gastronomia*, *Geral*) |
| `C7-02` | P0 | **Motor Adaptativo Dinâmico (`computeAdaptiveWordWeight` + `selectDynamicActivityFormat`)** | Palavras erradas retornam mais vezes e em formatos variados (áudio, escrita, sinônimo, lacuna) |
| `C7-03` | P1 | **Tematização Visual Coesa (`themesConfig.ts`)** | Cards exibem ícone e acento sutil do tema da palavra mantendo a identidade *Sálvia & Papel / Noturno Suave* |
| `C7-04` | P1 | **Animações Expressivas v1 (`CelebrationPopup` + `MascotLikeSvg` + Pulso na Trilha + Transição de Abas)** | Explosão radial de estrelas, mascote dando "like!", nó pendente pulsando na trilha e fade suave entre abas |

---

## Frente de Exploração — Mundo das Animações (Próximo Ciclo)

| ID | Prioridade | Cartão | Resultado esperado / Critério de verificação |
| :--- | :--- | :--- | :--- |
| `AN-01` | P1 | **Mascote Expressivo Reativo (Lottie / Rive / SVG Morph)** | Reações animadas do mascote para acerto consecutivo, dica revelada, erro acolhedor e conclusão da meta |
| `AN-02` | P1 | **Micro-Confetes & Marcos de Ofensiva (7 / 30 / 100 dias)** | Celebração em tela cheia com partículas físicas ao atingir marcos de sequência no `StreakModal` |
| `AN-03` | P2 | **Gestos Físicos Contínuos no Card & Árvore Etimológica Animada** | Card acompanhando o dedo em tempo real no swipe e expansão animada dos radicais em `EtymologyNetwork` |

---

## Ciclo 6 — Acervo 5.000 Palavras (30k Atividades), Painel Admin Web, Etimologia Visual & Retenção (Concluído)

| ID | Prioridade | Cartão | Resultado esperado / Critério de verificação |
| :--- | :--- | :--- | :--- |
| `C6-01` | P0 | **Acervo 5.000 Palavras PT-BR + 30.000 Atividades (`data/lexicon-5000.json`)** | Streaming Kaikki PT + SQLite (`lexicon_words`: 5.000, `learning_activities`: 30.000 em 6 modalidades) na API e no Mobile |
| `C6-02` | P0 | **Design System SVG (`AppIcon`), Trilha Infinita & Mistura de Revisão** | Ícones SVG unificados, `LearningPath` com scroll infinito e popover, `buildMixedPracticeQueue` alternando palavras novas e aprendidas |
| `C6-03` | P1 | **Página de Ofensiva (`StreakModal`), Destaque de Palavra & Etimologia Visual** | Modal dedicado para ofensiva/escudos, destaque para nova palavra dominada, `EtymologyNetwork` e compartilhamento de card |
| `C6-04` | P1 | **Painel Administrativo Web (RBAC) & Retenção Inteligente** | Aba `Admin` na Web (`/api/admin/stats` + logs), detecção de passividade, modo noturno automático e dicionário local 5k |

---

## Ciclo 5 — Refinamento UX/UI, RBAC Admin, Telemetria & Qualidade E2E (Concluído)

| ID | Prioridade | Cartão | Resultado esperado / Critério de verificação |
| :--- | :--- | :--- | :--- |
| `C5-01` | P0 | **Quiz Contextual Flexionado (`buildQuizBlank`) + Cor de Erro (`danger`)** | Lacuna `_______` gerada mesmo com flexões (*pragmática*, *ubíquos*) e feedback de erro em vermelho suave (`palette.danger`) |
| `C5-02` | P0 | **Widget Android Dark Mode (*Noturno Suave*)** | `VocabulandoGlanceWidget` respeita `UI_MODE_NIGHT_YES` e `widget_theme_mode` do app |
| `C5-03` | P1 | **Header com Logo I4 + Avatar Perfil + Navbar Animada (3 abas)** | Logo oficial I4 no topo, bolinha de Perfil no canto superior direito e navbar inferior animada com ícones (`Início`, `Trilha`, `Progresso`) |
| `C5-04` | P1 | **Trilha Guiada, Parônimos Centralizados, Favorito Bandeira & Slide** | `LearningPath` na aba Trilha, `ParonymChallenge` centralizado, ícone de bandeira no card e animação horizontal de troca |
| `C5-05` | P1 | **Onboarding Dedicação (2/3/5), Progresso Rico & Tooltips/A11y** | Passo de dedicação diária, gráfico semanal + barra de Rank + precisão, tooltips `?` e `accessibilityRole`/`accessibilityLabel` |
| `C5-06` | P0 | **Registro/Login (`scrypt`), Namespace `/api/admin/*` & Telemetria** | `/api/auth/register` & `/api/auth/login`, `/api/admin/stats` & `/api/admin/logs/errors` (403 não-admin) e `analytics_events` |

---

## Ciclo 1 — Fundação, Segurança & Domínio Puro (Pré-requisito)

| ID | Prioridade | Cartão | Resultado esperado / Critério de verificação |
| :--- | :--- | :--- | :--- |
| `C1-01` | P0 | **Setup do Monorepo + Esteira de Qualidade** | `package.json` workspaces, `oxlint`, `tsconfig` estrito, script `doctor` (`0`/`1`/`2`) e runner `node --test` rodando com 0 erros |
| `C1-02` | P0 | **Domínio Puro: Entidades Lexicais (`language_code`, `register`, `etymology`) + Zod** | `packages/domain` com schemas estritos preparados para PT-BR e futuros idiomas + testes unitários |
| `C1-03` | P0 | **Domínio Puro: Motor SRS (FSRS/SM-2) + Streak Gentil + XP** | Cálculo determinístico de revisão, ofensiva com *Freeze* e XP por profundidade + 100% coberto por testes unitários |
| `C1-04` | P0 | **SQLite Offline-First + Fila de Eventos Idempotentes** | Migrações iniciais, deduplicação por `event_id` (UUID) e testes em banco temporário isolado (`VOCAB_DB_PATH`) |
| `C1-05` | P0 | **API Base Hardened (Fastify + Segurança)** | Validação Zod em todas as rotas, CORS restritivo, headers defensivos, rate limit, logs JSONL + `smoke` e `verify` passando |
| `C1-06` | P1 | **Autenticação Sem Fricção (*Guest* -> Conta) + LGPD** | Entrada imediata como convidado, vínculo posterior Apple/Google/E-mail sem perda de progresso + exportação/exclusão de dados |

---

## Ciclo 2 — MVP Mobile (v1.0: Experiência Tátil & Hábito Diário)

| ID | Prioridade | Cartão | Resultado esperado / Critério de verificação |
| :--- | :--- | :--- | :--- |
| `C2-01` | P0 | **Design System & Tokens Visuais** | Paleta editorial (claro/escuro), tipografia escalável (*Dynamic Type*), contraste WCAG AA (4.5:1) e componentes primitivos |
| `C2-02` | P0 | **Onboarding Rápido (≤ 4 passos)** | Escolha de objetivo, trilhas, nível e horário de notificação — sem paywall bloqueante ao final |
| `C2-03` | P0 | **Feed Vertical Minimalista (60–120 FPS)** | Cards em tela cheia com *snap* suave, haptic feedback, etimologia resumida e registro offline anti-repetição |
| `C2-04` | P0 | **Áudio de Pronúncia Instantâneo** | Reprodução em 1 toque via CDN com cache local em disco e fallback automático para TTS nativo do SO |
| `C2-05` | P0 | **Curadoria Inicial PT-BR (Trilhas & Níveis)** | Lote inicial curado e validado (*Essencial Culto*, *Comunicação Executiva*, *Redação & Argumentação*, *Literário*) |
| `C2-06` | P1 | **Favoritos, Coleções & Histórico** | Salvar palavras, criar coleções personalizadas e consultar histórico offline com busca rápida |
| `C2-07` | P1 | **Micro-Quizzes Contextuais** | Desafios de 3 cartas (completar frase / escolher sinônimo adequado) integrados a cada 6–8 cards ou em modo "1 min" |
| `C2-08` | P1 | **Notificações Inteligentes (Rich Push)** | Lembrete diário no horário preferido exibindo a Palavra do Dia e definição curta direto na notificação |
| `C2-09` | P2 | **Compartilhamento Viral de Card** | Geração local de imagem estilizada da palavra (Stories/WhatsApp) com marca discreta |

---

## Ciclo 3 — V2 Mobile (Retenção Profunda, Widgets Nativos & IA)

| ID | Prioridade | Cartão | Resultado esperado / Critério de verificação |
| :--- | :--- | :--- | :--- |
| `C3-01` | P0 | **Widgets Nativos iOS (`WidgetKit`)** | Widgets Home e Lock Screen lendo cache pré-populado de 14 dias via *App Group* (zero tela preta/sem rede) |
| `C3-02` | P0 | **Widgets Nativos Android (`Jetpack Glance`)** | Widgets responsivos lendo armazenamento local compartilhado de 14 dias com atualização em background |
| `C3-03` | P1 | **Motor SRS Integrado ao Feed & Modo Revisão** | Palavras favoritadas/erradas retornam na janela ótima de memória; modo "Revisão Rápida (1 min)" |
| `C3-04` | P1 | **Ofensiva Gentil (*Streak* + Escudo + Marcos)** | Meta diária leve (3 palavras ou 1 quiz), escudo de fim de semana e celebrações de 7/30/100 dias |
| `C3-05` | P1 | **Etimologia Visual em Rede** | Visualização interativa conectando prefixos, radicais gregos/latinos e sufixos a palavras irmãs |
| `C3-06` | P1 | **Termômetro de Registro & Nuance** | Indicador de formalidade (*Coloquial ↔ Neutro ↔ Executivo ↔ Literário*) e carga emocional dos sinônimos |
| `C3-07` | P1 | **Modo "Palavra no Contexto" com IA** | Exemplos gerados sob medida para a área/interesse do usuário, com sanitização, cache semântico e rate limit |
| `C3-08` | P2 | **Prática Ativa de Escrita com IA** | Usuário escreve frase própria usando a palavra e recebe feedback construtivo de precisão semântica |
| `C3-09` | P2 | **Monetização Ética (Freemium Honesto)** | Núcleo diário gratuito completo; Plano Pro para IA ilimitada, coleções ilimitadas, offline total e relatórios |

---

## Ciclo 4 — Expansão Web & Multi-Idioma

| ID | Prioridade | Cartão | Resultado esperado / Critério de verificação |
| :--- | :--- | :--- | :--- |
| `C4-01` | P1 | **Plataforma Web (Next.js) + Sync em Tempo Real** | Web app compartilhando `packages/domain`, login unificado e convergência automática de progresso com o mobile |
| `C4-02` | P2 | **Refinador de Textos na Web** | Usuário cola um e-mail/texto e recebe sugestões de substituição lexical mais precisa com explicação de nuance |
| `C4-03` | P2 | **Expansão Multi-Idioma (EN / ES)** | Ativação de trilhas em novos idiomas usando o campo `language_code` já estruturado no schema |

---

## Ciclo Contínuo — Qualidade, Segurança & Melhoria Contínua

| ID | Prioridade | Cartão | Resultado esperado / Critério de verificação |
| :--- | :--- | :--- | :--- |
| `CC-01` | Contínuo | **Suíte E2E Isolada (`VOCAB_DB_PATH`)** | Fluxos críticos testados ponta a ponta contra banco temporário limpo a cada release |
| `CC-02` | Contínuo | **Auditoria de Acessibilidade (WCAG AA)** | Checagem de VoiceOver/TalkBack, contraste ≥ 4.5:1 e *Dynamic Type* sem quebra de layout |
| `CC-03` | Contínuo | **Benchmark de Performance** | Cold start < 1,2s, feed estável a 60–120 FPS e tamanho de bundle monitorado |
| `CC-04` | Contínuo | **Observabilidade & Calibragem Pedagógica** | Análise de taxa de acerto por intervalo SRS e saúde de áudio/IA retroalimentando [`backlog-exploratorio.md`](backlog-exploratorio.md) |

---

## Concluído

- **Ciclo 1–3 & Qualidade Contínua Concluídos**:
  - Fundação (`packages/domain`), API *hardened* (`JWT HS256` + *fail-fast*, rate limit com *eviction*, logger JSONL único com `X-Request-Id`, telemetria sanitizada e LGPD `export`/`delete`).
  - Conector de Dicionários Públicos (`freedictionaryapi.com` + `dicionario-aberto.net` com cache SQLite e SSRF guard) integrado na Web e no Mobile.
  - Web App (`apps/web`) com Onboarding, Feed multi-idioma (`pt-BR`/`en-US`/`es-ES`), PNG export, Quiz/SRS, Coleções, Refinador Lexical, `SafeErrorBoundary` e auditoria WCAG AA (`@axe-core/playwright`).
  - Mobile (`apps/mobile`) com Abertura **I4**, Identidade Dia/Noite, Flashcard 3D, Áudio TTS, 4 sons `.wav`, Jogo de Sinônimos, Desafio de Parônimos, Tutorial Guiado, `expo-sqlite` offline + sync, Notificações agendadas e **Widget Nativo AndroidX Jetpack Glance** (`withVocabulandoWidget.js` compilado com Gradle `:app:compileDebugKotlin`).

---

## Regras do quadro

1. **Segurança e Qualidade são inegociáveis:** nenhum cartão fecha com warnings de lint, falhas de tipagem ou sem testes.
2. **Commits pequenos e verificáveis:** cada cartão concluído gera um commit atômico com mensagem clara.
3. **Banco isolado em testes:** testes automatizados nunca tocam dados locais reais.
4. **Explicação exaustiva:** documentar decisões, trade-offs e passos de verificação em cada entrega.
5. **Melhoria contínua:** qualquer lacuna técnica, risco ou ideia nova entra imediatamente em [`docs/backlog-exploratorio.md`](backlog-exploratorio.md).

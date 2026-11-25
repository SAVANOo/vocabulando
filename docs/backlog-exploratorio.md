# Backlog Exploratório — Melhoria Contínua

Espaço vivo para registrar hipóteses de produto, melhorias de retenção, refatorações preventivas, riscos mapeados e lacunas identificadas antes e durante a execução do **Vocabulando**.

---

## 1. Pontos de Melhoria Mapeados desde a Concepção

### Experiência & Retenção (Anti-Fadiga)
- **Detecção de "Scroll Automático" (Passividade Excessiva):** se o usuário deslizar 10 palavras em menos de 15 segundos, sugerir gentilmente 1 micro-quiz de 20s ou destacar a etimologia para transformar leitura superficial em retenção.
- **Horário Adaptativo de Notificação:** em vez de manter um horário fixo para sempre, ajustar a janela de push conforme o horário real em que o usuário costuma abrir o app.
- **Modo "Silencioso / Leitura Noturna":** alternar automaticamente para tema escuro suave e desativar sons ao detectar uso noturno, mantendo apenas haptics leves.

### Pedagogia & Conteúdo (PT-BR e Futuro Multi-Idioma)
- **Curadoria Anti-Esoterismo:** equilibrar palavras raras/poéticas com vocabulário de **alta utilidade real** (reuniões, redação, argumentação, leitura crítica), evitando listas desconectadas do uso cotidiano.
- **Parônimos e Falsos Cognatos:** micro-cards comparando pares que geram dúvida real no português (*ratificar vs. retificar*, *iminente vs. eminente*, *discrição vs. descrição*, *comprimento vs. cumprimento*).
- **Variação Regional & Lusofonia:** sinalizar quando um termo tem uso específico (PT-BR vs. PT-PT) na preparação multi-idioma.

### Engenharia, Offline & Segurança
- **Prevenção de "Widget Tela Preta":** além do cache local de 14 dias, manter uma palavra de fallback embutida no binário nativo caso o container compartilhado ainda não tenha sido populado no primeiro boot.
- **Budget de Custos de IA (V2):** cachear respostas de exemplos contextuais por `(word_id, context_profile)` no PostgreSQL/Redis para que 80%+ das requisições de IA sejam servidas do cache em < 50ms sem custo repetido de LLM.
- **Degradação Graciosa de Áudio:** se o áudio em CDN falhar ou estiver sem cache offline, acionar TTS nativo do sistema operacional sem exibir erro bloqueante ao usuário.
- **Sanitização de Prompts (Prompt Injection):** no modo "Prática Ativa de Escrita" (V2), isolar o texto digitado pelo usuário em delimitadores estritos e validar tamanho máximo antes de enviar ao LLM.

---

## 2. Ideias Futuras (Pós-V2 / Escala)

1. **Desafios entre Amigos (Sem Ligas Tóxicas):** compartilhar uma "Palavra da Semana" ou duelo rápido de 5 perguntas sem ranking punitivo.
2. **Importação de Leituras (Kindle / Artigos):** salvar uma palavra desconhecida lida fora do app e jogá-la direto na fila do SRS do *Vocabulando*.
3. **Live Activities (iOS) / Notificação Fixa Opcional:** mini-sessão de revisão rápida na tela bloqueada durante o trajeto.
4. **Modo Professor / Turmas:** trilhas compartilhadas para preparação de vestibulares, ENEM e concursos.

---

## 3. Registro de Achados em Uso Real & Resoluções (Ciclo 5)

- **Erro no Quiz exibido em verde:** corrigido usando `palette.danger` para erros e `palette.success` para acertos.
- **Lacuna ausente em exemplos flexionados:** criado `buildQuizBlank` em `@vocabulando/domain` com normalização de acentos e casamento de radical para flexões (*pragmática*, *ubíquos*), coberto por testes em todas as 20 palavras do léxico mobile.
- **Widget Android claro no modo escuro:** `VocabulandoGlanceWidget.kt` atualizado para detectar modo escuro do sistema ou preferência salva (`widget_theme_mode`).
- **Navegação & Ergonomia Mobile:** avatar de Perfil movido para o canto superior direito, logo I4 integrada ao cabeçalho, barra inferior reduzida para 3 abas com ícones + indicador animado, `ParonymChallenge` centralizado, paginação abaixo do card, ícone de bandeira para favoritar e botões em pílula para Dicionário/Trilhas/Nível.
- **Autenticação, Admin & Telemetria:** adicionados `/api/auth/register`, `/api/auth/login` (`scrypt`), namespace `/api/admin/*` protegido por `role === 'admin'`, e tabela `analytics_events` no SQLite (API e Mobile) registrando eventos e tempo de permanência.

---

## 4. Frente de Exploração: Mundo das Animações & Tematização (Ciclo 7+)

- **Animações já ativas:**
  - Explosão radial de 8 estrelas + mascote livro-sábio dando "like!" em `CelebrationPopup.tsx`.
  - Pulso contínuo no próximo nó pendente da trilha em `LearningPath.tsx`.
  - Transição animada entre abas (`tabContentFade` + `tabSlideAnim`) e transição suave ao abrir exercícios na Trilha (`practiceFade`).
  - Flip 3D no card por toque ou swipe horizontal + entrada em slide lateral.
- **Próximas explorações mapeadas no Board (`AN-01` a `AN-03`):**
  - **Mascote reativo com estados emocionais** (Lottie/Rive leve para combo 5x, encorajamento após erro, celebração de meta).
  - **Física contínua no gesto de swipe** (acompanhar o dedo em 60–120 FPS antes de soltar o card).
  - **Marcos de ofensiva (7/30/100 dias)** com chuva de confetes no `StreakModal`.
  - **Expansão animada da Rede Etimológica** ligando prefixos e palavras irmãs com linhas animadas.

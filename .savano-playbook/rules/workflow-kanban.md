# Fluxo de Trabalho — Estudo, Kanban & Commits

**Escopo:** Todos os repositórios do ecossistema Savano.

## Rule 3.0 — Fluxo de Desenvolvimento & Kanban

- **Rule 3.1 — Estudo Exploratório Antes de Codar:** Antes de implementar um módulo novo ou mudança complexa, registrar objetivo, hipóteses, restrições técnicas (APIs nativas, SO, rede/offline) e riscos em `docs/backlog-exploratorio.md`.
- **Rule 3.2 — Planejamento em Cartões Kanban:** Quebrar entregas em cartões pequenos, observáveis e testáveis em `docs/kanban.md` (`ID | Prioridade (P0/P1/P2) | Cartão | Critério de verificação`), dimensionados para 1 ou poucos commits.
- **Rule 3.3 — Commits Pequenos e Semânticos:** Usar prefixos convencionais (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`), mantendo cada commit focado em uma única mudança lógica. Nunca misturar refatoração ampla com feature nova.
- **Rule 3.4 — Higiene do Repositório:** Nunca commitar pastas geradas ou temporárias (`android/`, `ios/`, `build/`, `dist/`, `node_modules/`) sem necessidade explícita.
- **Rule 3.5 — Identidade Limpa:** Nunca citar marcas de concorrentes em código, comentários, testes, documentação ou histórico de commits.
- **Rule 3.6 — GitHub Actions & Supply Chain:** Definir `permissions: contents: read` por padrão nos workflows (elevando apenas no job necessário), nunca usar `pull_request_target` com código não confiável e preferir pinagem de actions de terceiros por commit SHA.

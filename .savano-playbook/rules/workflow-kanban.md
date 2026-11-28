# Fluxo de Trabalho — Estudo, Kanban & Commits

**Escopo:** Todos os repositórios do ecossistema Savano.

## Rule 3.0 — Fluxo de Desenvolvimento & Kanban

- **Rule 3.1 — Estudo Exploratório Antes de Codar:** Antes de implementar um módulo novo ou mudança complexa, registrar objetivo, hipóteses, restrições técnicas (APIs nativas, SO, rede/offline) e riscos em `docs/backlog-exploratorio.md`.
- **Rule 3.2 — Planejamento em Cartões Kanban:** Quebrar entregas em cartões pequenos, observáveis e testáveis em `docs/kanban.md` (`ID | Prioridade (P0/P1/P2) | Cartão | Critério de verificação`), dimensionados para 1 ou poucos commits.
- **Rule 3.3 — Commits Pequenos e Semânticos:** Usar prefixos convencionais (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`), mantendo cada commit focado em uma única mudança lógica. Nunca misturar refatoração ampla com feature nova.
- **Rule 3.4 — Higiene do Repositório:** Nunca commitar pastas geradas ou temporárias (`android/`, `ios/`, `build/`, `dist/`, `node_modules/`) sem necessidade explícita.
- **Rule 3.5 — Identidade Limpa:** Nunca citar marcas de concorrentes em código, comentários, testes, documentação ou histórico de commits.
- **Rule 3.6 — GitHub Actions & Supply Chain:** Definir `permissions: contents: read` por padrão nos workflows (elevando apenas no job necessário), nunca usar `pull_request_target` com código não confiável e preferir pinagem de actions de terceiros por commit SHA.
- **Rule 3.7 — Branches Curtas & Auto-Delete:** Não commitar alterações diretamente na `main`; desenvolver em branches dedicadas (`feat/...`, `fix/...`, `chore/...`), abrir PR e apagar a branch automaticamente no merge (`--delete-branch` / `delete_branch_on_merge`).
- **Rule 3.8 — Worktrees para Contextos Paralelos:** Incentivar o uso de `git worktree` para desenvolver múltiplos contextos ou cartões independentes em paralelo no mesmo repositório sem conflito de working tree.
- **Rule 3.9 — Padrão de PR (Template, Título & Assignee):** Todo PR deve seguir `.github/pull_request_template.md` (Descrição de produto + justificativas, Prints se houver, Evidência dos Testes, Impacto/Riscos quando aplicável), ter título semântico condizente com a entrega e obrigatoriamente definir `--assignee SAVANOo`.
- **Rule 3.10 — Sincronia Antes de Trabalhar:** Antes de iniciar alterações ou criar branch/worktree, verificar se o repositório local está atrás do remoto (`git fetch` / `git status -sb`) e executar `git pull` quando desatualizado (especialmente após auto-merges de sync).

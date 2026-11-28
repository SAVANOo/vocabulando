# Instruções do Repositório — Ecossistema Savano

Antes de planejar ou alterar código neste repositório, leia e siga as regras sincronizadas em:

- `.savano-playbook/rules/AGENTS.base.md` (`Rule 0.0` — Governança e índice)
- `.savano-playbook/rules/apk-updates-and-release.md` (`Rule 1.0` e `Rule 2.0` — Apps Android e Savano Store)
- `.savano-playbook/rules/workflow-kanban.md` (`Rule 3.0` — Estudo exploratório, Kanban, commits e CI)
- `.savano-playbook/rules/security-and-quality.md` (`Rule 4.0` e `Rule 5.0` — Segurança e Definition of Done)

## Guardrails & Arquivos Protegidos

- **Não editar manualmente** `.savano-playbook/` ou `.claude/skills/savano-*`: são gerenciados pelo sync automático de `SAVANOo/playbook` (`Rule 0.2`).
- **Monorepos:** regras específicas de subpacotes podem ficar em `AGENTS.md` aninhados (ex.: `apps/mobile/AGENTS.md`) sem duplicar as regras globais.
- **Documentação de trabalho:** manter `docs/backlog-exploratorio.md` (`Rule 3.1`) e `docs/kanban.md` (`Rule 3.2`) atualizados.

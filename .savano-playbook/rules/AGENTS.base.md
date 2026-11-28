# Regras Base de Engenharia — Ecossistema Savano

Este arquivo é o ponto de entrada das regras replicadas em `.savano-playbook/rules/` para todos os repositórios do ecossistema (`savano-store`, `vocabulando`, `savano-cine`).

## Rule 0.0 — Governança do Playbook & Replicação

- **Rule 0.1 — Fonte Única de Verdade:** Toda regra, restrição técnica ou processo recorrente descoberto durante o desenvolvimento de qualquer app (`savano-cine`, `vocabulando`, `savano-store`) deve ser trazido para o repositório `savano-playbook` e replicado para os demais repositórios.
- **Rule 0.2 — Propagação via Sync:** Repositórios consumidores não devem manter versões divergentes das regras globais. Alterações em `rules/`, `playbooks/`, `skills/` ou `sync-targets.json` na branch `main` do `savano-playbook` disparam PRs automáticos para todos os alvos via `.github/workflows/sync-playbook.yml`.
- **Rule 0.3 — Formato Conciso e Numerado:** Toda nova regra deve ser adicionada em um bloco de contexto (`Rule X.0`) com identificador específico (`Rule X.Y`), redação direta, objetiva e verificável.
- **Rule 0.4 — Onboarding de Novos Repositórios:** Todo novo repositório do ecossistema Savano deve ser cadastrado em `sync-targets.json`. O primeiro sync cria `.savano-playbook/`, `.claude/skills/savano-*`, `.agents/` e o `AGENTS.md` inicial (caso não exista), devendo o time criar `docs/backlog-exploratorio.md` e `docs/kanban.md` antes de iniciar o primeiro módulo (`Rule 3.1`–`Rule 3.2`).
- **Rule 0.5 — Automação Determinística & Economia de Tokens:** Preferir hooks determinísticos (`.agents/hooks.json`), skills sob demanda (`.agents/skills/` e `.claude/skills/`) e scripts de validação em vez de repetir instruções extensas no contexto.

## Índice dos Blocos de Regras

- `Rule 1.0` — APK Updates & Versionamento ([apk-updates-and-release.md](apk-updates-and-release.md))
- `Rule 2.0` — GitHub Releases (`gh`) & Catálogo Savano Store ([apk-updates-and-release.md](apk-updates-and-release.md))
- `Rule 3.0` — Fluxo de Trabalho, Kanban & Commits ([workflow-kanban.md](workflow-kanban.md))
- `Rule 4.0` — Segurança by Design & Privacidade ([security-and-quality.md](security-and-quality.md))
- `Rule 5.0` — Qualidade, Acessibilidade, UX Mobile & Definition of Done ([security-and-quality.md](security-and-quality.md))

# Instruções — `@vocabulando/api`

Estende o `AGENTS.md` da raiz. Regras globais permanecem em `../../.savano-playbook/rules/`.

## Comandos Rápidos
- `npm run dev:api` (na raiz) ou `node src/server.mjs` — Inicia API local
- `npm run typecheck` (na raiz) — Valida tipagem estrita (`strict: true`)
- `npm run test:unit` / `npm run smoke` (na raiz) — Valida endpoints e domínio em banco isolado

## Regras Específicas API
- **Validação & Segurança (`Rule 4.2`–`Rule 4.6`):** validar `params`, `query` e `body` com Zod estrito, usar consultas SQLite parametrizadas e nunca vazar stack traces nas respostas HTTP.

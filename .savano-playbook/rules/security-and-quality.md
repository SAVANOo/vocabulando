# Segurança, Qualidade & Definition of Done

**Escopo:** Todos os repositórios do ecossistema Savano.

## Rule 4.0 — Segurança by Design & Privacidade

- **Rule 4.1 — Zero Segredos no Repositório:** Nunca commitar `.env`, `keystore.properties`, `*.jks`, `*.keystore`, tokens ou credenciais.
- **Rule 4.2 — Validação Estrita de Entradas (Zod):** Validar todo `params`, `query`, `body`, evento offline e payload importado com schema Zod estrito, rejeitando campos desconhecidos.
- **Rule 4.3 — Hardening HTTP & Anti-SSRF:** Exigir `https://` em produção, CORS restritivo, headers defensivos (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, CSP), rate limiting com eviction e bloqueio de IPs privados/loopback em fetches externos.
- **Rule 4.4 — Integridade de Binários (Savano Store):** Validar `sha256`, `sizeBytes`, `packageArchiveInfo` e `signerSha256` antes de instalar qualquer APK.
- **Rule 4.5 — SQLite & Offline-First Seguro:** Usar apenas consultas parametrizadas (zero concatenação SQL), fila de sincronização idempotente com fallback silencioso offline e nunca exibir IDs internos crus (ex.: `palco_394`) na UI.
- **Rule 4.6 — Zero Vazamento de Erros:** Usar `SafeErrorBoundary` na raiz mobile/web e logger estruturado privado na API para nunca expor stack traces ou caminhos internos ao usuário.
- **Rule 4.7 — Privacidade & LGPD:** Garantir telemetria mínima consentida, exportação de dados e exclusão completa de conta.

## Rule 5.0 — Qualidade, UX & Definition of Done (DoD)

- **Rule 5.1 — Lint & Tipagem Limpos:** Manter 0 erros e 0 warnings no linter (`oxlint`) e typecheck limpo (`tsc --noEmit` com `strict: true`).
- **Rule 5.2 — Testes & Diagnóstico em Ambiente Isolado:** Executar testes unitários (`node --test`), `smoke`, `verify` e E2E (`test:e2e:isolated` / Playwright) em banco temporário isolado (`DB_PATH`), nunca tocando dados reais, sempre **após a última edição**. Scripts `doctor` devem operar estritamente em modo **somente leitura**.
- **Rule 5.3 — Verificação de Build Nativo:** Validar o build nativo (Kotlin/Gradle/Swift) sempre que houver alteração em código ou configuração nativa.
- **Rule 5.4 — Acessibilidade Web (WCAG AA):** Garantir contraste mínimo `4.5:1` auditado via `@axe-core/playwright`, labels semânticos e navegação por teclado.
- **Rule 5.5 — UX Mobile (Android/iOS):** Envolver formulários/modais com `KeyboardAvoidingView` + `ScrollView`, evitar `<Pressable>` envolvendo áreas roláveis e configurar TTS explicitamente para `pt-BR`.
- **Rule 5.6 — Critério de Conclusão:** Nenhum cartão de `docs/kanban.md` pode ser movido para concluído sem atender todas as regras aplicáveis de `Rule 5.1` a `Rule 5.5`.

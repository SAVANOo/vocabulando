# Segurança e Qualidade (Requisitos Inegociáveis)

Este documento define os padrões obrigatórios que **não podem ser relaxados** em nenhum cartão ou entrega do projeto.

---

## 1. Segurança by Design

1. **Zero Segredos no Repositório:**
   - Nenhuma chave de API (LLM, CDN, Push, OAuth) ou token pode ser commitado.
   - Usar `.env.example` documentado e validação de variáveis obrigatórias na inicialização (`doctor` / config schema).
2. **Validação Estrita de Entradas:**
   - Todo endpoint da API valida `params`, `query` e `body` com schemas estritos (ex: Zod), rejeitando campos desconhecidos e payloads malformados com `400`.
3. **Hardening HTTP e Rede:**
   - CORS restritivo por origem permitida.
   - Headers defensivos (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, CSP na Web).
   - Proteção contra SSRF caso o backend consuma URLs externas (bloqueio de IPs privados/loopback e redirecionamentos não autorizados).
   - *Rate Limiting* por IP e por `user_id`, com limites mais rígidos em autenticação e endpoints de IA.
4. **Autenticação e Sessão:**
   - Suporte a *Guest Auth* inicial sem fricção, com upgrade seguro para OAuth/E-mail.
   - Tokens armazenados apenas em `Keychain` (iOS) / `Keystore` (Android) / cookies `HttpOnly; Secure; SameSite=Lax` (Web).
5. **Zero Vazamento de Erros, Stack Traces ou Versões:**
   - Toda exceção na API cai no handler centralizado retornando mensagem genérica segura (`"Erro interno no servidor."` para `5xx`), gravando detalhes sanitizados apenas em log privado (`JSONL`).
   - Mobile (`apps/mobile`) e Web (`apps/web`) envolvem a árvore raiz em `SafeErrorBoundary` + handler global para nunca expor stack traces, caminhos internos ou versões de bibliotecas na interface.
6. **Privacidade e LGPD:**
   - Telemetria mínima e anônima, respeitando consentimento do usuário.
   - Textos livres enviados ao modo "Palavra no Contexto" (IA) não são armazenados para treino de modelos públicos.
   - Suporte nativo a exportação de dados e exclusão completa de conta.

---

## 2. Qualidade e Critérios de Aceite (Definition of Done)

Nenhum cartão em `docs/kanban.md` pode ser movido para **Concluído** sem cumprir todos os itens abaixo:

- [ ] **Lint limpo:** `0` erros e `0` warnings (`oxlint`).
- [ ] **Tipagem estrita:** `tsc` sem erros (`strict: true`, sem `any` injustificado).
- [ ] **Testes correspondentes:** toda regra de negócio nova possui teste unitário; toda rota nova possui checagem no `smoke`/`verify`.
- [ ] **Banco isolado nos testes:** testes de integração e E2E nunca rodam contra o banco de desenvolvimento/produção (usam arquivo temporário ou schema isolado via `VOCAB_DB_PATH`).
- [ ] **Acessibilidade:** contraste mínimo WCAG AA (4.5:1), suporte a leitores de tela (VoiceOver/TalkBack) e *Dynamic Type*.
- [ ] **Explicação Exaustiva:** commit e registro descrevem claramente o que mudou, por que mudou, riscos mitigados e como foi verificado.

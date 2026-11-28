---
name: savano-security-audit
description: Checklist de auditoria de segurança by design (Rule 4.0) do ecossistema Savano (zero segredos, Zod estrito, anti-SSRF, SHA-256 + signerSha256 e SafeErrorBoundary).
---

# Savano Security Audit Skill

- **Rule 4.1:** Confirmar ausência de segredos, `.env`, tokens ou keystores no working tree e histórico recente.
- **Rule 4.2–4.3:** Confirmar validação Zod estrita, `https://` obrigatório e bloqueio de IPs privados/loopback em fetches externos.
- **Rule 4.4:** Confirmar validação de integridade (`sha256`, `sizeBytes`, `packageArchiveInfo` e `signerSha256`) antes de instalar APKs.
- **Rule 4.5–4.6:** Confirmar SQL parametrizado e `SafeErrorBoundary` na raiz da UI sem vazamento de stack traces.

import test from "node:test";
import assert from "node:assert/strict";
import { WordEntrySchema } from "../../packages/domain/src/index.ts";
import { assertJwtConfig, signJwt, verifyJwt } from "../../apps/api/src/auth.mjs";
import { CURATED_WORDS } from "../../apps/api/src/lexicon.mjs";

test("JWT HS256: assina, valida, rejeita adulteração e rejeita expiração", () => {
  const token = signJwt({ sub: "usr_12345", kind: "guest", plan: "free" }, 300);
  const claims = verifyJwt(token);
  assert.ok(claims);
  assert.equal(claims.sub, "usr_12345");
  assert.equal(claims.kind, "guest");

  // Adultera assinatura
  const [h, b] = token.split(".");
  assert.equal(verifyJwt(`${h}.${b}.assinatura_falsa`), null);

  // Token expirado
  const expired = signJwt({ sub: "usr_12345", kind: "guest", plan: "free" }, -10);
  assert.equal(verifyJwt(expired), null);

  // Fail-fast em produção sem VOCAB_JWT_SECRET forte
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.VOCAB_JWT_SECRET;
  try {
    process.env.NODE_ENV = "production";
    process.env.VOCAB_JWT_SECRET = "curto";
    assert.throws(() => assertJwtConfig(), /VOCAB_JWT_SECRET/);
  } finally {
    process.env.NODE_ENV = prevEnv;
    if (prevSecret === undefined) delete process.env.VOCAB_JWT_SECRET;
    else process.env.VOCAB_JWT_SECRET = prevSecret;
  }
});

test("Léxico curado: 100% das palavras passam na validação estrita WordEntrySchema", () => {
  assert.ok(CURATED_WORDS.length >= 15);
  const langs = new Set();
  for (const entry of CURATED_WORDS) {
    const parsed = WordEntrySchema.safeParse(entry);
    assert.equal(
      parsed.success,
      true,
      `Falha ao validar palavra "${entry.id}": ${JSON.stringify(parsed.error?.flatten())}`,
    );
    langs.add(entry.languageCode);
  }
  assert.equal(langs.has("pt-BR"), true);
  assert.equal(langs.has("en-US"), true);
  assert.equal(langs.has("es-ES"), true);
});

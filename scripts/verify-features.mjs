import assert from "node:assert/strict";
import crypto from "node:crypto";

const BASE_URL = process.env.VOCAB_API_URL || "http://127.0.0.1:4180";

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, body };
}

// 1. Headers defensivos
const health = await api("/api/health");
assert.equal(health.status, 200);
assert.equal(health.headers.get("x-content-type-options"), "nosniff");
assert.equal(health.headers.get("x-frame-options"), "DENY");

// 2. Guest Auth (JWT Bearer) + Onboarding
const guest = await api("/api/auth/guest", { method: "POST" });
assert.equal(guest.status, 201);
const userId = guest.body.userId;
const token = guest.body.token;
assert.ok(typeof token === "string" && token.split(".").length === 3);
const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

const onboarding = await api("/api/me/onboarding", {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({
    goal: "carreira",
    tracks: ["comunicacao-executiva", "essencial-culto"],
    difficulty: "intermediario",
    notificationHour: 9,
    languageCode: "pt-BR",
  }),
});
assert.equal(onboarding.status, 200);

// 3. Feed PT-BR e EN-US (Multi-idioma ready)
const feedPt = await api("/api/feed?lang=pt-BR", { headers: authHeaders });
assert.equal(feedPt.status, 200);
assert.ok(feedPt.body.items.length >= 10);

const feedEn = await api("/api/feed?lang=en-US", { headers: authHeaders });
assert.equal(feedEn.status, 200);
assert.ok(feedEn.body.items.length >= 1);

// 4. Evento idempotente (envia 2x o mesmo UUID, só computa 1x)
const eventId = crypto.randomUUID();
const eventPayload = {
  eventId,
  type: "QUIZ_ANSWERED",
  wordId: "eloquencia",
  occurredAt: new Date().toISOString(),
  payload: { correct: false, responseTimeMs: 2100 },
};

const ev1 = await api("/api/events", {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify(eventPayload),
});
assert.equal(ev1.status, 200);
assert.equal(ev1.body.duplicate, false);
assert.equal(ev1.body.habit.totalXp, 5);

const ev2 = await api("/api/events", {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify(eventPayload),
});
assert.equal(ev2.status, 200);
assert.equal(ev2.body.duplicate, true);
assert.equal(ev2.body.habit.totalXp, 5);

// 5. IA Contextual (Cache semântico) + Avaliação Ativa + Refinador
const ctx1 = await api("/api/ai/context", {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({ wordId: "pragmatico", contextProfile: "corporativo" }),
});
assert.equal(ctx1.status, 200);
assert.equal(ctx1.body.cached, false);

const ctx2 = await api("/api/ai/context", {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({ wordId: "pragmatico", contextProfile: "corporativo" }),
});
assert.equal(ctx2.status, 200);
assert.equal(ctx2.body.cached, true);

const evalSentence = await api("/api/ai/evaluate-sentence", {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({
    wordId: "eloquencia",
    sentence: "Ela apresentou o projeto com muita eloquência na reunião de ontem.",
  }),
});
assert.equal(evalSentence.status, 200);
assert.equal(evalSentence.body.accepted, true);

const refined = await api("/api/ai/refine-text", {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({
    text: "Precisamos confirmar o acordo sem enrolação.",
    targetRegister: "executivo",
  }),
});
assert.equal(refined.status, 200);
assert.ok(refined.body.suggestions.length >= 2);

// 6. LGPD Export & Delete
const exported = await api("/api/me/export", { headers: authHeaders });
assert.equal(exported.status, 200);
assert.equal(exported.body.user.id, userId);

const deleted = await api("/api/me", { method: "DELETE", headers: authHeaders });
assert.equal(deleted.status, 200);
assert.equal(deleted.body.deleted, true);

const afterDelete = await api("/api/me", { headers: authHeaders });
assert.equal(afterDelete.status, 404);

console.log("Verify ponta a ponta concluído com sucesso.");

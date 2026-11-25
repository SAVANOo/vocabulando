import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { createApiServer } from "../../apps/api/src/server.mjs";

test("API + SQLite isolado: Guest, Coleções, SRS due e proteção contra payload inválido", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vocabulando-unit-"));
  const appLogPath = path.join(tmpDir, "api.log");
  const { server, db } = createApiServer({
    dbPath: path.join(tmpDir, "test.db"),
    errorLogPath: path.join(tmpDir, "err.log"),
    appLogPath,
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const guestRes = await fetch(`${baseUrl}/api/auth/guest`, { method: "POST" });
    assert.equal(guestRes.status, 201);
    const { token } = await guestRes.json();
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Cria coleção personalizada e salva palavra
    const colRes = await fetch(`${baseUrl}/api/collections`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: "Redação ENEM" }),
    });
    assert.equal(colRes.status, 201);
    const col = await colRes.json();

    const addWord = await fetch(`${baseUrl}/api/collections/${col.id}/words`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ wordId: "ratificar" }),
    });
    assert.equal(addWord.status, 200);

    // Payload inválido deve retornar 400
    const badOnboarding = await fetch(`${baseUrl}/api/me/onboarding`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ goal: "invalido" }),
    });
    assert.equal(badOnboarding.status, 400);

    // Quiz errado agenda SRS imediatamente
    const quizRes = await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        eventId: crypto.randomUUID(),
        type: "QUIZ_ANSWERED",
        wordId: "ratificar",
        occurredAt: "2020-01-01T10:00:00.000Z",
        payload: { correct: false },
      }),
    });
    assert.equal(quizRes.status, 200);

    const dueRes = await fetch(`${baseUrl}/api/srs/due`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.ok(dueRes.headers.get("x-request-id"));
    const dueData = await dueRes.json();
    assert.equal(dueData.due.length, 1);
    assert.equal(dueData.due[0].wordId, "ratificar");

    // Telemetria sanitizada de erro do cliente + log padronizado JSONL
    const telRes = await fetch(`${baseUrl}/api/telemetry/client-error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surface: "mobile", code: "UI_RENDER_FALLBACK" }),
    });
    assert.equal(telRes.status, 202);
    const logLines = fs.readFileSync(appLogPath, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    assert.ok(logLines.some((l) => l.event === "client_error_captured" && l.level === "warn" && l.requestId));

    // Validação de entrada na rota de dicionário público (< 2 chars retorna 400)
    const badDict = await fetch(`${baseUrl}/api/dictionary/lookup?word=a`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(badDict.status, 400);
  } finally {
    server.closeAllConnections?.();
    server.close();
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

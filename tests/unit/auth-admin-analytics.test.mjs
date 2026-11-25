import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApiServer } from "../../apps/api/src/server.mjs";

test("Auth (Register/Login scrypt), RBAC Admin (/api/admin/*) e Analytics tracking", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vocabulando-auth-admin-"));
  const { server, db } = createApiServer({
    dbPath: path.join(tmpDir, "test.db"),
    errorLogPath: path.join(tmpDir, "err.log"),
    appLogPath: path.join(tmpDir, "api.log"),
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Registro com senha
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "savio.teste@vocabulando.app",
        password: "MinhaSenhaForte123",
        displayName: "Sávio",
      }),
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    assert.ok(regData.token);
    assert.equal(regData.role, "user");

    // 2. Login com senha incorreta -> 401
    const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "savio.teste@vocabulando.app",
        password: "SenhaErrada999",
      }),
    });
    assert.equal(badLogin.status, 401);

    // 3. Login com senha correta -> 200
    const okLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "savio.teste@vocabulando.app",
        password: "MinhaSenhaForte123",
      }),
    });
    assert.equal(okLogin.status, 200);
    const loginData = await okLogin.json();
    assert.ok(loginData.token);

    // 4. Analytics tracking
    const trackRes = await fetch(`${baseUrl}/api/analytics/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${loginData.token}`,
      },
      body: JSON.stringify({
        eventName: "word_studied",
        durationMs: 3200,
        meta: { wordId: "perspicacia" },
      }),
    });
    assert.equal(trackRes.status, 202);

    // 5. Usuário comum recebe 403 no namespace /api/admin/*
    const userAdminStats = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    assert.equal(userAdminStats.status, 403);

    const userAdminLogs = await fetch(`${baseUrl}/api/admin/logs/errors`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    assert.equal(userAdminLogs.status, 403);

    // 6. Promove usuário a admin no DB e valida 200 nos endpoints admin
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(loginData.userId);
    const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "savio.teste@vocabulando.app",
        password: "MinhaSenhaForte123",
      }),
    });
    const adminData = await adminLogin.json();

    const adminStatsRes = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${adminData.token}` },
    });
    assert.equal(adminStatsRes.status, 200);
    const stats = await adminStatsRes.json();
    assert.ok(stats.usersCount >= 1);
    assert.ok(stats.analyticsCount >= 1);
    assert.equal(stats.lexiconWordsCount, 10000);
    assert.equal(stats.activitiesCount, 60000);

    const lexRes = await fetch(`${baseUrl}/api/lexicon/words?theme=cinema-arte&limit=10`);
    assert.equal(lexRes.status, 200);
    const lexData = await lexRes.json();
    assert.ok(lexData.total >= 300);
    assert.equal(lexData.activitiesTotal, 60000);
    assert.equal(lexData.items.length, 10);

    const packsRes = await fetch(`${baseUrl}/api/packs`);
    assert.equal(packsRes.status, 200);
    const manifest = await packsRes.json();
    assert.equal(manifest.totalWords, 10000);
    assert.ok(manifest.themes["ferias-praia"]);

    const actRes = await fetch(`${baseUrl}/api/activities?type=quiz&limit=10`);
    assert.equal(actRes.status, 200);
    const actData = await actRes.json();
    assert.equal(actData.total, 10000);

    const syncRes = await fetch(`${baseUrl}/api/me/sync`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    assert.equal(syncRes.status, 200);
    const syncData = await syncRes.json();
    assert.equal(typeof syncData.totalXp, "number");
    assert.ok(Array.isArray(syncData.savedIds));

    const adminLogsRes = await fetch(`${baseUrl}/api/admin/logs/errors`, {
      headers: { Authorization: `Bearer ${adminData.token}` },
    });
    assert.equal(adminLogsRes.status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

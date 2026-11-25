import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createApiServer } from "../apps/api/src/server.mjs";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vocabulando-pw-"));
const tmpDb = path.join(tmpDir, "pw.db");
const tmpLog = path.join(tmpDir, "pw-errors.log");

const { server, db } = createApiServer({
  dbPath: tmpDb,
  errorLogPath: tmpLog,
  appLogPath: path.join(tmpDir, "pw-api.log"),
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const apiPort = server.address().port;
const apiUrl = `http://127.0.0.1:${apiPort}`;

const webPort = 4185;
const webUrl = `http://127.0.0.1:${webPort}`;

const vite = spawn(
  "npx.cmd",
  ["vite", "preview", "--host", "127.0.0.1", "--port", String(webPort), "--strictPort"],
  {
    cwd: path.resolve("apps/web"),
    env: { ...process.env, VOCAB_API_URL: apiUrl },
    stdio: "inherit",
    shell: true,
  },
);

async function waitReady(url) {
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // aguarda servidor subir
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timeout aguardando ${url}`);
}

try {
  await waitReady(webUrl);
  const pw = spawn("npx.cmd", ["playwright", "test"], {
    env: { ...process.env, VOCAB_WEB_URL: webUrl },
    stdio: "inherit",
    shell: true,
  });
  const code = await new Promise((resolve) => pw.on("close", resolve));
  if (code !== 0) throw new Error(`Playwright falhou com código ${code}`);
  console.log("Playwright E2E no navegador concluído com sucesso (banco isolado).");
} finally {
  vite.kill();
  server.closeAllConnections?.();
  server.close();
  db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

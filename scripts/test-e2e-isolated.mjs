import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createApiServer } from "../apps/api/src/server.mjs";

function runScript(scriptPath, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], { env, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptPath} saiu com código ${code}`));
    });
  });
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vocabulando-e2e-"));
const tmpDb = path.join(tmpDir, "isolated.db");
const tmpLog = path.join(tmpDir, "api-errors.log");

const { server, db } = createApiServer({
  dbPath: tmpDb,
  errorLogPath: tmpLog,
  appLogPath: path.join(tmpDir, "api.log"),
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const port = typeof address === "object" && address ? address.port : 4180;
const baseUrl = `http://127.0.0.1:${port}`;

try {
  const env = { ...process.env, VOCAB_API_URL: baseUrl };
  await runScript("scripts/smoke.mjs", env);
  await runScript("scripts/verify-features.mjs", env);
  console.log(`E2E isolado concluído com sucesso usando banco temporário: ${tmpDb}`);
} finally {
  server.closeAllConnections?.();
  server.close();
  db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

const BASE_URL = process.env.VOCAB_API_URL || "http://127.0.0.1:4180";

async function check(name, path, expectedStatus = 200) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (res.status !== expectedStatus) {
    throw new Error(`[SMOKE FALHOU] ${name}: esperado ${expectedStatus}, recebeu ${res.status}`);
  }
  console.log(`[OK] ${name} (${res.status})`);
}

await check("Healthcheck", "/api/health", 200);
await check("Widget 14-day preview", "/api/widget/preview?lang=pt-BR", 200);
await check("Bloqueio sem JWT Bearer", "/api/me", 401);
console.log("Smoke test concluído com sucesso.");

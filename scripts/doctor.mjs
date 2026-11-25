import fs from "node:fs";
import path from "node:path";

const MIN_NODE_MAJOR = 22;
let hasWarning = false;
let hasBlockingError = false;

function ok(label, detail) {
  console.log(`[OK]    ${label}: ${detail}`);
}

function warn(label, detail) {
  hasWarning = true;
  console.warn(`[AVISO] ${label}: ${detail}`);
}

function fail(label, detail) {
  hasBlockingError = true;
  console.error(`[ERRO]  ${label}: ${detail}`);
}

const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
if (nodeMajor >= MIN_NODE_MAJOR) {
  ok("Node.js", `v${process.versions.node}`);
} else {
  fail("Node.js", `v${process.versions.node} (requer >= v${MIN_NODE_MAJOR})`);
}

try {
  await import("node:sqlite");
  ok("SQLite Nativo", "node:sqlite disponível");
} catch {
  fail("SQLite Nativo", "módulo node:sqlite indisponível neste runtime");
}

const requiredDirs = ["packages/domain", "apps/api", "apps/web", "apps/mobile", "docs"];
for (const dir of requiredDirs) {
  if (fs.existsSync(path.resolve(dir))) {
    ok("Estrutura", `${dir} presente`);
  } else {
    warn("Estrutura", `${dir} ainda não criado`);
  }
}

if (process.env.VOCAB_LLM_API_KEY) {
  ok("IA Contextual", "VOCAB_LLM_API_KEY configurada");
} else {
  warn("IA Contextual", "VOCAB_LLM_API_KEY ausente — usando gerador determinístico local de fallback");
}

if (process.env.ANDROID_HOME && fs.existsSync(process.env.ANDROID_HOME)) {
  ok("Android SDK", `ANDROID_HOME=${process.env.ANDROID_HOME}`);
} else {
  warn("Android SDK", "ANDROID_HOME ausente — necessário apenas para compilar APK/AndroidX localmente (veja docs/operacao.md)");
}

if (hasBlockingError) {
  process.exit(2);
}
if (hasWarning) {
  process.exit(1);
}
process.exit(0);

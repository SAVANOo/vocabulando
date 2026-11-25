import fs from "node:fs";
import path from "node:path";
import { redactSensitiveText } from "../../../packages/domain/src/index.ts";

export function createLogger(options = {}) {
  const service = options.service ?? "vocabulando-api";
  const errorLogPath = options.errorLogPath ?? path.resolve("data/logs/api-errors.log");
  const appLogPath = options.appLogPath ?? path.resolve("data/logs/api.log");

  function writeJsonl(filePath, entry) {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`, "utf8");
    } catch {
      // Nunca derruba a aplicação por falha de escrita em disco
    }
  }

  function formatEntry(level, event, fields = {}) {
    const safeMessage =
      typeof fields.message === "string" ? redactSensitiveText(fields.message) : undefined;
    return {
      ts: new Date().toISOString(),
      level,
      service,
      event,
      ...fields,
      ...(safeMessage !== undefined ? { message: safeMessage } : {}),
    };
  }

  return {
    info(event, fields = {}) {
      const entry = formatEntry("info", event, fields);
      writeJsonl(appLogPath, entry);
      return entry;
    },
    warn(event, fields = {}) {
      const entry = formatEntry("warn", event, fields);
      writeJsonl(appLogPath, entry);
      return entry;
    },
    error(event, err, fields = {}) {
      const rawMessage = err instanceof Error ? err.message : String(err ?? "unknown_error");
      const entry = formatEntry("error", event, {
        ...fields,
        message: rawMessage,
      });
      writeJsonl(errorLogPath, entry);
      writeJsonl(appLogPath, entry);
      return entry;
    },
  };
}

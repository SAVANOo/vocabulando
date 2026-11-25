/**
 * Sanitiza entradas de texto livre enviadas para recursos de IA,
 * removendo caracteres de controle e mitigando tentativas óbvias de prompt injection.
 */
export function sanitizePromptInput(raw: string, maxLength = 280): string {
  let withoutControlChars = "";
  for (const ch of raw) {
    const code = ch.charCodeAt(0);
    withoutControlChars += code < 32 || code === 127 ? " " : ch;
  }
  const normalized = withoutControlChars.replace(/\s+/g, " ").trim();
  const neutralizedDelimiters = normalized.replace(/```|"""|<\/?system>|<\/?user>/gi, " ");
  return neutralizedDelimiters.slice(0, maxLength).trim();
}

/**
 * Valida URLs externas permitidas (somente HTTPS público, bloqueando hosts locais/privados).
 */
export function isSafeExternalHttpsUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;

  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    return false;
  }
  return true;
}

/**
 * Mascara possíveis tokens/chaves em logs estruturados.
 */
export function redactSensitiveText(text: string): string {
  return text
    .replace(/(bearer\s+)[a-zA-Z0-9._-]+/gi, "$1[REDACTED]")
    .replace(/(sk-|AIza)[a-zA-Z0-9_-]{10,}/g, "[REDACTED_KEY]");
}

import crypto from "node:crypto";

const DEV_EPHEMERAL_SECRET = crypto.randomBytes(32).toString("hex");

export function assertJwtConfig() {
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.VOCAB_JWT_SECRET || "";
    if (secret.length < 32) {
      throw new Error(
        "VOCAB_JWT_SECRET obrigatório com no mínimo 32 caracteres em NODE_ENV=production.",
      );
    }
  }
}

function getJwtSecret() {
  assertJwtConfig();
  return process.env.VOCAB_JWT_SECRET || DEV_EPHEMERAL_SECRET;
}

function base64UrlEncode(input) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input) {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function signJwt(payload, ttlSeconds = 60 * 60 * 24 * 7) {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(
    JSON.stringify({
      ...payload,
      iat: nowSec,
      exp: nowSec + ttlSeconds,
    }),
  );
  const data = `${header}.${body}`;
  const sig = crypto.createHmac("sha256", getJwtSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyJwt(token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, sig] = parts;
  if (!header || !body || !sig) return null;

  const expectedSig = crypto
    .createHmac("sha256", getJwtSecret())
    .update(`${header}.${body}`)
    .digest();

  let actualSig;
  try {
    actualSig = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }

  if (actualSig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(actualSig, expectedSig)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(body));
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof parsed.exp !== "number" || parsed.exp <= nowSec) return null;
    if (typeof parsed.sub !== "string" || !parsed.sub.startsWith("usr_")) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password, storedHash) {
  if (typeof storedHash !== "string" || !storedHash.includes(":")) return false;
  const [salt, hexHash] = storedHash.split(":");
  if (!salt || !hexHash) return false;
  try {
    const actual = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hexHash, "hex");
    if (actual.length !== expected.length) return false;
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

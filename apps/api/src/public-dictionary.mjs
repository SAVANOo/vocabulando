import { isSafeExternalHttpsUrl, sanitizePromptInput } from "../../../packages/domain/src/index.ts";

const LANG_SHORT = {
  "pt-BR": "pt",
  "en-US": "en",
  "es-ES": "es",
};

function stripHtmlTags(raw) {
  return String(raw ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJsonWithTimeout(url, headers = {}) {
  if (!isSafeExternalHttpsUrl(url)) return null;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Vocabulando/0.1 (EdTech Dictionary Lookup)",
        Accept: "application/json",
        ...headers,
      },
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function lookupPublicDictionary(db, rawWord, languageCode = "pt-BR") {
  const cleanWord = sanitizePromptInput(rawWord, 60).toLowerCase();
  if (cleanWord.length < 2) {
    return null;
  }

  const shortLang = LANG_SHORT[languageCode] ?? "pt";
  const cacheKey = `dict:${shortLang}:${cleanWord}`;
  const cached = db.prepare(`SELECT response_json FROM ai_cache WHERE cache_key = ?`).get(cacheKey);
  if (cached) {
    return { ...JSON.parse(cached.response_json), cached: true };
  }

  const encoded = encodeURIComponent(cleanWord);
  const freeDictUrl = `https://freedictionaryapi.com/api/v1/entries/${shortLang}/${encoded}`;
  const freeData = await fetchJsonWithTimeout(freeDictUrl);

  let definitions = [];
  let synonyms = [];
  let phoneticIpa = "";
  let partOfSpeech = "";
  let etymology = "";
  let source = "";

  if (freeData && Array.isArray(freeData.entries) && freeData.entries.length > 0) {
    const first = freeData.entries[0];
    partOfSpeech = typeof first.partOfSpeech === "string" ? first.partOfSpeech : "";
    if (Array.isArray(first.pronunciations) && first.pronunciations[0]?.text) {
      phoneticIpa = String(first.pronunciations[0].text);
    }
    if (Array.isArray(first.senses)) {
      definitions = first.senses
        .map((s) => (typeof s.definition === "string" ? s.definition.trim() : ""))
        .filter(Boolean)
        .slice(0, 4);
      synonyms = first.senses
        .flatMap((s) => (Array.isArray(s.synonyms) ? s.synonyms : []))
        .filter((x) => typeof x === "string")
        .slice(0, 6);
    }
    source = "freedictionaryapi";
  }

  // Para português, complementa etimologia/definição via Dicionário-Aberto quando disponível
  if (shortLang === "pt" && (definitions.length === 0 || !etymology)) {
    const daUrl = `https://api.dicionario-aberto.net/word/${encoded}`;
    const daData = await fetchJsonWithTimeout(daUrl);
    if (Array.isArray(daData) && daData.length > 0) {
      const xmlOrDef = daData[0]?.xml ?? "";
      const defMatch = xmlOrDef.match(/<def>([\s\S]*?)<\/def>/i);
      const etymMatch = xmlOrDef.match(/<etym[^>]*>([\s\S]*?)<\/etym>/i);
      if (definitions.length === 0 && defMatch?.[1]) {
        definitions = [stripHtmlTags(defMatch[1])].filter(Boolean);
      }
      if (etymMatch?.[1]) {
        etymology = stripHtmlTags(etymMatch[1]);
      }
      source = source ? `${source}+dicionario-aberto` : "dicionario-aberto";
    }
  }

  const result = {
    word: cleanWord,
    languageCode,
    phoneticIpa,
    partOfSpeech,
    definitions,
    synonyms,
    etymology,
    source: source || "not-found",
    found: definitions.length > 0,
  };

  if (result.found) {
    db.prepare(
      `INSERT OR REPLACE INTO ai_cache (cache_key, response_json, created_at) VALUES (?, ?, ?)`,
    ).run(cacheKey, JSON.stringify(result), new Date().toISOString());
  }

  return { ...result, cached: false };
}

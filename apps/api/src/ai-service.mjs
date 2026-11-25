import { isSafeExternalHttpsUrl, sanitizePromptInput } from "../../../packages/domain/src/index.ts";

const CONTEXT_TEMPLATES = {
  corporativo: (word) =>
    `Na reunião de alinhamento com a diretoria, o uso de "${word.word}" destacou a maturidade da proposta.`,
  academico: (word) =>
    `No artigo científico, o conceito associado a "${word.word}" sustenta a hipótese central com precisão.`,
  literario: (word) =>
    `Sob a luz do entardecer, a narrativa ganhou um tom marcado por "${word.word}".`,
  cotidiano: (word) =>
    `Mesmo em uma conversa informal de café, aplicar "${word.word}" no momento certo deixa a ideia mais clara.`,
};

async function callOptionalLlm(promptText) {
  const apiKey = process.env.VOCAB_LLM_API_KEY;
  if (!apiKey) return null;

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  if (!isSafeExternalHttpsUrl(endpoint)) return null;

  try {
    const res = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(4500),
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { maxOutputTokens: 120, temperature: 0.4 },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" && text.trim().length > 5 ? text.trim() : null;
  } catch {
    return null;
  }
}

export async function generateContextualExample(db, wordEntry, contextProfile) {
  const cacheKey = `ctx:${wordEntry.id}:${contextProfile}`;
  const cached = db.prepare(`SELECT response_json FROM ai_cache WHERE cache_key = ?`).get(cacheKey);
  if (cached) {
    return { ...JSON.parse(cached.response_json), cached: true };
  }

  const llmText = await callOptionalLlm(
    `Crie uma única frase curta e natural em ${wordEntry.languageCode} usando a palavra "${wordEntry.word}" (${wordEntry.shortDefinition}) no contexto ${contextProfile}.`,
  );

  const example =
    llmText ?? CONTEXT_TEMPLATES[contextProfile]?.(wordEntry) ?? wordEntry.exampleSentence;
  const result = {
    wordId: wordEntry.id,
    contextProfile,
    generatedExample: example,
    tip: `Registro recomendado: ${wordEntry.register}. ${wordEntry.shortDefinition}`,
    source: llmText ? "llm" : "deterministic-fallback",
  };

  db.prepare(
    `INSERT OR REPLACE INTO ai_cache (cache_key, response_json, created_at) VALUES (?, ?, ?)`,
  ).run(cacheKey, JSON.stringify(result), new Date().toISOString());

  return { ...result, cached: false };
}

export function evaluateActiveSentence(wordEntry, rawSentence) {
  const safeSentence = sanitizePromptInput(rawSentence, 280);
  const normalizedSentence = safeSentence.toLowerCase();
  const stem = wordEntry.word.toLowerCase().slice(0, Math.max(4, wordEntry.word.length - 2));
  const usesWord = normalizedSentence.includes(stem);
  const hasGoodLength = safeSentence.split(/\s+/).length >= 5;

  if (!usesWord) {
    return {
      accepted: false,
      score: 40,
      sanitizedSentence: safeSentence,
      feedback: `Tente incluir a palavra "${wordEntry.word}" diretamente na sua frase para fixar o uso ativo.`,
    };
  }

  if (!hasGoodLength) {
    return {
      accepted: true,
      score: 75,
      sanitizedSentence: safeSentence,
      feedback: `Boa! Você usou "${wordEntry.word}", mas expandir a frase com mais contexto ajuda ainda mais na memorização.`,
    };
  }

  return {
    accepted: true,
    score: 95,
    sanitizedSentence: safeSentence,
    feedback: `Excelente aplicação de "${wordEntry.word}" (${wordEntry.register}) em contexto completo! +25 XP.`,
  };
}

const SIMPLE_REFINEMENTS = [
  {
    pattern: /\bmuito bom\b/gi,
    original: "muito bom",
    suggestion: "exemplar / notável",
    note: "Mais preciso em comunicação executiva.",
  },
  {
    pattern: /\bconfirmar\b/gi,
    original: "confirmar",
    suggestion: "ratificar",
    note: "Indicado para acordos, decisões e atas formais.",
  },
  {
    pattern: /\bmuito rápido\b/gi,
    original: "muito rápido",
    suggestion: "efêmero / célere",
    note: "Use 'efêmero' para duração curta e 'célere' para velocidade de execução.",
  },
  {
    pattern: /\benrolação\b/gi,
    original: "enrolação",
    suggestion: "prolixidade",
    note: "Substitui gíria crítica por termo culto e objetivo.",
  },
  {
    pattern: /\bcorrigir\b/gi,
    original: "corrigir",
    suggestion: "retificar",
    note: "Formaliza correções em documentos e comunicados.",
  },
];

export function refineTextSuggestions(rawText, targetRegister) {
  const safeText = sanitizePromptInput(rawText, 2000);
  const suggestions = [];
  let refinedPreview = safeText;

  for (const rule of SIMPLE_REFINEMENTS) {
    if (rule.pattern.test(safeText)) {
      const primaryReplacement = rule.suggestion.split(" / ")[0];
      refinedPreview = refinedPreview.replace(rule.pattern, primaryReplacement);
      suggestions.push({
        original: rule.original,
        suggestion: rule.suggestion,
        register: targetRegister,
        note: rule.note,
      });
    }
  }

  return {
    targetRegister,
    originalLength: safeText.length,
    suggestions,
    refinedPreview,
  };
}

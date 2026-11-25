function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Gera frase com lacuna (_______) para Quiz, casando inclusive flexões
 * de gênero/número (ex: "pragmático" -> "pragmática", "ubíquo" -> "ubíquos").
 */
export function buildQuizBlank(
  sentence: string,
  targetWord: string,
  fallbackDefinition?: string,
): { prompt: string; matchedInSentence: boolean } {
  const exactRegex = new RegExp(`\\b${escapeRegex(targetWord)}\\b`, "i");
  if (exactRegex.test(sentence)) {
    return { prompt: sentence.replace(exactRegex, "_______"), matchedInSentence: true };
  }

  // Tenta casar pelo radical (mínimo 4 caracteres) tolerando flexões e acentos
  const cleanTarget = stripAccents(targetWord.toLowerCase());
  const stemLen = Math.max(4, cleanTarget.length - 2);
  const stem = cleanTarget.slice(0, stemLen);

  const tokens = sentence.split(/(\s+|[.,;:!?()"“”]+)/);
  let replaced = false;
  const out = tokens.map((tok) => {
    if (replaced) return tok;
    const cleanTok = stripAccents(tok.toLowerCase());
    if (cleanTok.length >= stemLen && cleanTok.startsWith(stem)) {
      replaced = true;
      return "_______";
    }
    return tok;
  });

  if (replaced) {
    return { prompt: out.join(""), matchedInSentence: true };
  }

  return {
    prompt: fallbackDefinition
      ? `Qual palavra corresponde a: "${fallbackDefinition}"?`
      : `Escolha a palavra adequada: "${sentence}"`,
    matchedInSentence: false,
  };
}

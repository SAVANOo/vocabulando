import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { Readable } from "node:stream";
import zlib from "node:zlib";
import { MOBILE_LEXICON } from "../apps/mobile/src/data/mobileLexicon.ts";

const TARGET_WORDS = 10000;

const TRACKS = [
  { id: "essencial-culto", label: "Essencial Culto" },
  { id: "comunicacao-executiva", label: "Comunicação Executiva" },
  { id: "redacao-argumentacao", label: "Redação & Argumentação" },
  { id: "literario-poetico", label: "Literário & Poético" },
  { id: "paronimos", label: "Parônimos & Precisão" },
];

const POS_MAP = {
  noun: "substantivo",
  adj: "adjetivo",
  verb: "verbo",
  adv: "advérbio",
};

const THEME_RULES = [
  {
    id: "cinema-arte",
    label: "Cinema & Arte",
    keywords: ["filme", "cinema", "teatro", "arte", "música", "pintura", "cena", "ator", "obra", "poema", "romance", "roteiro"],
  },
  {
    id: "escola-estudo",
    label: "Escola & Estudo",
    keywords: ["escola", "estudo", "ciência", "matemática", "livro", "aula", "aluno", "professor", "pesquisa", "teoria", "prova", "ensino"],
  },
  {
    id: "ferias-praia",
    label: "Férias & Praia",
    keywords: ["praia", "mar", "viagem", "férias", "sol", "ilha", "barco", "areia", "montanha", "passeio", "turismo", "hotel"],
  },
  {
    id: "trabalho-negocios",
    label: "Trabalho & Negócios",
    keywords: ["empresa", "trabalho", "negócio", "contrato", "reunião", "lucro", "gestão", "cargo", "projeto", "comércio", "indústria"],
  },
  {
    id: "tecnologia-digital",
    label: "Tecnologia & Digital",
    keywords: ["computador", "rede", "sistema", "digital", "dados", "programa", "máquina", "eletrôn", "internet", "código", "técnica"],
  },
  {
    id: "saude-bem-estar",
    label: "Saúde & Bem-estar",
    keywords: ["saúde", "corpo", "doença", "remédio", "mente", "médico", "sono", "energia", "músculo", "respir", "aliment"],
  },
  {
    id: "gastronomia-casa",
    label: "Gastronomia & Casa",
    keywords: ["comida", "cozinha", "sabor", "prato", "bebida", "fruta", "casa", "mesa", "tempero", "pão", "café", "doce"],
  },
];

function normalizeId(word) {
  return word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function detectTheme(defText, word) {
  const hay = `${word} ${defText}`.toLowerCase();
  for (const rule of THEME_RULES) {
    if (rule.keywords.some((kw) => hay.includes(kw))) {
      return { id: rule.id, label: rule.label };
    }
  }
  return { id: "geral", label: "Uso Geral" };
}

function classifyTrack(pos, defText, themeId, idx) {
  if (themeId === "trabalho-negocios") return TRACKS[1];
  if (themeId === "escola-estudo") return TRACKS[2];
  if (themeId === "cinema-arte") return TRACKS[3];
  if (defText.toLowerCase().includes("sinônimo") || (pos === "verbo" && idx % 6 === 0)) {
    return TRACKS[4];
  }
  return TRACKS[idx % TRACKS.length];
}

function classifyDifficulty(word, defText) {
  if (word.length >= 11 || defText.length >= 95) return "erudito";
  if (word.length >= 8) return "avancado";
  return "intermediario";
}

function buildThemeExample(word, pos, themeId) {
  const byTheme = {
    "cinema-arte": {
      verb: `A crítica destacou como o diretor soube ${word} a cena final do filme.`,
      adj: `O roteiro trouxe um olhar ${word} que surpreendeu o público no cinema.`,
      default: `Na resenha do filme, o conceito de ${word} deu profundidade à análise.`,
    },
    "escola-estudo": {
      verb: `Durante a aula de revisão, o professor pediu para ${word} o argumento principal.`,
      adj: `A aluna apresentou um resumo ${word} antes da prova final.`,
      default: `No trabalho escolar, compreender ${word} ajudou a resolver a questão.`,
    },
    "ferias-praia": {
      verb: `Nas férias na praia, decidimos ${word} o roteiro com calma ao pôr do sol.`,
      adj: `O passeio pela costa teve um clima ${word} e inesquecível.`,
      default: `Durante a viagem de férias, a lembrança de ${word} marcou o fim de tarde na praia.`,
    },
    "trabalho-negocios": {
      verb: `Na reunião de alinhamento, precisamos ${word} as prioridades do trimestre.`,
      adj: `O relatório entregou um diagnóstico ${word} para a diretoria.`,
      default: `No ambiente corporativo, o domínio de ${word} evita ruídos na comunicação.`,
    },
    "tecnologia-digital": {
      verb: `A atualização do sistema permitiu ${word} o fluxo de dados com segurança.`,
      adj: `A equipe desenhou uma arquitetura ${word} para suportar novos acessos.`,
      default: `No projeto digital, aplicar ${word} reduziu falhas na operação.`,
    },
    "saude-bem-estar": {
      verb: `Especialistas recomendam ${word} a rotina para manter o equilíbrio físico.`,
      adj: `Uma prática ${word} melhora a disposição ao longo da semana.`,
      default: `Cuidar do bem-estar envolve atenção constante a ${word} no dia a dia.`,
    },
    "gastronomia-casa": {
      verb: `Na receita de família, o segredo é ${word} os ingredientes lentamente.`,
      adj: `O jantar trouxe um aroma ${word} que reuniu todos à mesa.`,
      default: `Na cozinha de casa, o cuidado com ${word} transforma o preparo.`,
    },
    geral: {
      verb: `Em uma conversa clara, vale saber ${word} com naturalidade e precisão.`,
      adj: `O comentário trouxe um ponto de vista ${word} sobre o assunto.`,
      default: `O uso consciente de ${word} torna a expressão mais precisa no cotidiano.`,
    },
  };
  const bucket = byTheme[themeId] ?? byTheme.geral;
  if (pos === "verbo") return bucket.verb;
  if (pos === "adjetivo") return bucket.adj;
  return bucket.default;
}

function isCleanPortugueseGloss(gloss) {
  if (!gloss || gloss.length < 12 || gloss.length > 220) return false;
  const lower = gloss.toLowerCase();
  const rejectedStarts = [
    "flexão de",
    "plural de",
    "feminino de",
    "masculino de",
    "aumentativo de",
    "diminutivo de",
    "forma alternativa",
    "variante de",
    "grafia antiga",
    "ortografia anterior",
    "alternative form",
    "plural of",
    "feminine of",
    "inflection of",
    "second-person",
    "third-person",
    "first-person",
    "past participle",
  ];
  if (rejectedStarts.some((prefix) => lower.startsWith(prefix))) return false;
  // Rejeita explicações puramente em inglês
  if (/\b(the|and|with|from|which|that|used|spelling|verb|noun)\b/i.test(lower)) return false;
  return true;
}

async function main() {
  const wordsMap = new Map();

  for (const item of MOBILE_LEXICON) {
    const theme = detectTheme(item.definition, item.word);
    wordsMap.set(item.word.toLowerCase(), {
      id: item.id,
      word: item.word,
      ipa: item.ipa,
      pos: item.pos,
      category: item.category,
      categoryLabel: item.categoryLabel,
      theme: theme.id,
      themeLabel: theme.label,
      difficulty: item.difficulty,
      definition: item.definition,
      example: item.example,
      hasRealExample: true,
      etymology: item.etymology,
      roots: item.roots,
      synonyms: item.synonyms.map((s) => s.word),
    });
  }

  console.log(`Streaming Wikcionário PT (meta: ${TARGET_WORDS} palavras em PT-BR)...`);
  const res = await fetch("https://kaikki.org/ptwiktionary/raw-wiktextract-data.jsonl.gz");
  if (!res.ok || !res.body) {
    throw new Error(`Falha ao baixar ptwiktionary: ${res.status}`);
  }

  const gunzip = zlib.createGunzip();
  const webStream = Readable.fromWeb(res.body);
  webStream.pipe(gunzip);

  const rl = readline.createInterface({
    input: gunzip,
    crlfDelay: Infinity,
  });

  let scanned = 0;
  let realExamplesCount = MOBILE_LEXICON.length;
  let withSynonymsCount = MOBILE_LEXICON.length;

  for await (const line of rl) {
    if (wordsMap.size >= TARGET_WORDS) break;
    scanned += 1;
    if (!line.trim()) continue;

    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    if (entry.lang_code !== "pt") continue;
    const rawWord = typeof entry.word === "string" ? entry.word.trim() : "";
    const lowerWord = rawWord.toLowerCase();
    if (!/^[a-záàâãéêíóôõúç]{4,18}$/.test(lowerWord)) continue;
    if (wordsMap.has(lowerWord)) continue;

    const posKey = entry.pos;
    if (!POS_MAP[posKey]) continue;

    const senses = Array.isArray(entry.senses) ? entry.senses : [];
    let gloss = "";
    let example = "";
    const synonyms = [];

    for (const s of senses) {
      const tags = Array.isArray(s.tags) ? s.tags : [];
      if (tags.includes("form-of") || tags.includes("alt-of") || tags.includes("obsolete") || tags.includes("archaic")) {
        continue;
      }
      if (!gloss && Array.isArray(s.glosses) && typeof s.glosses[0] === "string") {
        const candidate = s.glosses[0].trim();
        if (isCleanPortugueseGloss(candidate)) {
          gloss = candidate;
        }
      }
      if (!example && Array.isArray(s.examples)) {
        const ex = s.examples.find(
          (e) =>
            typeof e?.text === "string" &&
            e.text.length >= 16 &&
            e.text.length <= 180 &&
            !/\b(the|with|from)\b/i.test(e.text),
        );
        if (ex) example = ex.text.trim();
      }
      if (Array.isArray(s.synonyms)) {
        for (const syn of s.synonyms) {
          if (
            typeof syn?.word === "string" &&
            /^[a-záàâãéêíóôõúç]{3,20}$/i.test(syn.word) &&
            synonyms.length < 4
          ) {
            synonyms.push(syn.word.toLowerCase());
          }
        }
      }
    }

    if (!gloss) continue;

    let ipa = "";
    if (Array.isArray(entry.sounds)) {
      const ipaObj = entry.sounds.find((snd) => typeof snd?.ipa === "string");
      if (ipaObj) ipa = ipaObj.ipa;
    }

    const posLabel = POS_MAP[posKey];
    const theme = detectTheme(gloss, lowerWord);
    const track = classifyTrack(posLabel, gloss, theme.id, wordsMap.size);
    const difficulty = classifyDifficulty(lowerWord, gloss);
    const id = `${normalizeId(lowerWord)}_${wordsMap.size}`;
    const hasRealExample = Boolean(example);
    if (hasRealExample) realExamplesCount += 1;
    if (synonyms.length > 0) withSynonymsCount += 1;

    wordsMap.set(lowerWord, {
      id,
      word: lowerWord,
      ipa: ipa || `/${lowerWord}/`,
      pos: posLabel,
      category: track.id,
      categoryLabel: track.label,
      theme: theme.id,
      themeLabel: theme.label,
      difficulty,
      definition: gloss,
      example: example || buildThemeExample(lowerWord, posLabel, theme.id),
      hasRealExample,
      etymology:
        typeof entry.etymology_text === "string" && entry.etymology_text.trim().length > 0
          ? entry.etymology_text.trim().slice(0, 180)
          : "Uso consolidado na língua portuguesa.",
      roots: [],
      synonyms,
    });
  }

  rl.close();
  webStream.destroy();

  const words = Array.from(wordsMap.values()).slice(0, TARGET_WORDS);
  const packsDir = path.resolve("data/packs");
  fs.mkdirSync(packsDir, { recursive: true });

  // Divide em pacotes temáticos + núcleo inicial (1.000 palavras) para escalar sem JSON gigante no Mobile
  const coreWords = words.slice(0, 1000);
  fs.writeFileSync(path.join(packsDir, "core.json"), JSON.stringify(coreWords), "utf8");
  fs.writeFileSync(path.resolve("apps/mobile/assets/lexicon-core.json"), JSON.stringify(coreWords), "utf8");

  const byTheme = {};
  for (const w of words) {
    if (!byTheme[w.theme]) byTheme[w.theme] = [];
    byTheme[w.theme].push(w);
  }
  const themeManifest = {};
  for (const [themeId, list] of Object.entries(byTheme)) {
    fs.writeFileSync(path.join(packsDir, `theme-${themeId}.json`), JSON.stringify(list), "utf8");
    themeManifest[themeId] = {
      label: list[0]?.themeLabel ?? themeId,
      count: list.length,
    };
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: "pt.wiktionary.org (kaikki/ptwiktionary)",
    totalWords: words.length,
    coreWordsCount: coreWords.length,
    withRealExample: realExamplesCount,
    withSynonyms: withSynonymsCount,
    themes: themeManifest,
  };
  fs.writeFileSync(path.resolve("data/lexicon-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  console.log(JSON.stringify({ scannedLines: scanned, ...manifest }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { Readable } from "node:stream";
import { MOBILE_LEXICON } from "../apps/mobile/src/data/mobileLexicon.ts";

const TARGET_WORDS = 5000;
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

function normalizeId(word) {
  return word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function classifyTrack(word, pos, defText, idx) {
  const lower = defText.toLowerCase();
  if (lower.includes("gestão") || lower.includes("empresa") || lower.includes("negócio") || lower.includes("acordo")) {
    return TRACKS[1];
  }
  if (lower.includes("argument") || lower.includes("discurso") || lower.includes("texto") || lower.includes("razão")) {
    return TRACKS[2];
  }
  if (lower.includes("poesia") || lower.includes("literár") || lower.includes("belo") || lower.includes("alma")) {
    return TRACKS[3];
  }
  if (pos === "verbo" && idx % 5 === 4) {
    return TRACKS[4];
  }
  return TRACKS[idx % TRACKS.length];
}

function classifyDifficulty(word, defText) {
  if (word.length >= 11 || defText.length >= 90) return "erudito";
  if (word.length >= 8) return "avancado";
  return "intermediario";
}

function buildFallbackExample(word, pos) {
  if (pos === "verbo") {
    return `É fundamental saber ${word} com clareza em qualquer exposição.`;
  }
  if (pos === "adjetivo") {
    return `O parecer apresentou um ponto de vista ${word} sobre o tema.`;
  }
  if (pos === "advérbio") {
    return `A equipe conduziu a apresentação ${word} até a conclusão.`;
  }
  return `O emprego preciso de ${word} enriquece a comunicação escrita e oral.`;
}

async function main() {
  const wordsMap = new Map();

  for (const item of MOBILE_LEXICON) {
    wordsMap.set(item.word.toLowerCase(), {
      id: item.id,
      word: item.word,
      ipa: item.ipa,
      pos: item.pos,
      category: item.category,
      categoryLabel: item.categoryLabel,
      difficulty: item.difficulty,
      definition: item.definition,
      example: item.example,
      etymology: item.etymology,
      roots: item.roots,
      synonyms: item.synonyms.map((s) => s.word),
    });
  }

  console.log(`Iniciando streaming do dicionário Kaikki PT (meta: ${TARGET_WORDS} palavras)...`);
  const res = await fetch("https://kaikki.org/dictionary/Portuguese/kaikki.org-dictionary-Portuguese.jsonl");
  if (!res.ok || !res.body) {
    throw new Error(`Falha ao baixar Kaikki PT: ${res.status}`);
  }

  const rl = readline.createInterface({
    input: Readable.fromWeb(res.body),
    crlfDelay: Infinity,
  });

  let scanned = 0;
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
      if (!gloss && Array.isArray(s.glosses) && typeof s.glosses[0] === "string") {
        const candidate = s.glosses[0].trim();
        if (
          candidate.length >= 14 &&
          candidate.length <= 220 &&
          !candidate.toLowerCase().startsWith("inflection of") &&
          !candidate.toLowerCase().startsWith("feminine ") &&
          !candidate.toLowerCase().startsWith("plural of")
        ) {
          gloss = candidate;
        }
      }
      if (!example && Array.isArray(s.examples)) {
        const ex = s.examples.find((e) => typeof e?.text === "string" && e.text.length >= 15 && e.text.length <= 180);
        if (ex) example = ex.text.trim();
      }
      if (Array.isArray(s.synonyms)) {
        for (const syn of s.synonyms) {
          if (typeof syn?.word === "string" && /^[a-záàâãéêíóôõúç]{3,20}$/i.test(syn.word) && synonyms.length < 3) {
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
    const track = classifyTrack(lowerWord, posLabel, gloss, wordsMap.size);
    const difficulty = classifyDifficulty(lowerWord, gloss);
    const id = `${normalizeId(lowerWord)}_${wordsMap.size}`;

    wordsMap.set(lowerWord, {
      id,
      word: lowerWord,
      ipa: ipa || `/${lowerWord}/`,
      pos: posLabel,
      category: track.id,
      categoryLabel: track.label,
      difficulty,
      definition: gloss,
      example: example || buildFallbackExample(lowerWord, posLabel),
      etymology: typeof entry.etymology_text === "string" ? entry.etymology_text.slice(0, 180) : "Uso consolidado na língua portuguesa.",
      roots: [],
      synonyms,
    });
  }

  rl.close();
  const words = Array.from(wordsMap.values()).slice(0, TARGET_WORDS);
  const outDir = path.resolve("data");
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPayload = JSON.stringify(words);
  fs.writeFileSync(path.join(outDir, "lexicon-5000.json"), jsonPayload, "utf8");
  fs.writeFileSync(path.resolve("apps/mobile/assets/lexicon-5000.json"), jsonPayload, "utf8");

  console.log(
    JSON.stringify({
      scannedLines: scanned,
      totalWords: words.length,
      totalActivitiesPerWord: 6,
      totalActivities: words.length * 6,
      bytes: Buffer.byteLength(jsonPayload, "utf8"),
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

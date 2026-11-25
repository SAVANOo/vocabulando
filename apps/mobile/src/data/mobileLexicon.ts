import type { DifficultyLevel, RegisterLevel, TrackCategory } from "@vocabulando/domain";

export interface MobileWordEntry {
  id: string;
  word: string;
  ipa: string;
  pos: string;
  category: TrackCategory;
  categoryLabel: string;
  theme?: string;
  themeLabel?: string;
  register: RegisterLevel;
  registerScore: number;
  difficulty: DifficultyLevel;
  definition: string;
  example: string;
  etymology: string;
  roots: Array<{ part: string; meaning: string; related: string[] }>;
  synonyms: Array<{ word: string; register: RegisterLevel; note: string }>;
  paronym?: { other: string; diff: string };
}

export const MOBILE_LEXICON: MobileWordEntry[] = [
  // === ESSENCIAL CULTO (4) ===
  {
    id: "perspicacia",
    word: "perspicácia",
    ipa: "/peʁs.piˈka.sjɐ/",
    pos: "substantivo feminino",
    category: "essencial-culto",
    categoryLabel: "Essencial Culto",
    register: "executivo",
    registerScore: 4,
    difficulty: "avancado",
    definition: "Agudeza de espírito para perceber nuances, intenções ou detalhes que outros ignoram.",
    example: "Com grande perspicácia, ela identificou o gargalo da operação em minutos.",
    etymology: "Latim perspicax: per- (através) + specere (olhar).",
    roots: [
      { part: "per-", meaning: "através de", related: ["perceber", "percorrer"] },
      { part: "spic-", meaning: "olhar, observar", related: ["perspectiva", "espectro"] },
    ],
    synonyms: [
      { word: "sagacidade", register: "erudito", note: "Inteligência prática rápida." },
      { word: "astúcia", register: "neutro", note: "Habilidade estratégica." },
      { word: "lucidez", register: "executivo", note: "Clareza de análise." },
    ],
  },
  {
    id: "resiliencia",
    word: "resiliência",
    ipa: "/ʁe.zi.liˈẽ.sjɐ/",
    pos: "substantivo feminino",
    category: "essencial-culto",
    categoryLabel: "Essencial Culto",
    register: "neutro",
    registerScore: 3,
    difficulty: "intermediario",
    definition: "Capacidade de absorver choques ou adversidades e se recompor sem perder a essência.",
    example: "A resiliência da equipe garantiu a entrega mesmo após a mudança de escopo.",
    etymology: "Latim resilire: re- (para trás) + salire (saltar, recuar).",
    roots: [
      { part: "re-", meaning: "retorno", related: ["retornar", "recompor"] },
      { part: "sal-/sil-", meaning: "saltar", related: ["salto", "sobressaltar"] },
    ],
    synonyms: [
      { word: "adaptabilidade", register: "executivo", note: "Flexibilidade diante de mudanças." },
      { word: "firmeza", register: "neutro", note: "Estabilidade emocional." },
    ],
  },
  {
    id: "ubicuo",
    word: "ubíquo",
    ipa: "/uˈbi.kwu/",
    pos: "adjetivo",
    category: "essencial-culto",
    categoryLabel: "Essencial Culto",
    register: "erudito",
    registerScore: 5,
    difficulty: "erudito",
    definition: "Que parece estar presente em todos os lugares ao mesmo tempo; onipresente.",
    example: "Os algoritmos de recomendação tornaram-se ubíquos na experiência digital.",
    etymology: "Latim ubique (em toda parte).",
    roots: [{ part: "ubi-", meaning: "em que lugar", related: ["ubiquidade"] }],
    synonyms: [
      { word: "onipresente", register: "neutro", note: "Mais acessível e direto." },
    ],
  },
  {
    id: "magnanimo",
    word: "magnânimo",
    ipa: "/maɡˈnɐ.ni.mu/",
    pos: "adjetivo",
    category: "essencial-culto",
    categoryLabel: "Essencial Culto",
    register: "erudito",
    registerScore: 4,
    difficulty: "avancado",
    definition: "Generoso, nobre de espírito; quem perdoa e age com grandeza mesmo diante de ofensas.",
    example: "Foi magnânimo ao reconhecer o mérito do adversário após o debate.",
    etymology: "Latim magnus (grande) + animus (alma, espírito).",
    roots: [
      { part: "magn-", meaning: "grande", related: ["magnitude", "magnífico"] },
      { part: "anim-", meaning: "alma, mente", related: ["ânimo", "unânime"] },
    ],
    synonyms: [
      { word: "generoso", register: "neutro", note: "Uso cotidiano comum." },
      { word: "benevolente", register: "executivo", note: "Foco em boa vontade." },
    ],
  },

  // === COMUNICAÇÃO EXECUTIVA (4) ===
  {
    id: "eloquencia",
    word: "eloquência",
    ipa: "/e.loˈkwẽ.sjɐ/",
    pos: "substantivo feminino",
    category: "comunicacao-executiva",
    categoryLabel: "Comunicação Executiva",
    register: "executivo",
    registerScore: 4,
    difficulty: "avancado",
    definition: "Capacidade de se expressar com fluência, clareza e poder de persuasão, sem soar artificial.",
    example: "A diretora defendeu o orçamento com tanta eloquência que convenceu os céticos.",
    etymology: "Latim eloquentia: ex- (para fora) + loqui (falar).",
    roots: [
      { part: "e- (ex-)", meaning: "para fora", related: ["expor", "emergir"] },
      { part: "loqu-", meaning: "falar, discursar", related: ["loquaz", "colóquio", "interlocutor"] },
    ],
    synonyms: [
      { word: "oratória", register: "erudito", note: "Arte de falar em público." },
      { word: "retórica", register: "executivo", note: "Técnica estruturada de argumentação." },
      { word: "desenvoltura", register: "neutro", note: "Naturalidade e firmeza ao se comunicar." },
    ],
  },
  {
    id: "pragmatico",
    word: "pragmático",
    ipa: "/pɾaɡˈma.tʃi.ku/",
    pos: "adjetivo",
    category: "comunicacao-executiva",
    categoryLabel: "Comunicação Executiva",
    register: "executivo",
    registerScore: 3,
    difficulty: "intermediario",
    definition: "Orientado por resultados práticos e utilidade real, em vez de teorias abstratas.",
    example: "Precisamos de uma abordagem pragmática para entregar o MVP ainda neste trimestre.",
    etymology: "Grego pragmatikós: pragma (ação, feito).",
    roots: [{ part: "pragma-", meaning: "ação, prática", related: ["pragmatismo", "práxis"] }],
    synonyms: [
      { word: "objetivo", register: "neutro", note: "Direto ao ponto, cotidiano." },
      { word: "realista", register: "neutro", note: "Focado no que é factível." },
      { word: "funcional", register: "executivo", note: "Voltado à utilidade concreta." },
    ],
  },
  {
    id: "concisao",
    word: "concisão",
    ipa: "/kõ.siˈzɐ̃w̃/",
    pos: "substantivo feminino",
    category: "comunicacao-executiva",
    categoryLabel: "Comunicação Executiva",
    register: "executivo",
    registerScore: 4,
    difficulty: "avancado",
    definition: "Qualidade de expressar muito conteúdo com poucas palavras, sem perder clareza.",
    example: "O relatório ganhou elogios pela concisão dos dados apresentados.",
    etymology: "Latim concisio: com- + caedere (cortar o excesso).",
    roots: [{ part: "cis-", meaning: "cortar", related: ["decisão", "precisão", "incisão"] }],
    synonyms: [
      { word: "síntese", register: "executivo", note: "Resumo estruturado de ideias." },
      { word: "brevidade", register: "neutro", note: "Foca na curta duração." },
    ],
  },
  {
    id: "sinergia",
    word: "sinergia",
    ipa: "/si.neʁˈʒi.ɐ/",
    pos: "substantivo feminino",
    category: "comunicacao-executiva",
    categoryLabel: "Comunicação Executiva",
    register: "executivo",
    registerScore: 3,
    difficulty: "intermediario",
    definition: "Cooperação entre duas ou mais partes cujo resultado supera a soma dos esforços isolados.",
    example: "Houve forte sinergia entre design e engenharia desde o primeiro protótipo.",
    etymology: "Grego synergía: syn- (junto) + ergon (trabalho).",
    roots: [
      { part: "syn-", meaning: "junto, com", related: ["sintonia", "síntese"] },
      { part: "erg-", meaning: "trabalho, energia", related: ["energia", "ergonomia"] },
    ],
    synonyms: [
      { word: "integração", register: "neutro", note: "Atuação coordenada." },
      { word: "convergência", register: "executivo", note: "Alinhamento de direção." },
    ],
  },

  // === REDAÇÃO & ARGUMENTAÇÃO (4) ===
  {
    id: "prolixidade",
    word: "prolixidade",
    ipa: "/pɾo.li.ksiˈda.dʒi/",
    pos: "substantivo feminino",
    category: "redacao-argumentacao",
    categoryLabel: "Redação & Argumentação",
    register: "executivo",
    registerScore: 4,
    difficulty: "avancado",
    definition: "Excesso de palavras ao falar ou escrever, tornando o discurso cansativo e disperso.",
    example: "A síntese executiva perdeu força por causa da prolixidade dos primeiros parágrafos.",
    etymology: "Latim prolixus (estendido em demasia).",
    roots: [
      { part: "pro-", meaning: "para frente, em extensão", related: ["prolongar", "prorrogar"] },
      { part: "lix-", meaning: "fluir", related: ["prolixo"] },
    ],
    synonyms: [
      { word: "verborragia", register: "erudito", note: "Crítica forte a fala vazia." },
      { word: "redundância", register: "executivo", note: "Repetição desnecessária." },
    ],
  },
  {
    id: "tacito",
    word: "tácito",
    ipa: "/ˈta.si.tu/",
    pos: "adjetivo",
    category: "redacao-argumentacao",
    categoryLabel: "Redação & Argumentação",
    register: "executivo",
    registerScore: 4,
    difficulty: "avancado",
    definition: "Que não é expresso por palavras, mas fica subentendido ou implicitamente aceito.",
    example: "Houve um acordo tácito entre os sócios para priorizar estabilidade.",
    etymology: "Latim tacitus (silencioso), de tacere (calar).",
    roots: [{ part: "tac-", meaning: "calar", related: ["taciturno"] }],
    synonyms: [
      { word: "implícito", register: "neutro", note: "Subentendido no contexto." },
      { word: "velado", register: "literario", note: "Disfarçado ou encoberto." },
    ],
  },
  {
    id: "inexoravel",
    word: "inexorável",
    ipa: "/i.ne.zoˈɾa.vew/",
    pos: "adjetivo",
    category: "redacao-argumentacao",
    categoryLabel: "Redação & Argumentação",
    register: "erudito",
    registerScore: 5,
    difficulty: "erudito",
    definition: "Que não cede a pedidos ou súplicas; implacável, inevitável, impossível de deter.",
    example: "A transição digital tornou-se um movimento inexorável na indústria.",
    etymology: "Latim inexorabilis: in- (não) + exorare (mover por súplica).",
    roots: [
      { part: "in-", meaning: "negação", related: ["inevitável", "inabalável"] },
      { part: "or-", meaning: "falar, rogar", related: ["oratória", "oração"] },
    ],
    synonyms: [
      { word: "inevitável", register: "neutro", note: "Impossível de evitar." },
      { word: "implacável", register: "neutro", note: "Foca na rigidez." },
    ],
  },
  {
    id: "corroborar",
    word: "corroborar",
    ipa: "/ko.ʁo.boˈɾaʁ/",
    pos: "verbo transitivo",
    category: "redacao-argumentacao",
    categoryLabel: "Redação & Argumentação",
    register: "executivo",
    registerScore: 4,
    difficulty: "avancado",
    definition: "Dar maior força ou comprovação a um argumento, teoria ou depoimento.",
    example: "Os novos dados de retenção vieram corroborar a hipótese inicial do produto.",
    etymology: "Latim corroborare: com- + robur (força, carvalho).",
    roots: [{ part: "robor-", meaning: "força, vigor", related: ["robusto", "corroboração"] }],
    synonyms: [
      { word: "confirmar", register: "neutro", note: "Uso cotidiano direto." },
      { word: "comprovar", register: "neutro", note: "Demonstrar com provas." },
    ],
  },

  // === LITERÁRIO & POÉTICO (4) ===
  {
    id: "efemero",
    word: "efêmero",
    ipa: "/eˈfe.me.ɾu/",
    pos: "adjetivo",
    category: "literario-poetico",
    categoryLabel: "Literário & Poético",
    register: "literario",
    registerScore: 4,
    difficulty: "avancado",
    definition: "Que dura muito pouco tempo; passageiro, transitório, breve como um único dia.",
    example: "O sucesso viral nas redes costuma ser efêmero quando não há consistência.",
    etymology: "Grego ephémeros: epi- (sobre) + hemera (dia).",
    roots: [
      { part: "ef- (epi-)", meaning: "sobre, durante", related: ["epílogo", "epitáfio"] },
      { part: "hemer-", meaning: "dia", related: ["hemeroteca"] },
    ],
    synonyms: [
      { word: "fugaz", register: "literario", note: "Algo que escapa depressa." },
      { word: "passageiro", register: "neutro", note: "Uso comum direto." },
    ],
  },
  {
    id: "serendipidade",
    word: "serendipidade",
    ipa: "/se.ɾẽ.dʒi.piˈda.dʒi/",
    pos: "substantivo feminino",
    category: "literario-poetico",
    categoryLabel: "Literário & Poético",
    register: "literario",
    registerScore: 5,
    difficulty: "erudito",
    definition: "Descoberta feliz e valiosa feita por acaso, enquanto se procurava outra coisa.",
    example: "Aquele encontro na livraria foi pura serendipidade e mudou a pesquisa.",
    etymology: "Cunhada por Horace Walpole (1754) do conto persa Os Três Príncipes de Serendip.",
    roots: [{ part: "Serendip", meaning: "antigo nome persa do Sri Lanka", related: ["serendípico"] }],
    synonyms: [
      { word: "acaso feliz", register: "neutro", note: "Expressão descritiva direta." },
      { word: "achado fortuito", register: "erudito", note: "Encontro inesperado." },
    ],
  },
  {
    id: "candura",
    word: "candura",
    ipa: "/kɐ̃ˈdu.ɾɐ/",
    pos: "substantivo feminino",
    category: "literario-poetico",
    categoryLabel: "Literário & Poético",
    register: "literario",
    registerScore: 4,
    difficulty: "avancado",
    definition: "Pureza de intenções, inocência, sinceridade serena e desarmada.",
    example: "Respondeu às críticas ácidas com tanta candura que desarmou o auditório.",
    etymology: "Latim candor (brancura brilhante, sinceridade).",
    roots: [{ part: "cand-", meaning: "brilhar, ser puro", related: ["cândido", "incandescente"] }],
    synonyms: [
      { word: "franqueza", register: "neutro", note: "Sinceridade direta." },
      { word: "singeleza", register: "literario", note: "Simplicidade encantadora." },
    ],
  },
  {
    id: "melancolia",
    word: "melancolia",
    ipa: "/me.lɐ̃.koˈli.ɐ/",
    pos: "substantivo feminino",
    category: "literario-poetico",
    categoryLabel: "Literário & Poético",
    register: "literario",
    registerScore: 3,
    difficulty: "intermediario",
    definition: "Tristeza vaga, serena e contemplativa, frequentemente ligada à saudade ou reflexão.",
    example: "O entardecer de domingo trouxe uma doce melancolia à varanda.",
    etymology: "Grego melankholía: mélas (negro) + kholé (bile).",
    roots: [{ part: "melan-", meaning: "escuro, profundo", related: ["melanina"] }],
    synonyms: [
      { word: "nostalgia", register: "neutro", note: "Saudade idealizada do passado." },
      { word: "banzo", register: "literario", note: "Nostalgia profunda na cultura lusófona." },
    ],
  },

  // === PARÔNIMOS (4) ===
  {
    id: "ratificar",
    word: "ratificar",
    ipa: "/ʁa.tʃi.fiˈkaʁ/",
    pos: "verbo transitivo",
    category: "paronimos",
    categoryLabel: "Parônimos",
    register: "executivo",
    registerScore: 4,
    difficulty: "avancado",
    definition: "Confirmar formalmente algo que já foi dito, assinado ou decidido anteriormente.",
    example: "O conselho se reuniu hoje apenas para ratificar o acordo firmado na semana passada.",
    etymology: "Latim ratus (confirmado) + facere (fazer).",
    roots: [
      { part: "rati-", meaning: "validado", related: ["ratificação"] },
      { part: "-ficar", meaning: "tornar, fazer", related: ["retificar", "clarificar"] },
    ],
    synonyms: [
      { word: "confirmar", register: "neutro", note: "Uso cotidiano sem peso jurídico." },
      { word: "validar", register: "executivo", note: "Atestar conformidade." },
    ],
    paronym: {
      other: "retificar",
      diff: "Ratificar = confirmar; Retificar = corrigir um erro.",
    },
  },
  {
    id: "retificar",
    word: "retificar",
    ipa: "/ʁe.tʃi.fiˈkaʁ/",
    pos: "verbo transitivo",
    category: "paronimos",
    categoryLabel: "Parônimos",
    register: "executivo",
    registerScore: 4,
    difficulty: "avancado",
    definition: "Corrigir um erro, alinhar ou tornar exato algo que estava equivocado.",
    example: "A equipe precisou retificar a nota técnica antes da publicação oficial.",
    etymology: "Latim rectus (reto, correto) + facere (fazer).",
    roots: [{ part: "reti-", meaning: "reto, correto", related: ["retidão", "correto"] }],
    synonyms: [
      { word: "corrigir", register: "neutro", note: "Uso comum direto." },
      { word: "emendar", register: "neutro", note: "Ajustar falhas em texto." },
    ],
    paronym: {
      other: "ratificar",
      diff: "Retificar = corrigir; Ratificar = confirmar formalmente.",
    },
  },
  {
    id: "iminente",
    word: "iminente",
    ipa: "/i.miˈnẽ.tʃi/",
    pos: "adjetivo",
    category: "paronimos",
    categoryLabel: "Parônimos",
    register: "neutro",
    registerScore: 3,
    difficulty: "intermediario",
    definition: "Que está prestes a acontecer a qualquer momento; muito próximo no tempo.",
    example: "Os alertas meteorológicos indicavam uma tempestade iminente na serra.",
    etymology: "Latim imminens: in- (sobre) + minere (projetar-se).",
    roots: [{ part: "min-", meaning: "projetar-se", related: ["eminente", "proeminente"] }],
    synonyms: [
      { word: "imediato", register: "neutro", note: "Sem demora." },
      { word: "prestes", register: "neutro", note: "Na iminência de ocorrer." },
    ],
    paronym: {
      other: "eminente",
      diff: "Iminente = prestes a ocorrer; Eminente = ilustre, notável.",
    },
  },
  {
    id: "eminente",
    word: "eminente",
    ipa: "/e.miˈnẽ.tʃi/",
    pos: "adjetivo",
    category: "paronimos",
    categoryLabel: "Parônimos",
    register: "erudito",
    registerScore: 5,
    difficulty: "erudito",
    definition: "Que se destaca pela excelência, prestígio ou elevação intelectual; ilustre.",
    example: "A conferência contou com a presença de uma eminente linguista brasileira.",
    etymology: "Latim eminens: e- (para fora) + minere (elevar-se).",
    roots: [{ part: "min-", meaning: "elevar-se", related: ["proeminente", "iminente"] }],
    synonyms: [
      { word: "ilustre", register: "erudito", note: "Prestígio reconhecido." },
      { word: "notável", register: "neutro", note: "Digno de destaque." },
    ],
    paronym: {
      other: "iminente",
      diff: "Eminente = ilustre, elevado; Iminente = prestes a acontecer.",
    },
  },
];

export interface SynonymRound {
  id: string;
  targetWord: string;
  targetDefinition: string;
  correctSynonym: string;
  nuanceHint: string;
  options: string[];
}

export const SYNONYM_ROUNDS: SynonymRound[] = [
  {
    id: "syn-1",
    targetWord: "eloquência",
    targetDefinition: "Expressar-se com fluência e poder de persuasão.",
    correctSynonym: "oratória",
    nuanceHint: "Oratória refere-se à arte de falar com persuasão em público.",
    options: ["prolixidade", "oratória", "candura", "apatia"],
  },
  {
    id: "syn-2",
    targetWord: "efêmero",
    targetDefinition: "Que dura muito pouco tempo; passageiro.",
    correctSynonym: "fugaz",
    nuanceHint: "Fugaz traduz algo breve que escapa rapidamente.",
    options: ["perene", "fugaz", "inexorável", "tácito"],
  },
  {
    id: "syn-3",
    targetWord: "ratificar",
    targetDefinition: "Confirmar formalmente uma decisão ou acordo.",
    correctSynonym: "confirmar",
    nuanceHint: "Ratificar significa confirmar; retificar significa corrigir!",
    options: ["retificar", "confirmar", "divergir", "omitir"],
  },
  {
    id: "syn-4",
    targetWord: "perspicácia",
    targetDefinition: "Agudeza para perceber nuances e detalhes ocultos.",
    correctSynonym: "sagacidade",
    nuanceHint: "Sagacidade combina rapidez mental e leitura precisa da situação.",
    options: ["sagacidade", "prolixidade", "ingenuidade", "letargia"],
  },
  {
    id: "syn-5",
    targetWord: "pragmático",
    targetDefinition: "Orientado por resultados práticos e utilidade real.",
    correctSynonym: "objetivo",
    nuanceHint: "Objetivo foca no resultado concreto sem rodeios teóricos.",
    options: ["utópico", "abstrato", "objetivo", "errático"],
  },
  {
    id: "syn-6",
    targetWord: "concisão",
    targetDefinition: "Expressar muito conteúdo com poucas palavras.",
    correctSynonym: "síntese",
    nuanceHint: "Síntese resume o essencial mantendo a precisão.",
    options: ["prolixidade", "síntese", "verborragia", "dispersão"],
  },
  {
    id: "syn-7",
    targetWord: "tácito",
    targetDefinition: "Subentendido sem precisar ser dito explicitamente.",
    correctSynonym: "implícito",
    nuanceHint: "Implícito indica algo contido nas entrelinhas ou no contexto.",
    options: ["explícito", "implícito", "notório", "público"],
  },
  {
    id: "syn-8",
    targetWord: "eminente",
    targetDefinition: "Que se destaca pelo prestígio ou excelência intelectual.",
    correctSynonym: "ilustre",
    nuanceHint: "Eminente significa ilustre; iminente é o que está prestes a ocorrer.",
    options: ["iminente", "ilustre", "comum", "efêmero"],
  },
];

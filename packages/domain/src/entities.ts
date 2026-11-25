import { z } from "zod";

export const LanguageCodeSchema = z.enum(["pt-BR", "en-US", "es-ES"]);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;

export const RegisterLevelSchema = z.enum([
  "coloquial",
  "neutro",
  "executivo",
  "literario",
  "erudito",
]);
export type RegisterLevel = z.infer<typeof RegisterLevelSchema>;

export const TrackCategorySchema = z.enum([
  "essencial-culto",
  "comunicacao-executiva",
  "redacao-argumentacao",
  "literario-poetico",
  "paronimos",
]);
export type TrackCategory = z.infer<typeof TrackCategorySchema>;

export const DifficultyLevelSchema = z.enum(["intermediario", "avancado", "erudito"]);
export type DifficultyLevel = z.infer<typeof DifficultyLevelSchema>;

export const EtymologyPartSchema = z.object({
  part: z.string().min(1).max(60),
  kind: z.enum(["prefixo", "raiz", "sufixo", "origem"]),
  meaning: z.string().min(1).max(160),
  originLanguage: z.string().min(1).max(60),
  relatedWords: z.array(z.string().min(1).max(60)).max(8).default([]),
});
export type EtymologyPart = z.infer<typeof EtymologyPartSchema>;

export const SynonymNuanceSchema = z.object({
  word: z.string().min(1).max(60),
  register: RegisterLevelSchema,
  tone: z.enum(["positivo", "neutro", "critico"]),
  nuanceNote: z.string().min(1).max(200),
});
export type SynonymNuance = z.infer<typeof SynonymNuanceSchema>;

export const WordEntrySchema = z.object({
  id: z.string().min(1).max(80),
  languageCode: LanguageCodeSchema.default("pt-BR"),
  word: z.string().min(1).max(80),
  phoneticIpa: z.string().min(1).max(120),
  partOfSpeech: z.string().min(1).max(40),
  category: TrackCategorySchema,
  difficulty: DifficultyLevelSchema,
  register: RegisterLevelSchema,
  shortDefinition: z.string().min(5).max(280),
  exampleSentence: z.string().min(5).max(320),
  etymologySummary: z.string().min(3).max(240),
  etymologyParts: z.array(EtymologyPartSchema).min(1).max(6),
  synonyms: z.array(SynonymNuanceSchema).max(6).default([]),
  paronymPair: z
    .object({
      confusableWith: z.string().min(1).max(80),
      differenceNote: z.string().min(5).max(240),
    })
    .optional(),
  audioUrl: z.string().url().optional(),
});
export type WordEntry = z.infer<typeof WordEntrySchema>;

export const UserEventTypeSchema = z.enum([
  "WORD_VIEWED",
  "WORD_SAVED",
  "WORD_UNSAVED",
  "QUIZ_ANSWERED",
  "ACTIVE_SENTENCE_SUBMITTED",
]);
export type UserEventType = z.infer<typeof UserEventTypeSchema>;

export const UserEventSchema = z.object({
  eventId: z.string().uuid(),
  type: UserEventTypeSchema,
  wordId: z.string().min(1).max(80),
  occurredAt: z.string().datetime(),
  payload: z
    .object({
      correct: z.boolean().optional(),
      responseTimeMs: z.number().int().min(0).max(600_000).optional(),
      dwellTimeMs: z.number().int().min(0).max(600_000).optional(),
      collectionId: z.string().min(1).max(80).optional(),
    })
    .strict()
    .default({}),
});
export type UserEvent = z.infer<typeof UserEventSchema>;

export const OnboardingPreferencesSchema = z.object({
  goal: z.enum(["carreira", "redacao", "cultura", "oratoria"]),
  tracks: z.array(TrackCategorySchema).min(1).max(5),
  difficulty: DifficultyLevelSchema,
  notificationHour: z.number().int().min(6).max(22),
  languageCode: LanguageCodeSchema.default("pt-BR"),
});
export type OnboardingPreferences = z.infer<typeof OnboardingPreferencesSchema>;

export const CollectionCreateSchema = z.object({
  name: z.string().trim().min(2).max(50),
});

export const ContextPromptRequestSchema = z.object({
  wordId: z.string().min(1).max(80),
  contextProfile: z.enum(["corporativo", "academico", "literario", "cotidiano"]),
});

export const ActiveSentenceRequestSchema = z.object({
  wordId: z.string().min(1).max(80),
  sentence: z.string().trim().min(6).max(280),
});

export const TextRefineRequestSchema = z.object({
  text: z.string().trim().min(10).max(2000),
  targetRegister: RegisterLevelSchema.default("executivo"),
});
